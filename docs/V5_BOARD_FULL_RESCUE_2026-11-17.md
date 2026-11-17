# V5 Coast Camp — Board Full Rescue (2026-11-17)

Branch `claude/v5-board-full-rescue`, from `ae83302`, the verified Shed-overlay hotfix head (CI run 44031904946 green on Chromium and WebKit). The Shed fix, its test and its evidence are untouched. This is a draft: nothing merged, packaged or published.

## Problem
When the board fills up (no free space), the player is told only "Board full · deliver, merge or store a part", or nothing at all.
- On a full board where a Build is ready or an order can be delivered, the row with the Hint button was hidden (`coastal.css`: the row takes no space when the strip or an order card already says it). So the Hint could not even be pressed.
- The first full board after the tutorial raised a pop-up note once ("The board is full").
- Nothing pointed at what to do, and the Shed (select a part, then press Shed in the panel under the board) and the confirmed Clear were never shown.

## What it does
A pure module, `v5/next/rescue.mjs`, works out the one step for a full board from the camp as it is. It only reads; it never changes the camp. Every action it names is dry-run through the game's reducer `act()` on a copy, and is offered only if the reducer accepts it **and** it frees room: a free space, or a waiting reward that lands in it.

Priority:
1. **Deliver a ready order.** The gold order comes first, then crew orders that leave the gold order's parts alone. The line: "Tap Deliver · Frees 2 spaces · +10 coins".
2. **Merge two identical parts.** A merge that would undo an order's progress (merging the two parts an order counts as they are) is held back.
3. **Another space-freeing action:**
   - a part laid on the cargo it opens;
   - two crates of a kind merged;
   - two generators of a kind and level merged;
   - a Brass cog laid on a generator.
4. **Store in a free Shed space.** First "Tap the Driftwood crate" (the part is highlighted), then, once it is selected, "Tap Shed" (the panel's Shed button is highlighted).
   - The order of preference is a crate, a token, a cog, a part no order wants, then a wanted part.
   - Shedding is undone with one tap, so even a wanted part is safer here than merging or clearing.
5. **Clear**, only when nothing above frees a space. It is always confirmed: "Tap Clear", then "Tap Clear again" (the game's own two-tap Clear, forced on for the rescue's part).
   - Clear goes first to a part no order wants, lowest level first.
   - If no such part exists, the merge held back in step 2 is offered before clearing a wanted part.
   - The cheapest everyday part is the last resort. A rare part is never chosen.
6. **Nothing frees a space.** The line explains it ("The board is full · The shed is full too: deliver an order when its parts are ready."). Nothing is highlighted.

**Presentation:** it reuses the tutorial's Spotlight and its one cue.
- The target keeps its colour and its gold ring; everything else fades (opacity only, so every tap still lands).
- A pair gets its arrow and gliding demonstration.
- Deliver, Shed and Clear get the dark cue at the button.
- There is one short instruction at a time, in the existing guide line. No new pop-ups or panels; the old one-time note was replaced.
- The only new Spotlight target is the selected part's Shed or Clear button (`data-spot="action"`).
  - The panel stays; the board and the panel's other buttons step back.
  - If the button is below the fold, it is scrolled into view once.

**Behaviour:**

| | |
|---|---|
| Activates | only with zero free spaces |
| Shown on its own | once: the first full board after the tutorial (the existing seen flag `tip-shed`, which the old note used; a camp that already had that note is not told again) |
| Hint | shows the current step any time the board is full. On a full board the Hint's row stays shown, even when the game's own line is a Deliver or Upgrade one |
| Dismissed | as soon as a space is free |
| Updates | each time the camp or the selection changes (select → Shed, Clear → Clear again, a reward that lands → the next step) |
| Interruptions | none: it never opens a dialog, never auto-repeats, never takes a tap; the first-tutorial idle reminder is unchanged |
| Board position | unchanged: after the tutorial the rescue line stays in the row's place under the board (tested: the board's top is the same before and after) |
| First tutorial | unchanged. It still ends at the first Build. On a full board during it, the rescue only replaces the tutorial's old "The board is full" dead end (no target) |

