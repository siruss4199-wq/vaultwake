// Build 52A (docs/V5_BUILD52A_ECONOMY_2026-11-03.md): rare demand, crates, Clear and the coins of gold and crew
// orders, as rules and as a short simulation. Displayed levels are internal tiers + 1 (Level 1 = tier 0).
import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../v5/next/game.mjs';
import {nextAction} from './v5-next-policy.mjs';
import {simulate} from './v5-next-economy-sim.mjs';
import {TASKS,AREAS} from '../v5/next/areas.mjs';
import {KIT_DROPS,kit} from '../v5/kits.mjs';
import {CHAINS,maxTier,GENERATOR_CHAINS,SECONDARY_OF} from '../v5/next/chains.mjs';
const {fresh,act,load,item,source,secondaryNeed,storyTarget,crateDrop,clearRefund,displayLevel,partValue,RARE_COINS,CRATE_DROPS,GOLD_PAY,ROLE_PAY,isSecondary}=g;
const ok=(s,a,now=1000)=>{const r=act(s,a,now);assert.ok(r.ok,JSON.stringify(a)+' '+r.message);return r;};
const MIN=60000;

// one short whole-game run per seed at 5 s/action, recording the orders as they appear and the coins they pay
function play(seed){
 const out={rare:{crew:{},gold:{}},l1AfterIntro:0,first6:{gold:0,crew:0,crewOrders:0},coins:{gold:0,crew:0},rareGoldRun:0,maxRareGoldRun:0,restores:0};
 const seen=new Set(),intro=new Set();
 const proxy={...g,act(s,a,t){const before=a.type==='deliver'?s.orders.find(o=>o?.id===a.id):null,r=g.act(s,a,t);
  if(r.ok&&before){const k=before.story?'gold':'crew';out.coins[k]+=before.coins;if(out.restores<6){out.first6[k]+=before.coins;if(!before.story)out.first6.crewOrders++;}
   if(before.story){const hard=before.needs.some(n=>isSecondary(n.family)&&n.tier>=2);out.rareGoldRun=hard?out.rareGoldRun+1:before.needs.some(n=>isSecondary(n.family))?out.rareGoldRun:0;out.maxRareGoldRun=Math.max(out.maxRareGoldRun,out.rareGoldRun);}}
  if(r.ok&&r.event==='restore')out.restores++;return r;}};
 const onStep=s=>{for(const o of s.orders){if(!o||seen.has(o.id))continue;seen.add(o.id);const k=o.story?'gold':'crew';
  for(const n of o.needs)if(isSecondary(n.family)){const lv='L'+displayLevel(n.tier);out.rare[k][lv]=(out.rare[k][lv]??0)+1;if(n.tier===0){if(intro.has(n.family))out.l1AfterIntro++;else intro.add(n.family);}}}};
 const m=simulate(proxy,nextAction,5,seed,{until:24*3600e3,shop:true,onStep,finish:s=>g.allDone(s)});
 return {...out,finished:m.finished,total:m.total};
}
const runs=[1,2,3].map(play);

test('displayed levels: Level 1 is tier 0; rare parts pay for the drops they take (Level 1 10, Level 2 35, Level 3 70)', ()=>{
 assert.equal(displayLevel(0),1);assert.equal(displayLevel(2),3);
 assert.deepEqual(RARE_COINS.slice(0,3),[10,35,70]);
 for(let t=0;t<3;t++)assert.equal(partValue({family:'mech',tier:t,count:1}),RARE_COINS[t]);
 // more than twice the level below: a Level 2 takes two drops, a Level 3 four
 assert.ok(RARE_COINS[1]>2*RARE_COINS[0]&&RARE_COINS[2]>=2*RARE_COINS[1]);
});

test('rare demand: Level 1 is asked once per chain (its introduction), then Level 2 and Level 3 merge goals, in crew and gold orders', ()=>{
 for(const r of runs){
  assert.ok(r.finished);
  assert.equal(r.l1AfterIntro,0,'no Level 1 rare ask after the introduction');
  assert.ok((r.rare.crew.L1??0)<=2,`two introductions at most: ${JSON.stringify(r.rare.crew)}`);
  assert.ok((r.rare.crew.L2??0)>=30&&(r.rare.crew.L3??0)>=10,`crew merge goals: ${JSON.stringify(r.rare.crew)}`);
  assert.equal(r.rare.gold.L1??0,0,'gold orders never ask Level 1');assert.ok((r.rare.gold.L2??0)>=10&&(r.rare.gold.L3??0)>=6,`gold: ${JSON.stringify(r.rare.gold)}`);
  assert.ok(r.maxRareGoldRun<=1,`difficult rare gold orders in a row: ${r.maxRareGoldRun}`);}
});

