// Adaptive guided tutorial 2.0 (DESIGN PROTOTYPE, prototype/first-session-2/), in Chromium and WebKit at 360×640,
// 390×664 and 390×844, with real finger input (taps on the touchscreen, drags with the pointer):
//  1. a fresh camp: one instruction (what + why), the generator in gold, a small finger on it, a 44 px Hint button;
//  2. a player who does what the guide shows reaches the real first restoration (act() results: path built, 40
//     coins). At every step what is highlighted is exactly the step's target (gold = the next action, green = the
//     two matching items), every highlighted action is accepted by act() on a copy of the camp, nothing highlighted
//     is a buried crate, and nothing is highlighted on a quiet step;
//  3. guidance fades: the finger shows only on new skills; by the third tap the steps are quiet;
//  4. idle: with no input for ~8 s on a quiet step the guide reminds once (finger + nudge); 9 s more: no second
//     reminder; the camp is unchanged (the guide never acts);
//  5. Hint: the button raises the step to full (finger) once, counted;
//  6. after Next the next objective is named; a reload resumes the camp and the guide's step;
//  7. blockers: ?case=full (board full), ?case=energy (no energy; a tap on the Rover is refused by act() and the
//     refusal is shown), ?case=locked (orders need a generator that is not there): explained, nothing highlighted,
//     no finger;
//  8. reduced motion: the finger stays still; no sideways scroll; no page error. Screenshots: test-artifacts/v5/proto-tutor/<engine>-<w>x<h>-<step>.png
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const {chromium,webkit}=require('playwright');
const BASE=process.env.PROTO_URL||'http://127.0.0.1:8080/prototype/first-session-2/index.html';
const OUT=path.join(__dirname,'..','test-artifacts','v5','proto-tutor');fs.mkdirSync(OUT,{recursive:true});
const SIZES=(process.env.SIZES||'360x640,390x664,390x844').split(',').map(s=>s.split('x').map(Number));
// what the page highlights, and whether each highlighted action is valid on a copy of the real camp
const marks=page=>page.evaluate(async()=>{const g=await import(new URL('next/game.mjs',document.baseURI).href),s=__proto.s,st=__proto.guide;
 const cells=k=>[...document.querySelectorAll('#board .cell.'+k)].map(e=>+e.dataset.i).sort((a,b)=>a-b);
 const other=[...document.querySelectorAll('.gNext:not(.cell)')].map(e=>e.id);
 const f=document.querySelector('#finger'),fr=f.getBoundingClientRect();
 const buried=[...cells('gNext'),...cells('gMatch')].filter(i=>s.board[i]?.type==='cargo'&&!g.reachable(s,i));
 const ok=st?.action?g.act(structuredClone(s),st.action,Date.now()).ok:null;
 return {st,gold:cells('gNext'),green:cells('gMatch'),other,finger:f.classList.contains('show'),tip:{x:fr.x+8,y:fr.y+3},buried,ok,what:document.querySelector('#gWhat').textContent,why:document.querySelector('#gWhy').textContent,
  moves:s.moves,G:{hints:__proto.G.hints,reminders:__proto.G.reminders}};});
