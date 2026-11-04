"""Pick the @fontsource slices that cover the characters the film uses and write fonts/fonts.css + copy the woff2 files.
Usage: python tools/fonts.py <fontsource node_modules dir>   (run from the project folder)
The characters come from text.txt (every title, placard, label used on screen)."""
import os, re, sys, shutil
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1]
FONTS = [('ma-shan-zheng', '400', 'Ma Shan Zheng'), ('noto-serif-sc', '600', 'Noto Serif SC'), ('noto-serif-sc', '700', 'Noto Serif SC')]
chars = set(open(os.path.join(HERE, 'text.txt'), encoding='utf-8').read())
chars |= set('0123456789:.,?!《》「」·—…（）')
cps = {ord(c) for c in chars if not c.isspace()}
out = []
copied = 0
dst = os.path.join(HERE, 'fonts'); os.makedirs(dst, exist_ok=True)
def ranges(s):
    r = set()
    for part in s.split(','):
        part = part.strip()[2:]
        if '-' in part: a, b = part.split('-'); r.update(range(int(a, 16), int(b, 16) + 1))
        else: r.add(int(part, 16))
    return r
for pkg, wt, fam in FONTS:
    css = open(os.path.join(SRC, pkg, wt + '.css'), encoding='utf-8').read()
    for block in re.findall(r'@font-face\s*\{[^}]*\}', css):
        ur = re.search(r'unicode-range:\s*([^;]+);', block).group(1)
        if not (ranges(ur) & cps): continue
        f = re.search(r'url\(\./files/([^)]+\.woff2)\)', block).group(1)
        shutil.copy(os.path.join(SRC, pkg, 'files', f), os.path.join(dst, f)); copied += 1
        out.append(f"@font-face{{font-family:'{fam}';font-style:normal;font-weight:{wt};font-display:block;src:url({f}) format('woff2');unicode-range:{ur};}}")
# Cormorant Garamond: latin only
for wt in ['600', '700']:
    f = f'cormorant-garamond-latin-{wt}-normal.woff2'
    shutil.copy(os.path.join(SRC, 'cormorant-garamond', 'files', f), os.path.join(dst, f)); copied += 1
    out.append(f"@font-face{{font-family:'Cormorant Garamond';font-style:normal;font-weight:{wt};font-display:block;src:url({f}) format('woff2');}}")
open(os.path.join(dst, 'fonts.css'), 'w', encoding='utf-8').write('\n'.join(out) + '\n')
print(len(cps), 'code points,', copied, 'files copied')
