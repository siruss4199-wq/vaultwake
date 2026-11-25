// Vaultwake Merge on Playgama (2026-11-24, release/playgama): the built archive (tools/coast-playgama.mjs, served
// unpacked from dist/playgama at PG_ORIGIN) in a real browser. Most cases replace playgama-bridge.js with a stand-in
// Bridge that records every call and can be told how to behave (ads that finish, are closed early or fail; the
// platform muting or pausing the game; initialize or storage failing). One case runs the real, unmodified Bridge.
// What is checked, against Playgama's required steps and Game Requirements:
//  A  new player: the Bridge is initialised before any game style or script loads; progress is read with ONE
//     storage.get of every key; game_ready is sent once, only when the game can be played; the guided first loop
//     to the first Build; saves are batched (far fewer storage.set calls than actions); the game writes nothing to
//     localStorage; a reload → Continue keeps the camp; no interstitial in the first session.
//  B  a played camp: Build a stage, back to the board → one interstitial ('stage_built'), the game muted and paused
//     while it is open and not after; Esc does not close the order sheet (1.5.2); a long press opens no menu (1.4.5).
//  C  rewarded ad that finishes: the button says it is an ad and what it gives; +25 energy only after `rewarded`.
//  D  rewarded ad closed early, E  rewarded ad that fails: no reward, the game goes on.
//  F  rewarded ads not supported: no rewarded button or shop offer at all (required step 8).
//  G  the platform mutes audio at start, unmutes, pauses: the game follows.
//  H  initialize() fails, I  the Bridge script is missing: the game still starts and saves (this browser).
//  J  the Bridge storage cannot be read: playable, nothing written over the platform's data, the menu says so.
//  K  the real Bridge 2.4.4 (its mock platform off Playgama): starts, plays, keeps progress over a reload.
//  L  screen sizes incl. a square window (1.6): no page scrolling, the board inside the window, nothing cut.
// Usage: PG_ORIGIN=http://127.0.0.1:8090 ENGINE=chromium|webkit|firefox node tests/v5-playgama-browser.cjs
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const pw=require('playwright');
const ORIGIN=process.env.PG_ORIGIN||'http://127.0.0.1:8090',ENGINE=process.env.ENGINE||'chromium',ONLY=process.env.ONLY?.split(',');
const KEY='vaultwake-v5-coast';
const OUT=path.join(__dirname,'..','test-artifacts','v5','playgama');fs.mkdirSync(OUT,{recursive:true});
const STUB=fs.readFileSync(path.join(__dirname,'fixtures','playgama','bridge-stub.js'),'utf8');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
// A played chapter-1 camp (the build-flow test's fixture): energy 1, 320 coins, the forge's materials ready.
const camp=()=>{const c=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures','coast','coast-ch1-pre-secondary.json'),'utf8'));
 c.daily={day:9e6,count:1};c.materials['beach-workshop']=c.built['beach-workshop']+1;c.coins=320;c.energy=1;c.energyAt=Date.now();return c;};
