// Coast Camp: rare merges and restoration (build 48b, 2026-11-01; docs/V5_RARE_MERGES_RESTORATION_2026-11-01.md).
// The introductory order once per chain; merged secondary requests after it, from parts that can really be
// made (a part never splits; parts other orders need are not counted twice); nine stages whose gold orders
// ask a merged rare part instead of a second material, only when that chain can drop; gold demand keeps
// drops coming; the keepsake never pauses them; gold pays its parts' worth ×1.3 after the first six
// stages; old saves and their active orders are kept; a delivered gold order secures the materials.
import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,act,load,item,source,makeOrder,upgrades,secondaryNeed,secondaryFree,secondaryDrops,secondaryPaused,secondaryUnits,secondaryWanted,secondaryUnlock,
 goldPrice,GOLD_PAY,partValue,SECONDARY_ORDERS,isSecondary,ROVER,allDone,totalBuilt,stageOf} from '../v5/next/game.mjs';
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
 // with no stage built only basic parts (the ramp), two when two are free
 const b=camp({built:{}});put(b,'mech',0);put(b,'mech',0);assert.deepEqual(secondaryNeed(b,50,10),{family:'mech',tier:0,count:2,use:true});
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

test('nine stages name a merged rare part: modest tiers, after the chain\'s own upgrade, never on the beach', ()=>{
 const rare=Object.values(TASKS).flatMap(t=>t.stages.map((st,k)=>st.rare?[t.id,k+1,st.name,...st.rare]:null).filter(Boolean));
 assert.deepEqual(rare,[['ws-scope',3,'Chart the whole cliff','notes',1],['ws-hoist',2,'Gear the hoist','mech',1],['obs-desk',2,'Unroll the old charts','notes',1],['obs-desk',3,'Read the last logbook','notes',2],
  ['obs-bench',2,'Fit the grinding wheel','mech',1],['hb-crane',2,'Fit the pulley','mech',1],['hb-crane',3,'Recover the cargo','mech',2],['hb-registry',2,'Dry the records','notes',1],['hb-registry',3,'Trace the route','notes',2]]);
 for(const [id,,,f,tier] of rare){assert.ok(CHAINS[f].secondary&&tier>=1&&tier<=2&&tier<maxTier(f),`${id}: a merged part below the keepsake`);assert.ok(!TASKS[id].area.startsWith('beach'),'the beach (where the Rover reaches level 2) asks none');}
 // no stage gives the copy of the generator whose chain it asks (that copy would be needed first)
 for(const [id,n,,f] of rare)assert.notEqual(TASKS[id].stages[n-1].effect.copy,CHAINS[f].gen);
});

test('a mapped stage\'s gold order asks its rare part instead of its second material, only when the chain can drop', ()=>{
 const s=fresh(0);s.area=4;s.built={...done(AREAS[0]),...done(AREAS[1]),...done(AREAS[2]),...done(AREAS[3]),'hb-landing':3,'hb-crane':1,'hb-warehouse':3};s.materials={...s.built};s.orders=[];s.orderSeq=200;
 s.secOpen={rig:true,chart:true};s.board[ROVER]={...source('rig'),level:2};
 let o=makeOrder(s);assert.equal(o.story,'hb-crane');assert.deepEqual(o.needs,[{family:'rope',tier:3,count:1},{family:'mech',tier:1,count:1}],'Fit the pulley: a Gear instead of the Pocket winch');
 assert.equal(o.coins,goldPrice(s,o.needs));
 // no level-2 Rover on the board: the stage's usual materials (no wait on luck alone)
 const t=structuredClone(s);t.board[ROVER].level=1;o=makeOrder(t);assert.deepEqual(o.needs,[{family:'rope',tier:3,count:1},{family:'rig',tier:3,count:1}]);
 // an unmapped stage keeps its materials
 const u=structuredClone(s);u.built['hb-crane']=3;u.built['hb-boatyard']=0;u.materials['hb-crane']=3;o=makeOrder(u);assert.ok(!o.needs.some(r=>isSecondary(r.family)),o.story);
});

test('a tier-2 rare part is asked only within two drops of the parts held; else tier 1 (bounded waiting)', ()=>{
 const s=fresh(0);s.area=4;s.built={...done(AREAS[0]),...done(AREAS[1]),...done(AREAS[2]),...done(AREAS[3]),'hb-landing':3,'hb-crane':2,'hb-warehouse':3};s.materials={...s.built};s.orders=[];s.orderSeq=200;
 s.secOpen={rig:true,chart:true};s.board[ROVER]={...source('rig'),level:2};
 const ask=t=>{const o=makeOrder(t);assert.equal(o.story,'hb-crane');return o.needs.find(r=>isSecondary(r.family));};
 assert.deepEqual(ask(s),{family:'mech',tier:1,count:1},'nothing held: a Gear (2 drops), not a Gear assembly (4)');
 const a=structuredClone(s);put(a,'mech',0);assert.equal(ask(a).tier,1,'one basic part: still 3 drops from the assembly');
 const b=structuredClone(s);put(b,'mech',1);assert.equal(secondaryDrops(b,'mech',2),2);assert.equal(ask(b).tier,2,'a Gear in hand: the assembly is 2 drops away');
 // a part another order already needs is not counted as free
 const c=structuredClone(b);c.orders=[{id:'x',who:'bram',needs:[{family:'mech',tier:1,count:1}],coins:10}];assert.equal(ask(c).tier,1);
});

test('gold pays its parts\' worth ×1.5 for the first six stages, ×1.3 after', ()=>{
 assert.deepEqual(GOLD_PAY,{rate:1.3,early:6,earlyRate:1.5});
 const needs=[{family:'rig',tier:3,count:1},{family:'rope',tier:2,count:2}],worth=partValue(needs[0])+2*partValue(needs[1]);
 const s=fresh(0);assert.equal(goldPrice(s,needs),Math.round(worth*1.5/5)*5);
 s.built={...done(AREAS[0])};assert.ok(totalBuilt(s)>=6);assert.equal(goldPrice(s,needs),Math.round(worth*1.3/5)*5);
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
