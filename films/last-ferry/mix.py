"""Mix for 《最后一班渡船》: ambience beds per chapter + foley on the page's events (events.json) + the score → out/mix.wav.
No voice. Usage: LIB/.venv/bin/python films/last-ferry/mix.py [out.wav]  (run after `node core/render/events.mjs films/last-ferry` and score.py)"""
import os, sys, json, numpy as np, soundfile as sf
from scipy.ndimage import uniform_filter1d
HERE = os.path.dirname(os.path.abspath(__file__)); LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, os.path.join(LIB, 'core', 'audio'))
from sfx import *
TL = json.load(open(os.path.join(HERE, 'timeline.json'))); T = TL['T']; DUR = TL['DUR']; N = int(DUR * SR); tt = np.arange(N) / SR
EV = json.load(open(os.path.join(HERE, 'events.json')))['ev']
rng = np.random.default_rng(11)
def curve(keys): k = np.array(keys, float); return np.interp(tt, k[:, 0], k[:, 1])
def stereo(x, pan=0.0): l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4); return np.stack([x * l * 1.414, x * r * 1.414], 1)
def place(buf, x, t, pan=0.0, g=1.0):
    s = int(t * SR); x = stereo(x, pan) if x.ndim == 1 else x
    if s >= len(buf) or s < 0: return
    n = min(len(x), len(buf) - s); buf[s:s + n] += x[:n] * g
def rms_db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
def env(d, a, r): x = t_(d); return np.minimum(1, x / max(a, 1e-4)) * np.minimum(1, (d - x) / max(r, 1e-4))

# ———————————————————————— ambience beds ————————————————————————
amb = np.zeros((N, 2))
# water lapping: all the time, calmer at noon, rough in the storm
lap_g = curve([(0, .6), (30, .45), (50, .55), (68, .55), (81, .6), (84, 1.0), (102, 1.1), (121, .9), (124.6, .6), (150, .55)])
lap = lp(brown(DUR), 600) * (.4 + .6 * np.sin(2 * np.pi * .17 * tt + 1) ** 4) + hp(lp(noise(DUR), 3000), 500) * .08 * (.3 + .7 * np.sin(2 * np.pi * .17 * tt + .6) ** 6)
amb += stereo(lap * lap_g * .5, -.25) + stereo(np.roll(lap, 9001) * lap_g * .5, .25)
# birds: morning and dawn (chirps: short FM sine triplets)
def chirp(f0=3200, v=.5):
    d = .18; x = t_(d); f = f0 * (1 + .25 * np.sin(2 * np.pi * 14 * x)); return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * env(d, .01, .05)) * v
def birds(buf, t0, t1, dens=1.0, g=.25):
    t = t0
    while t < t1:
        f0 = 2600 + rng.random() * 1800; k = int(2 + rng.random() * 4)
        for i in range(k): place(buf, chirp(f0 * (1 + rng.random() * .1), .6), t + i * .14, pan=rng.uniform(-.7, .7), g=g)
        t += (.9 + rng.random() * 2.4) / dens
birds(amb, 0.5, 29.5, .8, .22); birds(amb, T['birds'] + .3, 149, 1.2, .3)
place(amb, norm(bp(noise(.6), 900, 2200) * np.sin(np.pi * t_(.6) / .6) ** 2 * (1 + .5 * np.sin(2 * np.pi * 18 * t_(.6)))), 2.8, pan=-.6, g=.12)   # a far rooster-ish call
# town murmur at noon and dawn (filtered noise with slow modulation), insects at dusk
mur = bp(noise(DUR), 300, 1400) * (.6 + .4 * np.sin(2 * np.pi * .13 * tt) ** 2) * curve([(0, 0), (30, 0), (32, .5), (49.5, .5), (50, 0), (124.6, 0), (126, .45), (150, .4)])
amb += stereo(mur, -.3) * .35 + stereo(np.roll(mur, 7001), .3) * .35
ins = np.zeros(N)
for f, rate, ph in [(4600, 15, 0), (5400, 19, 1.3), (4100, 11, 2.1)]:
    ins += np.sin(2 * np.pi * f * tt) * (np.sin(2 * np.pi * rate * tt + ph) > .6) * (np.sin(2 * np.pi * .5 * tt + ph * 2) > -.1) * .1
