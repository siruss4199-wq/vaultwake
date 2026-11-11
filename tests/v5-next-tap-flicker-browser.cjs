// Owner, real iPhone (2026-11-11, PR #103): "touching controls/board causes the screen to blink as if the page
// refreshed". Root cause (also in the live build e6eddf6): render() rebuilt every board cell, order card, the shed
// and the strip's picture with innerHTML on every tap, so a plain selection recreated ~80 <img> elements and
// restarted the board's running animations; each new image was drawn empty until decoded (3 frames, ~100 ms, in
// a Chromium screencast; longer on iPhone). It was a repaint, not a reload.
// With finger taps at the visible centre of each control, at 390×664 and 360×640, in Chromium and WebKit, for
// each plain tap (an item selected and deselected, an order card, Details open and close, an empty space, the
// generator) this checks:
//  - no reload (the page's boot count and navigation entries are unchanged) and no page error;
//  - no board cell, order card or strip picture whose content did not change gets a new <img>;
//  - no running board animation restarts;
//  - no frame after the tap shows a visible picture that is not drawn yet (sampled on every frame; the panel
//    under the board, which shows the newly tapped thing, and the part flying from a generator are new content);
//  - Chromium only: a frame-by-frame screencast of the board shows no transient frame (each frame is close to
//    the frame before the tap or to the settled one after it); Details is left out: its sheet slides up over
//    the board on purpose.
// The game still plays: the generator makes a part, twins merge by dragging, and a reload keeps it.
// Numbers per tap are printed; frames are saved under test-artifacts/v5/tap-flicker/.
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const {chromium,webkit,firefox}=require('playwright');
const URL=process.env.CG_URL||'http://127.0.0.1:8080/v5/coast-crazygames.html',KEY='vaultwake-v5-coast';
const OUT=path.join(__dirname,'..','test-artifacts','v5','tap-flicker');fs.mkdirSync(OUT,{recursive:true});
const STUB=`window.CrazyGames={SDK:{environment:'crazygames',init:async()=>{},game:{loadingStart(){},loadingStop(){},gameplayStart(){},gameplayStop(){},happytime(){},settings:{muteAudio:false},addSettingsChangeListener(){}},ad:{requestAd(t,c){c.adError&&c.adError()}}}};`;
const camp=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures','coast','coast-ch1-pre-secondary.json'),'utf8'));
camp.daily={day:9e6,count:1};camp.energy=60;camp.energyAt=Date.now();
camp.board[26]={type:'item',family:'rope',tier:0};camp.board[27]={type:'item',family:'rope',tier:0};
const SIZES=(process.env.SIZES||'390x664,360x640').split(',').map(s=>s.split('x').map(Number));
// In the page before anything runs: a boot counter that survives a reload, and a sampler of undrawn pictures.
const INSTR=()=>{sessionStorage.vwBoots=(+sessionStorage.vwBoots||0)+1;
 window.__vwFrames=ms=>new Promise(res=>{const t0=performance.now();let frames=0,blank=0,worst=0;
  const shown=e=>{const r=e.getBoundingClientRect();if(!(r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth))return false;
   for(let n=e;n&&n.nodeType===1;n=n.parentElement){const s=getComputedStyle(n);if(s.display==='none'||s.visibility==='hidden'||+s.opacity===0)return false;}return true;};
  // a picture inside a board cell whose content this tap changed is new content, not a blink
  const fresh=i=>{const t=i.closest('#board [data-index]');return !!t&&!!window.__vwCells&&t.innerHTML!==window.__vwCells[+t.dataset.index];};
  const step=()=>{frames++;const n=[...document.images].filter(i=>!(i.complete&&i.naturalWidth>0)&&!i.closest('#selection,.flight,.dragGhost,.moment')&&!fresh(i)&&shown(i)).length;if(n){blank++;worst=Math.max(worst,n);}
   if(performance.now()-t0<ms)requestAnimationFrame(step);else res({frames,blank,worst});};requestAnimationFrame(step);});};
const settle=async page=>{for(let k=0;k<10;k++){await page.waitForTimeout(150);
 if(await page.locator('#beat[open]').count()){await page.locator('#beatNext').tap().catch(()=>{});continue;}
 for(const d of ['#daily','#endDialog'])if(await page.locator(d+'[open]').count())await page.locator(d+' .close').tap().catch(()=>{});}};
