// P0 (owner, 2026-11-11: "Ready to Build / Build stopped working" on a real iPhone): the whole restoration,
// end to end, through the real UI with finger taps, on the CrazyGames page with a stand-in SDK, at
// 360×640, 390×664 (iPhone Safari), 390×844 and 430×932:
//  0. a camp whose next stage (Fire up the forge, 120 coins) has neither its materials nor the coins:
//     the strip is not "Ready to build", the coast card offers no Build, and the game refuses a restore;
//  1. the gold order delivered from its card: its parts leave the board, the materials are secured,
//     its coins paid (115, still 5 short): still no Build (and a restore is still refused, for coins);
//  2. a crew order delivered: its coins paid; the strip turns "Ready to build" with Build;
//  3. the strip opened with a finger: the coast screen, the stage's card with Build;
//  4. Build tapped: 120 coins and the materials spent exactly once (a second tap spends nothing more),
//     the stage advances (1 → 2), the story beat for it shows, the strip names the next objective;
//  5. a reload (Home → Continue): coins, stage and materials are as they were after the build.
// Screenshots: test-artifacts/v5/build-flow/<engine>-<w>x<h>-<step>.png
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const {chromium,webkit,firefox}=require('playwright');
const URL=process.env.CG_URL||'http://127.0.0.1:8080/v5/coast-crazygames.html',KEY='vaultwake-v5-coast',PLACE='beach-workshop',COST=120;
const OUT=path.join(__dirname,'..','test-artifacts','v5','build-flow');fs.mkdirSync(OUT,{recursive:true});
const STUB=`window.CrazyGames={SDK:{environment:'crazygames',init:async()=>{},game:{loadingStart(){},loadingStop(){},gameplayStart(){},gameplayStop(){},happytime(){},settings:{muteAudio:false},addSettingsChangeListener(){}},ad:{requestAd(t,c){c.adError&&c.adError()}}}};`;
// The chapter-1 camp: the forge (beach-workshop stage 2) is next; its gold order o16 wants a level-4 Survey scope
// (chart 3) and two level-4 Pocket winches (rig 3). No materials ready anywhere (the mast's are taken back),
// no coins; the gold order's parts and crew order o13's parts (chart 1 + rig 1, 10 coins) laid in empty cells.
const camp=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures','coast','coast-ch1-pre-secondary.json'),'utf8'));
camp.daily={day:9e6,count:1};camp.coins=0;camp.materials['beach-mast']=camp.built['beach-mast'];
camp.board[15]={type:'item',family:'chart',tier:3};camp.board[16]={type:'item',family:'rig',tier:3};camp.board[19]={type:'item',family:'rig',tier:3};
camp.board[20]={type:'item',family:'chart',tier:1};camp.board[21]={type:'item',family:'rig',tier:1};
const SIZES=(process.env.SIZES||'360x640,390x664,390x844,430x932').split(',').map(s=>s.split('x').map(Number));
const saved=page=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
// the game's own rule, on a copy of the saved camp: does a restore of the place go through?
const tryRestore=page=>page.evaluate(async([k,id])=>{const {load,act}=await import('/v5/next/game.mjs');const r=load(localStorage.getItem(k),Date.now());const s=r.state??r;const before=s.coins;const res=act(s,{type:'restore',id});return {ok:!!res.ok,message:res.message??null,coinsAfter:s.coins,before};},[KEY,PLACE]);
const settle=async page=>{for(let k=0;k<10;k++){await page.waitForTimeout(150);
 if(await page.locator('#beat[open]').count()){await page.locator('#beatNext').tap().catch(()=>{});continue;}
 for(const d of ['#daily','#endDialog'])if(await page.locator(d+'[open]').count())await page.locator(d+' .close').tap().catch(()=>{});}};
