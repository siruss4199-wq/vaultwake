// Coast Camp Chapter 4, the Answering Light (build 49a, 2026-11-02; docs/V5_CHAPTER4_ANSWERING_LIGHT_2026-11-02.md):
// seven places in three stages on the headland, their dependencies (two branches in either order, the
// relay's finale needing every branch), fixed gold recipes (five with a merged rare part, never lowered),
// a finished Chapter 3 save going on into it (board, shed, waiting rewards, energy above capacity, active
// orders and material credits kept; seen flags per card), the player's choice of branch (aim), all 21
// stages bought once and charged once, full-board kits, and reloads that change nothing.
import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,load,act,item,allDone,upgrades,stageOf,blockedStage,isSecondary,areaDone,totalBuilt,cog,token,storyTarget,goldChase,makeOrder,source,ROVER,capacityOf} from '../v5/next/game.mjs';
import {AREAS,STAGES,TASKS,LABELS} from '../v5/next/areas.mjs';
import {CHAINS,maxTier} from '../v5/next/chains.mjs';

const L=AREAS[5],IDS=['ch4-landing','ch4-steps','ch4-cottage','ch4-workshop','ch4-records','ch4-lighthouse','ch4-relay'];
const ok=(s,a,now=1000)=>{const r=act(s,a,now);assert.ok(r.ok,JSON.stringify(a)+' '+r.message);return r;};
const done=a=>Object.fromEntries(a.tasks.map(t=>[t.id,3]));
// A camp at the end of Chapter 3 (the boat launched), as build 48c saved it: still in the harbour, its
// end card seen (seenEnd) or not; a board with both level-2 rare generators, a shed, a waiting reward,
// energy above its capacity, an active crew order and the harbour's story cards seen.
function chapter3Done({seenEnd=true}={}){
 const s=fresh(0);s.area=4;s.built={...done(AREAS[0]),...done(AREAS[1]),...done(AREAS[2]),...done(AREAS[3]),...done(AREAS[4])};s.materials={...s.built};
 s.coins=812;s.moves=6000;s.ordersDone=560;s.energy=137;s.level={version:1,level:24,xp:5};s.capPaid=100;s.boost={order:true,stage:true};
 s.daily={day:9e6,count:1};s.seen={door:true,'vault-open':true,archive:true,'obs-signal':true,'obs-harbour':true,'hb-arrival':true,'hb-cargo':true,'hb-signal':true};if(seenEnd)s.seenEnd=true;
 s.secOpen={rig:true,chart:true};s.found.push('mech0','mech1','notes0','notes1');
 s.board[ROVER]={...source('rig'),level:2};
 for(const id of ['chart','rope','shell','lamp','optic'])if(!s.board.some(x=>x?.type==='source'&&x.id===id)){const i=s.board.findIndex(x=>x===null||x.type==='cargo');s.board[i]={type:'source',id};}
 const kite=s.board.findIndex(x=>x?.type==='source'&&x.id==='chart');s.board[kite]={...source('chart'),level:2};
 s.shed[0]=item('rope',3);s.shed[1]=cog();s.pending=[token()];s.board[15]=item('shell',2);
 s.orders=s.orders.map((o,k)=>k===1?{...o,needs:[{family:'rig',tier:2,count:1}]}:o);
 return s;
}
// The entry save with its loose Cockle shell cleared (it would count as a part already made for a gold
// order, which keeps that order when the branch choice changes)
const entry=()=>{const s=load(JSON.stringify(chapter3Done()),5000);s.board[15]=null;s.coins=90000;return s;};
// As a player does: the gold order for the next stage delivered (its parts laid on the board), then the
// stage bought. Parts the board cannot hold are cleared off first.
function buyNext(s,log){
 const free=()=>s.board.reduce((a,x,i)=>x===null||x.type==='cargo'?[...a,i]:a,[]);
 const ups=upgrades(s);if(!ups.length)return null;
 let u=ups.find(u=>u.materials);
 if(!u){const o=s.orders.find(x=>x?.story&&ups.some(v=>v.id===x.story));assert.ok(o,'a gold order for an open stage: '+JSON.stringify(ups.map(v=>v.id+v.stage)));
  u=ups.find(v=>v.id===o.story);const f=free();let k=0;for(const r of o.needs)for(let c=0;c<r.count;c++)s.board[f[k++]]=item(r.family,r.tier);
  ok(s,{type:'deliver',id:o.id});log?.gold.push([u.id,u.stage,o.needs]);}
 const coins=s.coins,r=ok(s,{type:'restore',id:u.id});log?.stages.push([u.id,u.stage]);log?.paid.push(coins-s.coins+(r.effects?.coins??0));
 for(let i=0;i<s.board.length;i++)if(s.board[i]?.type==='item'&&free().length<6)s.board[i]=null;
 return r;
}

