# Vaultwake Merge: First Session 2.0 visual and interaction prototype (2026-11-12, refined 2026-11-13)

**This is a design prototype for final design approval. It is not a production change. No production PR.**

**What is untouched:** the live game, the CrazyGames build, saves, the SDK, the mechanics, the economy, the orders, the 27 crates, the 17 tideglass and the generator progression.

**Where it lives:** one isolated page, `prototype/first-session-2/index.html`, on the branch `claude/v5-first-session-prototype`. Nothing in `v5/` links to it and no release includes it.

**Refinement 2 (2026-11-13): the prototype now plays the real game.**
- The camp is `fresh()` from `v5/next/game.mjs`; every tap, merge, crate, tideglass crack, delivery and build is the game's own reducer `act()`; the hint line is the game's first-player guide `coachStep()` (`v5/next/coach.mjs`); pieces are drawn with `draw()` (`v5/next/chains.mjs`); the "LvN+" tideglass chip is `iceNeed()` (`v5/next/ice.mjs`). All four files are imported read-only and are unchanged.
- So the orders, coin amounts, energy, crate contents and the restoration's costs and rewards on screen are the real ones. The earlier stand-ins (a one-part gold order, scripted merges, ice cracking on any merge) are gone.
- Only the presentation is new: the look, the feedback, the one-card objective, the coast panel and its camera.
- The only set-ups are flags the live app also sets: `seen['coach-on']` (the app sets it on the first action, here on load). `?restore=2` starts from a camp with stage 1 built and the boardwalk's materials delivered (a test fixture, not a saved camp).

**Open it**

| Link | Shows |
|---|---|
| **Preview:** `https://claude-v5-first-session-prot.wispwood-game.pages.dev/prototype/first-session-2/index.html` | Cloudflare Pages branch preview of this branch. CI checks it serves this exact build (see §7). |
| `…/index.html` | The first session, playable on the real rules: tap the Rover, drag twins (or a key part onto its crate), tap the order card, tap the strip, Build. |
| `…?autoplay=1` | The same, played by the game's own guide (`coachStep`) at a fixed video pace (about 39 s; **not** a play-time estimate, see §5). |
| `…?restore=2` | Stage 2 of the landing path with the real art: before (`place-path-1`), Build, after (`place-path-2`), and the Before/After toggle. Add `&autoplay=1` to play it. |
| `…?lab=1&autoplay=1` | The merge lab: one pair for each feedback tier, plus a rare part (a hand-made board, the only non-fresh board). |
| `…?skin=current` | The same board in today's look, for a side-by-side check. |
| `…?w=360&h=640` | On a desktop, the phone frame at another size. On a phone the page is full screen. |

---

## Deliverables

All in `docs/evidence/v5-first-session-2/`.

| # | File | What it is |
|---|---|---|
| 1 | `1-board-current-vs-proposed.jpg` | **Current and proposed first screen.** Same `fresh()` camp: 49 cells, 27 crates, 17 tideglass, 1 generator, 4 empty cells, same art. "Current" is the live game (822a8f9, audit session at 17 s). |
| 1c | `1c-crate-states.jpg` | **Crate states from the real progression** (§1): the fresh camp, where 2 of 27 crates can open, and the board at the gold order. |
| 2 | `2-mockups-390x664.jpg` | Ten mobile screens at 390×664, all on the real rules. |
| 3 | `3-merge-tiers.jpg`, `demo-merge-lab.webm` | **Merge feedback:** snap, then micro, medium, major and rare. |
| 4 | `4-order-complete.jpg` | **Order complete** with no modal: Ivo's order, then the real gold order (Pocket winch ×1 + Split spanner ×2). |
| 5 | `5-restoration-before-after.jpg`, `5b-restoration-sequence.jpg`, `demo-restoration-stage2.webm` | **Restoration before/after with the real place art**, for stage 1 (bare site → `place-path-1`) and stage 2 (`place-path-1` → `place-path-2`), with the Before/After toggle; and the build sequence. |
| 6 | `6-first-session-storyboard.jpg`, `demo-first-session-autoplay.webm` | **The first session to the first restoration**, each beat with its real rule count, the scripted video time and the audited human time, kept apart (§5). |
| 7 | `7-size-matrix.jpg` | 360×640, 390×664 and 390×844 (Chromium; WebKit screenshots are the CI artifact, §7). |
| 8 | This document | The design specification. |

The videos are WebM, 390×664. They play in Chrome, Firefox, Android and recent Safari.

---

## 1. Board: visual clarity (rules unchanged)

