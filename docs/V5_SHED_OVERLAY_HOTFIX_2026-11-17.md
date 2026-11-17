# V5 Coast Camp — Shed mobile overlay hotfix (2026-11-17)

Branch `claude/v5-shed-overlay-hotfix`, from `ecde162` (PR #105 head). It is a separate draft hotfix branch: not merged, packaged or published.

## Symptom (reported)
On a real mobile browser, after storing an item in the Shed, a large solid coral/orange oval with a white outline covers the lower-right of the board. The bar reads "Shed 1/4", the board has one space left, and the oval hides several cells.

## Root cause (DOM and pixel evidence)
**Element:** the stored crate's round family tag, `<span class="kitTag" style="background:#f27755">`, drawn by `draw()` for a crate (`v5/next/chains.mjs`, `type==='kit'`). It is not the drag ghost.

**Its rule (`v5/next/next.css:159`):** `.kitTag{position:absolute;right:9%;bottom:10%;width:22%;height:22%;border-radius:50%;border:2px solid #fff}`, so its size and offsets are percentages of its containing block.
- On the board, its host `.tile` is positioned. `#board .kitTag` makes it an 8 px dot (`coastal.css:271`).
- A **shed space** (`button.shedSlot`, `bright.css:174`, `next.css:189`) is not positioned, and neither is the **folded bar's small icon** (`.shedPeek i`, `bright.css:167`). No ancestor up to `<html>` is positioned either: `#shed`, `main.game` and `body` are all static.
- So the tag's containing block was the whole page. It was sized 22% × 22% of the page and placed 9% from the page's right and 10% from its bottom.
- For a Rig crate (`TAG.rig = #f27755`, coral) that is a solid coral ellipse with a 2 px white rim. In the reported layouts it lands on the board's lower right.

| viewport (Chromium, the reported path) | board | the tag after "Shed" | after a reload |
|---|---|---|---|
| 390×664 | y 206–576 | 86×146 px at (269, 297), scrolled: over the board's lower right | 86×146, from the folded bar |
| 360×640 | y 206–546 | 79×141 px | 79×141 |
| 430×932 | y 208–618 | 95×205 px | 95×205 |

**Why it stays:** this is not an animation. The tag is part of the crate's picture, so it stays while the crate is in the Shed:
- open (from the space);
- folded (from the bar's preview icon);
- after a reload.

It goes only when the crate is taken back out. Saved data is untouched.

**Why only some players see it:** it appears only when a crate is stored. A part, cog or token has no positioned decoration, and only `item`, `kit`, `cog` and `token` can go in the Shed (`game.mjs` store, `SHED_TYPES`). The colour is the crate's family:
- Rig: coral `#f27755`
- Shell: salmon `#ff9f8a`
- Chart: blue `#43bfe7`

**Same cause, secondary:** the store adds `merge-pop` to the shed space (`app.mjs`, `r.event==='store'`). Its ring, `.merge-pop:before{position:absolute;inset:2px;border-radius:50%;border:2px solid #fff7d2}` in `style.css:34`, also took `<html>` as its block: a page-sized cream ring for 0.38 s.
- After a drag onto the folded bar the space is hidden, so the ring stayed armed at full opacity until the Shed was next opened. Chromium did not paint it while hidden.
- It is outline-only, so it is not the reported solid oval, but the fix covers it.

**Not the cause (checked):**
- `.dragGhost` is created after an 8 px move, appended to `body`, and removed in `endDrag()` on `pointerup` and `pointercancel`. There were 0 ghosts after every path, in every engine and size: Shed button, unstore, drag onto the folded bar or an open space, rapid store/unstore, a browser-cancelled drag, and a drag with a scroll in the middle.
- No explicit pointer capture is used: there is no `setPointerCapture`, so `lostpointercapture` cannot fire. Move and up are heard on `document`, and touch pointers are captured implicitly by the browser.
- `touchmove` is prevented while dragging, which covers an iOS scroll from a button.
- Native drag and long-press feedback is already off: `img.art{-webkit-user-drag:none}`, tiles `touch-action:none; -webkit-touch-callout:none`, and `.shedSlot{touch-action:none}`.
- Render after store/unstore: `run()` → `render()` redraws the board and `renderShed()`. No orphaned element was found by an overlap scan of every element and positioned `::before`/`::after` over the board.
- Other places that draw a crate already have a positioned host: the selection preview, the reward pop-up icon, Daily, Shop and Book items, and the drag ghost (fixed). The order bonus hides its tag.

The live build `822a8f9` has the same rules and the same bug: the same 86×146 oval at 390×664.

## Fix (one scoped rule)
`v5/next/coastal.css`, after the `#shed` rule:
```css
body.nextMode #shed :is(.shedSlot,.shedPeek i){position:relative}
```
- A shed space and the bar's icons become the tag's and the ring's host, as a board cell is.
- The tag is now a 14 px dot in the space's corner (5 px on the bar), and the ring stays on its space.
- `coastal.css` cache tag: `end65a` → `shed66a` (`v5/play.html`). `v5/coast-crazygames.html` was regenerated (`node tools/coast-crazygames.mjs`, `--check` clean).

**Unchanged:**
- gameplay, economy, reducer and save format (no key or field touched);
- layout (no box moves: `position:relative` without offsets);
- `mobile.css` and `style.css`.

The same line, applied to an archive of `822a8f9`, makes the regression test pass there too (Chromium, three sizes).

## Tests
`tests/v5-next-shed-overlay-browser.cjs` is new and runs in the First Session 2.0 workflow (Chromium + WebKit matrix). It uses real UI and real input: touch taps, and pointer drags with the mouse.

**Camp:** a progressed camp with a full board and Rig, Shell and Chart crates. Sizes 390×664, 360×640 and 430×932, with a fresh browser per size.

**Paths:**
1. Shed button, on a full board, to "Shed 1/4". This is the reported path.
2. The Shed folded with the crate in it.
3. Unstore.
4. A drag onto the folded bar.
5. A drag onto an open space.
6. Four rapid store/unstore rounds.
7. A drag cancelled by `pointercancel`; it must change nothing.
8. A drag with a scroll in the middle.
9. A merge of two equal parts, which must take two and make the next tier.
10. A reload, which must keep the Shed; then the Shed folded and open.

**After each path, at 30, 150 and 700 ms:**
- nothing in the Shed (element or positioned pseudo-element) has a containing block outside the Shed;
- every visible crate tag is ≤ 24 px;
- nothing new and not the board's own overlaps the board's cells;
- coral pixels over the board are no more than the baseline + 0.4 points (a screenshot of the board area, decoded in the page);
- no `.dragGhost`;
- board + Shed + waiting rewards are the same multiset (nothing duplicated or lost);
- no page errors.

| run | result |
|---|---|
| hotfix, Chromium, local (3 sizes) | PASS |
| `ecde162` unfixed, Chromium, local | **FAIL** at the first store: `span.kitTag → html`, `button.shedSlot.full.merge-pop::before → html` |
| `822a8f9` live, unfixed, Chromium, local | **FAIL**, the same |
| pixel check alone (DOM checks disabled), `ecde162` | **FAIL**: 7.88% of the board's pixels coral, against 1.24% before |
| `822a8f9` + the one rule, Chromium, local | PASS |
| unfixed `ecde162` and `822a8f9`, CI **WebKit** and Chromium (scratch run [44031970390](https://github.com/siruss4199-wq/vaultwake/actions/runs/44031970390), `claude/v5-shed-repro`, not for merge) | **FAIL** as expected in all 4 jobs: `span.kitTag → html`, `button.shedSlot.full.merge-pop::before → html` |
| hotfix `b04d6c3`, CI Chromium + WebKit, the full First Session 2.0 workflow (workflow_dispatch) | see "CI" below |

Regression:
- `node --test tests/v5-*.test.mjs`: 494/494 pass.
- The 34 Coast Camp browser suites plus the new one, Chromium, local: **33/35 PASS**. The other two, `v5-next-browser.cjs` and `v5-next-playtest-browser.cjs`, stop only at `browserType.launch` for WebKit, which is not installed in this container; their Chromium parts passed, with no assertion failure. The full Chromium + WebKit matrix runs in the hotfix CI (see "CI" below).

## Evidence
`docs/evidence/v5-shed-overlay-2026-11-17/` holds before/after sheets at actual phone scale (2× pixels) for the reported path: a Rig crate stored with Shed on a full board, then a reload.
- `webkit-390x664.jpg`: live `822a8f9` → hotfix.
- `webkit-360x640.jpg`: `ecde162` → hotfix.
  - The WebKit shots are Playwright WebKit in CI, taken by the scratch run above and committed to its branch.
- `chromium-390x664.jpg` and `chromium-360x640.jpg`: `ecde162` → hotfix, local.
- `*-webkit-*.json`: per build and size, the tag's box and where it is drawn, stored and after a reload, plus the saved Shed. In WebKit the tag was:

| WebKit | before (`ecde162` / `822a8f9`) | after (hotfix) |
|---|---|---|
| 390×664 | 86×146 px, stored and after a reload | 14×14 px in its space; 5×5 px on the folded bar |
| 360×640 | 79×141 px | 14×14 / 5×5 px |
| 430×932 | 95×205 px | 14×14 / 5×5 px |

- `kit.cjs`: the reproduction script, run from the repo root with `ENGINE`, `W`, `H`, `OUT`, `ORIGIN`.

## Real devices
**Android Chrome and iPhone Safari: NOT TESTED.** No physical device is available to this session.
- The cause is engine-independent CSS positioning: absolute boxes with percentage sizes against an unpositioned ancestor chain behave the same in Blink and WebKit. The automated WebKit run (Playwright's WebKit, the iPhone Safari engine) reproduces it before the fix and clears it after.
- Owner check on a device:
  1. Fill the board.
  2. Tap a Rig crate, then Shed. Expected: a small coral dot in the crate's Shed space, nothing over the board.
  3. Fold and open the Shed, then reload. Expected: the same.
  4. Drag a crate onto the folded bar. Expected: the same.

## Residual note (not changed)
If neither `pointerup` nor `pointercancel` ever arrived, the next `pointerdown` would replace `drag` without removing the old ghost. This was not observed on any path; recorded only. A ghost would look like the dragged item, not a coral oval.
