// Coast Camp's CrazyGames adapter (Build 41 M7; replaces v5/next/ads.mjs). Uses the HTML5 SDK v3
// when the page loads it (v5/coast-crazygames.html); anywhere else every call is a quiet no-op
// and production ads stay unavailable. A stand-in is explicit loopback-only testing. v4/platform.mjs is unchanged.
// SDK calls used: SDK.init(), SDK.environment, SDK.game.loadingStart/loadingStop,
// SDK.game.gameplayStart/gameplayStop, SDK.game.happytime, SDK.ad.requestAd('rewarded',
// {adStarted,adFinished,adError}), SDK.game.settings.muteAudio and addSettingsChangeListener.
const sdk=()=>globalThis.CrazyGames?.SDK??null;
let ready=null,playing=false,loading=false;
const call=f=>{try{f(sdk());}catch{}};
// Resolves true once the SDK is up on CrazyGames; false without it, when it is disabled outside
// CrazyGames, when it fails, or when it does not answer in time.
export function initPlatform({timeout=4000}={}){
 if(ready)return ready;
 const s=sdk();if(!s?.init)return ready=Promise.resolve(false);
 ready=Promise.race([Promise.resolve().then(()=>s.init()).then(()=>s.environment!=='disabled',()=>false),new Promise(r=>setTimeout(()=>r(false),timeout))]);
 return ready;
}
const on=async()=>!!sdk()&&await initPlatform();
export const platform={
 available:on,
 async loadingStart(){if(await on()&&!loading){loading=true;call(s=>s.game.loadingStart());}},
 async loadingStop(){if(await on()&&loading){loading=false;call(s=>s.game.loadingStop());}},
 // Gameplay is on while the player is on the board (or the coast screen) with no menu, ad or
 // hidden tab; the app reports its state and only changes are passed on.
 async setPlaying(v){v=!!v;if(v===playing||!await on())return;playing=v;call(s=>v?s.game.gameplayStart():s.game.gameplayStop());},
 async happytime(){if(await on())call(s=>s.game.happytime?.());},
 muted:()=>!!sdk()?.game?.settings?.muteAudio,
 onMuteChange(fn){const s=sdk();if(!s?.game?.addSettingsChangeListener)return;try{s.game.addSettingsChangeListener(x=>fn(!!x?.muteAudio));}catch{}},
 get playing(){return playing;}
};
// A rewarded ad. Resolves 'finished' (give the reward), 'skipped' or 'error'. onStart/onEnd let
// the app mute and pause; onEnd always runs once, also on an error or when no answer comes.
let adInFlight=false;
const localTest=()=>['localhost','127.0.0.1','[::1]'].includes(globalThis.location?.hostname);
const basic=()=>{const d=globalThis.document?.documentElement?.dataset;return d?.ads==='off'||d?.launch==='basic';};
export async function adsAvailable({allowStandIn=false}={}){
 if(basic())return false;
 if(!sdk())return !!(allowStandIn&&localTest());
 if(globalThis.document&&globalThis.document.documentElement?.dataset?.ads!=='on')return false;
 return await on()&&sdk()?.environment==='crazygames'&&typeof sdk()?.ad?.requestAd==='function';
}
export async function rewardedAd({onStart=()=>{},onEnd=()=>{},standIn,allowStandIn=false,signal,timeout=90000}={}){
 if(basic()||adInFlight)return 'unavailable';adInFlight=true;
 let was=false;
 try{
  if(signal?.aborted)return 'skipped';
  if(!sdk())return allowStandIn&&localTest()&&typeof standIn==='function'?await standIn():'unavailable';
  if(!await adsAvailable())return 'unavailable';
  was=playing;await platform.setPlaying(false);
  return await new Promise(resolve=>{
   let done=false,started=false;
   const abort=()=>end('skipped');
   const end=r=>{if(done)return;done=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);try{onEnd();}finally{resolve(r);}};
   const timer=setTimeout(()=>end('error'),timeout);
   signal?.addEventListener('abort',abort,{once:true});
   if(signal?.aborted){end('skipped');return;}
   try{sdk().ad.requestAd('rewarded',{
    adStarted:()=>{if(!done&&!started){started=true;onStart();}},
    adFinished:()=>end(started?'finished':'error'),adError:()=>end('error'),
    adSkipped:()=>end('skipped')
   });}catch{end('error');}
  });
 }finally{adInFlight=false;if(was&&!signal?.aborted)await platform.setPlaying(true);}
}
// For tests: forget the SDK state between cases.
export function resetPlatform(){ready=null;playing=false;loading=false;adInFlight=false;}
