// First Session 2.0: who opens straight onto the board (v5/next/newcomer.mjs). Never an existing player: any
// save (readable or not), a kept camp, ?new=1, or a CrazyGames page whose cloud data was not read.
import test from 'node:test';import assert from 'node:assert/strict';
import {isNewPlayer} from '../v5/next/newcomer.mjs';
import {readSave} from '../v5/next/saves.mjs';
import {fresh} from '../v5/next/game.mjs';
const base={rawSave:null,readStatus:'empty',startNew:false,keptCount:0,onCrazyGames:false,storeKind:'local'};
test('no save anywhere, storage settled: a new player',()=>{
 assert.equal(isNewPlayer(base),true);
 assert.equal(isNewPlayer({...base,onCrazyGames:true,storeKind:'data'}),true,'CrazyGames: the cloud data was read and holds nothing');
});
test('any save is an existing player, readable or not',()=>{
 const s=fresh(1);s.moves=3;const raw=JSON.stringify(s);
 assert.equal(isNewPlayer({...base,rawSave:raw,readStatus:readSave(raw,1).status}),false);
 assert.equal(isNewPlayer({...base,rawSave:'{not json',readStatus:readSave('{not json',1).status}),false,'a damaged save');
 assert.equal(isNewPlayer({...base,rawSave:raw,readStatus:'empty'}),false,'a save string, whatever the status says');
});
test('CrazyGames whose cloud data could not be read: never treated as new (Home stays as before)',()=>{
 for(const storeKind of ['local',undefined,null])assert.equal(isNewPlayer({...base,onCrazyGames:true,storeKind}),false);
});
test('a kept camp or the ?new=1 playtest link keeps Home',()=>{
 assert.equal(isNewPlayer({...base,keptCount:1}),false);assert.equal(isNewPlayer({...base,startNew:true}),false);
});
test('readSave answers "empty" only for no save',()=>{
 assert.equal(readSave(null,1).status,'empty');assert.equal(readSave('',1).status,'empty');
 assert.notEqual(readSave(JSON.stringify(fresh(1)),1).status,'empty');
});
