"""Contact sheets of the test frames in out/p: six frames per sheet, 640 px each, labelled with the time. Usage: python3 tools/sheet6.py [prefix]"""
import subprocess, glob, os, sys
d = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'out', 'p')
pre = sys.argv[1] if len(sys.argv) > 1 else 'a_'
fs = sorted(glob.glob(os.path.join(d, pre + '*.jpg')), key=lambda f: float(os.path.basename(f)[len(pre):-4]))
for k in range(0, len(fs), 6):
    grp = fs[k:k + 6]; n = len(grp)
    args = ['ffmpeg', '-loglevel', 'error', '-y']
    for f in grp: args += ['-i', f]
    fc = ''.join(f"[{i}:v]scale=640:360,drawtext=text='{os.path.basename(grp[i])[len(pre):-4]}':x=8:y=8:fontsize=28:fontcolor=white:box=1:boxcolor=black@0.5[v{i}];" for i in range(n))
    fc += ''.join(f'[v{i}]' for i in range(n)) + f'xstack=inputs={n}:layout=' + '|'.join(f'{(i % 3) * 640}_{(i // 3) * 360}' for i in range(n)) + ('' if n % 3 == 0 or n < 3 else ':fill=black') + '[out]'
    if n == 1: fc = f"[0:v]scale=640:360[out]"
    args += ['-filter_complex', fc, '-map', '[out]', os.path.join(d, f'sheet{k // 6}.jpg')]
    subprocess.run(args, check=True)
print(len(fs), 'frames →', (len(fs) + 5) // 6, 'sheets')
