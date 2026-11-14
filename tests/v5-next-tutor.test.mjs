// Adaptive guided tutorial 2.0 (v5/next/tutor.mjs, First Session 2.0), on the real reducer:
//  - it guides a fresh camp through the real first restoration (tap → merge → crew order → gold order → coast
//    strip → Build → Next), one action at a time, and every action it points at is accepted by act();
//  - it never points at a blocked, buried or invalid thing, on any state of seeded random play;
//  - blockers (full board, no energy, an order only a missing generator can make) are explained, with no target;
//  - it never changes the camp, and a reloaded camp (load) gets the same step and level;
//  - guidance fades as skills are shown, and the existing skip flag (seen['coach-done']) ends it.
import test from 'node:test';import assert from 'node:assert/strict';
import {fresh,act,load,reachable,matches,ROVER,SOURCES} from '../v5/next/game.mjs';
import {tutorStep,guideLevel,tutorActive,signature,valid,skills} from '../v5/next/tutor.mjs';

const NOW=1_800_000_000_000;
const camp=()=>{const s=fresh(NOW);s.seen={...s.seen,'coach-on':true};return s;};
// the target means what it says on the board, and its action is one act() accepts
function checkTarget(s,st,tag){
 if(!st.target){assert.equal(st.action,null,tag+': a blocker has no action');return;}
 const t=st.target;
 if(st.action)assert.ok(valid(s,st.action,NOW),`${tag}: act() accepts ${JSON.stringify(st.action)}`);
 if(t.kind==='cell'){assert.equal(s.board[t.index]?.type,'source',tag+': a tap target is a generator');}
 if(t.kind==='pair'){const [a,b]=t.cells,x=s.board[a],y=s.board[b];assert.equal(x?.type,'item',tag+': a drag starts on a part');
  if(y.type==='cargo'){assert.ok(reachable(s,b),tag+': never a buried crate');assert.ok(matches(x,y.key),tag+': the part opens that crate');}
  else assert.ok(y.type==='item'&&y.family===x.family&&y.tier===x.tier,tag+': twins');}
 if(t.kind==='order')assert.ok(s.orders.some(o=>o?.id===t.id),tag+': a live order');
}
// a player who does what the guide shows, coast panel included
function follow(s,max=200,onStep=()=>{}){
 let coast=null;const kinds=[];
 for(let n=0;n<max;n++){const st=tutorStep(s,{coast,now:NOW});onStep(st,coast);if(!kinds.includes(st.kind))kinds.push(st.kind);
  if(st.kind==='build'){coast='open';continue;}
  if(st.kind==='coastBuild'){assert.ok(act(s,st.action,NOW).ok);return {kinds,steps:n+1};}
  assert.ok(st.action,`step ${n} (${st.kind}: ${st.what}) has an action`);
  const r=act(s,st.action,NOW);assert.ok(r.ok,`step ${n}: ${st.what} → ${r.message}`);}
 throw new Error('the guided flow did not reach the first build');
}

