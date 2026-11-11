// Coast Camp fits a phone screen (Build 57v, P0 2026-11-11; owner, on a real phone on CrazyGames: the page
// scrolled between the orders, the gold order's panel and the board). On the CrazyGames page, with a
// stand-in SDK, at phone sizes in portrait and a short landscape:
// - the page does not scroll, the whole board is on screen with tiles of 44 px or more, and the HUD, the
//   orders, the board and the shed row do not overlap;
// - the gold order's panel opens without pushing the board off the screen, its first line opens the coast,
//   and "How to make these" opens as a sheet on the screen and closes again;
// - a selected part's card, the menu's How to play / sound, and the field ration are on screen;
// - a part dragged onto its twin in the bottom row merges, one dragged onto the shed is stored (with a
//   selected part's card showing), and both survive a reload.
// Screenshots: test-artifacts/v5/viewport/<engine>-<w>x<h>-<state>.png
// URL: CG_URL (default the repo's v5/coast-crazygames.html). ENGINES: chromium,webkit by default.
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const {chromium,webkit,firefox}=require('playwright');const {throughHome}=require('./v5-next-home-helper.cjs');
const URL=process.env.CG_URL||'http://127.0.0.1:8080/v5/coast-crazygames.html',KEY='vaultwake-v5-coast';
const OUT=path.join(__dirname,'..','test-artifacts','v5','viewport');fs.mkdirSync(OUT,{recursive:true});
const STUB=`window.CrazyGames={SDK:{environment:'crazygames',init:async()=>{},game:{loadingStart(){},loadingStop(){},gameplayStart(){},gameplayStop(){},happytime(){},settings:{muteAudio:false},addSettingsChangeListener(){}},ad:{requestAd(t,c){c.adError&&c.adError()}}}};`;
// The chapter-1 camp with a gold order; two twins (rope level 1) in the bottom row's corners.
const camp=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures','coast','coast-ch1-pre-secondary.json'),'utf8'));
camp.board[42]={type:'item',family:'rope',tier:0};camp.board[48]={type:'item',family:'rope',tier:0};
// today's gift already opened, so no gift dialog covers the board in the middle of the checks
camp.daily={day:9e6,count:1};
const SIZES=(process.env.SIZES||'360x640,375x667,390x664,390x744,390x844,430x932,740x360,844x390,907x510').split(',').map(s=>s.split('x').map(Number));
const settle=async page=>{for(let k=0;k<8;k++){await page.waitForTimeout(150);let open=false;
 for(const d of ['#beat','#daily','#endDialog'])if(await page.locator(d+'[open]').count()){open=true;if(d==='#beat')await page.locator('#beatNext').click().catch(()=>{});else await page.locator(d+' .close, '+d+' [data-close]').first().click().catch(()=>page.evaluate(s=>document.querySelector(s).close(),d));}
 if(!open&&k>2)break;}};
