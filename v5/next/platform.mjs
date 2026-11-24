// Which platform adapter the game talks to (2026-11-24, release/playgama). The Playgama page
// (<html data-platform="playgama">, tools/coast-playgama.mjs) uses the Playgama Bridge adapter; every other page
// (the standalone page, the CrazyGames page, tests) keeps the CrazyGames adapter exactly as before. The
// Playgama ZIP replaces this file with `export * from './platform-pg.mjs'` and ships no CrazyGames code.
import * as cg from './platform-cg.mjs';
import * as pg from './platform-pg.mjs';
export const onPlaygama=globalThis.document?.documentElement?.dataset?.platform==='playgama';
const P=onPlaygama?pg:cg;
export const SAVE_INIT_TIMEOUT=cg.SAVE_INIT_TIMEOUT;
export const platform=P.platform;
export const initPlatform=(...a)=>P.initPlatform(...a);
export const onCrazyGamesHost=(...a)=>P.onCrazyGamesHost(...a);
export const adsAvailable=(...a)=>P.adsAvailable(...a);
export const rewardedAd=(...a)=>P.rewardedAd(...a);
export const rewardedSupported=()=>onPlaygama?pg.rewardedSupported():true;
export const interstitial=(...a)=>onPlaygama?pg.interstitial(...a):Promise.resolve('unavailable');
export const resetPlatform=()=>P.resetPlatform();
