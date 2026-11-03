// Build 52A player feedback: what a gold-first player (tests/v5-next-goldfirst-policy.mjs) earns and from where.
// Fresh camps and an "existing save" (a camp played by the ordinary scripted player to stage 10, then gold-first),
// no shop purchases. Per run: coins in by source (gold orders, crew orders, the book, cargo, crates and other),
// crew orders delivered over the first six stages and Chapter 1, the coins short when each stage's materials came
// in and the wait for them, the first rare gold order against the Survey Kite's arrival, energy waiting.
//   [ROOT=<tree>] node tests/v5-next-goldfirst-metrics.mjs [speeds=4,5,8,10] [seeds=1..10] [fresh|save]
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const ROOT=path.resolve(process.env.ROOT??path.join(path.dirname(new URL(import.meta.url).pathname),'..'));
const g=await import(pathToFileURL(path.join(ROOT,'v5/next/game.mjs')).href);
const {primaryAction}=await import(pathToFileURL(path.join(ROOT,'v5/next/guide.mjs')).href);
const {nextAction}=await import(pathToFileURL(path.join(ROOT,'tests/v5-next-policy.mjs')).href);
const {simulate,quantile}=await import(pathToFileURL(path.join(ROOT,'tests/v5-next-economy-sim.mjs')).href);
const {makeGoldFirst}=await import(pathToFileURL(path.join(path.dirname(new URL(import.meta.url).pathname),'v5-next-goldfirst-policy.mjs')).href);
// tuning (this tree only): GOLD='{"earlyRate":0.7,"early":6}' sets GOLD_PAY fields
if(process.env.GOLD)Object.assign(g.GOLD_PAY,JSON.parse(process.env.GOLD));
const args=process.argv.slice(2),SPEEDS=(args[0]??'4,5,8,10').split(',').map(Number),SEEDS=(args[1]??'1,2,3,4,5,6,7,8,9,10').split(',').map(Number),MODE=args[2]??'fresh';
const MIN=60000,r1=x=>x==null?null:Math.round(x*10)/10,med=a=>a.length?quantile(a,.5):null,goldFirst=makeGoldFirst(g,primaryAction,nextAction,{opportunist:process.env.OPP==='1'});
export function run(speed,seed,mode=MODE){
 const m={src:{gold:0,crew:0,book:0,cargo:0,other:0},early:{gold:0,crew:0,book:0,cargo:0,other:0,crewOrders:0},ch1:{crewOrders:0,stages:0,short:0,wait:[]},f6:{short:0,wait:[]},restores:0,firstRareGold:null,kite:null,firstRareGoldStage:null};
 let now=0,pendingAt={};
 const proxy={...g,act(s,a,t){now=t;const c0=s.coins,o=a.type==='deliver'?s.orders.find(x=>x?.id===a.id):null,r=g.act(s,a,t);if(!r.ok)return r;
  const d=s.coins-c0;
  if(d>0){const k=o?(o.story?'gold':'crew'):a.type==='book'||a.type==='bookPage'?'book':r.event==='unseal'?'cargo':'other';m.src[k]+=d;if(m.restores<6)m.early[k]+=d;}
  if(o&&!o.story){if(m.restores<6)m.early.crewOrders++;if(s.area<3||(s.area===3&&false))m.ch1.crewOrders++;}
  if(r.event==='restore'){m.restores++;if(s.area<3||m.ch1.stages<45){if(pendingAt[a.id]!=null){m.ch1.wait.push((t-pendingAt[a.id])/MIN);if(m.restores<=6)m.f6.wait.push((t-pendingAt[a.id])/MIN);}m.ch1.stages++;}delete pendingAt[a.id];}
  return r;}};
 const policy=s=>mode==='save'&&g.totalBuilt(s)<10?nextAction(s):goldFirst(s);
 const onStep=(s,t)=>{
  for(const u of g.upgrades(s))if(u.materials&&pendingAt[u.id]==null){pendingAt[u.id]=t;if(s.area<3&&s.coins<u.cost)m.ch1.short++;if(m.restores<6&&s.coins<u.cost)m.f6.short++;}
  if(!m.kite&&s.board.some(x=>x?.type==='source'&&x.id==='chart'))m.kite={min:r1(t/MIN),built:g.totalBuilt(s)};
  const gold=s.orders.find(o=>o?.story);if(!m.firstRareGold&&gold?.needs.some(n=>g.isSecondary(n.family)))m.firstRareGold={min:r1(t/MIN),built:g.totalBuilt(s),stage:gold.story,needs:gold.needs.map(n=>n.family+n.tier+'x'+n.count).join('+')};};
 const res=simulate(proxy,policy,speed,seed,{until:24*3600e3,shop:false,onStep,finish:s=>s.area>=3});
 const tot=Object.values(m.src).reduce((a,b)=>a+b,0),e=Object.values(m.early).reduce((a,b,i)=>i<5?a+b:a,0);
 return {speed,seed,finished:res.finished,ch1Min:r1(res.total/MIN),idleMin:r1(res.idle/MIN),starveMin:r1(res.starve.reduce((a,b)=>a+b,0)/MIN),f15:res.first15.restores,
  crewShare:r1(100*m.src.crew/Math.max(1,tot)),goldShare:r1(100*m.src.gold/Math.max(1,tot)),src:m.src,early:m.early,earlyCrewShare:r1(100*m.early.crew/Math.max(1,e)),
  ch1CrewOrders:m.ch1.crewOrders,f6Short:m.f6.short,f6Wait:r1(m.f6.wait.reduce((a,b)=>a+b,0)),ch1Short:r1(100*m.ch1.short/Math.max(1,m.ch1.stages)),ch1WaitMed:r1(med(m.ch1.wait)),kite:m.kite,firstRareGold:m.firstRareGold};
}
if(import.meta.url===pathToFileURL(process.argv[1]).href){
 for(const sp of SPEEDS){const R=SEEDS.map(sd=>run(sp,sd)),mm=f=>r1(med(R.map(f)));
  const rare=R.map(r=>r.firstRareGold),kite=R.map(r=>r.kite);
  console.log(JSON.stringify({root:path.basename(ROOT),gold:process.env.GOLD??null,mode:MODE,opp:process.env.OPP==='1',speed:sp,finished:R.filter(r=>r.finished).length,ch1Min:mm(r=>r.ch1Min),idle:mm(r=>r.idleMin),starve:mm(r=>r.starveMin),f15:mm(r=>r.f15),
   crewShare:mm(r=>r.crewShare),goldShare:mm(r=>r.goldShare),src:Object.fromEntries(Object.keys(R[0].src).map(k=>[k,mm(r=>r.src[k])])),
   early:Object.fromEntries(Object.keys(R[0].early).map(k=>[k,mm(r=>r.early[k])])),earlyCrewShare:mm(r=>r.earlyCrewShare),
   f6Short:mm(r=>r.f6Short),f6WaitTotal:mm(r=>r.f6Wait),ch1CrewOrders:mm(r=>r.ch1CrewOrders),ch1Short:mm(r=>r.ch1Short),ch1WaitMed:mm(r=>r.ch1WaitMed),
   kiteMin:mm(r=>r.kite?.min??Infinity),kiteBuilt:mm(r=>r.kite?.built??99),firstRareGoldMin:mm(r=>r.firstRareGold?.min??Infinity),firstRareGoldBuilt:mm(r=>r.firstRareGold?.built??99),
   rareBeforeKite:R.filter(r=>r.firstRareGold&&r.kite&&r.firstRareGold.min<r.kite.min).length,firstRareStages:[...new Set(rare.filter(Boolean).map(x=>x.stage+' '+x.needs))].slice(0,3)}));}
}
