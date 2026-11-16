// A NEW player's first minutes on the CrazyGames page, played through the real UI at human pace (retention task,
// 2026-11-14). Same idea as the 2026-11-12 audit session, for the First Session 2.0 build: the board opens by itself,
// so there is no Home or story to read. Each action: THINK ms to decide (+2 s the first time an action kind is met),
// then a real touch tap or pointer drag. The player does what the game's own guide line shows (window.VWGuide.step,
// the Adaptive tutorial) and, after it, the model used by tests/v5-next-first10-metrics.mjs ("guide"): the guide's
// step, generator copies merged at once ("Merge it with yours"), and tidying (a spare pair, a crate) once two free
// spaces or fewer are left. Logs a timeline (t = seconds since the page opened), a snapshot every 30 s, every
// dialog, toast and moment, and screenshots at the firsts. No virtual time, no injected resources.
//   URL=http://127.0.0.1:8080/v5/coast-crazygames.html OUT=<dir> MINUTES=10 [W=390 H=664 ENGINE=chromium VIDEO=1]
//   NODE_PATH=$(npm root -g) node docs/evidence/v5-first-10-minutes-2026-11-14/tools/session.cjs
const fs=require('fs'),path=require('path');const {chromium,webkit}=require('playwright');
const OUT=process.env.OUT,MIN=+(process.env.MINUTES||10),THINK=+(process.env.THINK||1500),ENGINE=process.env.ENGINE||'chromium';
const W=+(process.env.W||390),H=+(process.env.H||664),URL=process.env.URL||'http://127.0.0.1:8080/v5/coast-crazygames.html',KEY='vaultwake-v5-coast';
fs.mkdirSync(OUT,{recursive:true});const delay=ms=>new Promise(r=>setTimeout(r,ms));
// a CrazyGames SDK stand-in: initialises at once, an empty cloud (a new guest), records the lifecycle calls
const SDK="window.__cg=[];const __d=window.__vwd={};window.CrazyGames={SDK:{environment:'crazygames',init:async()=>{__cg.push(['init',performance.now()])},data:{getItem:k=>__d[k]??null,setItem:(k,v)=>{__d[k]=String(v)},removeItem:k=>{delete __d[k]},clear:()=>{for(const k in __d)delete __d[k]},syncUnityGameData(){}},user:{isUserAccountAvailable:false,getUser:async()=>null,addAuthListener(){},removeAuthListener(){}},game:{settings:{muteAudio:false},loadingStart(){__cg.push(['loadingStart',performance.now()])},loadingStop(){__cg.push(['loadingStop',performance.now()])},gameplayStart(){__cg.push(['gameplayStart',performance.now()])},gameplayStop(){__cg.push(['gameplayStop',performance.now()])},happytime(){__cg.push(['happytime',performance.now()])},addSettingsChangeListener(){},removeSettingsChangeListener(){}},ad:{requestAd(t,c){__cg.push(['ad',t]);c?.adError?.()},hasAdblock:async()=>false}}};";
(async()=>{
 const b=await {chromium,webkit}[ENGINE].launch();
 const ctx=await b.newContext({viewport:{width:W,height:H},isMobile:ENGINE==='chromium',hasTouch:true,reducedMotion:'no-preference',...(process.env.VIDEO?{recordVideo:{dir:OUT,size:{width:W,height:H}}}:{})});
 const page=await ctx.newPage();
 const T0=Date.now(),t=()=>+((Date.now()-T0)/1000).toFixed(1),log=[],snaps=[],errors=[],hints=[];
 const ev=(e,x={})=>{const r={t:t(),e,...x};log.push(r);console.log(JSON.stringify(r));};
 page.on('pageerror',e=>errors.push({t:t(),m:String(e)}));page.on('console',m=>{if(m.type()==='error')errors.push({t:t(),m:m.text()});});
 await page.route(u=>!u.href.startsWith('http://127.0.0.1:'),r=>r.abort());
 await page.route('https://sdk.crazygames.com/**',r=>r.fulfill({contentType:'application/javascript',body:SDK}));
 await page.addInitScript(()=>{window.__dlg=[];addEventListener('DOMContentLoaded',()=>{const seen=new WeakSet();new MutationObserver(()=>{
   for(const d of document.querySelectorAll('dialog[open],.moment,.energyNote,.restoredCard')){if(seen.has(d))continue;seen.add(d);__dlg.push({at:performance.now(),id:d.id||d.className,text:(d.innerText||'').replace(/\s+/g,' ').slice(0,180)});}}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['open','hidden','class']});});});
 const shot=async n=>{await page.screenshot({path:path.join(OUT,`${String(Math.round(t())).padStart(4,'0')}s-${n}.png`)});};
 const read=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)??window.__vwd?.[k]??'null'),KEY).catch(()=>null);
 const tapAt=async loc=>{await loc.waitFor({state:'visible',timeout:8000});const p=await loc.evaluate(async el=>{el.scrollIntoView({block:'nearest',behavior:'instant'});await new Promise(requestAnimationFrame);const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};});await page.touchscreen.tap(p.x,p.y);};
 const cell=i=>page.locator(`#board [data-index="${i}"]`);
 const drag=async(a,c)=>{const x=await cell(a).boundingBox(),y=await cell(c).boundingBox();await page.mouse.move(x.x+x.width/2,x.y+x.height/2);await page.mouse.down();for(let k=1;k<=10;k++){await page.mouse.move(x.x+x.width/2+(y.x-x.x)*k/10,x.y+x.height/2+(y.y-x.y)*k/10);await delay(25);}await page.mouse.up();};
 await page.goto(URL);ev('page opened');
 await page.waitForSelector('#board .tile',{timeout:30000});await page.waitForFunction(()=>document.body.classList.contains('homeOpen')===false||!document.querySelector('#home:not([hidden])'),null,{timeout:30000}).catch(()=>{});
 ev('board visible');await delay(400);await shot('board-first');
 const dismiss=async()=>{for(let i=0;i<12;i++){
  if(await page.locator('#beat[open]').count()){ev('story card',{text:(await page.locator('#beat').innerText()).replace(/\s+/g,' ').slice(0,140)});await delay(2500);await tapAt(page.locator('#beatNext'));await delay(300);continue;}
  if(await page.locator('#daily[open]').count()){ev('daily offer');await delay(1200);await tapAt(page.locator('#daily .close'));continue;}
  if(await page.locator('#endDialog[open]').count()){ev('end dialog');await tapAt(page.locator('#endDialog .close'));continue;}
  if(await page.locator('#coastMap[open]').count()){const back=page.locator('#coastMap [data-done]');if(await back.count()){await delay(2500);await tapAt(back.first());}else await tapAt(page.locator('#coastMap>.close'));ev('coast closed');continue;}
  break;}};
 // the action: the guide's own step while it shows one, else the simulation's "guide" model, on the camp as saved
 const decide=()=>page.evaluate(async k=>{
  const st=window.VWGuide?.step;const raw=localStorage.getItem(k)??window.__vwd?.[k]??null;
  if(!raw)return st?.action?{a:st.action,src:'guide',line:st.what}:null;
  const base=new URL('next/',document.baseURI).href,g=await import(base+'game.mjs'),{tutorStep}=await import(base+'tutor.mjs'),{nextAction}=await import(new URL('../tests/v5-next-policy.mjs',document.baseURI).href);
  const s=g.load(raw,Date.now()),free=s.board.filter(x=>x===null).length,b=s.board,gs=b.flatMap((x,i)=>x?.type==='source'?[i]:[]);
  for(const i of gs)for(const j of gs)if(i<j&&g.generatorsMerge(b[i],b[j]))return {a:{type:'merge',from:j,to:i},src:'copies'};
  const step=tutorStep(s,{now:Date.now()}),a=step?.action;
  if(a?.type==='produce'&&free<=2){const n=nextAction({...s,book:{claimed:[...new Set([...s.book.claimed,...s.found])],pages:[...g.BOOK_CHAINS]}});if(n&&['merge','openKit','unseal'].includes(n.type))return {a:n,src:'tidy'};}
  if(a)return {a,src:st?.level&&st.level!=='quiet'?'guide':'hint',line:step.what};
  const n=nextAction(s);return n&&!['book','bookPage'].includes(n.type)?{a:n,src:'policy'}:null;},KEY);
 const firsts={};const first=(k,x={})=>{if(!firsts[k]){firsts[k]=t();ev('FIRST '+k,x);return true;}return false;};
 let nextSnap=0,lastHint='',lvl=1;const end=T0+MIN*60000,seenKinds=new Set();
 while(Date.now()<end){
  await dismiss();const s=await read();
  if(s&&t()>=nextSnap){const free=s.board.filter(x=>x===null).length;
   snaps.push({t:t(),energy:s.energy,coins:s.coins,level:s.level.level,orders:s.ordersDone,merges:s.merges,stages:Object.values(s.built).reduce((a,b)=>a+b,0),free,items:s.board.filter(x=>x?.type==='item').length,cargo:s.board.filter(x=>x?.type==='cargo').length,glass:s.board.filter(x=>x?.type==='glass').length,gens:s.board.filter(x=>x?.type==='source').map(x=>x.id+(x.level??1)).join(',')});
   if([60,120,180,300,420,600].some(m=>Math.abs(t()-m)<16))await shot('snapshot');nextSnap+=30;}
  const h=(await page.locator('#hint').innerText().catch(()=>'')).replace(/\s+/g,' ').trim();if(h&&h!==lastHint){hints.push({t:t(),h});lastHint=h;}
  if(s&&s.level.level>lvl){ev('level up',{level:s.level.level});lvl=s.level.level;}
  const d=await decide();if(!d){await delay(2000);continue;}
  const a=d.a;await delay(THINK+(seenKinds.has(a.type)?0:2000));seenKinds.add(a.type);
  const before=s;
  try{
   if(a.type==='produce')await tapAt(cell(Number.isInteger(a.index)?a.index:(before?.board??[]).findIndex(x=>x?.type==='source'&&x.id===a.id)));
   else if(a.type==='merge'||a.type==='unseal')await drag(a.from,a.to??a.index);
   else if(a.type==='deliver'){const c=page.locator(`#requests [data-order="${a.id}"]`);const btn=c.locator('.reqDeliver');await tapAt(await btn.count()?btn:c);}
   else if(a.type==='restore'){await tapAt(page.locator('#mapButton'));await page.waitForSelector('#coastMap[open]');await delay(1200);if(first('coast opened'))await shot('coast');
     const bt=page.locator(`#coastMap [data-restore="${a.id}"]`);if(!await bt.count()){const pl=page.locator(`#coastMap [data-place="${a.id}"] button`);if(await pl.count())await tapAt(pl.first());await delay(600);}
     await tapAt(bt.first());await delay(2600);await shot('restored');await dismiss();}
   else if(a.type==='openKit'){await tapAt(cell(a.index));await delay(400);const o=page.locator('#selection [data-action="openKit"]');if(await o.count())await tapAt(o);}
   else {ev('unsupported',{a});await delay(1500);continue;}
  }catch(e){ev('action failed',{a,err:String(e).slice(0,300)});await shot('failed');await page.keyboard.press('Escape').catch(()=>{});await delay(800);continue;}
  await delay(450);const after=await read();if(!after)continue;
  const did=!before||after.moves>before.moves||Object.values(after.built).reduce((x,y)=>x+y,0)>Object.values(before.built).reduce((x,y)=>x+y,0);
  ev(a.type,{src:d.src,ok:did,line:d.line,energy:after.energy,coins:after.coins,orders:after.ordersDone,stages:Object.values(after.built).reduce((x,y)=>x+y,0),msg:(await page.locator('#message').innerText().catch(()=>'')).slice(0,120)});
  if(a.type==='produce'&&did&&first('tap'))await shot('first-tap');
  if(a.type==='merge'&&did&&first('merge'))await shot('first-merge');
  if(a.type==='deliver'&&did){const o=(before?.orders??after.orders).find(o=>o?.id===a.id);if(o?.story){if(first('gold delivered'))await shot('gold');}else if(first('crew delivered'))await shot('first-delivery');}
  const n=Object.values(after.built).reduce((x,y)=>x+y,0);if(n>0&&first('stage '+n))null;
  const kite=after.board.some(x=>x?.type==='source'&&x.id!=='rig');if(kite&&first('second generator'))await shot('second-generator');
 }
 const dl=await page.evaluate(()=>window.__dlg.map(d=>({t:+(d.at/1000).toFixed(1),id:d.id,text:d.text})));const cg=await page.evaluate(()=>window.__cg);
 await shot('end');
 fs.writeFileSync(path.join(OUT,'session.json'),JSON.stringify({engine:ENGINE,viewport:`${W}x${H}`,think:THINK,url:URL,firsts,log,snaps,hints,dialogs:dl,cg,errors,final:await read()},null,1));
 await ctx.close();await b.close();console.log('done',JSON.stringify(firsts));
})().catch(e=>{console.error(e);process.exit(1);});
