"""《机甲外婆》 — Foley + mix: the synth score (music/score.wav) + synthesised Foley + beds → out/mix.wav
Beds: rain (indoors on glass / outdoors on the street), wind, city hum, distant sirens, birds at dawn.
Foley tied to the picture (all times from timeline.json): tape power-on, TV murmur, phone buzz, chopsticks, lid, cloth
knot, tarp whoosh, thunder, engine coughs, the dashboard smacks, power-up whine, servos, mech footsteps (from the walk
cycles in the shots), tyre hiss, horns, metal creak, impacts, sparks, drone rotors and siren, scan beeps, radio static,
the identifying chime, wind gusts and the slip scrape, grip clanks, the knock on glass, the window latch, the shutter,
the message whoosh. No voice. Mix: score ducked under key Foley, beds low, −14 LUFS with true peak ≤ −1 dBTP after mux."""
import sys, os, json
import numpy as np, soundfile as sf
D = os.path.dirname(os.path.abspath(__file__))
ROOT = os.environ.get('LIB') or os.path.abspath(os.path.join(D, '../..'))
sys.path.insert(0, ROOT)
from core.audio.sfx import SR, bp, lp, hp, t_, env_exp, norm, add, limit, compress
rng = np.random.default_rng(88)
TL = json.load(open(os.path.join(D, 'timeline.json'))); SEC, H, DUR, SHOTS = TL['SEC'], TL['HIT'], TL['DUR'], TL['SHOTS']
N = int(round(DUR * SR)); tt = np.arange(N) / SR
os.makedirs(os.path.join(D, 'out'), exist_ok=True)
score, sr = sf.read(os.path.join(D, 'music/score.wav')); assert sr == SR
score = np.pad(score, ((0, max(0, N - len(score))), (0, 0)))[:N]
def at(s, b=0.0): return SEC[s]['t0'] + b * SEC[s]['bar']
def shots(name): return [s for s in SHOTS if s['name'] == name]
def nz(d): return rng.standard_normal(int(round(d * SR)))
fx = np.zeros((N, 2)); bed = np.zeros((N, 2))
def put(buf, x, t, g=1.0, pan=0.0):
    if 0 <= t < DUR: add(buf, x, t, g, pan)

# ---------------- sounds ----------------
def thud(f=55, d=.5, v=1.0):            # heavy mech footfall: sub thump + metal clank + splash
    t = t_(d); x = np.sin(2 * np.pi * f * t * (1 + .6 * np.exp(-t / .03))) * np.exp(-t / .12)
    x += bp(nz(d), 1800, 5200) * np.exp(-t / .02) * .35 + bp(nz(d), 400, 1200) * np.exp(-t / .06) * .3
    return norm(x) * v
def servo(d=.5, f0=320, f1=520, v=1.0):
    t = t_(d); f = f0 + (f1 - f0) * t / d; ph = 2 * np.pi * np.cumsum(f) / SR
    x = (np.sign(np.sin(ph)) * .3 + np.sin(ph * 2) * .4) * (.6 + .4 * np.sin(2 * np.pi * 31 * t)); x = bp(x, 200, 3000)
    return norm(x * np.minimum(1, t / .03) * np.minimum(1, (d - t) / .06)) * v
def whoosh(d=.5, lo=300, hi=3000, v=1.0):
    t = t_(d); return norm(bp(nz(d), lo, hi) * np.sin(np.pi * t / d) ** 2) * v
def impact(v=1.0, d=1.6):
    t = t_(d); x = np.sin(2 * np.pi * 42 * t * (1 + np.exp(-t / .05))) * np.exp(-t / .35) + lp(nz(d), 900) * np.exp(-t / .2) * .6 + bp(nz(d), 2000, 8000) * np.exp(-t / .08) * .4
    return norm(x) * v
def creak(d=.8, v=1.0):
    t = t_(d); f = 90 + 40 * np.sin(2 * np.pi * 3 * t); ph = 2 * np.pi * np.cumsum(f) / SR
    return norm(bp(np.sign(np.sin(ph)) * (.5 + .5 * rng.random(len(t))), 300, 2500) * np.sin(np.pi * t / d)) * v
def sparks(d=1.0, v=1.0):
    out = np.zeros(int(d * SR))
    for _ in range(int(d * 40)):
        s = int(rng.random() * (len(out) - 2000)); c = hp(nz(.03), 3000) * env_exp(.03, .004) * rng.random(); out[s:s + len(c)] += c
    return out * v
def thunder(d=3.0, v=1.0):
    t = t_(d); x = lp(nz(d), 220) * np.exp(-t / 1.1) * (1 + .8 * np.sin(2 * np.pi * 1.7 * t) ** 2) + bp(nz(d), 300, 1500) * np.exp(-t / .2) * .5
    return norm(x) * v