test('a single Level 1 rare part held is asked as the Level 2 it merges into, never as itself', ()=>{
 const s=fresh(0);s.board[21]={...source('rig'),level:2};s.secOpen={rig:true};s.found.push('mech0');s.built={'beach-path':1};s.materials={...s.built};
 s.board[15]=item('mech',0);s.recent=['rig1x1','rig2x1'];
 const r=secondaryNeed(s,50,10);assert.equal(r?.family,'mech');assert.equal(r.tier,1,JSON.stringify(r));
 s.board[16]=item('mech',0);const u=secondaryNeed(s,51,11);assert.deepEqual(u,{family:'mech',tier:1,count:1,use:true},'two Level 1 parts: the Level 2 they make now');
});

test('a difficult rare gold goal (Level 3) never follows a rare gold order while another place is open, in any chapter', ()=>{
 // Chapter 4 (Answering Light): the workshop's stage 2 asks a Gear assembly in its own recipe; the lighthouse's
 // stage 2 asks none. Everything else in the chapter is built.
 const s=fresh(0);s.area=5;for(const a of AREAS.slice(0,6))for(const t of a.tasks)s.built[t.id]=3;
 s.built['ch4-workshop']=1;s.built['ch4-lighthouse']=1;s.materials={...s.built};s.board[21]={...source('rig'),level:2};s.secOpen={rig:true};
 assert.deepEqual(g.upgrades(s).filter(u=>!u.materials).map(u=>u.id),['ch4-workshop','ch4-lighthouse']);
 assert.equal(storyTarget(s).id,'ch4-workshop','the cheaper place comes first as before');
 s.rareLast=true;assert.equal(storyTarget(s).id,'ch4-lighthouse','after a rare gold order, the Level 3 goal waits its turn');
 s.aim='ch4-workshop';assert.equal(storyTarget(s).id,'ch4-workshop','the player\'s own choice still wins');
 // the only open place: it comes next anyway (never a block)
 const t=structuredClone(s);delete t.aim;t.built['ch4-lighthouse']=3;t.materials={...t.built};assert.equal(storyTarget(t).id,'ch4-workshop');
});

test('crates: three sizes, each better than the last; merging pays; saved crates keep their size and parts', ()=>{
 for(const z of [1,2,3])assert.equal(CRATE_DROPS[z].length,KIT_DROPS[z].length,'same number of parts as before, so saved crates stay valid');
 const tiers=z=>CRATE_DROPS[z].filter(d=>d!=='rare'),worth=z=>tiers(z).reduce((n,t)=>n+2**t,0),avg=z=>tiers(z).reduce((a,b)=>a+b,0)/tiers(z).length;
 assert.ok(avg(1)<avg(2)&&avg(2)<avg(3),'the average part rises with the crate');
 assert.ok(Math.max(...tiers(1))<Math.max(...tiers(3)),'the trunk holds the best part');
 assert.ok(worth(2)>2*worth(1),'two Driftwood crates make a richer Sea chest');
 assert.ok(worth(3)+1>=2*worth(2)-2,'a trunk (with its rare part) is worth about two Sea chests, in fewer, better parts');
 // the trunk's rare part: only from an open rare chain whose drops are not resting, else an everyday part
 const s=fresh(0),box=kit('rig',3);box.left=1;
 assert.deepEqual(crateDrop(s,box),item('rig',2),'rare chain not open: a Level 3 everyday part');
 s.board[21]={...source('rig'),level:2};s.secOpen={rig:true};assert.deepEqual(crateDrop(s,box),item('mech',0),'open: a Level 1 rare part');
 for(let i=0;i<4;i++)s.board[30+i]=item('mech',0);assert.deepEqual(crateDrop(s,box),item('rig',2),'its drops resting (four held): an everyday part instead');
 // a chain without a rare chain never gets one
 const lamp=kit('lamp',3);lamp.left=1;assert.ok(!isSecondary(crateDrop(s,lamp).family));
 // every part is of the crate's chain (or its rare chain) and within the chain
 for(const fam of ['rig','chart','rope','shell','lamp'])for(const z of [1,2,3])for(let left=1;left<=KIT_DROPS[z].length;left++){
  const b=kit(fam,z);b.left=left;const x=crateDrop(s,b),chain=GENERATOR_CHAINS[fam][0][0];
  assert.ok(x.family===chain||x.family===SECONDARY_OF[fam],`${fam} ${z}: ${x.family}`);assert.ok(x.tier<=maxTier(x.family));}
 // a saved, partly opened trunk loads and opens
 const t=fresh(0);t.board[10]={type:'kit',family:'rig',size:3,left:2};const u=load(JSON.stringify(t),2000);assert.deepEqual(u.board[10],{type:'kit',family:'rig',size:3,left:2});
 const r=ok(u,{type:'openKit',index:10},3000);assert.equal(r.event,'kit');assert.equal(u.board[10].left,1);
});

