"""Original score for 《蒸笼爵士》: a 1930s hot dance band, cut to the picture's tempo map (timeline.json).
Run: $LIB/.venv/bin/python films/steamer-jazz/music/score.py
Instruments: core/audio/sampler.py samples (VSCO 2 CE upright piano / clarinet / trumpet / muted trumpet / trombone / tuba / snare / bass drum /
cymbals; VCSL xylophone / woodblock / snare taps) + core/audio/pluck.py banjo + numpy slide whistle and brushes.
One original 4-bar theme (F major, blue third), restated: lazy (72), hot (120), quickstep in minor (144), lone clarinet (free), stomp (144, up a tone).
Writes score.wav (48 kHz stereo), score.json (accents for the cue check, band-energy self-check, credits)."""
import os, sys, json
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
HERE = os.path.dirname(os.path.abspath(__file__))
FILM = os.path.dirname(HERE); ROOT = os.environ.get('LIB') or os.path.abspath(os.path.join(FILM, '../..'))
sys.path.insert(0, ROOT)
from core.audio import sampler as S      # noqa: E402
from core.audio import pluck as PL       # noqa: E402
from core.audio.sfx import SR, add, limit  # noqa: E402
S.seed(8)
TL = json.load(open(os.path.join(FILM, 'timeline.json')))
DUR = TL['dur']; N = int(round(DUR * SR))
SEC = {s['id']: s for s in TL['sections']}
HIT = {h['name']: h['t'] for h in TL['hits']}
def B(sec, beat): s = SEC[sec]; return s['t'] + beat * 60 / s['bpm']
def bar(sec, b, beat=1.0): return B(sec, (b - 1) * 4 + (beat - 1))
BEATLEN = lambda sec: 60 / SEC[sec]['bpm']
STEMS = ['brass', 'reeds', 'piano', 'banjo_tuba', 'drums_fx', 'xylo']
buf = {k: np.zeros((N, 2), np.float32) for k in STEMS}
ACC = []
LEAD = {'tuba_stac': .022, 'tuba': .025, 'trumpet': .018, 'trumpet_stac': .012, 'trumpet_mute': .02, 'trombone': .02, 'trombone_stac': .015, 'clarinet': .015, 'clarinet_stac': .008}
class Note(np.ndarray): pass
def put(stem, x, t, gain=1.0, pan=0.0):
    t = t - getattr(x, 'lead', 0.0)
    if t >= DUR: return
    add(buf[stem], np.asarray(x, np.float32), t, gain, pan)
def nt(inst, pitch, dur, vel=.7, **kw):
    x = S.note(inst, pitch, dur, vel, **kw).view(Note); x.lead = LEAD.get(inst, 0.0); return x
def up(p, k=12): return S.name(S.midi(p) + k)

CH = {'F': ('F2', 'C2', ['A3', 'C4', 'F4']), 'Bb7': ('Bb1', 'F2', ['Ab3', 'D4', 'F4']), 'D7': ('D2', 'A1', ['F#3', 'C4', 'D4']),
      'G7': ('G2', 'D2', ['F3', 'B3', 'D4']), 'C7': ('C2', 'G1', ['E3', 'Bb3', 'C4']), 'Gm': ('G2', 'D2', ['Bb3', 'D4', 'G4']),
      'Dm': ('D2', 'A1', ['F3', 'A3', 'D4']), 'A7': ('A1', 'E2', ['G3', 'C#4', 'E4']), 'Bb': ('Bb1', 'F2', ['F3', 'Bb3', 'D4']),
      'G': ('G2', 'D2', ['B3', 'D4', 'G4']), 'C': ('C2', 'G1', ['E3', 'G3', 'C4']), 'E7': ('E2', 'B1', ['G#3', 'D4', 'E4']), 'Eb7': ('Eb2', 'Bb1', ['G3', 'Db4', 'Eb4']), 'Gm7': ('G2', 'D2', ['F3', 'Bb3', 'D4'])}
def tr(c, k):   # transpose a chord tuple by k semitones
    r, f, tri = CH[c]; return (up(r, k), up(f, k), [up(p, k) for p in tri])
def ch(c, k=0): return tr(c, k) if k else CH[c]