def cough(v=1.0):
    d = .32; t = t_(d); x = lp(nz(d), 500) * np.exp(-t / .08) + np.sin(2 * np.pi * 70 * t) * np.exp(-t / .1) * .7
    return norm(x) * v
def whine(d=1.0, f0=200, f1=2400, v=1.0):
    t = t_(d); f = f0 * (f1 / f0) ** (t / d); ph = 2 * np.pi * np.cumsum(f) / SR
    return norm((np.sin(ph) + .3 * np.sin(2 * ph)) * np.minimum(1, t / .05) * np.exp(-np.maximum(0, t - d * .8) / .1)) * v
def smackS(v=1.0):
    d = .25; t = t_(d); return norm(bp(nz(d), 300, 4000) * np.exp(-t / .02) + np.sin(2 * np.pi * 160 * t) * np.exp(-t / .05) * .8) * v
def buzz(d=.5, v=1.0):
    t = t_(d); return norm(np.sign(np.sin(2 * np.pi * 180 * t)) * (np.sin(2 * np.pi * 12 * t) > 0) * .5) * v
def beep(f=1800, d=.08, v=1.0):
    t = t_(d); return norm(np.sin(2 * np.pi * f * t) * np.minimum(1, (d - t) / .01) * np.minimum(1, t / .003)) * v
def siren(d=1.6, v=1.0):
    t = t_(d); f = 700 + 300 * np.sin(2 * np.pi * 1.6 * t); ph = 2 * np.pi * np.cumsum(f) / SR
    return norm(np.sin(ph) + .25 * np.sin(3 * ph)) * np.minimum(1, t / .05) * np.minimum(1, (d - t) / .2) * v
def rotor(d, v=1.0):
    t = t_(d); x = bp(nz(d), 150, 900) * (.6 + .4 * np.sign(np.sin(2 * np.pi * 95 * t))) + np.sin(2 * np.pi * 190 * t) * .2
    return norm(x * np.minimum(1, t / .2) * np.minimum(1, (d - t) / .2)) * v
def static(d, v=1.0): return norm(hp(nz(d), 1500) * (.5 + .5 * (rng.random(int(round(d * SR))) > .3))) * v
def chime(v=1.0):
    d = 1.2; t = t_(d); x = sum(np.sin(2 * np.pi * f * t) * np.exp(-t / .5) for f in (880, 1320, 1760)); return norm(x) * v
def knock(v=1.0):
    d = .18; t = t_(d); return norm(np.sin(2 * np.pi * 900 * t) * np.exp(-t / .03) + bp(nz(d), 2000, 7000) * np.exp(-t / .01) * .5 + np.sin(2 * np.pi * 220 * t) * np.exp(-t / .05)) * v
def click(v=1.0, f=3500): d = .03; return norm(bp(nz(d), f, f * 1.8) * env_exp(d, .003)) * v
def shutter(v=1.0): return np.concatenate([click(v, 3000), np.zeros(int(.06 * SR)), click(v * .8, 2200)])
def horn(d=.5, v=1.0):
    t = t_(d); x = sum(np.sign(np.sin(2 * np.pi * f * t)) for f in (330, 415)) * .5; return norm(lp(x, 2500) * np.minimum(1, (d - t) / .05)) * v
def scrape(d=.9, v=1.0): t = t_(d); return norm(bp(nz(d), 800, 5000) * (.6 + .4 * np.sin(2 * np.pi * 23 * t)) * np.sin(np.pi * t / d)) * v
def drip(v=1.0): d = .1; t = t_(d); f = 1400 * (1 + 1.5 * np.exp(-t / .01)); return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(d, .02)) * v

# ---------------- beds ----------------
def region(a, b, ramp=.3):
    m = np.zeros(N); i0, i1 = int(a * SR), int(b * SR); m[i0:i1] = 1
    r = int(ramp * SR); m[i0:min(N, i0 + r)] *= np.linspace(0, 1, min(r, N - i0)); m[max(0, i1 - r):i1] *= np.linspace(1, 0, i1 - max(0, i1 - r)); return m
