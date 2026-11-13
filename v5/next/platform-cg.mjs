// Coast Camp's CrazyGames adapter (Build 41 M7; replaces v5/next/ads.mjs). Uses the HTML5 SDK v3
// when the page loads it (v5/coast-crazygames.html); anywhere else every call is a quiet no-op
// and production ads stay unavailable. A stand-in is explicit loopback-only testing. v4/platform.mjs is unchanged.
// SDK calls used: SDK.init(), SDK.environment, SDK.game.loadingStart/loadingStop,
// SDK.game.gameplayStart/gameplayStop, SDK.game.happytime, SDK.ad.requestAd('rewarded',
// {adStarted,adFinished,adError}), SDK.game.settings.muteAudio and addSettingsChangeListener.
const sdk=()=>globalThis.CrazyGames?.SDK??null;
let ready=null,playing=false,loading=false,want=false,queue=Promise.resolve();
const call=f=>{try{f(sdk());}catch{}};
// Resolves true once the SDK is up on CrazyGames; false without it, when it is disabled outside
// CrazyGames, when it fails, or when it does not answer within timeout. The SDK's own init is
// started once and kept: a timeout answers false for that call only, and a later call answers true
// once init has finished (2026-11-09: a slow init used to be remembered as a failure for the whole
// session). On CrazyGames the real SDK's init waits for the CrazyGames page, the player and their
// cloud data, which can take more than 4 s.
export function initPlatform({timeout=4000}={}){
 const s=sdk();if(!s?.init)return Promise.resolve(false);
 ready??=Promise.resolve().then(()=>s.init()).then(()=>s.environment!=='disabled',()=>false);
 return Promise.race([ready,new Promise(r=>setTimeout(()=>r(false),timeout))]);
}
// Whether this page is served by CrazyGames (its game host, or framed by a CrazyGames page): there
// the save waits for the SDK for longer (SAVE_INIT_TIMEOUT) instead of falling back to localStorage.
export function onCrazyGamesHost(loc=globalThis.location){
 const cg=h=>/(^|\.)crazygames\.[a-z.]+$/i.test(h||'');
 try{if(cg(loc?.hostname))return true;for(const o of loc?.ancestorOrigins??[])if(cg(new URL(o).hostname))return true;}catch{}
 try{return !!globalThis.document?.referrer&&cg(new URL(globalThis.document.referrer).hostname);}catch{return false;}
}
export const SAVE_INIT_TIMEOUT=25000;
const on=async()=>!!sdk()&&await initPlatform();
export const platform={
 available:on,
 async loadingStart(){if(await on()&&!loading){loading=true;call(s=>s.game.loadingStart());}},
 async loadingStop(){if(await on()&&loading){loading=false;call(s=>s.game.loadingStop());}},
 // Gameplay is on while the player is on the board (or the coast screen) with no menu, ad or
 // hidden tab; the app reports its state and only changes are passed on.
 // First Session 2.0 (2026-11-13, the audit's double gameplayStart): the check used to run before the await,
 // so two calls in the same moment (arriving on the board and the 1 s sync) both passed it and both sent
 // gameplayStart. Calls now queue: each sends only when the wanted state still differs from the last one sent.
 setPlaying(v){want=!!v;return queue=queue.then(async()=>{if(want===playing||!await on())return;playing=want;const w=want;call(s=>w?s.game.gameplayStart():s.game.gameplayStop());});},
 async happytime(){if(await on())call(s=>s.game.happytime?.());},
 // Build 57y (P0, owner's iPhone on the Cloudflare preview): the real SDK's SDK.game is a getter that THROWS
 // while the SDK is not initialised ("sdkNotInitialized") and on a domain that is not CrazyGames
 // ("sdkDisabled"), as on a preview. Every sound asks muted() first, so the tap that played it (the
 // restoration strip, Details) died before doing anything. Reading the SDK can never throw here.
 muted:()=>{try{const s=sdk();return !!(s&&(s.environment==='crazygames'||s.environment==='local')&&s.game?.settings?.muteAudio);}catch{return false;}},
 onMuteChange(fn){try{const s=sdk();if(!s?.game?.addSettingsChangeListener)return;s.game.addSettingsChangeListener(x=>fn(!!x?.muteAudio));}catch{}},
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
export function resetPlatform(){ready=null;playing=false;loading=false;want=false;queue=Promise.resolve();adInFlight=false;}
