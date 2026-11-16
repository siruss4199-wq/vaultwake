# Vaultwake Merge: tutorial spotlight (PR #105, 2026-11-16)

**Owner feedback (real iPhone):** after several rounds of polish, the tutorial was still not visually clear. The target was highlighted, but everything else on screen stayed just as strong.

**Pass/fail rule:** someone new to Vaultwake names the next interaction from one still screenshot within 2 seconds. Collision checks and green CI are not a substitute.

**Not changed:**
- gameplay, saves, the board layout, the order cards' geometry, tutorial progression;
- Hint and Skip;
- the CrazyGames SDK.

## 1. The minimal parts it is built from

**Existing, reused:**
- `tutorStep()` (`v5/next/tutor.mjs`) already gives the one next action and its target: a cell, a pair of cells, an order or the strip.
- `showCoachTarget()` / `clearCoach()` (`v5/next/app.mjs`) already mark the target (`.coachTarget`, `.coachFrom`, `.coachTo`). They run every time the step changes, ends or is skipped.

**New:**

| Part | Where | What |
|---|---|---|
| `body[data-spot]` | `spotlight()` in `app.mjs`, called by `showCoachTarget` and `clearCoach` | `order`, `strip`, `pair` or `cell` while the tutorial points at something; absent otherwise. Only the tutorial sets it; later tips do not. |
| One CSS block | `coastal.css`, "Tutorial spotlight" | Everything not the target fades to `--spot-dim` (0.38). |
| One cue | `#spotCue`, `spotCue()` / `placeCue()` | For Deliver and Build only: a small dark label. Its tail touches the button, and it sits over the faded area next to it. |
| Merge demonstration | `coachArrow()` | A small arrow and a light copy of the source part gliding to the destination. |

**Removed, so nothing stacks:** the previous round's additions:
- the guide line trading places with the strip;
- the notch on the line;
- the pointer under the Deliver chip;
- the "Deliver"/"Build" chips inside the line;
- the per-mark dimming rules (selection corners, twin rings, crate keys, held-part glows).

The spotlight replaces all of them.

## 2. The treatment

| Step | Full strength | Faded | Cue |
|---|---|---|---|
| **Deliver** (crew) | the order card and its Deliver button (its gold ring) | HUD, other orders, strip, the whole board, shed, panels; the guide line's text (Hint and Skip stay) | **Tap Deliver** · Get 10 coins (the card's own pay), tail on the button |
| **Gold Order** | the gold card and its Deliver button | same as Deliver | **Tap Deliver** · Get 70 coins + materials |
| **Merge** | the source cell (gold ring) and the destination cell (green dashed ring) | HUD, orders, strip, every other cell | none: a small dark arrow on the line between the two cells, and a light copy of the part gliding source → destination and fading. With reduced motion, the arrow alone. |
| **Build** (board) | the Coast strip and its Build button | HUD, orders, the whole board, shed; the guide line's text | **Tap Build** · Spend 40 coins to rebuild, tail on the button |
| **Build** (coast screen) | the scene, the guide line, the card with the Build button | the places strip, the chapter path, Coming next, Back to the board | the line above the card: "Tap Build · Spend 40 coins to rebuild" |
| **Tap** (generator) | the generator cell (gold ring, small pointer at its corner) | everything else | none |

**Rules:**
- **Opacity only.** No overlay, mask or blocking layer. Every tap still lands where it always did, and the test taps a faded cell to prove it. The layout and the board never move.
- **No toast over the cue or the target.** On a Deliver or Build step, toasts move to the foot of the screen.
- **Clears at once:** when the step changes, the guide ends, Skip is pressed, or a quiet step comes. The cue hides on Home, behind the story screen and on the coast screen.
- **A reload restores the same spotlight**, because it is derived from the saved camp.
- **Reduced motion:** the cue and the merge arrow stay still, and there is no gliding copy.