const results=[];let browser;
async function open({cfg={},seed=null,viewport={width:390,height:844},bridge='stub',mobile=true}={}){
 const ctx=await browser.newContext({viewport,isMobile:mobile&&ENGINE==='chromium',hasTouch:mobile});
 const page=await ctx.newPage();
 const log={requests:[],errors:[],failed:[],outside:new Set()};
 if(bridge==='stub')await ctx.route(ORIGIN+'/playgama-bridge.js',r=>r.fulfill({contentType:'text/javascript',body:STUB}));
 if(bridge==='missing')await ctx.route(ORIGIN+'/playgama-bridge.js',r=>r.fulfill({status:404,body:'missing'}));
 page.on('request',r=>{const u=new URL(r.url());log.requests.push({path:u.pathname,t:Date.now()});if(u.origin!==ORIGIN)log.outside.add(u.origin);});
 page.on('pageerror',e=>log.errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400&&!(bridge==='missing'&&r.url().endsWith('/playgama-bridge.js')))log.failed.push(r.status()+' '+r.url());});
 page.on('requestfailed',r=>log.failed.push('FAILED '+r.url()));
 // The stand-in's settings and stored data live under its own keys; the game's must never appear.
 await page.goto(ORIGIN+'/playgama-bridge-config.json');
 await page.evaluate(([cfg,seed,k])=>{localStorage.clear();localStorage.setItem('__pgCfg',JSON.stringify(cfg));if(seed)localStorage.setItem('__pgStub',JSON.stringify({[k]:JSON.stringify(seed)}));},[cfg,seed,KEY]);
 await page.goto(ORIGIN+'/index.html');
 return {ctx,page,log};
}
const calls=(page,n)=>page.evaluate(n=>(window.__pg?.calls??[]).filter(c=>!n||c.n===n),n);
const gameKeys=page=>page.evaluate(()=>Object.keys(localStorage).filter(k=>!k.startsWith('__pg')&&k!=='playgama-bridge-storage-pending'));
const stubSave=page=>page.evaluate(k=>{const s=JSON.parse(localStorage.getItem('__pgStub')||'{}');return s[k]?JSON.parse(s[k]):null;},KEY);
const tapAt=async(page,l)=>{const x=await l.boundingBox();try{await page.touchscreen.tap(x.x+x.width/2,x.y+x.height/2);}catch(e){if(!/hasTouch/.test(e.message))throw e;await page.mouse.click(x.x+x.width/2,x.y+x.height/2);}};
const settle=async page=>{for(let k=0;k<12;k++){await delay(150);
 if(await page.locator('#beat[open]').count()){await page.locator('#beatNext').click().catch(()=>{});continue;}
 for(const d of ['#daily','#endDialog','#menu'])if(await page.locator(d+'[open]').count())await page.locator(d+' .close').click().catch(()=>{});}};
async function continueCamp(page){await page.waitForSelector('#homePlay:not([hidden])',{timeout:30000});await tapAt(page,page.locator('#homePlay'));await page.waitForFunction(()=>!document.body.classList.contains('homeOpen')&&!document.querySelector('#home:not([hidden]).isOpen'),null,{timeout:20000}).catch(()=>{});await delay(1200);await settle(page);}
const pgPlatform=page=>page.evaluate(async()=>{const m=await import('/next/platform.mjs');return {muted:m.platform.muted(),paused:m.platform.paused,ready:m.platform.gameReadySent};});
async function run(id,name,fn){
 if(ONLY&&!ONLY.includes(id))return;
 const t0=Date.now();
 try{await fn();results.push({id,name,ok:true,ms:Date.now()-t0});console.log(`ok ${ENGINE} ${id}: ${name}`);}
 catch(e){results.push({id,name,ok:false,error:e.message.split('\n').slice(0,6).join(' | ')});console.log(`FAIL ${ENGINE} ${id}: ${name}\n  ${e.message.split('\n').slice(0,8).join('\n  ')}`);}
}

