// Coast Camp coins and restoration audit (build 48b, 2026-11-01; docs/V5_RARE_MERGES_RESTORATION_2026-11-01.md).
// The scripted player (tests/v5-next-policy.mjs) through the economy harness, Chapters 1-3, secondary model
// B with each seed's own drops. Run it in this tree or another (ROOT=<tree>) to compare builds with the
// same policy and seeds:
//   [ROOT=<tree>] node tests/v5-next-coins-metrics.mjs [speeds=4,5,8,10] [seeds=1..10] [shop|noshop|both] [--runs] [goldpay=1.5] [goldpity=8]
// Build 48c adds: tier-2 rare gold orders (appearances, completions), rare-only pursuit (from the moment
// the gold order lacks only its rare part to its delivery: minutes, that generator's taps and energy,
// the fullest board), mapped stages that fell back to their usual materials, the longest gap between
// two stages built and the longest materials-to-build wait per chapter.
// goldpay= sets what a gold order pays (its parts' worth times this; this tree only).
// Per run and per chapter (1: to the open Vault; 2: the Silent Observatory; 3: the Hidden Harbour):
// - coins in by source: crew orders (primary-only, mixed, rare-only), gold orders, the book, cargo, other;
//   coins out: stages bought, the shop; the balance at the chapter's end;
// - per stage: the gold order's coins against the stage's cost (goldCover), the crew orders delivered
//   since the stage before (ordersPerStage), and what held the stage up when its materials came in
//   (coins short at that moment, or coins already there: savings), with the balance then;
// - secondary parts asked: by tier, in crew orders and in gold orders; how long gold orders that ask a
//   rare part stood on the board, and the share of the time the player had nothing to do but wait for a
//   rare drop (rareWait: waiting with energy in hand while a gold order lacks only rare parts);
// - energy waiting, board occupancy, chapter minutes.
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const ROOT=path.resolve(process.env.ROOT??path.join(path.dirname(new URL(import.meta.url).pathname),'..'));
const g=await import(pathToFileURL(path.join(ROOT,'v5/next/game.mjs')).href);
const {nextAction}=await import(pathToFileURL(path.join(ROOT,'tests/v5-next-policy.mjs')).href);
const {TASKS}=await import(pathToFileURL(path.join(ROOT,'v5/next/areas.mjs')).href);
const {CHAINS}=await import(pathToFileURL(path.join(ROOT,'v5/next/chains.mjs')).href);
const {simulate,quantile}=await import(pathToFileURL(path.join(ROOT,'tests/v5-next-economy-sim.mjs')).href);
const args=process.argv.slice(2),pos=args.filter(a=>!a.startsWith('--')&&!a.includes('='));
const SPEEDS=(pos[0]??'4,5,8,10').split(',').map(Number),SEEDS=(pos[1]??'1,2,3,4,5,6,7,8,9,10').split(',').map(Number);
const SHOPS={shop:[true],noshop:[false],both:[false,true]}[pos[2]??'both'],RUNS=args.includes('--runs');
const OVER=Object.fromEntries(args.filter(a=>a.includes('=')).map(a=>a.split('=')).map(([k,v])=>[k,+v]));
if('goldpay' in OVER)g.GOLD_PAY.rate=OVER.goldpay;
if('goal' in OVER)g.SECONDARY_ORDERS.goal=OVER.goal;
// goldpity= sets the gold objective's guarantee (build 48c; 20 = none beyond the ordinary pity)
if('goldpity' in OVER)for(const r of Object.values(g.SECONDARY_RULES))r.goldPity=OVER.goldpity;
// norare=1: no stage asks its rare part (areas.mjs rare is ignored), to measure what those parts cost
if(OVER.norare){const a=await import(pathToFileURL(path.join(ROOT,'v5/next/areas.mjs')).href);for(const ar of a.AREAS)for(const t of ar.tasks)for(const st of t.stages)delete st.rare;for(const t of Object.values(a.TASKS))for(const st of t.stages)delete st.rare;}
const MIN=60000,r1=x=>x==null||!Number.isFinite(x)?null:Math.round(x*10)/10,sec=f=>g.isSecondary(f);
const CH=s=>s.area<3?'ch1':s.area===3?'ch2':'ch3';
const DEFAULT=structuredClone(g.SECONDARY_RULES);
function run(speed,seed,shop){
 for(const k of Object.keys(DEFAULT))Object.assign(g.SECONDARY_RULES[k],DEFAULT[k],{model:'bonus',salt:DEFAULT[k].salt+seed*1009});
 const C={ch1:{},ch2:{},ch3:{}},add=(ch,k,v)=>{if(v)C[ch][k]=(C[ch][k]??0)+v;};
 const stages=[],asked={crew:{},gold:{}},seen=new Set();let ordersSince=0,tickAt=0,acted=true,rareWait=0,idle=0;
 const T={ch1:null,ch2:null,ch3:null},occ={ch1:[],ch2:[],ch3:[]},goldRare={};let lastCh='ch1',fallback=0,lastBuild=0;const gaps={ch1:[],ch2:[],ch3:[]};
 const proxy={...g,
  tick:(s,now)=>{if(!acted){const dt=now-tickAt;idle+=dt;
    // waiting with energy in hand while the gold order lacks only rare parts: rare-only waiting
    const gold=s.orders.find(o=>o?.story);if(gold&&s.energy>=1){const miss=missingOf(s,gold);if(miss.length&&miss.every(r=>sec(r.family)))rareWait+=dt;}}
   tickAt=now;acted=false;return g.tick(s,now);},
  act:(s,a,now)=>{const ch=CH(s),c=s.coins,o=a.type==='deliver'?s.orders.find(o=>o?.id===a.id):null,e0=s.energy,r=g.act(s,a,now);if(!r.ok)return r;acted=true;
   if(a.type==='produce')for(const x of Object.values(goldRare))if(x.chase!=null&&!x.done&&a.id===x.gen){x.taps++;x.energy+=Math.max(0,e0-s.energy);}
   const dc=s.coins-c;
   if(o){const kind=o.story?'gold':o.needs.every(q=>sec(q.family))?'crewRare':o.needs.some(q=>sec(q.family))?'crewMixed':'crewPrimary';add(ch,'in_'+kind,o.coins);if(!o.story)ordersSince++;
    if(o.story){const st=stages.find(x=>!x.done&&x.id===o.story);const cost=g.upgrades(s).find(u=>u.id===o.story)?.cost;
     stages.push({id:o.story,goldCoins:o.coins,cost,coinsAtMaterials:s.coins,orders:ordersSince,at:now});
     if(goldRare[o.id])goldRare[o.id].done=now;}}
   else if(a.type==='restore'){add(ch,'out_stages',-dc);gaps[ch].push((now-lastBuild)/MIN);lastBuild=now;const st=[...stages].reverse().find(x=>x.id===r.task&&!x.boughtAt);if(st){st.boughtAt=now;st.waitMin=(now-st.at)/MIN;st.ordersTotal=ordersSince;}ordersSince=0;}
   else if(a.type==='buy')add(ch,'out_shop',-dc);
   else if(a.type==='book'||a.type==='bookPage')add(ch,'in_book',dc);
   else if(dc>0)add(ch,a.type==='unseal'?'in_cargo':'in_other',dc);
   return r;}};
 const missingOf=(s,o)=>{const have={};for(const x of s.board)if(x?.type==='item'){const k=x.family+x.tier;have[k]=(have[k]??0)+1;}return o.needs.filter(r=>(have[r.family+r.tier]??0)<r.count);};
 let end=null;
 const onStep=(s,now)=>{const ch=CH(s);end=s;
  occ[ch].push(s.board.filter(x=>x&&x.type!=='cargo'&&x.type!=='glass').length);
  if(ch!==lastCh){T[lastCh]={min:r1(now/MIN),coins:s.coins};lastCh=ch;}
  for(const o of s.orders){if(!o||seen.has(o.id))continue;seen.add(o.id);
   for(const q of o.needs)if(sec(q.family)){const bag=o.story?asked.gold:asked.crew,k=q.family+q.tier;bag[k]=(bag[k]??0)+q.count;}
   const st=o.story&&TASKS[o.story]?.stages[(s.built[o.story]??0)];if(st?.rare&&!o.needs.some(q=>sec(q.family)))fallback++;
   if(o.story&&o.needs.some(q=>sec(q.family))){const q=o.needs.find(q=>sec(q.family));goldRare[o.id]={id:o.id,at:now,story:o.story,needs:o.needs.map(q=>q.family+q.tier).join('+'),tier:q.tier,gen:CHAINS[q.family].gen,chase:null,taps:0,energy:0,board:0};}}
  // rare-only pursuit: from the first moment the gold order lacks only its rare part to its delivery
  for(const x of Object.values(goldRare)){if(x.done)continue;const o=s.orders.find(o=>o?.id===x.id);if(!o)continue;const miss=missingOf(s,o);
   if(x.chase==null&&miss.length&&miss.every(r=>sec(r.family)))x.chase=now;
   if(x.chase!=null)x.board=Math.max(x.board,s.board.filter(y=>y&&y.type!=='cargo'&&y.type!=='glass').length);}};
 const res=simulate(proxy,nextAction,speed,seed,{until:24*3600e3,shop,onStep,finish:s=>g.allDone(s)});
 T[lastCh]={min:r1(res.total/MIN),coins:end.coins};
 const bought=stages.filter(x=>x.boughtAt&&x.cost);
 const byCh=k=>bought.filter(x=>(x.id.startsWith('hb-')?'ch3':x.id.startsWith('obs-')||x.id==='vault-archive'?'ch2':'ch1')===k);
 const cover=list=>list.length?r1(100*list.reduce((a,x)=>a+x.goldCoins,0)/list.reduce((a,x)=>a+x.cost,0)):null;
 const short=list=>list.length?Math.round(100*list.filter(x=>x.coinsAtMaterials<x.cost).length/list.length):null;
 const rareGold=Object.values(goldRare).filter(x=>x.done).map(x=>(x.done-x.at)/MIN);
 const rareGoldBy=Object.values(goldRare).filter(x=>x.done).map(x=>`${x.story} ${x.needs} ${r1((x.done-x.at)/MIN)}m chase ${x.chase!=null?r1((x.done-x.chase)/MIN):0}m ${x.taps}t`);
 const done=Object.values(goldRare).filter(x=>x.done),chase=done.map(x=>x.chase!=null?(x.done-x.chase)/MIN:0);
 const t2=Object.values(goldRare).filter(x=>x.tier>=2);
 return {speed,seed,shop,finished:res.finished,totalMin:r1(res.total/MIN),waitShare:Math.round(res.idle/res.total*100)/100,rareWaitMin:r1(rareWait/MIN),
  chapters:Object.fromEntries(['ch1','ch2','ch3'].map(k=>[k,{endMin:T[k]?.min,endCoins:T[k]?.coins,coins:C[k],goldCoverPct:cover(byCh(k)),coinShortPct:short(byCh(k)),
   ordersPerStage:r1(quantile(byCh(k).map(x=>x.ordersTotal??0),.5)),coinsAtMaterials:r1(quantile(byCh(k).map(x=>x.coinsAtMaterials),.5)),stageWaitMin:r1(quantile(byCh(k).map(x=>x.waitMin??0),.5)),stageWaitMax:r1(Math.max(0,...byCh(k).map(x=>x.waitMin??0))),boardMedian:quantile(occ[k],.5)}])),
  asked,rareGoldWaitMed:r1(quantile(rareGold,.5)),rareGoldWaitMax:r1(Math.max(0,...rareGold)),rareGoldOrders:rareGold.length,rareGoldBy,
  tier2Gold:t2.length,tier2Done:t2.filter(x=>x.done).length,chaseMed:r1(quantile(chase,.5)),chaseMax:r1(Math.max(0,...chase)),chaseTapsMax:Math.max(0,...done.map(x=>x.taps)),chaseEnergyMax:Math.max(0,...done.map(x=>x.energy)),chaseBoardMax:Math.max(0,...done.map(x=>x.board)),fallback,
  gapMax:Object.fromEntries(Object.entries(gaps).map(([k,v])=>[k,r1(Math.max(0,...v))]))};
}
const q=(v,p)=>r1(quantile(v.filter(x=>x!=null),p));
for(const shop of SHOPS)for(const speed of SPEEDS){
 const R=SEEDS.map(seed=>run(speed,seed,shop));if(RUNS)for(const r of R)console.log(JSON.stringify({run:1,...r}));
 const row={root:path.basename(ROOT),goldpay:g.GOLD_PAY?.rate??1.5,speed,shop,seeds:R.length,finished:R.filter(r=>r.finished).length,totalMin:q(R.map(r=>r.totalMin),.5),waitShare:q(R.map(r=>r.waitShare),.5),rareWaitMin:q(R.map(r=>r.rareWaitMin),.5),rareWaitMax:q(R.map(r=>r.rareWaitMin),1),
  rareGoldWaitMed:q(R.map(r=>r.rareGoldWaitMed),.5),rareGoldWaitMax:q(R.map(r=>r.rareGoldWaitMax),1),rareGoldOrders:q(R.map(r=>r.rareGoldOrders),.5),
  tier2Gold:R.reduce((a,r)=>a+(r.tier2Gold??0),0),tier2Done:R.reduce((a,r)=>a+(r.tier2Done??0),0),chaseMed:q(R.map(r=>r.chaseMed),.5),chaseMax:q(R.map(r=>r.chaseMax),1),chaseTapsMax:q(R.map(r=>r.chaseTapsMax),1),chaseEnergyMax:q(R.map(r=>r.chaseEnergyMax),1),chaseBoardMax:q(R.map(r=>r.chaseBoardMax),1),fallback:R.reduce((a,r)=>a+(r.fallback??0),0),
  gapMax:Object.fromEntries(['ch1','ch2','ch3'].map(k=>[k,q(R.map(r=>r.gapMax?.[k]),1)])),stageWaitMax:Object.fromEntries(['ch1','ch2','ch3'].map(k=>[k,q(R.map(r=>r.chapters[k].stageWaitMax),1)]))};
 for(const k of ['ch1','ch2','ch3']){const P=R.map(r=>r.chapters[k]),keys=[...new Set(P.flatMap(p=>Object.keys(p.coins)))].sort();
  row[k]={endMin:q(P.map(p=>p.endMin),.5),endCoins:q(P.map(p=>p.endCoins),.5),goldCoverPct:q(P.map(p=>p.goldCoverPct),.5),coinShortPct:q(P.map(p=>p.coinShortPct),.5),ordersPerStage:q(P.map(p=>p.ordersPerStage),.5),
   coinsAtMaterials:q(P.map(p=>p.coinsAtMaterials),.5),stageWaitMin:q(P.map(p=>p.stageWaitMin),.5),boardMedian:q(P.map(p=>p.boardMedian),.5),coins:Object.fromEntries(keys.map(c=>[c,q(P.map(p=>p.coins[c]??0),.5)]))};}
 const tiers=bag=>{const out={};for(const r of R)for(const [k,v] of Object.entries(r.asked[bag]))out[k]=(out[k]??0)+v;for(const k of Object.keys(out))out[k]=r1(out[k]/R.length);return out;};
 row.askedCrew=tiers('crew');row.askedGold=tiers('gold');
 console.log(JSON.stringify(row));
}