const expectMarks=(m,tag)=>{const t=m.st.level==='quiet'?null:m.st.target;
 assert.deepEqual(m.gold,t?.kind==='cell'?[t.index]:[],tag+': gold cells = the target');
 assert.deepEqual(m.green,t?.kind==='pair'?[...t.cells].sort((a,b)=>a-b):[],tag+': green cells = the two matching items');
 const want=t?.kind==='order'?['card']:t?.kind==='strip'?['strip']:t?.kind==='button'?[t.id]:[];assert.deepEqual(m.other,want,tag+': gold control = the target');
 assert.deepEqual(m.buried,[],tag+': no buried crate highlighted');if(m.st.action)assert.equal(m.ok,true,tag+': act() accepts the highlighted action');
 assert.equal(m.what,m.st.what,tag+': the instruction is shown');};
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
   const center=sel=>page.evaluate(sel=>{const r=document.querySelector(sel).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,w:r.width,h:r.height};},sel);
   const cell=i=>center(`#board [data-i="${i}"]`);
   // 1. start
   await page.goto(BASE+'?fresh=1');await page.waitForSelector('#board .cell');await page.waitForTimeout(700);
   let m=await marks(page);expectMarks(m,tag('start'));
   assert.equal(m.st.kind,'tap');assert.equal(m.st.level,'full');assert.equal(m.what,'Tap the Rivet Rover');assert.ok(m.why.length>0,tag('a reason is shown'));
   assert.ok(m.finger,tag('the finger shows on the generator'));const g0=await cell(m.st.target.index);
   assert.ok(Math.abs(m.tip.x-g0.x)<g0.w*.5&&Math.abs(m.tip.y-g0.y)<g0.h*.5,tag('the fingertip is on the generator, off its centre'));
   const hb=await center('#hintBtn');assert.ok(hb.w>=44&&hb.h>=44,tag(`Hint ${hb.w}×${hb.h}`));
   assert.equal(await page.evaluate(()=>document.scrollingElement.scrollWidth>innerWidth),false,tag('no sideways scroll'));
   await shot('1-start');
   // 2–5. play what the guide shows, to the first restoration
   let idled=false,hinted=false,quietTaps=0,fingerOnQuiet=0;
   const settle=()=>page.waitForFunction(()=>!__proto.busy&&!document.querySelector('.fly'),null,{timeout:8000}).then(()=>page.waitForTimeout(150));
   for(let n=0;n<140;n++){
    await settle();m=await marks(page);const st=m.st;expectMarks(m,tag(`step ${n} ${st.kind}/${st.level}`));
    if(st.level==='quiet'&&m.finger)fingerOnQuiet++;
    if(st.kind==='tap'&&st.level==='quiet')quietTaps++;
    if(!idled&&st.level==='quiet'&&st.kind==='tap'){idled=true;const before=m.moves;
     await page.waitForTimeout(8700);let r=await marks(page);assert.equal(r.G.reminders,1,tag('one reminder after ~8 s idle'));assert.ok(r.finger,tag('the reminder shows the finger'));assert.equal(r.st.level,'full');await shot('2-idle-reminder');
     await page.waitForTimeout(9000);r=await marks(page);assert.equal(r.G.reminders,1,tag('no second reminder for the same step'));assert.equal(r.moves,before,tag('the guide never acts'));continue;}
    if(idled&&!hinted&&st.level==='quiet'&&st.kind==='merge'){hinted=true;await page.touchscreen.tap(hb.x,hb.y);await page.waitForTimeout(400);
     const r=await marks(page);assert.equal(r.G.hints,1,tag('Hint counted'));assert.equal(r.st.level,'full',tag('Hint raises the step to full'));assert.ok(r.finger,tag('Hint shows the finger'));expectMarks(r,tag('after Hint'));await shot('3-hint');continue;}
    const t=st.target;assert.ok(t,tag(`step ${n} has a target (${st.kind}: ${st.what})`));
    if(t.kind==='cell'){const c=await cell(t.index);await page.touchscreen.tap(c.x,c.y);await page.waitForTimeout(450);}
    else if(t.kind==='pair'){const a=await cell(t.cells[0]),c=await cell(t.cells[1]);await page.mouse.move(a.x,a.y);await page.mouse.down();for(let k=1;k<=8;k++){await page.mouse.move(a.x+(c.x-a.x)*k/8,a.y+(c.y-a.y)*k/8);await page.waitForTimeout(15);}await page.mouse.up();await page.waitForTimeout(500);}
    else if(t.kind==='order'){if(st.kind==='gold')await shot('4-gold-ready');const c=await center('#card .pay');await page.touchscreen.tap(c.x,c.y);await page.waitForTimeout(2500);}
    else if(t.kind==='strip'){await shot('5-build-strip');const c=await center('#stripGo');await page.touchscreen.tap(c.x,c.y);await page.waitForTimeout(1300);}
    else if(t.kind==='button'){if(t.id==='buildBtn')await shot('6-coast-build');const c=await center('#'+t.id);assert.ok(c.h>=44,tag(`${t.id} ≥ 44 px`));await page.touchscreen.tap(c.x,c.y);
     await page.waitForTimeout(t.id==='buildBtn'?4300:1800);if(t.id==='nextBtn')break;}
   }
   assert.ok(idled&&hinted,tag('the idle reminder and the Hint were both exercised'));assert.ok(quietTaps>0,tag('guidance faded to quiet'));
   assert.equal(fingerOnQuiet,0,tag('no finger on a quiet step'));
   const fin=await page.evaluate(()=>({built:__proto.s.built['beach-path'],coins:__proto.s.coins}));assert.deepEqual(fin,{built:1,coins:40},tag('the real first restoration'));
   // 6. next objective; resume
   await page.waitForTimeout(600);m=await marks(page);expectMarks(m,tag('next objective'));assert.equal(m.st.level,'light',tag('the next objective is named'));assert.match(m.why,/gold order's Pocket winch/);await shot('7-next-objective');
   await page.goto(BASE);await page.waitForSelector('#board .cell');await page.waitForTimeout(700);
   const r=await marks(page);assert.equal(await page.evaluate(()=>__proto.s.built['beach-path']),1,tag('a reload keeps the camp'));assert.equal(r.st.sig,m.st.sig,tag('and the same step'));
   // 7. blockers
   for(const [c,kind,re] of [['full','space',/full/],['energy','energy',/every 2 minutes/],['locked','locked',/Survey Kite|not on your board/]]){
    await page.goto(BASE+'?case='+c);await page.waitForSelector('#board .cell');await page.waitForTimeout(600);
    const b=await marks(page);assert.equal(b.st.kind,kind,tag(`case ${c}`));assert.equal(b.st.target,null);assert.match(b.what+' '+b.why,re,tag(`case ${c} explains`));
    assert.deepEqual([b.gold,b.green,b.other,b.finger],[[],[],[],false],tag(`case ${c}: nothing highlighted, no finger`));await shot('8-case-'+c);
    if(c==='energy'){const g=await page.evaluate(()=>{const r=document.querySelector('#board .genCell').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};});
     await page.touchscreen.tap(g.x,g.y);await page.waitForTimeout(300);const e=await page.evaluate(()=>({energy:__proto.s.energy,kind:document.querySelector('#guide').dataset.kind,what:document.querySelector('#gWhat').textContent}));
     assert.equal(e.energy,0,tag('the refused tap changed nothing'));assert.equal(e.kind,'refused',tag('the refusal is shown: '+e.what));}
   }
   // reduced motion: the same guidance, the finger still (no animation)
   await page.emulateMedia({reducedMotion:'reduce'});await page.goto(BASE+'?fresh=1');await page.waitForSelector('#board .cell');await page.waitForTimeout(500);
   const rm=await page.evaluate(()=>{const f=document.querySelector('#finger');return {show:f.classList.contains('show'),anims:f.getAnimations().filter(a=>a.playState==='running'&&a.effect?.getTiming().duration>1).length,kind:__proto.guide.kind};});
   assert.deepEqual(rm,{show:true,anims:0,kind:'tap'},tag('reduced motion: a still finger, no movement'));await page.emulateMedia({reducedMotion:'no-preference'});
   assert.deepEqual(errors,[],tag('no page error'));console.log(`ok ${tag('guided to the first restoration; highlights = valid targets; fades; idle once; Hint; resume; blockers')}`);
   await context.close();}}
  finally{await browser.close();}
 }
 console.log('tutorial 2.0 prototype browser tests passed');
})().catch(e=>{console.error(e);process.exit(1);});
