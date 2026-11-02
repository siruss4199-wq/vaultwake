# Coast Camp Chapter 6: The Keeper's Promise (build 51a, 2026-11-02)

Branch `claude/v5-chapter6-keepers-promise`, from `96a4103`, PR #88's head after the Chapter 5 closeout. The
source is the director's pack `Vaultwake_Chapter6_Art_Design.zip`. Its handoff, narrative, review notes, data
and masters are kept in `docs/art-source/keepers-promise-2026-11-02/`.

This chapter ends the first story. V4, `v5/lab/`, Classic V5 (including the shared `v5/crew.mjs`), PR #75,
save keys and energy rules are untouched. No generator, currency, board or secondary chain was added.

## Story: the letter and the Vault
The canon this chapter builds on, checked before writing:
- The intro letter is **unsigned**, closed with a **turquoise wave seal**, and the same seal is on the Vault
  (`story-intro.mjs`).
- The archive's records carry the same seal (Chapter 2).
- Chapter 4's relay answers a signal **on its own**.
- The letter's own words were never shown.

How Chapter 6 resolves it:

| Moment | Who | Line |
|---|---|---|
| Arrival (card) | Tamsin | The Vault protected a coastal station. Its channels and lights once served the whole harbour. |
| Records 3 (caption) | Neri | The Vault was built to guard this station: its sluices, its channels and its lights. |
| Workshop 3 (card "The keeper") | Mara | I sent the letter. When the routes failed, I could no longer maintain this station alone. / The light on the headland answers by itself. The letter was mine. |
| Desk 3 (card "Why the letter") | Mara | The wave seal was our promise: a safe way home. I left the letter unsigned and trusted the seal to lead you to the Vault, so that promise could live again. |
| End (card "A coast awake") | Bram, Mara | The routes are open, the lights are answering, and the harbour is home again. / You kept the promise. This station is yours to visit, any day. |

- **Who sent the letter, and why:** Mara, the keeper, could not maintain the station alone. She left the
  letter unsigned and trusted the seal to lead help to the Vault.
- **What the Vault was for:** it guarded the coastal water-and-signal station.
- **Two separate mechanisms:** the relay's automatic reply and her letter are different things, and Mara
  says so.
- **What the pack's line was changed from:** "I asked you to open the Vault". The new line does not quote a
  letter whose words the game never showed.
- **Mara in the game:**
  - She speaks only after she is met (the workshop card), never before the regulator; this is tested.
  - She has **no portrait**. Her lines show her name only (`GUESTS` in `app.mjs`, `.revealLine.noFace`),
    and no other character's face is used.
  - The storyboard panel that shows her is used as that card's illustration, not as a dialogue portrait.

## Chapter 5 → 6
- Chapter 5's end card, "Behind the Vault", is now Chapter 5's last story card (`ch5-station`, from
  `stationCard`). It names "Chapter 6 · The Keeper's Promise" and leads into the station with "Enter the
  inner station".
- **A finished Chapter 5 save advances on load:**
  - If it saw the old end card (`seenEnd`), `ch5-station` is marked seen and the Chapter 6 arrival still
    plays.
  - If it did not, the card plays first, then the arrival.
- **Preserved through the move:** board, shed, pending rewards, generator levels, coins, energy above its
  cap, active orders, material credits and every story flag.
- **An unfinished Chapter 5 save** stays in the passage.
- **A Chapter 6 save in progress** keeps its secured materials, gold order, pending rewards and energy across
  a reload; all of this is tested.

## The chapter
- **Area `keeper`**, 7 places × 3 stages, in one line (each place needs the one before it at stage 3):
  1. `ch6-landing`
  2. `ch6-wheel`
  3. `ch6-records`
  4. `ch6-workshop`
  5. `ch6-regulator`
  6. `ch6-desk`
  7. `ch6-overlook`
- **Story cards**, each shown once and never replayed by a reload:
  - `ch6-arrival`: its button marks the landing's gold order.
  - `ch6-keeper`: after the workshop; leads to the regulator.
  - `ch6-letter`: after the desk; leads to the overlook.
- **The end:** "A coast awake", once.
  - It shows the chapter's stages (21 / 21) and the whole camp's (147 / 147), labelled apart.
  - **View the restored coast** opens the restored station map.
  - **Return to board** and **Share feedback** are its other two buttons. Crew orders, the shop and the book
    carry on.
  - There is no Chapter 7 button or promise.

### Gold recipes (build 50b's way)
Every recipe has two requirements, is fixed, and is never stepped down. None repeats the one before it,
including Chapter 5's last, and each is unique; this is tested. Common merge demand rises within the four
places that have no rare part. The three rare stages are goals of their own, covered by the gold guarantee.
No part asks for a chain's top: the regulator uses Signal lamps, because the pack's lamp 4 is the lamp
chain's top.

| Place | Stage 1 | Stage 2 | Stage 3 |
|---|---|---|---|
| Inner landing | Crawler jack + 2 Brass-ringed lenses | 2 Crawler jacks + 2 Conches | 2 Crawler jacks + 2 Signal lamps |
| Waterwheel | Rope ladder + 2 Pocket winches | 2 Rope ladders + 2 Sight lenses | 2 Rope ladders + 2 Pearl oysters |
| Records gallery | Bearing dial + 2 Pulley blocks | 2 Bearing dials + 2 Storm lanterns | Bearing dial + **Expedition note** |
| Keeper's workshop | Nautilus + 2 Pocket winches | 2 Nautiluses + 2 Ground lenses | 2 Nautiluses + 2 Survey scopes |
| Tide regulator | Signal lamp + 2 Survey scopes | Signal lamp + **Gear** | 2 Signal lamps + 2 Rope ladders |
| Dispatch desk | Focus barrel + 2 Pearl oysters | 2 Focus barrels + 2 Split spanners | Focus barrel + **Travel notebook** |
| Harbour overlook | Crawler jack + 2 Survey scopes | 2 Crawler jacks + 2 Storm lanterns | 2 Crawler jacks + 2 Brass-ringed lenses |

