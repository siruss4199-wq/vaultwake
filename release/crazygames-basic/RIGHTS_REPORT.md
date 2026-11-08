# Vaultwake Merge: rights and brand report (Basic Launch package)

**Status: origin owner-confirmed; commercial permission not yet evidenced. Not cleared.**

This is an engineering audit of what ships and where it came from. It is not legal advice and it approves nothing.

- **Origin.** On 2026-11-08 the owner confirmed that all artwork was generated with AI for this project, and that none of it came from external artists or stock libraries. That statement is recorded on all 264 shipped images in `docs/release/VAULTWAKE_ART_RIGHTS_REGISTER.csv`.
- **Permission.** No shipped image yet has documented commercial-use permission. Nothing in the repository records which AI service, account or plan made the art, or when. `owner_approved` therefore stays `NO` on every row.
- **Name.** The name has not been searched in any trademark office.

Section 6 lists exactly what the owner still has to supply.

Package: `vaultwake-merge-crazygames-basic-e72b4bb.zip` (source commit `e72b4bb`; SHA-256 in `SHA256SUMS`).
Per-file detail: `ASSET_INVENTORY.csv` (path, bytes, use in this release, reported provenance, clearance status, owner_approved).

## 1. What ships

The ZIP holds 333 files:
- 264 images (WebP, plus one SVG), every one of them used by the game
- the game's JavaScript, CSS and HTML
- `v4/platform.mjs`

There are no font files: the game uses system fonts (`system-ui`, `Georgia`). There are no audio files: sounds are synthesised in the browser with WebAudio (`v5/next/sfx.mjs`). The only external request is the CrazyGames SDK (`https://sdk.crazygames.com/crazygames-sdk-v3.js`).

**How "used" was decided.** Each of the 264 images is used, established in three ways:
- **Browser crawl (144 files).** A crawl in Chromium at 390×844 and 1280×720 recorded every image requested. It covered a new camp (Home, story and board), then a start, middle and end camp for each of the eight areas, opening the map, book, shop and menu each time.
- **Enumeration from game data (117 more).** Each place's stage pictures, each chapter's story pictures, each area's maps, and every board item's icon (`draw()` for every chain and tier).
- **Second enumeration (3 more).** Every crate size, cargo look, token and cog. This found three crate and cargo icons the first pass had wrongly marked unused: `coast/icons/driftwood-crate.webp`, `captains-trunk.webp` and `cargo-basket.webp`. `tests/v5-next-crazygames-unused.test.mjs` now checks this on every test run.

