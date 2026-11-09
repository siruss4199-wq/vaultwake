# Vaultwake Merge — real CrazyGames SDK save QA failure (2026-11-09)

**Status: FAIL — public submission blocked; source: owner-reported real QA test.**

## Reproduction observed by the owner
- Build uploaded to CrazyGames private QA: `vaultwake-merge-crazygames-basic-dd65d3f.zip`.
- Submission form option was advised as `Yes, using the Data Module from the CrazyGames SDK`; the selected value has not been independently verified.
- On the live CrazyGames QA preview, the game loaded and showed its Play screen. SDK QA panel earlier indicated Loading Start/Stop events and Get User / Data Get.
- Owner played and changed progress, waited approximately 30 seconds per assistant instruction, refreshed, and reported **progress did not remain**.
- Exact post-refresh state (fresh camp versus old/partial camp), browser version, Data Set traces, SDK errors and warnings were not supplied.
- This is a real-platform failure that the stub-SDK automated test suite did not catch.

## Investigation priorities (NOT proven root causes)
1. Inspect CrazyGames QA panel **Data: Get / Set** and **Warnings / Log** after playing, and after refresh. A successful Get call alone does not prove a durable Set.
2. Check the live submission form saved **Progress Save = Yes, using the Data Module**, as the SDK docs say `dataModuleDisabled` is thrown without it.
3. Verify the browser frame is running `SDK.environment === 'crazygames'` and that `SDK.init()` completely resolves before game save retrieval. In `v5/next/platform-cg.mjs`, `initPlatform({timeout=4000})` returns false on a timeout but permanently caches `ready=false`; `save-store.mjs` may then fall back to localStorage. The 4s timeout is a plausible candidate, not a confirmed cause.
4. Confirm `openSaveStore()` chose `kind:'data'`, `data.getItem(SAVE_KEY)` returned the expected progress, and `setItem` actually persisted on the real platform. Investigate delayed writes, iframe origin/storage, SDK errors and account identity.
5. Audit save reconciliation and journaling for cloud data being overwritten or a valid camp being moved to Kept camps.
6. Add tests that simulate SDK initialization over 4 seconds, QA-mode Data responses, disabled Data module, reload persistence, and slow/debounced SDK writes. Stub success is not real SDK proof.

## Safety and release gate
- Do not clear browser localStorage, SDK data, Kept camps or journals during investigation. Preserve evidence and saves.
- The old successful unit and fake-cloud tests do **not** override this real-player QA failure.
- Any code fix requires a **new ZIP**, checksum, CI and **repeat test in the real CrazyGames private QA preview**.
- Do not click public Submit/Continue for final publication or merge PRs before verification.
- Gameplay, economy, assets and monetization must remain unchanged.

---

## Investigation and fix (Claude, 2026-11-09). Not yet verified on CrazyGames

**The owner's failure has not been reproduced on CrazyGames itself.** No account and no portal access
were available here. The findings below come from reading the real SDK script
(`https://sdk.crazygames.com/crazygames-sdk-v3.js`, "HTML5 SDK" version 3.8.0) and from reproducing
each defect in a browser with a stand-in for that SDK. **No single root cause is claimed.**

### What the real SDK does that the earlier stand-in did not

| # | Real SDK behaviour (v3.8.0) | Effect on `dd65d3f` | Reproduced against `dd65d3f` |
|---|---|---|---|
| 1 | On CrazyGames, `SDK.init()` waits for four things in turn: a reply from the CrazyGames page (up to 7 s), the player (up to 5 s), a logged-in player's cloud data (up to 10 s), and the ads script. | `initPlatform` gave up after **4 s** and remembered "failed" for the whole session, so the save used localStorage. A guest's Data-module save lives in the SDK's own key (`SDK_DATA_<gameId>`), so a slow start showed a **fresh camp**. | **Yes.** With a 6 s init on a CrazyGames host name, `dd65d3f` never saves to the Data module. |
| 2 | Auth listeners run when CrazyGames sends `userLoggedIn`. | `dd65d3f` **stopped every save for the rest of the session** on that event, with no message to the player. | **Yes.** After a login event, `dd65d3f` writes nothing. |
| 3 | A disabled Data module throws `dataModuleDisabled` on every call. | If a write failed, it went to localStorage, but the camp was **read back from the Data module**, so the reload showed the old camp. | Yes (unit test). |
| 4 | Every `SDK.data.getItem` call posts a message to the CrazyGames page. | `dd65d3f` re-read every key on every save. | Not a failure on its own. |

