# Vaultwake Merge: rights and brand report (Basic Launch package)

**Status: NOT CLEARED.** This is an engineering audit of what ships and where it came from. It is not
legal advice and approves nothing. No asset in the build has the owner's written confirmation of
commercial rights: `owner_approved` is `NO` on all 311 shipped images in
`docs/release/VAULTWAKE_ART_RIGHTS_REGISTER.csv`. The name has not been searched in any trademark
office. Commercial upload is blocked until the owner completes section 6.

Package: `vaultwake-merge-crazygames-basic-76526ad.zip` (source commit `76526ad`; SHA-256 in `SHA256SUMS`).
Per-file detail: `ASSET_INVENTORY.csv` (path, bytes, use in this release, reported provenance, clearance status, owner_approved).

## 1. What ships

The ZIP holds 380 files:
- 311 images (WebP, plus one SVG)
- the game's JavaScript, CSS and HTML
- `v4/platform.mjs`

There are no font files: the game uses system fonts (`system-ui`, `Georgia`). There are no audio files: sounds are synthesised in the browser with WebAudio (`v5/next/sfx.mjs`). The only external request is the CrazyGames SDK (`https://sdk.crazygames.com/crazygames-sdk-v3.js`).

**How "used" was decided.** 261 of the 311 images are used, established in two ways:
- **Browser crawl (144 files).** A crawl in Chromium at 390×844 and 1280×720 recorded every image requested. It covered a new camp (Home, story and board), then a start, middle and end camp for each of the eight areas, opening the map, book, shop and menu each time.
- **Enumeration from game data (117 more).** Each place's stage pictures, each chapter's story pictures, each area's maps, and every board item's icon (`draw()` for every chain and tier).

The other 50 images (1.24 MB) are never loaded by Vaultwake Merge, and they stay in the ZIP:
- 24 are referenced only by Classic V5 modules that the Coast game imports for shared code.
- 22 are older versions kept beside the art the game now draws.
- 4 have no reference at all.

Removing them is listed as an owner decision in `OUTSTANDING_APPROVALS.md`. It would take them out of the rights question entirely.

## 2. Provenance of the 261 used images

