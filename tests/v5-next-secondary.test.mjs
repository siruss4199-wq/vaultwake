// Coast Camp secondary chains, pilot (2026-10-29; docs/V5_SECONDARY_PILOT_2026-10-29.md): the Rivet
// Rover's Mechanisms and the Survey Kite's Expedition records. Round 3 (playtest: rare parts came often,
// matching orders did not): only generators of level 2+ make them, a kind's chain opens (gift and an
// introductory order, once) when one of its generators first reaches level 2, about one new everyday
// order in three asks one, and an oversupply guard counted in drops pauses them. Saves from before the
// pilot and from rounds 1-2, both chains' merges, the drop and its bad-luck limit across reloads and
// generator copies, full boards, demand and pricing, the book, and no duplicated rewards.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fresh,act,load,item,source,cog,nameOf,priceOf,orderPrice,COIN_VALUE,RARE_COINS,BOOK_CHAINS,bookKeys,bookReady,pageReady,SECONDARY_RULES,SECONDARY_ORDERS,SECONDARY_OF,SECONDARY_PENDING_MAX,isSecondary,secondaryOn,secondarySource,secondaryPaused,secondaryUnits,secondaryWanted,secondaryHeld,secondaryNeed,secondaryLimit,secondaryDrops,secondaryUnlock,allDone,ROVER,MAX_ENERGY,makeOrder} from '../v5/next/game.mjs';
import {CHAINS,maxTier} from '../v5/next/chains.mjs';
import {TASKS} from '../v5/next/areas.mjs';
import {artFit} from '../v5/next/art-fit.mjs';
import {primaryAction} from '../v5/next/guide.mjs';
import {nextAction} from './v5-next-policy.mjs';

const ok=(s,a,now=1000)=>{const r=act(s,a,now);assert.equal(r.ok,true,JSON.stringify(a)+' '+r.message);return r;};
const fixture=n=>readFileSync(new URL(`./fixtures/coast/${n}.json`,import.meta.url),'utf8');
// A camp whose Rover is level 2 with its chain open and met (no gift is pending).
const opened=()=>{const s=fresh(0);s.board[ROVER].level=2;s.secOpen={rig:true};s.found.push('mech0');return s;};
const cells=s=>s.board.flatMap((x,i)=>x===null?[i]:[]);
const tapRover=(s,now,index=ROVER)=>ok(s,{type:'produce',id:'rig',index},now);
const clearTap=(s,now,index=ROVER)=>{s.energy=MAX_ENERGY;const r=tapRover(s,now,index);s.board[r.index]=null;if(r.secondary?.index>=0)s.board[r.secondary.index]=null;return r;};
const secondaries=s=>[...s.board,...s.pending,...s.shed].filter(x=>x?.type==='item'&&isSecondary(x.family)).length;
const noSecondaryOrders=s=>{s.orders=s.orders.map(o=>({...o,needs:o.needs.filter(r=>!isSecondary(r.family)).length?o.needs.filter(r=>!isSecondary(r.family)):[{family:'rig',tier:1,count:1}]}));};
const worst=fn=>{const R=SECONDARY_RULES.rig,save={...R};try{R.chance=0;fn(R);}finally{Object.assign(R,save);}};

test('two secondary chains, registered apart from the primary ones and the rest still prepared only',()=>{
 assert.deepEqual(CHAINS.mech,{gen:'rig',secondary:true,names:['Bolt','Gear','Gear assembly','Hand-crank mechanism']});
 assert.deepEqual(CHAINS.notes,{gen:'chart',secondary:true,names:['Note fragment','Expedition note','Travel notebook','Captain\'s logbook']});
 assert.deepEqual(SECONDARY_OF,{rig:'mech',chart:'notes'},'the Rover and the Kite only: the Winch, Shell Trap and Kiln sets stay unregistered');
 for(const f of ['mech','notes']){assert.doesNotMatch(f,/\d/,'no digits in a family id (book keys are family + tier)');assert.equal(maxTier(f),3);}
 // no name is shared with another part, and the primary chains are untouched
 const names=Object.values(CHAINS).flatMap(c=>c.names);assert.equal(new Set(names).size,names.length,'every part name is its own');
 assert.equal(CHAINS.rig.names[0],'Copper offcut');assert.equal(CHAINS.chart.names[0],'Ink scrap');
 // each part has painted, measured board art
 for(const f of ['mech','notes'])for(let t=0;t<4;t++)assert.ok(artFit(`${f}-${t}`),`${f}-${t} is measured`);
 assert.deepEqual(BOOK_CHAINS.slice(-2),['mech','notes']);
});


