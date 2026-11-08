// Where Coast Camp keeps its progress (2026-11-08, CrazyGames Basic Launch, submission option "Yes,
// CrazyGames SDK Data Module"). Docs: https://docs.crazygames.com/sdk/data/ and /sdk/user/.
//
// On CrazyGames, once the HTML5 SDK v3 is initialised and its Data module answers, every progress
// key lives in the Data module: the CrazyGames account for a logged-in player (synced across their
// devices), the SDK's own guest storage otherwise (moved to the account when the guest logs in).
// Anywhere else (the standalone page, the branch preview, a test), or when the SDK or its Data
// module does not answer, progress stays in this browser's localStorage exactly as before.
//
// The store has the same small surface the app already used: get, set and keys. The app's save
// rules are unchanged: a kept copy is never overwritten, nothing replaces the save unless its copy
// was written, and a save this build cannot read is never written over.
//
// Nothing is lost when moving to the Data module:
// - Progress already in this browser (a camp from before this build, a kept camp, a write made
//   while the Data module failed) is copied in, never the other way round, and never over a
//   different save: a camp that would replace one goes to a kept slot (Kept camps in the menu
//   brings it back). localStorage itself is never cleared.
// - The SDK saves with a delay (1 s, up to 30 s). The last save written in a session is noted
//   in this browser for that player, and written again at the next start if the account still
//   holds an earlier save from the same session (a reload, e.g. Restore a kept camp, or a closed
//   tab can outrun the delay).
// - The Data module holds at most 1 MB (1,048,576 bytes as JSON). A full camp is about 5 KB; a
//   kept copy that would take the data past a safety margin is refused, so the app keeps the
//   current camp and tells the player, as it does when the browser's storage is full.
import {SAVE_KEY} from './game.mjs';
import {isKeptKey,freeKey} from './saves.mjs';
import {STORY_KEY} from './story-intro.mjs';

export const RECEIPTS_KEY=SAVE_KEY+'-energy-receipts';
// In the Data module: the kept-camp keys it holds (it cannot list its keys).
export const INDEX_KEY=SAVE_KEY+'-keys';
// In this browser only: local saves already copied into the Data module, and the last-save notes.
export const ADOPTED_KEY=SAVE_KEY+'-cg-adopted',JOURNAL_KEY=SAVE_KEY+'-cg-journal';
export const DATA_LIMIT=1048576,DATA_BUDGET=DATA_LIMIT-64*1024;
// The keys that are progress. Settings (sound, haptics), the playtest log and the Classic save stay
// in this browser.
export const isProgressKey=k=>typeof k==='string'&&(k===SAVE_KEY||k===RECEIPTS_KEY||k===STORY_KEY||isKeptKey(k));
const parse=(raw,fallback)=>{try{const v=JSON.parse(raw??'null');return v??fallback;}catch{return fallback;}};
// FNV-1a: a short tag for a save, enough to tell saves apart in the notes kept in this browser.
export function tag(s){let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193);}return (h>>>0).toString(36)+'.'+s.length.toString(36);}
const bytes=s=>new TextEncoder().encode(s).length;
// Which camp a save belongs to: every camp has its own id (energyRewards.id, game.mjs) that stays
// the same as it is played; null for a save without one (or that cannot be read).
const campId=raw=>{try{return JSON.parse(raw)?.energyRewards?.id??null;}catch{return null;}};

export function localStore(ls=globalThis.localStorage){
 const get=k=>{try{return ls.getItem(k);}catch{return null;}};
 const set=(k,v)=>{try{ls.setItem(k,v);return ls.getItem(k)===v;}catch{return false;}};
 const keys=()=>{try{return Array.from({length:ls.length},(_,i)=>ls.key(i)).filter(Boolean);}catch{return [];}};
 return {kind:'local',get,set,keys};
}

