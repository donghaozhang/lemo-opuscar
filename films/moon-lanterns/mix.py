"""《中秋的灯》: score + Foley + beds for the whole timeline → out/mix.wav (no voice in this film).
python mix.py            whole film
python mix.py 0 10       a cut (same mix, sliced, 0.35 s fade-out)
Run with the library's .venv python; reads timeline.json (written by tools/timeline.mjs)."""
import sys, os, json
import numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '../..'))
sys.path.insert(0, LIB)
from core.audio import sampler as S, pluck as P
from core.audio.sfx import SR, add, bp, lp, hp, noise, brown, norm, t_, env_exp, whoosh, thump, limit, creak, clack
from scipy.ndimage import uniform_filter1d

TL = json.load(open(os.path.join(HERE, 'timeline.json')))
H, DUR, SECS = TL['HIT'], TL['DUR'], {s['id']: s for s in TL['SECS']}
N = int((DUR + 1.5) * SR)
tt = np.arange(N) / SR
S.seed(9); rng = np.random.default_rng(11)
def db(x): return 10 ** (x / 20)
def rms(x): return np.sqrt(np.mean(x ** 2) + 1e-12)
def env_lin(pts): xs, ys = zip(*pts); return np.interp(tt, xs, ys)
def beat(sec, b): return SECS[sec]['t'] + b * 60 / SECS[sec]['bpm']
def B(sec): return 60 / SECS[sec]['bpm']
CUES = {}   # name → time of the sound placed for a hit (tools/cuecheck.py compares with the picture)
def cue(name, t): CUES.setdefault(name, []).append(round(float(t), 4))

# ———————————————————————————— score ————————————————————————————
ev = []          # sampled instruments (sampler.render)
felt = []        # piano events rendered separately and softened ("felt piano")
synth = np.zeros((N, 2))   # music box, pipa, guqin, xiao: added directly
def n(t, inst, p, d, v, pan=0., **k): ev.append(dict(t=t, inst=inst, pitch=p, dur=d, vel=v, pan=pan, **k))
def fp(t, p, d, v, pan=0.): felt.append(dict(t=t, inst='piano', pitch=p, dur=d, vel=v, pan=pan))
def mbox(t, p, d, v, pan=.2): add(synth, P.pluck('music_box', p, d, v), t, 1, pan)
def pipa(t, p, d, v, pan=-.3, **k): add(synth, P.pluck('pipa', p, d, v, **k), t, 1, pan)
def guqin(t, p, d, v, pan=-.2, **k): add(synth, P.pluck('guqin', p, d, v, **k), t, 1, pan)

def xiao(t0, p, d, v=.5, pan=.1, vib=(5.0, .007, .35), breath=.22, bend=0.):
    """a bamboo flute: sine with a few partials, breath noise, late vibrato, a soft attack"""
    f = S.hz(p); t = t_(d)
    vd = vib[1] * np.clip((t - vib[2]) / .7, 0, 1)
    fr = f * (1 + vd * np.sin(2 * np.pi * vib[0] * t)) * (1 + bend * np.clip(1 - t / .25, 0, 1))
    ph = 2 * np.pi * np.cumsum(fr) / SR
    x = np.sin(ph) + .33 * np.sin(2 * ph) + .11 * np.sin(3 * ph) + .04 * np.sin(4 * ph)
    br = bp(noise(d), f * .7, min(f * 5, 9000)) * breath
    e = np.minimum(1, t / .14) * np.minimum(1, (d - t) / .3) * (.92 + .08 * np.sin(2 * np.pi * .6 * t))
    add(synth, lp(norm(x + br), 5000) * e * v * .9, t0, 1, pan)

T1 = [('D5', 1), ('F#5', 1), ('A5', 1.5), ('B5', .5), ('A5', 1), ('F#5', 1), ('E5', 1), ('D5', 1)]              # the rabbit theme
T2 = [('E5', 1), ('F#5', 1), ('A5', 1.5), ('B5', .5), ('D6', 1), ('B5', 1), ('A5', 2)]                          # its answer
TM = [('B4', 1), ('D5', 1), ('F#5', 1.5), ('G5', .5), ('F#5', 1), ('D5', 1), ('C#5', 1), ('B4', 1)]              # the theme in B minor (the fog)
def tune(t0, notes, b, play, vel=.5, legato=.95, oct=0):
    t = t0
    for p, d in notes:
        pp = p[:-1] + str(int(p[-1]) + oct) if oct else p
        play(t, pp, d * b * legato, vel); t += d * b
    return t
CH = {'D': ['D3', 'A3', 'F#4'], 'G': ['G2', 'D3', 'B3'], 'A': ['A2', 'E3', 'C#4'], 'Bm': ['B2', 'F#3', 'D4'], 'Em': ['E3', 'B3', 'G4']}
def chord(t, name, d, v, inst='piano', pan=0., strum=.03):
    for i, p in enumerate(CH[name]): (fp if inst == 'piano' else (lambda *a: n(*a, inst)))(t + i * strum, p, d, v * (1 - .1 * i), pan + .1 * i) if inst == 'piano' else n(t + i * strum, inst, p, d, v * (1 - .1 * i), pan + .1 * i)

