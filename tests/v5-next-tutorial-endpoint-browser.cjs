// Tutorial endpoint (owner decision, 2026-11-16; docs/V5_TUTORIAL_ENDPOINT_2026-11-16.md). The tutorial guides a new
// player through the first loop only (generator → merge → crew order → coins → gold order → materials → coast →
// first Build) and the first completed Build is its end. Real UI, real input. Cases:
// 1. a new player: guided step by step until the gold order is delivered; then (materials in, nothing built) still
//    guided, to the strip ("Tap Build", spotlight); a reload there resumes at Build; the coast's Build is guided;
//    after it: "Tutorial complete" once on the restored place's card; back on the board the normal game (no guided
//    line, highlight, hand, spotlight or cue; the Hint button and the objective line stay); a reload keeps it complete;
//    the Hint still shows the next step on request, without a spotlight;
// 2. Skip: the guide and its spotlight go at once, and stay gone across a reload;
// 3. an existing progressed save (a camp with a stage built): never guided, before or after a reload.
// ENGINES (default chromium,webkit), VIEWPORTS (default 390x664,360x640).
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const {chromium,webkit}=require('playwright');
const ORIGIN=process.env.ORIGIN||'http://127.0.0.1:8080',KEY='vaultwake-v5-coast';
const VIEWPORTS=(process.env.VIEWPORTS||'390x664,360x640').split(',').map(s=>s.split('x').map(Number));
const progressed=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures','coast','coast-ch1-pre-secondary.json'),'utf8'));progressed.daily={day:9e6,count:1};
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const state=page=>page.evaluate(k=>{const st=window.VWGuide?.step,h=document.querySelector('#hint'),raw=localStorage.getItem(k),s=raw?JSON.parse(raw):null;
 return {st:st?{kind:st.kind,level:st.level,target:st.target}:null,kind:h?.dataset.kind??null,level:h?.dataset.level??null,line:h?.innerText??'',
  spot:document.body.dataset.spot??null,cue:!!document.querySelector('#spotCue:not([hidden])'),hand:!!document.querySelector('#coachHand:not([hidden])'),
  marks:document.querySelectorAll('.coachTarget,.coachFrom,.coachTo').length,hint:!!document.querySelector('#guideHint')&&getComputedStyle(document.querySelector('#guideHint')).display!=='none',
  built:s?Object.values(s.built??{}).reduce((n,k)=>n+k,0):null,mat:s?.materials?.['beach-path']??0,seen:s?.seen??{}};},KEY);
