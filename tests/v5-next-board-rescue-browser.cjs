// Board Full Rescue (docs/V5_BOARD_FULL_RESCUE_2026-11-17.md), real UI and real input, a progressed camp (the first
// tutorial is over) whose board is full. Each case does exactly what the guide highlights and checks that a space
// really opens:
//  A. a ready order: the first full board guides on its own (once): the order's Deliver in the spotlight with its cue;
//     tapping Deliver frees space, the guide goes, and its seen flag (tip-rescue) is kept (a reload does not repeat it);
//  B. a valid merge: no guide on its own (already seen); the Hint shows the pair (spotlight); the drag frees a space;
//  C. a free shed space: the Hint points at the part (a crate), then at the selected part's Shed button; storing frees
//     a space; the stored crate's tag stays a small dot (the Shed overlay hotfix);
//  D. the shed full: the part to Clear, then Clear, then "Tap Clear again" (the first tap clears nothing); the second
//     tap clears it and frees a space;
//  E. rewards waiting: the merge frees a space and a waiting reward lands in it; the guide then moves on by itself;
//  F. nothing can free a space: the line explains, nothing is highlighted;
//  H. an existing save that had the old generic note (seen tip-shed, not tip-rescue): when play fills the board, the
//     rescue shows on its own once (seen tip-rescue), not on the next full board nor after a reload; the Hint still works;
//  G. reload and Hint: after a reload nothing guides on its own; the Hint shows the same step again (in case B);
//  and the board never moves when the rescue shows (case B).
// Everywhere: no page errors, nothing duplicated or lost (board + shed + waiting rewards, minus what the action spends).
// ENGINES (default chromium,webkit), VIEWPORTS (default 390x664,375x667: iPhone screens with Safari's bars).
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const {chromium,webkit}=require('playwright');
const ORIGIN=process.env.ORIGIN||'http://127.0.0.1:8080',KEY='vaultwake-v5-coast';
const VIEWPORTS=(process.env.VIEWPORTS||'390x664,375x667').split(',').map(s=>s.split('x').map(Number));
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const base=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures','coast','coast-ch1-pre-secondary.json'),'utf8'));
const it=(family,tier)=>({type:'item',family,tier}),G={type:'glass',family:'rope',tier:1};
// the camp: its generators stay, every other space is tideglass (it never moves), then the case's own things; its orders
// (the fixture's) want chart Lv2-4 and rig Lv2/Lv4 parts, none of which is on the board unless a case puts it there
function camp(things,{shed=[null,null,null,null],pending=[],seen={},free=0,energy=null}={}){
 const s=structuredClone(base);s.pending=pending;if(energy!=null)s.energy=energy;s.shed=shed;s.secOpen={rig:true,chart:true};s.daily={day:9e6,count:1};
 s.seen={'tip-ice':true,'tip-genmerge':true,'extras-rig':true,'extras-chart':true,...seen};
 const open=[];s.board=s.board.map((x,i)=>{if(x?.type==='source')return x;open.push(i);return G;});
 // the case's things go in the bottom rows (on screen with the selection panel), next to each other
 things.forEach((x,k)=>{s.board[open[open.length-1-k]]=x;});
 // free: that many spaces left open (just before the case's things)
 for(let k=0;k<free;k++)s.board[open[open.length-1-things.length-k]]=null;return s;}
