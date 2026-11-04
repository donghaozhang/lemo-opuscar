# 愚公移山 · original score, written to the cue map in TREATMENT.md (§7) and timeline.json
# Low strings (VSCO 2 CE), timpani, tam-tam, bass drum; woodblock / frame drum / gran cassa from VCSL when present
# (else synthesised); log drum, struck metal and the hurdy-gurdy-like folk drone synthesised here.
# Writes music/music.wav (48 kHz stereo).  Run from the library root.
import sys, os, json
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
sys.path.insert(0, ROOT); sys.path.insert(0, os.path.join(HERE, '..'))
import numpy as np, soundfile as sf
from core.audio import sampler as S
from core.audio.sfx import SR, add, lp, hp, bp, noise, env_exp, t_
import tl

S.seed(11); rng = np.random.default_rng(7)
B = tl.build(); SEC = {s['id']: s for s in B['secs']}; SH = {s['id']: s for s in B['shots']}
DUR = B['dur']; N = int(DUR * SR) + SR
mus = np.zeros((N, 2), np.float32)
EV = json.load(open(os.path.join(HERE, '..', 'events.json')))['ev']
evt = lambda typ: [e for e in EV if e['type'] == typ]

def have(name):
    try: S.load(name); return True
    except Exception: return False
HAVE_VCSL = have('woodblock')
def bt(sec, beat): s = SEC[sec]; return s['t0'] + beat * 60 / s['bpm']

# ---------------------------------------------------------------- synthesised voices
def logdrum(f=110, v=1.0):
    d = 1.0; t = t_(d)
    x = sum(a * np.sin(2 * np.pi * f * r * t * (1 - .04 * np.exp(-t * 30))) * np.exp(-t / dc) for r, a, dc in [(1, 1, .32), (2.17, .45, .13), (3.62, .2, .06)])
    x += .3 * bp(noise(d), 800, 3000) * np.exp(-t / .008)
    return (x * v * .5).astype(np.float32)
def woodblock_s(f=900, v=1.0):
    d = .25; t = t_(d)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t / .035) + .5 * np.sin(2 * np.pi * f * 2.6 * t) * np.exp(-t / .015) + .3 * hp(noise(d), 2000) * np.exp(-t / .004)
    return (x * v * .45).astype(np.float32)
def framedrum_s(v=1.0, f=85):
    d = .7; t = t_(d)
    x = np.sin(2 * np.pi * f * t * (1 + .3 * np.exp(-t * 25))) * np.exp(-t / .18) + .4 * bp(noise(d), 200, 1800) * np.exp(-t / .05)
    return (x * v * .6).astype(np.float32)
def metal(f=440, v=1.0, d=4.0, ratios=(1, 2.76, 5.40, 8.93, 13.3)):
    t = t_(d); x = np.zeros_like(t)
    for i, r in enumerate(ratios): x += (1 / (1 + i * .8)) * np.sin(2 * np.pi * f * r * t + i) * np.exp(-t / (d * .45 / (1 + i * .7))) * (1 + .15 * np.sin(2 * np.pi * (1.3 + i * .4) * t))
    x += .4 * hp(noise(d), 3000) * np.exp(-t / .006)
    return (x * v * .3).astype(np.float32)
def drone(d, f=73.42, v=1.0, fifth=True, att=1.5, rel=1.5):
    # folk drone: bowed string with a buzzing bridge — band-limited saw, formant colour, a slow rasp
    t = t_(d); x = np.zeros_like(t)
    for ff, a in [(f, 1.0), (f * 1.5 if fifth else 0, .55), (f * 2, .35)]:
        if not ff: continue
        vib = 1 + .003 * np.sin(2 * np.pi * 4.6 * t + ff)
        ph = 2 * np.pi * np.cumsum(ff * vib) / SR
        for n in range(1, 30): x += a * np.sin(n * ph) / n * (1 if n < 12 else .5)
    buzz = (1 + .35 * np.sign(np.sin(2 * np.pi * f * .5 * t)) * (np.sin(2 * np.pi * 7.3 * t) > .6))
    x = x * buzz
    x = .6 * bp(x, 180, 1600, 2) + .4 * lp(x, 500)
    env = np.minimum(1, np.minimum(t / att, (d - t) / rel).clip(0))
    return (x * env * v * .08).astype(np.float32)
CUES = []
def cue(kind, at): CUES.append({'kind': kind, 't': round(float(at), 4)})
def place(x, at, g=1.0, pan=0.0): add(mus, x, at, g, pan)
def note(inst, p, at, dur, vel=.6, g=1.0, pan=0.0, att=0, rel=None):
    kw = {'attack': att} if att else {}
    if rel is not None: kw['release'] = rel
    place(S.note(inst, p, dur, vel=vel, **kw), at, g, pan)
