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
| Trimmed tree: the other Coast suites and an all-area crawl | running at the time of this commit; results are added below when they finish |

The first list was caught by the trimmed-tree run itself: the Home and saves tests requested `coast/icons/driftwood-crate.webp` (404). That is why the guard in step 1 now exists.
