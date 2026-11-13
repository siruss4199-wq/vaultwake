// Adaptive guided tutorial 2.0 (First Session 2.0, 2026-11-13; approved prototype b7f4220,
// docs/V5_TUTORIAL_2_PROTOTYPE_2026-11-13.md). Pure: it reads the camp and the game's own rules (act(),
// guide.mjs primaryAction, needs.mjs, coach.mjs) and changes nothing; the app draws what it returns.
//
// tutorStep(s, ctx) → the ONE next useful action for the camp as it is:
//   {id, kind, what, why, target, action, skill, focus}
//   kind:   tap | merge | unseal | deliver | gold | build | coastBuild | close | space | energy | locked | wait
//   target: {kind:'cell', index} | {kind:'pair', cells:[from,to]} | {kind:'order', id} | {kind:'strip'}
//           | {kind:'restore', id} (the coast screen's Build) | {kind:'back'} (its ×) | null (a blocker)
//   action: the act() action the target stands for (null for blockers and screen buttons)
// Every target with an action is DRY-RUN through act() on a copy of the camp first: a step the reducer would
// refuse is never returned, so the guide never points at a blocked, buried or invalid thing.
//
// guideLevel(s, step) → 'full' (text + why + highlight + hand) | 'light' (text + why + highlight) | 'quiet'
// (a short line only). It drops as the player shows each skill, measured from fields the save already has
// (s.taps, s.merges, s.ordersDone, s.materials, s.built): no new save data, and a reload resumes at the same
// level. The Hint button and the 8 s idle reminder raise ONE step to 'full' (the app keeps that, per session).
import {act,orderItems,nextTask,sourceOpen,SOURCES,totalBuilt,stageOf} from './game.mjs';
import {primaryAction} from './guide.mjs';
import {missingOf} from './needs.mjs';
import {coachActive} from './coach.mjs';
import {CHAINS} from './chains.mjs';
import {TASKS} from './areas.mjs';
import {refillTimes,REFILL_EVERY} from './energy.mjs';

const WHO={ivo:'Ivo',bram:'Bram',neri:'Neri',tamsin:'Tamsin'};
export const who=o=>o?.story?'the gold order':WHO[o?.who]??'the crew';
const nm=(f,t)=>CHAINS[f].names[t];
const partName=x=>x?.type==='item'?nm(x.family,x.tier):x?.type==='kit'?'crate':'part';
// Would the reducer accept this action now? (on a copy: the camp itself is never touched)
export function valid(s,a,now=Date.now()){try{return !!act(structuredClone(s),a,now).ok;}catch{return false;}}

// The order the player is working on: the first crew order until one is delivered (what the game's guide
// does), then the gold order; with the materials in but coins short, the crew order closest to done.
export function focusOrder(s){
 const live=s.orders.filter(Boolean),gold=live.find(o=>o.story),crew=live.filter(o=>!o.story);
 const up=nextTask(s);
 if(up&&s.coins<up.cost)return crew.sort((a,b)=>missingOf(s,a).length-missingOf(s,b).length)[0]??gold??null;
 if((s.ordersDone??0)===0&&crew[0])return crew[0];
 return gold??crew[0]??null;
}
// The missing parts of an order that the board can make now (their generator is on the board).
const makeable=(s,o)=>missingOf(s,o).filter(r=>sourceOpen(s,CHAINS[r.family].gen));
const needText=(s,o)=>{const m=missingOf(s,o)[0];return m?`${o.story?'the gold order':who(o)}'s ${nm(m.family,m.tier)}`:`${o.story?'the gold order':who(o)+"'s order"}`;};

