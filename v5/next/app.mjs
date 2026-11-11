// Coast Camp: the new-loop page (v5/play.html). Same look as Classic V5, one loop:
// generators → merge → crew orders → coins → upgrade the coast's places on the beach screen.
import {blockedStage,isStuck,allDone,swapsLeft,adSwapsLeft,SHOP,shopLeft,BOOK_COINS,BOOK_CHAINS,bookKeys,bookReady,pageReady,SHED_SLOTS,DAILY,newestGenerator,cog,token,SAVE_KEY,fresh,load,act,tick,nameOf,item,matches,count,orderItems,nextTask,currentArea,areaDone,upgrades,stageOf,builtCount,sourceOpen,SOURCES,chainsOf,CRATES,CRATE_DROPS,clearRefund,cargoKeys,reachable,generatorsMerge,MAX_GENERATOR_LEVEL,GLASS_HITS,nextKind,UNLOCK_LEVEL,GENERATOR_ORDER,storyTarget,roleOf,SECONDARY_RULES,SECONDARY_OF,secondarySource,rareRule} from './game.mjs';
import {AREAS,STAGES,TASKS,LABELS} from './areas.mjs';
import {primaryAction} from './guide.mjs';
import {coachStep,coachActive,laterTip,nextRareUse,COACH_ON,COACH_DONE,FIRST_PLACE} from './coach.mjs';
import {needsOf,missingOf,levelOf} from './needs.mjs';
import {LEVEL_PATH,BONUS_NAMES,CHEST_ENERGY,EARLY_LEVELS,EARLY_LEVEL_ENERGY,ONBOARDING,goldChase} from './game.mjs';
import {kit} from '../kits.mjs';
import {iceNeed,weakIceBeside} from './ice.mjs';
import {purposeOf} from './purposes.mjs';
import {createLog} from './playtest.mjs';
import {rewardedAd,adsAvailable,initPlatform,platform,onCrazyGamesHost,SAVE_INIT_TIMEOUT} from './platform-cg.mjs';
import {cellPos} from '../core.mjs';
import {CHAINS,draw,maxTier,chainsAt,GENERATOR_CHAINS} from './chains.mjs';
import {art,portrait} from '../art.mjs';
import {enablePremium} from '../premium.mjs';
import {kitsMerge,kitFull,kitDrop,kitCapacity,producerLevel,KIT_SIZES,KIT_DROPS,MAX_KIT_SIZE,MAX_PRODUCER_LEVEL} from '../kits.mjs';
import {xpToNext} from '../levels.mjs';
// Energy pass (build 47v): Coast Camp's own energy module (the player level's refill capacity).
import {refillTimes,clock,REFILL_EVERY,rationWait,capacityOf,nextCapacity,MAX_CAPACITY,STORE_ENERGY} from './energy.mjs';
import {CREW} from '../crew.mjs';
import {reduced,burst,rewardFlight,moment as sharedMoment} from '../feedback.mjs';
import {sfx as sounds} from './sfx.mjs';
import {createHome} from './home.mjs';
import {readSave,keptCamps,freeKey,isKeptKey} from './saves.mjs?build=releaseqa54';
import {openSaveStore,saveLine} from './save-store.mjs';
import {playIntro,preloadIntro,storySeen,playScenes} from './story-intro.mjs';
import {haptics} from './haptics.mjs';
import {createEnergyReceipts} from './energy-receipts.mjs';
// The shared moment draws its icon with the Classic art; new chains need draw().
// Moments show above an open screen (the beach) too: a modal dialog covers the page.
// Energy pass (build 47v): a short note under the energy pill (+15 energy, a capacity milestone),
// beside the usual feedback and never blocking a tap; reduced motion shows it without movement.
function energyNote(text){document.querySelector('.energyNote')?.remove();const el=document.createElement('div');el.className='energyNote';el.setAttribute('role','status');el.textContent=text;
 const r=$('#energyPill').getBoundingClientRect();el.style.left=Math.max(8,Math.min(r.left,innerWidth-230))+'px';el.style.top=(r.bottom+14)+'px';([...document.querySelectorAll('dialog[open]')].at(-1)??document.body).append(el);setTimeout(()=>el.remove(),2600);}
function moment(title,detail='',x=null){sharedMoment(title,detail,null);const el=document.querySelector('.moment');const top=[...document.querySelectorAll('dialog[open]')].pop();if(el&&top)top.append(el);if(!x||!el)return;const icon=document.createElement('span');icon.style.cssText='float:left;width:42px;height:42px;margin-right:10px';icon.innerHTML=draw(x);icon.firstElementChild.style.cssText='width:100%;height:100%';el.prepend(icon);}

// Game sounds go through sfx: silent while an ad plays or when CrazyGames mutes the game
// (Build 41 M7), without touching the player's own sound setting.
let adPlaying=false;
const sfx=(kind,tier=0)=>sounds.play(kind,tier,{muted:adPlaying||platform.muted()});
// Shown in the footer so a playtester can tell which build is running.
export const BUILD='Build 52A4 · harder orders from stage 3, crates give wanted parts, Tide token always usable';
// The level path (docs/V5_LEVEL_PATH_2026-10-27.md): a crew order that pays a tool on top shows it
// beside its coins (a Tide token; a favour's Sea chest, Brass cog or, once no generator can go up, Tide token).
const bonusThing=o=>o.bonus==='cog'?cog():o.bonus==='chest'?kit(newestGenerator(state),2):o.bonus==='token'?token():null;
const bonusArt=o=>o.bonus?`<span class="reqBonus" title="Also pays a ${BONUS_NAMES[o.bonus]}" aria-label="plus a ${BONUS_NAMES[o.bonus]}">+${draw(bonusThing(o))}</span>`:'';
// What the player level opens next, for the level badge.
const nextUnlock=lv=>LEVEL_PATH.find(u=>u.level>lv)??null;
// The generator's energy mark (Build 45m): a drawn bolt; the old "ϟ" text glyph rendered thin and
// crooked at badge size, differently on every font.
const BOLT='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 1.5 4.5 13.5H11L9.5 22.5 19.5 10H13Z"/></svg>';
enablePremium('vibrant');document.body.dataset.art='premium';document.body.dataset.palette='vibrant';
const $=q=>document.querySelector(q),board=$('#board');
// Progress lives in the CrazyGames SDK's Data module on CrazyGames and in localStorage anywhere else
// (save-store.mjs, 2026-11-08). The SDK is initialised first, so the save is read from the right place.
const saveNotes=[];
// On CrazyGames the real SDK's init can take several seconds (2026-11-09 private-QA failure): the
// save waits for it (the loading screen stays up) rather than falling back to localStorage.
const storage=await openSaveStore({init:()=>initPlatform({timeout:onCrazyGamesHost()?SAVE_INIT_TIMEOUT:4000}),
 onEvent:(e,d)=>{saveNotes.push([e,d]);if(/Error|Full|OverLimit/.test(e))console.warn('[Vaultwake save]',e,d);}});
