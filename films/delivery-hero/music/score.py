"""Original chip score for 《外卖勇者》: .venv/bin/python music/score.py
Reads ../timeline.json (sections, hits). Writes score.wav (48 kHz stereo) and score.json (accent times for the cue check).
Voices: pulse 12.5/25/50 %, 4-bit triangle bass, LFSR noise drums, a short synthesised kick/snare ('sampled-drum' channel), SNES-style echo.
Themes (all original): OVERWORLD (C major, 120) — phrase B ends on the dominant and is resolved only in the CODA;
BATTLE (D minor, 150) + its major, bouncy variant for the dog; BOSS (E phrygian, 160); TENDER (F major, 80) whose first three notes
appear once when the umbrella opens; LEVEL-UP fanfare (C major).
"""
import json, os, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__))
TL = json.load(open(os.path.join(HERE, '..', 'timeline.json')))
SR = 48000; DUR = TL['dur']; N = int(round((DUR + 2) * SR))
SEC = {s['id']: s for s in TL['sections']}
def sect_end(sid):
    ids = [s['id'] for s in TL['sections']]; i = ids.index(sid); return TL['sections'][i + 1]['t']

def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
def ns(d): return max(1, int(round(d * SR)))
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x, axis=-1)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x, axis=-1)
NOTE = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
def M(s):
    if isinstance(s, (int, float)): return s
    k = NOTE[s[0]]; i = 1
    while i < len(s) and s[i] in '#b': k += 1 if s[i] == '#' else -1; i += 1
    return k + 12 * (int(s[i:]) + 1)

# —— oscillators ——
def _blep(t, dt):
    y = np.zeros_like(t); m = t < dt; x = t[m] / dt[m]; y[m] = x + x - x * x - 1
    m = t > 1 - dt; x = (t[m] - 1) / dt[m]; y[m] = x * x + x + x + 1; return y
def phase(f, n, vib=0.0, vdel=.2):
    t = np.arange(n) / SR; fr = np.full(n, f, float)
    if vib: fr = fr * (1 + vib * np.sin(2 * np.pi * 5.5 * t) * np.clip((t - vdel) / .25, 0, 1))
    dt = fr / SR; return np.cumsum(dt) % 1.0, dt
def pulse(f, d, duty=.5, **kw):
    n = ns(d); ph, dt = phase(f, n, **kw); y = np.where(ph < duty, 1.0, -1.0)
    y += _blep(ph, dt) - _blep((ph - duty) % 1.0, dt); return y - (2 * duty - 1)
TRI = np.concatenate([np.arange(15, -1, -1), np.arange(0, 16)]) / 7.5 - 1
def tri(f, d, **kw): ph, _ = phase(f, ns(d), **kw); return TRI[(ph * 32).astype(int) % 32]
WAVE = np.array([8, 11, 13, 14, 15, 15, 14, 13, 11, 9, 8, 7, 6, 6, 7, 8, 8, 7, 5, 3, 2, 1, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8]) / 7.5 - 1
def wave(f, d, **kw): ph, _ = phase(f, ns(d), **kw); return WAVE[(ph * 32).astype(int) % 32]
def _lfsr(short):
    reg, out = 1, np.empty(93 if short else 32767)
    for i in range(len(out)): b = (reg ^ (reg >> (6 if short else 1))) & 1; reg = (reg >> 1) | (b << 14); out[i] = reg & 1
    return out * 2 - 1
LFL, LFS = _lfsr(False), _lfsr(True)
def noise(d, rate=12000, short=False): n = ns(d); tab = LFS if short else LFL; return tab[(np.arange(n) * rate / SR).astype(int) % len(tab)]
def env(n, a=.004, d=.08, s=.6, r=.05, steps=16):
    t = np.arange(n) / SR; dur = n / SR
    e = np.where(t < a, t / a, s + (1 - s) * np.exp(-(t - a) / max(d, 1e-4)))
    e *= np.clip((dur - t) / max(r, 1e-4), 0, 1)
    return np.round(e * steps) / steps if steps else e          # 4-bit volume steps
