// Real browser UI, shortened visual viewports, no injected tutorial resources.
// Chromium exercises native CSS env safe insets; WebKit uses explicitly synthetic
// CSSOM insets. Neither substitutes for Safari on a physical iPhone.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');const {mobileSession,KEY}=require('./v5-mobile-session-helper.cjs');
const SHOTS=process.env.SHOTS,results=[];
const built=s=>Object.values(s.built).reduce((a,b)=>a+b,0);
async function inset(page,context,engine){
 if(engine==='chromium'){const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setSafeAreaInsetsOverride',{insets:{top:47,bottom:34,left:0,right:0}});return 'native Chromium CSS env';}
 await page.evaluate(()=>{function visit(rules){for(const r of rules){if(r.style)for(const name of [...r.style]){const v=r.style.getPropertyValue(name);if(v.includes('safe-area-inset-'))r.style.setProperty(name,v.replace(/env\(safe-area-inset-(top|bottom|left|right)(?:,[^)]*)?\)/g,(_,edge)=>(edge==='top'?47:edge==='bottom'?34:0)+'px'),r.style.getPropertyPriority(name));}if(r.cssRules)visit(r.cssRules);}}for(const sheet of document.styleSheets)visit(sheet.cssRules);});
 return 'synthetic WebKit CSSOM; physical Safari UNVERIFIED';
}
async function fits(page,tag){
 const r=await page.evaluate(()=>({vw:innerWidth,doc:document.documentElement.scrollWidth,energy:document.querySelector('#energy').getBoundingClientRect().toJSON(),pill:document.querySelector('#energyPill').getBoundingClientRect().toJSON(),label:getComputedStyle(document.querySelector('.energyCap'),'::before').content}));
 assert.ok(r.doc<=r.vw+1,tag+' no document overflow');assert.ok(r.energy.x>=r.pill.x&&r.energy.right<=r.pill.right+1,tag+' energy fits');assert.equal(r.label,'"REFILL"',tag+' visible refill denominator label');
 for(const sel of ['#energyPill','#levelPill','#menuButton','#mapButton','#hint','#shed [data-shed-toggle]']){
  const el=page.locator(sel);if(!await el.isVisible())continue;const b=await el.boundingBox();assert.ok(b.width>=44&&b.height>=44,`${tag} ${sel} 44px target: ${JSON.stringify(b)}`);
 }
}
(async()=>{
 if(SHOTS)fs.mkdirSync(SHOTS,{recursive:true});
 for(const engine of (process.env.ENGINES||'chromium,webkit').split(',')){
  const browser=await {chromium,webkit}[engine].launch();
  try{for(const [width,height] of [[360,640],[390,664],[430,752]]){
   const tag=`${engine} ${width}x${height}`,s=await mobileSession(browser,{engine,width,height,url:process.env.QA_URL});
   const {page,context,read,perform,dismiss}=s,shot=async name=>{if(SHOTS)await page.screenshot({path:path.join(SHOTS,`${engine}-${width}-${name}.png`)});};
   assert.equal((await read()).energy,100);assert.equal(await page.locator('#energyTimer').innerText(),'+50 BONUS');await fits(page,tag);await shot('fresh');
   await page.locator('#energyPill').tap();assert.match(await page.locator('.energyHelp').innerText(),/100 energy available · 50 bonus stored/);assert.match(await page.locator('.energyHelp').innerText(),/refill limit: 50.*\+1 every 2 minutes.*Storage limit: 200/s);assert.equal(await page.locator('[data-ad]').count(),0,'no onboarding ads');await page.locator('#shop .close').tap();
   for(const card of await page.locator('[data-order]').all()){
    await card.scrollIntoViewIfNeeded();const box=await card.boundingBox();assert.ok(box.x>=-1&&box.x+box.width<=width+1,tag+' every order can scroll into view');
    assert.ok(await card.locator('.requestReward').innerText(),tag+' visible order reward');
   }
   const highlights=[];let iterations=0;
   while(!built(await read())&&iterations++<120){
    const c=await s.coachAction();assert.ok(c?.action,tag+' tutorial has an actionable next step: '+JSON.stringify(c));
    if(['tap','merge','deliver','gold','build'].includes(c.id)&&!highlights.includes(c.id))highlights.push(c.id);
    await page.waitForTimeout(40);
    const pointer=await page.evaluate(()=>{const h=document.querySelector('#coachHand');return !h||h.hidden||getComputedStyle(h).pointerEvents==='none';});assert.equal(pointer,true,tag+' hand cannot intercept input');
    await perform(c.action);
   }
   assert.equal(built(await read()),1,tag+' first restoration completed through UI');assert.deepEqual(highlights,['tap','merge','deliver','gold','build'],tag+' exact onboarding sequence');
   await page.waitForTimeout(1400);await dismiss();
   assert.equal(await page.locator('#coachSkip').isVisible(),false);assert.equal(await page.locator('#coachHand:not([hidden])').count(),0);
   assert.ok(await page.locator('#mapButton').getAttribute('data-place'),tag+' next restoration objective');assert.ok(await page.locator('#mapButton').innerText(),tag+' next objective is readable');await shot('next-objective');
   const earned=await read(),rewardNotes=await page.evaluate(()=>__mobileNotes);
   assert.ok(rewardNotes.some(t=>t.includes('First crew order · +15 energy')),tag+' first Crew reward visible');
   assert.ok(rewardNotes.some(t=>t.includes('First stage · +20 energy')),tag+' first restoration reward visible');
   await page.reload();await dismiss();assert.equal((await read()).energy,earned.energy,tag+' reload does not replay rewards');assert.deepEqual((await read()).built,earned.built);
   const other=await context.newPage();await other.goto('about:blank');await other.bringToFront();await page.bringToFront();await other.close();assert.equal((await read()).energy,earned.energy,tag+' tab roundtrip does not pay again');
   await page.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.energy=12;s.energyAt=Date.now();delete s.energyRewards;localStorage.setItem(k,JSON.stringify(s));},KEY);
   await page.reload();await dismiss();const migrated=await read();assert.equal(migrated.energy,12,tag+' legacy save not topped up');assert.deepEqual(migrated.built,earned.built);assert.equal(migrated.coins,earned.coins);
   const safe=await inset(page,context,engine);await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(150);
   const top=await page.evaluate(()=>{const h=document.querySelector('header').getBoundingClientRect(),r=document.querySelector('#requests').getBoundingClientRect();return {headerTop:h.top,headerBottom:h.bottom,ordersTop:r.top,children:[...document.querySelector('header').children].filter(e=>e.offsetWidth).map(e=>e.getBoundingClientRect().toJSON())};});
   assert.ok(top.headerTop>=47,tag+' top inset reserved once');for(const r of top.children)assert.ok(r.bottom<=top.ordersTop,tag+' HUD does not overlap order portraits');await fits(page,tag+' safe area');await shot('safe-area');
   await page.locator('#shed [data-shed-toggle]').scrollIntoViewIfNeeded();await page.locator('#shed [data-shed-toggle]').tap();
   for(const slot of await page.locator('#shed [data-slot]').all()){await slot.scrollIntoViewIfNeeded();const b=await slot.boundingBox();assert.ok(b.width>=44&&b.height>=44&&b.y>=0&&b.y+b.height<=height-34,tag+' shed slot above bottom safe inset');}
   await shot('shed');
   // Migration and HUD cover each unchanged refill milestone; a large valid late
   // save additionally exercises the densest header at all three widths.
   const levels=width===390?[[1,50],[3,60],[5,70],[8,80],[12,100]]:[[12,100]];
   for(const [level,cap] of levels){
    await page.evaluate(([key,level,cap])=>{const s=JSON.parse(localStorage.getItem(key));s.level={version:1,level,xp:0};s.capPaid=cap;s.energy=200;s.coins=99999;s.energyAt=Date.now();localStorage.setItem(key,JSON.stringify(s));},[KEY,level,cap]);
    await page.reload();await dismiss();assert.equal((await read()).energy,200);assert.equal((await page.locator('#energy').innerText()).replace(/\s/g,''),`200/${cap}`);assert.equal(await page.locator('#energyTimer').innerText(),`+${200-cap} BONUS`);await fits(page,tag+' milestone '+level);
   }
   await shot('stored-maximum');
   if(width===390){await page.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.energy=100;localStorage.setItem(k,JSON.stringify(s));},KEY);await page.reload();await dismiss();assert.equal(await page.locator('#energyTimer').innerText(),'REFILL FULL');}
   assert.deepEqual(s.errors,[],tag+' no browser errors');
   results.push({engine,width,height,actions:s.actions.length,highlights,safeAreaMode:safe,notes:rewardNotes,physicalDevice:'UNVERIFIED'});console.log(tag+': onboarding, rewards/reload, scroll, targets, safe-area geometry, Shed and legacy save: PASS');await context.close();
  }}finally{await browser.close();}
 }
 if(SHOTS)fs.writeFileSync(path.join(SHOTS,'results.json'),JSON.stringify(results,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
