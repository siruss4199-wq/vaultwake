// The save store on Playgama (2026-11-24, release/playgama): the same small surface as save-store.mjs's stores
// (get, set, keys, status) over window.VWKV, the key-value store playgama-boot.js opened on the Bridge's Storage
// module after reading every key once. The app's save rules are unchanged (a kept copy is never overwritten,
// nothing replaces the save unless its copy was written, a save this build cannot read is never written over).
// The save format and keys are the same as on every other build, so a camp moves between builds unchanged.
export function kvStore(kv,bridgeState={}){
 const status={kind:kv.kind==='bridge'?'bridge':'local',platform:bridgeState.platform??null,reason:bridgeState.reason??null,
  held:!!kv.held,writes:0,accepted:0,lastSaved:null,errors:[]};
 const set=(k,v)=>{kv.setItem(k,v);const ok=kv.getItem(k)===String(v);status.writes++;if(ok){status.accepted++;status.lastSaved=Date.now();}return ok;};
 return {kind:status.kind,get:k=>kv.getItem(k),set,keys:()=>kv.keys(),status,flush:()=>Promise.resolve(kv.flush?.())};
}
// The menu's save line on Playgama.
export function bridgeSaveLine(st,bridgeState={},now=Date.now()){
 const ago=t=>{const s=Math.round((now-t)/1000);return s<60?`${s} s ago`:`${Math.round(s/60)} min ago`;};
 if(st.held)return 'Progress: the platform\'s storage could not be read, so this session is not being saved.';
 if(st.kind==='bridge'){const t=bridgeState.lastSaved??st.lastSaved;return 'Progress: saved automatically'+(t?` · last save ${ago(t)}`:'')+'.';}
 return 'Progress: saved in this browser.';
}
