"""Mix: procedural foley at the picture's event times (events.json from window.EV) + ambience + the score → out/mix.wav
Run from the library root: .venv/bin/python films/nian-dinner/mix.py"""
import sys, os, json, numpy as np, soundfile as sf, soxr
FILM = os.path.dirname(os.path.abspath(__file__)); ROOT = os.environ.get('LIB') or os.path.abspath(os.path.join(FILM, '..', '..')); sys.path.insert(0, ROOT)
from core.audio.sfx import SR, t_, env_exp, bp, lp, hp, noise, norm, brown, compress, limit, add
from scipy.signal import fftconvolve
from scipy.ndimage import uniform_filter1d
EV = json.load(open(os.path.join(FILM, 'events.json'))); DUR = EV['dur']; ev = EV['ev']
TL = json.load(open(os.path.join(FILM, 'timeline.json'))); HIT = TL['hits']
N = int(DUR * SR) + SR
fx = np.zeros((N, 2)); amb = np.zeros((N, 2)); big = np.zeros((N, 2))
rng = np.random.default_rng(31)
def room_ir(d=.6, damp=3500):
    n = int(d * SR); e = np.exp(-np.arange(n) / SR / (d / 6.9)); ir = np.stack([lp(rng.standard_normal(n), damp) * e, lp(rng.standard_normal(n), damp) * e], 1); ir[0] = 1; return ir / np.abs(ir).sum(0) * 6
def verb(x, ir, mix=.2): y = np.stack([fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in range(2)], 1); return x * (1 - mix) + y * mix
def tone(f, d, tau): return np.sin(2 * np.pi * f * t_(d)) * env_exp(d, tau)
# —— paper ——
def snip(v=1., big_=False):
    d = .22; tt = t_(d)
    sweep = bp(noise(d), 2500, 9000) * np.clip(tt / .06, 0, 1) * np.exp(-np.maximum(0, tt - .06) / .025)
    ring = tone(3800, d, .03) * .25 + tone(5600, d, .02) * .12
    crack = np.zeros_like(tt); s = int(.06 * SR); c = hp(noise(.012), 1800) * env_exp(.012, .002); crack[s:s + len(c)] = c * 2.2
    x = sweep * .8 + ring + crack + lp(noise(d), 900) * env_exp(d, .01) * .3
    if big_: x = x + tone(140, d, .03) * .4
    return norm(x) * v
def swish(d=.4, v=1., lo=700, hi=6000, flutter=0):
    tt = t_(d); e = np.sin(np.pi * np.clip(tt / d, 0, 1)) ** 1.5; am = 1 + flutter * np.sin(2 * np.pi * 22 * tt + rng.random() * 6); return norm(bp(noise(d), lo, hi) * e * am) * v
def tap(v=1., f=900): d = .09; return norm(bp(noise(d), 300, 3000) * env_exp(d, .01) + tone(f * .25, d, .015) * .5) * v
def snap(v=1.): d = .3; return norm(hp(noise(d), 600) * env_exp(d, .012) * 1.4 + lp(noise(d), 300) * env_exp(d, .04) * .8 + tone(90, d, .05) * .6) * v
def stamp(v=1.): d = .35; return norm(tone(110, d, .05) + lp(noise(d), 600) * env_exp(d, .03) * .7) * v
def flap(v=1.):
    d = .5; out = np.zeros(int(d * SR))
    for k in range(5): s = int(k * .085 * SR); x = swish(.1, .8 - k * .1, 800, 6000); out[s:s + len(x)] += x[:len(out) - s]
    return norm(out) * v
# —— the Nian ——
def thud(v=1.):
    d = .9; tt = t_(d); f = 55 * (1 + .6 * np.exp(-tt / .04)); return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(d, .18) + lp(noise(d), 350) * env_exp(d, .06) * .8) * v
def breath(d=1.2, v=1.): tt = t_(d); return norm(bp(noise(d), 150, 900) * np.sin(np.pi * tt / d) ** 1.4) * v
def sniff(v=1.):
    d = .28; tt = t_(d); am = np.sin(np.pi * tt / d) ** .6 * (1 + .4 * np.sin(2 * np.pi * 40 * tt)); return norm(bp(noise(d), 900, 4500) * am) * v