(async()=>{
 browser=await pw[ENGINE].launch();
 const used=browser.browserType().name();if(used!==ENGINE)throw new Error(`asked for ${ENGINE}, launched ${used}`);
 console.log(`engine ${used} ${browser.version()}`);

 await run('A','new player: Bridge first, one read, game_ready once, guided first Build, batched saves, no localStorage, reload keeps it',async()=>{
  const {ctx,page,log}=await open({cfg:{initDelay:400}});
  await page.waitForSelector('#board .tile',{timeout:30000});
  const init=(await calls(page,'initialized'))[0];assert.ok(init,'initialize resolved');
  const firstGame=log.requests.find(r=>/\.(css|mjs)$/.test(r.path)||/\/next\/boot\.js$/.test(r.path));
  assert.ok(firstGame&&firstGame.t>=init.t,`a game file (${firstGame?.path}) was requested ${init.t-firstGame?.t} ms before the Bridge was initialised`);
  const gets=await calls(page,'storage.get');assert.equal(gets.length,1,'one storage.get at start');assert.ok(gets[0].d.keys>=30&&gets[0].d.parse===false,'every key, raw strings');
  // The guided first loop (window.VWGuide) to the first Build, with finger taps and drags.
  const cell=i=>page.locator(`#board [data-index="${i}"]`);
  const drag=async(a,c)=>{const x=await cell(a).boundingBox(),y=await cell(c).boundingBox();await page.mouse.move(x.x+x.width/2,x.y+x.height/2);await page.mouse.down();for(let k=1;k<=8;k++){await page.mouse.move(x.x+x.width/2+(y.x-x.x)*k/8,x.y+x.height/2+(y.y-x.y)*k/8);await delay(15);}await page.mouse.up();};
  let built=false,actions=0;
  for(let n=0;n<110&&!built;n++){await delay(600);if(await page.locator('#beat[open]').count()){await tapAt(page,page.locator('#beatNext'));continue;}
   const st=await page.evaluate(()=>window.VWGuide?.step);if(!st?.target)continue;const t=st.target;actions++;
   if(t.kind==='cell')await tapAt(page,cell(t.index));else if(t.kind==='pair')await drag(t.cells[0],t.cells[1]);else if(t.kind==='order'){await tapAt(page,page.locator(`#requests [data-order="${t.id}"] .reqDeliver`));await delay(900);}
   else if(t.kind==='strip'){await tapAt(page,page.locator('#mapButton'));await page.waitForSelector('#coastMap[open]');await delay(1200);
    const bb=page.locator('#coastMap [data-restore].coachTarget').first();await bb.evaluate(e=>e.scrollIntoView({block:'center'}));await delay(300);await tapAt(page,bb);
    await page.waitForSelector('#coastMap .restoredCard',{timeout:8000});await delay(1500);built=await page.locator('#coastMap .restoredCard .rcDone').count()>0;
    const back=page.locator('#coastMap .restoredCard .rcBack');await back.evaluate(e=>e.scrollIntoView({block:'center'}));await delay(300);await tapAt(page,back);await delay(2000);}}
  assert.ok(built,'the guided loop reached the first Build');
  const ready=await calls(page,'sendMessage');assert.deepEqual(ready.map(c=>c.d),['game_ready'],'game_ready once');
  assert.equal((await calls(page,'showInterstitial')).length,0,'no interstitial in the first session (the tutorial\'s Build)');
  await page.evaluate(()=>window.VWKV.flush());await delay(300);
  const sets=await calls(page,'storage.set'),moves=(await stubSave(page))?.moves;
  assert.ok(moves>=10,'moves saved: '+moves);assert.ok(sets.length<moves,`batched: ${sets.length} storage.set calls for ${moves} moves`);
  assert.deepEqual(await gameKeys(page),[],'the game wrote nothing to localStorage');
  const before=await stubSave(page);
  await page.reload();await page.waitForSelector('#homePlay:not([hidden])',{timeout:30000});
  assert.match(await page.locator('#homePlay').innerText(),/Continue/);
  assert.deepEqual((await calls(page,'sendMessage')).map(c=>c.d),['game_ready'],'game_ready once after the reload, with Home shown');
  await continueCamp(page);
  const after=await page.evaluate(()=>({built:JSON.parse(window.VWKV.getItem('vaultwake-v5-coast')).built}));
  assert.deepEqual(after.built,before.built,'the camp after a reload');
  assert.deepEqual(log.errors,[],'page errors');assert.deepEqual(log.failed,[],'failed requests');assert.deepEqual([...log.outside],[],'requests outside the archive');
  await page.screenshot({path:path.join(OUT,`${ENGINE}-A-after-reload.png`)});
  console.log(`   A: ${actions} guided actions, ${moves} moves, ${sets.length} storage.set calls, Bridge init ${await page.evaluate(()=>window.VWBridge.initMs)} ms`);
  await ctx.close();
 });

 await run('B','played camp: Build → back to the board → one interstitial, muted and paused only while open; Esc; long press',async()=>{
  const {ctx,page,log}=await open({seed:camp()});
  await continueCamp(page);
  assert.equal((await calls(page,'sendMessage')).filter(c=>c.d==='game_ready').length,1);
  await tapAt(page,page.locator('#mapButton'));await page.waitForSelector('#coastMap[open]');await delay(1200);
  const card=page.locator('#coastMap [data-restore]:not([disabled])').first();await card.evaluate(e=>e.scrollIntoView({block:'center'}));await delay(300);await tapAt(page,card);
  await page.waitForSelector('#coastMap .restoredCard',{timeout:8000});await delay(1500);
  assert.equal((await calls(page,'showInterstitial')).length,0,'nothing while the player is still on the coast');
  const back=page.locator('#coastMap .restoredCard .rcBack');await back.evaluate(e=>e.scrollIntoView({block:'center'}));await delay(200);await tapAt(page,back);
  await page.waitForFunction(()=>window.__pg.calls.some(c=>c.n==='showInterstitial'),null,{timeout:5000});
  await delay(250);const during=await pgPlatform(page);
  await delay(900);const afterAd=await pgPlatform(page);
  const inter=await calls(page,'showInterstitial');assert.equal(inter.length,1);assert.equal(inter[0].d,'stage_built');
  assert.ok(during.muted&&during.paused,'muted and paused while the interstitial is open');assert.ok(!afterAd.muted&&!afterAd.paused,'sound and play back after it');
  await settle(page);
  // Esc (1.5.2): the order sheet does not use it.
  const details=page.locator('#orderDetails:not([hidden])');
  if(await details.count()){await tapAt(page,details);await delay(400);const open1=await page.evaluate(()=>!document.querySelector('#orderTools').hidden);await page.keyboard.press('Escape');await delay(300);
   const open2=await page.evaluate(()=>!document.querySelector('#orderTools').hidden);assert.ok(!open1||open2,'Esc closed the order sheet');}
  // Long press (1.4.5): no browser menu, no text selection.
  const cm=await page.evaluate(()=>{const t=document.querySelector('#board .tile.source')||document.querySelector('#board .tile');const e=new MouseEvent('contextmenu',{bubbles:true,cancelable:true});t.dispatchEvent(e);
   const cs=getComputedStyle(document.body);return {prevented:e.defaultPrevented,select:cs.userSelect||cs.webkitUserSelect};});
  assert.ok(cm.prevented,'contextmenu prevented');assert.equal(cm.select,'none');
  assert.deepEqual(await gameKeys(page),[]);assert.deepEqual(log.errors,[]);assert.deepEqual(log.failed,[]);
  await page.screenshot({path:path.join(OUT,`${ENGINE}-B-after-build.png`)});
  await ctx.close();
 });

 const rewarded=async(mode,expect)=>{
  const {ctx,page,log}=await open({cfg:{rewardMode:mode},seed:camp()});
  await continueCamp(page);
  const btn=page.locator('#adEnergyButton:not([hidden])');await btn.waitFor({timeout:8000});
  const label=(await btn.innerText()).replace(/\s+/g,' ').trim();assert.match(label,/Ad \+25/,'the button says ad and +25: '+label);
  const e0=await page.evaluate(()=>JSON.parse(window.VWKV.getItem('vaultwake-v5-coast')).energy);
  await tapAt(page,btn);await delay(1600);await settle(page);
  const e1=await page.evaluate(()=>JSON.parse(window.VWKV.getItem('vaultwake-v5-coast')).energy);
  const shown=await calls(page,'showRewarded');assert.equal(shown.length,1);assert.equal(shown[0].d,'energy');
  const msg=await page.locator('#message').innerText();
  expect(e0,e1,msg);
  assert.ok(!(await pgPlatform(page)).muted,'sound back after the ad');
  // The board still answers: a generator tap.
  assert.deepEqual(await gameKeys(page),[]);assert.deepEqual(log.errors,[]);
  await ctx.close();return {e0,e1,msg};
 };
 await run('C','rewarded ad watched to the end: +25 energy',async()=>{const r=await rewarded('success',(a,b)=>assert.equal(b,a+25,`energy ${a} → ${b}`));console.log(`   C: energy ${r.e0} → ${r.e1}; "${r.msg}"`);});
 await run('D','rewarded ad closed early: no reward',async()=>{const r=await rewarded('cancel',(a,b,m)=>{assert.equal(b,a);assert.match(m,/no reward/i);});console.log(`   D: energy ${r.e0} → ${r.e1}; "${r.msg}"`);});
 await run('E','rewarded ad fails: no reward, game goes on',async()=>{const r=await rewarded('fail',(a,b,m)=>{assert.equal(b,a);assert.match(m,/no reward/i);});console.log(`   E: energy ${r.e0} → ${r.e1}; "${r.msg}"`);});

 await run('F','rewarded not supported: no rewarded button or offer anywhere',async()=>{
  const {ctx,page,log}=await open({cfg:{rewarded:false},seed:camp()});
  await continueCamp(page);await delay(800);
  assert.equal(await page.locator('#adEnergyButton:not([hidden])').count(),0);
  await tapAt(page,page.locator('#shopButton'));await page.waitForSelector('#shop[open]');
  assert.equal(await page.locator('#shop [data-ad]').count(),0,'no ad offers in the shop');
  assert.doesNotMatch(await page.locator('#shopContent').innerText(),/short ad/i);
  const help=await page.evaluate(()=>[...document.querySelectorAll('#help .adsOnly')].every(e=>getComputedStyle(e).display==='none'));assert.ok(help,'help text ad lines hidden');
  assert.deepEqual(log.errors,[]);await ctx.close();
 });

 await run('G','platform audio off at start, on, pause',async()=>{
  const {ctx,page,log}=await open({cfg:{audio:false},seed:camp()});
  await continueCamp(page);
  assert.equal((await pgPlatform(page)).muted,true,'muted at start when isAudioEnabled is false');
  await page.evaluate(()=>window.__pg.setAudio(true));await delay(100);assert.equal((await pgPlatform(page)).muted,false);
  await page.evaluate(()=>window.__pg.emit('pause_state_changed',true));await delay(100);
  let p=await pgPlatform(page);assert.ok(p.muted&&p.paused,'paused');
  assert.ok((await calls(page,'storage.flush')).length>=1,'progress flushed on pause');
  await page.evaluate(()=>window.__pg.emit('pause_state_changed',false));await delay(100);p=await pgPlatform(page);assert.ok(!p.muted&&!p.paused);
  // The player's own Sound setting goes through the Bridge too.
  await page.evaluate(()=>document.querySelector('#soundButton').click());await delay(2600);
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('__pgStub'))['vaultwake-sound']);assert.equal(saved,'off');
  assert.deepEqual(await gameKeys(page),[]);assert.deepEqual(log.errors,[]);await ctx.close();
 });

 for(const [id,name,o] of [['H','Bridge initialize() fails',{cfg:{init:'fail'}}],['I','Bridge script missing (404)',{bridge:'missing'}]])
  await run(id,name+': the game still starts, plays and saves in this browser',async()=>{
   const {ctx,page,log}=await open(o);
   await page.waitForSelector('#board .tile',{timeout:30000});
   const st=await page.evaluate(()=>({ok:window.VWBridge.ok,reason:window.VWBridge.reason,kind:window.VWKV.kind}));
   assert.equal(st.ok,false);assert.equal(st.kind,'local');
   const g=await page.evaluate(()=>window.VWGuide?.step?.target);if(g?.kind==='cell'){await tapAt(page,page.locator(`#board [data-index="${g.index}"]`));await delay(800);}
   const saved=await page.evaluate(()=>!!localStorage.getItem('vaultwake-v5-coast'));assert.ok(saved,'saved in this browser');
   assert.deepEqual(log.errors,[]);console.log(`   ${id}: ${st.reason}`);await ctx.close();
  });

 await run('J','Bridge storage cannot be read: playable, nothing written, the menu says so',async()=>{
  const {ctx,page,log}=await open({cfg:{read:'fail'}});
  await page.waitForSelector('#board .tile',{timeout:30000});
  const g=await page.evaluate(()=>window.VWGuide?.step?.target);if(g?.kind==='cell'){await tapAt(page,page.locator(`#board [data-index="${g.index}"]`));await delay(2800);}
  assert.equal((await calls(page,'storage.set')).length,0,'nothing written over the platform\'s data');
  await page.evaluate(()=>document.querySelector('#menuButton').click());await delay(300);
  assert.match(await page.locator('#saveNote').innerText(),/not being saved/);
  assert.deepEqual(await gameKeys(page),[]);assert.deepEqual(log.errors,[]);await ctx.close();
 });

 await run('K','the real Bridge 2.4.4: starts, plays, keeps progress over a reload',async()=>{
  const {ctx,page,log}=await open({bridge:'real'});
  await page.waitForSelector('#board .tile',{timeout:30000});
  const st=await page.evaluate(()=>({...window.VWBridge,version:window.bridge?.version,platformId:window.bridge?.platform?.id}));
  assert.equal(st.ok,true,'initialised: '+st.reason);
  const g=await page.evaluate(()=>window.VWGuide?.step?.target);if(g?.kind==='cell'){await tapAt(page,page.locator(`#board [data-index="${g.index}"]`));await delay(900);}
  const moves=await page.evaluate(()=>JSON.parse(window.VWKV.getItem('vaultwake-v5-coast')||'{}').moves??0);assert.ok(moves>=1,'a move made');
  await page.evaluate(()=>window.VWKV.flush());await delay(500);
  assert.ok((await pgPlatform(page)).ready,'game_ready sent');
  await page.reload();await page.waitForSelector('#homePlay:not([hidden])',{timeout:30000});
  assert.match(await page.locator('#homePlay').innerText(),/Continue/,'the camp is there after a reload');
  const m2=await page.evaluate(()=>JSON.parse(window.VWKV.getItem('vaultwake-v5-coast')||'{}').moves??0);assert.equal(m2,moves);
  assert.deepEqual(log.errors,[]);assert.deepEqual(log.failed,[]);
  console.log(`   K: Bridge ${st.version}, platform ${st.platformId}, storage ${st.storage}, init ${st.initMs} ms, outside requests: ${[...log.outside].join(' ')||'none'}; localStorage keys: ${(await page.evaluate(()=>Object.keys(localStorage))).join(' ')}`);
  await ctx.close();
 });

 await run('M','audio files: nothing before the first tap; 16 effects decoded; music follows pause, platform audio and the Sound setting',async()=>{
  const {ctx,page,log}=await open({seed:camp()});
  await page.waitForSelector('#homePlay:not([hidden])',{timeout:30000});await delay(800);
  assert.equal(log.requests.filter(r=>r.path.includes('/assets/audio/')).length,0,'no audio fetched before the first tap');
  await continueCamp(page);
  await page.waitForFunction(async()=>{const {sfx}=await import('/next/sfx.mjs');await sfx.ready();return sfx.state.decoded===sfx.state.files;},null,{timeout:15000});
  const st=()=>page.evaluate(async()=>(await import('/next/sfx.mjs')).sfx.state);
  const played=await page.evaluate(async()=>{const {sfx}=await import('/next/sfx.mjs');return ['merge','produce','deliver','build','reward','tap'].map(k=>sfx.play(k,2));});
  assert.deepEqual(played,[true,true,true,true,true,true],'cues play from the files');
  await delay(900);let s=await st();assert.ok(s.unlocked&&s.wanted,'music wanted after the first tap: '+JSON.stringify(s));
  if(ENGINE==='chromium')assert.ok(s.playing,'music playing (Chromium)');
  await page.evaluate(()=>window.__pg.emit('pause_state_changed',true));await delay(700);s=await st();assert.ok(!s.wanted&&!s.playing,'paused by the platform: '+JSON.stringify(s));
  await page.evaluate(()=>window.__pg.emit('pause_state_changed',false));await delay(700);s=await st();assert.ok(s.wanted,'back after the pause');
  await page.evaluate(()=>window.__pg.setAudio(false));await delay(700);s=await st();assert.ok(!s.wanted&&!s.playing,'silent when the platform turns audio off');
  await page.evaluate(()=>window.__pg.setAudio(true));await delay(700);
  await page.evaluate(()=>document.querySelector('#soundButton').click());await delay(700);s=await st();assert.ok(!s.wanted&&!s.playing,'Sound off stops the music');
  await page.evaluate(()=>document.querySelector('#soundButton').click());await delay(700);s=await st();assert.ok(s.wanted,'Sound on again');
  const audio=log.requests.filter(r=>r.path.includes('/assets/audio/'));
  assert.deepEqual(log.errors,[]);assert.deepEqual(log.failed,[]);
  console.log(`   M: ${audio.length} audio requests after the first tap (${[...new Set(audio.map(r=>r.path.split('/').pop()))].length} files), music playing: ${s.playing}`);
  await ctx.close();
 });

 const SIZES=[[360,640,true],[390,844,true],[430,932,true],[844,390,true],[1280,720,false],[907,510,false],[800,800,false],[600,600,false]];
 await run('L','screen sizes incl. square: no page scroll, board inside the window',async()=>{
  const rows=[];
  for(const [w,h,mobile] of SIZES){
   const {ctx,page,log}=await open({seed:camp(),viewport:{width:w,height:h},mobile});
   await continueCamp(page);await delay(400);
   const m=await page.evaluate(()=>{const d=document.documentElement,r=q=>{const e=document.querySelector(q);if(!e||e.hidden||!e.offsetWidth)return null;const x=e.getBoundingClientRect();return [Math.round(x.left),Math.round(x.top),Math.round(x.right),Math.round(x.bottom)];};
    scrollTo(0,5000);const sy=scrollY;scrollTo(0,0);
    return {sy,sw:d.scrollWidth,iw:innerWidth,ih:innerHeight,fit:+getComputedStyle(d).getPropertyValue('--pgFit')||1,board:r('#board'),dock:r('nav.dock'),sound:r('#soundButton'),header:r('header')};});
   await page.screenshot({path:path.join(OUT,`${ENGINE}-L-${w}x${h}.png`)});
   rows.push(`${w}x${h}: scale ${m.fit.toFixed(2)}, board ${m.board.join(',')}, dock ${m.dock}, sound ${m.sound}`);
   assert.equal(m.sy,0,`${w}x${h}: the browser page scrolls`);assert.ok(m.sw<=m.iw+1,`${w}x${h}: horizontal page scroll (${m.sw} > ${m.iw})`);
   for(const [n,x] of [['board',m.board],['dock',m.dock],['sound',m.sound],['header',m.header]])assert.ok(x&&x[0]>=-1&&x[1]>=-1&&x[2]<=m.iw+1&&x[3]<=m.ih+1,`${w}x${h}: ${n} not fully inside the window: ${x}`);
   assert.deepEqual(log.errors,[]);await ctx.close();
  }
  console.log('   L: '+rows.join('; '));
 });

 await browser.close();
 fs.writeFileSync(path.join(OUT,`${ENGINE}-results.json`),JSON.stringify(results,null,1));
 const bad=results.filter(r=>!r.ok);console.log(`${ENGINE}: ${results.length-bad.length}/${results.length} passed`);process.exit(bad.length?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