def hitv(inst, var, at, vel=.8, g=1.0, pan=0.0): place(S.hit(inst, var, vel), at, g, pan)
def wb(at, v=.7, pan=.3, f=900):
    if HAVE_VCSL: hitv('woodblock', None, at, v, 1.0, pan)
    else: place(woodblock_s(f, v), at, 1.0, pan)
def fd(at, v=.7, pan=-.2):
    if HAVE_VCSL: hitv('frame_drum', None, at, v, .9, pan)
    else: place(framedrum_s(v), at, 1.0, pan)

# ================================================================ A · title (0–8): knife alone, then the drone, a struck metal at the print
place(drone(4.5, 73.42, .7, att=2.5, rel=.5), 4.0)
place(metal(587.3, .8, 5), 5.5, .8, .1); cue('ding', 5.5)
note('cellos', 'D2', 5.5, 3.0, .35, .7, att=1.2, rel=.6)

# ================================================================ B · the detour (72 bpm, 24 beats): pizz walk, log drum, drone, the mountain theme
place(drone(SEC['B']['t1'] - 8.0 + .8, 73.42, .85), 8.0)
walkline = ['D2', 'A1', 'C2', 'D2', 'F2', 'E2', 'D2', 'A1', 'D2', 'A1', 'G1', 'A1', 'D2', 'F2', 'G2', 'A2', 'G2', 'F2', 'E2', 'C2', 'D2', 'A1', 'D2', 'D2']
for i, p in enumerate(walkline): note('contrabass_pizz', p, bt('B', i), .7, .62 + .08 * (i % 4 == 0), .9, -.15)
for i in range(0, 24, 2): place(logdrum(98 if i % 4 == 0 else 82, .9 if i % 4 == 0 else .6), bt('B', i), .9, -.25)
theme = [('D3', 2), ('F3', 2), ('G3', 3), ('A3', 1), ('C4', 2), ('A3', 2), ('G3', 2), ('F3', 1), ('E3', 1), ('D3', 4)]
b = 4
for p, nb in theme:
    note('cellos', p, bt('B', b), nb * 60 / 72 + .1, .5, .8, .15, att=.08, rel=.4); b += nb
for e in evt('night'): place(metal(1174.7, .35, 2.5), e['t'], .5, .4)

# ================================================================ C · decision & toil (84 bpm, 36 beats)
c0 = SEC['C']['t0']; bl = 60 / 84
place(drone(8 * bl + .6, 73.42, .55, att=.4), c0)                         # night: drone and a heartbeat on the frame drum
note('cellos', 'D2', c0, 8 * bl, .4, .8, att=.6); note('cellos', 'A2', c0 + 2 * bl, 6 * bl, .3, .5, att=.8)
for i in range(0, 8, 2): fd(bt('C', i), .45); fd(bt('C', i) + .22, .3)
osti = ['D3', 'D3', 'A2', 'D3', 'F3', 'D3', 'A2', 'C3']
for i in range(8 * 2, 36 * 2):                                           # toil: spiccato 8ths from C3
    tt = bt('C', i / 2); note('cellos_spic', osti[i % 8], tt, .3, .55 + .1 * (i % 2 == 0), .75, .1)
for i in range(8, 36):
    if i % 2 == 0: place(logdrum(98, .85), bt('C', i), .9, -.25)
    else: fd(bt('C', i), .55)
    wb(bt('C', i + .5), .35, .35)
