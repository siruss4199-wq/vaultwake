// Shed crate overlay: a full board with a Rig crate; select it, tap Shed (Board full → 1 space left, Shed 1/4).
// Reports every element/pseudo overlapping the board that is not a cell, and the crate tag's box. ENGINE, W, H, OUT, ORIGIN.
const {chromium,webkit}=require('playwright');const fs=require('fs');const path=require('path');
const ORIGIN=process.env.ORIGIN||'http://127.0.0.1:8080',ENGINE=process.env.ENGINE||'chromium',OUT=process.env.OUT,W=+(process.env.W||390),H=+(process.env.H||844),FAM=process.env.FAM||'rig';
const camp=JSON.parse(fs.readFileSync(path.join(process.cwd(),'tests/fixtures/coast/coast-ch1-pre-secondary.json'),'utf8'));camp.pending=[];camp.daily={day:9e6,count:1};camp.seen={'tip-shed':true,'extras-rig':true,'extras-chart':true,'extras-rope':true,'extras-shell':true,'extras-lamp':true};
{let f=0;const fam=['rig','chart'];for(let i=0;i<camp.board.length;i++)if(camp.board[i]===null){camp.board[i]={type:'item',family:fam[f%2],tier:f%4};f++;}}
const KIT=camp.board.findLastIndex(x=>x?.type==='item');camp.board[KIT]={type:'kit',family:FAM,size:1,left:3};
const delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await {chromium,webkit}[ENGINE].launch(),ctx=await b.newContext({viewport:{width:W,height:H},isMobile:ENGINE==='chromium',hasTouch:true,deviceScaleFactor:OUT?2:1}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(([k,v])=>{if(!sessionStorage.s){localStorage.setItem(k,v);localStorage.setItem('vaultwake-v5-coast-story','{"intro":"skip"}');sessionStorage.s=1;}},['vaultwake-v5-coast',JSON.stringify(camp)]);
 await page.goto(ORIGIN+'/v5/play.html');await page.waitForSelector('#board .tile');await delay(1200);
 for(let k=0;k<6;k++){if(await page.locator('#daily[open]').count())await page.locator('#daily .close').click();if(await page.evaluate(()=>!document.querySelector('#home')?.hidden&&!document.querySelector('#homePlay')?.hidden)){await page.locator('#homePlay').click();await delay(900);}}
 await delay(800);
 const tags=()=>page.evaluate(()=>[...document.querySelectorAll('.kitTag')].map(t=>{const r=t.getBoundingClientRect(),cs=getComputedStyle(t);let c=t.parentElement;while(c&&getComputedStyle(c).position==='static'&&c!==document.documentElement)c=c.parentElement;
  return {where:t.closest('#board')?'board':t.closest('.shedSlot')?'shed slot':t.closest('.shedPeek')?'shed bar peek':t.closest('#selection')?'selection':'other',box:[r.left,r.top,r.width,r.height].map(Math.round),bg:cs.backgroundColor,border:cs.borderTopWidth+' '+cs.borderTopColor,containingBlock:c===document.documentElement?'html':(c.id?'#'+c.id:c.className),visible:cs.visibility!=='hidden'&&r.width>0};}));
 const shot=async n=>{if(OUT)await page.screenshot({path:`${OUT}/${n}-${ENGINE}-${W}x${H}.png`});};
 const tap=async sel=>{await page.locator(sel).first().scrollIntoViewIfNeeded();const x=await page.locator(sel).first().boundingBox();await page.touchscreen.tap(x.x+x.width/2,x.y+x.height/2);};
 const rows={};rows.before=await tags();await shot('1-before');
 await tap(`#board [data-index="${KIT}"]`);await delay(400);rows.selected=await tags();await shot('2-selected');
 await tap('#selection [data-action="store"]');await delay(150);rows.stored150ms=await tags();await delay(1200);rows.stored=await tags();await shot('3-stored');
 rows.shed=await page.evaluate(()=>[document.querySelector('#shed .shedToggle b')?.innerText,document.querySelector('#free')?.innerText]);
 if(await page.locator('#shed.open').count()){await tap('#shed [data-shed-toggle]');await delay(500);}rows.folded=await tags();await shot('4-folded');
 await page.reload();await page.waitForSelector('#board .tile');await delay(1200);for(let k=0;k<4;k++)if(await page.evaluate(()=>!document.querySelector('#home')?.hidden&&!document.querySelector('#homePlay')?.hidden)){await page.locator('#homePlay').click();await delay(900);}
 await delay(500);rows.afterReload=await tags();rows.saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('vaultwake-v5-coast')).shed);await shot('5-reload');
 console.log(JSON.stringify({engine:ENGINE,size:`${W}x${H}`,board:await page.locator('#board').boundingBox(),...rows,errors},null,1));await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
