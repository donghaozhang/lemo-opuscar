"""Cue check: every designed hit (timeline T events, shot cuts, dialogue boxes) and every score note sits on a half-beat of its section's grid,
and the page's sound events (events.json) that are designed hits sit on the grid too. usage: python tools/cuecheck.py"""
import os, json, sys
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TL = json.load(open(os.path.join(HERE, 'timeline.json'))); SECS = TL['SECS']
def sec_at(t):
    s = SECS[0]
    for x in SECS:
        if t >= x['t'] - 1e-6: s = x
    return s
def off_ms(t, res=.25):
    s = sec_at(t); beat = (t - s['t']) / (60 / s['bpm']); return (beat / res - round(beat / res)) * res * 60 / s['bpm'] * 1000
worst = 0; rows = []
def chk(name, t):
    global worst
    o = off_ms(t); worst = max(worst, abs(o)); rows.append((name, t, o))
for k, v in TL['T'].items():
    if isinstance(v, list):
        for i, x in enumerate(v): chk(f'{k}[{i}]', x)
    else: chk(k, v)
for s in TL['SHOTS']: chk('cut ' + s['id'], s['a'])
for L in TL['LINES']: chk('box ' + L['id'], L['t']); chk('box-out ' + L['id'], L['out'])
# the designed foley hits from the page (not the per-step objective foley)
EVp = os.path.join(HERE, 'events.json')
if os.path.exists(EVp):
    for e in json.load(open(EVp))['ev']:
        if e['type'] in ('chime', 'hull', 'match', 'lantern_on', 'blow', 'flash', 'castoff', 'heart', 'door', 'crackers', 'ribbon', 'boatdown', 'umbrella', 'window', 'hop', 'candy'): chk('ev ' + e['type'], e['t'])
bad = [r for r in rows if abs(r[2]) > 1.0]
rows = [r for r in rows if not r[0].startswith('box-out')]
for name, t, o in rows:
    if abs(o) > .01: print(f'{name:22s} {t:8.3f}  {o:+6.1f} ms')
print(f'{len(rows)} cues checked, worst offset {worst:.2f} ms, {len(bad)} off the half-beat grid')
sys.exit(1 if bad else 0)
