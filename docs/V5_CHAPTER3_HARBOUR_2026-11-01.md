# Vaultwake V5 Coast Camp — Chapter 3, The Hidden Harbour (build 48a)

- **Date:** 2026-11-01.
- **Branch:** `claude/v5-chapter3-harbour`, started from `claude/v5-secondary-pilot-r2` at **`51b3abe`** (build 47v, the energy pass). Draft PR, base `claude/v5-secondary-pilot-r2`. Not merged anywhere.
- **Source:** the director's art and design handoff (`docs/art-source/hidden-harbour-2026-11-01/CLAUDE_HANDOFF.md`, with its four master images).
- **Unchanged:**
  - V4, `v5/lab`, PR #75 and PR #84;
  - Chapter 1–2 requirements and generator progression;
  - the energy pass (no re-balance), the secondary-chain pilot rules, save keys;
  - no new generator, currency, order type or secondary chain.

## 1. What the player gets

Through Chapter 2's sea gate lies the Hidden Harbour: seven places around one basin, each restored in three stages (21 stages).

- **The chain of places:** the landing first, then the crane and the warehouse together. The boatyard and the registry open once both of those are done. The registry's traced route opens the signal tower. The departure dock's jetty waits for the boatyard's workbench, and its launch waits for both the boat and the signal.
- **What each stage takes:** its gold order (the stage's materials, a part from the camp's own generators) and coins.
- **What each stage gives:** one reward (energy, a Tide token, a Brass cog or a crate) and a line or two of story.
- **The four story moments:**
  1. the arrival (a fresh rope at the landing);
  2. the crane's recovered chest;
  3. the signal answered across the water;
  4. the launch, which is Chapter 3's end card.

## 2. Story continuity (checked against the current game)

- **Where Chapter 2 ends:** "Open the sea gate", then the card "A hidden harbour". There Bram asks, "Who sent that signal, and what happened in that harbour?" (`v5/next/app.mjs` `harbourCard`).
  - That card is now labelled "Chapter 2 complete".
  - Its button is "Enter the harbour", and the arrival follows.
  - Chapter 2's own end card no longer appears, because the content no longer ends there.
- **The wave seal:** the chest's emblem is a wave. Chapter 2 already established "the same wave seal as on your letter, pressed into every cover" (the Tide Archive). So Neri's "That mark again" adds no new fact.
  - Who sent the letter is not revealed.
  - The fleet's compass-and-crescent mark stays a separate thing.
- **Lines:** the handoff's four lines are said on the story cards (and the end card). The stages that lead to them have their own lines, so no line is said twice.
- **Crew:** no new character. The four crew portraits are reused (Bram, Neri, Tamsin, Ivo).

## 3. Places, stages, gold orders and rewards

Requirements and prices were written first (`v5/next/areas.mjs`), then measured (§5); the first measurement met the target, so they are unchanged.

