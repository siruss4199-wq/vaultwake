// Coast Camp rare extras, round 3 of the secondary-chain pilot, in a real browser (390×844, touch):
// merging two level-1 Rovers into level 2 opens the Rover's extras once (a note, the first Bolt on
// the board, the book page, an introductory order queued); the generator panel tells a level-1 copy
// from a level-2 one; an older save with a level-2 Rover opens on load with the note shown once;
// and a level-2 Rover whose extras rest says so.
const assert=require('node:assert/strict');const {chromium,webkit}=require('playwright');const {throughHome}=require('./v5-next-home-helper.cjs');
const URL='http://127.0.0.1:8080/v5/play.html',KEY='vaultwake-v5-coast';
const read=page=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
const write=(page,f,arg)=>page.evaluate(([k,src,arg])=>{const s=JSON.parse(localStorage.getItem(k));new Function('s','arg',src)(s,arg);localStorage.setItem(k,JSON.stringify(s));},[KEY,f,arg]);
async function closeBeats(page){for(let n=0;n<6&&await page.locator('#beat[open]').count();n++){await page.locator('#beatNext').tap();await page.waitForTimeout(80);}}
async function dragTo(page,from,to){const a=await page.locator(`#board [data-index="${from}"]`).boundingBox(),b=await page.locator(`#board [data-index="${to}"]`).boundingBox();
 await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:6});await page.mouse.up();}
(async()=>{
 const engines=(process.env.ENGINES||'chromium,webkit').split(',').map(e=>[e,{chromium,webkit}[e]]);
 for(const [engine,type] of engines){
  let browser;try{browser=await type.launch();}catch(e){if(engine!=='chromium'&&/Executable doesn't exist/.test(e.message)){console.log(`${engine}: not installed here, skipped`);continue;}throw e;}
  try{
   const open=async()=>{const context=await browser.newContext({viewport:{width:390,height:844},isMobile:engine==='chromium',hasTouch:true,reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];throughHome(page);page.on('pageerror',e=>errors.push(e.message));
    await page.goto(URL+'?new=1');await page.waitForSelector('#board .tile');await closeBeats(page);return {context,page,errors};};
   const ROVER=21,COPY=15;
   // 1. Two level-1 Rovers merged by drag: level 2 opens the extras, once.
   {const {context,page,errors}=await open();
    await write(page,`s.daily={day:9e6,count:1};s.board[${COPY}]={type:'source',id:'rig'};s.orders[0].story='beach-path';`);
    await page.reload();await page.waitForSelector('#board .tile');await closeBeats(page);
    await page.locator(`#board [data-index="${COPY}"]`).tap();
    assert.match(await page.locator('#selection').textContent(),/At level 2 it also makes rare Bolts/,'a level-1 copy says what level 2 adds');
    await dragTo(page,COPY,ROVER);await page.waitForSelector('.moment');
    assert.match(await page.locator('.moment').textContent(),/Rivet Rover extras unlocked/);
    let s=await read(page);assert.deepEqual(s.secOpen,{rig:true});assert.deepEqual(s.secIntro,['mech']);
    assert.equal(s.board.filter(x=>x?.type==='item'&&x.family==='mech').length,1,'the first Bolt is on the board');
    assert.equal(s.seen['extras-rig'],true,'the note is shown once');
    await page.locator(`#board [data-index="${ROVER}"]`).tap();assert.match(await page.locator('#selection').textContent(),/Rare extras: sometimes a Bolt/);
    await page.locator('#bookButton').tap();assert.match(await page.locator('#book').textContent(),/Rivet Rover extras/,'the book page opens with the chain');await page.locator('#book .close').tap();
    await page.reload();await page.waitForSelector('#board .tile');await page.waitForTimeout(400);
    assert.equal(await page.locator('.moment').count(),0,'no second note after a reload');
    s=await read(page);assert.equal([...s.board,...s.pending].filter(x=>x?.type==='item'&&x.family==='mech').length,1,'and no second Bolt');
    assert.deepEqual(errors,[]);await context.close();}
   // 2. An older save whose Rover is already level 2: opens on load, the gift waits, the note once.
   {const {context,page,errors}=await open();
    await write(page,`s.daily={day:9e6,count:1};s.board[${ROVER}].level=2;delete s.secOpen;delete s.secIntro;delete s.secTaps;s.seen={};s.moves=12;`);
    await page.reload();await page.waitForSelector('#board .tile');await page.waitForSelector('.moment');
    assert.match(await page.locator('.moment').textContent(),/Rivet Rover extras unlocked/);
    const s=await read(page);assert.deepEqual(s.secOpen,{rig:true});assert.equal([...s.board,...s.pending].filter(x=>x?.type==='item'&&x.family==='mech').length,1);
    await page.reload();await page.waitForSelector('#board .tile');await page.waitForTimeout(400);assert.equal(await page.locator('.moment').count(),0);
    assert.deepEqual(errors,[]);await context.close();}
   // 3. Four unused extras held: a level-2 Rover's tap says its extras rest.
   {const {context,page,errors}=await open();
    await write(page,`s.daily={day:9e6,count:1};s.board[${ROVER}].level=2;s.secOpen={rig:true};s.seen={'extras-rig':true};s.found.push('mech0','mech2');s.board[${COPY}]={type:'item',family:'mech',tier:2};s.energy=20;s.orders.forEach(o=>o.needs=o.needs.filter(r=>r.family!=='mech'));`);
    await page.reload();await page.waitForSelector('#board .tile');await closeBeats(page);
    await page.locator(`#board [data-index="${ROVER}"]`).tap();await page.waitForTimeout(200);
    assert.match(await page.locator('#message').textContent(),/rare extras rest while you hold 4 unused/);
    assert.deepEqual(errors,[]);await context.close();}
   console.log(`${engine} Coast Camp rare extras: level 2 opens them once (note, Bolt, book, introduction), level-1 and level-2 texts, opened on load once, rest message passed`);
  }finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exit(1);});
