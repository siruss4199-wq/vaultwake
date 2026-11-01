# Coast Camp Chapter 4: The Answering Light (build 49a, 2026-11-02)

Branch `claude/v5-chapter4-answering-light`, from `78a5acf` (PR #86, build 48c: Chapter 3, the energy cap of 100 and the fixed rare goals). Draft, not for merge.

- **Source:** the director's Chapter 4 pack, three ZIPs unpacked into one `Vaultwake_Chapter4` folder (42 files, no overlaps). It is kept in `docs/art-source/answering-light-2026-11-02/`:
  - its handoff, design, art notes, QA checklist and data under `pack/`;
  - its 27 PNG masters as WebP (quality 92), with its SHA-256 manifest.
- **The pack's proposal is translated, not pasted.** `data/chapter4-proposal.json` became `v5/next/areas.mjs` entries, and its zero-based tiers are this engine's tiers.
- **Unchanged:**
  - V4, `v5/lab/`, Classic V5, PR #75;
  - earlier areas' indices and ids, save keys, energy rules, primary drops, the board;
  - the inactive Winch, Shell and Kiln secondaries.
- **Not added:** no new currency, generator or order type, and no Chapter 5.

## 1. Places, stages, recipes

The landing comes first, then the cliff steps. After that, two branches can be taken in either order:
- the keeper's cottage, then the signal records;
- the reflector workshop, then the lighthouse.

The relay opens once the workshop and the records are done. Its last stage also needs the lighthouse, so it is the chapter's finale.

| Stage | Name | Cost | Gold order (fixed) | Requires | Reward |
|---|---|---|---|---|---|
| landing 1 | Brace the landing | 220 | Pocket winch + Fishing net | — | — |
| landing 2 | Lay the deck | 240 | Crawler jack + Fishing net | — | — |
| landing 3 | Secure the landing | 260 | Pulley block + Storm lantern | — | kit: 2 × rope |
| steps 1 | Clear the rockfall | 240 | Pocket winch + Fishing net | landing 3 | — |
| steps 2 | Rebuild the cliff steps | 260 | Crawler jack + Conch | — | — |
| steps 3 | Fit the safety ropes | 280 | Pulley block + Split spanner | — | kit: 2 × rig |
| cottage 1 | Seal the keeper's roof | 260 | Pocket winch + Conch | steps 3 | — |
| cottage 2 | Reopen the keeper's room | 280 | Storm lantern + Pocket winch | — | — |
| cottage 3 | Find the keeper's log | 300 | Survey scope + Expedition note **(rare)** | — | kit: 2 × chart |
| workshop 1 | Restore the workbench | 260 | Crawler jack + Pulley block | steps 3 | — |
| workshop 2 | Fit the turning gears | 300 | Pocket winch + Gear assembly **(rare)** | — | — |
| workshop 3 | Polish the reflector | 320 | Brass-ringed lens + Pearl oyster | — | kit: 2 × rig |
| records 1 | Open the signal room | 280 | Pocket winch + Storm lantern | cottage 3 | — |
| records 2 | Sort the signal records | 300 | Survey scope + Expedition note **(rare)** | — | — |
| records 3 | Decode the signal pattern | 340 | Bearing dial + Travel notebook **(rare)** | — | kit: 2 × chart |
| lighthouse 1 | Repair the tower access | 300 | Rope ladder + Pocket winch | workshop 3 | — |
| lighthouse 2 | Set the lighthouse lens | 340 | Focus barrel + Signal lamp | — | — |
| lighthouse 3 | Light the headland | 360 | Signal lamp + Brass-ringed lens | — | kit: 2 × lamp |
| relay 1 | Rebuild the relay base | 300 | Crawler jack + Pulley block | workshop 3, records 3 | — |
| relay 2 | Set the timing cams | 340 | Bearing dial + Gear **(rare)** | — | — |
| relay 3 | Read the stored message | 380 | Focus barrel + Signal lamp | lighthouse 3, records 3 | kit: 2 × optic |


- **Stable ids:** `ch4-landing`, `ch4-steps`, `ch4-cottage`, `ch4-workshop`, `ch4-records`, `ch4-lighthouse`, `ch4-relay`.
- **Recipes:** every stage asks two fixed materials.
  - Five stages ask a merged rare part directly: Expedition note, Gear assembly, Expedition note, Travel notebook, Gear.
  - None goes through the old `rare` swap or any step-down.
  - The gold objective's guarantee (build 48c) covers them: a drop is certain on the 8th eligible tap while the gold order lacks its rare part.
- **Rewards:** stages 1–2 are their visible repair only; stage 3 gives a kit of 2 of a chain the camp has. This follows the pack's candidates. There is no new energy or coin reward, and no second cash reward on a gold delivery.
- **Prices:** the pack's provisional 6,160 coins in all. They were measured (section 6) and kept, since every pacing target holds.

## 2. Choosing a branch (s.aim)

Until now, the gold order always followed the cheapest open stage. The design asks for the player to switch between open branches.

- **The choice.** The map card of an open stage without its materials offers **Work on this next** (44 px). This is `act({type:'aim'})`.
  - It replaces only the gold order. Parts on the board stay, and materials already delivered stay with their stage. Crew orders and order slots are unchanged.
- **It sticks.** The choice is saved (`s.aim`, optional; an old save without it keeps the cheapest stage, and a damaged value is dropped).
  - It holds while that place has an open stage.
  - When the chosen place's materials come in, the next gold order goes to the other branch meanwhile, so there is parallel progress while coins are short.
  - After the chosen stage is built, its next stage takes the gold order back. This only happens while none of the other order's parts is on the board, so no work is undone.

## 3. Entering from Chapter 3, saves

- **The launch.** It was the end of the content. It is now Chapter 3's last story card ("Chapter 3 complete · The boat is ready", **Follow the light**), followed by Chapter 4's arrival card.
- **A save that saw Chapter 3's end card** has the launch marked seen by `load()`. Its Chapter 4 arrival is still to come: seen flags are per card, so Chapter 3's end is not Chapter 4's.
- **A finished Chapter 3 save keeps** its board, shed, pending rewards, generator levels, coins, energy above capacity, active crew orders, material credits and collection (unit-tested). It gets the landing's gold order.
- **No new required field.** `aim` is optional and defaulted.

## 4. Story and presentation

- **Story cards** (`data/story-cards.json`): the arrival, the keeper's log (cottage 3), the first light (lighthouse 3) and the stored message (relay 3, the end card).
  - Each plays once and stays seen across reloads.
  - They use the crew's own portraits and the pack's text-free portrait paintings, shown in a 4:5 window at a chosen focus.
- **The first light** sweeps its beam once, for 1.8 s. With reduced motion it is a still glow. There is no flashing.
- **Stage lines** appear as a short caption with the stage's rewards, not as a dialog to tap through (the pack's "four full cards").
- **The end card:**
  - "The headland answers", Neri's and Bram's lines and "You restored the light and decoded a route through the reef".
  - **This chapter's stages 21 / 21**, with **All chapters so far 105 / 105** labelled apart.
  - **View the restored headland** (primary) and **Return to board**.
  - "This is the end of the story so far": no Chapter 5 button or promise.
