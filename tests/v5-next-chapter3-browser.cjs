// Coast Camp Chapter 3, the Hidden Harbour, in a real browser (build 48a; docs/V5_CHAPTER3_HARBOUR_2026-11-01.md).
// A camp that finished Chapter 2 (its end card seen, a board, shed, waiting reward and energy) loads into
// the harbour: the arrival card once (and not after a reload), the landing's gold order marked; the coast
// screen shows the damaged harbour with nothing stood on it; each stage bought through the real UI (its
// gold order delivered by hand, then built on the coast screen) uncovers its own spot from the restored
// painting; the crane's cargo card and the signal's card once; the launch ends Chapter 3 with its card
// (build 49a) the launch is Chapter 3's last story card, once, leading on to Chapter 4's arrival, once; a reload shows neither again.
// At 390 x 844 all 21 stages are bought by hand; at 360, 430 and 907 x 510 the entry, the coast screen,
// one story card and the end. Every picture loads; nothing overflows; buttons are 44 px.
//   SHOTS=<dir> saves screenshots.
const assert=require('node:assert/strict');const path=require('node:path');const {chromium,webkit}=require('playwright');const {throughHome}=require('./v5-next-home-helper.cjs');
const URL='http://127.0.0.1:8080/v5/play.html',KEY='vaultwake-v5-coast',SHOTS=process.env.SHOTS;
(async()=>{
 const {AREAS}=await import('../v5/next/areas.mjs');
 const built=Object.fromEntries(AREAS.slice(0,4).flatMap(a=>a.tasks).map(t=>[t.id,3]));
 const IDS=AREAS[4].tasks.map(t=>t.id);
 const engines=(process.env.ENGINES||'chromium,webkit').split(',').map(e=>[e,{chromium,webkit}[e]]);
 for(const [engine,type] of engines){
  let browser;try{browser=await type.launch();}catch(e){if(engine!=='chromium'&&/Executable doesn't exist/.test(e.message)){console.log(`${engine}: not installed here, skipped`);continue;}throw e;}
  try{for(const [W,H] of [[390,844],[360,780],[430,932],[907,510]]){
   const full=W===390;let launchText='';
   const context=await browser.newContext({viewport:{width:W,height:H},isMobile:W<700&&engine==='chromium',hasTouch:W<700,reducedMotion:'reduce'});
   const page=await context.newPage(),errors=[],missing=[];throughHome(page);
   page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
   page.on('response',r=>{if(r.status()>=400&&/hidden-harbour|harbour/.test(r.url()))missing.push(r.status()+' '+r.url());});
   const tag=s=>`${engine} ${W}×${H}: ${s}`,save=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
   const shot=async name=>{if(SHOTS)await page.screenshot({path:path.join(SHOTS,`ch3-${W}x${H}-${name}.png`)});};
   const write=(src,arg)=>page.evaluate(([k,src,arg])=>{const s=JSON.parse(localStorage.getItem(k));new Function('s','arg',src)(s,arg);localStorage.setItem(k,JSON.stringify(s));},[KEY,src,arg]);
   const reload=async()=>{await page.reload();await page.waitForSelector('#board .tile');};
   // close every story card in turn, returning their text
   const beats=async()=>{const t=[];/* First Session 2.0: a stage's lines are a card under the coast picture */{const rc=page.locator('#coastMap .restoredCard');if(await rc.count()){t.push(await rc.textContent());await rc.evaluate(e=>e.remove());}}for(let n=0;n<12&&await page.locator('#beat[open]').count();n++){t.push(await page.locator('#beatContent').textContent());
    const b=await page.locator('#beatNext').boundingBox();assert.ok(b.height>=43.5,tag('story button 44 px'));await page.locator('#beatNext').click();await page.waitForTimeout(90);}return t.join(' | ');};
   const fits=async what=>{const o=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,vw:innerWidth}));assert.ok(o.doc<=o.vw+1,tag(`${what}: no sideways scroll (${o.doc} > ${o.vw})`));};
   await page.goto(URL+'?new=1');await page.waitForSelector('#board .tile');await beats();
   // a camp at the end of Chapter 2, as build 47v left it: still in the Vault, its end card seen
   await write(`Object.assign(s,{area:3,built:arg,materials:{...arg},coins:4000,moves:4000,ordersDone:400,energy:77,seenEnd:true,daily:{day:9e6,count:1},
    seen:{door:true,'vault-open':true,archive:true,'obs-signal':true,'obs-harbour':true}});s.shed[0]={type:'item',family:'rope',tier:3};s.pending=[{type:'token'}];`,built);
   await reload();
   // the arrival, once: a fresh rope; its button marks the landing's gold order
   assert.equal(await page.locator('#beat[open] .revealPanel.story img').count(),1,tag('the arrival card'));
   const img=await page.locator('#beat .revealPanel.story img').evaluate(i=>({w:i.naturalWidth,alt:i.alt}));assert.ok(img.w>0&&/fresh/i.test(img.alt),tag('its picture loads and is described'));
   const card=await page.locator('#beatContent').textContent();assert.match(card,/Chapter 3/);assert.match(card,/This knot is fresh/);assert.match(card,/Clear the landing/);
   await fits('arrival card');await shot('1-arrival');await beats();
   let s=await save();assert.equal(s.area,4,tag('in the harbour'));assert.equal(s.seen['hb-arrival'],true);assert.notEqual(s.seenEnd,true);
   assert.equal(s.energy,77);assert.equal(s.coins,4000);assert.deepEqual(s.shed[0],{type:'item',family:'rope',tier:3});assert.ok(s.pending.length>=0);
   const gold=s.orders.find(o=>o?.story==='hb-landing');assert.ok(gold,tag('the landing\'s gold order'));
   await reload();assert.equal(await beats(),'',tag('the arrival plays once'));
   // the coast screen: the damaged harbour, dimmed, nothing stood on it, seven places listed
   await page.locator('#mapButton').click();await page.waitForSelector('#coastMap[open]');
   const scene=await page.evaluate(()=>{const q=s=>document.querySelector('#coastMap '+s);return {base:q('.sceneBase')?.getAttribute('src'),layers:[...document.querySelectorAll('#coastMap .sceneColor')].map(i=>i.getAttribute('src')),
    icons:document.querySelectorAll('#coastMap .restoredIcon').length,places:document.querySelectorAll('#coastMap .places .place').length,ratio:(()=>{const r=q('.beachScene').getBoundingClientRect();return r.width/r.height;})()};});
   assert.match(scene.base,/hidden-harbour\/harbour-map-before\.webp$/,tag('the damaged harbour'));assert.ok(scene.layers.some(x=>/harbour-map-after\.webp$/.test(x)),tag('the restored painting, masked'));
   assert.equal(scene.icons,0,tag('no building stood on the painted map'));assert.equal(scene.places,7);assert.ok(Math.abs(scene.ratio-1024/1195)<.02,tag(`picture ratio ${scene.ratio}`));
   await fits('coast screen');await shot('2-coast-start');await page.locator('#coastMap .close').click();
   // build one stage through the UI: gold order delivered by hand, then the stage on the coast screen
   const masks=()=>page.evaluate(()=>[...document.querySelectorAll('#coastMap .sceneColor')].map(i=>(i.style.maskImage||i.style.webkitMaskImage||'').split('radial-gradient').length-1).reduce((a,b)=>a+b,0));
   async function build(id){
    let s=await save();const u=s.orders.find(o=>o?.story===id);
    if(u){await write(`const o=s.orders.find(x=>x?.story===arg);let k=0;const free=s.board.reduce((a,x,i)=>x===null||x.type==='cargo'?[...a,i]:a,[]);for(const r of o.needs)for(let c=0;c<r.count;c++)s.board[free[k++]]={type:'item',family:r.family,tier:r.tier};`,id);
     await reload();await beats();await page.locator(`#requests [data-order="${u.id}"]`).click();await page.waitForTimeout(120);
     await page.locator('#hint[data-kind="deliver"]').click({timeout:1200}).catch(()=>{});
     await page.waitForFunction(([k,id])=>!JSON.parse(localStorage.getItem(k)).orders.some(o=>o?.id===id),[KEY,u.id],{timeout:5000});await beats();}
    await write(`for(let i=0;i<s.board.length;i++)if(s.board[i]?.type==='item'&&s.board.filter(x=>x===null).length<8)s.board[i]=null;s.coins=Math.max(s.coins,2000);`);await reload();await beats();
    await page.locator('#mapButton').click();await page.waitForSelector('#coastMap[open]');
    const before=await masks();await page.locator(`#coastMap .places [data-select="${id}"]`).click();await page.locator(`#coastMap [data-restore="${id}"]`).click();await page.waitForTimeout(300);
    // the stage's lines, then (0.9 s later) any story card it brings
    let text=await beats();await page.waitForTimeout(1300);text+=' | '+await beats();
    return {text,before};
   }
   if(full){
    // as a player goes: whichever stage's gold order stands (one at a time), else a stage whose materials
    // are in; each stage uncovers more of the restored painting
    let stages=0,cargo=false,signal=false;
    while(stages<21){
     s=await save();const g=s.orders.find(o=>o?.story);
     const id=g?g.story:await page.evaluate(async k=>{const m=await import('/v5/next/game.mjs');const s=m.load(localStorage.getItem(k),Date.now());return m.upgrades(s).find(u=>u.materials)?.id;},KEY);
     assert.ok(id,tag('something to build at stage '+stages));
     const r=await build(id);stages++;
     if(id==='hb-departure')launchText=r.text;
     if(/Recovered cargo/.test(r.text)&&/That mark again/.test(r.text))cargo=true;if(/An answering light/.test(r.text)&&/A light answered us/.test(r.text))signal=true;
     s=await save();
     if(stages<21){if(!(await page.locator('#coastMap[open]').count())){await page.locator('#mapButton').click();await page.waitForSelector('#coastMap[open]');}
      assert.ok(await masks()>r.before||stages===1&&await masks()>=1,tag(`${id} stage ${s.built[id]}: its spot uncovered (${r.before} → ${await masks()})`));
      if(stages===9)await shot('3-coast-midway');
      await page.locator('#coastMap .close').click();}
     if(id==='hb-crane'&&s.built[id]===3){assert.ok(cargo,tag('the cargo card after the crane'));assert.equal(s.seen['hb-cargo'],true);}
    }
    assert.ok(signal,tag('the signal card'));assert.equal(stages,21);
   }else{
    // the other sizes: the landing's first stage by hand, then the camp moved to the launch
    await build('hb-landing');s=await save();assert.equal(s.built['hb-landing'],1);
    await write(`for(const t of arg)s.built[t]=3;for(const t of arg)s.materials[t]=3;s.built['hb-crane']=2;s.materials['hb-crane']=3;s.seen['hb-cargo']=undefined;delete s.seen['hb-cargo'];s.coins=3000;`,['hb-landing','hb-warehouse']);
    await reload();await beats();
    await write(`s.built['hb-crane']=2;s.materials['hb-crane']=3;s.coins=3000;`);await reload();await beats();
    await page.locator('#mapButton').click();await page.waitForSelector('#coastMap[open]');await page.locator('#coastMap .places [data-select="hb-crane"]').click();await page.locator('#coastMap [data-restore="hb-crane"]').click();await page.waitForTimeout(300);
    // the stage's own lines, then (0.9 s later) the cargo card
    await beats();await page.waitForSelector('#beat[open]',{timeout:3000});
    let n=0,cargoText='';for(;n<8&&await page.locator('#beat[open]').count();n++){const t=await page.locator('#beatContent').textContent();if(/Recovered cargo/.test(t)){cargoText=t;await fits('cargo card');await shot('4-cargo');}await page.locator('#beatNext').click();await page.waitForTimeout(90);}
    assert.match(cargoText,/That mark again/,tag('the cargo card'));assert.match(cargoText,/Reopen the office|Sort the supplies/,tag('it names the next step or what it waits for'));
    // to the last stage: everything built but the launch
    await write(`for(const t of arg)s.built[t]=3,s.materials[t]=3;s.built['hb-departure']=2;s.materials['hb-departure']=3;s.seen['hb-cargo']=true;s.seen['hb-signal']=true;s.coins=3000;`,IDS);
    await reload();await beats();
    await page.locator('#mapButton').click();await page.waitForSelector('#coastMap[open]');await page.locator('#coastMap .places [data-select="hb-departure"]').click();await page.locator('#coastMap [data-restore="hb-departure"]').click();await page.waitForTimeout(300);
    // the launch's own lines, then (0.9 s later) its card and the Chapter 4 arrival, each taken in turn
    launchText=await beats();await page.waitForTimeout(1300);launchText+=' | '+await beats();
   }
   // the launch (build 49a): Chapter 3's last story card, once, leading on to Chapter 4 (no end card),
   // then the Answering Light's arrival card, once (taken in turn above)
   assert.match(launchText,/Chapter 3 complete[\s\S]*The boat is ready[\s\S]*Now we have a direction/,tag('the launch card'));
   assert.match(launchText,/Chapter 4 · The Answering Light/,tag('it names what comes next'));
   assert.match(launchText,/A light without a keeper[\s\S]*First we need a safe way up/,tag('then the Chapter 4 arrival'));
   assert.equal(await page.locator('#endDialog[open]').count(),0,tag('no end card: the story goes on'));assert.ok(await page.locator('#board .tile').count()>30,tag('back to the board'));
   s=await save();assert.equal(s.area,5);assert.equal(s.seen['hb-launch'],true);assert.equal(s.seen['ch4-arrival'],true);assert.notEqual(s.seenEnd,true);
   assert.equal(s.orders.find(o=>o?.story)?.story,'ch4-landing',tag('the landing\'s gold order up'));
   await reload();await page.waitForTimeout(400);assert.equal(await page.locator('#endDialog[open]').count(),0);assert.equal(await beats(),'',tag('no story card again'));
   // the coast screen now shows the damaged headland, the harbour listed as complete
   await page.locator('#mapButton').click();await page.waitForSelector('#coastMap[open]');
   assert.ok(await page.locator('#coastMap .beachScene.headland:not(.complete)').count(),tag('the damaged headland'));assert.match(await page.locator('#coastMap').innerText(),/The Hidden Harbour[\s\S]*Complete/);
   await fits('headland coast');await shot('6-headland');
   assert.deepEqual(missing,[],tag('every harbour picture loads'));assert.deepEqual(errors,[],tag('no page errors'));
   await context.close();
  }
  console.log(`${engine} Coast Camp Chapter 3: finished Chapter 2 save → arrival once → landing gold marked → coast (damaged harbour, nothing stood on it, 7 places) → 21 stages by hand at 390 (each uncovering its spot; cargo and signal cards once) → launch card once → Chapter 4 arrival once → board; 360/430/907×510 entry, cargo card, end; pictures load, no overflow passed`);
  }finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exit(1);});
