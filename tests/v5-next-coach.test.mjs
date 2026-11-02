// Coast Camp's first-player guide (build 51c; docs/V5_FIRST_PLAYER_GUIDE_2026-11-02.md), as rules: a new
// camp's guide, followed step by step on the real starting board (nothing laid on the board, no coins
// given), reaches the first restoration through tap, merge, the first crew order's coins, the gold
// order's materials and the build; steps already done are skipped; it never points at something the
// board cannot give; a reload resumes; camps that have played do not get it; skipping ends it.
import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,load,act,tick,orderItems,totalBuilt,source,item} from '../v5/next/game.mjs';
import {coachStep,coachActive,laterTip,nextRareUse,COACH_ON,COACH_DONE,FIRST_PLACE} from '../v5/next/coach.mjs';
import {TASKS} from '../v5/next/areas.mjs';

const ok=(s,a,now)=>{const r=act(s,a,now);assert.ok(r.ok,JSON.stringify(a)+' '+r.message);return r;};
// A player who does exactly what the guide shows, nothing else. Waiting (energy) passes two minutes.
function follow(s,{max=200}={}){
 const seen=[];let now=1000,actions=0;
 for(let n=0;n<max;n++){
  tick(s,now);const st=coachStep(s);if(!st)break;
  if(seen.at(-1)!==st.id)seen.push(st.id);
  const t=st.target;
  // never a target that is not there
  if(t?.kind==='cell')assert.equal(s.board[t.index]?.type,'source',`${st.id}: the generator is there`);
  if(t?.kind==='pair'){const [a,b]=t.cells.map(i=>s.board[i]);assert.ok(a&&b,`${st.id}: both parts there`);}
  if(t?.kind==='order'){const o=s.orders.find(o=>o?.id===t.id);assert.ok(o&&orderItems(s,o),`${st.id}: the order is ready`);}
  if(st.id==='tap'){assert.ok(s.energy>=1&&s.board.includes(null),'a tap only with energy and a free space');ok(s,{type:'produce',id:s.board[t.index].id,index:t.index},now);}
  else if(st.id==='merge'||st.id==='unseal')ok(s,{type:'merge',from:t.cells[0],to:t.cells[1]},now);
  else if(st.id==='deliver'||st.id==='gold')ok(s,{type:'deliver',id:t.id},now);
  else if(st.id==='build')ok(s,{type:'restore',id:FIRST_PLACE},now);
  else if(st.id==='result')break;
  else if(st.id==='wait'){now+=120000;continue;}
  else assert.fail('unknown step '+st.id);
  actions++;now+=4000;
 }
 return {seen,actions,minutes:now/60000};
}

test('a new camp, following only the guide on the real board, reaches its first restoration: tap, merge, crew coins, gold materials, build, result', ()=>{
 const s=fresh(0);assert.ok(coachActive(s));ok(s,{type:'seen',id:COACH_ON},1);// the app marks it on arriving
 const before=JSON.stringify({board:s.board.filter(Boolean).length,coins:s.coins});
 const r=follow(s);
 assert.equal(s.built[FIRST_PLACE],1,'the path is built');
 // the loop's steps, in order (repeats collapsed; taps and merges alternate as the parts need)
 const order=['tap','merge','deliver','gold','build','result'];let k=0;for(const id of r.seen)if(id===order[k])k++;else if(order.indexOf(id)>k)assert.fail(`${id} before ${order[k]}: ${r.seen.join(' ')}`);
 assert.equal(k,order.length,r.seen.join(' '));
 assert.ok(r.actions<=80,`${r.actions} actions to the first restoration`);
 assert.equal(coachStep(s).id,'result');assert.match(coachStep(s).text,/Next: Lay a boardwalk/);
 console.log(`guide to the first restoration: ${r.actions} actions (taps, merges, deliveries, the build); start ${before}`);
});

