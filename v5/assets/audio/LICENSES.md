# Vaultwake Merge: audio asset licence manifest (2026-11-25)

Every sound and piece of music the game plays is listed here. All are **CC0 1.0 Universal** (public domain dedication):
- commercial use, modification and distribution are allowed without permission;
- no attribution is required.

Each licence was verified on the asset's own source page and, for Kenney, in the `License.txt` inside the downloaded pack
(copies in `licenses/`). The CC0 deed was checked at https://creativecommons.org/publicdomain/zero/1.0/ (2026-11-25: "No
Copyright … even for commercial purposes, all without asking permission").

No asset here was made by the game's developer or by an AI tool. Kenney's packs are hand-produced sound libraries. Both
music pieces were uploaded by their composers to OpenGameArt in 2019 and 2011, before AI music tools.

Credit, given voluntarily (not required): sound effects by Kenney (www.kenney.nl); music "Sea side Village" by KarateStudios
and "Meadow Thoughts" by Écrivain (OpenGameArt.org).

## Music (`music/`, streamed by an `<audio>` element after the first tap; the two play one after the other)

| Shipped file | Source | Author | Licence (as shown on the page) | Original file (SHA-256) | Processing |
|---|---|---|---|---|---|
| `music/seaside-village.mp3` (73.4 s, 881,542 B, SHA-256 `ba414d14…d0a0`) | https://opengameart.org/content/seaside-village, posted 2019-03-09: "A beautiful village basked in the glow of the sun reflecting off the ocean." | KarateStudios (opengameart.org/users/karatestudios) | License(s): CC0 | `Sea side Village.flac`, 48 kHz stereo, 75.9 s (`378b391f…5745`) | trailing silence removed, 0.4 s fade-in, loudness normalised to −20 LUFS, MP3 96 kbps stereo 44.1 kHz (ffmpeg) |
| `music/meadow-thoughts.mp3` (149.8 s, 1,797,791 B, SHA-256 `c6faac41…33df`) | https://opengameart.org/content/meadow-thoughts, posted 2011-09-13: "Length: 2:29. Solo harp." | Écrivain | License(s): CC0 | `Meadow Thoughts.ogg`, 44.1 kHz stereo, 149.7 s (`9c55cfad…4404`) | trailing silence removed, loudness normalised to −20 LUFS, MP3 96 kbps stereo (ffmpeg) |

Considered and not used:
- "Sunset Plains": its 2025 page text could not establish who made it.
- "Morning Sky" and "Exploration Theme": fine, but the two above suit the coast better.

## Sound effects (`sfx/`, decoded once after the first tap)

All from Kenney (www.kenney.nl), downloaded 2026-11-25 from each pack's page. Every pack's page and its
`License.txt` say "Creative Commons Zero, CC0".

**Packs:**

| Pack | Page | Pack ZIP SHA-256 |
|---|---|---|
| Interface Sounds 1.0 (2020) | https://kenney.nl/assets/interface-sounds | `f2193d07…1232` |
| UI Audio | https://kenney.nl/assets/ui-audio | `946fc23a…5eb6` |
| Impact Sounds 1.0 (2019) | https://kenney.nl/assets/impact-sounds | `029d734a…77f8` |
| RPG Audio | https://kenney.nl/assets/rpg-audio | `6dbeaf85…3c69` |
| Music Jingles | https://kenney.nl/assets/music-jingles | `b729ba57…97b8` |

**Shipped files:**

