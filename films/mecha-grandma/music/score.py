# -*- coding: utf-8 -*-
"""《机甲外婆》 Mecha Grandma — original city-pop / synth-funk / anime-action score
(synthesised from scratch with numpy + numba; DSP kernels and instruments adapted from
styles/cel-anime-80s/demo/music/score.py, all music new).

Run: .venv/bin/python films/mecha-grandma/music/score.py
Output: score.wav (48 kHz stereo float, exactly round(DUR*48000) samples), score.json ({"keys": {HIT name: t}})

Every section is written on its own tempo grid starting at timeline.json SEC[name].t0.
"Grandma's theme" (the hook) is a 4-bar brass/sax melody; it is first hinted by the FM bells in OPEN,
sung by the e-piano in HOME, roared by the synth brass in DRIVE, returns for the drone escort,
whispered slowly at the WINDOW and sung in full by the sax-like lead in DAWN (Ab major -> A major at lift2).

  OPEN   104 bpm  Bb   pad + FM bells, rising fill, brass title hit, bell glint
  HOME    84 bpm  Db   night ballad: FM e-piano maj7/9, soft bass, warm Ab13 at "decide", G7b9 pickup
  GARAGE 100 bpm  Cm   toms + rising arpeggio, unveil stab, stop-time with two engine-cough gaps, power-up stab, groove at door
  DRIVE  132 bpm  Bb   action cue: slap bass, gated snare, 16th guitar chanks, arp, brass lead = Grandma's theme
  BILL   132 bpm  Gm   brass stabs, roll, one beat of true silence, huge hit at impact, held chord through catch
  DRONE  132 bpm  Gm   comic suspense: pizzicato synth, staccato stabs, siren synth, comic stop, "ta-da", escort groove
  CLIMB   92 bpm  Fm   half-time tension, drop at gust/slip, rebuild to arrive
  WINDOW  70 bpm  Ab   sparse e-piano, digital silence silence->chord, one warm chord, slow theme
  DAWN    96 bpm  Ab->A city-pop finale, semitone lift at lift2, shutter accent, bell figure at match
  END     96 bpm  A    brass hit + bell, final AM9 rings to DUR
"""
import os, json, time, numpy as np, soundfile as sf
from numba import njit
from scipy.signal import butter, sosfilt, fftconvolve, lfilter
from scipy.ndimage import minimum_filter1d, uniform_filter1d

HERE = os.path.dirname(os.path.abspath(__file__))
TL = json.load(open(os.path.join(HERE, '..', 'timeline.json')))
SECS, HIT = TL['SEC'], TL['HIT']
ORDER = sorted(SECS, key=lambda k: SECS[k]['t0'])
SR = 48000
DUR = float(TL['DUR'])
N = int(round(DUR * SR))
rng = np.random.default_rng(1979)


def T(sec, bar, beat=0.0):
    s = SECS[sec]; return s['t0'] + bar * s['bar'] + beat * s['beat']


def BT(sec): return SECS[sec]['beat']


# windows of digital silence: (start, end)
WIN = [(HIT['cough1'], HIT['cough1'] + .25),
       (HIT['cough2'], HIT['cough2'] + .25),
       (HIT['impact'] - BT('BILL'), HIT['impact']),
       (HIT['silence'], HIT['chord'])]
KEYS = {}


def key(name, t): KEYS[name] = t


def mtof(m): return 440.0 * 2 ** ((np.asarray(m, dtype=float) - 69) / 12)
def ts(n): return np.arange(n) / SR
def noise(n): return rng.standard_normal(n)


def _sos(kind, f, o): return butter(o, f, kind, fs=SR, output='sos')
def lp(x, f, o=2): return sosfilt(_sos('low', f, o), x, axis=0)
def hp(x, f, o=2): return sosfilt(_sos('high', f, o), x, axis=0)
def bp(x, lo, hi, o=2): return sosfilt(_sos('band', [lo, hi], o), x, axis=0)


# ───────────────────────── DSP kernels (numba) ─────────────────────────
@njit(cache=True)
def svf(x, fc, res, mode):
    """TPT state-variable filter, per-sample cutoff. mode 0=low-pass 1=band-pass 2=high-pass"""
    n = x.shape[0]; y = np.empty(n); ic1 = 0.0; ic2 = 0.0; k = 1.0 / res
    for i in range(n):
        f = fc[i]
        if f > 20000.0: f = 20000.0
        if f < 20.0: f = 20.0
        g = np.tan(np.pi * f / 48000.0)
        a1 = 1.0 / (1.0 + g * (g + k)); a2 = g * a1; a3 = g * a2
        v3 = x[i] - ic2; v1 = a1 * ic1 + a2 * v3; v2 = ic2 + a2 * ic1 + a3 * v3
        ic1 = 2 * v1 - ic1; ic2 = 2 * v2 - ic2
        if mode == 0: y[i] = v2
        elif mode == 1: y[i] = v1
        else: y[i] = x[i] - k * v1 - v2
    return y


@njit(cache=True)
def ks_loop(exc, L, P, damp, bright):
    y = np.zeros(L)
    for i in range(L):
        v = exc[i] if i < exc.shape[0] else 0.0
        if i > P:
            v += damp * (bright * y[i - P] + (1 - bright) * 0.5 * (y[i - P] + y[i - P - 1]))
        elif i == P:
            v += damp * y[0]
        y[i] = v
    return y


@njit(cache=True)
def env_follow(x, att, rel):
    n = x.shape[0]; e = np.empty(n); s = 0.0
    a = np.exp(-1.0 / (att * 48000.0)); r = np.exp(-1.0 / (rel * 48000.0))
    for i in range(n):
        v = x[i]
        if v > s: s = a * s + (1 - a) * v
        else: s = r * s + (1 - r) * v
        e[i] = s
    return e


def saw(freq, phase0=0.0):
    dt = np.asarray(freq, dtype=float) / SR
    ph = (phase0 + np.cumsum(dt)) % 1.0
    y = 2 * ph - 1
    m = ph < dt; x = ph[m] / dt[m]; y[m] -= x + x - x * x - 1
    m = ph > 1 - dt; x = (ph[m] - 1) / dt[m]; y[m] -= x * x + x + x + 1
    return y


def adsr(dur, a, d, s, r):
    n = int((dur + r) * SR); t = ts(n)
    e = np.where(t < a, t / max(a, 1e-4), s + (1 - s) * np.exp(-(t - a) / max(d, 1e-4)))
    ig = min(int(dur * SR), n - 1); v = e[ig]
    return np.where(t < dur, e, v * np.exp(-(t - dur) / (r / 4.6)))


def make_ir(dur, rt60, predelay=0.02, damp=3500, seed=1, early=True):
    n = int(dur * SR); t = ts(n); r = np.random.default_rng(seed)
    dec = np.exp(-6.9 * t / rt60); out = []
    for c in range(2):
        x = r.standard_normal(n) * dec
        dark = lp(x, damp, 1); w = np.clip(t / (rt60 * .45), 0, 1)
        x = x * (1 - w) * .6 + dark * w
        x[:int(.003 * SR)] *= np.linspace(0, 1, int(.003 * SR))
        if early:
            for k in range(6):
                d = int((0.007 + 0.011 * k + r.random() * .006) * SR); x[d] += (0.5 - k * .06) * (1 if r.random() > .5 else -1) * 8
        out.append(np.concatenate([np.zeros(int(predelay * SR)), x]))
    ir = np.stack(out, 1); return ir / np.sqrt((ir ** 2).sum(0).mean())


IR_HALL = make_ir(2.6, 1.9, .024, 3800, 11)
IR_PLATE = make_ir(1.1, 0.9, .006, 6500, 12, early=False)


# ───────────────────────── instruments ─────────────────────────
def epiano(m, dur, vel=0.7):
    """DX7-style FM electric piano: 1:1 body (decaying index) + 14:1 bell transient"""
    f = float(mtof(m)); rel = 0.22; n = int((dur + rel) * SR); t = ts(n)
    tau = 1.2 * (262 / f) ** .5 + .35
    rel_env = np.where(t < dur, 1.0, np.exp(-(t - dur) / .06))
    amp = np.exp(-t / tau) * rel_env * np.minimum(1, t / .0015)
    I1 = vel * 1.5 * np.exp(-t / .5) + .3 * vel
    ph = 2 * np.pi * f * t; ph2 = 2 * np.pi * f * 1.0015 * t
    body = .62 * np.sin(ph + I1 * np.sin(ph)) + .38 * np.sin(ph2 + .7 * I1 * np.sin(ph2))
    tine = np.sin(ph + 2.2 * vel * np.exp(-t / .016) * np.sin(14 * ph)) * np.exp(-t / .11) * .3 * vel * rel_env
    return (body * amp + tine) * vel


def bass(m, dur, vel=.8, kind='T'):
    """Additive slap bass (T thumb, P pop, D dead note, F finger)"""
    f0 = float(mtof(m)); rel = .025; n = int((dur + rel) * SR); t = ts(n)
    P = dict(T=(1.1, .30, 1.0, .03, .5), P=(.8, .12, .8, .045, .9), D=(.045, .9, 1.5, 0, .7), F=(1.8, .7, 1.5, .01, .1))[kind]
    base_tau, kk, tilt, drop, click = P
    ph = 2 * np.pi * np.cumsum(f0 * (1 + drop * np.exp(-t / .009))) / SR
    y = np.zeros(n); nh = int(min(46, 9000 / f0))
    for k in range(1, nh + 1):
        y += np.sin(k * ph + .37 * k) / k ** tilt * np.exp(-t / (base_tau / (1 + kk * k ** 1.15)))
    y /= 2.2
    cl = hp(noise(n), 2500) * np.exp(-t / .0022) * click
    env = np.minimum(1, t / .0012) * np.where(t < dur, 1, np.exp(-(t - dur) / .01))
    return np.tanh(1.5 * (y + cl) * env) * vel


def kick(vel=1.0):
    n = int(.42 * SR); t = ts(n)
    f = 50 + 85 * np.exp(-t / .028) + 380 * np.exp(-t / .0025)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .15) + hp(noise(n), 3000) * np.exp(-t / .004) * .22
    return np.tanh(1.4 * y) * vel


