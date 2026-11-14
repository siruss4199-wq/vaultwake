# Vaultwake Merge: complete commercial gameplay audit (2026-11-12)

**This is an audit only.** No code, artwork, save or release change was made. The audited build is the current Basic Launch candidate, `claude/v5-order-details-sheet` @ 822a8f9. The game files are identical at f9da3ff.

**How it was checked**
- **The live build:** where findings differ, the live CrazyGames build (664956e) is checked as well.
- **Labels:** every statement carries one of three labels.
  - **[F] Verified fact:** measured in this audit, with its source (file:line, command, screenshot or log).
  - **[J] Design judgment:** the reviewers' opinion; not measured.
  - **[H] Hypothesis:** a plausible cause or effect that needs player data to confirm. Nothing marked [H] is a promised gain.

**Evidence:** `docs/evidence/v5-commercial-audit-2026-11-12/`
- `1-first-10-minutes-390x664.jpg`: 15 frames from a fresh camp.
- `2-desk-907-board.jpg`, `2-desk-1280-board.jpg`: desktop.
- `session-run2.json`: the full timeline, snapshots every 30 s, every popup, and the SDK calls.

**Method**
- **Fresh-camp session:**
  - the CrazyGames page (`v5/coast-crazygames.html`) at 390×664 in Chromium, with a stand-in SDK, normal motion and real wall-clock time;
  - real finger taps and drags through the UI, with no virtual time or injected resources;
  - pacing: 3.5 s to read Home and each story page, 1.5 s of thinking before each action (+2 s the first time), 3.5 s per story beat.
  - **Player model:** the player follows the first-player guide (`v5/next/coach.mjs`), then the repo's scripted competent policy (`tests/v5-next-policy.mjs`). This approximates a focused player who understands the game. A confused first-time player will be slower, so the timings below are a *best case*.
- **Economy simulations:** `node tests/v5-next-energy-metrics.mjs` and `node tests/v5-next-difficulty-metrics.mjs`, 10 seeds each, at 4–10 s per action.
- **Reading:** the game data and code (`v5/next/game.mjs`, `areas.mjs`, `coach.mjs`, `app.mjs`, `sfx.mjs`, `haptics.mjs`, `platform-cg.mjs`, `../feedback.mjs`) and the design gate `docs/V5_FIRST_SESSION_DESIGN_GATE_2026-10-21.md`.
- **Desktop:** 907×510 (the CrazyGames embed size) and 1280×720.
- **Not done:**
  - no human playtest;
  - no real iPhone or Android device in this audit;
  - no access to CrazyGames' per-session data.

---

## 1. Commercial readiness verdict

**Verdict: iterate. Technically sound, but not yet commercially competitive.**

**[J]** The core loop is correct and fast: merge → order → coins and materials → restore a place on the coast → next objective. In the measured session it gives a first restoration at **1:40**, which is a strength many merge games do not have. The game does not lose players because it is broken.

**[J]** It loses them because:
- **The first 20 seconds ask for two taps and three story pages before anything is playable.** The first screen of play is a board that is **92% crates and ice**: 45 of 49 cells.
- **After the guide, the game is one chain for ten minutes.** Copper offcut → Grip tool → Split spanner → Pocket winch, with almost no visible decision.
- **Feedback is frequent but flat.** There are 32 popups, toasts and dialogs in 10 minutes, roughly one every 19 s. The rewarding moment (the coast changing) is covered by a story card.

The 2026-11-11 analytics fit this picture (section 2), but they predate the latest mobile fixes, so they are not proof of the current build's performance.

**Before any wider promotion:**
- **The P0 list (section 10):** make Home → board one tap, open up the board, add a second goal or chain early, and one strong restoration reveal.
- **A small human playtest** against the criteria in section 13.

---

## 2. Player data: what it says and what it does not

**The funnel.** Live build 664956e, CrazyGames Basic Launch, figures as provided by the owner.

| Step | Count | Of the step before | Of visits |
|---|---|---|---|
| Impressions | ~14,000 | | |
| Visits (CTR 1.3%) | 189 | 1.3% | 100% |
| Playing started | 76 | 40% | 40% |
| Played 1+ minute | 30 | 39% | 15.9% (matches the stated "gameplay conversion 15.87%" = 30 / 189) |
| Played 10+ minutes | 4 | 13% of 1+ min | 2.1% |

Average playtime: 2 m 50 s. Crash rate: 1.14%.

