# Coast Camp Chapter 5: The Lowwater Passage (build 50a, 2026-11-02)

Branch `claude/v5-chapter5-lowwater-passage`, from `bf7bf4d` (Chapter 4, PR #87's head). The source is the
director's pack `Vaultwake_Chapter5_Art_Design.zip`, whose handoff, data, review notes and masters are kept
in `docs/art-source/lowwater-passage-2026-11-02/`. Chapter 6's pack was not opened and is not implemented.
V4, `v5/lab/`, Classic V5, PR #75, save keys and energy rules are unchanged.

## What was built
- **Area `lowwater`** (index 6), appended after `answering-light`; earlier indices and ids are unchanged.
  - 7 places × 3 stages, in pack order: `ch5-landing`, `ch5-causeway`, `ch5-gauge`, `ch5-bridge`,
    `ch5-shelter`, `ch5-desk`, `ch5-lock`.
  - **One line:** each place's stage 1 requires the place before it at stage 3, as the pack's `stages.json`
    specifies. Only one place is ever open, so the "Work on this next" choice never shows here.
- **Gold recipes** are the pack's own: 2 parts each, fixed, never stepped down.
  - 3 of them use merged secondary parts: gauge 3 Expedition note (`notes1`), shelter 2 Gear (`mech1`),
    desk 3 Travel notebook (`notes2`).
  - The build 48c gold guarantee (`goldPity` 8) covers them.
  - One correction (see "Deviations").
- **Rewards:** stages 1–2 give only their visible repair. Stage 3 gives a kit of 2 of the place's chain,
  the same pattern Chapter 4 uses. There is no energy, coin or generator reward.
- **Story**, from the pack's `story-cards.json`. Each card is seen once, and one the camp has moved past is
  marked without playing.
  - `ch4-message`: the relay's message, which was Chapter 4's end card. It is now Chapter 4's last card,
    naming "Chapter 5 · The Lowwater Passage". Button: "Follow the route".
  - `ch5-arrival` (Bram). Button: "Secure the reef landing"; it marks the landing's gold order.
  - `ch5-crossing` (Tamsin), after gauge 3; it leads to the bridge.
  - `ch5-ledger` (Neri), after shelter 3; it leads to the mail desk.
  - **End card** "Behind the Vault" (Ivo):
    - stats: "This chapter's stages 21 / 21" and "All chapters so far 126 / 126";
    - buttons: View the restored passage, Return to board, Share feedback;
    - text: "The inner station is not open yet." There is no Chapter 6 button.
- **Map:**
  - Shows the damaged painting until the chapter is done, then the restored one. The two paintings are not
    registered layers, so there are no patch reveals.
  - Shows one pin, on the open place. There are no pins on the restored painting.
  - Each stage shows its own sprite on its place's card and tile.
  - Stage lines are captions, as in Chapter 4.
- **Build:** `Build 50a`. `play.html ?build=50a`. `coast-crazygames.html` regenerated (`--check` passes).

## Deviations from the pack (each tested and stated, none silent)

| Pack | Built | Why |
|---|---|---|
| Shelter 3: lamp 4 + rig 2 | 50b: 2 Signal lamps (lamp 3) + 2 Focus barrels | Lamp 4 (Beacon lens) is the top of the lamp chain, and no order asks for a chain's top (`maxTier−1`). |
| Lock 3 "Open inner passage" | "Restore the inner lock" | ART_REVIEW warns that the stage-3 concept still looks closed. The gates are shut in the sprite, so the passage opening is told by the end card's painting (an open door). |
| Story panel 2 (chest and ledger) | not shipped; the card shows the restored shelter sprite | Its emblem is generated and is not the letter's wave seal (ART_REVIEW), while Neri's line names that seal. |
| Prices 7,665 | 50a: ×0.9 → 6,900; 50b: ×0.8 of that → 5,520 (215–310 per stage) | 50a: at the pack's prices the chapter took 1.11–1.19× Chapter 4 (median). 50b: the merge goals grew, so less is paid in crew-order coins (below). |
| Recipes repeated (stage 1 = stage 2 at six of seven places) | 50b: every recipe its own (below) | The director asked for the repeats to be told apart and the coin wait moved into merge goals. |

## Saves
No new field and no new key.
- **Finished Chapter 4 save:**
  - `load()` advances it to area 6.
  - A camp that saw the old end card (`seenEnd`) gets `seen['ch4-message']`, and `seenEnd` is cleared.
  - `ch5-arrival` is not marked: a Chapter 4 end flag is not a Chapter 5 flag.
  - Board, shed, pending rewards, generator levels, coins, energy above capacity, active orders and
    material credits are kept.
- **Unfinished Chapter 4 save** stays on the headland, with nothing of Chapter 5 open.
- **Reloads** change nothing: no stage or kit is given twice, and the end card is seen once.

## Art (`tools/lowwater-art.py`)
- **Masters** are kept as WebP q92.
- **Maps:** the same 1024×1195 crop (y 220–1415) for both, as for the headland.
- **Stage sprites:**
  - The 7×3 concept sheet is keyed with a border flood fill, so cream stone inside a sprite stays.
  - Enclosed flat cream larger than 400 px is removed (the sky under the rope bridge).
  - Every piece is assigned to the grid cell its centre is in. Pieces spanning two rows (the gauge's
    finial) are cut at their thinnest line.
  - Sprites are 246–334 px, the sheet's native size: no upscaling.
  - Checked on dark and on paper backgrounds at mobile size.
- **Story panels:** 3 of 4, at 768×512.
- **Strip picture:** taken from the damaged map.
- **Total:** 1.7 MB runtime.

## Pacing (`node tests/v5-next-coins-metrics.mjs 4,5,8,10 1,2,3,4,5,6,7,8,9,10 both --runs`)
Setup: the scripted policy, 4/5/8/10 s per action, 10 seeds, shop on and off (80 runs).

| | Pack prices (7,665) | Built (6,900) |
|---|---|---|
| Runs finished | 80 / 80 | 80 / 80 |
| Ch5 ÷ Ch4 duration, median | 1.05–1.19 | **1.05–1.12** (all runs 1.07) |
| Ch5 ÷ Ch4, range | 1.01–1.29 | **0.93–1.20** |
| Ch5 minutes (median) at 4 / 5 / 8 / 10 s | 60 / 76 / 119 / 149 | 56 / 69 / 110 / 142 |
| Longest materials-to-build wait, Ch5 | ≤16.9 min | ≤9.5 min (Ch4 ≤24.3) |
| Longest gap between two stages, Ch5 | – | 6.2–17.0 min (Ch4 7.8–16.8) |
| Gold covers stage cost | 15.7 % | 17.4 % (Ch4 23.7 %) |
| Stage coin-limited when its materials came in | 95–100 % | 95–100 % |
| Board median | 30–33.5 | 29–33 (Ch4 25.5–28) |
| Idle energy wait (waitShare) | 0 | 0 |
| Tier-2 rare gold orders | 60 / 60 | 60 / 60 done; rare-only pursuit median 1.7–3.5 min, max 13.1 min, ≤32 taps |

The longest stage gaps (17 min at 10 s per action) are active crew-order play for coins, not idle waiting,
and are the same as Chapter 4's. These are simulation targets, not proof that the chapter is fun.

## Tests
- **`tests/v5-next-chapter5.test.mjs`** (8 tests):
  - data, ids and labels;
  - the line order, with only one place open and `aim` unable to jump it;
  - fixed recipes, with the Gear never lowered whatever is held, and `goldChase`;
  - Chapter 4 → 5 save entry, with `seenEnd` set and unset;
  - an unfinished Chapter 4 save staying put;
  - 21 stages each charged once, the lock last, the end card once;
  - the full-board kit, once;
  - story flags once.
- **`tests/v5-next-chapter5-browser.cjs`:**
  - at 390×844, all 21 stages by hand;
  - at 360×780, 430×932 and 907×510: entry, one stage and the end;
  - at 360, the unseen message card comes first;
  - pictures load, there is no sideways scroll, and buttons are 44 px.
  - It is added to CI after Chapter 4.
- **Updated:**
  - Chapter 4 unit and browser tests: the message is now a card followed by the Chapter 5 arrival, not the
    end card;
  - `v5-next.test.mjs`: 42 tasks, 7 areas;
  - playtest and bright browser tests: the content ends at the inner lock;
  - the metrics script: `ch5`.

## Remaining limits
- **Board occupancy:** the board median is 29–33, above the 18–27 guide and 3–6 above Chapter 4. This needs
  a design decision, not a price change.
- **Maps** are whole-state backgrounds. Per-place overlays need registered art.
- **Sprites** are concept-sheet cuts at about 250–330 px, softer than Chapter 4's 512 px sprites. The lock's
  stage-3 sprite shows shut gates. An explicit open variant would need new art.
- **Story art and characters:** the storyboard's figure is not a verified crew member (the alt text names
  no one). Chapter 6 (Mara) was not touched.
