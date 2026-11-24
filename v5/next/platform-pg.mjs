// Vaultwake Merge's Playgama adapter (2026-11-24, release/playgama). The same surface as platform-cg.mjs (the
// CrazyGames adapter), over the Playgama Bridge SDK (window.bridge), which v5/next/playgama-boot.js has already
// initialised before the game module runs. Without the Bridge every call is a quiet no-op and ads stay off.
//
// Required steps it covers (Bridge SDK docs, API → Required steps):
//  - game_ready is sent once, when the first playable screen is up (the loading screen gone): loadingStop().
//  - audio and pause: platform.isAudioEnabled is read at start and the game's sounds stay silent while it is
//    false; AUDIO_STATE_CHANGED and PAUSE_STATE_CHANGED (tab switches, minimising, every full-screen ad) mute
//    the game and pause it (no sound, no gift or reminder opening by itself) until they clear.
//  - interstitials only at natural pauses the app chooses; the Bridge decides whether one is actually shown
//    (its own first delay and minimum interval). No timers or counters of the game's own.
//  - rewarded ads only when isRewardedSupported, started by a button; the reward only after the `rewarded`
//    state, never on `closed` alone.
const B=()=>globalThis.bridge??null;
const ok=()=>!!globalThis.VWBridge?.ok&&!!B();
const E=name=>B()?.EVENT_NAME?.[name]??name.toLowerCase();
let gameReady=false,playing=false,paused=false,audioOn=true,subscribed=false,adInFlight=false;
const muteListeners=new Set();
const call=f=>{try{return f(B());}catch{return undefined;}};
const notify=()=>{const m=platform.muted();for(const f of muteListeners){try{f(m);}catch{}}};
function subscribe(){
 if(subscribed||!ok())return;subscribed=true;
 audioOn=call(b=>b.platform.isAudioEnabled)!==false;
 // A full-screen ad already open at start (Bridge docs, Interstitial state) pauses the game at once.
 paused=['opened'].includes(call(b=>b.advertisement.interstitialState))||['opened'].includes(call(b=>b.advertisement.rewardedState));
 call(b=>b.platform.on(E('AUDIO_STATE_CHANGED'),v=>{audioOn=!!v;notify();}));
 call(b=>b.platform.on(E('PAUSE_STATE_CHANGED'),v=>{paused=!!v;document.documentElement.classList.toggle('pgPaused',paused);notify();}));
 document.documentElement.classList.toggle('pgPaused',paused);
}
export const onPlaygama=true;
export const SAVE_INIT_TIMEOUT=25000;
export const onCrazyGamesHost=()=>false;
export function initPlatform(){subscribe();return Promise.resolve(ok());}
export const platform={
 available:async()=>ok(),
 async loadingStart(){},
 // The first playable screen is up: Playgama hides its own loading screen and starts its analytics.
 async loadingStop(){if(ok()&&!gameReady){gameReady=true;call(b=>b.platform.sendMessage('game_ready'));}},
 setPlaying(v){playing=!!v;return Promise.resolve();},
 async happytime(){if(ok())call(b=>b.platform.sendMessage('player_got_achievement'));},
 muted:()=>ok()&&(!audioOn||paused),
 onMuteChange(fn){muteListeners.add(fn);},
 get playing(){return playing;},
 get paused(){return ok()&&paused;},
 get gameReadySent(){return gameReady;}
};
const localTest=()=>['localhost','127.0.0.1','[::1]'].includes(globalThis.location?.hostname);
// Rule 8 of the required steps: a rewarded offer is not shown at all where the platform has none.
export const rewardedSupported=()=>ok()&&call(b=>b.advertisement.isRewardedSupported)===true;
export async function adsAvailable({allowStandIn=false}={}){
 if(!B())return !!(allowStandIn&&localTest());
 return rewardedSupported();
}
// A rewarded ad. Resolves 'finished' (give the reward), 'skipped' or 'error'; 'unavailable' when none can be
// asked for. onStart/onEnd let the app mute and pause; onEnd always runs once. A signal that aborts (the page
// hidden, or closed) withholds the reward but still waits for the ad's own end, so a second ad cannot start
// over it.
export async function rewardedAd({onStart=()=>{},onEnd=()=>{},standIn,allowStandIn=false,signal,timeout=120000,placement='reward'}={}){
 if(adInFlight)return 'unavailable';
 if(!B())return allowStandIn&&localTest()&&typeof standIn==='function'?await standIn():'unavailable';
 if(!rewardedSupported())return 'unavailable';
 adInFlight=true;
 try{
  return await new Promise(resolve=>{
   let done=false,started=false,rewarded=false,aborted=!!signal?.aborted,grace=null;
   const onState=st=>{
    if(done)return;
    if(st==='opened'){if(!started){started=true;onStart();}}
    else if(st==='rewarded')rewarded=true;
    // Some platforms report `rewarded` just after `closed`: a short wait catches it.
    else if(st==='closed'){clearTimeout(grace);grace=setTimeout(()=>end(rewarded?'finished':'skipped'),400);}
    else if(st==='failed')end(rewarded?'finished':'error');
   };
   const abort=()=>{aborted=true;if(!started)end('skipped');};
   const timer=setTimeout(()=>end(rewarded?'finished':'error'),timeout);
   const end=r=>{if(done)return;done=true;clearTimeout(timer);clearTimeout(grace);call(b=>b.advertisement.off(E('REWARDED_STATE_CHANGED'),onState));signal?.removeEventListener('abort',abort);
    if(aborted&&r==='finished')r='skipped';try{onEnd();}finally{resolve(r);}};
   call(b=>b.advertisement.on(E('REWARDED_STATE_CHANGED'),onState));
   signal?.addEventListener('abort',abort,{once:true});
   if(aborted){end('skipped');return;}
   try{B().advertisement.showRewarded(placement);}catch{end('error');}
  });
 }finally{adInFlight=false;}
}
// An interstitial at a natural pause. Resolves 'shown' after it closed, 'skipped' when the Bridge did not show
// one (too early, or none available), 'unavailable' without the Bridge or support. Never throws.
export function interstitial(placement='break'){
 if(!ok()||call(b=>b.advertisement.isInterstitialSupported)!==true||adInFlight)return Promise.resolve('unavailable');
 return new Promise(resolve=>{
  let done=false,opened=false;
  const end=r=>{if(done)return;done=true;clearTimeout(idle);clearTimeout(cap);call(b=>b.advertisement.off(E('INTERSTITIAL_STATE_CHANGED'),onState));resolve(r);};
  const onState=st=>{if(st==='loading'||st==='opened'){opened=true;clearTimeout(idle);}else if(st==='closed')end(opened?'shown':'skipped');else if(st==='failed')end('skipped');};
  // The Bridge says nothing when it decides not to show one (its first delay or interval).
  const idle=setTimeout(()=>end('skipped'),2500),cap=setTimeout(()=>end(opened?'shown':'skipped'),90000);
  call(b=>b.advertisement.on(E('INTERSTITIAL_STATE_CHANGED'),onState));
  try{B().advertisement.showInterstitial(placement);}catch{end('skipped');}
 });
}
export function resetPlatform(){gameReady=false;playing=false;paused=false;audioOn=true;subscribed=false;adInFlight=false;muteListeners.clear();}
