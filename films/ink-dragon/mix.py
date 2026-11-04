"""Mix for 《墨龙借雨》: original score (music/score.wav) + foley synthesised per material (ink, paper, water, cloth, wood, wind, rain, the cloud) + ambience,
driven by events.json (window.EV). No voice. Two literal silences (the whole bus at zero). Output out/mix.wav (48k stereo, not normalised; mux.sh does −14 LUFS).
Run from the library root: .venv/bin/python films/ink-dragon/mix.py"""
import sys, os, json, numpy as np, soundfile as sf, soxr
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '../..'))
sys.path.insert(0, LIB)
from core.audio.sfx import SR, t_, noise, bp, lp, hp, env_exp, brown, whoosh, compress, limit, add, norm
from scipy.ndimage import uniform_filter1d
ev = json.load(open(os.path.join(HERE, 'events.json')))
DUR = ev['dur']; E = ev['ev']; N = int(DUR * SR)
rng = np.random.default_rng(11)
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

# ---------- foley by material ----------
def drip(v=1.):            # ink drop on paper: a descending "di" + a soft wet "pu"
    d = .4; t = t_(d); tone = chirp(1500, 360, d, .02) * np.exp(-t / .05); thud = lp(noise(d), 800) * np.exp(-t / .03) * .5
    return (tone * .6 + thud) * v
def plip(v=1.):            # a drop into a pool of ink: rounder, with a short wet tail
    d = .7; t = t_(d); tone = chirp(900, 280, d, .03) * np.exp(-t / .09); tail = bp(noise(d), 400, 2500) * np.exp(-t / .12) * .25
    return (tone * .7 + tail) * v
def dripStretch(v=1.):     # the drop swelling at the lip: a soft wet stretch
    d = .5; t = t_(d); return bp(noise(d), 150, 700) * np.sin(np.pi * t / d) ** 2 * .25 * v
def dropFall(v=1.):        # the drop lets go: a tiny wet tick and air
    d = .25; t = t_(d); return (hp(noise(d), 2500) * np.exp(-t / .004) * .5 + bp(noise(d), 600, 2000) * np.exp(-t / .06) * .2) * v
def bloom(v=1.):           # ink spreading on paper: a wet swell that dies away
    d = .9; t = t_(d); return bp(noise(d), 200, 2200) * np.sin(np.pi * np.clip(t / d, 0, 1) ** .6) * .3 * v
def splatter(v=1.): return ticks(1.0, 60, 1500, 7000) * .6 * v
def wetMove(v=1.):         # a small wet squelch
    d = .3; t = t_(d); return (bp(noise(d), 300, 1800) * np.sin(np.pi * t / d) * .3 + chirp(500, 250, d, .05) * np.exp(-t / .06) * .15) * v
def eye(v=1.):             # 点睛: a tiny bright ting
    d = 1.2; t = t_(d); return sum(a * sine(f, d) * np.exp(-t / tau) for f, a, tau in [(3140, .5, .35), (6300, .25, .18), (4700, .2, .25)]) * .4 * v
def shake(v=1.):           # the wet-puppy shake: flapping at 12 Hz with wet ticks
    d = .9; t = t_(d); flap = bp(noise(d), 200, 1500) * (np.abs(np.sin(2 * np.pi * 12 * t)) ** 3) * (1 - t / d)
    return (flap * .6 + ticks(d, 30, 2000, 7000) * .4) * v
def stretch(v=1.):         # a long soft creak (joints and wet skin)
    d = .8; t = t_(d); f0 = 90 + 40 * t / d; saw = 2 * ((np.cumsum(f0) / SR) % 1) - 1
    return bp(saw, 300, 2500) * (np.abs(np.sin(2 * np.pi * 19 * t)) ** 2.5) * np.sin(np.pi * t / d) * .25 * v
def inhale(v=1.):          # a breath in: rising band-passed noise
    d = .6; t = t_(d); return bp(noise(d), 700, 3000) * (t / d) ** 1.5 * .35 * v
def sneeze(v=1.):          # a tiny sneeze: a squeak and a burst
    d = .35; t = t_(d); sq = chirp(1600, 900, d, .03) * np.exp(-t / .03); burst = bp(noise(d), 500, 5000) * np.exp(-t / .07)
    return (sq * .4 + burst * .6) * v