def expdec(n, tau): return np.exp(-np.arange(n) / SR / tau)

# —— buses ——
MUS = np.zeros((2, N)); ACC = []
def put(t, sig, vol=1.0, pan=0.0):
    i = int(round(t * SR)); if_ = min(N, i + len(sig))
    if i >= N or if_ <= i: return
    s = sig[:if_ - i] * vol; l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    MUS[0, i:if_] += s * l * 1.414; MUS[1, i:if_] += s * r * 1.414
def note(t, m, d, inst='p25', vol=.2, pan=0., vib=0.):
    m = M(m); f = hz(m); dd = d * .92
    if inst in ('p12', 'p25', 'p50'):
        duty = {'p12': .125, 'p25': .25, 'p50': .5}[inst]; x = pulse(f, dd, duty, vib=vib) * env(ns(dd), d=.12, s=.55, r=.04)
    elif inst == 'tri': x = tri(f, dd) * env(ns(dd), a=.002, d=.2, s=.85, r=.02, steps=0) * .7
    elif inst == 'wave': x = wave(f, dd, vib=vib) * env(ns(dd), a=.02, d=.3, s=.7, r=.08)
    elif inst == 'pluck': x = pulse(f, dd, .25) * env(ns(dd), a=.002, d=.06, s=.0, r=.02)
    put(t, x, vol, pan)
def kick(t, v=.5):
    d = .14; n = ns(d); tt = np.arange(n) / SR; f = 50 + 90 * np.exp(-tt / .025)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * expdec(n, .06) * .75 + noise(d, 8000) * expdec(n, .004) * .35
    x = np.round(x * 64) / 64; put(t, x, v)
def snare(t, v=.32):
    d = .16; n = ns(d); x = noise(d, 14000) * expdec(n, .05) + np.sin(2 * np.pi * 190 * np.arange(n) / SR) * expdec(n, .03) * .5
    x = np.round(x * 32) / 32; put(t, x, v, .1)
def hat(t, v=.08, open_=False):
    d = .2 if open_ else .04; n = ns(d); x = hp(noise(d, 24000, short=True), 6000) * expdec(n, .06 if open_ else .012); put(t, x, v, -.2)
def crash(t, v=.25): d = 1.2; n = ns(d); put(t, hp(noise(d, 22000), 3000) * expdec(n, .35), v, .15); ACC.append(round(t, 3))
def echo(B, taps=(.18, .27, .37), gains=(.45, .32, .22), fb=.4, lpf=3000, mix=.4):
    out = B.copy()
    for ch in range(2):
        x = B[ch]; y = np.zeros_like(x)
        for tp, g in zip(taps, gains):
            k = int(tp * SR); y[k:] += x[:-k] * g
        # one feedback pass (low-passed)
        fbk = lp(y, lpf); k = int(taps[-1] * SR); y[k:] += fbk[:-k] * fb
        out[ch] = x + lp(y, lpf) * mix * (1 if ch == 0 else .9)
    return out
def mask(B, t0, t1, fin=.01, fout=.05):
    i0, i1 = int(t0 * SR), int(t1 * SR); m = np.zeros(B.shape[1])
    m[i0:i1] = 1; a = int(fin * SR); b = int(fout * SR)
    if a: m[i0:i0 + a] = np.linspace(0, 1, a)
    if b and i1 - b > i0: m[i1 - b:i1] = np.linspace(1, 0, b)
    return B * m

# chord helpers
CH = {'C': ['C', 'E', 'G'], 'Am': ['A', 'C', 'E'], 'F': ['F', 'A', 'C'], 'G': ['G', 'B', 'D'], 'Dm': ['D', 'F', 'A'], 'Em': ['E', 'G', 'B'],
      'Bb': ['Bb', 'D', 'F'], 'A': ['A', 'C#', 'E'], 'D': ['D', 'F#', 'A'], 'Gm': ['G', 'Bb', 'D'], 'E': ['E', 'G#', 'B'], 'Bm': ['B', 'D', 'F#'],
      'Fphr': ['F', 'A', 'C'], 'Em7': ['E', 'G', 'D']}
