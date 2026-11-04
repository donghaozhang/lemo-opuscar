"""CJK glyph check: every character shown on screen (placards, plaques, the seal) must fall inside a unicode-range of the subset font files
in fonts/fonts.css for the family that draws it, so no frame can show a missing-glyph box. Run from the project folder; exit 1 on a miss."""
import re, json, os, sys
D = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
css = open(os.path.join(D, 'fonts', 'fonts.css'), encoding='utf-8').read()
fam = {}
for blk in re.findall(r'@font-face\{[^}]*\}', css):
    f = re.search(r"font-family:'([^']+)'", blk).group(1); ur = re.search(r'unicode-range:([^;]+);', blk)
    if not ur: continue
    s = fam.setdefault(f, set())
    for part in ur.group(1).split(','):
        part = part.strip()[2:]
        if '-' in part: a, b = part.split('-'); s.update(range(int(a, 16), int(b, 16) + 1))
        else: s.add(int(part, 16))
TL = json.load(open(os.path.join(D, 'timeline.json')))
texts = {'Noto Serif SC': ''.join(p['text'] for p in TL['placards']) + '说', 'Ma Shan Zheng': ''.join(p['text'] for p in TL['plaques']) + '皮影说'}
ok = True
for f, t in texts.items():
    miss = [c for c in set(t) if not c.isspace() and ord(c) > 127 and ord(c) not in fam[f]]
    print(f, len(set(t)), 'chars, missing:', miss or 'none'); ok = ok and not miss
print('cjkcheck', 'OK' if ok else 'FAIL'); sys.exit(0 if ok else 1)
