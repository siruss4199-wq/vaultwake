// Visual review captures for the Chapter 1 Vault entrance (docs: tools/paint-landing-vault.py). Opens the coast map at
// 0, 10 and 20 Landing Beach stages and saves a 2x screenshot per engine and width, for before/after review.
//   PORT=8080 TAG=after OUT=dir [ENGINES=chromium,webkit] [WIDTHS=360,390,430] node tests/v5-next-vault-art-shots.cjs
const fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const {throughHome}=require('./v5-next-home-helper.cjs');
const KEY='vaultwake-v5-coast',PORT=process.env.PORT||'8080',TAG=process.env.TAG||'after',OUT=process.env.OUT||'vault-art-shots';
(async()=>{
 const {AREAS}=await import(path.join(__dirname,'../v5/next/areas.mjs'));
 fs.mkdirSync(OUT,{recursive:true});
 for(const name of (process.env.ENGINES||'chromium,webkit').split(',')){
  const browser=await {chromium,webkit}[name].launch();
  try{for(const width of (process.env.WIDTHS||'360,390,430').split(',').map(Number)){
   const context=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:2,hasTouch:true,reducedMotion:'reduce'});
   const page=throughHome(await context.newPage());
   const beats=async()=>{for(let i=0;i<30&&await page.locator('#beat[open]').count();i++)await page.locator('#beatNext').click();};
   await page.goto(`http://127.0.0.1:${PORT}/v5/play.html?new=1`);await beats();
   for(const stages of [0,10,20]){
    const built=Object.fromEntries(AREAS[0].tasks.map((t,i)=>[t.id,Math.max(0,Math.min(3,stages-i*3))]).filter(([,n])=>n>0));
    await page.evaluate(([key,built])=>{const s=JSON.parse(localStorage.getItem(key));s.built=built;s.materials={...built};localStorage.setItem(key,JSON.stringify(s));},[KEY,built]);
    await page.reload();await beats();await page.locator('#mapButton').click();
    await page.locator('#coastMap .beachScene .sceneBase').evaluate(img=>img.decode());await page.waitForTimeout(800);
    await page.screenshot({path:path.join(OUT,`${TAG}-${name}-${width}-${stages}.png`)});
    await page.locator('#coastMap .close').click();
   }
   await context.close();console.log(`${name} ${width}: captured 0/10/20`);
  }}finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