def inhale(v=1.): d = .5; tt = t_(d); return norm(bp(noise(d), 300, 2500) * (tt / d) ** 1.6 * (1 + .3 * np.sin(2 * np.pi * 9 * tt))) * v
def sneeze(v=1.):
    d = .7; tt = t_(d); f0 = 420 * (1 - .4 * np.clip(tt / .25, 0, 1)) * (1 + .03 * np.sin(2 * np.pi * 7 * tt)); ph = 2 * np.pi * np.cumsum(f0) / SR
    x = sum(np.sin(k * ph) / k ** 1.1 for k in range(1, 14)); x = bp(x, 250, 1800) + bp(x, 2000, 3400) * .35
    burst = hp(noise(d), 1500) * env_exp(d, .05) * 1.8
    e = np.clip(tt / .02, 0, 1) * np.exp(-np.maximum(0, tt - .18) / .14)
    return norm(x * e + burst * np.clip(tt / .01, 0, 1)) * v
def sneeze_small(v=1.): x = sneeze(1); return x[:int(.4 * SR)] * np.linspace(1, 0, int(.4 * SR)) ** .3 * v
def yelp(v=1.):
    d = .9; tt = t_(d); f0 = 330 * (1 - .45 * np.clip(tt / .7, 0, 1)) * (1 + .02 * np.sin(2 * np.pi * 6 * tt)); ph = 2 * np.pi * np.cumsum(f0) / SR
    x = sum(np.sin(k * ph) / k ** 1.2 for k in range(1, 16)); x = bp(x, 250, 1400) + bp(x, 2000, 3200) * .3
    return norm(x * np.clip(tt / .05, 0, 1) * np.exp(-np.maximum(0, tt - .45) / .15)) * v
def purr(v=1.):
    d = 1.0; tt = t_(d); f0 = 60 + 6 * np.sin(2 * np.pi * 1.5 * tt); ph = 2 * np.pi * np.cumsum(f0) / SR; x = sum(np.sin(k * ph) / k for k in range(1, 10)); x = bp(x, 80, 900) * (1 + .5 * np.sin(2 * np.pi * 24 * tt)); return norm(x * np.sin(np.pi * tt / d) ** .6) * v
def rumble(v=1.): d = 1.4; tt = t_(d); return norm(lp(brown(d), 160) * (1 + .6 * np.sin(2 * np.pi * 7 * tt)) * np.sin(np.pi * tt / d) ** .5) * v
def gulp(v=1.):
    d = .5; tt = t_(d); f = 160 * (1 - .5 * tt / d); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(d, .12) + lp(noise(d), 500) * env_exp(d, .05) * .6
    s = int(.22 * SR); x[s:s + int(.05 * SR)] += lp(noise(.05), 900) * env_exp(.05, .01) * 1.2; return norm(x) * v
def burp(v=1.): d = .45; tt = t_(d); f0 = 90 * (1 + .2 * np.sin(2 * np.pi * 30 * tt)); ph = 2 * np.pi * np.cumsum(f0) / SR; x = sum(np.sin(k * ph) / k ** .8 for k in range(1, 12)); return norm(bp(x, 100, 1500) * np.sin(np.pi * tt / d) ** .8) * v
def giggle(v=1.):
    d = .6; out = np.zeros(int(d * SR))
    for k in range(4):
        s = int(k * .13 * SR); tt = t_(.1); f0 = 620 - k * 30 + 40 * np.sin(2 * np.pi * 12 * tt); ph = 2 * np.pi * np.cumsum(f0) / SR; x = sum(np.sin(j * ph) / j ** 1.3 for j in range(1, 8)); x = bp(x, 400, 3000) * np.sin(np.pi * tt / .1) ** 1.2; out[s:s + len(x)] += x
    return norm(out) * v
