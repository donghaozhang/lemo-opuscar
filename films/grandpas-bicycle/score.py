# The score: an original acoustic cue sheet written on the film's grid (timeline.json), rendered with the library's
# sampled instruments (core/audio/sampler.py). Usage, from the library root: .venv/bin/python films/grandpas-bicycle/score.py
# Writes out/score.wav (48 kHz stereo) and out/score_cues.json (the musical hits, for cuecheck.py).
import json, os, sys, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR, add, lp
TL = json.load(open(os.path.join(HERE, 'timeline.json')))
SEC = {s['id']: s for s in TL['secs']}; HT = TL['hits']; DUR = TL['dur']
def B(sec, bar, beat=0.0): s = SEC[sec]; return s['t'] + (bar * s['beats'] + beat) * s['beat']
def beat(sec): return SEC[sec]['beat']
S.seed(5)
EV = []   # (t, inst, pitch, dur, vel, pan)
CUES = {} # musical hits by name → time (what cuecheck compares with the picture)
def n(t, inst, pitch, dur, vel, pan=0.0, **kw): EV.append(dict(t=float(t), inst=inst, pitch=pitch, dur=float(dur), vel=float(vel), pan=float(pan), **kw))
# chord tones (D major family and friends), as midi-ish names
CH = { 'D': ['D', 'F#', 'A'], 'G': ['G', 'B', 'D'], 'A': ['A', 'C#', 'E'], 'Bm': ['B', 'D', 'F#'], 'Em': ['E', 'G', 'B'], 'C': ['C', 'E', 'G'], 'F#m': ['F#', 'A', 'C#'], 'Am': ['A', 'C', 'E'], 'A7': ['A', 'C#', 'G'] }
def tones(ch, octv):  # root, third, fifth in a given octave, the root the lowest
    r, t3, t5 = CH[ch]; order = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    def up(p, base): o = octv if order.index(p) >= order.index(base) else octv + 1; return f'{p}{o}'
    return [f'{r}{octv}', up(t3, r), up(t5, r)]

# ---- guitar patterns ----
def waltz_bar(t0, ch, bt, vel=.5, pan=-.25):
    r, t3, t5 = tones(ch, 2); hi = tones(ch, 3)
    n(t0, 'guitar_nylon', r, bt * 2.6, vel, pan)
    n(t0 + bt, 'guitar_nylon', hi[1], bt * 1.4, vel * .72, pan + .1); n(t0 + bt + .02, 'guitar_nylon', hi[2], bt * 1.4, vel * .66, pan + .15)
    n(t0 + 2 * bt, 'guitar_nylon', hi[0], bt * 1.3, vel * .7, pan + .05); n(t0 + 2 * bt + .02, 'guitar_nylon', hi[1], bt * 1.3, vel * .62, pan + .12)
def pick_bar(t0, ch, bt, vel=.5, pan=-.25, light=False):   # 4/4 fingerpicking: bass, 5th, 3rd, root', 5th, 3rd, bass, 5th
    r, t3, t5 = tones(ch, 2); hi = tones(ch, 3)
    pat = [(0, r, 1.0), (.5, hi[2], .6), (1, hi[1], .62), (1.5, hi[0], .66), (2, hi[2], .6), (2.5, hi[1], .58), (3, t5, .9), (3.5, hi[1], .55)]
    for k, (b, p, g) in enumerate(pat):
        if light and k % 2: continue
        n(t0 + b * bt, 'guitar_nylon', p, bt * (2.2 if g > .8 else 1.1), vel * g, pan + (.1 if k % 2 else 0))
def piano_bar(t0, ch, bt, vel=.36, pan=.1, octv=3):   # a soft arpeggio: root, fifth, third above, root above
    r, t3, t5 = tones(ch, octv); hi = tones(ch, octv + 1)
    for b, p, g in [(0, r, 1), (.5, t5, .75), (1, hi[1], .8), (1.5, hi[0], .7), (2, t5, .72), (2.5, hi[1], .78), (3, hi[2], .7), (3.5, hi[0], .66)]:
        n(t0 + b * bt, 'piano', p, bt * 2.2, vel * g, pan)
