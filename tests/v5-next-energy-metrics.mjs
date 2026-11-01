// Coast Camp energy pass metrics (build 47v, 2026-11-01; docs/V5_ENERGY_CAPACITY_2026-11-01.md).
// The scripted player (tests/v5-next-policy.mjs) through the economy harness (v5-next-economy-sim.mjs),
// as the secondary pilot measured it: secondary model B ('bonus'), each seed with its own drop sequence.
// Run it in this tree, or in another one (ROOT=<tree> loads that tree's game, policy and harness), so a
// build before the pass is measured with the same policy and seeds:
//   [ROOT=<tree>] node tests/v5-next-energy-metrics.mjs [speeds=4,5,8,10] [seeds=1..10] [shop|noshop|both] [--runs] [mixed=0]
// Ablations of this tree, to tell which reward does what: mixed=0 (mixed orders pay no delivery energy),
// start=30 (a new camp's energy as before the pass), onboarding=0 (no +15/+20), capfixed=1 (the refill
// capacity stays 50 at every level, so no capacity milestones either).
// Per run:
// - firstOutMin: the first time energy reaches 0; outs: how many times it does;
// - orders15/orders20, restores15/restores20: deliveries (crew, gold) and stages bought in the first
//   15 and 20 minutes; wait20Min, longestStop20Min, outs20: waiting in the first 20 minutes;
// - firstUpgradeMin: the first generator merged to level 2; firstOrderMin, firstRestoreMin;
// - waitShare: time waiting with nothing to do (energy out, no free action) over the total;
//   longestStopMin: the longest such wait in one go;
// - energyIn by source (refill, level energy, capacity milestones, the two onboarding bonuses,
//   deliveries by kind, stage effects, cargo jars, recycling, rations, the shop, owed energy paid);
// - ch1Min: Chapter 1 finished (the Vault Entrance); totalMin: Chapter 2 (everything built);
// - maxEnergy, overCapShare (share of actions taken above the refill capacity), endEnergy, owed.
// Each configuration prints the medians (and min/max) over the seeds.
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const ROOT=path.resolve(process.env.ROOT??path.join(path.dirname(new URL(import.meta.url).pathname),'..'));
const g=await import(pathToFileURL(path.join(ROOT,'v5/next/game.mjs')).href);
const {nextAction}=await import(pathToFileURL(path.join(ROOT,'tests/v5-next-policy.mjs')).href);
const {simulate}=await import(pathToFileURL(path.join(ROOT,'tests/v5-next-economy-sim.mjs')).href);
const args=process.argv.slice(2),pos=args.filter(a=>!a.startsWith('--')&&!a.includes('='));
const SPEEDS=(pos[0]??'4,5,8,10').split(',').map(Number),SEEDS=(pos[1]??'1,2,3,4,5,6,7,8,9,10').split(',').map(Number);
const SHOPS={shop:[true],noshop:[false],both:[false,true]}[pos[2]??'both'],RUNS=args.includes('--runs');
const OVER=Object.fromEntries(args.filter(a=>a.includes('=')).map(a=>a.split('=')).map(([k,v])=>[k,+v]));
if('mixed' in OVER){if(!g.DELIVERY_ENERGY)throw Error('mixed= needs the energy pass');g.DELIVERY_ENERGY.mixed=OVER.mixed;}
if('onboarding' in OVER){g.ONBOARDING.order=OVER.onboarding;g.ONBOARDING.stage=OVER.onboarding;}
if(OVER.capfixed){const e=await import(pathToFileURL(path.join(ROOT,'v5/next/energy.mjs')).href);for(const c of e.CAPACITY)c[1]=50;}
const fresh=now=>{const s=g.fresh(now);if('start' in OVER)s.energy=OVER.start;return s;};
const MIN=60000,r1=x=>x==null||!Number.isFinite(x)?null:Math.round(x*10)/10,sec=f=>g.isSecondary?.(f)??false;
const cap=s=>g.capacityOf?g.capacityOf(s):50;
const DEFAULT=structuredClone(g.SECONDARY_RULES);
const deliverKind=o=>o.story?'gold':o.needs.every(r=>sec(r.family))?'secondary':o.needs.some(r=>sec(r.family))?'mixed':'primary';
function run(speed,seed,shop){
 for(const k of Object.keys(DEFAULT))Object.assign(g.SECONDARY_RULES[k],DEFAULT[k],{model:'bonus',salt:DEFAULT[k].salt+seed*1009});
 const m={speed,seed,shop,firstOutMin:null,outs:0,orders15:0,orders20:0,restores15:0,restores20:0,firstUpgradeMin:null,firstOrderMin:null,firstRestoreMin:null,
  energyIn:{},deliveries:{},ch1Min:null,maxEnergy:0,actions:0,overCap:0};
 const add=(k,v)=>{if(v)m.energyIn[k]=(m.energyIn[k]??0)+v;};
 const proxy={...g,fresh,
  tick:(s,now)=>{const e=s.energy,r=g.tick(s,now);add('refill',s.energy-e);return r;},
  act:(s,a,now)=>{
   const e=s.energy,o=a.type==='deliver'?s.orders.find(o=>o?.id===a.id):null,r=g.act(s,a,now);if(!r.ok)return r;
   m.actions++;if(e>cap(s))m.overCap++;
   let known=0;const k=(name,v)=>{if(v){add(name,v);known+=v;}};
   for(const u of r.levelUp??[]){k('levelEnergy',u.energy);k('capacity',u.capacity?u.capacity.energy-(u.capacity.owed??0):0);}
   if(r.boost)k('firstOrder',r.boost.energy-(r.boost.owed??0));
   if(r.effects?.boost)k('firstStage',r.effects.boost.energy-(r.effects.boost.owed??0));
   if(r.effects?.energy)k('stageEffect',r.effects.energy);
   if(r.owedPaid)k('owedPaid',r.owedPaid);
   if(o){const kind=deliverKind(o);m.deliveries[kind]=(m.deliveries[kind]??0)+1;k('deliver_'+kind,r.energy??0);}
   if(r.opened?.type==='jar')k('jar',r.opened.energy);
   if(a.type==='recycle')k('recycle',r.energy??0);
   if(a.type==='ration')k('ration',s.energy-e);
   if(a.type==='buy'||a.type==='adReward')k('shop',r.energy??0);
   const de=s.energy-e+(a.type==='produce'?1:0);if(de-known>0)add('other_'+a.type,de-known);
   if(s.energy<1){m.outs+=e>=1?1:0;m.firstOutMin??=r1(now/MIN);}
   m.maxEnergy=Math.max(m.maxEnergy,s.energy);
   const t=now/MIN;
   if(r.event==='deliver'){m.firstOrderMin??=r1(t);if(t<15)m.orders15++;if(t<20)m.orders20++;}
   if(r.event==='restore'){m.firstRestoreMin??=r1(t);if(t<15)m.restores15++;if(t<20)m.restores20++;}
   if(r.event==='producerUp')m.firstUpgradeMin??=r1(t);
   if(m.ch1Min===null&&s.area>=3)m.ch1Min=r1(t);
   return r;}};
 let end=null;
 const res=simulate(proxy,nextAction,speed,seed,{until:16*3600e3,shop,onStep:s=>{end=s;},finish:s=>g.allDone(s)});
 // the harness's waits: idle time in one go (longestIdle) and the total
 return {speed,seed,shop,finished:res.finished,totalMin:r1(res.total/MIN),ch1Min:m.ch1Min,waitShare:Math.round(res.idle/res.total*100)/100,longestStopMin:r1(res.longestIdle/MIN),
  firstOutMin:m.firstOutMin,outs:m.outs,orders15:m.orders15,orders20:m.orders20,restores15:m.restores15,restores20:m.restores20,
  firstUpgradeMin:m.firstUpgradeMin,firstOrderMin:m.firstOrderMin,firstRestoreMin:m.firstRestoreMin,
  energyIn:m.energyIn,deliveries:m.deliveries,maxEnergy:m.maxEnergy,overCapShare:Math.round(m.overCap/Math.max(1,m.actions)*100)/100,endEnergy:end?.energy,owed:end?.energyOwed??0,level:end?.level?.level};
}
// waits in the first 20 minutes: run the harness again to 20 minutes with its own idle accounting
function early(speed,seed,shop){
 for(const k of Object.keys(DEFAULT))Object.assign(g.SECONDARY_RULES[k],DEFAULT[k],{model:'bonus',salt:DEFAULT[k].salt+seed*1009});
 const res=simulate({...g,fresh},nextAction,speed,seed,{until:20*MIN,shop,finish:s=>g.allDone(s)});
 return {wait20Min:r1(res.idle/MIN),longestStop20Min:r1(res.longestIdle/MIN),outs20:res.starve.length};
}
const q=(v,p)=>{const b=v.filter(x=>x!=null).sort((a,b)=>a-b);return b.length?b[Math.min(b.length-1,Math.floor((b.length-1)*p+.5))]:null;};
const stat=v=>({med:r1(q(v,.5)),min:r1(q(v,0)),max:r1(q(v,1))});
for(const shop of SHOPS)for(const speed of SPEEDS){
 const R=SEEDS.map(seed=>({...run(speed,seed,shop),...early(speed,seed,shop)}));
 if(RUNS)for(const r of R)console.log(JSON.stringify({run:1,...r}));
 const keys=['totalMin','ch1Min','waitShare','longestStopMin','firstOutMin','outs','orders15','orders20','restores15','restores20','firstUpgradeMin','firstOrderMin','firstRestoreMin','wait20Min','longestStop20Min','outs20','maxEnergy','overCapShare','endEnergy','owed','level'];
 const eKeys=[...new Set(R.flatMap(r=>Object.keys(r.energyIn)))].sort(),dKeys=[...new Set(R.flatMap(r=>Object.keys(r.deliveries)))].sort();
 console.log(JSON.stringify({root:path.basename(ROOT),variant:Object.entries(OVER).map(([k,v])=>k+'='+v).join(' ')||'as built',speed,shop,seeds:SEEDS.length,finished:R.filter(r=>r.finished).length,neverOut:R.filter(r=>r.firstOutMin===null).length,
  ...Object.fromEntries(keys.map(k=>[k,stat(R.map(r=>r[k]))])),
  energyIn:Object.fromEntries(eKeys.map(k=>[k,r1(q(R.map(r=>r.energyIn[k]??0),.5))])),
  deliveries:Object.fromEntries(dKeys.map(k=>[k,r1(q(R.map(r=>r.deliveries[k]??0),.5))]))}));
}