def stride(sec, b, chords, vel=.6, k=0, beats=(1, 2, 3, 4)):
    L = BEATLEN(sec)
    for bt in beats:
        c = chords[0] if bt <= 2 else chords[1]; root, fifth, tri = ch(c, k); t = bar(sec, b, bt)
        if bt in (1, 3):
            p = root if bt == 1 else fifth
            put('piano', nt('upright', p, L * .8, vel), t, .9, -.15); put('piano', nt('upright', up(p), L * .8, vel * .85), t, .7, -.15)
        else:
            for p in tri: put('piano', nt('upright', p, L * .35, vel * .8), t, .55, .1)
def oompah(sec, b, chords, vel=.6, k=0, banjo=True):
    L = BEATLEN(sec)
    for bt in (1, 3):
        c = chords[0] if bt == 1 else chords[1]; root, fifth, tri = ch(c, k)
        p = root if bt == 1 else fifth; p = up(p) if S.midi(p) < 36 else p
        put('banjo_tuba', nt('tuba_stac', p, L * .6, vel), bar(sec, b, bt), 1.25, -.1)
    if banjo:
        for bt in (2, 4):
            c = chords[0] if bt == 2 else chords[1]; tri = ch(c, k)[2]
            put('banjo_tuba', PL.strum('banjo', [up(p) for p in tri] + [up(tri[0], 24)], L * .5, vel * .9, spread=.012), bar(sec, b, bt) - .012, .55, .35)
def brush(sec, b, vel=.5, beats=(1, 2, 3, 4)):
    L = BEATLEN(sec); rng = np.random.default_rng(int(b * 13 + SEC[sec]['t'] * 7))
    for bt in beats:
        n = int(L * .9 * SR); w = sosfilt(butter(2, [1800, 7000], 'band', fs=SR, output='sos'), rng.standard_normal(n))
        e = np.linspace(0, 1, n) ** .5 * np.exp(-np.linspace(0, 4, n)); put('drums_fx', (w * e * .05 * vel).astype(np.float32), bar(sec, b, bt), 1, .05)
        if bt in (2, 4): put('drums_fx', S.hit('snare2', 'taps', vel * .7), bar(sec, b, bt), .9, 0)
def backbeat(sec, b, vel=.6):
    for bt in (2, 4): put('drums_fx', S.hit('snare', 'on', vel), bar(sec, b, bt), .8, 0)
    for bt in (1, 3): put('drums_fx', S.hit('bass_drum', None, vel * .8), bar(sec, b, bt), .9, 0)
def roll(t0, t1, v0=.3, v1=.8):
    d = t1 - t0; x = S.hit('snare', 'roll', .8)
    if len(x) < d * SR: x = np.concatenate([x] * int(np.ceil(d * SR / len(x) + 1)))
    x = x[:int(d * SR)].copy(); x *= np.linspace(v0, v1, len(x), dtype=np.float32); x[-240:] *= np.linspace(1, 0, 240); put('drums_fx', x, t0, 1.0, 0)
def cymbal(t, vel=.8, short=False, pan=.1):
    put('drums_fx', S.hit('clash', 'short') if short else S.hit('crash', None, vel), t - .012, .75 if not short else .9, pan); ACC.append(round(t, 4))
def slide(t0, d, f0, f1, vel=.25, curve=1.0):
    n = int(d * SR); u = np.linspace(0, 1, n) ** curve
    f = f0 * (f1 / f0) ** u * (1 + .006 * np.sin(2 * np.pi * 6 * np.arange(n) / SR)); ph = 2 * np.pi * np.cumsum(f) / SR
    br = sosfilt(butter(2, [1500, 5000], 'band', fs=SR, output='sos'), np.random.default_rng(3).standard_normal(n)) * .08
    env = np.minimum(1, np.arange(n) / (.03 * SR)) * np.minimum(1, (n - np.arange(n)) / (.05 * SR))
    put('drums_fx', ((np.sin(ph) + .12 * np.sin(2 * ph) + br) * env * vel).astype(np.float32), t0, 1, .2)
def wood(t, vel=.6, v='c', pan=.25): put('drums_fx', S.hit('woodblock', v, vel), t, 1.0, pan)
def mel(inst, t0, beatlen, notes, vel=.72, pan=0., stem='reeds', legato=.95, gain=1.0, shift=0):
    for off, d, p in notes:
        if p is None: continue
        put(stem, nt(inst, up(p, shift) if shift else p, d * beatlen * legato, vel), t0 + off * beatlen, gain, pan)
