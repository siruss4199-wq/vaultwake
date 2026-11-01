# Art integration — read before implementation

## Delivery
Individual PNG masters; never cut a sprite sheet. The 21 sprites have transparent backgrounds. Preserve alpha, aspect ratio and the entire object. Original pixels are not edited by helper scripts.

## What is ready
- Seven matched 3-stage sprite sequences for restoration cards and place selection.
- Initial damaged and complete environment concept masters.
- Four text-free story illustrations. Add real dialogue and existing portraits in HTML, not baked into art.
- Gallery with light/dark preview backgrounds and stage labels for review.
- Asset filenames, dimensions and SHA256 in manifest.

## Important limitations
These are generated art masters, not browser-tested final runtime assets.
1. Environment masters retain overall composition but are NOT guaranteed pixel registered. Do not reveal arbitrary radial patches of the restored map without inspecting structure edges.
2. Isolated sprites have their own stone bases and camera. They are for cards and selection previews; they cannot simply be pasted onto the painted map as exact architectural layers.
3. Stage1 reflects the FIRST COMPLETED repair, not the initial broken state. Use map-before for chapter entry; do not display all stage1 sprites as though earned.
4. Dense flowers, weathering and small props can disappear at mobile sizes. The large structural changes are the primary state cue. Test96/144px; do not rely on tiny text/chart marks.
5. Reflections in polished brass can look luminous even when unpowered; only lighthouse stage3 and relay stage3 are gameplay-powered light states.
6. Alpha assets need dark-background edge review before runtime compression. Do not substitute opaque black backgrounds if the preview displays transparency as black.

## Honest map strategy
Prefer two uses:
- initial and completed chapter environment images as narrative overview;
- stage progress represented by actual stage sprites in clear selectable cards and accessible hotspots.
For per-stage environmental restoration, author/register seven local scene regions first, then validate each0/1/2/3 state. This pack is not a claim that those masks already exist.
Never show the entire completed environment when just one place finishes. Avoid global grayscale-only progression. If using the initial map until completion, be explicit that detailed stage changes are shown in the selected place preview; document that visual limitation.
Do not build a fake animation that changes a state before materials/coins are committed.

## Composition
Map coordinates are approximate, measured against full uncropped portrait:
landing(18,70), steps(46,59), cottage(32,40), workshop(74,45), records(29,23), lighthouse(78,21), relay(56,23).
Crop/contain changes require coordinate remapping. At360px labels must not sit on top of one another. Prefer numbered/accessibly labelled pins only on selection, not persistent badges on every building.
One boat remains at the arrival landing throughout the chapter. Do not invent a second departure boat or visually launch it at chapter end.

## Runtime export proposal
Keep PNG masters in art-source. Implementer may export WebP with alpha:
sprites512–768px, story and map1024px wide as a starting point; inspect at intended display resolution.
Do not preload every 1280px sprite into the merge board. Lazy-load chapter art; preload only selected place/current map.
No external dependencies or font downloads required.

## Motion
Restore highlight450ms; sprite crossfade220ms; no map shake.
Lighthouse beam once1500–2000ms on milestone, optional skip. Reduced motion uses final still.
Never flicker the beacon at seizure-risk frequencies.
Story card itself scrolls if needed; safe-area padding and a reachable44px close/continue action.

