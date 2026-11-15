// Order cards (2026-11-15, owner's screenshot): inside each mobile order card the zones never meet: the head (face,
// reward or Deliver), the item art with its Lv tag, the have/need counts and the bottom label (crew name, or the
// gold order's crown, GOLD and Stage). Real bounding boxes, real camps:
//  - camp A: a gold order with 3 items (two Lv tags), Bram with 2 (Lv), Ivo with 1, Bram with 3 (Lv);
//  - camp B: Ivo ready (Deliver), a gold order with 2 items, Bram with 2 (Lv), Ivo with 1;
//  - a new camp (the lead card); each also with a crew card selected (tapped).
// Checked: no overlap between counts and bottom labels, Lv tags and the face/reward/labels/other art, art and labels,
// counts and each other; no text cut; everything inside its card; three cards fully in view at first sight
// (360/375/390/430 px, no sideways page scroll). ENGINES (default chromium,webkit), WIDTHS.
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const {chromium,webkit}=require('playwright');
const ORIGIN=process.env.ORIGIN||'http://127.0.0.1:8080',KEY='vaultwake-v5-coast';
const WIDTHS=(process.env.WIDTHS||'360,375,390,402,430').split(',').map(Number);
const base=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures','coast','coast-ch1-pre-secondary.json'),'utf8'));base.daily={day:9e6,count:1};
const N=(family,tier,count=1)=>({family,tier,count});
// camps: each a set of orders (gold first, then crew). Lv badges come from one chain at two levels in one order.
const camps={
 A:{note:'gold 3 items (Lv), Bram 2 (Lv3/Lv2), Ivo 1, Bram 3 (Lv)',orders:[
  {id:'g1',who:'bram',needs:[N('chart',3),N('rig',3),N('rig',2)],coins:115,story:'beach-workshop'},
  {id:'c1',who:'bram',needs:[N('rig',3),N('rig',2,2)],coins:55,role:'pair',born:240},
  {id:'c2',who:'ivo',needs:[N('rig',2)],coins:10,role:'use',born:241},
  {id:'c3',who:'bram',needs:[N('chart',1),N('chart',2),N('rig',1)],coins:20,role:'pair',born:242}]},
 B:{note:'gold 2 items (1/2), Ivo ready (2/2), Bram 2 (Lv), Ivo 1',ready:true,orders:[
  {id:'g1',who:'bram',needs:[N('chart',3),N('rig',3,2)],coins:115,story:'beach-workshop'},
  {id:'c1',who:'ivo',needs:[N('rig',1,2)],coins:12,role:'use',born:240},
  {id:'c2',who:'bram',needs:[N('rig',4),N('rig',3)],coins:60,role:'pair',born:241},
  {id:'c3',who:'ivo',needs:[N('chart',2)],coins:10,role:'use',born:242}]},
};
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const measure=page=>page.evaluate(()=>{
 const R=e=>{const r=e.getBoundingClientRect();return {x:r.left,y:r.top,r:r.right,b:r.bottom,w:r.width,h:r.height};};
 const hit=(a,b)=>Math.min(a.r,b.r)-Math.max(a.x,b.x)>0.5&&Math.min(a.b,b.b)-Math.max(a.y,b.y)>0.5;
 const vgap=(upper,lower)=>lower.y-upper.b;// >0: space between, <0: overlap
 const W=innerWidth,cards=[...document.querySelectorAll('#requests .requestCard')];
 const out=cards.map(c=>{const cr=R(c),q=s=>[...c.querySelectorAll(s)].filter(e=>e.offsetParent!==null&&getComputedStyle(e).display!=='none'&&getComputedStyle(e).visibility!=='hidden').map(R);
  const arts=q('.requestItems>span>:is(svg,img)'),counts=q('.requestItems>span>b'),lvs=q('.requestItems .reqLv'),labels=q('.reqName>b, .reqName .reqTag'),face=q('.reqFace'),reward=q('.requestReward, .reqDeliver'),stuck=q('.reqStuck');
  const issues=[];const pair=(A,B,n)=>{for(const a of A)for(const b of B)if(hit(a,b))issues.push(n);};
  pair(counts,labels,'count×label');pair(lvs,face,'Lv×face');pair(lvs,reward,'Lv×reward');pair(lvs,labels,'Lv×label');pair(arts,labels,'art×label');pair(arts,reward,'art×reward');pair(arts,face,'art×face');pair(counts,reward,'count×reward');pair(lvs,counts,'Lv×count');
  for(let i=0;i<counts.length;i++)for(let j=i+1;j<counts.length;j++)if(hit(counts[i],counts[j]))issues.push('count×count');
  {const spans=[...c.querySelectorAll('.requestItems>span')];spans.forEach((sp,i)=>{const lv=sp.querySelector('.reqLv');if(!lv)return;const L=R(lv);spans.forEach((o,j)=>{if(j!==i){const a=o.querySelector('svg,img');if(a&&hit(L,R(a)))issues.push('Lv×other art');}});});}
  {const n=c.querySelector('.reqName');if(n){const kids=[...n.children].filter(e=>getComputedStyle(e).display!=='none');const need=kids.reduce((s,e)=>s+e.scrollWidth,0)+(kids.length-1)*parseFloat(getComputedStyle(n).columnGap||0);if(need>n.clientWidth+0.5)issues.push('label needs '+Math.ceil(need)+' of '+n.clientWidth);}}
  for(const e of c.querySelectorAll('.reqName>b,.reqName .reqTag,.requestItems>span>b,.requestReward,.reqDeliver'))if(e.offsetParent!==null&&e.scrollWidth>e.clientWidth+1)issues.push('text cut');
  const inside=[...arts,...counts,...lvs,...labels,...face,...reward].every(r=>r.x>=cr.x-1&&r.r<=cr.r+1&&r.y>=cr.y-1&&r.b<=cr.b+1);if(!inside)issues.push('outside card');
  const gapCL=counts.length&&labels.length?Math.min(...counts.map(k=>Math.min(...labels.map(l=>vgap(k,l))))):null;
  const gapLvTop=lvs.length?Math.min(...lvs.map(l=>Math.min(...[...face,...reward].map(t=>vgap(t,l))))):null;
  const lvArea=lvs.length&&arts.length?Math.round(100*lvs.reduce((s,l)=>s+l.w*l.h,0)/lvs.length/(arts[0].w*arts[0].h)):null;
  return {id:c.dataset.order,cls:[...c.classList].filter(k=>/ready|storyOrder|active|lead/.test(k)).join(' '),w:Math.round(cr.w),h:Math.round(cr.h),left:Math.round(cr.x),right:Math.round(cr.r),items:arts.length,lvs:lvs.length,
   countFont:counts[0]?getComputedStyle(c.querySelector('.requestItems>span>b')).fontSize:null,lvFont:lvs.length?getComputedStyle(c.querySelector('.reqLv')).fontSize:null,
   gapCountLabel:gapCL==null?null:Math.round(gapCL*10)/10,gapLvTop:gapLvTop==null?null:Math.round(gapLvTop*10)/10,lvAreaPct:lvArea,issues:[...new Set(issues)]};});
 const fully=out.filter(c=>c.left>=0&&c.right<=W).length;
 return {W,cards:out,fullyVisible:fully,sw:document.scrollingElement.scrollWidth,board:(()=>{const b=document.querySelector('#board').getBoundingClientRect();return {top:Math.round(b.top),bottom:Math.round(b.bottom),w:Math.round(b.width)};})(),scrollY:scrollY};});
