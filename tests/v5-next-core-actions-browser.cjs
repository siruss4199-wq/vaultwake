// Core actions with the Build 57y order sheet (owner, 2026-11-11: a better layout is worthless if an action
// stops working), on the CrazyGames page with a stand-in SDK, with finger taps, at 360×640, 390×664 (iPhone
// Safari), 390×844 and 430×932:
// - a generator tap makes a part (and costs 1 energy); two twins dragged together merge;
// - tapping an order marks it and shows Details; Details opens the sheet (materials, counts, generator
//   buttons, How to make these); ✕, a tap outside it and Esc each close it, the order stays tapped, the
//   backdrop is gone (display:none), and a tap on the board afterwards reaches the board;
// - a generator button in the sheet closes it and lights the right generator on the board;
// - the restoration strip (View / Build) is never covered by the closed sheet and opens the coast;
// - a part dragged onto the shed is stored, and a tap on its space brings it back;
// - Menu → Home → Continue keeps the camp.
// Screenshots: test-artifacts/v5/core-actions/<engine>-<w>x<h>-<step>.png
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const {chromium,webkit,firefox}=require('playwright');
const URL=process.env.CG_URL||'http://127.0.0.1:8080/v5/coast-crazygames.html',KEY='vaultwake-v5-coast';
const OUT=path.join(__dirname,'..','test-artifacts','v5','core-actions');fs.mkdirSync(OUT,{recursive:true});
const STUB=`window.CrazyGames={SDK:{environment:'crazygames',init:async()=>{},game:{loadingStart(){},loadingStop(){},gameplayStart(){},gameplayStop(){},happytime(){},settings:{muteAudio:false},addSettingsChangeListener(){}},ad:{requestAd(t,c){c.adError&&c.adError()}}}};`;
const camp=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures','coast','coast-ch1-pre-secondary.json'),'utf8'));
camp.daily={day:9e6,count:1};camp.energy=60;camp.energyAt=Date.now();
camp.board[26]={type:'item',family:'rope',tier:0};camp.board[27]={type:'item',family:'rope',tier:0};// twins to merge
const SIZES=(process.env.SIZES||'360x640,390x664,390x844,430x932').split(',').map(s=>s.split('x').map(Number));
const saved=page=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
const settle=async page=>{for(let k=0;k<10;k++){await page.waitForTimeout(150);
 if(await page.locator('#beat[open]').count()){await page.locator('#beatNext').tap().catch(()=>{});continue;}
 for(const d of ['#daily','#endDialog'])if(await page.locator(d+'[open]').count())await page.locator(d+' .close').tap().catch(()=>{});}};
const centre=async(page,sel)=>{const b=await page.locator(sel).first().boundingBox();return [b.x+b.width/2,b.y+b.height/2];};
const finger=async(page,sel)=>{const [x,y]=await centre(page,sel);await page.touchscreen.tap(x,y);};
async function drag(page,fromSel,toSel){const [ax,ay]=await centre(page,fromSel),[bx,by]=await centre(page,toSel);
 await page.mouse.move(ax,ay);await page.mouse.down();for(let k=1;k<=8;k++)await page.mouse.move(ax+(bx-ax)*k/8,ay+(by-ay)*k/8);await page.mouse.up();await page.waitForTimeout(300);}