def _gate(n, hold, fall=.018):
    t = ts(n); return np.where(t < hold, 1.0, np.clip(1 - (t - hold) / fall, 0, 1))


def snare(vel=1.0, gate=.26):
    """Gated-reverb snare"""
    n = int(.6 * SR); t = ts(n)
    tone = np.sin(2 * np.pi * np.cumsum(190 * (1 + .12 * np.exp(-t / .01))) / SR) * np.exp(-t / .05) * .6 \
        + np.sin(2 * np.pi * 335 * t) * np.exp(-t / .03) * .3
    nz = bp(noise(n), 1200, 9000) * np.exp(-t / .1) * .9 + hp(noise(n), 5500) * np.exp(-t / .03) * .3
    dry = tone + nz
    wet = np.stack([fftconvolve(dry, IR_PLATE[:, c])[:n] for c in range(2)], 1)
    g = _gate(n, gate)[:, None]
    return (dry[:, None] * .8 + wet * 1.1 * g) * vel


_TOMS = {}


def tom(f, vel=1.0):
    k = int(round(f))
    if k not in _TOMS:
        n = int(.55 * SR); t = ts(n)
        dry = np.sin(2 * np.pi * np.cumsum(f * (1 + .6 * np.exp(-t / .018))) / SR) * np.exp(-t / .22) + bp(noise(n), 300, 4000) * np.exp(-t / .03) * .3
        wet = np.stack([fftconvolve(dry, IR_PLATE[:, c])[:n] for c in range(2)], 1)
        _TOMS[k] = dry[:, None] * .9 + wet * .9 * _gate(n, .24)[:, None]
    return _TOMS[k] * vel


HAT_F = np.array([205.3, 304.4, 369.6, 522.7, 540.0, 800.0]) * 2.1


def hat(vel=1.0, open_=False):
    n = int((.5 if open_ else .09) * SR); t = ts(n)
    x = sum(np.sign(np.sin(2 * np.pi * f * t + i)) for i, f in enumerate(HAT_F)) / 6
    x = hp(bp(x, 6000, 16000) + hp(noise(n), 8000) * .5, 6000)
    return x * np.exp(-t / (.13 if open_ else .017)) * vel


def crash(vel=1.0, dur=2.6):
    n = int(dur * SR); t = ts(n); out = []
    for c in range(2):
        x = hp(noise(n), 3500) + .5 * bp(sum(np.sign(np.sin(2 * np.pi * f * 1.37 * t + c)) for f in HAT_F), 3000, 12000)
        out.append(x * np.exp(-t / 1.1) * np.minimum(1, t / .002))
    return np.stack(out, 1) * vel * .5


def clap(vel=1.0):
    n = int(.3 * SR); t = ts(n); e = np.zeros(n)
    for k, d in enumerate([0, .009, .018, .03]):
        s = int(d * SR); e[s:] += np.exp(-(t[:n - s]) / (.006 if k < 3 else .09))
    return bp(noise(n), 900, 3500) * e * vel * .6


def tamb(vel=1.0):
    n = int(.12 * SR); t = ts(n)
    x = hp(noise(n), 7000) + .4 * sum(np.sin(2 * np.pi * f * t) for f in (5200, 6900, 8300))
    return x * np.exp(-t / .045) * vel


def boom(vel=1.0):
    n = int(.9 * SR); t = ts(n)
    return np.sin(2 * np.pi * np.cumsum(38 + 45 * np.exp(-t / .12)) / SR) * np.exp(-t / .35) * np.minimum(1, t / .004) * vel


def brass(m, dur, vel=.8, bright=1.0, att=.012):
    """Synth brass: 3 detuned saws + scoop + filter-envelope swell + delayed vibrato"""
    f = float(mtof(m)); rel = .14; n = int((dur + rel) * SR); t = ts(n)
    scoop = 2 ** ((-.3 * np.exp(-t / .035)) / 12)
    vib = 1 + .0035 * np.sin(2 * np.pi * 5.3 * t) * np.clip((t - .35) / .3, 0, 1)
    y = sum(saw(f * 2 ** (d / 1200) * scoop * vib, rng.random()) for d in (-8, 0, 7)) / 3
    fe = np.where(t < att + .03, np.minimum(1, t / (att + .03)), .5 + .5 * np.exp(-(t - att - .03) / .25))
    fe = np.where(t < dur, fe, fe[min(int(dur * SR), n - 1)] * np.exp(-(t - dur) / .05))
    fc = f * 1.3 + (1200 + 5.5 * f) * bright * (.35 + .65 * vel) * fe
    y = svf(y, fc, .85, 0)
    return y * adsr(dur, att, .3, .78, rel)[:n] * vel


def pad(m, dur, vel=.5, att=.45):
    f = float(mtof(m)); rel = .9; n = int((dur + rel) * SR); t = ts(n)
    y = sum(saw(f * 2 ** (d / 1200) * (1 + .0015 * np.sin(2 * np.pi * .31 * t + d)), rng.random()) for d in (-12, -4, 4, 12)) / 4
    y = lp(y, 2400, 2)
    return y * adsr(dur, att, .6, .85, rel)[:n] * vel


def gtr(m, dur, vel=.7, mute=False):
    f = float(mtof(m)); P = int(round(SR / f - .5)); L = int((dur + .06) * SR)
    exc = lp(noise(P), 2500 + 3500 * vel, 1) * vel
    y = ks_loop(exc, L, P, .975 if mute else .9965, .15 if mute else .35)
    t = ts(L); env = np.where(t < dur, 1, np.exp(-(t - dur) / .012))
    if mute: y = lp(y, 2200, 1)
    return y * env


def bell(m, dur=2.8, vel=.5):
    f = float(mtof(m)); n = int(dur * SR); t = ts(n)
    I = 2.6 * vel * np.exp(-t / .3) + .25
    y = np.sin(2 * np.pi * f * t + I * np.sin(2 * np.pi * 3.5 * f * t)) * np.exp(-t / .95) \
        + .25 * np.sin(2 * np.pi * 2.001 * f * t) * np.exp(-t / .4)
    return y * np.minimum(1, t / .002) * vel


def riser(dur, vel=1.0, f0=250, f1=7000):
    n = int(dur * SR); t = ts(n); u = t / dur
    fc = f0 * (f1 / f0) ** (u ** 1.6)
    return svf(noise(n), fc, 2.2, 1) * (u ** 2.2) * vel


# new voices for this film
def pluck(m, dur, vel=.7, cut=1800, res=1.2, decay=.1):
    """Analog-style pluck: arpeggiator and low synth pizzicato"""
    f = float(mtof(m)); n = int((dur + .05) * SR); t = ts(n)
    y = .6 * saw(np.full(n, f), rng.random()) + .4 * saw(np.full(n, f * 1.006), rng.random())
    y = svf(y, f * 1.5 + cut * np.exp(-t / decay), res, 0)
    env = np.minimum(1, t / .002) * np.exp(-t / (decay * 2.5)) * np.where(t < dur, 1, np.exp(-(t - dur) / .01))
    return y * env * vel


def glide(m0, m1, dur, vel=.6, bright=2500, curve=2.0, att=.01, rel=.08):
    """Saw glide (power-up sweep, comic fall, slip dive)"""
    n = int((dur + rel) * SR); t = ts(n); u = np.clip(t / dur, 0, 1)
    p = m0 + (m1 - m0) * u ** curve; f = mtof(p)
    y = .5 * saw(f) + .5 * saw(f * 1.007, .4)
    y = svf(y, f * 1.2 + bright, 1.0, 0)
    env = np.minimum(1, t / att) * np.where(t < dur, 1, np.exp(-(t - dur) / (rel / 4)))
    return y * env * vel


def siren(dur, lo, hi, period, vel=.5, rise=0.0):
    """Two-tone siren-like synth (square-ish wobble between two pitches)"""
    n = int(dur * SR); t = ts(n)
    sq = np.tanh(4 * np.sin(2 * np.pi * t / period))
    p = lo + (hi - lo) * (.5 + .5 * sq) + rise * t / dur
    f = mtof(p); y = saw(f) - saw(f, .5)          # pulse wave
    y = svf(y, np.full(n, 3200.0), 1.4, 0)
    env = np.minimum(1, t / .03) * np.clip((dur - t) / .08, 0, 1)
    return y * env * vel


# ───────────────────────── harmony ─────────────────────────
PC = dict(C=0, Db=1, D=2, Eb=3, E=4, F=5, Gb=6, G=7, Ab=8, A=9, Bb=10, B=11, **{'C#': 1, 'F#': 6, 'G#': 8})
Q = {'M7': [0, 4, 7, 11], 'M9': [0, 4, 7, 11, 14], 'm7': [0, 3, 7, 10], 'm9': [0, 3, 7, 10, 14], '7': [0, 4, 7, 10],
     '13': [0, 4, 10, 14, 21], '7sus4': [0, 5, 7, 10], '7b9': [0, 4, 7, 10, 13], 'add9': [0, 4, 7, 14],
     '11': [0, 5, 7, 10, 14]}
