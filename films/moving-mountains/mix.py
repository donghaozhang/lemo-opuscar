# 愚公移山 · Foley, ambience and the mix. Every sound is placed from window.EV (events.json) so it sits on its frame.
# Reads music/music.wav, writes out/mix.wav (48 kHz stereo). Run from anywhere.
import sys, os, json
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, ROOT); sys.path.insert(0, HERE)
import numpy as np, soundfile as sf
from core.audio import sampler as S
from core.audio.sfx import SR, add, lp, hp, bp, noise, env_exp, t_, brown, click, clack, whoosh, creak, thump, step, rumble, compress
import tl

rng = np.random.default_rng(5); S.seed(3)
E = json.load(open(os.path.join(HERE, 'events.json'))); EV, DUR = E['ev'], E['dur']
N = int(DUR * SR)
fol = np.zeros((N, 2), np.float32); amb = np.zeros((N, 2), np.float32)
SH = {s['id']: s for s in tl.build()['shots']}

def env(d, a=.01, r=.05):
    t = t_(d); return np.minimum(1, np.minimum(t / max(a, 1e-4), (d - t) / max(r, 1e-4)).clip(0))
def f32(x): return np.asarray(x, np.float32)
# ---------------------------------------------------------------- foley voices
def knife_in(v=1):
    d = .32; t = t_(d); x = .8 * hp(noise(d), 1500) * np.exp(-t / .006) + bp(noise(d), 1200, 5000) * np.exp(-t / .09) * (.6 + .4 * np.sin(2 * np.pi * 37 * t))
    return f32(x * v * .5)
def carve(d, v=1, lo=900, hi=5500):     # knife travelling through wood fibre: gated, band-passed tearing
    t = t_(d); gate = np.zeros_like(t); i = 0
    while i < len(t):
        L = int(SR * rng.uniform(.06, .22)); g = rng.uniform(.4, 1); gate[i:i + L] = g * np.sin(np.linspace(0, np.pi, len(gate[i:i + L]))) ** .4; i += L + int(SR * rng.uniform(.0, .05))
    x = bp(noise(d), lo, hi) * gate * (.7 + .3 * np.sin(2 * np.pi * 61 * t)) + .25 * hp(noise(d), 4000) * gate ** 3
    return f32(x * v * .32 * env(d, .02, .08))
def gouge(v=1):    # the giant knife: low wood tearing with chips
    d = .9; t = t_(d); x = bp(noise(d), 250, 2200) * (np.exp(-t / .35)) * (1 + .5 * np.sin(2 * np.pi * 23 * t)) + .6 * lp(noise(d), 200) * np.exp(-t / .2)
    for k in range(10): at = rng.uniform(.05, .7); i = int(at * SR); dd = int(.02 * SR); x[i:i + dd] += .6 * hp(noise(.02), 2500)[:len(x[i:i + dd])]
    return f32(x * v * .55)
def brayer(): d = .5; t = t_(d); return f32(lp(noise(d), 1400) * (.5 + .5 * np.sin(2 * np.pi * 42 * t)) * env(d, .05, .1) * .35)
def paper(): d = .4; t = t_(d); return f32(bp(noise(d), 300, 4000) * np.exp(-((t - .18) / .1) ** 2) * .35)
def baren(d): t = t_(d); return f32(bp(noise(d), 500, 3000) * (.5 + .5 * np.sin(2 * np.pi * 4 * t)) * env(d, .05, .05) * .25)
def peel(d):
    t = t_(d); x = bp(noise(d), 800, 6000) * (t / d) ** 1.5 * .25
    for k in range(int(40 * d)): i = int(rng.uniform(0, d) ** .7 * d ** .3 * SR) % len(x); x[i:i + 60] += rng.uniform(.1, .4) * rng.standard_normal(len(x[i:i + 60]))
    return f32(x * env(d, .05, .05))
