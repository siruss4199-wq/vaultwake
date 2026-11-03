// Coast Camp Chapter 1 rare merge goals (build 51b, 2026-11-02; docs/V5_CH1_RARE_GOALS_2026-11-02.md).
// Six Chapter 1 gold stages name a fixed merged rare part. Each is asked only while its chain can drop (a
// level-2+ generator of it on the board), never the stage's own reward, never two in a row while another place
// is open. Checked over random routes through all 45 stages, for a player who merges every generator copy and
// one who never merges one (no block either way); a rare gold order stays as issued (reload, the generator
// moved away); saves keep their gold orders and material credits.
import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,load,act,item,upgrades,stageOf,areaDone,totalBuilt,storyTarget,secondaryCanDrop,generatorsMerge,isSecondary,source,goldChase,makeOrder,SECONDARY_RULES} from '../v5/next/game.mjs';
import {AREAS,TASKS} from '../v5/next/areas.mjs';
import {CHAINS} from '../v5/next/chains.mjs';

const CH1=AREAS.slice(0,3),RARE=[['beach-path',3,'mech',1],['beach-mast',3,'mech',1],['beach-workshop',2,'mech',1],['beach-pier',2,'mech',1],['beach-beacon',2,'mech',1],['beach-cliff',3,'notes',1],['ws-camp',3,'notes',1],['ws-scope',3,'notes',2],['ws-ropes',2,'mech',1],['ws-pool',2,'notes',1],['ws-hoist',2,'mech',1],['ws-door',3,'notes',1],['vault-door',2,'mech',2]];
// Build 52A player feedback: whether a gold order's rare chain could drop is read when the order is made (as
// makeOrder does); a player may merge a generator copy after that (the boardwalk's Rover arrives with the build
// that makes the next gold order), and the order stays as issued.
const born=new WeakMap();
const note=s=>{for(const o of s.orders)if(o?.story&&!born.has(o)){const t=TASKS[o.story],rare=t.stages[stageOf(s,o.story)]?.rare;born.set(o,rare?secondaryCanDrop(s,rare[0]):null);}};
const ok=(s,a,now=1000)=>{const r=act(s,a,now);assert.ok(r.ok,JSON.stringify(a)+' '+r.message);note(s);return r;};
const free=s=>s.board.reduce((a,x,i)=>x===null||x.type==='cargo'?[...a,i]:a,[]);
const rareOf=(id,n)=>TASKS[id].stages[n-1].rare;
// The gold order comes as the game makes it: into a crew order's lane when that order is done (makeOrder).
// A save's gold order replaced by an ordinary crew order (a lane is never empty in a save).
const noGold=s=>{let k=900;s.orders=s.orders.map(o=>o?.story?{...s.orders.find(x=>x&&!x.story),id:'o'+(k++)}:o);};
const goldUp=s=>{let o=s.orders.find(x=>x?.story);if(!o){const k=s.orders.findIndex(x=>!x?.story);s.orders[k]=null;s.orders[k]=makeOrder(s);note(s);o=s.orders.find(x=>x?.story);}return o;};
// Merges every pair of same-level generators on the board (what the game's hints ask for), until none is left.
function mergeCopies(s){for(let go=true;go;){go=false;for(let i=0;i<s.board.length&&!go;i++)for(let j=0;j<s.board.length&&!go;j++)if(i!==j&&generatorsMerge(s.board[i],s.board[j])){ok(s,{type:'merge',from:j,to:i});go=true;}}}
// One random route through Chapter 1: after every build, aim at a random open stage (sometimes), deliver its gold
// order (its parts laid on the board), build it. merge: the player merges generator copies (or never does).
function playChapter1(seed,{merge}){
 let r=seed*2654435761%4294967296;const rnd=()=>((r=(r*1664525+1013904223)%4294967296)/4294967296);
 const s=fresh(0);s.coins=1e6;const log=[];let guard=0;
 while(s.area<3&&guard++<200){
  if(merge)mergeCopies(s);
  const ups=upgrades(s);assert.ok(ups.length,'never stuck: '+JSON.stringify(s.built));
  const open=ups.filter(u=>!u.materials);
  if(open.length>1&&rnd()<.3){const u=open[Math.floor(rnd()*open.length)];if(!s.orders.some(o=>o?.story===u.id))ok(s,{type:'aim',id:u.id});}
  let u=ups.find(u=>u.materials);
  if(!u){const o=goldUp(s);assert.ok(o,'a gold order for an open stage');u=ups.find(v=>v.id===o.story);const aimed=s.aim===u.id;
   const rare=rareOf(u.id,u.stage),asks=o.needs.find(n=>isSecondary(n.family));
   // a rare part is asked only while its chain can drop, and then exactly the authored part
   if(asks){assert.ok(rare,`${u.id} ${u.stage} asks a rare part it does not name`);assert.deepEqual([asks.family,asks.tier,asks.count],[...rare,1]);assert.ok(secondaryCanDrop(s,asks.family),`${u.id} ${u.stage}: its chain can drop`);}
   else if(rare&&TASKS[u.id].area!=='harbour')assert.ok(!(born.get(o)??secondaryCanDrop(s,rare[0])),`${u.id} ${u.stage}: its rare part is skipped only when its chain cannot drop`);
   const plainAvailable=open.filter(v=>{const candidate=TASKS[v.id].stages[v.stage-1].rare;return !candidate||!secondaryCanDrop(s,candidate[0]);}).length;
   log.push({id:u.id,n:u.stage,rare:!!asks,others:open.length,plainAvailable,aimed,rareLast:s.rareLast??false,aim:s.aim??null,hasGold:s.orders.some(o=>o?.story),lastDelivered:s.ordersDone});
   for(const x of s.board.map((x,i)=>x&&x.type!=='source'&&x.type!=='glass'&&x.type!=='cargo'?i:-1).filter(i=>i>=0&&free(s).length<6))s.board[x]=null;
   for(const x of s.board.map((x,i)=>x?.type==='source'?i:-1).filter(i=>i>=0&&free(s).length<6&&s.board.filter(y=>y?.type==='source'&&y.id===s.board[i].id).length>1))s.board[x]=null;
   const f=free(s);let k=0;for(const n of o.needs)for(let c=0;c<n.count;c++)s.board[f[k++]]=item(n.family,n.tier);
   ok(s,{type:'deliver',id:o.id});}
  ok(s,{type:'restore',id:u.id});
 }
 return {s,log};
}