**State language.** Five states, each readable in under a second.

| State | Look | Why |
|---|---|---|
| **Movable part** | Full colour, 92% of the cell, soft drop shadow (`0 2px 1.5px #0003`) | The only full-saturation objects in normal play: "these are yours". |
| **Generator** | Gold plate (`#fff1c2 → #f6d77d`, 2 px `#e6b84f` rim). Slow breathing gold ring until the first tap (1.6 s cycle), then still. | Always findable; never flashing. |
| **Crate, ready** (it can open now AND its key part is already on the board) | Full colour, 84% size, key badge with a **gold ring and glow**, a soft gold pulse inside the cell | "Drop that part here." |
| **Crate, reachable** (it can open now; its key is makeable) | Full colour, 84% size, **key badge** (a white disc showing the part that opens it) | It says what to make. |
| **Crate, later** (buried, or its key needs a generator you do not have) | Same art, 74% size, `saturate(.5) sepia(.22) brightness(1.03) contrast(.9)`, opacity .86, **no key** | Calm, warm and still Vaultwake. It recedes without turning grey. Nothing is removed. |
| **Tideglass** | Cool frosted cell (`#eefaff → #cdeef8`, `#8fd3e8` rim). The part inside is desaturated (`saturate(.45)`, opacity .82, 0.3 px blur) under the existing `ice-N.webp` art. **Three crack pips** (one goes hollow per crack). A **"Lv3+"** chip when the glass needs a merge of at least that level beside it (`iceNeed`). | Clearly "locked part"; says how to free it and how far along it is. |

**The crate rule is the game's rule (refinement 1).** The first prototype marked a crate actionable when its key's generator was open (5 Rover-keyed crates). That over-promised: in the fresh camp only **2** of those 5 can be opened, because the other 3 are buried behind crates or tideglass and `act()` refuses them ("this one is buried deeper"). A crate's look now comes from the same functions the reducer uses, after every action:

```
later      unless reachable(s,i) && sourceOpen(s, CHAINS[key.family].gen)
ready      if it can open and a part matching its key (matches) is on the board
reachable  otherwise
```

- Fresh camp: crates 9 (key: Split spanner) and 33 (key: Pocket winch) can open; the other 25 show "later" (`1c-crate-states.jpg`).
- As crates and tideglass open, the crates behind them change state on the next action, so the board always shows exactly what can be opened.
- CI checks every crate's look against these rules at the start and after the first restoration, in both engines and at the three sizes (§7).

**Tiles**
- **Camp 3×3 around the Rover:** warm `#fff4dd` and `#fff8e8`, with a 1 px light inner edge. The player's working area reads first.
- **Outer rings:** `#f0e2c4` and `#e7d6b4`, a slightly cooler sand. Still warm, not grey.
- **Board frame:** teal `#2a8d93 → #1b6c74` with a 6 px rim, which keeps the coastal identity.
- **Highlights:**
  - green `#2fae74` for twins while dragging;
  - gold `#f2b33d` for "the next thing to do";
  - purple `#7b6cf6` only for rare finds;
  - nothing else glows.

---

## 2. Merge interactions

**Feedback by tier** (see `3-merge-tiers.jpg`)

| Tier of the result | Visual | Sound (concept) | Haptic | Length |
|---|---|---|---|---|
| **Drag over a twin** | The ghost **snaps** to the twin's centre (110 ms ease-out); the twin scales to 1.05 with a green ring | A soft click (band-passed noise at 2.6 kHz) | 4 ms | instant |
| **Micro: Lv1–3** | Squash-pop (0.7 → 1.14 → 1, 260 ms, overshoot ease), 6 small sand-gold sparks | A wooden knock (520 Hz noise) plus one pentatonic note pitched by tier | 8 ms | ≤ 0.3 s |
| **Medium: Lv4–5** | Lift and settle (0.6 → 1.28 with a −8% lift → 1, 480 ms), a white ring, 10 sparks, **a name tag** under the part ("Pocket winch · Lv4", 1.5 s) | Knock, note, then a triangle overtone | 14 ms | ≤ 0.6 s |
| **Major item: Lv6+** | Light rays (0.9 s), a gold ring, 14 sparks, name tag | Knock, note, and a three-note shimmer | 18–40–18 ms | ≤ 0.9 s |
| **Rare find** (secondary chains: Bolt, Gear…) | Purple rarity ring around the cell (fades in 1.8 s), lilac sparks, **"RARE · Gear · Lv2"** tag | A high four-note chime and a soft knock | 10–30–10–30–20 ms | ≤ 0.9 s |
| **Ice crack** | The cell shakes 2 px (0.3 s), one pip goes hollow | A short high crack | none | ≤ 0.3 s |