def pick_hit(v=1):
    d = 1.2; t = t_(d)
    ring = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t / dc) for f, a, dc in [(2650, .5, .09), (4170, .35, .05), (6100, .2, .03), (1530, .3, .12)])
    x = ring + .9 * hp(noise(d), 1200) * np.exp(-t / .01) + .6 * lp(noise(d), 300) * np.exp(-t / .06)
    cr = bp(noise(d), 600, 3500) * np.exp(-((t - .25) / .2) ** 2) * .3
    return f32((x + cr) * v * .55)
def earth(d=.9, v=1):
    t = t_(d); x = np.zeros_like(t)
    for k in range(int(70 * d)): at = rng.uniform(0, d * .8); i = int(at * SR); L = int(SR * .015); seg = lp(noise(.015), rng.uniform(800, 3000)) * np.hanning(L)[:len(x[i:i + L])] if False else lp(noise(.015), 1800)[:len(x[i:i + L])]; x[i:i + len(seg)] += seg * rng.uniform(.2, 1)
    x += .5 * lp(noise(d), 250) * env(d, .05, .3)
    return f32(x * v * .35)
def splash(v=1):
    d = 1.4; t = t_(d); x = lp(noise(d), 2500) * np.exp(-t / .25) + .5 * bp(noise(d), 2000, 7000) * np.exp(-t / .5) * (rng.random(len(t)) > .995) * 8
    return f32(x * v * .5)
def pebble(): d = .5; t = t_(d); return f32((np.sin(2 * np.pi * 2900 * t) * np.exp(-t / .02) + .7 * np.sin(2 * np.pi * 1800 * t) * np.exp(-t / .035) + .4 * bp(noise(d), 1500, 5000) * np.exp(-t / .01)) * .45)
def patter(v=1): d = .12; t = t_(d); return f32(bp(noise(d), 300, 2500) * np.exp(-t / .02) * v * .35)
def skid(): d = .5; t = t_(d); return f32(bp(noise(d), 600, 5000) * np.exp(-t / .2) * (1 + .4 * np.sin(2 * np.pi * 70 * t)) * .45)
def rattle(): d = .4; x = np.zeros(int(d * SR)); [x.__setitem__(slice(int(a * SR), int(a * SR) + 200), x[int(a * SR):int(a * SR) + 200] + .3 * rng.standard_normal(200)) for a in rng.uniform(0, .35, 9)]; return f32(bp(x, 1500, 6000) * .6)
def breath(d): t = t_(d); return f32(bp(noise(d), 300, 2000) * np.sin(np.pi * t / d) ** 2 * .22)
def fanflick(): d = .25; t = t_(d); return f32(bp(noise(d), 1200, 6000) * np.exp(-((t - .06) / .04) ** 2) * .35)
def grind(d): t = t_(d); return f32(lp(noise(d), 400) * (1 + .6 * np.sin(2 * np.pi * 13 * t)) * env(d, .1, .2) * .5)
def sub(v=1, f=38, d=1.6): t = t_(d); return f32((np.sin(2 * np.pi * f * t * (1 + .5 * np.exp(-t * 8))) * np.exp(-t / .5) + .3 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / .3)) * v * .9)
def air(d, lo=2000, hi=8000, g=.12): t = t_(d); return f32(bp(noise(d), lo, hi) * env(d, d * .5, d * .4) * g)
# ---------------------------------------------------------------- ambience beds
def wind(d, g=1, lo=150, hi=900):
    t = t_(d); m = .6 + .4 * np.sin(2 * np.pi * .23 * t + 1) * np.sin(2 * np.pi * .11 * t)
    return f32(bp(brown(d) if False else noise(d), lo, hi, 1) * m * env(d, .6, .6) * .09 * g)
def crickets(d):
    t = t_(d); x = np.zeros_like(t)
    for f, r in [(4400, 17), (5100, 13)]: x += np.sin(2 * np.pi * f * t) * (np.sin(2 * np.pi * r * t) > .4) * (np.sin(2 * np.pi * .7 * t + f) > -.2)
    return f32(x * .012 * env(d, .3, .5))
def waves(d, g=1):
    t = t_(d); sw = .5 + .5 * np.sin(2 * np.pi * t / 4.2) ** 2
    return f32(lp(noise(d), 900) * sw * env(d, .4, .5) * .14 * g)
