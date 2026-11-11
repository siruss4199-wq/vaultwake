// P0 (owner's iPhone on the Cloudflare preview, 2026-11-11: "Build and Details do not respond"). Root cause:
// the real CrazyGames SDK v3, loaded by v5/coast-crazygames.html, makes SDK.game / ad / data / user getters
// THROW while it is not initialised ("sdkNotInitialized": a preview, or the first seconds on CrazyGames) and
// on a domain that is not CrazyGames ("sdkDisabled"). Every sound asked platform.muted() for SDK.game first,
// so a tap whose handler played a sound before acting (the restoration strip, Details) threw and did
// nothing. The stand-in SDKs of the other tests never throw, so they could not see it.
// Here the stand-in throws exactly as the real one does, in both states, and the core actions are done
// with finger taps at the visible centre of each control, at 390×664 (iPhone Safari) and 360×640:
// the Build pill opens the coast (what is under the finger is checked to be the strip); Build spends the
// coins and the materials once and advances the stage; Details opens the sheet and ✕ closes it; a
// generator makes a part; twins merge; a reload keeps it all. No page error.
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const {chromium,webkit,firefox}=require('playwright');
const URL=process.env.CG_URL||'http://127.0.0.1:8080/v5/coast-crazygames.html',KEY='vaultwake-v5-coast';
const OUT=path.join(__dirname,'..','test-artifacts','v5','sdk-not-ready');fs.mkdirSync(OUT,{recursive:true});
// The real SDK's behaviour (crazygames-sdk-v3.js): its modules are getters that throw an error object.
const stub=state=>`(()=>{const code=${JSON.stringify(state)},msg=code==='sdkDisabled'?'CrazySDK is disabled on this domain.':'CrazySDK is not initialized yet.';
 const no=()=>{throw {code,message:msg};};
 class SDK{get environment(){return code==='sdkDisabled'?'disabled':'uninitialized';}
  init(){return code==='sdkDisabled'?Promise.resolve():new Promise(()=>{});}
  get game(){return no();}get ad(){return no();}get data(){return no();}get user(){return no();}get banner(){return no();}get analytics(){return no();}}
 window.CrazyGames={SDK:new SDK()};})();`;
// The chapter-1 camp: the signal flags (beach-mast stage 2, 120 coins) are ready to build; two twins to merge.
const camp=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures','coast','coast-ch1-pre-secondary.json'),'utf8'));
camp.daily={day:9e6,count:1};camp.energy=60;camp.energyAt=Date.now();
camp.board[26]={type:'item',family:'rope',tier:0};camp.board[27]={type:'item',family:'rope',tier:0};
const SIZES=(process.env.SIZES||'390x664,360x640').split(',').map(s=>s.split('x').map(Number));
const saved=page=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
const settle=async page=>{for(let k=0;k<10;k++){await page.waitForTimeout(150);
 if(await page.locator('#beat[open]').count()){await page.locator('#beatNext').tap().catch(()=>{});continue;}
 for(const d of ['#daily','#endDialog'])if(await page.locator(d+'[open]').count())await page.locator(d+' .close').tap().catch(()=>{});}};
