"""Mix for 《我的怪兽朋友》: the score (music/score.wav) + Foley synthesised per material (crayon on paper, the wet brush, page turns, felt, rubber, zips,
cardboard, sand, a bell, breaths) + ambience beds, driven by events.json (window.EV). No voice. Three literal silences (the bus at zero).
Output out/mix.wav (48 k stereo, pre-mastered so mux.sh's loudnorm reaches −14 LUFS with the true peak under −1 dBTP).
Run from the library root: .venv/bin/python films/monster-friend/mix.py"""
import sys, os, json, numpy as np, soundfile as sf, soxr
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '../..'))
sys.path.insert(0, LIB)
from core.audio.sfx import SR, t_, noise, bp, lp, hp, brown, whoosh, compress, limit, add, norm
from scipy.ndimage import uniform_filter1d
ev = json.load(open(os.path.join(HERE, 'events.json')))
DUR = ev['dur']; E = ev['ev']; N = int(DUR * SR)
rng = np.random.default_rng(23)
def sine(f, d, ph=0): return np.sin(2 * np.pi * f * t_(d) + ph)
def chirp(f0, f1, d, tau):   # a sine gliding f0→f1 (exponential), decaying
    t = t_(d); f = f1 + (f0 - f1) * np.exp(-t / tau); return np.sin(2 * np.pi * np.cumsum(f) / SR)
def win(d, a=.01, r=.05):
    n = len(t_(d)); e = np.ones(n); na, nr = int(a * SR), int(r * SR)
    if na: e[:na] = np.linspace(0, 1, na)
    if nr: e[-nr:] *= np.linspace(1, 0, nr)
    return e
def ticks(d, n, lo, hi, tau=.004, spread=1.6):
    x = np.zeros(len(t_(d)))
    for k in range(n):
        s = int(rng.random() ** spread * (d - .03) * SR); L = int(.02 * SR); tt = np.arange(L) / SR
        x[s:s + L] += bp(rng.standard_normal(L), lo, hi) * np.exp(-tt / tau) * (.3 + rng.random() * .7)
    return x
def stickslip(d, rate=38, lo=900, hi=5200, g=1.):   # crayon on paper: grains at a stick-slip rate, following a hand that speeds up and slows down
    t = t_(d); n = len(t); x = np.zeros(n)
    speed = .6 + .4 * np.sin(2 * np.pi * t / max(.5, d / 3) + rng.random() * 6) ** 2
    ph = np.cumsum(rate * speed) / SR; grains = np.diff(np.floor(ph), prepend=0) > 0
    idx = np.nonzero(grains)[0]
    for i in idx:
        L = int((.006 + .01 * rng.random()) * SR); tt = np.arange(L) / SR
        x[i:i + L] += bp(rng.standard_normal(L), lo, hi)[:len(x[i:i + L])] * np.exp(-tt / .0035)[:len(x[i:i + L])] * (.4 + .6 * rng.random())
    x += bp(noise(d), 600, 3000) * .06 * speed
    return x * win(d, .03, .08) * g

# ---------- foley by material ----------
def scratch(v=1., dur=1.0): return stickslip(dur, 38, 900, 5200) * .5 * v                       # a crayon line
def scribble(v=1., dur=1.0):                                                                   # colouring: back-and-forth swishes
    d = dur; t = t_(d); sw = np.abs(np.sin(2 * np.pi * 4.2 * t + 1)) ** 1.6
    return (bp(noise(d), 700, 4500) * sw * .28 + stickslip(d, 70, 1500, 6000, .35)) * win(d, .05, .15) * v
def write(v=1., dur=1.0): return (stickslip(dur, 46, 1200, 6000) * .45 + bp(noise(dur), 1500, 5000) * .05) * win(dur, .02, .1) * v   # lettering
def brush(v=1., dur=1.5):                                                                      # a wet brush: low-passed noise with bristle grain, a drip at the end
    d = dur; t = t_(d); e = np.sin(np.pi * np.clip(t / d, 0, 1)) ** .7
    x = lp(noise(d), 1400) * e * .3 + bp(noise(d), 2500, 6000) * (rng.random(len(t)) < .02) * e * .6
    x[-int(.15 * SR):] += lp(noise(.15), 2000)[:int(.15 * SR)] * np.exp(-np.arange(int(.15 * SR)) / SR / .03) * .2
    return x * v
