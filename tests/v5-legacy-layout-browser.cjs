// UI fixture: wide system fonts and earned energy must not push header actions
// off a narrow phone. Gameplay progression remains covered by the camp/coast runs.
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
(async()=>{
 for(const [engine,type] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await type.launch();
  try{for(const width of [360,390,430]){
   const page=await browser.newPage({viewport:{width,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
   await page.goto('http://127.0.0.1:8080/v5/');await page.waitForSelector('#board .tile');
   await page.evaluate(()=>{
    const state=JSON.parse(localStorage.getItem('vaultwake-v5'));
    state.energy=120;localStorage.setItem('vaultwake-v5',JSON.stringify(state));
   });
   await page.reload();await page.waitForSelector('#board .tile');
   // Linux/Android fallbacks can be wider than the developer machine's default.
   await page.addStyleTag({content:':root{font-family:"DejaVu Sans",sans-serif}'});
   const bounds=await page.evaluate(()=>{
    const nodes=['header .brand','header .resource','#levelPill','#mapButton','#journalButton'];
    return {scrollWidth:document.documentElement.scrollWidth,items:nodes.map(selector=>{
     const el=document.querySelector(selector),r=el.getBoundingClientRect();
     const range=document.createRange();range.selectNodeContents(el);
     const text=range.getBoundingClientRect();
     return {selector,left:r.left,right:r.right,width:r.width,height:r.height,textLeft:text.left,textRight:text.right};
    })};
   });
   assert.equal(bounds.scrollWidth,width,`${engine} ${width}: no horizontal page overflow`);
   for(const [i,item] of bounds.items.entries()){
    assert.ok(item.left>=0&&item.right<=width,`${engine} ${width}: ${item.selector} stays on screen`);
    assert.ok(item.textLeft>=item.left-.5&&item.textRight<=item.right+.5,`${engine} ${width}: ${item.selector} content remains visible`);
    if(i)assert.ok(bounds.items[i-1].right<=item.left,`${engine} ${width}: header controls do not overlap`);
   }
   for(const selector of ['#mapButton','#journalButton']){
    const button=page.locator(selector),box=await button.boundingBox();
    assert.ok(box.width>=44&&box.height>=44,`${engine} ${width}: ${selector} retains a touch target`);
    await button.tap();
    const dialog=page.locator(selector==='#mapButton'?'#coastMap':'#journal');
    assert.equal(await dialog.isVisible(),true,`${engine} ${width}: ${selector} remains usable`);
    await dialog.locator('.close').tap();
   }
   await page.close();console.log(engine,width,'wide-font high-energy header passed');
  }}finally{await browser.close();}
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
