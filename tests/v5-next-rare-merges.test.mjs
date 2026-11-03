// Coast Camp: rare merges and restoration (build 48b, 2026-11-01; docs/V5_RARE_MERGES_RESTORATION_2026-11-01.md).
// The introductory order once per chain; merged secondary requests after it, from parts that can really be
// made (a part never splits; parts other orders need are not counted twice); nine stages whose gold orders
// ask a merged rare part instead of a second material, only when that chain can drop; gold demand keeps
// drops coming; the keepsake never pauses them; gold pays its parts' worth ×1.3 after the first six
// stages; old saves and their active orders are kept; a delivered gold order secures the materials.
import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,act,load,item,source,makeOrder,upgrades,secondaryNeed,secondaryFree,secondaryDrops,secondaryPaused,secondaryUnits,secondaryWanted,secondaryUnlock,
 goldPrice,GOLD_PAY,partValue,SECONDARY_ORDERS,isSecondary,ROVER,allDone,totalBuilt,stageOf,goldChase,secondaryRoll,SECONDARY_RULES} from '../v5/next/game.mjs';
import {AREAS,TASKS,STAGES} from '../v5/next/areas.mjs';
import {CHAINS,maxTier} from '../v5/next/chains.mjs';

const ok=(s,a,now=1000)=>{const r=act(s,a,now);assert.ok(r.ok,JSON.stringify(a)+' '+r.message);return r;};
const done=a=>Object.fromEntries(a.tasks.map(t=>[t.id,3]));
// a camp whose Rover is level 2 with its chain open and introduced (a stage built, so merged parts may be asked)
function camp({built={'beach-path':1}}={}){
 const s=fresh(0);s.board[ROVER]={...source('rig'),level:2};s.secOpen={rig:true};s.secIntro=[];s.found.push('mech0');s.built=built;s.materials={...built};
 s.orders=s.orders.map(o=>({...o,needs:o.needs.filter(r=>!isSecondary(r.family))})).map(o=>o.needs.length?o:{...o,needs:[{family:'rig',tier:1,count:1}]});
 s.recent=['rig1x1','rig2x1'];return s;}
// a part on the board: on a free space, else in place of a sealed cargo crate (a new camp has few free spaces)
const put=(s,f,t)=>{let i=s.board.findIndex(x=>x===null);if(i<0)i=s.board.findIndex(x=>x?.type==='cargo');s.board[i]=item(f,t);return i;};

test('the introductory order comes once per chain, and its progress is kept in the save', ()=>{
 const s=fresh(0);s.board[15]=source('rig');ok(s,{type:'merge',from:15,to:ROVER});
 assert.deepEqual(s.secIntro,['mech']);
 // the next crew order is the introduction (a quick job for the first Bolt)
 // (the first order made with no gold order on the board is the gold order; the next crew order is the introduction)
 s.orders[0]=null;s.orders[0]=makeOrder(s);assert.ok(s.orders[0].story);
 s.orders[1]=null;s.orders[1]=makeOrder(s);assert.deepEqual(s.orders[1].needs,[{family:'mech',tier:0,count:1}]);
 // once an order asks the chain the introduction is no longer queued; a reload keeps that
 s.secIntro=s.secIntro.filter(f=>!s.orders.some(o=>o?.needs?.some(q=>q.family===f)));assert.deepEqual(s.secIntro,[]);
 const t=load(JSON.stringify(s),2000);assert.deepEqual(t.secIntro,[]);assert.deepEqual(secondaryUnlock(t),[],'never a second gift or introduction');
 // a save still waiting for its introduction keeps it waiting
 const u=fresh(0);u.board[ROVER]={...source('rig'),level:2};u.secOpen={rig:true};u.secIntro=['mech'];assert.deepEqual(load(JSON.stringify(u),0).secIntro,['mech']);
});