def chuckle(v=1.):
    d = .7; out = np.zeros(int(d * SR))
    for k in range(3):
        s = int(k * .2 * SR); tt = t_(.14); f0 = 240 - k * 15 + 20 * np.sin(2 * np.pi * 10 * tt); ph = 2 * np.pi * np.cumsum(f0) / SR; x = sum(np.sin(j * ph) / j ** 1.1 for j in range(1, 10)); x = bp(x, 200, 2500) * np.sin(np.pi * tt / .14) ** 1.2; out[s:s + len(x)] += x
    return norm(out) * v
def laughall(v=1.):
    out = np.zeros(int(1.6 * SR))
    for k in range(3):
        g_ = giggle(1) if k != 1 else chuckle(1); s = int((k * .18 + rng.random() * .1) * SR); g_ = g_[:len(out) - s]; out[s:s + len(g_)] += g_ * (.8 + .2 * rng.random())
    return norm(out) * v
def gasp(v=1.): d = .4; tt = t_(d); return norm(bp(noise(d), 500, 3000) * (tt / d) ** 1.2 * np.exp(-np.maximum(0, tt - .3) / .05)) * v
# —— snow and steps ——
def crunch(v=1.):
    d = .22; tt = t_(d); g_ = (rng.random(len(tt)) > .55) * 1.0; x = hp(noise(d), 900) * g_ * np.sin(np.pi * tt / d) ** .8 + lp(noise(d), 300) * env_exp(d, .05) * .5; return norm(x) * v
def whump(v=1.): d = .7; tt = t_(d); return norm(lp(noise(d), 240) * env_exp(d, .12) * 1.2 + tone(48, d, .2) * .7 + hp(noise(d), 2000) * env_exp(d, .03) * .25) * v
def snowspray(v=1.): d = .8; tt = t_(d); return norm(bp(noise(d), 600, 5000) * np.sin(np.pi * tt / d) ** 1.4 * (1 + .4 * np.sin(2 * np.pi * 17 * tt))) * v
def snowsettle(v=1.): d = 1.0; tt = t_(d); return norm(bp(noise(d), 1500, 7000) * (rng.random(len(tt)) > .8) * env_exp(d, .35)) * v
def step(v=1.): d = .12; tt = t_(d); return norm(lp(noise(d), 700) * env_exp(d, .02) + hp(noise(d), 1500) * env_exp(d, .008) * .4) * v
# —— kitchen ——
def pat(v=1.): return norm(tap(1) + np.pad(tap(.7, 600), (int(.07 * SR), 0))[:len(tap(1))]) * v if False else np.concatenate([tap(1, 700), tap(.6, 500)]) * v
def squash(v=1.): d = .4; tt = t_(d); return norm(lp(noise(d), 500) * env_exp(d, .07) * 1.2 + tone(70, d, .1) * .8 + bp(noise(d), 800, 3000) * (rng.random(len(tt)) > .9) * env_exp(d, .15) * .4) * v
def poof(v=1.): d = .7; tt = t_(d); return norm(lp(noise(d), 1500) * np.exp(-tt / .18) * np.clip(tt / .02, 0, 1) * 1.0 + hp(noise(d), 3000) * env_exp(d, .25) * .3) * v
def pawtap(v=1.): d = .18; return norm(lp(noise(d), 500) * env_exp(d, .025) + tone(120, d, .04) * .6) * v
def bowl(v=1.): d = .6; x = tone(1850, d, .18) * .5 + tone(3100, d, .09) * .3 + tone(620, d, .2) * .4 + lp(noise(d), 1200) * env_exp(d, .01) * .8; return norm(x) * v
def clink(v=1.): d = .8; x = tone(2400, d, .25) * .6 + tone(3900, d, .12) * .3 + tone(5200, d, .08) * .2 + hp(noise(d), 3000) * env_exp(d, .004); return norm(x) * v
def bowls(v=1.):
    out = np.zeros(int(1.4 * SR))
    for k in range(5): x = bowl(.7 + .3 * rng.random()); s = int((k * .18 + rng.random() * .05) * SR); x = x[:len(out) - s]; out[s:s + len(x)] += x
    return norm(out) * v