export function tutorStep(s,ctx={}){
 const now=ctx.now??Date.now(),coast=ctx.coast??null;
 // --- the coast panel (player-opened) ---
 if(coast==='open'){
  const up=nextTask(s),a=up&&{type:'restore',id:up.id};
  if(a&&valid(s,a,now))return step('coastBuild','coastBuild',`Tap Build`,`${up.name}: ${up.cost} coins, the place changes.`,{kind:'restore',id:up.id},a,'build');
  return step('close','wait',`Back to the board`,up?`${up.name} needs ${up.cost} coins. Deliver crew orders for coins.`:'Deliver the gold order for the next materials.',{kind:'back'},null,null);
 }
 // --- materials in and coins enough: the coast strip ---
 const up=nextTask(s);
 if(up&&valid(s,{type:'restore',id:up.id},now))
  return step('build','build',`Tap the coast strip`,`${up.name}: ${up.cost} coins.`,{kind:'strip'},{type:'restore',id:up.id},'build');
 const focus=focusOrder(s);
 // --- a ready order: the focus order first, else another ready one, but only if delivering it takes no
 // part the focus order still counts on (the player may still deliver it: nothing is blocked) ---
 const spares=o=>{if(!focus||o===focus)return true;const c=structuredClone(s);if(!act(c,{type:'deliver',id:o.id},now).ok)return false;
  const have=x=>missingOf(x,focus).reduce((n,r)=>n+r.count-r.have,0);return have(c)<=have(s);};
 const ready=[focus,...s.orders.filter(o=>o&&o!==focus)].find(o=>o&&orderItems(s,o)&&valid(s,{type:'deliver',id:o.id},now)&&spares(o));
 if(ready){const g=!!ready.story,place=TASKS[ready.story]?.stages[stageOf(s,ready.story)]?.name;
  return step(g?'gold':'deliver',g?'gold':'deliver',g?'Tap the gold order':`Tap ${who(ready)}'s order`,
   g?`+${ready.coins} coins and materials: ${place??'the next place'}.`:`+${ready.coins} coins.`,{kind:'order',id:ready.id},{type:'deliver',id:ready.id},g?'gold':'deliver',ready);}
 if(!focus)return step('wait','wait','New orders are on the way','Merge parts while you wait.',null,null,null);
 // --- the focus order needs parts nobody can make yet: say so, and work on an order that can be done ---
 let o=focus,note='';
 if(missingOf(s,o).length&&!makeable(s,o).length){
  const alt=s.orders.find(q=>q&&q!==o&&makeable(s,q).length);
  const m=missingOf(s,o)[0],gen=SOURCES[CHAINS[m.family].gen]?.name??'its generator';
  if(!alt)return step('locked','locked',`${who(o)==='the gold order'?'The gold order':who(o)} needs a ${nm(m.family,m.tier)}`,`The ${gen} that makes it is not on your board yet.`,null,null,null,o);
  note=`(${who(o)} needs the ${gen}) `;o=alt;
 }
 const view={...s,orders:[o]},g=primaryAction(view,o.id),tag=needText(s,o);
 if(g.kind==='merge'){const [a,b]=g.cells,x=s.board[a],act1={type:'merge',from:a,to:b};
  if(valid(s,act1,now))return step('merge','merge',`Drag a ${partName(x)} onto its twin`,`${note}Two make a ${nm(x.family,Math.min(x.tier+1,CHAINS[x.family].names.length-1))}, for ${tag}.`,{kind:'pair',cells:[a,b]},act1,'merge',o);}
 if(g.kind==='unseal'){const [a,b]=g.cells,act1={type:'merge',from:a,to:b};
  if(valid(s,act1,now))return step('unseal','unseal',`Drop the ${partName(s.board[a])} on its crate`,`${note}Opens the crate: more room.`,{kind:'pair',cells:[a,b]},act1,'merge',o);}
 if(g.kind==='tap'){const act1={type:'produce',id:g.id,index:g.index};
  const r=missingOf(s,o).find(r=>CHAINS[r.family].gen===g.id);
  if(valid(s,act1,now))return step('tap','tap',`Tap the ${SOURCES[g.id].name}`,`${note}Makes a ${CHAINS[g.id].names[0]}${r?` for ${tag}`:''}.`,{kind:'cell',index:g.index},act1,'tap',o);}
 if(g.kind==='space'||!s.board.includes(null))
  return step('space','space','The board is full','Merge twins or deliver to free a space.',null,null,null,o);
 if(g.kind==='energy'||s.energy<1){const t=refillTimes(s,now),sec=t?Math.ceil(t.next/1000):null;
  return step('energy','energy','Out of energy',`+1 energy every ${Math.round(REFILL_EVERY/60000)} minutes${sec?` (next in ${sec>=60?Math.ceil(sec/60)+' min':sec+' s'})`:''}. Deliver orders for more.`,null,null,null,o);}
 return step('wait','wait',`Goal: ${tag}`,g.label??'Make the parts the order shows.',null,null,null,o);
}
function step(id,kind,what,why,target,action,skill,focus=null){return {id,kind,what,why,target,action,skill,focus:focus?.id??null};}
export const signature=st=>st?`${st.kind}:${JSON.stringify(st.target)}`:'';

// What the player has already shown they can do (all from existing save fields).
export function skills(s){
 const gold=Object.values(s.materials??{}).reduce((n,k)=>n+k,0);
 return {tap:Object.values(s.taps??{}).reduce((n,k)=>n+k,0),merge:s.merges??0,deliver:Math.max(0,(s.ordersDone??0)-gold),gold,build:totalBuilt(s)};
}
// full while a skill is new, light while it is still being learnt, then quiet
export const LEARN={tap:[1,3],merge:[1,3],deliver:[1,2],gold:[1,1],build:[1,1]};
export function guideLevel(s,st){
 if(!st)return 'quiet';
 // blockers always say why (light: no finger, nothing to point at)
 if(!st.target)return 'light';
 // the coast screen's Build and × are one-off screen steps: shown while the first restoration is new
 if(['coastBuild','close'].includes(st.kind))return totalBuilt(s)<=1?'full':'light';
 // after the guide's span (the first restoration and the next objective) only Hint and the idle reminder guide
 if(!tutorActive(s))return 'quiet';
 const n=skills(s)[st.skill]??0,[full,light]=LEARN[st.skill]??[1,2],lv=n<full?'full':n<light?'light':'quiet';
 // the next objective after the first build is always named once (light), even for a skilled player
 return lv==='quiet'&&!coachActive(s)?'light':lv;
}
// The guided span: the game's own coach span (until the first restoration) plus the next objective (until
// the next delivery after it), so the "what next" after the first build is shown too. The existing skip
// (seen['coach-done']) ends it at once, as in production.
// 'coach-next' (an existing save field, s.seen) marks a guide finished by its first restoration (the app sets it
// with coach-done); coach-done alone is Skip guide, which ends everything.
export const COACH_NEXT='coach-next';
export function tutorActive(s){
 if(coachActive(s))return true;
 if(s.seen?.['coach-done']&&!s.seen?.[COACH_NEXT])return false;
 return !!s.seen?.[COACH_NEXT]&&totalBuilt(s)===1&&stageOf(s,'beach-path')===1&&(s.ordersDone??0)<=2;
}
