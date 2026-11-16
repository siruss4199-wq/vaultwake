# Vaultwake Merge: tutorial endpoint (PR #105, 2026-11-16)

**Owner decision:** the tutorial guides a new player only through the first loop:

Generator → Merge → Crew Order → Coins → Gold Order → Materials → Coast → First Build

The first completed Build is the tutorial's end.

**Unchanged:**
- the spotlight design, the steps' look and the layout;
- Skip and saves;
- gameplay, economy and the CrazyGames SDK.

## 1. What changed

| | Before (`de140bc`) | Now |
|---|---|---|
| **When the guide ends** | After the first Build, a guided "next objective" continued until the next delivery, with the path still at stage 1. | **The first Build ends it.** `tutorActive` (`v5/next/tutor.mjs`) is now the first-loop guide itself, `coachActive` (`v5/next/coach.mjs`): a new camp until its first stage is built, or until Skip. |
| **Gold Order delivered, Build not yet made** | Guided (strip, then coast Build). | Unchanged: still guided to the strip and the coast screen's Build. A reload resumes there. |
| **Right after the first Build** | The message line said "Guide complete. Next: …", and the next objective was guided. | **"✓ Tutorial complete"** shows once, at the top of the restored place's card on the coast screen. It is a line in the card, so later toasts (level up, rewards) cannot replace it; a toast is shown instead if no card appears. The message line says "Tutorial complete. Next: …". The guide, its spotlight, cue and hand clear at once. |
| **Back on the board** | Guided next objective. | **The normal game:** the normal objective line, no highlight, no spotlight. The 💡 Hint stays. On request it shows the next step with its highlight, but without the tutorial's spotlight. |
| **After a reload** | Resumed the next objective. | **Stays complete.** The first stage is built, and that alone ends the guide, whatever the seen flags say. |
| **Skip** | Ended the guide. If it was pressed before any other action, it was not saved, and the guide came back after a reload. | Ends the guide. **Skip now counts as the player's first action**, so the camp is saved from it and the guide stays gone after a reload. |
| **Existing saves** | A camp with a stage built, or one played before the guide existed, never got it. | Unchanged. No camp with a stage built is ever sent into the guide. |

**Saves:**
- No save change or migration.
- The seen flags `coach-on`, `coach-done` and `coach-next` keep their meaning. `coach-next` still records a guide finished by its first Build, but no longer extends it.

**Note:** once the tutorial is over, the normal game's own Daily gift dialog may open as usual. Before, it stayed closed while the next objective was being guided.

## 2. Files

- `v5/next/tutor.mjs`: `tutorActive = coachActive`; the "next objective" guide level is removed.
- `v5/next/app.mjs`:
  - the first Build's confirmation (`tutorDone`, `.rcDone` on the restored card; toast fallback);
  - the guide cleared at once;
  - the Hint after the tutorial shows no spotlight;
  - Skip counts as the first action.
- `v5/next/coastal.css`: `.restoredCard .rcDone` (one green line).
- Cache tags `end65a`. `v5/coast-crazygames.html` regenerated.

## 3. Tests

**New: `tests/v5-next-tutorial-endpoint-browser.cjs`** (Chromium and WebKit; 390×664 and 360×640; real taps and drags), in CI after the tutorial-visual suite:
1. **New player:**
   - tap, merge, crew delivery and the gold order are each guided;
   - with materials in and nothing built: "Tap Build", spotlight on the strip;
   - a reload there resumes at Build;
   - the coast's Build is guided;
   - after it: "Tutorial complete" once on the card, and `coach-done` saved;
   - back on the board: no guided step, spotlight, cue, hand or highlight, and Hint visible;
   - the same 3 s later and after a reload;
   - Hint shows the next step without a spotlight.
2. **Skip on a new camp:** normal game at once and after a reload.
3. **An existing progressed save** (`coast-ch1-pre-secondary.json`, stages built): never guided, before or after a reload.

**Updated:**
- `v5-next-tutor.test.mjs`:
  - the first Build ends the guide under any seen flags;
  - gold delivered but not built is still guided, across a reload;
  - after the Build, complete across a reload;
  - Skip and pre-guide camps unchanged.
- `v5-next-guide-browser.cjs` and `v5-next-first-session-2-browser.cjs`: after the first Build, "Tutorial complete" and the normal game, across a reload. Before, they expected the guided next objective.

**Results (local Chromium):**
- `node --test tests/v5-*.test.mjs`: 494 pass.
- All 34 Coast Camp browser suites in the workflow pass (33 plus the new endpoint suite).
- `v5-next-browser.cjs` and `v5-next-playtest-browser.cjs` also launch WebKit, which is not installed here: their Chromium parts pass.
- CI runs Chromium and WebKit.

**Screenshots** (390×664 at 2×, a new player played through the real guide, `shots.cjs`), in `docs/evidence/v5-tutorial-endpoint-2026-11-16/`:
1. `390x664-1-build-step.png`: the gold order delivered, nothing built. "Tap Build", with the strip in the spotlight.
2. `390x664-2-tutorial-complete.png`: after the Build, "✓ Tutorial complete" at the top of the restored place's card.
3. `390x664-3-board-after.png`: back on the board. The normal game: the normal objective line and Hint, with no spotlight, cue or guided line.
