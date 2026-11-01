// Vaultwake V5 new loop (docs/V5_NEW_LOOP_PLAN_2026-10-22.md): generators make parts,
// merges grow them, crew orders pay coins, coins upgrade the coast's places stage by
// stage on the beach screen. The board
// starts as Rivet Rover's small camp among sealed cargo; each cargo opens with the
// part it shows, and new generators come out of it (docs/V5_SEALED_CARGO_PLAN_2026-10-22.md).
// Deterministic reducer: act(s,a,now) mutates s and returns {ok,...}; a refused
// action leaves s untouched. Classic V5 (v5/core.mjs) and its saves are not used.
import {cellPos,BOARD_SIZE} from '../core.mjs';
import {kit,kitDrop,kitsMerge,producerLevel,levelLift,validProducerLevel,nearestFree,MAX_KIT_SIZE,KIT_DROPS} from '../kits.mjs';
import {xpToNext,validLevel,freshLevel} from '../levels.mjs';
// Energy pass (build 47v): Coast Camp's own energy module, with the player-level refill capacity.
// Classic V5's v5/energy.mjs is not changed; REFILL_CAP (its fixed 50) is only read to move saves on.
import {REFILL_CAP} from '../energy.mjs';
import {settleEnergy,capacityOf,capacityAt,storeEnergy,payOwed,STORE_ENERGY,RATION_ENERGY,rationWait} from './energy.mjs';
export {capacityOf,capacityAt,STORE_ENERGY};
import {AREAS,TASKS,STAGES} from './areas.mjs';
import {CHAINS,GENERATOR_CHAINS,GENERATOR_NAMES,maxTier,SECONDARY_OF,isSecondary} from './chains.mjs';
export {SECONDARY_OF,isSecondary};

export const SAVE_KEY='vaultwake-v5-coast';
// Version 5 (energy pass, build 47v): energy may be stored up to STORE_ENERGY (200, was 120), so a
// build before it reads such a save as one from a newer build and leaves it alone (saves.mjs).
// MAX_ENERGY is the most a camp may hold.
export const VERSION=5,MAX_TIER=7,MAX_ENERGY=STORE_ENERGY;// MAX_TIER: the longest chain
export const SOURCES=Object.fromEntries(Object.entries(GENERATOR_NAMES).map(([id,name])=>[id,{name}]));
export const XP={merge:1,restore:8,feed:5,unseal:2};// feed: merging two generators; orders pay a fifth of their coins as XP
// Coins per part by tier (build 16: stars became coins, five to a star; build 31: every tier
// a chain has, so no order is ever worth NaN).
export const COIN_VALUE=[5,5,10,25,45,80,140,240];
// Orders ask for tier 5 at most (build 31: a sixth-tier story order stalled the beach's end).
export const ORDER_TOP=5;export const COIN_RATE=5;
export const CHEST_ENERGY=15;
// A harder start (Build 46k, user: "togloom ehneesee mash amarhan sanagdaad baigaa, toglogchid hetsuu
// davan tuulj baigaa medremj uguhgui"; chose option A, docs/V5_HARDER_START_2026-10-27.md). Measured
// before (scripted player, first 30 min): energy never ran out, a stage every 2.7 min, the first gold
// order done in 1.5 min. A new camp starts with less energy, the first five levels give less, and the
// first six stages' gold orders ask one part a level bigger, so the first energy squeeze comes at
// about 12 min (5 s an action) and the first stages are goals that take planning.
// Energy pass (build 47v, user: energy ran out before the player had enjoyed enough merging, orders and
// restoration): a new camp starts full, at 50 of 50; the first ordinary crew order delivered gives +15
// energy and the first stage bought +20, once each (ONBOARDING); a capacity milestone gives the
// capacity's increase, once (gainXp). These go above the refill capacity, up to STORE_ENERGY.
export const ONBOARDING={order:15,stage:20};
export const START_ENERGY=50,EARLY_LEVELS=5,EARLY_LEVEL_ENERGY=5,GOLD_LIFT=1,GOLD_LIFT_STAGES=6;
export const levelEnergy=level=>level<=EARLY_LEVELS?EARLY_LEVEL_ENERGY:CHEST_ENERGY;
// The level path (docs/V5_LEVEL_PATH_2026-10-27.md; user: "togloomond ashiglaad gameplayd sonirholtoi
// zuilsee nemmeer baina"): the player level opens a merge rule and two kinds of crew order. The
// level-up energy stays.
export const LEVEL_PATH=[
 {level:3,id:'triple',name:'Triple merge',text:'Drag a level 3 or bigger part onto its twin while a third one touches it: all three make two of the next level.'},
 {level:5,id:'token',name:'Tide tokens from the crew',text:'Every eighth crew order also pays a Tide token.'},
 {level:8,id:'favour',name:'Crew favours',text:'Every sixth crew order asks one part a level higher and pays a Sea chest too (a Brass cog from the Survey Worksite on).'}
];
// The triple merge is for parts of level 3 and up (tier 2+): measured with the economy harness,
// triples of smaller parts used up the cheap pairs a player merges for free while energy is out
// (at 4.5 s an action, low-energy moments with a free move fell from about 80 % to 45 %).
export const TOKEN_EVERY=8,FAVOUR_EVERY=6,TRIPLE_MIN_TIER=2;
// What a level-path order pays on top of its coins. A favour pays a Sea chest at the beach and a
// Brass cog from the worksite on: cogs at the beach brought the Shell Trap out before the beach was
// finished (measured, 4 s an action: 45 min against the beach's 54).
export const BONUSES=['token','chest','cog'],BONUS_NAMES={token:'Tide token',chest:'Sea chest',cog:'Brass cog'};
// Secondary chains (pilot, 2026-10-29; docs/V5_SECONDARY_PILOT_2026-10-29.md). The Rivet Rover and
// the Survey Kite sometimes make a part of their secondary chain (chains.mjs SECONDARY_OF). Two output
// models were measured (tests/v5-next-secondary-pilot-metrics.mjs): 'bonus' (the tap's own part AND,
// sometimes, a secondary beside it) and 'replace' (sometimes a secondary INSTEAD of the tap's part,
// compensated by what secondary orders pay); 'off' is the game before the pilot.
// Round 3 (playtest: rare parts came often, matching orders did not): only a generator of `level` 2
// or more makes them; a level-1 copy makes its own parts only. A kind's chain opens for good the first
// time one of its generators reaches level 2 (secondaryUnlock: its first part as a gift and an
// introductory order), replacing the tap-count and delivered-order openers of rounds 1-2. The level-3
// next-generator progression is unchanged.
// An ELIGIBLE tap is a tap that succeeds (energy spent, its own part made) on a generator of level 2+
// whose chain is open and whose drops are not paused (secondaryPaused). Only eligible taps are rolled
// and counted: s.secTaps counts them (the roll is that number hashed, so neither reloading nor tapping
// a level-1 copy in between can change an outcome) and s.secSince counts those without a drop; a drop
// is certain on the `pity`-th one in a row without one. Both are per kind: copies share them and
// merging copies keeps them. Trial rates (round 3): 5 % a tap, certain by the 20th, i.e. one drop every
// 12.8 eligible taps on average (7.8 %). `salt` makes each kind's rolls its own. The rules are mutable
// only so the metrics script can compare (and vary the rolls); the game never changes them.
export const SECONDARY_RULES={
 rig:{model:'bonus',chance:.05,pity:20,level:2,hold:4,salt:101},
 chart:{model:'bonus',chance:.05,pity:20,level:2,hold:4,salt:211}
};
// Secondary orders (round 3): about one in `share` new everyday orders asks a secondary part (a turn
// comes when neither of the last share-1 everyday orders asked one); the highest tier ever asked (tier
// 3, the chain's top, is a collectible for the book); `rarity`, what a secondary part is worth: the
// coins of a part that many tiers higher (2: a Bolt pays like a Split spanner, 10; a Gear like a Pocket
// winch, 25; a Gear assembly like a Crawler jack, 45); and `goal`, how many drops beyond the unused
// parts held a near-term goal may ask. Mutable for the metrics script only.
// Build 48b: goal 2 (was 1), so a request can be a merged part one or two drops away.
export const SECONDARY_ORDERS={share:3,top:2,rarity:2,goal:2};
// A kind's chain is open (s.secOpen, saved) once one of its generators has reached level 2.
export const secondaryOn=(s,gen)=>{const r=SECONDARY_RULES[gen];return !!r&&r.model!=='off'&&!!SECONDARY_OF[gen]&&sourceOpen(s,gen)&&!!s.secOpen?.[gen];};
// Whether the generator on cell i is one that makes secondary parts (level 2 or more, chain open).
export const secondarySource=(s,i)=>{const x=s.board[i];return x?.type==='source'&&secondaryOn(s,x.id)&&producerLevel(x)>=SECONDARY_RULES[x.id].level;};
// Supply follows demand (round 3). A chain's parts are counted in drops ("units": a part of tier t is
// 2^t of them, the top keepsake included, so merging never lowers the count) on the board, in the shed
// and waiting for space. Units wanted by the orders on the board are subtracted. Drops pause while the
// unwanted units reach `hold` (4: four Bolts, two Gears or one Gear assembly), and always while
// SECONDARY_PENDING_MAX secondary parts already wait for space (so an earned drop is never lost). While
// paused nothing is rolled or counted; drops resume as parts are delivered or cleared, or an order
// asks for them.
// Build 48b: the chain's top part (the Hand-crank mechanism, the Captain's logbook) is a keepsake for the
// book that no order asks; it no longer counts, so holding one never pauses that chain's drops for good
// (it counted 8 against a rest of 4). Merging up to it lowers the count: that is the chain's goal.
export const secondaryUnits=(s,f)=>[...s.board,...s.shed,...s.pending].reduce((n,x)=>n+(x?.type==='item'&&x.family===f&&x.tier<maxTier(f)?2**x.tier:0),0);
export const secondaryWanted=(s,f)=>s.orders.reduce((n,o)=>n+(o?.needs??[]).reduce((m,r)=>m+(r.family===f?r.count*2**r.tier:0),0),0);
export const secondaryPaused=(s,gen)=>{const f=SECONDARY_OF[gen];
 if(s.pending.filter(isSecondaryPart).length>=SECONDARY_PENDING_MAX)return true;
 return secondaryUnits(s,f)-secondaryWanted(s,f)>=SECONDARY_RULES[gen].hold;};
