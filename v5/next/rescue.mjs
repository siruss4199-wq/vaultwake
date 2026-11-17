// Board Full Rescue (2026-11-17, docs/V5_BOARD_FULL_RESCUE_2026-11-17.md). When the board has no free space, ONE step
// toward freeing a space: the safest valid action the camp has now, in this order:
//   1. deliver an order that is ready (its parts leave the board);
//   2. merge two identical parts (two become one);
//   3. another space-freeing action: a part laid on the cargo it opens, two crates of a kind merged, two generators
//      of a kind and level merged, a Brass cog laid on a generator;
//   4. store a part, crate, cog or token in a free shed space (tap it, then Shed);
//   5. otherwise say why, and point at a part to Clear, with the game's two-tap confirmation, only when nothing else
//      frees a space: first a part no order wants, else the cheapest everyday part to make again; never a rare part.
// Pure: it reads the camp and the game's own rules and changes nothing. Every action it names is DRY-RUN through
// act() on a copy: it is returned only if the reducer accepts it AND it frees room (a free space, or a waiting reward
// that lands). A step that would undo progress toward an order (merging the two parts an order counts, laying a
// wanted part on cargo, shedding a wanted part while something else would do) is "unsafe" and only offered later.
// No new save data: the app shows it on a full board (once on its own, seen flag 'tip-shed'; any time from Hint).
//
// rescueStep(s, {selected, armed, now}) → a step in the tutor's shape {id, kind, what, why, target, action, skill,
// focus, rescue:true, via} or null when the board has a free space.
//   via: deliver | merge | unseal | crate | generator | cog | shed | clear | none
//   target: {kind:'order', id} | {kind:'pair', cells} | {kind:'cell', index} (select the part first) |
//           {kind:'action', action:'store'|'recycle', index} (the selected part's Shed / Clear button) | null
import {act,orderItems,nameOf,cargoKeys,matches,SOURCES,SHED_TYPES,generatorsMerge} from './game.mjs';
import {needsOf} from './needs.mjs';
import {CHAINS,maxTier} from './chains.mjs';
import {kitsMerge} from '../kits.mjs';

export const boardFull=s=>!s.board.includes(null);
const room=s=>s.board.filter(x=>x===null).length-(s.pending?.length??0);
// how much an order still lacks, over all orders (a lower number is closer to done)
const lack=s=>s.orders.filter(Boolean).reduce((n,o)=>n+needsOf(s,o).reduce((m,r)=>m+r.count-r.have,0),0);
// The action on a copy: null if the reducer refuses it; else how much room it makes and whether it costs order progress.
export function tryAction(s,a,now=Date.now()){
 const c=structuredClone(s);let r;try{r=act(c,a,now);}catch{return null;}
 if(!r?.ok)return null;return {freed:room(c)-room(s),safe:a.type==='deliver'||lack(c)<=lack(s),after:c,result:r};
}
const wanted=(s,x)=>x?.type==='item'&&s.orders.some(o=>o?.needs.some(r=>matches(x,r)));
const rare=x=>x?.type==='item'&&!!CHAINS[x.family]?.secondary;
const plural=n=>n===1?'a space':`${n} spaces`;
const step=(via,kind,what,why,target,action,extra={})=>({id:'rescue-'+via,kind,what,why,target,action,skill:null,focus:extra.focus??null,rescue:true,via,...extra});

