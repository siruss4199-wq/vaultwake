// Coast Camp's progress on CrazyGames (v5/next/save-store.mjs, 2026-11-08) in a real browser. A stand-in
// for the HTML5 SDK v3 has a Data module whose "cloud" lives in this test (one per account, shared by
// every browser context that plays as that player), so reloads and a second device can be checked.
// No request leaves the machine.
// Checks: a new guest saves to the Data module and not to localStorage; a reload and a second device
// continue the same camp; a camp already in the browser is copied in and kept there; an account camp
// is never replaced by the browser's (which becomes a kept camp); a refusing Data module falls back to
// localStorage; a restore whose write the SDK had not sent yet is not lost; after a login nothing is
// written until the SDK reloads the game.
// URL: the page to test (default the repo's v5/coast-crazygames.html; the packaged zip's index.html
// can be passed as CG_URL).
const assert=require('node:assert/strict');const {chromium,webkit,firefox}=require('playwright');
const URL=process.env.CG_URL||'http://127.0.0.1:8080/v5/coast-crazygames.html',KEY='vaultwake-v5-coast';
const stub=(cloud,o)=>`(()=>{const m=new Map(${JSON.stringify([...cloud])});window.__auth=[];
 window.__lossy=${!!o.lossy};const push=(k,v)=>{if(!window.__lossy&&window.__cloudPush)window.__cloudPush(k,v);};
 window.CrazyGames={SDK:{environment:'crazygames',init:async()=>{await new Promise(r=>setTimeout(r,${o.initDelay||0}));},
  game:{loadingStart(){},loadingStop(){},gameplayStart(){},gameplayStop(){},happytime(){},settings:{muteAudio:false},addSettingsChangeListener(){}},
  ad:{requestAd(t,cb){cb.adError&&cb.adError()}},
  user:{getUser:async()=>(${JSON.stringify(o.user??null)}),addAuthListener:f=>window.__auth.push(f),isUserAccountAvailable:true},
  data:{getItem(k){${o.readFail?`throw {code:${JSON.stringify(o.readFail)}};`:''}return m.has(k)?m.get(k):null;},
   setItem(k,v){if(window.__failWrites)throw {code:'dataModuleDisabled'};v=String(v);m.set(k,v);push(k,v);},removeItem(k){m.delete(k);push(k,null);},clear(){m.clear();}}}};})();`;
