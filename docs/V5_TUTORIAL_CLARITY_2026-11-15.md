# Vaultwake Merge: tutorial action clarity (PR #105, 2026-11-15)

**Owner feedback (real iPhone):**
- The line said "Tap Ivo's order", but the Deliver control on the card looked unrelated to it.
- A selected wrench on the board competed for attention.

**Superseded in part (2026-11-16) by `docs/V5_TUTORIAL_SPOTLIGHT_2026-11-16.md`:**
- The spotlight replaces this round's line swap, notch, chip pointer, in-line chips and per-mark dimming.
- The cue's words now read "Tap Deliver" · "Get N coins".
- The toast placement and the merge arrow carry over.

**Pass/fail rule:** a player can name the next action from one still screenshot.

**Scope:** not a redesign. The layout system, card sizes, board position, tutorial logic and steps, Hint, Skip, saves, the CrazyGames SDK and every game rule are unchanged.

## 1. What was wrong (before, `702f531`; screenshots in `docs/evidence/v5-tutorial-clarity-2026-11-15/`)

| Problem | Where it showed |
|---|---|
| **The line did not name the control.** "Tap Ivo's order" / "Tap the gold order"; the card's control says "Deliver +10". "Tap the coast strip"; the strip's button says "Build". | Ready order, Gold Order, Build |
| **The line was far from its target.** It sat above the board, under the Coast strip. The Deliver chip sat in the order rail at the top, about 90–140 px away, with the strip between them. | Ready order, Gold Order |
| **A toast covered the target.** A discovery toast ("New: Split spanner") or "Materials secured" appeared at the top, over the order rail. At 360×640 it covered the Deliver chip (toast at 80–280 × 6–90, chip at 28–125 × 69–91). | Ready order, right after the merge that completes it |
| **The board's own marks competed.** After a merge the new part stays selected: gold corner brackets, the same gold as the guide's target. Its twins wear green rings, crates show their keys, and the order cards' held parts glow gold. | Ready order, merge, Gold Order |
| **The merge direction was unclear.** A gold ring (source), a green dashed ring (destination) and a faint moving outline between them. No arrow, and the selected Rover's gold brackets sat right next to the pair. | Merge |

## 2. The fix

**One cue per step, in the game's own language.** Gold marks the thing to press; green dashed marks where a dragged part lands.

1. **The line names the control and its pay, read from the order** (`v5/next/tutor.mjs`):
   - **Crew order:** "Tap **Deliver** to collect 10 coins" · "Ivo's order is ready."
   - **Gold Order:** "Tap **Deliver** to collect 70 coins" · "Plus the materials for Clear the landing path."
   - **Build:** "Tap **Build**" · "Clear the landing path: 40 coins, materials in."
   - The coin amount is the order's own `coins`, the same number as the card's "Deliver +N".
   - In the line, "Deliver" is drawn as a small green chip and "Build" as an orange chip, matching the controls.
2. **The Deliver chip is the target.**
   - The chip keeps its gold ring and soft pulse.
   - A small pointer (20×24) touches the chip's lower edge from the card's free space beside the parts (`chipSpot()` in `v5/next/app.mjs`). It never covers the chip, a part picture, a count or a level tag. With no free space it is left out, and the ring is the cue.
3. **The guidance sits next to its target.**
   - **Ready or Gold Order:** while the step is a Deliver, the guide line moves directly under the order rail, and the Coast strip goes under the line. The two have the same height and spacing, so **the board does not move**. They slide into place in 220 ms (no slide with reduced motion).
   - **Build:** the line is under the strip.
   - **Tap and merge:** the line is right above the board, as before.
   - A gold notch on the line's top edge points at the Deliver chip. For Build, it points at the strip as near its Build button as the line reaches.
4. **Everything else steps back while a target shows** (CSS only):
   - selection brackets: 30% opacity, grey;
   - twin, next-action and order-source rings: a faint neutral line;
   - crate keys: 40%;
   - the held-part glow on other order cards: the guide's thin line colour.
   - **While the target is in the order rail,** toasts show at the foot of the screen instead of over the rail.
   - Selection, controls and game state are unchanged: a tap still selects, and the bottom panel still shows the selected part.
5. **Merge: SOURCE → DESTINATION.**
   - **Source:** a gold ring.
   - **Destination:** a green dashed ring.
   - **Between them:** a small dark arrow (22 px, white edge) on their shared edge or corner, turned toward the destination. When the two cells don't touch, it sits on the source's edge. It nudges toward the destination; with reduced motion it stays still.
   - It replaces the faint moving outline. It takes no tap and lives inside the board.

