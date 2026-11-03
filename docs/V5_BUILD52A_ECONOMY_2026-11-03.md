# Coast Camp Build 52A: economy and reward rebalance (2026-11-03)

Branch `claude/v5-build52a-economy`, from `0604f5c` (PR #91's head, Build 51d). Build 51d is kept as it was:
- the one-time guide, the pointing hand and the compact gold order panel;
- the Chapter 1 gold recipe variety.

No chapter, generator, currency, art, save key or dependency was added. Classic V5 and `v5/kits.mjs` are unchanged.

**Levels:** a displayed Level is the internal tier + 1 (`displayLevel`). Level 1 is tier 0, so a Bolt is a Level 1
rare part, a Gear Level 2 and a Gear assembly Level 3.

## What changed (`v5/next/game.mjs`, one crate line in `v5/next/app.mjs`)
1. **Rare demand.**
   - After a chain's one introductory Level 1 order, crew orders never ask a Level 1 rare part again. A Level 1
     part held is asked as the Level 2 it merges into, now if two are held, else as a goal one drop away.
   - From Chapter 2 on, a merge goal may be up to 3 drops away (Chapter 1: 2), so Level 3 is asked too.
   - Rare parts pay by level: 10 / 35 / 70 coins (were 10 / 25 / 45). A merged-rare-only order gives the crew's
     +1 energy like other crew orders; a Level 1 rare-only order still gives none.
   - A difficult rare gold goal (Level 3) never follows a rare gold order while another place is open, in every
     chapter. This covers both the `rare` stages and Chapters 4–6's own recipes. Chapter 1 keeps its rule for
     every rare goal.
   - No recipe was changed; only which open place comes next.
2. **Crates (Coast Camp only, `CRATE_DROPS`).** Worth is counted in Copper offcuts (tier t = 2^t).

   | Crate | 51d contents | 52A contents |
   |---|---|---|
   | Driftwood crate | Lv1–2, worth 4 | Lv1–2, worth 5 |
   | Sea chest | Lv1–2, worth 8 | Lv2–3, worth 12 |
   | Captain's trunk | Lv2–3, worth 18 | Lv2–4, worth 22, plus a Level 1 rare part of its generator's chain as the last part |

   - The trunk's rare part is given only once that rare chain is open and not resting; otherwise it is a Lv3 part.
   - Merging still pays: two Driftwood crates (10) make a Sea chest (12); two Sea chests make a trunk with fewer,
     better parts and a rare drop.
   - Each size keeps its number of parts, so saved crates, opened or not, stay valid.
   - A crate's description now gives its levels.
3. **Clear.**
   - Levels 1–3 and every rare part give no energy back (51d: +1 for any everyday part).
   - An everyday part of Level 4 or more gives +1, never more. The button shows "+1 ϟ" only then.
   - Confirmation is unchanged: wanted, merged and rare parts need a second tap.
   - Tapping and clearing never makes energy (tested).
4. **Gold and crew coins.**
   - Gold orders pay their parts' worth × 1.5 for the first stage (the guide's path still pays 70), × 0.9 for
     stages 2–4 and × 1.1 after (51d: 1.5 for six, then 1.3). The first commit used 0.9 to stage 6 and 1.0 after;
     see "Final balance" below.
   - Crew orders pay 15 % more (quick × 1.15, two-part × 1.32).
   - Shop prices are unchanged.