def chopsticks(v=1.):
    out = np.zeros(int(1.0 * SR))
    for k in range(6): x = tone(2600 + rng.random() * 600, .06, .008) + hp(noise(.06), 2500) * env_exp(.06, .003); s = int((k * .15 + rng.random() * .05) * SR); x = x[:len(out) - s]; out[s:s + len(x)] += x
    return norm(out) * v
def slide(v=1.): return swish(.35, v, 400, 3000, .3)
def cloth(v=1.): return swish(.3, v, 300, 2500, .5)
def creak(v=1.): d = .5; tt = t_(d); f0 = 160 + 60 * np.sin(2 * np.pi * 2 * tt); saw = 2 * ((np.cumsum(f0) / SR) % 1) - 1; return norm(bp(saw, 300, 3000) * (np.abs(np.sin(2 * np.pi * 19 * tt)) ** 2) * np.sin(np.pi * tt / d)) * v
def tick(v=1.): d = .08; return norm(hp(noise(d), 2000) * env_exp(d, .003) + tone(1800, d, .01) * .5 + tone(900, d, .02) * .4) * v
# —— fire ——
def match_(v=1.):
    d = .7; tt = t_(d); am = lp((rng.random(len(tt)) > .7) * 1.0, 60); x = bp(noise(d), 1800, 6500) * am * np.minimum(1, tt / .03) * np.exp(-np.maximum(0, tt - .16) / .05)
    fl = lp(noise(d), 1400) * np.sin(np.clip((tt - .12) / .5, 0, 1) * np.pi) * .7; return norm(x + fl) * v
def fwoomp(d=.9, v=1., f=900): tt = t_(d); e = np.minimum(1, tt / .06) * np.exp(-tt / (d / 3)); return norm(lp(noise(d), f) * e + tone(70, d, .4) * e * .4) * v
def shimmer(d=1.2, v=1.): tt = t_(d); x = sum(np.sin(2 * np.pi * f * tt + rng.random() * 6) * env_exp(d, .3 + rng.random() * .4) for f in [2637, 3136, 3520, 4186, 4699]) / 5; return norm(x * np.clip(tt / .02, 0, 1)) * v
def fuse(d, v=1.): tt = t_(d); x = bp(noise(d), 2500, 9000) * (.6 + .4 * lp(rng.random(len(tt)), 25)) * (1 + .3 * np.sin(2 * np.pi * 31 * tt)); return norm(x) * np.minimum(1, tt / .2) * np.minimum(1, (d - tt) / .1) * v
def pinch(v=1.): d = .3; tt = t_(d); return norm(hp(noise(d), 3000) * env_exp(d, .02) * .8 + lp(noise(d), 800) * env_exp(d, .03)) * v
def crackers(d=1.2, v=1.):
    out = np.zeros(int((d + .4) * SR)); t = 0.
    while t < d:
        s = int(t * SR); k = .006 + rng.random() * .006
        c = hp(noise(k), 1200) * env_exp(k, .0012) * (.6 + rng.random() * .8) + np.sin(2 * np.pi * (300 + rng.random() * 300) * t_(k)) * env_exp(k, .002) * .4; out[s:s + len(c)] += c
        if rng.random() < .12: b = lp(noise(.25), 200) * env_exp(.25, .05) * .8; out[s:s + len(b)] += b
        t += .02 + .04 * rng.random() * (1 - t / d * .6)
    return norm(out) * v
def firework(v=1.):
    d = 2.2; out = np.zeros(int(d * SR)); wl = int(.45 * SR); f = 1200 + 1600 * t_(.45) / .45
    out[:wl] += np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t_(.45) / .45) * .25 + bp(noise(.45), 3000, 8000) * .1
    b = lp(noise(1.2), 400) * env_exp(1.2, .18) * 1.2 + tone(50, 1.2, .2); out[wl:wl + len(b)] += b
    cr = crackers(.9, .5); out[wl + 2000:wl + 2000 + len(cr)] += cr[:len(out) - wl - 2000] * .6
    return norm(out) * v