def tiptoe(v=1.):          # a claw on paper: a very short tick
    d = .05; t = t_(d); return (hp(noise(d), 2500) * np.exp(-t / .003) * .5 + sine(1900, d) * np.exp(-t / .005) * .3) * v
def fingers(v=1.):         # skin and cloth brushed
    d = .4; t = t_(d); return bp(noise(d), 300, 2500) * np.sin(np.pi * t / d) * .3 * v
def snort(v=1.):           # the painter's snort: a nasal burst with a buzz
    d = .5; t = t_(d); buzz = (1 + .8 * np.sign(np.sin(2 * np.pi * 62 * t))) / 2
    return bp(noise(d), 300, 1400) * buzz * np.exp(-t / .12) * (1 - np.exp(-t / .01)) * .9 * v
def snore(v=1.):           # the painter's snore: a slow breathy inhale with a soft buzz, then a puff out
    d = 1.6; t = t_(d); e = np.sin(np.pi * np.clip(t / 1.0, 0, 1)) ** 1.5 * (t < 1.0); buzz = (1 + .6 * np.sin(2 * np.pi * 54 * t)) / 2
    x = bp(noise(d), 150, 700) * buzz * e * .9; x += lp(noise(d), 600) * np.exp(-np.maximum(t - 1.1, 0) / .15) * (t > 1.1) * .25
    return x * v
def cloudSnore(v=1.):      # the cloud's snore: deeper and bubbling, rhymed with the painter's
    d = 1.9; t = t_(d); e = np.sin(np.pi * np.clip(t / 1.3, 0, 1)) ** 1.4 * (t < 1.3); bub = (1 + .8 * np.sin(2 * np.pi * 23 * t + 2 * np.sin(2 * np.pi * 3 * t))) / 2
    x = lp(noise(d), 260) * bub * e * 1.3 + bp(noise(d), 350, 600) * e * .2 + bp(noise(d), 200, 900) * np.exp(-np.maximum(t - 1.4, 0) / .2) * (t > 1.4) * .25
    return x * v
def tinySnore(v=1.):       # the little dragon's snore
    d = 1.0; t = t_(d); e = np.sin(np.pi * np.clip(t / .7, 0, 1)) ** 1.5 * (t < .7); buzz = (1 + .6 * np.sin(2 * np.pi * 110 * t)) / 2
    return (bp(noise(d), 600, 1800) * buzz * e * .35 + sine(640, d) * e * .05) * v
def cloth(v=1.):
    d = .6; t = t_(d); return bp(noise(d), 300, 3000) * np.sin(np.pi * t / d) * .35 * v
def incense(v=1.):         # a faint crackle and hiss
    d = 1.2; t = t_(d); return (ticks(d, 14, 2000, 8000, .003) * .35 + hp(noise(d), 5000) * .02) * win(d, .2, .4) * v
def ash(v=1.):             # a flake breaking off: a tiny crackle
    d = .3; return ticks(d, 5, 2500, 9000, .003) * .5 * v
def ashLand(v=1.):
    d = .08; t = t_(d); return lp(noise(d), 1500) * np.exp(-t / .006) * .3 * v
def dive(v=1.):            # into the paper like water: air tear + splash + a low plunge
    d = 1.2; t = t_(d); tear = bp(noise(d), 1000, 8000) * np.exp(-t / .08) * .8; spl = bp(noise(d), 300, 3500) * np.exp(-t / .3) * .6
    boom = chirp(180, 50, d, .08) * np.exp(-t / .3) * .7
    return (tear + spl + boom) * v
def rings(v=1.):           # ripples: a watery gurgle
    d = 1.4; t = t_(d); return (bp(noise(d), 200, 1600) * (.5 + .5 * np.sin(2 * np.pi * 7 * t)) * np.exp(-t / .5) * .4 + ticks(d, 12, 800, 3000, .01) * .2) * v
