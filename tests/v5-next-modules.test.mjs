// Loading performance (2026-11-13): the page's module list (<meta name="vw-modules">, turned into
// <link rel="modulepreload"> by v5/next/boot.js) is exactly the game's static import graph, in both pages, and
// Home's pictures are not asked for by the page itself (boot.js asks for them when Home will be seen).
import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleGraph,withPreloads,ENTRY_RE} from '../tools/coast-modules.mjs';
const play=readFileSync(new URL('../v5/play.html',import.meta.url),'utf8');
const cg=readFileSync(new URL('../v5/coast-crazygames.html',import.meta.url),'utf8');
const listed=html=>html.match(/<meta name="vw-modules" content="([^"]*)">/)[1].split(' ');

test('the module list is the import graph of the entry (entry excluded), in both pages',()=>{
 assert.equal(withPreloads(play),play,'run node tools/coast-modules.mjs');
 const graph=moduleGraph(play.match(ENTRY_RE)[1]);
 assert.deepEqual(listed(play),graph.slice(1));assert.deepEqual(listed(cg),graph.slice(1));
 assert.ok(graph.includes('next/save-store.mjs')&&graph.includes('../v4/platform.mjs'),'deep imports are listed');
 assert.equal(new Set(graph).size,graph.length,'no address twice');
});

test('a module that imports another is listed with it (graph walk)',()=>{
 const graph=moduleGraph(play.match(ENTRY_RE)[1]);
 for(const href of graph){
  const src=readFileSync(new URL('../v5/'+href.replace(/\?.*$/,''),import.meta.url),'utf8');
  for(const m of src.matchAll(/^import\s[^'"]*?from\s*'(\.{1,2}\/[^']+)'/gm)){
   const u=new URL(m[1],new URL(href,'http://x/v5/'));const rel=u.pathname.startsWith('/v5/')?u.pathname.slice(4)+u.search:'..'+u.pathname+u.search;
   assert.ok(graph.includes(rel),`${href} imports ${m[1]}`);
  }
 }
});

test('Home pictures: deferred in the page, asked for by boot.js; the game module is never preloaded twice',()=>{
 for(const html of [play,cg]){
  assert.doesNotMatch(html,/<img[^>]+\ssrc="assets\/premium\/coast\/home\//,'no Home picture loads by itself');
  for(const f of ['home-bg','logo'])assert.match(html,new RegExp(`data-src="assets/premium/coast/home/${f}\\.webp"`));
  assert.doesNotMatch(html,/rel="modulepreload"/,'preloads are added after the styles, by boot.js');
 }
 const boot=readFileSync(new URL('../v5/next/boot.js',import.meta.url),'utf8');
 assert.match(boot,/modulepreload/);assert.match(boot,/homeArt\.load=/);
});
