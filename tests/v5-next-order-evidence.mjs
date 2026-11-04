// Evidence from actual generated and delivered Coast Camp orders, not recipe fixtures.
import * as g from '../v5/next/game.mjs';
import {CHAINS} from '../v5/next/chains.mjs';
import {nextAction} from './v5-next-policy.mjs';
import {simulate} from './v5-next-economy-sim.mjs';

const names=needs=>needs.map(n=>`${n.count}x ${CHAINS[n.family].names[n.tier]} (Lv${n.tier+1})`);
function play(speed,seed){
 const seen=new Set(),gold=[],crew=[],deliveredGold=new Set(),deliveredCrew=new Set();
 let restores=0,crewCoins=0,goldCoins=0;
 const proxy={...g,act(s,a,t){
  const o=a.type==='deliver'?s.orders.find(o=>o?.id===a.id):null;
  const r=g.act(s,a,t);
  if(r.ok&&o){
   if(o.story){deliveredGold.add(o.id);goldCoins+=o.coins;}
   else{deliveredCrew.add(o.id);crewCoins+=o.coins;}
  }
  if(r.ok&&r.event==='restore')restores++;
  return r;
 }};
 const onStep=(s,t)=>{
  for(const o of s.orders){
   if(!o||seen.has(o.id))continue;
   seen.add(o.id);
   const entry={id:o.id,stageBuilt:g.totalBuilt(s),parts:names(o.needs),coins:o.coins,
    rare:o.needs.some(n=>g.isSecondary(n.family))};
   if(o.story){
    entry.stage=o.story;entry.cost=g.upgrades(s).find(u=>u.id===o.story)?.cost??null;
    gold.push(entry);
   }else if(g.totalBuilt(s)>=2)crew.push(entry);
  }
 };
 const res=simulate(proxy,nextAction,speed,seed,{until:24*3600e3,shop:true,onStep,
  finish:s=>deliveredGold.size>=15&&deliveredCrew.size>=15});
 const first15=gold.slice(0,15),cash=crewCoins+goldCoins;
 return {speed,seed,finished:res.finished,minutes:+(res.total/60000).toFixed(1),restores,
  crewDelivered:deliveredCrew.size,goldDelivered:deliveredGold.size,crewCoinPct:cash?Math.round(100*crewCoins/cash):0,
  rareGoldFirst15:first15.filter(o=>o.rare).length,rareCrewFirst15:crew.slice(0,15).filter(o=>o.rare).length,
  noEnergyMin:+(res.starve.reduce((a,b)=>a+b,0)/60000).toFixed(1),longestIdleMin:+(res.longestIdle/60000).toFixed(1),
  gold:first15,crew:crew.slice(0,15)};
}
const out=[];
for(const speed of [4,5,8,10])for(const seed of [1,2,3]){
 const r=play(speed,seed);const {gold,crew,...stats}=r;out.push(stats);
 if(speed===5&&seed===1)console.log('EXAMPLE_GOLD_15 '+JSON.stringify(gold));
 if(speed===5&&seed===1)console.log('EXAMPLE_CREW_15 '+JSON.stringify(crew));
}
console.log('ORDER_EVIDENCE_SUMMARY '+JSON.stringify(out));