// Whether an eligible tap (the caller has checked secondarySource) makes a secondary part: read-only,
// the caller moves the counters.
export function secondaryRoll(s,gen){
 if(!secondaryOn(s,gen)||secondaryPaused(s,gen))return null;
 const r=SECONDARY_RULES[gen],n=(s.secTaps?.[gen]??0)+1,since=s.secSince?.[gen]??0;
 return since+1>=r.pity||rand(n*7919+r.salt)<r.chance?SECONDARY_OF[gen]:null;
}
// A tap's secondary part that finds no free space waits with the other rewards (s.pending) and
// lands after the next action that frees one. With this many secondary parts waiting, drops pause
// (secondaryPaused), so the waiting list never grows past it and no drop is lost.
export const SECONDARY_PENDING_MAX=4;
// Round 3: the first time a generator of a kind reaches level 2, its secondary chain opens for good:
// its first part as a gift (beside that generator, else waiting for space), and an introductory order
// for it queued (s.secIntro) for the next crew slot. A chain the camp has already met (a pilot save)
// opens without the gift or the order, so nothing is given twice. Called after every action and on
// load (wait: the gift waits for space, so loading never rearranges the board); it answers the chains
// it opened.
export function secondaryUnlock(s,{wait=false}={}){
 const out=[];
 for(const gen of Object.keys(SECONDARY_OF)){
  if(s.secOpen?.[gen]||SECONDARY_RULES[gen].model==='off')continue;
  const i=s.board.findIndex(x=>x?.type==='source'&&x.id===gen&&producerLevel(x)>=SECONDARY_RULES[gen].level);if(i<0)continue;
  const f=SECONDARY_OF[gen],met=secondaryMet(s,f)||secondaryUnits(s,f)>0;
  s.secOpen={...s.secOpen,[gen]:true};
  if(!met){const x=item(f,0),k=wait?-1:put(s,x,i);if(k<0)s.pending.push(x);if(!s.secIntro.includes(f))s.secIntro.push(f);out.push({gen,family:f,index:k});}
 }
 return out;
}
export const levelOf=s=>Number.isInteger(s?.level?.level)?s.level.level:1;
export const unlocked=(s,id)=>levelOf(s)>=LEVEL_PATH.find(u=>u.id===id).level;
// The camp shed (build 32, user: "aguulah bolon udur tutmiin shagnaliig nem"): four spaces off
// the board for parts, crates, cogs and tokens. What is in the shed does not count for orders
// or cargo; tap it to bring it back to the board.
export const SHED_SLOTS=4,SHED_TYPES=['item','kit','cog','token'];
// The daily gift: one a day, seven in a row then round again. A missed day does not reset it.
// The collection book (build 33, user: "cugluulgiin nom nem"): every part found for the first
// time pays a few coins once it is ticked off in the book, more for higher tiers; a chain's
// whole page found and ticked gives a Brass cog.
export const BOOK_COINS=[1,1,2,3,5,8,12,20];// kept small: bigger book coins undid build 31's energy tension (scripted player)
export const BOOK_CHAINS=['rig','chart','rope','shell','lamp','optic','mech','notes'];// the chains of NEWEST_ORDER, then the secondary chains
export const bookKeys=family=>Array.from({length:maxTier(family)+1},(_,t)=>family+t);
// Parts found but not yet ticked off in the book.
export const bookReady=s=>s.found.filter(k=>!s.book.claimed.includes(k)&&BOOK_CHAINS.includes(k.replace(/\d+$/,'')));
// A secondary chain's page (pilot) pays no Brass cog: its parts pay their book coins, and the cog, a
// generator level, stays with the generators' own pages (measured: two more cogs brought the Shell Trap
// out during the beach for a quick player).
export const pageReady=(s,family)=>!CHAINS[family]?.secondary&&!s.book.pages.includes(family)&&bookKeys(family).every(k=>s.book.claimed.includes(k));
// The shop (build 34, user: "delguur bolon zar shurtchilgaanii shagnal nem"): coins buy
// energy, crates, a Tide token or a Brass cog, a few of each per day, so the shop competes
// with the coast's upgrades for coins. Energy costs more coins than orders pay for it (about
// 3 coins an energy), so buying it never loops into profit. Two offers are paid by watching a
// rewarded ad instead (ad:true); the app gives them only after an ad has finished.
export const SHOP={
 energy:{name:'Energy pack',cost:80,energy:20,limit:3},
 chest:{name:'Sea chest',cost:40,kit:2,limit:2},
 token:{name:'Tide token',cost:50,token:1,limit:1},
 cog:{name:'Brass cog',cost:200,cog:1,limit:1},
 adEnergy:{name:'Energy',ad:true,energy:15,limit:3},
 adCrate:{name:'Driftwood crate',ad:true,kit:1,limit:2}
};
export const shopLeft=(s,id,day)=>SHOP[id].limit-(day>s.shop.day?0:s.shop.bought[id]??0);
// Changing an order (build 36, user: "gatssan taskaas ehel"): a crew order the player is stuck
// on can be swapped for a new one, three times a day for free and then after a rewarded ad (five
// a day). The gold story order cannot be changed: it is the coast's next stage.
export const FREE_SWAPS=3,AD_SWAPS=5;
export const swapsLeft=(s,day)=>FREE_SWAPS-(day>s.swaps.day?0:s.swaps.n);
export const adSwapsLeft=(s,day)=>AD_SWAPS-(day>s.swaps.day?0:s.swaps.ads);
export const DAILY=[{energy:10},{coins:25},{kit:1},{energy:15},{token:1},{coins:50},{cog:1}];
// Coast Camp's own crates (the generator boxes of v5/kits.mjs, by size).
export const CRATES=['Driftwood crate','Sea chest','Captain\'s trunk'];
// Generators in the order they are found; each is opened with the one before's parts.
export const GENERATOR_ORDER=['rig','chart','rope','shell','lamp'];
// Generators grow by merging two of the same kind and level (user, 2026-10-22:
// "generatoriig uuriig ni merge hiij hugjuulj yavdag"). Copies come from cargo and
// from place stages.
export const MAX_GENERATOR_LEVEL=5;
// Each generator brings out the next kind when it reaches level 2 (user, 2026-10-22: "ehleed
// ehnii generatoroo saijruuldag baiy, ternii daraagaas daraagiin generator garch irdeg baih"):
// Rivet Rover Lv2 → Survey Kite, Kite Lv2 → Rope Winch, Rope Lv2 → Shell Trap, Shell Lv2 →
// Lantern Kiln. Cargo holds the copies and Brass cogs that level them.
export const UNLOCK_LEVEL=3;
export const nextKind=g=>GENERATOR_ORDER[GENERATOR_ORDER.indexOf(g)+1]??null;
// Generators earned from places, not from the level-3 chain above (Build 47e, from PR #80: the Lens
// Bench). NEWEST_ORDER is every generator in the order a player meets them ("newest" rewards follow it).
export const NEWEST_ORDER=[...GENERATOR_ORDER,'optic'];
export const generatorsMerge=(x,y)=>x?.type==='source'&&y?.type==='source'&&x.id===y.id&&producerLevel(x)===producerLevel(y)&&producerLevel(x)<MAX_GENERATOR_LEVEL;

export const item=(family,tier)=>({type:'item',family,tier});
export const jar=energy=>({type:'jar',energy});
export const coins=n=>({type:'coins',n});
export const source=id=>({type:'source',id});
// A Brass cog (found in cargo, user: "generator ahiulagch"): drag it onto a generator for +1 level.
export const cog=()=>({type:'cog'});
// A Tide token (found in cargo, build 18): lay it on a part and it becomes a part of the same
// tier that a crew order is waiting for.
export const token=()=>({type:'token'});
export const cargo=(key,find)=>({type:'cargo',key,...(find?{find}:{})});
const integer=(x,a,b)=>Number.isInteger(x)&&x>=a&&x<=b;

export function nameOf(x){
 if(!x)return 'Empty space';
 if(x.type==='item')return CHAINS[x.family].names[x.tier];
 if(x.type==='source')return SOURCES[x.id].name;
 if(x.type==='kit')return CRATES[x.size-1]+' · '+SOURCES[x.family].name;
 if(x.type==='jar')return 'Energy · +'+x.energy;
 if(x.type==='coins')return 'Coin pouch · +'+x.n+' coins';
 if(x.type==='cargo')return 'Sealed cargo · opens with a '+CHAINS[x.key.family].names[x.key.tier];
 if(x.type==='glass')return 'Tideglass · '+CHAINS[x.family].names[x.tier];
 if(x.type==='cog')return 'Brass cog · +1 generator level';
 if(x.type==='token')return 'Tide token · turns a part into one an order wants';
 return '';
}
export const matches=(x,r)=>x?.type==='item'&&x.family===r.family&&x.tier===r.tier;
export const count=(s,r)=>s.board.filter(x=>matches(x,r)).length;
// A generator works once it stands on the board (Echo Crucible waits for the next area).
export const sourceOpen=(s,id)=>s.board.some(x=>x?.type==='source'&&x.id===id)&&(id!=='flux'||s.area>=1);
export const openFamilies=s=>Object.keys(GENERATOR_CHAINS).filter(id=>sourceOpen(s,id));
export const chainsOf=(s,gen)=>GENERATOR_CHAINS[gen].map(([c])=>c);
export const openChains=s=>openFamilies(s).flatMap(g=>chainsOf(s,g));

// ---- the board ----
// Rivet Rover stands in the middle of the board with its small camp around it;
// sealed cargo and tideglass fill the two rings outside (user, 2026-10-22:
// "generatoroo tuvruugee oruulay"). Keys need well-merged parts.
export const cellIndex=(r,c)=>c===6?36+r:r===6?43+c:r*6+c;
const at=(r,c)=>cellIndex(r,c);
export const CAMP=[at(2,2),at(2,3),at(2,4),at(3,2),at(3,3),at(3,4),at(4,2),at(4,3),at(4,4)];
export const ROVER=at(3,3);
const I=item,K=kit,E=jar,S=n=>coins(n*COIN_RATE),T=token;
// [row, column, key chain, key tier, find]
const CARGO_CELLS=[
 // The more useful the find, the harder the key (user, 2026-10-22: "hairtsagnaas mash heregtei
 // zuiliig hetsuu neey"): everyday finds open with tier-3 parts next to the camp and tier 3–4
 // at the edge; Tide tokens, captain's trunks and big coin pouches with tier 4–5. Generators
 // no longer come from cargo: the beach's stages give the copies (build 18, user: "storynd
 // upgrade hiiheer generator ugdug, hairtsagand arai uur zuil uldeegeed"). Energy is rare.
 // Ring 2 (next to the camp, between the tideglass): one Split-spanner crate above the Rover
 // to teach it; a Tide token in a corner behind a Crawler jack.
 [1,1,'rig',4,T()],[1,3,'rig',2,S(3)],[1,5,'chart',5,K('chart',3)],
 [2,1,'rig',3,K('rig',1)],[4,1,'chart',3,S(4)],[5,1,'rope',5,T()],
 [2,5,'rig',5,S(12)],[4,5,'chart',3,I('chart',3)],[5,5,'chart',3,K('chart',1)],
 [5,3,'rig',3,E(5)],
 // Ring 3 (the edge) is packed by other crews: every crate there wants a Survey Kite or a
 // Rope Winch part, so the edge opens as those generators arrive (build 21, user chose this
 // over the tide: "ene shine uurchlult sain bish, uur shiidel"). Tier 3–4 for everyday
 // finds, 4–5 for tokens, trunks and big pouches.
 [0,1,'chart',5,K('chart',3)],[0,2,'rope',3,E(5)],[0,3,'chart',4,S(10)],[0,4,'rope',4,K('chart',2)],[0,5,'chart',4,T()],
 [1,6,'rope',3,S(6)],[2,6,'chart',3,I('rope',2)],[3,6,'rope',5,S(16)],[4,6,'chart',5,K('rope',3)],
 [6,6,'rope',4,S(16)],[6,4,'chart',3,K('chart',1)],[6,3,'rope',4,S(10)],[6,1,'chart',3,K('rope',1)],[6,0,'rope',5,K('rig',3)],
 [4,0,'chart',5,T()],[3,0,'rope',3,K('rig',2)],[2,0,'chart',4,S(12)]
];
export const CARGO=Object.fromEntries(CARGO_CELLS.map(([r,c,f,tier,find])=>[at(r,c),[f,tier,find]]));
// Tideglass: a part locked in glass near the generator that makes it. Six ring the camp, so a
// new camp opens on half-buried parts beside the Rover (user, 2026-10-22, with a reference
// board: "ehlel ni iimerhuuduu baimaar baina"; level-numbered cells were left out as a copy).
// It does not take a
// key like cargo: merges in the spaces beside it crack it, and the second breaks it and
// frees the part as it is (user, 2026-10-22: "hairtsag mus 2 neeh yalgaa alga").
export const GLASS=Object.fromEntries([[2,2,'rig',0],[2,4,'rig',1],[4,2,'rig',1],[4,4,'rig',0],[1,2,'rig',2],[1,4,'rig',1],[3,1,'rig',2],[3,5,'chart',1],[5,2,'rig',1],[5,4,'rope',1],[0,0,'chart',3],[0,6,'shell',2],[5,6,'lamp',2],[6,5,'lamp',1],[6,2,'rope',3],[5,0,'rope',1],[1,0,'shell',1]].map(([r,c,f,tier])=>[at(r,c),[f,tier]]));
export const GLASS_HITS=3;
// Build 41d (user: "ongorhoi nudiig bagasgay"): the camp's four corners start in tideglass too,
// small Rover parts that any merge beside them cracks, so a new camp shows four open spaces
// around the Rover and opens up as the player merges.
export const glass=(family,tier)=>({type:'glass',family,tier});
export const cargoAt=i=>{const c=CARGO[i];return c?cargo({family:c[0],tier:c[1]},structuredClone(c[2])):null;};
// Energy pass: a new camp's capacity is level 1's, already paid for.
const START_CAPACITY_PAID=capacityAt(1);
export function fresh(now=Date.now()){
 const board=Array(BOARD_SIZE).fill(null);
 board[ROVER]=source('rig');
 for(let i=0;i<BOARD_SIZE;i++)if(GLASS[i])board[i]=glass(...GLASS[i]);else if(!CAMP.includes(i))board[i]=cargoAt(i);
 const s={version:VERSION,board,energy:START_ENERGY,energyAt:now,coins:0,level:freshLevel(),taps:{},
  orders:[],slots:3,orderSeq:0,ordersDone:0,area:0,built:{},found:[],moves:0,merges:0,lastAt:now,
  shed:Array(SHED_SLOTS).fill(null),pending:[],seen:{},daily:{day:-1,count:0},book:{claimed:[],pages:[]},shop:{day:-1,bought:{}},swaps:{day:-1,n:0,ads:0},materials:{},
  secSince:Object.fromEntries(Object.keys(SECONDARY_OF).map(g=>[g,0])),secTaps:Object.fromEntries(Object.keys(SECONDARY_OF).map(g=>[g,0])),secOpen:{},secIntro:[],
  capPaid:START_CAPACITY_PAID,boost:{order:false,stage:false}};
 for(const g of Object.keys(GENERATOR_CHAINS))s.taps[g]=0;
 for(let i=0;i<s.slots;i++)s.orders.push(makeOrder(s));
 note(s);return s;
}

