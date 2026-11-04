"""Cue check: every visual hit in timeline.json lands (1) on its music grid beat when it names one, (2) on a score accent when the
score marks one there, and (3) on a sound event in events.json. Prints the offsets; exits 1 if any offset exceeds half a frame (21 ms)."""
import json, os, sys
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
tl = json.load(open(os.path.join(HERE, 'timeline.json'))); ev = json.load(open(os.path.join(HERE, 'events.json')))['ev']
acc = json.load(open(os.path.join(HERE, 'music', 'score.json')))['accents']
sec = {s['id']: s for s in tl['sections']}
bad = 0; TOL = .021
for h in tl['hits']:
    t = h['t']; line = f"{h['name']:12s} {t:7.3f}s"
    if h.get('sec'):
        s = sec[h['sec']]; bt = s['t'] + h['beat'] * 60 / s['bpm']; d = t - bt; line += f"  grid {h['sec']}:{h['beat']:<3} {d * 1000:+6.0f} ms"
        if abs(d) > TOL: bad += 1; line += '  ✗'
    near = min(acc, key=lambda a: abs(a - t)) if acc else None
    if near is not None and abs(near - t) <= TOL: line += f"  accent {(near - t) * 1000:+4.0f} ms"
    sfx = min((e for e in ev if e['type'] not in ('raingain', 'bed', 'blip')), key=lambda e: abs(e['t'] - t))
    d2 = sfx['t'] - t; line += f"  sfx '{sfx['type']}' {d2 * 1000:+4.0f} ms"
    if abs(d2) > TOL: bad += 1; line += ' ✗'
    print(line)
print('cuecheck:', 'OK' if not bad else f'{bad} off'); sys.exit(1 if bad else 0)
