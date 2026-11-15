# Vaultwake Merge: stable gameplay viewport (PR #105, 2026-11-15)

**Owner decisions:** keep the proportional layout system and the Order Details bottom sheet; do not expand Details inside an order card.

**Unchanged:** rules, saves, assets and the CrazyGames SDK.

## 1. Measured before (`4724124`; `docs/evidence/v5-stable-board-2026-11-15/measure-before.txt`)

**Board jump:**
- Selecting an order showed the row holding the 💡 Hint (44 px) and Details (71 × 44 px) above the board. That row is hidden (`display:none`) when it holds nothing.
- The board moved down **41 px** on select and back on deselect: 212 → 253 → 212 at every phone size. 214 → 255 at 430 × 932.
- On the 907 × 510 desktop embed the board sits in its own column and did not move.

**Story caption:**
- The new player's caption was pinned to the bottom of the screen.
- At 360 × 640, 375 × 667 and 390 × 664 it covered **all 7 cells of the bottom row**: the cell centres hit the caption.
- At 907 × 510 it covered 4 cells.

## 2. The fix (`v5/next/app.mjs`, `v5/next/coastal.css`)

**Board jump.** The Hint/Details row now follows the guide line:
- **During the tutorial** it carries the guide line and sits above the board, where it stays for the whole tutorial. Selecting an order adds Details to a row that is already there, so nothing moves.
- **Otherwise** it sits just below the board (after the free-space tab, before the shed). Showing or hiding it moves only the shed. It never covers a tile or the strip.
- **When it switches** (`placeHeading()`): an observer on the guide line's kind moves the row, plus one call at start.
- **Landscape:** the left column keeps its order, because the board has its own column.
- **No permanent gap:** with nothing to show, the row is still hidden.

**Story caption** (`placeRibbon()`):
- It keeps its words, Story (replays the illustrated opening) and × (folds it).
- It still folds at the first action.
- It is more compact: 32 px face and 12.5 px text, with 44 px buttons.
- It is pinned to the bottom only where that leaves the board clear (it measures the board): 390 × 844 and 430 × 932.
- Elsewhere it sits in the page just below the board, before the shed: 360 × 640, 375 × 667, 390 × 664 and the desktop embed's left column. It never covers a cell or a control, and folding it moves only what is below the board.
- It is placed again on resize.

## 3. Measured after (`measure-after.txt`; finger taps at element centres)

| Viewport | Board Y: start → select → Details closed → deselect | Details | Story caption | Board cells covered (new player) |
|---|---|---|---|---|
| 360 × 640 | 206 → 206 → 206 → 206 (0 px) | 554–598, opens the sheet | in the page below the board (606–674) | 0 (was 7) |
| 375 × 667 | 206 → 206 → 206 → 206 (0 px) | 569–613 | below the board (621–673) | 0 (was 7) |
| 390 × 664 | 206 → 206 → 206 → 206 (0 px) | 584–628 | below the board (636–688) | 0 (was 7) |
| 390 × 844 | 206 → 206 → 206 → 206 (0 px) | 584–628 | pinned at the bottom (782–834) | 0 |
| 430 × 932 | 208 → 208 → 208 → 208 (0 px) | 626–670 | pinned at the bottom (870–922) | 0 |
| 907 × 510 | 10 → 10 → 10 (0 px; Details panel in the left column, as before) | left column | left column (263–316) | 0 (was 4) |

**Other checks, all viewports:**
- In the tutorial, selecting and deselecting an order: 0 px.
- Three orders in view; no clipped text; no page errors.
- The board now starts 6 px higher in the returning state (212 → 206), because the empty row no longer sits above it.

**One trade-off.** On short phones the story caption sits below the board, so only its top part is in view (about 30 px at 390 × 664) until the player scrolls or acts. Its words stay one scroll away, and the tutorial guide line above the board carries the first instruction. Showing it in full there would mean covering board cells or moving the board.

## 4. Tests

**New `tests/v5-next-stable-board-browser.cjs`** (Chromium and WebKit, in CI). Finger taps at all six viewports check:
- select, deselect and Details-sheet open/close each keep the board within 2 px;
- Details is in view and covers neither the board nor the strip;
- the story caption covers neither the board nor the HUD, rail, strip or guide row;
- all 49 cells are reachable;
- three orders are in view; no clipped text;
- × folds the caption;
- it fails on `4724124` (390 × 664: 212 → 253).

**Results:**
- Unit tests: 494 pass.
- All 32 Coast Camp browser suites pass in Chromium (with the new one): first session (tutorial), guide, story, Home, saves, CrazyGames, CrazyGames saves, build flow, core actions (Details sheet), chapters 1–6 and the rest.
- WebKit runs in CI.
