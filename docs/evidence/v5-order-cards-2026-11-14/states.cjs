// Order rail in its states, cropped above the board. usage: node states.cjs <port> <label> <outdir>
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const [port,label,OUT]=process.argv.slice(2);fs.mkdirSync(OUT,{recursive:true});
const fix=JSON.parse(fs.readFileSync('/home/user/vaultwake/tests/fixtures/coast/coast-ch1-pre-secondary.json','utf8'));
const place=(s,ids)=>{const empty=[...s.board.keys()].filter(i=>s.board[i]===null);for(const id of ids){const o=s.orders.find(o=>o.id===id);for(const n of o.needs)for(let k=0;k<n.count;k++)s.board[empty.shift()]={type:'item',family:n.family,tier:n.tier};}return s;};
const states={
 'new':null,
 'played':()=>structuredClone(fix),
 'crew-ready':()=>place(structuredClone(fix),['o13']),
 'gold-ready+selected':()=>place(structuredClone(fix),['o16']),
};
(async()=>{const b=await chromium.launch();const rows=[];
 for(const [W,H] of [[360,640],[390,844],[430,932]])for(const [name,make] of Object.entries(states)){
  const ctx=await b.newContext({viewport:{width:W,height:H},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  if(make){const s=make();s.daily={day:9e6,count:1};await ctx.addInitScript(v=>{if(!sessionStorage.s){localStorage.setItem('vaultwake-v5-coast',v);localStorage.setItem('vaultwake-v5-coast-story','{"intro":"skip"}');sessionStorage.s=1;}},JSON.stringify(s));}
  const p=await ctx.newPage();await p.goto(`http://127.0.0.1:${port}/v5/play.html`);
  if(make){await p.waitForSelector('#homePlay:not([hidden])',{timeout:30000});await p.locator('#homePlay').click();}
  await p.waitForSelector('#home',{state:'hidden',timeout:30000});await p.waitForTimeout(1000);
  for(let n=0;n<6&&await p.locator('#beat[open]').count();n++){await p.locator('#beatNext').click();await p.waitForTimeout(150);}
  if(await p.locator('#daily[open]').count())await p.locator('#daily .close').click();
  if(name==='gold-ready+selected'){const c=await p.locator('[data-order="o14"]').boundingBox();await p.touchscreen.tap(c.x+c.width/2,c.y+c.height/2);await p.waitForTimeout(500);
   if(await p.locator('.orderTools:not([hidden]) .sheetClose,#orderTools[open] .sheetClose').count())await p.keyboard.press('Escape');}
  await p.waitForTimeout(700);
  const m=await p.evaluate(()=>{const cards=[...document.querySelectorAll('#requests .requestCard')].map(c=>{const r=c.getBoundingClientRect();return `${c.dataset.order}${c.classList.contains('storyOrder')?'(gold)':''}${c.classList.contains('lead')?'[lead]':''}${c.classList.contains('ready')?'[ready]':''}${c.classList.contains('active')?'[sel]':''} ${Math.round(r.width)}x${Math.round(r.height)}@${Math.round(r.left)}`;});
   return {cards,boardTop:Math.round(document.querySelector('#board').getBoundingClientRect().top+scrollY),boardBottom:Math.round(document.querySelector('#board').getBoundingClientRect().bottom+scrollY)};});
  rows.push({size:`${W}x${H}`,state:name,boardTop:m.boardTop,boardBottom:m.boardBottom,cards:m.cards.join(' | ')});
  await p.screenshot({path:path.join(OUT,`${label}-${name}-${W}x${H}.png`),clip:{x:0,y:0,width:W,height:Math.min(m.boardTop+60,H)}});
  await ctx.close();}
 for(const r of rows)console.log(JSON.stringify(r));fs.writeFileSync(path.join(OUT,`${label}-states.json`),JSON.stringify(rows,null,1));await b.close();})();
