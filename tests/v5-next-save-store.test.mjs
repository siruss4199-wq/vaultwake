// Coast Camp's save store (v5/next/save-store.mjs, 2026-11-08): progress in the CrazyGames SDK's Data
// module on CrazyGames, localStorage anywhere else, and nothing lost on the way.
import test from 'node:test';
import assert from 'node:assert/strict';
import {SAVE_KEY,fresh} from '../v5/next/game.mjs';
import {STORY_KEY} from '../v5/next/story-intro.mjs';
import {freeKey,isKeptKey,keptCamps} from '../v5/next/saves.mjs';
import {openSaveStore,localStore,dataStore,adoptLocal,reconcile,isProgressKey,tag,saveLine,
 RECEIPTS_KEY,INDEX_KEY,ADOPTED_KEY,JOURNAL_KEY,DATA_LIMIT,DATA_BUDGET} from '../v5/next/save-store.mjs';

// A browser's localStorage.
class Mem{constructor(o={}){this.m=new Map(Object.entries(o));}getItem(k){return this.m.has(k)?this.m.get(k):null;}setItem(k,v){this.m.set(k,String(v));}removeItem(k){this.m.delete(k);}
 get length(){return this.m.size;}key(i){return [...this.m.keys()][i]??null;}}
// The SDK's Data module: one "cloud" per account, shared by every device that player uses. fail:
// a code to throw on writes ('dataModuleDisabled', 'dataLimitExcedeed', 'other'); readFail on reads.
class Cloud{constructor(o={}){this.m=new Map(Object.entries(o));this.fail=null;this.readFail=null;this.writes=0;}
 getItem(k){if(this.readFail)throw {code:this.readFail};return this.m.has(k)?this.m.get(k):null;}
 setItem(k,v){if(this.fail)throw {code:this.fail};this.writes++;this.m.set(k,String(v));}removeItem(k){this.m.delete(k);}clear(){this.m.clear();}}
const sdkWith=(data,{env='crazygames',user=null,initOk=true}={})=>{const auth=[];return {environment:env,data,
 user:{getUser:async()=>user,addAuthListener:f=>auth.push(f)},auth,init:async()=>{if(!initOk)throw new Error('init failed');}};};
const open=(sdk,ls,extra={})=>openSaveStore({sdk:()=>sdk,init:async()=>sdk?.init?(await sdk.init(),true):false,local:localStore(ls),...extra});
const camp=(coins,now=1e12)=>{const s=fresh(now);s.coins=coins;s.lastAt=now+coins;return JSON.stringify(s);};

test('progress keys: the save, energy receipts, story and kept camps; not settings, logs or Classic',()=>{
 for(const k of [SAVE_KEY,RECEIPTS_KEY,STORY_KEY,SAVE_KEY+'-kept',SAVE_KEY+'-kept-3',SAVE_KEY+'-damaged',SAVE_KEY+'-backup',SAVE_KEY+'-kept-1767225600000'])assert.ok(isProgressKey(k),k);
 for(const k of ['vaultwake-v5','vaultwake-sound','vaultwake-haptics','vaultwake-v5-coast-playtest',INDEX_KEY,ADOPTED_KEY,JOURNAL_KEY])assert.ok(!isProgressKey(k),k);
 assert.equal(STORY_KEY,'vaultwake-v5-coast-story');assert.equal(RECEIPTS_KEY,'vaultwake-v5-coast-energy-receipts');
});

test('outside CrazyGames the save stays in localStorage, exactly as before',async()=>{
 const ls=new Mem({[SAVE_KEY]:camp(7)});
 for(const sdk of [null,sdkWith(new Cloud(),{env:'disabled'}),sdkWith(new Cloud(),{env:'local'}),sdkWith(new Cloud(),{initOk:false}),{environment:'crazygames',init:async()=>{}}]){
  const s=await open(sdk,ls);assert.equal(s.kind,'local');assert.equal(s.get(SAVE_KEY),camp(7));
  s.set(SAVE_KEY,camp(8));assert.equal(ls.getItem(SAVE_KEY),camp(8));ls.setItem(SAVE_KEY,camp(7));
 }
 // init that never answers in time (platform-cg.mjs gives up after 4 s and answers false).
 assert.equal((await openSaveStore({sdk:()=>sdkWith(new Cloud()),init:async()=>false,local:localStore(ls)})).kind,'local');
});

