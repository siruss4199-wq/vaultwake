# Vaultwake Merge: order card size and gold order identity (2026-11-14)

**Status: DRAFT, on `claude/v5-first-session-2-production` (PR #104), for owner review.** Nothing has been merged, packaged or uploaded. The CrazyGames build is unchanged.

**Changed:** order-card CSS, plus one small markup change: a crown icon and a "Gold" label in the gold card's head.

**Not changed:**
- which orders exist, their order in the game and which one leads (the lead rule from the premium polish is unchanged);
- rewards, the economy, the rules and the save format;
- the Order Details sheet (tap a card to open it, as before);
- the board and its tile size.

## 1. Sizes

| Card | Before (2026-11-13) | After |
|---|---|---|
| Lead (the order the next step serves) | 178 × 76 | **150 × 90** |
| Gold order, not leading | 84 × 76 | **110 × 90**, placed straight after the lead |
| Crew order | 84 × 76 | **96 × 90** |
| Item picture in a card | 26–30 px | **31–35 px** (lead 35, gold 33, crew 31) |

Each card keeps three lines, so the counts are readable without Details:
- **top:** face (crew) or stage picture (gold), and the reward or the Deliver button;
- **middle:** the items, each with its have/need count;
- **bottom:** the crew member's name, or **crown + GOLD + Stage n** on a gold card.

At 360 px the lead and the gold card (or two crew cards) are on screen, at least 86 of 96 px of the third card shows, and the rail scrolls sideways for the rest.

## 2. Gold order identity

| State | How it looks |
|---|---|
| **Gold** (always) | Warm gold background (`#fff7df → #ffe8ad`), a 2 px gold border (`#d9a21f`), a small crown and **GOLD · Stage n** on the bottom line. Its picture is the place it restores. There is no glow and no animation. |
| **Gold + ready** | Still gold (background, border, crown, label). A green **Deliver +115** pill is the action. On a compact card the green "Deliver" chip is the action. |
| **Crew + ready** | Mint background, green border, green Deliver. |
| **Selected** (tapped) | A teal ring 2 px outside the card. It sits outside the gold or green border, so the selected, gold and ready states can all show at once. |

**The lead's Deliver button** is now a crisp CSS green pill. The stretched painted image showed a pale box around the button on the gold background.

## 3. Board space (measured, Chromium, CSS px)

The rail grows by 14 px of card height, plus the badges and the gap below the cards: **the board starts 19 px lower** in every state. The tile size is unchanged.

| Viewport | State | Board top: before → after | Board bottom: before → after | Whole board on screen? |
|---|---|---|---|---|
| 360×640 | new player | 248 → 267 | 588 → 607 | yes (≤ 640) |
| 360×640 | played camp | 203 → 222 | 543 → 562 | yes |
| 360×640 | gold ready + order selected | 244 → 263 | 584 → 603 | yes |
| 390×844 | new / played | 248 → 267 / 203 → 222 | 618 → 637 / 573 → 592 | yes |
| 430×932 | new / played | 248 → 267 / 203 → 222 | 658 → 677 / 613 → 632 | yes |

The board takes back 19 of the 54–61 px that the premium polish freed above it. Raw data: `docs/evidence/v5-order-cards-2026-11-14/layout-{before,after}.json`.

## 4. Screens

All in `docs/evidence/v5-order-cards-2026-11-14/`. Each image shows before (left) and after (right).

| File | State |
|---|---|
| `rails-close-up-390x844.jpg` | The rail close up. Top: before. Bottom: after. Left: a crew order ready (gold not leading). Right: the gold order ready and leading, with a crew order selected. |
| `compare-new-*.jpg` | A new player, the guide's first order. |
| `compare-played-*.jpg` | The chapter-1 fixture camp: gold leads, nothing ready. |
| `compare-crew-ready-*.jpg` | A crew order ready and leading; the gold card second, still gold. |
| `compare-gold-ready-selected-*.jpg` | The gold order ready, and a crew order tapped (teal ring). |

Each comes at 360×640, 390×844 and 430×932. The capture script is `states.cjs` in the same folder. It builds the states from `tests/fixtures/coast/coast-ch1-pre-secondary.json` by placing an order's real items on the board.

## 5. Tests

- **`tests/v5-next-bright-browser.cjs` was updated** for the new sizes:
  - the lead is 144–156 × 84–96 and first in the rail;
  - a crew card is 90–102 × 84–96;
  - a gold card is 104–116 × 84–96, with its crown, and comes right after the lead.

  The test still delivers an order, builds, and checks the gold card's text ("Gold order Stage 1") and label.
- **Local Chromium:** the bright, First Session 2.0, core actions (Details, Deliver, merge, Build), build flow, tap flicker, strip tap, browser, playtest, guide and board feedback suites; the unit tests (490/490); and the module and CrazyGames page checks.
- **CI** (`v5-first-session-2.yml`) runs all of these, and every other Coast Camp suite, in Chromium and WebKit.

## 6. Known limits

- **A ready gold card that does not lead:** the lead rule puts a deliverable order first, so this happens only when two orders are ready at once. It then shows the small green Deliver chip on its gold surface. It was not captured in the screens.
- **The crew name on the bottom line sits close to the count badges** on compact cards. It stays readable at 360 px.
- **A real iPhone and Android check is still needed** before any release.
