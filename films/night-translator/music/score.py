"""《深夜翻译官》 — original photoplay score for a cinema upright piano, written to the cue sheet in ../timeline.json.
Cue sheet: Introduction (the theme in octaves; the blind snaps up on a glissando) → Misterioso (A minor, chromatic creep
for the rolling) → cadence → Allegretto stride (the work theme, C major) → stop-time for the recoil and the bonk →
the insert (a minor second for the wrong line, a run for the right one) → Hurry galop (A minor) → jam trill → SILENCE →
Agitato cluster + diminished tremolo → Agitato hurry → the trip → SILENCE → rolled chord → Tenderly (theme in F, waltz)
→ Maestoso (theme full, one rising note per lamp) → Tenderly card → final chord.
The pianist mickey-mouses the action; the effects drummer's trap box is in ../mix.py.
Run: .venv/bin/python films/night-translator/music/score.py   → music/score.wav, music/score.json (sync keys)"""
import sys, os, json
import numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(HERE)
ROOT = os.environ.get('LIB') or os.path.abspath(os.path.join(PROJ, '../..'))
sys.path.insert(0, ROOT)
from core.audio import sampler as S
from core.audio.sfx import SR

S.seed(1926)
TL = json.load(open(os.path.join(PROJ, 'timeline.json')))
SEC, HIT, DUR, LAMPS = TL['SEC'], TL['HIT'], TL['DUR'], TL['LAMPS']
def at(name, b=0.0): return SEC[name]['t0'] + b * SEC[name]['beat']
def bt(name): return SEC[name]['beat']

EV, KEYS = [], {}
P = 'upright'
def n(t, p, d, v=.6, pan=0.):
    if t < DUR: EV.append((t, P, p, d, v, pan))
def chord(t, ps, d, v=.6, pan=0., roll=0.):
    for i, p in enumerate(ps): n(t + i * roll, p, d, v * (1 - .03 * i), pan)