// ---- orders ----
// The first three teach the loop; then a deterministic mix grows with the level.
// The camp starts empty around Rivet Rover (build 30, user: "shuud orohod ingeed task deliver
// hiihed belen ehelj baina ... anhnii item generator-s garch ireeguigeer ehleh"): the first
// orders are built from its first taps and merges. Build 35 (user: "generatoroo hed tovshihod l
// ehnii 3 task shuud bieleh hemjeend ochij bainshdee"): a short ladder instead of Grip tools,
// a Split spanner, then a Pocket winch, then two kinds at once, so taps alone fill none of them.
const FIRST=[[['rig',2,1]],[['rig',3,1]],[['rig',2,1],['rig',1,2]]];
// Everyday order kinds (Build 44) and what each pays on top of its parts' worth.
// Energy a delivery gives back (Audit 2026-10-25).
export const DELIVER_ENERGY=1;
// Energy pass (build 47v): what a delivery gives back by the order's parts. A crew order with only
// primary parts, or a mixed one (a primary part and a rare extra), gives the crew energy; a quick job
// asking only rare extras gives coins and no energy (a bonus drop never pays energy); a gold order
// gives none (its reward is the stage's materials). Exported so the simulations can measure each.
export const DELIVERY_ENERGY={primary:DELIVER_ENERGY,mixed:DELIVER_ENERGY,secondary:0,gold:0};
export const orderEnergyKind=o=>o.story?'gold':o.needs.every(r=>isSecondary(r.family))?'secondary':o.needs.some(r=>isSecondary(r.family))?'mixed':'primary';
// The first-order bonus is for an ordinary crew order: not a gold order, and with at least one primary
// part, so the introductory order for a gifted rare extra (a quick job for that part alone) never
// claims it, nor does any other quick job asking only rare extras.
export const ordinaryOrder=o=>!!o&&!o.story&&o.needs.some(r=>!isSecondary(r.family));
// The big job (one part a tier past what its generator makes easily, ×1.3) was dropped on
// 2026-10-26 (user: "big job hereg baina uu ... hundruuleed yavchihiin bishuu"): it only made orders
// harder, not more interesting. Orders saved with role 'big' keep their coins and show as quick jobs.
// Two of every three are two-part jobs: with quick and two-part jobs in plain turns, the board
// ran dry while energy was out (measured: at 4.5 s an action, 45 % of low-energy moments had a
// free move, against 86 % or more this way and with the big job).
export const ROLES=['quick','pair'],ROLE_PAY={quick:1,pair:1.15},ROLE_TURN=['quick','pair','pair'];
// How many of the last everyday orders a new one may not repeat (Build 44, s.recent).
export const RECENT=6;
// An everyday order's coins: its parts' worth times its kind's pay, rounded to 5. Rounding up
// was tried (so every bonus shows) and measured: stages came sooner, and since order tiers
// follow the stages built, orders outran the generators (taps 790 → 1,003, waiting ×4).
export const rolePrice=(needs,role)=>Math.max(5,Math.round(priceOf(needs)*ROLE_PAY[role]/5)*5);
// The kind of an order, also for saves made before Build 44 (which did not store one).
export const roleOf=o=>o?.story?'gold':ROLES.includes(o?.role)?o.role:o?.needs?.length>1?'pair':'quick';
function rand(n){let t=(n*2654435761+0x6D2B79F5)>>>0;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;}
const CREW_OF={rig:'ivo',rope:'ivo',chart:'neri',shell:'neri',flux:'tamsin',lamp:'tamsin',optic:'tamsin',mech:'ivo',notes:'neri'};
const crewFor=needs=>needs.length>1?'bram':CREW_OF[needs[0].family];
// Coins an order pays: its parts' worth, half as much again for the story's (rounded to 5).
// A secondary part is paid as a part SECONDARY_ORDERS.rarity tiers higher (the pilot's rarity price).
export const partValue=r=>COIN_VALUE[Math.min(COIN_VALUE.length-1,r.tier+(isSecondary(r.family)?SECONDARY_ORDERS.rarity:0))];
// What a gold order pays: its parts' worth times GOLD_PAY.rate. Build 48b (docs/V5_RARE_MERGES_RESTORATION_2026-11-01.md):
// 1.0, was 1.5. Measured, at 1.5 the gold orders paid 71 % of Chapter 1's stages (63 % of Chapter 2's),
// so the median Chapter 1 stage needed no crew order at all and the coins they paid piled up. A gold
// order now pays its parts' worth and brings the stage's materials; crew orders fund about half of each
// stage. The first GOLD_PAY.early stages (the harder start's six, GOLD_LIFT_STAGES) still pay 1.5, so
// the first session keeps its pace (measured: at 1.0 throughout, a 6 s player built 2 stages in the
// first 15 minutes instead of 3). Mutable for the coins metrics only.
export const GOLD_PAY={rate:1.3,early:6,earlyRate:1.5};
export const priceOf=(needs,story=false)=>{const v=needs.reduce((v,r)=>v+r.count*partValue(r),0);return story?Math.round(v*1.5/5)*5:v;};
// what a gold order pays, by the stages built so far
export const goldPrice=(s,needs)=>{const v=needs.reduce((v,r)=>v+r.count*partValue(r),0);return Math.round(v*(totalBuilt(s)<GOLD_PAY.early?GOLD_PAY.earlyRate:GOLD_PAY.rate)/5)*5;};
// The second part of an order comes from another open chain, chosen evenly by the order's own
// seed (build 41: it was always the first open chain, so Rivet Rover filled most second parts).
export function secondChain(families,main,tier,seed){const ok=families.filter(f=>f!==main&&tier<=maxTier(f));return ok.length?ok[Math.floor(rand(seed)*ok.length)]:null;}
// A second part never asks more than its generator can reach easily: one tier above the best
// part it makes (a new Lv1 generator: tier 2 at most), so fair chains do not mean dear parts.
// Build 46f: reach is that best part's tier, read from the same rule produce uses (the fourth-tap
// bonus plus levelLift, capped at tier 3). It was the generator's level, which matches the best
// part only at levels 1 and 2: a level-3 generator still makes tier 2 at best, yet its orders
// jumped to tier 4, so levelling up (which level 3 needs, for the next generator) made that
// chain's orders cost 60 % more energy for 20 % more output.
export const bestTier=level=>Math.max(...Array.from({length:12},(_,k)=>Math.min(3,((k+1)%4===0?1:0)+levelLift(level,k+1))));
const level=(s,chain)=>Math.max(1,...s.board.filter(x=>x?.type==='source'&&x.id===CHAINS[chain].gen).map(producerLevel));
const reach=(s,chain)=>bestTier(level(s,chain));
// What levelling pays instead (Build 46f, re-tuned with the economy harness): levels 3 and 4 make
// no better part than level 2, so an everyday part asked at its generator's limit pays 40 % more
// for each such level. Measured with the economy harness against Build 46e (numbers in
// docs/V5_AUDIT_FIXES_2026-10-25.md): 0 % left the late worksite stages slow, 30 % left a fast
// player stuck with no energy and nothing to merge; 40 % passes every economy guard.
export const PAY_PER_LEVEL=.4;
export function orderPrice(s,needs,role){
 // (a secondary part's price is its rarity, not its generator's level: no lift)
 const lift=needs.reduce((n,r)=>n+(!isSecondary(r.family)&&r.tier>=reach(s,r.family)+1?level(s,r.family)-bestTier(level(s,r.family)):0),0);
 return Math.round(rolePrice(needs,role)*(1+PAY_PER_LEVEL*lift)/5)*5;
}
// The gold order is a stage's materials, so it is the biggest order on the board (Build 41h,
// user: "story upgrade task bielelt heterhii hurdan ... merge togloh medremj avch amjilgui",
// with energy left to run out as in a classic free-to-play merge game): the newest generator's
// part one tier past what it makes easily and two of a second chain's part (a third part was
// measured too: three-part gold orders made the session 7 hours of waiting).
function goldNeeds(s,families,family,low,n){
 const tier=Math.max(2,Math.min(maxTier(family)-1,reach(s,family)+1+(totalBuilt(s)<GOLD_LIFT_STAGES?GOLD_LIFT:0)));
 const needs=[{family,tier,count:1}],other=secondChain(families,family,Math.max(1,low),n*29+3);
 needs.push(other?{family:other,tier:Math.max(1,Math.min(low+1,reach(s,other)+1,maxTier(other)-1)),count:2}:{family,tier:Math.max(1,tier-1),count:2});
 return needs;
}
export function makeOrder(s){
 const n=s.orderSeq++;let needs;
 if(n<FIRST.length)needs=FIRST[n].map(([family,tier,count])=>({family,tier,count}));
 else{
  // Difficulty follows the story and the merging, not the player level (build 29, user:
  // "taskuudiin shinechlel hetsuu bololtiig story bolon mergeteigee uyalduulaad"): the lowest
  // tier rises with beach upgrades (2 from 3 upgrades, 3 from 12), the top tier climbs every
  // six upgrades and one more once a generator reaches level 3, and two-part orders grow
  // more common as the beach is built.
  // Built counts every area's stages, so the Survey Worksite starts where the beach ended.
  const families=openChains(s),built=totalBuilt(s),best=Math.max(1,...s.board.filter(x=>x?.type==='source').map(producerLevel));
  const low=built>=12?3:built>=3?2:1,top=Math.min(ORDER_TOP,2+Math.floor(built/6)+(best>=3?1:0));
  // One order at a time is the story's: the newest generator's best part, for the next beach
  // stage, paying half as much again.
  const story=!s.orders.some(o=>o?.story)&&storyTarget(s);
  let family,tier;
  // The gold order holds back the stage, so it asks what the newest generator can reach: one
  // tier above its level (Build 41; it asked its chain's second-best part, a Star chart from a
  // new Survey Kite).
  if(story){family=GENERATOR_CHAINS[newestGenerator(s)][0][0];tier=Math.max(1,Math.min(top,maxTier(family)-1,reach(s,family)+1));}
  // Half of an area's everyday orders want its focus chain once its generator is out (the
  // Survey Worksite's Rope Winch).
  const focus=currentArea(s)?.focus,pool=focus&&families.includes(focus)&&rand(n*19)<.5?[focus]:families;
  // Build 47b (from PR #80): a stage may name its own materials (gold: [[chain, tier, count], ...]),
  // e.g. the Vault door's inner ring; otherwise they follow the newest generator as above.
  if(story){needs=story.gold?story.gold.map(([family,tier,count])=>({family,tier,count})):goldNeeds(s,families,family,low,n);
   // Build 48b: a stage that names a merged rare part (areas.mjs rare) asks it instead of its second
   // material, but only when that chain can drop now; else its usual materials (never a wait on luck).
   // Bounded: the part asked is at most SECONDARY_ORDERS.goal drops away from the parts the player holds
   // free (each drop is certain by the generator's pity-th tap), so a tier-2 part steps down to tier 1
   // until a basic part or two are in hand. Measured without it: a Gear assembly stood up to 76 minutes.
   const rare=TASKS[story.id]?.stages[story.stage-1]?.rare;
   if(rare&&secondaryCanDrop(s,rare[0])){let t=rare[1];while(t>1&&secondaryDrops(s,rare[0],t)>SECONDARY_ORDERS.goal)t--;
    needs=[needs[0],{family:rare[0],tier:t,count:1}];}
   return {id:'o'+n,who:crewFor(needs),needs,coins:goldPrice(s,needs),story:story.id};}
  // Build 44 (user, 2026-10-25: "orderuudiig utga uchirtai bolgoy"; docs/V5_ECONOMY_AUDIT_PROPOSAL,
  // proposal A): everyday orders take turns being a quick job (one small part of one chain) and a
  // two-part job (parts of two different chains; pays ×1.15). The big job was dropped on 2026-10-26
  // (see ROLES). The first chain is one no other everyday order on the board starts with, when the
  // area has one; only unlocked chains, never above maxTier − 1. Two of every three orders are
  // two-part jobs, so most cards mix chains once a second one is out.
  let role=ROLE_TURN[(n-FIRST.length)%ROLE_TURN.length];const others=s.orders.filter(o=>o&&!o.story),firsts=new Set(others.map(o=>o.needs[0].family));
  // The camp remembers its last few everyday orders (s.recent, Build 44): a new one repeats
  // neither those nor a card already on the board.
  const recent=Array.isArray(s.recent)?s.recent:(s.recent=[]),key=ns=>ns.map(r=>r.family+r.tier+'x'+r.count).sort().join('+');
  const avoid=new Set([...recent,...others.map(o=>key(o.needs))]),last=recent.at(-1)?.match(/^[a-z]+/)?.[0];
  const freshChains=pool.filter(f=>!firsts.has(f)&&f!==last),from=freshChains.length?freshChains:pool.filter(f=>!firsts.has(f)).length?pool.filter(f=>!firsts.has(f)):pool;
  const hi=f=>Math.max(1,Math.min(top,reach(s,f)+1,maxTier(f)-1)),floor=Math.max(1,low-1);
  const build=f1=>{
   // A quick job: one chain at the area's floor tier (one part, or two while they are small).
   if(role==='quick'){const t=Math.max(1,Math.min(hi(f1),low));return [{family:f1,tier:t,count:t<=2&&rand(n*13)<.7?2:1}];}
   // A two-part job: two chains, or two tiers of one while it is the only one out.
   const t=Math.max(1,Math.min(hi(f1),low+1+Math.floor(rand(n*29)*2))),f2=secondChain(families,f1,Math.max(1,t-1),n*23+5);
    // With one generator out (the first quarter hour) a two-part job asks two tiers of its chain
    // (Audit 2026-10-25: three in five orders there repeated one of the last four).
    return f2?[{family:f1,tier:t,count:1},{family:f2,tier:Math.max(1,Math.min(Math.max(1,t-1),reach(s,f2)+1,maxTier(f2)-1)),count:1}]:t>=2?[{family:f1,tier:t,count:1},{family:f1,tier:t-1,count:2}]:[{family:f1,tier:t,count:2}];
  };
  // A repeat, or an order already lying finished on the board, is varied: one more or one fewer
  // of a small part, a tier up within reach, a tier down to the floor, or another open chain;
  // the first that is new is kept.
  // Audit 2026-10-25 (user: "buguding ni hii"): the same parts in another number still read as
  // the same job, so the last four everyday orders' parts are avoided too while there is
  // anything else to ask (measured: repeats 24 % → see docs/V5_AUDIT_FIXES_2026-10-25.md).
  const loose=ns=>ns.map(r=>r.family+r.tier).sort().join('+'),seen=new Set(recent.slice(-4).map(k=>k.replace(/x\d+/g,'')));
  const done=ns=>ns.every(r=>count(s,r)>=r.count),bad=ns=>avoid.has(key(ns))||done(ns),stale=ns=>bad(ns)||seen.has(loose(ns));
  const first=from[Math.floor(rand(n*7)*from.length)];needs=build(first);
  if(stale(needs)){
   const vary=[];const one=ns=>{const r=ns[0];return r;};
   {const v=structuredClone(needs);if(v.length===1&&v[0].tier<=2){v[0].count=v[0].count===1?2:1;vary.push(v);}}
   {const v=structuredClone(needs);if(one(v).tier<hi(one(v).family)){one(v).tier++;vary.push(v);}}
   {const v=structuredClone(needs);if(one(v).tier>floor){one(v).tier--;vary.push(v);}}
   {const v=structuredClone(needs);if(v[1]&&v[1].tier>1){v[1].tier--;vary.push(v);}}
   {const v=structuredClone(needs);if(v[1]&&v[1].tier<hi(v[1].family)){v[1].tier++;vary.push(v);}}
   {const v=structuredClone(needs);if(v.length===1&&v[0].count===1){v[0].count=2;vary.push(v);}}
   for(const f of pool)if(f!==first)vary.push(build(f));
   // the area's focus chain gives way to another open chain before a job repeats (Audit 2026-10-25)
   for(const f of families)if(f!==first&&!pool.includes(f))vary.push(build(f));
   // Best: new to the camp and not already made; else at least not a card on the board.
   const onBoard=new Set(others.map(o=>key(o.needs)));
   needs=vary.find(v=>!stale(v))??(bad(needs)?vary.find(v=>!bad(v))??vary.find(v=>!onBoard.has(key(v))):null)??needs;
  }
  // The level path: from level 8 every sixth everyday order is a crew favour (its first part one tier
  // higher, within reach and the order limits, and a Sea chest or Brass cog on top); from level 5 every eighth
  // pays a Tide token too (every eighth: every fifth left slow players never short of energy). Counted by the order's own number, so it is deterministic.
  // The first everyday order after level 5 pays its Tide token at once (s.pathNext), so the level-up's
  // promise is kept on the next card, not up to eight orders later (measured: the first token came at
  // 51 min, against level 5 at about 10). Favours keep their turn (within six orders): a first favour
  // at once left slow players never short of energy (economy harness, 10 s an action).
  const k=n-FIRST.length,opened=s.pathNext;let bonus;
  if(unlocked(s,'favour')&&k%FAVOUR_EVERY===FAVOUR_EVERY-1){const r=needs[0],up=Math.min(ORDER_TOP,maxTier(r.family)-1,hi(r.family)+1);
   if(up>r.tier){needs=structuredClone(needs);needs[0]={family:r.family,tier:up,count:1};bonus=s.area>=1?'cog':'chest';}}
  if(!bonus&&unlocked(s,'token')&&(opened==='token'||k%TOKEN_EVERY===TOKEN_EVERY-1))bonus='token';
  if(opened==='token'&&bonus==='token')delete s.pathNext;
  // Never two identical cards (2026-10-26: with one generator out, two-part jobs of one chain could
  // run out of new combinations): a quick job not on the board takes the place.
  {const onBoard=new Set(others.map(o=>key(o.needs)));
   if(onBoard.has(key(needs))){const alt=pool.flatMap(f=>Array.from({length:hi(f)},(_,k)=>[1,2].map(c=>[{family:f,tier:k+1,count:c}])).flat()).find(v=>!onBoard.has(key(v)));
    if(alt){needs=alt;role='quick';}}}
  // Secondary chains (pilot, round 3): an introductory order for a chain just opened comes first (a
  // quick job for its first part; s.secIntro, cleared once such an order is on the board), then about
  // one everyday order in three asks a secondary part (secondaryNeed), as a quick job for that part
  // alone (measured: in a mixed order, a hard primary part held a Gear order for 300 actions in the
  // mobile playthrough, and the chain's other parts with it). Only a crew favour or a token order
  // keeps its first part and its bonus, with the secondary as its second. Never a gold order (above).
  {const intro=(s.secIntro??[]).find(f=>!s.orders.some(o=>o?.needs?.some(r=>r.family===f)));
   if(intro&&bonus!=='chest'&&bonus!=='cog'&&s.orders.filter(asksSecondary).length<secondaryLimit(s)){needs=[{family:intro,tier:0,count:1}];role='quick';}
   else{const sec=bonus&&role==='quick'?null:secondaryNeed(s,n,k);if(sec){const {use,...need}=sec;if(!bonus)role='quick';needs=role==='quick'?[need]:[{...needs[0],count:1},need];}}}
  recent.push(key(needs));if(recent.length>RECENT)recent.splice(0,recent.length-RECENT);
  return {id:'o'+n,who:crewFor(needs),needs,coins:orderPrice(s,needs,role),role,born:s.moves,...(bonus?{bonus}:{})};
 }
 return {id:'o'+n,who:crewFor(needs),needs,coins:priceOf(needs),born:s.moves};
}
// The secondary part an everyday order asks, if any (pilot; round 3 rewrote demand: rounds 1-2 asked
// at most every third order, one secondary order at a time, and the playtest held unused extras 85-89 %
// of the time). Now:
// - a turn comes when neither of the last SECONDARY_ORDERS.share-1 everyday orders asked one (so about
//   one in three when parts are there to ask), and also whenever a chain holds unused extras and no
//   order on the board asks that chain (supply first; measured: 39-43 % of new everyday orders, and the
//   time with unused extras and no order for them down from 85-89 % in round 2 to about 45 %);
// - secondary orders on the board stay below the everyday crew slots, so at least one everyday order
//   (and the gold order) never asks a rare part;
// - the chain with the most unused units (held on the board, in the shed or waiting, less what orders
//   already want) is asked first, for the biggest part those units make (a USE order, always a quick
//   job for that part alone, so a hard primary part never holds it up), within `top` and the stage
//   ramp (tier 1 from the first stage built, tier 2 from the third);
// - with no unused units, a modest GOAL: a part at most SECONDARY_ORDERS.goal drops beyond them, only
//   from a chain with a generator of level 2+ on the board (it can drop: one comes by the 20th eligible
//   tap, and drops never pause while an order wants the chain), only once the chain has been met, and
//   only while no order on the board asks that chain and no other goal is waiting (one order waiting
//   for a drop at a time: measured, two at once left an energy-starved player with nothing free to do).
// Never in a gold order, and nothing on the way to a level-2 generator asks one: they come only after it.
// Drops held: each part counts as the drops merged into it (a Gear is two Bolts); the chain's top part
// is a keepsake: it never counts (build 48b; it cannot be split back, and no order asks it).
export const secondaryHeld=(s,family)=>[...s.board,...s.shed,...s.pending].reduce((n,x)=>n+(x?.type==='item'&&x.family===family&&x.tier<maxTier(family)?2**x.tier:0),0);
export const secondaryUnused=(s,family)=>Math.max(0,secondaryHeld(s,family)-secondaryWanted(s,family));
const secondaryCap=s=>{const built=totalBuilt(s);return Math.min(SECONDARY_ORDERS.top,built>=3?2:built>=1?1:0);};
// Build 48b: what the parts held can really make. A part is never split: a Gear assembly is not two
// Gears. secondaryFree answers, tier by tier, the parts of a chain held on the board, in the shed and
// waiting for space that no order on the board (crew or gold) already needs: each need takes a part of
// its own tier, else is made from two of the tier below (recursively); `short` counts the drops still
// missing for those needs. secondaryDrops answers how many drops one part of tier t still takes.
export function secondaryDropsIn(free,t,n=1){const rem=n-free[t];if(rem<=0)return 0;return t===0?rem:secondaryDropsIn(free,t-1,2*rem);}
export function secondaryFree(s,f){
 const have=Array(maxTier(f)+1).fill(0);
 for(const x of [...s.board,...s.shed,...s.pending])if(x?.type==='item'&&x.family===f)have[x.tier]++;
 let short=0;
 for(const o of s.orders)for(const r of o?.needs??[])if(r.family===f)for(let c=0;c<r.count;c++){
  const d=secondaryDropsIn(have,r.tier);short+=d;
  // commit what exists: the part itself, else the pairs below it that are there
  (function use(t){if(have[t]>0){have[t]--;return;}if(t>0){use(t-1);use(t-1);}})(r.tier);}
 return {have,short};
}
export const secondaryDrops=(s,f,t)=>secondaryDropsIn(secondaryFree(s,f).have,t);
export const secondaryMet=(s,family)=>s.found.some(k=>k.replace(/\d+$/,'')===family)||s.pending.some(x=>x?.type==='item'&&x.family===family);
// A chain can drop right now: open, with a generator of level 2+ on the board.
export const secondaryCanDrop=(s,family)=>{const gen=CHAINS[family]?.gen;return s.board.some((x,i)=>x?.type==='source'&&x.id===gen&&secondarySource(s,i));};
// a goal is waiting while the orders on the board want rare parts the parts held cannot yet make
const goalWaiting=s=>Object.values(SECONDARY_OF).some(f=>secondaryFree(s,f).short>0);
// Build 48b: the merged tier a chain may be asked: tier 1 (a Gear, an Expedition note) once a stage is
// built, tier 2 (a Gear assembly, a Travel notebook) from the third stage and once a tier-1 part of
// that chain has been made (so the ladder is climbed one rung at a time).
const secondaryReach=(s,f)=>Math.min(secondaryCap(s),s.found.includes(f+'1')?2:1);
const asksSecondary=o=>o?.needs?.some(r=>isSecondary(r.family));
export const secondaryLimit=s=>Math.max(1,s.slots-1-1);// everyday slots (one is the gold order's), less one kept primary-only
// The secondary part an everyday order asks, if any (pilot round 3; build 48b rewrote what it asks).
// - A turn comes as in round 3: when neither of the last SECONDARY_ORDERS.share-1 everyday orders asked
//   one, or a chain holds unused parts no order asks for; secondary orders stay below the everyday slots,
//   so one everyday order (and the gold order) is always primary-only.
// - A chain still waiting for its introduction (s.secIntro: one quick job for its first part, once per
//   chain, saved) is not asked anything else (makeOrder asks the introduction first).
// - After it, merged parts: the highest tier within the chain's reach (secondaryReach) that the free
//   parts make now (a USE: nothing to wait for), else one that takes at most SECONDARY_ORDERS.goal more
//   drops (a GOAL: only from a chain that can drop, and only while no other order waits for a rare part).
//   A part held is never asked for in pieces (secondaryFree). Basic parts are asked only when nothing
//   merged can be: two of them when two are free, else one.
// - The chain with the most free drops is asked first.
export function secondaryNeed(s,n,k){
 const fams=Object.values(SECONDARY_OF).filter(f=>(secondaryHeld(s,f)>0||secondaryOn(s,CHAINS[f].gen))&&!(s.secIntro??[]).includes(f));if(!fams.length)return null;
 if(s.orders.filter(asksSecondary).length>=secondaryLimit(s))return null;
 const unused=f=>secondaryUnused(s,f);
 const recent=(Array.isArray(s.recent)?s.recent:[]).slice(-(SECONDARY_ORDERS.share-1)),asked=recent.some(key=>key.split('+').some(p=>isSecondary(p.replace(/\d+x\d+$/,''))));
 const surplus=fams.some(f=>unused(f)>0&&secondaryWanted(s,f)===0);
 if(asked&&!surplus)return null;
 const free=Object.fromEntries(fams.map(f=>[f,secondaryFree(s,f).have])),units=f=>free[f].reduce((a,c,t)=>a+(t<maxTier(f)?c*2**t:0),0);
 const order=[...fams].sort((a,b)=>units(b)-units(a)||rand(n*37+11)-.5);
 const canGoal=f=>secondaryMet(s,f)&&secondaryCanDrop(s,f)&&!goalWaiting(s);
 // merged parts: one the free parts make now, else a near goal
 for(const f of order)for(let t=secondaryReach(s,f);t>=1;t--)if(secondaryDropsIn(free[f],t)===0)return {family:f,tier:t,count:1,use:true};
 for(const f of order)if(canGoal(f))for(let t=secondaryReach(s,f);t>=1;t--)if(secondaryDropsIn(free[f],t)<=SECONDARY_ORDERS.goal)return {family:f,tier:t,count:1};
 // basic parts, when nothing merged can be asked
 for(const f of order)if(free[f][0]>=1)return {family:f,tier:0,count:Math.min(2,free[f][0]),use:true};
 for(const f of order)if(canGoal(f))return {family:f,tier:0,count:1};
 return null;
}
// Board cells an order would take: exact matches, lowest index first.
export function orderItems(s,o){
 const used=new Set(),take=[];
 for(const r of o.needs){let left=r.count;for(let i=0;i<s.board.length&&left;i++)if(!used.has(i)&&matches(s.board[i],r)){used.add(i);take.push(i);left--;}if(left)return null;}
 return take;
}
// A crew order still not ready 200 moves after it came (Audit 2026-10-25: one in ten took over
// an hour, mostly two-crew jobs) is "stuck": its card suggests a new order. Measured: half of
// all crew orders are delivered within 60 moves, nine in ten within about 320. Gold orders
// cannot be changed, so they are never stuck. Orders saved before this have no born and are not.
export const STUCK_MOVES=200;
export const isStuck=(s,o)=>!!o&&!o.story&&Number.isInteger(o.born)&&s.moves-o.born>=STUCK_MOVES&&!orderItems(s,o);
export function orderProgress(s,o){return o.needs.map(r=>({...r,have:Math.min(r.count,count(s,r))}));}

