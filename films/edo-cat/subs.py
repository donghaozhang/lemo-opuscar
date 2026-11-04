"""events.json 'sub' events → out/subs.json → subtitles.srt (via core/render/srt.py)"""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
E = json.load(open(os.path.join(HERE, 'events.json')))
cues = [{'t0': e['t'], 't1': e['t1'], 'text': e['text']} for e in E['ev'] if e['type'] == 'sub']
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
json.dump(cues, open(os.path.join(HERE, 'out/subs.json'), 'w'), ensure_ascii=False)
print(len(cues), 'cues')
