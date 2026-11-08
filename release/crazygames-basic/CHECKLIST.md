# Vaultwake Merge: CrazyGames Basic Launch technical checklist

- Package: `vaultwake-merge-crazygames-basic-e72b4bb.zip`
- Source commit: `e72b4bb8bdea4a94ea3246fd64c48c801e3736ee`. Branch `claude/v5-crazygames-release-package`, made from `codex/v5-mobile-first-session-final-qa` at `fd76b03`.
- SHA-256: see `SHA256SUMS`.
- Rebuild: `node tools/coast-crazygames.mjs --zip` gives the same bytes (fixed timestamps, sorted entries). CI job "Vaultwake Merge CrazyGames Basic release folder" checks this on every push.

Requirements are from the official pages, fetched 2026-11-08:
- https://docs.crazygames.com/requirements/technical/
- https://docs.crazygames.com/requirements/game-covers/
- the video requirements

Legend:
- ✅ verified, with evidence given
- ⏳ runs in CI on this branch; see the PR checks
- ⚠️ not verified here; needs an owner or a person on the device
- ❌ fails

## Package

| Check | Result | Evidence |
|---|---|---|
| Source commit recorded | ✅ | `e72b4bb`; game files in the ZIP are clean at that commit (`git status --short v5 v4 tools` empty when built) |
| ZIP opens the game from its root | ✅ | `index.html` → `v5/coast-crazygames.html` (title "Vaultwake Merge"); played from the unzipped folder |
| Reproducible bytes | ✅ | repeated builds give the same SHA-256 `f5d88067…33fb3b`; CI rebuilds and compares byte for byte |
| Total size ≤ 250 MB, files ≤ 1,500 | ✅ | 14,847,367 bytes zipped, 15,399,951 unpacked, 333 files |
| Initial download ≤ 20 MB (mobile), ≤ 50 MB (desktop), measured to `gameplayStart` | ✅ | 3.27 MB in 91 requests at 390×844 and at 907×510 (`tests/v5-next-crazygames-payload-browser.cjs` on the unzipped package, Chromium; `evidence/basic-initial-download-chromium.jsonl`) |
| No developer-only files | ✅ | sound-check page, art render pages and script, art manifests and 20 unregistered sprites are excluded (`tools/coast-crazygames.mjs`); `unzip -l` shows none |
| Relative paths only | ✅ | no root-relative `src`/`href`/`url()` in the shipped HTML, JS or CSS (grep) |
| No external dependencies but the SDK | ✅ | the only URL in the shipped code is `https://sdk.crazygames.com/crazygames-sdk-v3.js`; no fonts or audio files, no CDN |
| No unused images | ✅ | the 47 images the game never loads are left out (`tools/coast-crazygames-unused.txt`; the build stops if one is named in the Coast code, and `tests/v5-next-crazygames-unused.test.mjs` fails if the game can draw one). With them deleted, the Coast browser suite in Chromium and a crawl of every area requested no missing file (`evidence/unused-images-removed.md`) |

## Basic Launch and SDK

| Check | Result | Evidence |
|---|---|---|
| Basic configuration | ✅ | `<html lang="en" data-ads="off" data-platform="crazygames" data-launch="basic">` in `v5/coast-crazygames.html`; `node tools/coast-crazygames.mjs --check` passes |
| No ads or rewarded-ad offers in Basic | ✅ | ad UI is gated by `ADS` (`v5/next/app.mjs:123`) and hidden by CSS for `data-ads="off"` (`v5/next/coastal.css:191`); the CrazyGames browser test finds no ad offer anywhere |
| No purchases | ✅ | the shop sells for in-game coins only |
| SDK lifecycle: init, loading start/stop, `gameplayStart` once the board is playable, gameplay stop, happy time | ✅ Chromium · ⏳ WebKit, Firefox | `tests/v5-next-crazygames-browser.cjs` on the unzipped package: "SDK lifecycle, no ads, nothing leads out, fits, no errors" at 907×510, 390×844 and 360×780 |
| Nothing leads out of the game | ✅ | Classic link, playtest log, sound-check link and feedback are hidden for `data-platform="crazygames"` (`v5/next/coastal.css:194`); same test |
| No page errors or missing files on load and play | ✅ | same test; the gameplay recordings logged no page errors |
| Full Launch archive (ads on), for later only | ⏳ | built and tested by `v5-release-package.yml`; **not** part of this submission |

## Layout, input, browsers

