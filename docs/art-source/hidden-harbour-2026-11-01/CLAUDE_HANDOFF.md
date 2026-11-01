# Vaultwake Chapter 3 — The Hidden Harbour

Art and design handoff • 2026-11-01 • proposal, not implemented gameplay

## Delivery status

Four original generated PNG master images are supplied: two environment concepts, a transparent 21-object restoration sheet, and a four-panel story sheet. These are art-direction masters, NOT 27 separately exported runtime assets. No repository, saves, economy or PR has been changed. Generated with the built-in image tool.

Claude: inspect the actual current branch and Chapter 2 ending before implementing. Preserve established story facts. This proposal follows the existing Silent Observatory / sea gate ending; it does not replace Chapter 2 with a separate Archive chapter. Keep energy tuning separate from Chapter 3 content work. Keep the current board and all owned items/generators. No board reset, new currency, or mandatory new generator.

## Asset manifest

| File | Use | Status |
|---|---|---|
| assets/harbour-before-concept.png | Chapter entry / damaged harbour visual direction | Environment concept; some sites already look operational |
| assets/harbour-restored-concept.png | Final restoration reveal and chapter preview | Matched composition concept |
| assets/harbour-restoration-21-sheet.png | Seven locations, stages 1–3, upgrade cards | Transparent master; cut and normalize each sprite before runtime |
| assets/harbour-story-4-sheet.png | Four narrative moments | Cut into four illustrations; see continuity notes |

Do not treat the master PNG filenames as existing repository paths. Suggested future root: v5/assets/premium/coast/hidden-harbour/. Use a manifest rather than hard-coded sprite offsets.

## Visual system

Bright turquoise water, cobalt blue accents, coral canvas, honey timber, sunlit ivory limestone and restrained brass. Keep active items saturated; do not gray the entire environment. Soft upper-left lighting, elevated three-quarter camera, readable silhouettes. No text baked into art. Use existing crew portraits; no new characters in this pack.

The map has seven sites: landing lower-left, crane middle-left, warehouse upper-left, registry upper-center, boatyard middle-right, signal tower upper-right, departure dock lower-right. Keep the central water basin visible. Camera perspective is concept-level rather than pixel-registered to the sprite sheet.

## 21 restoration stages

Columns of the sprite sheet run LEFT TO RIGHT in the order below. Rows TOP TO BOTTOM are stage 1, 2, 3. Each column keeps its own core form. Stage zero is damaged/unbuilt and is NOT a fourth sprite row.

| Column / suggested ID | Stage 1 | Stage 2 | Stage 3 | Existing chains to emphasize |
|---|---|---|---|---|
| 1 harbour_landing | Clear the landing | Secure the railings | Light the landing | Rover, Winch |
| 2 harbour_crane | Reinforce the crane | Fit the pulley | Recover the cargo | Rover, Winch |
| 3 harbour_warehouse | Repair the roof | Raise the shelves | Sort the supplies | Rover, Shell |
| 4 harbour_boatyard | Set up the workbench | Repair the hull | Rig the sail | Rover, Winch |
| 5 harbour_registry | Reopen the office | Dry the records | Trace the route | Kite, Kiln |
| 6 harbour_signal | Repair the tower | Align the lens | Send the signal | Kiln, existing optics chain |
| 7 harbour_departure | Repair the jetty | Load the supplies | Launch the boat | Winch, Kite |

These are proposed names and material-family roles, not final item requirements or prices. Claude owns economy and must use current chain IDs, attainable tiers and pacing measurements. Do not infer requirements from decorations in a painting.

## Proposed progression and story

Complete landing to open crane and warehouse. Crane stage 3 reveals recovered cargo. Crane and warehouse completion open boatyard and registry. Registry stage 3 opens signal work. Signal stage 3 supplies the direction for the final departure; departure stage 3 requires boatyard and signal completion. Confirm this dependency structure against existing area data support before coding; no artificial XP gate.

Story sheet panels, reading order:

1. Arrival / a fresh rope: after the Chapter 2 sea-gate ending, before the first Chapter 3 task. Bram: “This knot is fresh. Someone has used this landing.” Next action: Clear the landing.
2. Recovered cargo: crane stage 3. Neri: “That mark again. Bring the chest ashore—we may find its route in the harbour records.” Next action: reopen the registry when its prerequisites are complete; otherwise highlight the actual remaining prerequisite.
3. Answering light: signal stage 3. Tamsin: “There. Across the water. A light answered us.” Next action: finish the boat and load supplies.
4. Departure: departure stage 3. Ivo: “The boat is ready. Now we have a direction.” Chapter-complete payoff; do not expose an active Chapter 4 button until playable content exists. Journal and return-to-board remain available.