// The Data module store. data: SDK.data (getItem/setItem/removeItem/clear); local: localStore();
// user: an id for the player (or 'guest'), used only to keep the last-save notes apart on a shared device.
export function dataStore(data,local,{user='guest',onEvent=()=>{}}={}){
 let held=false,failed=false;
 const read=k=>{try{return data.getItem(k);}catch(e){failed=true;onEvent('dataReadError',{code:e?.code??null});return local.get(k);}};
 const index=new Set(parse(read(INDEX_KEY),[]).filter(isKeptKey));
 // A kept camp under a fixed name is found even if the index was lost.
 for(const kind of ['kept','damaged','backup'])for(const k of [`${SAVE_KEY}-${kind}`,...Array.from({length:8},(_,i)=>`${SAVE_KEY}-${kind}-${i+2}`)])if(read(k)!==null)index.add(k);
 const progressKeys=()=>[SAVE_KEY,RECEIPTS_KEY,STORY_KEY,...index].filter(k=>read(k)!==null);
 // The size the SDK checks: all the game's data as one JSON string.
 const sizeWith=(k,v)=>{const o={};for(const x of progressKeys())o[x]=read(x);o[k]=v;o[INDEX_KEY]=JSON.stringify([...new Set([...index,...(isKeptKey(k)?[k]:[])])]);return bytes(JSON.stringify(o));};
 const journal={
  all:()=>parse(local.get(JOURNAL_KEY),{}),
  note(prev,v){const j=this.all(),e=j[user]??{seen:[]};const seen=new Set(e.seen);if(prev!==null)seen.add(tag(prev));j[user]={...e,seen:[...seen].slice(-64),last:v,at:Date.now()};local.set(JOURNAL_KEY,JSON.stringify(j));},
  // A camp copied aside (a new camp, a restore) is noted too, so a delayed copy is not lost either.
  keep(v){const j=this.all(),e=j[user]??{seen:[]};j[user]={...e,kept:[...(e.kept??[]).filter(x=>x!==v),v].slice(-5),at:Date.now()};local.set(JOURNAL_KEY,JSON.stringify(j));}
 };
 function set(k,v){
  if(!isProgressKey(k))return local.set(k,v);
  if(held)return false;
  const main=k===SAVE_KEY||k===RECEIPTS_KEY||k===STORY_KEY,size=sizeWith(k,v);
  // A kept copy never takes the data near the limit; the app then keeps the current camp.
  if(!main&&size>DATA_BUDGET){onEvent('dataFull',{key:k,size});return false;}
  if(size>DATA_LIMIT)onEvent('dataOverLimit',{key:k,size});
  if(k===SAVE_KEY)journal.note(read(SAVE_KEY),v);else if(isKeptKey(k))journal.keep(v);
  try{
   data.setItem(k,v);
   if(isKeptKey(k)&&!index.has(k)){index.add(k);data.setItem(INDEX_KEY,JSON.stringify([...index]));}
   if(size>DATA_LIMIT){local.set(k,v);return false;}
   return data.getItem(k)===v;
  }catch(e){
   // The Data module refused (full, disabled, or another error): the write goes to this browser
   // instead, and is copied into the Data module at the next start (adoptLocal, reconcile).
   failed=true;onEvent('dataWriteError',{key:k,code:e?.code??null});
   return local.set(k,v);
  }
 }
 const get=k=>isProgressKey(k)?read(k):local.get(k);
 const keys=()=>[...progressKeys(),...local.keys().filter(k=>!isProgressKey(k))];
 return {kind:'data',get,set,keys,
  // After a login the SDK reloads the game; until then nothing more is written, so the camp on
  // screen cannot land in the account that just logged in.
  hold(){held=true;},get held(){return held;},get failed(){return failed;},
  size:()=>sizeWith(INDEX_KEY,JSON.stringify([...index])),user};
}

// Copies progress kept in this browser into the Data module. A key the Data module does not have is
// copied as it is; a camp that differs from the Data module's camp under the same key goes to a free
// kept slot instead. Each local save is copied once per browser (its tag is noted), so it is not
// copied again into another player's account on a shared device.
export function adoptLocal(store,local,now=Date.now()){
 const keys=local.keys().filter(isProgressKey),copied=[];
 if(!keys.length)return copied;
 const adopted=new Set(parse(local.get(ADOPTED_KEY),[]));
 const have=new Set(store.keys().filter(isProgressKey).map(k=>store.get(k)));
 for(const k of [RECEIPTS_KEY,STORY_KEY])if(keys.includes(k)&&store.get(k)===null){const v=local.get(k);if(v&&store.set(k,v))copied.push(k);}
 const camps=[...(keys.includes(SAVE_KEY)?[SAVE_KEY]:[]),...keys.filter(isKeptKey).sort()];
 for(const k of camps){
  const v=local.get(k),t=v&&tag(v);
  if(!v||adopted.has(t))continue;
  if(have.has(v)){adopted.add(t);continue;}
  const dest=store.get(k)===null?k:freeKey(k.includes('-damaged')?'damaged':'kept',store.get,now);
  if(store.set(dest,v)){have.add(v);adopted.add(t);copied.push(dest);}
 }
 local.set(ADOPTED_KEY,JSON.stringify([...adopted].slice(-200)));
 return copied;
}

