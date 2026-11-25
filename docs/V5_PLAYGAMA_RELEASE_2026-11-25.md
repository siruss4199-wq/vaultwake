# Vaultwake Merge on Playgama: moderation-blocker round and readiness (2026-11-25)

This round follows `docs/V5_PLAYGAMA_RELEASE_2026-11-24.md`. **Status: DRAFT on Playgama.** Nothing has been published to
the sandbox, submitted to moderation, agreed to or changed in distribution settings.

| | |
|---|---|
| Branch | `release/playgama`. Game code `5087987`; later commits are CI and docs |
| ZIP | `release/playgama/vaultwake-merge-playgama-5087987.zip`, 17,707,228 bytes, 352 files |
| SHA-256 | `f4c00bc3d7df8ca44283e1a1bbf1879c4146debfe5d623881b2c9bebe6211c6e` (local build = CI builds a and b, run 45555518243) |
| Playgama draft | game `cmwus3b7d09r6li0hl4k3c1th` (the same draft; no new listing) |
| Archive | `cmwvpzgaq1qoeii0hsdc139pj`: **automatic build check PASSED**, Bridge SDK 2.4.4 found, engine javascript. It supersedes `cmwuwhibd0nuzii0hhsuks85w` |
| QA tool | https://developer.playgama.com/qa-tool/cmwvpzgaq1qoeii0hsdc139pj |

## 1. What changed

