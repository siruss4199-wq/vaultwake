// First 60 seconds and first 10 minutes of a NEW camp (retention task, 2026-11-14;
// docs/V5_FIRST_10_MINUTES_2026-11-14.md). The same seeded harness as the economy tests
// (tests/v5-next-economy-sim.mjs: each action's time jittered ±40 %), three player models:
//   guide   : does what the game's own guide line / Hint names (v5/next/tutor.mjs tutorStep), else the
//             scripted player. The closest model of a new player who follows the game.
//   normal  : the repo's scripted competent player (tests/v5-next-policy.mjs).
//   gold    : the gold-first player (tests/v5-next-goldfirst-policy.mjs, opportunist).
// Measures, per run, up to MINUTES (default 15) of play: firsts (tap, merge, crew order, gold order, build),
// restorations and the gaps between them, generators on the board, taps per generator, merges per chain,
// what the orders asked, free cells over time and full-board moments, obstacles left, energy and coins, the
// player level and the new rules met. Prints one JSON line per model and speed (medians over the seeds) and,
// with OUT=<file>, every run.
//   [ROOT=<tree>] [MODELS=guide,normal,gold] [MINUTES=15] node tests/v5-next-first10-metrics.mjs [speeds=3,5,8] [seeds=1..12]
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
const HERE=path.dirname(new URL(import.meta.url).pathname),ROOT=path.resolve(process.env.ROOT??path.join(HERE,'..'));
const imp=p=>import(pathToFileURL(path.join(ROOT,p)).href);
const g=await imp('v5/next/game.mjs'),{nextAction}=await imp('tests/v5-next-policy.mjs'),{primaryAction}=await imp('v5/next/guide.mjs');
const {tutorStep}=await imp('v5/next/tutor.mjs');
const {simulate,quantile}=await imp('tests/v5-next-economy-sim.mjs');
const {makeGoldFirst}=await import(pathToFileURL(path.join(HERE,'v5-next-goldfirst-policy.mjs')).href);
const args=process.argv.slice(2),SPEEDS=(args[0]??'3,5,8').split(',').map(Number),SEEDS=(args[1]??'1,2,3,4,5,6,7,8,9,10,11,12').split(',').map(Number);
const MODELS=(process.env.MODELS??'guide,normal,gold').split(','),MINUTES=+(process.env.MINUTES??15);
const MIN=60000,r1=x=>x==null||!isFinite(x)?null:Math.round(x*10)/10,med=a=>{a=a.filter(x=>x!=null&&isFinite(x));return a.length?quantile(a,.5):null;};
const p25=a=>{a=a.filter(x=>x!=null&&isFinite(x));return a.length?quantile(a,.25):null;},p75=a=>{a=a.filter(x=>x!=null&&isFinite(x));return a.length?quantile(a,.75):null;};
const free=s=>s.board.filter(x=>x===null).length;
const {makeGuidePlayer}=await import(pathToFileURL(path.join(HERE,'v5-next-first10-policy.mjs')).href);
const guidePlayer=makeGuidePlayer(g,tutorStep,nextAction);
const POLICY={guide:guidePlayer,normal:nextAction,gold:makeGoldFirst(g,primaryAction,nextAction,{opportunist:true})};
function run(model,speed,seed){
 const m={first:{},restores:[],taps:{},merges:{},mergeTiers:{},orders:{crew:0,gold:0},asked:[],free:{},full:0,fullTaps:0,actions:0,energyMin:Infinity,coinsEarned:0,
  levelAt:{},rules:[],gens:{},cratesOpened:0,glassBroken:0,at10:null,at5:null,clear:0,stored:0};
 const seen=new Set();let now=0,last=null;
 const proxy={...g,act(s,a,t){now=t;const before=a.type==='deliver'?s.orders.find(x=>x?.id===a.id):null;
  const glass0=s.board.filter(x=>x?.type==='glass').length,cargo0=s.board.filter(x=>x?.type==='cargo').length,lvl0=s.level.level,fr0=free(s),gid=a.type==='produce'?(Number.isInteger(a.index)?s.board[a.index]?.id:a.id)??a.id:null;
  const r=g.act(s,a,t);if(!r.ok)return r;m.actions++;
  if(a.type==='produce'){m.taps[gid]=(m.taps[gid]??0)+1;m.first.tap??=t;if(fr0<=1)m.fullTaps++;}
  if(r.event==='merge'){const x=s.board[a.to];if(x?.type==='item'){m.merges[x.family]=(m.merges[x.family]??0)+1;const k=x.family+x.tier;m.mergeTiers[k]=(m.mergeTiers[k]??0)+1;}m.first.merge??=t;}
  if(r.event==='deliver'&&before){m.coinsEarned+=before.coins;if(before.story){m.orders.gold++;m.first.gold??=t;}else{m.orders.crew++;m.first.crew??=t;}}
  if(r.event==='restore'){m.restores.push(t);m.first.build??=t;}
  if(r.event==='recycle')m.clear++;if(r.event==='store')m.stored++;
  if(s.board.filter(x=>x?.type==='cargo').length<cargo0)m.cratesOpened+=cargo0-s.board.filter(x=>x?.type==='cargo').length;
  if(s.board.filter(x=>x?.type==='glass').length<glass0)m.glassBroken+=glass0-s.board.filter(x=>x?.type==='glass').length;
  if(s.level.level>lvl0)for(let l=lvl0+1;l<=s.level.level;l++){m.levelAt[l]=t;for(const p of g.LEVEL_PATH??[])if(p.level===l)m.rules.push({id:p.id,t});}
  for(const k of Object.keys(s.secOpen??{}))if(s.secOpen[k]&&!seen.has('sec'+k)){seen.add('sec'+k);m.rules.push({id:'rare-'+k,t});}
  if(free(s)===0)m.full++;
  return r;}};
 const onStep=(s,t)=>{
  for(const o of s.orders)if(o&&!seen.has(o.id)){seen.add(o.id);if(t<10*MIN)m.asked.push({t,story:!!o.story,fam:[...new Set(o.needs.map(r=>r.family))],tiers:o.needs.map(r=>r.family+r.tier+'x'+r.count).join('+')});}
  for(const x of s.board)if(x?.type==='source')m.gens[x.id]??=t;
  m.energyMin=Math.min(m.energyMin,s.energy);
  for(const k of [1,2,3,5,7,10])if(t>=k*MIN&&m.free[k]==null)m.free[k]=free(s);
  const snap=()=>({free:free(s),cargo:s.board.filter(x=>x?.type==='cargo').length,glass:s.board.filter(x=>x?.type==='glass').length,items:s.board.filter(x=>x?.type==='item').length,
   energy:s.energy,coins:s.coins,level:s.level.level,built:g.totalBuilt(s),gens:s.board.filter(x=>x?.type==='source').map(x=>x.id+(x.level??1)).sort().join(',')});
  if(t>=5*MIN&&!m.at5)m.at5=snap();if(t>=10*MIN&&!m.at10)m.at10=snap();last=snap;
 };
 simulate(proxy,POLICY[model],speed,seed,{until:MINUTES*MIN,onStep,shop:false,finish:()=>false});
 if(!m.at10&&last)m.at10=last();
 return m;
}
const all=[];
for(const model of MODELS)for(const speed of SPEEDS){
 const R=SEEDS.map(sd=>({seed:sd,...run(model,speed,sd)}));all.push(...R.map(r=>({model,speed,...r})));
 const s=x=>r1(x==null?null:x/1000),mm=f=>r1(med(R.map(f))),before=(r,k)=>r.restores.filter(t=>t<k*MIN).length;
 const gaps=R.flatMap(r=>r.restores.filter(t=>t<=10*MIN).map((t,i,a)=>(t-(i?a[i-1]:0))/MIN));
 const tapsTo=(r,k)=>Object.entries(r.taps).reduce((n,[id,v])=>n+(id===k?v:0),0),tapsAll=r=>Object.values(r.taps).reduce((a,b)=>a+b,0);
 const mergesAll=r=>Object.values(r.merges).reduce((a,b)=>a+b,0);
 const asked10=R.flatMap(r=>r.asked.filter(o=>!o.story));
 console.log(JSON.stringify({root:path.basename(ROOT),model,speed,runs:R.length,
  firstTapS:r1(med(R.map(r=>r.first.tap/1000))),firstMergeS:r1(med(R.map(r=>r.first.merge/1000))),firstCrewS:r1(med(R.map(r=>r.first.crew/1000))),firstGoldS:r1(med(R.map(r=>r.first.gold/1000))),firstBuildS:r1(med(R.map(r=>r.first.build/1000))),
  builds5:mm(r=>before(r,5)),builds10:mm(r=>before(r,10)),builds10min:Math.min(...R.map(r=>before(r,10))),builds15:mm(r=>before(r,15)),
  gapMedMin:r1(med(gaps)),gapMaxMin:r1(Math.max(...gaps)),gapP75Min:r1(p75(gaps)),
  secondGenMin:mm(r=>Object.entries(r.gens).filter(([k])=>k!=='rig').map(([,t])=>t/MIN).sort((a,b)=>a-b)[0]??Infinity),
  secondGenBy10:R.filter(r=>Object.entries(r.gens).some(([k,t])=>k!=='rig'&&t<10*MIN)).length,
  rigTapShare10:r1(100*med(R.map(r=>tapsTo(r,'rig')/Math.max(1,tapsAll(r))))),taps15:mm(tapsAll),merges15:mm(mergesAll),
  rigMergeShare:r1(100*med(R.map(r=>(r.merges.rig??0)/Math.max(1,mergesAll(r))))),
  crewAskedOnlyRigPct:r1(100*asked10.filter(o=>o.fam.length===1&&o.fam[0]==='rig').length/Math.max(1,asked10.length)),
  orders10:{crew:mm(r=>r.orders.crew),gold:mm(r=>r.orders.gold)},
  free:Object.fromEntries([1,2,3,5,7,10].map(k=>[k,mm(r=>r.free[k])])),fullActionsPct:r1(100*med(R.map(r=>r.full/Math.max(1,r.actions)))),fullTapsMed:mm(r=>r.fullTaps),
  at10:{cargo:mm(r=>r.at10?.cargo),glass:mm(r=>r.at10?.glass),items:mm(r=>r.at10?.items),energy:mm(r=>r.at10?.energy),coins:mm(r=>r.at10?.coins),level:mm(r=>r.at10?.level),built:mm(r=>r.at10?.built)},
  cratesOpened15:mm(r=>r.cratesOpened),glassBroken15:mm(r=>r.glassBroken),clear15:mm(r=>r.clear),
  energyMin:mm(r=>r.energyMin),coinsEarned15:mm(r=>r.coinsEarned),
  rulesBy10:mm(r=>r.rules.filter(x=>x.t<10*MIN).length),rules:Object.fromEntries([...new Set(R.flatMap(r=>r.rules.map(x=>x.id)))].map(id=>[id,r1(med(R.map(r=>{const x=r.rules.find(q=>q.id===id);return x?x.t/MIN:Infinity;})))]))}));
}
if(process.env.OUT)fs.writeFileSync(process.env.OUT,JSON.stringify(all,null,1));
