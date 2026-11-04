"""《深夜翻译官》 — the mix: the photoplay piano + the pit drummer's trap box + the projector in the booth → out/mix.wav
Every visible action has a sound, played the way a 1920s picture house did it: the effects drummer's trap box (wood block,
triangle, hand bells, cymbal, bass drum — sampled, VCSL CC0) and the "effects" a trap drummer worked by hand (slide
whistle, ratchet, slapstick, sand block, siphon hiss, jaw-harp boing — synthesised here). No recorded room sound: the
only ambience is the projector, which comes forward in the two silences. Times come from events.json (the picture's EV).
Run: .venv/bin/python films/night-translator/mix.py"""
import sys, os, json
import numpy as np, soundfile as sf
D = os.path.dirname(os.path.abspath(__file__))
ROOT = os.environ.get('LIB') or os.path.abspath(os.path.join(D, '../..'))
sys.path.insert(0, ROOT)
from core.audio.sfx import SR, bp, lp, hp, t_, env_exp, norm, add, limit, compress, pop as sfx_pop, click as sfx_click
from core.audio import sampler as S
rng = np.random.default_rng(1926)
TL = json.load(open(os.path.join(D, 'timeline.json'))); SEC, HIT, DUR = TL['SEC'], TL['HIT'], TL['DUR']
EV = json.load(open(os.path.join(D, 'events.json')))['ev']
N = int(round(DUR * SR))
os.makedirs(os.path.join(D, 'out'), exist_ok=True)
score, sr = sf.read(os.path.join(D, 'music/score.wav')); assert sr == SR
score = np.pad(score, ((0, max(0, N - len(score))), (0, 0)))[:N]

# ---------------- the trap box: synthesised hand effects ----------------
def nz(d): return rng.standard_normal(int(round(d * SR)))
def whistle(f0, f1, d, v=1.0):                                   # slide whistle: a breathy sine glide with vibrato
    tt = t_(d); u = tt / d; f = f0 * (f1 / f0) ** u * (1 + .012 * np.sin(2 * np.pi * 6 * tt))
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) + .18 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    breath = bp(nz(d), 1500, 5000) * .05
    env = np.minimum(1, tt / .03) * np.minimum(1, (d - tt) / .05)
    return norm((tone + breath) * env) * v
def ratchet(d, rate=26, v=1.0, lo=1800):                         # a wooden ratchet: rapid clicks
    out = np.zeros(int(d * SR)); t = 0
    while t < d - .02:
        c = bp(nz(.02), lo, lo * 3) * env_exp(.02, .003); s = int(t * SR); e = min(len(out), s + len(c)); out[s:e] += c[:e - s]
        t += 1 / rate * (1 + (rng.random() - .5) * .15)
    return norm(out) * v
def slapstick(v=1.0):                                            # two boards clapped: two sharp cracks
    d = .12; x = np.zeros(int(d * SR))
    for k, off in enumerate((0, .014)):
        c = hp(nz(.05), 900) * env_exp(.05, .006) + np.sin(2 * np.pi * 420 * t_(.05)) * env_exp(.05, .01) * .5
        s = int(off * SR); x[s:s + len(c)] += c * (1 if k else .7)
    return norm(x) * v
def sandblock(d, v=1.0, rate=11):                                 # sandpaper blocks: a rhythmic scratch
    tt = t_(d); am = .5 + .5 * np.abs(np.sin(np.pi * rate * tt))
    return norm(bp(nz(d), 1400, 5000) * am * np.minimum(1, tt / .02) * np.minimum(1, (d - tt) / .04)) * v
def swish(d=.18, v=1.0, lo=1500, hi=6500):
    tt = t_(d); env = np.sin(np.pi * tt / d) ** 2
    return norm(bp(nz(d), lo, hi) * env) * v
def boing(f0=110, d=.7, v=1.0):                                  # jaw harp: a buzzy tone with a falling formant
    tt = t_(d); f = f0 * (1 + .25 * np.exp(-tt / .08)) * (1 + .02 * np.sin(2 * np.pi * 7 * tt))
    ph = 2 * np.pi * np.cumsum(f) / SR; x = sum(np.sin(ph * k) / k ** .6 for k in range(1, 9))
    return norm(x * env_exp(d, .22) * np.minimum(1, tt / .005)) * v
def hiss(d=1.8, v=1.0):                                           # a siphon / steam hiss: the can hits the water
    tt = t_(d); env = np.minimum(1, tt / .015) * np.exp(-tt / (d * .45))
    return norm(hp(nz(d), 2500) * env + bp(nz(d), 600, 2000) * env * .35) * v
def splash(v=1.0):
    d = .6; tt = t_(d)
    return norm(lp(nz(d), 2200) * env_exp(d, .12) + bp(nz(d), 2000, 7000) * env_exp(d, .05) * .6) * v