These lines are new proposed story content. The wave-like chest emblem must not silently become the canonical letter seal without checking the existing art/story. Do not reveal who sent the original letter.

## Board connection

Maintain the current board dimensions, items, generators, energy, pending rewards and shed across chapter entry. Rotate gold requirements among the relevant existing chains; late generators should have useful work. Keep rare secondary items in crew orders, never mandatory random-drop story gates.

The Winch, Shell and Kiln secondary art already exists in prior work. Do not regenerate it or automatically activate all three. Measure each chain separately before enabling it. This chapter pack contains restoration art, not new merge-chain icons.

## UX and motion specification

Chapter entry: short skippable reveal, then one clear restoration objective. Show the correct location name and affordable / missing-material state. Keep gold order and required producer connected visually.

Restoration: deduct actual cost once, show a small coin trail, replace only that site's state, 250–400 ms glow/crossfade, then highlight the next achievable objective. Reduced motion: immediate replacement plus static highlight. No screen shake or repeated full-screen congratulation cards.

Story: four major cards only, seen-once flags, replay from existing journal if supported. Persist completion before presentation. Reload must not duplicate a reward or block the next task. Keep buttons at least 44 CSS px; text wraps at 360 px. Landscape uses illustration beside copy. Portrait uses illustration above copy.

## Production QA notes — do not skip

1. The before map's crane and departure dock already look fairly functional. Damage needs a local art pass before this becomes an authoritative stage-zero map.
2. The arrival story panel currently depicts a rather restored harbour in the distance. Use it as a composition reference; correct the background to damaged buildings before using it at chapter entry.
3. The signal tower's final sprite has a warmer golden light while the environment has sea-green light. Standardize the lens/glow to sea-green, keeping brass gold.
4. The final boatyard sprite still contains a boat while the completed environment shows it launched. At departure completion, remove the yard boat or use the empty cradle state; do not show two copies of the same vessel.
5. The fully painted map already contains buildings. Do not simply overlay full building sprites and create duplicates. For per-stage map changes, extract matching clean site plates or build a registered scene-layer set. Until then, these sprites are suitable for upgrade cards and the two maps for chapter entry/completion only.
6. Sprite-sheet gutters and baselines are visually arranged, not a guaranteed pixel-perfect atlas. Slice by inspected bounds, retain alpha, normalize to equal transparent canvases with bottom-center anchors and ~10% padding. Check the departure boat at the right edge for clipping. Do not stretch every building to identical width.
7. No portrait/landscape browser QA or alpha-edge validation has been performed on integrated assets. These masters have not been installed in the game.

## Runtime export checklist

Produce 21 separate transparent sprites named <place-id>-s1/s2/s3.webp or PNG after inspecting each crop. Export story panels separately as arrival, cargo, signal and departure. Preserve original masters. Use descriptive alt text in story cards; decorative scene images have empty alt. Never encode stage logic in image filenames alone.

Before implementation, produce an asset contact sheet and exact manifest with pixel dimensions. In-browser acceptance: 360/390/430 px and 907×510; no clipping, no false active actions; current save survives chapter entry; full-board rewards queue; stage upgrades show the right local change; all story cards are dismissible and seen once. Run existing V5 unit/browser tests plus Chapter 3 completion and migration tests. No merges without approval.

## Prompt set / art reproduction brief

Environment before: one portrait elevated three-quarter Hidden Harbour, seven locations around a clear turquoise basin, damaged landing, crane, timber warehouse, coral boatyard, cobalt-roof registry, unlit ivory signal tower, departure dock; sunlit limestone, honey timber, coral and brass, no text/UI/characters.

Environment after: edit the before master without changing camera/geography; repair planks/roof/rails/awning, recover navy brass chest, light sea-green signal, launch small ivory/coral-sail boat to departure dock, leave empty yard cradles.

Restoration sheet: exactly seven columns by three rows, transparent background, separate isometric building islands, top-left light, one location per column and progressive additive stage per row. Column order landing/crane/warehouse/boatyard/registry/signal/departure. No text, UI or frames.

Story sheet: exactly two columns by two rows, four text-free scenes in the same world: fresh mooring rope through sea arch; crane lifts navy/brass chest; sea-green signal answered at dusk; ivory/coral-sail boat departs in daylight. No new characters or destination invented.

Use the full supplied master images as visual references when making corrections, not these compact prompts alone.
