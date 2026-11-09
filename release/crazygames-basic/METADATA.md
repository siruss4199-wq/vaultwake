# Vaultwake Merge: CrazyGames submission metadata (English)

Draft for the owner to paste into the CrazyGames developer portal. Every feature named here is in the
Basic Launch build `vaultwake-merge-crazygames-basic-664956e.zip` (source commit `664956e`).
Nothing below has been submitted. Fields marked **OWNER** need the owner's input; do not paste the
bracketed placeholders into the portal.

Status of the inputs (2026-11-08):
- **Artwork:** the owner approved commercial use of all 264 shipped images (`evidence/owner-declaration-2026-11-08.md`).
- **Name:** see `evidence/name-decision-2026-11-08.md`. USPTO and EUIPO searches found no conflict; the WIPO, TMview and Mongolia searches and the owner's keep/change decision are still open.

## Title

**Vaultwake Merge**

Not cleared as a trademark. USPTO and EUIPO showed no identical or similar VAULTWAKE mark on 2026-11-08; the owner still has to finish the WIPO, TMview and Mongolia searches and decide (`evidence/name-decision-2026-11-08.md`). If the name changes, the logo, covers, videos and this file change with it.

## Short description (≤ 160 characters)

> Merge tools and treasures, fill crew orders for coins and rebuild a storm-wrecked coast, one place at a time, until the ancient Vault opens.

(140 characters)

## Full description

> A storm has wrecked the coast, and an old Vault door waits in the cliff above the beach. Your crew
> has a camp, a few tools and a long list of jobs.
>
> Tap a generator for parts, then drag matching parts together to merge them into better ones: a
> Copper offcut becomes a Grip tool, then a Split spanner, a Pocket winch and on up the chain. Fill
> your crew's orders to earn coins, deliver each place's gold order for its materials, and spend your
> coins to rebuild the coast stage by stage. Every stage changes the scene and moves the story on.
>
> Restore the Landing Beach and the Survey Worksite to open the Vault, then follow the trail through
> the Silent Observatory, the Hidden Harbour, the Answering Light, the Lowwater Passage and the
> Keeper's Promise.
>
> - Seven generators and their merge chains: Rivet Rover, Survey Kite, Rope Winch, Shell Trap,
>   Lantern Kiln, Echo Crucible and Lens Bench
> - Rare parts that drop now and then, wanted by special orders
> - Sealed cargo that opens with the right part, parts frozen in ice that crack free as you merge
>   beside them, and crates with free parts
> - Eight areas to restore, each place in three stages, with short story scenes between chapters
> - Energy that refills over time; your energy capacity grows as your level rises
> - A daily gift, a shed for parts you want to keep, and a collection book for every part you find
> - Progress saves automatically, and follows you to other devices when you are logged in to CrazyGames
>
> Made with the help of AI tools: the game's artwork was created with ChatGPT and Claude Code and
> edited by the developer.

Checked against the build:
- The seven generators come from `v5/next/chains.mjs` (`GENERATOR_NAMES`).
- The eight areas come from `v5/next/areas.mjs`: Landing Beach (7 places), Survey Worksite (7), Vault Entrance (1), The Silent Observatory (6), The Hidden Harbour (7), The Answering Light (7), The Lowwater Passage (7) and The Keeper's Promise (7).
- Three stages per place, daily gift, shed, book, energy refill and level capacity are in the in-game help (`v5/play.html`, `#help`).
- There are no ads or purchases in the Basic build.

## Genre and category

- **Category:** Puzzle. The portal's own list decides: pick "Merge" if it is offered as a category, or as a tag otherwise.
- **Tags (suggested):** merge, casual, puzzle, building, story, relaxing, offline-friendly, mobile, 2D

## Controls