def mel(sec, inst, notes, vel=.55, pan=.2, legato=1.02, oct_shift=0):
    bt = beat(sec)
    for bar, b, p, L in notes:
        if p is None: continue
        pp = p if oct_shift == 0 else p[:-1] + str(int(p[-1]) + oct_shift)
        n(B(sec, bar, b), inst, pp, L * bt * legato, vel, pan)
def strings_long(t0, dur, pitches, vel=.32, pan=0.0, attack=.9):
    for i, (inst, p) in enumerate(pitches): n(t0, inst, p, dur, vel, pan + (i - 1) * .18, attack=attack)

# ======== bell (0–3): nothing but the bell ========
# ======== plate (3–11): guitar alone, a glockenspiel on the title ========
bt = beat('plate')
for bar, ch in enumerate(['D', 'G', 'A', 'D']): pick_bar(B('plate', bar), ch, bt, vel=.5)
n(3.62, 'glockenspiel', 'A5', 1.4, .42, .35); n(3.62 + bt, 'glockenspiel', 'D6', 2.4, .4, .4)
CUES['title'] = 3.62

# ======== summer (11–48.14): a waltz, D major ========
bt = beat('summer')
prog = ['D', 'D', 'G', 'A', 'D', 'Bm', 'G', 'A', 'D', 'D', 'G', 'A', 'D', 'Bm', 'Em', 'A', 'D', 'G', 'A', 'D', 'Bm', 'G', 'A', 'D', 'D', 'D']
for bar, ch in enumerate(prog):
    soft = .36 if 12 <= bar < 16 else .5   # under 「我扶着呢」 the guitar steps back
    waltz_bar(B('summer', bar), ch, bt, vel=soft)
# the clarinet tune (pauses through the three falls, a low held note under the close two-shot)
tune = [(2, 0, 'A4', 2), (2, 2, 'B4', 1), (3, 0, 'D5', 2), (3, 2, 'C#5', 1), (4, 0, 'B4', 2), (4, 2, 'A4', 1), (5, 0, 'F#4', 3), (6, 0, 'G4', 2), (6, 2, 'A4', 1),
        (10, 0, 'A4', 3), (11, 0, 'G4', 2), (11, 2, 'F#4', 1), (12, 0, 'E4', 3), (13, 0, 'D4', 9),
        (16, 1, 'A4', 2), (17, 0, 'B4', 1), (17, 1, 'D5', 2), (18, 0, 'E5', 1), (18, 1, 'F#5', 2), (19, 0, 'F#5', 3), (20, 0, 'E5', 2), (20, 2, 'D5', 1), (21, 0, 'B4', 2), (21, 2, 'A4', 1), (22, 0, 'D5', 3), (23, 0, 'A4', 3), (24, 0, 'D5', 6)]
mel('summer', 'clarinet', tune, vel=.5, pan=.25)
# glockenspiel: the three falls, descending; a sparkle when she looks back
for name, p in [('fall1', 'A5'), ('fall2', 'F#5'), ('fall3', 'D5')]: n(HT[name], 'glockenspiel', p, 1.6, .5, .3); CUES[name] = HT[name]
n(B('summer', 23, 1), 'glockenspiel', 'A5', 1.5, .34, .4); n(B('summer', 23, 2), 'glockenspiel', 'D6', 2.5, .34, .45)
# strings from the dolly: a bed that swells at the look-back and holds under the mist
for bar, (c, v) in enumerate([('D3', 'F#4'), ('G3', 'G4'), ('A3', 'A4'), ('D3', 'F#4'), ('G3', 'G4'), ('A3', 'A4')]):
    t0 = B('summer', 16 + bar * 2); strings_long(t0, bt * 6.2, [('cellos', c), ('violas', v)], vel=.28 + .02 * bar, attack=.8)
strings_long(B('summer', 22), bt * 3 * 4.3, [('cellos', 'D3'), ('violas', 'A3'), ('violins', 'F#4'), ('violins', 'D5')], vel=.36, attack=1.0)
CUES['letGo'] = HT['letGo']; n(HT['letGo'], 'violins', 'A4', bt * 6, .3, .2, attack=.6)

