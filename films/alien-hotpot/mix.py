"""Mix: procedural foley (events.json) + gibberish voices (voices/) + score (music/score.wav, ducked under dialogue) + ambience beds per place → out/mix.wav
Usage: python mix.py   (after events.mjs, voice.py, music/score.py)"""
import sys, os, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); LIB = os.environ.get('LIB', os.path.join(HERE, '../..'))
sys.path.insert(0, os.path.join(LIB, 'core/audio'))
from sfx import SR, t_, env_exp, bp, lp, hp, noise, norm, click, clack, whoosh, pop, ding, thump, creak, compress, limit
from scipy.ndimage import uniform_filter1d
E = json.load(open(os.path.join(HERE, 'events.json'))); DUR = E['dur']; N = int(DUR * SR)
rng = np.random.default_rng(7)
def nz(d): return rng.standard_normal(int(round(d * SR)))
def sweep(f0, f1, d, c=1.):
    tt = t_(d); f = f0 * (f1 / f0) ** ((tt / d) ** c); return np.sin(2 * np.pi * np.cumsum(f) / SR)
def fade(x, a=.005, r=.02):
    x = x.copy(); n = len(x); A, R = min(n, int(a * SR)), min(n, int(r * SR)); x[:A] *= np.linspace(0, 1, A); x[n - R:] *= np.linspace(1, 0, R); return x
def bpsweep(x, f0, f1, q=.35):
    out = np.zeros_like(x); n = len(x)
    for i in range(0, n, 480):
        f = f0 * (f1 / f0) ** (i / n); s = bp(x[max(0, i - 2400):i + 480], f * (1 - q), min(f * (1 + q), 20000)); out[i:i + 480] = s[-len(out[i:i + 480]):]
    return out
def cat(*xs): return np.concatenate(xs)
def S(*xs):
    n = max(len(x) for x in xs); return sum(np.pad(x, (0, n - len(x))) for x in xs)
def pad_(x, d): return np.pad(x, (0, max(0, int(d * SR) - len(x))))

# —— foley ——
def metal(f=2200, d=.5, v=1.):
    tt = t_(d); x = sum(np.sin(2 * np.pi * f * r * tt) * np.exp(-tt / (d * k)) for r, k in [(1, .35), (2.76, .18), (5.4, .09), (8.9, .05)])
    return norm(x + bp(nz(d), 3000, 9000) * np.exp(-tt / .003) * .5) * v
def clink(): return metal(2600, .6)
def roll():
    d = .8; tt = t_(d); x = bp(nz(d), 1500, 5000) * (.5 + .5 * np.sin(2 * np.pi * (14 + 10 * tt) * tt)) ** 4 * np.linspace(1, .4, len(tt)); return norm(x) * .5
def drop(): return norm(cat(metal(2400, .25), metal(2500, .2) * .5, metal(2550, .3) * .3))
def flap(): d = .18; return norm(bp(nz(d), 300, 2500) * np.sin(np.pi * t_(d) / d) ** 2)
def sigh(): d = 1.0; tt = t_(d); return norm(bp(nz(d), 300, 1800) * np.sin(np.pi * tt / d) ** 2 * np.exp(-tt / .6)) * .5
def whine(): d = 3.0; tt = t_(d); return norm(sweep(1800, 220, d, .7) * (1 + .3 * np.sin(2 * np.pi * 11 * tt)) * np.linspace(.3, 1, len(tt)) + bp(nz(d), 500, 3000) * np.linspace(0, .5, len(tt)))
def sparks(): d = .5; x = hp(nz(d), 4000) * (rng.random(int(d * SR)) > .985) * 4; return norm(lp(x, 12000) * env_exp(d, .2))
def rattle(): return norm(S(*[np.pad(metal(3000 + 400 * k, .12), (int(k * .07 * SR), 0)) for k in range(8)]))
def impact():
    d = 2.2; tt = t_(d)
    boom = np.sin(2 * np.pi * np.cumsum(42 + 90 * np.exp(-tt / .08)) / SR) * np.exp(-tt / .5)
    crunch = bp(nz(d), 200, 4000) * np.exp(-tt / .25)
    return norm(boom * 1.2 + crunch + pad_(metal(900, 1.2), d) * .3)
