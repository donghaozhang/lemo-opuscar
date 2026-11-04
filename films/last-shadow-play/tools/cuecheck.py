"""Cue check: every exported picture event (events.json) must sit on a hit of the timeline grid (timeline.json), and the score's accents must sit on the same hits.
Run from the library root: .venv/bin/python films/last-shadow-play/tools/cuecheck.py   (exit 1 if any cue is off by more than 1 ms)"""
import json, os, sys
D = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TL = json.load(open(os.path.join(D, 'timeline.json'))); H = TL['hit']
EV = json.load(open(os.path.join(D, 'events.json'))); ev = EV.get('ev') or EV.get('events')
# which event types are the visual hits the music must land on, and the hit they belong to
MAP = {'match': 'match', 'ignite': 'lampOn', 'clap': ('clap1', 'clap2', 'clap3'), 'presson': ('titleIn', 'mountain', 'pine', 'monkeyIn', 'labelIn', 'maidenIn', 'endIn'),
       'liftoff': ('titleOut', 'labelOut', 'skullOff'), 'thwack': ('hit1', 'hit2', 'hit3', 'hit4', 'demonBack'), 'land': ('land1', 'land2', 'land3', 'land4'),
       'flare': 'eyeFlare', 'swap': 'headSwap', 'fallflap': 'fall', 'grab': 'grab', 'skull': 'skullHit', 'handtap': 'tap', 'strike': 'strike', 'pfft': 'out', 'click': 'click',
       'torchon': 'torch', 'applause': 'bigGong', 'chain': 'lampLift', 'lamphand': 'taken0', 'gutter': 'gutter', 'rodslip': 'rodsSlip', 'thud': 'clawDown', 'gasp': 'gasp'}
worst = 0; n = 0; bad = []
for e in ev:
    m = MAP.get(e['type']);
    if not m: continue
    names = m if isinstance(m, tuple) else (m,)
    d = min(abs(e['t'] - H[k]) for k in names); n += 1; worst = max(worst, d)
    if d > .001: bad.append((e['type'], e['t'], d))
# the score's accents: read back from score.py's own cue list if present
sc = os.path.join(D, 'music', 'score.json')
if os.path.exists(sc):
    S = json.load(open(sc))
    for k, t in S.get('accents', {}).items():
        d = abs(t - H[k]); n += 1; worst = max(worst, d)
        if d > .001: bad.append(('score:' + k, t, d))
print(f'cuecheck: {n} cues, worst {worst * 1000:.1f} ms')
for b in bad: print('  OFF', b)
sys.exit(1 if bad else 0)