def page(v=1., dur=.6):                                                                        # a page turn: lift (paper flex), whoosh, flap down
    d = dur + .2; t = t_(d); lift = bp(noise(d), 2000, 7000) * np.exp(-t / .05) * .35
    wh = bp(noise(d), 400, 3000) * np.sin(np.pi * np.clip((t - .05) / (dur - .1), 0, 1)) ** 1.2 * .3
    flap = bp(noise(d), 300, 2500) * np.exp(-np.maximum(t - (dur - .05), 0) / .03) * (t > dur - .05) * .8
    return (lift + wh + flap + ticks(d, 10, 2500, 8000, .003) * .2) * v
def paper(v=1.): d = .5; return ticks(d, 8, 2500, 9000, .003) * .25 * v
def crayonSwap(v=1.):                                                                          # one crayon set down, another picked up: two wooden ticks
    d = .35; t = t_(d); a = bp(noise(d), 1200, 5000) * np.exp(-t / .008) * .5; b = np.roll(bp(noise(d), 1500, 6000) * np.exp(-t / .006), int(.18 * SR)) * .4
    return (a + b) * v
def balloonRise(v=1.): d = .6; t = t_(d); return bp(noise(d), 1500, 4500) * np.sin(np.pi * t / d) ** 2 * .06 * v
def wave(v=1.): d = .35; t = t_(d); return bp(noise(d), 500, 3000) * np.sin(np.pi * t / d) ** 2 * .25 * v
def run(v=1., dur=1.8):
    x = np.zeros(len(t_(dur))); k = 0
    while k * .22 < dur - .1:
        s = int(k * .22 * SR); y = step(.8 - .05 * k); x[s:s + len(y)] += y[:len(x) - s]; k += 1
    return x * v
def step(v=1.):
    d = .14; t = t_(d); return (lp(noise(d), 900) * np.exp(-t / .018) * .55 + chirp(160, 80, d, .01) * np.exp(-t / .035) * .3 + bp(noise(d), 1500, 5000) * np.exp(-t / .006) * .2) * v
def mouthOpen(v=1.): d = .12; t = t_(d); return bp(noise(d), 1500, 5000) * np.exp(-t / .015) * .12 * v
def mouthClose(v=1.): d = .1; t = t_(d); return (lp(noise(d), 1200) * np.exp(-t / .01) * .15 + sine(220, d) * np.exp(-t / .02) * .05) * v
def click(v=1.): d = .12; t = t_(d); return (hp(noise(d), 2500) * np.exp(-t / .003) * .6 + sine(1800, d) * np.exp(-t / .006) * .3) * v
def boxRattle(v=1.): d = .5; return (ticks(d, 18, 500, 3000, .01) * .4 + lp(noise(d), 600) * win(d, .02, .3) * .12) * v
def hover(v=1.): d = .3; t = t_(d); return bp(noise(d), 300, 2000) * np.sin(np.pi * t / d) * .08 * v
def crayonPick(v=1.): d = .15; t = t_(d); return (bp(noise(d), 800, 4000) * np.exp(-t / .01) * .45 + sine(900, d) * np.exp(-t / .015) * .2) * v
def glint(v=1.): d = .8; t = t_(d); return sum(a * sine(f, d) * np.exp(-t / tau) for f, a, tau in [(4200, .35, .3), (6300, .2, .15)]) * .25 * v
def dot(v=1.): d = .08; t = t_(d); return (bp(noise(d), 1000, 5000) * np.exp(-t / .006) * .5 + lp(noise(d), 800) * np.exp(-t / .01) * .3) * v
def blink(v=1.): d = .06; t = t_(d); return lp(noise(d), 2500) * np.exp(-t / .006) * .22 * v
def creak(v=1.):                                                                               # paper creasing as the arm comes out
    d = .5; t = t_(d); f0 = 80 + rng.random() * 40; saw = 2 * ((t * f0 * (1 + .3 * np.sin(2 * np.pi * 9 * t))) % 1) - 1
    return (bp(saw, 500, 3500) * (np.abs(np.sin(2 * np.pi * 21 * t)) ** 3) * np.sin(np.pi * t / d) * .4 + ticks(d, 8, 2000, 7000, .003) * .2) * v