| Reported provenance (from the register) | Files | Size | Register status | What the owner must confirm |
|---|---:|---:|---|---|
| Project source-pack master with JSON manifest (chapter maps, places, story scenes) | 108 | 8.20 MB | REVIEW | who made the masters (person or tool), and the licence terms of any tool used |
| Project art-source masters: coastal UI, Home, story (`docs/art-source/coastal-*`) | 22 | 1.92 MB | REVIEW | the same; these include the Home picture and logo used on the covers |
| Project WebGL render / in-project generated | 38 | 0.84 MB | REVIEW | that no third-party model, texture or reference was used |
| Original project AI-generated / rendered artwork | 14 | 1.23 MB | REVIEW | which AI tool, the account and plan used, and that its terms allow commercial use and sublicensing to a platform |
| **User-provided painted icon sheet** (the board's parts, generators, crates, tokens) | **57** | 0.72 MB | **HOLD** | **the original artist and the right to use and sublicense commercially** |
| **User-provided painted coastal sheet** (HUD, cells, order cards, and one derived map) | **22** | 0.87 MB | **HOLD** | **the same** |

The two HOLD groups, 79 files, are the core of the game's look: every item on the board and the HUD.
If their origin cannot be shown, they need to be redrawn before a commercial release. That is a
large art job, briefed in section 5.

Being AI-generated is not treated as cleared here. Each AI tool's terms differ; some depend on the paid plan, and some restrict trademarks, likenesses or "in the style of" prompts. No prompt logs or account records are in the repository.

The logo changed in this release: the subtitle "COAST CAMP" became "MERGE". The new subtitle is set in Liberation Serif Bold (SIL Open Font License 1.1, from Debian `fonts-liberation` 2.1.5), and the OFL permits embedding text rendered in the font in a commercial image. The painted "VAULTWAKE" word, sun and wave are unchanged. They are covered by the logo master's row, which is REVIEW, not approved. The tool is `tools/brand-logo-merge.py`.

## 3. Name and brand check: "Vaultwake Merge"

Search date: 2026-11-08. These were web searches only; no trademark office was searched.

| Search | Result |
|---|---|
| "Vaultwake" as a game | No game found with this name on the web, Steam or the app stores in the searches run. |
| "Vaultwake" in software | A GitHub project `miller-joe/vaultwake` (Vault-related software, not a game; noted in `docs/release/VAULTWAKE_MERGE_RIGHTS_BRAND_AUDIT.md`). Different class of goods, but the owner should see it. |
| Similar game names | *Battlewake* (Survios, VR naval game; [UploadVR](https://uploadvr.com/naval-combat-vr-game-battlewake-now-available/)). *Merge Ghost – Ghost Vault* ([LDPlayer](https://www.ldplayer.net/games/merge-ghost-on-pc.html)). A "Vault" merge app listing ([AppGoblin](https://appgoblin.info/apps/com.vaultomb)). *Vault Merge Coin Stacker* (noted in the earlier audit). |
| "MERGE …" marks in games | Metacore Games Oy holds marks such as MERGE MANSION and MERGE VIKINGS ([trademarkdir](https://trademarkdir.com/owner/metacore-games-oy), [markinton](https://markinton.com/company/metacore-games-oy)). There are several US filings for "MERGE" word marks ([Justia 98779725](https://trademarks.justia.com/987/79/merge-98779725.html), [Justia 98894637](https://trademarks.justia.com/988/94/merge-98894637.html)). "Merge" is a generic genre word, but a "MERGE + word" mark owner may object to close imitation. |
| Trademark filings for "Vaultwake" | None found in the web results. USPTO, EUIPO, WIPO Global Brand Database, UKIPO and the owner's own country's office were **not** searched. |

There is no evidence of a conflict, but **that is not clearance.** The owner should run (or have counsel run) searches in USPTO, EUIPO, WIPO and their home office in classes 9 and 41, and check the domain and social handles, before relying on the name.

Other brand content found in the game:
- No third-party brands, logos or characters appear.
- Crew names (Ivo, Bram, Neri) and place names are original to the project.
- The CrazyGames name appears only in the SDK script URL. The page shows no platform logo.

## 4. Covers and videos made for this release

| File | Made from | Rights status |
|---|---|---|
| `covers/cover-landscape-1920x1080.png` | Home picture `coast/home/home-bg.webp` at 1:1 plus a blurred copy of its sky and sea, the Vaultwake Merge logo, and shell icons `coast/icons/shell-3..5.webp` | Inherits REVIEW (Home picture, logo) and **HOLD** (shell icons: painted icon sheet) |
| `covers/cover-portrait-800x1200.png` | Same sources | Same |
| `covers/cover-square-800x800.png` | Home picture and logo | REVIEW |
| `videos/…landscape-1920x1080.mp4` and `…portrait-1080x1620.mp4` | Opening frame from the covers; then a real recording of the release ZIP played in Chromium (`tools/release-gameplay-video.cjs`) | Inherits everything shown on screen: REVIEW and **HOLD** |

Every cover and video is built only from game art: there is no stock imagery, no third-party
logos, no platform badges and no text other than the title. Scripts: `tools/release-covers.py`,
`tools/release-video-assemble.py`.

## 5. If art cannot be cleared: replacement brief

If the owner cannot document rights for a group, it needs new art made under a written commercial
licence: work-for-hire or an assignment from a named artist, or an AI tool whose terms grant
commercial use, with the account and date recorded. Each replacement must keep the current file
names and sizes so no code changes.

- **Board icons (57 files, 192×192 WebP, transparent background).**
  - Content: seven generator chains of 5 to 8 steps each, plus the generators, crates, cargo, Tide token and brass cog.
  - Style: chunky painted 3D-look objects with soft top-left light. Each step must be clearly bigger or richer than the last, and the silhouettes must be readable at 48 px.
  - Names: the item names in `v5/next/chains.mjs` and `v5/core.mjs` (`FAMILIES`).
- **Coastal UI (22 files).**
  - Content: HUD pills, board cell, order card frame, deliver button, ice overlays and the coast background.
  - Style: bright teal sea and cream paper.
  - Sizes: keep each file's pixel size and its border-image slice positions (`v5/next/coastal.css`).
- **Key art for covers.**
  - Content: one painted scene of a cliff with a round ancient Vault door above a beach camp, sunny lagoon and palms.
  - Size: at least 3840×2160 so all three crops stay sharp.
  - Text: the title is added separately.

## 6. Owner actions (in order)

1. For each provenance group in section 2, put the evidence in the register's `evidence_link` column and set `owner_approved=YES` row by row:
   - who made it;
   - the tool and account if AI was used;
   - the licence or terms, with a date.
2. For the 79 HOLD files, name the original artist of the painted sheets and show the right to sublicense, or commission replacements (section 5).
3. Run formal trademark searches for "Vaultwake" and "Vaultwake Merge" (section 3), and decide whether to file.
4. Fill in the developer/publisher and credits fields in `METADATA.md`, including any attribution the art or AI licences require.
5. Decide whether to drop the 50 unused images from the ZIP (section 1).
