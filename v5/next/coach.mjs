// Coast Camp's first-player guide (build 51c, docs/V5_FIRST_PLAYER_GUIDE_2026-11-02.md): the first complete
// loop (tap, merge, a crew order's coins, the gold order's materials, the first restoration on the coast
// screen, the next objective) as one short sentence and one highlighted target at a time. Pure: the step
// is worked out from the camp itself every time, so a step the player has already done is skipped and a
// reload resumes where the camp is. Its only memory is two seen flags (s.seen, an existing save field):
// COACH_ON (this camp started the guide) and COACH_DONE (finished or skipped). A camp saved before the
// guide existed that has played at all (moves, a stage built) never gets it.
// It never asks for something the board cannot give: the board targets come from guide.mjs's
// primaryAction (a pair only if one is there, the generator only with energy and a free space; else
// what to do about energy or space, with no target).
import {primaryAction} from './guide.mjs';
import {orderItems,totalBuilt,generatorsMerge,SOURCES,upgrades,SECONDARY_OF,stageOf} from './game.mjs';
import {TASKS,AREAS,STAGES} from './areas.mjs';
import {CHAINS} from './chains.mjs';

export const COACH_ON='coach-on',COACH_DONE='coach-done';
export const FIRST_PLACE='beach-path';
export const coachActive=s=>!s.seen?.[COACH_DONE]&&(!!s.seen?.[COACH_ON]||(s.moves===0&&totalBuilt(s)===0));

// The step for the camp as it is: {id, text, target} or null once the guide is over.
// target: {kind:'cell', index} | {kind:'pair', cells} | {kind:'order', id} | {kind:'strip'} | null
export function coachStep(s){
 if(!coachActive(s))return null;
 const path=TASKS[FIRST_PLACE],built=stageOf(s,FIRST_PLACE);
 // 6. the first restoration is done: the result and the next objective, until the next delivery
 if(built>=1){const next=path.stages[built]??null;
  return {id:'result',text:next?`The path is clear. Next: ${next.name}: its gold order brings the materials and coins, crew orders add more coins.`:'The path is clear.',target:{kind:'strip'}};}
 const gold=s.orders.find(o=>o?.story===FIRST_PLACE),secured=(s.materials[FIRST_PLACE]??0)>=1,cost=path.stages[0].cost;
 // 5. materials secured: build it on the coast screen (coins in hand), else crew orders for the rest
 if(secured){
  if(s.coins>=cost)return {id:'build',text:`Materials secured. Open the coast and build: ${path.stages[0].name}.`,target:{kind:'strip'}};
  return board(s,`Materials secured. Deliver crew orders for the ${cost-s.coins} more coins.`,{crewOnly:true});}
 // 4. the gold order (it comes after the first crew order): deliver it when ready, else make its parts
 if(gold){if(orderItems(s,gold))return {id:'gold',text:'Tap the gold order: it pays coins and secures the path\'s materials.',target:{kind:'order',id:gold.id}};
  return board(s,'Make the gold order\'s parts: it pays coins and brings the path\'s materials.',{only:[gold.id]});}
 // 3. the first crew order: deliver it for coins
 const ready=s.orders.find(o=>o&&!o.story&&orderItems(s,o));
 if(ready)return {id:'deliver',text:`${name(ready.who)}'s order is ready: tap it to deliver for coins.`,target:{kind:'order',id:ready.id}};
 // 1-2. tap and merge toward the first crew order
 const first=s.orders.find(o=>o&&!o.story);
 return board(s,null,first?{only:[first.id]}:{});
}
const name=w=>({ivo:'Ivo',neri:'Neri',bram:'Bram',tamsin:'Tamsin'})[w]??'The crew';
// The board step: tap the generator or merge a pair (only when there is one), with the step's own words.
// only: the orders the step is about (the first crew order, then the gold order); the others are left to
// the player, so the guide does not wander between orders (the board is the same, only the advice).
function board(s,why,{only=null,crewOnly=false}={}){
 const view=only?{...s,orders:s.orders.filter(o=>o&&only.includes(o.id))}:s,g=primaryAction(view,only?.[0]??null);
 if(g.kind==='deliver'){const o=s.orders.find(o=>o.id===g.id);
  if(o&&!o.story)return {id:'deliver',text:`${name(o.who)}'s order is ready: tap it to deliver for coins.`,target:{kind:'order',id:o.id}};}
 if(g.kind==='tap')return {id:'tap',text:s.taps?.[g.id]?why??`Tap the ${SOURCES[g.id].name} for another part.`:`Tap the ${SOURCES[g.id].name} for a part.`,target:{kind:'cell',index:g.index}};
 if(g.kind==='merge')return {id:'merge',text:!s.merges?'Drag one part onto its twin to merge them.':why??'Merge twins up to the part the order shows.',target:{kind:'pair',cells:g.cells}};
 if(g.kind==='unseal')return {id:'unseal',text:g.label+'.',target:{kind:'pair',cells:g.cells}};
 // energy, space or anything else: say it, point at nothing
 return {id:'wait',text:crewOnly&&g.kind==='upgrade'?why:g.label+(g.label.endsWith('.')?'':'.'),target:null};
}

// Later mechanics, once each and only when they apply (seen flags 'tip-…'). The board tip for merging
// two generators replaces the hint while a matching copy is on the board; the others are one-time notes.
export function generatorPair(s){
 const gens=s.board.flatMap((x,i)=>x?.type==='source'?[i]:[]);
 for(const i of gens)for(const j of gens)if(i<j&&generatorsMerge(s.board[i],s.board[j]))return [j,i];
 return null;
}
export function laterTip(s){
 if(coachActive(s))return null;
 const p=!s.seen?.['tip-genmerge']&&generatorPair(s);
 if(p){const g=SOURCES[s.board[p[0]].id].name;return {id:'tip-genmerge',text:`Two ${g}s: drag one onto the other for a stronger ${g}.`,target:{kind:'pair',cells:p}};}
 return null;
}
// Where a rare chain's merged parts are wanted next: the first unbuilt stage (current area first) whose
// gold recipe or rare part names that chain at a merged tier, or null (then nothing is promised).
export function nextRareUse(s,family){
 for(const a of AREAS.slice(s.area))for(const t of a.tasks)for(let k=stageOf(s,t.id);k<STAGES;k++){const st=t.stages[k];
  const wants=st.rare?.[0]===family||st.gold?.some(([f])=>f===family);if(wants)return {id:t.id,stage:k+1,name:st.name,area:a.name};}
 return null;
}
export const RARE_FAMILIES=Object.values(SECONDARY_OF);
export const isRare=f=>!!CHAINS[f]?.secondary;
export {upgrades};
