# Vaultwake Merge: order details as a bottom sheet, with the Build workflow protected (Build 57y, 2026-11-11)

- **Branch:** `claude/v5-order-details-sheet`.
- **Base:** `claude/v5-crazygames-release-package` @ `e6eddf6`, the live Basic Launch layout (`vaultwake-merge-crazygames-basic-664956e.zip`).
- **Not used:** nothing from the rejected Builds 57v/57w (PR #101).
- **Not shipped:** the live ZIP is unchanged. Release needs the owner's real-phone PASS, then a rebuilt ZIP and an upload.

## What changed (presentation only)

### On a phone (`max-width:699px`)

- **Tapping an order:**
  - marks its parts on the board, as before (`.nextAction`);
  - shows a **Details** button (44 px) in the guidance line under the restoration strip.
- **The white panel** between the order rail and the strip is gone from the page flow. Tapping an order no longer pushes the strip and the board down 176 px.
- **Details** opens the same panel as a **bottom sheet** over the board. It contains:
  - the stage and coins (gold) or the crew member's line (crew);
  - each material with its count;
  - the generator buttons;
  - "How to make these" (the item chains);
  - the "New order" offer.
- **Closing the sheet** works four ways: ✕ (44 px), a tap outside it, Esc, or a generator button. A generator button also lights its generator on the board.
  - The order stays tapped.
  - The backdrop is `display:none` whenever the sheet is closed, so it can never take a tap.
- **The View/Build strip** never moves, is never covered by the closed sheet, and keeps its own handler.
- **The guidance line** takes no space when nothing in it shows (its hint hides itself, no guide, no tapped order). That removes a 33 px empty gap between the strip and the board.

### Larger screens

The panel stays where it was. Details, the sheet and the backdrop do not appear.

### Untouched

The following are not changed:
- game rules, economy, energy and orders;
- the save format and keys, and the SDK;
- artwork;
- the Build/restore handler (`app.mjs` `[data-restore]`) and its rule (`game.mjs` `restore`).

### Files

- `v5/next/app.mjs`: the sheet's open/close state, added around the existing `renderOrderTools`; the panel's content and handlers are unchanged.
- `v5/next/coastal.css`: the "Build 57y" section.
- `v5/play.html`: the Details button, the backdrop element and the cache tags.
- `v5/coast-crazygames.html`: regenerated.

## Release gate: core actions

### Chromium, local
All four sizes pass (360×640, 390×664, 390×844, 430×932), with finger taps.

| Action | Test | Result |
|---|---|---|
| **Build workflow, end to end** | `tests/v5-next-build-flow-browser.cjs` | PASS ×4 |
| Generator tap makes a part (−1 energy) | `tests/v5-next-core-actions-browser.cjs` | PASS ×4 |
| Drag twins → merge | core actions | PASS ×4 |
| Crew order → Deliver, coins paid | build flow (o13, +10) | PASS ×4 |
| Gold order → materials secured | build flow (+115, materials[forge]=2) | PASS ×4 |
| View → coast map opens | core actions, build flow | PASS ×4 |
| Ready to build → Build succeeds, once | build flow | PASS ×4 |
| Find generator → the right generator lit; sheet closes | core actions | PASS ×4 |
| Details sheet → opens; ✕ / outside / Esc close; order kept; backdrop gone; board takes taps after | core actions | PASS ×4 |
| Shed → in (drag) and out (tap its space) | core actions | PASS ×4 |
| Home → Continue keeps the camp | core actions, build flow (reload) | PASS ×4 |
| Strip finger tap (guide step, text and Build pill) | `tests/v5-next-strip-tap-browser.cjs` (iPhone 13 profile) | PASS |
| CrazyGames Data module save/reload (guest, second device, failures) | `tests/v5-next-crazygames-save-browser.cjs` | PASS |
| All Coast Camp suites (18) | as in CI | PASS |

**Build workflow, step by step:**
1. **Nothing ready.** The forge has no materials and 0 coins. The strip is not ready, the coast card has no Build, and the game's rule refuses a restore ("needs its materials").
2. **Gold order delivered** from its card. Its parts leave the board, the materials are secured, and 115 coins are paid. Still no Build, because the card says "Earn 5 more" and the rule refuses ("coins").
3. **Crew order delivered.** Coins reach 125, and the strip turns "Ready to build" with Build.
4. **Strip tapped** with a finger: the coast opens on the forge's card, showing "Build · 120".
5. **Build tapped:**
   - coins 125 → 5 and the materials are used;
   - the stage goes 1 → 2;
   - a second tap spends nothing;
   - the forge's story beat shows.
6. **Next objective:** the strip moves on to it, and a gold order exists for it.
7. **Home → Continue:** stage 2, 5 coins and no materials, unchanged.

**Existing tests adapted to the sheet** (on phones only, where Details now opens the panel):
- `v5-next-browser.cjs`
- `v5-next-ch1-rare-browser.cjs`
- `v5-next-rare-merges-browser.cjs`, which also closes the sheet before dragging on the board, as a player would.

**Unit tests:** `node --test tests/v5-*.test.mjs` gives 465 pass, 0 fail.

**WebKit** cannot be installed in this dev container, so it runs in CI: `.github/workflows/v5-order-sheet.yml` (Chromium and WebKit, every test above).

## Layout (Chromium, chapter-1 camp)

| | 360×640 | 390×664 | 390×844 | 430×932 |
|---|---|---|---|---|
| Board top, no order tapped (live build: 282) | 257 | 257 | 257 | 257 |
| Board top, an order tapped (live build: 463, gold panel) | 298 | 298 | 298 | 298 |
| Board bottom, an order tapped | 638 of 640 | 668 of 664 | 668 of 844 | 708 of 932 |
| Sheet open | 402–632 | 426–656 | 606–836 | 694–924 |

**Not changed by design:** the page still scrolls below the board to the shed, Shop/Book and footer, as in the live build. At 390×664 with an order tapped, the board's last 4 px are below the first screen.

## Evidence (`docs/evidence/v5-order-sheet-2026-11-11/`)

- `1-order-details-before-after.jpg`: before (live, gold order tapped) and after (order tapped; Details open), at 360×640, 390×664, 390×844 and 430×932, first screen only.
- `2-build-workflow-390x664.jpg`: the six steps of the Build workflow.
- `focus-<size>.jpg` and `sheet-<size>.jpg`: each size, order tapped and Details open.

## P0: Build and Details did nothing on the owner's iPhone (Cloudflare preview), root cause and fix

**Report** (PR #103, 2026-11-11): on the real iPhone preview of `coast-crazygames.html`, the strip read "Ready to build · Lay a boardwalk · 70" with an orange Build pill. Tapping Build did nothing, and the teal Details pill did nothing either. The earlier 57x report ("Ready to build does not open") was the same failure.

**Root cause, verified with the real SDK.**
- **The page loads the real CrazyGames HTML5 SDK v3** (`sdk.crazygames.com/crazygames-sdk-v3.js`). That SDK makes its modules (`SDK.game`, `ad`, `data`, `user`, `banner`, `analytics`) *getters that throw*:
  - `sdkNotInitialized` while it is not initialised;
  - `sdkDisabled` on a domain that is not CrazyGames. The disabled class is `get game(){throw new h(this.code,this.message)}`.
- **The preview never initialises it.** On `*.pages.dev`, `SDK.environment` stays `uninitialized`.
- **Every sound read `SDK.game`.** The app's `sfx()` calls `platform.muted()`, which reads `sdk()?.game?.settings?.muteAudio` (`platform-cg.mjs`). Optional chaining does not catch a throwing getter.
- **Both controls play a sound before acting:**
  - the strip: `sfx('tap')` then `showMap()`;
  - Details: `sfx('tap')` then `setDetails(true)`.

  So the tap threw "Uncaught [object Object]" and did nothing.
- **Why the tests missed it:** their stand-in SDKs never throw.
- **Why the hit target was not the cause:**
  - Under the finger at the visible centre of Build is `span.rsAction` inside `button#mapButton` (WebKit and Chromium). The pill sits in the strip's own border box.
  - Under Details is the button itself.
- **Live CrazyGames:** the SDK initialises before the board is shown, so this is not normally reached there. A tap before initialisation finishes (for example a slow init past the 25 s save timeout) would have hit the same throw.

**Reproduced with the real SDK file**, served on a fake `*.pages.dev` host, at 390×664 with finger taps:

| | Build pill → coast | Details → sheet |
|---|---|---|
| Before | not opened | not opened |
| After | opened | opened |

The page errors went from two "Uncaught [object Object]" to none. Evidence: `docs/evidence/v5-order-sheet-2026-11-11/3-real-sdk-preview-before-after.jpg`.

**Fix (focused):**
- **`v5/next/platform-cg.mjs`:**
  - `muted()` reads the SDK only when it reports `crazygames` (or `local`), inside a try, and is otherwise not muted;
  - `onMuteChange()` does its check inside its try.
- **`v5/next/app.mjs`:** `sfx()` can never throw, so a sound never stops the action that plays it.
- **Unchanged:** the CrazyGames mute setting is still followed when the SDK runs. No rule, save or Build-handler change.

**Regression tests:**
- `tests/v5-next-sdk-not-ready-browser.cjs`: a stand-in that throws exactly as the real SDK does, in both states, at 390×664 and 360×640, Chromium and WebKit, with finger taps at the visible centre of each control. The element under the finger is checked. It covers:
  - Build pill → coast → Build (120 coins once, stage 1 → 2);
  - Details → sheet → ✕;
  - a generator and a merge (both play sounds);
  - a reload.

  It times out on the old code and passes now.
- `tests/v5-next-sdk-not-ready.test.mjs`: `platform.muted()` and `onMuteChange()` never throw.

## Not verified

- **A real iPhone or Android phone,** including Safari's toolbar and the CrazyGames wrapper. The owner's real-device PASS is required before any upload.
- **The owner's earlier report** that "Ready to build" did not open on 57x is not reproduced: Chromium and WebKit (iPhone 13 profile, finger taps) pass. It must be rechecked on the phone with this build.
