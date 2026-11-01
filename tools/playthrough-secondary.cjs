// Secondary-chain pilot, round 3: a mobile playthrough in the real game (390×844, touch). Every
// choice is the scripted player's (tests/v5-next-policy.mjs), made through visible taps and drags as
// in tests/v5-next-browser.cjs; with nothing to do and no energy, the save's refill clock is moved
// back 20 minutes, as a real wait would give. It records, action by action, the extras held (in
// drops), the orders asking for them, free board spaces and energy, and takes screenshots when the
// extras open, when the introductory order shows, at the first goal order, whenever extras rest,
// and at the end. Needs the repo served on :8080.
//   node tools/playthrough-secondary.cjs [OUT] [actions=700]
const {chromium}=require('playwright');const fs=require('node:fs');const path=require('node:path');const {throughHome}=require('../tests/v5-next-home-helper.cjs');
const URL='http://127.0.0.1:8080/v5/play.html',OUT=process.argv[2]??'.',MAX=+(process.argv[3]??700),KEY='vaultwake-v5-coast';
const read=page=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
async function closeBeats(page){for(let n=0;n<6&&await page.locator('#beat[open]').count();n++){await page.locator('#beatNext').tap();await page.waitForTimeout(80);}}
async function dragTo(page,from,to){const a=await page.locator(`#board [data-index="${from}"]`).boundingBox(),b=await page.locator(`#board [data-index="${to}"]`).boundingBox();
 await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:6});await page.mouse.up();}