// ---- board helpers ----
const put=(s,x,near=0)=>{const i=nearestFree(s.board,near,cellPos);if(i>=0)s.board[i]=x;return i;};
// Rewards that find no free space wait (Build 47a, ported from PR #80's Chapter 2 plan D6): a
// stage bought on a full board used to lose its generator copy, crate or Tide token. A waiting
// reward is kept in the save (s.pending, in the order it was earned) and lands where a reward with
// room would (the first free space from the top left, as before), first earned first, after the
// next action that leaves a space. Each one is placed once: it
// leaves the list as it lands. PENDING_MAX only bounds what load() accepts (every stage in the
// game gives at most one board reward, far fewer than 100).
export const SEEN_ID=/^[a-z0-9-]{1,40}$/;
export const PENDING_MAX=100,PENDING_TYPES=['source','kit','token','cog','item'];
const give=(s,x)=>{const i=put(s,x);if(i<0)s.pending.push(x);return i;};
const isSecondaryPart=x=>x?.type==='item'&&isSecondary(x.family);
function placePending(s){
 const out=[];
 while(s.pending.length){const i=nearestFree(s.board,0,cellPos);if(i<0)break;const x=s.pending.shift();s.board[i]=x;out.push({index:i,thing:x});}
 return out;
}
// Cargo cell j opens: its find takes the space, or pays out and leaves it free.
function reveal(s,j){
 const f=s.board[j].find;
 if(!f){s.board[j]=null;return {index:j,type:'space'};}
 if(f.type==='jar'){s.board[j]=null;return {index:j,type:'jar',energy:bonus(s,f.energy)};}
 if(f.type==='coins'){s.board[j]=null;s.coins+=f.n;return {index:j,type:'coins',coins:f.n};}
 if(f.type==='source'){s.board[j]=source(f.id);return {index:j,type:'source',id:f.id};}
 if(f.type==='kit'){s.board[j]=kit(f.family,f.size);return {index:j,type:'kit'};}
 if(f.type==='cog'){s.board[j]=cog();return {index:j,type:'cog'};}
 if(f.type==='token'){s.board[j]=token();return {index:j,type:'token'};}
 s.board[j]=item(f.family,f.tier);return {index:j,type:'item'};
}
// Parts seen for the first time (for "New!" moments in the UI).
function note(s){const fresh=[];for(const x of s.board)if(x?.type==='item'){const k=x.family+x.tier;if(!s.found.includes(k)){s.found.push(k);fresh.push(k);}}return fresh;}
// The most recently found generator (for rewards that follow your newest chain).
export const newestGenerator=s=>[...NEWEST_ORDER].reverse().find(g=>sourceOpen(s,g))??'rig';
// Only cargo touching open ground (an orthogonal neighbour that is not cargo) can be
// opened, so the board opens outward from the camp one ring at a time; cargo
// further in keeps even its key hidden.
const neighbours=i=>{const [r,c]=cellPos(i);return [[r-1,c],[r+1,c],[r,c-1],[r,c+1]].map(([rr,cc])=>rr<0||cc<0||rr>6||cc>6?-1:cc===6?36+rr:rr===6?43+cc:rr*6+cc).filter(j=>j>=0);};
export const reachable=(s,i)=>s.board[i]?.type==='cargo'&&neighbours(i).some(j=>!['cargo','glass'].includes(s.board[j]?.type));
// Which part each reachable cargo is waiting for.
export const cargoKeys=s=>s.board.flatMap((x,i)=>reachable(s,i)?[{index:i,...x.key}]:[]);
// A merge on cell i cracks the tideglass beside it, if what it makes is at least as strong
// as the part in the glass (build 19: small merges no longer chip it); the last crack frees
// the part.
function crack(s,i,power=Infinity,also=[]){
 const cracked=[],freed=[];
 // A triple merge makes parts on two spaces: the glass beside either cracks once.
 for(const j of new Set([i,...also].flatMap(neighbours))){const g=s.board[j];if(g?.type!=='glass'||power<g.tier)continue;
  g.cracks=(g.cracks??0)+1;if(g.cracks>=GLASS_HITS){s.board[j]=item(g.family,g.tier);freed.push(j);}else cracked.push(j);}
 return {cracked,freed,bonus:freed.length*XP.unseal};
}
// A generator at level 2 brings out the next kind beside it, once there is a free space
// (checked after every action, so a full board only delays it).
function release(s){
 const out=[];
 for(const g of GENERATOR_ORDER){const n=nextKind(g);if(!n||s.board.some(x=>x?.type==='source'&&x.id===n))continue;
  const up=s.board.findIndex(x=>x?.type==='source'&&x.id===g&&producerLevel(x)>=UNLOCK_LEVEL);if(up<0)continue;
  const i=nearestFree(s.board,up,cellPos);if(i<0)continue;s.board[i]=source(n);out.push({index:i,id:n,from:g});}
 return out;
}
const withCracks=(r,c)=>{if(c.cracked.length)r.cracked=c.cracked;if(c.freed.length){r.broken=c.freed;r.xp+=c.bonus;r.message+=' · the tideglass breaks';}else if(c.cracked.length)r.message+=' · the tideglass cracks';return r;};

