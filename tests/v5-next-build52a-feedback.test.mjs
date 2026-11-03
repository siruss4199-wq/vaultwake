// Coast Camp Build 52A player feedback (docs/V5_BUILD52A_ECONOMY_2026-11-03.md, "Player feedback").
// 1. A gold-first player (tests/v5-next-goldfirst-policy.mjs: builds, delivers the gold order, works only toward it;
//    crew orders only when coins are short or the board is nearly full; never buys) still needs crew orders:
//    in the first six stages and over Chapter 1, fresh and from a saved camp.
// 2. The first rare gold order is a Gear (Level 2) on the path's lanterns (beach path stage 3): after the Rivet
//    Rover reaches Level 2, before the Survey Kite (Rover Level 3), never on luck, never followed by another.
// 3. It is achievable without a long stall, and nobody runs out of energy or gets stuck.
// 4. Saves, the guide's opening and Build 52A's other rules are unchanged (the rest of the suite covers them too).
import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../v5/next/game.mjs';
import {fresh,load,act,item,totalBuilt,isSecondary,GOLD_PAY,goldPrice} from '../v5/next/game.mjs';
import {TASKS} from '../v5/next/areas.mjs';
import {primaryAction} from '../v5/next/guide.mjs';
import {nextAction} from './v5-next-policy.mjs';
import {simulate} from './v5-next-economy-sim.mjs';
import {makeGoldFirst} from './v5-next-goldfirst-policy.mjs';

const MIN=60000;
const POLICIES={strict:makeGoldFirst(g,primaryAction,nextAction),opportunist:makeGoldFirst(g,primaryAction,nextAction,{opportunist:true})};
// One run to the end of Chapter 1 (or to `stop`), recording coins by source, the first rare gold order, the
// Survey Kite's arrival, the Gear order's wait and the Rover taps it took. save: the camp is played by the
// ordinary scripted player to `save` stages, saved and loaded, then played gold-first.
function run(policy,speed,seed,{save=0,stop=s=>s.area>=3}={}){
 const m={coins:{gold:0,crew:0,other:0},first6:{gold:0,crew:0,other:0,crewOrders:0},restores:0,short6:0,rare:[],kite:null,gear:null,lv2:null,loaded:false};
 const waiting=new Set();
 const proxy={...g,act(s,a,t){const c0=s.coins,o=a.type==='deliver'?s.orders.find(x=>x?.id===a.id):null,r=g.act(s,a,t);if(!r.ok)return r;
  const d=s.coins-c0,k=o?(o.story?'gold':'crew'):'other';if(d>0){m.coins[k]+=d;if(m.restores<6)m.first6[k]+=d;}
  if(o&&!o.story&&m.restores<6)m.first6.crewOrders++;
  if(m.gear&&!m.gear.out&&a.type==='produce'&&a.id==='rig')m.gear.taps++;
  if(o&&m.gear&&o.id===m.gear.id)m.gear.out=t;
  if(r.event==='restore')m.restores++;
  return r;}};
 const play=s=>save&&!m.loaded?nextAction(s):policy(s);
 const onStep=(s,t)=>{
  if(save&&!m.loaded&&totalBuilt(s)>=save){Object.assign(s,load(JSON.stringify(s),t));m.loaded=true;}
  if(m.lv2===null&&s.board.some(x=>x?.type==='source'&&x.id==='rig'&&(x.level??1)>=2))m.lv2=t;
  if(!m.kite&&s.board.some(x=>x?.type==='source'&&x.id==='chart'))m.kite=t;
  for(const u of g.upgrades(s))if(u.materials&&!waiting.has(u.id+u.stage)){waiting.add(u.id+u.stage);if(m.restores<6&&s.coins<u.cost)m.short6++;}
  const gold=s.orders.find(o=>o?.story);
  if(gold&&gold.needs.some(n=>isSecondary(n.family))&&!m.rare.some(x=>x.id===gold.id)){
   m.rare.push({id:gold.id,story:gold.story,stage:(s.built[gold.story]??0)+1,needs:gold.needs.map(n=>[n.family,n.tier,n.count]),at:t,kiteOut:!!m.kite,lv2:m.lv2!==null});
   if(!m.gear)m.gear={id:gold.id,at:t,taps:0,out:null};}};
 const res=simulate(proxy,play,speed,seed,{until:24*3600e3,shop:false,onStep,finish:stop});
 return {...m,res};
}
const share=c=>c.crew/Math.max(1,c.gold+c.crew+c.other);

