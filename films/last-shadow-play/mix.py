"""Mix: procedural foley (cloth, hide, bamboo, wood, oil, glass, crowd, night and dawn ambience) + the score (ducked under key foley) → out/mix.wav
Run from the library root: .venv/bin/python films/last-shadow-play/mix.py"""
import sys, os, json, numpy as np, soundfile as sf, soxr
D = os.path.dirname(os.path.abspath(__file__))
ROOT = os.environ.get('LIB') or os.path.abspath(os.path.join(D, '../..')); sys.path.insert(0, ROOT)
from core.audio.sfx import SR, t_, env_exp, bp, lp, hp, noise, norm, brown, creak, whoosh, compress, limit, add, thump
from scipy.signal import fftconvolve
from scipy.ndimage import uniform_filter1d
EV = json.load(open(os.path.join(D, 'events.json'))); DUR = EV['dur']; ev = EV.get('ev') or EV.get('events')
N = int(DUR * SR) + SR
fx = np.zeros((N, 2)); amb = np.zeros((N, 2)); key = np.zeros(N)
rng = np.random.default_rng(11)

def room_ir(d=.7, damp=3000):
    n = int(d * SR); e = np.exp(-np.arange(n) / SR / (d / 6.9)); ir = np.stack([lp(rng.standard_normal(n), damp) * e, lp(rng.standard_normal(n), damp) * e], 1)
    ir[0] = 1; return ir / np.abs(ir).sum(0) * 6
def verb(x, ir, mix=.25):
    y = np.stack([fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in range(2)], 1); return x * (1 - mix) + y * mix
def nz(n): x = rng.standard_normal(n); return x
def sine(f, d, ph=0): return np.sin(2 * np.pi * f * t_(d) + ph)
def saw(f, d): return 2 * ((t_(d) * f) % 1) - 1

# —— foley ——
def woodclap(v=1.):
    d = .5; tt = t_(d); x = hp(noise(d), 900) * env_exp(d, .002) * 1.2
    x += sum(a * sine(f, d, rng.random() * 6) * env_exp(d, tau) for f, a, tau in [(1150, .7, .03), (2350, .5, .018), (3500, .3, .01), (620, .4, .05)])
    x += sine(140, d) * env_exp(d, .04) * .8; return norm(x) * v
def match_(v=1.):
    d = .5; tt = t_(d); am = lp((rng.random(len(tt)) > .7) * 1.0, 60)
    x = bp(noise(d), 1800, 6500) * am * np.minimum(1, tt / .03) * np.exp(-np.maximum(0, tt - .18) / .05)
    fl = lp(noise(d), 1500) * np.sin(np.clip((tt - .15) / .35, 0, 1) * np.pi) * .6; return norm(x + fl) * v
def fwoomp(v=1., d=.8, f=900):
    tt = t_(d); e = np.minimum(1, tt / .06) * np.exp(-tt / (d / 3)); return norm(lp(noise(d), f) * e + sine(70, d) * e * .4) * v
def puff(v=1.):
    d = .3; tt = t_(d); return norm(lp(noise(d), 700) * np.sin(np.pi * tt / d) ** 2 + hp(noise(d), 5000) * env_exp(d, .08) * .25) * v
def drop(v=1.):
    d = .22; tt = t_(d); f = 1300 * (1 - .5 * np.minimum(1, tt / .05)); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(d, .03)
    return norm(x + hp(noise(d), 3000) * env_exp(d, .003) * .4) * v
def ceramic(v=1., p=1.):
    d = .25; tt = t_(d); x = hp(noise(d), 1500) * env_exp(d, .003)
    x += sum(a * sine(f * p, d, rng.random() * 6) * env_exp(d, tau) for f, a, tau in [(2400, .6, .03), (3600, .4, .02), (5200, .25, .012), (900, .35, .04)]); return norm(x) * v
def glasstap(v=1.):
    d = .05; tt = t_(d); return norm(hp(noise(d), 3000) * env_exp(d, .002) + sine(4200, d) * env_exp(d, .004) * .5) * v
def rodtap(v=1.):
    d = .12; tt = t_(d); x = hp(noise(d), 1500) * env_exp(d, .003) + sum(a * sine(f, d) * env_exp(d, tau) for f, a, tau in [(1800, .5, .01), (3200, .3, .006)]) + lp(noise(d), 500) * env_exp(d, .015) * .6
    return norm(x) * v