// Energy from levels, stages and cargo jars tops energy up to the refill cap and no further
// (Build 41g, user: "energy er ni duusah shinj alga"); bought, daily and ad energy can go over.
// Energy pass (build 47v): "the refill cap" is the player level's capacity (capacityOf).
function bonus(s,n){const before=s.energy;s.energy=Math.max(s.energy,Math.min(capacityOf(s),s.energy+n));return s.energy-before;}
// ---- levels ----
function gainXp(s,amount){
 s.level=validLevel(s.level);s.level.xp+=amount;const ups=[];
 while(s.level.xp>=xpToNext(s.level.level)){
  s.level.xp-=xpToNext(s.level.level);s.level.level++;
  // Energy only (Build 41, user: "ene hairtsagiig amarhan uguud baina"): level chests no longer
  // add a driftwood crate.
  // Energy pass (build 47v): a level that raises the refill capacity pays the increase once, on top
  // of the level's own energy. The new capacity applies first, then the level's energy (up to it),
  // then the increase (above it if need be, up to STORE_ENERGY; anything past that is owed, never
  // lost). s.capPaid is the capacity already paid for, so a level is never paid twice (reload, or a
  // save moved on from before the pass, whose capPaid starts at its level's capacity).
  const cap=capacityAt(s.level.level),delta=Math.max(0,cap-(s.capPaid??cap));
  const energy=bonus(s,levelEnergy(s.level.level));
  let capacity=null;
  if(delta>0){const paid=storeEnergy(s,delta,{keep:true});s.capPaid=cap;capacity={from:cap-delta,to:cap,energy:delta,...(paid<delta?{owed:delta-paid}:{})};}
  const unlock=LEVEL_PATH.find(u=>u.level===s.level.level);
  if(unlock?.id==='token')s.pathNext='token';
  ups.push({level:s.level.level,energy,family:null,index:-1,...(unlock?{unlock:unlock.id}:{}),...(capacity?{capacity}:{})});
 }
 return ups;
}

// ---- restoration ----
export const currentArea=s=>AREAS[s.area];
// Places are upgraded in three stages; a place's first stage opens once the place before
// it has its first stage, and its later stages follow its own.
export const stageOf=(s,id)=>s.built[id]??0;
export function upgrades(s){
 const a=currentArea(s);if(!a)return [];
 return a.tasks.flatMap((t,k)=>{const n=stageOf(s,t.id),st=t.stages[n];
  // Build 47b (from PR #80): a stage may wait for another place's stage (requires: {place: stage}).
  // Build 48a (Chapter 3): a first stage that names what it waits for opens on that alone, so two
  // places can open together (the harbour's crane and warehouse); a first stage that names nothing
  // still waits for the place before it. Chapters 1-2 are unchanged (their only first stage with
  // requires, the Observatory hall's, waits for the place before it, the archive, as before).
  if(n>=STAGES||n===0&&k>0&&!st.requires&&!stageOf(s,a.tasks[k-1].id))return [];
  if(!stageReady(s,st))return [];
  return [{id:t.id,stage:n+1,name:st.name,cost:st.cost,effect:st.effect,lines:st.lines,icon:t.icon,place:t.name,materials:(s.materials?.[t.id]??0)>n,...(st.gold?{gold:st.gold}:{})}];}).sort((x,y)=>x.cost-y.cost);
}
export const stageReady=(s,st)=>!st?.requires||Object.entries(st.requires).every(([id,n])=>stageOf(s,id)>=n);
// The next stage of a place that waits for another place (for the card's explanation).
export function blockedStage(s,id){const t=TASKS[id],n=stageOf(s,id),st=t?.stages[n];return st&&!stageReady(s,st)?{stage:n+1,name:st.name,requires:st.requires}:null;}
// The cheapest upgrade whose materials are in (the one the main screen points to), and the
// cheapest still waiting for them (the gold order is for that one).
export const nextTask=s=>upgrades(s).find(u=>u.materials)??null;
export const storyTarget=s=>upgrades(s).find(u=>!u.materials)??null;
export const areaDone=(s,a=currentArea(s))=>!!a&&a.tasks.length>0&&a.tasks.every(t=>stageOf(s,t.id)>=STAGES);
export const builtCount=(s,a=currentArea(s))=>a?a.tasks.reduce((n,t)=>n+stageOf(s,t.id),0):0;
// Every area that has places is finished: the end of this prototype (Build 41 M5).
export const allDone=s=>AREAS.filter(a=>a.tasks.length).every(a=>areaDone(s,a));
// Stages bought in every area (orders grow harder with it).
export const totalBuilt=s=>Object.values(s.built).reduce((n,k)=>n+k,0);
// When an area is complete the next one with places opens (build 31: the Survey Worksite).
function advance(s){let next=null;while(areaDone(s)&&AREAS[s.area+1]?.tasks.length){s.area++;next=AREAS[s.area].id;}return next;}
// A stage waiting for materials with no gold order live gets one at once (Build 41e): it takes the
// place of the crew order the player has made least of (parts made stay on the board). Used after a
// purchase and, since Build 47b (from PR #80), when a save moves on to a new area as it loads.
function ensureGold(s){
 if(s.orders.some(o=>o?.story)||!storyTarget(s))return null;
 const made=o=>orderProgress(s,o).reduce((n,r)=>n+r.have/r.count,0),lane=s.orders.reduce((k,o,i)=>made(o)<made(s.orders[k])?i:k,0);
 const o=makeOrder(s);if(!o.story)return null;s.orders[lane]=o;return o.id;
}

export function act(s,a,now=Date.now()){
 const wasFull=s.energy>=capacityOf(s),r=step(s,a,now);
 if(!r.ok)return r;
 s.moves++;s.lastAt=now;
 // round 3: a generator that reached level 2 opens its kind's secondary chain (once); an introduction
 // is no longer queued once an order on the board asks that chain
 // (after any generator it brings out has its space)
 const released=release(s),unlocks=secondaryUnlock(s);s.secIntro=s.secIntro.filter(f=>!s.orders.some(o=>o?.needs?.some(q=>q.family===f)));
 const arrived=placePending(s);
 const found=note(s),xp=r.xp??0,levelUp=xp?gainXp(s,xp):[];
 if(levelUp.length)found.push(...note(s));
 if(levelUp.length)released.push(...release(s));
 // Energy owed (a milestone reward past STORE_ENERGY) is paid as room opens.
 const owed=payOwed(s);if(owed)r.owedPaid=owed;
 // The refill clock rested at or above the capacity; it restarts once energy is below the (current)
 // capacity again, so no refill credit builds up while above it.
 if(wasFull&&s.energy<capacityOf(s))s.energyAt=now;
 if(released.length)r.message+=released.map(n=>` · the ${SOURCES[n.id].name} comes out`).join('');
 return {...r,...(released.length?{released}:{}),...(arrived.length?{arrived}:{}),...(found.length?{found}:{}),...(levelUp.length?{levelUp}:{}),...(unlocks.length?{unlocks}:{})};
}
export function tick(s,now=Date.now()){return settleEnergy(s,now);}

