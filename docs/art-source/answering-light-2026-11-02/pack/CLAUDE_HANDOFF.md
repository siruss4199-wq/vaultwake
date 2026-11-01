# CLAUDE HANDOFF — Chapter 4: The Answering Light
Prepare from this pack; implement only when the user authorizes implementation. This pack itself does not authorize merge, publication or messages.

1. Read README.md, docs/DESIGN.md, docs/ART_INTEGRATION.md and data/*.json.
2. Verify latest line containing Chapter 3 + the finalized energy cap100 and fixed rare-goal pass. The verified reference for this pack is 08fee578, NOT an instruction to revert later work.
3. Create claude/v5-chapter4-answering-light from the verified current base when implementation is authorized. Dedicated draft PR. No merges.
4. Append area answering-light. Stable place IDs ch4-landing/steps/cottage/workshop/records/lighthouse/relay. Preserve all existing indices and IDs.
5. Translate proposal data into the actual area/effect schema. Do not paste proposal JSON directly into the engine. Dependencies and recipes are explicit, stage count21.
6. Every Gold recipe is fixed, two requirements; five stages use merged secondaries. Do not use the prior dynamic rare downgrade path.
7. Use all 21 separate stage assets for stage cards. Do not replace with a master sprite sheet or labels. See map strategy and QA caveats.
8. Stage prices and kit rewards are PROVISIONAL. Simulate and tune before calling this balanced. Do not change global energy, primary drop rules or board dimensions to force the chapter to pass.
9. Add the four story cards from data/story-cards.json with seen-once persistence. Existing save keys and story flags remain intact. If a new optional field is needed, default it; never reject old saves merely because it is missing.
10. Finished Chapter3 saves should reach Chapter4 without replaying rewards or skipping the arrival. Existing Chapter3 end-seen flags are not Chapter4-seen flags.
11. Retain board, pending rewards, shed, generator levels, coins, energy including overflow, active orders, material credits and collection.
12. Verify existing stage indexing, allDone/end-card logic, Home Continue label, map tabs and CrazyGames generated page.
13. Keep V4, v5/lab/, Classic V5 and PR75 untouched. Do not activate inactive secondary families or implement Chapter5.
14. Run the QA checklist and report exact commands/results, source/base SHA, new SHA, preview, screenshots, balancing deltas and remaining limits. Distinguish pre-existing failures.

Before pricing: read actual crew/Gold payout calculation. Do not give a Gold reward that funds most of every restoration automatically; do not make ordinary orders mandatory filler either.

Art is individual generated PNGs, not registered map layers. Do not pretend alpha sprites align with the painted map. Stage previews are ready for integration review; map masking still needs viewport QA. No runtime dependencies required.

