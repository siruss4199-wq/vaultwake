# Vaultwake Merge: Playgama build (DRAFT)

The full report is in `docs/V5_PLAYGAMA_RELEASE_2026-11-24.md`.

| | |
|---|---|
| ZIP | `vaultwake-merge-playgama-b95d967.zip` (14,962,669 bytes, 329 files, `index.html` at the root) |
| SHA-256 | `84a07419fe2424605dc590445e800e0193dc3c32290b370ec3b6e563c284b86f` (`sha256sum -c SHA256SUMS`) |
| Rebuild | `git checkout b95d967 && node tools/coast-playgama.mjs` → `dist/vaultwake-merge-playgama.zip`, the same bytes |
| Playgama draft | game `cmwus3b7d09r6li0hl4k3c1th`, archive `cmwuwhibd0nuzii0hhsuks85w` (build check PASSED, Bridge 2.4.4 found) |
| QA tool | https://developer.playgama.com/qa-tool/cmwuwhibd0nuzii0hhsuks85w |
| Listing | `METADATA.md`; `covers/` (uploaded); `screenshots/` (uploaded) |

## Owner's checklist before moderation

1. **Sound (Playgama rules 3.3.1 and 3.3.2):** the game needs background music and recorded or produced sound effects as
   ogg or mp3 files whose rights you hold. Its current sounds are synthesised in code, which Playgama does not accept.
2. **QA tool:** play the build at the link above (desktop, the preset sizes, 1:1) and complete the certification.
3. **Real phones:** play on an iPhone (Safari) and an Android phone (Chrome):
   - the first tutorial to the first Build;
   - a reload (Continue);
   - a rewarded ad: energy under 5 → "▶ Ad +25";
   - minimise and come back.
4. **Decisions:**
   - the AI-art risk (rule 4.3.1);
   - legal items D (OpenAI policy) and F (trademark and name);
   - the developer name "Sirus Games" in the console;
   - "Distribute everywhere" (partner platforms);
   - the developer note text (draft in `METADATA.md`).
5. **Only then, and only by you:** publish to the sandbox, then submit to moderation in the console.
