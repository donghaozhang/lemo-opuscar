"""Original gong-and-drum score for 《最后一场皮影戏》: luogu (bangu clapper drum, tanggu, cymbals, small gong "tai", big gong "kuang", muyu),
a banhu-like fiddle (erhu samples brightened, pitch-curve glides), one suona passage (oboe + formants), a bamboo flute (flute + breath + membrane buzz)
and a sanxian-like pluck (physically modelled shamisen preset). Every cue comes from timeline.json (the page's timeline.js). Key: G, huan-yin pentatonic (G A B D E); ku-yin for the fall.
Run from the library root: .venv/bin/python films/last-shadow-play/music/score.py → music/score.wav + stems/ + score.json"""
import sys, os, json
import numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); PROJ = os.path.dirname(HERE)
ROOT = os.environ.get('LIB') or os.path.abspath(os.path.join(PROJ, '../..'))
sys.path.insert(0, ROOT)
from core.audio import sampler as S, pluck as P
from core.audio.sfx import SR, add, bp, hp, lp, noise, norm

TL = json.load(open(os.path.join(PROJ, 'timeline.json')))
T = TL['hit']; DUR = TL['dur']; N = int(DUR * SR) + SR
S.seed(5)
G = 67   # tonic G4
stems = {k: np.zeros((N, 2), np.float32) for k in ['luogu', 'banhu', 'suona', 'flute', 'sanxian']}
L, B, SU, FL, SX = (stems[k] for k in ['luogu', 'banhu', 'suona', 'flute', 'sanxian'])

# ================= utilities =================
def warp(x, semis):
    x = np.asarray(x, np.float64); n = len(x); out_n = int(n * 1.6) + SR
    t = np.arange(out_n) / SR; r = 2 ** (semis(t) / 12.0)
    ph = np.concatenate([[0], np.cumsum(r[:-1])]); m = ph < n - 1; ph = ph[m]
    i = ph.astype(int); f = ph - i
    return (x[i] * (1 - f) + x[i + 1] * f).astype(np.float32)
def fade(x, fi=.01, fo=.05):
    x = x.copy(); a, b = int(fi * SR), int(fo * SR)
    if a: x[:a] *= np.linspace(0, 1, a)
    if b and b < len(x): x[-b:] *= np.linspace(1, 0, b)
    return x
def trim(x, d, fo=.06):
    n = int(d * SR); x = x[:n].copy() if len(x) > n else np.pad(x, (0, n - len(x))); return fade(x, 0, fo)
def beat(sec, b):
    s = next(s for s in TL['secs'] if s['id'] == sec); return s['t'] + b * 60 / s['bpm']

# ================= gongs and drums =================
def big_gong(vel=.8, drop=-3.0, choke=None):
    x = S.hit('gong2', 'big', vel); y = warp(x, lambda t: drop * np.clip(t / .4, 0, 1) ** .7); y = y + .35 * lp(y, 260)
    return trim(y, choke, .12) if choke else y
def small_gong(vel=.7, rise=1.6):
    return warp(S.hit('gong2', 'small', vel), lambda t: rise * np.clip(t / .12, 0, 1))
def cymbal(vel=.7, d=.9): return trim(S.hit('sus_cymbal', 'stick', vel), d, .3)
def crash(vel=.8, d=2.5): return trim(S.hit('crash', None, vel), d, .8)
def shimmer(vel=.5, d=2.0): return trim(S.hit('sus_cymbal', 'roll', vel), d, .6)
def bowed(vel=.5, d=3.0): return trim(S.hit('sus_cymbal', 'bow', vel), d, .8)
def scrape(vel=.5): return fade(S.hit('gong2', 'scrape', vel), .3, .6)
def bangu(vel=.6): return trim(S.hit('woodblock', 'a', vel), .25, .05)
def muyu(vel=.4): return trim(S.hit('log_drum', 'hi', vel), .3, .05)
def tanggu(vel=.6, d=1.2):
    x = S.hit('frame_drum', 'large', vel); y = S.hit('bass_drum', None, vel * .7)
    n = max(len(x), len(y)); z = np.pad(x, (0, n - len(x))) + .6 * np.pad(y, (0, n - len(y))); return trim(z, d, .3)
