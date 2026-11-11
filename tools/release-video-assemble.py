#!/usr/bin/env python3
"""Turns a recorded screencast (tools/release-gameplay-video.cjs: JPEG frames + their timestamps) into a
CrazyGames gameplay preview: the static cover first, a half-second crossfade into the real play, real-time
frame timing (no speed-up), silent H.264 MP4 at 30 fps.

  python3 tools/release-video-assemble.py FRAMES_DIR COVER.png OUT.mp4 WIDTH HEIGHT [TRIM_START_S]
"""
import json, os, subprocess, sys, tempfile
frames_dir, cover, out, W, H = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]), int(sys.argv[5])
trim = float(sys.argv[6]) if len(sys.argv) > 6 else 0.0
COVER_S, FADE_S = 1.6, 0.5
d = json.load(open(os.path.join(frames_dir, 'frames.json')))
fr = [f for f in d['frames'] if f['t'] - d['frames'][0]['t'] >= trim]
tmp = tempfile.mkdtemp()
lst = os.path.join(tmp, 'frames.txt')
with open(lst, 'w') as f:
    for a, b in zip(fr, fr[1:] + [None]):
        f.write(f"file '{a['file']}'\nduration {((b['t'] - a['t']) if b else 0.6):.4f}\n")
    f.write(f"file '{fr[-1]['file']}'\n")
play = os.path.join(tmp, 'play.mp4')
run = lambda *a: subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', *a], check=True)
run('-f', 'concat', '-safe', '0', '-i', lst, '-vf', f'scale={W}:{H}:flags=lanczos,fps=30,format=yuv420p',
    '-c:v', 'libx264', '-crf', '16', '-preset', 'slow', play)
run('-loop', '1', '-t', str(COVER_S + FADE_S), '-i', cover, '-i', play,
    '-filter_complex', f'[0:v]scale={W}:{H}:flags=lanczos,fps=30,format=yuv420p,setsar=1,settb=1/30[c];[1:v]fps=30,setsar=1,settb=1/30[p];'
    f'[c][p]xfade=transition=fade:duration={FADE_S}:offset={COVER_S}[v]',
    '-map', '[v]', '-an', '-c:v', 'libx264', '-crf', '18', '-preset', 'slow', '-profile:v', 'high',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out)
p = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration,size:stream=width,height,codec_name,r_frame_rate,codec_type',
                    '-of', 'json', out], capture_output=True, text=True, check=True)
print(out, json.loads(p.stdout))
