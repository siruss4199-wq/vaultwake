// Coast Camp's first-player guide in a real browser (build 51c; docs/V5_FIRST_PLAYER_GUIDE_2026-11-02.md): a
// short, one-time introduction to the basic controls, not an order-solving assistant.
// 1. A genuinely new camp at 390 x 844 (touch): Home → Play → the story's three scenes (its last line names
//    the goal: "The letter brought us to that Vault. First, let's clear a landing.") → the board with no
//    second introduction. Each control is highlighted once (tap, merge, the crew delivery, the gold
//    delivery, Build on the coast screen); between those the line is a short goal with no highlight and the
//    player acts on their own (here: the board advice the goal sums up), through the real UI. Nothing is
//    laid on the board and no coins are given. The first restoration ends the guide; a reload and a later
//    order do not restart it. Actions and time are printed.
// 2. 360 x 780 and 907 x 510: the guide's line and target fit (no sideways scroll), with reduced motion; a
//    tap is not taught twice.
// 3. Reload and skip: a reload resumes the same step; Skip guide ends it for good; Help replays it.
// 4. An existing camp (played before the guide) gets no guide.
//   SHOTS=<dir> saves the opening loop's screenshots in order.
const assert=require('node:assert/strict');const path=require('node:path');const {chromium,webkit}=require('playwright');
const URL='http://127.0.0.1:8080/v5/play.html',KEY='vaultwake-v5-coast',SHOTS=process.env.SHOTS;
(async()=>{
 const engines=(process.env.ENGINES||'chromium,webkit').split(',').map(e=>[e,{chromium,webkit}[e]]);
 for(const [engine,type] of engines){
  let browser;try{browser=await type.launch();}catch(e){if(engine!=='chromium'&&/Executable doesn't exist/.test(e.message)){console.log(`${engine}: not installed here, skipped`);continue;}throw e;}
  try{for(const [W,H,motion] of [[390,844,'no-preference'],[360,780,'reduce'],[907,510,'reduce']]){
   const full=W===390;
   const context=await browser.newContext({viewport:{width:W,height:H},isMobile:W<700&&engine==='chromium',hasTouch:true,reducedMotion:motion});
   const page=await context.newPage(),errors=[];let shotN=0;
   // every moment shown is noted across reloads (they fade), to check the tideglass tip's words
   await page.addInitScript(()=>{addEventListener('DOMContentLoaded',()=>{new MutationObserver(()=>{const k='__moments',l=JSON.parse(sessionStorage.getItem(k)??'[]');for(const m of document.querySelectorAll('.moment'))if(m.innerText&&!l.includes(m.innerText))l.push(m.innerText);sessionStorage.setItem(k,JSON.stringify(l));}).observe(document.body,{subtree:true,childList:true,characterData:true});});});
   page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
   const tag=s=>`${engine} ${W}×${H}: ${s}`,save=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)??'null'),KEY);
   const shot=async name=>{if(SHOTS)await page.screenshot({path:path.join(SHOTS,`guide-${W}x${H}-${String(++shotN).padStart(2,'0')}-${name}.png`)});};
   const fits=async what=>{const o=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,vw:innerWidth}));assert.ok(o.doc<=o.vw+1,tag(`${what}: no sideways scroll (${o.doc} > ${o.vw})`));};
   const line=()=>page.locator('#hint').innerText(),step=()=>page.locator('#hint').getAttribute('data-step');
   const beats=async()=>{const t=[];for(let n=0;n<8&&await page.locator('#beat[open]').count();n++){t.push(await page.locator('#beatContent').innerText());await page.locator('#beatNext').click();await page.waitForTimeout(120);}return t.join(' | ');};
   const drag=async(a,b)=>{const ra=await a.boundingBox(),rb=await b.boundingBox();await page.mouse.move(ra.x+ra.width/2,ra.y+ra.height/2);await page.mouse.down();await page.mouse.move(rb.x+rb.width/2,rb.y+rb.height/2,{steps:6});await page.mouse.up();await page.waitForTimeout(220);};
   // between highlights the player works toward the goal line on their own: here, what the board advice would do
   // (coach.mjs step.advice, read from the saved camp), done through the real UI
   const advice=()=>page.evaluate(async k=>{const {coachStep}=await import('/v5/next/coach.mjs'),{load}=await import('/v5/next/game.mjs');return coachStep(load(localStorage.getItem(k),Date.now()))?.advice??null;},KEY);
   const cell=i=>page.locator(`#board [data-index="${i}"]`);
   const onOwn=async()=>{const g=await advice();assert.ok(g,tag('a goal with something to do: '+await line()));
    if(g.kind==='tap')await cell(g.index).click();else if(g.kind==='merge'||g.kind==='unseal')await drag(cell(g.cells[0]),cell(g.cells[1]));
    else if(g.kind==='deliver'){await page.locator(`[data-order="${g.id}"]`).click();await page.waitForTimeout(1000);}else assert.fail(tag('advice '+JSON.stringify(g)));};
   const noHighlight=async what=>{await page.waitForTimeout(80);assert.equal(await page.locator('#board .coachTarget,#board .coachFrom,#requests .coachTarget,#mapButton.coachTarget').count(),0,tag(what+': no highlight'));};
   // 1. a new camp, as a new player: Home → Play → the story
   await page.goto(URL+'?new=1');await page.evaluate(()=>{localStorage.clear();});await page.goto(URL);
   await page.waitForSelector('#homePlay:not([hidden])',{timeout:20000});await page.locator('#homePlay').click();
   await page.waitForSelector('#story:not([hidden])',{timeout:20000});
   const scenes=[];for(let n=0;n<3;n++){await page.waitForTimeout(motion==='reduce'?150:700);scenes.push(await page.locator('#storyText').innerText());if(n<2)await page.locator('#storyNext').click();}
   assert.equal(scenes[2],'The letter brought us to that Vault. First, let’s clear a landing.',tag('the story names the goal'));
   assert.equal(await page.locator('#storyNext').innerText(),'Clear a landing');await shot('story');
   await page.locator('#storyNext').click();await page.waitForSelector('#home',{state:'hidden',timeout:20000});await page.waitForTimeout(400);
   assert.equal(await page.locator('#beat[open]').count(),0,tag('no second introduction after the story'));
   let s=await save();assert.equal(s.moves,0,tag('arriving changes nothing'));
   assert.equal(await step(),'tap');assert.equal(await line(),'Tap the Rivet Rover for a part.');
   await page.waitForSelector('.coachTarget,.coachFrom',{timeout:4000});assert.equal(await page.locator('.coachTarget,.coachFrom').count()>=1,true,tag('one highlighted target'));await fits('first step');await shot('tap');
   if(!full){
    // 2. the smaller screens: the line and its target fit; a merge pair's demonstration, still with reduced motion
    await page.locator('#board .tile.coachTarget').click();await page.waitForTimeout(100);// the tap, highlighted once
    for(let n=0;n<4&&(await step())!=='merge';n++){assert.equal(await step(),'goal',tag('the tap is not taught again'));await noHighlight('a goal');await onOwn();}
    assert.equal(await step(),'merge');await page.waitForSelector('#board .coachFrom',{timeout:4000});// the ring is drawn on the next frame
    assert.equal(await page.locator('#board .coachFrom').count(),1);assert.equal(await page.locator('#board .coachTo').count(),1);
    assert.equal(await page.locator('#board .coachFrom').evaluate(e=>getComputedStyle(e,'::after').animationName),'none',tag('reduced motion: no moving demonstration'));
    await fits('merge step');await shot('merge');
    // 3. skip, reload, help replay
    await page.locator('#coachSkip').click();await page.waitForTimeout(200);s=await save();assert.equal(s.seen['coach-done'],true);
    assert.notEqual(await page.locator('#hint').getAttribute('data-kind'),'coach');assert.equal(await page.locator('.coachTarget,.coachFrom').count(),0,tag('skipped: no highlight'));
    await page.reload();await page.waitForSelector('#homePlay:not([hidden])');await page.locator('#homePlay').click();await page.waitForSelector('#home',{state:'hidden'});
    assert.notEqual(await page.locator('#hint').getAttribute('data-kind'),'coach',tag('stays skipped after a reload'));
    await page.locator('#helpButton').click();await page.locator('#helpReplay').click();
    const replay=await beats();assert.match(replay,/Crew orders pay coins/);assert.match(replay,/gold order pays coins too, and secures the materials/);await fits('help replay');
    // 4. an existing camp played before the guide: no guide
    await page.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));delete s.seen['coach-on'];delete s.seen['coach-done'];localStorage.setItem(k,JSON.stringify(s));},KEY);
    await page.reload();await page.waitForSelector('#homePlay:not([hidden])');await page.locator('#homePlay').click();await page.waitForSelector('#home',{state:'hidden'});
    assert.notEqual(await page.locator('#hint').getAttribute('data-kind'),'coach',tag('a played camp without the flag gets no guide'));
    assert.deepEqual(errors,[],tag('no page errors'));console.log(tag('fit, merge demo still, skip, reload, help replay, old camp: ok'));await context.close();continue;}
   // 1 (cont.): the one-time introduction, through the real UI: each control is highlighted once (tap, merge,
   // the crew delivery, the gold delivery, build); between those the line is a short goal with no highlight
   const t0=Date.now(),seen=[],LESSONS=['tap','merge','deliver','gold','build'];let actions=0,taught=0,reloaded=false;
   for(let n=0;n<160;n++){
    const id=await step();if(process.env.TRACE)console.log(((Date.now()-t0)/1000).toFixed(1),id,await line());if(seen.at(-1)!==id){seen.push(id);if(LESSONS.includes(id)||id==='goal')await shot(id);}
    if(id==='tap'){await page.locator('#board .tile.coachTarget').click();taught++;if(!actions){s=await save();assert.equal(s.seen['coach-on'],true,tag('the guide is the camp\'s from its first action'));}}
    else if(id==='merge'){await page.waitForSelector('#board .coachFrom',{timeout:4000});await drag(page.locator('#board .coachFrom'),page.locator('#board .coachTo'));taught++;}
    else if(id==='goal'){assert.match(await line(),/^(Goal: .+|Materials secured\. Deliver crew orders for the \d+ more coins\.)$/);await noHighlight('a goal');await onOwn();}
    else if(id==='note'){assert.match(await line(),/\+\d+ coins from .*: crew orders pay coins/);await shot('coins');await page.waitForTimeout(3900);continue;}
    else if(id==='deliver'||id==='gold'){
     try{await page.waitForSelector('#requests .coachTarget',{timeout:4000});}catch(e){throw new Error(tag(`no marked order for ${id}: "${await line()}"`));}
     await page.locator('#requests .coachTarget').click();await page.waitForTimeout(1000);taught++;// the coins fly first, then the line moves on
     if(id==='gold'){await page.waitForSelector('.moment:has-text("Materials secured")',{timeout:4000});const m=await page.locator('.moment').innerText();
      assert.match(m,/Materials secured · \+70 coins/,tag('both rewards in the title'));assert.match(m,/The gold order paid 70 coins and brought the materials for Clear the landing path/);await shot('materials');}}
    else if(id==='build'){await page.locator('#mapButton.coachTarget').click();await page.waitForSelector('#coastMap[open]');
     assert.match(await page.locator('#coastMap .coachLine').innerText(),/build it here/);assert.equal(await page.locator('#coastMap [data-restore="beach-path"].coachTarget').count(),1);
     // the Build button comes into view by itself (no scrolling by the player)
     await page.waitForTimeout(1200);{const r=await page.locator('#coastMap [data-restore="beach-path"]').boundingBox(),vh=await page.evaluate(()=>innerHeight);assert.ok(r&&r.y>=0&&r.y+r.height<=vh,tag(`the Build button in view: ${JSON.stringify(r)} of ${vh}`));}await shot('coast');
     await page.locator('#coastMap [data-restore="beach-path"]').click({force:true});taught++;await page.waitForTimeout(1300);
     const lines=await beats();assert.match(lines,/A path from the boats to dry ground/);await page.locator('#coastMap .close').click().catch(()=>{});await page.waitForTimeout(300);actions++;break;}
    else assert.fail(tag(`unexpected step ${id}: ${await line()}`));
    actions++;await page.waitForTimeout(60);
    // a reload in the middle of the loop resumes the same step
    if(!reloaded&&actions===12){const before=await step();await page.reload();await page.waitForSelector('#homePlay:not([hidden])');await page.locator('#homePlay').click();await page.waitForSelector('#home',{state:'hidden'});reloaded=true;
     assert.equal(await step(),before,tag('a reload resumes the step'));}
   }
   s=await save();assert.equal(s.built['beach-path'],1,tag('the first restoration'));
   assert.deepEqual(seen.filter(id=>LESSONS.includes(id)),LESSONS,tag('each control taught once, in order: '+seen.join(' ')));assert.equal(taught,LESSONS.length);
   {const ms=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('__moments')??'[]'));const ice=ms.find(m=>/Tideglass cracked/.test(m));
    assert.ok(ice,tag('the first loop cracks tideglass, and its tip shows: '+JSON.stringify(ms)));{assert.match(ice,/Tideglass cracked · 1 of 3/,tag('the hits so far'));assert.match(ice,/2 more merges beside it free the part inside/,tag('the hits left'));assert.match(ice,/Any merge counts|Each must make a level \d part or better/,tag('how strong a merge must be'));}}
   // the first restoration ends the guide; the message line names the next objective once
   assert.equal(s.seen['coach-done'],true,tag('the first restoration completes the guide'));
   assert.match(await page.locator('#message').innerText(),/Guide complete\. Next: Lay a boardwalk: its gold order brings the materials and coins/);
   assert.notEqual(await page.locator('#hint').getAttribute('data-kind'),'coach');await noHighlight('after the guide');await fits('after the guide');await shot('done');
   const secs=Math.round((Date.now()-t0)/1000);
   // later orders never restart it, across a reload: one ready part set is laid for the first crew order and delivered
   await page.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));const o=s.orders.find(o=>o&&!o.story);let i=s.board.indexOf(null);for(const r of o.needs)for(let c=0;c<r.count;c++){s.board[i]={type:'item',family:r.family,tier:r.tier};i=s.board.indexOf(null);}localStorage.setItem(k,JSON.stringify(s));},KEY);
   await page.reload();await page.waitForSelector('#homePlay:not([hidden])');await page.locator('#homePlay').click();await page.waitForSelector('#home',{state:'hidden'});await page.waitForTimeout(300);
   assert.notEqual(await page.locator('#hint').getAttribute('data-kind'),'coach',tag('no guide after a reload'));
   {const o=(await save()).orders.find(o=>o&&!o.story);await page.locator(`[data-order="${o.id}"]`).click();await page.waitForTimeout(1100);}
   assert.notEqual(await page.locator('#hint').getAttribute('data-kind'),'coach',tag('a later order does not restart the guide'));await noHighlight('a later order');
   assert.deepEqual(errors,[],tag('no page errors'));
   console.log(tag(`new camp → story → one-time guide → first restoration in ${actions} actions, ${taught} highlighted (${secs} s of test time); steps: ${seen.join(' → ')}`));
   await context.close();
  }}finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exit(1);});