# —— A: home (72 bpm) ——
bA = B('A')
mbox(H['lampOn'] + .02, 'D5', 2.5, .5); cue('lampOn', H['lampOn'] + .02)
t = tune(H['title'], T1, bA, lambda t, p, d, v: mbox(t, p, d, v), .55); cue('title', H['title'])
t = tune(t, T2, bA, lambda t, p, d, v: mbox(t, p, d, v), .5)
t = tune(t, T1, bA, lambda t, p, d, v: (mbox(t, p, d, v * .8), fp(t, p, d, .28, .15)), .5)
for i, name in enumerate(['D', 'G', 'A', 'D', 'Bm', 'G', 'A', 'D', 'G', 'D']):   # felt piano on the bar lines from the wide
    chord(beat('A', 6 + 4 * i), name, bA * 3.6, .3)
for i, (p, v) in enumerate([('D3', .22), ('A3', .2), ('F#4', .16)]): n(beat('A', 6), ['cellos', 'violas', 'violas'][i], p, bA * 36, v, -.2 + .2 * i, attack=1.8, release=1.5)
pipa(beat('A', 14), 'A5', 1.2, .45); pipa(beat('A', 14.5), 'B5', 1.0, .4); pipa(beat('A', 15), 'A5', 1.6, .4)   # answering phrases while she cuts
for i, s in enumerate(H['snips']): mbox(s, ['D6', 'E6', 'F#6', 'A6'][i], 1.2, .3, .3); cue('snips', s)
pipa(H['rabbitFree'], 'D6', 2.0, .5, trem=14); cue('rabbitFree', H['rabbitFree'])
mbox(H['blinkDelight'] + .1, 'A5', 1.5, .45); mbox(H['rabbitUp'], 'D6', 2.4, .5, .3); cue('rabbitUp', H['rabbitUp'])
for i, s in enumerate(H['taps']): fp(s, ['D4', 'F#4', 'A4'][i], 1.4, .42, -.1 + .1 * i); cue('taps', s)    # one, two, three: the three-cake motif
t = tune(H['string'], T1, bA, lambda t, p, d, v: (fp(t, p, d, .34, .1), mbox(t, p, d, v * .5)), .5)
n(H['lanternLift'], 'harp', 'D5', 1.5, .4, .2); n(H['lanternLift'] + .07, 'harp', 'A5', 1.5, .36, .25); n(H['lanternLift'] + .14, 'harp', 'D6', 2, .34, .3); cue('lanternLift', H['lanternLift'])
mbox(H['earFlop'], 'G5', .8, .3, .35); mbox(H['earFix'], 'A5', 1, .3, .35); cue('earFlop', H['earFlop']); cue('earFix', H['earFix'])
for i, s in enumerate(H['duskLanterns']): n(s, 'hand_chimes', ['D5', 'F#5', 'A5', 'D6'][i], 3, .34, -.4 + .25 * i); cue('duskLanterns', s)
t = tune(beat('A', 33), T2, bA, lambda t, p, d, v: fp(t, p, d, .3, .1), .5)
for i, (p, v) in enumerate([('D3', .2), ('A3', .18), ('F#4', .14), ('D5', .12)]): n(beat('A', 37), ['cellos', 'cellos', 'violas', 'violins'][i], p, bA * 5.5, v, -.3 + .2 * i, attack=1.2, release=1.4)
fp(H['bounce'], 'A4', 1.2, .3, .1); fp(H['shoulder'], 'D5', 2.4, .28, .15); cue('bounce', H['bounce']); cue('shoulder', H['shoulder'])

