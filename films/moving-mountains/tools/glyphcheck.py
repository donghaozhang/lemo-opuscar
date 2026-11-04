# 愚公移山 · CJK glyph check: every character on screen (captions, title, margin, end) is in the Noto Serif SC
# subset files that fonts.css loads, at both weights. Exit 1 if any is missing.
import os, re, sys, json
from fontTools.ttLib import TTFont
F = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
T = json.load(open(os.path.join(F, 'timeline.json')))
text = ''.join(c[3] for c in T['caps']) + '愚公移山列子汤问完·'
chars = sorted(set(ch for ch in text if ord(ch) > 127))
css = open(os.path.join(F, 'fonts', 'fonts.css')).read()
cover = {600: set(), 900: set()}
for wt, url in re.findall(r"font-weight:(\d+);font-display:block;src:url\(\./([^)]+)\)", css):
    f = TTFont(os.path.join(F, 'fonts', url)); cover[int(wt)] |= set(f.getBestCmap().keys())
miss = {wt: [c for c in chars if ord(c) not in cover[wt]] for wt in cover}
print(f'{len(chars)} distinct CJK characters; missing at 600: {miss[600] or "none"}; missing at 900 (title, 完): {[c for c in miss[900] if c in "愚公移山完"] or "none"}')
sys.exit(1 if miss[600] or [c for c in miss[900] if c in '愚公移山完'] else 0)
