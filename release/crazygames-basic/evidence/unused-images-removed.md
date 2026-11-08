# Evidence: the 47 left-out images are not needed by the game

Release 2026-11-08. List: `tools/coast-crazygames-unused.txt`. Source commit `e72b4bb`.

## How it was checked

1. **Unit guard.** `tests/v5-next-crazygames-unused.test.mjs` collects every image path the Coast game can produce:
   - `draw()` for parts, ice, cargo, crates of every size, generators at every level, the token and the cog;
   - every place's stage pictures;
   - every area's pictures and maps;
   - every path written in the Coast code.

   None of those paths may be on the list. Run on the first list (50 files), the guard fails and names three files the game does draw: `coast/icons/driftwood-crate.webp`, `captains-trunk.webp` and `cargo-basket.webp`. Those were taken off the list. With the 47-file list it passes, and `node --test tests/v5-*.test.mjs` gives 443 pass, 0 fail.
2. **Browser run without the files.** A copy of the repository with the 47 files deleted was served on port 8080, and the Coast browser tests were run against it in Chromium (Playwright 1.62.1). Every request was logged by the server; a missing image shows up as a 404.
3. **Package run.** The ZIP was unzipped and served on port 8081, then `tests/v5-next-crazygames-browser.cjs` and `tests/v5-next-crazygames-payload-browser.cjs` were run against it.

## Results

| Run | Result |
|---|---|
| Unzipped package: CrazyGames page at 907×510, 390×844, 360×780 | passed; 0 requests answered 404 |
| Unzipped package: download before `gameplayStart` | 3.27 MB in 91 requests (unchanged) |
| Trimmed tree: `v5-next-browser` (360/390/430) | passed; 0 requests answered 404 |
| Trimmed tree: `v5-next-home`, `saves`, `energy`, `extras`, `rewards`, `story`, `guide`, `landmark`, `rare-merges`, `ch1-rare`, `playtest`, `journey` | passed in Chromium (`journey` and `playtest` then stopped at WebKit, which is not installed locally) |
| Trimmed tree: `v5-next-chapter2` … `chapter6` | all passed in Chromium |
| Trimmed tree: `v5-next-bright` | first run failed one timing check ("the picture starts on the place", the `focusIn` class read right after the map opens) with no missing file; the next two runs passed at 360, 390 (both motion settings), 430 and 907 px |
| Trimmed tree: all-area crawl (8 areas × start/middle/end, 390×844 and 1280×720, map, book, shop, menu) | 144 images requested, all present |
| **Server log over every trimmed-tree run** | **0 requests answered 404** |
| CI on `7509195` (full tree, Chromium + WebKit + Firefox for the ZIP) | all 12 checks passed, including the byte-for-byte ZIP rebuild |

The first list was caught by the trimmed-tree run itself: the Home and saves tests requested `coast/icons/driftwood-crate.webp` (404). That is why the guard in step 1 now exists.
