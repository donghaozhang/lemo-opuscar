"""Instrument synthesis, adapted from the scifi-toon library demo (technique only): theremin, analog bass, square pluck, pads, Rhodes, vibes, Karplus-Strong, brass, tremolo strings, drum machine."""
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve, lfilter
SR = 48000
rng = np.random.default_rng(11)
def tt(d): return np.arange(int(round(d * SR))) / SR
def mf(m): return 440 * 2 ** ((m - 69) / 12)
NOTE = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}
def M(s):   # 'D5' → 74
    n, o = (s[:2], s[2:]) if len(s) > 2 and s[1] in '#b' else (s[:1], s[1:]); return 12 * (int(o) + 1) + NOTE[n]
def lp(x, f, o=2): return sosfilt(butter(o, min(f, SR * .45), 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, a, b, o=2): return sosfilt(butter(o, [a, b], 'band', fs=SR, output='sos'), x)
def adsr(n, a=.005, d=.1, s=.6, r=.1, hold=None):
    e = np.zeros(n); A, D, R = int(a * SR), int(d * SR), int(r * SR); H = n - R if hold is None else int(hold * SR)
    H = max(H, 1); i = np.arange(n)
    e = np.where(i < A, i / max(A, 1), np.where(i < A + D, 1 - (1 - s) * (i - A) / max(D, 1), s))
    rel = np.clip(1 - (i - H) / max(R, 1), 0, 1); e = np.where(i >= H, e[min(H, n - 1)] * rel, e)
    return e
def saw(ph): return 2 * (ph % 1) - 1
def sq(ph, w=.5): return np.where(ph % 1 < w, 1., -1.)
def tri(ph): return 2 * np.abs(2 * (ph % 1) - 1) - 1

def theremin(notes, glide=.07, vib=.32, rate=5.7, bright=.14, v=1.):
    """notes: [(t, dur, midi)] played legato; returns (start, signal)"""
    t0 = notes[0][0]; t1 = max(t + d for t, d, _ in notes) + .25; n = int((t1 - t0) * SR)
    target = np.full(n, float(notes[0][2])); amp = np.zeros(n)
    for t, d, m in notes:
        a, b = int((t - t0) * SR), int((t + d - t0) * SR); target[a:] = m
        env = adsr(b - a + int(.12 * SR), .035, .08, .85, .12, hold=d); amp[a:a + len(env)] = np.maximum(amp[a:a + len(env)], env[:n - a])
    k = 1 - np.exp(-1 / (glide * SR))

    mid = lfilter([k], [1, -(1 - k)], target, zi=[target[0] * (1 - k)])[0]
    # vibrato fades in 150 ms after each note starts
    vib_env = np.zeros(n)
    for t, d, m in notes:
        a = int((t - t0) * SR); L = int((d + .12) * SR); w = np.clip((np.arange(L) / SR - .15) / .25, 0, 1); vib_env[a:a + L] = np.maximum(vib_env[a:a + L], w[:n - a])
    ph_v = np.arange(n) / SR * rate * 2 * np.pi
    f = mf(mid + vib * vib_env * np.sin(ph_v)); ph = np.cumsum(f) / SR
    x = np.sin(2 * np.pi * ph) + bright * np.sin(4 * np.pi * ph) + .05 * np.sin(6 * np.pi * ph)
    return t0, lp(x * amp, 5000) * v
def bass(t, d, m, v=1., cut=900):
    n = int((d + .06) * SR); ph = np.cumsum(np.full(n, mf(m))) / SR
    x = .7 * saw(ph) + .6 * np.sin(2 * np.pi * ph * .5 * 2) ; e = adsr(n, .004, .15, .55, .05, hold=d)
    fe = cut * (.35 + .65 * np.exp(-np.arange(n) / SR / .12))
    y = np.zeros(n); seg = 256
    for i in range(0, n, seg): y[i:i + seg] = lp(x[max(0, i - 2048):i + seg], fe[i])[-len(x[i:i + seg]):]
    return y * e * v
def pluck(t, d, m, v=1., w=.3, cut=3200):
    n = int((d + .15) * SR); ph = np.cumsum(np.full(n, mf(m))) / SR
    return lp(sq(ph, w) * adsr(n, .002, .09, .25, .1, hold=d), cut) * v
def pad(d, ms, v=1., cut=1600, att=.3):
    n = int((d + .6) * SR); x = np.zeros(n)
    for m in ms:
        for dt in (-.08, 0, .09):
            ph = np.cumsum(np.full(n, mf(m + dt))) / SR + rng.random(); x += saw(ph)
    return lp(x / len(ms) / 3, cut, 2) * adsr(n, att, .3, .8, .5, hold=d) * v
def rhodes(d, m, v=1.):
    n = int((d + .8) * SR); tn = np.arange(n) / SR; f = mf(m)
    x = np.sin(2 * np.pi * f * tn) * np.exp(-tn / 1.6) + .35 * np.sin(2 * np.pi * f * 2 * tn) * np.exp(-tn / .35) + .12 * np.sin(2 * np.pi * f * 7.1 * tn) * np.exp(-tn / .04)
    return x * (1 + .15 * np.sin(2 * np.pi * 4.5 * tn)) * adsr(n, .003, .2, 1, .3, hold=d) * v
def vibes(d, m, v=1.):
    n = int(1.6 * SR); tn = np.arange(n) / SR; f = mf(m)
    x = np.sin(2 * np.pi * f * tn) * np.exp(-tn / .9) + .3 * np.sin(2 * np.pi * f * 4 * tn) * np.exp(-tn / .2) + .1 * np.sin(2 * np.pi * f * 10 * tn) * np.exp(-tn / .05)
    return x * (1 + .35 * np.sin(2 * np.pi * 5.5 * tn)) * v
def xylo(m, v=1.):
    n = int(.5 * SR); tn = np.arange(n) / SR; f = mf(m)
    return (np.sin(2 * np.pi * f * tn) * np.exp(-tn / .18) + .4 * np.sin(2 * np.pi * f * 3.93 * tn) * np.exp(-tn / .05) + .2 * hp(rng.standard_normal(n), 3000) * np.exp(-tn / .004)) * v
def ks(m, d=1.2, v=1., bright=.5):   # Karplus-Strong nylon string
    n = int(d * SR); f = mf(m); L = int(SR / f); buf = lp(rng.standard_normal(L), 2000 + 4000 * bright); out = np.zeros(n)
    for i in range(n): out[i] = buf[i % L]; buf[i % L] = .5 * (buf[i % L] + buf[(i + 1) % L]) * .996
    return out * v
def tuba(t, d, m, v=1.):
    n = int((d + .08) * SR); tn = np.arange(n) / SR; f = mf(m) * (1 - .06 * np.exp(-tn / .03))
    ph = np.cumsum(f) / SR; x = saw(ph) + .5 * np.sin(2 * np.pi * ph)
    return lp(x, 700) * adsr(n, .02, .1, .7, .06, hold=d) * v
def wobble_lead(notes, v=1.):   # jelly wobble lead: wide, fast vibrato
    return theremin(notes, glide=.04, vib=.7, rate=7.5, bright=.35, v=v)
def brass(d, ms, v=1.):
    n = int((d + .2) * SR); x = np.zeros(n)
    for m in ms:
        for dt in (-.1, .1): ph = np.cumsum(np.full(n, mf(m + dt))) / SR + rng.random(); x += saw(ph)
    e = adsr(n, .01, .15, .5, .15, hold=d); fe = 400 + 3200 * np.exp(-np.arange(n) / SR / .15)
    y = np.zeros(n)
    for i in range(0, n, 256): y[i:i + 256] = lp(x[max(0, i - 2048):i + 256], fe[i])[-len(x[i:i + 256]):]
    return y * e * v / len(ms)
def strings_trem(d, ms, v=1., rise=0):
    n = int(d * SR); x = np.zeros(n); tn = np.arange(n) / SR
    for m in ms:
        for dt in (-.12, 0, .12): ph = np.cumsum(mf(m + dt + rise * tn / d)) / SR + rng.random(); x += saw(ph)
    return lp(x, 2600) * (.55 + .45 * np.sin(2 * np.pi * 13 * tn)) * adsr(n, .08, .1, 1, .02, hold=d - .02) * v / len(ms)
# Drums
def kick(v=1.):
    n = int(.4 * SR); tn = np.arange(n) / SR; f = 45 + 95 * np.exp(-tn / .04)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tn / .18) + .3 * hp(rng.standard_normal(n), 2000) * np.exp(-tn / .003)) * v
