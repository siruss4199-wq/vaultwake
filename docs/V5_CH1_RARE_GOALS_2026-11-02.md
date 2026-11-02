# Coast Camp Chapter 1 rare merge goals (build 51b, 2026-11-02)

Branch `claude/v5-ch1-rare-goals`, from `c4b3b6e` (Chapter 6, PR #89's head). Earlier chapters' work is kept.

The problem, from playtests: Chapter 1 drops rare parts, but its 45 gold stages asked for one only once
("Gear the hoist"). Landing Beach and the Vault Entrance asked for none.

## Stages that now ask a merged rare part

| # | Stage (area) | Rare part (replaces) | Why it fits | Exact unlock condition |
|---|---|---|---|---|
| 1 | Add a cargo crane (beach pier 2) | **Gear** (`mech` 1), replacing the second material | crane machinery | A level-2+ Rivet Rover is **on the board** when the gold order is made; the Gear chain opens with it. |
| 2 | Open the cliff gate (beach cliff 3) | **Expedition note** (`notes` 1) | the surveyed route up to the Survey Worksite | A level-2+ Survey Kite is on the board when the gold order is made. |
| 3 | Chart the whole cliff (worksite scope 3) | **Travel notebook** (`notes` 2) | charting the cliff | A level-2+ Survey Kite is on the board. |
| 4 | Gear the hoist (worksite hoist 2) | **Gear** (`mech` 1), unchanged | geared hoist | A level-2+ Rivet Rover is on the board. |
| 5 | Map the dial (worksite door 3) | **Expedition note** (`notes` 1) | mapping the dial | A level-2+ Survey Kite is on the board. |
| 6 | Turn the middle ring (Vault Entrance 2) | **Gear assembly** (`mech` 2) | the ring's mechanism | A level-2+ Rivet Rover is on the board. |

- **Recipe shape:** each recipe keeps two requirements, and the rare part replaces the second one. No stage
  asks for a single Bolt or a Note fragment.
- **Order:** the first Gear goal is on the beach, the first note goal comes after it on the beach, and the
  later goals ask for a Travel notebook and a Gear assembly. Under the scripted player, the first Gear goal
  arrives at a median of 72 minutes.

### Unlock dependencies, checked for every route
- **How a generator reaches level 2:** two generators of the same level are merged. A Rivet Rover reaches
  level 2 when the player merges a second Rover into the first.
- **How the chains open:** a Rover's first level 2 opens the Gear chain. The Survey Kite appears only once a
  Rover reaches level 3 (four Rovers), and a Kite's first level 2 opens the notes chain.
- **The rule (`secondaryCanDrop`, checked when the gold order is made):** a rare part is asked only if a
  generator of its chain at level 2 or higher is **on the board** at that moment.
  - Copies the player was given but has not merged do not count.
  - Without such a generator, the stage asks its usual materials, so nothing blocks and nothing loops.
- **No stage needs its own reward:**
  - The crane's own reward is a copy of the newest generator, and its Gear check runs before that reward
    exists.
  - Before the crane, the workshop's first stage (on every route to the pier) gives a copy of the newest
    generator. That copy is either a second Rover, so level 2 is one merge away, or proof the Rover is already
    level 3.
  - No stage asks for a part from the chain its own copy would unlock (tested).
- **Notes need a Kite at level 2.** Rover copies are on the beach (path 2 and 3, tent 2, mast 2, workshop 1)
  and the beach's later copies are Kites (pier 2, beacon 2, cliff 2), so the route to a level-2 Kite is
  there before the cliff gate. On beach routes that skip the Rover copies, the cliff gate asks its usual
  materials.
- **Measured on 40 policy runs and 40 random-route runs** (a random open stage aimed after each build):
  - From the gold orders of tent 3, mast 3, pier 1 and workshop 2 onward, a level-2 Rover was on the board on
    every run.
  - From cliff 2, beacon 3 and cliff 3 onward, and across the whole worksite, a level-2 Kite was on the board
    on every run.

### Not two in a row
In Chapter 1, the gold order after a rare one goes to an open place without a rare goal, when there is one
(`storyTarget`, saved flag `s.rareLast`). The rare stage then waits its turn; its goal is neither dropped nor
lowered. Two exceptions:
- The player's own choice of place (aim) is respected.
- When the rare stage is the only open place, it comes next anyway.

Chapters 2–6 do not use this rule, and their recipes are unchanged.

### Stable goals
- An issued rare gold order is never rebuilt with common parts or a lower tier, whether across a reload,
  after the generator moves, or when the player aims elsewhere and back. All of these are tested.
- The rest is unchanged:
  - the gold-objective guarantee (`goldPity` 8);
  - drop rates (5 %, certain by the 20th tap);
  - energy and capacity;
  - generators;
  - pending rewards and full-board safety.

## Saves
- **New field:** `s.rareLast` is optional and holds only `true`. An absent field means false. A damaged value
  is dropped on load (tested).
- **Unchanged:** existing gold orders are never overwritten, and material credits already delivered stay with
  their stage, which needs no new gold order. Board, shed and pending rewards are untouched (tested).
- **When an existing Chapter 1 save first meets a new rare goal:** the first time the game makes the gold
  order for the crane (pier 2), the cliff gate (cliff 3), the cliff chart (scope 3), the dial map (door 3) or
  the middle ring (Vault Entrance 2).
  - The game makes that order when the stage before it is built, when a crew order is delivered while no gold
    order is up, or when the player picks that place.
  - At that moment the matching generator must be at level 2 on the board; otherwise the stage asks its usual
    materials.
  - A save that already holds the gold order for one of these stages keeps that order as it was issued; the new
    recipe applies only to gold orders made from now on.
  - A save already past a stage never meets that stage's goal.

## Pacing, build 51a → 51b
Command: `node tests/v5-next-coins-metrics.mjs 4,5,8,10 1,2,3,4,5,6,7,8,9,10 both --runs board=1`. Base:
`ROOT=<c4b3b6e tree>`, the same seeds and the same policy. 80 runs each.

| Chapter 1, median per speed (4 / 5 / 8 / 10 s per action) | 51a | 51b |
|---|---|---|
| Runs finished | 80 / 80 | 80 / 80 |
| Chapter 1 minutes | 114.0 / 143.7 / 229.1 / 289.5 | 114.4 / 143.8 / 229.9 / 293.8 (+0–1.5 %) |
| Rare gold goals in Chapter 1, per run | 1 | **6** on every run |
| Idle waiting for energy in Chapter 1 (median / max) | 0 / 25.7 min | 0 / 5.2 min |
| Board median, Chapter 1 | 12 | 12 |
| Longest wait from materials to build | 22.0 / 20.3 / 29.6 / 33.9 | 12.2 / 18.2 / 25.4 / 33.3 |
| Rare-only pursuit (median / max over every speed) | 0.2–2.1 / 6.0 min | 0.9–2.0 / 12.9 min, at most 32 taps |
| Gold covers the stage's cost | 61.6 % | 60.0 % |
| Whole game, minutes | 360 / 450 / 723 / 901 | 360 / 450 / 714 / 901 |

Chapters 2–6 move within ±3 % per speed. Their recipes are unchanged; the difference comes from the states
Chapter 1 leaves behind. Chapter 2's board median goes from 16–18 to 18.

Per stage, the longest rare-only pursuits:

| Stage | Max rare-only pursuit | Max taps |
|---|---|---|
| Middle ring (Gear assembly) | 11.9 min | 32 |
| Cliff chart (Travel notebook) | 12.9 min | 29 |
| Crane | 9.7 min | 16 |
| Dial map | 6.2 min | 13 |
| Cliff gate | 3.5 min | 16 |
| Hoist | 4.6 min | 16 |

These worst cases are at 10 s per action. They are bounded by the guarantee in taps, not in minutes, and no
progression blocked. These are simulation results for one scripted policy; they do not show whether the
goals are fun.

## Tests
- **`tests/v5-next-ch1-rare.test.mjs`** (7 tests):
  - The six stages and their parts, with one material replaced and no stage giving the copy its chain needs.
  - **120 random routes** through all 45 stages for a player who merges generator copies:
    - no route blocks;
    - a rare part is asked only while its chain can drop, and is skipped only when it cannot;
    - no two rare goals come in a row while another place is open;
    - each goal is met on at least 75 % of routes.
  - **60 random routes** for a player who never merges a copy: no rare goal, and no block.
  - The crane asks for a Gear with a level-2 Rover. Without one, three unmerged copies do not count.
  - The goal is stable across a reload, a moved Rover and aiming elsewhere and back, whatever the player
    holds (nothing, a Bolt or a Gear assembly).
  - The not-two-in-a-row rule, the player's choice winning, and `rareLast` loading (absent, damaged, kept).
  - Saves: an issued gold order and delivered credits are kept, board, shed and pending rewards are untouched,
    and the drop rules are unchanged.
- **`tests/v5-next-ch1-rare-browser.cjs`** (at 390×844 and 360×780, touch), played through the real UI:
  1. merge two Rovers by drag, which opens the Gear chain;
  2. build the pier's first stage, which brings up the crane's gold order asking for a Gear, with the
     guarantee shown in taps;
  3. tap the Rover until two Bolts drop (8 taps);
  4. drag a Bolt onto the other to make a Gear;
  5. deliver the gold order ("Materials secured");
  6. build the crane, charged once;
  7. reload, and check that nothing repeats.

  It is added to CI.
- **Updated:** `tests/v5-next-rare-merges.test.mjs` now lists the eleven rare stages; the old line "the beach
  asks none" was deliberately removed. `tests/v5-next-coins-metrics.mjs` gains `idleMin` per chapter.