def stretch(v=1.):                                                                             # a rubbery stretch rising in pitch
    d = .9; t = t_(d); f0 = 120 + 160 * (t / d) ** 1.5; saw = 2 * ((np.cumsum(f0) / SR) % 1) - 1
    return bp(saw, 300, 2600) * (np.abs(np.sin(2 * np.pi * 17 * t)) ** 2) * np.sin(np.pi * t / d) * .3 * v
def landSoft(v=1.): d = .3; t = t_(d); return (chirp(150, 70, d, .02) * np.exp(-t / .06) + lp(noise(d), 500) * np.exp(-t / .03) * .5) * .6 * v
def jaw(v=1.): d = .12; t = t_(d); return (lp(noise(d), 900) * np.exp(-t / .012) * .3 + chirp(420, 200, d, .02) * np.exp(-t / .03) * .15) * v
def gasp(v=1.): d = .45; t = t_(d); return bp(noise(d), 900, 4500) * (t / .25) ** 2 * (t < .25) * .6 * v + bp(noise(d), 500, 2000) * np.exp(-(t - .25) / .08) * (t >= .25) * .3 * v
def cloth(v=1.): d = .6; t = t_(d); return bp(noise(d), 300, 3000) * np.sin(np.pi * t / d) * .35 * v
def shrink(v=1., dur=.7):                                                                      # a quick descending whistle with a rubbery squeeze under it
    d = dur; t = t_(d); f = 1800 * np.exp(-2.2 * t / d); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * .22
    sq = bp(noise(d), 400, 1800) * (np.abs(np.sin(2 * np.pi * 14 * t)) ** 2) * .15
    return (x + sq) * win(d, .01, .2) * v
def squeak(v=1.):
    d = .35; t = t_(d); f = 2200 * (1 + .1 * np.sin(2 * np.pi * 30 * t)) * (1 + .25 * np.clip(t / .07, 0, 1)); x = np.sin(2 * np.pi * np.cumsum(f) / SR)
    return x * win(d, .01, .1) * .35 * v
def giggle(v=1.):                                                                              # a muffled chuckle: three breathy pulses (no voice)
    d = .6; t = t_(d); e = sum(np.sin(np.pi * np.clip((t - k * .17) / .12, 0, 1)) * ((t >= k * .17) & (t < k * .17 + .12)) for k in range(3))
    return (bp(noise(d), 700, 2500) * e * .3 + sine(520, d) * e * .03) * v
def pop(v=1.): d = .15; t = t_(d); return (chirp(400, 1500, d, .02) * np.exp(-t / .025) * .5 + lp(noise(d), 1500) * np.exp(-t / .008) * .4) * v
def felt(v=1.): d = .25; t = t_(d); return lp(noise(d), 700) * np.exp(-t / .04) * .45 * v
def squeeze(v=1.): d = .5; t = t_(d); f = 300 + 500 * np.sin(np.pi * t / d); return (np.sin(2 * np.pi * np.cumsum(f) / SR) * .12 + bp(noise(d), 500, 2500) * (np.abs(np.sin(2 * np.pi * 11 * t)) ** 2) * .2) * win(d, .02, .1) * v
def zip_(v=1.): d = .4; t = t_(d); return (bp(noise(d), 1500, 7000) * (np.abs(np.sin(2 * np.pi * 95 * t * (1 + .6 * t / d))) ** 1.5) * .45 + bp(noise(d), 1000, 4000) * .08) * win(d, .01, .05) * v
def unzip(v=1.): return zip_(v)[::-1] * .9
def tick(v=1.): d = .05; t = t_(d); return hp(noise(d), 3000) * np.exp(-t / .004) * .3 * v
def crunch(v=1., i=0):                                                                         # a crayon bitten: a snap then crunchy grains
    d = .45; t = t_(d); snap = lp(noise(d), 3000) * np.exp(-t / .006) * .9
    cr = ticks(d, 22, 800, 4000, .006) * np.exp(-t / .3) * .9 * (1 + .08 * i)
    return (snap + cr + lp(noise(d), 400) * np.exp(-t / .05) * .3) * v
