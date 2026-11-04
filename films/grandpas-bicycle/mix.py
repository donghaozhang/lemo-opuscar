# Foley and ambience synthesised from the page's events (events.json) + the score (out/score.wav) → out/mix.wav (48 kHz stereo).
# Usage, from the library root: .venv/bin/python films/grandpas-bicycle/mix.py
import json, os, sys, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, LIB)
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.ndimage import maximum_filter1d, uniform_filter1d
SR = 48000
E = json.load(open(os.path.join(HERE, 'events.json'))); DUR = E['dur']; EV = E['ev']; N = int(DUR * SR)
rng = np.random.default_rng(1104)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def noise(d): return rng.standard_normal(int(d * SR))
def pink(d):
    n = int(d * SR); w = np.fft.rfft(noise(d)); f = np.arange(len(w)); f[0] = 1
    return np.fft.irfft(w / np.sqrt(f), n) * 20
def norm(x, p=1.0): m = np.abs(x).max(); return x * (p / m) if m > 0 else x
def env(d, a, r, hold=0.0):
    t = np.arange(int(d * SR)) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.where(t < a + hold, 1, np.exp(-(t - a - hold) / max(r, 1e-4)))
def fade(x, fi, fo):
    n = len(x); e = np.ones(n); a = min(n // 2, int(fi * SR)); b = min(n // 2, int(fo * SR))
    if a: e[:a] = np.linspace(0, 1, a) ** 1.5
    if b: e[-b:] = np.minimum(e[-b:], np.linspace(1, 0, b) ** 1.5)
    return x * (e[:, None] if x.ndim == 2 else e)
def st(x, pan=0.0):
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    return np.stack([x * l * 1.414, x * r * 1.414], 1)
def sweep(x, p0, p1):   # a mono sound panned from p0 to p1 across its length
    n = len(x); p = np.linspace(p0, p1, n)
    return np.stack([x * np.cos((p + 1) * np.pi / 4) * 1.414, x * np.sin((p + 1) * np.pi / 4) * 1.414], 1)
IRn = int(1.4 * SR); IR = np.stack([noise(1.4), noise(1.4)], 1) * np.exp(-np.arange(IRn) / SR * 4.5)[:, None]
IR = np.stack([lp(IR[:, 0], 4500), lp(IR[:, 1], 4500)], 1); IR /= np.sqrt((IR ** 2).sum(0))
def verb(x2, wet=.22):
    y = np.stack([fftconvolve(x2[:, 0], IR[:, 0])[:len(x2)], fftconvolve(x2[:, 1], IR[:, 1])[:len(x2)]], 1)
    return x2 * (1 - wet) + y * wet
def dbfs(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
BUS = {'foley': np.zeros((N, 2)), 'amb': np.zeros((N, 2))}
def put(bus, t, x):
    i = int(t * SR); j = min(N, i + len(x))
    if j > i: BUS[bus][i:j] += x[:j - i]

# ---- the sounds ----
def brush(d, g, p0=-.5, p1=.5):      # a brush loaded with wash crossing the paper
    n = int(d * SR); p = np.arange(n) / n
    x = bp(noise(d), 1400, 6500) * (.6 + .4 * np.abs(np.sin(np.arange(n) / SR * 2 * np.pi * 8.5))) + bp(pink(d), 250, 1400) * .5
    return sweep(norm(x * np.sin(np.pi * p) ** .8, .5) * g, p0, p1)
def pencil(d, g):                    # pencil on paper: a gritty hiss with stroke pulses
    n = int(d * SR); t = np.arange(n) / SR
    pulses = (.45 + .55 * np.abs(np.sin(2 * np.pi * 5.5 * t + np.sin(t * 3)))) * (rng.random(n) < .9)
    x = bp(noise(d), 2500, 9000) * pulses * np.sin(np.pi * t / d) ** .5
    return verb(sweep(norm(x, .4) * g, -.2, .2), .08)
def pen(d, g):                       # a pen leader line: thinner, steadier
    n = int(d * SR); t = np.arange(n) / SR
    x = bp(noise(d), 3500, 11000) * (.7 + .3 * np.sin(2 * np.pi * 12 * t)) * np.sin(np.pi * t / d) ** .3
    return st(norm(x, .3) * g, .1)
def bell(g):                         # a bicycle bell: two strikes of a bright metal partial set with a long decay
    d = 2.2; n = int(d * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for f, a, dec in [(2150, 1.0, 1.6), (4300, .35, 1.0), (5600, .22, .7), (7100, .12, .5), (1080, .18, 1.2)]:
        x += a * np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) * np.exp(-t * (6.9 / dec))
    x += lp(noise(d), 3000) * env(d, .001, .02) * .8                       # the strike
    return verb(st(norm(x, .8) * g, .25), .28)
def page(g):                         # a journal page turned: a paper swish with a soft lift and settle
    d = .9; n = int(d * SR); t = np.arange(n) / SR
    x = bp(noise(d), 800, 5000) * (np.sin(np.pi * np.clip(t / .6, 0, 1)) ** 1.5) + bp(noise(d), 200, 1200) * env(d, .35, .12, .05) * .6
    x += lp(noise(d), 500) * env(d, .5, .06) * .4
    return verb(sweep(norm(x, .5) * g, .7, -.6), .2)
def cloth(g):                        # a rustle of cloth
    d = .35; x = bp(noise(d), 600, 4000) * env(d, .02, .1)
    return st(norm(x, .35) * g, rng.uniform(-.2, .2))
def thud(g, f=70):                   # a body on earth
    d = .5; n = int(d * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * np.cumsum(f * (1 + .8 * np.exp(-t * 40))) / SR) * np.exp(-t * 14) + lp(noise(d), 700) * env(d, .002, .05) * .7
    return verb(st(norm(x, .8) * g), .2)
def clatter(g):                      # a bicycle hitting the ground: frame clang, spoke rattle, a bounce
    d = 1.3; n = int(d * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for f, a, dec in [(640, 1, .35), (1310, .6, .3), (2250, .4, .22), (3800, .25, .15)]: x += a * np.sin(2 * np.pi * f * t * (1 + .002 * np.sin(t * 50))) * np.exp(-t * (6.9 / dec))
    x += bp(noise(d), 1500, 7000) * env(d, .003, .06) * 1.2
    imp = (rng.random(n) < 70 / SR) * rng.uniform(.3, 1, n) * np.exp(-t * 3)
    x += bp(np.convolve(imp, np.exp(-np.arange(200) / 30), 'same'), 2000, 8000) * 4
    b = int(.26 * SR); x[b:] += (np.sin(2 * np.pi * 640 * t[:n - b]) * np.exp(-t[:n - b] * 22)) * .5
    return verb(st(norm(x, .85) * g, .1), .22)
def sandal(g):
    d = .25; x = lp(noise(d), 1200) * env(d, .003, .04) + np.sin(2 * np.pi * 160 * np.arange(int(d * SR)) / SR) * env(d, .002, .06) * .5
    return st(norm(x, .5) * g, .2)
def tick(g):                         # a pedal clicking / a foot finding the pedal
    d = .12; x = bp(noise(d), 1500, 5000) * env(d, .001, .02) + np.sin(2 * np.pi * 900 * np.arange(int(d * SR)) / SR) * env(d, .001, .03) * .4
    return st(norm(x, .5) * g, .1)
def creak(g, d=.4):
    n = int(d * SR); t = np.arange(n) / SR
    f = 380 * (1 + .25 * np.sin(2 * np.pi * 7 * t)); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * (.6 + .4 * np.sin(2 * np.pi * 23 * t)) * np.sin(np.pi * t / d) ** 1.2
    x = bp(x + bp(noise(d), 300, 1500) * .3, 250, 2500)
    return st(norm(x, .3) * g, .05)
def steps(d, rate, g, fade_=False, pan=0.0):   # running / walking steps on packed earth
    n = int(d * SR); out = np.zeros(n); k = 0; tt = 0.0
    while tt < d:
        s = int(tt * SR); L = int(.11 * SR); seg_ = (lp(noise(.11), 900) * env(.11, .003, .035))[:max(0, min(L, n - s))]
        if len(seg_): out[s:s + len(seg_)] += seg_ * rng.uniform(.6, 1) * (1 - .6 * (k % 2))
        tt += 1 / rate * rng.uniform(.96, 1.04); k += 1
    e = np.ones(n) if not fade_ else np.linspace(1, .2, n)
    return st(norm(out, .45) * g * e, pan)
def chain(d, g, accel=False, slow=False, fade_=False):   # the chain's tick and the freewheel: a sparse click train whose rate follows the speed
    n = int(d * SR); out = np.zeros(n); tt = 0.0; t_ = np.arange(n) / SR
    while tt < d:
        sp = .55 + .45 * (tt / d) if accel else (.35 if slow else .7)
        s = int(tt * SR); L = int(.02 * SR); seg_ = (bp(noise(.02), 2500, 8000) * env(.02, .0005, .004))[:max(0, min(L, n - s))]
        if len(seg_): out[s:s + len(seg_)] += seg_ * rng.uniform(.5, 1)
        tt += (1 / (14 * sp)) * rng.uniform(.9, 1.1)
    out += bp(pink(d), 900, 3000) * .06 * (np.linspace(.6, 1, n) if accel else 1)
    e = np.ones(n) if not fade_ else np.linspace(1, .15, n)
    return st(norm(out, .4) * g * e, .05)
def breath(g):
    d = .6; x = bp(noise(d), 300, 2500) * np.sin(np.pi * np.arange(int(d * SR)) / (d * SR)) ** 1.5
    return st(norm(x, .25) * g)
def swish(g):                        # an arm waving: a soft air swish
    d = .4; x = bp(noise(d), 400, 3000) * np.sin(np.pi * np.arange(int(d * SR)) / (d * SR)) ** 2
    return sweep(norm(x, .3) * g, -.3, .3)
def grip(g):                         # a hand closing on leather
    d = .3; x = bp(noise(d), 500, 3500) * env(d, .01, .06) * (rng.random(int(d * SR)) < .7)
    return st(norm(x, .35) * g, .1)
def release(g):                      # fingers opening: a small leather creak and air
    d = .5; n = int(d * SR); t = np.arange(n) / SR
    x = bp(noise(d), 700, 4000) * env(d, .02, .12) * (.5 + .5 * np.sin(2 * np.pi * 30 * t))
    return st(norm(x, .3) * g, .1)
def strap(g):
    d = .45; n = int(d * SR); t = np.arange(n) / SR
    x = bp(noise(d), 1200, 6000) * np.sin(np.pi * t / d) ** .6 * (.6 + .4 * np.sin(2 * np.pi * 40 * t)) + lp(noise(d), 500) * env(d, .3, .05, .02) * .8
    return st(norm(x, .4) * g, .1)
def pat(g):
    d = .2; x = lp(noise(d), 1500) * env(d, .002, .04) + np.sin(2 * np.pi * 120 * np.arange(int(d * SR)) / SR) * env(d, .002, .05) * .6
    return st(norm(x, .5) * g)
def stickwall(g):                    # a cane set against a wall: wood on plaster
    d = .35; n = int(d * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * 820 * t) * np.exp(-t * 40) + np.sin(2 * np.pi * 1900 * t) * np.exp(-t * 60) * .4 + lp(noise(d), 1800) * env(d, .002, .03)
    return verb(st(norm(x, .5) * g, -.2), .2)
def stamp(g):
    d = .7; n = int(d * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * np.cumsum(95 * (1 + .5 * np.exp(-t * 30))) / SR) * np.exp(-t * 10) + lp(noise(d), 800) * env(d, .002, .05) * .6
    return verb(st(norm(x, .7) * g, .3), .25)
def lift(g):                         # the lift: cloth, a breath and a settle
    return cloth(g) + np.pad(breath(g * .8), ((0, int(.35 * SR) - 0), (0, 0)))[:len(cloth(g))] if False else cloth(g)
def mist(d, g):
    n = int(d * SR); p = np.arange(n) / n
    x = bp(pink(d), 250, 4000) * np.sin(np.pi * p) ** 1.3
    return st(norm(x, .4) * g)
def wind(d, g, dark=False):
    n = int(d * SR); t = np.arange(n) / SR
    gust = .5 + .5 * np.sin(2 * np.pi * .17 * t + 1) * np.sin(2 * np.pi * .07 * t + .5)
    a = lp(pink(d), 400 if dark else 700) * gust + bp(noise(d), 500, 1800) * (.03 if dark else .06) * gust
    b = lp(pink(d), 400 if dark else 700) * np.roll(gust, int(.3 * SR))
    return fade(np.stack([norm(a, .5), norm(b, .5)], 1) * g, 2.5, 3)
def cicadas(d, g):                   # summer cicadas: a few insects, each a buzz with its own rhythm, far left and right
    n = int(d * SR); t = np.arange(n) / SR; out = np.zeros((n, 2))
    for k in range(4):
        f = rng.uniform(3800, 5200); r = rng.uniform(.9, 1.6); pan_ = rng.choice([-.8, -.5, .5, .8])
        amp = (np.sin(2 * np.pi * r * t + k) * .5 + .5) ** 2 * (np.sin(2 * np.pi * .05 * t + k * 2) * .5 + .5)
        buzz = np.sin(2 * np.pi * f * t + 3 * np.sin(2 * np.pi * 110 * t)) * (.5 + .5 * np.sin(2 * np.pi * 95 * t)) * amp
        out += st(bp(buzz, 2500, 8000) * rng.uniform(.5, 1), pan_)
    return fade(norm(out, .4) * g, 2, 3)
def sparrows(d, g):
    n = int(d * SR); out = np.zeros((n, 2)); k = 0
    while k < d * 2.2:
        tt = rng.uniform(0, d - .2); c = .07; m = int(c * SR); t = np.arange(m) / SR
        f = rng.uniform(2800, 4200) * (1 + .3 * np.sin(2 * np.pi * 55 * t)) * (1 + .6 * t); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / c) ** 2
        s = int(tt * SR); out[s:s + m] += st(x * rng.uniform(.04, .09), rng.uniform(-.8, .8))[:n - s]; k += 1
    return verb(fade(out * g, 1, 2), .2)
def birds(d, g):                     # spring songbirds: short phrases of 3–5 whistled notes
    n = int(d * SR); out = np.zeros((n, 2)); tt = 1.0
    while tt < d - 2:
        base = rng.uniform(2200, 3600); pan_ = rng.uniform(-.7, .7)
        for i in range(rng.integers(3, 6)):
            c = rng.uniform(.08, .16); m = int(c * SR); t = np.arange(m) / SR
            f = base * rng.choice([1, 1.12, 1.25, .9]) * (1 + .15 * np.sin(2 * np.pi * 30 * t)); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / c) ** 1.5
            s = int(tt * SR); out[s:s + m] += st(x * rng.uniform(.05, .1), pan_)[:n - s]; tt += c + rng.uniform(.04, .12)
        tt += rng.uniform(1.5, 4)
    return verb(fade(out * g, 1, 2), .25)
def clock(d, g):
    n = int(d * SR); out = np.zeros(n); tt = 0.0
    while tt < d:
        s = int(tt * SR); c = .05; m = int(c * SR); t = np.arange(m) / SR
        out[s:s + m] += (np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 90) + lp(noise(c), 2000) * env(c, .001, .01) * .5)[:n - s] * (1 if int(tt) % 2 == 0 else .7)
        tt += 1.0
    return verb(st(norm(out, .3) * g, -.4), .3)