// Diagnostics for QA: where progress goes and whether saves are accepted (also the menu's save line).
globalThis.VWSave=storage.status;console.info('[Vaultwake save]',saveLine(storage.status),storage.status);
// ?new=1 (the playtest page's "start from the beginning" link) starts a new camp.
const startNew=new URLSearchParams(location.search).has('new');
if(startNew){const q=new URLSearchParams(location.search);q.delete('new');history.replaceState(null,'',location.pathname+(q.size?'?'+q:''));}
// Home (Build 46p): the save is read once here. load() answers a save it cannot read with a new
// camp (game.mjs); readSave (saves.mjs) tells which kind of unreadable save it is: one made by a NEWER
// build (parts or generators this build does not know, round 2 of the secondary-chain pilot) or a
// damaged one. Either way it is kept as it is: nothing is written over it until the player chooses a
// new camp on Home (which first copies it to SAVE_KEY+'-damaged'). A new camp with no save is not
// written either until the player presses Play.
const bootNow=Date.now(),stored=storage.get(SAVE_KEY)||null,rawSave=startNew?null:stored,read=readSave(rawSave,bootNow);
let state=startNew?fresh(bootNow):read.state,selected=null,focusOrder=null,drag=null,suppressClick=false;
let damaged=read.status==='damaged'||read.status==='newer',newer=read.status==='newer',holdSave=!rawSave||damaged,homeOpen=!!document.getElementById('home');
// Round 2: ?new=1 (the playtest page's "start from the beginning" link) no longer writes over the
// camp it replaces: that camp is kept (SAVE_KEY-kept…) before the new one is first saved.
let replaced=startNew?stored:null;
const receipts=createEnergyReceipts(storage,SAVE_KEY+'-energy-receipts');
receipts.apply(state);
const persist=()=>{if(holdSave)return;receipts.apply(state);if(replaced){if(!keepCopy(replaced,'kept'))return;replaced=null;}storage.set(SAVE_KEY,JSON.stringify(state));receipts.remember(state);};
const storageKeys=()=>storage.keys();
// Keeps a copy of a camp before anything replaces it. Build 47c (reconciling PR #80's
// vaultwake-v5-coast-backup with Build 46p's -damaged key): a kept copy is never overwritten. The
// save goes to the first free key of its kind (-damaged or -kept, then -2 … -9, then one named by the
// time), unless an identical copy is already kept under any kept key. It answers false when the copy
// could not be written (storage full); then nothing replaces the save.
function keepCopy(raw,kind){
 if(!raw||storageKeys().filter(isKeptKey).some(k=>storage.get(k)===raw))return true;
 const k=freeKey(kind,storage.get,Date.now());storage.set(k,raw);return storage.get(k)===raw;
}
function keepDamaged(){
 if(damaged&&rawSave){if(!keepCopy(rawSave,'damaged'))return false;playlog.event('saveDamaged',{newer});}
 damaged=false;newer=false;return true;
}
// Kept camps (round 2): every camp kept in this browser that this build reads can be restored. The
// camp it replaces is kept first, so a restore loses nothing either. This is the way back after a camp
// went through an older build (which keeps it as -damaged when the player starts a new camp there),
// after a new camp, or after ?new=1.
const kept=()=>keptCamps(storageKeys(),storage.get,Date.now(),storage.get(SAVE_KEY));
function restoreKept(key){
 const raw=storage.get(key);if(!raw)return false;
 persist();const cur=storage.get(SAVE_KEY);
 if(cur&&cur!==raw&&!keepCopy(cur,damaged?'damaged':'kept')){alert('Your current camp could not be copied aside (this browser\'s storage is full), so nothing was replaced.');return false;}
 storage.set(SAVE_KEY,raw);if(storage.get(SAVE_KEY)!==raw){alert('The kept camp could not be restored (this browser\'s storage is full).');return false;}
 holdSave=true;playlog.event('restoreKept');location.reload();return true;
}
function showKept(){
 const list=kept(),when=t=>new Date(t).toLocaleString(undefined,{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
 $('#keptList').innerHTML=list.length?list.map(c=>`<li><span><b>${c.label}</b><small>last played ${when(c.when)}</small></span><button type="button" class="primary" data-restore="${c.key}">Restore</button></li>`).join(''):'<li><span>No other camp is kept in this browser.</span></li>';
 $('#kept').showModal();
}
$('#keptList').addEventListener('click',e=>{const b=e.target.closest('[data-restore]');if(b)restoreKept(b.dataset.restore);});
// The local playtest log (Build 41 M6): this browser only, copied out by the player.
const playlog=createLog({storage:{get:k=>{try{return localStorage.getItem(k);}catch{return null;}},set:(k,v)=>localStorage.setItem(k,v),remove:k=>localStorage.removeItem(k)},
 build:BUILD,viewport:`${innerWidth}x${innerHeight}`,touch:!!globalThis.matchMedia?.('(pointer:coarse)').matches});
playlog.startSession();
for(const [e,d] of saveNotes)playlog.event(e,d);
setInterval(()=>playlog.flush(),5000);
addEventListener('pagehide',()=>playlog.end('pagehide'));
document.addEventListener('visibilitychange',()=>{if(document.hidden)playlog.end('hidden');else playlog.event('resume');});
persist();

const ICONS={rock:{type:'rock'},'crate-salvage':{type:'crate',kind:'salvage'},'crate-survey':{type:'crate',kind:'survey'},'source-chart':{type:'source',id:'chart'},'flux-3':item('flux',3),'chart-1':item('chart',1)};
// A gold coin (orders pay coins; coins upgrade the beach).
const COIN='<i class="coinIcon" aria-hidden="true"></i>';
// Players see no developer tools and no ad offers (2026-10-26, user: "publish hiihed yu uldsen be
// ... hurdan duusgay"): ?dev=1 shows the playtest log, the sound check, the Classic link, the
// build name and the ad stand-in, as before; a page that has real ads says data-ads="on"
// (CrazyGames after Full Launch). Without ads every ad offer is hidden; nothing else changes.
const DEV=new URLSearchParams(location.search).has('dev');document.documentElement.dataset.dev=DEV?'on':'off';
const ADS=document.documentElement.dataset.ads==='on'||DEV&&document.documentElement.dataset.ads!=='off';
const pips=n=>`<span class="pips" aria-label="stage ${n} of ${STAGES}">${Array.from({length:STAGES},(_,k)=>`<i class="${k<n?'on':''}"></i>`).join('')}</span>`;
// Places with stage art (build 38: workshop, pier, beacon) are drawn as they stand at their stage.
// Build 48a: the Hidden Harbour's cut-outs (tools/harbour-art.py) live in their own folder. Build 48c:
// after the launch the boatyard's card is its finished yard from the restored map, cradles empty because
// the boat has sailed ('launched'); it no longer falls back to the stage-1 cut-out, which read as unbuilt.
const artStage=(t,n)=>t.id==='hb-boatyard'&&n>=STAGES&&stageOf(state,'hb-departure')>=STAGES?'launched':Math.max(1,n);
// Build 49a: Chapter 4's 21 separate stage sprites live in coast/answering-light (tools/headland-art.py).
const artDir=a=>a.startsWith('hb-')?'hidden-harbour/':a.startsWith('ch4-')?'answering-light/':a.startsWith('ch5-')?'lowwater-passage/':a.startsWith('ch6-')?'keepers-promise/':'';
const stageArt=(t,n)=>`<img class="art" src="assets/premium/coast/${artDir(t.art)}place-${t.art}-${artStage(t,n)}.webp" alt="" draggable="false" loading="lazy">`;
// Build 47f: the Vault door is drawn as itself (a crop of the Home picture's door) with its rings lit
// for the stage, not as a part's icon; painted ring states do not exist (see the doc's missing art).
const doorArt=n=>`<span class="doorThumb" data-stage="${n}"><img class="art" src="assets/premium/coast/vault-door-thumb.webp" alt="" draggable="false"><i></i><i></i><i></i></span>`;
const placeArt=(t,n)=>t.id==='vault-door'?doorArt(n):t.art?stageArt(t,n):iconArt(t.icon);
// Beach places drawn from the user's painted sheet (Build 41n): every stage shares one canvas with
// its ground at 90 % down the middle, so the picture stands on its spot; TOP is how far down the
// canvas each stage's top is (markers float just above it).
// Build 47f: the Observatory's cut-outs are not stood on its picture, which already paints every one
// of its furnishings; there a place's restoration shows as its colour coming back (sceneHtml).
const ANCHORED=new Set(['path','tent','mast','workshop','pier','beacon','cliff']);
const TOP={'path-1':.33,'path-2':.32,'path-3':.16,'tent-1':.19,'tent-2':.17,'tent-3':.13,'mast-1':.22,'mast-2':.17,'mast-3':.1,'workshop-1':.19,'workshop-2':.18,'workshop-3':.18,'pier-1':.29,'pier-2':.12,'pier-3':.19,'beacon-1':.19,'beacon-2':.16,'beacon-3':.13,'cliff-1':.23,'cliff-2':.14,'cliff-3':.12};
// A marker sits beside a standing place, at its right shoulder (its left one near the right edge), so it never covers it; on an
// empty spot it marks the spot.
function markerAt(t){
 const n=stageOf(state,t.id),top=ANCHORED.has(t.art)&&n?TOP[t.art+'-'+n]:null,[x,y]=t.at;
 if(top==null)return `left:${Math.min(88,Math.max(12,x))}%;top:${Math.max(24,y)}%`;
 return `left:${x>75?`calc(${x}% - .4 * var(--ps${n}))`:`min(92%,calc(${x}% + .4 * var(--ps${n})))`};top:max(10%,calc(${y}% - ${((.9-top)*.55).toFixed(2)} * var(--ps${n})))`;
}
const placeIcons=list=>list.map(t=>{const n=stageOf(state,t.id);return `<span class="restoredIcon stage${n} ${t.art?'staged':''} ${ANCHORED.has(t.art)?'anchored':''}" data-task="${t.id}" data-stage="${n}" style="left:${t.at[0]}%;top:${t.at[1]}%">${placeArt(t,n)}${pips(n)}</span>`;}).join('');
// Worksite icons are Coast Camp parts ('rope-2') and generators ('source-rope'), drawn by draw().
const iconArt=k=>{if(k==='workshop')return '<img class="art" src="assets/premium/workshop-operational.webp" alt="">';if(ICONS[k])return art(ICONS[k]);const g=k.match(/^source-(\w+)$/),p=k.match(/^(\w+)-(\d)$/);return draw(g?{type:'source',id:g[1]}:item(p[1],+p[2]));};
// A part a Tide token can turn into one an order wants.
const swappable=x=>state.orders.some(o=>missingOf(state,o).some(r=>r.tier===x.tier&&r.family!==x.family));
// What a Tide token can turn a board part into now: missing order parts with a part of their level, of
// another kind, on the board.
const tokenOptions=()=>state.orders.flatMap(o=>missingOf(state,o)).filter(r=>state.board.some(y=>y?.type==='item'&&y.tier===r.tier&&y.family!==r.family));
// What each generator level does (v5/kits.mjs levelLift), said when it is reached.
const LEVEL_GAIN={2:'Every third part comes out one tier higher.',3:'Every second part comes out one tier higher.',4:'Every part comes out one tier higher.',5:'Top level: every part one tier higher, every third two tiers.'};

// ---------- rendering ----------
function render(){
 const area=currentArea(state),total=area.tasks.length*STAGES;
 $('#areaBrand').textContent=area.name.toUpperCase();
 // Build 41i: the area's own picture, blurred, behind the board screen.
 // Build 45: the board screen stands on one bright coastal picture (coastal.css); each area's own
 // picture is shown where it belongs, on the restoration strip and the coast screen.
 energyHud();
 $('#coins').textContent=state.coins;
 const lv=state.level;$('#levelNum').textContent=lv.level;$('#levelPill').style.setProperty('--p',Math.round(100*lv.xp/xpToNext(lv.level))+'%');{const nx=nextUnlock(lv.level);$('#levelPill').setAttribute('aria-label',`Level ${lv.level}, ${lv.xp} of ${xpToNext(lv.level)} XP`+(nx?`. Level ${nx.level} opens ${nx.name}`:''));$('#levelPill').title=nx?`Level ${nx.level}: ${nx.name}`:'Every level-path unlock is open';}
 const ready=upgrades(state).some(u=>u.materials&&state.coins>=u.cost);if(!(holdPlace>performance.now()))$('#mapReady').hidden=!ready;
 // The beach and its upgrades live on their own screen (user, 2026-10-22: "ene zaaval boardtai
 // neg delgetsend tsug baimaargui"); the board screen keeps only the BEACH button, whose dot
 // shows when an upgrade is affordable, and the coin count.
 renderOrders();renderBoard();renderShed();renderSelection();renderHint();renderNextPlace();
 $('#dailyButton').hidden=!giftReady();
 $('#adEnergyButton').hidden=!ADS||!adReady||coachActive(state)||!(state.energy<5&&shopLeft(state,'adEnergy',today())>0);
 if(!$('#adEnergyButton').hidden&&!adOffered)playlog.event('adOffer',{id:'adEnergy'});adOffered=!$('#adEnergyButton').hidden;
 {const n=bookReady(state).length+BOOK_CHAINS.filter(f=>pageReady(state,f)).length;$('#bookCount').hidden=!n;$('#bookCount').textContent=n;$('#bookButton').classList.toggle('ready',n>0);}
 calmBadges();
 $('#rationButton').hidden=state.energy>3;
 const wait=rationWait(state,Date.now());$('#rationButton').textContent=wait>0?`Field ration in ${clock(wait)}`:'Field ration · +8 ϟ';$('#rationButton').disabled=wait>0;
 $('#soundButton').textContent=sounds.enabled()?'Sound on':'Sound off';
 $('#hapticsButton').hidden=!haptics.supported;$('#hapticsButton').textContent=haptics.enabled()?'Vibration on':'Vibration off';
}
// Orders (Build 44): each card says who asks (a crew member, or for the gold order the place
// and stage its materials are for), the parts with their counts, the progress, the coins, and
// DELIVER when it is ready. Cards keep their lane: nothing moves under the finger when one
// becomes ready (they were sorted ready-first before).
// Painted crew faces (Build 45, supplied art) for the crew who have one; the others keep the drawn
// portrait until theirs is approved (Nara and Sela are prepared but not part of the game).
// The supplied Nara and Sela portraits are Neri's and Tamsin's faces (user, 2026-10-26: "Nara Sela-г
// Neri Tamsin-д ашигла"); the names and roles stay Neri and Tamsin.
const FACES={ivo:'crew-ivo',bram:'crew-bram',neri:'crew-nara',tamsin:'crew-sela'};
// Build 51a: Mara, the keeper (Chapter 6), has no approved portrait (the pack's notes): her lines show her
// name only, never another character's face. CREW (../crew.mjs) is shared with Classic V5 and left alone.
const GUESTS={mara:'Mara'},who$=w=>CREW[w]?.name??GUESTS[w]??w;
const face=who=>FACES[who]?`<img class="art face" src="assets/premium/coast/ui/${FACES[who]}.webp" alt="" draggable="false">`:GUESTS[who]?'':portrait(who);
function renderOrders(){
 const held=state.board[selected],heldKey=held?.type==='item'?held.family+held.tier:null;
 $('#requests').style.setProperty('--slots',state.orders.length);
 $('#requests').innerHTML=`<div class="requestShelf">${state.orders.map(o=>{
  const p=needsOf(state,o),ready=!!orderItems(state,o),who=CREW[o.who];
  const place=o.story&&AREAS[state.area]?.tasks.find(t=>t.id===o.story),stage=place?Math.min(STAGES,stageOf(state,place.id)+1):0;
  const got=p.reduce((n,r)=>n+r.have,0),want=p.reduce((n,r)=>n+r.count,0);
  const role=roleOf(o),why=place?null:purposeOf(o,role);
  const label=`${place?`Gold order: the materials for ${place.stages[stage-1].name} (${place.name}, stage ${stage}). `:`${who.name} the ${who.role}${why?`, ${why.short}`:''}: `}${p.map(r=>r.count+' '+nameOf(item(r.family,r.tier))+(r.sibling?` (level ${levelOf(r)})`:'')).join(', ')}. ${ready?'Ready: tap to deliver.':`${got} of ${want} parts on the board.`} Reward ${o.coins} coins`;
  // Build 45 (coastal board design): a painted face where the crew member has one, the name, a
  // kind tag only for the gold order's stage, the parts with have/need
  // (✓ and green when there are enough), and the coins or, when ready, the one Deliver button.
  const tag=place?`<i class="reqTag gold">Stage ${stage}</i>`:'';
  // the gold order is named as such (a place's name does not fit a card; the strip and the label carry it)
  const head=place?`<span class="reqFace place">${placeArt(place,stage)}</span><span class="reqName"><b>Gold order</b>${tag}</span>`
   :`<span class="reqFace">${face(o.who)}</span><span class="reqName"><b>${who.name}</b>${tag}</span>`;
  // A crew order taking long (Audit 2026-10-25) suggests a new one; the tapped card's panel has it.
  const stuck=isStuck(state,o);
  return `<button class="requestCard ${ready?'ready':''} ${place?'storyOrder':''} ${stuck?'stuck':''} ${focusOrder===o.id?'active':''}" data-order="${o.id}" data-role="${role}" aria-label="${label}${stuck?'. Taking long: tap it for a new order.':''}"><span class="reqHead">${head}</span>${stuck?'<i class="reqStuck" aria-hidden="true">↻ New?</i>':''}<span class="requestItems">${p.map(r=>`<span class="${r.have>=r.count?'met':''} ${heldKey===r.family+r.tier?'held':''}" data-part="${r.family+r.tier}">${draw(item(r.family,r.tier))}${r.sibling?`<i class="reqLv" aria-hidden="true">Lv${levelOf(r)}</i>`:''}<b>${r.have>=r.count?'<i aria-hidden="true">✓</i>':''}${r.have}/${r.count}</b></span>`).join('')}</span><span class="reqFoot">${ready?`<strong class="reqDeliver">Deliver <em>+${o.coins}</em>${COIN}</strong>`:`<span class="requestReward">${COIN}${o.coins}</span>`}${bonusArt(o)}</span></button>`;
 }).join('')}</div>`;
 renderOrderTools();
}
// A tapped order explains where its missing parts come from (the generator, then the real chain up to
// the part wanted, nothing invented); one that is not ready can be changed (build 36): free ones first,
// then after an ad. Build 48b: "merge up N times" is gone (a chain's distance is not how many merges it
// takes): it says "merge matching items to reach …"; a part whose generator cannot make it yet says what
// opens it (routeWhy).
function routeWhy(r,gold=false){
 const gen=CHAINS[r.family].gen,name=SOURCES[gen].name,sec=CHAINS[r.family].secondary;
 if(!has(gen))return {ok:false,text:`${name} is still sealed in cargo on the board`};
 if(!sourceOpen(state,gen))return {ok:false,text:`${name} wakes in a later area`};
 if(sec&&!state.secOpen?.[gen])return {ok:false,text:`Opens when a ${name} reaches level ${SECONDARY_RULES[gen].level}`};
 const reach=r.tier?` · merge matching items to reach ${CHAINS[r.family].names[r.tier]}`:'';
 // Build 48c: on the gold order the guarantee is said as it is: counted in taps, not time
 if(sec&&gold&&goldChase(state,r.family))return {ok:true,text:`Tap a level ${SECONDARY_RULES[gen].level}+ ${name}: while this order waits, a ${CHAINS[r.family].names[0]} comes within every ${rareRule(state,gen).goldPity} taps${reach}`};
 return {ok:true,text:sec?`A rare extra from level ${SECONDARY_RULES[gen].level}+ ${name} taps${reach}`:`Tap ${name}${reach}`};
}
// brief (the gold panel, whose rows already say where each part comes from): an everyday chain is its
// pictures only; a rare or not-yet-open one keeps its words
function chainRoute(r,brief=false){
 const gen=CHAINS[r.family].gen,why=routeWhy(r),steps=Array.from({length:r.tier+1},(_,k)=>k),words=!brief||!why.ok||CHAINS[r.family].secondary;
 return `<li class="route ${why.ok?'':'sealed'}" aria-label="${CHAINS[r.family].names[r.tier]}: ${why.text}"><span class="routeGen">${draw({type:'source',id:gen})}</span>${steps.map(k=>`<i class="routeArrow" aria-hidden="true"></i><span class="routeStep ${k===r.tier?'goal':''}" title="${CHAINS[r.family].names[k]}">${draw(item(r.family,k))}</span>`).join('')}${words?`<small>${why.text}</small>`:''}</li>`;
}
// Build 48b: the gold order's panel is compact: the stage, each material with what is held of it, where
// it comes from (or what opens it), the build cost against the coins held, and a button that shows the
// generator on the board. The full chains are behind "How to make these".
// Build 51d (user: "ene tailbar arai urt ih uu"): an everyday part says only "From Rivet Rover" (the button
// beside it shows the generator) and its chain under "How to make these" is pictures only, so the panel no
// longer says the same sentence twice per part. A rare or not-yet-open part keeps its words.
function goldPanel(o){
 const t=TASKS[o.story],u=upgrades(state).find(v=>v.id===o.story),st=t.stages[Math.min(STAGES,stageOf(state,t.id)+1)-1],cost=u?.cost??st.cost;
 // Build 51d (user: "tom zai ezelsen heveeree l bainadaa"): one line for the place and the coins, the parts as
 // small chips side by side, and one button per generator (not per part). A rare or not-yet-open part keeps
 // its words on a chip of its own.
 const gens=[];
 const need=needsOf(state,o).map(r=>{const why=routeWhy(r,true),gen=CHAINS[r.family].gen,met=r.have>=r.count,plain=why.ok&&!CHAINS[r.family].secondary;
  if(!met&&why.ok&&!gens.includes(gen))gens.push(gen);
  const name=nameOf(item(r.family,r.tier));
  return `<li class="goldNeed ${met?'met':''} ${met||plain?'':'wide'}" aria-label="${name} ${r.have} of ${r.count}${met?', on the board':plain?`, from ${SOURCES[gen].name}`:`: ${why.text}`}"><span class="goldIcon">${draw(item(r.family,r.tier))}</span><span class="goldText"><b>${name} <em>${r.have}/${r.count}</em></b>${met||plain?'':`<small>${why.text}</small>`}</span></li>`;}).join('');
 const short=Math.max(0,cost-state.coins);
 const where=LABELS[t.id]?LABELS[t.id][0].toUpperCase()+LABELS[t.id].slice(1):AREAS.find(a=>a.id===t.area)?.name??t.name;
 const coins=short?`${COIN}${state.coins} of ${cost}: <b>${short} more</b> from crew orders`:`${COIN}${cost} to build: <b>you have it</b>`;
 const find=gens.map(gen=>`<button class="locate" type="button" data-locate="${gen}" aria-label="Show the ${SOURCES[gen].name}">${draw({type:'source',id:gen})}</button>`).join('');
 return `<p class="orderSay goldSay"><b>${st.name}</b><small>${where} · ${coins}</small></p><div class="goldRow"><ul class="goldNeeds">${need}</ul>${find?`<span class="goldFind">${find}</span>`:''}</div><details class="goldHow"><summary>How to make these</summary><ol class="routes">${missingOf(state,o).map(r=>chainRoute(r,true)).join('')}</ol></details>`;
}
// Build 57y (owner, real iPhone, 2026-11-11): on a phone the tapped order's panel is a bottom sheet behind a
// Details button in the guidance line, not a panel between the orders and the board; the tapped order's
// parts are still marked on the board, and closing the sheet keeps the order tapped. On a larger screen the
// panel stays where it was (coastal.css). The panel's buttons and their handlers are the same.
let detailsOpen=false;
const SHEET_CLOSE='<button type="button" class="sheetClose" data-sheet-close aria-label="Close the details">×</button>';
function syncSheet(){
 const bar=$('#orderTools'),btn=$('#orderDetails'),open=detailsOpen&&!bar.hidden;
 if(!open)detailsOpen=false;
 btn.hidden=bar.hidden;btn.setAttribute('aria-expanded',String(open));
 bar.classList.toggle('sheetOpen',open);$('#sheetBackdrop').hidden=!open;
}
function setDetails(open){detailsOpen=open;syncSheet();if(open)$('#orderTools .sheetClose')?.focus({preventScroll:true});}
function renderOrderTools(){
 const o=state.orders.find(o=>o.id===focusOrder),bar=$('#orderTools');
 if(!o||orderItems(state,o)){bar.hidden=true;bar.innerHTML='';syncSheet();return;}
 const day=today(),free=swapsLeft(state,day),ads=adSwapsLeft(state,day),missing=missingOf(state,o);
 bar.hidden=false;
 if(o.story){bar.innerHTML=SHEET_CLOSE+goldPanel(o);syncSheet();return;}
 const swap=`<span class="toolNote">Stuck on ${CREW[o.who].name}'s order?</span>`+(free>0?`<button data-swap>↻ New order <small>${free} free today</small></button>`:ADS&&ads>0?'<button class="adOffer" data-swap-ad>▶ New order</button>':'<button disabled>No more changes today</button>');
 // What the order is for and where its coins go (Build 44): the crew member's reason, and the
 // next stage the coins count toward (the gold order instead brings that stage's materials).
 const role=roleOf(o),why=purposeOf(o,role),n=nextPlace(),kind={quick:'Quick job',pair:'Two-part job'}[role];
 const t=o.story&&TASKS[o.story],st=t&&t.stages[Math.min(STAGES,stageOf(state,t.id)+1)-1];
 const say=o.story?`<p class="orderSay"><b>${t.name} · materials</b>Delivering this brings the materials for <em>${st.name}</em>; then it can be built for ${st.cost} coins.</p>`
  :`<p class="orderSay"><b>${kind} · ${CREW[o.who].name}</b>“${why?.line??'Parts for the camp.'}”</p>`;
 // Three lines (Audit 2026-10-25, user: "ene yu ve"): why, what it pays and where the coins go,
 // how to make the parts; the bonus sums and the "100/100" progress (it read as done) are gone.
 const pays=!o.story&&n&&!n.ready?`<p class="orderPays">${COIN} +${o.coins} → <b>${n.u.name}</b></p>`:'';
 bar.innerHTML=`${SHEET_CLOSE}${say}${pays}<ol class="routes" aria-label="Where the parts come from">${missing.map(chainRoute).join('')}</ol><div class="toolRow">${swap}</div>`;
 syncSheet();
}
// Build 48b: "show the generator" from the gold order's panel: its best copy glows for a moment (a
// still outline with reduced motion).
let locateGen=null,locateUntil=0;
const locateIndex=()=>{if(!locateGen||performance.now()>locateUntil)return -1;return state.board.reduce((b,x,i)=>x?.type==='source'&&x.id===locateGen&&(b<0||producerLevel(x)>producerLevel(state.board[b]))?i:b,-1);};
function renderBoard(){
 const sel=state.board[selected],focus=state.orders.find(o=>o.id===focusOrder),located=locateIndex();
 const focusKeys=new Set(focus?.needs.map(r=>r.family+r.tier)??[]),focusMissing=focus?missingOf(state,focus):[];
 // The tapped order's generators glow too (Build 41 M3, from PR #77).
 const focusGens=new Set(focusMissing.map(r=>CHAINS[r.family].gen));
 board.innerHTML=state.board.map((x,i)=>{
  const [r,c]=cellPos(i),locked=x?.type==='source'&&!sourceOpen(state,x.id);
  const twin=sel&&i!==selected&&(sel.type==='item'&&(x?.type==='item'&&matches(x,sel)&&sel.tier<maxTier(sel.family)||x?.type==='cargo'&&reachable(state,i)&&matches(sel,x.key))||sel.type==='kit'&&kitsMerge(sel,x)||generatorsMerge(sel,x)||sel.type==='cog'&&x?.type==='source'&&producerLevel(x)<MAX_GENERATOR_LEVEL||sel.type==='token'&&x?.type==='item'&&swappable(x)||sel.type==='cargo'&&matches(x,sel.key));
  const focused=x?.type==='item'&&focusKeys.has(x.family+x.tier);
  // Build 44: only what a cell needs stays on it, inside the cell (a level, a crate's parts
  // left, a jar's energy, a small gleam on cargo with something special inside). What a thing
  // is and what is in it is told by the panel under the board when it is tapped.
  let badge='';
  // Build 45g: an open generator carries a small ϟ (it spends energy when tapped) and its level.
  if(x?.type==='source')badge=locked?`<span class="lockedLabel">NEXT AREA</span>`:`<span class="genMark" aria-hidden="true">${BOLT}</span>`+(producerLevel(x)>1?`<span class="srcLevel">Lv${producerLevel(x)}</span>`:'');
  else if(x?.type==='kit')badge=`<span class="pulls">${x.left}</span>`;
  else if(x?.type==='jar')badge=`<span class="sealBadge">+${x.energy}ϟ</span>`;
  else if(x?.type==='cargo'&&(x.find?.type==='source'||x.find?.type==='cog'||x.find?.type==='token'))badge=`<span class="cargoGleam ${x.find.type!=='source'?'cogGleam':''}" aria-hidden="true"></span>`;
  const deep=x?.type==='cargo'&&!reachable(state,i),ready=x?.type==='cargo'&&!deep&&state.board.some(y=>matches(y,x.key));
  // Build 45g: cargo shows the part that opens it only when that matters now (the part is on the
  // board, the cargo or its key is selected); the tapped order also marks cargo holding a
  // generator it still needs. The panel under the board tells the rest.
  const holdsGen=x?.type==='cargo'&&x.find?.type==='source'&&focusGens.has(x.find.id);
  const ice=x?.type==='glass'?`ice${Math.min(2,x.cracks??0)}`:'';
  return `<button class="tile ${x?.type??'empty'} ${i===located?'located':''} ${ice} ${x?.cracks?'cracked':''} ${ready?'keyReady':''} ${deep?'deep':''} ${locked?'locked':''} ${selected===i?'selected':''} ${twin?'match':''} ${focused?'nextAction':''} ${x?.type==='source'&&focusGens.has(x.id)||holdsGen?'orderSource':''} ${(r+c)%2?'odd':''}" data-index="${i}" style="grid-row:${r+1};grid-column:${c+1}" ${x?.family||x?.id?`data-family="${x.family??x.id}"`:''} ${x?.type==='cargo'?`data-key="${x.key.family}"`:''} aria-label="${nameOf(x)}${x?.type==='glass'?` · ${GLASS_HITS-(x.cracks??0)} hit${GLASS_HITS-(x.cracks??0)>1?'s':''} left`:''}${iceNeed(x)?` · cracked by a level ${iceNeed(x)} or better merge beside it`:''}${locked?' · locked':''}${x?.type==='source'&&!locked?' · tap to make a part for 1 energy':''}. Space ${i+1}" aria-pressed="${selected===i}">${draw(deep?{...x,deep:true}:x)}${badge}</button>`;
 }).join('');
 // The free-space count shows only when space is getting short.
 // Build 47a: rewards waiting for space say so here until they land.
 const free=state.board.filter(x=>x===null).length,f=$('#free'),wait=state.pending?.length??0;
 f.textContent=wait?`${wait} reward${wait>1?'s':''} waiting · make a space`:!free?'Board full':free+(free===1?' space left':' spaces left');f.hidden=free>3&&!wait;f.classList.toggle('out',!free||wait>0);
}
// The shed (build 32; Build 44: folded by default): one row with how full it is; a tap on the
// row, a drag over it or the Shed button opens its four spaces. A drag dropped on the folded row
// goes to the first empty space.
let shedOpen=false;
function renderShed(){
 const n=state.shed.filter(Boolean).length,el=$('#shed');
 el.hidden=false;el.classList.toggle('open',shedOpen);
 el.innerHTML=`<button class="shedToggle" type="button" data-shed-toggle aria-expanded="${shedOpen}" aria-label="Shed: ${n} of ${SHED_SLOTS} spaces used. ${shedOpen?'Fold':'Open'} the shed"><span class="shedLabel">Shed</span><b>${n}/${SHED_SLOTS}</b><span class="shedPeek" aria-hidden="true">${state.shed.map(x=>`<i class="${x?'full':''}">${x?draw(x):''}</i>`).join('')}</span><i class="shedChevron" aria-hidden="true"></i></button>`
  +`<div class="shedSlots">${state.shed.map((x,k)=>`<button class="shedSlot ${x?'full':''}" data-slot="${k}" aria-label="${x?nameOf(x)+' · tap to put it back on the board':'Empty shed space'}">${x?draw(x):''}</button>`).join('')}</div>`;
}
// The next place (Build 44): a compact preview of the coast's next stage beside the guidance.
// It says "Ready" only when the materials are in and the coins are there.
function nextPlace(){
 // One goal at a time (Audit 2026-10-25): a stage ready to build, else (build 48b) a stage whose
 // materials are secured and waits for coins (the next gold order is already up for the stage after,
 // so the strip kept saying "3 parts missing" right after a delivery), else the stage the live gold
 // order is for (so the strip and the gold card name the same place), else as before.
 const ups=upgrades(state),gold=state.orders.find(o=>o?.story)?.story;
 const u=ups.find(canBuild)??ups.find(u=>u.materials)??ups.find(u=>u.id===gold)??storyTarget(state)??ups[0];
 if(!u)return null;const t=TASKS[u.id];return {u,t,ready:canBuild(u)};
}
// The restoration strip (Build 45): the board's one way to the coast. It shows the place the next
// stage is for (its own picture), says "Ready to build" only when materials and coins are both in,
// and otherwise the real next objective and what it still needs. Tapping it opens the coast on that
// place; it never spends anything (the build is confirmed there). While a delivery's coins are in
// the air it keeps its old state, and changes as they land.
let holdPlace=0;
function renderNextPlace(){
 if(holdPlace>performance.now())return;
 const el=$('#mapButton'),n=nextPlace(),area=currentArea(state);
 if(!n){el.dataset.place='';el.dataset.ready='0';el.classList.remove('ready');
  el.querySelector('.rsThumb').innerHTML=`<img class="art" src="assets/premium/${area.picture}-vibrant.webp" alt="">`;
  // After the last stage (Audit 2026-10-25: coins had no use) the strip says the chapter is done
  // and the coins crew orders keep paying are saved (Build 47f: no area is promised; none is open).
  if(allDone(state)){el.querySelector('.rsText b').textContent='Chapter complete';el.querySelector('.rsText small').innerHTML=`${COIN}${state.coins} saved`;}
  else{el.querySelector('.rsText b').textContent=area.name;el.querySelector('.rsText small').textContent=areaDone(state)?'Every place is restored':'The next stages open as you build';}
  el.querySelector('.rsAction').textContent='View';el.setAttribute('aria-label',`Go to the ${area.name}`);return;}
 const {u,t,ready}=n,was=el.dataset.ready==='1';
 el.dataset.place=u.id;el.dataset.ready=ready?'1':'0';el.classList.toggle('ready',ready);
 el.querySelector('.rsThumb').innerHTML=placeArt(t,u.stage);
 el.querySelector('.rsText b').textContent=ready?'Ready to build':u.name;
 el.querySelector('.rsText small').innerHTML=ready?`${u.name} · ${COIN}${u.cost}`:`<i class="rsMat ${u.materials?'ok':''}" aria-hidden="true">${u.materials?'✓':'◆'}</i>${u.materials?'Materials':(g=>!g?'Gold order':g.parts?`${g.parts} part${g.parts>1?'s':''} missing`:'Deliver gold order')(goldShort(u.id))} · ${u.materials&&state.coins<u.cost?`${u.cost-state.coins} more ${COIN}`:`${COIN}${Math.min(state.coins,u.cost)}/${u.cost}`}`;
 el.querySelector('.rsAction').textContent=ready?'Build':'View';
 el.setAttribute('aria-label',`${u.name} (${t.name}, stage ${u.stage}): ${ready?`ready to build for ${u.cost} coins. Open the ${area.name} to build it`:`${u.materials?'materials in':(g=>g?.parts?`gold order missing ${missText(g.miss)}`:'needs its gold order')(goldShort(u.id))}, ${Math.min(state.coins,u.cost)} of ${u.cost} coins. Open the ${area.name}`}`);
 if(ready&&!was&&el.dataset.seen==='1'&&!reduced()){el.classList.remove('justReady');void el.offsetWidth;el.classList.add('justReady');}
 el.dataset.seen='1';
}
function renderSelection(){
 const x=state.board[selected];let title='',desc='',buttons='';
 if(!x){$('#selection').innerHTML='';return;}
 title=nameOf(x);
 if(x.type==='item'){
  title+=` <span class="lvTag">Lv${x.tier+1}</span>`;
  // a secondary part says where it comes from first: the panel shows two lines until it is tapped
  desc=CHAINS[x.family].secondary?sourceNote(x.family)+' '+(x.tier<maxTier(x.family)?`Merge with a twin → ${CHAINS[x.family].names[x.tier+1]}.`:'Top of its chain: a keepsake for the book.')
   :x.tier<maxTier(x.family)?`Merge with a twin → ${CHAINS[x.family].names[x.tier+1]}. Made by ${SOURCES[CHAINS[x.family].gen].name}.`:'Top of its chain.';
  const wants=state.orders.filter(o=>o.needs.some(r=>matches(x,r)));
  const who=[...new Set(wants.map(o=>o.story?'The gold order':CREW[o.who].name))];
  if(who.length)desc=`★ ${who.join(' and ')} ${who.length>1?'need':'needs'} this. `+desc;
  // Build 48b: a rare part the gold order's materials take, as it is or merged up, says for which place
  {const gold=state.orders.find(o=>o?.story),r=gold&&CHAINS[x.family].secondary?gold.needs.find(q=>q.family===x.family&&q.tier>=x.tier):null;
   if(r){const place=LABELS[gold.story]??TASKS[gold.story].stages[Math.min(STAGES,stageOf(state,gold.story)+1)-1].name;desc=`Needed for ${place}${r.tier>x.tier?`: merge matching items to reach ${CHAINS[r.family].names[r.tier]}`:''}. `+desc;}}
  // Build 51d (user, 2026-11-02: "itemaa butsaaj burn hiideg songolt heregtei baina"): every loose part can
  // be cleared, not only on a nearly full board (Build 41 M4). Build 52A: what it gives back is game.mjs
  // clearRefund (+1 energy for an everyday part of Level 4+, else none); the button says so only when it does.
  // A part an order wants, a merged part or a rare part asks for a second tap.
  {const rare=!!CHAINS[x.family].secondary,careful=rare||x.tier>=1||who.length>0,nearlyFull=state.board.filter(y=>y===null).length<=2,back=clearRefund(x);
   buttons=`<button data-action="recycle"${careful?' data-confirm="1"':''}>${nearlyFull&&!rare?'Clear space':'Clear'}${back?` · +${back} ϟ`:''}</button>`;}
 }else if(x.type==='source'){
  const chain=CHAINS[GENERATOR_CHAINS[x.id][0][0]];
  const next=nextKind(x.id),waiting=next&&!state.board.some(y=>y?.type==='source'&&y.id===next);
  const extra=SECONDARY_OF[x.id]?CHAINS[SECONDARY_OF[x.id]].names[0]:null,extraLine=!extra?'':secondarySource(state,selected)?` Rare extras: sometimes a ${extra} as well.`:producerLevel(x)<SECONDARY_RULES[x.id].level?` At level ${SECONDARY_RULES[x.id].level} it also makes rare ${extra}s.`:'';
  desc=(waiting?`Level ${UNLOCK_LEVEL} brings out the ${SOURCES[next].name}. `:'')+(sourceOpen(state,x.id)?`Level ${producerLevel(x)} · 1 energy a tap · ${chain.names.slice(0,4).join(' → ')} …`+(producerLevel(x)<MAX_GENERATOR_LEVEL?` Merge it with another level-${producerLevel(x)} ${SOURCES[x.id].name} (drag one onto the other) for level ${producerLevel(x)+1}.`:' Top level.')+extraLine:'Wakes at the Survey Worksite (next area).');
  if(sourceOpen(state,x.id)){
   // What the next tap really makes: the engine's own produce on a copy of the state.
   const trial=structuredClone(state),r=act(trial,{type:'produce',id:x.id,index:selected},Date.now()),made=r.ok?trial.board[r.index]:null;
   const empty=state.energy<1,full=!state.board.includes(null);
   const block=empty?`No energy · +1 in ${clock(refillTimes(state,Date.now())?.next??0)}`:full?'Board full':r.ok?'':r.message;
   desc=(made?`Next tap: ${nameOf(made)} (Lv${made.tier+1}). `:empty?'Each part costs 1 energy; energy refills over time. ':full?'Merge, deliver or shed a part to make room. ':'')+desc;
   buttons=block?`<button class="accent" data-action="produce" disabled aria-disabled="true">Make · 1 ϟ</button><span class="blockWhy">${block}</span>`:`<button class="accent" data-action="produce">Make · 1 ϟ</button>`;
  }
 }else if(x.type==='kit'){
  // Build 52A: what the crate holds, in displayed levels (CRATE_DROPS: internal tier + 1)
  const lv=size=>{const t=CRATE_DROPS[size].filter(d=>d!=='rare');return `Lv${Math.min(...t)+1}-${Math.max(...t)+1}`;},rareEnd=x.size===3&&SECONDARY_OF[x.family]&&state.secOpen?.[x.family];
  desc=`Tap for a free ${lv(x.size)} part (${chainsOf(state,x.family).map(c=>CHAINS[c].names[0]).join(' or ')} chain)${rareEnd?', the last a rare part':''} · ${x.left} of ${kitCapacity(x)} left.`+(kitFull(x)&&x.size<MAX_KIT_SIZE?` Or merge with a twin into a ${CRATES[x.size]} (${KIT_DROPS[x.size+1].length} ${lv(x.size+1)} parts).`:'');
  buttons='<button class="accent" data-action="openKit">Take a part</button>';
} else if(x.type==='glass'){const n=CHAINS[x.family].names,left=GLASS_HITS-(x.cracks??0);title=(x.cracks?'Cracked tideglass':'Tideglass')+` <span class="hits" aria-label="${left} of ${GLASS_HITS} hits left">${Array.from({length:GLASS_HITS},(_,k)=>`<i class="${k<left?'on':''}"></i>`).join('')}</span>`;desc=`${left} hit${left>1?'s':''} left. A ${n[x.tier]} locked in tideglass. It takes no part: a merge in a space beside it that makes a ${n[x.tier]} or better (any chain) cracks it; ${GLASS_HITS} cracks break it and the ${n[x.tier]} is yours.`+(x.cracks?` ${GLASS_HITS-x.cracks} more merge${GLASS_HITS-x.cracks>1?'s':''} beside it.`:'');
 } else if(x.type==='cargo'&&!reachable(state,selected)){title='Sealed cargo';desc='Buried deeper in the cargo. Open the crates around it first, and this one will show the part that opens it.'+(x.find?.type==='source'?' Something glows inside.':['cog','token'].includes(x.find?.type)?' Something gleams inside.':'');
 }else if(x.type==='cargo'){const k=CHAINS[x.key.family].names[x.key.tier],have=state.board.some(y=>matches(y,x.key)),gen=CHAINS[x.key.family].gen;
  title='Sealed cargo';desc=`Opens with a ${k}: lay one on it. What is inside is a surprise`+(x.find?.type==='source'?' — something glows in there.':['cog','token'].includes(x.find?.type)?' — something gleams in there.':'.')+(have?' You have one: drag it onto this cargo.':sourceOpen(state,gen)?` ${SOURCES[gen].name} makes them.`:` Its generator is still sealed somewhere on the board.`);}
 else if(x.type==='jar')desc='Energy, sealed in a jar.';
 // Build 46l (user: "zarim item deer ajillahgui baina"): the token works only on a part of a level some
 // order is still missing in another kind; the panel says which levels work now, or that none does.
 else if(x.type==='token'){const opts=tokenOptions();
  desc=opts.length?`Drag it onto a glowing ${[...new Set(opts.map(r=>'Lv'+(r.tier+1)))].join(' or ')} part: it becomes ${opts.slice(0,2).map(r=>'a '+nameOf(item(r.family,r.tier))).join(' or ')} for an order.`
   :'Turns a part into the same level of another kind that an order still needs. No order needs a swap right now: keep it (or put it in the shed) for later.';}
 else if(x.type==='cog')desc=`Drag it onto a generator: +1 level, up to ${MAX_GENERATOR_LEVEL}. Higher levels make better parts.`;
 if(SHED_TYPES_UI.includes(x.type))buttons+='<button data-action="store">Shed</button>';
 $('#selection').innerHTML=`<span class="preview">${draw(x)}</span><span class="copy"><b>${title}</b><small>${desc}</small></span><span class="actionGroup">${buttons}</span>`;
}
const SHED_TYPES_UI=['item','kit','cog','token'];
const canBuild=u=>u.materials&&state.coins>=u.cost;
const has=id=>state.board.some(x=>x?.type==='source'&&x.id===id);
// The one primary action (Build 41 M3, from PR #77's contextual objective): what to do next,
// and tapping it does it or shows where.
let guide=null;
// Build 51c: the first-player guide (coach.mjs) and later one-time tips speak through this same line:
// one short sentence, one highlighted target (a pulse; a drag demonstration for a pair; still with
// reduced motion). Nothing is blocked: every other control works as before.
let coach=null,coachNote=null;
function clearCoach(){for(const el of document.querySelectorAll('.coachTarget,.coachFrom,.coachTo'))el.classList.remove('coachTarget','coachFrom','coachTo');coachHand(null);}
// Build 51d (user, 2026-11-02: "guide hesgiig sain tod bolgomoor baina yag end touch hii geed"): a pointing
// hand and a short label on the guide's target ("Tap here", "Drag onto its twin"). It never takes a tap
// (pointer-events: none), it sits under any dialog, and with reduced motion it stays still.
const HAND_SVG='<svg viewBox="0 0 48 56" aria-hidden="true"><path d="M20 4c-2.8 0-5 2.2-5 5v21l-3.2-3.1c-2-2-5.2-2-7.1 0-1.9 1.9-1.9 5 0 7l11.3 11.6c2.6 2.6 6 4.5 9.7 4.5h6.3c6.9 0 12-5.6 12-12.5V24c0-2.5-2-4.5-4.5-4.5-1 0-1.9.3-2.6.8-.6-2-2.4-3.3-4.4-3.3-1.2 0-2.3.4-3.1 1.1-.7-1.7-2.4-2.9-4.4-2.9-.9 0-1.7.2-2.4.6V9c0-2.8-2.2-5-5-5z"/></svg>';
let handFor=null,handLow=false;
// low: the fingertip on the target's bottom row (an order card's Deliver line), so the parts stay visible
function coachHand(el,label,drag,low=false){
 let h=document.getElementById('coachHand');
 if(!el){handFor=null;if(h)h.hidden=true;return;}
 if(!h){h=document.createElement('div');h.id='coachHand';h.setAttribute('aria-hidden','true');h.innerHTML=HAND_SVG+'<span class="handLabel"></span>';document.body.append(h);}
 handFor=el;handLow=low;h.querySelector('.handLabel').textContent=label;h.classList.toggle('drag',!!drag);
 h.style.setProperty('--dx',`${drag?.dx??0}px`);h.style.setProperty('--dy',`${drag?.dy??0}px`);placeHand();
}
function placeHand(){
 const h=document.getElementById('coachHand');if(!h)return;
 const r=handFor?.isConnected&&!homeOpen&&!document.querySelector('#story:not([hidden])')?handFor.getBoundingClientRect():null;
 if(!r?.width){h.hidden=true;return;}
 h.hidden=false;h.style.left=`${r.left+r.width/2}px`;h.style.top=`${handLow?r.bottom-14:r.top+r.height/2}px`;
 // the label stays on screen near the edges
 const l=h.querySelector('.handLabel'),w=l.offsetWidth,cx=r.left+r.width/2;h.style.setProperty('--lx',`${Math.max(8-cx+w/2,Math.min(0,innerWidth-8-cx-w/2))}px`);
}
addEventListener('resize',placeHand);addEventListener('scroll',placeHand,true);
function showCoachTarget(t){
 clearCoach();if(!t)return;
 if(t.kind==='cell'){const el=board.querySelector(`[data-index="${t.index}"]`);el?.classList.add('coachTarget');coachHand(el,'Tap here');}
 else if(t.kind==='pair'){const a=board.querySelector(`[data-index="${t.cells[0]}"]`),b=board.querySelector(`[data-index="${t.cells[1]}"]`);if(!a||!b)return;
  const ra=a.getBoundingClientRect(),rb=b.getBoundingClientRect(),dx=rb.left-ra.left,dy=rb.top-ra.top;a.style.setProperty('--dx',`${dx}px`);a.style.setProperty('--dy',`${dy}px`);a.classList.add('coachFrom');b.classList.add('coachTo');
  coachHand(a,'Drag onto its twin',{dx,dy});}
 else if(t.kind==='order'){const el=$(`[data-order="${t.id}"]`);el?.classList.add('coachTarget');coachHand(el,'Tap to deliver',null,true);}
 else if(t.kind==='strip'){const el=$('#mapButton');el?.classList.add('coachTarget');coachHand(el,'Tap to open the coast');}
 else if(t.kind==='coins')$('#coinPill')?.classList.add('coachTarget');
}
function renderCoach(){
 const on=coachActive(state);$('#coachSkip').hidden=!on;
 if(coachNote&&coachNote.until>performance.now())coach={id:'note',text:coachNote.text,target:coachNote.target};
 else{coachNote=null;coach=coachStep(state)??laterTip(state);}
 if(!coach){clearCoach();return false;}
 const b=$('#hint');b.textContent=coach.text;b.dataset.kind='coach';b.dataset.step=coach.id;
 requestAnimationFrame(()=>showCoachTarget(coach.target));
 return true;
}
function renderHint(){
 // While a delivery's coins fly, the guidance waits too (it may be about to say "Upgrade").
 if(holdPlace>performance.now())return;
 if(renderCoach())return;delete $('#hint').dataset.step;
 guide=primaryAction(state,focusOrder);let label=guide.label;
 if(guide.kind==='energy'){const t=refillTimes(state,Date.now());label+=' · +1 in '+clock(t?.next??0);}
 const b=$('#hint');b.textContent=label;b.dataset.kind=guide.kind;
 // The very first merge shows its pair without being asked.
 if(guide.kind==='merge'&&!state.merges)for(const i of guide.cells)board.querySelector(`[data-index="${i}"]`)?.classList.add('hintPair');
}
$('#hint').onclick=()=>{
 // a goal line (no highlight) still works like the normal hint line when tapped: its advice, on request
 if(coach&&coach.id!=='goal'){const t=coach.target;
  if(coach.id==='tap'&&t)run({type:'produce',id:state.board[t.index]?.id,index:t.index});
  else if((coach.id==='deliver'||coach.id==='gold')&&t)run({type:'deliver',id:t.id});
  else if(t?.kind==='strip'){mapFocus=nextPlace()?.u.id??null;showMap();}
  else if(t?.kind==='pair')$('#message').textContent='Drag the moving part onto the one it points at.';
  return;}
 const g=coach?.id==='goal'?coach.advice:guide;if(!g)return;
 if(g.kind==='deliver')run({type:'deliver',id:g.id});
 else if(g.kind==='upgrade'){mapFocus=g.id;showMap();}
 else if(g.kind==='tap'){selected=g.index;run({type:'produce',id:g.id,index:g.index});render();}
 else if(g.kind==='merge'||g.kind==='unseal'){for(const i of g.cells)board.querySelector(`[data-index="${i}"]`)?.classList.add('hintPair');$('#message').textContent=g.kind==='merge'?'Drag one of the two marked parts onto the other.':'Drag the marked part onto the marked crate.';}
 else if(g.kind==='space')$('#message').textContent='Deliver a ready order, merge two twins, or tap a part and choose Shed.';
 else if(g.kind==='energy')$('#message').textContent=`Energy refills +1 every 2 minutes up to ${capacityOf(state)} (your level's capacity). Merges, crates and deliveries cost nothing.`;
};
function header(){
 if(tick(state,Date.now())){persist();render();}
 energyHud();
}
// Energy pass (build 47v): the HUD shows energy over the player level's refill capacity. At the
// capacity the timer says FULL; above it (bonus energy, which the refill does not add to) it says
// the stored bonus amount; the denominator is labeled REFILL, e.g. 135/100.
function energyHud(){
 const cap=capacityOf(state),bonus=Math.max(0,state.energy-cap),over=bonus>0,t=refillTimes(state,Date.now());
 $('#energy').innerHTML=`${state.energy}<span class="energyCap">/${cap}</span>`;
 $('#energyTimer').textContent=t?'+1 '+clock(t.next):over?`+${bonus} BONUS`:'REFILL FULL';
 $('#energyPill').classList.toggle('overCap',over);
 $('#energyPill').style.setProperty('--g',t?(1-t.next/REFILL_EVERY).toFixed(3):1);
 $('#energyPill').setAttribute('aria-label',`${state.energy} energy available. Natural refill capacity ${cap}. ${bonus} bonus energy stored. Storage limit ${STORE_ENERGY}. Open energy recovery options.`);
 $('#energyPill').title=`Energy ${state.energy} of ${cap}: +1 every 2 minutes up to ${cap} (level ${state.level.level})`+(over?`. Bonus energy above ${cap} is kept; the refill waits until you are below it.`:'')+(state.energyOwed?` ${state.energyOwed} more waits for room (you can hold ${STORE_ENERGY}).`:'');
}

// ---------- actions ----------
function run(a,{adCompletion=false}={}){
 if(adBusy&&!adCompletion)return;
 receipts.apply(state);
 const coachBefore=coachActive(state)?coachStep(state):null;
 const before={coins:state.coins,energy:state.energy},fromRect=a.type==='produce'?board.querySelector(`[data-index="${a.index??state.board.findIndex(x=>x?.type==='source'&&x.id===a.id)}"]`)?.getBoundingClientRect():a.type==='openKit'?board.querySelector(`[data-index="${a.index}"]`)?.getBoundingClientRect():null;
 const orderRect=a.type==='deliver'?$(`[data-order="${a.id}"]`)?.getBoundingClientRect():null;
 // Build 44: what a delivery takes, and where from, is noted before the board changes, so the
 // parts can be seen leaving for the order (presentation only: the rules settle at once).
 const order=a.type==='deliver'?state.orders.find(o=>o.id===a.id):null,taking=order?(orderItems(state,order)??[]).map(i=>({x:state.board[i],rect:board.querySelector(`[data-index="${i}"]`)?.getBoundingClientRect()})):[];
 const readyBefore=nextPlace()?.ready??false;
 const reachBefore=new Set(cargoKeys(state).map(k=>k.index)),r=act(state,a,Date.now());
 if(!r.ok){$('#message').textContent=r.message;sfx('error');
  if(a.type==='produce'&&state.energy<1)playlog.event('blockedEnergy');else if(/board is full|Make space/i.test(r.message))playlog.event('blockedFull',{type:a.type});
  return r;}
 logResult(a,r,before);
 $('#message').textContent=r.message;
 if(r.event==='merge'||r.event==='move'||r.event==='producerUp'||r.event==='unseal')selected=r.event==='producerUp'||r.event==='unseal'?null:r.index;
 if(r.event==='deliver'||r.event==='store'||r.event==='swapOrder'){focusOrder=null;selected=null;}
 if(r.event==='deliver'&&!reduced())holdPlace=performance.now()+880;
 // Build 51c: the guide's own feedback. The first crew order's coins are named (the coin count pulses);
 // the first restoration ends the guide (the message line names the next objective once).
 if(coachBefore&&r.event==='deliver'&&order&&!order.story&&state.ordersDone===1){coachNote={text:`+${order.coins} coins from ${CREW[order.who]?.name??'the crew'}'s order: crew orders pay coins.`,until:performance.now()+3800,target:{kind:'coins'}};setTimeout(renderHint,3900);}
 if(coachBefore&&r.event==='restore'){markSeen(COACH_DONE);coachNote=null;const next=TASKS[FIRST_PLACE].stages[stageOf(state,FIRST_PLACE)];
  $('#message').textContent=`Guide complete. Next: ${next?next.name+': its gold order brings the materials and coins, crew orders add more coins.':'the coast\'s next place.'}`;}
 // the guide is this camp's from its first action on (a seen flag is an action too, so not before: a new
 // camp stays untouched until the player acts)
 if(coachBefore&&!state.seen?.[COACH_ON])markSeen(COACH_ON);
 laterTips(r);
 persist();render();
 const tile=r.index!=null?board.querySelector(`[data-index="${r.index}"]`):null;
 // Tideglass: a crack is a crisp tick; the third hit shatters it (fragments) and frees the part.
 for(const j of r.cracked??[])board.querySelector(`[data-index="${j}"]`)?.classList.add('glassCrack');
 if(r.cracked?.length&&!r.broken?.length)sfx('crack');
 if(r.broken?.length){for(const j of r.broken){const t=board.querySelector(`[data-index="${j}"]`);if(!t)continue;t.classList.add('glassBreak');
   if(!reduced()){t.insertAdjacentHTML('beforeend',`<span class="iceBurst" aria-hidden="true">${Array.from({length:8},(_,k)=>`<i style="--a:${k*45+12}deg;--d:${24+(k%3)*8}px"></i>`).join('')}</span>`);setTimeout(()=>t.querySelector('.iceBurst')?.remove(),800);}}
  sfx('shatter');haptics.pulse('ice');}
 if(r.event==='swap'){tile?.classList.add('merge-pop');burst(tile?.getBoundingClientRect(),'gold');sfx('rare');}
 if(r.event==='merge'){const m=state.board[r.index],first=m?.type==='item'&&r.found?.includes(m.family+m.tier);tile?.classList.add('merge-pop');burst(tile?.getBoundingClientRect(),m?.family,first||m?.tier>=4);
  // a triple merge (the level path) makes its second part where the third stood
  if(r.triple!=null){const t3=board.querySelector(`[data-index="${r.triple}"]`);t3?.classList.add('merge-pop');burst(t3?.getBoundingClientRect(),m?.family,true);}
  if(!r.broken?.length){sfx(first&&m.tier>=2||m?.tier>=4?'discovery':'merge',m?.tier??0);haptics.pulse('merge');}for(const d of r.dug??[])board.querySelector(`[data-index="${d.index}"]`)?.classList.add('unlocked');
  // Build 45n/45o: a merge too small for the tideglass beside it says so (the glass shrugs and
  // flashes; no level is written on the ice, user: "hagrahgui tohioldold l heley").
  const weak=weakIceBeside(state.board,r.index);
  if(weak.length){for(const j of weak)board.querySelector(`[data-index="${j}"]`)?.classList.add('iceWeak');
   const need=Math.min(...weak.map(j=>iceNeed(state.board[j])??state.board[j].tier+1));
   $('#message').textContent=`${r.message} · too small for the tideglass: merge a level ${need} or better beside it`;}}
 if(r.event==='produce'||r.event==='kit')sfx('produce');
 // Secondary chains (pilot): the rare extra lands beside the tap's part with the board's arrival
 // pop (no new badge or panel), and the first one of a chain gets one short moment saying where it
 // comes from. A tap's extra with no space waits with the other rewards (r.secondary.index -1).
 if(r.event==='produce'&&r.secondary){const t2=r.secondary.index>=0?board.querySelector(`[data-index="${r.secondary.index}"]`):null;t2?.classList.add('unsealed');burst(t2?.getBoundingClientRect(),r.secondary.family,true);sfx('rare');
  if(r.found?.includes(r.secondary.family+'0'))setTimeout(()=>moment('New: '+CHAINS[r.secondary.family].names[0],sourceNote(r.secondary.family)+` Crew orders ask for them · merge two for a ${CHAINS[r.secondary.family].names[1]}.`,item(r.secondary.family,0)),reduced()?0:500);
  else if(r.secondary.index<0)$('#message').textContent+=' · no space: it waits for one';}
 if(r.unlocks?.length&&r.event!=='producerUp')extrasNews();
 // round 3: a level 2+ generator whose rare extras rest (enough unused held) says so
 if(r.event==='produce'&&r.rest)$('#message').textContent+=` · its rare extras rest while you hold ${SECONDARY_RULES[a.id].hold} unused: deliver, use or clear some`;
 if((r.event==='produce'||r.event==='kit')&&fromRect&&tile&&!reduced()){const to=tile.getBoundingClientRect(),el=document.createElement('div');el.className='flight';el.innerHTML=draw(state.board[r.index]);el.style.cssText=`left:${fromRect.x}px;top:${fromRect.y}px;--dx:${to.x-fromRect.x}px;--dy:${to.y-fromRect.y}px`;document.body.append(el);setTimeout(()=>el.remove(),460);}
 if(r.event==='deliver'){deliverSequence(r,taking,orderRect,before.coins,readyBefore);sfx('deliver');
  if(r.tool?.index!=null)board.querySelector(`[data-index="${r.tool.index}"]`)?.classList.add('unsealed');
  // the crew's +1 energy (Audit 2026-10-25) flies to the energy pill
  if(r.energy&&orderRect)setTimeout(()=>rewardFlight(orderRect,$('#energyPill').getBoundingClientRect(),`+${r.energy} ϟ`),reduced()?0:420);
  // Energy pass: the first ordinary crew order's +15, a short non-blocking note beside it
  if(r.boost){if(orderRect)setTimeout(()=>rewardFlight(orderRect,$('#energyPill').getBoundingClientRect(),`+${r.boost.energy} energy`),reduced()?0:700);energyNote(`First crew order · +${r.boost.energy} energy`);}
  // Build 48b: one clear step after the gold order: the materials are secured, the strip shows it at
  // once, and it says either "Build · cost" or how many coins are still short (crew orders pay them)
  if(r.materials){const t=TASKS[r.materials.id],u=t.stages[r.materials.stage-1],ok=state.coins>=u.cost;holdPlace=0;renderNextPlace();
   setTimeout(()=>moment(`Materials secured · +${r.coins} coins`,`The gold order paid ${r.coins} coins and brought the materials for ${u.name}. `+(ok?`Build · ${u.cost} coins: tap the strip under the orders.`:`${u.cost-state.coins} more coins to build it: deliver crew orders.`)),reduced()?0:950);}}
 if(r.event==='producerUp'){const src=state.board[r.index],next=nextKind(src.id),waiting=next&&src.level<UNLOCK_LEVEL&&!state.board.some(y=>y?.type==='source'&&y.id===next);
  if(r.unlocks?.length)extrasNews();else moment(SOURCES[src.id].name+' · level '+src.level,LEVEL_GAIN[src.level]+(waiting?` Level ${UNLOCK_LEVEL} brings out the ${SOURCES[next].name}.`:''),src);tile?.classList.add('merge-pop');burst(tile?.getBoundingClientRect(),'gold',true);sfx('milestone');}
 // On the coast screen the build plays first (Build 41f), then its story.
 if(r.event==='restore'&&r.effects?.boost){const b=r.effects.boost;energyNote(`${b.milestone?'Restoration '+b.milestone:'First stage'} · +${b.energy} energy`);rewardFlight($('#mapButton').getBoundingClientRect(),$('#energyPill').getBoundingClientRect(),`+${b.energy} energy`);}
 if(r.event==='restore'){haptics.pulse('restore');if($('#coastMap').open&&!reduced())setTimeout(()=>showBeat(r.task,r.effects),1300);else showBeat(r.task,r.effects);}
 if(r.event==='store'){$(`#shed [data-slot="${r.slot}"]`)?.classList.add('merge-pop');sfx('tap');}
 if(r.event==='unstore'){tile?.classList.add('merge-pop');sfx('tap');if(!state.shed.some(Boolean)){shedOpen=false;renderShed();}}
 if(r.event==='shop'){const o=SHOP[r.id];if(r.energy)rewardFlight(($('#shop').open?$('#shopContent'):$('#adEnergyButton')).getBoundingClientRect(),$('#energyPill').getBoundingClientRect(),`+${r.energy} ϟ`);else moment(o.name+(r.ad?' · thanks for watching':''),r.slot!=null?'In the shed: the board is full.':'On the board next to Rivet Rover.',r.thing);tile?.classList.add('unsealed');sfx('rare');}
 if(r.event==='swapOrder'){const c=$(`[data-order="${r.id}"]`);c?.classList.add('merge-pop');sfx('tap');}
 if(r.event==='book'){sfx('rare');}
 if(r.event==='bookPage'){sfx('milestone');moment('Page complete!',`Every ${pageName(r.family)} part found · a Brass cog`+(r.slot!=null?' (in the shed)':''),{type:'cog'});tile?.classList.add('unsealed');}
 if(r.event==='daily'){const g=r.gift;if(g.coins)rewardFlight($('#dailyButton').getBoundingClientRect(),$('#coinPill').getBoundingClientRect(),`+${g.coins} coins`);if(g.energy)rewardFlight($('#dailyButton').getBoundingClientRect(),$('#energyPill').getBoundingClientRect(),`+${g.energy} ϟ`);tile?.classList.add('unsealed');sfx('milestone');moment(`Daily gift · day ${g.day} of ${DAILY.length}`,giftText(DAILY[g.day-1])+(g.slot!=null?' · in the shed (the board is full)':''),g.thing??null);}
 // A generator reaching level 2 brings out the next kind beside it.
 for(const n of r.released??[]){const t=board.querySelector(`[data-index="${n.index}"]`);t?.classList.add('unsealed');burst(t?.getBoundingClientRect(),'gold',true);setTimeout(()=>{newGeneratorMoment(n.id);sfx('milestone');},r.event==='producerUp'?900:0);}
 // A reward that was waiting for space lands (Build 47a).
 for(const n of r.arrived??[]){board.querySelector(`[data-index="${n.index}"]`)?.classList.add('unsealed');}
 if(r.arrived?.length){$('#message').textContent+=` · ${r.arrived.length===1?'a waiting reward lands':r.arrived.length+' waiting rewards land'}: ${r.arrived.map(n=>nameOf(n.thing)).join(', ')}`;sfx('unseal');}
 if(r.event==='unseal'){tile?.classList.add('unsealed');burst(tile?.getBoundingClientRect(),'gold',r.opened.type==='source');sfx(r.opened.type==='source'?'milestone':'unseal');haptics.pulse('merge');
  if(r.opened.type==='coins')rewardFlight(tile?.getBoundingClientRect(),$('#coinPill').getBoundingClientRect(),`+${r.opened.coins} coins`);
  if(r.opened.type==='jar')rewardFlight(tile?.getBoundingClientRect(),$('#energyPill').getBoundingClientRect(),`+${r.opened.energy} ϟ`);
  if(r.opened.type==='token')moment('A Tide token!','Lay it on a part: it turns into a part of the same tier that a crew order wants.',{type:'token'});
  if(r.opened.type==='cog')moment('A Brass cog!','Lay it on a generator: it goes up one level and makes better parts.',{type:'cog'});
  if(r.opened.type==='source'){const copies=state.board.filter(y=>y?.type==='source'&&y.id===r.opened.id).length;if(copies>1)moment(`A second ${SOURCES[r.opened.id].name}!`,`Drag it onto the other one of the same level: they merge into a stronger generator.`,{type:'source',id:r.opened.id});else newGeneratorMoment(r.opened.id);}
  // Crates that now touch open ground show their keys for the first time.
  for(const k of cargoKeys(state))if(!reachBefore.has(k.index))board.querySelector(`[data-index="${k.index}"]`)?.classList.add('newKey');}
 if(r.found?.length&&r.event!=='restore'){const k=r.found.at(-1),x=item(k.replace(/\d+$/,''),+k.match(/\d+$/)[0]);if(x.tier>=2)setTimeout(()=>moment('New: '+nameOf(x),(x.tier<maxTier(x.family)?'Next: '+CHAINS[x.family].names[x.tier+1]:'Top of the chain')+` · in the book: +${BOOK_COINS[x.tier]} coins`,x),r.levelUp?1600:0);}
 if(r.levelUp){const u=r.levelUp.at(-1),opened=r.levelUp.map(v=>LEVEL_PATH.find(p=>p.id===v.unlock)).filter(Boolean).at(-1),energy=r.levelUp.reduce((n,v)=>n+v.energy,0),nx=nextUnlock(u.level);
  // The level path: a level that opens something says what, with the energy after it.
  // Energy pass (build 47v): a level that raises the refill capacity says so apart from the level's
  // own energy: the level card names the new capacity ("+5 ϟ for the level. Energy capacity is now
  // 60."), then, once it has gone, a short note under the energy pill gives the milestone's own reward
  // ("Energy capacity 50 → 60 · +10 energy"), so the two never cover each other.
  const caps=r.levelUp.map(v=>v.capacity).filter(Boolean),capLine=caps.length?` Energy capacity is now ${caps.at(-1).to}.`:'';
  if(caps.length)setTimeout(()=>energyNote(`Energy capacity ${caps[0].from} → ${caps.at(-1).to} · +${caps.reduce((n,c)=>n+c.energy,0)} energy`),(r.event==='restore'?0:400)+(reduced()?2200:1850));
  setTimeout(()=>{moment('Level '+u.level+'!'+(opened?' · New: '+opened.name:''),(opened?opened.text+' ':'')+(energy?`+${energy} ϟ for the level.`:'')+capLine+(!opened&&nx?` Level ${nx.level}: ${nx.name}.`:''));sfx('milestone');$('#levelPill').classList.add('levelUp');setTimeout(()=>$('#levelPill').classList.remove('levelUp'),1400);},r.event==='restore'?0:400);}
 return r;
}
// The delivery (Build 44): the parts leave the board for the order card, then coins fly from
// the card to the counter, which counts up; when the delivery has made a stage buildable, the
// next-place chip says so. All of it is drawn on top and never blocks a tap: the reducer has
// already settled, so a second delivery or merge during the flights is safe.
let coinCount=null;
function countCoins(from){
 const el=$('#coins'),to=state.coins;if(coinCount)cancelAnimationFrame(coinCount);
 if(reduced()||from===to){el.textContent=to;return;}
 const t0=performance.now()+420,ms=520;el.textContent=from;
 const step=now=>{if(state.coins!==to){el.textContent=state.coins;coinCount=null;return;}const k=Math.max(0,Math.min(1,(now-t0)/ms));el.textContent=Math.round(from+(to-from)*(1-(1-k)**3));if(k<1)coinCount=requestAnimationFrame(step);else coinCount=null;};
 coinCount=requestAnimationFrame(step);
}
function deliverSequence(r,taking,orderRect,coinsBefore,readyBefore){
 const pill=$('#coinPill'),bump=()=>{pill.classList.remove('bump');void pill.offsetWidth;pill.classList.add('bump');};
 countCoins(coinsBefore);
 if(reduced()||!orderRect){bump();if(orderRect)rewardFlight(orderRect,pill.getBoundingClientRect(),`+${r.coins}`);return;}
 // 1. the parts go to the card
 taking.forEach((v,k)=>{if(!v.rect)return;const el=document.createElement('div');el.className='deliveryPart';el.innerHTML=draw(v.x);
  el.style.cssText=`left:${v.rect.x}px;top:${v.rect.y}px;width:${v.rect.width}px;height:${v.rect.height}px;--dx:${orderRect.x+orderRect.width/2-v.rect.x-v.rect.width/2}px;--dy:${orderRect.y+orderRect.height/2-v.rect.y-v.rect.height/2}px;animation-delay:${k*40}ms`;
  document.body.append(el);setTimeout(()=>el.remove(),520+k*40);});
 // 2. coins from the card to the counter
 const to=pill.getBoundingClientRect(),n=Math.min(7,2+Math.round(r.coins/25));
 for(let k=0;k<n;k++){const c=document.createElement('i');c.className='coinFlight';const fx=orderRect.x+orderRect.width/2+(k-(n-1)/2)*9,fy=orderRect.y+orderRect.height*.55;
  c.style.cssText=`left:${fx}px;top:${fy}px;--dx:${to.x+to.width*.25-fx}px;--dy:${to.y+to.height/2-fy}px;animation-delay:${300+k*45}ms`;document.body.append(c);setTimeout(()=>c.remove(),1000+k*45);}
 setTimeout(bump,760);
 // 3. the restoration's progress: the chip pulses, and says "Ready" only when it truly is.
 setTimeout(()=>{holdPlace=0;renderNextPlace();renderHint();$('#mapReady').hidden=!nextPlace()?.ready;calmBadges();const el=$('#mapButton');el.classList.remove('progressed');void el.offsetWidth;el.classList.add('progressed');},900);
}
// Taps make, open and show; merging, opening cargo and moving are done by dragging only
// (build 24, user: "touch-r mergelehgui, zuvhun drag hiij mergeldeg baiy").
function clickTile(i){
 const x=state.board[i];
 if(x?.type==='source'){selected=i;if(sourceOpen(state,x.id))run({type:'produce',id:x.id,index:i});render();return;}
 if(x?.type==='kit'&&selected===i){run({type:'openKit',index:i});return;}
 selected=selected===i&&x?.type==='item'?null:x?i:null;render();
}
// The click a drag ends with is not a tap; the next press clears the flag if no click came.
// The level badge shows the level path: what is open and what each next level brings.
{const pill=$('#levelPill');pill.setAttribute('role','button');pill.tabIndex=0;
 // Energy pass (build 47v): it also shows the XP to the next level, the energy capacity and the next
 // capacity milestone ("Level 5: energy capacity increases to 70."), or the maximum.
 const show=()=>{const lv=state.level.level,cap=capacityOf(state),nc=nextCapacity(lv);
  moment(`Level ${lv} · ${state.level.xp} of ${xpToNext(lv)} XP`,`Energy capacity: ${cap} (refills +1 every 2 minutes up to it). `+(nc?`Level ${nc.level}: energy capacity increases to ${nc.capacity}.`:`Maximum energy capacity: ${MAX_CAPACITY}.`)+'\n'+LEVEL_PATH.map(u=>`${lv>=u.level?'✓':'Level '+u.level+':'} ${u.name}${lv>=u.level?'':': '+u.text}`).join('\n')+`\nEvery level: energy (+${EARLY_LEVEL_ENERGY} ϟ up to level ${EARLY_LEVELS}, then +${CHEST_ENERGY} ϟ).`);document.querySelector('.moment')?.classList.add('pathMoment');sfx('tap');};
 pill.addEventListener('click',show);pill.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();show();}});}