test('both chains merge up to their top part, which merges no further',()=>{
 for(const f of ['mech','notes']){
  const s=fresh(0);s.board[15]=item(f,0);s.board[20]=item(f,0);
  for(let t=0;t<3;t++){s.board[15]=item(f,t);s.board[20]=item(f,t);const r=ok(s,{type:'merge',from:15,to:20});assert.deepEqual(s.board[20],item(f,t+1));assert.ok(r.found?.includes(f+(t+1))||s.found.includes(f+(t+1)));}
  s.board[15]=item(f,3);s.board[20]=item(f,3);const r=act(s,{type:'merge',from:15,to:20},1000);assert.equal(r.ok,false);assert.match(r.message,/top of its chain/);
  // secondary parts never merge with primary ones of the same tier
  s.board[15]=item(f,1);s.board[20]=item(CHAINS[f].gen,1);assert.equal(act(s,{type:'merge',from:15,to:20},1000).ok,false);
 }
});


test('trial rates: 5 % a tap, certain by the 20th eligible tap, level 2 and up, 12.8 eligible taps a drop on average',()=>{
 for(const g of ['rig','chart'])assert.deepEqual({chance:SECONDARY_RULES[g].chance,pity:SECONDARY_RULES[g].pity,level:SECONDARY_RULES[g].level,model:SECONDARY_RULES[g].model},{chance:.05,pity:20,level:2,model:'bonus'});
 // the expected gap with the guarantee: sum of 0.95^k for k < 20 = (1 - 0.95^20) / 0.05
 const gap=(1-.95**20)/.05;assert.ok(Math.abs(gap-12.83)<.01);
 // and the drops in a long run of eligible taps (no pauses: everything is cleared) match it
 const s=opened();let drops=0;const N=4000;for(let n=0;n<N;n++){if(clearTap(s,1000+n).secondary)drops++;}
 assert.ok(Math.abs(drops/N-1/gap)<.012,`measured ${(100*drops/N).toFixed(1)} % against ${(100/gap).toFixed(1)} %`);
});

test('only a generator of level 2+ makes secondary parts; a level-1 copy never rolls or counts',()=>{
 const s=opened();s.board[16]=source('rig');// a level-1 copy beside the level-2 Rover
 assert.equal(secondarySource(s,ROVER),true);assert.equal(secondarySource(s,16),false);
 let now=1000;
 for(let n=0;n<200;n++){const e=s.energy,r=clearTap(s,now+=1000,16);assert.equal(r.secondary,undefined,'a level-1 copy makes its own part only');}
 assert.deepEqual([s.secTaps.rig,s.secSince.rig],[0,0],'and moves no counter');
 // the level-2 Rover: one energy a tap, its own part always, a secondary at the latest on the 20th
 let got=0;for(let n=0;n<20&&!got;n++){s.energy=10;const e=s.energy,r=tapRover(s,now+=1000);assert.equal(s.energy,e-1);assert.equal(s.board[r.index].family,'rig');if(r.secondary){got=n+1;assert.deepEqual(s.board[r.secondary.index],item('mech',0));}s.board[r.index]=null;}
 assert.ok(got>=1&&got<=20,`a drop within 20 eligible taps (${got})`);
 // a closed chain: even a level-3 Rover makes none until it opens (an old save opens on load instead)
 const c=fresh(0);c.board[ROVER].level=3;c.found.push('mech0');assert.equal(secondaryOn(c,'rig'),false);
});

