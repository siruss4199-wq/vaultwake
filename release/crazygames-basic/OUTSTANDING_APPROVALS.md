# Vaultwake Merge: release readiness and outstanding approvals

**Decision today: NO-GO for upload, pending the owner's explicit approvals below.**

The package is technically ready (`CHECKLIST.md`). The account details are owner-confirmed
(`evidence/owner-confirmation-2026-11-08.md`). What remains are decisions only the owner can make.
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
| Art approval (`owner_approved`) | ❌ **Owner** | NO on all 264 shipped images until the owner decides A, B and D below |
| Name "Vaultwake Merge" | ❌ **Owner** | Web searches only; no trademark-office search |
| Developer/publisher identity | ❌ **Owner** | Name and contact e-mail |
| Real devices | ❌ **Owner/tester** | No iPhone or Android test yet; first-tap sound on iOS unconfirmed |
| CrazyGames submission | ❌ **Owner** | Upload in the developer portal after the above; acceptance is CrazyGames' decision |

## Exact owner actions

| # | Action | Why |
|---|---|---|
| A | Decide on the **85 images with no master or generation record** (39 board icons, 21 beach places, 25 Observatory images). Either add the original sheets to `docs/art-source/`, or accept in writing that their origin rests on your statement and their per-image tool is unverified. | Material licensing gap: no independent record |
| B | Accept that AI output is **not exclusive** and that its **copyright protection is uncertain** in Mongolia and elsewhere, or take legal advice first. | Both providers' terms; not assessed by law |
| C | ~~Confirm the four crew portraits are not likenesses of real people~~ | **Closed 2026-11-08**: owner confirms Ivo, Bram, Neri and Tamsin are fully AI-invented fictional characters (statement 8 in `evidence/owner-confirmation-2026-11-08.md`) |
| D | Read OpenAI's **Sharing & Publication Policy** once (it could not be loaded here), or accept the risk. | Unchecked policy |
| E | When A, B and D are settled, set **`owner_approved=YES`** (initials and date in `date_verified`) in `docs/release/VAULTWAKE_ART_RIGHTS_REGISTER.csv`. Optionally keep a dated screenshot of each subscription with the records. | Only the owner approves |
| F | Run a **trademark search** for "Vaultwake Merge" (USPTO, EUIPO, WIPO, Intellectual Property Office of Mongolia; classes 9 and 41), or accept the name risk in writing. | Name clearance |
| G | Give the **developer/publisher name and contact e-mail** for `METADATA.md` and the portal. | Portal fields |
| H | **Test on real phones**: iPhone (Safari) and Android, about 10 minutes each: merge, deliver, build, reload, and sound after the first tap. | No human device test yet |
| I | **Upload** the ZIP, covers, videos and text in the CrazyGames developer portal. | Submission is the owner's act |

When A, B and D–H are done, the same ZIP can be uploaded unchanged: its SHA-256 is in `SHA256SUMS`, and CI
proves it is the reproducible build of `e72b4bb`. A change to any art means a new build and a new
checksum.