test('the Answering Light: seven places in three stages, stable ids, a line each, costs rising', ()=>{
 assert.equal(L.id,'answering-light');assert.equal(L.name,'The Answering Light');assert.ok(L.intro.length>=1);
 assert.deepEqual(L.tasks.map(t=>t.id),IDS);assert.ok(L.tasks.every(t=>t.stages.length===STAGES&&t.art===t.id));
 assert.ok(L.tasks.every(t=>t.stages.every(x=>x.lines.length===1&&x.cost>0)));
 assert.ok(L.tasks.every(t=>t.stages[0].cost<t.stages[1].cost&&t.stages[1].cost<t.stages[2].cost),'each stage costs more');
 // earlier chapters keep their indices and ids
 assert.deepEqual(AREAS.slice(0,6).map(a=>a.id),['beach','worksite','entrance','vault','harbour','answering-light']);
 assert.equal(Object.keys(TASKS).filter(id=>!id.startsWith('ch5-')).length,35);for(const id of IDS)assert.equal(TASKS[id].area,'answering-light');
 assert.ok(IDS.every(id=>LABELS[id]),'every place has a label');
 // rewards: stages 1-2 their visible repair only; stage 3 a kit of 2 of a chain the camp already has
 for(const t of L.tasks){assert.deepEqual(t.stages[0].effect,{});assert.deepEqual(t.stages[1].effect,{});
  const k=t.stages[2].effect.kit;assert.ok(k&&k[1]===2&&CHAINS[k[0]]&&!CHAINS[k[0]].secondary,t.id);}
 // no new energy or coin reward
 assert.ok(L.tasks.every(t=>t.stages.every(x=>!x.effect.energy&&!x.effect.coins)));
});

test('dependencies: landing, then steps, then two branches in either order; the relay\'s finale needs every branch; no cycle', ()=>{
 const req=Object.fromEntries(L.tasks.flatMap(t=>t.stages.map((x,k)=>[t.id+(k+1),x.requires??null])));
 assert.equal(req['ch4-landing1'],null);
 assert.deepEqual(req['ch4-steps1'],{'ch4-landing':3});
 assert.deepEqual(req['ch4-cottage1'],{'ch4-steps':3});assert.deepEqual(req['ch4-workshop1'],{'ch4-steps':3});
 assert.deepEqual(req['ch4-records1'],{'ch4-cottage':3});assert.deepEqual(req['ch4-lighthouse1'],{'ch4-workshop':3});
 assert.deepEqual(req['ch4-relay1'],{'ch4-workshop':3,'ch4-records':3});assert.deepEqual(req['ch4-relay3'],{'ch4-lighthouse':3,'ch4-records':3});
 // no cycle: every requirement points at a place earlier in a topological order
 const order=['ch4-landing','ch4-steps','ch4-cottage','ch4-workshop','ch4-records','ch4-lighthouse','ch4-relay'];
 for(const t of L.tasks)for(const x of t.stages)for(const id of Object.keys(x.requires??{}))assert.ok(order.indexOf(id)<order.indexOf(t.id),`${t.id} needs ${id}`);
 // both branches open together after the steps, and either can be finished first
 for(const first of ['ch4-cottage','ch4-workshop']){
  const s=entry();for(const id of ['ch4-landing','ch4-steps'])for(let k=0;k<3;k++)buyNext(s);
  assert.deepEqual(upgrades(s).map(u=>u.id).sort(),['ch4-cottage','ch4-workshop']);
  ok(s,{type:'aim',id:first});for(let k=0;k<3;k++){buyNext(s);}
  assert.equal(stageOf(s,first),3,`${first} first`);
 }
});

test('fixed gold recipes: two materials each, real chains and tiers, the five rare parts as authored, never lowered', ()=>{
 const rare=[];
 for(const t of L.tasks)for(const [k,x] of t.stages.entries()){
  assert.equal(x.gold.length,2,`${t.id} ${k+1}: two requirements`);assert.ok(!x.rare,'no dynamic rare swap');
  for(const [f,tier,n] of x.gold){assert.ok(CHAINS[f],f);assert.ok(Number.isInteger(tier)&&tier>=0&&tier<maxTier(f),`${t.id} ${k+1}: ${f}${tier} below the top (no collectible-only part)`);assert.equal(n,1);
   if(CHAINS[f].secondary)rare.push([t.id,k+1,f,tier]);
   assert.ok(['rig','rope','shell','lamp','chart','optic','mech','notes'].includes(f),'only active chains');}}
 assert.deepEqual(rare,[['ch4-cottage',3,'notes',1],['ch4-workshop',2,'mech',2],['ch4-records',2,'notes',1],['ch4-records',3,'notes',2],['ch4-relay',2,'mech',1]]);
 // the Gear assembly asked whatever the player holds: nothing, a Bolt, a Gear, or the assembly itself
 const base=entry();for(const id of ['ch4-landing','ch4-steps'])for(let k=0;k<3;k++){base.coins=90000;buyNext(base);}
 ok(base,{type:'aim',id:'ch4-workshop'});base.coins=90000;buyNext(base);
 for(const held of [[],[['mech',0]],[['mech',1]],[['mech',2]]]){const s=structuredClone(base);
  for(const [f,t] of held)s.board[s.board.findIndex(x=>x===null)]=item(f,t);
  s.orders=s.orders.map(o=>o?.story?null:o);const lane=s.orders.indexOf(null);s.orders[lane]=makeOrder(s);
  assert.deepEqual(s.orders[lane].needs,[{family:'rig',tier:3,count:1},{family:'mech',tier:2,count:1}],JSON.stringify(held));}
 // the gold objective's guarantee covers it
 const s=structuredClone(base);assert.equal(s.orders.find(o=>o?.story)?.story,'ch4-workshop');assert.ok(goldChase(s,'mech'));
});

