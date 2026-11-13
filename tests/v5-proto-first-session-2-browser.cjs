// First Session 2.0 DESIGN PROTOTYPE (prototype/first-session-2/index.html), refinement 2026-11-13. Not the live game:
// the page plays the game's real rules (v5/next/game.mjs fresh() + act(), v5/next/coach.mjs), imported unchanged.
// With finger taps, at 360×640, 390×664 and 390×844, in Chromium and WebKit (iPhone Safari's engine):
//  1. layout: no sideways scroll; the whole 7×7 board, the HUD, the order card, the coast strip and the guide bar are on
//     screen at once (story caption folded); HUD numbers ≥ 17 px, card counts ≥ 15 px, hint ≥ 14 px; every visible
//     button is at least 44×44 and the finger at its centre lands on it; every button has a name;
//  2. crates: the look of every crate is the real rule: "ready"/"reachable" only when game.mjs reachable() and
//     sourceOpen() say it can be opened now ("ready" when its key part is on the board), "later" otherwise, and a
//     "later" crate shows no key; at the start exactly the 2 crates the rules let you open look actionable;
//  3. a finger on the Rivet Rover makes a part through act() (energy 100 → 99, one part on the board);
//  4. the real guide plays the rest (the prototype's autoplay, the coach's next action each time) to the first
//     restoration: 2 orders delivered, the landing path built (stage 1), 40 coins left; the coast × is ≥ 44×44;
//  5. ?restore=2: the boardwalk is built with the real place-path-1 → place-path-2 art; Before/After are 44 px
//     toggles that swap the two pictures;
//  6. no page error. Screenshots: test-artifacts/v5/proto-first-session-2/<engine>-<w>x<h>-<step>.png
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const {chromium,webkit}=require('playwright');
const BASE=process.env.PROTO_URL||'http://127.0.0.1:8080/prototype/first-session-2/index.html';
const OUT=path.join(__dirname,'..','test-artifacts','v5','proto-first-session-2');fs.mkdirSync(OUT,{recursive:true});
const SIZES=(process.env.SIZES||'360x640,390x664,390x844').split(',').map(s=>s.split('x').map(Number));
const layout=page=>page.evaluate(()=>{const vis=e=>{const r=e.getBoundingClientRect(),c=getComputedStyle(e);return r.width>0&&r.height>0&&c.visibility!=='hidden'&&r.bottom>0&&r.top<innerHeight;};
 const box=sel=>{const r=document.querySelector(sel).getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right};};
 const buttons=[...document.querySelectorAll('button')].filter(vis).filter(b=>document.querySelector('#coast.open')?!!b.closest('#coast'):!b.closest('#coast')).map(b=>{const r=b.getBoundingClientRect(),h=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
  return {id:b.id||b.className,w:Math.round(r.width),h:Math.round(r.height),hit:!!h&&(h===b||b.contains(h)),name:(b.getAttribute('aria-label')||b.textContent).trim()};});
 const px=sel=>parseFloat(getComputedStyle(document.querySelector(sel)).fontSize);
 return {sideways:document.scrollingElement.scrollWidth>innerWidth,W:innerWidth,H:innerHeight,board:box('.boardWrap'),hud:box('.hud'),card:box('#objective'),strip:box('#strip'),hint:box('#guide'),
  buttons,font:{hud:px('#energy'),cnt:document.querySelector('.card .cnt')?px('.card .cnt'):99,hint:px('#gWhat')}};});
const crateCheck=page=>page.evaluate(async()=>{const g=await import(new URL('next/game.mjs',document.baseURI).href),{CHAINS}=await import(new URL('next/chains.mjs',document.baseURI).href),s=__proto.s,out=[];
 for(const [i,x] of s.board.entries()){if(x?.type!=='cargo')continue;const cell=document.querySelector(`#board [data-i="${i}"] .piece.crate`),shown=['ready','reachable','later'].find(k=>cell.classList.contains(k));
  const can=g.reachable(s,i)&&g.sourceOpen(s,CHAINS[x.key.family].gen);
  const want=!can?'later':s.board.some(y=>g.matches(y,x.key))?'ready':'reachable',key=cell.querySelector('.cargoKey'),keyShown=!!key&&getComputedStyle(key).display!=='none';
  out.push({i,shown,want,keyShown,page:__proto.crateState(i)});}return out;});
