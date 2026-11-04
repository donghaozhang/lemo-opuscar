"""Mix: synthesised foley (paper, wood, water, fur, feathers, bronze) + ambience beds + the original score → mix.wav
No voice. The score is ducked a little under the key foley hits; the two ma (silences) are kept absolute.
Run (after events.mjs and music/score.py): $LIB/.venv/bin/python films/edo-cat/mix.py
Paper/wood recipes (baren, slip, seal, scroll, block, step, rain bed, sea swell, kite call) adapted from the library's ukiyo-e demo."""
import sys, os, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '../..'))
sys.path.insert(0, os.path.join(LIB, 'core/audio'))
from sfx import SR, t_, env_exp, bp, lp, hp, norm, compress, limit, add
from scipy.ndimage import uniform_filter1d

E = json.load(open(os.path.join(HERE, 'events.json'))); DUR = E['dur']; N = int(DUR * SR)
HIT = {e['id']: e['t'] for e in E['ev'] if e['type'] == 'hit'}
SHOT = {e['id']: (e['t'], e['t1']) for e in E['ev'] if e['type'] == 'shot'}
rng = np.random.default_rng(17)
def nz(d): return rng.standard_normal(int(round(d * SR)))
def brown(d):
    w = np.cumsum(nz(d)); w -= np.linspace(w[0], w[-1], len(w)); return norm(hp(w, 20))
def fade(x, a=.005, r=.02):
    n = len(x); x = x.copy(); A, R = min(n, int(a * SR)), min(n, int(r * SR))
    if A: x[:A] *= np.linspace(0, 1, A)
    if R: x[n - R:] *= np.linspace(1, 0, R)
    return x
def sines(fs, d, taus, amps):
    tt = t_(d); return sum(a * np.sin(2 * np.pi * f * tt) * np.exp(-tt / tau) for f, tau, a in zip(fs, taus, amps))
def slow(d, rate, depth, seed=0):
    k = max(2, int(d * rate) + 3); r = np.random.default_rng(seed).random(k)
    return 1 - depth + depth * np.interp(np.linspace(0, k - 1, int(round(d * SR))), np.arange(k), r)
def sweep(d, f0, f1, shape=1.0):
    tt = t_(d); f = f0 + (f1 - f0) * (tt / d) ** shape; return np.sin(2 * np.pi * np.cumsum(f) / SR)
# —— paper ——
def baren(d=.36, v=1):
    tt = t_(d); m = .55 + .45 * np.abs(np.sin(2 * np.pi * 4.6 * tt)); e = np.sin(np.pi * tt / d) ** .7
    return norm(bp(nz(d), 700, 5200) * m * e + lp(nz(d), 500) * e * .3) * v
def slip(v=1):
    d = .28; tt = t_(d); return norm(hp(nz(d), 1800) * np.sin(np.pi * tt / d) ** 2 * (1 - tt / d * .5)) * v
def peel(v=1):   # a colour block lifted off the sheet: a tacky tearing hiss
    d = .45; tt = t_(d); crk = (rng.random(len(tt)) > .993) * rng.standard_normal(len(tt)) * 3
    return norm(bp(nz(d), 2500, 9000) * np.sin(np.pi * tt / d) ** 1.5 * (.5 + .5 * np.sin(2 * np.pi * 23 * tt)) + hp(crk, 3000) * np.sin(np.pi * tt / d)) * v
def seal(v=1):
    d = .35; x = sines([88, 180], d, [.07, .03], [1, .4]); x[:int(.012 * SR)] += bp(nz(.012), 200, 1500) * .9
    y = np.zeros(int(.45 * SR)); y[:len(x)] += x; k = int(.22 * SR); c = hp(nz(.08), 3000) * env_exp(.08, .02) * .15; y[k:k + len(c)] += c
    return norm(lp(y, 2500)) * v
