# Vaultwake Merge: initial screen framing (PR #105, 2026-11-15)

**Task:** when a player opens or resumes the game, show the orders, the restoration strip and the 7×7 board at once, centred, without scrolling. Keep board and order sizes, and respect safe areas.

**Not changed:** game rules, economy, rewards, saves, the order UI, Gold Orders, Tideglass and crates.

## 1. What was wrong (measured)

**Layout:** in Chromium at every size, the layout itself is centred.
- The board and the order row sit 10 px from each side (offset 0 px).
- Nothing is wider than the screen (`scrollWidth` = viewport width, including during 25 actions of play).
- The safe-area inset is applied once. With a simulated 47 px notch, `.game` takes 47 px, the header 6 px, and the orders start at 103 px.

**The fault is where the page is scrolled when play starts:**
- **A reload restores an old scroll position.** The page is taller than a phone: the shed, Shop/Book and settings sit below the board (196–343 px of extra height at phone sizes). The browser restored the old position (`history.scrollRestoration` = `auto`), and nothing framed the play area when Home → Continue hid Home. A returning player who had scrolled down came back like this:

  | Size | Orders | Board |
  |---|---|---|
  | 360×640 | −132 px | top at 26 |
  | 390×664 | −138 px | top at 20 |
  | 375×553 | −234 px | −76 to 279, not fully on screen |

- **Short screens cut off the board.** A small phone's Safari with its bars shows about 375×553. Even on a clean load the board's last row was cut off: board bottom at 622 px (new camp) and 577 px (returning).

## 2. The fix

**`v5/next/app.mjs`, `framePlay()`, called from `arrive()`.** `arrive()` runs each time play starts: a new camp's first board, Home → Play/Continue, and the menu's Home → Continue.
- `history.scrollRestoration='manual'`.
- The page goes to its left edge and the top, so the HUD, orders, strip and board are in view.
- If the board's bottom row would be off screen, it scrolls the least amount that shows the whole board, never more than 12 px into the primary order card. No tile is shrunk.
- It re-checks after two frames and at 450 ms, and stops as soon as the player touches, scrolls or types.
- A page restored from the back/forward cache is framed again.

**`v5/next/coastal.css`:** `overflow-x:clip` on the page. It is a guard only: nothing measured is wider than the screen. A swipe can never leave the page offset sideways, and `clip` creates no scroll container.

**Other files:**
- Cache tags in `v5/play.html` bumped (`first60a`).
- `v5/coast-crazygames.html` regenerated with `node tools/coast-crazygames.mjs`.
- No save, rule or style change elsewhere.

## 3. Measured after the fix (Chromium, real taps; `measure-after.txt`)

**Cases:**
- new camp, and its reload;
- returning Continue, and its reload;
- scrolled to the bottom, then reload → Continue;
- scrolled, then the menu's Home → Continue;
- the CrazyGames page;
- the CrazyGames page in a full-viewport iframe.

| Size | `scrollY` on entry | Orders | Strip | Board | Board left / right | Tile |
|---|---|---|---|---|---|---|
| 360×640 | 0 in all 8 cases | 64–163 | 168–214 | 222–562 (returning), 267–607 (new) | 10 / 10 | 44.8 px (unchanged) |
| 390×664 | 0 in all 8 | 64–163 | 168–214 | 222–592 / 267–637 | 10 / 10 | 49.1 (unchanged) |
| 390×844 | 0 in all 8 | 64–163 | 168–214 | 222–592 / 267–637 | 10 / 10 | 49.1 (unchanged) |
| 430×932 | 0 in all 8 | 64–163 | 168–214 | 222–632 / 267–677 | 10 / 10 | 54.8 (unchanged) |
| 907×510 (desktop, two columns) | 0 in all 8 | 64–163 (left column) | 173–219 | 10–496 (right column) | columns 12 px from each edge | 65.7 (unchanged) |
| 375×553 (extra: small phone's Safari) | 28 (returning), 73 (new) | 36–135 / −9–90 | 140–186 / 95–141 | 194–549 | 10 / 10 | 47 (unchanged) |

**Fully in view (board, primary order card, orders and strip):**
- 45 of 48 cases after the fix, against 38 before.
- The 3 others are a new camp at 375×553. Its first view needs 558 px from the orders to the board's bottom, more than the screen. The whole board shows, and the primary order card's top 5 px sit under the browser bar (card at −5 to 85).

**Before/after pictures:** `docs/evidence/v5-initial-view-2026-11-15/<size>.jpg`, one sheet per size:
- before/after for "scrolled, then reload" and "scrolled, menu Home";
- after for new camp, returning, the CrazyGames page and the CrazyGames page embedded.

## 4. Tests

**New `tests/v5-next-initial-view-browser.cjs`** (Chromium and WebKit; in CI after the Kite suite):
- runs the cases above at the five requested sizes and 375×553;
- checks: no sideways offset; nothing wider than the screen; the whole board, the primary order card, the orders and the strip in view; board and orders centred; tiles at the same size in every case;
- it fails on the build before the fix (390×664, scrolled then reload: card top at −134).

**Existing suites:** unit tests 494 pass. Chromium browser suites: see the PR report.

## 5. Not covered here

- **Real iPhone Safari:** browser bars that hide and show, and the home indicator. Not available in CI. Check on the playtest phones (checklist §3 question 7): the board, orders and strip should be in view on opening and after a reload.
- **The "Ivo · Landing Beach" story ribbon** for a new camp is pinned to the bottom of the screen over the last board rows, as before. It is a story element outside this task.