def train(g):                        # a distant train: a low rumble with a faint two-tone horn
    d = 6.0; n = int(d * SR); t = np.arange(n) / SR
    x = lp(pink(d), 220) * np.sin(np.pi * t / d) ** 1.5
    horn = (np.sin(2 * np.pi * 311 * t) + np.sin(2 * np.pi * 370 * t) * .7) * np.exp(-((t - 2.2) / .5) ** 2) * .25
    return verb(st(norm(x, .5) * g + lp(horn, 1500) * g, -.6), .4)
def petal(g): return st(bp(noise(.1), 2000, 6000) * env(.1, .01, .03) * g * .3)

# ---- lay the events down ----
AMB = {'cicada': lambda e: cicadas(e['dur'], e.get('v', .5)), 'sparrows': lambda e: sparrows(e['dur'], e.get('v', .4)), 'birds': lambda e: birds(e['dur'], e.get('v', .45)),
       'autumnwind': lambda e: wind(e['dur'], e.get('v', .5)), 'winterwind': lambda e: wind(e['dur'], e.get('v', .5), dark=True), 'springbreeze': lambda e: wind(e['dur'], e.get('v', .3)),
       'wind': lambda e: wind(e['dur'], e.get('v', .3)), 'clock': lambda e: clock(e['dur'], e.get('v', .25)), 'train': lambda e: train(e.get('v', .25))}
