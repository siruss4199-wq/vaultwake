# Coast Camp first-player guide (build 51c, 2026-11-02)

Branch `claude/v5-first-player-guide`, from `fc65f63` (PR #90's head, Chapter 1's rare goals). Chapters 1–6,
their recipes, drop rates, energy, prices, generator rewards and existing saves are unchanged. No art was
regenerated and no dependency was added.

## The problem
The opening said what to do but not why:
- The story ended with "Answers can wait… let's clear the landing and sort our supplies".
- The board then opened a second introduction of two lines.
- The hint line named the next action ("Tap Rivet Rover for a Copper offcut"), but never said what the
  orders, the gold order and the coast screen were for.

Following that hint alone, a new camp reached its first restoration after **63 actions and 6 crew orders**.
The hint wandered between orders before it reached the gold order.

## What a new player now sees
1. **The story's last scene**, with the same art and the same three scenes. Ivo now says "The letter brought us
   to that Vault. First, let's clear a landing.", and the button reads **Clear a landing**. On the board no
   second introduction follows the story. The beach's own introduction, now this same one line, shows when the story was
   skipped or not shown (a second new camp in the same browser), so the purpose is never missed.
2. **The guide**: a short, one-time introduction to the basic controls, not an order-solving assistant.
   - Each control is highlighted **once**, the first time it is needed: a soft pulsing ring, and for a
     merge pair a ghost of the first part sliding onto the second. With reduced motion the rings stay still
     and nothing moves.
   - Once the player has done that action, it is not taught again. Between highlights the line is a short
     goal with no highlight, and the order cards show the progress as usual (0/1, 1/2…).
   - The steps follow the real starting board and the real first orders:

| Step | The line | Highlighted |
|---|---|---|
| tap | "Tap the Rivet Rover for a part." | the Rover, until the first tap |
| goal | "Goal: Ivo's order. Tap and merge to make the parts it shows." | nothing |
| merge | "Drag one part onto its twin to merge them." | the pair (drag demonstration), until the first merge |
| deliver | "Ivo's order is ready: tap it to deliver for coins." | the order card, until the first delivery |
| coins | "+10 coins from Ivo's order: crew orders pay coins." (about 4 s) | the coin count |
| goal | "Goal: the gold order. Make its parts for the path's materials and coins." | nothing |
| gold | "Tap the gold order: it pays coins and secures the path's materials." | the gold order |
| materials | "Materials secured · +70 coins". The moment's text: "The gold order paid 70 coins and brought the materials for Clear the landing path. Build · 40 coins: tap the strip under the orders." It shows on every gold delivery, guided or not. | (the moment) |
| goal | "Materials secured. Deliver crew orders for the N more coins." (only when coins are short) | nothing |
| build | "Materials secured. Open the coast and build: Clear the landing path." On the coast screen: "Coins and materials are ready: build it here." | the strip, then the Build button (scrolled into view) |

**The first restoration ends the guide.** The message line says once: "Guide complete. Next: Lay a boardwalk:
its gold order brings the materials and coins, crew orders add more coins." From then on the normal hint line
takes over. Later orders, reloads and later restorations never restart it.

- **Coins versus materials:** the distinction is made through the actions themselves. A crew order's coins
  are named as they arrive, the gold order "pays coins and secures the path's materials", and the build step
  says both are ready.
- **One focus at a time:** the goal names only the order the step is about, first the first crew order and
  then the gold order. Other ready orders are left to the player, who can still deliver them.

### Rules the guide keeps
- **Worked out from the camp every time** (`v5/next/coach.mjs`, pure): steps already done are skipped. A player
  who taps, merges or delivers before being asked is not taught it, and a reload resumes the same step.
- **Never asks for something the board can't give.** Highlights come from the existing `primaryAction`: a
  pair only if one exists, the generator only with energy and a free space. Otherwise the line says what to
  do about energy or space and points at nothing.
- **Nothing is blocked:** every control works as before, and the guide only re-words the hint line and adds
  a ring. It sits behind any story card or dialog. Tapping a goal line works like tapping the normal hint
  line (it taps the generator, delivers a ready order or marks a pair), so help comes on request only.
- **Skip guide** sits beside the line. **Help → Replay the guide** plays four crew lines (tap and merge; crew
  orders pay coins; a gold order secures materials; the coast screen rebuilds a place), whatever the camp's
  progress.
- **The daily gift** does not open by itself while the guide runs; its button still shows it. Without this, it
  interrupted new camps after three actions.

### Saves
No new key and no new field. The guide uses two flags in the existing `seen` map:
- `coach-on` is set on the camp's first action.
- `coach-done` is set at the first restoration, or on Skip.

The guide is also off for any camp with a stage built, so a camp saved by an earlier 51c build in the middle
of the old "result" step (path built, `coach-done` not yet set) loads without the guide.

A camp saved before the guide existed that has already played (any action or any stage built) does not get
the guide. The tests cover this.

## Later mechanics, only when they come up (once each, `seen` flags `tip-…`)
- **Merging generators:** while two generators of the same kind and level are on the board, the line says
  "Two Rivet Rovers: drag one onto the other for a stronger Rivet Rover." and marks the pair. This shows only
  after the first loop's guide.
- **Rare extras** (the existing first-level-2 moment): it now also says where they are wanted. For example
  "Merged, they are wanted later: Add a cargo crane (Landing Beach) asks for one.", taken from the stages ahead.
  It names nothing when no later stage asks, and it never promises an immediate rare gold order.
- **Tideglass, at its first crack:** the hits so far and left, and how strong a merge must be: "Tideglass cracked · 1 of 3 — 2 more merges beside it free the part inside. Any merge counts." (or "Each must make a level N part or better" for glass holding a level 3+ part, the rule in `crack()`).
- **The shed, the first time the board is full:** "Tap a part and choose Shed to keep it for later…". This
  is not shown during the first loop's guide.
- **Cargo** is still taught by the existing hint line ("Lay the X on its crate") when a key is in hand.

## Measured
- **Rule test, a new camp following only the guide on the real starting board** (nothing laid on the board,
  no coins given): the **first restoration takes 26 actions**, with 1 crew order and the gold order, and **5 of
  them are highlighted** (tap, merge, deliver, gold, build). The old hint alone took 63 actions and 6 crew
  orders.
- **Browser, 390×844, a genuinely new camp** (Home → Play → the story → the guide only, through the real UI:
  taps, drags, order cards, the strip, the coast screen's Build button): the first restoration takes **26
  actions, 5 highlighted**.
  - A player at 3–5 s per action would need about 1.5–2.5 minutes after the story.
  - This is an estimate, not a timed playtest.

## Tests
- **`tests/v5-next-coach.test.mjs`** (5 tests):
  - a new camp on the real board reaches its first restoration with each control highlighted exactly once,
    in order (tap, merge, deliver, gold, build), goals with no target in between; the restoration ends the
    guide, and a reload or a later ready order does not restart it;
  - steps already done are skipped, and a tap or merge done before being asked is not taught;
  - no energy, or a full board, gives no false target;
  - a reload resumes, older played camps get no guide, and Skip ends it;
  - the generator-merge tip and the rare uses.
- **`tests/v5-next-guide-browser.cjs`** (in CI):
  - **390×844, a new camp through the story and the guide:** no second introduction; each control highlighted
    once, no highlight on the goal steps; the coins line; "Materials secured · +70 coins"; the coast screen's
    Build button in view; "Guide complete. Next: Lay a boardwalk…"; a reload mid-loop resumes the step; after
    the restoration, a reload and a later delivery bring no guide.
  - **360×780 and 907×510 with reduced motion:** the line and its target fit, a tap is not taught twice, and
    the demonstration stays still; Skip, a reload, Help → Replay the guide, and an older played camp with no
    guide.
- **Updated:** `tests/v5-next-story-browser.cjs` for the new last line and button, and for no second
  introduction after the story.

## Remaining confusion and limits
- **The first gold order pays 70 coins, more than the path's 40**, so the first crew order's 10 coins are not
  strictly needed for the first restoration. The guide still shows the loop as "crew orders pay coins; the gold
  order brings materials". From the second stage (the boardwalk, 70 coins, with a smaller gold share) the
  split matters more. This is an economy observation for the opening, reported rather than changed.
- **The guide marks only its own order, once.** Ready crew orders are left to the player and still glow in the
  existing way, so two ready orders can briefly compete for attention.
- **WebKit** cannot be installed here; it runs in CI only.

## PR #91 closeout fixes
- **Tideglass tip:** it said "merge beside it once more" after the first crack, but glass breaks on its third
  hit. It now gives the hits so far and the hits left. It also says how strong a merge must be: one that
  makes a part at least the level of the part inside (any merge for level 1–2 glass).
- **Gold orders pay coins too:** the guide's gold lines, the closing "Guide complete. Next…" line, the Help recap ("A gold order pays
  coins too, and secures the materials…") and the gold delivery moment now say so. The moment reads
  "Materials secured · +70 coins" and "paid 70 coins and brought the materials for …". No economy value
  changed.
- **The coast screen during the guided build:** the Build button scrolls into view by itself. It scrolls
  smoothly after the screen opens, or at once with reduced motion, so the beginner does not have to scroll.
  The guide's line sits above the place card at full width. The browser test checks the button lies inside
  the 390×844 viewport.

## PR #91: a one-time introduction
Clarified scope: a short, one-time introduction to the basic controls, not a permanent order-solving assistant.
- **Before:** every tap and merge toward the first orders was highlighted (26 highlighted actions), and the
  guide ended only on the delivery after the first restoration.
- **Now:** each control is highlighted once (5 highlights). Between them the line is a short goal with no
  highlight, and the order cards show progress. The first restoration ends the guide. Any built stage keeps it
  off, so later orders never restart it.
- **Also fixed:**
  - The order tools' "locate" button redrew the board without the guide's highlight. It now redraws it too.
  - A CI-only failure in the browser test, which counted the merge highlight before its frame was drawn
    (360×780, Chromium), now waits for the highlight.

## Build 51d: varied gold orders, Clear, a pointing guide
Request (2026-11-02): "ehnii 10min toglohod gold orderuud dandaa adilhan baina hovor itemch shaardsangui itemaa
butsaaj burn hiideg songolt heregtei baina mun guide hesgiig sain tod bolgomoor baina yag end touch hii geed".

### Gold orders in the first minutes
- **Measured before (51c, scripted player `tests/v5-next-policy.mjs`, every seed):**
  - the first seven gold orders, through minute 12, all asked "1 Pocket winch + 2 Split spanners" (70 coins);
  - the next three asked "1 Crawler jack + 2 Pocket winches";
  - then came a long run of "1 × X + 2 Pocket winches".
- **Why:** in the opening only the Rivet Rover's chain is open, so the generated recipe
  (`goldNeeds`, "the newest part + two of the tier below") has only one form.
- **Now, in Chapter 1** (the beach, the worksite and the Vault Entrance; Chapters 2–6 and every stage with its own
  recipe or rare part are unchanged): successive gold orders take turns between four shapes of about the same
  worth.
  - The shapes are:
    - the usual recipe;
    - the newest part with four of a lower tier;
    - the second part one tier up, once;
    - the newest part as two of the tier below.
  - With one chain this gives, in order, for example: "1 Pocket winch + 2 Split spanners", "1 Pocket winch + 4 Grip
    tools", "2 Pocket winches", "4 Pocket winches", "1 Crawler jack + 2 Pocket winches", "1 Crawler jack + 4 Split
    spanners".
  - The turn is the number of gold orders already delivered, read from the materials in the save, so two gold
    orders in a row never match and no save field is added.
  - The first gold order is unchanged (70 coins). The pay is still computed from what is asked (`goldPrice`).
- **The order of the shapes was chosen by measurement.** Of the six possible orders, `0,3,1,2` was the only one that
  kept every speed's restorations in the first 15 minutes at or above 51c (5/4/4/4/3/3/2/2 at 4–10 s per action;
  51c: 5/4/4/3/3/3/2/2). The original order cost the 10 s player a restoration.
- **Pacing (`node tests/v5-next-coins-metrics.mjs 4,5,8,10 1,…,10 both --runs board=1`; baseline is the 51c tree):**

| Median at 4 / 5 / 8 / 10 s per action | 51c | 51d |
|---|---|---|
| Runs finished | 80 / 80 | 80 / 80 |
| Chapter 1 minutes | 114.7 / 144.0 / 230.1 / 293.9 | 118.9 / 148.2 / 239.2 / 299.7 (+2–4 %) |
| Whole game, minutes (no shop) | 362 / 451 / 714 / 904 | 353 / 446 / 714 / 881 |
| Gold covers the stage's cost | 60 % | 56 % |
| Board median, Chapter 1 | 12 | 12–13 |

- **Rare parts in the first minutes, tried and not kept:** a Gear goal on the path's third stage, under the existing rare
  rule, came at minute 7 as intended. But Bolts only start dropping once the Rover reaches level 2 (about minute 7), so
  the scripted player needed 12 minutes and 113 taps to finish that gold order, against 4 minutes before. That is a
  wall in the first session, so the first rare goal stays at the pier's crane. Rare parts held before then can be
  cleared (below).

### Clear (burn) any loose part
- The selection panel now offers **Clear** for every loose part. Before, it showed only when 2 cells or fewer were
  free (Build 41 M4).
- **The rule is unchanged** (`recycle`): an everyday part gives back the 1 energy a tap costs ("Clear · +1 ϟ"),
  so it is no energy trick, and a rare part gives nothing ("Clear").
- **Mistakes are guarded:** a part an order wants, a merged part (level 2 and up) or a rare part asks for a second
  tap within 3 s ("Tap again to clear"). A plain level-1 part clears at once.
- The scripted player's use of Clear (only on a full board) is unchanged, so the measurements above do not include
  it.

### A pointing guide
- Each highlighted guide step now also shows a **pointing hand** with a short label:
  - "Tap here" on the generator;
  - "Drag onto its twin" on the pair (the hand slides to the twin);
  - "Tap to deliver" on the order card's Deliver line, so the parts stay visible;
  - "Tap to open the coast" on the strip;
  - "Tap to build" on the coast screen's Build button.
- The hand never takes a tap and sits under any dialog. It is hidden on goal steps and after the guide.
- With reduced motion it stays still. Its label stays on screen near the edges.

### Tests
- **`tests/v5-next-gold-variety.test.mjs`:**
  - the four shapes are different, of about the same worth (±20 %) and within the chain;
  - a new camp's first gold order is unchanged, and no two shaped gold orders in a row match through Chapter 1 on 5
    seeds;
  - the pay follows what is asked;
  - a reload keeps the issued gold order.
- **`tests/v5-next-guide-browser.cjs`:**
  - the hand's fingertip lies on each highlighted target, with its label, at 390, 360 and 907×510;
  - no hand on goal steps;
  - the hand is still with reduced motion;
  - Clear on a plain part (+1 energy, at once) and on a merged part (a second tap).
- **`tests/v5-next-browser.cjs`:** its replay taps Clear twice when the part asks for it.
- **`tests/v5-next-rare-merges-browser.cjs`:** it builds its mast and hoist gold orders with the shape turn pinned to the
  usual recipe, since its flow is about the mast's usual materials and the hoist's Gear.