async function finger(page,sel){
 const p=await page.evaluate(sel=>{const e=document.querySelector(sel);if(!e)return null;e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,h=document.elementFromPoint(x,y);return {x,y,ok:!!h&&(e===h||e.contains(h))};},sel);
 assert.ok(p,`${sel} exists`);assert.ok(p.ok,`the finger at the centre of ${sel} lands on it`);await page.touchscreen.tap(p.x,p.y);
}
// Mark every picture and running animation now; afterwards, which pictures under the board, the order cards and
// the strip are new, and which animations are new or restarted.
const mark=page=>page.evaluate(()=>{for(const i of document.querySelectorAll('img'))i.__vwOld=1;window.__vwAnims=new Set(document.getAnimations());
 window.__vwCells=[...document.querySelectorAll('#board [data-index]')].map(t=>t.innerHTML);
 return {boots:+sessionStorage.vwBoots,nav:performance.getEntriesByType('navigation').length,cells:window.__vwCells};});
const measure=(page,before)=>page.evaluate(before=>{const fresh=s=>[...document.querySelectorAll(s)].filter(i=>!i.__vwOld).length;
 const cells=[...document.querySelectorAll('#board [data-index]')];const changed=cells.filter((t,k)=>t.innerHTML!==before.cells[k]).length;
 const boardAnims=document.getAnimations().filter(a=>!window.__vwAnims.has(a)&&a.effect?.target?.closest?.('#board,#requests,#mapButton')&&a.playState==='running');
 return {reload:+sessionStorage.vwBoots!==before.boots||performance.getEntriesByType('navigation').length!==before.nav,
  boardImgs:fresh('#board img'),cellsChanged:changed,orderImgs:fresh('#requests img'),stripImgs:fresh('#mapButton img'),
  restarted:boardAnims.map(a=>a.animationName).filter(n=>!/^(cbPop|unsealed|merge|ashore|locatePulse|coach)/.test(n))};},before);
