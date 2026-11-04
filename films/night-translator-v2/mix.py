"""《深夜翻译官》 v2 — the mix: the pit band + the effects drummer's trap box + the projector in the booth → out/mix.wav
Every visible action has a sound, played the way a 1920s picture house did it: the trap box (wood block, triangle, bells,
cymbals, bass drum, snare, shaker — sampled, VCSL CC0) and the hand effects a trap drummer worked (slide whistle,
ratchet, slapstick, sand block, siphon hiss, jaw-harp boing, clock tick — synthesised here). No recorded room sound: the
only ambience is the projector, which comes forward in the two silences. All times come from timeline.json.
Master: about −14 LUFS before mux.sh, true peak kept under −1 dBTP by a look-ahead limiter at −2.5 dBFS (inter-sample
overs measured on the final file)."""
import sys, os, json
import numpy as np, soundfile as sf
D = os.path.dirname(os.path.abspath(__file__))
ROOT = os.environ.get('LIB') or os.path.abspath(os.path.join(D, '../..'))
sys.path.insert(0, ROOT)
from core.audio.sfx import SR, bp, lp, hp, t_, env_exp, norm, add, limit, compress, pop as sfx_pop, click as sfx_click
from core.audio import sampler as S
rng = np.random.default_rng(1927)
TL = json.load(open(os.path.join(D, 'timeline.json'))); SEC, HIT, DUR, SHOTS, LAMPS = TL['SEC'], TL['HIT'], TL['DUR'], TL['SHOTS'], TL['LAMPS']
def at(s, b=0.0): return SEC[s]['t0'] + b * SEC[s]['beat']
def shot(name, **kw): return [s for s in SHOTS if s['name'] == name and all(s['opt'].get(k) == v for k, v in kw.items())]
N = int(round(DUR * SR))
os.makedirs(os.path.join(D, 'out'), exist_ok=True)
score, sr = sf.read(os.path.join(D, 'music/score.wav')); assert sr == SR
score = np.pad(score, ((0, max(0, N - len(score))), (0, 0)))[:N]

# ---------------- synthesised hand effects ----------------
def nz(d): return rng.standard_normal(int(round(d * SR)))
def whistle(f0, f1, d, v=1.0):
    tt = t_(d); u = tt / d; f = f0 * (f1 / f0) ** u * (1 + .012 * np.sin(2 * np.pi * 6 * tt))
    ph = 2 * np.pi * np.cumsum(f) / SR
    return norm((np.sin(ph) + .18 * np.sin(2 * ph) + bp(nz(d), 1500, 5000) * .05) * np.minimum(1, tt / .03) * np.minimum(1, (d - tt) / .05)) * v
def ratchet(d, rate=26, v=1.0, lo=1800):
    out = np.zeros(int(d * SR)); t = 0
    while t < d - .02:
        c = bp(nz(.02), lo, lo * 3) * env_exp(.02, .003); s = int(t * SR); e = min(len(out), s + len(c)); out[s:e] += c[:e - s]
        t += 1 / rate * (1 + (rng.random() - .5) * .15)
    return norm(out) * v
def slapstick(v=1.0):
    x = np.zeros(int(.12 * SR))
    for k, off in enumerate((0, .014)):
        c = hp(nz(.05), 900) * env_exp(.05, .006) + np.sin(2 * np.pi * 420 * t_(.05)) * env_exp(.05, .01) * .5
        s = int(off * SR); x[s:s + len(c)] += c * (1 if k else .7)
    return norm(x) * v
def sandblock(d, v=1.0, rate=11):
    tt = t_(d); am = .5 + .5 * np.abs(np.sin(np.pi * rate * tt))
    return norm(bp(nz(d), 1400, 5000) * am * np.minimum(1, tt / .02) * np.minimum(1, (d - tt) / .04)) * v
def swish(d=.18, v=1.0, lo=1500, hi=6500):
    tt = t_(d); return norm(bp(nz(d), lo, hi) * np.sin(np.pi * tt / d) ** 2) * v
