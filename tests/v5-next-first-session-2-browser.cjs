// First Session 2.0 in the real game (v5/play.html, v5/coast-crazygames.html), 2026-11-13. Real finger input
// (taps on the touchscreen, drags with the pointer), Chromium and WebKit.
//  1. A genuinely new player (no save): the playable board opens by itself (no Home press, no story pages; one
//     story caption line instead), nothing is saved until the first action, and the Adaptive tutorial guides
//     one action at a time: what + why on the line, gold on the next action, green on the matching pair, a
//     hand only while a skill is new. A player who does what it shows reaches the first restoration (act()
//     results: the landing path built, 40 coins). At every step the highlighted target is exactly the step's
//     target and its action is accepted by act() on a copy of the camp; no buried crate is ever highlighted.
//     Guidance fades (quiet steps show no highlight and no hand); one idle reminder after ~8 s, never a second
//     for the same step, and the camp is unchanged (the guide never acts); Hint raises one step to full.
//     A reload opens Home with Continue (never a new camp) and resumes the same camp and the same step.
//  2. Existing saves: a camp from before the guide, a camp with the guide skipped, and a camp half way through
//     it each open Home with Continue (never auto-entered), keep their save byte for byte until the player acts,
//     and get no restarted tutorial (the half-way camp resumes its own step).
//  3. CrazyGames (the SDK stand-in with a Data module): a guest whose cloud holds a camp gets Continue and the
//     cloud is not written over; a guest with an empty cloud goes to the board and nothing is written until the
//     first tap, then the cloud has the camp; on a CrazyGames host whose SDK fails to initialise (its cloud
//     could not be read) Home stays with Play: nothing is decided for that player.
//  4. Reduced motion: the same guidance, the hand still. No sideways scroll; no page error.
// SIZES (default 360x640,390x664,390x844,430x932,1280x720) and ENGINES (chromium,webkit).
// Screenshots: test-artifacts/v5/first-session-2/<engine>-<w>x<h>-<step>.png
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const {chromium,webkit}=require('playwright');
const ORIGIN='http://127.0.0.1:8080',PLAY=ORIGIN+'/v5/play.html',CG=ORIGIN+'/v5/coast-crazygames.html',KEY='vaultwake-v5-coast';
const OUT=path.join(__dirname,'..','test-artifacts','v5','first-session-2');fs.mkdirSync(OUT,{recursive:true});
const SIZES=(process.env.SIZES||'360x640,390x664,390x844,430x932,1280x720').split(',').map(s=>s.split('x').map(Number));
const fixture=n=>fs.readFileSync(path.join(__dirname,'fixtures','coast',n),'utf8');
// what the page highlights, and whether the step's action is accepted on a copy of the real camp
const look=page=>page.evaluate(async()=>{
 const g=await import(new URL('next/game.mjs',document.baseURI).href),st=VWGuide.step,raw=localStorage.getItem('vaultwake-v5-coast');
 const cells=c=>[...document.querySelectorAll('#board .tile.'+c)].map(e=>+e.dataset.index).sort((a,b)=>a-b);
 const other=[...document.querySelectorAll('.coachTarget:not(.tile)')].map(e=>e.dataset.order?'order:'+e.dataset.order:e.id||e.dataset.restore&&'restore:'+e.dataset.restore||e.className);
 const hand=document.querySelector('#coachHand'),hr=hand&&!hand.hidden?hand.getBoundingClientRect():null;
 // the camp as the app holds it: the board's own state is only in the module; the save mirrors it after each action
 return {st,gold:cells('coachTarget').filter(i=>!cells('coachPair').includes(i)),pair:cells('coachPair'),other,hand:!!hr,handAt:hr&&{x:hr.x,y:hr.y},
  line:document.querySelector('#hint').innerText,level:document.querySelector('#hint').dataset.level??null,saved:!!raw,moves:raw?JSON.parse(raw).moves:0,
  hints:VWGuide.hints,reminders:VWGuide.reminders,sideways:document.scrollingElement.scrollWidth>innerWidth+1,
  buried:[...cells('coachTarget'),...cells('coachPair')].filter(i=>document.querySelector(`#board [data-index="${i}"]`).classList.contains('deep'))};});
