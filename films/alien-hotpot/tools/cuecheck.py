"""Every visual hit (timeline HITS) against the beat of its music section: prints the offset; exits 1 if any is off by > 1 ms."""
import json, os, sys
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
E = json.load(open(os.path.join(HERE, 'events.json')))
SEC = {e['name']: e for e in E['ev'] if e['type'] == 'cue'}
bad = 0
for h in [e for e in E['ev'] if e['type'] == 'hit']:
    s = SEC[h['sec']]; bpm = s['bpm'] or 120
    want = s['t'] + h['beat'] * 60 / bpm; off = (h['t'] - want) * 1000
    print(f"{h['name']:11s} {h['t']:8.3f}s  {h['sec']:8s} beat {h['beat']:3}  offset {off:+6.1f} ms"); bad += abs(off) > 1
# every shot cut that starts a music section lands on it
for s in SEC.values():
    shots = [e['t'] for e in E['ev'] if e['type'] == 'shot']
    near = min(abs(x - s['t']) for x in shots)
    if near > .001: print(f"section {s['name']} at {s['t']} has no cut on it (nearest {near * 1000:.0f} ms)")
print('cuecheck:', 'ok' if not bad else f'{bad} off'); sys.exit(1 if bad else 0)
