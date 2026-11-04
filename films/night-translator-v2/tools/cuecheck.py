"""Cue check: every score sync point (music/score.json) against the picture hit of the same name (timeline.json HIT),
and every shot cut against the section grid. The trap box (mix.py) is scheduled from the same HIT table.
Prints the worst offset; exits 1 if any is over one frame (41.7 ms)."""
import json, os, sys
D = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TL = json.load(open(os.path.join(D, 'timeline.json'))); HIT, SEC = TL['HIT'], TL['SEC']
KEYS = json.load(open(os.path.join(D, 'music/score.json')))['keys']
worst, n = 0, 0
for k, t in sorted(KEYS.items(), key=lambda x: x[1]):
    if k not in HIT: continue
    d = abs(t - HIT[k]) * 1000; worst = max(worst, d); n += 1
    if d > 1: print(f'{k:10s} picture {HIT[k]:8.3f}  score {t:8.3f}  {d:6.1f} ms')
for s in TL['SHOTS']:
    grid = SEC[s['sec']]['t0'] + s['b'] * SEC[s['sec']]['beat']
    d = abs(grid - s['t0']) * 1000; worst = max(worst, d); n += 1
print(f'{n} cues ({len([k for k in KEYS if k in HIT])} score sync points, {len(TL["SHOTS"])} cuts), worst {worst:.1f} ms')
sys.exit(0 if worst <= 41.7 else 1)