# section -> bar -> [(start beat, beats, root, quality)]
CH = {
    'OPEN': {0: [(0, 4, 'Eb', 'M9')], 1: [(0, 4, 'D', 'm7')], 2: [(0, 2, 'C', 'm9'), (2, 2, 'F', '7sus4')],
             3: [(0, 4, 'Bb', 'M9')], 4: [(0, 2, 'Gb', 'M9'), (2, 2, 'Ab', '7sus4')]},
    'HOME': {0: [(0, 4, 'Db', 'M9')], 1: [(0, 4, 'Bb', 'm9')], 2: [(0, 4, 'Gb', 'M9')],
             3: [(0, 2, 'F', 'm7'), (2, 2, 'Bb', 'm9')], 4: [(0, 3, 'Eb', 'm9'), (3, 1, 'Ab', '13')],
             5: [(0, 4, 'Db', 'M9')], 6: [(0, 2, 'Gb', 'M9'), (2, 2, 'G', '7b9')]},
    'GARAGE': {0: [(0, 4, 'C', 'm9')], 1: [(0, 4, 'Ab', 'M9')], 2: [(0, 4, 'C', 'm9')],
               3: [(0, 2, 'Ab', 'M9'), (2, 2, 'Bb', '7sus4')], 4: [(0, 2, 'Bb', '7sus4'), (2, 2, 'Bb', '11')],
               5: [(0, 2, 'Eb', 'M9'), (2, 2, 'F', '13')]},
    'DRIVE': {0: [(0, 4, 'Eb', 'M9')], 1: [(0, 4, 'F', '13')], 2: [(0, 2, 'D', 'm7'), (2, 2, 'G', 'm9')],
              3: [(0, 2, 'C', 'm9'), (2, 2, 'F', '7sus4')], 4: [(0, 4, 'Eb', 'M9')], 5: [(0, 4, 'F', '13')],
              6: [(0, 2, 'D', 'm7'), (2, 2, 'G', 'm9')], 7: [(0, 2, 'C', 'm9'), (2, 2, 'F', '13')]},
    'BILL': {0: [(0, 4, 'G', 'm9')], 1: [(0, 2, 'Eb', 'M9'), (2, 2, 'F', '7sus4')],
             2: [(0, 2, 'F', '7sus4'), (2, 2, 'Bb', '11')], 3: [(0, 4, 'Bb', '11')],
             4: [(0, 1.2, 'Bb', '11'), (1.2, 2.8, 'Eb', 'M9')], 5: [(0, 2, 'C', 'm9'), (2, 2, 'D', '7b9')]},
    'DRONE': {0: [(0, 4, 'G', 'm9')], 1: [(0, 4, 'Eb', '7')], 2: [(0, 4, 'G', 'm9')], 3: [(0, 4, 'C', 'm9')],
              4: [(0, 2.4, 'D', '7b9'), (2.4, 1.6, 'Bb', 'M9')], 5: [(0, 4, 'Bb', 'M9')],
              6: [(0, 4, 'Eb', 'M9')], 7: [(0, 4, 'F', '13')]},
    'CLIMB': {0: [(0, 4, 'F', 'm9')], 1: [(0, 4, 'Db', 'M9')], 2: [(0, 4, 'Bb', 'm9')],
              3: [(0, 2, 'Gb', 'M9'), (2, 2, 'C', '7sus4')], 4: [(0, 1.6, 'C', '7sus4'), (1.6, 2.4, 'Db', 'M9')]},
    'WINDOW': {0: [(0, 4, 'F', 'm9')], 1: [(0, 4, 'Db', 'M9')], 2: [(0, 2, 'Bb', 'm9'), (2, 2, 'Eb', '7sus4')],
               3: [(0, 3, 'Eb', '7sus4'), (3, 1, 'Db', 'M9')], 4: [(0, 2, 'F', 'm9'), (2, 2, 'Eb', '7sus4')]},
    'DAWN': {0: [(0, 4, 'Db', 'M9')], 1: [(0, 4, 'Eb', '13')], 2: [(0, 2, 'C', 'm7'), (2, 2, 'F', 'm9')],
             3: [(0, 2, 'Bb', 'm9'), (2, 1, 'Eb', '7sus4'), (3, 1, 'E', '7sus4')],
             4: [(0, 4, 'D', 'M9')], 5: [(0, 4, 'E', '13')], 6: [(0, 2, 'B', 'm9'), (2, 2, 'E', '13')]},
    'END': {0: [(0, 4, 'A', 'M9')], 1: [(0, 4, 'A', 'M9')]},
}


def chord_at(sec, b, beat):
    while beat >= 4: b += 1; beat -= 4
    if b not in CH[sec]:
        i = ORDER.index(sec)
        if i + 1 < len(ORDER): return chord_at(ORDER[i + 1], 0, 0)
        b = max(CH[sec])
    for s, d, r, q in CH[sec][b]:
        if s <= beat < s + d: return r, q
    return CH[sec][b][-1][2:]


def bass_root(r): return 28 + (PC[r] - 4) % 12


def voicing(r, q, center, drop_root=True, nmax=5):
    ints = Q[q]
    tones = sorted(set((PC[r] + i) % 12 for i in ints if not (drop_root and i == 0 and len(ints) > 3)))
    best, bs = None, 1e9
    for k in range(len(tones)):
        rot = tones[k:] + tones[:k]; v = [rot[0]]
        for p in rot[1:]:
            while p <= v[-1]: p += 12
            v.append(p)
        v = np.array(v[-nmax:], float); v += 12 * round((center - v.mean()) / 12)
        s = abs(v.mean() - center) + .15 * (v.max() - v.min())
        if s < bs: best, bs = v, s
    return [int(x) for x in best]


def harm(top, r, q, nv=4):
    pcs = set((PC[r] + i) % 12 for i in Q[q]); out = [top]; c = top - 2
    while len(out) < nv and c > top - 13:
        if c % 12 in pcs and out[-1] - c >= 2: out.append(c)
        c -= 1
    return out + [top - 12]


# ───────────────────────── buses and placement ─────────────────────────
STEMS = ['drums', 'bass', 'keys', 'guitar', 'pad', 'brass', 'lead', 'fx']
BUS = {k: np.zeros((N, 2)) for k in STEMS}
SEND = {k: np.zeros(N) for k in STEMS}
SEND_AMT = dict(drums=.05, bass=0, keys=.22, guitar=.12, pad=.35, brass=.2, lead=.28, fx=.45)
KICKS = []


def place(bus, sig, t, gain=1.0, pan=0.0, send=None):
    for w0, w1 in WIN:                       # never start inside a silence window
        if w0 - 1e-6 <= t < w1:
            if w1 - t < .006: t = w1
            else: return
    s = int(round(t * SR))
    if s >= N: return
    st = sig if sig.ndim == 2 else np.stack([sig * np.cos((pan + 1) * np.pi / 4), sig * np.sin((pan + 1) * np.pi / 4)], 1) * 1.4142
    st = st * gain
    for w0, w1 in WIN:                       # a sound started before a window is cut at its start
        if t < w0:
            c = int(round(w0 * SR)) - s
            if c < len(st):
                fl = min(int(.01 * SR), c)
                if fl > 0: st[c - fl:c] *= np.linspace(1, 0, fl)[:, None]
                st[c:] = 0
    if s < 0: st = st[-s:]; s = 0
    e = min(N, s + len(st))
    BUS[bus][s:e] += st[:e - s]
    SEND[bus][s:e] += st[:e - s].mean(1) * (SEND_AMT[bus] if send is None else send)


def hum(ms=3.0): return rng.normal(0, ms / 1000)
def jv(v, j=.08): return v * (1 + rng.uniform(-j, j))


def rev_crash(t_end, dur, gain):
    rc = crash(1.0, dur)[::-1] * np.linspace(0, 1, int(dur * SR))[:, None] ** 2
    place('fx', rc, t_end - dur, gain)


# ───────────────────────── parts ─────────────────────────
SNARES = [snare(1, .26) for _ in range(3)]
KICKW = [kick(1) for _ in range(2)]


def K_(t, g=.5): place('drums', KICKW[rng.integers(2)], t, g); KICKS.append(t)
def S_(t, g=.36): place('drums', SNARES[rng.integers(3)], t, g)


def drums_bar(sec, b, style, dyn=1.0, crash_=False, start=0, stop=16):
    t0 = T(sec, b); bt = BT(sec)
    def at(s): return t0 + s * bt / 4
    def ok(s): return start <= s < stop
    def K(s, v=1.0):
        if ok(s): K_(at(s) + hum(1), .5 * v * dyn)
    def S(s, v=1.0):
        if ok(s): S_(at(s) + hum(2), .36 * v * dyn)
    def H(s, v=1.0, o=False):
        if ok(s): place('drums', hat(jv(1), o), at(s) + hum(3), (.09 if o else .075) * v * dyn, .3)
    def C(s, v=1.0):
        if ok(s): place('drums', clap(jv(1)), at(s) + .004, .2 * v * dyn, -.1)
    def TB(s, v=1.0):
        if ok(s): place('drums', tamb(jv(1, .15)), at(s) + hum(4), .032 * v * dyn, -.4)
    if crash_ and ok(0): place('drums', crash(1), t0, .24 * dyn); K(0, 1.1)
    acc = [1, .45, .72, .45]
    if style == 'groove':
        for s in (0, 6, 10, 13): K(s, .95 if s else 1.0)
        S(4); S(12); S(7, .16); S(15, .14)
        for s in range(16):
            if s == 14: H(s, .9, True)
            elif s != 15: H(s, acc[s % 4])
    elif style == 'chorus':
        for s in (0, 3, 6, 8, 10, 14): K(s, 1.0 if s in (0, 8) else .85)
        S(4); S(12); S(7, .15); S(15, .18); C(4); C(12)
        for s in range(16):
            if s % 4 == 2: H(s, .75, True)
            else: H(s, acc[s % 4])
            TB(s, acc[s % 4])
    elif style == 'comic':            # light tiptoe pattern
        K(0, .8); K(8, .7); C(4, .7); C(12, .7)
        for s in range(0, 16, 2): H(s, .7 if s % 4 == 0 else .45)
    elif style == 'half':             # half-time: snare on beat 3
        K(0, .9); K(7, .6); K(10, .75); S(8, .95)
        for s in range(0, 16, 2): H(s, .55 if s % 4 == 0 else .35)
    elif style == 'ballad':
        for s in range(0, 16, 4): TB(s + 2, .9)
    elif style == 'tomfill':          # 16th toms over the last two beats
        for i, (s, f) in enumerate(zip(range(8, 16), [225, 215, 180, 172, 142, 136, 108, 104])):
            if ok(s): place('drums', tom(f, .6 + .05 * i), at(s) + hum(1), .24 * dyn, .5 - i * .13)
        S(15, .7)
    elif style == 'roll':             # 16th snare crescendo over the whole bar range
        for s in range(16): S(s, .3 + .7 * s / 15)


