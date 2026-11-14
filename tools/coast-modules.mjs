// Coast Camp's module preloads (loading performance, 2026-11-13). The game asks for every module it imports
// at once instead of finding them one import level at a time: on a phone network each level cost a round
// trip before the next could start (four waves before the game could run). The list is the static import
// graph of the game's entry module (the entry itself is the page's module script), each address exactly as
// the browser asks for it (query strings included), so a preload is never a second copy. It is kept in
// v5/play.html as <meta name="vw-modules">; v5/next/boot.js turns it into <link rel="modulepreload"> once the
// page's styles are in, so the modules never compete with the styles for the first paint.
//   node tools/coast-modules.mjs          writes the list into v5/play.html (then run tools/coast-crazygames.mjs)
//   node tools/coast-modules.mjs --check  fails when v5/play.html's list differs from the import graph
import {readFileSync,writeFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
// Static imports and re-exports only (import('...') loads later, on demand, and is not preloaded).
const IMPORT=/(?:^|[;\s}])(?:import|export)\s*(?:[\w*{}\s,$]+?\s*from\s*)?['"]([^'"]+)['"]/g;
const strip=src=>src.replace(/\/\*[\s\S]*?\*\//g,'').replace(/(^|[^:\\'"`])\/\/.*$/gm,'$1');
// The import graph from an entry address (as written in v5/play.html, relative to v5/), in the order found;
// each address relative to v5/ exactly as the browser requests it (v4 files as ../v4/…).
export function moduleGraph(entry){
 const page=new URL('http://x/v5/play.html'),seen=new Set(),order=[];
 const visit=u=>{
  const key=u.pathname+u.search;if(seen.has(key))return;seen.add(key);order.push(key);
  if(!/^\/v[45]\//.test(u.pathname))throw new Error(`import outside the game: ${key}`);
  for(const m of strip(readFileSync(join(root,decodeURIComponent(u.pathname)),'utf8')).matchAll(IMPORT))
   if(/^\.{1,2}\//.test(m[1]))visit(new URL(m[1],u));
 };
 visit(new URL(entry,page));
 return order.map(k=>k.startsWith('/v5/')?k.slice(4):'..'+k);
}
export const ENTRY_RE=/<script type="module" src="([^"]+)"><\/script>/;
const META_RE=/<meta name="vw-modules" content="[^"]*">/g;
export function withPreloads(html){
 const entry=html.match(ENTRY_RE)?.[1];if(!entry)throw new Error('v5/play.html: no module script');
 const meta=`<meta name="vw-modules" content="${moduleGraph(entry).slice(1).join(' ')}">`;
 const bare=html.replace(META_RE,'');if(!bare.includes('</head>'))throw new Error('v5/play.html: no </head>');
 return bare.replace('</head>',meta+'</head>');
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const file=join(root,'v5/play.html'),html=readFileSync(file,'utf8'),next=withPreloads(html);
 if(process.argv.includes('--check')){if(next!==html){console.error('v5/play.html: module preloads differ from the import graph: run node tools/coast-modules.mjs');process.exit(1);}console.log('v5/play.html module preloads are up to date');}
 else{writeFileSync(file,next);console.log(`v5/play.html: ${next.match(/<meta name="vw-modules" content="([^"]*)">/)[1].split(' ').length} modules listed`);}
}