test('the first level 2 opens the chain once: a gift (or one waiting for space), a note and an introductory order',()=>{
 const s=fresh(0);s.board[16]=source('rig');s.ordersDone=6;const before=JSON.stringify(s.orders);
 const m=ok(s,{type:'merge',from:16,to:ROVER});assert.equal(s.board[ROVER].level,2);
 assert.deepEqual(m.unlocks,[{gen:'rig',family:'mech',index:m.unlocks[0].index}]);assert.ok(m.unlocks[0].index>=0);
 assert.deepEqual(s.board[m.unlocks[0].index],item('mech',0),'the first Bolt, beside the Rover');assert.ok(s.found.includes('mech0'));
 assert.deepEqual(s.secOpen,{rig:true});assert.deepEqual(s.secIntro,['mech']);
 assert.equal(JSON.stringify(s.orders),before,'no order on the board is replaced');
 // the next crew slot: the introductory order, a quick job for the first part
 s.orders[0]={...s.orders[0],story:'beach-path'};// (a gold order is on the board, so the next order is an everyday one)
 const o=makeOrder(s);assert.deepEqual(o.needs,[{family:'mech',tier:0,count:1}]);assert.equal(o.role,'quick');assert.equal(o.coins,priceOf(o.needs));
 s.orders[1]=o;ok(s,{type:'move',from:m.unlocks[0].index,to:m.unlocks[0].index===20?21:20});assert.deepEqual(s.secIntro,[],'no longer queued once it is on the board');
 // more copies merged to level 2 (or a cog) never give again
 s.board[16]=source('rig');s.board[17]=source('rig');const n=secondaries(s),again=ok(s,{type:'merge',from:16,to:17});
 assert.equal(again.unlocks,undefined);assert.equal(secondaries(s),n,'no second gift');
 // a Brass cog opens it too: the merge frees the cog's space, and the gift takes it even on a full board
 const t=fresh(0);t.board[16]=cog();for(const i of cells(t))if(i!==16)t.board[i]=item('rope',0);
 const u=ok(t,{type:'merge',from:16,to:ROVER});assert.equal(u.unlocks[0].index,16,'the space the cog left');assert.deepEqual(t.board[16],item('mech',0));
 // an older save with a level-2 Rover opens on load: the gift waits for space, and lands once
 const w=fresh(0);w.board[ROVER].level=2;for(const i of cells(w))w.board[i]=item('rope',0);
 const k=load(JSON.stringify(w),2000);assert.deepEqual(k.pending,[item('mech',0)]);assert.deepEqual(k.secOpen,{rig:true});assert.deepEqual(k.secIntro,['mech']);
 const k2=load(JSON.stringify(k),3000);assert.equal(secondaries(k2),1,'reloading never gives it again');
});