def sniff(v=1.): d = .25; t = t_(d); return bp(noise(d), 1200, 4500) * np.sin(np.pi * t / d) ** 1.5 * .28 * v
def inhale(v=1.): d = .6; t = t_(d); return bp(noise(d), 700, 3500) * (t / d) ** 1.8 * .4 * v
def sneeze(v=1.):                                                                              # a big soft creature's sneeze: a burst with a wet splat and a low thump
    d = .6; t = t_(d); burst = bp(noise(d), 400, 6000) * np.exp(-t / .09) * 1.1; thump = chirp(160, 60, d, .03) * np.exp(-t / .15) * .6
    wet = bp(noise(d), 200, 1500) * np.exp(-t / .2) * .3
    return (burst + thump + wet) * v
def splat(v=1.): d = 1.0; return (ticks(d, 50, 600, 4000, .01, 1.2) * .6 + lp(noise(d), 500) * np.exp(-t_(d) / .25) * .25) * v
def chirp_(v=1.):                                                                              # the children's surprise: two little bird-like chirps (no voice)
    d = .4; t = t_(d); f = 1400 * (1 + .3 * np.sin(np.pi * np.clip(t / .12, 0, 1))) ; x = np.sin(2 * np.pi * np.cumsum(f) / SR)
    e = np.sin(np.pi * np.clip(t / .12, 0, 1)) * (t < .12) + np.sin(np.pi * np.clip((t - .2) / .12, 0, 1)) * (t >= .2) * (t < .32)
    return x * e * .18 * v
def sand(v=1.): d = .6; t = t_(d); return (bp(noise(d), 800, 5000) * np.sin(np.pi * t / d) * .25 + ticks(d, 30, 2000, 7000, .004) * .3) * v
def pat(v=1.): d = .2; t = t_(d); return (lp(noise(d), 1200) * np.exp(-t / .02) * .6 + ticks(d, 10, 1500, 6000, .004) * .3) * v
def bell(v=1.):                                                                                # a small school bell: a struck metal partial set, ringing
    d = 2.0; t = t_(d); x = sum(a * sine(f, d) * np.exp(-t / tau) for f, a, tau in [(1650, .5, .7), (2480, .3, .5), (4100, .25, .3), (5900, .12, .18), (820, .15, .9)])
    return (x * .5 + hp(noise(d), 3000) * np.exp(-t / .01) * .4) * v
