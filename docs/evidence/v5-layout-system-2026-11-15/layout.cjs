// Whole gameplay screen audit: regions, proportions, sizes, collisions, screenshots.
// ORIGIN, OUT, LABEL, VIEWPORTS (WxH list)
const fs=require('fs'),path=require('path');const {chromium}=require('playwright');
const ORIGIN=process.env.ORIGIN||'http://127.0.0.1:8080',OUT=process.env.OUT,LABEL=process.env.LABEL||'x',KEY='vaultwake-v5-coast';
const VIEWPORTS=(process.env.VIEWPORTS||'360x640,375x667,390x664,390x844,402x874,430x932,907x510').split(',').map(s=>s.split('x').map(Number));
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

const screen=page=>page.evaluate(()=>{const R=s=>{const e=typeof s==='string'?document.querySelector(s):s;if(!e||e.offsetParent===null&&getComputedStyle(e).position!=='fixed')return null;const r=e.getBoundingClientRect();if(!r.width&&!r.height)return null;return {top:+r.top.toFixed(1),bottom:+r.bottom.toFixed(1),left:+r.left.toFixed(1),right:+r.right.toFixed(1),w:+r.width.toFixed(1),h:+r.height.toFixed(1)};};
 const fs_=s=>{const e=document.querySelector(s);return e&&e.offsetParent!==null?parseFloat(getComputedStyle(e).fontSize):null;};
 const W=innerWidth,H=innerHeight,hud=R('main.game header'),req=R('#requests'),strip=R('#mapButton'),hint=R('#hint'),board=R('#board'),tile=R('#board .tile');
 const cards=[...document.querySelectorAll('#requests .requestCard')].map(c=>({cls:[...c.classList].filter(k=>/lead|storyOrder|ready|active/.test(k)).join(' ')||'crew',...R(c)}));
 const hand=document.querySelector('#coachHand:not([hidden]) svg');const handR=hand?R(hand):null;
 const outlined=[...document.querySelectorAll('#requests .requestCard,#mapButton,#board .tile,#hint,#hint *')].filter(e=>{const c=getComputedStyle(e);return e.offsetParent!==null&&(c.outlineStyle!=='none'&&parseFloat(c.outlineWidth)>0||e.classList.contains('coachTarget'));}).map(e=>e.id||e.className.baseVal||e.className);
 const btn=s=>[...document.querySelectorAll(s)].filter(e=>e.offsetParent!==null).map(e=>{const r=e.getBoundingClientRect();return [Math.round(r.width),Math.round(r.height)];});
 return {W,H,scrollY:Math.round(scrollY),hud,req,strip,hint,board,tile:tile?.w,cards,hand:handR,outlined,
  aboveBoard:board?+(board.top-(hud?.top??0)).toFixed(1):null,boardShareH:board?+(board.h/H).toFixed(3):null,boardShareArea:board?+(board.w*board.h/(W*H)).toFixed(3):null,boardFull:board?board.top>=0&&board.bottom<=H:null,
  gaps:{hudReq:req&&hud?+(req.top-hud.bottom).toFixed(1):null,reqStrip:strip&&req?+(strip.top-req.bottom).toFixed(1):null,stripHint:hint&&strip?+(hint.top-strip.bottom).toFixed(1):null,toBoard:board?+(board.top-((hint??strip)?.bottom??0)).toFixed(1):null},
  sizes:{face:R('#requests .requestCard .reqFace')?.w,leadFace:R('#requests .requestCard.lead .reqFace')?.w,item:R('#requests .requestCard:not(.lead) .requestItems>span>:is(svg,img)')?.w,leadItem:R('#requests .requestCard.lead .requestItems>span>:is(svg,img)')?.w,stripH:strip?.h,stripAction:btn('#mapButton .rsAction')[0],deliver:btn('#requests .reqDeliver')[0],bulb:btn('#hintButton,#hint .hintBulb,#hint button')[0],skip:btn('#coachSkip')[0],menu:btn('#menuButton')[0]},
  fonts:{cardName:fs_('#requests .requestCard .reqName b'),count:fs_('#requests .requestItems>span>b'),lv:fs_('#requests .reqLv'),reward:fs_('#requests .requestReward'),stripTitle:fs_('#mapButton .rsText b'),guide:fs_('#hint .gWhat'),guideWhy:fs_('#hint .gWhy'),hudNum:fs_('#energyPill strong, #energyPill b, #energyPill')}};});
