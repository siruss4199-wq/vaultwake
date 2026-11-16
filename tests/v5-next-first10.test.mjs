// First 10 minutes (retention task, 2026-11-14; docs/V5_FIRST_10_MINUTES_2026-11-14.md). The camp tent's first
// stage ("Pitch the camp tent") brings the Survey Kite (it gave +8 energy, which the first minutes never need), so a
// second generator, its chain, its orders and its crates arrive at the third restoration instead of after the Rover's
// level 3 (about 15 min at 5 s an action). Rules, save compatibility (no migration: stage data only) and a short
// simulation guard with the first-session player model (tests/v5-next-first10-policy.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as g from '../v5/next/game.mjs';
import {TASKS} from '../v5/next/areas.mjs';
import {tutorStep} from '../v5/next/tutor.mjs';
import {nextAction} from './v5-next-policy.mjs';
import {simulate} from './v5-next-economy-sim.mjs';
import {makeGuidePlayer} from './v5-next-first10-policy.mjs';
const {fresh,act,load,source,item,ROVER,sourceOpen,openFamilies,stageOf,totalBuilt,SAVE_KEY}=g;
const ok=(s,a,now=1000)=>{const r=act(s,a,now);assert.ok(r.ok,JSON.stringify(a)+' '+r.message);return r;};
const MIN=60000;
// a camp with the landing path built and the tent's materials in, coins enough
const atTent=()=>{const s=fresh(0);s.built={'beach-path':1};s.materials={'beach-path':1,'beach-tent':1};s.coins=500;return s;};

test('the camp tent brings the Survey Kite: a second generator, its chain open at once',()=>{
 assert.deepEqual(TASKS['beach-tent'].stages[0].effect,{copy:'chart'});
 const s=atTent();assert.equal(sourceOpen(s,'chart'),false);
 const r=ok(s,{type:'restore',id:'beach-tent'});
 assert.equal(r.effects.copyId,'chart');assert.deepEqual(s.board[r.effects.copy],source('chart'));assert.equal(r.effects.energy,undefined,'no +8 energy any more');
 assert.ok(sourceOpen(s,'chart'));assert.deepEqual(openFamilies(s).sort(),['chart','rig']);
 // the Kite works at once (a Survey Kite part) and its parts are what the crates around the camp wait for
 const p=ok(s,{type:'produce',id:'chart'});assert.equal(s.board[p.index].family,'chart');
 // later stages are unchanged: the Rover copies still come from the boardwalk, lanterns, bunks and flags
 for(const [id,n] of [['beach-path',2],['beach-path',3],['beach-tent',2],['beach-mast',2]])assert.deepEqual(TASKS[id].stages[n-1].effect.copy,'rig');
});

test('a Rover at level 3 still brings out the Kite for a camp that has none; with the Kite already out it brings nothing new',()=>{
 const a=fresh(0);a.board[ROVER].level=3;a.moves=1;const r=ok(a,{type:'produce',id:'rig'});assert.equal(r.released?.[0]?.id,'chart');
 const b=atTent();ok(b,{type:'restore',id:'beach-tent'});b.board[ROVER].level=3;const k=b.board.filter(x=>x?.type==='source'&&x.id==='chart').length;
 const u=ok(b,{type:'produce',id:'rig'});assert.equal(u.released,undefined);assert.equal(b.board.filter(x=>x?.type==='source'&&x.id==='chart').length,k,'no second Kite');
});