def flap(v=1.):            # brush-air: the dragon's flight, band-passed noise with bristle grains
    d = .5; t = t_(d); x = bp(noise(d), 900, 5000); grain = (rng.random(len(t)) < .015) * rng.standard_normal(len(t)) * 2
    return (x + bp(grain, 2000, 8000) * .4) * np.sin(np.pi * t / d) ** 1.6 * .35 * v
def dust(v=1.):            # the belly skimming the dry bed: a dry bristle scrape
    d = .45; t = t_(d); return (bp(noise(d), 1200, 6000) * .5 + ticks(d, 25, 3000, 9000, .002) * .5) * np.sin(np.pi * t / d) * .35 * v
def creak(v=1.):           # wood creak (the boat)
    d = .45; t = t_(d); f0 = 70 + rng.random() * 40; saw = 2 * ((t * f0 * (1 + .3 * np.sin(2 * np.pi * 9 * t))) % 1) - 1
    return bp(saw, 400, 3000) * (np.abs(np.sin(2 * np.pi * 23 * t)) ** 3) * np.sin(np.pi * t / d) * .5 * v
creakChair = creak
def landSoft(v=1.):
    d = .3; t = t_(d); return (chirp(140, 70, d, .02) * np.exp(-t / .06) + lp(noise(d), 500) * np.exp(-t / .03) * .5) * .6 * v
def throat(v=1.):          # ahem: two short bursts
    d = .5; t = t_(d); x = bp(noise(d), 500, 1800) * ((t < .09) * np.exp(-t / .04) + ((t > .16) & (t < .3)) * np.exp(-(t - .16) / .05))
    return x * (1 + .5 * np.sign(np.sin(2 * np.pi * 95 * t))) * .55 * v
def tap(v=1.):             # the snout on a cloud: a soft poff
    d = .25; t = t_(d); return (lp(noise(d), 700) * np.exp(-t / .03) * .7 + sine(190, d) * np.exp(-t / .05) * .3) * v
def mumble(v=1.):          # the cloud mumbling: a low wobbling hum
    d = .8; t = t_(d); f = 115 * (1 + .06 * np.sin(2 * np.pi * 6 * t)); x = np.sin(2 * np.pi * np.cumsum(f) / SR)
    return (x * .35 + lp(noise(d), 500) * .15) * np.sin(np.pi * t / d) * v
def roll(v=1.):            # a big soft mass rolling over
    d = .9; t = t_(d); return (lp(brown(d), 400) * .8 + bp(noise(d), 200, 1200) * .2) * np.sin(np.pi * t / d) ** .8 * .6 * v
def pop(v=1.):
    d = .15; t = t_(d); return chirp(700, 1800, d, .01)[::-1] * np.exp(-t / .03) * .5 * v if False else chirp(400, 1500, d, .02) * np.exp(-t / .025) * .5 * v
def bite(v=1.):
    d = .08; t = t_(d); return (hp(noise(d), 1500) * np.exp(-t / .003) * .6 + sine(900, d) * np.exp(-t / .01) * .3) * v
def tug(v=1., dur=1.8):    # cloth-paper stretching, rising in pitch
    d = dur; t = t_(d); f0 = 60 + 90 * (t / d) ** 2; saw = 2 * ((np.cumsum(f0) / SR) % 1) - 1
    return (bp(saw, 300, 2200) * (np.abs(np.sin(2 * np.pi * 17 * t)) ** 2) * .25 + bp(noise(d), 400, 2500) * .08) * win(d, .1, .05) * v
def skid(v=1.):
    d = .18; t = t_(d); return bp(noise(d), 600, 3500) * np.exp(-t / .07) * (1 - np.exp(-t / .01)) * .4 * v
def yank(v=1.):            # a snap and a whip
    d = .4; t = t_(d); snap = hp(noise(d), 1200) * np.exp(-t / .004); wh = bp(noise(d), 800, 6000) * np.exp(-(t - .03) / .08) * (t > .03)
    return (snap * .8 + wh * .5) * v
def flung(v=1.): return whoosh(.6, .8 * v)
def landHead(v=1.):
    d = .4; t = t_(d); return (chirp(160, 60, d, .02) * np.exp(-t / .07) * .8 + lp(noise(d), 1200) * np.exp(-t / .02) * .6 + bp(noise(d), 400, 2000) * np.exp(-t / .1) * .2) * v
