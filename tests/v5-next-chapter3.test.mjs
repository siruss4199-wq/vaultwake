// Coast Camp Chapter 3, the Hidden Harbour (build 48a, 2026-11-01; docs/V5_CHAPTER3_HARBOUR_2026-11-01.md):
// seven places in three stages through the sea gate, their dependencies, authored gold orders from
// chains the camp already has, a finished Chapter 2 save going on into it (keeping its board, shed,
// waiting rewards and energy), 21 stages to the end, full-board rewards, story cards seen once.
import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,load,act,item,allDone,upgrades,currentArea,stageOf,blockedStage,isSecondary,areaDone,totalBuilt,cog,token} from '../v5/next/game.mjs';
import {AREAS,STAGES,TASKS,LABELS} from '../v5/next/areas.mjs';
import {CHAINS,GENERATOR_CHAINS,maxTier} from '../v5/next/chains.mjs';

const H=AREAS[4],IDS=['hb-landing','hb-crane','hb-warehouse','hb-boatyard','hb-registry','hb-signal','hb-departure'];
const ok=(s,a,now=1000)=>{const r=act(s,a,now);assert.ok(r.ok,JSON.stringify(a)+' '+r.message);return r;};
const done=a=>Object.fromEntries(a.tasks.map(t=>[t.id,3]));
// A camp at the end of Chapter 2 (the sea gate open), as build 47v saved it: still in the Vault, its end
// card seen; a board, a shed, a waiting reward and energy to keep.
function chapter2Done({version=5,seenEnd=true}={}){
 const s=fresh(0);s.area=3;s.built={...done(AREAS[0]),...done(AREAS[1]),...done(AREAS[2]),...done(AREAS[3])};s.materials={...s.built};
 s.coins=3210;s.moves=4000;s.ordersDone=400;s.energy=77;s.level={version:1,level:31,xp:5};s.capPaid=120;s.boost={order:true,stage:true};
 s.daily={day:9e6,count:1};s.seen={door:true,'vault-open':true,archive:true,'obs-signal':true,'obs-harbour':true};if(seenEnd)s.seenEnd=true;
 s.shed[0]=item('rope',3);s.shed[1]=cog();s.pending=[token()];s.board[15]=item('shell',2);s.board[20]={type:'source',id:'optic'};
 for(const id of ['chart','rope','shell','lamp','optic'])if(!s.board.some(x=>x?.type==='source'&&x.id===id)){const i=s.board.findIndex(x=>x===null||x.type==='cargo');s.board[i]={type:'source',id};}
 if(version===4){s.version=4;delete s.capPaid;delete s.boost;}
 return s;
}
// As a player does: the gold order for the next stage delivered (its parts laid on the board), then the
// stage bought; parts the board cannot hold are cleared off first. Any open stage whose gold order stands.
function buyNext(s,log){
 const free=()=>s.board.reduce((a,x,i)=>x===null||x.type==='cargo'?[...a,i]:a,[]);
 const ups=upgrades(s);if(!ups.length)return null;
 let u=ups.find(u=>u.materials);
 if(!u){const o=s.orders.find(x=>x?.story&&ups.some(v=>v.id===x.story));assert.ok(o,'a gold order for an open stage: '+JSON.stringify(ups.map(v=>v.id+v.stage)));
  u=ups.find(v=>v.id===o.story);const f=free();let k=0;for(const r of o.needs)for(let c=0;c<r.count;c++)s.board[f[k++]]=item(r.family,r.tier);
  ok(s,{type:'deliver',id:o.id});log?.gold.push([u.id,u.stage,o.needs]);}
 const r=ok(s,{type:'restore',id:u.id});log?.stages.push([u.id,u.stage]);
 for(let i=0;i<s.board.length;i++)if(s.board[i]?.type==='item'&&free().length<6)s.board[i]=null;
 return r;
}