(async()=>{
 const engines=(process.env.ENGINES||'chromium,webkit').split(',').map(e=>[e,{chromium,webkit,firefox}[e]]);
 for(const [engine,type] of engines){
  let browser;try{browser=await type.launch();}catch(e){if(engine!=='chromium'&&/Executable doesn't exist/.test(e.message)){console.log(`${engine}: not installed here, skipped`);continue;}throw e;}
  try{for(const [W,H] of SIZES){
   const tag=s=>`${engine} ${W}×${H}: ${s}`;
   const context=await browser.newContext({viewport:{width:W,height:H},isMobile:engine==='chromium',hasTouch:true});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e?.message??e)));
   await page.route(u=>!u.href.startsWith('http://127.0.0.1:'),r=>r.abort());
   await page.route('https://sdk.crazygames.com/**',r=>r.fulfill({contentType:'application/javascript',body:STUB}));
   await page.addInitScript(INSTR);
   await page.addInitScript(([k,v])=>{if(!sessionStorage.tfSeeded){localStorage.setItem(k,v);localStorage.setItem('vaultwake-v5-coast-story','{"intro":"skip"}');sessionStorage.tfSeeded='1';}},[KEY,JSON.stringify(camp)]);
   await page.goto(URL);await page.waitForSelector('#homePlay:not([hidden])',{timeout:30000});await page.locator('#homePlay').tap();
   await page.waitForSelector('#home',{state:'hidden',timeout:30000});await page.waitForSelector('#board .tile');await settle(page);await page.waitForTimeout(600);
   const cdp=engine==='chromium'?await context.newCDPSession(page):null,frames=[];
   cdp?.on('Page.screencastFrame',f=>{frames.push({t:Date.now(),data:f.data});cdp.send('Page.screencastFrameAck',{sessionId:f.sessionId}).catch(()=>{});});
   const gen=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).board.findIndex(x=>x?.type==='source'&&x.id==='rig'),KEY);
   const taps=[['an item selected','#board [data-index="26"]'],['the item deselected','#board [data-index="26"]'],['an order card','#requests .requestCard:not(.storyOrder)'],
    ['Details opened','#orderDetails'],['Details closed (✕)','#orderTools .sheetClose'],['an empty space','#board .tile.empty'],['the generator',`#board [data-index="${gen}"]`]];
   const rows=[];
   for(const [name,sel] of taps){
    if(sel==='#orderDetails'&&!await page.locator(sel).isVisible())continue;// larger screens have no Details
    const before=await mark(page);frames.length=0;if(cdp){await cdp.send('Page.startScreencast',{format:'png',everyNthFrame:1});await page.waitForTimeout(250);}
    const tapAt=Date.now(),sampled=page.evaluate(()=>window.__vwFrames(700));await finger(page,sel);const f=await sampled;
    if(cdp){await page.waitForTimeout(150);await cdp.send('Page.stopScreencast');}
    const m=await measure(page,before);let shot=null
    if(cdp){const box=await page.locator('#board').boundingBox(),pre=frames.filter(x=>x.t<tapAt).at(-1),post=frames.filter(x=>x.t>=tapAt);
     if(pre&&post.length){const scorer=await context.newPage();
      shot=await scorer.evaluate(async([pre,post,box,dpr])=>{const load=d=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src='data:image/png;base64,'+d;});
       const px=async d=>{const i=await load(d),c=document.createElement('canvas');c.width=i.width;c.height=i.height;const g=c.getContext('2d');g.drawImage(i,0,0);const s=i.width/dpr;return g.getImageData(box.x*s,box.y*s,box.width*s,box.height*s).data;};
       const diff=(a,b)=>{let s=0;for(let k=0;k<a.length;k+=4)s+=Math.abs(a[k]-b[k])+Math.abs(a[k+1]-b[k+1])+Math.abs(a[k+2]-b[k+2]);return s/(a.length/4)/3;};
       const A=await px(pre),Z=await px(post.at(-1));let worst=0;for(const d of post){const P=await px(d);worst=Math.max(worst,Math.min(diff(P,A),diff(P,Z)));}return +worst.toFixed(2);},[pre.data,post.map(x=>x.data),box,W]);
      await scorer.close();post.slice(0,3).forEach((x,k)=>fs.writeFileSync(path.join(OUT,`${engine}-${W}x${H}-${name.replace(/\W+/g,'-')}-${k+1}.png`),Buffer.from(x.data,'base64')));}}
    rows.push({tap:name,reload:m.reload,newBoardImgs:m.boardImgs,cellsChanged:m.cellsChanged,newOrderImgs:m.orderImgs,newStripImgs:m.stripImgs,animsRestarted:m.restarted.length,undrawnFrames:f.blank,worstUndrawn:f.worst,screencastTransient:shot});
    const t=tag(name);
    assert.equal(m.reload,false,`${t}: no reload`);
    assert.ok(m.boardImgs<=m.cellsChanged*2,`${t}: only changed cells get new pictures (${m.boardImgs} new for ${m.cellsChanged} changed cells)`);
    if(name!=='the generator'){
     assert.equal(m.orderImgs,0,`${t}: no order card picture is recreated`);assert.equal(m.stripImgs,0,`${t}: the strip's picture is not recreated`);
     assert.deepEqual(m.restarted,[],`${t}: no running board animation restarts`);
     assert.equal(f.blank,0,`${t}: no frame shows an undrawn picture (${f.worst} at worst)`);
     if(shot!=null&&!/Details/.test(name))assert.ok(shot<6,`${t}: no transient frame on screen (screencast ${shot})`);}
    await page.waitForTimeout(300);}
   console.log(`== ${tag('per tap')}`);console.table(rows);
   // the game still plays
   let s=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
   assert.ok(s.board.filter(x=>x?.type==='item').length>=camp.board.filter(x=>x?.type==='item').length+1,tag('the generator made a part'));
   {const a=await page.locator('#board [data-index="26"]').boundingBox(),b=await page.locator('#board [data-index="27"]').boundingBox();
    await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();for(let k=1;k<=8;k++)await page.mouse.move(a.x+a.width/2+(b.x-a.x)*k/8,a.y+a.height/2+(b.y-a.y)*k/8);await page.mouse.up();await page.waitForTimeout(400);}
   s=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);assert.deepEqual([s.board[26],s.board[27]?.tier],[null,1],tag('the twins merged'));
   assert.equal(await page.locator('#board [data-index="27"].merge-pop').count(),1,tag('the merge still pops'));
   await page.reload();await page.waitForSelector('#homePlay:not([hidden])',{timeout:30000});await page.locator('#homePlay').tap();await page.waitForSelector('#home',{state:'hidden',timeout:30000});
   s=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);assert.equal(s.board[27]?.tier,1,tag('kept after a reload'));
   assert.deepEqual(errors,[],tag('no page error'));console.log(`ok ${tag('plain taps repaint only what changed; no reload, no undrawn frame; generator, merge, reload')}`);
   await context.close();}}
  finally{await browser.close();}
 }
 console.log('tap flicker browser tests passed');
})().catch(e=>{console.error(e);process.exit(1);});
