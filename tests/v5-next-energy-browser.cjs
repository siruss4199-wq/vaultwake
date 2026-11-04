// Coast Camp energy pass (build 47v; docs/V5_ENERGY_CAPACITY_2026-11-01.md) in a real browser, at 360,
// 390 and 430 px portrait and 907×510 landscape (touch): the HUD shows energy over the level's capacity
// (100/50 BONUS for a new camp, a countdown below it, 135/100 BONUS above it) without clipping; the level
// badge shows the level, its XP, the capacity and the next milestone (or the maximum); a capacity
// milestone shows "Energy capacity 50 → 60 · +10 energy" apart from the level's own energy, once; the
// first crew order's +15 shows as a short note; a reload pays nothing twice.
//   SHOTS=<dir> also saves screenshots (normal energy, the capacity increase, bonus overflow).
const assert=require('node:assert/strict');const path=require('node:path');const {chromium,webkit}=require('playwright');const {throughHome}=require('./v5-next-home-helper.cjs');
const URL='http://127.0.0.1:8080/v5/play.html',KEY='vaultwake-v5-coast',SHOTS=process.env.SHOTS;
const read=page=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
const write=(page,f,arg)=>page.evaluate(([k,src,arg])=>{const s=JSON.parse(localStorage.getItem(k));new Function('s','arg',src)(s,arg);localStorage.setItem(k,JSON.stringify(s));},[KEY,f,arg]);
async function closeBeats(page){for(let n=0;n<6&&await page.locator('#beat[open]').count();n++){await page.locator('#beatNext').tap();await page.waitForTimeout(80);}}
// the energy pill's text fits: inside the viewport, and the number is not cut off (measured once the
// delivery's coin and energy animations have settled)
async function fits(page,tag){
 await page.waitForTimeout(1500);
 const box=await page.locator('#energyPill').boundingBox(),vw=page.viewportSize().width;
 assert.ok(box&&box.x>=0&&box.x+box.width<=vw+0.5,`${tag}: the energy pill is on screen (${JSON.stringify(box)})`);
 const clip=await page.evaluate(()=>{const e=document.querySelector('#energy'),p=document.querySelector('#energyPill').getBoundingClientRect(),r=e.getBoundingClientRect();return {over:e.scrollWidth>e.clientWidth+1,inside:r.left>=p.left-1&&r.right<=p.right+1};});
 assert.ok(!clip.over&&clip.inside,`${tag}: the energy number is not clipped (${JSON.stringify(clip)})`);
 const hud=await page.evaluate(()=>[...document.querySelectorAll('header > *')].filter(e=>e.offsetParent).map(e=>e.getBoundingClientRect()).map(r=>[r.left,r.right]));
 for(let i=1;i<hud.length;i++)assert.ok(hud[i][0]>=hud[i-1][1]-1,`${tag}: HUD items do not overlap (${JSON.stringify(hud)})`);
}
// Capture the actual transient card in the browser before tapping; a slow
// automation client must not lose its text between a visibility wait and read.
async function levelCard(page,level){
 await page.evaluate(level=>{window.__levelCard=null;window.__levelObserver?.disconnect();window.__levelObserver=new MutationObserver(()=>{const m=document.querySelector('.moment');if(m?.textContent.startsWith('Level '+level+' ·'))window.__levelCard=m.textContent;});window.__levelObserver.observe(document.body,{subtree:true,childList:true,characterData:true});},level);
 await page.locator('#levelPill').tap();const card=await page.waitForFunction(()=>window.__levelCard,null,{timeout:4000});return card.jsonValue();
}
const order=(s,needs)=>{s.orders[0]={id:'tq',who:'ivo',needs,coins:5,role:'quick'};for(const r of needs)s.board[s.board.indexOf(null)]={type:'item',family:r.family,tier:r.tier};};
(async()=>{
 const engines=(process.env.ENGINES||'chromium,webkit').split(',').map(e=>[e,{chromium,webkit}[e]]);
 const VIEWS=[[360,780],[390,844],[430,932],[907,510]];
 for(const [engine,type] of engines){
  let browser;try{browser=await type.launch();}catch(e){if(engine!=='chromium'&&/Executable doesn't exist/.test(e.message)){console.log(`${engine}: not installed here, skipped`);continue;}throw e;}
  try{for(const [w,h] of VIEWS){const tag=`${engine} ${w}×${h}`;
   for(const motion of w===390?['no-preference','reduce']:['no-preference']){
    const context=await browser.newContext({viewport:{width:w,height:h},isMobile:engine==='chromium'&&w<900,hasTouch:true,reducedMotion:motion});
    const page=await context.newPage(),errors=[];throughHome(page);
    await page.addInitScript(()=>{window.__energyCards=[];addEventListener('DOMContentLoaded',()=>{new MutationObserver(()=>{for(const e of document.querySelectorAll('.moment,.energyNote')){const text=e.textContent;if(text&&!window.__energyCards.some(x=>x.text===text))window.__energyCards.push({text,animation:getComputedStyle(e).animationName});}}).observe(document.body,{childList:true,subtree:true,characterData:true});});});page.on('pageerror',e=>errors.push(e.message));
    const shot=async name=>{if(SHOTS&&motion==='no-preference')await page.screenshot({path:path.join(SHOTS,`energy-${w}x${h}-${name}.png`)});};
    await page.goto(URL+'?new=1');await page.waitForSelector('#board .tile');await closeBeats(page);
    // 1. a new camp: 100 stored above its 50-point refill cap, BONUS
    await write(page,`s.daily={day:9e6,count:1};`);await page.reload();await page.waitForSelector('#board .tile');await closeBeats(page);
    assert.equal((await page.locator('#energy').textContent()).replace(/\s/g,''),'100/50',tag);
    assert.equal(await page.locator('#energyTimer').textContent(),'BONUS',tag);await fits(page,tag+' 100/50');await shot('1-new-camp');
    // the level badge: level, XP, capacity and the next milestone
    let m=await levelCard(page,1);assert.match(m,/Level 1 · 0 of 20 XP/);assert.match(m,/Energy capacity: 50/);assert.match(m,/Level 3: energy capacity increases to 60\./);
    // 2. below the capacity: a countdown; the first crew order's +15 as a short note
    await write(page,`s.energy=12;s.energyAt=Date.now();(${order})(s,[{family:'rig',tier:0,count:1}]);`);await page.reload();await page.waitForSelector('#board .tile');await closeBeats(page);
    assert.match(await page.locator('#energyTimer').textContent(),/^\+1 \d:\d\d$/,tag+' countdown');assert.equal((await page.locator('#energy').textContent()).replace(/\s/g,''),'12/50');
    await shot('2-normal-energy');
    await page.locator('[data-order="tq"]').tap();const firstNote=await page.waitForFunction(()=>window.__energyCards.find(x=>x.text.includes('First crew order')),null,{timeout:5000});
    const firstCard=await firstNote.jsonValue();assert.match(firstCard.text,/First crew order · \+15 energy/);
    if(motion==='reduce')assert.equal(firstCard.animation,'none','reduced motion: no movement');
    let s=await read(page);assert.equal(s.energy,12+1+15);assert.equal(s.boost.order,true);
    // 3. a capacity milestone: level 2 → 3 at 12 energy: +5 for the level and +10 for the capacity
    await page.waitForTimeout(2700);
    await write(page,`s.energy=12;s.level={version:1,level:2,xp:29};s.capPaid=50;(${order})(s,[{family:'rig',tier:0,count:1}]);`);await page.reload();await page.waitForSelector('#board .tile');await closeBeats(page);
    await page.locator('[data-order="tq"]').tap();
    {const card=await page.waitForFunction(()=>window.__energyCards.find(x=>x.text.includes('Level 3!')),null,{timeout:4000});m=(await card.jsonValue()).text;}
    assert.match(m,/\+5 ϟ for the level\. Energy capacity is now 60\./,tag+' the level card: its own energy, the new capacity');
    assert.equal((await page.locator('#energy').textContent()).replace(/\s/g,''),'28/60',tag+' 12 +1 +5 +10 of 60');
    // then, once the card has gone, the milestone's own reward under the energy pill
    const capacityNote=await page.waitForFunction(()=>window.__energyCards.find(x=>x.text==='Energy capacity 50 → 60 · +10 energy'),null,{timeout:5000});
    assert.equal((await capacityNote.jsonValue()).text,'Energy capacity 50 → 60 · +10 energy');
    await page.waitForTimeout(motion==='reduce'?50:500);await shot('3-capacity-increase');
    await fits(page,tag+' 28/60');
    // a reload pays nothing again
    s=await read(page);await page.reload();await page.waitForSelector('#board .tile');await page.waitForTimeout(300);
    const t=await read(page);assert.equal(t.energy,s.energy);assert.equal(t.capPaid,60);assert.equal(await page.locator('.energyNote').count(),0);
    // 4. bonus energy above the capacity: 135/100 BONUS, and the maximum capacity in the level panel
    await write(page,`s.energy=135;s.level={version:1,level:30,xp:0};s.capPaid=120;`);await page.reload();await page.waitForSelector('#board .tile');await closeBeats(page);
    assert.equal((await page.locator('#energy').textContent()).replace(/\s/g,''),'135/100');assert.equal(await page.locator('#energyTimer').textContent(),'BONUS');
    {const t=await read(page);assert.equal(t.energy,135,'energy above the new maximum is kept');assert.equal(t.capPaid,100,'capPaid follows the new maximum');}
    assert.ok(await page.locator('#energyPill.overCap').count(),'marked as bonus energy');await fits(page,tag+' 135/100 (a level-30 save that had capacity 120)');await shot('4-bonus-overflow');
    assert.match(await levelCard(page,30),/Maximum energy capacity: 100\./);
    await page.waitForTimeout(300);await shot('5-level-panel-maximum');
    // a three-digit energy at the largest stored amount still fits
    await write(page,`s.energy=200;s.coins=1250;`);await page.reload();await page.waitForSelector('#board .tile');await closeBeats(page);await fits(page,tag+' 200/100 with 1,250 coins');
    assert.deepEqual(errors,[],tag);await context.close();}
  }
  console.log(`${engine} Coast Camp energy: 100/50 BONUS, countdown, level panel (capacity, next milestone, maximum), +15 note, capacity 50 → 60 · +10 once, 135/100 BONUS, no clipping at 360/390/430 and 907×510, reduced motion passed`);
  }finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exit(1);});