for i in range(8, 36, 4): note('contrabass_pizz', ['D2', 'D2', 'F2', 'A2', 'D2', 'G2', 'A2'][(i // 4) % 7], bt('C', i), 1.0, .7, .9, -.1)
b = 26                                                                     # the mountain theme over the sea
for p, nb in [('A3', 2), ('G3', 2), ('F3', 2), ('E3', 1), ('D3', 3)]: note('cellos', p, bt('C', b), nb * bl + .1, .5, .7, .2, att=.06); b += nb

# ================================================================ D · seasons (96 bpm): faster ostinato, timpani on every season cut, then the hold
bl = 60 / 96
for i in range(0, 17 * 2):
    note('cellos_spic', osti[i % 8], bt('D', i / 2), .25, .6, .75, .1)
for i in range(0, 17):
    if i % 2 == 0: place(logdrum(104, .9), bt('D', i), .9, -.25)
    else: fd(bt('D', i), .6)
    wb(bt('D', i + .5), .4, .35)
for e, p in zip(evt('season_hit'), ['D3', 'A2', 'F3', 'D3']): note('timpani', p, e['t'], 1.5, .85, 1.0); cue('season_hit', e['t'])
for p, nb, b0 in [('D3', 4, 0), ('F3', 4, 4), ('A3', 4, 8), ('C4', 2, 12), ('A3', 2, 14)]: note('cellos', p, bt('D', b0), nb * bl + .05, .55, .75, .2, att=.05)
d5 = SH['D5']['t0']
note('cellos', 'D3', d5, 3.0, .45, .8, .1, att=.3, rel=1.0); note('cellos', 'A3', d5, 3.0, .4, .7, .2, att=.3, rel=1.0); note('contrabass', 'D2', d5, 3.2, .45, .8, -.2, att=.3, rel=1.0)
for e in evt('plink'): note('cellos_pizz', 'D4', e['t'], .6, .7, 1.0, .35); cue('plink', e['t'])

# ================================================================ E · mockery (88 bpm, 20 beats): a falling pizzicato joke, thinning out
bl = 60 / 88
mock = [('A3', 0), ('G3', .5), ('F3', 1), ('E3', 1.5), ('D3', 2), ('A2', 3)]
for bar in range(4):
    for p, off in mock:
        if bar >= 3 and off > 1: continue
        note('cellos_pizz', p, bt('E', bar * 4 + off), .4, .65 - bar * .1, .9, .25)
for i in range(0, 14, 2): place(logdrum(88, .6 - i * .03), bt('E', i), .8, -.3)
for i in range(0, 12): wb(bt('E', i + .5), .25, -.35, 1200)
note('contrabass_pizz', 'D2', bt('E', 16), .9, .55, .9); note('contrabass_pizz', 'A1', bt('E', 18), .9, .4, .8)

# ================================================================ F · the answer: one low string
f0 = SH['F1']['t0']
cel = S.note('cellos', 'D2', SEC['F']['t1'] - (f0 + 1.15) - .2, vel=.55, attack=2.0, release=1.2)
env = np.linspace(.55, 1.0, len(cel)) ** 1.2; env[-int(SR * .8):] *= np.linspace(1, .6, int(SR * .8))
place((cel * env).astype(np.float32), f0 + 1.15, 1.0, 0)
note('contrabass', 'D2', SH['F4']['t0'], 4.3, .4, .55, -.1, att=2.0, rel=1.0)     # a second string joins, under the last line only

# ================================================================ G · Heaven: tremolo of low strings, shimmer, a timpani roll, then silence
g2 = SH['G2']['t0']; g4 = SH['G4']['t0']
k = 0
for tt in np.arange(g2, g4 - .05, 1 / 12):
    a = .25 + .5 * ((tt - g2) / (g4 - g2))
    note('cellos_spic', 'D2' if k % 2 == 0 else 'Eb2', tt, .1, a, .7, .1); k += 1
place(metal(146.8, .35, 3.5), g2 + .5, .7, -.2)
for e in evt('fright'): cue('fright', e['t']); note('timpani', 'A2', e['t'], 1.2, .8); place(metal(415.3, .6, 2.5), e['t'], .6, .3)
g3 = SH['G3']['t0']
for i, tt in enumerate(np.arange(g3 + .3, g4 - .02, 1 / 14)): note('timpani', 'D3', tt, .12, .2 + .7 * (tt - g3) / (g4 - g3), .8, (i % 2 - .5) * .3)
place(metal(587.3, .5, 3.0), g3 + .8, .6, 0); place(metal(880.0, .4, 2.6), g3 + 1.8, .5, .3)

# ================================================================ H · the giants and the knife
h0 = SEC['H']['t0']; bl = 60 / 72
hitv('gong', 3, h0, 1.0, 1.4); cue('BOOM', h0); hitv('bass_drum', None, h0, 1.0, 1.2)
note('timpani', 'D3', h0, 2.0, 1.0, 1.1); note('contrabass', 'D2', h0, 2.6, .9, 1.0, att=0, rel=1.0); note('cellos', 'D2', h0, 2.6, .9, 1.0, att=0, rel=1.0)
for e in evt('giant_step'): cue('giant_step', e['t']); note('timpani', 'A2', e['t'], 1.0, .85, 1.0); hitv('bass_drum', None, e['t'], .8, .9)
h2 = SH['H2']['t0']
for i, p in enumerate(['D2', 'E2', 'F2', 'G2', 'A2', 'Bb2', 'C3', 'C#3']):
    note('cellos', p, h2 + i * bl * .7 + .5, bl * .75, .7 + i * .03, .9, -.1, rel=.3); note('contrabass', p, h2 + i * bl * .7 + .5, bl * .75, .65, .8, .1, rel=.3)
for e in evt('gouge'): note('timpani', 'D3', e['t'], .8, .6, .8); cue('gouge', e['t'])
h3 = SH['H3']['t0']                                                        # D major opens: the red sunrise
cue('red_dawn', h3)
for p, g in [('D2', .9), ('A2', .8)]: note('contrabass', p, h3, 4.4, .6, g, -.2, att=.6, rel=1.5)
for p, g in [('D3', .8), ('F#3', .75), ('A3', .75)]: note('cellos', p, h3, 4.4, .55, g, .1, att=.5, rel=1.5)
for p, g in [('A3', .55), ('D4', .55), ('F#4', .5)]: note('violas', p, h3 + .4, 4.0, .5, g, .3, att=.8, rel=1.5)
for f in (587.3, 740.0, 880.0): place(metal(f, .45, 4.5), h3, .45, .2)
hitv('gong', 1, h3, .45, .6)
place(drone(4.3, 73.42, .7, att=1.0, rel=.4), h3)

# ================================================================ I · finale (108 bpm): a bright dance in D major, ending in a ring
i0 = SEC['I']['t0']; bl = 60 / 108; nb = int((SH['I5']['t0'] + 2.2 - i0) / bl)
place(drone(SH['I5']['t0'] - i0 + 1.0, 73.42, .9, att=.4, rel=.8), i0)
bass = ['D2', 'A2', 'D2', 'A2', 'G2', 'D2', 'A2', 'D2']
for i in range(nb):
    if i % 2 == 0: note('contrabass_pizz', bass[(i // 2) % 8], bt('I', i), .5, .75, .9, -.15)
    if i % 4 in (0, 2): fd(bt('I', i), .75 if i % 4 == 0 else .55)
    if i % 4 == 3: fd(bt('I', i + .5), .45)
    wb(bt('I', i + .5), .35, .35)
    if i % 8 == 0: place(logdrum(110, .8), bt('I', i), .8, -.3)
melody = [('D3', 1), ('F#3', 1), ('G3', 1), ('A3', 1), ('B3', 2), ('A3', 2), ('G3', 1), ('F#3', 1), ('E3', 1), ('F#3', 1), ('A3', 4),
          ('D4', 2), ('C#4', 1), ('B3', 1), ('A3', 2), ('F#3', 2), ('G3', 1), ('A3', 1), ('F#3', 1), ('E3', 1), ('D3', 4)]
b = 4
for p, n in melody:
    if bt('I', b) > SH['I5']['t0'] - .2: break
    note('cellos', p, bt('I', b), n * bl + .05, .62, .85, .15, att=.03); b += n
end = SH['I5']['t0']
hitv('gong', 2, end, .7, .9); cue('end', end)
for f in (293.7, 440.0, 587.3, 740.0): place(metal(f, .4, 5.5), end, .4, .1)
for p in ('D2', 'A2'): note('contrabass', p, end, 4.5, .45, .7, att=.1, rel=2.0)
for p in ('D3', 'F#3', 'A3'): note('cellos', p, end, 4.0, .45, .65, .1, att=.1, rel=2.0)
for e in evt('ding'):
    if e['t'] > 100: place(metal(1174.7, .5, 4.0), e['t'], .5, .2)

# ---------------------------------------------------------------- the digital silence before the giants, and done
s0, s1 = int(SH['G4']['t0'] * SR), int(SH['H1']['t0'] * SR)
fade = int(.08 * SR); mus[s0 - fade:s0] *= np.linspace(1, 0, fade)[:, None]; mus[s0:s1] = 0
mus = S.room(mus, size=.5, mix=.16)
mus[s0:s1] = 0
pk = np.abs(mus).max(); mus = mus / max(pk, 1e-6) * .9
sf.write(os.path.join(HERE, 'music.wav'), mus[:int(DUR * SR)], SR)
json.dump(CUES, open(os.path.join(HERE, 'cues.json'), 'w'))
json.dump({'vcsl': HAVE_VCSL, 'used': ['cellos', 'cellos_spic', 'cellos_pizz', 'contrabass', 'contrabass_pizz', 'violas', 'timpani', 'gong', 'bass_drum'] + (['woodblock', 'frame_drum'] if HAVE_VCSL else [])}, open(os.path.join(HERE, 'used.json'), 'w'))
print('music.wav', round(DUR, 2), 's; vcsl', HAVE_VCSL)
