# Vaultwake Merge: rights and brand report (Basic Launch package)

**Status: owner-approved for commercial use of the 264 shipped images (2026-11-08), as an owner attestation; independent third-party rights clearance is not guaranteed. CrazyGames upload remains NO-GO pending the OpenAI Sharing & Publication Policy check, the trademark searches and real-device QA (`OUTSTANDING_APPROVALS.md` D, F, H).**

This is an engineering audit of what ships and where it came from. The owner has expressly approved commercial use of the shipped images; that statement is not an independent legal rights opinion.

**Owner confirmation, 2026-11-08** (recorded in `evidence/owner-confirmation-2026-11-08.md`):
- Artwork made in October–November 2026, for this game only, with **ChatGPT Astra on a ChatGPT Plus personal account** and **Claude Code on a Claude Pro personal account**, both owned by the owner.
- The owner lives in **Mongolia**.
- No stock art or outside artist's work was intentionally used.
- The 85 assets without masters came from the same workflow; their individual tool remains unverified.

These are **owner statements**. No account record, invoice or generation log was supplied.

**What the repositories independently show.**
- Git history of `siruss4199-wq/wispwood-game`, the masters, the generation notes and the art scripts.
- Claude Code commits (author "Claude") **cut, cropped, composited and exported** most images, and **drew 21 pictures with code**.
- The **painted images** came into the Claude Code sessions from outside them. The notes say "This session has no image-generation tool" and "built-in image tool".
- No file names ChatGPT, a plan, an account or dates.

**Approval.** The owner explicitly approved commercial use of all 264 shipped images on 2026-11-08. `owner_approved=YES` applies only to those 264; non-shipped items remain unapproved. Evidence is `evidence/owner-declaration-2026-11-08.md`. This does not establish independent third-party legal clearance, exclusivity, trademark rights or CrazyGames submission approval.

Package: `vaultwake-merge-crazygames-basic-dd65d3f.zip` (source commit `dd65d3f`; SHA-256 in `SHA256SUMS`).
Per-file detail: `ASSET_INVENTORY.csv` (path, bytes, use in this release, reported provenance, clearance status, owner_approved).

## 1. What ships

The ZIP holds 334 files:
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

### Terms for the confirmed plans (official sources, read 2026-11-08)