def debris():
    out = np.zeros(int(1.6 * SR))
    for k in range(14): s = clack(1.5 + rng.random()); at = int(rng.random() * 1.4 * SR); out[at:at + len(s)] += s[:len(out) - at] * (.3 + rng.random() * .5)
    return norm(out)
def hatch(): d = .45; x = bpsweep(nz(d), 2000, 300) * env_exp(d, .15); return norm(cat(x, thump(.7, 80)[:int(.15 * SR)]))
def hiss(): d = 1.4; return norm(hp(nz(d), 2500) * env_exp(d, .5))
def clank(): return metal(700, .4)
def boing(): d = .7; tt = t_(d); f = 180 * (1 + .35 * np.sin(2 * np.pi * 16 * tt) * np.exp(-tt / .25)) * (1 + .6 * np.exp(-tt / .04)); return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(d, .22))
def land(): return norm(S(thump(1, 90), bp(nz(.08), 300, 2000) * env_exp(.08, .02)))
def blip(): d = .1; return norm(np.sin(2 * np.pi * 1400 * t_(d)) * env_exp(d, .03))
def flicker(): d = .7; tt = t_(d); x = np.sin(2 * np.pi * np.cumsum(300 + 900 * np.sin(np.pi * tt / d)) / SR) * np.sin(np.pi * tt / d) * (1 + .5 * np.sin(2 * np.pi * 30 * tt)); return norm(x)
def tap(): return norm(metal(3500, .08) * .6 + click(1.2)[:int(.08 * SR)].sum() * 0)
def bell(): d = 1.6; tt = t_(d); return norm(sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt / k) for f, k in [(1568, .7), (2093, .5), (3136, .25), (4186, .15)]) * (1 + .3 * np.sin(2 * np.pi * 9 * tt)))
def creak_(): return norm(creak(1))
def drip(): d = .12; return norm(sweep(900, 2400, .04, .5) * env_exp(.04, .015)) * .6
def blink(): d = .06; return norm(sweep(1200, 2600, d) * env_exp(d, .02)) * .6
def click_(): return norm(click(1.1))
def glitch(): d = .35; tt = t_(d); x = np.sign(np.sin(2 * np.pi * (600 + 2000 * (rng.random(len(tt)) > .9)) * tt)) * (rng.random(len(tt)) > .3); return norm(lp(np.round(x * 3) / 3, 7000) * env_exp(d, .2))
def clunk(): return norm(S(thump(1, 110) * .8, metal(500, .5) * .4))
def ignite(): d = 1.0; tt = t_(d); return norm(bp(nz(d), 400, 3000) * np.minimum(1, tt / .05) * np.exp(-tt / .6) + pop(1)[:int(d * SR)].sum() * 0)
def clack_(): return norm(clack(1.8))
def chomp(): d = .18; tt = t_(d); return norm(cat(bp(nz(.05), 300, 3000) * env_exp(.05, .01), thump(.6, 140)[:int(.13 * SR)]))
def gulp(): d = .25; x = sweep(420, 110, d, .6) * env_exp(d, .08); return norm(lp(x, 1200))
def pfft(): d = .9; tt = t_(d); return norm(hp(nz(d), 1800) * np.minimum(1, tt / .01) * np.exp(-tt / .35))
def kettle(): d = 1.2; tt = t_(d); return norm(np.sin(2 * np.pi * np.cumsum(2300 + 400 * tt + 30 * np.sin(2 * np.pi * 6 * tt)) / SR) * np.minimum(1, tt / .2) * np.exp(-tt / .7) + hp(nz(d), 3000) * .2 * np.exp(-tt / .5))
def plate(): return metal(1700, .5) * .6
def splash(): d = .4; tt = t_(d); return norm(S(bp(nz(d), 500, 4000) * np.exp(-tt / .1), sweep(300, 900, .1) * env_exp(.1, .03) * .4))
def swish(): return norm(whoosh(.25)) * .6
def pop_(): return norm(pop(1))
def slurp(): d = .6; tt = t_(d); x = bp(nz(d), 800, 3500) * (.5 + .5 * np.sin(2 * np.pi * 24 * tt)) * np.sin(np.pi * tt / d); return norm(x + sweep(300, 1200, d) * .3 * np.sin(np.pi * tt / d))
def squeak(): d = .12; tt = t_(d); return norm(np.sin(2 * np.pi * (2200 + 600 * np.sin(2 * np.pi * 25 * tt)) * tt) * np.sin(np.pi * tt / d)) * .6
def whoosh_(): return norm(whoosh(.3)) * .6
def whip(): d = .3; x = bpsweep(nz(d), 300, 5000, .3) * np.sin(np.pi * t_(d) / d) ** 2; return norm(x)
def scrape(): d = .9; tt = t_(d); return norm(bp(nz(d), 600, 2500) * (.6 + .4 * np.sin(2 * np.pi * 40 * tt)) * np.sin(np.pi * tt / d))
def glug(): d = .35; tt = t_(d); return norm(sweep(180, 520, d, .5) * np.sin(np.pi * tt / d) + bp(nz(d), 200, 900) * .3 * np.sin(np.pi * tt / d))
def charge(): d = 1.4; tt = t_(d); return norm(sweep(300, 2400, .6, .6).tolist() and np.pad(sweep(300, 2400, .6, .6) * np.linspace(.2, 1, int(.6 * SR)), (0, int(.8 * SR))) + np.pad(sum(np.sin(2 * np.pi * f * t_(.8)) * np.exp(-t_(.8) / .4) for f in (1760, 2637, 3520)), (int(.6 * SR), 0)))
def coinhum(): d = 3.0; tt = t_(d); return fade(norm(np.sin(2 * np.pi * 220 * tt) * .5 + np.sin(2 * np.pi * 330.5 * tt) * .3 + np.sin(2 * np.pi * 440 * tt + 2 * np.sin(2 * np.pi * 2 * tt)) * .2), .4, 1.0)
def engine(): d = 4.0; tt = t_(d); f = 55 + 60 * (tt / d) ** 2; x = np.sin(2 * np.pi * np.cumsum(f) / SR) * .6 + np.sin(2 * np.pi * np.cumsum(f * 2.01) / SR) * .3 + bp(nz(d), 200, 1200) * .3; return fade(norm(x * np.linspace(.3, 1, len(tt))), .3, .05)
def launch():
    d = 2.0; tt = t_(d); boom = np.sin(2 * np.pi * np.cumsum(50 + 80 * np.exp(-tt / .1)) / SR) * np.exp(-tt / .6)
    return norm(boom + bpsweep(nz(d), 300, 6000, .35) * np.exp(-tt / .7) * 1.2 + sweep(200, 1600, d, .5) * np.exp(-tt / .8) * .3)
