// Build 51d (user, 2026-11-02: "ehnii 10min toglohod gold orderuud dandaa adilhan baina"): in Chapter 1 the
// gold orders take turns between four recipe shapes of about the same worth, so two in a row never match;
// the first gold order is unchanged (1 Pocket winch + 2 Split spanners, 70 coins); the pay follows what is
// asked (goldPrice); stages with their own recipe, rare goals and Chapters 2-6 keep theirs.
import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,act,tick,goldShape,goldsDelivered,goldPrice,partValue,GOLD_SHAPE_AREA,GOLD_TURN,load} from '../v5/next/game.mjs';
import {nextAction} from './v5-next-policy.mjs';
import {TASKS} from '../v5/next/areas.mjs';
import {maxTier} from '../v5/next/chains.mjs';

const key=needs=>needs.map(r=>`${r.count}x${r.family}${r.tier}`).sort().join('+');
const worth=needs=>needs.reduce((v,r)=>v+r.count*partValue(r),0);

test('the four shapes: different recipes of about the same worth, inside the chain', ()=>{
 for(const [a,b] of [[{family:'rig',tier:3,count:1},{family:'rig',tier:2,count:2}],[{family:'rig',tier:4,count:1},{family:'rig',tier:3,count:2}],[{family:'chart',tier:3,count:1},{family:'rig',tier:3,count:2}]]){
  const base=worth([a,b]),seen=new Set();
  for(let turn=0;turn<4;turn++){const n=goldShape([a,b],turn);seen.add(key(n));
   assert.ok(n.every(r=>r.tier>=1&&r.tier<=maxTier(r.family)-1),key(n));
   assert.ok(Math.abs(worth(n)-base)/base<=.2,`${key(n)} worth ${worth(n)} vs ${base}`);}
  assert.equal(seen.size,4,[...seen].join(' | '));
  assert.equal(key(goldShape([a,b],0)),key([a,b]),'turn 0 is the usual recipe');}
 // a shape that would leave the chain falls through to the next one
 const low=goldShape([{family:'rig',tier:2,count:1},{family:'rig',tier:1,count:2}],GOLD_TURN.indexOf(3));
 assert.ok(low.every(r=>r.tier>=1),key(low));
});

test('a new camp: the first gold order is unchanged, and no two gold orders in a row match through Chapter 1', ()=>{
 for(const seed of [1,2,3,4,5]){
  const s=fresh(seed);let now=1000,last=null,golds=0,same=0;const seen=new Set();
  for(let n=0;n<20000&&s.area<=GOLD_SHAPE_AREA;n++){
   tick(s,now);
   for(const o of s.orders)if(o?.story&&!seen.has(o.id)){seen.add(o.id);golds++;
    const st=TASKS[o.story].stages[(s.built[o.story]??0)];
    if(golds===1){assert.equal(key(o.needs),'1xrig3+2xrig2');assert.equal(o.coins,70);}
    assert.equal(o.coins,goldPrice(s,o.needs,st),'Gold cash follows the restoration cost, not the ingredients');
    // stages with their own recipe or a rare part are not shaped
    if(!st.gold&&!st.rare&&last&&key(o.needs)===last)same++;
    last=st.gold||st.rare?null:key(o.needs);}
   const a=nextAction(s);if(!a){now+=30000;continue;}
   const r=act(s,a,now);now+=r.ok?4000:30000;}
  assert.ok(golds>=20,`seed ${seed}: ${golds} gold orders`);
  assert.equal(same,0,`seed ${seed}: two gold orders in a row matched`);
 }
});

test('the turn comes from the materials already in the save: a reload keeps the issued gold order and the turn', ()=>{
 const s=fresh(1);let now=1000;
 for(let n=0;n<4000&&goldsDelivered(s)<3;n++){tick(s,now);const a=nextAction(s);if(!a){now+=30000;continue;}act(s,a,now);now+=4000;}
 const gold=s.orders.find(o=>o?.story),t=load(JSON.stringify(s),now);
 assert.equal(goldsDelivered(t),goldsDelivered(s));
 if(gold)assert.deepEqual(t.orders.find(o=>o?.story),gold,'the issued gold order is kept as it was');
 assert.equal(GOLD_SHAPE_AREA,2,'only Chapter 1 (the beach, the worksite, the Vault Entrance) is shaped');
});