amb += stereo(ins * curve([(0, 0), (50, 0), (52, 1), (67.5, 1), (68, 0), (70, .5), (78, .5), (81, 0), (150, 0)]), .2) * .5
# a far dog in the first silence; a temple bell at dusk
def dog(v=.3):
    d = .35; x = t_(d); f = 420 * (1 + .3 * np.exp(-x / .05)); return norm(bp(2 * ((x * f) % 1) - 1, 300, 2500) * env(d, .01, .15)) * v
for k, t0 in enumerate([79.3, 79.75, 80.4]): place(amb, dog(.3), t0, pan=.7, g=.4)
def bell(v=1.0, f=440):
    d = 3.5; x = t_(d); return norm(sum(a * np.sin(2 * np.pi * f * m * x + m) * np.exp(-x / tau) for m, a, tau in [(1, 1, 1.4), (2.76, .4, .7), (5.4, .2, .35), (.5, .25, 1.8)])) * v
place(amb, bell(.25, 330), 53.2, pan=-.6, g=.5); place(amb, bell(.2, 330), 57.0, pan=-.6, g=.4)
# wind and rain (the storm), thunder after each flash
wind_g = curve([(0, 0), (T['wind'], 0), (T['wind'] + 1.5, .8), (T['rain'] + 2, 1.0), (102.6, 1.2), (112.6, 1.3), (115.6, 1.1), (121.1, .8), (124.6, 0), (150, 0)])
windB = bp(noise(DUR), 180, 1100) * (.5 + .5 * np.sin(2 * np.pi * .27 * tt) ** 2 * (1 + .3 * np.sin(2 * np.pi * 1.9 * tt))) * wind_g * .55
rain_g = curve([(0, 0), (T['rain'], 0), (T['rain'] + 2.5, 1.0), (112.6, 1.0), (115.6, .9), (121.1, .7), (123.5, .25), (124.6, 0), (150, 0)])
rainB = (hp(lp(noise(DUR), 9000), 500) * .32 + bp(brown(DUR), 150, 900) * .3) * rain_g
drops = np.zeros(N); idx = rng.integers(0, N, 14000); drops[idx] = rng.uniform(.2, 1, len(idx)) ** 2; drops = bp(drops, 2500, 8000) * 3 * rain_g
amb += stereo(windB, -.5) + stereo(np.roll(windB, 12007), .5) + stereo(rainB * .8, -.35) + stereo(np.roll(rainB, 4801) * .8, .35) + stereo(drops, .1) * .35

# ———————————————————————— foley ————————————————————————
fx = np.zeros((N, 2))
def plop(v=1.0):   # a paper boat touching water: tiny bloop
    d = .25; x = t_(d); f = 420 * (1 - .5 * x); return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x / .05) + lp(noise(d), 1200) * np.exp(-x / .03) * .4) * v
def oar(v=1.0, hard=False):   # the stern oar: wood creak on the pivot + a push of water
    d = 1.0 if not hard else 1.1; x = t_(d); c = creak(.6) * (1.3 if hard else 1)
    push = lp(noise(d), 900 if hard else 600) * np.exp(-x / (.28 if hard else .22)) * np.minimum(1, x / .08)
    out = np.zeros(len(x)); out[:len(c)] += c * .8; out += push * (.9 if hard else .6)
    if hard: out += lp(brown(d), 300) * np.exp(-x / .3) * .8
    return norm(out) * v
def chime(v=1.0, f=1568):
    d = 1.4; x = t_(d); return norm(sum(a * np.sin(2 * np.pi * f * m * x) * np.exp(-x / tau) for m, a, tau in [(1, 1, .5), (2.01, .35, .3), (3, .15, .2)])) * v
def hull(v=1.0):
    d = .6; x = t_(d); return norm(lp(noise(d), 500) * np.exp(-x / .05) + np.sin(2 * np.pi * 95 * x * (1 - .2 * x)) * np.exp(-x / .12) * .9 + bp(noise(d), 800, 2500) * np.exp(-x / .02) * .4) * v
def footstep(kind='wood', v=1.0):
    d = .11; x = t_(d)
    if kind == 'stone': return norm(bp(noise(d), 900, 5000) * np.exp(-x / .012) + np.sin(2 * np.pi * 300 * x) * np.exp(-x / .01) * .3) * v
    if kind == 'wet': return norm(bp(noise(d), 600, 4000) * np.exp(-x / .02) + hp(noise(d), 3000) * np.exp(-x / .035) * .5 + np.sin(2 * np.pi * 240 * x) * np.exp(-x / .012) * .3) * v
    if kind == 'boat': return norm(lp(noise(d), 700) * np.exp(-x / .02) + np.sin(2 * np.pi * 110 * x) * np.exp(-x / .03) * .7) * v
    return norm(bp(noise(d), 400, 2500) * np.exp(-x / .018) + np.sin(2 * np.pi * 180 * x) * np.exp(-x / .02) * .5) * v