def boing(f0=110, d=.7, v=1.0):
    tt = t_(d); f = f0 * (1 + .25 * np.exp(-tt / .08)) * (1 + .02 * np.sin(2 * np.pi * 7 * tt)); ph = 2 * np.pi * np.cumsum(f) / SR
    return norm(sum(np.sin(ph * k) / k ** .6 for k in range(1, 9)) * env_exp(d, .22) * np.minimum(1, tt / .005)) * v
def hiss(d=1.8, v=1.0):
    tt = t_(d); env = np.minimum(1, tt / .015) * np.exp(-tt / (d * .45)); return norm(hp(nz(d), 2500) * env + bp(nz(d), 600, 2000) * env * .35) * v
def sizzle(d=.25): tt = t_(d); return norm(hp(nz(d), 3000) * np.exp(-tt / .08))
def splash(v=1.0): d = .6; return norm(lp(nz(d), 2200) * env_exp(d, .12) + bp(nz(d), 2000, 7000) * env_exp(d, .05) * .6) * v
def plink(f=3000, v=1.0):
    d = .12; tt = t_(d); fr = f * (1 + .4 * np.exp(-tt / .01)); return norm(np.sin(2 * np.pi * np.cumsum(fr) / SR) * env_exp(d, .025)) * v
def crackle(d, v=1.0, dens=16):
    out = np.zeros(int(d * SR))
    for _ in range(int(d * dens)):
        s = int(rng.random() * (len(out) - 600)); c = hp(nz(.008), 1500) * env_exp(.008, .0012) * (.3 + rng.random()); out[s:s + len(c)] += c
    return out * v
def squeak(v=1.0, up=True, d=.07):
    tt = t_(d); f = (2300 + 900 * tt / d) if up else (3000 - 900 * tt / d); return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d)) * v
def rumble(d):
    tt = t_(d); return norm(lp(nz(d), 300) * (.6 + .4 * np.sin(tt * 18)) * np.minimum(1, tt / .2) * np.minimum(1, (d - tt) / .2))
def tick(f=2600): d = .03; return norm(bp(nz(d), f, f * 1.6) * env_exp(d, .004))

trap = np.zeros((N, 2)); SAMP = []
def samp(t, inst, var, v, pan=0.):
    if 0 <= t < DUR: SAMP.append((t, inst, var, .6, v, pan))
def fx(t, x, g=1.0, pan=0.):
    if 0 <= t < DUR: add(trap, x, t, g, pan)
def keys(t0, n, step=.11, v=.3):
    for i in range(n): samp(t0 + i * step + rng.random() * .01, 'woodblock', 'a', v, .25)
H = HIT
# ---- COLD
fx(at('COLD', .3), rumble(H['bump'] - at('COLD', .3)), .25, .3)
samp(H['bump'], 'woodblock', 'c', .55, -.2); fx(H['bump'], slapstick(.5), .2, -.2)
for d in (0, .22, .4): samp(H['bulb'] + d, 'triangle', 'muted', .35, .2)
fx(H['eyes'], squeak(.5, True, .12), .1, 0)
fx(H['take'], slapstick(), .5, 0); fx(H['take'] + .05, whistle(700, 2200, .3), .2, .1)
# ---- TITLE
fx(H['grab'], ratchet(.15, 34), .3); fx(H['snap'], whistle(800, 2600, .24), .26, .1); samp(H['snap'] + .26, 'woodblock', 'b', .5, .1)
samp(H['nod'], 'woodblock', 'a', .5, .1); fx(H['drop'], whistle(1500, 400, .4), .14, .1)
# ---- ESTAB
for k in range(6): fx(at('ESTAB', .05) + k * .07, tick(1800), .15, 0)                      # the lamp flickers on
t = H['roll']
while t < H['park'] - .2: fx(t, squeak(.5), .12, -.3); t += .45
fx(H['park'], squeak(.6, False, .15), .14, -.2)
fx(H['unfold'] - .2, ratchet(.35, 22), .25, .2); fx(H['flourish'], swish(.8, 1, 1200, 5000), .12, .2); samp(H['point'], 'woodblock', 'b', .5, .2)
fx(H['gulp'], whistle(500, 260, .35), .12, 0); samp(H['nodGo'], 'woodblock', 'a', .45, 0)
# ---- the three reels
def reel_fx(r, view, page, pfix=None):
    for s in shot('page', reel=r) + shot('pageHand', reel=r): keys(s['t0'] + .1, 6, .21, .35); samp(s['t0'] + 1.45, 'triangle', 'muted', .4, .3)
