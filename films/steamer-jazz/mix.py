"""mix.py — Foley by material (synthesised) + ambience beds + the score → optical-soundtrack pass → out/mix.wav (48 kHz stereo).
Materials: wood = woodblock / thock; metal = clanks, bells, ratchet; porcelain = hard inharmonic partials; dough = squish; steam / water =
filtered noise + bubbles; snow = crunch; paper = rustle; springs = boing. Silences ('silence' events, the band stops) keep only the
projector bed. Optical pass: band-limit 110 Hz–6.2 kHz, wow 0.6 Hz, flutter 7 Hz, soft saturation; then hiss, crackle, 24 Hz gate clatter.
Run: $LIB/.venv/bin/python films/steamer-jazz/mix.py"""
import os, sys, json, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '../..'))
sys.path.insert(0, ROOT)
from core.audio import sfx as X   # noqa: E402
SR = 48000
E = json.load(open(os.path.join(HERE, 'events.json'))); DUR = E['dur']; EV = E['ev']; N = int(round(DUR * SR))
TL = json.load(open(os.path.join(HERE, 'timeline.json')))
R = np.random.default_rng(5)
def t_(d): return np.arange(max(1, int(round(d * SR)))) / SR
def ex(d, tau): return np.exp(-t_(d) / tau)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x, axis=0)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x, axis=0)
def bp(x, a, b, o=2): return sosfilt(butter(o, [a, b], 'band', fs=SR, output='sos'), x, axis=0)
def nz(d): return R.standard_normal(len(t_(d)))
def norm(x, p=1.0): m = np.abs(x).max(); return x * (p / m) if m > 0 else x
def sine(f, d): f = np.broadcast_to(np.asarray(f, float), t_(d).shape); return np.sin(2 * np.pi * np.cumsum(f) / SR)
def glide(f0, f1, d): return f0 * (f1 / f0) ** (t_(d) / d)
FX = np.zeros((N, 2)); AMB = np.zeros((N, 2))
def put(bus, x, at, g=1.0, pan=0.0):
    s = int(round(at * SR)); x = np.asarray(x, float) * g
    if s >= N: return
    x = x[:N - s]; l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    bus[s:s + len(x), 0] += x * l * 1.414; bus[s:s + len(x), 1] += x * r * 1.414
# —— materials ——
def woodblock(f=900, d=.12): return norm(sine(f, d) * ex(d, .025) + bp(nz(d), f * .8, f * 2.5) * ex(d, .006) * .6)
def thock(f=180, d=.2): return norm(sine(f * (1 + .6 * np.exp(-t_(d) / .01)), d) * ex(d, .05) + bp(nz(d), 300, 2000) * ex(d, .01) * .5)
def porcelain(d=.5, k=1.0): return norm(sum(a * sine(f * k, d) * ex(d, tau) for f, a, tau in [(2700, 1, .12), (4200, .6, .08), (6300, .35, .05)]) + hp(nz(d), 3000) * ex(d, .003) * .4)
def clank(d=.4, k=1.0): return norm(sum(a * sine(f * k, d) * ex(d, tau) for f, a, tau in [(520, 1, .15), (1310, .6, .1), (2380, .4, .07), (3700, .25, .05)]) + bp(nz(d), 1500, 6000) * ex(d, .004) * .6)
def squish(d=.25): return norm(lp(nz(d), 900) * np.sin(np.pi * t_(d) / d) ** .7 + sine(glide(140, 90, d), d) * ex(d, .06) * .5)
def puff(d=.5, lo=600, hi=4000): return norm(bp(nz(d), lo, hi) * np.sin(np.pi * t_(d) / d) ** 1.5)
def bubbles(d=1.0):
    out = np.zeros(len(t_(d)))
    for k in range(int(d * 18)): a = int(R.random() * (len(out) - 2400)); b = sine(glide(400 + R.random() * 500, 1200 + R.random() * 900, .04), .04) * ex(.04, .012); out[a:a + len(b)] += b
    return norm(out + bp(nz(d), 300, 1800) * .3)