test('the Hidden Harbour: seven places in three stages, one reward and a line each, costs rising', ()=>{
 assert.equal(H.id,'harbour');assert.equal(H.name,'The Hidden Harbour');assert.ok(!H.coming);assert.ok(H.intro.length>=1);
 assert.equal(H.map,'coast/hidden-harbour/harbour-map-before');assert.equal(H.restored,'coast/hidden-harbour/harbour-map-after');
 assert.deepEqual(H.tasks.map(t=>t.id),IDS);assert.deepEqual(H.tasks.map(t=>t.art),IDS);
 assert.deepEqual(H.tasks.map(t=>t.stages.length),Array(7).fill(3));
 assert.ok(H.tasks.every(t=>t.stages[0].cost<t.stages[1].cost&&t.stages[1].cost<t.stages[2].cost),'each stage costs more');
 assert.deepEqual(H.tasks.map(t=>t.stages.map(x=>x.cost)),[[180,200,220],[200,230,260],[200,230,260],[240,270,300],[240,270,300],[260,290,320],[280,310,350]]);
 assert.equal(H.tasks.flatMap(t=>t.stages.map(x=>x.cost)).reduce((a,b)=>a+b),5410);
 for(const t of H.tasks)for(const [k,x] of t.stages.entries()){
  const last=t.id==='hb-departure'&&k===2;assert.equal(Object.keys(x.effect).length,last?0:1,`${x.name}: one reward (the launch ends the chapter)`);
  assert.ok(x.lines.length>=1,x.name);assert.ok(!x.level,'no level gate');}
 for(const id of IDS)assert.ok(LABELS[id],id);
 // rewards: energy, tokens, cogs and crates only (no generator copy, no new generator or currency)
 const kinds=new Set(H.tasks.flatMap(t=>t.stages.flatMap(x=>Object.keys(x.effect))));assert.deepEqual([...kinds].sort(),['cog','energy','kit','token']);
});

test('every stage names its gold order: chains the camp has, attainable tiers, never a rare extra', ()=>{
 const gens=new Set(Object.keys(GENERATOR_CHAINS)),used=new Set();
 for(const t of H.tasks)for(const x of t.stages){
  assert.ok(Array.isArray(x.gold)&&x.gold.length>=1&&x.gold.length<=2,`${x.name}: authored gold`);
  for(const [family,tier,count] of x.gold){
   assert.ok(CHAINS[family]&&!isSecondary(family),`${x.name}: ${family} is a primary chain`);assert.ok(gens.has(CHAINS[family].gen));
   assert.ok(family!=='flux','not the Echo Crucible (optional there)');
   assert.ok(tier>=2&&tier<=Math.min(4,maxTier(family)-1),`${x.name}: ${family}${tier} attainable`);assert.ok(count>=1&&count<=2);used.add(family);}}
 // the late generators get work too
 assert.deepEqual([...used].sort(),['chart','lamp','optic','rig','rope','shell']);
});

test('dependencies: landing first; crane and warehouse together; boatyard and registry after both; signal after the registry; the launch waits for the boat and the signal', ()=>{
 const s=load(JSON.stringify(chapter2Done()),5000);s.coins=50000;
 const open=()=>upgrades(s).map(u=>u.id+u.stage).sort();
 assert.deepEqual(open(),['hb-landing1']);
 const build=(id,n)=>{s.built[id]=n;s.materials[id]=n;};
 build('hb-landing',2);assert.deepEqual(open(),['hb-landing3']);
 assert.deepEqual(blockedStage(s,'hb-crane'),{stage:1,name:'Reinforce the crane',requires:{'hb-landing':3}});
 build('hb-landing',3);assert.deepEqual(open(),['hb-crane1','hb-warehouse1'],'two places open together');
 build('hb-crane',3);assert.deepEqual(open(),['hb-warehouse1'],'the boatyard waits for the warehouse too');
 assert.match(act(s,{type:'restore',id:'hb-boatyard'}).message,/opens once Recover the cargo and Sort the supplies is done/);
 build('hb-warehouse',3);assert.deepEqual(open(),['hb-boatyard1','hb-registry1']);
 assert.equal(blockedStage(s,'hb-signal').requires['hb-registry'],3);
 build('hb-boatyard',1);assert.deepEqual(open(),['hb-boatyard2','hb-departure1','hb-registry1'],'the jetty after the workbench');
 build('hb-departure',2);build('hb-boatyard',3);build('hb-registry',3);assert.deepEqual(open(),['hb-signal1'],'the launch waits for the signal');
 assert.deepEqual(blockedStage(s,'hb-departure'),{stage:3,name:'Launch the boat',requires:{'hb-boatyard':3,'hb-signal':3}});
 build('hb-signal',3);assert.deepEqual(open(),['hb-departure3']);
 // Chapters 1-2: the first stage of a place still waits for the place before it (the beach's tent)
 const c=fresh(0);c.materials={'beach-path':1,'beach-tent':1};c.coins=999;assert.ok(!upgrades(c).some(u=>u.id==='beach-tent'));
});

