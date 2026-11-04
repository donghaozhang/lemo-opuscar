"""Cue check: for each hit point the score must land on, find the audio onset in the score near the hit time and report the error in ms.
Run from the library root: .venv/bin/python films/nian-dinner/tools/cuecheck.py   (exit 1 if any hit is off by more than 40 ms)"""
import sys, os, json, numpy as np, soundfile as sf
FILM = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TL = json.load(open(os.path.join(FILM, 'timeline.json'))); HIT = TL['hits']
SRC = os.path.join(FILM, 'out', 'mix.wav') if os.path.exists(os.path.join(FILM, 'out', 'mix.wav')) and '--score' not in sys.argv else os.path.join(FILM, 'music', 'score.wav')
x, sr = sf.read(SRC); x = x.mean(1) if x.ndim > 1 else x; print('checking', os.path.relpath(SRC, FILM))
# onset = where the short-time energy rises fastest within ±120 ms of the hit
def onset(t, win=.12):
    a, b = int((t - win) * sr), int((t + win) * sr); seg = np.abs(x[a:b]); n = int(.005 * sr)
    e = np.convolve(seg, np.ones(n) / n, 'same'); d = np.diff(e); j = int(np.argmax(d)); i = j
    while i > 0 and d[i - 1] > .2 * d[j]: i -= 1   # the start of the dominant rise
    return a / sr + i / sr, d[j]
CHECK = ['titleIn', 'seal', 'village', 'fold1', 'fold2', 'fold3', 'nianReveal', 'sneeze', 'dive', 'gulp', 'nianHappy', 'squash', 'giant', 'decide', 'run', 'bound1', 'lift', 'free', 'skid', 'unfold', 'gong', 'backlight', 'gulp2', 'endCard']
worst = 0; bad = 0
for k in CHECK:
    t = HIT[k]; on, strength = onset(t); err = (on - t) * 1000; worst = max(worst, abs(err)); ok = abs(err) <= 40; bad += not ok
    print(f"{'OK ' if ok else 'OFF'} {k:12s} hit {t:8.3f}  onset {on:8.3f}  err {err:+7.1f} ms")
print(f'worst {worst:.1f} ms, {bad} off (tolerance 40 ms)')
sys.exit(1 if bad else 0)