- **The map**, following the pack's honest strategy:
  - The coast screen shows the damaged headland until all 21 stages are built, then the restored one. The two masters are not registered layers, so nothing is uncovered in patches, and no lit tower shows before the end.
  - Each stage shows on its place's card and tile with its **own sprite**: all 21 separate sprites, never a sheet.
  - An unbuilt place's tile shows its stage-1 sprite dimmed, as a preview, never as earned.
  - Pins sit at points measured against the crop, and every pin lands on its building (checked on both maps).
  - One boat stays at the landing.
- **Lazy loading:** stage sprites load lazily; only the current map loads.

## 5. Art (`tools/headland-art.py`)

- **Masters:** WebP (quality 92) in the art-source folder. Pixels are not edited and nothing is cut from a sheet.
- **Maps:** cropped to the headland (1024 × 1195 from y 60), the same crop for both.
- **Sprites:** 512 px, alpha kept.
- **Stories:** 768 × 1152.
- **Strip picture:** 1200 × 400.
- **Not done:** per-stage map layers (the pack's caveat). Detailed stage changes are shown on the place cards, not on the map, until the chapter is done.

## 6. Pacing (scripted player, 10 seeds, 4/5/8/10 s, shop on and off; `node tests/v5-next-coins-metrics.mjs 4,5,8,10 1..10 both`)

The pack's prices, against Chapter 3 of the same runs (build 48c economy):

| Speed | Shop | Ch3 (min) | Ch4 (min) | Ch4 ÷ Ch3 | Runs with energy waiting · worst | Materials → build, median · longest (min) | Longest gap between stages, Ch4 (Ch3) | Board median Ch4 (Ch3) | Rare-only pursuit median · longest (min) · most taps |
|---|---|---|---|---|---|---|---|---|---|
| 4 s | off | 55.2 | 50.7 | 0.92 | 4/10 · 15 % | 2.3 · 11.7 | 7.8 (8.4) | 27 (18) | 1.6 · 12.5 · 30 |
| 5 s | off | 67.1 | 63.8 | 0.95 | 1/10 · 5 % | 3.1 · 15.6 | 8.1 (9.5) | 28 (20) | 1.9 · 8.8 · 32 |
| 8 s | off | 105.4 | 106.2 | 1.01 | 0/10 · 0 % | 4.3 · 24 | 13 (16.1) | 28 (20) | 2.9 · 12.9 · 29 |
| 10 s | off | 127.9 | 126.8 | 0.99 | 0/10 · 0 % | 5.7 · 24.3 | 16.8 (19.8) | 28 (20) | 3.4 · 13.1 · 32 |
| 4 s | on | 50.9 | 52.5 | 1.03 | 0/10 · 0 % | 2.4 · 9.3 | 7.8 (7.3) | 26 (17) | 1.6 · 4.8 · 27 |
| 5 s | on | 67.9 | 63.0 | 0.93 | 0/10 · 0 % | 2.6 · 14.7 | 8.1 (9.1) | 27 (20) | 1.7 · 8.8 · 32 |
| 8 s | on | 105.4 | 106.2 | 1.01 | 0/10 · 0 % | 4.3 · 24 | 13 (16.1) | 28 (20) | 2.9 · 12.9 · 29 |
| 10 s | on | 127.9 | 126.8 | 0.99 | 0/10 · 0 % | 5.7 · 24.3 | 16.8 (19.8) | 28 (20) | 3.4 · 13.1 · 32 |

- **All 80 runs finish.**
- **Chapter length:** Chapter 4 is **0.92–1.03×** Chapter 3, inside the 0.9–1.15 target.
- **First restoration:** 0.8–6.0 min after entry (5 seeds × 4 speeds); the target was about 3–5.
- **Gold covers 23.7 %** of Chapter 4's costs. The stage is coin-short in 90–95 % of cases, and about two crew orders per stage pay the rest. At 5 s, the chapter's coins came 4,710 from crew orders and 1,460 from gold.
- **Tier-2 rare gold orders appear and complete:** 50 of 50 per setting, five per run (Chapter 2's Travel notebook, Chapter 3's Gear assembly and Travel notebook, Chapter 4's Gear assembly and Travel notebook). The longest pursuit took 32 eligible taps, the guarantee's bound.
- **Watch items:**
  - **Materials → build median** is 2.3–3.1 min at 4–5 s but 4.3–5.7 at 8–10 s, with a tail to 24 min. It is better than Chapter 3's at the same speeds.
  - **The board** runs fuller than in Chapter 3: median 26–28 cells of 49, against 17–20. That is the top of the 18–27 guideline, likely from the kits and the higher tiers asked. No stall was seen.
  - **Energy waiting** happens only at 4 s: 4 of 10 runs without the shop, worst 15 %. This comes from the build 48c capacity cap.

## 7. Tests

- **`tests/v5-next-chapter4.test.mjs`** (8):
  - data, ids and rewards;
  - dependencies, both branch orders and no cycle;
  - fixed recipes with two materials each, the five rare parts, and the Gear assembly with nothing, a Bolt, a Gear or the assembly held;
  - a finished Chapter 3 save entering, with and without its end card seen;
  - all 21 stages, each charged once, the relay last, nothing twice after a reload;
  - the relay waiting for the lighthouse and records;
  - the branch choice: parts and credits kept, after a build, a part already made, a damaged `aim`;
  - a stage-3 kit on a full board, once.
- **`tests/v5-next-chapter4-browser.cjs`:**
  - at 390 × 844, all 21 stages by hand, as described in its header;
  - at 360 × 780, 430 × 932 and 907 × 510, the entry, a stage, the branch choice and the end;
  - pictures load, there is no sideways scroll, and buttons and pins are 44 px.
- **Updated suites:**
  - Chapter 3: the launch card, then the arrival;
  - playtest, bright and main: the end of the content is the relay;
  - unit counts: the area list and the Chapter 3 run.
- **Results (local, Chromium):**
  - unit and simulation: 377 pass, 0 fail;
  - Chapter 4, Chapter 3, Chapter 2, bright, energy, rare merges, story, saves, rewards, extras, Home, CrazyGames and coast map browser suites pass;
  - the main and playtest suites pass every Chromium case, then stop at WebKit, which is not installed here.

## 8. Limits and open items

1. **Map.** The headland map changes only at the chapter's end. Per-stage map regions need registered art (the pack's caveat); stage progress is on the cards.
2. **Board pressure** is higher than in Chapter 3 (median 28). It needs a human playtest on a board-constrained entry save.
3. **The harbour's post-launch boatyard card** (build 48c) is now rarely seen: the coast screen moves to the headland at the launch.
4. **The scripted player is a proxy** and does not judge fun. Its branch choice is the default, the cheaper branch first. Both orders are covered by the unit and browser tests.
5. **WebKit and real phones:** WebKit runs in CI only, and no real phone has been tried.
6. **The pack's art notes still apply:** generated masters, polished brass that can read as lit, and small details lost at 96 px.