def crunch(d=.18): return norm(bp(nz(d), 1500, 7000) * (R.random(len(t_(d))) < .35) * ex(d, .06) + lp(nz(d), 500) * ex(d, .03) * .5)
def rustle(d=.4): return norm(bp(nz(d), 2000, 8000) * (R.random(len(t_(d))) < .4) * np.sin(np.pi * t_(d) / d))
def boing(f=220, d=.5): tt = t_(d); fr = f * (1 + .9 * np.exp(-tt * 9)) * (1 + .12 * np.sin(2 * np.pi * 18 * tt) * np.exp(-tt * 3)); return norm(sine(fr, d) * np.exp(-tt * 4.5))
def bell(d=1.8): return norm(sum(a * sine(f, d) * ex(d, tau) for f, a, tau in [(1180, 1, .8), (2950, .5, .5), (4400, .3, .3)]))
def whoosh(d=.35): return norm(bp(nz(d), 500, 3000) * np.sin(np.pi * t_(d) / d) ** 2)
def slidew(f0, f1, d): return norm(sine(glide(f0, f1, d), d) * np.minimum(1, t_(d) / .03) * np.minimum(1, (d - t_(d)) / .05))
def seq(parts, d):
    out = np.zeros(int(d * SR) + 1)
    for o, x in parts: a = int(o * SR); out[a:a + len(x)] += x[:len(out) - a]
    return out
