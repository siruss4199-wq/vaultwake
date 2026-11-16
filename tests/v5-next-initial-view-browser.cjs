// Initial screen (2026-11-15): each time play starts, the page shows the play area: no sideways offset, the orders,
// the restoration strip and the 7×7 board in view and centred, tiles at their usual size. The page is taller than a
// phone (the shed and settings sit below the board) and a browser restores an old scroll position on reload: before
// this, a returning player who had scrolled down came back with the orders above the screen (390×664: orders at
// -138 px). Cases, real input, 360×640, 390×664, 390×844, 430×932 and 907×510 (+ 375×553, a small phone's Safari with
// its bars, where everything cannot fit: the whole board first, the primary order card in view):
//  1. a new camp's first board, and its reload;
//  2. a returning camp: Home → Continue; scrolled to the bottom then reloaded; scrolled then the menu's Home → Continue;
//  3. the CrazyGames page (stand-in SDK).
// ENGINES (default chromium,webkit), SIZES.
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const {chromium,webkit}=require('playwright');
const ORIGIN=process.env.ORIGIN||'http://127.0.0.1:8080',KEY='vaultwake-v5-coast';
const SIZES=(process.env.SIZES||'360x640,390x664,390x844,430x932,907x510,375x553').split(',').map(s=>s.split('x').map(Number));
const STUB=`window.CrazyGames={SDK:{environment:'crazygames',init:async()=>{},game:{loadingStart(){},loadingStop(){},gameplayStart(){},gameplayStop(){},happytime(){},settings:{muteAudio:false},addSettingsChangeListener(){}},ad:{requestAd(t,c){c.adError&&c.adError()}}}};`;
const camp=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures','coast','coast-ch1-pre-secondary.json'),'utf8'));camp.daily={day:9e6,count:1};
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const view=page=>page.evaluate(()=>{const R=s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width};};
 return {W:innerWidth,H:innerHeight,x:scrollX,sw:document.scrollingElement.scrollWidth,board:R('#board'),orders:R('#requests'),card:R('#requests .requestCard'),strip:R('#mapButton'),tile:R('#board .tile')?.width};});
(async()=>{for(const engine of (process.env.ENGINES||'chromium,webkit').split(',')){
 let browser;try{browser=await {chromium,webkit}[engine].launch();}catch(e){if(engine!=='chromium'&&/Executable doesn't exist/.test(e.message)){console.log(`${engine}: not installed here, skipped`);continue;}throw e;}
 try{for(const [W,H] of SIZES){const mobile=W<700,short=H<600,tag=s=>`${engine} ${W}×${H}: ${s}`;let tile0=null;
  const check=async(page,what)=>{const v=await view(page),in_=r=>r&&r.top>=-0.5&&r.bottom<=v.H+0.5&&r.left>=-0.5&&r.right<=v.W+0.5;
   assert.equal(v.x,0,tag(`${what}: no sideways offset`));assert.ok(v.sw<=v.W+1,tag(`${what}: nothing wider than the screen (${v.sw})`));
   assert.ok(in_(v.board),tag(`${what}: the whole board in view (${Math.round(v.board.top)}–${Math.round(v.board.bottom)} of ${v.H})`));
   assert.ok(v.card&&v.card.bottom>0&&v.card.top>=-12,tag(`${what}: the primary order card in view (top ${Math.round(v.card?.top)})`));
   if(!short){assert.ok(in_(v.orders),tag(`${what}: the orders in view (${Math.round(v.orders.top)})`));assert.ok(in_(v.strip),tag(`${what}: the restoration strip in view`));}
   if(mobile){assert.ok(Math.abs(v.board.left-(v.W-v.board.right))<=1.5,tag(`${what}: the board centred (${Math.round(v.board.left)} | ${Math.round(v.W-v.board.right)})`));
    assert.ok(Math.abs(v.orders.left-(v.W-v.orders.right))<=1.5,tag(`${what}: the orders centred`));}
   tile0??=v.tile;assert.ok(Math.abs(v.tile-tile0)<0.6,tag(`${what}: tiles keep their size (${v.tile} vs ${tile0})`));return v;};
  const ctxFor=async()=>{const c=await browser.newContext({viewport:{width:W,height:H},isMobile:mobile&&engine==='chromium',hasTouch:mobile});await c.route('https://sdk.crazygames.com/**',r=>r.fulfill({contentType:'application/javascript',body:STUB}));return c;};
  const tap=async(page,sel)=>{const l=page.locator(sel).first();await l.waitFor({state:'visible',timeout:15000});if(mobile)await l.tap();else await l.click();};
  const toBoard=async page=>{await page.waitForSelector('#board .tile',{timeout:20000});
   for(let k=0;k<40;k++){if(await page.evaluate(()=>!document.querySelector('#home')?.hidden&&!document.querySelector('#homePlay')?.hidden)){await tap(page,'#homePlay');await delay(300);continue;}
    if(await page.evaluate(()=>!document.querySelector('#story')?.hidden)){await tap(page,'#storySkip');await delay(300);continue;}break;}
   await page.waitForFunction(()=>document.querySelector('#home')?.hidden!==false,null,{timeout:15000});await delay(900);};
  const seed=page=>page.addInitScript(([k,v])=>{if(!sessionStorage.ivSeeded){localStorage.setItem(k,v);localStorage.setItem('vaultwake-v5-coast-story','{"intro":"skip"}');sessionStorage.ivSeeded='1';}},[KEY,JSON.stringify(camp)]);
  // 1. a new camp
  {const ctx=await ctxFor(),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(ORIGIN+'/v5/play.html');await toBoard(page);await check(page,'new camp');
   await page.reload();await toBoard(page);await check(page,'new camp, reload');assert.deepEqual(errors,[],tag('no page errors'));await ctx.close();}
  // 2. a returning camp
  {const ctx=await ctxFor(),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await seed(page);
   await page.goto(ORIGIN+'/v5/play.html');await toBoard(page);await check(page,'returning, Continue');
   await page.evaluate(()=>scrollTo(0,99999));await delay(300);assert.ok(await page.evaluate(()=>scrollY)>0||H>=900,tag('the page scrolls (taller than the screen)'));
   await page.reload();await toBoard(page);await check(page,'scrolled, then reload → Continue');
   await page.evaluate(()=>scrollTo(0,99999));await delay(300);await tap(page,'#menuButton');await tap(page,'#homeButton');await delay(500);await toBoard(page);await check(page,'scrolled, then menu Home → Continue');
   assert.deepEqual(errors,[],tag('no page errors'));await ctx.close();}
  // 3. the CrazyGames page
  {const ctx=await ctxFor(),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await seed(page);
   await page.goto(ORIGIN+'/v5/coast-crazygames.html');await toBoard(page);await check(page,'CrazyGames page');
   await page.evaluate(()=>scrollTo(0,99999));await delay(300);await page.reload();await toBoard(page);await check(page,'CrazyGames page, scrolled, then reload');
   assert.deepEqual(errors,[],tag('no page errors'));await ctx.close();}
  console.log(`ok ${tag('new camp, reload, returning, scrolled + reload, scrolled + menu Home, CrazyGames: board, orders and strip in view, centred, tiles unchanged')}`);
 }}finally{await browser.close();}}
 console.log('initial view browser tests passed');
})().catch(e=>{console.error(e);process.exit(1);});
