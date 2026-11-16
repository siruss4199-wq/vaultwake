// The Survey Kite from the camp tent (first 10 minutes, 2026-11-14; docs/V5_FIRST_10_MINUTES_2026-11-14.md), in the
// real game with real input, Chromium and WebKit, 360 and 907 px:
//  1. a camp with the landing path at stage 2 and the tent's materials in: the coast card for the tent says
//     "Unlocks a new generator: the Survey Kite"; Build gives it ("a new generator: the Survey Kite");
//  2. back on the board, the guide line's own note points at it once ("New generator: tap the Survey Kite for an Ink
//     scrap", the Kite highlighted), nothing blocks: no dialog opens;
//  3. a tap on the Kite makes its part (an Ink scrap) and is saved;
//  4. a new camp's first session: the Daily gift does not open by itself (its button is there).
// ENGINES (default chromium,webkit), SIZES (default 360x640,907x510).
const assert=require('node:assert/strict');const {chromium,webkit}=require('playwright');
const ORIGIN='http://127.0.0.1:8080',KEY='vaultwake-v5-coast';
const SIZES=(process.env.SIZES||'360x640,907x510').split(',').map(s=>s.split('x').map(Number));
const ENGINES=(process.env.ENGINES||'chromium,webkit').split(',');
(async()=>{for(const engine of ENGINES){const b=await {chromium,webkit}[engine].launch();
 for(const [w,h] of SIZES){const mobile=w<700,tag=`${engine} ${w}x${h}`,errors=[];
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mobile,isMobile:mobile&&engine==='chromium'}),page=await ctx.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  const tap=async loc=>{await loc.first().waitFor({state:'visible',timeout:8000});const p=await loc.first().evaluate(async el=>{el.scrollIntoView({block:'nearest'});await new Promise(requestAnimationFrame);const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};});if(mobile)await page.touchscreen.tap(p.x,p.y);else await page.mouse.click(p.x,p.y);};
  const read=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
  // 4. a new camp: play a few guided steps past the guided span is not needed: the gift never opens by itself here
  await page.goto(ORIGIN+'/v5/play.html');await page.waitForSelector('#board .tile');
  for(let n=0;n<6;n++){const a=await page.evaluate(()=>VWGuide.step?.action);if(a?.type!=='produce')break;await tap(page.locator(`#board [data-index="${a.index}"]`));await page.waitForTimeout(400);}
  // Skip the guide (it ends the guided span): before this change the gift opened by itself now (3+ moves, no guide)
  assert.ok((await read()).moves>=3,`${tag}: a few moves made`);await tap(page.locator('#coachSkip'));
  await page.waitForTimeout(2600);assert.equal(await page.locator('#daily[open]').count(),0,`${tag}: no Daily gift popup in a new camp's first session`);
  // 1. the tent's coast card and Build
  await page.evaluate(async k=>{const g=await import(new URL('next/game.mjs',document.baseURI).href);const s=g.fresh(Date.now());s.built={'beach-path':2};s.materials={'beach-path':2,'beach-tent':1};s.coins=120;s.moves=60;
   s.board[g.ROVER].level=2;s.seen={...s.seen,'coach-on':true,'coach-done':true,'coach-next':true};s.daily={day:99999,count:1};localStorage.setItem(k,JSON.stringify(s));},KEY);
  await page.reload();await page.waitForSelector('#board .tile');if(await page.locator('#homePlay:not([hidden])').count())await tap(page.locator('#homePlay'));
  await page.waitForFunction(()=>!document.querySelector('#home')||document.querySelector('#home').hidden||!document.body.classList.contains('homeOpen'),null,{timeout:15000}).catch(()=>{});
  await page.waitForTimeout(500);for(let i=0;i<4&&await page.locator('#beat[open]').count();i++)await tap(page.locator('#beatNext'));
  await tap(page.locator('#mapButton'));await page.waitForSelector('#coastMap[open]');await page.waitForTimeout(700);
  const tent=page.locator('#coastMap [data-place="beach-tent"] button');if(await tent.count())await tap(tent);await page.waitForTimeout(400);
  assert.match(await page.locator('#mapCard .cardGift').innerText(),/Unlocks a new generator: the Survey Kite/,`${tag}: the coast card names the new generator`);
  await tap(page.locator('#coastMap [data-restore="beach-tent"]'));await page.waitForTimeout(2400);
  assert.match(await page.locator('#coastMap .rcRewards').innerText(),/a new generator: the Survey Kite/,`${tag}: the reward says it`);
  const s1=await read(),kite=s1.board.findIndex(x=>x?.type==='source'&&x.id==='chart');assert.ok(kite>=0,`${tag}: the Kite is on the board`);
  // 2. back on the board: the guide note points at it, nothing blocks
  await tap(page.locator('#coastMap [data-done]'));await page.waitForTimeout(900);
  assert.match(await page.locator('#hint').innerText(),/New generator: tap the Survey Kite for an Ink scrap/,`${tag}: the guide line points at the Kite`);
  assert.ok(await page.locator(`#board [data-index="${kite}"].coachTarget`).count(),`${tag}: the Kite is highlighted`);
  assert.equal(await page.locator('dialog[open]').count(),0,`${tag}: no dialog`);
  // 3. a tap on the Kite makes its part
  const before=s1.board.filter(x=>x?.type==='item'&&x.family==='chart').length;await tap(page.locator(`#board [data-index="${kite}"]`));
  await page.waitForFunction(([k,n])=>JSON.parse(localStorage.getItem(k)).board.filter(x=>x?.type==='item'&&x.family==='chart').length>n,[KEY,before],{timeout:5000});
  assert.deepEqual(errors,[],`${tag}: no page errors`);
  console.log(`${tag}: tent → Survey Kite: card, reward, guide note, highlight, first part; no gift popup for a new camp passed`);
  await ctx.close();}
 await b.close();}})().catch(e=>{console.error(e);process.exit(1);});