- **Stage-3 kits:** 2 parts of the place's chain, as in Chapters 4 and 5. No energy, coin or generator
  reward.
- **Prices:** the pack's 8,505 × 0.72 (Chapter 5's 50b scale), then × 0.9 as measured. Total 5,515;
  220–305 per stage.

## Pacing
Command: `node tests/v5-next-coins-metrics.mjs 4,5,8,10 1,2,3,4,5,6,7,8,9,10 both --runs board=1`
(80 runs: 4/5/8/10 s per action, 10 seeds, shop on and off). The price was swept with `ch6cost=` at 1.0
and 0.9.

| | Chapter 5 (50b) | Chapter 6 (51a) |
|---|---|---|
| Runs finished (whole game) | 80 / 80 | 80 / 80 |
| Duration vs the chapter before, median [range] | 0.98 [0.80–1.10] × Ch4 | **1.00 [0.89–1.15] × Ch5** |
| Minutes at 4 / 5 / 8 / 10 s per action (median) | 50 / 62 / 101 / 123 | 49 / 64 / 102 / 125 |
| Crew orders between two stages (median) | 1 | 1 |
| Materials in → stage built, median wait | 1.0 min | 1.05 min |
| Longest such wait | 8.4 min | 6.0 min |
| Stages short of coins when their materials came in | 67 % | 71 % |
| Gold covers the stage's cost | 51.6 % | 52.4 % |
| Board median | 23–26 (mean of medians 25) | 26 (Brass cogs 2.7, kits 4.6) |
| Rare-only pursuit, whole game | – | median 0.9–2.6 min, max 13.1 min, ≤ 33 taps; tier-2 rare gold orders 70 / 70 |
| Longest gap between two stages | 5.9–15.8 min | 5.4–15.7 min |
| Idle waiting for energy | same seeds as before (4 s: ≤ 13 %) | unchanged |

At ×1.0 the chapter took 1.07× Chapter 5, ranging up to 1.25×, with 2 crew orders a stage and 81 % of
stages short of coins. That is why the price is ×0.9.

- **Earlier chapters:** Chapters 1–5 are unchanged; Chapter 5 ends at the same minute (506.8 median).
- **Whole game:** the median total is 590 min for the scripted player.
- **Limits:** these are simulation results for one scripted policy. They do not prove that the chapter is
  fun.

## Art (`tools/keeper-art.py`, the same method as `tools/lowwater-art.py`)
- **Masters:** kept as WebP q92.
- **Maps:**
  - Both are cropped to 1024×1195 (y 150–1345) and used as whole-state backgrounds: damaged until the
    chapter is done, then restored.
  - They were painted apart and are not layers; there are no pins on the restored painting.
  - Pins sit on the damaged map, in the order of the line, from the inner landing at the top left to the
    harbour overlook at the bottom right.
- **Stage sprites:** 21, cut from the 7×3 concept sheet by keying, connected pieces and row splitting; checked
  on dark and paper.
- **Storyboard panels:** all 4 are used. None of the cards they illustrate names the wave seal over a
  generated emblem.
- **Strip picture:** taken from the damaged map.
- **Size:** 1.7 MB.

## Tests
- **`tests/v5-next-chapter6.test.mjs`** (8 tests):
  - data, ids, labels and prices, with Mara speaking only after she is met;
  - the line order, with only one place open and `aim` unable to jump it;
  - recipes: no repeats (Chapter 5's last included), unique, rising common demand, the three rare goals,
    the Gear never lowered, `goldChase`;
  - a finished Chapter 5 save, with `seenEnd` set and unset;
  - an unfinished Chapter 5 save, and a Chapter 6 save in progress (credit, gold order, pending rewards,
    energy);
  - all 21 stages, each charged once, then the end once;
  - the full-board kit, once;
  - story flags once.
- **`tests/v5-next-chapter6-browser.cjs`** (Chromium 390×844 plays all 21 stages by hand; WebKit plays the
  entry, a stage and the end at every size; 360×780 also shows the unseen "Behind the Vault" first):
  - Mara is named and has no face;
  - the end card;
  - the restored station;
  - back to the board;
  - nothing replays on reload;
  - pictures load and nothing scrolls sideways at 360, 390, 430 and 907×510.
  - It is added to CI after Chapter 5.
- **Updated:**
  - Chapter 5 unit and browser tests: its last stage leads into Chapter 6;
  - `v5-next.test.mjs`: 49 places, 8 areas;
  - `v5-next-browser.cjs`: 7 coming areas;
  - playtest and bright browser tests: the content ends at the overlook;
  - Chapter 4: the place count;
  - metrics: `ch6` and `ch6cost=`.

## Remaining visual QA
- **Mara has no approved portrait.** Her lines are text with her name.
  - The storyboard panel shows an elderly woman with a silver braid.
  - The game's Tamsin portrait is also grey-haired, so players may confuse the two until Mara has her own
    portrait.
- **The maps are not layers.** There is no stage-by-stage change on the map: the place cards and tiles carry
  each stage.
- **Sprites:** concept-sheet cuts of about 250–330 px, softer than Chapter 4's 512 px sprites.
- **The finale painting** shows a crowd and the two figures from behind. It does not prove which crew members
  are present.
- **Landscape end card:** at 907×510 it scrolls, as Chapters 4 and 5 do.
- **WebKit** cannot be installed here; it runs only in CI.