# —— the bus ——
def engine(d, v=1., f=38, stress=0):
    tt = t_(d); f0 = f * (1 + .04 * np.sin(2 * np.pi * .7 * tt) + stress * .3 * np.sin(2 * np.pi * 1.3 * tt)); ph = 2 * np.pi * np.cumsum(f0) / SR
    x = sum(np.sin(k * ph + rng.random()) / k ** .9 for k in range(1, 18)); x = bp(x, 50, 1200) + lp(noise(d), 400) * .3
    return norm(x * np.minimum(1, tt / .4) * np.minimum(1, (d - tt) / .4)) * v
def wheelspin(d, v=1.): tt = t_(d); f0 = 120 + 90 * np.clip(tt / .6, 0, 1) * (1 + .1 * np.sin(2 * np.pi * 3 * tt)); ph = 2 * np.pi * np.cumsum(f0) / SR; x = (sum(np.sin(k * ph) / k for k in range(1, 12)) * .6 + bp(noise(d), 700, 4000) * .8) * (1 + .5 * np.sin(2 * np.pi * 11 * tt)); return norm(x * np.minimum(1, tt / .3) * np.minimum(1, (d - tt) / .3)) * v
def horn(v=1.): d = .5; tt = t_(d); ph = 2 * np.pi * np.cumsum(np.full(len(tt), 330.0)) / SR; x = sum(np.sin(k * ph) / k ** .7 for k in range(1, 10)) + sum(np.sin(k * 1.25 * ph) / k ** .7 for k in range(1, 10)); return norm(bp(x, 200, 3000) * np.minimum(1, tt / .03) * np.minimum(1, (d - tt) / .06)) * v
def buscreak(v=1.): d = .7; tt = t_(d); f0 = 90 + 50 * np.sin(2 * np.pi * 1.5 * tt); saw = 2 * ((np.cumsum(f0) / SR) % 1) - 1; return norm(bp(saw, 200, 2500) * (np.abs(np.sin(2 * np.pi * 14 * tt)) ** 2) * np.sin(np.pi * tt / d) + lp(noise(d), 200) * env_exp(d, .2) * .4) * v
def strain(v=1.): d = 1.2; tt = t_(d); return norm(bp(noise(d), 200, 1200) * (tt / d) ** 1.5 * (1 + .4 * np.sin(2 * np.pi * 8 * tt)) + tone(60, d, .6) * .5) * v
def crash_(v=1.): d = 1.0; return norm(lp(noise(d), 500) * env_exp(d, .15) * 1.2 + tone(45, d, .3) + hp(noise(d), 2500) * env_exp(d, .05) * .4) * v
def skid(v=1.): d = 1.1; tt = t_(d); return norm(bp(noise(d), 500, 6000) * np.exp(-tt / .5) * (1 + .5 * np.sin(2 * np.pi * 23 * tt)) + lp(brown(d), 300) * env_exp(d, .4) * .8) * v
def doorfold(v=1.): return np.concatenate([swish(.3, 1, 600, 5000, .5), tap(1.2, 400)]) * v
def whoosh(d=.5, v=1.): return swish(d, v, 400, 5000, 0)
# —— beds ——
def wind(d, v=1.): tt = t_(d); m = lp(rng.random(len(tt)), 3); return norm(bp(noise(d), 200, 1600) * (.3 + m)) * np.minimum(1, tt / 1.) * np.minimum(1, (d - tt) / .6) * v
def roomtone(d): tt = t_(d); return lp(brown(d), 300) * np.minimum(1, tt / .8) * np.minimum(1, (d - tt) / .8)
def bustle(d, v=1.):
    out = np.zeros(int(d * SR))
    for k in range(int(d * 3)): x = lp(chuckle(.4) if k % 3 else giggle(.3), 1200); s = int(rng.random() * (len(out) - len(x))); out[s:s + len(x)] += x * .4
    for k in range(int(d * 2)): x = lp(tap(1, 500), 1500); s = int(rng.random() * (len(out) - len(x))); out[s:s + len(x)] += x * .5
    return norm(out) * v
