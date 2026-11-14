// Loading performance (2026-11-13; docs/V5_LOADING_AND_BOARD_CALM_2026-11-13.md), Chromium and WebKit, 390×664:
//  1. In Chromium every module the game imports is asked for at once (one <link rel="modulepreload"> each, added by
//     v5/next/boot.js once the styles are in); WebKit gets none (a failed preload outlived Retry there). Either way
//     each module is fetched once: no module twice, none missing.
//  2. A genuinely new player: the loading screen names the game in text while the logo is not asked for; the board
//     comes up and takes a tap without waiting for (or asking for) Home's pictures; they load afterwards, so the
//     menu's Home has them.
//  3. A returning player whose camp is only in the CrazyGames cloud (nothing in this browser): Home's pictures are
//     asked for once the save store has settled (never before the cloud is read), Home shows them with Continue,
//     and the cloud camp is kept.
//  4. A returning player with a camp in this browser: Home's pictures start at once (before the game module runs).
const assert=require('node:assert/strict');const path=require('node:path');const {chromium,webkit}=require('playwright');
const BASE='http://127.0.0.1:8080/v5/',KEY='vaultwake-v5-coast',HOMEART=/home\/(logo|home-bg|button)\.webp/;
const cgStub=cloud=>`(()=>{const m=new Map(${JSON.stringify([...cloud])});window.__cgReads=0;
 window.CrazyGames={SDK:{environment:'crazygames',init:async()=>{await new Promise(r=>setTimeout(r,400));},
  game:{loadingStart(){},loadingStop(){},gameplayStart(){},gameplayStop(){},happytime(){},settings:{muteAudio:false},addSettingsChangeListener(){}},
  ad:{requestAd(t,cb){cb.adError&&cb.adError()}},user:{getUser:async()=>null,addAuthListener(){},isUserAccountAvailable:true},
  data:{getItem(k){window.__cgReads++;return m.has(k)?m.get(k):null;},setItem(k,v){m.set(k,String(v));},removeItem(k){m.delete(k);},clear(){m.clear();}}}};})();`;
