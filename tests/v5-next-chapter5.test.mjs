// Coast Camp Chapter 5, the Lowwater Passage (build 50a, 2026-11-02; docs/V5_CHAPTER5_LOWWATER_PASSAGE_2026-11-02.md):
// seven places in three stages on the reef route, in one line (each place opens when the one before is
// fully restored), fixed gold recipes (three with a merged rare part, never lowered), a finished Chapter 4
// save going on into it (board, shed, waiting rewards, energy above capacity, active orders and material
// credits kept; seen flags per card), an unfinished Chapter 4 save staying put, all 21 stages bought once
// and charged once, full-board kits, story flags once, and reloads that change nothing.
import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,load,act,item,allDone,upgrades,stageOf,blockedStage,areaDone,totalBuilt,cog,token,goldChase,makeOrder,source,ROVER,capacityOf,SEEN_ID,cogRoom,MAX_GENERATOR_LEVEL,GENERATOR_ORDER} from '../v5/next/game.mjs';
import {AREAS,STAGES,TASKS,LABELS} from '../v5/next/areas.mjs';
import {CHAINS,maxTier} from '../v5/next/chains.mjs';

const P=AREAS[6],IDS=['ch5-landing','ch5-causeway','ch5-gauge','ch5-bridge','ch5-shelter','ch5-desk','ch5-lock'];
const ok=(s,a,now=1000)=>{const r=act(s,a,now);assert.ok(r.ok,JSON.stringify(a)+' '+r.message);return r;};
const done=a=>Object.fromEntries(a.tasks.map(t=>[t.id,3]));
// A camp at the end of Chapter 4 (the relay's message read), as build 49a saved it: still on the
// headland, its end card seen (seenEnd) or not; a board with both level-2 rare generators, a shed, a
// waiting reward, energy above its capacity, an active crew order and Chapter 4's story cards seen.
function chapter4Done({seenEnd=true}={}){
 const s=fresh(0);s.area=5;s.built=Object.assign({},...AREAS.slice(0,6).map(done));s.materials={...s.built};
 s.coins=944;s.moves=8000;s.ordersDone=700;s.energy=141;s.level={version:1,level:29,xp:7};s.capPaid=100;s.boost={order:true,stage:true};
 s.daily={day:9e6,count:1};s.seen={door:true,'vault-open':true,archive:true,'obs-signal':true,'obs-harbour':true,'hb-arrival':true,'hb-cargo':true,'hb-signal':true,'hb-launch':true,'ch4-arrival':true,'ch4-log':true,'ch4-light':true};if(seenEnd)s.seenEnd=true;
 s.secOpen={rig:true,chart:true};s.found.push('mech0','mech1','mech2','notes0','notes1','notes2');
 s.board[ROVER]={...source('rig'),level:2};
 for(const id of ['chart','rope','shell','lamp','optic'])if(!s.board.some(x=>x?.type==='source'&&x.id===id)){const i=s.board.findIndex(x=>x===null||x.type==='cargo');s.board[i]={type:'source',id};}
 const kite=s.board.findIndex(x=>x?.type==='source'&&x.id==='chart');s.board[kite]={...source('chart'),level:2};
 s.shed[0]=item('optic',3);s.shed[1]=cog();s.pending=[token()];s.board[15]=item('lamp',1);
 s.orders=s.orders.map((o,k)=>k===1?{...o,needs:[{family:'rope',tier:2,count:1}]}:o);
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
const entry=()=>{const s=load(JSON.stringify(chapter4Done()),5000);s.board[15]=null;s.coins=90000;return s;};

test('the Lowwater Passage: seven places in three stages, stable ids, a line each, costs rising, earlier chapters untouched', ()=>{
 assert.equal(P.id,'lowwater');assert.equal(P.name,'The Lowwater Passage');assert.ok(P.intro.length>=1);
 assert.deepEqual(P.tasks.map(t=>t.id),IDS);assert.ok(P.tasks.every(t=>t.stages.length===STAGES&&t.art===t.id));
 assert.ok(P.tasks.every(t=>t.stages.every(x=>x.lines.length===1&&x.cost>0)));
 assert.ok(P.tasks.every(t=>t.stages[0].cost<t.stages[1].cost&&t.stages[1].cost<t.stages[2].cost),'each stage costs more');
 assert.deepEqual(AREAS.map(a=>a.id),['beach','worksite','entrance','vault','harbour','answering-light','lowwater']);
 assert.equal(Object.keys(TASKS).length,42);for(const id of IDS)assert.equal(TASKS[id].area,'lowwater');
 assert.ok(IDS.every(id=>LABELS[id]),'every place has a label');
 for(const t of P.tasks){assert.deepEqual(t.stages[0].effect,{});assert.deepEqual(t.stages[1].effect,{});
  const k=t.stages[2].effect.kit;assert.ok(k&&k[1]===2&&CHAINS[k[0]]&&!CHAINS[k[0]].secondary,t.id);}
 assert.ok(P.tasks.every(t=>t.stages.every(x=>!x.effect.energy&&!x.effect.coins&&!x.effect.source)),'no energy, coin or generator reward');
 // build 50b prices (doc: measured against Chapter 4): the pack's 7,665 times 0.9, then 0.8 as the merge goals grew
 assert.equal(P.tasks.reduce((n,t)=>n+t.stages.reduce((m,x)=>m+x.cost,0),0),5520);
});

test('one line: each place opens when the one before is fully restored; never two places open at once', ()=>{
 const req=Object.fromEntries(P.tasks.flatMap(t=>t.stages.map((x,k)=>[t.id+(k+1),x.requires??null])));
 for(const [k,id] of IDS.entries()){assert.deepEqual(req[id+1],k?{[IDS[k-1]]:3}:null,id);assert.equal(req[id+2],null);assert.equal(req[id+3],null);}
 const s=entry();let guard=0;
 while(!areaDone(s,P)&&guard++<30){const open=upgrades(s).map(u=>u.id);assert.equal(open.length,1,JSON.stringify(open));buyNext(s);}
 assert.equal(guard,21);
 // the aim action cannot jump the line
 const t=entry();assert.equal(act(t,{type:'aim',id:'ch5-gauge'}).ok,false);
 const b=blockedStage(t,'ch5-causeway');assert.deepEqual(b.requires,{'ch5-landing':3});
});

test('fixed gold recipes: two requirements each, active chains below the top, no stage repeating the one before, the three rare parts as authored, never lowered', ()=>{
 const rare=[];
 for(const t of P.tasks)for(const [k,x] of t.stages.entries()){
  assert.equal(x.gold.length,2,`${t.id} ${k+1}: two requirements`);assert.ok(!x.rare,'no dynamic rare swap');
  for(const [f,tier,n] of x.gold){assert.ok(CHAINS[f],f);assert.ok(Number.isInteger(tier)&&tier>=0&&tier<maxTier(f),`${t.id} ${k+1}: ${f}${tier} below the top`);assert.ok(n===1||n===2&&!CHAINS[f].secondary,`${t.id} ${k+1}: one or two of a common part, one rare`);
   if(CHAINS[f].secondary)rare.push([t.id,k+1,f,tier]);
   assert.ok(['rig','rope','shell','lamp','chart','optic','mech','notes'].includes(f),'only active chains');}}
 assert.deepEqual(rare,[['ch5-gauge',3,'notes',1],['ch5-shelter',2,'mech',1],['ch5-desk',3,'notes',2]]);
 // build 50b: no two stages in a row (within the chapter's one line) ask the same parts, and each place's
 // later stages ask more drops than its first (a rare part counted as the drops it takes)
 const key=x=>JSON.stringify(x.gold),all=P.tasks.flatMap(t=>t.stages);
 for(let i=1;i<all.length;i++)assert.notEqual(key(all[i]),key(all[i-1]),`${all[i].name} repeats ${all[i-1].name}`);
 assert.equal(new Set(all.map(key)).size,all.length,'every recipe its own');
 const drops=x=>x.gold.reduce((n,[f,t,c])=>n+c*2**t,0);
 for(const t of P.tasks)if(!t.stages.some(x=>x.gold.some(([f])=>CHAINS[f].secondary)))assert.ok(drops(t.stages[0])<drops(t.stages[1])&&drops(t.stages[1])<drops(t.stages[2]),t.id);
 // the shelter's Gear asked whatever the player holds: nothing, a Bolt, a Gear, or a Gear assembly
 const base=entry();for(let k=0;k<13;k++)buyNext(base);assert.equal(stageOf(base,'ch5-shelter'),1);
 for(const held of [[],[['mech',0]],[['mech',1]],[['mech',2]]]){const s=structuredClone(base);
  for(const [f,t] of held)s.board[s.board.findIndex(x=>x===null)]=item(f,t);
  s.orders=s.orders.map(o=>o?.story?null:o);const lane=s.orders.indexOf(null);s.orders[lane]=makeOrder(s);
  assert.deepEqual(s.orders[lane].needs,[{family:'lamp',tier:3,count:1},{family:'mech',tier:1,count:1}],JSON.stringify(held));}
 // the gold objective's guarantee covers it while no Gear can be made from what is held
 const s=structuredClone(base);assert.equal(s.orders.find(o=>o?.story)?.story,'ch5-shelter');assert.ok(goldChase(s,'mech'));
});

test('a finished Chapter 4 save enters Chapter 5: board, shed, rewards, energy, orders and credits kept; arrival to come; message seen once', ()=>{
 for(const seenEnd of [true,false]){
  const old=chapter4Done({seenEnd}),s=load(JSON.stringify(old),5000);
  assert.equal(s.area,6,'in the Lowwater Passage');assert.equal(s.seenEnd,undefined,'Chapter 4\'s end is not the camp\'s end');
  assert.equal(s.seen['ch5-arrival'],undefined,'the Chapter 5 arrival is still to come');
  assert.equal(!!s.seen['ch4-message'],seenEnd,'a camp that saw Chapter 4\'s end card has seen the message; one that did not, will');
  assert.equal(s.seen['hb-launch'],true);assert.equal(s.seen['ch4-light'],true);
  assert.equal(s.coins,944);assert.equal(s.energy,141,'energy above capacity kept');assert.equal(capacityOf(s),100);
  assert.deepEqual(s.shed.slice(0,2),old.shed.slice(0,2));assert.deepEqual(s.pending,old.pending);assert.deepEqual(s.board[15],old.board[15]);
  assert.equal(s.board[ROVER].level,2);assert.deepEqual(s.secOpen,{rig:true,chart:true});
  for(const id of Object.keys(old.built))assert.equal(s.built[id],3);for(const id of IDS)assert.equal(stageOf(s,id),0);
  assert.ok(s.orders.some(o=>o?.needs?.length===1&&o.needs[0].family==='rope'&&o.needs[0].tier===2),'the active crew order kept');
  assert.equal(s.orders.find(o=>o?.story)?.story,'ch5-landing','the landing\'s gold order up');
  assert.deepEqual(upgrades(s).map(u=>u.id),['ch5-landing']);
  const t=load(JSON.stringify(s),9000);assert.equal(t.area,6);assert.deepEqual(t.seen,s.seen);assert.deepEqual(t.orders,s.orders);assert.equal(t.energy,141);
 }
});

test('an unfinished Chapter 4 save stays on the headland: nothing of Chapter 5 opens, no flag is set', ()=>{
 const s=chapter4Done({seenEnd:false});s.built['ch4-relay']=2;s.materials['ch4-relay']=2;
 const t=load(JSON.stringify(s),5000);assert.equal(t.area,5);assert.deepEqual(upgrades(t).map(u=>u.id),['ch4-relay']);
 assert.equal(t.seen['ch4-message'],undefined);for(const id of IDS)assert.equal(stageOf(t,id),0);
 assert.equal(act(t,{type:'restore',id:'ch5-landing'}).ok,false);
});

test('all 21 stages as a player buys them: each gold order as authored, each stage charged once, the lock last, then the end', ()=>{
 const s=entry();const log={gold:[],stages:[],paid:[]};let guard=0;
 while(!allDone(s)&&guard++<40)assert.ok(buyNext(s,log),'never stuck: '+JSON.stringify(upgrades(s)));
 assert.equal(allDone(s),true);assert.equal(areaDone(s,P),true);assert.equal(s.area,6);assert.equal(log.stages.length,21);
 for(const [id,n,needs] of log.gold)assert.deepEqual(needs.map(r=>[r.family,r.tier,r.count]),TASKS[id].stages[n-1].gold,`${id} ${n}`);
 for(const [k,[id,n]] of log.stages.entries())assert.equal(log.paid[k],TASKS[id].stages[n-1].cost,`${id} ${n}: charged its cost once`);
 assert.deepEqual(log.stages.at(-1),['ch5-lock',3],'the inner lock is last');
 assert.equal(new Set(log.stages.map(x=>x.join())).size,21,'each stage once');
 assert.equal(totalBuilt(s),126,'105 stages before and 21 here');assert.ok(!s.orders.some(o=>o?.story),'no gold order left');
 const t=load(JSON.stringify(s),9000);assert.equal(allDone(t),true);
 for(const id of IDS)assert.equal(act(t,{type:'restore',id},9000).ok,false);
 // the end card is marked once
 ok(t,{type:'seenEnd'});assert.equal(act(t,{type:'seenEnd'}).ok,false);assert.equal(load(JSON.stringify(t),9500).seenEnd,true);
});

test('a stage-3 kit on a full board waits for space, once; nothing is given twice across a reload', ()=>{
 const s=entry();for(let k=0;k<2;k++)buyNext(s);
 const gold=s.orders.find(o=>o?.story);for(const r of gold.needs)for(let c=0;c<r.count;c++)s.board[s.board.findIndex(x=>x===null||x.type==='cargo')]=item(r.family,r.tier);ok(s,{type:'deliver',id:gold.id});
 s.board=s.board.map(x=>x===null||x.type==='cargo'?item('shell',0):x);const pend=s.pending.length;
 ok(s,{type:'restore',id:'ch5-landing'});assert.equal(stageOf(s,'ch5-landing'),3);
 assert.ok(s.pending.length>pend,'the kit waits for space');const t=load(JSON.stringify(s),9000);assert.equal(t.pending.length,s.pending.length,'kept once');
 assert.equal(act(t,{type:'restore',id:'ch5-landing'}).ok,false);
});

test('story flags: each Chapter 5 card id is a valid seen flag, marked once, kept across a reload', ()=>{
 const s=entry();
 for(const id of ['ch4-message','ch5-arrival','ch5-crossing','ch5-ledger']){assert.ok(SEEN_ID.test(id));
  if(!s.seen[id])ok(s,{type:'seen',id});assert.equal(act(s,{type:'seen',id}).ok,false,`${id} once`);}
 const t=load(JSON.stringify(s),9000);for(const id of ['ch5-arrival','ch5-crossing','ch5-ledger'])assert.equal(t.seen[id],true);
 assert.equal(t.area,6);assert.deepEqual(upgrades(t).map(u=>u.id),['ch5-landing'],'seeing a card moves nothing on');
});

test('build 50b: a favour pays a Tide token, not a Brass cog, once no generator can take another level; cogs held stay', ()=>{
 const favours=s=>{const out=[];for(let k=0;k<36;k++){const o=makeOrder(s);if(o.bonus)out.push(o.bonus);}return out;};
 // every generator at its top level, as Chapters 4 and 5 measured: no cog
 const top=entry();for(const x of top.board)if(x?.type==='source')x.level=MAX_GENERATOR_LEVEL;for(const x of top.shed)if(x?.type==='source')x.level=MAX_GENERATOR_LEVEL;
 assert.ok(cogRoom(top)<=0);const b=favours(structuredClone(top));assert.ok(b.includes('token'));assert.ok(!b.includes('cog'),JSON.stringify(b));
 // a generator one level short, with no cog held: favours pay cogs again
 const low=structuredClone(top);const g=low.board.findIndex(x=>x?.type==='source');low.board[g].level=MAX_GENERATOR_LEVEL-1;
 for(const arr of [low.board,low.shed,low.pending])for(let i=0;i<arr.length;i++)if(arr[i]?.type==='cog')arr[i]=null;
 assert.equal(cogRoom(low),1);assert.ok(favours(structuredClone(low)).includes('cog'));
 // that one level covered by a cog already held: no more cogs
 low.board[low.board.findIndex(x=>x===null)]=cog();assert.equal(cogRoom(low),0);assert.ok(!favours(structuredClone(low)).includes('cog'));
 // nothing held is taken away: the shed's cog from the save stays across a reload
 const t=load(JSON.stringify(top),9000);assert.deepEqual(t.shed[1],cog());assert.equal(t.board.filter(x=>x?.type==='cog').length,top.board.filter(x=>x?.type==='cog').length);
});