G = dict(snip=.5, whoosh=.3, stamp=.4, place=.25, pat=.4, rustle=.3, rattle=.3, match=.45, glowon=.35, slide=.3, cloth=.25, bowl=.3, breath=.3, tick=.3, sniff=.4, inhale=.35, rumble=.45, thud=.5, crunch=.3, sneeze=.6, paperflap=.35, crackers=.4, yelp=.5, whump=.55, snowspray=.3, snowsettle=.2, gulp=.5, burp=.4, clink=.35, purr=.35, giggle=.4, pawtap=.4, squash=.5, poof=.4, creak=.3, chuckle=.35, horn=.3, bound=.55, strain=.4, buscreak=.35, crash=.5, gallop=.5, gasp=.35, fuse=.3, skid=.5, unfold=.6, pinch=.4, doorfold=.35, firework=.3, bowls=.3, chopsticks=.25, laughall=.4, sneezesmall=.45, step=.25, engine=.3, enginestop=.3, engineidle=.3, wheelspin=.35, crackersfar=.2, bustle=.3)
for e in ev:
    ty, t = e['type'], e['t']; gn = e.get('gain', 1)
    if ty == 'snip': add(fx, snip(1, e.get('big')), t - .06, G[ty] * (1.4 if e.get('big') else 1), .1)
    elif ty == 'whoosh': add(fx, whoosh(.6), t, G[ty])
    elif ty == 'stamp': add(fx, stamp(1), t, G[ty])
    elif ty == 'place':
        for k in range(6): add(fx, tap(1), t + k * .07, G[ty] * (1 - k * .08), -.3 + k * .12)
    elif ty == 'pat': add(fx, pat(1), t, G[ty] * gn)
    elif ty == 'rustle': add(fx, swish(.5, 1, 500, 5000, .7), t, G[ty])
    elif ty == 'rattle':
        for k in range(6): add(fx, tap(1, 1800), t + k * .045, G[ty] * (1 - k * .12), .4)
    elif ty == 'match': add(fx, match_(1), t, G[ty], .3); add(fx, fwoomp(.8, 1, 1100), t + .12, G[ty] * .6, .3)
    elif ty == 'glowon': add(fx, fwoomp(1.0, 1, 1200), t - .08, G[ty], .2); add(fx, shimmer(1.2), t, G[ty] * .4, .2)
    elif ty == 'slide': add(fx, slide(1), t, G[ty])
    elif ty == 'cloth': add(fx, cloth(1), t, G[ty])
    elif ty == 'bowl': add(fx, bowl(1), t, G[ty] * gn, rng.random() * .4 - .2)
    elif ty == 'bowls': add(fx, bowls(1), t, G[ty])
    elif ty == 'chopsticks': add(fx, chopsticks(1), t, G[ty], .2)
    elif ty == 'breath': add(fx, breath(1.3), t, G[ty] * gn, -.2)
    elif ty == 'tick': add(fx, tick(1), t, G[ty], rng.random() * .4 - .2)
    elif ty == 'sniff': add(fx, sniff(1), t, G[ty], -.2)
    elif ty == 'inhale': add(fx, inhale(1), t, G[ty], -.2)
    elif ty == 'rumble': add(fx, rumble(1), t, G[ty], -.2)
    elif ty == 'thud': add(fx, thud(1), t, G[ty] * gn, -.1)
    elif ty == 'bound': add(fx, thud(1), t, G[ty], 0); add(fx, snowspray(1), t + .02, G['snowspray'] * .8, .1)
    elif ty == 'gallop': add(fx, thud(1), t, G[ty], 0); add(fx, thud(.7), t + .18, G[ty] * .7, .2)
    elif ty == 'crunch': add(fx, crunch(1), t, G[ty] * gn, rng.random() * .3 - .15)
    elif ty == 'step': add(fx, step(1), t, G[ty] * gn, rng.random() * .3 - .15)
    elif ty == 'sneeze': add(big, sneeze(1), t - .09, G[ty], -.1)
    elif ty == 'sneezesmall': add(fx, sneeze_small(1), t - .03, G[ty], -.2)
    elif ty == 'paperflap': add(fx, flap(1), t, G[ty], .2)
    elif ty == 'crackers': add(fx, crackers(e.get('dur', 1.2)), t, G[ty] * gn, .5)
    elif ty == 'crackersfar': add(amb, lp(crackers(e.get('dur', 3)), 1800), t, G[ty], .4)
    elif ty == 'yelp': add(fx, yelp(1), t, G[ty], -.2)
    elif ty == 'whump': add(big, whump(1), t, G[ty], -.2)
    elif ty == 'snowspray': add(fx, snowspray(1), t, G[ty] * gn, rng.random() * .4 - .2)
    elif ty == 'snowsettle': add(fx, snowsettle(1), t, G[ty], -.1)
    elif ty == 'gulp': add(fx, gulp(1), t, G[ty], -.1)
    elif ty == 'burp': add(fx, burp(1), t, G[ty], -.1)
    elif ty == 'clink': add(fx, clink(1), t, G[ty], .1)
    elif ty == 'purr': add(fx, purr(1), t, G[ty], -.2)
    elif ty == 'giggle': add(fx, giggle(1), t, G[ty], .2)
    elif ty == 'chuckle': add(fx, chuckle(1), t, G[ty], .1)
    elif ty == 'laughall': add(fx, laughall(1), t, G[ty], 0)
    elif ty == 'gasp': add(fx, gasp(1), t, G[ty], .2)
    elif ty == 'pawtap': add(fx, pawtap(1), t, G[ty], 0)
    elif ty == 'squash': add(big, squash(1), t, G[ty], 0)
    elif ty == 'poof': add(fx, poof(1), t, G[ty], 0)
    elif ty == 'creak': add(fx, creak(1), t, G[ty], .3)
    elif ty == 'horn': add(fx, horn(1), t, G[ty], .1)
    elif ty == 'strain': add(fx, strain(1), t - .5, G[ty], -.1)
    elif ty == 'buscreak': add(fx, buscreak(1), t, G[ty], .1)
    elif ty == 'crash': add(big, crash_(1), t, G[ty], 0)
    elif ty == 'skid': add(big, skid(1), t, G[ty], 0)
    elif ty == 'fuse': add(fx, fuse(e.get('dur', 2)), t, G[ty], .3)
    elif ty == 'pinch': add(fx, pinch(1), t, G[ty], .3)
    elif ty == 'unfold': add(big, snap(1), t + .02, G[ty]); add(fx, swish(.3, 1, 600, 6000, .6), t - .12, G[ty] * .5)
    elif ty == 'doorfold': add(fx, doorfold(1), t, G[ty], -.1)
    elif ty == 'firework': add(fx, firework(1), t - .45, G[ty], rng.random() - .5)
    elif ty == 'windbed': add(amb, wind(e['dur']), t, .06 * gn)
    elif ty == 'roomtone': add(amb, roomtone(e['dur']), t, .08)
    elif ty == 'bustle': add(amb, bustle(e['dur']), t, G[ty])
    elif ty == 'engine': add(amb, engine(e['dur'], 1, 38), t, G[ty] * .6, .2)
    elif ty == 'enginestop': add(fx, engine(.6, 1, 30), t, G[ty] * .5, .2)
    elif ty == 'engineidle': add(amb, engine(e['dur'], 1, 34, 1), t, G[ty] * gn, 0)
    elif ty == 'wheelspin': add(fx, wheelspin(e['dur']), t, G[ty], 0)