# —— B: fog (60 bpm): a drone, the xiao, sparse felt piano ——
bB = B('B')
n(H['fogIn'] + .2, 'contrabass', 'F#1', 33.5, .13, 0, attack=3.0, release=2.0); n(H['fogIn'] + .2, 'cellos', 'F#2', 33.5, .12, -.2, attack=3.5, release=2.0); n(H['fogIn'] + 2, 'cellos', 'B2', 31.8, .1, .2, attack=4, release=2.0)
n(H['fogIn'] + 6, 'violas', 'F#3', 27.8, .07, .3, attack=5, release=2.5); cue('fogIn', H['fogIn'] + .2)
xiao(beat('B', 1), 'B4', 3.6, .42); xiao(beat('B', 5), 'A4', 3.2, .4, bend=-.02); xiao(beat('B', 9.5), 'F#4', 4.5, .38)
for i, s in enumerate(H['boatLost']): fp(s, ['B3', 'A3', 'F#3'][i], 2.5, .3, -.3 + .3 * i); cue('boatLost', s)
n(H['moonLost'], 'violins_trem', 'B4', 4.5, .1, .2, attack=1.5, release=1.5); n(H['moonLost'], 'violins_trem', 'D5', 4.5, .08, -.2, attack=2, release=1.5); cue('moonLost', H['moonLost'])
fp(H['radioOn'] + .2, 'B2', 3, .3, -.2); fp(H['worry'], 'F#3', 2.5, .3, 0); cue('worry', H['worry'])
xiao(beat('B', 13), 'D5', 2.6, .34, pan=.2); xiao(beat('B', 16), 'C#5', 3.4, .32, pan=.2, bend=.015)
for i, s in enumerate([beat('B', 15), beat('B', 16), beat('B', 17)]): fp(s, ['D4', 'F4', 'A4'][i], 1.6, .32, -.1 + .1 * i)   # the three cakes, now minor
fp(H['flicker'], 'B2', 2.6, .3, 0); cue('flicker', H['flicker'])
for i, s in enumerate(H['runSteps']): n(s, 'cellos_spic', ['B2', 'F#2'][i % 2], .4, .28 + .02 * (i % 2), -.1); cue('runSteps', s)   # the run: cellos on every step
n(beat('B', 18.5), 'violas', 'B3', 4.2, .12, .2, attack=.5, release=1); n(beat('B', 20.5), 'violas', 'D4', 2.4, .12, .2, attack=.5, release=1)
xiao(beat('B', 19), 'F#5', 2.2, .34, pan=-.1); xiao(beat('B', 21.2), 'E5', 1.6, .3, pan=-.1)
for i, s in enumerate([H['wheel'], H['wipe'], H['foghorn2']]): n(s, 'harp', ['F#2', 'B2', 'F#2'][i], 2.5, .3, .2 - .2 * i); cue('wheel', s) if i == 0 else None
xiao(H['lookDown'], 'B4', 1.9, .33); xiao(H['headLift'], 'D5', 1.4, .36, bend=-.03); xiao(H['headLift'] + 1.4, 'F#5', 2.6, .4); cue('headLift', H['headLift'])
mbox(H['rack'] + .1, 'D6', 2.5, .34, .3); cue('rack', H['rack'] + .1)
t = tune(H['climb'], TM, bB * 1.0, lambda t, p, d, v: xiao(t, p, d, v, pan=.1), .4, legato=.9)   # the theme in minor on the flute, climbing

# —— C: the lighthouse (54 bpm): the flute alone, then one piano note, then nothing ——
bC = B('C')
n(beat('C', 0), 'cellos', 'B2', 9.5, .12, -.2, attack=2, release=2.5)
for i, s in enumerate(H['slits']): n(s, 'hand_chimes', ['B4', 'D5', 'F#5', 'A5'][i], 3.5, .26, -.2 + .15 * i); cue('slits', s)
xiao(beat('C', 4), 'B5', 2.8, .34, pan=.1); xiao(beat('C', 6.5), 'A5', 1.8, .3, pan=.1, bend=-.02); xiao(beat('C', 8.2), 'F#5', 3.5, .3, pan=.1)
mbox(H['setLantern'] + .05, 'D5', 2.5, .36, .2); cue('setLantern', H['setLantern'] + .05)
fp(H['clasp'], 'B3', 3, .3, 0); cue('clasp', H['clasp'])
for i in range(3): fp(H['oneNote'] + i * 2.15, 'A3', 1.9, .36 - .04 * i, 0); cue('oneNote', H['oneNote'])
fp(H['browsFold'] + .2, 'F#3', 2.4, .28, 0); fp(H['sink'], 'D3', 2.6, .26, 0)
for i in range(2): fp(H['tears'] + .3 + i * 2.15, 'A3', 1.8, .3 - .05 * i, 0)
# silence from H.silence until the first click (only wind): no score events in (H.silence, H.click1)
for i, (s, p) in enumerate(zip([H['click1'], H['click2'], H['click3']], ['D5', 'F#5', 'A5'])): mbox(s + .04, p, 2.4, .5, -.3 + .3 * i); cue(['click1', 'click2', 'click3'][i], s + .04)

