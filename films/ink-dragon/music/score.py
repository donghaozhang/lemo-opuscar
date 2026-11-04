"""Original score for 《墨龙借雨》 (132 s), written from timeline.json.
Guqin = core/audio/pluck.py (open strings, stopped notes with slides, 吟猱 vibrato, harmonics, tremolo, sweeps); xiao = sampled flute, low register,
low-passed with breath noise; bass drum, gran cassa, timpani, frame drum, woodblock, claves, small gong, tam-tam from the CC0 sample libraries.
A 羽 (A C D E G) for the night and the drought, D 宫 (D E F# A B) for the rain and the dance, back to 羽 resolving on D for the dawn.
Run from the library root: .venv/bin/python films/ink-dragon/music/score.py → music/score.wav, music/stems/*.wav, music/score.json"""
import sys, os, json
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '../../..'))
sys.path.insert(0, LIB)
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
from core.audio import sampler as S, pluck as P
from core.audio.sfx import SR, add

TL = json.load(open(os.path.join(HERE, '..', 'timeline.json')))
HIT, SHOT = TL['hit'], TL['shot']
DUR = TL['dur']; N = int(DUR * SR)
S.seed(7); np.random.seed(7)
st = {k: np.zeros((N, 2), np.float32) for k in ('guqin', 'xiao', 'drums')}
marks = {}
def mark(k, t): marks[k] = round(float(t), 4)

def G(t, pitch, dur=None, vel=.7, pan=0., gain=1., **kw):
    add(st['guqin'], P.pluck('guqin', pitch, dur, vel, **kw), t, gain, pan)
def H(t, pitch, vel=.55, pan=0., gain=1., dur=1.4, **kw):
    G(t, pitch, dur, vel, pan, gain, harmonic=True, **kw)
rng = np.random.default_rng(11)
def xiao(t, pitch, dur, vel=.55, pan=-.15, gain=1., att=.5):
    x = S.note('flute', pitch, dur, vel, release=.6, attack=att).astype(np.float64)
    x = sosfilt(butter(2, 2600, 'low', fs=SR, output='sos'), x)
    env = np.abs(x); env = np.convolve(env, np.ones(960) / 960, 'same')
    nz = sosfilt(butter(2, [800, 3000], 'band', fs=SR, output='sos'), rng.standard_normal(len(x)))
    add(st['xiao'], (x + nz * env * 1.6).astype(np.float32), t, gain, pan)
def D(t, inst, var, vel=.8, gain=1., pan=0., dur=None, env=None):
    x = S.hit(inst, var, vel, dur).astype(np.float64)
    if env is not None: x = x[:len(env)] * env[:len(x)]
    add(st['drums'], x.astype(np.float32), t, gain, pan)
def beat(sec, b):
    s = next(x for x in TL['secs'] if x['id'] == sec); return s['t'] + b * 60 / s['bpm']

