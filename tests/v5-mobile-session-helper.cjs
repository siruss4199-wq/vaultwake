// Real UI actions shared by the mobile matrix and optional paced QA run.
const {throughHome}=require('./v5-next-home-helper.cjs');
const KEY='vaultwake-v5-coast';
async function mobileSession(browser,{width=390,height=664,url='http://127.0.0.1:8080/v5/play.html',engine='chromium',motion='reduce'}={}){
 const context=await browser.newContext({viewport:{width,height},isMobile:engine==='chromium',hasTouch:true,reducedMotion:motion});
 const page=throughHome(await context.newPage()),errors=[],actions=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.__mobileNotes=[];window.__visibility=[];addEventListener('visibilitychange',()=>__visibility.push(document.visibilityState));addEventListener('DOMContentLoaded',()=>new MutationObserver(()=>{for(const e of document.querySelectorAll('.energyNote,.moment,#beatContent'))if(e.textContent&&!__mobileNotes.includes(e.textContent))__mobileNotes.push(e.textContent);}).observe(document.body,{childList:true,subtree:true,characterData:true}));});
 await page.route('https://sdk.crazygames.com/**',r=>r.fulfill({contentType:'application/javascript',body:"window.CrazyGames={SDK:{environment:'crazygames',init:async()=>{},game:{settings:{muteAudio:false},loadingStart(){},loadingStop(){},gameplayStart(){},gameplayStop(){},happytime(){},addSettingsChangeListener(){}},ad:{requestAd(){throw Error('Unexpected ad during mobile QA')}}}};"}));
 const read=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
 const beats=async()=>{for(let i=0;i<15&&await page.locator('#beat[open]').count();i++)await page.locator('#beatNext').click();};
 const dismiss=async()=>{await beats();if(await page.locator('#daily[open]').count())await page.locator('#daily .close').click();};
 const cell=i=>page.locator(`#board [data-index="${i}"]`);
 const select=async i=>{if(await cell(i).getAttribute('aria-pressed')!=='true')await cell(i).tap();};
 const drag=async(a,b)=>{await page.locator('#board').scrollIntoViewIfNeeded();const x=await cell(a).boundingBox(),y=await cell(b).boundingBox();await page.mouse.move(x.x+x.width/2,x.y+x.height/2);await page.mouse.down();await page.mouse.move(y.x+y.width/2,y.y+y.height/2,{steps:8});await page.mouse.up();};
 async function perform(a){
  await dismiss();const before=await read();
  if(a.type==='produce')await cell(Number.isInteger(a.index)?a.index:before.board.findIndex(x=>x?.type==='source'&&x.id===a.id)).tap();
  else if(a.type==='merge'||a.type==='unseal')await drag(a.from,a.to??a.index);
  else if(a.type==='deliver')await page.locator(`[data-order="${a.id}"]`).tap();
  else if(a.type==='restore'){
   await page.locator('#mapButton').tap();await page.locator(`#coastMap [data-place="${a.id}"] button`).tap();await page.locator(`#coastMap [data-restore="${a.id}"]`).tap();await beats();
   if(await page.locator('#coastMap[open]').count())await page.locator('#coastMap [data-back]').tap();
  }else if(a.type==='book'||a.type==='bookPage'){
   await page.locator('#bookButton').tap();await page.locator(a.type==='book'?`#book [data-key="${a.key}"]`:`#book [data-page="${a.family}"]`).tap();await page.locator('#book .close').tap();
  }else if(a.type==='openKit'){await select(a.index);await page.locator('#selection [data-action="openKit"]').tap();}
  else if(a.type==='recycle'){await select(a.index);const b=page.locator('#selection [data-action="recycle"]'),confirm=await b.getAttribute('data-confirm');await b.tap();if(confirm)await page.locator('#selection [data-action="recycle"]').tap();}
  else if(a.type==='store'){await select(a.index);await page.locator('#selection [data-action="store"]').tap();}
  else if(a.type==='unstore'){if(!await page.locator(`#shed [data-slot="${a.slot}"]`).isVisible())await page.locator('#shed [data-shed-toggle]').tap();await page.locator(`#shed [data-slot="${a.slot}"]`).tap();}
  else if(a.type==='ration')await page.locator('#rationButton').tap();
  else throw Error('Unsupported UI action '+JSON.stringify(a));
  await page.waitForFunction(([key,moves])=>JSON.parse(localStorage.getItem(key)).moves>moves,[KEY,before.moves],{timeout:5000});
  const after=await read();actions.push({action:a,moves:after.moves,energy:after.energy,coins:after.coins,built:Object.values(after.built).reduce((x,y)=>x+y,0),orders:after.ordersDone});await dismiss();return after;
 }
 async function coachAction(){return page.evaluate(async k=>{
  const {coachStep}=await import('/v5/next/coach.mjs'),{load}=await import('/v5/next/game.mjs');const s=load(localStorage.getItem(k),Date.now()),c=coachStep(s);if(!c)return null;
  const t=c.target,g=c.advice;let action;
  if(t?.kind==='cell')action={type:'produce',index:t.index,id:s.board[t.index].id};
  else if(t?.kind==='pair')action={type:s.board[t.cells[1]]?.type==='cargo'?'unseal':'merge',from:t.cells[0],to:t.cells[1],index:t.cells[1]};
  else if(t?.kind==='order')action={type:'deliver',id:t.id};
  else if(t?.kind==='strip')action={type:'restore',id:'beach-path'};
  else if(g?.kind==='tap')action={type:'produce',index:g.index,id:g.id};
  else if(g?.kind==='merge'||g?.kind==='unseal')action={type:g.kind,from:g.cells[0],to:g.cells[1],index:g.cells[1]};
  else if(g?.kind==='deliver')action={type:'deliver',id:g.id};
  return {id:c.id,text:c.text,target:t,action};
 },KEY);}
 const nextAction=()=>page.evaluate(async k=>{const {nextAction}=await import('/tests/v5-next-policy.mjs');return nextAction(JSON.parse(localStorage.getItem(k)));},KEY);
 await page.goto(url);await page.waitForSelector('#board .tile');await dismiss();
 return {context,page,errors,actions,read,perform,coachAction,nextAction,dismiss};
}
module.exports={mobileSession,KEY};
