# Vaultwake Merge: real-phone test record (iPhone Safari, Android Chrome)

**Status: PARTIAL OWNER-REPORTED PASS (2026-11-09).** The owner reports playing the branch preview on an **iPhone and PC** with an overall **PASS** result. This records the owner's report; the precise iPhone/browser version and individual 15-step results (including first-tap sound) were not supplied. **Android Chrome is NOT TESTED / not confirmed.** Automated browser CI is a separate source of evidence and does not count as a real Android test.

## What to test

- **Build:** the upload ZIP `vaultwake-merge-crazygames-basic-664956e.zip`. Its SHA-256 is in `SHA256SUMS`. The iPhone/PC pass above was on the earlier build `e72b4bb`; Later builds (`dd65d3f`, `664956e`) change only where progress is stored on CrazyGames, plus one save-status line in the menu.
- **Progress save on CrazyGames:** in the portal's private QA link, also check steps 11 and 15 once as a guest and once logged in to a CrazyGames account, and that the logged-in camp appears on a second device (`evidence/progress-save-2026-11-08.md`).
- **Easiest way:** open the branch preview on the phone: https://claude-v5-crazygames-release.wispwood-game.pages.dev/v5/coast-crazygames
  - This serves the same game files as the ZIP, but it is not the ZIP itself.
  - Outside CrazyGames there is no SDK, so the game runs in standalone mode.
- **Exact check:** in the CrazyGames developer portal, after a private upload, use its QA/preview link on the phone.
- **Start state:** use a private/incognito tab for the first run so it starts as a new player. About 10 minutes per phone.

## Checklist

Mark each row ✅ pass, ❌ fail (write what happened) or — not reached.

| # | Step | What should happen | iPhone Safari | Android Chrome |
|---|---|---|---|---|
| 1 | Open the link | Loading screen, then the Home screen with **Play**. No blank page, no stuck loader. | | |
| 2 | Tap **Play** | The board appears. Nothing is cut off at the top or bottom in portrait. | | |
| 3 | First tap sound | After your first tap on the board you hear sound. Check the phone is not on silent. On iPhone, sound often starts only after the first tap. | | |
| 4 | Make parts | Tap the **Rivet Rover**. A part appears and energy (ϟ) drops by 1. | | |
| 5 | Merge | Drag a part onto an identical part. It merges into the next part with an effect. Dragging with a finger does not scroll or zoom the page. | | |
| 6 | Crew order | When an order shows **Deliver**, tap it. Coins go up and energy +1. | | |
| 7 | Gold order | Deliver the gold order when it is ready. It brings the place's materials. | | |
| 8 | Build / restore | Tap the strip under the orders, then build a stage with coins. The scene changes and a short story beat shows. | | |
| 9 | Energy | Run energy low. The refill timer shows (+1 every 2 minutes). The 🛒 Shop sells energy for coins, and buying it works. | | |
| 10 | No ads | No "watch an ad" button anywhere: shop, energy, New order. | | |
| 11 | Save and reload | Note your coins, then close the tab fully and reopen the link. You are back with the same coins, board and built stages. | | |
| 12 | Rotate | Turn to landscape and back. Layout adjusts and nothing becomes unreachable. | | |
| 13 | Touch targets | Menu, **How to play**, 🛒 shop, collection book and order buttons can all be hit first time with a thumb. | | |
| 14 | Missing art | No broken-image icons or empty squares on the board, the orders, the coast or the menus. | | |
| 15 | Errors | No error message, freeze or crash during the test. | | |

## Owner-reported playtest result (2026-11-09)

| Platform | Reported result | Evidence limits |
|---|---|---|
| iPhone (browser version not specified) | **PASS — owner reported** | Owner played preview; individual checklist steps, first-tap sound and OS/browser details not independently verified |
| PC (browser not specified) | **PASS — owner reported** | Owner played preview; browser and per-step results not specified |
| Android Chrome | **NOT TESTED / not confirmed** | Must still be checked on a real Android phone |

This is a general playtest PASS, not an assertion that all 15 checklist items were explicitly tested. The table below remains open for detailed device QA evidence.

## Record (owner/tester fills in)

| | iPhone | Android |
|---|---|---|
| Tester | | |
| Date | | |
| Phone model | | |
| OS version | | |
| Browser and version | Safari | Chrome |
| Link used (preview or CrazyGames QA) | | |
| Result (all pass / issues) | | |
| Issues (step #, what happened, screenshot) | | |

When both columns read "all pass", item H in `OUTSTANDING_APPROVALS.md` can be closed. If something
fails, report the step number and a screenshot. The ZIP is not changed until a fix is agreed, and a
fix means a new build and a new checksum.