# —— D: the chain (84 bpm): the theme returns, the strings build, the swell lands on the last gallery lantern ——
bD = B('D')
t0 = beat('D', 0)
t = tune(t0, T1, bD, lambda t, p, d, v: (mbox(t, p, d, v), n(t, 'harp', p, d, .3, -.2)), .55)
t = tune(t, T2, bD, lambda t, p, d, v: (mbox(t, p, d, v), n(t, 'harp', p, d, .3, -.2), fp(t, p, d, .3, .1)), .5)
for i, s in enumerate(H['pathLights']): n(s, 'hand_chimes', ['D5', 'E5', 'F#5', 'A5', 'B5', 'D6', 'E6'][i], 2.5, .3, -.5 + .15 * i); cue('pathLights', s)
for i, name in enumerate(['D', 'G', 'Bm', 'A', 'G', 'D', 'G', 'A', 'D']): chord(beat('D', 4 * i), name, bD * 3.7, .28 + .02 * i)
for i, (p, v) in enumerate([('D2', .18), ('D3', .2), ('A3', .18)]): n(beat('D', 4), ['contrabass', 'cellos', 'cellos'][i], p, bD * 33, v, -.2 + .15 * i, attack=2.5, release=2)
n(H['motherLift'], 'violas', 'F#4', bD * 12, .16, .2, attack=1.2, release=1.5); n(H['motherLift'], 'violas', 'D4', bD * 12, .14, -.1, attack=1.2, release=1.5); cue('motherLift', H['motherLift'])
n(H['motherLook'], 'harp', 'D5', 1.2, .3, .3); n(H['motherLook'] + .08, 'harp', 'F#5', 1.2, .3, .3); n(H['motherLook'] + .16, 'harp', 'A5', 1.5, .3, .3)
t = tune(H['rise'], T1, bD, lambda t, p, d, v: (n(t, 'violins', p, d, v * .55, .1, attack=.06), fp(t, p, d, .3, .1)), .5)   # the theme on violins as she rises
n(H['liftHigh'], 'hand_chimes', 'D6', 3, .34, .2); n(H['liftHigh'] + .06, 'hand_chimes', 'A6', 3, .28, .3); cue('liftHigh', H['liftHigh'])
guqin(H['liftHigh'] + .1, 'D4', 3, .5, bend=[(0, 0), (.4, 0), (.9, 2)], vib=(4.5, .15, 1.2))
t = tune(H['dollyOut'], T2, bD, lambda t, p, d, v: (n(t, 'violins', p, d, v * .6, .1, attack=.05), n(t, 'violas', p[:-1] + str(int(p[-1]) - 1), d, v * .4, -.1, attack=.05), fp(t, p, d, .3, .1)), .55)
t = tune(t, T1, bD, lambda t, p, d, v: (n(t, 'violins', p, d, v * .7, .1, attack=.05), n(t, 'violins', p[:-1] + str(int(p[-1]) + 1), d, v * .3, .3, attack=.05), fp(t, p, d, .32, .1), mbox(t, p, d, v * .7)), .6)
for i, s in enumerate(H['galleryLights']): n(s, 'hand_chimes', ['D5', 'F#5', 'A5', 'B5', 'D6', 'E6', 'F#6', 'A6', 'D7'][i], 2.5, .28 + .01 * i, -.3 + .08 * i); cue('galleryLights', s)
pipa(beat('D', 19), 'A5', 2.6, .5, trem=15, pan=-.3); pipa(beat('D', 21.5), 'D6', 2.6, .5, trem=15, pan=-.3)
rise = np.linspace(0, 1, 7)
for i, s in enumerate([beat('D', 20 + i * .5) for i in range(7)]): n(s, 'harp', ['D4', 'F#4', 'A4', 'D5', 'F#5', 'A5', 'D6'][i], 1.5, .3 + .04 * i, -.2 + .07 * i)
chord(beat('D', 22), 'G', bD * 2, .4, strum=.04)
sw = H['swell']; cue('swell', sw)
for i, (p, v, inst) in enumerate([('D2', .32, 'contrabass'), ('D3', .32, 'cellos'), ('A3', .3, 'cellos'), ('F#4', .3, 'violas'), ('D4', .26, 'violas'), ('A4', .3, 'violins'), ('D5', .32, 'violins'), ('F#5', .3, 'violins')]):
    n(sw - .02, inst, p, bD * 9, v, -.4 + .11 * i, attack=.1, release=2.2)
n(sw, 'gong2', 'small', None, .32, 0); n(sw, 'hand_chimes', 'D6', 4, .4, .2); n(sw + .05, 'hand_chimes', 'A6', 4, .34, .3); n(sw + .1, 'hand_chimes', 'D7', 4, .3, .35)
for i, p in enumerate(['D4', 'F#4', 'A4', 'D5', 'F#5', 'A5', 'D6', 'F#6']): n(sw - .3 + i * .045, 'harp', p, 2, .36, -.3 + .08 * i)
fp(sw, 'D3', 4, .4, 0); fp(sw + .03, 'A3', 4, .36, .1); fp(sw + .06, 'D5', 4, .34, .2)
t = tune(H['fatherSees'], T1, bD, lambda t, p, d, v: (n(t, 'cellos', p[:-1] + str(int(p[-1]) - 2), d, v * .7, -.2, attack=.06), n(t, 'violas', p[:-1] + str(int(p[-1]) - 1), d, v * .5, .1, attack=.06)), .5)   # the theme on the cellos for the father
cue('fatherSees', H['fatherSees'])
for i, p in enumerate(['D4', 'F#4', 'A4', 'D5', 'F#5', 'A5', 'D6']): n(H['wheelTurn'] + i * .05, 'harp', p, 1.6, .3, -.2 + .07 * i); cue('wheelTurn', H['wheelTurn'])
t = tune(H['fogOut'] + .3, T2, bD, lambda t, p, d, v: (n(t, 'violins', p[:-1] + str(int(p[-1]) + 1), d, v * .55, .2, attack=.08), fp(t, p, d, .3, .1), n(t, 'harp', p, d, .28, -.2)), .5)
for i, (p, v) in enumerate([('D2', .22), ('A2', .2), ('D3', .2), ('F#4', .2), ('A4', .18)]): n(H['fogOut'], ['contrabass', 'cellos', 'cellos', 'violas', 'violins'][i], p, bD * 7, v, -.3 + .15 * i, attack=1.5, release=2.2)
n(H['moonBack'] + .2, 'hand_chimes', 'D6', 4, .36, .1); n(H['moonBack'] + .28, 'hand_chimes', 'F#6', 4, .3, .2); n(H['moonBack'] + .36, 'hand_chimes', 'A6', 5, .3, .3); cue('moonBack', H['moonBack'] + .2)
mbox(H['moonBack'] + .2, 'D6', 3, .45, .2)