test('a Data module that refuses reads (e.g. dataModuleDisabled) leaves the save in localStorage',async()=>{
 const cloud=new Cloud();cloud.readFail='dataModuleDisabled';const ls=new Mem({[SAVE_KEY]:camp(3)});
 const s=await open(sdkWith(cloud),ls);assert.equal(s.kind,'local');assert.equal(s.get(SAVE_KEY),camp(3));
});

test('new guest on CrazyGames: progress goes to the Data module, nothing to the browser but the notes',async()=>{
 const cloud=new Cloud(),ls=new Mem();const s=await open(sdkWith(cloud),ls);
 assert.equal(s.kind,'data');assert.equal(s.get(SAVE_KEY),null);
 assert.ok(s.set(SAVE_KEY,camp(1)));assert.ok(s.set(RECEIPTS_KEY,'{"camps":{}}'));assert.ok(s.set(STORY_KEY,'{"intro":"done"}'));
 assert.equal(cloud.getItem(SAVE_KEY),camp(1));assert.equal(cloud.getItem(STORY_KEY),'{"intro":"done"}');
 assert.equal(ls.getItem(SAVE_KEY),null,'the camp is not written to localStorage');
 // Settings and the Classic save stay in the browser.
 assert.ok(s.set('vaultwake-sound','off'));assert.equal(ls.getItem('vaultwake-sound'),'off');assert.equal(cloud.getItem('vaultwake-sound'),null);
});

test('reload and another device: a logged-in player continues where they left off',async()=>{
 const cloud=new Cloud(),user={__dangerousUserId:'u1',username:'SingingCheese'};
 const a=await open(sdkWith(cloud,{user}),new Mem());a.set(SAVE_KEY,camp(40));
 const again=await open(sdkWith(cloud,{user}),new Mem());assert.equal(again.get(SAVE_KEY),camp(40),'device B sees device A\'s camp');
 again.set(SAVE_KEY,camp(41));
 assert.equal((await open(sdkWith(cloud,{user}),new Mem())).get(SAVE_KEY),camp(41));
});

test('kept camps: listed from the Data module (which cannot list keys) and never overwritten',async()=>{
 const cloud=new Cloud(),ls=new Mem();const s=await open(sdkWith(cloud),ls);s.set(SAVE_KEY,camp(5));
 const k1=freeKey('kept',s.get,1);assert.equal(k1,SAVE_KEY+'-kept');assert.ok(s.set(k1,camp(1)));
 const k2=freeKey('kept',s.get,1);assert.equal(k2,SAVE_KEY+'-kept-2');assert.ok(s.set(k2,camp(2)));
 for(let i=0;i<8;i++)s.set(freeKey('kept',s.get,1e12),camp(100+i));
 const listed=s.keys().filter(isKeptKey);assert.equal(listed.length,10);assert.ok(listed.some(k=>/-kept-1000000000000$/.test(k)),'a time-named kept camp is listed');
 assert.equal(keptCamps(s.keys(),s.get,1e12,s.get(SAVE_KEY)).length,10);
 // The index is how they are found after a reload, even time-named ones.
 const re=await open(sdkWith(cloud),ls);assert.equal(re.keys().filter(isKeptKey).length,10);
 // Fixed names are found even if the index is lost.
 cloud.removeItem(INDEX_KEY);const lost=await open(sdkWith(cloud),ls);assert.deepEqual(lost.keys().filter(isKeptKey).filter(k=>!/\d{6,}$/.test(k)).length,9);
});

