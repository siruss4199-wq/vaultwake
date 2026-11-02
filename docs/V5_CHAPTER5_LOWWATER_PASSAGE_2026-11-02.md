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
| Shelter 3: lamp 4 + rig 2 | lamp 3 + rig 3 | Lamp 4 (Beacon lens) is the top of the lamp chain, and no order asks for a chain's top (`maxTier−1`). Rig 3 keeps stage 3 harder than stage 1, which would otherwise be identical. |
| Lock 3 "Open inner passage" | "Restore the inner lock" | ART_REVIEW warns that the stage-3 concept still looks closed. The gates are shut in the sprite, so the passage opening is told by the end card's painting (an open door). |
| Story panel 2 (chest and ledger) | not shipped; the card shows the restored shelter sprite | Its emblem is generated and is not the letter's wave seal (ART_REVIEW), while Neri's line names that seal. |
| Prices 7,665 | ×0.9 → 6,900 (270–385 per stage) | At the pack's prices the chapter took 1.11–1.19× Chapter 4 (median), up to 1.29×, and coins were the wait at every stage. |

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
