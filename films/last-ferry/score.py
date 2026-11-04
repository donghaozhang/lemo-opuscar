"""Original score for 《最后一班渡船》, written on the timeline's beat grid.
Instruments: flute (as dizi), erhu, dan_tranh (as guzheng), modelled pipa (pluck.py), violins/violas/cellos/contrabass, timpani, gran cassa,
bass drum, frame drum, glockenspiel, hand chimes, woodblock.  Usage: LIB/.venv/bin/python films/last-ferry/score.py  → out/score.wav
Sections (timeline.json): morning 72 · noon 120 · dusk 80 · night_quiet 60 (hard stop at the blow-out) · storm 100 · crossing 120 (heartbeat only
while the lantern dies) · dawn 80. Every cue below is (section, beat)."""
import os, sys, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, LIB)
from core.audio import sampler as S, pluck as P
from core.audio.sfx import SR, add, limit, lp
TL = json.load(open(os.path.join(HERE, 'timeline.json'))); DUR = TL['DUR']; SEC = {s['id']: s for s in TL['SECS']}
def bt(sec, beat): s = SEC[sec]; return s['t'] + beat * 60 / s['bpm']
def bl(sec, beats): return beats * 60 / SEC[sec]['bpm']      # beats → seconds
S.seed(7)
EV = []    # sampler events: (t, inst, pitch, dur, vel, pan[, gain])
PL = []    # pluck events: (t, preset, pitch, dur, vel, pan, kw)
def n(sec, beat, inst, pitch, beats, vel=.7, pan=0, gain=1.0, **kw):
    e = dict(t=bt(sec, beat), inst=inst, pitch=pitch, dur=bl(sec, beats), vel=vel, pan=pan, gain=gain); e.update(kw); EV.append(e)
def h(sec, beat, inst, var, vel=.7, pan=0, gain=1.0): EV.append(dict(t=bt(sec, beat), inst=inst, pitch=var, dur=None, vel=vel, pan=pan, gain=gain))
def pl(sec, beat, preset, pitch, beats, vel=.7, pan=0, **kw): PL.append((bt(sec, beat), preset, pitch, bl(sec, beats), vel, pan, kw))

# —— the theme (D pentatonic): phrases as (beat offset, pitch, length in beats) ——
THEME_A = [(0, 'A4', 1), (1, 'B4', 1), (2, 'D5', 2), (4, 'E5', 1), (5, 'D5', 1), (6, 'B4', 2), (8, 'A4', 1), (9, 'F#4', 1), (10, 'A4', 2)]
THEME_B = [(0, 'B4', 1), (1, 'A4', 1), (2, 'F#4', 2), (4, 'E4', 1), (5, 'D4', 1), (6, 'E4', 1), (7, 'F#4', 1), (8, 'D4', 4)]
def phrase(sec, b0, inst, ph, vel=.6, pan=0, scale=1.0, up=0, legato=1.05, **kw):
    for off, p, L in ph:
        pitch = S.midi(p) + up
        n(sec, b0 + off * scale, inst, pitch, L * scale * legato, vel, pan, **kw)

# ———————————————————————— morning: guzheng arpeggios, light pad, dizi from the title ————————————————————————
M = 'morning'
arp = ['D3', 'A3', 'D4', 'F#4', 'A4', 'F#4', 'D4', 'A3']
for bar in range(12):
    for k in range(3):
        b = bar * 3 + k
        if b >= 36: break
        p = arp[(bar * 3 + k) % len(arp)]
        n(M, b, 'dan_tranh', p, 1.6, .42 + .06 * (k == 0), -.25, 1.0)
        if k == 0: n(M, b + .5, 'dan_tranh', S.midi(p) + 7, 1.2, .32, -.1)
for bar, chord in [(0, ['D3', 'A3']), (4, ['B2', 'F#3']), (8, ['G3', 'D4']), (10, ['A3', 'E4'])]:
    for i, p in enumerate(chord): n(M, bar * 3, 'violins' if i else 'cellos', p, 12 if bar < 10 else 6, .28, .25 * (1 if i else -1), attack=.6)