def flap(v=1., d=.18):
    tt = t_(d); return norm(bp(nz(len(tt)), 600, 5000) * np.sin(np.pi * tt / d) ** 2 * (1 + .6 * np.sin(2 * np.pi * 30 * tt))) * v
def leather_step(v=1.):
    d = .07; tt = t_(d); return norm(bp(noise(d), 900, 4000) * env_exp(d, .006) + sine(380, d) * env_exp(d, .01) * .5) * v
def thwack(v=1.):
    d = .25; tt = t_(d); return norm(bp(noise(d), 300, 2500) * env_exp(d, .02) + np.sin(2 * np.pi * 160 * tt * (1 - tt)) * env_exp(d, .05)) * v
def snuff(v=1.):
    d = .7; tt = t_(d); return norm(lp(noise(d), 700) * env_exp(d, .05) * 1.2 + hp(noise(d), 4000) * np.minimum(1, tt / .05) * env_exp(d, .25) * .35) * v
def cloth(v=1., d=.7):
    tt = t_(d); am = lp(rng.random(len(tt)), 25); return norm(bp(nz(len(tt)), 1500, 6500) * am * np.sin(np.pi * tt / d)) * v
def rattle(d, v=1.):
    out = np.zeros(len(t_(d))); t = 0.0
    while t < d - .05:
        c = rodtap(.4 + rng.random() * .6) * .7; s = int(t * SR); out[s:s + len(c)] += c[:len(out) - s]; t += .03 + rng.random() * .05
    return norm(out) * v
def rodslip(v=1.):
    d = .9; tt = t_(d); x = bp(noise(d), 800, 3000) * np.sin(np.pi * tt / d) ** 1.5 * .5 * (1 + .5 * np.sin(2 * np.pi * 14 * tt))
    for k, tc in enumerate([.55, .68, .8]): c = rodtap(.6 - k * .1); s = int(tc * SR); x[s:s + len(c)] += c[:len(x) - s]
    return norm(x) * v
def wood_knock(v=1., f=520):
    d = .3; tt = t_(d); return norm(sine(f, d) * env_exp(d, .05) + sine(f * 2.3, d) * env_exp(d, .02) * .4 + lp(noise(d), 1200) * env_exp(d, .006)) * v
def pat(v=1.):
    d = .12; tt = t_(d); return norm(lp(noise(d), 900) * env_exp(d, .008) + sine(150, d) * env_exp(d, .03) * .6) * v
def click(v=1.):
    d = .06; tt = t_(d); return norm(hp(noise(d), 2500) * env_exp(d, .0015) + sine(3100, d) * env_exp(d, .008) * .6 + sine(900, d) * env_exp(d, .01) * .3) * v
def blip(v=1.):
    d = .25; tt = t_(d); f = 1200 + 600 * np.minimum(1, tt / .08); return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d) ** 2) * v * .6
def chain(v=1.):
    d = .5; out = np.zeros(len(t_(d)))
    for k in range(7):
        s = int(rng.random() * .35 * SR); dd = .12; c = sum(a * sine(f * (.9 + rng.random() * .2), dd) * env_exp(dd, .02) for f, a in [(4200, 1), (6100, .6), (2900, .5)]); out[s:s + len(c)] += c * (.4 + rng.random() * .6)
    return norm(out) * v
def bigwhoosh(d, v=1.):
    tt = t_(d); n = nz(len(tt)); out = np.zeros_like(n)
    for i in range(0, len(n), 480):
        hi = min(len(n), i + 480); f = 250 + 1800 * (i / len(n)) ** 1.6; seg_ = bp(n[max(0, i - 2000):hi], f * .6, f * 1.5)[-(hi - i):]; out[i:hi] = seg_
    return norm(out * np.minimum(1, tt / (d * .7)) ** 1.5 * np.minimum(1, (d - tt) / .08)) * v
def twirl(d, v=1.):
    out = np.zeros(len(t_(d))); t = 0.0
    while t < d - .15: c = whoosh(.16, .5 + .5 * rng.random()); s = int(t * SR); out[s:s + len(c)] += c[:len(out) - s]; t += .13
    return norm(out) * v
def tatters(d, v=1.):
    out = np.zeros(len(t_(d))); t = 0.0
    while t < d - .2: c = flap(.3 + rng.random() * .5, .12 + rng.random() * .1); s = int(t * SR); out[s:s + len(c)] += c[:len(out) - s]; t += .08 + rng.random() * .14
    return norm(out) * v