# —— E: the reunion (66 bpm): felt piano and the music box, warm strings, then the music box alone ——
bE = B('E')
for i, name in enumerate(['D', 'G', 'A', 'D', 'G', 'D']): chord(beat('E', 4 * i), name, bE * 3.7, .3 - .02 * i)
for i, (p, v) in enumerate([('D3', .2), ('A3', .18), ('F#4', .16)]): n(beat('E', 0), ['cellos', 'cellos', 'violas'][i], p, bE * 16, v, -.2 + .2 * i, attack=1.5, release=2.5)
t = tune(beat('E', 0), T1, bE, lambda t, p, d, v: (fp(t, p, d, .34, .1), mbox(t, p, d, v * .5)), .5)
for i, p in enumerate(['D4', 'A4', 'D5', 'F#5', 'A5', 'D6']): n(H['leap'] + i * .05, 'harp', p, 1.6, .32, -.2 + .08 * i); cue('leap', H['leap'])
n(H['lift'], 'hand_chimes', 'A5', 3, .3, .2); cue('lift', H['lift'])
t = tune(beat('E', 5), T2, bE, lambda t, p, d, v: (fp(t, p, d, .3, .1), n(t, 'violins', p, d, .22, .2, attack=.1)), .45)
for i, s in enumerate(H['cakeHands']): fp(s, ['D4', 'F#4', 'A4'][i], 1.6, .4, -.1 + .1 * i); cue('cakeHands', s)   # the three-cake motif, paid off
fp(H['cakeHands'][2] + bE, 'D5', 3, .36, .1)
n(H['cuLantern'], 'violas', 'D4', bE * 6, .12, 0, attack=1.5, release=2.5); n(H['cuLantern'], 'violins', 'F#5', bE * 6, .1, .2, attack=2, release=2.5); cue('cuLantern', H['cuLantern'])
mb0 = H['musicBox']; cue('musicBox', mb0)
tune(mb0, T1, bE * 1.6, lambda t, p, d, v: mbox(t, p, d, v, .1), .5, legato=1.0)   # the theme alone on the music box, slower
tE = mb0 + 8 * bE * 1.6
mbox(tE, 'D5', 4, .4, .0); mbox(tE + .03, 'F#5', 4, .32, .15); mbox(tE + .06, 'A5', 4, .28, .25); mbox(tE + .09, 'D6', 5, .3, .3)
fp(tE, 'D3', 4, .26, -.1); fp(tE + .04, 'A3', 4, .22, .1)

music = S.render(ev, dur=DUR + 1.5, master=False); music = np.pad(music, ((0, max(0, N - len(music))), (0, 0)))[:N]
pf = S.render(felt, dur=DUR + 1.5, master=False); pf = np.pad(pf, ((0, max(0, N - len(pf))), (0, 0)))[:N]
pf = np.stack([lp(pf[:, c], 2300) for c in (0, 1)], 1) * 1.15          # felt: the hammers muted, the highs gone
music = music + pf + synth
music = S.room(music, size=.52, mix=.2)
music = np.pad(music, ((0, max(0, N - len(music))), (0, 0)))[:N]
# the silence: nothing but wind between the last piano note's tail and the first click
music *= env_lin([(0, 1), (H['silence'] - .1, 1), (H['silence'] + .6, 0), (H['click1'] - .01, 0), (H['click1'], 1), (DUR + 1.5, 1)])[:, None]

# ———————————————————————————— Foley ————————————————————————————
fx = np.zeros((N, 2))
def tick(v=1., f=2400):
    d = .035; x = t_(d); return norm(hp(noise(d), 2500) * env_exp(d, .0025) + np.sin(2 * np.pi * f * x) * env_exp(d, .005) * .45) * v
def shimmer(d=1.1, f0=1600, v=1.):
    x = t_(d); s = sum(np.sin(2 * np.pi * f0 * m * (1 + .25 * x / d) * x + m) / m for m in (1, 1.5, 2, 2.5, 3)) * np.sin(np.pi * x / d) ** 2 * np.exp(-x / d); return norm(s) * v
def snip(v=1.):
    d = .07; x = t_(d); return norm(hp(noise(d), 3000) * env_exp(d, .003) + np.sin(2 * np.pi * 5200 * x) * env_exp(d, .009) * .5 + np.sin(2 * np.pi * 1900 * x) * env_exp(d, .02) * .35 + lp(noise(d), 500) * env_exp(d, .004) * .4) * v
