// Tutorial visual audit: plays the real guide; at the first of each step kind/level, a full-screen shot and metrics:
// emphasised elements, the hand (size, what it covers), running animations, guidance panels, layout shift.
// ORIGIN, OUT, LABEL, VIEWPORT (WxH), ENGINE
const fs=require('fs'),path=require('path');const {chromium,webkit}=require('playwright');
const ORIGIN=process.env.ORIGIN||'http://127.0.0.1:8080',OUT=process.env.OUT,LABEL=process.env.LABEL||'x',ENGINE=process.env.ENGINE||'chromium';
const [W,H]=(process.env.VIEWPORT||'390x664').split('x').map(Number);
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const metrics=page=>page.evaluate(()=>{const R=e=>{const r=e.getBoundingClientRect();return {l:r.left,t:r.top,r:r.right,b:r.bottom,w:r.width,h:r.height};};
 const inter=(a,b)=>Math.max(0,Math.min(a.r,b.r)-Math.max(a.l,b.l))*Math.max(0,Math.min(a.b,b.b)-Math.max(a.t,b.t));
 const vis=e=>e&&e.offsetParent!==null&&getComputedStyle(e).visibility!=='hidden';
 const emph=[...document.querySelectorAll('.coachTarget,.coachFrom,.coachTo')].filter(vis).map(e=>(e.id||e.dataset.order||'cell'+e.dataset.index)+':'+[...e.classList].filter(c=>/coach/.test(c)).join('+'));
 const hand=document.querySelector('#coachHand:not([hidden]) svg')||document.querySelector('#coastMap[open] .coachHand svg');const hr=hand&&hand.getBoundingClientRect().width?R(hand):null;
 // what the hand covers: item art on the board and in the order cards, counts, text
 let covers=[];if(hr){for(const e of document.querySelectorAll('#board .tile :is(img,svg.art,.art), #requests .requestItems :is(img,svg), #requests .requestItems b, #requests .reqName b, #mapButton .rsText b, #mapButton .rsAction, #hint .gWhat'))if(vis(e)){const a=R(e),i=inter(hr,a);if(i>0.15*a.w*a.h)covers.push((e.closest('[data-index]')?'cell'+e.closest('[data-index]').dataset.index:e.closest('[data-order]')?.dataset.order||e.className?.baseVal||e.className||e.tagName)+' '+Math.round(100*i/(a.w*a.h))+'%');}}
 const anims=document.getAnimations().filter(a=>a.playState==='running'&&(a.effect?.getTiming?.().iterations===Infinity)).map(a=>{const t=a.effect.target;return (t?.id||t?.className?.baseVal||t?.className||'?').toString().slice(0,40)+'/'+(a.animationName||'');});
 const panels=['#hint[data-kind="coach"]','#storyRibbon:not([hidden])','.moment','#coastMap[open] .coachLine','#coachSkip:not([hidden])','#guideHint'].filter(s=>{const e=document.querySelector(s);return e&&vis(e);});
 const st=window.VWGuide?.step;const b=document.querySelector('#board').getBoundingClientRect();
 return {step:st?.kind,level:document.querySelector('#hint')?.dataset.level,what:st?.what,target:st?.target?.kind,emph,hand:hr?{w:Math.round(hr.w),h:Math.round(hr.h)}:null,covers,anims,panels,boardTop:Math.round(b.top),hint:(()=>{const e=document.querySelector('#hint');return vis(e)?R(e):null;})()};});
(async()=>{const browser=await {chromium,webkit}[ENGINE].launch(),ctx=await browser.newContext({viewport:{width:W,height:H},isMobile:ENGINE==='chromium',hasTouch:true,deviceScaleFactor:OUT?2:1}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(ORIGIN+'/v5/play.html');await page.waitForSelector('#board .tile');await delay(1500);
 const tapAt=async l=>{const b=await l.boundingBox();await page.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);};
 const cell=i=>page.locator(`#board [data-index="${i}"]`);
 const drag=async(a,b)=>{const x=await cell(a).boundingBox(),y=await cell(b).boundingBox();await page.mouse.move(x.x+x.width/2,x.y+x.height/2);await page.mouse.down();for(let k=1;k<=8;k++){await page.mouse.move(x.x+x.width/2+(y.x-x.x)*k/8,x.y+x.height/2+(y.y-x.y)*k/8);await delay(20);}await page.mouse.up();};
 let idle=0;const seen=new Set(),rows=[];let lastTop=null,shifts=[];
 for(let n=0;n<70;n++){await delay(900);if(await page.locator('#beat[open]').count()){await tapAt(page.locator('#beatNext'));continue;}
  for(const d of ['#daily','#endDialog','#levelUp'])if(await page.locator(d+'[open]').count())await page.locator(d+' .close').first().click().catch(()=>{});
  const m=await metrics(page);if(!m.step){if((idle=(idle||0)+1)>8)break;await delay(1200);continue;}
  if(lastTop!=null&&Math.abs(m.boardTop-lastTop)>2)shifts.push(`${lastTop}→${m.boardTop} at ${m.step}/${m.level}`);lastTop=m.boardTop;
  const key=m.step+'/'+m.level;if(!seen.has(key)){seen.add(key);rows.push({n,...m});if(OUT)await page.screenshot({path:path.join(OUT,`${LABEL}-${W}x${H}-${String(rows.length).padStart(2,'0')}-${m.step}-${m.level}.png`)});}
  const t=await page.evaluate(()=>VWGuide.step?.target);if(!t){if((idle=(idle||0)+1)>8)break;await delay(1500);continue;}idle=0;
  if(t.kind==='cell')await tapAt(cell(t.index));else if(t.kind==='pair')await drag(t.cells[0],t.cells[1]);
  else if(t.kind==='order'){await tapAt(page.locator(`#requests [data-order="${t.id}"]`));await delay(800);}
  else if(t.kind==='strip'){await tapAt(page.locator('#mapButton'));await page.waitForSelector('#coastMap[open]');await delay(1200);
   const mm=await metrics(page);rows.push({n,...mm,step:'build (coast)'});if(OUT)await page.screenshot({path:path.join(OUT,`${LABEL}-${W}x${H}-${String(rows.length).padStart(2,'0')}-build-coast.png`)});
   const b=page.locator('#coastMap [data-restore]').first();if(await b.count()){await b.evaluate(e=>e.scrollIntoView({block:'center'}));await delay(300);await tapAt(b);}await delay(2500);break;}
  else break;}
 await browser.close();if(OUT)fs.writeFileSync(path.join(OUT,LABEL+'.json'),JSON.stringify({rows,shifts,errors},null,1));
 for(const r of rows)console.log(`${String(r.n).padStart(2)} ${(r.step+'/'+r.level).padEnd(18)} emph [${r.emph.join(' ')}] hand ${r.hand?r.hand.w+'x'+r.hand.h:'-'} covers [${r.covers.join(', ')}] anims ${r.anims.length} [${[...new Set(r.anims.map(a=>a.split('/')[1]))].join(',')}] panels ${r.panels.length} [${r.panels.join(' ')}]`);
 console.log('board shifts during the tutorial:',shifts.length?shifts.join('; '):'none','| errors',errors.length);
})().catch(e=>{console.error(e);process.exit(1);});