test('a camp already in this browser is copied into the Data module once, never over a different one',async()=>{
 const ls=new Mem({[SAVE_KEY]:camp(30),[SAVE_KEY+'-kept']:camp(10),[RECEIPTS_KEY]:'{"r":1}',[STORY_KEY]:'{"intro":"skip"}','vaultwake-v5':'classic'});
 const before=new Map(ls.m);
 // First start on CrazyGames as a guest: everything is copied as it is.
 const cloud=new Cloud(),s=await open(sdkWith(cloud),ls);
 assert.equal(cloud.getItem(SAVE_KEY),camp(30));assert.equal(cloud.getItem(SAVE_KEY+'-kept'),camp(10));
 assert.equal(cloud.getItem(RECEIPTS_KEY),'{"r":1}');assert.equal(cloud.getItem(STORY_KEY),'{"intro":"skip"}');assert.equal(cloud.getItem('vaultwake-v5'),null);
 for(const [k,v] of before)assert.equal(ls.getItem(k),v,`localStorage ${k} untouched`);
 // Played on: the next start copies nothing again and does not touch the newer camp.
 s.set(SAVE_KEY,camp(31));const w=cloud.writes;await open(sdkWith(cloud),ls);
 assert.equal(cloud.getItem(SAVE_KEY),camp(31));assert.equal(cloud.writes,w,'nothing copied twice');
 // An account that already has a camp: the browser's different camp goes to a kept slot.
 const acct=new Cloud({[SAVE_KEY]:camp(99)}),ls2=new Mem({[SAVE_KEY]:camp(30)});
 const t=await open(sdkWith(acct,{user:{__dangerousUserId:'u2'}}),ls2);
 assert.equal(acct.getItem(SAVE_KEY),camp(99),'the account camp is not replaced');
 assert.equal(acct.getItem(SAVE_KEY+'-kept'),camp(30),'the browser camp is kept aside');
 assert.equal(keptCamps(t.keys(),t.get,1e12,t.get(SAVE_KEY)).length,1);
 // A second player on the same device does not get it copied again.
 const other=new Cloud();await open(sdkWith(other,{user:{__dangerousUserId:'u3'}}),ls2);assert.equal(other.getItem(SAVE_KEY),null);
});

test('a damaged or newer-build save in the browser is copied as it is, never repaired or dropped',async()=>{
 const ls=new Mem({[SAVE_KEY]:'{"version":999,"board":[]}',[SAVE_KEY+'-damaged']:'not json'});
 const cloud=new Cloud();await open(sdkWith(cloud),ls);
 assert.equal(cloud.getItem(SAVE_KEY),'{"version":999,"board":[]}');assert.equal(cloud.getItem(SAVE_KEY+'-damaged'),'not json');
});

test('a save the SDK had not written yet (reload, closed tab) is written again at the next start',async()=>{
 const cloud=new Cloud(),ls=new Mem(),user={__dangerousUserId:'u1'};
 const s=await open(sdkWith(cloud,{user}),ls);s.set(SAVE_KEY,camp(1));s.set(SAVE_KEY,camp(2));
 // The SDK's delayed writes never reached the account: it still has the first save.
 const snapshot=camp(1);cloud.m.set(SAVE_KEY,snapshot);
 s.set(SAVE_KEY,camp(3));cloud.m.set(SAVE_KEY,snapshot);
 const notes=[];await open(sdkWith(cloud,{user}),ls,{onEvent:(e,d)=>notes.push([e,d])});
 assert.equal(cloud.getItem(SAVE_KEY),camp(3),'the last save is written again');
 assert.equal(notes.find(([e])=>e==='saveStore')[1].reconcile,'rewritten');
 // The rewrite is noted again (in case it is delayed too); once the account has it, the note is done.
 assert.equal(JSON.parse(ls.getItem(JOURNAL_KEY)).u1.last,camp(3));
 await open(sdkWith(cloud,{user}),ls);assert.equal(JSON.parse(ls.getItem(JOURNAL_KEY)).u1,undefined);
 // Even if the account lost the save completely.
 const s2=await open(sdkWith(cloud,{user}),ls);s2.set(SAVE_KEY,camp(4));cloud.m.delete(SAVE_KEY);
 await open(sdkWith(cloud,{user}),ls);assert.equal(cloud.getItem(SAVE_KEY),camp(4));
});