| Place (art) | Stage | Cost | Gold order (chain, tier, count) | Reward | Opens when |
|---|---|---|---|---|---|
| **Landing** (`hb-landing`) | Clear the landing | 180 | Pocket winch (rig 3) + 2 Fishing nets (rope 2) | +10 energy | the chapter starts |
| | Secure the railings | 200 | Pulley block (rope 3) + 2 Split spanners (rig 2) | Tide token | |
| | Light the landing | 220 | Storm lantern (lamp 2) + Pocket winch (rig 3) | crate (newest generator, 2) | |
| **Crane** (`hb-crane`) | Reinforce the crane | 200 | Crawler jack (rig 4) + Fishing net (rope 2) | +10 energy | landing 3 |
| | Fit the pulley | 230 | Pulley block (rope 3) + Pocket winch (rig 3) | Brass cog | |
| | Recover the cargo | 260 | Rope ladder (rope 4) + Pocket winch (rig 3) | crate (3) | |
| **Warehouse** (`hb-warehouse`) | Repair the roof | 200 | Pocket winch (rig 3) + Conch (shell 2) | Tide token | landing 3 (with the crane) |
| | Raise the shelves | 230 | Crawler jack (rig 4) + Pearl oyster (shell 3) | +10 energy | |
| | Sort the supplies | 260 | Pearl oyster (shell 3) + Survey scope (chart 3) | crate (2) | |
| **Boatyard** (`hb-boatyard`) | Set up the workbench | 240 | Crawler jack (rig 4) + Pulley block (rope 3) | +12 energy | crane 3 and warehouse 3 |
| | Repair the hull | 270 | Crawler jack (rig 4) + 2 Pulley blocks (rope 3) | Tide token | |
| | Rig the sail | 300 | Rope ladder (rope 4) + Survey scope (chart 3) | crate (3) | |
| **Registry** (`hb-registry`) | Reopen the office | 240 | Survey scope (chart 3) + Storm lantern (lamp 2) | +12 energy | crane 3 and warehouse 3 |
| | Dry the records | 270 | Signal lamp (lamp 3) + Survey scope (chart 3) | Brass cog | |
| | Trace the route | 300 | Bearing dial (chart 4) + Brass-ringed lens (optic 3) | crate (2) | |
| **Signal tower** (`hb-signal`) | Repair the tower | 260 | Signal lamp (lamp 3) + Pocket winch (rig 3) | +12 energy | registry 3 |
| | Align the lens | 290 | Focus barrel (optic 4) + Storm lantern (lamp 2) | Tide token | |
| | Send the signal | 320 | Focus barrel (optic 4) + Signal lamp (lamp 3) | crate (3) | |
| **Departure dock** (`hb-departure`) | Repair the jetty | 280 | Pulley block (rope 3) + Pocket winch (rig 3) | +12 energy | boatyard 1 |
| | Load the supplies | 310 | Crawler jack (rig 4) + Pearl oyster (shell 3) | Brass cog | |
| | Launch the boat | 350 | Rope ladder (rope 4) + Bearing dial (chart 4) | (the chapter's end) | boatyard 3 and signal 3 |

- **Cost:** 5,410 coins over 21 stages, about 258 a stage. Chapter 2 was 2,970 over 18, about 165 a stage; Chapter 3's orders pay more, because order tiers follow the stages built.
- **Gold orders:** rotated among the place's own chains, following the handoff's roles.
  - Rover and Winch: landing, crane, boatyard. Rover and Shell: warehouse. Kite and Kiln: registry. Kiln and optics: signal. Winch and Kite: departure.
  - The late generators (Shell Trap, Lantern Kiln, Lens Bench) all have work.
- **Tiers:** every gold tier is between 2 and 4, at most one below each chain's top. Chapter 2 already asked for tier 4 of optic, rope and chart.
- **What gold orders never ask:**
  - a rare extra (Bolts, Note fragments), so no random drop gates the chapter;
  - the Echo Crucible, which stays optional.
- **Rewards:** energy (topped up to the refill capacity, as all stage energy is since Build 41g; the energy pass is not re-tuned), Tide tokens, Brass cogs and crates. No generator copy and no new generator.

### Engine change

`upgrades()` in `game.mjs`: a first stage that names what it waits for (`requires`) opens on that alone. Before, every first stage also waited for the place listed before it, so two places could never open together.
- Chapters 1–2 are unchanged. Their only first stage with `requires`, the Observatory hall's, waits for the place before it anyway.
- A test checks that the beach's tent still waits for the path.

## 4. Art

All runtime art is produced by `tools/harbour-art.py` from the director's masters. The masters are kept in `docs/art-source/hidden-harbour-2026-11-01/`: the sprite sheet as lossless WebP, the paintings at q95. Output goes to `v5/assets/premium/coast/hidden-harbour/`, with `manifest.json` giving each file's size and anchor.

**21 stage cut-outs** (`place-hb-<place>-<stage>.webp`):
- **How each is cut:** by its own connected pixels, not a grid. Masts and ropes reach into the row above; the warehouse and boatyard columns touch at a shadow; the boatyard's stage-2 base and stage-3 mast are one piece, split at its base row, with the stage-3 mast tip erased from stage 2.
- **Scale:** one factor for all 21 (1.0035). No building is stretched to another's width.
- **Canvas:** each sits on a 360 px canvas, centred, with its ground at 90 %, so a stage swap stays on its spot.
- **Where they appear:** on the place list, the stage cards and the upgrade feedback.

**The coast screen (map):**
- The harbour picture already paints every building, so no cut-out is stood on it (handoff note 5).
- The damaged painting (`harbour-map-before`) is shown dimmed.
- Each stage bought uncovers its own repair from the restored painting of the same view (`harbour-map-after`), only on the spot that changed. Each stage has its own area (`HARBOUR_REVEAL` in `app.mjs`):
  - **Landing:** the deck, then the rope rails, then the lamps and banners.
  - **Crane:** the mast, then the boom and pulley, then the recovered chest.
  - **Warehouse:** the roof, then the shelves, then the awning and crates.
  - **Registry:** the doors, then the awning, then the route board.
  - **Signal tower:** the tower body, then the lit sea-green lamp, then its beam and bunting.
  - **Departure dock:** the jetty, then the barrels, and the boat only at the launch.
  - **Boatyard:** keeps its boat on the slip (the damaged painting's own colour) until the launch. Then its spot turns to the restored painting's empty cradles, and its card shows stage 1's empty cradles. One boat is never drawn twice (handoff note 4).
- The two paintings are not pixel-registered (the generator redrew fine detail everywhere), but within the soft-edged areas they blend without a visible seam (checked at 1024 px and in the browser).
- A finished harbour shows the whole restored painting.

**Story pictures:**
- The four panels are cut from the story sheet (`story-arrival|cargo|signal|departure.webp`, 768 × 512), with descriptive alt text.
- In portrait the picture sits above the words; in a short landscape window, beside them.

**Corrections made:**
- **Signal tower stage 3:** the lamp glass is recoloured from warm gold to the sea-green of stage 2 and the paintings. The brass stays gold (handoff note 3).
- **Arrival panel:** the harbour behind the arch is painted already repaired (handoff note 2). A sea mist is laid over it, so nothing there reads as repaired. This is an **interim** fix.
- **Boatyard after the launch:** shows stage 1's empty cradles (above).

**Missing art, not done here** (named so nothing is taken as finished):
1. **A damaged stage-0 harbour map.** In `harbour-before-concept` the crane and the departure dock already look working (handoff note 1). In the game this is softened, not fixed: the unrestored harbour is dimmed and greyed, and those two spots change least when bought.
2. **A painted arrival panel with the harbour still damaged.** The current one is the master with a mist overlay.
3. **Matching clean site plates or registered per-stage layers for the map** (handoff note 5). The map uses the before/after paintings as described above, so the map change per stage is the restored painting's version of that spot, revealed in three steps. The three distinct painted states of each place are on the cards.

## 5. Pacing (measured)

`node tests/v5-next-chapter3-metrics.mjs 4,5,8,10 1,…,10 both --runs --gold`
- **Setup:** the scripted player (`tests/v5-next-policy.mjs`) through the economy harness, from a new camp to the launch. Secondary model B; each seed rolls its own drops.
- **Results:** medians over 10 seeds; without the shop. With the shop the results are identical, because energy never runs out since the energy pass.
- **Target set before measuring:** a Chapter 3 stage should take about as long as a Chapter 2 stage, 1.0–1.15×, with no stalls, no waiting and the board never full.

| Speed | Finished | Chapters 1–3 (min, median · max) | Chapter 2 (min · per stage) | **Chapter 3 (min, median · max)** | **Ch3 per stage** | Ch3 gap between stages (median · max) | Ch3 waiting · energy outs | Ch3 board (median · p90) | Board full · rewards waiting | Gold order on the board (median · max, min) |
|---|---|---|---|---|---|---|---|---|---|---|
| 4 s | 10/10 | 202.8 · 207.5 | 41.3 · 2.3 | **51.9 · 59.7** | **2.5** | 2.4 · 7.3 | 0 · 0 | 17 · 20 | 0 % · 0 % | 1.0 · 3.3 |
| 5 s | 10/10 | 250.1 · 260.5 | 51.6 · 2.9 | **65.9 · 72.3** | **3.1** | 3.0 · 9.1 | 0 · 0 | 18 · 20 | 0 % · 0 % | 1.1 · 3.1 |
| 8 s | 10/10 | 397.8 · 405.9 | 82.9 · 4.6 | **99.6 · 105.0** | **4.7** | 4.5 · 14.3 | 0 · 0 | 16 · 19 | 0 % · 0 % | 1.8 · 5.4 |
| 10 s | 10/10 | 500.5 · 521.7 | 98.8 · 5.5 | **122.3 · 127.9** | **5.8** | 5.5 · 15.6 | 0 · 0 | 16 · 19 | 0 % · 0 % | 2.2 · 6.1 |

- **Rhythm:** a Chapter 3 stage takes 1.03–1.09× a Chapter 2 stage at every speed, within the target. So the draft prices and gold orders are kept as written.
- **No stalls:** 80 of 80 runs finish. There is no waiting and no energy out in Chapter 3, the board is never full, and no reward waits for space.
- **Gold orders:** each stands a median 1.0–2.2 min on the board before delivery.
- **Build order:** the scripted player follows the dependencies in one of two orders (landing → crane and warehouse in turn → boatyard and registry in turn → departure jetty → signal → launch). No place waits long: the longest gap between two stages is 7–16 min, close to Chapter 2's 6–16.
- **Board:** 16–18 spaces used, a little below Chapter 2's 16–19.

## 6. Saves

Save keys are unchanged, and the save version stays 5 (the energy pass's). There are no new fields: Chapter 3 is new place ids in `built`/`materials`, and new story-card ids in `seen`.
- **A camp that finished Chapter 2** (build 47v, version 5, or earlier, version 4) loads into the harbour:
  - The board, shed, rewards waiting, coins, energy, level, built stages and seen cards are kept as they were.
  - The landing's gold order is put up (existing `advance` + `ensureGold`).
  - Its old end card no longer marks the end (`seenEnd` is cleared while there is more to build, as since Build 47b).
  - Loading again changes nothing.
- **A camp partway through the harbour** loads as it was.
- **Damaged values:** a damaged stage (e.g. 4) still starts a new camp, as for every area.
- **Older builds:** a 47v build reading a 48a save sees unknown place ids. These fail its `built` check, so it reads the save as damaged, and since build 47c it leaves such a save untouched (Retry or an explicit new camp, which keeps a copy).

## 7. Interface

- **Chapter 2 → 3:** the sea gate card ("Chapter 2 complete · A hidden harbour", "Enter the harbour"), then the arrival card.
  - The arrival card shows the picture, Bram's line and "Next: Clear the landing · its gold order is on the board".
  - Its button, "Make the gold order", marks that order on the board.
- **The cargo and signal cards:**
  - **"Next":** the real next step, or what it waits for (e.g. "Reopen the office" or "Set up the workbench · after …").
  - **Once only:** each is shown once and marked seen when dismissed. A save that has moved past one marks it without playing.
- **The end card:** "Chapter 3 complete · The boat is ready", with the departure picture, Ivo's line and the totals (84 / 84 stages).
  - **Buttons:** only Keep playing and Share feedback. No Chapter 4 button, and none is promised.
  - **Shown once:** it is shown once (`seenEnd`). Keep playing returns to the board.
- **Replay:** a finished place's card offers "Replay its story" (its stage lines), as before.
- **Accessibility and layout:**
  - story buttons are at least 44 px;
  - text wraps at 360 px;
  - reduced motion shows the map change at once;
  - no screen shake or repeated full-screen cards.
- **Help** names the Hidden Harbour. Build 48a. The CrazyGames page is regenerated.

## 8. Tests

- **`tests/v5-next-chapter3.test.mjs`** (8 tests):
  - the places, costs and one reward each;
  - every gold order authored from primary chains at tiers 2–4 (never a rare extra or the Crucible);
  - every dependency, including the blocked-stage message;
  - finished Chapter 2 saves (versions 4 and 5, end card seen or not) entering the harbour with board, shed, waiting reward, energy and seen cards kept;
  - all 21 stages bought as a player does, never stuck, each gold order as authored;
  - a full board (energy at once, token and crate waiting, kept across reload, landing once);
  - the story cards seen once;
  - mid-chapter and damaged saves.
- **`tests/v5-next-chapter3-browser.cjs`:**
  - **At 390 × 844:** a finished Chapter 2 save gives the arrival once, then the gold order marked, then the coast screen (damaged harbour, nothing stood on it, seven places, the picture's ratio). All 21 stages are then bought by hand: each gold order delivered from the board and each stage built on the coast screen, each uncovering more of the restored painting. The cargo and signal cards come once; the end card comes once with no Chapter 4. Then Keep playing, a reload with nothing shown again, and the boatyard's card showing empty cradles.
  - **At 360 × 780, 430 × 932 and 907 × 510:** the entry, a stage by hand, the cargo card with its next step, the launch and the end card.
  - **Everywhere:** every harbour picture loads, nothing scrolls sideways, and story buttons are 44 px.
  - It runs in CI after the Chapter 2 suite.
- **Updated:** the Chapter 2 rules and browser suites (the sea gate now leads into the harbour, with no end card), the place count (28), and the "area out of range" save test (area 4 is playable now).
- **`tests/v5-next-chapter3-metrics.mjs`:** the pacing above.

## 9. Remaining issues

1. **Missing art (§4):**
   - a damaged stage-0 harbour map (crane and departure dock look working);
   - a damaged-harbour arrival panel (a mist covers it for now);
   - registered per-stage map layers.
2. **Map changes on the crane and departure dock are smaller** than at other places, because the damaged painting already shows them working.
3. **The boatyard's card after the launch** shows stage 1's empty cradles while the place says "Rig the sail · Fully restored". There is no painted empty-yard stage-3 picture.
4. **The scripted player is a proxy.** Chapter 3's pacing was measured, not played by a person; a human playtest of the whole chapter is still needed.
5. **WebKit, Safari on iPhone:** WebKit runs only in CI, since it is not installed in this container. Safari on iPhone has not been tried by hand.