def umbrella(v=1.0):   # a snap of cloth + the ribs locking
    d = .3; x = t_(d); return norm(bp(noise(d), 1200, 6000) * np.exp(-x / .03) + lp(noise(d), 800) * np.exp(-x / .08) * np.minimum(1, x / .02) * .7) * v
def candy(v=1.0):
    d = .12; x = t_(d); return norm(hp(noise(d), 2500) * np.exp(-x / .006) + np.sin(2 * np.pi * 1800 * x) * np.exp(-x / .01) * .4) * v
def win_on(v=1.0):   # a window warming up: a soft tink
    d = .5; x = t_(d); return norm(np.sin(2 * np.pi * 2200 * x) * np.exp(-x / .08) + np.sin(2 * np.pi * 3300 * x) * np.exp(-x / .05) * .4) * v
def honk(v=1.0):   # the goose: pulsed saw through two formants
    d = .42; x = t_(d); f = 260 * (1 + .12 * np.sin(2 * np.pi * 28 * x)) * (1 - .15 * x); saw = 2 * ((np.cumsum(f) / SR) % 1) - 1
    y = bp(saw, 500, 900) * 1.2 + bp(saw, 1500, 2400) * .8 + bp(saw, 2800, 3600) * .3
    return norm(y * env(d, .03, .12) * (1 + .4 * np.sin(2 * np.pi * 42 * x))) * v
def flap(v=1.0):
    d = .55; x = t_(d); out = np.zeros(len(x))
    for k in range(4): s = int(k * .13 * SR); w = lp(noise(.1), 1200) * np.exp(-t_(.1) / .03); out[s:s + len(w)] += w
    return norm(out) * v
def hop(v=1.0):
    d = .3; x = t_(d); return norm(lp(noise(d), 600) * np.exp(-x / .03) + np.sin(2 * np.pi * 140 * x) * np.exp(-x / .05) * .8) * v
def strike(v=1.0):
    d = .9; x = t_(d); scr = hp(noise(.12), 2500) * np.exp(-t_(.12) / .03); out = np.zeros(len(x)); out[:len(scr)] += scr * .8; out += lp(noise(d), 1800) * np.exp(-x / .35) * np.minimum(1, x / .05) * .7
    return norm(out) * v
def whoomp(v=1.0, d=1.0):   # the lantern catching: a soft bloom of air
    x = t_(d); return norm(lp(noise(d), 700) * np.exp(-x / .3) * np.minimum(1, x / .06) + np.sin(2 * np.pi * 70 * x) * np.exp(-x / .25) * .5) * v
def fwoomp(v=1.0, d=1.2):   # flame going out
    x = t_(d); return norm(lp(noise(d), 500) * np.exp(-x / .25) * np.sin(np.pi * np.minimum(x / .08, 1) / 2) + np.sin(2 * np.pi * 60 * x * (1 - .4 * x)) * np.exp(-x / .3) * .6) * v
def breath_in(v=1.0):
    d = .7; x = t_(d); return norm(bp(noise(d), 600, 2500) * np.sin(np.pi * x / d) ** 2) * v
def blow(v=1.0):
    d = .6; x = t_(d); return norm(bp(noise(d), 400, 1800) * env(d, .03, .3)) * v
def rope(v=1.0):
    d = .5; x = t_(d); return norm(bp(noise(d), 300, 1500) * (np.abs(np.sin(2 * np.pi * 17 * x)) ** 2) * env(d, .05, .15)) * v
def cloth(v=1.0):
    d = .35; x = t_(d); return norm(bp(noise(d), 500, 3000) * env(d, .05, .2)) * v
def thunder(v=1.0, d=3.8):
    x = t_(d); crack = hp(noise(d), 1500) * np.exp(-x / .08) * .6; body = lp(brown(d), 180) * np.exp(-x / 1.2) * np.minimum(1, x / .12); rum = lp(noise(d), 90) * np.exp(-x / 1.8) * 2
    return norm(crack + body + rum) * v
def castoff(v=1.0):
    d = 1.4; x = t_(d); return norm(lp(noise(d), 500) * np.exp(-x / .4) * np.minimum(1, x / .1) + np.sin(2 * np.pi * 80 * x) * np.exp(-x / .3) * .5) * v
