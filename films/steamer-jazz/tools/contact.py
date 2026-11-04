"""Contact sheets at 1 fps from a rendered film: python tools/contact.py <film.mp4> <out-prefix>  (two JPEGs, 72 frames each)"""
import sys, os, glob, subprocess, tempfile
from PIL import Image, ImageDraw
src, pre = sys.argv[1], sys.argv[2]
d = tempfile.mkdtemp()
subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-i', src, '-vf', 'fps=1,crop=1440:1080:240:0,scale=256:192', f'{d}/f_%03d.jpg'], check=True)
fs = sorted(glob.glob(f'{d}/f_*.jpg'))
for part, chunk in enumerate([fs[:72], fs[72:]]):
    cols = 12; rows = (len(chunk) + cols - 1) // cols; W, H = 160, 120
    im = Image.new('RGB', (cols * W, rows * (H + 12)), (20, 20, 24)); dr = ImageDraw.Draw(im)
    for i, f in enumerate(chunk):
        x, y = (i % cols) * W, (i // cols) * (H + 12); im.paste(Image.open(f).resize((W, H)), (x, y + 12)); dr.text((x + 2, y), f'{part * 72 + i}s', fill=(220, 220, 220))
    im.save(f'{pre}-{"ab"[part]}.jpg', quality=85)