test('saves: pre-pilot and round 1-2 camps keep everything; level 2+ kinds open once on load',()=>{
 for(const name of ['coast-ch1-pre-secondary','coast-ch2-pre-secondary']){
  const raw=fixture(name),old=JSON.parse(raw);assert.equal(old.secSince,undefined,'made by the engine before the pilot (cc63b84)');
  const s=load(raw,old.lastAt+1000);
  for(const k of ['board','coins','built','found','orders','ordersDone','moves','area','taps','book','shed','materials'])assert.deepEqual(s[k],old[k],`${name}: ${k} kept`);
  assert.deepEqual(s.secOpen,{rig:true,chart:true},'Rover and Kite are already level 2+');
  assert.deepEqual(s.pending.slice(-2),[item('mech',0),item('notes',0)],'the two gifts wait for space (loading never rearranges the board)');
  assert.deepEqual(s.secIntro,['mech','notes']);
  const again=load(JSON.stringify(s),old.lastAt+2000);assert.equal(again.pending.length,s.pending.length,'no second gift on reload');assert.deepEqual(again.secIntro,s.secIntro);
  const r=act(s,{type:'produce',id:'rig'},old.lastAt+2000);assert.ok(r.ok||/full|energy/i.test(r.message),r.message);
 }
 // a round-2 pilot save that already met both chains opens without gifts or introductions, keeping its parts and orders
 const raw=fixture('coast-pilot-extras'),old=JSON.parse(raw),p=load(raw,old.lastAt+1000);
 assert.deepEqual(p.secOpen,{rig:true,chart:true});assert.deepEqual(p.secIntro,[]);assert.deepEqual(p.pending,old.pending);
 for(const k of ['board','orders','found','book','shed'])assert.deepEqual(p[k],old[k],`pilot save: ${k} kept`);
 assert.deepEqual(p.secSince,old.secSince);assert.deepEqual(p.secTaps,{rig:0,chart:0});
 // damaged round-3 values only restart a count or drop an introduction; they never reset the camp
 const d=opened();d.moves=40;d.secSince={rig:-3,chart:'x',flux:4};d.secTaps={rig:1.5};d.secOpen={rig:'yes',flux:true};d.secIntro=['mech','mech','sail'];
 const back=load(JSON.stringify(d),5);assert.equal(back.moves,40);assert.deepEqual(back.secSince,{rig:0,chart:0});assert.deepEqual(back.secTaps,{rig:0,chart:0});
 assert.deepEqual(back.secIntro,['mech']);assert.deepEqual(back.secOpen,{rig:true},'the level-2 Rover opens it again (met before: no gift)');assert.equal(back.pending.length,0);
});

test('bad-luck limit: exactly every 20th eligible tap at worst luck, across reloads; level-1 taps cannot shift a roll',()=>worst(R=>{
 const s=opened();let now=1000,since=0;const gaps=[];
 for(let n=0;n<100;n++){const r=clearTap(s,now+=1000);since++;if(r.secondary){gaps.push(since);since=0;}
  if(n===33){const before=s.secSince.rig,back=load(JSON.stringify(s),now);assert.equal(back.secSince.rig,before);Object.assign(s,back);}}
 assert.ok(gaps.length>=4&&gaps.every(g=>g===R.pity),`a drop exactly every ${R.pity}: ${gaps}`);
}));

test('rolls are the eligible tap\'s own number: reloads and level-1 taps in between change nothing',()=>{
 const run=(reload,lv1)=>{const s=opened();s.board[16]=source('rig');let now=1000;const out=[];
  for(let n=0;n<80;n++){if(lv1&&n%3===0)clearTap(s,now+=1000,16);out.push(!!clearTap(s,now+=1000).secondary);if(reload&&n%7===3)Object.assign(s,load(JSON.stringify(s),now));}return out;};
 const base=run(false,false);assert.deepEqual(run(true,false),base,'reloads');assert.deepEqual(run(false,true),base,'level-1 taps in between');
});

test('a full board: no tap, no energy, no counter; a drop with no space waits, is never lost, and lands once',()=>{
 const s=opened();s.secSince.rig=SECONDARY_RULES.rig.pity-1;noSecondaryOrders(s);// the next eligible tap drops
 for(const i of cells(s))s.board[i]=item('rope',0);
 const before=JSON.stringify(s),r=act(s,{type:'produce',id:'rig',index:ROVER},1000);
 assert.equal(r.ok,false);assert.match(r.message,/board is full/);assert.equal(JSON.stringify(s),before,'nothing spent, rolled or counted');
 s.board[15]=null;const e=s.energy,t=tapRover(s,2000);assert.equal(s.energy,e-1);assert.equal(t.secondary.index,-1);
 assert.deepEqual(s.pending,[item('mech',0)]);
 const back=load(JSON.stringify(s),3000);assert.deepEqual(back.pending,[item('mech',0)]);
 back.board[27]=item('rope',0);back.board[28]=item('rope',0);
 const m=ok(back,{type:'merge',from:27,to:28},4000);assert.equal(m.arrived?.length,1);assert.deepEqual(back.board[m.arrived[0].index],item('mech',0));
 assert.equal(secondaries(back),1,'one Bolt: not lost, not doubled');
 // with SECONDARY_PENDING_MAX extras already waiting, a due drop is not rolled (so it cannot be lost)
 const w=opened();noSecondaryOrders(w);for(const i of cells(w))w.board[i]=item('rope',0);w.board[15]=null;w.secSince.rig=SECONDARY_RULES.rig.pity-1;
 w.pending=Array.from({length:SECONDARY_PENDING_MAX},()=>item('notes',0));assert.equal(secondaryPaused(w,'rig'),true);
 const q=tapRover(w,5000);assert.equal(q.secondary,undefined);assert.equal(w.secSince.rig,SECONDARY_RULES.rig.pity-1,'nor counted');assert.equal(w.pending.length,SECONDARY_PENDING_MAX);
});

