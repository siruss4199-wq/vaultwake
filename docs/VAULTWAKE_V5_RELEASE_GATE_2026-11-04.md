# Vaultwake V5 — release candidate gates (2026-11-04)

Target: **CrazyGames Basic Launch first**, subject to commercial/platform decision. **No publish or merge authorization implied.** This gate applies to Coast Camp `v5/play.html`, not Classic Wispwood/V4/V5 or the unrelated `main/index.html`.

## Verified at start of gate
- Draft PR #93, `codex/v5-order-economy-recipe-fix`, includes Gold/Crew rare-recipe and coin-loop changes; #91/#92/#93 are open draft PRs, not merged.
- At `32d6126987a914aaab3bbee2f352423d6dc8f46e`, rule tests 432/432 pass (run 41675632008); five focused browser suites pass in Chromium/WebKit (run 41675632225): opening guide, first Gear Gold order, rare UI, save recovery, CrazyGames Basic SDK stub.
- All test assertions measure programmed behavior; real-player fun and device audio/haptics remain unverified.
- The release is built with `node tools/coast-crazygames.mjs --zip`, which writes `dist/vaultwake-coast-crazygames.zip`. Generated artifacts must be based on the **exact release head**, not any earlier build.
- V5's SFX uses Web Audio synthesis and ships no music or sound recording files, according to `v5/next/sfx.mjs`. This does not clear art or title rights.

## Hard GO / NO-GO gates

| Gate | Evidence required | Status as of 2026-11-04 |
| --- | --- | --- |
| A. Source / branch | Release head identified; requested PR dependencies reconciled; no accidental release of Classic | OPEN — #91–#93 draft; `main` still serves Wispwood |
| B. Functional QA | Entire Coast chapter/phone suite passes on exact SHA, including Chapters 2–6 and persistence | RUNNING — `v5-release-chapters.yml` |
| C. Release ZIP | `--check`, ZIP generation, extraction, checksum, smoke tested **from extracted ZIP**, uploaded as Actions artifact | RUNNING — `v5-release-package.yml` |
| D. Human playtest | iPhone Safari and Android Chrome; fresh game and existing save; 20–30 min gameplay, UI and sounds, rare/coin pace | OPEN — no confirmed real-device signoff |
| E. Copyright / branding | Each final image and logo has provenance and commercial reuse permission; final name/domain/trademark clearance; title/metadata match | OPEN — generated and supplied art documented, but item-by-item approval and mark search missing |
| F. Platform submission | Approved English title/description/controls, landscape/square/portrait cover art, gameplay video and developer-account access | OPEN — submission package and human approvals missing |
| G. Third-party portal acceptance | Upload candidate and run portal-specific SDK and loading QA; obtain Basic Launch acceptance | OPEN — no external acceptance recorded |

## Gameplay acceptance to preserve
- Gold order recipe can require multiple ordinary crafted parts plus a merged rare part; rare never simply replaces another material.
- Crew orders are the meaningful source of coins for restorations, with measured absence of long energy/coin dead ends.
- Keep tutorial exactly once: generator, merge, crew delivery, Gold materials, Build.
- No lost saves, impossible recipes, wrong generator hints, duplicate coin payouts, board overflow, hidden action buttons.
- No new features or spontaneous difficulty increases during the release freeze.

## Recommended release actions
1. Let the chapter QA and packaged-ZIP CI finish. Fix **only confirmed red tests or release-blocking defects**; maintain run links and exact commit.
2. If package QA is green, obtain the GitHub Actions artifact `vaultwake-crazygames-QA-<sha>`; verify checksum; do not use an older ZIP.
3. Gather 5–10 real player sessions and one real iPhone / Android smoke test; record blocker bugs with reproduction and screenshots.
4. Review source art manifests and user-provided sprites against a rights ledger. Confirm the user-approved final game name (potentially **Vaultwake Merge**, currently public HTML says **Vaultwake — Coast Camp**) and commercial rights.
5. Prepare store cover assets and gameplay preview footage; confirm developer portal account and platform agreement.
6. Only after all P0 gates pass: approve exact release candidate and upload to CrazyGames QA portal. Leave Poki on a separate platform/integration track.

## GitHub evidence
- PR: https://github.com/siruss4199-wq/wispwood-game/pull/93
- Unit test: https://github.com/siruss4199-wq/wispwood-game/actions/runs/41675632008
- Initial mobile/browser QA: https://github.com/siruss4199-wq/wispwood-game/actions/runs/41675632225
- Chapter QA workflow: `.github/workflows/v5-release-chapters.yml`
- ZIP QA workflow: `.github/workflows/v5-release-package.yml`

**Decision at gate creation: NO-GO for public launch**, GO for completing release qualification and for a developer-only QA preview.