**Rules**
- **Ordinary actions never pop a message.** Taps, Lv1–3 merges, crate opens and ice cracks get no toast and no text.
- **Input is never blocked.** All feedback is presentation only, so the player can keep merging during it.
- **Sound is a concept for a sound designer**, not final audio.
  - The prototype synthesises it with Web Audio (layered knock plus tuned note).
  - Production should use 2–3 short **material** samples per chain (wood, metal, rope) at about −14 LUFS, within 120 ms, pitched by tier.
- **Reduced motion** keeps every state change and removes the movement (the prototype sets durations to ~0 under `prefers-reduced-motion`).

---

## 3. Order and reward presentation

- **One card: the order the guide is about** (the first crew order, then the gold order; the same choice `coachStep` makes). The other live orders stay in the game but are not shown before the first restoration.
  - who asks (face and name) and why ("parts for the landing", "landing path", "boardwalk");
  - **every need on its own chip**: the part, its **Lv tag** and `have/need` in 15 px numbers. The real gold order shows two chips: Pocket winch Lv4 `0/1` and Split spanner Lv3 `0/2`; the boardwalk's shows Pocket winch Lv4 `0/1` and Grip tool Lv2 `0/4`;
  - the reward box: "PAYS ● 70", which turns into "TAP TO Deliver".
  - The whole card is one `<button>` with a spoken label ("Ivo: 0 of 1 Split spanner. Pays 10 coins").
- **Ready state:** the card's rim turns green (`#2fae74`, 3 px halo). The reward box becomes a green **"Tap to Deliver"** button, and the part icon gets a ✓ badge. The card pulses once (scale 1.04, 360 ms).
- **Delivery** (about 1.2 s, no modal):
  1. the part flies from the board into the card (420 ms arc);
  2. a **DONE ✓** stamp lands (400 ms overshoot) with a two-note chime and a 12 ms haptic;
  3. 6 coins arc from the card to the coin counter (560 ms, staggered by 55 ms, a tick each);
  4. the counter counts up and bumps, with a "+10" float;
  5. the card slides out to the left and the next card slides in from the right (450 ms).
- **Gold order:**
  - the same card with a gold rim and the **place picture** as its face ("Materials for the landing path").
  - On delivery the **materials fly to the coast strip's picture**. The strip turns gold ("Materials ✓ · ● 40 — ready to build") with a single light sweep, and its button turns into a breathing **Build**.
- **Order to Build:** the hint line names the next action ("Materials secured. Tap the coast strip to build"). There is no popup.

---

## 4. Restoration celebration (the place stays in view)

The coast opens as a **panel sliding up from the board** (550 ms), not a modal. The **camera zooms 1.75× onto the place** (1.2 s ease-out) and puts it at 45% across and 76% down the map, the lowest point at which the art still fills the map at every size (an empty band showed under the art in the first prototype). CI checks that the art covers the map and the place is fully in view at all three sizes.

**Before and after use the real place art** (`5-restoration-before-after.jpg`):
- **Stage 1:** before = bare sand with a dashed footprint, the path's outline faint and grey, a 🔨 pin; after = `place-path-1.webp` in full colour.
- **Stage 2:** before = `place-path-1.webp` (the stone path the player built); after = `place-path-2.webp` (the boardwalk).
- After the reveal, a **Before / After** toggle (two 44 px buttons) swaps the two pictures in place, with a "Before"/"After" label on the map. Nothing else moves.

| Step | Time | What the player sees |
|---|---|---|
| 1 **Before** | 0 s | The place's ground: a dashed footprint, the stage sprite desaturated and darkened, a 🔨 pin. Below: "New place · stage 1 of 3", "✓ Materials · ● 40", **Build · ● 40**. |
| 2 **Build action** | tap | 6 coins fly from the counter to the place, and the counter counts down. |
| 3 **Construction** | +0.6 s | A dust cloud and three knocks (the sprite bounces 3× in time with three wooden knocks; haptic 12–250–12–250–16). |
| 4 **Transition** | +1.6 s | A white flash at the place. Before cross-fades to after, which pops in (0.7 → 1, 700 ms overshoot). 16 sparks, a gold ring, a warm four-note chord and a 16–60–28 haptic. **Colour blooms out from the place** across the map (radial mask 0 → 46%, 1.5 s). |
| 5 **After** | +2.4 s | A title chip drops onto the map, *over the sky, never over the place*: "Landing path cleared ●○○". |
| 6 **Reward and next** | +2.9 s | Below the map, **one caption**: Ivo's face and his line (from `areas.mjs`), plus the second line in smaller text. Reward chips from `act()`'s effects: stage 1 "⚡ +20" and "Driftwood crate"; stage 2 "⚡ +10" and "Rivet Rover". The Before/After toggle. Then a single **Next: Lay a boardwalk →** button. |
| 7 **Back** | tap | The panel slides down. The reward (the crate, or the new Rover) flies from the strip to the cell `act()` put it in and lands with a medium pop. The strip shows the next stage, and the next gold order slides in. |

