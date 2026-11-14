// Cold/warm start of Coast Camp on a throttled phone, against the Cloudflare-like server (cfserver.mjs).
// usage: node measure.cjs <label> [runs]  env: PROFILE=slow4g|4g|none  PAGE=play|cg  SEED=returning  ENGINE=chromium|webkit  BASE=https://127.0.0.1:8443
const {chromium,webkit}=require('playwright');const fs=require('fs');const path=require('path');
const [label='run',runs='3']=process.argv.slice(2);
const P={slow4g:{lat:150,down:1.6e6/8,up:750e3/8,cpu:4},'4g':{lat:70,down:9e6/8,up:3e6/8,cpu:2},none:null}[process.env.PROFILE||'slow4g'];
const CG=process.env.PAGE==='cg',BASE=process.env.BASE||'https://127.0.0.1:8443';
const URL=BASE+(CG?'/v5/coast-crazygames.html':'/v5/play.html');
const SDK=`(()=>{const m=new Map();window.CrazyGames={SDK:{environment:'crazygames',init:async()=>{await new Promise(r=>setTimeout(r,${+process.env.SDK_INIT||600}));},
 game:{loadingStart(){},loadingStop(){},gameplayStart(){},gameplayStop(){},happytime(){},settings:{muteAudio:false},addSettingsChangeListener(){}},ad:{requestAd(t,cb){cb.adError&&cb.adError()}},
 user:{getUser:async()=>null,addAuthListener(){},isUserAccountAvailable:true},data:{getItem:k=>m.has(k)?m.get(k):null,setItem(k,v){m.set(k,String(v));window.__cgWrote=true},removeItem(k){m.delete(k)},clear(){m.clear()}}}};})();`;
const probe=()=>{const t={};window.__t=t;const mark=(k,c)=>{if(!t[k]&&c())t[k]=performance.now();};
 const tick=()=>{try{const h=document.querySelector('#home'),b=document.querySelectorAll('#board .tile').length;
  mark('homeVisible',()=>h&&!h.hidden&&h.getBoundingClientRect().height>0);
  mark('homeArt',()=>{const i=document.querySelector('#home img');return i&&i.complete&&i.naturalWidth>0;});
  mark('module',()=>!!window.VWGuide||!!window.VWSave);
  mark('continue',()=>{const p=document.querySelector('#homePlay');return p&&!p.hidden&&!p.disabled&&/Continue/.test(p.textContent);});
  mark('board',()=>b===49&&(!h||h.hidden||!document.body.classList.contains('homeOpen')));
  mark('guide',()=>t.board&&!!window.VWGuide?.step);
  mark('boardArt',()=>t.board&&[...document.querySelectorAll('#board .tile img')].every(i=>i.complete&&i.naturalWidth>0));
 }catch{}if(!t.boardArt||!t.continue&&!t.guide)requestAnimationFrame(tick);};requestAnimationFrame(tick);};
