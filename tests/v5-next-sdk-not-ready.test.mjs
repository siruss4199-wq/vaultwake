// Build 57y P0: the real CrazyGames SDK's module getters throw while it is not initialised and on a domain
// that is not CrazyGames. Asking whether the game is muted must never throw (every sound asks it first).
import test from 'node:test';import assert from 'node:assert/strict';
test('platform.muted() and onMuteChange() never throw when SDK.game throws',async()=>{
 const {platform,resetPlatform}=await import('../v5/next/platform-cg.mjs');
 for(const code of ['sdkNotInitialized','sdkDisabled']){
  resetPlatform();
  globalThis.CrazyGames={SDK:{get environment(){return code==='sdkDisabled'?'disabled':'uninitialized';},init:()=>new Promise(()=>{}),get game(){throw {code,message:'CrazySDK not ready'};}}};
  assert.equal(platform.muted(),false,`${code}: not muted, no throw`);
  assert.doesNotThrow(()=>platform.onMuteChange(()=>{}),`${code}: onMuteChange does not throw`);
 }
 // once the SDK runs on CrazyGames, its mute setting is still followed
 globalThis.CrazyGames={SDK:{environment:'crazygames',game:{settings:{muteAudio:true}}}};
 assert.equal(platform.muted(),true);
 delete globalThis.CrazyGames;assert.equal(platform.muted(),false,'no SDK: not muted');
});
