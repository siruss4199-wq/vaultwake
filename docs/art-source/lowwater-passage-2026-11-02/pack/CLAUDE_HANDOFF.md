# Chapter 5: The Lowwater Passage
Design proposal, not implemented or balance-tested. Read all files before coding.

## Scope
Seven places,21 stages. Append to verified current chapter data, never replace prior content. Verify current HEAD, Chapter4 ending, active families, tier bounds and save migration first. Work on a dedicated draft branch from the latest accepted line; no merge. Preserve V4,Classic,v5/lab,PR75 and existing save keys. Energy cap100 is a separate authorized change; do not alter energy in this chapter.

## Gameplay
Reuse current board and generators. No new currency, mandatory generator or secondary family. Material recipes and coin costs are candidates; verify tier IDs against current source and calibrate before committing. Fixed rare milestones must not downgrade based on inventory. Do not demand an unavailable source. Existing orders and secured material credits survive migration. Preserve pending rewards/full-board safety. Do not grant automatic energy or generator rewards from this document; retain existing baseline rewards and measure any additions.

## Sequence
Use stages.json dependency IDs as design IDs, map into real schema. Linear places deliberately avoid ambiguous completion. Later chapter entry requires every previous chapter stage. Story cards seen once; reload/skip must not replay or suppress progression. Final CTA resolves to real available destination. No fake Chapter7 button.

## Art
Four masters: before map, after map, 21-stage concept sheet, four-panel storyboard. THESE ARE NOT 27 READY INDIVIDUAL ASSETS. Sheets require extraction and QA; no automatic assumption of transparent backgrounds or pixel registration. Stage1 means first repair completed, not damaged stage0. Do not paint all repairs onto stage0 map. Use maps as whole-state backgrounds until proper per-place overlays exist. Story sheet is illustration direction, dialogue lives in JSON. Preserve visual consistency when exporting.

## Acceptance
Run existing unit and Coast browser suites plus chapter-specific save/load, dependencies, full board, duplicate reward, story-once and chapter-end tests. 360/390/430px and907x510, Chromium and WebKit where available. Report actual runs and base failures separately. Measure chapter-only active actions, energy idle, rare pursuit, coin wait, board occupancy at4/5/8/10sec/action, shop on/off,10seeds. Compare Chapter4, aim active duration within0.9–1.2x; investigate any objective stall over8 active minutes. These are tuning targets, not proven results. No arbitrary waiting to stretch content.

Deliver draft PR, pinned preview, screenshots, exact SHA, test results and limitations. Do not merge.
