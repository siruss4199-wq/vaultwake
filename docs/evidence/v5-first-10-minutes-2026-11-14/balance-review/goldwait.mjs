const ROOT=process.env.ROOT??'/home/user/vaultwake';
const g=await import(ROOT+'/v5/next/game.mjs'),{nextAction}=await import(ROOT+'/tests/v5-next-policy.mjs'),{primaryAction}=await import(ROOT+'/v5/next/guide.mjs'),{simulate}=await import(ROOT+'/tests/v5-next-economy-sim.mjs');
const {makeGoldFirst}=await import('/home/user/vaultwake/tests/v5-next-goldfirst-policy.mjs');
const GF=process.env.POLICY==='goldfirst',pol=GF?makeGoldFirst(g,primaryAction,nextAction,{opportunist:true}):nextAction;
const W=[],MIN=60000;
for(const sp of [4,5,8])for(let seed=1;seed<=12;seed++){const born={};
 const proxy={...g,act(s,a,t){const o=a.type==='deliver'?s.orders.find(x=>x?.id===a.id):null,r=g.act(s,a,t);if(r.ok&&o?.story&&o.needs.some(n=>g.isSecondary(n.family)))W.push((t-born[o.id])/MIN/sp);return r;}};
 simulate(proxy,pol,sp,seed,{until:24*3600e3,shop:!GF,finish:GF?s=>s.area>=3:s=>g.allDone(s),onStep:(s,t)=>{for(const o of s.orders)if(o)born[o.id]??=t;}});}
const q=p=>{const b=[...W].sort((x,y)=>x-y);return +b[Math.min(b.length-1,Math.floor(b.length*p))].toFixed(2);};
console.log('rare gold orders',W.length,'wait per s/action (min): median',q(.5),'p90',q(.9),'p99',q(.99),'max',q(1));
