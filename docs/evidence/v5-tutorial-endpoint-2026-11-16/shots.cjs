// Tutorial endpoint evidence: a new player played through the real guide to the first Build (real taps and drags);
// shots: the Build step, the restored place's card with "Tutorial complete", and the board afterwards. OUT, VIEWPORT.
const {chromium}=require('playwright');const path=require('path');const ORIGIN=process.env.ORIGIN||'http://127.0.0.1:8080';
const [W,H]=(process.env.VIEWPORT||'390x664').split('x').map(Number),OUT=process.env.OUT;const delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch(),page=await (await b.newContext({viewport:{width:W,height:H},isMobile:true,hasTouch:true,deviceScaleFactor:2})).newPage();
 await page.goto(ORIGIN+'/v5/play.html');await page.waitForSelector('#board .tile');await delay(1500);
 const tapAt=async l=>{const x=await l.boundingBox();await page.touchscreen.tap(x.x+x.width/2,x.y+x.height/2);};const cell=i=>page.locator(`#board [data-index="${i}"]`);
 const drag=async(a,c)=>{const x=await cell(a).boundingBox(),y=await cell(c).boundingBox();await page.mouse.move(x.x+x.width/2,x.y+x.height/2);await page.mouse.down();for(let k=1;k<=8;k++){await page.mouse.move(x.x+x.width/2+(y.x-x.x)*k/8,x.y+x.height/2+(y.y-x.y)*k/8);await delay(20);}await page.mouse.up();};
 const shot=n=>page.screenshot({path:path.join(OUT,`${W}x${H}-${n}.png`)});
 for(let n=0;n<90;n++){await delay(700);if(await page.locator('#beat[open]').count()){await tapAt(page.locator('#beatNext'));continue;}
  const st=await page.evaluate(()=>VWGuide.step);if(!st?.target)continue;const t=st.target;
  if(st.kind==='build'){await delay(2500);await shot('1-build-step');break;}
  if(t.kind==='cell')await tapAt(cell(t.index));else if(t.kind==='pair')await drag(t.cells[0],t.cells[1]);else if(t.kind==='order'){await tapAt(page.locator(`#requests [data-order="${t.id}"] .reqDeliver`));await delay(900);}}
 await tapAt(page.locator('#mapButton'));await page.waitForSelector('#coastMap[open]');await delay(1200);
 const bb=page.locator('#coastMap [data-restore].coachTarget').first();await bb.evaluate(e=>e.scrollIntoView({block:'center'}));await delay(300);await tapAt(bb);
 await page.waitForSelector('#coastMap .restoredCard');await delay(1800);await shot('2-tutorial-complete');
 const back=page.locator('#coastMap .restoredCard .rcBack');await back.evaluate(e=>e.scrollIntoView({block:'center'}));await delay(300);await tapAt(back);
 await page.waitForFunction(()=>!document.querySelector('#coastMap').open);await delay(1500);
 for(const d of ['#daily','#levelUp'])if(await page.locator(d+'[open]').count()){await shot('3a-normal-dialog');await page.locator(d+' .close').first().click().catch(()=>{});await delay(400);}
 await shot('3-board-after');await b.close();})().catch(e=>{console.error(e);process.exit(1);});