// The last save written in an earlier session on this device, for this player. If the Data module
// still holds a save from before it in that session (the SDK's delayed write did not happen), it is
// written again. If the Data module holds a save from elsewhere (another device moved on), the noted
// save is kept aside instead, so neither is lost.
export function reconcile(store,local,now=Date.now()){
 const j=parse(local.get(JOURNAL_KEY),{}),e=j[store.user];
 if(!e?.last&&!e?.kept?.length)return null;
 const cur=store.get(SAVE_KEY);let result='synced';
 const isKept=v=>store.keys().some(k=>isKeptKey(k)&&store.get(k)===v);
 // Will the noted save replace the Data module's? Only an earlier save from that session (or none).
 const replace=!!e.last&&cur!==e.last&&(cur===null||(e.seen??[]).includes(tag(cur)));
 // Camps copied aside in that session come back first if the copy did not reach the Data module
 // (the current save counts as there unless it is about to be replaced).
 for(const v of e.kept??[])if(v!==e.last&&!(v===cur&&!replace)&&!isKept(v)&&!store.set(freeKey('kept',store.get,now),v))result='failed';
 if(!e.last||result==='failed'){if(result!=='failed'){const n=parse(local.get(JOURNAL_KEY),{});delete n[store.user];local.set(JOURNAL_KEY,JSON.stringify(n));}return result;}
 if(result==='synced'&&cur!==e.last){
  if(replace){
   // A different camp (a new camp or a restore whose copy-aside was delayed too) is kept aside
   // first; an earlier state of the same camp is simply brought up to date.
   const keepFirst=cur!==null&&campId(cur)!==campId(e.last)&&!isKept(cur);
   if(keepFirst&&!store.set(freeKey('kept',store.get,now),cur))result='failed';
   else result=store.set(SAVE_KEY,e.last)?'rewritten':'failed';
  }
  else result=isKept(e.last)||store.set(freeKey('kept',store.get,now),e.last)?'keptAside':'failed';
 }
 // A rewrite is noted afresh by set() (in case it is delayed too); otherwise the note is done with.
 if(result==='synced'||result==='keptAside'){const now2=parse(local.get(JOURNAL_KEY),{});delete now2[store.user];local.set(JOURNAL_KEY,JSON.stringify(now2));}
 return result;
}

// Opens the store the app uses. init: resolves true once the SDK is up (platform-cg.mjs initPlatform).
export async function openSaveStore({sdk=()=>globalThis.CrazyGames?.SDK??null,init=async()=>false,local=localStore(),now=Date.now(),onEvent=()=>{}}={}){
 const s=sdk();
 const up=!!s&&await Promise.resolve().then(init).catch(()=>false);
 if(!up||s.environment!=='crazygames'||typeof s.data?.getItem!=='function'||typeof s.data?.setItem!=='function'){onEvent('saveStore',{kind:'local'});return local;}
 try{s.data.getItem(SAVE_KEY);}catch(e){onEvent('saveStore',{kind:'local',code:e?.code??'dataReadError'});return local;}
 let user='guest';
 try{const u=await Promise.race([s.user?.getUser?.(),new Promise(r=>setTimeout(()=>r(null),2000))]);if(u)user=String(u.__dangerousUserId||u.username||'user');}catch{}
 const store=dataStore(s.data,local,{user,onEvent});
 const fix=reconcile(store,local,now),copied=adoptLocal(store,local,now);
 try{s.user?.addAuthListener?.(()=>store.hold());}catch{}
 onEvent('saveStore',{kind:'data',user:user==='guest'?'guest':'account',reconcile:fix,copied:copied.length});
 return store;
}
