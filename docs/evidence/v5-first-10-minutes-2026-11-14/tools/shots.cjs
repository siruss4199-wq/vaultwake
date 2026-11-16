// Screens of the first-10-minutes changes at each size (2026-11-14), on play.html with real input:
//  1. guide  : a new player follows the guide until a quiet step shows its purpose ("For the gold order: …")
//  2. card   : a camp with the landing path at stage 2 and the tent's materials in: the coast card for the tent
//              ("Unlocks a new generator: the Survey Kite")
//  3. built  : after Build: the restored card's rewards ("a new generator: the Survey Kite")
//  4. board  : back on the board, the Survey Kite beside the Rover
//   ORIGIN=http://127.0.0.1:8080 OUT=<dir> [SIZES=360x640,390x664,390x844,430x932,907x510] [ENGINE=chromium]
const fs=require('fs'),path=require('path');const {chromium,webkit}=require('playwright');
const ORIGIN=process.env.ORIGIN||'http://127.0.0.1:8080',OUT=process.env.OUT,ENGINE=process.env.ENGINE||'chromium',KEY='vaultwake-v5-coast';
const SIZES=(process.env.SIZES||'360x640,390x664,390x844,430x932,907x510').split(',').map(s=>s.split('x').map(Number));
fs.mkdirSync(OUT,{recursive:true});const delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await {chromium,webkit}[ENGINE].launch(),errors=[],report=[];
 for(const [w,h] of SIZES){const mobile=w<700,ctx=await b.newContext({viewport:{width:w,height:h},isMobile:mobile&&ENGINE==='chromium',hasTouch:mobile,deviceScaleFactor:2}),page=await ctx.newPage(),tag=`${w}x${h}`;
  page.on('pageerror',e=>errors.push(tag+': '+e.message));
  const shot=n=>page.screenshot({path:path.join(OUT,`${tag}-${n}.png`)});
  const tapAt=async loc=>{const p=await loc.evaluate(async el=>{el.scrollIntoView({block:'nearest'});await new Promise(requestAnimationFrame);const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};});if(mobile)await page.touchscreen.tap(p.x,p.y);else await page.mouse.click(p.x,p.y);};
  const cell=i=>page.locator(`#board [data-index="${i}"]`);
  const drag=async(a,c)=>{const x=await cell(a).boundingBox(),y=await cell(c).boundingBox();await page.mouse.move(x.x+x.width/2,x.y+x.height/2);await page.mouse.down();for(let k=1;k<=8;k++){await page.mouse.move(x.x+x.width/2+(y.x-x.x)*k/8,x.y+x.height/2+(y.y-x.y)*k/8);await delay(20);}await page.mouse.up();};
  // 1. a new player follows the guide until a quiet step names its purpose
  await page.goto(ORIGIN+'/v5/play.html');await page.waitForSelector('#board .tile');await delay(500);let quiet=null;
  for(let n=0;n<40&&!quiet;n++){const st=await page.evaluate(()=>VWGuide.step);const a=st?.action;if(!a)break;
   if(a.type==='produce')await tapAt(cell(a.index));else if(a.type==='merge')await drag(a.from,a.to);else if(a.type==='deliver')await tapAt(page.locator(`#requests [data-order="${a.id}"]`));else break;
   await delay(700);quiet=await page.evaluate(()=>{const f=document.querySelector('#hint .gFor');return f?document.querySelector('#hint').innerText.replace(/\s+/g,' '):null;});}
  report.push({size:tag,quietLine:quiet});if(quiet)await shot('1-guide-quiet-purpose');
  // 2-4. the tent: coast card, build, board
  await page.evaluate(k=>{localStorage.clear();},KEY);
  await page.goto(ORIGIN+'/v5/play.html');await page.waitForSelector('#board .tile');
  await page.evaluate(async k=>{const g=await import(new URL('next/game.mjs',document.baseURI).href);const s=g.fresh(Date.now());s.built={'beach-path':2};s.materials={'beach-path':2,'beach-tent':1};s.coins=120;s.moves=60;s.merges=30;s.ordersDone=6;s.taps={...s.taps,rig:60};
   s.seen={...s.seen,'coach-on':true,'coach-done':true,'coach-next':true,'story-intro':true};s.board[g.ROVER].level=2;s.daily={day:99999,count:1};localStorage.setItem(k,JSON.stringify(s));},KEY);
  await page.reload();await page.waitForSelector('#board .tile');
  if(await page.locator('#homePlay:not([hidden])').count())await tapAt(page.locator('#homePlay'));
  await page.waitForFunction(()=>!document.querySelector('#home:not([hidden])')||document.querySelector('#home').hidden,null,{timeout:15000}).catch(()=>{});await delay(600);
  for(let i=0;i<4&&await page.locator('#beat[open]').count();i++){await tapAt(page.locator('#beatNext'));await delay(300);}
  await tapAt(page.locator('#mapButton'));await page.waitForSelector('#coastMap[open]');await delay(900);
  const tent=page.locator('#coastMap [data-place="beach-tent"] button');if(await tent.count()){await tapAt(tent.first());await delay(500);}
  const gift=await page.locator('#mapCard .cardGift').innerText().catch(()=>null);report.push({size:tag,card:gift});
  await page.locator('#mapCard').evaluate(e=>e.scrollIntoView({block:'center'}));await delay(300);await shot('2-coast-card-new-generator');
  await tapAt(page.locator('#coastMap [data-restore="beach-tent"]'));await delay(2600);
  const rewards=await page.locator('#coastMap .rcRewards').innerText().catch(()=>null);report.push({size:tag,rewards});await shot('3-restored-card');
  const back=page.locator('#coastMap [data-done]');if(await back.count())await tapAt(back.first());await delay(1800);
  for(let i=0;i<4&&await page.locator('#beat[open]').count();i++){await tapAt(page.locator('#beatNext'));await delay(300);}
  await shot('4-board-with-kite');
  report.push({size:tag,kite:await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).board.some(x=>x?.type==='source'&&x.id==='chart'),KEY),sideways:await page.evaluate(()=>document.scrollingElement.scrollWidth>innerWidth+1)});
  await ctx.close();}
 await b.close();fs.writeFileSync(path.join(OUT,'shots.json'),JSON.stringify({engine:ENGINE,report,errors},null,1));console.log(JSON.stringify({report,errors},null,1));
})().catch(e=>{console.error(e);process.exit(1);});