(async()=>{const out=[];const engine=process.env.ENGINE||'chromium';
 const b=await ({chromium,webkit})[engine].launch({args:engine==='chromium'?['--host-resolver-rules=MAP qa.crazygames.com 127.0.0.1','--ignore-certificate-errors','--no-proxy-server']:[]});
 for(let r=0;r<+runs;r++){
  const ctx=await b.newContext({viewport:{width:390,height:664},deviceScaleFactor:3,isMobile:engine==='chromium',hasTouch:true,ignoreHTTPSErrors:true});
  if(CG)await ctx.route('https://sdk.crazygames.com/**',async rt=>{await new Promise(r=>setTimeout(r,+process.env.SDK_FETCH||400));rt.fulfill({contentType:'application/javascript',body:SDK});});
  if(process.env.SEED==='returning'){const g=await import(path.join(__dirname,'..','..','..','..','v5','next','game.mjs'));const s=g.fresh(Date.now());s.seen={'coach-on':true,'coach-done':true};s.moves=40;s.daily={day:9e6,count:1};
   await ctx.addInitScript(v=>{try{if(!localStorage.getItem('vaultwake-v5-coast'))localStorage.setItem('vaultwake-v5-coast',v);}catch{}},JSON.stringify(s));}
  await ctx.addInitScript(probe);
  const page=await ctx.newPage();const reqs=new Map();let cdp=null;
  if(engine==='chromium'){cdp=await ctx.newCDPSession(page);await cdp.send('Network.enable');
   if(P){await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:P.lat,downloadThroughput:P.down,uploadThroughput:P.up});await cdp.send('Emulation.setCPUThrottlingRate',{rate:P.cpu});}
   cdp.on('Network.requestWillBeSent',e=>reqs.set(e.requestId,{url:e.request.url,type:e.type,start:e.timestamp,prio:e.request.initialPriority}));
   cdp.on('Network.responseReceived',e=>{const q=reqs.get(e.requestId);if(q){q.status=e.response.status;q.proto=e.response.protocol;q.resp=e.timestamp;q.type=e.type;}});
   cdp.on('Network.loadingFinished',e=>{const q=reqs.get(e.requestId);if(q){q.end=e.timestamp;q.bytes=e.encodedDataLength;}});
   cdp.on('Network.loadingFailed',e=>{const q=reqs.get(e.requestId);if(q){q.end=e.timestamp;q.failed=e.errorText;}});}
  const passes=process.env.WARM?2:1;let m;
  for(let pass=0;pass<passes;pass++){reqs.clear();
   const t0=Date.now();await page.goto(URL,{waitUntil:'commit',referer:CG?'https://www.crazygames.com/game/vaultwake-merge':undefined});
   await page.waitForFunction(()=>window.__t&&(window.__t.guide||window.__t.continue)&&window.__t.boardArt||window.__t?.continue,null,{timeout:120000,polling:200});
   await page.waitForTimeout(1500);
   m=await page.evaluate(()=>{const nav=performance.getEntriesByType('navigation')[0],fcp=performance.getEntriesByName('first-contentful-paint')[0];
    return {...window.__t,fcp:fcp?.startTime,dcl:nav?.domContentLoadedEventEnd,load:nav?.loadEventEnd};});
   // first real action: tap the generator (new player) and time until the game answers
   if(m.guide){const t=await page.evaluate(()=>{const g=document.querySelector('#board .tile.source, #board [data-index] .source')?.closest('[data-index]')||document.querySelector('#board .coachTarget');const r=g.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};});
    const before=await page.evaluate(()=>performance.now());await page.touchscreen.tap(t.x,t.y);
    await page.waitForFunction(()=>!!localStorage.getItem('vaultwake-v5-coast')||!!window.__cgWrote,null,{timeout:20000}).catch(()=>{});
    m.firstActionMs=Math.round(await page.evaluate(()=>performance.now())-before);}
  }
  const list=[...reqs.values()].filter(q=>q.start);const s0=Math.min(...list.map(q=>q.start));
  const rows=list.map(q=>({url:q.url.replace(BASE,'').replace(/^https:\/\/sdk\.crazygames\.com/,'SDK'),type:q.type,status:q.status,proto:q.proto,start:Math.round((q.start-s0)*1000),end:q.end?Math.round((q.end-s0)*1000):null,kb:q.bytes!=null?+(q.bytes/1024).toFixed(1):null})).sort((a,c)=>a.start-c.start);
  const ready=m.guide??m.continue;const before=rows.filter(x=>x.start<=ready);
  const sum={label,engine,profile:process.env.PROFILE||'slow4g',page:CG?'cg':'play',seed:process.env.SEED||'new',warm:!!process.env.WARM,
   fcp:Math.round(m.fcp),homeVisible:Math.round(m.homeVisible),module:Math.round(m.module),board:Math.round(m.board),ready:Math.round(ready),boardArt:Math.round(m.boardArt),load:Math.round(m.load),firstActionMs:m.firstActionMs,
   reqsBeforeReady:before.length,kbBeforeReady:+before.reduce((a,x)=>a+(x.kb||0),0).toFixed(0),reqsTotal:rows.length,kbTotal:+rows.reduce((a,x)=>a+(x.kb||0),0).toFixed(0)};
  out.push(sum);console.log(JSON.stringify(sum));
  if(r===0)fs.writeFileSync(path.join(__dirname,`wf-${label}.json`),JSON.stringify({sum,rows},null,0));
  await ctx.close();}
 await b.close();
 const med=k=>{const v=out.map(o=>o[k]).filter(x=>x!=null).sort((a,b)=>a-b);return v[Math.floor(v.length/2)];};
 console.log('MEDIAN',JSON.stringify(Object.fromEntries(['fcp','homeVisible','module','board','ready','boardArt','load','firstActionMs','reqsBeforeReady','kbBeforeReady','reqsTotal','kbTotal'].map(k=>[k,med(k)]))));
})().catch(e=>{console.error(e);process.exit(1);});