test('saves: no migration; a camp keeps what it has, and the tent gives what its data now says when it is built',()=>{
 // a camp from before this change that already built the tent (it got +8 energy then): loads as it was, no Kite added
 const old=fresh(0);old.built={'beach-path':2,'beach-tent':1};old.materials={...old.built};old.moves=120;old.energy=77;old.coins=33;
 const raw=JSON.stringify(old),back=load(raw,5);
 assert.equal(back.board.filter(x=>x?.type==='source'&&x.id==='chart').length,0,'no Kite is injected into an existing camp');
 assert.deepEqual(back.board,old.board);assert.deepEqual(back.built,old.built);assert.equal(back.energy,77);assert.equal(back.coins,33);assert.equal(back.version,g.VERSION);
 // a camp from before this change that has not built the tent yet: building it now brings the Kite
 const mid=fresh(0);mid.built={'beach-path':2};mid.materials={'beach-path':2,'beach-tent':1};mid.coins=200;mid.moves=80;
 const m=load(JSON.stringify(mid),5);const r=ok(m,{type:'restore',id:'beach-tent'});assert.equal(r.effects.copyId,'chart');
 // a camp whose Rover already brought the Kite out: the tent gives a second Kite to merge (a Kite level, nothing lost)
 const kite=atTent();kite.board[15]=source('chart');const q=ok(kite,{type:'restore',id:'beach-tent'});
 assert.equal(kite.board.filter(x=>x?.type==='source'&&x.id==='chart').length,2);const k2=ok(kite,{type:'merge',from:q.effects.copy,to:15});assert.equal(kite.board[15].level,2);
 // the chapter-1 fixture (a real older save) loads with its progress and board unchanged
 const fx=fs.readFileSync(new URL('./fixtures/coast/coast-ch1-pre-secondary.json',import.meta.url),'utf8'),f0=JSON.parse(fx),f=load(fx,5);
 assert.deepEqual(f.built,f0.built);assert.deepEqual(f.board.map(x=>x?.type+(x?.id??x?.family??'')),f0.board.map(x=>x?.type+(x?.id??x?.family??'')));
 assert.equal(SAVE_KEY,'vaultwake-v5-coast','the save key is unchanged');
});

// The first-session player (does what the guide line shows) at 5 s an action, 12 seeds, the first 15 minutes.
function first15(seed,speed=5){
 const player=makeGuidePlayer(g,tutorStep,nextAction),m={kite:null,builds:[],taps:{},energyMin:Infinity,full:0,actions:0};
 const proxy={...g,act(s,a,t){const id=a.type==='produce'?(Number.isInteger(a.index)?s.board[a.index]?.id:a.id):null,r=g.act(s,a,t);
  if(r.ok){m.actions++;if(id)m.taps[id]=(m.taps[id]??0)+1;if(r.event==='restore')m.builds.push(t);if(!s.board.includes(null))m.full++;}return r;}};
 simulate(proxy,player,speed,seed,{until:15*MIN,finish:()=>false,onStep:(s,t)=>{m.energyMin=Math.min(m.energyMin,s.energy);if(m.kite==null&&s.board.some(x=>x?.type==='source'&&x.id==='chart'))m.kite=t;}});
 return m;
}
const runs=[1,2,3,4,5,6,7,8,9,10,11,12].map(sd=>first15(sd));
test('first 10 minutes: a second generator by about 7 min, restorations kept, no energy or space squeeze',()=>{
 for(const [k,r] of runs.entries()){const tag=`seed ${k+1}`;
  assert.ok(r.kite!=null&&r.kite<=8.5*MIN,`${tag}: Survey Kite at ${(r.kite/MIN).toFixed(1)} min (was about 15)`);
  assert.ok(r.builds.filter(t=>t<10*MIN).length>=4,`${tag}: ${r.builds.filter(t=>t<10*MIN).length} restorations in 10 min (4 before the change)`);
  assert.ok(r.builds[0]<=2.5*MIN,`${tag}: first restoration at ${(r.builds[0]/MIN).toFixed(1)} min`);
  assert.ok(r.energyMin>=60,`${tag}: energy never drops below ${r.energyMin} (no new bottleneck)`);
  assert.ok(r.full/r.actions<=.03,`${tag}: the board full after ${(100*r.full/r.actions).toFixed(1)} % of actions`);
  const taps=Object.values(r.taps).reduce((a,b)=>a+b,0);assert.ok((r.taps.chart??0)/taps>=.08,`${tag}: Survey Kite taps ${r.taps.chart??0} of ${taps}`);}
});