test('thirteen Chapter 1 stages name a fixed merged rare part, matched to the repair: Gears for machinery, notes for surveying', ()=>{
 const ch1=CH1.flatMap(a=>a.tasks.flatMap(t=>t.stages.map((st,k)=>st.rare?[t.id,k+1,...st.rare]:null))).filter(Boolean);
 assert.deepEqual(ch1,RARE);assert.equal(CH1.reduce((n,a)=>n+a.tasks.length*3,0),45);
 for(const [id,n,f,tier] of ch1){assert.ok(CHAINS[f].secondary&&tier>=1,'never a single Bolt or a note fragment');
  const st=TASKS[id].stages[n-1];assert.ok(!st.gold||st.gold.length===2,'the authored two-part Gold recipe precedes the additional rare ingredient');
  // (the path's lanterns give a Rover copy, but their Gear needs the Level 2 Rover the boardwalk's copy made;
  // the lanterns' copy is the one toward Level 3 and the Survey Kite)
  if(!(id==='beach-path'&&n===3))assert.notEqual(st.effect.copy,CHAINS[f].gen,'never the copy of the generator its chain needs');}
 assert.equal(TASKS['beach-path'].stages[1].effect.copy,'rig','the boardwalk before it gives the Rover copy that opens Gears');
 // the first Gears are on the beach (the path's lanterns, the pier's crane), the first note after them; Gear assembly and Travel notebook come later
 assert.equal(TASKS['beach-pier'].area,'beach');assert.equal(TASKS['beach-cliff'].area,'beach');
});