B_VERSE = [(0, 'T', 0, 3), (3, 'D', 0, 1), (4, 'P', 12, 1), (6, 'T', 0, 2), (8, 'T', 7, 2), (10, 'P', 12, 1), (11, 'D', 0, 1), (12, 'T', 0, 2), (14, 'T', 'b7', 1), (15, 'T', 'A', 1)]
B_CHORUS = [(0, 'T', 0, 2), (2, 'P', 12, 1), (3, 'D', 0, 1), (4, 'T', 0, 2), (6, 'P', 12, 2), (8, 'T', 7, 2), (10, 'P', 12, 1), (11, 'T', 0, 1), (12, 'T', 0, 2), (14, 'P', 12, 1), (15, 'T', 'A', 1)]
B_DRIVE = [(0, 'T', 0, 2), (2, 'P', 12, 1), (3, 'T', 0, 1), (5, 'D', 0, 1), (6, 'T', 0, 1), (7, 'P', 12, 1), (8, 'T', 7, 2), (10, 'P', 12, 1), (11, 'D', 0, 1), (12, 'T', 0, 1), (13, 'P', 12, 1), (14, 'T', 'b7', 1), (15, 'T', 'A', 1)]


def bass_bar(sec, b, pat, dyn=1.0, start=0, stop=16):
    bt = BT(sec)
    for s, kind, iv, ln in pat:
        if not (start <= s < stop): continue
        beat = s / 4; r, q = chord_at(sec, b, beat); root = bass_root(r)
        if iv == 'A':
            nr = bass_root(chord_at(sec, b + 1, 0)[0]); cands = [nr - 1, nr + 1, nr + 11, nr - 11]
            m = min(cands, key=lambda c: abs(c - root))
        elif iv == 'b7': m = root + (9 if q.startswith('M') or q == 'add9' else 10)
        else: m = root + iv
        v = {'T': .85, 'P': .8, 'D': .5, 'F': .7}[kind]
        place('bass', bass(m, ln * bt / 4 * .92, jv(v, .06), kind), T(sec, b, beat) + hum(1.5), .36 * dyn)


def ep_bar(sec, b, pat, dyn=1.0, center=64):
    bt = BT(sec)
    for beat, d, vm in pat:
        r, q = chord_at(sec, b, beat + (.5 if beat % 1 == .5 and beat >= 3.5 else 0))
        for i, m in enumerate(voicing(r, q, center)):
            place('keys', epiano(m, d * bt, jv(.62 * vm)), T(sec, b, beat) + i * .004 + hum(2), .27 * dyn, -.35 + .18 * i)


def pad_bar(sec, b, dyn=1.0, center=62, att=.45, nmax=5, gain=.22):
    bt = BT(sec)
    for s, d, r, q in CH[sec][b]:
        for i, m in enumerate(voicing(r, q, center, nmax=nmax)):
            place('pad', pad(m, d * bt, .5, att), T(sec, b, s), gain * dyn, (-.6, .6)[i % 2])


G_VERSE = '..x.X..x..x.X.x.'
G_CHORUS = 'x.xxX.xxx.xxX.xx'
G_DRIVE = 'x.xXx.xxX.xx.xXx'


def gtr_bar(sec, b, pat, dyn=1.0, start=0, stop=16):
    for s, ch in enumerate(pat):
        if ch == '.' or not (start <= s < stop): continue
        r, q = chord_at(sec, b, s / 4); v = voicing(r, q, 71, nmax=4)[-3:]
        if s % 2: v = v[::-1]
        mute = ch == 'x'
        for i, m in enumerate(v):
            place('guitar', gtr(m, .045 if mute else .2, jv(.5 if mute else .85), mute), T(sec, b, s / 4) + i * .006 + hum(2.5), .4 * dyn, 0)


def stab(sec, b, beat, dur, top, dyn=1.0, bright=1.0, att=.012, vel=.85, t=None, jitter=True):
    r, q = chord_at(sec, b, beat)
    t = T(sec, b, beat) if t is None else t
    for i, m in enumerate(harm(top, r, q)):
        place('brass', brass(m, dur, jv(vel, .05), bright, att), t + (hum(3) if jitter else 0), .15 * dyn, (-.45, .45, -.2, .2, 0)[i % 5])


def arp_bar(sec, b, gain, cut0, cut1, center=67, start=0, stop=16, pat=(0, 1, 2, 3, 4, 5, 6, 7, 8, 7, 6, 5, 4, 3, 2, 1)):
    bt = BT(sec)
    for s in range(start, stop):
        r, q = chord_at(sec, b, s / 4); v = voicing(r, q, center, nmax=4)
        ladder = v + [x + 12 for x in v] + [v[0] + 24]
        m = ladder[pat[s % len(pat)] % len(ladder)]
        cut = cut0 + (cut1 - cut0) * s / 15
        place('keys', pluck(m, bt / 4 * .8, jv(.7, .1), cut, 1.6, .07), T(sec, b, s / 4), gain, (-.5, .5)[s % 2], send=.3)


def bell_line(sec, notes, gain=.08, b0=0, pan=.25, dur=3.0, vel=.4, shift=0):
    for b, s, m in notes:
        place('fx', bell(m + shift, dur, vel), T(sec, b0 + b, s), gain, pan)


# ── Grandma's theme (written in Bb: melody tonic Bb4 = 70) ──
H1 = [(0, .5, 77), (.5, .5, 79), (1, .5, 82), (1.5, .5, 82), (2, .5, 84), (2.5, 1.5, 86)]
H2 = [(0, .5, 84), (.5, .5, 82), (1, .5, 84), (1.5, 1.0, 81), (2.5, .5, 77), (3, 1, 79)]
H3 = [(0, .5, 77), (.5, .5, 79), (1, .5, 81), (1.5, .5, 82), (2, .75, 86), (2.75, .25, 84), (3, 1, 82)]
H4 = [(0, 1, 84), (1, .5, 82), (1.5, .5, 79), (2, .5, 77), (2.5, .5, 79), (3, 1, 77)]
H4b = [(0, .5, 84), (.5, .5, 86), (1, 1, 87), (2, 2, 86)]


def tr(notes, k): return [(s, d, m + k) for s, d, m in notes]


def lead_line(notes, bright, gain, breath=0.0):
    """Monophonic lead: continuous-phase saw + glide + delayed vibrato; notes=[(t, dur, midi, vel)]"""
    if not notes: return
    notes = sorted(notes); t0 = max(0, notes[0][0] - .2); t1 = min(DUR, notes[-1][0] + notes[-1][1] + .6)
    a, b_ = int(t0 * SR), int(t1 * SR); n = b_ - a; t = ts(n) + t0
    pitch = np.full(n, float(notes[0][2])); gate = np.zeros(n); acc = np.zeros(n); vib = np.zeros(n); vel = np.zeros(n)
    for (s, d, m, v) in notes:
        i0, i1 = int((s - t0) * SR), int((s + d - t0) * SR)
        pitch[i0:] = m; gate[i0:max(i0 + 1, i1 - int(.02 * SR))] = 1; vel[i0:i1] = v
        k = np.arange(n - i0) / SR; acc[i0:] = np.maximum(acc[i0:], np.exp(-k / .16))
        if d > .45: vib[i0:i1] = np.clip((k[:i1 - i0] - .22) / .3, 0, 1)
    al = np.exp(-1 / (.028 * SR))
    pitch = lfilter([1 - al], [1, -al], pitch, zi=[pitch[0] * al])[0]
    pitch = pitch + .16 * vib * np.sin(2 * np.pi * 5.6 * t)
    f = mtof(pitch)
    osc = .5 * saw(f) + .3 * saw(f * 1.004, .3) + .2 * (saw(f, 0) - saw(f, .5))
    amp = env_follow(gate * np.maximum(vel, .01), .006, .07)
    fc = 700 + f * 2.0 + (2600 * acc + 900) * bright
    y = svf(osc, fc, 1.05, 0)
    if breath:
        y = y + breath * svf(noise(n), f * 2.5, 2.0, 1) * (.4 + acc)
        y = y + .25 * bp(y, 900, 2600)            # nasal sax-like formant
    y = y * amp
    s = np.stack([y, y], 1) * gain
    BUS['lead'][a:b_] += s; SEND['lead'][a:b_] += y * gain * SEND_AMT['lead']


def notes_at(sec, b, mel, vel=1.0, k=0, beat_min=-1):
    return [(T(sec, b, s), d * BT(sec), m + k, vel) for s, d, m in mel if s >= beat_min]


# ───────────────────────── arrangement ─────────────────────────
def sec_open():
    S = 'OPEN'; bt = BT(S)
    for b in range(3):
        pad_bar(S, b, .7 + .12 * b)
        r, q = CH[S][b][0][2:]; v = voicing(r, q, 66)
        for k in range(8):
            if b == 2 and k >= 4: break
            idx = (0, 2, 1, 3, 4, 3, 2, 1)[k]
            place('keys', epiano(v[idx % len(v)], bt * 1.4, jv(.38 + .06 * (k % 4 == 0))), T(S, b, k * .5) + hum(3), .24, -.4 + .1 * idx)
        if b >= 1: place('bass', bass(bass_root(r), BT(S) * 3.8, .5, 'F'), T(S, b), .28)
    # FM bells foreshadow Grandma's theme (rain on glass)
    bell_line(S, [(0, 0, 77), (0, 1, 79), (0, 2, 82), (1, 0, 84), (1, 1, 86), (2, 0, 84), (2, 1, 82)], .075, vel=.36)
    # rising fill: last two beats of bar 2
    pad_bar(S, 2, .4)
    for s, iv, kind, ln in [(8, 0, 'T', 2), (10, 2, 'T', 2), (12, 4, 'T', 1), (13, 5, 'P', 1), (14, 7, 'T', 1), (15, 9, 'P', 1)]:
        place('bass', bass(29 + iv, ln * bt / 4 * .9, .8, kind), T(S, 2, s / 4), .34)
    drums_bar(S, 2, 'tomfill', 1.0)
    place('fx', riser(2 * bt, 1.0), T(S, 2, 2), .14)
    rev_crash(T(S, 3), 1.1, .14)
    stab(S, 2, 3, bt * .9, 77, .9, .6, att=.25, vel=.7)
    # TITLE: synth-brass hit
    tt = T(S, 3); key('title', tt)
    place('fx', boom(1.1), tt, .34); place('drums', crash(1.1, 3.0), tt, .3); K_(tt, .6); S_(tt, .4)
    for m in harm(86, 'Bb', 'M9', 5):
        place('brass', brass(m, bt * 1.3, .98, 1.2, .008), tt, .2, rng.uniform(-.45, .45))
    place('bass', bass(34, bt * 1.3, .95, 'T'), tt, .38); place('bass', bass(22, bt * 1.5, .7, 'F'), tt, .3)
    # brass answer (theme head) under the title card
    for s, d, m in [(1.75, .25, 77), (2, .25, 79), (2.25, .5, 82), (2.75, 1.25, 86)]:
        r, q = chord_at(S, 3, s)
        for i, mm in enumerate(harm(m, r, q, 3)):
            place('brass', brass(mm, d * bt * .95, .85, 1.0), T(S, 3, s), .14, (-.4, .4, 0, 0)[i])
    pad_bar(S, 3, .9); ep_bar(S, 3, [(1.75, .25, .7), (2.75, 1.25, .9)], .9)
    drums_bar(S, 3, 'comic', .8, start=4)
    place('drums', tom(110), T(S, 3, 3.5), .22, .4); place('drums', tom(85), T(S, 3, 3.75), .24, -.3)
    # bar 4: glint and the turn toward home
    tg = T(S, 4); key('titleGlint', tg)
    place('fx', bell(98, 3.0, .55), tg, .09, .45); place('fx', bell(105, 2.5, .45), tg + .06, .06, -.45)
    place('fx', bell(93, 3.0, .4), tg + .12, .05, 0)
    pad_bar(S, 4, .8)
    ep_bar(S, 4, [(0, 1.9, .75), (2, 1.9, .65)], .85)
    place('bass', bass(bass_root('Gb'), bt * 1.9, .5, 'F'), T(S, 4), .28)
    place('bass', bass(bass_root('Ab'), bt * 1.9, .5, 'F'), T(S, 4, 2), .28)


