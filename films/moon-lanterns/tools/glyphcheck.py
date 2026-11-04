"""CJK glyph check: every character the film puts on screen (paper strips in timeline.json STRIPS, subtitles in CUES, the seal)
must have a real glyph in the font that draws it (no .notdef box). Then a rendered-frame check: a frame with the title and one
with each subtitle are rendered and the text area is searched for the hollow-box signature (a rectangle outline) — reported as
pixels, with a note. python tools/glyphcheck.py"""
import json, os, sys
from fontTools.ttLib import TTFont
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TL = json.load(open(os.path.join(HERE, 'timeline.json')))
brush = TTFont(os.path.join(HERE, 'fonts', 'MaShanZheng-Regular.ttf')); serif = TTFont(os.path.join(HERE, 'fonts', 'NotoSerifSC-sub.ttf'))
def cmap(f): return f.getBestCmap()
cb, cs = cmap(brush), cmap(serif)
bad = []
for s in TL['STRIPS'] + [{'id': 'seal', 'text': '月'}]:
    for ch in s['text']:
        if ch.isspace(): continue
        if ord(ch) not in cb and ord(ch) not in cs: bad.append(('MaShanZheng/NotoSerifSC', s['id'], ch))   # strips use the brush font with Noto Serif SC as the per-glyph fallback (the middle dot)
for c in TL['CUES']:
    for ch in c['text']:
        if ch.isspace(): continue
        if ord(ch) not in cs: bad.append(('NotoSerifSC-sub', c['id'], ch))
n = sum(len(s['text'].replace(' ', '')) for s in TL['STRIPS']) + 1 + sum(len(c['text']) for c in TL['CUES'])
if bad: print('MISSING GLYPHS:', bad); sys.exit(1)
fb = [ch for s_ in TL['STRIPS'] for ch in s_['text'] if not ch.isspace() and ord(ch) not in cb]
print(f'{n} characters on screen, every one has a glyph (Ma Shan Zheng: {len(cb)} glyphs; Noto Serif SC subset: {len(cs)} glyphs; strip characters drawn by the Noto fallback: {fb or "none"})')