def scroll(d, v=1, fast=0):
    tt = t_(d); e = np.sin(np.pi * np.minimum(tt / d, 1)) ** (1.2 if not fast else .6)
    f = np.interp(tt, [0, d], [1200, 3200] if not fast else [900, 5200]); x = np.zeros_like(tt); blk = 2400; src = nz(d)
    for i in range(0, len(tt), blk): x[i:i + blk] = bp(src[max(0, i - 4800):i + blk], f[i] * .6, f[i] * 1.6)[-len(x[i:i + blk]):]
    cr = hp(nz(d), 4000) * (rng.random(len(tt)) > .9985) * 3
    return norm(x * e + lp(cr, 9000) * e * .4) * v
def block(v=1):
    d = .2; x = sines([180, 410, 960], d, [.05, .03, .015], [1, .6, .3]); x[:int(.004 * SR)] += nz(.004) * .5; return norm(lp(x, 3000)) * v
# —— wood, bodies ——
def step(m='wood', v=1):
    if m == 'wood':
        d = .18; x = sines([170, 390, 720], d, [.06, .03, .012], [1, .5, .25]); x[:int(.01 * SR)] += bp(nz(.01), 300, 2500) * .6; return norm(lp(x, 2200)) * v
    d = .11; tt = t_(d); return norm(bp(nz(d), 300, 2600) * np.exp(-tt / .03)) * v * .7
def paw(m='soft', v=1):
    d = .07; tt = t_(d)
    if m == 'wet': x = bp(nz(d), 600, 4000) * np.exp(-tt / .018) + bp(nz(d), 2000, 7000) * np.exp(-tt / .008) * .6
    elif m == 'snow': x = bp(nz(d), 300, 2500) * np.exp(-tt / .025) * (rng.random(len(tt)) > .4)
    elif m == 'sand': x = bp(nz(d), 500, 5000) * np.exp(-tt / .02)
    else: x = lp(bp(nz(d), 150, 1500) * np.exp(-tt / .015), 1200) + sines([120], d, [.012], [.6])
    return norm(x) * v
def thud(v=1, wood=0):
    d = .4; x = sines([60, 95] if not wood else [140, 320, 610], d, [.12, .06] if not wood else [.07, .04, .02], [1, .5] if not wood else [1, .5, .3])
    x[:int(.015 * SR)] += lp(nz(.015), 1500) * .8; return norm(lp(x, 2500)) * v
def creak(v=1):
    d = .7; tt = t_(d); f = 180 + 60 * np.sin(2 * np.pi * 1.2 * tt) + 30 * tt
    saw = 2 * ((np.cumsum(f) / SR) % 1) - 1; pul = (np.sin(2 * np.pi * np.cumsum(f * .5) / SR) > .7).astype(float)
    return norm(bp(saw * pul, 300, 2500) * np.sin(np.pi * tt / d) ** .5) * v
def pole(v=1): d = .25; return norm(sines([520, 1180, 2100], d, [.06, .03, .015], [1, .5, .3]) + np.concatenate([nz(.004) * .5, np.zeros(int(d * SR) - int(.004 * SR))])) * v
def basket(v=1): d = .35; tt = t_(d); return norm(bp(nz(d), 1500, 6000) * (rng.random(len(tt)) > .85) * np.sin(np.pi * tt / d)) * v
def fishslap(v=1):
    d = .25; tt = t_(d); x = bp(nz(d), 300, 3000) * np.exp(-tt / .02) + sines([140], d, [.03], [.8]) + bp(nz(d), 2500, 8000) * np.exp(-tt / .05) * .3; return norm(x) * v
def drag(d, v=1): tt = t_(d); return norm(bp(nz(d), 400, 3500) * np.sin(np.pi * tt / d) * (.6 + .4 * np.sin(2 * np.pi * 17 * tt))) * v
def claws(v=1):
    out = np.zeros(int(.3 * SR))
    for k in range(4): d = .03; c = hp(nz(d), 4000) * env_exp(d, .006); i = int(k * .045 * SR); out[i:i + len(c)] += c
    return norm(out) * v