def roll(t0, t1, v0=.3, v1=.9, dt0=.22, dt1=.06, pan=.15, drum=True):
    """bangu roll accelerating from dt0 to dt1 between t0 and t1, velocity v0→v1"""
    t, dt = t0, dt0
    while t < t1:
        u = (t - t0) / max(t1 - t0, 1e-6); add(L, bangu(v0 + (v1 - v0) * u), t, .5 + .5 * u, pan)
        if drum: add(L, tanggu(.25 + .5 * u, .22), t + .02, .3 * u, -.1)
        t += dt; dt = max(dt1, dt0 + (dt1 - dt0) * (u + .15) ** .8)
def pattern(t0, t1, bpm, cym=True, gong=True, drum=True, gain=1.0, sixteenths=False):
    """kuai changchui-type pattern: bangu on eighths (or sixteenths), cymbal on beats 1 and 3, small gong on 2 and 4, big drum on bar downbeats"""
    b = 60 / bpm; k = 0; t = t0
    while t < t1 - 1e-6:
        n = 4 if sixteenths else 2
        for j in range(n): add(L, bangu((.55 if j == 0 else .35) * gain), t + j * b / n, .55, .15)
        if cym and k % 2 == 0: add(L, cymbal(.5 * gain, .45), t, .45, .3)
        if gong and k % 2 == 1: add(L, small_gong(.4 * gain), t, .32, -.3)
        if drum and k % 4 == 0: add(L, tanggu(.5 * gain, .6), t, .45, -.1)
        t += b; k += 1

# ================= banhu / suona / flute =================
def banhu_note(midi, dur, vel=.6, slide=None, vib=(5.8, .25, .25), fall=None):
    x = S.note('erhu', midi, dur + .3, vel, release=.25)
    so, st = slide if slide else (0, .01); fo, ft = fall if fall else (0, .01); hz, dep, v0 = vib
    def semis(t):
        s = so * np.clip(1 - t / st, 0, 1) ** 1.6 + dep * np.clip((t - v0) / .3, 0, 1) * np.sin(2 * np.pi * hz * t)
        return s + fo * np.clip((t - (dur - ft)) / ft, 0, 1) ** 2
    return trim(warp(x, semis), dur + .22, .2)
def banhu_color(x):
    y = x + .9 * hp(x, 2400) + .7 * bp(x, 950, 1450) + .45 * bp(x, 2300, 3300); return np.tanh(y * 1.6) / 1.6
def banhu(t, midi, dur, vel=.6, slide=None, vib=(5.8, .25, .25), fall=None, g=.5, pan=-.15):
    add(B, banhu_color(banhu_note(midi, dur, vel, slide, vib, fall)), t, g, pan)
def suona_note(midi, dur, vel=.8, slide=None, vib=(6.5, .3, .15)):
    x = S.note('oboe', midi, dur + .3, vel, release=.12); so, st = slide if slide else (0, .01); hz, dep, v0 = vib
    y = warp(x, lambda t: so * np.clip(1 - t / st, 0, 1) ** 1.5 + dep * np.clip((t - v0) / .2, 0, 1) * np.sin(2 * np.pi * hz * t))
    y = trim(y, dur + .08, .06); y = y + 1.1 * bp(y, 1200, 3000) + .3 * hp(y, 3500); return np.tanh(y * 2.4) / 2.4
def flute_note(midi, dur, vel=.5, slide=None, vib=(5.0, .18, .35), breath=.12):
    x = S.note('flute', midi, dur + .3, vel, release=.3); so, st = slide if slide else (0, .01); hz, dep, v0 = vib
    y = warp(x, lambda t: so * np.clip(1 - t / st, 0, 1) ** 1.5 + dep * np.clip((t - v0) / .4, 0, 1) * np.sin(2 * np.pi * hz * t))
    y = trim(y, dur + .25, .22)
    n = len(y); tt = np.arange(n) / SR
    br = bp(noise(n / SR + .01)[:n], 1800, 6000) * breath * np.minimum(1, tt / .08) * np.exp(-tt / (dur * .8 + .2))   # breath at the attack
    buzz = .18 * np.tanh(y * 3) * bp(np.sign(y) * y * y, 1500, 5000) if True else 0                                  # the dizi membrane buzz
    return (y + br + buzz * .6).astype(np.float32)