// Measured (tests/v5-next-goldfirst-metrics.mjs, 4/5/8/10 s, 10 seeds): crew orders bring 27-30 % of a gold-first
// player's coins over the first six stages (52A before this: 21-23 %) and 47-50 % over Chapter 1.
test('gold-first play, fresh camp: crew orders pay a real part of the first six stages and about half of Chapter 1', ()=>{
 for(const [name,policy] of Object.entries(POLICIES))for(const speed of [5,8])for(const seed of [1,2]){
  const r=run(policy,speed,seed),at=`${name} ${speed} s seed ${seed}`;
  assert.ok(r.res.finished,`${at}: Chapter 1 finished`);
  assert.ok(share(r.first6)>=.24,`${at}: crew orders ${(100*share(r.first6)).toFixed(0)} % of the first six stages' coins`);
  assert.ok(r.first6.crewOrders>=3,`${at}: ${r.first6.crewOrders} crew orders in the first six stages`);
  assert.ok(share(r.coins)>=.4,`${at}: crew orders ${(100*share(r.coins)).toFixed(0)} % of Chapter 1's coins`);}
 // the strict gold-first player meets a stage it cannot pay for with gold coins alone in the opening
 const strict=run(POLICIES.strict,5,1);assert.ok(strict.short6>=1,'a stage waits for crew coins in the first six');
});

test('gold-first play from a saved camp (two stages built, saved, loaded): crew orders still pay their part', ()=>{
 for(const [name,policy] of Object.entries(POLICIES)){const r=run(policy,5,3,{save:2}),at=`${name} from a save`;
  assert.ok(r.loaded&&r.res.finished,`${at}: loaded and Chapter 1 finished`);
  assert.ok(share(r.first6)>=.24,`${at}: crew orders ${(100*share(r.first6)).toFixed(0)} % of the first six stages' coins`);
  assert.ok(share(r.coins)>=.4,`${at}: crew orders ${(100*share(r.coins)).toFixed(0)} % of Chapter 1's coins`);
  assert.deepEqual(r.rare[0].needs.find(n=>n[0]==='mech'),['mech',1,1],`${at}: the lanterns' Gear is asked after the load`);}
});

test('the first rare gold order is the lanterns\' Gear: after Rover Level 2, before the Survey Kite, never two rare gold orders in a row', ()=>{
 const stage=TASKS['beach-path'].stages[2];assert.deepEqual(stage.rare,['mech',1]);assert.equal(stage.name,'Line the path with lanterns');
 for(const [name,policy] of Object.entries({normal:nextAction,...POLICIES}))for(const speed of [4,10])for(const seed of [1,2]){
  const r=run(policy,speed,seed,{stop:s=>totalBuilt(s)>=9}),at=`${name} ${speed} s seed ${seed}`,first=r.rare[0];
  assert.ok(first,`${at}: a rare gold order in the first nine stages`);
  assert.equal(first.story+' '+first.stage,'beach-path 3',`${at}: the first is the path's lanterns`);
  assert.deepEqual(first.needs.find(n=>n[0]==='mech'),['mech',1,1],`${at}: a Gear (Level 2), never a single Bolt`);
  assert.ok(first.lv2,`${at}: asked only once a Level 2 Rover is out`);
  assert.ok(!first.kiteOut&&r.kite&&first.at<r.kite,`${at}: before the Survey Kite (${(first.at/MIN).toFixed(1)} against ${(r.kite/MIN).toFixed(1)} min)`);
  // the gold order after it asks no rare part (the next rare one, the pier's crane, comes stages later)
  if(r.rare[1])assert.ok(r.rare[1].story!=='beach-path'&&r.rare[1].at>r.gear.out,`${at}: not right after`);}
});

