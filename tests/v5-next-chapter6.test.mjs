// Coast Camp Chapter 6, the Keeper's Promise (build 51a, 2026-11-02; docs/V5_CHAPTER6_KEEPERS_PROMISE_2026-11-02.md):
// the end of the first story. Seven places in three stages inside the Vault, in one line; fixed gold recipes
// in build 50b's way (none repeating the one before, three merged rare goals, never lowered); a finished
// Chapter 5 save going on into it (board, shed, waiting rewards, energy above capacity, active orders and
// material credits kept; seen flags per card); an unfinished one staying put; a Chapter 6 save in progress
// kept whole; all 21 stages bought once and charged once; the end card once; full-board kits; story flags once.
import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,load,act,item,allDone,upgrades,stageOf,blockedStage,areaDone,totalBuilt,cog,token,goldChase,makeOrder,source,ROVER,capacityOf,SEEN_ID} from '../v5/next/game.mjs';
import {AREAS,STAGES,TASKS,LABELS} from '../v5/next/areas.mjs';
import {CHAINS,maxTier} from '../v5/next/chains.mjs';

const K=AREAS[7],IDS=['ch6-landing','ch6-wheel','ch6-records','ch6-workshop','ch6-regulator','ch6-desk','ch6-overlook'];
const ok=(s,a,now=1000)=>{const r=act(s,a,now);assert.ok(r.ok,JSON.stringify(a)+' '+r.message);return r;};
const done=a=>Object.fromEntries(a.tasks.map(t=>[t.id,3]));
// A camp at the end of Chapter 5 (the inner lock restored), as build 50b saved it: still in the passage, its
// end card seen (seenEnd) or not; level-2 rare generators, a shed, a waiting reward, energy above capacity,
// an active crew order and Chapters 4-5's story cards seen.
function chapter5Done({seenEnd=true}={}){
 const s=fresh(0);s.area=6;s.built=Object.assign({},...AREAS.slice(0,7).map(done));s.materials={...s.built};
 s.coins=1210;s.moves=9500;s.ordersDone=820;s.energy=146;s.level={version:1,level:33,xp:4};s.capPaid=100;s.boost={order:true,stage:true};
 s.daily={day:9e6,count:1};s.seen={door:true,'vault-open':true,archive:true,'obs-signal':true,'obs-harbour':true,'hb-arrival':true,'hb-cargo':true,'hb-signal':true,'hb-launch':true,'ch4-arrival':true,'ch4-log':true,'ch4-light':true,'ch4-message':true,'ch5-arrival':true,'ch5-crossing':true,'ch5-ledger':true};if(seenEnd)s.seenEnd=true;
 s.secOpen={rig:true,chart:true};s.found.push('mech0','mech1','mech2','notes0','notes1','notes2');
 s.board[ROVER]={...source('rig'),level:2};
 for(const id of ['chart','rope','shell','lamp','optic'])if(!s.board.some(x=>x?.type==='source'&&x.id===id)){const i=s.board.findIndex(x=>x===null||x.type==='cargo');s.board[i]={type:'source',id};}
 const kite=s.board.findIndex(x=>x?.type==='source'&&x.id==='chart');s.board[kite]={...source('chart'),level:2};
 s.shed[0]=item('shell',3);s.shed[1]=cog();s.pending=[token()];s.board[15]=item('rope',1);
 s.orders=s.orders.map((o,k)=>k===1?{...o,needs:[{family:'chart',tier:2,count:1}]}:o);
 return s;
}
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
const entry=()=>{const s=load(JSON.stringify(chapter5Done()),5000);s.board[15]=null;s.coins=90000;return s;};

