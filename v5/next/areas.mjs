// The coast, area by area. Crew orders pay coins; on the beach screen coins upgrade each
// place in three stages (user, 2026-10-22: "bielsen taskaas mungu olood undsen storygoo
// upgrade hiimeer baina, teren tusdaa orchinruu ochij upgrade hiih"). Every stage changes
// the picture, adds a line or two of story and gives a reward (energy, a crate, a Tide
// token, a fourth order card or a generator copy; every stage since build 22). Six stages
// give generator copies (build 18): level a generator to 3 with them to bring out the next kind. A place's first
// stage opens once the place before it has its first stage; its later stages follow its own.
// Pure data. Effects are applied by game.mjs.
// Build 48c (docs/V5_RARE_MERGES_RESTORATION_2026-11-01.md): six stages, chosen for what they repair,
// name a FIXED merged rare part (rare: [chain, tier]) that replaces their gold order's second material:
// the same part for every player, whatever they hold (build 48b lowered a tier-2 part to tier 1 for a
// player holding no Gear, which punished saving one). Gears go to geared machines (the worksite hoist,
// the lens bench's grinding wheel) and the crane's cargo needs a Gear assembly; notes go to the
// Observatory's charts and logbook (an Expedition note, then a Travel notebook) and the registry's
// route (a Travel notebook). Only if the chain cannot drop at all (never opened, or no level-2+
// generator on the board) does the stage ask its usual materials instead: no circular unlock. While
// the gold order lacks its rare part, that chain's drops are certain sooner (game.mjs goldChase).
const place=(id,icon,at,stages,art)=>({id,icon,at,name:stages[0].name,stages,...(art?{art}:{})});
// art: a place drawn stage by stage on the area picture (v5/assets/premium/coast/place-<art>-<stage>.webp,
// build 38); the others still show their icon.
export const AREAS=[
 // map (Build 41n): the coast screen's own picture, painted from above, with each place's stage
 // drawn on it as a separate layer standing on its point (at = where its ground sits, in %).
 {id:'beach',name:'Landing Beach',short:'BEACH',picture:'landing',map:'landing-map',
  intro:[['neri','The storm left us one beach and a lot of sand. Somewhere under the cliff is the Tideglass Vault.'],['ivo','First we make this beach a camp. Bring me parts and I will put them to work.']],
  tasks:[
   place('beach-path','rock',[27,86],[
    {name:'Clear the landing path',cost:40,effect:{kit:['rig',1]},lines:[['ivo','A path from the boats to dry ground. Now the crew can carry real loads.'],['ivo','Somebody left a driftwood crate on it: it is ours now.']]},
    {name:'Lay a boardwalk',cost:70,effect:{copy:'rig'},lines:[['ivo','Planks over the sand. The carts stop sinking.'],['ivo','A Rivet Rover was buried under the old planks! Merge it with yours.']]},
    {name:'Line the path with lanterns',cost:100,effect:{copy:'rig'},lines:[['neri','Lanterns all the way to the boats. Night shifts are safe now.'],['ivo','The first night shift dug up a Rivet Rover the storm had buried. Merge it with ours.']]}],'path'),
   place('beach-tent','crate-salvage',[52,62],[
    {name:'Pitch the camp tent',cost:80,effect:{energy:8},lines:[['neri','Dry blankets and hot tea. Everyone works faster after a rest.'],['ivo','+8 energy for the crew.']]},
    {name:'Add bunks and a stove',cost:100,effect:{copy:'rig'},lines:[['neri','Bunks and a stove. Nobody sleeps on wet sand any more.'],['ivo','Under the old bunks: a rusted Rivet Rover. A little oil and it runs. Merge it with ours.']]},
    {name:'Raise the mess hall',cost:120,effect:{token:1},lines:[['bram','A real mess hall. The crew eats together and plans together.']]}],'tent'),
   place('beach-mast','source-chart',[50,34],[
    {name:'Raise the signal mast',cost:100,effect:{slots:4},lines:[['neri','The mast is up. Camps along the reach can see our signal.'],['bram','More crews will send orders now: a fourth order card.']]},
    {name:'Hang the signal flags',cost:120,effect:{copy:'rig'},lines:[['neri','Flags for every crew along the reach. They know who we are.'],['bram','A neighbouring camp answered with a gift: another Rivet Rover.']]},
    {name:'Fit a lookout nest',cost:150,effect:{token:1},lines:[['tamsin','From the lookout I can see the cliff path, and something glinting beyond it.']]}],'mast'),
   place('beach-workshop','workshop',[21,47],[
    {name:'Restore the Coastal Workshop',cost:100,effect:{copy:'newest'},lines:[['ivo','Tools on the wall, fire in the forge.'],['ivo','In the back of the Workshop: a copy of our newest generator. Merge it in for a stronger one.']]},
    {name:'Fire up the forge',cost:120,effect:{kit:['newest',2]},lines:[['ivo','The forge is hot again. Every tool in camp gets a fresh edge.']]},
    {name:'Open the parts store',cost:150,effect:{kit:['newest',2]},lines:[['ivo','Shelves for every part we make. The Workshop runs like a clock.']]}],'workshop'),
   place('beach-pier','crate-survey',[66,80],[
    {name:'Build the supply pier',cost:120,effect:{kit:['newest',2]},lines:[['bram','A pier means supply boats. The first one brought a sea chest for our newest generator.']]},
    {name:'Add a cargo crane',cost:150,effect:{copy:'newest'},lines:[['bram','A crane on the pier. Supply boats unload in half the time.'],['bram','The first load off the crane: a copy of our newest generator.']]},
    {name:'Moor the supply boat',cost:180,effect:{kit:['newest',3]},lines:[['bram','Our own boat, tied up and ready. The beach is joined to the world again.']]}],'pier'),
   place('beach-beacon','flux-3',[76,40],[
    {name:'Light the beacon',cost:140,effect:{energy:10},lines:[['tamsin','The beacon burns all night. Nobody gets lost on this beach again.'],['ivo','The crew is rested and proud: +10 energy.']]},
    {name:'Mirror the beacon',cost:170,effect:{copy:'newest'},lines:[['tamsin','Brass mirrors double the light. Ships see us from the open sea.'],['tamsin','A trader followed the light in and left us a copy of our newest generator.']]},
    {name:'Crown the beacon',cost:200,effect:{token:1},lines:[['tamsin','The beacon wears a crown of tideglass. It hums when the tide turns.']]}],'beacon'),
   place('beach-cliff','chart-1',[88,56],[
    {name:'Clear the cliff path',cost:160,effect:{energy:3},lines:[['neri','Rockfall cleared. The path climbs halfway up the cliff.']]},
    {name:'Rope the cliff steps',cost:200,effect:{copy:'newest'},lines:[['ivo','Ropes and pegs on every step. Even the carts can climb now.'],['neri','Halfway up we found an old cache: a copy of our newest generator.']]},
    {name:'Open the cliff gate',cost:230,effect:{kit:['newest',3]},lines:[['neri','The cliff gate is open. Up there, the survey worksite and the Vault beyond it.'],['ivo','The beach is a camp now. Good work, everyone.']]}],'cliff')
  ]},
 // Area 2 (build 31, user: "ehleed ediin zasgiig changalaad 2-r busiig nem"): the same shape as the
 // beach, seven places in three stages, built around the Rope Winch. It opens when the beach's
 // last stage is bought; half of its everyday orders want Rope Winch parts (focus).
 // Its stage copies level the Rope Winch (bringing out the Shell Trap) and then the Shell Trap,
 // so the Lantern Kiln comes out before its last stage (build 36: 'Light the door' gives the
 // copy that was missing; the Kiln never came out before).
 {id:'worksite',name:'Survey Worksite',short:'SITE',picture:'worksite',focus:'rope',
  intro:[['neri','Up the cliff at last: the Survey Worksite. Old instruments half-buried in sand, and a door in the rock.'],['ivo','Everything up here is hauled, hoisted or lowered. The Rope Winch will be busy.']],
  tasks:[
   place('ws-camp','crate-survey',[10,50],[
    {name:'Pitch the survey camp',cost:80,effect:{energy:8},lines:[['bram','Tents up on the cliff top. The crew can sleep where it works.'],['ivo','+8 energy for the crew.']]},
    {name:'Stack the instrument crates',cost:100,effect:{kit:['newest',2]},lines:[['neri','Every crate labelled and stacked. One of them was still full: a sea chest for our newest generator.']]},
    {name:'Raise a drafting table',cost:130,effect:{token:1},lines:[['neri','A table for the maps. Now we can plan the whole cliff on paper first.']]}],'ws-camp'),
   place('ws-scope','chart-3',[28,64],[
    {name:'Set up the theodolite',cost:100,effect:{copy:'newest'},lines:[['neri','The old theodolite still turns. It points straight at the door in the rock.'],['ivo','Packed beside it: a copy of our newest generator. Merge it in.']]},
    {name:'Mark the survey lines',cost:130,effect:{energy:5},lines:[['neri','White lines across the whole worksite. Nobody digs in the wrong place again.']]},
    {name:'Chart the whole cliff',cost:140,effect:{kit:['newest',2]},lines:[['neri','The cliff is charted, every ledge and crack. The door sits in the middle of an old quarry.']]}],'ws-scope'),
   place('ws-ropes','rope-1',[14,86],[
    {name:'Coil the hauling ropes',cost:110,effect:{copy:'newest'},lines:[['ivo','Rope everywhere, tangled by the storm. Coiled, it is worth more than gold up here.'],['ivo','Under the last coil: a copy of our newest generator.']]},
    {name:'Splice the long lines',cost:140,effect:{token:1},lines:[['ivo','Spliced lines long enough to reach the beach. Loads can come straight up.']]},
    {name:'Rig the rope store',cost:160,effect:{kit:['rope',3]},lines:[['ivo','A proper rope store, dry and ordered. The Rope Winch never runs short.'],['bram','The store keeper left us a captain\'s trunk for the winch.']]}],'ws-ropes'),
   place('ws-steps','rock',[48,60],[
    {name:'Cut steps through the rocks',cost:130,effect:{energy:10},lines:[['ivo','Steps cut through the boulders. The carts reach the door now.'],['bram','The crew is proud of the work: +10 energy.']]},
    {name:'Fit hand ropes',cost:150,effect:{copy:'newest'},lines:[['ivo','Hand ropes on every step. Safe in the wind, safe in the rain.'],['neri','Wedged under a step: a copy of our newest generator.']]},
    {name:'Pave the quarry floor',cost:170,effect:{kit:['newest',2]},lines:[['bram','A level floor in front of the door. Room for the whole crew and all the tools.']]}],'ws-steps'),
   place('ws-pool','shell-2',[62,84],[
    {name:'Drain the tide pool',cost:140,effect:{kit:['newest',2]},lines:[['tamsin','The pool below the door drains with the tide. Shells everywhere, and something glinting.']]},
    {name:'Sieve the pool bed',cost:170,effect:{token:1},lines:[['tamsin','Sieved sand, sorted shells. One of them hums like the beacon did.']]},
    {name:'Wall in the pool',cost:200,effect:{copy:'newest'},lines:[['tamsin','A stone wall keeps the sea out. The pool is a workshop now.'],['tamsin','At the bottom: a copy of our newest generator.']]}],'ws-pool'),
   place('ws-hoist','source-rope',[89,70],[
    {name:'Raise the rope hoist',cost:160,effect:{energy:10},lines:[['ivo','A hoist on the cliff edge. One pull and the beach sends up anything we need.'],['bram','Supplies came up with the first load: +10 energy.']]},
    {name:'Gear the hoist',cost:200,rare:['mech',1],effect:{copy:'newest'},lines:[['ivo','Brass gears from the Workshop. The hoist lifts twice the load.'],['ivo','The first geared load: a copy of our newest generator.']]},
    {name:'Run the hoist to the door',cost:220,effect:{kit:['newest',3]},lines:[['ivo','A line from the hoist straight to the door. Whatever is behind it, we can move it.']]}],'ws-hoist'),
   place('ws-door','lamp-2',[74,38],[
    {name:'Survey the vault door',cost:180,effect:{energy:5},lines:[['neri','The door is a dial, as tall as three of us. Every ring turns.']]},
    {name:'Light the door',cost:220,effect:{copy:'newest'},lines:[['tamsin','Lanterns all around the dial. The tideglass in it glows back at us.'],['tamsin','We will need lamps of our own up here. Packed with the lanterns: a copy of our newest generator.']]},
    {name:'Map the dial',cost:240,effect:{kit:['newest',3]},lines:[['neri','Every ring of the dial is mapped. Now we know how it opens.'],['bram','The worksite is done. Next: the Vault Entrance itself.']]}],'ws-door')
  ]},
 // Build 47b: Chapter 1's finale (from PR #80's Vault door): the mapped dial, three rings, each turned
 // with its own stage; the inner ring names its materials (a Signal lamp and a Bearing dial). Turning
 // it opens the Vault. Picture: the coast's own Vault (the Home and story art), not PR #80's door.
 {id:'entrance',name:'Vault Entrance',short:'DOOR',picture:'vault-door',
  intro:[['neri','The dial is mapped: three rings, each with its own mechanism.'],['ivo','Bring me the parts for each ring and we turn them one by one.']],
  tasks:[
   place('vault-door','lamp-3',[48.7,50],[
    {name:'Turn the outer ring',cost:240,effect:{energy:10},lines:[['neri','The outer ring turns. Two to go.']]},
    {name:'Turn the middle ring',cost:280,effect:{kit:['newest',3]},lines:[['tamsin','The middle ring is turning. The tideglass in the dial glows brighter.']]},
    {name:'Turn the inner ring',cost:320,gold:[['lamp',3,1],['chart',4,1]],effect:{},lines:[['bram','The inner ring is set. Stand back.']]}])
  ]},
 // Chapter 2, The Silent Observatory (PR #80's chapter, kept by the director on 2026-10-28). Build
 // 47d: inside the open Vault, a short bridge first, the Tide Archive (one place, three stages): its
 // gold orders want the late generators' parts (Shell Trap, Lantern Kiln), and its index points to
 // the Observatory. The wave seal links the archive to the intro's letter without saying who sent it.
 // Picture: PR #80's Observatory interior; the archive sits on its shelves (no archive art yet).
 {id:'vault',name:'The Silent Observatory',short:'VAULT',picture:'observatory',map:'observatory-map',focus:'optic',
  intro:[['tamsin','Records, floor to ceiling, every one sealed against the damp.'],['bram','Lamps first. Then we find out what this place was for.']],
  tasks:[
   place('vault-archive','chart-1',[23,36],[
    {name:'Light the archive',cost:100,gold:[['lamp',2,2]],effect:{energy:8},lines:[['tamsin','Two lanterns and the whole room shows: shelf after shelf of records.']]},
    {name:'Dry the sealed records',cost:120,gold:[['shell',3,1],['lamp',3,1]],effect:{token:1},lines:[['neri','The same wave seal as on your letter, pressed into every cover.'],['bram','Then the letter and this archive belong together. Who sealed them is another question.']]},
    {name:'Read the archive index',cost:140,gold:[['shell',4,1],['lamp',2,1]],effect:{kit:['newest',2]},lines:[['neri','The index points deeper in: instruments, logbooks, an observatory.'],['ivo','Then that is where we go.']]}]),
   // Build 47f: each place's spot is where its furnishing stands in the Observatory picture (the
   // shelves, the hall's floor, the left desk, the right bench, the orb, the arched passage).
   // Build 47e: the Observatory itself, PR #80's five places as they were (costs, rewards, authored
   // gold, the sea gate waiting for the array), behind the archive: its hall opens once the index is
   // read. The Lens Bench is earned here (copy:'optic'), and half of the everyday orders want optics
   // once it is out (focus).
   {...place('obs-hall','lamp-1',[58,82],[
    {name:'Light the entrance hall',cost:110,requires:{'vault-archive':3},effect:{energy:8},lines:[['tamsin','These lamps were trimmed by hand, for years. Somebody worked here.']]},
    {name:'Clear the fallen stones',cost:130,effect:{token:1},lines:[['ivo','Somebody built this hall to last. The stones came off the dome, nothing more.']]},
    {name:'Hang the banners',cost:150,effect:{kit:['newest',2]},lines:[['neri','A compass and a crescent on every banner. That mark was on the door too.']]}],'obs-hall')},
   place('obs-desk','chart-3',[16,68],[
    {name:'Right the survey desk',cost:130,effect:{energy:8},lines:[['neri','Logbooks. Hundreds of them, all in the same hand.']]},
    {name:'Unroll the old charts',cost:150,rare:['notes',1],effect:{token:1},lines:[['neri','Every chart here carries the same mark: the fleet that no shipping register remembers.'],['bram','So they worked from here.']]},
    {name:'Read the last logbook',cost:170,rare:['notes',2],effect:{kit:['newest',2]},lines:[['tamsin','The last entry says: "Array silent. Lenses sent to the bench for regrinding." Then nothing.'],['neri','Then we start at the bench.']]}],'obs-desk'),
   place('obs-bench','optic-2',[86,46],[
    {name:'Clear the lens bench',cost:150,effect:{copy:'optic'},lines:[['ivo','A grinding wheel and a box of raw sea glass. We can make lenses again.']]},
    {name:'Fit the grinding wheel',cost:170,rare:['mech',1],effect:{copy:'optic'},lines:[['ivo','The wheel turns true. Merge the new bench with ours: twice the work.']]},
    {name:'Polish the reading lens',cost:190,effect:{kit:['optic',2]},lines:[['neri','The big lens is clear again. Now the array can see.']]}],'obs-bench'),
   place('obs-array','optic-3',[55,47],[
    {name:'Reseat the array crystal',cost:170,gold:[['optic',2,1],['lamp',2,2]],effect:{energy:10},lines:[['tamsin','The crystal is cold. It needs focused light.']]},
    {name:'Align the brass rings',cost:200,gold:[['optic',3,1],['chart',4,1]],effect:{cog:1},lines:[['neri','The rings are set to a bearing, not to a star.']]},
    {name:'Wake the array',cost:230,gold:[['optic',4,1],['lamp',3,1]],effect:{kit:['optic',3]},lines:[['tamsin','It is waking.']]}],'obs-array'),
   place('obs-passage','rope-4',[48,30],[
    {name:'Unbar the inner passage',cost:190,effect:{energy:10},lines:[['bram','Cold air. This passage goes out to the sea.']]},
    {name:'Shore up the tunnel',cost:220,effect:{cog:1},lines:[['ivo','Timber and brass. The same hands as the bench.']]},
    {name:'Open the sea gate',cost:250,requires:{'obs-array':3},gold:[['optic',4,1],['rope',4,1]],effect:{},lines:[['neri','The bearing runs straight through there.']]}],'obs-passage')
  ]},
 // Chapter 3, The Hidden Harbour (build 48a, 2026-11-01; docs/V5_CHAPTER3_HARBOUR_2026-11-01.md, from the
 // director's art and design handoff). Through the sea gate: seven places around one basin, each in
 // three stages. Landing first; then the crane and the warehouse together; with both done the boatyard
 // and the registry; the registry's route opens the signal tower; the departure dock's jetty waits for
 // the boatyard's workbench, and its launch for the boat and the signal (requires, game.mjs upgrades).
 // Every stage names its own materials, rotated among chains the camp already has (no rare extra and
 // no new generator; the late generators get work). Picture: the director's before/after harbour,
 // revealed place by place (restored), with each stage's own cut-out on its card (art 'hb-…'). The
// handoff's four story lines are the story cards' (app.mjs HARBOUR_STORY and the end card), so the
// stages that lead to them have their own lines and nothing is said twice.
 {id:'harbour',name:'The Hidden Harbour',short:'HARBOUR',picture:'hidden-harbour',map:'coast/hidden-harbour/harbour-map-before',restored:'coast/hidden-harbour/harbour-map-after',
  intro:[['bram','This knot is fresh. Someone has used this landing.'],['ivo','Then we make it ours. Clear the landing first.']],
  tasks:[
   place('hb-landing','rope-1',[21,81],[
    {name:'Clear the landing',cost:180,gold:[['rig',3,1],['rope',2,2]],effect:{energy:10},lines:[['ivo','Weed and wreckage off the stones. Boats could tie up here again.']]},
    {name:'Secure the railings',cost:200,gold:[['rope',3,1],['rig',2,2]],effect:{token:1},lines:[['bram','Rope rails, fresh-tarred. Whoever moored here meant to come back.']]},
    {name:'Light the landing',cost:220,gold:[['lamp',2,1],['rig',3,1]],effect:{kit:['newest',2]},lines:[['tamsin','Two lamps on the landing. From the water it looks like a harbour again.']]}],'hb-landing'),
   place('hb-crane','rope-3',[20,49],[
    {name:'Reinforce the crane',cost:200,requires:{'hb-landing':3},gold:[['rig',4,1],['rope',2,1]],effect:{energy:10},lines:[['ivo','The mast is sound. It only needed bracing.']]},
    {name:'Fit the pulley',cost:230,gold:[['rope',3,1],['rig',3,1]],effect:{cog:1},lines:[['ivo','A pulley block, a good hook. Now it can lift more than its own weight.']]},
    {name:'Recover the cargo',cost:260,gold:[['rope',4,1],['rig',3,1]],rare:['mech',2],effect:{kit:['newest',3]},lines:[['ivo','Something heavy down there. Steady… up she comes.']]}],'hb-crane'),
   place('hb-warehouse','shell-2',[28,25],[
    {name:'Repair the roof',cost:200,requires:{'hb-landing':3},gold:[['rig',3,1],['shell',2,1]],effect:{token:1},lines:[['ivo','New boards, a canvas over the gap. The rain stays out now.']]},
    {name:'Raise the shelves',cost:230,gold:[['rig',4,1],['shell',3,1]],effect:{energy:10},lines:[['tamsin','Shelves to the rafters. Somebody kept this place stocked for a long voyage.']]},
    {name:'Sort the supplies',cost:260,gold:[['shell',3,1],['chart',3,1]],effect:{kit:['newest',2]},lines:[['tamsin','Rope, lamp oil, dried food. Enough for one boat, and a long way.']]}],'hb-warehouse'),
   place('hb-boatyard','rig-4',[76,49],[
    {name:'Set up the workbench',cost:240,requires:{'hb-crane':3,'hb-warehouse':3},gold:[['rig',4,1],['rope',3,1]],effect:{energy:12},lines:[['ivo','Tools still on their hooks. A boatwright worked here, and not long ago.']]},
    {name:'Repair the hull',cost:270,gold:[['rig',4,1],['rope',3,2]],effect:{token:1},lines:[['ivo','New planks where the old ones split. She will float.']]},
    {name:'Rig the sail',cost:300,gold:[['rope',4,1],['chart',3,1]],effect:{kit:['newest',3]},lines:[['bram','A mast, a sail, and nowhere yet to sail her.']]}],'hb-boatyard'),
   place('hb-registry','chart-3',[56,18],[
    {name:'Reopen the office',cost:240,requires:{'hb-crane':3,'hb-warehouse':3},gold:[['chart',3,1],['lamp',2,1]],effect:{energy:12},lines:[['neri','The harbour office. Ledgers, a stamp, a map on the wall.']]},
    {name:'Dry the records',cost:270,gold:[['lamp',3,1],['chart',3,1]],effect:{cog:1},lines:[['neri','Every boat that sailed from here is in these books. The last one too.']]},
    {name:'Trace the route',cost:300,gold:[['chart',4,1],['optic',3,1]],rare:['notes',2],effect:{kit:['newest',2]},lines:[['neri','The last boat followed the same bearing as the array. It leads out to sea.'],['tamsin','Then the tower can tell whoever is out there that we are here.']]}],'hb-registry'),
   place('hb-signal','lamp-3',[90,18],[
    {name:'Repair the tower',cost:260,requires:{'hb-registry':3},gold:[['lamp',3,1],['rig',3,1]],effect:{energy:12},lines:[['bram','Stone stairs, an iron door. The lamp room is still dry.']]},
    {name:'Align the lens',cost:290,gold:[['optic',4,1],['lamp',2,1]],effect:{token:1},lines:[['tamsin','The lens turns on the same bearing as the array.']]},
    {name:'Send the signal',cost:320,gold:[['optic',4,1],['lamp',3,1]],effect:{kit:['newest',3]},lines:[['tamsin','Three long, two short, out along the bearing. Now we watch the water.']]}],'hb-signal'),
   place('hb-departure','rope-4',[83,85],[
    {name:'Repair the jetty',cost:280,requires:{'hb-boatyard':1},gold:[['rope',3,1],['rig',3,1]],effect:{energy:12},lines:[['ivo','A jetty long enough for a boat with a sail.']]},
    {name:'Load the supplies',cost:310,gold:[['rig',4,1],['shell',3,1]],effect:{cog:1},lines:[['tamsin','Food, oil and rope from the warehouse, stowed and lashed.']]},
    {name:'Launch the boat',cost:350,requires:{'hb-boatyard':3,'hb-signal':3},gold:[['rope',4,1],['chart',4,1]],effect:{},lines:[['bram','Lines off. She floats true.']]}],'hb-departure')
  ]},
 // Chapter 4, The Answering Light (build 49a, 2026-11-02; docs/V5_CHAPTER4_ANSWERING_LIGHT_2026-11-02.md,
 // from the director's handoff pack: data/chapter4-proposal.json translated into this schema, not pasted).
 // A separate headland across the water, where the light that answered the harbour stands. Seven places,
 // 21 stages: the landing, then the cliff steps; then two branches in either order (the keeper's cottage
 // then the signal records; the reflector workshop then the lighthouse); the relay once the workshop and
 // the records are done, and its last stage also needs the lighthouse, so it is the chapter's finale.
 // Every stage asks two fixed gold materials (the proposal's zero-based tiers are this engine's); five
 // ask a merged rare part directly (no dynamic step-down, no areas.mjs `rare` swap): an Expedition note,
 // a Gear assembly, an Expedition note, a Travel notebook and a Gear. Stages 1-2 are their visible repair
 // only (the pack's "visual progress"); stage 3 of each place gives a kit of 2 of one chain the camp has
 // (the pack's candidates). No new generator, currency, energy rule or board. Picture: the director's
 // damaged headland until the chapter is done, then the restored one (the masters are not registered
 // layers, so no patch reveal); each stage shows on its place's card with its own sprite (art 'ch4-…').
 // Prices: tuned against the build 48c economy (doc); the pack's 6,160 was a starting budget.
 {id:'answering-light',name:'The Answering Light',short:'HEADLAND',picture:'answering-light',map:'coast/answering-light/headland-map-before',overview:'coast/answering-light/headland-map-after',
  intro:[['bram','The tower is dark. That small light answered us.'],['ivo','First we need a safe way up.']],
  tasks:[
   place('ch4-landing','rope-2',[24,82],[
    {name:'Brace the landing',cost:220,gold:[['rig',3,1],['rope',2,1]],effect:{},lines:[['ivo','The old frame still holds. We can brace it.']]},
    {name:'Lay the deck',cost:240,gold:[['rig',4,1],['rope',2,1]],effect:{},lines:[['bram','A safe deck. Now the supplies can come ashore.']]},
    {name:'Secure the landing',cost:260,gold:[['rope',3,1],['lamp',2,1]],effect:{kit:['rope',2]},lines:[['bram','Lines secure. The cliff path is next.']]}],'ch4-landing'),
   place('ch4-steps','rig-3',[50,66],[
    {name:'Clear the rockfall',cost:240,requires:{'ch4-landing':3},gold:[['rig',3,1],['rope',2,1]],effect:{},lines:[['ivo','There are steps beneath this rockfall.']]},
    {name:'Rebuild the cliff steps',cost:260,gold:[['rig',4,1],['shell',2,1]],effect:{},lines:[['ivo','Solid stone all the way up.']]},
    {name:'Fit the safety ropes',cost:280,gold:[['rope',3,1],['rig',2,1]],effect:{kit:['rig',2]},lines:[['bram','Now we can carry the heavy parts safely.']]}],'ch4-steps'),
   place('ch4-cottage','shell-2',[36,40],[
    {name:'Seal the keeper\'s roof',cost:260,requires:{'ch4-steps':3},gold:[['rig',3,1],['shell',2,1]],effect:{},lines:[['ivo','The roof will keep the records dry.']]},
    {name:'Reopen the keeper\'s room',cost:280,gold:[['lamp',2,1],['rig',3,1]],effect:{},lines:[['neri','The keeper left a desk beside the window.']]},
    {name:'Find the keeper\'s log',cost:300,gold:[['chart',3,1],['notes',1,1]],effect:{kit:['chart',2]},lines:[['neri','The log describes a reply mechanism. It does not name who last set it.']]}],'ch4-cottage'),
   place('ch4-workshop','optic-3',[80,46],[
    {name:'Restore the workbench',cost:260,requires:{'ch4-steps':3},gold:[['rig',4,1],['rope',3,1]],effect:{},lines:[['ivo','The reflector can be repaired on this bench.']]},
    {name:'Fit the turning gears',cost:300,gold:[['rig',3,1],['mech',2,1]],effect:{},lines:[['ivo','These gears turn the reflector without a keeper.']]},
    {name:'Polish the reflector',cost:320,gold:[['optic',3,1],['shell',3,1]],effect:{kit:['rig',2]},lines:[['tamsin','Now it can direct the light toward the relay.']]}],'ch4-workshop'),
   place('ch4-records','chart-3',[26,22],[
    {name:'Open the signal room',cost:280,requires:{'ch4-cottage':3},gold:[['rig',3,1],['lamp',2,1]],effect:{},lines:[['neri','The signal room belongs to the same installation.']]},
    {name:'Sort the signal records',cost:300,gold:[['chart',3,1],['notes',1,1]],effect:{},lines:[['neri','Each short and long flash has a place in these records.']]},
    {name:'Decode the signal pattern',cost:340,gold:[['chart',4,1],['notes',2,1]],effect:{kit:['chart',2]},lines:[['tamsin','The reply is stored here. We need the main light to read it.']]}],'ch4-records'),
   place('ch4-lighthouse','lamp-3',[76,17],[
    {name:'Repair the tower access',cost:300,requires:{'ch4-workshop':3},gold:[['rope',4,1],['rig',3,1]],effect:{},lines:[['bram','The tower is safe to climb again.']]},
    {name:'Set the lighthouse lens',cost:340,gold:[['optic',4,1],['lamp',3,1]],effect:{},lines:[['tamsin','The lens is set. The lamp is still dark.']]},
    {name:'Light the headland',cost:360,gold:[['lamp',3,1],['optic',3,1]],effect:{kit:['lamp',2]},lines:[['tamsin','There. The headland can guide ships again.']]}],'ch4-lighthouse'),
   place('ch4-relay','optic-4',[54,17],[
    {name:'Rebuild the relay base',cost:300,requires:{'ch4-workshop':3,'ch4-records':3},gold:[['rig',4,1],['rope',3,1]],effect:{},lines:[['ivo','A steady base for a very delicate machine.']]},
    {name:'Set the timing cams',cost:340,gold:[['chart',4,1],['mech',1,1]],effect:{},lines:[['tamsin','The cams now match the recorded pattern.']]},
    {name:'Read the stored message',cost:380,requires:{'ch4-lighthouse':3,'ch4-records':3},gold:[['optic',4,1],['lamp',3,1]],effect:{kit:['optic',2]},lines:[['neri','A route through the reef, marked for low water. Whoever left it wanted someone to find a way through.']]}],'ch4-relay')
  ]},
 // Build 50a: Chapter 5, the Lowwater Passage (the director's design pack of 2026-11-02, a proposal
 // translated here): the reef route the relay's message marked. Seven places in one line, each opening
 // when the one before is fully restored (the pack: "linear places deliberately avoid ambiguous
 // completion"); every gold recipe is the pack's, fixed at two parts, three of them merged secondary
 // parts (a Gear, an Expedition note, a Travel notebook), never stepped down. Stage 3 of each place
 // gives a kit of 2 of one chain the camp has, as Chapter 4 does; no new generator, currency, energy
 // rule or board. Picture: the damaged passage until the chapter is done, then the restored one (the
 // pack's two paintings are not registered layers); each stage shows on its place's card with its own
 // sprite cut from the pack's concept sheet (art 'ch5-…'). The lock's third stage is "Restore the
 // inner lock" (the pack's "Open inner passage"): its concept art shows the gates shut, so the passage
 // opening is told by the chapter's end card instead. The shelter's last stage asks a Storm lantern
 // (lamp 3), not the pack's lamp 4: that is the lamp chain's top, which no order asks (orders stop one
 // below a chain's top); its second part is a Pocket winch (rig 3, the pack's rig 2) so the last stage
 // still asks more than the first. Prices: the pack's candidates times 0.9, rounded to 5 (6,900 in all):
 // at the pack's 7,665 the chapter took 1.11-1.19x Chapter 4 (median), up to 1.29x, with coins the wait
 // at every stage (doc).
 {id:'lowwater',name:'The Lowwater Passage',short:'REEF',picture:'lowwater-passage',map:'coast/lowwater-passage/passage-map-before',overview:'coast/lowwater-passage/passage-map-after',
  intro:[['bram','The water has pulled back. The marked stones lead through the reef.']],
  tasks:[
   place('ch5-landing','rig-3',[22,85],[
    {name:'Clear the driftwood',cost:270,gold:[['rig',3,1],['chart',2,1]],effect:{},lines:[['ivo','Driftwood, mostly. The old pier is still under it.']]},
    {name:'Brace the landing',cost:290,gold:[['rig',3,1],['chart',2,1]],effect:{},lines:[['bram','Braced. The boat can tie up at any tide.']]},
    {name:'Fit the mooring posts',cost:305,gold:[['rig',4,1],['chart',2,1]],effect:{kit:['rig',2]},lines:[['bram','Posts set. Now the stones.']]}],'ch5-landing'),
   place('ch5-causeway','rope-3',[40,57],[
    {name:'Reset the stones',cost:285,requires:{'ch5-landing':3},gold:[['rope',3,1],['shell',2,1]],effect:{},lines:[['ivo','These stones were laid by hand, a long time ago.']]},
    {name:'Bridge the gaps',cost:300,gold:[['rope',3,1],['shell',2,1]],effect:{},lines:[['bram','No more jumping. We can carry loads across.']]},
    {name:'Mark the safe crossing',cost:320,gold:[['rope',4,1],['shell',2,1]],effect:{kit:['rope',2]},lines:[['neri','Marked the way the old route was. The gauge should say when.']]}],'ch5-causeway'),
   place('ch5-gauge','chart-3',[13,17],[
    {name:'Clean the gauge',cost:295,requires:{'ch5-causeway':3},gold:[['chart',3,1],['lamp',2,1]],effect:{},lines:[['neri','A tide gauge. Someone read it every day.']]},
    {name:'Fit the float',cost:315,gold:[['chart',3,1],['lamp',2,1]],effect:{},lines:[['ivo','The float moves freely again.']]},
    {name:'Calibrate the tide marks',cost:335,gold:[['chart',4,1],['notes',1,1]],effect:{kit:['chart',2]},lines:[['tamsin','The marks match the notes. Now we know when the crossing is safe.']]}],'ch5-gauge'),
   place('ch5-bridge','shell-3',[45,12],[
    {name:'Anchor the cables',cost:310,requires:{'ch5-gauge':3},gold:[['shell',3,1],['optic',2,1]],effect:{},lines:[['ivo','The anchors held. The cables were the problem.']]},
    {name:'Lay the walkway',cost:330,gold:[['shell',3,1],['optic',2,1]],effect:{},lines:[['bram','Planks down. Walk in the middle.']]},
    {name:'Secure the handrails',cost:345,gold:[['shell',4,1],['optic',2,1]],effect:{kit:['shell',2]},lines:[['bram','Safe across. There is a shelter on the far side.']]}],'ch5-bridge'),
   place('ch5-shelter','lamp-3',[12,69],[
    {name:'Repair the roof',cost:325,requires:{'ch5-bridge':3},gold:[['lamp',3,1],['rig',2,1]],effect:{},lines:[['ivo','A courier shelter. Somewhere to wait for low water.']]},
    {name:'Dry the shelter',cost:340,gold:[['lamp',3,1],['mech',1,1]],effect:{},lines:[['tamsin','Dry at last. The crates inside are addressed.']]},
    {name:'Light the courier shelter',cost:360,gold:[['lamp',3,1],['rig',3,1]],effect:{kit:['lamp',2]},lines:[['tamsin','A light for anyone crossing at dusk.']]}],'ch5-shelter'),
   place('ch5-desk','optic-3',[88,13],[
    {name:'Restore the desk',cost:340,requires:{'ch5-shelter':3},gold:[['optic',3,1],['rope',2,1]],effect:{},lines:[['neri','A mail desk, out here on the reef.']]},
    {name:'Sort the dispatches',cost:355,gold:[['optic',3,1],['rope',2,1]],effect:{},lines:[['neri','Every dispatch goes the same way: inward.']]},
    {name:'Read the route ledger',cost:375,gold:[['optic',4,1],['notes',2,1]],effect:{kit:['optic',2]},lines:[['neri','The ledger ends at the inner lock.']]}],'ch5-desk'),
   place('ch5-lock','rig-4',[82,53],[
    {name:'Clear the lock entrance',cost:350,requires:{'ch5-desk':3},gold:[['rig',3,1],['chart',2,1]],effect:{},lines:[['ivo','A lock. The water level is controlled from here.']]},
    {name:'Repair the lock gear',cost:370,gold:[['rig',3,1],['chart',2,1]],effect:{},lines:[['ivo','The gear turns. The gates will move.']]},
    {name:'Restore the inner lock',cost:385,gold:[['rig',4,1],['chart',2,1]],effect:{kit:['rig',2]},lines:[['bram','The lock works again. The passage is ours to use.']]}],'ch5-lock')
  ]}
];
// The next area opens when this one's last stage is bought (game.mjs restore and load).
// Build 47f: what the Vault's places are called when one waits for another ("Finish the array first").
export const LABELS={'vault-archive':'the archive','obs-hall':'the entrance hall','obs-desk':'the survey desk','obs-bench':'the lens bench','obs-array':'the array','obs-passage':'the sea gate',
 'hb-landing':'the landing','hb-crane':'the crane','hb-warehouse':'the warehouse','hb-boatyard':'the boatyard','hb-registry':'the registry','ch4-landing':'the arrival landing','ch4-steps':'the cliff steps','ch4-cottage':'the keeper\'s cottage','ch4-workshop':'the reflector workshop','ch4-records':'the signal records','ch4-lighthouse':'the lighthouse','ch4-relay':'the signal relay',
 'ch5-landing':'the reef landing','ch5-causeway':'the causeway','ch5-gauge':'the tide gauge','ch5-bridge':'the rope bridge','ch5-shelter':'the courier shelter','ch5-desk':'the mail desk','ch5-lock':'the inner lock',
 'hb-signal':'the signal tower','hb-departure':'the departure dock'};
export const TASKS=Object.fromEntries(AREAS.flatMap(a=>a.tasks.map(t=>[t.id,{...t,area:a.id}])));
export const STAGES=3;
export const areaOf=id=>AREAS.find(a=>a.id===id);
