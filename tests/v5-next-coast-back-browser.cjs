// Owner, real iPhone (2026-11-11, PR #103): the coast screen needs long scrolls, and once scrolled down to the map, a
// stage's card or Build, the way back to the board had scrolled away (its × was position:absolute inside the scrolling
// #coastMap). Build 57y4 keeps the header (place, coins, ×) at the top and the × fixed over its right corner.
// With finger taps, at 360×640, 390×664 and 390×844, in Chromium and WebKit (iPhone Safari's engine):
//  1. the coast opened from the strip, scrolled to the middle (Build in view) and to the bottom: the × is on screen, at
//     least 44×44, the element under its centre is the × itself, and it sits inside the header band (content scrolls
//     under the header, so the × covers no Build button, card or marker); Build in view is the element under its own
//     centre;
//  2. a finger on the × closes the coast at once (the dialog is closed by the next frame), the board shows, the page's
//     scroll position and the saved camp are as before, and no board picture is redrawn (no flicker);
//  3. the bottom "Back to the board" still closes it;
//  4. Build from the scrolled coast still works once (stage 1 → 2, 120 coins), then the × returns to the board, and
//     a reload keeps it. No page error.
// Screenshots: test-artifacts/v5/coast-back/<engine>-<w>x<h>-<where>.png
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const {chromium,webkit,firefox}=require('playwright');
const URL=process.env.CG_URL||'http://127.0.0.1:8080/v5/coast-crazygames.html',KEY='vaultwake-v5-coast';
const OUT=path.join(__dirname,'..','test-artifacts','v5','coast-back');fs.mkdirSync(OUT,{recursive:true});
const STUB=`window.CrazyGames={SDK:{environment:'crazygames',init:async()=>{},game:{loadingStart(){},loadingStop(){},gameplayStart(){},gameplayStop(){},happytime(){},settings:{muteAudio:false},addSettingsChangeListener(){}},ad:{requestAd(t,c){c.adError&&c.adError()}}}};`;
// the chapter-1 camp: the signal flags (beach-mast stage 2, 120 coins) are ready to build
const camp=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures','coast','coast-ch1-pre-secondary.json'),'utf8'));
camp.daily={day:9e6,count:1};camp.energy=60;camp.energyAt=Date.now();
const SIZES=(process.env.SIZES||'360x640,390x664,390x844').split(',').map(s=>s.split('x').map(Number));
const saved=page=>page.evaluate(k=>localStorage.getItem(k),KEY);
const settle=async page=>{for(let k=0;k<10;k++){await page.waitForTimeout(150);
 if(await page.locator('#beat[open]').count()){await page.locator('#beatNext').tap().catch(()=>{});continue;}
 for(const d of ['#daily','#endDialog'])if(await page.locator(d+'[open]').count())await page.locator(d+' .close').tap().catch(()=>{});}};
// the finger at the visible centre of a control; what is under it must be the control or inside it
async function finger(page,sel,tag){
 const p=await page.evaluate(sel=>{const e=document.querySelector(sel);if(!e)return null;const r=e.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,h=document.elementFromPoint(x,y);
  return {x,y,ok:!!h&&(h===e||e.contains(h)),hit:h?h.tagName.toLowerCase()+(h.className&&typeof h.className==='string'?'.'+h.className.split(' ')[0]:''):null};},sel);
 assert.ok(p,`${tag}: ${sel} exists`);assert.ok(p.ok,`${tag}: the finger at the centre of ${sel} lands on it, not on ${p.hit}`);await page.touchscreen.tap(p.x,p.y);
}
async function openCoast(page,tag){await finger(page,'#mapButton',tag+': strip');await page.waitForSelector('#coastMap[open]',{timeout:3000});await page.waitForTimeout(500);}
// scroll the coast screen to a part (as a finger would, the screen's own scroll), then check the ×
async function scrollCoast(page,where){await page.evaluate(w=>{const d=document.querySelector('#coastMap'),max=d.scrollHeight-d.clientHeight;d.scrollTop=w==='bottom'?max:w==='middle'?Math.round(max/2):0;},where);await page.waitForTimeout(250);
 return page.evaluate(()=>{const d=document.querySelector('#coastMap');return {top:d.scrollTop,max:d.scrollHeight-d.clientHeight};});}
const xState=page=>page.evaluate(()=>{const x=document.querySelector('#coastMap>.close'),r=x.getBoundingClientRect(),h=document.querySelector('#coastMap .beachTop').getBoundingClientRect(),
 e=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return {x:r.left,y:r.top,w:r.width,h:r.height,onScreen:r.top>=0&&r.left>=0&&r.bottom<=innerHeight&&r.right<=innerWidth,
 hitSelf:e===x||x.contains(e),inHeader:r.top>=h.top-1&&r.bottom<=h.bottom+1,headerTop:h.top,headerBottom:h.bottom};});
