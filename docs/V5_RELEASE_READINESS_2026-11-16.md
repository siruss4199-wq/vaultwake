# Vaultwake Merge: release readiness audit for a CrazyGames Basic Launch update (2026-11-16)

**Scope:** verification and reporting only.
- **Not done:** no merge, no upload, no publish.
- **No gameplay or UI change** was made for this audit.
- **Not modified:** the release folder (`release/crazygames-basic/`) and the live ZIP.

**The candidate:** PR #105 head `951af3b3636430fd4220d9db868cf861fa3e4081` (branch `claude/v5-first-10-minutes`), which stacks on PR #104 and PR #103.

**Legend:**
- PASS: verified, with the evidence named.
- FAIL: verified to fail.
- NOT TESTED: not done in this audit. It is open, not passed.
- "Automated" means a script or test in a browser in this container or CI. "Manual" means a person on a real device or in the real CrazyGames portal.

## 0. Verdict

**NO-GO for publishing the update today. GO to move to the owner-run gates** (real devices, CrazyGames private QA, legal items) once CI on `951af3b` finishes green.

Everything that can be verified automatically passes. The blockers are the checks that only a person can run:
- real phones;
- the real CrazyGames SDK and Data module, in private QA, with an existing player's cloud save;
- the open legal items.

## 1. PR stack

| PR | Branch | Head | Base | Mergeable | CI on that head |
|---|---|---|---|---|---|
| #103 Order details sheet, Build 57y | `claude/v5-order-details-sheet` | `f9da3ff` | `claude/v5-crazygames-release-package` @ `e6eddf6` | clean, no conflict | **PASS**: 3 jobs, runs 43061281277 and 43061291329 (order sheet / Build workflow in Chromium + WebKit; ZIP build of `822a8f9` with SHA-256 check; the ZIP's `index.html` in Chromium + WebKit) |
| #104 First Session 2.0 | `claude/v5-first-session-2-production` | `6bbee67` | #103 @ `f9da3ff` | "unstable" (an older run on the same head was cancelled), no conflict | **PASS**: run 43618261706 (unit; Coast Camp suites in Chromium and in WebKit) |
| #105 First 60 s + 10 min, tutorial | `claude/v5-first-10-minutes` | `951af3b` | #104 @ `6bbee67` | "unstable" (CI running), no conflict | Run 43793459523: **unit PASS**; the Chromium and WebKit suites were **still running when this report was committed**. This docs-only commit restarts CI on the same game code; its result is the gate (B1) |

**Stack shape:** `main` (`11896b9`) → … → `e6eddf6` (release package) → #103 → #104 → #105.
- `main` is an ancestor of the whole stack and has no newer commits, so there is nothing to conflict with.
- None of the live builds' commits (`664956e`, `822a8f9`, `e6eddf6`) is on `main`. Releases are built from the branch, not from `main`.

**Earlier #105 heads:**
- `d671dfa`: green.
- `de140bc`: WebKit failed with the known CI page-process loss (`Target page, context or browser has been closed`) in `tutorial-visual` and `rare-merges`. Chromium and unit were green. This is recorded on the PR (soak run 43702050248: the base fails the same way, 2 of 12 runs).

**Required checks:** none block the PRs. The merge state shows "clean" or "unstable", never "blocked".

## 2. Which build is live