**Verified facts that explain how the numbers are counted**
- **[F] "Playing started" only counts players who pressed Play on Home.** The game reports `gameplayStart` only when Home is closed (`v5/next/app.mjs:1323`, `!homeOpen`). In the session, `gameplayStart` fired 16.3 s after the page opened, after the Play tap, during the story (`session-run2.json`, field `cg`). **60% of visits (113 of 189) never reached that point.** They left during loading, on Home, or before pressing Play.
- **[F] `gameplayStart` is sent twice when play begins.** It fired twice at 16.3 s in the session. The cause is that `platform.setPlaying` checks `playing` before an `await` and sets it after (`v5/next/platform-cg.mjs:36`), so two calls in the same tick both pass. This does not explain the drop, but it makes "playing started" and playtime figures less trustworthy. **[H]** CrazyGames may count a session's play time from the first or last call.
- **[F] Download before `gameplayStart`:** 2.9–3.3 MB (Chromium 2.86, WebKit 3.29, Firefox 2.86; CI run 43061281277). That is small for the platform.
- **[F] Home is the first thing a visitor sees**, with one button (Play). Before the board, a new player sees three story pages, about 13 s (`session-run2.json`: Play at 6.4 s, board at 19.2 s).

**Hypotheses for the early drop (not proven; to test)**
- **[H] Visit → start (40%).** The Home gate (an extra decision before play) and the load time on slower connections cost most of these visitors. CrazyGames' own Basic Launch guidance asks games to start gameplay directly. The release checklist in `.claude/skills/release-check` repeats this ("goes straight into gameplay").
- **[H] Start → 1 minute (39%).** Players who press Play spend about 13 s on story text. They then land on a board where nearly everything looks locked, with a 3-card order rail, a gold strip, a guide line, a shed, a selection panel and footer buttons all visible at once.
- **[H] 1 minute → 10 minutes (13%).** After the guide ends (about 1:55), the game is the same Rivet Rover chain. There is no second generator and no visible choice for the rest of the first 10 minutes. Popups keep interrupting it.
- **[H] CTR 1.3%.** The cover art and title do not convey a merge game strongly enough on the CrazyGames grid. This audit cannot test that, because cover performance needs A/B data from CrazyGames.
- **[H] Crash rate 1.14%.** With 76 starts, that is about 1 session. A likely candidate is the uncaught SDK-getter exception fixed in 57y: the live build plays a sound by reading `SDK.game` before the SDK is initialised. This is unproven on live. No page error occurred in this audit's sessions on 822a8f9.

---

## 3. Evidence-based first-session timeline

Fresh camp, 390×664, 822a8f9, human-paced; times are seconds after the page opened (`session-run2.json`). Each beat is checked against the four questions: what am I doing, why, what did I achieve, what happens next.

| Time | What happened [F] | Clarity [J] |
|---|---|---|
| 0–1.6 | Page loads; Home shows the logo, Vault-door art and **Play**. Loading is instant locally; live load time was not measured. | ✅ Attractive. ❌ No gameplay visible. An extra decision. |
| 6.4 | Play tapped. Three story pages: "An unsigned letter…", Bram on the seal, Ivo "First, let's clear a landing". | ⚠️ Pleasant, but 13 s of text before any play. The player does not yet care who sent the letter. |
| 19.2 | **The board appears.** 49 cells: **27 crates, 17 tideglass, 1 generator, 4 empty** (`fresh()`, `game.mjs:337`). Hint: "Tap the Rivet Rover for a part", with a pointing hand. Three order cards, a gold strip "Clear the landing path · 0/40", the energy pill reading "100 / 50 · +50 bonus", coins 0, level 1. | ⚠️ *What am I doing*: clear (the hand). *Why*: weak. ❌ The board reads as "everything is locked". The energy pill reads as over-full or broken. |
| 21.6 | First tap: a Copper offcut. | ✅ |
| 28.2 | **First merge**, guided by a drag hand. A toast says "Tideglass cracked · 1 of 3". | ✅ Fast. ⚠️ The ice rule arrives with the first merge. |
| 34.4 | Toast: "New: Split spanner · in the book +2 coins". | ⚠️ Introduces the Book before the player has finished an order. |
| 39.0 | **First crew order delivered** (+10 coins, +1 energy, +15 first-order energy). | ✅ Clear. ⚠️ "+15 energy" means little: energy is never short. |
| 59–71 | Toast "New: Pocket winch"; Level 2 toast ("Level 3: Triple merge"). | ⚠️ A new rule promised before the basic loop has landed. |
| 80.0 | **Gold order delivered:** "Materials secured · +70 coins". Coast strip turns "Ready to build". | ✅ |
| 85–100 | Coast screen opens on the place, with "Build · 40" and a "Tap to build" hand. Two story beats, "First stage +20 energy", a stage toast. | ✅ *Achievement*. ❌ The changed place is behind the story card, so the before/after is barely visible (frames 8 and 11–14 of the evidence sheet). |
| 100.3 | **Daily gift dialog opens by itself** on the player's return to the board. | ❌ Interrupts the first success with an unrelated reward. |
| 113 | The guide ends; the player is on their own. | ⚠️ *What next* comes from the strip ("Lay a boardwalk") and the hint line, which now cycles "Tap Rivet Rover… / Drag a Grip tool onto its twin". |
| 161 | Toast: **"The board is full."** Free cells 2–3 between 150 and 240 s. | ❌ Congestion at 2.5 min, with three quarters of the board still unopenable. |
| 189 | Level 3, "Triple merge" unlocked; energy capacity 50 → 60. | ⚠️ New mechanics while the player is still learning the basics. |
| 277 | Restoration 2, "Lay a boardwalk". Gives a second Rivet Rover to merge. | ✅ Good reward: a generator upgrade. |
| 279 | Level 4; "Rivet Rover extras unlocked (rare Bolt)". | ⚠️ Third new rule in 90 s. |
| 328 | Restoration 3, "Pitch the camp tent". | ✅ |
| 328–605 | **4.6 minutes with no restoration**, 2.2× longer than the previous gap. Making the next gold order's Lv4–Lv5 parts is the same chain again. | ❌ Pacing spike, and repetitive. |
| 605 | Restoration 4, "Line the path with lanterns". Level 6. | ✅ |