async function closeWithX(page,tag,before){
 await page.evaluate(()=>{for(const i of document.querySelectorAll('#board img'))i.__cbOld=1;});
 const p=await page.evaluate(()=>{const r=document.querySelector('#coastMap>.close').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};});
 await page.touchscreen.tap(p.x,p.y);
 const after=await page.evaluate(()=>new Promise(res=>requestAnimationFrame(()=>res({open:document.querySelector('#coastMap').open,y:scrollY,boardShown:document.querySelector('#board').getBoundingClientRect().height>0,newImgs:[...document.querySelectorAll('#board img')].filter(i=>!i.__cbOld).length}))));
 assert.equal(after.open,false,`${tag}: the × closes the coast by the next frame`);assert.ok(after.boardShown,`${tag}: the board shows`);
 assert.equal(after.y,before.y,`${tag}: the board's scroll position is kept (${before.y})`);assert.equal(after.newImgs,0,`${tag}: no board picture is redrawn`);
 assert.equal(await saved(page),before.save,`${tag}: the camp is unchanged`);
}
(async()=>{
 const engines=(process.env.ENGINES||'chromium,webkit').split(',').map(e=>[e,{chromium,webkit,firefox}[e]]);
 for(const [engine,type] of engines){
  let browser;try{browser=await type.launch();}catch(e){if(engine!=='chromium'&&/Executable doesn't exist/.test(e.message)){console.log(`${engine}: not installed here, skipped`);continue;}throw e;}
  try{for(const [W,H] of SIZES){
   const tag=s=>`${engine} ${W}×${H}: ${s}`,shot=n=>page.screenshot({path:path.join(OUT,`${engine}-${W}x${H}-${n}.png`)});
   const context=await browser.newContext({viewport:{width:W,height:H},isMobile:engine==='chromium',hasTouch:true});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e?.message??e)));
   await page.route(u=>!u.href.startsWith('http://127.0.0.1:'),r=>r.abort());
   await page.route('https://sdk.crazygames.com/**',r=>r.fulfill({contentType:'application/javascript',body:STUB}));
   await page.addInitScript(([k,v])=>{if(!sessionStorage.cbSeeded){localStorage.setItem(k,v);localStorage.setItem('vaultwake-v5-coast-story','{"intro":"skip"}');sessionStorage.cbSeeded='1';}},[KEY,JSON.stringify(camp)]);
   await page.goto(URL);await page.waitForSelector('#homePlay:not([hidden])',{timeout:30000});await page.locator('#homePlay').tap();
   await page.waitForSelector('#home',{state:'hidden',timeout:30000});await page.waitForSelector('#board .tile');await settle(page);
   // the board page scrolled a little (the strip still under the finger), to check the position is kept
   await page.evaluate(()=>scrollTo(0,Math.min(24,document.scrollingElement.scrollHeight-innerHeight)));await page.waitForTimeout(200);
   const before={y:await page.evaluate(()=>scrollY),save:await saved(page)};
   // 1–2. middle and bottom, back with the ×
   for(const where of ['middle','bottom']){
    await openCoast(page,tag(where));const sc=await scrollCoast(page,where);assert.ok(sc.max>0,tag('the coast screen scrolls'));
    const x=await xState(page);
    assert.ok(x.onScreen,tag(`${where}: the × is on screen (${x.x},${x.y})`));assert.ok(x.w>=44&&x.h>=44,tag(`${where}: the × is at least 44×44 (${x.w}×${x.h})`));
    assert.ok(x.hitSelf,tag(`${where}: the finger at the ×'s centre lands on the ×`));assert.ok(x.inHeader,tag(`${where}: the × sits in the header band, over no content`));
    if(where==='middle'){const b=await page.evaluate(()=>{const e=document.querySelector('#coastMap [data-restore]');if(!e)return null;const r=e.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return 'off';const h=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return h===e||e.contains(h);},);
     if(b!=='off'&&b!==null)assert.equal(b,true,tag('middle: Build in view is not covered'));}
    await shot(where);await closeWithX(page,tag(`${where}: ×`),before);await page.waitForTimeout(300);
   }
   // 3. the bottom "Back to the board" stays
   await openCoast(page,tag('bottom button'));await scrollCoast(page,'bottom');
   await finger(page,'#coastMap [data-back]',tag('Back to the board'));await page.waitForSelector('#coastMap',{state:'hidden',timeout:2000});
   assert.equal(await page.evaluate(()=>scrollY),before.y,tag('Back to the board keeps the board position'));
   // 4. Build from the scrolled coast, once; then × back; a reload keeps it
   let s=JSON.parse(await saved(page));const coins=s.coins;assert.equal(s.built['beach-mast'],1);
   await openCoast(page,tag('build'));await page.evaluate(()=>document.querySelector('#coastMap [data-restore="beach-mast"]').scrollIntoView({block:'center'}));await page.waitForTimeout(300);
   await finger(page,'#coastMap [data-restore="beach-mast"]',tag('Build'));await page.waitForTimeout(400);
   s=JSON.parse(await saved(page));assert.equal(s.built['beach-mast'],2,tag('the stage advanced'));assert.equal(s.coins,coins-120,tag('120 coins spent once'));
   await settle(page);if(await page.locator('#coastMap[open]').count()){await scrollCoast(page,'bottom');const x=await xState(page);assert.ok(x.onScreen&&x.hitSelf,tag('after Build the × is still there'));
    await page.touchscreen.tap(x.x+x.w/2,x.y+x.h/2);await page.waitForSelector('#coastMap',{state:'hidden',timeout:2000});}
   await page.reload();await page.waitForSelector('#homePlay:not([hidden])',{timeout:30000});await page.locator('#homePlay').tap();await page.waitForSelector('#home',{state:'hidden',timeout:30000});
   s=JSON.parse(await saved(page));assert.equal(s.built['beach-mast'],2);assert.equal(s.coins,coins-120,tag('kept after a reload'));
   assert.deepEqual(errors,[],tag('no page error'));console.log(`ok ${tag('× visible at the middle and bottom, back at once; Back to the board; Build once; reload')}`);
   await context.close();}}
  finally{await browser.close();}
 }
 console.log('coast back browser tests passed');
})().catch(e=>{console.error(e);process.exit(1);});
