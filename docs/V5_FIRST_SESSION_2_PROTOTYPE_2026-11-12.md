# Vaultwake Merge: First Session 2.0 visual and interaction prototype (2026-11-12)

**This is a design prototype for owner approval. It is not a production change.**

**What is untouched:** the live game, the CrazyGames build, saves, the SDK, the mechanics, the economy, the orders, the crate count and generator progression.

**Where it lives:**
- the prototype is one isolated page, `prototype/first-session-2/index.html`, on the branch `claude/v5-first-session-prototype`;
- it reads the real fresh-camp board from `v5/next/game.mjs` (`fresh()`) and draws pieces with the game's own art function (`v5/next/chains.mjs`, `draw()`); both files are used read-only and are unchanged.

**What is a stand-in:** order contents, coin amounts and the restoration's numbers come from the audited first session (`docs/V5_COMMERCIAL_AUDIT_2026-11-12.md`). Merging is scripted in the page. Tideglass cracks on any adjacent merge here; the real game also asks for a minimum level.

**Open it** (serve the repo root, or any branch preview of this repo):

| URL | Shows |
|---|---|
| `/prototype/first-session-2/index.html` | The first session, playable: tap the Rover, drag twins, tap the order, tap the strip, Build. |
| `…?autoplay=1` | The same flow, played by a script (about 36 s). |
| `…?lab=1` | The merge lab: one pair for each feedback tier, plus a rare part. |
| `…?lab=1&autoplay=1` | The merge lab, played by a script. |
| `…?skin=current` | The same board in today's look, for a side-by-side check. |

---

## Deliverables

All in `docs/evidence/v5-first-session-2/`.

| # | File | What it is |
|---|---|---|
| 1 | `1-board-current-vs-proposed.jpg`, `1b-board-closeup.jpg` | **Current and proposed first screen.** Same 49 cells, same 27 crates, 17 tideglass, 1 generator and 4 empty cells, same art. "Current" is the real game (822a8f9, from the audit session at 17 s). |
| 2 | `2-mockups-390x664.jpg` | Ten mobile screens at 390×664: start, first tap, order ready, gold order, ready to build, coast before, reveal, reward and next, back on the board, rare find. |
| 3 | `3-merge-tiers.jpg`, `demo-merge-lab.webm` | **Merge animation:** snap, then micro, medium, major and rare feedback. |
| 4 | `4-order-complete.jpg` | **Order complete** with no modal: ready, delivered (DONE stamp, coins arc to the counter), next card slides in, gold order, materials fly to the strip. |
| 5 | `5-restoration-sequence.jpg` | **Restoration celebration:** before, Build, transition, after, then reward and next objective. The place stays in view throughout. |
| 6 | `6-first-90s-storyboard.jpg`, `demo-first-90s-autoplay.webm` | The first 90 seconds as a storyboard with target timings, and the full scripted run as a video. |
| 7 | This document | The design specification. |

The videos are WebM, 390×664. They play in Chrome, Firefox, Android and recent Safari.

---

## 1. Board: visual clarity (rules unchanged)

**State language.** Five states, each readable in under a second.

| State | Look | Why |
|---|---|---|
| **Movable part** | Full colour, 92% of the cell, soft drop shadow (`0 2px 1.5px #0003`) | The only full-saturation objects in normal play: "these are yours". |
| **Generator** | Gold plate (`#fff1c2 → #f6d77d`, 2 px `#e6b84f` rim). Slow breathing gold ring until the first tap (1.6 s cycle), then still. | Always findable; never flashing. |
| **Crate, actionable now** (its key comes from an open generator: the 5 Rover-keyed crates) | Full colour, 84% size, **key badge** (a white disc with a 2 px gold ring, showing the part that opens it) | It says what to make. |
| **Crate, not yet** (its key needs the Survey Kite or Rope Winch: 22 crates) | Same art, 74% size, `saturate(.5) sepia(.22) brightness(1.03) contrast(.9)`, opacity .88, no key or "?" | Calm, warm and still Vaultwake. It recedes without turning grey. Nothing is removed. |
| **Tideglass** | Cool frosted cell (`#eefaff → #cdeef8`, `#8fd3e8` rim). The part inside is desaturated (`saturate(.45)`, opacity .82, 0.3 px blur) under the existing `ice-N.webp` art. **Three crack pips** at the bottom. | Clearly "locked part"; never mistaken for a crate or a movable part. Shows progress to freeing it. |

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