# ======== school (48.14–64.14): G major, brisk, a flute ========
bt = beat('school')
for bar, ch in enumerate(['G', 'C', 'G', 'D', 'G', 'C', 'D', 'G']): pick_bar(B('school', bar), ch, bt, vel=.5 if bar < 6 else .38, light=bar >= 6)
flute = [(1, 0, 'D5', 1), (1, 1, 'E5', 1), (1, 2, 'G5', 2), (2, 0, 'A5', 1), (2, 1, 'G5', 1), (2, 2, 'E5', 2), (3, 0, 'D5', 2), (3, 2, 'B4', 2), (4, 0, 'G4', 4), (5, 0, 'A4', 2), (5, 2, 'B4', 2), (6, 0, 'D5', 2), (6, 2, 'B4', 2), (7, 0, 'G4', 4)]
mel('school', 'flute', flute, vel=.48, pan=.25)
n(HT['dingSchool'], 'glockenspiel', 'G6', 1.4, .42, .35); n(HT['dingSchool'] + bt * .5, 'glockenspiel', 'B6', 1.8, .36, .4); CUES['dingSchool'] = HT['dingSchool']
strings_long(B('school', 4), bt * 4 * 3.6, [('cellos', 'G3'), ('violas', 'D4')], vel=.25, attack=1.0)

# ======== leaving (64.14–79.14): E minor, an oboe, cellos ========
bt = beat('leaving')
for bar, ch in enumerate(['Em', 'C', 'G', 'D', 'Em', 'C']): pick_bar(B('leaving', bar), ch, bt, vel=.44, light=True)
oboe = [(1, 0, 'B4', 2), (1, 2, 'G4', 2), (2, 0, 'F#4', 3), (2, 3, 'E4', 1), (3, 0, 'G4', 2), (3, 2, 'A4', 2), (4, 0, 'B4', 4), (5, 0, 'A4', 2), (5, 2, 'G4', 2)]
mel('leaving', 'oboe', oboe, vel=.42, pan=.2)
for bar, (c, v) in enumerate([('E3', 'B3'), ('C3', 'G3'), ('G3', 'D4'), ('D3', 'A3'), ('E3', 'B3'), ('C3', 'G3')]): strings_long(B('leaving', bar), bt * 4.3, [('cellos', c), ('violas', v)], vel=.27, attack=.7)
n(B('leaving', 5, 3), 'cellos', 'E3', bt * 6, .3, -.2, attack=.8)   # a last long cello note under the mist

# ======== winter (79.14–97.14): near silence; a pad under the floor; one piano note, then one more ========
bt = beat('winter')
strings_long(B('winter', 0, 1), 13.5, [('violas', 'E3'), ('violas', 'B3')], vel=.14, attack=2.5)
n(HT['pianoOne'], 'piano', 'E4', 3.2, .34, .05); n(HT['pianoTwo'], 'piano', 'B3', 3.4, .3, -.05)
CUES['pianoOne'] = HT['pianoOne']; CUES['pianoTwo'] = HT['pianoTwo']

# ======== spring (97.14–115.71): D major, warm; the summer tune returns slower; strings swell into the ride ========
bt = beat('spring')
sprog = ['D', 'G', 'A', 'D', 'Bm', 'G', 'A']
for bar, ch in enumerate(sprog):
    if bar >= 6.5: break
    piano_bar(B('spring', bar), ch, bt, vel=.34)
    if bar >= 1: pick_bar(B('spring', bar), ch, bt, vel=.36, light=True)
reprise = [(1, 0, 'A4', 2), (1, 2, 'B4', 1), (1, 3, 'D5', 1), (2, 0, 'C#5', 2), (2, 2, 'B4', 1), (2, 3, 'A4', 1), (3, 0, 'F#4', 4), (4, 0, 'G4', 2), (4, 2, 'A4', 1), (4, 3, 'B4', 1), (5, 0, 'D5', 4), (6, 0, 'A4', 2)]
mel('spring', 'clarinet', reprise, vel=.44, pan=.25)
for bar, (c, v, vi) in enumerate([('D3', 'A3', 'F#4'), ('G3', 'B3', 'G4'), ('A3', 'C#4', 'A4'), ('D3', 'A3', 'F#4'), ('B2', 'F#3', 'D4'), ('G3', 'B3', 'G4')]):
    strings_long(B('spring', bar), bt * 4.3, [('cellos', c), ('violas', v), ('violins', vi)], vel=.18 + .05 * min(bar, 4), attack=.8)