def water(d):
    t = t_(d); return f32(bp(noise(d), 600, 3000) * (.6 + .4 * np.sin(2 * np.pi * 3.1 * t) * np.sin(2 * np.pi * 1.7 * t)) * env(d, .3, .3) * .05)
def cicada(d): t = t_(d); return f32(hp(noise(d), 3800) * (.5 + .5 * np.sin(2 * np.pi * 55 * t)) * (.6 + .4 * np.sin(2 * np.pi * .5 * t)) * env(d, .2, .2) * .05)

def put(x, at, g=1.0, pan=0.0, buf=None): add(fol if buf is None else buf, x, at, g, pan)
def wbh(at, v=.8, pan=0, g=1.0):
    try: put(S.hit('woodblock', None, v), at, g, pan)
    except Exception: pass

for e in EV:
    ty, t, g = e['type'], e['t'], e.get('g', 1.0); d = e.get('dur', 1.0)
    pan = e.get('pan', rng.uniform(-.35, .35))
    if ty == 'knife_in': put(knife_in(g), t, 1, .25)
    elif ty == 'carve': put(carve(d, g), t, 1, .2)
    elif ty == 'gouge_run': put(carve(d, g * .7, 500, 3000), t, .8, -.1)
    elif ty == 'carve_line': put(carve(d, g, 800, 4500), t, 1, .15)
    elif ty == 'brayer': put(brayer(), t)
    elif ty == 'paper': put(paper(), t)
    elif ty == 'baren': put(baren(d), t)
    elif ty == 'peel': put(peel(d), t, 1, .2)
    elif ty == 'wind': put(wind(d, g * 1.6), t, 1, 0, amb)
    elif ty == 'night_bed': put(crickets(d), t, 1, .3, amb); put(wind(d, .5), t, 1, 0, amb)
    elif ty == 'dawn_bed': put(wind(d, .9), t, 1, 0, amb)
    elif ty == 'sea_bed': put(waves(d, g * 1.4), t, 1, .2, amb)
    elif ty == 'river_bed': put(water(d), t, 1, -.2, amb); put(wind(d, .6), t, 1, 0, amb)
    elif ty == 'spring_bed': put(wind(d, .6, 400, 1500), t, 1, 0, amb)
    elif ty == 'summer_bed': put(cicada(d), t, 1, .3, amb)
    elif ty == 'autumn_bed': put(wind(d, 1.8, 200, 1200), t, 1, -.2, amb)
    elif ty == 'winter_bed': put(wind(d, 2.2, 300, 2200), t, 1, .2, amb)
    elif ty == 'door': put(creak(.6), t, .8, .2)
    elif ty == 'step': put(step(g * .7), t, .7, pan)
    elif ty == 'bump': put(clack(.9, 1), t, .9, .3); put(rattle(), t + .02, .7, .3)
    elif ty == 'whoosh_up': put(air(d, 300, 2500, .18), t)
    elif ty == 'thump': put(thump(1, 80), t, 1.1, -.2)
    elif ty == 'cloth': put(air(.35, 500, 3000, .3), t, g)
    elif ty == 'pick_raise': put(whoosh(.3, .5), t, .6, .3)
    elif ty == 'pick_hit': put(pick_hit(g), t, 1, pan); put(earth(.5, .4 * g), t + .05, .6, pan)
    elif ty == 'hoe': put(thump(.6, 120), t, .6, .3)
    elif ty == 'earth': put(earth(.9, g), t, .9, pan)
    elif ty == 'splash': put(splash(g), t, 1, .2)
    elif ty == 'pebble': put(pebble(), t, 1, .25); wbh(t, .3, .2, .4)
    elif ty == 'patter': put(patter(g), t, 1, .3 - .02 * (t % 3))
    elif ty == 'skid': put(skid(), t, .9, .1)
    elif ty == 'basket_rattle': put(rattle(), t, .7, .2)
    elif ty == 'pat': put(thump(.35, 200), t, .6, .1)
    elif ty == 'laugh_tok': wbh(t, .9 * g, .35, 1.0); wbh(t + .11, .6 * g, .35, .8)
    elif ty in ('fan', 'fan_drop'): put(fanflick(), t, g, .3)
    elif ty == 'pluck': put(knife_in(.4), t, .5, .2)
    elif ty == 'gust': put(wind(d, 2.5, 400, 2500), t, 1, .3, amb)
    elif ty == 'huff': put(breath(.5), t, .7)
    elif ty == 'breath': put(breath(d), t, 1.2)
    elif ty == 'tick': wbh(t, .5, .3, .6)
    elif ty == 'stone_grind': put(grind(d + .5), t, 1)
    elif ty == 'fright': put(rumble(1.2, .8), t, .9); put(clack(.5, 1), t, .8, -.3)
    elif ty == 'heaven_swell': put(air(d, 3000, 10000, .1), t)
    elif ty == 'rumble_in': put(rumble(d, .5), t, .6)
    elif ty == 'BOOM': put(sub(1.2, 36, 3.0), t, 1.2)
    elif ty == 'giant_step': put(sub(.9, 42, 1.4), t, 1.0, -.2 if t < 113.5 else .2); put(earth(.8, .6), t + .1, .6)
    elif ty == 'rumble': put(rumble(d, .8), t, .8)
    elif ty == 'rock_tear': put(earth(d, .7), t, .7, -.3); put(rumble(d, .5), t, .6, .3)
    elif ty == 'gouge': put(gouge(g), t, 1, pan)
    elif ty == 'light_swell': put(air(d, 2000, 9000, .12), t)
    elif ty == 'bonk': put(S.hit('woodblock', None, .9) if True else 0, t, 1.0, .2)
    elif ty == 'pullback': put(air(d, 200, 1200, .08 * g), t)
