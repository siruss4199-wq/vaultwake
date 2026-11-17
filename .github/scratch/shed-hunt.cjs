// Shed overlay hunt. A camp with a nearly full board (ENGINE chromium|webkit, ORIGIN). Paths: Shed button; touch drag
// onto the shed bar; onto an open slot; unstore; rapid store/unstore; a drag cancelled (pointercancel); a scroll during
// a drag; reload. After each, at several times, every visible box (elements AND ::before/::after) that overlaps the
// board's cells and is not a cell or inside one is reported with its size, colours and containing block.
const {chromium,webkit}=require('playwright');const fs=require('fs');
const ORIGIN=process.env.ORIGIN||'http://127.0.0.1:8080',ENGINE=process.env.ENGINE||'chromium',OUT=process.env.OUT;
const W=+(process.env.W||390),H=+(process.env.H||844);
const camp=JSON.parse(fs.readFileSync(process.env.FIXTURE||require('path').join(process.cwd(),'tests/fixtures/coast/coast-ch1-pre-secondary.json'),'utf8'));camp.pending=[];
// fill the board to one free space (parts that cannot merge with each other), keep the daily gift available
{let filler=0;const fam=['rig','chart'];for(let i=0;i<camp.board.length;i++)if(camp.board[i]===null){camp.board[i]={type:'item',family:fam[filler%2],tier:(filler%4)};filler++;}
 const last=camp.board.findLastIndex(x=>x?.type==='item');camp.board[last]=null;}
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const scan=page=>page.evaluate(()=>{const board=document.querySelector('#board'),br=board.getBoundingClientRect(),cells=[...board.querySelectorAll('.tile')].map(t=>t.getBoundingClientRect());
 const area=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
 const cb=e=>{let c=e.parentElement;while(c&&getComputedStyle(c).position==='static'&&c!==document.documentElement)c=c.parentElement;return c;};
 const desc=e=>(e.id?'#'+e.id:e.tagName.toLowerCase())+(typeof e.className==='string'&&e.className.trim()?'.'+e.className.trim().split(/\s+/).join('.'):'');
 const hits=[];const visible=cs=>cs.display!=='none'&&cs.visibility!=='hidden'&&+cs.opacity>0.05;
 for(const e of document.querySelectorAll('body *')){
  const inCell=e.closest('#board .tile');if(e.closest('dialog'))continue;
  // the element itself (a cell's own content is fine)
  if(!inCell&&e!==board&&!e.contains(board)){const cs=getComputedStyle(e);if(visible(cs)){const r=e.getBoundingClientRect();if(r.width>=24&&r.height>=24&&area(r,br)>600&&!e.closest('#coachHand,#spotCue,.coachArrow,.coachGhost,.moment,.mergeTag'))hits.push({what:desc(e),pos:cs.position,box:[r.left,r.top,r.width,r.height].map(Math.round),bg:cs.backgroundColor,anim:cs.animationName});}}
  // its pseudo-elements: a positioned ::before/::after takes its size from its containing block
  for(const p of ['::before','::after']){const cs=getComputedStyle(e,p);if(cs.content==='none'||cs.content==='normal'||!visible(cs))continue;if(!['absolute','fixed'].includes(cs.position))continue;
   const c=cs.position==='fixed'?document.documentElement:cb(e),r=c.getBoundingClientRect();const host=e.getBoundingClientRect();
   // an absolute pseudo larger than its host by far is the suspect
   if(r.width*r.height>4*Math.max(1,host.width*host.height)&&area(r,br)>600)hits.push({what:desc(e)+p,pos:cs.position,containingBlock:desc(c),box:[r.left,r.top,r.width,r.height].map(Math.round),host:[host.width,host.height].map(Math.round),border:cs.borderTopWidth+' '+cs.borderTopColor,bg:cs.backgroundColor,opacity:cs.opacity,anim:cs.animationName});}}
 return {shed:document.querySelector('#shed .shedToggle b')?.innerText,free:document.querySelector('#free:not([hidden])')?.innerText??'',ghosts:document.querySelectorAll('.dragGhost').length,hits};});
