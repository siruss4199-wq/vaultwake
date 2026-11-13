# Vaultwake Merge: First Session 2.0 in production (2026-11-13)

**Status: DRAFT, not released.** This work is not merged, not packaged and not uploaded. The live CrazyGames build is untouched.

**Branch:** `claude/v5-first-session-2-production`, started from `822a8f9`.

**Design references (approved):**
- `docs/V5_FIRST_SESSION_2_PROTOTYPE_2026-11-12.md`
- `docs/V5_TUTORIAL_2_PROTOTYPE_2026-11-13.md`
- prototype `b7f4220` on `claude/v5-first-session-prototype`

The prototype branch is used as a reference only. It is not merged.

## 0. Baseline and the live build (identity UNVERIFIED)

| | Commit | ZIP SHA-256 | What is known |
|---|---|---|---|
| **Development baseline** | `822a8f9d85f209fd389ccee3a92b0b710b943251` (Build 57y, 2026-11-11) | `b160a59a9f0ac9ff78fe968b638433ea104bf7fde6363667528d4365e067e890` (`vaultwake-merge-crazygames-basic-822a8f9.zip`, built and tested by `.github/workflows/v5-basic-zip-822a8f9.yml` on `claude/v5-order-details-sheet`) | The owner reports uploading an updated ZIP on 2026-11-12. CrazyGames auto-approved it and it went **live**. It is expected to be this build. **The match between this ZIP and the CrazyGames build ID has not been verified** (no checksum from CrazyGames). It is recorded as *expected*, not confirmed. |
| Previous live build | `664956e` | `14ed8d0d5a741507201e594d4099b05814f3d9d1a89982121647342f9873db7d` (`release/crazygames-basic/`) | The Basic Launch submission of 2026-11-09, live from 2026-11-11 (`release/crazygames-basic/OUTSTANDING_APPROVALS.md`). `822a8f9` contains it (15 commits later). |

**Build 57y fixes kept, because the branch starts at `822a8f9`:**
- `ca977f3`: the order details bottom sheet on phones, and the Build workflow protected;
- `3974b75`: a tap never dies on a CrazyGames SDK that is not ready;
- `5b5d006`: a tap repaints only what changed (iPhone flicker);
- `822a8f9`: the sticky coast ×.

PR #103's later commits (`bf24160` to `f9da3ff`) change only CI and `tools/ci-*` helpers. The two helpers this branch's CI needs (`tools/ci-static-server.mjs`, `tools/ci-unzip.mjs`) are copied in unchanged.

**Not touched:**
- `release/crazygames-basic/` and its ZIP;
- `v4/`, `v5/lab/`;
- the rules and economy in `v5/next/game.mjs`;
- the save keys and formats.

**Historical CrazyGames Basic Launch metrics (owner-provided).** These are benchmarks, not predictions:
- average playtime 3m36s;
- 1+ minute conversion 21.91%;
- 10+ minute funnel 4.12%;
- D1 retention 0%;
- Basic Launch score 3/15.

## 1. What changed, by stage