# wind under the plates that have no bed of their own, quiet; the morning wind in the finale
for sid in ('T3',): put(wind(SH[sid]['t1'] - SH[sid]['t0'] + .6, 1.0), SH[sid]['t0'] + .2, 1, 0, amb)        # L-cut: mountain wind arrives under the title
put(wind(SH['B6']['t1'] - SH['B2']['t0'], .8), SH['B2']['t0'], 1, 0, amb)
put(wind(SH['F4']['t1'] - SH['F1']['t0'], .45, 120, 600), SH['F1']['t0'], 1, 0, amb)                          # the answer: wind only, very low
put(waves(SH['C9']['t0'] - SH['C8']['t0'] + .1, .6), SH['C8']['t1'] - .9, 1, .3, amb)                          # J-cut: the sea before its shot
put(wind(DUR - SH['H3']['t0'], .7, 300, 1500), SH['H3']['t0'], 1, 0, amb)                                        # morning wind, H3 → end

mus, sr = sf.read(os.path.join(HERE, 'music', 'music.wav'), dtype='float32')
mus = np.pad(mus, ((0, max(0, N - len(mus))), (0, 0)))[:N]
# duck the music a little under the key foley (pick hits, gouges, splash, pebble)
duck = np.ones(N, np.float32)
for e in EV:
    if e['type'] in ('pick_hit', 'gouge', 'splash', 'pebble', 'bump', 'thump'):
        i = int(e['t'] * SR); L = int(.5 * SR); duck[i:i + L] = np.minimum(duck[i:i + L], 1 - .37 * np.exp(-np.arange(len(duck[i:i + L])) / (.18 * SR)))
mus *= duck[:, None]
fol = np.stack([compress(fol[:, 0], thr=.3, ratio=3), compress(fol[:, 1], thr=.3, ratio=3)], 1).astype(np.float32)
mix = 1.0 * mus + .9 * fol + 1.0 * amb
# true digital silence before the giants (and a near-silence before the answer handled by the score)
s0, s1 = int(SH['G4']['t0'] * SR), int(SH['H1']['t0'] * SR); f = int(.06 * SR)
mix[s0 - f:s0] *= np.linspace(1, 0, f)[:, None]; mix[s0:s1] = 0
mix = mix / max(np.abs(mix).max(), 1e-6) * .89
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix, SR, subtype='PCM_24')
print('mix.wav', round(DUR, 2), 's')