board.addEventListener('click',e=>{if(suppressClick){suppressClick=false;return;}const t=e.target.closest('[data-index]');if(t)clickTile(+t.dataset.index);});
// Drag to merge (build 23, user: "merge hiih uildel drag hiij zuuj bolohgui baina"): every
// movable thing owns its touch gesture (no page scroll), a copy follows the finger, and the
// space under it is marked; letting go there merges or moves.
const DRAGGABLE=['item','kit','source','cog','token'];
function endDrag(){document.querySelectorAll('#board .dragging,#board .target,#shed .target,#shed .shedToggle.target').forEach(x=>x.classList.remove('dragging','target'));if(state.board[drag?.from]?.type==='token'&&drag?.moved)document.querySelectorAll('#board .tile.match').forEach(x=>x.classList.remove('match'));drag?.ghost?.remove();drag=null;}
board.addEventListener('pointerdown',e=>{suppressClick=false;const t=e.target.closest('[data-index]');if(!t||e.button!==0)return;const i=+t.dataset.index;if(!DRAGGABLE.includes(state.board[i]?.type))return;drag={from:i,id:e.pointerId,x:e.clientX,y:e.clientY,moved:false,over:null};});
// Move and drop are heard on the whole page: a drag can end on the shed under the board.
document.addEventListener('pointermove',e=>{
 if(!drag||drag.id!==e.pointerId)return;
 if(!drag.moved){if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<=8)return;drag.moved=true;
  const from=board.querySelector(`[data-index="${drag.from}"]`),r=from.getBoundingClientRect();from.classList.add('dragging');
  // a dragged Tide token shows the parts it works on, as a tapped one does (Build 46l)
  if(state.board[drag.from]?.type==='token')state.board.forEach((y,k)=>{if(y?.type==='item'&&swappable(y))board.querySelector(`[data-index="${k}"]`)?.classList.add('match');});
  drag.ghost=document.createElement('div');drag.ghost.className='dragGhost';drag.ghost.style.cssText=`width:${r.width}px;height:${r.height}px`;drag.ghost.innerHTML=draw(state.board[drag.from]);document.body.append(drag.ghost);}
 drag.ghost.style.transform=`translate(${e.clientX-drag.ghost.offsetWidth/2}px,${e.clientY-drag.ghost.offsetHeight*.7}px)`;
 const t=document.elementFromPoint(e.clientX,e.clientY)?.closest('#board [data-index], #shed [data-slot], #shed [data-shed-toggle]'),i=t?(t.dataset.slot!=null?'s'+t.dataset.slot:t.dataset.index!=null?+t.dataset.index:'shed'):null;
 if(i!==drag.over){document.querySelector('#board .target, #shed .target')?.classList.remove('target');drag.over=i;if(t&&i!==drag.from)t.classList.add('target');}
});
document.addEventListener('pointerup',e=>{if(!drag||drag.id!==e.pointerId)return;const d=drag;endDrag();if(!d.moved)return;suppressClick=true;const el=document.elementFromPoint(e.clientX,e.clientY),slot=el?.closest('#shed [data-slot]');if(slot){run({type:'store',index:d.from,slot:+slot.dataset.slot});return;}
 if(el?.closest('#shed [data-shed-toggle]')){const k=state.shed.indexOf(null);if(k>=0)run({type:'store',index:d.from,slot:k});else $('#message').textContent='The shed is full.';return;}const t=el?.closest('#board [data-index]');if(t&&+t.dataset.index!==d.from){selected=d.from;run({type:'merge',from:d.from,to:+t.dataset.index});}});