(async()=>{
 const g=await import(path.join(__dirname,'..','v5','next','game.mjs'));
 const {moduleGraph}=await import(path.join(__dirname,'..','tools','coast-modules.mjs'));
 const camp=()=>{const s=g.fresh(Date.now());s.seen={'coach-on':true,'coach-done':true};s.moves=30;s.coins=55;s.built={'beach-path':1};s.materials={'beach-path':1};s.daily={day:9e6,count:1};return s;};
 const engines=(process.env.ENGINES||'chromium,webkit').split(',').map(e=>[e,{chromium,webkit}[e]]);
 for(const [engine,type] of engines){
  let browser;try{browser=await type.launch();}catch(e){if(engine!=='chromium'&&/Executable doesn't exist/.test(e.message)){console.log(`${engine}: not installed here, skipped`);continue;}throw e;}
  const tag=s=>`${engine}: ${s}`;
  const open=async()=>{const context=await browser.newContext({viewport:{width:390,height:664},isMobile:engine==='chromium',hasTouch:true});
   await context.route(u=>!u.href.startsWith('http://127.0.0.1:'),r=>r.abort());
   const page=await context.newPage(),errors=[],log=[];page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>log.push({url:r.url(),t:Date.now()}));return {context,page,errors,log};};
  try{
   // 1 + 2. a new player
   {const {context,page,errors,log}=await open();
    // hold the game's entry module a moment, to see the loading screen as it is before the game runs
    let go;const gate=new Promise(r=>go=r);await page.route(/next\/app\.mjs/,async r=>{await gate;await r.continue();});
    await page.goto(BASE+'play.html',{waitUntil:'commit'});await page.waitForFunction(()=>window.VWBoot,null,{timeout:20000});
    const title=await page.evaluate(()=>getComputedStyle(document.querySelector('.homeLogo'),'::before').content);
    assert.match(title,/Vaultwake Merge/,tag('the loading screen names the game while the logo is not asked for'));
    assert.equal(await page.evaluate(()=>document.querySelector('.homeLogo img').hasAttribute('src')),false,tag('the logo is not asked for yet'));
    const preloads=await page.evaluate(()=>[...document.querySelectorAll('link[rel="modulepreload"]')].map(l=>l.getAttribute('href')));
    const graph=moduleGraph(await page.evaluate(()=>document.querySelector('script[type="module"]').getAttribute('src')));
    // Chromium-based browsers only (WebKit kept a failed preload across Retry; v5/next/boot.js)
    assert.deepEqual(preloads,engine==='chromium'?graph.slice(1):[],tag(engine==='chromium'?'one preload for each module the game imports':'no module preloads in WebKit'));
    go();await page.waitForSelector('#home',{state:'hidden',timeout:30000});const boardAt=Date.now();
    assert.deepEqual(log.filter(x=>HOMEART.test(x.url)&&x.t<=boardAt).map(x=>x.url),[],tag('the board came up without asking for Home\'s pictures'));
    // the board takes a tap at once (the first action saves the camp)
    const rover=await page.evaluate(()=>document.querySelector('#board .tile.source').dataset.index);
    await page.locator(`#board [data-index="${rover}"]`).tap();await page.waitForFunction(k=>!!localStorage.getItem(k),KEY,{timeout:5000});
    await page.waitForFunction(()=>{const i=document.querySelector('#home .homeArt');return i.getAttribute('src')&&i.complete&&i.naturalWidth>0;},null,{timeout:20000});
    const mods=log.filter(x=>/\.mjs(\?|$)/.test(x.url)).map(x=>new URL(x.url).pathname+new URL(x.url).search);
    const twice=mods.filter((m,i)=>mods.indexOf(m)!==i);
    assert.deepEqual(twice,[],tag('no module fetched twice'));assert.equal(new Set(mods).size,graph.length,tag('every module fetched'));
    assert.deepEqual(errors,[],tag('no page error'));await context.close();}
   // 3. CrazyGames: the camp only in the cloud
   {const cloud=new Map([[KEY,JSON.stringify(camp())]]),{context,page,errors,log}=await open();
    await context.route('https://sdk.crazygames.com/**',r=>r.fulfill({contentType:'application/javascript',body:cgStub(cloud)}));
    await page.goto(BASE+'coast-crazygames.html');await page.waitForSelector('#homePlay:not([hidden])',{timeout:30000});
    assert.equal((await page.locator('#homePlay').textContent()).trim(),'Continue',tag('Continue for the cloud camp'));
    assert.ok(await page.evaluate(()=>window.__cgReads>0),tag('the cloud was read'));
    assert.ok(log.some(x=>HOMEART.test(x.url)),tag('Home\'s pictures were asked for'));
    assert.ok(await page.evaluate(()=>[...document.querySelectorAll('#home img')].every(i=>i.getAttribute('src')&&i.complete&&i.naturalWidth>0)),tag('Home shows its pictures with Continue'));
    const kept=JSON.parse(cloud.get(KEY)),now=await page.evaluate(k=>JSON.parse(CrazyGames.SDK.data.getItem(k)),KEY);
    for(const f of ['built','coins','board','orders'])assert.deepEqual(now[f],kept[f],tag(`the cloud camp keeps its ${f}`));
    assert.deepEqual(errors,[],tag('no page error'));await context.close();}
   // 4. a camp in this browser: Home's pictures start before the game module has run
   {const {context,page,errors,log}=await open();
    await context.addInitScript(([k,v])=>{if(!sessionStorage.getItem('seeded')){localStorage.setItem(k,v);sessionStorage.setItem('seeded','1');}},[KEY,JSON.stringify(camp())]);
    let go;const gate=new Promise(r=>go=r);await page.route(/next\/app\.mjs/,async r=>{await gate;await r.continue();});
    await page.goto(BASE+'play.html',{waitUntil:'commit'});
    await page.waitForFunction(()=>document.querySelector('#home .homeArt')?.getAttribute('src'),null,{timeout:10000});
    assert.ok(log.some(x=>HOMEART.test(x.url)),tag('Home\'s pictures start at once for a camp in this browser'));
    go();await page.waitForSelector('#homePlay:not([hidden])',{timeout:30000});
    assert.equal((await page.locator('#homePlay').textContent()).trim(),'Continue',tag('Continue'));
    assert.deepEqual(errors,[],tag('no page error'));await context.close();}
   console.log(`ok ${engine}: modules preloaded once; new player's board without Home's pictures; cloud camp → Home with pictures and Continue; local camp → Home's pictures at once`);
  }finally{await browser.close();}
 }
 console.log('load browser tests passed');
})().catch(e=>{console.error(e);process.exit(1);});
