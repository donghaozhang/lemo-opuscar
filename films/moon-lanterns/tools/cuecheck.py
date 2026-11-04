"""Cue check: every visual hit in timeline.json against the sound mix.py placed for it (out/cues.json) and the page's
exported events (events.json). Reports the offset per hit; the target is 0 ms (an intended offset is listed).
python tools/cuecheck.py"""
import json, os, sys
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TL = json.load(open(os.path.join(HERE, 'timeline.json'))); H = TL['HIT']
C = json.load(open(os.path.join(HERE, 'out', 'cues.json')))
EV = json.load(open(os.path.join(HERE, 'events.json')))['ev'] if os.path.exists(os.path.join(HERE, 'events.json')) else None
INTENDED = { 'lampOn': .02, 'click1': .04, 'click2': .04, 'click3': .04, 'rack': .1, 'setLantern': .05, 'moonBack': .2, 'radioOn': -.4, 'fogIn': .2 }   # sound placed deliberately off the frame (a click, then the shimmer…)
worst = 0; rows = []
for k, v in H.items():
    if k not in C: continue
    vals = v if isinstance(v, list) else [v]
    got = C[k]
    for i, t in enumerate(vals):
        if i >= len(got): break
        off = got[i] - t - INTENDED.get(k, 0)
        worst = max(worst, abs(off)); rows.append((k, i, t, got[i], off))
for k, i, t, g, off in rows: print(f'{k:14} {i:2} picture {t:8.3f}  sound {g:8.3f}  offset {off * 1000:+6.1f} ms')
if EV is not None:
    evt = {}
    for e in EV: evt.setdefault(e['type'], []).append(e['t'])
    bad = [(k, v) for k, v in H.items() if (v if isinstance(v, list) else [v]) != evt.get(k, [])]
    print('events.json agrees with timeline.json for every hit' if not bad else f'events.json differs for {bad}')
print(f'{len(rows)} cues checked, worst offset {worst * 1000:.1f} ms')
sys.exit(0 if worst < .0005 else 1)