**Over 10 minutes**

| Measure [F] | Value |
|---|---|
| Actions | 200 (76 generator taps, 71 merges, 8 deliveries, 4 builds, 10 Book, 4 crates, 4 unseals, 8 shed) |
| Restorations | 4 |
| Orders delivered | 8: 2 crew, 6 gold |
| Level reached | 6 |
| Energy | 100 → 155. It never limited play: the lowest was 97 at 30 s. |
| Generators on board | **The Rivet Rover only**, merged to Lv2. The Survey Kite never appears. Simulations put it at 14–18 min (`v5-next-difficulty-metrics`, `kiteMed` 14.0–17.6 at 4–5 s/action). |
| Crates and ice | 27 crates and 17 ice → 23 crates and 7 ice. The board is still ~63% obstacles at 10 minutes. |
| Popups | 22 moment toasts, 6 energy notes, plus coast, story-beat, daily and book dialogs: 32 in total. |
| Page errors | 0 |

**Answers to the four questions after the guide (minutes 2–10) [J]**
- **What am I doing?** Partly clear: the hint line says what to tap or drag.
- **Why?** Weak. The hint never names the goal. The order cards and the strip do, but they compete with each other (section 4).
- **What did I achieve?** Clear for restorations (story beat plus toast). Unclear for everything else: Book coins, level-ups and energy notes all look alike.
- **What happens next?** Clear only through the strip's next place name; there is no sense of a larger goal in reach.

---

## 4. Top 10 gameplay and UX problems

Ordered by expected player impact [J]. Each is supported by the evidence noted.

1. **The game does not start with play.**
   - [F] Home (one Play button) and three story pages come first: the board appears at 19 s; `gameplayStart` only fires after Play (`app.mjs:1323`).
   - [F] 60% of visits never fired `gameplayStart`.
   - [H] This is the largest single loss.
2. **The opening board reads as locked and busy.**
   - [F] It has 45 obstacles in 49 cells: 27 crates and 17 tideglass.
   - [F] 22 of the 27 crates can only be opened with Survey Kite or Rope Winch parts (`game.mjs:300-322`), which arrive after 14+ minutes.
   - [J] The crates are drawn at full size and full saturation, as loud as the parts the player makes.
3. **Board congestion at 2.5 minutes.**
   - [F] "The board is full" at 161 s, with 1–3 free cells between 150 and 240 s.
   - [J] The player is asked to manage space (shed, clear) before they have learned what is worth keeping.
4. **One chain for the first 10–18 minutes.**
   - [F] All 76 taps went to the Rivet Rover.
   - [J] There is no early variety or choice. Gold and crew orders ask for the same five parts at different tiers.