def flute(t, midi, dur, vel=.5, slide=None, vib=(5.0, .18, .35), g=.42, pan=.1): add(FL, flute_note(midi, dur, vel, slide, vib), t, g, pan)
def sanxian(t, midi, dur=None, vel=.6, g=.5, pan=.2):
    x = P.pluck('shamisen', midi, dur if dur else 2.2, vel=vel, buzz=.25); add(SX, x.astype(np.float32), t, g, pan)

# ================= P: prologue (free) =================
# a lone bamboo flute phrase while the oil is poured (G A B D E; the same phrase comes back resolved at dawn)
for t, m, d, sl in [(6.2, G + 7, 1.2, (-2, .2)), (7.5, G + 9, .7, (0, .01)), (8.25, G + 7, .6, (1, .1)), (8.9, G + 4, 1.0, (-1, .15)), (10.0, G + 2, .7, (0, .01))]:
    flute(t, m, d, .42, sl, g=.3)
add(L, tanggu(.75, 1.4), T['titleIn'], .9, 0); add(L, small_gong(.5), T['titleIn'] + .02, .5, -.2)
add(L, small_gong(.3), T['titleOut'], .3, -.2)

# ================= S: the square, festive (120 bpm) =================
sq0, sq1 = T['squareIn'], T['clap1'] - .12
roll(sq0 - .9, sq0, .4, .8, .16, .07, drum=False)
add(L, big_gong(.8, -2.5), sq0, .9, 0); add(L, crash(.7, 1.6), sq0, .6, .25)
pattern(sq0, sq1, 120, gain=1.0)
fest = [(0, 12, .5), (.5, 14, .5), (1, 16, 1), (2, 14, .5), (2.5, 12, .5), (3, 9, 1), (4, 7, .5), (4.5, 9, .5), (5, 12, 1), (6, 14, .5), (6.5, 12, .5), (7, 9, .5), (7.5, 7, .5), (8, 12, 2)]
for bt, s, d in fest:
    banhu(beat('square', 2 + bt), G + s, d * .5 - .04, .62, (-2, .06) if s >= 12 else (0, .01), vib=(6.2, .2, .12), g=.45)
for bt, s, d in fest:
    banhu(beat('square', 12 + bt), G + s + (0 if s < 14 else -2), d * .5 - .04, .6, (-1.5, .06), vib=(6.2, .2, .12), g=.42)

# ================= show1 (132 bpm) =================
b = 60 / 132
# the entrance: the mountain and pine press on with two taps, a roll into the drum hit, freeze with a small gong
add(L, muyu(.5), T['mountain'], .5, .2); add(L, muyu(.45), T['pine'], .45, .2); add(L, bangu(.4), T['cloudFlip'], .5, .15); add(L, muyu(.5), T['cloudFlip'] + .25, .4, .2)
roll(T['monkeyIn'] - 1.1, T['monkeyIn'], .35, .9, .2, .06)
add(L, tanggu(.9, 1.2), T['monkeyIn'], 1.0, 0); add(L, crash(.9, 2.0), T['monkeyIn'], .8, .25); add(L, big_gong(.9, -3.0, choke=.6), T['monkeyIn'], 1.0, 0)
add(L, small_gong(.7, 1.8), T['freeze1'], .7, -.2); add(L, cymbal(.6, .8), T['freeze1'], .5, .3)
# hero motif (huan-yin) after the freeze, light bangu under it
hero = [(0, 12, .5), (.5, 16, .5), (1, 19, 1), (2, 21, .5), (2.5, 19, .5), (3, 16, .5), (3.5, 14, .5), (4, 12, 1.5)]
h0 = beat('show1', 10)
for bt, s, d in hero: banhu(h0 + bt * b, G + s, d * b - .04, .62, (-2, .07) if s >= 19 else (0, .01), vib=(6, .2, .15), g=.46)
for k in range(10): add(L, bangu(.3), h0 + k * b, .35, .15)
# the twist and the somersault: a short roll, cymbal on the flip, gong on the landing, sixteenths under the twirl
roll(T['twist'] - .5, T['flip1'], .4, .85, .14, .05, drum=False)
add(L, cymbal(.8, .9), T['flip1'], .7, .3); add(L, big_gong(.85, -2.5, choke=.7), T['land1'], .95, 0); add(L, tanggu(.8, .8), T['land1'], .8, 0)
pattern(T['twirl1'], T['twirl1'] + 1.0, 132, cym=False, gong=False, drum=False, gain=.8, sixteenths=True)
add(L, small_gong(.55), T['twirl1'] + 1.0, .5, -.2)
# the maiden: a lyrical phrase with slides; soft bangu on the beats; three muyu taps for the laugh
mai = [(0, 16, 1), (1, 19, .5), (1.5, 16, .5), (2, 14, 1), (3, 12, .5), (3.5, 14, .5), (4, 16, 1.5), (5.5, 14, .5), (6, 12, 2)]
m0 = T['maidenIn']
for bt, s, d in mai: banhu(m0 + bt * b, G + s, d * b - .04, .5, (-3, .18), vib=(5.2, .3, .2), g=.42)
for k in range(14): add(L, bangu(.22), m0 + k * b, .28, .15)
for k, t in enumerate([T['laugh'], T['laugh'] + .22, T['laugh'] + .44]): add(L, muyu(.5 + .1 * k), t, .5, .25)
# the eye: a cymbal roll into the flare, a gong scrape; the swap: crash + choked big gong, then an eerie ku-yin tremolo
add(L, shimmer(.6, 1.2), T['eyeFlare'] - .9, .55, .3); add(L, scrape(.6), T['eyeFlare'] - .05, .6, .1)
add(L, crash(.95, 1.4), T['headSwap'], .85, .25); add(L, big_gong(.95, -3.5, choke=.7), T['headSwap'], 1.0, 0)
fa_up, si_dn = 5.4, 10.5
for t, m, d in [(T['headSwap'] + .4, G + fa_up, 1.6), (T['headSwap'] + 2.1, G + 2, 1.4)]:
    x = banhu_note(m, d, .45, (-1, .25), vib=(7.5, .35, .1), fall=(-1.5, .4)); trem = 1 + .35 * np.sin(2 * np.pi * 11 * np.arange(len(x)) / SR)
    add(B, banhu_color(x * trem), t, .34, -.15)
