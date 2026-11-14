# Vaultwake Merge: Adaptive guided tutorial 2.0 (design prototype, 2026-11-13)

**This is a design prototype for approval. It is not a production change. No production PR, no CrazyGames update.**

**What is untouched:**
- the live game, saves, the economy, crates, orders, generator progression and the SDK;
- `v5/next/game.mjs`, `guide.mjs`, `coach.mjs` and `needs.mjs`, which are read, never changed.

**Where it lives:**
- `prototype/first-session-2/tutor.mjs` holds the guide's logic;
- `prototype/first-session-2/index.html` holds the presentation;
- both are on `claude/v5-first-session-prototype`, building on the First Session 2.0 prototype (`7cdd442`).

**Try it**

| Link | Shows |
|---|---|
| `https://claude-v5-first-session-prot.wispwood-game.pages.dev/prototype/first-session-2/index.html?fresh=1` | A new camp with the guide. Play it yourself: the guide never acts. |
| `…/index.html` | Resumes this tab's camp: reload and the guide picks up where you were. |
| `…?case=full` | A full board. |
| `…?case=energy` | No energy. |
| `…?case=locked` | Orders that need a generator you don't have yet. |
| Demo video | `docs/evidence/v5-first-session-2/demo-tutorial-2-guided-flow.webm` (390×664, 89 s): a human-paced player follows the guide with real finger input to the first restoration, waits 8 s once to show the reminder, and presses Hint once. |

---

## 1. One actionable instruction at a time

The guide bar sits between the coast strip and the board. It has **What** (bold, 15 px), **Why** (one short line, 13 px) and a **💡 Hint** button (66×44). **Where** is shown on the board itself, as a highlight and a small finger.

The flow (`8-tutorial-steps.jpg`) is a fresh camp on the real rules:

| Step | What | Why (example) | Where |
|---|---|---|---|
| Generator | Tap the Rivet Rover | It makes a Copper offcut: merge them up to Ivo's Split spanner. | the Rover, gold, finger taps |
| Merge | Drag a Copper offcut onto its twin | Two make a Grip tool: toward Ivo's Split spanner. | both twins, green, finger drags from one to the other |
| Crew order | Tap Ivo's order | Hands over the parts: +● 10. | the order card, gold, finger on Deliver |
| Gold order | Tap the gold order | +● 70 and materials: Clear the landing path. | the gold card |
| Reward → coast | Tap the coast strip | Materials in: Clear the landing path costs ● 40. | the strip's Build |
| Coast build | Tap Build | Clear the landing path: ● 40, the place changes. | Build on the coast panel |
| Next objective | Tap Next, then "Tap the Rivet Rover" | …merge them up to the gold order's Pocket winch. | Next, then the Rover (named once, then quiet) |

**Measured on the real reducer:**
- a player who does exactly what the guide shows reaches the first restoration in **12 taps and 11 merges**, the same as the game's own guide;
- the camp ends with 40 coins and 129 energy;
- this was checked in the unit test and in the browser at three sizes.

---

## 2. Visual finger guidance

**One language**
- **Gold** = the next action (a generator, the order card, the strip, Build, Next).
- **Green** = the matching items (the two twins, or a part and the crate it opens). A crate whose key part is already on the board now has a green key ring, not gold, so that gold always means "do this next".
- **A small hand** (46 px):
  - taps on a tap target;
  - drags from twin to twin on a merge;
  - plays 3 times, then rests.

**Placement**
- On a board cell, the fingertip rests at about 66% of the cell, so the piece stays visible and the hand lies over the gap.
- On a button, the fingertip rests at its lower-right edge, so the label ("Deliver", "Build") stays readable.

**Never anything invalid:** before a step is shown, `tutor.mjs` dry-runs its action through the real `act()` on a copy of the camp. A step the reducer would refuse is never returned. So the guide never lights up:
- a buried crate;
- a crate that needs a part you don't have;
- a generator without energy or space;
- an order that isn't ready.

Blockers light nothing (section 3).

**No overlays:** there is no full-screen dimmer and no popup. The board stays clean, and the finger has `pointer-events:none`, so it never blocks a tap.

---

## 3. Context-aware assistance (it keeps guiding after the first merge)