n(HT['dingSpring'], 'glockenspiel', 'A5', 1.4, .38, .35); n(HT['dingSpring'] + bt * .5, 'glockenspiel', 'D6', 2.0, .34, .4); CUES['dingSpring'] = HT['dingSpring']
CUES['dollyTwo'] = HT['dollyTwo']; strings_long(HT['dollyTwo'], bt * 4 * 2.5, [('violins', 'A4'), ('violins', 'D5')], vel=.3, pan=.1, attack=.5)

# ======== holding (115.71–124.29): the felt piano alone ========
bt = beat('holding')
CUES['holding'] = HT['holding']
hold = [(0, 0, 'A4', 2), (0, 2, 'B4', 2), (1, 0, 'D5', 2), (2, 0, 'F#4', 3)]
for bar, b, p, L in hold: n(B('holding', bar, b), 'piano', p, L * bt * 1.1, .33, .05)
for b, p in [(0, 'D3'), (0, 'A3')]: n(B('holding', 0), 'piano', p, bt * 4.2, .26, -.1)
for p, v in [('D3', .28), ('A3', .26), ('F#4', .3)]: n(HT['lineTwo'], 'piano', p, bt * 5, v, 0.0)
CUES['lineTwo'] = HT['lineTwo']

# ======== lane (124.29–134.29): everything back, resolving to D; the last chord rings out ========
bt = beat('lane')
for bar, ch in enumerate(['G', 'A']): piano_bar(B('lane', bar), ch, bt, vel=.34); pick_bar(B('lane', bar), ch, bt, vel=.4, light=True)
strings_long(B('lane', 0), bt * 8, [('cellos', 'G3'), ('violas', 'B3'), ('violins', 'D5')], vel=.26, attack=.7)
mel('lane', 'clarinet', [(0, 0, 'B4', 2), (0, 2, 'A4', 2), (1, 0, 'G4', 2), (1, 2, 'E4', 2)], vel=.4, pan=.25)
tc = HT['lastChord']; CUES['lastChord'] = tc
for p, v, pan in [('D2', .5, -.3), ('A2', .45, -.2), ('D3', .4, -.1), ('F#3', .4, 0), ('A3', .38, .1), ('D4', .36, .2), ('F#4', .34, .3)]: n(tc, 'piano', p, 6.0, v, pan)
for i, p in enumerate(['D2', 'A2', 'D3', 'F#3', 'A3', 'D4']): n(tc + i * .03, 'guitar_nylon', p, 5.5, .5, -.25 + i * .08)
strings_long(tc, 6.0, [('cellos', 'D3'), ('violas', 'A3'), ('violins', 'F#4'), ('violins', 'D5')], vel=.3, attack=.3)
n(tc + bt * .5, 'glockenspiel', 'A5', 2.0, .36, .35); n(tc + bt * 1.5, 'glockenspiel', 'D6', 4.0, .34, .4)

# ---- render ----
print('events', len(EV))
mix = S.render(EV, dur=DUR, master=False)
# a felt-piano character: a gentle lowpass on the piano stem only
pev = [e for e in EV if e['inst'] == 'piano']; rest = [e for e in EV if e['inst'] != 'piano']
piano = S.render(pev, dur=DUR, master=False); piano = np.stack([lp(piano[:, 0], 2600), lp(piano[:, 1], 2600)], 1).astype(np.float32)
mix = S.render(rest, dur=DUR, master=False) + piano * 1.15
mix = S.room(mix, size=.42, mix=.16)
pk = np.abs(mix).max(); mix = mix / max(pk, 1e-9) * .7
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'score.wav'), mix.astype(np.float32), SR, subtype='FLOAT')
json.dump(CUES, open(os.path.join(HERE, 'out', 'score_cues.json'), 'w'), indent=1)
rms = 20 * np.log10(np.sqrt(np.mean(mix ** 2)) + 1e-9)
print('score.wav', round(len(mix) / SR, 2), 's, rms', round(rms, 1), 'dBFS, peak', round(20 * np.log10(np.abs(mix).max()), 1))
print('\n'.join(S.credits(['guitar_nylon', 'clarinet', 'flute', 'oboe', 'cellos', 'violas', 'violins', 'piano', 'glockenspiel'])))