def slide(d=.5, v=1., lo=1200, hi=6000):
    x = t_(d); return norm(bp(noise(d), lo, hi) * np.sin(np.pi * x / d) ** 1.5) * v
def rustle(d=.35, v=1.):
    x = t_(d); return norm(bp(noise(d), 700, 5500) * (1 + .5 * np.sin(2 * np.pi * 37 * x) * np.sin(2 * np.pi * 7 * x)) * np.sin(np.pi * x / d) ** .7) * v
def plank(v=1.):
    d = .12; x = t_(d); return norm(lp(noise(d), 900) * env_exp(d, .012) + np.sin(2 * np.pi * 170 * x) * env_exp(d, .035) * .8 + np.sin(2 * np.pi * 95 * x) * env_exp(d, .05) * .5) * v
def stone(v=1.):
    d = .08; x = t_(d); return norm(bp(noise(d), 900, 4000) * env_exp(d, .008) + lp(noise(d), 400) * env_exp(d, .015) * .6) * v
def foghorn(d=1.9, v=1.):
    x = t_(d); s = sum(2 * ((x * fr * (1 + .0015 * np.sin(2 * np.pi * 4 * x))) % 1) - 1 for fr in (98., 123.5, 196.))
    e = np.minimum(1, x / .35) * np.minimum(1, (d - x) / .6); return norm(lp(bp(s, 60, 1400), 900) * e) * v
def radio_crackle(d, v=1.):
    """distant garbled speech: formant-filtered noise in syllables, crackle bursts, a hiss floor"""
    x = t_(d); syl = (lp(noise(d), 6) > .25).astype(float); syl = uniform_filter1d(syl, int(.02 * SR))
    voice = (bp(noise(d), 450, 750) * 1.0 + bp(noise(d), 1300, 1900) * .6) * syl * (1 + .4 * np.sin(2 * np.pi * 110 * x))
    crack = hp(noise(d), 2500) * (rng.random(len(x)) > .9985) * 6
    crack = lp(crack, 7000)
    hiss = bp(noise(d), 1500, 5000) * .25
    return norm(bp(voice + crack + hiss, 350, 4000)) * v
def buzz(d=.9, v=1.):
    x = t_(d); s = 2 * ((x * 100) % 1) - 1; e = np.abs(np.sin(x * 14)) * np.exp(-x * 2); return norm(bp(s, 80, 2000) * e) * v
def engine(d, v=1.):
    x = t_(d); f = 38 * (1 + .03 * np.sin(2 * np.pi * .3 * x)); ph = 2 * np.pi * np.cumsum(f) / SR
    s = (np.sin(ph) + .5 * np.sin(2 * ph) + .25 * np.sin(3 * ph)) * (1 + .35 * np.sin(2 * np.pi * 9 * x)) + lp(noise(d), 300) * .35
    return norm(lp(s, 420)) * v
def squeak(v=1.):
    d = .4; x = t_(d); f = 1200 + 700 * np.sin(np.pi * x / d); ph = 2 * np.pi * np.cumsum(f) / SR; return norm((np.sin(ph) + .3 * np.sin(2 * ph)) * np.sin(np.pi * x / d) * (1 + .3 * np.sin(2 * np.pi * 31 * x)) + bp(noise(d), 1000, 4000) * .3 * np.sin(np.pi * x / d)) * v
def gull(v=1.):
    d = .55; x = t_(d); f = 1400 * (1 - .35 * x / d) * (1 + .03 * np.sin(2 * np.pi * 23 * x)); ph = 2 * np.pi * np.cumsum(f) / SR
    return norm((np.sin(ph) + .4 * np.sin(2 * ph)) * np.sin(np.pi * x / d) ** 1.5) * v
def cricket(d, v=1.):
    x = t_(d); chirp = (np.sin(2 * np.pi * 4300 * x) * (np.sin(2 * np.pi * 22 * x) > .6)) * ((np.sin(2 * np.pi * 1.1 * x) > -.3)); return norm(bp(chirp, 3500, 5200)) * v
def light(t, pan=0., g=-30, sg=-38, f=2400):
    add(fx, tick(1, f), t, db(g), pan); add(fx, shimmer(1.0), t + .04, db(sg), pan)