for r in ('WEST', 'ROMA', 'MONS'): reel_fx(r, 0, 0)
samp(H['wGrab'], 'woodblock', 'c', .5, -.25); fx(H['wGrab'] - .02, swish(.08, 1, 3000, 8000), .08, -.2); fx(H['wThread'], ratchet(.22, 30), .3, -.1)
v = shot('viewer', reel='WEST')[0]; t = v['t0']
while t < v['t1']: samp(t, 'woodblock', 'a' if int(t * 8) % 2 else 'b', .3, .2); t += .125           # clip-clop in the viewer
fx(H['wZoom'], ratchet(.3, 30, lo=2500), .15, .2); samp(H['wRecoil'], 'snare2', 'stick', .5, .3)
fx(H['wStrike'], sandblock(.35, rate=9), .2, .3); fx(H['wFix'], sandblock(.9, rate=14), .16, .3)
fx(H['wCrumple'], crackle(.3, 1, 120), .5, .3); fx(H['wThrow'], whistle(900, 2400, .32), .16, .2)
fx(H['wBonk'], slapstick(), .55, -.15); samp(H['wBonk'], 'woodblock', 'c', .7, -.15); fx(H['wBonk'] + .03, boing(95, .8), .3, -.1)
fx(H['rCrouch'], squeak(.5, False), .12); fx(H['rFlip'], whistle(600, 2000, .3), .2, 0); samp(H['rFlip'] + .55, 'woodblock', 'b', .5, 0)
fx(H['rPop'], boing(170, .45), .18, .2); fx(H['rPop'], ratchet(.2, 40, lo=2500), .12, .3)
fx(H['rTopple'], whistle(1800, 500, .4), .15, 0); samp(H['rTopple'] + .5, 'gran_cassa', 'hit', .4, 0)
fx(H['rStrike'], sandblock(.35, rate=9), .2, .3); fx(H['rFix'], sandblock(.9, rate=14), .16, .3)
fx(H['rThrow'], whistle(900, 2400, .32), .16, .2); fx(H['rDuck'], swish(.15, 1, 800, 3000), .15, 0)
samp(H['rPile'], 'woodblock', 'b', .55, -.4); samp(H['rPile'], 'gran_cassa', 'hit', .35, -.4)
for i in range(6): samp(H['rPile'] + .12 + i * .11, 'woodblock', 'abc'[i % 3], .45 - i * .05, -.4)
samp(H['mFlash'], 'clash', 'crash', .5, 0); samp(H['mFlash'] + .05, 'gran_cassa', 'roll', .4, 0)
fx(H['mPen'], swish(.3, 1, 800, 4000), .12, .3); fx(H['mStrike'], sandblock(.35, rate=9), .2, .3); fx(H['mFix'], sandblock(.9, rate=14), .16, .3)
fx(H['mThrow'], whistle(900, 2400, .32), .16, .2); fx(H['mCatch'], sfx_pop(), .3, .2); samp(H['mCatch'], 'woodblock', 'a', .5, .2)
fx(H['mPop'], boing(170, .45), .18, .2); fx(H['mUnfold'], swish(.3, 1, 1500, 6500), .14, .2); samp(H['mNod'], 'woodblock', 'a', .45, 0); fx(H['mBow'], ratchet(.4, 14, lo=900), .18, .3)
for s in (shot('deskThrow') + shot('deskDuck') + shot('deskCatch')): pass
# ---- MONT: a sound for every cut
for s in [x for x in SHOTS if x['sec'] == 'MONT']:
    t0, t1 = s['t0'], s['t1']
    if s['name'] == 'mClock':
        t = t0
        while t < t1: samp(t, 'woodblock', 'a' if int((t - t0) / .2) % 2 else 'b', .4, 0); t += .2
    elif s['name'] == 'mKeys': keys(t0, int((t1 - t0) / .06), .06, .3)
    elif s['name'] == 'mTube': t = t0; [fx(t0 + k * .25, sfx_pop(), .2, .1) for k in range(4)]; fx(t0, whistle(700, 1900, .5), .12, .1)
    elif s['name'] == 'mStamp': [samp(t0 + k * SEC['MONT']['beat'] * 2 * .5 + .05, 'gran_cassa', 'hit', .35, 0) for k in range(3)]
    elif s['name'] == 'mWide': fx(t0, ratchet(t1 - t0, 30), .15, 0)
    elif s['name'] == 'mReel': fx(t0, ratchet(t1 - t0, 40, lo=1200), .2, 0)
    elif s['name'] == 'mBasket': [fx(t0 + k * .3, swish(.2), .14, .2) for k in range(4)]