# a faint wind and snow bed all the way through the night (dusk to the end), a little louder on the mountain
add(amb, wind(DUR - 8, 1), 8.0, .025)
mus = np.zeros((N, 2)); m, sr = sf.read(os.path.join(FILM, 'music', 'score.wav'))
if m.ndim == 1: m = np.stack([m, m], 1)
if sr != SR: m = soxr.resample(m, sr, SR)
mus[:min(N, len(m))] = m[:N]
# duck the music under the key foley (−3 dB) in short windows
duck = np.zeros(N)
for k, d in [('sneeze', .7), ('dive', .8), ('unfold', .6), ('whump', .6), ('skid', .9)]:
    for e in ev:
        if e['type'] == k or (k == 'dive' and e['type'] == 'whump'): s = int(e['t'] * SR); duck[s:s + int(d * SR)] = 1
duck = np.clip(uniform_filter1d(duck, int(.15 * SR)) * 1.4, 0, 1)
mus *= (10 ** (-3 * duck / 20))[:, None]
fx = verb(fx, room_ir(.5), .14); big = verb(big, room_ir(.7), .18)
mix = mus * .92 + fx + big + amb
# bus compression (vectorised RMS envelope, soft ratio) so the crest stays under the 12.8 dB that −14 LUFS / −1.2 dBTP allows, then a look-ahead limiter
env = np.sqrt(uniform_filter1d((mix ** 2).mean(1), int(.012 * SR))); thr, ratio = .22, 2.6
gain = np.where(env > thr, (thr + (env - thr) / ratio) / np.maximum(env, 1e-9), 1.0); gain = uniform_filter1d(gain, int(.03 * SR))
mix = mix * gain[:, None]
mix = np.stack([limit(mix[:, c], .8) for c in range(2)], 1)[:int(DUR * SR)]
os.makedirs(os.path.join(FILM, 'out'), exist_ok=True)
# pre-normalise to −14 LUFS with a TRUE-peak limiter at −2.0 dBTP (limiting on a 4× oversampled signal, so inter-sample peaks of the bright foley are caught);
# the final mux (tools/mux_final.sh) then applies no loudness processing at all
import subprocess, re as _re
def measure(path):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', 'loudnorm=I=-14:TP=-1.2:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float(_re.search(r'"input_i"\s*:\s*"([-\d.]+)"', r).group(1)), float(_re.search(r'"input_tp"\s*:\s*"([-\d.]+)"', r).group(1)), float(_re.search(r'"input_lra"\s*:\s*"([-\d.]+)"', r).group(1))
def tp_limit(x, ceil_db):
    up = soxr.resample(x.astype(np.float32), SR, SR * 4); c = 10 ** (ceil_db / 20)
    up = np.stack([limit(up[:, ch], c, .003) for ch in range(2)], 1); return soxr.resample(up, SR * 4, SR)[:len(x)]