test('after the introduction, merged parts are asked: the highest the free parts make now, else one or two drops away', ()=>{
 const s=camp();
 assert.deepEqual(secondaryNeed(s,50,10),{family:'mech',tier:1,count:1},'nothing held: a Gear, two drops away (a goal)');
 put(s,'mech',0);assert.deepEqual(secondaryNeed(s,50,10),{family:'mech',tier:1,count:1},'one Bolt: a Gear one drop away');
 put(s,'mech',0);assert.deepEqual(secondaryNeed(s,50,10),{family:'mech',tier:1,count:1,use:true},'two Bolts: a Gear now');
 // tier 2 only once a Gear has been made, and from the third stage
 s.built={'beach-path':3};s.materials={...s.built};assert.equal(secondaryNeed(s,50,10).tier,1,'no Gear made yet');
 s.found.push('mech1');put(s,'mech',1);assert.deepEqual(secondaryNeed(s,50,10),{family:'mech',tier:2,count:1,use:true},'a Gear and two Bolts make a Gear assembly');
 // Build 52A: no Level 1 (tier 0) ask after the introduction, not even before the first stage (the ramp): nothing
 const b=camp({built:{}});put(b,'mech',0);put(b,'mech',0);assert.equal(secondaryNeed(b,50,10),null);
});

test('a held part never splits, and parts other orders need are not counted twice', ()=>{
 const s=camp();put(s,'mech',2);
 assert.deepEqual(secondaryFree(s,'mech').have,[0,0,1,0]);assert.equal(secondaryDrops(s,'mech',1),2,'a Gear assembly is not a Gear: two drops still');
 const r=secondaryNeed(s,50,10);assert.ok(!(r?.tier===1&&r.use),'never a Gear "use" order from an assembly');
 // two Bolts held, a Gear already asked: nothing free for a second Gear
 const t=camp();put(t,'mech',0);put(t,'mech',0);t.orders[0]={...t.orders[0],needs:[{family:'mech',tier:1,count:1}]};
 assert.deepEqual(secondaryFree(t,'mech'),{have:[0,0,0,0],short:0});assert.equal(secondaryDrops(t,'mech',1),2);
 // the keepsake (top part) is held but makes nothing
 const u=camp();put(u,'mech',3);assert.equal(secondaryDrops(u,'mech',1),2);
});

test('a keepsake never pauses drops; an order\'s demand, gold ones included, keeps them coming', ()=>{
 const s=camp();put(s,'mech',3);assert.equal(secondaryUnits(s,'mech'),0);assert.equal(secondaryPaused(s,'rig'),false,'the Hand-crank mechanism alone');
 // four unwanted Bolts pause; a gold order that wants a Gear assembly lifts the pause
 for(let k=0;k<4;k++)put(s,'mech',0);assert.equal(secondaryPaused(s,'rig'),true);
 s.orders[0]={id:'g1',who:'ivo',needs:[{family:'rope',tier:3,count:1},{family:'mech',tier:2,count:1}],coins:100,story:'hb-crane'};
 assert.equal(secondaryWanted(s,'mech'),4);assert.equal(secondaryPaused(s,'rig'),false,'the gold order\'s Gear assembly counts');
});

test('builds 48c and 51b: stages name a fixed merged rare part: Gears, Expedition notes, Gear assemblies and Travel notebooks', ()=>{
 const rare=Object.values(TASKS).flatMap(t=>t.stages.map((st,k)=>st.rare?[t.id,k+1,st.name,...st.rare]:null).filter(Boolean));
 // build 51b: Chapter 1's five new ones (the pier's crane, the cliff gate, the cliff chart, the dial's map, the middle ring)
 assert.deepEqual(rare,[['beach-pier',2,'Add a cargo crane','mech',1],['beach-cliff',3,'Open the cliff gate','notes',1],['ws-scope',3,'Chart the whole cliff','notes',2],['ws-hoist',2,'Gear the hoist','mech',1],['ws-door',3,'Map the dial','notes',1],['vault-door',2,'Turn the middle ring','mech',2],
  ['obs-desk',2,'Unroll the old charts','notes',1],['obs-desk',3,'Read the last logbook','notes',2],
  ['obs-bench',2,'Fit the grinding wheel','mech',1],['hb-crane',3,'Recover the cargo','mech',2],['hb-registry',3,'Trace the route','notes',2]]);
 for(const [id,,,f,tier] of rare)assert.ok(CHAINS[f].secondary&&tier>=1&&tier<=2&&tier<maxTier(f),`${id}: a merged part below the keepsake, never a single Bolt or note fragment`);
 // no stage gives the copy of the generator whose chain it asks (that copy would be needed first)
 for(const [id,n,,f] of rare)assert.notEqual(TASKS[id].stages[n-1].effect.copy,CHAINS[f].gen);
 // only the two pilot chains (the Winch, Shell and Kiln chains stay inactive)
 assert.deepEqual([...new Set(rare.map(r=>r[3]))].sort(),['mech','notes']);
});