**ChatGPT Plus, an individual account, owner resident in Mongolia.** This falls under the OpenAI **Terms of Use** for individuals outside the EEA, Switzerland and the UK (effective 1 January 2026; https://openai.com/policies/row-terms-of-use/), which include the **Service Terms** (updated 16 October 2026; https://openai.com/policies/service-terms/).
- Ownership: *"you … own the Output. We hereby assign to you all our right, title, and interest, if any, in and to Output."*
- Uniqueness: *"output may not be unique and other users may receive similar output."*
- Restriction: you may not *"Represent that Output was human-generated when it was not."*
- Service Terms §6: you may not *"reproduce the likeness of any person without express consent and all necessary rights."*
- No commercial-use restriction on generated images. The only non-commercial clause is §8, ChatGPT Voice output, which the game does not use: its sounds are synthesised by code.
- The **Sharing & Publication Policy** referred to by the Terms of Use could not be loaded (403) and has not been checked.

**Claude Pro, an individual account.** This falls under Anthropic's **Consumer Terms** (effective 8 October 2025; https://www.anthropic.com/legal/consumer-terms), which *"govern your use of Claude.ai, Claude Pro…"*.
- Ownership: *"Subject to your compliance with our Terms, we assign to you all of our right, title, and interest—if any—in Outputs."*
- No commercial-use restriction for a paid subscription. Only evaluation access is *"for your personal, non-commercial use only"*.
- Prohibited, among others: infringing others' IP or publicity rights, and developing competing AI products or models.

**What this means, in engineering terms (not legal advice):**
- Both plans let the owner use and publish the output commercially, including through CrazyGames. Neither grants exclusivity.
- The rights are assigned only "if any": whether AI-generated images are protected by copyright in Mongolia or elsewhere has not been assessed.

**CrazyGames.** Its requirements pages have no rule against AI art. The covers page says: *"Don't use copyrighted visuals that you don't have the right to use."*

## 3. Name and brand check: "Vaultwake Merge"

Search date: 2026-11-08. These were web searches only; no trademark office was searched.

| Search | Result |
|---|---|
| "Vaultwake" as a game | No game found with this name on the web, Steam or the app stores in the searches run. |
| "Vaultwake" in software | A GitHub project `miller-joe/vaultwake` (Vault-related software, not a game; noted in `docs/release/VAULTWAKE_MERGE_RIGHTS_BRAND_AUDIT.md`). Different class of goods, but the owner should see it. |
| Similar game names | *Battlewake* (Survios, VR naval game; [UploadVR](https://uploadvr.com/naval-combat-vr-game-battlewake-now-available/)). *Merge Ghost – Ghost Vault* ([LDPlayer](https://www.ldplayer.net/games/merge-ghost-on-pc.html)). A "Vault" merge app listing ([AppGoblin](https://appgoblin.info/apps/com.vaultomb)). *Vault Merge Coin Stacker* (noted in the earlier audit). |
| "MERGE …" marks in games | Metacore Games Oy holds marks such as MERGE MANSION and MERGE VIKINGS ([trademarkdir](https://trademarkdir.com/owner/metacore-games-oy), [markinton](https://markinton.com/company/metacore-games-oy)). There are several US filings for "MERGE" word marks ([Justia 98779725](https://trademarks.justia.com/987/79/merge-98779725.html), [Justia 98894637](https://trademarks.justia.com/988/94/merge-98894637.html)). "Merge" is a generic genre word, but a "MERGE + word" mark owner may object to close imitation. |
| Trademark filings for "Vaultwake" | None found in the web results. |

**Register searches, 2026-11-08** (full record, screenshots and raw results in `evidence/name-decision-2026-11-08.md` and `evidence/trademark-search-2026-11-08/`):

| Register | Result |
|---|---|
| USPTO | **0** marks for VAULTWAKE, VAULTWAKE MERGE, VAULT WAKE or VAULT + WAKE, in any status or class. Shared-element game marks exist, for example BATTLEWAKE (Survios, registered, classes 9 and 41), ARCHWAKE, ASHWAKE and MERGE MANSION. |
| EUIPO (EU trade marks) | **0** for VAULTWAKE, VAULTWAKE MERGE, VAULT WAKE, VAULTWAK, VOLTWAKE and BATTLEWAKE. Positive controls returned results. |
| WIPO Global Brand Database | Not completed: anti-bot check. |
| TMview | Not completed: firewall rejected the session. |
| Mongolia (IPOM register) | Not completed: HTTP 403. |

No identical or near-identical mark was found where searching was possible, but **this is not clearance.** The owner must finish the three blocked searches and decide whether to keep, change or file the name.

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

## 6. Owner approval and remaining publication checks

1. ~~**The 85 assets with no master or generation record**~~ **Accepted 2026-11-08** in the owner's declaration (`evidence/owner-declaration-2026-11-08.md`): same workflow, per-image tool unverifiable, documentation gap accepted.
2. ~~**No exclusivity, uncertain copyright protection**~~ **Acknowledged 2026-11-08** in the owner's declaration.
3. ~~**Crew portraits**~~ **Closed 2026-11-08.** The owner confirms Ivo, Bram, Neri and Tamsin (`coast/ui/crew-ivo`, `crew-bram`, `crew-nara`, `crew-sela`) are fully AI-invented fictional characters, not based on real people or reproduced likenesses (owner statement 8). This satisfies the likeness rules in OpenAI's Service Terms §6 and Anthropic's terms as far as the owner's statement goes.
4. **No independent account evidence.** The plans are owner-confirmed only. Optionally keep a dated screenshot of each subscription page or invoice with the release records.
5. **OpenAI Sharing & Publication Policy.** The live page (updated 14 Nov 2022) was blocked to the 2026-11-08 session. A 2026-11-09 follow-up retrieved it and confirmed the earlier review (`evidence/openai-sharing-publication-policy-2026-11-08.md`). It says to attribute the work to yourself, disclose AI use clearly, and not present it as human-made. No commercial restriction was found, and the recommended credits are in `METADATA.md`. The owner should open the live page once and record "read", or accept the risk.
6. ~~**Approve.**~~ **Completed 2026-11-08:** The owner expressly approved commercial use of the 264 shipped images, recorded in the declaration and rights register using the GitHub handle `siruss4199-wq` (personal initials not provided). This does not replace independent rights clearance.
7. **Name and store fields.** USPTO and EUIPO were searched on 2026-11-08 with no conflict. WIPO, TMview and the Mongolian register still need the owner (`evidence/name-decision-2026-11-08.md`). The developer/publisher name and contact e-mail were filled in by the owner on 2026-11-08 (`METADATA.md`).