5. **Too many simultaneous goals.**
   - [F] At the start there are three crew order cards, the gold strip, the guide line and the selection panel. The design gate asks for "one live order" at the opening and at most two after the first repair (gate §5).
   - [J] After the guide, nothing ranks them, and three crew orders stay open for minutes while the gold orders are what move the coast.
6. **Interruptions.**
   - [F] 32 popups in 10 minutes.
   - [F] The Daily gift dialog opens automatically right after the first restoration (`app.mjs:912`, `offerGift`).
   - [J] Small events (a new part in the Book, +energy) get the same toast as big ones, so none feel special.
7. **Restorations are not shown.**
   - [F] The coast change happens behind the story beat card (evidence frames 8, 11, 12, 14).
   - [J] The game's best reward (the coast visibly changing) is underplayed. The player reads text instead of seeing the change.
8. **New rules arrive too early.**
   - [F] Each arrives with its own toast: tideglass at 28 s, Book at 34 s, Triple merge promised at 71 s and unlocked at 189 s, energy capacity at 190 s, the rare Bolt at 279 s, Tide tokens at 406 s.
   - [J] This is a lot of systems for a casual first session; none of them is needed to enjoy minutes 2–5.
9. **Energy is meaningless.**
   - [F] It runs from 100 to 170 against a capacity of 50/60/70. Simulations show no energy-out in the first 20 minutes (`outs20` 0). The HUD reads "100 / 50 · +50 bonus".
   - [J] The pill confuses and creates no tension. Energy rewards (+15, +20, +10) feel worthless.
10. **The desktop layout wastes the screen.**
    - [F] At 1280×720 the board is 380 px wide in a narrow centre column and the page scrolls (952 px tall).
    - [F] At 907×510 (the CrazyGames embed) the two-column layout works well: a 486 px board.
    - [H] Many CrazyGames sessions are desktop full-screen, which shows the weaker layout.

---

## 5. Board visual design audit

**What works [J]**
- **Painted items:** consistent, readable silhouettes at 49–66 px.
- **The generator:** distinct (a yellow vehicle with a ⚡ mark).
- **Selection and match states:** clear (green inset for twins, orange for the selected part).
- **Theme:** the coastal palette is warm and inviting.

**Problems**
- **[F] Obstacles dominate.**
  - 27 crates drawn as three large, saturated objects (wicker bag, barrel, brass chest) and 17 parts inside light-blue ice frames.
  - [J] At first glance the board is 45 equally loud objects. The player cannot tell crates (obstacles), ice (locked parts) and parts (usable) apart in under a second.
- **[F] Ice parts look like real parts.**
  - The part inside is drawn at full colour; only a thin blue frame marks it as locked.
  - [J] New players will try to drag them.
- **[J] Crates do not say how they open.**
  - The key part shows only when it matters (`app.mjs`, `keyReady` and `deep`).
  - The look of a crate (bag, barrel, chest) maps to a generator: `CARGO_LOOK`, `chains.mjs:102`. That mapping is never explained.
- **[J] Every tile shares one tone.**
  - The beige grid with alternating cells makes items, obstacles and empty space all sit on the same tone.
  - There is no "play area" versus "locked area" distinction.
- **[J] Background motion is low:** the generator's bob and the key pulses are small. This is good and should stay calm.

**Proposed direction [J] (art changes need approval)**
1. **Fog the locked area.**
   - Crates the player cannot open yet (generator not unlocked) sit at about 45% saturation, slightly smaller, on a muted sand tone, under one soft "fog" or tarp texture.
   - When a crate becomes openable, it wakes up to full colour.
   - This uses the existing art plus a CSS filter, with no new assets.
2. **Make the camp area brighter.** The centre cells keep the warm tile. The surrounding rings get a cooler, darker tile, so the player's working space is obvious.
3. **Make ice look like ice.**
   - The part inside is desaturated and blurred, with a frost overlay and a crack counter.
   - It returns to full colour only when freed.
   - The painted ice art already exists (`ice-0/1/2.webp`); the change is presentation.
4. **One highlight language.**
   - Gold for "the next thing to do"; green for "twins".
   - Nothing else glows during normal play.
   - Excitement is saved for merges of Lv4+, rare drops and restorations (section 7).
5. **Keep the coastal identity:** the same painted items, the same palette, and coast scenes as the reward display.

---

## 6. Merge satisfaction assessment

**What exists today [F]**
- **Merge:**
  - a 0.2 s "pop" scale on the result (`coastal.css:160`, `cbPop`);
  - a 6-particle burst, or 11 for important merges (`feedback.mjs:24`);
  - a synthesised "knock + pentatonic note" sound pitched by tier (`sfx.mjs:73`);
  - a 12 ms haptic pulse (`haptics.mjs:31`).
