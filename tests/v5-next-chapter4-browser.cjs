// Coast Camp Chapter 4, the Answering Light, in a real browser (build 49a; docs/V5_CHAPTER4_ANSWERING_LIGHT_2026-11-02.md).
// A camp that finished Chapter 3 (its end card seen, a board, shed, waiting reward, energy above capacity)
// loads into the headland: the arrival card once, its button marking the landing's gold order; the coast
// screen shows the damaged headland (the restored one only when the chapter is done) with a pin on each
// open place; each stage bought through the real UI (its gold order delivered from the board, then built
// on the coast screen) puts its own sprite on its place's card and tile, and says its line as a caption
// (no dialog); after the steps, either branch can be chosen ("Work on this next"); the keeper's log and
// the first light (one beam sweep, still with reduced motion) once each; the relay's stored message is the
// end card, once (this chapter 21 / 21, the camp's total apart, no Chapter 5), "View the restored
// headland" shows it, and a reload shows nothing again.
// At 390 x 844 all 21 stages by hand; at 360 x 780, 430 x 932 and 907 x 510 the entry, a stage, the branch
// choice and the end. Every picture loads; nothing scrolls sideways; buttons are 44 px.
//   SHOTS=<dir> saves screenshots.
const assert=require('node:assert/strict');const path=require('node:path');const {chromium,webkit}=require('playwright');const {throughHome}=require('./v5-next-home-helper.cjs');
const URL='http://127.0.0.1:8080/v5/play.html',KEY='vaultwake-v5-coast',SHOTS=process.env.SHOTS;
(async()=>{
 const {AREAS,TASKS}=await import('../v5/next/areas.mjs');
 const before=Object.fromEntries(AREAS.slice(0,5).flatMap(a=>a.tasks).map(t=>[t.id,3]));
 const IDS=AREAS[5].tasks.map(t=>t.id);
 const engines=(process.env.ENGINES||'chromium,webkit').split(',').map(e=>[e,{chromium,webkit}[e]]);
 for(const [engine,type] of engines){
  let browser;try{browser=await type.launch();}catch(e){if(engine!=='chromium'&&/Executable doesn't exist/.test(e.message)){console.log(`${engine}: not installed here, skipped`);continue;}throw e;}
  try{for(const [W,H] of [[390,844],[360,780],[430,932],[907,510]]){
   const full=W===390;
   const context=await browser.newContext({viewport:{width:W,height:H},isMobile:W<700&&engine==='chromium',hasTouch:W<700,reducedMotion:'reduce'});
   const page=await context.newPage(),errors=[],missing=[];throughHome(page);
   page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
   page.on('response',r=>{if(r.status()>=400&&/answering-light|headland/.test(r.url()))missing.push(r.status()+' '+r.url());});
   const tag=s=>`${engine} ${W}×${H}: ${s}`,save=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
   const shot=async name=>{if(SHOTS)await page.screenshot({path:path.join(SHOTS,`ch4-${W}x${H}-${name}.png`)});};
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
   const openMap=async()=>{if(!(await page.locator('#coastMap[open]').count())){await page.locator('#mapButton').click();await page.waitForSelector('#coastMap[open]');}};
   await page.goto(URL+'?new=1');await page.waitForSelector('#board .tile');await beats();
   // a camp at the end of Chapter 3, as build 48c saved it: still in the harbour, its end card seen
   await write(`Object.assign(s,{area:4,built:arg,materials:{...arg},coins:900,moves:6000,ordersDone:560,energy:137,level:{version:1,level:24,xp:5},capPaid:100,seenEnd:true,daily:{day:9e6,count:1},
    secOpen:{rig:true,chart:true},seen:{door:true,'vault-open':true,archive:true,'obs-signal':true,'obs-harbour':true,'hb-arrival':true,'hb-cargo':true,'hb-signal':true}});
    s.shed[0]={type:'item',family:'rope',tier:3};s.pending=[{type:'token'}];const r=s.board.findIndex(x=>x?.type==='source'&&x.id==='rig');s.board[r]={...s.board[r],level:2};
    for(const id of ['chart','rope','shell','lamp','optic']){const i=s.board.findIndex(x=>x===null||x.type==='cargo');s.board[i]={type:'source',id,...(id==='chart'?{level:2}:{})};}`,before);
   await reload();
   // the arrival, once (the launch card is not shown again: it was this camp's end card)
   await page.waitForSelector('#beat[open] .revealPanel.portrait',{timeout:5000});
   const img=await page.locator('#beat .revealPanel.portrait img').evaluate(async i=>{await i.decode().catch(()=>{});return {w:i.naturalWidth,alt:i.alt};});
   assert.ok(img.w>0&&/lighthouse/i.test(img.alt),tag('the arrival picture loads and is described'));
   const card=await page.locator('#beatContent').textContent();assert.match(card,/Chapter 4 · The Answering Light/);assert.match(card,/A light without a keeper/);assert.match(card,/The tower is dark/);assert.match(card,/First we need a safe way up/);
   assert.equal(await page.locator('#beatNext').textContent(),'Secure the landing');assert.doesNotMatch(card,/The boat is ready/,tag('the launch is not shown twice'));
   await fits('arrival card');await shot('1-arrival');await page.locator('#beatNext').click();await page.waitForTimeout(200);
   let s=await save();assert.equal(s.area,5);assert.equal(s.seen['ch4-arrival'],true);assert.equal(s.seen['hb-launch'],true);
   assert.equal(s.energy,137,tag('energy above capacity kept'));assert.equal(s.coins,900);assert.deepEqual(s.shed[0],{type:'item',family:'rope',tier:3});assert.ok(s.pending.length>=0);
   const gold=s.orders.find(o=>o?.story==='ch4-landing');assert.ok(gold,tag('the landing\'s gold order'));assert.match(await page.locator('#message').textContent(),/Brace the landing/);
   await reload();assert.equal(await beats(),'',tag('the arrival plays once'));
   // the coast screen: the damaged headland, one pin (the landing), seven places, the landing's stage-1 sprite as the preview
   await openMap();
   const scene=await page.evaluate(async()=>{const q=s=>document.querySelector('#coastMap '+s);await q('.sceneBase')?.decode().catch(()=>{});return {base:q('.sceneBase')?.getAttribute('src'),done:!!q('.beachScene.complete'),pins:document.querySelectorAll('#coastMap .siteMarker').length,places:document.querySelectorAll('#coastMap .places .place').length,ok:q('.sceneBase').naturalWidth>0};});
   assert.match(scene.base,/answering-light\/headland-map-before\.webp$/,tag('the damaged headland'));assert.equal(scene.done,false);assert.equal(scene.pins,1);assert.equal(scene.places,7);assert.ok(scene.ok,tag('the map loads'));
   for(const m of await page.locator('#coastMap .siteMarker').all()){const r=await m.boundingBox();assert.ok(r.width>=43.5&&r.height>=43.5,tag('pin 44 px'));}
   assert.match(await page.locator('#mapCard .cardArt img').getAttribute('src'),/answering-light\/place-ch4-landing-1\.webp$/,tag('the next stage\'s own sprite'));
   await fits('headland coast');await shot('2-coast');await page.locator('#coastMap .close').click();
   // buys one stage by hand: its gold order's parts laid on the board and delivered, then built on the coast screen
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
   // the stage's own sprite on its card and its tile
   const spriteOf=async id=>{await openMap();await page.locator(`#coastMap .places [data-select="${id}"]`).click();return page.locator(`#coastMap .places [data-place="${id}"] .placeIcon img`).getAttribute('src');};
   if(full){
    let stages=0,log=false,light=false;
    for(const id of ['ch4-landing','ch4-steps']){for(let k=0;k<3;k++){const r=await build(id);stages++;assert.equal(r.dialog,0,tag(`${id} ${r.stage}: its line is a caption, not a dialog`));
     assert.match(await spriteOf(id),new RegExp(`place-${id}-${r.stage}\\.webp$`),tag(`${id} ${r.stage}: its own sprite`));await page.locator('#coastMap .close').click();}}
    // both branches open: choose the workshop first
    await openMap();await page.locator('#coastMap .places [data-select="ch4-workshop"]').click();
    s=await save();const was=s.orders.find(o=>o?.story)?.story;
    if(was!=='ch4-workshop'){const b=page.locator('#coastMap [data-aim="ch4-workshop"]');assert.equal(await b.textContent(),'Work on this next');const r=await b.boundingBox();assert.ok(r.height>=43.5,tag('the choice is 44 px'));
     await b.click();await page.waitForTimeout(200);}
    s=await save();assert.equal(s.orders.find(o=>o?.story)?.story,'ch4-workshop',tag('the gold order follows the choice'));assert.equal(s.aim,'ch4-workshop');
    await fits('branch choice');await shot('3-branch');await page.locator('#coastMap .close').click();
    for(const id of ['ch4-workshop','ch4-cottage','ch4-records','ch4-lighthouse','ch4-relay']){
     const n=id==='ch4-relay'?2:3;
     for(let k=0;k<n;k++){s=await save();if(!s.orders.some(o=>o?.story===id)){await openMap();await page.locator(`#coastMap .places [data-select="${id}"]`).click();const b=page.locator(`#coastMap [data-aim="${id}"]`);if(await b.count()){await b.click();await page.waitForTimeout(150);}await page.locator('#coastMap .close').click().catch(()=>{});}
      const r=await build(id);stages++;
      if(/A reply left waiting/.test(r.text)){log=true;assert.match(r.text,/answers a signal on its own/);}
      if(/The headland wakes/.test(r.text)){light=true;}
      if(!(id==='ch4-cottage'&&r.stage===3)&&!(id==='ch4-lighthouse'&&r.stage===3))assert.equal(r.dialog,0,tag(`${id} ${r.stage}: a caption`));
      assert.match(await spriteOf(id),new RegExp(`place-${id}-${r.stage}\\.webp$`),tag(`${id} ${r.stage}: its own sprite`));
      if(id==='ch4-lighthouse'&&r.stage===2){assert.equal((await page.evaluate(()=>document.querySelector('#coastMap .sceneBase').getAttribute('src'))).includes('before'),true,tag('no lit headland before the chapter is done'));}
      await page.locator('#coastMap .close').click().catch(()=>{});}}
    assert.ok(log,tag('the keeper\'s log card'));assert.ok(light,tag('the first light card'));assert.equal(stages,20);
    s=await save();assert.equal(s.seen['ch4-log'],true);assert.equal(s.seen['ch4-light'],true);
    // the relay waits for the lighthouse and the records, then the stored message (built below)
   }else{
    // the other sizes: the landing's first stage by hand, then the camp moved on to the relay's last stage
    const r=await build('ch4-landing');assert.equal(r.dialog,0,tag('a caption'));assert.match(await spriteOf('ch4-landing'),/place-ch4-landing-1\.webp$/);await fits('after a stage');await page.locator('#coastMap .close').click();
    await write(`for(const t of arg)s.built[t]=3,s.materials[t]=3;for(const t of ['ch4-cottage','ch4-workshop','ch4-records','ch4-lighthouse','ch4-relay']){delete s.built[t];delete s.materials[t];}s.orders=s.orders.map(o=>o?.story?{...o,story:'ch4-cottage',needs:[{family:'rig',tier:3,count:1},{family:'shell',tier:2,count:1}]}:o);`,['ch4-landing','ch4-steps']);
    await reload();await beats();await openMap();await page.locator('#coastMap .places [data-select="ch4-workshop"]').click();
    const b=page.locator('#coastMap [data-aim="ch4-workshop"]');const box=await b.boundingBox();assert.ok(box.height>=43.5);await b.click();await page.waitForTimeout(200);
    s=await save();assert.equal(s.orders.find(o=>o?.story)?.story,'ch4-workshop',tag('the branch choice'));await fits('branch choice');await shot('3-branch');await page.locator('#coastMap .close').click();
    await write(`for(const t of arg)s.built[t]=3,s.materials[t]=3;s.built['ch4-relay']=2;s.materials['ch4-relay']=3;s.seen['ch4-log']=true;s.seen['ch4-light']=true;`,IDS);
    await reload();await beats();
   }
   // the relay's stored message: the end card, once
   await build('ch4-relay');
   await page.waitForSelector('#endDialog[open]',{timeout:6000});
   const end=await page.locator('#endContent').textContent();
   assert.match(end,/Chapter 4 complete/);assert.match(end,/The headland answers/);assert.match(end,/A passage through the reef, marked for low water/);assert.match(end,/You restored the light and decoded a route through the reef/);
   assert.match(end,/This chapter's stages\s*21 \/ 21/,tag('this chapter\'s count'));assert.match(end,/All chapters so far\s*105 \/ 105/,tag('the camp\'s total, labelled apart'));
   assert.doesNotMatch(end,/Chapter 5|not available yet/,tag('no Chapter 5 offered'));assert.equal(await page.locator('#endContent button').count(),3);
   const endImg=await page.locator('#endContent .endArt img').evaluate(async i=>{await i.decode().catch(()=>{});return i.naturalWidth;});assert.ok(endImg>0,tag('the stored message picture loads'));
   for(const sel of ['[data-view]','[data-keep]'])assert.ok(await page.locator('#endContent '+sel).isVisible(),tag(sel+' shown'));
   for(const f of await page.locator('#endContent .revealLine img.face').all()){const r=await f.boundingBox();assert.ok(r.width<=48,tag('speaker portraits are small'));}
   for(const b of await page.locator('#endContent button').all()){const r=await b.boundingBox();if(r)assert.ok(r.height>=43.5,tag('end buttons 44 px'));}
   await fits('end card');await shot('5-end');
   s=await save();assert.equal(s.seenEnd,true);assert.equal(s.built['ch4-relay'],3);
   await page.locator('#endContent [data-view]').click();await page.waitForSelector('#coastMap[open]');await page.waitForTimeout(400);
   assert.match(await page.locator('#coastMap .sceneBase').getAttribute('src'),/headland-map-after\.webp$/,tag('the restored headland'));assert.ok(await page.locator('#coastMap .beachScene.headland.complete').count());
   await fits('restored headland');await shot('6-restored');await page.locator('#coastMap .close').click();
   await reload();await page.waitForTimeout(500);assert.equal(await page.locator('#endDialog[open]').count(),0,tag('the end card once'));assert.equal(await beats(),'',tag('no story card again'));
   assert.equal((await save()).coins>=0,true);
   assert.deepEqual(missing,[],tag('every headland picture loads'));assert.deepEqual(errors,[],tag('no page errors'));
   await context.close();
  }
  console.log(`${engine} Coast Camp Chapter 4: finished Chapter 3 save → arrival once (launch not repeated) → landing gold marked → damaged headland, pins, 7 places → 21 stages by hand at 390 (captions, own sprites, branch choice, log and first-light cards once, no lit tower early) → stored message end card once (21/21, 105/105 apart, no Chapter 5) → restored headland; 360/430/907×510 entry, stage, branch choice, end; pictures load, no overflow passed`);
  }finally{await browser.close();}}
})().catch(e=>{console.error(e);process.exit(1);});
