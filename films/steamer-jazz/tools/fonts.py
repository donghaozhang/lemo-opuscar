"""Collect every character used in the film's .js string literals and build fonts/fonts.css from the fontsource subset files
(ZCOOL QingKe HuangYou = 'Huang', ZCOOL XiaoWei = 'XiaoWei'; both SIL OFL 1.1) that cover them. Copies only those files.
CJK glyph check, part 1: exits 1 and lists any character neither font covers.
Run: ../delivery-hero/tools/.venv/bin/python tools/fonts.py   (needs fonttools + brotli)"""
import os, re, sys, glob, json, shutil
from fontTools.ttLib import TTFont
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(HERE, 'fonts', 'src')
chars = set()
for f in glob.glob(os.path.join(HERE, '*.js')):
    s = open(f, encoding='utf-8').read()
    s = re.sub(r'/\*.*?\*/', '', s, flags=re.S); s = re.sub(r'(^|[^:\'"`])//[^\n]*', r'\1', s)
    for lit in re.findall(r"'([^'\n]*)'|\"([^\"\n]*)\"|`([^`]*)`", s):
        for ch in ''.join(lit):
            if ord(ch) > 0x2000: chars.add(ch)
FAM = {'Huang': 'zcool-qingke-huangyou', 'XiaoWei': 'zcool-xiaowei'}
css, missing = [], {}
os.makedirs(os.path.join(HERE, 'fonts', 'used'), exist_ok=True)
for fam, pkg in FAM.items():
    files = sorted(glob.glob(os.path.join(SRC, pkg, 'package', 'files', '*-400-normal.woff2')))
    need = set(chars); used = []
    for p in files:
        cm = set(TTFont(p).getBestCmap().keys())
        hit = {c for c in need if ord(c) in cm}
        if hit: used.append(os.path.basename(p)); need -= hit
    missing[fam] = ''.join(sorted(need))
    for fn in used:
        shutil.copy(os.path.join(SRC, pkg, 'package', 'files', fn), os.path.join(HERE, 'fonts', 'used', fn))
        css.append(f"@font-face{{font-family:'{fam}';src:url(used/{fn}) format('woff2');font-display:block}}")
    shutil.copy(os.path.join(SRC, pkg, 'package', 'LICENSE'), os.path.join(HERE, 'fonts', f'OFL-{pkg}.txt'))
open(os.path.join(HERE, 'fonts', 'fonts.css'), 'w').write('\n'.join(css) + '\n')
json.dump(sorted(chars), open(os.path.join(HERE, 'fonts', 'chars.json'), 'w'), ensure_ascii=False)
print('chars', len(chars), '· missing', missing)
sys.exit(1 if any(missing.values()) else 0)
