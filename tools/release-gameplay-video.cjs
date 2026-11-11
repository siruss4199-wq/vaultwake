// Vaultwake Merge gameplay preview capture (release 2026-11-08): plays the release ZIP for real in Chromium
// and records it with a DevTools screencast at full device pixels (no cursor, real time, no sound): two
// Rivet Rover taps, two merges, an order delivered for coins, a camp stage built on the beach and its story
// line. The camp is the save from tools/release-video-save.mjs; nothing in the game is changed.
//   SAVE=save.json OUT=frames/ VIEW='[540,810,2]' URL=http://127.0.0.1:8081/index.html node tools/release-gameplay-video.cjs
// then tools/release-video-assemble.py turns the frames into the MP4 (cover first, then the play).
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const {enterHome}=require('../tests/v5-next-home-helper.cjs');
const save=fs.readFileSync(process.env.SAVE,'utf8'),URL=process.env.URL||'http://127.0.0.1:8081/index.html',OUT=process.env.OUT;
const [W,H,DPR]=JSON.parse(process.env.VIEW);const KEY='vaultwake-v5-coast';
const SDK='window.CrazyGames={SDK:{environment:"local",init:async()=>{},game:{loadingStart(){},loadingStop(){},gameplayStart(){},gameplayStop(){},happytime(){}},data:{getItem(){return null},setItem(){},removeItem(){},clear(){}},user:{isUserAccountAvailable:false},ad:{requestAd(t,c){c.adError&&c.adError()}}}};';
(async()=>{
 fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:W,height:H},deviceScaleFactor:DPR,hasTouch:W<H});
 const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://sdk.crazygames.com/**',r=>r.fulfill({status:200,contentType:'application/javascript',body:SDK}));
 await page.addInitScript(([k,v])=>{if(!sessionStorage.getItem('seeded')){localStorage.setItem(k,v);sessionStorage.setItem('seeded','1');}},[KEY,save]);
 await page.goto(URL);await page.waitForTimeout(1200);await enterHome(page);await page.waitForSelector('#board .tile');await page.waitForTimeout(1200);
 const state=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
 const centre=async i=>{const r=await page.locator(`#board [data-index="${i}"]`).boundingBox();return {x:r.x+r.width/2,y:r.y+r.height/2};};
 const tap=async(sel)=>{const r=await page.locator(sel).first().boundingBox();await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.down();await page.waitForTimeout(70);await page.mouse.up();};
 const drag=async(a,z)=>{const p=await centre(a),q=await centre(z);await page.mouse.move(p.x,p.y);await page.mouse.down();await page.waitForTimeout(90);await page.mouse.move(q.x,q.y,{steps:16});await page.waitForTimeout(60);await page.mouse.up();};
 const pair=(s,f,t)=>{const i=s.board.flatMap((x,k)=>x?.type==='item'&&x.family===f&&x.tier===t?[k]:[]);return i.length>=2?[i[0],i[1]]:null;};
 // screencast
 const cdp=await ctx.newCDPSession(page);const frames=[];let n=0;
 cdp.on('Page.screencastFrame',async f=>{const file=path.join(OUT,String(n++).padStart(5,'0')+'.jpg');fs.writeFileSync(file,Buffer.from(f.data,'base64'));frames.push({file,t:f.metadata.timestamp});cdp.send('Page.screencastFrameAck',{sessionId:f.sessionId}).catch(()=>{});});
 await cdp.send('Page.startScreencast',{format:'jpeg',quality:92,maxWidth:W*DPR,maxHeight:H*DPR,everyNthFrame:1});
 const log=[];const mark=m=>log.push({at:Date.now(),m});
 await page.waitForTimeout(900);
 // 1. two taps on the Rivet Rover: new parts
 const rover=(await state()).board.findIndex(x=>x?.type==='source'&&x.id==='rig');
 for(let k=0;k<2;k++){await tap(`#board [data-index="${rover}"]`);mark('produce');await page.waitForTimeout(650);}
 // 2. two Split spanners into a Pocket winch, 3. two Pocket winches into a Crawler jack
 let s=await state();const coins0=s.coins;
 let p=pair(s,'rig',2);await drag(p[0],p[1]);mark('merge rig2');await page.waitForTimeout(800);
 s=await state();p=pair(s,'rig',3);await drag(p[0],p[1]);mark('merge rig3');await page.waitForTimeout(900);
 // 4. Ivo's order (Pocket winch + Crawler jack) is ready: deliver it
 s=await state();const big=s.orders.find(o=>o&&o.needs.some(n=>n.tier===4));
 await tap(`[data-order="${big.id}"]`);mark('deliver');await page.waitForTimeout(1500);
 s=await state();if(s.coins<=coins0)throw new Error('no coins from the delivery');
 
 // 6. the beach: build the tent's second stage
 await tap('#mapButton');mark('map');await page.waitForTimeout(1300);
 await tap('#mapContent [data-restore="beach-tent"]');mark('build');await page.waitForTimeout(2200);
 // the story line for the new stage: read it, then Next until the beach shows again
 for(let k=0;k<4;k++){if(!await page.locator('#beat[open] #beatNext').count())break;await page.waitForTimeout(900);await tap('#beat[open] #beatNext');mark('next');await page.waitForTimeout(500);}
 await page.waitForTimeout(1600);
 s=await state();if(s.built['beach-tent']!==2)throw new Error('the tent was not built: '+JSON.stringify(s.built));
 await cdp.send('Page.stopScreencast');await page.waitForTimeout(300);
 fs.writeFileSync(path.join(OUT,'frames.json'),JSON.stringify({frames,log,errors,coins:[coins0,s.coins],built:s.built}));
 console.log(JSON.stringify({frames:frames.length,secs:(frames.at(-1).t-frames[0].t).toFixed(1),errors,coins:[coins0,s.coins],built:s.built}));
 await b.close();})().catch(e=>{console.error(e);process.exit(1);});