test('the Keeper\'s Promise: seven places in three stages, stable ids, a line each, costs rising, earlier chapters untouched', ()=>{
 assert.equal(K.id,'keeper');assert.equal(K.name,'The Keeper\'s Promise');assert.ok(K.intro.length>=1);
 assert.deepEqual(K.tasks.map(t=>t.id),IDS);assert.ok(K.tasks.every(t=>t.stages.length===STAGES&&t.art===t.id));
 assert.ok(K.tasks.every(t=>t.stages.every(x=>x.lines.length===1&&x.cost>0)));
 assert.ok(K.tasks.every(t=>t.stages[0].cost<t.stages[1].cost&&t.stages[1].cost<t.stages[2].cost),'each stage costs more');
 assert.deepEqual(AREAS.map(a=>a.id),['beach','worksite','entrance','vault','harbour','answering-light','lowwater','keeper']);
 assert.equal(Object.keys(TASKS).length,49);for(const id of IDS)assert.equal(TASKS[id].area,'keeper');
 assert.ok(IDS.every(id=>LABELS[id]),'every place has a label');
 for(const t of K.tasks){assert.deepEqual(t.stages[0].effect,{});assert.deepEqual(t.stages[1].effect,{});
  const k=t.stages[2].effect.kit;assert.ok(k&&k[1]===2&&CHAINS[k[0]]&&!CHAINS[k[0]].secondary,t.id);}
 assert.ok(K.tasks.every(t=>t.stages.every(x=>!x.effect.energy&&!x.effect.coins&&!x.effect.source)),'no energy, coin or generator reward');
 // prices: the pack's 8,505 times 0.72 (Chapter 5's build 50b scale), then 0.9 as measured (doc)
 assert.equal(K.tasks.reduce((n,t)=>n+t.stages.reduce((m,x)=>m+x.cost,0),0),5515);
 // Mara speaks only once she has been met (the workshop's card): never before the regulator
 const speakers=K.tasks.flatMap(t=>t.stages.flatMap(x=>x.lines.map(([w])=>[t.id,w])));
 assert.ok(speakers.filter(([,w])=>w==='mara').every(([id])=>IDS.indexOf(id)>=IDS.indexOf('ch6-regulator')));
});

test('one line: each place opens when the one before is fully restored; never two places open at once', ()=>{
 const req=Object.fromEntries(K.tasks.flatMap(t=>t.stages.map((x,k)=>[t.id+(k+1),x.requires??null])));
 for(const [k,id] of IDS.entries()){assert.deepEqual(req[id+1],k?{[IDS[k-1]]:3}:null,id);assert.equal(req[id+2],null);assert.equal(req[id+3],null);}
 const s=entry();let guard=0;
 while(!areaDone(s,K)&&guard++<30){const open=upgrades(s).map(u=>u.id);assert.equal(open.length,1,JSON.stringify(open));buyNext(s);}
 assert.equal(guard,21);
 const t=entry();assert.equal(act(t,{type:'aim',id:'ch6-records'}).ok,false);
 assert.deepEqual(blockedStage(t,'ch6-wheel').requires,{'ch6-landing':3});
});

test('fixed gold recipes: two requirements, below each chain\'s top, none repeating the one before (Chapter 5\'s last included), three rare goals, never lowered', ()=>{
 const rare=[],all=K.tasks.flatMap(t=>t.stages),key=x=>JSON.stringify(x.gold);
 for(const t of K.tasks)for(const [k,x] of t.stages.entries()){
  assert.equal(x.gold.length,2,`${t.id} ${k+1}`);assert.ok(!x.rare,'no dynamic rare swap');
  for(const [f,tier,n] of x.gold){assert.ok(['rig','rope','shell','lamp','chart','optic','mech','notes'].includes(f),'only active chains');
   assert.ok(Number.isInteger(tier)&&tier>=0&&tier<maxTier(f),`${t.id} ${k+1}: ${f}${tier} below the top`);
   assert.ok(n===1||n===2&&!CHAINS[f].secondary,`${t.id} ${k+1}: one or two of a common part, one rare`);
   if(CHAINS[f].secondary)rare.push([t.id,k+1,f,tier]);}}
 assert.deepEqual(rare,[['ch6-records',3,'notes',1],['ch6-regulator',2,'mech',1],['ch6-desk',3,'notes',2]]);
 const seq=[AREAS[6].tasks.at(-1).stages.at(-1),...all];
 for(let i=1;i<seq.length;i++)assert.notEqual(key(seq[i]),key(seq[i-1]),`${seq[i].name} repeats ${seq[i-1].name}`);
 assert.equal(new Set(all.map(key)).size,all.length,'every recipe its own');
 const drops=x=>x.gold.reduce((n,[f,t,c])=>n+c*2**t,0);
 for(const t of K.tasks)if(!t.stages.some(x=>x.gold.some(([f])=>CHAINS[f].secondary)))assert.ok(drops(t.stages[0])<drops(t.stages[1])&&drops(t.stages[1])<drops(t.stages[2]),t.id);
 // the regulator's Gear asked whatever is held
 const base=entry();for(let k=0;k<13;k++)buyNext(base);assert.equal(stageOf(base,'ch6-regulator'),1);
 for(const held of [[],[['mech',0]],[['mech',1]],[['mech',2]]]){const s=structuredClone(base);
  for(const [f,t] of held)s.board[s.board.findIndex(x=>x===null)]=item(f,t);
  s.orders=s.orders.map(o=>o?.story?null:o);const lane=s.orders.indexOf(null);s.orders[lane]=makeOrder(s);
  assert.deepEqual(s.orders[lane].needs,[{family:'lamp',tier:3,count:1},{family:'mech',tier:1,count:1}],JSON.stringify(held));}
 const s=structuredClone(base);assert.equal(s.orders.find(o=>o?.story)?.story,'ch6-regulator');assert.ok(goldChase(s,'mech'));
});