def scratch(v=1): d = .6; tt = t_(d); return norm(bp(nz(d), 1200, 6000) * (np.sin(2 * np.pi * 9 * tt) > 0) * np.sin(np.pi * tt / d)) * v
def whoosh(d=.35, v=1):
    tt = t_(d); x = np.zeros_like(tt); src = nz(d); f = np.interp(tt, [0, d], [500, 2500]); blk = 1200
    for i in range(0, len(tt), blk): x[i:i + blk] = bp(src[max(0, i - 2400):i + blk], f[i] * .5, f[i] * 1.5)[-len(x[i:i + blk]):]
    return norm(x * np.sin(np.pi * tt / d) ** 2) * v
def wing(v=1): d = .3; tt = t_(d); return norm(lp(bp(nz(d), 150, 1200) * np.sin(np.pi * tt / d) ** 3, 900)) * v
# —— creatures (synthesised, no voices) ——
def mew(v=1, f0=820):
    d = .5; tt = t_(d); f = f0 * (1 + .25 * np.sin(np.pi * np.clip(tt / d, 0, 1))) * (1 - .15 * tt / d)
    ph = np.cumsum(f) / SR; src = sum(np.sin(2 * np.pi * k * ph) / k ** 1.2 for k in range(1, 9))
    form = bp(src, 700, 2600) + bp(src, 2800, 4200) * .5; e = np.sin(np.pi * tt / d) ** .8
    return norm(form * e) * v
def yowl(v=1):
    d = .9; tt = t_(d); f = 380 + 260 * np.sin(np.pi * tt / d) ** .5 + 30 * np.sin(2 * np.pi * 7 * tt)
    ph = np.cumsum(f) / SR; src = sum(np.sin(2 * np.pi * k * ph) / k for k in range(1, 12)); rough = 1 + .4 * np.sin(2 * np.pi * 55 * tt)
    return norm((bp(src, 500, 3200) + bp(nz(d), 1500, 4000) * .15) * rough * np.sin(np.pi * tt / d) ** .6) * v
def purr(d, v=1): tt = t_(d); return norm(lp(nz(d), 300) * (.5 + .5 * np.sin(2 * np.pi * 25 * tt)) * np.sin(np.pi * tt / d)) * v
def kitecry(v=1):
    d1, d2 = .55, .7; t1 = t_(d1); f1 = np.interp(t1, [0, .1, d1], [2100, 2600, 2150])
    s1 = np.sin(2 * np.pi * np.cumsum(f1) / SR) * np.minimum(1, t1 / .05) * np.exp(-t1 / .8)
    t2 = t_(d2); f2 = 1900 + 250 * np.sin(2 * np.pi * 9 * t2) - 300 * t2 / d2; s2 = np.sin(2 * np.pi * np.cumsum(f2) / SR) * np.sin(np.pi * t2 / d2) * .7
    y = np.zeros(int(1.5 * SR)); y[:len(s1)] += s1; k = int(.62 * SR); y[k:k + len(s2)] += s2; return norm(y) * v
def breath(d=.6, v=1, lo=500, hi=2500): tt = t_(d); return norm(bp(nz(d), lo, hi) * np.sin(np.pi * tt / d) ** 1.5) * v
def pant(d, v=1, deep=0):
    tt = t_(d); r = 4.5 if not deep else 2.6; e = np.abs(np.sin(np.pi * r * tt)) ** 2
    return norm(bp(nz(d), 700 if not deep else 300, 3000 if not deep else 1800) * e) * v
def gulp(v=1): d = .15; return norm(sines([300, 600], d, [.04, .02], [1, .3]) * np.sin(np.pi * t_(d) / d)) * v
def nibble(v=1): d = .06; return norm(hp(nz(d), 2500) * env_exp(d, .01) + sines([1800], d, [.008], [.5])) * v
# —— water, snow, bronze ——
def splash(v=1):
    d = 1.2; tt = t_(d); x = lp(nz(d), 6000) * np.exp(-tt / .25) + sines([70], d, [.08], [1.2]); drops = np.zeros_like(tt)
    for i in rng.integers(int(.15 * SR), len(tt) - 600, 40): drops[i:i + 500] += np.sin(2 * np.pi * (900 + rng.random() * 1500) * np.arange(500) / SR) * np.exp(-np.arange(500) / 120) * (rng.random() * .5)
    return norm(x + drops * .5) * v