def chord_notes(name, octv): return [M(n + str(octv)) if n[-1] not in '0123456789' else M(n) for n in CH[name]]

# ===================== OVERWORLD (C major, 120) =====================
OW_LEAD = [  # (beat, dur, note) 8 bars; bar 8 left on the dominant (D over G)
    (0, 1, 'E5'), (1, .5, 'G5'), (1.5, .5, 'C6'), (2, 1, 'B5'), (3, 1, 'G5'),
    (4, 1.5, 'A5'), (5.5, .5, 'G5'), (6, 1, 'E5'), (7, 1, 'D5'),
    (8, 1, 'E5'), (9, .5, 'G5'), (9.5, .5, 'A5'), (10, 1, 'G5'), (11, .5, 'E5'), (11.5, .5, 'C5'),
    (12, 3, 'D5'), (15, 1, 'G4'),
    (16, 1, 'F5'), (17, .5, 'E5'), (17.5, .5, 'D5'), (18, 1, 'C5'), (19, 1, 'A4'),
    (20, 1.5, 'G4'), (21.5, .5, 'A4'), (22, 1, 'C5'), (23, 1, 'E5'),
    (24, 1, 'D5'), (25, .5, 'C5'), (25.5, .5, 'D5'), (26, 1, 'E5'), (27, 1, 'G5'),
    (28, 4, 'D5')]
