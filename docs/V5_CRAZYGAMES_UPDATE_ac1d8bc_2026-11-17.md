# Vaultwake Merge — CrazyGames update from `ac1d8bc` (2026-11-17)

**Status: PRIVATE QA CANDIDATE. Not uploaded to CrazyGames, not submitted, not published.**

| | |
|---|---|
| Source commit | `ac1d8bcbf507dcdf0f8bbf060ce618103f8a1ba8`, the head of PR #106 (`claude/v5-board-full-rescue`) |
| Release branch | `claude/v5-crazygames-update-ac1d8bc` |
| ZIP | `release/crazygames-update-ac1d8bc/vaultwake-merge-crazygames-basic-ac1d8bc.zip` |
| SHA-256 | `253dcb715440f12198d3074abf5a14c92b90caa5ffe4ea4a70ab36f6e34adb32` |
| Size | 14,886,738 bytes; 337 files |
| Build | `node tools/coast-crazygames.mjs --zip` (`SOURCE_DATE_EPOCH` default 2026-01-01T00:00:00Z) |
| Tested by | CI run [44119749481](https://github.com/siruss4199-wq/vaultwake/actions/runs/44119749481) on `dafadbf` (all 6 jobs green). Its publish job committed the ZIP in `9fc710e` |
| Game | the existing CrazyGames game **166859**, Basic Launch (`data-launch="basic"`, `data-ads="off"`). This is an update, not a new game or a new Basic Launch |
| Live build (rollback) | `822a8f9`: `vaultwake-merge-crazygames-basic-822a8f9.zip`, SHA-256 `b160a59a9f0ac9ff78fe968b638433ea104bf7fde6363667528d4365e067e890` |

## 1. What the candidate contains

`ac1d8bc` descends from the live build `822a8f9`. These commits are its ancestors (checked on a full clone; a shallow clone gives false negatives):

| Change | Commit |
|---|---|
| First Session 2.0 | `6bbee67` |
| First 10 Minutes tutorial (ends at the first Build) | `ecde162` |
| Shed overlay hotfix (mobile) | `b04d6c3` |
| Board Full Rescue, and its own once-only flag `tip-rescue` | `3396861`, `bd68669` |
| Shed test seeds `tip-rescue` (test only) | `ac1d8bc` |

**Save code is identical to live:** `save-store`, `saves`, `v4/platform`, `core` and `replay`. The save format has no new field; `tip-rescue` is one more key in the existing `seen` object and passes `SEEN_ID` in every build, so a rollback still loads the camp.

**Gameplay changes against live come only from the approved stack:**
- the tent gives the Survey Kite (owner kept this);
- the Level 3 crew-order "ladder" (`secondaryNeed`) changes, within the existing allowance. This is **owner decision B5, still open**;
- the `gameplayStart` queue.

## 2. Release CI: failures and fixes

**First run, [44116200314](https://github.com/siruss4199-wq/vaultwake/actions/runs/44116200314) on `178ea68`: failed.** The two builds were byte-identical (`253dcb71…db32`) and every gameplay suite passed against the extracted ZIP. Three faults in the release harness stopped it; none was in the game.

| # | Failure (exact) | Cause | Fix (`dafadbf`) |
|---|---|---|---|
| 1 | Chromium + WebKit: `Cannot find module 'playwright'` from `zipplay.cjs` and `crossver.cjs` | The scripts run from the `ci/` checkout, so `require('playwright')` searched `ci/node_modules`. Playwright is installed in the source checkout | The steps run with `NODE_PATH="$PWD/node_modules"` |
| 2 | WebKit only: `v5-next-crazygames-save-browser.cjs` at `enter()`: `null is not an object (evaluating 'h.hidden')` on the second-device `goto` of the ZIP's `index.html` | `index.html` is a one-line `location.replace("v5/coast-crazygames.html"+location.search)`. The suite's `waitForFunction` predicate reads `#home` without a null check. If it runs while the redirect has not committed, it throws, and WebKit does not retry a predicate that throws. Suites that wait with `waitForSelector` go through the same redirect and pass | The save suite opens the game page `v5/coast-crazygames.html`, which is the file the redirect loads. The ZIP entry is covered by a new redirect diagnostic (below) and by the suites that already enter through `index.html`. The CrazyGames page, SDK-not-ready and payload checks are separate steps now, so one failure no longer hides the others |
| 3 | "Keep the test outputs" failed on a missing file | `cp` of all outputs at once | The files are copied one at a time, with "missing …" reported |

Also in `dafadbf`:
- **Engine proof.** `zipplay`, `crossver` and `redirect-diag` assert that the launched browser is the one asked for (`browser.browserType().name()`) and record its version. A final "Engine check" step fails if any suite or script line names the other engine.
- **Pinned bytes.** `EXPECTED_SHA256` is set in the workflow. The build job fails unless it reproduces exactly that hash.

No test suite, game file or ZIP content changed.

**Second run, [44119749481](https://github.com/siruss4199-wq/vaultwake/actions/runs/44119749481) on `dafadbf`: all green.**

| Job | Result |
|---|---|
| Build a (with unit and simulation tests at `ac1d8bc`) | ✅ |
| Build b | ✅ |
| The two builds are byte-identical, SHA-256 = pinned value | ✅ |
| Test the extracted ZIP (chromium) | ✅ 19/19 steps |
| Test the extracted ZIP (webkit) | ✅ 19/19 steps |
| Keep the tested ZIP on this branch (commit `9fc710e`, `[skip ci]`) | ✅ |

## 3. The WebKit `#home` investigation

`redirect-diag.cjs` makes 15 fresh loads of the extracted ZIP's `index.html` per engine, with a stand-in CrazyGames SDK v3. For each load it records:
- what `page.goto()` returns: the path, `readyState`, and whether `#home` exists;
- the landing on `v5/coast-crazygames.html`;
- the boot;
- errors, failed requests and outside origins.

| Engine | Loads | `goto()` returned on `index.html` | `#home` null at return | Reached game page | Booted | Boot ms (min–max) | Errors / failed requests / outside origins |
|---|---|---|---|---|---|---|---|
| Chromium 151.0.7922.34 | 15 | 0 | 0 | 15/15 | 15/15 | 197–279 | 0 / 0 / 0 |
| WebKit 26.5 | 15 | 0 | 0 | 15/15 | 15/15 | 739–2028 | 0 / 0 / 0 |

**Finding:** the redirect is sound in both engines. It always landed and booted, and nothing failed. In these 15 loads `goto()` never returned on `index.html`, so the race behind failure 2 was **not reproduced**.
- The failure is a test-harness timing issue: a predicate that throws on a page that is still redirecting.
- It is not a game fault. On CrazyGames the redirect runs inside the portal's iframe, with no harness predicate.
- The entry through `index.html` passed in WebKit in every suite that uses it:
  - CrazyGames page at 907×510, 390×844 and 360×780;
  - SDK not ready;
  - initial download;
  - Build flow;
  - core actions, tap flicker, coast ×, strip tap;
  - the stand-in SDK play-through to the first Build.

**Separate issue, not this release:** WebKit's page process is lost in long CI jobs ("Target page, context or browser has been closed"). The browser process exits with code 0 and no signal, and memory is fine. In isolation, run [44116200546](https://github.com/siruss4199-wq/vaultwake/actions/runs/44116200546) ran each suite alone in its own job, 3 tries each:
- the candidate `ac1d8bc` passed 9/9;
- the base `ae83302`, before Board Full Rescue, failed 2 (shed overlay try 3, build flow try 3).

So the issue predates this PR. Its root cause is still unknown.

## 4. Test results on the extracted ZIP (run 44119749481)

Every line below passed in **both** Chromium 151.0.7922.34 and WebKit 26.5. Each engine job ran only its own engine; the engine check found 0 lines naming the other engine. The raw outputs are in `release/crazygames-update-ac1d8bc/ci-results/`.

| Area | Checks |
|---|---|
| Entry | redirect diagnostic, 15/15 loads |
| Saves (Data module) | a new guest saves to the Data module; reload and second device continue; saving continues after a login event; a browser camp is copied in and kept, with the account camp kept beside it; a delayed restore is not lost; a refused Data module falls back to localStorage; slow SDK init on a CrazyGames host survives reload; a refused save survives reload |
| CrazyGames page | SDK lifecycle, no ads, nothing leads out, fits, no errors, at 907×510, 390×844 and 360×780 |
| SDK not ready | `sdkNotInitialized` and `sdkDisabled` at 390×664 and 360×640: taps never die |
| Initial download | 1.261 MB, 87 requests before `gameplayStart` (limit 20 MB). Note: this suite measures all three engines in each job by design, so it is a byte count, not an engine test |
| Build flow | 360×640, 390×664, 390×844, 430×932: not ready → gold → crew → Ready to build → coast → Build once → stage 2 → reload |
| Core actions | the same 4 viewports: generator, merge, order → Details (✕, outside, Esc), find generator, strip → coast, shed in/out, Home → Continue |
| Tap flicker, coast ×, strip tap | pass |
| Shed overlay hotfix | 390×664, 360×640, 430×932: the art stays inside the shed on every path; nothing duplicated or lost |
| Board Full Rescue | 390×664 and 375×667: deliver (auto, once), merge (Hint), Shed, confirmed Clear, waiting rewards, nothing to do, reload; an old save with `tip-shed` gets the rescue once |
| Tutorial endpoint | 390×664 and 360×640: guided to the first Build, "Tutorial complete" once, normal game after; Skip; an existing save is never guided |
| Stand-in SDK v3 play-through (`zipplay`) | a new player reaches the first Build (`beach-path` 1, 40 coins, 30 moves). Reload → "Continue" from the Data module. SDK order: `init loadingStart loadingStop gameplayStart`; `gameplayStart` ×1; `requestAd` ×0. 0 console or page errors, 0 failed requests, 0 outside origins |
| Saves across builds (`crossver`) | 62/62 PASS per engine, 0 FAIL: live `822a8f9` and previous `664956e` camps (a new camp, and the chapter-2 fixture with 82 orders and level 34) open in this ZIP with "Continue". Coins, built, materials, level, orders, board, shed and area are kept. A built camp is never put in the tutorial. Rolling back to the source build opens the same camp unchanged. The only difference is one new one-time seen flag (moves 1586 → 1587, seen 4 → 5), the same behaviour the live build has |

**Local checks of the committed files** (container, `9fc710e`):
- `sha256sum -c SHA256SUMS`: OK.
- `unzip -tq`: no errors.
- `cmp` against a local `node tools/coast-crazygames.mjs --zip` at `ac1d8bc`: byte-identical.

## 5. GO / NO-GO

**GO for CrazyGames private QA** of this ZIP as a new build of the existing game 166859.

**NO-GO for public release** until these owner-run gates are done:
1. **Private QA on real devices** through the CrazyGames QA/preview tool (iPhone Safari, Android Chrome, desktop). This must include:
   - an existing live camp, logged in, opening with Continue;
   - a guest run.

   Android has never been tested on a real device.
2. **B5**: the owner's decision on the Level 3 ladder and the rare-gold tail (PR #105).
3. **Legal D** (OpenAI Sharing & Publication Policy) and **F** (trademark searches and the name decision). Both are still open, as at the original Basic Launch.
4. **WebKit page loss in CI**: track it separately. It also happens on the base, and it is not a release blocker for this ZIP.

**Time limit:** Basic Launch ends **2026-12-02 03:01 UTC**.

Private-QA steps: `release/crazygames-update-ac1d8bc/README.md`.
