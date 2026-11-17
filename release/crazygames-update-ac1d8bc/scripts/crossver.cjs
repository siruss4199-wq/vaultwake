// CrazyGames update ac1d8bc (from the 2026-11-16 release audit's crossver.cjs; ENGINE chromium|webkit added; the candidate
// served from the extracted ZIP): save compatibility across builds (real browsers, the builds' own code; localStorage path).
// For each source build (FROM, e.g. the expected live build 822a8f9 on :8082, the previous live 664956e on :8083):
//  A. a new camp played ~40 actions with the source build's own hint line (its own save writer);
//  B. the chapter-2 fixture opened and played 5 actions in the source build (its load + re-save);
// then the stored keys move to the candidate (CAND, :8080): Home must offer Continue (never a new camp), the camp must
// be identical (coins, built stages, materials, level, orders done, board), no tutorial is forced on it, no page error;
// one action and a reload must keep it; and the candidate's save must open again in the source build (rollback).
const {chromium,webkit}=require('playwright');const ENGINE=process.env.ENGINE||'chromium';const fs=require('fs');const path=require('path');
const CAND=process.env.CAND||'http://127.0.0.1:8080',FROM=(process.env.FROM||'live=http://127.0.0.1:8082,prev=http://127.0.0.1:8083').split(',').map(s=>s.split('='));
const fixture=fs.readFileSync(path.join(process.cwd(),'tests/fixtures/coast/coast-ch2-pre-secondary.json'),'utf8');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const keysOf=page=>page.evaluate(()=>{const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(/^vaultwake/.test(k))o[k]=localStorage.getItem(k);}return o;});
const sum=raw=>{const s=JSON.parse(raw);return {coins:s.coins,built:JSON.stringify(s.built),materials:JSON.stringify(s.materials),level:s.level?.level??s.level,xp:s.level?.xp,ordersDone:s.ordersDone,moves:s.moves,board:JSON.stringify(s.board),shed:JSON.stringify(s.shed),area:s.area,seen:Object.keys(s.seen??{}).length};};
async function open(browser,origin,keys,{continueHome=true}={}){
 const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:ENGINE==='chromium',hasTouch:true}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 if(keys)await page.addInitScript(k=>{if(!sessionStorage.__seeded){for(const [a,b] of Object.entries(k))localStorage.setItem(a,b);sessionStorage.__seeded='1';}},keys);
 await page.goto(origin+'/v5/play.html');await page.waitForSelector('#board .tile',{timeout:30000});await delay(1500);
 const home=await page.evaluate(()=>{const h=document.querySelector('#home');return h&&!h.hidden?(document.querySelector('#homePlay:not([hidden])')?.innerText.trim()??'(loading)'):'(no home)';});
 if(continueHome)for(let k=0;k<20;k++){
  let closed=false;for(const d of ['#daily','#levelUp','#endDialog'])if(await page.locator(d+'[open]').count()){await page.locator(d+' .close').first().click({timeout:3000}).catch(()=>page.keyboard.press('Escape'));await delay(400);closed=true;}if(closed)continue;
  if(await page.locator('#story:not([hidden]) #storySkip').count()){await page.locator('#storySkip').click();await delay(500);continue;}
  if(await page.locator('#beat[open]').count()){await page.locator('#beatNext').click();await delay(300);continue;}
  const vis=await page.evaluate(()=>{const h=document.querySelector('#home');return !!h&&!h.hidden&&!document.querySelector('#homePlay')?.hidden;});
  if(vis){await page.locator('#homePlay').click();await delay(800);continue;}break;}
 for(const d of ['#daily','#levelUp','#endDialog'])if(await page.locator(d+'[open]').count())await page.locator(d+' .close').first().click().catch(()=>{});
 await delay(500);return {ctx,page,errors,home};
}
// play with the build's own hint line: it taps, delivers or shows a pair (which we drag)
async function play(page,n){let acts=0;for(let i=0;i<n;i++){
 for(const d of ['#daily','#levelUp','#beat'])if(await page.locator(d+'[open]').count()){if(d==='#beat')await page.locator('#beatNext').click().catch(()=>{});else await page.locator(d+' .close').first().click().catch(()=>{});await delay(300);}
 if(await page.locator('#coastMap[open]').count()){await page.locator('#coastMap .close').first().click().catch(()=>{});await delay(300);}
 const pair=await page.evaluate(()=>[...document.querySelectorAll('#board .tile.hintPair,#board .tile.coachFrom,#board .tile.coachTo')].map(e=>+e.dataset.index));
 if(pair.length>=2){const a=await page.locator(`#board [data-index="${pair[0]}"]`).boundingBox(),b=await page.locator(`#board [data-index="${pair[1]}"]`).boundingBox();
  await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();for(let k=1;k<=8;k++){await page.mouse.move(a.x+a.width/2+(b.x-a.x)*k/8,a.y+a.height/2+(b.y-a.y)*k/8);await delay(15);}await page.mouse.up();acts++;await delay(500);continue;}
 const st=await page.evaluate(()=>window.VWGuide?.step?.target??null);
 if(st?.kind==='cell'){await page.locator(`#board [data-index="${st.index}"]`).click();acts++;await delay(400);continue;}
 if(st?.kind==='order'){await page.locator(`[data-order="${st.id}"]`).click();acts++;await delay(900);continue;}
 await page.locator('#hint').click().catch(()=>{});acts++;await delay(500);}
 return acts;}