def wah(t, p, d, vel=.8):   # plunger-muted trumpet "wah": time-varying low-pass 350 → 2600 Hz
    x = nt('trumpet_mute', p, d, vel, release=.12); n = len(x); cut = np.full(n, 2600.0); a = int(.12 * SR); cut[:a] = np.linspace(350, 2600, a)
    y = np.zeros(n, np.float32); zi = np.zeros((1, 2))
    for s0 in range(0, n, 256):
        seg_, zi = sosfilt(butter(1, float(cut[s0]), 'low', fs=SR, output='sos'), x[s0:s0 + 256], zi=zi); y[s0:s0 + 256] = seg_
    put('brass', y, t - .02, 2.2, .15)
def smear(t, p0, p1, d, vel=.75):   # trombone smear: a sustained note bent by resampling
    x = S.note('trombone', p0, d, vel); n = len(x); ratio = 2 ** ((S.midi(p1) - S.midi(p0)) / 12)
    pos = np.cumsum(np.ones(n) * (1 + (ratio - 1) * np.clip(np.arange(n) / (n * .7), 0, 1))); pos = pos[pos < n - 1]
    i0 = pos.astype(int); fr = pos - i0; y = x[i0] * (1 - fr) + x[i0 + 1] * fr
    put('brass', y.astype(np.float32), t - .02, 1.1, -.05)

# —— the theme (F major, blue third), 16 beats ——
THEME = [(0, .75, 'F5'), (.75, .25, 'Ab5'), (1, .5, 'A5'), (1.5, 1, 'C6'), (2.5, .5, 'A5'), (3, 1, 'F5'),
         (4, .5, 'D6'), (4.5, .5, 'C6'), (5, 1, 'Ab5'), (6, .5, 'F5'), (6.5, 1.5, 'D5'),
         (8, .5, 'C5'), (8.5, .5, 'D5'), (9, .5, 'F5'), (9.5, .5, 'F#5'), (10, 1, 'A5'), (11, 1, 'F#5'),
         (12, .5, 'G5'), (12.5, 1, 'Bb5'), (13.5, .5, 'A5'), (14, .5, 'G5'), (14.5, .5, 'E5'), (15, 1, 'F5')]
THEME_CH = [['F', 'F'], ['Bb7', 'Bb7'], ['F', 'D7'], ['G7', 'C7']]
BRIDGE_CH = [['Bb', 'Bb'], ['F', 'F'], ['G7', 'G7'], ['C7', 'C7']]
BRIDGE = [(0, .5, 'D5'), (.5, .5, 'F5'), (1, 1, 'Bb5'), (2, .5, 'A5'), (2.5, 1.5, 'F5'), (4, .5, 'C5'), (4.5, .5, 'F5'), (5, 1, 'A5'), (6, 2, 'C6'),
          (8, .5, 'B5'), (8.5, .5, 'A5'), (9, .5, 'G5'), (9.5, .5, 'F5'), (10, 2, 'D5'), (12, .5, 'E5'), (12.5, .5, 'G5'), (13, .5, 'Bb5'), (13.5, .5, 'C6'), (14, 2, 'E5')]
def part(notes, lo, hi): return [(o - lo, d, p) for o, d, p in notes if lo <= o < hi]

# ======================= TITLE (0–4 s, 120): fanfare on the theme's first bar, letters hop =======================
L = BEATLEN('title')
mel('trumpet', 0, L, part(THEME, 0, 4), .8, .2, 'brass'); mel('clarinet', 0, L, part(THEME, 0, 4), .65, -.25, 'reeds', shift=-12, gain=.6)
stride('title', 1, ['F', 'F'], .6); oompah('title', 1, ['F', 'F'], .6); backbeat('title', 1, .5)
roll(bar('title', 2), bar('title', 2, 4), .2, .7)
put('brass', S.chord('trumpet_stac', ['A4', 'C5', 'F5'], L * .5, .85), bar('title', 2, 4), .9, .2); cymbal(bar('title', 2, 4), .6)
slide(bar('title', 2, 1), L * 2.6, 520, 1800, .22)
ACC.append(HIT['title'])

