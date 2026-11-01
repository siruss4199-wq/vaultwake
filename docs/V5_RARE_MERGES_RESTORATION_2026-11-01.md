# Coast Camp: rare merges and restoration (builds 48b and 48c, 2026-11-01)

Branch `claude/v5-rare-merges-restoration` (PR #86, draft, not for merge), from `claude/v5-chapter3-harbour` (PR #85). Build 48c is the gameplay pass before Chapter 4. Build 48b's report follows it, from "Build 48b" below; where 48c changed something, the 48c section is the current state.

- **Unchanged:** V4, `v5/lab/`, Classic V5 (`v5/core.mjs`, `v5/app.mjs`, `v5/energy.mjs`), PR #75, the save keys and the state shape.
- **Not added:** no new currency, generator, order type, timer or chapter. The Winch, Shell and Kiln secondary chains stay off.
- **Correction to build 48b's PR text.** It said "no reward is cut". That was wrong: gold orders pay their parts' worth ×1.3 after the first six stages, down from ×1.5. That is a cut to the gold-order reward. Crew-order rewards and prices were not changed.

# Build 48c

## 1. Energy capacity: 100 at most

| Levels | 1–2 | 3–4 | 5–7 | 8–11 | 12 and on |
|---|---|---|---|---|---|
| Capacity (`v5/next/energy.mjs` `CAPACITY`) | 50 | 60 | 70 | 80 | **100** |

- **Level 12** raises the capacity 80 → 100. The existing milestone rule pays the actual delta, **+20 energy, once**. No later level pays a capacity step.
- **Unchanged:** the refill speed (+1 every 2 min), level energy, onboarding bonuses, bonus overflow up to 200, owed energy, and the save keys.
- **Old saves.** `load()` already sets the paid capacity (`capPaid`) to the level's capacity on every load, so:
  - a level 12–16 save (old 90) moves to 100 without back-pay;
  - a level 23+ save (old 110/120) moves to 100;
  - energy above 100 is kept, and the refill rests until it falls below 100;
  - nothing is paid twice.
- **Text:**
  - the help reads "60 at level 3, 70 at 5, 80 at 8 and 100 at 12, the most";
  - the HUD example is 135/100;
  - the level panel names 100 as the maximum;
  - no text promises 110 or 120.
- **Tests:**
  - every boundary;
  - level 11 → 12 (+20 once, nothing after a reload, nothing from 13 to 40);
  - saves at 90, 100, 110 and 120 (energy kept, no back-pay, no later step);
  - a level-30 save at 118 energy that does not refill;
  - a browser check of a level-30 save from capacity 120 showing 135/100 BONUS, capacity 100.
- **Effect** (measured, see 5): the fastest scripted player (4 s an action) now has energy waiting in 4 of 10 runs (worst 18 % of its time), against 1 of 10 (7 %) with the old table. Players past level 17 no longer get the +10 steps at 17, 23 and 30, nor the higher refill cap. At 8–10 s there is no energy waiting.

## 2. Fixed rare-merge recipes

Build 48b lowered a tier-2 part to tier 1 for a player holding no Gear. That punished saving a part, and the target changed with the inventory. **48c removes the step-down.** Each mapped stage asks one fixed merged part, the same for everyone.

| Stage | Name | Cost | Rare part (replaces the second material) |
|---|---|---|---|
| ws-hoist 2 | Gear the hoist | 200 | mech 1 · **Gear** |
| obs-desk 2 | Unroll the old charts | 150 | notes 1 · **Expedition note** |
| obs-desk 3 | Read the last logbook | 170 | notes 2 · **Travel notebook** |
| obs-bench 2 | Fit the grinding wheel | 170 | mech 1 · **Gear** |
| hb-crane 3 | Recover the cargo | 260 | mech 2 · **Gear assembly** |
| hb-registry 3 | Trace the route | 300 | notes 2 · **Travel notebook** |

- **Removed from 48b's nine:** Chart the whole cliff (notes 1), Fit the pulley (mech 1) and Dry the records (notes 1). That keeps the selection small and avoids two rare stages in a row on one place.
- **Target shown up front.** The gold order shows the exact part from the moment it is on the board: icon, count, the chain to it, and "merge matching items to reach Gear assembly".
- **No circular unlock.**
  - Neither chain is on the beach, where the Rover reaches level 2.
  - No mapped stage gives the copy of the generator its part comes from.
  - Only if the chain cannot drop at all (never opened, or no level-2+ generator on the board) does the stage ask its usual materials. That happened **0 times in 160 runs**.
- **Old saves.** Orders already on the board are kept as they are. Delivered materials and built stages are untouched. New recipes apply to new orders.
- **Crew requests stay varied.** With the fixed recipes, single-Gear and single-note crew jobs repeated in 11 of 58 beach and worksite orders (the variety test's limit is 15 %).
  - Secondary requests now pass over a part one of the last four orders asked, when another exists.
  - Measured: 1 repeat in 63.
  - One crew order stays primary-only, as before.

## 3. The gold objective's guarantee

**Measured first.** Fixed recipes with only the ordinary guarantee (a drop certain by the 20th eligible tap in a row) let one rare-only pursuit run 57 min at 4 s, with 87 taps on one generator. The 4 s game rose from 211 to 241 min. So protection is needed.

**What it covers** (`game.mjs` `goldChase`, `SECONDARY_RULES[gen].goldPity = 8`):

- **When it applies.** The gold order on the board needs a rare part of a chain, and the parts held cannot make it once every other order's rare needs are set aside (parts never split). While that holds, that chain's drop is certain on the **8th eligible tap in a row** without one, instead of the 20th.
- **Eligible tap.** A successful, energy-spending tap on a level-2+ generator of that chain while its drops are not paused. A full board with four rare parts waiting for space pauses drops, so those taps count nothing and no reward is lost.
- **Unchanged:**
  - the 5 % chance;
  - the tap's own primary part;
  - the energy cost;
  - every other chain;
  - all times without such a gold order.
- **Saved and reload-proof.** The counters (`s.secTaps`, `s.secSince`) are saved, and the roll is the tap count hashed, so a reload replays the same outcome.
- **When it ends.** It ends by itself as soon as the parts held make the gold part, or the order is delivered.
- **The bound is in taps, not time.** A Gear assembly or Travel notebook (four drops) from nothing is made within **32 eligible taps** of that generator, plus three merges. A Gear or Expedition note (two drops) takes at most 16. How long that takes depends on the player's speed and energy; this is not a time guarantee.
- **Wording.** The gold panel says it as it is: "Tap a level 2+ Rivet Rover: while this order waits, a Bolt comes within every 8 taps".

**Tests** (`tests/v5-next-rare-merges.test.mjs`):
- the six fixed recipes and no downgrade for what is held or wanted elsewhere;
- the 8th-tap guarantee under four different roll seeds (never more than 8 taps a drop, 32 for the assembly);
- the ordinary 20 when no gold order needs the part;
- other orders' needs set aside;
- the end when the part can be made;
- reload replay;
- a full board with pending rare parts pausing drops;
- the end on delivery.

## 4. Coins and restoration pacing

**The 5.5-minute Chapter 2 materials-to-build delay** (10 s an action, median) is real: 5.6 min in 48b and 48c, 0.2 in 48a. That is the cost of gold paying ×1.3. Traced through the run (gold delivered → coins short → crew orders → build):

- **Usually a parallel gold order.** Across 10 seeds at 10 s, 57 of 85 Chapter 2 waits for coins had another stage's gold order on the board, so the player was making the next materials meanwhile.
- **The other 28 had nothing else to build.** Their median is 5.0 min, about one or two crew orders.
- **The long tail is at chapter bottlenecks.** Up to 20 min comes from the array and sea gate (the end of Chapter 2), the Vault door and the harbour warehouse. Example (seed 9, 10 s): the sea gate's materials came with 156 of 250 coins, and 20 min of crew orders followed with no other stage open.
- **The crew work in that time is not repetitive filler** in the order-variety sense: 1 repeat in 63, mixed and two-part jobs, every one with XP and energy.

**Not changed.** Prices and crew rewards are untouched, and gold stays ×1.3 after six stages.

**Do coins support choices?**
- Coins now make a real "earn, then build" step: one crew order per stage in Chapters 1–2 and two in Chapter 3. Chapter-end balances are low (36–96), so coins are spent rather than piled up.
- **They do not yet create meaningful choices.** The only other sink is the shop, which the scripted player used once (80 coins).
- At chapter bottlenecks, coins mostly add time.

**Proposal (needs approval, not built):** at a bottleneck where no other stage can be worked on, the last gold order pays the early ×1.5. That would trim the tail without touching any price.

## 5. Before and after (scripted player, 10 seeds, 4/5/8/10 s, with and without the shop)

- **Command:** `node tests/v5-next-coins-metrics.mjs 4,5,8,10 1..10 both --runs [goldpity=20]`, with `ROOT=` set to `git archive` trees of `b1d4125` (48a) and `08fee57` (48b).
- **Finishes:** all 80 runs finish in every build.
- **Rare-only pursuit** runs from the moment the gold order lacks only its rare part until its delivery.

#### Duration and waiting (no shop)
| Speed | Build | Whole game | Ch1 · Ch2 · Ch3 end | Runs with energy waiting · worst share | Longest gap between stages built (Ch1 · Ch2 · Ch3) |
|---|---|---|---|---|---|
| 4 s | 48a | 202.8 | 108.2 · 148.3 · 202.8 | 0/10 · 0 | 6.3 · 5.6 · 7.3 |
| 4 s | 48b | 214.1 | 114.3 · 159.9 · 214.1 | 4/10 · 0.06 | 7.1 · 11.8 · 9.1 |
| 4 s | 48c, no guarantee | 240.5 | 116.7 · 181.7 · 240.5 | 7/10 · 0.39 | 30.1 · 57.4 · 26.8 |
| 4 s | **48c** | 211.1 | 115.2 · 155.9 · 211.1 | 4/10 · 0.18 | 14 · 22 · 8.4 |
| 5 s | 48a | 250.1 | 135.2 · 185.2 · 250.1 | 0/10 · 0 | 8.5 · 7.2 · 9.1 |
| 5 s | 48b | 264.4 | 141.9 · 199 · 264.4 | 0/10 · 0 | 7.6 · 10.8 · 8.3 |
| 5 s | 48c, no guarantee | 282.8 | 146.7 · 206.5 · 282.8 | 6/10 · 0.1 | 17.2 · 19.1 · 26.6 |
| 5 s | **48c** | 262.5 | 144.4 · 195.4 · 262.5 | 1/10 · 0.06 | 12.7 · 18.6 · 9.5 |
| 8 s | 48a | 397.8 | 214 · 296.2 · 397.8 | 0/10 · 0 | 13.3 · 11.3 · 14.3 |
| 8 s | 48b | 426.7 | 230 · 321.6 · 426.7 | 0/10 · 0 | 13.4 · 14.3 · 15.4 |
| 8 s | 48c, no guarantee | 429.2 | 229.4 · 316.6 · 429.2 | 0/10 · 0 | 14.3 · 27.9 · 24.9 |
| 8 s | **48c** | 416.2 | 230.6 · 310.8 · 416.2 | 0/10 · 0 | 14.3 · 13.8 · 16.1 |
| 10 s | 48a | 500.5 | 271.2 · 372.6 · 500.5 | 0/10 · 0 | 16.3 · 16.4 · 15.8 |
| 10 s | 48b | 524.7 | 287.6 · 391.8 · 524.7 | 0/10 · 0 | 16.3 · 18.5 · 16.6 |
| 10 s | 48c, no guarantee | 543 | 291.1 · 401.5 · 543 | 0/10 · 0 | 19.5 · 26.6 · 25 |
| 10 s | **48c** | 524.7 | 290.7 · 396.8 · 524.7 | 0/10 · 0 | 19.5 · 25.7 · 19.8 |

#### Rare gold orders (no shop)
| Speed | Build | Tier-2 gold orders asked · completed (10 runs) | Rare-only pursuit, median · longest (min) | Most taps · energy on that generator in one pursuit | Fullest board during a pursuit | Fallbacks |
|---|---|---|---|---|---|---|
| 4 s | 48b | 0 · 0 | 1.8 · 7.4 | 39 · 39 | 30 of 49 | 0 |
| 4 s | 48c, no guarantee | 30 · 30 | 3.8 · 56.7 | 76 · 76 | 27 of 49 | 0 |
| 4 s | **48c** | 30 · 30 | 1.9 · 12.5 | 26 · 26 | 24 of 49 | 0 |
| 5 s | 48b | 0 · 0 | 2.1 · 9.7 | 39 · 39 | 30 of 49 | 0 |
| 5 s | 48c, no guarantee | 30 · 30 | 3.3 · 24.8 | 66 · 66 | 28 of 49 | 0 |
| 5 s | **48c** | 30 · 30 | 2.3 · 8.8 | 32 · 32 | 28 of 49 | 0 |
| 8 s | 48b | 0 · 0 | 2.8 · 13.1 | 45 · 45 | 31 of 49 | 0 |
| 8 s | 48c, no guarantee | 30 · 30 | 8.7 · 29.1 | 87 · 87 | 32 of 49 | 0 |
| 8 s | **48c** | 30 · 30 | 4.9 · 12.9 | 29 · 29 | 29 of 49 | 0 |
| 10 s | 48b | 0 · 0 | 4.1 · 13.7 | 40 · 40 | 30 of 49 | 0 |
| 10 s | 48c, no guarantee | 30 · 30 | 10.7 · 25.5 | 64 · 64 | 30 of 49 | 0 |
| 10 s | **48c** | 30 · 30 | 5.2 · 13.1 | 31 · 31 | 29 of 49 | 0 |

#### With the shop
| Speed | 48b whole game | 48c whole game | 48c shop spending (Ch1 · Ch2 · Ch3) | 48c rare pursuit longest |
|---|---|---|---|---|
| 4 s | 214.1 | 207 | 80 · 0 · 0 | 4.8 |
| 5 s | 264.4 | 263.3 | 0 · 0 · 0 | 8.8 |
| 8 s | 426.7 | 416.2 | 0 · 0 · 0 | 12.9 |
| 10 s | 524.7 | 524.7 | 0 · 0 · 0 | 13.1 |

#### Coins (no shop, median per chapter)
| Speed | Build | Gold covers cost (Ch1 · Ch2 · Ch3) | Crew orders per stage | Materials → build median (Ch2) · longest (Ch1 · Ch2 · Ch3) | Coins earned crew · gold (whole game) | Coins at chapter ends | Board median (Ch1 · Ch2 · Ch3) |
|---|---|---|---|---|---|---|---|
| 5 s | 48a | 70.6 · 64.5 · 34.5 % | 0 · 1 · 2 | 0.9 · 14.6 · 8.9 · 18.6 | 6395 · 8660 | 63 · 33 · 67 | 12 · 17 · 18 |
| 5 s | 48b | 61.8 · 52.2 · 29.4 % | 1 · 1 · 2 | 2.6 · 16.4 · 11 · 18.5 | 7600 · 7410 | 56 · 31 · 49 | 12 · 19 · 20 |
| 5 s | **48c** | 61.7 · 53 · 30.3 % | 1 · 1 · 2 | 1.9 · 20.3 · 19.7 · 20.4 | 7690 · 7480 | 96 · 36 · 39 | 12 · 18 · 20 |
| 10 s | 48a | 70.6 · 67.3 · 34.5 % | 0 · 0 · 2 | 0.2 · 31.7 · 22.5 · 34.7 | 6230 · 8745 | 49 · 66 · 84 | 12 · 16 · 16 |
| 10 s | 48b | 61.4 · 50.5 · 29.4 % | 1 · 1 · 2 | 5.6 · 32.9 · 19.5 · 36 | 7620 · 7330 | 41 · 86 · 64 | 13 · 17 · 20 |
| 10 s | **48c** | 61.6 · 53 · 30.3 % | 0 · 1 · 2 | 5.6 · 33.9 · 20 · 38.2 | 7605 · 7470 | 59 · 93 · 54 | 12 · 17 · 20 |


- **Energy waiting at 4 s.**
  - The worst share rose from 6 % (48b) to 18 % (48c, seed 3). The ablation (`capold=1`, old capacity table) puts it back to 7 %, so it comes from the capacity cap, not the recipes.
  - In seed 3, the Travel notebook's materials came in with 99 of 170 coins and the energy ran out a minute later. That stage was built 19 min after. This is the run with the 22-min Chapter 2 gap.
- **Longest gaps between stages built.** They grew in Chapter 2 at 4–5 s (48b 11–12 min → 48c 19–22) and at 10 s (18.5 → 25.7). Without the guarantee, it would be 57 min at 4 s.
- **Shop.** The scripted player bought once (80 coins at 4 s); with and without the shop are nearly identical. The shop's effect on pacing is not measured by this policy.

## 6. Vault reveal fix on PR #85

`cbf0c17` on `claude/v5-chapter3-harbour` ports only:
- the reveal re-entry guard (`nextReveal`);
- its Chapter 2 regression check.

No economy or rare-order change went with it. PR #86 merged that branch head (`bb26e97`, keeping its identical fix). Locally, on PR #85's tree: unit tests 355 pass; the Chapter 2, Chapter 3, story and bright browser suites pass in Chromium. CI was dispatched on the branch.

## 7. Chapter 3 visual consistency

The real assets were inspected (both maps, the 21 cut-outs, the four panels), and the coast screen was rendered with all seven places at no stages, mid-chapter, every stage but the launch, and after the launch.

| Issue | State in 48c |
|---|---|
| Boatyard after the launch looked unbuilt (its card fell back to the stage-1 cut-out) | **Fixed.** The card is the finished yard from the restored map: canopy, lanterns, tools, the cradles empty because the boat sailed (`place-hb-boatyard-launched.webp`, `tools/harbour-art.py --launched`). This is a vignette of the director's restored concept, not a dedicated cut-out. Browser-tested. |
| Signal light colour | **Consistent.** Sea-green in the restored map, stage 2 and 3 cut-outs and the signal panel; the stage-1 lamp is unlit, as in the damaged map. |
| Boat after the launch | **Consistent.** It is at the departure dock only (restored map and launch panel); the yard is empty. |
| Damaged harbour shows a working crane and departure dock | **Art missing.** The damaged concept paints both intact; only dimming separates them. |
| Arrival panel looks restored | **Temporary.** A sea mist over the restored harbour (build 48a); not finished art. |
| Boat design before the launch | **Art missing.** The map's slip shows the damaged painting's sail-less hull at every boatyard stage, including "Rig the sail", while the stage-3 card has a sail. The cut-outs give the boat a white hull; the restored map and launch panel give it a navy hull. |

**Asset brief (for the director's artist).** Same isometric view, scale and palette as the masters in `docs/art-source/hidden-harbour-2026-11-01/`:

1. **Damaged crane** for the before map at its spot (map px about 90–330 × 470–720): collapsed jib, rope off its drum, broken pulley, no cargo cage. Stages 1–3 (mast → pulley → chest) must read as restoring it.
2. **Damaged departure dock** for the before map (about 680–1024 × 860–1195): missing planks, fallen bollards, no lanterns.
3. **Boat on the slip, three states** matching the restored map's boat (navy hull, ivory sail with a coral band), each a before-map layer at the slip (about 640–860 × 560–700):
   - a bare damaged hull (before "Repair the hull");
   - a repaired hull with no mast;
   - the rigged boat with its sail ("Rig the sail").

   The boatyard cut-outs 2–3 and the departure stage-3 cut-out need the same navy hull.
4. **Damaged arrival panel**, 768 × 512, same composition as `story-arrival`: the harbour behind the arch storm-damaged (broken quay, wreckage, no lit lamps), replacing the mist.
5. **Optional: a dedicated post-launch boatyard cut-out** on the 360 px canvas (ground at 90 %), to replace the map vignette.

# Build 48b

## 1. Root causes

1. **Coins had no job in Chapters 1–2.**
   - A gold order paid 1.5× its parts' worth.
   - At 5 s, gold covered 70.6 % of Chapter 1's stage costs and 64.5 % of Chapter 2's.
   - The median Chapter 1 stage needed **0** crew orders. When the materials came in, the coins were already there in 82 % of cases (about 260–320 in hand).
   - So crew-order coins piled up, and restoration never asked for them.
2. **Secondary requests were mostly single basic parts.**
   - Requests were built from unused units, with a goal of one drop away.
   - So about 85 % asked a tier-0 Bolt or Note fragment: mech0 ≈ 21, notes0 ≈ 23 per game, against mech1 ≈ 3, notes1 ≈ 4.
3. **Craftability counted parts that cannot be used.**
   - A higher part counted toward a lower request, but parts never split.
   - Parts already promised to another order were counted twice.
4. **The keepsake paused drops for good.** A top-tier part counted 8 units against `hold: 4`, so a player who kept one never got another rare extra.
5. **Gold orders never asked a merged rare part.** Rare merges had no part in restoration.

## 2. Changes

### Coins (`v5/next/game.mjs`)

| | Before | After |
|---|---|---|
| Gold pay, first six stages (`GOLD_PAY.early`) | ×1.5 | ×1.5 |
| Gold pay, later stages | ×1.5 | **×1.3** |

- Prices, crew rewards and every other source are unchanged. The gold-order reward itself is cut (×1.5 → ×1.3 after six stages): the PR text's "no reward is cut" was wrong.
- **×1.0 was rejected.** It was measured first: the 4 s player took 90 % longer (203 → 385 min), and energy waiting came back.
- **The first session keeps its pace.** The ×1.5 rate stays for the harder start's six stages.

### Secondary requests (`secondaryNeed`, `secondaryFree`, `secondaryDropsIn`, `secondaryReach`)

- **Intro once per family.** The intro order comes once per chain, kept in the save (`secIntro`). Nothing else is asked from that chain until it is done.
- **Then merged parts, gradually:**
  - tier 1 after the first stage built;
  - tier 2 after the third stage, once the chain's tier 1 has been found.
- **What is asked, in order:**
  1. a merged part the player can already deliver (0 drops away);
  2. otherwise a merged goal within `SECONDARY_ORDERS.goal = 2` drops;
  3. otherwise a basic part, or a basic goal.
- **Craftability is real:**
  - free parts are tier counts minus every other order's needs;
  - an exact part counts first, then pairs from the tier below;
  - a part never splits.
- **One crew order stays primary-only.** At least one everyday order on the board asks no rare part.
- **The keepsake no longer counts.** A top-tier part is not counted as "unused", so it can never pause drops.
- **Gold demand counts in the drop-rest guard.** Drops do not rest while a gold order waits on a rare part.

### Gold orders that ask a merged part (`v5/next/areas.mjs` `rare`, `makeOrder`)

- **One swap, not an extra part.** The rare part replaces the stage's **second** material, so the requirement count stays the same.
- **Only when the chain can drop.** The swap happens only when the chain's level-2+ generator is on the board. Otherwise the stage keeps its usual materials.
- **Bounded.** The part asked is at most two drops from the free parts the player holds. A tier-2 part steps down to tier 1 until a tier-1 part is in hand.
  - Each drop is certain by the generator's 20th tap (pity), and the tap still gives its usual part.
  - **Expected:** 12.8 taps per drop, so 25.7 taps for any rare gold part.
  - **Worst case:** 40 taps for any rare gold part, plus one merge per tier.
- **Saves are safe:**
  - Orders already on the board are never replaced on load; new recipes apply only to new orders (tested).
  - Completed stages and credits are kept.
  - No new state fields.

### One flow (`v5/next/app.mjs`, `coastal.css`)

The flow runs craft → deliver → spend → restore.

**Compact gold panel.** It replaces the old help text.
- **Shows:**
  - the stage's name;
  - the place, with "materials, then 🪙N to build";
  - each item's icon with held/needed counts;
  - "Tap {producer} · merge matching items to reach {item}";
  - a 44 px **Show** button that highlights the producer.
- **Cost line:**
  - when short: "🪙X of Y: **N more** from crew orders";
  - otherwise: "you have it".
- **The full chain** sits behind a 44 px "How to make these".
- **A locked chain** shows its real requirement, e.g. "Opens when a Rivet Rover reaches level 2", or sealed in cargo, or a later area.
- **Removed:** "merge up N times" and "the gold order stays".

**Show.** It outlines the strongest copy of the producer, scrolls to it and says "{producer} (level N): tap it for parts".
- It clears after 2.6 s.
- It pulses three times, and stays still with reduced motion.

**Delivery.** Delivering the gold order shows a short "Materials secured · {stage}" note that never blocks the board.
- When the coins are in hand, it says "Build · N coins: tap the strip under the orders".
- When they are short, it says "N more coins to build it: deliver crew orders".

**The strip.** It updates immediately.
- It now names the stage whose materials are in, ahead of the next gold order's place. Before, it jumped to "3 parts missing" for the next place right after a delivery.
- It shows "Ready to build · Build", or "✓ Materials · N more 🪙".

**Selecting a part.** Selecting a rare part the gold order needs, as it is or merged up, says "Needed for {place}: merge matching items to reach {item}".

### Build and pages

- Build string set to `Build 48b · rare merges and restoration`.
- `play.html` assets bumped to `?build=48b`.
- `v5/coast-crazygames.html` regenerated with `tools/coast-crazygames.mjs`.

## 3. Gold mapping (`areas.mjs`, `rare: [chain, tier]`). Superseded by build 48c's six fixed recipes above.

| Stage | Name | Cost | Usual materials | Rare part (replaces the 2nd material) |
|---|---|---|---|---|
| ws-scope 3 | Chart the whole cliff | 140 | newest-generator pair | notes 1 · Expedition note |
| ws-hoist 2 | Gear the hoist | 200 | newest-generator pair | mech 1 · Gear |
| obs-desk 2 | Unroll the old charts | 150 | newest-generator pair | notes 1 · Expedition note |
| obs-desk 3 | Read the last logbook | 170 | newest-generator pair | notes 2 · Travel notebook (tier 1 until a tier 1 is held) |
| obs-bench 2 | Fit the grinding wheel | 170 | newest-generator pair | mech 1 · Gear |
| hb-crane 2 | Fit the pulley | 230 | rope 3 + rig 3 | mech 1 · Gear |
| hb-crane 3 | Recover the cargo | 260 | rope 4 + rig 3 | mech 2 · Gear assembly (tier 1 until a tier 1 is held) |
| hb-registry 2 | Dry the records | 270 | lamp 3 + chart 3 | notes 1 · Expedition note |
| hb-registry 3 | Trace the route | 300 | chart 4 + optic 3 | notes 2 · Travel notebook (tier 1 until a tier 1 is held) |

**Rules** (all tested):
- **Where:** the beach asks none, since that is where the Rover reaches level 2.
- **Tiers:** 1–2 only, never the keepsake.
- **Not circular:** a stage's reward is never a copy of the generator its rare part comes from.
- **Chains:** both are open by then: Rivet Rover → mech, Survey Kite → notes.

## 4. Before and after

**How it was measured:**
- `node tests/v5-next-coins-metrics.mjs 4,5,8,10 1..10 both`, run in this tree and with `ROOT=` set to a `git archive` of `b1d4125`.
- The scripted player (`tests/v5-next-policy.mjs`) plays Chapters 1–3, 10 seeds per speed.
- 80 of 80 runs finish on both builds.
- The shop changed almost nothing: the policy spent 80 coins in one setting. So only the no-shop rows are shown.

### Duration (median minutes) and waiting

| Speed | Whole game | Ch1 end | Ch2 end | Ch3 end | Wait share | Rare gold order on board (median · max) |
|---|---|---|---|---|---|---|
| 4 s | 202.8 → 214.1 (+5.6 %) | 108.2 → 114.3 | 148.3 → 159.9 | 202.8 → 214.1 | 0 → 0 | 2.3 · 8.0 min |
| 5 s | 250.1 → 264.4 (+5.7 %) | 135.2 → 141.9 | 185.2 → 199.0 | 250.1 → 264.4 | 0 → 0 | 2.9 · 10.3 min |
| 8 s | 397.8 → 426.7 (+7.3 %) | 214.0 → 230.0 | 296.2 → 321.6 | 397.8 → 426.7 | 0 → 0 | 3.7 · 13.1 min |
| 10 s | 500.5 → 524.7 (+4.8 %) | 271.2 → 287.6 | 372.6 → 391.8 | 500.5 → 524.7 | 0 → 0 | 4.7 · 14.5 min |

- **Rare-only waiting** (energy in hand, the gold order lacks only rare parts): **0 min** in every setting.
- **The bound was needed.** Without it, "Recover the cargo" stood 18–76 min at 4 s in energy-starved seeds (wait share 0.27–0.31), and the 4 s game took 240.9 min. With it, the worst rare gold order stands 8 min at 4 s.

### Coins at milestones (5 s, median)

| | Ch1 before → after | Ch2 before → after | Ch3 before → after |
|---|---|---|---|
| Gold covers stage cost | 70.6 % → 61.8 % | 64.5 % → 52.2 % | 34.5 % → 29.4 % |
| Stages short of coins when materials arrive | 18 % → 33 % | 44 % → 56 % | 86 % → 86 % |
| Crew orders per stage | 0 → 1 | 1 → 1 | 2 → 2 |
| Coins in hand when materials arrive | 267 → 199 | 206 → 164 | 183 → 162 |
| Materials → build wait | 0.1 → 0.1 min | 0.9 → 2.6 min | 3.5 → 3.3 min |
| Crew-order coins earned | 1,835 → 2,475 | 1,000 → 1,360 | 3,560 → 3,765 |
| Gold-order coins earned | 4,880 → 4,270 | 1,915 → 1,550 | 1,865 → 1,590 |
| Board occupancy (median cells) | 12 → 12 | 17 → 19 | 18 → 20 |

- Chapter 3 was already crew-funded, and the change barely touches it.
- At 8–10 s, the Chapter 2 wait from materials to build is about 5.5 min. That time is spent delivering crew orders, not waiting: the wait share stays 0.

### Secondary parts asked per game (5 s, crew orders)

| | mech0 | notes0 | mech1 | notes1 | mech2 | notes2 |
|---|---|---|---|---|---|---|
| Before | 21.1 | 23.3 | 3.0 | 4.4 | 2.3 | 1.0 |
| After | 6.5 | 5.2 | 18.1 | 18.3 | 1.8 | 0.2 |

- **Gold orders** now ask notes1 ×5 and mech1 ×4 per game; before, they asked none.
- **No tier-2 gold parts in these runs.** The scripted player does not keep a spare tier-1 part, so tier-2 gold parts step down. A player holding a Gear gets the Gear assembly.

## 5. Tests

**Unit and simulation** (`node --test tests/v5-*.test.mjs`): **365 pass, 0 fail**.
- New: `tests/v5-next-rare-merges.test.mjs`, 11 tests:
  - the intro once, kept in the save;
  - merged requests;
  - no splitting, and commitments counted;
  - the keepsake and the gold-demand guard;
  - the nine-stage mapping;
  - the gold swap only when the chain can drop;
  - the tier-2 bound;
  - gold pay rates;
  - delivery → materials → build waits for coins;
  - a full board;
  - old saves keep their active orders.
- Updated: `tests/v5-next-secondary.test.mjs` (demand, keepsake, gold rare only at mapped stages, tier at most the mapped one).

**Browser, new:** `tests/v5-next-rare-merges-browser.cjs`.
- **Viewports:** 360×780, 390×844 (with and without reduced motion), 430×932 and 907×510, touch.
- **Signal mast camp:** level 8, the signal mast objective, 540 coins, a level-2 Rivet Rover and Survey Kite (both chains open). It checks:
  - the panel: stage, place, icons, 1/1 and 1/2, the merge line, "you have it", no "merge up" or "stays";
  - the 44 px Show and How buttons;
  - the chain unfolding;
  - the producer outline (still with reduced motion) and its message, then clearing;
  - no "Needed for" when the gold order asks no rare part;
  - delivery → the strip turns Ready/Build at once, and "Materials secured … Build · 100 coins", with no dialog;
  - the strip → coast screen → Build;
  - paid once, also after a reload.
- **Gear the hoist camp** (40 coins). It checks:
  - "Needed for Gear the hoist: merge matching items to reach Gear";
  - "40 of 200: 160 more" in the panel;
  - two Bolts merged by drag;
  - delivery → "95 more coins to build it: deliver crew orders", and the strip "Materials · 95 more".
- **Everywhere:** no sideways scroll and no page errors.

**Browser, existing, Chromium** (all pass):
- `v5-next-browser`, `v5-next-playtest-browser` (Chromium portion), `bright`, `crazygames`, `home`, `story`, `rewards`, `saves`, `extras`, `energy`, `chapter3`, `chapter2`, `v5-coast-map-browser`.
- `v5-next-browser`'s "the gold order stays" now checks only that the gold order has no change/swap button, since the panel has Show buttons by design.

**Screenshots** (`SHOTS=<dir>`): the panel, the panel open, the producer highlight, materials secured, the coast build, "Needed for" and coins short, at each viewport.

## 6. Pre-existing and environment issues (not caused by this change)

1. **WebKit is not installed in this session.** Downloads are blocked, so WebKit runs only in CI. `v5-next-browser` and `v5-next-playtest-browser` ignore `ENGINES` and exit 1 locally when they reach WebKit, after every Chromium case passes.
2. **WebKit Chapter 2** (`tests/v5-next-chapter2-browser.cjs:60`) failed intermittently in CI, on the base too. **This was a real game bug, fixed here.**
   - **Cause:** the inner ring's stage started the Vault reveal, and its story callback queued `nextReveal()` again 900 ms later. The reveal is marked seen only when it ends, so the second call restarted it.
   - **Effect:** a player who tapped Next within 0.9 s was sent back to the first scene.
   - **Reproduced in Chromium:** the story started twice without a click.
   - **Fix:** `nextReveal` now plays one reveal at a time; a second call waits and its callback runs when the chain ends.
   - **Regression check:** the Chapter 2 suite now asserts the Vault opening starts once. It fails on the old code and passes now.
3. **Fresh coastal journey (WebKit)** finds sideways scroll on Classic V5 (`/v5/`) at 360 px. It is red on the base too, and this PR changes none of the files that page loads.

## 7. Limits

- **The scripted player is a proxy.** It never keeps a spare Gear, so tier-2 gold parts were not exercised in the simulations; unit tests cover them.
- **Playtest needed.** A person should play Chapter 2 at 8–10 s to judge the materials-to-build waits of about 5 min.
- **The "Materials secured" note sits over the top of the HUD** for about 2.5 s on phones. It is the existing moment note.