export function rescueStep(s,{selected=null,armed=false,now=Date.now()}={}){
 if(!boardFull(s))return null;
 const B=s.board,idx=f=>B.flatMap((x,i)=>f(x,i)?[i]:[]);
 // 1. a ready order (the gold order first, then crew orders that leave the gold order's parts alone)
 const gold=s.orders.find(o=>o?.story),goldLack=o=>{if(!gold||o===gold)return 0;const c=structuredClone(s);act(c,{type:'deliver',id:o.id},now);return lack({...c,orders:[gold]})-lack({...s,orders:[gold]});};
 const ready=s.orders.filter(o=>o&&orderItems(s,o)).sort((a,b)=>(b.story?1:0)-(a.story?1:0)||goldLack(a)-goldLack(b));
 for(const o of ready){const t=tryAction(s,{type:'deliver',id:o.id},now);if(t&&t.freed>0)
  return step('deliver',o.story?'gold':'deliver','Tap Deliver',`Frees ${plural(t.freed)} · +${o.coins} coins`,{kind:'order',id:o.id},{type:'deliver',id:o.id},{focus:o.id});}
 // 2. two identical parts (a pair an order wants merged first), never two an order counts as they are
 const later=[];const pairs=[];
 const items=idx(x=>x?.type==='item'&&x.tier<maxTier(x.family));
 for(const i of items)for(const j of items)if(i<j&&B[i].family===B[j].family&&B[i].tier===B[j].tier)pairs.push([i,j]);
 const merges=pairs.map(([i,j])=>({cells:[i,j],t:tryAction(s,{type:'merge',from:i,to:j},now)})).filter(m=>m.t&&m.t.freed>0)
  .sort((a,b)=>lack(a.t.after)-lack(b.t.after));
 for(const m of merges){const x=B[m.cells[0]];
  const st=step('merge','merge',`Drag a ${nameOf(x)} onto its twin`,'Two make one: frees a space',{kind:'pair',cells:m.cells},{type:'merge',from:m.cells[0],to:m.cells[1]});
  if(m.t.safe)return st;later.push(st);}
 // 3. other actions that free a space
 const others=[];
 for(const k of cargoKeys(s)){const i=B.findIndex(x=>matches(x,k));if(i>=0)others.push([step('unseal','unseal',`Drop the ${nameOf(B[i])} on its cargo`,'Opens it: frees a space',{kind:'pair',cells:[i,k.index]},{type:'merge',from:i,to:k.index}),{type:'merge',from:i,to:k.index}]);}
 const kits=idx(x=>x?.type==='kit');for(const i of kits)for(const j of kits)if(i<j&&kitsMerge(B[i],B[j]))others.push([step('crate','merge','Drag a crate onto its twin','Two crates make a bigger one: frees a space',{kind:'pair',cells:[i,j]},{type:'merge',from:i,to:j}),{type:'merge',from:i,to:j}]);
 const gens=idx(x=>x?.type==='source');for(const i of gens)for(const j of gens)if(i<j&&generatorsMerge(B[i],B[j])){const g=SOURCES[B[i].id].name;
  others.push([step('generator','merge',`Drag a ${g} onto its twin`,'One stronger generator: frees a space',{kind:'pair',cells:[i,j]},{type:'merge',from:i,to:j}),{type:'merge',from:i,to:j}]);}
 for(const i of idx(x=>x?.type==='cog'))for(const j of gens){const g=SOURCES[B[j].id].name;
  others.push([step('cog','merge',`Drop the Brass cog on the ${g}`,'+1 level: frees a space',{kind:'pair',cells:[i,j]},{type:'merge',from:i,to:j}),{type:'merge',from:i,to:j}]);}
 for(const [st,a] of others){const t=tryAction(s,a,now);if(!t||t.freed<=0)continue;if(t.safe)return st;later.push(st);}
 // 4. the shed: a crate, a token or a cog first (no order counts them), then a part no order wants, then a wanted part
 // (shedding is undone with one tap, so even a wanted part is safer there than merged or cleared)
 if(s.shed?.includes(null)){
  const rank=x=>x.type==='kit'?0:x.type==='token'?1:x.type==='cog'?2:wanted(s,x)?4:3;
  const cand=idx(x=>SHED_TYPES.includes(x?.type)).sort((a,b)=>rank(B[a])-rank(B[b])||(B[b].tier??0)-(B[a].tier??0));
  for(const i of cand){const t=tryAction(s,{type:'store',index:i},now);if(!t||t.freed<=0)continue;const name=short(nameOf(B[i]));
   return selected===i
    ?step('shed','shed','Tap Shed',`Frees a space · take it back any time`,{kind:'action',action:'store',index:i},{type:'store',index:i})
    :step('shed','select',`Tap the ${name}`,'Then tap Shed to keep it for later',{kind:'cell',index:i},null,{next:{type:'store',index:i}});}
 }
 // 5. Clear, confirmed by the game's second tap: a part no order wants (lowest level first); then a step that costs
 // order progress (the player still chooses: nothing is forced); then, last, the cheapest everyday part. Never rare.
 const clear=i=>{const name=short(nameOf(B[i])),spare=!wanted(s,B[i]),full=s.shed?.includes(null)?'':'The shed is full. ';
  if(selected!==i)return step('clear','select',`Tap the ${name}`,`${full}${spare?'No order needs it':'The quickest part to make again'}: clear it`,{kind:'cell',index:i},null,{next:{type:'recycle',index:i}});
  return step('clear','clear',armed?'Tap Clear again':'Tap Clear',armed?'To confirm: it is gone for good':'Frees a space · tap twice to confirm',{kind:'action',action:'recycle',index:i},{type:'recycle',index:i});};
 const clearable=idx((x,i)=>x?.type==='item'&&!rare(x)&&(tryAction(s,{type:'recycle',index:i},now)?.freed??0)>0).sort((a,b)=>B[a].tier-B[b].tier);
 const spare=clearable.find(i=>!wanted(s,B[i]));if(spare!=null)return clear(spare);
 if(later.length)return later[0];
 if(clearable.length)return clear(clearable[0]);
 // 7. nothing frees a space now
 return step('none','space','The board is full',s.shed?.includes(null)?'Nothing on it can move: deliver an order when its parts are ready.':'The shed is full too: deliver an order when its parts are ready.',null,null);
}
// a part's name without its level tag, short enough for one line
const short=name=>name.replace(/\s*·.*$/,'');