rainOut = bp(rng.standard_normal(N), 800, 9000) * .5 + lp(rng.standard_normal(N), 600) * .3
rainIn = lp(bp(rng.standard_normal(N), 300, 4000), 2500) * .35
wind = lp(rng.standard_normal(N), 400) * (1 + .7 * np.sin(2 * np.pi * .23 * tt) * np.sin(2 * np.pi * .07 * tt)) * .8
city = lp(rng.standard_normal(N), 250) * .4
outdoor = region(0, at('HOME')) + region(at('GARAGE', 5), at('WINDOW')) + region(at('DAWN'), DUR) * .0
indoor = region(at('HOME'), at('GARAGE', 5)) * .6 + region(at('WINDOW'), at('DAWN'))
windM = region(at('DRIVE'), at('WINDOW')) * .6 + region(at('CLIMB'), at('WINDOW')) * 1.4 + region(at('DAWN'), DUR) * .3
dawnM = region(at('DAWN'), DUR)
sil = region(H['silence'], H['chord'], .2)
b = rainOut * outdoor * .55 + rainIn * indoor * .5 + wind * windM * .5 + city * (outdoor + dawnM * .5) * .35
b *= 1 - sil * .6                                                   # in the silence only the rain on the glass stays
bed = np.stack([b * .95, b * 1.0], 1)
# birds at dawn
for i in range(14):
    t0 = at('DAWN', .4) + rng.random() * (DUR - at('DAWN', .4) - 2)
    d = .25; t = t_(d); f = 3200 + 900 * np.sin(2 * np.pi * 9 * t); put(fx, norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d)) * .05, t0, 1, rng.random() - .5)

# ---------------- Foley on the picture ----------------
# tape power-on (thunk + line whine)
put(fx, impact(.6, .6), .02, .25); put(fx, whine(.5, 8000, 15000, .2), .03, .12)
for t0 in (at('OPEN', 1.1), H['title'] - .05, H['flash1'], H['unveil'], at('CLIMB', .5)): put(fx, thunder(3.0), t0 + .25, .45, rng.random() * .6 - .3)
for i in range(4): put(fx, siren(1.4, .4), at('OPEN', .3) + i * 1.6, .06, -.6)
# home
s = shots('apartment')[0]; put(fx, bp(nz(s['t1'] - s['t0']), 300, 2400) * .2 * (1 + np.sin(np.arange(int(round((s['t1'] - s['t0']) * SR))) / SR * 2 * np.pi * 3)), s['t0'], .25, -.6)   # TV murmur
for i in range(6): put(fx, click(.5, 1200), s['t0'] + .3 + i * .45, .12, .1)                       # knitting needles
for i in range(3): put(fx, buzz(.35), H['buzz'] + i * .5, .35, .3)
for i, k in enumerate(('msg1', 'msg2', 'msg3', 'msg4')): put(fx, beep(1600 if i == 0 else 1200, .07), H[k], .25, 0)
put(fx, whoosh(.3, 1500, 7000), H['glasses'], .12)
s = shots('kitchen')[0]
for i in range(5): put(fx, click(.6, 2600), s['t0'] + .15 + i * .26, .2, .2)                        # chopsticks
put(fx, click(1, 1500), H['lid'], .45); put(fx, impact(.3, .3), H['lid'], .15)
put(fx, whoosh(.25, 800, 4000), H['knot'] - .2, .25); put(fx, click(.8, 900), H['knot'], .3)
put(fx, whoosh(.4, 300, 2000), H['lift'] - .15, .2)
# garage
put(fx, whoosh(.6, 150, 1600), H['tug'], .5); put(fx, whoosh(.9, 200, 2500), H['unveil'] - .1, .6)
put(fx, servo(.5, 240, 360), H['sit'], .2); put(fx, click(.8, 2400), H['tapLevel'], .35)
put(fx, servo(.3, 200, 260), H['cough1'] - .35, .25)
put(fx, cough(), H['cough1'], .7); put(fx, cough(), H['cough2'], .7)
put(fx, smackS(), H['smack'], .9); put(fx, whine(1.2, 120, 2600), H['smack'] + .05, .35)
put(fx, impact(1, 1.2), H['eyesOn'], .55); put(fx, servo(.6, 400, 800), H['eyesOn'] + .1, .2)
put(fx, impact(.8, 1.4), H['door'], .5); put(fx, creak(1.0), H['door'] + .1, .25)
# footsteps from the walk cycles (one footfall every half cycle)
def steps(t0, t1, rate, g=.5, first=0.0):
    t = t0 + first
    while t < t1: put(fx, thud(), t, g, rng.random() * .4 - .2); put(fx, servo(.25, 300, 420), t - .12, g * .25); t += .5 / rate
for s in shots('stepOut'): steps(H['door'] + .4, s['t1'], .75, .55)
for s in shots('sideTrack'): steps(s['t0'], s['t1'], 2.4 if s['opt'].get('leg') == 2 else 1.8, .5)
for s in shots('charge'): steps(s['t0'], s['t1'], 2.2, .65)
for s in shots('escort'): steps(s['t0'], s['t1'], 2.0, .45)
for s in shots('overhead'): steps(s['t0'], s['t1'], 1.8, .15)
# street life on the drive: tyre hiss, horns
for s in shots('sideTrack') + shots('charge') + shots('escort'):
    for i in range(int((s['t1'] - s['t0']) / .9)): put(fx, whoosh(.7, 500, 6000), s['t0'] + i * .9 + rng.random() * .3, .18, rng.random() * 1.6 - .8)