function expectMarks(m,tag){
 const t=m.st.level==='quiet'?null:m.st.target;
 assert.deepEqual(m.gold,t?.kind==='cell'?[t.index]:[],tag+': gold cell = the target');
 assert.deepEqual(m.pair,t?.kind==='pair'?[...t.cells].sort((a,b)=>a-b):[],tag+': green pair = the two matching items');
 const want=t?.kind==='order'?['order:'+t.id]:t?.kind==='strip'?['mapButton']:[];assert.deepEqual(m.other.filter(x=>!/coinPill/.test(x)),want,tag+': gold control = the target');
 assert.deepEqual(m.buried,[],tag+': no buried crate highlighted');
 // the hand: never on a light or quiet step; on a full one it shows a few times, then rests (the highlight stays)
 if(m.st.level!=='full'||!t)assert.equal(m.hand,false,tag+`: no hand on a ${m.st.level} step`);
 assert.ok(m.line.startsWith(m.st.what),tag+': the instruction is on the line');
}
const validOnCopy=page=>page.evaluate(async()=>{const st=VWGuide.step;if(!st?.action)return null;const g=await import(new URL('next/game.mjs',document.baseURI).href);
 const raw=localStorage.getItem('vaultwake-v5-coast');if(!raw)return 'unsaved';return g.act(g.load(raw),st.action,Date.now()).ok;});
async function settle(page){await page.waitForFunction(()=>!!window.VWGuide,null,{timeout:8000});await page.waitForFunction(()=>!document.querySelector('.deliveryPart,.coinFlight,.flight'),null,{timeout:6000}).catch(()=>{});await page.waitForTimeout(250);
 for(let k=0;k<12;k++){if(await page.locator('#beat[open]').count()){await page.locator('#beatNext').click();await page.waitForTimeout(200);continue;}break;}}
const center=(page,sel)=>page.evaluate(sel=>{const e=document.querySelector(sel);if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,w:r.width,h:r.height};},sel);
async function drag(page,a,b){const p=await center(page,`#board [data-index="${a}"]`),q=await center(page,`#board [data-index="${b}"]`);
 await page.mouse.move(p.x,p.y);await page.mouse.down();for(let k=1;k<=10;k++){await page.mouse.move(p.x+(q.x-p.x)*k/10,p.y+(q.y-p.y)*k/10);await page.waitForTimeout(16);}await page.mouse.up();}
async function newContext(browser,engine,W,H,opts={}){
 const context=await browser.newContext({viewport:{width:W,height:H},isMobile:engine==='chromium'&&W<700,hasTouch:true,...opts});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e?.message??e)));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(m.text());});
 await context.route(u=>!u.href.startsWith(ORIGIN)&&!u.href.startsWith('http://qa.crazygames.com/'),r=>r.abort());
 // every #story scene shown is noted (a new player must never get the three pages)
 await page.addInitScript(()=>{addEventListener('DOMContentLoaded',()=>{const s=document.querySelector('#story');if(!s)return;new MutationObserver(()=>{if(!s.hidden)sessionStorage.setItem('storyShown','1');}).observe(s,{attributes:true});});});
 return {context,page,errors};
}
const cgStub=(cloud,o={})=>`(()=>{const m=new Map(${JSON.stringify([...cloud])});window.__writes=[];
 window.CrazyGames={SDK:{environment:'crazygames',init:async()=>{${o.initFails?'throw new Error("init failed")':''}},
  game:{loadingStart(){},loadingStop(){},gameplayStart(){},gameplayStop(){},happytime(){},settings:{muteAudio:false},addSettingsChangeListener(){}},
  ad:{requestAd(t,cb){cb.adError&&cb.adError()}},user:{getUser:async()=>null,addAuthListener(){},isUserAccountAvailable:true},
  data:{getItem(k){return m.has(k)?m.get(k):null;},setItem(k,v){m.set(k,String(v));window.__writes.push(k);(window.__vals??=[]).push([k,String(v)]);},getAll(){return Object.fromEntries(m);},removeItem(k){m.delete(k);},clear(){m.clear();}}}};})();`;
