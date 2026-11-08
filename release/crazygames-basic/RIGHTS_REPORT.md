# Vaultwake Merge: rights and brand report (Basic Launch package)

**Status: origin owner-confirmed; tool attribution partly evidenced; commercial permission not yet evidenced. Not cleared.**

This is an engineering audit of what ships and where it came from. It is not legal advice and it approves nothing.

**Owner statement (2026-11-08).**
- The artwork was made in October–November 2026, for this game only, with two tools: **ChatGPT Astra (OpenAI)** and **Claude Code (Anthropic)**.
- No stock art or outside artist's work was knowingly used.

This replaces the earlier assumption that every image came from ChatGPT's image tool.

**What the repositories show.**
- Git history of `siruss4199-wq/wispwood-game`, where this art was integrated before `vaultwake` was imported in one commit, plus the masters, generation notes and art scripts.
- Claude Code commits (author "Claude") **cut, cropped, composited and exported** most of the shipped images.
- Claude Code also **drew 21 pictures with code** (WebGL renders).
- The **painted images themselves** came into the Claude Code sessions from outside them. The repository notes say "This session has no image-generation tool" and "no image-generation tool was available, so these are real 3D renders made here".
- A few early images were generated with a "built-in image tool" in sessions committed as `siruss4199-wq`, not by Claude.
- No file names ChatGPT Astra, an account, a plan or exact dates.

**Approval.** `owner_approved` stays `NO` on all 264 shipped images in `docs/release/VAULTWAKE_ART_RIGHTS_REGISTER.csv`, because neither tool's account or plan is documented. The name has not been searched in any trademark office.

Section 6 lists exactly what is still needed.

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

## 2. Provenance of the 264 shipped images

Three questions, kept apart:
1. **Origin:** made for this project with ChatGPT Astra and Claude Code, per the owner. Recorded on every image.
2. **Which tool made each picture:** per-file columns `generation_method`, `generation_tool`, `processing_tool` and `tool_attribution` in the register and in `ASSET_INVENTORY.csv` (`tools/rights-classify.py`).
3. **Commercial permission:** the terms of each tool, which apply once the owner names the accounts used.

### By how the picture was made

