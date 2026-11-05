// Optional wall-clock QA: visible UI only, no clock/resource/save injection.
// MINUTES=20 ACTION_MS=5000 SHOTS=/tmp/mobile-session node tools/v5-mobile-paced-session.cjs
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process'),{chromium,webkit}=require('playwright');
const {mobileSession}=require('../tests/v5-mobile-session-helper.cjs');
const minutes=Number(process.env.MINUTES||20),actionMs=Number(process.env.ACTION_MS||5000),engine=process.env.ENGINE||'chromium';
if(!Number.isFinite(minutes)||minutes<1||minutes>30||!Number.isFinite(actionMs)||actionMs<1000)throw Error('Invalid duration or action interval');
const out=process.env.SHOTS||'/tmp/vaultwake-paced-session';fs.mkdirSync(out,{recursive:true});
const delay=ms=>new Promise(r=>setTimeout(r,ms)),stages=s=>Object.values(s.built).reduce((a,b)=>a+b,0);
(async()=>{
 const browser=await {chromium,webkit}[engine].launch();
 try{
  const session=await mobileSession(browser,{engine,width:390,height:664,motion:'no-preference',url:process.env.QA_URL||'http://127.0.0.1:8080/v5/coast-crazygames.html'}),{page,read,perform}=session;
  const source=execFileSync('git',['rev-parse','HEAD'],{cwd:path.join(__dirname,'..'),encoding:'utf8'}).trim(),start=Date.now(),end=start+minutes*60000;
  const report={source,engine,viewport:'390x664',requestedMinutes:minutes,actionIntervalMs:actionMs,mode:'real wall-clock UI; no ads, purchases, resource injection or virtual time',sdk:'STUB; production UNVERIFIED',physicalDevice:'UNVERIFIED',firstCrewSeconds:null,firstGoldSeconds:null,firstThreeStagesSeconds:[],snapshots:[],events:[]};
  assert.equal((await read()).energy,100);assert.equal(await page.locator('html').getAttribute('data-ads'),'off');
  let nextSnapshot=0,reloaded=false,backgrounded=false,waitMs=0;
  while(Date.now()<end){
   const elapsed=Date.now()-start;
   if(elapsed>=nextSnapshot){
    const s=await read();report.snapshots.push({seconds:+(elapsed/1000).toFixed(2),orders:s.ordersDone,stages:stages(s),coins:s.coins,energy:s.energy});
    await page.screenshot({path:path.join(out,`minute-${Math.floor(elapsed/60000)}.png`)});console.log(JSON.stringify(report.snapshots.at(-1)));nextSnapshot+=5*60000;
   }
   if(!reloaded&&elapsed>=10*60000){
    const before=await read();await page.reload();await session.dismiss();const after=await read();
    for(const key of ['coins','built','board','boost','energyRewards'])assert.deepEqual(after[key],before[key],'reload preserves '+key);
    assert.ok(after.energy>=before.energy&&after.energy<=before.energy+1,'only a possible natural refill on reload');reloaded=true;report.events.push({seconds:(Date.now()-start)/1000,event:'reload preserved progress and reward receipts'});
   }
   if(!backgrounded&&elapsed>=15*60000){
    const other=await session.context.newPage();await other.goto('about:blank');await other.bringToFront();await delay(5000);await page.bringToFront();await other.close();backgrounded=true;
    report.events.push({seconds:(Date.now()-start)/1000,event:'tab roundtrip',visibilityEvents:await page.evaluate(()=>__visibility),physicalOsSuspension:'UNVERIFIED'});
   }
   const before=await read(),c=await session.coachAction(),a=c?.action??await session.nextAction(),stepStart=Date.now();
   if(a){
    const order=a.type==='deliver'?before.orders.find(o=>o.id===a.id):null,after=await perform(a),seconds=(Date.now()-start)/1000;
    if(order&&!order.story&&report.firstCrewSeconds===null)report.firstCrewSeconds=seconds;
    if(order?.story&&report.firstGoldSeconds===null)report.firstGoldSeconds=seconds;
    if(stages(after)>stages(before)&&report.firstThreeStagesSeconds.length<3)report.firstThreeStagesSeconds.push(seconds);
   }else{assert.equal(before.energy,0,'no silent policy deadlock with energy remaining');waitMs+=Math.min(actionMs,end-Date.now());}
   assert.equal(await page.locator('[data-ad]').count(),0,'Basic never exposes an ad offer');
   await delay(Math.max(0,Math.min(end-Date.now(),actionMs-(Date.now()-stepStart))));
  }
  const s=await read();report.actualSeconds=(Date.now()-start)/1000;report.actions=session.actions.length;report.energyStarvedWaitSeconds=waitMs/1000;
  report.final={energy:s.energy,coins:s.coins,orders:s.ordersDone,stages:stages(s),area:s.area};report.errors=session.errors;report.uiEvents=session.uiEvents;
  assert.deepEqual(session.errors,[]);assert.ok(stages(s)>=3,'several restorations completed');assert.ok(s.ordersDone>=3);assert.ok(report.actualSeconds>=minutes*60);
  await page.screenshot({path:path.join(out,'final.png')});fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));console.log('Paced UI session: PASS');await session.context.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