(async()=>{
 const engines=(process.env.ENGINES||'chromium,webkit').split(',').map(e=>[e,{chromium,webkit}[e]]);
 for(const [engine,type] of engines){
  let browser;try{browser=await type.launch();}catch(e){if(engine!=='chromium'&&/Executable doesn't exist/.test(e.message)){console.log(`${engine}: not installed here, skipped`);continue;}throw e;}
  try{
   // ---------- 1. a new player, guided to the first restoration ----------
   for(const [W,H] of SIZES){
    const tag=s=>`${engine} ${W}×${H}: ${s}`,{context,page,errors}=await newContext(browser,engine,W,H);
    const shot=n=>page.screenshot({path:path.join(OUT,`${engine}-${W}x${H}-${n}.png`)});
    await page.goto(PLAY);await page.waitForFunction(()=>document.querySelector('#home').hidden,null,{timeout:30000});await page.waitForTimeout(600);
    let m=await look(page);
    assert.equal(await page.evaluate(()=>sessionStorage.getItem('storyShown')),null,tag('no story pages for a new player'));
    assert.equal(await page.evaluate(()=>!document.querySelector('#storyRibbon')?.hidden),true,tag('one story caption line instead'));
    assert.equal(m.saved,false,tag('nothing saved before the first action'));
    assert.equal(m.st.kind,'tap');assert.equal(m.st.level,'full');assert.equal(m.st.what,'Tap the Rivet Rover');expectMarks(m,tag('start'));assert.ok(m.hand,tag('the hand on the Rover'));
    const hb=await center(page,'#guideHint');assert.ok(hb.w>=44&&hb.h>=44,tag(`Hint ${hb.w}×${hb.h}`));
    assert.equal(m.sideways,false,tag('no sideways scroll'));await shot('1-start');
    let idled=false,hinted=false,quiet=0,steps=0,built=false;
    for(let n=0;n<160&&!built;n++){
     // the guide's short notes (the first crew order's coins) take the line for a few seconds
     await settle(page);await page.waitForFunction(()=>!!VWGuide.step,null,{timeout:8000});m=await look(page);const st=m.st;steps++;
     expectMarks(m,tag(`step ${n} ${st.kind}/${st.level}`));
     const ok=await validOnCopy(page);if(st.action&&ok!=='unsaved')assert.equal(ok,true,tag(`step ${n}: act() accepts ${JSON.stringify(st.action)}`));
     if(st.level==='quiet')quiet++;
     if(!idled&&st.level==='quiet'&&st.kind==='tap'){idled=true;const before=m.moves;
      await page.waitForTimeout(8700);let r=await look(page);assert.equal(r.reminders,1,tag('one reminder after ~8 s idle'));assert.equal(r.st.level,'full');assert.ok(r.hand,tag('the reminder shows the hand'));await shot('2-idle-reminder');
      await page.waitForTimeout(9000);r=await look(page);assert.equal(r.reminders,1,tag('no second reminder for the same step'));assert.equal(r.moves,before,tag('the guide never acts'));continue;}
     if(idled&&!hinted&&st.level==='quiet'&&st.kind==='merge'){hinted=true;await page.touchscreen.tap(hb.x,hb.y);await page.waitForTimeout(400);
      const r=await look(page);assert.equal(r.hints,1,tag('Hint counted'));assert.equal(r.st.level,'full',tag('Hint raises the step to full'));expectMarks(r,tag('after Hint'));await shot('3-hint');continue;}
     const t=st.target;assert.ok(t,tag(`step ${n} has a target (${st.kind}: ${st.what} · ${st.why})`));
     if(t.kind==='cell'){const c=await center(page,`#board [data-index="${t.index}"]`);await page.touchscreen.tap(c.x,c.y);await page.waitForTimeout(350);}
     else if(t.kind==='pair'){await drag(page,...t.cells);await page.waitForTimeout(350);}
     else if(t.kind==='order'){if(st.kind==='gold')await shot('4-gold-ready');const c=await center(page,`#requests [data-order="${t.id}"]`);await page.touchscreen.tap(c.x,c.y);await page.waitForTimeout(1500);}
     else if(t.kind==='strip'){await shot('5-build-strip');const c=await center(page,'#mapButton');await page.touchscreen.tap(c.x,c.y);await page.waitForSelector('#coastMap[open]');await page.waitForTimeout(900);
      const g=await page.evaluate(()=>VWGuide.step);assert.equal(g.kind,'coastBuild',tag('on the coast the guide points at Build'));
      assert.ok(await page.locator(`#coastMap [data-restore="${g.target.id}"].coachTarget`).count(),tag('Build is the gold target'));await shot('6-coast-build');
      await page.evaluate(id=>document.querySelector(`#coastMap [data-restore="${id}"]`).scrollIntoView({block:'center'}),g.target.id);await page.waitForTimeout(300);
      const b=await center(page,`#coastMap [data-restore="${g.target.id}"]`);assert.ok(b.h>=44,tag('Build ≥ 44 px'));await page.touchscreen.tap(b.x,b.y);
      await page.waitForTimeout(2600);await settle(page);await shot('7-restored');
      if(await page.locator('#coastMap[open]').count())await page.locator('#coastMap>.close').click();await page.waitForTimeout(500);built=true;}
    }
    assert.ok(built,tag('the guided player reached the first build'));assert.ok(idled&&hinted,tag('idle reminder and Hint exercised'));assert.ok(quiet>0,tag('guidance faded to quiet'));
    const camp=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
    assert.equal(camp.built['beach-path'],1,tag('the landing path is built (act)'));assert.equal(camp.coins,40,tag('80 − 40 coins'));
    await settle(page);m=await look(page);assert.ok(m.st&&['tap','merge','unseal','deliver','gold'].includes(m.st.kind),tag('the next objective is guided after the build: '+JSON.stringify(m.st)+' line: '+m.line));assert.notEqual(m.st.level,'quiet',tag('and named'));await shot('8-next-objective');
    // a reload: Home with Continue, the same camp, the same step
    const sig=JSON.stringify([m.st.kind,m.st.target]);
    await page.reload();await page.waitForSelector('#homePlay:not([hidden])',{timeout:30000});
    assert.equal((await page.locator('#homePlay').textContent()).trim(),'Continue',tag('a reload offers Continue, never a new camp'));
    await page.locator('#homePlay').click();await page.waitForSelector('#home',{state:'hidden'});await page.waitForTimeout(500);
    const again=await look(page);assert.equal(JSON.stringify([again.st.kind,again.st.target]),sig,tag('the same step after Continue'));
    assert.equal(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).built['beach-path'],KEY),1,tag('the same camp'));
    assert.deepEqual(errors,[],tag('no page error'));console.log(`ok ${tag(`new player → board → guided first restoration in ${steps} steps; fades; idle once; Hint; reload resumes`)}`);
    await context.close();
   }
   // ---------- 2. existing saves: never a new player, never a restarted tutorial ----------
   const pre=JSON.parse(fixture('coast-ch1-pre-secondary.json'));
   // camps made by the real reducer: one played before the guide existed (no coach flags), one with the guide skipped
   const g=await import(path.join(__dirname,'..','v5','next','game.mjs')),gd=await import(path.join(__dirname,'..','v5','next','guide.mjs'));
   const played=seen=>{const s=g.fresh(Date.now());for(let n=0;n<14;n++){const a=gd.primaryAction(s);const act=a.kind==='tap'?{type:'produce',id:a.id,index:a.index}:a.kind==='merge'||a.kind==='unseal'?{type:'merge',from:a.cells[0],to:a.cells[1]}:a.kind==='deliver'?{type:'deliver',id:a.id}:null;if(!act||!g.act(s,act).ok)break;}s.seen=seen;return s;};
   const cases=[['an old camp (before the guide)',played({}),true],['a camp with the guide skipped',played({'coach-on':true,'coach-done':true}),true],['the chapter-1 fixture (rare extras open on arrival, as before)',pre,false]];
   for(const [name,camp,strict] of cases){
    const {context,page,errors}=await newContext(browser,engine,390,664),tag=s=>`${engine} existing save, ${name}: ${s}`;
    const raw=JSON.stringify({...camp,energyAt:Date.now()});
    await page.addInitScript(([k,v])=>{if(!sessionStorage.seeded){localStorage.setItem(k,v);localStorage.setItem('vaultwake-v5-coast-story','{"intro":"skip"}');sessionStorage.seeded='1';}},[KEY,raw]);
    await page.goto(PLAY);await page.waitForSelector('#homePlay:not([hidden])',{timeout:30000});
    assert.equal((await page.locator('#homePlay').textContent()).trim(),'Continue',tag('Home with Continue'));
    const before=await page.evaluate(k=>localStorage.getItem(k),KEY);
    await page.locator('#homePlay').click();await page.waitForSelector('#home',{state:'hidden'});await page.waitForTimeout(700);
    // what the game's own load() makes of the save (an old save is migrated as it always was) is what is kept
    const [after,loaded]=await page.evaluate(async([k,raw])=>{const g=await import(new URL('next/game.mjs',document.baseURI).href);return [JSON.parse(localStorage.getItem(k)),g.load(raw)];},[KEY,before]),m=await look(page);
    for(const f of strict?['board','orders','built','coins','energy','level','materials','shed','area','seen']:['built','coins','level','materials','area','orders'])assert.deepEqual(after[f],loaded[f],tag(`${f} kept`));
    assert.equal(m.level,null,tag('no tutorial restarted'));assert.equal(m.hand,false,tag('no hand'));
    assert.equal(await page.evaluate(()=>sessionStorage.getItem('storyShown')),null,tag('no story pages'));
    assert.deepEqual(errors,[],tag('no page error'));console.log(`ok ${tag('Continue, camp kept, no tutorial restart')}`);await context.close();
   }
   // a camp half way through the guide (first crew order delivered): resumes its own step
   {const {context,page,errors}=await newContext(browser,engine,390,664),tag=s=>`${engine} half-way tutorial: ${s}`;
    await page.goto(PLAY);await page.waitForFunction(()=>document.querySelector('#home').hidden,null,{timeout:30000});
    // play the guide up to the first crew delivery
    const step=async()=>{await page.waitForFunction(()=>!!VWGuide.step,null,{timeout:8000});return page.evaluate(()=>VWGuide.step);};
    for(let n=0;n<40;n++){await settle(page);if(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)??'{}').ordersDone??0,KEY))break;const st=await step();if(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)??'{}').ordersDone??0,KEY))break;
     if(st.target.kind==='cell'){const c=await center(page,`#board [data-index="${st.target.index}"]`);await page.touchscreen.tap(c.x,c.y);}else if(st.target.kind==='pair')await drag(page,...st.target.cells);else if(st.target.kind==='order'){const c=await center(page,`#requests [data-order="${st.target.id}"]`);await page.touchscreen.tap(c.x,c.y);await page.waitForTimeout(1200);}await page.waitForTimeout(300);}
    await settle(page);await step();const before=await look(page);
    await page.reload();await page.waitForSelector('#homePlay:not([hidden])',{timeout:30000});assert.equal((await page.locator('#homePlay').textContent()).trim(),'Continue',tag('Continue'));
    await page.locator('#homePlay').click();await page.waitForSelector('#home',{state:'hidden'});await page.waitForTimeout(700);await step();const m=await look(page);
    assert.equal(JSON.stringify([m.st.kind,m.st.target]),JSON.stringify([before.st.kind,before.st.target]),tag('the same step after a reload'));assert.ok(m.level,tag('the guide goes on'));assert.ok(m.st.kind!=='tap'||m.st.level!=='full',tag('not the first lesson again'));
    assert.deepEqual(errors,[],tag('no page error'));console.log(`ok ${tag(`resumes at ${m.st.kind}/${m.st.level}`)}`);await context.close();}
   // ---------- 3. CrazyGames: cloud saves decide, never the default camp ----------
   {const cloud=new Map([[KEY,JSON.stringify({...pre,energyAt:Date.now()})]]),{context,page,errors}=await newContext(browser,engine,390,664),tag=s=>`${engine} CrazyGames guest with a cloud camp: ${s}`;
    await context.route('https://sdk.crazygames.com/**',r=>r.fulfill({contentType:'application/javascript',body:cgStub(cloud)}));
    await page.goto(CG);await page.waitForSelector('#homePlay:not([hidden])',{timeout:30000});
    assert.equal((await page.locator('#homePlay').textContent()).trim(),'Continue',tag('Continue (the cloud camp)'));
    // the energy-receipt migration rewrites an old camp at boot (as on 822a8f9); its progress must be the player's own
    {const [now,loaded]=await page.evaluate(async([k,raw])=>{const g=await import(new URL('next/game.mjs',document.baseURI).href);return [JSON.parse(CrazyGames.SDK.data.getItem(k)),g.load(raw)];},[KEY,cloud.get(KEY)]);
     for(const f of ['built','coins','area','level','materials','orders','board'])assert.deepEqual(now[f],loaded[f],tag(`the cloud camp keeps its ${f}`));}
    await page.locator('#homePlay').click();await page.waitForSelector('#home',{state:'hidden'});await page.waitForTimeout(500);
    assert.equal(await page.evaluate(()=>document.querySelector('#hint').dataset.level??null),null,tag('no tutorial for an existing player'));
    assert.deepEqual(errors,[],tag('no page error'));console.log(`ok ${tag('Continue, cloud kept')}`);await context.close();}
   {const cloud=new Map(),{context,page,errors}=await newContext(browser,engine,390,664),tag=s=>`${engine} CrazyGames guest with an empty cloud: ${s}`;
    await context.route('https://sdk.crazygames.com/**',r=>r.fulfill({contentType:'application/javascript',body:cgStub(cloud)}));
    await page.goto(CG);await page.waitForFunction(()=>document.querySelector('#home').hidden,null,{timeout:30000});await page.waitForTimeout(500);
    assert.deepEqual(await page.evaluate(()=>window.__writes.filter(k=>k==='vaultwake-v5-coast')),[],tag('nothing written before the first action'));
    const st=await page.evaluate(()=>VWGuide.step),c=await center(page,`#board [data-index="${st.target.index}"]`);await page.touchscreen.tap(c.x,c.y);await page.waitForTimeout(600);
    assert.ok(await page.evaluate(()=>window.__writes.includes('vaultwake-v5-coast')),tag('the first tap saves the camp to the cloud'));
    assert.deepEqual(errors,[],tag('no page error'));console.log(`ok ${tag('board at once; saved from the first action')}`);await context.close();}
   {const cloud=new Map(),{context,page,errors}=await newContext(browser,engine,390,664),tag=s=>`${engine} CrazyGames host, SDK init fails: ${s}`;
    await context.route('https://sdk.crazygames.com/**',r=>r.fulfill({contentType:'application/javascript',body:cgStub(cloud,{initFails:true})}));
    await context.route('http://qa.crazygames.com/**',async r=>{const u=new URL(r.request().url());r.fulfill({response:await r.fetch({url:ORIGIN+u.pathname+u.search})});});
    await page.goto('http://qa.crazygames.com/v5/coast-crazygames.html');await page.waitForSelector('#homePlay:not([hidden])',{timeout:40000});
    await page.waitForTimeout(1500);assert.equal(await page.evaluate(()=>document.querySelector('#home').hidden),false,tag('Home stays: the cloud could not be read, so this player is not taken for new'));
    assert.equal((await page.locator('#homePlay').textContent()).trim(),'Play',tag('the old Play button'));
    assert.deepEqual(errors.filter(e=>!/init failed/.test(e)),[],tag('no page error'));console.log(`ok ${tag('Home kept with Play')}`);await context.close();}
   // ---------- 4. reduced motion ----------
   {const {context,page,errors}=await newContext(browser,engine,390,844,{reducedMotion:'reduce'}),tag=s=>`${engine} reduced motion: ${s}`;
    await page.goto(PLAY);await page.waitForFunction(()=>document.querySelector('#home').hidden,null,{timeout:30000});await page.waitForTimeout(500);
    const r=await page.evaluate(()=>{const h=document.querySelector('#coachHand svg');return {hand:!document.querySelector('#coachHand').hidden,anim:h?getComputedStyle(h).animationName:'none',kind:VWGuide.step.kind};});
    assert.deepEqual(r,{hand:true,anim:'none',kind:'tap'},tag('the hand is shown, still'));
    assert.deepEqual(errors,[],tag('no page error'));console.log(`ok ${tag('still hand')}`);await context.close();}
  }finally{await browser.close();}
 }
 console.log('first session 2.0 browser tests passed');
})().catch(e=>{console.error(e);process.exit(1);});