- **Discoveries:** a bell sound plus a "New: X" toast. This happens for every first part of tier ≥2 (`app.mjs:657`).
- **Generator tap:** a part flies from the generator to its cell (`app.mjs:616`).
- **Delivery:**
  - the parts fly to the card and 2–7 coins fly to the counter;
  - the coin pill bumps and the strip pulses (`app.mjs:681`, `deliverSequence`).
- **Restoration:**
  - a 1.3 s build animation on the coast;
  - then the story beat dialog, a "milestone" arpeggio and a 3-pulse haptic.

**Assessment [J]**
- **Mechanically correct, emotionally flat.**
  - Every merge looks and sounds nearly the same from Lv1 to Lv5: same particle count, same pop, a slightly higher note.
  - In the genre's leading games, the result item visibly "lands": items snap together, the new tier scales up with a short overshoot, and higher tiers get a brief reveal. Big merges feel bigger.
- **The merge is not physical.**
  - There is no snap or magnet as the dragged part reaches its twin, and no squash on contact.
  - The ghost simply disappears and the result pops.
- **Sound is the weakest layer.**
  - The procedural synth cues are clean but thin on phone speakers.
  - There are no tactile samples (wood, metal, rope) that match the coastal tools.
- **Combos.**
  - **[J] Do not add a combo system now.** The game's pace is order-driven, and a combo meter would add noise without a decision.
  - The existing Triple merge (level 3) is the right "skill" layer, but it should arrive later (section 8).

**Smallest changes that would raise satisfaction [J]**
- **Snap:** a short magnet snap (80–120 ms) when the dragged part is over a twin.
- **Lift:** a tier-scaled "lift and settle" for the result: Lv1–2 subtle, Lv3–4 with a soft ring, Lv5+ with a short reveal.
- **Sound:** two or three layered material samples per family, or a richer synth patch.
- **Haptics:** tier-scaled vibration (merge 8 / 12 / 18 ms).

All are presentation only; no rules change.

---

## 7. Celebration and reward redesign proposal

**Every celebration in the first 10 minutes today [F]** (counted in `session-run2.json`)

| Event | Current feedback | Count in 10 min |
|---|---|---|
| Merge | pop, 6 particles, note, 12 ms haptic | 71 |
| New part (tier ≥2) | toast "New: X · in the book +N coins" and a bell | 4 |
| Tideglass crack / break | toast (first time), crack or shatter sound, ice burst | 1 toast |
| Crew order delivered | parts and coins fly, toast or hint line | 2 |
| Gold order delivered | "Materials secured · +N coins" toast, strip flips to Ready | 6 |
| Level up | toast "Level N! …" plus an energy note | 5 |
| Energy capacity / first-order / stage energy | energy note | 6 |
| Restoration | coast build animation, 2-page story dialog, stage toast, energy note | 4 |
| Daily gift | modal dialog | 1 |
| Board full | toast | 1 |

**The problem [J]:** about 30 messages, mostly the same toast style, so the player cannot tell routine from milestone. The restoration's visual payoff is hidden behind a dialog.

**Proposed three-tier system [J]** (presentation only; the same events and rewards)