// Measured, 10 seeds: the Gear order is out 2.5-6.7 min for the scripted player (the path's third stage took
// 2.6-6.8 before), 3.0-8.3 min for the strict gold-first player and 3.8-12.1 min for the opportunist (the order's
// four Level-4 parts and a crew order wanting a Gear too); at most 32 Rover taps; the guaranteed drop (goldPity 8)
// makes each Bolt within 8 eligible taps.
test('the lanterns\' Gear is achievable without a long stall: bounded time and Rover taps, at every speed', ()=>{
 for(const [name,policy] of Object.entries({normal:nextAction,...POLICIES}))for(const speed of [4,5,8,10]){
  const r=run(policy,speed,3,{stop:s=>totalBuilt(s)>=4}),at=`${name} ${speed} s`,gear=r.gear;
  assert.ok(gear?.out,`${at}: the Gear order is delivered`);
  const wait=(gear.out-gear.at)/MIN;
  assert.ok(wait<=speed*1.3,`${at}: the Gear order took ${wait.toFixed(1)} min`);
  assert.ok(gear.taps<=40,`${at}: ${gear.taps} Rover taps while it was up`);}
 assert.equal(g.SECONDARY_RULES.rig.goldPity,8,'the gold objective guarantee is unchanged');
});

test('no energy starvation and no stuck board for a gold-first player, fresh or saved', ()=>{
 for(const [name,policy] of Object.entries(POLICIES))for(const [speed,seed,save] of [[4,1,0],[10,2,0],[5,4,2]]){
  const r=run(policy,speed,seed,{save}),at=`${name} ${speed} s seed ${seed}${save?' from a save':''}`;
  const starve=r.res.starve.reduce((a,b)=>a+b,0)/MIN;
  assert.ok(r.res.finished,`${at}: Chapter 1 finished`);
  assert.ok(starve<=3,`${at}: ${starve.toFixed(1)} min with no energy`);
  assert.ok(r.res.longestIdle<=3*MIN,`${at}: idle ${(r.res.longestIdle/MIN).toFixed(1)} min at a time`);}
});

test('saves and the opening: a saved lanterns order keeps its recipe and coins; the guide\'s gold order still pays 70', ()=>{
 // a 52A camp saved with the boardwalk built and the lanterns' gold order already up (no Gear in it)
 const s=fresh(0);s.built={'beach-path':2};s.materials={'beach-path':2};s.orderSeq=9;s.board[20]={...g.source('rig'),level:2};
 s.orders[0]={id:'o8',who:'ivo',needs:[{family:'rig',tier:3,count:1},{family:'rig',tier:2,count:2}],coins:40,story:'beach-path'};
 const t=load(JSON.stringify(s),5000);
 assert.deepEqual(t.orders[0].needs,s.orders[0].needs,'the saved order keeps its parts');assert.equal(t.orders[0].coins,40,'and its coins');
 // delivered as saved, the stage builds as before
 let k=0;const free=t.board.flatMap((x,i)=>x===null?[i]:[]);for(const n of t.orders[0].needs)for(let c=0;c<n.count;c++)t.board[free[k++]]=item(n.family,n.tier);
 assert.ok(act(t,{type:'deliver',id:'o8'},6000).ok);t.coins=500;assert.ok(act(t,{type:'restore',id:'beach-path'},7000).ok);assert.equal(t.built['beach-path'],3);
 // the guide's opening: three fixed crew orders, then the first gold order at 70
 const f=fresh(0);assert.deepEqual(f.orders.filter(Boolean).map(o=>o.needs.map(n=>[n.family,n.tier,n.count])),[[['rig',2,1]],[['rig',3,1]],[['rig',2,1],['rig',1,2]]].slice(0,f.orders.filter(Boolean).length));
 assert.equal(goldPrice(fresh(0),[{family:'rig',tier:3,count:1},{family:'rig',tier:2,count:2}]),70);
 assert.equal(GOLD_PAY.openingRate,1.5);
});
