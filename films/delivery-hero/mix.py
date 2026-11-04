"""mix.py — chip Foley from events.json + rain bed + the sung blips + score → out/mix.wav (48 kHz stereo)
All Foley is synthesised (pulse / triangle / LFSR-like noise, bit-crushed); the rain is a two-layer noise bed with automation;
the one organic sound is the old lady's breath on the blow-out. Silences: the 'silence' events zero everything, echo tails included.
Run: $LIB/.venv/bin/python mix.py   (reads events.json, timeline.json, music/score.wav)"""
import os, sys, json, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
HERE = os.path.dirname(os.path.abspath(__file__))
SR = 48000
E = json.load(open(os.path.join(HERE, 'events.json'))); DUR = E['dur']; EV = E['ev']
TL = json.load(open(os.path.join(HERE, 'timeline.json')))
N = int(round(DUR * SR))
rng = np.random.default_rng(7)
def t_(d): return np.arange(max(1, int(round(d * SR)))) / SR
def ex(d, tau): return np.exp(-t_(d) / tau)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x, axis=0)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x, axis=0)
def bp(x, a, b, o=2): return sosfilt(butter(o, [a, b], 'band', fs=SR, output='sos'), x, axis=0)
def wn(d): return rng.standard_normal(len(t_(d)))
def sq(f, d, duty=.5):
    tt = t_(d); f = np.broadcast_to(np.asarray(f, float), tt.shape); ph = np.cumsum(f) / SR; return ((ph % 1) < duty).astype(float) * 2 - 1
def tri(f, d):
    tt = t_(d); f = np.broadcast_to(np.asarray(f, float), tt.shape); ph = np.cumsum(f) / SR; return np.round((2 * np.abs(2 * (ph % 1) - 1) - 1) * 7) / 7
def crush(x, bits=6, sr=16000):
    step = max(1, int(SR / sr)); x = np.repeat(x[::step], step)[:len(x)]; q = 2 ** (bits - 1); return np.round(x * q) / q
def adsr(d, a=.003, r=.03):
    tt = t_(d); return np.clip(np.minimum(tt / max(a, 1e-4), (d - tt) / max(r, 1e-4)), 0, 1)
def echo(x, taps=((.12, .3), (.24, .15))):
    y = np.concatenate([x, np.zeros(int((max(t for t, _ in taps) + .05) * SR))])
    for dt, g in taps: s = int(dt * SR); y[s:s + len(x)] += x * g
    return y
def norm(x, p=1.0): m = np.abs(x).max(); return x * (p / m) if m > 0 else x
def glide(f0, f1, d): return f0 * (f1 / f0) ** (t_(d) / d)

SFX = np.zeros((N, 2)); BED = np.zeros((N, 2)); SING = np.zeros((N, 2))
def put(bus, x, at, g=1.0, pan=0.0):
    s = int(round(at * SR)); x = np.asarray(x, float) * g
    if s >= N or s + len(x) <= 0: return
    if s < 0: x = x[-s:]; s = 0
    x = x[:N - s]; l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    bus[s:s + len(x), 0] += x * l * 1.414; bus[s:s + len(x), 1] += x * r * 1.414

