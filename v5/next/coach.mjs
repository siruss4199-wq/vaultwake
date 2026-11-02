// Coast Camp's first-player guide (build 51c, docs/V5_FIRST_PLAYER_GUIDE_2026-11-02.md): a short, one-time
// introduction to the basic controls (tap, merge, a crew order's coins, the gold order's materials, the
// first restoration on the coast screen), ending with that restoration. Pure: the step
// is worked out from the camp itself every time, so a step the player has already done is skipped and a
// reload resumes where the camp is. Its only memory is two seen flags (s.seen, an existing save field):
// COACH_ON (this camp started the guide) and COACH_DONE (finished or skipped). A camp saved before the
// guide existed that has played at all (moves, a stage built) never gets it, nor does any camp after its
// first restoration.
// It never asks for something the board cannot give: the board targets come from guide.mjs's
// primaryAction (a pair only if one is there, the generator only with energy and a free space; else
// what to do about energy or space, with no target).
import {primaryAction} from './guide.mjs';
import {orderItems,totalBuilt,generatorsMerge,SOURCES,upgrades,SECONDARY_OF,stageOf} from './game.mjs';
import {TASKS,AREAS,STAGES} from './areas.mjs';
import {CHAINS} from './chains.mjs';

export const COACH_ON='coach-on',COACH_DONE='coach-done';
export const FIRST_PLACE='beach-path';
// Active for a new camp until its first restoration (or Skip): any stage built ends it for good, so later
// orders never restart it.
export const coachActive=s=>!s.seen?.[COACH_DONE]&&totalBuilt(s)===0&&(!!s.seen?.[COACH_ON]||s.moves===0);

// A one-time introduction, not an order-solving assistant: each action is highlighted only until the
// player has done it once (tap, merge, deliver a crew order, deliver the gold order, build). Between
// those, the line is a short goal with no highlight (the order cards show the progress as usual).
// The step for the camp as it is: {id, text, target} or null once the guide is over.
// id: tap | merge | deliver | gold | build (each highlighted) · goal | wait (no target)
// target: {kind:'cell', index} | {kind:'pair', cells} | {kind:'order', id} | {kind:'strip'} | null
// advice (goal only): what the board advice would do next; it is never highlighted (tests use it).
export function coachStep(s){
 if(!coachActive(s))return null;
 const path=TASKS[FIRST_PLACE],cost=path.stages[0].cost;
 const gold=s.orders.find(o=>o?.story===FIRST_PLACE),secured=(s.materials[FIRST_PLACE]??0)>=1;
 // materials secured: build it on the coast screen (coins in hand), else crew orders for the rest
 if(secured){
  if(s.coins>=cost)return {id:'build',text:`Materials secured. Open the coast and build: ${path.stages[0].name}.`,target:{kind:'strip'}};
  return board(s,`Materials secured. Deliver crew orders for the ${cost-s.coins} more coins.`);}
 // the gold order (it comes after the first crew order): deliver it when ready, else make its parts
 if(gold){if(orderItems(s,gold))return {id:'gold',text:'Tap the gold order: it pays coins and secures the path\'s materials.',target:{kind:'order',id:gold.id}};
  return board(s,'Goal: the gold order. Make its parts for the path\'s materials and coins.',[gold.id]);}
 // the first crew order: make its parts, then deliver it
 const first=s.orders.find(o=>o&&!o.story);
 return board(s,first?`Goal: ${name(first.who)}'s order. Tap and merge to make the parts it shows.`:'Goal: the crew\'s orders.',first?[first.id]:null);
}
const name=w=>({ivo:'Ivo',neri:'Neri',bram:'Bram',tamsin:'Tamsin'})[w]??'The crew';
// The board step: the advice (tap, merge, deliver) is highlighted only while that action is new to the
// player; otherwise the goal line, without a target. Energy or space: what to do, no target.
// only: the orders the step is about (the first crew order, then the gold order).
function board(s,goal,only=null){
 const view=only?{...s,orders:s.orders.filter(o=>o&&only.includes(o.id))}:s,g=primaryAction(view,only?.[0]??null);
 const tapped=Object.values(s.taps??{}).some(n=>n>0),merged=(s.merges??0)>0,delivered=(s.ordersDone??0)>0;
 if(g.kind==='tap'&&!tapped)return {id:'tap',text:`Tap the ${SOURCES[g.id].name} for a part.`,target:{kind:'cell',index:g.index}};
 if((g.kind==='merge'||g.kind==='unseal')&&!merged)return {id:'merge',text:'Drag one part onto its twin to merge them.',target:{kind:'pair',cells:g.cells}};
 if(g.kind==='deliver'&&!delivered){const o=s.orders.find(o=>o.id===g.id);
  if(o&&!o.story)return {id:'deliver',text:`${name(o.who)}'s order is ready: tap it to deliver for coins.`,target:{kind:'order',id:o.id}};}
 if(['tap','merge','unseal','deliver','upgrade'].includes(g.kind))return {id:'goal',text:goal,target:null,advice:g};
 // energy, space or anything else: say it, point at nothing
 return {id:'wait',text:g.label+(g.label.endsWith('.')?'':'.'),target:null};
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
