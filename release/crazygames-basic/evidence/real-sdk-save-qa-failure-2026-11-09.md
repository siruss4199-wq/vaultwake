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
