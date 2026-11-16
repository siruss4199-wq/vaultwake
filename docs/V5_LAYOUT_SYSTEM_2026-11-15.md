# Vaultwake Merge: proportional layout system for the gameplay screen (PR #105, 2026-11-15)

**Scope:** layout and proportions only. Rules, assets, saves, the order UI's content and the CrazyGames SDK are unchanged. The code is one CSS block (`v5/next/coastal.css`, "Layout system") plus one test's size guard.

## 1. Audit (measured, Chromium, 7 viewports × 3 states; `docs/evidence/v5-layout-system-2026-11-15/`)

**Accumulated layers:**
- The order cards had five generations of rules in `coastal.css` alone: base (Build 45), 45g fixes, Premium polish, Order cards v2 and Order card zones. About 106 card selectors, each layer re-setting sizes with more specific selectors.
- The Coast strip and the guide line were also set twice.

**Card proportions were inconsistent:**
- The lead card was 1.47–1.56 × a crew card (150 vs 96; 132 vs 90 under 390 px).
- The gold order had a third width (104/110).
- Card height was 90 px whatever the width.
- Faces were 24 px on crew cards and 28 px on the lead; art 31 vs 31–35 px.
- Deliver had two styles: a raised gradient button on the lead and a flat chip elsewhere.

**Space above the board:**
- HUD 8–60 (52 px, with 4 px of dead space above and below its 44 px pills).
- Rail 99 px (90 + 9 padding).
- Strip 46 px; guide row 44 px (tutorial only).
- Board top at 222 (returning) or 267 (tutorial) on every phone.
- The board already spans the full width (10 px gutters), so on tall phones it cannot grow; it can only start higher.

**Primary action:**
- With a ready card and a ready strip, the raised Deliver button competed with the breathing Build pill.
- The tutorial showed one target ring plus the 32 × 38 px hand (not oversized). The guide box carried a 3 px accent bar, not a ring.

## 2. The system