def spray(v=1): d = .9; tt = t_(d); return norm(bp(nz(d), 1500, 9000) * np.exp(-tt / .3) * np.minimum(1, tt / .02) + lp(nz(d), 800) * np.exp(-tt / .15)) * v
def shake(d, v=1):
    tt = t_(d); m = (np.sin(2 * np.pi * 7 * tt) > 0) * np.sin(np.pi * tt / d); out = bp(nz(d), 800, 6000) * m * .6
    for i in rng.integers(0, len(tt) - 300, 30): out[i:i + 300] += np.exp(-np.arange(300) / 50) * rng.standard_normal() * .6
    return norm(hp(out, 600)) * v
def roofslide(d, v=1): tt = t_(d); return norm(lp(bp(nz(d), 200, 2500), 3000) * np.minimum(1, tt / .1) * (.6 + .4 * tt / d)) * v
def snowdump(v=1):
    d = 1.4; tt = t_(d); return norm(lp(nz(d), 1200) * np.exp(-tt / .35) * np.minimum(1, tt / .05) + sines([55, 80], d, [.2, .1], [1, .5])) * v
def bonsho(v=1, f0=196):   # bronze bell: inharmonic partials with beating, long decay
    d = 4.5; tt = t_(d); y = np.zeros_like(tt)
    for r, a, tau in [(.5, .8, 3.5), (1, 1, 3), (1.006, .7, 2.8), (2.13, .5, 1.6), (2.98, .35, 1), (4.1, .2, .6), (5.4, .12, .4)]: y += a * np.sin(2 * np.pi * f0 * r * tt) * np.exp(-tt / tau)
    y[:int(.01 * SR)] += lp(nz(.01), 3000) * .8; return norm(y) * v
def templebell(v=1): return lp(bonsho(v, 110), 1800)
def swish(d, v=1): tt = t_(d); return norm(bp(nz(d), 1500, 7000) * (.5 + .5 * np.abs(np.sin(2 * np.pi * 3 * tt))) * np.sin(np.pi * tt / d)) * v
def pop(v=1): d = .12; return norm(sines([700, 1400], d, [.03, .015], [1, .4])) * v
def scrabble(d, v=1): tt = t_(d); return norm(bp(nz(d), 800, 5000) * (rng.random(len(tt)) > .7) * (np.sin(2 * np.pi * 11 * tt) > -.2)) * v
def umbrella(v=1): d = .4; tt = t_(d); return norm(bp(nz(d), 300, 3000) * np.exp(-tt / .1) + lp(nz(d), 400) * np.exp(-tt / .05) * .5) * v
def fishfall(v=1): d = .6; return norm(whoosh(.6, 1) * .6 + np.concatenate([np.zeros(int(.45 * SR)), fishslap(.6)[:int(.15 * SR)]])) * v
def wavebuild(d, v=1):
    tt = t_(d); e = (tt / d) ** 1.4
    return norm(lp(brown(d), 380) * (.3 + .7 * e) + bp(nz(d), 600, 3000) * e ** 2 * .35 + np.sin(2 * np.pi * 42 * tt) * e * .2) * v
def crash(v=1):
    d = 2.2; tt = t_(d); x = lp(nz(d), 5000) * np.exp(-tt / .6) + sines([48, 70], d, [.5, .3], [1.2, .6]) + hp(nz(d), 3000) * np.exp(-tt / .25) * .5
    return norm(x) * v
