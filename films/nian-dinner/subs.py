"""Subtitles: the banners in timeline.json → out/cues.json → nian-dinner.srt (via core/render/srt.py)"""
import json, os, subprocess, sys
FILM = os.path.dirname(os.path.abspath(__file__)); ROOT = os.environ.get('LIB') or os.path.abspath(os.path.join(FILM, '..', '..'))
TL = json.load(open(os.path.join(FILM, 'timeline.json')))
cues = [{'t0': round(b['t0'], 3), 't1': round(b['t1'], 3), 'text': b['text']} for b in TL['banners']]
os.makedirs(os.path.join(FILM, 'out'), exist_ok=True)
json.dump(cues, open(os.path.join(FILM, 'out', 'cues.json'), 'w'), ensure_ascii=False, indent=1)
subprocess.run([os.path.join(ROOT, '.venv/bin/python'), os.path.join(ROOT, 'core/render/srt.py'), os.path.join(FILM, 'out', 'cues.json'), os.path.join(FILM, 'nian-dinner.srt')], check=True)
for c in cues: print(c)