test('a delayed restore or new camp: the camp it replaced is kept, not lost',async()=>{
 const withId=(coins,id)=>{const s=JSON.parse(camp(coins));s.energyRewards={id,stages:0};return JSON.stringify(s);};
 const A=withId(555,'camp-a'),B=withId(777,'camp-b');
 const cloud=new Cloud({[SAVE_KEY]:A,[SAVE_KEY+'-kept']:B}),ls=new Mem(),user={__dangerousUserId:'u1'};
 const s=await open(sdkWith(cloud,{user}),ls);
 // Restore (app.mjs restoreKept): A is copied aside, B becomes the camp; the SDK sends neither.
 const snapshot=new Map(cloud.m);s.set(freeKey('kept',s.get,1),A);s.set(SAVE_KEY,B);cloud.m=snapshot;
 const back=await open(sdkWith(cloud,{user}),ls);
 assert.equal(cloud.getItem(SAVE_KEY),B,'the restored camp is the camp');
 assert.ok(back.keys().filter(isKeptKey).some(k=>back.get(k)===A),'the camp it replaced is kept');
 // The same with two diverged copies of one camp (same id): the replaced copy is kept as well.
 const C=withId(10,'same'),D=withId(20,'same'),c3=new Cloud({[SAVE_KEY]:C,[SAVE_KEY+'-kept']:D}),l3=new Mem();
 const u=await open(sdkWith(c3,{user}),l3);const snap=new Map(c3.m);u.set(freeKey('kept',u.get,1),C);u.set(SAVE_KEY,D);c3.m=snap;
 const u2=await open(sdkWith(c3,{user}),l3);assert.equal(c3.getItem(SAVE_KEY),D);assert.ok(u2.keys().filter(isKeptKey).some(k=>u2.get(k)===C));
 // The same camp's lost write adds no extra kept copy.
 const c2=new Cloud({[SAVE_KEY]:withId(1,'x')}),l2=new Mem(),t=await open(sdkWith(c2,{user}),l2);
 t.set(SAVE_KEY,withId(2,'x'));c2.m.set(SAVE_KEY,withId(1,'x'));const t2=await open(sdkWith(c2,{user}),l2);
 assert.equal(c2.getItem(SAVE_KEY),withId(2,'x'));assert.equal(t2.keys().filter(isKeptKey).length,0);
});

test('another device moved on: the note does not replace its camp, it is kept aside',async()=>{
 const cloud=new Cloud(),user={__dangerousUserId:'u1'},phone=new Mem();
 const a=await open(sdkWith(cloud,{user}),phone);a.set(SAVE_KEY,camp(10));
 // The phone's last write was lost; meanwhile the PC played on.
 a.set(SAVE_KEY,camp(11));cloud.m.set(SAVE_KEY,camp(10));
 const pc=await open(sdkWith(cloud,{user}),new Mem());pc.set(SAVE_KEY,camp(50));
 const back=await open(sdkWith(cloud,{user}),phone);
 assert.equal(cloud.getItem(SAVE_KEY),camp(50),'the PC camp stays');
 assert.ok(back.keys().filter(isKeptKey).some(k=>back.get(k)===camp(11)),'the phone camp is kept, restorable');
});

test('notes are per player: one player\'s note never touches another account',async()=>{
 const ls=new Mem(),a=new Cloud(),b=new Cloud({[SAVE_KEY]:camp(70)});
 const sa=await open(sdkWith(a,{user:{__dangerousUserId:'A'}}),ls);sa.set(SAVE_KEY,camp(1));
 await open(sdkWith(b,{user:{__dangerousUserId:'B'}}),ls);
 assert.equal(b.getItem(SAVE_KEY),camp(70));
 assert.ok(![...b.m.values()].includes(camp(1)),'A\'s camp is not copied into B\'s account');
 assert.ok(JSON.parse(ls.getItem(JOURNAL_KEY)).A,'A\'s note waits for A');
});

