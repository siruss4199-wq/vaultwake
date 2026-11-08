# Vaultwake Merge: CrazyGames Basic Launch package

Release candidate, **not approved for public release.** See `OUTSTANDING_APPROVALS.md`.

| Item | File |
|---|---|
| Upload ZIP (Basic Launch, no ads) | `vaultwake-merge-crazygames-basic-dd65d3f.zip` (14.2 MB, 334 files) |
| Checksums (ZIP, covers, videos) | `SHA256SUMS` |
| Source commit and build facts | `SOURCE_COMMIT.txt` (`dd65d3f775f1bd4b8e5a529aa6418d6250e5f7f9`) |
| Covers | `covers/cover-landscape-1920x1080.png`, `covers/cover-portrait-800x1200.png`, `covers/cover-square-800x800.png` |
| Gameplay previews (silent, 16.9 s) | `videos/vaultwake-merge-gameplay-landscape-1920x1080.mp4`, `videos/vaultwake-merge-gameplay-portrait-1080x1620.mp4` |
| Submission text (English) | `METADATA.md` |
| Rights and name report | `RIGHTS_REPORT.md`, with per-file detail in `ASSET_INVENTORY.csv` |
| Technical checklist with evidence | `CHECKLIST.md`, `evidence/` |
| What the owner must still do | `OUTSTANDING_APPROVALS.md` |

## Verify the ZIP

```bash
cd release/crazygames-basic && sha256sum -c SHA256SUMS
git checkout dd65d3f && node tools/coast-crazygames.mjs --zip   # rebuild
cmp dist/vaultwake-coast-crazygames.zip release/crazygames-basic/vaultwake-merge-crazygames-basic-dd65d3f.zip
```

The ZIP is reproducible: fixed file timestamps, sorted entries and no extra attributes. The CI workflow
`.github/workflows/v5-crazygames-basic-release.yml` repeats the rebuild and comparison on every push.

## Play it locally

```bash
mkdir /tmp/vw && unzip -q vaultwake-merge-crazygames-basic-dd65d3f.zip -d /tmp/vw
python3 -m http.server 8081 --directory /tmp/vw   # then open http://127.0.0.1:8081/
```

## Remake the media

```bash
python3 tools/release-covers.py release/crazygames-basic/covers /tmp/video   # covers + the 1080x1620 opening frame
node tools/release-video-save.mjs > /tmp/video/save.json
SAVE=/tmp/video/save.json OUT=/tmp/video/l VIEW='[960,540,2]' node tools/release-gameplay-video.cjs   # serve the unzipped ZIP on :8081 first
SAVE=/tmp/video/save.json OUT=/tmp/video/p VIEW='[540,810,2]' node tools/release-gameplay-video.cjs
python3 tools/release-video-assemble.py /tmp/video/l release/crazygames-basic/covers/cover-landscape-1920x1080.png release/crazygames-basic/videos/vaultwake-merge-gameplay-landscape-1920x1080.mp4 1920 1080 0.5
python3 tools/release-video-assemble.py /tmp/video/p /tmp/video/video-cover-1080x1620.png release/crazygames-basic/videos/vaultwake-merge-gameplay-portrait-1080x1620.mp4 1080 1620 0.5
```