def streak(): d = 1.6; return fade(norm(bpsweep(nz(d), 4000, 800, .3) * np.sin(np.pi * t_(d) / d)), .1, .2)
def twinkle(): return norm(S(*[np.pad(np.sin(2 * np.pi * f * t_(.4)) * env_exp(.4, .12), (int(k * .07 * SR), 0)) for k, f in enumerate([2637, 3136, 3951])]))
def rip(): d = .45; tt = t_(d); return norm(bp(nz(d), 1000, 7000) * (rng.random(len(tt)) > .4) * np.exp(-tt / .25))
def slap(): d = .2; return norm(S(bp(nz(d), 300, 3000) * env_exp(d, .03), thump(.6, 150)))
def fleet(): d = 6.0; tt = t_(d); x = sum(np.sin(2 * np.pi * np.cumsum(np.full(len(tt), f) * (1 + .01 * np.sin(2 * np.pi * (.3 + k * .1) * tt))) / SR) for k, f in enumerate([55, 62, 73, 82, 110])); return fade(norm(x * np.minimum(1, tt / 2.5)), .5, .05)
def dip(): d = .15; tt = t_(d); return norm(S(bp(nz(d), 400, 2500) * np.exp(-tt / .04), sweep(500, 1300, .06) * env_exp(.06, .02) * .5)) * .8
FX = {'streak': streak, 'flap': flap, 'clink': clink, 'roll': roll, 'drop': drop, 'sigh': sigh, 'whine': whine, 'sparks': sparks, 'rattle': rattle,
      'impact': impact, 'debris': debris, 'hatch': hatch, 'hiss': hiss, 'clank': clank, 'boing': boing, 'land': land, 'blip': blip, 'flicker': flicker, 'tap': tap,
      'bell': bell, 'creak': creak_, 'drip': drip, 'blink': blink, 'click': click_, 'glitch': glitch, 'clunk': clunk, 'ignite': ignite, 'clack': clack_, 'chomp': chomp,
      'gulp': gulp, 'pfft': pfft, 'kettle': kettle, 'plate': plate, 'splash': splash, 'swish': swish, 'pop': pop_, 'slurp': slurp, 'squeak': squeak, 'whoosh': whoosh_,
      'whip': whip, 'scrape': scrape, 'glug': glug, 'charge': charge, 'coinhum': coinhum, 'engine': engine, 'launch': launch, 'twinkle': twinkle, 'rip': rip, 'slap': slap,
      'fleet': fleet, 'dip': dip}