# ================= 夜 night 0–30: free =================
xiao(1.2, 'A3', 3.0, .38, -.2, .7, att=1.4)
mark('dropLand', HIT['dropLand']); G(HIT['dropLand'], 'D2', None, .85, 0, 1.2)
G(HIT['tailCurl'], 'C3', 1.4, .5, .1, .9, bend=[(0, 0), (.3, 0), (1.0, 2)]); mark('tailCurl', HIT['tailCurl'])
G(HIT['headLift'], 'E3', 1.2, .55, -.1, .9, vib=(4.5, .2, .4)); mark('headLift', HIT['headLift'])
H(HIT['eyeOpen'], 'A5', .62, .1, 1.1, dur=2.2, release=1.0); mark('eyeOpen', HIT['eyeOpen'])
for i, p in enumerate(['G3', 'A3', 'G3', 'A3', 'G3']): G(HIT['shake'] + i * .11, p, .14, .42, (i % 2 - .5) * .3, .7, pos=.1)
mark('shake', HIT['shake'])
G(HIT['stretch'], 'D3', 2.0, .5, 0, .9, bend=[(0, 0), (.4, 0), (1.6, 2)]); mark('stretch', HIT['stretch'])
H(HIT['sneeze'], 'E6', .5, .2, .9, dur=.4, release=.3); mark('sneeze', HIT['sneeze'])
G(12.2, 'C4', .7, .45, .1, .8); G(12.7, 'A3', .9, .45, -.1, .8, vib=(4.5, .15, .3))
# the walk: a curious phrase that stops dead at the snort
for tt, p in [(13.5, 'A3'), (14.3, 'C4'), (15.0, 'D4'), (15.8, 'E4')]: G(tt, p, .5, .55, 0, .85, pos=.12)
G(HIT['snort'] + 1.1, 'D4', .4, .5, 0, .8, pos=.12); G(HIT['snort'] + 1.55, 'C4', .5, .45, 0, .8, pos=.12)
# the drought: the xiao sings, the low strings sink
for t0, p, d, g in [(19.5, 'E4', 2.0, .6), (21.5, 'D4', 1.5, .58), (23.0, 'C4', 1.5, .58), (24.5, 'A3', 1.4, .6)]: xiao(t0, p, d, .5, -.2, g, att=.4)
G(20.0, 'A2', 2.2, .5, .1, .9); G(22.5, 'G2', 2.0, .5, -.1, .9, bend=[(0, 0), (.6, 0), (1.8, -2)])
mark('cutIncense', 25.0); G(25.0, 'C3', .35, .55, .2, .8, pos=.1)
H(HIT['ashFlake1'], 'C6', .4, .2, .7, dur=.5, release=.4)
# tension: a tremolo rising to the dive
nr = int((HIT['dive'] - 27.0) * SR); ramp = (np.linspace(0, 1, nr) ** 1.6) * .9 + .1
tr = P.pluck('guqin', 'A3', HIT['dive'] - 27.0, .5, trem=11).astype(np.float64)
tr[:len(ramp)] *= ramp[:len(tr)]; add(st['guqin'], tr.astype(np.float32), 27.0, .8, 0)
mark('dive', HIT['dive'])
add(st['guqin'], P.strum('guqin', ['C2', 'D2', 'F2', 'G2', 'A2', 'C3', 'D3'], 2.2, .85, spread=.014), HIT['dive'], 1.2, 0)
D(HIT['dive'], 'bass_drum', None, .45, .6)
for i, p in enumerate(['A5', 'E6', 'A6']): H(30.0 + i * .15, p, .5, (i - 1) * .3, .8, dur=1.6, release=.8)
mark('ripple', 30.0)

# ================= 入画 into the painting 30–50 @72 =================
b = 60 / 72
# pulse: frame drum light on beats 1 and 3; guqin figure with a slide into each bar
for k in range(24):
    t0 = beat('into', k)
    if k % 2 == 0: D(t0, 'frame_drum', 'small_muted', .4 if k % 4 == 0 else .3, .55, .1)
    if k % 4 == 0 and t0 < 44: G(t0, 'A3' if k % 8 == 0 else 'G3', .7, .5, .1, .8, bend=[(0, -2), (.2, 0)])
    if k % 4 == 2 and t0 < 44: G(t0, 'C4', .4, .42, -.1, .7, pos=.12); G(t0 + b / 2, 'D4', .4, .4, .1, .7, pos=.12)
