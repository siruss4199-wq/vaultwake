# Vaultwake Merge on Playgama: release preparation (2026-11-24)

**Status: DRAFT on Playgama.** The tested build and the listing are in the Playgama Developer Console as a draft. Nothing
has been published to the sandbox, submitted to moderation, or agreed commercially.

| | |
|---|---|
| Release branch | `release/playgama` (repository `siruss4199-wq/vaultwake`) |
| Base | `ac1d8bc`, the newest fully tested build. It contains the live CrazyGames build `822a8f9`, the 2026-11-16 release candidate `ecde162`, the mobile Shed hotfix `b04d6c3` and Board Full Rescue `bd68669`. The old Wispwood `main` was not used |
| Game code commit | `b95d967`. Later commits add only covers, screenshots, docs and the CI workflow |
| ZIP | `release/playgama/vaultwake-merge-playgama-b95d967.zip` |
| SHA-256 | `84a07419fe2424605dc590445e800e0193dc3c32290b370ec3b6e563c284b86f` (local build = CI builds a and b = the uploaded archive) |
| Size | 14,962,669 bytes, 329 files (15.1 MB unpacked); `index.html` at the root; Latin file names only |
| Bridge SDK | `@playgama/bridge` 2.4.4 (npm, 2026-11-19, the current release), unmodified (`vendor/playgama-bridge/2.4.4`, LGPL v3 licence shipped beside it) |
| Playgama draft | game `cmwus3b7d09r6li0hl4k3c1th`; archive `cmwuwhibd0nuzii0hhsuks85w`: **build check PASSED, Bridge 2.4.4 found** |
| QA tool | https://developer.playgama.com/qa-tool/cmwuwhibd0nuzii0hhsuks85w |
| CrazyGames | untouched. Its branches, ZIPs and the live game 166859 are unchanged. The standalone and CrazyGames pages keep their behaviour (their browser suites pass on this branch) |

## 1. Bridge SDK integration

| Required step (Bridge docs, API → Required steps) | How |
|---|---|
| 1. `playgama-bridge-config.json` beside `index.html` | It declares the interstitial placement `stage_built` and the rewarded placements `energy`, `crate` and `new_order`. No custom delays: the platform defaults apply |
| 2. Bridge first, initialised before the game | `playgama-bridge.js` is the first script in `<head>`, loaded normally. `next/playgama-boot.js` waits for `bridge.initialize()` before it adds the game's styles, the loading screen and the game module. Test A checks every game file is requested after initialisation |
| 3. `platform.language` | Read after initialisation. The game is English only, the default and the fallback |
| 4. Storage only through the Bridge | Every key (progress, the energy receipts, the story flag, kept camps, sound and vibration settings) is read in one `storage.get([...])` at start and restored before the game shows. Writes are batched: all changed keys in one `storage.set`, at most every 2 s, and at once when the page is hidden or closed or the platform pauses. Over the guided first loop: 10 `storage.set` calls for 30 moves. The game writes nothing to `localStorage` itself; the playtest log stays in memory |
| 5. Pause and audio | `isAudioEnabled` is read at start (the game stays silent when it is `false`). `AUDIO_STATE_CHANGED` and `PAUSE_STATE_CHANGED` mute and pause the game, so sound stays off and the daily gift does not open by itself; a pause also flushes progress |
| 6. `game_ready` | Sent once, when the player can act: Home with Play/Continue, or the board itself for a new player who goes straight in |
| 7. Interstitials at natural pauses | See §2 |
| 8. Hide what is not supported | With `isRewardedSupported` false there is no rewarded button, no shop offer and no help line about ads. There are no payments, leaderboards, sign-in or outside links (the Classic link, playtest log and sound-check page are hidden) |

**SDK failures:**
- The Bridge script is missing, or `initialize()` fails or does not answer within 10 s: the game still starts and keeps progress in this browser.
- The Bridge is up but its storage cannot be read: the session is playable, nothing is written over what the platform may hold, and the menu says progress is not being saved.

**Saves:** the save format and keys are the same as every other build (`vaultwake-v5-coast`, …). Load and migration are unchanged, so a camp moves between builds as it is. A Playgama player starts fresh: Playgama is a new platform and holds no earlier saves.

**Platform-only changes** (only when `data-platform="playgama"`):
- **No page scrolling (Game Requirements 1.6.2, 1.6.3, 1.6.6).** The column scales to fit the window: 0.85 at 360×640 and 1280×720, 0.75 at 600×600, 1.0 on 390×844 and taller. The whole board, the Shop/Book row and the Sound toggle stay in view at every tested size, including square ones. A panel opened during play scrolls inside the game.
- **No Esc use (1.5.2).**
- **No long-press menu (1.4.5).**
- **No CrazyGames code in the ZIP.** The CrazyGames adapter is left out, and `v4/platform.mjs` is replaced by an inert module.