REC = {
    'snowtick': lambda e: (porcelain(.3, 1.6), .08, 0), 'puff': lambda e: (puff(.6, 300, 2000), .14, .2), 'window': lambda e: (puff(.5, 2000, 6000), .05, 0),
    'dough': lambda e: (squish(.22), .3, -.2), 'yawn': lambda e: (puff(1.0, 300, 1200), .12, -.2), 'whoosh': lambda e: (whoosh(.3), .25 * e.get('g', 1), 0),
    'flop': lambda e: (seq([(0, squish(.3)), (.02, thock(110, .25) * .6)], .35), .45, -.1), 'snore': lambda e: (norm(lp(nz(1.1), 350) * (1 + .5 * np.sign(np.sin(2 * np.pi * 26 * t_(1.1)))) * np.sin(np.pi * t_(1.1) / 1.1) ** 2), .22 if not e.get('small') else .1, -.1),
    'eye': lambda e: (woodblock(1500, .08), .3, .2), 'stretch': lambda e: (seq([(0, boing(160, .4))], .5), .2, 0), 'inhale': lambda e: (puff(1.2, 400, 2500), .18, .2), 'exhale': lambda e: (puff(.9, 500, 3000), .2, .2),
    'tap': lambda e: (woodblock(1100, .1), .45, .1), 'roll': lambda e: (norm(lp(nz(.45), 500) * (1 + .4 * np.sin(2 * np.pi * 30 * t_(.45))) * np.sin(np.pi * t_(.45) / .45)), .3 * e.get('g', 1), -.1),
    'chop': lambda e: (seq([(0, clank(.18, 1.3) * .6), (0, thock(240, .12))], .2), .26, .2), 'pleat': lambda e: (squish(.12), .22, .1), 'hopin': lambda e: (seq([(0, squish(.1)), (.05, woodblock(700, .1) * .5)], .2), .25, .3),
    'lid': lambda e: (seq([(0, woodblock(520, .1)), (0, thock(300, .1) * .4)], .14), .3, .3), 'pour': lambda e: (bubbles(e.get('d', 1.0)), .18, .35), 'plate': lambda e: (porcelain(.5), .3, .2),
    'rub': lambda e: (norm(sine(glide(900, 1400, .6), .6) * (np.sin(2 * np.pi * 9 * t_(.6)) > 0) * .5 + bp(nz(.6), 2000, 6000) * .4), .14, 0),
    'growl': lambda e: (norm(lp(nz(.9), 220) * (1 + np.sin(2 * np.pi * 7 * t_(.9))) * np.sin(np.pi * t_(.9) / .9)), .4 * e.get('g', 1), 0),
    'morph': lambda e: (slidew(500, 1400, .5), .12, 0), 'sniff': lambda e: (seq([(0, puff(.08, 1500, 6000)), (.12, puff(.08, 1500, 6000))], .22), .2, .4),
    'tiptoe': lambda e: (woodblock(1800, .07), .22, .4), 'grab': lambda e: (squish(.15), .3, .3), 'whistle': lambda e: (norm(sine(2100 * (1 + .01 * np.sin(2 * np.pi * 6 * t_(1.2))), 1.2) * np.minimum(1, t_(1.2) / .05) + bp(nz(1.2), 1800, 2600) * .3), .12, .3),
    'scamper': lambda e: (seq([(i * .05, woodblock(1600 + i * 80, .04)) for i in range(4)], .25), .16, .3), 'basket': lambda e: (woodblock(480, .12), .25, .2),
    'topple': lambda e: (seq([(i * .09, woodblock(400 + (i % 3) * 90, .14)) for i in range(10)], 1.2), .35, -.1), 'door': lambda e: (seq([(0, thock(90, .4)), (0, woodblock(300, .2) * .5)], .45), .5, -.3),
    'tumble': lambda e: (seq([(i * .16, squish(.12) * (1 - i * .06)) for i in range(9)], 1.6), .25, 0), 'bunsnow': lambda e: (seq([(0, squish(.1)), (0, crunch(.12) * .6)], .2), .25, .1),
    'catch': lambda e: (seq([(0, squish(.1)), (.01, woodblock(1000, .06) * .3)], .15), .3, .1), 'skid': lambda e: (norm(bp(nz(.8), 2500, 8000) * ex(.8, .4) + slidew(1800, 700, .8) * .4), .25, .3),
    'breath': lambda e: (puff(1.0, 400, 2000), .12, 0), 'tick': lambda e: (woodblock(1300, .07), .35, (-.3 if R.random() > .5 else .3)), 'crunch': lambda e: (crunch(.2), .35, 0),
    'knock': lambda e: (thock(160, .25), .7, -.1), 'dooropen': lambda e: (norm(lp(sine(glide(260, 180, .9), .9) * (np.sin(2 * np.pi * 23 * t_(.9)) > -.3), 1500) * np.sin(np.pi * t_(.9) / .9)), .14, -.2),
    'bunhop': lambda e: (seq([(0, squish(.1)), (.04, woodblock(900, .06) * .4)], .15), .25, 0), 'tear': lambda e: (puff(.5, 1000, 4000), .1, 0), 'give': lambda e: (porcelain(.4, .8), .18, 0),
    'ratchet': lambda e: (seq([(i * .045, clank(.04, 2.0)) for i in range(5)], .25), .2, -.2), 'swell': lambda e: (puff(e.get('d', 1.8), 2000, 7000) * np.linspace(0, 1, len(t_(e.get('d', 1.8)))), .08, 0),
    'spin': lambda e: (seq([(i * .09, woodblock(2000, .03)) for i in range(int(e.get('d', 1.8) / .09))], e.get('d', 1.8) + .1), .12, -.2),
    'ring': lambda e: (np.concatenate([bell(.1) * (np.sin(2 * np.pi * 18 * t_(.1)) > 0) for _ in range(int(e.get('d', 1.9) / .1))]) if False else norm(bell(e.get('d', 1.9)) * (.6 + .4 * np.sign(np.sin(2 * np.pi * 18 * t_(e.get('d', 1.9)))))), .4, 0),
    'take': lambda e: (slidew(400, 1800, .25), .14, 0), 'boing': lambda e: (boing(240, .5), .2, 0), 'pat': lambda e: (seq([(0, puff(.06, 600, 3000)), (.12, puff(.06, 600, 3000))], .2), .3, .1),
    'run': lambda e: (crunch(.12), .25, (-.2 if R.random() > .5 else .2)), 'paper': lambda e: (rustle(.5), .3, 0), 'print': lambda e: (seq([(0, thock(220, .1)), (0, rustle(.08) * .5)], .12), .3, 0),
    'shuffle': lambda e: (crunch(.15), .15 * e.get('g', 1), 0), 'knead': lambda e: (squish(.2), .3, 0), 'wink': lambda e: (seq([(0, porcelain(.3, 1.4))], .3), .12, .2),
    'iris': lambda e: (seq([(0, thock(90, .3)), (0, whoosh(.25) * .5)], .35), .35, 0),
}
for e in EV:
    ty = e['type']
    if ty in ('bed', 'silence', 'ticking'): continue
    if ty not in REC: print('no recipe', ty); continue
    x, g, pan = REC[ty](e); put(FX, x, e['t'], g, pan)