test('every route through Chapter 1, merging generator copies: no block, each rare part asked only when its chain can drop, never two in a row while another place is open', ()=>{
 const asked={};let routes=0;
 for(let seed=1;seed<=120;seed++){const {s,log}=playChapter1(seed,{merge:true});routes++;
  assert.equal(s.area,3,'Chapter 1 done');for(const a of CH1)assert.ok(areaDone(s,a));assert.equal(totalBuilt(s),45);
  for(let i=1;i<log.length;i++)if(log[i].rare&&log[i-1].rare&&!log[i].aimed)assert.equal(log[i].plainAvailable,0,`seed ${seed}: two rare goals despite a normal alternative ${JSON.stringify(log.slice(Math.max(0,i-2),i+1))}`);
  for(const l of log)if(l.rare)asked[l.id+l.n]=(asked[l.id+l.n]??0)+1;}
 // a player who merges the copies the beach gives meets every one of them on most routes
 for(const [id,n] of RARE)assert.ok((asked[id+n]??0)>=routes*.75,`${id} ${n} asked on ${asked[id+n]??0} of ${routes} routes`);
});

test('a player who never merges a generator copy: no rare part is ever asked, and nothing blocks', ()=>{
 for(let seed=1;seed<=60;seed++){const {s,log}=playChapter1(seed,{merge:false});
  assert.equal(totalBuilt(s),45);assert.equal(log.filter(l=>l.rare).length,0,'no rare gold order without a level-2+ generator');}
});

// a camp at the pier's second stage with a level-2 Rover: its gold order asks a Gear
function atPier(){
 const s=fresh(0);s.coins=5000;
 for(const [id,n] of [['beach-path',3],['beach-tent',3],['beach-mast',1],['beach-workshop',1],['beach-pier',1]])s.built[id]=n,s.materials[id]=n;
 const r=s.board.findIndex(x=>x?.type==='source'&&x.id==='rig');s.board[r]={...s.board[r],level:2};s.secOpen={rig:true};
 noGold(s);s.aim='beach-pier';
 const t=load(JSON.stringify(s),5000);goldUp(t);return t;
}
test('the first rare goal on the beach: the cargo crane asks a Gear once a level-2 Rover is out; the order stays as issued', ()=>{
 const s=atPier(),o=s.orders.find(o=>o?.story);
 assert.equal(o.story,'beach-pier');assert.deepEqual(o.needs.at(-1),{family:'mech',tier:1,count:1});assert.equal(o.needs.length,3,'Gear is an additional crafting requirement');
 assert.ok(goldChase(s,'mech'),'the gold-objective guarantee covers it');
 // the Rover moved to the shed (no drops now): the issued order is not changed, now or after a reload
 const r=s.board.findIndex(x=>x?.type==='source'&&x.id==='rig'),to=s.board.findIndex(x=>x===null);s.board[to]=s.board[r];s.board[r]=null;
 const t=load(JSON.stringify(s),9000);assert.deepEqual(t.orders.find(o=>o?.story),o);
 // choosing another place and back makes the same goal again (fixed part, never lowered)
 const u=structuredClone(t);
 for(const held of [[],[['mech',0]],[['mech',2]]]){const v=structuredClone(u);for(const [f,k] of held)v.board[v.board.findIndex(x=>x===null)]=item(f,k);
  ok(v,{type:'aim',id:'beach-workshop'});ok(v,{type:'aim',id:'beach-pier'});assert.deepEqual(v.orders.find(o=>o?.story).needs.at(-1),{family:'mech',tier:1,count:1},JSON.stringify(held));}
});

test('without a level-2 Rover on the board the crane asks its usual materials (copies awarded are not an upgrade)', ()=>{
 const s=fresh(0);s.coins=5000;for(const [id,n] of [['beach-path',3],['beach-tent',3],['beach-mast',1],['beach-workshop',1],['beach-pier',1]])s.built[id]=n,s.materials[id]=n;
 // three Rover copies awarded, none merged
 for(let k=0;k<3;k++)s.board[s.board.findIndex(x=>x===null)]=source('rig');
 noGold(s);s.aim='beach-pier';const t=load(JSON.stringify(s),5000),o=goldUp(t);
 assert.equal(o.story,'beach-pier');assert.ok(!o.needs.some(n=>isSecondary(n.family)));assert.equal(secondaryCanDrop(t,'mech'),false);
});