def add(buf, x, at, g=1., pan=0.):
    if x.ndim == 1: l, r = np.cos((pan + 1) * np.pi / 4) * 1.414, np.sin((pan + 1) * np.pi / 4) * 1.414; x = np.stack([x * l, x * r], 1)
    s = int(round(at * SR)); e = min(N, s + len(x))
    if e > s: buf[s:e] += x[:e - s] * g
sfxb, vob, amb = np.zeros((N, 2)), np.zeros((N, 2)), np.zeros((N, 2))
missing = set()
for e in E['ev']:
    if e['type'] != 'fx': continue
    f = FX.get(e['name'])
    if not f: missing.add(e['name']); continue
    add(sfxb, f() * .5, e['t'], e.get('gain', 1), e.get('pan', 0))
if missing: print('missing foley:', missing)

# —— voices: early reflections so they sit in the room, panned per speaker ——
PAN = {'ZUG': -.2, 'PIP': .2, 'LIU': 0, 'TR': .1}
GAIN = {'ZUG': 1.0, 'PIP': .9, 'LIU': .9, 'TR': .55}
lines = [e for e in E['ev'] if e['type'] == 'line']
for e in lines:
    x, sr = sf.read(os.path.join(HERE, 'voices', e['id'] + '.wav'))
    y = x.copy()
    for dl, gg in [(.011, .25), (.019, .18), (.029, .12)]: k = int(dl * SR); y[k:] += x[:-k] * gg
    add(vob, y, e['t'], GAIN[e['who']] * 1.6, PAN[e['who']])

# —— ambience beds per place ——
shots = [e for e in E['ev'] if e['type'] == 'shot']
EXT = {'city', 'alley', 'sign', 'fall', 'impact', 'title', 'roof', 'cellRoof', 'street', 'launch', 'cityUp', 'endCard'}
MORN = {'morning', 'signTear', 'liuMorning', 'fleet', 'queue', 'liuLast', 'screen2'}
def place_curve(kind):
    c = np.zeros(N)
    for i, s in enumerate(shots):
        a = int(s['t'] * SR); b = int(shots[i + 1]['t'] * SR) if i + 1 < len(shots) else N
        nm = s['name']; v = 0
        if kind == 'rainOut': v = 1 if nm in EXT else 0
        if kind == 'rainIn': v = 1 if nm not in EXT and nm not in MORN else 0
        if kind == 'room': v = 1 if nm not in EXT and nm not in MORN and nm != 'endCard' else 0
        if kind == 'morn': v = 1 if nm in MORN else 0
        c[a:b] = v
    return uniform_filter1d(c, int(.02 * SR))