| Blocker | Fix | Evidence |
|---|---|---|
| **3.3.1 / 3.3.2.** No music; sound effects synthesised in code | **CC0 audio files.** 16 effects from five Kenney packs (132 KB) and 2 music pieces from OpenGameArt, "Sea side Village" by KarateStudios and "Meadow Thoughts" by Écrivain (2.7 MB, played in turn). `v5/next/sfx.mjs` no longer generates any sound. Nothing is fetched or played before the first tap. Music stops for ads, platform mute or pause, a hidden page and the Sound setting. Merge still steps up in pitch with tier; building plays a construction knock and flourish; rewards have their own sound | `v5/assets/audio/LICENSES.md` (every file, its page, author, licence text, original, processing and SHA-256; the Kenney `License.txt` copies); Playgama test M |
| **4.3.2.** Emoji used as icons: dock Shop 🛒, Book 📖, Gift 🎁, ad ▶, Hint 💡, lock 🔒, build marker 🔨 | Line icons drawn for the game (inline SVG in the style of Home's icons). Help and tutorial text name the buttons instead. A scan of the rendered board, shop, book, menu, help and coast finds no visible emoji | screenshots in `release/playgama/screenshots/` (re-taken) |
| Browser `confirm()` / `alert()` (a platform frame may block them, and then nothing happened) | One in-game dialog with ×, Cancel and Yes for new game, new camp, storage-full notices and the playtest log | Playgama test N (no browser dialog fires; Cancel keeps the camp; Yes starts a new one and keeps the old one aside in Bridge storage); the Home, saves and story suites |
| Misleading save wording ("kept in this browser") | Platform-neutral text in Home's unreadable-save note, Kept camps and the storage-full notices. The Playgama menu says "Progress: saved automatically · last save …" | |
| Small-screen touch targets | Compact spacing before scaling on short windows, Playgama only. Scale at 360×640 went from 0.85 to 0.88 (tiles 39 px on a 42 px pitch); at 390×664 (iPhone Safari with bars) from 0.85 to 0.87 (tiles 43 px on a 46 px pitch). Windows of 390×844 and taller are unscaled (49 px tiles) | Playgama test L; `targets.cjs` measurements |

## 2. Generative-AI art (rule 4.3.1)

The rules were read live through the console MCP. The audit is `docs/V5_PLAYGAMA_AI_ART_AUDIT_2026-11-25.md`:
- All 264 images are AI-generated or AI-rendered.
- They were refined by AI agents working under the owner's direction.
- The records show no human hand-retouching.
- The human contribution is direction, choice, rejection, device testing and approval.

The rule is ambiguous on whether that counts as "substantial human refinement of the visuals". A draft question to Playgama
support is in `release/playgama/SUPPORT_INQUIRY_AI_ART.md`. No art was replaced, and the AI use is stated plainly.

## 3. Tests actually run

| Run | Result |
|---|---|
| `node --test tests/v5-*.test.mjs` (local, Node 22) | **505/505** |
| `tests/v5-playgama-browser.cjs` on the extracted ZIP, Chromium (local) | **14/14**: cases A–N (M audio and N confirmation are new) |
| Existing Coast Camp suites, Chromium (local, source tree) | **all 17 pass**: CrazyGames page, SDK not ready, CrazyGames saves, build flow, core actions, Shed overlay, Board Full Rescue, tutorial endpoint, Home, saves, story, First Session 2.0, energy, full-board rewards, guide, initial view, bright |
| CI: Playgama ZIP in Chromium, WebKit and Firefox | **pass** in runs 45552321250, 45555518243 and 45556973396. The two builds were byte-identical every time |
| CI: Existing suites, Chromium | **pass** |
| CI: Existing suites, WebKit (one long job) | **fails intermittently**: "Target page, context or browser has been closed", each time in a different suite (build flow; later tutorial endpoint, after build flow, core actions, Shed and Board Full Rescue passed) |
| CI: WebKit isolation, build flow alone in a fresh container | round 1: base 3/3, head 0/3; round 2: head 2/2, head without music 2/2; round 3: **base 5/5, head 5/5**. Totals: head 7/10, base 8/8, and all three head failures in one run |
| Playgama automatic build check | **PASSED** |

**The WebKit page loss, assessed.**
- **Findings:**
  - It is a WebKit page-process exit in long CI jobs, in a different suite each time. The same loss is recorded on the base in the CrazyGames update (17 November, §3).
  - The Playgama ZIP's own WebKit tests have never failed: guided first Build, ads, audio, layouts.
  - Removing the music made no difference.
  - With equal samples, base and head both passed 5 of 5.
- **Caveat:** the three failures in one isolation round are not fully explained. With head at 7 of 10 against base at 8 of 8, a slightly higher rate on this branch is not ruled out.
- **Recommended:** a check on real Safari (the QA tool on an iPhone) before submission.

## 4. Moderation readiness

| Rule | Status |
|---|---|
| 1.1 Bridge and required steps | met (build check passed) |
| 1.2 External services, links, analytics | met |
| 1.3 Archive | met: 17.7 MB, `index.html` at the root, Latin names |
| 1.4 Mobile: touch, long press | met. Real devices not tested |
| 1.5 Desktop, no Esc use | met |
| 1.6 Display: no page scroll, square windows, nothing cut | met at the 8 sizes tested |
| 1.7 Stability | Chromium, Firefox and WebKit pass the Playgama suite. Intermittent WebKit page loss in long CI jobs (above) |
| 2.1–2.2 Interstitial and rewarded ads | met (stand-in Bridge tests). Real Playgama ads not seen |
| 3.2 Saving via Bridge only | met |
| 3.3.1–3.3.5 Sound | **met now**: CC0 music and recorded effects, mute button, platform audio and pause, hidden page |
| 3.4 Language, 3.5 title | met |
| 4.2 Rights | audio CC0, documented. Art per the owner's declaration. Legal items D and F remain open |
| **4.3.1 Generative AI** | **open**: ambiguous, high risk read literally. Support inquiry drafted |
| 4.3.2 No emoji icons, interface designed for the game | **met now** |

**GO / NO-GO**
- **GO** for QA-tool testing and certification by a person, on desktop and real phones.
- **NO-GO** for moderation submission until:
  1. Playgama answers the 4.3.1 question, or the owner accepts the rejection risk;
  2. the QA tool's certification is done and a real iPhone and Android phone are tested;
  3. the owner settles legal D and F, the developer name in the console, "distribute everywhere" and the developer note;
  4. the four outdated screenshots are deleted in the console: the board and coast shots with emoji icons from 2026-11-24. New ones are uploaded; there is no tool to delete media.
