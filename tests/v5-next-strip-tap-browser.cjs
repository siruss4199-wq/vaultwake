// The restoration strip opens the coast with a finger tap (owner, real iPhone, 2026-11-11: "Ready to build"
// did not open during the guide). On the CrazyGames page with a stand-in SDK, with the iPhone 13 profile
// (390 × 664, touch; WebKit is the closest to iOS Safari, Chromium alongside):
// 1. a new camp (First Session 2.0: straight onto the board) through the Adaptive tutorial, through the real UI,
//    to its "Tap the coast strip" step;
//    a touch on the strip's text ("Ready to build"), where the owner tapped, opens the coast screen;
// 2. a played camp whose stage is ready: touches on the strip's text and on its Build pill open the coast.
// What is under the finger is printed, so a failure says what took the tap.
// Screenshots: test-artifacts/v5/strip-tap/<engine>-<case>.png
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const {chromium,webkit,firefox,devices}=require('playwright');
const URL=process.env.CG_URL||'http://127.0.0.1:8080/v5/coast-crazygames.html',KEY='vaultwake-v5-coast';
const OUT=path.join(__dirname,'..','test-artifacts','v5','strip-tap');fs.mkdirSync(OUT,{recursive:true});
const STUB=`window.CrazyGames={SDK:{environment:'crazygames',init:async()=>{},game:{loadingStart(){},loadingStop(){},gameplayStart(){},gameplayStop(){},happytime(){},settings:{muteAudio:false},addSettingsChangeListener(){}},ad:{requestAd(t,c){c.adError&&c.adError()}}}};`;
const camp=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures','coast','coast-ch1-pre-secondary.json'),'utf8'));camp.daily={day:9e6,count:1};
const phone=engine=>{const d={...devices['iPhone 13']};delete d.defaultBrowserType;if(engine!=='webkit'){d.isMobile=true;}return d;};
async function open(browser,engine,seed){
 const context=await browser.newContext(phone(engine));const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.route(u=>!u.href.startsWith('http://127.0.0.1:'),r=>r.abort());
 await page.route('https://sdk.crazygames.com/**',r=>r.fulfill({contentType:'application/javascript',body:STUB}));
 if(seed)await page.addInitScript(([k,v])=>{if(!sessionStorage.tapSeeded){localStorage.setItem(k,v);localStorage.setItem('vaultwake-v5-coast-story','{"intro":"skip"}');sessionStorage.tapSeeded='1';}},[KEY,JSON.stringify(seed)]);
 await page.goto(URL);if(seed)await page.waitForSelector('#homePlay:not([hidden])',{timeout:20000});else await page.waitForFunction(()=>document.querySelector('#home').hidden,null,{timeout:30000});
 return {context,page,errors};
}
// a finger tap at the middle of a part of the strip; returns what was under it
async function tapStrip(page,sel,tag){
 const p=await page.evaluate(sel=>{const e=document.querySelector(sel),r=e.getBoundingClientRect(),x=r.left+r.width*(sel.endsWith('b')?0.6:0.5),y=r.top+r.height/2,h=document.elementFromPoint(x,y);
  return {x,y,hit:h?`${h.tagName.toLowerCase()}${h.id?'#'+h.id:''}${typeof h.className==='string'&&h.className?'.'+h.className.trim().split(/\s+/).join('.'):''}`:null,inStrip:!!h&&document.querySelector('#mapButton').contains(h),stack:document.elementsFromPoint(x,y).slice(0,5).map(n=>n.tagName.toLowerCase()+(n.id?'#'+n.id:'')+(typeof n.className==='string'&&n.className?'.'+n.className.trim().split(/\s+/)[0]:''))};},sel);
 console.log(`${tag}: finger at ${p.x.toFixed(0)},${p.y.toFixed(0)} on ${p.hit} (top of stack: ${p.stack.join(' > ')})`);
 assert.ok(p.inStrip,`${tag}: the finger lands on the strip, not ${p.hit}`);
 await page.touchscreen.tap(p.x,p.y);
 await page.waitForSelector('#coastMap[open]',{timeout:3000}).catch(()=>{});
 return page.locator('#coastMap[open]').count();
}
(async()=>{
 const engines=(process.env.ENGINES||'chromium,webkit').split(',').map(e=>[e,{chromium,webkit,firefox}[e]]);
 for(const [engine,type] of engines){
  let browser;try{browser=await type.launch();}catch(e){if(engine!=='chromium'&&/Executable doesn't exist/.test(e.message)){console.log(`${engine}: not installed here, skipped`);continue;}throw e;}
  try{
   // 1. the guide's step
   {const {context,page,errors}=await open(browser,engine,null),tag=`${engine} guide`;
    await page.waitForTimeout(400);
    const cell=i=>page.locator(`#board [data-index="${i}"]`);
    const drag=async(a,b)=>{const ra=await a.boundingBox(),rb=await b.boundingBox();await page.mouse.move(ra.x+ra.width/2,ra.y+ra.height/2);await page.mouse.down();await page.mouse.move(rb.x+rb.width/2,rb.y+rb.height/2,{steps:6});await page.mouse.up();await page.waitForTimeout(220);};
    let reached=false;
    for(let n=0;n<160&&!reached;n++){
     // the guide's short notes take the line for a few seconds (no step then)
     const st=await page.evaluate(()=>VWGuide.step);if(!st){await page.waitForTimeout(400);continue;}const t=st.target;
     if(st.kind==='build')reached=true;
     else if(t?.kind==='cell')await cell(t.index).tap();
     else if(t?.kind==='pair')await drag(cell(t.cells[0]),cell(t.cells[1]));
     else if(t?.kind==='order'){await page.locator(`#requests [data-order="${t.id}"]`).tap();await page.waitForTimeout(1200);}
     await page.waitForTimeout(120);}
    assert.ok(reached,`${tag}: the guide reaches "Tap the coast strip"`);
    assert.match(await page.locator('#hint').innerText(),/Tap the coast strip/);
    await page.waitForTimeout(700);await page.screenshot({path:path.join(OUT,`${engine}-guide-before.png`)});
    const opened=await tapStrip(page,'#mapButton .rsText b',`${tag}: "Ready to build"`);
    await page.screenshot({path:path.join(OUT,`${engine}-guide-after.png`)});
    assert.equal(opened,1,`${tag}: a finger tap on "Ready to build" opens the coast`);
    assert.deepEqual(errors,[],`${tag}: no page errors`);console.log(`ok ${tag}`);await context.close();}
   // 2. a played camp with a ready stage: the text and the Build pill
   for(const [sel,what] of [['#mapButton .rsText b','"Ready to build"'],['#mapButton .rsAction','the Build pill']]){
    const {context,page,errors}=await open(browser,engine,camp),tag=`${engine} played camp, ${what}`;
    await page.locator('#homePlay').tap();await page.waitForSelector('#home',{state:'hidden',timeout:20000});await page.waitForTimeout(1500);
    for(let n=0;n<6&&await page.locator('#beat[open]').count();n++){await page.locator('#beatNext').tap();await page.waitForTimeout(150);}
    for(const d of ['#daily','#endDialog'])if(await page.locator(d+'[open]').count())await page.locator(d+' .close').tap();
    assert.match(await page.locator('#mapButton').innerText(),/Ready to build/,`${tag}: the strip says Ready to build`);
    const opened=await tapStrip(page,sel,tag);
    assert.equal(opened,1,`${tag}: a finger tap opens the coast`);
    assert.deepEqual(errors,[],`${tag}: no page errors`);console.log(`ok ${tag}`);await context.close();}
  }finally{await browser.close();}
 }
 console.log('strip tap browser tests passed');
})().catch(e=>{console.error(e);process.exit(1);});
