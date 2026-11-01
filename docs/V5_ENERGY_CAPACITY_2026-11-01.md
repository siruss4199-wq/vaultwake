# Vaultwake V5 Coast Camp — level-based energy capacity and early energy bonuses (build 47v)

- **Date:** 2026-11-01
- **Branch:** `claude/v5-secondary-pilot-r2` (draft PR #84). It builds on the secondary-chain pilot round 3 (build 47u), which is unchanged here: extras only from level-2+ Rover and Kite copies, 5 % per eligible tap, a drop certain by the 20th, the demand rules, at least one primary-only order, no extras in gold orders, full-board reward safety.
- **Status:** trial balance values, set by the director. Not merged.
- **Player problem:** energy ran out before the player had enjoyed enough merging, orders and restoration, and player levels gave no lasting benefit.

## 1. Rules as built

| Rule | Value | Where |
|---|---|---|
| Natural-refill capacity by player level | 1–2: 50 · 3–4: 60 · 5–7: 70 · 8–11: 80 · 12–16: 90 · 17–22: 100 · 23–29: 110 · 30+: 120 | `v5/next/energy.mjs:11` (`CAPACITY`), one function `capacityAt`/`capacityOf` (`:17`) |
| Refill interval | +1 every 2 minutes (unchanged) | `REFILL_EVERY` from `v5/energy.mjs` |
| Capacity milestone reward | the increase, once (50 → 60: +10), on top of the level's own energy (unchanged: +5 up to level 5, then +15) | `v5/next/game.mjs:609` (`gainXp`), `s.capPaid` |
| New camp | 50 of 50 (was 30) | `START_ENERGY`, `game.mjs` |
| First ordinary crew order | +15 energy once | `game.mjs:785`, `s.boost.order` |
| First stage bought | +20 energy once | `game.mjs:811`, `s.boost.stage` |
| Stored energy ceiling | 200 (was 120) | `STORE_ENERGY`, `energy.mjs`; `MAX_ENERGY` = 200 |
| Milestone energy past 200 | owed (`s.energyOwed`), paid as room opens | `storeEnergy`/`payOwed`, `energy.mjs:45,50`; `game.mjs` act |
| Delivery energy | primary-only +1 · mixed (primary + extra) +1 · extras-only 0 · gold 0 | `game.mjs:303` (`DELIVERY_ENERGY`), `:781` |
| Save version | 5 (was 4) | `game.mjs:24` |

**Order of payment at a level-up.** The new capacity applies first. Then the level's own energy tops up to it, as before. Then the capacity increase is added, above the capacity if need be. Worked example: 12/50 at level 2 → level 3 gives +5 (to 17) then +10, so 27/60. Without the level's +5 it would be 22/60, the task's example. Each level of a multi-level action is paid in turn: level 2 → 8 in one delivery pays 50 → 60, 60 → 70 and 70 → 80, +30 in all. `s.capPaid` is the capacity already paid for, so a level can never be paid twice.

**Which tap or delivery counts as "the first ordinary crew order".** A delivered order that is not a gold order and has at least one primary part (`ordinaryOrder`, `game.mjs:308`). The introductory order for a gifted extra asks for that extra alone, so it can never claim the bonus. Neither can any other extras-only quick job. Mixed orders can.

**Refill above the capacity.** At or above the capacity the refill clock rests: nothing is added, nothing is taken away, and no credit builds up. The clock restarts at the moment energy falls below the capacity (`game.mjs:672`). Bonus energy above the capacity comes from three sources:
- the onboarding bonuses;
- capacity increases;
- energy that the shop, daily gift, deliveries or cargo jars already allowed above the old cap of 50.

Stage and level energy still only top up to the capacity, as since Build 41g.

**The 200 ceiling and owed energy.** The shop refuses an Energy pack that would pass 200 (`Energy is almost full`), as it did at 120. Deliveries and recycling stop at 200, as they stopped at 120. Milestone rewards (capacity increases, +15, +20) and the daily energy gift are never cut short: whatever passes 200 waits as `s.energyOwed` and is paid as room opens. It is not a currency or an item; it shows only in the energy pill's tooltip.

**Classic V5.** `v5/energy.mjs` (refill cap 50) and its callers `v5/core.mjs` and `v5/app.mjs` are unchanged. Coast Camp imports its own module, `v5/next/energy.mjs`. It reads only `REFILL_CAP` from the shared module, to settle old saves at their old cap. The test "Classic V5 energy is unchanged" checks that Classic still refills to 50 at level 30.

## 2. Saves (migration)

Save keys are unchanged (`vaultwake-v5-coast` and its kept copies). The new fields are `capPaid`, `boost` and `energyOwed`, all optional with safe defaults, and the version goes from 4 to 5 (`game.mjs:1059–1065`). Loading a version-4 save:

1. **Capacity:** the capacity for the save's current level; `capPaid` is set to it, so no past increase is paid.
2. **Energy:** kept as it is, never reset to 50, and never reduced. Energy above the new capacity stays (110 at level 1 stays 110).
3. **Time away:** settled first at the old capacity (50), as build 47u would have. A camp then at 50 or more starts its clock now, so time spent full is never paid at the new, higher capacity. For example, level 10, 45 energy, three hours away gives 50 (not 80), and the clock then runs towards 80.
4. **Onboarding:**
   - **+20 (first stage):** claimed if the camp has bought a stage.
   - **+15 (first crew order):** claimed if the camp has delivered more orders than its gold orders. Gold deliveries are counted by the materials they brought.
   - A camp that has done neither stays eligible.
   - Round-3 introductory orders delivered before this build count as ordinary in this inference. That errs towards "claimed", never towards paying twice.
5. **Reloading:** loading the same save again changes nothing. A damaged `boost` is worked out again the same way; a damaged `energyOwed` is dropped.

**Rollback.** Build 47u reads a version-5 save as "from a newer build" (saves.mjs, round 2) and leaves it untouched. That matters because energy above 120 would otherwise read as damaged there.

## 3. Player-facing UI

- **HUD** (`app.mjs:389` `energyHud`): `energy/capacity` (`50/50`, `28/60`).
  - The timer shows FULL at the capacity and a countdown below it.
  - Above the capacity the number turns gold and the timer says BONUS (`135/120`).
  - The tooltip names the capacity and any owed energy.
- **Level badge** (`app.mjs:530`): `Level 5 · 34 of 60 XP`, `Energy capacity: 70 (refills +1 every 2 minutes up to it).`, then `Level 8: energy capacity increases to 80.` or `Maximum energy capacity: 120.`, then the level path as before.
- **At a capacity milestone:**
  - The level card says `+5 ϟ for the level. Energy capacity is now 60.`
  - Once the card has gone, a short note under the energy pill says `Energy capacity 50 → 60 · +10 energy`.

  The level's own energy and the milestone reward are named apart and never cover each other.
- **Onboarding notes:** `First crew order · +15 energy` and `First stage · +20 energy` appear as short notes under the energy pill, beside the usual delivery and stage feedback. They never take a tap. The stage's reward list also names `first stage: +20 energy`.
- **Accessibility:** reduced motion shows the notes without movement (tested). No new blocking screen.
- **Help:** a new "Energy" item lists the capacities, the milestone reward, the start and the two bonuses, and bonus energy above the capacity. The rare-extras item now says mixed orders give the usual +1.
- **Build** 47v; the CrazyGames page is regenerated.

## 4. Economy validation (same policy, same seeds)

Command (both trees, the scripted player `tests/v5-next-policy.mjs` and the harness `tests/v5-next-economy-sim.mjs` are byte-identical in both):

```
ROOT=<47u tree> node tests/v5-next-energy-metrics.mjs 4,5,8,10 1,...,10 both --runs   # before (62e2fae)
node tests/v5-next-energy-metrics.mjs 4,5,8,10 1,...,10 both --runs                   # after
```

Setup:
- seconds per action are jittered ±40 %;
- secondary model B, each seed with its own drop sequence;
- the run ends when Chapters 1–2 are built;
- "out" means energy reaching 0, and "waiting" means time with nothing to do;
- medians over 10 seeds (range where shown).

| Speed, shop | Build | First energy out (min) | Times out | Orders 15 / 20 min | Stages 15 / 20 min | First generator level 2 (min) | First stage (min) | Waiting share | Longest stop (min) | Waiting in first 20 min | Chapter 1 (min) | Chapters 1–2 (min) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 4 s, no shop | 47u | 9.8 | 43 | 9 / 15 | 7 / 9 | 3.3 | 2 | 0.2 | 2 | 1.2 | 151.5 | 193 (184.8–236.1) |
| 4 s, no shop | **47v** | 144.4 (1 of 10 seeds runs out) | 0 | 6 / 11 | 5 / 7 | 5.7 | 3.8 | 0 | 0 | 0 | 108.1 | 148.3 (144.1–154.7) |
| 5 s, no shop | 47u | 18.8 | 35 | 6 / 10 | 5 / 8 | 4.1 | 2.5 | 0.2 | 2 | 0 | 173 | 221.8 (197–248) |
| 5 s, no shop | **47v** | never in 10 of 10 | 0 | 5 / 7 | 4 / 5 | 7.1 | 4.8 | 0 | 0 | 0 | 135.2 | 185.2 (180.1–193.1) |
| 8 s, no shop | 47u | 37.9 | 2 | 4 / 6 | 3 / 5 | 6.6 | 4 | 0 | 0 | 0 | 217.1 | 294.3 (285.9–306.3) |
| 8 s, no shop | **47v** | never in 10 of 10 | 0 | 4 / 4 | 3 / 3 | 11.4 | 7.7 | 0 | 0 | 0 | 213.8 | 296.2 (276.9–306.6) |
| 10 s, no shop | 47u | 59.3 (6 of 10 seeds run out) | 1 | 4 / 5 | 3 / 4 | 8.3 | 5 | 0 | 0 | 0 | 269 | 366.3 (354.2–376) |
| 10 s, no shop | **47v** | never in 10 of 10 | 0 | 3 / 4 | 2 / 3 | 14.2 | 9.6 | 0 | 0 | 0 | 271 | 372.6 (353.6–399.4) |
| 4 s, shop | 47u | 9.8 | 7 | 9 / 16 | 7 / 9 | 3.3 | 2 | 0 | 0 | 0 | 111.4 | 150.1 (141.4–167) |
| 4 s, shop | **47v** | 144.4 (1 of 10 seeds runs out) | 0 | 6 / 11 | 5 / 7 | 5.7 | 3.8 | 0 | 0 | 0 | 108.1 | 148.3 (144.1–154.7) |
| 5 s, shop | 47u | 18.8 | 3 | 6 / 10 | 5 / 8 | 4.1 | 2.5 | 0 | 0 | 0 | 137.1 | 188.2 (180.4–192.1) |
| 5 s, shop | **47v** | never in 10 of 10 | 0 | 5 / 7 | 4 / 5 | 7.1 | 4.8 | 0 | 0 | 0 | 135.2 | 185.2 (180.1–193.1) |
| 8 s, shop | 47u | 37.9 | 1 | 4 / 6 | 3 / 5 | 6.6 | 4 | 0 | 0 | 0 | 216.4 | 294.4 (288–303.8) |
| 8 s, shop | **47v** | never in 10 of 10 | 0 | 4 / 4 | 3 / 3 | 11.4 | 7.7 | 0 | 0 | 0 | 213.8 | 296.2 (276.9–306.6) |
| 10 s, shop | 47u | 59.3 (6 of 10 seeds run out) | 1 | 4 / 5 | 3 / 4 | 8.3 | 5 | 0 | 0 | 0 | 269.1 | 370.1 (354.4–391.4) |
| 10 s, shop | **47v** | never in 10 of 10 | 0 | 3 / 4 | 2 / 3 | 14.2 | 9.6 | 0 | 0 | 0 | 271 | 372.6 (353.6–399.4) |

Energy earned by source (median per run, Chapters 1–2):

| Speed, shop | Build | refill | levelEnergy | capacity | firstOrder | firstStage | deliver_primary | deliver_mixed | stageEffect | jar | ration | shop | owedPaid |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 4 s, no shop | 47u | 96 | 635 | 0 | 0 | 0 | 40 | 0 | 113 | 10 | 24 | 0 | 0 |
| 4 s, no shop | 47v | 70 | 625 | 70 | 15 | 20 | 37 | 6 | 108 | 5 | 0 | 0 | 0 |
| 5 s, no shop | 47u | 110 | 650 | 0 | 0 | 0 | 42 | 0 | 113 | 10 | 16 | 0 | 0 |
| 5 s, no shop | 47v | 87 | 625 | 70 | 15 | 20 | 38 | 6 | 108 | 5 | 0 | 0 | 0 |
| 8 s, no shop | 47u | 146 | 642 | 0 | 0 | 0 | 41 | 0 | 113 | 10 | 8 | 0 | 0 |
| 8 s, no shop | 47v | 139 | 623 | 70 | 15 | 20 | 35 | 6 | 106 | 5 | 0 | 0 | 0 |
| 10 s, no shop | 47u | 176 | 618 | 0 | 0 | 0 | 40 | 0 | 102 | 10 | 8 | 0 | 0 |
| 10 s, no shop | 47v | 171 | 610 | 70 | 15 | 20 | 34 | 6 | 95 | 5 | 0 | 0 | 0 |
| 4 s, shop | 47u | 74 | 650 | 0 | 0 | 0 | 47 | 0 | 113 | 10 | 8 | 60 | 0 |
| 4 s, shop | 47v | 70 | 625 | 70 | 15 | 20 | 37 | 6 | 108 | 5 | 0 | 0 | 0 |
| 5 s, shop | 47u | 94 | 650 | 0 | 0 | 0 | 45 | 0 | 113 | 10 | 0 | 40 | 0 |
| 5 s, shop | 47v | 87 | 625 | 70 | 15 | 20 | 38 | 6 | 108 | 5 | 0 | 0 | 0 |
| 8 s, shop | 47u | 143 | 636 | 0 | 0 | 0 | 42 | 0 | 110 | 10 | 0 | 20 | 0 |
| 8 s, shop | 47v | 139 | 623 | 70 | 15 | 20 | 35 | 6 | 106 | 5 | 0 | 0 | 0 |
| 10 s, shop | 47u | 176 | 622 | 0 | 0 | 0 | 44 | 0 | 103 | 10 | 0 | 20 | 0 |
| 10 s, shop | 47v | 171 | 610 | 70 | 15 | 20 | 34 | 6 | 95 | 5 | 0 | 0 | 0 |

Highest energy held, deliveries by kind (median):

| Speed, shop | Build | Highest energy | Primary | Mixed | Rare-only | Gold | Mixed=0 total min |
|---|---|---|---|---|---|---|---|
| 4 s, no shop | 47u | 46 | 40 | 5 | 23 | 63 | — |
| 4 s, no shop | 47v | 78 | 37 | 6 | 22 | 63 | 147.9 |
| 5 s, no shop | 47u | 44 | 42 | 6 | 21 | 63 | — |
| 5 s, no shop | 47v | 93 | 38 | 6 | 21 | 63 | 185.2 |
| 8 s, no shop | 47u | 50 | 41 | 6 | 23 | 63 | — |
| 8 s, no shop | 47v | 120 | 35 | 6 | 23 | 63 | 296.2 |
| 10 s, no shop | 47u | 50 | 40 | 7 | 21 | 63 | — |
| 10 s, no shop | 47v | 120 | 34 | 6 | 21 | 63 | 372.6 |
| 4 s, shop | 47u | 50 | 47 | 6 | 24 | 63 | — |
| 4 s, shop | 47v | 78 | 37 | 6 | 22 | 63 | 147.9 |
| 5 s, shop | 47u | 50 | 45 | 8 | 24 | 63 | — |
| 5 s, shop | 47v | 93 | 38 | 6 | 21 | 63 | 185.2 |
| 8 s, shop | 47u | 50 | 42 | 7 | 23 | 63 | — |
| 8 s, shop | 47v | 120 | 35 | 6 | 23 | 63 | 296.2 |
| 10 s, shop | 47u | 50 | 44 | 7 | 22 | 63 | — |
| 10 s, shop | 47v | 120 | 34 | 6 | 21 | 63 | 372.6 |


### What the numbers say

1. **Forced stops are gone.**
   - Before, a 4 s player ran out about 43 times (first at 9.8 min) and spent about 20 % of the time waiting; a 5 s player about 35 times (first at 18.8 min).
   - Now no player runs out in the first 20 minutes. Over the whole run, 78 of 80 runs never do; the other two are one 4 s seed, with and without the shop (which it never needs), out once at 144 min. Waiting share is 0 everywhere.
   - The longest stop with nothing to do is 0 (it was 2 min at 4–5 s).
2. **Faster players finish sooner; slower ones the same.**
   - Without the shop, Chapters 1–2: 193 → 148 min at 4 s (−23 %) and 222 → 185 at 5 s (−17 %). Chapter 1: 152 → 108 and 173 → 135.
   - At 8 and 10 s, and everywhere with the shop, totals are within ±2 %.
   - So the pass removes waiting; it does not speed up play. Active play time is unchanged.
3. **The first 15–20 minutes have fewer orders and stages for this scripted player.**
   - Orders in 15 min: 9 → 6 at 4 s, 6 → 5 at 5 s, 4 → 3 at 10 s.
   - The first stage comes at 3.8–9.6 min (was 2.0–5.0) and the first generator level 2 at 5.7–14.2 min (was 3.3–8.3).
   - The ablations below show why. The policy opens cargo and makes keys for new generator kinds before working on orders whenever it holds 45 or more energy (`tests/v5-next-policy.mjs:25,56`). A full start (50) and the +15 put it there from the first minute.
   - It does open cargo much sooner: the first cargo opened or generator merged comes at 0.9–2.1 min instead of 3.4–8.6 (economy guard). The first-15-minute mix shifts from orders to cargo.
   - With a start of 30 instead, orders in 15 min return to 8 at 4 s and the first stage to 2.0 min.
   - A real player may or may not behave this way, so this needs a human playtest, not an assumption.
4. **Energy by source.**
   - Level energy dominates as before (about 610–650 per run).
   - Capacity milestones add +70 per run (seven milestones by level 30), the onboarding bonuses +35 and the full start +20.
   - Refill falls (70–171, was 96–176), because less time is spent below the capacity.
   - The free ration is no longer needed (0, was 8–24) and the shop's Energy pack is no longer bought (0, was 20–60).
5. **Mixed-order delivery energy has almost no effect.** It gives +6 per run (about 6 mixed orders), and with `mixed=0` every cell's total is the same to 0.4 min.
6. **No loop and no runaway.**
   - The highest energy held is 77–121 (capacity 120 at level 30). Nothing is owed at the end of any run, and the stored ceiling of 200 is never reached by play.
   - Taps per run are 637–658 against 594–626 before (+5 %): the scripted player spends some spare energy.
   - Levels at the end are 46–47 in both.
   - Energy per delivered primary part rises 0.46 → 0.48–0.49 (secondary pilot metrics).
7. **Secondary chains under the pass** (`tests/v5-next-secondary-pilot-metrics.mjs`):
   - drop rate unchanged (7.4–7.5 %);
   - unused-and-unordered time unchanged (48–50 %);
   - share of new everyday orders with an extra 42–45 % (was 40–42 %).
   - The Rover's extras open later (5.7–14.1 min, was 3.3–8.3) because its first level 2 comes later (point 3).

### Which reward does what (ablations, no shop)

`node tests/v5-next-energy-metrics.mjs 4,5,8,10 1,...,10 noshop <variant>`. Each variant changes only that part of 47v.

| Speed (no shop) | Variant | Times out | First out (min) | Waiting share | Orders 15 min | Stages 15 min | First stage (min) | First generator level 2 (min) | Chapters 1–2 (min) |
|---|---|---|---|---|---|---|---|---|---|
| 4 s | 47u (before) | 43 | 9.8 | 0.2 | 9 | 7 | 2 | 3.3 | 193 |
| 4 s | **47v (as built)** | 0 | 144.4 (1 of 10 seeds run out) | 0 | 6 | 5 | 3.8 | 5.7 | 148.3 |
| 4 s | start 30 (no full start) | 0 | never | 0 | 8 | 5 | 2 | 5.6 | 149.7 |
| 4 s | no +15/+20 | 0 | never | 0 | 6 | 5 | 3 | 5.7 | 148.4 |
| 4 s | capacity fixed at 50 (no milestones) | 25 | 70.5 | 0.1 | 6 | 5 | 3.8 | 5.7 | 174.9 |
| 4 s | all three off | 42 | 9.8 | 0.3 | 9 | 7 | 2 | 3.3 | 192.3 |
| 5 s | 47u (before) | 35 | 18.8 | 0.2 | 6 | 5 | 2.5 | 4.1 | 221.8 |
| 5 s | **47v (as built)** | 0 | never | 0 | 5 | 4 | 4.8 | 7.1 | 185.2 |
| 5 s | start 30 (no full start) | 0 | never | 0 | 7 | 4 | 2.5 | 7 | 186 |
| 5 s | no +15/+20 | 0 | never | 0 | 5 | 4 | 3.7 | 7.1 | 188.8 |
| 5 s | capacity fixed at 50 (no milestones) | 3 | 102.1 | 0 | 5 | 4 | 4.8 | 7.1 | 186.1 |
| 5 s | all three off | 28 | 18.8 | 0.1 | 6 | 5 | 2.5 | 4.1 | 213 |
| 8 s | 47u (before) | 2 | 37.9 | 0 | 4 | 3 | 4 | 6.6 | 294.3 |
| 8 s | **47v (as built)** | 0 | never | 0 | 4 | 3 | 7.7 | 11.4 | 296.2 |
| 8 s | start 30 (no full start) | 0 | never | 0 | 6 | 3 | 4 | 11.2 | 301.3 |
| 8 s | no +15/+20 | 0 | never | 0 | 4 | 3 | 5.9 | 11.4 | 298.9 |
| 8 s | capacity fixed at 50 (no milestones) | 0 | never | 0 | 4 | 3 | 7.7 | 11.4 | 288.2 |
| 8 s | all three off | 1 | 37.9 | 0 | 4 | 3 | 4 | 6.6 | 297.5 |
| 10 s | 47u (before) | 1 | 59.3 (6 of 10 seeds run out) | 0 | 4 | 3 | 5 | 8.3 | 366.3 |
| 10 s | **47v (as built)** | 0 | never | 0 | 3 | 2 | 9.6 | 14.2 | 372.6 |
| 10 s | start 30 (no full start) | 0 | never | 0 | 3 | 2 | 5 | 14 | 376.6 |
| 10 s | no +15/+20 | 0 | never | 0 | 3 | 2 | 7.4 | 14.2 | 373.3 |
| 10 s | capacity fixed at 50 (no milestones) | 0 | 372.1 (1 of 10 seeds run out) | 0 | 3 | 2 | 9.6 | 14.2 | 360.9 |
| 10 s | all three off | 1 | 59.3 (6 of 10 seeds run out) | 0 | 4 | 3 | 5 | 8.3 | 366.3 |


- **The capacity milestones (and the larger buffer above 50) are what keep energy from running out later in the chapters.** With the capacity fixed at 50, a 4 s player runs out 25 times again, first at 70 min.
- **The full start and +15/+20 are what cover the first hour.** With all three off the result is the 47u game exactly, a check that nothing else in the pass changes the economy.
- **The slower early orders come from energy at 45 or more early on, whichever reward puts it there.** A start of 30 alone restores the first stage at 2.0 min.

**Is the trial too generous?** For a scripted player that never runs out in 2.5–6 hours of play, energy no longer limits the session at all. That is more than the design goal (no repeated forced stops in the first 15–20 minutes).

The largest single contributor to the late-game abundance is the capacity growth itself (milestones plus the bigger refill buffer). Not the onboarding bonuses. No chapter cost or item requirement was changed. If the director wants energy to matter again later in the chapters, the capacity table is the lever: smaller steps, or the higher steps later.

## 5. Tests reviewed against the approved design

The old guard asserted that energy must run out. Per the task, that assertion is removed, not satisfied by cutting rewards. Each change, and what still guards:

| Test | Was | Now | Still guards |
|---|---|---|---|
| `v5-next-economy.test.mjs` "energy runs out, and is the reason for waiting" | lowest energy < 1 at every speed | renamed "energy stays bounded and is never the reason for a long stop" | highest energy ≤ 200 and nothing owed in every run; low-energy moments have a free move ≥ 50 %; never idle > 3 min |
| same, generators on time | Kite ≤ 3 min per s/action | ≤ 4 (measured 3.6 at 10 s) | Kite and Kiln still arrive, Kiln before the end; taps ≤ 900 |
| same, first 15 minutes | first stage ≤ 6 min, first order ≤ 2.5, ≥ 4 orders, ≥ 3 stages | first stage ≤ max(6, 1.1 min per s/action), first order ≤ max(2.5, 0.3 per s/action), ≥ 3 orders and ≥ 2 stages at 9–10 s | a named next step after every action; first merge ≤ 1 min; discovery ≤ 9.5 min |
| `v5-next.test.mjs` beach and both-areas runs | energy ran out | energy bounded (≤ 200, nothing owed) | play time 45–110 min (beach), 40–110 per area, real time ≤ 4 h / 12 h, Kite/Shell/Kiln order |
| `v5-next.test.mjs` harder start | 30 energy | 50 | +5 for levels up to 5, bigger first gold orders |
| `v5-next-secondary.test.mjs` demand | share ≤ 45 % | ≤ 50 % (46 % in that run) | ≥ 22 %, never gold, always a primary-only order, limits, use/goal kinds, most delivered |
| Mechanical tests (stage energy, jar, shop at the ceiling, version, first delivery) | fixed 50 / 120 / version 4 | the level's capacity, 200, version 5, +15 counted | unchanged behaviour otherwise |
| `v5-next-story-browser.cjs` | 30 → 29 after a tap | 50 → 49 | everything else |

## 6. Tests added and run

- **`tests/v5-next-energy.test.mjs`** (12 tests):
  - every capacity boundary;
  - multiple level-ups in one action;
  - level reward plus capacity delta (12/50 → 27/60);
  - onboarding bonuses exactly once, also across reloads, and no +15 for Rover level 2;
  - gold and introductory orders not claiming the first-order bonus;
  - primary-only, mixed and extras-only delivery energy;
  - offline refill with dynamic capacity;
  - energy above the capacity, the clock resting and resuming with no credit;
  - the 200 ceiling, owed remainder paid later, daily gift owed, damaged owed values;
  - a full-board milestone (the energy comes, the board rewards wait);
  - old-save migration, repeated reloads and damaged `boost`;
  - Classic V5 energy unchanged.
- **`tests/v5-next-energy-browser.cjs`** at 360×780, 390×844 (also reduced motion), 430×932 and 907×510:
  - 50/50 FULL, the countdown, the level panel (XP, capacity, next milestone, maximum);
  - the +15 note, the capacity milestone card and note once, a reload paying nothing;
  - 135/120 BONUS;
  - no clipping or overlap in the HUD (also at 200/120 with 1,250 coins).

  In CI after the extras suite.
- **`tests/v5-next-energy-metrics.mjs`:** the before/after and ablation measurements above.

**Results on the final tree:**
- `node --test tests/v5-*.test.mjs`: 347 pass, 0 fail.
- `node --check` on the V5 modules passes.
- `node tools/coast-crazygames.mjs --check`: up to date.
- Chromium: all 11 Coast Camp browser suites pass (board 360/390/430, playtest, bright 360/390/430/907×510 and reduced motion, CrazyGames, home, story, rewards, saves, extras, energy, Chapter 2). WebKit is not installed in this container; it runs in CI.

**Mobile playthrough** (real page, 390×844, touch, `tools/playthrough-secondary.cjs`, 300 actions, about 25 minutes at 5 s):
- no energy waits and no page errors;
- energy stayed between 26 and 77;
- the Rover's extras unlocked at 7 min;
- the introductory Bolt order appeared at 20 min, after a gold-only stretch (round-3 remaining issue 1, unchanged).

## 7. Remaining limitations

1. **The scripted player is a proxy.** Its energy-45 rules make the first 15–20 minutes look slower (fewer orders and stages, later first Rover level 2) with a full start. A human first-session playtest should decide whether that is real.
2. **Energy stops limiting play for the scripted player across both chapters.** The capacity table is the main cause. The values are trial values as asked; any retuning is the director's call.
3. **The shop's Energy pack and the ad energy offer are rarely needed now.** Their value to a player drops.
4. **Five-digit coin counts** push the menu button off a 360 px screen. This already happens in build 47u; three-digit energy fits at 360 px with four-digit coins.
5. **WebKit and Safari on iPhone are not tested by hand** for this build. CI runs WebKit.
6. **Onboarding inference for pre-47v saves** counts round-3 introductory deliveries as ordinary deliveries. It only ever errs towards "already claimed".