| Group | Files | How the picture was made | Which tool, on what evidence | Record in the repository |
|---|---:|---|---|---|
| Worksite place stages (7 places × 3 stages) | 21 | **Programmatic render**: a WebGL ray-marched scene | **Claude Code. Evidenced**: commit `11fdee6` by Claude, and the render code `coast/render-places.html` | Source code |
| Rivet Rover (SVG) | 1 | **Programmatic**: vector geometry | Session committed as `siruss4199-wq` (`698fc78`, `4bbb067`), not Claude Code; ChatGPT Astra by owner statement | Source (SVG) |
| Chapter 3–6 maps, places, story pictures, strips | 112 | AI image generation (masters), then cut and exported | Masters supplied from outside Claude Code: the Ch3 handoff says "built-in image tool"; Ch5–6 have `prompts.json`. ChatGPT Astra by owner statement. **Processing: Claude Code** (`47cfa57`, `53ff263`, `56cd4ad`, `c4b3b6e`, `tools/*-art.py`) | Masters in `docs/art-source/` |
| Home picture, button, logo, Vault crops, opening story | 8 | AI image generation (masters), exported or cropped; logo subtitle redrawn by code | ChatGPT Astra by owner statement ("the supplied skin"). **Processing: Claude Code** (`f9dc476`, `6864900`, `56601dd`, `44952a9`; `tools/brand-logo-merge.py`) | Masters in repo |
| Coastal UI (HUD, cell, order card, crew faces, ice, background) | 16 | AI image generation (masters), exported | ChatGPT Astra by owner statement ("the supplied art"). **Processing: Claude Code** (`5b4a64e`, `758ec38`) | Masters in repo |
| Board icons with their own masters | 14 | AI image generation (masters), framed and exported | ChatGPT Astra by owner statement. **Processing: Claude Code** (`cf13035`, `1620bcc`, `97513c9`, `3cc4f86`, `e6b9a32`) | Masters in repo |
| Chapter 1–2 parts and scenes (Copper offcut, Pocket winch, Route fold, landing, worksite, workshop) | 6 | AI image generation, used as generated | "Built-in image tool" with prompts recorded, in sessions committed as `siruss4199-wq` (`698fc78`, `4bbb067`), not Claude Code; ChatGPT Astra by owner statement | Prompt notes |
| Landing Beach map with the Vault | 1 | AI-generated base map, Vault entrance painted in by code | Base map: **unverified** (owner statement). Vault edit: **Claude Code** (`tools/paint-landing-vault.py`, siruss4199-wq/vaultwake#97) | Original in git history (`b8c5246`) |
| **Board icons cut from the owner's icon sheet** | **39** | AI image generation (sheet), cut out | **Unverified**: "ChatGPT Astra or Claude Code" by owner statement. Cutting: Claude Code (`b4bf79f`) | **No sheet in repo** |
| **Beach places cut from the owner's beach sheet** | **21** | AI image generation (sheet), cut out | **Unverified**, as above. Cutting: Claude Code (`6b47b4d`) | **No sheet in repo** |
| **Observatory: places, map, strip, optics icons, harbour view** | **25** | AI image generation (concept sheets), cut out | **Unverified**, as above. Cutting: Claude Code (`f96d1de` "Art cut from the user's three concept sheets"; `a1eb517`, `7a769a2`) | **No sheets in repo** |

Totals:
- 242 images come from AI image generation and 22 are programmatic renders.
- Of the renders, 21 were made by Claude Code (evidenced), and 1 came from a non-Claude session.
- 150 trace to a master in the repository, 6 to prompt notes, 1 to an original in git history, and 22 to source code.
- **85 rest on the owner's statement alone, and their generating tool is unverified**: 39 icons, 21 beach places and 25 Observatory images. For these, only the cutting step (Claude Code) is shown by commits.
- The 82 images previously on HOLD (60 board icons, 21 beach places, the Landing Beach map) are recorded as owner-confirmed project art. 67 of them are among the 85 unverified.

**Generation period.** October–November 2026 (owner). Repository import dates run from 2026-10-12 to 2026-11-02.

**Logo.** The release's logo subtitle "MERGE" is set in Liberation Serif Bold (SIL Open Font License 1.1, Debian `fonts-liberation` 2.1.5). The OFL permits embedding text rendered in the font in a commercial image.

### Commercial-use terms, checked separately (official sources, read 2026-11-08)

**OpenAI (for ChatGPT Astra).** Which agreement applies depends on the owner's account and country.
- **Terms of Use** (individual ChatGPT and DALL·E users outside the EEA, Switzerland and the UK; effective 1 January 2026; https://openai.com/policies/row-terms-of-use/):
  - *"you (a) retain your ownership rights in Input and (b) own the Output. We hereby assign to you all our right, title, and interest, if any, in and to Output."*
  - *"output may not be unique and other users may receive similar output."*
  - Users may not *"Represent that Output was human-generated when it was not."*
- **Business Terms** (ChatGPT Business/Enterprise and API; effective 1 January 2026; https://openai.com/policies/business-terms/): §4.1 Customer *"owns all Output"* with an assignment; §4.4 Output may not be unique.
- **EEA, Switzerland and UK residents** are covered by OpenAI's EU terms, which could not be loaded from this environment.

**Anthropic (for Claude Code).** Which agreement applies depends on the owner's Claude plan.
- **Consumer Terms** (Claude Free, Pro and Max, including Claude Code on those plans; effective 8 October 2025; https://www.anthropic.com/legal/consumer-terms):
  - *"Subject to your compliance with our Terms, we assign to you all of our right, title, and interest—if any—in Outputs."*
  - Also: *"Use of our Services for evaluation purposes are for your personal, non-commercial use only."*
- **Commercial Terms** (API, Team and Enterprise; effective 17 June 2025; https://www.anthropic.com/legal/commercial-terms): Customer *"owns its Outputs"*, and *"Anthropic hereby assigns to Customer its right, title and interest (if any) in and to Outputs."*
- For Claude Code, the Output is mostly code (renders, cutting and compositing scripts), together with the images that code produced.

**What this means, in engineering terms (not legal advice):**
- Both providers assign their interest in Outputs to the user and neither forbids commercial use. Neither grants exclusivity.
- "To the extent permitted by applicable law" does not mean AI images are protected by copyright; that depends on the country.
- The store text must not present the art as human-made. `METADATA.md` does not.
- Claude Code use must not have been on an evaluation or trial offer, which the Consumer Terms limit to personal, non-commercial use.
- **Neither set of terms is tied to this art until the owner names the accounts.**

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

## 6. Remaining evidence and approvals

1. **ChatGPT Astra account:** plan (Free, Plus, Pro, Team/Business, Enterprise or API), account holder, and the country of residence, which decides the OpenAI terms.
2. **Claude Code account:** plan (Free, Pro, Max, Team, Enterprise or API) and account holder. Confirm it was not an evaluation or trial offer.
3. **The 85 images without records** (icon sheet 39, beach sheet 21, Observatory concept sheets 25). Either:
   - add the original sheets to `docs/art-source/`, or exports or screenshots of the chats that made them, so each one's tool is shown; or
   - accept and sign their attribution as "ChatGPT Astra or Claude Code, unverified".
4. **Approve:** with 1–3 recorded, put the evidence in `evidence_link` and set `owner_approved=YES` in `docs/release/VAULTWAKE_ART_RIGHTS_REGISTER.csv`. Only the owner should do this.
5. **Name:** run formal trademark searches for "Vaultwake Merge" (USPTO, EUIPO, WIPO, home office; classes 9 and 41), or accept the risk in writing.
6. **Store fields:** developer/publisher name and contact e-mail in `METADATA.md`. Do not describe the art as hand-made.
