// Secondary-chain pilot metrics (2026-10-29, docs/V5_SECONDARY_PILOT_2026-10-29.md). The scripted player
// (tests/v5-next-policy.mjs) plays Chapters 1-2 with the secondary chains off (the game before the
// pilot), with model B (bonus: the tap's own part and, sometimes, a secondary as well) and with model A
// (replace: sometimes a secondary instead of the tap's own part, compensated by what secondary orders
// pay). The models are switched through SECONDARY_RULES only; everything else is the game as built.
// Each seed also rolls its own drops (the rules' salt), so a model is measured over several drop
// sequences, not one. Per configuration, over the seeds (median where it says so, else mean):
// - time: total, waiting for energy and its share of the total, Chapter 1 alone;
// - energy per delivered order, and per primary unit: taps spent for each tier-0 equivalent of primary
//   parts delivered (a tier-t part counts 2^t), i.e. what a primary part costs in energy;
// - orders delivered; secondary orders offered and delivered, and how long they waited (median);
// - primary parts on the board, and the share of primary order parts already on the board when the
//   order came (availability); board occupancy (spaces holding anything but cargo or tideglass);
// - secondary drops, the longest run of eligible taps without one, rewards waiting for space.
//   node tests/v5-next-secondary-pilot-metrics.mjs [speeds=5,8] [seeds=1,...,10] [shop|noshop|both] [models=off,bonus,replace] [--runs] [key=value ...]
// --runs also prints each run (seed by seed) before its configuration's row.
// key=value overrides SECONDARY_RULES (chance, pity, first, orders, taps, hold) or SECONDARY_ORDERS
// (every, top, rarity), e.g. chance=0.07.
import * as g from '../v5/next/game.mjs';
import {nextAction} from './v5-next-policy.mjs';
import {simulate} from './v5-next-economy-sim.mjs';
const SPEEDS=(process.argv[2]??'5,8').split(',').map(Number),SEEDS=(process.argv[3]??'1,2,3,4,5,6,7,8,9,10').split(',').map(Number);
const SHOPS={shop:[true],noshop:[false],both:[true,false]}[process.argv[4]??'both'];
const MODELS=(process.argv[5]??'off,bonus,replace').split(',');
const RUNS=process.argv.includes('--runs'),OVER=Object.fromEntries(process.argv.slice(6).filter(a=>a.includes('=')).map(a=>a.split('=')).map(([k,v])=>[k,+v]));
const RULE_KEYS=['chance','pity','level','hold'],ORDER_KEYS=['share','top','rarity','goal'];
for(const k of ORDER_KEYS)if(k in OVER)g.SECONDARY_ORDERS[k]=OVER[k];
const MIN=60000,r1=x=>Math.round(x*10)/10,r2=x=>Math.round(x*100)/100;
const DEFAULT=structuredClone(g.SECONDARY_RULES),sec=f=>g.isSecondary(f),units=needs=>needs.filter(r=>!sec(r.family)).reduce((n,r)=>n+r.count*2**r.tier,0);
function run(model,speed,seed,shop){
 for(const k of Object.keys(DEFAULT))Object.assign(g.SECONDARY_RULES[k],DEFAULT[k],{model,salt:DEFAULT[k].salt+seed*1009},Object.fromEntries(RULE_KEYS.filter(r=>r in OVER).map(r=>[r,OVER[r]])));
 const m={taps:0,deliveries:0,primaryUnits:0,secOffered:0,secDelivered:0,secAge:[],drops:0,drought:0,since:{},pendingMax:0,samples:0,occupied:0,primaryParts:0,
  primaryAsked:0,primaryOwned:0,ch1Min:null,ch1Wait:0,eligible:0,everydayOpen:0,secOpenOrders:0,openMin:0,unusedMin:0,unusedUnits:0,unlock:{}};
 let lastT=0;
 const born={},secIds=new Set();let tickAt=0,acted=true;
 const proxy={...g,
  tick:(s,now)=>{if(!acted&&s.area<3)m.ch1Wait+=now-tickAt;tickAt=now;acted=false;return g.tick(s,now);},
  act:(s,a,now)=>{
   // an eligible tap (round 3): a level 2+ generator whose chain is open and whose drops are not paused
   const at=a.type==='produce'?(Number.isInteger(a.index)?a.index:s.board.findIndex(x=>x?.type==='source'&&x.id===a.id)):-1;
   const o=a.type==='deliver'?s.orders.find(x=>x?.id===a.id):null,elig=a.type==='produce'&&g.secondarySource(s,at)&&!g.secondaryPaused(s,a.id),r=g.act(s,a,now);if(!r.ok)return r;acted=true;
   if(elig)m.eligible++;for(const u of r.unlocks??[])m.unlock[u.gen]??=now/MIN;for(const gen of Object.keys(s.secOpen??{}))m.unlock[gen]??=now/MIN;
   if(r.event==='produce'){m.taps++;
    if(elig){m.since[a.id]=(m.since[a.id]??0)+1;if(r.secondary){m.drops++;m.drought=Math.max(m.drought,m.since[a.id]);m.since[a.id]=0;}}}
   if(o){m.deliveries++;m.primaryUnits+=units(o.needs);if(secIds.has(o.id)){m.secDelivered++;m.secAge.push((now-born[o.id])/MIN);}}
   m.pendingMax=Math.max(m.pendingMax,s.pending.length);return r;}};
 const onStep=(s,now)=>{
  if(m.ch1Min===null&&s.area>=3)m.ch1Min=now/MIN;
  // time with unused extras (held, no order for that chain) once a chain is open, and the unused drops held
  const dt=now-lastT;lastT=now;const open=Object.keys(s.secOpen??{}).map(gen=>g.SECONDARY_OF[gen]);
  if(open.length){m.openMin+=dt/MIN;const fams=Object.values(g.SECONDARY_OF),un=fams.map(f=>Math.max(0,g.secondaryUnits(s,f)-g.secondaryWanted(s,f)));
   if(fams.some((f,k)=>un[k]>0&&g.secondaryWanted(s,f)===0))m.unusedMin+=dt/MIN;m.unusedUnits+=un.reduce((a,b)=>a+b,0)*dt/MIN;}
  for(const o of s.orders){if(!o||born[o.id]!==undefined)continue;born[o.id]=now;
   if(!o.story&&open.length){m.everydayOpen++;if(o.needs.some(r=>sec(r.family)))m.secOpenOrders++;}
   if(!o.story&&o.needs.some(r=>sec(r.family))){m.secOffered++;secIds.add(o.id);}
   for(const r of o.needs)if(!sec(r.family)){m.primaryAsked+=r.count;m.primaryOwned+=Math.min(r.count,g.count(s,r));}}
  m.samples++;m.occupied+=s.board.filter(x=>x&&x.type!=='cargo'&&x.type!=='glass').length;m.primaryParts+=s.board.filter(x=>x?.type==='item'&&!sec(x.family)).length;
 };
 const res=simulate(proxy,nextAction,speed,seed,{until:16*3600e3,shop,onStep,finish:s=>g.allDone(s)});
 const sorted=m.secAge.sort((a,b)=>a-b);
 return {finished:res.finished,totalMin:res.total/MIN,waitMin:res.idle/MIN,waitShare:res.idle/res.total,ch1Min:m.ch1Min,ch1WaitShare:m.ch1Min?m.ch1Wait/(m.ch1Min*MIN):null,taps:m.taps,
  energyPerOrder:m.taps/m.deliveries,energyPerPrimaryUnit:m.taps/m.primaryUnits,deliveries:m.deliveries,secOffered:m.secOffered,secDelivered:m.secDelivered,secWaitMedian:sorted.length?sorted[Math.floor(sorted.length/2)]:null,
  primaryParts:m.primaryParts/m.samples,primaryOwnedPct:100*m.primaryOwned/m.primaryAsked,occupied:m.occupied/m.samples,drops:m.drops,drought:m.drought,pendingMax:m.pendingMax,bought:res.bought,rations:res.rations,
  eligibleTaps:m.eligible,dropRate:m.eligible?m.drops/m.eligible:null,secSharePct:m.everydayOpen?100*m.secOpenOrders/m.everydayOpen:null,unusedSharePct:m.openMin?100*m.unusedMin/m.openMin:null,unusedDrops:m.openMin?m.unusedUnits/m.openMin:null,roverUnlockMin:m.unlock.rig??null,kiteUnlockMin:m.unlock.chart??null};
}
const MEAN=['totalMin','waitMin','waitShare','ch1Min','ch1WaitShare','taps','energyPerOrder','energyPerPrimaryUnit','deliveries','secOffered','secDelivered','secWaitMedian','primaryParts','primaryOwnedPct','occupied','drops','bought','rations','eligibleTaps','dropRate','secSharePct','unusedSharePct','unusedDrops','roverUnlockMin','kiteUnlockMin'];
for(const shop of SHOPS)for(const speed of SPEEDS){
 let base=null;
 for(const model of MODELS){
  const R=SEEDS.map(seed=>run(model,speed,seed,shop)),vals=k=>R.map(r=>r[k]).filter(x=>x!==null);
  if(RUNS)R.forEach((r,i)=>console.log(JSON.stringify({run:1,model,speed,shop,seed:SEEDS[i],...r})));
  const mean=k=>{const v=vals(k);return v.length?v.reduce((a,b)=>a+b,0)/v.length:null;},med=k=>{const v=vals(k).sort((a,b)=>a-b);return v.length?v[Math.floor(v.length/2)]:null;};
  const row={model,speed,shop,...OVER,seeds:SEEDS.length,finished:R.filter(r=>r.finished).length,medTotalMin:r1(med('totalMin')),medWaitShare:r2(med('waitShare')),medCh1Min:r1(med('ch1Min'))};
  for(const k of MEAN){const v=mean(k);row[k]=v===null?null:k.endsWith('Share')||k.startsWith('energy')?r2(v):r1(v);}
  row.drought=Math.max(...R.map(r=>r.drought));row.pendingMax=Math.max(...R.map(r=>r.pendingMax));
  if(!base)base=row;else for(const k of ['medTotalMin','medWaitShare','waitShare','energyPerOrder','energyPerPrimaryUnit','occupied'])row['d_'+k]=r2(row[k]-base[k]);
  console.log(JSON.stringify(row));
 }
}
