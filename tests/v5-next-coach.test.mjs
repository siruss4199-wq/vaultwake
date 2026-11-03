// Coast Camp's first-player guide (build 51c; docs/V5_FIRST_PLAYER_GUIDE_2026-11-02.md), a one-time introduction, as rules: a new
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
// A player who does what the guide shows where it highlights something, and between highlights works
// toward the goal line on their own (here: the board advice the goal line summarises, step.advice).
// Waiting (energy) passes two minutes.
const LESSONS=['tap','merge','deliver','gold','build'];
function doStep(s,st,now){
 const t=st.target;
 if(st.id==='tap')return ok(s,{type:'produce',id:s.board[t.index].id,index:t.index},now);
 if(st.id==='merge')return ok(s,{type:'merge',from:t.cells[0],to:t.cells[1]},now);
 if(st.id==='deliver'||st.id==='gold')return ok(s,{type:'deliver',id:t.id},now);
 if(st.id==='build')return ok(s,{type:'restore',id:FIRST_PLACE},now);
 if(st.id==='goal'){const g=st.advice;
  if(g.kind==='tap')return ok(s,{type:'produce',id:g.id,index:g.index},now);
  if(g.kind==='merge'||g.kind==='unseal')return ok(s,{type:'merge',from:g.cells[0],to:g.cells[1]},now);
  if(g.kind==='deliver')return ok(s,{type:'deliver',id:g.id},now);}
 assert.fail('unknown step '+st.id+' '+JSON.stringify(st.advice??null));
}
function follow(s,{max=200}={}){
 const seen=[],steps=[];let now=1000,actions=0,highlighted=0;
 for(let n=0;n<max;n++){
  tick(s,now);const st=coachStep(s);if(!st)break;
  steps.push(st.id);if(seen.at(-1)!==st.id)seen.push(st.id);
  const t=st.target;
  // never a target that is not there; a goal or a wait points at nothing
  if(t?.kind==='cell')assert.equal(s.board[t.index]?.type,'source',`${st.id}: the generator is there`);
  if(t?.kind==='pair'){const [a,b]=t.cells.map(i=>s.board[i]);assert.ok(a&&b,`${st.id}: both parts there`);}
  if(t?.kind==='order'){const o=s.orders.find(o=>o?.id===t.id);assert.ok(o&&orderItems(s,o),`${st.id}: the order is ready`);}
  if(st.id==='goal'||st.id==='wait')assert.equal(t,null,`${st.id}: no highlight`);
  if(st.id==='tap')assert.ok(s.energy>=1&&s.board.includes(null),'a tap only with energy and a free space');
  if(st.id==='wait'){now+=120000;continue;}
  if(LESSONS.includes(st.id))highlighted++;
  doStep(s,st,now);actions++;now+=4000;
 }
 return {seen,steps,actions,highlighted,minutes:now/60000};
}

test('a one-time introduction: each control is highlighted once (tap, merge, crew delivery, gold delivery, build), goals in between, and the first restoration ends it', ()=>{
 const s=fresh(0);assert.ok(coachActive(s));ok(s,{type:'seen',id:COACH_ON},1);// the app marks it on the first action
 const before=JSON.stringify({board:s.board.filter(Boolean).length,coins:s.coins});
 const r=follow(s);
 assert.equal(s.built[FIRST_PLACE],1,'the path is built');
 assert.equal(coachStep(s),null,'the first restoration ends the guide');assert.equal(coachActive(s),false);
 // each lesson is highlighted exactly once, in the loop's order; everything else is a goal (or a wait)
 assert.deepEqual(r.steps.filter(id=>LESSONS.includes(id)),LESSONS,r.steps.join(' '));
 assert.ok(r.steps.every(id=>[...LESSONS,'goal','wait'].includes(id)),r.steps.join(' '));
 assert.equal(r.highlighted,LESSONS.length);
 assert.ok(r.actions<=80,`${r.actions} actions to the first restoration`);
 // later orders never restart it, nor does a reload
 const t=load(JSON.stringify(s),9e6);assert.equal(coachActive(t),false);
 for(const o of t.orders.filter(Boolean))t.board[t.board.indexOf(null)]=item(o.needs[0].family,o.needs[0].tier);
 assert.equal(coachStep(t),null,'a later ready order: no guide');
 console.log(`guide to the first restoration: ${r.actions} actions, ${r.highlighted} highlighted; start ${before}; ${r.seen.join(' ')}`);
});

test('steps already done are skipped: a camp that delivered its first crew order on its own starts at the gold order', ()=>{
 const s=fresh(0);ok(s,{type:'seen',id:COACH_ON},1);const r=follow(s,{max:400});assert.equal(s.built[FIRST_PLACE],1);
 // a mid-way camp: the first crew order delivered, the gold order up, its parts not made
 const t=fresh(0);ok(t,{type:'seen',id:COACH_ON},1);let now=1000;
 for(let n=0;n<300&&!t.ordersDone;n++){const st=coachStep(t);if(st.id==='wait'){now+=120000;tick(t,now);}else doStep(t,st,now);now+=4000;}
 assert.equal(t.ordersDone,1);assert.ok(t.orders.some(o=>o?.story===FIRST_PLACE),'the gold order is up');
 assert.ok(['goal','gold'].includes(coachStep(t).id),'tap and merge are not taught again');assert.match(coachStep(t).text,/gold order/);
 // a camp that tapped and merged on its own before being asked is not taught them
 const w=fresh(0);ok(w,{type:'seen',id:COACH_ON},1);ok(w,{type:'produce',id:'rig',index:21},2);assert.notEqual(coachStep(w).id,'tap');
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
 // a camp saved mid-guide by an earlier 51c build after its first restoration (coach-on, no coach-done): no guide
 const mid=fresh(0);mid.seen[COACH_ON]=true;mid.built={'beach-path':1};mid.materials={'beach-path':1};assert.equal(coachActive(load(JSON.stringify(mid),9000)),false);assert.equal(coachStep(mid),null);
 // skip
 const k=load(JSON.stringify(s),9000);ok(k,{type:'seen',id:COACH_DONE},9001);assert.equal(coachStep(k),null);assert.equal(coachActive(load(JSON.stringify(k),9500)),false);
});

test('later mechanics: a generator merge tip only with a matching copy on the board; rare uses named only when a later stage asks', ()=>{
 const s=fresh(0);s.seen[COACH_DONE]=true;assert.equal(laterTip(s),null);
 s.board[22]=source('rig');const tip=laterTip(s);assert.equal(tip.id,'tip-genmerge');assert.deepEqual(tip.target.cells.sort(),[21,22]);
 s.seen['tip-genmerge']=true;assert.equal(laterTip(s),null);
 // during the first loop's guide, no later tip
 const g=fresh(0);g.board[22]=source('rig');assert.equal(laterTip(g),null);
 assert.equal(nextRareUse(fresh(0),'mech').name,'Line the path with lanterns');
 const late=fresh(0);late.area=7;for(const id of Object.keys(TASKS))late.built[id]=3;assert.equal(nextRareUse(late,'mech'),null,'nothing promised when nothing asks');
});
