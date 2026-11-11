# Vaultwake Merge: mobile vertical spacing fix (Build 57x, 2026-11-11)

- **Branch:** `claude/v5-mobile-spacing-fix`.
- **Base:** `claude/v5-crazygames-release-package` @ `e6eddf6`, the live Basic Launch layout (`vaultwake-merge-crazygames-basic-664956e.zip`).
- **Not used:** none of the rejected Builds 57v/57w (PR #101, on owner HOLD) is used here.
- **Not shipped.** The live ZIP is unchanged.

## What the owner saw (real iPhone)

The owner saw two empty vertical spaces:
1. an oversized white gold-order panel;
2. a large gap between the View/Build restoration strip and the board.

## What made the space (measured, Chromium, chapter-1 camp)

Computed boxes on `e6eddf6` were the same at 360×640, 390×664, 390×744, 390×844 and 430×932.

| Element | Box | Notes |
|---|---|---|
| `#orderTools` (gold panel, open) | 176 px tall | `.orderSay` 32, `.goldRow` 76 (two material chips stacked, plus a 4 px margin), `details.goldHow` 44 (its "How to make these" summary on a line of its own), padding 6 + 6, `gap` 4 |
| `#mapButton` (strip) | 56 px | — |
| `.boardHeading` (guidance line) | **28 px + 3 px margin, but empty** | Both children are `display:none`. `#hint` hides itself when its kind is `upgrade` (`coastal.css:123`: the strip already says it) or `deliver` (`bright.css:242`: the order card says it). `#coachSkip` is `hidden` after the guide. The row kept `min-height:28px`. |
| `#board` | margin-top 2 px | Strip bottom → board top = **33 px**, of which 28 + 3 is the empty guidance line. |

## The fix (`v5/next/coastal.css` only; appended section "Build 57x")

1. **Empty guidance line.** When the hint is one of the kinds that hide themselves (`upgrade`, `deliver`) and Skip guide is hidden, `.boardHeading` is `display:none`, and the board gets `margin-top:8px`.
   - A shown hint keeps its line exactly as before: the guide, energy, space and the rest.
   - No negative margins, no absolute positioning.
2. **Gold order panel, on phones (`max-width:699px`).**
   - "How to make these" (still a 44 px button) sits beside the stage and coins instead of on its own line.
   - Each plain material shows its picture and count. Its name stays in the chip's `aria-label`, and its picture is the one already on the order card above.
   - A rare or not-yet-open material keeps its words.
   - Padding is 4 px and the gap is 2 px.
   - Opened, "How to make these" lists the chains under the materials, inside the panel.
   - Text wraps and is never clipped. The generator buttons stay 44 px.

**Unchanged:**
- gameplay, drag and drop, orders, energy, saves and the SDK;
- the HUD, order rail, strip, board, tiles, shed, dock and footer.

The only other edits are the cache-busting tag (`coastal.css?build=spacing57x` in `v5/play.html`) and the regenerated `v5/coast-crazygames.html`.

## Results (Chromium; same at all listed sizes)

| | Before (`e6eddf6`) | After (57x) |
|---|---|---|
| Strip → board, panel closed | 33 px | **8 px** |
| Strip → board, panel open | 33 px | **8 px** |
| Gold panel height | 176 px | **98–99 px (−44%)** |
| Tile size (360 / 390 / 430 wide) | 44.8 / 49.1 / 54.8 px | unchanged |
| Board bottom, panel open, 390×744 | 833 (of 744: last two rows below the first screen) | **730 (whole board on the first screen)** |
| Board bottom, panel open, 360×640 | 803 (of 640) | 700 (of 640) |
| Board bottom, panel open, 390×664 (iPhone 13 Safari) | 833 (of 664) | 730 (of 664) |
| Page scroll, panel closed, 360×640 | 258 px | 233 px |

## Still true (not in scope; reported, not changed)

- **The page still scrolls on every phone size.** This is the same as the live build: the shed, the Shop/Book row and the footer sit below the board. The brief said not to redesign other parts of the screen.
- **On 360×640 and 390×664 with the gold panel open,** the last board row(s) sit 60–66 px below the first screen. That is down from 163–169 px.
- **On a new camp at 390×664,** the guide's line keeps its place, and the board's last row ends 4 px below the first screen. This is unchanged from the live build.

## Tests

- **New regression test:** `tests/v5-next-spacing-browser.cjs` runs at 360×640, 390×664, 390×744, 390×844 and 430×932, in Chromium and WebKit.
  - **Gaps:**
    - The strip-to-board gap is 6–10 px with the panel closed and with it open.
    - The empty guidance line takes no space.
    - On a new camp, the guide's line still shows between the strip and the board.
  - **Gold panel:**
    - The panel is ≤ 65% of 176 px.
    - Stage, coins, materials (with names and counts in their labels), generator buttons and "How to make these" all show.
    - The 44 px buttons stay 44 px.
    - No text is clipped and nothing overlaps.
    - "How to make these" opens below the materials and closes again.
  - **Board:**
    - Tiles are ≥ 44 px and nothing scrolls sideways.
    - The whole board is on the first screen with the panel closed, and with it open from 744 px tall up.
  - **Check on the old CSS:** it fails on the `e6eddf6` CSS ("the empty guidance line takes no space") and passes on 57x.
- **Unit tests:** `node --test tests/v5-*.test.mjs` gives 465 pass, 0 fail.
- **Coast Camp browser suites (Chromium):** all pass. `v5-next-browser` and `v5-next-playtest-browser` pass in Chromium and then stop at their hard-coded WebKit launch, because WebKit isn't installed in this container. WebKit runs in CI: `.github/workflows/v5-mobile-spacing.yml`.

## Evidence (`docs/evidence/v5-mobile-spacing-2026-11-11/`)

- `1-gold-panel-before-after.jpg`: the panel, open, from the order rail to the board, before and after, at 360×640, 390×744, 390×844 and 430×932.
- `2-strip-board-gap-before-after.jpg`: the strip and the top of the board, panel closed, before and after.
- `3-full-screen-closed-after.jpg` and `3-full-screen-gold-after.jpg`: the whole page after, with the panel closed and open, at the four sizes. A red line marks the bottom of the first screen. They show the complete board and all controls.
- `iphone13-390x664-{view,closed,gold}-57x.jpg`: the first screen at iPhone 13 Safari size (390 × 664, 3×) for a new camp, the chapter-1 camp, and the chapter-1 camp with the gold panel open.

## Not verified here

- **A real iPhone or Android phone,** including Safari's collapsing toolbar and the CrazyGames mobile wrapper. The owner's real-phone PASS is needed before any upload.
