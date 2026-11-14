# Vaultwake Merge: the first 60 seconds and the first 10 minutes (2026-11-14)

**Status: DRAFT, for owner review.**
- **Branch:** `claude/v5-first-10-minutes`, from `6bbee67` (PR #104's head; CI on `6bbee67`: unit tests and Chromium green, WebKit still running when this branch started).
- **Draft PR:** into `claude/v5-first-session-2-production`.
- **Not done:** no merge, no release package, no CrazyGames upload, no save reset or migration.

**Historical CrazyGames numbers** (11–13 Nov, before PR #104; owner-provided):
- 626 visits → 272 playing → 131 at 1+ min → 25 at 10+ min;
- average 3m55s;
- D1 0%.

They describe the live build, not this one. **Nothing here claims a retention or conversion change.** Only CrazyGames data can show that.

## 0. Summary

| Change | Why (measured) | Kind |
|---|---|---|
| **The camp tent brings the Survey Kite.** The beach's second place, "Pitch the camp tent", gives the Kite instead of +8 energy. It is the third restoration for most players. | **Before:** the second generator came at 15 min (5 s an action, the guide-following player) and was never seen within 10 min; 98–100% of taps and merges were Rivet Rover; 22 of 27 crates could not be opened for the whole session. The +8 energy meant nothing: energy never fell below 96. | Stage data (`areas.mjs`), one line |
| **The guide line keeps its reason once a skill is learnt.** A quiet step now reads "Tap the Rivet Rover · *For the gold order: Clear the landing path*". | From 24 s to 60 s, the longest stretch of the first minute, the line said only "Tap the Rivet Rover" / "Drag a Grip tool onto its twin", with no reason, six and eight times. | Text only (`app.mjs`) |
| **The Daily gift no longer opens by itself in a camp's first session.** It still greets a returning player. The gift button stays. | It opened about 2 minutes into a new player's first session, over the next objective, and said "for coming back". In the browser run it blocked the next tap. | When it opens (`app.mjs`) |
| **A stage that brings a new generator kind says so before it is built.** The coast card says "Unlocks a new generator: the Survey Kite"; the restored card's Next line says "· unlocks the Survey Kite"; the reward reads "a new generator: the Survey Kite". | Gives the next restoration a visible pay-off, "a reason to continue". | Text (`app.mjs`, `coastal.css`) |
| **"an Ink scrap" instead of "a Ink scrap"** in the guide and hint lines. | The Kite's first part now shows in the first minutes. | Copy |

**Not changed:**
- the rules, the reducer, rewards, order generation and gold-order recipes;
- the board (27 crates, 17 tideglass);
- energy, coin values and costs;
- the save format and keys;
- the SDK;
- the Order UI and Gold Order identity, the Order Details sheet, the First Session 2.0 tutorial steps and levels, and the restoration presentation.

## 1. Method (identical before and after)

**Simulation** (`tests/v5-next-first10-metrics.mjs`, new). The same seeded harness as the economy tests (each action's time jittered ±40%), with 12 seeds, 15 minutes, and 3, 5 and 8 s per action. Three players:
- **guide** (`tests/v5-next-first10-policy.mjs`): does what the game's own guide line or Hint names (`tutorStep`), merges generator copies at once (the story says "Merge it with yours"), and with two or fewer free spaces tidies first. This is the closest model of a new player who follows the game.
- **normal:** the repo's scripted competent player.
- **gold:** the gold-first player.

Before is a `git worktree` of `6bbee67` (`ROOT=…`). After is this branch. Raw output: `sims-before.jsonl`, `sims-after.jsonl`.

**Browser** (`tools/session.cjs`):
- the CrazyGames page at 390×664 in Chromium, with a stand-in SDK whose cloud is empty (a new guest);
- real touch taps and pointer drags; 1.5 s to think before each action, +2 s the first time an action kind is met;
- the player follows `window.VWGuide.step` (the visible guide), then the same model;
- 10 minutes of wall-clock time; before on `6bbee67`, after on this branch.

Raw output: `session-before.json`, `session-after.json`, `session-before-after-390x664.jpg`.

**Whole game** (`tests/v5-next-difficulty-metrics.mjs`, both players, 4/5/8 s, 6 seeds), plus a rare-demand run (12 seeds × 4/5/6 s).

All evidence is in `docs/evidence/v5-first-10-minutes-2026-11-14/`.

## 2. The first 60 seconds

| Moment (browser, fast player) | 2026-11-12 audit (live flow, Home + story) | Before (`6bbee67`) | After |
|---|---|---|---|
| Board playable | 19.2 s | 0.4 s | 0.4 s |
| First generator tap | 21.6 s | 5.0 s | 4.9 s |
| First merge | 28.2 s | 11.6 s | 11.3 s |
| First crew order delivered | 39.0 s | 22.3 s | 21.9 s |
| Gold order delivered | 80 s | 62.9 s | 61.6 s |
| First restoration | 85–100 s | 73.9 s | 72.5 s |
| Messages in the first 60 s | — | 5 toasts, 0 dialogs | 5 toasts, 0 dialogs |

**Simulation, guide player:** first merge 6 / 10 / 16 s, first crew order 18 / 30 / 48 s, first build 75 / 125 / 200 s (3 / 5 / 8 s an action). This is the same before and after: nothing was changed in the first minute's rules.

**Findings:**
- **The flow is fast and well guided.** PR #104 removed Home and the story pages for a new player. Board, tap, merge and first order all come inside 25 s, and the guide line names what to do and why.
- **Friction 1: the reason disappears.**
  - After the first crew order (about 22 s) the guide moves to the gold order: Pocket winch + 2 Split spanners, 16 Copper offcuts' worth.
  - Taps and merges are "learnt" by then, so the line went quiet ("Tap the Rivet Rover") for the next 36 s: the longest and most repetitive stretch of the minute.
  - The player could still read the gold card, but the line no longer connected the action to its purpose.
  - **Fixed:** the quiet line keeps a short purpose ("For the gold order: Clear the landing path"). It shows no highlight and no hand, as before.
- **Friction 2: the camp has 3–4 free cells in the first minute.** Four corners are tideglass, and they break by about 1:00–1:40. A player who taps several times in a row fills the camp. The guide then says "The board is full: merge twins". That is a clear cause and effect, so it was left.
- **Friction 3: the energy pill.** It reads "100 /50 +50 BONUS" at the start. The audit called this confusing. Left for owner review: it is HUD presentation, outside this task's gameplay scope.
- **Competing objectives:** one primary order card, the strip and the guide line all name the same goal. That is fine.

## 3. The first 10 minutes

### 3a. The 2026-11-12 findings, re-measured on `6bbee67`

| Finding (Nov 12) | Now (`6bbee67`, guide player 5 s; browser) | Verdict |
|---|---|---|
| The board starts with 27 crates and 17 tideglass | Unchanged. At 10 min: 26 crates and 9–11 tideglass left; 22 crates need Kite or Rope Winch parts. | **Still true** |
| Early play dominated by Rivet Rover | 100% of taps, 98.5% of merges; 78% of crew orders Rover-only (the rest rare Bolts). Browser: 110 of 120 taps. | **Still true** |
| The next generator too late | Survey Kite at 15.0 min (sim), 7.9 min (fast browser player). Never within 10 min at 5–8 s. | **Still true** |
| Early board congestion | **Not reproduced** for a player who tidies: 0% of actions on a full board; 5–7 free cells after minute 2; the camp has 3–4 free cells only in minute 1. | **Mostly fixed** (by PR #104's guide) |
| Repeating the same crafting chain | Yes: every order and gold order is the Copper offcut → Grip tool → Split spanner → Pocket winch chain. | **Still true** |
| Repetitive progression between repairs | Gaps 1.8 / 3.2 / 1.7 / **6.0** / 3.5 min; the 6-min gap after "Line the path with lanterns". In it: about 3 min making the next gold order, then 2 min of crew orders for 50 missing coins. | **Partly true** (one gap; it is the coin sink, not a dead end) |
| Interruptions | 36 messages in 10 min (22 toasts, 6 energy notes, 6 restoration cards); **the Daily gift dialog by itself at 2:00**. | **One real interruption** |

### 3b. Options compared (Stage B)

| Option | Expected impact | Risk | Decision |
|---|---|---|---|
| **A1. Survey Kite as the camp tent's reward** (third restoration; replaces +8 energy) | High: second chain, mixed orders, the Kite's crates wake up, a big reward at restoration 3 | Low: one stage's data; no migration; later copies unchanged | **Chosen** |
| A2. Kite at the boardwalk (second restoration), the Rover copy moved to the tent | Higher variety at about 4 min | Medium: the Rover's level 2 (rare Gear chain, the lanterns' Gear goal) moves later; two big rewards change | Rejected: too much ripple |
| A3. A generator brings out the next kind at level 2 (`UNLOCK_LEVEL` 3 → 2) | Kite at about 4 min | High: changes every generator in every chapter; existing camps would get generators on their next action | Rejected |
| B1. Fewer crates or tideglass in a new camp | More open space | Medium: art-directed board, tested layouts; congestion not reproduced | Rejected |
| B2. Camp-corner tideglass starts cracked | A faster first minute | Low | Not needed: corners break by 1:40 |
| C. Cheaper first gold order | A shorter first minute | Low, but "making orders easier", and the first build is already at 73 s | Rejected |
| D. Delay the level-path rules (Triple merge at level 3, Tide tokens at 5) | Fewer new rules early | Medium: players at those levels would lose a rule they have | Rejected |
| E. Quiet guide line keeps the purpose | Clarity in the first minute | Low (text) | **Chosen** |
| F. No automatic Daily gift in a camp's first session | Removes the only blocking interruption | Low (when it opens) | **Chosen** |
| G. Preview "Unlocks a new generator" | A goal between restorations | Low (text) | **Chosen** |

### 3c. Before → after (simulation, guide player; medians of 12 seeds)

| Measure | 3 s an action | 5 s | 8 s |
|---|---|---|---|
| Second generator (Survey Kite) | 9.0 → **4.3 min** | 15.0 → **7.1 min** | not in 15 min → **11.4 min** |
| …present by 10 min (of 12 runs) | 12 → 12 | **0 → 12** | 0 → 0 |
| Rover share of taps | 90% → **73%** | 100% → **83%** | 100% → 91% |
| Rover share of merges | 88% → **71%** | 99% → **82%** | 98% → 93% |
| Crew orders asking Rover parts only | 82% → **43%** | 78% → **56%** | 71% → 71% |
| Restorations by 5 / 10 / 15 min | 3 / 5 / 7 → 3 / 5 / **8** | 2 / 4 / 5 → same | 1 / 2 / 4 → same |
| Longest gap between restorations (first 10 min) | 3.7 → 3.5 min | 3.4 → 3.4 | 3.5 → 3.5 |
| Free cells at 1 / 3 / 5 / 10 min | 3/6/7/5 → 3/6/6/4 | 2/5/6/5 → 2/5/6/7 | same |
| Actions on a full board | 0% → 0% | 0% → 0% | 0% → 0% |
| Lowest energy | 96 → 96 | 96 → 96 | 96 → 96 |
| Coins earned in 15 min | 660 → 695 | 375 → 430 | 290 → 290 |
| New rules met by 10 min | Triple merge, rare Bolt, Tide token → same | same | same |

**The normal and gold-first players move the same way:**
- the Kite at 5.1 / 8.4 / 13.5 min instead of 10.5 / not reached / not reached (normal), and 4.7 / 7.8 / 12.5 instead of 9.4 / 15 / not reached (gold-first);
- the Rover share of taps falls to 70–85% at 3–5 s.

**Browser, 10 minutes, the same fast player:**

| | Before | After |
|---|---|---|
| Restorations | 74, 161, 249, 305, 471, 573 s | 72, 127, 214, 266, 417, 515 s |
| Survey Kite | 476 s | **214 s** (with the third restoration) |
| Taps: Rover / Kite | 110 / 10 | 96 / **35** |
| Blocking dialogs | 1 (Daily gift at 120 s) | **0** |
| Failed or blocked actions | 1 | 0 |

**About the browser timings:** the Daily gift cost the scripted player 30 s, because it waited for the coast screen. A person would close it in a few seconds, so about 27 s of the "before" delay from 120 s on is that dialog, not the game. With that removed, restorations 2–6 come 0–30 s earlier after the change. That difference is within the noise of one run.

**What the player gets between restorations 2 and 4 now:**
- a new generator, shown before it is built ("Unlocks a new generator") and named when it arrives ("New generator: Survey Kite!");
- crew orders mixing two chains (Bram's two-part jobs: a Split spanner and a Sight lens);
- the canvas crates around the camp turning from muted to reachable, then green when a Kite key is in hand;
- the gold orders from then on asking a Kite part too.

That is a choice of what to tap and which order to work on, where before there was one chain.

## 4. Economy safety

| Area | Before → after | Verdict |
|---|---|---|
| **Energy** | Lowest energy in the first 15 min 96 → 96. Whole game: starvation 0 → 0 min, deadlocks 0 → 0. The tent's +8 energy is gone; the first stage's +20 and restoration milestones are unchanged. | No new bottleneck |
| **Coins vs build costs** | Gold share of coins 35.7% → 35.8% over the whole game. Coins earned in 15 min +0–15% (from the Kite's extra crew orders, not gifts). Stage costs unchanged. Stages short of coins when their materials arrive: 60% → 51% (normal). | No free coins added |
| **Gold orders** | Gold-order size unchanged (23.8 → 23.6 Level-1 units). Recipes and rare gold asks unchanged (29 a game). A gold order may now ask a Kite part a little earlier, because the newest generator is the Kite. Longest rare gold wait: 4.0 / 5.0 / 7.9 → 4.4 / 6.1 / 8.7 min (normal player, 4/5/8 s). | Not trivial; slightly longer worst case |
| **Generator pacing** | Kite at 6.8 / 8.5 / 13.7 min instead of 14 / 17.6 / 28 (normal, whole-game run). The Rope Winch still comes from the Kite's level 3; the Kite's copies (Workshop and later stages) are unchanged. The Rover's level 3 brings nothing new now (it still makes better parts). | Earlier second generator only |
| **Inventory** | Items on the board at 10 min: 2–7 (before 3–6); full-board actions 0%. With two chains the board holds a few more parts. | Fine |
| **Later chapters** | Whole game, 12 seeds × 4/5/6 s: every run finishes; total time 350 → 354, 438 → 439, 526 → 530 min (+0–1%). Gold-first Chapter 1: 133 → 128, 170 → 160, 272 → 253 min. | Unchanged |
| **Rare crew orders (owner review)** | Level 3 rare crew asks 16 → median 11 / 7 / 14 a game (4/5/6 s; min 6). Level 2: 42 → 53 / 45 / 53. Level 2 + 3 together: 58 → 64 / 52 / 67. With the Kite out earlier, the notes chain is asked at Level 2 more on the beach, which uses the drops a Level 3 ask needs. **The guard test changed** from "Level 2 ≥ 30 and Level 3 ≥ 10" to "Level 2 ≥ 30, Level 2 + 3 ≥ 45, Level 3 ≥ 5" (`tests/v5-next-build52a.test.mjs`). | **Trade-off: fewer hard rare crew goals** |
| **Crew-order repeats (gold-first)** | An everyday order repeating one of the last four: 5.7% → 13% for the gold-first player (normal player 2.2% → 2.5–3.1%). | Minor; watch |

## 5. Saves, cloud and existing players

- **No migration and no save change.** The tent's reward is stage data, read when the stage is built.
- **A camp that already built the tent** (it got +8 energy) loads unchanged. No Kite is added. Its Kite comes, as before, from the Rover's level 3. (Test: `tests/v5-next-first10.test.mjs`.)
- **A camp that has not built the tent yet** gets the Kite when it does.
- **A camp whose Rover already brought the Kite out** gets a second Kite to merge from the tent: a Kite level, nothing lost.
- **Real saves load as before:**
  - the chapter-1 fixture loads with its board and progress unchanged;
  - the save key is unchanged;
  - the whole saves, CrazyGames save and cloud suites run in CI.
- **Daily gift:** the camp's gift state is untouched. Only *when the dialog opens by itself* changed:
  - once a camp with progress reaches the board in a new session, as before ("Build 32" test unchanged);
  - never mid-session for a camp started in that session.

## 6. Code changes

| File | Change |
|---|---|
| `v5/next/areas.mjs` | `Pitch the camp tent`: `effect:{copy:'chart'}` (was `{energy:8}`); two new Neri lines |
| `v5/next/app.mjs` | `stepPurpose()` for quiet guide lines; `giftBase`, so the gift opens by itself only for a camp that had progress when the session reached the board; `firstOfKind`/`newKindOf` reward and preview text |
| `v5/next/guide.mjs`, `v5/next/tutor.mjs` | `an()`: "an Ink scrap" |
| `v5/next/coastal.css` | `.mapCard .cardGift` |
| `v5/play.html`, `v5/coast-crazygames.html` | Help text (the Kite comes with the camp tent); cache tags `first59a`; the CrazyGames page regenerated |
| `tests/v5-next-first10.test.mjs` (new) | Rule, save-compatibility and first-10-minutes simulation guard |
| `tests/v5-next-first10-policy.mjs`, `tests/v5-next-first10-metrics.mjs` (new) | The guide player and the measurements |
| `tests/v5-next.test.mjs`, `tests/v5-next-economy-sim.mjs` | Updated for the tent's Kite; the harness also counts a generator a stage gives |
| `tests/v5-next-build52a.test.mjs` | The rare-demand guard (§4) |

**To revert the gameplay change:** restore the one `areas.mjs` line (`effect:{energy:8}` and its lines). The UI changes are independent of it.

## 7. Tests

- **Unit:** `node --test tests/v5-*.test.mjs`: 494 pass (490 before, plus 4 new).
- **Generated files:** `node tools/coast-modules.mjs --check` and `node tools/coast-crazygames.mjs --check` pass.
- **Browser, Chromium, locally:** every Coast Camp suite in `.github/workflows/v5-first-session-2.yml`. Results are in the PR.
- **Browser, CI:** the same suites in Chromium and WebKit, on the draft PR.
- **Sizes (new screens):** 360×640, 390×664, 390×844, 430×932 and 907×510 (CrazyGames desktop), via `tools/shots.cjs`. At every size:
  - the quiet guide line shows its purpose;
  - the coast card says "Unlocks a new generator: the Survey Kite";
  - the reward reads "a new generator: the Survey Kite";
  - the Kite is on the board;
  - no sideways scroll and no page error.

  Screens are in `screens/`; `new-ui-390x664.jpg` shows the four.
- **Video:** `first-minute-and-kite-390x664.mp4`. The first 76 s of a new player (real input, the CrazyGames page), then the camp tent's build and the Kite's arrival.

## 8. Remaining risks

- **Simulations are models.**
  - The "guide" player follows the game's own line perfectly. Real players are slower, explore and make mistakes.
  - The browser player thinks 1.5 s per action, faster than most new players.
  - A real playtest (5 people, phone) is the next check.
- **The rare-crew-order mix shifts** (§4): fewer Level 3 rare crew goals in a typical game. This needs the owner's decision, or a separate tuning task.
- **The Kite at about 4–7 minutes adds a second thing to learn** in the first 10 minutes. It arrives after the guided span, with its own "New generator" moment and the hint line. There is no tutorial step for it, so whether players understand it needs a playtest.
- **The board still starts 92% obstacles,** and 20+ crates stay closed for the whole first 10 minutes. The Kite's crates now wake up, but the Rope Winch's do not.
- **The energy pill** ("100 /50 +50 BONUS") is unchanged.
- **WebKit** is tested in CI only (not installed in this sandbox).
- **No claim** of a retention, playtime or conversion change until CrazyGames analytics on a released build show it.
