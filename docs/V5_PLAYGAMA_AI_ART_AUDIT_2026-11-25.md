# Vaultwake Merge: generative-AI artwork audit for Playgama (2026-11-25)

**Purpose:** decide, from the records only, whether the game's artwork meets Playgama rule 4.3.1, before any costly
replacement. No AI use is hidden here, and no human contribution is claimed that the records do not show.

## 1. The rules, as read live through the Playgama Developer Console MCP on 2026-11-25

`get_game_checklist` returned these pages: `content-requirements` and `user-experience-requirements`.

> **4.3.1** Games can use AI-generated assets, but they shouldn't be built entirely from them. Platforms will reject
> low-quality titles constructed wholly with generative AI that bring nothing fresh to the player experience.
> Footnote: … We're happy to accept games that use AI for story, logic, and game math, but we don't take games that are
> 100% AI-generated without substantial human refinement of the visuals.
>
> **4.3.2** The interface is designed for this game: it does not use emoji in place of icons and does not look like a
> default generated template.
>
> **3.3.1** The game cannot be completely silent: it has background music and sound effects for actions and the interface.
> **3.3.2** … recorded or produced with audio tools and shipped as compressed audio files (ogg or mp3). Sound
> synthesized in code … is not accepted.

**Status after this release round:**

| Rule | Status | What was done |
|---|---|---|
| 3.3.1, 3.3.2 | **Met** | CC0 recorded sound effects and music files replaced the code-synthesised sounds (`v5/assets/audio/LICENSES.md`) |
| 4.3.2 | **Met** | The dock, hint, lock and build icons were emoji; they are now line icons drawn for the game (inline SVG) |
| 4.3.1 | **Open** | See below |

## 2. What the shipped artwork is (from `docs/release/VAULTWAKE_ART_RIGHTS_REGISTER.csv` and `release/crazygames-basic/RIGHTS_REPORT.md`)

| | Files | How made | Evidence |
|---|---:|---|---|
| AI image generation, then cut, cropped, framed or composited | 236 | Images generated with ChatGPT (owner statement), processed by Claude Code (an AI coding agent) with scripts in `tools/` | 150 have masters in `docs/art-source/`; 85 rest on the owner's statement (no sheet archived) |
| AI image generation, used as generated (resize or format only) | 6 | as above | prompts recorded |
| Rendered by code | 22 | 21 WebGL ray-marched place renders written by Claude Code; 1 SVG | source code in the repository |
| **Total images** | **264** | | |

**Other visual work:**
- **Interface:** layout, styles and animations are CSS and JavaScript written by AI coding agents (Claude Code; Codex on `codex/*` branches) under the owner's direction.
- **Icons:** the new line icons were drawn in code by Claude Code.
- **Logo:** the "MERGE" subtitle is set in Liberation Serif (OFL).

**What the records do NOT contain:** any image painted, drawn, retouched or corrected by a human hand. The edits in the
record were made by AI agents:
- `tools/paint-landing-vault.py` painted the Vault entrance into the beach map;
- `tools/brand-logo-merge.py` redrew the logo's subtitle;
- `tools/secondary-icon-edits.py`, `tools/harbour-art.py`, `tools/headland-art.py`, `tools/keeper-art.py` and `tools/lowwater-art.py` cut, normalised and recoloured.

## 3. Human contributions the records show

All are the owner's (GitHub `siruss4199-wq`). They are **direction, choice and review**, not hands-on image work:

| Contribution | Record |
|---|---|
| The game itself: a coastal restoration merge game around a sealed Vault, its chapters, places, crew and story beats, and what each chapter should look like | The chapter requests, and the briefs in the art packs (`docs/art-source/*/pack/CLAUDE_HANDOFF.md`, `NARRATIVE.md`, `stages.json`), produced in the owner's own ChatGPT sessions and brought into the project by the owner |
| Choosing the images: generating and picking the sheets and masters that entered the game, and supplying them | Commits importing "the user's painted sheet" (`b4bf79f`), "the user's 21 beach stage pictures" (`6b47b4d`), "the user's three concept sheets" (`f96d1de`), "the supplied skin/art" (`f9dc476`, `5b4a64e`) |
| Rejecting and redirecting visual work: the Coastal Lab look was rejected and kept only for traceability; visual passes were ordered and accepted or sent back | `CLAUDE.md` (Coastal Lab "rejected prototype"); the visual-direction and "Bright" passes; the mobile UI fixes the owner reported from real iPhone play (Shed overlay, Build pill) |
| Playtesting on real devices and asking for fixes | Owner iPhone and PC reports (`release/crazygames-basic/DEVICE_QA.md`; Shed overlay report, 2026-11-17) |
| Approving commercial use and accepting the documentation gaps | `release/crazygames-basic/evidence/owner-declaration-2026-11-08.md` |

**Game design, economy and story (4.3.1 accepts AI for "story, logic, and game math"):**
- The design was directed and decided by the owner over more than 50 builds (economy rounds, tutorials, chapters).
- The code was written by AI coding agents.
- Owner decisions are recorded across `docs/V5_*.md` (e.g. the open B5 decision, the level path, the energy capacity schedule).

## 4. Eligibility

- **Read literally**, the footnote ("we don't take games that are 100% AI-generated without substantial human refinement of the visuals") describes this game's visuals: every image is AI-generated or AI-rendered, and the refinements were made by AI agents directed by a person, not by a person's hand. **High risk of rejection under 4.3.1.**
- **Read by the rule's main text**, the risk is lower. That text rejects "low-quality titles constructed wholly with generative AI that bring nothing fresh to the player experience". Vaultwake Merge has:
  - an original design built over many owner-directed iterations: 6 chapters, 50+ places in 3 stages each, a tuned economy, a guided tutorial;
  - a consistent art style curated for the game;
  - now, recorded CC0 audio and a hand-built interface without emoji.
- **The policy is ambiguous** on the decisive point: whether art direction, curation and extensive game-specific processing by tools count as "human refinement". So, as instructed, **a support inquiry comes before any replacement work** (`release/playgama/SUPPORT_INQUIRY_AI_ART.md`).

**If Playgama says more is needed**, the options, from cheapest to most expensive:
1. A human artist retouches the most-seen art: the Home picture, the logo, the 16 interface images, the board icons of the first chapter (about 60 files).
2. The interface chrome (HUD, order cards, buttons) is redrawn by a human.
3. All art is replaced.

None of this has been started.

## 5. What was not changed

No artwork was replaced, relabelled or re-described. The listing text does not claim hand-made art. The release report and
this audit state the AI use plainly.
