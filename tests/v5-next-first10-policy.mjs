// The "guide" player of the first-10-minutes measurements (retention task, 2026-11-14;
// docs/V5_FIRST_10_MINUTES_2026-11-14.md): a new player who does what the game's own guide line / Hint names
// (v5/next/tutor.mjs tutorStep), merges generator copies at once (each stage's story line says "Merge it with
// yours") and, with two free spaces or fewer, tidies first (the scripted player's merge, crate or cargo move; the
// book is left for later). Falls back to the scripted player (tests/v5-next-policy.mjs). Pass the modules so an
// older tree can be measured the same way.
export function makeGuidePlayer(g,tutorStep,nextAction){
 const free=s=>s.board.filter(x=>x===null).length,TIDY=new Set(['merge','openKit','unseal']);
 const genPair=s=>{const b=s.board,gs=b.flatMap((x,i)=>x?.type==='source'?[i]:[]);for(const i of gs)for(const j of gs)if(i<j&&g.generatorsMerge(b[i],b[j]))return {type:'merge',from:j,to:i};return null;};
 return s=>{const p=genPair(s);if(p)return p;const a=tutorStep(s,{now:0})?.action;
  if(a?.type==='produce'&&free(s)<=2){const n=nextAction({...s,book:{claimed:[...new Set([...s.book.claimed,...s.found])],pages:[...g.BOOK_CHAINS]}});if(n&&TIDY.has(n.type))return n;}
  return a??nextAction(s);};
}