mel = [(1.67, 'E4', 1.6), (3.33, 'G4', .8), (4.17, 'A4', 1.6), (5.83, 'G4', .8), (6.67, 'E4', 1.6), (8.33, 'D4', 1.6), (10.0, 'C4', .8), (10.83, 'D4', .8), (11.67, 'E4', 2.0)]
for off, p, d in mel: xiao(30.0 + off * b, p, d * b, .5, -.2, .62, att=.25)
mark('riverCut', SHOT['s08']); G(SHOT['s08'], 'D3', 1.2, .55, 0, .9, bend=[(0, 0), (.3, 0), (1.0, -2)])
mark('boat', HIT['boat']); H(HIT['boat'], 'E5', .5, .1, .8, dur=1.2)
# the cliff: the low drum enters and grows, the xiao climbs
mark('cliff', SHOT['s09'])
for k in range(17, 24):
    t0 = beat('into', k)
    if (k - 17) % 2 == 0: D(t0, 'bass_drum', None, .3 + .08 * (k - 17), .6 + .05 * (k - 17), 0)
D(HIT['cliffDrum'], 'timpani', 'drum1', .85, .9); mark('cliffDrum', HIT['cliffDrum'])
G(HIT['cliffDrum'], 'C2', 2.4, .75, 0, 1.0)
for off, p, d in [(0, 'G4', .8), (.83, 'A4', .8), (1.67, 'C5', .8), (2.5, 'D5', 2.4)]: xiao(SHOT['s09'] + off, p, d, .55, -.15, .7, att=.2)
# the cloud's snore, rhymed on the guqin: a low slide down
mark('snoreJ', HIT['snoreJ']); G(HIT['snoreJ'], 'D3', 1.0, .6, .2, .9, bend=[(0, 0), (.2, 0), (.9, -2)], pos=.1)

# ================= 云 the cloud 50–75 @96 =================
b = 60 / 96
mark('cutIncense2', 50.0); G(50.0, 'C3', .35, .5, .2, .8, pos=.1)
G(HIT['snore2'], 'D3', 1.0, .45, .2, .8, bend=[(0, 0), (.2, 0), (.9, -2)])
# comic pulse from the summit: woodblock on 2 and 4 (soft), bouncy plucks, pausing for each gag
def bounce(t0, t1, vel=.45):
    k = 0; t = t0
    while t < t1 - .01:
        if k % 2 == 1: D(t, 'woodblock', 'a' if k % 4 == 1 else 'b', .35, .4, .2)
        if k % 4 == 0: G(t, 'A3', .3, vel, -.1, .75, pos=.1)
        if k % 4 == 2: G(t, 'C4', .25, vel * .9, .1, .7, pos=.1); G(t + b / 2, 'D4', .25, vel * .8, .1, .7, pos=.1)
        t += b; k += 1
bounce(SHOT['s11'], HIT['land'] - .1)
mark('land', HIT['land']); D(HIT['land'], 'frame_drum', 'large', .5, .6); G(HIT['land'], 'G2', .6, .6, 0, .9)
bounce(HIT['land'] + .4, HIT['throat'] - .1, .4)
mark('throat', HIT['throat']); G(HIT['throat'], 'E4', .12, .5, 0, .8, pos=.1); G(HIT['throat'] + .13, 'D4', .12, .5, 0, .8, pos=.1)
mark('tap', HIT['tap']); H(HIT['tap'], 'A5', .55, .1, .9, dur=.5)
mark('mumble', HIT['mumble']); G(HIT['mumble'], 'G2', .9, .6, .2, .9, bend=[(0, 0), (.2, 1), (.5, -1), (.8, 0)], pos=.1); D(HIT['mumble'], 'woodblock', 'b', .3, .35, .2)
mark('roll', HIT['roll']); G(HIT['roll'], 'D3', 1.0, .5, .2, .8, bend=[(0, 0), (.1, 0), (.9, -4)])
mark('bite', HIT['bite']); G(HIT['bite'], 'C4', .2, .55, -.1, .8, pos=.08)
# the tug: a repeated figure that accelerates, with the woodblock
t = HIT['tug0']; k = 0; seq = ['A3', 'A3', 'C4', 'C4', 'D4', 'D4', 'E4', 'E4', 'G4', 'G4', 'A4', 'A4']
while t < HIT['yank'] - .05:
    G(t, seq[min(k, len(seq) - 1)], .18, .45 + .02 * k, (k % 2 - .5) * .3, .75, pos=.1)
    if k % 2 == 0: D(t, 'woodblock', 'c', .35 + .02 * k, .45, .2)
    t += max(.09, .26 - .014 * k); k += 1
