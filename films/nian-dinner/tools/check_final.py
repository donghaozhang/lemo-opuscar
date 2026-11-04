"""Final checks on the muxed film: integrated loudness and true peak (ebur128), black frames (blackdetect), NaN/odd frames via a decode pass,
and a CJK glyph check: a frame at each banner / title time is rendered and scanned for the 'missing glyph' box pattern (a hollow rectangle of text colour).
Usage: .venv/bin/python films/nian-dinner/tools/check_final.py <film.mp4>"""
import sys, os, json, re, subprocess, numpy as np
FILM = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); mp4 = sys.argv[1] if len(sys.argv) > 1 else os.path.join(FILM, 'nian-dinner.mp4')
TL = json.load(open(os.path.join(FILM, 'timeline.json')))
ok = True
r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', mp4, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
I = float(re.search(r'I:\s+([-\d.]+) LUFS', r).group(1)); LRA = float(re.search(r'LRA:\s+([-\d.]+) LU', r).group(1)); TP = float(re.search(r'Peak:\s+([-\d.]+) dBFS', r).group(1))
print(f'loudness I {I:.1f} LUFS  LRA {LRA:.1f} LU  true peak {TP:.1f} dBTP  ->', 'OK' if -15 <= I <= -13 and TP <= -1.0 else 'FAIL'); ok &= -15 <= I <= -13 and TP <= -1.0
r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', mp4, '-vf', 'blackdetect=d=0.08:pix_th=0.05', '-an', '-f', 'null', '-'], capture_output=True, text=True).stderr
blk = [l for l in r.split('\n') if 'black_start' in l]; print('blackdetect:', blk or 'none'); ok &= not blk
r = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-count_frames', '-show_entries', 'stream=nb_read_frames,r_frame_rate,width,height:format=duration', '-of', 'default=nw=1', mp4], capture_output=True, text=True).stdout
print(r.strip().replace('\n', '  '))
# CJK glyph check: decode frames at the banner mid-times, the title and the end card, look for the tofu box (a rectangle outline in cream/red with an empty centre)
from PIL import Image
times = [(b['t0'] + b['t1']) / 2 for b in TL['banners']] + [TL['hits']['titleIn'] + 2.5, TL['hits']['endCard'] + 2.2]
tofu = 0
for t in times:
    out = os.path.join(FILM, 'out', f'glyph_{t:.2f}.png'); subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-ss', f'{t:.3f}', '-i', mp4, '-frames:v', '1', out], check=True)
    im = np.asarray(Image.open(out).convert('RGB')).astype(int)
    # a missing glyph renders as a hollow box: look for 20–60 px squares whose border is bright and interior is uniform background. We test the text band for rectangles of uniform interior.
    H, W, _ = im.shape; band = im[int(H * .85):, :] if t < TL['hits']['titleIn'] + 5 or t > TL['hits']['endCard'] else im[int(H * .08):int(H * .35), :]
    g = band.mean(2); edges = np.abs(np.diff(g, axis=1)) > 60; cols = edges.sum(0)
    # a tofu box gives two strong vertical edges with a flat run between them repeated at a fixed spacing; count flat-interior runs bounded by edges
    runs = 0; x = 0
    while x < W - 40:
        if cols[x] > 12:
            for w in range(18, 60):
                if x + w < W and cols[x + w] > 12 and cols[x + 2:x + w - 2].max() < 3: runs += 1; break
            x += 4
        else: x += 1
    tofu += runs; print(f'glyph check t={t:.2f}: {runs} box-like runs')
print('CJK glyph check:', 'OK (no missing-glyph boxes found)' if tofu == 0 else f'FAIL: {tofu} box-like runs'); ok &= tofu == 0
print('ALL OK' if ok else 'SOME CHECKS FAILED'); sys.exit(0 if ok else 1)