### Fixes in `664956e` (no gameplay, save-format or save-key change)

- `initPlatform` keeps the SDK's real init promise. A timeout only answers that one call. On a CrazyGames host the save waits up to 25 s for the SDK; the loading screen stays up meanwhile.
- A login event no longer stops saving; it is only logged. The SDK keeps the data it opened with until CrazyGames reloads the game.
- A write the Data module refuses, or does not keep, goes to this browser, and that key is read from this browser for the rest of the session. At the next start it is copied back into the Data module.
- Progress keys are read from the Data module once and kept in memory.
- **Diagnostics:**
  - `window.VWSave` in the browser console: `kind`, `environment`, `initMs`, `user`, `accepted`, `lastSaved`, `errors`, and `reason` when the game is saving to this browser instead.
  - `[Vaultwake save]` lines in the console.
  - A line in the in-game **menu**, for example "Progress: saved to CrazyGames (guest) · last save 3 s ago".
- Existing saves, kept camps, the journal and the local copies are untouched; nothing is cleared.

### Tests

- `node --test tests/v5-*.test.mjs`: **465 pass, 0 fail**. This includes 22 save-store tests:
  - slow init;
  - a timeout followed by a late successful init;
  - a refused write read back from the browser;
  - a write the module silently drops;
  - saving after a login event;
  - number of SDK reads per save;
  - diagnostics.
- `tests/v5-next-crazygames-save-browser.cjs` (Chromium here; Chromium, WebKit and Firefox in CI on the extracted ZIP). New scenarios:
  - a slow SDK init on a CrazyGames host survives a reload;
  - a refused save mid-game survives a reload and is written back;
  - saving continues after a login event;
  - the menu save line.

  The same test **fails on `dd65d3f`**, at the login event and at the slow init.

### Exact retest in the real CrazyGames private QA (owner)

Upload `vaultwake-merge-crazygames-basic-664956e.zip`. Check the SHA-256 in `SHA256SUMS`. In the
submission form, Progress Save must be **"Yes, using the Data Module from the CrazyGames SDK"**.

**A. Guest, desktop browser.**
1. Open the QA preview in a normal window, not logged in to CrazyGames.
2. Press **Play**. Tap the Rivet Rover 3 times and merge once.
3. Open the menu (☰). The line under the settings should read **"Progress: saved to CrazyGames (guest) · last save … s ago"**.
   - If it says "saved in this browser (…)" or "refused a save (…)", write down the exact text.
4. Note the energy and coins. Wait 5 s, then refresh the page.
5. Home must show **Continue**, not Play, and the board, energy and coins must match.

**B. If it fails, collect this before closing the tab:**
- Press F12 and open the Console. Type `VWSave` and press Enter. Copy the whole object, especially `kind`, `environment`, `initMs`, `reason` and `errors`.
- Copy the `[Vaultwake save]` lines.
- In the CrazyGames QA panel, note the **Data: Get / Set** counts and any **Warnings / Log** lines.

**C. Logged in.** Repeat A while logged in to a CrazyGames account. The menu line should read "saved to your CrazyGames account". Then open the same QA link on a second device or browser with the same account; it should show **Continue** with the same camp.

**D. Mobile.** Repeat A on the Android phone in Chrome. This also covers item H.

**Not fixed until A and C pass on CrazyGames.** Until then this file stays **FAIL** and public submission stays blocked.
