// Coast Camp's two empty vertical spaces on a phone (Build 57x, owner on a real iPhone, 2026-11-11), on the
// CrazyGames page with a stand-in SDK, at 360×640, 390×664 (Safari with its bars), 390×744, 390×844, 430×932:
// - with nothing to show in the guidance line (its hint hidden because the strip already says "upgrade"),
//   the line takes no space: the board sits 6–10 px under the restoration strip, with or without the gold
//   order's panel open; when the hint does show (the guide on a new camp) the line is still there;
// - the gold order's panel is at least 35% shorter than its 176 px (Build 57w and before), keeps the stage,
//   the coins, each material and its count, the generator buttons and "How to make these" (all buttons
//   44 px), clips no text, and opens "How to make these" below the materials;
// - tiles stay as they were (44 px or more), nothing scrolls sideways, and the board is whole on the first
//   screen wherever it was before plus, with the panel open, from 390×744 up.
// Screenshots: test-artifacts/v5/spacing/<engine>-<w>x<h>-<state>.png
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const {chromium,webkit,firefox}=require('playwright');const {throughHome}=require('./v5-next-home-helper.cjs');
const URL=process.env.CG_URL||'http://127.0.0.1:8080/v5/coast-crazygames.html',KEY='vaultwake-v5-coast';
const OUT=path.join(__dirname,'..','test-artifacts','v5','spacing');fs.mkdirSync(OUT,{recursive:true});
const STUB=`window.CrazyGames={SDK:{environment:'crazygames',init:async()=>{},game:{loadingStart(){},loadingStop(){},gameplayStart(){},gameplayStop(){},happytime(){},settings:{muteAudio:false},addSettingsChangeListener(){}},ad:{requestAd(t,c){c.adError&&c.adError()}}}};`;
const camp=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures','coast','coast-ch1-pre-secondary.json'),'utf8'));
camp.daily={day:9e6,count:1}; // today's gift taken: no dialog over the checks
const SIZES=(process.env.SIZES||'360x640,390x664,390x744,390x844,430x932').split(',').map(s=>s.split('x').map(Number));
const settle=async page=>{for(let k=0;k<8;k++){await page.waitForTimeout(150);
 if(await page.locator('#beat[open]').count())await page.locator('#beatNext').click().catch(()=>{});
 for(const d of ['#daily','#endDialog'])if(await page.locator(d+'[open]').count())await page.locator(d+' .close').click().catch(()=>{});}};
const layout=page=>page.evaluate(()=>{const r=s=>{const e=document.querySelector(s);if(!e||!e.getClientRects().length)return null;const b=e.getBoundingClientRect();return {top:b.top,bottom:b.bottom,left:b.left,right:b.right,height:b.height,width:b.width};};
 const tiles=[...document.querySelectorAll('#board .tile')].map(t=>t.getBoundingClientRect());
 return {inner:innerHeight,width:innerWidth,scrollW:document.scrollingElement.scrollWidth,strip:r('#mapButton'),heading:r('.boardHeading'),hint:r('#hint'),board:r('#board'),panel:r('#orderTools:not([hidden])'),
  say:r('#orderTools .goldSay'),how:r('#orderTools .goldHow summary'),row:r('#orderTools .goldRow'),routes:r('#orderTools .goldHow[open] .routes'),
  locate:[...document.querySelectorAll('#orderTools .locate')].map(b=>b.getBoundingClientRect().height),chips:[...document.querySelectorAll('#orderTools .goldNeed')].map(c=>c.getAttribute('aria-label')),
  counts:[...document.querySelectorAll('#orderTools .goldNeed em')].map(e=>e.getBoundingClientRect().width),
  clipped:[...document.querySelectorAll('#orderTools .goldSay, #orderTools .goldSay *, #orderTools .goldNeed *')].filter(e=>e.scrollHeight>e.clientHeight+1||e.scrollWidth>e.clientWidth+1).map(e=>e.className||e.tagName),
  minTile:Math.min(...tiles.map(t=>Math.min(t.width,t.height)))};});
