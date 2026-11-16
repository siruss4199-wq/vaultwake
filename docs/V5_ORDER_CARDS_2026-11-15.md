# Vaultwake Merge: order card zones (PR #105, 2026-11-15)

**Task:** remove crowding and overlaps inside the mobile order cards (owner's screenshot). CSS only, plus one test bound.

**Not changed:** card markup, card height (90 px), the board, gameplay, orders, economy, saves, the CrazyGames SDK.

## 1. Measured before (real bounding boxes; `docs/evidence/v5-order-cards-2026-11-15/measure-before.txt`)

**Cases** at 360, 375, 390 and 430 px; 88 card measurements in all:
- a Gold order with 2 and with 3 items, including `Lv` tags;
- crew orders with 1, 2 and 3 items;
- a ready order (Deliver);
- a selected (tapped) order;
- the new camp's lead card.

**Findings:**
- **Quantity badges on the bottom label:** in 72 of 88 cards the have/need badge (0/1, 1/2, ✓2/2) overlapped the bottom line (crew name, or GOLD · STAGE 2) by up to 4 px. The badge hung 7 px below an art box that ended 22 px above the card's bottom; the label sits 5–19 px above the bottom.
- **Heavy `Lv` tags:** each `Lv` tag (9.5 px bold, white with a teal ring, poking above the art) covered 31–45% of its item's picture.
- **Three cards did not fit below 390 px:**

  | Width | Lead + Gold + crew (150 + 110 + 96) | Lead + crew + crew (150 + 96 + 96) |
  |---|---|---|
  | 360 px | third card cut off | rail auto-scrolled |
  | 375 px | — | rail auto-scrolled |

  Only 326 px fit at 360 and 341 px at 375.

## 2. The fix (`v5/next/coastal.css`, one block at the end)

**Four fixed zones** in the 90 px card:

| Zone | Contents | y range |
|---|---|---|
| Head | face, reward or Deliver | 6–30 |
| Art | item pictures | from 32 |
| Counts | have/need badges | end at 67 or above |
| Bottom label | crew name, or crown · GOLD · STAGE | 71–85 |

**Item art:**
- the art box is 32 px to 27 px above the bottom;
- pictures are 31 px (1 item), 29 px (2 items) or 25 px (3 items, with a 3 px gap);
- the lead card's pictures are 31 px.

**Counts:** the badge sits 4 px below the art. Its text stays 10 px (readable) on 13 px lines.

**`Lv` tag:** 8.5 px semibold, a pale teal fill with a thin teal ring, inside the art's top-left corner (no longer above it). It covers 25–34% of the picture.

**Below 390 px wide:** lead 132, Gold 104, crew 90 px. Three cards fit at 360 and 375 px. The Gold label (crown · GOLD · STAGE 2) needs 95 px and has 96. From 390 px up the sizes are unchanged: lead 150, Gold 110, crew 96.

**Unchanged:** the Gold order's crown, warm gold card, GOLD label and Stage tag; the ready (green) and selected (teal ring) states; the card hierarchy (lead first and widest, the Gold card next).

## 3. Measured after (`measure-after.txt`)

| Width | Cards with any overlap or cut text | Count → label gap | `Lv` area of its art | Three cards in view |
|---|---|---|---|---|
| 360 | 0 of 22 (before: 18) | 4–7 px (before: −4 to 0.5) | 25–34% (before: 31–45%) | yes, all cases (before: 2 in camp B) |
| 375 | 0 of 22 (before: 18) | 4–7 px | 25–34% | yes |
| 390 | 0 of 22 (before: 18) | 4–7 px | 25–34% | yes |
| 430 | 0 of 22 (before: 18) | 4–7 px | 25–34% | yes |

**Board and initial screen:** unchanged. The board stays 340 px wide at 360 and 370 px at 390. The initial-view test passes.

**Pictures:** `docs/evidence/v5-order-cards-2026-11-15/<width>.jpg`, before and after for:
- the Gold order with 3 items;
- Ivo ready with the Gold order with 2 items;
- Bram selected;
- the new camp's lead card.

## 4. Tests

**New `tests/v5-next-order-cards-browser.cjs`** (Chromium and WebKit, in CI):
- runs the cases above at 360/375/390/430 px;
- fails on any overlap (counts, `Lv`, art, labels, face, reward), cut text, or fewer than three cards in view;
- it fails on the build before this change.

**Changed `tests/v5-next-bright-browser.cjs`:** the card-size guard now knows the narrow sizes (lead 128–140, Gold 100–108, crew 86–94 under 390 px), and the lead must stay the widest. Its old bounds (lead at least 144 px) cannot hold together with three cards at 360 px.

**Results:** unit tests 494 pass. Chromium suites pass: initial view, bright, core actions, tap flicker, strip tap, board feedback, guide, Kite, first session, energy, rare merges, Chapter 1 rare, rewards, extras, build flow, SDK not ready, CrazyGames, Home, the main Coast Camp suite and Chapter 3.

## 5. Noticed, not changed

**A tapped card ends up partly off the left edge.** Tapping a crew card makes it the lead (wide, first) while the rail keeps its scroll position. In camp A the tapped card sits partly off the left edge (360 px: −87 to 45). It was the same before this change (−123 to 27). Fixing it means scrolling the rail in `app.mjs`, outside this CSS-only task.
