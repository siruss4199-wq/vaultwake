// Measures where the order section, restoration strip and board sit on first view (no scrolling by the test).
// ORIGIN, OUT (screenshots dir), LABEL (before/after), SIZES, SHOTS=1
const fs=require('fs'),path=require('path');const {chromium}=require('playwright');
const ORIGIN=process.env.ORIGIN||'http://127.0.0.1:8080',OUT=process.env.OUT,LABEL=process.env.LABEL||'x',KEY='vaultwake-v5-coast';
const SIZES=(process.env.SIZES||'360x640,390x664,390x844,430x932,907x510').split(',').map(s=>s.split('x').map(Number));
const STUB=`window.CrazyGames={SDK:{environment:'crazygames',init:async()=>{},game:{loadingStart(){},loadingStop(){},gameplayStart(){},gameplayStop(){},happytime(){},settings:{muteAudio:false},addSettingsChangeListener(){}},user:{isUserAccountAvailable:false},data:null,ad:{requestAd(t,c){c.adError&&c.adError()}}}};`;
const fx=JSON.parse(fs.readFileSync(path.join('/home/user/vaultwake/tests/fixtures/coast/coast-ch1-pre-secondary.json'),'utf8'));fx.daily={day:9e6,count:1};
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const measure=frame=>frame.evaluate(()=>{const R=s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return {top:Math.round(r.top),bottom:Math.round(r.bottom),left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width),height:Math.round(r.height)};};
 const W=innerWidth,H=innerHeight,se=document.scrollingElement;const b=R('#board'),q=R('#requests'),card=R('#requests .requestCard'),s=R('#mapButton'),hud=R('.brand'),tile=document.querySelector('#board .tile')?.getBoundingClientRect();
 const vis=r=>r&&r.top>=0&&r.bottom<=H&&r.left>=0&&r.right<=W;const off=r=>r?Math.round((r.left-(W-r.right))/2):null;
 return {W,H,scrollY:Math.round(scrollY),scrollX:Math.round(scrollX),scrollH:se.scrollHeight,scrollW:se.scrollWidth,hud,requests:q,card,strip:s,board:b,cardVisible:vis(card),tile:tile?Math.round(tile.width*10)/10:null,
  boardVisible:vis(b),requestsVisible:vis(q),stripVisible:vis(s),boardOffset:off(b),requestsOffset:off(q),gapAboveHud:hud?hud.top:null,gapBelowBoard:b?H-b.bottom:null,
  openDialogs:[...document.querySelectorAll('dialog[open]')].map(d=>d.id),home:!document.querySelector('#home')?.hidden};});