function step(s,a,now){
 const fail=message=>({ok:false,message}),valid=i=>Number.isInteger(i)&&i>=0&&i<s.board.length;
 if(!a||typeof a.type!=='string')return fail('Unknown action.');
 if(a.type==='produce'){
  const i=valid(a.index)&&s.board[a.index]?.type==='source'&&s.board[a.index].id===a.id?a.index:s.board.findIndex(x=>x?.type==='source'&&x.id===a.id);
  if(i<0||!SOURCES[a.id])return fail('That generator is still sealed in cargo somewhere on the board.');
  if(!sourceOpen(s,a.id))return fail('Echo Crucible wakes at the Survey Worksite.');
  if(s.energy<1)return fail('Out of energy. It refills +1 every 2 minutes.');
  // Round 3: only a generator of level 2+ (with its chain open) rolls for a secondary part; `eligible`
  // is false on a level-1 copy, and false while drops are paused (nothing is rolled or counted then).
  const n=(s.taps[a.id]??0)+1,chain=GENERATOR_CHAINS[a.id][0][0],tier=Math.min(3,maxTier(chain),(n%4===0?1:0)+levelLift(producerLevel(s.board[i]),n)),
   source=secondarySource(s,i),eligible=source&&!secondaryPaused(s,a.id),sec=eligible?secondaryRoll(s,a.id):null;
  // Pilot: 'replace' makes the secondary part instead of the tap's own; 'bonus' makes it as well.
  const replace=sec&&SECONDARY_RULES[a.id].model==='replace',x=item(replace?sec:chain,replace?0:tier),j=put(s,x,i);
  // A full board refuses the tap before anything is spent or rolled: no energy, no part, no counter.
  if(j<0)return fail('The board is full. Merge, deliver or open cargo first.');
  s.energy--;s.taps[a.id]=n;
  if(eligible)s.secTaps[a.id]=(s.secTaps[a.id]??0)+1;
  if(replace){s.secSince[a.id]=0;return {ok:true,event:'produce',index:j,secondary:{family:sec,index:j},message:nameOf(x)};}
  let extra=null;
  // a drop with no space waits (s.pending) and is never lost: with 4 already waiting, drops pause
  if(sec){const y=item(sec,0),k=put(s,y,i);if(k<0)s.pending.push(y);s.secSince[a.id]=0;extra={family:sec,index:k};}
  else if(eligible)s.secSince[a.id]=Math.min(SECONDARY_RULES[a.id].pity,(s.secSince[a.id]??0)+1);
  // a level-2+ generator whose extras rest says so once in its message (rest: true)
  const rest=source&&!eligible;
  return {ok:true,event:'produce',index:j,...(extra?{secondary:extra}:{}),...(rest?{rest:true}:{}),message:nameOf(x)+(extra?' · and a '+nameOf(item(extra.family,0)):'')};
 }
 if(a.type==='merge'||a.type==='move'||a.type==='unseal'){
  const from=a.from,to=a.to??a.index;
  if(!valid(from)||!valid(to)||from===to)return fail('Choose another space.');
  const x=s.board[from],y=s.board[to];
  if(!['item','kit','source','cog','token'].includes(x?.type))return fail('That stays where it is.');
  if(x.type==='source'){
   if(!y){s.board[to]=x;s.board[from]=null;return {ok:true,event:'move',index:to,message:'Moved.'};}
   if(!generatorsMerge(x,y))return fail(y?.type==='source'&&y.id===x.id&&producerLevel(y)>=MAX_GENERATOR_LEVEL?`${SOURCES[x.id].name} is at its top level.`:'Merge two generators of the same kind and level.');
   y.level=producerLevel(y)+1;s.board[from]=null;
   return withCracks({ok:true,event:'producerUp',index:to,xp:XP.feed,message:`${SOURCES[y.id].name} reaches level ${y.level}`},crack(s,to));
  }
  // A Brass cog raises the generator it is laid on by one level.
  if(x.type==='cog'){
   if(!y){s.board[to]=x;s.board[from]=null;return {ok:true,event:'move',index:to,message:'Moved.'};}
   if(y.type!=='source')return fail('Lay the Brass cog on a generator: +1 level.');
   if(producerLevel(y)>=MAX_GENERATOR_LEVEL)return fail(`${SOURCES[y.id].name} is at its top level.`);
   y.level=producerLevel(y)+1;s.board[from]=null;
   return {ok:true,event:'producerUp',cog:true,index:to,xp:XP.feed,message:`Brass cog · ${SOURCES[y.id].name} reaches level ${y.level}`};
  }
  // A Tide token turns the part it is laid on into a part of the same tier an order wants.
  if(x.type==='token'){
   if(!y){s.board[to]=x;s.board[from]=null;return {ok:true,event:'move',index:to,message:'Moved.'};}
   if(y.type!=='item')return fail('Lay the Tide token on a part: it becomes a part a crew order wants.');
   const want=s.orders.flatMap(o=>o.needs).find(r=>r.tier===y.tier&&r.family!==y.family&&count(s,r)<r.count);
   if(!want)return fail(`No crew order is missing a Lv${y.tier+1} part of another kind, so the token cannot turn this one. Try a part of a level an order still needs.`);
   s.board[to]=item(want.family,y.tier);s.board[from]=null;
   return {ok:true,event:'swap',index:to,xp:XP.unseal,message:'Tide token · '+nameOf(s.board[to])};
  }
  // A part laid on the cargo it opens is used up, and the cargo opens.
  if(y?.type==='cargo'){
   if(!reachable(s,to))return fail('Open the cargo next to your camp first: this one is buried deeper.');
   if(!matches(x,y.key))return fail(`This cargo opens with a ${CHAINS[y.key.family].names[y.key.tier]}.`);
   s.board[from]=null;const opened=reveal(s,to);
   return {ok:true,event:'unseal',index:to,opened,xp:XP.unseal,message:'Cargo opened · '+(opened.type==='source'?'a new generator: '+SOURCES[opened.id].name+'!':opened.type==='cog'?'a Brass cog! Lay it on a generator: +1 level':opened.type==='token'?'a Tide token! Lay it on a part to turn it into one an order wants':opened.type==='jar'?`+${opened.energy} energy`:opened.type==='stars'?`+${opened.stars} ★`:opened.type==='space'?'empty':nameOf(s.board[to]))};
  }
  if(a.type==='unseal')return fail('Lay the part on the cargo it opens.');
  if(y?.type==='glass')return fail(`Tideglass takes no part. Merge in a space beside it: ${GLASS_HITS} merges break it.`);
  if(!y){s.board[to]=x;s.board[from]=null;return {ok:true,event:'move',index:to,message:'Moved.'};}
  if(x.type==='kit'){
   if(y?.type==='source')return fail('Crates give parts. To level a generator up, merge it with another of the same kind and level.');
   if(!kitsMerge(x,y))return fail(y?.type==='kit'&&x.size===MAX_KIT_SIZE?`A ${CRATES[MAX_KIT_SIZE-1]} is as big as crates get. Open it for its parts.`:'Merge two unopened crates of the same kind and size.');
   s.board[to]=kit(x.family,x.size+1);s.board[from]=null;s.merges++;
   return withCracks({ok:true,event:'merge',index:to,xp:XP.merge,message:nameOf(s.board[to])},crack(s,to,x.size+1));
  }
  if(y.type!=='item'||y.family!==x.family||y.tier!==x.tier)return fail('Merge two identical parts.');
  if(x.tier>=maxTier(x.family))return fail('This is the top of its chain.');
  s.board[to]=item(x.family,x.tier+1);s.board[from]=null;s.merges++;
  // Triple merge (the level path, level 3): a third identical part touching the space dropped on
  // joins, and the three make two (the second takes the third's space).
  const third=unlocked(s,'triple')&&x.tier>=TRIPLE_MIN_TIER?neighbours(to).find(k=>matches(s.board[k],x))??-1:-1;
  if(third>=0){s.board[third]=item(x.family,x.tier+1);s.merges++;}
  return withCracks({ok:true,event:'merge',index:to,...(third>=0?{triple:third}:{}),xp:XP.merge*(third>=0?2:1),message:nameOf(s.board[to])+(third>=0?' ×2 · triple merge':'')},crack(s,to,x.tier+1,third>=0?[third]:[]));
 }
 if(a.type==='openKit'){
  const box=valid(a.index)?s.board[a.index]:null;if(box?.type!=='kit')return fail('Choose a crate.');
  const chain=GENERATOR_CHAINS[box.family][0][0],x=item(chain,Math.min(kitDrop(box).tier,maxTier(chain))),last=box.left===1,i=last?a.index:nearestFree(s.board,a.index,cellPos);
  if(i<0)return fail('Make space next to the crate first.');
  box.left--;s.board[i]=x;
  return {ok:true,event:'kit',index:i,message:nameOf(x)+(last?' · the crate is empty':` · ${box.left} left`)};
 }
 if(a.type==='deliver'){
  const lane=s.orders.findIndex(o=>o?.id===a.id),o=s.orders[lane];
  if(!o)return fail('That order has already changed.');
  const take=orderItems(s,o);if(!take)return fail('Make the parts this order needs first.');
  for(const i of take)s.board[i]=null;
  // The lane is cleared first, so a delivered story order is followed by the next one.
  // Audit 2026-10-25 (user: "buguding ni hii"): a delivery also gives the crew +1 energy, so a
  // quick player waits less for energy (measured, chapter: 65 → 44 % of the time at 4 s an
  // action, 44 → 29 % at 6 s; +2 or more left no waiting at all, so energy stopped mattering).
  // Build 46f: the gold order gives no energy (its reward is the stage's materials); with orders
  // asking what the generators make, a stage takes more crew orders and their energy alone kept
  // slower players from ever running out. Round 3 (secondary pilot): an order with a rare extra gives
  // none either, like clearing one (a bonus drop never pays energy): with about one order in three
  // asking one, their energy kept the 10 s player from ever running out (economy guard).
  // Energy pass (build 47v): a mixed order (a primary part and a rare extra) gives the crew energy
  // again; only a quick job asking rare extras alone gives none (DELIVERY_ENERGY).
  const gain=DELIVERY_ENERGY[orderEnergyKind(o)];
  s.coins+=o.coins;s.ordersDone++;s.orders[lane]=null;s.energy=Math.min(MAX_ENERGY,s.energy+gain);
  // The first ordinary crew order delivered: +15 energy, once (s.boost.order).
  let boost=null;
  if(ordinaryOrder(o)&&!s.boost.order){s.boost.order=true;const paid=storeEnergy(s,ONBOARDING.order,{keep:true});boost={kind:'order',energy:ONBOARDING.order,...(paid<ONBOARDING.order?{owed:ONBOARDING.order-paid}:{})};}
  if(o.story&&TASKS[o.story]&&stageOf(s,o.story)<STAGES)s.materials[o.story]=stageOf(s,o.story)+1;
  s.orders[lane]=makeOrder(s);
  // A tool the order pays on top (the level path): next to the Rover; the delivery has just freed
  // at least one space, and the shed takes it if the board is somehow full.
  let tool=null;
  if(BONUSES.includes(o.bonus)){const x=o.bonus==='cog'?cog():o.bonus==='chest'?kit(newestGenerator(s),2):token(),i=nearestFree(s.board,ROVER,cellPos),k=s.shed.indexOf(null);
   if(i>=0){s.board[i]=x;tool={type:o.bonus,index:i};}else if(k>=0){s.shed[k]=x;tool={type:o.bonus,slot:k};}}
  // A gold order is the materials for its place's next stage (Build 41, user: "story upgrade
  // shuud hurdan hiigdej baina"): the stage can be bought once they are delivered. Orders no
  // longer bring a driftwood crate every third time.
  const materials=o.story&&s.materials[o.story]>stageOf(s,o.story)?{id:o.story,stage:s.materials[o.story]}:null;
  return {ok:true,event:'deliver',index:null,xp:Math.max(1,Math.round(o.coins/COIN_RATE)),coins:o.coins,box:-1,freed:take,...(materials?{materials}:{}),energy:gain,...(boost?{boost}:{}),...(tool?{tool}:{}),message:`+${o.coins} coins`+(gain?` · +${gain} energy`:'')+(boost?` · first crew order: +${boost.energy} energy`:'')+(tool?` · a ${BONUS_NAMES[tool.type]}`:'')+(materials?` · materials for ${TASKS[o.story].stages[materials.stage-1].name}`:'')};
 }
 // Upgrade a place on the beach one stage (the action keeps its old name, 'restore').
 if(a.type==='restore'){
  const up=upgrades(s),t=a.id===undefined?up[0]:up.find(u=>u.id===a.id);
  // Build 47e: a stage that waits for another place (the sea gate for the array) says which.
  const wait=!t&&TASKS[a.id]?blockedStage(s,a.id):null;
  if(wait)return fail(`${wait.name} opens once ${Object.entries(wait.requires).map(([id,n])=>TASKS[id].stages[n-1].name).join(' and ')} is done.`);
  if(!t)return fail(TASKS[a.id]&&stageOf(s,a.id)>=STAGES?`${TASKS[a.id].name} is fully upgraded.`:TASKS[a.id]?'Upgrade the place before it first.':'Everything here is upgraded.');
  if(!t.materials)return fail(`${t.name} needs its materials: deliver the gold order for it.`);
  if(s.coins<t.cost)return fail(`${t.name} needs ${t.cost} coins. Deliver crew orders for coins.`);
  s.coins-=t.cost;s.built[t.id]=t.stage;const e=t.effect??{},effects={};
  if(e.energy){effects.energy=bonus(s,e.energy);}
  // The first stage bought: +20 energy, once (s.boost.stage), on top of the stage's own effects.
  if(!s.boost.stage){s.boost.stage=true;const paid=storeEnergy(s,ONBOARDING.stage,{keep:true});effects.boost={kind:'stage',energy:ONBOARDING.stage,...(paid<ONBOARDING.stage?{owed:ONBOARDING.stage-paid}:{})};}
  if(e.copy){const id=e.copy==='newest'?newestGenerator(s):e.copy;effects.copy=give(s,source(id));effects.copyId=id;}
  if(e.kit){const family=e.kit[0]==='newest'?newestGenerator(s):e.kit[0];effects.kit=give(s,kit(family,e.kit[1]));effects.kitFamily=family;}
  if(e.token){effects.token=give(s,token());}
  if(e.cog){effects.cog=give(s,cog());}
  if(s.pending.length)effects.pending=s.pending.length;
  if(e.slots&&s.slots<e.slots){s.slots=e.slots;while(s.orders.length<s.slots)s.orders.push(makeOrder(s));effects.slots=e.slots;}
  if(areaDone(s)){effects.areaDone=AREAS[s.area].id;const next=advance(s);if(next)effects.nextArea=next;}
  // A stage that opens with no gold order live gets one at once (Build 41e): it takes the place
  // of the crew order the player has made least of (parts made stay on the board).
  // Build 47b (from PR #80): a gold order for a place that needs no more materials (finished, or
  // already supplied) is replaced, so a finished area leaves no stale gold order behind.
  for(let k=0;k<s.orders.length;k++){const o=s.orders[k];if(o?.story&&(stageOf(s,o.story)>=STAGES||(s.materials[o.story]??0)>stageOf(s,o.story))){s.orders[k]=null;s.orders[k]=makeOrder(s);}}
  const gold=ensureGold(s);if(gold)effects.goldOrder=gold;
  return {ok:true,event:'restore',task:t.id,stage:t.stage,effects,xp:XP.restore,message:t.name+(t.stage===1?' · restored':` · stage ${t.stage}`)};
 }
 // The shed: a part, crate, cog or token goes in the first free shed space, and back out to
 // the space asked for (or the nearest free one to the Rover).
 if(a.type==='store'){
  const x=valid(a.index)?s.board[a.index]:null;if(!SHED_TYPES.includes(x?.type))return fail('Only parts, crates, cogs and tokens go in the shed.');
  const k=Number.isInteger(a.slot)&&s.shed[a.slot]===null?a.slot:s.shed.indexOf(null);if(k<0)return fail('The shed is full. Take something out first.');
  s.shed[k]=x;s.board[a.index]=null;return {ok:true,event:'store',slot:k,message:nameOf(x)+' · in the shed'};
 }
 if(a.type==='unstore'){
  const x=Number.isInteger(a.slot)?s.shed[a.slot]:null;if(!x)return fail('That shed space is empty.');
  const i=valid(a.to)&&s.board[a.to]===null?a.to:nearestFree(s.board,ROVER,cellPos);if(i<0)return fail('The board is full. Make space first.');
  s.board[i]=x;s.shed[a.slot]=null;return {ok:true,event:'unstore',index:i,message:nameOf(x)+' · back on the board'};
 }
 // The daily gift: the app passes today's local day number; one gift per new day.
 if(a.type==='daily'){
  if(!Number.isInteger(a.day)||a.day<0)return fail('Unknown day.');
  if(a.day<=s.daily.day)return fail('Today\'s gift is already open. Come back tomorrow.');
  const n=s.daily.count%DAILY.length,g=DAILY[n],gift={day:n+1};
  if(g.kit||g.token||g.cog){const x=g.kit?kit(newestGenerator(s),g.kit):g.token?token():cog(),i=nearestFree(s.board,ROVER,cellPos),k=s.shed.indexOf(null);
   if(i<0&&k<0)return fail('Make space on the board or in the shed for today\'s gift.');
   if(i>=0){s.board[i]=x;gift.index=i;}else{s.shed[k]=x;gift.slot=k;}gift.thing=x;}
  if(g.energy){storeEnergy(s,g.energy,{keep:true});gift.energy=g.energy;}
  if(g.coins){s.coins+=g.coins;gift.coins=g.coins;}
  s.daily={day:a.day,count:s.daily.count+1};
  return {ok:true,event:'daily',gift,index:gift.index??null,message:`Daily gift · day ${n+1} of ${DAILY.length}`};
 }
 // The book: tick off a found part for its coins; a page with every part ticked gives a cog.
 if(a.type==='book'){
  const k=typeof a.key==='string'?a.key:'';if(!bookReady(s).includes(k))return fail(s.book.claimed.includes(k)?'Already in the book.':'Find this part on the board first.');
  const tier=+k.match(/\d+$/)[0],coins=BOOK_COINS[tier];s.book.claimed.push(k);s.coins+=coins;
  return {ok:true,event:'book',key:k,coins,message:`In the book · +${coins} coins`};
 }
 if(a.type==='bookPage'){
  if(!BOOK_CHAINS.includes(a.family)||!pageReady(s,a.family))return fail(s.book.pages?.includes(a.family)?'This page is already complete.':CHAINS[a.family]?.secondary?'This page pays its coins as its parts are ticked off.':'Find every part on this page first.');
  const i=nearestFree(s.board,ROVER,cellPos),k=s.shed.indexOf(null);if(i<0&&k<0)return fail('Make space on the board or in the shed for the Brass cog.');
  if(i>=0)s.board[i]=cog();else s.shed[k]=cog();s.book.pages.push(a.family);
  return {ok:true,event:'bookPage',family:a.family,index:i>=0?i:null,slot:i>=0?null:k,message:`${CHAINS[a.family].names.at(-1)} page complete · a Brass cog`};
 }
 // The shop: buy with coins, or take an ad offer once its ad has played. Stock is per local day.
 // Change a crew order: the new one is made while the old still stands, so it asks for
 // something else.
 if(a.type==='swapOrder'){
  const lane=s.orders.findIndex(o=>o?.id===a.id),o=s.orders[lane];
  if(!o)return fail('That order has already changed.');
  if(o.story)return fail('The gold order is for the coast\'s next stage: it cannot be changed.');
  if(!Number.isInteger(a.day)||a.day<Math.max(0,s.swaps.day))return fail('Unknown day.');
  const free=swapsLeft(s,a.day)>0;
  if(!free&&!a.ad)return fail('No free order changes left today. Watch a short ad to change it.');
  if(!free&&adSwapsLeft(s,a.day)<1)return fail('No more order changes today.');
  if(a.day>s.swaps.day)s.swaps={day:a.day,n:0,ads:0};
  if(free)s.swaps.n++;else s.swaps.ads++;
  const next=makeOrder(s);s.orders[lane]=next;
  return {ok:true,event:'swapOrder',id:next.id,old:o.id,ad:!free,message:'A new crew order'};
 }
 if(a.type==='buy'||a.type==='adReward'){
  const o=SHOP[a.id];if(!o||!!o.ad!==(a.type==='adReward'))return fail('Unknown offer.');
  if(!Number.isInteger(a.day)||a.day<Math.max(0,s.shop.day))return fail('Unknown day.');
  if(shopLeft(s,a.id,a.day)<1)return fail(`No more ${o.name.toLowerCase()} today. The shop restocks tomorrow.`);
  if(!o.ad&&s.coins<o.cost)return fail(`${o.name} costs ${o.cost} coins.`);
  if(o.energy&&s.energy+o.energy>MAX_ENERGY)return fail('Energy is almost full. Spend some first.');
  let thing=null,index=null,slot=null;
  if(o.kit||o.token||o.cog){thing=o.kit?kit(newestGenerator(s),o.kit):o.token?token():cog();const i=nearestFree(s.board,ROVER,cellPos),k=s.shed.indexOf(null);
   if(i<0&&k<0)return fail('Make space on the board or in the shed first.');
   if(i>=0){s.board[i]=thing;index=i;}else{s.shed[k]=thing;slot=k;}}
  if(a.day>s.shop.day)s.shop={day:a.day,bought:{}};
  s.shop.bought[a.id]=(s.shop.bought[a.id]??0)+1;
  if(!o.ad)s.coins-=o.cost;
  if(o.energy)s.energy+=o.energy;
  return {ok:true,event:'shop',id:a.id,ad:!!o.ad,index,slot,thing,energy:o.energy??0,message:`${o.name}`+(o.energy?` · +${o.energy} energy`:'')+(slot!=null?' · in the shed':'')};
 }
 // The prototype-complete screen has been seen (Build 41 M5): it shows once.
 // A story card the player has dismissed (Build 47b, from PR #80): it never plays again by itself.
 if(a.type==='seen'){if(typeof a.id!=='string'||!SEEN_ID.test(a.id))return fail('Unknown story card.');if(s.seen[a.id])return fail('Already seen.');s.seen[a.id]=true;return {ok:true,event:'seen',id:a.id,message:''};}
 if(a.type==='seenEnd'){if(!allDone(s)||s.seenEnd)return fail('Nothing to see yet.');s.seenEnd=true;return {ok:true,event:'seenEnd',message:'The coast so far is restored.'};}
 if(a.type==='recycle'){
  const x=valid(a.index)?s.board[a.index]:null;if(x?.type!=='item')return fail('Only loose parts can be recycled.');
  // A secondary part cost no energy (bonus model), so clearing it gives none back (pilot).
  const gain=isSecondary(x.family)?0:1;s.board[a.index]=null;s.energy=Math.min(MAX_ENERGY,s.energy+gain);
  return {ok:true,event:'recycle',energy:gain,message:'Recycled'+(gain?' · +1 energy':'')};
 }
 if(a.type==='ration'){
  if(s.energy>3)return fail('Field rations are for low energy.');
  const wait=rationWait(s,now);if(wait>0)return fail(`Next field ration in ${Math.ceil(wait/60000)} min.`);
  s.energy+=RATION_ENERGY;s.rationAt=now;return {ok:true,event:'ration',message:`Field ration · +${RATION_ENERGY} energy`};
 }
 return fail('Unknown action.');
}