def sizzle(d, v=1.):
    tt = t_(d); am = lp((rng.random(len(tt)) > .6) * 1.0, 40); x = hp(nz(len(tt)), 3500) * am * .8 + bp(nz(len(tt)), 800, 2000) * np.abs(np.sin(2 * np.pi * 19 * tt)) ** 3 * .6
    return norm(x * np.minimum(1, tt / .2)) * v
def crickets(d, v=1.):
    out = np.zeros((len(t_(d)), 2)); tt = t_(d)
    for c in range(5):
        f = 3900 + rng.random() * 900; rate = 24 + rng.random() * 14; ph = rng.random() * 6
        chirp = (np.sin(2 * np.pi * rate * tt + ph) > .55) * 1.0; song = lp((np.sin(2 * np.pi * (.21 + rng.random() * .15) * tt + rng.random() * 6) > -.2) * 1.0, 4)
        x = sine(f, d) * chirp * song * (.5 + .5 * rng.random()); pan = rng.random() * 1.6 - .8
        out[:, 0] += x * (1 - pan) / 2; out[:, 1] += x * (1 + pan) / 2
    return out / np.abs(out).max() * v
def birds(d, v=1.):
    out = np.zeros((len(t_(d)), 2)); t = 1.0
    while t < d - 1:
        n = 2 + int(rng.random() * 5); pan = rng.random() * 1.4 - .7; f0 = 2200 + rng.random() * 1600
        for k in range(n):
            dd = .06 + rng.random() * .08; tt = t_(dd); f = f0 * (1 + .25 * np.sin(2 * np.pi * (8 + rng.random() * 10) * tt) + .3 * tt / dd * (rng.random() - .5))
            c = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / dd) ** 1.2 * (.4 + .6 * rng.random())
            s = int((t + k * (dd + .04 + rng.random() * .05)) * SR); e = min(len(out), s + len(c)); out[s:e, 0] += c[:e - s] * (1 - pan) / 2; out[s:e, 1] += c[:e - s] * (1 + pan) / 2
        t += 1.2 + rng.random() * 3.0
    return out / max(np.abs(out).max(), 1e-9) * v
def voices(d, n, f0=(160, 320), vowel=(700, 1100), env=None, vib=.03, v=1., noisy=.3):
    """a crowd of voices: sawtooth tones with vibrato through two formants + breath noise; env(tt) shapes the swell"""
    out = np.zeros((len(t_(d)), 2)); tt = t_(d)
    for k in range(n):
        f = f0[0] + rng.random() * (f0[1] - f0[0]); fv = f * (1 + vib * np.sin(2 * np.pi * (4.5 + rng.random() * 2) * tt + rng.random() * 6) + .04 * lp(rng.standard_normal(len(tt)), 3))
        x = 2 * (np.cumsum(fv) / SR % 1) - 1; x = bp(x, vowel[0] * .6, vowel[0] * 1.5) + .6 * bp(x, vowel[1] * .7, vowel[1] * 1.4) + noisy * bp(nz(len(tt)), 500, 3000) * .3
        e = env(tt) if env else np.sin(np.pi * tt / d) ** 1.2; st = rng.random() * d * .3; e = e * (tt > st) * np.minimum(1, np.maximum(0, tt - st) / .25)
        pan = rng.random() * 1.6 - .8; x = x * e * (.5 + .5 * rng.random()); out[:, 0] += x * (1 - pan) / 2; out[:, 1] += x * (1 + pan) / 2
    return out / max(np.abs(out).max(), 1e-9) * v
def murmur(d, v=1.):
    out = np.zeros((len(t_(d)), 2)); tt = t_(d)
    for k in range(10):
        f = 110 + rng.random() * 160; syl = lp((rng.random(len(tt)) > .995) * 1.0, 6); syl = np.minimum(1, syl * 40)
        x = bp(saw(f, d) * (1 + .02 * np.sin(2 * np.pi * 5 * tt)), 300, 1400) * syl * lp((np.sin(2 * np.pi * (.05 + rng.random() * .1) * tt + rng.random() * 6) > .1) * 1.0, 2)
        pan = rng.random() * 1.6 - .8; out[:, 0] += x * (1 - pan) / 2; out[:, 1] += x * (1 + pan) / 2
    out = np.stack([lp(out[:, 0], 2200), lp(out[:, 1], 2200)], 1); out *= np.minimum(1, tt / 1.0)[:, None] * np.minimum(1, (d - tt) / .6)[:, None]
    return out / max(np.abs(out).max(), 1e-9) * v
