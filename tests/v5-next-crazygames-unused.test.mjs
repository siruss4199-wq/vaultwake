// The CrazyGames ZIP leaves out the images the Coast game never loads (tools/coast-crazygames-unused.txt,
// release 2026-11-08). Guard: nothing the game can draw or show may be on that list. Every board thing
// draw() can make (parts, ice, cargo, crates, generators at every level, token, cog), every place's stage
// pictures, every area's pictures and maps, and the chapter story pictures in the Coast code.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {draw,CHAINS,GENERATOR_NAMES} from '../v5/next/chains.mjs';
import {AREAS} from '../v5/next/areas.mjs';

const ROOT=new URL('..',import.meta.url).pathname;
const unused=readFileSync(ROOT+'tools/coast-crazygames-unused.txt','utf8').split('\n').map(l=>l.replace(/#.*/,'').trim()).filter(Boolean);
const paths=new Set(),add=h=>{for(const m of String(h).matchAll(/assets\/[A-Za-z0-9_/.-]+\.(?:webp|png|svg|jpg)/g))paths.add('v5/'+m[0]);};
const each=f=>{try{add(f());}catch{}};

test('the unused list exists, and every file on it is real', ()=>{
 assert.ok(unused.length>0);
 for(const u of unused)assert.ok(existsSync(ROOT+u),u);
});

test('nothing the Coast game can draw or show is left out of the ZIP', ()=>{
 for(const family of Object.keys(CHAINS))for(let tier=0;tier<12;tier++){
  each(()=>draw({type:'item',family,tier}));
  for(const cracks of [0,1,2])each(()=>draw({type:'glass',family,tier,cracks}));
  for(const deep of [false,true])each(()=>draw({type:'cargo',key:{family,tier},deep}));
  for(const size of [1,2,3,4])each(()=>draw({type:'kit',size,family}));
 }
 for(const id of Object.keys(GENERATOR_NAMES))for(const level of [1,2,3,4,5])each(()=>draw({type:'source',id,level}));
 for(const type of ['token','cog'])each(()=>draw({type}));
 const dir=a=>a.startsWith('hb-')?'hidden-harbour/':a.startsWith('ch4-')?'answering-light/':a.startsWith('ch5-')?'lowwater-passage/':a.startsWith('ch6-')?'keepers-promise/':'';
 for(const a of AREAS){
  if(a.picture)paths.add(`v5/assets/premium/${a.picture}-vibrant.webp`);
  for(const k of ['map','restored','overview'])if(a[k])paths.add(`v5/assets/premium/${a[k]}.webp`);
  for(const t of a.tasks??[])if(t.art)for(const n of [1,2,3,'launched'])paths.add(`v5/assets/premium/coast/${dir(t.art)}place-${t.art}-${n}.webp`);
 }
 const code=[...readdirSync(ROOT+'v5/next').filter(f=>/\.(mjs|css|js)$/.test(f)).map(f=>'v5/next/'+f),'v5/play.html'].map(f=>readFileSync(ROOT+f,'utf8')).join('\n');
 add(code);
 for(const m of code.matchAll(/\.\.\/(assets\/[A-Za-z0-9_/.-]+)/g))paths.add('v5/'+m[1]);
 assert.ok(paths.size>150,`${paths.size} paths found`);
 assert.deepEqual(unused.filter(u=>paths.has(u)),[],'on the unused list but drawn or named by the Coast game');
 // and nothing on the list is named, even in part of a path, in the Coast code
 assert.deepEqual(unused.filter(u=>code.includes(u.slice(3))),[]);
});
