const ROOT=process.env.ROOT??'/home/user/vaultwake';
const g=await import(ROOT+'/v5/next/game.mjs'),{nextAction}=await import(ROOT+'/tests/v5-next-policy.mjs'),{primaryAction}=await import(ROOT+'/v5/next/guide.mjs'),{simulate}=await import(ROOT+'/tests/v5-next-economy-sim.mjs');
const {makeGoldFirst}=await import('/home/user/vaultwake/tests/v5-next-goldfirst-policy.mjs');
const GF=process.env.POLICY==='goldfirst',pol=GF?makeGoldFirst(g,primaryAction,nextAction,{opportunist:true}):nextAction;
const W=[],MIN=60000;
for(const sp of [4,5,8])for(let seed=1;seed<=12;seed++){const born={};
 const proxy={...g,act(s,a,t){const o=a.type==='deliver'?s.orders.find(x=>x?.id===a.id):null,r=g.act(s,a,t);if(r.ok&&o?.story&&o.needs.some(n=>g.isSecondary(n.family)))W.push({w:(t-born[o.id])/MIN/sp,id:o.story+'#'+(g.stageOf(s,o.story)+1),need:o.needs.map(n=>n.family+n.tier+'x'+n.count).join('+'),sp,seed});return r;}};
 simulate(proxy,pol,sp,seed,{until:24*3600e3,shop:!GF,finish:GF?s=>s.area>=3:s=>g.allDone(s),onStep:(s,t)=>{for(const o of s.orders)if(o)born[o.id]??=t;}});}
W.sort((a,b)=>b.w-a.w);console.log(W.slice(0,12).map(x=>x.w.toFixed(2)+' '+x.id+' '+x.need+' sp'+x.sp+' s'+x.seed).join('\n'));
const by={};for(const x of W)(by[x.id]??=[]).push(x.w);
console.log('-- worst stages by mean');console.log(Object.entries(by).map(([k,v])=>[k,(v.reduce((a,b)=>a+b,0)/v.length).toFixed(2),Math.max(...v).toFixed(2),v.length]).sort((a,b)=>b[1]-a[1]).slice(0,8).map(x=>x.join(' ')).join('\n'));