def laugh(d, v=1.):
    return voices(d, 6, (260, 440), (800, 1300), env=lambda tt: (np.abs(np.sin(2 * np.pi * 5.2 * tt)) ** 1.6) * np.sin(np.pi * tt / d) ** .8, vib=.05, v=v, noisy=.5)
def cheer(d, v=1.):
    c = voices(d, 14, (170, 420), (700, 1200), env=lambda tt: np.minimum(1, tt / .5) ** 1.4 * np.minimum(1, (d - tt) / 1.2), vib=.04, v=v, noisy=.4)
    for k in range(2):   # a whistle or two
        dd = .9; tt = t_(dd); f = 2100 + 500 * np.sin(np.pi * tt / dd) + 60 * np.sin(2 * np.pi * 7 * tt); w = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / dd) ** .6 * .35
        s = int((.4 + k * 1.3) * SR)
        if s + len(w) < len(c): c[s:s + len(w), k % 2] += w
    return c
def gasp(v=1.):
    d = .8; tt = t_(d); x = bp(nz(len(tt)), 700, 3000) * (tt / d) ** 2 * np.minimum(1, (d - tt) / .05); c = voices(d, 5, (200, 380), (600, 1000), env=lambda tt: (tt / d) ** 3 * np.minimum(1, (d - tt) / .1), v=.6, noisy=.6)
    c[:, 0] += x * .5; c[:, 1] += x * .5; return c / np.abs(c).max() * v
def applause(d, v=1.):
    out = np.zeros((len(t_(d)), 2)); tt = t_(d); env = np.minimum(1, tt / .9) * np.minimum(1, (d - tt) / 1.5)
    for p in range(16):
        pan = rng.random() * 1.6 - .8; t = rng.random() * .4; rate = .09 + rng.random() * .05
        while t < d - .05:
            dd = .02; c = bp(noise(dd), 900, 4500) * env_exp(dd, .004) * (.5 + rng.random() * .5); s = int(t * SR); e = min(len(out), s + len(c))
            out[s:e, 0] += c[:e - s] * (1 - pan) / 2; out[s:e, 1] += c[:e - s] * (1 + pan) / 2; t += rate * (.85 + rng.random() * .3)
    out *= env[:, None]; return out / np.abs(out).max() * v
def room_bed(d):
    tt = t_(d); return lp(brown(d), 220) * .6 * np.minimum(1, tt / .5) * np.minimum(1, (d - tt) / .4)
def steps(d, v=1.):
    out = np.zeros((len(t_(d)), 2)); t = .1; k = 0
    while t < d - .1:
        c = leather_step(.7 + rng.random() * .3) * (1 - .7 * t / d); s = int(t * SR); pan = .2 + .7 * t / d; out[s:s + len(c), 0] += c[:len(out) - s] * (1 - pan) / 2; out[s:s + len(c), 1] += c[:len(out) - s] * (1 + pan) / 2; t += .5 + .03 * (k % 2); k += 1
    return out / max(np.abs(out).max(), 1e-9) * v

G = dict(clap=.9, match=.5, ignite=.42, matchout=.3, drop=.3, jugtap=.4, jugdown=.4, phonetap=.14, presson=.3, liftoff=.25, cloth=.22, rodtap=.3, flap=.3, creak=.26, land=.4, twirl=.3,
         step=.14, flare=.3, swap=.35, whoosh=.32, thwack=.55, hop=.2, rattle=.3, rodslip=.4, fallflap=.45, thud=.5, grab=.45, snap=.3, clatter=.35, skull=.5, handtap=.4, staffrise=.3,
         bigwhoosh=.55, strike=.75, tatters=.3, gutter=.3, pfft=.4, phoneout=.3, click=.5, torchon=.3, chain=.35, lamphand=.3, lamptap=.3)
KEY = {'clap', 'thwack', 'strike', 'skull', 'click', 'pfft', 'handtap', 'grab', 'fallflap', 'land'}
def stereo_add(buf, x2, t, g):
    s = int(t * SR); e = min(len(buf), s + len(x2)); buf[s:e] += x2[:e - s] * g
