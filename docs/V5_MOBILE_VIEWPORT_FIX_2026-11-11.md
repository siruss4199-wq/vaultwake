# Vaultwake Merge: P0 mobile viewport fix (Build 57v, 2026-11-11)

Branch `claude/v5-mobile-viewport-fix`, from `claude/v5-crazygames-release-package` @ `e6eddf6` (the live Basic Launch source, ZIP `vaultwake-merge-crazygames-basic-664956e.zip`).

**Not shipped.** The live ZIP in `release/crazygames-basic/` is unchanged. A new upload needs the owner's approval and then a rebuilt ZIP with a new checksum.

## The problem (owner, real phone, CrazyGames)

During normal play the player had to scroll the page up and down between three things:
- the orders;
- the gold order's panel;
- the merge board.

**Reproduced in Chromium** (stand-in SDK, chapter-1 camp `tests/fixtures/coast/coast-ch1-pre-secondary.json`):

| State | 360×640 | 390×744 | 390×844 | 430×932 |
|---|---|---|---|---|
| Board only: page scrolls by | 258 px | 184 px | 84 px | 36 px |
| Gold order tapped: board bottom vs screen | 803 / 640 | 833 / 744 | 833 / 844 | 873 / 932 |
| Gold order tapped: page scrolls by | 477 px | 403 px | 303 px | 255 px |
| "How to make these" open: board bottom | 862 / 640 | 892 / 744 | 892 / 844 | 932 / 932 |

**Short landscape** (740×360, 844×390): the left column ran to 496–777 px, so the page scrolled.

### Causes

- **Gold order panel.** It was inserted between the order rail and the board, so it pushed the board down:
  - 176 px for the panel alone;
  - 235 px with "How to make these" open.
- **Page bottom.** `v5/mobile.css` gives `.game` `min-height:100svh` and an 80 px bottom padding.
- **Content below the board.** The shed, the 82 px Shop/Book/Gift dock, the status line and the footer (How to play, Sound, Vibration, Field ration) all sat in the page flow under the board.
- **Board sizing.** The board kept full width on every phone. `coastal.css` accepted a page scroll for the last row: on 2026-10-26 the owner had rejected the shrunken board.

## The fix (presentation only)

**No changes to:**
- gameplay rules, economy, energy, or orders;
- the save format or keys, or the SDK integration;
- art or monetization.

**Where it applies:** phones in portrait (`max-width:699px`) and short landscape (`min-width:700px`, `max-height:620px`). Desktop is unchanged.

### Gold order panel

- **Replaces, doesn't push.** While open, it takes the place of the restoration strip and the guidance line. Closing the order brings them back.
- **Coast access stays.** The panel's first line says what the strip said (stage, place, coins), and on a phone it opens the coast as the strip does (marked `›`).
- **Two rows.**
  - Row 1: the stage, then the place and coins (up to two lines), and a **How to make these** button.
  - Row 2: each material as its picture with have/need (for example `0/1`), plus the generator buttons.
- **Material details.**
  - A material that is rare or not open yet carries a small `?` mark.
  - It keeps the start of its words on the chip (two lines; the rare-drop guarantee, "within every 10 taps", comes first). The chip row scrolls sideways if needed.
  - The whole sentence is in **How to make these**, which now uses the gold order's wording, guarantee included, for a rare part.
  - Each chip keeps its full sentence as its `aria-label`.
- **How to make these.** Opens as a sheet over the lower board, closed by the same button (✕). In landscape the sheet stays over the left column, beside the board.

### Below the board

