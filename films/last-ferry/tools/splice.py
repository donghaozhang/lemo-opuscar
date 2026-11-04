"""Splice re-rendered ranges into a full render (frame-exact, by frame count at the given fps):
   python tools/splice.py base.mp4 out.mp4 a1 b1 seg1.mp4 [a2 b2 seg2.mp4 ...] [--fps 24]
Each seg covers frames [round(a*fps), round(b*fps)) and replaces that range of base. Output re-encoded with x264 crf 14 (same as the renders)."""
import sys, subprocess, os
args = sys.argv[1:]; fps = 24
if '--fps' in args: i = args.index('--fps'); fps = int(args[i + 1]); del args[i:i + 2]
base, out, rest = args[0], args[1], args[2:]
ranges = [(int(round(float(rest[i]) * fps)), int(round(float(rest[i + 1]) * fps)), rest[i + 2]) for i in range(0, len(rest), 3)]
ranges.sort()
inputs = ['-i', base]; parts = []; cur = 0; k = 0
for (f0, f1, seg) in ranges:
    assert f0 >= cur, 'overlapping ranges'
    if f0 > cur: parts.append(f'[0:v]trim=start_frame={cur}:end_frame={f0},setpts=PTS-STARTPTS[p{k}]'); k += 1
    inputs += ['-i', seg]; n = len(inputs) // 2 - 1
    parts.append(f'[{n}:v]trim=start_frame=0:end_frame={f1 - f0},setpts=PTS-STARTPTS[p{k}]'); k += 1
    cur = f1
parts.append(f'[0:v]trim=start_frame={cur},setpts=PTS-STARTPTS[p{k}]'); k += 1
fc = ';'.join(parts) + ';' + ''.join(f'[p{i}]' for i in range(k)) + f'concat=n={k}:v=1:a=0[v]'
cmd = ['ffmpeg', '-y', '-loglevel', 'error'] + inputs + ['-filter_complex', fc, '-map', '[v]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', '-r', str(fps), out]
subprocess.run(cmd, check=True)
n = subprocess.run(['ffprobe', '-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', out], capture_output=True, text=True).stdout.strip()
print(out, 'frames', n, 'ranges', len(ranges))
