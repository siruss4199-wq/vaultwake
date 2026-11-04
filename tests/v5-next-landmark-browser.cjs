// Release regression: the Chapter 1 Vault entrance, painted into the Landing Beach map's upper-right cliff
// (landing-map-vault.webp, tools/paint-landing-vault.py), stays in view as the beach is restored: no overlay, the map
// itself shows the dark arched recess there, and no place marker or restored place covers it.
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
    assert.equal(await page.locator('#coastMap .mapVault').count(),0,'no pasted overlay: the entrance is in the painting');
    const base=page.locator('#coastMap .beachScene.mapped .sceneBase');
    assert.match(await base.getAttribute('src'),/landing-map-vault\.webp$/);await base.evaluate(img=>img.decode());
    // the recess, read from the painting itself (map px 935-952 x 248-275 of 1024: dark, the cliff around it light)
    const tone=await base.evaluate(img=>{const c=document.createElement('canvas');c.width=c.height=1024;const g=c.getContext('2d');g.drawImage(img,0,0,1024,1024);
     const avg=(x,y,w,h)=>{const d=g.getImageData(x,y,w,h).data;let t=0;for(let i=0;i<d.length;i+=4)t+=.3*d[i]+.59*d[i+1]+.11*d[i+2];return t/(d.length/4);};
     return {recess:avg(935,248,17,27),cliff:avg(905,205,20,12)};});
    assert.ok(tone.recess<90&&tone.cliff>150,'the painted Vault recess is in the map: '+JSON.stringify(tone));
    // the entrance on screen (map px 905-985 x 215-300): no place marker over it, and no restored place's painted
    // pixels over the opening (their boxes have transparent margins, so the art's own alpha is read)
    const geometry=await page.evaluate(async()=>{const s=document.querySelector('#coastMap .beachScene.mapped').getBoundingClientRect(),f=s.width/1024;
     const v={left:s.left+905*f,right:s.left+985*f,top:s.top+215*f,bottom:s.top+300*f};
     const markers=[...document.querySelectorAll('#coastMap .siteMarker')].map(e=>e.getBoundingClientRect()).filter(r=>r.width&&r.left<v.right-2&&r.right>v.left+2&&r.top<v.bottom-2&&r.bottom>v.top+2).length;
     const pts=[[943,240],[934,262],[952,262],[943,285],[920,270],[966,268]].map(([x,y])=>[s.left+x*f,s.top+y*f]);
     let covered=0;
     for(const img of document.querySelectorAll('#coastMap .restoredIcon img')){await img.decode().catch(()=>{});
      const r=img.getBoundingClientRect(),nw=img.naturalWidth,nh=img.naturalHeight;if(!nw)continue;
      const k=Math.min(r.width/nw,r.height/nh),dw=nw*k,dh=nh*k,ox=r.left+(r.width-dw)/2,oy=r.top+(r.height-dh)/2;   // object-fit: contain
      const c=document.createElement('canvas');c.width=nw;c.height=nh;const g=c.getContext('2d');g.drawImage(img,0,0);
      for(const [x,y] of pts){if(x<ox||x>=ox+dw||y<oy||y>=oy+dh)continue;const a=g.getImageData(Math.floor((x-ox)/k),Math.floor((y-oy)/k),1,1).data[3];if(a>64)covered++;}}
     return {w:v.right-v.left,markers,covered,overflow:document.documentElement.scrollWidth>innerWidth+1};});
    assert.ok(geometry.w>=25,'the entrance is big enough to find: '+JSON.stringify(geometry));
    assert.equal(geometry.markers,0,'no place marker covers the Vault: '+JSON.stringify({name,width,stages,geometry}));
    assert.equal(geometry.covered,0,'no restored place is painted over the Vault opening: '+JSON.stringify({name,width,stages,geometry}));
    assert.equal(geometry.overflow,false);
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
   console.log(`${name} ${width}: painted Vault at 0/10/20 stages, clear of markers, late chapter centering: ok`);
  }}finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