put(fx, horn(.6), H['swerve'], .25, -.4); put(fx, horn(.4), H['swerve'] + .3, .2, .5)
# billboard
s = shots('billboard')[0]; put(fx, creak(s['t1'] - s['t0']), s['t0'], .35); put(fx, sparks(1.2), H['tear'], .5, .3)
put(fx, impact(.5, .6), H['tear'], .3)
put(fx, whoosh(.5, 200, 2000), H['lunge'], .4)
put(fx, impact(1.2, 2.0), H['impact'], .9); put(fx, sparks(2.0), H['catch'], .45); put(fx, servo(1.0, 180, 240), H['catch'] + .1, .3)
put(fx, impact(.6, 1.0), H['setDown'], .45); put(fx, click(.6, 1800), H['thumbs'], .15)
# drone
put(fx, siren(2.0), H['siren'], .3, .4); put(fx, rotor(at('DRONE', 6.25) - H['siren'] + 3.0), H['siren'], .18, .3)
for i in range(6): put(fx, beep(2200, .06), H['lock'] + i * .18, .25, .2)
put(fx, static(H['smack2'] - H['static']), H['static'], .25, .1); put(fx, smackS(), H['smack2'], .9)
put(fx, whoosh(.4, 600, 3000), H['showBox'] - .2, .2)
for i in range(4): put(fx, beep(1400, .05), H['scan2'] + i * .15, .2, .2)
put(fx, chime(), H['ident'], .4, .2); put(fx, chime(.8), H['green'], .3, .3)
# climb
for s in shots('climb') + shots('towerLow'):
    t = s['t0'] + .3
    while t < s['t1']: put(fx, thud(90, .3, .7), t, .35, rng.random() - .5); put(fx, servo(.3, 260, 380), t - .15, .15); t += .5 / 1.4
put(fx, whoosh(1.4, 100, 1200), H['gust'] - .3, .6); put(fx, scrape(.9), H['slip'], .5); put(fx, sparks(.8), H['slip'], .4); put(fx, impact(.7, .8), H['slip'], .4)
put(fx, click(.6, 2000), H['level'], .25); put(fx, servo(.8, 300, 520), H['arrive'] - .4, .25)
# window
s = shots('desk')[0]
for i in range(int((s['t1'] - s['t0']) / .09)): put(fx, click(.5 + rng.random() * .4, 3000 + rng.random() * 1500), s['t0'] + i * .09 + rng.random() * .03, .12, -.2)
put(fx, knock(), H['tap1'], .8, .4); put(fx, knock(), H['tap2'], .8, .4)
put(fx, whoosh(.3, 400, 2000), H['turn'], .2)
put(fx, servo(1.0, 140, 180), H['hand'], .12)
put(fx, click(1, 1200), H['laugh'] + .4, .4); put(fx, whoosh(1.2, 200, 3000), H['laugh'] + .5, .35)   # the window latch, the wind rushing in
# dawn
for i in range(4): put(fx, click(.5, 2600), H['bite'] - .6 + i * .3, .15, .1)
put(fx, shutter(), H['shutter'], .55); put(fx, whoosh(.35, 1500, 6000), H['sent'], .3); put(fx, beep(1600, .07), H['sent'] + .35, .25)
put(fx, impact(.4, 1.0), H['end'], .2)

# ---------------- mix ----------------
# duck the score a little under the loudest Foley moments
env = np.abs(fx).max(1); from scipy.ndimage import maximum_filter1d, uniform_filter1d
env = uniform_filter1d(maximum_filter1d(env, int(.08 * SR)), int(.05 * SR)); duck = 1 - .45 * np.clip(env / (env.max() + 1e-9) * 2.2, 0, 1)
mix = score * duck[:, None] * 1.0 + fx * .55 + bed * .35
for a, b2 in [(H['silence'], H['chord'])]:                          # the climax silence: rain on the glass only
    m = region(a, b2, .05); mix *= (1 - m * .85)[:, None]; mix += bed * (m * .35)[:, None]
mk = np.abs(mix).max(1); gm = compress(mk, thr=.25, ratio=2.5, att=.002, rel=.15) / np.maximum(mk, 1e-9)
mix = mix * gm[:, None] * 2.0
for c in (0, 1): mix[:, c] = limit(mix[:, c], .66, look=.004)
sf.write(os.path.join(D, 'out/mix.wav'), mix.astype(np.float32), SR, subtype='PCM_24')
for nm, x in (('score', score), ('foley', fx * .55), ('beds', bed * .35), ('mix', mix)):
    print(f'{nm:6s} rms {20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-12):6.1f} dBFS  peak {np.abs(x).max():.3f}')
