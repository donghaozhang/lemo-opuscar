"""CJK glyph check: every character the film prints (cartouches, seals, shout, end, .srt) exists in the font that draws it."""
import json, os, sys
from fontTools.ttLib import TTFont
HERE = os.path.dirname(os.path.abspath(__file__))
E = json.load(open(os.path.join(HERE, 'events.json')))
texts = [e['text'] for e in E['ev'] if e['type'] == 'sub'] + ['猫', '鱼', '猫鱼', '江户猫追鱼记']
need = {'brush.ttf': set(''.join(texts)) - {' ', '·'}, 'serif-600.ttf': set('江户猫追鱼记')}
bad = 0
for f, chars in need.items():
    cmap = TTFont(os.path.join(HERE, 'fonts', f)).getBestCmap(); miss = [c for c in chars if ord(c) not in cmap]
    print(f, len(chars), 'chars, missing:', ''.join(miss) or 'none'); bad += len(miss)
sys.exit(1 if bad else 0)