mark('yank', HIT['yank']); add(st['guqin'], P.strum('guqin', ['D3', 'C3', 'A2', 'G2', 'F2', 'D2', 'C2'], .8, .8, spread=.007), HIT['yank'], 1.0, 0); D(HIT['yank'], 'timpani', 'drum5', .6, .6)
mark('flung', HIT['flung']); G(HIT['flung'], 'A3', .7, .72, .2, .9, bend=[(0, 0), (.05, 0), (.55, 7)], pos=.1)
mark('landHead', HIT['landHead']); D(HIT['landHead'], 'bass_drum', None, .55, .8); D(HIT['landHead'], 'woodblock', 'c', .6, .5)
G(HIT['landHead'] + .3, 'E3', .5, .4, 0, .7, vib=(7, .3, .05)); G(HIT['landHead'] + .8, 'D3', .5, .35, 0, .7, vib=(6, .25, .05))
bounce(HIT['puff'] + .2, HIT['inhale2'] - .3, .4)
nr = int((HIT['roar'] - .35 - HIT['inhale2'] + .2) * SR); ramp = (np.linspace(0, 1, nr) ** 1.4) * .9 + .1
tr = P.pluck('guqin', 'E3', HIT['roar'] - .35 - HIT['inhale2'] + .2, .55, trem=10).astype(np.float64); tr[:len(ramp)] *= ramp[:len(tr)]
add(st['guqin'], tr.astype(np.float32), HIT['inhale2'] - .2, .8, 0)
mark('roar', HIT['roar']); H(HIT['roar'], 'A6', .45, .2, .7, dur=.25, release=.2)
mark('cloudEye', HIT['cloudEye']); G(HIT['cloudEye'], 'D2', 1.6, .6, 0, 1.0); xiao(HIT['cloudEye'], 'A3', 1.0, .35, .2, .5, att=.3)
mark('gust', HIT['gust']); nr = int(.7 * SR); D(HIT['gust'], 'timpani', 'drum1', .85, 1.0); D(HIT['gust'], 'bass_drum', None, .6, .8)
mark('blownOff', HIT['blownOff']); G(HIT['blownOff'], 'A4', 1.2, .6, .3, .9, bend=[(0, 0), (.1, 0), (1.1, -12)])
for i in range(3): G(HIT['climbBack'] + .2 + i * .8, 'E3', .35, .4, -.1, .7); G(HIT['climbBack'] + .5 + i * .8, 'D3', .35, .35, -.1, .7)
xiao(SHOT['s11b'], 'A4', 1.2, .4, -.2, .6, att=.3); mark('bowlCut', SHOT['s11b'])
mark('inscription3', 71.0); G(71.0, 'A2', 3.0, .55, 0, .9)
mark('browSettle', HIT['browSettle']); H(HIT['browSettle'], 'E5', .5, .1, .9, dur=1.8, release=1.0)
mark('rise', HIT['rise']); H(HIT['rise'], 'A5', .45, .2, .8, dur=1.6, release=1.2)

