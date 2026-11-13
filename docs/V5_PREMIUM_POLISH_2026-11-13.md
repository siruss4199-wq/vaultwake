# Vaultwake Merge: premium mobile UI polish (2026-11-13)

**Status: DRAFT, on `claude/v5-first-session-2-production` (PR #104), for owner review.** Nothing has been merged, packaged or uploaded.

**Changed:** UI and UX only.

**Not changed:**
- the rules, economy, orders, rewards and generators;
- the board (7×7, 27 crates, 17 tideglass) and the size of its tiles;
- the save format and the SDK;
- the CrazyGames live release.

**Goal:** the player sees the playable board first, understands the next action and plays without visual noise.

## 1. Measured: where the board starts

Chromium, measured from the top of the page in CSS px. The tile size is unchanged at every width (45 / 49 / 55 / 51 px).

| Viewport | New player (guide shown): before → after | Played camp: before → after | Board bottom on the first screen? |
|---|---|---|---|
| 360×640 | 309 → **248** (−61) | 257 → **203** (−54) | before 649 (cut), after **588** (whole board) |
| 390×664 | 309 → **248** (−61) | 257 → **203** (−54) | before 679 (cut), after **618** (whole board) |
| 390×844 | 309 → **248** (−61) | 257 → **203** (−54) | yes / yes |
| 430×932 | 298 → **248** (−50) | 257 → **203** (−54) | yes / yes |
| 1280×720 | 309 → **248** (−61) | 298 → **244** (−54) | before 689, after **628** (whole board) |

**Where the space came from (390×664):**

| Element | Before → after | Change |
|---|---|---|
| Order rail | 124 → 80 px | −44 |
| Coast strip | 56 → 46 px | −10 |
| Guide line | 55 → 44 px | −11 |

The space came from these elements. The tiles are unchanged. Raw data: `docs/evidence/v5-premium-polish-2026-11-13/layout-{before,after}.json`.

## 2. What changed

| Area | Before | After |
|---|---|---|
| **Orders** | Three or four equal 112×118 painted cards. The gold order was always the first and most prominent. | **One lead card (178×76)** for the order the player's next step serves. **Compact cards (84×76)** for the rest, in the same rail. Every order stays selectable and deliverable, with its real parts, counts and reward. |
| **Which order leads** | The gold order. | 1. One that can be delivered now. 2. Else the one the player tapped. 3. Else the guide's focus order, which is a crew order when coins are short (`tutor.mjs` `focusOrder`). So the gold order does not always come first. During the guided span it is the guide's order, as before. |
| **Card surfaces** | Painted frames (9-slice art), heavy rings. | Warm-sand cards with a thin line. State is one ring: gold for the lead, green when ready, teal when tapped. A compact card that is ready shows a small green "Deliver" chip, and the whole card delivers. |
| **Coast strip** | 56 px, with a rectangular gold glow when ready. | 46 px: the same painted strip, scaled, so it still reads as the coast. The ready outline follows the strip's shape. The action pill is aligned to the painted one. |
| **Guide line** | Two-line reason, 55 px, coral outline. | One short line (what, then the reason on one line), 44 px, sitting just above the board. A gold accent marks a step being taught, teal a light hint. Hint and Skip stay 44 px. |
| **Guide on the board** | Both merge cells were green, and a label ("Drag onto its twin") covered the cells. **Bug:** on the camp's cells the camp tint hid the guide's rings. | The part to pick up (**source**) is **gold**, its twin (**destination**) **green**. There is no label on the board, because the guide line says it. The camp tint no longer covers any highlighted cell (selected, matched, target, guide), which also fixes the bug. |
| **Hand** | For an order it hung below the card, over the Coast strip. | It points into the card. It still rests after 6.5 s, and its validated targets are unchanged. |
| **Story caption** | 44 px portrait, 14 px text. | 36 px portrait, 13 px text. |

**Palette:**
- warm sand: cards and surfaces;
- coastal teal: View, navigation, the tapped order;
- gold: the lead objective and the source to pick up;
- soft blue: tideglass, unchanged;
- green: ready and a valid merge target.

The item art is untouched.

## 3. Screens and video

All in `docs/evidence/v5-premium-polish-2026-11-13/`.

| File | What |
|---|---|
| `compare-new-390x664.jpg` | New player, the guide's first step. Before (left), after (right). |
| `compare-played-390x664.jpg` | Chapter-1 fixture camp. Before / after. |
| `compare-*-390x664-fullpage.jpg` | The whole page, before / after. |
| `compare-merge-step-390x664.jpg` | The guide's merge step: before (rings hidden by the camp tint, label over the board) and after (gold source, green destination). |
| `after-*-{360x640,390x844,430x932,1280x720}.jpg` | The other sizes. |
| `order-merge-deliver-build-390x664.mp4` | **50 s:** a new player's real taps and drags at human pace. Generator → merge → crew delivery → gold delivery → coast → Build → the restored stage → the next objective. |

## 4. Tests

- **Every Coast Camp browser suite** (Chromium locally; Chromium and WebKit in CI): First Session 2.0 at 5 sizes, the Build 57y P0 set (Details, Deliver, merge, Build, coast ×, strip tap, tap flicker), Home, saves, CrazyGames, chapters 1–6.
- **`tests/v5-next-bright-browser.cjs` was updated** for the new design. It encoded the old one: "card 112×118" and "strip 52–56 px". It now checks:
  - one lead card, 170–186 × 70–82, first in the rail;
  - compact cards 80–90 × 70–82, all in one rail;
  - the strip 44–48 px, still a full tap target.

## 5. Known limits, for owner review

- **"Gold order" can shorten to "Gol…"** on a ready lead card, next to its Deliver button. The full name is in the card's label and on the strip.
- **The reason text is cut to one line** with "…" on narrow phones. The Hint button and the step itself carry the rest.
- **The story caption still covers the board's bottom rows** for a new player until their first action or ×.
- **The flow video was recorded just before the order hand moved into the card.** Everything else in it is current.
- **A real iPhone and Android check is still needed** before any release.
