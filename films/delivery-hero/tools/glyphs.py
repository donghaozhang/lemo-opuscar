"""Build a 1-bit glyph atlas from Fusion Pixel Font (OFL) for every character used in the film.
tools/.venv/bin/python tools/glyphs.py   → glyphs.json  {size: {lineH, ascent, g: {char: [adv, w, rows-as-hex]}}}
Characters = printable ASCII + every non-ASCII character found in the project's .js files.
Exits 1 (and lists them) if any character is missing from the font: the CJK glyph check, part 1."""
import io, os, re, sys, json, glob
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
chars = set(chr(c) for c in range(0x20, 0x7f))
for f in glob.glob(os.path.join(HERE, '*.js')):
    src = open(f, encoding='utf-8').read()
    src = re.sub(r'/\*.*?\*/', '', src, flags=re.S)
    src = re.sub(r'(^|[^:\'"`])//[^\n]*', r'\1', src)          # line comments (not inside URLs)
    for lit in re.findall(r"'([^'\n]*)'|\"([^\"\n]*)\"|`([^`]*)`", src):
        for ch in ''.join(lit):
            if ord(ch) > 0x7f: chars.add(ch)
chars = sorted(chars)

def load(size):
    fonts = []
    for p in sorted(glob.glob(os.path.join(HERE, 'fonts', f'fusion{size}', '*.woff2'))):
        tt = TTFont(p); cmap = tt.getBestCmap() or {}
        tt.flavor = None; b = io.BytesIO(); tt.save(b); b.seek(0)
        fonts.append((set(cmap.keys()), ImageFont.truetype(b, size)))
    return fonts

out, missing = {}, set()
for size in (12, 8):
    fonts = load(size)
    asc, desc = fonts[0][1].getmetrics()
    G = {}
    for ch in chars:
        if ch == ' ':
            G[ch] = [size // 3 if size == 12 else 3, 0, []]; continue
        fnt = next((f for cps, f in fonts if ord(ch) in cps), None)
        if fnt is None: missing.add(ch); continue
        adv = int(round(fnt.getlength(ch)))
        W, H = adv + 4, asc + desc
        im = Image.new('1', (W, H), 0); d = ImageDraw.Draw(im); d.fontmode = '1'
        d.text((0, 0), ch, font=fnt, fill=1)
        px = im.load(); rows = []
        for y in range(H):
            v = 0
            for x in range(W):
                if px[x, y]: v |= 1 << x
            rows.append(v)
        w = max((v.bit_length() for v in rows), default=0)
        G[ch] = [adv, w, rows]
    out[size] = {'lineH': asc + desc, 'ascent': asc, 'g': G}
json.dump(out, open(os.path.join(HERE, 'glyphs.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
print('glyphs', len(chars), 'chars; missing:', ''.join(sorted(missing)) or 'none')
sys.exit(1 if missing else 0)
