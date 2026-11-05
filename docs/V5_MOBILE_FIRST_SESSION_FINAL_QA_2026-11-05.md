# V5 mobile first-session final QA — 2026-11-05

Base: `codex/v5-first-session-energy-balance`, **8c0cdf54934468fb3f395127dd935a646f0aae8d**. Candidate branch: `codex/v5-mobile-first-session-final-qa`. The exact candidate SHA and ZIP checksum are recorded in the generated **BASIC-QA-REPORT.md** Actions artifact and the Draft PR; this document does not substitute an older run for final-head evidence.

## Confirmed issues and fixes

| Issue | Reproduction/evidence | Result |
| --- | --- | --- |
| Top safe-area padding applied twice | Chromium native CSS safe-inset override, 47px top/34px bottom, 390×664. The page reserves 47px, then the 52px header adds another 47px. Energy bottom is **112.5px**, overlapping orders starting at **103px**. | Header uses its normal 6px padding; the page owns the safe inset once. All HUD controls fit above the orders. WebKit additionally checks synthetic inset geometry. Physical Safari remains UNVERIFIED. |
| Energy HUD conflates natural refill and stored energy | Fresh camp displays `100/50 BONUS`; the denominator and bonus amount are unlabeled. | The denominator is labeled **REFILL**, the badge shows **+50 BONUS**, and the existing recovery panel explains current energy, stored bonus, refill limit/rate and storage max. `REFILL FULL` describes a full natural refill pool. No new board button. |
| Undersized main touch targets | Measured energy target **32px**, guidance **28px**, Shed toggle **42px** high. | These and selection action buttons are at least **44px** high. The painted energy frame retains its original visual position. Shed gains bottom scroll margin above the safe area. |
| Dense saved-camp HUD overflows with wider phone fonts | The new CI matrix caught document overflow in WebKit at 390×664 with 200 energy, L1 capacity 50 and 99,999 coins. | Compact the 381–430px header gaps and coin end padding. Keep the full numbers, 44px controls and overflow assertion. |

At 360×640, 390×664 and 430×752, the base already allowed document scrolling to the Shed; it was **not** an unreachable-control regression. The board keeps its size, and the candidate preserves that scroll path instead of shrinking merge cells or adding a fixed dock.

## Preserved behavior

`game.mjs`, `energy.mjs`, `areas.mjs`, `saves.mjs`, `energy-receipts.mjs`, `platform-cg.mjs` and all `v5/assets` files are unchanged from the pinned base. No economy, progression, save-key, reward amount, ad policy or artwork changes.

- New camps retain **100 energy**. Existing camps retain stored energy and completed progress.
- Natural capacity remains **50 at L1, 60 at L3, 70 at L5, 80 at L8, 100 at L12**; storage max **200**; refill **+1/120 seconds**.
- First ordinary Crew **+15**, first three build stages **+20/+10/+10**, field ration **+8** with its existing eligibility/cooldown, levels and authored rewards remain unchanged.
- Coin exchange remains **80 → 20**, three daily. Full optional rewarded energy remains **25**, two successful completions daily. Basic stays ads-off; no onboarding ads or stand-in production rewards.

## Executed mobile audit

The new browser matrix executes **Chromium and WebKit at all three shortened portrait viewports**, fresh and representative legacy saves. Each completes the actual UI sequence **generator → merge → ordinary delivery → Gold delivery → first restoration → next objective**, without injecting tutorial resources. The hand cannot intercept input; rewards are observed in the actual DOM. Reload and tab roundtrip preserve paid milestones. Old saves are not topped up to 100. Level-capacity fixtures and the densest 200-energy/99,999-coin HUD fit.

Every initial order can scroll fully into view, rewards remain visible, main targets meet 44px, and the opened Shed slots can scroll above a 34px bottom inset. Chromium uses native CDP CSS `env()` overrides. WebKit uses explicitly **synthetic CSSOM inset substitution**. Browser chrome is represented by shorter visual viewports. These are layout checks, not physical Safari certification or OS-suspension testing. Drag automation uses pointer input; touch taps use Playwright's touchscreen.

```sh
SHOTS=/tmp/mobile-matrix node tests/v5-mobile-first-session-browser.cjs
MINUTES=20 ACTION_MS=5000 SHOTS=/tmp/mobile-paced node tools/v5-mobile-paced-session.cjs
```

The optional paced runner uses **real wall-clock time and visible UI actions**, with no virtual time, injected resources, ad watching or energy purchases. It records actual elapsed time, order/build timings, energy/coins, a ten-minute reload and a fifteen-minute tab roundtrip. Final measured results belong to its `report.json` and the Draft PR; merely invoking the runner is not a pass. Neither scripted play nor simulation proves player retention.

