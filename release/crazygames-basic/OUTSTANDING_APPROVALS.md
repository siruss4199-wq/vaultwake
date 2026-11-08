# Vaultwake Merge: outstanding approvals before upload

**Decision today: NO-GO for commercial upload.** The package is technically ready (`CHECKLIST.md`).
What blocks it is ownership evidence and owner decisions, which no amount of engineering can supply.
Nothing has been submitted to CrazyGames, published or merged.

| # | Blocker | Severity | Owner action | Where |
|---|---|---|---|---|
| 1 | No shipped image has documented commercial rights (`owner_approved=NO` on all 264) | **P0** | For each provenance group, add evidence and set `owner_approved=YES`. Evidence means who made it; for AI art, the tool, account or plan, and the licence terms with a date. | `docs/release/VAULTWAKE_ART_RIGHTS_REGISTER.csv`, `RIGHTS_REPORT.md` §2 |
| 2 | 82 used images come from user-provided painted sheets of unknown origin (HOLD): every board item and the HUD | **P0** | Name the original artist and show the right to use and sublicense commercially, or commission replacements from the brief | `RIGHTS_REPORT.md` §2, §5 |
| 3 | Covers and videos are made from the art in rows 1–2 | **P0** (follows 1–2) | Approve them once the source art is cleared, or have them remade from cleared art with `tools/release-covers.py` and `tools/release-gameplay-video.cjs` | `covers/`, `videos/` |
| 4 | The name "Vaultwake Merge" has had web searches only | **P1** | Run formal searches in USPTO, EUIPO, WIPO and the home office (classes 9 and 41), decide on filing, and check the domain and social handles | `RIGHTS_REPORT.md` §3 |
| 5 | Developer and publisher identity, contact e-mail, credits, age rating and release date | **P1** | Fill in the **OWNER** fields | `METADATA.md` |
| 6 | No human test on a real iPhone or Android phone; iOS audio unlock (first `pointerdown`) not confirmed | **P1** | Play the ZIP on an iPhone (Safari) and an Android phone for 10 minutes: merge, deliver, build, reload. Check that sound plays after the first tap. | `CHECKLIST.md`, "Layout, input, browsers" |
| 7 | WebKit and Firefox results for this exact head | **P1** | Confirm the PR's CI checks are green: "Build, unpack and play release ZIP" and the Coast chapter suites | PR checks |
| 8 | ~~47 images shipped but were never loaded~~ | done | Left out of the ZIP on 2026-11-08 at your request (`tools/coast-crazygames-unused.txt`) | `RIGHTS_REPORT.md` §1 |
| 9 | Portal acceptance | — | Upload only after 1–7. CrazyGames' QA decides acceptance; it is not claimed here. | CrazyGames developer portal |

When rows 1–7 are closed, the same ZIP can be uploaded unchanged: its SHA-256 is in `SHA256SUMS`, and CI
proves that it is the reproducible build of `e72b4bb`. A change to any art means a new build and a new
checksum.
