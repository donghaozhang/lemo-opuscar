"""CJK glyph check: every character the film draws (timeline.json strings + the sign and boat text + chapter cards) must be in the subset fonts' cmap.
usage: python tools/cjkcheck.py  → exits 1 if any character is missing"""
import os, sys, json, re
from fontTools.ttLib import TTFont
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TL = json.load(open(os.path.join(HERE, 'timeline.json'), encoding='utf-8'))
text = TL['TITLE'] + ''.join(L['who'] + L['text'] for L in TL['LINES']) + ''.join(s.get('card', '') for s in TL['SHOTS']) + '卫生所谢谢周爷爷'
for fn in ['town.js', 'ui.js']: text += re.sub(r'[\x00-\x7f]', '', re.sub(r'//.*', '', open(os.path.join(HERE, fn), encoding='utf-8').read()))
chars = sorted(set(c for c in text if ord(c) > 127 and not c.isspace()))
missing = {}
for f in ['sc5.woff2', 'sc7.woff2']:
    cmap = TTFont(os.path.join(HERE, 'fonts', f)).getBestCmap()
    miss = [c for c in chars if ord(c) not in cmap]
    missing[f] = miss; print(f, len(chars), 'characters needed,', len(miss), 'missing', ''.join(miss))
sys.exit(1 if any(missing.values()) else 0)
