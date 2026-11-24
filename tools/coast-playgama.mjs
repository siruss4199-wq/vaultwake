// Vaultwake Merge's Playgama build (2026-11-24, release/playgama). The page is made from v5/play.html so the
// builds never drift: the same game, with the Playgama Bridge SDK (vendor/playgama-bridge, unmodified) loaded
// first in <head> and initialised before the game loads (v5/next/playgama-boot.js), rewarded and interstitial
// ads through the Bridge (v5/next/platform-pg.mjs) and progress in the Bridge's Storage module.
//   node tools/coast-playgama.mjs        writes dist/playgama/ and dist/vaultwake-merge-playgama.zip
//
// The archive (Playgama Game Requirements 1.3.2): index.html at its root, Latin file names only, and only what
// the game loads:
//  - the game's v5/ files at the archive root, so index.html is the game page itself (the Bridge must run in
//    the page that runs the game, and its config is read from ./playgama-bridge-config.json beside it);
//  - only the modules in the game's import graph (tools/coast-modules.mjs), so Classic V5 and its pages stay out;
//  - no CrazyGames code: the CrazyGames adapter is left out, platform.mjs is the Playgama adapter only, and
//    the Classic platform module (v4/platform.mjs, a CrazyGames wrapper) is replaced by an inert one;
//  - the assets the CrazyGames ZIP ships (the same filters: no review art, no notes, no developer pages, no
//    images the game never loads);
//  - playgama-bridge.js, its LICENSE (LGPL v3) and playgama-bridge-config.json.
// Reproducible: fixed timestamps (SOURCE_DATE_EPOCH, default 2026-01-01 UTC), sorted entries, no extra
// attributes, so the same commit always gives the same bytes.
import {readFileSync,writeFileSync,mkdirSync,rmSync,cpSync,readdirSync,statSync,utimesSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {join,dirname,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import {moduleGraph,ENTRY_RE} from './coast-modules.mjs';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
export const BRIDGE_VERSION='2.4.4';
const BRIDGE_DIR=join(root,'vendor/playgama-bridge',BRIDGE_VERSION);
// Rewarded placements match the offers (game.mjs SHOP adEnergy/adCrate and the order change); the interstitial
// placement is the game's one natural pause (back to the board after building). No delays or counters are set:
// the Bridge's platform defaults are what moderation expects (Bridge docs, Interstitial).
export const CONFIG={
 advertisement:{
  interstitial:{placements:[{id:'stage_built'}]},
  rewarded:{placements:[{id:'energy'},{id:'crate'},{id:'new_order'}]}
 }
};
const STYLE_RE=/<link rel="stylesheet" href="([^"]+)">/g;
const BOOT_RE=/<script src="(next\/boot\.js[^"]*)"><\/script>/;
export function playgamaPage(play){
 const styles=[...play.matchAll(STYLE_RE)].map(m=>m[1]),boot=play.match(BOOT_RE)?.[1],app=play.match(ENTRY_RE)?.[1];
 if(!styles.length||!boot||!app||!play.includes('<html lang="en">')||!play.includes('<head><meta charset="utf-8">'))throw new Error('v5/play.html changed shape: update tools/coast-playgama.mjs');
 const modules=moduleGraph(app).slice(1).filter(m=>!/platform-cg\.mjs$/.test(m)).map(m=>m==='../v4/platform.mjs'?'platform-none.mjs':m);
 let html=play
  .replace('<html lang="en">','<html lang="en" class="pgWait" data-platform="playgama" data-ads="on" data-launch="playgama">')
  // Required step 2: the SDK script is the first script in <head>, loaded normally; the boot script after it
  // initialises the Bridge before the game's styles, scripts and pictures load.
  .replace('<head><meta charset="utf-8">','<head><meta charset="utf-8"><script src="playgama-bridge.js"></script><script src="next/playgama-boot.js"></script>'+
   `<meta name="pg-styles" content="${styles.join(' ')}"><meta name="pg-scripts" content="${boot} ${app}">`+
   '<style>html.pgWait body{visibility:hidden}html{background:#9fdcf3}</style>')
  .replace(STYLE_RE,'').replace(BOOT_RE,'').replace(ENTRY_RE,'')
  .replace(/<meta name="vw-modules" content="[^"]*">/,`<meta name="vw-modules" content="${modules.join(' ')}">`);
 for(const s of styles)if(html.includes(`href="${s}"`))throw new Error('a stylesheet link was left in the page: '+s);
 if(/<script[^>]*src="next\/(boot\.js|app\.mjs)/.test(html)||/crazygames/i.test(html))throw new Error('Playgama page: game script or CrazyGames reference left in');
 return html;
}
// The inert stand-in for v4/platform.mjs (Classic's CrazyGames wrapper). feedback.mjs only asks it whether the
// platform muted the game; on Playgama that is the Playgama adapter's business (platform-pg.mjs).
const PLATFORM_NONE=`// Playgama build: the Classic platform module (v4/platform.mjs, a CrazyGames wrapper) is not shipped.\nexport const platform={init:async()=>false,startGameplay:async()=>{},event(){},save:async s=>s,audioMuted:()=>false,onAudioSettingChange:()=>()=>{}};\n`;
const PLATFORM_PG=`// Playgama build: the platform is always the Playgama Bridge (no CrazyGames adapter is shipped).\nexport * from './platform-pg.mjs';\n`;

export function build({out=join(root,'dist/playgama'),zip=join(root,'dist/vaultwake-merge-playgama.zip')}={}){
 const play=readFileSync(join(root,'v5/play.html'),'utf8'),page=playgamaPage(play);
 const app=play.match(ENTRY_RE)[1],modules=moduleGraph(app);
 rmSync(out,{recursive:true,force:true});rmSync(zip,{force:true});mkdirSync(out,{recursive:true});
 writeFileSync(join(out,'index.html'),page);
 // The game's modules (its import graph), its styles and the loading screen, at the archive root.
 const strip=m=>m.replace(/\?.*$/,'');
 for(const m of modules){
  if(m==='../v4/platform.mjs'){writeFileSync(join(out,'platform-none.mjs'),PLATFORM_NONE);continue;}
  if(/(^|\/)platform-cg\.mjs$/.test(m))continue;
  const f=strip(m);mkdirSync(dirname(join(out,f)),{recursive:true});
  let src=readFileSync(join(root,'v5',f),'utf8');
  if(f==='next/platform.mjs')src=PLATFORM_PG;
  if(src.includes("'../v4/platform.mjs'"))src=src.replace("'../v4/platform.mjs'","'./platform-none.mjs'");
  if(/\.\.\/v4\//.test(src))throw new Error(`${f} still imports v4`);
  writeFileSync(join(out,f),src);
 }
 for(const s of [...play.matchAll(STYLE_RE)].map(m=>strip(m[1]))){mkdirSync(dirname(join(out,s)),{recursive:true});cpSync(join(root,'v5',s),join(out,s));}
 cpSync(join(root,'v5/next/boot.js'),join(out,'next/boot.js'));
 cpSync(join(root,'v5/next/playgama-boot.js'),join(out,'next/playgama-boot.js'));
 // The assets, with the CrazyGames ZIP's filters (tools/coast-crazygames.mjs).
 const devOnly=s=>/\/assets\/premium\/coast\/(render[^/]*|proposed)$|\/assets\/premium\/coast\/[^/]+\/manifest\.json$/.test(s.replace(/\\/g,'/'));
 const unused=new Set(readFileSync(join(root,'tools/coast-crazygames-unused.txt'),'utf8').split('\n').map(l=>l.replace(/#.*/,'').trim()).filter(Boolean));
 const rel=s=>s.replace(/\\/g,'/').slice(root.replace(/\\/g,'/').length+1);
 cpSync(join(root,'v5/assets'),join(out,'assets'),{recursive:true,filter:s=>!s.includes('/assets/review')&&!s.endsWith('.md')&&!devOnly(s)&&!unused.has(rel(s))});
 // The Bridge, unmodified, with its licence, and its config.
 cpSync(join(BRIDGE_DIR,'playgama-bridge.js'),join(out,'playgama-bridge.js'));
 cpSync(join(BRIDGE_DIR,'LICENSE'),join(out,'playgama-bridge-LICENSE.txt'));
 writeFileSync(join(out,'playgama-bridge-config.json'),JSON.stringify(CONFIG,null,2)+'\n');
 // Checks before packing: Latin names only (1.3.2), no CrazyGames code, nothing outside the archive.
 const files=[];const list=d=>{for(const f of readdirSync(join(out,d)).sort()){const p=d?d+'/'+f:f;if(statSync(join(out,p)).isDirectory())list(p);else files.push(p);}};list('');
 for(const f of files){
  if(!/^[A-Za-z0-9._\/-]+$/.test(f))throw new Error('non-Latin or unsafe file name: '+f);
  if(/\.(mjs|js|html|css)$/.test(f)&&f!=='playgama-bridge.js'){const t=readFileSync(join(out,f),'utf8');if(/sdk\.crazygames\.com|CrazyGames\.SDK|crazygames-sdk/i.test(t)&&!/^(next\/save-store\.mjs)$/.test(f))throw new Error('CrazyGames SDK reference in '+f);}
 }
 const epoch=Number(process.env.SOURCE_DATE_EPOCH??Date.UTC(2026,0,1)/1000);
 for(const f of files)utimesSync(join(out,f),epoch,epoch);
 execFileSync('zip',['-q','-X','-D',zip,'-@'],{cwd:out,input:files.join('\n')+'\n',env:{...process.env,TZ:'UTC'}});
 const size=f=>statSync(f).size,walk=d=>readdirSync(d).reduce((n,f)=>{const p=join(d,f);return n+(statSync(p).isDirectory()?walk(p):size(p));},0);
 console.log(`wrote dist/${basename(zip)}: ${files.length} files, ${(size(zip)/1048576).toFixed(2)} MB (${(walk(out)/1048576).toFixed(2)} MB unpacked)`);
 return {files,zip};
}
if(process.argv[1]===fileURLToPath(import.meta.url))build();
