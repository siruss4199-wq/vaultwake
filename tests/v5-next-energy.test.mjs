// Coast Camp energy pass (build 47v, 2026-11-01; docs/V5_ENERGY_CAPACITY_2026-11-01.md): the refill
// capacity follows the player level, a capacity milestone pays its increase once, a new camp starts
// full and the first ordinary crew order and the first stage give +15 and +20 once; bonus energy is
// kept above the capacity (the refill rests there) up to 200, and a milestone reward past 200 is owed,
// never lost; saves from before the pass keep their energy and progress and are paid nothing again.
// Classic V5's energy (v5/energy.mjs) is unchanged.
import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,act,load,tick,item,source,makeOrder,isSecondary,DELIVERY_ENERGY,ONBOARDING,MAX_ENERGY,VERSION,ROVER} from '../v5/next/game.mjs';
import {CAPACITY,capacityAt,capacityOf,nextCapacity,settleEnergy,refillTimes,STORE_ENERGY,REFILL_EVERY,MAX_CAPACITY} from '../v5/next/energy.mjs';
import * as classic from '../v5/energy.mjs';
import {xpToNext} from '../v5/levels.mjs';

const MIN=60000;
// A tap on the Rover, its part cleared at once (so the board never fills).
const tap=(s,now=0)=>{const r=ok(s,{type:'produce',id:'rig'},now);s.board[r.index]=null;return r;};
const ok=(s,a,now=0)=>{const r=act(s,a,now);assert.ok(r.ok,`${JSON.stringify(a)}: ${r.message}`);return r;};
// An order on the board that the board can fill at once (its parts are put in free spaces).
function ready(s,needs,{coins=10,lane=0,story,role='quick'}={}){
 const o={id:'t'+(s.orderSeq++),who:'ivo',needs:needs.map(([family,tier])=>({family,tier,count:1})),coins,role,...(story?{story}:{})};
 s.orders[lane]=o;for(const [family,tier] of needs)s.board[s.board.indexOf(null)]=item(family,tier);return o;}
const atLevel=(s,level,xp=0)=>{s.level={version:1,level,xp};s.capPaid=capacityAt(level);return s;};
// XP for exactly reaching a level from the start of another (deliveries pay a fifth of their coins).
const xpBetween=(from,to)=>{let n=0;for(let l=from;l<to;l++)n+=xpToNext(l);return n;};

test('capacity: every boundary of the table, the next milestone and the maximum',()=>{
 const want=[[1,50],[2,50],[3,60],[4,60],[5,70],[7,70],[8,80],[11,80],[12,90],[16,90],[17,100],[22,100],[23,110],[29,110],[30,120],[31,120],[99,120]];
 for(const [l,c] of want)assert.equal(capacityAt(l),c,`level ${l}`);
 assert.deepEqual(CAPACITY.map(([l])=>l),[1,3,5,8,12,17,23,30]);
 assert.deepEqual(nextCapacity(1),{level:3,capacity:60});assert.deepEqual(nextCapacity(4),{level:5,capacity:70});
 assert.deepEqual(nextCapacity(29),{level:30,capacity:120});assert.equal(nextCapacity(30),null);assert.equal(MAX_CAPACITY,120);
 assert.equal(capacityOf(fresh(0)),50);assert.equal(STORE_ENERGY,200);assert.equal(MAX_ENERGY,200);
});

test('a new camp starts at 50 of 50, with both onboarding bonuses to come',()=>{
 const s=fresh(0);assert.equal(s.energy,50);assert.equal(capacityOf(s),50);assert.deepEqual(s.boost,{order:false,stage:false});
 assert.equal(s.capPaid,50);assert.equal(s.version,VERSION);assert.equal(refillTimes(s,0),null,'full: the clock rests');
});

test('a capacity milestone pays its increase once, on top of the level energy (12/50 → level 3 → 27/60)',()=>{
 const s=atLevel(fresh(0),2,xpToNext(2)-1);s.energy=12;s.boost.order=true;
 const r=ok(s,{type:'deliver',id:ready(s,[['rig',0]],{coins:5}).id});
 assert.equal(s.level.level,3);assert.equal(r.levelUp.length,1);
 assert.equal(r.levelUp[0].energy,5,'the level energy (unchanged)');
 assert.deepEqual(r.levelUp[0].capacity,{from:50,to:60,energy:10},'the capacity increase, once');
 assert.equal(s.energy,12+1+5+10,'+1 delivery, +5 level, +10 capacity');assert.equal(capacityOf(s),60);assert.equal(s.capPaid,60);
 // the example without the level energy: 12 + 10 = 22 of 60
 assert.equal(12+r.levelUp[0].capacity.energy,22);
 // a level that is no milestone pays no increase
 const t=atLevel(fresh(0),3,xpToNext(3)-1);t.energy=20;t.boost.order=true;
 const r2=ok(t,{type:'deliver',id:ready(t,[['rig',0]],{coins:5}).id});assert.equal(t.level.level,4);assert.equal(r2.levelUp[0].capacity,undefined);
});

