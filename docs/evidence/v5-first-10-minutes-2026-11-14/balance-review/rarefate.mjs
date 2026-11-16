const ROOT=process.env.ROOT??'/home/user/vaultwake';
const g=await import(ROOT+'/v5/next/game.mjs'),{nextAction}=await import(ROOT+'/tests/v5-next-policy.mjs'),{simulate}=await import(ROOT+'/tests/v5-next-economy-sim.mjs');
const T={};const add=(k,f)=>{T[k]??={asked:0,done:0,gone:0};T[k][f]++;};let runs=0;
for(const sp of [4,5,8])for(let seed=1;seed<=6;seed++){runs++;const lvl={},live=new Set(),done=new Set();
 const proxy={...g,act(s,a,t){const o=a.type==='deliver'?s.orders.find(x=>x?.id===a.id):null,r=g.act(s,a,t);if(r.ok&&o&&lvl[o.id]){add(lvl[o.id],'done');done.add(o.id);}return r;}};
 simulate(proxy,nextAction,sp,seed,{until:24*3600e3,shop:true,finish:s=>g.allDone(s),onStep:s=>{const ids=new Set(s.orders.filter(Boolean).map(o=>o.id));
  for(const o of s.orders){if(!o||lvl[o.id]!==undefined)continue;const r=o.story?null:o.needs.find(n=>g.isSecondary(n.family));lvl[o.id]=r&&r.tier>=1?'L'+(r.tier+1):null;if(lvl[o.id]){add(lvl[o.id],'asked');live.add(o.id);}}
  for(const id of [...live])if(!ids.has(id)){live.delete(id);if(!done.has(id))add(lvl[id],'gone');}}});}
for(const k of Object.keys(T).sort())console.log(k,'per game: asked',(T[k].asked/runs).toFixed(1),'delivered',(T[k].done/runs).toFixed(1),'replaced',(T[k].gone/runs).toFixed(1));