FOL = {'brush': lambda e: brush(e['dur'], e.get('v', .5), e.get('pan', -.5), e.get('pan1', e.get('pan', -.5) + 1.0)), 'pencil': lambda e: pencil(e['dur'], e.get('v', .5)), 'pen': lambda e: pen(e['dur'], e.get('v', .4)),
       'bell': lambda e: bell(e.get('v', 1)), 'page': lambda e: page(.6), 'cloth': lambda e: cloth(e.get('v', .4)), 'thud': lambda e: thud(e.get('v', .7)), 'clatter': lambda e: clatter(e.get('v', .8)),
       'sandal': lambda e: sandal(e.get('v', .5)), 'tick': None, 'creak': lambda e: creak(e.get('v', .4), e.get('dur', .4)), 'steps': lambda e: steps(e['dur'], e.get('rate', 4), e.get('v', .4), e.get('fade', 0), e.get('pan', 0)),
       'chain': lambda e: chain(e['dur'], e.get('v', .3), e.get('accel', 0), e.get('slow', 0), e.get('fade', 0)), 'breath': lambda e: breath(e.get('v', .3)), 'wave': lambda e: swish(e.get('v', .25)),
       'grip': lambda e: grip(e.get('v', .5)), 'release': lambda e: release(e.get('v', .5)), 'strap': lambda e: strap(e.get('v', .6)), 'pat': lambda e: pat(e.get('v', .5)), 'stickwall': lambda e: stickwall(e.get('v', .5)),
       'stamp': lambda e: stamp(e.get('v', .6)), 'mist': lambda e: mist(e['dur'], e.get('v', .4)), 'lift': lambda e: cloth(e.get('v', .4)), 'petal': lambda e: petal(e.get('v', .15)), 'glock': None, 'cut': None}