| Input | Action |
|---|---|
| Mouse: click a generator | Make a part (costs 1 energy) |
| Mouse: drag a part onto its twin | Merge them into the next part |
| Mouse: drag a part onto sealed cargo or a shed space | Open the cargo / store the part |
| Mouse: click a ready order | Deliver it for coins |
| Mouse: click the place strip under the orders | Open the coast and build the next stage |
| Touch: the same with a tap and a finger drag | Same actions |
| Keyboard | Tab and Enter reach and press the Home screen's Play / Continue button. Merging needs a mouse or touch. |

The keyboard row states only what the Home browser test checks (`tests/v5-next-home-browser.cjs:99-101`).

## Instructions (short "How to play")

1. Tap a generator (the Rivet Rover first) to make a part.
2. Drag a part onto an identical part to merge them into a better one.
3. When an order shows "Deliver", tap it to earn coins.
4. Deliver the gold order to bring a place's materials, then open the coast and build the stage with your coins.
5. Energy refills over time, and your capacity grows with your level.

## Key features (bullets for the portal)

- Relaxing merge puzzle with seven generator chains
- Rebuild a storm-wrecked coast place by place
- Short story scenes as each chapter opens
- Rare parts, sealed cargo, ice and crates keep the board changing
- Plays on desktop and mobile, in portrait or landscape
- Your progress saves automatically and syncs across devices with your CrazyGames account

## Platform fields

| Field | Value |
|---|---|
| Launch type | Basic Launch (no ads, no in-game purchases) |
| Orientation | Both. Landscape works on desktop; portrait fills phones. |
| Mobile friendly | Yes. Touch controls, tested at 360, 390 and 430 px wide. |
| Uses CrazyGames SDK | Yes, v3 (`https://sdk.crazygames.com/crazygames-sdk-v3.js`): init, loading start/stop, gameplay start/stop, happy time, and the portal's mute setting. `data-ads="off"`: the ad call in `v5/next/platform-cg.mjs` is switched off in Basic and no ad UI is shown. |
| Monetization | None. Basic Launch: no ads, no in-game purchases; the shop sells for in-game coins only. |
| Multiplayer | No |
| Languages | English |
| Progress save (submission form) | **Yes, CrazyGames SDK Data Module.** Guests are saved by the SDK on the device; logged-in players on their CrazyGames account, synced across devices. Outside CrazyGames the game falls back to browser localStorage (`vaultwake-v5-coast`). |
| Developer name | **Vaultwake Merge** (owner-provided; pending trademark review) |
| Publisher name | **Vaultwake Merge** (owner-provided; pending trademark review) |
| Developer contact e-mail | siruss4199@gmail.com (owner-provided) |
| Developer website / social | **OWNER** (optional) |
| Age rating / content | **OWNER** to confirm in the portal. No violence, no chat, no user-generated content, no data collection beyond the game save (CrazyGames SDK Data module). |
| Release date | **OWNER** |
| Credits | Vaultwake Merge by **Vaultwake Merge**. Artwork was created with AI tools (OpenAI's ChatGPT and Anthropic's Claude Code) and selected, edited and assembled by the developer, who takes responsibility for the published game. |
| AI-generated content disclosure | Yes, if the portal asks: artwork is AI-generated (ChatGPT, ChatGPT Plus account) or drawn by code with Claude Code (Claude Pro account), then edited by the developer. Owner-approved for commercial use, 2026-11-08. Do not describe it as hand-painted or human-made (OpenAI Terms of Use; see `evidence/openai-sharing-publication-policy-2026-11-08.md`). |

## Media

- Covers: `covers/cover-landscape-1920x1080.png`, `covers/cover-portrait-800x1200.png`, `covers/cover-square-800x800.png`
- Gameplay previews: `videos/vaultwake-merge-gameplay-landscape-1920x1080.mp4`, `videos/vaultwake-merge-gameplay-portrait-1080x1620.mp4`

All of these are made only from the game's own art, which the owner approved for commercial use on 2026-11-08 (`evidence/owner-declaration-2026-11-08.md`). Their SHA-256 sums are in `SHA256SUMS`.
