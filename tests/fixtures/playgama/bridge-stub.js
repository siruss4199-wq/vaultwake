// A stand-in Playgama Bridge for tests/v5-playgama-browser.cjs: the API surface the game uses, recording every
// call in window.__pg.calls. Its settings come from localStorage.__pgCfg; its "platform storage" is kept in
// localStorage.__pgStub (so it survives a reload). The game itself must never write localStorage on Playgama.
(()=>{
 const cfg=JSON.parse(localStorage.getItem('__pgCfg')||'{}');
 const store=JSON.parse(localStorage.getItem('__pgStub')||'{}');
 const save=()=>localStorage.setItem('__pgStub',JSON.stringify(store));
 const log=window.__pg={calls:[],cfg};
 const rec=(n,d)=>log.calls.push({n,d,t:Date.now()});
 const handlers={};
 const on=(e,f)=>{(handlers[e]??=new Set()).add(f);};
 const off=(e,f)=>{handlers[e]?.delete(f);};
 const emit=(e,...a)=>{for(const f of [...(handlers[e]??[])])f(...a);};
 log.emit=emit;
 const EVENT_NAME={AUDIO_STATE_CHANGED:'audio_state_changed',PAUSE_STATE_CHANGED:'pause_state_changed',REWARDED_STATE_CHANGED:'rewarded_state_changed',INTERSTITIAL_STATE_CHANGED:'interstitial_state_changed'};
 let audio=cfg.audio!==false;
 log.setAudio=v=>{audio=v;emit(EVENT_NAME.AUDIO_STATE_CHANGED,v);};
 const ad={rewarded:null,interstitial:null};
 window.bridge={
  version:'stub',EVENT_NAME,
  initialize(){rec('initialize');
   if(cfg.init==='fail')return Promise.reject(new Error('stub initialize failure'));
   if(cfg.init==='hang')return new Promise(()=>{});
   return new Promise(r=>setTimeout(()=>{rec('initialized');r();},cfg.initDelay??200));},
  platform:{id:'playgama',language:cfg.language??'en',get isAudioEnabled(){return audio;},sendMessage(m){rec('sendMessage',m);},on,off},
  storage:{
   get(keys,parse){rec('storage.get',{keys:keys.length,parse});if(cfg.read==='fail')return Promise.reject(new Error('stub storage failure'));return Promise.resolve(keys.map(k=>k in store?store[k]:null));},
   set(keys,values){rec('storage.set',{keys});keys.forEach((k,i)=>{store[k]=values[i];});save();return Promise.resolve();},
   delete(keys){rec('storage.delete',{keys});for(const k of keys)delete store[k];save();return Promise.resolve();},
   flush(){rec('storage.flush');return Promise.resolve();}
  },
  advertisement:{
   get isRewardedSupported(){return cfg.rewarded!==false;},
   get isInterstitialSupported(){return cfg.interstitial!==false;},
   get rewardedState(){return ad.rewarded;},get interstitialState(){return ad.interstitial;},
   on,off,
   showRewarded(p){rec('showRewarded',p);const mode=cfg.rewardMode??'success';
    const st=s=>{ad.rewarded=s;emit(EVENT_NAME.REWARDED_STATE_CHANGED,s);};
    setTimeout(()=>{
     if(mode==='fail'){st('failed');return;}
     st('opened');emit(EVENT_NAME.PAUSE_STATE_CHANGED,true);emit(EVENT_NAME.AUDIO_STATE_CHANGED,false);
     setTimeout(()=>{if(mode==='success')st('rewarded');st('closed');emit(EVENT_NAME.PAUSE_STATE_CHANGED,false);emit(EVENT_NAME.AUDIO_STATE_CHANGED,audio);},cfg.adMs??500);
    },100);},
   showInterstitial(p){rec('showInterstitial',p);if(cfg.interstitialMode==='skip')return;
    const st=s=>{ad.interstitial=s;emit(EVENT_NAME.INTERSTITIAL_STATE_CHANGED,s);};
    setTimeout(()=>{st('opened');emit(EVENT_NAME.PAUSE_STATE_CHANGED,true);emit(EVENT_NAME.AUDIO_STATE_CHANGED,false);
     setTimeout(()=>{st('closed');emit(EVENT_NAME.PAUSE_STATE_CHANGED,false);emit(EVENT_NAME.AUDIO_STATE_CHANGED,audio);},800);},100);}
  }
 };
})();