DUCK = np.zeros(N)   # the score steps back under the bell, the clatters and the page turns
for e in EV:
    ty = e['type']
    if ty == 'tick':
        for k in range(int(e.get('n', 1))): put('foley', e['t'] + k * e.get('gap', .2), tick(e.get('v', .3)))
        continue
    fn = FOL.get(ty) if ty in FOL else AMB.get(ty)
    if fn is None:
        if ty not in FOL and ty not in AMB: print('no sound for', ty)
        continue
    x = fn(e); put('foley' if ty in FOL else 'amb', e['t'], x)
    if ty in ('bell', 'clatter', 'thud', 'page', 'stamp'):
        a = max(0, int((e['t'] - .08) * SR)); b = min(N, int((e['t'] + (1.4 if ty == 'bell' else .7)) * SR)); DUCK[a:b] = np.maximum(DUCK[a:b], {'bell': .45, 'clatter': .5, 'thud': .4, 'page': .35, 'stamp': .3}[ty])
DUCK = lp(uniform_filter1d(DUCK, int(.25 * SR)), 6)

# ---- the score, and the balance ----
mus, sr = sf.read(os.path.join(HERE, 'out', 'score.wav')); assert sr == SR
mus = mus[:N]; mus = np.pad(mus, ((0, N - len(mus)), (0, 0)))
mus *= (1 - DUCK)[:, None]
fol, amb = BUS['foley'], BUS['amb']
# levels: the score carries the film; the foley sits a little under it, the ambience well under
mus_db, fol_db, amb_db = dbfs(mus[int(11 * SR):int(48 * SR)]), dbfs(fol), dbfs(amb)
mus *= 10 ** ((-22 - mus_db) / 20)
fol *= 10 ** ((-30 - fol_db) / 20)
amb *= 10 ** ((-36 - amb_db) / 20)
def limit(x, ceil):
    pk = maximum_filter1d(np.abs(x), int(.005 * SR)); g = np.minimum(1, ceil / (pk + 1e-9)); g = lp(uniform_filter1d(g, int(.004 * SR)), 300); return x * np.clip(g, 0, 1)
fol = np.stack([limit(fol[:, 0], .6), limit(fol[:, 1], .6)], 1)
mix = mus + fol + amb
pk = np.abs(mix).max(); mix = mix / max(pk, 1e-9) * .89
print('music', round(dbfs(mus), 1), 'foley', round(dbfs(fol), 1), 'ambience', round(dbfs(amb), 1), 'mix', round(dbfs(mix), 1), 'peak', round(20 * np.log10(np.abs(mix).max()), 1), 'dBFS')
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR, subtype='FLOAT')