document.addEventListener('pointercancel',endDrag);
// iOS Safari can still start a scroll from a button; while dragging, the finger is ours.
board.addEventListener('touchmove',e=>{if(drag?.moved)e.preventDefault();},{passive:false});
$('#selection').addEventListener('click',e=>{
 // The panel keeps its text to two lines (Build 45); a tap on it shows the rest.
 if(e.target.closest('.copy')){$('#selection').classList.toggle('open');return;}
 const b=e.target.closest('[data-action]');if(!b)return;if(b.dataset.action==='store')shedOpen=true;const x=state.board[selected];
 // Build 51d: clearing a part an order wants, a merged part or a rare part takes a second tap within 3 s
 if(b.dataset.action==='recycle'&&b.dataset.confirm&&!(clearArm?.index===selected&&clearArm.until>performance.now())){
  const at=selected;clearArm={index:at,until:performance.now()+3000};b.textContent='Tap again to clear';b.classList.add('confirm');
  $('#message').textContent=`Clear the ${nameOf(x)}? Tap again to clear it for good.`;setTimeout(()=>{if(clearArm?.index===at&&clearArm.until<=performance.now()){clearArm=null;renderSelection();}},3100);return;}
 clearArm=null;run({type:b.dataset.action,index:selected,id:x?.id});});
let clearArm=null;
$('#orderTools').addEventListener('click',e=>{if(e.target.closest('[data-sheet-close]')){setDetails(false);return;}const b=e.target.closest('[data-locate]');if(!b)return;setDetails(false);locateGen=b.dataset.locate;locateUntil=performance.now()+2600;renderBoard();if(coach)showCoachTarget(coach.target);
 board.querySelector('.tile.located')?.scrollIntoView({block:'nearest',behavior:reduced()?'auto':'smooth'});
 const i=locateIndex();if(i>=0)$('#message').textContent=`${SOURCES[locateGen].name}${state.board[i]?.level>1?` (level ${state.board[i].level})`:''}: tap it for parts.`;
 setTimeout(()=>{if(performance.now()>=locateUntil){renderBoard();if(coach)showCoachTarget(coach.target);}},2700);});