# ======================= SLEEPY (72): lazy two-feel, low clarinet theme, the band answers the yawn / nod / snore =======================
sl = SEC['sleepy']['t']; L = BEATLEN('sleepy'); nb = int((SEC['countin']['t'] - sl) / (4 * L)) + 1
for b in range(1, nb + 1):
    c = THEME_CH[(b - 1) % 4]; t0 = bar('sleepy', b)
    if t0 >= SEC['countin']['t'] - .05: break
    root, fifth, tri = CH[c[0]]
    put('banjo_tuba', nt('tuba_stac', up(root) if S.midi(root) < 36 else root, L * .7, .45), t0, 1.2, -.1)
    put('piano', S.chord('upright', tri, L * 1.6, .38, strum=.03), t0 + L, .55, .05)
    put('banjo_tuba', nt('tuba_stac', up(fifth) if S.midi(fifth) < 36 else fifth, L * .7, .4), t0 + 2 * L, 1.0, -.1)
    put('piano', S.chord('upright', tri, L * 1.6, .34, strum=.03), t0 + 3 * L, .5, .05)
    brush('sleepy', b, .3, beats=(2, 4))
mel('clarinet', bar('sleepy', 2), L, [(o, d, up(p, -12)) for o, d, p in part(THEME, 0, 8)], .5, -.2, 'reeds', legato=.98, gain=1.0)
smear(HIT['yawn'], 'F2', 'C3', 1.4, .7)                             # the yawn (trombone smear up)
for t in [HIT['nod']]: put('banjo_tuba', nt('tuba', 'F1' if False else 'C2', 1.2, .6), t, 1.2, -.1); slide(HIT['nod'] - .4, .4, 900, 300, .18)
put('reeds', nt('clarinet_stac', 'C6', .2, .5), HIT['wake'], .7, -.25); put('reeds', nt('clarinet_stac', 'E6', .2, .5), HIT['wake'] + .12, .7, -.25)
mel('clarinet_stac', B('sleepy', 0) + (SEC['countin']['t'] - sl) - 3.0, .16, [(i, 1, p) for i, p in enumerate(['C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'Bb5', 'B5'])], .5, -.25, 'reeds', gain=.6)
# count-in: woodblocks are Foley ('tap'); the band takes a breath and a pickup roll on the last tap
roll(B('countin', 3), B('countin', 4), .2, .8); ACC.append(round(B('countin', 0), 4))

# ======================= NUMBER (120): the kitchen number, 20 bars =======================
nm = 'number'; L = BEATLEN(nm)
form = [THEME_CH, THEME_CH, BRIDGE_CH, THEME_CH, THEME_CH]          # 20 bars (bars 1–17 full band, 18–20 the rat: thin)
for b in range(1, 21):
    c = form[(b - 1) // 4][(b - 1) % 4]
    if b <= 17:
        stride(nm, b, c, .64); oompah(nm, b, c, .64); backbeat(nm, b, .55)
        for bt in np.arange(1, 5, .5): put('drums_fx', S.hit('snare2', 'taps', .3), bar(nm, b, bt), .45, -.05)
    else:   # the rat tiptoes: tuba staccato on the beat, sneaky low clarinet, no drums
        for bt in (1, 2, 3, 4): put('banjo_tuba', nt('tuba_stac', ['F2', 'C3', 'Db3', 'C3'][bt - 1], L * .35, .45), bar(nm, b, bt), 1.0, -.1)
        mel('clarinet_stac', bar(nm, b), L, [(0, .5, 'F4'), (1, .5, 'Ab4'), (2, .5, 'A4'), (3, .5, 'Ab4')], .45, -.25, 'reeds', gain=.8)
cymbal(B(nm, 0), .85); ACC.append(round(B(nm, 0), 4))
# bars 1–4 (wide): clarinet + trumpet theme
mel('clarinet', bar(nm, 1), L, THEME, .72, -.25, 'reeds', gain=.9); mel('trumpet', bar(nm, 1), L, THEME, .7, .2, 'brass', shift=-12, gain=.5)
# bars 3–4 (the pin rolls, s11): trombone smears answer each roll
for k in range(4): smear(bar(nm, 3) + k * 2 * L * 2 / 2, ['C3', 'F3', 'A2', 'C3'][k], ['F3', 'C3', 'C3', 'F3'][k], L * 1.6, .7)
# bars 5–6.5 (the cleaver chops, s12): xylophone eighths
for i in range(12): put('xylo', nt('xylophone', ['F5', 'A5', 'C6', 'A5'][i % 4], .25, .8), B(nm, 16 + i * .5), 1.0, .15)
# bars 6.5–8.5 (pleating, s13): muted trumpet theme, clarinet fills on each pleat
mel('trumpet_mute', bar(nm, 6, 3), L, part(THEME, 0, 8), .75, .2, 'brass', gain=1.4)
for i in range(6): put('reeds', nt('clarinet_stac', ['C6', 'D6', 'F6'][i % 3], L * .3, .55), B(nm, 22 + i + .5), .6, -.25)
for t in (B(nm, 28), B(nm, 29)): slide(t - .3, .3, 700, 1500, .16)       # buns hop into the steamer
# bars 9–12 (bridge: the steamers breathe, the kettle crowns the best bun): clarinet + trombone
mel('clarinet', bar(nm, 9), L, BRIDGE, .7, -.25, 'reeds')
mel('trombone', bar(nm, 9), L, [(o, d, up(p, -12)) for o, d, p in BRIDGE], .55, -.05, 'brass', gain=.5)
put('xylo', nt('xylophone', 'F6', .8, .9), HIT['bestbun'], 1.0, .15); put('xylo', nt('xylophone', 'C7', .8, .8), HIT['bestbun'] + .06, .8, .15); ACC.append(HIT['bestbun'])
# bar 12.5 (the newsboy's stomach): muted trumpet wah-wah-waaah answers the growl
for i, (p, d) in enumerate([('Bb4', .4), ('A4', .4), ('Ab4', 1.1)]): wah(HIT['growl'] + i * .5, p, d)
ACC.append(HIT['growl'])
# bars 13–16 (OTS view + the peak): full out, trumpet lead, the trombone (the dough trombone) blows a smear on the peak
mel('trumpet', bar(nm, 13), L, THEME, .85, .2, 'brass'); mel('clarinet', bar(nm, 13), L, THEME, .65, -.25, 'reeds', shift=12, gain=.5)
mel('trumpet', bar(nm, 15), L, part(THEME, 0, 8), .9, .2, 'brass'); smear(B(nm, 57), 'F2', 'F3', 1.6, .85)
cymbal(HIT['peak'], .9); ACC.append(HIT['peak'])
for b in range(15, 17):
    for bt in (1, 2, 3, 4): put('drums_fx', S.hit('bass_drum', None, .6), bar(nm, b, bt), .7, 0)   # the whole kitchen on the beat
# bar 17: the clock still at 4 — the band falls quiet to one stride bar + a cuckoo-ish xylophone pair
put('xylo', nt('xylophone', 'C6', .3, .6), B(nm, 64), .8, .15); put('xylo', nt('xylophone', 'A5', .4, .6), B(nm, 64.5), .8, .15)
# the grab: stinger
put('brass', S.chord('trumpet_stac', ['F#4', 'C5', 'Eb5'], L * .5, .9), HIT['grab'], 1.0, .2); cymbal(HIT['grab'], short=True)

# ======================= STOP (the kettle sees): hard silence; the whistle is Foley =======================
# ======================= CHASE (144, D minor quickstep) =======================
cs = 'chase'; L = BEATLEN(cs); nbar = int(round((SEC['solo']['t'] - SEC[cs]['t']) / (4 * L)))
CHASE_CH = [['Dm', 'Dm'], ['A7', 'A7'], ['Dm', 'Gm'], ['A7', 'Dm']]
for b in range(1, nbar + 1):
    c = CHASE_CH[(b - 1) % 4]
    stride(cs, b, c, .7); oompah(cs, b, c, .7); backbeat(cs, b, .7)
    for bt in np.arange(1, 5, .5): put('drums_fx', S.hit('snare2', 'taps', .35), bar(cs, b, bt), .5, -.05)
cymbal(B(cs, 0), .9); ACC.append(round(B(cs, 0), 4))
MIN = [(o, d, {'F5': 'F5', 'Ab5': 'Ab5', 'A5': 'A5', 'C6': 'D6', 'D6': 'E6', 'Ab5': 'Bb5', 'D5': 'D5', 'C5': 'C#5', 'F#5': 'G5', 'G5': 'G5', 'Bb5': 'Bb5', 'E5': 'E5'}.get(p, p)) for o, d, p in THEME]
mel('trumpet', bar(cs, 1), L, MIN, .85, .2, 'brass'); mel('clarinet', bar(cs, 5), L, MIN, .75, -.25, 'reeds', shift=12, gain=.6)
for i in range(16): put('xylo', nt('xylophone', ['D6', 'F6', 'A6', 'F6'][i % 4], .2, .7), B(cs, 8 + i * .5), .8, .15)    # the climb (s24)
cymbal(HIT['topple'], 1.0); slide(HIT['topple'], 1.4, 1900, 260, .3, curve=.8); put('banjo_tuba', nt('tuba', 'D2', 1.0, .8), HIT['topple'] + .9, 1.3, -.1); ACC.append(HIT['topple'])
mel('trumpet', bar(cs, 9), L, MIN, .9, .2, 'brass', shift=-12, gain=.7)
for k in range(7):   # each catch = a xylophone note, rising
    t = HIT[f'catch{k}']; put('xylo', nt('xylophone', ['D6', 'E6', 'F6', 'G6', 'A6', 'Bb6', 'C7'][k], .4, .9), t, 1.1, .15); ACC.append(t)
put('xylo', nt('xylophone', 'D7', .8, .95), SEC['solo']['t'] - 1.6, 1.1, .15)

# ======================= SOLO (free): the lone clarinet; then nothing on the knock =======================
so = SEC['solo']['t']; Ls = .9
mel('clarinet', so + 2.6, Ls, [(o * 1.0, d, p) for o, d, p in part(THEME, 0, 8)], .5, 0, 'reeds', legato=.98, gain=1.05)
mel('clarinet', so + 2.6 + 9.5 * Ls - 1.4, Ls, [(0, 1.2, 'F5'), (1.3, 1.2, 'E5'), (2.6, 2.4, 'D5')], .45, 0, 'reeds', legato=.98, gain=.95)

# ======================= WARM (72): the door opens; piano + clarinet, the band comes back softly; the dawn swell =======================
wm = 'warm'; L = BEATLEN(wm)
for b in range(1, 5):
    c = THEME_CH[(b - 1) % 4]; t0 = bar(wm, b)
    if t0 >= SEC['ring']['t'] - .1: break
    root, fifth, tri = CH[c[0]]
    put('piano', S.chord('upright', [root] + tri, L * 1.8, .4, strum=.025), t0, .65, 0)
    put('piano', S.chord('upright', [fifth] + CH[c[1]][2], L * 1.8, .36, strum=.025), t0 + 2 * L, .6, 0)
    if b >= 2: put('banjo_tuba', nt('tuba', up(root) if S.midi(root) < 36 else root, L * 1.8, .4), t0, .9, -.1)
mel('clarinet', bar(wm, 1), L, part(THEME, 0, 8), .55, -.15, 'reeds', legato=.98)
mel('trumpet_mute', bar(wm, 3), L, part(THEME, 8, 16), .55, .2, 'brass', gain=1.0)
ACC.append(round(B(wm, 0), 4))
dawn = SEC['ring']['t'] - 2.4
roll(dawn, SEC['ring']['t'] - .05, .1, .7); put('drums_fx', S.hit('crash', None, .5), dawn, .4, .1)
for i in range(10): put('xylo', nt('xylophone', S.name(72 + i * 2), .2, .55), dawn + .2 + i * .17, .6, .15)    # the hands spin
put('brass', S.chord('trumpet', ['A4', 'C5', 'F5'], 1.2, .7), SEC['ring']['t'] - 1.2, .6, .2)

# ======================= RING: the bell (Foley); the band stops =======================
# ======================= FINALE (144, up a tone at the headline) =======================
fn = 'finale'; L = BEATLEN(fn); nbar = int(np.ceil((DUR - SEC[fn]['t']) / (4 * L)))
put('brass', S.chord('trumpet_stac', ['C5', 'F5', 'A5'], L * .5, .95), B(fn, 0), 1.0, .2); cymbal(B(fn, 0), .95); ACC.append(round(B(fn, 0), 4))
slide(B(fn, .5), .5, 400, 1700, .2)
for b in range(1, nbar + 1):
    k = 2 if b >= 5 else 0
    c = THEME_CH[(b - 1) % 4]
    stride(fn, b, c, .72, k=k); oompah(fn, b, c, .74, k=k); backbeat(fn, b, .72)
    for bt in (1, 2, 3, 4): put('drums_fx', S.hit('bass_drum', None, .55), bar(fn, b, bt), .6, 0)   # stomp: every beat
    if b in (1, 5, 9, 13): mel('trumpet', bar(fn, b), L, THEME, .9, .2, 'brass', shift=k); mel('clarinet', bar(fn, b), L, THEME, .7, -.25, 'reeds', shift=12 + k, gain=.5)
    if b in (5, 9): mel('trombone', bar(fn, b), L, [(o, d, up(p, -12 + k)) for o, d, p in THEME], .6, -.05, 'brass', gain=.6)
cymbal(bar(fn, 5), .9)
# the rat's gag (bars 12–13): just tuba + clarinet, then the final chord on the iris
t_end = HIT['iris']
put('brass', S.chord('trumpet', ['A4', 'C5', 'G5'], 1.6, .9), t_end, 1.0, .2)
put('reeds', nt('clarinet', 'A5', 1.6, .8), t_end, .7, -.25)
put('piano', S.chord('upright', ['G1', 'G2', 'D3', 'G3', 'B3', 'D4', 'G4'], 1.8, .8), t_end, .8, 0)
put('banjo_tuba', nt('tuba', 'G2', 1.6, .9), t_end, 1.4, -.1); cymbal(t_end, .9); put('drums_fx', S.hit('bass_drum', None, 1.0), t_end, 1.1, 0)

# ======================= gates (hard silences), room, balance =======================
for k in STEMS: buf[k] = S.room(buf[k], size=.22, mix=.14, damp=.6)
def gate(t0, t1, fade=.02):
    a, b_ = int(t0 * SR), int(min(DUR, t1) * SR); f = int(fade * SR)
    for k in STEMS:
        x = buf[k]; x[max(0, a - f):a] *= np.linspace(1, 0, min(f, a))[:, None]; x[a:b_] = 0
GATES = [(SEC['stop']['t'], SEC['chase']['t'] - .003, .02),                      # the kettle sees: band stop
         (SEC['solo']['t'] - .05, SEC['solo']['t'] + 2.55, .4),                  # the chase's tail → the empty lane
         (HIT['knock'] - .1, SEC['warm']['t'] - .003, .4),                       # the knock: nothing
         (SEC['ring']['t'], SEC['finale']['t'] - .003, .03)]                     # the ring: the band stops
for t0, t1, f in GATES: gate(t0, t1, f)
GAIN = {'brass': 1.0, 'reeds': 1.0, 'piano': 1.2, 'banjo_tuba': .95, 'drums_fx': .8, 'xylo': .9}
mix = np.zeros((N, 2), np.float32)
for k in STEMS: mix += buf[k] * GAIN[k]
mix *= .84 / float(np.quantile(np.abs(mix), .9999))
if np.abs(mix).max() > .89: mix = np.stack([limit(mix[:, 0], .89), limit(mix[:, 1], .89)], 1).astype(np.float32)
for t0, t1, f in GATES: mix[int(t0 * SR):int(min(DUR, t1) * SR)] = 0
sf.write(os.path.join(HERE, 'score.wav'), mix, SR, subtype='PCM_24')
m = mix.mean(1)
def band_db(lo, hi):
    F = np.fft.rfft(m); f = np.fft.rfftfreq(len(m), 1 / SR); tot = np.sum(np.abs(F) ** 2); return float(round(10 * np.log10(np.sum(np.abs(F[(f >= lo) & (f < hi)]) ** 2) / tot + 1e-12), 2))
INST = ['upright', 'clarinet', 'clarinet_stac', 'trumpet', 'trumpet_stac', 'trumpet_mute', 'trombone', 'tuba', 'tuba_stac', 'xylophone', 'snare', 'snare2', 'bass_drum', 'crash', 'clash', 'woodblock']
out = {'accents': sorted(set(round(a, 4) for a in ACC)), 'gates': GATES, 'band_db': {'20-120': band_db(20, 120), '120-500': band_db(120, 500), '500-2k': band_db(500, 2000), '2k-8k': band_db(2000, 8000)},
       'credits': S.credits(INST)}
json.dump(out, open(os.path.join(HERE, 'score.json'), 'w'), indent=1, ensure_ascii=False)
print('score.wav', round(DUR, 2), 's · accents', len(out['accents']), '· bands', out['band_db'])
