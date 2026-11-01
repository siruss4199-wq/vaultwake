// Coast Camp pacing through Chapter 3 (build 48a; docs/V5_CHAPTER3_HARBOUR_2026-11-01.md): the scripted
// player (tests/v5-next-policy.mjs) through the economy harness, from a new camp to the Hidden Harbour's
// launch, at several speeds and seeds, secondary model B with each seed's own drops (as the energy pass
// measured). Read-only. Per chapter (1: to the open Vault; 2: the Silent Observatory; 3: the Hidden
// Harbour) it reports minutes, active play and waiting apart, stages and minutes per stage, the longest
// gap between stages, board occupancy and how often it is full, rewards waiting for space; for Chapter
// 3 also each gold order: what it asked and how long it stood on the board.
//   node tests/v5-next-chapter3-metrics.mjs [speeds=4,5,8,10] [seeds=1..10] [shop|noshop|both] [--runs] [--gold]
import * as g from '../v5/next/game.mjs';
import {nextAction} from './v5-next-policy.mjs';
import {simulate,quantile} from './v5-next-economy-sim.mjs';
const args=process.argv.slice(2),pos=args.filter(a=>!a.startsWith('--'));
const SPEEDS=(pos[0]??'4,5,8,10').split(',').map(Number),SEEDS=(pos[1]??'1,2,3,4,5,6,7,8,9,10').split(',').map(Number);
const SHOPS={shop:[true],noshop:[false],both:[false,true]}[pos[2]??'both'],RUNS=args.includes('--runs'),GOLD=args.includes('--gold');
const MIN=60000,r1=x=>x==null||!Number.isFinite(x)?null:Math.round(x*10)/10;
const SEG=['ch1','ch2','ch3'],segOf=s=>s.area<3?'ch1':s.area===3?'ch2':'ch3';
const DEFAULT=structuredClone(g.SECONDARY_RULES);
function run(speed,seed,shop){
 for(const k of Object.keys(DEFAULT))Object.assign(g.SECONDARY_RULES[k],DEFAULT[k],{model:'bonus',salt:DEFAULT[k].salt+seed*1009});
 const M=Object.fromEntries(SEG.map(k=>[k,{start:null,end:null,idleMs:0,stages:[],occ:[],full:0,pending:0,steps:0,outs:0}]));
 let seg='ch1',tickAt=0,acted=true;const gold={},goldLog=[];
 const proxy={...g,tick:(s,now)=>{if(!acted)M[seg].idleMs+=now-tickAt;tickAt=now;acted=false;return g.tick(s,now);},
  act:(s,a,now)=>{const e=s.energy,r=g.act(s,a,now);if(r.ok){acted=true;if(s.energy<1&&e>=1)M[segOf(s)].outs++;
   if(r.event==='restore')M[seg].stages.push([now,r.task,r.stage]);}
   return r;}};
 M.ch1.start=0;
 const onStep=(s,now)=>{
  const m=M[seg];m.steps++;if(s.pending.length)m.pending++;
  m.occ.push(s.board.filter(x=>x&&x.type!=='cargo'&&x.type!=='glass').length);if(!s.board.includes(null))m.full++;
  if(s.area===4)for(const o of s.orders)if(o?.story&&!gold[o.id])gold[o.id]={at:now,story:o.story,stage:g.stageOf(s,o.story)+1,needs:o.needs.map(r=>r.family+r.tier+(r.count>1?'×'+r.count:'')).join('+')};
  for(const [id,x] of Object.entries(gold))if(!x.done&&!s.orders.some(o=>o?.id===id)){x.done=now;goldLog.push({...x,waitMin:r1((now-x.at)/MIN)});}
  const k=segOf(s);if(k!==seg){m.end=now;seg=k;M[k].start=now;}
 };
 const res=simulate(proxy,nextAction,speed,seed,{until:24*3600e3,shop,onStep,finish:s=>g.allDone(s)});
 M[seg].end=res.total;
 const out={speed,seed,shop,finished:res.finished,totalMin:r1(res.total/MIN),bought:res.bought,rations:res.rations};
 for(const k of SEG){const m=M[k];if(m.start===null)continue;const span=(m.end-m.start)/MIN,times=m.stages.map(([t])=>t),gaps=times.map((t,i)=>(i?t-times[i-1]:t-m.start)/MIN);
  out[k]={min:r1(span),activeMin:r1(span-m.idleMs/MIN),waitMin:r1(m.idleMs/MIN),stages:m.stages.length,minPerStage:r1(span/Math.max(1,m.stages.length)),
   gapMedian:r1(quantile(gaps,.5)),gapMax:r1(Math.max(0,...gaps)),outs:m.outs,boardMedian:quantile(m.occ,.5),boardP90:quantile(m.occ,.9),fullPct:Math.round(100*m.full/Math.max(1,m.steps)),pendingPct:Math.round(100*m.pending/Math.max(1,m.steps))};}
 out.goldWaitMedian=r1(quantile(goldLog.map(x=>x.waitMin),.5));out.goldWaitMax=r1(Math.max(0,...goldLog.map(x=>x.waitMin)));
 if(GOLD)out.gold=goldLog.map(x=>`${x.story}${x.stage} ${x.needs} ${x.waitMin}m`);
 out.order=M.ch3.stages.map(([,id,n])=>id.replace('hb-','')+n).join(' ');
 return out;
}
const q=(v,p)=>r1(quantile(v.filter(x=>x!=null),p));
for(const shop of SHOPS)for(const speed of SPEEDS){
 const R=SEEDS.map(seed=>run(speed,seed,shop));if(RUNS)for(const r of R)console.log(JSON.stringify({run:1,...r}));
 const pick=(k,f)=>R.map(r=>r[k]?.[f]);
 const row={speed,shop,seeds:R.length,finished:R.filter(r=>r.finished).length,totalMin:q(R.map(r=>r.totalMin),.5),totalMax:q(R.map(r=>r.totalMin),1)};
 for(const k of SEG)row[k]={min:q(pick(k,'min'),.5),minMax:q(pick(k,'min'),1),activeMin:q(pick(k,'activeMin'),.5),waitMin:q(pick(k,'waitMin'),.5),stages:q(pick(k,'stages'),.5),minPerStage:q(pick(k,'minPerStage'),.5),
  gapMedian:q(pick(k,'gapMedian'),.5),gapMax:q(pick(k,'gapMax'),1),outs:q(pick(k,'outs'),.5),boardMedian:q(pick(k,'boardMedian'),.5),boardP90:q(pick(k,'boardP90'),.5),fullPct:q(pick(k,'fullPct'),.5),pendingPct:q(pick(k,'pendingPct'),.5)};
 row.goldWaitMedian=q(R.map(r=>r.goldWaitMedian),.5);row.goldWaitMax=q(R.map(r=>r.goldWaitMax),1);
 console.log(JSON.stringify(row));
}
