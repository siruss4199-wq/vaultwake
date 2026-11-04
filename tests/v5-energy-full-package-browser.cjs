// Exercise the actual extracted Full archive, not a rewritten play page.
const assert=require('node:assert/strict');const {chromium,webkit}=require('playwright');
const {throughHome}=require('./v5-next-home-helper.cjs');
const URL=process.env.FULL_URL||'http://127.0.0.1:8092/index.html',KEY='vaultwake-v5-coast';
const SDK=`window.__rewardAds=0;window.CrazyGames={SDK:{environment:'crazygames',init:async()=>{},game:{settings:{muteAudio:false},loadingStart(){},loadingStop(){},gameplayStart(){},gameplayStop(){},happytime(){},addSettingsChangeListener(){}},ad:{requestAd(kind,cb){if(kind!=='rewarded')throw Error('forced ad');__rewardAds++;cb.adStarted();cb.adFinished();cb.adFinished();}}}};`;
(async()=>{
 for(const name of (process.env.ENGINES||'chromium,webkit').split(',')){
  const browser=await {chromium,webkit}[name].launch();
  try{
   const page=throughHome(await browser.newPage({viewport:{width:390,height:844},hasTouch:true,reducedMotion:'reduce'})),errors=[];
   page.on('pageerror',e=>errors.push(e.message));await page.addLocatorHandler(page.locator('#daily[open]'),()=>page.locator('#daily .close').click());
   await page.route('https://sdk.crazygames.com/**',r=>r.fulfill({contentType:'application/javascript',body:SDK}));
   await page.goto(URL);for(let i=0;i<10&&await page.locator('#beat[open]').count();i++)await page.locator('#beatNext').click();
   assert.equal(await page.locator('html').getAttribute('data-launch'),'full');assert.equal(await page.locator('html').getAttribute('data-ads'),'on');
   await page.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.energy=10;s.energyAt=Date.now();s.moves=50;s.seen['coach-done']=true;localStorage.setItem(k,JSON.stringify(s));},KEY);
   await page.reload();for(let i=0;i<10&&await page.locator('#beat[open]').count();i++)await page.locator('#beatNext').click();
   await page.locator('#energyPill').click();await page.locator('[data-ad="adEnergy"]').click();
   await page.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).energy===35,KEY);
   const s=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
   assert.equal(s.shop.bought.adEnergy,1);assert.equal(await page.evaluate(()=>__rewardAds),1);assert.deepEqual(errors,[]);
   console.log(name+': extracted Full archive, verified SDK completion, exactly +25 once: PASS');await page.close();
  }finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