def snare(v=1.):
    n = int(.3 * SR); tn = np.arange(n) / SR
    return (bp(rng.standard_normal(n), 1200, 7000) * np.exp(-tn / .07) * .8 + np.sin(2 * np.pi * 190 * tn) * np.exp(-tn / .04) * .6) * v
def hat(v=1., open_=False):
    n = int((.25 if open_ else .06) * SR); tn = np.arange(n) / SR
    return lp(hp(rng.standard_normal(n), 6500), 12000) * np.exp(-tn / (.08 if open_ else .012)) * v
def clap(v=1.):
    n = int(.25 * SR); tn = np.arange(n) / SR; e = sum(np.exp(-np.maximum(tn - k * .011, 0) / .006) * (tn >= k * .011) for k in range(3)) + .5 * np.exp(-tn / .08)
    return bp(rng.standard_normal(n), 900, 5000) * e * v
def crash(v=1., d=2.2):
    n = int(d * SR); tn = np.arange(n) / SR
    x = lp(hp(rng.standard_normal(n), 3500), 11000) * np.exp(-tn / .7) + .25 * sum(np.sin(2 * np.pi * f * tn) for f in (2523, 3811, 5123, 6579)) / 4 * np.exp(-tn / .4)
    return hp(x, 2500) * v
def tom(m=45, v=1.):
    n = int(.5 * SR); tn = np.arange(n) / SR; f = mf(m) * (1 + .5 * np.exp(-tn / .05))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tn / .2) * v