(async()=>{
 const engines=(process.env.ENGINES||'chromium,webkit').split(',').map(e=>[e,{chromium,webkit,firefox}[e]]);
 for(const [engine,type] of engines){
  let browser;try{browser=await type.launch();}catch(e){if(engine!=='chromium'&&/Executable doesn't exist/.test(e.message)){console.log(`${engine}: not installed here, skipped`);continue;}throw e;}
  try{for(const [W,H] of SIZES){
   const tag=s=>`${engine} ${W}×${H}: ${s}`;
   const context=await browser.newContext({viewport:{width:W,height:H},isMobile:engine==='chromium',hasTouch:true});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   const shot=n=>page.screenshot({path:path.join(OUT,`${engine}-${W}x${H}-${n}.png`)});
   await page.route(u=>!u.href.startsWith('http://127.0.0.1:'),r=>r.abort());
   await page.route('https://sdk.crazygames.com/**',r=>r.fulfill({contentType:'application/javascript',body:STUB}));
   await page.addInitScript(([k,v])=>{if(!sessionStorage.bfSeeded){localStorage.setItem(k,v);localStorage.setItem('vaultwake-v5-coast-story','{"intro":"skip"}');sessionStorage.bfSeeded='1';}},[KEY,JSON.stringify(camp)]);
   await page.goto(URL);await page.waitForSelector('#homePlay:not([hidden])',{timeout:20000});await page.locator('#homePlay').tap();
   await page.waitForSelector('#home',{state:'hidden',timeout:20000});await page.waitForSelector('#board .tile');await settle(page);
   const strip=()=>page.locator('#mapButton').innerText();
   // 0. nothing ready: no Build anywhere, and the rule refuses
   let s=await saved(page);assert.equal(s.coins,0);assert.equal(s.built[PLACE],1);assert.ok(!(s.materials[PLACE]>s.built[PLACE]),tag('no materials yet'));
   assert.doesNotMatch(await strip(),/Ready to build/,tag('the strip is not ready'));
   await page.locator('#mapButton').tap();await page.waitForSelector('#coastMap[open]');await page.waitForTimeout(300);
   assert.equal(await page.locator('#coastMap [data-restore]').count(),0,tag('no Build on the coast without materials or coins'));
   await page.locator('#coastMap .close').tap();await page.waitForSelector('#coastMap',{state:'hidden'});
   let r=await tryRestore(page);assert.equal(r.ok,false,tag('a restore is refused without materials'));assert.match(r.message,/materials/,tag('…for its materials'));assert.equal(r.coinsAfter,0);
   await shot('0-not-ready');
   // 1. the gold order: deliver from its card
   const gold=page.locator('#requests .requestCard.storyOrder');assert.match(await gold.innerText(),/Deliver/i,tag('the gold order can be delivered'));
   await gold.tap();await page.waitForTimeout(1600);await settle(page);
   s=await saved(page);assert.equal(s.materials[PLACE],2,tag('the forge\'s materials are secured'));assert.equal(s.coins,115,tag('the gold order paid 115'));
   assert.ok(![15,16,19].some(i=>s.board[i]?.family&&s.board[i].tier===3),tag('its parts left the board'));
   assert.doesNotMatch(await strip(),/Ready to build/,tag('5 coins short: not ready'));
   await page.locator('#mapButton').tap();await page.waitForSelector('#coastMap[open]');await page.waitForTimeout(300);
   assert.equal(await page.locator(`#coastMap [data-restore="${PLACE}"]`).count(),0,tag('no Build while 5 coins short'));
   assert.match(await page.locator('#mapCard').innerText(),/Earn 5 more/,tag('the card says what is missing'));
   await page.locator('#coastMap .close').tap();await page.waitForSelector('#coastMap',{state:'hidden'});
   r=await tryRestore(page);assert.equal(r.ok,false,tag('a restore is refused without the coins'));assert.match(r.message,/coins/);assert.equal(r.coinsAfter,115);
   await shot('1-gold-delivered');
   // 2. a crew order: deliver from its card
   const crew=page.locator('#requests [data-order="o13"]');assert.match(await crew.innerText(),/Deliver/i,tag('the crew order can be delivered'));
   await crew.tap();await page.waitForTimeout(1600);await settle(page);
   s=await saved(page);assert.equal(s.coins,125,tag('the crew order paid 10'));
   await page.waitForFunction(()=>/Ready to build/.test(document.querySelector('#mapButton').innerText),null,{timeout:4000});
   assert.equal(await page.locator('#mapButton .rsAction').innerText(),'Build',tag('the strip says Build'));
   await shot('2-ready');
   // 3. the strip, with a finger
   const b=await page.locator('#mapButton .rsText b').boundingBox();await page.touchscreen.tap(b.x+b.width*0.6,b.y+b.height/2);
   await page.waitForSelector('#coastMap[open]',{timeout:3000});await page.waitForTimeout(500);
   const build=page.locator(`#coastMap [data-restore="${PLACE}"]`);assert.equal(await build.count(),1,tag('the coast shows the forge\'s Build'));
   assert.match(await build.innerText(),/Build\s*·\s*120/,tag('Build names its 120 coins'));
   await build.evaluate(e=>e.scrollIntoView({block:'center'}));await page.waitForTimeout(300);await shot('3-coast');// the Build button pulses: scrolled, not waited for
   // 4. Build, once; a second tap spends nothing more
   const box=await build.boundingBox();await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);await page.waitForTimeout(200);
   s=await saved(page);assert.equal(s.built[PLACE],2,tag('the stage advanced 1 → 2'));assert.equal(s.coins,125-COST,tag('120 coins spent'));
   assert.ok(!(s.materials[PLACE]>s.built[PLACE]),tag('the materials were used'));
   const again=page.locator(`#coastMap [data-restore="${PLACE}"]`);if(await again.count()){const bb=await again.boundingBox();if(bb)await page.touchscreen.tap(bb.x+bb.width/2,bb.y+bb.height/2);}
   await page.waitForTimeout(400);s=await saved(page);assert.equal(s.built[PLACE],2,tag('no second build'));assert.equal(s.coins,5,tag('nothing spent twice'));
   // First Session 2.0: the stage's lines, rewards and next objective are a card under the coast picture (no dialog over it)
   await page.waitForSelector('#coastMap .restoredCard',{timeout:4000});assert.equal(await page.locator('#beat[open]').count(),0,tag('no story dialog over the restored place'));
   assert.match(await page.locator('#coastMap .restoredCard').innerText(),/forge|Workshop|workshop/i,tag('the forge\'s story line'));await shot('4-built');
   await settle(page);if(await page.locator('#coastMap[open]').count())await page.locator('#coastMap .close').tap();await page.waitForTimeout(300);
   assert.doesNotMatch(await strip(),/Fire up the forge/,tag('the strip moved on from the built stage'));
   assert.ok(s.orders.some(o=>o?.story),tag('a gold order for the next objective'));
   const next=await strip();await shot('5-next');
   // 5. Home → Continue: as it was
   await page.reload();await page.waitForSelector('#homePlay:not([hidden])',{timeout:20000});assert.match(await page.locator('#homePlay').innerText(),/Continue/i);
   await page.locator('#homePlay').tap();await page.waitForSelector('#home',{state:'hidden',timeout:20000});await settle(page);
   s=await saved(page);assert.equal(s.built[PLACE],2,tag('the stage is kept'));assert.equal(s.coins,5,tag('the coins are kept'));assert.ok(!(s.materials[PLACE]>s.built[PLACE]),tag('no materials came back'));
   assert.equal(await strip(),next,tag('the same next objective after the reload'));
   assert.deepEqual(errors,[],tag('no page errors'));console.log(`ok ${tag('not ready → gold → crew → Ready to build → coast → Build once → stage 2 → next → reload')}`);
   await context.close();}}
  finally{await browser.close();}
 }
 console.log('build flow browser tests passed');
})().catch(e=>{console.error(e);process.exit(1);});