def sec_home():
    S = 'HOME'; bt = BT(S)
    for b in range(7):
        for s, d, r, q in CH[S][b]:
            v = voicing(r, q, 63)
            for i, m in enumerate(v):          # gently rolled ballad chords
                place('keys', epiano(m, d * bt * .95, jv(.48)), T(S, b, s) + i * .022 + hum(2), .27, -.35 + .18 * i)
            if d >= 2 and not (b == 1):        # soft re-strike of the upper voices (bar 1 left open for the phone buzz)
                for i, m in enumerate(v[-3:]):
                    place('keys', epiano(m + 12, bt * .9, jv(.3)), T(S, b, s + 1.5) + i * .015, .14, .2 + .1 * i)
            place('bass', bass(bass_root(r), d * bt * .93, .55, 'F'), T(S, b, s) + .01, .3)
        pad_bar(S, b, .35 if b < 4 else .55 + .1 * (b - 4), center=60, att=.9)
    drums_bar(S, 5, 'ballad', .6); drums_bar(S, 6, 'ballad', .7)
    # e-piano melody: the theme hummed quietly (Db, melody tonic Db = 73)
    mel = {0: [(1, .5, 75), (1.5, .5, 77), (2, 2, 80)], 1: [(0, 1.5, 82), (1.5, .5, 80)],
           2: [(1, .5, 77), (1.5, .5, 80), (2, 1, 82), (3, 1, 84)], 3: [(0, 2, 80), (2, 1, 77), (3, 1, 75)],
           4: [(0, 2, 73), (2, .75, 75)],
           5: [(0, .5, 75), (.5, .5, 77), (1, .5, 80), (1.5, .5, 80), (2, .5, 82), (2.5, 1.5, 84)],
           6: [(0, 1.5, 82), (1.5, .5, 80)]}
    for b, ns in mel.items():
        for s, d, m in ns:
            place('keys', epiano(m, d * bt, jv(.62, .05)), T(S, b, s) + hum(4), .3, .1)
    # decision: the warm Ab13 change
    td = T(S, 4, 3); key('decide', td)
    for i, m in enumerate(voicing('Ab', '13', 68)):
        place('pad', pad(m, bt * 1.1, .55, .25), td, .2, (-.6, .6)[i % 2])
    place('fx', bell(87, 3.0, .35), td, .05, .3); place('fx', bell(92, 3.0, .3), td + .08, .04, -.3)
    # little pickup into GARAGE (G7b9 -> Cm9)
    for s, m in [(3, 67), (3.25, 68), (3.5, 71), (3.75, 74)]:
        place('keys', epiano(m, bt * .3, .6), T(S, 6, s), .28, .2)
    place('bass', bass(31, bt * .45, .7, 'T'), T(S, 6, 3), .32); place('bass', bass(35, bt * .45, .7, 'T'), T(S, 6, 3.5), .32)