def brush(v=1., d=.18):
    n = int(d * SR); tn = np.arange(n) / SR
    return bp(rng.standard_normal(n), 2500, 9000) * np.sin(np.pi * tn / d) ** 1.5 * v
def ride(v=1.):
    n = int(.9 * SR); tn = np.arange(n) / SR
    x = bp(rng.standard_normal(n), 3000, 9000) * np.exp(-tn / .3) * .8 + .12 * sum(np.sin(2 * np.pi * f * tn + 3 * np.sin(2 * np.pi * f * 1.41 * tn)) for f in (3150, 4870)) / 2 * np.exp(-tn / .25) + lp(hp(rng.standard_normal(n), 5000), 10000) * np.exp(-tn / .02) * .6
    return hp(x, 2500) * v
def rim(v=1.):
    n = int(.08 * SR); tn = np.arange(n) / SR
    return (np.sin(2 * np.pi * 1700 * tn) * np.exp(-tn / .012) + bp(rng.standard_normal(n), 2000, 6000) * np.exp(-tn / .004)) * v
def shaker(v=1.):
    n = int(.09 * SR); tn = np.arange(n) / SR
    return lp(hp(rng.standard_normal(n), 4500), 10000) * np.sin(np.pi * tn / .09) ** 2 * v
def noise_riser(d, v=1.):
    n = int(d * SR); x = rng.standard_normal(n); y = np.zeros(n)
    for i in range(0, n, 512):
        f = 300 * (8000 / 300) ** (i / n); y[i:i + 512] = bp(x[max(0, i - 4096):i + 512], f * .7, min(f * 1.4, 20000))[-len(x[i:i + 512]):]
    return y * (np.arange(n) / n) ** 2 * v
def rev_swell(d, ms, v=1.):
    x = pad(d, ms, 1, 3000, .02)[:int(d * SR)]; e = (np.arange(len(x)) / len(x)) ** 3; return x * e * v
