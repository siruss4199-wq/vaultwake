// QA preview smoke (diagnostic): the deployed preview on an emulated iPhone. A new camp starts and the board is
// playable; no page errors; where the save goes (this origin only, not CrazyGames); the build's own files. ORIGIN, OUT.
const {webkit,chromium,devices}=require('playwright');const ORIGIN=process.env.ORIGIN,OUT=process.env.OUT;
(async()=>{const rows=[];for(const [engine,dev] of [['webkit','iPhone 13'],['chromium','iPhone 13']]){
 const b=await {webkit,chromium}[engine].launch(),ctx=await b.newContext({...devices[dev],...(engine==='chromium'?{defaultBrowserType:undefined}:{})}),page=await ctx.newPage(),errors=[],failed=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failed.push(r.url()));page.on('response',r=>{if(r.status()>=400)failed.push(r.status()+' '+r.url());});
 const t0=Date.now();const resp=await page.goto(ORIGIN+'/v5/play.html?new=1');await page.waitForSelector('#board .tile',{timeout:30000});const firstBoard=Date.now()-t0;
 await page.waitForTimeout(2500);
 // as a player: past the story intro (a new camp opens with it) and any Home or story page
 for(let k=0;k<12;k++){if(await page.locator('#story:not([hidden]) #storySkip').count()){await page.locator('#storySkip').click();await page.waitForTimeout(600);continue;}
  if(await page.locator('#beat[open]').count()){await page.locator('#beatNext').click();await page.waitForTimeout(400);continue;}
  if(await page.evaluate(()=>!document.querySelector('#home')?.hidden&&!document.querySelector('#homePlay')?.hidden)){await page.locator('#homePlay').click();await page.waitForTimeout(800);continue;}break;}
 await page.waitForTimeout(1200);
 const info=await page.evaluate(()=>({url:location.href,title:document.title,tiles:document.querySelectorAll('#board .tile').length,step:window.VWGuide?.step?.kind??null,spot:document.body.dataset.spot??null,
  save:window.VWSave?{...window.VWSave}:null,keys:Object.keys(localStorage).filter(k=>/vaultwake/.test(k)),
  css:[...document.querySelectorAll('link[rel=stylesheet]')].map(l=>l.getAttribute('href')).filter(h=>/coastal/.test(h)),
  app:document.querySelector('script[type=module]')?.getAttribute('src'),footer:document.querySelector('footer')?.innerText.replace(/\s+/g,' ').slice(0,160)}));
 // one real action: tap the tutorial's target (the Rover) and see the camp saved on this origin
 const st=await page.evaluate(()=>window.VWGuide?.step?.target??null);if(st?.kind==='cell'){const x=await page.locator(`#board [data-index="${st.index}"]`).boundingBox();await page.touchscreen.tap(x.x+x.width/2,x.y+x.height/2);await page.waitForTimeout(2000);}
 const after=await page.evaluate(()=>{const raw=localStorage.getItem('vaultwake-v5-coast');const s=raw&&JSON.parse(raw);return {saved:!!s,moves:s?.moves??null,items:s?s.board.filter(x=>x?.type==='item').length:null};});
 if(OUT)await page.screenshot({path:`${OUT}/preview-${engine}-iphone13.png`});
 rows.push({engine,device:dev,status:resp?.status(),firstBoardMs:firstBoard,...info,after,errors,failed});await b.close();}
 console.log(JSON.stringify(rows,null,1));
 const bad=rows.filter(r=>r.errors.length||!r.tiles||!r.after.saved);process.exit(bad.length?1:0);})().catch(e=>{console.error(e);process.exit(1);});