def loop_noise(d, lo, hi):
    return bp(rng.standard_normal(int(d * SR)), lo, hi)
# rain: broadband hiss + droplets; inside, muffled
rain_b = loop_noise(DUR, 400, 9000) * .5 + hp(rng.standard_normal(N), 6000) * .15
drops = np.zeros(N); idx = rng.integers(0, N - 2000, 6000)
for i in idx: drops[i:i + 400] += np.sin(2 * np.pi * rng.uniform(1500, 4000) * np.arange(400) / SR) * np.exp(-np.arange(400) / 60) * rng.uniform(.2, 1)
rain_full = rain_b + drops * .3
rain_in = lp(rain_full, 900) * .8
cOut, cIn, cRoom, cMorn = place_curve('rainOut'), place_curve('rainIn'), place_curve('room'), place_curve('morn')
for c in range(2):
    amb[:, c] += rain_full * cOut * .16 + rain_in * cIn * .09
# room tone: fluorescent hum + a faint hiss; pot bubbling from 52.65 (quiet before)
tt = np.arange(N) / SR
hum = (np.sin(2 * np.pi * 120 * tt) * .5 + np.sin(2 * np.pi * 240 * tt) * .25 + np.sin(2 * np.pi * 360 * tt) * .1) * .03 + hp(rng.standard_normal(N), 3000) * .006
bub = np.zeros(N); bi = rng.integers(0, N - 4000, 9000)
for i in bi:
    d = int(rng.uniform(.03, .08) * SR); f0, f1 = rng.uniform(150, 350), rng.uniform(400, 900)
    bub[i:i + d] += np.sin(2 * np.pi * np.cumsum(np.linspace(f0, f1, d)) / SR) * np.sin(np.pi * np.arange(d) / d) * rng.uniform(.3, 1)
bub = lp(bub, 2500)
potlvl = np.where(tt < 52.65, .35, 1.0); potlvl = np.where(tt > 104.4, .5, potlvl)
burner = bp(rng.standard_normal(N), 300, 2500) * .02 * (tt > 53.4)
for c in range(2): amb[:, c] += (hum + bub * .05 * potlvl + burner) * cRoom
# morning: birds + street murmur
birds = np.zeros(N)
for i in rng.integers(int(118.4 * SR), int(135.9 * SR), 140):
    d = int(rng.uniform(.06, .14) * SR); f = rng.uniform(2800, 4800)
    birds[i:i + d] += np.sin(2 * np.pi * np.cumsum(f * (1 + .2 * np.sin(np.linspace(0, 9, d)))) / SR) * np.sin(np.pi * np.arange(d) / d)
murmur = bp(rng.standard_normal(N), 250, 1200) * (1 + .4 * np.sin(2 * np.pi * .7 * tt))
for c in range(2): amb[:, c] += (birds * .05 + murmur * .025) * cMorn

# —— music, ducked under dialogue ——
mus, _ = sf.read(os.path.join(HERE, 'music', 'score.wav'))
mus = mus[:N] if len(mus) >= N else np.pad(mus, ((0, N - len(mus)), (0, 0)))
duck = np.ones(N)
for e in lines:
    a, b = int((e['t'] - .08) * SR), int((e['t'] + e['dur'] + .15) * SR); duck[max(0, a):b] = .45
duck = uniform_filter1d(duck, int(.12 * SR))
mus = mus * duck[:, None]

mix = mus * .55 + sfxb * .8 + vob * 1.0 + amb * 1.0
mix = np.stack([hp(mix[:, c], 30) for c in range(2)], 1)
pk = np.abs(mix).max(); mix = mix / pk * .9
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR)
for nm, bb in [('music', mus * .55), ('sfx', sfxb * .8), ('voice', vob), ('amb', amb)]:
    r = np.sqrt(np.mean((bb / pk * .9) ** 2)); print(f'{nm:6s} rms {20 * np.log10(r + 1e-9):6.1f} dBFS')
print('mix.wav', DUR, 's')