**Files:**
- `v5/next/playgama-boot.js`
- `v5/next/platform-pg.mjs`
- `v5/next/platform.mjs`, the seam: Playgama page → Playgama adapter, any other page → CrazyGames adapter as before
- `v5/next/bridge-store.mjs`
- small hooks in `app.mjs`, `feedback.mjs`, `haptics.mjs`, `boot.js`, `story-intro.mjs` and `coastal.css`
- `tools/coast-playgama.mjs` (the build)
- `.github/workflows/v5-playgama.yml`

## 2. Monetization

The economy is unchanged. The rewarded offers are the ones the game already had for a full ad launch (`game.mjs` `SHOP`, swap limits), with their daily limits, an idempotent reducer and Web Locks against a second tab:

| Offer | Reward | Limit | Where |
|---|---|---|---|
| Energy | +25 energy | 2 a day; not offered while stored energy is full | the dock button "▶ Ad +25 ϟ" when energy is under 5; the shop |
| Driftwood crate | 1 crate | 2 a day | the shop |
| New order | changes a stuck crew order | after the 3 free changes, 5 a day | the order's Details |

- The reward is given only after the Bridge reports `rewarded`. An ad that is closed early or fails gives nothing and the game goes on (tests C–E).
- The energy button said "+15" for a +25 reward; it now says "Ad +25 ϟ" (rule 2.2.1).

**Interstitial:** asked for at one natural pause only, back on the board after building a stage on the coast. It is never asked for during the first tutorial, for the first stage built, or mid-drag. The Bridge decides whether one actually shows (its first delay and 60 s minimum interval); the game keeps no timer of its own. This first comes up after the second stage, several minutes into play.

No banners, no in-app purchases.

## 3. QA results (actually run)

| Run | Result |
|---|---|
| `node --test tests/v5-*.test.mjs` (local, Node 22.23) | **505/505 pass** |
| `tests/v5-playgama-browser.cjs` on the extracted ZIP, Chromium 158 (local) | **12/12 pass** |
| The same on the ZIP in CI run 45435802641: Chromium, WebKit, Firefox (Playwright 1.62.1 image) | **pass in all three** |
| ZIP reproducible: CI builds a and b | byte-identical, SHA-256 as above |
| Existing Coast Camp suites on the source, Chromium (local) | **pass**. Suites: CrazyGames page, SDK not ready, CrazyGames saves, build flow, core actions, Shed overlay, Board Full Rescue, tutorial endpoint, Home, saves, story, First Session 2.0, energy, full-board rewards, guide, initial view. Home failed once after 2 s and passed on three later runs |
| The same in CI: Chromium | pass |
| The same in CI: WebKit | **1 failure** in build flow: "Target page, context or browser has been closed". This is the WebKit page loss already recorded at the base (`docs/V5_CRAZYGAMES_UPDATE_ac1d8bc_2026-11-17.md` §3; it also fails on `ae83302`). It is not on a Playgama code path. CI run 45551971537 re-runs it |
| Playgama automatic build check | **PASSED**; Bridge SDK FOUND, version 2.4.4, engine javascript |

**What the Playgama suite checks** (stand-in Bridge unless noted):
- **A** (new player, Bridge first, saves, reload):
  - no game file is requested before the Bridge has initialised;
  - one `storage.get` with every key;
  - `game_ready` exactly once;
  - the guided first loop to the first Build with finger taps and drags;
  - batched saves, and nothing in `localStorage`;
  - reload → Continue with the same camp, and no interstitial in the first session.
- **B** (interstitial and controls): Build → back to the board → exactly one interstitial (`stage_built`). The game is muted and paused while it is open, and not after. Esc does not close the order sheet; a long press is blocked.
- **C, D, E** (rewarded): finished gives +25 (1 → 26). Closed early gives nothing ("The ad was interrupted: no reward."). Failed gives nothing ("Ad unavailable: no reward. Try again later.").
- **F** (rewarded unsupported): nothing ad-related shown.
- **G** (platform audio and pause): audio off at start → silent; on → sound; pause → muted, paused, progress flushed. The player's Sound setting is saved through the Bridge.
- **H, I** (Bridge broken): `initialize()` fails, or the script is missing (404). The game starts, plays and saves in this browser.
- **J** (storage unreadable): playable, no `storage.set` at all, and the menu says the session is not being saved.
- **K** (real Bridge): the real Bridge 2.4.4 initialises in about 20 ms on its mock platform. Play continues, a reload keeps the moves, and no request leaves the archive.
- **L** (layout): 360×640, 390×844, 430×932, 844×390, 1280×720, 907×510, 800×800 and 600×600. The page never scrolls, and the board, the Shop/Book row and the Sound button are fully on screen.

