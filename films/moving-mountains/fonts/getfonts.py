# Copy only the Noto Serif SC (OFL, @fontsource/noto-serif-sc) unicode-range subsets that hold the film's characters,
# and write fonts.css with the same @font-face rules. Usage: python fonts/getfonts.py <fontsource package dir>
import json, re, sys, os, shutil
HERE = os.path.dirname(os.path.abspath(__file__)); PKG = sys.argv[1]
T = json.load(open(os.path.join(HERE, '..', 'timeline.json')))
text = ''.join(c[3] for c in T['caps']) + '愚公移山列子汤问完·' + ''.join(T.get('extra_text', []))
chars = sorted(set(ch for ch in text if ord(ch) > 127))
css_out = []
for wt in (600, 900):
    css = open(os.path.join(PKG, f'{wt}.css')).read()
    for block in re.findall(r'@font-face\s*{[^}]*}', css):
        url = re.search(r'url\(\./files/([^)]+\.woff2)\)', block).group(1)
        ur = re.search(r'unicode-range:\s*([^;]+);', block).group(1)
        rngs = []
        for r in ur.split(','):
            r = r.strip()[2:]
            a, b = (r.split('-') + [None])[:2]
            rngs.append((int(a, 16), int(b or a, 16)))
        hit = [c for c in chars if any(a <= ord(c) <= b for a, b in rngs)]
        if not hit: continue
        shutil.copy(os.path.join(PKG, 'files', url), os.path.join(HERE, url))
        css_out.append(f"@font-face{{font-family:'Noto Serif SC';font-style:normal;font-weight:{wt};font-display:block;src:url(./{url}) format('woff2');unicode-range:{ur};}}")
open(os.path.join(HERE, 'fonts.css'), 'w').write('\n'.join(css_out) + '\n')
print(len(chars), 'chars;', len(css_out), 'subset files')