# ---- JAM
fx(H['jThread'], ratchet(.22, 30), .3, -.1); fx(H['jam'], ratchet(.6, 14, lo=600), .45, 0)
samp(H['jBump'], 'gran_cassa', 'hit', .5, 0); samp(H['jBump'] + .02, 'triangle', 'open', .3, .3)
t = H['jBump'] + .3
while t < H['silence1']: fx(t, squeak(.5, int(t * 3) % 2 == 0, .25), .07, .4); t += .98            # the swinging lamp creaks
fx(H['jBump'], crackle(H['shout'] + 1 - H['jBump'], 1, 12), .32, .1)
samp(H['spark'], 'clash', 'short', .4, .2); fx(H['spark'], sizzle(.3), .3, .2)
samp(H['shout'], 'clash', 'short', .55, 0)
# ---- FIRE
for k in range(5): fx(H['hot'] + k * .42, sizzle(.2), .25, .3 - .3 * (k % 2) * 2); samp(H['hot'] + k * .42, 'woodblock', 'a', .3, 0)
fx(at('FIRE', 2.5), swish(.6, 1, 600, 2500), .14, .4)
fx(H['race'], ratchet(at('FIRE', 14) - H['race'], 34, lo=1400), .14, 0); fx(at('FIRE', 19), ratchet(at('FIRE', 24) - at('FIRE', 19), 38, lo=1400), .16, 0)
fx(H['race'], crackle(H['catch'] - H['race'], 1, 18), .3, .1)
fx(H['ladder'] - .1, whistle(2400, 1400, .3), .14, -.3); fx(H['ladder'], swish(.25, 1, 800, 3000), .2, 0)
fx(at('FIRE', 14), ratchet(at('FIRE', 19) - at('FIRE', 14), 30, lo=900), .16, 0); samp(H['ljGrab'], 'triangle', 'open', .4, .2); samp(H['ljGrab'], 'woodblock', 'c', .5, .2)
fx(H['trip'], slapstick(), .6, -.2); fx(H['trip'] + .02, whistle(1600, 500, .2), .15, -.2); fx(H['trip'] + .5, sandblock(.4, rate=6), .25, 0)
fx(H['catch'], hiss(2.4), .75, .15); fx(H['catch'], splash(), .5, .15); samp(H['catch'], 'gran_cassa', 'hit', .3, .1)
fx(H['popUp'] + .25, boing(150, .5), .2, -.2)
# ---- TENDER
s0 = shot('dryWide')[0]; t = s0['t0'] + 1
while t < shot('patTwo')[0]['t0']: fx(t, plink(2400 + rng.random() * 1400), .1, -.2 + rng.random() * .4); t += .3 + rng.random() * .3
fx(H['hang'], swish(.6, 1, 600, 2500), .12, .2); samp(H['handover'], 'triangle', 'muted', .4, 0)
p = shot('patTwo')[0]; fx(p['t0'] + .1, sandblock(H['raise'] - .5 - p['t0'] - .1, rate=14), .1, .1)
fx(H['raise'], squeak(.6, False), .15, -.2); samp(H['pat'], 'woodblock', 'a', .28, -.1); samp(H['pat2'], 'woodblock', 'a', .28, -.1)
# ---- DAWN
samp(H['seal'], 'gran_cassa', 'hit', .45, .1); samp(H['seal'], 'woodblock', 'b', .55, .1)
fx(H['hoist'], whistle(500, 1300, .9), .12, .1)
samp(H['slot'], 'gran_cassa', 'hit', .5, .2); samp(H['slot'], 'woodblock', 'b', .55, .2)
for i, tl in enumerate(LAMPS): fx(tl, sfx_click(1.0 + i * .05), .18, -.4 + i * .1)
# ---- END
fx(H['curtainOut'], swish(1.6, 1, 300, 2500), .12, 0)
tr_s = S.render(SAMP, DUR, master=False)[:N]
trap += np.pad(tr_s, ((0, max(0, N - len(tr_s))), (0, 0)))