// a finger at the visible centre of a control; the element under it must be the control or inside it
async function finger(page,sel,within,tag){
 const p=await page.evaluate(([sel,within])=>{const e=document.querySelector(sel),r=e.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,h=document.elementFromPoint(x,y);
  return {x,y,hit:h?h.tagName.toLowerCase()+(h.id?'#'+h.id:'')+(typeof h.className==='string'&&h.className?'.'+h.className.trim().split(/\s+/)[0]:''):null,ok:!!h&&!!document.querySelector(within)?.contains(h)};},[sel,within]);
 assert.ok(p.ok,`${tag}: the finger at the centre of ${sel} lands inside ${within}, not on ${p.hit}`);
 await page.touchscreen.tap(p.x,p.y);
}
(async()=>{
 const engines=(process.env.ENGINES||'chromium,webkit').split(',').map(e=>[e,{chromium,webkit,firefox}[e]]);
 for(const [engine,type] of engines){
  let browser;try{browser=await type.launch();}catch(e){if(engine!=='chromium'&&/Executable doesn't exist/.test(e.message)){console.log(`${engine}: not installed here, skipped`);continue;}throw e;}
  try{for(const state of ['sdkNotInitialized','sdkDisabled'])for(const [W,H] of SIZES){
   const tag=s=>`${engine} ${state} ${W}×${H}: ${s}`;
   const context=await browser.newContext({viewport:{width:W,height:H},isMobile:engine==='chromium',hasTouch:true});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e?.message??e)));
   await page.route(u=>!u.href.startsWith('http://127.0.0.1:'),r=>r.abort());
   await page.route('https://sdk.crazygames.com/**',r=>r.fulfill({contentType:'application/javascript',body:stub(state)}));
   await page.addInitScript(([k,v])=>{if(!sessionStorage.snSeeded){localStorage.setItem(k,v);localStorage.setItem('vaultwake-v5-coast-story','{"intro":"skip"}');sessionStorage.snSeeded='1';}},[KEY,JSON.stringify(camp)]);
   await page.goto(URL);await page.waitForSelector('#homePlay:not([hidden])',{timeout:30000});await page.locator('#homePlay').tap();
   await page.waitForSelector('#home',{state:'hidden',timeout:30000});await page.waitForSelector('#board .tile');await settle(page);
   assert.equal(await page.evaluate(()=>{try{CrazyGames.SDK.game;return 'no throw';}catch(e){return e.code;}}),state,tag('the stand-in throws like the real SDK'));
   // the Build pill: coast, then Build once
   assert.match(await page.locator('#mapButton').innerText(),/Ready to build/);
   await finger(page,'#mapButton .rsAction','#mapButton',tag('Build pill'));await page.waitForSelector('#coastMap[open]',{timeout:3000});
   let s=await saved(page);const coins=s.coins;assert.equal(s.built['beach-mast'],1);
   const build=page.locator('#coastMap [data-restore="beach-mast"]');assert.equal(await build.count(),1,tag('Build on the coast'));
   await build.evaluate(e=>e.scrollIntoView({block:'center'}));await page.waitForTimeout(300);
   await finger(page,'#coastMap [data-restore="beach-mast"]','#coastMap [data-restore="beach-mast"]',tag('Build'));await page.waitForTimeout(300);
   s=await saved(page);assert.equal(s.built['beach-mast'],2,tag('the stage advanced'));assert.equal(s.coins,coins-120,tag('120 coins spent once'));
   await page.waitForTimeout(400);s=await saved(page);assert.equal(s.coins,coins-120,tag('nothing spent twice'));
   await page.screenshot({path:path.join(OUT,`${engine}-${state}-${W}x${H}-built.png`)});
   await settle(page);if(await page.locator('#coastMap[open]').count())await page.locator('#coastMap .close').tap();await page.waitForTimeout(250);
   // Details: open, close
   await finger(page,'#requests .requestCard.storyOrder','#requests',tag('gold order card'));await page.waitForTimeout(300);
   await finger(page,'#orderDetails','#orderDetails',tag('Details'));await page.waitForSelector('#orderTools.sheetOpen',{timeout:3000});
   await page.screenshot({path:path.join(OUT,`${engine}-${state}-${W}x${H}-details.png`)});
   await finger(page,'#orderTools .sheetClose','#orderTools',tag('✕'));await page.waitForSelector('#sheetBackdrop',{state:'hidden'});
   // a generator and a merge (each plays a sound)
   s=await saved(page);const gen=s.board.findIndex(x=>x?.type==='source'&&x.id==='rig'),n=s.board.filter(x=>x?.type==='item').length;
   await finger(page,`#board [data-index="${gen}"]`,'#board',tag('generator'));await page.waitForTimeout(400);
   s=await saved(page);assert.equal(s.board.filter(x=>x?.type==='item').length,n+1,tag('the generator made a part'));
   {const a=await page.locator('#board [data-index="26"]').boundingBox(),b=await page.locator('#board [data-index="27"]').boundingBox();
    await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();for(let k=1;k<=8;k++)await page.mouse.move(a.x+a.width/2+(b.x-a.x)*k/8,a.y+a.height/2+(b.y-a.y)*k/8);await page.mouse.up();await page.waitForTimeout(300);}
   s=await saved(page);assert.deepEqual([s.board[26],s.board[27]?.tier],[null,1],tag('the twins merged'));
   // a reload keeps it
   await page.reload();await page.waitForSelector('#homePlay:not([hidden])',{timeout:30000});await page.locator('#homePlay').tap();await page.waitForSelector('#home',{state:'hidden',timeout:30000});
   s=await saved(page);assert.equal(s.built['beach-mast'],2);assert.equal(s.coins,coins-120,tag('kept after a reload'));
   assert.deepEqual(errors,[],tag('no page error'));console.log(`ok ${tag('Build pill → coast → Build once, Details open/close, generator, merge, reload')}`);
   await context.close();}}
  finally{await browser.close();}
 }
 console.log('sdk not ready browser tests passed');
})().catch(e=>{console.error(e);process.exit(1);});
