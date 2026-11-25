// Playgama listing screenshots (2026-11-24): the Playgama build (dist/playgama served at PG_ORIGIN) with a stand-in
// Bridge, a played chapter-1 camp (tests/fixtures/coast/coast-ch1-pre-secondary.json). Portrait 1080x1920 (a
// 540x960 window at 2x) and landscape 1920x1080 (1280x720 at 1.5x): the board, the coast screen, Home.
//   PG_ORIGIN=http://127.0.0.1:8090 node tools/playgama-screenshots.cjs release/playgama/screenshots
const fs=require('node:fs'),path=require('node:path');const {chromium}=require('playwright');
const ORIGIN=process.env.PG_ORIGIN||'http://127.0.0.1:8090',OUT=process.argv[2]||'release/playgama/screenshots';
const root=path.join(__dirname,'..');fs.mkdirSync(OUT,{recursive:true});
const STUB=fs.readFileSync(path.join(root,'tests/fixtures/playgama/bridge-stub.js'),'utf8');
const camp=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/coast/coast-ch1-pre-secondary.json'),'utf8'));
camp.daily={day:9e6,count:1};camp.materials['beach-workshop']=camp.built['beach-workshop']+1;camp.coins=320;camp.energy=46;camp.energyAt=Date.now();
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch();
 for(const [name,w,h,scale,mobile] of [['portrait',540,960,2,true],['landscape',1280,720,1.5,false]]){
  const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:scale,hasTouch:mobile,isMobile:mobile});const p=await ctx.newPage();
  await ctx.route(ORIGIN+'/playgama-bridge.js',r=>r.fulfill({contentType:'text/javascript',body:STUB}));
  await p.goto(ORIGIN+'/playgama-bridge-config.json');
  await p.evaluate(c=>{localStorage.clear();localStorage.setItem('__pgStub',JSON.stringify({'vaultwake-v5-coast':JSON.stringify(c)}));},camp);
  await p.goto(ORIGIN+'/index.html');await p.waitForSelector('#homePlay:not([hidden])');await wait(1500);
  await p.screenshot({path:path.join(OUT,`${name}-1-home.png`)});
  await p.click('#homePlay');await wait(2500);
  for(const d of ['#beat','#daily'])if(await p.locator(d+'[open]').count())await p.locator(d+' .close, #beatNext').first().click().catch(()=>{});
  await wait(600);await p.screenshot({path:path.join(OUT,`${name}-2-board.png`)});
  await p.click('#mapButton');await p.waitForSelector('#coastMap[open]');await wait(1800);
  await p.screenshot({path:path.join(OUT,`${name}-3-coast.png`)});
  await ctx.close();
 }
 await b.close();
 for(const f of fs.readdirSync(OUT).sort())console.log(f,fs.statSync(path.join(OUT,f)).size);
})().catch(e=>{console.error(e);process.exit(1);});