(async()=>{const b=await {chromium,webkit}[ENGINE].launch(),ctx=await b.newContext({viewport:{width:W,height:H},isMobile:ENGINE==='chromium',hasTouch:true,deviceScaleFactor:OUT?2:1}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(([k,v])=>{if(!sessionStorage.s){localStorage.setItem(k,v);localStorage.setItem('vaultwake-v5-coast-story','{"intro":"skip"}');sessionStorage.s=1;}},['vaultwake-v5-coast',JSON.stringify(camp)]);
 await page.goto(ORIGIN+'/v5/play.html');await page.waitForSelector('#board .tile');await delay(1200);
 for(let k=0;k<6;k++){if(await page.locator('#daily[open]').count())await page.locator('#daily .close').click();const v=await page.evaluate(()=>!document.querySelector('#home')?.hidden&&!document.querySelector('#homePlay')?.hidden);if(v){await page.locator('#homePlay').click();await delay(900);}}
 await delay(800);
 const cdp=ENGINE==='chromium'?await ctx.newCDPSession(page):null;
 const center=async sel=>{const x=await page.locator(sel).first().boundingBox();return {x:x.x+x.width/2,y:x.y+x.height/2};};
 const shut=async()=>{for(const d of ['#daily','#levelUp'])if(await page.locator(d+'[open]').count()){await page.locator(d+' .close').first().click().catch(()=>{});await delay(200);}};
 const tap=async sel=>{await shut();const c=await center(sel);await page.touchscreen.tap(c.x,c.y);};
 const touchDrag=async(a,z,{cancel=false,scroll=false}={})=>{await shut();if(!cdp){await page.mouse.move(a.x,a.y);await page.mouse.down();for(let k=1;k<=12;k++){await page.mouse.move(a.x+(z.x-a.x)*k/12,a.y+(z.y-a.y)*k/12);await delay(20);}await page.mouse.up();return;}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:a.x,y:a.y}]});
  for(let k=1;k<=12;k++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:a.x+(z.x-a.x)*k/12,y:a.y+(z.y-a.y)*k/12}]});await delay(20);if(scroll&&k===6)await page.evaluate(()=>scrollBy(0,40));}
  await cdp.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});};
 const item=()=>page.evaluate(()=>[...document.querySelectorAll('#board .tile.item')].map(e=>+e.dataset.index).at(-1));
 const base=new Set((await scan(page)).hits.map(h=>h.what));
 const report=[];const look=async label=>{for(const ms of [30,120,250,500,1500]){await delay(ms===30?30:ms-[30,120,250,500,1500][[30,120,250,500,1500].indexOf(ms)-1]);const s=await scan(page);s.hits=s.hits.filter(h=>!base.has(h.what));
  if(s.hits.length||s.ghosts)report.push({label,ms,...s});if(OUT&&ms===120)await page.screenshot({path:`${OUT}/${ENGINE}-${label.replace(/\W+/g,'_')}.png`});
  if(process.env.B64&&(ms===120||ms===1500)){const bb=await page.locator('#board').boundingBox(),sh=await page.locator('#shed').boundingBox();const y0=Math.max(0,bb.y-4),y1=Math.min(H,sh.y+sh.height+4);const buf=await page.screenshot({type:'jpeg',quality:45,clip:{x:0,y:y0,width:W,height:Math.max(10,y1-y0)}});console.log(`B64 ${ENGINE} ${label.replace(/\W+/g,'_')} ${ms} ${buf.toString('base64')}`);}}
  const s=await scan(page);report.push({label:label+' (final)',shed:s.shed,free:s.free,ghosts:s.ghosts,hits:s.hits.length});};
 // 1. Shed button
 await tap(`#board [data-index="${await item()}"]`);await delay(300);await tap('#selection [data-action="store"]');await look('Shed button');
 // 2. unstore (tap the stored part)
 await tap('#shed .shedSlot.full');await look('unstore');
 // 3. touch drag onto the folded shed bar
 if(await page.locator('#shed.open').count())await tap('#shed [data-shed-toggle]');await delay(300);
 await touchDrag(await center(`#board [data-index="${await item()}"]`),await center('#shed [data-shed-toggle]'));await look('drag onto shed bar');
 // 4. touch drag onto an open empty slot
 if(!await page.locator('#shed.open').count())await tap('#shed [data-shed-toggle]');await delay(300);
 await touchDrag(await center(`#board [data-index="${await item()}"]`),await center('#shed .shedSlot:not(.full)'));await look('drag onto a slot');
 // 5. rapid store / unstore
 for(let n=0;n<4;n++){await tap('#shed .shedSlot.full');await delay(60);await tap(`#board [data-index="${await item()}"]`);await delay(60);await tap('#selection [data-action="store"]');await delay(60);}
 await look('rapid store/unstore');
 // 6. a drag cancelled by the browser, and a drag with a scroll in the middle
 await touchDrag(await center(`#board [data-index="${await item()}"]`),await center('#shed [data-shed-toggle]'),{cancel:true});await look('cancelled drag');
 await touchDrag(await center(`#board [data-index="${await item()}"]`),await center('#shed [data-shed-toggle]'),{scroll:true});await look('drag with scroll');
 const before=await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('vaultwake-v5-coast'));return {shed:s.shed.map(x=>x?x.family+x.tier:null),items:s.board.filter(Boolean).length};});
 await page.reload();await page.waitForSelector('#board .tile');await delay(1500);for(let k=0;k<4;k++){const v=await page.evaluate(()=>!document.querySelector('#home')?.hidden&&!document.querySelector('#homePlay')?.hidden);if(v){await page.locator('#homePlay').click();await delay(900);}}
 const after=await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('vaultwake-v5-coast'));return {shed:s.shed.map(x=>x?x.family+x.tier:null),items:s.board.filter(Boolean).length};});
 await look('after reload');
 console.log(JSON.stringify({engine:ENGINE,size:`${W}x${H}`,report,saveBeforeReload:before,saveAfterReload:after,errors},null,1));await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
