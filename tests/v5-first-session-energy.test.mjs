import test from 'node:test';import assert from 'node:assert/strict';
import {fresh,load,act,START_ENERGY,ONBOARDING,SHOP,shopLeft,SAVE_KEY,totalBuilt} from '../v5/next/game.mjs';
import {capacityOf,STORE_ENERGY,settleEnergy} from '../v5/next/energy.mjs';
import {createEnergyReceipts} from '../v5/next/energy-receipts.mjs';
import {rewardedAd,adsAvailable,resetPlatform,platform} from '../v5/next/platform-cg.mjs';
const ok=(s,a)=>{const r=act(s,a,0);assert.equal(r.ok,true,r.message);return r;};
const stocked=()=>{const s=fresh(0);s.coins=2000;s.materials={'beach-path':3,'beach-tent':3};return s;};
const store=()=>{const m=new Map();return {get:k=>m.get(k)??null,set:(k,v)=>m.set(k,v)};};

test('100 applies only to new camps; old energy and progress survive migration, including three old ad rewards',()=>{
 assert.equal(START_ENERGY,100);assert.equal(fresh(0).energy,100);assert.equal(capacityOf(fresh(0)),50);assert.equal(STORE_ENERGY,200);
 for(const energy of [0,12,49,80,175,200]){const s=fresh(0);delete s.energyRewards;s.energy=energy;s.moves=43;s.shop={day:7,bought:{adEnergy:3}};
  const t=load(JSON.stringify(s),0);assert.equal(t.energy,energy);assert.equal(t.moves,43);assert.equal(t.shop.bought.adEnergy,3);assert.equal(shopLeft(t,'adEnergy',7),0);}
 const s=fresh(0);settleEnergy(s,12000000);assert.equal(s.energy,100,'above natural cap is retained, not refilled or reduced');
 s.energy=49;s.energyAt=0;settleEnergy(s,120000);assert.equal(s.energy,50);
});

test('completed stages 1/2/3 pay 20/10/10 once; repeated clicks, reload and later stages do not repeat them',()=>{
 let s=stocked();
 for(const [stage,energy] of [[1,20],[2,10],[3,10]]){const r=ok(s,{type:'restore',id:'beach-path'});assert.equal(totalBuilt(s),stage);assert.equal(r.effects.boost.energy,energy);s=load(JSON.stringify(s),0);assert.equal(s.energyRewards.stages,stage);}
 const before=JSON.stringify(s);assert.equal(act(s,{type:'restore',id:'beach-path'},0).ok,false);assert.equal(JSON.stringify(s),before);
 assert.equal(ok(s,{type:'restore',id:'beach-tent'}).effects.boost,undefined);
 for(const done of [1,2,3]){const old=stocked();old.built={'beach-path':done};old.energy=17;delete old.energyRewards;
  const t=load(JSON.stringify(old),0);assert.equal(t.energy,17,'no retroactive energy');assert.equal(t.energyRewards.stages,done);}
 assert.deepEqual(ONBOARDING,{order:15,stage:20,secondStage:10,thirdStage:10});
});

test('restoring an earlier camp cannot replay milestones or daily stock; separate new camps stay eligible',()=>{
 const st=store(),receipts=createEnergyReceipts(st,SAVE_KEY+'-energy-receipts',()=> 'camp-a');
 const s=stocked();receipts.apply(s);const earlier=JSON.stringify(s);
 for(let i=0;i<3;i++)ok(s,{type:'restore',id:'beach-path'});receipts.remember(s);
 const restored=load(earlier,0);const energy=restored.energy;receipts.apply(restored);assert.equal(restored.energy,energy,'receipts do not grant energy');
 for(let i=0;i<3;i++)assert.equal(ok(restored,{type:'restore',id:'beach-path'}).effects.boost,undefined);
 const other=stocked();other.energyRewards.id='camp-b';receipts.apply(other);assert.equal(ok(other,{type:'restore',id:'beach-path'}).effects.boost.energy,20);
 const q=fresh(0);q.energy=0;q.coins=1000;receipts.apply(q);const before=JSON.stringify(q);
 for(let i=0;i<3;i++)ok(q,{type:'buy',id:'energy',day:1});for(let i=0;i<2;i++)ok(q,{type:'adReward',id:'adEnergy',day:1});receipts.remember(q);
 const rollback=load(before,0);receipts.apply(rollback);assert.equal(shopLeft(rollback,'energy',1),0);assert.equal(shopLeft(rollback,'adEnergy',1),0);
 assert.equal(act(rollback,{type:'buy',id:'energy',day:1},0).ok,false);assert.equal(act(rollback,{type:'adReward',id:'adEnergy',day:1},0).ok,false);
 assert.equal(shopLeft(rollback,'energy',2),3);assert.equal(shopLeft(rollback,'adEnergy',2),2);
});