async function device(browser,cloud,o={},seed=null){
 const context=await browser.newContext({viewport:{width:390,height:844}});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await context.exposeFunction('__cloudPush',(k,v)=>{v===null?cloud.delete(k):cloud.set(k,v);});
 // Playwright tries the route added last first: nothing leaves the machine except the stand-in SDK.
 await context.route(u=>!u.href.startsWith('http://127.0.0.1:'),r=>r.abort());
 await context.route('https://sdk.crazygames.com/**',r=>r.fulfill({contentType:'application/javascript',body:stub(cloud,o)}));
 // o.cgHost: the game served from a CrazyGames host name (as on CrazyGames), mapped to the local server.
 if(o.cgHost)await context.route('http://qa.crazygames.com/**',async r=>{const u=new globalThis.URL(r.request().url()),base=new globalThis.URL(URL);
  r.fulfill({response:await r.fetch({url:base.origin+u.pathname+u.search})});});
 if(seed)await context.addInitScript(s=>{if(!sessionStorage.getItem('seeded')){for(const [k,v] of Object.entries(s))localStorage.setItem(k,v);sessionStorage.setItem('seeded','1');}},seed);
 return {context,page,errors,o};
}
// Opens the game through Home; answers the main button's text (Play for a new camp, Continue for a save).
async function enter(page,how='goto'){
 if(how==='goto')await page.goto(page.__url??URL);else await page.reload();
 await page.waitForSelector('#homePlay:not([hidden])',{timeout:20000});const label=(await page.locator('#homePlay').textContent()).trim();
 await page.locator('#homePlay').click();
 await page.waitForFunction(()=>document.querySelector('#home').hidden||!document.querySelector('#story')?.hidden,null,{timeout:20000});
 if(await page.locator('#story:not([hidden])').count())await page.locator('#storySkip').click();
 await page.waitForSelector('#home',{state:'hidden',timeout:20000});await page.waitForSelector('#board .tile');
 for(let n=0;n<8&&await page.locator('#beat[open]').count();n++){await page.locator('#beatNext').click();await page.waitForTimeout(80);}
 return label;
}
const until=async(f,what,ms=8000)=>{const t=Date.now();while(!f()){if(Date.now()-t>ms)throw new Error('timed out: '+what);await new Promise(r=>setTimeout(r,50));}};
async function produce(page,cloud){
 // The generator's space, from the save the game just wrote.
 const raw=cloud.get(KEY)??await page.evaluate(k=>localStorage.getItem(k),KEY);const s=JSON.parse(raw);
 const gen=s.board.findIndex(x=>x?.type==='source');await page.locator(`#board [data-index="${gen}"]`).click();await page.waitForTimeout(250);
 return s;
}
(async()=>{
 const engines=(process.env.ENGINES||'chromium,webkit').split(',').map(e=>[e,{chromium,webkit,firefox}[e]]);
 for(const [engine,type] of engines){
  const browser=await type.launch();
  try{
   // 1. A new guest: the camp goes to the Data module, not to localStorage.
   const cloud=new Map(),a=await device(browser,cloud);
   assert.equal(await enter(a.page),'Play',`${engine}: a new player starts with Play`);
   await until(()=>cloud.has(KEY),'first save in the Data module');
   const before=JSON.parse(cloud.get(KEY));await produce(a.page,cloud);
   await until(()=>JSON.parse(cloud.get(KEY)).energy===before.energy-1,'the produce is saved');
   assert.equal(await a.page.evaluate(k=>localStorage.getItem(k),KEY),null,`${engine}: the camp is not in localStorage`);
   const saved=cloud.get(KEY);
   // 2. Reload: Continue, the same camp.
   assert.equal(await enter(a.page,'reload'),'Continue',`${engine}: reload continues`);
   assert.equal(JSON.parse(cloud.get(KEY)).energy,JSON.parse(saved).energy,`${engine}: same camp after reload`);
   assert.equal(await a.page.locator('#coins').textContent(),String(JSON.parse(saved).coins));
   // 3. A second device for the same player: Continue, the same camp.
   const b=await device(browser,cloud);assert.equal(await enter(b.page),'Continue',`${engine}: second device continues`);
   assert.equal(await b.page.locator('#coins').textContent(),String(JSON.parse(cloud.get(KEY)).coins));
   assert.equal(JSON.parse(cloud.get(KEY)).board.filter(Boolean).length,JSON.parse(saved).board.filter(Boolean).length,`${engine}: same board on device 2`);
   // 4. A login event (CrazyGames reloads the game itself) no longer stops saving (2026-11-09).
   const w=JSON.parse(cloud.get(KEY));await b.page.evaluate(()=>window.__auth.forEach(f=>f({username:'Someone'})));
   await produce(b.page,cloud);await until(()=>JSON.parse(cloud.get(KEY)).energy===w.energy-1,'a save after the login event');
   // Diagnostics: the Data module is in use and saves are accepted; the menu says so.
   const st=await b.page.evaluate(()=>window.VWSave);assert.equal(st.kind,'data');assert.ok(st.accepted>0);assert.deepEqual(st.errors,[]);
   await b.page.locator('#menuButton').click();assert.match(await b.page.locator('#saveNote').textContent(),/saved to CrazyGames \(guest\) · last save \d+ s ago/);await b.page.keyboard.press('Escape');
   assert.deepEqual([...a.errors,...b.errors],[],`${engine}: no page errors`);await a.context.close();await b.context.close();
   console.log(`${engine}: new guest saves to the Data module; reload and second device continue; saving continues after a login event; diagnostics passed`);

   // 5. A camp already in this browser (from before this build) is copied in; localStorage keeps it.
   const old=new Map(),local=JSON.parse(saved);local.coins=777;local.lastAt=Date.now();const localRaw=JSON.stringify(local);
   const c=await device(browser,old,{},{[KEY]:localRaw});
   assert.equal(await enter(c.page),'Continue',`${engine}: the browser's camp continues`);
   assert.equal(await c.page.locator('#coins').textContent(),'777');
   await until(()=>old.has(KEY),'the browser camp copied in');assert.equal(JSON.parse(old.get(KEY)).coins,777);
   assert.equal(await c.page.evaluate(k=>localStorage.getItem(k),KEY),localRaw,`${engine}: localStorage keeps its copy`);
   await c.context.close();
   // 6. An account that has its own camp: it is shown; the browser's different camp becomes a kept camp.
   const acct=JSON.parse(saved);acct.coins=555;const acctCloud=new Map([[KEY,JSON.stringify(acct)]]);
   const d=await device(browser,acctCloud,{user:{__dangerousUserId:'u1',username:'Player.One'}},{[KEY]:localRaw});
   assert.equal(await enter(d.page),'Continue');assert.equal(await d.page.locator('#coins').textContent(),'555',`${engine}: the account camp is shown`);
   await d.page.locator('#menuButton').click();assert.match(await d.page.locator('#keptButton').textContent(),/Kept camps \(1\)/,`${engine}: the browser camp is kept`);
   await d.page.keyboard.press('Escape');
   assert.equal(JSON.parse(acctCloud.get(KEY+'-kept')).coins,777);
   // 7. Restore it while the SDK's writes are delayed (lost): the restored camp still wins after the reload.
   d.o.lossy=true;await d.page.evaluate(()=>{window.__lossy=true;});await d.page.locator('#menuButton').click();await d.page.locator('#keptButton').click();
   await d.page.locator('#keptList [data-restore]').first().click();
   await d.page.waitForSelector('#homePlay:not([hidden])',{timeout:20000});
   assert.equal(JSON.parse(acctCloud.get(KEY)).coins,555,'the cloud never got the restore');
   d.o.lossy=false;assert.equal(await enter(d.page,'reload'),'Continue');
   assert.equal(await d.page.locator('#coins').textContent(),'777',`${engine}: the restored camp is shown`);
   await until(()=>JSON.parse(acctCloud.get(KEY)).coins===777,'the restore written again');
   assert.ok([...acctCloud.entries()].some(([k,v])=>k.startsWith(KEY+'-kept')&&JSON.parse(v).coins===555),`${engine}: the replaced account camp is kept`);
   assert.deepEqual([...c.errors,...d.errors],[],`${engine}: no page errors`);await d.context.close();
   console.log(`${engine}: browser camp copied in and kept; account camp kept beside it; delayed restore not lost passed`);

   // 8. A Data module that refuses (e.g. dataModuleDisabled): the game plays on localStorage.
   const off=new Map(),e=await device(browser,off,{readFail:'dataModuleDisabled'});
   assert.equal(await enter(e.page),'Play');
   await e.page.waitForFunction(k=>!!localStorage.getItem(k),KEY);const s0=JSON.parse(await e.page.evaluate(k=>localStorage.getItem(k),KEY));
   await produce(e.page,off);await e.page.waitForFunction(([k,n])=>JSON.parse(localStorage.getItem(k)).energy===n,[KEY,s0.energy-1]);
   assert.equal(off.size,0,`${engine}: nothing sent to a disabled Data module`);
   assert.equal(await enter(e.page,'reload'),'Continue');assert.deepEqual(e.errors,[],`${engine}: no page errors`);await e.context.close();
   console.log(`${engine}: refusing Data module falls back to localStorage passed`);

   // 9. Regression 2026-11-09: on a CrazyGames host the real SDK's init can take several seconds.
   // The save waits for it and uses the Data module; reload keeps the progress.
   const slowCloud=new Map(),f=await device(browser,slowCloud,{initDelay:6000,cgHost:true});f.page.__url='http://qa.crazygames.com'+new globalThis.URL(URL).pathname;
   assert.equal(await enter(f.page),'Play');await until(()=>slowCloud.has(KEY),'first save in the Data module after a slow init',15000);
   const fs0=JSON.parse(slowCloud.get(KEY));await produce(f.page,slowCloud);await until(()=>JSON.parse(slowCloud.get(KEY)).energy===fs0.energy-1,'saved');
   assert.equal((await f.page.evaluate(()=>window.VWSave)).kind,'data');assert.ok((await f.page.evaluate(()=>window.VWSave)).initMs>=5500);
   assert.equal(await enter(f.page,'reload'),'Continue',`${engine}: progress survives a reload after a slow init`);
   assert.equal(await f.page.locator('#coins').textContent(),String(JSON.parse(slowCloud.get(KEY)).coins));
   assert.equal(JSON.parse(slowCloud.get(KEY)).energy,fs0.energy-1);
   // 10. Regression 2026-11-09: the Data module refuses a save mid-game; the reload still shows it.
   await f.page.evaluate(()=>{window.__failWrites=true;});const fs1=JSON.parse(slowCloud.get(KEY));await produce(f.page,slowCloud);
   await f.page.waitForFunction(k=>!!localStorage.getItem(k),KEY);const kept=JSON.parse(await f.page.evaluate(k=>localStorage.getItem(k),KEY));
   assert.equal(kept.energy,fs1.energy-1,'the refused save is in the browser');
   await f.page.locator('#menuButton').click();assert.match(await f.page.locator('#saveNote').textContent(),/refused a save \(dataModuleDisabled\)/);await f.page.keyboard.press('Escape');
   assert.equal(await enter(f.page,'reload'),'Continue');
   await until(()=>JSON.parse(slowCloud.get(KEY)).energy===kept.energy,'written back into the Data module at the next start',15000);
   assert.deepEqual(f.errors,[],`${engine}: no page errors`);await f.context.close();
   console.log(`${engine}: slow SDK init on a CrazyGames host uses the Data module and survives reload; refused save survives reload passed`);
  }finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exit(1);});