# ================= 化雨 the dive 82–92 @120 =================
b = .5
mark('diveStroke', HIT['diveStroke'])
D(HIT['diveStroke'], 'bass_drum', None, 1.0, 1.4); D(HIT['diveStroke'], 'timpani', 'drum1', 1.0, 1.1)
add(st['guqin'], P.strum('guqin', ['C2', 'D2', 'F2', 'G2', 'A2', 'C3', 'D3'], 3.0, .95, spread=.011), HIT['diveStroke'], 1.35, 0)
G(HIT['diveStroke'], 'C2', 3.0, .75, 0, .9)
D(HIT['diveStroke'] + 3 / 24, 'gran_cassa', 'hit', .9, 1.0)
nr = int((SHOT['s14'] - HIT['rollStart']) * SR); ramp = (np.linspace(0, 1, nr) ** 2.0) * 1.0 + .04
D(HIT['rollStart'], 'gran_cassa', 'roll', .8, 1.2, 0, env=ramp)
tr = P.pluck('guqin', 'A2', SHOT['s14'] - HIT['rollStart'], .6, trem=12).astype(np.float64); tr[:len(ramp)] *= ramp[:len(tr)] ** .7
add(st['guqin'], tr.astype(np.float32), HIT['rollStart'], .9, 0)
mark('bloomCut', SHOT['s14']); D(SHOT['s14'], 'timpani', 'drum3', .85, .9); G(SHOT['s14'], 'D2', 2.0, .7, 0, 1.0)
# the sacrifice theme (xiao, moving into D 宫)
for t0, p, d, g in [(86.5, 'A4', 1.5, .6), (88.0, 'B4', 1.5, .62), (89.5, 'D5', 2.8, .68)]: xiao(t0, p, d, .55, -.15, g, att=.3)
mark('wake', HIT['wake']); H(HIT['wake'], 'D6', .6, .2, 1.0, dur=.6, release=.4); D(HIT['wake'], 'woodblock', 'a', .5, .5)
mark('lookBelly', HIT['lookBelly']); G(HIT['lookBelly'], 'G2', 1.2, .55, 0, .9, bend=[(0, 0), (.2, 0), (1.0, -3)])
mark('thunder', HIT['thunder']); D(HIT['thunder'], 'bass_drum', None, 1.0, 1.3); D(HIT['thunder'], 'gran_cassa', 'hit', 1.0, 1.1); D(HIT['thunder'], 'gong', None, .45, .5)
nr = int(.9 * SR); D(HIT['thunder'] + .05, 'timpani', 'drum2', .7, .7, 0, env=np.linspace(1, 0, nr) ** .5)
mark('firstDrops', HIT['firstDrops'])
for i, p in enumerate(['D6', 'A5', 'F#6']): H(HIT['firstDrops'] + i * .25, p, .5, (i - 1) * .3, .9, dur=1.0)

# ================= 雨 rain and dance 92–104 @120 =================
mark('rainCut', SHOT['s15']); D(SHOT['s15'], 'gong2', 'small', .5, .6)
def dance_bar(t0, k, strength):
    D(t0, 'frame_drum', 'large', .55 * strength, .7); D(t0 + b, 'frame_drum', 'small', .4 * strength, .55, .2)
    D(t0 + b * 1.5, 'frame_drum', 'small_muted', .35 * strength, .5, -.2); D(t0 + 2 * b, 'frame_drum', 'hand', .5 * strength, .6)
    D(t0 + 3 * b, 'frame_drum', 'small', .4 * strength, .55, .2)
    if strength > .8: D(t0 + b * 2.5, 'claves', None, .4, .4, .3)
for k in range(6):
    t0 = beat('rain', 4 * k)
    if t0 > 101.5: break
    strength = .45 if t0 < HIT['dance'] else 1.0
    dance_bar(t0, k, strength)
# the bright ostinato in D 宫 and the joyful tune
seq = ['D3', 'A3', 'D4', 'A3', 'B2', 'F#3', 'B3', 'F#3']
t = SHOT['s15']; i = 0
while t < 101.5:
    fade = 1 - max(0, (t - 100.5) / 1.0) * .8
    G(t, seq[i % 8], .3, .42 * fade, (-.3 if i % 2 else .3) * .4, .72 * fade, pos=.12)
    t += b / 2; i += 1
