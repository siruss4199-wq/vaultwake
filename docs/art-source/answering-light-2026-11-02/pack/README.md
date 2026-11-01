# Vaultwake Chapter 4 — The Answering Light
Prepared 2026-11-02 · Design and art handoff v1

**Read CLAUDE_HANDOFF.md first.** This is a full design/art preparation pack, not implemented or playtested gameplay. No repository writes, PR updates or deployments were made.

## Contents
- assets/: 2 environment masters, 21 individual transparent stage sprites, 4 story illustrations.
- data/chapter4-proposal.json: 7 places, 21 authored stages, dependency conditions, provisional costs/recipes, stage dialogue and reward proposals. Tier numbers are ZERO-BASED.
- data/story-cards.json: four story cards and precise triggers.
- docs/DESIGN.md: design, pacing, UX and continuity.
- docs/ART_INTEGRATION.md: asset treatment and known limitations.
- docs/QA_CHECKLIST.md: implementation acceptance checks.
- manifest.json: filenames, dimensions, alpha and SHA256.
- gallery.html: offline review of every image, grouped by place.
- prompts.json: generation/edit prompts.
- CLAUDE_HANDOFF.md: implementation instructions.

## Proposal vs verified facts
Source read: chains.mjs and areas.mjs at 08fee578b0cfc53c6aac416df282e9b488b93993 (PR #86 line). Current implementation may advance; verify HEAD before coding.
Verified: active families rig/chart/rope/shell/lamp/optic/mech/notes, mech2 Gear assembly, notes2 Travel notebook; Harbour has 21 stages.
New proposed story: automatic reply apparatus; keeper log explains it; final message contains a low-water reef route. These are Chapter 4 additions, not claims about existing canon.
No Record Press added: that earlier Archive proposal is not the implemented chain.
No Chapter 5 implementation or firm chapter title is promised.

## Economics
6,160 coins total is an untested starting budget, not approved final balance. Stage prices 220–380. Do not ship without simulating against the current energy cap 100 pass and fixed rare-goal protection. Story notes/charts are progression state, not board collectibles. No new currency, generator or board required.