// a camp at the harbour crane's last stage (Recover the cargo: a Gear assembly), a level-2 Rover, a clear board
const crane=()=>{const s=fresh(0);s.area=4;s.built={...done(AREAS[0]),...done(AREAS[1]),...done(AREAS[2]),...done(AREAS[3]),'hb-landing':3,'hb-crane':2,'hb-warehouse':3};s.materials={...s.built};s.orders=[];s.orderSeq=200;
 s.secOpen={rig:true,chart:true};s.board[ROVER]={...source('rig'),level:2};s.board=s.board.map(x=>x?.type==='source'?x:null);return s;};
// the gold order first, then primary-only crew orders up to the camp's slots (a valid save)
const withGold=s=>{s.orders=[makeOrder(s)];for(let k=s.orders.length;k<s.slots;k++)s.orders.push({id:'p'+k,who:'ivo',needs:[{family:'rig',tier:1,count:1}],coins:5});return s;};

test('a mapped stage\'s gold order asks its rare part instead of its second material, only when the chain can drop', ()=>{
 const s=crane();
 let o=makeOrder(s);assert.equal(o.story,'hb-crane');assert.deepEqual(o.needs,[{family:'rope',tier:4,count:1},{family:'mech',tier:2,count:1}],'Recover the cargo: a Gear assembly instead of the Pocket winch');
 assert.equal(o.coins,goldPrice(s,o.needs));
 // no level-2 Rover on the board: the chain cannot drop, so the stage's usual materials (no circular unlock)
 const t=structuredClone(s);t.board[ROVER].level=1;o=makeOrder(t);assert.deepEqual(o.needs,[{family:'rope',tier:4,count:1},{family:'rig',tier:3,count:1}]);
 // an unmapped stage keeps its materials (Fit the pulley, build 48b's Gear, is no longer mapped)
 const u=structuredClone(s);u.built['hb-crane']=1;u.materials['hb-crane']=1;o=makeOrder(u);assert.equal(o.story,'hb-crane');assert.ok(!o.needs.some(r=>isSecondary(r.family)),'Fit the pulley');
});

test('build 48c: the recipe is fixed: never lowered for what the player holds or what other orders need', ()=>{
 const s=crane(),ask=t=>{const o=makeOrder(t);assert.equal(o.story,'hb-crane');return o.needs.find(r=>isSecondary(r.family));};
 const want={family:'mech',tier:2,count:1};
 assert.deepEqual(ask(s),want,'nothing held: still the Gear assembly');
 const a=structuredClone(s);put(a,'mech',0);assert.deepEqual(ask(a),want,'a Bolt held');
 const b=structuredClone(s);put(b,'mech',1);assert.deepEqual(ask(b),want,'a Gear held');
 const c=structuredClone(b);c.orders=[{id:'x',who:'bram',needs:[{family:'mech',tier:1,count:1}],coins:10}];assert.deepEqual(ask(c),want,'another order wants the Gear');
 const d=structuredClone(s);put(d,'mech',2);assert.deepEqual(ask(d),want,'a Gear assembly held: delivered at once');
});

// eligible taps on the level-2 Rover until a mech part drops; its own part is cleared so the board never fills
const tapsToDrop=(s,limit=40)=>{for(let n=1;n<=limit;n++){const mech=t=>t.board.filter(x=>x?.family==='mech').length+t.pending.filter(x=>x?.family==='mech').length,before=mech(s);
 s.energy=50;const r=act(s,{type:'produce',id:'rig'},1000);assert.ok(r.ok,r.message);if(r.index>=0&&s.board[r.index]?.family==='rig')s.board[r.index]=null;
 if(mech(s)>before)return n;}return null;};