def plink(f=3000, v=1.0):
    d = .12; tt = t_(d); fr = f * (1 + .4 * np.exp(-tt / .01))
    return norm(np.sin(2 * np.pi * np.cumsum(fr) / SR) * env_exp(d, .025)) * v
def crackle(d, v=1.0, dens=16):
    out = np.zeros(int(d * SR)); k = int(d * dens)
    for _ in range(k):
        s = int(rng.random() * (len(out) - 600)); c = hp(nz(.008), 1500) * env_exp(.008, .0012) * (.3 + rng.random()); out[s:s + len(c)] += c
    return out * v
def squeak(v=1.0, up=True):
    d = .07; tt = t_(d); f = (2300 + 900 * tt / d) if up else (3000 - 900 * tt / d)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d)) * v

trap = np.zeros((N, 2))
SAMP = []                                                        # sampled trap hits → one sampler pass
def samp(t, inst, var, v, pan=0.): SAMP.append((t, inst, var, .6, v, pan))

def fx(e):
    t, ty, v = e['t'], e['type'], e.get('v', 1.0); d = e.get('d', .3)
    if ty == 'key': samp(t, 'woodblock', 'a', .32 * v, .25)
    elif ty == 'squeak': add(trap, squeak(.5 * v), t, .22, -.3)
    elif ty == 'glint': samp(t, 'triangle', 'open', .42 * v, .35)
    elif ty == 'bell': samp(t, 'nepal_bells', None, .8, .1)
    elif ty == 'canGrab': samp(t, 'woodblock', 'c', .5 * v, -.25); add(trap, swish(.08, 1, 3000, 8000), t - .02, .08 * v, -.2)
    elif ty == 'thread': add(trap, ratchet(.22, 30), t, .3 * v, -.1)
    elif ty == 'ding': samp(t, 'triangle', 'muted', .55, .3)
    elif ty == 'tube': add(trap, whistle(700, 1900, .26), t, .2 * v, .2)
    elif ty == 'pop': add(trap, sfx_pop(), t, .22 * v, .35)
    elif ty == 'stamp': samp(t, 'gran_cassa', 'hit', .45 * v, .1); samp(t, 'woodblock', 'b', .55 * v, .2)
    elif ty == 'paper': add(trap, swish(.2), t, .14 * v, .3)
    elif ty == 'recoil': samp(t, 'snare2', 'stick', .5, .3)
    elif ty in ('scribble', 'scratch'): add(trap, sandblock(d, rate=14 if ty == 'scribble' else 9), t, .2 * v, .3)
    elif ty == 'crumple': add(trap, crackle(.25, 1, 120), t, .5, .3)
    elif ty == 'throw': add(trap, whistle(900, 2400, .32), t, .16, .2)
    elif ty == 'bonk': add(trap, slapstick(), t, .55, -.15); samp(t, 'woodblock', 'c', .7, -.15); add(trap, boing(95, .8), t + .03, .3, -.1)
    elif ty == 'bonkPile': samp(t, 'woodblock', 'b', .5, -.4); add(trap, boing(130, .45), t, .18, -.4)
    elif ty == 'grind': add(trap, ratchet(.5, 14, lo=600), t, .4, 0)
    elif ty == 'rattle': samp(t, 'shaker', 'roll', .5, 0); add(trap, ratchet(d, 34, lo=1200), t, .22, 0)
    elif ty == 'crackle': add(trap, crackle(d, 1, 14) * np.minimum(1, t_(d)[:int(d * SR)] / 1.5), t, .34 * v, .1)
    elif ty == 'trip': add(trap, slapstick(), t, .6, -.2); add(trap, whistle(1600, 500, .2), t + .02, .15, -.2)
    elif ty == 'skid': add(trap, sandblock(.4, rate=6), t, .25, 0)
    elif ty == 'hiss': add(trap, hiss(2.2), t, .7, .15)
    elif ty == 'splash': add(trap, splash(), t, .5, .15); samp(t, 'gran_cassa', 'hit', .3, .1)
    elif ty == 'boing': add(trap, boing(150, .5), t, .2, -.2)
    elif ty == 'drips':
        tt = t
        while tt < t + d: add(trap, plink(2400 + rng.random() * 1400), tt, .12, -.1 + rng.random() * .2); tt += .3 + rng.random() * .3
    elif ty == 'flinch': add(trap, squeak(.6, up=False), t, .2, -.2)
    elif ty == 'pat': samp(t, 'woodblock', 'a', .3, -.1)
    elif ty == 'lift': add(trap, whistle(500, 1300, .9), t, .14, .1)
    elif ty == 'clunk': samp(t, 'gran_cassa', 'hit', .55, .2); samp(t, 'woodblock', 'b', .6, .2)
    elif ty == 'lamp': add(trap, sfx_click(1.0 + e.get('i', 0) * .05), t, .2, -.4 + e.get('i', 0) * .1)