# tension before the fight: offbeat bangu + tanggu
for k in range(6): add(L, bangu(.4), T['boyO'] + k * b + b / 2, .45, .15); add(L, tanggu(.4, .5), T['boyO'] + k * b, .4, -.1)
# the fight: fast pattern, one gong per hit, the freeze with a cymbal and one tap, a stumble at the tremble
pattern(T['hit1'] - b, T['freeze2'], 132, gain=.9, sixteenths=True)
for i, h in enumerate([T['hit1'], T['hit2']]): add(L, big_gong(.85, -2.0 - .4 * i, choke=.5), h, .9, .1); add(L, tanggu(.7, .4), h, .6, 0)
add(L, cymbal(.9, 1.0), T['freeze2'], .8, .3); add(L, big_gong(.9, -3.0, choke=.9), T['freeze2'], .9, 0); add(L, bangu(.3), T['freeze2'] + .55, .3, .15)
pattern(T['hit3'] - b / 2, T['tremble1'] - .02, 132, gain=.9, sixteenths=True)
for i, h in enumerate([T['hit3'], T['hit4']]): add(L, big_gong(.85, -2.8 - .4 * i, choke=.5), h, .9, .1); add(L, tanggu(.7, .4), h, .6, 0)
pattern(T['tremble1'] + .3, T['crouch'] - .1, 132, gain=.85, sixteenths=True)   # the half-beat gap at the tremble is the stumble
add(L, muyu(.3), T['tremble1'] + .12, .3, .2)
roll(T['crouch'], T['leap'], .4, .85, .12, .05, drum=False)
add(L, cymbal(.85, .9), T['leap'], .75, .3); add(L, big_gong(.9, -2.5, choke=.8), T['land2'], 1.0, 0); add(L, tanggu(.85, .9), T['land2'], .8, 0)
add(L, cymbal(.5, .5), T['demonBack'], .45, .3)
# the demon rises: tanggu on the beats, a cymbal crescendo into the tremor, cut dead at the hard cut
for k in range(4): add(L, tanggu(.45 + .1 * k, .7), T['clawsUp'] - .5 + k * b, .5, -.1)
add(L, shimmer(.7, 2.2), T['tremor'] - 1.0, .6, .3)
roll(T['tremor'], T['hardCut'], .3, .7, .14, .07)