test('the Data module fails mid-game: writes go to the browser and come back at the next start',async()=>{
 const cloud=new Cloud(),ls=new Mem(),notes=[];
 const s=await open(sdkWith(cloud),ls,{onEvent:(e,d)=>notes.push([e,d])});s.set(SAVE_KEY,camp(1));
 cloud.fail='other';assert.ok(s.set(SAVE_KEY,camp(2)),'the write lands in the browser');
 assert.equal(ls.getItem(SAVE_KEY),camp(2));assert.ok(s.failed);assert.ok(notes.some(([e])=>e==='dataWriteError'));
 cloud.fail=null;await open(sdkWith(cloud),ls);assert.equal(cloud.getItem(SAVE_KEY),camp(2),'restored into the Data module');
});

test('1 MB: a kept copy that would pass the safety margin is refused; the camp itself is never refused',async()=>{
 const cloud=new Cloud(),ls=new Mem(),notes=[];const s=await open(sdkWith(cloud),ls,{onEvent:(e,d)=>notes.push([e,d])});
 s.set(SAVE_KEY,camp(1));
 const big='x'.repeat(200000);let n=0;
 while(s.set(freeKey('kept',s.get,1e12),big))n++;
 assert.equal(n,4,'four 200 KB copies fit under the margin, the fifth is refused');
 assert.ok(s.size()<=DATA_BUDGET);assert.ok(notes.some(([e])=>e==='dataFull'));
 assert.ok(s.set(SAVE_KEY,camp(2)),'the camp still saves');assert.equal(cloud.getItem(SAVE_KEY),camp(2));
 // Past the hard limit the SDK would refuse it: it goes to the browser and is read back from there.
 assert.equal(s.set(SAVE_KEY,'y'.repeat(DATA_LIMIT)),true);assert.equal(ls.getItem(SAVE_KEY).length,DATA_LIMIT);
 assert.equal(s.get(SAVE_KEY).length,DATA_LIMIT,'read back from the browser, not the stale Data module copy');
 assert.ok(notes.some(([e])=>e==='dataOverLimit'));
 // The SDK's own error (dataLimitExcedeed) also lands in the browser.
 cloud.fail='dataLimitExcedeed';assert.ok(s.set(SAVE_KEY,camp(3)));assert.equal(ls.getItem(SAVE_KEY),camp(3));
 // A real camp is about 5 KB.
 assert.ok(camp(1).length<6000);
});

test('a login does not stop saving (CrazyGames reloads the game itself)',async()=>{
 const cloud=new Cloud({[SAVE_KEY]:camp(1)}),sdk=sdkWith(cloud),notes=[];const s=await open(sdk,new Mem(),{onEvent:(e,d)=>notes.push([e,d])});
 assert.equal(sdk.auth.length,1);sdk.auth[0]({username:'x'});
 assert.ok(s.set(SAVE_KEY,camp(2)));assert.equal(cloud.getItem(SAVE_KEY),camp(2),'the save still reaches the Data module');
 assert.ok(s.status.loginSeen);assert.ok(notes.some(([e])=>e==='authChange'));
});

test('regression 2026-11-09: a slow SDK init (several seconds on CrazyGames) still uses the Data module',async()=>{
 const cloud=new Cloud({[SAVE_KEY]:camp(9)}),sdk=sdkWith(cloud);let t=0;
 const slow=()=>new Promise(r=>setTimeout(()=>r(true),60));
 const s=await openSaveStore({sdk:()=>sdk,init:slow,local:localStore(new Mem()),clock:()=>(t+=6000)});
 assert.equal(s.kind,'data');assert.equal(s.get(SAVE_KEY),camp(9));assert.equal(s.status.initMs,6000);
});