- **WebKit** cannot be installed here; it runs only in CI.

## Build 50b: merge goals instead of crew-order coins, and the board (2026-11-02)
The director's follow-up asked for four things: no new generator; tell the repeated gold recipes apart;
cut the coin wait after the materials are in, without just shortening the chapter, by moving the
crew-order repetition into merge goals; and measure the board load before fixing it, without deleting items.

### What fills the board (measured first)
`node tests/v5-next-coins-metrics.mjs 4,5,8,10 1,2,3,4,5,6,7,8,9,10 noshop --runs board=1` classifies every
board space at every step. Means are over the chapter.

| Space | Ch4 before | Ch5 before | Ch4 after | Ch5 after |
|---|---|---|---|---|
| Generators | 7.2 | 7.2 | 7.2 | 7.2 |
| **Brass cogs** | **4.3** | **8.9** | 1.8 | 2.3 |
| Unopened kits (stage-3 and chest crates) | 4.0 | 3.9 | 3.8 | 3.8 |
| Parts an order asks / on the way to one | 6.6 | 6.5 | ≈ same | ≈ same |
| Spare parts (no order asks them) | 4.2 | 5.0 | ≈ 4.5 | 4.8 |
| Board median | 25.5–28 | 29–33 | 21–24 | 23–26 |

