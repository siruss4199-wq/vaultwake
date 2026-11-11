// Coast Camp Chapter 5, the Lowwater Passage, in a real browser (build 50a; docs/V5_CHAPTER5_LOWWATER_PASSAGE_2026-11-02.md).
// A camp that finished Chapter 4 (a board, shed, waiting reward, energy above capacity) loads into the reef
// passage: with its old end card seen, only the arrival (once); without it (360 x 780), the relay's message
// first, naming Chapter 5, then the arrival. The arrival's button marks the landing's gold order; the
// coast screen shows the damaged passage (the restored one only when the chapter is done) with one pin;
// each stage bought through the real UI puts its own sprite (cut from the pack's sheet) on its place's
// card and tile and says its line as a caption; only one place is open at a time; the safe crossing and
// the working route cards once each; the inner lock's last stage brings "Behind the Vault" (build 51a:
// Chapter 5's last card, naming Chapter 6) and the station's arrival, no end card, nothing again on reload.
// At 390 x 844 all 21 stages by hand (Chromium; WebKit as the other sizes); at 360 x 780, 430 x 932 and 907 x 510 the entry, a stage and the end.
// Every picture loads; nothing scrolls sideways; buttons are 44 px.   SHOTS=<dir> saves screenshots.
const assert=require('node:assert/strict');const path=require('node:path');const {chromium,webkit}=require('playwright');const {throughHome}=require('./v5-next-home-helper.cjs');
const URL='http://127.0.0.1:8080/v5/play.html',KEY='vaultwake-v5-coast',SHOTS=process.env.SHOTS;
(async()=>{
 const {AREAS,TASKS}=await import('../v5/next/areas.mjs');
 const before=Object.fromEntries(AREAS.slice(0,6).flatMap(a=>a.tasks).map(t=>[t.id,3]));
 const IDS=AREAS[6].tasks.map(t=>t.id);
 const engines=(process.env.ENGINES||'chromium,webkit').split(',').map(e=>[e,{chromium,webkit}[e]]);
 for(const [engine,type] of engines){
  let browser;try{browser=await type.launch();}catch(e){if(engine!=='chromium'&&/Executable doesn't exist/.test(e.message)){console.log(`${engine}: not installed here, skipped`);continue;}throw e;}
  try{for(const [W,H] of [[390,844],[360,780],[430,932],[907,510]]){
   // the 21 stages by hand in Chromium only (CI's job budget, build 50b); WebKit plays the entry, a stage and the end at every size
   const full=W===390&&engine==='chromium',oldEnd=W!==360;
   const context=await browser.newContext({viewport:{width:W,height:H},isMobile:W<700&&engine==='chromium',hasTouch:W<700,reducedMotion:'reduce'});
   const page=await context.newPage(),errors=[],missing=[];throughHome(page);
   page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
   page.on('response',r=>{if(r.status()>=400&&/lowwater-passage|passage-map/.test(r.url()))missing.push(r.status()+' '+r.url());});
   const tag=s=>`${engine} ${W}×${H}: ${s}`,save=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
   const shot=async name=>{if(SHOTS)await page.screenshot({path:path.join(SHOTS,`ch5-${W}x${H}-${name}.png`)});};
   const write=(src,arg)=>page.evaluate(([k,src,arg])=>{const s=JSON.parse(localStorage.getItem(k));new Function('s','arg',src)(s,arg);localStorage.setItem(k,JSON.stringify(s));},[KEY,src,arg]);
   const reload=async()=>{await page.reload();await page.waitForSelector('#board .tile');};
   const beats=async()=>{const t=[];for(let n=0;n<12&&await page.locator('#beat[open]').count();n++){t.push(await page.locator('#beatContent').textContent());
    const b=await page.locator('#beatNext').boundingBox();assert.ok(b.height>=43.5,tag('story button 44 px'));await page.locator('#beatNext').click();await page.waitForTimeout(90);}return t.join(' | ');};
   // on failure, name what reaches past the right edge (what is fixed, and inside which parent), so a WebKit-only
   // overflow can be traced from CI's log
   const fits=async what=>{const o=await page.evaluate(()=>{const vw=innerWidth,past=[];for(const e of document.querySelectorAll('body *')){const r=e.getBoundingClientRect();
    if(r.width&&r.right>vw+1&&getComputedStyle(e).display!=='none')past.push(`${e.tagName.toLowerCase()}${e.id?'#'+e.id:''}${[...e.classList].map(c=>'.'+c).join('')}<${e.parentElement?.tagName.toLowerCase()}> ${Math.round(r.left)}..${Math.round(r.right)} ${getComputedStyle(e).position}`);}
    return {doc:document.documentElement.scrollWidth,vw,past:past.slice(0,20)};});
    assert.ok(o.doc<=o.vw+1,tag(`${what}: no sideways scroll (${o.doc} > ${o.vw}); past the edge: ${o.past.join(' | ')}`));};
   // on a phone an open gold order's panel stands where the strip was; its first line opens the coast (Build 57v)
   const openMap=async()=>{if(!(await page.locator('#coastMap[open]').count())){if(await page.locator('#mapButton').isVisible())await page.locator('#mapButton').click();else await page.locator('#orderTools [data-open-map]').click();await page.waitForSelector('#coastMap[open]');}};
   await page.goto(URL+'?new=1');await page.waitForSelector('#board .tile');await beats();
   // a camp at the end of Chapter 4, as build 49a saved it: still on the headland, its end card seen or not
   await write(`Object.assign(s,{area:5,built:arg[0],materials:{...arg[0]},coins:950,moves:8000,ordersDone:700,energy:141,level:{version:1,level:29,xp:7},capPaid:100,daily:{day:9e6,count:1},
    secOpen:{rig:true,chart:true},seen:{door:true,'vault-open':true,archive:true,'obs-signal':true,'obs-harbour':true,'hb-arrival':true,'hb-cargo':true,'hb-signal':true,'hb-launch':true,'ch4-arrival':true,'ch4-log':true,'ch4-light':true}});
    if(arg[1])s.seenEnd=true;s.shed[0]={type:'item',family:'optic',tier:3};s.pending=[{type:'token'}];const r=s.board.findIndex(x=>x?.type==='source'&&x.id==='rig');s.board[r]={...s.board[r],level:2};
    for(const id of ['chart','rope','shell','lamp','optic']){const i=s.board.findIndex(x=>x===null||x.type==='cargo');s.board[i]={type:'source',id,...(id==='chart'?{level:2}:{})};}`,[before,oldEnd]);
   await reload();
   if(!oldEnd){
    // the relay's message first (Chapter 4's last card, not seen as an end card here), naming Chapter 5
    await page.waitForSelector('#beat[open] .revealPanel.portrait',{timeout:5000});
    const m=await page.locator('#beatContent').textContent();assert.match(m,/Chapter 4 complete/);assert.match(m,/A route through the reef/);assert.match(m,/Chapter 5 · The Lowwater Passage/);
    assert.equal(await page.locator('#beatNext').textContent(),'Follow the route');await fits('message card');await shot('0-message');
    await page.locator('#beatNext').click();await page.waitForTimeout(300);
   }
   // the arrival, once
   await page.waitForSelector('#beat[open] .revealPanel.story',{timeout:5000});
   const img=await page.locator('#beat .revealPanel.story img').evaluate(async i=>{await i.decode().catch(()=>{});return {w:i.naturalWidth,alt:i.alt};});
   assert.ok(img.w>0&&/reef/i.test(img.alt),tag('the arrival picture loads and is described'));
   const card=await page.locator('#beatContent').textContent();assert.match(card,/Chapter 5 · The Lowwater Passage/);assert.match(card,/The water has pulled back\. The marked stones lead through the reef/);
   assert.equal(await page.locator('#beatNext').textContent(),'Secure the reef landing');assert.doesNotMatch(card,/A route through the reef/,tag('the message is not shown twice'));
   await fits('arrival card');await shot('1-arrival');await page.locator('#beatNext').click();await page.waitForTimeout(200);
   let s=await save();assert.equal(s.area,6);assert.equal(s.seen['ch5-arrival'],true);assert.equal(s.seen['ch4-message'],true);assert.notEqual(s.seenEnd,true);
   assert.equal(s.energy,141,tag('energy above capacity kept'));assert.equal(s.coins,950);assert.deepEqual(s.shed[0],{type:'item',family:'optic',tier:3});
   assert.ok(s.orders.find(o=>o?.story==='ch5-landing'),tag('the landing\'s gold order'));assert.match(await page.locator('#message').textContent(),/Clear the driftwood/);
   await reload();assert.equal(await beats(),'',tag('the arrival plays once'));
   // the coast screen: the damaged passage, one pin, seven places, the landing's stage-1 sprite as the preview
   await openMap();
   const scene=await page.evaluate(async()=>{const q=s=>document.querySelector('#coastMap '+s);await q('.sceneBase')?.decode().catch(()=>{});return {base:q('.sceneBase')?.getAttribute('src'),done:!!q('.beachScene.complete'),pins:document.querySelectorAll('#coastMap .siteMarker').length,places:document.querySelectorAll('#coastMap .places .place').length,ok:q('.sceneBase').naturalWidth>0};});
   assert.match(scene.base,/lowwater-passage\/passage-map-before\.webp$/,tag('the damaged passage'));assert.equal(scene.done,false);assert.equal(scene.pins,1);assert.equal(scene.places,7);assert.ok(scene.ok,tag('the map loads'));
   for(const m of await page.locator('#coastMap .siteMarker').all()){const r=await m.boundingBox();assert.ok(r.width>=43.5&&r.height>=43.5,tag('pin 44 px'));}
   assert.match(await page.locator('#mapCard .cardArt img').getAttribute('src'),/lowwater-passage\/place-ch5-landing-1\.webp$/,tag('the next stage\'s own sprite'));
   await fits('passage coast');await shot('2-coast');await page.locator('#coastMap .close').click();
   async function build(id){
    s=await save();const u=s.orders.find(o=>o?.story===id);
    if(u){await write(`const o=s.orders.find(x=>x?.story===arg);let k=0;const free=s.board.reduce((a,x,i)=>x===null||x.type==='cargo'?[...a,i]:a,[]);for(const r of o.needs)for(let c=0;c<r.count;c++)s.board[free[k++]]={type:'item',family:r.family,tier:r.tier};`,id);
     await reload();await beats();await page.locator(`#requests [data-order="${u.id}"]`).click();await page.waitForTimeout(120);
     await page.locator('#hint[data-kind="deliver"]').click({timeout:1200}).catch(()=>{});
     await page.waitForFunction(([k,id])=>!JSON.parse(localStorage.getItem(k)).orders.some(o=>o?.id===id),[KEY,u.id],{timeout:5000});await beats();}
    await write(`for(let i=0;i<s.board.length;i++)if(s.board[i]?.type==='item'&&s.board.filter(x=>x===null).length<8)s.board[i]=null;s.coins=Math.max(s.coins,2000);`);await reload();await beats();
    await openMap();await page.locator(`#coastMap .places [data-select="${id}"]`).click();
    const coins=(await save()).coins;await page.locator(`#coastMap [data-restore="${id}"]`).click({force:true});await page.waitForTimeout(250);
    // the stage's line is a caption (no dialog) unless a story card follows (0.9 s later)
    const dialog=await page.locator('#beat[open]').count();await page.waitForTimeout(1300);
    const text=await beats(),after=await save(),st=after.built[id];
    assert.equal(after.coins,coins-TASKS[id].stages[st-1].cost+0,tag(`${id} ${st}: charged its cost once`));
    return {text,stage:st,dialog};
   }
   const spriteOf=async id=>{await openMap();await page.locator(`#coastMap .places [data-select="${id}"]`).click();return page.locator(`#coastMap .places [data-place="${id}"] .placeIcon img`).getAttribute('src');};
   if(full){
    let stages=0,crossing=false,ledger=false;
    for(const id of IDS){const n=id==='ch5-lock'?2:3;
     for(let k=0;k<n;k++){
      s=await save();assert.equal(s.orders.filter(o=>o?.story).length,1);
      const r=await build(id);stages++;
      if(/The safe crossing/.test(r.text)){crossing=true;assert.match(r.text,/These tide marks explain when the route is safe/);}
      if(/A working route/.test(r.text)){ledger=true;assert.match(r.text,/The same wave seal/);}
      if(!(r.stage===3&&(id==='ch5-gauge'||id==='ch5-shelter')))assert.equal(r.dialog,0,tag(`${id} ${r.stage}: its line is a caption`));
      assert.match(await spriteOf(id),new RegExp(`place-${id}-${r.stage}\\.webp$`),tag(`${id} ${r.stage}: its own sprite`));
      const open=await page.locator('#coastMap .places .place[data-status="next"], #coastMap .places .place[data-status="ready"]').count();assert.ok(open<=1,tag('one place open at a time'));
      if(id==='ch5-desk'&&r.stage===3)assert.match(await page.locator('#coastMap .sceneBase').getAttribute('src'),/passage-map-before/,tag('no restored passage before the chapter is done'));
      await page.locator('#coastMap .close').click().catch(()=>{});}}
    assert.ok(crossing,tag('the safe crossing card'));assert.ok(ledger,tag('the working route card'));assert.equal(stages,20);
    s=await save();assert.equal(s.seen['ch5-crossing'],true);assert.equal(s.seen['ch5-ledger'],true);
   }else{
    const r=await build('ch5-landing');assert.equal(r.dialog,0,tag('a caption'));assert.match(await spriteOf('ch5-landing'),/place-ch5-landing-1\.webp$/);await fits('after a stage');await page.locator('#coastMap .close').click();
    await write(`for(const t of arg)s.built[t]=3,s.materials[t]=3;s.built['ch5-lock']=2;s.materials['ch5-lock']=3;s.seen['ch5-crossing']=true;s.seen['ch5-ledger']=true;`,IDS);
    await reload();await beats();
   }
   // the inner lock's last stage: "Behind the Vault" is Chapter 5's last story card (build 51a: no longer
   // the end card), naming Chapter 6, then the station's arrival; no end card, nothing again after a reload
   const last=await build('ch5-lock');
   assert.match(last.text,/Chapter 5 complete/);assert.match(last.text,/Behind the Vault/);assert.match(last.text,/The passage leads back beneath the Vault/);
   assert.match(last.text,/Chapter 6 · The Keeper's Promise/,tag('the next chapter named'));assert.match(last.text,/The Vault protected a coastal station/,tag('then the Chapter 6 arrival'));
   assert.equal(await page.locator('#endDialog[open]').count(),0,tag('no end card: Chapter 6 follows'));
   s=await save();assert.equal(s.area,7);assert.equal(s.built['ch5-lock'],3);assert.equal(s.seen['ch5-station'],true);assert.equal(s.seen['ch6-arrival'],true);assert.notEqual(s.seenEnd,true);
   assert.equal(s.orders.find(o=>o?.story)?.story,'ch6-landing',tag('the inner landing\'s gold order up'));
   await openMap();assert.match(await page.locator('#coastMap .sceneBase').getAttribute('src'),/station-map-before\.webp$/,tag('the damaged station next'));
   assert.match(await page.locator('#coastMap .mapArea.done').last().textContent(),/The Lowwater Passage\s*Complete/,tag('the passage listed as complete'));
   await fits('next chapter');await shot('5-next');await page.locator('#coastMap .close').click();
   await reload();await page.waitForTimeout(500);assert.equal(await page.locator('#endDialog[open]').count(),0,tag('no end card'));assert.equal(await beats(),'',tag('no story card again'));
   assert.deepEqual(missing,[],tag('every passage picture loads'));assert.deepEqual(errors,[],tag('no page errors'));
   await context.close();
  }
  console.log(`${engine} Coast Camp Chapter 5: finished Chapter 4 save → (message once when unseen) → arrival once → landing gold marked → damaged passage, one pin, 7 places → 21 stages by hand at 390 (captions, own sprites, one place open at a time, crossing and route cards once) → "Behind the Vault" then the Chapter 6 arrival (no end card) → the station next; 360/430/907×510 entry, stage, end; pictures load, no overflow passed`);
  }finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exit(1);});
