// CrazyGames gameplay lifecycle (v5/next/platform-cg.mjs), First Session 2.0 (2026-11-13). The audit found a
// double gameplayStart: two setPlaying(true) calls in the same moment both passed the "already playing?" check
// before their await and both sent it. Now: exactly one gameplayStart per start, one gameplayStop per stop,
// in order, whatever the timing; nothing before the SDK is up; a rewarded-ad pause still stops and restarts.
import test from 'node:test';import assert from 'node:assert/strict';
import {platform,resetPlatform,initPlatform} from '../v5/next/platform-cg.mjs';
function sdk({initDelay=0,fail=false}={}){const calls=[];globalThis.CrazyGames={SDK:{environment:'crazygames',
 init:()=>new Promise((r,j)=>setTimeout(()=>fail?j(new Error('no')):r(),initDelay)),
 game:{gameplayStart(){calls.push('start');},gameplayStop(){calls.push('stop');},loadingStart(){calls.push('loadingStart');},loadingStop(){calls.push('loadingStop');},settings:{muteAudio:false}}}};resetPlatform();return calls;}
test('two starts in the same moment send one gameplayStart',async()=>{
 const calls=sdk();await Promise.all([platform.setPlaying(true),platform.setPlaying(true),platform.setPlaying(true)]);
 assert.deepEqual(calls,['start']);assert.equal(platform.playing,true);
});
test('start, stop, start in quick succession: each change once, in order',async()=>{
 const calls=sdk({initDelay:20});const p=[platform.setPlaying(true),platform.setPlaying(true),platform.setPlaying(false),platform.setPlaying(false),platform.setPlaying(true)];
 await Promise.all(p);
 // the last wanted state wins; no change is sent twice in a row
 for(let k=1;k<calls.length;k++)assert.notEqual(calls[k],calls[k-1],`no repeated ${calls[k]} (${calls})`);
 assert.equal(calls.at(-1),'start');assert.equal(platform.playing,true);
});
test('the 1 s sync repeating the same state sends nothing more',async()=>{
 const calls=sdk();await platform.setPlaying(true);for(let k=0;k<10;k++)await platform.setPlaying(true);
 await platform.setPlaying(false);await platform.setPlaying(false);await platform.setPlaying(true);
 assert.deepEqual(calls,['start','stop','start']);
});
test('no SDK or a failed init: nothing is sent, nothing throws',async()=>{
 delete globalThis.CrazyGames;resetPlatform();await platform.setPlaying(true);assert.equal(platform.playing,false);
 const calls=sdk({fail:true});await Promise.all([platform.setPlaying(true),platform.setPlaying(true)]);assert.deepEqual(calls,[]);
});
test('a later init: the wanted state is sent once the SDK is up',async()=>{
 const calls=sdk({initDelay:50});const a=platform.setPlaying(true);await initPlatform({timeout:1000});await a;await platform.setPlaying(true);
 assert.deepEqual(calls,['start']);
});
