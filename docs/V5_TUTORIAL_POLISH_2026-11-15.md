# Vaultwake Merge: tutorial visual polish (PR #105, 2026-11-15)

**Owner clarification:** the tutorial does not need more steps. It looked unfinished and cluttered.

**This is visual design only:**
- The tutorial logic (`tutor.mjs`) is unchanged: the same steps, words, Hint and Skip.
- Gameplay, the economy, saves, the layout system, board stability and the CrazyGames SDK are unchanged.

## 1. Audit (real guide played through the UI; `docs/evidence/v5-tutorial-polish-2026-11-15/audit-*.txt`)

| Step (390 × 664) | Emphasis on screen | What the hand covered | Looping animations |
|---|---|---|---|
| Generator tap | 3 px gold outline + 3 px ring + 14 px glow + 34 × 40 hand at the centre | 30% of the Rover's picture | 3 |
| Merge | gold ring + glow on the source, green ring + glow on the twin, a white disc sliding over the picture, the hand dragging | 35% of the twin, 17% of the Rover | 4 |
| Order delivery | 3 px outline on the card, hand at the card's middle | the item art and the count (up to 100%) | 6 (ready bounce, crate nudges, key, bob) |
| Gold Order | same | items, Lv tags and counts | 13 |
| Build (strip) | outline, hand on the strip | — | 3 |
| Build (coast) | outline, hand and "Tap to build" label on the button | the button's text | 15 (sun, twinkles, markers, bar, button) |

**At every size:**
- **360 / 375 / 390 / 430:** the hand covered artwork in 4 steps, and up to 15 loops ran at once.
- **Board:** it never moved.

**Also:**
- The 💡 Hint carried a gold ring of its own, a second gold accent next to the target.
- Toasts used the same 2 px gold ring as targets.
- The rules had accumulated in three layers (Build 51c, First Session 2.0, Premium polish), each adding its own rings and glows.

## 2. Design direction

One focus at a time, in the game's own language.

**Colours:**
- **Gold:** "do this now". Only the target: a 2 px ring with one soft expanding pulse; no glow, no thick border.
- **Green, dashed:** "this goes here" (the destination of a merge). It matches the game's green for a valid twin.

**Cues:**

| Action | Cue |
|---|---|
| Tap | The cell's gold pulse plus a small pointer (20 × 24) whose fingertip touches the cell's lower-right corner, never the picture. |
| Merge | The source's gold ring, the twin's dashed green ring, and an outline-only ghost (no fill) that slides from one to the other; no pointer over the board. |
| Deliver / Gold Order | The ring and pulse sit on the card's Deliver chip, the control that acts. The card has no outline and no hand. |
| Build | The strip's Build pill carries the ring. On the coast the Build button keeps its own pulse with a 2 px gold outline. No hand or label over its text. |

**One guide panel:**
- The line above the board: what, then why, with a 1 px sand border.
- A 3 px left accent: gold when a skill is new, teal otherwise.
- Hint and Skip are quiet 44 px buttons in the same frame. No gold on them.

**Toasts:** the same quiet frame (1 px sand border, softer shadow, 320 px wide). The text is unchanged, because it carries the Gold Order explanation the guide test checks.

**One moving thing:**
- While a target shows, the named idle loops elsewhere rest: generator bob, crate nudge, key and glow, and the ready-Deliver bounce on other cards.
- The target's own bob rests too.
- On the coast, while the guide points at Build, the sun sweep, twinkles and markers rest.
- Entrance and feedback animations are never paused, so nothing freezes half-drawn.

**Reduced motion:** the same rings, still. No pulse, ghost or pointer motion.

## 3. Implementation

**`v5/next/coastal.css`:**
- The three earlier rule sets for tutorial rings and glows, the green pair ring and the hand are removed: 16 rules.
- One "Tutorial visual system" block replaces them.

**`v5/next/app.mjs` (`placeHand`):** the pointer's anchor is:
- a cell's lower-right corner;
- or, for an order or the strip, the control itself (Deliver, Build).

On an order or the strip the pointer is not drawn. The anchor stays inside the target, so the guide's existing "the hand points into the target" checks still hold.

## 4. Results (`audit-after-*.txt`; the same play-through)

| Step | Emphasis | Pointer | Covers | Loops |
|---|---|---|---|---|
| Generator tap | the cell's gold ring and pulse | 20 × 24 at the corner | nothing | 2 (pulse, pointer) |
| Merge | source ring and dashed twin ring | none (the ghost shows the direction) | nothing | 1 (ghost) |
| Order delivery | the Deliver chip's ring | none | nothing | 1 |
| Gold Order | the Deliver chip's ring | none | nothing | 1 |
| Build (strip) | the Build pill's ring | none | nothing | 1 |
| Build (coast) | the Build button's outline | none | nothing | 4 (the Build button's pulse and shine, the bar, and the strip under the sheet) |

The same holds at 360 × 640, 375 × 667 and 430 × 932:
- **Artwork covered:** in 0 steps (was 4).
- **Loops at once:** at most 4 (was 15).
- **Board:** never moves.

Pictures: `<size>.jpg`, before above and after below, for the generator tap, merge, delivery, Gold Order, Build (strip) and Build (coast).

## 5. Tests

**New `tests/v5-next-tutorial-visual-browser.cjs`** (Chromium and WebKit, in CI). It plays the real guide from a new camp to the first Build at 360 × 640, 390 × 664 and 430 × 932. At every step it checks:
- one focus (two cells for a merge);
- a pointer of at most 24 × 28 that covers no picture, count or word;
- at most four looping animations while a target shows;
- the board never moves;
- the tap, merge, deliver, Gold and Build steps are all reached;
- the coast's Build is drawn.

It fails on the build before this change (33 × 39 hand).

**Results:**
- The existing guide (hand anchor and label), first-session and story suites pass unchanged.
- One finding: hiding the toast's detail line during the guide broke the guide test, which checks the Gold Order explanation. That change was reverted; the toast keeps its text.
- Unit tests: 494 pass.
- All 33 Coast Camp browser suites pass in Chromium, including saves, CrazyGames, Home, the stable board, the order cards and chapters 1–6. WebKit runs in CI.