async function perform(page,a){
 const s=await read(page),tile=i=>page.locator(`#board [data-index="${i}"]`),pressed=async i=>await tile(i).getAttribute('aria-pressed')==='true';
 if(a.type==='produce')await tile(Number.isInteger(a.index)?a.index:s.board.findIndex(x=>x?.type==='source'&&x.id===a.id)).tap();
 else if(a.type==='merge'||a.type==='unseal')await dragTo(page,a.from,a.to??a.index);
 else if(a.type==='openKit'){if(!await pressed(a.index))await tile(a.index).tap();await page.locator('#selection [data-action="openKit"]').tap();}
 else if(a.type==='deliver')await page.locator(`[data-order="${a.id}"]`).tap();
 else if(a.type==='restore'){await page.locator('#mapButton').tap();await page.locator(`#coastMap .place[data-place="${a.id}"] button`).tap();await page.locator(`#coastMap [data-restore="${a.id}"]`).tap();await closeBeats(page);await page.locator('#coastMap [data-back]').tap();}
 else if(a.type==='recycle'){if(!await pressed(a.index))await tile(a.index).tap();await page.locator('#selection [data-action="recycle"]').tap();}
 else if(a.type==='ration')await page.locator('#rationButton').tap();
 else if(a.type==='book'||a.type==='bookPage'){await page.locator('#bookButton').tap();await page.locator(a.type==='book'?`#book [data-key="${a.key}"]`:`#book [data-page="${a.family}"]`).tap();await page.locator('#book .close').tap();}
 else if(a.type==='store'){if(!await pressed(a.index))await tile(a.index).tap();await page.locator('#selection [data-action="store"]').tap();}
 else if(a.type==='unstore'){const slot=page.locator(`#shed [data-slot="${a.slot}"]`);if(!await slot.isVisible())await page.locator('#shed [data-shed-toggle]').tap();await slot.tap();}
 else throw Error('Unexpected action '+JSON.stringify(a));
 await page.waitForFunction(([k,n])=>JSON.parse(localStorage.getItem(k)).moves>n,[KEY,s.moves],{timeout:4000});
}
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});
 const browser=await chromium.launch();
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 const page=await context.newPage(),errors=[];throughHome(page);page.on('pageerror',e=>errors.push(e.message));
 await page.goto(URL+'?new=1');await page.waitForSelector('#board .tile');await closeBeats(page);
 await page.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.daily={day:9e6,count:1};localStorage.setItem(k,JSON.stringify(s));},KEY);
 await page.reload();await page.waitForSelector('#board .tile');await closeBeats(page);
 const shot=async name=>page.screenshot({path:path.join(OUT,`playthrough-${name}.png`)});
 const sec=f=>f==='mech'||f==='notes',units=(s,f)=>[...s.board,...s.shed,...s.pending].reduce((n,x)=>n+(x?.type==='item'&&x.family===f?2**x.tier:0),0),
  wanted=(s,f)=>s.orders.reduce((n,o)=>n+(o?.needs??[]).reduce((m,r)=>m+(r.family===f?r.count*2**r.tier:0),0),0);
 const timeline=[],seen={};let waits=0,minutes=0,lastUnits=0,drops=0,actions=0;
 for(let n=0;n<MAX;n++){
  const a=await page.evaluate(async k=>{const {nextAction}=await import('/tests/v5-next-policy.mjs');return nextAction(JSON.parse(localStorage.getItem(k)));},KEY);
  if(!a){await page.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.energyAt-=20*60*1000;localStorage.setItem(k,JSON.stringify(s));},KEY);waits++;minutes+=20;
   await page.reload();await page.waitForSelector('#board .tile');await closeBeats(page);continue;}
  await perform(page,a);actions++;minutes+=5/60;
  const msg=await page.locator('.moment').allTextContents().catch(()=>[]),line=await page.locator('#message').textContent();
  const s=await read(page),open=Object.keys(s.secOpen??{});
  const row={n:actions,min:Math.round(minutes),energy:s.energy,free:s.board.filter(x=>x===null).length,open,
   held:{mech:units(s,'mech'),notes:units(s,'notes')},wanted:{mech:wanted(s,'mech'),notes:wanted(s,'notes')},
   extraOrders:s.orders.filter(o=>o?.needs.some(r=>sec(r.family))).map(o=>o.needs.map(r=>r.family+r.tier).join('+'))};
  if(a.type==='produce'&&line.includes(' · and a '))drops++;
  timeline.push(row);
  if(open.length&&!seen.open){seen.open=1;await shot('1-unlocked');row.event='unlocked: '+msg.join(' / ');}
  if(row.extraOrders.length&&!seen.intro){seen.intro=1;await shot('2-first-extra-order');row.event='first extra order: '+row.extraOrders.join(', ');}
  if(row.extraOrders.some(k=>{const f=k.replace(/\d.*$/,'');return wanted(s,f)>units(s,f);})&&!seen.goal){seen.goal=1;await shot('3-first-goal-order');row.event='first goal order';}
  if(/extras rest/.test(line)&&!seen.rest){seen.rest=1;await shot('4-extras-rest');row.event='extras rest: '+line;}
  if(row.held.mech+row.held.notes>=4&&!seen.stock){seen.stock=1;await shot('5-most-extras-held');row.event='four or more extras held';}
 }
 await shot('6-end');
 // summary: after the first chain opened, how long extras sat with no order for them, and the board
 const after=timeline.filter(r=>r.open.length),unusedRows=after.filter(r=>['mech','notes'].some(f=>r.held[f]>r.wanted[f]&&r.wanted[f]===0));
 const summary={actions,waits,minutes:Math.round(minutes),errors,drops,firstOpenAt:after[0]?.n??null,
  actionsAfterOpen:after.length,unusedAfterOpenPct:after.length?Math.round(100*unusedRows.length/after.length):null,
  maxHeld:Math.max(0,...after.map(r=>r.held.mech+r.held.notes)),minFree:Math.min(...timeline.map(r=>r.free)),
  extraOrdersSeen:[...new Set(after.flatMap(r=>r.extraOrders))].length,events:timeline.filter(r=>r.event).map(r=>({n:r.n,min:r.min,event:r.event}))};
 fs.writeFileSync(path.join(OUT,'playthrough-timeline.json'),JSON.stringify({summary,timeline}));
 console.log(JSON.stringify(summary,null,1));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