(async()=>{const browser=await {chromium,webkit}[ENGINE].launch(),rows=[];rows.push(`engine ${ENGINE}`);let fail=0;
 const check=(ok,what)=>{rows.push(`${ok?'PASS':'FAIL'} ${what}`);if(!ok)fail++;};
 try{for(const [name,origin] of FROM){
  for(const kase of ['A new camp','B chapter-2 fixture']){const tag=s=>`${name} → candidate, ${kase}: ${s}`;
   // 1. the source build writes the camp
   const seed=kase.startsWith('B')?{'vaultwake-v5-coast':fixture,'vaultwake-v5-coast-story':'{"intro":"skip"}'}:null;
   const src=await open(browser,origin,seed);const n=await play(src.page,kase.startsWith('A')?40:5);await delay(1500);
   const keys=await keysOf(src.page);await src.ctx.close();
   if(!keys['vaultwake-v5-coast']){check(false,tag(`the source build saved nothing after ${n} actions`));continue;}
   const before=sum(keys['vaultwake-v5-coast']);
   // 2. the candidate opens it
   const c=await open(browser,CAND,keys);
   check(c.home==='Continue',tag(`Home offers "${c.home}" (Continue expected, never a new camp)`));
   const afterKeys=await keysOf(c.page),after=sum(afterKeys['vaultwake-v5-coast']);
   for(const f of ['coins','built','materials','level','ordersDone','board','shed','area'])check(after[f]===before[f],tag(`${f} kept (${String(before[f]).slice(0,40)} → ${String(after[f]).slice(0,40)})`));
   // a one-time "seen" flag the candidate records on opening the camp counts as a move (act({type:'seen'}) adds one);
   // the live build 822a8f9 does the same (2026-11-16 audit, crossver.txt note): moves may grow by exactly that many
   check(after.moves-before.moves===after.seen-before.seen,tag(`moves kept, apart from one-time seen flags (${before.moves} → ${after.moves}; seen flags ${before.seen} → ${after.seen})`));
   const guide=await c.page.evaluate(()=>({step:window.VWGuide?.step?.kind??null,spot:document.body.dataset.spot??null}));
   const builtAny=Object.values(JSON.parse(before.built||'{}')).some(v=>v>0);
   if(builtAny)check(guide.step===null&&!guide.spot,tag(`a camp with a stage built is never put in the tutorial (${JSON.stringify(guide)})`));
   else rows.push(`INFO ${tag(`no stage built yet in the source build: the first-loop guide ${guide.step?'resumes at "'+guide.step+'"':'is off'} (expected: a half-finished guide resumes)`)}`);
   // 3. one action and a reload in the candidate
   await play(c.page,1);await delay(1200);const mid=sum((await keysOf(c.page))['vaultwake-v5-coast']);
   await c.page.reload();await c.page.waitForSelector('#board .tile');await delay(1500);const re=sum((await keysOf(c.page))['vaultwake-v5-coast']);
   check(re.moves>=before.moves&&re.board===mid.board&&re.coins===mid.coins,tag(`an action and a reload keep the camp (moves ${before.moves} → ${mid.moves} → ${re.moves})`));
   check(c.errors.length===0,tag(`no page errors in the candidate (${c.errors.join(' | ').slice(0,200)})`));
   const candKeys=await keysOf(c.page);await c.ctx.close();
   // 4. rollback: the candidate's save opens in the source build
   const back=await open(browser,origin,candKeys);const rb=sum((await keysOf(back.page))['vaultwake-v5-coast']);
   check(back.home==='Continue',tag(`rollback: the source build offers "${back.home}"`));
   check(rb.coins===re.coins&&rb.built===re.built&&rb.board===re.board,tag('rollback: the source build opens the candidate\'s camp unchanged'));
   check(back.errors.length===0,tag(`rollback: no page errors (${back.errors.join(' | ').slice(0,200)})`));
   rows.push(`     sizes: ${Object.entries(candKeys).map(([k,v])=>`${k} ${v.length} B`).join(', ')}`);await back.ctx.close();}}
 }finally{await browser.close();}
 console.log(rows.join('\n'));console.log(fail?`${fail} FAILED`:'all save compatibility checks passed');process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