| Check | Result | Evidence |
|---|---|---|
| Mobile 360 / 390 / 430 px | ✅ Chromium · ⏳ WebKit | `tests/v5-next-browser.cjs`: intro → orders → 2 restorations → reload → map → worksite → daily gift → shed → book → shop → order change, at each width |
| Desktop embed 907×510 and landscape | ✅ | CrazyGames browser test at 907×510; the landscape gameplay video is recorded at 960×540 CSS px |
| Mouse, touch, keyboard | ✅ | mouse and touch drag-merge in `tests/v5-next-browser.cjs`; keyboard reaches and presses Play (`tests/v5-next-home-browser.cjs:99-101`) |
| `user-select: none` | ✅ | set in the Coast CSS |
| Chrome / Edge | ✅ | Chromium (Playwright 1.62.1) locally |
| Safari / WebKit, Firefox | ⏳ | `v5-release-package.yml` plays the unzipped ZIP in chromium, webkit and firefox; `v5-release-chapters.yml` runs the Coast suite in WebKit |
| iOS audio resume | ⚠️ | audio unlocks on the first `pointerdown` or `keydown` and resumes on `visibilitychange` (`v5/next/sfx.mjs:45-53`). CrazyGames recommends `touchend` or `click`. **Not checked on a real iPhone.** Gameplay does not depend on sound. |
| Real iPhone / Android device | ⚠️ | **no human device test was done** for this package |
| Chromebook 4 GB | ⚠️ | not tested; the 3.3 MB initial download and a DOM board suggest low load, but this is unmeasured |

## Saves, economy, progression

| Check | Result | Evidence |
|---|---|---|
| Save keys unchanged | ✅ | `vaultwake-v5-coast` (`v5/next/game.mjs:20`), `vaultwake-v5`, `vaultwake-v5-replay`, `vaultwake-v5-active-slot`: no change to `game.mjs`, `saves.mjs`, `core.mjs`, `replay.mjs` or `v4/` in this branch (`git diff fd76b03 76526ad --stat`) |
| Save migration and kept camps | ✅ Chromium | `tests/v5-next-saves-browser.cjs`: newer/damaged save kept, restore round trip, new camp keeps progress, backup collision keeps every copy |
| Economy, rewards, energy capacity by level | ✅ | no gameplay code changed (diff above: one confirm text in `app.mjs`, three strings in `play.html`); `node --test tests/v5-*.test.mjs`: 443 pass, 0 fail |
| Home, loading, damaged-save handling | ✅ Chromium | `tests/v5-next-home-browser.cjs` passed |

## Store media

| Check | Result | Evidence |
|---|---|---|
| Covers 1920×1080, 800×1200, 800×800, same identity, title only, no badges or logos | ✅ technically · ✅ owner-approved | `covers/`; made only from shipped game art, which the owner approved for commercial use 2026-11-08 (`RIGHTS_REPORT.md` §4, `evidence/owner-declaration-2026-11-08.md`) |
| Videos: landscape 1920×1080 and portrait 1080×1620, 15–20 s, ≤ 50 MB, silent, opens on the cover, real gameplay, no cursor, no black bars, not sped up | ✅ technically · ✅ owner-approved | `videos/`: 16.9 s, 5.9 MB and 6.7 MB, H.264, no audio stream; recorded from the ZIP with a DevTools screencast in real time; shows only shipped game art, owner-approved for commercial use 2026-11-08 |

## Commands run (Node 22.22.0, Playwright 1.62.1 Chromium, 2026-11-08)

```
node --test tests/v5-*.test.mjs                                   # 443 pass, 0 fail
node tools/coast-crazygames.mjs --check                           # up to date
node tools/coast-crazygames.mjs --zip                             # 14.2 MB, 333 files
python3 -m http.server 8081 --directory <unzipped package>
CG_URL=http://127.0.0.1:8081/index.html ENGINES=chromium node tests/v5-next-crazygames-browser.cjs
CG_URL=http://127.0.0.1:8081/index.html node tests/v5-next-crazygames-payload-browser.cjs   # chromium rows
python3 -m http.server 8080   # repo root
node tests/v5-next-browser.cjs                                    # chromium 360/390/430 passed
ENGINES=chromium node tests/v5-next-home-browser.cjs              # passed
ENGINES=chromium node tests/v5-next-saves-browser.cjs             # passed
```
WebKit and Firefox are not installed in the build container; they run in CI.