**Cause:** by Chapter 4 every generator is at its top level. On average 0.01–0.18 generators are below
level 5. Even so, every sixth crew order (a favour) still paid a Brass cog, about 5 a chapter. No generator
could take them, so they piled up: Chapter 5's board carried Chapter 4's cogs as well as its own.

**Fix:** `cogRoom(s)` is the number of generator levels still free across the board, shed and pending
rewards, less the cogs already held. While it is 0 or less, a favour pays a Tide token instead. A token
turns a spare part into one an order wants, so it feeds the merge goals rather than sitting on the board.
- Cogs already held are never removed, moved or converted; a test shows them kept across a reload.
- Book pages (about 0.5 a chapter) and the daily gift still give their cog, so their UI text is unchanged.
- Chapters 1–3 are unchanged: their generators are never all at the top, and Chapter 3 ends at the same
  minute in both builds (340.4 min median).

Kits are about 4 in both chapters. They are rewards the player opens when they want to and are left as
they are.

### Recipes: every one its own, more merging, the same three rare parts
| Place | Stage 1 (clearing) | Stage 2 (building) | Stage 3 (finishing) |
|---|---|---|---|
| Reef landing | Crawler jack + 2 Pulley blocks | 2 Crawler jacks + 2 Fishing nets | 2 Crawler jacks + 2 Survey scopes |
| Causeway | Rope ladder + 2 Pearl oysters | 2 Rope ladders + 2 Split spanners | 2 Rope ladders + 2 Signal lamps |
| Tide gauge | Bearing dial + 2 Brass-ringed lenses | 2 Bearing dials + 2 Fishing nets | Bearing dial + **Expedition note** |
| Rope bridge | Nautilus + 2 Pocket winches | 2 Nautiluses + 2 Fishing nets | 2 Nautiluses + 2 Pocket winches |
| Courier shelter | Signal lamp + 2 Split spanners | Signal lamp + **Gear** | 2 Signal lamps + 2 Focus barrels |
| Mail desk | Focus barrel + 2 Pocket winches | 2 Focus barrels + 2 Sight lenses | Focus barrel + **Travel notebook** |
| Inner lock | Crawler jack + 2 Pearl oysters | 2 Crawler jacks + 2 Sight lenses | 2 Crawler jacks + 2 Signal lamps |