| Shipped file | Played for | Pack | Original file |
|---|---|---|---|
| `sfx/tap.mp3` | interface taps | UI Audio | `Audio/click1.ogg` |
| `sfx/produce.mp3` | a part comes out of a generator or crate | Interface Sounds | `Audio/drop_002.ogg` |
| `sfx/merge.mp3` | a merge (pitched up a pentatonic step per tier) | Interface Sounds | `Audio/pluck_001.ogg` |
| `sfx/discovery.mp3` | a first find (with the merge) | Interface Sounds | `Audio/confirmation_003.ogg` |
| `sfx/crack.mp3` | tideglass cracks | Interface Sounds | `Audio/glass_002.ogg` |
| `sfx/shatter.mp3` | tideglass breaks | Impact Sounds | `Audio/impactGlass_light_001.ogg` |
| `sfx/shatter-tail.mp3` | its tail | Interface Sounds | `Audio/glass_004.ogg` |
| `sfx/coins.mp3` | coins (order delivered, rewards) | RPG Audio | `Audio/handleCoins.ogg` |
| `sfx/deliver.mp3` | an order delivered (with the coins) | Interface Sounds | `Audio/select_003.ogg` |
| `sfx/milestone.mp3` | a level, a new generator, a completed book page | Music Jingles | `Audio/Pizzicato jingles/jingles_PIZZI01.ogg` |
| `sfx/build.mp3` | a stage built on the coast (the construction knock) | Impact Sounds | `Audio/impactPlank_medium_001.ogg` |
| `sfx/build-jingle.mp3` | a stage built (the flourish after the knock) | Music Jingles | `Audio/Pizzicato jingles/jingles_PIZZI03.ogg` |
| `sfx/sparkle.mp3` | a rare extra, a book entry | Interface Sounds | `Audio/maximize_006.ogg` |
| `sfx/unseal.mp3` | sealed cargo opened | RPG Audio | `Audio/metalLatch.ogg` |
| `sfx/error.mp3` | a refused action | Interface Sounds | `Audio/error_008.ogg` |
| `sfx/reward.mp3` | a daily gift, a shop or ad reward | Interface Sounds | `Audio/confirmation_002.ogg` |

**Processing:** each file was converted with ffmpeg to MP3 96 kbps mono 44.1 kHz. Nothing else was changed: no trimming and no effects. Levels are set in the game's code (`v5/next/sfx.mjs`). All 16 files together are 132 KB.

**Shipped-file SHA-256:**

| File | SHA-256 |
|---|---|
| build-jingle | `17fb1ba0de5b74871d0d1d18340bf9e4678d8403b05af86a990d395ccfc69f25` |
| build | `2879c0e3bb74f52cfae913f646c6b3895a76d364ab7ccfb9b914aa2f1d0d9fa0` |
| coins | `224636bb46bddfa53102200e802d2b0961c6428fcbdf6769079b3c53fd234e66` |
| crack | `721d23a14127b7b25f8da7f889d15fddeff9f973d2a1d06f26645464edbd3e06` |
| deliver | `e998ff96723603cc96a023969fe5241b32f6b0c027316c7ab63b7e446700a7d1` |
| discovery | `df91bc83f3253f199aecbd1b0ded1b418f77a837f9cabf7e2ce12f39bcf13632` |
| error | `3210c4dd34d968da919139fb36c8fc4834d7a0bd3d37a3bb864ae96807f824b6` |
| merge | `2ee24ffc72827e1ca5db8964a7198212a1db973aa8b704807cd46c1c81f68fef` |
| milestone | `809ca361c220ec925774b0601143a02508b4ac2d36f199945daaa52bd1d6a805` |
| produce | `ae0da5fd1efbe61870fc25e4c5efd05e37668b73305d2901a3b349882156e016` |
| reward | `62cfa78c87c0b175652a7077f1f1245df965f72465e0b01368c512c20eb1b820` |
| shatter-tail | `953ebb549de7a4bce4c9323d5c89fae4cf9d0fbec66af62061e2c9495dbd886f` |
| shatter | `5578af3df7cec4a45bb72817dc7b2b7965555fa3957a55526667e5a5ba3ab18f` |
| sparkle | `ca7090b0843c3a8d5b38f6677e2ea08a501079a8abb25068a8ec499f9c9f8776` |
| tap | `87aceebe4d8c0f12556dfa8ea5f32255a1cdc42f224af750ccfb4a575b1bc511` |
| unseal | `eb03be13a1ca5cbb7fa4889f2dd915f8aa3d6b8f5545a126646d6c19f0350438` |

## How the game uses them

`v5/next/sfx.mjs` replaces the sounds Build 44 synthesised in code; no sound is generated at runtime any more. The rules
are unchanged:
- The player's Sound setting mutes everything.
- Nothing plays before the first tap (browser autoplay rules). The music is not even downloaded before then.
- Sound and music stop while an ad plays, while the platform mutes or pauses the game (Playgama's audio and pause state;
  CrazyGames' mute) and while the page is hidden. They resume afterwards.
- Repeated cues are throttled.
