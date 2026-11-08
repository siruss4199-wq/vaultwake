# Vaultwake Merge: release readiness and outstanding approvals

**Decision today: NO-GO for upload.** The package and its art are ready: commercial use of the shipped artwork was approved by the owner on 2026-11-08. Still outstanding:
- the OpenAI Sharing & Publication Policy check (D);
- the three blocked trademark searches and the owner's name decision (F);
- developer/publisher details (G);
- the real-phone test (H);
- portal submission (I).

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
| CI | ✅ | 12/12 on `473340f` (2026-11-08, first run) and on `6d5af0e`, the last commit that touched the package. Three earlier docs-only commits each had one WebKit timing failure that passed on its single re-run |
| Saves, economy, energy, progression | ✅ Unchanged | No game code changed since `fd76b03` apart from the title and menu text |
| Covers (3) and videos (2) | ✅ Technically | Sizes, durations and silence checked in CI; made from the game's own art |
| Store text | ✅ Ready to paste | `METADATA.md` checked against the ZIP; includes the AI-art disclosure and credits line. Developer/publisher name, e-mail and release date are **[OWNER]** placeholders |
| Art origin and accounts | ✅ Owner-confirmed | ChatGPT Plus and Claude Pro, personal accounts, Mongolia, Oct–Nov 2026. Not independently verified |
| Provider terms | ✅ Checked | OpenAI Terms of Use + Service Terms; Anthropic Consumer Terms. Commercial use permitted, output assigned to the user, no exclusivity (`RIGHTS_REPORT.md` §2) |
| Art approval (`owner_approved`) | ✅ **Owner-approved** | YES for the 264 shipped images, dated 2026-11-08, supported by the owner declaration; 86 non-shipped register rows remain NO. Approval is owner attestation, not independent third-party clearance. |
| Name "Vaultwake Merge" | ⚠️ **Partly searched** | USPTO and EUIPO searched 2026-11-08: no VAULTWAKE or VAULT + WAKE mark. WIPO Global Brand Database, TMview and the Mongolian register blocked automated access, so the owner must search those. Owner keep/change/file decision pending (`evidence/name-decision-2026-11-08.md`) |
| Developer/publisher identity | ✅ **Owner-provided** | Developer and publisher: Vaultwake Merge; contact: siruss4199@gmail.com. Name use remains conditional on trademark review. |
| Real devices | ❌ **Owner/tester** | No iPhone or Android test yet; first-tap sound on iOS unconfirmed. Checklist and record: `DEVICE_QA.md` |
| CrazyGames submission | ❌ **Owner** | Upload in the developer portal after the above; acceptance is CrazyGames' decision |

## Exact owner actions

| # | Action | Why |
|---|---|---|
| A | ~~Decide on the 85 images with no master or generation record~~ | **Accepted 2026-11-08** in the owner's declaration (`evidence/owner-declaration-2026-11-08.md`): origin from the same workflow, per-image tool unverifiable, documentation gap accepted |
| B | ~~Accept non-exclusivity and uncertain copyright protection~~ | **Acknowledged 2026-11-08** in the owner's declaration |
| C | ~~Confirm the four crew portraits are not likenesses of real people~~ | **Closed 2026-11-08**: owner confirms Ivo, Bram, Neri and Tamsin are fully AI-invented fictional characters (statement 8 in `evidence/owner-confirmation-2026-11-08.md`) |
| D | Open https://openai.com/policies/sharing-publication-policy/ in your browser. Check that it adds nothing for **images** beyond the review in `evidence/openai-sharing-publication-policy-2026-11-08.md`. Then write "read" (or "risk accepted") and the date here. | The live page is behind a Cloudflare check that blocked the session. The review is from search-engine copies of the page: attribute the work to yourself, disclose AI use, and don't present the art as human-made. Recommended credits are already in `METADATA.md` |
| E | ~~Complete owner artwork approval~~ **Completed 2026-11-08.** Declaration explicitly approves commercial use of all 264 shipped images, with GitHub handle/date as owner identifier; rights register and release inventory show YES. | This is owner approval, not an independent guarantee of third-party rights. |
| F | Owner chose 2026-11-08 to search before submission. **USPTO ✅ and EUIPO ✅ were done 2026-11-08 with no conflict.** Run the three blocked searches yourself: WIPO Global Brand Database, TMview and the Mongolian register at https://ipom.mn.publish.wipo.net/. Steps are in `evidence/name-decision-2026-11-08.md`, about 15 minutes. Then write keep / change / file and the date. | Upload waits for the searches and the decision |
| G | ~~Provide developer/publisher and contact details~~ **Completed:** Vaultwake Merge / Vaultwake Merge / siruss4199@gmail.com, recorded in `METADATA.md`. | Name subject to the outstanding trademark review; release date still to be chosen. |
| H | **Test on real phones** with `DEVICE_QA.md`: iPhone Safari and Android Chrome, about 10 minutes each, 15 steps. Fill in its record. | No human device test yet |
| I | **Upload** the ZIP, covers, videos and text in the CrazyGames developer portal. | Submission is the owner's act |

When D–H are done, the same ZIP can be uploaded unchanged: its SHA-256 is in `SHA256SUMS`, and CI
proves it is the reproducible build of `e72b4bb`. A change to any art means a new build and a new
checksum.