// Everything the player needs at once: no page scroll, the board whole and below the orders, the shed row
// under it, nothing outside the screen.
async function fits(page,tag){
 const m=await page.evaluate(()=>{const r=s=>{const e=document.querySelector(s);if(!e||!e.getClientRects().length)return null;const b=e.getBoundingClientRect();return {top:b.top,bottom:b.bottom,left:b.left,right:b.right};};
  const tiles=[...document.querySelectorAll('#board .tile')].map(t=>t.getBoundingClientRect());
  return {inner:innerHeight,width:innerWidth,scrollH:document.scrollingElement.scrollHeight,scrollW:document.scrollingElement.scrollWidth,header:r('header'),requests:r('#requests'),tools:r('#orderTools:not([hidden])'),board:r('#board'),shed:r('#shed'),dock:r('.dock'),
   tiles:tiles.length,minTile:Math.min(...tiles.map(t=>Math.min(t.width,t.height))),tilesOut:tiles.filter(t=>t.top<0||t.bottom>innerHeight+0.5||t.left<0||t.right>innerWidth+0.5).length};});
 assert.ok(m.scrollH<=m.inner+1,`${tag}: the page does not scroll (${m.scrollH} > ${m.inner})`);
 assert.ok(m.scrollW<=m.width+1,`${tag}: no sideways scroll (${m.scrollW} > ${m.width})`);
 assert.equal(m.tiles,49,`${tag}: 49 tiles`);assert.equal(m.tilesOut,0,`${tag}: every tile on screen`);
 assert.ok(m.minTile>=43.5,`${tag}: tiles stay 44 px or more (${m.minTile.toFixed(1)})`);
 assert.ok(m.header.top>=0,`${tag}: the HUD is on screen`);
 const portrait=m.width<700;
 if(portrait){assert.ok(m.requests.top>=m.header.bottom-1,`${tag}: orders under the HUD`);
  assert.ok((m.tools??m.requests).bottom<=m.board.top+1,`${tag}: the board starts under the orders${m.tools?' and the open order\'s panel':''}`);}
 for(const k of ['shed','dock']){const b=m[k];assert.ok(b&&b.bottom<=m.inner+0.5&&b.top>=0,`${tag}: the ${k} is on screen`);
  if(portrait)assert.ok(b.top>=m.board.bottom-1,`${tag}: the ${k} is under the board`);
  else assert.ok(b.right<=m.board.left+1,`${tag}: the ${k} is beside the board`);}
 return m;
}
const onScreen=async(page,sel,tag)=>{const b=await page.locator(sel).boundingBox();const vp=page.viewportSize();
 assert.ok(b&&b.y>=0&&b.y+b.height<=vp.height+0.5&&b.x>=0&&b.x+b.width<=vp.width+0.5,`${tag}: ${sel} on screen (${JSON.stringify(b)})`);return b;};