for e in EV:
    if e['type'] not in ('hit', 'section'): fx(e)
# the title gag and the section-level hits
add(trap, ratchet(.15, 34), HIT['grab'], .3, 0)
add(trap, whistle(800, 2600, .24), HIT['snap'], .26, .1); samp(HIT['snap'] + .26, 'woodblock', 'b', .5, .1)
samp(HIT['nod'], 'woodblock', 'a', .5, .1)
add(trap, whistle(1500, 400, .4), HIT['drop'], .14, .1)
samp(HIT['shout'], 'clash', 'short', .55, 0)                     # cymbal choke on the shout card
add(trap, swish(1.6, 1, 300, 2500), HIT['curtainOut'], .12, 0)  # the curtains
tr_s = S.render(SAMP, DUR, master=False)[:N]
trap += np.pad(tr_s, ((0, max(0, N - len(tr_s))), (0, 0)))

# ---------------- the projector in the booth ----------------
def claw(v=1.0):
    d = .05; tt = t_(d)
    return (bp(nz(d), 1200, 5200) * np.exp(-tt / .004) * .9 + np.sin(2 * np.pi * 190 * tt) * np.exp(-tt / .012) * .5) * v
end0 = HIT['lampOff']
def fps(t):
    if t < .02: return 0
    if t < .9: return 18 * min(1, t / .8) ** .7
    if t < end0: return 18 * (1.12 if SEC['HURRY']['t0'] <= t < HIT['heal'] else 1)        # runs a touch faster in the hurry
    return max(0, 18 * (1 - (t - end0) / .9))
proj = np.zeros(N); t = .02
while t < DUR - .05:
    f = fps(t)
    if f < 1: t += .02; continue
    c = claw(.8 + .2 * rng.random()); s = int(t * SR); e = min(N, s + len(c)); proj[s:e] += c[:e - s]
    t += 1 / f * (1 + (rng.random() - .5) * .04)
tt = np.arange(N) / SR; sp = np.interp(tt, tt[::480], np.array([fps(x) for x in tt[::480]])) / 18
proj += (np.sin(2 * np.pi * 60 * tt) * .5 + np.sin(2 * np.pi * 120 * tt) * .3 + np.sin(2 * np.pi * 180 * tt) * .12) * sp * .1
proj += bp(rng.standard_normal(N), 300, 1800) * .35 * sp
k = 0; proj[k:k + int(.03 * SR)] += bp(nz(.03), 900, 6000) * np.exp(-t_(.03) / .004) * 2       # the lamp strikes
k = int(end0 * SR); proj[k:k + int(.03 * SR)] += bp(nz(.03), 900, 6000) * np.exp(-t_(.03) / .004) * 2      # … and goes off
# level: low under the piano, forward in the two silences and at the start and end
S1, S2 = HIT['silence1'], HIT['launch']
lev_pts = [(0, 1.0), (.9, 1.0), (1.4, .4), (S1 - .1, .4), (S1 + .15, 1.2), (HIT['shout'] - .05, 1.2), (HIT['shout'] + .4, .45),
           (S2 - .05, .45), (S2 + .15, 1.25), (HIT['catch'], 1.25), (HIT['catch'] + .6, .4), (HIT['curtainOut'], .4), (HIT['curtainOut'] + 1, 1.0), (DUR + 1, 1.0)]
lev = np.interp(tt, [p[0] for p in lev_pts], [p[1] for p in lev_pts])
proj = proj * lev * .1
pr = np.stack([proj * .9, proj], 1)

# ---------------- mix ----------------
# the two silences: the piano has nothing there by design; make sure no ringing tails cross them either
for a, b in [(S1, HIT['shout']), (S2, HIT['catch'])]:
    g = np.ones(N); i0, i1 = int(a * SR), int(b * SR); g[i0:i1] = 0; ramp = int(.12 * SR); g[i0:i0 + ramp] = np.linspace(1, 0, ramp)
    score *= g[:, None]; trap[i0 + ramp:i1] *= 0
sc = score * .9; lk = np.abs(sc).max(1); gk = compress(lk, thr=.2, ratio=3, att=.002, rel=.12) / np.maximum(lk, 1e-9)
mix = sc * gk[:, None] * 1.45 + trap * .9 + pr
for c in (0, 1): mix[:, c] = limit(mix[:, c], .95)
sf.write(os.path.join(D, 'out/mix.wav'), mix.astype(np.float32), SR, subtype='PCM_24')
for nm, x in (('score', sc * gk[:, None] * 1.45), ('trap', trap * .9), ('projector', pr)):
    print(f'{nm:10s} rms {20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-12):6.1f} dBFS')
print('out/mix.wav', round(len(mix) / SR, 2), 's  peak', round(float(np.abs(mix).max()), 3))
