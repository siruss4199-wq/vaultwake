const ROOT=process.env.ROOT??'/home/user/vaultwake';
const g=await import(ROOT+'/v5/next/game.mjs'),{nextAction}=await import(ROOT+'/tests/v5-next-policy.mjs'),{primaryAction}=await import(ROOT+'/v5/next/guide.mjs'),{simulate}=await import(ROOT+'/tests/v5-next-economy-sim.mjs');
const {makeGoldFirst}=await import('/home/user/vaultwake/tests/v5-next-goldfirst-policy.mjs');
const pol=makeGoldFirst(g,primaryAction,nextAction,{opportunist:true});
const reps={};let made=0,rep=0;const byArea={};
for(const seed of [1,2,3]){const seen=new Set(),recent=[];
 simulate(g,pol,5,seed,{until:24*3600e3,finish:s=>s.area>=3,onStep:s=>{for(const o of s.orders){if(!o||seen.has(o.id))continue;seen.add(o.id);if(o.story)continue;const key=o.needs.map(n=>n.family+n.tier+'x'+n.count).sort().join('+');made++;const a='a'+s.area+'b'+Math.min(9,g.totalBuilt(s));
  if(recent.slice(-4).includes(key)){rep++;reps[key]=(reps[key]??0)+1;byArea[a]=(byArea[a]??0)+1;}recent.push(key);}}});}
console.log('made',made,'repeats',rep,(100*rep/made).toFixed(1)+'%');console.log(Object.entries(reps).sort((a,b)=>b[1]-a[1]).slice(0,10));console.log(byArea);