**What changes against today's game**
- **Story is kept**, but it moves into the caption under the map, so it no longer covers the place.
- **No daily-gift popup** follows.

---

## 5. The first session, validated on the real rules

**Start → Merge → First order → Gold order → Coast restoration → Next objective** (`6-first-session-storyboard.jpg`)

Three kinds of number, never mixed:
- **Rules:** what the game's reducer does from a fresh camp. Identical in every run so far (6 runs: Chromium and WebKit × 3 sizes in CI, plus local runs), because the guide's path draws no rare part before the first build.
- **Scripted:** the autoplay video's clock (480 ms between steps, effects at full length). It shows the presentation; it says nothing about how long a person takes.
- **Human:** the commercial audit's paced session on the live build (`docs/V5_COMMERCIAL_AUDIT_2026-11-12.md`, run2, 390×664, 822a8f9). It is the real-time reference for these same steps; it includes the live game's Home and story pages (about 13 s before the board).

| Beat | What happens (real) | Rules: taps · merges | Scripted | Human (audit) |
|---|---|---|---|---|
| Start | The board. Ivo's caption. Order: Ivo, Split spanner Lv3, pays 10. | 0 · 0 | 0 s | board at 17 s |
| First tap | The Rover makes a Copper offcut (−1 energy). | 1 · 0 | 2 s | — |
| First merge | Twin on twin; the guide's line moves on. | 2 · 1 | 4 s | — |
| First order | Delivered: +10 coins, +1 energy, +15 first-order energy (112). | 4 · 2 | 9 s | 39 s |
| Gold order | Pocket winch Lv4 ×1 + Split spanner Lv3 ×2, pays 70 + the path's materials. | 4 · 2 | 10 s | — |
| Materials | Gold order delivered: coins 80, strip turns gold "Build · 40". | 12 · 11 | 28 s | 80 s |
| Restoration | Coast; Build: −40 coins, +20 energy (129), a driftwood crate. | 12 · 11 | 33 s | coast 85 s, built 100 s |
| Next | Next gold order (boardwalk): Pocket winch Lv4 ×1 + Grip tool Lv2 ×4, pays 40. | 12 · 11 | 39 s | — |

**What this means**
- The first restoration costs **12 taps and 11 merges**, with no energy wait (energy never drops below 96). The prototype changes none of that.
- The time a person needs is the audit's: about 80 s to the materials and 100 s to the build on the live game. Starting on the board (no Home and story pages) removes about 13 s of that; the rest is the player's own pace. **No shorter time is claimed** until a timed test with people.
- The earlier storyboard's "0–90 s target" timings are withdrawn: they were a target, not a measurement.

**What stays the same**
- The story content: the opening caption (folds into 📜 on the first tap), the restoration captions from `areas.mjs`.
- Orders, coins, energy, crates and stages: the reducer's.

---

## Colour and motion tokens

| Token | Value | Use |
|---|---|---|
| `--sea-deep` | `#0f4c5c` | Headings and hint text |
| `--sea` | `#1f8a8f` | Primary buttons, level chip, board frame |
| `--sand-warm` / `-2` | `#fff4dd` / `#fbe7bf` | Camp tiles, cards |
| `--sand-cool` / `-2` | `#f0e2c4` / `#e7d6b4` | Outer tiles |
| `--gold` | `#f2b33d` | Coins, "next thing", generator |
| `--coral` | `#f2663e` | Build only |
| `--green` | `#2fae74` | Ready, twins, DONE |
| `--rare` | `#7b6cf6` | Rare finds only |
| `--ice`, `--ice-rim` | `#d7f3fb`, `#8fd3e8` | Tideglass |
| `--t-micro` / `--t-medium` / `--t-major` | 260 ms / 900 ms / 3.2 s | Feedback tiers |
| `--ease-pop` | `cubic-bezier(.3,1.6,.5,1)` | Landings and stamps |
| `--ease-out` | `cubic-bezier(.2,.8,.3,1)` | Panels and cards |