test('build 48c: while the gold order lacks its rare part, a drop is certain by the 8th eligible tap; otherwise by the 20th', ()=>{
 assert.deepEqual([SECONDARY_RULES.rig.goldPity,SECONDARY_RULES.chart.goldPity,SECONDARY_RULES.rig.pity,SECONDARY_RULES.rig.chance],[8,8,20,.05]);
 // a gold order for a Gear assembly, nothing held: the chase is on, for that chain only
 const s=crane();s.orders=[makeOrder(s)];assert.ok(goldChase(s,'mech'));assert.equal(goldChase(s,'notes'),false,'only the gold part\'s chain');
 // seven eligible taps without a drop already counted: the next one makes it
 s.secSince={rig:7,chart:0};assert.equal(tapsToDrop(s),1,'the 8th in a row');
 // each drop takes at most 8 eligible taps while the chase lasts, whatever the rolls: 32 at most for the assembly
 for(const salt of [101,7,999,31337]){const t=crane();t.orders=[makeOrder(t)];SECONDARY_RULES.rig.salt=salt;
  let taps=0;for(let k=0;k<4&&goldChase(t,'mech');k++){const n=tapsToDrop(t);assert.ok(n!==null&&n<=8,`salt ${salt}: drop ${k+1} took ${n}`);taps+=n;
   // the player's merges: Bolts into Gears, Gears into the Gear assembly
   for(const tier of [0,1]){const at=t.board.map((x,i)=>x?.family==='mech'&&x.tier===tier?i:-1).filter(i=>i>=0);if(at.length>=2)assert.ok(act(t,{type:'merge',from:at[0],to:at[1]},1000).ok);}}
  assert.ok(taps<=32,`salt ${salt}: ${taps} eligible taps for a Gear assembly`);assert.equal(goldChase(t,'mech'),false,'the part is made: the chase ends');}
 SECONDARY_RULES.rig.salt=101;
 // the same counters without the gold order: the ordinary pity of 20, so the 8th tap in a row is left to
 // the 5 % roll (a roll that misses is found; with the gold order the same tap is certain)
 const u=crane();u.orders=[];u.secSince={rig:7,chart:0};assert.equal(goldChase(u,'mech'),false);
 let salt=1;while(secondaryRoll(u,'rig')!==null)SECONDARY_RULES.rig.salt=++salt;
 const v=structuredClone(u);v.orders=[makeOrder(v)];assert.equal(secondaryRoll(v,'rig'),'mech');
 v.secSince.rig=19;u.secSince.rig=19;assert.equal(secondaryRoll(u,'rig'),'mech','the 20th is certain either way');SECONDARY_RULES.rig.salt=101;
});

test('build 48c: the chase accounts for other orders, ends with the part, survives a reload and respects a full board', ()=>{
 const s=withGold(crane());
 // a Gear assembly on the board makes it: no chase...
 const a=structuredClone(s);put(a,'mech',2);assert.equal(goldChase(a,'mech'),false);
 // ...unless a crew order needs that Gear assembly: then the gold one still lacks it
 a.orders.push({id:'c',who:'bram',needs:[{family:'mech',tier:2,count:1}],coins:20});assert.equal(goldChase(a,'mech'),true,'parts other orders need are set aside');
 // two Gears make the assembly (no chase); one Gear does not
 const b=structuredClone(s);put(b,'mech',1);assert.equal(goldChase(b,'mech'),true);put(b,'mech',1);assert.equal(goldChase(b,'mech'),false);
 // a reload replays the same outcome: the counters are saved and the roll is the tap count hashed
 const c=structuredClone(s);c.secSince={rig:5,chart:0};const x=load(JSON.stringify(c),1000);assert.equal(x.secSince.rig,5);assert.ok(goldChase(x,'mech'));
 assert.equal(tapsToDrop(structuredClone(c)),tapsToDrop(x),'same taps to the next drop after a reload');
 // a full board with four rare parts waiting: drops pause, the tap is not eligible and counts nothing
 const f=structuredClone(s);f.secSince={rig:7,chart:0};f.board=f.board.map((y,i)=>i===ROVER?y:item('shell',0));f.pending=[item('mech',0),item('mech',0),item('notes',0),item('notes',0)];
 assert.ok(secondaryPaused(f,'rig'));assert.equal(secondaryRoll(f,'rig'),null);
 // the delivered gold order ends it
 const d=structuredClone(s);d.orders=[];assert.equal(goldChase(d,'mech'),false);
});