test('coin 80→20 ×3 and verified-ad 25 ×2 budgets reject cap overflow and overspending without consuming stock',()=>{
 assert.deepEqual(SHOP.energy,{name:'Energy pack',cost:80,energy:20,limit:3});assert.equal(SHOP.adEnergy.energy,25);assert.equal(SHOP.adEnergy.limit,2);
 for(const [type,id,energy] of [['buy','energy',20],['adReward','adEnergy',25]]){
  const s=fresh(0);s.coins=1000;s.energy=201-energy;const before=JSON.stringify(s);
  assert.equal(act(s,{type,id,day:1},0).ok,false);assert.equal(JSON.stringify(s),before);
  s.energy=200-energy;ok(s,{type,id,day:1});assert.equal(s.energy,200);
 }
 const poor=fresh(0);poor.coins=79;const before=JSON.stringify(poor);assert.equal(act(poor,{type:'buy',id:'energy',day:1},0).ok,false);assert.equal(JSON.stringify(poor),before);
});

const sdk=requestAd=>({environment:'crazygames',init:async()=>{},game:{gameplayStart(){},gameplayStop(){}},ad:{requestAd}});
test('production never falls back to fake rewards; Basic is off; local stand-in is explicit',async()=>{
 const oldLocation=globalThis.location,oldDocument=globalThis.document;
 try{delete globalThis.CrazyGames;resetPlatform();globalThis.location={hostname:'game.example'};
  assert.equal(await rewardedAd({allowStandIn:true,standIn:async()=>'finished'}),'unavailable');
  globalThis.location={hostname:'127.0.0.1'};assert.equal(await rewardedAd({standIn:async()=>'finished'}),'unavailable');
  assert.equal(await rewardedAd({allowStandIn:true,standIn:async()=>'finished'}),'finished');
  globalThis.CrazyGames={SDK:{...sdk(()=>assert.fail('no production fallback')),init:async()=>{throw Error('offline');}}};resetPlatform();
  assert.equal(await rewardedAd({allowStandIn:true,standIn:async()=>'finished'}),'unavailable');
  globalThis.document={documentElement:{dataset:{ads:'off'}}};assert.equal(await adsAvailable({allowStandIn:true}),false);
  assert.equal(await rewardedAd({allowStandIn:true,standIn:async()=>'finished'}),'unavailable');
 }finally{delete globalThis.CrazyGames;globalThis.location=oldLocation;globalThis.document=oldDocument;resetPlatform();}
});

test('only a started and completed SDK ad succeeds, once; failures/skips/abort/timeout/concurrency never reward',async()=>{
 try{
  for(const [mode,want] of [['finish','finished'],['error','error'],['skip','skipped'],['unstarted','error'],['throw','error'],['timeout','error']]){
   resetPlatform();let ended=0;globalThis.CrazyGames={SDK:sdk((kind,cb)=>{assert.equal(kind,'rewarded');if(mode==='throw')throw Error('no fill');if(mode==='timeout')return;if(mode!=='unstarted')cb.adStarted();if(mode==='error')cb.adError();else if(mode==='skip')cb.adSkipped();else cb.adFinished();cb.adFinished();})};
   assert.equal(await rewardedAd({timeout:10,onEnd:()=>ended++}),want,mode);assert.equal(ended,1);
  }
  resetPlatform();let callbacks,ends=0;globalThis.CrazyGames={SDK:sdk((k,cb)=>{callbacks=cb;cb.adStarted();})};
  await platform.setPlaying(true);const abort=new AbortController(),one=rewardedAd({signal:abort.signal,onEnd:()=>ends++});
  await new Promise(r=>setTimeout(r,0));assert.equal(await rewardedAd(),'unavailable');abort.abort();assert.equal(await one,'skipped');callbacks.adFinished();assert.equal(ends,1);assert.equal(platform.playing,false,'an interrupted ad must not restart hidden gameplay');
 }finally{delete globalThis.CrazyGames;resetPlatform();}
});


test('malformed receipt data cannot corrupt a valid camp or manufacture energy',()=>{
 const st=store(),key=SAVE_KEY+'-energy-receipts';
 st.set(key,JSON.stringify({camps:{'camp-a':{stages:999}},daily:{day:0,bought:{cog:3,adEnergy:999}}}));
 const s=fresh(0);s.energy=75;s.energyRewards.id='camp-a';createEnergyReceipts(st,key).apply(s);
 assert.equal(s.energy,75);assert.equal(s.energyRewards.stages,0);assert.deepEqual(s.shop.bought,{});
 assert.equal(load(JSON.stringify(s),0).energy,75,'the receipt does not turn a valid save into a new camp');
});

test('generate-and-clear cannot create an unlimited energy loop',()=>{
 const s=fresh(0),rig=s.board[21];s.board=Array(36).fill(null);s.board[21]=rig;
 for(let i=0;i<40;i++){const r=ok(s,{type:'produce',id:'rig'});ok(s,{type:'recycle',index:r.index});}
 assert.equal(s.energy,60);assert.equal(s.energyOwed,undefined);assert.deepEqual(s.boost,{order:false,stage:false});
});
