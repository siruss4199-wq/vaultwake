# V5 first-session energy balance — 2026-11-04

Base: PR #97, `claude/v5-vault-art-integration` at `000bb9b039265430469f686b2db33494f4d272dc`. Working branch: `codex/v5-first-session-energy-balance`. No merge or publication.

## Selected configuration

- **New camps: 100 energy.** Valid existing saves retain their stored energy; no starting-energy top-up is applied on load.
- First ordinary Crew order +15 and first completed build stage +20 remain. **Second/third completed stages each give +10**, once, globally across chapters. No amount reductions were needed.
- Natural refill remains +1 every 120 seconds, with the unchanged 50/60/70/80/100 level capacities. Stored energy remains capped at 200; existing milestone overflow handling is preserved.
- Coin offer remains **80 coins → 20 energy, three daily**. Coin recovery is independent of advertising. The existing energy pill opens recovery options; no permanent board button was added.
- Full Launch rewarded energy: **25, two successful completions daily**. Basic Launch remains ads-off. Production requires explicit ads-on configuration, a ready CrazyGames SDK environment and supported cross-tab locking. Missing/failed/disabled SDKs never fall back to fake rewards. Stand-ins require explicit local development on loopback without an SDK.

### Necessary reward-credit correction

The initial 100/+10/+10 proposal exposed an existing inconsistency: level, authored restoration and cargo-jar energy was cut off at the **natural refill capacity**, so starting above it swallowed earned rewards. A required gold-first regression then measured 24.76 minutes depleted in Chapter 1 (4 seconds/action, opportunist seed 1).

Those existing reward **amounts remain unchanged**, but are now credited toward the **200 storage cap** instead. Natural regeneration still stops at the level capacity. Regular reward overflow above 200 is capped; existing milestone overflow rules remain. This fixes that regression without changing its starvation thresholds; the same gold-first probe now has zero depleted time, and other strict/opportunist probe cases remain under 0.39 minutes. This correction changes future earned reward credit, not saved energy or retroactive payouts.

## Reproducible comparison

Run each speed from the repository root (baseline commit must be present):

```sh
node tests/v5-first-session-balance-metrics.mjs 4 > /tmp/energy-4.jsonl
node tests/v5-first-session-balance-metrics.mjs 5 > /tmp/energy-5.jsonl
node tests/v5-first-session-balance-metrics.mjs 6 > /tmp/energy-6.jsonl
node tests/v5-first-session-balance-metrics.mjs 10 > /tmp/energy-10.jsonl
```

The runner reconstructs the exact baseline modules from Git. It pairs five seeds and two policies (guided and short generation bursts), including ads disabled, ads enabled without uptake, opt-in ads and an optional coin-purchase sensitivity for 100. **360 executions produce 520 scenario records**: enabled-but-unused ad rows reuse their identical deterministic disabled results. **64 executions extend through all six chapters** (two seeds per speed/configuration, with/without optional ad uptake); remaining executions are censored at 20 minutes. CSV contains each seed's timings, waits, coins, affordability, energy, chapter transitions and completion status: [v5-first-session-energy-balance.csv](metrics/v5-first-session-energy-balance.csv).

Both tested policies have **zero unavoidable energy-starved waiting in the first 15/20 minutes in every configuration, including baseline**. They use available free ration/board rewards; no ads or purchases are assumed. Thus these models do **not** reproduce the real player's frustration and cannot establish a retention lift. Null shortage timings are censored, not a claim that energy can never run out. Every extended run finishes 147 stages; peak energy is at most 179, with zero deferred energy at the measured endpoints.

Median energy after 20 minutes, guided policy, five seeds, no ads/purchases:

| Starting configuration | 4 s/action | 5 s/action | 6 s/action | 10 s/action |
| --- | ---: | ---: | ---: | ---: |
| 50 | 29 | 48 | 48 | 53 |
| 80 | 88 | 112 | 113 | 121 |
| 100 | 108 | 132 | 133 | 141 |
| 120 | 128 | 152 | 153 | 161 |

