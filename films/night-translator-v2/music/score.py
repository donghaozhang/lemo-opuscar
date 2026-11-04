"""《深夜翻译官》 v2 — original photoplay score for a small picture-house pit band, written to ../timeline.json.
Upright piano (the backbone), violins, cellos, pizzicato bass, clarinet, bassoon, flute, trumpet (muted for the gags),
timpani, glockenspiel, xylophone, tubular bells — VSCO 2 CE (CC0). Two leitmotifs:
  小译  — a bouncy tune in C (clarinet / piano / violins);   老校 — a pompous dotted march in G minor (bassoon / cellos),
          which turns major when it approves, and joins 小译's theme in the waltz and the dawn finale.
Cue sheet: Misterioso (cold open) → Introduction → Misterioso + 老校's march → western pastiche → romance parody →
Misterioso comico (monster) → Hurry (montage) → Agitato (jam; SILENCE) → Agitato hurry (fire; SILENCE; the hiss) →
Valse lente → clarinet alone → Maestoso → Tenderly → final chord.
Run: .venv/bin/python films/night-translator-v2/music/score.py → music/score.wav, music/score.json (sync keys)"""
import sys, os, json
import numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); PROJ = os.path.dirname(HERE)
ROOT = os.environ.get('LIB') or os.path.abspath(os.path.join(PROJ, '../..'))
sys.path.insert(0, ROOT)
from core.audio import sampler as S
from core.audio.sfx import SR
S.seed(1927)
TL = json.load(open(os.path.join(PROJ, 'timeline.json')))
SEC, HIT, DUR, LAMPS = TL['SEC'], TL['HIT'], TL['DUR'], TL['LAMPS']
def at(s, b=0.0): return SEC[s]['t0'] + b * SEC[s]['beat']
def bt(s): return SEC[s]['beat']
EV, KEYS, USED = [], {}, set()
PIANO = 'upright'
def n(t, p, d, v=.6, pan=0., inst=PIANO):
    if 0 <= t < DUR: EV.append((t, inst, p, d, v, pan)); USED.add(inst)
def chord(t, ps, d, v=.6, pan=0., roll=0., inst=PIANO):
    for i, p in enumerate(ps): n(t + i * roll, p, d, v * (1 - .03 * i), pan, inst)