Each recipe has two requirements (one or two of a common part; one rare part), is fixed, and is never
stepped down. No two in a row match, every recipe is unique, and each place asks more drops at stage 3 than
at stage 1. All of this is tested. The shelter's lamps are Signal lamps (lamp 3): 50a's comment wrongly
called lamp 3 a Storm lantern.

### Pacing, build 50a → 50b
Metrics command: `node tests/v5-next-coins-metrics.mjs 4,5,8,10 1,2,3,4,5,6,7,8,9,10 both --runs board=1`.
The prices were chosen by `ch5cost=` sweeps (1.0 / 0.85 / 0.8 / 0.7 / 0.6) over four recipe sets:

1. 50a's recipes only cut in price: at 0.6 the chapter took 0.71× Chapter 4 and 69 % of stages still
   waited for coins.
2. Bigger single parts barely moved anything.
3. Two of the common part, at stages 2–3 and then at stage 1 too, at 0.8: the chapter keeps Chapter 4's
   length while the crew-order repetition drops.

| Chapter 5 (80 runs) | 50a | 50b |
|---|---|---|
| Runs finished | 80 / 80 | 80 / 80 |
| Ch5 ÷ Ch4 duration, median [range] | 1.07 [0.93–1.20] | **0.98** [0.80–1.10] |
| Minutes at 4 / 5 / 8 / 10 s per action (median) | 56 / 69 / 110 / 142 | 50 / 62 / 101 / 123 |
| Crew orders between two stages (median) | 3 | **1** (Ch4: 2) |
| Materials in → stage built, median wait | 2.65 min | **1.0 min** (Ch4: 3.3) |
| Longest such wait | 9.5 min | 8.4 min (Ch4 ≤ 24.3) |
| Stages still short of coins when materials came in | 95–100 % | 67 % (Ch4: 95 %) |
| Gold order covers the stage's cost | 17.4 % | 51.6 %, earned by twice the merging |
| Board median | 29–33 | **23–26** (Ch4 21–24, from 25.5–28) |
| Tier-2 rare gold orders | 60 / 60 | 60 / 60; rare-only pursuit median 1.4–2.9 min, max 13.1 min, ≤ 33 taps |
| Idle waiting for energy | same seeds as before (4 s: ≤ 13 % in 4 of 10 seeds) | unchanged |

- **Chapter length:** Chapter 5 is now as long as Chapter 4 (0.98×), about 9 % shorter than 50a. The time
  moved from repeating crew orders to the merge goals: 2 fewer crew orders a stage, more than twice the
  drops per gold order.
- **Gold cover:** gold now pays about half a stage (51.6 %). The handoff warns against a gold reward that
  funds most of every restoration automatically. This one is not automatic: it is paid for parts that take
  twice the merging. One crew order a stage still makes up the rest.
- **Limits:** these are simulation results for one scripted policy. They do not prove that the chapter is
  fun.

### Tests for 50b
- `tests/v5-next-chapter5.test.mjs`:
  - recipes: no repeats, each its own, rising drops, counts of one or two, the same rare parts;
  - prices: 5,520;
  - favours: a token when no level is free, a cog when one is, held cogs kept across a reload;
  - the full-board kit test lays two of a part where a recipe asks two.
- `tests/v5-next-coins-metrics.mjs`:
  - `board=1`: the board mix, plus where cogs and kits come from and go;
  - `ch5cost=`: the price sweep.
