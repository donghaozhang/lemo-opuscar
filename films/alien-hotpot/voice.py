"""Synthesised gibberish voices (no TTS, no real language) → voices/<id>.wav, voices/dur.json, voices/lips.json
ZUG: low (~95 Hz), slow, flat contour, saturated with a 180 Hz bump.  PIP: high (~265 Hz), fast, rising contours, presence boost.
LIU: closed-mouth hum ("嗯"), a few notes.  TR: translator beeps.
Formant synthesis: a band-limited glottal pulse through three formant band-passes per vowel; consonants are noise bursts / clicks / nasal hums.
Usage: python voice.py   (reads timeline lines via events.json if present, else the built-in list below)"""
import json, os, re, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, lfilter
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'voices'); os.makedirs(OUT, exist_ok=True)
SR = 48000
src = open(os.path.join(HERE, 'timeline.js')).read()
LINES = [dict(id=m[0], who=m[1], syl=int(m[2])) for m in re.findall(r"\{ id: '(\w+)', who: '(\w+)', t: [\d.]+, syl: (\d+)", src)]
def bp(x, a, b, o=2): return sosfilt(butter(o, [a, min(b, SR * .45)], 'band', fs=SR, output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, min(f, SR * .45), 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
VOW = {'a': (730, 1090, 2440), 'e': (530, 1840, 2480), 'i': (300, 2200, 2950), 'o': (570, 840, 2410), 'u': (330, 870, 2240), 'ə': (500, 1500, 2500)}
CONS = ['b', 'g', 'z', 'k', 'm', 'n', 'sh', 'l', 'p', 'r', '']

def glottal(f0):   # band-limited pulse train from an f0 curve
    ph = np.cumsum(f0) / SR; x = np.zeros(len(f0))
    for h in range(1, 40):
        m = (h * f0 < 5000).astype(float)
        x += m * np.sin(2 * np.pi * h * ph) / h ** 1.1
    return x
def formant(x, fs, gains=(1, .55, .25), bw=(90, 120, 160)):
    y = np.zeros_like(x)
    for f, g_, b in zip(fs, gains, bw): y += bp(x, max(60, f - b), f + b) * g_
    return y

def speak(who, syl, seed):
    rng = np.random.default_rng(seed)
    if who == 'ZUG': f0b, sd, gap, fscale, rise = 92, .27, .05, .92, 0.0
    else: f0b, sd, gap, fscale, rise = 262, .115, .02, 1.38, 1.0
    parts = []
    for k in range(syl):
        d = sd * (1 + rng.uniform(-.2, .3)); n = int(d * SR); tt = np.arange(n) / SR
        v = VOW[rng.choice(list(VOW))]; c = rng.choice(CONS)
        if who == 'ZUG': f0 = f0b * (1 - .04 * tt / d) * (1 - .05 * (k == syl - 1) * tt / d) + rng.uniform(-2, 2)
        else: f0 = f0b * (1 + rise * .18 * np.sin(np.pi * tt / d) + .12 * (k == syl - 1) * tt / d) * rng.uniform(.92, 1.12)
        src_ = glottal(np.full(n, 1.0) * f0)
        vo = formant(src_, [f * fscale for f in v])
        env = np.minimum(1, tt / .02) * np.minimum(1, (d - tt) / .04)
        seg = vo * env
        cn = int(.04 * SR)
        if c in ('sh', 'z'): cons = hp(rng.standard_normal(cn), 3500) * np.linspace(.6, 0, cn) * (.5 if c == 'sh' else .3)
        elif c in ('k', 'p', 'g', 'b'): cons = bp(rng.standard_normal(cn), 800, 4000) * np.exp(-np.arange(cn) / SR / .006) * .7
        elif c in ('m', 'n'): cons = lp(glottal(np.full(cn, float(np.mean(f0)))), 400) * np.sin(np.linspace(0, np.pi, cn)) * .8
        else: cons = np.zeros(cn // 3)
        parts += [cons, seg, np.zeros(int(gap * SR * rng.uniform(.5, 1.5)))]
    x = np.concatenate(parts)
    if who == 'ZUG':
        x = np.tanh(x / np.abs(x).max() * 2.2) * .8; x = x + bp(x, 150, 220) * .8; x = lp(x, 4200)
    else:
        x = x / np.abs(x).max(); x = x + bp(x, 2200, 5000) * .5; x = hp(x, 140)
    return x

def hum(notes, seed):   # Liu: closed mouth "mm", a few notes (each ~0.32 s)
    out = []
    for i, m in enumerate(notes):
        d = .34 if i < len(notes) - 1 else .5; n = int(d * SR); tt = np.arange(n) / SR
        f0 = 440 * 2 ** ((m - 69) / 12) * (1 + .01 * np.sin(2 * np.pi * 5 * tt))
        x = lp(glottal(f0), 600) + bp(glottal(f0), 220, 320) * .6
        x *= np.minimum(1, tt / .03) * np.minimum(1, (d - tt) / .06)
        out += [x, np.zeros(int(.03 * SR))]
    return np.concatenate(out)

def beeps(n, seed):
    rng = np.random.default_rng(seed); out = []
    for i in range(n):
        d = rng.choice([.07, .09, .13]); f = rng.choice([880, 1175, 1320, 1568, 1760, 2093]); tt = np.arange(int(d * SR)) / SR
        x = np.sign(np.sin(2 * np.pi * f * tt)) * .5; x = np.round(x * 6) / 6
        x *= np.minimum(1, tt / .004) * np.minimum(1, (d - tt) / .006)
        out += [lp(x, 6000), np.zeros(int(.035 * SR))]
    return np.concatenate(out)

def compress(x, thr=.3, ratio=3):
    env = lfilter([1 - np.exp(-1 / (.01 * SR))], [1, -np.exp(-1 / (.01 * SR))], np.abs(x))
    gain = np.where(env > thr, (thr + (env - thr) / ratio) / np.maximum(env, 1e-9), 1); return x * gain

dur, lips = {}, {}
for i, L in enumerate(LINES):
    who = L['who']
    if who == 'LIU': x = hum([57, 55] if L['syl'] == 1 else [60, 60, 64, 57], i)
    elif who == 'TR': x = beeps(L['syl'] * 2, i)
    else: x = speak(who, L['syl'], 100 + i)
    x = compress(x / (np.abs(x).max() + 1e-9)); x = x / (np.sqrt(np.mean(x ** 2)) + 1e-9) * .12; x = np.clip(x, -.98, .98)
    sf.write(os.path.join(OUT, L['id'] + '.wav'), x.astype(np.float32), SR)
    dur[L['id']] = round(len(x) / SR, 3)
    hop = SR // 24; fr = len(x) // hop + 1; o, b = [], []
    for k in range(fr):
        w = x[k * hop:(k + 1) * hop]
        if len(w) < 16: o.append(0); b.append(.5); continue
        r = np.sqrt(np.mean(w ** 2)); o.append(r)
        S = np.abs(np.fft.rfft(w)); fq = np.fft.rfftfreq(len(w), 1 / SR); b.append(float((S * fq).sum() / (S.sum() + 1e-9)))
    o = np.array(o); o = np.clip(o / (o.max() + 1e-9) * 1.1, 0, 1); o[o < .12] = 0
    b = np.clip((np.array(b) - 400) / 2600, 0, 1)
    lips[L['id']] = {'o': [round(float(v), 3) for v in o], 'b': [round(float(v), 3) for v in b]}
json.dump(dur, open(os.path.join(OUT, 'dur.json'), 'w'), indent=1)
json.dump(lips, open(os.path.join(OUT, 'lips.json'), 'w'))
print('voices:', {k: v for k, v in dur.items()})
