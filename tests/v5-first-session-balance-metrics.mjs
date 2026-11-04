// Reproducible paired comparison against PR97's exact original game, not a
// reconstructed economy. Run one worker per speed; no ads or purchases assumed.
import * as current from '../v5/next/game.mjs';
import {nextAction as currentPolicy} from './v5-next-policy.mjs';
import {freeAction} from './v5-next-economy-sim.mjs';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';import path from 'node:path';import {pathToFileURL} from 'node:url';import {execFileSync} from 'node:child_process';
const base='000bb9b039265430469f686b2db33494f4d272dc';
const root=mkdtempSync(path.join(tmpdir(),'vaultwake-energy-'));
const files=execFileSync('git',['ls-tree','-r','--name-only',base],{encoding:'utf8'}).trim().split('\n').filter(p=>/^(v4|v5)\/.*\.mjs$/.test(p)||p==='tests/v5-next-policy.mjs');
for(const file of files){const dest=path.join(root,file);mkdirSync(path.dirname(dest),{recursive:true});writeFileSync(dest,execFileSync('git',['show',base+':'+file]));}
const baseline=await import(pathToFileURL(path.join(root,'v5/next/game.mjs')));
const {nextAction:baselinePolicy}=await import(pathToFileURL(path.join(root,'tests/v5-next-policy.mjs')));
const speed=Number(process.argv[2]||5),seeds=(process.env.SEEDS||'1,2,3,4,5').split(',').map(Number),MIN=60000,DAY=86400000;
const random=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};
const round=x=>x==null?null:Math.round(x*100)/100;
const rules=new Map([[baseline,structuredClone(baseline.SECONDARY_RULES)],[current,structuredClone(current.SECONDARY_RULES)]]),cache=new Map();
for(const [start,g,policy] of [[50,baseline,baselinePolicy],[80,current,currentPolicy],[100,current,currentPolicy],[120,current,currentPolicy]]){
 const defaults=rules.get(g);
 for(const behaviour of ['guided','burst'])for(const ads of ['disabled','enabled-unused','enabled-opt-in','coin-opt-in'])for(const seed of seeds){
  if(ads==='coin-opt-in'&&start!==100)continue;
  const cacheKey=[start,behaviour,seed].join(':');
  if(ads==='enabled-unused'){console.log(JSON.stringify({...cache.get(cacheKey),ads}));continue;}
  const full=behaviour==='guided'&&seed<=2&&ads!=='coin-opt-in';
  const horizon=(full?16*60:20)*MIN;
  for(const key of Object.keys(defaults))Object.assign(g.SECONDARY_RULES[key],defaults[key],{salt:defaults[key].salt+seed*1009});
  const rng=random(seed),s=g.fresh(0);s.energy=start;let now=0,actions=0,burst=0,adsWatched=0;
  const m={start,speed,seed,behaviour,ads,firstShortage:null,wait15:0,wait20:0,crew:null,gold:null,builds:[],chapters:[],snapshots:{},coinsSpentEnergy:0,adEnergy:0,energy20:null};
  let orders=0,builds=0,crewOrders=0,goldOrders=0,minCoins=0,shortCoins=0,maxEnergy=start;
  const snapshot=t=>{m.snapshots[t]={orders,crewOrders,goldOrders,restores:builds,coins:s.coins,energy:s.energy,coinBlocked:shortCoins,canAffordBuild:g.upgrades(s).some(u=>u.materials&&s.coins>=u.cost),canBuyEnergy:s.coins>=80};};
  const advance=dt=>{for(const t of [15,20])if(now<t*MIN&&now+dt>=t*MIN&&!m.snapshots[t]){g.tick(s,t*MIN);snapshot(t);}now+=dt;};
  while(now<horizon&&!g.allDone(s)){
   g.tick(s,now);maxEnergy=Math.max(maxEnergy,s.energy);
   for(const t of [15,20])if(now>=t*MIN&&!m.snapshots[t])snapshot(t);
   let a=policy(s);
   // A learning player sometimes generates a short burst before sorting/merging.
   // No items are deleted, grants invented, purchases made, or ad uptake assumed.
   if(behaviour==='burst'&&s.moves>8&&s.energy>0&&s.board.filter(x=>x===null).length>=3&&burst<3){
    const gens=s.board.flatMap((x,i)=>x?.type==='source'?[i]:[]),i=gens[(seed+Math.floor(actions/12))%gens.length];
    if(i!==undefined&&actions%12>=8){a={type:'produce',id:s.board[i].id,index:i};burst++;}
   }
   if(a?.type!=='produce')burst=0;
   const day=Math.floor(now/DAY);
   if(!a&&s.energy<1&&g.act(s,{type:'ration'},now).ok)continue;
   if(!a&&s.energy<1&&ads==='coin-opt-in'&&g.shopLeft(s,'energy',day)>0&&s.coins>=80){const r=g.act(s,{type:'buy',id:'energy',day},now);if(r.ok){m.coinsSpentEnergy+=80;continue;}}
   if(!a&&s.energy<1&&ads==='enabled-opt-in'&&g.shopLeft(s,'adEnergy',day)>0){
    advance(30000);g.tick(s,now);const r=g.act(s,{type:'adReward',id:'adEnergy',day:Math.floor(now/DAY)},now);
    if(r.ok){adsWatched++;m.adEnergy+=r.energy;continue;}
   }
   if(!a){
    if(s.energy<1&&!freeAction(g,s))m.firstShortage??=now/MIN;
    const dt=Math.min(10000,horizon-now);
    if(s.energy<1){m.wait15+=Math.max(0,Math.min(now+dt,15*MIN)-Math.min(now,15*MIN));m.wait20+=Math.max(0,Math.min(now+dt,20*MIN)-Math.min(now,20*MIN));}
    advance(dt);continue;
   }
   const order=a.type==='deliver'?s.orders.find(o=>o.id===a.id):null,area=s.area;
   const r=g.act(s,a,now);if(!r.ok)throw Error(JSON.stringify({start,speed,behaviour,seed,a,error:r.message}));
   const elapsed=speed*1000*(.6+.8*rng());actions++;
   if(order){orders++;if(order.story){goldOrders++;m.gold??=now/MIN;}else{crewOrders++;m.crew??=now/MIN;}}
   if(r.event==='restore'){builds++;m.builds.push(now/MIN);}
   if(s.area!==area)m.chapters.push({area:s.area,minutes:round(now/MIN)});
   if(g.upgrades(s).some(u=>u.materials&&u.cost>s.coins))shortCoins++;
   minCoins=Math.min(minCoins,s.coins);advance(elapsed);
  }
  for(const t of [15,20])if(!m.snapshots[t])snapshot(t);
  m.energy20=m.snapshots[20].energy;m.wait15=round(m.wait15/MIN);m.wait20=round(m.wait20/MIN);m.firstShortage=round(m.firstShortage);m.crew=round(m.crew);m.gold=round(m.gold);
  m.firstThree=m.builds.slice(0,3).map(round);delete m.builds;
  m.censoredAtMinutes=round(horizon/MIN);m.finished=g.allDone(s);m.totalMinutes=round(now/MIN);m.restorations=builds;m.actions=actions;m.adsWatched=adsWatched;m.endEnergy=s.energy;m.maxEnergy=maxEnergy;m.endOwed=s.energyOwed??0;m.endCoins=s.coins;m.minCoins=minCoins;
  if(ads==='disabled')cache.set(cacheKey,structuredClone(m));
  console.log(JSON.stringify(m));
 }
}
rmSync(root,{recursive:true,force:true});