# beds: room tone (the real room, in the box shots), the sea, wind, fog, crickets
room = lp(brown(DUR + 1.5), 160)[:N]
add(fx, room * env_lin([(0, 1), (7, 1), (9.5, .35), (H['pullOut'] + 2, .35), (H['pullOut'] + 4, 1), (DUR + 1.5, 1)]) * db(-44), 0, 1, 0)
hum = (np.sin(2 * np.pi * 100 * tt) + .4 * np.sin(2 * np.pi * 200 * tt)) * .5
add(fx, hum * env_lin([(0, 0), (H['lampOn'], 0), (H['lampOn'] + .3, 1), (7, 1), (9, 0), (H['pullOut'] + 2, 0), (H['pullOut'] + 4, 1), (H['fade'], 1), (DUR + 1.5, 0)]) * db(-50), 0, 1, 0)
sea = bp(brown(DUR + 1.5), 80, 900)[:N] * (.55 + .45 * np.sin(2 * np.pi * tt / 6.3) ** 2)
seaMuffled = lp(sea, 380)
seaMix = sea * env_lin([(0, 0), (5, 0), (8, 1), (H['fogIn'], 1), (H['fogIn'] + 4, .25), (H['fogOut'], .25), (H['fogOut'] + 3, 1), (H['pullOut'] + 2, 1), (H['pullOut'] + 4, .2), (DUR + 1.5, .2)]) + seaMuffled * env_lin([(0, 0), (H['fogIn'], 0), (H['fogIn'] + 4, 1), (H['fogOut'], 1), (H['fogOut'] + 3, 0), (DUR + 1.5, 0)])
add(fx, seaMix * env_lin([(0, 1), (H['silence'], 1), (H['silence'] + .4, .4), (H['click1'], .4), (H['click1'] + 1, 1), (DUR + 1.5, 1)]) * env_lin([(0, .5), (10, .5), (10.1, .25), (26.5, .25), (26.7, .6), (35, .8), (DUR, .8)]) * db(-30), 0, 1, 0)
wind = bp(noise(DUR + 1.5), 250, 1600)[:N] * (.6 + .4 * np.sin(2 * np.pi * tt / 4.3)) * (.7 + .3 * np.sin(2 * np.pi * tt / 11.7 + 1))
add(fx, wind * env_lin([(0, 0), (H['fogIn'], 0), (H['fogIn'] + 5, .6), (H['climb'], .7), (H['climb'] + 2, 1), (H['silence'], 1), (H['silence'] + .3, 1.15), (H['click1'], 1.15), (H['dollyOut'], .8), (H['fogOut'], .6), (H['fogOut'] + 3, .25), (H['pullOut'], .2), (H['pullOut'] + 3, 0), (DUR + 1.5, 0)]) * db(-32), 0, 1, .1)
fog = lp(brown(DUR + 1.5), 220)[:N]
add(fx, fog * env_lin([(0, 0), (H['fogIn'], 0), (H['fogIn'] + 3, 1), (H['fogOut'], 1), (H['fogOut'] + 3, 0), (DUR + 1.5, 0)]) * db(-40), 0, 1, 0)
add(fx, cricket(DUR + 1.5)[:N] * env_lin([(0, 0), (beat('E', 0), 0), (beat('E', 1), 1), (H['pullOut'] + 2, 1), (H['pullOut'] + 4, .2), (DUR + 1.5, 0)]) * db(-44), 0, 1, -.3)
for t, pan in [(6.4, -.4), (12.6, .3), (27.9, -.2)]: add(fx, gull(), t, db(-40), pan)
village = bp(brown(DUR + 1.5), 300, 1200)[:N]
add(fx, village * env_lin([(0, 0), (8, 0), (9, 1), (35, 1), (40, .3), (DUR + 1.5, .3)]) * db(-44), 0, 1, -.2)

