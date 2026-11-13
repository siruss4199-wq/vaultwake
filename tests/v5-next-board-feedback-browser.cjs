// First Session 2.0, stage B (2026-11-13): board clarity and merge feedback in the real game (v5/play.html),
// Chromium and WebKit at 360×640 and 390×664, finger and pointer input.
//  1. The board keeps 49 cells, 27 crates and 17 tideglass; every crate's look is the game's rule (reachable(),
//     sourceOpen(), a matching key part): "later" (muted, no key) unless it can be opened now or its key can be
//     made ("reachable", key shown), "keyReady" when the key part is on the board; at the start exactly 2 crates are
//     not "later". Each tideglass shows three pips, one hollow per crack.
//  2. Merge feedback tiers: an everyday merge (Lv1→2) is micro (pop, no name tag); Split spanner → Pocket winch
//     (Lv4) is medium (lift and its name); Crawler jack → Bridge rig (Lv6) and a rare Bolt → Gear are major (light
//     rays, name; rare in purple). Two merges in quick succession both land (nothing blocks a tap); a merge redraws
//     only the cells it changed (no flicker); with reduced motion nothing moves and the name still shows.
// Screenshots: test-artifacts/v5/board-feedback/<engine>-<w>x<h>-<step>.png
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const {chromium,webkit}=require('playwright');
const URL='http://127.0.0.1:8080/v5/play.html',KEY='vaultwake-v5-coast';
const OUT=path.join(__dirname,'..','test-artifacts','v5','board-feedback');fs.mkdirSync(OUT,{recursive:true});
const SIZES=(process.env.SIZES||'360x640,390x664').split(',').map(s=>s.split('x').map(Number));
const center=(page,i)=>page.evaluate(i=>{const r=document.querySelector(`#board [data-index="${i}"]`).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};},i);
async function drag(page,a,b){const p=await center(page,a),q=await center(page,b);await page.mouse.move(p.x,p.y);await page.mouse.down();for(let k=1;k<=8;k++){await page.mouse.move(p.x+(q.x-p.x)*k/8,p.y+(q.y-p.y)*k/8);await page.waitForTimeout(12);}await page.mouse.up();}
(async()=>{
 const g=await import(path.join(__dirname,'..','v5','next','game.mjs'));
 // a played camp with four pairs laid on the board (the guide finished, today's gift taken)
 const camp=()=>{const s=g.fresh(Date.now());s.seen={'coach-on':true,'coach-done':true};s.moves=5;s.daily={day:9e6,count:1};
  // eight spaces: the camp's four empty cells and four crates replaced (a test set-up of the board only)
  const spots=[...s.board.keys()].filter(i=>s.board[i]===null);for(const i of [...s.board.keys()].filter(i=>s.board[i]?.type==='cargo').slice(0,8-spots.length))spots.push(i);
  const lay=[['rig',0],['rig',0],['rig',2],['rig',2],['rig',4],['rig',4],['mech',0],['mech',0]];lay.forEach(([f,t],k)=>s.board[spots[k]]={type:'item',family:f,tier:t});
  return {s,pairs:[[spots[0],spots[1]],[spots[2],spots[3]],[spots[4],spots[5]],[spots[6],spots[7]]]};};
 const engines=(process.env.ENGINES||'chromium,webkit').split(',').map(e=>[e,{chromium,webkit}[e]]);
 for(const [engine,type] of engines){
  let browser;try{browser=await type.launch();}catch(e){if(engine!=='chromium'&&/Executable doesn't exist/.test(e.message)){console.log(`${engine}: not installed here, skipped`);continue;}throw e;}
  try{for(const [W,H] of SIZES)for(const motion of ['no-preference','reduce']){
   if(motion==='reduce'&&W!==390)continue;
   const tag=s=>`${engine} ${W}×${H}${motion==='reduce'?' reduced motion':''}: ${s}`;
   const context=await browser.newContext({viewport:{width:W,height:H},isMobile:engine==='chromium',hasTouch:true,reducedMotion:motion});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e?.message??e)));
   const shot=n=>page.screenshot({path:path.join(OUT,`${engine}-${W}x${H}${motion==='reduce'?'-rm':''}-${n}.png`)});
   // 1. a new player's board: the rules decide each crate's look
   await page.goto(URL);await page.waitForSelector('#home',{state:'hidden',timeout:30000});await page.waitForTimeout(600);
   const crates=await page.evaluate(async()=>{const g=await import('/v5/next/game.mjs'),{CHAINS}=await import('/v5/next/chains.mjs');
    // the camp as shown: a new player's camp is not saved yet, so it is read back from the cells' state
    const s=g.fresh(Date.now());const out=[];
    for(const el of document.querySelectorAll('#board .tile.cargo')){const i=+el.dataset.index,x=s.board[i];
     const ready=g.reachable(s,i)&&s.board.some(y=>g.matches(y,x.key)),later=!g.reachable(s,i)||!ready&&!g.sourceOpen(s,CHAINS[x.key.family].gen);
     out.push({i,later:el.classList.contains('later'),want:later,key:el.querySelector('.cargoKey')?getComputedStyle(el.querySelector('.cargoKey')).visibility:'hidden'});}
    const ice=[...document.querySelectorAll('#board .tile.glass')].map(el=>el.querySelectorAll('.icePips i').length);
    return {crates:out,cells:document.querySelectorAll('#board .tile').length,ice};});
   assert.equal(crates.cells,49);assert.equal(crates.crates.length,27,tag('27 crates'));assert.equal(crates.ice.length,17,tag('17 tideglass'));
   for(const c of crates.crates){assert.equal(c.later,c.want,tag(`crate ${c.i}: "later" = the rules`));assert.equal(c.key,c.later?'hidden':'visible',tag(`crate ${c.i}: key only when it can be opened`));}
   assert.equal(crates.crates.filter(c=>!c.later).length,2,tag('2 crates can be worked on at the start'));
   assert.ok(crates.ice.every(n=>n===3),tag('three pips on each tideglass'));await shot('1-board');
   // 2. merge tiers on a played camp
   const {s,pairs}=camp();
   await page.evaluate(([k,v])=>{localStorage.setItem(k,v);localStorage.setItem('vaultwake-v5-coast-story','{"intro":"skip"}');},[KEY,JSON.stringify(s)]);
   await page.reload();await page.waitForSelector('#homePlay:not([hidden])',{timeout:30000});await page.locator('#homePlay').click();await page.waitForSelector('#home',{state:'hidden'});await page.waitForTimeout(500);
   for(let n=0;n<6&&await page.locator('#beat[open]').count();n++){await page.locator('#beatNext').click();await page.waitForTimeout(120);}
   const look=to=>page.evaluate(to=>{const t=document.querySelector(`#board [data-index="${to}"]`),art=t.querySelector('.art,img');
    return {tier:['micro','medium','major'].find(k=>t.classList.contains('merge-'+k))??null,tag:document.querySelector('.mergeTag')?.textContent??null,rare:!!document.querySelector('.mergeTag.rare'),
     rays:!!document.querySelector('.mergeRays'),anim:art?getComputedStyle(art).animationName:'none'};},to);
   // micro: Copper offcut → Grip tool; and at once (60 ms later) medium: Split spanner → Pocket winch
   const cellsBefore=await page.evaluate(k=>{for(const i of document.querySelectorAll('#board img'))i.__old=1;return JSON.parse(localStorage.getItem(k)).board.map(x=>JSON.stringify(x));},KEY);
   await drag(page,...pairs[0]);await page.waitForTimeout(60);const micro=await look(pairs[0][1]);
   // new pictures only in the cells whose state the merge changed (its two cells, tideglass it cracked)
   const stray=await page.evaluate(([k,before])=>{const after=JSON.parse(localStorage.getItem(k)).board.map(x=>JSON.stringify(x));
    return [...document.querySelectorAll('#board img')].filter(i=>!i.__old).map(i=>+i.closest('.tile').dataset.index).filter(n=>after[n]===before[n]);},[KEY,cellsBefore]);
   await drag(page,...pairs[1]);await page.waitForTimeout(120);const medium=await look(pairs[1][1]);await shot('2-medium');
   let saved=JSON.parse(await page.evaluate(k=>localStorage.getItem(k),KEY));
   assert.deepEqual([saved.board[pairs[0][1]],saved.board[pairs[1][1]]],[{type:'item',family:'rig',tier:1},{type:'item',family:'rig',tier:3}],tag('two quick merges both land (nothing blocks a tap)'));
   assert.deepEqual(stray,[],tag('a merge redraws only the cells it changed (no flicker elsewhere)'));
   assert.equal(micro.tier,'micro',tag('Lv1 → Lv2 is micro'));
   assert.equal(medium.tier,'medium',tag('Lv3 → Lv4 is medium'));assert.match(medium.tag??'',/Pocket winch · Lv4/,tag('its name shows'));
   await page.waitForTimeout(1600);
   await drag(page,...pairs[2]);await page.waitForTimeout(150);const major=await look(pairs[2][1]);await shot('3-major');
   assert.equal(major.tier,'major',tag('Lv5 → Lv6 is major'));assert.match(major.tag??'',/· Lv6/,tag('its name shows'));assert.equal(major.rays,motion!=='reduce',tag('light rays (none with reduced motion)'));
   await page.waitForTimeout(1600);
   await drag(page,...pairs[3]);await page.waitForTimeout(150);const rare=await look(pairs[3][1]);await shot('4-rare');
   assert.equal(rare.tier,'major',tag('a rare merge is major'));assert.ok(rare.rare,tag('rare in purple'));assert.match(rare.tag,/^Rare · Gear · Lv2$/);
   if(motion==='reduce')for(const x of [micro,medium,major,rare])assert.equal(x.anim,'none',tag('reduced motion: nothing moves'));
   saved=JSON.parse(await page.evaluate(k=>localStorage.getItem(k),KEY));
   assert.deepEqual(saved.board[pairs[3][1]],{type:'item',family:'mech',tier:1},tag('the rare merge is the game\'s'));
   assert.deepEqual(errors,[],tag('no page error'));console.log(`ok ${tag('crate looks = rules, tideglass pips, micro/medium/major/rare feedback, quick merges, no redraw')}`);
   await context.close();}}
  finally{await browser.close();}
 }
 console.log('board feedback browser tests passed');
})().catch(e=>{console.error(e);process.exit(1);});