def wobble(v=1.):          # a spring settling
    d = .7; t = t_(d); f = 320 * (1 + .25 * np.sin(2 * np.pi * 9 * t) * np.exp(-t / .3)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .25) * .18 * v
def puffUp(v=1.):          # inflating: a swell with a rising hum
    d = 1.2; t = t_(d); return (bp(noise(d), 300, 1500) * (t / d) ** 1.2 * .3 + chirp(90, 160, d, .5)[::-1] * (t / d) * .12) * win(d, .05, .05) * v
def squeak(v=1.):          # the roar that comes out a squeak
    d = .4; t = t_(d); f = 1700 * (1 + .12 * np.sin(2 * np.pi * 28 * t)) * (1 + .3 * np.clip(t / .08, 0, 1)); x = np.sin(2 * np.pi * np.cumsum(f) / SR)
    return x * win(d, .01, .12) * .45 * v
def lid(v=1.):
    d = .06; t = t_(d); return lp(noise(d), 2500) * np.exp(-t / .006) * .25 * v
def gust(v=1.):            # the cloud blows: a big wind blast
    d = 1.5; t = t_(d); e = np.sin(np.pi * np.clip(t / d, 0, 1) ** .5) ** 1.2; x = np.zeros(len(t))
    for i in range(0, len(t), 480):
        hi = min(len(t), i + 480); f = 500 + 2500 * np.sin(np.pi * i / len(t)); x[i:hi] = bp(noise(d)[max(0, i - 2000):hi], f * .7, f * 1.4)[-(hi - i):]
    return (norm(x) * .8 + lp(brown(d), 300) * .5) * e * v
def leaf(v=1.):            # blown off like a leaf: fluttering
    d = 1.0; t = t_(d); return bp(noise(d), 600, 4000) * (np.abs(np.sin(2 * np.pi * 14 * t)) ** 2) * (1 - t / d) * .4 * v
def pant(v=1., dur=2.0):
    d = dur; t = t_(d); x = np.zeros(len(t)); k = 0
    while k * .32 < d - .2:
        s = int(k * .32 * SR); L = int(.14 * SR); tt = np.arange(L) / SR; x[s:s + L] += bp(rng.standard_normal(L), 600, 2500) * np.sin(np.pi * tt / .14) * (.8 - .1 * k); k += 1
    return x * .3 * v
def riseAir(v=1.):
    d = 1.6; t = t_(d); return bp(noise(d), 400, 2500) * (t / d) * np.exp(-t / 1.2) * .25 * v
def diveStroke(v=1.):      # the flying-white dive: tearing air, sharp
    d = .6; t = t_(d); return (bp(noise(d), 800, 9000) * np.exp(-t / .1) * 1.2 + lp(brown(d), 700) * np.exp(-t / .3) * .8) * v
def cloudHit(v=1.):        # into the cloud: a deep soft pomf
    d = .7; t = t_(d); return (lp(noise(d), 500) * np.exp(-t / .08) * .8 + chirp(120, 45, d, .05) * np.exp(-t / .25) * .9) * v
def inkSpread(v=1., dur=6.):   # ink spreading inside the cloud: a wet rush that swells, with granular ticks
    d = dur; t = t_(d); e = np.sin(np.pi * np.clip(t / d, 0, 1) ** .7) ** 1.3
    return (bp(noise(d), 200, 2500) * e * .35 + ticks(d, 90, 800, 4000, .01) * e * .35 + lp(brown(d), 200) * e * .3) * v
def gasp(v=1.):
    d = .45; t = t_(d); return bp(noise(d), 900, 4500) * (t / .25) ** 2 * (t < .25) * .6 * v + bp(noise(d), 500, 2000) * np.exp(-(t - .25) / .08) * (t >= .25) * .3 * v
def sag(v=1.):             # a low groan sinking
    d = 1.2; t = t_(d); f = 95 * np.exp(-t / 2.5); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * (1 + .4 * np.sign(np.sin(2 * np.pi * 31 * t)))
    return (lp(x, 600) * .3 + lp(noise(d), 300) * .15) * np.sin(np.pi * t / d) * v