# —— A ——
light(H['lampOn'], 0, -26, -34, 2200)
add(fx, slide(.9, 1, 1000, 5000), H['title'], db(-36), .3); add(fx, thump(1, 120), H['seal'], db(-30), .35); add(fx, slide(.7), H['caption'], db(-38), -.3)
for s in H['snips']: add(fx, snip(), s, db(-26), .1)
add(fx, rustle(.5), H['rabbitFree'], db(-30), .1)
add(fx, rustle(.3), H['rabbitUp'], db(-34), .2)
add(fx, thump(1, 150), H['lidUp'] + .35, db(-30), .1); add(fx, slide(.4, 1, 600, 3000), H['lidUp'], db(-36), .1)
for s in H['taps']: add(fx, clack(.7, 1), s, db(-30), 0)
add(fx, rustle(.4), H['string'], db(-34), -.2); add(fx, creak(), H['lanternLift'] + .2, db(-34), .1); add(fx, tick(1, 900), H['earFlop'], db(-34), .2); add(fx, rustle(.2), H['earFix'], db(-36), .2)
for i, s in enumerate(H['duskLanterns']): light(s, -.4 + .25 * i, -30, -38)
add(fx, plank(.6), H['bounce'], db(-34), .1); add(fx, plank(.5), H['bounce'] + .5, db(-36), .1); add(fx, rustle(.3), H['shoulder'], db(-38), -.1)
# —— B ——
for i, s in enumerate([H['foghorn1'], H['foghorn2']]): add(fx, foghorn(), s, db(-24), .3 - .4 * i); cue(['foghorn1', 'foghorn2'][i], s)
rc = radio_crackle(11.0); add(fx, rc * env_lin([(0, 0), (.2, 1), (10.3, 1), (11, 0)])[:len(rc)] if False else rc * np.minimum(1, np.minimum(t_(11.0) / .2, (11.0 - t_(11.0)) / .7)), H['radioOn'] - .4, db(-26), .35); cue('radioOn', H['radioOn'] - .4)
add(fx, tick(1, 1500), H['knob'], db(-30), .3); cue('knob', H['knob'])
add(fx, buzz(), H['flicker'], db(-34), 0)
for i, s in enumerate(H['runSteps']): add(fx, plank(1), s, db(-28 + (i % 2) * 2), -.3 + .08 * i)
add(fx, rustle(.6), H['gather'], db(-36), -.2)
add(fx, engine(4.6), H['wheel'] - .6, db(-30), 0)
add(fx, creak(), H['wheel'], db(-32), -.2); add(fx, squeak(), H['wipe'], db(-34), .2); add(fx, squeak(.8), H['wipe'] + .5, db(-36), .2); cue('wipe', H['wipe'])
add(fx, creak(), H['stepOut'], db(-30), -.3); cue('stepOut', H['stepOut'])
for i in range(11): add(fx, stone(.8), H['climb'] + .25 + i * .36, db(-36), -.1 + .02 * i)
# —— C ——
for i, s in enumerate(H['slits']): add(fx, stone(.5), s + .1, db(-40), 0)
add(fx, clack(.6, 1), H['setLantern'], db(-32), -.2)
add(fx, rustle(.5), H['sink'], db(-34), 0)
for i, s in enumerate([H['click1'], H['click2'], H['click3']]): light(s, -.4 + .3 * i, -27 - i, -34)
# —— D ——
for i, s in enumerate(H['pathLights']): light(s, -.5 + .15 * i, -29, -37)
for i, s in enumerate(H['galleryLights']): light(s, -.3 + .08 * i, -31, -39, 2800)
crowd = bp(brown(DUR + 1.5), 400, 3000)[:N] * (1 + .3 * np.sin(2 * np.pi * tt * 1.3))
add(fx, crowd * env_lin([(0, 0), (beat('D', 0), 0), (beat('D', 2), 1), (H['fatherSees'], 1), (H['fatherSees'] + .5, 0), (H['fogOut'], 0), (DUR + 1.5, 0)]) * db(-42), 0, 1, -.1)
add(fx, engine(8.2), H['fatherSees'] - .3, db(-30), 0); add(fx, engine(2.6), H['boatBump'] - 2.4, db(-34), .2)
add(fx, creak(), H['wheelTurn'], db(-32), -.1); add(fx, creak(), H['wheelTurn'] + .3, db(-34), -.1)
for i in range(3): add(fx, lp(whoosh(1.6), 1500), H['fogOut'] + .3 + i * .9, db(-32), -.3 + .3 * i)
add(fx, shimmer(1.6, 2000), H['moonBack'] + .1, db(-36), .1)
# —— E ——
add(fx, thump(1, 70), H['boatBump'], db(-26), .3); add(fx, clack(.5, 1), H['boatBump'] + .05, db(-30), .3); cue('boatBump', H['boatBump'])
for i in range(3): add(fx, plank(.8), H['stepOff'] + .2 + i * .35, db(-32), .2)
for i in range(6): add(fx, plank(.7), H['run'] + i * .17, db(-34), -.1 + .04 * i)
add(fx, rustle(.4), H['leap'], db(-32), .1); add(fx, rustle(.5), H['lift'], db(-34), .1)
for i, s in enumerate(H['cakeHands']): add(fx, rustle(.35), s, db(-32), -.2 + .2 * i)
add(fx, slide(.6, 1, 800, 3000), H['pullOut'] + .2, db(-40), 0)

# ———————————————————————————— mix ————————————————————————————
music *= db(-20) / rms(music)
radioEnv = env_lin([(0, 0), (H['radioOn'] - .4, 0), (H['radioOn'], 1), (H['radioOn'] + 10.3, 1), (H['radioOn'] + 10.8, 0), (DUR + 1.5, 0)])
hornEnv = np.zeros(N)
for s in (H['foghorn1'], H['foghorn2']): hornEnv = np.maximum(hornEnv, env_lin([(0, 0), (s, 0), (s + .3, 1), (s + 1.6, 1), (s + 2.2, 0), (DUR + 1.5, 0)]))
music *= db(-4 * radioEnv - 3 * hornEnv)[:, None]
mix = music + fx
mix = np.stack([limit(mix[:, c], .89) for c in (0, 1)], 1)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
json.dump(CUES, open(os.path.join(HERE, 'out', 'cues.json'), 'w'), indent=1)
if len(sys.argv) >= 3:
    a, b = float(sys.argv[1]), float(sys.argv[2]); seg = mix[int(a * SR):int(b * SR)].copy()
    f = int(.35 * SR); seg[-f:] *= np.linspace(1, 0, f)[:, None]
    sf.write(os.path.join(HERE, 'out', 'mix.wav'), seg.astype(np.float32), SR); print('cut', a, b)
else:
    sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix[:int(DUR * SR)].astype(np.float32), SR); print('full', DUR)
print('instruments', sorted({e['inst'] for e in ev} | {'piano'}), '+ music box, pipa, guqin, xiao (synthesis)')
print('music rms', round(20 * np.log10(rms(music)), 1), 'fx rms', round(20 * np.log10(rms(fx)), 1), 'peak', round(float(np.abs(mix).max()), 3))
