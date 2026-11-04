"""Cue check: every picture hit (timeline.json HIT) against the score's sync point of the same name (music/score.json)
and the trap-box events (events.json). Prints the worst offset; exits 1 if any is over 1 frame (41.7 ms)."""
import json, os, sys
D = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HIT = json.load(open(os.path.join(D, 'timeline.json')))['HIT']
KEYS = json.load(open(os.path.join(D, 'music/score.json')))['keys']
EV = json.load(open(os.path.join(D, 'events.json')))['ev']
worst, n = 0, 0
for k, t in sorted(KEYS.items(), key=lambda x: x[1]):
    if k not in HIT: continue
    d = (t - HIT[k]) * 1000; worst = max(worst, abs(d)); n += 1
    print(f'{k:10s} picture {HIT[k]:7.3f}  score {t:7.3f}  {d:+6.1f} ms')
# trap-box events that must sit on a named hit
pairs = [('bonk', 'bonk'), ('stamp', 'stamp1'), ('ding', 'ding'), ('bell', 'bell'), ('trip', 'trip'), ('hiss', 'catch'), ('pat', 'pat'), ('clunk', 'slot'), ('grind', 'jam')]
for typ, h in pairs:
    ts = [e['t'] for e in EV if e['type'] == typ]
    d = min(abs(t - HIT[h]) for t in ts) * 1000; worst = max(worst, d); n += 1
    print(f'{typ:10s} picture {HIT[h]:7.3f}  trap  {min(ts, key=lambda t: abs(t - HIT[h])):7.3f}  {d:+6.1f} ms')
print(f'{n} cues, worst {worst:.1f} ms')
sys.exit(0 if worst <= 41.7 else 1)