tune = [(.5, 'D5', .5), (1.0, 'E5', .5), (1.5, 'F#5', 1.0), (2.5, 'A5', .5), (3.0, 'F#5', .5), (3.5, 'E5', 1.0), (4.5, 'D5', .5), (5.0, 'B4', .5), (5.5, 'D5', 1.5), (7.5, 'E5', .5), (8.0, 'F#5', 1.0), (9.0, 'A5', 2.4)]
for off, p, d in tune: xiao(SHOT['s15'] + off, p, d, .55, -.2, .62, att=.12)
mark('riverFill', HIT['riverFill']); add(st['guqin'], P.strum('guqin', ['D2', 'F2', 'A2', 'D3', 'F3', 'A3', 'D4'], 1.6, .8, spread=.03), HIT['riverFill'], 1.0, 0); D(HIT['riverFill'], 'gong2', 'small', .4, .5)
mark('boatFloat', HIT['boatFloat']); H(HIT['boatFloat'], 'A5', .5, .2, .8, dur=1.0)
mark('bowlFill', HIT['bowlFill']); D(HIT['bowlFill'], 'gong2', 'small', .45, .55, .2)
mark('dance', HIT['dance']); D(HIT['dance'], 'frame_drum', 'large', .7, .8)
mark('redDrop', HIT['redDrop']); H(HIT['redDrop'], 'D6', .55, 0, 1.0, dur=1.2, release=.8)

# ================= 晨 dawn 104–122 @60 =================
mark('plip', HIT['plip']); G(HIT['plip'], 'C2', None, .55, 0, 1.0); H(HIT['plip'], 'C5', .4, 0, .7, dur=1.0)
xiao(HIT['brighten'], 'D4', 4.0, .4, -.15, .6, att=1.2)
mark('stir', HIT['stir']); G(HIT['stir'], 'A3', 1.2, .45, .1, .8, vib=(4.5, .18, .4))
mark('headUp', HIT['headUp']); G(HIT['headUp'], 'E4', 1.0, .45, 0, .8)
mark('lookPainting', HIT['lookPainting']); H(HIT['lookPainting'], 'D5', .5, .1, .9, dur=1.6)
mark('insertWet', SHOT['s17'])
for off, p in [(0, 'D3'), (1.0, 'E3'), (2.0, 'F#3'), (3.0, 'A3')]: G(SHOT['s17'] + off, p, 1.0, .5, (off - 1.5) * .1, .85, bend=[(0, -2), (.25, 0)] if off == 0 else None)
mark('touch', HIT['touch']); H(HIT['touch'], 'A5', .55, .1, 1.0, dur=1.8, release=1.0)
xiao(HIT['eyeInkstone'], 'B4', 1.0, .42, -.2, .55, att=.3); xiao(HIT['eyeInkstone'] + 1.0, 'A4', 1.3, .42, -.2, .55, att=.2)
mark('brushUp', HIT['brushUp']); G(HIT['brushUp'], 'F#3', .8, .5, 0, .8)
# writing: a pluck on the first stroke of each character, harmonics on every third stroke
W0 = TL['write']['t0']; counts = [14, 5, 10, 8]; chars = ['D3', 'A3', 'D4', 'E4']
for ci, n in enumerate(counts):
    mark(f'char{ci}', W0 + ci); G(W0 + ci, chars[ci], .9, .6, (ci - 1.5) * .1, .9)
    for i in range(1, n):
        if i % 3 == 0: H(W0 + ci + i / n, ['A5', 'D6', 'E6', 'A6'][ci], .35, (ci - 1.5) * .15, .55, dur=.4, release=.3)
# ================= 印 seal 122–132 =================
mark('seal', HIT['sealPress']); D(HIT['sealPress'], 'gong2', 'small', .5, .6); D(HIT['sealPress'], 'bass_drum', None, .35, .5); G(HIT['sealPress'], 'D2', None, .6, 0, .9)
xiao(126.2, 'D5', 2.6, .4, -.15, .55, att=.9)
mark('eyeOpen2', HIT['eyeOpen2']); H(HIT['eyeOpen2'], 'D6', .5, .1, .9, dur=1.6, release=1.2)

