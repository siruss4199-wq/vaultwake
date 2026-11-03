// A gold-first scripted player (Build 52A player feedback): it builds whenever it can, delivers the gold order
// as soon as it is ready and otherwise works only toward the gold order (taps and merges for its parts, from
// guide.mjs primaryAction aimed at that order). Crew orders are done only when necessary: a stage has its
// materials but not its coins, or the board is nearly full. Everything else falls back to the ordinary scripted
// player (tests/v5-next-policy.mjs) with its crew deliveries removed. It never buys from the shop (the harness
// decides that). Pass the game module's own functions so older builds can be measured the same way.
// opportunist: a crew order that happens to be ready (its parts already on the board) is delivered too, as a
// real player would tap a glowing card, unless it would take parts the gold order still needs; the player still
// never works toward one.
export function makeGoldFirst(g,primaryAction,nextAction,{opportunist=false}={}){
 // (a gold order appears once the first crew order is delivered, and again after each one delivered, if none is up)
 const ready=(s,id)=>{const o=s.orders.find(o=>o?.id===id);return o&&g.orderItems(s,o);};
 const act=x=>!x?null:x.kind==='tap'?{type:'produce',id:x.id,index:x.index}:x.kind==='merge'||x.kind==='unseal'?{type:'merge',from:x.cells[0],to:x.cells[1]}:x.kind==='deliver'?{type:'deliver',id:x.id}:x.kind==='upgrade'?{type:'restore',id:x.id}:null;
 return function goldFirst(s){
  const ups=g.upgrades(s),buildable=ups.find(u=>u.materials&&s.coins>=u.cost);
  if(buildable)return {type:'restore',id:buildable.id};
  // two identical generators are merged at once (the story line asks it: "Merge it with yours"), as a real
  // player does; it costs nothing and opens the rare chain at Level 2
  const gens=s.board.flatMap((x,i)=>x?.type==='source'?[i]:[]);
  for(const i of gens)for(const j of gens)if(i<j&&g.generatorsMerge(s.board[i],s.board[j]))return {type:'merge',from:j,to:i};
  const gold=s.orders.find(o=>o?.story);
  if(gold&&ready(s,gold.id))return {type:'deliver',id:gold.id};
  // (only when it leaves the parts the gold order still needs: those are set aside first, part by part)
  if(opportunist){const keep=new Set(),gold0=s.orders.find(o=>o?.story);
   if(gold0)for(const r of gold0.needs){let left=r.count;for(let i=0;i<s.board.length&&left;i++)if(!keep.has(i)&&g.matches(s.board[i],r)){keep.add(i);left--;}}
   const spare={...s,board:s.board.map((x,i)=>keep.has(i)?null:x)};
   const c=s.orders.find(o=>o&&!o.story&&g.orderItems(spare,o));if(c)return {type:'deliver',id:c.id};}
  const free=s.board.filter(x=>x===null).length,short=ups.some(u=>u.materials&&s.coins<u.cost);
  // necessary: no gold order up yet (crew deliveries bring it), coins short for a stage whose materials are in,
  // or the board nearly full
  if(!gold||short||free<=2)return nextAction(s);
  if(gold){const a=act(primaryAction({...s,orders:[gold]},gold.id));if(a&&!(a.type==='deliver'&&a.id!==gold.id))return a;}
  const a=nextAction(s);
  if(a?.type==='deliver'){const o=s.orders.find(o=>o?.id===a.id);if(o&&!o.story)return null;}
  return a;
 };
}
