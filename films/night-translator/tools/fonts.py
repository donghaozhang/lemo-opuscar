"""Pick the Noto Serif SC unicode-range chunks (npm @fontsource/noto-serif-sc) that hold every CJK character
used in the film, copy them into fonts/ and write fonts/fonts.css. Run when a card's text changes:
  .venv/bin/python films/night-translator/tools/fonts.py <unpacked @fontsource/noto-serif-sc package dir>"""
import os, re, sys, glob, shutil
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PKG = sys.argv[1]
text = ''.join(open(f, encoding='utf-8').read() for f in glob.glob(os.path.join(HERE, '*.js')))
chars = sorted({c for c in text if ord(c) > 0x2000})
print(len(chars), 'non-Latin characters:', ''.join(chars))
def ranges(s):
    out = []
    for part in s.split(','):
        part = part.strip().replace('U+', '')
        a, _, b = part.partition('-'); out.append((int(a, 16), int(b or a, 16)))
    return out
css = ['/* Noto Serif SC (OFL), only the chunks this film uses; Playfair Display SC and Old Standard TT (OFL) */']
used = set()
for w in (700, 900):
    src = open(os.path.join(PKG, f'{w}.css')).read()
    for m in re.finditer(r"url\(\./files/([^)]+?\.woff2)\).*?unicode-range: ([^;]+);", src, re.S):
        fn, rg = m.group(1), ranges(m.group(2))
        if any(any(a <= ord(c) <= b for a, b in rg) for c in chars):
            shutil.copy(os.path.join(PKG, 'files', fn), os.path.join(HERE, 'fonts', fn)); used.add(fn)
            css.append(f"@font-face {{ font-family: 'Noto Serif SC'; font-weight: {w}; font-display: block; src: url({fn}) format('woff2'); unicode-range: {m.group(2)}; }}")
css += ["@font-face { font-family: 'Playfair Display SC'; font-weight: 700; font-display: block; src: url(playfair-display-sc-latin-700-normal.woff2) format('woff2'); }",
        "@font-face { font-family: 'Playfair Display SC'; font-weight: 900; font-display: block; src: url(playfair-display-sc-latin-900-normal.woff2) format('woff2'); }",
        "@font-face { font-family: 'Old Standard TT'; font-weight: 400; font-display: block; src: url(old-standard-tt-latin-400-normal.woff2) format('woff2'); }",
        "@font-face { font-family: 'Old Standard TT'; font-style: italic; font-weight: 400; font-display: block; src: url(old-standard-tt-latin-400-italic.woff2) format('woff2'); }",
        "@font-face { font-family: 'Old Standard TT'; font-weight: 700; font-display: block; src: url(old-standard-tt-latin-700-normal.woff2) format('woff2'); }"]
open(os.path.join(HERE, 'fonts', 'fonts.css'), 'w').write('\n'.join(css) + '\n')
for f in os.listdir(os.path.join(HERE, 'fonts')):
    if f.startswith('noto-serif-sc-') and f not in used: os.remove(os.path.join(HERE, 'fonts', f))
print(len(used), 'chunks:', sum(os.path.getsize(os.path.join(HERE, 'fonts', f)) for f in used) // 1024, 'KB')