OW_CH = ['C', 'Am', 'F', 'G', 'F', 'C', 'Dm', 'G']
def overworld(t0, t1, bpm=120, layers=('lead', 'arp', 'bass', 'drums'), vol=1.0, start_bar=0, transpose=0):
    b = 60 / bpm; nb = int(np.ceil((t1 - t0) / b))
    for k in range(nb):
        T = t0 + k * b; bar = (start_bar + k // 4) % 8; beat = k % 4
        if T >= t1: break
        c = OW_CH[bar]
        if 'bass' in layers:
            root = chord_notes(c, 2)[0] + transpose
            for h, nn in enumerate([root, root, root + 7, root]):
                if T + h * b / 2 < t1: note(T + h * b / 2 if False else T + h * b / 2 * (1 if h < 2 else 1), nn if h != 1 else root + 12, b / 2, 'tri', .34 * vol)
        if 'arp' in layers:
            cn = chord_notes(c, 4)
            for h in range(4):
                tt = T + h * b / 4
                if tt < t1: note(tt, cn[h % 3] + (12 if h == 3 else 0) + transpose, b / 4, 'p12', .07 * vol, pan=-.4)
        if 'drums' in layers:
            if beat in (0, 2): kick(T, .38 * vol)
            if beat in (1, 3): snare(T, .2 * vol)
            hat(T + b / 2, .05 * vol)
    if 'lead' in layers:
        for (bt, d, n) in OW_LEAD:
            tt = t0 + (bt - start_bar * 4) * b
            if start_bar * 4 <= bt and tt < t1 - .02: note(tt, M(n) + transpose, min(d * b, t1 - tt), 'p25', .17 * vol, pan=.2, vib=.004)

# ===================== BATTLE (D minor, 150) =====================
B_BASS = ['D2', 'D2', 'D3', 'D2', 'C3', 'D2', 'A2', 'D2']
B_CH = ['Dm', 'Bb', 'C', 'A']
B_LEAD = [(0, .5, 'D5'), (.5, .5, 'F5'), (1, 1, 'A5'), (2, .5, 'G5'), (2.5, .5, 'F5'), (3, 1, 'E5'),
          (4, .5, 'F5'), (4.5, .5, 'E5'), (5, 1, 'D5'), (6, 1, 'Bb4'), (7, 1, 'C5'),
          (8, .5, 'D5'), (8.5, .5, 'F5'), (9, 1, 'A5'), (10, 1, 'C6'), (11, .5, 'Bb5'), (11.5, .5, 'A5'),
          (12, 2, 'A5'), (14, 1, 'C#5'), (15, 1, 'E5')]
def battle(t0, t1, bpm=150, major=False, layers=('lead', 'bass', 'drums', 'pad'), vol=1.0):
    b = 60 / bpm; nb = int(np.ceil((t1 - t0) / b)); shift = 0
    for k in range(nb):
        T = t0 + k * b; bar = (k // 4) % 4
        if T >= t1: break
        if 'bass' in layers:
            for h in range(2):
                nn = M(B_BASS[(k * 2 + h) % 8]) + (4 if major and B_BASS[(k * 2 + h) % 8].startswith('F') else 0)
                tt = T + h * b / 2
                if tt < t1: note(tt, nn, b / 2 * (.6 if major else .95), 'tri', .36 * vol)
        if 'drums' in layers:
            if k % 2 == 0: kick(T, .4 * vol)
            else: snare(T, .24 * vol)
            hat(T + b / 2, .05 * vol); hat(T, .03 * vol)
        if 'pad' in layers and k % 4 == 0:
            c = B_CH[bar] if not major else ['D', 'G', 'A', 'D'][bar]
            for j, nn in enumerate(chord_notes(c, 4)):
                note(T, nn, min(4 * b, t1 - T), 'p12', .045 * vol, pan=-.5 + j * .25)
    if 'lead' in layers:
        for rep in range(8):
            for (bt, d, n) in B_LEAD:
                tt = t0 + (rep * 16 + bt) * b
                if tt >= t1 - .02: break
                nn = M(n)
                if major: nn = {M('F5'): M('F#5'), M('Bb4'): M('B4'), M('Bb5'): M('B5'), M('C5'): M('C#5'), M('C6'): M('C#6')}.get(nn, nn)
                note(tt, nn, min(d * b * (.55 if major else 1), t1 - tt), 'p50' if not major else 'p25', .13 * vol, pan=.25)
def victory(t0, vol=1.0, key=0):
    b = .1
    for i, n in enumerate(['C5', 'E5', 'G5', 'C6']): note(t0 + i * b, M(n) + key, b, 'p25', .16 * vol, pan=.2)
    note(t0 + .4, M('C6') + key, .5, 'p25', .15 * vol, vib=.006); note(t0 + .4, M('E5') + key, .5, 'p12', .09 * vol, pan=-.3)
    for i, n in enumerate(['A5', 'B5', 'C6']): note(t0 + .95 + i * .12, M(n) + key, .12, 'p25', .14 * vol)
    note(t0 + 1.31, M('D6') + key, .9, 'p25', .15 * vol, vib=.006); note(t0 + 1.31, M('G5') + key, .9, 'p12', .09 * vol, pan=-.3)
    note(t0 + 1.31, M('G2') + key, .9, 'tri', .3 * vol)
    for i, n in enumerate(['C6', 'G5', 'E5', 'C5']): note(t0 + 2.3 + i * .06, M(n) + key, .2, 'p12', .08 * vol)
    note(t0 + 2.3, M('C3') + key, .5, 'tri', .3 * vol); kick(t0 + 2.3, .3 * vol)

# ===================== BOSS (E phrygian, 160) =====================
BO_LEAD = [(0, 1, 'E5'), (1, .5, 'F5'), (1.5, .5, 'E5'), (2, 1, 'B4'), (3, 1, 'C5'),
           (4, .5, 'B4'), (4.5, .5, 'A4'), (5, 1, 'G#4'), (6, 2, 'E4'),
           (8, 1, 'E5'), (9, .5, 'F5'), (9.5, .5, 'G5'), (10, 1, 'A5'), (11, 1, 'B5'),
           (12, .5, 'C6'), (12.5, .5, 'B5'), (13, 1, 'A5'), (14, 1, 'F5'), (15, 1, 'E5')]
def boss(t0, t1, bpm=160, intensity=1.0, lead=True, vol=1.0):
    b = 60 / bpm; nb = int(np.ceil((t1 - t0) / b))
    for k in range(nb):
        T = t0 + k * b
        if T >= t1: break
        bar = (k // 4) % 4
        root = M('E2') if bar != 3 else M('F2')
        for h in range(2):
            tt = T + h * b / 2
            if tt < t1: note(tt, root + (12 if h else 0), b / 2 * .9, 'tri', .38 * vol)
        if intensity > .3:
            kick(T, .42 * vol);
            if k % 2: snare(T, .26 * vol)
            if intensity > .7: hat(T + b / 2, .06 * vol)
        if intensity > .5 and k % 4 == 0:
            note(T, M('E3'), 4 * b * .95, 'p50', .05 * vol, pan=-.4); note(T, M('B3') if bar != 3 else M('C4'), 4 * b * .95, 'p50', .05 * vol, pan=.4)
    if lead:
        for rep in range(8):
            for (bt, d, n) in BO_LEAD:
                tt = t0 + (rep * 16 + bt) * b
                if tt >= t1 - .02: break
                note(tt, M(n), min(d * b, t1 - tt), 'p50', .12 * vol, pan=.2); note(tt, M(n) - 12, min(d * b, t1 - tt), 'p25', .06 * vol, pan=-.2)

# ===================== TENDER (F major, 80) =====================
TE_LEAD = [(0, 1, 'A4'), (1, 1, 'C5'), (2, 1.5, 'F5'), (3.5, .5, 'E5'),
           (4, 2, 'D5'), (6, 1, 'C5'), (7, 1, 'A4'),
           (8, 1, 'Bb4'), (9, 1, 'D5'), (10, 1.5, 'G5'), (11.5, .5, 'F5'),
           (12, 3, 'E5'), (15, 1, 'C5'),
           (16, 1, 'A4'), (17, 1, 'C5'), (18, 1, 'F5'), (19, 1, 'A5'),
           (20, 1.5, 'G5'), (21.5, .5, 'F5'), (22, 1, 'E5'), (23, 1, 'G5'),
           (24, 4, 'F5')]
TE_CH = ['F', 'Dm', 'Bb', 'C', 'F', 'C', 'F']
def tender(t0, t1, bpm=80, full=False, vol=1.0, rit_end=None):
    b = 60 / bpm; nb = int(np.ceil((t1 - t0) / b))
    def tb(beat):   # optional ritardando over the last 4 beats before rit_end
        tt = t0 + beat * b
        if rit_end is not None and tt > rit_end - 4 * b: tt = rit_end - 4 * b + (tt - (rit_end - 4 * b)) * 1.35
        return tt
    for k in range(nb):
        T = tb(k)
        if T >= t1: break
        c = TE_CH[(k // 4) % len(TE_CH)]
        if k % 2 == 0: note(T, chord_notes(c, 2)[0], 2 * b * .95, 'tri', .3 * vol)
        cn = chord_notes(c, 4)
        for h, nn in enumerate([cn[0], cn[1], cn[2], cn[1]]):
            tt = tb(k + h / 4)
            if tt < t1: note(tt, nn, b / 4 * 1.6, 'p12', .05 * vol * (1.3 if full else 1), pan=-.4 + .27 * h)
        if full:
            if k % 4 == 0: kick(T, .2 * vol)
            if k % 4 == 2: snare(T, .1 * vol)
            hat(T + b / 2, .025 * vol)
    for (bt, d, n) in TE_LEAD:
        tt = tb(bt)
        if tt >= t1 - .05: break
        note(tt, M(n), min(d * b, t1 - tt), 'wave', .2 * vol, pan=.15, vib=.007)
        if full: note(tt, M(n) + 12, min(d * b, t1 - tt), 'p25', .05 * vol, pan=-.2, vib=.006)

def fanfare(t0, vol=1.0):
    trip = .5 / 3
    for i, n in enumerate(['C5', 'E5', 'G5']): note(t0 + i * trip, n, trip, 'p25', .17 * vol); note(t0 + i * trip, M(n) - 12, trip, 'p12', .08 * vol, pan=-.3)
    note(t0 + .5, 'C6', 1.0, 'p25', .17 * vol, vib=.006); note(t0 + .5, 'G5', 1.0, 'p12', .09 * vol, pan=-.3); note(t0 + .5, 'C3', 1.0, 'tri', .34 * vol); kick(t0 + .5, .35); crash(t0 + .5, .16)
    for i, n in enumerate(['A5', 'B5', 'C6']): note(t0 + 1.5 + i * trip, n, trip, 'p25', .15 * vol)
    note(t0 + 2.0, 'D6', .5, 'p25', .16 * vol); note(t0 + 2.0, 'B5', .5, 'p12', .08 * vol); note(t0 + 2.0, 'G2', .5, 'tri', .32 * vol)
    note(t0 + 2.5, 'E6', 1.0, 'p25', .17 * vol, vib=.007); note(t0 + 2.5, 'C6', 1.0, 'p12', .09 * vol, pan=-.3); note(t0 + 2.5, 'C3', 1.0, 'tri', .34 * vol); kick(t0 + 2.5, .35)
    ACC.append(round(t0, 3))

# ===================== arrangement =====================
S = SEC
# OVERWORLD: title, equip, mount, travel; cut by the swirl
t_ow0, t_sw = S['ow']['t'], S['b1']['t'] - 0.75
overworld(t_ow0, t_sw)
crash(t_ow0, .12)
# encounter sting (rising) into battle 1
for i in range(8): note(t_sw + i * .08, M('C5') + i * 2, .08, 'p25', .1, pan=(-1) ** i * .3)
# BATTLE 1: thin to a waiting vamp during 等待, then the victory jingle on the green light
b1, b1e = S['b1']['t'], S['ride']['t']
hits = {h['name']: h for h in TL['hits']}
t_wait0 = b1 + 18 * .4       # s11 starts at beat 18
t_green = hits['green']['t']
battle(b1, t_wait0)
crash(b1, .18)
# the waiting vamp: bass on beats + a clock-like pulse tick (comedy)
for k in range(int((t_green - t_wait0) / .4)):
    T = t_wait0 + k * .4; note(T, M('D2') if k % 2 == 0 else M('A1'), .3, 'tri', .3); note(T + .2, M('A5'), .03, 'pluck', .05)
victory(t_green)
ACC.append(round(t_green, 3))
# RIDE: overworld bars 5–6 (no lead's dominant ending), cut by the swirl
r0, r1 = S['ride']['t'], S['b2']['t'] - .75
overworld(r0, r1, start_bar=4)
for i in range(8): note(r1 + i * .08, M('D5') + i * 2, .08, 'p25', .1)
# BATTLE 2: the dash on beat 8 → crash; then a deflating figure (the phone takes water)
b2, b2e = S['b2']['t'], S['kid']['t']
t_dash = hits['dash']['t']
battle(b2, t_dash)
crash(t_dash, .28); kick(t_dash, .5)
for i, n in enumerate(['A5', 'G#5', 'G5', 'F#5']): note(t_dash + .5 + i * .22, n, .22 if i < 3 else .7, 'p50', .12, vib=.02 if i == 3 else 0)
note(t_dash + .5, 'D2', 1.4, 'tri', .3)
# BUS STOP: sparse overworld (triangle + soft arps), the tender motif's first 3 notes on the umbrella
k0, k1 = S['kid']['t'], S['dog']['t']
overworld(k0, k1 - .1, layers=('bass', 'arp'), vol=.7)
t_umb = hits['umbrella']['t']
for i, n in enumerate(['A4', 'C5', 'F5']): note(t_umb + i * .5, M(n) + 7, .5 if i < 2 else 1.6, 'wave', .2, vib=.007)   # in C: E5 G5 C6
ACC.append(round(t_umb, 3))
# DOG: 4 beats of overworld, the bouncy major battle from b3_in, a sparkle on the pat, victory
d0, d1 = S['dog']['t'], S['boss']['t']
t_b3, t_pat = hits['b3_in']['t'], hits['pat']['t']
overworld(d0, t_b3 - .4, layers=('bass', 'arp', 'drums'), vol=.7, start_bar=2)
for i in range(6): note(t_b3 - .48 + i * .08, M('E5') + i * 2, .08, 'p25', .1)
battle(t_b3, t_pat, major=True)
for i, n in enumerate(['D6', 'F#6', 'A6', 'D7', 'A6', 'F#6']): note(t_pat + i * .07, n, .07, 'p12', .09, pan=.3)
ACC.append(round(t_pat, 3))
battle(t_pat + .4, d1 - 3.0, major=True, layers=('bass', 'drums'), vol=.8)
victory(d1 - 3.0, vol=.9, key=2)
# BOSS: ominous intro (lobby, dread), full boss theme from the well (beat 12), light on (beat 26), climb, defeat
bo0, bo1 = S['boss']['t'], S['hush']['t']
t_well, t_light = hits['boss_well']['t'], hits['lighton']['t']
boss(bo0, t_well, intensity=.2, lead=False, vol=.7)
for i in range(4): note(t_well - 1.5 + i * .375, M('E4') + i, .3, 'p50', .08)   # chromatic climb into the well
boss(t_well, bo1 - 2.4, intensity=1.0)
crash(t_well, .25); crash(t_light, .2)
t_down = bo1 - 2.0
for i, n in enumerate(['E5', 'B4', 'G4', 'E4', 'B3', 'E3']): note(t_down + i * .09, n, .12, 'p50', .12)
note(t_down + .55, 'E2', 1.2, 'tri', .36); kick(t_down + .55, .5); crash(t_down + .55, .2)
# TENDER: from the door opening (downbeat), ritardando into the drop (silence)
te0, te1 = S['tender']['t'], S['drop']['t']
tender(te0, te1, rit_end=te1)
ACC.append(round(te0, 3))
# (DROP / SONG / STILL: no score — the song is sung by the text blips in mix.py; one held triangle note on 00:00)
t_mid = hits['midnight']['t']
note(t_mid, 'F3', 2.6, 'tri', .22); note(t_mid, 'C5', 2.6, 'wave', .08, vib=.005)
# PAYOFF: the tender theme, full band, from the kid's line
p0, p1 = S['payoff']['t'], S['fanfare']['t']
tender(p0, p1 + .05, full=True, vol=1.05)
ACC.append(round(p0, 3))
# FANFARE: level up
fanfare(S['fanfare']['t'])
# CODA: the overworld phrase, this time resolved (D → C) in major, then the last chord rings into the fade
c0, c1 = S['coda']['t'], DUR
for i, (bt, d, n) in enumerate([(0, 1, 'E5'), (1, .5, 'D5'), (1.5, .5, 'E5'), (2, 1, 'G5'), (3, 1, 'D5'), (4, 3, 'C5')]):
    note(c0 + bt * .5, n, d * .5 if i < 5 else 2.0, 'p25', .15, vib=.005)
for i, c in enumerate(['F', 'G', 'C']):
    for j, nn in enumerate(chord_notes(c, 4)): note(c0 + i * 1.0, nn, 1.0 if i < 2 else 2.2, 'p12', .05, pan=-.4 + .4 * j)
    note(c0 + i * 1.0, chord_notes(c, 2)[0], 1.0 if i < 2 else 2.2, 'tri', .3)
ACC.append(round(c0 + 2.0, 3))

# master: echo (SNES-style), gentle low cut, fade out with the picture
B = echo(MUS, mix=.38)
B = hp(B, 35)
fo = int((DUR - .6) * SR); B[:, fo:] *= np.linspace(1, 0, B.shape[1] - fo)
# true silences: the hush before the door and the drop after the decision (echo tails cut)
B = B * (1 - mask(np.ones((2, B.shape[1])), S['hush']['t'] + .05, S['tender']['t'] - .01, .05, .01))
B = B * (1 - mask(np.ones((2, B.shape[1])), S['drop']['t'] + .4, t_mid - .02, .4, .01))
B = B * (1 - mask(np.ones((2, B.shape[1])), t_mid + 2.8, p0 - .02, .3, .01))
pk = np.abs(B).max(); B = B / pk * .8
sf.write(os.path.join(HERE, 'score.wav'), B[:, :int(DUR * SR)].T.astype(np.float32), SR)
json.dump({'accents': sorted(set(ACC)), 'sections': TL['sections']}, open(os.path.join(HERE, 'score.json'), 'w'), indent=1)
print('score.wav', round(DUR, 2), 's · accents', len(set(ACC)))
