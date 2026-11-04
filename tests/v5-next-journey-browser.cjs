// Map chapter strip: eight distinct, legible labels, horizontal scrolling without page overflow.
// Progress is read-only; an active area is centered when the map opens.
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const {throughHome}=require('./v5-next-home-helper.cjs');
const URL='http://127.0.0.1:8080/v5/play.html?dev=1';
const labels=['BEACH','SURVEY','VAULT','OBSERVATORY','HARBOUR','LIGHT','REEF','STATION'];
(async()=>{
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch();
  try{
   for(const width of [360,390,430]){
    const ctx=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
    const page=await ctx.newPage();throughHome(page);
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(URL);
    if(await page.locator('#beat[open]').count())for(let i=0;i<8&&await page.locator('#beat[open]').count();i++)await page.locator('#beatNext').tap();
    await page.locator('#mapButton').tap();
    const items=page.locator('#coastMap .journey li');
    assert.equal(await items.count(),8);
    assert.deepEqual(await items.locator('span').allTextContents(),labels);
    assert.equal(await items.locator('span').evaluateAll(els=>new Set(els.map(x=>x.textContent)).size),8);
    assert.equal(await page.locator('#coastMap .journey [aria-current="step"]').count(),1);
    assert.equal(await page.locator('#mapTitle').textContent(),'Landing Beach');
    const geometry=await page.locator('#coastMap .journey').evaluate(e=>{
      const rect=e.getBoundingClientRect();
      const kids=[...e.querySelectorAll('li')];
      return {width:rect.width,scrollWidth:e.scrollWidth,clientWidth:e.clientWidth,first:kids[0].getBoundingClientRect().width,
       labelsFit:kids.every(k=>k.querySelector('span').scrollWidth<=k.querySelector('span').clientWidth+1),
       bodyOverflow:document.documentElement.scrollWidth>innerWidth+1};
    });
    assert.ok(geometry.scrollWidth>geometry.clientWidth+100,'eight areas should scroll, not collapse');
    assert.ok(geometry.first>=98,'chips need room for readable labels');
    assert.ok(geometry.labelsFit,'no clipped one-letter labels');
    assert.equal(geometry.bodyOverflow,false,'no page overflow');
    assert.deepEqual(errors,[]);
    await page.locator('#coastMap .journey').evaluate(e=>{e.scrollLeft=e.scrollWidth;});
    assert.ok(await page.locator('#coastMap .journey').evaluate(e=>e.scrollLeft)>100,'far chapters can be reached');
    await page.locator('#coastMap [data-back]').tap();
    await ctx.close();
    console.log(name+' '+width+' journey labels, viewport and horizontal scroll: ok');
   }
  }finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
