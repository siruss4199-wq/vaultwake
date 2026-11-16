// Stable gameplay viewport (2026-11-15, owner): selecting or deselecting an order never moves the board (the row with
// Hint and Details sits below the board outside the tutorial; the tutorial's guide row above it is there all along),
// Details still opens the bottom sheet, and the new player's story caption never covers a board cell or a control.
// Finger taps at the element's centre (as a player), 360×640, 375×667, 390×664, 390×844, 430×932 and 907×510.
// ENGINES (default chromium,webkit), VIEWPORTS.
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const {chromium,webkit}=require('playwright');
const ORIGIN=process.env.ORIGIN||'http://127.0.0.1:8080',KEY='vaultwake-v5-coast';
const VIEWPORTS=(process.env.VIEWPORTS||'360x640,375x667,390x664,390x844,430x932,907x510').split(',').map(s=>s.split('x').map(Number));
const fx=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures','coast','coast-ch1-pre-secondary.json'),'utf8'));fx.daily={day:9e6,count:1};
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const boardY=p=>p.evaluate(()=>Math.round(document.querySelector('#board').getBoundingClientRect().top*10)/10);
const tilesFree=p=>p.evaluate(()=>{let bad=[];for(const t of document.querySelectorAll('#board .tile')){const r=t.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;if(y<0||y>innerHeight){bad.push(t.dataset.index+':off');continue;}const e=document.elementFromPoint(x,y);if(!e||!t.contains(e)&&e!==t)bad.push(t.dataset.index+':'+(e?.id||e?.className||e?.tagName));}return bad;});
const cards3=p=>p.evaluate(()=>{const W=innerWidth,c=[...document.querySelectorAll('#requests .requestCard')].map(e=>e.getBoundingClientRect()).sort((a,b)=>a.left-b.left).slice(0,3);return c.length===3&&c.every(r=>r.left>=-0.5&&r.right<=W+0.5);});
const clipped=p=>p.evaluate(()=>[...document.querySelectorAll('.boardHeading button:not([hidden]), #storyRibbon p, #storyRibbon button, #requests .reqName b, #mapButton .rsText b')].filter(e=>e.offsetParent!==null&&e.scrollWidth>e.clientWidth+1).map(e=>e.id||e.className));
const rect=(p,s)=>p.evaluate(s=>{const e=document.querySelector(s);if(!e||e.hidden||e.offsetParent===null&&getComputedStyle(e).position!=='fixed')return null;const r=e.getBoundingClientRect();return r.width?{top:+r.top.toFixed(1),bottom:+r.bottom.toFixed(1),left:+r.left.toFixed(1),right:+r.right.toFixed(1)}:null;},s);
const hit=(a,b)=>a&&b&&Math.min(a.right,b.right)-Math.max(a.left,b.left)>0.5&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>0.5;
(async()=>{for(const engine of (process.env.ENGINES||'chromium,webkit').split(',')){
 let browser;try{browser=await {chromium,webkit}[engine].launch();}catch(e){if(engine!=='chromium'&&/Executable doesn't exist/.test(e.message)){console.log(`${engine}: not installed here, skipped`);continue;}throw e;}
 try{for(const [W,H] of VIEWPORTS){const mobile=W<700,tag=s=>`${engine} ${W}×${H}: ${s}`;
  const mk=async seed=>{const ctx=await browser.newContext({viewport:{width:W,height:H},isMobile:mobile&&engine==='chromium',hasTouch:mobile}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   if(seed)await page.addInitScript(([k,v])=>{if(!sessionStorage.s){localStorage.setItem(k,v);localStorage.setItem('vaultwake-v5-coast-story','{"intro":"skip"}');sessionStorage.s=1;}},[KEY,JSON.stringify(seed)]);
   await page.goto(ORIGIN+'/v5/play.html');await page.waitForSelector('#board .tile');
   const tap=async s=>{const l=page.locator(s).first();await l.waitFor({state:'visible',timeout:8000});const b=await l.boundingBox();if(b.y<0||b.y+b.height>H)await l.evaluate(e=>e.scrollIntoView({block:'center'}));const c=await l.boundingBox();if(mobile)await page.touchscreen.tap(c.x+c.width/2,c.y+c.height/2);else await page.mouse.click(c.x+c.width/2,c.y+c.height/2);};
   for(let k=0;k<30;k++){if(await page.evaluate(()=>!document.querySelector('#home').hidden&&!document.querySelector('#homePlay').hidden)){await tap('#homePlay');await delay(300);continue;}
    if(await page.evaluate(()=>!document.querySelector('#story').hidden)){await tap('#storySkip');await delay(300);continue;}break;}
   await delay(1500);return {ctx,page,errors,tap};};
  // a returning camp: select, Details (the sheet on a phone), close, deselect
  {const {ctx,page,errors,tap}=await mk(fx);const y0=await boardY(page);assert.ok(await cards3(page),tag('three orders in view'));
   await tap('#requests [data-order="o14"]');await delay(700);assert.ok(Math.abs(await boardY(page)-y0)<=2,tag(`selecting an order keeps the board (${y0} → ${await boardY(page)})`));
   assert.equal((await tilesFree(page)).length,0,tag('every board cell reachable with an order selected'));assert.deepEqual(await clipped(page),[],tag('no clipped text'));
   if(mobile){const d=await rect(page,'#orderDetails');assert.ok(d&&d.top>=0&&d.bottom<=H,tag(`Details in view (${d?.top}–${d?.bottom})`));
    assert.ok(!hit(d,await rect(page,'#board'))&&!hit(d,await rect(page,'#mapButton')),tag('Details covers neither the board nor the strip'));
    await tap('#orderDetails');await delay(600);assert.ok(await page.evaluate(()=>document.querySelector('#orderTools').classList.contains('sheetOpen')),tag('Details opens the bottom sheet'));
    await page.keyboard.press('Escape');await delay(400);assert.ok(Math.abs(await boardY(page)-y0)<=2,tag('closing Details keeps the board'));}
   await tap('#requests [data-order="o14"]');await delay(700);assert.ok(Math.abs(await boardY(page)-y0)<=2,tag(`deselecting keeps the board (${y0} → ${await boardY(page)})`));
   assert.deepEqual(errors,[],tag('no page errors'));await ctx.close();}
  // a new player: the story caption and the tutorial
  {const {ctx,page,errors,tap}=await mk(null);const r=await rect(page,'#storyRibbon');assert.ok(r,tag('the story caption shows for a new player'));
   assert.ok(!hit(r,await rect(page,'#board')),tag(`the caption does not cover the board (${r.top}–${r.bottom})`));
   for(const s of ['main.game header','#requests','#mapButton','.boardHeading'])assert.ok(!hit(r,await rect(page,s)),tag(`the caption does not cover ${s}`));
   const blocked=(await tilesFree(page)).filter(t=>!t.endsWith(':off'));assert.deepEqual(blocked,[],tag('all 7 rows of the board reachable'));
   assert.ok(await cards3(page),tag('three orders in view'));assert.deepEqual(await clipped(page),[],tag('no clipped text'));
   const y0=await boardY(page),sel=await page.evaluate(()=>[...document.querySelectorAll('#requests .requestCard')].find(c=>!c.classList.contains('lead')&&!c.classList.contains('ready'))?.dataset.order);
   if(sel){await tap(`#requests [data-order="${sel}"]`);await delay(700);assert.ok(Math.abs(await boardY(page)-y0)<=2,tag('selecting an order in the tutorial keeps the board'));}
   // the caption's own × still folds it
   await page.evaluate(()=>document.querySelector('#storyRibbon .ribbonClose').click());await delay(500);assert.ok(await page.evaluate(()=>document.querySelector('#storyRibbon').hidden),tag('× folds the caption'));
   assert.deepEqual(errors,[],tag('no page errors'));await ctx.close();}
  console.log(`ok ${tag('select/deselect/Details: board still; Details sheet; story caption clear of the board and controls; 7 rows reachable; three orders')}`);
 }}finally{await browser.close();}}
 console.log('stable board browser tests passed');
})().catch(e=>{console.error(e);process.exit(1);});