test('oversupply guard in drops: board, shed and waiting parts count; merging below the keepsake never lowers it; demand lifts it',()=>{
 const s=opened();noSecondaryOrders(s);const hold=SECONDARY_RULES.rig.hold;assert.equal(hold,4);
 s.board[30]=item('mech',0);s.board[31]=item('mech',0);s.shed[0]=item('mech',0);s.pending=[item('mech',0)];
 assert.equal(secondaryUnits(s,'mech'),4);assert.equal(secondaryPaused(s,'rig'),true,'four Bolts across board, shed and waiting');
 // merged into a Gear and on to a Gear assembly: still four drops, still paused
 s.shed[0]=null;s.pending=[];s.board[32]=item('mech',0);s.board[33]=item('mech',0);
 ok(s,{type:'merge',from:30,to:31});ok(s,{type:'merge',from:32,to:33});assert.equal(secondaryUnits(s,'mech'),4);assert.equal(secondaryPaused(s,'rig'),true);
 ok(s,{type:'merge',from:31,to:33});assert.deepEqual(s.board[33],item('mech',2));assert.equal(secondaryPaused(s,'rig'),true,'a Gear assembly is four drops');
 // build 48b: the keepsake (the chain's top part, asked by no order) does not count, so holding one
 // never pauses the chain's drops for good (it counted 8 against a rest of 4)
 s.board[33]=item('mech',3);assert.equal(secondaryUnits(s,'mech'),0);assert.equal(secondaryPaused(s,'rig'),false);
 // an order that wants them lifts the guard by what it wants
 s.board[33]=item('mech',2);s.orders[1]={...s.orders[1],needs:[{family:'mech',tier:1,count:1}]};assert.equal(secondaryWanted(s,'mech'),2);assert.equal(secondaryPaused(s,'rig'),false);
 // paused taps are neither rolled nor counted; the count goes on where it stopped
 worst(R=>{const t=opened();noSecondaryOrders(t);let now=1000;for(let n=0;n<5;n++)clearTap(t,now+=1000);assert.equal(t.secSince.rig,5);
  t.board[30]=item('mech',2);for(let n=0;n<30;n++)assert.equal(clearTap(t,now+=1000).secondary,undefined);assert.deepEqual([t.secSince.rig,t.secTaps.rig],[5,5]);
  t.board[30]=null;let n=0,r;do{r=clearTap(t,now+=1000);n++;}while(!r.secondary);assert.equal(n,R.pity-5);});
});