**Preserved:**
- Gameplay, economy and reducer are unchanged: `game.mjs`, `tutor.mjs`, `guide.mjs` and `coach.mjs` are untouched.
- The save format is unchanged: no new key or field. The one seen flag is the existing `tip-shed`, whose key format all builds accept (`SEEN_ID`, the same in `664956e`, `822a8f9` and `ecde162`), so a rollback is safe.
- `mobile.css` and `style.css` are untouched; the Shed hotfix rule is unchanged.

**Files:**
- `v5/next/rescue.mjs` (new)
- `v5/next/app.mjs` (wiring)
- `v5/next/coastal.css` (the action spotlight; the Hint row kept on a full board)
- `v5/play.html` (cache tags `rescue67a`, module preload list)
- `v5/coast-crazygames.html` (regenerated)
- tests and workflow

## QA
**Unit: `tests/v5-next-rescue.test.mjs`** (real reducer). It covers:
- only on a full board;
- deliver first (the gold order before a crew order);
- a merge;
- a merge that undoes order progress, held back while the Shed can take something;
- cargo, crates, generators, cog;
- Shed in two steps;
- Shed full: Clear in three steps, the lowest level first, a part no order wants;
- a waiting reward that lands;
- nothing possible;
- 240 seeded random full boards. The camp is never changed, and every step is accepted by `act()` and frees room. A select step leads to the same action on its button.

`node --test tests/v5-*.test.mjs`: 504/504 pass.

**Browser: `tests/v5-next-board-rescue-browser.cjs`.** Real UI, real taps and drags, Chromium and WebKit at 390×664 and 375×667 (iPhone screens with Safari's bars). It does exactly what the guide highlights and checks that a space opens:

| case | checks |
|---|---|
| A. ready order, first full board | guides on its own in full; Deliver in the spotlight, with the cue "Tap Deliver · Frees 2 spaces"; tapping it frees 2; the guide goes; no repeat after a reload |
| B. valid merge (and G. reload + Hint) | nothing on its own; Hint → the pair, the board does not move; after a reload nothing on its own and the Hint shows the same step; the drag frees 1 |
| C. empty Shed space | Hint → "Tap the Driftwood crate" → "Tap Shed" (cue at the button, on screen); stored, frees 1, nothing lost; the stored crate's tag is a small dot (the hotfix) |
| D. Shed full | Hint → the part → "Tap Clear" → the first tap clears nothing ("Tap Clear again") → the second frees 1, only that part goes |
| E. pending rewards | the merge frees a space and the waiting reward lands in it; the guide moves on to the next step by itself |
| F. no valid safe action | "The board is full", no spotlight, no target, the reason in the message line |

Every case also checks: no page errors, and nothing duplicated or lost (board + shed + waiting rewards).

| run | result |
|---|---|
| browser test, Chromium, local (390×664, 375×667) | PASS |
| browser test, Chromium + WebKit, CI | see the PR's CI |
| all Coast Camp browser suites, Chromium, local | see the PR |

## Evidence
`docs/evidence/v5-board-full-rescue-2026-11-17/` has sheets at actual phone scale (Chromium 390×664, 2× pixels), with the same camps on both builds:
- `before-chromium-390x664.jpg`: the hotfix head `ae83302`. Nothing points anywhere on a full board, and the Hint row is not shown.
- `after-chromium-390x664.jpg`:
  1. the first full board: Deliver;
  2. Hint: the crate;
  3. selected: Shed;
  4. Shed full: Clear, confirm.
- `shots.cjs` (the script) and `rows-chromium-390x664.json` (each case's line, spotlight and message).

## Open points (owner)
- **Clear on a wanted part.** When every part is wanted, the Shed is full and nothing merges, the last resort points at the cheapest everyday part, with the two-tap confirmation. The alternative is to explain only (no target), at the risk of a player stuck until they find Clear alone. Current choice: point, confirmed.
- **The once-only trigger reuses `tip-shed`.** Players who already saw the old "The board is full" note get the rescue only from the Hint.
- **No real-device run yet.** Android Chrome and iPhone Safari are not tested here.