test('steps already done are skipped: a camp that delivered its first crew order on its own starts at the gold order', ()=>{
 const s=fresh(0);ok(s,{type:'seen',id:COACH_ON},1);const r=follow(s,{max:400});
 // a mid-way camp: the first crew order delivered, the gold order up, its parts not made
 const t=fresh(0);ok(t,{type:'seen',id:COACH_ON},1);let now=1000;
 for(let n=0;n<300&&!t.ordersDone;n++){const st=coachStep(t);if(st.id==='tap')ok(t,{type:'produce',id:t.board[st.target.index].id,index:st.target.index},now);else if(st.id==='merge')ok(t,{type:'merge',from:st.target.cells[0],to:st.target.cells[1]},now);else if(st.id==='deliver')ok(t,{type:'deliver',id:st.target.id},now);else{now+=120000;tick(t,now);}now+=4000;}
 assert.equal(t.ordersDone,1);assert.ok(t.orders.some(o=>o?.story===FIRST_PLACE),'the gold order is up');
 assert.ok(['tap','merge','gold'].includes(coachStep(t).id));assert.match(coachStep(t).text,/gold order/);
 // materials already secured and coins in hand: straight to the build
 const u=structuredClone(t);u.materials[FIRST_PLACE]=1;u.orders=u.orders.map(o=>o?.story?{...u.orders.find(x=>x&&!x.story),id:'o99'}:o);u.coins=TASKS[FIRST_PLACE].stages[0].cost;
 assert.equal(coachStep(u).id,'build');
 // coins short after the materials: crew orders, never the build
 const v=structuredClone(u);v.coins=0;assert.notEqual(coachStep(v).id,'build');assert.match(coachStep(v).text,/coins/);
 assert.ok(r);
});

test('never points at what the board cannot give: no energy, a full board', ()=>{
 const s=fresh(0);s.energy=0;const st=coachStep(s);assert.equal(st.target,null);assert.match(st.text,/energy/i);
 const t=fresh(0);t.board=t.board.map(x=>x===null?item('shell',0):x);const u=coachStep(t);assert.notEqual(u.id,'tap');
});

test('saves: a reload resumes the step; camps that have played get no guide; skipping ends it; the flags are ordinary seen flags', ()=>{
 const s=fresh(0);ok(s,{type:'seen',id:COACH_ON},1);ok(s,{type:'produce',id:'rig',index:21},2);
 const t=load(JSON.stringify(s),9000);assert.ok(coachActive(t),'resumes after a reload');assert.equal(coachStep(t).id,coachStep(s).id);
 // a camp saved before the guide existed that has played (moves, no flag): no guide
 const old=fresh(0);ok(old,{type:'produce',id:'rig',index:21},2);delete old.seen[COACH_ON];assert.equal(coachActive(load(JSON.stringify(old),9000)),false);
 const built=fresh(0);built.built={'beach-path':3,'beach-tent':1};built.materials={...built.built};assert.equal(coachActive(built),false);
 // skip
 const k=load(JSON.stringify(s),9000);ok(k,{type:'seen',id:COACH_DONE},9001);assert.equal(coachStep(k),null);assert.equal(coachActive(load(JSON.stringify(k),9500)),false);
});

test('later mechanics: a generator merge tip only with a matching copy on the board; rare uses named only when a later stage asks', ()=>{
 const s=fresh(0);s.seen[COACH_DONE]=true;assert.equal(laterTip(s),null);
 s.board[22]=source('rig');const tip=laterTip(s);assert.equal(tip.id,'tip-genmerge');assert.deepEqual(tip.target.cells.sort(),[21,22]);
 s.seen['tip-genmerge']=true;assert.equal(laterTip(s),null);
 // during the first loop's guide, no later tip
 const g=fresh(0);g.board[22]=source('rig');assert.equal(laterTip(g),null);
 assert.equal(nextRareUse(fresh(0),'mech').name,'Add a cargo crane');
 const late=fresh(0);late.area=7;for(const id of Object.keys(TASKS))late.built[id]=3;assert.equal(nextRareUse(late,'mech'),null,'nothing promised when nothing asks');
});
