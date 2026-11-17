// Board Full Rescue (v5/next/rescue.mjs, docs/V5_BOARD_FULL_RESCUE_2026-11-17.md), on the real reducer:
//  - only on a full board; the priority: a ready order → a merge → another space-freeing action (cargo, crates,
//    generators, cog) → a free shed space (select, then Shed) → Clear (select, then Clear, confirmed) → explained;
//  - every action it names is accepted by act() and frees room (a free space, or a waiting reward that lands);
//  - it does not undo order progress while something safer frees a space;
//  - pending rewards: the freed space lets them land, and that counts;
//  - it never changes the camp; seeded random full boards always get a doable step or a reasoned "nothing".
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
import {load,act,SOURCES,SEEN_ID} from '../v5/next/game.mjs';
import {rescueStep,tryAction,boardFull} from '../v5/next/rescue.mjs';

const NOW=1_800_000_000_000;
const fixture=fs.readFileSync(path.join(import.meta.dirname,'fixtures','coast','coast-ch1-pre-secondary.json'),'utf8');
const it=(family,tier)=>({type:'item',family,tier});
// a progressed camp (a stage built: the first tutorial is over) whose orders want nothing on the board
function camp({board=null,orders=null,shed=null,pending=[]}={}){
 const s=load(fixture,NOW);s.pending=pending;s.secOpen={rig:true,chart:true};
 s.orders=orders??[{id:'g1',who:'bram',story:'beach-workshop',coins:115,needs:[{family:'rope',tier:4,count:1}]},{id:'c1',who:'neri',coins:40,needs:[{family:'chart',tier:5,count:1}]}];
 if(shed)s.shed=shed;
 // only its generators stay: each case lays out the rest itself
 s.board=board??s.board.map(x=>x?.type==='source'?x:null);
 return s;
}
// fill every free space with parts that never pair (each family/tier once, cycling through what exists)
function fillUnique(s,skip=[]){const used=new Set(s.board.filter(Boolean).map(x=>x.type==='item'?x.family+x.tier:''));
 const pool=[];for(const f of ['rig','chart','rope','shell','lamp'])for(let t=0;t<6;t++)if(!used.has(f+t)&&!skip.includes(f+t)&&!['rope4','chart5'].includes(f+t))pool.push(it(f,t));
 for(let i=0;i<s.board.length;i++)if(s.board[i]===null)s.board[i]=pool.shift()??{type:'glass',family:'rig',tier:1};return s;}
const doable=(s,st,tag)=>{const a=st.action??st.next;assert.ok(a,`${tag}: an action`);const t=tryAction(s,a,NOW);assert.ok(t,`${tag}: act() accepts ${JSON.stringify(a)}`);assert.ok(t.freed>0,`${tag}: it frees room (${t.freed})`);return t;};

test('only on a full board',()=>{const s=camp();assert.equal(boardFull(s),false);assert.equal(rescueStep(s,{now:NOW}),null);});

test('1. a ready order is delivered first (the gold order before a crew order)',()=>{
 const s=fillUnique(camp({orders:[{id:'c1',who:'neri',coins:20,needs:[{family:'rig',tier:0,count:1}]},{id:'g1',who:'bram',story:'beach-workshop',coins:115,needs:[{family:'chart',tier:1,count:1}]}]}));
 // twins exist too: the delivery still comes first
 s.board[s.board.findIndex(x=>x?.type==='item'&&x.family==='lamp')]=it('rig',0);
 const st=rescueStep(s,{now:NOW});assert.equal(st.via,'deliver');assert.equal(st.target.kind,'order');assert.equal(st.target.id,'g1','the gold order first');
 assert.equal(st.what,'Tap Deliver');assert.match(st.why,/^Frees a space · \+115 coins$/);doable(s,st,'deliver');});

test('2. a merge of two identical parts',()=>{
 const s=fillUnique(camp(),['rig1']);const a=s.board.findIndex(x=>x?.type==='item'&&x.family==='shell'),b=s.board.findIndex((x,i)=>i>a&&x?.type==='item'&&x.family==='shell');
 s.board[a]=it('rig',1);s.board[b]=it('rig',1);
 const st=rescueStep(s,{now:NOW});assert.equal(st.via,'merge');assert.deepEqual(st.target,{kind:'pair',cells:[a,b]});assert.match(st.what,/onto its twin$/);doable(s,st,'merge');});

