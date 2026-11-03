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
     stages 2–6 and × 1.0 after (51d: 1.5 for six, then 1.3).
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