// ---- saves ----
const validItem=f=>!!CHAINS[f.family]&&integer(f.tier,0,maxTier(f.family));
const validCrate=x=>!!GENERATOR_CHAINS[x.family]&&integer(x.size,1,MAX_KIT_SIZE)&&integer(x.left,1,KIT_DROPS[x.size].length);
function validFind(f){
 if(f===undefined)return true;
 if(f?.type==='item')return validItem(f)&&f.tier<=3;
 if(f?.type==='jar')return integer(f.energy,1,50);
 if(f?.type==='coins')return integer(f.n,1,100);
 if(f?.type==='kit')return validCrate(f);
 if(f?.type==='source')return !!GENERATOR_CHAINS[f.id];
 if(f?.type==='cog'||f?.type==='token')return Object.keys(f).length===1;
 return false;
}
function validCell(x){
 if(x===null)return true;if(!x||typeof x!=='object')return false;
 if(x.type==='item')return validItem(x);
 if(x.type==='source')return !!SOURCES[x.id]&&validProducerLevel(x);
 if(x.type==='kit')return validCrate(x);
 if(x.type==='cargo')return !!x.key&&validItem(x.key)&&validFind(x.find);
 if(x.type==='cog'||x.type==='token')return Object.keys(x).length===1;
 if(x.type==='glass')return validItem(x)&&x.tier<maxTier(x.family)&&(x.cracks===undefined||integer(x.cracks,0,GLASS_HITS-1));
 return false;
}
const validNeed=r=>r&&CHAINS[r.family]&&integer(r.tier,0,maxTier(r.family))&&integer(r.count,1,4);
const validOrder=o=>o&&typeof o.id==='string'&&Array.isArray(o.needs)&&o.needs.length>=1&&o.needs.length<=2&&o.needs.every(validNeed)&&integer(o.coins,1,999)&&(o.story===undefined||!!TASKS[o.story])&&['ivo','neri','tamsin','bram'].includes(o.who)&&(o.bonus===undefined||BONUSES.includes(o.bonus));