$('#orderDetails').addEventListener('click',()=>{sfx('tap');setDetails(true);});
$('#sheetBackdrop').addEventListener('click',()=>setDetails(false));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&detailsOpen){e.preventDefault();setDetails(false);$('#orderDetails').focus({preventScroll:true});}});
$('#requests').addEventListener('click',e=>{const c=e.target.closest('[data-order]');if(!c)return;const o=state.orders.find(o=>o.id===c.dataset.order);if(!o)return;if(orderItems(state,o)){run({type:'deliver',id:o.id});return;}focusOrder=focusOrder===o.id?null:o.id;render();$('#message').textContent=`${CREW[o.who].name} needs ${needsOf(state,o).map(r=>r.count+' × '+nameOf(item(r.family,r.tier))+(r.sibling?` (level ${levelOf(r)})`:'')).join(' and ')}. Their parts are marked on the board.`+o.needs.filter(r=>CHAINS[r.family].secondary).map(r=>' '+sourceNote(r.family,r.tier)).join('');});
// The upgrading happens on the beach screen (user: "tusdaa orchinruu ochij upgrade hiih").
$('#mapButton').onclick=()=>{mapFocus=$('#mapButton').dataset.place||null;sfx('tap');showMap();};
$('#rationButton').onclick=()=>run({type:'ration'});
$('#shed').addEventListener('click',e=>{if(e.target.closest('[data-shed-toggle]')){shedOpen=!shedOpen;sfx('tap');renderShed();return;}const b=e.target.closest('[data-slot]');if(!b)return;if(state.shed[+b.dataset.slot])run({type:'unstore',slot:+b.dataset.slot});else $('#message').textContent='Drag a part, crate, cog or token here to keep it off the board.';});
// ---------- the daily gift ----------
// Today's local day number (the reducer only checks it is a new one).
const today=()=>{const n=Date.now();return Math.floor((n-new Date(n).getTimezoneOffset()*60000)/86400000);};
const giftReady=()=>today()>state.daily.day;
const giftThing=g=>g.kit?{type:'kit',family:newestGenerator(state),size:1,left:3}:g.token?token():g.cog?cog():null;
const giftText=g=>g.energy?`+${g.energy} energy`:g.coins?`+${g.coins} coins`:g.kit?'a Driftwood crate':g.token?'a Tide token':'a Brass cog: +1 generator level';
let giftShown=-1;
function showDaily(){
 giftShown=today();const next=state.daily.count%DAILY.length,ready=giftReady();
 $('#dailyContent').innerHTML=`<h2 id="dailyTitle">Daily gift</h2><p>${ready?'A gift from the crew for coming back. One each day; a missed day does not reset the row.':'Today\'s gift is open. The next one comes tomorrow.'}</p><ol class="dailyRow">${DAILY.map((g,k)=>{const done=k<next||(!ready&&k===next-1),now=ready&&k===next,x=giftThing(g);return `<li class="dailyDay ${done?'done':''} ${now?'today':''}"><small>Day ${k+1}</small><span class="dailyIcon">${x?draw(x):g.coins?'<i class="coinIcon big"></i>':'<b class="bolt">ϟ</b>'}</span><b>${g.energy?'+'+g.energy+' ϟ':g.coins?'+'+g.coins:g.kit?'Crate':g.token?'Token':'Cog'}</b>${done?'<i class="tick">✓</i>':''}</li>`;}).join('')}</ol>${ready?'<button class="primary dailyClaim" data-claim>Open the gift</button>':''}`;
 if(!$('#daily').open)$('#daily').showModal();
}
$('#dailyContent').addEventListener('click',e=>{if(!e.target.closest('[data-claim]'))return;const r=run({type:'daily',day:today()});if(r.ok)$('#daily').close();else showDaily();});
$('#dailyButton').onclick=showDaily;
// ---------- the collection book (build 33) ----------
// A page per generator chain: parts found (tick them off for coins), parts still to find
// (a shadow), and a Brass cog for a whole page. Pages of generators not yet out are closed.
const GENERATOR_NAMES_UI=Object.fromEntries(Object.entries(SOURCES).map(([k,v])=>[k,v.name]));
// A book page's name: its generator's, or for a secondary chain (pilot) the generator's extras.
const pageName=f=>CHAINS[f].secondary?`${SOURCES[CHAINS[f].gen].name} extras`:GENERATOR_NAMES_UI[f];
// Where a secondary part comes from (pilot), for the selection panel, order hints and its first find.
// With a tier (an order's part), it names that part and, past the first, the parts it is merged from.
function sourceNote(f,tier=null){const r=SECONDARY_RULES[CHAINS[f].gen],gen=SOURCES[CHAINS[f].gen].name,n=CHAINS[f].names;
 const what=tier===null?'A':tier>0?`${n[tier]}: merged from ${n[0]}s, a`:`${n[0]}: a`;
 // round 3: only a level 2+ generator makes them; the limit counts its taps while extras are coming
 return `${what} rare ${gen} extra: a level 2+ ${gen} sometimes adds one to a tap, at no extra energy (at the latest on its ${r.pity}th tap, while you hold fewer than ${r.hold} unused).`;}
// Build 51c: later mechanics, once each and only when they come up (seen flags 'tip-…'): merging two
// generators (the hint names it while a matching copy is on the board, coach.mjs laterTip), tideglass
// (its first crack), the shed (the first full board). Not during the first loop's guide, except the
// tideglass, which the first merges crack.
function laterTips(r){
 if(r.event==='producerUp'&&!state.seen?.['tip-genmerge'])markSeen('tip-genmerge');
 if(r.cracked?.length&&!r.broken?.length&&!state.seen?.['tip-ice']){const g=state.board[r.cracked[0]];
  if(g?.type==='glass'){const done=g.cracks??1,left=GLASS_HITS-done,need=g.tier+1;markSeen('tip-ice');
   // a merge beside it cracks it only if it makes a part at least as strong as the one inside (crack())
   setTimeout(()=>moment(`Tideglass cracked · ${done} of ${GLASS_HITS}`,`${left} more ${left===1?'merge':'merges'} beside it free the part inside. ${need<=2?'Any merge counts.':`Each must make a level ${need} part or better.`}`),reduced()?0:700);}}
 if(!coachActive(state)&&!state.board.includes(null)&&!state.seen?.['tip-shed']){markSeen('tip-shed');moment('The board is full','Tap a part and choose Shed to keep it for later, or deliver and merge to make room.');}
}
$('#coachSkip').onclick=()=>{markSeen(COACH_DONE);coachNote=null;clearCoach();render();$('#message').textContent='Guide skipped. Help (in the menu) can replay it.';};
// Help: a short replay of the guide (four lines with the crew's faces), whatever the camp's progress.
const GUIDE_REPLAY=[['ivo','Tap a generator for parts, and drag matching parts together to merge them.'],['neri','Crew orders pay coins.'],['bram','A gold order pays coins too, and secures the materials for the next repair.'],['tamsin','On the coast screen, coins and materials together rebuild a place.']];
$('#helpReplay').onclick=()=>{$('#help').close();playLines('How the camp works',GUIDE_REPLAY,()=>render(),{last:'Back to the board'});};
// Round 3: a kind's rare extras open when one of its generators first reaches level 2 (the engine's
// secondaryUnlock: a first part as a gift and an introductory crew order). Said once per kind, also
// for a save that opened on load; marked seen ('extras-rig').
function extrasNews(){
 for(const gen of Object.keys(state.secOpen??{})){const id='extras-'+gen;if(state.seen?.[id])continue;
  const f=SECONDARY_OF[gen],n=CHAINS[f].names[0],g=SOURCES[gen].name;
  const use=nextRareUse(state,f),where=use?` Merged, they are wanted later: ${use.name} (${use.area}) asks for one.`:'';
  moment(`${g} extras unlocked`,`A level 2+ ${g} now sometimes adds a rare ${n} to a tap, at no extra energy. Your first ${n} is on the board (or waits for space), and the next new crew order will ask for it.${where}`,item(f,0));
  markSeen(id);return true;}
 return false;
}
// Build 47e: the Lens Bench's page appears once the camp is inside the Vault (no Chapter 2 spoiler
// in Chapter 1's book).
// A secondary chain's page (pilot) shows once its first part is found: it is a find, not a promise.
const bookChains=()=>BOOK_CHAINS.filter(f=>CHAINS[f].secondary?!!state.secOpen?.[CHAINS[f].gen]||state.found.some(k=>k.replace(/\d+$/,'')===f):f!=='optic'||state.area>=3||state.found.some(k=>k.startsWith('optic')));
function showBook(){
 const chains=bookChains(),ready=new Set(bookReady(state)),claimed=new Set(state.book.claimed),total=chains.reduce((n,f)=>n+bookKeys(f).length,0);
 const pages=chains.map(f=>{
  const keys=bookKeys(f),got=keys.filter(k=>claimed.has(k)).length,open=state.found.some(k=>k.slice(0,-1)===f)||has(f);
  if(!open)return `<section class="bookPage closed"><div class="bookHead"><span class="bookGen">${draw({type:'source',id:f})}</span><span><b>${SOURCES[f].name}</b><small>Comes out later · ${keys.length} parts</small></span></div></section>`;
  const cells=keys.map(k=>{const t=+k.slice(-1),x=item(f,t),name=CHAINS[f].names[t];
   if(ready.has(k))return `<button class="bookItem ready" data-key="${k}" aria-label="${name}: tick off for ${BOOK_COINS[t]} coins">${draw(x)}<small>${name}</small><b class="bookCoins">+${BOOK_COINS[t]} ${COIN}</b></button>`;
   if(claimed.has(k))return `<div class="bookItem got">${draw(x)}<small>${name}</small></div>`;
   return `<div class="bookItem unknown" aria-label="Not found yet">${draw(x)}<small>?</small></div>`;}).join('');
  const done=state.book.pages.includes(f),can=pageReady(state,f);
  return `<section class="bookPage"><div class="bookHead"><span class="bookGen">${draw({type:'source',id:CHAINS[f].gen})}</span><span><b>${pageName(f)}</b><small>${got} / ${keys.length} in the book</small></span>${CHAINS[f].secondary?(got===keys.length?'<em class="pageDone">✓ Complete</em>':''):done?'<em class="pageDone">✓ Cog</em>':can?`<button class="primary pageClaim" data-page="${f}">Claim the cog</button>`:`<em class="pagePrize">${draw({type:'cog'})}</em>`}</div><div class="bookGrid">${cells}</div></section>`;}).join('');
 $('#bookContent').innerHTML=`<h2 id="bookTitle">Collection book</h2><p class="bookIntro">${state.book.claimed.length} of ${total} parts · tick off new finds for coins; a generator's full page gives a Brass cog.</p>${ready.size>1?`<button class="primary bookAll" data-all>Tick off all ${ready.size}</button>`:''}${pages}`;
 if(!$('#book').open)$('#book').showModal();
}
$('#bookContent').addEventListener('click',e=>{
 const k=e.target.closest('[data-key]'),pg=e.target.closest('[data-page]'),all=e.target.closest('[data-all]');
 if(k)run({type:'book',key:k.dataset.key});else if(pg)run({type:'bookPage',family:pg.dataset.page});else if(all){let n=0;for(const key of bookReady(state))n+=run({type:'book',key}).coins??0;$('#message').textContent=`In the book · +${n} coins`;}else return;
 showBook();
});
$('#bookButton').onclick=showBook;
$('#orderTools').addEventListener('click',e=>{const id=focusOrder;if(e.target.closest('[data-swap]'))run({type:'swapOrder',id,day:today()});else if(e.target.closest('[data-swap-ad]'))watchAd({type:'swapOrder',id,day:today(),ad:true});});
// ---------- the shop and rewarded ads (build 34) ----------
const offerThing=o=>o.kit?{type:'kit',family:newestGenerator(state),size:o.kit,left:3}:o.token?token():o.cog?cog():null;
function showShop(){
 const day=today(),row=id=>{const o=SHOP[id],left=shopLeft(state,id,day),x=offerThing(o);
  const what=o.energy?`+${o.energy} energy`:o.kit?`${CRATES[o.kit-1]} for the ${SOURCES[newestGenerator(state)].name}`:o.token?'Turns a part into one an order wants':'+1 level for a generator';
  const capped=o.energy&&state.energy+o.energy>STORE_ENERGY;
  const btn=left<1?`<button disabled>${o.ad?'Daily rewards used':'Sold out'}</button>`:o.ad?`<button class="adOffer" data-ad="${id}" ${!adReady||adBusy||capped?'disabled':''}>${capped?'Energy storage full':!adReady?'Ad unavailable':o.energy?'▶ Watch · +'+o.energy+' energy':'▶ Watch for crate'}</button>`:`<button class="buy" data-buy="${id}" ${state.coins<o.cost||capped||purchaseBusy?'disabled':''}>${COIN} ${o.cost}</button>`;
  return `<li class="shopItem"><span class="shopIcon">${x?draw(x):'<b class="bolt">ϟ</b>'}</span><span class="shopText"><b>${o.name}</b><small>${what}</small><small class="left">${left} of ${o.limit} left today</small>${capped?'<small>Spend energy first (storage limit 200).</small>':''}</span>${btn}</li>`;};
 const ids=Object.keys(SHOP);
 $('#shopContent').innerHTML=`<div class="shopTop"><h2 id="shopTitle">Shop</h2><b class="beachCoins">${COIN} ${state.coins}</b></div><p>A little help for coins, a few of each a day; it restocks tomorrow. Coins spent here are not spent on the coast.</p>
  ${ADS&&!coachActive(state)?`<h3>Free with a short ad</h3><ol class="shopList">${ids.filter(id=>SHOP[id].ad).map(row).join('')}</ol>`:''}
  <p class="energyHelp"><b>${state.energy} energy available · ${Math.max(0,state.energy-capacityOf(state))} bonus stored</b><br>Natural refill limit: ${capacityOf(state)} (level ${state.level.level}). +1 every 2 minutes when below ${capacityOf(state)}. Bonus energy is kept. Storage limit: ${STORE_ENERGY}.</p>${adFeedback?`<p id="shopAdStatus" role="status">${adFeedback}</p>`:''}
  <h3>For coins</h3><ol class="shopList">${ids.filter(id=>!SHOP[id].ad).map(row).join('')}</ol>`;
 if(!$('#shop').open)$('#shop').showModal();
}
let purchaseBusy=false;
$('#shopContent').addEventListener('click',async e=>{const b=e.target.closest('[data-buy]'),ad=e.target.closest('[data-ad]');
 if(b){if(purchaseBusy||adBusy)return;purchaseBusy=true;b.disabled=true;
  try{const buy=()=>{const latest=readSave(storage.get(SAVE_KEY),Date.now());if(latest.status==='ok'){if(latest.state.energyRewards?.id!==state.energyRewards?.id){holdSave=true;$('#message').textContent='The camp changed in another tab. Reload to continue.';return;}state=latest.state;}run({type:'buy',id:b.dataset.buy,day:today()});};
   if(navigator.locks)await navigator.locks.request(SAVE_KEY+'-energy-transaction',buy);else buy();
  }finally{showShop();setTimeout(()=>{purchaseBusy=false;if($('#shop').open)showShop();},400);}
 }else if(ad)watchAd({type:'adReward',id:ad.dataset.ad});});
$('#shopButton').onclick=()=>{playlog.event('shopOpen');showShop();};
// Reuse the existing energy pill as the recovery entry point; no new board button.
$('#energyPill').setAttribute('role','button');$('#energyPill').tabIndex=0;
$('#energyPill').setAttribute('aria-label','Energy and recovery options');
$('#energyPill').onclick=showShop;
$('#energyPill').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();showShop();}};
$('#adEnergyButton').onclick=()=>watchAd({type:'adReward',id:'adEnergy'});
// Only explicit loopback development without an SDK may run this test stand-in;
// closing it early gives no reward, like a real rewarded ad.
function adStandIn(){
 return new Promise(resolve=>{
  const dlg=$('#adStandIn');let n=5,timer;const done=r=>{clearInterval(timer);dlg.close();resolve(r);};
  const show=()=>{$('#adContent').innerHTML=`<small class="adTag">AD STAND-IN</small><h2 id="adTitle">${n>0?'Your reward in '+n:'Reward ready'}</h2><p>On CrazyGames a short video ad plays here. This test page has no ad network, so nothing is shown.</p>${n>0?'<button class="adSkip" data-skip>Close · no reward</button>':'<button class="primary" data-collect>Collect the reward</button>'}`;};
  $('#adContent').onclick=e=>{if(e.target.closest('[data-skip]'))done('skipped');else if(e.target.closest('[data-collect]'))done('finished');};
  dlg.oncancel=e=>{e.preventDefault();if(n<=0)done('finished');else done('skipped');};
  show();dlg.showModal();timer=setInterval(()=>{n--;show();if(n<=0)clearInterval(timer);},1000);
 });
}
let adBusy=false,adReady=false,adFeedback='';
const localStandIn=DEV&&['localhost','127.0.0.1','[::1]'].includes(location.hostname);
async function refreshAds(){adReady=ADS&&!!(navigator.locks||localStandIn)&&await adsAvailable({allowStandIn:localStandIn});render();if($('#shop').open)showShop();}
queueMicrotask(refreshAds);
// The action is run only when the ad finished; today's day is filled in then.
async function watchAd(action){
 if(adBusy||!ADS||coachActive(state))return;
 const attempt=async()=>{
  const latest=readSave(storage.get(SAVE_KEY),Date.now());
  if(latest.status==='ok'){if(latest.state.energyRewards?.id!==state.energyRewards?.id){holdSave=true;$('#message').textContent='The camp changed in another tab. Reload to continue.';return;}state=latest.state;}
  receipts.apply(state);const o=SHOP[action.id];
  if(o&&shopLeft(state,action.id,today())<1){$('#message').textContent='Daily ad rewards used. More tomorrow.';return;}
  if(o?.energy&&state.energy+o.energy>STORE_ENERGY){$('#message').textContent='Spend some stored energy before claiming more.';return;}
  adBusy=true;adFeedback='';if($('#shop').open)showShop();const camp=state,controller=new AbortController();playlog.event('ad',{id:action.id??'swap',phase:'start'});
  const interrupt=()=>{if(document.hidden)controller.abort();};
  document.addEventListener('visibilitychange',interrupt);addEventListener('pagehide',()=>controller.abort(),{once:true,signal:controller.signal});
  try{
   const r=await rewardedAd({onStart(){adPlaying=true;},onEnd(){adPlaying=false;},standIn:adStandIn,allowStandIn:localStandIn,signal:controller.signal});
   playlog.event('ad',{id:action.id??'swap',phase:r});
   if(r==='finished'&&state.energyRewards.id===camp.energyRewards.id&&!controller.signal.aborted){
    const saved=readSave(storage.get(SAVE_KEY),Date.now());
    if(saved.status==='ok'&&saved.state.energyRewards?.id===camp.energyRewards.id){state=saved.state;const paid=run({...action,day:today()},{adCompletion:true});adFeedback=paid?.ok?(o?.energy?`+${o.energy} energy received.`:'Ad reward received.'):(paid?.message??'Reward could not be applied.');}
    else{holdSave=true;adFeedback='The camp changed in another tab: no reward was applied.';}
   }
   else adFeedback=r==='skipped'?'The ad was interrupted: no reward.':'Ad unavailable: no reward. Try again later.';
   $('#message').textContent=adFeedback;
  }finally{controller.abort();document.removeEventListener('visibilitychange',interrupt);adPlaying=false;adBusy=false;if($('#shop').open)showShop();render();}
 };
 // Web Locks serializes rewarded requests across tabs as well as this page.
 if(navigator.locks)await navigator.locks.request(SAVE_KEY+'-energy-transaction',{ifAvailable:true},lock=>lock?attempt():undefined);
 else if(localStandIn)await attempt();
 else $('#message').textContent='Rewarded ads are unavailable in this browser.';
}
// The gift opens by itself once a session is under way, never over another screen or a drag.
// Build 51c: not offered by itself while a new camp's first-loop guide runs (its button still shows the gift).
function offerGift(){if(!homeOpen&&!adBusy&&giftReady()&&giftShown!==today()&&state.moves>=3&&!coachActive(state)&&!drag&&!document.querySelector('dialog[open]'))showDaily();}
$('#soundButton').onclick=()=>{sounds.toggle();render();sfx('tap');};
$('#hapticsButton').onclick=()=>{haptics.toggle();render();haptics.pulse('merge');};
$('#helpButton').onclick=()=>$('#help').showModal();
$('#keptButton').onclick=()=>{$('#menu').close();showKept();};
$('#menuButton').onclick=()=>{$('#homeButton').hidden=homeOpen;{const n=kept().length;$('#keptButton').hidden=!n;$('#keptButton').textContent=`Kept camps (${n})`;}{let n=$('#saveNote');if(!n){n=document.createElement('small');n.id='saveNote';$('#hapticsNote').after(n);}n.textContent=saveLine(storage.status);}$('#classicNote').textContent=storage.get('vaultwake-v5')?'Your Classic save is kept and continues where you left it.':'';$('#hapticsNote').textContent=haptics.method==='vibrate'?'Vibration on merges: use the button at the bottom of the board screen.':haptics.method==='ios-switch'?'Vibration on merges may work on this iPhone (iOS 18 and later); turn it off at the bottom of the board screen.':'Vibration is not available in this browser.';$('#menu').showModal();};
$('#newGame').onclick=()=>{if(!confirm('Start a new game from the beginning? This camp is kept in this browser (Kept camps in this menu brings it back), and your Classic save is not affected.'))return;if(!newCamp())return;$('#menu').close();if(homeOpen&&home)home.enter();else showIntro();};
// A new camp, chosen by the player (the menu, or Home after a save could not be read).
// Round 2: the camp a new camp replaces is kept (SAVE_KEY-kept…), so starting again loses nothing.
function newCamp(){const wasDamaged=damaged;if(!keepDamaged()){alert('Your old save could not be copied aside (this browser\'s storage is full), so nothing was replaced.');return false;}
 if(!wasDamaged){persist();if(!keepCopy(storage.get(SAVE_KEY),'kept')){alert('Your camp could not be copied aside (this browser\'s storage is full), so nothing was replaced.');return false;}}
 holdSave=false;replaced=null;state=fresh(Date.now());selected=null;focusOrder=null;persist();render();return true;}
$('#homeButton').onclick=()=>{$('#menu').close();persist();home?.show();};
for(const d of document.querySelectorAll('dialog'))d.querySelector('.close')?.addEventListener('click',()=>d.close());

