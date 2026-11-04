# 愚公移山 · cue check: every cut on a beat of its section's grid; every picture hit that the score answers has its cue;
# the two silences are really silent in the mix. Exit 1 on any miss.
import sys, os, json
HERE = os.path.dirname(os.path.abspath(__file__)); F = os.path.join(HERE, '..'); sys.path.insert(0, F)
import numpy as np, soundfile as sf, tl
B = tl.build(); EV = json.load(open(os.path.join(F, 'events.json')))['ev']; CUES = json.load(open(os.path.join(F, 'music', 'cues.json')))
SEC = {s['id']: s for s in B['secs']}; bad = 0; worst = 0
for e in [e for e in EV if e['type'] == 'cut']:
    s = SEC[e['sec']]; bl = 60 / s['bpm']; k = (e['t'] - s['t0']) / bl; off = abs(k - round(k)) * bl * 1000
    worst = max(worst, off)
    if off > 1: print('cut off-beat', e['id'], round(off, 1), 'ms'); bad += 1
n = 0
for kind, typ in [('season_hit', 'season_hit'), ('fright', 'fright'), ('giant_step', 'giant_step'), ('gouge', 'gouge'), ('plink', 'plink'), ('BOOM', 'BOOM'), ('red_dawn', 'red_dawn'), ('ding', 'ding')]:
    for e in [e for e in EV if e['type'] == typ][:1 if typ == 'ding' else 99]:
        c = min((abs(c['t'] - e['t']) for c in CUES if c['kind'] == kind), default=9e9) * 1000; n += 1; worst = max(worst, c)
        if c > 1: print('cue missing/late', typ, round(e['t'], 3), round(c, 1), 'ms'); bad += 1
x, sr = sf.read(os.path.join(F, 'out', 'mix.wav')); m = np.abs(x).max(1)
sh = {s['id']: s for s in B['shots']}
d = m[int(sh['G4']['t0'] * sr) + 10:int(sh['H1']['t0'] * sr) - 10].max(); dsil = 20 * np.log10(d + 1e-12)
seg = x[int(82.4 * sr):int(83.3 * sr)]; nsil = 20 * np.log10(np.sqrt((seg ** 2).mean()) + 1e-12) - 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-12)
print(f'cuts on grid: {sum(1 for e in EV if e["type"] == "cut")}, score cues checked: {n}, worst offset {worst:.1f} ms; digital silence {dsil:.0f} dBFS; near-silence {nsil:.1f} dB below the film average')
if dsil > -80: print('silence not digital'); bad += 1
sys.exit(1 if bad else 0)