test('several levels in one action: each milestone paid once, in order; the bar is not refilled',()=>{
 const s=atLevel(fresh(0),2);s.energy=10;s.boost.order=true;
 // level 2 → 8 in one delivery: milestones at 3 (60), 5 (70) and 8 (80)
 const r=ok(s,{type:'deliver',id:ready(s,[['rig',0]],{coins:5*xpBetween(2,8)}).id});
 assert.equal(s.level.level,8);assert.equal(r.levelUp.length,6);
 assert.deepEqual(r.levelUp.filter(u=>u.capacity).map(u=>[u.level,u.capacity.from,u.capacity.to,u.capacity.energy]),[[3,50,60,10],[5,60,70,10],[8,70,80,10]]);
 const levelEnergy=r.levelUp.reduce((n,u)=>n+u.energy,0);
 assert.equal(s.energy,10+1+levelEnergy+30);assert.ok(s.energy<capacityOf(s)+30,'no full refill at a milestone');assert.equal(s.capPaid,80);
 // a reload pays nothing again, and the next level (9) is no milestone
 const t=load(JSON.stringify(s),0);assert.equal(t.energy,s.energy);assert.equal(t.capPaid,80);
 const r2=ok(t,{type:'deliver',id:ready(t,[['rig',0]],{coins:5*xpToNext(8)}).id});assert.equal(t.level.level,9);assert.equal(r2.levelUp[0].capacity,undefined);
});

test('onboarding: the first ordinary crew order +15 once, the first stage +20 once, not again after a reload',()=>{
 const s=fresh(0);s.energy=10;
 const r=ok(s,{type:'deliver',id:ready(s,[['rig',0]]).id});assert.deepEqual(r.boost,{kind:'order',energy:ONBOARDING.order});
 assert.equal(s.energy,10+1+15);assert.match(r.message,/first crew order: \+15 energy/);assert.equal(s.boost.order,true);
 const t=load(JSON.stringify(s),0);const r2=ok(t,{type:'deliver',id:ready(t,[['rig',0]]).id});assert.equal(r2.boost,undefined);
 assert.equal(t.energy,26+1);
 // the first stage: materials in, coins in
 t.materials={'beach-path':1};t.coins=1000;const e=t.energy,r3=ok(t,{type:'restore',id:'beach-path'});
 assert.deepEqual(r3.effects.boost,{kind:'stage',energy:ONBOARDING.stage});assert.equal(t.boost.stage,true);
 const lv=(r3.levelUp??[]).reduce((n,u)=>n+u.energy+(u.capacity?.energy??0),0);
 assert.equal(t.energy,e+(r3.effects.energy??0)+20+lv,'+20 on top of the stage\'s own rewards');
 const u=load(JSON.stringify(t),0);u.materials['beach-tent']=1;const r4=ok(u,{type:'restore',id:'beach-tent'});assert.equal(r4.effects.boost,undefined,'once');
 // no extra +15 for the Rover reaching level 2
 const v=fresh(0);v.board[15]=source('rig');const m=ok(v,{type:'merge',from:15,to:ROVER});assert.equal(m.event,'producerUp');assert.equal(v.energy,50);assert.equal(m.boost,undefined);
});

test('gold orders, introductory orders and other rare-only jobs never claim the first-order bonus',()=>{
 const s=fresh(0);s.energy=10;
 // a gold order first
 const gold=makeOrder(Object.assign(s,{orderSeq:10}));assert.ok(gold.story);s.orders[0]=gold;for(const r of gold.needs)for(let k=0;k<r.count;k++)s.board[s.board.indexOf(null)]=item(r.family,r.tier);
 const g=ok(s,{type:'deliver',id:gold.id});assert.equal(g.boost,undefined);assert.equal(g.energy,0);assert.equal(s.boost.order,false);
 // the introductory order for a gifted Bolt (a quick job for it alone)
 const i=ok(s,{type:'deliver',id:ready(s,[['mech',0]],{lane:1}).id});assert.equal(i.boost,undefined);assert.equal(i.energy,0);assert.equal(s.boost.order,false);
 // then an ordinary crew order claims it
 const c=ok(s,{type:'deliver',id:ready(s,[['rig',1]],{lane:2}).id});assert.equal(c.boost?.energy,15);assert.equal(s.boost.order,true);
});