# ================= reverb, silences, bus =================
def verb(d):
    d['guqin'] = S.room(d['guqin'], size=.5, mix=.2); d['xiao'] = S.room(d['xiao'], size=.62, mix=.3); d['drums'] = S.room(d['drums'], size=.55, mix=.16)
    return d
st = verb(st)
def gate_zero(x, a, b2, fade=.03):
    ia, ib, nf = int(a * SR), int(b2 * SR), int(fade * SR)
    x[ia - nf:ia] *= np.linspace(1, 0, nf, dtype=np.float32)[:, None]; x[ia:ib] = 0
zones = [tuple(z) for z in TL['silence']]
# the music thins out before the first silence: fade 74.3 → 75.0
for k in st:
    for a, b2 in zones: gate_zero(st[k], a, b2)
    i0, i1 = int(74.3 * SR), int(74.97 * SR); st[k][i0:i1] *= np.linspace(1, 0, i1 - i0, dtype=np.float32)[:, None] ** 2
    i0, i1 = int(129.2 * SR), int(129.97 * SR); st[k][i0:i1] *= np.linspace(1, 0, i1 - i0, dtype=np.float32)[:, None] ** 2
    # the hard cuts to the incense inserts: the previous section's tail cut short (the room swallows it)
    for c in (25.0, 50.0):
        i0, i1 = int((c - .04) * SR), int(c * SR); st[k][i0:i1] *= np.linspace(1, .25, i1 - i0, dtype=np.float32)[:, None]
BUS = {'guqin': 1.0, 'xiao': 1.9, 'drums': .9}
mix = sum(st[k] * g for k, g in BUS.items())
pk = np.abs(mix).max(); tgt = 10 ** (-1.2 / 20); sc = tgt / pk if pk > tgt else 1.0
mix *= sc
os.makedirs(os.path.join(HERE, 'stems'), exist_ok=True)
for k, g in BUS.items(): sf.write(os.path.join(HERE, 'stems', f'{k}.wav'), (st[k] * g * sc).astype(np.float32), SR, subtype='FLOAT')
sf.write(os.path.join(HERE, 'score.wav'), mix.astype(np.float32), SR, subtype='FLOAT')

# ---------- self-check ----------
def rms_db(a, b2):
    s = mix[int(a * SR):int(b2 * SR)]; return round(float(20 * np.log10(np.sqrt(np.mean(s ** 2)) + 1e-12)), 1)
def onset(t, win=.08):
    h = int(.0025 * SR); a0 = int((t - win) * SR)
    seg = mix[a0:int((t + win) * SR)].mean(1)
    e = np.sqrt(np.convolve(seg ** 2, np.ones(h) / h, 'same') + 1e-12)
    d = e[h:] - e[:-h]; i = int(np.argmax(d)); return round((a0 + i + h // 2) / SR, 4)
secs = {s['id']: (s['t'], s['t'] + s['beats'] * 60 / s['bpm']) for s in TL['secs']}
report = {'dur': len(mix) / SR, 'peak_dbfs': round(float(20 * np.log10(np.abs(mix).max())), 2),
          'rms_db': {k: rms_db(*v) for k, v in secs.items()},
          'silence_max_abs': {f'{a}-{b2}': float(np.abs(mix[int(a * SR):int(b2 * SR)]).max()) for a, b2 in zones},
          'onsets': {k: onset(v) for k, v in marks.items()}}
json.dump({'marks': marks, 'selfcheck': report}, open(os.path.join(HERE, 'score.json'), 'w'), indent=1, ensure_ascii=False)
print(json.dumps(report, indent=1, ensure_ascii=False))
print('\n'.join(S.credits(['flute', 'bass_drum', 'gran_cassa', 'timpani', 'frame_drum', 'woodblock', 'claves', 'gong2', 'gong'])))