def sec_garage():
    S = 'GARAGE'; bt = BT(S)
    for b in range(4):
        pad_bar(S, b, .5 + .15 * b, att=.6)
    # rising arpeggiator from bar 0 to the stop at bar 3.5
    for b in range(4):
        stop = 8 if b == 3 else 16
        arp_bar(S, b, .07 + .03 * b, 400 + 900 * b, 1100 + 900 * b, center=64 + 2 * b, stop=stop)
    # toms build
    tpat = {0: [(0, 72, .8), (8, 72, .7)], 1: [(0, 72, .8), (6, 95, .6), (8, 72, .8), (14, 95, .6)],
            2: [(s, 95 if s % 4 else 72, .7 + .02 * s) for s in range(0, 16, 2)],
            3: [(s, (120, 105, 95, 80)[s % 4], .8 + .03 * s) for s in range(8)]}
    for b, hits in tpat.items():
        for s, f, v in hits:
            place('drums', tom(f), T(S, b, s / 4) + hum(1), .26 * v, (-.3, .3)[s % 2])
    for b in (2, 3):
        drums_bar(S, b, 'comic', .6 + .2 * (b - 2), stop=8 if b == 3 else 16)
    # pulsing pedal bass after the unveil
    for k in range(10, 28):
        b, s = divmod(k, 8)
        if b == 3 and s >= 4: break
        place('bass', bass(36 if s % 4 else 24 + 12, bt / 2 * .7, .6 + .1 * (s % 2 == 0), 'D' if s % 2 else 'T'), T(S, b, s / 2), .3)
    # unveil stab
    tu = T(S, 1, 2); key('unveil', tu)
    for m in harm(84, 'Ab', 'M9', 4): place('brass', brass(m, bt * .9, .95, 1.1, .006), tu, .19, rng.uniform(-.4, .4))
    place('fx', boom(1.0), tu, .32); place('drums', crash(1.0, 2.6), tu, .26); K_(tu, .55)
    place('fx', bell(96, 2.5, .5), tu + .02, .06, .4)
    place('bass', bass(32, bt * 1.5, .9, 'T'), tu, .36)
    place('fx', riser(T(S, 3, 2) - T(S, 2), .9, 300, 8000), T(S, 2), .12)
    # stop-time: a short stab where the build stops, then two cough gaps
    ts_ = T(S, 3, 2)
    for m in harm(82, 'Bb', '7sus4', 4): place('brass', brass(m, .22, .9, 1.0, .005), ts_, .17, rng.uniform(-.4, .4))
    K_(ts_, .55); S_(ts_, .3); place('bass', bass(34, .25, .85, 'T'), ts_, .34)
    key('cough1', HIT['cough1']); key('cough2', HIT['cough2'])
    # a tiny unsure pluck between the two coughs (stays clear of both gaps)
    place('keys', pluck(58, .12, .5, 900, 1.2, .06), HIT['cough1'] + .3, .12, .3)
    # smack: comic hit
    tsm = T(S, 4, 1); key('smack', tsm)
    for m in harm(79, 'Bb', '7sus4', 3): place('brass', brass(m, .12, .9, .8, .004), tsm, .17, rng.uniform(-.4, .4))
    K_(tsm, .5); S_(tsm, .38); place('drums', tom(140), tsm, .2, .3)
    # eyes on: big power-up stab + snare fill
    te = T(S, 4, 2); key('eyesOn', te)
    for m in harm(86, 'Bb', '11', 5): place('brass', brass(m, bt * 1.6, 1.0, 1.25, .006), te, .21, rng.uniform(-.45, .45))
    place('fx', glide(36, 84, bt * 1.4, .5, 3000, 1.6), te, .1, 0)
    place('fx', boom(1.1), te, .34); place('drums', crash(1.0, 2.0), te, .24); K_(te, .6)
    place('bass', bass(22, bt * 1.6, .9, 'F'), te, .34)
    drums_bar(S, 4, 'roll', 1.0, start=8)
    for b in (4,):
        for s in (8, 10, 12, 14): place('drums', tom((140, 120, 100, 85)[(s - 8) // 2]), T(S, b, s / 4), .2)
    # door: the groove starts
    tdo = T(S, 5); key('door', tdo)
    drums_bar(S, 5, 'groove', .95, crash_=True)
    bass_bar(S, 5, B_VERSE, .95)
    gtr_bar(S, 5, G_VERSE, .8)
    ep_bar(S, 5, [(0, 1.0, 1.0), (1.5, .4, .7), (2.5, .9, .9), (3.5, .4, .75)], .9)
    pad_bar(S, 5, .5)
    stab(S, 5, 0, bt * .6, 82, 1.2, 1.0, vel=.95, jitter=False)
    stab(S, 5, 2.5, bt * .4, 81, 1.0); stab(S, 5, 3.5, bt * .4, 84, 1.1)
    drums_bar(S, 5, 'tomfill', .7, start=12)


def sec_drive():
    S = 'DRIVE'; bt = BT(S); lead = []
    rev_crash(T(S, 0), .9, .1)
    for b in range(8):
        chorus = b >= 4
        drums_bar(S, b, 'chorus' if chorus else 'groove', 1.0 if chorus else .92, crash_=b in (0, 4), stop=12 if b == 7 else 16)
        bass_bar(S, b, B_DRIVE if not chorus else B_CHORUS, 1.0)
        gtr_bar(S, b, G_DRIVE if not chorus else G_CHORUS, .85)
        ep_bar(S, b, [(0, .9, 1), (1.5, .4, .7), (2, .9, .9), (3.5, .4, .8)], .75, 65)
        pad_bar(S, b, .45 if not chorus else .6)
        arp_bar(S, b, .045, 2200, 2600, center=72)
        mel = [H1, H2, H3, H4, H1, H2, H3, H4b][b]
        lead += notes_at(S, b, mel, 1.0)
        if chorus:   # brass tutti doubles the lead an octave down
            for s, d, m in mel: place('brass', brass(m - 12, d * bt * .95, .8, .9), T(S, b, s), .17, .15)
    # brass answers where the lead holds
    for b, s, top in [(0, 3, 79), (0, 3.5, 81), (2, 3.5, 79), (4, 3, 79), (4, 3.5, 81), (6, 3.5, 82)]:
        stab(S, b, s, bt * .4, top, 1.3, 1.0)
    # swerve: brass hit + tom
    tsw = HIT['swerve']
    for m in harm(84, 'C', 'm9', 4): place('brass', brass(m, bt * .5, .95, 1.1, .005), tsw, .17, rng.uniform(-.4, .4))
    place('drums', tom(100), tsw, .3, -.3); place('drums', tom(80), tsw + bt / 2, .3, .3)
    place('fx', boom(.8), T(S, 4), .28)
    # bar 7 end: fill into BILL
    for i, s in enumerate(range(12, 16)): place('drums', tom((180, 150, 120, 95)[i]), T(S, 7, s / 4), .26, .4 - .25 * i)
    S_(T(S, 7, 3.75), .4)
    lead_line(lead, 1.0, .3)


def sec_bill():
    S = 'BILL'; bt = BT(S)
    # bars 0-1: action with brass stabs
    for b in (0, 1):
        stop = 8 if b == 1 else 16
        drums_bar(S, b, 'groove', 1.0, crash_=b == 0, stop=stop)
        bass_bar(S, b, B_DRIVE, 1.0, stop=stop)
        gtr_bar(S, b, G_CHORUS, .85, stop=stop)
        pad_bar(S, b, .55)
        arp_bar(S, b, .05, 2400, 3200, center=72)
    for b, s, d, top, dy in [(0, 0, .5, 82, 1.4), (0, 1.5, .25, 82, 1.0), (0, 2, .9, 86, 1.7), (0, 3.5, .3, 84, 1.2),
                             (1, 0, .5, 82, 1.4), (1, .75, .25, 82, 1.0), (1, 1.5, .25, 84, 1.1)]:
        stab(S, b, s, d * bt, top, dy, 1.1)
    place('fx', boom(.8), T(S, 0, 2), .25); place('drums', crash(.8, 1.6), T(S, 0, 2), .18)   # tear
    # gasp: groove stops, swelling brass + toms toward the lunge
    tg = T(S, 1, 2)
    for m in harm(84, 'F', '7sus4', 4): place('brass', brass(m, bt * 1.9, .85, .8, .5), tg, .15, rng.uniform(-.4, .4))
    for s in (8, 10, 12, 13, 14, 15): place('drums', tom((90, 100, 115, 120, 135, 140)[[8, 10, 12, 13, 14, 15].index(s)]), T(S, 1, s / 4), .24)
    for k in range(8): place('bass', bass(29, bt / 2 * .6, .75, 'T'), T(S, 1, 2 + k * .5), .3)
    place('fx', riser(T(S, 2, 1) - tg, 1.0, 300, 9000), tg, .16)
    # lunge: one beat of snare 16ths ... then one beat of true silence (window) ... impact
    for s in range(4): S_(T(S, 2, s / 4), .25 + .1 * s)
    K_(T(S, 2), .55)
    stab(S, 2, 0, bt * .2, 84, 1.3, 1.0, jitter=False); stab(S, 2, .5, bt * .2, 86, 1.4, 1.1, jitter=False)
    ti = HIT['impact']; key('impact', ti)
    place('fx', boom(1.3), ti, .42); place('drums', crash(1.3, 3.5), ti, .34); K_(ti, .7); S_(ti, .5)
    place('drums', tom(60, 1.2), ti, .35)
    hold = HIT['setDown'] - ti
    for m in harm(87, 'Bb', '11', 5): place('brass', brass(m, hold * .97, .98, 1.3, .005), ti, .2, rng.uniform(-.45, .45))
    for i, m in enumerate(voicing('Bb', '11', 62)): place('pad', pad(m, hold, .55, .05), ti, .24, (-.6, .6)[i % 2])
    place('bass', bass(22, hold * .9, .95, 'F'), ti, .4); place('bass', bass(34, .3, .9, 'T'), ti, .3)
    # catch: the held chord gets a glint, strings an octave up, a timpani-like tom
    tc = HIT['catch']; key('catch', tc)
    place('fx', bell(96, 3.0, .5), tc, .07, .4); place('fx', bell(101, 3.0, .4), tc + .05, .05, -.4)
    for i, m in enumerate(voicing('Bb', '11', 76, nmax=4)): place('pad', pad(m, HIT['setDown'] - tc, .5, .4), tc, .18, (-.7, .7)[i % 2])
    place('drums', tom(70, .9), tc, .26)
    rev_crash(HIT['setDown'], 1.2, .1)
    # setDown: release stab, groove resumes from bar 4 beat 2
    tsd = HIT['setDown']; key('setDown', tsd)
    for m in harm(86, 'Eb', 'M9', 4): place('brass', brass(m, bt * .7, .9, 1.0, .006), tsd, .19, rng.uniform(-.4, .4))
    K_(tsd, .55); place('bass', bass(27, bt * .7, .85, 'T'), tsd, .36)
    for b, st in ((4, 8), (5, 0)):
        drums_bar(S, b, 'groove', .95, start=st, stop=12 if b == 5 else 16)
        bass_bar(S, b, B_VERSE, .95, start=st)
        gtr_bar(S, b, G_VERSE, .8, start=st)
        ep_bar(S, b, [x for x in [(0, 1.0, 1.0), (1.5, .4, .7), (2.5, .9, .9), (3.5, .4, .75)] if x[0] * 4 >= st], .9)
    pad_bar(S, 5, .5)
    stab(S, 5, 2.5, bt * .4, 81, 1.2); stab(S, 5, 3.5, bt * .3, 81, 1.3)
    drums_bar(S, 5, 'tomfill', .6, start=12)


def sec_drone():
    S = 'DRONE'; bt = BT(S); lead = []
    # siren synth at siren, lock-on variant at lock
    tsi = HIT['siren']; key('siren', tsi)
    place('fx', siren(4 * bt, 79, 84, 2 * bt, .5), tsi, .07, .3, send=.3)
    tl = T(S, 1); key('lock', tl)
    place('fx', siren(4 * bt, 84, 88, bt / 2, .5, rise=3), tl, .06, -.3, send=.3)
    for m in harm(85, 'Eb', '7', 4): place('brass', brass(m, .16, .9, .9, .004), tl, .17, rng.uniform(-.4, .4))
    K_(tl, .5)
    # comic suspense bars 0-2: low pizzicato walking line + staccato stabs + tiptoe drums
    pizz = {0: [43, 43, 46, 47, 48, 49, 50, 50], 1: [39, 39, 43, 44, 45, 46, 47, 46],
            2: [43, 43, 46, 47, 48, 49, 50, 51]}
    for b, line in pizz.items():
        for k, m in enumerate(line):
            place('bass', pluck(m, bt / 2 * .5, .9, 1100, 1.3, .05), T(S, b, k * .5), .42, 0, send=.05)
        drums_bar(S, b, 'comic', .9)
        for s in (.5, 1.5, 2.5, 3.5):
            if b == 1 and s == .5: continue
            r, q = chord_at(S, b, s); top = max(voicing(r, q, 74, nmax=4))
            stab(S, b, s, .09, top, .9, .55, att=.004, vel=.7)
        pad_bar(S, b, .35, center=58, att=.8)
    # smack2: comic stop (falling brass "bwomp")
    tsm = T(S, 3); key('smack2', tsm)
    for m in (70, 63, 58): place('brass', glide(m, m - 9, .45, .6, 1600, 2.2, .005, .06), tsm, .2, rng.uniform(-.3, .3))
    K_(tsm, .6); S_(tsm, .42); place('drums', crash(.6, .6), tsm, .16)
    # showBox: two little plinks, then scan suspense
    for k, m in enumerate((79, 84)): place('keys', pluck(m, .12, .7, 3000, 1.4, .05), HIT['showBox'] + k * bt / 2, .12, .3)
    for s in range(16):
        place('drums', hat(jv(1)), T(S, 4, s / 4), .05 * (.5 + .5 * (s % 2 == 0)), .3)
    for k, m in enumerate([50, 50, 51, 51]):
        place('bass', pluck(m, bt / 2 * .5, .8, 900, 1.3, .05), T(S, 4, k * .5), .4)
    for i, m in enumerate(voicing('D', '7b9', 62)): place('pad', pad(m, 2.3 * bt, .5, .3), T(S, 4), .17, (-.6, .6)[i % 2])
    # ident: "ta-da" flourish landing exactly on HIT.ident
    tid = HIT['ident']; key('ident', tid)
    for k, m in enumerate((74, 77, 79)):
        place('brass', brass(m, .07, .85, 1.0, .004), tid - .21 + k * .07, .2, (-.3, 0, .3)[k])
    place('brass', brass(81, .09, .85, 1.0, .004), tid - .11, .14)
    for m in harm(86, 'Bb', 'M9', 5): place('brass', brass(m, bt * 2.2, 1.0, 1.25, .006), tid, .21, rng.uniform(-.45, .45))
    place('drums', crash(1.0, 3.0), tid, .26); K_(tid, .55); S_(tid, .4); place('fx', boom(.8), tid, .26)
    for k, m in enumerate((94, 98, 101, 106)): place('fx', bell(m, 2.5, .4), tid + .05 + k * .09, .05, (-.5, .5)[k % 2])
    place('bass', bass(34, bt * 2.5, .9, 'F'), tid, .35)
    for i, m in enumerate(voicing('Bb', 'M9', 63)): place('pad', pad(m, (T(S, 6) - tid), .5, .3), tid, .2, (-.6, .6)[i % 2])
    ep_bar(S, 5, [(0, 1.9, .8), (2, 1.9, .7)], .85)
    # fill into green (bar 6 beat 1)
    for i, s in enumerate(range(8, 20)):
        b, ss = divmod(s, 16); b += 5
        if s < 16: place('drums', tom((210, 200, 180, 170, 150, 140, 125, 118)[i % 8] if i < 8 else 100, .7 + .03 * i), T(S, b, ss / 4), .22, .5 - .1 * i)
        else: S_(T(S, 6, (s - 16) / 4), .25 + .08 * (s - 16))
    place('fx', riser(T(S, 6, 1) - T(S, 5, 2), .9), T(S, 5, 2), .12)
    # green: full groove for the escort
    tgr = T(S, 6, 1); key('green', tgr)
    place('drums', crash(1.0, 2.6), tgr, .26); K_(tgr, .55)
    for b in (6, 7):
        st = 4 if b == 6 else 0
        drums_bar(S, b, 'chorus', 1.0, start=st, stop=12 if b == 7 else 16)
        bass_bar(S, b, B_CHORUS, 1.0, start=st)
        gtr_bar(S, b, G_CHORUS, .9, start=st)
        ep_bar(S, b, [x for x in [(0, .9, 1), (1.5, .4, .7), (2, .9, .9), (3.5, .4, .8)] if x[0] * 4 >= st], .8, 65)
        arp_bar(S, b, .045, 2400, 2800, center=72, start=st)
    pad_bar(S, 6, .6); pad_bar(S, 7, .6)
    stab(S, 6, 1, bt * .8, 86, 1.6, 1.2, vel=1.0, t=tgr, jitter=False)
    lead += notes_at(S, 6, H1, 1.0, beat_min=1)
    lead += notes_at(S, 7, H2, 1.0)
    for s, d, m in H2: place('brass', brass(m - 12, d * bt * .95, .8, .9), T(S, 7, s), .15, .15)
    # bar 7: last beat, fill dropping into the half-time climb
    for i, s in enumerate(range(12, 16)): place('drums', tom((160, 130, 105, 85)[i]), T(S, 7, s / 4), .26, .4 - .25 * i)
    lead_line(lead, 1.0, .28)


def sec_climb():
    S = 'CLIMB'; bt = BT(S)
    tgu = HIT['gust']; tsl = HIT['slip']; tlv = HIT['level']; tar = HIT['arrive']
    # bars 0-2.1: half-time build
    for b in (0, 1, 2):
        stop = 2 if b == 2 else 16
        drums_bar(S, b, 'half', .85 + .08 * b, crash_=b == 0, stop=stop)
        arp_bar(S, b, .07 + .02 * b, 700 + 700 * b, 1300 + 700 * b, center=65, stop=stop)
        for k in range(8 if b < 2 else 1):
            r, q = chord_at(S, b, k * .5)
            place('bass', bass(bass_root(r), bt / 2 * .8, .6, 'D' if k % 2 else 'T'), T(S, b, k * .5), .3)
        if b < 2:
            pad_bar(S, b, .6 + .25 * b, att=.8)
            for s, f in ((0, 70), (3, 85), (3.5, 95)): place('drums', tom(f, .9), T(S, b, s), .22, (-.3, .3)[int(s) % 2])
    for i, m in enumerate(voicing('Bb', 'm9', 62)): place('pad', pad(m, tgu - T(S, 2) + .05, .55, .3), T(S, 2), .22, (-.6, .6)[i % 2])
    for m in harm(84, 'Bb', 'm9', 4): place('brass', brass(m, tgu - T(S, 2) - .03, .75, .7, .2), T(S, 2), .12, rng.uniform(-.4, .4))
    # gust: everything drops, a falling whoosh; slip: a dive + low boom
    key('gust', tgu)
    place('fx', riser(1.2, 1.0, 200, 8000)[::-1].copy(), tgu, .16, 0, send=.3)
    for m in harm(85, 'Bb', 'm9', 3): place('brass', brass(m, .1, .8, .8, .003), tgu, .14, rng.uniform(-.3, .3))
    key('slip', tsl)
    place('fx', glide(84, 46, .75, .55, 1800, .6), tsl, .1, 0)
    place('fx', boom(1.0), tsl, .34); place('drums', tom(55, 1.0), tsl, .3)
    # level: tension again
    key('level', tlv)
    for i, m in enumerate(voicing('Bb', 'm9', 58)): place('pad', pad(m, T(S, 3) - tlv + .2, .45, .6), tlv, .2, (-.6, .6)[i % 2])
    for s in (2.5, 3.0, 3.5): K_(T(S, 2, s), .4)
    for b in (3, 4):
        stop = 6 if b == 4 else 16                # up to arrive (bar 4 beat 1.6)
        arp_bar(S, b, .09 + .03 * (b - 3), 1800 + 1200 * (b - 3), 3000 + 1200 * (b - 3), center=67, stop=stop)
        if b == 3:
            pad_bar(S, 3, .9, att=.5)
            drums_bar(S, 3, 'half', 1.0)
            for s in range(8, 16, 2): place('drums', tom((95, 105, 120, 135)[(s - 8) // 2]), T(S, 3, s / 4), .22)
        else:
            for i, m in enumerate(voicing('C', '7sus4', 64)): place('pad', pad(m, tar - T(S, 4), .55, .2), T(S, 4), .24, (-.6, .6)[i % 2])
            for s in range(6): S_(T(S, 4, s / 4), .2 + .06 * s)
            for s in range(0, 6, 2): place('drums', tom((140, 120, 100)[s // 2]), T(S, 4, s / 4), .2)
        for k in range(8 if b == 3 else 3):
            r, q = chord_at(S, b, k * .5)
            place('bass', bass(bass_root(r), bt / 2 * .8, .65, 'D' if k % 2 else 'T'), T(S, b, k * .5), .3)
    place('fx', riser(tar - T(S, 3), 1.0, 300, 9000), T(S, 3), .14)
    # arrive: broad swell on DbM9, held into the hush
    key('arrive', tar)
    hold = SECS['CLIMB']['t1'] - tar
    place('drums', crash(.9, 3.0), tar, .24); K_(tar, .5); place('fx', boom(.9), tar, .3)
    for m in harm(84, 'Db', 'M9', 5): place('brass', brass(m, hold * .7, .8, .7, .08), tar, .16, rng.uniform(-.45, .45))
    for i, m in enumerate(voicing('Db', 'M9', 63)): place('pad', pad(m, hold, .55, .1), tar, .22, (-.6, .6)[i % 2])
    for i, m in enumerate(voicing('Db', 'M9', 66)): place('keys', epiano(m, hold, .6), tar + i * .01, .24, -.35 + .18 * i)
    place('bass', bass(25, hold * .8, .8, 'F'), tar, .34)
    place('fx', bell(96, 3.0, .4), tar + .05, .05, .4)


def sec_window():
    S = 'WINDOW'; bt = BT(S)
    # bars 0-3: sparse e-piano single notes and a soft pad
    notes = [(0, 0, 2, 79), (0, 2, 2, 75), (1, 0, 1.5, 80), (2, 0, 2, 77), (2, 2, 2, 82)]
    for b, s, d, m in notes:
        place('keys', epiano(m, d * bt, .5), T(S, b, s), .28, .15)
        place('keys', epiano(m - 12, d * bt, .3), T(S, b, s) + .01, .12, -.15)
    for b in (0, 1, 2):
        pad_bar(S, b, .55, center=60, att=1.2, gain=.2)
    place('bass', bass(29, 3.8 * bt, .4, 'F'), T(S, 0), .22)
    place('bass', bass(25, 3.8 * bt, .4, 'F'), T(S, 1), .22)
    place('bass', bass(34, 1.9 * bt, .4, 'F'), T(S, 2), .22); place('bass', bass(27, 1.9 * bt, .4, 'F'), T(S, 2, 2), .22)
    # silence window: nothing (place() cuts everything at HIT.silence, reverbs are split there)
    key('silence', HIT['silence'])
    # chord: one warm, soft chord
    tch = HIT['chord']; key('chord', tch)
    for i, m in enumerate(voicing('Db', 'M9', 64)): place('keys', epiano(m, bt * 1.0, .5), tch + i * .03, .3, -.35 + .18 * i)
    for i, m in enumerate(voicing('Db', 'M9', 62)): place('pad', pad(m, bt * 1.0, .5, .35), tch, .2, (-.6, .6)[i % 2])
    place('bass', bass(25, bt * .95, .5, 'F'), tch, .24)
    # Grandma's theme, slowed and tender (Ab: -2 from Bb)
    for s, d, m in tr(H1, -2):
        place('keys', epiano(m, d * bt, .55), T(S, 4, s), .3, .15)
        place('fx', bell(m + 12, 2.5, .25), T(S, 4, s), .03, .3)
    for s, d, r, q in CH[S][4]:
        for i, m in enumerate(voicing(r, q, 60)):
            place('keys', epiano(m, d * bt, .35), T(S, 4, s) + i * .02, .2, -.3 + .15 * i)
        for i, m in enumerate(voicing(r, q, 62)): place('pad', pad(m, d * bt, .5, .5), T(S, 4, s), .17, (-.6, .6)[i % 2])
        place('bass', bass(bass_root(r), d * bt * .9, .45, 'F'), T(S, 4, s), .22)
    rev_crash(SECS['DAWN']['t0'], 1.5, .1)


def sec_dawn():
    S = 'DAWN'; bt = BT(S); lead = []
    mel = {0: tr(H1, -2), 1: tr(H2, -2), 2: tr(H3, -2),
           3: [(0, 1, 82), (1, .5, 80), (1.5, .5, 77), (2, .5, 75), (2.5, .5, 77), (3, .5, 76), (3.5, .5, 78)],
           4: tr(H1, -1), 5: tr(H2, -1), 6: tr(H4b, -1)}
    for b in range(7):
        lifted = b >= 4
        drums_bar(S, b, 'chorus', .88 if not lifted else 1.0, crash_=b in (0, 4), stop=12 if b in (3, 6) else 16)
        bass_bar(S, b, B_CHORUS, 1.0)
        gtr_bar(S, b, G_CHORUS if lifted else G_VERSE, .85)
        ep_bar(S, b, [(0, 1.4, 1), (1.5, .45, .7), (2, 1.4, .9), (3.5, .45, .8)], .9, 65)
        pad_bar(S, b, .65 if not lifted else .8)
        lead += notes_at(S, b, mel[b], .95)
        if lifted:
            for s, d, r, q in CH[S][b]:
                for i, m in enumerate(voicing(r, q, 76, nmax=4)): place('pad', pad(m, d * bt, .55), T(S, b, s), .17, (-.7, .7)[i % 2])
            for s, d, m in mel[b]: place('brass', brass(m - 12, d * bt * .95, .75, .8), T(S, b, s), .15, -.15)
    for b in (3, 6):
        drums_bar(S, b, 'tomfill', .8, start=12)
    for b, s, top in [(0, 3, 77), (1, 3.5, 79), (2, 3.5, 79), (5, 3.5, 80)]:
        stab(S, b, s, bt * .4, top, 1.1, .9)
    # dawn downbeat sparkle
    for k, m in enumerate((92, 96, 99, 104)): place('fx', bell(m, 3.0, .35), T(S, 0) + k * bt / 2, .05, (-.4, .4)[k % 2])
    # lift2: semitone lift (Ab -> A)
    tl = T(S, 4); key('lift2', tl)
    place('fx', boom(1.0), tl, .3)
    for m in harm(85, 'D', 'M9', 4): place('brass', brass(m, bt * 1.2, .95, 1.15, .008), tl, .17, rng.uniform(-.4, .4))
    rev_crash(tl, 1.0, .1)
    # shutter: soft accent
    tsh = HIT['shutter']; key('shutter', tsh)
    place('drums', clap(1.0), tsh, .16, .2); place('drums', hat(1.0, True), tsh, .07, .3)
    place('fx', bell(100, 1.6, .35), tsh, .045, .5)
    # match: sweet bell figure (A major sparkle)
    tm = T(S, 5, 1); key('match', tm)
    for k, m in enumerate((88, 92, 93, 97, 100, 97)):
        place('fx', bell(m, 3.0, .42 - .03 * k), tm + k * bt / 2, .075, (-.45, .45)[k % 2])
    lead_line(lead, .55, .3, breath=.06)
    return lead


def sec_end():
    S = 'END'; bt = BT(S)
    te = T(S, 0); key('end', te)
    ring = DUR - te
    place('drums', crash(1.2, ring), te, .36); K_(te, .65); S_(te, .45); place('fx', boom(1.1), te, .34)
    for m in harm(88, 'A', 'M9', 5): place('brass', brass(m, bt * 1.6, .98, 1.2, .008), te, .21, rng.uniform(-.45, .45))
    for i, m in enumerate(voicing('A', 'M9', 62)): place('pad', pad(m, ring - .9, .55, .1), te, .2, (-.6, .6)[i % 2])
    for i, m in enumerate(voicing('A', 'M9', 65)): place('keys', epiano(m, ring, .7), te + i * .012, .28, -.35 + .18 * i)
    place('bass', bass(33, ring * .7, .9, 'T'), te, .38); place('bass', bass(45, .12, .7, 'P'), T(S, 0, .5), .34)
    place('fx', bell(93, 4.0, .6), te, .09, .35); place('fx', bell(100, 4.0, .5), te + .03, .07, -.35)
    for k, m in enumerate([88, 92, 95, 97, 100, 104]):
        place('fx', bell(m, 3.5, .42 - .03 * k), T(S, 0, 1 + k * .5), .065, (-.5, .5)[k % 2])
    lead_line([(te, bt * 3.0, 81, .9)], .55, .28, breath=.06)


def build():
    sec_open(); sec_home(); sec_garage(); sec_drive(); sec_bill(); sec_drone(); sec_climb(); sec_window(); sec_dawn(); sec_end()


# ───────────────────────── effects and mastering ─────────────────────────
def chorus_fx(x, base=.009, depth=.0028, rates=(.73, 1.11), mix=.55):
    n = len(x); ar = np.arange(n); t = ar / SR; mono = x.mean(1); out = x.copy()
    for c in range(2):
        d = (base + depth * np.sin(2 * np.pi * rates[c] * t + c * 1.7)) * SR
        out[:, c] = x[:, c] * (1 - mix * .4) + np.interp(ar - d, ar, mono) * mix
    return out


def pingpong(mono, dt, fb=.36, taps=5, lpf=4200):
    n = len(mono); out = np.zeros((n, 2)); y = mono.copy()
    for k in range(1, taps + 1):
        y = lp(y, lpf, 1); sh = int(k * dt * SR); g = fb ** k
        if sh < n: out[sh:, k % 2] += y[:n - sh] * g
    return out


def segments():
    """Spans of music between the silence windows; effect tails never cross into (or out of) a window"""
    edges = [0]
    for w0, w1 in sorted(WIN): edges += [int(round(w0 * SR)), int(round(w1 * SR))]
    edges.append(N)
    return [(edges[i], edges[i + 1]) for i in range(0, len(edges), 2)]


def seg_fx(x, fx):
    out = np.zeros((N, 2))
    for a, b in segments():
        if b > a: out[a:b] = fx(x[a:b])[:b - a]
    return out


def hall(x): return np.stack([fftconvolve(x, IR_HALL[:, c])[:len(x)] for c in range(2)], 1)


def main():
    t0 = time.time()
    build(); print('build', round(time.time() - t0, 1), 's')
    t = ts(N); trem = .22 * np.sin(2 * np.pi * 3.4 * t)
    BUS['keys'][:, 0] *= 1 - trem; BUS['keys'][:, 1] *= 1 + trem
    BUS['keys'] = chorus_fx(BUS['keys'], .007, .0018, (.5, .63), .35)
    BUS['guitar'] = chorus_fx(hp(BUS['guitar'], 180), .010, .0032, (.8, 1.13), .6)
    BUS['pad'] = chorus_fx(BUS['pad'], .012, .004, (.25, .33), .5)
    pump = np.ones(N)
    for k in KICKS:
        s = int(k * SR); e = min(N, s + int(.3 * SR))
        if e > s: pump[s:e] = np.minimum(pump[s:e], 1 - .28 * np.exp(-ts(e - s) / .09))
    BUS['pad'] *= pump[:, None]; BUS['keys'] *= (1 - (1 - pump) * .5)[:, None]
    BUS['bass'] = hp(BUS['bass'], 32, 2)
    BUS['lead'] += seg_fx(BUS['lead'].mean(1), lambda x: pingpong(x, .36, .34, 5)) * .3
    send = sum(SEND.values())
    BUS['fx'] += hp(seg_fx(send, hall), 200) * .42
    fade = np.ones(N); fe = int(1.2 * SR); fade[-fe:] = np.linspace(1, 0, fe) ** 1.5
    BUS['drums'] *= .85
    mix = sum(BUS.values()) * fade[:, None]; mix = hp(mix, 28, 2)
    # glue compression + light saturation + look-ahead limiting (as in the demo master)
    pre = 1.0 / np.abs(mix).max(); mix *= pre
    det = uniform_filter1d(np.abs(mix).max(1), int(.005 * SR))
    g = np.ones(N); lv = env_follow(det, .012, .2); thr = .45
    over = lv > thr; g[over] = (thr * (lv[over] / thr) ** (1 / 2.0)) / lv[over]
    mix *= g[:, None]; mix /= np.abs(mix).max()
    mix = np.tanh(mix * 1.25) / np.tanh(1.25)
    ceil = 10 ** (-1.2 / 20); look = int(.004 * SR); tg = 1.3
    raw = np.minimum(1, ceil / np.maximum(np.abs(mix * tg).max(1), 1e-9))
    gl = uniform_filter1d(minimum_filter1d(raw, 2 * look + 1), look)
    mix = np.clip(mix * tg * gl[:, None], -ceil, ceil)
    # silence windows: 10 ms fade out, digital zero inside
    mask = np.ones(N); fl = int(.01 * SR)
    for w0, w1 in WIN:
        a, b = int(round(w0 * SR)), int(round(w1 * SR))
        mask[a - fl:a] = np.minimum(mask[a - fl:a], np.linspace(1, 0, fl)); mask[a:b] = 0
    mix *= mask[:, None]
    # level: RMS -20 dBFS (over the sounding part), peak <= 0.95
    live = np.abs(mix).max(1) > 1e-4
    rms = np.sqrt((mix[live] ** 2).mean()); gain = 10 ** (-20 / 20) / rms
    gain = min(gain, .95 / np.abs(mix).max()); mix *= gain
    mix = mix[:N] if len(mix) >= N else np.pad(mix, ((0, N - len(mix)), (0, 0)))
    sf.write(os.path.join(HERE, 'score.wav'), mix.astype(np.float32), SR, subtype='FLOAT')
    keys = {k: round(v, 4) for k, v in sorted(KEYS.items(), key=lambda kv: kv[1])}
    json.dump({'keys': keys, 'dur': DUR, 'silence_windows': [[round(a, 4), round(b, 4)] for a, b in WIN],
               'sections': {s: dict(t0=round(SECS[s]['t0'], 4), bpm=SECS[s]['bpm']) for s in ORDER}},
              open(os.path.join(HERE, 'score.json'), 'w'), indent=1, ensure_ascii=False)
    # report
    full_rms = 20 * np.log10(np.sqrt((mix ** 2).mean()))
    print('done', round(time.time() - t0, 1), 's  samples', len(mix), '/', N,
          ' peak', round(float(np.abs(mix).max()), 3), ' RMS(full) %.1f dBFS' % full_rms,
          ' RMS(live) %.1f dBFS' % (20 * np.log10(np.sqrt((mix[live] ** 2).mean()))))
    a, b = int(round(HIT['silence'] * SR)), int(round(HIT['chord'] * SR))
    print('silence window max', float(np.abs(mix[a:b]).max()))
    worst = max(abs(v - HIT[k]) for k, v in KEYS.items())
    print('keys', len(KEYS), 'max |key-HIT| = %.6f s' % worst)


if __name__ == '__main__':
    main()