(async()=>{const browser=await chromium.launch(),rows=[];
 for(const [W,H] of SIZES){const mobile=W<700;
  const mk=async()=>{const ctx=await browser.newContext({viewport:{width:W,height:H},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:2});
   await ctx.route('https://sdk.crazygames.com/**',r=>r.fulfill({contentType:'application/javascript',body:STUB}));return ctx;};
  const shot=async(page,name)=>{if(OUT&&process.env.SHOTS)await page.screenshot({path:path.join(OUT,`${LABEL}-${W}x${H}-${name}.png`)});};
  const toBoard=async(page)=>{await page.waitForSelector('#board .tile',{timeout:20000});for(let k=0;k<40;k++){if(await page.locator('#homePlay:not([hidden])').count()&&await page.evaluate(()=>!document.querySelector('#home').hidden)){await page.locator('#homePlay').click();await delay(300);continue;}
    if(await page.evaluate(()=>document.querySelector('#home')?.hidden!==false&&document.querySelector('#story')?.hidden!==false))break;
    if(await page.locator('#storySkip:visible').count()){await page.locator('#storySkip').click();await delay(300);continue;}await delay(250);}
   await delay(1200);};
  // 1. new player, first load (story skipped by its own Skip if shown)
  {const ctx=await mk(),page=await ctx.newPage();await page.goto(ORIGIN+'/v5/play.html');await toBoard(page);
   rows.push({size:`${W}x${H}`,case:'new player',...await measure(page)});await shot(page,'1-new');
   // reload of the new camp
   await page.reload();await toBoard(page);rows.push({size:`${W}x${H}`,case:'new player reload',...await measure(page)});await ctx.close();}
  // 2. returning player (chapter-1 camp): Home → Continue, then reload
  {const ctx=await mk(),page=await ctx.newPage();await page.addInitScript(([k,v])=>{if(!sessionStorage.seeded){localStorage.setItem(k,v);localStorage.setItem('vaultwake-v5-coast-story','{"intro":"skip"}');sessionStorage.seeded='1';}},[KEY,JSON.stringify(fx)]);
   await page.goto(ORIGIN+'/v5/play.html');await toBoard(page);rows.push({size:`${W}x${H}`,case:'returning',...await measure(page)});await shot(page,'2-returning');
   await page.reload();await toBoard(page);rows.push({size:`${W}x${H}`,case:'returning reload',...await measure(page)});
   // the player scrolled down (shed, settings), then reloads: Home → Continue
   await page.evaluate(()=>scrollTo(0,9999));await delay(200);await page.reload();await toBoard(page);rows.push({size:`${W}x${H}`,case:'scrolled + reload',...await measure(page)});await shot(page,'5-scrolled-reload');
   // the player scrolled down, then the menu's Home → Continue
   await page.evaluate(()=>scrollTo(0,9999));await delay(200);await page.locator('#menuButton').click();await page.locator('#homeButton').click();await delay(500);await toBoard(page);
   rows.push({size:`${W}x${H}`,case:'scrolled + menu Home',...await measure(page)});await shot(page,'6-scrolled-menu-home');await ctx.close();}
  // 3. CrazyGames page, direct and embedded in an iframe that fills the viewport (as the portal does)
  {const ctx=await mk(),page=await ctx.newPage();await page.addInitScript(([k,v])=>{if(!sessionStorage.seeded){localStorage.setItem(k,v);localStorage.setItem('vaultwake-v5-coast-story','{"intro":"skip"}');sessionStorage.seeded='1';}},[KEY,JSON.stringify(fx)]);
   await page.goto(ORIGIN+'/v5/coast-crazygames.html');await toBoard(page);rows.push({size:`${W}x${H}`,case:'crazygames',...await measure(page)});await shot(page,'3-crazygames');await ctx.close();}
  {const ctx=await mk(),page=await ctx.newPage();
   await page.goto(ORIGIN+'/v5/next/');await page.setContent(`<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><style>html,body{margin:0;height:100%;background:#222}iframe{border:0;width:100%;height:100%;display:block}</style><iframe id=f src="${ORIGIN}/v5/coast-crazygames.html" allow="autoplay"></iframe>`);
   const fr=await (await page.waitForSelector('#f')).contentFrame();
   await fr.waitForSelector('#board .tile',{timeout:20000});for(let k=0;k<40;k++){if(await fr.evaluate(()=>!document.querySelector('#home').hidden&&!document.querySelector('#homePlay').hidden)){await fr.click('#homePlay');await delay(300);continue;}
    if(await fr.evaluate(()=>!document.querySelector('#story').hidden)){await fr.click('#storySkip').catch(()=>{});await delay(300);continue;}break;}
   await delay(1200);rows.push({size:`${W}x${H}`,case:'crazygames iframe',...await measure(fr)});await shot(page,'4-iframe');await ctx.close();}
 }
 await browser.close();if(OUT)fs.writeFileSync(path.join(OUT,`${LABEL}.json`),JSON.stringify(rows,null,1));
 for(const r of rows)console.log([r.size.padEnd(8),r.case.padEnd(18),`scrollY ${r.scrollY}/${r.scrollH-r.H}`,`hudTop ${r.gapAboveHud}`,`req ${r.requests?.top}-${r.requests?.bottom} off ${r.requestsOffset}`,`strip ${r.strip?.top}-${r.strip?.bottom}`,`board ${r.board?.top}-${r.board?.bottom} L${r.board?.left} R${r.W-r.board?.right} off ${r.boardOffset}`,`tile ${r.tile}`,`card ${r.card?.top}-${r.card?.bottom}`,`vis board/card/orders/strip ${+r.boardVisible}${+r.cardVisible}${+r.requestsVisible}${+r.stripVisible}`,`sw ${r.scrollW}`,r.openDialogs.join('|')].join(' · '));
})().catch(e=>{console.error(e);process.exit(1);});