| Stage | Commit | What a player sees |
|---|---|---|
| A: first-session flow + Adaptive tutorial | `83f0c84` | A genuinely new player opens on the playable board: no Home press and no three story pages, but one story caption line. A guide line says what, why and where for one step at a time: gold for the next action, green for the matching pair, a hand only while a skill is new. It fades as skills are learnt, offers a 44 px Hint, and gives one reminder after about 8 s idle. It never acts for the player. The menu's "Story: the letter" replays the opening scenes. |
| B: board clarity + merge feedback | `3f9af8e` | Crates look like what the rules allow (muted "later", "reachable" with its key, a green key ring when the key is in hand). Tideglass shows three crack pips. Merges come in three tiers: micro, medium (with the part's name) and major (light, name, purple for rare). Nothing blocks a tap. |
| C: orders, rewards, restoration | `9cf0109`, `5e5a4f9`, `bad0b54` | While guided, one primary order card is shown; the others stay in their lanes, dimmed and tappable. The gold order's materials fly to the coast strip, and "Ready to build" glows. After Build, the construction plays, then a card under the picture (which stays in view) gives the stage's lines, the coins spent, the real rewards and the next objective. No story dialog covers the restored place. |
| D: QA, lifecycle, release readiness | stage D commit, this doc, CI | The double `gameplayStart` is fixed and has a lifecycle test. The Daily gift dialog no longer opens over the next objective while the guide is teaching (`offerGift` waits for `tutorActive` to end, not only the first lesson; the gift button stays). Before, it opened right after the first build, on top of the next objective; `822a8f9` does the same. The full regression runs in Chromium and WebKit; this report. |

**Not changed:**
- `v5/next/game.mjs` (rules, economy, the 27 crates and 17 tideglass, orders, rewards, generator progression);
- save keys, formats and migrations;
- `v4/`, `v5/lab/`;
- `release/crazygames-basic/`.

## 2. Save safety: never mistake an existing player for a new one

- **"New" is decided once,** in `v5/next/newcomer.mjs` (pure and unit-tested), after `openSaveStore()` has settled. On CrazyGames that means the SDK has initialised and the cloud data has been read; elsewhere, this browser's storage.
- **Never new:**
  - any value under `vaultwake-v5-coast`, even an unreadable one;
  - any kept camp;
  - `?new=1`;
  - a CrazyGames page whose cloud data could not be read (the SDK timed out, failed or refused). That player may have a cloud save, so Home stays exactly as before.
- **Nothing is written until the new player's first action,** so an untouched default camp never reaches the save or the cloud.
- **Existing players:**
  - Home with Continue, as before.
  - The camp loads through the same `readSave`/`load()`.
  - Tutorial flags keep their meaning: `coach-on`, `coach-done` (Skip guide), and the new `coach-next` (a guided finish, in the existing `seen` field). A finished or skipped guide never restarts.
  - A camp from before the guide never gets it.

| Scenario (browser, Chromium and WebKit in CI) | Result |
|---|---|
| New player, no save | Board at once; no save until the first tap; reload gives Continue, the same camp and the same tutorial step |
| Existing camp from before the guide | Continue; board, orders, coins, energy, level, materials, shed and area kept byte for byte (as `load()` reads them); no tutorial |
| Camp with the guide skipped | The same; no tutorial |
| Chapter-1 fixture (rare extras open on arrival, as on `822a8f9`) | Continue; progress kept; no tutorial |
| Camp half way through the guide | Continue; the same step (not the first lesson again) |
| CrazyGames guest whose cloud holds a camp | Continue; the cloud camp keeps its progress (the energy-receipt migration rewrites a v4 camp at boot, exactly as `822a8f9` does) |
| CrazyGames guest with an empty cloud | Board at once; nothing written until the first tap, then the camp is in the cloud |
| CrazyGames host whose SDK fails to initialise | Home stays with Play: not treated as new |
| Logged-in / second device / refusing Data module / slow init | `tests/v5-next-crazygames-save-browser.cjs` (existing suite, updated for the new-player entry): all pass |

## 3. Gameplay lifecycle (CrazyGames)

- **Root cause of the double `gameplayStart`:** `platform.setPlaying()` compared the wanted state with the sent one *before* awaiting the SDK. Two calls in the same moment (arriving on the board, and the 1 s sync) both passed the check, and both sent `gameplayStart`.
- **Fix:** calls now queue, and each sends only when the wanted state still differs from the last state sent.
- **Unit test:** `tests/v5-next-lifecycle.test.mjs`, 5 tests. It fails 2 of 5 on the old code and passes 5 of 5 with the fix.
- **Browser test:** `tests/v5-next-home-browser.cjs` checks the exact SDK call order:
  - for a new player, `init`, `loadingStart`, `loadingStop`, then `gameplayStart` once on the board;
  - for a returning player, no gameplay call while Home is up.
- **No double rewards or double builds:** a second Build tap neither builds twice nor spends twice (`tests/v5-next-build-flow-browser.cjs`). Deliveries and builds go through the unchanged reducer.

## 4. Tests

| Suite | Covers |
|---|---|
| `node --test tests/v5-*.test.mjs` | 487 tests: the whole V5 unit and simulation suite, plus `v5-next-tutor`, `v5-next-newcomer` and `v5-next-lifecycle` |
| `tests/v5-next-first-session-2-browser.cjs` | New player to the first restoration with real input: every highlight matches an action `act()` accepts; fading; one idle reminder; Hint; one primary order; materials flight; no dialog over the restored place; real rewards; resume. Run at **360×640, 390×664, 390×844, 430×932 and 1280×720**, plus every save scenario above and reduced motion |
| `tests/v5-next-board-feedback-browser.cjs` | Crate looks equal the rules; pips; micro, medium, major and rare merges; quick merges both land; a merge redraws only the cells it changed; reduced motion |
| Build 57y P0 set | Build flow, core actions (Details sheet, shed, Home → Continue, Data Module save), SDK not ready, tap flicker, sticky coast ×, strip tap |
| Coast Camp suites | Home, story, guide, saves, CrazyGames, rewards, extras, energy, rare merges, chapters 1–6 |

CI: `.github/workflows/v5-first-session-2.yml` runs all of these in the Playwright 1.62.1 image, in Chromium and WebKit.

## 5. Known risks and open items

- **Live build identity unverified** (§0). The before/after comparison is against `822a8f9`.
- **Story tests updated, not just passed.** The Home, story, guide, strip-tap, CrazyGames and core suites changed where they encoded the old "new camp → Home → Play → three pages" path. The three-page story still plays on Play where Home is still shown for a camp without a save (a kept camp, `?new=1`, unreadable cloud data); `v5-next-story-browser` covers it.
- **The guide line is 11 px taller** than the old hint line while the guide is speaking. On a 360×640 screen the board's bottom edge then sits 9 px below the first screen, as the page already scrolled there.
- **Tideglass level not written on the ice.** The prototype's "Lv3+" chip was left out because of the owner's earlier direction (Build 45o: say the level only when a merge was too small). The existing message still says it then.
- **"New: …" discovery toast kept.** The toast for a first find from Lv3 appears together with the new medium-tier name tag. It is non-blocking and once per item.
- **The story caption covers the board's bottom rows** at 390×664 until the first action or its ×. The generator and the first targets stay above it, and it folds on the first action.
- **The guide line can lag one beat** during the gold order's delivery animation (about 0.3 s it still says "Tap the gold order" after the tap). It is cosmetic and does not affect taps.
- **Real-device check needed before any release:** iPhone Safari (touch, safe areas, sound), Android Chrome, and CrazyGames guest and logged-in play. Retention effects are unknown until measured.

## 6. Evidence

`docs/evidence/v5-first-session-2-production/`: Chromium, 390×664, device scale 2, real touch input at human pace.

| File | Shows |
|---|---|
| `compare-before-after-390x664.jpg` | Before (`822a8f9`): Home → Play → story page → board. After: the board is the first screen |
| `before-*.jpg`, `after-*.jpg` | The same screens one by one |
| `first-session-tutorial-demo.mp4` (65 s) | A new player from the first screen to the first restoration and the next objective: guide steps, fading, the 8 s idle reminder, Hint |
| `first-tutorial-*.jpg` | The first step, the idle reminder, Hint |
| `order-build-demo.mp4` (21 s) | Gold order ready → delivery → materials to the strip → "Ready to build" → coast → Build → construction → stage card → back to the board |
| `first-gold-order-ready.jpg` … `first-next-objective.jpg` | The same, frame by frame |
| `merge-feedback-demo.mp4` (17 s), `merge-*.jpg` | Micro, medium, major and rare merge feedback |