test('copies share one count per kind, merging copies keeps it, and a reload keeps count, pause and waiting part',()=>worst(R=>{
 const s=opened();noSecondaryOrders(s);s.board[16]={...source('rig'),level:2};let now=1000,n=0,r;
 do{r=clearTap(s,now+=1000,n%2?16:ROVER);n++;}while(!r.secondary);assert.equal(n,R.pity,'two level-2 copies, one count');
 for(let k=0;k<7;k++)clearTap(s,now+=1000);const taps=s.secTaps.rig;
 const m=ok(s,{type:'merge',from:16,to:ROVER},now+=1000);assert.equal(m.event,'producerUp');assert.equal(s.secSince.rig,7);assert.equal(s.secTaps.rig,taps);
 s.board[30]=item('mech',1);s.board[31]=item('mech',1);s.pending=[item('mech',0)];
 const back=load(JSON.stringify(s),now+=1000);assert.equal(back.secSince.rig,7);assert.deepEqual(back.pending,[item('mech',0)]);assert.equal(secondaryPaused(back,'rig'),true);
}));

test('recycling a secondary part gives no energy (a bonus drop never pays energy)',()=>{
 const s=fresh(0);s.energy=10;s.board[15]=item('mech',0);s.board[20]=item('rig',0);
 const a=ok(s,{type:'recycle',index:15});assert.equal(a.energy,0);assert.equal(s.energy,10);assert.doesNotMatch(a.message,/energy/);
 // Build 52A: a Level 1-3 everyday part gives none either (tests/v5-next-build52a.test.mjs has the whole rule)
 const b=ok(s,{type:'recycle',index:20});assert.equal(b.energy,0);assert.equal(s.energy,10);
});


test('model A (replace) for the measurements: a secondary instead of the tap\'s part, for the same energy',()=>{
 const R=SECONDARY_RULES.rig,save={...R};
 try{R.model='replace';const s=opened();let now=1000,got=null;
  for(let n=0;n<R.pity&&!got;n++){s.energy=10;const e=s.energy,r=tapRover(s,now+=1000);assert.equal(s.energy,e-1);if(r.secondary){got=r;assert.deepEqual(s.board[r.index],item('mech',0),'the tap made the Bolt instead');}else s.board[r.index]=null;}
  assert.ok(got);
  R.model='off';const t=opened();for(let n=0;n<40;n++){t.energy=10;const r=tapRover(t,1000+n);assert.equal(r.secondary,undefined);t.board[r.index]=null;}
 }finally{Object.assign(R,save);}
});