**Copy** (from the order, so it always matches the card):
- Deliver: "Tap Deliver" · "Get N coins" (Gold: "Get N coins + materials").
- Build: "Tap Build" · "Spend N coins to rebuild".
- The guide line shows the same words, faded, under the cue's spotlight.

## 3. Screenshots and the 2-second read

**Files:** before (`d671dfa`) | after, full screen at 2×. One sheet per size: `docs/evidence/v5-tutorial-spotlight-2026-11-16/360x640.jpg`, `390x664.jpg`, `390x844.jpg`, `430x932.jpg`. Rows: A Deliver, B Merge, C Gold Order, D Build on the board, Build on the coast screen.

**After only, at actual size** (1 CSS pixel = 1 image pixel, A–D side by side): `after-ABCD-<size>.png` in the same folder.

**My reading of the after screenshots,** the same at all four sizes (I am not a stranger to the game; the playtest is the real check):

| Shot | What draws the eye first | The next interaction |
|---|---|---|
| A Deliver | A dark label, "Tap Deliver · Get 10 coins", with its tail on the green "Deliver +10" button of the only bright card. | Tap that button. |
| B Merge | The only two bright cells on the board (two Copper offcuts), with a small arrow from the gold-ringed one to the green dashed one. | Drag the gold-ringed part onto the other. |
| C Gold Order | The same label, "Tap Deliver · Get 70 coins + materials", on the gold card's button. | Tap that button. |
| D Build | "Tap Build · Spend 40 coins to rebuild", with its tail on the orange Build button of the only bright strip. On the coast screen: the card with the big Build button; the rest faded. | Tap Build. |

**Before** (`d671dfa`), for comparison, every element kept full colour:
- the HUD;
- the three order cards;
- the strip with its teal View button;
- 49 cells;
- the selected part's gold corners;
- the dark merge name pill.

**Measured** on the same runs (`audit.cjs`, the full tutorial at each size):
- board movement 0 px;
- no page errors;
- the pointer covers nothing;
- at most 2 looping animations while a board, order or strip target shows (the target's pulse, plus the pointer's tap or the merge's gliding copy).

**The toasts** ("New: Split spanner", "Materials secured") still show, faded and at the foot of the screen, during a Deliver or Build step.

## 4. Tests

**`tests/v5-next-tutorial-visual-browser.cjs`** (Chromium and WebKit; 360×640, 390×664, 390×844 and 430×932) plays the real guide to the first Build. At every step it checks:
- the target at full strength;
- the HUD, strip, other orders and other cells at 0.5 or less;
- on Deliver:
  - the cue reads "Tap Deliver" plus the card's own pay;
  - its tail touches the button (within 4 px);
  - it covers neither the button nor the card;
  - no toast covers either;
- on Build: the cue reads "Tap Build" and touches the Build button;
- on a merge: the arrow lies between the source and the destination;
- on a quiet step: nothing faded.

**In addition:**
- **A faded cell still takes a tap:** a tap on one selects it.
- **Reload on a Deliver step:** Home, then Continue, restores the spotlight and the cue.
- **Skip:** clears the spotlight at once.
- **The coast screen:** the Build button at full strength, the places strip faded.
- **The board:** never moves (as before).

**Regressions (local Chromium):**
- `node --test tests/v5-*.test.mjs`: 494 pass.
- All 33 Coast Camp browser suites pass, including:
  - the guide, first-session, initial-view, stable-board and strip-tap suites;
  - the save, cloud-save and CrazyGames suites;
  - all six chapters.
- `v5-next-browser.cjs` and `v5-next-playtest-browser.cjs` also launch WebKit, which is not installed here: their Chromium parts pass.
- CI runs Chromium and WebKit.

## 5. Not covered here

- **Real iPhone Safari:** check the playtest phones (checklist §3, questions 1–3). Look at the cue's position under the notch and the home indicator, and whether the fade reads as "not now" rather than "disabled".
- **An unfamiliar player's 2-second read** is the real acceptance test. §3 records my reading of the screenshots; the playtest sheet records first-tap times.