# the clock ticking once it is wound (wood, alternating)
for e in EV:
    if e['type'] == 'ticking':
        t = e['t']
        while t < e['t1']: put(FX, woodblock(1500 if int(t * 2) % 2 else 1200, .05), t, .15, .3); t += .5
# —— ambience beds ——
for e in EV:
    if e['type'] != 'bed': continue
    t0, t1, g = e['t'], e['t1'], e['gain']; d = t1 - t0; n = len(t_(d))
    if e['name'] == 'wind': x = bp(R.standard_normal(n), 200, 1200) * (.6 + .4 * np.sin(2 * np.pi * .13 * t_(d) + R.random() * 6)) * .5
    elif e['name'] == 'stove': x = hp(R.standard_normal(n), 2000) * (R.random(n) < .002) * 4 + lp(R.standard_normal(n), 300) * .15
    else: x = bp(R.standard_normal(n), 400, 3000) * .15 + np.concatenate([np.zeros(0), sum(sine(2400 + k * 300, d) * (np.sin(2 * np.pi * (3 + k) * t_(d)) > .97) for k in range(3)) * .2])   # morning lane: bustle + a few birds
    fade = np.minimum(1, np.minimum(t_(d) / .3, (d - t_(d)) / .3)); put(AMB, x * fade, t0, g * .35, 0)
# —— score ——
mus, sr = sf.read(os.path.join(HERE, 'music', 'score.wav')); assert sr == SR
MUS = np.zeros((N, 2)); MUS[:min(N, len(mus))] = mus[:N]
bus = MUS * 1.0 + FX * .9 + AMB
# silences: everything off except the projector bed
for e in EV:
    if e['type'] == 'silence': bus[int(e['t'] * SR):int(e['t1'] * SR)] = 0
for g0, g1, _ in json.load(open(os.path.join(HERE, 'music', 'score.json')))['gates'][:1]:   # the band stop: Foley too, except the whistle
    pass
# —— optical soundtrack pass ——
def optical(x):
    y = np.stack([hp(lp(x[:, c], 6200, 2), 110, 2) for c in range(2)], 1)
    tt = np.arange(N) / SR; dl = (.00035 * np.sin(2 * np.pi * .6 * tt) + .00008 * np.sin(2 * np.pi * 7 * tt)) * SR
    idx = np.clip(np.arange(N) - 40 + dl, 0, N - 1); i0 = idx.astype(int); fr = idx - i0; i1 = np.minimum(i0 + 1, N - 1)
    y = y[i0] * (1 - fr)[:, None] + y[i1] * fr[:, None]
    return np.tanh(y * 1.4) / np.tanh(1.4)
out = optical(bus)
hiss = bp(R.standard_normal(N), 800, 6000) * .0035
crk = np.zeros(N)
for p in (R.random(int(DUR * 9)) * (N - 200)).astype(int): L_ = R.integers(8, 60); crk[p:p + L_] += R.standard_normal(L_) * np.exp(-np.arange(L_) / 10) * (.02 + R.random() * .05)
crk = hp(crk, 900); proj = np.zeros(N); per = SR / 24
for k in range(int(DUR * 24)): s = int(k * per); c = hp(R.standard_normal(200), 1500) * np.exp(-np.arange(200) / 30); proj[s:s + 200] += c[:max(0, min(200, N - s))] * .012
proj += lp(R.standard_normal(N), 180) * .006
out[:, 0] += hiss + crk + proj; out[:, 1] += hiss * .9 + crk + proj * .95
# peak limiter (lookahead), so loudnorm can meet the true-peak target
from scipy.ndimage import maximum_filter1d, uniform_filter1d
out = out / np.abs(out).max()
env = maximum_filter1d(np.abs(out).max(axis=1), int(.01 * SR)); gg = np.minimum(1, .45 / np.maximum(env, 1e-6)); gg = -maximum_filter1d(-gg, int(.01 * SR)); gg = uniform_filter1d(gg, int(.006 * SR))
out = out * gg[:, None]; out = out / np.abs(out).max() * .89
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), out.astype(np.float32), SR, subtype='FLOAT')
def db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
print('mix.wav', DUR, 's · music', round(db(MUS), 1), 'dB · foley', round(db(FX), 1), 'dB · amb', round(db(AMB), 1), 'dB')