for e in ev:
    ty, t, v = e['type'], e['t'], e.get('v', 1); d = e.get('d', 1)
    if ty == 'clap': add(fx, woodclap(v), t, G[ty])
    elif ty == 'match': add(fx, match_(v), t, G[ty], .2)
    elif ty == 'ignite': add(fx, fwoomp(v, 1.0, 900), t, G[ty], .2); add(amb, sizzle(3.0, .4), t + .3, .08, .2)
    elif ty == 'matchout': add(fx, puff(v), t, G[ty], .2)
    elif ty == 'drop': add(fx, drop(v), t, G[ty], .1)
    elif ty == 'jugtap': add(fx, ceramic(v), t, G[ty], .1); add(fx, ceramic(v * .7, .95), t + .09, G[ty] * .8, .1)
    elif ty == 'jugdown': add(fx, ceramic(v, .8), t, G[ty], .3); add(fx, thump(.5, 90), t, .2, .3)
    elif ty == 'phonetap': add(fx, glasstap(v), t, G[ty], -.3)
    elif ty == 'presson': add(fx, flap(v, .22), t, G[ty] * v); add(fx, thump(.4, 110), t + .02, .12 * v)
    elif ty == 'liftoff': add(fx, flap(v), t, G[ty] * v)
    elif ty == 'cloth': add(fx, cloth(v, .6), t, G[ty] * v)
    elif ty == 'rodtap': add(fx, rodtap(v), t, G[ty] * v)
    elif ty == 'flap': add(fx, flap(v), t, G[ty] * v)
    elif ty == 'creak':
        k = 0.0
        while k < d: add(fx, creak(1 + k / max(d, .01) * .5), t + k, G[ty] * v * (.6 + .4 * k / max(d, .01)), -.1); k += .11
    elif ty == 'land': add(fx, rodtap(1), t, G[ty] * v); add(fx, leather_step(1), t + .01, G[ty] * v); add(fx, thump(.5, 80), t, .18 * v)
    elif ty == 'twirl': add(fx, twirl(d, 1), t, G[ty] * v, .1)
    elif ty == 'step': add(fx, leather_step(v), t, G[ty], -.2)
    elif ty == 'flare': add(fx, whoosh(.5, 1), t - .25, .2, 0); add(fx, sum(a * sine(f, 1.2) * env_exp(1.2, tau) for f, a, tau in [(2637, 1, .4), (3951, .5, .25), (5274, .3, .15)]) * .4, t, G[ty], 0)
    elif ty == 'swap': add(fx, flap(1, .22), t, G[ty]); add(fx, thump(.6, 100), t + .03, .25)
    elif ty == 'whoosh': add(fx, whoosh(.3, 1), t, G[ty] * v, .1)
    elif ty == 'thwack': add(fx, thwack(v), t, G[ty] * v, .15)
    elif ty == 'hop': add(fx, flap(v, .12), t, G[ty] * v); add(fx, leather_step(.6), t, .1)
    elif ty == 'rattle': add(fx, rattle(d, 1), t, G[ty] * v, -.1)
    elif ty == 'rodslip': add(fx, rodslip(v), t, G[ty], -.1)
    elif ty == 'fallflap': add(fx, flap(1, .5), t, G[ty] * v); add(fx, cloth(.8, .9), t + .3, .15); add(fx, thump(.6, 70), t + 1.2, .3)
    elif ty == 'gasp': stereo_add(fx, gasp(1), t, .28)
    elif ty == 'magic': stereo_add(amb, np.stack([bp(nz(len(t_(d))), 4000, 9000)] * 2, 1) * (1 + np.sin(2 * np.pi * .7 * t_(d)))[:, None] * np.sin(np.pi * t_(d) / d)[:, None] ** .5, t, .02); add(fx, creak(1.2), t + .4, .12, 0); add(fx, creak(.9), t + 1.9, .1, .1)
    elif ty == 'thud': add(fx, thump(1, 60), t, G[ty]); add(fx, flap(.8, .3), t, .2)
    elif ty == 'grab': add(fx, wood_knock(1, 700), t, G[ty] * .7, -.1); add(fx, cloth(1, .4), t - .1, .18); add(fx, rodtap(.8), t + .04, .25)
    elif ty == 'snap': add(fx, whoosh(.18, 1), t, G[ty]); add(fx, flap(.8, .1), t + .1, .2)
    elif ty == 'clatter': add(fx, rodtap(v), t, G[ty] * v); add(fx, wood_knock(.7, 900), t + .05, .2 * v); add(fx, rodtap(.6), t + .11, .2 * v)
    elif ty == 'skull': add(fx, wood_knock(1, 480), t, G[ty]); add(fx, thwack(.6), t, .25)
    elif ty == 'handtap': add(fx, pat(1), t, G[ty])
    elif ty == 'staffrise': add(fx, bigwhoosh(d, 1), t, G[ty], 0); add(fx, creak(1), t + .3, .15)
    elif ty == 'bigwhoosh': add(fx, bigwhoosh(d, 1), t, G[ty], -.1)
    elif ty == 'strike': add(fx, thwack(1), t, G[ty], .1); add(fx, thump(1, 55), t, .6); add(fx, woodclap(.6), t, .3)
    elif ty == 'tatters': add(fx, tatters(d, 1), t, G[ty], .1)
    elif ty == 'gutter': add(fx, sizzle(d + .3, 1), t, G[ty], .2)
    elif ty == 'pfft': add(fx, snuff(1), t, G[ty], .2)
    elif ty == 'phoneout': add(fx, cloth(1, .5), t, G[ty]); add(fx, click(.5), t + .3, .15, -.2)
    elif ty == 'click': add(fx, click(1), t, G[ty], -.2)
    elif ty == 'torchon': add(fx, blip(1), t, G[ty], -.2)
    elif ty == 'chain': add(fx, chain(1), t, G[ty], .1)
    elif ty == 'lamphand': add(fx, chain(.6), t, .18, 0); add(fx, cloth(.8, .5), t + .1, .15)
    elif ty == 'laugh': stereo_add(fx, laugh(d, 1), t, .22 * v)
    elif ty == 'cheer': stereo_add(fx, cheer(d, 1), t, .34 * v)
    elif ty == 'applause': stereo_add(fx, applause(d, 1), t, .3)
    elif ty == 'murmur': stereo_add(amb, murmur(d, 1), t, .13 * v)
    elif ty == 'crickets': stereo_add(amb, crickets(d, 1), t, .07)
    elif ty == 'birds': stereo_add(amb, birds(d, 1), t, .16)
    elif ty == 'steps': stereo_add(fx, steps(d, 1), t, .3)
    elif ty == 'room': add(amb, room_bed(d), t, .09)
    if ty in KEY: s = int(t * SR); key[s:s + int(.5 * SR)] = 1