# ================= crisis (48 bpm): the heartbeat, the fall, the magic =================
bc = 60 / 48
hb0 = beat('crisis', 1); k = 0
t = hb0
while t < T['grow'] + .3:
    add(L, tanggu(.5, 1.0), t, .55, 0); add(L, tanggu(.32, .8), t + .26, .38, 0); t += bc
kuyin = [(T['fall'], G + 19, .7, (-3, .2)), (T['fall'] + .75, G + 12 + fa_up, .5, (0, .01)), (T['fall'] + 1.3, G + 14, .6, (1, .1)), (T['fall'] + 1.95, G + si_dn, .5, (0, .01)), (T['fall'] + 2.5, G + 7, 1.3, (1.5, .1))]
for t, m, d, sl in kuyin: banhu(t, m, d, .5, sl, vib=(5.0, .3, .2), fall=(-2, .25) if d > 1 else None, g=.38)
# the magic: a bowed cymbal and a thin high fiddle harmonic drone
add(L, bowed(.6, 3.4), T['rise'] - .1, .5, .2)
x = banhu_note(G + 24, 3.4, .35, (-1, .6), vib=(4.5, .15, .8)); add(B, banhu_color(x) * .5, T['rise'], .22, -.1)
# the demon grows: the drum accelerates to the claw, then a low rumble roll up to the grab
t, dt = T['grow'], bc * .5
while t < T['grab'] - .05:
    add(L, tanggu(.5 + .4 * (t - T['grow']) / (T['grab'] - T['grow']), .5), t, .55, 0); t += dt; dt = max(.09, dt * .82)
add(L, big_gong(.8, -3.0, choke=1.0), T['clawDown'], .85, 0)

# ================= comeback (144 bpm) =================
bk = 60 / 144
add(L, bangu(.9), T['grab'], .9, .15); add(L, tanggu(.9, .6), T['grab'], .85, 0); add(L, small_gong(.7, 2.2), T['jerk'], .7, -.2)
# clumsy: woodblock stumbles off the beat, a muted "chick" cymbal; the skull hit boings
t = T['flail0']; k = 0
while t < T['skullHit'] - .05:
    add(L, muyu(.5) if k % 3 else bangu(.5), t, .5, .2 if k % 2 else -.2); t += bk * (1.5 if k % 3 == 1 else .5 if k % 3 == 2 else 1); k += 1
for k in range(5): add(L, cymbal(.35, .18), T['flail0'] + k * bk * 2, .3, .3)
add(L, bangu(.8), T['skullHit'], .8, .15); add(L, warp(S.hit('gong2', 'small', .8), lambda tt: 6 * np.clip(tt / .5, 0, 1)), T['skullHit'] + .02, .7, -.1)
# the lesson: a quickening heartbeat, then a near-silence and one tap; a roll into the clean somersault
t = T['tongue']; dt = .7
while t < T['tap'] - .45: add(L, tanggu(.45, .6), t, .45, 0); t += dt; dt = max(.3, dt * .86)
add(L, bangu(.75), T['tap'], .85, .1)
roll(T['tap'] + .25, T['flip2'], .35, .9, .14, .05, drum=False)
add(L, crash(.9, 1.6), T['flip2'], .8, .25); add(L, big_gong(.95, -2.5, choke=.9), T['land3'], 1.0, 0); add(L, tanggu(.9, .9), T['land3'], .85, 0)
# the tune returns in full with the fast pattern
pattern(T['land3'], T['staffUp'], 144, gain=1.0, sixteenths=True)
for bt, s, d in hero: banhu(T['twirl2'] + bt * bk, G + s, d * bk - .04, .68, (-2, .07) if s >= 19 else (0, .01), vib=(6.5, .22, .12), g=.5)
# the staff rises: a cymbal crescendo and the suona's one passage; whip and the big gong on the strike
add(L, shimmer(.8, T['staffTop'] - T['staffUp'] + .4), T['staffUp'], .6, .3)
pattern(T['staffUp'], T['whip2'], 144, cym=False, gong=True, drum=True, gain=.8)
add(SU, suona_note(G + 24, 1.3, .85, (-4, .18), (6.8, .35, .25)), T['suona'], .5, .2)
for bt, s, d in [(0, 21, .5), (.5, 24, .5), (1, 26, 1), (2, 24, .5), (2.5, 26, .5), (3, 28, 1.0)]:
    add(SU, suona_note(G + s, d * bk - .03, .85, (-1.5, .06)), T['suona'] + 1.3 + bt * bk, .45, .2)