**Card sizes are declared on the card** (so every derived size follows the card's real width). Its width comes from the rail's own width through a container query (`100cqw`), with a `100vw` fallback.

| Variable | Rule | 360 | 390 | 430 |
|---|---|---|---|---|
| `--l-card-w` | (rail − 26) / 3.25, 92–124: three cards and a 24 px peek of the fourth | 97 | 106 | 118 |
| `--l-lead-w` | 1.25 × card | 121 | 132 | 148 |
| `--l-card-h` | 0.82 × card, 88–90 | 88 | 88 | 90 |
| `--l-face` | 0.27 × height, 22–24 | 23.8 | 23.8 | 24 |
| `--l-items-h` | height − head − label (20) − 6 | 30 | 30 | 32 |
| art 1 / 2 / 3 items | items-h / −1 / (card − 16) ÷ 3 | 30 / 29 / 26 | 30 / 29 / 27 | 32 / 31 / 27 |

**Type, one scale:**

| Element | Size |
|---|---|
| Name | 10.5 px |
| Gold label | 9.5 px |
| Stage tag | 8.5 px |
| Have/need count | 10 px |
| `Lv` tag | 8.5 px |
| Reward | 12 px |
| Button | 11 px |
| Strip title | 13 px |
| Guide | 14 / 11.5 px |

**Buttons:**
- Reward pill and Deliver chip: 22 px, the same flat green chip on every card (the lead also shows "+coins").
- Strip action: 68 × 30.
- Hint, Skip and menu: 44 × 44.

**Rows:**
- HUD 48 px, with 44 px pills (the pills keep their size).
- 4 px gap, then the rail at card height + 6.
- 6 px gap, then the strip at 44.
- 6 px gap, then the guide row at 44 (tutorial only).
- 4 px gap, then the board.

**Inside every card** (as before, now derived from the variables):

| Zone | Contents | y range |
|---|---|---|
| Head | face, reward or Deliver | 5 to face + 8 |
| Art | item pictures | head to head + items-h |
| Counts | have/need | 3 px below the art |
| Label | crew name, or crown · GOLD · STAGE | 4 px below the counts, 14 px tall at 5 px from the bottom |

**Removed layers** (140 lines): Premium polish cards, strip and guide; their follow-ups; Order cards v2; Order card zones. The base Build 45 rules stay (the painted frame and the ring states); `mobile.css` (shared with Classic V5) is untouched.

## 3. Results (full table: `table.md`; pictures: `<viewport>.jpg`)

| Measure | Before | After |
|---|---|---|
| Lead : card width | 1.27–1.56 | **1.25** at every viewport, including the 907 × 510 embed (136 : 109) |
| Gold order (not leading) | 104 / 110 px, a third width | the card width |
| Card height | 90 everywhere | 88 (360–390) to 90 (402–430); one height per screen |
| Three whole cards in view | yes (scrolled at 360/375 before the zones fix) | yes, all 21 cases |
| Board top, returning | 222 | 212 |
| Board top, tutorial | 267 | 258 |
| Board top, selected | 263 | 253 |
| Board fully visible | yes | yes, all 21 cases (360 × 640: board ends at 598) |
| Tile size | 44.8 / 47 / 49.1 / 50.8 / 54.8 | unchanged (the board keeps the full width) |
| Card collisions, cut text | 0 | 0 (order-card test at 360/375/390/402/430) |
| Faces | 24 (crew) / 28 (lead) | 23.8 on every card |
| Art | 31 / 31–35 | 30 on every 1-item card (1-, 2- and 3-item sizes as in §2) |
| Deliver | raised gradient on the lead, chip elsewhere | one flat chip everywhere |

**Board share of the screen** (height): 53% at 360 × 640, 56% at 390 × 664, 44% on tall phones. The board is limited by width, and the tile size is unchanged.

**Unchanged and noted:**
- Tapping a card still adds the row with the Hint and Details (44 px), so the board moves down while a card is selected. Fixing that needs an interaction change: Details inside the selected card, or a fixed row. That is a proposal for the owner, not part of this pass.
- The new player's story caption still overlays the board's last rows until it folds.

## 4. Tests and regressions (Chromium locally; Chromium and WebKit in CI)

**Changed test:** `tests/v5-next-bright-browser.cjs`. Its card guard now checks the system, not old pixel sizes:
- the lead is 1.2–1.3 × a card and comes first;
- one card height (86–92);
- non-lead cards share one width (92–124).

**Extended test:** `tests/v5-next-order-cards-browser.cjs` now also runs at 402 px.

**Results:**
- All 31 Coast Camp browser suites pass in Chromium, including first session, build flow, core actions, Home, saves, CrazyGames, energy, rare merges and chapters 1–6. The main and playtest suites' WebKit parts run in CI only.
- Unit tests: 494 pass.
- **Saves:** no state or save change. The saves, CrazyGames save, existing-save and chapter suites pass.

| Viewport | Case | Board top (before → after) | Board bottom / height | Tile | Lead : card (before → after) | Card height | 3 cards | Overlaps |
|---|---|---|---|---|---|---|---|---|
| 360x640 | new player (tutorial) | 267 → 258 | 598 / 640 | 44.8 | 132:90 = 1.47 → 121:97 = 1.25 | [90] → [88] | 3 | 0 → 0 |
| 360x640 | returning gold | 222 → 212 | 552 / 640 | 44.8 | 132:90 = 1.47 → 121:97 = 1.25 | [90] → [88] | 3 | 0 → 0 |
| 360x640 | ready + selected | 263 → 253 | 593 / 640 | 44.8 | 132:104 = 1.27 → 121:97 = 1.25 | [90] → [88] | 3 | 0 → 0 |
| 375x667 | new player (tutorial) | 267 → 258 | 613 / 667 | 47 | 132:90 = 1.47 → 126:101 = 1.25 | [90] → [88] | 3 | 0 → 0 |
| 375x667 | returning gold | 222 → 212 | 567 / 667 | 47 | 132:90 = 1.47 → 126:101 = 1.25 | [90] → [88] | 3 | 0 → 0 |
| 375x667 | ready + selected | 263 → 253 | 608 / 667 | 47 | 132:104 = 1.27 → 126:101 = 1.25 | [90] → [88] | 3 | 0 → 0 |
| 390x664 | new player (tutorial) | 267 → 258 | 628 / 664 | 49.1 | 150:96 = 1.56 → 132:106 = 1.25 | [90] → [88] | 3 | 0 → 0 |
| 390x664 | returning gold | 222 → 212 | 582 / 664 | 49.1 | 150:96 = 1.56 → 132:106 = 1.25 | [90] → [88] | 3 | 0 → 0 |
| 390x664 | ready + selected | 263 → 253 | 623 / 664 | 49.1 | 150:110 = 1.36 → 132:106 = 1.25 | [90] → [88] | 3 | 0 → 0 |
| 390x844 | new player (tutorial) | 267 → 258 | 628 / 844 | 49.1 | 150:96 = 1.56 → 132:106 = 1.25 | [90] → [88] | 3 | 0 → 0 |
| 390x844 | returning gold | 222 → 212 | 582 / 844 | 49.1 | 150:96 = 1.56 → 132:106 = 1.25 | [90] → [88] | 3 | 0 → 0 |
| 390x844 | ready + selected | 263 → 253 | 623 / 844 | 49.1 | 150:110 = 1.36 → 132:106 = 1.25 | [90] → [88] | 3 | 0 → 0 |
| 402x874 | new player (tutorial) | 267 → 260 | 642 / 874 | 50.8 | 150:96 = 1.56 → 137:110 = 1.25 | [90] → [90] | 3 | 0 → 0 |
| 402x874 | returning gold | 222 → 214 | 596 / 874 | 50.8 | 150:96 = 1.56 → 137:110 = 1.25 | [90] → [90] | 3 | 0 → 0 |
| 402x874 | ready + selected | 263 → 255 | 637 / 874 | 50.8 | 150:110 = 1.36 → 137:110 = 1.25 | [90] → [90] | 3 | 0 → 0 |
| 430x932 | new player (tutorial) | 267 → 260 | 670 / 932 | 54.8 | 150:96 = 1.56 → 148:118 = 1.25 | [90] → [90] | 3 | 0 → 0 |
| 430x932 | returning gold | 222 → 214 | 624 / 932 | 54.8 | 150:96 = 1.56 → 148:118 = 1.25 | [90] → [90] | 3 | 0 → 0 |
| 430x932 | ready + selected | 263 → 255 | 665 / 932 | 54.8 | 150:110 = 1.36 → 148:118 = 1.25 | [90] → [90] | 3 | 0 → 0 |
| 907x510 | new player (tutorial) | 12 → 12 | 498 / 510 | 65.7 | 150:96 = 1.56 → 136:109 = 1.25 | [90] → [89] | 3 | 0 → 0 |
| 907x510 | returning gold | 10 → 10 | 496 / 510 | 65.7 | 150:96 = 1.56 → 136:109 = 1.25 | [90] → [89] | 4 | 0 → 0 |
| 907x510 | ready + selected | 10 → 10 | 496 / 510 | 65.7 | 150:110 = 1.36 → 136:109 = 1.25 | [90] → [89] | 4 | 0 → 0 |
