const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const {throughHome,enterHome}=require('./v5-next-home-helper.cjs');
const KEY='vaultwake-v5-coast',URL='http://127.0.0.1:8080/v5/play.html';
(async()=>{
 const {COACH_DONE}=await import('../v5/next/coach.mjs');
 for(const name of (process.env.ENGINES||'chromium,webkit').split(',')){
  const browser=await {chromium,webkit}[name].launch();
  try{
   const open=async({full=false,broken=false}={})=>{
    const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,reducedMotion:'reduce'});
    await context.addInitScript(broken=>{window.__ads=[];window.CrazyGames={SDK:{environment:'crazygames',init:async()=>{if(broken)throw Error('SDK offline');},
     game:{settings:{muteAudio:false},loadingStart(){},loadingStop(){},gameplayStart(){},gameplayStop(){},happytime(){},addSettingsChangeListener(){}},
     ad:{requestAd(kind,cb){window.__ads.push(cb);cb.adStarted();}}}};},broken);
    const page=throughHome(await context.newPage()),errors=[];
    await page.addLocatorHandler(page.locator('#daily[open]'),()=>page.locator('#daily .close').click());page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
    await page.route('**/v5/play.html*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text()).replace('<html lang="en">',`<html lang="en" data-ads="${full?'on':'off'}">`)});});
    const beats=async()=>{for(let i=0;i<20&&await page.locator('#beat[open]').count();i++){await page.locator('#beatNext').click();await page.waitForTimeout(70);}};
    await page.goto(URL);await beats();
    const read=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
    const fixture=async()=>{await page.evaluate(([k,done])=>{const s=JSON.parse(localStorage.getItem(k));s.energy=10;s.energyAt=Date.now();s.coins=1000;s.moves=50;s.seen[done]=true;localStorage.setItem(k,JSON.stringify(s));},[KEY,COACH_DONE]);await page.reload();await beats();};
    return {context,page,errors,beats,read,fixture};
   };
   // New camp HUD and coin recovery remain available in Basic Launch, without ad offers.
   {const {context,page,errors,read,fixture}=await open();
    assert.equal((await page.locator('#energy').innerText()).replace(/\s/g,''),'100/50');assert.equal(await page.locator('#energyTimer').innerText(),'BONUS');
    await fixture();await page.locator('#energyPill').click();
    assert.equal(await page.locator('[data-ad]').count(),0);assert.match(await page.locator('#shopContent').innerText(),/\+20 energy/);assert.match(await page.locator('#shopContent').innerText(),/3 of 3 left today/);
    await page.locator('[data-buy="energy"]').evaluate(b=>{b.click();b.click();});
    await page.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).shop.bought.energy===1,KEY);
    let s=await read();assert.equal(s.coins,920);assert.equal(s.energy,30,'double-click is one purchase');
    await page.locator('#shop .close').click();await page.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.energy=181;localStorage.setItem(k,JSON.stringify(s));},KEY);
    await page.reload();await page.locator('#energyPill').click();assert.equal(await page.locator('[data-buy="energy"]').isDisabled(),true);
    assert.deepEqual(errors,[]);await context.close();
   }
   // Full Launch callback contract: only completed SDK ads pay, once, at most two daily.
   {const {context,page,errors,read,fixture}=await open({full:true});
    await page.locator('#energyPill').click();assert.equal(await page.locator('[data-ad]').count(),0,'no ads in the opening tutorial');await page.locator('#shop .close').click();
    await fixture();const earlier=await page.evaluate(k=>localStorage.getItem(k),KEY);await page.locator('#energyPill').click();
    const watch=async()=>{const before=await page.evaluate(()=>__ads.length);await page.locator('[data-ad="adEnergy"]').click();await page.waitForFunction(n=>window.__ads.length===n+1,before);};
    await watch();await page.locator('[data-ad="adEnergy"]').evaluate(b=>b.click());assert.equal(await page.evaluate(()=>__ads.length),1);
    await page.evaluate(()=>{__ads.at(-1).adFinished();__ads.at(-1).adFinished();});
    await page.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).energy===35,KEY);assert.equal((await read()).shop.bought.adEnergy,1);
    for(const failure of ['adError','adSkipped']){await watch();await page.evaluate(method=>__ads.at(-1)[method](),failure);await page.waitForTimeout(100);assert.equal((await read()).energy,35);assert.equal((await read()).shop.bought.adEnergy,1);}
    await watch();await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));Object.defineProperty(document,'hidden',{configurable:true,value:false});});await page.waitForTimeout(100);await page.evaluate(()=>__ads.at(-1).adFinished());assert.equal((await read()).energy,35,'interruption and late completion pay nothing');assert.equal((await read()).shop.bought.adEnergy,1);
    await watch();await page.evaluate(()=>__ads.at(-1).adFinished());await page.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).energy===60,KEY);
    assert.equal((await read()).shop.bought.adEnergy,2);assert.match(await page.locator('#shopContent').innerText(),/Daily rewards used/);
    await page.evaluate(([k,raw])=>localStorage.setItem(k,raw),[KEY,earlier]);await page.reload();await page.locator('#energyPill').click();
    assert.equal((await read()).shop.bought.adEnergy,2,'restoring an earlier save cannot reset daily rewards');assert.equal(await page.locator('[data-ad="adEnergy"]').count(),0);
    assert.deepEqual(errors,[]);await context.close();
   }
   // A completed ad must merge with the latest same-camp save, never overwrite
   // progress made in another tab, or replace a different newly started camp.
   {const {context,page,errors,read,fixture}=await open({full:true});await fixture();await page.locator('#energyPill').click();await page.locator('[data-ad="adEnergy"]').click();await page.waitForFunction(()=>__ads.length===1);
    await page.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.coins=321;s.energy=20;localStorage.setItem(k,JSON.stringify(s));__ads.at(-1).adFinished();},KEY);
    await page.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).energy===45,KEY);assert.equal((await read()).coins,321);
    await page.locator('[data-ad="adEnergy"]').click();await page.waitForFunction(()=>__ads.length===2);await page.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.energyRewards.id='another-new-camp';s.energy=100;localStorage.setItem(k,JSON.stringify(s));__ads.at(-1).adFinished();},KEY);
    await page.waitForTimeout(100);assert.equal((await read()).energy,100);assert.equal((await read()).energyRewards.id,'another-new-camp');assert.deepEqual(errors,[]);await context.close();
   }
   // Failed production SDK initialization cannot open the local stand-in or grant rewards.
   {const {context,page,errors,read,fixture}=await open({full:true,broken:true});await fixture();await page.locator('#energyPill').click();
    assert.match(await page.locator('#shopContent').innerText(),/Ad unavailable/);assert.equal(await page.locator('[data-ad="adEnergy"]').isDisabled(),true);
    assert.equal(await page.locator('#adStandIn').isVisible(),false);assert.equal((await read()).energy,10);assert.deepEqual(errors,[]);await context.close();}
   // Global build-count milestone feedback and rollback suppression through save reload.
   {const {context,page,errors,fixture,read,beats}=await open();await fixture();
    await page.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.built={'beach-path':1};s.materials={'beach-path':3};s.boost={order:true,stage:true};s.energyRewards.stages=1;s.level={version:1,level:3,xp:0};s.capPaid=60;localStorage.setItem(k,JSON.stringify(s));},KEY);
    await page.reload();await beats();const earlier=await page.evaluate(k=>localStorage.getItem(k),KEY);
    const build=async()=>{await page.locator('#mapButton').click();await page.locator('#coastMap .places [data-select="beach-path"]').click();await page.locator('[data-restore="beach-path"]').click();await page.waitForTimeout(300);};
    await build();assert.equal((await read()).energy,20);assert.match(await page.locator('.energyNote').innerText(),/Restoration 2.*\+10 energy/);await beats();await page.locator('#coastMap .close').click();
    await build();assert.equal((await read()).energy,30);await beats();await page.locator('#coastMap .close').click();
    await page.evaluate(([k,raw])=>localStorage.setItem(k,raw),[KEY,earlier]);await page.reload();await beats();await build();assert.equal((await read()).energy,10,'replayed build does not pay again');
    assert.deepEqual(errors,[]);await context.close();
   }
   console.log(name+' 390x844: fresh BONUS HUD, Basic coin recovery, Full SDK completion/failure/limits, rollback receipts, build rewards: PASS');
  }finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