A separate normal-motion input smoke completed **three stages in 91 real game actions**. The runner uses native touch at visible, enabled, unobstructed targets, waits for the build story after its animation, and inspects/declines the optional daily gift through the UI. These changes handle automation timing without forcing clicks, disabling game animation, granting resources or relaxing gameplay assertions. The fast smoke is not a substitute for the recorded twenty-minute run.

Existing rule/economy, onboarding/HUD, energy/ad safeguards, rare orders, save recovery, Chapter 1–6, Classic compatibility and release suites remain enabled. Only the intentional `BONUS` badge expectations change to the exact stored amounts; no pacing thresholds, unrelated assertions or timeouts are relaxed. All required automatic jobs must pass on the final PR head before a GO for candidate review.

## Screenshots

Authentic browser captures; no compositing or generated artwork. Fresh-state pairs use the same viewport and starting resources. Browser chrome itself is not photographed.

| Browser/viewport | Before | After |
| --- | --- | --- |
| Chromium 360×640 | [Before](qa/mobile-first-session-2026-11-05/before/chromium-360-fresh.png) | [After](qa/mobile-first-session-2026-11-05/after/chromium-360-fresh.png) |
| Chromium 390×664 | [Before](qa/mobile-first-session-2026-11-05/before/chromium-390-fresh.png) | [After](qa/mobile-first-session-2026-11-05/after/chromium-390-fresh.png) |
| Chromium 430×752 | [Before](qa/mobile-first-session-2026-11-05/before/chromium-430-fresh.png) | [After](qa/mobile-first-session-2026-11-05/after/chromium-430-fresh.png) |
| WebKit 360×640 | [Before](qa/mobile-first-session-2026-11-05/before/webkit-360-fresh.png) | [After](qa/mobile-first-session-2026-11-05/after/webkit-360-fresh.png) |
| WebKit 390×664 | [Before](qa/mobile-first-session-2026-11-05/before/webkit-390-fresh.png) | [After](qa/mobile-first-session-2026-11-05/after/webkit-390-fresh.png) |
| WebKit 430×752 | [Before](qa/mobile-first-session-2026-11-05/before/webkit-430-fresh.png) | [After](qa/mobile-first-session-2026-11-05/after/webkit-430-fresh.png) |
| Native top/bottom safe inset, Chromium 390×664 | [Overlap](qa/mobile-first-session-2026-11-05/before/chromium-390-safe-area.png) | [Separated controls](qa/mobile-first-session-2026-11-05/after/chromium-390-safe-area.png) |
| WebKit opened Shed, 390×664 | [Before](qa/mobile-first-session-2026-11-05/before/webkit-390-shed.png) | [After](qa/mobile-first-session-2026-11-05/after/webkit-390-shed.png) |

## Exact-head Basic release evidence

The package workflow checks generated-page synchronization, builds/unpacks the ZIP, plays its actual root entry in **Chromium/WebKit/Firefox**, measures initial transfer against **20 MiB phone / 50 MiB landscape** limits, and tests the separate Full reward path with SDK stubs. Its generated `BASIC-QA-REPORT.md` includes the exact source SHA, ZIP SHA-256, six transfer measurements, run URL and unverified gates. Both archives and checksums are retained as `vaultwake-crazygames-QA-<head-sha>`. Download the artifact matching the final PR head; ZIP timestamps mean independently rebuilt archives may have different checksums.

The existing Cloudflare Pages GitHub integration provides a branch preview after a push. Use the **immutable preview URL from the final commit's successful Cloudflare check**, with `/v5/play.html`; the root still serves the repository's older entry page. No manual deployment, production upload or merge is part of this QA. A preview has its own browser-storage origin, so its camps are separate from another site's camps without renaming any save key.

## Release decision and remaining gates

**GO for Draft candidate review only when final-head automatic checks and the recorded paced run pass. NO-GO for commercial publication.** The following remain **UNVERIFIED** and require human/platform evidence:

- Physical iPhone Safari and Android Chrome: browser bars expanded/collapsed, home-indicator/notch insets, touch drag/scroll, audio/haptics, OS background/lock and existing-save continuity. Use the [real-device checklist](V5_MOBILE_REAL_DEVICE_CHECKLIST.md).
- Real CrazyGames SDK behavior and Basic portal acceptance; production rewarded-ad availability/completion for any later permitted Full launch. Stub success/failure tests do not constitute this acceptance.
- Real-player first-session experience and retention; no retention claim follows from automated play.
- The existing [commercial release gates](VAULTWAKE_V5_RELEASE_GATE_2026-11-04.md): final art/title rights clearance, listing/cover/video approval and submission/account signoff. This audit does not clear them.

No merge or production publication is authorized or performed by this report.