test('fresh camp: one clear first step, the Rivet Rover, full guidance',()=>{
 const s=camp(),before=JSON.stringify(s),st=tutorStep(s,{now:NOW});
 assert.equal(st.kind,'tap');assert.deepEqual(st.target,{kind:'cell',index:ROVER});assert.equal(st.what,'Tap the Rivet Rover');
 assert.match(st.why,/Copper offcut.*Ivo's Split spanner/);assert.equal(guideLevel(s,st),'full');
 assert.equal(JSON.stringify(s),before,'the tutor never changes the camp');
});

test('the guided flow reaches the real first restoration: every step valid, in the order of the brief',()=>{
 const s=camp(),seen=[];
 const {kinds}=follow(s,200,(st,coast)=>{checkTarget(s,st,st.kind);seen.push(st);});
 // Generator → Merge → Crew order → Gold order → Coast strip → Build (then the next objective)
 const order=['tap','merge','deliver','gold','build','coastBuild'];
 assert.deepEqual(kinds.filter(k=>order.includes(k)),order,`first appearances: ${kinds.join(' → ')}`);
 assert.equal(s.built['beach-path'],1);assert.equal(s.coins,40);assert.equal(s.energy,129);
 assert.equal(s.taps.rig,12,'12 taps (the same as the game\'s own guide)');assert.equal(s.merges,11,'11 merges');assert.equal(s.ordersDone,2);
 // every step says what, where and why, in short text
 for(const st of seen){assert.ok(st.what.length>0&&st.what.length<=40,`short "what": ${st.what}`);assert.ok(st.why.length>0&&st.why.length<=90,`short "why": ${st.why}`);}
 // after the build (the app marks the guided finish: coach-done + coach-next): the next objective is named (light)
 s.seen={...s.seen,'coach-done':true,'coach-next':true};
 const next=tutorStep(s,{now:NOW});assert.ok(['tap','merge'].includes(next.kind));assert.match(next.why,/gold order's Pocket winch/);
 assert.equal(guideLevel(s,next),'light');
});

test('guidance fades as each skill is shown (full → light → quiet)',()=>{
 const s=camp(),lv=()=>guideLevel(s,tutorStep(s,{now:NOW}));
 assert.equal(lv(),'full');act(s,{type:'produce',id:'rig',index:ROVER},NOW);
 assert.equal(tutorStep(s,{now:NOW}).kind,'tap');assert.equal(lv(),'light','one tap shown: no finger any more');
 act(s,{type:'produce',id:'rig',index:ROVER},NOW);
 const m=tutorStep(s,{now:NOW});assert.equal(m.kind,'merge');assert.equal(guideLevel(s,m),'full','the first merge is new: full');
 act(s,m.action,NOW);act(s,{type:'produce',id:'rig',index:ROVER},NOW);
 const k=skills(s);assert.equal(k.tap,3);assert.equal(guideLevel(s,tutorStep(s,{now:NOW})),'quiet','three taps shown: quiet');
});

test('never a blocked, buried or invalid target on any state of seeded random play (300 states × 4 seeds)',()=>{
 for(const seed of [1,2,3,4]){let r=seed*7919;const rnd=n=>{r=(r*1103515245+12345)%2147483648;return r%n;};
  const s=camp();
  for(let n=0;n<300;n++){const st=tutorStep(s,{now:NOW});checkTarget(s,st,`seed ${seed} step ${n} ${st.kind}`);
   // the player does something else half of the time: any valid tap, merge, crate or delivery
   let a=st.action;
   if(!a||rnd(2)){const opts=[];s.board.forEach((x,i)=>{if(x?.type==='source')opts.push({type:'produce',id:x.id,index:i});
     if(x?.type==='item')s.board.forEach((y,j)=>{if(j!==i&&(y?.type==='item'||y?.type==='cargo'))opts.push({type:'merge',from:i,to:j});});});
    s.orders.forEach(o=>o&&opts.push({type:'deliver',id:o.id}));
    const ok=opts.filter(o=>valid(s,o,NOW));if(!ok.length)break;a=ok[rnd(ok.length)];}
   assert.ok(act(s,a,NOW).ok);
   if(s.built['beach-path']){const up=tutorStep(s,{now:NOW});checkTarget(s,up,'after a build');}}
 }
});

test('a crate whose key part is in hand but which is buried is never pointed at',()=>{
 const s=camp();const buried=s.board.findIndex((x,i)=>x?.type==='cargo'&&x.key.family==='rig'&&!reachable(s,i));assert.ok(buried>=0);
 // put its key part on the board, with no other way forward (no energy, no twins)
 const free=s.board.indexOf(null);s.board[free]={type:'item',family:'rig',tier:s.board[buried].key.tier};s.energy=0;
 const st=tutorStep(s,{now:NOW});assert.ok(!(st.target?.cells??[]).includes(buried),'the buried crate is not a target');
 assert.equal(valid(s,{type:'merge',from:free,to:buried},NOW),false,'(the reducer refuses it)');
});

test('full board: the guide says why and points at nothing it cannot do',()=>{
 const s=camp(),fill=[['rig',4],['rig',5],['rig',6],['chart',1],['chart',2],['rope',1]];let k=0;
 s.board=s.board.map(x=>x===null?{type:'item',family:fill[k][0],tier:fill[k++][1]}:x);
 const st=tutorStep(s,{now:NOW});assert.equal(st.kind,'space');assert.equal(st.target,null);assert.match(st.why,/Merge twins or deliver/);
 assert.equal(valid(s,{type:'produce',id:'rig',index:ROVER},NOW),false,'(a tap is refused: no space)');
 // with a twin pair on the full board, it points at the merge (which frees a space)
 const a=s.board.findIndex(x=>x?.type==='item'&&x.family==='rig'&&x.tier===4);s.board[s.board.findIndex(x=>x?.family==='rig'&&x.tier===5)]={type:'item',family:'rig',tier:4};
 const m=tutorStep(s,{now:NOW});assert.equal(m.kind,'merge');assert.ok(m.target.cells.includes(a));assert.ok(valid(s,m.action,NOW));
});

test('no energy: the guide explains the refill, and never highlights the generator',()=>{
 const s=camp();s.energy=0;s.energyAt=NOW;const st=tutorStep(s,{now:NOW});
 assert.equal(st.kind,'energy');assert.equal(st.target,null);assert.match(st.why,/\+1 energy every 2 minutes \(next in 2 min\)/);
});

test('an order only a missing generator makes: say which, and switch to an order that can be done',()=>{
 const s=camp(),kite=SOURCES.chart.name;
 s.orders[0]={...s.orders[0],needs:[{family:'chart',tier:1,count:1}]};
 const st=tutorStep(s,{now:NOW});assert.ok(['tap','merge'].includes(st.kind),'it works on another order');
 assert.match(st.why,new RegExp(`Ivo needs the ${kite}`));assert.notEqual(st.focus,s.orders[0].id);checkTarget(s,st,'switched');
 for(const o of s.orders)o.needs=[{family:'chart',tier:1,count:1}];
 const lock=tutorStep(s,{now:NOW});assert.equal(lock.kind,'locked');assert.equal(lock.target,null);
 assert.match(lock.why,new RegExp(`The ${kite} that makes it is not on your board yet`));
});

test('a ready crew order that would take the gold order\'s parts is not suggested (the player may still deliver it)',()=>{
 const s=camp();
 // play the guide to the gold order, then give Bram's order exactly the parts the gold order also needs
 let st;for(let n=0;n<40;n++){st=tutorStep(s,{now:NOW});if(s.orders.some(o=>o?.story))break;act(s,st.action,NOW);}
 const gold=s.orders.find(o=>o?.story),bram=s.orders.find(o=>o&&!o.story&&o.needs.some(r=>r.tier===2));assert.ok(gold&&bram);
 const free=()=>s.board.indexOf(null);for(const r of bram.needs)for(let k=0;k<r.count;k++)s.board[free()]={type:'item',family:r.family,tier:r.tier};
 st=tutorStep(s,{now:NOW});assert.notEqual(st.target?.id,bram.id,'Bram\'s order is not pointed at: it would take a Split spanner the gold order needs');
 assert.ok(valid(s,{type:'deliver',id:bram.id},NOW),'(but the player can deliver it)');
});

test('resume: a reloaded camp gets the same step and level at every point of the flow',()=>{
 const s=camp();
 follow(s,200,(st,coast)=>{if(coast)return;const r=load(JSON.stringify(s),NOW),again=tutorStep(r,{now:NOW});
  assert.equal(signature(again),signature(st),`same step after a reload: ${st.what}`);assert.equal(guideLevel(r,again),guideLevel(s,st));});
});

test('skip semantics: seen["coach-done"] (Skip guide) ends the guided span; a guided finish keeps the next objective',()=>{
 const s=camp();assert.equal(tutorActive(s),true);s.seen['coach-done']=true;
 assert.equal(tutorActive(s),false);assert.equal(guideLevel(s,tutorStep(s,{now:NOW})),'quiet');
 // skipped, then built later: still no guide
 const k=camp();follow(k);k.seen['coach-done']=true;assert.equal(tutorActive(k),false);
 // finished by the guide: the next objective, until the next delivery after it
 k.seen['coach-next']=true;assert.equal(tutorActive(k),true);
 const old=camp();old.moves=5;old.seen={};assert.equal(tutorActive(old),false,'a camp from before the guide never gets it');
});
