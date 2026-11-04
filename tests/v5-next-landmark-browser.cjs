// Release regression: the Chapter 1 Vault stays visible as the beach is restored.
// Also check that opening a late chapter scrolls its current journey label into view.
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const {throughHome}=require('./v5-next-home-helper.cjs');
const KEY='vaultwake-v5-coast',URL='http://127.0.0.1:8080/v5/play.html';
(async()=>{
 const {AREAS}=await import('../v5/next/areas.mjs');
 for(const name of (process.env.ENGINES||'chromium,webkit').split(',')){
  const browser=await {chromium,webkit}[name].launch(); // Missing engines fail release QA.
  try{for(const width of [360,390,430]){
   const context=await browser.newContext({viewport:{width,height:844},hasTouch:true,reducedMotion:'reduce'});
   const page=throughHome(await context.newPage()),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   const beats=async()=>{for(let i=0;i<30&&await page.locator('#beat[open]').count();i++)await page.locator('#beatNext').click();};
   await page.goto(URL+'?new=1');await beats();
   // At 21 stages the game advances to Survey; 20 is the last playable beach map.
   for(const stages of [0,10,20]){
    const built=Object.fromEntries(AREAS[0].tasks.map((task,i)=>[task.id,Math.max(0,Math.min(3,stages-i*3))]).filter(([,stage])=>stage>0));
    await page.evaluate(([key,built])=>{const s=JSON.parse(localStorage.getItem(key));s.built=built;s.materials={...built};localStorage.setItem(key,JSON.stringify(s));},[KEY,built]);
    await page.reload();await beats();await page.locator('#mapButton').click();
    const vault=page.locator('#coastMap .mapVault');await vault.waitFor({state:'visible'});
    await vault.locator('img').evaluate(img=>img.decode());
    const geometry=await vault.evaluate(e=>{
     const r=e.getBoundingClientRect(),s=e.closest('.beachScene').getBoundingClientRect();
     return {w:r.width,h:r.height,ratio:r.width/s.width,inside:r.left>=s.left&&r.right<=s.right+1&&r.top>=s.top&&r.bottom<=s.bottom,
      pointer:getComputedStyle(e).pointerEvents,animation:getComputedStyle(e.querySelector('i')).animationName,
      shadow:getComputedStyle(e).filter,mask:getComputedStyle(e.querySelector('img')).maskImage,
      hidden:e.getAttribute('aria-hidden'),loaded:e.querySelector('img').naturalWidth>0,
      overflow:document.documentElement.scrollWidth>innerWidth+1};
    });
    assert.ok(geometry.w>=35&&geometry.h>=35,JSON.stringify({name,width,stages,geometry}));
    assert.equal(geometry.inside,true);assert.equal(geometry.loaded,true);
    assert.ok(geometry.ratio<=.13,'Vault remains a small background landmark: '+JSON.stringify(geometry));
    assert.ok(geometry.mask!=='none','Vault art edges blend into cliff');
    assert.equal(geometry.pointer,'none','decorative Vault cannot block building controls');
    assert.equal(geometry.hidden,'true');assert.equal(geometry.animation,'none');assert.equal(geometry.overflow,false);
    assert.equal(await page.locator('#coastMap .beachScene').getAttribute('data-built'),String(stages));
    await page.locator('#coastMap .close').click();
   }
   // A retained Chapter 6 camp: all prior areas complete, current station not restored.
   const built=Object.fromEntries(AREAS.slice(0,7).flatMap(a=>a.tasks.map(t=>[t.id,3])));
   await page.evaluate(([key,built])=>{const s=JSON.parse(localStorage.getItem(key));s.built=built;s.materials={...built};s.area=7;localStorage.setItem(key,JSON.stringify(s));},[KEY,built]);
   await page.reload();await beats();await page.locator('#mapButton').click();
   const current=page.locator('#coastMap .journey [aria-current="step"]');
   assert.equal(await current.locator('span').innerText(),'STATION');
   const position=await current.evaluate(e=>{const r=e.getBoundingClientRect(),p=e.parentElement.getBoundingClientRect();return {left:r.left,right:r.right,stripLeft:p.left,stripRight:p.right,scroll:e.parentElement.scrollLeft};});
   assert.ok(position.left>=position.stripLeft-1&&position.right<=position.stripRight+1,'late current chapter is visible on opening: '+JSON.stringify(position));
   assert.equal(await page.locator('#coastMap .mapVault').count(),0,'beach artwork is not added to another chapter');
   assert.deepEqual(errors,[]);await context.close();
   console.log(`${name} ${width}: Vault at 0/10/20 stages, reduced motion, late chapter centering: ok`);
  }}finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