(async()=>{for(const engine of (process.env.ENGINES||'chromium,webkit').split(',')){
 let browser;try{browser=await {chromium,webkit}[engine].launch();}catch(e){if(engine!=='chromium'&&/Executable doesn't exist/.test(e.message)){console.log(`${engine}: not installed here, skipped`);continue;}throw e;}
 try{for(const W of WIDTHS){
  const check=(m,what)=>{const tag=`${engine} ${W}px ${what}`;
   for(const c of m.cards)assert.deepEqual(c.issues,[],`${tag}, card ${c.id} (${c.cls||'crew'}, ${c.items} items): ${c.issues.join(', ')}`);
   assert.ok(m.sw<=W+1,`${tag}: no sideways page scroll (${m.sw})`);
   const first=[...m.cards].sort((a,b)=>a.left-b.left).slice(0,3);assert.ok(first.length===Math.min(3,m.cards.length)&&first.every(c=>c.left>=-0.5&&c.right<=W+0.5),`${tag}: three cards in view (${first.map(c=>c.left+'–'+c.right).join(', ')})`);};
  const runCase=async(name,seed)=>{const mobile=engine==='chromium';const ctx=await browser.newContext({viewport:{width:W,height:800},isMobile:mobile,hasTouch:true}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   if(seed)await page.addInitScript(([k,v])=>{if(!sessionStorage.s){localStorage.setItem(k,v);localStorage.setItem('vaultwake-v5-coast-story','{"intro":"skip"}');sessionStorage.s=1;}},[KEY,JSON.stringify(seed)]);
   await page.goto(ORIGIN+'/v5/play.html');await page.waitForSelector('#board .tile');
   for(let k=0;k<30;k++){if(await page.evaluate(()=>!document.querySelector('#home').hidden&&!document.querySelector('#homePlay').hidden)){await page.tap('#homePlay');await delay(300);continue;}
    if(await page.evaluate(()=>!document.querySelector('#story').hidden)){await page.tap('#storySkip');await delay(300);continue;}break;}
   await delay(1300);check(await measure(page),name);
   const sel=await page.evaluate(()=>[...document.querySelectorAll('#requests .requestCard')].find(c=>!c.classList.contains('ready')&&!c.classList.contains('storyOrder'))?.dataset.order);
   if(sel){await page.locator(`#requests [data-order="${sel}"]`).tap();await delay(500);await page.keyboard.press('Escape').catch(()=>{});await delay(300);
    const m=await measure(page);for(const c of m.cards)assert.deepEqual(c.issues,[],`${engine} ${W}px ${name} + selected, card ${c.id}: ${c.issues.join(', ')}`);}
   assert.deepEqual(errors,[],`${engine} ${W}px ${name}: no page errors`);await ctx.close();};
  await runCase('new camp',null);
  for(const [k,c] of Object.entries(camps)){const s=JSON.parse(JSON.stringify(base));s.orders=c.orders;s.nextOrder=900;
   if(c.ready){s.board[20]={type:'item',family:'rig',tier:1};s.board[21]={type:'item',family:'rig',tier:1};s.board[15]={type:'item',family:'rig',tier:3};}
   await runCase('camp '+k+' ('+c.note+')',s);}
  console.log(`ok ${engine} ${W}px: order cards (gold, crew, ready, selected, lead; 1–3 items, Lv tags): no overlap, no cut text, three in view`);
 }}finally{await browser.close();}}
 console.log('order card browser tests passed');
})().catch(e=>{console.error(e);process.exit(1);});
