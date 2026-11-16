// before/after measurements at the first full deliver, gold, merge and build steps. ORIGIN, VIEWPORT
const {chromium}=require('playwright');const ORIGIN=process.env.ORIGIN||'http://127.0.0.1:8080';const [W,H]=(process.env.VIEWPORT||'390x844').split('x').map(Number);
const delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch(),page=await (await b.newContext({viewport:{width:W,height:H},isMobile:true,hasTouch:true})).newPage();
 await page.goto(ORIGIN+'/v5/play.html');await page.waitForSelector('#board .tile');await delay(1500);
 const tapAt=async l=>{const x=await l.boundingBox();await page.touchscreen.tap(x.x+x.width/2,x.y+x.height/2);};const cell=i=>page.locator(`#board [data-index="${i}"]`);
 const drag=async(a,c)=>{const x=await cell(a).boundingBox(),y=await cell(c).boundingBox();await page.mouse.move(x.x+x.width/2,x.y+x.height/2);await page.mouse.down();for(let k=1;k<=8;k++){await page.mouse.move(x.x+x.width/2+(y.x-x.x)*k/8,x.y+x.height/2+(y.y-x.y)*k/8);await delay(20);}await page.mouse.up();};
 const seen=new Set(),out=[];let top0=null,maxShift=0;
 for(let n=0;n<70;n++){await delay(700);if(await page.locator('#beat[open]').count()){await tapAt(page.locator('#beatNext'));continue;}
  const st=await page.evaluate(()=>VWGuide.step);if(!st)continue;
  const m=await page.evaluate(()=>{const R=e=>e?e.getBoundingClientRect():null,ov=(a,b)=>a&&b&&Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top))>0;
   const t=document.querySelector('#requests .coachTarget,.restoreStrip.coachTarget'),ctl=t?.querySelector('.reqDeliver,.rsAction'),h=R(document.querySelector('#hint')),c=R(ctl);
   const sel=[...document.querySelectorAll('#board .tile.selected:not(.coachTarget,.coachFrom,.coachTo)')].map(e=>+getComputedStyle(e,'::after').opacity);
   return {line:document.querySelector('#hint .gWhat')?.innerText,gap:c&&h?Math.round(h.top-c.bottom):null,toastOverControl:!!ov(R(document.querySelector('.moment')),c),toastOverCard:!!ov(R(document.querySelector('.moment')),R(t)),
    notch:document.querySelector('#hint')?.dataset.notch??null,hand:!!document.querySelector('#coachHand:not([hidden])'),arrow:!!document.querySelector('#board .coachArrow'),selected:sel.join(',')||'-',board:Math.round(R(document.querySelector('#board')).top)};});
  top0??=m.board;maxShift=Math.max(maxShift,Math.abs(m.board-top0));
  const key=st.kind;if(['deliver','gold','merge','build'].includes(key)&&st.level==='full'&&!seen.has(key)){seen.add(key);out.push({step:key,...m});}
  const t=st.target;if(!t)continue;if(t.kind==='cell')await tapAt(cell(t.index));else if(t.kind==='pair')await drag(t.cells[0],t.cells[1]);else if(t.kind==='order'){await tapAt(page.locator(`#requests [data-order="${t.id}"]`));await delay(800);}else break;}
 console.log(JSON.stringify({W,H,maxShift,out}));await b.close();})().catch(e=>{console.error(e);process.exit(1);});
