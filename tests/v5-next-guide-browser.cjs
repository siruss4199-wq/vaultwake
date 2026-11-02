// Coast Camp's first-player guide in a real browser (build 51c; docs/V5_FIRST_PLAYER_GUIDE_2026-11-02.md).
// 1. A genuinely new camp at 390 x 844 (touch): Home → Play → the story's three scenes (its last line names
//    the goal: "The letter brought us to that Vault. First, let's clear a landing.") → the board with no
//    second introduction. The player then does only what the guide's line and highlighted target show,
//    through the real UI (tapping the Rover, dragging the marked pair, tapping the marked order, the strip,
//    the coast screen's build button): nothing is laid on the board and no coins are given. It reaches the
//    first restoration; the first crew order's coins and "Materials secured" are named; the result names
//    the next objective; the next delivery ends the guide. Actions and time are printed.
// 2. 360 x 780 and 907 x 510: the guide's line and target fit (no sideways scroll), with reduced motion.
// 3. Early independent actions, reload and skip: a player who merges before being asked is not asked again;
//    a reload resumes the same step; Skip guide ends it for good; Help replays it (four lines).
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
   assert.equal(await page.locator('.coachTarget,.coachFrom').count()>=1,true,tag('one highlighted target'));await fits('first step');await shot('tap');
   if(!full){
    // 2. the smaller screens: the line and its target fit; a merge pair's demonstration, still with reduced motion
    for(let n=0;n<4&&(await step())!=='merge';n++)await page.locator('#board .tile.coachTarget').click();
    assert.equal(await step(),'merge');assert.equal(await page.locator('#board .coachFrom').count(),1);assert.equal(await page.locator('#board .coachTo').count(),1);
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
   // 1 (cont.): follow only the guide, through the real UI
   const t0=Date.now(),seen=[];let actions=0,reloaded=false;
   const firstTap=async()=>{await page.locator('#board .tile.coachTarget').click();s=await save();assert.equal(s.seen['coach-on'],true,tag('the guide is the camp\'s from its first action'));};
   for(let n=0;n<160;n++){
    const id=await step();if(process.env.TRACE)console.log(((Date.now()-t0)/1000).toFixed(1),id,await line());if(seen.at(-1)!==id){seen.push(id);if(['merge','deliver','gold','build','result'].includes(id))await shot(id);}
    if(id==='result')break;
    if(id==='tap'){if(!actions)await firstTap();else await page.locator('#board .tile.coachTarget').click();}
    else if(id==='merge'||id==='unseal'){await drag(page.locator('#board .coachFrom'),page.locator('#board .coachTo'));}
    else if(id==='deliver'||id==='gold'||id==='note'){if(id==='note'){assert.match(await line(),/\+\d+ coins from .*: crew orders pay coins/);await shot('coins');await page.waitForTimeout(3900);continue;}
     try{await page.waitForSelector('#requests .coachTarget',{timeout:4000});}catch(e){throw new Error(tag(`no marked order for ${id}: "${await line()}" ${await page.evaluate(()=>[...document.querySelectorAll('[data-order]')].map(e=>e.tagName+':'+e.dataset.order+':'+e.className).join(' | '))}`));}
     await page.locator('#requests .coachTarget').click();await page.waitForTimeout(1000);// the coins fly first, then the line moves on
     if(id==='gold'){await page.waitForSelector('.moment:has-text("Materials secured")',{timeout:4000});const m=await page.locator('.moment').innerText();
      assert.match(m,/Materials secured · \+70 coins/,tag('both rewards in the title'));assert.match(m,/The gold order paid 70 coins and brought the materials for Clear the landing path/);await shot('materials');}}
    else if(id==='build'){await page.locator('#mapButton.coachTarget').click();await page.waitForSelector('#coastMap[open]');
     assert.match(await page.locator('#coastMap .coachLine').innerText(),/build it here/);assert.equal(await page.locator('#coastMap [data-restore="beach-path"].coachTarget').count(),1);
     // the Build button comes into view by itself (no scrolling by the player)
     await page.waitForTimeout(1200);{const r=await page.locator('#coastMap [data-restore="beach-path"]').boundingBox(),vh=await page.evaluate(()=>innerHeight);assert.ok(r&&r.y>=0&&r.y+r.height<=vh,tag(`the Build button in view: ${JSON.stringify(r)} of ${vh}`));}await shot('coast');
     await page.locator('#coastMap [data-restore="beach-path"]').click({force:true});await page.waitForTimeout(1300);
     const lines=await beats();assert.match(lines,/A path from the boats to dry ground/);await page.locator('#coastMap .close').click().catch(()=>{});await page.waitForTimeout(300);}
    else assert.fail(tag(`unexpected step ${id}: ${await line()}`));
    actions++;await page.waitForTimeout(60);
    // a reload in the middle of the loop resumes the same step
    if(!reloaded&&id==='gold'){reloaded=true;}
    if(!reloaded&&actions===12){const before=await step();await page.reload();await page.waitForSelector('#homePlay:not([hidden])');await page.locator('#homePlay').click();await page.waitForSelector('#home',{state:'hidden'});reloaded=true;
     assert.equal(await step(),before,tag('a reload resumes the step'));}
   }
   s=await save();assert.equal(s.built['beach-path'],1,tag('the first restoration'));
   const order=['tap','merge','deliver','gold','build','result'];let k=0;for(const id of seen)if(id===order[k])k++;assert.equal(k,order.length,tag('the loop in order: '+seen.join(' ')));
   {const ms=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('__moments')??'[]'));const ice=ms.find(m=>/Tideglass cracked/.test(m));
    assert.ok(ice,tag('the first loop cracks tideglass, and its tip shows: '+JSON.stringify(ms)));{assert.match(ice,/Tideglass cracked · 1 of 3/,tag('the hits so far'));assert.match(ice,/2 more merges beside it free the part inside/,tag('the hits left'));assert.match(ice,/Any merge counts|Each must make a level \d part or better/,tag('how strong a merge must be'));}}
   assert.match(await line(),/Next: Lay a boardwalk: its gold order brings the materials and coins/);assert.equal(await page.locator('#mapButton.coachTarget').count(),1,tag('the next objective marked'));await fits('result');await shot('result');
   const secs=Math.round((Date.now()-t0)/1000);
   // a reload keeps the result step; then the next delivery ends the guide (checked after the playthrough:
   // one ready part is laid for the first crew order, so the check does not depend on more play)
   await page.reload();await page.waitForSelector('#homePlay:not([hidden])');await page.locator('#homePlay').click();await page.waitForSelector('#home',{state:'hidden'});await page.waitForTimeout(300);
   assert.equal(await step(),'result',tag('the result survives a reload'));
   await page.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));const o=s.orders.find(o=>o&&!o.story);let i=s.board.indexOf(null);for(const r of o.needs)for(let c=0;c<r.count;c++){s.board[i]={type:'item',family:r.family,tier:r.tier};i=s.board.indexOf(null);}localStorage.setItem(k,JSON.stringify(s));},KEY);
   await page.reload();await page.waitForSelector('#homePlay:not([hidden])');await page.locator('#homePlay').click();await page.waitForSelector('#home',{state:'hidden'});await page.waitForTimeout(300);
   {const o=(await save()).orders.find(o=>o&&!o.story);await page.locator(`[data-order="${o.id}"]`).click();await page.waitForTimeout(1100);}
   s=await save();assert.equal(s.seen['coach-done'],true,tag('the next delivery ends the guide'));assert.notEqual(await page.locator('#hint').getAttribute('data-kind'),'coach');
   assert.deepEqual(errors,[],tag('no page errors'));
   console.log(tag(`new camp → story → guide only → first restoration in ${actions} guided actions (${secs} s of test time); steps: ${seen.join(' → ')}`));
   await context.close();
  }}finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exit(1);});