const CASES={
 A:camp([it('chart',1),it('rig',1)]),                                   // Neri's/Bram's order o13 (chart Lv2 + rig Lv2) is ready
 B:camp([it('rope',2),it('rope',2)],{seen:{'tip-shed':true,'tip-rescue':true}}),
 C:camp([{type:'kit',family:'rig',size:1,left:3}],{seen:{'tip-shed':true,'tip-rescue':true}}),
 D:camp([it('rope',0)],{shed:[it('lamp',0),it('lamp',1),it('lamp',2),it('lamp',3)],seen:{'tip-shed':true,'tip-rescue':true}}),
 E:camp([it('rope',2),it('rope',2)],{pending:[{type:'kit',family:'chart',size:1,left:3}],seen:{'tip-shed':true,'tip-rescue':true}}),
 F:camp([],{shed:[it('lamp',0),it('lamp',1),it('lamp',2),it('lamp',3)],seen:{'tip-shed':true,'tip-rescue':true}}),
 // an existing save that already had the old generic "The board is full" note (tip-shed) but never the rescue; one space
 // still free, energy to tap
 H:camp([it('rope',2),it('rope',2)],{seen:{'tip-shed':true},free:1,energy:6}),
};
(async()=>{for(const engine of (process.env.ENGINES||'chromium,webkit').split(','))for(const [W,H] of VIEWPORTS){
 // a fresh browser per size: WebKit's page process in CI is known to drop late in one long-lived browser
 let browser;try{browser=await {chromium,webkit}[engine].launch();}catch(e){if(engine!=='chromium'&&/Executable doesn't exist/.test(e.message)){console.log(`${engine}: not installed here, skipped`);break;}throw e;}
 try{const tag=s=>`${engine} ${W}×${H}: ${s}`;
  for(const [name,seed] of Object.entries(CASES)){if(process.env.CASES&&!process.env.CASES.includes(name))continue;const T=s=>tag(`${name}. ${s}`);
   const ctx=await browser.newContext({viewport:{width:W,height:H},isMobile:engine==='chromium',hasTouch:true}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(([k,v])=>{if(!sessionStorage.seeded){localStorage.setItem(k,v);localStorage.setItem('vaultwake-v5-coast-story','{"intro":"skip"}');sessionStorage.seeded='1';}},[KEY,JSON.stringify(seed)]);
   const shut=async()=>{for(const d of ['#daily','#levelUp'])if(await page.locator(d+'[open]').count()){await page.locator(d+' .close').first().click().catch(()=>{});await delay(300);}
    if(await page.locator('#beat[open]').count()){await page.locator('#beatNext').click().catch(()=>{});await delay(300);}};
   const toBoard=async()=>{await page.waitForSelector('#board .tile');await delay(900);for(let k=0;k<8;k++){await shut();
    if(await page.evaluate(()=>!document.querySelector('#home')?.hidden&&!document.querySelector('#homePlay')?.hidden)){await page.locator('#homePlay').click();await delay(700);continue;}break;}await delay(700);await shut();};
   const tapAt=async l=>{await l.scrollIntoViewIfNeeded();const b=await l.boundingBox();await page.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);await delay(450);await shut();};
   const cell=i=>page.locator(`#board [data-index="${i}"]`);
   const drag=async(a,b)=>{const x=await cell(a).boundingBox(),y=await cell(b).boundingBox();await page.mouse.move(x.x+x.width/2,x.y+x.height/2);await page.mouse.down();
    for(let k=1;k<=10;k++){await page.mouse.move(x.x+x.width/2+(y.x-x.x)*k/10,x.y+x.height/2+(y.y-x.y)*k/10);await delay(20);}await page.mouse.up();await delay(600);await shut();};
   const look=()=>page.evaluate(k=>{const st=window.VWGuide?.step,s=JSON.parse(localStorage.getItem(k)),cue=document.querySelector('#spotCue:not([hidden])');
    // the highlighted thing is on screen (its centre inside the viewport)
    const t=document.querySelector('.coachTarget,.coachFrom'),r=t?.getBoundingClientRect(),onScreen=!!r&&r.width>0&&r.left+r.width/2>=0&&r.left+r.width/2<=innerWidth&&r.top+r.height/2>=0&&r.top+r.height/2<=innerHeight;
    return {st:st&&{via:st.via??null,rescue:!!st.rescue,kind:st.kind,level:st.level,what:st.what,why:st.why,target:st.target},spot:document.body.dataset.spot??null,cue:cue?cue.innerText.replace(/\s+/g,' '):null,onScreen,
     free:s.board.filter(x=>x===null).length,pending:s.pending.length,shed:s.shed.filter(Boolean).length,things:[...s.board,...s.shed,...s.pending].filter(Boolean).length,seen:!!s.seen['tip-rescue'],
     line:document.querySelector('#hint')?.innerText.replace(/\s+/g,' ')??'',bigTags:[...document.querySelectorAll('.kitTag')].filter(e=>{const b=e.getBoundingClientRect();return b.width>24||b.height>24;}).length};},KEY);
   const guided=(v,via,spot,what)=>{assert.equal(v.st?.via,via,T(`the rescue says "${via}" (${JSON.stringify(v.st)})`));assert.equal(v.st.level,'full',T('in full'));
    assert.equal(v.spot,spot,T(`the spotlight on the ${spot}`));if(what)assert.equal(v.st.what,what,T(`"${what}"`));if(spot)assert.ok(v.onScreen,T('the highlighted target is on screen'));};
   const gone=v=>{assert.ok(!v.st?.rescue,T(`the rescue goes once a space is free (${JSON.stringify(v.st)})`));assert.equal(v.spot,null,T('no spotlight left'));};
   const hint=async()=>{await tapAt(page.locator('#guideHint'));await delay(300);};
   await page.goto(ORIGIN+'/v5/play.html');await toBoard();
   let v=await look();assert.equal(v.free,name==='H'?1:0,T(name==='H'?'one space free':'the board starts full'));const n0=v.things;
   if(name==='A'){
    guided(v,'deliver','order','Tap Deliver');assert.match(v.cue??'',/Tap Deliver.*Frees 2 spaces/,T(`the cue at Deliver (${v.cue})`));assert.ok(v.seen,T('the first full board is marked as shown (tip-rescue)'));
    await tapAt(page.locator(`#requests [data-order="${v.st.target.id}"] .reqDeliver`));await delay(900);v=await look();
    assert.ok(v.free>=2,T(`Deliver freed 2 spaces (${v.free} free)`));gone(v);assert.equal(v.things,n0-2,T('the two parts went to the order'));
    await page.reload();await toBoard();v=await look();assert.ok(!v.st?.rescue&&!v.spot,T('a reload does not guide again'));}
   if(name==='B'||name==='G'){
    assert.ok(!v.st?.rescue&&v.spot===null,T(`nothing guides on its own once the first full board was shown (${JSON.stringify(v.st)})`));assert.notEqual(v.line,'',T('the usual line'));
    const top=()=>page.evaluate(()=>{const r=document.querySelector('#board').getBoundingClientRect();return Math.round(r.top+scrollY);});const top0=await top();
    await hint();v=await look();guided(v,'merge','pair');assert.match(v.st.what,/onto its twin/,T(v.st.what));
    assert.equal(await top(),top0,T('showing the rescue does not move the board'));
    // G: a reload, then the Hint again shows the same step
    await page.reload();await toBoard();let w=await look();assert.ok(!w.st?.rescue&&w.spot===null,T('after a reload nothing guides on its own'));
    await hint();w=await look();assert.deepEqual(w.st.target,v.st.target,T('the Hint shows the same step after a reload'));
    await drag(...v.st.target.cells);v=await look();assert.equal(v.free,1,T('the merge freed a space'));gone(v);assert.equal(v.things,n0-1,T('two parts made one'));}
   if(name==='C'){
    await hint();v=await look();guided(v,'shed','cell',undefined);assert.match(v.st.what,/^Tap the Driftwood crate$/,T(v.st.what));
    await tapAt(cell(v.st.target.index));v=await look();guided(v,'shed','action','Tap Shed');assert.match(v.cue??'',/Tap Shed/,T(`the cue at Shed (${v.cue})`));
    await tapAt(page.locator('#selection [data-action="store"]'));await delay(500);v=await look();
    assert.equal(v.free,1,T('storing freed a space'));assert.equal(v.shed,1,T('the crate is in the shed'));gone(v);assert.equal(v.things,n0,T('nothing lost'));assert.equal(v.bigTags,0,T('the stored crate\'s tag is a small dot'));}
   if(name==='D'){
    await hint();v=await look();guided(v,'clear','cell');assert.match(v.st.why,/shed is full/i,T(v.st.why));
    await tapAt(cell(v.st.target.index));v=await look();guided(v,'clear','action','Tap Clear');
    await tapAt(page.locator('#selection [data-action="recycle"]'));v=await look();assert.equal(v.free,0,T('the first tap clears nothing'));guided(v,'clear','action','Tap Clear again');
    await tapAt(page.locator('#selection [data-action="recycle"]'));await delay(400);v=await look();assert.equal(v.free,1,T('the confirmed Clear freed a space'));gone(v);assert.equal(v.things,n0-1,T('only that part went'));}
   if(name==='E'){
    assert.equal(v.pending,1,T('a reward waits'));await hint();v=await look();guided(v,'merge','pair');
    await drag(...v.st.target.cells);v=await look();assert.equal(v.pending,0,T('the waiting reward landed in the freed space'));assert.equal(v.things,n0-1,T('nothing lost'));
    // the board is full again (the reward took the space): the guide moves on to the next way to free one
    if(v.free===0){assert.ok(v.st?.rescue,T('still full: the guide moves on'));assert.notEqual(v.st.via,'merge',T(`a new step (${v.st.via})`));}}
   if(name==='F'){
    await hint();v=await look();assert.equal(v.st?.via,'none',T('nothing frees a space'));assert.equal(v.spot,null,T('nothing highlighted'));assert.equal(v.st.target,null,T('no target'));
    assert.match(v.line,/The board is full/,T(`the line says so (${v.line})`));assert.match(await page.locator('#message').innerText(),/deliver an order when its parts are ready/i,T('and why'));}
   if(name==='H'){
    const seen=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)).seen,KEY);
    assert.ok(!v.st?.rescue&&v.spot===null,T('a free space: no rescue'));assert.equal((await seen())['tip-rescue'],undefined,T('the rescue not yet seen'));
    // a tap on the generator fills the last space: the board becomes full, and the rescue shows on its own, once
    const gen=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).board.findIndex(x=>x?.type==='source'&&x.id==='rig'),KEY);
    await tapAt(cell(gen));await delay(500);v=await look();assert.equal(v.free,0,T('the tap filled the board'));
    guided(v,'merge','pair');let f=await seen();assert.equal(f['tip-rescue'],true,T('the rescue is marked as shown'));assert.equal(f['tip-shed'],true,T('the old flag stays'));
    await drag(...v.st.target.cells);v=await look();assert.equal(v.free,1,T('the merge freed a space'));gone(v);
    // full again: not on its own a second time
    await tapAt(cell(gen));await delay(500);v=await look();assert.equal(v.free,0,T('full again'));assert.ok(!v.st?.rescue&&v.spot===null,T(`not shown on its own a second time (${JSON.stringify(v.st)})`));
    // nor after a reload; the Hint still shows it
    await page.reload();await toBoard();v=await look();assert.ok(!v.st?.rescue&&v.spot===null,T('not after a reload'));
    await hint();v=await look();assert.ok(v.st?.rescue&&v.st.level==='full'&&v.spot,T(`the Hint still shows it (${JSON.stringify(v.st)})`));}
   assert.deepEqual(errors,[],T('no page errors'));await ctx.close();}
  console.log(`ok ${tag('board full rescue: deliver (auto once), merge (Hint), shed, confirmed Clear, rewards waiting, nothing to do, reload, an old save with tip-shed gets it once')}`);
 }finally{await browser.close();}}
 console.log('board full rescue browser tests passed');
})().catch(e=>{console.error(e);process.exit(1);});