test('a finished Chapter 3 save enters Chapter 4: board, shed, rewards, energy, orders and credits kept; arrival to come; launch seen once', ()=>{
 for(const seenEnd of [true,false]){
  const old=chapter3Done({seenEnd}),s=load(JSON.stringify(old),5000);
  assert.equal(s.area,5,'in the Answering Light');assert.equal(s.seenEnd,undefined,'Chapter 3\'s end is not the camp\'s end');
  assert.equal(s.seen['ch4-arrival'],undefined,'the Chapter 4 arrival is still to come');
  assert.equal(!!s.seen['hb-launch'],seenEnd,'a camp that saw Chapter 3\'s end card has seen the launch; one that did not, will');
  assert.equal(s.coins,812);assert.equal(s.energy,137,'energy above capacity kept');assert.equal(capacityOf(s),100);
  assert.deepEqual(s.shed.slice(0,2),old.shed.slice(0,2));assert.deepEqual(s.pending,old.pending);assert.deepEqual(s.board[15],old.board[15]);
  assert.equal(s.board[ROVER].level,2);assert.deepEqual(s.secOpen,{rig:true,chart:true});
  for(const id of Object.keys(old.built))assert.equal(s.built[id],3);for(const id of IDS)assert.equal(stageOf(s,id),0);
  assert.ok(s.orders.some(o=>o?.needs?.length===1&&o.needs[0].family==='rig'&&o.needs[0].tier===2),'the active crew order kept');
  assert.equal(s.orders.find(o=>o?.story)?.story,'ch4-landing','the landing\'s gold order up');
  assert.deepEqual(upgrades(s).map(u=>u.id),['ch4-landing']);
  // a reload changes nothing
  const t=load(JSON.stringify(s),9000);assert.equal(t.area,5);assert.deepEqual(t.seen,s.seen);assert.deepEqual(t.orders,s.orders);assert.equal(t.energy,137);
 }
});

test('all 21 stages as a player buys them: each gold order as authored, each stage charged once, the relay last, then Chapter 5', ()=>{
 const s=load(JSON.stringify(chapter3Done()),5000);s.coins=90000;const log={gold:[],stages:[],paid:[]};let guard=0;
 while(!areaDone(s,L)&&guard++<40)assert.ok(buyNext(s,log),'never stuck: '+JSON.stringify(upgrades(s)));
 assert.equal(areaDone(s,L),true);assert.equal(s.area,6,'on to the Lowwater Passage (build 50a)');assert.equal(log.stages.length,21);
 for(const [id,n,needs] of log.gold)assert.deepEqual(needs.map(r=>[r.family,r.tier,r.count]),TASKS[id].stages[n-1].gold,`${id} ${n}`);
 for(const [k,[id,n]] of log.stages.entries())assert.equal(log.paid[k],TASKS[id].stages[n-1].cost,`${id} ${n}: charged its cost once`);
 assert.deepEqual(log.stages.at(-1),['ch4-relay',3],'the relay\'s stored message is last');
 assert.equal(new Set(log.stages.map(x=>x.join())).size,21,'each stage once');
 assert.equal(totalBuilt(s),105,'84 stages before and 21 here');assert.deepEqual(s.orders.filter(o=>o?.story).map(o=>o.story),['ch5-landing'],'Chapter 5\'s first gold order, no Chapter 4 one left');
 // nothing is bought twice, after a reload either
 const t=load(JSON.stringify(s),9000);assert.equal(areaDone(t,L),true);
 for(const id of IDS)assert.equal(act(t,{type:'restore',id},9000).ok,false);
});