# a faint wick crackle whenever the oil lamp burns (4.2 → 109.3), and nothing of it in the silences
add(amb, sizzle(105.0, .5), 4.3, .03, .2)

# —— the two silences are hard: cut every bed and tail there (the foley that belongs inside them is re-added) ——
T = json.load(open(os.path.join(D, 'timeline.json')))['hit']
def hard(buf, t0, t1, keep=()):
    a, b_ = int(t0 * SR), int(t1 * SR); r = int(.02 * SR); buf[a:a + r] *= np.linspace(1, 0, r)[:, None]; buf[a + r:b_] = 0
hard(amb, T['hardCut'], T['faceHold'] + 2.0); hard(amb, T['out'], T['torch'])
# —— music + ducking under key foley ——
mp = os.path.join(D, 'music', 'score.wav'); mus = np.zeros((N, 2))
m, sr = sf.read(mp); m = m if m.ndim > 1 else np.stack([m, m], 1)
if sr != SR: m = soxr.resample(m, sr, SR)
mus[:min(N, len(m))] = m[:N]
k = np.clip(uniform_filter1d(key, int(.3 * SR)) * 1.8, 0, 1); mus *= (10 ** (-4 * k / 20))[:, None]
fx = verb(fx, room_ir(.55), .16)
mix = mus * .8 + fx + amb
mix = np.stack([limit(mix[:, c], .95) for c in range(2)], 1)[:int(DUR * SR)]
os.makedirs(os.path.join(D, 'out'), exist_ok=True)
sf.write(os.path.join(D, 'out', 'mix.wav'), mix.astype(np.float32), SR)
def rms(a, b): x = mix[int(a * SR):int(b * SR)]; return 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-9)
print('mix.wav', mix.shape, 'peak', np.abs(mix).max().round(3))
for a, b, n in [(0, 4, 'dark'), (4.3, 10, 'lamp'), (16, 27, 'square'), (31, 40, 'show'), (54, 66, 'fight'), (67.05, 67.4, 'silence1'), (67.4, 73, 'heartbeat'), (78, 86, 'magic'), (86.2, 108, 'comeback'), (109.4, 113.3, 'silence2'), (115.6, 120, 'cheer'), (120, 125, 'gift'), (125, 140, 'dawn')]:
    print(f'{n:10s} {rms(a, b):6.1f} dB')