(async()=>{
 const engines=(process.env.ENGINES||'chromium,webkit').split(',').map(e=>[e,{chromium,webkit}[e]]);
 for(const [engine,type] of engines){
  let browser;try{browser=await type.launch();}catch(e){if(engine!=='chromium'&&/Executable doesn't exist/.test(e.message)){console.log(`${engine}: not installed here, skipped`);continue;}throw e;}
  try{for(const [W,H] of SIZES){
   const tag=s=>`${engine} ${W}×${H}: ${s}`;
   const context=await browser.newContext({viewport:{width:W,height:H},isMobile:engine==='chromium',hasTouch:true});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e?.message??e)));
   const shot=n=>page.screenshot({path:path.join(OUT,`${engine}-${W}x${H}-${n}.png`)});
   await page.route(u=>!u.href.startsWith(new URL(BASE).origin),r=>r.abort());
   await page.goto(BASE);await page.waitForSelector('#board .cell');await page.waitForTimeout(900);await shot('1-start');
   // 2. crates at the start
   let crates=await crateCheck(page);
   for(const c of crates){assert.equal(c.shown,c.want,tag(`crate ${c.i} looks "${c.shown}", the rules say "${c.want}"`));assert.equal(c.keyShown,c.want!=='later',tag(`crate ${c.i}: key shown only when it can open now`));}
   assert.equal(crates.filter(c=>c.want!=='later').length,2,tag('at the start exactly 2 crates can be opened'));
   assert.equal(crates.length,27,tag('the real camp has 27 crates'));
   assert.equal(await page.evaluate(()=>__proto.s.board.filter(x=>x?.type==='glass').length),17,tag('and 17 tideglass'));
   // 3. a finger on the generator (real act); the caption folds
   const gen=await page.evaluate(()=>{const r=document.querySelector('#board .genCell').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};});
   await page.touchscreen.tap(gen.x,gen.y);await page.waitForTimeout(700);
   const s1=await page.evaluate(()=>({energy:__proto.s.energy,items:__proto.s.board.filter(x=>x?.type==='item').length,taps:__proto.s.taps.rig}));
   assert.equal(s1.energy,99,tag('a tap costs 1 energy (act)'));assert.equal(s1.taps,1,tag('one real tap'));
   // 1. layout, with the caption folded
   const L=await layout(page);
   assert.ok(!L.sideways,tag('no sideways scroll'));
   for(const k of ['hud','card','strip','hint','board'])assert.ok(L[k].top>=0&&L[k].bottom<=L.H+0.5&&L[k].left>=0&&L[k].right<=L.W+0.5,tag(`${k} fully on screen (${JSON.stringify(L[k])})`));
   assert.ok(L.font.hud>=17&&L.font.cnt>=15&&L.font.hint>=14,tag(`readable text ${JSON.stringify(L.font)}`));
   for(const b of L.buttons){assert.ok(b.w>=44&&b.h>=44,tag(`button ${b.id} is ${b.w}×${b.h}`));assert.ok(b.hit,tag(`the finger at ${b.id}'s centre lands on it`));assert.ok(b.name.length>0,tag(`button ${b.id} has a name`));}
   await shot('2-after-tap');
   // 4. the real guide plays to the first restoration
   await page.evaluate(()=>window.__autoplay(40));
   const fin=await page.evaluate(()=>{const s=__proto.s;return {built:s.built['beach-path']??0,done:s.ordersDone,coins:s.coins,energy:s.energy,taps:s.taps.rig,merges:s.merges,stage:__proto.stage};});
   console.log(tag('real flow '+JSON.stringify(fin)));
   assert.equal(fin.built,1,tag('the landing path is built'));assert.ok(fin.done>=2,tag('two orders delivered'));assert.equal(fin.coins,40,tag('80 − 40 coins'));
   crates=await crateCheck(page);for(const c of crates)assert.equal(c.shown,c.want,tag(`after the build, crate ${c.i} looks "${c.shown}", rules "${c.want}"`));
   await page.waitForFunction(()=>__proto.stage==='play'&&document.querySelector('#card.gold:not(.enter)'),null,{timeout:8000});await page.waitForTimeout(500);
   assert.equal(await page.evaluate(()=>[...document.querySelectorAll('#board img')].filter(i=>!i.complete||!i.naturalWidth).length),0,tag('every board picture is drawn'));await shot('3-next-objective');
   const L2=await layout(page);for(const b of L2.buttons)assert.ok(b.w>=44&&b.h>=44&&b.hit,tag(`after the build, button ${b.id} ${b.w}×${b.h}`));
   // the coast × with the panel open
   await page.evaluate(()=>__proto.openCoast());await page.waitForTimeout(700);
   const x=await page.evaluate(()=>{const b=document.querySelector('#coastClose'),r=b.getBoundingClientRect(),h=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return {w:r.width,h:r.height,top:r.top,right:r.right,hit:h===b||b.contains(h),cx:r.left+r.width/2,cy:r.top+r.height/2};});
   assert.ok(x.w>=44&&x.h>=44&&x.hit&&x.top>=0&&x.right<=W,tag(`coast × ${x.w}×${x.h} on screen`));await shot('4-coast');
   await page.touchscreen.tap(x.cx,x.cy);await page.waitForTimeout(700);assert.equal(await page.evaluate(()=>document.querySelector('#coast').classList.contains('open')),false,tag('× closes the coast'));
   // 5. stage 2 with the real art, Before/After toggles
   await page.goto(BASE+'?restore=2');await page.waitForSelector('#coast.open');await page.waitForTimeout(900);await shot('5-stage2-before');
   const bb=await page.evaluate(()=>{const r=document.querySelector('#buildBtn').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,h:r.height};});assert.ok(bb.h>=44,tag('Build ≥ 44 px'));
   await page.touchscreen.tap(bb.x,bb.y);await page.waitForSelector('#nextBtn.show',{timeout:8000});await page.waitForTimeout(300);
   assert.equal(await page.evaluate(()=>__proto.s.built['beach-path']),2,tag('the boardwalk is built (act restore)'));
   assert.match(await page.evaluate(()=>document.querySelector('#afterImg').src),/place-path-2\.webp$/,tag('after = the real boardwalk art'));
   assert.match(await page.evaluate(()=>document.querySelector('#beforeImg').src),/place-path-1\.webp$/,tag('before = the real stage-1 art'));
   const cover=await page.evaluate(()=>{const m=document.querySelector('#map').getBoundingClientRect(),i=document.querySelector('#mapInner').getBoundingClientRect(),s=document.querySelector('#site').getBoundingClientRect();
    return {fill:i.left<=m.left+1&&i.top<=m.top+1&&i.right>=m.right-1&&i.bottom>=m.bottom-1,site:s.top>=m.top-1&&s.bottom<=m.bottom+2&&s.left>=m.left-1&&s.right<=m.right+1};});
   assert.ok(cover.fill,tag('the coast art fills the map (no empty band)'));assert.ok(cover.site,tag('the restored place is fully in view'));
   await shot('6-stage2-after');
   for(const [id,before] of [['#segBefore',true],['#segAfter',false]]){const r=await page.evaluate(id=>{const b=document.querySelector(id),r=b.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height};},id);
    assert.ok(r.w>=44&&r.h>=44,tag(`${id} ${r.w}×${r.h}`));await page.touchscreen.tap(r.x,r.y);await page.waitForTimeout(700);
    const st=await page.evaluate(()=>({before:getComputedStyle(document.querySelector('#beforeImg')).opacity,after:getComputedStyle(document.querySelector('#afterImg')).opacity}));
    assert.equal(before?st.before:st.after,'1',tag(`${id} shows its picture`));if(before)await shot('7-stage2-compare-before');}
   const L3=await layout(page);for(const b of L3.buttons)assert.ok(b.w>=44&&b.h>=44&&b.hit,tag(`coast button ${b.id} ${b.w}×${b.h}`));
   assert.deepEqual(errors,[],tag('no page error'));console.log(`ok ${tag('layout, 44 px targets, crate states = rules, real tap → first restoration, stage-2 before/after')}`);
   await context.close();}}
  finally{await browser.close();}
 }
 console.log('first session 2.0 prototype browser tests passed');
})().catch(e=>{console.error(e);process.exit(1);});