test('the relay waits for the lighthouse and the records, and says so; no stage opens early', ()=>{
 const s=load(JSON.stringify(chapter3Done()),5000);s.coins=90000;
 for(const id of ['ch4-landing','ch4-steps','ch4-workshop','ch4-cottage','ch4-records'])for(let k=0;k<3;k++){if(upgrades(s).some(u=>u.id===id))ok(s,{type:'aim',id});buyNext(s);}
 for(let k=0;k<2;k++){ok(s,{type:'aim',id:'ch4-relay'});buyNext(s);}
 assert.equal(stageOf(s,'ch4-relay'),2);assert.ok(!upgrades(s).some(u=>u.id==='ch4-relay'),'the stored message waits');
 const b=blockedStage(s,'ch4-relay');assert.equal(b.name,'Read the stored message');assert.deepEqual(b.requires,{'ch4-lighthouse':3,'ch4-records':3});
 s.materials['ch4-relay']=3;assert.equal(act(s,{type:'restore',id:'ch4-relay'}).ok,false,'no build before the lighthouse');
});

test('choosing a branch: the gold order follows the choice, keeps it after a build, and keeps parts and credits', ()=>{
 const s=entry();for(const id of ['ch4-landing','ch4-steps'])for(let k=0;k<3;k++)buyNext(s);
 assert.equal(storyTarget(s).id,'ch4-cottage','by default the cheaper (the cottage first in the list)');
 const gold=s.orders.find(o=>o?.story),made=s.board.findIndex(x=>x===null);s.board[made]=item(gold.needs[0].family,gold.needs[0].tier);const before=s.board.filter(Boolean).length;
 const r=ok(s,{type:'aim',id:'ch4-workshop'});assert.equal(s.aim,'ch4-workshop');
 const g=s.orders.find(o=>o?.story);assert.equal(g.story,'ch4-workshop');assert.deepEqual(g.needs.map(x=>[x.family,x.tier,x.count]),TASKS['ch4-workshop'].stages[0].gold);
 assert.equal(s.board.filter(Boolean).length,before,'the parts made for the other order stay');assert.equal(s.orders.filter(o=>o?.story).length,1,'one gold order');
 // after a build the chosen place's next stage is next (the part made above is used elsewhere first)
 s.board[made]=null;buyNext(s);assert.equal(s.orders.find(o=>o?.story)?.story,'ch4-workshop');
 // a part already made for the other branch's gold order keeps that order after the build (no work undone)
 {const w=entry();for(let k=0;k<6;k++)buyNext(w);ok(w,{type:'aim',id:'ch4-workshop'});const o=w.orders.find(x=>x?.story);for(const r of o.needs)w.board[w.board.findIndex(x=>x===null)]=item(r.family,r.tier);
  ok(w,{type:'deliver',id:o.id});const other=w.orders.find(x=>x?.story);assert.equal(other.story,'ch4-cottage','the other branch meanwhile');
  w.board[w.board.findIndex(x=>x===null)]=item(other.needs[0].family,other.needs[0].tier);ok(w,{type:'restore',id:'ch4-workshop'});
  assert.equal(w.orders.find(x=>x?.story).id,other.id,'kept: one of its parts is already on the board');}
 // material credits stay with their stage when the choice changes
 const t=structuredClone(s);t.materials['ch4-cottage']=1;ok(t,{type:'aim',id:'ch4-workshop'});assert.equal(t.materials['ch4-cottage'],1);
 // a place not open, or one with its materials in, cannot be chosen; a damaged aim is dropped on load
 assert.equal(act(s,{type:'aim',id:'ch4-relay'}).ok,false);assert.equal(act(s,{type:'aim',id:'nowhere'}).ok,false);
 const u=structuredClone(s);u.aim=42;assert.equal(load(JSON.stringify(u),9000).aim,undefined);
 assert.equal(load(JSON.stringify(s),9000).aim,'ch4-workshop','saved');
});

test('a stage-3 kit on a full board waits for space, once; nothing is given twice across a reload', ()=>{
 const s=load(JSON.stringify(chapter3Done()),5000);s.coins=90000;for(let k=0;k<2;k++)buyNext(s);
 const gold=s.orders.find(o=>o?.story);for(const r of gold.needs)s.board[s.board.findIndex(x=>x===null||x.type==='cargo')]=item(r.family,r.tier);ok(s,{type:'deliver',id:gold.id});
 s.board=s.board.map(x=>x===null||x.type==='cargo'?item('shell',0):x);const pend=s.pending.length;
 const r=ok(s,{type:'restore',id:'ch4-landing'});assert.equal(stageOf(s,'ch4-landing'),3);
 assert.ok(s.pending.length>pend,'the kit waits for space');const t=load(JSON.stringify(s),9000);assert.equal(t.pending.length,s.pending.length,'kept once');
 assert.equal(act(t,{type:'restore',id:'ch4-landing'}).ok,false);
});
