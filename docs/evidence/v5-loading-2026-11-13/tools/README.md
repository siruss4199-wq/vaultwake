# Loading measurements (2026-11-13)

How the numbers in `docs/V5_LOADING_AND_BOARD_CALM_2026-11-13.md` were taken. Playwright 1.62.1, Chromium.

1. Make a throwaway TLS certificate next to `cfserver.mjs`:
   `openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem -days 30 -subj "/CN=localhost"`
2. Serve a checkout with `node cfserver.mjs <repo root> 8443`. This is a Cloudflare Pages stand-in: HTTP/2, brotli, ETag, `max-age=0, must-revalidate`.
3. Run `./matrix.sh <tag> 8443` and `./matrix-cg.sh <tag> 8443`. Each config prints the median of 3 runs and writes `wf-*.json`, the request waterfall.
4. Draw a waterfall with `python3 wfchart.py wf-<tag>-play-new-slow4g.json out.png "title"`.

`measure.cjs` environment variables:

| Variable | Values | Meaning |
|---|---|---|
| `PROFILE` | `slow4g`, `4g`, `none` | Network and CPU throttling |
| `PAGE` | `cg` | Open the CrazyGames page from a crazygames.com referrer |
| `SEED` | `returning` | Start with a played camp in localStorage |
| `WARM` | `1` | Load twice and measure the second, cached load |