**Covered elsewhere or by the platform:**
- loading: no failed requests and no page errors in every case;
- the whole game is 14.3 MB, and 1.3 MB loads before play (the CrazyGames measurement, same files);
- network failure while loading: the existing loading screen's Retry (Home suite).

**Not tested yet (needs a person):**
- real iPhone Safari and Android Chrome;
- real Playgama ads (only the stand-in);
- the QA tool's certification;
- Opera and Edge (Chromium-based, not run separately).

## 4. Publishing assets

| | |
|---|---|
| Title | Vaultwake Merge (matches the in-game logo and `<title>`, rule 3.5.1) |
| Developer | Sirus Games: set by the organisation name in the console (the form has no field for it) |
| Category | Merge |
| Devices and orientation | desktop, Android, iOS; portrait and landscape |
| Language | English |
| Descriptions | short and how-to-play saved; long description, tags and a draft developer note in `release/playgama/METADATA.md` |
| Covers (uploaded) | square 800×800, portrait 1080×1920, landscape 1920×1080 (`release/playgama/covers/`). Square and landscape are the CrazyGames covers; the portrait is new, from the same game art (`tools/playgama-covers.py`) |
| Screenshots (uploaded) | 6: Home, board and coast, each in portrait 1080×1920 and landscape 1920×1080 (`release/playgama/screenshots/`, `tools/playgama-screenshots.cjs`) |

## 5. Rules checked against the Playgama Game Requirements

**Passing:**
- **1.1** Bridge, the current version, all required steps.
- **1.2:**
  - no sign-in;
  - no external analytics;
  - nothing loaded from outside the archive (test K: no outside request);
  - no outside links shown;
  - no URL lock.
- **1.3** Size 15 MB of 300; `index.html` at the root; Latin file names.
- **1.4.4** Touch controls.
- **1.4.5** Long press.
- **1.5.1, 1.5.3** Mouse controls.
- **1.5.2** Esc. Caveat: the browser's own Esc still closes an open dialog (native `<dialog>` behaviour).
- **1.6.1–1.6.3, 1.6.6, 1.6.8** Layout.
- **1.6.5** Every pop-up has a close button.
- **2.1.1–2.1.3, 2.1.6, 2.1.7** Interstitials.
- **2.2.1–2.2.5** Rewarded ads.
- **2.3–2.5** No banners, payments or real money.
- **3.1** Progress, story, tutorial.
- **3.2** Saving.
- **3.3.3** Mute: the Sound toggle in the footer.
- **3.3.4, 3.3.5** Platform audio and pause.
- **3.4** Language.
- **3.5.1** Title.
- **4.1** No restricted content found.
- **4.2.2–4.2.5** Not a copy of another game; no outside brands.

**Not met, or the owner's to judge:**

| Rule | Status | What is needed |
|---|---|---|
| **3.3.1** Background music and sound effects | **FAIL**: the game has no music | Licensed or commissioned background music, as ogg/mp3 files |
| **3.3.2** Recorded or produced audio, no sounds synthesised in code | **FAIL**: every sound effect is synthesised in code with Web Audio (`v5/next/sfx.mjs`) | Recorded or produced sound effects as compressed files whose rights the owner holds (e.g. purchased, commissioned, or CC0 with a clear licence). Wiring files into `sfx.mjs` is a small code change once the files exist |
| **4.3.1** Generative-AI art | **RISK** | The art was made with ChatGPT and approved by the owner on 2026-11-08 (`release/crazygames-basic/RIGHTS_REPORT.md`). Playgama rejects titles "100% AI-generated without substantial human refinement of the visuals". The game logic, story and design were iterated by hand over many builds, but moderation judges the visuals |
| **4.2.1** Rights | owner | Same open items as CrazyGames: the OpenAI policy check (D) and the trademark searches and name decision (F) |
| **1.7.3** Browsers | partly | Chromium, WebKit and Firefox are tested in CI; real Safari on iOS and Chrome on Android, plus Opera and Edge, are not |

## 6. GO / NO-GO

- **GO** for testing the draft in Playgama's QA tool and on real devices: the build check passed, the Bridge was found, and all automated Playgama tests pass in three engines.
- **NO-GO** for submitting to moderation or publishing until:
  1. **the sound problem is solved (3.3.1 and 3.3.2)**: real music and sound-effect files whose rights the owner holds;
  2. a person plays the build in the QA tool and completes its certification (the console's form step is blocked "NO_CERTIFICATION" until then);
  3. it has been tested on a real iPhone and a real Android phone;
  4. the owner decides on the AI-art risk (4.3.1), legal items D and F, whether to let Playgama distribute the game on partner platforms, the developer name in the console, and the developer note.

Publishing to the sandbox (a public page without moderation), traffic and catalog updates were **not** done: each needs the owner's explicit yes.