async function drag(page,from,to){
 const a=await page.locator(`#board [data-index="${from}"]`).boundingBox(),b=typeof to==='string'?await page.locator(to).boundingBox():await page.locator(`#board [data-index="${to}"]`).boundingBox();
 await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();
 for(let k=1;k<=8;k++)await page.mouse.move(a.x+a.width/2+(b.x+b.width/2-a.x-a.width/2)*k/8,a.y+a.height/2+(b.y+b.height/2-a.y-a.height/2)*k/8);
 await page.mouse.up();await page.waitForTimeout(250);
}
const saved=page=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
(async()=>{
 const engines=(process.env.ENGINES||'chromium,webkit').split(',').map(e=>[e,{chromium,webkit,firefox}[e]]);
 for(const [engine,type] of engines){
  const browser=await type.launch();
  try{for(const [W,H] of SIZES){
   const tag=`${engine} ${W}×${H}`,shot=s=>page.screenshot({path:path.join(OUT,`${engine}-${W}x${H}-${s}.png`)});
   const context=await browser.newContext({viewport:{width:W,height:H},isMobile:engine==='chromium',hasTouch:true});
   const page=await context.newPage(),errors=[];throughHome(page);page.on('pageerror',e=>errors.push(e.message));
   await page.route(u=>!u.href.startsWith('http://127.0.0.1:'),r=>r.abort());
   await page.route('https://sdk.crazygames.com/**',r=>r.fulfill({contentType:'application/javascript',body:STUB}));
   await page.addInitScript(([k,v])=>{if(!sessionStorage.vpSeeded){localStorage.setItem(k,v);localStorage.setItem('vaultwake-v5-coast-story','{"intro":"skip"}');sessionStorage.vpSeeded='1';}},[KEY,JSON.stringify(camp)]);
   await page.goto(URL);await page.waitForSelector('#board .tile');await settle(page);
   await fits(page,`${tag} board`);await shot('board');
   // the field ration (energy is low in this camp) stands on screen beside the guidance line
   if(await page.locator('#rationButton:not([hidden])').count())await onScreen(page,'#rationButton',`${tag} ration`);
   // the gold order's panel
   await page.locator('#requests .requestCard.storyOrder').click();await page.waitForSelector('#orderTools:not([hidden]) .goldSay');
   await fits(page,`${tag} gold order open`);await onScreen(page,'#orderTools .goldHow summary',`${tag} gold order open`);await shot('gold');
   // its first line opens the coast, as the restoration strip it stands in for does
   await page.locator('#orderTools [data-open-map]').click();await page.waitForSelector('#coastMap[open]');
   await page.locator('#coastMap .close').click();await page.waitForSelector('#coastMap',{state:'hidden'});
   if(!await page.locator('#orderTools:not([hidden]) .goldSay').count()){await page.locator('#requests .requestCard.storyOrder').click();await page.waitForSelector('#orderTools:not([hidden]) .goldSay');}
   await page.locator('#orderTools .goldHow summary').click();await page.waitForSelector('#orderTools .goldHow[open]');
   const sheet=await onScreen(page,'#orderTools .goldHow[open] .routes',`${tag} How to make these`);
   assert.ok((await page.locator('#orderTools .goldHow .route').count())>0,`${tag}: the sheet lists the chains`);
   await fits(page,`${tag} How to make these open`);await shot('how');
   if(W>=700){const board=await page.locator('#board').boundingBox();assert.ok(sheet.x+sheet.width<=board.x+1,`${tag}: the sheet stays beside the board`);}
   await page.locator('#orderTools .goldHow summary').click();assert.equal(await page.locator('#orderTools .goldHow[open]').count(),0,`${tag}: the sheet closes`);
   await page.locator('#requests .requestCard.storyOrder').click();await page.waitForSelector('#orderTools',{state:'hidden'});
   // a selected part's card
   await page.locator('#board [data-index="34"]').click();await page.waitForSelector('#selection:not(:empty)');
   await onScreen(page,'#selection',`${tag} selected part`);await fits(page,`${tag} selected part`);await shot('selected');
   // drag: a part onto the shed while the card shows, then twins in the bottom row
   const shedBefore=(await saved(page)).shed.filter(Boolean).length;
   await drag(page,32,'#shed [data-shed-toggle]');
   let s=await saved(page);assert.equal(s.board[32],null,`${tag}: the part left the board for the shed`);assert.equal(s.shed.filter(Boolean).length,shedBefore+1,`${tag}: the shed holds it`);
   await drag(page,42,48);s=await saved(page);
   assert.equal(s.board[42],null,`${tag}: the dragged twin left its cell`);assert.deepEqual([s.board[48]?.family,s.board[48]?.tier],['rope',1],`${tag}: the twins merged in the bottom row`);
   await fits(page,`${tag} after the merges`);
   // How to play and sound are in the menu, on screen
   await page.locator('#menuButton').click();await page.waitForSelector('#menu[open]');
   for(const id of ['#helpButton','#soundButton']){assert.ok(await page.locator(`#menu ${id}`).isVisible(),`${tag}: ${id} in the menu`);}
   const sound=await page.locator('#soundButton').textContent();await page.locator('#soundButton').click();
   assert.notEqual(await page.locator('#soundButton').textContent(),sound,`${tag}: sound toggles from the menu`);await page.locator('#soundButton').click();
   await shot('menu');await page.locator('#menu .close').click();
   // progress survives a reload
   await page.reload();await page.waitForSelector('#board .tile');await settle(page);
   s=await saved(page);assert.deepEqual([s.board[48]?.family,s.board[48]?.tier,s.board[42],s.board[32]],['rope',1,null,null],`${tag}: the merges are kept after a reload`);
   await fits(page,`${tag} after a reload`);
   assert.deepEqual(errors,[],`${tag}: no page errors`);
   console.log(`ok ${tag}`);await context.close();}}
  finally{await browser.close();}
 }
 console.log('viewport browser tests passed');
})().catch(e=>{console.error(e);process.exit(1);});