(async()=>{const browser=await chromium.launch(),rows=[];
 for(const [W,H] of VIEWPORTS){const mobile=W<700;
  const runCase=async(name,seed,select)=>{const ctx=await browser.newContext({viewport:{width:W,height:H},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:2}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   if(seed)await page.addInitScript(([k,v])=>{if(!sessionStorage.s){localStorage.setItem(k,v);localStorage.setItem('vaultwake-v5-coast-story','{"intro":"skip"}');sessionStorage.s=1;}},[KEY,JSON.stringify(seed)]);
   await page.goto(ORIGIN+'/v5/play.html');await page.waitForSelector('#board .tile');
   const tap=async s=>{if(mobile)await page.tap(s);else await page.click(s);};
   for(let k=0;k<30;k++){if(await page.evaluate(()=>!document.querySelector('#home').hidden&&!document.querySelector('#homePlay').hidden)){await tap('#homePlay');await delay(300);continue;}
    if(await page.evaluate(()=>!document.querySelector('#story').hidden)){await tap('#storySkip');await delay(300);continue;}break;}
   await delay(1500);
   if(select){const sel=await page.evaluate(()=>[...document.querySelectorAll('#requests .requestCard')].find(c=>!c.classList.contains('ready')&&!c.classList.contains('storyOrder'))?.dataset.order);if(sel){await tap(`#requests [data-order="${sel}"]`);await delay(600);await page.keyboard.press('Escape').catch(()=>{});await delay(400);}}
   const s=await screen(page),m=await measure(page);
   rows.push({vp:`${W}x${H}`,case:name,...s,cardIssues:m.cards.filter(c=>c.issues.length).map(c=>c.id+':'+c.issues.join('+')),fullyVisible:m.fullyVisible,errors});
   if(OUT)await page.screenshot({path:path.join(OUT,`${LABEL}-${W}x${H}-${name.replace(/[^a-z0-9]+/gi,'-')}.png`)});await ctx.close();};
  await runCase('new player (tutorial)',null,false);
  const mk=c=>{const s=JSON.parse(JSON.stringify(base));s.orders=c.orders;s.nextOrder=900;if(c.ready){s.board[20]={type:'item',family:'rig',tier:1};s.board[21]={type:'item',family:'rig',tier:1};s.board[15]={type:'item',family:'rig',tier:3};}return s;};
  await runCase('returning gold',mk(camps.A),false);
  await runCase('ready + selected',mk(camps.B),true);
 }
 await browser.close();if(OUT)fs.writeFileSync(path.join(OUT,LABEL+'.json'),JSON.stringify(rows,null,1));
 for(const r of rows){const cw=r.cards.map(c=>`${c.cls[0]=='l'?'L':c.cls.includes('story')?'G':'c'}${Math.round(c.w)}x${Math.round(c.h)}`).join(' ');
  console.log(`${r.vp.padEnd(8)} ${r.case.padEnd(22)} hud ${r.hud?.top}-${r.hud?.bottom} req ${r.req?.top}-${r.req?.bottom} strip ${r.strip?.top}-${r.strip?.bottom} hint ${r.hint?r.hint.top+'-'+r.hint.bottom:'-'} board ${r.board?.top}-${r.board?.bottom} (${r.board?.w}, tile ${r.tile}) above ${r.aboveBoard} shareH ${r.boardShareH} full ${r.boardFull} | cards ${cw} vis ${r.fullyVisible} | hand ${r.hand?Math.round(r.hand.w)+'x'+Math.round(r.hand.h):'-'} outlines ${r.outlined.length} | issues ${r.cardIssues.join(',')||'none'} ${r.errors.length?'ERR':''}`);}
})().catch(e=>{console.error(e);process.exit(1);});
