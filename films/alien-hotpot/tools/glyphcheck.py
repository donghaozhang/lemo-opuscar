"""CJK glyph check: every non-ASCII character drawn by the film (JS sources, subtitles) must be in the subset font it is drawn with."""
import glob, json, os, sys
from fontTools.ttLib import TTFont
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cmap = TTFont(os.path.join(HERE, 'fonts/zcool.ttf')).getBestCmap()
src = ''.join(open(f, encoding='utf8').read() for f in glob.glob(os.path.join(HERE, '*.js')))
# only characters inside string literals matter; comments are not drawn, but checking them too is stricter
E = json.load(open(os.path.join(HERE, 'events.json')))
src += ''.join(e.get('text', '') + e.get('who', '') for e in E['ev'] if e['type'] == 'sub')
chars = sorted(set(c for c in src if ord(c) > 0x7f))
# characters from comments and the box-drawing/arrow punctuation in code comments are excluded when not in drawn strings
drawn = set()
import re
for s in re.findall(r"'([^'\n]*)'|`([^`\n]*)`", src):
    for part in s: drawn |= set(c for c in part if ord(c) > 0x7f)
drawn |= set(''.join(e.get('text', '') + e.get('who', '') for e in E['ev'] if e['type'] == 'sub'))
miss = sorted(c for c in drawn if ord(c) not in cmap)
print(f'glyphcheck: {len(drawn)} drawn non-ASCII characters, missing: {"".join(miss) or "none"}')
sys.exit(1 if miss else 0)