test('Clear: no energy back for Levels 1-3 or any rare part, +1 at most from Level 4; tapping and clearing never makes energy', ()=>{
 for(const [x,e] of [[item('rig',0),0],[item('rig',1),0],[item('rig',2),0],[item('rig',3),1],[item('rope',6),1],[item('mech',0),0],[item('mech',2),0],[item('notes',3),0]])assert.equal(clearRefund(x),e,`${x.family}${x.tier}`);
 const s=fresh(0);s.energy=20;let now=1000;
 for(let n=0;n<15;n++){const r=ok(s,{type:'produce',id:'rig',index:21},now+=1000);ok(s,{type:'recycle',index:r.index},now+=1000);}
 assert.ok(s.energy<=5,`15 taps and clears: ${s.energy} energy left of 20`);
 const t=fresh(0);t.energy=10;t.board[15]=item('rig',3);const r=ok(t,{type:'recycle',index:15});assert.equal(r.energy,1);assert.equal(t.energy,11);
});

test('coins: gold orders bring the materials and less of the coins; crew orders are the main source; the tutorial\'s first gold order still pays 70', ()=>{
 assert.deepEqual(GOLD_PAY,{rate:1.1,early:2,earlyRate:0.9,opening:1,openingRate:1.5,mid:6,midRate:0.6});assert.deepEqual(ROLE_PAY,{quick:1.15,pair:1.32});
 // the guide's first gold order (1 Pocket winch + 2 Split spanners) is priced at the opening rate: 70, as in 51d
 assert.equal(g.goldPrice(fresh(0),[{family:'rig',tier:3,count:1},{family:'rig',tier:2,count:2}]),70);
 const second=fresh(0);second.built={'beach-path':1};assert.equal(g.goldPrice(second,[{family:'rig',tier:3,count:1},{family:'rig',tier:2,count:2}]),40,'stage 2: ×0.9');
 // player feedback: gold orders made with 2-5 stages built pay 0.6 of their parts' worth, then 1.1
 const mid=fresh(0);mid.built={'beach-path':2};assert.equal(g.goldPrice(mid,[{family:'rig',tier:3,count:1},{family:'rig',tier:2,count:2}]),25,'2 stages built: ×0.6');
 mid.built={'beach-path':3,'beach-tent':3};assert.equal(g.goldPrice(mid,[{family:'rig',tier:3,count:1},{family:'rig',tier:2,count:2}]),50,'6 stages built: ×1.1');
 for(const r of runs){
  const f6=r.first6.gold/(r.first6.gold+r.first6.crew),all=r.coins.gold/(r.coins.gold+r.coins.crew);
  assert.ok(r.first6.crewOrders>=3,`crew orders in the first six stages: ${r.first6.crewOrders}`);
  assert.ok(f6<=.85,`gold's share of the first six stages' coins: ${(f6*100).toFixed(0)} %`);
  assert.ok(all<=.4,`gold's share of all coins: ${(all*100).toFixed(0)} %`);
  assert.ok(r.total<=8*3600e3,`whole game ${(r.total/MIN).toFixed(0)} min`);}
});

test('saves: orders already on the board keep their coins and parts; nothing new is needed to load', ()=>{
 const s=fresh(0);s.orders[0]={...s.orders[0],coins:123};s.orders[1]={id:'o98',who:'ivo',needs:[{family:'mech',tier:0,count:1}],coins:20,role:'quick',born:0};
 s.orders[2]={id:'o99',who:'ivo',needs:[{family:'rig',tier:3,count:1},{family:'rig',tier:2,count:2}],coins:70,story:'beach-path'};
 const t=load(JSON.stringify(s),5000);
 assert.equal(t.orders[0].coins,123);assert.deepEqual(t.orders[1].needs,[{family:'mech',tier:0,count:1}],'a saved Level 1 rare order is kept and can still be delivered');
 assert.equal(t.orders[2].coins,70,'a saved gold order keeps what it was priced at');
});
