"""Cue check: every visual hit in timeline.json that has a music mark must have an audible onset in the score within tolerance.
Reads music/score.json (marks + measured onsets) and the timeline, prints the offset of each, exits 1 if any is beyond --tol ms (default 25)."""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); D = os.path.join(HERE, '..')
tol = float(sys.argv[sys.argv.index('--tol') + 1]) if '--tol' in sys.argv else 25.0
TL = json.load(open(os.path.join(D, 'timeline.json'))); SC = json.load(open(os.path.join(D, 'music', 'score.json')))
marks, onsets = SC['marks'], SC['selfcheck']['onsets']
HIT, SHOT = TL['hit'], TL['shot']
# which timeline hits the score marks correspond to (mark name → timeline time)
pairs = {}
for k, t in marks.items():
    if k in HIT: pairs[k] = (HIT[k], t)
    elif k in SHOT: pairs[k] = (SHOT[k], t)
bad = 0
print(f'{"mark":16s} {"timeline":>9s} {"score":>9s} {"onset":>9s} {"Δ ms":>7s}')
for k, (tt, tm) in sorted(pairs.items(), key=lambda x: x[1][0]):
    on = onsets.get(k); d = (on - tt) * 1000 if on is not None else None
    flag = '' if d is not None and abs(d) <= tol else '  <-- off'
    if flag: bad += 1
    print(f'{k:16s} {tt:9.3f} {tm:9.3f} {on if on is not None else float("nan"):9.3f} {d if d is not None else float("nan"):7.1f}{flag}')
print(f'{len(pairs)} cues checked, {bad} beyond ±{tol:.0f} ms')
sys.exit(1 if bad else 0)