| | Commit | ZIP | Status |
|---|---|---|---|
| **Expected live build** | `822a8f9` (Build 57y) | `vaultwake-merge-crazygames-basic-822a8f9.zip`, SHA-256 `b160a59a…e890` (built and checked by CI on #103) | The owner reported uploading it on 2026-11-12. CrazyGames auto-approved it. **The match to the CrazyGames build ID is UNVERIFIED** (CrazyGames shows no checksum). |
| Previous live build | `664956e` | `release/crazygames-basic/vaultwake-merge-crazygames-basic-664956e.zip`, `14ed8d0d…db7d` | Basic Launch from 2026-11-11 |

**Reproducing the live ZIP here:** rebuilding `822a8f9` in this container gives `47fec11c…`, not `b160a59a…`. The ZIP bytes depend on the build machine, so byte identity can only be checked on the CI runner. The file contents were compared instead (§5).

**Basic Launch window:** it ends **2026-12-02 03:01 UTC**, when CrazyGames reviews plays, playtime, D1 and conversion. An update inside the window changes what that review measures. That is an owner decision.

## 3. Release-readiness checklist

### 3.1 Gameplay regression (candidate `951af3b`)

| Gate | Automated result | Evidence | Manual (real device) |
|---|---|---|---|
| New player to first Build | **PASS** (Chromium, local) | `v5-next-tutorial-endpoint-browser.cjs`, `v5-next-first-session-2-browser.cjs`, `v5-next-guide-browser.cjs`; the packaged ZIP played to the first Build (`zipplay.json`) | NOT TESTED |
| Tutorial completion (ends at the first Build, persists, Skip) | **PASS** (Chromium) | `v5-next-tutorial-endpoint-browser.cjs` (360/390 px), `v5-next-tutor.test.mjs` | NOT TESTED |
| Normal play after the tutorial | **PASS** (Chromium) | endpoint suite (no guide, spotlight or cue; Hint works); `v5-next-core-actions-browser.cjs` | NOT TESTED |
| Orders and Gold Orders | **PASS** | unit sims; `core-actions`, `rare-merges`, `ch1-rare`, `build-flow` suites | NOT TESTED |
| Energy and rewards | **PASS** | `energy-browser`, `rewards-browser`, `extras-browser`; unit economy guards | NOT TESTED |
| Chapter progression 1–6 | **PASS** | `chapter2`–`chapter6` browser suites, chapter unit tests | NOT TESTED |
| Home, reload and Continue | **PASS** | `home-browser`, `initial-view-browser`, `saves-browser`, cross-build save test (§3.2) | NOT TESTED |
| Unit and simulation tests | **PASS**: 494/494 | `node --test tests/v5-*.test.mjs` on `951af3b` (local and CI) | n/a |
| All 34 Coast Camp browser suites | **PASS** (Chromium, local, on the same game code as `951af3b`) | the CI workflow's list. `v5-next-browser` and `v5-next-playtest-browser` also launch WebKit, which is not installed here; their Chromium parts pass | n/a |
| WebKit (Safari engine) | **PENDING** (CI) | CI on this report's commit (same game code as `951af3b`) | NOT TESTED (iPhone) |

**Gameplay changes an existing player will see** (approved in PR #105):
- **The camp tent:** "Pitch the camp tent" now gives a Survey Kite instead of +8 energy. Only camps that have not built it yet are affected.
- **Level 3 crew orders:** their "ladder" (`secondaryNeed`) changes, within the existing allowance.
- **The tutorial:** it now runs only for a new camp until its first Build. Camps with a stage built never see it.

### 3.2 Save safety

| Gate | Automated result | Evidence | Manual |
|---|---|---|---|
| A save written by the **expected live build** (`822a8f9`) opens in the candidate | **PASS** | `crossver.cjs`. Each build's own code wrote the camp: a new camp played 40 actions; the chapter-2 fixture played 5. In the candidate: Home offers Continue; coins, built stages, materials, level, orders done, board, shed and area are identical; no tutorial on a camp with a stage built; an action plus a reload keeps the camp; no page errors | NOT TESTED on CrazyGames |
| A save written by the **previous live build** (`664956e`) opens in the candidate | **PASS** | same script | NOT TESTED |
| **Rollback:** the candidate's save opens in the live build | **PASS** | same script. The same camp, no errors | NOT TESTED |
| No progress reset; no new-player flow for an existing camp | **PASS** | same script; `newcomer.mjs` unit tests (any stored, kept or unreadable camp, or an unread cloud, is never new); `first-session-2` existing-save section | NOT TESTED |
| Save format and keys unchanged | **PASS** | `save-store.mjs`, `saves.mjs`, `v4/platform.mjs`, `core.mjs` and `replay.mjs` are byte-identical to `822a8f9`. No version or migration change. Keys: `vaultwake-v5-coast` (+ `-energy-receipts`, `-story`, `-playtest`, kept/backup copies) | n/a |
| Local and CrazyGames Data-module compatibility | **PASS** with a stand-in SDK | `crazygames-save-browser`: a new guest saves to the Data module; reload and second device continue; saving continues after a login; a browser camp is copied in and kept; a refusing Data module falls back to localStorage; slow SDK init. ZIP play: the camp is restored from the Data module after a reload | **NOT TESTED with the real SDK on this candidate.** On `664956e`, logged in: owner-reported PASS (2026-11-09). Guest, second device and Android are still open |
| Reload and interrupted-save recovery | **PASS** | `saves-browser` (newer/damaged save kept, restore round trip, backup collisions); `home-browser` (damaged save kept, Retry); save-store unit tests (refused writes read back, journal) | NOT TESTED |
| Payload limits | **PASS** | `DATA_LIMIT` 1 MiB per key and budget handling are unit-tested (`dataOverLimit` and `dataFull` fall back to localStorage). Measured: a chapter-2 camp's main save is 4.7 KB, about 6 KB with all keys | n/a |

**One recorded difference, not a regression:** opening the chapter-2 fixture writes one-time "seen" flags (`extras-rig`, `door`), which count as moves (+1 or +2). The live build does exactly the same (`seen` check in this audit).

### 3.3 CrazyGames integration

| Gate | Result | Evidence | Real SDK / portal |
|---|---|---|---|
| Entry point | **PASS** | The ZIP's `index.html` redirects to `v5/coast-crazygames.html`, which loads `sdk.crazygames.com/crazygames-sdk-v3.js` with `data-platform="crazygames" data-launch="basic" data-ads="off"` | NOT TESTED |
| SDK init and loading signals | **PASS** (stand-in) | ZIP play: `init → loadingStart → loadingStop → gameplayStart`, in that order, once each; the same after a reload | NOT TESTED |
| gameplayStart / gameplayStop | **PASS** (stand-in) | one `gameplayStart` per load (the double start was fixed in #104, unit `v5-next-lifecycle.test.mjs`); `home-browser` checks the exact call order around Home and back | NOT TESTED |
| Rewarded ads | **PASS: disabled for Basic Launch** | `adsAvailable()` and `rewardedAd()` return unavailable when `data-ads="off"`; 0 `requestAd` calls in ZIP play; `crazygames-browser`: no ad UI; the stand-in ad runs only on localhost. Unchanged since the live build except the lifecycle queue | NOT TESTED |
| Cloud saves | **PASS** (stand-in) | §3.2 | NOT TESTED (real Data module, guest/login/second device) |
| Loading behaviour | **PASS** | about 1.28 MB transferred before `gameplayStart` (ZIP play); modules preloaded in Chromium (`load-browser`); a new player's board comes before Home's pictures | NOT TESTED on a real network |
| Console errors | **PASS** | ZIP play: 0 console errors, 0 page errors, 0 failed requests, no request to any other origin; `crazygames-browser`: no errors at 907×510, 390×844, 360×780 | NOT TESTED |
| SDK not ready / disabled | **PASS** | `sdk-not-ready-browser` (taps never die on a throwing SDK) | n/a |

### 3.4 Release package (candidate ZIP built in this container, not committed)

| Gate | Result | Evidence |
|---|---|---|
| Build | **PASS** | `node tools/coast-crazygames.mjs --check` and `--zip` at `951af3b`: 336 files, 14,881,777 bytes (14.2 MB; 14.8 MB unpacked), SHA-256 `20baf495…0be0`. **Not the release artifact:** the canonical ZIP must be built and checked by CI (see §5 step 4) |
| ZIP integrity | **PASS** | `unzip -t`: no errors (candidate and the rebuilt live ZIP) |
| Correct game files vs the live build | **PASS** | contents compared with `822a8f9`'s ZIP: **0 files removed, 0 assets changed**, 2 modules added (`v5/next/newcomer.mjs`, `v5/next/tutor.mjs`), 10 code/style files changed (`coast-crazygames.html`, `app.mjs`, `areas.mjs`, `boot.js`, `coastal.css`, `game.mjs`, `guide.mjs`, `home.css`, `home.mjs`, `platform-cg.mjs`) |
| No debug or test-only artifacts | **PASS** | no `.map`, `.cjs`, test or fixture files; no `debugger`; the stand-in ad path is localhost-only. Note: a new read-only diagnostic global `VWGuide` (next to the existing `VWSave`) |
| All assets resolve | **PASS** | the ZIP served as unpacked: 0 failed requests through the tutorial to the first Build, the coast screen, a reload and Continue; `crazygames-browser` against the ZIP |
| Save keys unchanged | **PASS** | §3.2 |
| Size | **PASS** | 14.2 MB compressed, the same as the live build (+24 KB); 1.28 MB before gameplay |

## 4. Legal and portal gates

| Gate | Status | Evidence / what is left |
|---|---|---|
| Shipped artwork rights | **Unchanged since approval** | No image changed or was added (§3.4), so the owner's 2026-11-08 approval of the 264 shipped images still covers the package. That approval is owner attestation, not third-party clearance (`release/crazygames-basic/RIGHTS_REPORT.md`) |
| OpenAI Sharing & Publication Policy (D) | **OPEN** | The owner's "read" or "risk accepted" is still missing (`OUTSTANDING_APPROVALS.md` D) |
| Name "Vaultwake Merge" trademark (F) | **OPEN** | USPTO and EUIPO were clear on 2026-11-08. WIPO, TMview and the Mongolian register searches and the keep/change decision are still owner actions |
| Android Chrome device test (H) | **OPEN** | not done |
| Real-device PASS for #103, #104 and #105 | **OPEN** | Each PR states it is required before upload. The playtest checklist is `docs/V5_PLAYTEST_CHECKLIST_2026-11-15.md` |
| CrazyGames private QA of the update | **NOT TESTED** | must use the portal's private QA link: guest + reload; logged in + reload; second device; **an account that already has a live-build camp must keep it** |
| Store media | **Owner check** | The covers use the same art. The two gameplay videos were recorded on an older build and do not show the new tutorial; CrazyGames may expect media that matches the game |
| Store text (`METADATA.md`) | **Owner check** | still accurate in substance; the developer/publisher name depends on F |
| CrazyGames policy for Basic Launch | **PASS (automated)** | no ads, no purchases, no external links or requests |
| Live-build identity | **UNVERIFIED** | Keep the `822a8f9` ZIP (`b160a59a…`) as the rollback build. Rollback save compatibility passed (§3.2) |

## 5. Blockers

| # | Blocker | Type | Who |
|---|---|---|---|
| B1 | CI: the Chromium and WebKit browser suites on the candidate's code are pending (run 43793459523 on `951af3b` was still running; CI re-runs on this report's docs-only commit) | automated | CI |
| B2 | No real-device PASS (iPhone Safari, Android Chrome) for the #103–#105 changes | manual | owner / testers |
| B3 | No real CrazyGames private-QA run of the candidate, especially an existing player's cloud save carried over from the live build | manual (portal) | owner |
| B4 | Legal items D and F open. They were open at the original Basic Launch too, so this is an owner decision, not a new finding | legal | owner |
| B5 | PR #105's open owner decisions: the rare-gold tail with the ladder, and gold-first repetition at 13% | design | owner |

## 6. Recommended release sequence

1. **CI:** wait for CI on `951af3b` to finish green in Chromium and WebKit. A WebKit page-process loss is re-run once; anything else is fixed first.
2. **Real phones:** run the real-device playtest on the pinned preview (`https://bbd233e8.wispwood-game.pages.dev/v5/play.html`, the same game code), with an iPhone (Safari) and an Android phone (Chrome), using `docs/V5_PLAYTEST_CHECKLIST_2026-11-15.md`.
3. **Owner decisions:** the timing within the Basic Launch window (ends 2026-12-02), PR #105's two open design items, and legal D and F.
4. **Canonical ZIP:** on owner approval, a CI job builds the release ZIP from the approved head (as `v5-basic-zip-822a8f9.yml` did for `822a8f9`), records its SHA-256 and tests that ZIP's `index.html` in Chromium and WebKit. Only that ZIP is uploaded.
5. **Private QA:** the owner uploads it as a new build in the portal without publishing, and runs private QA:
   - guest, then reload;
   - logged in, then reload;
   - a second device;
   - Android;
   - an account with a live-build camp keeps it.
6. **Publish:** the owner publishes. Keep `822a8f9`'s ZIP (`b160a59a…`) as the rollback build. Its saves are compatible both ways (§3.2).
7. **Merges, owner's choice:** #103 → #104 → #105 into their bases (stacked; never merged automatically). The release does not depend on the merge, because the ZIP is built from the approved commit.

**Owner approval gate:** nothing beyond step 1 happens without the owner.

## 7. Evidence

All in `docs/evidence/v5-release-readiness-2026-11-16/`:
- `crossver.cjs` and `crossver.txt`: saves across builds (live 822a8f9 and previous 664956e → candidate → rollback).
- `zipplay.cjs` and `zipplay.json`: the packaged ZIP with a stand-in SDK v3 (lifecycle, Data module, failed requests, console, bytes).
- Commands run on `951af3b`:
  - `node --test tests/v5-*.test.mjs` (494 pass);
  - each `tests/v5-next-*-browser.cjs` with `ENGINES=chromium`;
  - `node tools/coast-crazygames.mjs --check|--zip`;
  - `unzip -t`;
  - a file-by-file comparison of the candidate and live ZIP contents.
