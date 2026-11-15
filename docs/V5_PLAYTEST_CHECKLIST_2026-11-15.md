# Vaultwake Merge: real-device playtest checklist and gate (PR #105, 2026-11-15)

- **Build:** `claude/v5-first-10-minutes` @ `5a5355b`, a DRAFT stacked on PR #104.
- **Not done:** no merge, no CrazyGames upload, no save migration.

**Owner decisions:**
- Keep the Survey Kite with the camp tent.
- Keep the Level 3 rare-order "ladder", provisionally.
- No further economy changes before the playtest.

## 1. Gate status

| Check | Result |
|---|---|
| Unit and simulation tests (CI, `5a5355b`) | ✅ 494 pass |
| Chromium browser suites (CI, `5a5355b`) | ✅ all Coast Camp suites (run 43691777608) |
| WebKit browser suites (CI, `5a5355b`) | ✅ all Coast Camp suites, including build-flow at 360/390×664/390×844/430×932 with fresh browsers (run 43691777608) |
| Local Chromium, all 29 Coast Camp suites (`1db7432`; `5a5355b` changes only the build-flow test) | ✅ |
| Saves | No migration. The existing-save, cloud-save and fixture suites pass. Save keys are unchanged. |

**The WebKit crash on `1db7432` was a test-lifecycle failure, not a gameplay crash:**
- **One step crashed.** It was the 4th size (430×932) of `v5-next-build-flow-browser.cjs`, on `page.reload`, in one long-lived WebKit browser. The same flow had just passed at 360×640, 390×664 and 390×844 in that browser.
- **It does not depend on this PR.** The same suite passed in WebKit on `6bbee67` (PR #104) and `3808698`. This PR changes nothing in the forge build and reload the step exercises.
- **It is a known WebKit crash.** The First Session 2.0 suite already documents it: "WebKit's page process crashed twice in CI late in one long-lived browser" (`7d2674e` at 430×932, `a840801`), and relaunches the browser per run.
- **The fix is in the test only.** `5a5355b` gives the build-flow suite a fresh browser per size; every check is unchanged.
- **The flow itself was checked again.** On `1db7432`, 23 WebKit suites passed, including the save, cloud-save and chapter suites (each with builds and reloads). The 5 suites after build-flow in the same CI step did not run.
- **Confirmed:** the WebKit run on `5a5355b` ran the same flow at all four sizes, green.
- **On real phones:** if a page crash or "A problem repeatedly occurred" is ever seen, record it as a bug (§3).

**A second WebKit failure, on `39502af` (docs only, the same game code as `5a5355b`), was also a test-timing issue:**
- **What failed:** `v5-next-rare-merges-browser.cjs` waited 4 s for the "Materials secured" toast and missed it.
- **What the game does:** a recording of every toast in that flow (Chromium) shows exactly one, "Materials secured", at 0.94 s after the tap, nothing replacing it. It lives 1.75 s.
- **Why the test missed it:** the check began only after another wait (for the strip), so a slow runner could start looking after the toast had gone.
- **The fix is in the test only:** the page now records every toast as it appears, and the test checks the recorded text. The assertions are unchanged.

**On a real phone the toast's short life may matter:** watch whether players read "Materials secured · Build" before it fades (§3, question 3).

## 2. Setup (preserves the preview and every save)

- **Preview:**
  - pinned to this build: https://7a92db57.wispwood-game.pages.dev/v5/play.html
  - CrazyGames-style page: `…/v5/coast-crazygames.html`
  - the branch preview moves with the branch; use the pinned link.
- **Devices:** at least 2 iPhones (Safari) and 2 Android phones (Chrome), plus 1 small phone (≤ 375 pt wide).
- **New player:**
  - a private/incognito tab, or a browser profile that has never opened the game;
  - **never the owner's own browser profile**, so existing camps stay untouched;
  - do not use `?new=1` on a device that holds a camp.
- **Sound** on, at normal volume. Portrait. No hints from the observer.
- **Afterwards:**
  - copy the log: Menu → Playtest log → Copy / Download `.json`. It stays on the device and is never sent anywhere.
  - then close the private tab.

## 3. Observation sheet (one per player, 10–15 minutes, no coaching)

**Player:** P1–P5. **Device / OS / browser:** ______. **Merge-game experience:** none / some / a lot.

| # | Question | Observe | Record | Expected (simulation and browser) |
|---|---|---|---|---|
| 1 | Do they understand the first action? | The first tap on the Rivet Rover, unprompted | Seconds to first tap; hesitation or wrong taps | First tap within about 5–10 s |
| 2 | Can they complete the first order? | Merge, then deliver Ivo's order | Time to first merge and first delivery; did they read the guide line? | Merge 10–20 s; order 20–50 s |
| 3 | Do they understand Gold Orders? | Deliver the gold order, then Build on the coast | Time to the first build; say-aloud "what is the gold card for?" | First build 75–200 s (3–8 s per action) |
| 4 | Do they discover and use the Survey Kite? | After "Pitch the camp tent": the note "New generator: tap the Survey Kite…" | Did they tap the Kite within 30 s? Did they understand its parts open the canvas crates? | Kite at 4–11 min |
| 5 | Do they feel rewarded by restoration? | The coast change, the restored card, the next objective | Facial or verbal reaction; did they read the card? Did they tap "Back to the board"? | 4 or more restorations in 10 min at a normal pace |
| 6 | Do they want to continue after 10 minutes? | At 10:00 ask "Do you want to keep playing?" and do not stop them | Yes/no; voluntary stop time and the screen at that moment | — |
| 7 | Does the UI fit and respond? | Taps, drags, order cards, coast screen, sheets | Missed taps, mis-drags, clipped text, scrolling, freezes, crashes | No sideways scroll; tap targets 44 px or more |

**Also note:**
- every point of confusion: time, screen, what they said;
- any failure: a stuck state, nothing to do, board full with no way out, a page reload or crash;
- any time they look for help (Menu, Hint) and whether it helped;
- the moment they first say "I get it".

**After the session**, ask three questions:
1. What were you trying to do?
2. What was the best moment?
3. What annoyed you?

**Milestones from the log** (`milestones`: `firstMerge`, `firstOrder`, `firstStage`, `firstDiscovery`; and `summary.minutes`): copy them into the table.

| Player | First tap (s) | First merge (s) | First order (s) | First build (s) | Kite tapped (min) | Builds at 10 min | Stopped at (min) | Wants more? |
|---|---|---|---|---|---|---|---|---|
| P1 | | | | | | | | |
| P2 | | | | | | | | |
| P3 | | | | | | | | |
| P4 | | | | | | | | |
| P5 | | | | | | | | |

**Pass bar:**

| Pass bar (4 of 5 players) | Fail (any one) |
|---|---|
| First order without help | A player cannot find the first action within 30 s |
| First build by 4 min | A crash, freeze or lost progress |
| Taps the Kite within 1 min of its note | A UI element unusable on a device (clipped, untappable) |
| No blocking confusion | — |

## 4. Long-session QA (separately; observe, do not change the mechanics yet)

**Current measurements:** simulation, with the scripts in `docs/evidence/v5-first-10-minutes-2026-11-14/balance-review/`. Evidence from real long sessions is what would justify a change.

| Topic | What to check | Current measurement (this build) | Watch for |
|---|---|---|---|
| Rare Gold Order waits | Time from a gold order needing a rare part (Gear, Expedition note, Gear assembly, Travel notebook) to its delivery | Median 0.40 and 99th percentile 1.33 min per s/action, normal player (baseline 0.43 / 0.96). Slowest: the Vault door ring and the harbour registry (four drops). | Waits over about 10 min at a normal pace; players saying they are "stuck waiting for a Gear" |
| Unfinished rare crew orders replaced | A rare crew card disappearing when a gold order arrives | Level 3: 11 replaced and 9 delivered a game (baseline 7 and 9) | Players noticing or minding it |
| Gold-first repetition | Players who ignore crew orders seeing the same rare card return | 13% of everyday orders repeat one of the last four (baseline 5.7%); normal player 4.2%, guide-follower 5.3% | Players calling orders repetitive |
| Energy, coins, progress (30–40 min) | The HUD energy, coins and stage count at 20/30/40 min | Guide-follower, 5 s/action: energy at 40 min 72 (baseline 84); lowest after minute 10 72 (81); builds in 40 min 12 (11); longest gap 5.8 min (7.6); no energy starvation | Energy at 0 with nothing to do; a gap over 10 min with no restoration; the board full |

**How:**
- one tester plays 40+ minutes on a phone, at a natural pace;
- note the time of each restoration and each rare gold order, and when energy first runs out;
- export the playtest log;
- in parallel, re-run the simulations listed above (identical conditions).

## 5. Report template (GO / NO-GO)

```
PR #105 @ 5a5355b — playtest <date>, 5 players, devices: …
GO / NO-GO for wider testing:
  First 60 s:   x/5 first order unaided; median first build … s
  Gold Orders:  x/5 understood (quote)
  Survey Kite:  x/5 tapped within 1 min of the note; x/5 understood its crates
  Restoration:  x/5 visibly rewarded
  10 minutes:   x/5 wanted to continue; voluntary stops at …
  UI/devices:   issues (device, screen, repro)
  Crashes:      none / list
Long session:   rare gold waits …, replaced rare cards …, repetition …, energy/coins at 30–40 min …
Blockers (S1/S2) with repro:
Owner decisions needed:
```

## 6. Current recommendation

**GO for the real-device playtest.** The unit, Chromium and WebKit CI on `5a5355b` are all green.

- **Not a release candidate.**
- No CrazyGames upload, no merge to main, no save migration.
- The ladder and the Kite timing are provisional until the playtest and long-session evidence are in.
