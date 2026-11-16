// Stable gameplay viewport: board Y across select/deselect, Details reachable, story caption clear of the board and
// controls, every tile reachable, three cards, no clipping. ORIGIN, OUT, LABEL, VIEWPORTS
const fs=require('fs'),path=require('path');const {chromium,webkit}=require('playwright');
const ORIGIN=process.env.ORIGIN||'http://127.0.0.1:8080',OUT=process.env.OUT,LABEL=process.env.LABEL||'x',KEY='vaultwake-v5-coast',ENGINE=process.env.ENGINE||'chromium';
const VIEWPORTS=(process.env.VIEWPORTS||'360x640,375x667,390x664,390x844,430x932,907x510').split(',').map(s=>s.split('x').map(Number));
const fx=JSON.parse(fs.readFileSync('/home/user/vaultwake/tests/fixtures/coast/coast-ch1-pre-secondary.json','utf8'));fx.daily={day:9e6,count:1};
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const boardY=p=>p.evaluate(()=>Math.round(document.querySelector('#board').getBoundingClientRect().top*10)/10);
const tilesFree=p=>p.evaluate(()=>{let bad=[];for(const t of document.querySelectorAll('#board .tile')){const r=t.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;if(y<0||y>innerHeight){bad.push(t.dataset.index+':off');continue;}const e=document.elementFromPoint(x,y);if(!e||!t.contains(e)&&e!==t)bad.push(t.dataset.index+':'+(e?.id||e?.className||e?.tagName));}return bad;});
const cards3=p=>p.evaluate(()=>{const W=innerWidth,c=[...document.querySelectorAll('#requests .requestCard')].map(e=>e.getBoundingClientRect()).sort((a,b)=>a.left-b.left).slice(0,3);return c.length===3&&c.every(r=>r.left>=-0.5&&r.right<=W+0.5);});
const clipped=p=>p.evaluate(()=>[...document.querySelectorAll('.boardHeading button:not([hidden]), #storyRibbon p, #storyRibbon button, #requests .reqName b, #mapButton .rsText b')].filter(e=>e.offsetParent!==null&&e.scrollWidth>e.clientWidth+1).map(e=>e.id||e.className));
const rect=(p,s)=>p.evaluate(s=>{const e=document.querySelector(s);if(!e||e.hidden||e.offsetParent===null&&getComputedStyle(e).position!=='fixed')return null;const r=e.getBoundingClientRect();return r.width?{top:+r.top.toFixed(1),bottom:+r.bottom.toFixed(1),left:+r.left.toFixed(1),right:+r.right.toFixed(1)}:null;},s);
const hit=(a,b)=>a&&b&&Math.min(a.right,b.right)-Math.max(a.left,b.left)>0.5&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>0.5;
(async()=>{const browser=await {chromium,webkit}[ENGINE].launch(),rows=[];
 for(const [W,H] of VIEWPORTS){const mobile=W<700;
  const mk=async seed=>{const ctx=await browser.newContext({viewport:{width:W,height:H},isMobile:mobile&&ENGINE==='chromium',hasTouch:mobile,deviceScaleFactor:OUT?2:1}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   if(seed)await page.addInitScript(([k,v])=>{if(!sessionStorage.s){localStorage.setItem(k,v);localStorage.setItem('vaultwake-v5-coast-story','{"intro":"skip"}');sessionStorage.s=1;}},[KEY,JSON.stringify(seed)]);
   await page.goto(ORIGIN+'/v5/play.html');await page.waitForSelector('#board .tile');
   // a finger (or mouse) at the element's centre, as a player taps; no test-tool scrolling
   const tap=async s=>{const l=page.locator(s).first();await l.waitFor({state:'visible',timeout:8000});const b=await l.boundingBox();if(b.y<0||b.y+b.height>H){await l.evaluate(e=>e.scrollIntoView({block:'center'}));}const c=await l.boundingBox();if(mobile)await page.touchscreen.tap(c.x+c.width/2,c.y+c.height/2);else await page.mouse.click(c.x+c.width/2,c.y+c.height/2);};
   for(let k=0;k<30;k++){if(await page.evaluate(()=>!document.querySelector('#home').hidden&&!document.querySelector('#homePlay').hidden)){await tap('#homePlay');await delay(300);continue;}
    if(await page.evaluate(()=>!document.querySelector('#story').hidden)){await tap('#storySkip');await delay(300);continue;}break;}
   await delay(1500);return {ctx,page,errors,tap};};
  const shot=async(page,n)=>{if(OUT)await page.screenshot({path:path.join(OUT,`${LABEL}-${W}x${H}-${n}.png`)});};
  // A. returning player: select / deselect an order; Details; three cards
  {const {ctx,page,errors,tap}=await mk(fx);const r={vp:`${W}x${H}`,case:'returning'};
   r.y0=await boardY(page);r.cards3=await cards3(page);await shot(page,'1-returning');
   await tap('#requests [data-order="o14"]');await delay(700);r.y1=await boardY(page);r.details=await rect(page,'#orderDetails');r.detailsInView=!!r.details&&r.details.top>=0&&r.details.bottom<=H;
   r.strip=await rect(page,'#mapButton');r.detailsOverStrip=hit(r.details,r.strip);r.detailsOverBoard=hit(r.details,await rect(page,'#board'));r.clipSel=await clipped(page);r.tilesSel=(await tilesFree(page)).length;await shot(page,'2-selected');
   if(r.details){await tap('#orderDetails');await delay(600);r.sheetOpen=await page.evaluate(()=>document.querySelector('#orderTools')?.classList.contains('sheetOpen')||!!document.querySelector('#orderTools:not([hidden])')&&innerWidth>=700);await shot(page,'3-details');
    await page.keyboard.press('Escape');await delay(400);r.y2=await boardY(page);}
   await tap('#requests [data-order="o14"]');await delay(700);r.y3=await boardY(page);
   r.maxJump=Math.max(...[r.y1,r.y2,r.y3].filter(v=>v!=null).map(v=>Math.abs(v-r.y0)));r.errors=errors.length;rows.push(r);await ctx.close();}
  // B. new player: story caption, tutorial guide row, select an order in the tutorial
  {const {ctx,page,errors,tap}=await mk(null);const r={vp:`${W}x${H}`,case:'new player'};
   r.ribbon=await rect(page,'#storyRibbon');r.ribbonInline=await page.evaluate(()=>document.querySelector('#storyRibbon')?.classList.contains('inline')??null);
   const board=await rect(page,'#board');r.ribbonOverBoard=hit(r.ribbon,board);
   r.ribbonOverControls=[];for(const s of ['main.game header','#requests','#mapButton','.boardHeading','#coachSkip','#guideHint'])if(hit(r.ribbon,await rect(page,s)))r.ribbonOverControls.push(s);
   r.tiles=(await tilesFree(page));r.tilesBlocked=r.tiles.filter(t=>!t.endsWith(':off')).length;r.tilesOff=r.tiles.filter(t=>t.endsWith(':off')).length;r.clip=await clipped(page);r.cards3=await cards3(page);
   r.y0=await boardY(page);await shot(page,'4-new-player');
   const sel=await page.evaluate(()=>[...document.querySelectorAll('#requests .requestCard')].find(c=>!c.classList.contains('lead')&&!c.classList.contains('ready'))?.dataset.order);
   if(sel){await tap(`#requests [data-order="${sel}"]`);await delay(700);r.y1=await boardY(page);await shot(page,'5-tutorial-selected');await tap(`#requests [data-order="${sel}"]`);await delay(700);r.y2=await boardY(page);}
   r.maxJump=Math.max(...[r.y1,r.y2].filter(v=>v!=null).map(v=>Math.abs(v-r.y0)));r.errors=errors.length;rows.push(r);await ctx.close();}
 }
 await browser.close();if(OUT)fs.writeFileSync(path.join(OUT,LABEL+'.json'),JSON.stringify(rows,null,1));
 for(const r of rows)console.log(r.case==='returning'?`${r.vp.padEnd(8)} returning : board ${r.y0} → sel ${r.y1} → details closed ${r.y2} → desel ${r.y3} | max jump ${r.maxJump} | Details ${r.details?`${r.details.top}-${r.details.bottom} inView ${r.detailsInView} overStrip ${r.detailsOverStrip} overBoard ${r.detailsOverBoard}`:'none'} sheet ${r.sheetOpen} | 3 cards ${r.cards3} | tiles covered ${r.tilesSel} | clip ${r.clipSel.join(',')||'-'} err ${r.errors}`
  :`${r.vp.padEnd(8)} new player: ribbon ${r.ribbon?`${r.ribbon.top}-${r.ribbon.bottom}`:'none'} inline ${r.ribbonInline} overBoard ${r.ribbonOverBoard} overControls ${r.ribbonOverControls.join(',')||'-'} | tiles covered ${r.tilesBlocked} offscreen ${r.tilesOff} | board ${r.y0} → tutorial sel ${r.y1} → desel ${r.y2} max jump ${r.maxJump} | 3 cards ${r.cards3} | clip ${r.clip.join(',')||'-'} err ${r.errors}`);
})().catch(e=>{console.error(e);process.exit(1);});