def catch(v=1): return norm(np.concatenate([fishslap(1)[:int(.2 * SR)] * 1.2, np.zeros(int(.1 * SR))]) + np.concatenate([gulp(.5), np.zeros(int(.3 * SR) - len(gulp(.5)))])) * v
def sigh(v=1): return breath(1.2, v, 250, 1400)
# —— ambience ——
def wind(d, v=1, lo=150, hi=900, seed=1): return norm(bp(brown(d) + nz(d) * .02, lo, hi) * slow(d, .6, .6, seed)) * v
def chirps(d, rate, f0, f1, v=1):
    out = np.zeros(len(t_(d)))
    for t0 in np.cumsum(rng.exponential(1 / rate, int(d * rate * 2))):
        if t0 > d - .3: break
        for j in range(rng.integers(1, 4)):
            dd = .04 + rng.random() * .05; s = sweep(dd, f0 + rng.random() * 600, f1 + rng.random() * 800) * np.sin(np.pi * t_(dd) / dd); k = int((t0 + j * .08) * SR); n_ = len(out[k:k + len(s)]); out[k:k + n_] += s[:n_]
    return out * v
def crickets(d, v=1):
    tt = t_(d); car = np.sin(2 * np.pi * 4300 * tt) * (np.sin(2 * np.pi * 32 * tt) > .3) * (np.sin(2 * np.pi * .9 * tt) > -.2)
    car2 = np.sin(2 * np.pi * 3800 * tt) * (np.sin(2 * np.pi * 27 * tt + 1) > .4) * (np.sin(2 * np.pi * .6 * tt + 2) > 0)
    return (car + car2 * .7) * v
def water(d, v=1): tt = t_(d); return norm(bp(nz(d), 200, 1400) * (.4 + .6 * slow(d, 3, .8, 5)) + lp(brown(d), 300) * .4) * v
def amb(w, d):
    tt = t_(d)
    if w == 'dawn': return water(d, .35) + chirps(d, 1.2, 3000, 4800, .06) + lp(bp(nz(d), 300, 1200) * slow(d, 1.5, .7, 3), 900) * .08
    if w == 'rain':
        bed = hp(nz(d), 900) * .5 + bp(nz(d), 300, 2000) * .25; drops = np.zeros_like(tt)
        for i in rng.integers(0, len(tt) - 400, int(d * 60)): drops[i:i + 200] += np.exp(-np.arange(200) / 30) * (rng.random() - .5) * 3
        return norm(bed + hp(drops, 2500) * .4 + lp(brown(d), 300) * .4) * .6
    if w == 'snow': return wind(d, .35, 100, 500, 4) + bp(nz(d), 2000, 6000) * .01
    if w == 'field':
        frogs = np.zeros_like(tt)
        for t0 in np.arange(.3, d - .5, .9 + rng.random()):
            for j in range(3): dd = .05; s = np.sign(np.sin(2 * np.pi * 380 * t_(dd))) * np.sin(np.pi * t_(dd) / dd); k = int((t0 + j * .09) * SR); frogs[k:k + len(s)] += bp(s, 300, 1500)
        return wind(d, .45, 200, 1500, 3) + frogs * .05
    if w == 'mountain': return wind(d, .45, 250, 1600, 9) + wind(d, .3, 80, 300, 10)
    if w == 'sea':
        sw = .35 + .65 * (np.sin(2 * np.pi * tt / 4.2 - 1) * .5 + .5) ** 2
        return norm(lp(brown(d), 700) * sw + bp(nz(d), 800, 5000) * sw ** 3 * .4) * .75
    if w == 'dusk': return water(d, .3) + crickets(d, .025)
    return np.zeros_like(tt)

