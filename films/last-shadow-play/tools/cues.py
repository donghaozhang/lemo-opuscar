"""Subtitle cues (placards and plaques) → out/cues.json for core/render/srt.py"""
import json, os
D = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TL = json.load(open(os.path.join(D, 'timeline.json')))
cues = [dict(t0=p['t0'], t1=p['t1'], text=p['text']) for p in TL['placards'] + TL['plaques']]
cues.sort(key=lambda c: c['t0'])
os.makedirs(os.path.join(D, 'out'), exist_ok=True)
json.dump(cues, open(os.path.join(D, 'out', 'cues.json'), 'w'), ensure_ascii=False, indent=1)
print(len(cues), 'cues')