Each step comes from the current board and orders:
- **Focus order:** the first crew order until one is delivered, then the gold order (the same order the game's coach uses). If the materials are in but coins are short, it switches to the crew order closest to done.
- **Next useful action** for the focus order, using the game's `primaryAction()`:
  1. a ready delivery;
  2. otherwise a merge toward a part the order still needs;
  3. otherwise the generator that makes the missing part;
  4. otherwise a crate whose key is in hand.
- **Exploring is allowed.** If another order is ready, the guide may point at it, but only if delivering it takes no part the focus order still counts on. Otherwise it stays on the focus order, and the player can still deliver the other one.
  - This was a real bug found while building: the first version suggested Bram's order with the Split spanner the gold order needed, and the gold order never finished. The fix has a regression test.
- **Blockers are explained, never highlighted** (`9-tutorial-blockers.jpg`):
  - **Board full:** "The board is full · Merge two twins or deliver an order to free a space." If a twin pair exists, the guide points at that merge instead, since it frees a space.
  - **No energy:** "Out of energy · +1 energy every 2 minutes (next in 2 min). Deliver orders for more."
  - **Missing generator:** "Ivo needs a Route fold · The Survey Kite that makes it is not on your board yet." If another order can be done, the guide works on that one and says why in one clause.
  - **A refused move** (e.g. tapping the Rover with no energy): the reducer's own message shows in the guide bar.

---

## 4. Adaptive hint behaviour

**Levels**

| Level | Shows |
|---|---|
| **full** | what, why, the highlight and the finger |
| **light** | what, why and the highlight (no finger) |
| **quiet** | a short "what" line only, with no highlight |

**When guidance fades**
- Per skill, measured only from fields the save already has (`s.taps`, `s.merges`, `s.ordersDone`, `s.materials`, `s.built`), so there is **no new save data** and a reload resumes at the same level:

  | Skill | full | light | quiet |
  |---|---|---|---|
  | tap | never done | done once or twice | 3+ |
  | merge | never done | done once or twice | 3+ |
  | crew delivery | first | second | later |
  | gold delivery | first | — | later |
  | build | first | — | later |

- Blockers are always light (they say why).
- The next objective after the first build is named once (light).

**Hint button**
- Raises the current step to full (finger and all) until the player acts or the step changes.
- Always there, always 44 px.

**Idle reminder**
- After **8 s without input**, the guide reminds **once per step**: the bar nudges and the finger shows once.
- It never repeats for the same step and never loops.

**Never acts**
- The guide only reads the camp. The browser test checks that 17 s of idling changes nothing.
- The prototype's `?autoplay=1` is a separate scripted demo player.

**Guided span**
- The game's own coach span (until the first restoration), plus the next objective.
- After that, only Hint and the idle reminder guide.

---

## 5. Production notes (not done; needs approval)

**Skip and resume semantics are kept as they are:**
- the guided span ends with `seen['coach-done']` (Skip) or at the first restoration, exactly like `coach.mjs`;
- progress resumes from the camp itself;
- the only new state is per session (hints used, which steps were reminded), which is presentation and not saved.

**What production would need**
- Move `tutorStep` / `guideLevel` into `v5/next/` (or extend `coach.mjs`) and use them in `app.mjs`'s guide line.
- The CSS for the guide bar, `gNext`/`gMatch` and the finger.
- The dry-run check: `structuredClone` plus `act()` on each shown step. It costs about 1 ms per action in the prototype.

**Accessibility**
- The guide text is `aria-live="polite"` and the Hint button has a label.
- Reduced motion keeps the same guidance with a still finger. This is tested.

---

## 6. Tests

| File | Covers |
|---|---|
| `tests/v5-proto-tutor.test.mjs` (node:test, 11 tests, real reducer) | Fresh step; full flow to the first restoration in the brief's order with every step accepted by `act()`; fading levels; **no blocked, buried or invalid target on 1,200 states of seeded random play**; a buried crate with its key in hand is never pointed at; full board; no energy; missing generator (switch, and locked); not stealing the gold order's parts; **resume** (`load()` of every state gives the same step and level); skip flag. |
| `tests/v5-proto-tutor-browser.cjs` (Chromium + WebKit; 360×640, 390×664, 390×844; real finger input) | Start; play to the real first restoration with highlights equal to the targets at every step and every highlighted action valid; fading (no finger on quiet steps); one idle reminder, not two, and the camp unchanged; Hint; next objective; resume after reload; the three blocker cases including a refused tap; reduced motion; no page error. |
| `tests/v5-proto-first-session-2-browser.cjs` | Still passes: layout, 44 px targets, crate states equal the rules, stage-2 before/after. |

CI (`.github/workflows/v5-proto-first-session-2.yml`) runs all three on the checkout, then the browser tests again on the Cloudflare preview once it serves this commit's build.
