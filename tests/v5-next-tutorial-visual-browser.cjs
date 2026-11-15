// Tutorial visual system (2026-11-15, owner: the tutorial looked unfinished and cluttered). The real guide, played
// through the UI from a new camp to the first Build on the coast. At every step: one focus (one target, or the two
// cells of a merge), the pointer small (at most 24 px) and over no item picture, count or word, at most four
// looping animations on screen while a target shows (the target's own cue and, on the coast, the Build button's), and the board never
// moves. 360×640, 390×664 and 430×932; ENGINES (default chromium,webkit), VIEWPORTS.
const assert=require('node:assert/strict');const {chromium,webkit}=require('playwright');
const ORIGIN=process.env.ORIGIN||'http://127.0.0.1:8080';
const VIEWPORTS=(process.env.VIEWPORTS||'360x640,390x664,430x932').split(',').map(s=>s.split('x').map(Number));
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
(async()=>{for(const engine of (process.env.ENGINES||'chromium,webkit').split(',')){
 let browser;try{browser=await {chromium,webkit}[engine].launch();}catch(e){if(engine!=='chromium'&&/Executable doesn't exist/.test(e.message)){console.log(`${engine}: not installed here, skipped`);continue;}throw e;}
 try{for(const [W,H] of VIEWPORTS){const tag=s=>`${engine} ${W}×${H}: ${s}`;
  const ctx=await browser.newContext({viewport:{width:W,height:H},isMobile:engine==='chromium',hasTouch:true}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(ORIGIN+'/v5/play.html');await page.waitForSelector('#board .tile');await delay(1500);
  const tapAt=async l=>{const b=await l.boundingBox();await page.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);};
  const cell=i=>page.locator(`#board [data-index="${i}"]`);
  const drag=async(a,b)=>{const x=await cell(a).boundingBox(),y=await cell(b).boundingBox();await page.mouse.move(x.x+x.width/2,x.y+x.height/2);await page.mouse.down();for(let k=1;k<=8;k++){await page.mouse.move(x.x+x.width/2+(y.x-x.x)*k/8,x.y+x.height/2+(y.y-x.y)*k/8);await delay(20);}await page.mouse.up();};
  const check=(m,where)=>{const t=tag(`${where} (${m.step}/${m.level})`);
   assert.ok(m.emph.length<=(m.target==='pair'?2:1)||where==='coast',t+`: one focus (${m.emph.join(' ')})`);
   if(m.hand)assert.ok(m.hand.w<=24&&m.hand.h<=28,t+`: a small pointer (${m.hand.w}×${m.hand.h})`);
   assert.deepEqual(m.covers,[],t+': the pointer covers no picture, count or word');
   // while the guide points at something, nothing else loops for attention (a quiet step is the plain game)
   if(m.emph.length)assert.ok(m.anims.length<=4,t+`: at most four looping animations (${m.anims.join(', ')})`);};
  let idle=0,top0=null,steps=0,build=false;const kinds=new Set();
  for(let n=0;n<70;n++){await delay(900);
   if(await page.locator('#beat[open]').count()){await tapAt(page.locator('#beatNext'));continue;}
   const m=await metrics(page);if(!m.step){if(++idle>8)break;await delay(1200);continue;}idle=0;
   top0??=m.boardTop;assert.ok(Math.abs(m.boardTop-top0)<=2,tag(`the board stays (${top0} → ${m.boardTop} at ${m.step})`));
   check(m,'board');kinds.add(m.step);steps++;
   const t=await page.evaluate(()=>VWGuide.step?.target);if(!t){await delay(1500);continue;}
   if(t.kind==='cell')await tapAt(cell(t.index));else if(t.kind==='pair')await drag(t.cells[0],t.cells[1]);
   else if(t.kind==='order'){await tapAt(page.locator(`#requests [data-order="${t.id}"]`));await delay(800);}
   else if(t.kind==='strip'){await tapAt(page.locator('#mapButton'));await page.waitForSelector('#coastMap[open]');await delay(1200);
    const c=await metrics(page);check(c,'coast');
    const b=page.locator('#coastMap [data-restore]').first();assert.ok(await b.count(),tag('the coast shows Build'));
    assert.ok(await b.evaluate(e=>{const r=e.getBoundingClientRect();return r.width>0&&getComputedStyle(e).opacity!=='0';}),tag('the Build button is drawn'));
    await b.evaluate(e=>e.scrollIntoView({block:'center'}));await delay(300);await tapAt(b);await delay(2000);build=true;break;}
   else break;}
  for(const k of ['tap','merge','deliver','gold','build'])assert.ok(kinds.has(k),tag(`the ${k} step was seen`));assert.ok(build,tag('reached Build on the coast'));
  assert.deepEqual(errors,[],tag('no page errors'));
  console.log(`ok ${tag(`tutorial (${steps} steps: ${[...kinds].join(', ')}, Build): one focus, small pointer over nothing, ≤4 loops, board still`)}`);await ctx.close();}
 }finally{await browser.close();}}
 console.log('tutorial visual browser tests passed');
})().catch(e=>{console.error(e);process.exit(1);});