def gutter(v=1.0):   # the flame guttering in the rain: a hiss with sputters
    d = 2.2; x = t_(d); sp = np.zeros(len(x)); idx = rng.integers(0, len(x), 60); sp[idx] = 1; return norm(bp(noise(d), 2000, 7000) * (.4 + .6 * np.abs(np.sin(2 * np.pi * 7 * x))) * env(d, .1, .6) + lp(sp, 3000) * 2) * v
def door(v=1.0):
    d = 1.1; x = t_(d); cr = creak(1.0); out = np.zeros(len(x)); out[:len(cr)] += cr * .9; out[int(.5 * SR):int(.5 * SR) + len(cr)] += cr * .5
    latch = hp(noise(.08), 2000) * np.exp(-t_(.08) / .01); out[:len(latch)] += latch * .8
    return norm(out) * v
def door_close(v=1.0):
    d = .5; x = t_(d); return norm(lp(noise(d), 700) * np.exp(-x / .04) + np.sin(2 * np.pi * 120 * x) * np.exp(-x / .08) * .8 + hp(noise(d), 2500) * np.exp(-x / .01) * .5) * v
def crackers(v=1.0, d=2.2):   # a string of firecrackers: dense pops with a crackling tail
    x = t_(d); out = np.zeros(len(x)); n_pop = 70
    for k in range(n_pop):
        s = int((k / n_pop) ** 1.1 * (d - .4) * SR + rng.random() * 800); p = lp(noise(.05), 3500) * np.exp(-t_(.05) / .006) * (0.6 + rng.random() * .6); out[s:s + len(p)] += p[:max(0, len(out) - s)]
        if k % 9 == 0: b = np.sin(2 * np.pi * 90 * t_(.12)) * np.exp(-t_(.12) / .03); out[s:s + len(b)] += b[:max(0, len(out) - s)] * .8
    return norm(out) * v
def crowd_murmur(v=1.0, d=12):
    x = t_(d); return norm(bp(noise(d), 250, 1600) * (.5 + .5 * np.sin(2 * np.pi * .4 * x) ** 2) * env(d, 1.5, 4)) * v
def ribbon(v=1.0):
    d = .6; x = t_(d); return norm(bp(noise(d), 600, 4000) * env(d, .08, .3) * (1 + .5 * np.sin(2 * np.pi * 9 * x))) * v
def small_bell(v=1.0):
    d = 1.2; x = t_(d); return norm(sum(a * np.sin(2 * np.pi * 2400 * m * x) * np.exp(-x / tau) for m, a, tau in [(1, 1, .35), (1.9, .4, .2), (2.9, .2, .12)])) * v

G = { 'boatdown': .5, 'oar': .45, 'oar_hard': .6, 'chime': .32, 'hull': .6, 'step_wood': .38, 'step_stone': .38, 'step_wet': .45, 'step_boat': .4, 'umbrella': .45, 'gust': .5, 'toss': .3, 'candy': .4,
      'window': .22, 'lamp': .2, 'honk': .55, 'flap': .45, 'hop': .5, 'match': .5, 'lantern_on': .5, 'rope': .45, 'cloth': .3, 'breath': .4, 'blow': .55, 'flash': .8, 'castoff': .55, 'gutter': .45,
      'heart': .6, 'revive': .4, 'door': .6, 'doorbell': .3, 'door_close': .5, 'crackers': .7, 'ribbon': .35, 'crowd': .4, 'birds': 0, 'wind': 0, 'rain': 0 }