**Left out of the ZIP (2026-11-08, at the owner's request).** 47 images (1.20 MB) that Vaultwake Merge never loads are no longer shipped. They are listed in `tools/coast-crazygames-unused.txt`:
- 25 are used only by Classic V5.
- 18 are older versions kept beside the art the game now draws.
- 4 have no reference at all.

8 of them were on HOLD, so they are now out of the rights question for this release. They stay in the repository, because Classic V5 (`v5/index.html`) still uses some of them. The check that nothing broke with them gone is in `evidence/unused-images-removed.md`.

## 2. Provenance of the 264 used images

**Two separate questions.** These are kept apart throughout this report:
1. **Origin:** where each image came from. The owner has confirmed AI generation for all of them; the repository's own records add masters, prompts or code for many.
2. **Permission:** what licence or terms let the owner use the image commercially and pass it to a platform such as CrazyGames.

| Group | Files | Size | How it was made (`origin_class`) | Record in this repository (`source_record`) |
|---|---:|---:|---|---|
| Chapter 3–6 maps, places, story pictures and area strips | 112 | 8.74 MB | AI-generated masters, cut and exported by `tools/harbour-art.py`, `headland-art.py`, `lowwater-art.py`, `keeper-art.py` | Masters in `docs/art-source/*-2026-11-0*/`. Chapter 3: handoff note "generated with the built-in image tool". Chapter 4: manifest with SHA-256 per master. Chapters 5–6: `prompts.json` with the prompt for each image. |
| Home picture, button, logo, Vault door crops, opening story | 8 | 1.89 MB | AI-generated masters, exported or cropped. Logo subtitle redrawn by `tools/brand-logo-merge.py`. | Masters in `docs/art-source/coastal-home-2026-10-28/` and `coastal-story-2026-10-28/` |
| Coastal UI: HUD, cell, order card, deliver button, crew faces, ice, sea background | 16 | 0.25 MB | AI-generated masters, exported | Masters in `docs/art-source/coastal-ui-2026-10-25/` |
| Board icons with their own masters: v2 tools, v2 cargo, pilot rover and bundle, Bolt…Hand-crank, Note…Logbook | 14 | 0.18 MB | AI-generated masters, framed and exported | Masters in `docs/art-source/coastal-{tools,crate,pilot}-*`, `rover-secondary-*`, `kite-secondary-*` |
| Chapter 1–2 parts and scenes: Copper offcut, Pocket winch, Route fold, landing and worksite panoramas, workshop | 6 | 0.35 MB | AI-generated, used as generated (resized only) | Prompts recorded in `v5/assets/premium/VIBRANT-SLICE.md`, `README.md`, `BOARD-COHESION.md`, `CHAPTER-ART.md`, `WORKSHOP-ART.md` ("built-in image tool"). No archival master. |
| Landing Beach map with the Vault | 1 | 0.26 MB | Owner-supplied AI map, Vault painted in by `tools/paint-landing-vault.py` | Original map in git history (`b8c5246:v5/assets/premium/landing-map.webp`) |
| Worksite place stages; Rivet Rover SVG | 22 | 0.30 MB | **In-project renders**: WebGL ray-marched scenes (`coast/render-places.html`) and vector code. No image generator. | Source code in the repository |
| **Board icons cut from the owner's icon sheet**: generators, Fieldworks 4–7, charts, rope, shell, lamp, cargo basket, crates, token, cog | **39** | 0.50 MB | AI-generated sheet (owner statement), cut out in the project (build 41l) | **No master or generation record.** The sheet itself is not in the repository. |
| **Beach places cut from the owner's beach sheet**: path, tent, mast, workshop, pier, beacon, cliff × 3 stages | **21** | 0.61 MB | AI-generated sheet (owner statement), cut out in the project (build 41n) | **No master or generation record.** The sheet is not in the repository. |
| **Observatory art from PR #80**: 15 place stages, map, strip, 7 optics icons, harbour view | **25** | 0.75 MB | AI-generated (owner statement) | **No master or generation record** in this repository |

Totals:
- 242 images are AI-generated and 22 are in-project renders.
- 179 have a master, prompt record, git-history original or source code in the repository.
- **85 rest on the owner's statement alone**: the 39 icons, 21 beach places and 25 Observatory images above.

**The 82 images previously on HOLD.** These are the 60 board icons, the 21 beach places and the Landing Beach map. They were flagged as "user-provided painted sheets, artist unknown". On the owner's statement they are now recorded as AI-generated for this project, not the work of an outside artist.
- 15 of them trace to a master in the repository or its history: the 14 board icons with their own masters, and the map.
- The other 67 do not: 39 icons cut from the icon sheet, 21 beach places, and the 7 optics icons from PR #80.

**Tool record.** The repository says "built-in image tool / imagegen". The 2026-10-23 art brief names "ChatGPT image generation". The earlier audit names ChatGPT for the 2026-11-04 key art, which is not in the game. No record names the account, plan or exact dates. Folder dates (2026-10-25 to 2026-11-02) give only the import date.

**Logo.** The logo changed in this release: the subtitle "COAST CAMP" became "MERGE".
- The new subtitle is set in Liberation Serif Bold (SIL Open Font License 1.1, from Debian `fonts-liberation` 2.1.5). The OFL permits embedding text rendered in the font in a commercial image.
- The painted "VAULTWAKE" word, sun and wave are unchanged; they come from the logo master.

### Commercial-use terms checked (official source, read 2026-11-08)

The repository's notes point to OpenAI's ChatGPT image tool, but the owner has not yet confirmed the tool or account. The terms below apply **only if** the art was made there.

- **OpenAI Terms of Use** (individual ChatGPT and DALL·E users outside the EEA, Switzerland and the UK; effective 1 January 2026; https://openai.com/policies/row-terms-of-use/). Quoted:
  - *"As between you and OpenAI, and to the extent permitted by applicable law, you (a) retain your ownership rights in Input and (b) own the Output. We hereby assign to you all our right, title, and interest, if any, in and to Output."*
  - *"output may not be unique and other users may receive similar output from our Services. Our assignment above does not extend to other users' output."*
  - Among the things users may not do: *"Represent that Output was human-generated when it was not."*
- **OpenAI Business Terms** (ChatGPT Business/Enterprise, API; effective 1 January 2026; https://openai.com/policies/business-terms/). §4.1: Customer *"owns all Output. OpenAI hereby assigns to Customer all OpenAI's right, title, and interest, if any"*. §4.4: Output may not be unique.
- **Residents of the EEA, Switzerland or the UK** are covered by OpenAI's separate EU terms. That page could not be loaded from this environment, so it has not been checked.

**What these terms mean here, in engineering terms (not legal advice):**
- Neither agreement forbids commercial use of Output or passing it to a game platform. Each assigns OpenAI's interest in the Output to the user.
- Neither grants exclusivity: someone else may receive similar images.
- Ownership "to the extent permitted by applicable law" does not mean the images are protected by copyright. Whether purely AI-generated images can be copyrighted depends on the country.
- The store text must not describe the art as hand-made. `METADATA.md` does not.
- **None of this applies until the owner confirms the tool and the account the art was made on.**

**CrazyGames.** Its requirements pages have no rule against AI-generated art. The covers page says: *"Don't use copyrighted visuals that you don't have the right to use."*

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

| File | Made from | Origin record |
|---|---|---|
| `covers/cover-landscape-1920x1080.png` | Home picture `coast/home/home-bg.webp` at 1:1, plus a blurred copy of its sky and sea, the Vaultwake Merge logo, and shell icons `coast/icons/shell-3..5.webp` | Home picture and logo: master in repo. Shell icons: icon sheet, owner statement only. |
| `covers/cover-portrait-800x1200.png` | Same sources | Same |
| `covers/cover-square-800x800.png` | Home picture and logo | Master in repo |
| `videos/…landscape-1920x1080.mp4` and `…portrait-1080x1620.mp4` | Opening frame from the covers, then a real recording of the release ZIP played in Chromium (`tools/release-gameplay-video.cjs`) | Everything shown on screen, so board icons with the owner statement only |

Every cover and video is built only from game art. There is no stock imagery, no third-party logo, no
platform badge and no text other than the title. Scripts: `tools/release-covers.py`,
`tools/release-video-assemble.py`. The media were not regenerated for this update.

## 5. Fallback only: replacement brief

This is needed only if the owner cannot document commercial permission for a group. Replacements must be made under terms the owner keeps on record (tool, account and date), and must keep the current file names and sizes so no code changes.

- **Board icons (60 files, 192×192 WebP, transparent background).**
  - Content: chunky painted 3D-look objects with soft top-left light, readable at 48 px.
  - Names: `v5/next/chains.mjs` and `v5/core.mjs` (`FAMILIES`).
- **Beach places (21 files).**
  - Content: three stages of each of the seven Landing Beach places, on one shared canvas with the ground at (50 %, 90 %).
- **Observatory (25 files).**
  - Content: five places × 3 stages, the map and strip, six optics parts and the Lens Bench.

## 6. Owner actions (exact evidence still needed)

1. **Tool and account.** Name the AI service or services that made the art (for example ChatGPT image generation), the account type (Free, Plus, Pro, Team/Business, Enterprise or API) and its holder, and the country of residence, which decides which OpenAI terms apply.
2. **Dates.** Give the approximate generation period. The repository shows imports from 2026-10-12 to 2026-11-02.
3. **The 85 images with no record in the repository**: the icon sheet (39), the beach sheet (21) and the PR #80 Observatory art (25).
   - Add the original sheet or image files to `docs/art-source/`, or a screenshot or export of the chat or history that produced them.
   - Alternatively, state in writing that they were made on the same tool and account as item 1.
4. **Approve.** When 1–3 are recorded, put the evidence (file or link) in `evidence_link` and set `owner_approved=YES` in `docs/release/VAULTWAKE_ART_RIGHTS_REGISTER.csv`, group by group. Only the owner should do this.
5. **Name.** Run formal trademark searches for "Vaultwake" and "Vaultwake Merge" (section 3), and decide whether to file.
6. **Store fields.** Fill in the developer/publisher fields in `METADATA.md`. Do not describe the art as hand-painted or human-made.