test('a finished Chapter 2 save goes on into the harbour, keeping its board, shed, rewards waiting and energy', ()=>{
 for(const version of [4,5])for(const seenEnd of [true,false]){
  const old=chapter2Done({version,seenEnd}),raw=JSON.stringify(old),board=JSON.stringify(old.board);
  const s=load(raw,5000),tag=`v${version} seenEnd ${seenEnd}`;
  assert.equal(s.area,4,tag);assert.equal(currentArea(s).id,'harbour');assert.notEqual(s.seenEnd,true,'the old end no longer marks the end');
  assert.equal(allDone(s),false);assert.equal(JSON.stringify(s.board),board,tag+': board unchanged');assert.deepEqual(s.shed,old.shed);assert.deepEqual(s.pending,old.pending);
  assert.equal(s.coins,3210);assert.equal(s.moves,4000);assert.equal(s.energy,77);assert.equal(s.level.level,31);assert.deepEqual(s.built,old.built);
  assert.deepEqual(s.orders.filter(o=>o?.story).map(o=>o.story),['hb-landing'],tag+': the landing\'s gold order');
  assert.deepEqual(s.seen,old.seen,'story cards already seen stay seen');
  assert.equal(JSON.stringify(load(JSON.stringify(s),6000)),JSON.stringify({...s,lastAt:s.lastAt}),'loading again changes nothing');}
});

test('all 21 stages, as a player buys them: every gold order as authored, never stuck, then Chapter 4 opens', ()=>{
 const s=load(JSON.stringify(chapter2Done()),5000);s.coins=60000;const log={gold:[],stages:[]};let guard=0;
 while(!areaDone(s,H)&&guard++<40)assert.ok(buyNext(s,log),'never stuck: '+JSON.stringify(upgrades(s)));
 assert.equal(areaDone(s,H),true);assert.equal(log.stages.length,21);
 // build 49a: the launch opens Chapter 4, the Answering Light, with its landing's gold order up
 assert.equal(s.area,5);assert.equal(allDone(s),false);assert.equal(s.orders.find(o=>o?.story)?.story,'ch4-landing');
 for(const [id,n,needs] of log.gold)assert.deepEqual(needs.map(r=>[r.family,r.tier,r.count]),TASKS[id].stages[n-1].gold,`${id} ${n}`);
 assert.deepEqual(log.stages.at(-1),['hb-departure',3],'the launch is last');
 assert.equal(totalBuilt(s),84,'63 stages in Chapters 1-2 and 21 here');
 // a reload at the end keeps it
 const t=load(JSON.stringify(s),9000);assert.equal(areaDone(t,H),true);assert.equal(t.area,5);
});

test('a harbour stage on a full board: energy at once, the crate, token or cog waits for space, once', ()=>{
 const s=load(JSON.stringify(chapter2Done()),5000);s.coins=50000;
 for(let i=0;i<s.board.length;i++)if(s.board[i]===null)s.board[i]=item('rig',0);s.shed=s.shed.map(()=>item('rig',0));
 const waiting=s.pending.length;
 s.materials['hb-landing']=3;s.built['hb-landing']=0;
 const e=s.energy,r1=ok(s,{type:'restore',id:'hb-landing'});assert.ok(r1.effects.energy>=0);assert.ok(s.energy>=e);
 const r2=ok(s,{type:'restore',id:'hb-landing'});assert.equal(r2.effects.token,-1,'the token waits');assert.equal(s.pending.length,waiting+1);
 const r3=ok(s,{type:'restore',id:'hb-landing'});assert.equal(r3.effects.kit,-1,'the crate waits');assert.equal(s.pending.length,waiting+2);
 // a reload keeps them waiting, once; space lets them land, once
 const t=load(JSON.stringify(s),6000);assert.equal(t.pending.length,waiting+2);
 for(const i of [3,4,5,6,7])t.board[i]=null;ok(t,{type:"recycle",index:t.board.findIndex(x=>x?.type==="item")});
 assert.equal(t.pending.length,0,'all landed');assert.equal(t.board.filter(x=>x?.type==='kit').length>=1,true);
});

test('the harbour\'s story cards are seen once and kept', ()=>{
 const s=load(JSON.stringify(chapter2Done()),5000);
 for(const id of ['hb-arrival','hb-cargo','hb-signal']){ok(s,{type:'seen',id});assert.match(act(s,{type:'seen',id}).message,/Already/);}
 const t=load(JSON.stringify(s),6000);assert.equal(t.seen['hb-arrival'],true);assert.equal(t.seen['hb-signal'],true);
});

test('a camp partway through the harbour loads as it was; a damaged stage still starts a new camp', ()=>{
 const s=load(JSON.stringify(chapter2Done()),5000);s.built['hb-landing']=3;s.built['hb-crane']=1;s.materials['hb-landing']=3;s.materials['hb-crane']=2;
 const t=load(JSON.stringify(s),6000);assert.equal(t.area,4);assert.deepEqual(t.built,s.built);assert.equal(t.moves,4000);
 const bad=structuredClone(s);bad.built['hb-crane']=4;assert.equal(load(JSON.stringify(bad),6000).moves,0);
});