80 gives a smaller error margin; 120 holds another 20 energy without more opening progress. **100** is the preferred middle choice. With unchanged reward amounts now fully credited below the storage cap, no candidate approaches an unbounded balance; selected 100 peaks at 179. The +10/+10 progression is retained. Later progression still requires materials, merges and Crew coins.

Selected 100, median minutes/counts, guided policy/no ads or purchases:

| Seconds/action | First Crew | First Gold | Build 1 | Build 2 | Build 3 | Orders 15/20m | Builds 15/20m | Coins at 20m |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 4 | 1.07 | 3.77 | 3.84 | 5.52 | 6.84 | 10/13 | 5/6 | 40 |
| 5 | 1.34 | 4.71 | 4.79 | 6.9 | 8.56 | 6/11 | 3/5 | 42 |
| 6 | 1.61 | 5.65 | 5.75 | 8.28 | 10.27 | 5/8 | 3/3 | 97 |
| 10 | 2.68 | 9.42 | 9.59 | 13.8 | 17.11 | 3/5 | 2/3 | 36 |

Unavoidable waits in both opening windows are zero for all these rows. At 4/5/10 seconds, median remaining coins are below the 80-coin energy price; spending on energy therefore continues to compete with restoring sites. Optional purchases were not needed in these opening samples; price was not changed.

Later pacing, guided no-ad/no-purchase policy, median of two extended seeds, minutes:

| Seconds/action | Baseline Chapter 1 | 100 Chapter 1 | Baseline all 6 | 100 all 6 |
| --- | ---: | ---: | ---: | ---: |
| 4 | 118.66 | 118.34 | 462.63 | 376.69 |
| 5 | 147.56 | 154.47 | 464.76 | 479.86 |
| 6 | 180.91 | 185.36 | 563.43 | 574.69 |
| 10 | 302.93 | 308.93 | 953.87 | 957.83 |

These policy-dependent six-to-sixteen-hour runs are reachability checks, not a player session length target or commercial balance approval. Strict/opportunist gold-first tests separately retain their existing wait/pacing guards. Ad availability without uptake has no gameplay effect; ad failures do not count as successes or give energy.

## Save, purchase and ad protection

The save key and completed content are unchanged. Migration consumes already completed milestone stages without awarding energy and accepts the old three-ad daily count without resetting progress. New camps get an independent identity. Browser-local high-water receipts survive kept-save restoration, preserve milestone consumption and daily purchases, and prevent stock rollback. Anonymous pre-update camps share a conservative legacy receipt namespace; new camps are independent. Cross-tab requests use Web Locks, and coin buttons suppress duplicate clicks. Prices, stock, affordability and storage-cap checks remain authoritative in the game rules.

Only a started-and-finished SDK rewarded ad pays. Error, skip, unavailable SDK, timeout, interruption and late/duplicate callbacks do not pay. Concurrent requests are blocked. No interstitials or forced ads were introduced, and the opening tutorial hides ad offers. Unavailable ads and exhausted daily rewards have distinct labels.

## Launch configuration and packaging

```sh
node tools/coast-crazygames.mjs --check
node tools/coast-crazygames.mjs --zip
node tools/coast-crazygames.mjs --zip --full-launch
```

The default committed page and `vaultwake-coast-crazygames.zip` are **Basic, ads off**. The explicit Full QA option writes a separate `vaultwake-coast-crazygames-full.zip`/staging directory, keeping Basic untouched. Use the Full configuration in production only when CrazyGames permits the launch stage. No upload or production enablement was performed.

## Validation and limits

Local V5 rule suites and focused reward/security tests pass, including the unchanged gold-first starvation guards, migration, 200-cap boundaries and no-energy-farming check. New Chromium/WebKit 390×844 UI checks cover coin recovery, double clicks, completion/failure/skip/interruption, daily limits, old-save replay and build feedback. Both-engine save recovery checks pass. Final CI status and archive evidence are linked from the Draft PR, including Chapters 1–6, HUD/onboarding and extracted Basic/Full archives.

Live production-ad acceptance, physical-device behavior and real-player retention remain unverified. Daily receipts use browser storage and the device clock; clearing/tampering with client data is not server-side fraud protection. Follow-up real-player sessions should confirm the larger buffer resolves the reported friction without assuming ads or purchases.