- **One 44 px row.** The shed and the Shop/Book/Gift buttons share it. The buttons are round 44 px icons and keep their names for screen readers.
- **Open shed.** Its four spaces (48 px) open as a tray just above the row, over the board's last row, so Shop/Book/Gift stay reachable. The shed button closes it.
- **Selected part's card.** It floats at the bottom of the screen, over the shed row on short phones. It is hidden while a part is dragged, so the shed under it can take the drop.
- **Status line.** It floats as a toast for 5 seconds after it changes and does not block taps. `aria-live` is unchanged.
- **Footer controls move:**
  - How to play, Sound and Vibration are in the **Menu** (How to play closes the menu first; the menu's vibration note now points at the button there).
  - **Field ration** stands beside the guidance line while energy is low.
  - They move back to the footer on larger screens. Each button keeps its id and handler.

### Spacing and board size

- **Removed:** the 80 px bottom padding and the `100svh` minimum height.
- **Short screens (portrait ≤760 px tall, landscape ≤440 px tall):**
  - The HUD is 46 px.
  - The order cards are 94 px tall (90 px at ≤700 px tall, with 1–2 px tighter gaps).
  - The restoration strip is 46 px.
  - The 907×510 CrazyGames desktop embed keeps the full-size cards.
- **Board size.** The board stays as wide as the screen. It shrinks only when the screen is too short to show it whole, and never below **44 px tiles**. `fitBoard()` measures the space left and sets `--boardFit`. Below 700 px tall, the gaps between tiles go from 3 to 2 px before the tiles shrink. The rule from 2026-10-26 still holds: at 390×664 the board is full width (370 px).

### After (same states, Chromium)

Every state fits with no page scroll and every tile on screen.

| Viewport | Page scroll (all four states) | Tile size | Board, top to bottom (board / gold open) |
|---|---|---|---|
| 360×640 | 0 | 45–46 px | 230–570 / 252–588 |
| 375×667, 390×664 | 0 | 48–50 px | full width when no panel is open |
| 390×744 | 0 | 49 px | 242–612 / 264–634 |
| 390×844 | 0 | 49 px | 282–652 / 294–664 |
| 430×932 | 0 | 55 px | 282–692 / 293–703 |
| 740×360, 844×390 | 0 | 44 / 49 px | full height, on the right |

The four states are: board only, gold order open, "How to make these" open, and a selected part.

Before/after sheets, each showing only the visible screen: `docs/evidence/v5-mobile-viewport-2026-11-11/before-after-{board,gold-order-open,how-to-make-these-open}.jpg`.

## Files changed

| File | Change |
|---|---|
| `v5/next/coastal.css` | Build 57v section appended (Coast only; `mobile.css`, which Classic V5 shares, is untouched) |
| `v5/next/app.mjs` | `placeControls()` (footer buttons to the menu and ration beside the guidance line, on phones), `fitBoard()`, status-line toast timer, `dragOn` class while dragging, drop point read before the drag ends, the gold panel's first line opens the coast, "How to make these" uses the gold wording, How to play closes the menu, one menu note's wording |
| `v5/play.html`, `v5/coast-crazygames.html` | Cache-busting build tags (`viewport57v`); the CrazyGames page is regenerated by `tools/coast-crazygames.mjs` |
| `tests/v5-next-viewport-browser.cjs` | New regression test |
| `tests/v5-next-bright-browser.cjs`, `tests/v5-next-guide-browser.cjs`, `tests/v5-next-chapter4-browser.cjs`, `tests/v5-next-chapter5-browser.cjs` | On a phone: Sound/Vibration/How to play are opened from the menu, and the coast from the gold panel's first line when that panel stands in for the strip |
| `docs/evidence/v5-mobile-viewport-2026-11-11/` | Before/after screenshot sheets |
| `.github/workflows/v5-mobile-viewport.yml` | CI for this branch and for PRs into the release branch (Chromium + WebKit) |
| `docs/V5_MOBILE_VIEWPORT_FIX_2026-11-11.md` | This report |

## Regression test

`tests/v5-next-viewport-browser.cjs` runs on the CrazyGames page with a stand-in SDK. It covers 360×640, 375×667, 390×664, 390×744, 390×844, 430×932, 740×360, 844×390 and 907×510, in Chromium and WebKit.

**Layout checks.** In each state (board, gold order open, How to make these open, a selected part, after merges, after a reload):
- the page does not scroll vertically or sideways;
- all 49 tiles are on screen and at least 44 px;
- the orders, the open panel, the board and the shed row are in order and do not overlap;
- the field ration, the How to make these sheet and the selected part's card are on screen;
- in landscape, the sheet stays beside the board.

**Interaction checks:**
- the gold panel's first line opens the coast;
- dragging a part onto the shed (with a selected part's card showing) stores it;
- dragging twins in the bottom row merges them;
- Sound toggles from the menu;
- the merges survive a reload.

It saves screenshots to `test-artifacts/v5/viewport/`.

## Not verified here

- **A real phone on CrazyGames.**
  - Safari's collapsing toolbar.
  - The CrazyGames mobile wrapper's own controls.
  - Real touch drag on iOS and Android.

  These need the owner's check on the branch preview and then a private CrazyGames QA upload. The test uses Chromium mobile emulation and WebKit desktop with touch.
- **Very short screens.** On a screen shorter than about 600 px in portrait, the 44 px tile floor wins and the page can scroll a little.