def S(ty, e):
    """→ (signal, gain, pan)"""
    if ty == 'blip':
        p = e.get('p', 1.0); d = .035; x = sq(880 * p, d, .25 if e.get('who') != 'sys' else .125) * adsr(d, .001, .015); return crush(x, 5), .09, 0
    if ty == 'cursor': d = .03; return sq(1320, d, .25) * adsr(d, .001, .01), .12, .2
    if ty == 'select':
        a = sq(988, .045, .25) * adsr(.045); b = sq(1318, .07, .25) * adsr(.07); return np.concatenate([a, b]), .14, 0
    if ty == 'open':
        d = .06; x = sq(glide(440, 880, d), d, .125) * adsr(d); return x, .07 if e.get('soft') else .1, 0
    if ty in ('quest', 'accept', 'ding', 'item'):
        notes = {'quest': [784, 988, 1175], 'accept': [1047, 1319, 1568, 2093], 'ding': [1568, 2093], 'item': [784, 988, 1175, 1568, 1976]}[ty]
        out = np.zeros(int(.9 * SR))
        for k, f in enumerate(notes): s = sq(f, .14, .25) * adsr(.14, .002, .1); i = int(k * .07 * SR); out[i:i + len(s)] += s * (1 - k * .1)
        return echo(out), .12, 0
    if ty == 'ping':   # the phone: two clean pulse notes
        out = np.concatenate([sq(1760, .09, .5) * adsr(.09), np.zeros(int(.03 * SR)), sq(2349, .16, .5) * adsr(.16, .002, .12)]); return echo(out), .16, .3
    if ty == 'snore':
        d = .9; tt = t_(d); x = lp(wn(d), 500) * np.sin(np.pi * tt / d) ** 2 * (1 + .5 * sq(28, d)); return norm(x), .09, -.1
    if ty == 'boing': d = .35; return crush(sq(glide(220, 880, d), d, .5) * ex(d, .15), 6), .14, 0
    if ty in ('land', 'seat', 'thunk', 'flop', 'stomp'):
        d = .18; tt = t_(d); f = {'land': 90, 'seat': 110, 'thunk': 70, 'flop': 60, 'stomp': 55}[ty]
        x = np.sin(2 * np.pi * np.cumsum(f * (1 + 2 * np.exp(-tt / .02))) / SR) * ex(d, .06) + lp(wn(d), 1500) * ex(d, .02) * .4; return crush(norm(x), 6), .3, 0
    if ty == 'clack': d = .05; return crush(bp(wn(d), 1500, 4000) * ex(d, .01), 5), .12, .2
    if ty == 'pop': d = .06; return sq(glide(600, 1400, d), d, .25) * adsr(d), .12, 0
    if ty == 'mosaic':
        d = .45; x = sq(glide(300, 1200, d) if e.get('up') else glide(1200, 300, d), d, .125) * adsr(d, .01, .1); return crush(x, 4, 8000), .06, 0
    if ty == 'cloth': d = .3; return bp(wn(d), 800, 3000) * np.sin(np.pi * t_(d) / d), .12, -.2
    if ty == 'gust': d = .7; return bp(wn(d), 300, 1500) * np.sin(np.pi * t_(d) / d) ** 2, .2, .5
    if ty == 'flap':
        d = .7; x = bp(wn(d), 600, 2500) * (np.sin(2 * np.pi * 12 * t_(d)) > 0) * ex(d, .4); return x, .12, .1
    if ty == 'swat': d = .12; return bp(wn(d), 1000, 5000) * ex(d, .03) + sq(220, d) * ex(d, .02) * .3, .16, 0
    if ty == 'jump': d = .2; return crush(sq(glide(300, 900, d), d, .25) * adsr(d), 6), .12, 0
    if ty == 'click': d = .03; return crush(bp(wn(d), 2000, 6000) * ex(d, .006) + sq(1800, d) * ex(d, .004), 5), .14, 0
    if ty == 'motor':
        d = e.get('d', 1.0); tt = t_(d); f = 70 + 50 * np.minimum(1, tt / .6); x = sq(f, d, .3) * .5 + sq(f * 2.01, d, .5) * .25
        return lp(x, 900) * adsr(d, .1, .3), .1 * e.get('g', 1), -.1
    if ty in ('splash', 'bigsplash'):
        d = .5 if ty == 'splash' else 1.1; x = bp(wn(d), 800, 7000) * ex(d, .12 if ty == 'splash' else .3) + lp(wn(d), 400) * ex(d, .08) * .5
        return x, (.18 if ty == 'splash' else .32) * e.get('g', 1), 0
    if ty == 'alert':
        out = np.concatenate([sq(1568, .06, .5) * adsr(.06), sq(2093, .12, .5) * adsr(.12)]); return out, .14, 0
    if ty in ('swirl', 'swirlin'):
        d = .8; tt = t_(d); x = sq(glide(200, 1600, d), d, .5) * .4 + bp(wn(d), 500, 6000) * (tt / d) * .6; return crush(x * adsr(d, .05, .05), 5, 11025), .14, 0
    if ty == 'zip': d = .2; return crush(sq(glide(400, 1500, d), d, .25), 5), .12, .4
    if ty == 'buzz': d = .35; return crush(sq(110, d, .5) * .7 + sq(117, d, .5) * .5, 4), .14, 0
    if ty == 'yank': d = .25; return crush(sq(glide(900, 200, d), d, .25) * ex(d, .1), 5), .12, .3
    if ty == 'tap': d = .04; return crush(bp(wn(d), 1000, 3000) * ex(d, .008), 4), .1 * e.get('g', 1), .3
    if ty == 'yawn':
        d = .9; tt = t_(d); x = tri(glide(330, 196, d), d) * np.sin(np.pi * tt / d); return x, .1, .3
    if ty == 'reset':   # the counter jumps back to 99: a cheeky up-arpeggio
        out = np.zeros(int(.4 * SR))
        for k, f in enumerate([523, 659, 784, 1047]): s = sq(f, .07, .125) * adsr(.07); i = int(k * .05 * SR); out[i:i + len(s)] += s
        return out, .1, -.3
    if ty == 'green': d = .12; return sq(1047, d, .5) * adsr(d), .1, -.3
    if ty == 'clocktick': d = .03; return crush(sq(2400, d, .5) * ex(d, .006), 4), .1, .5
    if ty == 'hptick': d = .03; return sq(660, d, .5) * adsr(d), .07, 0
    if ty == 'rise':
        d = e.get('d', 1.2); tt = t_(d); x = (lp(wn(d), 500) * (1 - tt / d) + lp(wn(d), 1800) * (tt / d)) * (tt / d) + tri(glide(60, 120, d), d) * .3; return x, .2, 0
    if ty == 'rev': d = .3; return lp(sq(glide(80, 240, d), d, .3), 1500) * adsr(d), .14, 0
    if ty == 'dash': d = .4; return crush(bp(wn(d), 600, 5000) * ex(d, .1) + sq(glide(500, 120, d), d, .5) * ex(d, .1) * .4, 6), .24, -.2
    if ty == 'hit':
        d = .35; tt = t_(d); x = lp(wn(d), 2500) * ex(d, .06) + np.sin(2 * np.pi * 48 * tt) * ex(d, .12) * .8; return crush(norm(x), 6), .32, 0
    if ty == 'zap': d = .4; return crush(sq(glide(1200, 150, d), d, .5) * (np.sin(2 * np.pi * 30 * t_(d)) > 0) * ex(d, .2), 4), .12, .3
    if ty == 'shake': d = .6; return bp(wn(d), 1500, 6000) * (np.sin(2 * np.pi * 14 * t_(d)) > 0) * ex(d, .3), .12, .3
    if ty == 'skid':
        d = .6; tt = t_(d); x = bp(wn(d), 1500, 5000) * ex(d, .25) + sq(glide(700, 500, d), d, .5) * ex(d, .2) * .2; return x, .2, -.2
    if ty == 'umbrella':   # pop open: a whump + a bright up-chirp
        a = lp(wn(.25), 900) * ex(.25, .04); b = sq(glide(500, 1800, .14), .14, .25) * adsr(.14)
        out = np.zeros(int(.4 * SR)); out[:len(a)] += a; out[int(.03 * SR):int(.03 * SR) + len(b)] += b * .6; return out, .2, .2
    if ty == 'bark' or ty == 'woof':
        d = .22; tt = t_(d); f = (520 if ty == 'bark' else 640) * (1 - .4 * tt / d)
        x = sq(f, d, .3) * ex(d, .08) + bp(wn(d), 600, 3000) * ex(d, .05) * .6; return crush(norm(x), 5, 11025), (.22 if ty == 'bark' else .14) * e.get('g', 1), -.4
    if ty == 'scare': d = .5; return crush(sq(glide(1400, 2400, d), d, .25) * (np.sin(2 * np.pi * 25 * t_(d)) > 0) * ex(d, .25), 5), .1, .3
    if ty in ('sparkle', 'heart'):
        out = np.zeros(int(.5 * SR)); fs = [2093, 2637, 3136, 4186] if ty == 'sparkle' else [1319, 1568]
        for k, f in enumerate(fs): s = tri(f, .1) * adsr(.1); i = int(k * .06 * SR); out[i:i + len(s)] += s
        return echo(out), .09, .1
    if ty == 'pat': d = .08; return lp(wn(d), 1200) * ex(d, .02), .14, -.2
    if ty == 'liftbuzz': d = .25; return crush(sq(98, d, .5) + sq(104, d, .5), 4), .1, .3
    if ty == 'sweat': d = .12; return tri(glide(1500, 2500, d), d) * adsr(d), .06, .3
    if ty == 'bosssting':
        d = 1.2; tt = t_(d); x = sq(41.2, d, .5) * ex(d, .5) + lp(wn(d), 300) * ex(d, .4); return crush(norm(x), 5), .3, 0
    if ty == 'shout': d = .45; tt = t_(d); return crush(sq(glide(330, 440, d), d, .5) * (1 + .3 * np.sin(2 * np.pi * 9 * tt)) * adsr(d, .02, .1), 5), .14, -.2
    if ty == 'lighton':
        a = lp(wn(.08), 2000) * ex(.08, .02); hum = (sq(100, .7, .5) * .3 + sq(200, .7, .5) * .1) * ex(.7, .4)
        out = np.zeros(int(.8 * SR)); out[:len(a)] += a; out[int(.04 * SR):int(.04 * SR) + len(hum)] += hum; return out, .2, 0
    if ty == 'step':
        d = .07; x = hp(wn(d), 500) * ex(d, .01) + np.sin(2 * np.pi * (180 if e.get('kid') else 140) * t_(d)) * ex(d, .012) * .6
        x = crush(norm(x), 6)
        return (echo(x, ((.13, .35), (.27, .2), (.41, .1))) if e.get('stair') else x), .2 * e.get('v', 1), .1
    if ty == 'floor': d = .1; return sq(1568, d, .25) * adsr(d), .08, .3
    if ty == 'bossdown':
        out = np.zeros(int(1.2 * SR))
        for k in range(8): s = crush(sq(400 - k * 40, .1, .5) * adsr(.1), 4); i = int(k * .08 * SR); out[i:i + len(s)] += s * (1 - k * .08)
        return out, .1, 0
    if ty == 'knock':
        d = .14; tt = t_(d); x = np.sin(2 * np.pi * 180 * tt) * ex(d, .02) + bp(wn(d), 300, 2000) * ex(d, .01) * .7
        return echo(norm(x), ((.11, .2), (.23, .08))), .5, 0
    if ty == 'latch': d = .08; return crush(bp(wn(d), 1500, 5000) * ex(d, .015), 6) + 0, .14, 0
    if ty == 'creak':
        d = e.get('d', 1.0); tt = t_(d); f = 230 + 60 * np.sin(2 * np.pi * 1.3 * tt); x = sq(f, d, .2) * (np.sin(2 * np.pi * 31 * tt) > -.2) * np.sin(np.pi * tt / d)
        return crush(lp(x, 1800), 5), .06, .1
    if ty == 'warm':
        out = np.zeros(int(1.6 * SR))
        for k, f in enumerate([523, 659, 784, 988, 1175]): s = tri(f, .5) * adsr(.5, .05, .4); i = int(k * .1 * SR); out[i:i + len(s)] += s * .7
        return echo(out, ((.2, .4), (.4, .2))), .07, 0
    if ty == 'rustle': d = .5; return bp(wn(d), 1500, 6000) * (rng.random(len(t_(d))) < .3) * np.sin(np.pi * t_(d) / d), .12, .2
    if ty == 'chime':
        d = 2.5; tt = t_(d); x = sum(a * tri(f, d) * ex(d, tau) for f, a, tau in [(698, 1, .9), (1047, .45, .7), (1397, .25, .5)]); return echo(x, ((.25, .35), (.5, .2))), .14, 0
    if ty == 'breath':   # the one organic sound: a soft human exhale (not crushed)
        d = .7; tt = t_(d); x = bp(wn(d), 500, 2500) * np.sin(np.pi * tt / d) ** 1.5 * (1 - .3 * tt / d); return x, .16, .3
    if ty == 'bitdrop':
        d = .5; x = crush(sq(glide(440, 55, d), d, .5) * ex(d, .2), 3, 6000); return x, .16, 0
    if ty == 'wink': return S('sparkle', e)
    if ty == 'savetick': d = .025; return sq(1760, d, .25) * adsr(d), .07, 0
    if ty == 'saved': return S('item', e)
    if ty in ('victory',): return None
    return None

