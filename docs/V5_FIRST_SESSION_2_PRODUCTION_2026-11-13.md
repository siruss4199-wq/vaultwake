# Vaultwake Merge: First Session 2.0 in production (2026-11-13)

**Status: DRAFT, not released.** This work is not merged, not packaged and not uploaded. The live CrazyGames build is untouched.

**Branch:** `claude/v5-first-session-2-production`, started from `822a8f9`.

**Design references (approved):**
- `docs/V5_FIRST_SESSION_2_PROTOTYPE_2026-11-12.md`
- `docs/V5_TUTORIAL_2_PROTOTYPE_2026-11-13.md`
- prototype `b7f4220` on `claude/v5-first-session-prototype`

The prototype branch is used as a reference only. It is not merged.

## 0. Baseline and the live build (identity UNVERIFIED)

| | Commit | ZIP SHA-256 | What is known |
|---|---|---|---|
| **Development baseline** | `822a8f9d85f209fd389ccee3a92b0b710b943251` (Build 57y, 2026-11-11) | `b160a59a9f0ac9ff78fe968b638433ea104bf7fde6363667528d4365e067e890` (`vaultwake-merge-crazygames-basic-822a8f9.zip`, built and tested by `.github/workflows/v5-basic-zip-822a8f9.yml` on `claude/v5-order-details-sheet`) | The owner reports uploading an updated ZIP on 2026-11-12. CrazyGames auto-approved it and it went **live**. It is expected to be this build. **The match between this ZIP and the CrazyGames build ID has not been verified** (no checksum from CrazyGames). It is recorded as *expected*, not confirmed. |
| Previous live build | `664956e` | `14ed8d0d5a741507201e594d4099b05814f3d9d1a89982121647342f9873db7d` (`release/crazygames-basic/`) | The Basic Launch submission of 2026-11-09, live from 2026-11-11 (`release/crazygames-basic/OUTSTANDING_APPROVALS.md`). `822a8f9` contains it (15 commits later). |

**Build 57y fixes kept, because the branch starts at `822a8f9`:**
- `ca977f3`: the order details bottom sheet on phones, and the Build workflow protected;
- `3974b75`: a tap never dies on a CrazyGames SDK that is not ready;
- `5b5d006`: a tap repaints only what changed (iPhone flicker);
- `822a8f9`: the sticky coast ×.

PR #103's later commits (`bf24160` to `f9da3ff`) change only CI and `tools/ci-*` helpers. The two helpers this branch's CI needs (`tools/ci-static-server.mjs`, `tools/ci-unzip.mjs`) are copied in unchanged.

**Not touched:**
- `release/crazygames-basic/` and its ZIP;
- `v4/`, `v5/lab/`;
- the rules and economy in `v5/next/game.mjs`;
- the save keys and formats.

**Historical CrazyGames Basic Launch metrics (owner-provided).** These are benchmarks, not predictions:
- average playtime 3m36s;
- 1+ minute conversion 21.91%;
- 10+ minute funnel 4.12%;
- D1 retention 0%;
- Basic Launch score 3/15.