test('demand: about one new everyday order in three asks a secondary part once open; gold only at its mapped stages; a primary-only order always',()=>{
 const s=fresh(0);let now=0;const seen=new Set();let after=0,asked=0,uses=0,goals=0,intros=0,offered=0,delivered=0,lv2=null,goldRare=0,merged=0;const secIds=new Set();
 while(!allDone(s)&&now<14*3600e3){
  if(lv2===null&&s.board.some(x=>x?.type==='source'&&(x.level??1)>=2))lv2=s.ordersDone;
  for(const o of s.orders){if(!o||seen.has(o.id))continue;seen.add(o.id);const sec=o.needs.filter(r=>isSecondary(r.family));
   // build 48b: a gold order asks a rare part only at a stage that names one (areas.mjs rare), at most its tier
   // build 49a: or a stage whose own fixed gold recipe names it (Chapter 4), exactly as authored
   if(o.story){const st=TASKS[o.story].stages[(s.built[o.story]??0)];if(sec.length){const own=st.gold?.find(g=>g[0]===sec[0].family);
    if(own)assert.deepEqual([sec[0].family,sec[0].tier,sec[0].count],own,`${o.story}: its own recipe`);
    else{assert.ok(st.rare,`${o.story}: only a mapped stage`);assert.equal(sec[0].family,st.rare[0]);assert.equal(sec[0].tier,st.rare[1],'its fixed tier');}goldRare++;}continue;}
   if(Object.keys(s.secOpen).length)after++;
   if(!sec.length)continue;asked++;offered++;secIds.add(o.id);
   assert.ok(Object.keys(s.secOpen).length>0||secondaryHeld(s,sec[0].family)>0,'only once a chain is open, or for parts already held');
   assert.equal(sec.length,1);assert.ok(sec[0].count===1||sec[0].tier===0&&sec[0].count===2);assert.ok(sec[0].tier<=SECONDARY_ORDERS.top);if(sec[0].tier>0)merged++;
   assert.ok(s.orders.filter(x=>x?.needs.some(r=>isSecondary(r.family))).length<=secondaryLimit(s),'within the limit');
   assert.ok(s.orders.some(x=>x&&!x.story&&!x.needs.some(r=>isSecondary(r.family))),'an everyday order asks no rare part');
   const held=secondaryHeld(s,sec[0].family),want=secondaryWanted(s,sec[0].family);
   if(sec[0].tier===0&&o.needs.length===1&&o.role==='quick'&&!o.bonus&&want>held)intros++;
   if(want<=held)uses++;else goals++;
   assert.equal(o.coins,orderPrice(s,o.needs,o.role),'priced by the rules');}
  s.energy=Math.max(s.energy,5);
  const a=nextAction(s);if(!a){now+=10000;continue;}
  const before=a.type==='deliver'?s.orders.find(o=>o.id===a.id):null;ok(s,a,now);now+=5000;if(before&&secIds.has(before.id))delivered++;
 }
 assert.ok(allDone(s),'Chapters 1-2 finish');assert.ok(lv2>=0,'a level-2 generator is reached');
 // Energy pass (build 47v): a full start and more energy change what the scripted player makes first;
 // the same rules measure 42-45 % across seeds (40-42 % before) and 46 % in this run, so the ceiling is .5.
 const share=asked/after;assert.ok(share>=.22&&share<=.5,`share of new everyday orders asking one: ${(100*share).toFixed(0)} % (${asked} of ${after})`);
 assert.ok(uses>=5&&goals>=2,`use ${uses}, goal ${goals}`);assert.ok(delivered>=offered*.6,`most are delivered (${delivered} of ${offered})`);
 // build 48b: merged parts are most of what is asked, and some gold orders ask one
 assert.ok(merged>=asked*.5,`merged parts: ${merged} of ${asked}`);assert.ok(goldRare>=3,`gold orders with a rare part: ${goldRare}`);
 for(const k of ['mech0','mech1','notes0'])assert.ok(s.found.includes(k),`${k} found`);
});

// build 48b: what a request asks (merged parts, craftability, goals two drops away) is in v5-next-rare-merges.test.mjs.

test('turns: one in three, sooner with unused stock; at most the limit on the board; the chain with most unused first',()=>{
 const s=opened();noSecondaryOrders(s);s.slots=4;s.orders.push({...s.orders[0],id:'o90'});s.board[15]=item('mech',0);
 // Build 52A: a Bolt held is asked as the Gear it merges into (one drop away), never as a Bolt again
 s.built={'beach-path':1};s.materials={...s.built};
 s.recent=['rig1x1','chart1x1'];assert.deepEqual(secondaryNeed(s,50,10),{family:'mech',tier:1,count:1},'neither of the last two asked one: a Gear, one drop beyond the Bolt held');
 // one of the last two asked one and an extra order is on the board: not a turn, even with a Bolt unused
 s.board[16]=item('mech',0);s.orders[1]={...s.orders[1],needs:[{family:'rig',tier:1,count:1},{family:'mech',tier:0,count:1}]};
 s.recent=['rig1x1','mech0x1+rig1x1'];assert.equal(secondaryNeed(s,51,11),null,'one of the last two did');
 // the same, with no extra order on the board: the unused Bolts are asked anyway (supply first)
 s.orders[1]={...s.orders[1],needs:[{family:'rig',tier:1,count:1}]};
 assert.equal(secondaryNeed(s,52,12)?.family,'mech','unused extras and no order asks any: asked anyway');
 s.board[9]={...source('chart'),level:2};s.secOpen.chart=true;s.found.push('notes0');s.board[24]=item('notes',0);s.recent=['rig1x1','chart1x1'];
 assert.equal(secondaryNeed(s,53,13).family,'mech','more unused Mechanisms than Records');
 s.orders[0]={...s.orders[0],needs:[{family:'mech',tier:2,count:1}]};s.orders[1]={...s.orders[1],needs:[{family:'notes',tier:0,count:1}]};
 assert.equal(secondaryLimit(s),2);assert.equal(secondaryNeed(s,54,14),null,'two on the board: the limit with four slots');
});

