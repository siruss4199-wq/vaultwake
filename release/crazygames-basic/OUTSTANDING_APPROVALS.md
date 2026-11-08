# Vaultwake Merge: outstanding approvals before upload

**Decision today: NO-GO for commercial upload.** The package is technically ready (`CHECKLIST.md`).
What blocks it is ownership evidence and owner decisions, which no amount of engineering can supply.
Nothing has been submitted to CrazyGames, published or merged.

| # | Blocker | Severity | Owner action | Where |
|---|---|---|---|---|
| 1 | No tool account is documented for the art. Owner statement: made Oct–Nov 2026 with ChatGPT Astra (OpenAI) and Claude Code (Anthropic). Commits show Claude Code's processing and its 21 code renders, but neither account or plan is recorded, so no terms are tied yet (`owner_approved=NO` on all 264). | **P0** | Name the ChatGPT Astra plan and holder, the Claude Code plan and holder (not an evaluation or trial), and your country of residence. OpenAI and Anthropic terms both assign Output to the user (`RIGHTS_REPORT.md` §2). | `RIGHTS_REPORT.md` §2, §6 |
| 2 | 85 images have no master or generation record, so their generating tool is **unverified**: 39 icons and 21 beach places cut from your sheets, 25 Observatory images cut from your concept sheets. Only the cutting by Claude Code is shown. | **P0** | Add the original sheets or generation history to `docs/art-source/`, or sign off their attribution as "ChatGPT Astra or Claude Code, unverified". Then set `owner_approved=YES` group by group. | `ASSET_INVENTORY.csv` (`tool_attribution`) |
| 3 | Covers and videos use the art in rows 1–2 | **P0** (follows 1–2) | Nothing extra: they are cleared when rows 1–2 are. Only remake them if art is replaced. | `covers/`, `videos/` |
| 4 | The name "Vaultwake Merge" has had web searches only | **P1** | Run formal searches in USPTO, EUIPO, WIPO and the home office (classes 9 and 41), decide on filing, and check the domain and social handles | `RIGHTS_REPORT.md` §3 |
| 5 | Developer and publisher identity, contact e-mail, credits, age rating and release date | **P1** | Fill in the **OWNER** fields | `METADATA.md` |
| 6 | No human test on a real iPhone or Android phone; iOS audio unlock (first `pointerdown`) not confirmed | **P1** | Play the ZIP on an iPhone (Safari) and an Android phone for 10 minutes: merge, deliver, build, reload. Check that sound plays after the first tap. | `CHECKLIST.md`, "Layout, input, browsers" |
| 7 | ~~WebKit and Firefox results for this exact head~~ | done | All 12 CI checks passed on `6d5af0e` (ZIP played in Chromium, WebKit and Firefox; one WebKit timeout passed on its single re-run) | PR checks |
| 8 | ~~47 images shipped but were never loaded~~ | done | Left out of the ZIP on 2026-11-08 at your request (`tools/coast-crazygames-unused.txt`) | `RIGHTS_REPORT.md` §1 |
| 9 | Portal acceptance | — | Upload only after rows 1–6. CrazyGames' QA decides acceptance; it is not claimed here. | CrazyGames developer portal |

When rows 1–6 are closed, the same ZIP can be uploaded unchanged: its SHA-256 is in `SHA256SUMS`, and CI
proves that it is the reproducible build of `e72b4bb`. A change to any art means a new build and a new
checksum.

## Who does what

| Item | Owner decision or action | Technical work left |
|---|---|---|
| Commercial artwork rights (rows 1–3) | Yes: tool, account, dates, missing originals, then `owner_approved=YES` | None. The register, inventory and report are complete for what the repository can show. |
| Name "Vaultwake Merge" (row 4) | Yes: formal searches or counsel, decision to file | None |
| Developer/publisher fields (row 5) | Yes: legal name or studio name, contact e-mail, release date, age rating | None. Paste into `METADATA.md` or the portal. |
| Real iPhone and Android test (row 6) | Yes: someone with the devices plays the ZIP for about 10 minutes | Fixes, if the test finds something |
| CrazyGames QA submission (row 9) | Yes: the owner uploads in the developer portal | None. ZIP, covers, videos and text are ready. |

## What the owner needs to send (one message is enough)

1. ChatGPT Astra: plan (Free, Plus, Pro, Team/Business, Enterprise or API) and account holder.
2. Claude Code: plan (Free, Pro, Max, Team, Enterprise or API) and account holder; confirm it was not an evaluation or trial offer.
3. Country of residence, which decides the applicable OpenAI terms.
4. For the 85 unrecorded images: the original sheets, or a signed note accepting "ChatGPT Astra or Claude Code, unverified".
5. Developer/publisher name and contact e-mail for the portal.
6. Trademark: formal search results, or written acceptance of the name risk.
7. Real-device test result: iPhone (Safari) and Android, about 10 minutes each, including sound after the first tap.