test('a finished Chapter 5 save enters Chapter 6: board, shed, rewards, energy, orders kept; arrival to come; "Behind the Vault" seen once', ()=>{
 for(const seenEnd of [true,false]){
  const old=chapter5Done({seenEnd}),s=load(JSON.stringify(old),5000);
  assert.equal(s.area,7,'in the Keeper\'s Promise');assert.equal(s.seenEnd,undefined,'Chapter 5\'s end is not the camp\'s end');
  assert.equal(s.seen['ch6-arrival'],undefined,'the Chapter 6 arrival is still to come');
  assert.equal(!!s.seen['ch5-station'],seenEnd,'a camp that saw Chapter 5\'s end card has seen it; one that did not, will');
  assert.equal(s.seen['ch5-ledger'],true);
  assert.equal(s.coins,1210);assert.equal(s.energy,146,'energy above capacity kept');assert.equal(capacityOf(s),100);
  assert.deepEqual(s.shed.slice(0,2),old.shed.slice(0,2));assert.deepEqual(s.pending,old.pending);assert.deepEqual(s.board[15],old.board[15]);
  assert.equal(s.board[ROVER].level,2);assert.deepEqual(s.secOpen,{rig:true,chart:true});
  for(const id of Object.keys(old.built))assert.equal(s.built[id],3);for(const id of IDS)assert.equal(stageOf(s,id),0);
  assert.ok(s.orders.some(o=>o?.needs?.length===1&&o.needs[0].family==='chart'&&o.needs[0].tier===2),'the active crew order kept');
  assert.equal(s.orders.find(o=>o?.story)?.story,'ch6-landing');assert.deepEqual(upgrades(s).map(u=>u.id),['ch6-landing']);
  const t=load(JSON.stringify(s),9000);assert.equal(t.area,7);assert.deepEqual(t.seen,s.seen);assert.deepEqual(t.orders,s.orders);assert.equal(t.energy,146);
 }
});

test('an unfinished Chapter 5 save stays in the passage; a Chapter 6 save in progress keeps its credit, its gold order and its rewards', ()=>{
 const s=chapter5Done({seenEnd:false});s.built['ch5-lock']=2;s.materials['ch5-lock']=2;
 const t=load(JSON.stringify(s),5000);assert.equal(t.area,6);assert.deepEqual(upgrades(t).map(u=>u.id),['ch5-lock']);
 assert.equal(t.seen['ch5-station'],undefined);for(const id of IDS)assert.equal(stageOf(t,id),0);
 assert.equal(act(t,{type:'restore',id:'ch6-landing'}).ok,false);
 // in progress: two stages built, the third's materials secured (its gold order delivered), coins short
 const u=entry();buyNext(u);buyNext(u);const g=u.orders.find(o=>o?.story);for(const r of g.needs)for(let c=0;c<r.count;c++)u.board[u.board.findIndex(x=>x===null)]=item(r.family,r.tier);
 ok(u,{type:'deliver',id:g.id});u.coins=10;u.pending.push(token());u.energy=133;
 const v=load(JSON.stringify(u),9000);assert.equal(v.materials['ch6-landing'],3,'the secured materials kept');assert.equal(stageOf(v,'ch6-landing'),2);
 assert.deepEqual(v.pending,u.pending);assert.equal(v.energy,133);assert.deepEqual(v.shed,u.shed);assert.deepEqual(v.board,u.board);
 assert.equal(act(v,{type:'restore',id:'ch6-landing'}).ok,false,'still short of coins');v.coins=900;ok(v,{type:'restore',id:'ch6-landing'});assert.equal(stageOf(v,'ch6-landing'),3);
});