roll(T['whip2'], T['strike'], .45, .95, .13, .045)
add(L, big_gong(1.0, -3.5), T['strike'], 1.15, 0); add(L, crash(1.0, 2.6), T['strike'], .9, .25); add(L, tanggu(1.0, 1.4), T['strike'], 1.0, 0)
add(L, shimmer(.5, 2.0), T['skullOff'], .45, .3)
add(L, small_gong(.7, 1.8), T['victory'], .7, -.2)
for bt, s, d in [(0, 19, .25), (.25, 21, .25), (.5, 24, 1.0)]: banhu(T['victory'] + .05 + bt * bk, G + s, d * bk + .1, .66, (-2, .06), vib=(6.5, .25, .15), g=.5)
pattern(T['childStands'], T['gutter'], 144, gain=.9)
# the gutter: the pattern falters, stretching, then the hard stop
t = T['gutter']; dt = bk
while t < T['out'] - .08: add(L, bangu(.5), t, .5, .15); t += dt; dt *= 1.35

# ================= lamp (free): silence, the torch, the cheer, the gift =================
add(L, small_gong(.45, 2.0), T['torch'] + .02, .45, -.2); add(L, shimmer(.45, 1.6), T['clothLit'], .4, .3)
add(L, big_gong(.95, -3.0), T['bigGong'], 1.1, 0); add(L, crash(.9, 2.2), T['bigGong'], .85, .25); add(L, tanggu(.9, 1.0), T['bigGong'], .85, 0)
pattern(T['bigGong'] + .3, T['straighten'], 120, gain=.95)
joy = [(0, 19, .5), (.5, 21, .5), (1, 24, 1), (2, 21, .5), (2.5, 19, .5), (3, 16, .5), (3.5, 19, .5), (4, 21, 1), (5, 19, .5), (5.5, 16, .5), (6, 14, .5), (6.5, 12, .5), (7, 12, 1.5)]
for bt, s, d in joy: banhu(T['bigGong'] + .3 + bt * .5, G + s, d * .5 - .04, .66, (-2, .06) if s >= 19 else (0, .01), vib=(6.4, .22, .12), g=.5)
pattern(T['straighten'], T['musicDrop'] - .02, 120, cym=False, gong=False, drum=False, gain=.6)
flute(T['musicDrop'], G + 19, 2.6, .45, (-2, .3), vib=(4.6, .2, .6), g=.36)
for t, m in [(T['lampOut'], G + 7), (T['lampOut'] + .7, G + 12), (T['taken0'], G + 14), (T['taken0'] + .8, G + 12), (T['taken1'] + .4, G + 7)]: sanxian(t, m, 2.0, .5, g=.42)
flute(T['taken0'] + .3, G + 16, 1.8, .4, (-1, .2), g=.3)

# ================= dawn (60 bpm): the flute phrase resolved, the sanxian, one tap, the pluck on 完 =================
for t, m in [(T['walkOff'] + .4, G), (T['walkOff'] + 1.6, G + 7), (T['walkOff'] + 2.8, G + 4)]: sanxian(t, m, 2.4, .42, g=.36)
for t, m, d, sl in [(T['birds'] + 1.0, G + 7, 1.2, (-2, .2)), (T['birds'] + 2.3, G + 9, .7, (0, .01)), (T['birds'] + 3.05, G + 7, .6, (1, .1)), (T['birds'] + 3.7, G + 4, 1.0, (-1, .15)), (T['birds'] + 4.8, G + 2, .8, (0, .01)), (T['birds'] + 5.7, G, 2.4, (1, .2))]:
    flute(t, m, d, .44, sl, g=.34)
for t, m in [(T['tilt1'] + .5, G + 4), (T['tilt1'] + 1.5, G + 7), (T['tilt1'] + 2.5, G + 12)]: sanxian(t, m, 2.0, .4, g=.32)
add(L, bangu(.55), T['flip3'], .55, .1); add(L, muyu(.5), T['land4'], .5, .2)
flute(T['land4'] - 1.4, G + 12, 2.6, .42, (-1, .3), vib=(4.4, .2, .7), g=.32)
sanxian(T['pluck'], G - 12, 3.0, .6, g=.5); add(L, small_gong(.35, 1.4), T['pluck'] + .05, .3, -.2)