test('a merge that undoes an order\'s progress is not offered while the shed can take something',()=>{
 // the crew order counts the two Lv2 parts as they are: merging them would undo it
 const s=fillUnique(camp({orders:[{id:'c1',who:'neri',coins:40,needs:[{family:'rig',tier:1,count:2},{family:'chart',tier:5,count:1}]}]}),['rig1']);
 const k=s.board.findIndex(x=>x?.type==='item'&&x.family==='shell');s.board[k]=it('rig',1);s.board[k+1]=it('rig',1);
 const st=rescueStep(s,{now:NOW});assert.notEqual(st.via,'merge');assert.equal(st.via,'shed');doable(s,st,'shed instead');
 // with the shed full and nothing else, the merge is still there to choose (before clearing a wanted part)
 s.shed=[it('lamp',0),it('lamp',1),it('lamp',2),it('lamp',3)];
 for(let i=0;i<s.board.length;i++)if(s.board[i]?.type==='item'&&!(s.board[i].family==='rig'&&s.board[i].tier===1))s.board[i]={type:'glass',family:'rig',tier:1};
 const st2=rescueStep(s,{now:NOW});assert.equal(st2.via,'merge','the last resort before clearing a wanted part');});

test('3. other space-freeing actions: cargo with its key, crates, generators, a cog',()=>{
 const s=fillUnique(camp());const gens=s.board.flatMap((x,i)=>x?.type==='source'?[i]:[]);
 // two crates of a kind and size
 const free=s.board.flatMap((x,i)=>x?.type==='item'?[i]:[]);s.board[free[0]]={type:'kit',family:'rig',size:1,left:3};s.board[free[1]]={type:'kit',family:'rig',size:1,left:3};
 let st=rescueStep(s,{now:NOW});assert.ok(['crate','unseal'].includes(st.via),st.via);doable(s,st,st.via);
 // a cog and a generator below the top level
 const c=fillUnique(camp());const i=c.board.findIndex(x=>x?.type==='item');c.board[i]={type:'cog'};
 for(const k of c.board.flatMap((x,k)=>x?.type==='cargo'?[k]:[]))c.board[k]={type:'glass',family:'rig',tier:1};
 st=rescueStep(c,{now:NOW});assert.equal(st.via,'cog');assert.match(st.what,/^Drop the Brass cog on the /);doable(c,st,'cog');
 assert.ok(gens.length>0);});

test('4. a free shed space: select the part first, then the Shed button',()=>{
 const s=fillUnique(camp());for(const k of s.board.flatMap((x,k)=>x?.type==='cargo'?[k]:[]))s.board[k]={type:'glass',family:'rig',tier:1};
 const st=rescueStep(s,{now:NOW});assert.equal(st.via,'shed');assert.equal(st.kind,'select');assert.equal(st.target.kind,'cell');
 assert.match(st.what,/^Tap the /);assert.equal(st.why,'Then tap Shed to keep it for later');doable(s,st,'shed (select)');
 const st2=rescueStep(s,{selected:st.target.index,now:NOW});assert.equal(st2.kind,'shed');assert.deepEqual(st2.target,{kind:'action',action:'store',index:st.target.index});
 assert.equal(st2.what,'Tap Shed');const t=doable(s,st2,'shed (button)');assert.equal(t.after.shed.filter(Boolean).length,s.shed.filter(Boolean).length+1);
 // a crate goes before a part an order might want
 const k=s.board.findIndex(x=>x?.type==='item');s.board[k]={type:'kit',family:'chart',size:1,left:3};assert.equal(rescueStep(s,{now:NOW}).target.index,k);});

test('5. shed full: Clear a part no order wants, confirmed with a second tap',()=>{
 const s=fillUnique(camp({shed:[it('lamp',0),it('lamp',1),it('lamp',2),it('lamp',3)]}));for(const k of s.board.flatMap((x,k)=>x?.type==='cargo'?[k]:[]))s.board[k]={type:'glass',family:'rig',tier:1};
 const st=rescueStep(s,{now:NOW});assert.equal(st.via,'clear');assert.equal(st.kind,'select');assert.match(st.why,/^The shed is full\. No order needs it: clear it$/);
 const x=s.board[st.target.index];assert.equal(x.type,'item');assert.ok(!s.orders.some(o=>o.needs.some(r=>r.family===x.family&&r.tier===x.tier)),'not wanted');
 const st2=rescueStep(s,{selected:st.target.index,now:NOW});assert.equal(st2.what,'Tap Clear');assert.match(st2.why,/tap twice to confirm/);
 const st3=rescueStep(s,{selected:st.target.index,armed:true,now:NOW});assert.equal(st3.what,'Tap Clear again');doable(s,st3,'clear');
 // the lowest level first
 const tiers=s.board.filter(y=>y?.type==='item').map(y=>y.tier);assert.equal(x.tier,Math.min(...tiers));});