def key(k, t): KEYS[k] = round(t, 4)
NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
def m2n(m): return NAMES[m % 12] + str(m // 12 - 1)
def mi(p): return int(round(S.midi(p)))
def tr(p, k): return m2n(mi(p) + k)
WHITE = [0, 2, 4, 5, 7, 9, 11]
def gliss(t, p0, p1, d, v0=.5, v1=.75, white=True, inst=PIANO):
    a, b = mi(p0), mi(p1); s = 1 if b > a else -1
    ns = [m for m in range(a, b + s, s) if (not white or m % 12 in WHITE)]
    for i, m in enumerate(ns): u = i / max(1, len(ns) - 1); n(t + u * d, m2n(m), .22, v0 + (v1 - v0) * u, (u - .5) * .4, inst)
def trem(t, ps, d, rate=14, v=.45, cres=0., inst=PIANO):
    k, tt = 0, t
    while tt < t + d - 1e-6:
        for p in ps[k % 2]: n(tt, p, 1.2 / rate, v + cres * (tt - t) / d, 0, inst)
        tt += 1 / rate; k += 1
def trill(t, a, b, d, rate=16, v=.4, inst=PIANO):
    k, tt = 0, t
    while tt < t + d - 1e-6: n(tt, a if k % 2 == 0 else b, 1.1 / rate, v, .2, inst); tt += 1 / rate; k += 1
def cluster(t, lo, hi, d, v=.8):
    for m in range(mi(lo), mi(hi) + 1): n(t, m2n(m), d, v, -.1)
def stride(sec, b0, b1, bass, chords, v=.5):
    B, b = bt(sec), b0
    while b < b1 - 1e-6:
        i = int(round(b - b0)); bn, ch = bass[i % len(bass)], chords[i % len(chords)]
        n(at(sec, b), bn, B * .45, v, -.25); chord(at(sec, b + .5), ch, B * .35, v * .7, -.1); b += 1
def waltz(sec, b0, b1, bass, chords, v=.4, inst=PIANO):
    B, b = bt(sec), b0
    while b < b1 - 1e-6:
        i = int(round(b - b0)); bar = i // 3
        if i % 3 == 0: n(at(sec, b), bass[bar % len(bass)], B * 1.4, v, -.25, inst)
        else: chord(at(sec, b), chords[bar % len(chords)], B * .6, v * .65, -.1, inst=inst)
        b += 1
def mel(sec, b0, notes, inst=PIANO, v=.6, k=0, sustain=.92, pan=.15, oct_below=False):
    for b, p, d in notes:
        if b0 + b >= SEC[sec]['beats'] - 1e-6: continue
        t = at(sec, b0 + b); pp = tr(p, k); dd = d * bt(sec) * sustain
        n(t, pp, dd, v, pan, inst)
        if oct_below: n(t, tr(pp, -12), dd, v * .8, pan - .1, inst)
def pad(sec, b0, b1, ps, inst='cellos', v=.35, pan=-.2):
    for p in ps: n(at(sec, b0), p, (b1 - b0) * bt(sec), v, pan, inst)

XY_A = [(0, 'G4', .5), (.5, 'C5', .5), (1, 'E5', 1), (2, 'D5', .5), (2.5, 'C5', .5), (3, 'A4', 1), (4, 'G4', .5), (4.5, 'A4', .5), (5, 'C5', .5), (5.5, 'E5', .5), (6, 'D5', 1.5), (7.5, 'G4', .5)]
XY_B = [(0, 'F4', .5), (.5, 'A4', .5), (1, 'D5', 1), (2, 'C5', .5), (2.5, 'B4', .5), (3, 'G4', 1), (4, 'E5', .5), (4.5, 'D5', .5), (5, 'C5', .5), (5.5, 'B4', .5), (6, 'C5', 2)]
LJ = [(0, 'G2', .75), (.75, 'G2', .25), (1, 'D3', 1), (2, 'C3', .75), (2.75, 'A#2', .25), (3, 'A2', 1), (4, 'G2', .75), (4.75, 'A2', .25), (5, 'A#2', .5), (5.5, 'C3', .5), (6, 'D3', 2)]
LJ_MAJ = [(b, p.replace('A#', 'B'), d) for b, p, d in LJ]
def aug(notes, f): return [(b * f, p, d * f) for b, p, d in notes]
def inv(notes, axis='C5'):
    a = mi(axis); return [(b, m2n(2 * a - mi(p)), d) for b, p, d in notes]

# ================= COLD · Misterioso (66) =================
key('cold', 0)
trem(at('COLD', .3), [['A0'], ['E1']], at('COLD', 8.4) - at('COLD', .3), rate=9, v=.22)
pad('COLD', 0, 8.5, ['A2', 'E3'], 'cellos', .24)
for i in range(5): n(at('COLD', .5 + i * .8), ['E2', 'F2', 'E2', 'F2', 'F#2'][i], bt('COLD') * .5, .5, -.2, 'contrabass_pizz')   # the can rolling
key('bump', HIT['bump']); chord(HIT['bump'], ['C4', 'C#4'], .3, .5, .1); n(HIT['bump'], 'G2', .5, .5, -.2, 'cellos_pizz')
key('bulb', HIT['bulb']); [n(HIT['bulb'] + d, 'E7', .4, .45 - i * .08, .4, 'glockenspiel') for i, d in enumerate((0, .22, .4))]
key('eyes', HIT['eyes']); mel('COLD', 7.2, [(0, 'A3', .5), (.5, 'C4', .5), (1, 'E4', 1)], 'clarinet', .42)
key('lookUp', HIT['lookUp']); trem(at('COLD', 8.4), [['A3', 'C4'], ['D#4', 'F#4']], at('COLD', 10.3) - at('COLD', 8.4), rate=12, v=.32, cres=.35, inst='violins_trem')
for i, p in enumerate(['A2', 'A#2', 'B2', 'C3', 'C#3', 'D3', 'D#3', 'E3']): n(at('COLD', 8.5 + i * .22), p, .3, .4 + i * .03, -.2, 'cellos')
key('take', HIT['take']); chord(HIT['take'], ['C#2', 'G2', 'A#3', 'E4', 'G4'], 1.0, .85); n(HIT['take'], 'G2', 1.2, .8, 0, 'timpani')
chord(HIT['take'], ['A#3', 'E4', 'G4'], .6, .55, .2, inst='violins'); n(HIT['take'], 'A#3', .6, .55, .3, 'trumpet_mute')

# ================= TITLE · Introduction (96, C) =================
key('titleIn', HIT['titleIn'])
chord(at('TITLE', 0), ['C2', 'C3', 'G3'], 2.4, .62, -.3); chord(at('TITLE', 0), ['E4', 'G4', 'C5', 'E5'], 1.6, .55, .2, roll=.03)
pad('TITLE', 0, 3, ['C3', 'G3'], 'cellos', .25)
n(HIT['peek'], 'E6', .12, .45, .3); n(HIT['peek'] + .06, 'F6', .4, .55, .3); key('peek', HIT['peek'])
n(HIT['lookUs'], 'C6', .2, .5, .3); n(HIT['lookUs'] + bt('TITLE') * .5, 'C5', .3, .4, .3)
for i, p in enumerate(['G3', 'G#3', 'A3', 'A#3', 'B3']): n(HIT['grab'] - .3 + i * .06, p, .1, .45, -.1)
key('snap', HIT['snap']); gliss(HIT['snap'], 'C4', 'C7', .24, .55, .8); n(HIT['snap'] + .26, 'C6', .8, .5, .3, 'glockenspiel')
chord(HIT['snap'] + .26, ['C2', 'C3'], 1.0, .7, -.3)
mel('TITLE', 5.5, XY_A[:9], 'clarinet', .55, sustain=.85); mel('TITLE', 5.5, XY_A[:9], PIANO, .4, k=12, sustain=.6)
stride('TITLE', 5.5, 10, ['C2', 'G1', 'A1', 'E2'], [['E3', 'G3', 'C4'], ['D3', 'G3', 'B3'], ['C3', 'E3', 'A3'], ['C3', 'E3', 'G3']], .4)
key('drop', HIT['drop']); gliss(HIT['drop'], 'G5', 'G3', .35, .5, .35)
chord(at('TITLE', 10.6), ['G1', 'G2'], 1.2, .45, -.3); chord(at('TITLE', 10.6), ['F4', 'B4', 'D5'], 1.0, .38, .2)

# ================= ESTAB · Misterioso → 老校's march (72) =================
key('roll', HIT['roll'])
pad('ESTAB', 0, 6, ['A2', 'E3'], 'cellos', .22); trem(at('ESTAB', 0), [['A1'], ['E2']], at('ESTAB', 6) - at('ESTAB', 0), rate=9, v=.18)
for i, p in enumerate(['E3', 'F3', 'F#3', 'G3', 'G#3', 'A3', 'A#3', 'B3']): n(at('ESTAB', 1 + i * .5), p, bt('ESTAB') * .4, .38, -.05)
key('park', HIT['park']); chord(HIT['park'], ['C5', 'E5'], .5, .4, .2)
key('unfold', HIT['unfold']); n(HIT['unfold'], 'D7', .6, .4, .4, 'glockenspiel')
mel('ESTAB', 6.5, LJ, 'bassoon', .62, sustain=.9); mel('ESTAB', 6.5, LJ, 'cellos', .42, k=12, sustain=.9)
for b in range(6, 11): n(at('ESTAB', b + .5), ['G1', 'D2', 'G1', 'D2', 'G1'][b - 6], bt('ESTAB') * .4, .45, -.25); chord(at('ESTAB', b + .5) + bt('ESTAB') * .5, ['A#2', 'D3', 'G3'], bt('ESTAB') * .3, .3, -.1)
key('flourish', HIT['flourish']); gliss(HIT['flourish'], 'G5', 'G6', .5, .3, .5, inst='flute'); trill(HIT['flourish'] + .5, 'G6', 'A6', .5, rate=18, v=.32, inst='flute')
key('point', HIT['point']); chord(HIT['point'], ['G2', 'D3', 'A#3', 'G4'], .7, .7); n(HIT['point'], 'G2', .8, .6, 0, 'timpani')
# SAY: the march continues under the card
mel('SAY', 0, LJ, 'bassoon', .55, sustain=.9); mel('SAY', 0, LJ, 'cellos', .38, k=12)
for b in range(5): n(at('SAY', b), ['G1', 'D2'][b % 2], bt('SAY') * .5, .42, -.25); chord(at('SAY', b + .5), ['A#2', 'D3', 'G3'], bt('SAY') * .3, .28, -.1)
# GULP: a bassoon slide down, then 小译's head-motif, determined
key('gulp', HIT['gulp']); gliss(HIT['gulp'], 'G3', 'C3', .5, .5, .3, white=False, inst='bassoon')
key('nodGo', HIT['nodGo']); mel('GULP', 2, [(0, 'G4', .25), (.25, 'C5', .25), (.5, 'E5', .5)], 'clarinet', .55); chord(HIT['nodGo'], ['C3', 'G3'], .5, .45, -.2)

# ================= WEST · western pastiche (120) =================
key('west', SEC['WEST']['t0']); b = bt('WEST')
for i in range(25):                                                           # clip-clop: open fifths, oom-pah
    t = at('WEST', i); n(t, ['C2', 'G1'][i % 2], b * .4, .48, -.25); chord(t + b * .5, ['G2', 'D3'] if i % 4 < 2 else ['C3', 'G3'], b * .3, .34, -.1)
mel('WEST', 0, XY_A, 'clarinet', .55); mel('WEST', 8, XY_B, 'clarinet', .5); mel('WEST', 16, XY_A[:6], 'clarinet', .45, k=-12)
for i in range(8): n(at('WEST', 3 + i * .5), 'E5', b * .3, .35, .3, 'violins_pizz')
key('wGrab', HIT['wGrab']); key('wThread', HIT['wThread'])
key('wZoom', HIT['wZoom']); trill(HIT['wZoom'], 'C5', 'C#5', .35, rate=18, v=.3)
key('wRecoil', HIT['wRecoil']); n(HIT['wRecoil'], 'C#4', .5, .7, .2, 'trumpet_mute'); n(HIT['wRecoil'] + .25, 'C4', .6, .6, .2, 'trumpet_mute'); chord(HIT['wRecoil'], ['C#2', 'G2', 'A#3', 'E4'], .7, .75)
key('wStrike', HIT['wStrike']); chord(HIT['wStrike'], ['B4', 'C5'], .6, .65, .1); chord(HIT['wStrike'], ['B1', 'C2'], .6, .55, -.2)
key('wFix', HIT['wFix']); gliss(HIT['wFix'], 'C4', 'C6', .45, .35, .55); chord(HIT['wFix'] + .5, ['C2', 'G2', 'C3'], 1.2, .45, -.3); chord(HIT['wFix'] + .5, ['E5', 'G5', 'C6'], 1.1, .4, .2, inst='violins')
key('wThrow', HIT['wThrow']); gliss(HIT['wThrow'], 'C4', 'G5', HIT['wBonk'] - HIT['wThrow'] - .04, .4, .55)
key('wBonk', HIT['wBonk']); cluster(HIT['wBonk'], 'C2', 'G2', .5, .8); n(HIT['wBonk'], 'F2', .9, .75, 0, 'timpani')
key('wLook', HIT['wLook']); n(HIT['wLook'] + .3, 'G6', .3, .36, .3); n(HIT['wLook'] + 1.0, 'G4', .6, .32, .3); n(HIT['wLook'] + 1.0, 'G3', .6, .3, .2, 'bassoon_stac')

# ================= ROMA · romance parody (126, A♭ → C) =================
key('roma', SEC['ROMA']['t0']); b = bt('ROMA')
waltz('ROMA', 0, 15, ['G#1', 'D#2', 'G#1', 'C#2', 'D#2'], [['G#3', 'C4', 'D#4'], ['G3', 'C#4', 'D#4'], ['G#3', 'C4', 'D#4'], ['G#3', 'C#4', 'F4'], ['G3', 'C#4', 'D#4']], .36)
ROM = [(0, 'D#5', 1), (1, 'C6', 2), (3, 'A#5', .5), (3.5, 'G#5', .5), (4, 'G5', 1), (5, 'G#5', 1), (6, 'D#5', 3), (9, 'F5', 1), (10, 'C#6', 2), (12, 'C6', 1), (13, 'A#5', 2)]
mel('ROMA', 0, ROM, 'violins', .55, sustain=1.05); mel('ROMA', 0, [(b2 * 1, p, d) for b2, p, d in ROM], 'cellos', .25, k=-24, sustain=1.0)
key('rCrouch', HIT['rCrouch']); trill(HIT['rCrouch'], 'B4', 'C5', HIT['rFlip'] - HIT['rCrouch'], rate=16, v=.35)
key('rFlip', HIT['rFlip']); gliss(HIT['rFlip'], 'C4', 'C7', .3, .5, .75); n(HIT['rFlip'] + .3, 'C7', .5, .5, .3, 'xylophone')
mel('ROMA', 17.6, inv(XY_A, 'C5')[:7], 'clarinet', .5)                      # 小译's theme upside down, for a robot upside down
stride('ROMA', 17.6, 20.4, ['C2', 'G1'], [['E3', 'G3', 'C4'], ['D3', 'G3', 'B3']], .38)
key('rPop', HIT['rPop']); n(HIT['rPop'], 'G4', .3, .7, .2, 'trumpet_mute'); n(HIT['rPop'] + .22, 'F#4', .3, .65, .2, 'trumpet_mute'); n(HIT['rPop'] + .44, 'F4', .5, .6, .2, 'trumpet_mute')
key('rTopple', HIT['rTopple']); gliss(HIT['rTopple'], 'C6', 'C3', .45, .6, .5); n(HIT['rTopple'] + .5, 'C2', .8, .7, 0, 'timpani')
key('rStrike', HIT['rStrike']); chord(HIT['rStrike'], ['B4', 'C5'], .6, .65, .1); chord(HIT['rStrike'], ['B1', 'C2'], .6, .55, -.2)
key('rFix', HIT['rFix']); mel('ROMA', 22.6, [(0, 'C5', 1), (1, 'G5', 2), (3, 'F5', .5), (3.5, 'E5', .5), (4, 'D5', 1), (5, 'E5', 1.5)], 'violins', .55, sustain=1.05)
waltz('ROMA', 22.4, 28.4, ['C2', 'G1'], [['E3', 'G3', 'C4'], ['D3', 'G3', 'B3']], .33)
key('rThrow', HIT['rThrow']); gliss(HIT['rThrow'], 'D4', 'D6', .5, .4, .55)
key('rDuck', HIT['rDuck']); n(HIT['rDuck'], 'C3', .2, .5, -.1, 'bassoon_stac')
key('rPile', HIT['rPile']); cluster(HIT['rPile'], 'A1', 'D2', .4, .7); [n(HIT['rPile'] + .15 * i, ['A2', 'F#2', 'C#2'][i], .4, .6 - i * .1, 0, 'timpani') for i in range(3)]

# ================= MONS · Misterioso comico (104, E minor) =================
key('mons', SEC['MONS']['t0']); b = bt('MONS')
CREEP = [(0, 'E2', .5), (1, 'G2', .5), (2, 'F#2', .5), (3, 'D#2', .5), (4, 'E2', .5), (5, 'B1', .5), (6, 'C2', .5), (7, 'B1', .5)]
for k0 in (0, 8, 13): mel('MONS', k0, CREEP, 'bassoon_stac', .55)
for i in range(9): n(at('MONS', i), ['E1', 'B1'][i % 2], b * .5, .5, -.25, 'contrabass_pizz')
key('mFlash', HIT['mFlash']); n(HIT['mFlash'], 'E2', 2.0, .8, 0, 'timpani'); chord(HIT['mFlash'], ['E2', 'A#2', 'G3', 'C#4'], 1.2, .7)
trem(at('MONS', 3), [['E4', 'A#4'], ['G4', 'C#5']], at('MONS', 9) - at('MONS', 3), rate=12, v=.28, cres=.15, inst='violins_trem')
key('mThink', HIT['mThink'])
for i in range(12): n(at('MONS', 9.5 + i * .3), m2n(mi('E7') - i * 2 - (i % 3)), .3, .35, .4 - i * .06, 'glockenspiel' if i % 2 else 'xylophone')   # cats and dogs falling
for i in range(6): n(at('MONS', 9.5 + i * .6), ['A#4', 'E4'][i % 2], .2, .4, -.2, 'violins_pizz')
key('mPage', HIT['mPage']); mel('MONS', 13, CREEP, 'bassoon_stac', .45, k=12)
key('mPen', HIT['mPen']); trem(HIT['mPen'], [['B3', 'D4'], ['C4', 'D#4']], HIT['mStrike'] - HIT['mPen'], rate=14, v=.3, inst='violins_trem')
key('mStrike', HIT['mStrike']); chord(HIT['mStrike'], ['D#2', 'A2', 'C4', 'F#4'], .6, .7)
key('mFix', HIT['mFix']); mel('MONS', 17.5, [(0, 'E4', .5), (.5, 'G4', .5), (1, 'B4', .5), (1.5, 'E5', 1.5), (3, 'D#5', .5), (3.5, 'E5', 1)], 'clarinet', .5)
chord(at('MONS', 17.5), ['E2', 'B2'], 2.5, .35, -.2, inst='cellos')
key('mThrow', HIT['mThrow']); gliss(HIT['mThrow'], 'E4', 'B5', HIT['mCatch'] - HIT['mThrow'] - .04, .4, .55)
key('mCatch', HIT['mCatch']); n(HIT['mCatch'], 'E7', .8, .6, .3, 'glockenspiel'); chord(HIT['mCatch'], ['E5', 'G#5', 'B5'], .4, .5, .2)
key('mPop', HIT['mPop']); n(HIT['mPop'], 'B4', .25, .7, .2, 'trumpet_mute'); n(HIT['mPop'] + .2, 'A#4', .25, .65, .2, 'trumpet_mute'); n(HIT['mPop'] + .4, 'A4', .5, .6, .2, 'trumpet_mute')
key('mNod', HIT['mNod']); mel('MONS', 27, [(0, 'G4', .25), (.25, 'C5', .25), (.5, 'E5', .5)], 'clarinet', .5)
key('mBow', HIT['mBow']); mel('MONS', 27.8, LJ_MAJ[:3], 'bassoon', .5, k=12)        # 老校 approves: its march, in major

# ================= MONT · Hurry (152) =================
key('mont', HIT['mont']); b = bt('MONT')
for i in range(20):
    t = at('MONT', i); bass = ['C2', 'G1', 'C2', 'G1', 'F1', 'C2', 'G1', 'G1'][(i // 2) % 8]
    n(t, bass, b * .4, .5, -.25); n(t, tr(bass, 12), b * .4, .36, -.25); chord(t + b * .5, ['E3', 'G3', 'C4'] if (i // 4) % 2 == 0 else ['D3', 'F3', 'B3'], b * .3, .33, -.05)
mel('MONT', 0, aug(XY_A, .5), 'clarinet', .55); mel('MONT', 4, aug(XY_B, .5), 'clarinet', .55)
mel('MONT', 8, aug(LJ_MAJ, .5), 'bassoon', .6, k=12); mel('MONT', 8, aug(XY_A, .5), 'violins', .45)
mel('MONT', 12, aug(XY_A, .5), 'violins', .5, k=2); mel('MONT', 12, aug(LJ_MAJ, .5), 'cellos', .45, k=14)
for i in range(16, 20): chord(at('MONT', i), ['G4', 'B4', 'D5'], b * .4, .4 + (i - 16) * .05, .2, inst='violins')
key('matchCut', HIT['matchCut']); n(HIT['matchCut'], 'C7', .5, .45, .3, 'glockenspiel')
for s in TL['SHOTS']:
    if s['sec'] == 'MONT': n(s['t0'], 'C2', .25, .5, -.2, 'timpani' if s['b'] % 5 == 0 else PIANO)     # an accent on every cut

# ================= JAM · Agitato setup (88) =================
key('jThread', HIT['jThread']); b = bt('JAM')
trem(at('JAM', 0), [['D3', 'F3'], ['G#3', 'B3']], at('JAM', 8.2) - at('JAM', 0), rate=12, v=.25, cres=.25, inst='violins_trem')
for i in range(8): n(at('JAM', i), ['D2', 'D2', 'D#2', 'D#2', 'E2', 'E2', 'F2', 'F2'][i], b * .4, .45, -.25)
key('jam', HIT['jam']); chord(HIT['jam'], ['D#2', 'A2', 'C4', 'F#4'], .8, .8)
key('jBump', HIT['jBump']); n(HIT['jBump'], 'D3', .8, .7, 0, 'timpani')
key('spark', HIT['spark']); chord(HIT['spark'], ['F#5', 'C6'], .3, .7, .2); n(HIT['spark'], 'F#6', .5, .5, .3, 'xylophone')
key('jWide', HIT['jWide']); trill(HIT['jWide'], 'F#5', 'G5', HIT['silence1'] - HIT['jWide'] - .05, rate=18, v=.38, inst='violins')
key('silence1', HIT['silence1'])

# ================= SHOUT · Agitato =================
key('shout', HIT['shout']); cluster(HIT['shout'], 'A0', 'E1', 1.4, .9); chord(HIT['shout'], ['C5', 'D#5', 'F#5', 'A5'], .5, .8, .2)
n(HIT['shout'], 'F2', 1.4, .85, 0, 'timpani')
trem(HIT['shout'] + .25, [['C4', 'F#4'], ['D#4', 'A4']], SEC['SHOUT']['dur'] - .35, rate=14, v=.34, cres=.3, inst='violins_trem')
trem(HIT['shout'] + .25, [['A1'], ['D#2']], SEC['SHOUT']['dur'] - .35, rate=7, v=.34, cres=.2)

# ================= FIRE · Agitato hurry (160, D minor) =================
key('yank', HIT['yank']); b = bt('FIRE')
trem(at('FIRE', 0), [['D4', 'F4'], ['A4', 'D5']], at('FIRE', 25.5) - at('FIRE', 0), rate=14, v=.26, cres=.15, inst='violins_trem')
for i in range(int(25.5 * 2)):
    t = at('FIRE', i / 2)
    if HIT['ladder'] - .05 < t < HIT['ladder'] + .45: continue
    n(t, ['D2', 'A1', 'D2', 'C#2'][i % 4], b * .4, .5, -.25)
for i in range(int(25.5 * 4)):
    t = at('FIRE', i / 4)
    if HIT['ladder'] - .05 < t < HIT['ladder'] + .45: continue
    n(t, m2n(mi('D5') + [0, 1, 3, 1, 4, 3, 1, 0, -1, 0, 1, 4, 5, 4, 3, 1][i % 16]), b * .2, .38 + .08 * (i % 4 == 0), .2)
for i in range(5): n(HIT['hot'] + i * .42, ['A6', 'F6'][i % 2], .2, .45, .3 - .15 * (i % 2) * 2, 'xylophone')                 # hot potato
key('race', HIT['race']); mel('FIRE', 5, aug(XY_A, .5), 'clarinet', .5)
key('ladder', HIT['ladder']); gliss(HIT['ladder'] + .05, 'G4', 'G6', .35, .4, .55, inst=PIANO)
key('ljGrab', HIT['ljGrab']); mel('FIRE', 14, aug(LJ, .5), 'bassoon', .65, k=12); mel('FIRE', 14, aug(LJ, .5), 'cellos', .5, k=12)        # 老校's march, in a hurry
mel('FIRE', 19, aug(XY_A, .5), 'violins', .5); mel('FIRE', 19, aug(LJ, .5), 'bassoon', .5, k=12)
for i in range(6): n(at('FIRE', 19 + i), 'D2', .3, .5 + i * .05, 0, 'timpani')
key('trip', HIT['trip']); gliss(HIT['trip'], 'D6', 'D3', .18, .7, .55); cluster(HIT['launch'] - .02, 'D1', 'G1', .25, .7)
key('launch', HIT['launch'])                                                   # SILENCE 2 until the catch
key('catch', HIT['catch'])                                                     # the hiss (mix.py) is the first sound
key('heal', HIT['heal']); chord(HIT['heal'], ['F1', 'F2', 'C3', 'A3', 'C4', 'F4', 'A4', 'C5', 'F5'], 4.0, .48, 0, roll=.07)
pad('FIRE', 30, 39, ['F3', 'A3', 'C4'], 'violins', .3, .2); pad('FIRE', 30, 39, ['F2', 'C3'], 'cellos', .3)
key('popUp', HIT['popUp']); mel('FIRE', 34, [(0, 'G4', .5), (.5, 'C5', .5), (1, 'E5', 1.5)], 'clarinet', .45)

# ================= TENDER · Valse lente (66, F): both themes together =================
key('tender', SEC['TENDER']['t0']); b = bt('TENDER')
waltz('TENDER', 0, 12, ['F2', 'C2', 'F2', 'C2'], [['A3', 'C4', 'F4'], ['G3', 'C4', 'E4'], ['A3', 'C4', 'F4'], ['A#3', 'C4', 'E4']], .32)
mel('TENDER', 0, aug([(bb, p, d) for bb, p, d in XY_A[:8]], 1.5), 'violins', .45, k=5, sustain=1.0)
mel('TENDER', 1.5, aug(LJ_MAJ[:6], 1.5), 'cellos', .4, k=10, sustain=1.0)
key('hang', HIT['hang'])
key('handover', HIT['handover']); n(HIT['handover'], 'A6', 1.2, .45, .3, 'glockenspiel')
key('raise', HIT['raise']); trill(HIT['raise'], 'E5', 'F5', HIT['pat'] - HIT['raise'] - .05, rate=14, v=.28)
key('pat', HIT['pat']); n(HIT['pat'], 'C6', .6, .45, .3, 'violins_pizz'); key('pat2', HIT['pat2']); n(HIT['pat2'], 'F6', .8, .45, .3, 'violins_pizz')
mel('TENDER', 10.5, [(0, 'A5', .5), (.5, 'G5', .5), (1, 'F5', 1.5)], 'violins', .42, sustain=1.05)
# SAY2: clarinet alone, 小译's head motif, slow and soft
key('say2', HIT['say2']); mel('SAY2', .5, aug(XY_A[:3], 1.5), 'clarinet', .38, k=5, sustain=1.0); chord(at('SAY2', 2.5), ['F3', 'A3', 'C4'], 1.6, .2, -.2, inst='cellos')

# ================= DAWN · Maestoso (88, C): both themes, full band =================
key('dawn', SEC['DAWN']['t0']); b = bt('DAWN')
chord(at('DAWN', 0), ['C2', 'G2', 'C3'], b * 1.8, .45, -.3); pad('DAWN', 0, 5, ['C3', 'G3'], 'cellos', .3); pad('DAWN', 0, 5, ['E4', 'G4'], 'violins', .25, .2)
key('seal', HIT['seal']); chord(HIT['seal'], ['C2', 'C3'], .3, .7, -.2); chord(HIT['seal'], ['G4', 'C5', 'E5'], .3, .6, .2); n(HIT['seal'], 'C3', .9, .7, 0, 'timpani')
mel('DAWN', 2, XY_A[:3], 'trumpet', .5, k=-12)
key('hoist', HIT['hoist']); gliss(HIT['hoist'], 'C3', 'C5', b * 1.4, .35, .5)
for i, p in enumerate(['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']): n(at('DAWN', 5.5 + i * .3), p, .35, .3 + i * .03, .2, 'violins')
key('slot', HIT['slot']); chord(HIT['slot'], ['C1', 'C2'], 1.0, .7, -.2); chord(HIT['slot'], ['E4', 'G4', 'C5'], .8, .5, .2); n(HIT['slot'], 'G2', 1.2, .75, 0, 'timpani')
key('six', HIT['six']); n(HIT['six'], 'C4', 3.0, .55, .1, 'tubular_bells')
key('lamps', HIT['lamps'])
LAMPN = ['C5', 'E5', 'G5', 'C6', 'E6', 'G6', 'C7', 'E7']
for i, tl in enumerate(LAMPS): n(tl, LAMPN[i], 1.4, .45, -.3 + i * .08, 'glockenspiel'); n(tl, tr(LAMPN[i], -12), 1.4, .4, -.3 + i * .08)
mel('DAWN', 9.5, XY_A, 'violins', .55, sustain=1.0); mel('DAWN', 9.5, XY_A, 'trumpet', .42, k=-12, sustain=.9)
mel('DAWN', 9.5, [(bb, tr(p, 12), d) for bb, p, d in LJ_MAJ], 'cellos', .45, k=-7, sustain=1.0); mel('DAWN', 9.5, LJ_MAJ, 'bassoon', .45, k=5)
stride('DAWN', 9.5, 16, ['C2', 'G1', 'F1', 'G1', 'C2', 'G1'], [['E3', 'G3', 'C4'], ['D3', 'G3', 'B3'], ['F3', 'A3', 'C4'], ['F3', 'G3', 'B3'], ['E3', 'G3', 'C4'], ['D3', 'F3', 'B3']], .4)
for i in range(4): n(at('DAWN', 12 + i), 'C3' if i % 2 == 0 else 'G2', .4, .5, 0, 'timpani')

# ================= LAST · Tenderly, END · final chord =================
key('last', HIT['last']); b = bt('LAST')
waltz('LAST', 0, 4.5, ['F2', 'C3'], [['A3', 'C4', 'F4'], ['G3', 'C4', 'E4']], .28)
mel('LAST', 0, aug(XY_B[:5], 1.0), 'violins', .4, k=12, sustain=1.05); pad('LAST', 0, 4.5, ['F2', 'C3'], 'cellos', .28)
key('end', HIT['end'])
chord(HIT['end'], ['C1', 'C2', 'G2', 'C3'], 5.0, .55, -.25, roll=.05); chord(HIT['end'] + .2, ['E4', 'G4', 'C5', 'E5', 'G5', 'C6'], 4.6, .45, .2, roll=.06)
pad('END', 0, 5, ['C3', 'G3'], 'cellos', .35); pad('END', 0, 5, ['E4', 'G4', 'C5'], 'violins', .32, .2); n(HIT['end'], 'C3', 1.5, .6, 0, 'timpani')
n(HIT['end'] + .1, 'C5', 4.0, .35, .1, 'clarinet'); n(HIT['end'] + .1, 'G4', 4.0, .3, .1, 'flute')

audio = S.render(EV, DUR + 1.5)
sf.write(os.path.join(HERE, 'score.wav'), audio[:int(DUR * SR)], SR, subtype='PCM_24')
json.dump({'keys': KEYS, 'notes': len(EV), 'instruments': sorted(USED)}, open(os.path.join(HERE, 'score.json'), 'w'), indent=1)
open(os.path.join(HERE, 'CREDITS_music.txt'), 'w').write('\n'.join(S.credits(sorted(USED))) + '\n')
print('score.wav', len(EV), 'notes,', len(USED), 'instruments,', round(len(audio) / SR, 2), 's')