test('delivery energy: primary-only and mixed orders give the crew energy, rare-only jobs and gold none',()=>{
 assert.deepEqual(DELIVERY_ENERGY,{primary:1,mixed:1,secondary:0,gold:0});
 for(const [needs,gain,kind] of [[[['rig',1]],1,'primary'],[[['rig',1],['mech',0]],1,'mixed'],[[['mech',1]],0,'rare-only'],[[['notes',0],['mech',0]],0,'rare-only, two parts']]){
  const s=fresh(0);s.energy=10;s.boost.order=true;const o=ready(s,needs,{role:needs.length>1?'pair':'quick'});const e=s.energy,r=ok(s,{type:'deliver',id:o.id});
  assert.equal(r.energy,gain,kind);assert.equal(s.energy,e+gain,kind);assert.equal(o.needs.some(q=>isSecondary(q.family)),kind!=='primary');}
});

test('offline refill stops at the level\'s capacity; above it the clock rests and resumes below it',()=>{
 // level 5: capacity 70; three hours away from 20 refills to 70, not to 120
 const s=atLevel(fresh(0),5);s.energy=20;s.energyAt=0;const t=load(JSON.stringify(s),180*MIN);assert.equal(t.energy,70);
 const u=atLevel(fresh(0),1);u.energy=20;u.energyAt=0;assert.equal(load(JSON.stringify(u),180*MIN).energy,50);
 // part way: 30 minutes is 15 points
 const w=atLevel(fresh(0),12);w.energy=40;w.energyAt=0;assert.equal(load(JSON.stringify(w),30*MIN).energy,55);
 // above the capacity (bonus energy): nothing is added and nothing is taken, however long
 const b=atLevel(fresh(0),5);b.energy=85;b.energyAt=0;assert.equal(settleEnergy(b,600*MIN),0);assert.equal(b.energy,85);assert.equal(refillTimes(b,600*MIN),null);
 // spending down to the capacity keeps the clock resting; below it, it starts from that moment (no
 // credit for the time above it)
 for(let k=0;k<15;k++)tap(b,600*MIN);assert.equal(b.energy,70);
 tap(b,700*MIN);assert.equal(b.energy,69);assert.equal(b.energyAt,700*MIN);
 tick(b,700*MIN+REFILL_EVERY-1);assert.equal(b.energy,69);tick(b,700*MIN+REFILL_EVERY);assert.equal(b.energy,70);tick(b,900*MIN);assert.equal(b.energy,70);
});

test('stored energy stops at 200; a milestone reward past it is owed and paid as room opens, never lost',()=>{
 // 195 energy, +1 for the delivery, then a capacity milestone of +10 (the level's own +5 only tops up
 // to the capacity, so it adds nothing here): 200 now and 6 owed
 const s=atLevel(fresh(0),2,xpToNext(2)-1);s.energy=195;s.boost.order=true;
 const r=ok(s,{type:'deliver',id:ready(s,[['rig',0]],{coins:5}).id});
 assert.equal(s.energy,200);assert.equal(r.levelUp[0].energy,0);assert.deepEqual(r.levelUp[0].capacity,{from:50,to:60,energy:10,owed:6});assert.equal(s.energyOwed,6);
 // a reload keeps what is owed; spending makes room and it is paid
 const t=load(JSON.stringify(s),0);assert.equal(t.energyOwed,6);
 const p=tap(t);assert.equal(p.owedPaid,1);assert.equal(t.energy,200);assert.equal(t.energyOwed,5);
 for(let k=0;k<5;k++)tap(t);assert.equal(t.energy,200);assert.equal(t.energyOwed,undefined);
 tap(t);assert.equal(t.energy,199,'paid in full, then energy is spent as usual');
 // the onboarding bonuses too: +15 at 190 is 200 and 5 owed
 const u=fresh(0);u.energy=190;const d=ok(u,{type:'deliver',id:ready(u,[['rig',0]]).id});assert.equal(u.energy,200);assert.deepEqual(d.boost,{kind:'order',energy:15,owed:6});assert.equal(u.energyOwed,6);
 // a daily energy gift past 200 is owed too
 const dg=fresh(0);dg.energy=195;dg.daily={day:-1,count:0};const gift=act(dg,{type:'daily',day:1},0);if(gift.ok&&gift.gift.energy){assert.equal(dg.energy,200);assert.equal(dg.energyOwed,195+gift.gift.energy-200);}
 // the shop refuses energy past 200; a daily energy gift past it is owed
 const q=fresh(0);q.coins=500;q.energy=195;assert.match(act(q,{type:'buy',id:'energy',day:1}).message,/full/);
 // damaged owed values are dropped on load
 for(const bad of [-1,0,1.5,'5',1e6]){const v=fresh(0);v.energyOwed=bad;assert.equal(load(JSON.stringify(v),0).energyOwed,undefined,String(bad));}
 const big=fresh(0);big.energy=201;assert.equal(load(JSON.stringify(big),0).moves,0,'energy past 200 is not a save this build made');
});