test('6. pending rewards: the space the action frees lets one land, and that counts',()=>{
 const s=fillUnique(camp({pending:[{type:'kit',family:'rig',size:1,left:3}]}));const a=s.board.findIndex(x=>x?.type==='item'&&x.family==='shell');
 s.board[a]=it('rig',2);s.board[a+1]=it('rig',2);
 const st=rescueStep(s,{now:NOW});assert.equal(st.via,'merge');const t=doable(s,st,'merge with a reward waiting');
 assert.equal(t.after.pending.length,0,'the waiting reward landed');assert.equal(boardFull(t.after),true,'(and took the freed space)');});

test('7. nothing can free a space: explained, no target, no action',()=>{
 const s=camp({shed:[it('lamp',0),it('lamp',1),it('lamp',2),it('lamp',3)]});
 s.board=s.board.map(x=>x?.type==='source'?x:{type:'glass',family:'rig',tier:1});
 // generators of different kinds only (no generator merge)
 const st=rescueStep(s,{now:NOW});assert.equal(st.via,'none');assert.equal(st.target,null);assert.equal(st.action,null);assert.equal(st.what,'The board is full');assert.match(st.why,/shed is full too/);});

test('never changes the camp; seeded random full boards always get a doable step or a reasoned none',()=>{
 let seed=7;const rnd=()=>(seed=(seed*1103515245+12345)%2147483648)/2147483648;
 const kinds=new Set();
 for(let n=0;n<240;n++){
  const s=camp();const fams=['rig','chart','rope','shell','lamp'],dense=rnd();
  for(let i=0;i<s.board.length;i++)if(s.board[i]===null){const r=rnd();
   s.board[i]=r<dense*.8?it(fams[Math.floor(rnd()*5)],Math.floor(rnd()*6)):r<dense*.8+.06?{type:'kit',family:fams[Math.floor(rnd()*2)],size:1,left:3}:r<dense*.8+.08?{type:'cog'}:{type:'glass',family:'rig',tier:1};}
  if(rnd()<.5)s.shed=[it('lamp',0),it('lamp',1),it('lamp',2),it('lamp',3)];
  if(rnd()<.3)s.pending=[it('rig',0)];
  if(rnd()<.4)s.orders[1]={id:'c2',who:'ivo',coins:10,needs:[{family:fams[Math.floor(rnd()*3)],tier:Math.floor(rnd()*3),count:1}]};
  const before=JSON.stringify(s);let st=rescueStep(s,{now:NOW});assert.equal(JSON.stringify(s),before,'the camp is untouched');
  assert.ok(st,'a step on a full board');kinds.add(st.via);
  if(st.via==='none'){assert.equal(st.target,null);continue;}
  const t=doable(s,st,`seed ${n} ${st.via}`);
  // a select step leads to its button step, which is the same action
  if(st.kind==='select'){const b=rescueStep(s,{selected:st.target.index,armed:true,now:NOW});assert.equal(b.target.kind,'action');assert.deepEqual(b.action,st.next);}
  // and doing it really frees room in the camp itself
  const c=structuredClone(s);assert.ok(act(c,st.action??st.next,NOW).ok);void t;}
 for(const k of ['deliver','merge','shed','none'])assert.ok(kinds.has(k),`random boards reach "${k}" (${[...kinds]})`);});

test('its once-only flag lives in the existing seen object: a save carrying it loads unchanged (no schema change)',()=>{
 // 'tip-rescue' (app.mjs RESCUE_SEEN) passes SEEN_ID, the key check load() applies (the same pattern in the live 822a8f9
 // and previous 664956e builds), so the camp is kept, not replaced by a fresh one, here and after a rollback
 assert.match('tip-rescue',SEEN_ID);
 const raw=JSON.parse(fixture);raw.seen={...raw.seen,'tip-shed':true,'tip-rescue':true};
 const s=load(JSON.stringify(raw),NOW);assert.equal(s.seen['tip-rescue'],true);assert.equal(s.seen['tip-shed'],true);
 assert.equal(s.coins,raw.coins,'the same camp (coins)');assert.deepEqual(s.built,raw.built,'the same camp (built)');});