fx, ab = np.zeros((N, 2)), np.zeros((N, 2))
G = {'baren': .3, 'block': .28, 'slip': .16, 'seal': .45, 'peel': .18, 'scroll': .2, 'paw': .16, 'basket': .18, 'claws': .2, 'mew': .16, 'purr': .1, 'yawn': .2,
     'scratch': .1, 'fishslap': .35, 'drag': .14, 'gulp': .2, 'footturn': .3, 'whoosh': .3, 'wing': .4, 'snatch': .6, 'kitecry': .1, 'jaw': .3, 'yowl': .18, 'pole': .18,
     'umbrella': .4, 'thud': .45, 'shake': .3, 'breath': .12, 'roofslide': .3, 'bell': .55, 'snowdump': .6, 'swish': .22, 'splash': .5, 'pop': .2, 'pant': .14, 'scrabble': .18,
     'gasp': .14, 'wavebuild': .45, 'creak': .2, 'spray': .5, 'fishfall': .3, 'leap': .3, 'catch': .7, 'crash': .8, 'templebell': .12, 'nibble': .12, 'footsteps': .18,
     'sigh': .16, 'fishlay': .45, 'step': .16}
for e in E['ev']:
    t, ty, v = e['t'], e['type'], e.get('v', 1); g = G.get(ty, .2); pan = (rng.random() - .5) * .3
    if ty in ('sec', 'hit', 'shot'): continue
    if ty == 'amb':
        a = fade(amb(e['w'], e['d']), .5, .5); add(ab, a, t, {'sea': .32, 'rain': .3, 'dusk': .26}.get(e['w'], .24), 0); continue
    s = {'baren': lambda: baren(e.get('d', .36), v), 'block': lambda: block(v), 'slip': lambda: slip(v), 'seal': lambda: seal(v), 'peel': lambda: peel(v),
         'scroll': lambda: scroll(e['d'], v, e.get('fast', 0)), 'paw': lambda: paw(e.get('m', 'soft'), v), 'basket': lambda: basket(v), 'claws': lambda: claws(v),
         'mew': lambda: mew(v), 'purr': lambda: purr(e['d'], v), 'yawn': lambda: breath(e['d'], v, 300, 1600), 'scratch': lambda: scratch(v), 'fishslap': lambda: fishslap(v),
         'drag': lambda: drag(e['d'], v), 'gulp': lambda: gulp(v), 'footturn': lambda: step('wood', v), 'whoosh': lambda: whoosh(e.get('d', .35), v), 'wing': lambda: wing(v),
         'snatch': lambda: norm(wing(1) + np.pad(fishslap(1), (0, max(0, int(.3 * SR) - len(fishslap(1)))))[:int(.3 * SR)]) * v, 'kitecry': lambda: kitecry(v), 'jaw': lambda: thud(v * .6, 1)[:int(.1 * SR)],
         'yowl': lambda: yowl(v), 'pole': lambda: pole(v), 'umbrella': lambda: umbrella(v), 'thud': lambda: thud(v, e.get('wood', 0)), 'shake': lambda: shake(e['d'], v),
         'breath': lambda: breath(.7, v), 'roofslide': lambda: roofslide(e['d'], v), 'bell': lambda: bonsho(v), 'snowdump': lambda: snowdump(v), 'swish': lambda: swish(e['d'], v),
         'splash': lambda: splash(v), 'pop': lambda: pop(v), 'pant': lambda: pant(e['d'], v, e.get('deep', 0)), 'scrabble': lambda: scrabble(e['d'], v), 'gasp': lambda: breath(.4, v, 600, 3000),
         'wavebuild': lambda: wavebuild(e['d'], v), 'creak': lambda: creak(v), 'spray': lambda: spray(v), 'fishfall': lambda: fishfall(v), 'leap': lambda: whoosh(.5, v), 'catch': lambda: catch(v),
         'crash': lambda: crash(v), 'templebell': lambda: templebell(v), 'nibble': lambda: nibble(v), 'footsteps': lambda: np.concatenate([step('wood', v), np.zeros(int(.2 * SR)), step('wood', v * .8)]),
         'sigh': lambda: sigh(v), 'fishlay': lambda: fishslap(v * .7), 'step': lambda: step(e.get('m', 'wood'), v)}.get(ty)
    if s is None: print('no sound for', ty); continue
    add(fx, fade(s()), t, g, pan)