n(M, 10, 'hand_chimes', 'D6', 4, .45, .3); n(M, 10, 'hand_chimes', 'A6', 4, .3, -.3)          # the title
phrase(M, 10, 'flute', THEME_A, .55, .15, 1.0, 12)                                            # dizi (flute an octave up)
phrase(M, 22, 'flute', THEME_B, .5, .15, 1.0, 12)
n(M, 32, 'dan_tranh', 'D5', 3, .5, .2); n(M, 32, 'dan_tranh', 'A4', 3, .4, -.2); n(M, 32, 'cellos', 'D3', 4, .3, -.2)   # the hull knocks: resolve

# ———————————————————————— noon: festive, pipa and frame drum ————————————————————————
N = 'noon'
for b in range(0, 40):
    if b % 2 == 0: h(N, b, 'frame_drum', 'large', .62 if b % 4 == 0 else .5, -.15)
    else: h(N, b, 'frame_drum', 'small', .42, .15)
    if b % 4 == 2: h(N, b + .5, 'woodblock', 'a', .4, .3)
    if b % 2 == 1: h(N, b + .5, 'frame_drum', 'small_muted', .3, .2)
    if b % 4 == 0: n(N, b, 'violins_pizz', ['D4', 'A3', 'B3', 'F#3'][(b // 4) % 4], .5, .5, .2)
    if b % 4 == 2: n(N, b, 'cellos_spic', ['D3', 'A2', 'B2', 'F#2'][(b // 4) % 4], .5, .5, -.3)
PIPA = [(0, 'D5', 1), (1, 'E5', 1), (2, 'F#5', 1), (3, 'A5', 1), (4, 'B5', 2), (6, 'A5', 1), (7, 'F#5', 1), (8, 'E5', 1), (9, 'D5', 1), (10, 'E5', 2), (12, 'F#5', 1), (13, 'E5', 1), (14, 'D5', 2)]
for b0 in (4, 20):
    for off, p, L in PIPA:
        trem = 14 if L >= 2 else None
        pl(N, b0 + off, 'pipa', p, L, .62, .25, trem=trem)
phrase(N, 12, 'flute', [(0, 'A5', 1), (1, 'B5', 1), (2, 'D6', 1), (3, 'B5', 1), (4, 'A5', 2), (6, 'F#5', 1), (7, 'A5', 1)], .5, -.2, 1.0, 0)
phrase(N, 28, 'flute', [(0, 'D6', 1), (1, 'B5', 1), (2, 'A5', 1), (3, 'F#5', 1), (4, 'A5', 2), (6, 'B5', 1), (7, 'A5', 1), (8, 'F#5', 2)], .5, -.2)
n(N, 25.5, 'glockenspiel', 'A6', 1, .4, .3); n(N, 27, 'glockenspiel', 'D7', 2, .5, -.3)      # the candy toss and landing
for b in (36, 38): n(N, b, 'violins', 'D5', 2, .35, .2); n(N, b, 'violas', 'A4', 2, .3, -.2)
n(N, 38, 'dan_tranh', 'D4', 2, .5, 0); pl(N, 38, 'pipa', 'D5', 2, .6, .2, trem=14); h(N, 38, 'frame_drum', 'large', .7)

# ———————————————————————— dusk: erhu theme, guzheng, cellos; a glockenspiel note per window ————————————————————————
D = 'dusk'
GL = ['D6', 'B5', 'A5', 'F#5', 'E5', 'D5', 'B4', 'A4']
for i, b in enumerate(range(4, 12)): n(D, b, 'glockenspiel', GL[i] if S.midi(GL[i]) >= S.midi('G5') else S.midi(GL[i]) + 12, 1.5, .4, -.4 + i * .11)
for bar in range(6):
    root = ['D3', 'B2', 'G3', 'A3', 'D3', 'D3'][bar]
    n(D, bar * 4, 'cellos', root, 4.2, .32, -.2, attack=.4); n(D, bar * 4, 'violas', S.midi(root) + 7 + 12, 4.2, .22, .2, attack=.5)
    for k in range(8): n(D, bar * 4 + k * .5, 'dan_tranh', S.midi(root) + [0, 7, 12, 16, 19, 16, 12, 7][k], .9, .34, -.3 + k * .05)
phrase(D, 2, 'erhu', THEME_A, .55, .15, 1.0, 0, 1.1)
phrase(D, 14, 'erhu', THEME_B, .5, .15, 1.0, 0, 1.1)
n(D, 19.5, 'hand_chimes', 'A5', 3, .45, .2); n(D, 19.5, 'hand_chimes', 'D6', 3, .35, -.2); n(D, 19.5, 'violins', 'A4', 4, .3, 0, attack=.3)   # the lantern is lit
n(D, 22, 'erhu', 'A4', 2, .45, .1); n(D, 23, 'erhu', 'D5', 1.2, .4, .1)

# ———————————————————————— night, quiet: pad and sparse harmonics; hard stop at the blow-out (beat 10.5) ————————————————————————
Q = 'night_quiet'
n(Q, 0, 'cellos', 'D3', 10.5, .26, -.2, attack=1.0, release=.25); n(Q, 0, 'violas', 'A3', 10.5, .2, .2, attack=1.2, release=.25); n(Q, 0, 'contrabass', 'D2', 10.5, .22, 0, attack=1.0, release=.25)
for b, p in [(2, 'A5'), (5, 'D6'), (8, 'F#5'), (9.5, 'E5')]: n(Q, b, 'dan_tranh', p, 2, .28, .3 if b % 2 else -.3)
n(Q, 4, 'erhu', 'F#4', 4, .3, .1, attack=.8, release=.3); n(Q, 8, 'erhu', 'E4', 2.5, .3, .1, release=.25)

# ———————————————————————— storm: enters on the first flash ————————————————————————
ST = 'storm'
n(ST, 1, 'timpani', 'D2', 2, .85, 0); h(ST, 1, 'gran_cassa', 'hit', .8, 0); n(ST, 1.02, 'timpani', 'A2', 2, .6, .1)
for b in range(2, 36):
    for k in range(2): n(ST, b + k * .5, 'cellos_spic', ['D3', 'D3', 'A2', 'D3'][(b * 2 + k) % 4], .45, .5 + .1 * (k == 0), -.3)
    if b % 4 == 0: n(ST, b, 'contrabass', 'D2', 4, .35, 0, attack=.1)
n(ST, 2, 'violins_trem', 'A3', 34, .3, .2, attack=1.0); n(ST, 2, 'violins_trem', 'D4', 34, .25, -.2, attack=1.5)
n(ST, 6, 'violas', 'F4', 6, .3, .1, attack=.6)
for b, k in [(9, .7), (21, .9)]: n(ST, b, 'timpani', 'G2', 1.5, k, 0); h(ST, b, 'gran_cassa', 'hit', k * .8, 0)   # flashes
for b0, pan in [(12.5, .2), (16.5, .2)]: n(ST, b0, 'erhu', 'A4', 1.5, .5, pan); n(ST, b0 + 1.5, 'erhu', 'G4', 2.5, .48, pan)   # the erhu cries under the ask
n(ST, 24, 'erhu', 'D5', 2, .5, .1); n(ST, 26, 'erhu', 'C5', 2, .45, .1); n(ST, 28, 'erhu', 'A4', 3, .45, .1)
for b in range(29, 33): h(ST, b, 'frame_drum', 'large', .55, -.1)
# the decision chord on the relight (beat 33.5) rings into the crossing
for inst, p, vel, pan in [('violins', 'D5', .55, .2), ('violas', 'A4', .45, -.2), ('cellos', 'D3', .5, -.1), ('erhu', 'A4', .55, .15)]: n(ST, 33.5, inst, p, 4, vel, pan, attack=.05)
n(ST, 33.5, 'dan_tranh', 'D4', 3, .6, 0); n(ST, 33.6, 'dan_tranh', 'A4', 3, .55, .1); n(ST, 33.7, 'dan_tranh', 'D5', 3, .5, .2); n(ST, 33.5, 'hand_chimes', 'D6', 3, .5, -.2)
n(ST, 33.5, 'timpani', 'D2', 2, .7, 0)

# ———————————————————————— the crossing ————————————————————————
CR = 'crossing'
for b in range(0, 17):
    for k in range(2): n(CR, b + k * .5, 'cellos_spic', ['D3', 'A2', 'D3', 'E3'][(b * 2 + k) % 4], .45, .62 if k == 0 else .5, -.3)
    if b % 2 == 0: h(CR, b, 'frame_drum', 'large', .6, -.1)
    if b % 8 == 0: n(CR, b, 'timpani', 'D2', 1.5, .8, 0)
    if b % 8 == 4: n(CR, b, 'timpani', 'A2', 1, .6, 0)
n(CR, 0, 'violins_trem', 'D5', 17, .35, .2, attack=.3); n(CR, 0, 'violins_trem', 'A4', 17, .3, -.2, attack=.3); n(CR, 0, 'contrabass', 'D2', 16, .4, 0)
URG = [(0, 'A4', 1), (1, 'B4', 1), (2, 'D5', 1), (3, 'E5', 1), (4, 'D5', 2), (6, 'B4', 1), (7, 'A4', 1), (8, 'F#4', 2), (10, 'A4', 1), (11, 'B4', 1), (12, 'A4', 2), (14, 'E5', 2)]
phrase(CR, 1, 'erhu', URG, .6, .15, 1.0, 0, 1.0); phrase(CR, 1, 'flute', URG, .45, -.15, 1.0, 12, 1.0)
h(CR, 3, 'gran_cassa', 'hit', .8, 0)                                    # flash 4
# the lantern gutters: everything thins to the heartbeat (bass drum, soft) at beats 20, 22, 24
for b in (17, 18, 19): n(CR, b, 'violas', 'A3', 1, .3 - (b - 17) * .08, 0)
for b in (20, 22, 24): h(CR, b, 'bass_drum', None, .42, 0); h(CR, b + .3, 'bass_drum', None, .3, 0)
h(CR, 19, 'gran_cassa', 'hit', .5, 0)
# the light revives: strings return (beat 27), the theme tender; the door (beat 32) a warm chord; silence from beat 37
n(CR, 27, 'violins', 'D5', 10, .4, .2, attack=.8); n(CR, 27, 'violas', 'F#4', 10, .35, -.2, attack=.8); n(CR, 27, 'cellos', 'D3', 10, .38, -.1, attack=.6)
phrase(CR, 28, 'erhu', [(0, 'A4', 1), (1, 'B4', 1), (2, 'D5', 2), (4, 'E5', 2), (6, 'D5', 2)], .5, .1, 1.0, 0, 1.1)
for i, p in enumerate(['D5', 'A5', 'D6', 'F#6']): n(CR, 32 + i * .12, 'dan_tranh', p, 5, .5, -.3 + i * .2)
n(CR, 32, 'hand_chimes', 'D6', 5, .5, .2); n(CR, 32, 'hand_chimes', 'A6', 5, .35, -.2); n(CR, 32, 'flute', 'A5', 4.8, .4, 0, attack=.4, release=.6)
n(CR, 34, 'erhu', 'F#5', 3, .4, .1, release=.8)

# ———————————————————————— dawn: the theme warm, release ————————————————————————
DW = 'dawn'
for bar in range(8):
    root = ['D3', 'D3', 'G3', 'A3', 'B2', 'G3', 'A3', 'D3'][bar]
    n(DW, bar * 4, 'cellos', root, 4.2, .32, -.2, attack=.5); n(DW, bar * 4, 'violas', S.midi(root) + 7 + 12, 4.2, .26, .2, attack=.6); n(DW, bar * 4, 'violins', S.midi(root) + 16 + 12, 4.2, .22, .1, attack=.8)
    for k in range(8): n(DW, bar * 4 + k * .5, 'dan_tranh', S.midi(root) + [0, 7, 12, 16, 19, 16, 12, 7][k] + 12, .9, .32, -.3 + k * .06)
phrase(DW, 1, 'flute', THEME_A, .5, .15, 1.0, 12, 1.1); phrase(DW, 13, 'flute', THEME_B, .45, .15, 1.0, 12, 1.1)
n(DW, 6, 'hand_chimes', 'D6', 3, .45, .2); n(DW, 6, 'hand_chimes', 'A6', 3, .3, -.2)           # the ribbon
n(DW, 6, 'glockenspiel', 'D7', 2, .35, .3)
phrase(DW, 18, 'erhu', [(0, 'A4', 1), (1, 'B4', 1), (2, 'D5', 2), (4, 'E5', 1), (5, 'D5', 1), (6, 'B4', 2), (8, 'A4', 4)], .45, .15, 1.0, 0, 1.1)   # the gift
n(DW, 27, 'hand_chimes', 'A5', 4, .4, 0)                                                        # the boat on the water
phrase(DW, 27, 'flute', [(0, 'F#5', 1), (1, 'A5', 1), (2, 'B5', 2), (4, 'A5', 4)], .45, .1, 1.0, 0, 1.0)
for inst, p, vel, pan in [('violins', 'D5', .35, .2), ('violas', 'A4', .3, -.2), ('cellos', 'D3', .32, -.1), ('violins', 'F#5', .25, 0), ('contrabass', 'D2', .22, 0)]: n(DW, 31, inst, p, bl(DW, 1) and (DUR - bt(DW, 31)) / bl(DW, 1), vel, pan, attack=.4, release=1.5)
n(DW, 31, 'dan_tranh', 'D4', 6, .45, -.1); n(DW, 31.15, 'dan_tranh', 'A4', 6, .4, .1); n(DW, 31.3, 'dan_tranh', 'D5', 6, .35, .2)

# ———————————————————————— render ————————————————————————
ev = [dict(e) for e in EV]
for e in ev:
    if e['dur'] is None: e.pop('dur'); e['pitch'] = e['pitch']
mix = S.render([dict(t=e['t'], inst=e['inst'], pitch=e.get('pitch'), dur=e.get('dur'), vel=e['vel'], pan=e['pan'], gain=e.get('gain', 1.0), **{k: e[k] for k in ('attack', 'release') if k in e}) for e in ev], dur=DUR + 3, master=False)
for (t, preset, pitch, dur, vel, pan, kw) in PL:
    x = P.pluck(preset, pitch, dur, vel, **kw); add(mix, x, t, .9, pan)
# section dynamics: the storm and crossing louder, the quiet night softer (a gain curve on the beat grid)
tt = np.arange(len(mix)) / SR
G = np.interp(tt, [0, 29.5, 30, 50, 68, 78.5, 81, 102, 102.6, 112.3, 112.6, 115.6, 116.1, 121.1, 124.6, 148, 153], [.85, .85, 1.0, .95, .8, .8, 1.05, 1.1, 1.15, 1.1, .9, .9, 1.0, 1.0, .9, .9, 0])
mix *= G[:, None]
# the hard stop at the blow-out (78.5): a 120 ms fade, then nothing until the first flash
s0, s1 = int(78.5 * SR), int(78.62 * SR); mix[s0:s1] *= np.linspace(1, 0, s1 - s0)[:, None]; mix[s1:int(81.55 * SR)] = 0
# silence 2 from 121.1 (a 700 ms fade)
s0, s1 = int(121.1 * SR), int(121.8 * SR); mix[s0:s1] *= np.linspace(1, 0, s1 - s0)[:, None]; mix[s1:int(124.6 * SR)] = 0
mix = S.room(mix, size=.42, mix=.14)
mix = mix[:int(DUR * SR)]
for ch in range(2): mix[:, ch] = limit(mix[:, ch], .9)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'score.wav'), mix.astype(np.float32), SR, subtype='FLOAT')
# cue list for the check and the treatment
cues = sorted(set([round(e['t'], 3) for e in EV] + [round(p[0], 3) for p in PL]))
json.dump({'n_events': len(EV) + len(PL), 'first_cues': cues[:12]}, open(os.path.join(HERE, 'out', 'score_cues.json'), 'w'))
rms = 20 * np.log10(np.sqrt(np.mean(mix ** 2)) + 1e-9); print('score.wav', DUR, 's  events', len(EV) + len(PL), ' rms %.1f dB' % rms, ' peak %.2f' % np.abs(mix).max())
print('\n'.join(S.credits(sorted(set(e['inst'] for e in EV)))))