# —— rain bed: two layers (hiss + drip patter), gain automation from 'raingain', fade at 'rainstop' ——
d = DUR; hiss = hp(lp(rng.standard_normal(N), 6000), 900) * .5
patter = np.zeros(N); idx = rng.integers(0, N, int(DUR * 90)); patter[idx] = rng.uniform(.3, 1, len(idx)); patter = bp(patter, 1500, 7000) * 1.5
drip = np.zeros(N); idx = rng.integers(0, N, int(DUR * 6)); drip[idx] = 1.0
dr = np.sin(2 * np.pi * 1200 * np.arange(int(.03 * SR)) / SR) * np.exp(-np.arange(int(.03 * SR)) / SR / .008)
drip = np.convolve(drip, dr)[:N] * .3
rain = hiss + patter + drip
g = np.ones(N); pts = sorted([(e['t'], e['g']) for e in EV if e['type'] == 'raingain'])
for k, (t0, gv) in enumerate(pts):
    i0 = int(t0 * SR); i1 = int(pts[k + 1][0] * SR) if k + 1 < len(pts) else N
    prev = g[i0 - 1] if i0 > 0 else gv; ramp = min(int(.25 * SR), i1 - i0)
    g[i0:i1] = gv; g[i0:i0 + ramp] = np.linspace(prev, gv, ramp)
