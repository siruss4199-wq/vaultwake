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
2. **The guide**: one short sentence in the existing hint line and one highlighted target.
   - The target gets a soft pulsing ring. For a pair to merge, a ghost of the first part slides onto the
     second.
   - With reduced motion the rings stay still and nothing moves.
   - The steps follow the real starting board and the real first orders:

| Step | The line | The target |
|---|---|---|
| tap | "Tap the Rivet Rover for a part." | the Rover |
| merge | "Drag one part onto its twin to merge them." The first time, then "Merge twins up to the part the order shows." | the pair (drag demonstration) |
| deliver | "Ivo's order is ready: tap it to deliver for coins." | the order card |
| coins | "+10 coins from Ivo's order: crew orders pay coins." (about 4 s) | the coin count |
| gold | "Make the gold order's parts: they are the path's materials." Then "Tap the gold order: it secures the path's materials." | the pair or Rover, then the gold order |
| materials | "Materials secured · Clear the landing path". The moment's text: "The gold order brought what the repair needs. Build · 40 coins: tap the strip under the orders." | (the moment) |
| build | "Materials secured. Open the coast and build: Clear the landing path." On the coast screen: "Coins and materials are ready: build it here." | the strip, then the Build button |
| result | "The path is clear. Next: Lay a boardwalk, with materials from its gold order and coins from crew orders." | the strip (the next objective) |

The next delivery ends the guide.

- **Coins versus materials:** the distinction is made through the actions themselves. A crew order's coins
  are named as they arrive, the gold order "secures the path's materials", and the build step says both
  are ready.
- **One focus at a time:** the guide points only at the order the step is about, first the first crew
  order and then the gold order. Other ready orders are left to the player, who can still deliver them.

### Rules the guide keeps
- **Worked out from the camp every time** (`v5/next/coach.mjs`, pure): steps already done are skipped. A player
  who merges or delivers before being asked is not asked again, and a reload resumes the same step.
- **Never asks for something the board can't give.** Board targets come from the existing `primaryAction`: a
  pair only if one exists, the generator only with energy and a free space. Otherwise the line says what to
  do about energy or space and points at nothing.
- **Nothing is blocked:** every control works as before, and the guide only re-words the hint line and adds
  a ring. It sits behind any story card or dialog.
- **Skip guide** sits beside the line. **Help → Replay the guide** plays four crew lines (tap and merge; crew
  orders pay coins; a gold order secures materials; the coast screen rebuilds a place), whatever the camp's
  progress.
- **The daily gift** does not open by itself while the guide runs; its button still shows it. Without this, it
  interrupted new camps after three actions.

### Saves
No new key and no new field. The guide uses two flags in the existing `seen` map:
- `coach-on` is set on the camp's first action.
- `coach-done` is set when the guide is finished or skipped.

A camp saved before the guide existed that has already played (any action or any stage built) does not get
the guide. The tests cover this.

## Later mechanics, only when they come up (once each, `seen` flags `tip-…`)
- **Merging generators:** while two generators of the same kind and level are on the board, the line says
  "Two Rivet Rovers: drag one onto the other for a stronger Rivet Rover." and marks the pair. This shows only
  after the first loop's guide.
- **Rare extras** (the existing first-level-2 moment): it now also says where they are wanted. For example
  "Merged, they are wanted later: Add a cargo crane (Landing Beach) asks for one.", taken from the stages ahead.
  It names nothing when no later stage asks, and it never promises an immediate rare gold order.
- **Tideglass, at its first crack:** "Merge beside it once more to free the part inside."
- **The shed, the first time the board is full:** "Tap a part and choose Shed to keep it for later…". This
  is not shown during the first loop's guide.
- **Cargo** is still taught by the existing hint line ("Lay the X on its crate") when a key is in hand.

## Measured
- **Rule test, a new camp following only the guide on the real starting board** (nothing laid on the board,
  no coins given): the **first restoration takes 26 actions**, with 1 crew order and the gold order. The old
  hint alone took 63 actions and 6 crew orders.
- **Browser, 390×844, a genuinely new camp** (Home → Play → the story → the guide only, through the real UI:
  taps, drags, order cards, the strip, the coast screen's Build button): the first restoration takes **26
  guided actions**.
  - A player at 3–5 s per action would need about 1.5–2.5 minutes after the story.
  - This is an estimate, not a timed playtest.

## Tests
- **`tests/v5-next-coach.test.mjs`** (5 tests):
  - the guide alone reaches the first restoration in order (tap, merge, deliver, gold, build, result), with no
    target that isn't there;
  - steps already done are skipped;
  - no energy, or a full board, gives no false target;
  - a reload resumes, older played camps get no guide, and Skip ends it;
  - the generator-merge tip and the rare uses.
- **`tests/v5-next-guide-browser.cjs`** (in CI):
  - **390×844, a new camp through the story and the guide only:** no second introduction; the coins line;
    "Materials secured"; the coast screen's marked Build button; the result; a reload mid-loop resumes the
    step; a reload keeps the result; the next delivery ends the guide.
  - **360×780 and 907×510 with reduced motion:** the line and its target fit, and the demonstration stays
    still; Skip, a reload, Help → Replay the guide, and an older played camp with no guide.
- **Updated:** `tests/v5-next-story-browser.cjs` for the new last line and button, and for no second
  introduction after the story.

## Remaining confusion and limits
- **The first gold order pays 70 coins, more than the path's 40**, so the first crew order's 10 coins are not
  strictly needed for the first restoration. The guide still shows the loop as "crew orders pay coins; the gold
  order brings materials". From the second stage (the boardwalk, 70 coins, with a smaller gold share) the
  split matters more. This is an economy observation for the opening, reported rather than changed.
- **The coast screen at 390 px** shows the picture first. The marked Build button and the guide's line sit
  below the picture, so a player may need to scroll a little.
- **The guide marks only its own order.** Ready crew orders are left to the player and still glow in the
  existing way, so two ready orders can briefly compete for attention.
- **WebKit** cannot be installed here; it runs in CI only.