// ---------- the beach screen and story ----------
// A full-screen view of the area: the picture with every place at its stage, and the list
// of places with their next stage and its price. Coins are spent here only.
// The area's picture changes with its stages (build 37, user: "bushiin zurgiin uurchlultiig hii"):
// it starts storm-grey, and each place brings its own patch of colour back, wider at every stage
// (REVEAL, in % of the picture's width), with a glow at stage 3, and the storm lifts a little
// with every stage (--p); a finished area is in full colour. The stage just bought spreads its colour out from the old size.
const REVEAL=[0,13,19,26];
let lastStage=null;// {id,stage} of the upgrade being shown, so its patch can grow
// Build 48a: the Hidden Harbour's map is the director's damaged harbour; each stage bought uncovers its
// own repair from the restored painting of the same view (area.restored), on the spot that changed:
// [stage, layer, x %, y %, half-width %, half-height %]. Layer 'after' is the restored painting; layer
// 'before' brings back the damaged painting's own colour (the boatyard keeps its boat on the slip until
// the launch, when its spot turns to the restored painting's empty cradles). A stage just bought grows
// from nothing (--r of its place). Nothing is stood on the painting: it already shows every building.
const HARBOUR_REVEAL={
 'hb-landing':[[1,'after',20,85,12,6],[2,'after',19,81,15,9],[3,'after',15,77,17,12]],
 'hb-crane':[[1,'after',16,52,8,9],[2,'after',27,47,10,7],[3,'after',21,58,9,5]],
 'hb-warehouse':[[1,'after',27,21,10,6],[2,'after',27,26,12,8],[3,'after',27,28,15,9]],
 'hb-boatyard':[[1,'before',88,51,8,7],[2,'before',72,51,11,7],[3,'before',80,44,15,8]],
 'hb-registry':[[1,'after',57,20,8,7],[2,'after',55,19,12,9],[3,'after',61,22,16,11]],
 'hb-signal':[[1,'after',90,24,6,7],[2,'after',91,14,6,9],[3,'after',89,16,11,14]],
 'hb-departure':[[1,'after',92,84,7,6],[2,'after',90,79,10,8],[3,'after',72,87,15,12]]
};
function harbourMasks(area){
 const launched=stageOf(state,'hb-departure')>=STAGES,out={after:[],before:[]};
 area.tasks.forEach((t,k)=>{const n=stageOf(state,t.id),grow=lastStage?.id===t.id?lastStage.stage:0;
  for(const [st,layer,x,y,rx,ry] of HARBOUR_REVEAL[t.id]??[]){if(st>n)continue;
   const size=st===grow?`var(--r${k})`:'1',into=t.id==='hb-boatyard'&&launched?'after':layer;
   out[into].push(`radial-gradient(ellipse calc(${size}*${rx}%) calc(${size}*${ry}%) at ${x}% ${y}%,#000 45%,transparent 100%)`);
   if(t.id==='hb-boatyard'&&launched&&st===STAGES)out.after.push(`radial-gradient(ellipse calc(${size}*12%) calc(${size}*9%) at 74% 52%,#000 45%,transparent 100%)`);}});
 const css=list=>list.length?list.join(','):'linear-gradient(transparent,transparent)';
 return {after:css(out.after),before:css(out.before)};
}
function sceneHtml(area){
 if(area.restored)return harbourScene(area);
 if(area.overview)return headlandScene(area);
 const done=areaDone(state,area),vars=area.tasks.map((t,k)=>{const n=stageOf(state,t.id),grow=lastStage?.id===t.id;return `--r${k}:${REVEAL[grow?lastStage.stage-1:n]}`;}).join(';');
 const masks=area.tasks.map((t,k)=>`radial-gradient(ellipse calc(var(--r${k})*1%) calc(var(--r${k})*2%) at ${t.at[0]}% ${t.at[1]}%,#000 40%,transparent 100%)`).join(',');
 const pic=area.map?`assets/premium/${area.map}.webp`:`assets/premium/${area.picture}-vibrant.webp`;
 return `<div class="beachScene ${done?'complete':''} ${area.map?'mapped':''}" data-area="${area.id}" data-built="${builtCount(state,area)}" style="--p:${(builtCount(state,area)/(area.tasks.length*STAGES)).toFixed(3)}"><img class="sceneBase" src="${pic}" alt="${area.name}, ${done?'fully restored':builtCount(state,area)+' of '+area.tasks.length*STAGES+' upgrades'}"><div class="sceneStorm" aria-hidden="true"></div>${area.id==='entrance'?`<div class="doorRings" data-stage="${stageOf(state,'vault-door')}" aria-hidden="true"><i></i><i></i><i></i></div>`:''}<img class="sceneColor" src="${pic}" alt="" aria-hidden="true" style="${vars};-webkit-mask-image:${masks};mask-image:${masks}"><div class="restored">${area.id==='vault'?'':placeIcons(area.tasks.filter(t=>stageOf(state,t.id)>0))}</div></div>`;
}
function harbourScene(area){
 const done=areaDone(state,area),built=builtCount(state,area),all=area.tasks.length*STAGES,m=harbourMasks(area);
 // a stage just bought starts at 0 and grows (growScene); every other uncovered spot is whole
 const vars=area.tasks.map((t,k)=>`--r${k}:${lastStage?.id===t.id?0:1}`).join(';');
 const base=`assets/premium/${area.map}.webp`,after=`assets/premium/${area.restored}.webp`;
 // (--r0…6 are registered without inheritance, next.css, so each layer carries them itself)
 return `<div class="beachScene mapped harbour ${done?'complete':''}" data-area="${area.id}" data-built="${built}" style="--p:${(built/all).toFixed(3)}"><img class="sceneBase" src="${base}" alt="${area.name}, ${done?'fully restored':built+' of '+all+' upgrades'}"><div class="sceneStorm" aria-hidden="true"></div><img class="sceneColor sceneOwn" src="${base}" alt="" aria-hidden="true" style="${vars};-webkit-mask-image:${m.before};mask-image:${m.before}"><img class="sceneColor" src="${after}" alt="" aria-hidden="true" style="${vars};-webkit-mask-image:${m.after};mask-image:${m.after}"><div class="restored"></div></div>`;
}
// Build 49a: Chapter 4's headland. The director's two paintings are not registered layers (the pack's
// art notes), so the map shows the damaged headland until every stage is built, then the restored one;
// it never uncovers patches. Each stage shows on its place's card and tile, with its own sprite.
const SCENE_ALT={'answering-light':['the headland restored and its light lit','headland'],lowwater:['the passage restored, its route lit and the lock working','reef passage'],keeper:['the station restored: the waterwheel turning, channels running and its lamps lit','station inside the Vault']};
function headlandScene(area){
 const done=areaDone(state,area),built=builtCount(state,area),all=area.tasks.length*STAGES;
 const pic=`assets/premium/${done?area.overview:area.map}.webp`;
 return `<div class="beachScene mapped headland ${done?'complete':''}" data-area="${area.id}" data-built="${built}"><img class="sceneBase" src="${pic}" alt="${area.name}, ${done?(SCENE_ALT[area.id]??SCENE_ALT['answering-light'])[0]:`the damaged ${(SCENE_ALT[area.id]??SCENE_ALT['answering-light'])[1]}: ${built} of ${all} stages built (each place's card shows its stage)`}"><div class="restored"></div></div>`;
}
// After the picture is drawn with the old size, the new one is set so the colour spreads.
function growScene(){
 if(!lastStage)return;const area=currentArea(state),k=area.tasks.findIndex(t=>t.id===lastStage.id),img=$('#coastMap .sceneColor');lastStage=null;
 if(!img||k<0)return;
 // the harbour (Build 48a): the stage's own reveal grows from 0 to whole, on the scene (both layers)
 if(area.restored){const layers=[...document.querySelectorAll('#coastMap .beachScene .sceneColor')];requestAnimationFrame(()=>requestAnimationFrame(()=>layers.forEach(l=>l.style.setProperty(`--r${k}`,1))));return;}
 requestAnimationFrame(()=>requestAnimationFrame(()=>img.style.setProperty(`--r${k}`,REVEAL[stageOf(state,area.tasks[k].id)])));
}
// The coast screen (Build 41e, user: "Bolhi baina 2000onii togloom bishdee yamar"): the area's
// picture fills the top with a marker on every place that can be built; one card for the
// chosen place says what its next stage needs (its gold order's parts, its coins) with one big
// button; the places sit below as a grid of tiles to choose from.
let mapFocus=null;
// What a place's gold order still lacks (Build 45h, user: "item dutaj baigaa ni sain
// anzaaragdahgui"): the parts not yet on the board, each with how many more, so the card and the
// strip can name them instead of a small "1/2".
const goldShort=id=>{const o=state.orders.find(o=>o.story===id);if(!o)return null;const miss=missingOf(state,o).map(r=>({...r,more:r.count-r.have}));return {o,miss,parts:miss.reduce((n,r)=>n+r.more,0)};};
const missText=miss=>miss.map(r=>`${r.more} × ${nameOf(item(r.family,r.tier))}`).join(', ');
function mapCard(area,t,u){
 const n=stageOf(state,t.id);
 if(n>=STAGES)return `<section id="mapCard" class="mapCard done" data-card="${t.id}"><span class="cardArt">${placeArt(t,n)}</span><div class="cardBody"><small class="cardPlace">${t.name}</small><h3>${t.stages[STAGES-1].name}</h3>${pips(n)}<p class="cardDone">Fully restored ✓</p></div><button class="cardButton replay" type="button" data-replay="${t.id}">Replay its story</button></section>`;
 // Build 47e (from PR #80): a stage that waits for another place (the hall for the archive, the
 // sea gate for the array) says which.
 // Build 47f: it names the place to finish first and offers to show it (from the stage's own
 // requirement, the first one not yet met).
 if(!u){const k=area.tasks.indexOf(t),b=blockedStage(state,t.id),need=b&&Object.entries(b.requires).find(([id,m])=>stageOf(state,id)<m);
  const label=need&&(LABELS[need[0]]??TASKS[need[0]].name),why=need?`Finish ${label} first.`:`Opens when ${area.tasks[k-1]?.name??'the place before it'} has its first stage.`;
  const sub=need?`<p class="cardWhy">It needs ${TASKS[need[0]].stages[need[1]-1].name} (stage ${need[1]} of ${STAGES}).</p>`:'';
  const go=need&&area.tasks.some(x=>x.id===need[0])?`<button class="cardButton go" type="button" data-select="${need[0]}">View ${label.replace(/^the /,'')}</button>`:'';
  return `<section id="mapCard" class="mapCard locked" data-card="${t.id}"><span class="cardArt ${n?'':'unbuilt'}">${placeArt(t,n)}</span><div class="cardBody"><small class="cardPlace">${b?`Stage ${b.stage}`:'Locked'}</small><h3>${b?b.name:t.name}</h3>${pips(n)}<p class="cardDone">${why}</p>${sub}</div>${go}</section>`;}
 const order=state.orders.find(o=>o.story===t.id),coinsOk=state.coins>=u.cost;
 const stuff=u.materials?`<span class="need ok"><b class="needIcon">✓</b><span>Materials</span></span>`
  :order?`<span class="need gold"><span class="needParts">${needsOf(state,order).map(r=>`<i class="${r.have>=r.count?'got':'short'}">${draw(item(r.family,r.tier))}${r.sibling?`<em class="needLv" aria-label="level ${levelOf(r)}">Lv${levelOf(r)}</em>`:''}<b>${r.have>=r.count?'✓ ':''}${r.have}/${r.count}</b></i>`).join('')}</span><span>Gold order</span></span>`
  :state.orders.some(o=>o?.story)?`<span class="need"><b class="needIcon">…</b><span>Gold order after ${TASKS[state.orders.find(o=>o?.story).story].name}, or choose this place</span></span>`
  :`<span class="need"><b class="needIcon">…</b><span>Gold order coming</span></span>`;
 const coins=`<span class="need ${coinsOk?'ok':''}"><b class="needIcon coinNeed">${COIN}</b><span><b>${Math.min(state.coins,u.cost)}</b>/${u.cost}</span></span>`;
 const short=!u.materials&&order?goldShort(t.id):null;
 // the missing parts, said in words under the needs (the coins can already be green)
 const lack=short?.parts?`<p class="needMissing"><b>Missing:</b> ${missText(short.miss)}</p>`:short?`<p class="needMissing ready"><b>All parts are on the board:</b> deliver the gold order</p>`:'';
 const button=canBuild(u)?`<button class="cardButton build" type="button" data-restore="${t.id}">Build · ${COIN} ${u.cost}</button>`
  :short?`<button class="cardButton go" type="button" data-make="${order.id}">${!short.parts?'Deliver the gold order':short.miss.length===1&&short.parts===1?`Make the missing ${nameOf(item(short.miss[0].family,short.miss[0].tier))}`:`Make ${short.parts} missing parts`}</button>`
  :!u.materials&&state.orders.some(o=>o?.story)?`<button class="cardButton go" type="button" data-aim="${t.id}">Work on this next</button>`
  :!u.materials?`<button class="cardButton go" type="button" data-go>Deliver an order</button>`
  :`<button class="cardButton go" type="button" data-go>Earn ${u.cost-state.coins} more ${COIN}</button>`;
 return `<section id="mapCard" class="mapCard ${canBuild(u)?'ready':''}" data-card="${t.id}"><span class="cardArt next">${placeArt(t,u.stage)}<em>Stage ${u.stage}</em></span><div class="cardBody"><small class="cardPlace">${n?t.stages[n-1].name:'New place'}</small><h3>${u.name}</h3>${pips(n)}<div class="needs">${stuff}${coins}</div>${lack}</div>${button}</section>`;
}
let focusOnOpen=false;
function showMap(){
 const area=currentArea(state),ups=upgrades(state),open=new Map(ups.map(u=>[u.id,u]));
 if(!$('#coastMap').open&&mapFocus&&area.tasks.some(t=>t.id===mapFocus))focusOnOpen=true;
 if(!area.tasks.some(t=>t.id===mapFocus))mapFocus=null;
 mapFocus??=(ups.find(canBuild)??ups.find(u=>u.materials)??ups.find(u=>state.orders.some(o=>o.story===u.id))??ups[0])?.id??area.tasks.at(-1).id;
 const focus=area.tasks.find(t=>t.id===mapFocus),total=area.tasks.length*STAGES,built=builtCount(state);
 const places=area.tasks.map(t=>{
  const n=stageOf(state,t.id),u=open.get(t.id);
  const status=n>=STAGES?'done':u&&canBuild(u)?'ready':u?'next':'locked';
  const badge=status==='done'?'<b class="tileBadge done">✓</b>':status==='ready'?'<b class="tileBadge ready">!</b>':status==='locked'?'<b class="tileBadge locked">🔒</b>':'';
  return `<li class="place ${t.id===mapFocus?'selected':''}" style="--i:${area.tasks.indexOf(t)}" data-status="${status}" data-place="${t.id}"><button type="button" data-select="${t.id}" aria-label="${t.name}: ${status==='done'?'complete':status==='locked'?'locked':status==='ready'?'ready to build':`stage ${n} of ${STAGES}`}"><span class="placeIcon ${t.art&&!n?'unbuilt':''}">${placeArt(t,n)}</span>${pips(n)}${badge}</button></li>`;
 }).join('');
 const markers=area.tasks.filter(t=>open.has(t.id)).map((t,k)=>{const u=open.get(t.id);return `<button type="button" class="siteMarker ${area.map?'small':''} ${area.map&&stageOf(state,t.id)&&ANCHORED.has(t.art)?'beside':''} ${canBuild(u)?'ready':''} ${t.id===mapFocus?'selected':''}" data-select="${t.id}" style="--i:${k};${markerAt(t)}" aria-label="${u.name}"><span>${canBuild(u)?'▲':'🔨'}</span></button>`;}).join('');
 // Finished areas stay listed above the current one, the ones still to come below it.
 const before=AREAS.slice(0,state.area).map(a=>`<section class="mapArea done"><div class="mapHead"><img src="assets/premium/${a.picture}-vibrant.webp" alt=""><div><h2>${a.name}</h2><b>Complete ✓</b></div></div></section>`).join('');
 const laterAreas=AREAS.slice(state.area+1);
 const later=laterAreas.map(a=>`<section class="mapArea coming"><div class="mapHead"><img src="assets/premium/${a.picture}-vibrant.webp" alt=""><div><h2>${a.name}</h2><b>${a.coming?'Not available yet':'Next'}</b></div></div></section>`).join('');
 // Build 44: the whole way to the Vault, small, at the top: areas done, this one, the ones still
 // to come, and the Vault itself at the end (all real areas; the later ones open in updates).
 // The progress strip is a scrollable, read-only journey; each label is unique.
 // The first three areas form Chapter 1, then one area per Chapter 2–6.
 const journeyNames={beach:'BEACH',worksite:'SURVEY',entrance:'VAULT',vault:'OBSERVATORY',harbour:'HARBOUR','answering-light':'LIGHT',lowwater:'REEF',keeper:'STATION'};
 const journey=`<ol class="journey" aria-label="Chapter and area progress">${AREAS.map((a,k)=>`<li class="${k<state.area?'done':k===state.area?'here':'later'} ${a.id==='vault'?'vault':''}"${k===state.area?' aria-current="step"':''} aria-label="Chapter ${k<3?1:k-1}: ${a.name}${k<state.area?', complete':k===state.area?', current':', upcoming'}"><img src="assets/premium/${a.picture}-vibrant.webp" alt=""><span>${journeyNames[a.id]??a.short}</span></li>`).join('')}</ol>`;
 $('#mapContent').innerHTML=`<div class="beachTop"><h2 id="mapTitle" class="mapTitle">${area.name}</h2><b class="beachCoins">${COIN} ${state.coins}</b></div>${journey}
  <div class="sceneWrap">${sceneHtml(area)}<div class="sceneLight" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div><div class="siteMarkers">${markers}</div>
  <div class="mapProgress" role="img" aria-label="${built} of ${total} stages in ${area.name}"><i style="width:${(100*built/total).toFixed(1)}%"></i><b>${built} / ${total} stages${areaDone(state)?' · complete!':''}</b></div></div>
  ${mapCard(area,focus,open.get(focus.id))}
  <ol class="places">${places}</ol>${before}${laterAreas.length?`<details class="mapFuture"><summary>Coming next · ${laterAreas.length} area${laterAreas.length>1?'s':''}</summary>${later}</details>`:''}
  <button class="backToBoard" type="button" data-back>Back to the board</button>`;
 // The place row scrolls sideways to keep the chosen place in view (Build 41n).
 {const row=$('#coastMap .places'),sel=row?.querySelector('.place.selected');if(sel)row.scrollLeft=Math.max(0,sel.offsetLeft-(row.clientWidth-sel.offsetWidth)/2);}
 // Opening plays the screen in (picture, pins, card, tiles); choosing another place swaps the card.
 const content=$('#mapContent'),opening=!$('#coastMap').open;
 content.classList.toggle('entering',opening);if(opening){clearTimeout(content._enter);content._enter=setTimeout(()=>content.classList.remove('entering'),1400);}
 if(!opening&&shownCard!==mapFocus)$('#mapCard')?.classList.add('swapIn');shownCard=mapFocus;
 // Build 51c: the guide's build step points at the build button on the coast screen too
 let coachBuild=null;{const st=coachActive(state)?coachStep(state):null;if(st?.id==='build'){coachBuild=$(`#coastMap [data-restore="${FIRST_PLACE}"]`);coachBuild?.classList.add('coachTarget');coachBuild?.insertAdjacentHTML('beforeend',`<span class="coachHand" aria-hidden="true">${HAND_SVG}<span class="handLabel">Tap to build</span></span>`);$('#mapCard')?.insertAdjacentHTML('beforebegin','<p class="coachLine">Coins and materials are ready: build it here.</p>');}}
 if(opening)$('#coastMap').showModal();
 // A closed dialog has no layout: center only after showModal gives the strip
 // its real width and chapter positions. Scroll the strip, never the page.
 {const strip=$('#coastMap .journey'),active=strip?.querySelector('[aria-current="step"]');
  if(strip&&active)strip.scrollLeft=Math.max(0,active.offsetLeft-strip.offsetLeft-(strip.clientWidth-active.offsetWidth)/2);}
 // the guided build: the Build button comes into view by itself (a smooth scroll; at once with reduced motion)
 if(coachBuild)setTimeout(()=>coachBuild.isConnected&&coachBuild.scrollIntoView({block:'center',behavior:reduced()?'auto':'smooth'}),opening&&!reduced()?450:0);
 // Opening on a chosen place (the next-place chip, an upgrade hint): the picture starts close on
 // it and pulls back to show the whole area, so the eye lands on the right building.
 if(opening&&focusOnOpen&&!reduced()){const sc=$('#coastMap .beachScene');if(sc){sc.style.setProperty('--fx',focus.at[0]+'%');sc.style.setProperty('--fy',focus.at[1]+'%');sc.classList.add('focusIn');setTimeout(()=>sc.classList.remove('focusIn'),1200);}}
 focusOnOpen=false;
 if(!$('#beat').open)growScene();
}
let shownCard=null;
// Effects on the coast screen are drawn inside it: the screen is a modal dialog, so anything on
// the page body would be hidden behind it (Build 41f).
function mapFx(cls,x,y,css='',ms=900){const el=document.createElement('i');el.className='mapFx '+cls;el.style.cssText=`left:${x}px;top:${y}px;${css}`;$('#coastMap').append(el);setTimeout(()=>el.remove(),ms);return el;}
function buildFx(id,from,was=0){
 if(reduced())return;
 // Before → after: the place as it stood fades and drops away while the new stage settles in,
 // with a little dust and light (Build 44).
 const t=TASKS[id];
 const icon=$(`#coastMap .restoredIcon[data-task="${id}"]`),scene=$('#coastMap .beachScene');const to=(icon??scene).getBoundingClientRect(),tx=to.x+to.width/2,ty=to.y+to.height/2;
 // Coins fly from the button to the place, then it is built with a thump, a ring and sparks.
 if(from)for(let k=0;k<6;k++){const fx=from.x+from.width/2+(k-2.5)*14,fy=from.y+from.height/2;mapFx('coinFly',fx,fy,`--dx:${tx-fx}px;--dy:${ty-fy}px;animation-delay:${k*55}ms`,900);}
 setTimeout(()=>{scene?.classList.remove('thump');void scene?.offsetWidth;scene?.classList.add('thump');icon?.classList.add('built');
  mapFx('buildRing',tx,ty,'',800);
  if(t?.art){const old=mapFx('stageOld',tx,ty,`width:${to.width}px;height:${to.height}px`,900);old.innerHTML=placeArt(t,was);if(!was)old.classList.add('unbuilt');}
  for(let k=0;k<8;k++){const a=Math.PI*(.15+.7*k/7),d=30+(k%3)*12;mapFx('dust',tx+(k-3.5)*6,ty+to.height*.3,`--dx:${Math.cos(a)*d*(k<4?-1:1)}px;--dy:${-Math.sin(a)*d*.35}px;animation-delay:${k*20}ms`,900);}for(let k=0;k<14;k++){const a=2*Math.PI*k/14,d=46+(k%3)*14;mapFx('buildSpark',tx,ty,`--dx:${Math.cos(a)*d}px;--dy:${Math.sin(a)*d}px;background:${k%2?'#ffe08a':'#ffffff'}`,800);}
  sfx('milestone');},520);
}
$('#mapContent').addEventListener('click',e=>{
 const r=e.target.closest('[data-restore]');if(r){const from=r.getBoundingClientRect(),cost=upgrades(state).find(u=>u.id===r.dataset.restore)?.cost,was=stageOf(state,r.dataset.restore);receipt=cost;const res=run({type:'restore',id:r.dataset.restore});if(!res.ok)receipt=null;if(res.ok&&!res.effects.nextArea)lastStage={id:res.task,stage:res.stage};if(res.ok&&stageOf(state,res.task)>=STAGES)mapFocus=null;
  // Build 47f: a stage that opens the next area behind a reveal (the inner ring) keeps its own area on
  // screen until the reveal has shown the way in; the new area is not shown before its door opens.
  if(!(res.ok&&res.effects.nextArea&&pendingReveals().some(v=>v.live(state))))showMap();if(res.ok&&!res.effects.nextArea)buildFx(res.task,from,was);return;}
 // Build 49a: work on another open place next (its gold order replaces the other one's; parts stay)
 const aim=e.target.closest('[data-aim]');if(aim){const r=run({type:'aim',id:aim.dataset.aim});if(r?.ok){mapFocus=aim.dataset.aim;showMap();}return;}
 const sel=e.target.closest('[data-select]');if(sel){mapFocus=sel.dataset.select;sfx('tap');showMap();return;}
 const make=e.target.closest('[data-make]');if(make){$('#coastMap').close();focusOrder=make.dataset.make;render();$('#message').textContent='The gold order is marked: make its parts and deliver it for the materials.';return;}
 const p=e.target.closest('[data-replay]');if(p){showBeat(p.dataset.replay,{},STAGES);return;}
 if(e.target.closest('[data-back],[data-go]'))$('#coastMap').close();
});
function rewardText(e={}){
 const out=[],wait=' (waits for a free space)';
 if(e.energy)out.push(`+${e.energy} energy`);
 if(e.boost)out.push(`${e.boost.milestone?'restoration '+e.boost.milestone:'first stage'}: +${e.boost.energy} energy`);
 if(e.copyId)out.push(`a ${SOURCES[e.copyId].name} to merge`+(e.copy>=0?'':wait));
 if(e.kit>=0&&state.board[e.kit]?.type==='kit')out.push(nameOf(state.board[e.kit]).replace(' · ',' for '));
 else if(e.kitFamily)out.push(`a crate for the ${SOURCES[e.kitFamily].name}`+wait);
 if(e.token!==undefined)out.push('a Tide token'+(e.token>=0?'':wait));
 if(e.cog!==undefined)out.push('a Brass cog'+(e.cog>=0?'':wait));
 if(e.slots)out.push('a fourth order card');
 out.push('+8 XP');
 return 'Rewards: '+out.join(' · ');
}
function showBeat(id,effects,stage=stageOf(state,id)){
 const area=AREAS.find(a=>a.tasks.some(t=>t.id===id)),t=area.tasks.find(t=>t.id===id),st=t.stages[Math.max(0,stage-1)];
 const extra=[];
 const next=AREAS[AREAS.indexOf(area)+1];
 // names that start with "The" are said once (Build 47e: "The Silent Observatory", "The Hidden Harbour")
 const bare=a=>a.name.replace(/^The /,'');
 // (when a reveal shows the way in, it says so itself: the Vault opening)
 const revealNext=effects?.nextArea&&pendingReveals().some(v=>v.live(state));
 if(effects?.nextArea&&!revealNext)extra.push(['bram',`${area.name} is complete! ${area.id==='beach'?'Up the cliff: the':'The'} ${bare(next)} is open.`]);
 else if(effects?.areaDone&&!effects.nextArea)extra.push(['bram',`${area.name} is complete!${next?` The ${bare(next)} is still to come.`:''}`]);
 // Build 49a: Chapter 4 keeps its four story cards for the big moments; a stage's own line is a short
 // caption with its rewards, never a dialog to tap through (the pack's interaction notes).
 const caption=!!area.overview,say=caption?(title,lines,cb)=>{receipt=null;cb();}:playLines;
 say(st.name,st.lines.concat(extra),()=>{const fresh=caption||effects&&Object.keys(effects).length,nxt=fresh?nextPlace():null;if(nxt&&!effects.nextArea)mapFocus=nxt.u.id;if(effects?.nextArea){render();if(!nextReveal()){showMap();showIntro();}}else if($('#coastMap').open)showMap();const icon=$(`#coastMap .restoredIcon[data-task="${id}"]`)??$(`.restoredIcon[data-task="${id}"]`);icon?.classList.add('upgraded');
  // The stage's rewards, said once the story has been told (build 22: every stage gives one).
  // One clear next step after the story: the next place to build, said with its rewards.
  const next=nxt&&!effects?.nextArea?` · Next: ${nxt.u.name}${nxt.ready?' (ready)':''}`:'';
  const said=caption?st.lines.map(([w,l])=>`${who$(w)}: “${l}” `).join(''):'';
  if(caption||effects&&Object.keys(effects).length)moment(`${st.name} · stage ${stage} of ${STAGES}`,said+(effects&&Object.keys(effects).length?rewardText(effects):'')+next,null);burst(($('#coastMap').open?$('#coastMap .beachScene'):board).getBoundingClientRect(),'gold',true);
  for(const i of [effects?.kit,effects?.copy,effects?.token,effects?.cog])if(i>=0)board.querySelector(`[data-index="${i}"]`)?.classList.add('unsealed');
  // Build 47e (from PR #80): a first generator of its kind from a stage (the Lens Bench) shows its chain.
  if(effects?.copyId&&[...state.board,...state.shed,...state.pending].filter(y=>y?.type==='source'&&y.id===effects.copyId).length===1)setTimeout(()=>newGeneratorMoment(effects.copyId),1400);
  if(pendingReveals().some(v=>v.live(state)))setTimeout(()=>nextReveal(()=>{if(allDone(state))setTimeout(showEnd,600);}),900);
  else if(effects?.areaDone&&allDone(state))setTimeout(showEnd,900);});
 sfx('milestone');
}
// The coins a bought stage cost, said on its story card (Build 41 M3, from PR #77's receipt).
let receipt=null;
function playLines(title,lines,done,{last='Continue'}={}){
 let n=0;const dlg=$('#beat'),spent=receipt;receipt=null;
 const show=()=>{const [who,line]=lines[n];$('#beatContent').innerHTML=`<div class="beat"><small>${title}</small>${spent?`<b class="beatReceipt">−${spent} coins</b>`:''}<div class="beatLine">${face(who)}<p><b>${who$(who)}</b>${line}</p></div><div class="beatDots">${lines.map((_,k)=>`<i class="${k===n?'on':''}"></i>`).join('')}</div><button class="primary" id="beatNext">${n<lines.length-1?'Next':last}</button></div>`;
  $('#beatNext').onclick=()=>{n++;if(n<lines.length)show();else{dlg.close();done?.();}};};
 show();if(!dlg.open)dlg.showModal();
}
// A generator level that opens a chain shows the whole new chain.
// A generator found in cargo shows its whole chain.
function newGeneratorMoment(gen){const c=CHAINS[GENERATOR_CHAINS[gen][0][0]];moment(`New generator: ${SOURCES[gen].name}!`,c.names.join(' → '),{type:'source',id:gen});}
function showIntro(){const a=currentArea(state);if(a.intro)playLines(a.name,a.intro);}
// ---------- reveals (Build 47b, from PR #80) ----------
// A chapter's big moments play once: each is marked seen (state.seen) when it is dismissed, so a
// reload before that shows it again and none after. They play in order, one after another; one the
// camp has moved past (it is no longer live: a save that loads later on) is marked without playing.
const REVEALS=[
 // the Vault door's intro, when a camp reaches the Vault Entrance (a finished Chapter 1 save too)
 {id:'door',when:s=>s.area>=2,live:s=>s.area===2&&!builtCount(s,AREAS[2]),play:done=>playLines(AREAS[2].name,AREAS[2].intro,done)},
 // the inner ring turns: Chapter 1 is complete and the Vault opens
 {id:'vault-open',when:s=>stageOf(s,'vault-door')>=STAGES,live:()=>true,play:done=>vaultReveal(done)},
 // Build 47d: inside, the Tide Archive (Chapter 2's first place); its intro, when the camp gets there
 // Build 47f: its last button marks the archive's gold order on the board, the first thing to do inside
 {id:'archive',when:s=>s.area>=3,live:s=>s.area===3&&!builtCount(s,AREAS[3]),play:done=>{const o=firstGold();playLines(AREAS[3].name,AREAS[3].intro,()=>{if(o)markGold(o);done();},{last:o?'Make the gold order':'Continue'});}},
 // Build 47e (PR #80's reveals D and E): the array wakes and reads a signal (where from, not who
 // sends it); the sea gate opens on a hidden harbour, the end of Chapter 2.
 {id:'obs-signal',when:s=>stageOf(s,'obs-array')>=STAGES,live:s=>stageOf(s,'obs-passage')<STAGES,play:done=>revealCard(signalCard(),()=>{done();mapFocus='obs-passage';showMap();},'View sea gate')},
 {id:'obs-harbour',when:s=>stageOf(s,'obs-passage')>=STAGES,live:()=>true,play:done=>revealCard(harbourCard(),done,AREAS[4]?.tasks.length?'Enter the harbour':'Continue')},
 // Build 48a: Chapter 3, the Hidden Harbour's story moments (the director's handoff), each once: the
 // arrival (a fresh rope at the landing), the crane's recovered chest, the signal answered; the launch
 // is the chapter's end card (showEnd). Each is marked seen when dismissed; one the camp has moved past
 // (a later save) is marked without playing. The arrival's button marks the landing's gold order.
 {id:'hb-arrival',when:s=>s.area>=4,live:s=>s.area===4&&!builtCount(s,AREAS[4]),play:done=>revealCard(storyCard('arrival'),()=>{done();const o=firstGold();if(o)markGold(o);},'Make the gold order')},
 {id:'hb-cargo',when:s=>stageOf(s,'hb-crane')>=STAGES,live:s=>stageOf(s,'hb-departure')<STAGES,play:done=>revealCard(storyCard('cargo'),done)},
 {id:'hb-signal',when:s=>stageOf(s,'hb-signal')>=STAGES,live:s=>stageOf(s,'hb-departure')<STAGES,play:done=>revealCard(storyCard('signal'),done)},
 // Build 49a: the launch was the end of the content; it is now Chapter 3's last card and leads on to the
 // headland (a camp that already saw it as the end card has it marked seen by load()).
 {id:'hb-launch',when:s=>stageOf(s,'hb-departure')>=STAGES,live:()=>true,play:done=>revealCard(launchCard(),done,AREAS[5]?.tasks.length?'Follow the light':'Continue')},
 // Chapter 4, the Answering Light (the pack's data/story-cards.json): the arrival once (its button marks
 // the landing's gold order), the keeper's log and the first light each once; the stored message is the
 // chapter's end card (showEnd). One the camp has moved past is marked seen without playing.
 {id:'ch4-arrival',when:s=>s.area>=5,live:s=>s.area===5&&!builtCount(s,AREAS[5]),play:done=>revealCard(headlandCard('arrival'),()=>{done();const o=firstGold();if(o)markGold(o);},'Secure the landing')},
 {id:'ch4-log',when:s=>stageOf(s,'ch4-cottage')>=STAGES,live:s=>stageOf(s,'ch4-relay')<STAGES,play:done=>revealCard(headlandCard('log'),()=>{done();mapFocus='ch4-records';showMap();},'Open the signal room')},
 {id:'ch4-light',when:s=>stageOf(s,'ch4-lighthouse')>=STAGES,live:s=>stageOf(s,'ch4-relay')<STAGES,play:done=>revealCard(headlandCard('light'),()=>{done();mapFocus='ch4-relay';showMap();},'Check the relay')},
 // Build 50a: the stored message was the end of the content; it is now Chapter 4's last card and leads
 // on to the reef (a camp that already saw it as the end card has it marked seen by load()).
 {id:'ch4-message',when:s=>stageOf(s,'ch4-relay')>=STAGES,live:()=>true,play:done=>revealCard(messageCard(),done,AREAS[6]?.tasks.length?'Follow the route':'Continue')},
 // Chapter 5, the Lowwater Passage (the pack's story-cards.json): the arrival once (its button marks the
 // landing's gold order), the safe crossing and the working route each once; "Behind the Vault" is the
 // chapter's end card (showEnd). One the camp has moved past is marked seen without playing.
 {id:'ch5-arrival',when:s=>s.area>=6,live:s=>s.area===6&&!builtCount(s,AREAS[6]),play:done=>revealCard(passageCard('arrival'),()=>{done();const o=firstGold();if(o)markGold(o);},'Secure the reef landing')},
 {id:'ch5-crossing',when:s=>stageOf(s,'ch5-gauge')>=STAGES,live:s=>stageOf(s,'ch5-lock')<STAGES,play:done=>revealCard(passageCard('crossing'),()=>{done();mapFocus='ch5-bridge';showMap();},'Secure the rope bridge')},
 {id:'ch5-ledger',when:s=>stageOf(s,'ch5-shelter')>=STAGES,live:s=>stageOf(s,'ch5-lock')<STAGES,play:done=>revealCard(passageCard('ledger'),()=>{done();mapFocus='ch5-desk';showMap();},'Restore the mail desk')},
 // Build 51a: "Behind the Vault" was the end of the content; it is now Chapter 5's last card and leads on
 // into the station (a camp that already saw it as the end card has it marked seen by load()).
 {id:'ch5-station',when:s=>stageOf(s,'ch5-lock')>=STAGES,live:()=>true,play:done=>revealCard(stationCard(),done,AREAS[7]?.tasks.length?'Enter the inner station':'Continue')},
 // Chapter 6, the Keeper's Promise (the pack's story-cards.json): the station once (its button marks the
 // landing's gold order), the keeper after her workshop, the letter after the dispatch desk; "A coast
 // awake" is the end card of the first story (showEnd). One the camp has moved past is marked seen.
 {id:'ch6-arrival',when:s=>s.area>=7,live:s=>s.area===7&&!builtCount(s,AREAS[7]),play:done=>revealCard(keeperCard('station'),()=>{done();const o=firstGold();if(o)markGold(o);},'Secure the inner landing')},
 {id:'ch6-keeper',when:s=>stageOf(s,'ch6-workshop')>=STAGES,live:s=>stageOf(s,'ch6-overlook')<STAGES,play:done=>revealCard(keeperCard('keeper'),()=>{done();mapFocus='ch6-regulator';showMap();},'Restore the tide regulator')},
 {id:'ch6-letter',when:s=>stageOf(s,'ch6-desk')>=STAGES,live:s=>stageOf(s,'ch6-overlook')<STAGES,play:done=>revealCard(keeperCard('letter'),()=>{done();mapFocus='ch6-overlook';showMap();},'Connect the signal lamps')}
];
const markSeen=id=>{if(!state.seen?.[id]&&act(state,{type:'seen',id},Date.now()).ok){persist();playlog.event('reveal',{id});}};
const pendingReveals=()=>REVEALS.filter(v=>v.when(state)&&!state.seen?.[v.id]);
// Build 48b: one reveal at a time. A stage that opens the next area starts its reveal at once and its
// story callback also queued nextReveal 900 ms later; the reveal is marked seen only when it ends, so
// the second call restarted it (the Vault opening jumped back to its first scene: WebKit CI, then
// reproduced in Chromium). A call while one plays waits: its callback runs when the chain ends.
let revealOn=false;const revealAfter=[];
function nextReveal(done=()=>{}){
 if(revealOn){revealAfter.push(done);return true;}
 let v;while((v=pendingReveals()[0])&&!v.live(state))markSeen(v.id);
 if(!v){done();for(const d of revealAfter.splice(0))d();return false;}
 revealOn=true;
 v.play(()=>{revealOn=false;markSeen(v.id);render();nextReveal(done);});
 return true;
}
// One reveal card in the story dialog (PR #80); Continue or Escape closes it.
function revealCard(html,done,label='Continue'){
 const dlg=$('#beat'),finish=()=>{dlg.oncancel=null;dlg.close();done();};
 if($('#coastMap').open)$('#coastMap').close();
 $('#beatContent').innerHTML=`<div class="beat vaultReveal">${html}<button class="primary" id="beatNext">${label}</button></div>`;
 $('#beatNext').onclick=finish;dlg.oncancel=e=>{e.preventDefault();finish();};
 if(!dlg.open)dlg.showModal();
}
// The gold order for the first stage the camp can build, marked on the board with what it still lacks.
const firstGold=()=>{const u=upgrades(state).find(u=>!u.materials);return u&&state.orders.find(o=>o?.story===u.id);};
function markGold(o){
 if($('#coastMap').open)$('#coastMap').close();focusOrder=o.id;render();
 const t=TASKS[o.story],u=upgrades(state).find(u=>u.id===o.story),short=goldShort(o.story);
 $('#message').textContent=`${u?u.name:t.name}: ${short?.parts?`make ${missText(short.miss)} for its gold order.`:'its gold order is ready to deliver.'}`;
}
const revealLine=(who,line)=>`<p class="revealLine ${GUESTS[who]?'noFace':''}">${face(who)}<span><b>${who$(who)}</b>${line}</span></p>`;
const nextLine=()=>{const u=upgrades(state)[0];if(!u)return '';const gold=state.orders.some(o=>o?.story===u.id);return `<p class="revealNext"><b>Next</b>${u.name}${gold?' · its gold order is on the board':''}</p>`;};
// The array wakes (its own stage-3 picture, with a beam of light in CSS).
function signalCard(){return `<small>The Silent Observatory · the array</small><div class="revealStage signal" aria-hidden="true"><img class="revealDoor" src="assets/premium/coast/place-obs-array-3.webp" alt="" draggable="false"><i class="beam"></i></div><h3>A signal on one bearing</h3>${revealLine('tamsin','Three long, two short: the call sign in their logs. I can tell where it comes from. Not who sends it, or how long it has been sending.')}${nextLine()}`;}
// The sea gate opens (harbour-view is PR #80's small placeholder picture: missing art, see the doc).
// Build 48a: it is Chapter 2's end and leads into Chapter 3, the Hidden Harbour.
function harbourCard(){const next=AREAS[4]?.tasks.length;return `<small>${next?'Chapter 2 complete':'The Silent Observatory'} · the sea gate</small><div class="revealPanel single" aria-hidden="true"><img class="panelTo" src="assets/premium/coast/harbour-view.webp" alt="" draggable="false"></div><h3>A hidden harbour</h3>${revealLine('bram','The bearing runs straight through it. Who sent that signal, and what happened in that harbour?')}${next?'<p class="revealNext"><b>Next</b>Chapter 3 · The Hidden Harbour</p>':''}`;}
// Build 48a: the Hidden Harbour's story moments (story panels cut by tools/harbour-art.py; the arrival
// has a sea mist over the harbour behind the arch, which the master paints already repaired). The
// picture is described for screen readers. "Next" names the real next step, or what it waits for.
const HARBOUR_STORY={
 arrival:{tag:'Chapter 3 · The Hidden Harbour',title:'A fresh rope',who:'bram',line:'This knot is fresh. Someone has used this landing.',alt:'Through the sea gate: a mooring post with a freshly tied rope, and a quiet harbour beyond, half hidden in sea mist.',next:['hb-landing']},
 cargo:{tag:'The Hidden Harbour · the crane',title:'Recovered cargo',who:'neri',line:'That mark again. Bring the chest ashore: we may find its route in the harbour records.',alt:'The crane lifts a navy and brass chest out of the water; a wave emblem is set into its lid.',next:['hb-registry']},
 signal:{tag:'The Hidden Harbour · the signal tower',title:'An answering light',who:'tamsin',line:'There. Across the water. A light answered us.',alt:'At dusk the signal tower sends a sea-green beam over the water; far off on a headland, a small light answers.',next:['hb-boatyard','hb-departure']}
};
function storyCard(key){const v=HARBOUR_STORY[key];return `<small>${v.tag}</small><div class="revealPanel story"><img class="panelTo" src="assets/premium/coast/hidden-harbour/story-${key}.webp" alt="${v.alt}" draggable="false"></div><div class="storyCopy"><h3>${v.title}</h3>${revealLine(v.who,v.line)}${harbourNext(v.next)}</div>`;}
// Build 49a: the launch, Chapter 3's last card (it was the end card), leading on to Chapter 4.
function launchCard(){const next=AREAS[5];return `<small>${next?'Chapter 3 complete':'The Hidden Harbour'} · the departure dock</small><div class="revealPanel story"><img class="panelTo" src="assets/premium/coast/hidden-harbour/story-departure.webp" alt="The repaired boat with its ivory and coral sail leaves the harbour in daylight, the restored landing, warehouse and signal tower behind it." draggable="false"></div><div class="storyCopy"><h3>The boat is ready</h3>${revealLine('ivo','The boat is ready. Now we have a direction.')}${next?`<p class="revealNext"><b>Next</b>Chapter 4 · ${next.name}</p>`:''}</div>`;}
// Chapter 4's story cards (the pack's four text-free portrait paintings, lines from its story-cards.json,
// the crew's own portraits). The first light sweeps its beam once (1.8 s, reduced motion: a still glow).
const HEADLAND_STORY={
 arrival:{tag:'Chapter 4 · The Answering Light',title:'A light without a keeper',lines:[['bram','The tower is dark. That small light answered us.'],['ivo','First we need a safe way up.']],alt:'The headland seen from the water: a dark lighthouse on the cliff, a broken landing below and a small brass light glowing beside the ruins.',pos:'50% 32%',next:['ch4-landing']},
 log:{tag:'The Answering Light · the keeper\'s cottage',title:'A reply left waiting',lines:[['neri','The keeper describes a machine that answers a signal on its own.'],['tamsin','Then we have found the reply. We still do not know who left it.']],alt:'The keeper\'s logbook open on a desk by the window: drawings of brass gears, a lens and a reflector.',pos:'40% 58%',next:['ch4-records']},
 light:{tag:'The Answering Light · the lighthouse',title:'The headland wakes',lines:[['tamsin','The main light is steady. The relay can use it now.'],['bram','A safe light for every boat that follows us.']],alt:'At sunset the lighthouse on the headland is lit, its sea-green beam reaching out over the water.',pos:'50% 22%',beam:true,next:['ch4-relay']}
};
function headlandCard(key){const v=HEADLAND_STORY[key];return `<small>${v.tag}</small><div class="revealPanel story portrait ${v.beam?'beamOnce':''}"><img class="panelTo" src="assets/premium/coast/answering-light/story-${key}.webp" alt="${v.alt}" draggable="false" style="object-position:${v.pos}">${v.beam?'<i class="beamSweep" aria-hidden="true"></i>':''}</div><div class="storyCopy"><h3>${v.title}</h3>${v.lines.map(([w,l])=>revealLine(w,l)).join('')}${harbourNext(v.next)}</div>`;}
// Build 50a: Chapter 4's end card (the relay's stored message) as its last story card, leading on.
function messageCard(){const next=AREAS[6];return `<small>${next?'Chapter 4 complete':'The Answering Light'} · the signal relay</small><div class="revealPanel story portrait"><img class="panelTo" src="assets/premium/coast/answering-light/story-message.webp" alt="On the headland the relay's brass frame holds a lit sea-green orb; below it a chart is unrolled, a route marked through the reef." draggable="false" style="object-position:50% 40%"></div><div class="storyCopy"><h3>A route through the reef</h3>${revealLine('neri','A passage through the reef, marked for low water.')}${revealLine('bram','Someone left a way through. We still have to learn why.')}${next?`<p class="revealNext"><b>Next</b>Chapter 5 · ${next.name}</p>`:''}</div>`;}
// Chapter 5's story cards: lines from the pack's story-cards.json. Its storyboard's panels are concept
// art, cut by tools/lowwater-art.py. The working route has no painting: the pack's panel for it shows a
// generated emblem that is not the letter's wave seal (its ART_REVIEW.md), and Neri's line names the
// seal, so the card shows the restored shelter's own sprite instead of a wrong seal.
const PASSAGE_STORY={
 arrival:{tag:'Chapter 5 · The Lowwater Passage',title:'The water has pulled back',lines:[['bram','The water has pulled back. The marked stones lead through the reef.']],pic:'story-arrival',alt:'At low water a line of mossy stepping stones runs through the reef toward a white city on the far cliffs.',next:['ch5-landing']},
 crossing:{tag:'The Lowwater Passage · the tide gauge',title:'The safe crossing',lines:[['tamsin','These tide marks explain when the route is safe. We can repair the crossing.']],pic:'story-route',alt:'An old chart held open: a dotted route runs from the reef through the stepping stones toward the cliffs.',next:['ch5-bridge']},
 ledger:{tag:'The Lowwater Passage · the courier shelter',title:'A working route',lines:[['neri','The same wave seal. This ledger records deliveries to the inner station.']],sprite:'place-ch5-shelter-3',alt:'The courier shelter restored: a striped canopy, lanterns lit and crates ready to carry on.',next:['ch5-desk']}
};
function passageCard(key){const v=PASSAGE_STORY[key];return `<small>${v.tag}</small><div class="revealPanel story ${v.sprite?'sprite':''}"><img class="panelTo" src="assets/premium/coast/lowwater-passage/${v.pic??v.sprite}.webp" alt="${v.alt}" draggable="false"></div><div class="storyCopy"><h3>${v.title}</h3>${v.lines.map(([w,l])=>revealLine(w,l)).join('')}${harbourNext(v.next)}</div>`;}
// Build 51a: Chapter 5's end card ("Behind the Vault") as its last story card, leading on.
function stationCard(){const next=AREAS[7];return `<small>${next?'Chapter 5 complete':'The Lowwater Passage'} · the inner lock</small><div class="revealPanel story"><img class="panelTo" src="assets/premium/coast/lowwater-passage/story-station.webp" alt="Beyond the restored lock, a tall brass door with a sun-wheel stands open on lit steps; water runs in channels on either side." draggable="false"></div><div class="storyCopy"><h3>Behind the Vault</h3>${revealLine('ivo','The passage leads back beneath the Vault. Someone kept this route marked.')}${next?`<p class="revealNext"><b>Next</b>Chapter 6 · ${next.name}</p>`:''}</div>`;}
// Chapter 6's story cards: lines from the pack's story-cards.json, adjusted to the intro's letter (it was
// unsigned and closed with the wave seal; its words were never shown, so Mara says why she sent it and
// why it bore the seal, not what it said). The relay's automatic reply (Chapter 4) is a separate thing:
// Mara says so. Her picture is the pack's storyboard panel; her lines show her name only (no portrait).
const KEEPER_STORY={
 station:{tag:'Chapter 6 · The Keeper\'s Promise',title:'The station',lines:[['tamsin','The Vault protected a coastal station. Its channels and lights once served the whole harbour.']],pic:'story-station',alt:'Inside the Vault: a great hall of stone channels and fountains under a sunburst window, a traveller with a pack looking in.',next:['ch6-landing']},
 keeper:{tag:'The Keeper\'s Promise · the keeper\'s workshop',title:'The keeper',lines:[['mara','I sent the letter. When the routes failed, I could no longer maintain this station alone.'],['mara','The light on the headland answers by itself. The letter was mine.']],pic:'story-keeper',alt:'In a workshop full of charts and brass instruments, an elderly keeper with a silver braid and a navy coat smiles and holds out a sealed letter.',next:['ch6-regulator']},
 letter:{tag:'The Keeper\'s Promise · the dispatch desk',title:'Why the letter',lines:[['mara','The wave seal was our promise: a safe way home. I left the letter unsigned and trusted the seal to lead you to the Vault, so that promise could live again.']],pic:'story-work',alt:'Crews on scaffolds repair the station\'s arches while water pours through its restored channels.',next:['ch6-overlook']}
};
function keeperCard(key){const v=KEEPER_STORY[key];return `<small>${v.tag}</small><div class="revealPanel story"><img class="panelTo" src="assets/premium/coast/keepers-promise/${v.pic}.webp" alt="${v.alt}" draggable="false"></div><div class="storyCopy"><h3>${v.title}</h3>${v.lines.map(([w,l])=>revealLine(w,l)).join('')}${harbourNext(v.next)}</div>`;}
function harbourNext(ids){
 for(const id of ids){const u=upgrades(state).find(u=>u.id===id);if(u){const gold=state.orders.some(o=>o?.story===u.id);return `<p class="revealNext"><b>Next</b>${u.name}${gold?' · its gold order is on the board':''}</p>`;}}
 for(const id of ids){const b=blockedStage(state,id);if(b){const wait=Object.entries(b.requires).filter(([p,n])=>stageOf(state,p)<n).map(([p,n])=>TASKS[p].stages[n-1].name);return `<p class="revealNext"><b>Next</b>${b.name} · after ${wait.join(' and ')}</p>`;}}
 return nextLine();
}
// The Vault opens (PR #80's Reveal A, with the coast's own Vault, Build 47f): the inner ring lights
// and light runs down the seam; the door's two halves swing inward on their hinges and the
// Observatory's interior shows behind them; then inside. The halves are the Home picture itself, cut
// along the painted seam (story-intro.mjs); a painted open-door frame for this Vault does not exist
// yet (docs/V5_CHAPTER2_INTEGRATION_2026-10-28.md, missing art). Skipping reaches the same state: the
// reveal gives nothing, the inner ring's rewards came with its stage.
const VAULT_ART='assets/premium/coast/home/home-bg.webp',VAULT_INSIDE='assets/premium/observatory-map.webp';
// the round door on the Home picture, in its pixels: centre, radii (it is a little taller than wide), the seam
const VAULT_DOOR={cx:457,cy:635,rx:224,ry:231,seam:463,inside:VAULT_INSIDE},VAULT_LIGHT=[463/941,635/1672,224/941];
function vaultReveal(done){
 for(const id of ['coastMap','beat'])if($('#'+id).open)$('#'+id).close();
 playScenes({label:'Chapter 1 complete',last:'Enter the Vault',reduced,face:who=>`assets/premium/coast/ui/${FACES[who]}.webp`,scenes:[
  {id:'vault-seam',src:VAULT_ART,pos:'47% 37%',fx:'seam',light:VAULT_LIGHT,door:VAULT_DOOR,who:null,alt:'The Vault door in the cliff: its three rings glow and a line of light runs down its seam.',text:'The inner ring locks into place. All three rings glow, and light runs down the seam of the Vault door.'},
  {id:'vault-open',src:VAULT_ART,pos:'47% 37%',fx:'open',door:VAULT_DOOR,who:'neri',alt:'The two halves of the Vault door stand open; a lit hall of instruments shows inside.',text:'It opens. After all this time, the Vault is open.'},
  {id:'vault-inside',src:VAULT_INSIDE,pos:'50% 40%',who:null,alt:'Inside the Vault: a quiet hall of lamps, desks, charts and a brass ring of instruments around a glass orb.',text:'Inside, a passage leads to a silent hall of lamps, desks and brass rings. Chapter 2 begins here.'}]}).then(()=>done());
}

$('#build').textContent='COAST CAMP · '+BUILD.toUpperCase();
// CrazyGames lifecycle (Build 41 M7; no-ops without the SDK): loading until the page has loaded,
// then gameplay whenever no menu, end screen, log, ad or hidden tab is in the way.
// Build 46p: loading ends when Home is usable (home.ready), not when every picture is in.
let home=null;
initPlatform().then(on=>{if(!on)return;platform.loadingStart();const stop=()=>{platform.loadingStop();syncPlaying();};home?home.ready.then(stop):document.readyState==='complete'?stop():addEventListener('load',stop,{once:true});});
const syncPlaying=()=>platform.setPlaying(!homeOpen&&!adBusy&&!document.hidden&&!document.querySelector('#menu[open],#help[open],#playlog[open],#endDialog[open],#adStandIn[open]'));
document.addEventListener('visibilitychange',syncPlaying);
// What the playtest log keeps of an action (Build 41 M6).
function logResult(a,r,before){
 playlog.touch();
 if(r.event==='merge')playlog.milestone('firstMerge');
 if(r.event==='deliver'){playlog.milestone('firstOrder');playlog.event('order',{coins:r.coins});}
 if(r.effects?.areaDone)platform.happytime();
 if(r.event==='restore'){playlog.milestone('firstStage');playlog.event('stage',{task:r.task,stage:r.stage});if(r.effects?.nextArea)playlog.event('area',{id:r.effects.nextArea});}
 for(const n of r.released??[])playlog.event('generator',{id:n.id});
 if(r.event==='unseal'||r.event==='producerUp')playlog.milestone('firstDiscovery');
 if(before.energy>0&&state.energy===0)playlog.event('energyOut');
 if(['ration','shop','swapOrder','daily'].includes(r.event))playlog.event(r.event,r.event==='shop'?{id:r.id,ad:r.ad}:r.event==='swapOrder'?{ad:r.ad}:undefined);
 if(r.event==='seenEnd')playlog.milestone('complete',{orders:state.ordersDone});
}
let adOffered=false;
// The end of this prototype (Build 41 M5): once, after the last stage or on the next visit.
function showEnd(){
 if(!allDone(state)||state.seenEnd)return;run({type:'seenEnd'});playlog.flush();
 // Build 47f: the stats are labelled for what they count. Stages: every stage bought, all areas so
 // far (Chapters 1 and 2: 63). Generator types: the kinds found (a part of its chain found, or one
 // owned on the board, in the shed or waiting), not how many generators stand on the board.
 const owned=[...state.board,...state.shed,...state.pending],kinds=Object.keys(GENERATOR_CHAINS).filter(g=>state.found.some(k=>k.replace(/\d+$/,'')===g)||owned.some(x=>x?.type==='source'&&x.id===g)).length;
 const stages=Object.values(state.built).reduce((a,b)=>a+b,0),all=AREAS.reduce((n,a)=>n+a.tasks.length*STAGES,0),last=AREAS.filter(a=>a.tasks.length).at(-1),next=AREAS.slice(AREAS.indexOf(last)+1).find(a=>a.coming);
 // The content ends with Chapter 2 (Build 47e): the sea gate open on the Hidden Harbour. The achievement
 // and its picture first, a short line, then the totals; what comes next is said to be unavailable,
 // never offered (no button) and never promised. Build 47b's Chapter 1 card is gone: Chapter 1 now
 // leads into the Vault, so the camp's end is always Chapter 2's.
 // Build 48a: the content ends with Chapter 3, the Hidden Harbour: the launch (the director's departure
 // panel and Ivo's line) is its end card, once. No Chapter 4 is offered or promised.
 // Build 49a: the content ends with Chapter 4, the Answering Light: the relay's stored message (the
 // pack's fourth story card) is its end card, once, with this chapter's own count and the camp's
 // labelled apart. No Chapter 5 is offered or promised (no button): "the story so far" only.
 // Build 51a: the content ends with Chapter 6, the Keeper's Promise, the end of the first story: "A coast
 // awake" (the pack's fourth card) is its end card, once: the crew and Mara together, this chapter's
 // count and the camp's labelled apart. Its buttons are real: the restored station on the coast screen,
 // the board (crew orders, the shop and the book go on). Chapter 5's "Behind the Vault" is now its last
 // story card (stationCard). Nothing further is offered or promised: no Chapter 7 button.
 const harbour=last.id==='harbour',keeper=last.id==='keeper';
 if(keeper){const here=builtCount(state,last),all6=last.tasks.length*STAGES;
  $('#endContent').innerHTML=`<figure class="endArt"><img src="assets/premium/coast/keepers-promise/story-coast.webp" alt="At sunset the restored harbour is full of boats under wave-seal sails; on the quay the crew and the keeper celebrate among the townsfolk." draggable="false"></figure>
  <small class="endTag">Chapter 6 complete · The first story</small><h2 id="endTitle">A coast awake</h2>
  ${revealLine('bram','The routes are open, the lights are answering, and the harbour is home again.')}${revealLine('mara','You kept the promise. This station is yours to visit, any day.')}
  <p class="endLine">You opened the Vault, restored the station it guarded and answered the keeper's letter.</p>
  <p class="endNext">The first story is complete. Crew orders, the shop and the collection book carry on.</p>
  <section class="endStats" aria-label="This chapter and your camp"><h3>The Keeper's Promise</h3><dl>
   <div><dt>This chapter's stages</dt><dd>${here} / ${all6}</dd></div><div><dt>All chapters</dt><dd>${stages} / ${all}</dd></div><div><dt>Crew orders delivered</dt><dd>${state.ordersDone}</dd></div><div><dt>Generator types found</dt><dd>${kinds}</dd></div></dl></section>
  <button class="primary" type="button" data-view>View the restored coast</button><button class="menuButton" type="button" data-keep>Return to board</button><button class="menuButton" type="button" data-feedback>Share feedback</button>`;
  $('#endDialog').showModal();return;}
 $('#endContent').innerHTML=(harbour?`<figure class="endArt"><img src="assets/premium/coast/hidden-harbour/story-departure.webp" alt="The repaired boat with its ivory and coral sail leaves the harbour in daylight, the restored landing, warehouse and signal tower behind it." draggable="false"></figure>
  <small class="endTag">Chapter 3 complete</small><h2 id="endTitle">The boat is ready</h2>
  <p class="endLine">Ivo: “The boat is ready. Now we have a direction.”</p>`:`<figure class="endArt" aria-hidden="true"><img src="assets/premium/coast/harbour-view.webp" alt="" draggable="false"></figure>
  <small class="endTag">Chapter 2 complete</small><h2 id="endTitle">The sea gate is open</h2>
  <p class="endLine">The array has a bearing, and the gate opens on a hidden harbour.</p>`)+`
  <p class="endNext">This is the end of the story so far.${next?` ${next.name} is not available yet.`:''}</p>
  <section class="endStats" aria-label="Your camp so far"><h3>Your camp so far</h3><dl>
   <div><dt>Restoration stages</dt><dd>${stages} / ${all}</dd></div><div><dt>Crew orders delivered</dt><dd>${state.ordersDone}</dd></div><div><dt>Generator types found</dt><dd>${kinds}</dd></div></dl>
   <p>Crew orders keep coming. Their coins carry over, and the shop takes them.</p></section>
  <button class="primary" type="button" data-keep>Keep playing</button><button class="menuButton" type="button" data-feedback>Share feedback</button>`;
 $('#endDialog').showModal();
}
$('#endContent').addEventListener('click',e=>{if(e.target.closest('[data-keep]'))$('#endDialog').close();if(e.target.closest('[data-view]')){$('#endDialog').close();mapFocus=null;showMap();}if(e.target.closest('[data-feedback]')){$('#endDialog').close();showPlaylog(true);}});
// The playtest log screen: copy or download it, or clear it (the game's save is not touched).
const QUESTIONS='1. What was the most fun?\n2. Where did you get stuck or bored?\n3. Would you play again tomorrow? Why?';
function showPlaylog(ask=false){
 playlog.flush();const json=playlog.toJSON(),sum=JSON.parse(json).summary;
 $('#playlogContent').innerHTML=`<h2 id="playlogTitle">Playtest log</h2><p>Kept only in this browser and never sent anywhere: ${sum.sessions} sessions, ${sum.totalMinutes} minutes, ${sum.events} events. Copy it into your message to the team.</p>
  ${ask?`<p class="playlogAsk">${QUESTIONS.replace(/\n/g,'<br>')}</p>`:''}
  <textarea id="playlogText" readonly rows="6" aria-label="Playtest log as JSON">${(ask?QUESTIONS+'\n\n':'')+json}</textarea>
  <div class="playlogButtons"><button class="primary" type="button" data-copy>Copy</button><button class="menuButton" type="button" data-download>Download .json</button><button class="menuButton danger" type="button" data-clear>Clear log</button></div>`;
 if(!$('#playlog').open)$('#playlog').showModal();
}
$('#playlogContent').addEventListener('click',async e=>{
 const text=$('#playlogText');
 if(e.target.closest('[data-copy]')){try{await navigator.clipboard.writeText(text.value);$('#playlogContent [data-copy]').textContent='Copied';}catch{text.select();document.execCommand?.('copy');$('#playlogContent [data-copy]').textContent='Selected · copy it';}}
 if(e.target.closest('[data-download]')){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([playlog.toJSON()],{type:'application/json'}));a.download='coast-camp-playtest.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
 if(e.target.closest('[data-clear]')&&confirm('Clear the playtest log? Your game is not affected.')){playlog.clear();showPlaylog();}
});
$('#playlogButton').onclick=()=>{$('#menu').close();showPlaylog();};
// At most two things call for attention outside the board at once (Build 41 M3), in this order:
// an affordable upgrade, energy from an ad when low, the daily gift, parts waiting in the book.
function calmBadges(){let n=0;for(const el of [$('#mapReady'),$('#adEnergyButton'),$('#dailyButton'),$('#bookCount')]){if(el.hidden)continue;if(n>=2){el.hidden=true;if(el.id==='bookCount')$('#bookButton').classList.remove('ready');}else n++;}}
render();header();setInterval(()=>{header();placeHand();if(state.energy<1)renderHint();offerGift();$('#dailyButton').hidden=!giftReady();calmBadges();syncPlaying();},1000);
// What happens on arriving at the board: once at the start without Home, and each time from Home.
let storyJustPlayed=false;
function arrive(fromHome=true){
 if(holdSave&&!damaged){holdSave=false;persist();}
 syncPlaying();if(fromHome)$('#hint').focus({preventScroll:true});
 // Build 51c: a story played to its end already says what to do first, so no second introduction follows
 // it; a skipped story is followed by the beach's one line (the same words)
 if(!state.moves){if(!storyJustPlayed)showIntro();}
 else{extrasNews();nextReveal(()=>{if(allDone(state)&&!state.seenEnd)setTimeout(showEnd,600);});}
 storyJustPlayed=false;
}
// Home and Loading (Build 46p): the board above is set up once; Home only covers and uncovers it.
if(document.getElementById('home')){
 const stagesBuilt=()=>{const a=currentArea(state);return a.tasks.reduce((n,t)=>n+stageOf(state,t.id),0);};
 home=createHome({boot:window.VWBoot??null,hasSave:!!rawSave&&!damaged,damaged,newer,kept:()=>kept().length,onKept:showKept,
  chapter:()=>{const a=currentArea(state);return a?.tasks?.length?`${a.name} · ${stagesBuilt()} of ${a.tasks.length*STAGES} stages built`:a?.name??'';},
  onEnter:arrive,onSettings:()=>$('#menuButton').onclick(),onBook:showBook,
  onNewCamp:()=>{if(!confirm('Start a new camp? The save that could not be read stays in this browser as a backup.'))return false;return newCamp();},
  onOpenChange:v=>{homeOpen=v;syncPlaying?.();placeHand();},
  // The first-play story (Build 46q): once, on the first new camp's Play, never on Continue.
  beforeEnter:reason=>reason==='play'&&!rawSave&&!storySeen(storage)?playIntro({storage,reduced,face:who=>`assets/premium/coast/ui/${FACES[who]}.webp`}).then(how=>{storyJustPlayed=how==='done';return how;}):null});
 home.ready.then(()=>{if(!rawSave&&!storySeen(storage))preloadIntro();});
}else{homeOpen=false;arrive(false);}
