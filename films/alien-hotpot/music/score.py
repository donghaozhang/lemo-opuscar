"""Original score for 外星人来吃火锅 → music/score.wav (48 kHz stereo) + music/stems/*.wav
Theremin lead, analog bass, square arpeggio, drum machine; one genre cue per scene (rain noir, panic tremolo, main theme,
elevator bossa, build, kazoo sting, brushed swing with vibes, rising fuel arp, solo theremin, launch, toy-piano morning, fleet swell, tag).
All section times come from events.json (exported from timeline.js), so every cue's first beat is its cut.
Usage: python music/score.py"""
import json, os, sys, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE); sys.path.insert(0, HERE)
from instr import *
E = json.load(open(os.path.join(ROOT, 'events.json'))); DUR = E['dur']; N = int(DUR * SR)
SEC = {e['name']: e for e in E['ev'] if e['type'] == 'cue'}
HIT = {e['name']: e['t'] for e in E['ev'] if e['type'] == 'hit'}

class Bus:
    def __init__(s): s.b = np.zeros((N, 2))
    def add(s, x, at, g=1., pan=0.):
        st = int(round(at * SR))
        if x.ndim == 1: l, r = np.cos((pan + 1) * np.pi / 4) * 1.414, np.sin((pan + 1) * np.pi / 4) * 1.414; x = np.stack([x * l, x * r], 1)
        if st < 0: x = x[-st:]; st = 0
        e = min(N, st + len(x))
        if e > st: s.b[st:e] += x[:e - st] * g
BUS = {k: Bus() for k in ['drums', 'bass', 'lead', 'harm', 'fx']}
D, B, L, Hm, F = BUS['drums'], BUS['bass'], BUS['lead'], BUS['harm'], BUS['fx']
def T(sec, beat): s = SEC[sec]; return s['t'] + beat * 60 / s['bpm']
def bt(sec): return 60 / SEC[sec]['bpm']

# —— the main theme (A minor pentatonic with a chromatic F), beats ——
THEME = [('A4', 1), ('C5', .5), ('D5', .5), ('E5', 1.5), ('D5', .5),
         ('C5', .5), ('A4', .5), ('G4', 1), ('F4', .5), ('E4', 1.5),
         ('A4', 1), ('C5', .5), ('D5', .5), ('E5', 1), ('G5', 1),
         ('F5', .5), ('E5', .5), ('D5', .5), ('C5', .5), ('A4', 2)]
CHORDS_MIN = [('A', ['A2', 'C3', 'E3']), ('F', ['F2', 'A2', 'C3']), ('A', ['A2', 'C3', 'E3']), ('D', ['D3', 'F3', 'A3'])]
def melody(sec, b0, notes, beat, tr=0, gain=.5, maxb=None, glide=.07, vib=.32):
    t = T(sec, b0) if isinstance(sec, str) else sec; ev = []; acc = 0
    for n, d in notes:
        if maxb is not None and acc >= maxb: break
        ev.append((t + acc * beat, d * beat * .95, M(n) + tr)); acc += d
    t0, x = theremin(ev, glide=glide, vib=vib); L.add(x, t0, gain)
def band(sec, b0, bars, chords=CHORDS_MIN, drums=True, arp=True, gain=1., tr=0, bass_oct=0):
    bb = bt(sec)
    for bar in range(bars):
        root, ch = chords[bar % len(chords)]; tb = T(sec, b0 + bar * 4)
        rm = M(root + '2') + tr + 12 * bass_oct
        for k in range(8):   # eighth-note bass with octave jumps
            m = rm + (12 if k % 4 == 3 else 0); B.add(bass(0, bb * .45, m, .8, 1100), tb + k * bb / 2, .55 * gain)
        if arp:
            seq = [M(c) + 12 + tr for c in ch]; seq = seq + [seq[0] + 12]
            for k in range(16): Hm.add(pluck(0, bb / 4 * .8, seq[k % len(seq)] + (12 if k >= 8 else 0), .5, w=.25, cut=2800), tb + k * bb / 4, .16 * gain, pan=.3 * np.sin(k))
        if drums:
            for k in range(4):
                if k % 2 == 0: D.add(kick(1), tb + k * bb, .55 * gain)
                else: D.add(snare(1), tb + k * bb, .32 * gain)
            for k in range(8): D.add(hat(1), tb + k * bb / 2, (.12 if k % 2 else .18) * gain, pan=.2)

