# CrazyGames update: Basic ZIP from `ac1d8bc` (private QA)

**Status: PRIVATE QA CANDIDATE. Not uploaded, not submitted, not published.** Full report: `docs/V5_CRAZYGAMES_UPDATE_ac1d8bc_2026-11-17.md`.

| | |
|---|---|
| File | `vaultwake-merge-crazygames-basic-ac1d8bc.zip` |
| SHA-256 | `253dcb715440f12198d3074abf5a14c92b90caa5ffe4ea4a70ab36f6e34adb32` |
| Size | 14,886,738 bytes; 337 files |
| Source | `ac1d8bcbf507dcdf0f8bbf060ce618103f8a1ba8` (PR #106) |
| Tested | CI run 44119749481 (Chromium 151 + WebKit 26.5; outputs in `ci-results/`) |
| Rollback | live `822a8f9` ZIP, SHA-256 `b160a59a9f0ac9ff78fe968b638433ea104bf7fde6363667528d4365e067e890` |

## Check the file first
```bash
cd release/crazygames-update-ac1d8bc
sha256sum -c SHA256SUMS          # must print: vaultwake-merge-crazygames-basic-ac1d8bc.zip: OK
unzip -tq vaultwake-merge-crazygames-basic-ac1d8bc.zip
```
To rebuild it, check out `ac1d8bc` and run `node tools/coast-crazygames.mjs --zip`. The result must have the same SHA-256.

## Upload for private QA (owner, in the CrazyGames developer portal)

1. Open the **existing** game **Vaultwake Merge (ID 166859)**.
   - Do not create a new game.
   - Do not restart Basic Launch.
   - Do not change the game ID.
2. Add a **new build** and upload this ZIP. Keep the settings the live build has:
   - **Progress save: Yes, CrazyGames SDK Data Module**: unchanged, so existing player saves carry over;
   - no ads, no in-game purchases;
   - the same orientation and embed settings.
3. **Do not submit or publish the build.** Use only the portal's **QA / Preview** tool.

## Private QA script (each device)

Devices: iPhone Safari, Android Chrome (never tested yet), desktop Chrome. Record the browser version on each.

| # | Step | Expected |
|---|---|---|
| 1 | Logged in, with an existing live camp: open the preview | Home shows **Continue**; the camp (coins, builds, board) is the same as on the live game |
| 2 | Play one action, wait 5 s, refresh | Continue; that action is kept |
| 3 | Guest (private window): new camp | The tutorial guides you to the first Build, then "Tutorial complete" once |
| 4 | Fill the board (generator taps) | Board Full Rescue highlights one action (Deliver / merge / Shed / Clear, which asks twice); it goes away once a space is free; Hint shows it again |
| 5 | Select a part, then Shed, on a phone | The part's art stays inside the shed slot (the Shed hotfix) |
| 6 | Refresh as a guest | Continue; progress kept |
| 7 | Same account on a second device | Continue with the same camp |
| 8 | Throughout | No ads, no links out of the game, nothing cut off at the phone's width |

If any step fails, keep the live build. Report the device, the browser, the step and a screenshot.

## After private QA

Making this build live is a separate owner decision. It also needs:
- the B5 design decision;
- legal items D and F.

See the report's GO / NO-GO. If anything goes wrong after an update goes live, re-upload the `822a8f9` ZIP above. Saves stay compatible both ways (tested in `ci-results/*-crossver.txt`).
