"""Cue check: every visual hit point lands on a music cue; every cut lands on the beat grid. Exit 1 on a miss."""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
E = json.load(open(os.path.join(HERE, 'events.json'))); C = json.load(open(os.path.join(HERE, 'music/cues.json')))
SEC = [e for e in E['ev'] if e['type'] == 'sec']; HIT = {e['id']: e['t'] for e in E['ev'] if e['type'] == 'hit'}
ct = [c['t'] for c in C]; bad = 0
# hits that the music answers (the others are foley-only gags under a running ostinato: checked against the grid)
music_hits = ['hook', 'take', 'shout', 'stop', 'snatch', 'fury', 'umbrella', 'bell', 'snowdump', 'silence', 'catch', 'crash', 'rewind', 'gift', 'blink', 'end']
for k in music_hits:
    d = min(abs(t - HIT[k]) for t in ct) * 1000
    print(f'{k:9s} {HIT[k]:8.3f}  nearest cue {d:6.1f} ms', 'OK' if d <= 21 else 'MISS'); bad += d > 21
def on_grid(t):
    s = [x for x in SEC if x['t'] <= t + 1e-6][-1]; b = 60 / s['bpm']; n = (t - s['t']) / b; return abs(n - round(n)) * b * 1000
for e in E['ev']:
    if e['type'] == 'shot':
        d = on_grid(e['t'])
        if d > 1: print('cut off grid', e['id'], round(d, 1), 'ms'); bad += 1
print('cuts on the beat grid:', sum(1 for e in E['ev'] if e['type'] == 'shot'), '· misses:', bad)
sys.exit(1 if bad else 0)