(async()=>{
 const engines=(process.env.ENGINES||'chromium,webkit').split(',').map(e=>[e,{chromium,webkit,firefox}[e]]);
 for(const [engine,type] of engines){
  const browser=await type.launch();
  try{for(const [W,H] of SIZES){
   const tag=`${engine} ${W}×${H}`;
   const context=await browser.newContext({viewport:{width:W,height:H},isMobile:engine==='chromium',hasTouch:true});
   const page=await context.newPage(),errors=[];throughHome(page);page.on('pageerror',e=>errors.push(e.message));
   const shot=s=>page.screenshot({path:path.join(OUT,`${engine}-${W}x${H}-${s}.png`)});
   await page.route(u=>!u.href.startsWith('http://127.0.0.1:'),r=>r.abort());
   await page.route('https://sdk.crazygames.com/**',r=>r.fulfill({contentType:'application/javascript',body:STUB}));
   await page.addInitScript(([k,v])=>{if(!sessionStorage.spSeeded){localStorage.setItem(k,v);localStorage.setItem('vaultwake-v5-coast-story','{"intro":"skip"}');sessionStorage.spSeeded='1';}},[KEY,JSON.stringify(camp)]);
   await page.goto(URL);await page.waitForSelector('#board .tile');await settle(page);
   // 1. the panel closed: no empty guidance line between the strip and the board
   let m=await layout(page);
   assert.equal(await page.locator('#hint').getAttribute('data-kind'),'upgrade',`${tag}: this camp's hint is the strip's upgrade`);
   assert.equal(m.heading,null,`${tag}: the empty guidance line takes no space`);
   const gap=m.board.top-m.strip.bottom;assert.ok(gap>=6&&gap<=10,`${tag}: board ${gap.toFixed(1)} px under the strip (6–10)`);
   assert.ok(m.minTile>=43.5,`${tag}: tiles stay 44 px or more (${m.minTile.toFixed(1)})`);
   assert.ok(m.scrollW<=m.width+1,`${tag}: no sideways scroll`);
   assert.ok(m.board.bottom<=m.inner+0.5,`${tag}: the whole board on the first screen (bottom ${m.board.bottom.toFixed(0)} of ${m.inner})`);
   await shot('closed');
   // 2. the gold order's panel open
   await page.locator('#requests .requestCard.storyOrder').click();await page.waitForSelector('#orderTools:not([hidden]) .goldSay');await page.waitForTimeout(150);
   m=await layout(page);const panelH=m.panel.height;
   assert.ok(m.panel.height<=176*0.65,`${tag}: the gold panel is 35% shorter than 176 px (${m.panel.height.toFixed(1)})`);
   assert.ok(m.panel.bottom<=m.strip.top+0.5,`${tag}: the panel stays above the strip`);
   const gap2=m.board.top-m.strip.bottom;assert.ok(gap2>=6&&gap2<=10,`${tag}: panel open, board ${gap2.toFixed(1)} px under the strip`);
   assert.ok(m.say&&m.how&&m.row,`${tag}: stage and coins, How to make these, and the materials all show`);
   assert.match(await page.locator('#orderTools .goldSay').textContent(),/to build/,`${tag}: the coin progress shows`);
   assert.ok(m.say.right<=m.how.left+0.5,`${tag}: the stage line and How to make these do not overlap`);
   assert.ok(m.row.top>=Math.max(m.say.bottom,m.how.bottom)-0.5,`${tag}: the materials sit under them`);
   assert.ok(m.how.height>=44&&m.locate.length>0&&m.locate.every(h=>h>=44),`${tag}: How to make these and the generator buttons stay 44 px (${m.how.height}, ${m.locate})`);
   assert.ok(m.chips.length>0&&m.chips.every(l=>/\d of \d/.test(l)),`${tag}: each material keeps its name and count for screen readers`);
   assert.ok(m.counts.every(w=>w>8),`${tag}: each material's count shows`);
   assert.deepEqual(m.clipped,[],`${tag}: no clipped text in the panel`);
   assert.ok(m.scrollW<=m.width+1,`${tag}: no sideways scroll with the panel open`);
   if(H>=744)assert.ok(m.board.bottom<=m.inner+0.5,`${tag}: with the panel open the whole board is on the first screen (bottom ${m.board.bottom.toFixed(0)} of ${m.inner})`);
   await shot('gold');
   // 3. How to make these: the chains below the materials, the button still there to close them
   await page.locator('#orderTools .goldHow summary').click();await page.waitForSelector('#orderTools .goldHow[open]');
   m=await layout(page);
   assert.ok(m.routes&&m.routes.top>=m.row.bottom-0.5&&m.routes.bottom<=m.panel.bottom+0.5,`${tag}: the chains open inside the panel, below the materials`);
   assert.ok(m.scrollW<=m.width+1,`${tag}: no sideways scroll with the chains open`);
   await shot('how');
   await page.locator('#orderTools .goldHow summary').click();assert.equal(await page.locator('#orderTools .goldHow[open]').count(),0,`${tag}: the chains close`);
   assert.deepEqual(errors,[],`${tag}: no page errors`);await context.close();
   // 4. a new camp: the guide's hint line still shows between the strip and the board
   const fresh=await browser.newContext({viewport:{width:W,height:H},isMobile:engine==='chromium',hasTouch:true});
   const p2=await fresh.newPage();throughHome(p2);
   await p2.route(u=>!u.href.startsWith('http://127.0.0.1:'),r=>r.abort());
   await p2.route('https://sdk.crazygames.com/**',r=>r.fulfill({contentType:'application/javascript',body:STUB}));
   await p2.goto(URL);await p2.waitForSelector('#board .tile');await settle(p2);
   const n=await layout(p2);
   assert.ok(n.heading&&n.hint&&n.hint.height>0&&n.hint.top>=n.strip.bottom&&n.hint.bottom<=n.board.top,`${tag}: on a new camp the guide's line shows between the strip and the board`);
   await p2.screenshot({path:path.join(OUT,`${engine}-${W}x${H}-newcamp.png`)});await fresh.close();
   console.log(`ok ${tag}: strip→board ${gap.toFixed(1)} px, gold panel ${panelH.toFixed(1)} px`);}}
  finally{await browser.close();}
 }
 console.log('spacing browser tests passed');
})().catch(e=>{console.error(e);process.exit(1);});