test('a rare goal never follows another while another place is open; the player\'s own choice still wins; old saves load', ()=>{
 const s=atPier(),o=s.orders.find(o=>o?.story);
 // Keep the generators and sealed cells, but make space for every part of a three-ingredient order.
 for(let i=0;i<s.board.length;i++)if(s.board[i]?.type!=='source')s.board[i]=null;
 for(const need of o.needs)for(let k=0;k<need.count;k++){const i=s.board.findIndex(x=>x===null);assert.ok(i>=0,'space for the complete Gold order');s.board[i]=item(need.family,need.tier);}
 ok(s,{type:'deliver',id:o.id});assert.equal(s.rareLast,true);
 // the worksite where the cliff chart (a Travel notebook) heads the list: a level-2 Kite out, other places open
 const t=structuredClone(s);for(const a of AREAS.slice(0,1))for(const x of a.tasks)t.built[x.id]=3,t.materials[x.id]=3;
 t.area=1;t.built['ws-camp']=3;t.materials['ws-camp']=3;t.built['ws-scope']=2;t.materials['ws-scope']=2;t.built['ws-ropes']=1;t.materials['ws-ropes']=1;t.built['ws-steps']=1;t.materials['ws-steps']=1;
 t.board[t.board.findIndex(x=>x===null)]={...source('chart'),level:2};t.secOpen={rig:true,chart:true};delete t.aim;noGold(t);
 assert.equal(upgrades(t).filter(u=>!u.materials)[0].id,'ws-scope');
 assert.notEqual(storyTarget(t).id,'ws-scope','right after a rare goal: the next open plain stage first');
 const w=structuredClone(t);goldUp(w);assert.ok(!w.orders.find(o=>o?.story).needs.some(n=>isSecondary(n.family)));
 const u=structuredClone(t);delete u.rareLast;assert.equal(storyTarget(u).id,'ws-scope','after a plain goal the rare stage is next as usual');
 const u2=structuredClone(u);goldUp(u2);assert.deepEqual(u2.orders.find(o=>o?.story).needs.at(-1),{family:'notes',tier:2,count:1});
 const v=structuredClone(t);v.aim='ws-scope';assert.equal(storyTarget(v).id,'ws-scope','the player\'s choice wins');
 // rareLast: an old save has none; a damaged one is dropped; a kept one survives a reload
 assert.equal(load(JSON.stringify({...t,rareLast:'yes'}),9000).rareLast,undefined);assert.equal(load(JSON.stringify(t),9000).rareLast,true);
});

test('saves: an existing gold order and delivered material credits are kept; the new recipe comes with the next gold order', ()=>{
 // a build 51a save whose pier gold order was issued with its usual materials
 const s=atPier();const plain={...s.orders.find(o=>o?.story),needs:[{family:'rig',tier:3,count:1},{family:'rig',tier:2,count:2}]};
 s.orders=s.orders.map(o=>o?.story?plain:o);delete s.rareLast;
 const t=load(JSON.stringify(s),9000);assert.deepEqual(t.orders.find(o=>o?.story),plain,'the issued order is not overwritten');
 // materials already delivered for the crane: no new gold order for it, the credit kept
 const u=structuredClone(s);u.materials['beach-pier']=2;noGold(u);
 const v=load(JSON.stringify(u),9000);assert.equal(v.materials['beach-pier'],2);assert.ok(!v.orders.some(o=>o?.story==='beach-pier'));
 ok(v,{type:'restore',id:'beach-pier'});assert.equal(stageOf(v,'beach-pier'),2);
 // board, shed and pending rewards untouched by the load
 assert.deepEqual(t.board,s.board);assert.deepEqual(t.shed,s.shed);assert.deepEqual(t.pending,s.pending);
 // the rules are unchanged: same drop rates and guarantee
 assert.deepEqual([SECONDARY_RULES.rig.chance,SECONDARY_RULES.rig.pity,SECONDARY_RULES.rig.goldPity],[.04,24,10]);
});