for e in EV:
    k, t0, g, pan = e['type'], e['t'], e.get('g', 1.0) * G.get(e['type'], .4), e.get('pan', 0.0)
    if k == 'boatdown': place(fx, plop(), t0, pan, g)
    elif k == 'oar': place(fx, oar(), t0, pan, g)
    elif k == 'oar_hard': place(fx, oar(1, True), t0, pan, g)
    elif k == 'chime': place(fx, chime(), t0, 0, g)
    elif k == 'hull': place(fx, hull(), t0, pan, g)
    elif k.startswith('step_'): place(fx, footstep(k[5:]), t0, pan, g)
    elif k == 'umbrella': place(fx, umbrella(), t0, pan, g)
    elif k == 'gust': place(fx, whoosh(.9), t0, pan, g); place(fx, cloth(), t0 + .2, pan, g * .8)
    elif k == 'toss': place(fx, whoosh(.25), t0, pan, g)
    elif k == 'candy': place(fx, candy(), t0, pan, g)
    elif k == 'window': place(fx, win_on(), t0, -.5 + e.get('i', 0) * .14, g)
    elif k == 'lamp': place(fx, win_on(.8), t0 + .05, .3, g)
    elif k == 'honk': place(fx, honk(), t0, pan, g)
    elif k == 'flap': place(fx, flap(), t0, pan, g)
    elif k == 'hop': place(fx, hop(), t0, pan, g); place(fx, flap(.5), t0 - .1, pan, g * .6)
    elif k == 'match': place(fx, strike(), t0, pan, g)
    elif k == 'lantern_on': place(fx, whoomp(), t0, pan, g)
    elif k == 'rope': place(fx, rope(), t0, pan, g)
    elif k == 'cloth': place(fx, cloth(), t0, pan, g)
    elif k == 'breath': place(fx, breath_in(), t0, pan, g)
    elif k == 'blow': place(fx, blow(), t0, pan, g); place(fx, fwoomp(.8), t0 + .12, pan, g)
    elif k == 'flash': place(fx, thunder(), t0 + .55 + rng.random() * .3, pan, g)
    elif k == 'castoff': place(fx, castoff(), t0, pan, g); place(fx, rope(.6), t0 - .4, pan, g)
    elif k == 'gutter': place(fx, gutter(), t0, pan, g)
    elif k == 'heart': place(fx, heartbeat(), t0, 0, g)
    elif k == 'revive': place(fx, whoomp(.7, .8), t0, pan, g)
    elif k == 'door': place(fx, door(), t0, pan, g)
    elif k == 'doorbell': place(fx, small_bell(), t0, pan, g)
    elif k == 'door_close': place(fx, door_close(), t0, pan, g)
    elif k == 'crackers': place(fx, crackers(), t0, .3, g)
    elif k == 'ribbon': place(fx, ribbon(), t0, .3, g)
    elif k == 'crowd': place(fx, crowd_murmur(), t0 - 2, .2, g)

# ———————————————————————— music ————————————————————————
mus = np.zeros((N, 2))
mp = os.path.join(HERE, 'out', 'score.wav')
if os.path.exists(mp):
    m, sr = sf.read(mp, always_2d=True); assert sr == SR; n = min(len(m), N); mus[:n] = m[:n]
# duck the music a little under the dialogue chimes and the biggest foley (down only)
duck_mask = np.zeros(N)
for e in EV:
    if e['type'] in ('chime',): a = int(e['t'] * SR); duck_mask[a:a + int(1.2 * SR)] = 1
    if e['type'] in ('crackers',): a = int(e['t'] * SR); duck_mask[a:a + int(2.2 * SR)] = 1
duck = uniform_filter1d(duck_mask, int(.3 * SR)); mus *= (1 - .3 * np.clip(duck * 1.5, 0, 1))[:, None]

def lvl(x, db):
    act = np.abs(x).sum(1) > 1e-4; r = np.sqrt(np.mean(x[act] ** 2)) if act.any() else 1; return x * (10 ** (db / 20)) / (r + 1e-9)
musS = lvl(mus, -20); ambS = lvl(amb, -30); fxS = lvl(fx, -27)
# the beds drop under the heartbeat (the lantern dies) and thin into the second silence
ambS *= curve([(0, 1), (112.3, 1), (112.9, .35), (115.3, .35), (116.4, 1), (121.1, 1), (122.5, .6), (150, .6)])[:, None]
mix = musS + ambS + fxS
pk = np.abs(mix).max(); print('peak before %.1f dBFS' % (20 * np.log10(pk)))
# master headroom: aim near −14 LUFS with the true peak under −2 dBTP, so mux.sh's loudnorm only trims: +2.5 dB, then a look-ahead limiter at .70
mix *= 10 ** (2.5 / 20)
for ch in range(2): mix[:, ch] = limit(mix[:, ch], .70, .004)
mix = np.clip(mix, -.75, .75)
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'out', 'mix.wav')
sf.write(OUT, mix.astype(np.float32), SR, subtype='FLOAT')
print('wrote', OUT, DUR, 's | mus', round(rms_db(musS), 1), 'amb', round(rms_db(ambS), 1), 'fx', round(rms_db(fxS), 1), '| events', len(EV))
# self-check: every sound-design row is present (event types used)
used = sorted(set(e['type'] for e in EV)); print('event types:', ', '.join(used))