# ================= reverb, gates (the two silences), tails =================
rv = {'luogu': (.5, .2), 'banhu': (.42, .2), 'suona': (.4, .16), 'flute': (.55, .22), 'sanxian': (.45, .18)}
for k in stems: stems[k] = S.room(stems[k], size=rv[k][0], mix=rv[k][1])
tt = np.arange(N) / SR
gate = np.ones(N, np.float32)
def cut(t0, t1, ramp=.02):
    a = int(t0 * SR); r = int(ramp * SR); gate[a:a + r] = np.minimum(gate[a:a + r], np.linspace(1, 0, r)); gate[a + r:int(t1 * SR)] = 0
cut(T['clap1'] - .12, T['mountain'] - .2)            # the clapper's three taps sit in a gap before the show
cut(T['hardCut'], beat('crisis', 1) - .01)           # silence 1: only the heartbeat after it
cut(T['out'], T['torch'] + .01)                      # silence 2: lamp out → the phone click
cut(T['tap'] - .42, T['tap'] - .01, .03)             # the lesson: one tap inside a hush
for k in stems: stems[k] *= gate[:, None]
# the heartbeat alone after the hard cut: re-add it on a clean buffer (gongs and drums before the cut are zeroed permanently, tails included)
hbt = np.zeros((N, 2), np.float32)
t = beat('crisis', 1)
while t < T['fall'] - .1: add(hbt, tanggu(.5, 1.0), t, .55, 0); add(hbt, tanggu(.32, .8), t + .26, .38, 0); t += bc
hbt = S.room(hbt, size=.5, mix=.2); hbt[:int(beat('crisis', 1) * SR)] = 0
stems['luogu'] += hbt
tail = np.clip((DUR - .3 - tt) / 1.5, 0, 1).astype(np.float32)
for k in stems: stems[k] *= tail[:, None]
stems['banhu'] *= 1.8; stems['suona'] *= 2.0; stems['flute'] *= 1.6; stems['sanxian'] *= 1.4
mix = sum(stems.values())
peak = np.abs(mix).max(); g = .89 / peak; mix *= g
os.makedirs(os.path.join(HERE, 'stems'), exist_ok=True)
for k in stems: sf.write(os.path.join(HERE, 'stems', k + '.wav'), (stems[k] * g).astype(np.float32), SR, subtype='FLOAT')
sf.write(os.path.join(HERE, 'score.wav'), mix[:int(DUR * SR)].astype(np.float32), SR, subtype='FLOAT')
ACC = {k: T[k] for k in ['titleIn', 'squareIn', 'monkeyIn', 'freeze1', 'flip1', 'land1', 'headSwap', 'hit1', 'hit2', 'freeze2', 'hit3', 'hit4', 'leap', 'land2', 'hardCut', 'clawDown', 'grab', 'skullHit', 'tap', 'flip2', 'land3', 'suona', 'strike', 'victory', 'out', 'torch', 'bigGong', 'musicDrop', 'flip3', 'pluck']}
json.dump(dict(dur=DUR, key='G huan-yin (G A B D E); ku-yin fa↑ +5.4 / si↓ +10.5 semitones', stems=list(stems), accents=ACC), open(os.path.join(HERE, 'score.json'), 'w'), ensure_ascii=False, indent=1)
mono = mix.mean(1)
def rms(a, b): x = mono[int(a * SR):int(b * SR)]; return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
print('peak dBFS', round(20 * np.log10(np.abs(mix).max()), 2))
for n, a, bb in [('prologue', 0, 16), ('square', 16, 27), ('show1', 28, 66), ('silence1', T['hardCut'] + .03, beat('crisis', 1) - .02), ('crisis', 67, 86), ('comeback', 86.2, 108), ('silence2', T['out'] + .03, T['torch'] - .02), ('cheer', 115.6, 120), ('gift', 120, 125), ('dawn', 125, 140)]:
    print(f'{n:10s} {a:6.1f}-{bb:6.1f} RMS {rms(a, bb):7.1f} dB')
used = ['gong2', 'sus_cymbal', 'crash', 'woodblock', 'frame_drum', 'bass_drum', 'log_drum', 'erhu', 'oboe', 'flute']
open(os.path.join(HERE, 'credits.txt'), 'w').write('\n'.join(S.credits(used)) + '\n')