## 6. Touch targets, safe areas and accessibility (refinement 4)

- **Every button is at least 44×44** and the finger at its centre lands on it: the 📜 story button and the coast × (44×44), the order card (whole card, ≥ 86 px tall), the strip's View/Build (72×44, the whole strip is one button), Build and Next (52 px tall), the Before/After toggles (64×44), and the reviewer bar's links (44 px). CI measures each visible button on every screen it reaches.
- **iPhone safe areas:** `viewport-fit=cover`, and `env(safe-area-inset-*)` pads the board screen, the story caption, the coast header and the coast sheet.
- **Readable at 360 and 390:** HUD numbers 17 px bold tabular; order counts 15 px; the hint 14 px bold in `#0f4c5c` on the sand; names 15 px. At 360 px the whole 7×7 board, the HUD, the order card, the strip and the hint fit on one 640 px screen with no scrolling (checked in CI).
- **Names for assistive tech:** every button has a label ("Back to the board", "Story so far"; the order card reads out its needs and reward). Board cells are a `grid` with a label per cell ("Crate: opens with a Split spanner (you have one)", "Tideglass with a … inside, 3 cracks to break, needs a level 3 merge beside it"). The objective and the hint are `aria-live="polite"`.
- **Focus:** a 3 px gold `:focus-visible` ring. Opening the coast moves focus to its ×; closing returns it to the strip.
- **Reduced motion:** `prefers-reduced-motion` shortens every animation to ~0; every state change remains.
- **No re-draw flicker:** the board is patched cell by cell (a cell's picture is replaced only when that cell changed), the same rule as the live game's tap-flicker fix; CI checks every board picture is drawn after the build.

## 7. Test matrix and preview

`tests/v5-proto-first-session-2-browser.cjs`, run by `.github/workflows/v5-proto-first-session-2.yml` in the Playwright 1.62.1 image, in **Chromium and WebKit** at **360×640, 390×664 and 390×844**, with finger taps:
1. no sideways scroll; HUD, card, strip, hint and the whole board on screen; text sizes; every button ≥ 44×44, hit at its centre, named;
2. every crate's look equals the rules (at the start and after the first build); 27 crates, 17 tideglass; exactly 2 crates open-able at the start;
3. a finger on the Rover: one real `act()` tap (energy 100 → 99);
4. the guide plays to the first restoration: 2 orders, the path built, 40 coins; the coast × ≥ 44 and closes it;
5. `?restore=2`: Build makes stage 2, the after picture is `place-path-2`, the before is `place-path-1`, both toggles ≥ 44 and swap the pictures; the art fills the map and the place is fully in view;
6. no page error.

The workflow runs the test twice: on the branch checkout, then on the **Cloudflare preview link** once that link serves this commit's build (it compares the page's `proto-build` tag), so the link given here is proven to work. Screenshots of both runs are the artifact `proto-first-session-2-screenshots`.

**Interaction rules (summary)**
1. **One primary goal visible:** the guide's order, one card.
2. **Full colour means "you can act on this now", by the game's own rules.** Muted means "later"; frost means "locked part"; purple means "rare".
3. **No modal during play** except the restoration panel, which is player-initiated and dismissable.
4. **Rewards fly to where they matter:** coins to the counter, materials to the strip, crates to the board.
5. **Every celebration answers four questions in order:** what was done, what was earned, what changed, what next.
6. **Routine feedback stays short:** under 0.3 s for micro and under 0.9 s for medium. Only the restoration reveal reaches about 3 s.
7. **Reduced motion keeps every state and drops the movement.**

---

## What production would need (not done; needs approval)

**Effort**
- The prototype now runs on `act()`, so its presentation code is close to what production needs (the crate-state function, the one-card objective, the patched board, the coast camera).
- About 3–5 days to bring this into `v5/next`, split into the stages of the audit's roadmap.
- Most of it is CSS, plus small changes in `app.mjs`:
  - a class per crate state;
  - the one-card rail;
  - feedback tiers;
  - a coast panel with zoom and caption;
  - start on the board.

**Unchanged:** `game.mjs` (rules), saves, SDK and economy.

**Tests to update or add**
- Board render: state classes, and no animation restart (the existing tap-flicker test).
- Order rail: one card before the first delivery.
- Coast: the reveal is visible, nothing covers the place, and the × still works.
- Story: reachable from 📜.
- Data Module save and reload: unchanged.
- The owner's real-phone PASS.

**Sound:** real material samples from a sound designer, or a licensed pack. The prototype's synthesis is only a concept.
