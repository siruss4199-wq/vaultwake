// Coast Camp Chapter 1's first rare gold goal, played through the real UI on a phone (build 51b;
// docs/V5_CH1_RARE_GOALS_2026-11-02.md), at 390 x 844 and 360 x 780 (touch, reduced motion):
// a beach camp with the pier's first stage paid for in materials and two level-1 Rivet Rovers not yet merged.
// 1. Drag one Rover onto the other: a level-2 Rover; the Gear chain opens (its first Bolt is a gift).
// 2. Build the pier's first stage on the coast screen: the next gold order is "Add a cargo crane" and asks a
//    Gear (its second material), with the guarantee in taps.
// 3. Tap the Rover until two Bolts have dropped (bounded by the guarantee), drag one onto the other: a Gear.
// 4. With the crane's other part on the board, deliver the gold order: materials secured; build the stage
//    on the coast screen: the pier at stage 2, charged once; a reload changes nothing.
// Nothing scrolls sideways; no page errors.   SHOTS=<dir> saves screenshots.
const assert=require('node:assert/strict');const path=require('node:path');const {chromium,webkit}=require('playwright');const {throughHome}=require('./v5-next-home-helper.cjs');
const URL='http://127.0.0.1:8080/v5/play.html',KEY='vaultwake-v5-coast',SHOTS=process.env.SHOTS;
(async()=>{
 const g=await import('../v5/next/game.mjs');
 const engines=(process.env.ENGINES||'chromium,webkit').split(',').map(e=>[e,{chromium,webkit}[e]]);
 for(const [engine,type] of engines){
  let browser;try{browser=await type.launch();}catch(e){if(engine!=='chromium'&&/Executable doesn't exist/.test(e.message)){console.log(`${engine}: not installed here, skipped`);continue;}throw e;}
  try{for(const [W,H] of [[390,844],[360,780]]){
   const context=await browser.newContext({viewport:{width:W,height:H},isMobile:engine==='chromium',hasTouch:true,reducedMotion:'reduce'});
   const page=await context.newPage(),errors=[];throughHome(page);
   page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
   const tag=s=>`${engine} ${W}×${H}: ${s}`,save=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
   const shot=async name=>{if(SHOTS)await page.screenshot({path:path.join(SHOTS,`ch1rare-${W}x${H}-${name}.png`)});};
   const write=(src,arg)=>page.evaluate(([k,src,arg])=>{const s=JSON.parse(localStorage.getItem(k));new Function('s','arg',src)(s,arg);localStorage.setItem(k,JSON.stringify(s));},[KEY,src,arg]);
   const reload=async()=>{await page.reload();await page.waitForSelector('#board .tile');};
   const beats=async()=>{for(let n=0;n<10&&await page.locator('#beat[open]').count();n++){await page.locator('#beatNext').click();await page.waitForTimeout(90);}};
   const fits=async what=>{const o=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,vw:innerWidth}));assert.ok(o.doc<=o.vw+1,tag(`${what}: no sideways scroll (${o.doc} > ${o.vw})`));};
   const drag=async(i,j)=>{const a=await page.locator(`#board [data-index="${i}"]`).boundingBox(),c=await page.locator(`#board [data-index="${j}"]`).boundingBox();
    await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(c.x+c.width/2,c.y+c.height/2,{steps:6});await page.mouse.up();await page.waitForTimeout(300);};
   const build=async id=>{await page.locator('#mapButton').click();await page.waitForSelector('#coastMap[open]');await page.locator(`#coastMap .places [data-select="${id}"]`).click();
    await page.locator(`#coastMap [data-restore="${id}"]`).click({force:true});await page.waitForTimeout(1300);await beats();await page.locator('#coastMap .close').click().catch(()=>{});};
   await page.goto(URL+'?new=1');await page.waitForSelector('#board .tile');await beats();
   // a beach camp: path and tent done, mast and workshop at 1, the pier's first stage paid for in materials;
   // its loose parts and crates cleared; a second level-1 Rover beside the first; no gold order up yet
   await write(`const built={'beach-path':3,'beach-tent':3,'beach-mast':1,'beach-workshop':1};Object.assign(s,{built,materials:{...built,'beach-pier':1},coins:2000,energy:100,aim:'beach-pier',daily:{day:9e6,count:1},
    seen:{...s.seen},orderSeq:Math.max(s.orderSeq,40),level:{version:1,level:6,xp:0}});
    s.board=s.board.map(x=>x?.type==='source'||x?.type==='glass'?x:null);const r=s.board.findIndex(x=>x?.type==='source'&&x.id==='rig');
    delete s.board[r].level;const k=[r+1,r-1,r+6,r-6].find(i=>i>=0&&i<36&&s.board[i]===null);s.board[k]={type:'source',id:'rig'};
    s.orders=s.orders.map((o,i)=>o?.story?{...s.orders.find(x=>x&&!x.story),id:'x'+i}:o);delete s.secOpen.rig;`);
   await reload();await beats();
   let s=await save();assert.ok(!s.orders.some(o=>o?.story),tag('no gold order yet'));assert.equal(g.secondaryCanDrop(s,'mech'),false);
   // 1. merge the two Rovers by hand
   const rovers=s.board.map((x,i)=>x?.type==='source'&&x.id==='rig'?i:-1).filter(i=>i>=0);assert.equal(rovers.length,2);
   await drag(rovers[1],rovers[0]);await beats();
   s=await save();const rv=s.board.findIndex(x=>x?.type==='source'&&x.id==='rig');assert.equal(s.board[rv].level,2,tag('a level-2 Rover'));assert.equal(s.secOpen.rig,true,tag('the Gear chain open'));
   await fits('rover merged');await shot('1-rover');
   // 2. build the pier's first stage: the crane's gold order asks a Gear
   await build('beach-pier');s=await save();assert.equal(s.built['beach-pier'],1);
   const gold=s.orders.find(o=>o?.story);assert.equal(gold?.story,'beach-pier',tag('the crane\'s gold order'));
   assert.deepEqual(gold.needs[1],{family:'mech',tier:1,count:1},tag('a Gear, its second material'));assert.equal(gold.needs.length,2);
   await page.locator(`[data-order="${gold.id}"]`).click();await page.waitForSelector('#orderTools .goldNeeds');
   const panel=await page.locator('#orderTools').innerText();assert.match(panel,/Add a cargo crane/);assert.match(panel,/Gear\s*0\/1/);
   assert.match(panel,/Tap a level 2\+ Rivet Rover: while this order waits, a Bolt comes within every 8 taps/,tag('the guarantee, in taps'));
   await fits('gold order');await shot('2-gold-gear');
   // 3. tap the Rover until two Bolts are on the board (the gift Bolt counts), merge them into a Gear
   let taps=0;const bolts=()=>s.board.map((x,i)=>x?.type==='item'&&x.family==='mech'&&x.tier===0?i:-1).filter(i=>i>=0);
   for(;bolts().length<2&&taps<24;taps++){
    await write(`s.energy=Math.max(s.energy,40);s.board=s.board.map(x=>x?.type==='item'&&x.family==='rig'&&x.tier<2?null:x);`);if(taps%6===0)await reload();
    await page.locator(`#board [data-index="${rv}"]`).click();await page.waitForTimeout(140);s=await save();}
   assert.ok(bolts().length>=2,tag(`two Bolts within ${taps} taps`));assert.ok(taps<=17,tag(`the guarantee: ${taps} taps`));
   await drag(bolts()[1],bolts()[0]);s=await save();
   assert.equal(s.board.filter(x=>x?.type==='item'&&x.family==='mech'&&x.tier===1).length,1,tag('a Gear merged by hand'));await shot('3-gear');
   // 4. the crane's other part, then deliver and build
   await write(`const o=s.orders.find(x=>x?.story);const i=s.board.findIndex(x=>x===null);s.board[i]={type:'item',family:o.needs[0].family,tier:o.needs[0].tier};`);await reload();await beats();
   s=await save();const coins=s.coins;
   await page.locator(`[data-order="${gold.id}"]`).click();await page.waitForSelector('.moment:has-text("Materials secured")',{timeout:4000});
   s=await save();assert.equal(s.materials['beach-pier'],2,tag('materials secured'));assert.equal(s.rareLast,true);assert.ok(!s.board.some(x=>x?.type==='item'&&x.family==='mech'&&x.tier===1),tag('the Gear delivered'));
   await fits('delivered');await shot('4-delivered');
   const before=(await save()).coins;await build('beach-pier');s=await save();
   assert.equal(s.built['beach-pier'],2,tag('the crane built'));assert.equal(before-s.coins,150,tag('charged its cost once'));
   await reload();s=await save();assert.equal(s.built['beach-pier'],2);assert.equal(s.materials['beach-pier'],2);
   assert.ok(!s.orders.some(o=>o?.story==='beach-pier'&&o.needs.some(n=>n.family==='mech')&&s.built['beach-pier']>=2),tag('the goal is not asked again'));
   await fits('built');await shot('5-built');
   assert.deepEqual(errors,[],tag('no page errors'));console.log(tag(`Rover merged → crane asks a Gear → ${taps} taps to two Bolts → Gear merged → delivered → crane built, reload clean: ok`));
   await context.close();
  }}finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exit(1);});
