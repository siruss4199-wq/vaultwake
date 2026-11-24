// Vaultwake Merge on Playgama (2026-11-24, release/playgama). A plain script, the second in the page's
// <head> right after playgama-bridge.js. Playgama's required steps (Bridge SDK docs, "API → Required steps"):
// the Bridge is initialised BEFORE the game loads its styles, scripts and pictures, and progress is read with
// one storage.get([...]) call and restored before the game shows anything. Only then does this script add the
// game's styles, the loading screen (boot.js) and the game module (app.mjs), in that order.
//
// Progress, settings and the story flag all go through the Bridge's Storage module (rule 3.2.1: no
// localStorage of the game's own). window.VWKV is a small synchronous key-value store over it:
//  - every key the game uses is read at start, in one call, into memory;
//  - writes land in memory at once and reach bridge.storage.set() batched (all changed keys in one call),
//    at most every 2 s, and at once when the page is hidden or closed, or the platform pauses the game. The
//    Bridge then saves where the platform keeps data (its cloud storage, or the browser) and flushes on its own.
// When the Bridge cannot be used at all (its script failed to load, or initialize() failed or never answered)
// the game still starts: it then keeps progress in this browser's localStorage, the same way the standalone
// page always has. When the Bridge is up but its storage cannot be read, nothing is written over what the
// platform may hold: the session is playable and the menu says progress is not being saved.
(()=>{
 const SAVE='vaultwake-v5-coast',KINDS=['damaged','backup','kept'];
 const INDEX=SAVE+'-keys';
 // Every key the game reads (game.mjs SAVE_KEY, save-store.mjs RECEIPTS_KEY and INDEX_KEY, story-intro.mjs
 // STORY_KEY, saves.mjs kept-camp names, feedback.mjs and haptics.mjs settings).
 const KEYS=[SAVE,SAVE+'-energy-receipts',SAVE+'-story',INDEX,'vaultwake-sound','vaultwake-haptics',
  ...KINDS.flatMap(k=>[`${SAVE}-${k}`,...Array.from({length:8},(_,i)=>`${SAVE}-${k}-${i+2}`)])];
 const KEPT=new RegExp(`^${SAVE}-(damaged|backup|kept)(-\\d+)?$`);
 const INIT_TIMEOUT=10000,PUSH_EVERY=2000;
 const state=window.VWBridge={ok:false,reason:null,platform:null,language:null,initMs:null,storage:null,readFailed:false,writes:0,pushes:0,pushErrors:0,lastSaved:null};
 const t0=performance.now();
 const timeout=(p,ms)=>Promise.race([p,new Promise((_,no)=>setTimeout(()=>no(new Error('timeout')),ms))]);

 // The store the game uses on Playgama. get/set/keys are synchronous (the game's save rules rely on reading
 // back what it wrote); pushes to the Bridge are batched.
 function bridgeKV(bridge,initial,{hold=false}={}){
  const mem=new Map(Object.entries(initial)),dirty=new Set();let timer=null,chain=Promise.resolve();
  const index=new Set();try{for(const k of JSON.parse(mem.get(INDEX)??'[]'))if(KEPT.test(k))index.add(k);}catch{}
  const push=()=>{
   clearTimeout(timer);timer=null;
   if(hold||!dirty.size)return chain;
   const keys=[...dirty];dirty.clear();const values=keys.map(k=>mem.get(k));
   state.pushes++;
   chain=chain.then(()=>bridge.storage.set(keys,values)).then(()=>{state.lastSaved=Date.now();},e=>{
    state.pushErrors++;for(const k of keys)if(!dirty.has(k))dirty.add(k);console.warn('[Vaultwake save] Bridge storage.set failed',e);
    timer??=setTimeout(push,PUSH_EVERY*3);
   });
   return chain;
  };
  const schedule=()=>{if(!hold)timer??=setTimeout(push,PUSH_EVERY);};
  const kv={
   kind:'bridge',
   getItem:k=>mem.has(k)?mem.get(k):null,
   setItem(k,v){
    v=String(v);if(mem.get(k)===v)return;
    mem.set(k,v);dirty.add(k);state.writes++;
    // A kept camp under a time-based name is found again through the index (the Bridge cannot list keys).
    if(KEPT.test(k)&&!index.has(k)&&!KEYS.includes(k)){index.add(k);mem.set(INDEX,JSON.stringify([...index]));dirty.add(INDEX);}
    schedule();
   },
   removeItem(k){if(!mem.has(k))return;mem.delete(k);if(!hold)chain=chain.then(()=>bridge.storage.delete([k])).catch(()=>{});},
   keys:()=>[...mem.keys()].filter(k=>mem.get(k)!==null),
   // Everything pending, sent now and flushed by the Bridge (before a reload, when hidden or paused).
   flush:()=>push().then(()=>hold?undefined:bridge.storage.flush?.()).catch(()=>{}),
   get held(){return hold;}
  };
  addEventListener('pagehide',()=>{kv.flush();});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')kv.flush();});
  try{bridge.platform.on(bridge.EVENT_NAME.PAUSE_STATE_CHANGED,p=>{if(p)kv.flush();});}catch{}
  return kv;
 }
 // No Bridge: this browser's storage, as on the standalone page.
 function localKV(){
  const ls=(()=>{try{return window.localStorage;}catch{return null;}})();
  return {kind:'local',
   getItem:k=>{try{return ls?.getItem(k)??null;}catch{return null;}},
   setItem:(k,v)=>{try{ls?.setItem(k,String(v));state.writes++;state.lastSaved=Date.now();}catch{}},
   removeItem:k=>{try{ls?.removeItem(k);}catch{}},
   keys:()=>{try{return Array.from({length:ls.length},(_,i)=>ls.key(i)).filter(Boolean);}catch{return [];}},
   flush:()=>Promise.resolve(),held:false};
 }

 async function start(){
  const bridge=window.bridge;
  if(!bridge?.initialize){state.reason='Bridge SDK not loaded';return localKV();}
  try{await timeout(bridge.initialize(),INIT_TIMEOUT);}catch(e){state.reason='initialize failed: '+(e?.message??e);return localKV();}
  state.ok=true;state.initMs=Math.round(performance.now()-t0);
  try{state.platform=bridge.platform.id;state.language=bridge.platform.language;}catch{}
  // Rule 3.4.2: the language comes from the Bridge. The game is in English only, the default and fallback.
  document.documentElement.lang='en';
  const read=async keys=>{const v=await timeout(bridge.storage.get(keys,false),8000);return Object.fromEntries(keys.map((k,i)=>[k,v?.[i]??null]));};
  let data=null;
  for(let n=0;n<2&&!data;n++){try{data=await read(KEYS);}catch(e){state.reason='storage.get failed: '+(e?.message??e);await new Promise(r=>setTimeout(r,800));}}
  if(!data){state.readFailed=true;return bridgeKV(bridge,{},{hold:true});}
  // Kept camps under time-based names, listed in the index (rare: more than nine of a kind).
  try{const extra=JSON.parse(data[INDEX]??'[]').filter(k=>KEPT.test(k)&&!(k in data));if(extra.length)Object.assign(data,await read(extra));}catch{}
  for(const k of Object.keys(data))if(data[k]===null||data[k]==='')delete data[k];
  state.storage='bridge';
  return bridgeKV(bridge,data);
 }

 // The game's files, in the page's order once the Bridge is ready: styles first (the loading screen needs
 // them), then boot.js (the loading screen), then the game module.
 const list=name=>(document.querySelector(`meta[name="${name}"]`)?.content||'').split(' ').filter(Boolean);
 function load(){
  const styles=list('pg-styles').map(href=>new Promise(done=>{const l=document.createElement('link');l.rel='stylesheet';l.href=href;l.onload=l.onerror=done;document.head.append(l);}));
  Promise.all(styles).then(()=>{
   document.documentElement.classList.remove('pgWait');
   const [boot,app]=list('pg-scripts');
   const s=document.createElement('script');s.src=boot;
   s.onload=s.onerror=()=>{const m=document.createElement('script');m.type='module';m.src=app;document.body.append(m);};
   document.body.append(s);
  });
 }
 window.VWKVReady=start().catch(e=>{state.reason='start failed: '+(e?.message??e);return localKV();}).then(kv=>{
  window.VWKV=kv;state.storage??=kv.kind;console.info('[Vaultwake] Playgama Bridge',state);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
  return kv;
 });
})();
