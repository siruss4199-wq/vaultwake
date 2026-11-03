// Build 52A3 (docs/V5_BUILD52A_ECONOMY_2026-11-03.md, "Order difficulty and rare drops"): how much work orders take
// and how rare the rare parts are, for the ordinary scripted player (tests/v5-next-policy.mjs, whole game, shop
// on) and the gold-first player (tests/v5-next-goldfirst-policy.mjs, opportunist, Chapter 1, no shop).
// Per delivered order: its parts' worth in Level 1 parts (2^tier each; merge steps = that minus the parts asked),
// how many chains it asks; taps per order; repeats (an everyday order asking the same parts as one of the last
// four); rare drops (taps and crates) and rare orders delivered per chapter; rare gold order waits; the Survey
// Kite; the first 15 minutes; energy starvation, full-board deadlocks; coins by source.
//   [ROOT=<tree>] [SEC='{"chance":0.04,"pity":24,"goldPity":10}'] [RAMP='{"low2":2}'] [POLICY=goldfirst]
//   node tests/v5-next-difficulty-metrics.mjs [speeds=4,5,8,10] [seeds=1..10]
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const HERE=path.dirname(new URL(import.meta.url).pathname),ROOT=path.resolve(process.env.ROOT??path.join(HERE,'..'));
const g=await import(pathToFileURL(path.join(ROOT,'v5/next/game.mjs')).href);
const {nextAction}=await import(pathToFileURL(path.join(ROOT,'tests/v5-next-policy.mjs')).href);
const {primaryAction}=await import(pathToFileURL(path.join(ROOT,'v5/next/guide.mjs')).href);
const {simulate,freeAction,quantile}=await import(pathToFileURL(path.join(ROOT,'tests/v5-next-economy-sim.mjs')).href);
const {makeGoldFirst}=await import(pathToFileURL(path.join(HERE,'v5-next-goldfirst-policy.mjs')).href);
if(process.env.SEC)for(const k of Object.keys(g.SECONDARY_RULES))Object.assign(g.SECONDARY_RULES[k],JSON.parse(process.env.SEC));
if(process.env.RAMP&&g.ORDER_RAMP)Object.assign(g.ORDER_RAMP,JSON.parse(process.env.RAMP));
if(process.env.GOLD)Object.assign(g.GOLD_PAY,JSON.parse(process.env.GOLD));
if(process.env.DEEP&&g.DEEP_ENERGY)Object.assign(g.DEEP_ENERGY,JSON.parse(process.env.DEEP));
if(process.env.TURN)g.GOLD_TURN.splice(0,g.GOLD_TURN.length,...JSON.parse(process.env.TURN));
if(process.env.SECORD)Object.assign(g.SECONDARY_ORDERS,JSON.parse(process.env.SECORD));
const args=process.argv.slice(2),SPEEDS=(args[0]??'4,5,8,10').split(',').map(Number),SEEDS=(args[1]??'1,2,3,4,5,6,7,8,9,10').split(',').map(Number);
const GOLDFIRST=process.env.POLICY==='goldfirst'||process.env.POLICY==='strict',policy=GOLDFIRST?makeGoldFirst(g,primaryAction,nextAction,{opportunist:process.env.POLICY!=='strict'}):nextAction;
const MIN=60000,r1=x=>x==null||!isFinite(x)?null:Math.round(x*10)/10,sum=a=>a.reduce((x,y)=>x+y,0),mean=a=>a.length?sum(a)/a.length:null,med=a=>a.length?quantile(a,.5):null;
const CH=s=>s.area<3?'ch1':s.area===3?'ch2':s.area===4?'ch3':s.area===5?'ch4':s.area===6?'ch5':'ch6';
const units=needs=>sum(needs.filter(r=>!g.isSecondary(r.family)).map(r=>r.count*2**r.tier));
const asked=needs=>sum(needs.filter(r=>!g.isSecondary(r.family)).map(r=>r.count));
function run(speed,seed){
 const m={crew:[],gold:[],crewSteps:[],goldSteps:[],crewParts:[],goldParts:[],crewChains:[],goldChains:[],repeats:0,crewMade:0,rareDrop:{},rareCrate:{},rareDone:{},rareGoldWait:[],firstRareGold:null,kite:null,
  coins:{gold:0,crew:0},deadlock:0,taps:0,deliveries:0,ch1Wait:[],ch1Short:0,ch1Stages:0};
 const born={},recent=[],pendingAt={};let now=0;
 const proxy={...g,act(s,a,t){now=t;const o=a.type==='deliver'?s.orders.find(x=>x?.id===a.id):null,box=a.type==='openKit'?s.board[a.index]:null,ch=CH(s);
  const r=g.act(s,a,t);if(!r.ok)return r;
  if(a.type==='produce'){m.taps++;if(r.secondary)m.rareDrop[ch]=(m.rareDrop[ch]??0)+1;}
  if(r.event==='kit'&&box){const x=s.board[r.index];if(x?.type==='item'&&g.isSecondary(x.family))m.rareCrate[ch]=(m.rareCrate[ch]??0)+1;}
  if(r.event==='deliver'&&o){m.deliveries++;const k=o.story?'gold':'crew';m.coins[k]+=o.coins;
   const u=units(o.needs);if(asked(o.needs)){m[k].push(u);m[k+'Steps'].push(u-asked(o.needs));m[k+'Parts'].push(asked(o.needs));m[k+'Chains'].push(new Set(o.needs.map(n=>n.family)).size);}
   if(o.needs.some(n=>g.isSecondary(n.family))){m.rareDone[ch]=(m.rareDone[ch]??0)+1;if(o.story)m.rareGoldWait.push((t-born[o.id])/MIN);}}
  if(r.event==='restore'&&ch==='ch1'){if(pendingAt[a.id]!=null)m.ch1Wait.push((t-pendingAt[a.id])/MIN);m.ch1Stages++;delete pendingAt[a.id];}
  return r;}};
 const onStep=(s,t)=>{
  for(const o of s.orders){if(!o||born[o.id]!=null)continue;born[o.id]=t;
   if(!o.story&&g.orderItems){const key=o.needs.map(n=>n.family+n.tier+'x'+n.count).sort().join('+');if(recent.slice(-4).includes(key))m.repeats++;m.crewMade++;recent.push(key);}
   if(o.story&&!m.firstRareGold&&o.needs.some(n=>g.isSecondary(n.family)))m.firstRareGold=t/MIN;}
  if(s.area<3)for(const u of g.upgrades(s))if(u.materials&&pendingAt[u.id]==null){pendingAt[u.id]=t;if(s.coins<u.cost)m.ch1Short++;}
  if(!m.kite&&s.board.some(x=>x?.type==='source'&&x.id==='chart'))m.kite=t/MIN;
  if(!s.board.includes(null)&&s.energy>=1&&!freeAction(g,s)&&!nextAction(s))m.deadlock++;};
 const res=simulate(proxy,policy,speed,seed,{until:24*3600e3,shop:!GOLDFIRST,onStep,finish:GOLDFIRST?s=>s.area>=3:s=>g.allDone(s)});
 return {...m,finished:res.finished,total:res.total/MIN,starve:sum(res.starve)/MIN,longestIdle:res.longestIdle/MIN,f15:res.first15.restores};
}
for(const speed of SPEEDS){const R=SEEDS.map(sd=>run(speed,sd)),mm=f=>r1(med(R.map(f))),chs=GOLDFIRST?['ch1']:['ch1','ch2','ch3','ch4','ch5','ch6'];
 const per=k=>Object.fromEntries(chs.map(c=>[c,mm(r=>r[k][c]??0)]));
 console.log(JSON.stringify({root:path.basename(ROOT),policy:GOLDFIRST?'goldfirst':'normal',sec:process.env.SEC??null,ramp:process.env.RAMP??null,speed,finished:R.filter(r=>r.finished).length,
  totalMin:mm(r=>r.total),starveMean:r1(mean(R.map(r=>r.starve))),starveOver5:R.filter(r=>r.starve>5).length,starveMax:r1(Math.max(...R.map(r=>r.starve))),longestIdleMax:r1(Math.max(...R.map(r=>r.longestIdle))),deadlock:Math.max(...R.map(r=>r.deadlock)),
  f15min:Math.min(...R.map(r=>r.f15)),f15med:mm(r=>r.f15),kiteMed:mm(r=>r.kite),kiteMax:r1(Math.max(...R.map(r=>r.kite??Infinity))),
  crewUnits:r1(mean(R.flatMap(r=>r.crew))),goldUnits:r1(mean(R.flatMap(r=>r.gold))),crewSteps:r1(mean(R.flatMap(r=>r.crewSteps))),goldSteps:r1(mean(R.flatMap(r=>r.goldSteps))),crewParts:r1(mean(R.flatMap(r=>r.crewParts))),goldParts:r1(mean(R.flatMap(r=>r.goldParts))),crewChains:r1(mean(R.flatMap(r=>r.crewChains))),goldChains:r1(mean(R.flatMap(r=>r.goldChains))),
  tapsPerOrder:r1(mean(R.map(r=>r.taps/Math.max(1,r.deliveries)))),repeatPct:r1(100*sum(R.map(r=>r.repeats))/Math.max(1,sum(R.map(r=>r.crewMade)))),
  rareDrops:per('rareDrop'),rareCrate:per('rareCrate'),rareDone:per('rareDone'),
  rareGoldWaitMed:r1(med(R.flatMap(r=>r.rareGoldWait))),rareGoldWaitMax:r1(Math.max(...R.flatMap(r=>r.rareGoldWait))),firstRareGoldMed:mm(r=>r.firstRareGold),
  goldShare:mm(r=>100*r.coins.gold/Math.max(1,r.coins.gold+r.coins.crew)),ch1WaitMed:mm(r=>med(r.ch1Wait)),ch1ShortPct:mm(r=>100*r.ch1Short/Math.max(1,r.ch1Stages))}));}
