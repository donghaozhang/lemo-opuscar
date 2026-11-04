"""Cue check: every score sync point (music/score.json) against the picture hit of the same name (timeline.json HIT),
and every cut against its section's bar grid. Exits 1 if any offset is over one frame (41.7 ms)."""
import json, os, sys
D = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TL = json.load(open(os.path.join(D, 'timeline.json'))); HIT, SEC = TL['HIT'], TL['SEC']
KEYS = json.load(open(os.path.join(D, 'music/score.json')))['keys']
worst, n = 0.0, 0
for k, t in KEYS.items():
    if k in HIT: d = abs(t - HIT[k]) * 1000; worst = max(worst, d); n += 1
for s in TL['SHOTS']:
    g = SEC[s['sec']]['t0'] + s['b'] * SEC[s['sec']]['bar']; worst = max(worst, abs(g - s['t0']) * 1000); n += 1
print(f'{n} cues ({sum(k in HIT for k in KEYS)} score sync points, {len(TL["SHOTS"])} cuts on bars), worst {worst:.2f} ms')
sys.exit(0 if worst <= 41.7 else 1)