def rubber(v=1.): d = .3; t = t_(d); f = 900 * (1 + .25 * np.sin(2 * np.pi * 18 * t)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * win(d, .02, .1) * .12 * v
def skid(v=1.): d = .25; t = t_(d); return bp(noise(d), 500, 3500) * np.exp(-t / .09) * (1 - np.exp(-t / .01)) * .4 * v
def beanBounce(v=1.): d = .2; t = t_(d); return (chirp(900, 500, d, .02) * np.exp(-t / .03) * .2 + lp(noise(d), 1500) * np.exp(-t / .01) * .15) * v
def breathIn(v=1.): d = .7; t = t_(d); return bp(noise(d), 500, 2500) * np.sin(np.pi * np.clip(t / d, 0, 1) ** .7) * .3 * v
def breathOut(v=1.): d = .8; t = t_(d); return lp(noise(d), 1500) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.2 * .22 * v
def swish(v=1.): return whoosh(.5, .7 * v)
def snap_(v=1.): d = .3; t = t_(d); return (hp(noise(d), 1500) * np.exp(-t / .004) * .7 + chirp(600, 300, d, .02) * np.exp(-t / .04) * .2) * v
def laugh(v=1.):                                                                               # a laugh without a voice: four quick breathy pulses rising
    d = .8; t = t_(d); e = sum(np.sin(np.pi * np.clip((t - k * .16) / .11, 0, 1)) * ((t >= k * .16) & (t < k * .16 + .11)) for k in range(4))
    return bp(noise(d), 800, 3000) * e * .28 * v
def burp(v=1.):                                                                                # a soft monster burp: a low buzzing honk that sags
    d = .55; t = t_(d); f = 110 * np.exp(-.5 * t / d) * (1 + .05 * np.sin(2 * np.pi * 9 * t)); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * (1 + .6 * np.sign(np.sin(2 * np.pi * 37 * t)))
    return (lp(x, 900) * .35 + lp(noise(d), 400) * .2) * np.sin(np.pi * t / d) ** .6 * v
def crayonPop(v=1.): d = .18; t = t_(d); return (chirp(500, 1800, d, .02) * np.exp(-t / .03) * .45 + lp(noise(d), 2000) * np.exp(-t / .006) * .4) * v
def catch(v=1.): d = .15; t = t_(d); return lp(noise(d), 900) * np.exp(-t / .02) * .4 * v
def rattle(v=1.): d = .5; t = t_(d); return (ticks(d, 40, 1500, 6000, .003, 1.0) * .5 + bp(noise(d), 300, 2000) * (np.abs(np.sin(2 * np.pi * 13 * t)) ** 3) * .2) * (1 - t / d) * v
def hop(v=1.): d = .2; t = t_(d); return (lp(noise(d), 800) * np.exp(-t / .025) * .5 + chirp(220, 110, d, .01) * np.exp(-t / .04) * .25) * v
def yawn(v=1.): d = 1.0; t = t_(d); return bp(noise(d), 400, 2200) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.3 * .25 * v
def flutter(v=1.): d = .5; t = t_(d); return bp(noise(d), 800, 5000) * (np.abs(np.sin(2 * np.pi * 15 * t)) ** 2) * (1 - t / d) * .35 * v
def bookClose(v=1.): d = .5; t = t_(d); return (chirp(140, 70, d, .02) * np.exp(-t / .08) * .7 + lp(noise(d), 900) * np.exp(-t / .03) * .6 + ticks(d, 8, 2500, 8000, .003) * .2) * v
def crayonDown(v=1.):                                                                          # a crayon rolling on paper and stopping: a few soft wooden ticks slowing, then a tap
    d = .6; t = t_(d); x = np.zeros(len(t)); times = [0, .07, .16, .27, .4]
    for i, tt in enumerate(times): s = int(tt * SR); L = int(.03 * SR); x[s:s + L] += bp(rng.standard_normal(L), 600, 3000) * np.exp(-np.arange(L) / SR / .006) * (.3 + .1 * i)
    x += np.roll(lp(noise(d), 1200) * np.exp(-t / .01), int(.45 * SR)) * .4
    return x * v

FX = dict(scratch=scratch, scribble=scribble, write=write, brush=brush, page=page, paper=paper, crayonSwap=crayonSwap, balloonRise=balloonRise, wave=wave, run=run, step=step,
          mouthOpen=mouthOpen, mouthClose=mouthClose, click=click, boxRattle=boxRattle, hover=hover, crayonPick=crayonPick, glint=glint, dot=dot, blink=blink, creak=creak,
          stretch=stretch, landSoft=landSoft, jaw=jaw, gasp=gasp, cloth=cloth, shrink=shrink, squeak=squeak, giggle=giggle, pop=pop, felt=felt, squeeze=squeeze, zip=zip_,
          unzip=unzip, tick=tick, crunch=crunch, sniff=sniff, inhale=inhale, sneeze=sneeze, splat=splat, chirp=chirp_, sand=sand, pat=pat, bell=bell, rubber=rubber, skid=skid,
          beanBounce=beanBounce, breathIn=breathIn, breathOut=breathOut, swish=swish, snap=snap_, laugh=laugh, burp=burp, crayonPop=crayonPop, catch=catch, rattle=rattle,
          hop=hop, yawn=yawn, flutter=flutter, bookClose=bookClose, crayonDown=crayonDown)
DUR_ARG = {'scratch', 'scribble', 'write', 'brush', 'page', 'run', 'shrink'}

fx = np.zeros((N, 2), np.float32); amb = np.zeros((N, 2), np.float32)
def ambience(kind, d):
    t = t_(d)
    if kind == 'city': x = lp(brown(d), 200) * .3 + bp(noise(d), 300, 1200) * (.6 + .4 * np.sin(2 * np.pi * t / 9.1)) * .05
    elif kind == 'yard': x = lp(brown(d), 300) * .15 + bp(noise(d), 800, 3000) * (.5 + .5 * np.sin(2 * np.pi * t / 4.3)) * .04
    elif kind == 'room': x = lp(brown(d), 120) * .25 + hp(noise(d), 4000) * .003
    elif kind == 'morning': x = lp(brown(d), 150) * .15 + hp(noise(d), 5000) * .003
    elif kind == 'class': x = lp(brown(d), 250) * .2 + bp(noise(d), 500, 2000) * (.5 + .5 * np.sin(2 * np.pi * t / 6.7)) * .03
    elif kind == 'wind': x = lp(brown(d), 500) * (0.5 + .5 * np.sin(2 * np.pi * t / 6.3)) * .35 + bp(noise(d), 1500, 4000) * (0.5 + .5 * np.sin(2 * np.pi * t / 3.7 + 1)) ** 3 * .04
    else: x = np.zeros(len(t))
    # crickets in the room at night; birds in the morning and the yard; a far child's shout in the yard (a recorder-like chirp, no voice)
    if kind == 'room':
        for b0 in np.arange(.8, d - .5, 1.9 + rng.random() * .4):
            for i in range(6): s = int((b0 + i * .055) * SR); L = int(.03 * SR); tt = np.arange(L) / SR; x[s:s + L] += np.sin(2 * np.pi * 4300 * tt) * np.sin(np.pi * tt / .03) * .006
    if kind in ('morning', 'yard'):
        for b0 in np.arange(1.2, d - 1, 5.1 + rng.random()):
            for i in range(3): s = int((b0 + i * .22) * SR); L = int(.12 * SR); tt = np.arange(L) / SR; x[s:s + L] += np.sin(2 * np.pi * (3100 + 700 * np.sin(np.pi * tt / .12)) * tt) * np.sin(np.pi * tt / .12) * .01
    return x
for e in E:
    k = e['type']
    if k in FX:
        g = e.get('gain', 1)
        if k in DUR_ARG and 'dur' in e: x = FX[k](g, e['dur'])
        elif k == 'crunch': x = FX[k](g, e.get('i', 0))
        else: x = FX[k](g)
        add(fx, x.astype(np.float32), e['t'], .5, e.get('pan', 0))
    elif k == 'amb':
        t0, t1 = e['t0'], e['t1']; d = t1 - t0
        x = ambience(e['kind'], d)
        f = int(.6 * SR); x[:f] *= np.linspace(0, 1, f); x[-f:] *= np.linspace(1, 0, f)
        add(amb, x.astype(np.float32), t0, .35, 0)

# ---------- score ----------
mu, sr = sf.read(os.path.join(HERE, 'music', 'score.wav'))
if sr != SR: mu = soxr.resample(mu, sr, SR)
mus = np.zeros((N, 2), np.float32); L = min(N, len(mu)); mus[:L] = mu[:L]
# duck the music under the key gags and the bell
duck = np.ones(N)
for t0, d in [(66.4, .5), (67.2, .5), (68.0, .5), (68.8, .5), (69.4, .6), (71.7, .9), (78.75, 1.0), (103.55, .6), (107.75, .7), (130.55, .8)]:
    a, b = int(t0 * SR), int((t0 + d) * SR); duck[a:b] = .55
duck = uniform_filter1d(duck, int(.12 * SR))
mus *= duck[:, None]

mix = mus * 1.3 + fx * 1.0 + amb * .8
for c in range(2): mix[:, c] = compress(mix[:, c], thr=.2, ratio=4.0, att=.002, rel=.15)
# literal silences: everything zeroed (30 ms fades)
for e in E:
    if e['type'] != 'silence': continue
    a, b = int(e['t0'] * SR), int(e['t1'] * SR); f = int(.03 * SR)
    mix[a - f:a] *= np.linspace(1, 0, f)[:, None]; mix[a:b] = 0
    if b < N: mix[b:b + f] *= np.linspace(0, 1, f)[:, None]
mix[-int(.2 * SR):] *= np.linspace(1, 0, int(.2 * SR))[:, None]
mix *= 1.4
for c in range(2): mix[:, c] = limit(mix[:, c], .32)   # a crest factor loudnorm can raise to −14 LUFS without passing −1 dBTP
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR)
def rms(x): return np.sqrt(np.mean(x ** 2) + 1e-12)
seg = lambda a, b: 20 * np.log10(rms(mix[int(a * SR):int(b * SR)]) + 1e-9)
print('mix.wav', mix.shape, 'peak', round(20 * np.log10(np.abs(mix).max()), 2), 'dBFS')
for a, b, n in [(0, 26, 'city'), (26, 48.6, 'night'), (48.6, 50, 'silence1'), (50, 56, 'night2'), (56, 80, 'trouble'), (80, 95, 'hush'), (95, 96, 'silence2'), (96, 100, 'nihao'), (100, 125, 'finale'), (125, 139, 'lullaby'), (139, 140, 'silence3')]:
    print(f'{n:10s} {seg(a, b):7.1f} dB')
