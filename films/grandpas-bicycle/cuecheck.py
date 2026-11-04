# Every picture hit (events.json, entries with a `hit` name) against the music cue of the same name (out/score_cues.json)
# and the grid (timeline.json). Prints the offsets; exits 1 if any is over one frame at 24 fps.
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
EV = json.load(open(os.path.join(HERE, 'events.json')))['ev']; HT = json.load(open(os.path.join(HERE, 'timeline.json')))['hits']
CUES = json.load(open(os.path.join(HERE, 'out', 'score_cues.json'))) if os.path.exists(os.path.join(HERE, 'out', 'score_cues.json')) else {}
FRAME = 1 / 24; bad = 0
pic = {e['hit']: e['t'] for e in EV if e.get('hit')}
for name, tg in HT.items():
    tp, tm = pic.get(name), CUES.get(name)
    parts = [f'{name:12s} grid {tg:8.3f}']
    if tp is None: parts.append('picture: (music only)')
    else: d = (tp - tg) * 1000; parts.append(f'picture {tp:8.3f} ({d:+5.0f} ms)'); bad += abs(tp - tg) > FRAME
    if tm is None: parts.append('music: (foley only)')
    else: d = (tm - tg) * 1000; parts.append(f'music {tm:8.3f} ({d:+5.0f} ms)'); bad += abs(tm - tg) > FRAME
    print('  '.join(parts))
print('cuecheck:', 'OK, every hit within a frame' if not bad else f'{bad} hit(s) off the grid'); sys.exit(1 if bad else 0)
