# Vaultwake Merge: Playgama build (DRAFT)

Full reports:
- `docs/V5_PLAYGAMA_RELEASE_2026-11-25.md` (this round: audio, icons, dialogs, readiness)
- `docs/V5_PLAYGAMA_RELEASE_2026-11-24.md` (the Bridge integration)
- `docs/V5_PLAYGAMA_AI_ART_AUDIT_2026-11-25.md`

| | |
|---|---|
| ZIP | `vaultwake-merge-playgama-5087987.zip` (17,707,228 bytes, 352 files, `index.html` at the root) |
| SHA-256 | `f4c00bc3d7df8ca44283e1a1bbf1879c4146debfe5d623881b2c9bebe6211c6e` (`sha256sum -c SHA256SUMS`) |
| Rebuild | `git checkout 5087987 && node tools/coast-playgama.mjs` → `dist/vaultwake-merge-playgama.zip`, the same bytes |
| Playgama draft | game `cmwus3b7d09r6li0hl4k3c1th`; archive `cmwvpzgaq1qoeii0hsdc139pj` (build check PASSED, Bridge 2.4.4 found) |
| QA tool | https://developer.playgama.com/qa-tool/cmwvpzgaq1qoeii0hsdc139pj |
| Listing | `METADATA.md`; `covers/` (uploaded); `screenshots/` (current set uploaded) |
| Audio licences | `v5/assets/audio/LICENSES.md` (all CC0) |

## Owner's checklist before moderation

1. **AI art (rule 4.3.1):** send `SUPPORT_INQUIRY_AI_ART.md` to Playgama support (paste a fresh QA link from the console), or decide to accept the rejection risk.
2. **Screenshots:** in the console, delete the four board and coast screenshots from 2026-11-24, which show emoji icons. Their replacements are uploaded; the Home ones are unchanged.
3. **QA tool:** play the build at the link above (desktop, the preset sizes, 1:1) and complete the certification. Listen for the music and sound.
4. **Real phones:** iPhone Safari and Android Chrome:
   - the first tutorial to the first Build;
   - a reload (Continue);
   - "Ad +25" when energy is under 5;
   - minimise and come back (the music stops and resumes);
   - the Sound button.
5. **Decisions:**
   - legal D (OpenAI policy) and F (trademark and name);
   - the developer name "Sirus Games" in the console;
   - "Distribute everywhere";
   - the developer note (draft in `METADATA.md`).
6. **Only then, and only by you:** publish to the sandbox, then submit to moderation.