test('all 21 stages as a player buys them: each gold order as authored, each charged once, the overlook last, then the end of the first story', ()=>{
 const s=entry();const log={gold:[],stages:[],paid:[]};let guard=0;
 while(!allDone(s)&&guard++<40)assert.ok(buyNext(s,log),'never stuck: '+JSON.stringify(upgrades(s)));
 assert.equal(allDone(s),true);assert.equal(areaDone(s,K),true);assert.equal(s.area,7);assert.equal(log.stages.length,21);
 for(const [id,n,needs] of log.gold)assert.deepEqual(needs.map(r=>[r.family,r.tier,r.count]),TASKS[id].stages[n-1].gold,`${id} ${n}`);
 for(const [k,[id,n]] of log.stages.entries())assert.equal(log.paid[k],TASKS[id].stages[n-1].cost,`${id} ${n}: charged its cost once`);
 assert.deepEqual(log.stages.at(-1),['ch6-overlook',3]);assert.equal(new Set(log.stages.map(x=>x.join())).size,21);
 assert.equal(totalBuilt(s),147,'126 stages before and 21 here');assert.ok(!s.orders.some(o=>o?.story),'no gold order left');
 assert.ok(s.orders.filter(Boolean).length>0,'crew orders go on');
 const t=load(JSON.stringify(s),9000);assert.equal(allDone(t),true);for(const id of IDS)assert.equal(act(t,{type:'restore',id},9000).ok,false);
 ok(t,{type:'seenEnd'});assert.equal(act(t,{type:'seenEnd'}).ok,false,'the end card once');assert.equal(load(JSON.stringify(t),9500).seenEnd,true);
});

test('a stage-3 kit on a full board waits for space, once; nothing is given twice across a reload', ()=>{
 const s=entry();for(let k=0;k<2;k++)buyNext(s);
 const gold=s.orders.find(o=>o?.story);for(const r of gold.needs)for(let c=0;c<r.count;c++)s.board[s.board.findIndex(x=>x===null||x.type==='cargo')]=item(r.family,r.tier);ok(s,{type:'deliver',id:gold.id});
 s.board=s.board.map(x=>x===null||x.type==='cargo'?item('shell',0):x);const pend=s.pending.length;
 ok(s,{type:'restore',id:'ch6-landing'});assert.equal(stageOf(s,'ch6-landing'),3);
 assert.ok(s.pending.length>pend,'the kit waits for space');const t=load(JSON.stringify(s),9000);assert.equal(t.pending.length,s.pending.length,'kept once');
 assert.equal(act(t,{type:'restore',id:'ch6-landing'}).ok,false);
});

test('story flags: each card id is a valid seen flag, marked once, kept across a reload, moving nothing on', ()=>{
 const s=entry();
 for(const id of ['ch5-station','ch6-arrival','ch6-keeper','ch6-letter']){assert.ok(SEEN_ID.test(id));if(!s.seen[id])ok(s,{type:'seen',id});assert.equal(act(s,{type:'seen',id}).ok,false,`${id} once`);}
 const t=load(JSON.stringify(s),9000);for(const id of ['ch6-arrival','ch6-keeper','ch6-letter'])assert.equal(t.seen[id],true);
 assert.equal(t.area,7);assert.deepEqual(upgrades(t).map(u=>u.id),['ch6-landing']);
});