test('gold pays its parts\' worth ×1.5 for the first stage, ×0.9 for stages 2-6, ×1.0 after (build 52A)', ()=>{
 assert.deepEqual(GOLD_PAY,{rate:1.0,early:6,earlyRate:0.9,opening:1,openingRate:1.5});
 const needs=[{family:'rig',tier:3,count:1},{family:'rope',tier:2,count:2}],worth=partValue(needs[0])+2*partValue(needs[1]);
 const s=fresh(0);assert.equal(goldPrice(s,needs),Math.round(worth*1.5/5)*5);
 s.built={'beach-path':1};assert.equal(goldPrice(s,needs),Math.round(worth*.9/5)*5);
 s.built={...done(AREAS[0])};assert.ok(totalBuilt(s)>=6);assert.equal(goldPrice(s,needs),Math.round(worth*1.0/5)*5);
});

test('a delivered gold order secures the materials; building waits for the coins, then works once', ()=>{
 const s=fresh(0);s.area=4;s.built={...done(AREAS[0]),...done(AREAS[1]),...done(AREAS[2]),...done(AREAS[3]),'hb-landing':3,'hb-warehouse':3,'hb-crane':1};s.materials={...s.built};s.orders=[];s.orderSeq=200;
 s.secOpen={rig:true};s.board[ROVER]={...source('rig'),level:2};s.orders=[makeOrder(s)];const o=s.orders[0];assert.equal(o.story,'hb-crane');
 for(const r of o.needs)for(let c=0;c<r.count;c++)put(s,r.family,r.tier);
 s.coins=10;const d=ok(s,{type:'deliver',id:o.id});assert.deepEqual(d.materials,{id:'hb-crane',stage:2});
 const u=upgrades(s).find(v=>v.id==='hb-crane');assert.equal(u.materials,true);assert.ok(s.coins<u.cost);
 assert.match(act(s,{type:'restore',id:'hb-crane'}).message,new RegExp(`needs ${u.cost} coins`));
 s.coins=u.cost;ok(s,{type:'restore',id:'hb-crane'});assert.equal(stageOf(s,'hb-crane'),2);
 assert.equal(act(s,{type:'restore',id:'hb-crane'}).ok,false,'the next stage needs its own materials');
});

test('a gold order with a rare part on a full board: the stage\'s reward waits for space, once', ()=>{
 const s=fresh(0);s.area=4;s.built={...done(AREAS[0]),...done(AREAS[1]),...done(AREAS[2]),...done(AREAS[3]),'hb-landing':3,'hb-warehouse':3,'hb-crane':2};s.materials={...s.built,'hb-crane':3};s.coins=5000;
 for(let i=0;i<s.board.length;i++)if(s.board[i]===null)s.board[i]=item('rig',0);
 const r=ok(s,{type:'restore',id:'hb-crane'});assert.equal(r.effects.kit,-1);assert.equal(s.pending.filter(x=>x.type==='kit').length,1);
 const t=load(JSON.stringify(s),2000);assert.equal(t.pending.filter(x=>x.type==='kit').length,1,'kept across a reload, once');
});

test('old saves keep their active orders as they were; new recipes apply to new orders', ()=>{
 // a 48a save at the crane's second stage with its old gold order (Pocket winch) and a basic Bolt job
 const s=fresh(0);s.area=4;s.built={...done(AREAS[0]),...done(AREAS[1]),...done(AREAS[2]),...done(AREAS[3]),'hb-landing':3,'hb-warehouse':3,'hb-crane':1};s.materials={...s.built};
 s.secOpen={rig:true};s.board[ROVER]={...source('rig'),level:2};
 s.orders[0]={id:'o90',who:'ivo',needs:[{family:'rope',tier:3,count:1},{family:'rig',tier:3,count:1}],coins:105,story:'hb-crane'};
 s.orders[1]={id:'o91',who:'ivo',needs:[{family:'mech',tier:0,count:1}],coins:10,role:'quick',born:0};
 const t=load(JSON.stringify(s),2000);assert.deepEqual(t.orders,s.orders,'nothing replaced or repriced');
 // delivering the old gold order secures the stage exactly as before
 for(const r of t.orders[0].needs)put(t,r.family,r.tier);ok(t,{type:'deliver',id:'o90'});assert.equal(t.materials['hb-crane'],2);
});
