const ROOT=process.env.ROOT??'/home/user/vaultwake';
const g=await import(ROOT+'/v5/next/game.mjs'),{nextAction}=await import(ROOT+'/tests/v5-next-policy.mjs'),{simulate}=await import(ROOT+'/tests/v5-next-economy-sim.mjs');
const out=[];for(const sp of [4,5,6])for(let seed=1;seed<=12;seed++){const c={L1:0,L2:0,L3:0},gd={L2:0,L3:0},seen=new Set();
 const m=simulate(g,nextAction,sp,seed,{until:24*3600e3,shop:true,finish:s=>g.allDone(s),onStep:s=>{for(const o of s.orders){if(!o||seen.has(o.id))continue;seen.add(o.id);for(const n of o.needs)if(g.isSecondary(n.family)){const lv='L'+g.displayLevel(n.tier);(o.story?gd:c)[lv]=((o.story?gd:c)[lv]??0)+1;}}}});
 out.push({sp,seed,total:Math.round(m.total/60000),finished:m.finished,crew:c,gold:gd,starve:Math.round(m.starve.reduce((a,b)=>a+b,0)/60000)});}
console.log(JSON.stringify(out));