test('a milestone met with a full board: the energy comes, the board rewards wait for space',()=>{
 const s=atLevel(fresh(0),2,xpToNext(2)-8);s.energy=10;s.materials={'beach-path':1};s.coins=1000;
 for(const i of s.board.keys())if(s.board[i]===null)s.board[i]=item('rig',0);
 const r=ok(s,{type:'restore',id:'beach-path'});
 assert.equal(r.effects.boost.energy,20);assert.ok(r.levelUp?.[0]?.capacity,'the stage\'s XP crosses level 3');
 assert.ok(s.pending.length>=1,'the stage\'s crate waits for space');
 assert.equal(s.energy,10+(r.effects.energy??0)+20+r.levelUp.reduce((n,u)=>n+u.energy+(u.capacity?.energy??0),0));
});

test('saves from before the pass: capacity for their level, nothing paid again, energy kept, milestones inferred',()=>{
 // version 4, level 10 (capacity 80), 45 energy, away three hours, an ordinary crew order and a stage done
 const old=fresh(0);delete old.capPaid;delete old.boost;old.version=4;old.level={version:1,level:10,xp:3};old.energy=45;old.energyAt=0;
 old.ordersDone=6;old.built={'beach-path':1};old.materials={'beach-path':1};
 const s=load(JSON.stringify(old),180*MIN);
 assert.equal(s.version,VERSION);assert.equal(capacityOf(s),80);assert.equal(s.capPaid,80,'past increases are not paid');
 assert.equal(s.energy,50,'time away is settled at the old capacity (50) first, not at 80');assert.equal(s.energyAt,180*MIN,'and the clock starts now');
 assert.deepEqual(s.boost,{order:true,stage:true},'both onboarding milestones already met');
 // loading again changes nothing
 const t=load(JSON.stringify(s),180*MIN);assert.equal(t.energy,50);assert.deepEqual(t.boost,s.boost);assert.equal(t.capPaid,80);
 // the clock now runs towards 80
 assert.equal(load(JSON.stringify(s),180*MIN+20*MIN).energy,60);
 // energy above the new capacity is kept as it is
 const hi=structuredClone(old);hi.energy=110;assert.equal(load(JSON.stringify(hi),180*MIN).energy,110);
 // a camp still at level 1 with nothing delivered keeps both bonuses to come, and its energy
 const young=fresh(0);delete young.capPaid;delete young.boost;young.version=4;young.energy=30;young.energyAt=0;
 const y=load(JSON.stringify(young),10*MIN);assert.equal(y.energy,35);assert.deepEqual(y.boost,{order:false,stage:false});
 // only gold orders delivered (counted by the materials they brought): the first-order bonus is still to come
 const gold=structuredClone(young);gold.ordersDone=1;gold.materials={'beach-path':1};assert.deepEqual(load(JSON.stringify(gold),0).boost,{order:false,stage:false});
 // the next milestone pays once: level 11 → 12 (80 → 90)
 const n=load(JSON.stringify(s),180*MIN);n.level={version:1,level:11,xp:xpToNext(11)-1};n.boost.order=true;
 const r=ok(n,{type:'deliver',id:ready(n,[['rig',0]],{coins:5}).id},180*MIN);assert.deepEqual(r.levelUp[0].capacity,{from:80,to:90,energy:10});
 // damaged boost values are worked out again (never a second payment for a camp that has delivered)
 for(const bad of [null,[],{order:1,stage:true},'yes']){const d=structuredClone(s);d.boost=bad;assert.equal(load(JSON.stringify(d),0).boost.order,true,JSON.stringify(bad));}
});

test('Classic V5 energy is unchanged: refill to 50, whatever the level',()=>{
 assert.equal(classic.REFILL_CAP,50);
 const c={energy:10,energyAt:0,level:{version:1,level:30,xp:0}};classic.settleEnergy(c,600*MIN);assert.equal(c.energy,50);
 assert.equal(classic.refillTimes({energy:50,energyAt:0},0),null);
 const d={energy:70,energyAt:0};assert.equal(classic.settleEnergy(d,600*MIN),0);assert.equal(d.energy,70);
});
