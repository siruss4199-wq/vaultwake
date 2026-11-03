// Coast Camp Build 52A3 (docs/V5_BUILD52A_ECONOMY_2026-11-03.md, "Order difficulty and rare drops").
// 1. The opening keeps its rare rates (5 %, certain by the 20th eligible tap, the 8th for a gold order); after six
//    stages 4 %, the 24th and the 10th. The first rare introduction and the lanterns' Gear are unchanged.
// 2. From 12 stages built an everyday part may be one tier further past what its generator makes easily (reach + 2):
//    never before (the guide and the opening ask what they asked), never past a chain's last tier below its keepsake,
//    and paid by its parts; a crew order worth 24 Level 1 parts or more gives one more energy.
// 3. Whole runs: crew orders take more merging; nobody runs out of energy or gets stuck; the first 15 minutes and
//    the Survey Kite keep their guards.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../v5/next/game.mjs';
import {fresh,act,item,source,makeOrder,totalBuilt,isSecondary,SECONDARY_RULES,RARE_EARLY,rareRule,ORDER_RAMP,DEEP_ENERGY,orderUnits,orderPrice,bestTier,DELIVERY_ENERGY,orderEnergyKind} from '../v5/next/game.mjs';
import {AREAS} from '../v5/next/areas.mjs';
import {maxTier} from '../v5/next/chains.mjs';
import {primaryAction} from '../v5/next/guide.mjs';
import {nextAction} from './v5-next-policy.mjs';
import {simulate} from './v5-next-economy-sim.mjs';
import {makeGoldFirst} from './v5-next-goldfirst-policy.mjs';

const MIN=60000,ROVER=fresh(0).board.findIndex(x=>x?.type==='source'&&x.id==='rig');
const done=a=>Object.fromEntries(a.tasks.map(t=>[t.id,3]));
const pick=(r,keys)=>Object.fromEntries(keys.map(k=>[k,r[k]]));

test('rare rates: the opening keeps 5 %, 20 and 8; from six stages 4 %, 24 and 10', ()=>{
 for(const k of ['rig','chart'])assert.deepEqual(pick(SECONDARY_RULES[k],['chance','pity','goldPity','level','hold']),{chance:.04,pity:24,goldPity:10,level:2,hold:4});
 assert.deepEqual(RARE_EARLY,{until:6,chance:.05,pity:20,goldPity:8});
 const s=fresh(0);s.built={'beach-path':2,'beach-tent':1};
 assert.deepEqual(pick(rareRule(s,'rig'),['chance','pity','goldPity']),{chance:.05,pity:20,goldPity:8},'five stages: the opening');
 s.built={'beach-path':3,'beach-tent':3};assert.equal(totalBuilt(s),6);
 assert.deepEqual(pick(rareRule(s,'rig'),['chance','pity','goldPity']),{chance:.04,pity:24,goldPity:10},'six stages: the later rates');
 // the bad-luck limit after the opening: a drop by the 24th eligible tap at worst, whatever the rolls
 for(const salt of [101,7,999]){const t=fresh(0);t.built={'beach-path':3,'beach-tent':3};t.board[ROVER].level=2;t.secOpen={rig:true};t.found.push('mech0');t.orders=[];
  const keep=SECONDARY_RULES.rig.salt;SECONDARY_RULES.rig.salt=salt;let gap=0,worst=0;
  for(let n=0;n<240;n++){t.energy=10;const r=act(t,{type:'produce',id:'rig',index:ROVER},1000+n);assert.ok(r.ok);gap++;
   if(r.secondary){worst=Math.max(worst,gap);gap=0;t.board[r.secondary.index]=null;}t.board[r.index]=null;}
  SECONDARY_RULES.rig.salt=keep;assert.ok(worst<=24&&worst>=1,`salt ${salt}: longest gap ${worst}`);}
});

test('deeper crew orders (52A4: from 3 stages built): never before, then up to reach + 2 within the chain, paid by their parts', ()=>{
 assert.equal(ORDER_RAMP.reachFrom,3);assert.deepEqual(DEEP_ENERGY,{units:24,extra:2});
 const camp=built=>{const s=fresh(0);s.built=built;s.board[ROVER].level=2;s.board[15]={...source('chart'),level:2};s.orderSeq=10;s.orders=[];return s;};
 const asks=s=>{const out=[];for(let k=0;k<80;k++){const o=makeOrder(s);if(!o.story)out.push(o);}return out;};
 // the guide's first two stages: never past reach + 1
 for(const built of [{'beach-path':1},{'beach-path':2}]){const s=camp(built);
  for(const o of asks(s))for(const r of o.needs)if(!isSecondary(r.family))assert.ok(r.tier<=bestTier(2)+1,`${totalBuilt(s)} built: ${JSON.stringify(r)}`);}
 // the whole beach (15): reach + 2 is asked, never more, never the keepsake tier
 const s=camp(done(AREAS[0]));let deep=0;
 for(const o of asks(s)){for(const r of o.needs)if(!isSecondary(r.family)){assert.ok(r.tier<=bestTier(2)+2&&r.tier<=maxTier(r.family)-1,JSON.stringify(r));if(r.tier===bestTier(2)+2)deep++;}
  assert.equal(o.coins,orderPrice(s,o.needs,o.role),'priced by its parts');}
 assert.ok(deep>0,'a deeper part is asked');
 // the first three orders (the guide's) are fixed as before
 assert.deepEqual(fresh(0).orders.filter(Boolean).map(o=>o.needs.map(n=>[n.family,n.tier,n.count])).flat(),[['rig',2,1],['rig',3,1],['rig',2,1],['rig',1,2]].slice(0,fresh(0).orders.filter(Boolean).flatMap(o=>o.needs).length));
});

