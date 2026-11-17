// Board Full Rescue evidence: the same full-board camps on the build before (ORIGIN_BEFORE) and with the rescue
// (ORIGIN_AFTER), iPhone-sized (W×H), actual phone scale (2× pixels). Run from the repo root. OUT: folder for PNGs.
const {chromium,webkit}=require('playwright');const fs=require('fs');const path=require('path');
const ENGINE=process.env.ENGINE||'chromium',W=+(process.env.W||390),H=+(process.env.H||664),OUT=process.env.OUT;
const B=process.env.ORIGIN_BEFORE||'http://127.0.0.1:8090',A=process.env.ORIGIN_AFTER||'http://127.0.0.1:8080';
const base=JSON.parse(fs.readFileSync(path.join(process.cwd(),'tests/fixtures/coast/coast-ch1-pre-secondary.json'),'utf8'));
const it=(f,t)=>({type:'item',family:f,tier:t}),G={type:'glass',family:'rope',tier:1};
function camp(things,{shed=[null,null,null,null],seen={}}={}){const s=structuredClone(base);s.pending=[];s.shed=shed;s.secOpen={rig:true,chart:true};s.daily={day:9e6,count:1};
 s.seen={'tip-ice':true,'tip-genmerge':true,'extras-rig':true,'extras-chart':true,...seen};const open=[];s.board=s.board.map((x,i)=>{if(x?.type==='source')return x;open.push(i);return G;});
 things.forEach((x,k)=>{s.board[open[open.length-1-k]]=x;});return s;}
const delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await {chromium,webkit}[ENGINE].launch();
 const open=async(origin,seed)=>{const ctx=await b.newContext({viewport:{width:W,height:H},isMobile:ENGINE==='chromium',hasTouch:true,deviceScaleFactor:2}),page=await ctx.newPage();
  await page.addInitScript(([k,v])=>{if(!sessionStorage.s){localStorage.setItem(k,v);localStorage.setItem('vaultwake-v5-coast-story','{"intro":"skip"}');sessionStorage.s=1;}},['vaultwake-v5-coast',JSON.stringify(seed)]);
  await page.goto(origin+'/v5/play.html');await page.waitForSelector('#board .tile');await delay(1200);
  for(let k=0;k<6;k++){if(await page.evaluate(()=>!document.querySelector('#home')?.hidden&&!document.querySelector('#homePlay')?.hidden)){await page.locator('#homePlay').click();await delay(800);}}
  await delay(1200);return {ctx,page};};
 const shot=async(page,n)=>{await page.screenshot({path:`${OUT}/${n}-${ENGINE}-${W}x${H}.png`});};
 const tap=async(page,l)=>{await l.scrollIntoViewIfNeeded().catch(()=>{});const x=await l.boundingBox();await page.touchscreen.tap(x.x+x.width/2,x.y+x.height/2);await delay(700);};
 const hint=async page=>{const h=page.locator('#guideHint');if(await h.isVisible())await tap(page,h);await delay(500);};
 const rows=[];
 for(const [tag,origin] of [['before',B],['after',A]]){
  // 1. the first full board, an order ready (no Hint pressed)
  {const {ctx,page}=await open(origin,camp([it('chart',1),it('rig',1)]));await page.evaluate(()=>scrollTo(0,0));await shot(page,`${tag}-1-first-full-board`);
   rows.push({tag,case:'first full board',line:await page.locator('#hint').innerText().catch(()=>''),spot:await page.evaluate(()=>document.body.dataset.spot??null),moment:await page.locator('.moment').innerText().catch(()=>null)});await ctx.close();}
  // 2. a free shed space, from the Hint: the part, then (selected) the Shed button
  {const {ctx,page}=await open(origin,camp([{type:'kit',family:'rig',size:1,left:3}],{seen:{'tip-shed':true}}));await hint(page);await shot(page,`${tag}-2-shed-hint`);
   const t=await page.evaluate(()=>window.VWGuide?.step?.target??null);rows.push({tag,case:'shed: Hint',line:await page.locator('#hint').innerText().catch(()=>''),msg:await page.locator('#message').innerText(),target:t});
   if(t?.kind==='cell'){await tap(page,page.locator(`#board [data-index="${t.index}"]`));await shot(page,`${tag}-3-shed-button`);}
   else{const i=await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('vaultwake-v5-coast'));return s.board.findIndex(x=>x?.type==='kit');});await tap(page,page.locator(`#board [data-index="${i}"]`));await shot(page,`${tag}-3-shed-button`);}
   await ctx.close();}
  // 4. the shed full: Clear, confirmed
  {const {ctx,page}=await open(origin,camp([it('rope',0)],{shed:[it('lamp',0),it('lamp',1),it('lamp',2),it('lamp',3)],seen:{'tip-shed':true}}));await hint(page);
   const t=await page.evaluate(()=>window.VWGuide?.step?.target??null);if(t?.kind==='cell'){await tap(page,page.locator(`#board [data-index="${t.index}"]`));await tap(page,page.locator('#selection [data-action="recycle"]'));}
   await shot(page,`${tag}-4-clear-confirm`);rows.push({tag,case:'clear',line:await page.locator('#hint').innerText().catch(()=>''),msg:await page.locator('#message').innerText()});await ctx.close();}
 }
 fs.writeFileSync(`${OUT}/rows-${ENGINE}-${W}x${H}.json`,JSON.stringify(rows,null,1));console.log(JSON.stringify(rows,null,1));await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