- **One card at a time** while the first order is open:
  - who asks (face and name) and why ("needs a part for the landing");
  - the part with its **Lv tag**, `0/1`, its name, and the reward.
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

The coast opens as a **panel sliding up from the board** (550 ms), not a modal. The **camera zooms 1.65× onto the place** (1.2 s ease-out), so the change happens big and in view.

| Step | Time | What the player sees |
|---|---|---|
| 1 **Before** | 0 s | The place's ground: a dashed footprint, the stage sprite desaturated and darkened, a 🔨 pin. Below: "New place · stage 1 of 3", "✓ Materials · ● 40", **Build · ● 40**. |
| 2 **Build action** | tap | 6 coins fly from the counter to the place, and the counter counts down. |
| 3 **Construction** | +0.6 s | A dust cloud and three knocks (the sprite bounces 3× in time with three wooden knocks; haptic 12–250–12–250–16). |
| 4 **Transition** | +1.6 s | A white flash at the place. Before cross-fades to after, which pops in (0.7 → 1, 700 ms overshoot). 16 sparks, a gold ring, a warm four-note chord and a 16–60–28 haptic. **Colour blooms out from the place** across the map (radial mask 0 → 46%, 1.5 s). |
| 5 **After** | +2.4 s | A title chip drops onto the map, *over the sky, never over the place*: "Landing path cleared ●○○". |
| 6 **Reward and next** | +2.9 s | Below the map, **one caption**: Ivo's face and his line, plus the second line in smaller text. Reward chips "⚡ +20" and "Driftwood crate". Then a single **Next: Lay a boardwalk →** button. |
| 7 **Back** | tap | The panel slides down. The crate flies from the strip to a free cell on the board and lands with a medium pop. The strip shows the next place, and the next gold order slides in. |

**What changes against today's game**
- **Story is kept**, but it moves into the caption under the map, so it no longer covers the place.
- **No daily-gift popup** follows.

---

## 5. The first 90 seconds

**Start → Merge → First order → Reward → Coast restoration → Next objective** (`6-first-90s-storyboard.jpg`)

| Time (target, human) | Beat |
|---|---|
| 0–3 s | **The board is the first screen.** One caption line at the bottom: Ivo, "An unsigned letter led us to this coast. First, let's clear a landing for the crew." One order: Ivo needs a Split spanner. |
| 3–10 s | Tap the glowing Rover; a part flies out; the caption folds into the 📜 button, where the letter story stays readable. |
| 10–20 s | Drag twin onto twin: snap, pop, click. No toast. |
| 20–30 s | The card turns green; tap it. The part flies in, DONE stamp, coins arc. |
| 30–40 s | The gold order slides in: "Materials for the landing path". |
| 40–60 s | Same loop to a Pocket winch. Deliver: the materials fly to the strip, which turns gold with "Build · 40". |
| 60–80 s | Tap the strip; the coast slides up on the place. Build: coins, dust, knocks, flash, the path appears, colour blooms. |
| 80–90 s | Ivo's line and rewards under the map; **Next: Lay a boardwalk**. Back on the board, the crate lands. |

**What stays the same**
- The audited build reaches the first Build at 85 s with these exact steps, so no economy change is needed.
- The removed friction is about 13 s of Home and story pages before the board, plus the post-build popups.
- The story content is kept: the caption, the 📜 button and the restoration caption.

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

**Interaction rules (summary)**
1. **One primary goal visible.** The second crew card appears only after the first delivery (gate §5).
2. **Full colour means "you can act on this".** Muted means "later"; frost means "locked part"; purple means "rare".
3. **No modal during play** except the restoration panel, which is player-initiated and dismissable.
4. **Rewards fly to where they matter:** coins to the counter, materials to the strip, crates to the board.
5. **Every celebration answers four questions in order:** what was done, what was earned, what changed, what next.
6. **Routine feedback stays short:** under 0.3 s for micro and under 0.9 s for medium. Only the restoration reveal reaches about 3 s.
7. **Reduced motion keeps every state and drops the movement.**

---

## What production would need (not done; needs approval)

**Effort**
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