(async()=>{for(const engine of (process.env.ENGINES||'chromium,webkit').split(',')){
 let browser;try{browser=await {chromium,webkit}[engine].launch();}catch(e){if(engine!=='chromium'&&/Executable doesn't exist/.test(e.message)){console.log(`${engine}: not installed here, skipped`);continue;}throw e;}
 try{for(const [W,H] of VIEWPORTS){const tag=s=>`${engine} ${W}×${H}: ${s}`;
  const open=async(seed)=>{const ctx=await browser.newContext({viewport:{width:W,height:H},isMobile:engine==='chromium',hasTouch:true}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   if(seed)await page.addInitScript(([k,v])=>{if(!sessionStorage.seeded){localStorage.setItem(k,v);localStorage.setItem('vaultwake-v5-coast-story','{"intro":"skip"}');sessionStorage.seeded='1';}},[KEY,JSON.stringify(seed)]);
   await page.goto(ORIGIN+'/v5/play.html');await page.waitForSelector('#board .tile');await delay(1200);return {ctx,page,errors};};
  const tapAt=async(page,l)=>{const b=await l.boundingBox();await page.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);};
  const toBoard=async page=>{await page.waitForSelector('#board .tile');for(let k=0;k<20;k++){if(await page.evaluate(()=>!document.querySelector('#home')?.hidden&&!document.querySelector('#homePlay')?.hidden)){await tapAt(page,page.locator('#homePlay'));await delay(500);continue;}
   if(await page.locator('#beat[open]').count()){await tapAt(page,page.locator('#beatNext'));await delay(300);continue;}break;}await delay(1000);
   // the normal game's own dialogs (the daily gift) may open once the tutorial is over: close them as a player would
   for(const d of ['#daily','#levelUp'])if(await page.locator(d+'[open]').count()){await page.locator(d+' .close').first().click().catch(()=>{});await delay(300);}};
  const reload=async page=>{await page.reload();await toBoard(page);};
  const normal=(s,what)=>{assert.equal(s.st,null,tag(`${what}: nothing guided (${JSON.stringify(s.st)})`));assert.notEqual(s.kind,'coach',tag(`${what}: the normal objective line (${s.line})`));
   assert.deepEqual([s.spot,s.cue,s.hand,s.marks],[null,false,false,0],tag(`${what}: no spotlight, cue, hand or highlight`));assert.ok(s.hint,tag(`${what}: the Hint button stays`));};
  // 1. a new player, through the first Build
  {const {ctx,page,errors}=await open(null);const cell=i=>page.locator(`#board [data-index="${i}"]`);
   const drag=async(a,b)=>{const x=await cell(a).boundingBox(),y=await cell(b).boundingBox();await page.mouse.move(x.x+x.width/2,x.y+x.height/2);await page.mouse.down();for(let k=1;k<=8;k++){await page.mouse.move(x.x+x.width/2+(y.x-x.x)*k/8,x.y+x.height/2+(y.y-x.y)*k/8);await delay(20);}await page.mouse.up();};
   const kinds=[];let atBuild=null;
   for(let n=0;n<90&&!atBuild;n++){await delay(700);if(await page.locator('#beat[open]').count()){await tapAt(page,page.locator('#beatNext'));continue;}
    const s=await state(page);if(!s.st)continue;if(kinds.at(-1)!==s.st.kind)kinds.push(s.st.kind);
    if(s.st.kind==='build'){atBuild=s;break;}
    const t=s.st.target;if(!t)continue;
    if(t.kind==='cell')await tapAt(page,cell(t.index));else if(t.kind==='pair')await drag(t.cells[0],t.cells[1]);else if(t.kind==='order'){await tapAt(page,page.locator(`#requests [data-order="${t.id}"] .reqDeliver`));await delay(900);}}
   for(const k of ['tap','merge','deliver','gold'])assert.ok(kinds.includes(k),tag(`the first loop guides "${k}" (${kinds.join(' → ')})`));
   // the gold order delivered, the Build not yet made: still the tutorial
   assert.ok(atBuild,tag('reached the Build step'));assert.ok(atBuild.mat>=1&&atBuild.built===0,tag('materials in, nothing built'));
   assert.equal(atBuild.spot,'strip',tag('the strip in the spotlight'));assert.ok(atBuild.cue,tag('its cue'));assert.match(atBuild.line,/^Tap Build/,tag('"Tap Build"'));
   // a reload before completion: the same step
   await reload(page);let s=await state(page);assert.equal(s.st?.kind,'build',tag('a reload before completion resumes at Build'));assert.equal(s.spot,'strip',tag('with its spotlight'));
   // the coast's Build
   await tapAt(page,page.locator('#mapButton'));await page.waitForSelector('#coastMap[open]');await delay(1200);s=await state(page);assert.equal(s.st?.kind,'coastBuild',tag('the coast\'s Build is guided'));
   const b=page.locator('#coastMap [data-restore].coachTarget').first();await b.evaluate(e=>e.scrollIntoView({block:'center'}));await delay(300);await tapAt(page,b);
   await page.waitForSelector('#coastMap .restoredCard',{timeout:8000});await delay(600);
   const card=await page.locator('#coastMap .restoredCard').innerText();assert.match(card,/Tutorial complete/,tag('"Tutorial complete" on the restored place\'s card'));
   assert.equal((card.match(/Tutorial complete/g)||[]).length,1,tag('said once'));
   s=await state(page);assert.equal(s.built,1,tag('the first stage is built'));assert.equal(s.seen['coach-done'],true,tag('completion is saved'));
   assert.equal(await page.locator('#coastMap .coachTarget,#coastMap .coachHand,#coastMap .coachLine').count(),0,tag('no guide left on the coast screen'));
   const back=page.locator('#coastMap .restoredCard .rcBack');await back.evaluate(e=>e.scrollIntoView({block:'center'}));await delay(400);await tapAt(page,back);
   await page.waitForFunction(()=>!document.querySelector('#coastMap').open,null,{timeout:8000});await delay(900);
   for(const d of ['#daily','#levelUp'])if(await page.locator(d+'[open]').count())await page.locator(d+' .close').first().click().catch(()=>{});
   normal(await state(page),'back on the board after the first Build');
   assert.match(await page.locator('#message').innerText(),/Tutorial complete\. Next:/,tag('the message line names what is next'));
   // a few seconds later still nothing (no guided second restoration, no extra delivery)
   await delay(3000);normal(await state(page),'a few seconds later');
   // a reload after completion
   await reload(page);normal(await state(page),'after a reload');
   // the optional Hint still shows the next step on request, without the tutorial's spotlight
   await tapAt(page,page.locator('#guideHint'));await delay(500);s=await state(page);
   assert.ok(s.st&&s.level==='full',tag(`the Hint shows the next step (${JSON.stringify(s.st)})`));assert.equal(s.spot,null,tag('without a spotlight'));assert.equal(s.cue,false,tag('or a cue'));
   assert.deepEqual(errors,[],tag('no page errors'));await ctx.close();}
  // 2. Skip
  {const {ctx,page,errors}=await open(null);await page.waitForFunction(()=>document.body.dataset.spot==='cell',null,{timeout:15000});
   await tapAt(page,page.locator('#coachSkip'));await delay(500);normal(await state(page),'after Skip');
   await reload(page);normal(await state(page),'after Skip and a reload');assert.deepEqual(errors,[],tag('no page errors (Skip)'));await ctx.close();}
  // 3. an existing progressed save
  {const {ctx,page,errors}=await open(progressed);await toBoard(page);let s=await state(page);assert.ok(s.built>=1,tag('a progressed camp'));normal(s,'an existing progressed save');
   await reload(page);normal(await state(page),'an existing progressed save after a reload');assert.deepEqual(errors,[],tag('no page errors (existing save)'));await ctx.close();}
  console.log(`ok ${tag('first loop guided to the first Build; "Tutorial complete" once; normal game after, across reloads; Hint without spotlight; Skip; existing save never guided')}`);}
 }finally{await browser.close();}}
 console.log('tutorial endpoint browser tests passed');
})().catch(e=>{console.error(e);process.exit(1);});