test('regression 2026-11-09: a refused write is read back from the browser for the rest of the session',async()=>{
 const cloud=new Cloud({[SAVE_KEY]:camp(1)}),ls=new Mem();const s=await open(sdkWith(cloud),ls);
 cloud.fail='dataModuleDisabled';assert.ok(s.set(SAVE_KEY,camp(5)));
 assert.equal(s.get(SAVE_KEY),camp(5),'the app sees its own last save, not the Data module\'s old one');
 cloud.fail=null;assert.ok(s.set(SAVE_KEY,camp(6)));assert.equal(ls.getItem(SAVE_KEY),camp(6),'the key stays in the browser this session');
 assert.equal(s.status.errors[0].code,'dataModuleDisabled');assert.match(saveLine(s.status),/refused a save \(dataModuleDisabled\)/);
 // Next start: back into the Data module.
 const again=await open(sdkWith(cloud),ls);assert.equal(cloud.getItem(SAVE_KEY),camp(6));assert.equal(again.get(SAVE_KEY),camp(6));
});

test('regression 2026-11-09: a write the Data module silently drops is caught and kept in the browser',async()=>{
 const cloud=new Cloud({[SAVE_KEY]:camp(1)}),ls=new Mem();const s=await open(sdkWith(cloud),ls);
 cloud.setItem=function(k,v){this.writes++;};// accepts the call, keeps nothing
 assert.ok(s.set(SAVE_KEY,camp(2)));assert.equal(s.get(SAVE_KEY),camp(2));assert.equal(ls.getItem(SAVE_KEY),camp(2));
 assert.equal(s.status.errors[0].code,'notAccepted');
});

test('the Data module is read once at start; a save does not read every key again',async()=>{
 const cloud=new Cloud({[SAVE_KEY]:camp(1),[SAVE_KEY+'-kept']:camp(2)});let reads=0;const g=cloud.getItem.bind(cloud);cloud.getItem=k=>{reads++;return g(k);};
 const s=await open(sdkWith(cloud),new Mem());reads=0;
 for(let i=0;i<20;i++)s.set(SAVE_KEY,camp(10+i));
 // One read-back per save (to confirm the Data module kept it), plus a few at most.
 assert.ok(reads<=26,`${reads} SDK reads for 20 saves`);
});

test('diagnostics: where progress goes, why, and whether saves are accepted',async()=>{
 const cloud=new Cloud();const s=await open(sdkWith(cloud,{user:{__dangerousUserId:'u'}}),new Mem());s.set(SAVE_KEY,camp(1));
 assert.equal(s.status.kind,'data');assert.equal(s.status.user,'account');assert.equal(s.status.environment,'crazygames');
 assert.equal(s.status.accepted,1);assert.ok(s.status.lastSaved);assert.match(saveLine(s.status,s.status.lastSaved+3000),/saved to your CrazyGames account · last save 3 s ago/);
 const l=await open(sdkWith(new Cloud(),{env:'disabled'}),new Mem());assert.equal(l.status.kind,'local');assert.equal(l.status.reason,'environment disabled');
 l.set(SAVE_KEY,camp(1));assert.equal(l.status.accepted,1);assert.match(saveLine(l.status),/saved in this browser/);
 const none=await open(sdkWith(new Cloud(),{initOk:false}),new Mem());assert.equal(none.status.reason,'SDK did not initialise');
});

test('initPlatform: a timeout answers false for that call only; once the SDK is up it answers true',async()=>{
 const {initPlatform,resetPlatform,onCrazyGamesHost}=await import('../v5/next/platform-cg.mjs');
 let finish;globalThis.CrazyGames={SDK:{environment:'crazygames',init:()=>new Promise(r=>{finish=r;})}};resetPlatform();
 try{
  assert.equal(await initPlatform({timeout:20}),false,'not up yet');
  finish();assert.equal(await initPlatform({timeout:20}),true,'up now: no longer remembered as a failure');
 }finally{delete globalThis.CrazyGames;resetPlatform();}
 assert.ok(onCrazyGamesHost({hostname:'games.crazygames.com'}));assert.ok(onCrazyGamesHost({hostname:'x',ancestorOrigins:['https://www.crazygames.com']}));
 assert.ok(!onCrazyGamesHost({hostname:'claude-v5-crazygames-release.wispwood-game.pages.dev'}));assert.ok(!onCrazyGamesHost({hostname:'127.0.0.1'}));
});

test('tag tells saves apart',()=>{assert.notEqual(tag(camp(1)),tag(camp(2)));assert.equal(tag(camp(1)),tag(camp(1)));});