# ———————————— rain: lonely, slow (80 bpm) ————————————
b = bt('rain')
Hm.add(pad(19.5, [M('A2'), M('E3'), M('C4')], 1, 900, 2.5), 0, .16)
for k in range(0, 26):
    D.add(rim(.5), T('rain', k), .06 if k % 2 else .09, pan=-.2)
    if k % 4 == 0: B.add(bass(0, b * 3.6, M('A1') + [0, 0, -4, -2, 0, 0, -4][k // 4 % 7], .6, 500), T('rain', k), .45)
melody('rain', 2, [('E4', 2), ('A4', 2), ('C5', 1), ('B4', 1), ('A4', 3), ('G4', 1), ('E4', 3)], b, gain=.32, glide=.12, vib=.4)
for i, n in enumerate(['A5', 'C6', 'E6']): Hm.add(vibes(1, M(n)), HIT[f'clink{i + 1}'], .2)
t0, x = theremin([(16.1, .3, M('E5')), (16.4, .9, M('A3'))], glide=.35, vib=.2); L.add(x, t0, .25)   # the coin rolls away
# ———————————— fall: panic (160 bpm) ————————————
b = bt('fall')
Hm.add(strings_trem(3.0, [M('A3'), M('C4'), M('Eb4')], 1, rise=5), T('fall', 0), .35)
for k in range(16): D.add(snare(.4 + .6 * k / 16), T('fall', k / 2), .2 + .2 * k / 16)
t0, x = theremin([(T('fall', 0), .1, M('A4')), (T('fall', .2), 2.8, M('A6'))], glide=1.2, vib=.6, rate=7); L.add(x, t0, .3)
F.add(noise_riser(3.0, 1), T('fall', 0), .25)
# ———————————— title + theme (120 bpm) ————————————
b = bt('title')
for k in range(4):
    Hm.add(brass(.3, [M('A3') + [0, 3, 5, 7][k], M('E4') + [0, 3, 5, 7][k]], 1), T('title', k), .5); D.add(kick(1), T('title', k), .7); D.add(tom(45 + k * 3, 1), T('title', k), .4)
D.add(crash(1), T('title', 0), .45)
band('title', 4, 4, gain=1.0)
melody('title', 4, THEME, b, gain=.42)
band('title', 20, 1, drums=False, gain=.7)   # under the cell insert
Hm.add(pad(4, [M('A3'), M('E4')], 1, 1400, .5), T('title', 16), .12)
t0, x = theremin([(HIT['wisp'] - .1, .2, M('E5')), (HIT['wisp'] + .1, .5, M('B5'))], glide=.08, vib=.8, rate=9); L.add(x, t0, .3)   # the cell flickers
# ———————————— order: elevator bossa (100 bpm) ————————————
b = bt('order')
BOSSA = [('A', ['A2', 'G3', 'C4', 'E4']), ('D', ['D3', 'F#3', 'C4', 'E4']), ('G', ['G2', 'F#3', 'B3', 'D4']), ('C', ['C3', 'E3', 'B3', 'E4']),
         ('F', ['F2', 'E3', 'A3', 'C4']), ('E', ['E2', 'G#3', 'D4', 'E4'])]
for bar in range(6):
    root, ch = BOSSA[bar]; tb = T('order', bar * 4)
    for k, off in enumerate([0, 1.5, 2, 3.5]): B.add(bass(0, b * .9, M(root + ('1' if root in 'EF' else '2')) + (7 if k % 2 else 0), .6, 700), tb + off * b, .42)
    for off in [0, .75, 1.5, 2.5, 3.25]:
        for j, n in enumerate(ch[1:]): Hm.add(ks(M(n), 1.0, .6, .35), tb + off * b + j * .012, .12, pan=-.2)
    for k in range(8): D.add(shaker(1), tb + k * b / 2, .1, pan=.3)
    for off in [0, 1.5, 3, 2.5 + 4 * 0]: D.add(rim(.8), tb + off * b, .1, pan=-.3)
    Hm.add(rhodes(b * 3.5, M(ch[2]) + 12, .6), tb, .08)
t0, x = theremin([(HIT['screenSwap'], .12, M('E6')), (HIT['screenSwap'] + .12, .12, M('Bb5')), (HIT['screenSwap'] + .24, .3, M('E5'))], glide=.02, vib=.0); F.add(x * .6, t0, .5)   # glitch blip
# ———————————— pot: the build (120 bpm) ————————————
b = bt('pot')
for k in range(48):
    t = T('pot', k / 4); m = M('A1') + [0, 0, 12, 0, 3, 0, 12, 5][k % 8]; B.add(bass(0, b / 4 * .8, m, .7, 900 + 60 * k), t, .45)
for k in range(12):
    D.add(kick(1), T('pot', k), .5)
    if k % 2: D.add(clap(1), T('pot', k), .25)
for k in range(16): D.add(tom(40 + k, 1), T('pot', 8 + k / 4), .2 + k * .02)
Hm.add(strings_trem(6.0, [M('A3'), M('E4')], 1, rise=2), T('pot', 0), .18)
# (hard cut at the bite: no tails)
# ———————————— sting: 再来一盘 ————————————
b = bt('sting')
for i, (n, d) in enumerate([('C5', .5), ('E5', .5), ('G5', .5), ('C6', 1.5)]):
    Hm.add(pluck(0, d * b, M(n), 1, w=.12, cut=4500), T('sting', [0, .5, 1, 1.5][i]), .3); Hm.add(pluck(0, d * b, M(n) - 12, 1, w=.5, cut=3000), T('sting', [0, .5, 1, 1.5][i]), .2)
t0, x = theremin([(T('sting', 0), .05, M('C5')), (T('sting', .1), .6, M('C6'))], glide=.25, vib=.1); F.add(x, t0, .3)   # slide whistle
D.add(crash(.6, 1.2), T('sting', 1.5), .25); D.add(kick(1), T('sting', 1.5), .5)
# ———————————— tripe: brushed swing with vibes (120 bpm) ————————————
b = bt('tripe')
SW = [('A', ['A3', 'C4', 'E4', 'G4']), ('D', ['D3', 'F3', 'A3', 'C4']), ('G', ['G3', 'B3', 'D4', 'F4']), ('C', ['C3', 'E3', 'G3', 'B3']),
      ('F', ['F3', 'A3', 'C4', 'E4']), ('E', ['E3', 'G#3', 'B3', 'D4']), ('A', ['A3', 'C4', 'E4', 'G4']), ('E', ['E3', 'G#3', 'B3', 'D4'])]
sw = lambda k: (k + (.17 if k % 1 == .5 else 0))
for bar in range(10):
    root, ch = SW[bar % 8]; tb = T('tripe', bar * 4); thin = bar >= 8
    walk = [M(root + '2'), M(root + '2') + 4, M(root + '2') + 7, M(root + '2') + 9]
    for k in range(4): B.add(bass(0, b * .85, walk[k], .7, 800), tb + k * b, .45)
    for k in range(4): D.add(brush(1, .2), tb + k * b, .14 if k % 2 else .08, pan=.2)
    if not thin:
        for k in range(8): D.add(ride(.5), tb + sw(k / 2) * b, .05, pan=-.3)
    for off in ([0, 2.5] if not thin else [0]):
        for n in ch: Hm.add(vibes(1, M(n) + 12), tb + off * b, .05)
for i, t in enumerate([HIT['dip1'] + .5 * j for j in range(8)]): Hm.add(xylo(M(['A5', 'C6', 'D6', 'E6', 'G6', 'A6', 'C7', 'A5'][i])), t, .15)
for j in range(7): Hm.add(xylo(M(['E6', 'D6', 'C6', 'A5', 'C6', 'D6', 'E6'][j])), 81.4 + .5 * j, .13)
t0, x = theremin([(70.35, .1, M('C6')), (70.45, .5, M('C4'))], glide=.12, vib=0); F.add(x, t0, .25)   # the pebble deflates
Hm.add(rhodes(1.5, M('C5'), .8), 87.5, .15); Hm.add(rhodes(1.5, M('E5'), .8), 87.5, .12); Hm.add(rhodes(1.5, M('A4'), .8), 87.5, .12)   # the smile
# ———————————— fuel: the arp rises, then A major (120 bpm) ————————————
b = bt('fuel')
for bar in range(8):
    tb = T('fuel', bar * 4); lift = bar / 7; maj = bar >= 6
    ch = (['A3', 'C#4', 'E4'] if maj else [['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'], ['D3', 'F3', 'A3'], ['E3', 'G#3', 'B3']][bar % 4])
    seq = [M(c) + 12 for c in ch] + [M(ch[0]) + 24]
    for k in range(16): Hm.add(pluck(0, b / 4 * .8, seq[k % 4] + (12 if k % 8 >= 4 else 0), .6, w=.2, cut=1200 + 3200 * lift), tb + k * b / 4, .12 + .08 * lift)
    root = ch[0][:-1]; rm = M(root + '2')
    for k in range(8): B.add(bass(0, b * .45, rm + (12 if k % 4 == 3 else 0), .7, 600 + 800 * lift), tb + k * b / 2, .45)
    if bar >= 2:
        for k in range(4): D.add(kick(1), tb + k * b, .25 + .2 * lift)
    if bar >= 4:
        for k in range(8): D.add(hat(1), tb + k * b / 2, .1 + .08 * lift)
        D.add(snare(1), tb + b, .2); D.add(snare(1), tb + 3 * b, .2)
F.add(noise_riser(2.0, 1), HIT['full'] - 2.0, .25)
D.add(crash(1), HIT['full'], .5); Hm.add(brass(1.6, [M('A3'), M('C#4'), M('E4'), M('A4')], 1), HIT['full'], .45)
MAJ = [(n.replace('C5', 'C#5').replace('C6', 'C#6').replace('F4', 'F#4').replace('F5', 'F#5').replace('G4', 'G#4').replace('G5', 'G#5'), d) for n, d in THEME]
melody(HIT['full'], 0, MAJ[:10], b, gain=.38)
# ———————————— climax: the music drops, theremin alone (60 bpm) ————————————
b = bt('climax')
melody('climax', 0, [('A4', 1.5), ('C5', .5), ('E5', 1.5), ('D5', .5), ('C#5', 2)], b, gain=.34, glide=.15, vib=.45)
Hm.add(pad(2.2, [M('A3'), M('C#4'), M('E4')], 1, 1100, 1.2), T('climax', 4), .1)
# ———————————— launch: the full theme, A minor → major (120 bpm) ————————————
b = bt('launch')
band('launch', 0, 2, gain=1.1)
melody('launch', 0, THEME[:10], b, gain=.42)
D.add(crash(1, 2.5), HIT['launch'], .55); F.add(noise_riser(1.5, 1), HIT['launch'] - 1.5, .3)
band('launch', 8, 2, chords=[('A', ['A2', 'C#3', 'E3']), ('E', ['E2', 'G#2', 'B2'])], gain=1.1, bass_oct=1)
melody('launch', 10, [('A4', 1), ('C#5', .5), ('D5', .5), ('E5', 1), ('A5', 2.8)], b, gain=.42)
# ———————————— morning: toy piano + square arp, C major (120 bpm) ————————————
b = bt('morning')
MOR = [('C', ['C3', 'E3', 'G3']), ('A', ['A2', 'C3', 'E3']), ('F', ['F2', 'A2', 'C3']), ('G', ['G2', 'B2', 'D3'])]
for bar in range(5):
    root, ch = MOR[bar % 4]; tb = T('morning', bar * 4 + 2)
    for k in range(4): B.add(bass(0, b * .4, M(root + '2'), .6, 900), tb + k * b, .35)
    for k in range(8): Hm.add(pluck(0, b / 2 * .7, M(ch[k % 3]) + 24, .5, w=.4, cut=3500), tb + k * b / 2, .1, pan=-.3)
    for k in range(4): D.add(kick(.7), tb + k * b, .25 if k % 2 == 0 else 0); D.add(hat(1), tb + k * b + b / 2, .1)
for k in range(2):   # first bar: the light comes up
    Hm.add(xylo(M(['C6', 'G6'][k])), T('morning', k), .2)
TOY = [('E5', .5), ('G5', .5), ('A5', 1), ('G5', .5), ('E5', .5), ('D5', 1), ('C5', .5), ('D5', .5), ('E5', 1), ('G5', 1), ('A5', 2)]
acc = 0
for n, d in TOY + TOY:
    tt_ = T('morning', 2 + acc)
    if not (HIT['tear'] - .05 < tt_ < HIT['tear'] + .5): Hm.add(xylo(M(n)), tt_, .22)
    acc += d
    if acc > 19: break
D.add(snare(1), HIT['tear'], .4); D.add(crash(.6, 1.0), HIT['tear'] + .35, .2)
# ———————————— fleet: swell (120 bpm) ————————————
b = bt('fleet')
Hm.add(strings_trem(6.5, [M('A2'), M('E3'), M('A3'), M('C4')], 1, rise=0), T('fleet', 0), .3)
for k in [0, 2, 4, 6, 8, 9, 10, 11]: Hm.add(brass(.25, [M('A3'), M('E4')], 1), T('fleet', k), .25); D.add(tom(38, 1), T('fleet', k), .3)
melody('fleet', 0, [('E4', 2), ('F4', 2), ('E4', 2), ('A4', 4), ('G#4', 3)], b, gain=.3, vib=.6)
# ———————————— end: the tag ————————————
b = bt('end')
melody('end', 0, [('A4', .5), ('C5', .5), ('D5', .5), ('E5', 1), ('D5', .5), ('C5', .5), ('A4', 3)], b, gain=.42)
D.add(crash(1, 3), T('end', 3.5), .4); B.add(bass(0, 2.5, M('A2'), .8, 700), T('end', 3.5), .6); Hm.add(pad(3, [M('A3'), M('C4'), M('E4')], 1, 1500, .05), T('end', 3.5), .15)

# ———————————— reverb, hard cuts, level ————————————
def ir(d=2.0, decay=.45, lpf=5000, pre=.015):
    n = int(d * SR); tn = np.arange(n) / SR
    x = np.stack([lp(rng.standard_normal(n), lpf) * np.exp(-tn / decay), lp(rng.standard_normal(n), lpf) * np.exp(-tn / decay)], 1)
    x[:int(pre * SR)] = 0; return x / np.sqrt((x ** 2).sum(0))
def spring_ir(d=1.2):
    n = int(d * SR); tn = np.arange(n) / SR; ch = np.sin(2 * np.pi * (1800 * tn - 700 * tn ** 2)) * np.exp(-tn / .05) * .3
    x = np.stack([rng.standard_normal(n), rng.standard_normal(n)], 1) * np.exp(-tn / .35)[:, None]; x[:, 0] += ch; x[:, 1] += np.roll(ch, 300)
    x = np.stack([bp(x[:, 0], 300, 4500), bp(x[:, 1], 300, 4500)], 1); x[:int(.02 * SR)] = 0; return x / np.sqrt((x ** 2).sum(0))
def conv(x, h): return np.stack([fftconvolve(x[:, c], h[:, c])[:N] for c in range(2)], 1)
room, spr = ir(), spring_ir()
send = {'drums': .08, 'harm': .22, 'fx': .2}
dry = sum(bb.b for bb in BUS.values())
out = dry + conv(sum(BUS[k].b * send[k] for k in send), room) * .9 + conv(BUS['lead'].b * .3, spr) * 1.1
# silences are real silences: cut everything, reverb tails included
SIL = [('impact', 0), ('door', 0), ('bite', 0), ('button', 0)]
for name, _ in SIL:
    a, b_ = int(SEC[name]['t'] * SR), int(SEC[name]['end'] * SR); out[a:b_] = 0
    f = int(.006 * SR); out[a - f:a] *= np.linspace(1, 0, f)[:, None]
out = np.stack([hp(out[:, c], 35) for c in range(2)], 1)
pk = np.abs(out).max(); out = out / pk * .89
os.makedirs(os.path.join(HERE, 'stems'), exist_ok=True)
for k, bb in BUS.items(): sf.write(os.path.join(HERE, 'stems', k + '.wav'), (bb.b / pk * .89).astype(np.float32), SR)
sf.write(os.path.join(HERE, 'score.wav'), out.astype(np.float32), SR)
X = np.abs(np.fft.rfft(out.mean(1))) ** 2; fr = np.fft.rfftfreq(N, 1 / SR); tot = X.sum()
for a, b_ in [(20, 120), (120, 500), (500, 2000), (2000, 8000), (8000, 20000)]: print(f'{a:>5}-{b_:<5} Hz  {10 * np.log10(X[(fr >= a) & (fr < b_)].sum() / tot):6.1f} dB')
print('score.wav', DUR, 's  peak norm', round(pk, 3))