# —— the score ——
mu, msr = sf.read(os.path.join(HERE, 'music/score.wav'))
if mu.ndim == 1: mu = np.stack([mu, mu], 1)
mu = np.pad(mu[:N], ((0, max(0, N - len(mu[:N]))), (0, 0)))
# duck the music ~3 dB around the key foley hits so they read
duck = np.ones(N)
for k in ['hook', 'snatch', 'umbrella', 'bell', 'snowdump', 'splash', 'catch', 'crash', 'gift']:
    a, b = int((HIT[k] - .05) * SR), int((HIT[k] + .5) * SR); duck[a:b] = np.minimum(duck[a:b], .7)
duck = uniform_filter1d(duck, int(.12 * SR)); mu *= duck[:, None]
# the wave silence: ambience thins to almost nothing while the music is cut (only a far, thin wind)
def ramp(arr, t0, t1, g0, g1):
    a, b = int(t0 * SR), int(t1 * SR); arr[a:b] *= np.linspace(g0, g1, b - a)[:, None]
amb_g = np.ones((N, 1))
a, b = int(HIT['silence'] * SR), int((HIT['catch'] - .02) * SR); amb_g[a:a + int(.4 * SR)] = np.linspace(1, .12, int(.4 * SR))[:, None]; amb_g[a + int(.4 * SR):b] = .12
ab *= amb_g
fxg = np.ones((N, 1)); fxg[a + int(.4 * SR):b] = .15; fx *= fxg   # the wave roar recedes too
MIX = mu * 1.0 + fx * 1.5 + ab * 1.1
# the first ma: everything cut (wings sneak in as the only sound)
a0, b0 = int(HIT['stop'] * SR), int((HIT['snatch'] - .13) * SR)
MIX[a0:a0 + int(.04 * SR)] *= np.linspace(1, 0, int(.04 * SR))[:, None]; MIX[a0 + int(.04 * SR):b0] = (fx[a0 + int(.04 * SR):b0] * 1.4)
# the end: the last note rings out, then the room dies away
k = int((DUR - 1.6) * SR); MIX[k:] *= np.linspace(1, 0, N - k)[:, None] ** 1.5
# master: BS.1770 K-weighted loudness → −14.3 LUFS, then a look-ahead peak limiter at −1.6 dBFS (so loudnorm only trims)
from scipy.signal import lfilter
def kweight(x):
    b1, a1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1, -1.69065929318241, .73248077421585]
    b2, a2 = [1, -2, 1], [1, -1.99004745483398, .99007225036621]
    return lfilter(b2, a2, lfilter(b1, a1, x, axis=0), axis=0)
def lufs(x):
    k = kweight(x); blk = int(.4 * SR); hop = blk // 4; ms = np.array([np.mean(np.sum(k[i:i + blk] ** 2, 1)) for i in range(0, len(k) - blk, hop)])
    L = -.691 + 10 * np.log10(ms + 1e-12); g = ms[L > -70]; rel = -.691 + 10 * np.log10(g.mean()) - 10; g2 = ms[(L > -70) & (L > rel)]
    return -.691 + 10 * np.log10(g2.mean())
for _ in range(3):
    MIX *= 10 ** ((-14.1 - lufs(MIX)) / 20); MIX = limit(MIX, 10 ** (-3.0 / 20))
print('master', round(lufs(MIX), 2), 'LUFS, peak', round(20 * np.log10(np.abs(MIX).max()), 2), 'dBFS')
sf.write(os.path.join(HERE, 'mix.wav'), MIX.astype(np.float32), SR)
def db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
for name, (t0, t1) in {'A': (0, 29.3), 'B': (29.3, 38.7), 'C': (38.7, 77.3), 'C2': (77.3, 89.8), 'D': (89.8, 101.8), 'ma2': (102.2, 106.7), 'D2': (106.8, 112.8), 'E': (112.8, DUR)}.items():
    s = slice(int(t0 * SR), int(t1 * SR)); print(f'{name:4s} mix {db(MIX[s]):6.1f}  mu {db(mu[s]):6.1f}  fx {db(fx[s]):6.1f}  amb {db(ab[s]):6.1f}')
print('peak', np.abs(MIX).max())
