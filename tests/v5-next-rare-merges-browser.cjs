// Coast Camp rare merges and restoration (build 48b; docs/V5_RARE_MERGES_RESTORATION_2026-11-01.md) in a
// real browser, at 360, 390 and 430 px portrait and 907×510 landscape (touch), reduced motion and not.
// 1. A level-8 camp at the signal mast objective, coins saved, both rare chains open (level-2 Rivet Rover
//    and Survey Kite): the gold order's compact panel names the stage, each item with its icon and
//    held/needed count, how to make the missing one ("Merge matching items to reach …"), the build cost
//    and that the coins are in hand; the old "merge up N times" and "the gold order stays" are gone; the
//    full chain sits behind "How to make these"; "Show" highlights the producer on the board. Delivered,
//    "Materials secured" says "Build · 100 coins", the strip turns to Build at once, and the strip leads
//    to the coast screen where the stage is built; a reload pays nothing twice.
// 2. Gear the hoist (a stage that asks a merged rare part): a Bolt selected says "Needed for …: merge
//    matching items to reach Gear"; with too few coins, delivering says how many more coins it takes,
//    and the strip shows it.
// Nothing scrolls sideways; buttons are 44 px; no page errors.
//   SHOTS=<dir> also saves screenshots.
const assert=require('node:assert/strict');const path=require('node:path');const {chromium,webkit}=require('playwright');const {throughHome}=require('./v5-next-home-helper.cjs');
const URL='http://127.0.0.1:8080/v5/play.html',KEY='vaultwake-v5-coast',SHOTS=process.env.SHOTS;
(async()=>{
 const g=await import('../v5/next/game.mjs'),{AREAS}=await import('../v5/next/areas.mjs');
 const done=a=>Object.fromEntries(a.tasks.map(t=>[t.id,3]));
 // the two camps, made by the engine itself (their gold orders are what makeOrder asks there)
 const camp=(area,built,coins)=>{const s=g.fresh(0);Object.assign(s,{area,built,materials:{...built},coins,orderSeq:300,level:{version:1,level:8,xp:0},capPaid:g.capacityAt(8),energy:60,
   secOpen:{rig:true,chart:true},secIntro:[],daily:{day:9e6,count:1},seen:{door:true,'vault-open':true,archive:true}});
  // a mid-game camp: its crates and ice opened long ago
  s.board=s.board.map(x=>x?.type==='source'?x:null);s.found.push('mech0','notes0');s.orders=[];return s;};
 // both rare chains open: a level-2 Rivet Rover and a level-2 Survey Kite on the board
 const withKite=s=>{const r=s.board.findIndex(x=>x?.type==='source'&&x.id==='rig');s.board[r]={...g.source('rig'),level:2};s.board[s.board.indexOf(null)]={...g.source('chart'),level:2};return s;};
 const mast=withKite(camp(0,{'beach-path':3,'beach-tent':3},540)),hoist=withKite(camp(1,{...done(AREAS[0]),...done(AREAS[1]),'ws-hoist':1,'ws-door':1},40));
 const rover=mast.board.findIndex(x=>x?.type==='source'&&x.id==='rig');
 const goldOf=s=>{const o=g.makeOrder(s);assert.ok(o.story);return o;};
 // build 51d: Chapter 1 gold orders take turns between recipe shapes (game.mjs goldShape); this flow is about the
 // mast's usual materials and the hoist's Gear, so the turn is pinned to the usual shape while the orders are made
 const turn=[...g.GOLD_TURN];g.GOLD_TURN.splice(0,turn.length,...turn.map(()=>0));
 const mastGold=goldOf(mast),hoistGold=goldOf(hoist);g.GOLD_TURN.splice(0,turn.length,...turn);
 assert.equal(mastGold.story,'beach-mast');assert.deepEqual(mastGold.needs,[{family:'chart',tier:3,count:1},{family:'rig',tier:3,count:2}],'the mast\'s materials');assert.equal(hoistGold.needs.length,3,'Gear the hoist has two ordinary ingredients plus a rare Gear');assert.deepEqual(hoistGold.needs.at(-1),{family:'mech',tier:1,count:1});assert.equal(hoistGold.needs.filter(n=>!g.isSecondary(n.family)).length,2);
 const engines=(process.env.ENGINES||'chromium,webkit').split(',').map(e=>[e,{chromium,webkit}[e]]);
 for(const [engine,type] of engines){
  let browser;try{browser=await type.launch();}catch(e){if(engine!=='chromium'&&/Executable doesn't exist/.test(e.message)){console.log(`${engine}: not installed here, skipped`);continue;}throw e;}
  try{for(const [W,H] of [[390,844],[360,780],[430,932],[907,510]])for(const motion of W===390?['no-preference','reduce']:['reduce']){
   const context=await browser.newContext({viewport:{width:W,height:H},isMobile:W<700&&engine==='chromium',hasTouch:true,reducedMotion:motion});
   const page=await context.newPage(),errors=[];throughHome(page);
   page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
   const tag=s=>`${engine} ${W}×${H} ${motion}: ${s}`,save=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
   const shot=async name=>{if(SHOTS&&motion==='reduce')await page.screenshot({path:path.join(SHOTS,`rare-${W}x${H}-${name}.png`)});};
   const beats=async()=>{for(let n=0;n<8&&await page.locator('#beat[open]').count();n++){await page.locator('#beatNext').click();await page.waitForTimeout(90);}};
   const fits=async what=>{const o=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,vw:innerWidth}));assert.ok(o.doc<=o.vw+1,tag(`${what}: no sideways scroll (${o.doc} > ${o.vw})`));};
   const big=async(sel,what)=>{for(const b of await page.locator(sel).all()){const r=await b.boundingBox();if(r)assert.ok(r.height>=43.5&&r.width>=43.5,tag(`${what} is 44 px (${JSON.stringify(r)})`));}};
   // a camp: the engine's state, with the given board items (the rest of the board's loose parts cleared)
   // and its gold order first; written over a new camp, then reloaded
   const load=async(s,gold,items)=>{const t=structuredClone(s);t.board=t.board.map(x=>x?.type==='item'?null:x);
    for(const [f,tier] of items)t.board[t.board.indexOf(null)]=g.item(f,tier);
    const crew=g.fresh(0).orders.slice(0,2).map((o,k)=>({...o,id:'c'+k}));t.orders=[gold,...crew];
    await page.evaluate(([k,v])=>localStorage.setItem(k,v),[KEY,JSON.stringify(t)]);await page.reload();await page.waitForSelector('#board .tile');await beats();};
   await page.goto(URL+'?new=1');await page.waitForSelector('#board .tile');await beats();

   // 1. the signal mast: a Survey scope in hand, one Pocket winch of two
   await load(mast,mastGold,[['chart',3],['rig',3],['rig',2],['mech',1],['notes',0]]);
   await page.locator(`[data-order="${mastGold.id}"]`).click();await page.waitForSelector('#orderTools .goldNeeds');
   const panel=await page.locator('#orderTools').innerText();
   assert.match(panel,/Raise the signal mast/,tag('the stage'));assert.match(panel,/100 to build: you have it/,tag('the build cost, once (build 51d)'));
   assert.match(panel,/Survey scope\s*1\/1/,tag('held/needed'));assert.match(panel,/Pocket winch\s*1\/2/,tag('held/needed'));assert.match(panel,/Landing Beach · /,tag('the place'));
   assert.equal(await page.locator('#orderTools .locate').count(),1,tag('one button for the Rivet Rover, not one per part (build 51d)'));assert.equal(await page.locator('#orderTools .locate').getAttribute('aria-label'),'Show the Rivet Rover');assert.doesNotMatch(panel,/merge matching items to reach Pocket winch/i,tag('not said twice'));assert.match(panel,/you have it/,tag('the coins are in hand'));
   assert.doesNotMatch(panel,/merge up \d|times|stays/i,tag('no "merge up N times", no "the gold order stays"'));
   assert.equal(await page.locator('#orderTools .goldNeed').count(),2);assert.equal(await page.locator('#orderTools .goldNeed .goldIcon svg, #orderTools .goldNeed .goldIcon img').count()>=2,true,tag('item icons'));
   assert.equal(await page.locator('#orderTools details.goldHow[open]').count(),0,tag('the full chain is folded away'));
   await big('#orderTools .locate','the Show button');{const r=await page.locator('#orderTools details.goldHow summary').boundingBox();assert.ok(r.height>=43.5,tag('How to make these: 44 px'));}await fits('gold panel');await shot('1-gold-panel');
   await page.locator('#orderTools details.goldHow summary').click();assert.equal(await page.locator('#orderTools details.goldHow[open] .routes li').count()>=1,true,tag('the chain unfolds'));
   await fits('gold panel open');await shot('2-gold-panel-open');
   // Show: the producer lights up on the board (the strongest copy) and the message says to tap it
   await page.locator('#orderTools .locate').first().click();
   const lit=await page.locator('#board .tile.located').count();assert.equal(lit,1,tag('one producer highlighted'));
   assert.equal(await page.locator('#board .tile.located').getAttribute('data-index'),String(rover),tag('the Rivet Rover'));
   assert.match(await page.locator('#message').textContent(),/Rivet Rover \(level 2\): tap it for parts/,tag('the message'));
   const ring=await page.locator('#board .tile.located').evaluate(e=>{const c=getComputedStyle(e);return {style:c.outlineStyle,width:parseFloat(c.outlineWidth),anim:c.animationName};});
   assert.ok(ring.style==='solid'&&ring.width>=3,tag(`a visible outline (${JSON.stringify(ring)})`));if(motion==='reduce')assert.equal(ring.anim,'none',tag('reduced motion: no pulse'));
   await shot('3-producer-highlight');
   await page.waitForTimeout(2900);assert.equal(await page.locator('#board .tile.located').count(),0,tag('the highlight clears'));
   // a rare part selected while the gold order asks none: no "Needed for"
   const bolt=(await save()).board.findIndex(x=>x?.type==='item'&&x.family==='mech');await page.locator(`#board [data-index="${bolt}"]`).click();
   assert.doesNotMatch(await page.locator('#selection').innerText(),/Needed for/,tag('the mast asks no rare part'));
   // the second Pocket winch in, then deliver: materials secured, Build · 100 coins, the strip at once
   let s=await save();s.board[s.board.indexOf(null)]=g.item('rig',3);await page.evaluate(([k,v])=>localStorage.setItem(k,v),[KEY,JSON.stringify(s)]);await page.reload();await page.waitForSelector('#board .tile');await beats();
   const coins=(await save()).coins;
   await page.locator(`[data-order="${mastGold.id}"]`).click();
   await page.waitForFunction(()=>document.querySelector('#mapButton')?.dataset.ready==='1',null,{timeout:3000});
   assert.equal(await page.locator('#mapButton .rsText b').textContent(),'Ready to build',tag('the strip turns at once'));assert.equal(await page.locator('#mapButton .rsAction').textContent(),'Build');
   await page.waitForSelector('.moment:has-text("Materials secured")',{timeout:4000});
   const m=await page.locator('.moment').innerText();assert.match(m,/Materials secured · \+\d+ coins/);assert.match(m,/paid \d+ coins and brought the materials for Raise the signal mast/,tag('both rewards (build 51c)'));assert.match(m,/Build · 100 coins/,tag('Build · cost'));
   assert.equal(await page.locator('dialog[open]').count(),0,tag('nothing blocks the board'));
   s=await save();assert.equal(s.materials['beach-mast'],1);assert.equal(s.coins,coins+mastGold.coins,tag('the gold order paid its coins'));
   await fits('materials secured');await shot('4-materials-secured');
   // return to build: the strip opens the coast screen, the stage is built there
   await page.locator('#mapButton').click();await page.waitForSelector('#coastMap[open]');
   if(!(await page.locator('#coastMap [data-restore="beach-mast"]').count()))await page.locator('#coastMap .places [data-select="beach-mast"]').click();
   await big('#coastMap [data-restore="beach-mast"]','the build button');await shot('5-coast-build');
   await page.locator(`#coastMap [data-restore="beach-mast"]`).click({force:motion!=="reduce"});await page.waitForTimeout(1600);await beats();
   s=await save();assert.equal(s.built['beach-mast'],1,tag('built'));assert.equal(s.coins,coins+mastGold.coins-100,tag('paid once'));
   await page.reload();await page.waitForSelector('#board .tile');await beats();s=await save();assert.equal(s.built['beach-mast'],1);assert.equal(s.coins,coins+mastGold.coins-100,tag('a reload pays nothing twice'));

   // 2. Gear the hoist. Build 48c: with no Bolt held, the gold panel states the guarantee in taps (while
   // this order waits, a Bolt within every 10 taps: Build 52A3's rate after the first six stages), not as a time
   await load(hoist,hoistGold,[['chart',3]]);
   await page.locator(`[data-order="${hoistGold.id}"]`).click();await page.waitForSelector('#orderTools .goldNeeds');
   assert.match(await page.locator('#orderTools').innerText(),/Tap a level 2\+ Rivet Rover: while this order waits, a Bolt comes within every 10 taps · merge matching items to reach Gear/,tag('the guarantee, in taps'));
   assert.doesNotMatch(await page.locator('#orderTools').innerText(),/minute|guaranteed time/i);await fits('guarantee');await shot('6a-gold-guarantee');
   // two Bolts and ordinary components, 40 coins of 200
   await load(hoist,hoistGold,[...hoistGold.needs.filter(n=>!g.isSecondary(n.family)).flatMap(n=>Array.from({length:n.count},()=>[n.family,n.tier])),['mech',0],['mech',0]]);
   s=await save();const b=s.board.findIndex(x=>x?.type==='item'&&x.family==='mech');await page.locator(`#board [data-index="${b}"]`).click();
   const sel=await page.locator('#selection').innerText();assert.match(sel,/Needed for .+: merge matching items to reach Gear/,tag('Needed for, with the merge'));
   await fits('needed for');await shot('6-needed-for');
   await page.locator(`[data-order="${hoistGold.id}"]`).click();await page.waitForSelector('#orderTools .goldNeeds');
   const hp=await page.locator('#orderTools').innerText();assert.match(hp,/Gear\s*0\/1/);assert.match(hp,/merge matching items to reach Gear/i);assert.match(hp,/40 of 200: 160 more/,tag('coins short, from crew orders'));
   // merge the Bolts into a Gear by hand, then deliver
   s=await save();const bolts=s.board.map((x,i)=>x?.type==='item'&&x.family==='mech'&&x.tier===0?i:-1).filter(i=>i>=0);
   {const a=await page.locator(`#board [data-index="${bolts[0]}"]`).boundingBox(),c=await page.locator(`#board [data-index="${bolts[1]}"]`).boundingBox();
    await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(c.x+c.width/2,c.y+c.height/2,{steps:6});await page.mouse.up();await page.waitForTimeout(300);}
   s=await save();assert.equal(s.board.filter(x=>x?.type==='item'&&x.family==='mech'&&x.tier===1).length,1,tag('a Gear'));
   await page.locator(`[data-order="${hoistGold.id}"]`).click();
   await page.waitForSelector('.moment:has-text("Materials secured")',{timeout:4000});s=await save();
   assert.match(await page.locator('.moment').innerText(),new RegExp(`${200-s.coins} more coins to build it: deliver crew orders`),tag('how many more coins'));
   assert.match(await page.locator('#mapButton .rsText small').innerText(),new RegExp(`Materials · ${200-s.coins} more`),tag('the strip says it too'));
   assert.equal(s.materials['ws-hoist'],2);await fits('coins short');await shot('7-coins-short');
   assert.deepEqual(errors,[],tag('no page errors'));
   console.log(tag('ok'));await context.close();}}
  finally{await browser.close();}}
 console.log('rare merges browser: ok');
})().catch(e=>{console.error(e);process.exit(1);});