def thunder(v=1.):
    d = 3.0; t = t_(d); crack = bp(noise(d), 600, 5000) * np.exp(-t / .05) * .6; rum = lp(brown(d), 160) * np.exp(-t / 1.1) * (1 - np.exp(-t / .05)) * 2.5
    return (crack + rum) * v
def firstDrops(v=1.):
    x = np.zeros(len(t_(1.2)))
    for i in range(3): y = drip(.6 * (1 + .1 * i)); s = int(i * .25 * SR); x[s:s + len(y)] += y
    return x * v
def pinesDrip(v=1.):
    x = np.zeros(len(t_(2.0)))
    for i in range(5): y = plip(.35); s = int(rng.random() * 1.2 * SR); x[s:s + len(y)] += y[:len(x) - s]
    return x * v
def riverFill(v=1.):       # water rushing in
    d = 3.5; t = t_(d); e = np.sin(np.pi * np.clip(t / d, 0, 1) ** .6); return (bp(noise(d), 150, 1400) * e * .5 + bp(noise(d), 800, 4000) * (.5 + .5 * np.sin(2 * np.pi * 5 * t)) * e * .15 + ticks(d, 40, 1000, 4000, .01) * e * .3) * v
def bowlDrop(v=1., k=0):   # a drop into a ceramic bowl, the pitch rising as it fills
    d = .5; t = t_(d); f = 1900 * (1 + .09 * k); return (sine(f, d) * np.exp(-t / .12) * .35 + sine(f * 2.6, d) * np.exp(-t / .05) * .12 + drip(.3)[:len(t)] if len(drip(.3)) >= len(t) else sine(f, d) * np.exp(-t / .12) * .35) * v
def drink(v=1.):
    d = .35; t = t_(d); return (lp(noise(d), 900) * np.exp(-t / .06) * .4 + chirp(220, 120, d, .05) * np.exp(-t / .08) * .3) * v
def chirpLaugh(v=1.):      # a small xiao-like chirp for the child's laugh (no voice in this film)
    d = .5; t = t_(d); f = 880 * (1 + .25 * np.clip(t / .12, 0, 1)) * (1 + .03 * np.sin(2 * np.pi * 7 * t)); x = np.sin(2 * np.pi * np.cumsum(f) / SR)
    e = (np.sin(np.pi * np.clip(t / .22, 0, 1)) * (t < .22)) + (np.sin(np.pi * np.clip((t - .26) / .22, 0, 1)) * (t >= .26))
    return (lp(x, 3000) * .3 + bp(noise(d), 1500, 4000) * .05) * e * v
def danceStep(v=1.):
    d = .12; t = t_(d); return (lp(noise(d), 700) * np.exp(-t / .02) * .5 + chirp(150, 80, d, .01) * np.exp(-t / .04) * .3) * v
def redDrop(v=1.):
    d = 1.0; t = t_(d); return bp(noise(d), 1500, 6000) * (t / d) ** 2 * .12 * v
def touchPaper(v=1.):
    d = .3; t = t_(d); return (lp(noise(d), 1500) * np.exp(-t / .01) * .4 + bp(noise(d), 300, 1800) * np.exp(-t / .07) * .2) * v
def brushUp(v=1.):         # the brush lifted from the desk: a wooden tick
    d = .12; t = t_(d); return (bp(noise(d), 1200, 5000) * np.exp(-t / .006) * .5 + sine(1150, d) * np.exp(-t / .012) * .3) * v
def dip(v=1.):             # the brush dipped and stirred in the ink
    d = .7; t = t_(d); return (bp(noise(d), 400, 2200) * np.sin(np.pi * t / d) * .3 + ticks(d, 10, 700, 2500, .012) * .3) * v
def stroke(v=1., dur=.15):  # the brush writing one stroke on paper: bristles, short
    d = dur + .08; t = t_(d); x = bp(noise(d), 1500, 6500); grain = (rng.random(len(t)) < .03) * rng.standard_normal(len(t)) * 2
    e = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.2
    return (x + bp(grain, 2000, 8000) * .5) * e * .45 * v
