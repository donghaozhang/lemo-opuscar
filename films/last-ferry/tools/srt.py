"""Export the .srt from the dialogue table in timeline.json (the same data that drives the dialogue boxes): python tools/srt.py [out.srt]"""
import os, sys, json
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TL = json.load(open(os.path.join(HERE, 'timeline.json'), encoding='utf-8'))
def fmt(s): ms = int(round(max(0, s) * 1000)); return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"
cues = [(L['t'] + .2, L['out'], f"{L['who']}：{L['text']}") for L in TL['LINES']]
cues.append((TL['T']['title'] + .3, TL['T']['titleOut'], TL['TITLE']))
cues.sort()
for k in range(len(cues) - 1): cues[k] = (cues[k][0], min(cues[k][1], cues[k + 1][0]), cues[k][2])
out = '\n'.join(f"{k + 1}\n{fmt(a)} --> {fmt(b)}\n{txt}\n" for k, (a, b, txt) in enumerate(cues))
p = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'out', 'subtitles.srt')
open(p, 'w', encoding='utf-8').write(out); print(p, len(cues), 'cues')
