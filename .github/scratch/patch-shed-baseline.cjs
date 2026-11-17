// Diagnostic only: over a real network the board's pictures may still be painting when the Shed test takes its pixel
// baseline (0.00% coral on the remote preview vs about 1.2% locally). Take the baseline once the images are loaded and
// two coral readings agree. Patches the checked-out copy of the test in the runner; the PR's own file is unchanged.
const fs=require('fs');const p='tests/v5-next-shed-overlay-browser.cjs';let s=fs.readFileSync(p,'utf8');
const old='const base=new Set((await scan()).overlays),coral0=await coral();';if(!s.includes(old))throw new Error('anchor not found');
s=s.replace(old,"await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0||i.loading==='lazy'),null,{timeout:30000});"
 +"{let c0=-1;for(let k=0;k<20;k++){const c=await coral();if(c!==null&&c>0&&Math.abs(c-c0)<0.02)break;c0=c;await delay(700);}console.log('baseline coral settled',c0);}"+old);
fs.writeFileSync(p,s);console.log('patched');
