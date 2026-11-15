// Order card collisions: real bounding boxes inside each card, at mobile widths, for crafted camps.
// ORIGIN, OUT, LABEL, WIDTHS (default 360,375,390,430), SHOTS=1
const fs=require('fs'),path=require('path');const {chromium}=require('playwright');
const ORIGIN=process.env.ORIGIN||'http://127.0.0.1:8080',OUT=process.env.OUT,LABEL=process.env.LABEL||'x',KEY='vaultwake-v5-coast';
const WIDTHS=(process.env.WIDTHS||'360,375,390,430').split(',').map(Number);
const base=JSON.parse(fs.readFileSync('/home/user/vaultwake/tests/fixtures/coast/coast-ch1-pre-secondary.json','utf8'));base.daily={day:9e6,count:1};
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
(async()=>{const browser=await chromium.launch(),rows=[];
 for(const W of WIDTHS){
  const runCase=async(name,seed)=>{const ctx=await browser.newContext({viewport:{width:W,height:800},isMobile:true,hasTouch:true,deviceScaleFactor:3}),page=await ctx.newPage();
   if(seed)await page.addInitScript(([k,v])=>{if(!sessionStorage.s){localStorage.setItem(k,v);localStorage.setItem('vaultwake-v5-coast-story','{"intro":"skip"}');sessionStorage.s=1;}},[KEY,JSON.stringify(seed)]);
   await page.goto(ORIGIN+'/v5/play.html');await page.waitForSelector('#board .tile');
   for(let k=0;k<30;k++){if(await page.evaluate(()=>!document.querySelector('#home').hidden&&!document.querySelector('#homePlay').hidden)){await page.tap('#homePlay');await delay(300);continue;}
    if(await page.evaluate(()=>!document.querySelector('#story').hidden)){await page.tap('#storySkip');await delay(300);continue;}break;}
   await delay(1300);const shot=async n=>{if(OUT&&process.env.SHOTS){const r=await page.locator('#requests').boundingBox();await page.screenshot({path:path.join(OUT,`${LABEL}-${W}-${n}.png`),clip:{x:0,y:Math.max(0,r.y-4),width:W,height:r.height+8}});}};
   const m=await measure(page);rows.push({W,case:name,...m});await shot(name);
   // selected: tap the first crew card that is not ready (a tap on a ready card delivers it)
   const sel=await page.evaluate(()=>[...document.querySelectorAll('#requests .requestCard')].find(c=>!c.classList.contains('ready')&&!c.classList.contains('storyOrder'))?.dataset.order);
   if(sel){await page.locator(`#requests [data-order="${sel}"]`).tap();await delay(500);await page.keyboard.press('Escape').catch(()=>{});await delay(300);
    const m2=await measure(page);rows.push({W,case:name+' +selected',...m2});await shot(name+'-selected');}
   await ctx.close();};
  await runCase('new player',null);
  for(const [k,c] of Object.entries(camps)){const s=JSON.parse(JSON.stringify(base));s.orders=c.orders;s.nextOrder=900;
   if(c.ready){const i=s.board.findIndex(x=>x===null||x?.type==='item');s.board[20]={type:'item',family:'rig',tier:1};s.board[21]={type:'item',family:'rig',tier:1};s.board[15]={type:'item',family:'rig',tier:3};}
   await runCase('camp '+k,s);}
 }
 await browser.close();if(OUT)fs.writeFileSync(path.join(OUT,LABEL+'.json'),JSON.stringify(rows,null,1));
 for(const r of rows){console.log(`${r.W} ${r.case}: fully visible cards ${r.fullyVisible}/${r.cards.length}, sw ${r.sw}, board ${r.board.top}-${r.board.bottom} w${r.board.w}`);
  for(const c of r.cards)console.log(`   ${c.id.padEnd(3)} ${c.cls.padEnd(22)} ${c.w}x${c.h} items ${c.items} Lv ${c.lvs} | count ${c.countFont} Lv ${c.lvFont} (${c.lvAreaPct??'-'}% of art) | gap count→label ${c.gapCountLabel} | gap face/reward→Lv ${c.gapLvTop} | ${c.issues.join(', ')||'no overlap'}`);}
})().catch(e=>{console.error(e);process.exit(1);});