def sealLift(v=1.):
    d = .1; t = t_(d); return bp(noise(d), 800, 4000) * np.exp(-t / .008) * .4 * v
def seal(v=1.):            # the seal pressed: a wooden thump + paper crackle
    d = .7; t = t_(d); thud = chirp(190, 100, d, .01) * np.exp(-t / .08); knock = bp(noise(d), 600, 2400) * np.exp(-t / .012) * .6; paper = ticks(d, 12, 3000, 9000, .003) * .25
    return (thud + knock + paper) * v
def drying(v=1., dur=1.5):
    d = dur; return ticks(d, 20, 3000, 10000, .002) * .25 * win(d, .3, .3) * v

FX = dict(drip=drip, plip=plip, dripStretch=dripStretch, dropFall=dropFall, bloom=bloom, splatter=splatter, wetMove=wetMove, eye=eye, shake=shake, stretch=stretch,
          inhale=inhale, sneeze=sneeze, tiptoe=tiptoe, fingers=fingers, snort=snort, snore=snore, cloudSnore=cloudSnore, tinySnore=tinySnore, cloth=cloth,
          incense=incense, ash=ash, ashLand=ashLand, dive=dive, rings=rings, flap=flap, dust=dust, creak=creak, creakChair=creakChair, landSoft=landSoft,
          throat=throat, tap=tap, mumble=mumble, roll=roll, pop=pop, bite=bite, tug=tug, skid=skid, yank=yank, flung=flung, landHead=landHead, wobble=wobble,
          puffUp=puffUp, squeak=squeak, lid=lid, gust=gust, leaf=leaf, pant=pant, riseAir=riseAir, diveStroke=diveStroke, cloudHit=cloudHit, inkSpread=inkSpread,
          gasp=gasp, sag=sag, thunder=thunder, firstDrops=firstDrops, pinesDrip=pinesDrip, riverFill=riverFill, bowlDrop=bowlDrop, drink=drink, chirp=chirpLaugh,
          danceStep=danceStep, redDrop=redDrop, touchPaper=touchPaper, brushUp=brushUp, dip=dip, stroke=stroke, sealLift=sealLift, seal=seal, drying=drying)
PAN = dict(tiptoe=-.1, incense=.4, ash=.4, ashLand=.4, snore=.1, cloudSnore=-.3, mumble=-.3, roll=-.3, tap=-.2, gust=-.3, squeak=.2, plip=-.4, seal=.2, bowlDrop=.2, chirp=.2, drink=.2)
DUR_ARG = {'tug', 'pant', 'inkSpread', 'stroke', 'drying'}

fx = np.zeros((N, 2), np.float32); amb = np.zeros((N, 2), np.float32)
def ambience(kind, d, k=1.):
    t = t_(d)
    if kind == 'room': x = lp(brown(d), 120) * .35 + hp(noise(d), 4000) * .004
    elif kind == 'wind': x = lp(brown(d), 500) * (0.6 + .4 * np.sin(2 * np.pi * t / 7.3)) * .5
    elif kind == 'mist': x = bp(noise(d), 200, 900) * (.6 + .4 * np.sin(2 * np.pi * t / 5.1)) * .12
    elif kind == 'dust': x = bp(noise(d), 1500, 6000) * .04
    elif kind == 'pinewind': x = lp(brown(d), 600) * (0.5 + .5 * np.sin(2 * np.pi * t / 4.7)) * .5 + bp(noise(d), 1500, 3500) * (0.5 + .5 * np.sin(2 * np.pi * t / 3.1 + 1)) ** 3 * .05
    elif kind == 'summit': x = lp(brown(d), 400) * (0.6 + .4 * np.sin(2 * np.pi * t / 6.1)) * .3
    elif kind == 'rain': x = (bp(noise(d), 600, 7000) * .35 + ticks(d, int(d * 90), 1500, 7000, .006, 1.0) * .4) * np.clip(t / 1.5, 0, 1) * k
    elif kind == 'rainTail': x = (bp(noise(d), 600, 7000) * .25 + ticks(d, int(d * 40), 1500, 7000, .006, 1.0) * .4) * np.clip(1 - t / d, 0, 1) ** 1.5
    elif kind == 'morning': x = lp(brown(d), 150) * .18 + hp(noise(d), 5000) * .003
    else: x = np.zeros(len(t))
    # a far bird in the morning: three chirps every ~6 s
    if kind == 'morning':
        for b0 in np.arange(1.5, d - 1, 6.3):
            for i in range(3):
                s = int((b0 + i * .22) * SR); L = int(.12 * SR); tt = np.arange(L) / SR
                x[s:s + L] += np.sin(2 * np.pi * (3200 + 600 * np.sin(np.pi * tt / .12)) * tt) * np.sin(np.pi * tt / .12) * .012
    return x
