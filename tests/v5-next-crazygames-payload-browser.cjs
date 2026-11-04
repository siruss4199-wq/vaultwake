// Real network bytes transferred before the first playable CrazyGames SDK gameplayStart event.
// Must be run against the EXTRACTED RELEASE ZIP, not the development checkout.
const assert=require('node:assert/strict');
const {chromium,webkit,firefox}=require('playwright');
const {throughHome}=require('./v5-next-home-helper.cjs');
const URL=process.env.CG_URL||'http://127.0.0.1:8081/index.html';
const SDK=`window.__cg=[];window.CrazyGames={SDK:{environment:'crazygames',init:async()=>{__cg.push('init')},
game:{loadingStart(){__cg.push('loadingStart')},loadingStop(){__cg.push('loadingStop')},gameplayStart(){__cg.push('gameplayStart')},gameplayStop(){__cg.push('gameplayStop')},happytime(){},settings:{muteAudio:false},addSettingsChangeListener(){}},
ad:{requestAd(){throw Error('Basic Launch must not request ads')}}}}`;
const MB=1024*1024;
(async()=>{
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit],['firefox',firefox]]){
  const browser=await engine.launch();
  try{
   for(const [width,height] of [[390,844],[907,510]]){
    const context=await browser.newContext({viewport:{width,height},hasTouch:width<500,isMobile:width<500&&name==='chromium'});
    const page=throughHome(await context.newPage());
    const local=[],bad=[],failed=[];
    page.on('response',response=>{
     if(response.url().startsWith('http://127.0.0.1:8081/')){
      local.push(response);
      if(response.status()>=400)bad.push(response.status()+' '+response.url());
     }
    });
    page.on('requestfailed',request=>failed.push(request.url()));
    await page.route('https://sdk.crazygames.com/**',route=>route.fulfill({status:200,contentType:'application/javascript',body:SDK}));
    await page.goto(URL);
    await page.waitForSelector('#board .tile');
    await page.waitForFunction(()=>window.__cg?.includes('gameplayStart'),null,{timeout:10000});
    // Freeze the list at gameplayStart; later lazily loaded screens don't belong to initial download.
    const initial=local.slice();
    const responseBytes=await Promise.all(initial.map(async response=>({
      path:new URL(response.url()).pathname,
      bytes:(await response.body()).byteLength
    })));
    const total=responseBytes.reduce((n,x)=>n+x.bytes,0);
    const limit=(width<500?20:50)*MB;
    assert.deepEqual(bad,[],name+' '+width+': no missing release assets');
    assert.deepEqual(failed,[],name+' '+width+': no failed release requests');
    assert.ok(total<=limit, name+' '+width+': downloaded '+(total/MB).toFixed(2)+' MB before gameplayStart, limit '+(limit/MB)+' MB');
    console.log(JSON.stringify({engine:name,viewport:width+'x'+height,initialBytes:total,initialMB:+(total/MB).toFixed(3),
      limitMB:limit/MB,requests:responseBytes.length,top5:responseBytes.sort((a,b)=>b.bytes-a.bytes).slice(0,5)}));
    await context.close();
   }
  }finally{await browser.close();}
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