## Before / after (scripted player, 10 seeds per speed, shop on; medians)
Tools:
- `tests/v5-next-economy52-metrics.mjs` (new; fixed rare drops);
- `tests/v5-next-coins-metrics.mjs` (each seed's own rare drops).

Run each with `ROOT=<51d tree>` for 51d.

| At 4 / 5 / 8 / 10 s per action | 51d | 52A |
|---|---|---|
| Level 1 rare asks after the introduction, a game | 26 / 45 / 34 / 37 | **0** |
| Crew rare asks, Level 2 / Level 3 | 67 / 5 · 68 / 6 · 67 / 4 · 67 / 6 | 52 / 25 · 53 / 26 · 60 / 31 · 74 / 24 |
| Gold rare asks, Level 2 / Level 3 | 13 / 9 | 13 / 9 (unchanged recipes) |
| Rare crew order to delivery, Level 3 (min) | 0.1 / 1.2 / 10.3 / 0.3 | 4.0 / 4.4 / 2.9 / 7.9 |
| Rare gold order to delivery, median / max (min, coins metrics) | 1.9–4.5 / 6.3–18.1 | 1.5–3.5 / 5.5–12.4 |
| Captain's trunk, coins per part | 7.5 | 11.7 |
| Clear refunds (policy clears only on a full board) | 0 | 0 |
| Energy spent (taps) | 2468–2534 | 2281–2349 |
| Waiting for energy (idle / starving, min) | 0 / ≤ 0.5 | 0 / 0 |
| Gold's share of coins, first six stages | 98.5 % (1 crew order) | **77 % (4 crew orders)** |
| Gold's share of coins, whole game | 44–45 % | **35–36 %** |
| Chapter 1 gold coins against stage costs (coins metrics) | 56 % | 43–44 % |
| Stages held up by coins when the materials come in (Chapter 1) | 31–38 % | 51–53 % |
| Median wait, materials to build (Chapter 1, min) | 0.1–0.2 | 2.2 / 2.8 / 4.7 / 5.6 |
| Coins left after a build (median) | 61–76 | 48–69 |
| Restorations in the first 15 minutes | 5 / 4 / 3 / 2 | 4 / 3 / 3 / 2 |
| Chapter 1 minutes (coins metrics) | 118 / 148 / 239 / 300 | 120 / 149 / 233 / 301 |
| Whole game minutes (coins metrics) | 357 / 445 / 714 / 881 | 359 / 434 / 692 / 872 |
| Whole game minutes (probe) | 369 / 460 / 739 / 935 | 339 / 432 / 700 / 856 |
| Board median (probe) | 18–20 | 20–24 |
| Full-board deadlock samples | 0 | 0 |
| Runs finished | 80 / 80 | 80 / 80 |

### Tuning notes
- **Early gold rate (stages 2–6):**
  - 0.8 left the 10 s player one restoration in the first 15 minutes (the floor is 2).
  - 1.0 for all of the first six stages left the 8 s player two (the floor is 3).
  - Paying the first three stages more brought gold back to 98 % of the opening coins.
- **The trade-off we kept:** every split that brings 3–4 crew orders into the first six stages puts the Survey Kite
  about 1.5 minutes later at 4 s (16.0 against 14.4 min). Crew pay does not move it.
  `tests/v5-next-economy.test.mjs` now allows 4.25 min per s/action (was 4).
- **Rejected crate set:** a trunk of Lv3–4 throughout filled the board to 26–31. The chosen set keeps it at 20–24.
- **Rejected early rare goal:** an early Level 2 rare gold goal (path 3) was measured in Build 51d and not kept: it
  walled the first session.

## Tests
- **`tests/v5-next-build52a.test.mjs`** (8):
  - displayed levels and rare prices;
  - whole-game runs: no Level 1 ask after the introduction, Level 2 and 3 asked in crew and gold orders, never two
    difficult rare gold orders in a row;
  - a held Level 1 rare part is asked as Level 2;
  - the Level 3 ordering rule in Chapter 4, with the player's choice and a single open place;
  - crates: sizes, worth, the rare part's conditions, parts always of the crate's chain, a saved, partly opened
    trunk;
  - Clear refunds and no tap-and-clear energy;
  - gold and crew pay, the first gold order's 70 coins, the first-six and whole-game shares;
  - saved orders keep their coins and parts.
- **Updated for the new rules:**
  - `v5-next-energy` (delivery energy);
  - `v5-next-rare-merges` (no Level 1 ask; gold rates);
  - `v5-next-secondary` (Clear; turns; prices);
  - `v5-next-economy` (the Kite bound above);
  - `v5-next-guide-browser.cjs` (a Level 1 part's Clear gives no energy).

## Saves
- No new key or field.
- Orders already on the board keep their parts and coins. A saved Level 1 rare order can still be delivered.
- Saved crates keep their size and parts left.
- `rareLast` already existed (51b).

## Risks
- **Stages now wait for crew coins.** A stage often waits for crew coins after its materials come in (median
  2–6 min). This is intended (crew orders matter), but it is the main change in feel and needs a human playtest.
- **The Survey Kite comes later:** about 10 % later in the opening (see above).
- **Level 3 crew orders take longer:** up to a median 8 min at 10 s, against 0.1–10 before; their drops are still
  guaranteed (pity).
- **No real players:** these are a scripted player's numbers, not proof of fun.

## Final balance (52A QA pass)

### Early-game coin waiting
The first commit's coin waits were measured with `tests/v5-next-coins-metrics.mjs` (4/5/8/10 s, 10 seeds), and
small changes to the existing gold rates were compared against it. Two tuning switches (`earlyrate=`, `crewpay=`,
`early=`) were added to the tool for this.

| Variant | Ch1 wait, materials → build (min) | Ch1 stages short of coins | Gold share of the first six stages (crew orders) | First 15 min restorations |
|---|---|---|---|---|
| 51d | 0.1 / 0.1 / 0.2 / 0.2 | 31–38 % | 98.5 % (1) | 5 / 4 / 3 / 2 |
| 52A first commit (0.9 to stage 6, then 1.0) | 2.2 / 2.8 / 4.7 / 5.6 | 51–53 % | 77 % (4) | 4 / 3 / 3 / 2 |
| later stages × 1.1 | 1.9 / 2.5 / 4.2 / 5.1 | 49–51 % | 77 % (4) | 4 / 3 / 3 / 2 |
| crew × 1.1 more | 2.0 / 2.5 / 3.3 / 4.9 | 49–58 % | — | — |
| stages 2–6 × 1.0, later × 1.1 | 0.9 / 1.1 / 1.4 / 1.8 | 44 % | **94 % (2)**: rejected | 5 / 4 / 3 / 2 |
| **chosen: stages 2–4 × 0.9, from stage 5 × 1.1** | **1.7 / 2.5 / 4.1 / 4.2** | **49–51 %** | **77 % (4)** | **4 / 3 / 3 / 2** |

- **The chosen setting keeps the opening's crew orders.**
  - Gold's share of the game's coins is 38–39 %, against 51d's 44–45 %.
  - Whole game (probe): 340 / 429 / 668 / 857 min, against 51d's 369 / 460 / 739 / 935.
  - Coins left after a build: 47–64.
- **No energy cost:** energy waiting is still 0 and there are no full-board deadlocks.
- **The Survey Kite is still one minute later at 4 s** (16.0 min). Stage costs were not changed.

### Rare gold orders
Gold recipes are unchanged. When they are first met (medians over 10 seeds, 4 / 5 / 8 / 10 s):

| | 51d | 52A |
|---|---|---|
| First Level 2 rare gold order: the cargo crane (beach pier 2, a Gear), Chapter 1 | 32 / 41 / 67 / 83 min | 31 / 39 / 62 / 78 min |
| First Level 3 rare gold order: Chart the whole cliff (worksite scope 3, a Travel notebook), Chapter 1 | 66 / 86 / 144 / 170 min | 65 / 85 / 136 / 169 min |

- **Always achievable:** in every run, every rare gold order appeared with its chain able to drop (a level-2+
  generator on the board), and no rare stage fell back to its usual materials.
- **Order rule holds:** never two difficult ones in a row (tested).
- **Rare parts show up earlier in crew orders:** in Build 52A, rare parts appear first in crew orders (Level 2 from
  the first stage, Level 3 from Chapter 2), well before the first rare gold order.
- **Recipes kept as they are:** no measured problem called for rewriting a story recipe.

### Help
The Help dialog (`v5/play.html`, and the generated `v5/coast-crazygames.html`) now says:
- gold orders bring the materials and some coins, and most of a stage's coins come from crew orders;
- after the first one, crew orders ask merged extras (Lv2, later Lv3), and a merged extra alone gives the crew's
  +1 ϟ;
- Clear gives no energy for Lv1–3 or rare parts, and +1 ϟ from Lv4;
- crates hold better parts as they grow: driftwood Lv1–2, sea chest Lv2–3, captain's trunk Lv2–4 and a rare extra.

## Player feedback (Build 52A2)
Two reports from play:
- **Coins too easy:** a gold-first player progressed without needing crew orders.
- **The first rare gold order came too late:** it appeared only after the Survey Kite.

No new system, currency, generator or save field.

### What changed
| File | Change |
|---|---|
| `v5/next/game.mjs` | Gold orders made while 2-5 stages are built pay 0.6 of their parts' worth (`GOLD_PAY.mid` 6, `midRate` 0.6). The first stage (1.5, the guide's 70) and the second (0.9) are unchanged, and so is the rate from 6 stages on (1.1). |
| `v5/next/areas.mjs` | The path's lanterns (beach path stage 3) name a Gear (`rare: ['mech', 1]`), using the existing 48c rule: it is asked only when a Level 2+ Rover is out, otherwise the usual materials. Its first line now mentions geared lanterns. |
| `v5/play.html` (+ the generated CrazyGames page) | Help says some stages ask a merged extra (the first, a Gear for the lanterns) and that it comes within 8 taps while missing (the existing goldPity). |
| `v5/next/app.mjs` | Build label 52A2. |

### Root causes
1. **The next gold order pays for the stage waiting for coins.**
   - A gold order is priced when it is made, one stage ahead.
   - In the opening it pays about the stage's whole cost: for example, the lanterns' gold order paid 90-120 against a cost of 100.
   - Its coins came in while the previous stage waited for coins. A gold-first player was therefore always one gold order ahead and never short.
2. **The crew orders a gold-first player delivered early were the guide's three, plus leftovers.**
   - Over the first six stages, those orders were 21-23 % of their coins (scripted gold-first player: `tests/v5-next-goldfirst-policy.mjs`).
3. **The first Level 2 rare gold order was the pier's crane.**
   - That is stage 11-13, 30-80 minutes in, always after the Kite (stage 5).
   - No stage between Rover Level 2 (the boardwalk's copy) and Level 3 asked a rare part.

### Gold-first player, before (52A) and after (52A2)
Fresh camps, no shop, Chapter 1. Medians over 10 seeds at 4 / 5 / 8 / 10 s per action, from `tests/v5-next-goldfirst-metrics.mjs` (`ROOT=` for 52A).

Two gold-first players were measured:
- **strict:** delivers crew orders only when coins are short or the board is nearly full;
- **opportunist:** also delivers a crew order whose parts happen to be on the board, keeping the gold order's parts.

| | 52A | 52A2 |
|---|---|---|
| Crew orders' share of coins, first six stages: strict | 21.5 % (4 orders) | 26.6 % |
| The same, opportunist | 22.9 % (7) | 26.7 / 26.7 / 30.4 / 30.4 % (7-8) |
| Crew orders' share of coins, Chapter 1 | 46-51 % | 47-52 % |
| Stages short of coins when their materials come in, Chapter 1 | 40-60 % | 47-69 % |
| Median wait, materials to build, Chapter 1 (min) | 0-6.0 | 1.7-7.4 |
| Chapter 1 (min): strict | 110 / 140 / 226 / 283 | 117 / 146 / 224 / 296 |
| Chapter 1 (min): opportunist | 183* / 146 / 234 / 296 | 116 / 142 / 246 / 302 |
| Energy starvation (min) | *68 at 4 s (the opportunist; one seed 40 min) | 0-0.1 |
| First rare gold order (min) | 31-84 (the pier's crane), after the Kite | 5.5-14.9 (the lanterns' Gear), before the Kite in every run |
| Survey Kite (min) | 12.8-37.6 | 13.3-38.1 |

From a saved camp (played normally to 10 stages, then gold-first): Chapter 1 crew share 48-51 % (52A: 47-49 %), no starvation.

### Ordinary scripted player
Shop on, 10 seeds; `tests/v5-next-economy52-metrics.mjs` and `tests/v5-next-economy-sim.mjs`.

| | 52A | 52A2 |
|---|---|---|
| Gold's share, first six stages | 77 % (4 crew orders) | 68 % (4) |
| Gold's share, whole game | 38 % | 38 % |
| First Level 2 rare gold order (min) | 31 / 39 / 62 / 78 (crane) | **6.7 / 8.4 / 13.5 / 16.9 (lanterns)** |
| First Level 3 rare gold order (min) | 65 / 85 / 136 / 169 | 69 / 87 / 142 / 177 |
| Survey Kite, latest of the seeds (min; guard 4.25 × s/action) | 16.0 / 20.0 / 32.0 / 40.0 | 16.6 / 20.7 / 33.2 / 41.5 |
| Restorations in the first 15 minutes (lowest seed) | 4 / 3 / 3 / 2 | 4 / 3 / 3 / 2 |
| Whole game (min) | 340 / 429 / 668 / 857 | 361 / 427 / 677 / 847 |
| Rare stage falling back, rare chain not droppable, full-board deadlocks, Level 1 re-asks | 0 | 0 |

### The lanterns' Gear
- **When it is asked:** after the boardwalk's Rover copy has been merged (Level 2), as the stage's gold order.
- **Before the Kite:** the stage's own copy is the one that later brings the Rover to Level 3, which brings out the Kite.
- **Stage list test:** the 48c rule that a rare stage never gives the copy of its chain's generator does not apply here. The Gear needs the Level 2 the boardwalk made, not this stage's copy. The stage-list tests name this exception.
- **Order is out (min, 10 seeds):**

  | Player | With the Gear | The stage's old order |
  |---|---|---|
  | Scripted player | 2.5-6.7 | 2.6-6.8 |
  | Strict gold-first | 3.0-8.3 | 2.2-9.2 |
  | Opportunist | 3.8-12.1 | 3.2-8.4 |

- **Why the opportunist is slower:** the order keeps the stage's four Level 4 parts, and a crew order wanting a Gear takes the first one.
- **Rover taps:** at most 32 while the order is up.
- **Drop guarantee:** each Bolt drops within 8 eligible taps (goldPity, unchanged).
- **No rare gold order right after it:** the next rare one, the pier's crane, comes stages later. The 52A rule against consecutive difficult rare gold orders still holds.
- **Not on luck:** a player without a Level 2 Rover gets the usual materials.
- **Saves:** a lanterns order saved before this build keeps its recipe and coins. The Gear comes with the next one made.
- **Why not the earlier stall:** the 51d attempt walled the session. Here the guarantee (goldPity 8) and 52A's crew Gear orders keep it short. The stage's wait is unchanged for the ordinary player.

### Tried and dropped
- **Lower rates for stages 2-3 (0.6-0.75):** gave the 7-8 s player two restorations in 15 minutes (the floor is 3).
- **Rates 0.5-0.55 and a 2-4 stage band:** failed the existing rare-demand test (a single seeded run, which swings 18-23 % with any gold change; the floor is 22 %) or the low-energy free-move test.
- **Holding the next gold order back while a stage waits for coins:**
  - held through Chapter 1: the Kite came 2-6 minutes later, and the gold-first player starved of energy late in the chapter;
  - held for the first six stages only: no gain.
- **A higher crew-order floor while only the Rover is out:** no measurable change.
- **The Gear on the camp tent (stage 3):** the Rover was not yet Level 2 when its gold order was made, so it fell back to its usual materials.
- **The Gear on the bunks (tent stage 2):** put the Kite 9-24 minutes later.

### Limits
- The opening's crew share rises from about 22 % to 27-30 %, not to half.
- More would need gold orders to pay much less than a stage's cost in the first stages. That costs the first 15 minutes' restorations or the Kite's time.
- That trade-off is a design call: price gold orders as a share of the stage cost, or accept slower early restorations.

### Tests
- **`tests/v5-next-build52a-feedback.test.mjs` (new, 6 tests):**
  - fresh and saved gold-first play: crew orders at least 24 % of the first six stages' coins and 40 % of Chapter 1's;
  - the first rare gold order is the lanterns' Gear, after Rover Level 2 and before the Kite, not followed by another;
  - the Gear order: at most 1.3 min per s/action and 40 Rover taps;
  - no starvation or long idle;
  - saves and the guide's 70.
  
  On 52A it fails 5 of 6 (22 % and 21 % crew share, no early Gear, 40 min without energy).
- **Updated tests:**
  - `v5-next-build52a` and `v5-next-rare-merges` (the gold rates);
  - `v5-next-ch1-rare` (seven Chapter 1 rare stages; whether a stage's rare part could drop is now read when its gold order is made);
  - `v5-next-coach` (the next Gear use is the lanterns).
- **New tools:**
  - `tests/v5-next-goldfirst-policy.mjs` (the gold-first player);
  - `tests/v5-next-goldfirst-metrics.mjs` (coins by source, waits, the first rare gold order against the Kite; `OPP=1`, `fresh|save`, `GOLD=` overrides).

## Order difficulty and rare drops (Build 52A3)
Two reports from play: crew and gold orders were still too easy, and rare extras dropped so often that they felt
ordinary. No new system, generator, chapter, art or save field.

### What changed (`v5/next/game.mjs`)
| Rule | 52A2 | 52A3 |
|---|---|---|
| Everyday parts asked, from 12 stages built (`ORDER_RAMP.reachFrom`) | at most 1 tier past the generator's best part | at most **2** tiers past it (never the chain's keepsake tier); the guide's orders and the opening unchanged |
| Crew order worth 24+ Level 1 parts (`DEEP_ENERGY`) | +1 ϟ | **+2 ϟ** |
| Rare drop after the first 6 stages (`SECONDARY_RULES`) | 5 % a tap, certain by the 20th eligible tap, the 8th for a gold order | **4 %**, the **24th**, the **10th**: one drop every 15.6 eligible taps on average (was 12.8) |
| Rare drop in the first 6 stages (`RARE_EARLY`) | the same | unchanged (5 %, 20, 8): the rare introduction, the lanterns' Gear and the opening's Gear crew orders as in 52A2 |

The Build 46f rule ("one tier past the best part") gets this one exception after the opening; its test states it.
The Help text says both. Build label 52A3.

### Before / after
`tests/v5-next-difficulty-metrics.mjs` (new), 4/5/8/10 s, 10 seeds each (medians, or the range over speeds).
- Ordinary scripted player: shop on, whole game.
- Gold-first players: no shop, Chapter 1; the strict one and the opportunist.

| | 52A2 | 52A3 |
|---|---|---|
| Merge steps per crew order: ordinary player | 14.4-15.5 | **17.8-19.6** |
| Merge steps per crew order: gold-first (strict / opportunist) | 9.6-10.3 / 9.2-10.0 | **14.1-15.1 / 13.4-14.7** |
| Taps per delivered order: ordinary player | 6.4-6.5 | 8.0-8.2 |
| Gold orders (parts, merge steps) | 2.7 parts, 21 steps | unchanged |
| Chains per crew order | 1.7-1.8 | 1.6-1.8 |
| Repeated crew orders (same parts as one of the last four) | 1.6-3.9 % (gold-first 2.5-12 %) | 2.1-4.1 % (gold-first 3-9.7 %) |
| Rare drops, Chapter 1: ordinary / gold-first | 40-47 / 42-56 | 42-47 / 45-48 |
| Rare orders delivered, Chapter 1: ordinary | 23-28 | 22-25 |
| Rare gold order wait, median / max (min): ordinary | 1.1-3.2 / 5.0-11.6 | 1.3-5.6 / 5.8-13.9 |
| First rare gold order (the lanterns' Gear, min) | 6.7 / 8.4 / 13.5 / 16.9 | unchanged |
| Survey Kite, latest seed (min) | 16.6 / 20.7 / 33.2 / 41.5 | unchanged |
| Restorations in the first 15 minutes, lowest seed | 4 / 3 / 3 / 2 | unchanged |
| Gold's share of coins (whole game) | 37.5-37.9 % | 38.0-38.4 % |
| Energy starvation, longest of 10 runs (min) | 0-0.9 | 0-3.9 (one run at 4 s) |
| Full-board deadlocks, longest idle | 0 | 0 |
| Whole game, ordinary player (min) | 361 / 427 / 677 / 847 | 372 / 466 / 789 / 986 |
| Chapter 1, gold-first opportunist (min) | 116 / 142 / 246 / 302 | 115 / 134 / 234 / 296 |

- **Rare drops still follow demand.** They pause while four units wait unused, so Chapter 1's count barely
  moves. What changes is the gap between drops after the opening: each eligible tap is about 22 % less likely to
  drop.
- **Crates are not the problem:** they give 2-6 rare parts in Chapter 1 against 40-56 from taps, and were left as
  they are.

### Costs
- **Longer games.** The ordinary player's whole game is 3-17 % longer. This is active play (more merging per order),
  not waiting: idle time and starvation are unchanged.
- **More rare crew orders go unfilled.** Over 10 seeds per speed, 54-62 % of rare crew orders are delivered (52A2:
  61-80 %); more are swapped out as stuck.
- **Level 3 rare crew orders wait longer:** a median 5-17 min (was 1-10). Gold rare orders keep their
  guarantee.
- **The ordinary player's opening leans more on gold** (68 % → 75 % of the first six stages' coins), because the
  opening's 80-coin Gear crew order comes later.
- **The saved-camp gold-first player's opening crew share:** the median of three seeds is 23 % (52A2: 26 %).
- **Fresh gold-first openings are unchanged:** 26-27 %.

### Tried and rejected
All measured with 10-20 seeds per speed.

- **Rare 3 % (with 24/10, 22/9 or 20/8) or 4 % with 22/9, once orders were deeper:** the fast gold-first player ran
  out of energy for 10-40 min in 9-20 runs of 20.
- **Rare 26/12:** one rare gold order waited 96 min.
- **Rarer drops from the start:** the gold-first opening's crew share fell from 27 % to 19 % (undoing 52A2).
- **Deeper crew orders from 6 stages:** a player starting from a saved camp starved at 4 s (median 21 min).
- **Without the extra energy:** 10-80 min starvation at 4-5 s.
- **Deeper gold orders (the opening's lift again from 12 stages):** gold-first starvation of 40-210 min.
- **Dropping the gold shape with four low parts:** the Survey Kite came at 28 min at 4 s (guard 17).
- **One part a tier up instead of two of a tier (quick jobs):** no measurable change.
- **The floor and top-tier ramps (`low2`, `low3`, `topEvery`):** no measurable change. Orders are capped by what
  the generator makes, not by these.
- **Smaller rare goals, or fewer rare asks (`goal` 1, `share` 4):** did not bring rare crew deliveries back up.

### Tests
- **`tests/v5-next-build52a3.test.mjs` (new, 4):**
  - rare rates, the opening and after, with the worst-luck gap;
  - deeper orders: never before 12 stages, never past reach + 2 or the keepsake tier, priced by their parts; the
    guide's orders;
  - the extra energy;
  - whole Chapter 1 runs for three players against the same runs under the 52A2 rules: at least 15 % more merging,
    starvation at most 3.5 min, no long idle, the 15-minute and Kite guards.
- **Updated for the new values, with the reasons in the tests:**
  - rare rates and pity: `v5-next-rare-merges`, `v5-next-secondary`, `v5-next-ch1-rare`, the 52A2 feedback test;
  - the reach rule's exception: `v5-next`;
  - two single-path guards in `v5-next-secondary`: the share of everyday orders asking a rare part, 22 % → 15 %,
    and rare orders delivered, 60 % → 45 %, as measured over seeds above;
  - the saved-camp opening share, now the median of three seeds, 22 %.
- **Gold-first policy (`tests/v5-next-goldfirst-policy.mjs`):** a player out of energy now delivers a ready crew
  order (it gave 75 min of artificial starvation).

## Player feedback round 3 (Build 52A4)
Feedback:
1. Orders do not get harder from the start.
2. Small crew orders still ask too little.
3. The Tide token cannot be used.
4. Opening a crate does not feel like a useful gift.

| Change (`v5/next/game.mjs`) | Before | 52A4 |
|---|---|---|
| Deeper crew orders: one tier further past the generator's best part (`ORDER_RAMP.reachFrom`) | from 12 stages built | from 3 (after the guide's two); the guide's orders unchanged |
| Tide token on a part | turns it into a part of the same level and another kind that an order misses; otherwise refused, which the opening's Rover-only orders always caused | the same; otherwise it raises the part one level (a free merge), up to the chain's last part below its keepsake |
| Crate part | the crate's fixed level | a part an order still misses from the crate's chain, the highest up to Lv3 / Lv4 / Lv5 (driftwood, sea chest, trunk); else as before; the rare slot unchanged |
| Bonus orders with a rare part | could duplicate a card on the board | never (the "no two identical cards" rule now also covers this step) |

Measured with `tests/v5-next-difficulty-metrics.mjs` (4/5/8/10 s, 10 seeds) against 52A3.

| | 52A3 | 52A4 |
|---|---|---|
| Merge steps per crew order: scripted player | 17.8-19.6 | 18.3-18.9 |
| Merge steps per crew order: gold-first opportunist | 13.4-14.7 | 14.8-16.1 |
| Merge steps per crew order: strict gold-first | 14.1-15.1 | 14.3-15.3 |
| Whole game, scripted player (min) | 372 / 466 / 789 / 986 | 377 / 447 / 719 / 898 |
| First 15-minute restorations, Survey Kite | — | unchanged |
| Energy starvation | 0-3.9 min | 0 for the scripted and opportunist players and for saved camps (20 seeds at 4-5 s) |

- **Deeper orders now start in the opening** (stage 3 on), where before the first 12 stages asked what 52A2 asked.
- **One strict gold-first run at 5 s went 23.6 min without energy.** That player never delivers a crew order unless
  it must.
- **The floor tiers (`low2`, `low3`) were tried earlier as well (2 and 9):** repeated orders rose to 17 % (the limit
  is 15 %) and the 5 s game passed 8 h, so they are unchanged.
- **Tests:** the token test now covers the level-up and its limit; the 52A3 test checks deeper orders from stage 3.