for e in E:
    k = e['type']
    if k in FX:
        g = e.get('gain', 1)
        if k in DUR_ARG and 'dur' in e: x = FX[k](g, e['dur'])
        elif k == 'bowlDrop': x = FX[k](g, e.get('k', 0))
        else: x = FX[k](g)
        add(fx, x.astype(np.float32), e['t'], .5, PAN.get(k, 0))
    elif k == 'amb':
        t0, t1 = e['t0'], e['t1']; d = t1 - t0
        x = ambience(e['kind'], d, e.get('k', 1.))
        f = int(.6 * SR); x[:f] *= np.linspace(0, 1, f); x[-f:] *= np.linspace(1, 0, f)
        add(amb, x.astype(np.float32), t0, .35, 0)

# ---------- score ----------
mu, sr = sf.read(os.path.join(HERE, 'music', 'score.wav'))
if sr != SR: mu = soxr.resample(mu, sr, SR)
mus = np.zeros((N, 2), np.float32); L = min(N, len(mu)); mus[:L] = mu[:L]
# duck the music a little under the key foley moments (the first drip, the snort, the squeak, the plip, the seal)
duck = np.ones(N)
for t0, d in [(3.5, .7), (16.45, .7), (64.3, .6), (103.95, 1.2), (124.95, .9)]:
    a, b = int(t0 * SR), int((t0 + d) * SR); duck[a:b] = .55
duck = uniform_filter1d(duck, int(.12 * SR))
mus *= duck[:, None]

mix = mus * 1.3 + fx * 1.0 + amb * .8
# tame the hot peaks (drum hits, the dive) before the limiter so loudnorm can reach −14 LUFS with true peak under −1 dBTP
for c in range(2): mix[:, c] = compress(mix[:, c], thr=.2, ratio=4.0, att=.002, rel=.15)
# literal silences: everything zeroed (30 ms fades)
for e in E:
    if e['type'] != 'silence': continue
    a, b = int(e['t0'] * SR), int(e['t1'] * SR); f = int(.03 * SR)
    mix[a - f:a] *= np.linspace(1, 0, f)[:, None]; mix[a:b] = 0
    if b < N: mix[b:b + f] *= np.linspace(0, 1, f)[:, None]
# the one sound allowed inside the first silence: the drip at 78.0 (added after the gate)
for e in E:
    if e['type'] == 'drip' and 77.9 < e['t'] < 78.1: add(mix, drip(e.get('gain', 1)).astype(np.float32), e['t'], .5, 0)
mix[-int(.2 * SR):] *= np.linspace(1, 0, int(.2 * SR))[:, None]
mix *= 1.4
for c in range(2): mix[:, c] = limit(mix[:, c], .32)   # a crest factor loudnorm can raise to −14 LUFS without passing −1 dBTP
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR)
def rms(x): return np.sqrt(np.mean(x ** 2) + 1e-12)
seg = lambda a, b: 20 * np.log10(rms(mix[int(a * SR):int(b * SR)]) + 1e-9)
print('mix.wav', mix.shape, 'peak', round(20 * np.log10(np.abs(mix).max()), 2), 'dBFS')
for a, b, n in [(0, 30, 'night'), (30, 50, 'into'), (50, 75, 'cloud'), (75, 77.9, 'silence1'), (78.6, 82, 'silence1b'), (82, 92, 'dive'), (92, 104, 'rain'), (104, 122, 'dawn'), (122, 130, 'seal'), (130, 132, 'silence2')]:
    print(f'{n:10s} {seg(a, b):7.1f} dB')