mix = np.stack([lp(mix[:, ch], 15000, 4) for ch in range(2)], 1)   # the AAC encoder overshoots badly on content above 15 kHz: cut it before the limiter
tmp = os.path.join(FILM, 'out', 'mix_pre.wav')
for it in range(3):
    sf.write(tmp, mix.astype(np.float32), SR); I, TP, LRA = measure(tmp)
    print(f'pass {it}: {I:.2f} LUFS, {TP:.2f} dBTP, LRA {LRA:.1f}')
    if abs(I + 14) < .15 and TP <= -2.4: break
    mix = tp_limit(mix * 10 ** ((-14 - I) / 20), -2.6)
os.remove(tmp)
sf.write(os.path.join(FILM, 'out', 'mix.wav'), mix.astype(np.float32), SR)
def rms(x, a, b): y = x[int(a * SR):int(b * SR)]; return 20 * np.log10(np.sqrt((y ** 2).mean()) + 1e-9)
print('mix.wav', mix.shape, 'peak', np.abs(mix).max().round(3))
for s in TL['secs']: print(f"{s['id']} {s['name']:4s} {rms(mix, s['t'], s['t'] + s['dur']):6.1f} dB   fx {rms(fx + big, s['t'], s['t'] + s['dur']):6.1f}   mus {rms(mus, s['t'], s['t'] + s['dur']):6.1f}")
print('silence CU', round(rms(mix, HIT['nianCU'] + .7, HIT['steam'] - 1), 1), 'silence unfold', round(rms(mix, HIT['hiss'] + 1.9, HIT['unfold'] - .05), 1))
