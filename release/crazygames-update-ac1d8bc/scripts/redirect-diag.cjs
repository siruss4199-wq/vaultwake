// CrazyGames update ac1d8bc, WebKit "#home is null" investigation: the extracted ZIP's entry page, index.html, is a
// one-line redirect (location.replace("v5/coast-crazygames.html"+location.search)). For each of N fresh loads this
// records what page.goto() hands back: the document's URL, readyState and whether #home exists at that moment; then
// whether the redirect lands on v5/coast-crazygames.html, the game boots (Home's button or the board) and how long it
// took; page errors, failed requests and outside origins. A stand-in CrazyGames SDK v3 answers sdk.crazygames.com.
// It must run in the engine asked for (ENGINE chromium|webkit): the launched browser's own name is checked.
// Exit 0 only when every load reaches the game page and boots, with no page error or failed request.
const {chromium,webkit}=require('playwright');
const ORIGIN=process.env.ZIP_ORIGIN||'http://127.0.0.1:8081',ENGINE=process.env.ENGINE||'chromium',N=+(process.env.N||15);
const STUB=`(()=>{window.CrazyGames={SDK:{environment:'crazygames',init:async()=>{},game:{loadingStart(){},loadingStop(){},gameplayStart(){},gameplayStop(){},happytime(){},settings:{muteAudio:false},addSettingsChangeListener(){}},
 ad:{requestAd(t,c){c?.adError?.('none');},hasAdblock:async()=>false},user:{isUserAccountAvailable:true,getUser:async()=>null,addAuthListener(){},removeAuthListener(){}},
 data:{getItem:()=>null,setItem(){},removeItem(){},clear(){}}}};})();`;
(async()=>{const browser=await {chromium,webkit}[ENGINE].launch(),used=browser.browserType().name();
 if(used!==ENGINE)throw new Error(`asked for ${ENGINE}, launched ${used}`);
 const rows=[];
 for(let n=0;n<N;n++){const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:ENGINE==='chromium',hasTouch:true}),page=await ctx.newPage(),errors=[],failed=[],outside=new Set();
  await ctx.route('https://sdk.crazygames.com/**',r=>r.fulfill({contentType:'application/javascript',body:STUB}));
  page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failed.push(r.url()));
  page.on('response',r=>{if(r.status()>=400)failed.push(r.status()+' '+r.url());});
  page.on('request',r=>{const u=new URL(r.url());if(u.origin!==ORIGIN&&u.host!=='sdk.crazygames.com')outside.add(u.origin);});
  const t0=Date.now();await page.goto(ORIGIN+'/index.html');
  // the very moment goto() returns: which document is it?
  const atGoto=await page.evaluate(()=>({path:location.pathname,ready:document.readyState,home:!!document.querySelector('#home')})).catch(e=>({error:e.message.split('\n')[0]}));
  let landed=null,booted=null;
  try{await page.waitForURL(/\/v5\/coast-crazygames\.html/,{timeout:20000});landed=Date.now()-t0;
   await page.waitForSelector('#homePlay:not([hidden]), #board .tile',{timeout:30000});booted=Date.now()-t0;}catch(e){errors.push('wait: '+e.message.split('\n')[0]);}
  const end=await page.evaluate(()=>({path:location.pathname,home:!!document.querySelector('#home'),homeShown:!!document.querySelector('#home')&&!document.querySelector('#home').hidden,board:document.querySelectorAll('#board .tile').length})).catch(e=>({error:e.message.split('\n')[0]}));
  rows.push({n,atGoto,landedMs:landed,bootedMs:booted,end,errors,failed,outside:[...outside]});await ctx.close();}
 const version=browser.version();await browser.close();
 const onEntry=rows.filter(r=>r.atGoto.path==='/index.html').length,homeNullAtGoto=rows.filter(r=>r.atGoto.home===false).length;
 const ok=rows.every(r=>r.landedMs!==null&&r.bootedMs!==null&&r.end.path==='/v5/coast-crazygames.html'&&!r.errors.length&&!r.failed.length&&!r.outside.length);
 console.log(JSON.stringify({engine:used,version,loads:N,gotoReturnedOnIndexHtml:onEntry,homeNullWhenGotoReturned:homeNullAtGoto,
  allReachedGamePage:rows.every(r=>r.end.path==='/v5/coast-crazygames.html'),allBooted:rows.every(r=>r.bootedMs!==null),
  bootMs:{min:Math.min(...rows.map(r=>r.bootedMs??Infinity)),max:Math.max(...rows.map(r=>r.bootedMs??0))},verdict:ok?'PASS':'FAIL',rows},null,1));
 process.exit(ok?0:1);
})().catch(e=>{console.error(e);process.exit(1);});
