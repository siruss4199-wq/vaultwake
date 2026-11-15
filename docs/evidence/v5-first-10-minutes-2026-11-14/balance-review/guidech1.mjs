const ROOT=process.env.ROOT??'/home/user/vaultwake';
const g=await import(ROOT+'/v5/next/game.mjs'),{nextAction}=await import(ROOT+'/tests/v5-next-policy.mjs'),{tutorStep}=await import(ROOT+'/v5/next/tutor.mjs'),{simulate}=await import(ROOT+'/tests/v5-next-economy-sim.mjs');
const {makeGuidePlayer}=await import('/home/user/vaultwake/tests/v5-next-first10-policy.mjs');
const pol=makeGuidePlayer(g,tutorStep,nextAction),MIN=60000,W=[],T=[];let made=0,rep=0,starve=0,L={L2:0,L3:0};
for(const sp of [4,5,8])for(const seed of [1,2,3,4]){const born={},seen=new Set(),recent=[];
 const proxy={...g,act(s,a,t){const o=a.type==='deliver'?s.orders.find(x=>x?.id===a.id):null,r=g.act(s,a,t);if(r.ok&&o?.story&&o.needs.some(n=>g.isSecondary(n.family)))W.push((t-born[o.id])/MIN/sp);return r;}};
 const m=simulate(proxy,pol,sp,seed,{until:24*3600e3,finish:s=>s.area>=3,onStep:(s,t)=>{for(const o of s.orders){if(!o)continue;born[o.id]??=t;if(seen.has(o.id))continue;seen.add(o.id);if(o.story)continue;
  const key=o.needs.map(n=>n.family+n.tier+'x'+n.count).sort().join('+');made++;if(recent.slice(-4).includes(key))rep++;recent.push(key);const r=o.needs.find(n=>g.isSecondary(n.family));if(r&&r.tier>=1)L['L'+(r.tier+1)]++;}}});
 T.push(m.total/MIN/sp);starve=Math.max(starve,m.starve.reduce((a,b)=>a+b,0)/MIN);}
const q=(a,p)=>{const b=[...a].sort((x,y)=>x-y);return +b[Math.min(b.length-1,Math.floor(b.length*p))].toFixed(2);};
console.log(JSON.stringify({ch1PerSpeedUnit:q(T,.5),repeatPct:+(100*rep/made).toFixed(1),rareCrewAsksPerRun:{L2:+(L.L2/T.length).toFixed(1),L3:+(L.L3/T.length).toFixed(1)},rareGold:{n:W.length,median:q(W,.5),p90:q(W,.9),max:q(W,1)},starveMax:+starve.toFixed(1)}));
