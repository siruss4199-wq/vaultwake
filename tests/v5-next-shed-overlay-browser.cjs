// Shed overlay hotfix (docs/V5_SHED_OVERLAY_HOTFIX_2026-11-17.md). On a phone, a crate stored in the shed drew a large
// solid coral oval with a white rim over the lower-right board: the crate's round family tag (.kitTag, absolutely placed,
// sized in %) had no positioned host in a shed space or in the folded bar's small icons, so it was sized and placed
// against the whole page; the store's merge ring (.merge-pop::before) the same, page-sized. Real UI, real input, a camp
// with a full board and crates. Paths: the Shed button; the folded bar; take it back out; a drag onto the folded bar; a
// drag onto an open space; rapid store/unstore; a drag cancelled by the browser (pointercancel); a drag with a scroll in
// the middle; a merge after all that; a reload. After each, at 30 ms, 150 ms and 700 ms:
//  - nothing drawn in or for the shed is placed against anything outside the shed (no page-sized tag or ring);
//  - every crate tag on the page is a small dot (≤ 24 px);
//  - nothing new and not part of the board overlaps the board's cells (elements and positioned ::before/::after);
//  - no extra coral paint over the board (pixels of the board area, against the same camp before);
//  - no drag ghost left;
// and the camp: nothing duplicated or lost (the board's, shed's and waiting things, as a multiset), the shed as expected, the
// merge still merges, a reload keeps the shed. ENGINES (default chromium,webkit), VIEWPORTS (default 390x664,360x640,430x932).
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const {chromium,webkit}=require('playwright');
const ORIGIN=process.env.ORIGIN||'http://127.0.0.1:8080',KEY='vaultwake-v5-coast';
const VIEWPORTS=(process.env.VIEWPORTS||'390x664,360x640,430x932').split(',').map(s=>s.split('x').map(Number));
const delay=ms=>new Promise(r=>setTimeout(r,ms));
// a progressed camp, its board filled (parts that pair up, so a merge is possible), crates of three kinds in it
const camp=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures','coast','coast-ch1-pre-secondary.json'),'utf8'));
// the rare extras already open (no unlock gift waiting for a space), the daily gift taken
camp.pending=[];camp.secOpen={rig:true,chart:true};camp.daily={day:9e6,count:1};camp.seen={'tip-shed':true,'extras-rig':true,'extras-chart':true,'extras-rope':true,'extras-shell':true,'extras-lamp':true};
{let f=0;for(let i=0;i<camp.board.length;i++)if(camp.board[i]===null){camp.board[i]={type:'item',family:['rig','chart'][f%2],tier:f%4};f++;}}
const crates=[];for(const family of ['rig','shell','chart']){const i=camp.board.findLastIndex((x,k)=>x?.type==='item'&&!crates.includes(k));camp.board[i]={type:'kit',family,size:1,left:3};crates.push(i);}
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
(async()=>{for(const engine of (process.env.ENGINES||'chromium,webkit').split(','))for(const [W,H] of VIEWPORTS){
 // a fresh browser per size: WebKit's page process in CI is known to drop late in one long-lived browser
 let browser;try{browser=await {chromium,webkit}[engine].launch();}catch(e){if(engine!=='chromium'&&/Executable doesn't exist/.test(e.message)){console.log(`${engine}: not installed here, skipped`);break;}throw e;}
 try{const tag=s=>`${engine} ${W}×${H}: ${s}`;
  const ctx=await browser.newContext({viewport:{width:W,height:H},isMobile:engine==='chromium',hasTouch:true}),page=await ctx.newPage(),helper=await ctx.newPage(),errors=[];
  await page.bringToFront();page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(([k,v])=>{if(!sessionStorage.seeded){localStorage.setItem(k,v);localStorage.setItem('vaultwake-v5-coast-story','{"intro":"skip"}');sessionStorage.seeded='1';}},[KEY,JSON.stringify(camp)]);
  const shut=async()=>{for(const d of ['#daily','#levelUp'])if(await page.locator(d+'[open]').count()){await page.locator(d+' .close').first().click().catch(()=>{});await delay(300);}
   if(await page.locator('#beat[open]').count()){await page.locator('#beatNext').click().catch(()=>{});await delay(300);}};
  const toBoard=async()=>{await page.waitForSelector('#board .tile');await delay(1000);for(let k=0;k<8;k++){await shut();
   if(await page.evaluate(()=>!document.querySelector('#home')?.hidden&&!document.querySelector('#homePlay')?.hidden)){await page.locator('#homePlay').click();await delay(700);continue;}break;}await delay(600);await shut();};
  await page.goto(ORIGIN+'/v5/play.html');await toBoard();
  const camp_=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
  const things=s=>[...s.board,...s.shed,...s.pending].filter(Boolean).map(x=>JSON.stringify(x)).sort();
  const tapAt=async l=>{await l.scrollIntoViewIfNeeded();const b=await l.boundingBox();await page.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);};
  const cell=i=>page.locator(`#board [data-index="${i}"]`);
  const openShed=async want=>{if(!!(await page.locator('#shed.open').count())!==want){await tapAt(page.locator('#shed [data-shed-toggle]'));await delay(400);}};
  // a mouse drag (pointer events), the shed in view; mid: called halfway (a scroll, a cancel)
  const drag=async(from,to,mid)=>{await shut();await page.locator('#shed').evaluate(e=>e.scrollIntoView({block:'end'}));await delay(200);
   const a=await cell(from).boundingBox(),z=await to.boundingBox();const p=k=>[a.x+a.width/2+(z.x+z.width/2-a.x-a.width/2)*k/12,a.y+a.height/2+(z.y+z.height/2-a.y-a.height/2)*k/12];
   await page.mouse.move(...p(0));await page.mouse.down();for(let k=1;k<=12;k++){await page.mouse.move(...p(k));await delay(20);if(k===6&&mid)await mid();}await page.mouse.up();};
  // the parts of the board fully on screen (a drag starts from one)
  const onScreen=async kinds=>{const s=await camp_();const r=[];for(let i=0;i<s.board.length;i++){if(!kinds.includes(s.board[i]?.type))continue;const b=await cell(i).boundingBox();if(b&&b.y>=0&&b.y+b.height<=H)r.push(i);}return r;};
  // coral paint over the board: share of the board's pixels close to the crate tag's coral
  const coral=async()=>{const bb=await page.locator('#board').boundingBox();const y0=Math.max(0,bb.y),y1=Math.min(H,bb.y+bb.height);if(y1-y0<40)return null;
   const png=await page.screenshot({clip:{x:bb.x,y:y0,width:bb.width,height:y1-y0}});
   return helper.evaluate(async b64=>{const im=new Image();im.src='data:image/png;base64,'+b64;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);
    const d=g.getImageData(0,0,c.width,c.height).data;let n=0;for(let i=0;i<d.length;i+=4){const r=d[i],gr=d[i+1],b=d[i+2];if(r>215&&gr>85&&gr<150&&b>55&&b<120&&r-gr>80)n++;}return 100*n/(d.length/4);},png.toString('base64'));};
  const scan=()=>page.evaluate(()=>{const board=document.querySelector('#board'),br=board.getBoundingClientRect(),shed=document.querySelector('#shed');
   const area=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
   const cbOf=(e,pos)=>{if(pos==='fixed')return document.documentElement;let c=e;while(c&&getComputedStyle(c).position==='static'&&c!==document.documentElement)c=c.parentElement;return c;};
   const desc=e=>(e.id?'#'+e.id:e.tagName.toLowerCase())+(typeof e.className==='string'&&e.className.trim()?'.'+e.className.trim().split(/\s+/).join('.'):'');
   const shown=cs=>cs.display!=='none'&&cs.visibility!=='hidden'&&+cs.opacity>0.05;
   const escaped=[],overlays=[],bigTags=[];
   for(const e of document.querySelectorAll('body *')){if(e.closest('dialog'))continue;const cs=getComputedStyle(e);
    // drawn in or for the shed: its containing block is inside the shed
    if(shed.contains(e)&&e!==shed){if(['absolute','fixed'].includes(cs.position)){const c=cbOf(e.parentElement,cs.position);if(!shed.contains(c))escaped.push(desc(e)+' → '+desc(c));}
     for(const p of ['::before','::after']){const ps=getComputedStyle(e,p);if(ps.content==='none'||ps.content==='normal'||!['absolute','fixed'].includes(ps.position))continue;const c=cbOf(e,ps.position);if(!shed.contains(c))escaped.push(desc(e)+p+' → '+desc(c));}}
    if(e.classList.contains('kitTag')&&shown(cs)){const r=e.getBoundingClientRect();if(r.width>24||r.height>24)bigTags.push(desc(e.parentElement)+' '+[r.left,r.top,r.width,r.height].map(Math.round));}
    // anything new over the board's cells that is not the board's own
    if(board.contains(e)||e.contains(board)||e.closest('#coachHand,#spotCue,.coachArrow,.coachGhost,.moment,.mergeTag,.fxParticle,.rewardFlight'))continue;
    if(shown(cs)){const r=e.getBoundingClientRect();if(r.width>=24&&r.height>=24&&area(r,br)>600)overlays.push(desc(e));}
    for(const p of ['::before','::after']){const ps=getComputedStyle(e,p);if(ps.content==='none'||ps.content==='normal'||!shown(ps)||!['absolute','fixed'].includes(ps.position))continue;
     const r=cbOf(e,ps.position).getBoundingClientRect(),h=e.getBoundingClientRect();if(r.width*r.height>4*Math.max(1,h.width*h.height)&&area(r,br)>600)overlays.push(desc(e)+p);}}
   return {escaped,overlays,bigTags,ghosts:document.querySelectorAll('.dragGhost').length};});
  const base=new Set((await scan()).overlays),coral0=await coral();
  const settle=async what=>{for(const ms of [30,150,700]){await delay(ms===30?30:ms===150?120:550);const s=await scan(),c=await coral(),at=`${what}, ${ms} ms`;
    assert.deepEqual(s.escaped,[],tag(`${at}: nothing in the shed is placed against the page`));assert.deepEqual(s.bigTags,[],tag(`${at}: every crate tag is a small dot`));
    assert.deepEqual(s.overlays.filter(x=>!base.has(x)),[],tag(`${at}: nothing new over the board`));
    if(c!==null&&coral0!==null)assert.ok(c<=coral0+0.4,tag(`${at}: no coral paint over the board (${c.toFixed(2)}% of its pixels, ${coral0.toFixed(2)}% before)`));
    assert.equal(s.ghosts,0,tag(`${at}: no drag ghost left`));}};
  let s0=await camp_();const all=things(s0);const kept=async what=>{await delay(300);const s=await camp_();assert.deepEqual(things(s),all,tag(`${what}: nothing duplicated or lost`));return s;};
  // 1. the reported path: the Rig crate, the Shed button (board full → 1 space left, Shed 1/4)
  assert.equal(s0.board.filter(x=>x===null).length,0,tag('the board starts full'));
  await tapAt(cell(crates[0]));await delay(300);await tapAt(page.locator('#selection [data-action="store"]'));await settle('a crate stored with the Shed button');
  let s=await kept('the Shed button');assert.equal(s.shed[0]?.type,'kit',tag('the crate is in the shed'));assert.equal(s.shed[0].family,'rig',tag('the Rig crate'));assert.equal(s.board[crates[0]],null,tag('its space is free'));
  assert.equal(await page.locator('#shed .shedToggle b').innerText(),'1/4',tag('Shed 1/4'));
  await openShed(false);await settle('the shed folded with a crate in it');
  // 2. take it back out
  await openShed(true);await tapAt(page.locator('#shed .shedSlot.full').first());await settle('the crate taken back out');s=await kept('unstore');assert.ok(s.shed.every(x=>x===null),tag('the shed is empty again'));
  // 3. a drag onto the folded bar (the slot that gets the effect is hidden)
  await openShed(false);let from=(await onScreen(['kit'])).at(-1);assert.ok(from!=null,tag('a crate on screen'));
  await drag(from,page.locator('#shed [data-shed-toggle]'));await settle('a crate dragged onto the folded bar');s=await kept('a drag onto the bar');assert.equal(s.shed.filter(Boolean).length,1,tag('stored by the drag'));
  // 4. a drag onto an open empty space
  await openShed(true);from=(await onScreen(['kit','item'])).at(-1);await drag(from,page.locator('#shed .shedSlot:not(.full)').first());await settle('a drag onto an open space');
  s=await kept('a drag onto a space');assert.equal(s.shed.filter(Boolean).length,2,tag('stored by the drag'));
  // 5. rapid store / unstore
  for(let n=0;n<4;n++){await openShed(true);await tapAt(page.locator('#shed .shedSlot.full').first());await delay(60);const i=(await onScreen(['kit','item'])).at(-1);
   await tapAt(cell(i));await delay(60);await tapAt(page.locator('#selection [data-action="store"]'));await delay(60);}
  await settle('rapid store and unstore');s=await kept('rapid store and unstore');assert.equal(s.shed.filter(Boolean).length,2,tag('the shed holds what it should'));
  // 6. a drag the browser cancels (pointercancel), then one with a scroll in the middle
  const before=await camp_();from=(await onScreen(['kit','item'])).at(-1);
  await drag(from,page.locator('#shed [data-shed-toggle]'),async()=>{assert.equal(await page.locator('.dragGhost').count(),1,tag('a ghost while dragging'));
   await page.evaluate(()=>document.dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,pointerId:1})));});
  await settle('a cancelled drag');assert.ok(same((await camp_()).shed,before.shed)&&same((await camp_()).board,before.board),tag('a cancelled drag changes nothing'));
  from=(await onScreen(['kit','item'])).at(-1);await drag(from,page.locator('#shed [data-shed-toggle]'),()=>page.evaluate(()=>scrollBy(0,30)));await settle('a drag with a scroll');
  s=await kept('a drag with a scroll');assert.equal(s.shed.filter(Boolean).length,3,tag('stored by the drag'));
  // 7. merging still works: two equal parts dragged together make the next one
  s=await camp_();const vis=await onScreen(['item']);let pair=null;for(const a of vis)for(const b of vis)if(!pair&&a!==b&&s.board[a].family===s.board[b].family&&s.board[a].tier===s.board[b].tier&&s.board[a].tier<3)pair=[a,b];
  assert.ok(pair,tag('a pair on screen'));const p=s.board[pair[0]],n0=s.board.filter(Boolean).length;await drag(pair[0],cell(pair[1]));await delay(700);await shut();
  s=await camp_();assert.equal(s.board.filter(Boolean).length,n0-1,tag('the merge took two parts'));assert.equal(s.board[pair[1]]?.tier,p.tier+1,tag('and made the next one'));
  await settle('after a merge');
  // 8. a reload keeps the shed, and the stored crate is still a small dot
  const shed=s.shed;await page.reload();await toBoard();assert.deepEqual((await camp_()).shed,shed,tag('a reload keeps the shed'));
  assert.equal(await page.locator('#shed .shedToggle b').innerText(),`${shed.filter(Boolean).length}/4`,tag('the shed bar after the reload'));
  await settle('after a reload (folded)');await openShed(true);await settle('after a reload (open)');
  assert.deepEqual(errors,[],tag('no page errors'));
  console.log(`ok ${tag('the shed keeps its art inside it on every path; nothing duplicated or lost; merge and reload work')}`);
  await ctx.close();
 }finally{await browser.close();}}
 console.log('shed overlay browser tests passed');
})().catch(e=>{console.error(e);process.exit(1);});