# ---------------- the projector in the booth ----------------
def claw(v=1.0):
    d = .05; tt = t_(d); return (bp(nz(d), 1200, 5200) * np.exp(-tt / .004) * .9 + np.sin(2 * np.pi * 190 * tt) * np.exp(-tt / .012) * .5) * v
end0 = H['lampOff']
def fps(t):
    if t < .02: return 0
    if t < .9: return 18 * min(1, t / .8) ** .7
    if t < end0: return 18 * (1.12 if SEC['MONT']['t0'] <= t < H['heal'] else 1)
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
for k in (0, int(end0 * SR)): proj[k:k + int(.03 * SR)] += bp(nz(.03), 900, 6000) * np.exp(-t_(.03) / .004) * 2
S1, S2 = H['silence1'], H['launch']
lev_pts = [(0, 1.0), (.9, 1.0), (1.6, .45), (S1 - .1, .45), (S1 + .15, 1.2), (H['shout'] - .05, 1.2), (H['shout'] + .4, .45),
           (S2 - .05, .45), (S2 + .15, 1.25), (H['catch'], 1.25), (H['catch'] + .6, .4), (H['curtainOut'], .4), (H['curtainOut'] + 1, 1.0), (DUR + 1, 1.0)]
proj = proj * np.interp(tt, [p[0] for p in lev_pts], [p[1] for p in lev_pts]) * .1
pr = np.stack([proj * .9, proj], 1)

# ---------------- mix ----------------
for a, b in [(S1, H['shout']), (S2, H['catch'])]:                      # the two silences: nothing rings across them
    g = np.ones(N); i0, i1 = int(a * SR), int(b * SR); ramp = int(.12 * SR); g[i0:i1] = 0; g[i0:i0 + ramp] = np.linspace(1, 0, ramp)
    score *= g[:, None]; trap[i0 + ramp:i1] *= 0
sc = score * .9; lk = np.abs(sc).max(1); gk = compress(lk, thr=.2, ratio=3, att=.002, rel=.12) / np.maximum(lk, 1e-9)
mix = sc * gk[:, None] * 1.45 + trap * .9 + pr
mk = np.abs(mix).max(1); gm = compress(mk, thr=.16, ratio=3, att=.001, rel=.15) / np.maximum(mk, 1e-9)
mix = mix * gm[:, None] * 2.3
for c in (0, 1): mix[:, c] = limit(mix[:, c], .66, look=.004)
sf.write(os.path.join(D, 'out/mix.wav'), mix.astype(np.float32), SR, subtype='PCM_24')
for nm, x in (('score', sc * gk[:, None] * 1.45), ('trap', trap * .9), ('projector', pr)):
    print(f'{nm:10s} rms {20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-12):6.1f} dBFS')
print('out/mix.wav', round(len(mix) / SR, 2), 's  peak', round(float(np.abs(mix).max()), 3), ' rms', round(20 * np.log10(np.sqrt((mix ** 2).mean())), 1))
