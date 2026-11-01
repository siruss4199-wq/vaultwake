# Chapter 4 design

## Promise
Follow the light that answered Hidden Harbour. Restore access, learn how the old reply mechanism works, light the headland and decode a stored route.
The player discovers WHAT sent the reply, without learning WHO sent the original letter.
This is a separate headland, not the Landing Beach beacon, Harbour signal tower or Observatory array.

## Structure
Entry requires all Chapter 3 stages; no XP gate, payment gate or fresh board.
Landing 3 -> Steps 3 -> Cottage and Workshop in either order.
Cottage 3 -> Records.
Workshop 3 -> Lighthouse.
Workshop 3 + Records 3 -> Relay stages 1–2.
Relay stage 3 additionally requires Lighthouse 3 and Records 3.
Because these prerequisites cover every place, Relay stage 3 is the chapter finale.
No implicit previous-place order must accidentally block either branch.

## Main objective resolver
Keep the currently selected available project unless completed. After build choose its next available stage; if blocked show exact prerequisite and a real route to it. Allow player to switch between open branches.
Do not present both branches as equally urgent popups. One recommended objective, other available project on map.
Gold materials are stage-specific and fixed. Earned material credits stay tied to that stage when focus changes.
Reuse current objective switching if available. Do not invent extra order slots or destroy partially completed orders.

## Merge purpose
Access uses Rover and Winch. Records use Kite + its secondary notes. Workshop gears use Rover secondary. Lighthouse uses Lens Bench and Kiln. Shell items provide a few supporting tasks to keep established chains useful.
Rare requirements:
- Cottage 3: Expedition note (notes1), 1.
- Workshop 2: Gear assembly (mech2), 1.
- Records 2: Expedition note (notes1), 1.
- Records 3: Travel notebook (notes2), 1.
- Relay 2: Gear (mech1), 1.
No basic Bolt mission loop; no top collectible requests.
This uses only the currently active secondaries. Do not activate Winch/Shell/Kiln secondaries.
Retain at least one primary-only crew order. Gold demand counts toward drop-rest. Preserve the latest bounded rare-goal policy, not a new global drop boost.
If an imported legacy save lacks a usable rare producer, offer existing retrieval/parking/recovery route. Never silently downgrade the fixed recipe.

## Rewards
Primary payoff: a visible repaired structure, the next connected task, four narrative discoveries, a functioning navigation light and a decoded route.
Proposal JSON gives one existing generator kit size 2 on completion of each place. These are OPTIONAL ECONOMY CANDIDATES, not engine-ready effects. Resolve kit family availability and full-board pending handling against current engine.
No extra energy or new coin bonus in this draft. Preserve normal order XP and rewards. Do not stack a second cash reward onto Gold delivery.
Compare kit counts with Chapter 3 before committing: generator copies change pacing even if no new generator unlocks.

## Pacing specification (acceptance targets, NOT measurements)
Compare with the finalized previous chapter, 4/5/8/10 seconds per action, multiple RNG seeds, shop on/off.
Target chapter median active time within 0.9–1.15x Chapter 3; not longer just to inflate content.
First visible restoration within ~3–5 active minutes on a representative chapter-entry save.
Investigate any no-progress interval over 8 active minutes.
Aim material-to-build median <=3 active minutes; investigate p95 >6.
Do not infer rare wait from energy idle alone. Log eligible taps, primary production, actions spent only pursuing rare parts, blocked time, and order age separately.
Measure inventory, pending drops, coin inflow/outflow and target-specific commitments.
Fixed tier-2 recipes must actually appear and complete in bot runs and human-style tests.
Changing recipes/costs is allowed for tuning if documented; inventory-based recipe downgrades are not.

## Story and interaction
Four full cards maximum. Other stage lines appear as a small nonblocking caption.
Arrival card once; no re-intro on reload.
Completion sequence: persist restore -> 0.4–0.7s local highlight -> brief line -> next objective. Never hold saving until animation finishes.
Main light: 1.5–2s single beam sweep, skippable; no flashing loops, reduced motion static glow.
Final relay: a short cam movement and stable chart reveal. No rapid three-long/two-short flashing; communicate rhythm with safe icon pulses/text if needed.
Sound: soft wood/brass repair cue and warm light swell; obey mute. No browser vibration promise on unsupported devices.
Use existing character portraits for Ivo, Bram, Neri and Tamsin. No generated replacement portraits.

## Chapter ending
Headline: The headland answers.
Copy: You restored the light and decoded a route through the reef.
Primary: View the restored headland. Secondary: Return to board.
Show 21/21 for THIS chapter. If showing lifetime total, label it separately and compute from actual area data.
Next chapter teaser is non-actionable until content exists. Never show a fake Sail/Open button.
Keep journal/story replay only if the current build supports it; do not add a new journal system solely for this pack.

