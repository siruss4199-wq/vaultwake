# Coast Camp: rare merges and restoration (build 48b, 2026-11-01)

Branch `claude/v5-rare-merges-restoration`, from `claude/v5-chapter3-harbour` at `b1d4125` (build 48a: Chapter 3, the level-2 secondary unlocks and the energy pass). Draft, not for merge.

- **Unchanged:** V4, `v5/lab/`, Classic V5 (`v5/core.mjs`, `v5/app.mjs`, `v5/energy.mjs`), PR #75, the save keys and the state shape.
- **Not added:** no new currency, generator, order type or chapter. The Winch, Shell and Kiln secondary chains stay off.

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

- Prices, crew rewards and every other source are unchanged.
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

## 3. Gold mapping (`areas.mjs`, `rare: [chain, tier]`)

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
