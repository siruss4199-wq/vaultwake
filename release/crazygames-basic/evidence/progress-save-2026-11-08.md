# Vaultwake Merge: progress save on CrazyGames (2026-11-08)

## The blocker

The CrazyGames Basic submission form asks whether the game saves progress and offers three answers:

1. No progress save
2. Yes, CrazyGames SDK Data Module
3. Yes, game account/backend linked to CrazyGames

Build `e72b4bb` saved only to browser localStorage (`vaultwake-v5-coast`), which matches none of them.

## What CrazyGames documents (read 2026-11-08)

| Source | What it says |
|---|---|
| Data module, https://docs.crazygames.com/sdk/data/ | Saves user data for logged-in users, synced on all their devices; for guests it stores the data locally and moves it to the account when the guest logs in. *"Don't forget to select the appropriate Progress Save toggle in the submission flow. The data module will be disabled otherwise."* *"You need to fully rely on the Data Module save (for both guest and logged-in users on CrazyGames) and avoid relying on local saves."* Same API as localStorage (`getItem`, `setItem`, `removeItem`, `clear`); initialise the SDK first. Limit 1 MB (`dataLimitExcedeed`); `dataModuleDisabled` if the form option was not chosen; saving debounced by 1 s, up to 30 s. For games already using localStorage: copy the existing keys in so returning players keep their progress. |
| APS, https://docs.crazygames.com/other/aps/ | *"automatically backs up and restores the localStorage on the devices where the user plays… no implementation required."* Not allowed with in-game purchases. The page does not say which submission option turns it on. |
| Account integration, https://docs.crazygames.com/requirements/account-integration/ | Recommends the Data module; APS is described as an alternative. |
| User module, https://docs.crazygames.com/sdk/user/ | On login, a game using the Data module or APS is reloaded by CrazyGames; logout refreshes the page. |

**Decision.** APS needs no code, but none of the three form options names it, and the Data module page
says to rely fully on the Data module and not on local saves. Choosing the Data module option without
using it would leave the game on localStorage. Choosing "No progress save" would mis-describe a game that
saves. So the game now uses the Data module (source commit `dd65d3f`), and the form answer is
**"Yes, CrazyGames SDK Data Module"**.

## What changed (code only; no gameplay, save format or save key change)

- `v5/next/save-store.mjs` (new), used by `v5/next/app.mjs`. The SDK is initialised before the save is read.
- **Where progress goes.**
  - **On CrazyGames:** the Data module, once `SDK.init()` succeeds with `environment === 'crazygames'` and `SDK.data` answers.
  - **Everywhere else, or if the Data module refuses:** localStorage, exactly as before.
- **What counts as progress:**
  - the camp;
  - energy receipts;
  - the first-story flag;
  - kept camps.

  Sound and haptics settings, the playtest log and the Classic save stay in the browser.
- **Migration with nothing lost:**
  - Progress already in this browser is copied in, once per browser.
  - A camp that differs from one already in the Data module goes to a kept slot, which Kept camps in the menu brings back.
  - localStorage is never cleared.
- **SDK write delay:**
  - The last save of a session, and any camp copied aside, are noted on the device for that player.
  - At the next start they are written again if the account still holds an earlier save from that session.
  - A camp from another device is kept aside instead of replaced.
  - A camp that a delayed restore or new camp replaced is kept too.
- **1 MB:**
  - A full camp is about 5 KB (measured over full playthroughs, all 8 areas).
  - Kept copies stop 64 KB below the limit; the app then keeps the current camp and says the storage is full.
  - The camp itself always saves.
- **Errors:**
  - A failed write goes to localStorage and is copied back at the next start.
  - After a login nothing is written until CrazyGames reloads the game.

## Tests

| Test | Result |
|---|---|
| `node --test tests/v5-*.test.mjs` | 459 pass, 0 fail. Includes `tests/v5-next-save-store.test.mjs`, 16 tests: outside CrazyGames; refusing module; new guest; reload and second device; kept camps without key listing; adopting browser progress (once, never over a different camp, not into a second account); damaged and newer saves copied as they are; delayed write rewritten; other device moved on; per-player notes; module failing mid-game; 1 MB; delayed restore and new camp keep the replaced camp; login hold. |
| `tests/v5-next-crazygames-save-browser.cjs`, on the unzipped package, Chromium | Passed. Uses a stand-in SDK whose Data module "cloud" is shared between reloads and browser contexts: new guest, reload, second device, login hold, browser camp copied in, account camp kept, restore with lost writes, refusing module. WebKit and Firefox run in CI (`v5-release-package.yml`). |
| Existing suites, Chromium | `v5-next-crazygames-browser`, `v5-next-saves-browser`, `v5-next-home-browser`, `v5-next-energy-browser`, `v5-next-chapter2-browser` passed. |

## Not verified here

- **The real CrazyGames SDK and accounts.** No CrazyGames account or portal access was available. Before going public, the owner should use the portal's private QA link to check:
  - as a guest, play and reload;
  - log in to a CrazyGames account, play and reload;
  - open the game on a second device with the same account.
- **The SDK's guest storage.** Whether it uses the same localStorage keys is not documented. Either way works: identical values are not copied twice.
- **Two tabs at once.** Two tabs of the game on CrazyGames do not see each other's unsaved changes. The Basic build has no ads or purchases, so this only matters if a player plays in two tabs at the same time.