def key(name, t): KEYS[name] = round(t, 4)
NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
def m2n(m): return NAMES[m % 12] + str(m // 12 - 1)
def mi(p): return int(round(S.midi(p)))
def tr(p, k): return m2n(mi(p) + k)
WHITE = [0, 2, 4, 5, 7, 9, 11]
def gliss(t, p0, p1, d, v0=.5, v1=.75, white=True):
    a, b = mi(p0), mi(p1); s = 1 if b > a else -1
    ns = [m for m in range(a, b + s, s) if (not white or m % 12 in WHITE)]
    for i, m in enumerate(ns): u = i / max(1, len(ns) - 1); n(t + u * d, m2n(m), .22, v0 + (v1 - v0) * u, (u - .5) * .4)
def trem(t, ps, d, rate=14, v=.45, cres=0.):
    k, tt = 0, t
    while tt < t + d - 1e-6:
        u = (tt - t) / d
        for p in ps[k % 2]: n(tt, p, 1.2 / rate, v + cres * u)
        tt += 1 / rate; k += 1
def trill(t, a, b, d, rate=16, v=.4):
    k, tt = 0, t
    while tt < t + d - 1e-6: n(tt, a if k % 2 == 0 else b, 1.1 / rate, v, .2); tt += 1 / rate; k += 1
def cluster(t, lo, hi, d, v=.8):
    for m in range(mi(lo), mi(hi) + 1): n(t, m2n(m), d, v, -.1)
def stride(sec, b0, b1, bass, chords, v=.5):
    """stride left hand: bass on the beat, chord on the off-beat; bass/chords given per beat"""
    B, b = bt(sec), b0
    while b < b1 - 1e-6:
        i = int(round(b - b0)); bn, ch = bass[i % len(bass)], chords[i % len(chords)]
        n(at(sec, b), bn, B * .45, v, -.25); chord(at(sec, b + .5), ch, B * .35, v * .7, -.1)
        b += 1
def melody(sec, b0, notes, v=.62, octave=0, dbl=False, pan=.15, sustain=.92):
    """notes = [(beat, pitch, beats)]; dbl adds the octave below (photoplay octaves)"""
    for b, p, d in notes:
        if b0 + b >= SEC[sec]['beats'] + 1e-6: continue
        pp = tr(p, 12 * octave); t = at(sec, b0 + b); dd = d * bt(sec) * sustain
        n(t, pp, dd, v, pan)
        if dbl: n(t, tr(pp, -12), dd, v * .8, pan - .1)

# the theme (two 8-beat phrases), in C
THEME_A = [(0, 'G4', .5), (.5, 'C5', .5), (1, 'E5', 1), (2, 'D5', .5), (2.5, 'C5', .5), (3, 'A4', 1), (4, 'G4', .5), (4.5, 'A4', .5), (5, 'C5', .5), (5.5, 'E5', .5), (6, 'D5', 1.5), (7.5, 'G4', .5)]
THEME_B = [(0, 'F4', .5), (.5, 'A4', .5), (1, 'D5', 1), (2, 'C5', .5), (2.5, 'B4', .5), (3, 'G4', 1), (4, 'E5', .5), (4.5, 'D5', .5), (5, 'C5', .5), (5.5, 'B4', .5), (6, 'C5', 2)]
def theme(notes, k): return [(b, tr(p, k), d) for b, p, d in notes]

# ================= TITLE · Introduction (96) =================
key('titleIn', HIT['titleIn'])
chord(at('TITLE', 0), ['C2', 'C3', 'G3'], 2.4, .7, -.3); chord(at('TITLE', 0), ['E4', 'G4', 'C5', 'E5'], 1.6, .62, .2, roll=.03)
for i, p in enumerate(['G4', 'C5', 'E5', 'G5', 'E5', 'C5']): n(at('TITLE', 1 + i * .33), p, .3, .38, .2)
n(HIT['peek'], 'E6', .12, .45, .3); n(HIT['peek'] + .06, 'F6', .4, .55, .3); key('peek', HIT['peek'])              # grace note: the peek
n(HIT['lookUs'], 'C6', .2, .5, .3); n(HIT['lookUs'] + bt('TITLE') * .5, 'C5', .3, .4, .3)                           # plink … plonk
for i, p in enumerate(['G3', 'G#3', 'A3', 'A#3', 'B3']): n(HIT['grab'] - .3 + i * .06, p, .1, .45, -.1)               # chromatic tug
gliss(HIT['snap'], 'C4', 'C7', .24, .55, .8); key('snap', HIT['snap'])                                                # the blind snaps up
chord(HIT['snap'] + .26, ['C2', 'C3'], 1.0, .78, -.3); chord(HIT['snap'] + .26, ['E5', 'G5', 'C6'], .5, .7, .2)
melody('TITLE', 5.5, THEME_A[:9], v=.6, dbl=True, sustain=.85)
stride('TITLE', 5.5, 10, ['C2', 'G1', 'A1', 'E2'], [['E3', 'G3', 'C4'], ['D3', 'G3', 'B3'], ['C3', 'E3', 'A3'], ['C3', 'E3', 'G3']], .42)
key('drop', HIT['drop']); gliss(HIT['drop'], 'G5', 'G3', .35, .5, .35)
chord(at('TITLE', 10.6), ['G1', 'G2'], 1.2, .5, -.3); chord(at('TITLE', 10.6), ['F4', 'B4', 'D5'], 1.0, .42, .2)   # half cadence into the night

# ================= NIGHT · Misterioso (72, A minor) =================
key('irisOpen', HIT['irisOpen'])
chord(HIT['irisOpen'], ['A1', 'E2', 'A2'], 3.0, .5, -.3, roll=.04); chord(HIT['irisOpen'] + .1, ['C4', 'E4', 'A4'], 1.8, .36, .2, roll=.05)
trem(at('NIGHT', 1.2), [['A1'], ['E2']], at('NIGHT', 9) - at('NIGHT', 1.2) - .2, rate=10, v=.22)
# chromatic creep while Xiao Yi rolls across
creep = ['E3', 'F3', 'F#3', 'G3', 'G#3', 'A3', 'A#3', 'B3']
for i, p in enumerate(creep): n(at('NIGHT', 1.5 + i * .5), p, bt('NIGHT') * .4, .42, -.05)
key('park', HIT['park']); chord(HIT['park'], ['C5', 'E5'], .5, .42, .2)
key('lens', HIT['lens']); n(HIT['lens'], 'A6', .9, .42, .4); n(HIT['lens'] + .12, 'E7', .7, .3, .4)
melody('NIGHT', 6.5, [(0, 'E5', .5), (.5, 'F5', .5), (1, 'E5', 1)], v=.38)
key('bell', HIT['bell']); chord(HIT['bell'], ['A0', 'A1'], 2.2, .62, -.3)
# GOAL card: cadence D minor 6 → E7, held
chord(at('GOAL', 0), ['D2', 'A2'], 1.6, .45, -.3); chord(at('GOAL', 0), ['F4', 'B4', 'D5'], 1.5, .4, .2, roll=.05)
chord(at('GOAL', 2), ['E2', 'B2'], 2.0, .48, -.3); chord(at('GOAL', 2), ['G#4', 'D5', 'E5'], 1.8, .42, .2, roll=.05)
trill(at('GOAL', 3.4), 'G#4', 'A4', bt('GOAL') * 1.0, rate=14, v=.3)

# ================= WORK · Allegretto stride (120, C major) =================
key('work', HIT['work'])
stride('WORK', 0, 10, ['C2', 'G1', 'C2', 'G1', 'F1', 'C2', 'G1', 'D2', 'C2', 'G1'],
       [['E3', 'G3', 'C4'], ['E3', 'G3', 'C4'], ['E3', 'A3', 'C4'], ['E3', 'A3', 'C4'], ['F3', 'A3', 'C4'], ['F3', 'A3', 'C4'], ['F3', 'G3', 'B3'], ['F3', 'G3', 'B3'], ['F3', 'A3', 'D4'], ['F3', 'G3', 'B3']], .48)
melody('WORK', 0, THEME_A, v=.6)
melody('WORK', 8, THEME_B[:4], v=.6)
key('can1', HIT['can1']); key('ding', HIT['ding']); n(HIT['ding'], 'C7', .5, .35, .4)
key('stamp1', HIT['stamp1']); chord(HIT['stamp1'], ['C2', 'C3'], .2, .55, -.3)
key('recoil', HIT['recoil']); chord(HIT['recoil'], ['C#2', 'G2', 'A#3', 'E4', 'G4'], .9, .82, 0)                     # diminished sforzando
trill(HIT['scrib'], 'A#4', 'B4', HIT['throw'] - HIT['scrib'], rate=18, v=.38)
key('throw', HIT['throw']); gliss(HIT['throw'], 'C4', 'G5', HIT['bonk'] - HIT['throw'] - .04, .4, .6)
key('bonk', HIT['bonk']); cluster(HIT['bonk'], 'C2', 'G2', .5, .82); n(HIT['bonk'] + .08, 'C1', .8, .6)            # forearm cluster
key('look', HIT['look']); n(HIT['look'] + .3, 'G6', .3, .38, .3); n(HIT['look'] + .3 + bt('WORK') * 1.5, 'G4', .6, .34, .3)   # plink … plonk
n(at('WORK', 14), 'G2', .6, .35, -.2); n(at('WORK', 14.5), 'D3', .4, .3, -.2)

# ================= PAGE · the insert (120) =================
melody('PAGE', 0, [(0, 'E5', .5), (.5, 'D5', .5), (1, 'C5', .5), (1.5, 'D5', .5), (2, 'E5', 1)], v=.42)
chord(at('PAGE', 0), ['C3', 'G3'], 1.0, .32, -.2)
key('strike', HIT['strike']); chord(HIT['strike'], ['B4', 'C5'], .6, .7, .1); chord(HIT['strike'], ['B1', 'C2'], .6, .6, -.2)   # minor second: wrong
key('fix', HIT['fix']); gliss(HIT['fix'], 'C4', 'C6', .5, .4, .6)
chord(HIT['fix'] + .55, ['C2', 'G2', 'C3'], 1.4, .5, -.3); chord(HIT['fix'] + .55, ['E5', 'G5', 'C6'], 1.2, .5, .2, roll=.03)
melody('PAGE', 6, [(0, 'G5', .5), (.5, 'E5', .5), (1, 'C5', .5), (1.5, 'G4', .5)], v=.36)
n(at('PAGE', 8), 'E2', .3, .4, -.2)                                                                                   # pickup into the hurry

# ================= HURRY · galop (152, A minor) =================
key('hurry', HIT['hurry'])
b = bt('HURRY')
for i in range(16):                                                                                                   # bass octaves, oom-pah
    t = at('HURRY', i); bass = ['A1', 'E2', 'A1', 'E2', 'D2', 'A1', 'E2', 'E1'][(i // 2) % 8]
    n(t, bass, b * .4, .55, -.25); n(t, tr(bass, 12), b * .4, .4, -.25)
    chord(t + b * .5, ['C4', 'E4', 'A4'] if (i // 4) % 2 == 0 else ['B3', 'D4', 'G#4'], b * .3, .38, -.05)
run = ['A4', 'B4', 'C5', 'D5', 'E5', 'D5', 'C5', 'B4', 'A4', 'C5', 'E5', 'A5', 'G#5', 'E5', 'D5', 'B4']
for i in range(16 * 4):                                                                                                # 16th-note runs
    if i % 16 in (14, 15) and (i // 16) % 2: continue
    n(at('HURRY', i / 4), run[i % 16], b * .22, .42 + .08 * (i % 4 == 0), .2)
for k in range(4):
    c0 = at('HURRY', k * 4)
    if k == 2: key('duck', c0 + 1.1 * b); gliss(c0 + 1.1 * b, 'E4', 'E6', .5, .45, .6); n(c0 + 1.1 * b + .55, 'A0', .6, .7)   # the ball sails over
key('jam', HIT['jam']); chord(HIT['jam'], ['D#2', 'A2', 'C4', 'F#4'], .8, .85)                                         # the jam: diminished sforzando
trem(HIT['jam'] + .3, [['A0', 'A1'], ['D#1', 'D#2']], HIT['smoke'] - HIT['jam'], rate=16, v=.4, cres=.15)            # low rumble
key('smoke', HIT['smoke']); trill(HIT['smoke'], 'F#5', 'G5', HIT['silence1'] - HIT['smoke'] - .05, rate=18, v=.36)   # nervous trill
key('silence1', HIT['silence1'])                                                                                     # SILENCE 1: projector only

# ================= SHOUT · Agitato (152) =================
key('shout', HIT['shout']); cluster(HIT['shout'], 'A0', 'E1', 1.4, .9); chord(HIT['shout'], ['C5', 'D#5', 'F#5', 'A5'], .5, .8, .2)
trem(HIT['shout'] + .25, [['C4', 'F#4'], ['D#4', 'A4']], SEC['SHOUT']['dur'] - .35, rate=14, v=.36, cres=.3)
trem(HIT['shout'] + .25, [['A1'], ['D#2']], SEC['SHOUT']['dur'] - .35, rate=7, v=.36, cres=.2)

# ================= DASH · Agitato hurry (160, D minor) =================
key('dash', HIT['dash']); b = bt('DASH')
for i in range(int(SEC['DASH']['beats'] * 2)):
    t = at('DASH', i / 2); n(t, ['D2', 'A1', 'D2', 'C#2'][i % 4], b * .4, .55, -.25)
for i in range(int(SEC['DASH']['beats'] * 4)):
    m = mi('D5') + [0, 1, 3, 1, 4, 3, 1, 0, -1, 0, 1, 4, 5, 4, 3, 1][i % 16]
    n(at('DASH', i / 4), m2n(m), b * .2, .45 + .1 * (i % 4 == 0), .2)
for i in range(4): chord(at('DASH', i * 2), ['D4', 'F4', 'A4'], b * .5, .5, .1)

# ================= CATCH: trip → SILENCE 2 → hiss → rolled chord (160) =================
b = bt('CATCH')
for i in range(3): n(at('CATCH', i / 2), ['D2', 'A1', 'D2'][i], b * .4, .55, -.25); chord(at('CATCH', i / 2 + .25), ['D4', 'F4', 'A4'], b * .25, .45, .1)
key('trip', HIT['trip']); gliss(HIT['trip'], 'D6', 'D3', .18, .7, .55); cluster(HIT['launch'] - .02, 'D1', 'G1', .25, .7)
key('launch', HIT['launch'])                                                                                           # SILENCE 2 until the catch
key('catch', HIT['catch'])                                                                                             # the hiss (mix.py) is the first sound
key('heal', HIT['heal']); chord(HIT['heal'], ['F1', 'F2', 'C3', 'A3', 'C4', 'F4', 'A4', 'C5', 'F5'], 4.0, .5, 0, roll=.07)
n(HIT['heal'] + 1.6, 'A5', 1.4, .32, .3); n(HIT['heal'] + 2.2, 'C6', 1.4, .28, .3)

# ================= TENDER · waltz (66, F major) =================
key('tender', HIT['tender']); b = bt('TENDER')
for i in range(int(SEC['TENDER']['beats'])):
    t = at('TENDER', i)
    if i % 3 == 0: n(t, ['F2', 'C2', 'F2'][(i // 3) % 3], b * 1.2, .38, -.25)
    else: chord(t, ['A3', 'C4', 'F4'] if (i // 3) % 2 == 0 else ['G3', 'C4', 'E4'], b * .6, .26, -.1)
melody('TENDER', 0, [(0, 'C5', 1), (1, 'F5', 1), (2, 'A5', 1.5)], v=.42, sustain=1.0)
key('raise', HIT['raise']); trill(HIT['raise'], 'E5', 'F5', HIT['pat'] - HIT['raise'] - .05, rate=14, v=.3)          # the flinch
key('pat', HIT['pat']); n(HIT['pat'], 'C6', .6, .42, .3); key('pat2', HIT['pat2']); n(HIT['pat2'], 'F6', 1.2, .4, .3)
melody('TENDER', 5.5, [(0, 'A5', .5), (.5, 'G5', .5), (1, 'F5', 1.5)], v=.38, sustain=1.0)

# ================= DAWN · Maestoso (88, C major) =================
key('dawn', HIT['dawn']); b = bt('DAWN')
chord(at('DAWN', 0), ['C2', 'G2', 'C3'], b * 1.8, .5, -.3); chord(at('DAWN', 0), ['E4', 'G4', 'C5'], b * 1.6, .45, .2, roll=.03)
key('seal', HIT['seal']); chord(HIT['seal'], ['C2', 'C3'], .3, .7, -.2); chord(HIT['seal'], ['G4', 'C5', 'E5'], .3, .6, .2)
melody('DAWN', 1, [(0, 'G4', .5), (.5, 'C5', .5), (1, 'E5', 1)], v=.55, dbl=True)
key('hoist', HIT['hoist']); gliss(HIT['hoist'], 'C3', 'C5', b * 1.4, .35, .55)
key('slot', HIT['slot']); chord(HIT['slot'], ['C1', 'C2'], 1.0, .75, -.2); chord(HIT['slot'], ['E4', 'G4', 'C5'], .8, .55, .2)
key('lamps', HIT['lamps'])
LAMPN = ['C4', 'E4', 'G4', 'C5', 'E5', 'G5', 'C6', 'E6']
for i, tl in enumerate(LAMPS): n(tl, LAMPN[i], 1.6, .5 + .03 * i, -.3 + i * .08)
stride('DAWN', 5, 10, ['C2', 'G1', 'F1', 'G1', 'C2'], [['E3', 'G3', 'C4'], ['D3', 'G3', 'B3'], ['F3', 'A3', 'C4'], ['F3', 'G3', 'B3'], ['E3', 'G3', 'C4']], .4)
melody('DAWN', 6, [(0, 'E5', .5), (.5, 'D5', .5), (1, 'C5', .5), (1.5, 'B4', .5), (2, 'C5', 1), (3, 'G5', 2)], v=.5, dbl=True, sustain=1.0)
chord(at('DAWN', 10), ['C2', 'G2', 'C3'], b * 1.2, .45, -.3); chord(at('DAWN', 10), ['E4', 'G4', 'C5', 'E5'], b * 1.1, .42, .2, roll=.03)

# ================= LAST card · Tenderly (66) and END =================
key('last', HIT['last']); b = bt('LAST')
for i in range(4):
    n(at('LAST', i), ['F2', 'C3', 'A2', 'G2'][i], b * .9, .32, -.25); chord(at('LAST', i + .5), [['A3', 'C4', 'F4'], ['G3', 'C4', 'E4'], ['A3', 'C4', 'F4'], ['G3', 'B3', 'D4']][i], b * .45, .24, -.1)
melody('LAST', 0, theme(THEME_B, 12)[:6], v=.36, sustain=1.0)
key('end', HIT['end'])
chord(HIT['end'], ['C1', 'C2', 'G2', 'C3'], 5.0, .58, -.25, roll=.05); chord(HIT['end'] + .2, ['E4', 'G4', 'C5', 'E5', 'G5', 'C6'], 4.6, .48, .2, roll=.06)

audio = S.render(EV, DUR + 1.5)
sf.write(os.path.join(HERE, 'score.wav'), audio[:int(DUR * SR)], SR, subtype='PCM_24')
json.dump({'keys': KEYS, 'notes': len(EV)}, open(os.path.join(HERE, 'score.json'), 'w'), indent=1)
open(os.path.join(HERE, 'CREDITS_music.txt'), 'w').write('\n'.join(S.credits([P])) + '\n')
print('score.wav', len(EV), 'notes', round(len(audio) / SR, 2), 's')