// Build 3 (version 1) had sand and numbered cells; build 4 (version 2) had the tide.
// Both become sealed cargo: each covered cell gets the key this layout gives it and
// keeps its own find. Generators the player already has stay; the new ones (Rope
// Winch, Shell Trap, Lantern Kiln) are sealed into covered cells, keyed as in a new
// camp, so no save misses them. Anything already on the board stays where it is.
const covered=x=>x?.type==='sand'||x?.type==='gate'||x?.type==='water';
function upgrade(s){
 const keyOf=i=>{const c=CARGO[i];return c?{family:c[0],tier:c[1]}:{family:'rig',tier:1};};
 s.board=s.board.map((x,i)=>covered(x)?cargo(keyOf(i),x.find):x);
 for(const [g,cell] of [['rope',at(5,1)],['shell',at(0,5)],['lamp',at(4,6)]]){
  if(s.board.some(x=>x?.type==='source'&&x.id===g||x?.type==='cargo'&&x.find?.type==='source'&&x.find.id===g))continue;
  const key={family:CARGO[cell][0],tier:CARGO[cell][1]};
  let j=s.board[cell]?.type==='cargo'?cell:s.board.findIndex(x=>x?.type==='cargo'&&x.find?.type!=='source');
  if(j<0)j=s.board.indexOf(null);
  if(j<0)j=s.board.findIndex(x=>x?.type==='item'&&x.tier===0);
  if(j>=0)s.board[j]=cargo(key,source(g));
 }
 for(const g of Object.keys(GENERATOR_CHAINS))s.taps[g]??=0;
 s.version=3;
}
// Build 16 (version 4): stars became coins (five to a star) and each restored place is
// a place at stage 1 of 3. Orders and star pouches in cargo convert the same way.
function toV4(s){
 if(!integer(s.stars,0,99999)||!Array.isArray(s.done)||!Array.isArray(s.orders)||!Array.isArray(s.board))return;
 s.coins=s.stars*COIN_RATE;delete s.stars;
 s.built=Object.fromEntries(s.done.filter(id=>TASKS[id]).map(id=>[id,1]));delete s.done;
 for(const o of s.orders)if(o&&integer(o.stars,1,99)){o.coins=o.stars*COIN_RATE;delete o.stars;}
 for(const x of s.board)if(x?.type==='cargo'&&x.find?.type==='stars'&&integer(x.find.n,1,20))x.find={type:'coins',n:x.find.n*COIN_RATE};
 s.version=VERSION;
}
export function load(raw,now=Date.now()){
 try{
  const s=JSON.parse(raw);
  if((s?.version===1||s?.version===2)&&Array.isArray(s.board)&&s.taps&&typeof s.taps==='object')upgrade(s);
  if(s?.version===3)toV4(s);
  // Version 5 (energy pass, build 47v): the save shape only gains optional fields (set below).
  const before47v=s?.version===4;if(before47v)s.version=VERSION;
  if(s?.version!==VERSION||!Array.isArray(s.board)||s.board.length!==BOARD_SIZE||!s.board.every(validCell))return fresh(now);
  if(!integer(s.energy,0,MAX_ENERGY)||!integer(s.coins,0,999999)||!integer(s.area,0,AREAS.length-1)||!AREAS[s.area].tasks.length||!integer(s.slots,3,4))return fresh(now);
  // Build 30 could price a sixth-tier story order at NaN coins (saved as null): it is priced again.
  if(Array.isArray(s.orders))for(const o of s.orders)if(o&&o.coins===null&&Array.isArray(o.needs)&&o.needs.every(validNeed))o.coins=priceOf(o.needs,!!o.story);
  if(!Array.isArray(s.orders)||s.orders.length!==s.slots||!s.orders.every(validOrder))return fresh(now);
  for(const o of s.orders)if(o.born!==undefined&&!integer(o.born,0,s.moves))delete o.born;
  if(!s.built||typeof s.built!=='object'||Array.isArray(s.built)||!Object.entries(s.built).every(([id,n])=>TASKS[id]&&integer(n,1,STAGES))||!Array.isArray(s.found))return fresh(now);
  for(const k of ['orderSeq','ordersDone','moves','merges'])if(!integer(s[k],0,1e9))return fresh(now);
  // A generator added later (Build 47e: the Lens Bench) starts with no taps in an older save.
  if(s.taps&&typeof s.taps==='object'&&!Array.isArray(s.taps))for(const k of Object.keys(GENERATOR_CHAINS))s.taps[k]??=0;
  if(!s.taps||!Object.keys(GENERATOR_CHAINS).every(k=>integer(s.taps[k],0,1e9)))return fresh(now);
  // Build 32 added the shed and the daily gift; older saves get an empty shed and a gift today.
  s.shed??=Array(SHED_SLOTS).fill(null);s.daily??={day:-1,count:0};
  // Build 47a added rewards waiting for space, Build 47b dismissed story cards; older saves have none.
  s.pending??=[];s.seen??={};
  // Build 33 added the book: parts already found wait in it to be ticked off.
  s.book??={claimed:[],pages:[]};
  // Build 34 added the shop's daily stock.
  s.shop??={day:-1,bought:{}};
  // Build 36 added order changes.
  s.swaps??={day:-1,n:0,ads:0};
  // Build 44 remembers the last everyday orders (to vary new ones); older or damaged saves start
  // with none, which only means the next order may repeat an old one.
  if(!Array.isArray(s.recent)||s.recent.length>RECENT||!s.recent.every(k=>typeof k==='string'&&k.length<=40))s.recent=[];
  // Build 41 added materials (stages whose gold order is delivered). An older save is not held
  // back: every stage it could buy before has its materials (set below, once its area is known).
  const before41=s.materials===undefined;s.materials??={};
  if(!s.materials||typeof s.materials!=='object'||Array.isArray(s.materials)||!Object.entries(s.materials).every(([id,n])=>TASKS[id]&&integer(n,1,STAGES)))return fresh(now);
  // Build 41 added seenEnd (the prototype-complete screen shown): absent means not yet.
  if(s.seenEnd!==undefined&&typeof s.seenEnd!=='boolean')return fresh(now);
  // The level path (Build 46j): a Tide-token order level 5 promised, still to come. Saves before it
  // have none; a damaged value is dropped (it only means the next token order waits its turn).
  if(s.pathNext!==undefined&&s.pathNext!=='token')delete s.pathNext;
  // The secondary-chain pilot's bad-luck counters (2026-10-29). Saves before it have none: they start
  // at 0, so the first secondary part comes within its `first` taps once it opens. A damaged value only
  // restarts that count (it never resets the camp).
  if(!s.secSince||typeof s.secSince!=='object'||Array.isArray(s.secSince))s.secSince={};
  for(const k of Object.keys(s.secSince))if(!SECONDARY_OF[k])delete s.secSince[k];
  for(const g of Object.keys(SECONDARY_OF))if(!integer(s.secSince[g],0,SECONDARY_RULES[g].pity))s.secSince[g]=0;
  // Round 3: eligible taps (the roll's number), opened chains and queued introductions. Saves before it
  // have none: eligible taps start at 0, and the chains of generators already at level 2+ open below
  // (after the board is checked), with the gift and the introduction only for a chain never met.
  // Damaged values only restart a count or drop an introduction; they never reset the camp.
  if(!s.secTaps||typeof s.secTaps!=='object'||Array.isArray(s.secTaps))s.secTaps={};
  for(const k of Object.keys(s.secTaps))if(!SECONDARY_OF[k])delete s.secTaps[k];
  for(const g of Object.keys(SECONDARY_OF))if(!integer(s.secTaps[g],0,1e9))s.secTaps[g]=0;
  if(!s.secOpen||typeof s.secOpen!=='object'||Array.isArray(s.secOpen))s.secOpen={};
  s.secOpen=Object.fromEntries(Object.keys(SECONDARY_OF).filter(g=>s.secOpen[g]===true).map(g=>[g,true]));
  s.secIntro=Array.isArray(s.secIntro)?[...new Set(s.secIntro.filter(f=>Object.values(SECONDARY_OF).includes(f)))]:[];
  if(!s.swaps||!integer(s.swaps.day,-1,1e7)||!integer(s.swaps.n,0,FREE_SWAPS)||!integer(s.swaps.ads,0,AD_SWAPS))return fresh(now);
  if(!s.shop||!integer(s.shop.day,-1,1e7)||!s.shop.bought||typeof s.shop.bought!=='object'||Array.isArray(s.shop.bought)||!Object.entries(s.shop.bought).every(([id,n])=>SHOP[id]&&integer(n,0,SHOP[id].limit)))return fresh(now);
  const bookKey=k=>typeof k==='string'&&/^[a-z]+\d$/.test(k)&&BOOK_CHAINS.includes(k.slice(0,-1))&&+k.slice(-1)<=maxTier(k.slice(0,-1));
  if(!s.book||!Array.isArray(s.book.claimed)||!Array.isArray(s.book.pages)||!s.book.claimed.every(k=>bookKey(k)&&s.found.includes(k))||new Set(s.book.claimed).size!==s.book.claimed.length||!s.book.pages.every(f=>BOOK_CHAINS.includes(f)&&bookKeys(f).every(k=>s.book.claimed.includes(k))))return fresh(now);
  if(!s.seen||typeof s.seen!=='object'||Array.isArray(s.seen)||!Object.entries(s.seen).every(([k,v])=>SEEN_ID.test(k)&&v===true))return fresh(now);
  if(!Array.isArray(s.pending)||s.pending.length>PENDING_MAX||!s.pending.every(x=>PENDING_TYPES.includes(x?.type)&&validCell(x)))return fresh(now);
  if(!Array.isArray(s.shed)||s.shed.length!==SHED_SLOTS||!s.shed.every(x=>x===null||SHED_TYPES.includes(x?.type)&&validCell(x)))return fresh(now);
  if(!s.daily||!integer(s.daily.day,-1,1e7)||!integer(s.daily.count,0,1e7))return fresh(now);
  s.level=validLevel(s.level);
  // Saves that finished the beach before the Survey Worksite existed go up the cliff.
  // Saves that finished the beach before the Survey Worksite existed go up the cliff, and since
  // Build 47b a finished worksite goes on to the Vault door, with its gold order ready.
  if(advance(s))ensureGold(s);
  // seenEnd marked the end of the content of its day (Build 41 M5); a camp with new places to build
  // (Build 47b: the Vault door) sees the end card again when it reaches the new end.
  // Build 47e: a camp that had read the Tide Archive (Build 47d's end) has the Observatory to build:
  // its first stage gets its gold order at once, as a new area's does.
  if(s.seenEnd&&!allDone(s)){delete s.seenEnd;ensureGold(s);}
  if(before41)for(const u of upgrades(s))s.materials[u.id]=u.stage;
  if(s.rationAt!==undefined&&!(Number.isFinite(s.rationAt)&&s.rationAt<=now))delete s.rationAt;
  if(!Number.isFinite(s.energyAt)||s.energyAt>now)s.energyAt=now;
  // Energy pass (build 47v; docs/V5_ENERGY_CAPACITY_2026-11-01.md). The refill capacity follows the
  // player level from now on; nothing earned before is paid again, and energy is never reduced.
  // - capPaid (the capacity already paid for) is the level's capacity: a save from before the pass is
  //   not paid its past increases, and a reload can never pay one twice.
  // - boost (the one-time +15 and +20): a save from before the pass has them claimed if it has
  //   already delivered an ordinary crew order (deliveries other than gold orders, which are counted
  //   by the materials they brought) or bought a stage; otherwise it stays eligible. A damaged value
  //   is worked out the same way.
  // - energyOwed (milestone energy waiting for room under STORE_ENERGY): a damaged value is dropped.
  // - the refill clock: the save's time away is first settled at the old fixed capacity (50), as the
  //   build it came from would have; a camp then at 50 or more starts its clock now, so no refill
  //   credit from time spent full is paid at the new capacity.
  s.capPaid=capacityAt(s.level.level);
  if(!s.boost||typeof s.boost!=='object'||Array.isArray(s.boost)||typeof s.boost.order!=='boolean'||typeof s.boost.stage!=='boolean'){
   const gold=Object.values(s.materials).reduce((n,k)=>n+k,0);
   s.boost={order:s.ordersDone>gold,stage:totalBuilt(s)>0};
  }else s.boost={order:s.boost.order,stage:s.boost.stage};
  if(s.energyOwed!==undefined&&!integer(s.energyOwed,1,1000))delete s.energyOwed;
  if(before47v){settleEnergy(s,now,REFILL_CAP);if(s.energy>=REFILL_CAP)s.energyAt=now;}
  // Round 3: a generator already at level 2+ (an older save) opens its kind's secondary chain now, once.
  secondaryUnlock(s,{wait:true});
  settleEnergy(s,now);payOwed(s);
  return s;
 }catch{return fresh(now);}
}
