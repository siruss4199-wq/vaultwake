// Tutorial visual system. The real guide is played through the UI from a new camp to the first Build on the coast.
// Polish (2026-11-15), checked at every step:
// - one focus (one target, or the two cells of a merge);
// - the pointer small (at most 24 px) and over no item picture, count or word;
// - at most four looping animations while a target shows;
// - the board never moves.
// Spotlight (2026-11-16, owner on a real iPhone: everything competed for attention), docs/V5_TUTORIAL_SPOTLIGHT_2026-11-16.md:
// - while the guide points at something, everything that is not the target fades back (body[data-spot]);
// - the target stays at full strength;
// - a Deliver / Build step shows ONE cue, "Tap Deliver" + "Get N coins" (the card's own pay) / "Tap Build", whose tail
//   touches that button and which covers neither the button nor the target card;
// - no toast covers the cue or the target;
// - a merge shows only its two cells, with an arrow from source to destination;
// - a tap on a faded cell still reaches the game (nothing intercepts input);
// - a quiet step, Skip and a reload leave nothing faded behind, and a reload restores the spotlight.
// 360×640, 390×664, 390×844 and 430×932; ENGINES (default chromium,webkit), VIEWPORTS.
const assert=require('node:assert/strict');const {chromium,webkit}=require('playwright');
const ORIGIN=process.env.ORIGIN||'http://127.0.0.1:8080';
const VIEWPORTS=(process.env.VIEWPORTS||'360x640,390x664,390x844,430x932').split(',').map(s=>s.split('x').map(Number));
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const metrics=page=>page.evaluate(()=>{const R=e=>{const r=e.getBoundingClientRect();return {l:r.left,t:r.top,r:r.right,b:r.bottom,w:r.width,h:r.height};};
 const inter=(a,b)=>Math.max(0,Math.min(a.r,b.r)-Math.max(a.l,b.l))*Math.max(0,Math.min(a.b,b.b)-Math.max(a.t,b.t));
 const vis=e=>e&&e.offsetParent!==null&&getComputedStyle(e).visibility!=='hidden';
 const emph=[...document.querySelectorAll('.coachTarget,.coachFrom,.coachTo')].filter(vis).map(e=>(e.id||e.dataset.order||'cell'+e.dataset.index)+':'+[...e.classList].filter(c=>/coach/.test(c)).join('+'));
 const hand=document.querySelector('#coachHand:not([hidden]) svg')||document.querySelector('#coastMap[open] .coachHand svg');const hr=hand&&hand.getBoundingClientRect().width?R(hand):null;
 let covers=[];if(hr){for(const e of document.querySelectorAll('#board .tile :is(img,svg.art,.art), #requests .requestItems :is(img,svg), #requests .requestItems b, #requests .reqName b, #mapButton .rsText b, #mapButton .rsAction, #hint .gWhat'))if(vis(e)){const a=R(e),i=inter(hr,a);if(i>0.15*a.w*a.h)covers.push((e.closest('[data-index]')?'cell'+e.closest('[data-index]').dataset.index:e.closest('[data-order]')?.dataset.order||e.className?.baseVal||e.className||e.tagName)+' '+Math.round(100*i/(a.w*a.h))+'%');}}
 const anims=document.getAnimations().filter(a=>a.playState==='running'&&(a.effect?.getTiming?.().iterations===Infinity)).map(a=>{const t=a.effect.target;return (t?.id||t?.className?.baseVal||t?.className||'?').toString().slice(0,40)+'/'+(a.animationName||'');});
 const st=window.VWGuide?.step;const b=document.querySelector('#board').getBoundingClientRect();
 // the spotlight: what is faded (its own opacity times its ancestors'), the cue, the merge arrow, toasts
 const eff=e=>{let o=1;for(let x=e;x&&x!==document.documentElement;x=x.parentElement)o*=+getComputedStyle(x).opacity;return Math.round(o*100)/100;};
 const tgtCard=document.querySelector('#requests .coachTarget'),strip=document.querySelector('#mapButton.coachTarget'),ctl=tgtCard?.querySelector('.reqDeliver')??strip?.querySelector('.rsAction');
 const cue=document.getElementById('spotCue'),cueOn=cue&&!cue.hidden?cue:null,tail=cueOn?.querySelector('i');
 const other=[...document.querySelectorAll('#requests .requestCard:not(.coachTarget)')][0],plain=[...document.querySelectorAll('#board .tile:not(.coachTarget,.coachFrom,.coachTo)')].find(t=>!t.classList.contains('empty'));
 const arrow=document.querySelector('#board .coachArrow'),from=document.querySelector('#board .coachFrom'),to=document.querySelector('#board .coachTo');
 const cen=e=>{const r=e.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};};const mo=document.querySelector('.moment');
 const spot={on:document.body.dataset.spot??null,hud:eff(document.querySelector('header')),strip:eff(document.querySelector('#mapButton')),other:other?eff(other):null,cell:plain?eff(plain):null,
  target:tgtCard?eff(tgtCard):strip?eff(strip):from&&to?Math.min(eff(from),eff(to)):document.querySelector('#board .tile.coachTarget')?eff(document.querySelector('#board .tile.coachTarget')):null,
  ctl:ctl?R(ctl):null,card:tgtCard?R(tgtCard):null,cue:cueOn?R(cueOn):null,tail:tail?R(tail):null,cueText:cueOn?.innerText.replace(/\s+/g,' ').trim()??'',chipText:ctl?.innerText??'',
  arrow:arrow&&from&&to?{a:cen(arrow),s:cen(from),d:cen(to)}:null,
  toastOver:!!(mo&&((cueOn&&inter(R(mo),R(cueOn))>0)||(tgtCard&&inter(R(mo),R(tgtCard))>0)))};
 return {spot,step:st?.kind,level:document.querySelector('#hint')?.dataset.level,what:st?.what,why:st?.why,target:st?.target?.kind,emph,hand:hr?{w:Math.round(hr.w),h:Math.round(hr.h)}:null,covers,anims,boardTop:Math.round(b.top)};});