for e in EV:
    if e['type'] == 'rainstop': i0 = int(e['t'] * SR); g[i0:] *= np.concatenate([np.linspace(1, 0, int(.4 * SR)), np.zeros(max(0, N - i0 - int(.4 * SR)))])[:N - i0]
BED[:, 0] = rain * g * .22; BED[:, 1] = np.roll(rain, 997) * g * .22

# —— events ——
for e in EV:
    ty = e['type']
    if ty in ('bed', 'raingain', 'rainstop', 'silence', 'sing'): continue
    r = S(ty, e)
    if r is None: continue
    x, gain, pan = r; put(SFX, x, e['t'], gain, pan)
# —— the song: his blips sing the tune (one pulse voice, echo) ——
for e in EV:
    if e['type'] != 'sing': continue
    f = 440 * 2 ** ((e['n'] + 12 - 69) / 12); dd = e['d']
    x = sq(f, dd, .25) * adsr(dd, .01, .06) * (1 + .03 * np.sin(2 * np.pi * 5.5 * t_(dd)))
    x = crush(x, 6)
    put(SING, echo(x, ((.19, .35), (.37, .2), (.55, .1))), e['t'], .085, -.1)

# —— score ——
mus, sr = sf.read(os.path.join(HERE, 'music', 'score.wav')); assert sr == SR
MUS = np.zeros((N, 2)); MUS[:min(N, len(mus))] = mus[:N]
# duck the music a little under the dialogue boxes' blips (not a voice; ~3 dB) and strongly under the big Foley hits
mix = MUS * .9 + SFX + BED + SING
# true silences (everything, tails included)
for e in EV:
    if e['type'] == 'silence':
        i0, i1 = int(e['t'] * SR), int(e['t1'] * SR); fade = int(.01 * SR)
        mix[i0:i0 + fade] *= np.linspace(1, 0, fade)[:, None]; mix[i0 + fade:i1] = 0; mix[i1:i1 + fade] *= np.linspace(0, 1, fade)[:, None]
# gentle bus compression + headroom (mux.sh does the loudness to −14 LUFS and the true-peak limit)
# peak limiter (lookahead 5 ms, release 60 ms): keeps hot transients ~7 dB under the old peak so loudnorm can meet −1.2 dBTP
from scipy.ndimage import maximum_filter1d, uniform_filter1d
pk = np.abs(mix).max(); mix = mix / pk
env = maximum_filter1d(np.abs(mix).max(axis=1), int(.010 * SR))
g = np.minimum(1, .42 / np.maximum(env, 1e-6)); g = -maximum_filter1d(-g, int(.010 * SR)); g = uniform_filter1d(g, int(.006 * SR))
mix = mix * g[:, None]; mix = mix / np.abs(mix).max() * .89
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR, subtype='FLOAT')
print('mix.wav', round(DUR, 2), 's, events', len(EV))