| Tier | Triggers | Feedback | Interrupts? | Max length |
|---|---|---|---|---|
| **Micro** | Lv1–3 merges, generator taps, crate opened, ice crack, Book tick-off | Snap, tier-scaled pop, material sound, light haptic, small "+N" floating number. **No toast.** | Never | ≤0.4 s |
| **Medium** | Lv4+ merge, first-ever part (once, small), rare Bolt or notes drop, crew or gold order delivered, generator upgrade | Item "reveal" (lift, rim light, name tag under the item for 1.5 s), coins or materials fly to their real destination (the coin pill, or the strip's place thumbnail), one sentence in the hint line: "Materials secured: the boardwalk can be built". | Never blocks input | ≤1.5 s |
| **Major** | Restoration stage, new generator, new area, chapter end | **Full-screen coast reveal:** the camera centres on the place, the before art cross-fades to the after art (both exist), a short sparkle, the place name and stage dots fill, then **one** character line in a small caption (not a modal card), then a single "Next: <next place>" button that returns to the board. Story text remains in the Book for players who want it. | Yes, once, skippable | 2.5–4 s |

**For each tier the player must see**
1. **What was accomplished:** the item, order or place.
2. **What was earned:** coins, materials or the item.
3. **What changed:** the coast picture, the strip, the generator level.
4. **What to do next:** the hint line names the next goal.

**Remove or merge**
- **Daily gift:** offer it from the Gift button and the next Home visit, never as an automatic modal during play.
- **Small notes:** merge energy notes and level-up notes into the Medium tier, with no separate toast for "+10 energy".
- **Board full:** show it once as a hint-line state, not a toast.

**Avoid:** confetti on every order, long glow loops, screen shake for routine events, and popups that need a tap to dismiss after routine actions.

---

## 8. Gameplay economy and retention findings

**Verified numbers [F]**
- **Start:** energy 100 with refill capacity 50 (`game.mjs:44`, `energy.mjs:14`); +1 energy every 2 minutes up to capacity.
- **Energy income in 10 minutes:** first crew order +15, first stage +20, each restoration +10, level-ups +5/+5/+5/+15, capacity milestones +10/+10, daily gift +10.
- **Energy never ran low:** 97 at its lowest, 170 at its highest. Simulations: 0 energy-outs in 20 min, `waitShare` 0.
- **First orders:** Grip tool Lv3 ×1 (10 coins); Split spanner Lv4 ×1 (25); Grip tool + 2 Copper offcuts (20) (`game.mjs:358`).
- **First restoration:** "Clear the landing path", 40 coins plus the gold order's materials (`areas.mjs:39`). The next stages in the order the session built them: boardwalk 70, tent 80, lanterns 100 (plus a rare Gear part), then 100–120.
- **Second generator:** the Survey Kite needs the Rivet Rover at level 3 (`game.mjs:243`), which needs two Rover copies from restorations (boardwalk, lanterns). Measured at 14–18 min in simulation; not reached in the 10-minute session.
- **Simulated first 15 minutes** (4–5 s/action): first order 1.1–1.3 min; first restoration 3.8–4.8 min (the session was faster, 1:40, because of the guide's short path); 3–5 restorations; 5–10 orders.
- **Rare items:** the first rare gold goal (a Gear for the lanterns) appears around 6.7–8.4 min in simulation. The first rare Bolt unlock came at 279 s in the session.

**Findings [J]**
- **The first 90 seconds are already well paced.** Do not slow them down.
- **Energy is not part of the early game.** That is fine for retention, but then:
  - the HUD should not lead with it (the "100 / 50 · +50 bonus" pill);
  - early rewards should not be energy-flavoured, because "+15 energy" means nothing to someone who has 112.
- **Variety, not difficulty, is the problem in minutes 2–10.** The Kite at 14–18 min is too late.
  - The smallest fix uses existing content: give the second generator earlier. For example, make stage 2's existing "copy" reward the Kite (no new system), or lower the Kite's unlock to Rover Lv2. This needs approval; it changes the progression data, not the save format.
- **The gap after restoration 3 (4.6 min) is the first pacing spike.** It is 2.2× the previous gap. The next gold orders ask Lv4–Lv5 Rover parts while the board is still crowded.
- **Crew orders are optional and feel unrewarding.**
  - They pay 10–25 coins against stages costing 70–120, while gold orders pay 35–70 coins plus materials.
  - In the session only 2 crew orders were delivered in 10 minutes.
  - [J] Either make the crew cards visibly secondary (smaller, one at a time early) or make each one fund a visible part of the current stage.
- **No deadlocks.**
  - [F] Simulations report `deadlock` 0 and `starveMax` 0.
  - [F] The 10-minute session never ran out of a legal action.

---

## 9. Technical and analytics risks

| Risk | Status | Evidence |
|---|---|---|
| `gameplayStart` sent twice at the start of play | **[F] Bug.** Low severity, but it pollutes analytics. | `platform-cg.mjs:36` (the guard checks `playing` before an `await`); session `cg` list |
| Funnel blind spot: Home and story are outside "playing" | **[F] By design** | `app.mjs:1323` |
| SDK-not-ready exceptions (Build/Details dead, uncaught errors) | **[F] Fixed in 822a8f9**, still present in live 664956e | PR #103; `tests/v5-next-sdk-not-ready-browser.cjs` |
| Tap flicker: full-board re-render (~80 images per tap) | **[F] Fixed in 822a8f9**, still present in live 664956e | `tests/v5-next-tap-flicker-browser.cjs` |
| Coast screen's × scrolls away | **[F] Fixed in 822a8f9** | `tests/v5-next-coast-back-browser.cjs` |
| Crash rate 1.14% | **[H]** Probably the SDK-getter throw on live. Unverified: needs CrazyGames' error logs. | — |
| Save and reload (Data Module, fallback, slow SDK) | **[F] Passes** in Chromium and WebKit on the ZIP | CI run 43061281277 |
| Payload before play | **[F]** 2.9–3.3 MB | same run |
| Console and page errors in a 10-minute session | **[F] None** | `session-run2.json` `errors: []` |
| Desktop 1280×720 layout scrolls; board 380 px | **[F]** | `2-desk-1280-board.jpg` |
| No real-device data in this audit | Gap | The owner's iPhone checks only |

**Instrumentation gaps [J]**
- The game has a local playtest log (`v5/next/playtest.mjs`) but sends no first-session milestones to CrazyGames.
- With Basic Launch, the only signals are CrazyGames' own. The cheapest improvement is to make `gameplayStart` mean "board shown". Then "played 1 min" measures the game, not Home.
- Any further event tracking needs the owner's approval and must respect the platform's rules.

---

## 10. Proposed first 90 seconds

The existing guide's path is kept: Rover tap → merge → crew order → gold order → first restoration. Its timings already fit within 90–100 s (section 3). The changes remove friction around it, not steps from it.

| Time | Player sees and does | Change from today |
|---|---|---|
| 0–3 s | The page opens **directly on the board** (a returning player too). A one-line caption over the coast strip reads "Clear a landing for your crew." | Home and the three story pages move to the Menu and Book, reachable at any time. The letter is shown later (see 60–90 s). |
| 3–10 s | Board: the camp's 3×3 centre is bright; the rings are fogged. **One** crew order card is shown: "Ivo needs a Grip tool". A hand points at the Rover. | Two crew cards are hidden until the first delivery (gate §5). |
| 10–25 s | Tap, tap; merge (snap and reveal); the order card fills; tap to deliver. Coins fly to the counter (Micro and Medium tiers). | — |
| 25–60 s | The gold order appears where the second card was, with the place art: "Materials for the landing path". Tap, merge to Lv3–Lv4, deliver. **Materials fly to the strip's place thumbnail.** The strip turns "Ready to build". | No energy toast. The ice cracks silently (Micro), with no toast. |
| 60–90 s | Tap the strip: **the coast reveal** (Major tier). The path appears on the beach. Caption: "Ivo: A path from the boats! Somebody left a crate on it." Below it is a short beat of the letter story ("…and on that crate, the same seal as the letter's"). One button: **Next: Lay a boardwalk**. | The story beat becomes a caption, not a two-page modal. No daily gift popup. |
| 90 s+ | Back on the board, the crate reward lands. Two crew orders appear. The hint line names the next goal. | — |

**Realism check [F/J]:** the measured session reached the first build at 85 s and the end of its story at 100 s with these exact steps. The proposal does not need any economy change to fit 90 s. It only removes about 20 s of Home and story before the board, and the post-build interruptions.

---

## 11. Prioritized improvements

**P0: before any promotion or cover A/B test.** All are presentation or flow changes. None changes saves, rules or the economy.

| # | Change | Fixes | Impact [H] | Difficulty | Regression risk |
|---|---|---|---|---|---|
| P0-1 | Start on the board. Home and story become optional (Menu/Book). `gameplayStart` fires when the board shows. | Problem 1; the funnel blind spot | High (visit → start) | M | Low-Med: Home tests, story-skip flag and returning-player flow need updating; keep the save keys |
| P0-2 | Fix the double `gameplayStart` (set `playing` before the `await`) | Analytics | Low (data quality) | S | Low |
| P0-3 | Fog unopenable crates and frost the ice parts (CSS only); brighten the camp centre | Problems 2 and 3 (perceived) | Med-High (first 30 s) | S-M | Low (visual tests) |
| P0-4 | One crew order card until the first delivery; then two crew and the gold (gate §5) | Problem 5 | Med | M (render only; orders unchanged) | Med: order-rail tests |
| P0-5 | No automatic Daily-gift modal during play; collapse routine toasts into the hint line (Micro and Medium tiers) | Problem 6 | Med | S-M | Low |
| P0-6 | Coast reveal: show the before → after on the coast before the story caption; story as one caption, not a two-page modal | Problem 7 | Med-High (the "why" of the loop) | M | Med: coast and beat tests |
| P0-7 | Ship the 822a8f9 fixes (SDK guard, tap flicker, coast ×) | Crash rate [H], feel | Med | Done; needs upload approval | Covered by CI |

**P1: next, after a playtest confirms P0**

| # | Change | Impact [H] | Difficulty | Risk |
|---|---|---|---|---|
| P1-1 | Second generator earlier: stage 2's reward becomes the Survey Kite, or the Kite opens at Rover Lv2. **Needs approval**: progression data. | High (variety in minutes 3–10) | M | Med: economy sims and saves must be re-run; existing saves keep their board |
| P1-2 | Delay Triple merge, Rare extras and Tide tokens past the second generator; one new rule per restoration | Med | S (data) | Low-Med |
| P1-3 | Merge feel: snap and magnet, tier-scaled reveal, material sounds, tier haptics | Med | M | Low |
| P1-4 | Energy HUD: hide the "/capacity · bonus" detail while energy ≥ capacity; show only the number | Low-Med | S | Low |
| P1-5 | Desktop ≥1100 px: two-column layout, as at 907×510, so the board fills the height | Med (desktop) | S-M | Low |
| P1-6 | Smooth the pacing spike after restoration 3 (cheaper Lv4–Lv5 asks, or a crate gift on restoration 3) | Med | S (data) | Low-Med (sims) |

**P2: polish and growth**
- **Crew orders tied to the current place:** each crew order adds visible progress to the next stage. Needs approval.
- **Cover and thumbnail tests for CTR:** needs CrazyGames tooling.
- **Original sound pass** (sampled materials), then music.
- **A short "previously" caption** for returning players instead of Home.

---

## 12. Recommended staged implementation roadmap

Each stage is its own draft PR. Each needs green Chromium and WebKit CI (fixed 2026-11-11, Playwright container) and the owner's real-phone PASS before any upload.

1. **Stage A: flow and analytics (P0-1, P0-2, P0-5, P0-7).** About 1–2 days.
   - Start on the board; one `gameplayStart`; no automatic modal; ship the 822a8f9 fixes.
   - Measure with CrazyGames for a week. Do not judge before roughly 150+ starts.
2. **Stage B: readable board and orders (P0-3, P0-4).** About 2 days. Screenshots at 360/390/430 px and 907×510; the tap-flicker and coast-back tests must stay green.
3. **Stage C: coast reveal and celebration tiers (P0-6, P1-3, P1-4).** About 3 days. A video comparison before and after.
4. **Stage D: early variety and pacing (P1-1, P1-2, P1-6).** About 2–3 days. Needs the owner's approval of the progression change.
   - Re-run `v5-next-energy-metrics`, `v5-next-difficulty-metrics` and the economy guard tests, plus old-save load tests.
5. **Stage E:** a five-person playtest against section 13, then P2.

---

## 13. Measurable acceptance criteria for future testing

**Automated** (Playwright fresh camp, human-paced script as in this audit, 390×664 and 907×510, Chromium and WebKit)

| Criterion | Today [F] | Target |
|---|---|---|
| Time from page open to the board accepting a tap | 19 s (Home + 3 story pages) | ≤ 3 s after load |
| `gameplayStart` calls at session start | 2 | exactly 1, when the board is shown |
| Empty or openable-looking cells on the first board | 4 empty; 45 obstacles at full colour | ≥ 9 "live" cells (camp 3×3) clearly distinct from fogged cells (visual check) |
| Order cards visible before the first delivery | 3 crew + gold strip | 1 crew card + strip |
| First restoration (guided path) | 85–100 s | ≤ 100 s (do not regress) |
| Blocking dialogs in the first 10 minutes other than restorations | Daily gift, Book | 0 |
| Toast-style messages in the first 10 minutes | 28 | ≤ 10 (Medium and Major only) |
| Distinct generators used by 10 minutes | 1 | 2 (after P1-1, if approved) |
| Longest gap between restorations in the first 10 minutes | 4.6 min | ≤ 3.5 min |
| "Board full" state in the first 5 minutes | at 161 s | none |
| Page errors in a 10-minute session | 0 | 0 |
| Saves: older-save load tests and Data Module tests | pass | pass (unchanged keys and format) |

**Human playtest** (5+ new players, think-aloud, real phones and desktop; [H] targets, not promises)
- After 60 s, a player can say what they are making and why: **4 of 5**.
- After the first restoration, they can say what changed on the coast: **4 of 5**.
- Nobody tries to drag a fogged crate or frosted part more than twice.
- Willing to keep playing at 10 minutes: tracked, no fixed target.

**Live (CrazyGames)**
- Compare 7-day windows before and after each stage.
- Watch visit → start, start → 1 minute and average playtime.
- Treat any change under ~150 starts as noise.
- No retention claim is made until the data exists.
