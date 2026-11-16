// Release audit: the packaged ZIP itself (served as unpacked), its index.html, a stand-in CrazyGames SDK v3 that
// records every call. A new player plays the real guide to the first Build, back to the board, reload → Continue.
// Records: failed requests (4xx/5xx, failed loads), console errors, page errors, the SDK call order, requests that
// leave the origin, bytes before gameplayStart, and the save written.
const {chromium}=require('playwright');const ORIGIN=process.env.ZIP_ORIGIN||'http://127.0.0.1:8084';
const STUB=`(()=>{const log=window.__sdk=[];const rec=n=>(...a)=>{log.push(n);};const store=new Proxy(JSON.parse(localStorage.getItem('__cgdata')||'{}'),{set(t,k,v){t[k]=v;localStorage.setItem('__cgdata',JSON.stringify(t));return true;},deleteProperty(t,k){delete t[k];localStorage.setItem('__cgdata',JSON.stringify(t));return true;}});
 window.CrazyGames={SDK:{environment:'crazygames',init:async()=>{log.push('init');},
  game:{loadingStart:rec('loadingStart'),loadingStop:rec('loadingStop'),gameplayStart:rec('gameplayStart'),gameplayStop:rec('gameplayStop'),happytime:rec('happytime'),settings:{muteAudio:false},addSettingsChangeListener(){}},
  ad:{requestAd(t,c){log.push('requestAd:'+t);c?.adError?.('none');},hasAdblock:async()=>false},
  user:{isUserAccountAvailable:true,getUser:async()=>null,addAuthListener(){},removeAuthListener(){}},
  data:{getItem:k=>(k in store?store[k]:null),setItem:(k,v)=>{store[k]=String(v);log.push('data.setItem:'+k);},removeItem:k=>{delete store[k];},clear(){for(const k in store)delete store[k];}}}};})();`;
const delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch(),ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await ctx.newPage();
 const failed=[],consoleErr=[],pageErr=[],outside=new Set();let bytes=0,bytesAtStart=null;
 await ctx.route('https://sdk.crazygames.com/**',r=>r.fulfill({contentType:'application/javascript',body:STUB}));
 page.on('requestfailed',r=>failed.push('FAILED '+r.url()));page.on('response',async r=>{if(r.status()>=400)failed.push(r.status()+' '+r.url());try{const l=+(r.headers()['content-length']||0);bytes+=l;}catch{}});
 page.on('request',r=>{const u=new URL(r.url());if(u.origin!==ORIGIN&&u.host!=='sdk.crazygames.com')outside.add(u.origin);});
 page.on('console',m=>{if(m.type()==='error')consoleErr.push(m.text());});page.on('pageerror',e=>pageErr.push(e.message));
 await page.goto(ORIGIN+'/index.html');await page.waitForSelector('#board .tile',{timeout:30000});
 await page.waitForFunction(()=>window.__sdk?.includes('gameplayStart'),null,{timeout:20000});bytesAtStart=bytes;await delay(1200);
 const tapAt=async l=>{const x=await l.boundingBox();await page.touchscreen.tap(x.x+x.width/2,x.y+x.height/2);};const cell=i=>page.locator(`#board [data-index="${i}"]`);
 const drag=async(a,c)=>{const x=await cell(a).boundingBox(),y=await cell(c).boundingBox();await page.mouse.move(x.x+x.width/2,x.y+x.height/2);await page.mouse.down();for(let k=1;k<=8;k++){await page.mouse.move(x.x+x.width/2+(y.x-x.x)*k/8,x.y+x.height/2+(y.y-x.y)*k/8);await delay(15);}await page.mouse.up();};
 const kinds=[];let built=false;
 for(let n=0;n<90;n++){await delay(650);if(await page.locator('#beat[open]').count()){await tapAt(page.locator('#beatNext'));continue;}
  const st=await page.evaluate(()=>window.VWGuide?.step);if(!st?.target)continue;if(kinds.at(-1)!==st.kind)kinds.push(st.kind);const t=st.target;
  if(t.kind==='cell')await tapAt(cell(t.index));else if(t.kind==='pair')await drag(t.cells[0],t.cells[1]);else if(t.kind==='order'){await tapAt(page.locator(`#requests [data-order="${t.id}"] .reqDeliver`));await delay(900);}
  else if(t.kind==='strip'){await tapAt(page.locator('#mapButton'));await page.waitForSelector('#coastMap[open]');await delay(1200);
   const bb=page.locator('#coastMap [data-restore].coachTarget').first();await bb.evaluate(e=>e.scrollIntoView({block:'center'}));await delay(300);await tapAt(bb);
   await page.waitForSelector('#coastMap .restoredCard',{timeout:8000});await delay(1500);built=await page.locator('#coastMap .restoredCard .rcDone').count()>0;
   const back=page.locator('#coastMap .restoredCard .rcBack');await back.evaluate(e=>e.scrollIntoView({block:'center'}));await delay(300);await tapAt(back);await delay(1500);break;}}
 const save=await page.evaluate(()=>{const d=JSON.parse(localStorage.getItem('__cgdata')||'{}'),raw=d['vaultwake-v5-coast']??localStorage.getItem('vaultwake-v5-coast');const s=JSON.parse(raw||'null');return s&&{built:s.built,coins:s.coins,moves:s.moves,done:!!s.seen?.['coach-done']};});
 const sdk1=await page.evaluate(()=>window.__sdk.slice());
 await page.reload();await page.waitForSelector('#board .tile');await delay(1500);const home=await page.evaluate(()=>document.querySelector('#homePlay:not([hidden])')?.innerText.trim()??null);
 if(home)await tapAt(page.locator('#homePlay'));await delay(1500);const after=await page.evaluate(()=>{const d=JSON.parse(localStorage.getItem('__cgdata')||'{}'),raw=d['vaultwake-v5-coast']??localStorage.getItem('vaultwake-v5-coast');return {step:window.VWGuide?.step?.kind??null,built:JSON.parse(raw||'{}').built,where:d['vaultwake-v5-coast']?'Data module':'localStorage'};});
 const sdk2=await page.evaluate(()=>window.__sdk.slice());await b.close();
 const uniq=a=>[...new Set(a)];
 console.log(JSON.stringify({guided:kinds,tutorialComplete:built,save,afterReload:{home,...after},sdkFirstLoad:uniq(sdk1).join(' '),sdkCounts:{gameplayStart:sdk1.filter(x=>x==='gameplayStart').length,loadingStart:sdk1.filter(x=>x==='loadingStart').length,loadingStop:sdk1.filter(x=>x==='loadingStop').length,requestAd:sdk1.filter(x=>x.startsWith('requestAd')).length,dataSet:sdk1.filter(x=>x.startsWith('data.setItem')).length},sdkAfterReload:uniq(sdk2).join(' '),
  failedRequests:failed,consoleErrors:consoleErr,pageErrors:pageErr,outsideOrigins:[...outside],kbBeforeGameplayStart:Math.round(bytesAtStart/1024),kbTotal:Math.round(bytes/1024)},null,1));
})().catch(e=>{console.error(e);process.exit(1);});