const sheetState=page=>page.evaluate(()=>{const t=document.querySelector('#orderTools'),bd=document.querySelector('#sheetBackdrop');
 return {open:t.classList.contains('sheetOpen')&&getComputedStyle(t).display!=='none',backdrop:getComputedStyle(bd).display,details:!document.querySelector('#orderDetails').hidden,active:!!document.querySelector('#requests .requestCard.active')};});
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
   await page.addInitScript(([k,v])=>{if(!sessionStorage.caSeeded){localStorage.setItem(k,v);localStorage.setItem('vaultwake-v5-coast-story','{"intro":"skip"}');sessionStorage.caSeeded='1';}},[KEY,JSON.stringify(camp)]);
   await page.goto(URL);await page.waitForSelector('#homePlay:not([hidden])',{timeout:20000});await page.locator('#homePlay').tap();
   await page.waitForSelector('#home',{state:'hidden',timeout:20000});await page.waitForSelector('#board .tile');await settle(page);
   // a generator tap makes a part
   let s=await saved(page);const gen=s.board.findIndex(x=>x?.type==='source'&&x.id==='rig'),parts=b=>b.filter(x=>x?.type==='item').length,e0=s.energy,p0=parts(s.board);
   assert.ok(gen>=0,tag('a Rivet Rover on the board'));
   await finger(page,`#board [data-index="${gen}"]`);await page.waitForTimeout(400);
   s=await saved(page);assert.equal(parts(s.board),p0+1,tag('the generator made a part'));assert.equal(s.energy,e0-1,tag('for 1 energy'));
   // two twins merge
   await drag(page,'#board [data-index="26"]','#board [data-index="27"]');
   s=await saved(page);assert.equal(s.board[26],null,tag('the dragged twin left'));assert.deepEqual([s.board[27]?.family,s.board[27]?.tier],['rope',1],tag('the twins merged'));
   await settle(page);
   // an order: marked, Details, the sheet and its three ways to close
   assert.equal((await sheetState(page)).details,false,tag('no Details before an order is tapped'));
   await finger(page,'#requests .requestCard.storyOrder');await page.waitForTimeout(300);
   let st=await sheetState(page);assert.ok(st.details&&st.active&&!st.open,tag('the tapped order is marked and Details shows; no sheet yet'));
   {const sv=await saved(page),o=sv.orders.find(o=>o?.story),keys=new Set(o.needs.map(r=>r.family+r.tier)),want=sv.board.map((x,i)=>x?.type==='item'&&keys.has(x.family+x.tier)?i:-1).filter(i=>i>=0);
    const marked=await page.evaluate(()=>[...document.querySelectorAll('#board .tile.nextAction')].map(t=>+t.dataset.index));
    assert.ok(want.length>0&&want.every(i=>marked.includes(i)),tag(`the order's parts on the board are marked (${want} in ${marked})`));}
   await shot('order-tapped');
   const openSheet=async()=>{await finger(page,'#orderDetails');await page.waitForTimeout(350);const o=await sheetState(page);assert.ok(o.open&&o.backdrop==='block',tag('Details opens the sheet with its backdrop'));};
   await openSheet();
   for(const sel of ['#orderTools .goldSay','#orderTools .goldNeed','#orderTools .locate','#orderTools .goldHow summary','#orderTools .sheetClose']){
    const b=await page.locator(sel).first().boundingBox();assert.ok(b&&b.y>=0&&b.y+b.height<=H+0.5,tag(`${sel} on screen in the sheet`));}
   assert.ok((await page.locator('#orderTools .sheetClose').boundingBox()).height>=44,tag('✕ is 44 px'));
   await shot('sheet');
   await finger(page,'#orderTools .sheetClose');await page.waitForTimeout(250);st=await sheetState(page);
   assert.ok(!st.open&&st.backdrop==='none'&&st.active&&st.details,tag('✕ closes it; the order stays tapped; the backdrop is gone'));
   await openSheet();await page.touchscreen.tap(W/2,20);await page.waitForTimeout(250);st=await sheetState(page);
   assert.ok(!st.open&&st.backdrop==='none'&&st.active,tag('a tap outside closes it'));
   await openSheet();await page.keyboard.press('Escape');await page.waitForTimeout(250);st=await sheetState(page);
   assert.ok(!st.open&&st.backdrop==='none'&&st.active,tag('Esc closes it'));
   // after closing, the board takes taps again
   s=await saved(page);const loose=s.board.findIndex(x=>x?.type==='item');await finger(page,`#board [data-index="${loose}"]`);await page.waitForTimeout(250);
   assert.ok(await page.locator('#selection:not(:empty)').count(),tag('a tap on the board after closing reaches the board'));
   // a generator button in the sheet: closes it and lights the right generator
   await finger(page,'#requests .requestCard.storyOrder');await page.waitForTimeout(200);// the tile tap moved focus? tap the order again if needed
   if(!(await sheetState(page)).details){await finger(page,'#requests .requestCard.storyOrder');await page.waitForTimeout(200);}
   await openSheet();const want=await page.locator('#orderTools .locate').first().getAttribute('data-locate');
   await finger(page,'#orderTools .locate');await page.waitForTimeout(250);st=await sheetState(page);
   assert.ok(!st.open&&st.backdrop==='none',tag('a generator button closes the sheet'));
   const lit=await page.evaluate(()=>[...document.querySelectorAll('#board .tile.located')].map(t=>+t.dataset.index));
   s=await saved(page);assert.equal(lit.length,1,tag('one generator lit'));assert.equal(s.board[lit[0]]?.type,'source');assert.equal(s.board[lit[0]]?.id,want,tag(`the ${want} generator is lit`));
   await shot('located');
   // the strip is free and opens the coast
   await finger(page,'#mapButton .rsText b');await page.waitForSelector('#coastMap[open]',{timeout:3000});
   await page.locator('#coastMap .close').tap();await page.waitForSelector('#coastMap',{state:'hidden'});
   // the shed: in and out
   // on the smallest phones the shed is below the first screen (as in the live build): scroll to it as a
   // player does, and drag a part from the board's lower rows
   await page.evaluate(()=>document.querySelector('#shed').scrollIntoView({block:'end'}));await page.waitForTimeout(250);
   s=await saved(page);const lowest=[...s.board.keys()].reverse().find(i=>s.board[i]?.type==='item'),item=lowest,inShed=s.shed.filter(Boolean).length,before=s.board[item];
   {const r=await page.locator(`#board [data-index="${item}"]`).boundingBox();assert.ok(r&&r.y>=0&&r.y+r.height<=H,tag('the part and the shed are both on screen'));}
   await drag(page,`#board [data-index="${item}"]`,'#shed [data-shed-toggle]');
   s=await saved(page);assert.equal(s.board[item],null,tag('the part left the board'));assert.equal(s.shed.filter(Boolean).length,inShed+1,tag('the shed holds it'));
   const slot=s.shed.findIndex(x=>x&&x.family===before.family&&x.tier===before.tier);
   if(!(await page.locator('#shed.open').count()))await finger(page,'#shed [data-shed-toggle]');await page.waitForTimeout(250);
   await finger(page,`#shed [data-slot="${slot}"]`);await page.waitForTimeout(400);
   s=await saved(page);assert.equal(s.shed[slot],null,tag('tapping its space takes it out'));assert.ok(s.board.some(x=>x?.type==='item'&&x.family===before.family&&x.tier===before.tier),tag('it is back on the board'));
   // Menu → Home → Continue
   await page.evaluate(()=>scrollTo(0,0));
   const coins=s.coins,built=JSON.stringify(s.built),board=JSON.stringify(s.board);
   await finger(page,'#menuButton');await page.waitForSelector('#menu[open]');await finger(page,'#homeButton');await page.waitForSelector('#home:not([hidden])');
   assert.match(await page.locator('#homePlay').innerText(),/Continue/i);await page.locator('#homePlay').tap();await page.waitForSelector('#home',{state:'hidden'});await settle(page);
   s=await saved(page);assert.equal(s.coins,coins);assert.equal(JSON.stringify(s.built),built);assert.equal(JSON.stringify(s.board),board,tag('Home → Continue keeps the camp'));
   assert.deepEqual(errors,[],tag('no page errors'));console.log(`ok ${tag('generator, merge, order → Details sheet (✕, outside, Esc), board after close, find generator, strip → coast, shed in/out, Home → Continue')}`);
   await context.close();}}
  finally{await browser.close();}
 }
 console.log('core actions browser tests passed');
})().catch(e=>{console.error(e);process.exit(1);});
