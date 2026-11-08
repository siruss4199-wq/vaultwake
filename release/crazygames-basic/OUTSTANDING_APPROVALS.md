# Vaultwake Merge: release readiness and outstanding approvals

**Decision today: NO-GO for upload. Commercial use of shipped artwork was approved by the owner on 2026-11-08; trademark review, developer/publisher details, real-device QA and portal submission remain outstanding.**

The package is technically ready (`CHECKLIST.md`). The account details are owner-confirmed
(`evidence/owner-confirmation-2026-11-08.md`). The artwork owner-approval decision is now documented; other publishing checks still require the owner or testers.
Nothing has been submitted to CrazyGames, published or merged.

## Final release-readiness checklist

| Area | Status | Evidence / what is left |
|---|---|---|
| Upload ZIP | ✅ Ready | `vaultwake-merge-crazygames-basic-e72b4bb.zip`, 333 files, 14.2 MB, SHA-256 in `SHA256SUMS`; reproducible from `e72b4bb` (CI compares bytes) |
| Basic Launch configuration | ✅ | `data-ads="off"`, SDK v3 lifecycle, no ads or purchases, nothing leads out (CI, three browsers) |
| Download size and paths | ✅ | 3.27 MB before `gameplayStart`; 0 missing files in the ZIP run and the trimmed-tree run |
| Unit and simulation tests | ✅ | 443 pass, 0 fail |
| CI | ✅ | 12/12 on `6d5af0e`, the last commit that touched the package. On the docs-only commits since, one WebKit timing failure each; each passed on its single re-run (see the PR) |
| Saves, economy, energy, progression | ✅ Unchanged | No game code changed since `fd76b03` apart from the title and menu text |
| Covers (3) and videos (2) | ✅ Technically | Sizes, durations and silence checked in CI; made from the game's own art |
| Store text | ✅ Draft | `METADATA.md`; developer/publisher fields need the owner |
| Art origin and accounts | ✅ Owner-confirmed | ChatGPT Plus and Claude Pro, personal accounts, Mongolia, Oct–Nov 2026. Not independently verified |
| Provider terms | ✅ Checked | OpenAI Terms of Use + Service Terms; Anthropic Consumer Terms. Commercial use permitted, output assigned to the user, no exclusivity (`RIGHTS_REPORT.md` §2) |
| Art approval (`owner_approved`) | ✅ **Owner-approved** | YES for the 264 shipped images, dated 2026-11-08, supported by the owner declaration; 86 non-shipped register rows remain NO. Approval is owner attestation, not independent third-party clearance. |
| Name "Vaultwake Merge" | ❌ **Owner** | Web searches only; no trademark-office search |
| Developer/publisher identity | ❌ **Owner** | Name and contact e-mail |
| Real devices | ❌ **Owner/tester** | No iPhone or Android test yet; first-tap sound on iOS unconfirmed |
| CrazyGames submission | ❌ **Owner** | Upload in the developer portal after the above; acceptance is CrazyGames' decision |

## Exact owner actions

| # | Action | Why |
|---|---|---|
| A | ~~Decide on the 85 images with no master or generation record~~ | **Accepted 2026-11-08** in the owner's declaration (`evidence/owner-declaration-2026-11-08.md`): origin from the same workflow, per-image tool unverifiable, documentation gap accepted |
| B | ~~Accept non-exclusivity and uncertain copyright protection~~ | **Acknowledged 2026-11-08** in the owner's declaration |
| C | ~~Confirm the four crew portraits are not likenesses of real people~~ | **Closed 2026-11-08**: owner confirms Ivo, Bram, Neri and Tamsin are fully AI-invented fictional characters (statement 8 in `evidence/owner-confirmation-2026-11-08.md`) |
| D | Read OpenAI's **Sharing & Publication Policy** once (it could not be loaded here), or accept the risk. | Unchecked policy |
| E | ~~Complete owner artwork approval~~ **Completed 2026-11-08.** Declaration explicitly approves commercial use of all 264 shipped images, with GitHub handle/date as owner identifier; rights register and release inventory show YES. | This is owner approval, not an independent guarantee of third-party rights. |
| F | **Owner chose 2026-11-08: search trademarks before submission.** Search WIPO, USPTO, EUIPO and the Intellectual Property Office of Mongolia for "Vaultwake" / "Vaultwake Merge" (classes 9 and 41), fill in the table in `evidence/name-decision-2026-11-08.md`, then decide to keep, change or file the name. | Upload waits for the searches |
| G | Give the **developer/publisher name and contact e-mail** for `METADATA.md` and the portal. | Portal fields |
| H | **Test on real phones**: iPhone (Safari) and Android, about 10 minutes each: merge, deliver, build, reload, and sound after the first tap. | No human device test yet |
| I | **Upload** the ZIP, covers, videos and text in the CrazyGames developer portal. | Submission is the owner's act |

When D–H are done, the same ZIP can be uploaded unchanged: its SHA-256 is in `SHA256SUMS`, and CI
proves it is the reproducible build of `e72b4bb`. A change to any art means a new build and a new
checksum.
