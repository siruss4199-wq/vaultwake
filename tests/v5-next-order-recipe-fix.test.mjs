// Order design gate: Gold materials are a crafting challenge, not a coin shortcut.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../v5/next/game.mjs';
import {TASKS,AREAS} from '../v5/next/areas.mjs';

test('gold coins follow restoration cost, not number or level of ingredients',()=>{
 const s=g.fresh(0);s.built={'beach-path':2};s.materials={...s.built};
 const target={cost:100},a=[{family:'rig',tier:1,count:1}],b=[{family:'rig',tier:5,count:2},{family:'mech',tier:2,count:1}];
 assert.equal(g.goldPrice(s,a,target),g.goldPrice(s,b,target));
 assert.equal(g.goldPrice(s,a,target),35,'stage three pays 35% of its cost');
 assert.equal(g.goldPrice(g.fresh(0),[{family:'rig',tier:3,count:1},{family:'rig',tier:2,count:2}],{cost:40}),70,'tutorial coins unchanged');
});

test('lanterns need ordinary parts PLUS one merged Gear before Survey Kite',()=>{
 const s=g.fresh(0);s.built={'beach-path':2};s.materials={...s.built};s.aim='beach-path';
 s.orders=[];s.board[g.ROVER].level=2;s.secOpen={rig:true};
 const o=g.makeOrder(s);
 assert.equal(o.story,'beach-path');
 assert.equal(o.needs.length,3,JSON.stringify(o.needs));
 assert.equal(o.needs.filter(n=>!g.isSecondary(n.family)).length,2);
 assert.deepEqual(o.needs.at(-1),{family:'mech',tier:1,count:1});
 assert.equal(o.coins,35,'stage 3 only pays part of its 100-coin cost');
 assert.ok(!s.board.some(x=>x?.type==='source'&&x.id==='chart'),'Kite not unlocked yet');
 const saved=g.fresh(0);saved.built={'beach-path':2};saved.materials={...saved.built};
 saved.board[g.ROVER].level=2;saved.secOpen={rig:true};saved.orders[0]=o;
 const resumed=g.load(JSON.stringify(saved),1000);
 assert.deepEqual(resumed.orders[0].needs,o.needs,'three-ingredient Gold order survives saving and loading');
 assert.equal(resumed.orders[0].coins,o.coins,'priced coins also survive');
 const fallback=structuredClone(s);fallback.board[g.ROVER].level=1;
 const old=g.makeOrder(fallback);
 assert.equal(old.story,'beach-path');
 assert.ok(!old.needs.some(n=>g.isSecondary(n.family)),'no rare part without an eligible generator');
});

test('Chapter 1 includes thirteen story repairs that request merged rare ingredients when unlocked',()=>{
 const ch=AREAS.slice(0,3).flatMap(a=>a.tasks.flatMap(t=>t.stages.flatMap((st,i)=>st.rare?[[t.id,i+1,...st.rare]]:[])));
 assert.equal(ch.length,13,JSON.stringify(ch));
 for(const [id,stage,f,tier] of ch)assert.ok(tier>=1&&g.isSecondary(f)&&TASKS[id].stages[stage-1].rare);
});

test('available rare items create a mixed crew recipe after the guide',()=>{
 const s=g.fresh(0);
 s.built={'beach-path':3,'beach-tent':1};s.materials={...s.built};
 s.orders=[{id:'gold',who:'ivo',story:'beach-path',needs:[{family:'rig',tier:2,count:1}],coins:10}];
 s.board[g.ROVER].level=2;s.secOpen={rig:true};s.secIntro=[];s.found.push('mech0');
 const empty=s.board.flatMap((x,i)=>x===null?[i]:[]);
 s.board[empty[0]]=g.item('mech',0);s.board[empty[1]]=g.item('mech',0);
 s.orderSeq=12;
 let mixed=null;
 for(let i=0;i<36;i++){
  const o=g.makeOrder(s);
  if(!o.story&&o.needs.some(n=>g.isSecondary(n.family))&&o.needs.some(n=>!g.isSecondary(n.family))){mixed=o;break;}
 }
 assert.ok(mixed,'expected a normal + merged rare crew recipe');
 assert.equal(mixed.role,'pair');
 assert.deepEqual(mixed.needs.find(n=>g.isSecondary(n.family)),{family:'mech',tier:1,count:1});
});

test('a previously saved Gold order remains unchanged when loaded',()=>{
 const s=g.fresh(0);
 const legacy={id:'legacy',who:'ivo',story:'beach-path',needs:[{family:'rig',tier:3,count:1},{family:'rig',tier:2,count:2}],coins:40};
 s.orders[0]=legacy;
 const loaded=g.load(JSON.stringify(s),1000);
 assert.deepEqual(loaded.orders.find(o=>o?.id==='legacy'),legacy);
});