(async()=>{for(const engine of (process.env.ENGINES||'chromium,webkit').split(',')){
 let browser;try{browser=await {chromium,webkit}[engine].launch();}catch(e){if(engine!=='chromium'&&/Executable doesn't exist/.test(e.message)){console.log(`${engine}: not installed here, skipped`);continue;}throw e;}
 try{for(const [W,H] of VIEWPORTS){const tag=s=>`${engine} ${W}×${H}: ${s}`;
  const ctx=await browser.newContext({viewport:{width:W,height:H},isMobile:engine==='chromium',hasTouch:true}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(ORIGIN+'/v5/play.html');await page.waitForSelector('#board .tile');await delay(1500);
  const tapAt=async l=>{const b=await l.boundingBox();await page.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);};
  const cell=i=>page.locator(`#board [data-index="${i}"]`);
  const drag=async(a,b)=>{const x=await cell(a).boundingBox(),y=await cell(b).boundingBox();await page.mouse.move(x.x+x.width/2,x.y+x.height/2);await page.mouse.down();for(let k=1;k<=8;k++){await page.mouse.move(x.x+x.width/2+(y.x-x.x)*k/8,x.y+x.height/2+(y.y-x.y)*k/8);await delay(20);}await page.mouse.up();};
  const check=(m,where)=>{const t=tag(`${where} (${m.step}/${m.level})`),s=m.spot;
   assert.ok(m.emph.length<=(m.target==='pair'?2:1)||where==='coast',t+`: one focus (${m.emph.join(' ')})`);
   if(m.hand)assert.ok(m.hand.w<=24&&m.hand.h<=28,t+`: a small pointer (${m.hand.w}×${m.hand.h})`);
   assert.deepEqual(m.covers,[],t+': the pointer covers no picture, count or word');
   if(m.emph.length)assert.ok(m.anims.length<=4,t+`: at most four looping animations (${m.anims.join(', ')})`);
   if(where!=='board')return;
   if(!m.emph.length){assert.equal(s.on,null,t+': no spotlight without a target');assert.equal(s.hud,1,t+': nothing faded on a quiet step');return;}
   if(!['order','strip','pair','cell'].includes(m.target))return;
   // the spotlight: the target at full strength, everything else faded
   assert.equal(s.on,m.target,t+': the spotlight is on');assert.equal(s.target,1,t+': the target at full strength');
   assert.ok(s.hud<=0.5,t+`: the HUD fades back (${s.hud})`);
   if(m.target!=='strip')assert.ok(s.strip<=0.5,t+`: the Coast strip fades back (${s.strip})`);
   if(s.other!=null&&m.target!=='strip')assert.ok(s.other<=0.5,t+`: the other orders fade back (${s.other})`);
   if(s.cell!=null)assert.ok(s.cell<=0.5,t+`: the board's other cells fade back (${s.cell})`);
   if(m.target==='order'||m.target==='strip'){
    const n=m.target==='order'?+(/^Get (\d+) coins/.exec(m.why)?.[1]):null;
    if(m.target==='order'){assert.equal(m.what,'Tap Deliver',t+': the cue names the button');assert.ok(n>0,t+`: and what it gives (${m.why})`);if(/\+\d/.test(s.chipText))assert.ok(s.chipText.includes('+'+n),t+`: the card's own pay (${s.chipText})`);}
    else assert.equal(m.what,'Tap Build',t+': the cue names the button');
    // one cue, its tail touching the button, covering neither the button nor the card
    assert.ok(s.cue,t+': the cue shows');assert.ok(s.cueText.startsWith(m.what),t+`: the cue reads "${m.what}" (${s.cueText})`);
    const tx=(s.tail.l+s.tail.r)/2,gap=Math.min(Math.abs(s.tail.b-s.ctl.t),Math.abs(s.ctl.b-s.tail.t));
    assert.ok(tx>=s.ctl.l&&tx<=s.ctl.r&&gap<=4,t+`: the cue's tail touches the button (tail ${Math.round(tx)} gap ${gap.toFixed(1)}, button ${Math.round(s.ctl.l)}-${Math.round(s.ctl.r)})`);
    const ov=(a,b)=>Math.min(a.r,b.r)-Math.max(a.l,b.l)>0.5&&Math.min(a.b,b.b)-Math.max(a.t,b.t)>0.5;
    assert.ok(!ov(s.cue,s.ctl)&&(!s.card||!ov(s.cue,s.card)),t+': the cue covers neither the button nor the card');
    assert.ok(s.cue.l>=0&&s.cue.r<=W&&s.cue.t>=0,t+': the cue on screen');
    assert.ok(!s.toastOver,t+': no toast over the cue or the target');}
   if(m.target==='pair'){const a=s.arrow;assert.ok(a,t+': a merge shows its arrow');const vx=a.d.x-a.s.x,vy=a.d.y-a.s.y,L=Math.hypot(vx,vy),wx=a.a.x-a.s.x,wy=a.a.y-a.s.y;
    assert.ok(Math.abs(vx*wy-vy*wx)/L<=3&&(vx*wx+vy*wy)>0,t+`: the arrow between source and destination (${JSON.stringify(a)})`);}};
  let idle=0,top0=null,steps=0,build=false,reloaded=false,tappedFaded=false;const kinds=new Set();
  for(let n=0;n<80;n++){await delay(900);
   if(await page.locator('#beat[open]').count()){await tapAt(page.locator('#beatNext'));continue;}
   if(await page.locator('#homePlay:not([hidden])').count()&&await page.evaluate(()=>!document.querySelector('#home')?.hidden)){await tapAt(page.locator('#homePlay'));await delay(900);continue;}
   const m=await metrics(page);if(!m.step){if(++idle>8)break;await delay(1200);continue;}idle=0;
   top0??=m.boardTop;assert.ok(Math.abs(m.boardTop-top0)<=2,tag(`the board stays (${top0} → ${m.boardTop} at ${m.step})`));
   check(m,'board');kinds.add(m.step);steps++;
   // a faded cell still takes a tap (no layer catches input): the tap selects it, as in normal play
   if(!tappedFaded&&m.target==='cell'&&m.spot.on==='cell'){const i=await page.evaluate(()=>[...document.querySelectorAll('#board .tile.item:not(.coachTarget)')][0]?.dataset.index);
    if(i!=null){await tapAt(cell(i));await delay(300);assert.ok(await page.evaluate(i=>document.querySelector(`#board [data-index="${i}"]`)?.classList.contains('selected'),i),tag('a tap on a faded cell selects it'));tappedFaded=true;continue;}}
   // a reload in the middle of a Deliver step: Home, Continue, and the same spotlight
   if(!reloaded&&m.target==='order'&&m.spot.on==='order'){reloaded=true;await page.reload();await page.waitForSelector('#board .tile');await delay(1200);
    if(await page.locator('#homePlay:not([hidden])').count())await tapAt(page.locator('#homePlay'));await delay(1500);
    const r=await metrics(page);assert.equal(r.spot.on,'order',tag('a reload restores the spotlight'));assert.ok(r.spot.cue,tag('and its cue'));continue;}
   const t=await page.evaluate(()=>VWGuide.step?.target);if(!t){await delay(1500);continue;}
   if(t.kind==='cell')await tapAt(cell(t.index));else if(t.kind==='pair')await drag(t.cells[0],t.cells[1]);
   else if(t.kind==='order'){await tapAt(page.locator(`#requests [data-order="${t.id}"] .reqDeliver`));await delay(800);}
   else if(t.kind==='strip'){await tapAt(page.locator('#mapButton'));await page.waitForSelector('#coastMap[open]');await delay(1200);
    const c=await metrics(page);check(c,'coast');assert.equal(c.spot.cue,null,tag('the board cue is gone on the coast screen'));
    const b=page.locator('#coastMap [data-restore]').first();assert.ok(await b.count(),tag('the coast shows Build'));
    assert.ok(await b.evaluate(e=>{const r=e.getBoundingClientRect();return r.width>0&&getComputedStyle(e).opacity==='1';}),tag('the Build button at full strength'));
    assert.ok(await page.evaluate(()=>+getComputedStyle(document.querySelector('#coastMap ol.places')).opacity<=0.5),tag('the places strip fades back'));
    await b.evaluate(e=>e.scrollIntoView({block:'center'}));await delay(300);await tapAt(b);await delay(2000);build=true;break;}
   else break;}
  for(const k of ['tap','merge','deliver','gold','build'])assert.ok(kinds.has(k),tag(`the ${k} step was seen`));assert.ok(build,tag('reached Build on the coast'));assert.ok(reloaded,tag('reloaded on a Deliver step'));assert.ok(tappedFaded,tag('tapped a faded cell'));
  assert.deepEqual(errors,[],tag('no page errors'));await ctx.close();
  // Skip: the spotlight and its cue go at once
  {const ctx2=await browser.newContext({viewport:{width:W,height:H},isMobile:engine==='chromium',hasTouch:true}),p2=await ctx2.newPage();
   await p2.goto(ORIGIN+'/v5/play.html');await p2.waitForSelector('#board .tile');await p2.waitForFunction(()=>document.body.dataset.spot==='cell',null,{timeout:15000});
   const sk=await p2.locator('#coachSkip').boundingBox();await p2.touchscreen.tap(sk.x+sk.width/2,sk.y+sk.height/2);await delay(400);
   const after=await p2.evaluate(()=>({spot:document.body.dataset.spot??null,hud:+getComputedStyle(document.querySelector('header')).opacity,cell:+getComputedStyle(document.querySelector('#board .tile')).opacity,cue:!!document.querySelector('#spotCue:not([hidden])')}));
   assert.deepEqual(after,{spot:null,hud:1,cell:1,cue:false},tag(`Skip clears the spotlight (${JSON.stringify(after)})`));await ctx2.close();}
  console.log(`ok ${tag(`tutorial (${steps} steps: ${[...kinds].join(', ')}, Build): spotlight on target, one cue at the button, faded cells still tappable, reload and Skip, board still`)}`);}
 }finally{await browser.close();}}
 console.log('tutorial visual browser tests passed');
})().catch(e=>{console.error(e);process.exit(1);});