test('a crew order worth 24 Level 1 parts or more gives one more energy; a smaller one and a gold order do not', ()=>{
 const deliver=o=>{const s=fresh(0);s.energy=10;s.boost.order=true;s.orders=[o];let k=0;const free=s.board.flatMap((x,i)=>x===null?[i]:[]);
  for(const r of o.needs)for(let c=0;c<r.count;c++)s.board[free[k++]]=item(r.family,r.tier);const e=s.energy,r=act(s,{type:'deliver',id:o.id},1000);assert.ok(r.ok,r.message);return s.energy-e;};
 const big={id:'b',who:'ivo',needs:[{family:'rig',tier:4,count:1},{family:'rig',tier:3,count:1}],coins:60,role:'pair'};
 const small={id:'c',who:'ivo',needs:[{family:'rig',tier:3,count:1},{family:'rig',tier:2,count:1}],coins:30,role:'pair'};
 assert.equal(orderUnits(big),24);assert.equal(orderUnits(small),12);
 assert.equal(deliver(big),DELIVERY_ENERGY[orderEnergyKind(big)]+DEEP_ENERGY.extra);
 assert.equal(deliver(small),DELIVERY_ENERGY[orderEnergyKind(small)]);
 assert.equal(deliver({...big,id:'g',story:'beach-path'}),0,'a gold order gives none');
});

// Measured (tests/v5-next-difficulty-metrics.mjs, 4/5/8/10 s, 10 seeds; docs): merge steps per crew order over the
// whole game 14.4-15.5 → about 19-20 (scripted player); gold-first, Chapter 1, 9.2-9.9 → 13.5-15.3.
// Here each run is compared with the same run under the 52A2 rules (deeper orders and the extra energy off, the
// 52A2 rare rates throughout).
function chapter1(policy,speed,seed,shop){
 const steps=[];let kite=null;
 const proxy={...g,act(s,a,t){const o=a.type==='deliver'?s.orders.find(x=>x?.id===a.id):null,r=g.act(s,a,t);
  if(r.ok&&o&&!o.story){const p=o.needs.filter(n=>!isSecondary(n.family));if(p.length)steps.push(p.reduce((n,x)=>n+x.count*(2**x.tier-1),0));}return r;}};
 const res=simulate(proxy,policy,speed,seed,{until:24*3600e3,shop,finish:s=>s.area>=3,onStep:(s,t)=>{if(!kite&&s.board.some(x=>x?.type==='source'&&x.id==='chart'))kite=t;}});
 return {res,kite,steps:steps.reduce((a,b)=>a+b,0)/steps.length};
}
function as52A2(fn){const keep={r:ORDER_RAMP.reachFrom,u:DEEP_ENERGY.units,e:RARE_EARLY.until};ORDER_RAMP.reachFrom=Infinity;DEEP_ENERGY.units=Infinity;RARE_EARLY.until=Infinity;
 try{return fn();}finally{ORDER_RAMP.reachFrom=keep.r;DEEP_ENERGY.units=keep.u;RARE_EARLY.until=keep.e;}}
test('whole runs: crew orders take more merging; no energy starvation, no stuck board; the opening and the Kite keep their guards', ()=>{
 const policies={normal:nextAction,strict:makeGoldFirst(g,primaryAction,nextAction),opportunist:makeGoldFirst(g,primaryAction,nextAction,{opportunist:true})};
 for(const [name,policy] of Object.entries(policies)){let now=0,before=0;
  for(const [speed,seed] of [[4,1],[5,2],[10,3]]){
   const r=chapter1(policy,speed,seed,name==='normal'),b=as52A2(()=>chapter1(policy,speed,seed,name==='normal'));now+=r.steps;before+=b.steps;
   const at=`${name} ${speed} s seed ${seed}`,starve=r.res.starve.reduce((a,c)=>a+c,0)/MIN;
   assert.ok(r.res.finished,`${at}: Chapter 1 finished`);
   assert.ok(starve<=3.5,`${at}: ${starve.toFixed(1)} min with no energy`);
   assert.ok(r.res.longestIdle<=3*MIN,`${at}: idle ${(r.res.longestIdle/MIN).toFixed(1)} min at a time`);
   assert.ok(r.res.first15.restores>=(speed<9?3:2),`${at}: ${r.res.first15.restores} restorations in 15 min`);
   assert.ok(r.kite&&r.kite<=speed*4.25*MIN,`${at}: the Survey Kite at ${(r.kite/MIN).toFixed(1)} min`);}
  assert.ok(now>=before*1.15,`${name}: ${(now/3).toFixed(1)} merge steps a crew order in Chapter 1, against ${(before/3).toFixed(1)} under the 52A2 rules`);}
});