**Changed files:** `v5/next/tutor.mjs`, `v5/next/app.mjs`, `v5/next/coastal.css`, cache tags in `v5/play.html` (`clarity63a`), and `v5/coast-crazygames.html`, regenerated with `node tools/coast-crazygames.mjs`.

## 3. Measured after (Chromium, real guide played from a new camp)

**Method:** `measure.cjs`, the first full step of each kind, before (`702f531`) and after. Raw data: `docs/evidence/v5-tutorial-clarity-2026-11-15/measure.txt`.

| Check | 360×640 before → after | 390×844 before → after | 430×932 before → after |
|---|---|---|---|
| Ready-order line | "Tap Ivo's order" → "Tap Deliver to collect 10 coins" | same | same |
| Gold Order line | "Tap the gold order" → "Tap Deliver to collect 70 coins" | same | same |
| Build line | "Tap the coast strip" → "Tap Build" | same | same |
| Line to Deliver chip, vertical | 119 → 69 px (the strip no longer sits between them) | 119 → 69 | 121 → 71 |
| Notch pointing at the control (Deliver, Gold, Build) | none → yes | none → yes | none → yes |
| Toast over the Deliver chip (ready order) | **yes** → no | **yes** → no | **yes** → no |
| Selected part's corners while a target shows (opacity) | 1 → 0.3 | 1 → 0.3 | 1 → 0.3 |
| Merge arrow source → destination | none → yes | none → yes | none → yes |
| Board movement through the whole tutorial | 0 → 0 px | 0 → 0 | 0 → 0 |

**Other checks (`audit.cjs` from the previous task, the same full tutorial):**
- The pointer covers no picture, count or word at any step (on the Deliver chip it is 19×23 beside the chip).
- At most 2 looping animations while a board, order or strip target shows: the target's pulse and the pointer's tap, or the merge arrow alone. The coast's Build screen has 4, as before.
- No page errors.

**Before/after sheets, full screen at 2× (one sheet per size):** `docs/evidence/v5-tutorial-clarity-2026-11-15/360x640.jpg`, `390x844.jpg`, `430x932.jpg`. Each has 5 rows: ready order, merge, Gold Order, Build on the board, Build on the coast. 

**Read as a player, one screenshot each:**
- **Ready order:** the line under the cards says "Tap [Deliver] to collect 10 coins". The notch and the pointer lead to the ringed Deliver chip on Ivo's card. Nothing else on screen is gold or moving.
- **Merge:** a gold-ringed part, a dark arrow, a green dashed part.
- **Gold Order:** the same as the ready order, with "Plus the materials for Clear the landing path."
- **Build:** "Tap [Build]" directly under the strip's ringed orange Build button.

## 4. Tests

**`tests/v5-next-tutorial-visual-browser.cjs`** (Chromium and WebKit, 360×640, 390×664, 430×932) now also checks the following at every step:
- **Ready or Gold Order:**
  - the line reads "Tap Deliver to collect N coins", with the card's own pay;
  - the line starts at most 8 px under the order rail;
  - its notch lies over the Deliver chip;
  - the pointer is beside the chip, not over it;
  - no toast covers the card.
- **Merge:** an arrow lies on the line from the source to the destination and points at the destination.
- **Any other selected part:** its corners show at 35% opacity or less.
- **The board:** never moves (as before).
- **On the old build** it fails at 390×664: a selected part's corners show at full opacity during the merge step.

**`tests/v5-next-strip-tap-browser.cjs`:** the guide's line for the strip is now "Tap Build".

**Regressions (local Chromium, served by `tools/ci-static-server.mjs`):**
- `node --test tests/v5-*.test.mjs`: 494 pass.
- All 33 Coast Camp browser suites in `.github/workflows/v5-first-session-2.yml` pass, including:
  - the guide, first-session, initial-view and stable-board suites;
  - the save, cloud-save and CrazyGames suites;
  - all six chapters.
- `v5-next-browser.cjs` and `v5-next-playtest-browser.cjs` also launch WebKit, which is not installed here: their Chromium parts pass.
- CI runs Chromium and WebKit.

## 5. Not covered here

- **Real iPhone Safari:** the 220 ms slide of the line and the strip, and toasts at the foot of the screen above the home indicator. Check on the playtest phones (checklist §3, questions 2, 3 and 7).
- **The hand rests after 6.5 s** (as before). After that the chip's ring, the notch and the line carry the step.