test('pricing: a secondary part pays as a rarer part, never like a common one of its tier',()=>{
 for(let t=0;t<=2;t++){
  const sec=priceOf([{family:'mech',tier:t,count:1}]),prim=priceOf([{family:'rig',tier:t,count:1}]);
  assert.equal(sec,RARE_COINS[t]);assert.ok(sec>prim,`tier ${t}: ${sec} against ${prim}`);}
 assert.ok(priceOf([{family:'notes',tier:1,count:1}])>priceOf([{family:'chart',tier:1,count:1}]));
 // a generator's level lifts its own parts' pay, not its secondary's
 const s=fresh(0);s.board[ROVER]={...source('rig'),level:3};
 assert.equal(orderPrice(s,[{family:'mech',tier:2,count:1}],'quick'),orderPrice(fresh(0),[{family:'mech',tier:2,count:1}],'quick'));
});


test('the book: secondary finds stay found after delivery and pay their coins once; their pages pay no cog',()=>{
 const s=fresh(0);s.board[15]=item('mech',0);ok(s,{type:'move',from:15,to:20});assert.ok(s.found.includes('mech0'));
 s.orders[0]={...s.orders[0],needs:[{family:'mech',tier:0,count:1}],role:'quick',story:undefined};delete s.orders[0].story;
 ok(s,{type:'deliver',id:s.orders[0].id});assert.equal(s.board.filter(x=>x?.family==='mech').length,0);assert.ok(s.found.includes('mech0'),'still found after delivery');
 assert.ok(bookReady(s).includes('mech0'));const c=s.coins;ok(s,{type:'book',key:'mech0'});assert.ok(s.coins>c);assert.equal(act(s,{type:'book',key:'mech0'},1000).ok,false,'once');
 s.found.push('mech1','mech2','mech3');for(const k of ['mech1','mech2','mech3'])ok(s,{type:'book',key:k});
 // a generator level stays with the generators' own pages (a secondary page brought the Shell Trap early)
 assert.equal(pageReady(s,'mech'),false);const r=act(s,{type:'bookPage',family:'mech'},1000);assert.equal(r.ok,false);
 assert.equal(bookReady(s).filter(k=>k.startsWith('mech')).length,0,'every Mechanism ticked off');
 assert.deepEqual(bookKeys('notes'),['notes0','notes1','notes2','notes3']);
 const back=load(JSON.stringify(s),5000);assert.deepEqual(back.book,s.book);assert.deepEqual(back.found,s.found);
});


test('a delivered secondary order pays once, and the hint names the drop as the rare extra it is',()=>{
 const s=opened();s.board[15]=item('mech',0);s.orders[1]={id:'oX',who:'ivo',needs:[{family:'mech',tier:0,count:1}],coins:priceOf([{family:'mech',tier:0,count:1}]),role:'quick',born:0};
 const c=s.coins,e=s.energy,n=s.ordersDone,r=ok(s,{type:'deliver',id:'oX'});assert.equal(s.coins,c+r.coins);assert.equal(s.ordersDone,n+1);
 assert.equal(r.energy,0);assert.equal(s.energy,e,'an order with a rare extra pays coins, no energy (a bonus drop never pays energy)');
 assert.equal(act(s,{type:'deliver',id:'oX'},1000).ok,false,'the order is gone');
 const t=opened();t.orders=[{id:'oY',who:'ivo',needs:[{family:'mech',tier:0,count:1}],coins:10,role:'quick',born:0}];
 const p=primaryAction(t,'oY');assert.equal(p.kind,'tap');assert.match(p.label,/Rivet Rover: a Bolt comes now and then/);
 assert.match(nameOf(item('notes',3)),/Captain's logbook/);
});
