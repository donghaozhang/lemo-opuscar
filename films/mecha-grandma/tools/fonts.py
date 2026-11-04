"""Pick the @fontsource unicode-range chunks that hold every CJK character used in the film's .js files, copy them into
fonts/ and write fonts/cjk.css. Run after any text change:
  .venv/bin/python films/mecha-grandma/tools/fonts.py <noto-sans-sc package> <zcool-qingke-huangyou package>"""
import os, re, sys, glob, shutil
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SANS, ZC = sys.argv[1], sys.argv[2]
text = ''.join(open(f, encoding='utf-8').read() for f in glob.glob(os.path.join(HERE, '*.js')))
chars = sorted({c for c in text if ord(c) > 0x2000})
print(len(chars), 'non-Latin characters')
def ranges(s): return [tuple(int(x, 16) for x in (p.strip().replace('U+', '').split('-') * 2)[:2]) for p in s.split(',')]
css, used = ['/* Noto Sans SC and ZCOOL QingKe HuangYou (OFL): only the unicode-range chunks this film uses */'], set()
for fam, pkg, w in (('Noto Sans SC', SANS, 500), ('Noto Sans SC', SANS, 700), ('Noto Sans SC', SANS, 900), ('ZCOOL QingKe HuangYou', ZC, 400)):
    src = open(os.path.join(pkg, f'{w}.css')).read()
    for m in re.finditer(r"url\(\./files/([^)]+?\.woff2)\).*?unicode-range: ([^;]+);", src, re.S):
        fn, rg = m.group(1), ranges(m.group(2))
        if any(any(a <= ord(c) <= b for a, b in rg) for c in chars):
            shutil.copy(os.path.join(pkg, 'files', fn), os.path.join(HERE, 'fonts', fn)); used.add(fn)
            css.append(f"@font-face {{ font-family: '{fam}'; font-weight: {w}; font-display: block; src: url({fn}) format('woff2'); unicode-range: {m.group(2)}; }}")
open(os.path.join(HERE, 'fonts', 'cjk.css'), 'w').write('\n'.join(css) + '\n')
for f in os.listdir(os.path.join(HERE, 'fonts')):
    if (f.startswith('noto-sans-sc-') or f.startswith('zcool-')) and f not in used: os.remove(os.path.join(HERE, 'fonts', f))
print(len(used), 'chunks,', sum(os.path.getsize(os.path.join(HERE, 'fonts', f)) for f in used) // 1024, 'KB')
