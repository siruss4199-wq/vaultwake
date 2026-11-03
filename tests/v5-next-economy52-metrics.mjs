// Build 52A economy probe (docs/V5_BUILD52A_ECONOMY_2026-11-03.md): the scripted player (tests/v5-next-policy.mjs)
// through the whole game with the economy harness, recording what the coins metrics do not:
// - rare (secondary) parts asked, by DISPLAYED level (internal tier 0 = Level 1), in crew and in gold orders,
//   how many Level-1 asks came after the chain's introduction, and how long rare orders took to deliver;
// - crates: parts opened by crate size and their coin worth (partValue), crates merged;
// - Clear: parts cleared, energy refunded;
// - coins: gold-order coins against crew-order coins, crew orders per restoration, coins left after each build;
// - energy spent (taps), waiting (idle, starving), board occupancy and full-board deadlocks (a full board
//   with energy in hand and nothing free to do).
// Run it in this tree or another (ROOT=<tree>) to compare builds with the same policy and seeds:
//   [ROOT=<tree>] node tests/v5-next-economy52-metrics.mjs [speeds=4,5,8,10] [seeds=1..10] [shop|noshop]
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const ROOT=path.resolve(process.env.ROOT??path.join(path.dirname(new URL(import.meta.url).pathname),'..'));
const g=await import(pathToFileURL(path.join(ROOT,'v5/next/game.mjs')).href);
const {nextAction}=await import(pathToFileURL(path.join(ROOT,'tests/v5-next-policy.mjs')).href);
const {TASKS}=await import(pathToFileURL(path.join(ROOT,'v5/next/areas.mjs')).href);
const {simulate,freeAction,quantile}=await import(pathToFileURL(path.join(ROOT,'tests/v5-next-economy-sim.mjs')).href);
const argv=process.argv.slice(2),args=argv.filter(a=>!a.includes('='));
const SPEEDS=(args[0]??'4,5,8,10').split(',').map(Number),SEEDS=(args[1]??'1,2,3,4,5,6,7,8,9,10').split(',').map(Number),SHOP=(args[2]??'shop')==='shop';
// tuning (this tree only): earlyrate= / rate= / early= set GOLD_PAY, crew= multiplies the crew orders' pay (ROLE_PAY)
const OVER=Object.fromEntries(argv.filter(a=>a.includes('=')).map(a=>a.split('=')).map(([k,v])=>[k,+v]));
if('earlyrate' in OVER)g.GOLD_PAY.earlyRate=OVER.earlyrate;if('mid' in OVER)g.GOLD_PAY.mid=OVER.mid;if('midrate' in OVER)g.GOLD_PAY.midRate=OVER.midrate;if('rate' in OVER)g.GOLD_PAY.rate=OVER.rate;if('early' in OVER)g.GOLD_PAY.early=OVER.early;if('opening' in OVER)g.GOLD_PAY.opening=OVER.opening;if('openingrate' in OVER)g.GOLD_PAY.openingRate=OVER.openingrate;
if('goal' in OVER)g.SECONDARY_ORDERS.goal=OVER.goal;
if('crew' in OVER)for(const k of Object.keys(g.ROLE_PAY))g.ROLE_PAY[k]*=OVER.crew;
// crateold=1: the 51d crate contents (v5/kits.mjs KIT_DROPS) in this tree, to tell the crates apart from the rest
// CRATES='1:1,0,1;2:2,1,2,2,1;3:3,2,3,2,2,rare' tries other crate contents (same part counts) in this tree
if(process.env.CRATES&&g.CRATE_DROPS)for(const part of process.env.CRATES.split(';')){const [z,l]=part.split(':');g.CRATE_DROPS[z].splice(0,g.CRATE_DROPS[z].length,...l.split(',').map(v=>v==='rare'?v:+v));}
if(OVER.crateold&&g.CRATE_DROPS){const k=await import(pathToFileURL(path.join(ROOT,'v5/kits.mjs')).href);for(const z of [1,2,3])g.CRATE_DROPS[z].splice(0,g.CRATE_DROPS[z].length,...k.KIT_DROPS[z]);}
const MIN=60000,CH=s=>s.area<3?'ch1':s.area===3?'ch2':s.area===4?'ch3':s.area===5?'ch4':s.area===6?'ch5':'ch6';
const med=a=>a.length?quantile(a,.5):null,r1=x=>x==null?null:Math.round(x*10)/10,sum=a=>a.reduce((x,y)=>x+y,0);
function run(speed,seed){
 const m={speed,seed,rare:{crew:{},gold:{}},rareL1AfterIntro:0,rareWait:{crew:{},gold:{}},crate:{opened:{},worth:{},merged:0},firstGold:{},rareFallback:0,rareNotDroppable:0,clear:{n:0,energy:0},
  coins:{gold:0,crew:0},f6:{gold:0,crew:0,crewOrders:0},deliveries:{gold:0,crew:0},restores:0,coinsAfterBuild:[],chapter:{},board:[],deadlock:0,samples:0};
 const seen=new Set(),born={},introduced=new Set();let now=0;
 const ch=s=>m.chapter[CH(s)]??={gold:0,crew:0,crewOrders:0,restores:0,taps:0,start:now,end:now};
 const proxy={...g,act(s,a,t){
  now=t;const before=a.type==='deliver'?s.orders.find(o=>o?.id===a.id):null,box=a.type==='openKit'?{...s.board[a.index]}:null;
  const merging=a.type==='merge'?[s.board[a.from],s.board[a.to]]:null,clearing=a.type==='recycle'?s.board[a.index]:null,e0=s.energy;
  const c=ch(s),r=g.act(s,a,t);if(!r.ok)return r;
  if(a.type==='produce')c.taps++;
  if(r.event==='deliver'&&before){const k=before.story?'gold':'crew';m.coins[k]+=before.coins;m.deliveries[k]++;c[k]+=before.coins;if(!before.story)c.crewOrders++;if(m.restores<6){m.f6[k]+=before.coins;if(!before.story)m.f6.crewOrders++;}
   const rare=before.needs.filter(n=>g.isSecondary(n.family));if(rare.length){const lv='L'+(Math.max(...rare.map(n=>n.tier))+1);(m.rareWait[k][lv]??=[]).push((t-born[before.id])/MIN);}}
  if(r.event==='kit'&&box){const x=s.board[r.index],sz='size'+box.size;m.crate.opened[sz]=(m.crate.opened[sz]??0)+1;m.crate.worth[sz]=(m.crate.worth[sz]??0)+(x?.type==='item'?g.partValue(x):0);}
  if(r.event==='merge'&&merging?.[0]?.type==='kit')m.crate.merged++;
  if(r.event==='recycle'&&clearing){m.clear.n++;m.clear.energy+=Math.max(0,s.energy-e0);}
  if(r.event==='restore'){m.restores++;c.restores++;m.coinsAfterBuild.push(s.coins);}
  c.end=t;return r;}};
 const onStep=(s,t)=>{now=t;ch(s).end=t;
  for(const o of s.orders){if(!o||seen.has(o.id))continue;seen.add(o.id);born[o.id]=t;
   // rare gold orders: when each displayed level first appears, and whether its chain could drop then
   if(o.story){const st=TASKS[o.story]?.stages?.[s.built[o.story]??0],rare=o.needs.filter(n=>g.isSecondary(n.family));
    if(st?.rare&&!rare.length)m.rareFallback++;
    for(const n of rare){const lv='L'+(n.tier+1);m.firstGold[lv]??={min:Math.round(t/MIN*10)/10,ch:CH(s),stage:o.story+' '+((s.built[o.story]??0)+1)};if(!g.secondaryCanDrop(s,n.family))m.rareNotDroppable++;}}
   const k=o.story?'gold':'crew';for(const n of o.needs)if(g.isSecondary(n.family)){const lv='L'+(n.tier+1);m.rare[k][lv]=(m.rare[k][lv]??0)+1;
    if(n.tier===0){if(introduced.has(n.family))m.rareL1AfterIntro++;else introduced.add(n.family);}}}
  m.samples++;const cells=s.board.filter(x=>x&&x.type!=='cargo'&&x.type!=='glass').length;m.board.push(cells);
  if(!s.board.includes(null)&&s.energy>=1&&!freeAction(g,s)&&!nextAction(s))m.deadlock++;};
 const res=simulate(proxy,nextAction,speed,seed,{until:24*3600e3,shop:SHOP,onStep,finish:s=>g.allDone(s)});
 for(const c of Object.values(m.chapter))c.minutes=r1((c.end-c.start)/MIN);
 return {...m,finished:res.finished,totalMin:r1(res.total/MIN),idleMin:r1(res.idle/MIN),starveMin:r1(sum(res.starve)/MIN),taps:res.taps,bought:res.bought,rations:res.rations,first15:res.first15.restores,firstRestore:r1(res.first.restore/MIN)};
}
const rows=[];
for(const speed of SPEEDS)for(const seed of SEEDS)rows.push(run(speed,seed));
// one line per speed: medians over the seeds (sums of counts per run, then the median)
for(const speed of SPEEDS){const R=rows.filter(r=>r.speed===speed),mm=f=>r1(med(R.map(f)));
 const lv=(k,l)=>mm(r=>r.rare[k][l]??0),wait=(k,l)=>r1(med(R.flatMap(r=>r.rareWait[k][l]??[]))),ch1=f=>mm(r=>f(r.chapter.ch1??{}));
 const crate=sz=>({opened:mm(r=>r.crate.opened[sz]??0),worthPerPart:r1(sum(R.map(r=>r.crate.worth[sz]??0))/Math.max(1,sum(R.map(r=>r.crate.opened[sz]??0))))});
 console.log(JSON.stringify({root:path.basename(ROOT),over:OVER,speed,shop:SHOP,runs:R.length,finished:R.filter(r=>r.finished).length,totalMin:mm(r=>r.totalMin),idleMin:mm(r=>r.idleMin),starveMin:mm(r=>r.starveMin),taps:mm(r=>r.taps),bought:mm(r=>r.bought),
  rareCrew:{L1:lv('crew','L1'),L2:lv('crew','L2'),L3:lv('crew','L3')},rareGold:{L1:lv('gold','L1'),L2:lv('gold','L2'),L3:lv('gold','L3')},rareL1AfterIntro:mm(r=>r.rareL1AfterIntro),
  rareWaitMin:{crewL1:wait('crew','L1'),crewL2:wait('crew','L2'),crewL3:wait('crew','L3'),goldL2:wait('gold','L2'),goldL3:wait('gold','L3')},
  crates:{driftwood:crate('size1'),sea:crate('size2'),trunk:crate('size3'),merged:mm(r=>r.crate.merged)},clear:{n:mm(r=>r.clear.n),energy:mm(r=>r.clear.energy)},
  coins:{gold:mm(r=>r.coins.gold),crew:mm(r=>r.coins.crew),goldShare:mm(r=>r.coins.gold/Math.max(1,r.coins.gold+r.coins.crew)*100)},
  ch1:{minutes:ch1(c=>c.minutes),goldShare:ch1(c=>c.gold/Math.max(1,c.gold+c.crew)*100),crewPerStage:ch1(c=>c.crewOrders/Math.max(1,c.restores))},
  first6:{goldShare:mm(r=>r.f6.gold/Math.max(1,r.f6.gold+r.f6.crew)*100),crewCoins:mm(r=>r.f6.crew),goldCoins:mm(r=>r.f6.gold),crewOrders:mm(r=>r.f6.crewOrders)},crewPerStage:mm(r=>r.deliveries.crew/Math.max(1,r.restores)),coinsAfterBuildMed:mm(r=>med(r.coinsAfterBuild)),
  first15Restores:{min:Math.min(...R.map(r=>r.first15)),med:mm(r=>r.first15)},firstRestoreMin:mm(r=>r.firstRestore),
  firstRareGold:Object.fromEntries(['L2','L3'].map(l=>{const v=R.map(r=>r.firstGold[l]).filter(Boolean);return [l,{n:v.length,minMin:v.length?Math.min(...v.map(x=>x.min)):null,medMin:r1(med(v.map(x=>x.min))),where:[...new Set(v.map(x=>x.ch+' '+x.stage))].slice(0,3)}];})),
  rareFallback:mm(r=>r.rareFallback),rareNotDroppable:mm(r=>r.rareNotDroppable),
  boardMed:mm(r=>med(r.board)),deadlockSamples:mm(r=>r.deadlock)}));}
