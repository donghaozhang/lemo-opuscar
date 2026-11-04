"""《江户猫追鱼记》 original score, built on the film's timeline (events.json: sections, hit points, shots).
Instruments: shamisen (modelled pluck with sawari), shakuhachi (recorder/flute samples reshaped: vibrato removed, slides,
meri drops, breath), koto (modelled pluck), taiko/ōdaiko + shime-daiko (samples + synthesised skin), hyōshigi, rin bell.
Instrument recipes adapted from the library's ukiyo-e demo; the music itself is new.
Run: $LIB/.venv/bin/python films/edo-cat/music/score.py  → music/score.wav, music/stems/*.wav, music/cues.json
"""
import sys, os, json
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '../../..'))
sys.path.insert(0, LIB)
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
from core.audio import sampler as S, pluck as P
from core.audio.sfx import SR, add

E = json.load(open(os.path.join(HERE, '..', 'events.json')))
DUR = E['dur']; N = int((DUR + 1) * SR)
SEC = {e['id']: e for e in E['ev'] if e['type'] == 'sec'}
HIT = {e['id']: e['t'] for e in E['ev'] if e['type'] == 'hit'}
SHOT = {e['id']: (e['t'], e['t1']) for e in E['ev'] if e['type'] == 'shot'}
def B(sec, n): s = SEC[sec]; return s['t'] + n * 60 / s['bpm']
def bt(sec): return 60 / SEC[sec]['bpm']
rng = np.random.default_rng(1703); S.seed(17)
def bpf(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)
def lpf(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hpf(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
stems = {k: np.zeros((N, 2), np.float32) for k in ['shamisen', 'shakuhachi', 'koto', 'taiko', 'perc']}
CUES = []
def put(k, x, t, g=1.0, pan=0.0, cue=None):
    if t < 0 or t >= DUR: return
    add(stems[k], x, t, g, pan)
    if cue: CUES.append({'t': round(t, 4), 'stem': k, 'cue': cue})

# ——————————— instruments ———————————
def hyoshigi(v=1.0):
    L = int(.5 * SR); t = np.arange(L) / SR; y = np.zeros(L)
    for f, a, tau in [(1180, 1., .05), (2460, .7, .035), (3870, .45, .022), (5300, .25, .012), (760, .35, .07)]: y += a * np.sin(2 * np.pi * f * t + rng.random() * 6) * np.exp(-t / tau)
    y += 1.6 * bpf(rng.standard_normal(L) * np.exp(-t / .0018), 1500, 9000); y /= np.abs(y).max()
    s1 = S.hit('world_perc', 'claves', .9); s2 = S.hit('woodblock', 'a', .9)
    out = np.zeros(L); out[:min(L, len(s1))] += s1[:L] / (np.abs(s1).max() + 1e-9) * .8; out[:min(L, len(s2))] += s2[:L] / (np.abs(s2).max() + 1e-9) * .45
    out += y * .9; d = int(.003 * SR); out[d:] += .35 * out[:-d]
    return (out / np.abs(out).max() * .85 * v).astype(np.float32)
_odc = {}
def odaiko(v=1.0, big=False):
    L = int(2.4 * SR); t = np.arange(L) / SR
    f = 58 + 62 * np.exp(-t / .045); ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / (.6 if big else .42)) + .35 * np.sin(1.59 * ph + 1) * np.exp(-t / .22) + .18 * np.sin(2.14 * ph) * np.exp(-t / .12)
    syn = body + bpf(rng.standard_normal(L), 90, 900) * np.exp(-t / .02) * .8 + bpf(rng.standard_normal(L), 1200, 5000) * np.exp(-t / .004) * .25
    out = syn / np.abs(syn).max() * .85
    for inst, var, g in [('gran_cassa', 'hit', .55), ('toms', 'low_mallet', .35), ('frame_drum', 'large', .3)]:
        s = S.hit(inst, var, min(1, .55 + .45 * v)); s = s[:L] / (np.abs(s).max() + 1e-9); out[:len(s)] += s * g
    out = lpf(out, 3500); return (out / np.abs(out).max() * v).astype(np.float32)
def cut(x, d):
    n = int(d * SR)
    if n >= len(x): return x
    x = x[:n].copy(); k = min(n, int(.06 * SR)); x[-k:] *= np.linspace(1, 0, k); return x
def shime(v=.6):
    L = int(.5 * SR); t = np.arange(L) / SR
    f = 390 + 140 * np.exp(-t / .01); ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sin(ph) * np.exp(-t / .07) + .5 * bpf(rng.standard_normal(L), 800, 4000) * np.exp(-t / .006)
    s = S.hit('frame_drum', 'small_muted', .7); s = s[:L] / (np.abs(s).max() + 1e-9)
    y = y / np.abs(y).max() * .7; y[:len(s)] += s * .5
    return (y / np.abs(y).max() * v).astype(np.float32)
def tsuzumi(v=.7):   # kotsuzumi "pon": a bright pitched skin with a quick upward pitch flick
    L = int(.7 * SR); t = np.arange(L) / SR; f = 420 + 120 * (1 - np.exp(-t / .03)); ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sin(ph) * np.exp(-t / .16) + .3 * np.sin(2.3 * ph) * np.exp(-t / .05) + .4 * bpf(rng.standard_normal(L), 1500, 6000) * np.exp(-t / .004)
    return (y / np.abs(y).max() * v).astype(np.float32)
def rin(v=.6, f0=1046):   # small temple bowl bell
    L = int(5 * SR); t = np.arange(L) / SR; y = np.zeros(L)
    for r, a, tau in [(1, 1, 3.2), (2.71, .55, 1.7), (5.15, .3, .8), (8.4, .15, .4), (1.003, .6, 3.0)]: y += a * np.sin(2 * np.pi * f0 * r * t) * np.exp(-t / tau)
    y[:int(.003 * SR)] += rng.standard_normal(int(.003 * SR)) * .2
    return (y / np.abs(y).max() * v).astype(np.float32)
def sam(p, v=.7, dur=None, **kw):
    kw.setdefault('buzz', .7); return P.pluck('shamisen', p, dur, v, **kw)
def koto(p, v=.6, dur=None, **kw): return P.pluck('koto', p, dur, v, **kw)
def _f0track(y, f):
    hop, Nw = 480, 2048; out = []
    for s in range(0, max(1, len(y) - Nw), hop):
        fr = y[s:s + Nw] * np.hanning(Nw); sp = np.abs(np.fft.rfft(fr, 8 * Nw)); fq = np.fft.rfftfreq(8 * Nw, 1 / SR)
        m = (fq > f * .85) & (fq < f * 1.18); out.append(fq[m][np.argmax(sp[m])] if sp[m].max() > 1e-6 else f)
    return np.array(out), hop
def shaku(p, dur, v=.7, slide=-1.5, fall=0.0, kari=0.0, swell=.5, breath=1.0, rel=.35, bend=None):
    m = S.midi(p); f = 440 * 2 ** ((m - 69) / 12); ext = dur + rel + .8
    a = S.note('recorder', max(m, S.midi('F4') - 3), ext, .7, release=.2); b = S.note('flute', max(m, S.midi('C4')), ext, .6, release=.2)
    n = min(len(a), len(b)); y = (.62 * a[:n] / (np.abs(a).max() + 1e-9) + .38 * b[:n] / (np.abs(b).max() + 1e-9)).astype(np.float64)
    w = int(.06 * SR); e = np.sqrt(np.convolve(y ** 2, np.ones(w) / w, 'same')) + 1e-4; e = np.convolve(e, np.ones(w) / w, 'same'); y = y / e
    y[:int(.03 * SR)] *= np.linspace(0, 1, int(.03 * SR))
    tr, hop = _f0track(y, f); dev = np.clip(12 * np.log2(tr / np.median(tr[3:])), -.6, .6)
    tt = np.arange(n) / SR; devs = np.interp(tt, np.arange(len(dev)) * hop / SR + 1024 / SR, dev)
    L = int((dur + rel) * SR); to = np.arange(L) / SR; bnd = np.zeros(L)
    # the sample sounds at max(m, F4-3): shift the whole note down to the written pitch
    base = 12 * np.log2(f / (440 * 2 ** ((max(m, S.midi('F4') - 3) - 69) / 12)))
    if slide: sl = .16; bnd += np.where(to < sl, slide * (1 - np.sin(np.clip(to / sl, 0, 1) * np.pi / 2)), 0)
    if fall: k = np.clip((to - (dur - .45)) / .5, 0, 1); bnd += fall * k * k
    if kari: k = np.clip((to - (dur - .3)) / .3, 0, 1); bnd += kari * np.sin(k * np.pi / 2)
    if bend: bnd += np.interp(to, [b_[0] for b_ in bend], [b_[1] for b_ in bend])
    dv = np.interp(to + .05, tt, devs)
    phase = .05 * SR + np.concatenate([[0], np.cumsum(2 ** ((bnd[:-1] + base - dv[:-1]) / 12))]); phase = np.minimum(phase, n - 2)
    z = np.interp(phase, np.arange(n), y)
    at = .12; envl = np.clip(to / at, 0, 1) ** 1.6; mid = 1 + swell * np.sin(np.clip(to / max(dur, .1), 0, 1) * np.pi) ** 1.5 * .8
    relk = np.clip((to - dur) / rel, 0, 1); envl = envl * mid * (1 - relk) ** 2; z = z * envl
    z = lpf(z, 3200) * .8 + bpf(z, 900, 1600) * .5
    nz = bpf(rng.standard_normal(L), 1000, 4000, 3); be = .22 * envl + .9 * np.exp(-np.clip(to, 0, None) / .07) * np.clip(to / .012, 0, 1)
    z = z / (np.abs(z).max() + 1e-9) + breath * .5 * nz / (np.abs(nz).max() + 1e-9) * be
    z[-min(len(z), 480):] *= np.linspace(1, 0, min(len(z), 480))
    return (z / (np.abs(z).max() + 1e-9) * v).astype(np.float32)
def gliss(notes, t0, step, k='koto', v=.5, g=.9, pan=0., cue=None):
    for i, p in enumerate(notes): put(k, (koto if k == 'koto' else sam)(p, v * (.8 + .2 * i / len(notes))), t0 + i * step, g, pan + (i / len(notes) - .5) * .4, cue if i == 0 else None)
IN = ['D', 'Eb', 'G', 'A', 'Bb']                      # miyako-bushi (in) on D
def scale(lo, hi, sc=IN):
    out = []
    for o in range(1, 8):
        for n in sc:
            m = S.midi(f'{n}{o}')
            if S.midi(lo) <= m <= S.midi(hi): out.append(f'{n}{o}')
    return out

# ================= A · dawn market (90 bpm) =================
b = bt('A')
put('perc', hyoshigi(.9), B('A', 0), 1, -.2, 'hyōshigi 1'); put('perc', hyoshigi(1), B('A', 1), 1, .2, 'hyōshigi 2')
PIZ = ['D3', 'A2', 'D3', 'Eb3', 'D3', 'A2', 'G2', 'A2']
for i in range(2, 12): put('shamisen', sam(PIZ[i % 8], .42, .22, t60=.5), B('A', i), .8, -.15, 'pizz ostinato' if i == 2 else None)
for i in range(3, 12, 2): put('perc', shime(.22), B('A', i), .6, .3)
put('shamisen', sam('D5', .7, t60=.8, buzz=.5), SHOT['s02'][0] + 1.55, .9, .2, 'seal: chin')
put('koto', P.strum('koto', scale('D4', 'D6'), None, .45, spread=.035), SHOT['s02'][0], .6, .0, 'koto: the view opens')
put('shakuhachi', shaku('A4', 1.5, .62, slide=-2, swell=.6), SHOT['s02'][0] + .6, 1, .1, 'cat motif')
put('shakuhachi', shaku('Bb4', .42, .5, slide=0, swell=.1, breath=.7), SHOT['s02'][0] + 2.2, 1, .1)
put('shakuhachi', shaku('A4', .9, .55, slide=0, fall=-1.2, swell=.3), SHOT['s02'][0] + 2.62, 1, .1)
put('shakuhachi', shaku('G4', 1.3, .5, slide=-1, swell=.4), SHOT['s02'][0] + 3.7, 1, .1)
for i in range(12, 16): put('shamisen', sam(PIZ[i % 8], .3, .2, t60=.4), B('A', i), .7, -.15)
put('shakuhachi', shaku('D4', 2.2, .42, slide=-1, swell=.8, breath=.9, rel=.5), SHOT['s03'][0] + .3, 1, .05, 'kitten: low ro')
for i, p in enumerate(['D5', 'A4', 'Bb4']): put('koto', koto(p, .4), SHOT['s04'][0] + .2 + i * b, .7, .25, 'koto: kitten' if i == 0 else None)
for i, p in enumerate(['D3', 'Eb3', 'G3', 'A3']): put('shamisen', sam(p, .5 + i * .05, .3), B('A', 19 + i), .85, -.1, 'resolve: rising' if i == 0 else None)
put('shamisen', sam('D4', .7, .5, buzz=.9), B('A', 23), .9, -.1); put('perc', shime(.4), B('A', 23), .7, .3)
for k in range(6):
    t = B('A', 23) + .1 + k * .07; put('perc', shime(.15 + k * .03), t, .6, .3)
# sneak: one pizz per paw (each beat), a soft koto tiptoe on the off-beats
SNK = ['D3', 'Eb3', 'D3', 'A2', 'D3', 'Eb3']
for k in range(6): put('shamisen', sam(SNK[k], .48, .2, t60=.45), SHOT['s06'][0] + k * b, .85, -.1, 'sneak steps' if k == 0 else None)
for k in range(5): put('koto', koto(['A5', 'G5', 'A5', 'Bb5', 'A5'][k], .22), SHOT['s06'][0] + (k + .5) * b, .45, .3)
# the yawn
put('shakuhachi', shaku('G4', 1.6, .62, slide=-3, swell=.8, bend=[(0, 0), (.5, 5), (1.0, 5), (1.6, 1)], breath=1.2), SHOT['s07'][0] + .15, 1, 0, 'yawn (shakuhachi bend)')
# the hook: tremolo, a held breath, the snap
tr = P.pluck('shamisen', 'D4', 1.25, .5, trem=12, buzz=.6, t60=1.0); tr = (tr * np.linspace(.15, 1, len(tr)) ** 1.5).astype(np.float32)
put('shamisen', tr, SHOT['s08'][0] + .05, .5, -.2, 'tremolo before the hook')
put('shamisen', sam('D5', 1.0, .4, buzz=1.0), HIT['hook'], 1.0, 0, 'HOOK snap'); put('perc', hyoshigi(.7), HIT['hook'], .8, .15)
for k, p in enumerate(['A4', 'G4', 'Eb4', 'D4']): put('shamisen', sam(p, .4, .15), HIT['hook'] + .35 + k * .17, .6, -.2)
# the freeze: one sawari note; ticks as the eyes slide
put('shamisen', sam('A3', .55, None, buzz=1.0, t60=2.0), SHOT['s09'][0], .8, 0, 'freeze: sawari A3')
for k in range(2): put('perc', shime(.2), SHOT['s09'][0] + .5 + k * .45, .6, .4)
# the take and the shout
put('perc', hyoshigi(1), HIT['take'], 1, -.1, 'TAKE: hyōshigi'); put('shamisen', P.strum('shamisen', ['D3', 'A3', 'D4'], .5, .9, spread=.012, buzz=.9), HIT['take'], .9, 0)
put('taiko', odaiko(.8), HIT['shout'], .9, 0, 'SHOUT: taiko')
# the dash: a fast rising run
for k, p in enumerate(['D3', 'Eb3', 'G3', 'A3', 'Bb3', 'D4', 'Eb4', 'G4', 'A4', 'D5']): put('shamisen', sam(p, .45 + k * .04, .12), SHOT['s11'][0] + .3 + k * .065, .8, -.3 + k * .06, 'dash run' if k == 0 else None)
for k in range(8): put('perc', shime(.2 + k * .03), SHOT['s11'][0] + .3 + k * .08, .6, .3)

# ================= B · the kite (90 bpm) =================
b = bt('B')
YO = ['D4', 'E4', 'G4', 'A4', 'B4', 'A4', 'G4', 'E4']
for k in range(4): put('shamisen', sam(YO[k], .55, .25, t60=.6), SHOT['s12'][0] + k * b / 2, .85, -.1, 'proud trot (yō)' if k == 0 else None)
put('shamisen', sam('B4', .5, .3), SHOT['s12'][0] + 4 * b / 2, .8, -.1)
CUES.append({'t': round(HIT['stop'], 4), 'stem': 'all', 'cue': 'STOP (ma)'})
put('taiko', odaiko(1.0, True), HIT['snatch'], 1.1, 0, 'SNATCH: ōdaiko'); put('perc', tsuzumi(.8), HIT['snatch'] - .12, .7, .3, 'kotsuzumi pon')
put('shamisen', P.strum('shamisen', ['D3', 'Eb3', 'A3'], .8, 1, spread=.01, buzz=1), HIT['snatch'], .8, 0)
tr = P.pluck('shamisen', 'D3', 2.6, .6, trem=13, buzz=.8, t60=1.2); tr = (tr * np.linspace(.2, 1, len(tr)) ** 1.3).astype(np.float32)
put('shamisen', tr, SHOT['s14'][0] + .1, .7, -.2, 'tension tremolo')
for k in range(16): put('perc', shime(.12 + k * .02), SHOT['s14'][0] + .1 + k * b / 4, .55, .3)
put('taiko', odaiko(.9), HIT['fury'], 1, 0, 'FURY'); put('shamisen', P.strum('shamisen', ['D3', 'Eb4', 'A4'], .6, .9, spread=.01), HIT['fury'], .8, 0)
t = SHOT['s16'][0]; g = .3
while t < SEC['C']['t'] - .05:
    put('taiko', cut(odaiko(.5 + .4 * (t - SHOT['s16'][0]) / 1.33), .3), t, .6, (rng.random() - .5) * .3, 'roll into the chase' if g == .3 else None); g = max(.07, g * .78); t += g
for k, tt in enumerate([0, .5, .85, 1.1, 1.25]): put('perc', hyoshigi(.6 + k * .08), SHOT['s16'][0] + tt, .8, (-.2, .2)[k % 2])

# ================= C · the chase (132 bpm) + C2 the pass (144 bpm) =================
def chase(sec, b0, b1, dens=1.0, melody=None, quiet=False):
    bb = bt(sec); pat = ['D4', 'A3', 'D4', 'Eb4', 'D4', 'A3', 'G3', 'A3']
    for i in range(int((b1 - b0) * 2)):
        t = B(sec, b0 + i / 2)
        if quiet:
            if i % 2 == 0: put('shamisen', sam(['D3', 'A2', 'Eb3', 'A2'][(i // 2) % 4], .4, .2, t60=.4), t, .75, -.1)
            continue
        acc = 1.0 if i % 2 == 0 else .72
        put('shamisen', sam(pat[i % 8], .52 * acc * dens, .2, buzz=.6), t, .78, -.12 + .2 * (i % 2))
        put('perc', shime(.28 * acc * dens), t, .55, .3)
        if i % 4 == 0: put('taiko', cut(odaiko(.6 * dens), .5), t, .62, 0)
    if melody:
        t = B(sec, b0)
        for p, d in melody:
            if p: put('shakuhachi', shaku(p, d * bb * .95, .55, slide=-1.2 if d >= 1 else 0, swell=.3, fall=-.8 if d >= 2 else 0), t, .95, .12)
            t += d * bb
M1 = [('A4', 1), ('B4', .5), ('D5', .5), ('E5', 1), ('D5', 1), ('B4', 1), ('A4', .5), ('G4', .5), ('A4', 2)]
M2 = [('D5', 1), ('E5', .5), ('D5', .5), ('B4', 1), ('A4', 1), ('G4', 1), ('E4', 1), ('A4', 2)]
def bc(id): s = SEC['C']; return (SHOT[id][0] - s['t']) / bt('C')
gliss(scale('D4', 'D6'), SHOT['s17'][0], .03, cue='koto gliss: rain')
chase('C', 0, bc('s23'), 1.0, None)
chase('C', bc('s18'), bc('s18'), 1, M1 + M2)                         # melody only
put('perc', hyoshigi(1), HIT['umbrella'], .9, .2, 'UMBRELLA'); put('taiko', odaiko(.8), HIT['umbrella'], .8, 0)
gliss(scale('G4', 'G6'), SHOT['s22'][0], .028, cue='koto gliss: snow')
chase('C', bc('s23'), bc('s25'), .7, None, quiet=True)
put('shakuhachi', shaku('D5', 1.6, .45, slide=-2, swell=.5, breath=1.2), SHOT['s24'][0] + .2, 1, .1, 'sly breath')
chase('C', bc('s25'), bc('s28'), 1.0, None)
put('taiko', odaiko(.9), HIT['bell'], .7, 0, 'BELL accent'); put('taiko', odaiko(1, True), HIT['snowdump'], 1, 0, 'SNOW DUMP')
gliss(scale('A3', 'A5'), SHOT['s28'][0], .03, cue='koto gliss: fields')
chase('C', bc('s28'), 85, 1.0, None)
chase('C', bc('s29'), bc('s29'), 1, M2 + M1[:5])
put('taiko', odaiko(1), HIT['splash'] + .2, .9, 0, 'SPLASH'); put('shamisen', sam('A4', .8, .8, bend=[(0, 0), (.6, -7)]), HIT['splash'] + .2, .8, -.1)
gliss(scale('D4', 'D6'), SHOT['s34'][0], .025, cue='koto gliss: pass')
chase('C2', 0, 22, 1.1, [('A4', 1), ('D5', 1), ('E5', 2), ('D5', 1), ('B4', 1), ('A4', 2), ('E5', 1), ('G5', 1), ('E5', 2), ('D5', 2), ('B4', 2), ('A4', 4)])
# summit: hyōshigi accelerate (the kabuki call), taiko roll swells to the sea reveal
t = SHOT['s38'][0]; g = .5
while t < SEC['D']['t'] - .05: put('perc', hyoshigi(.5 + .5 * (t - SHOT['s38'][0]) / 5), t, .8, (rng.random() - .5) * .4, 'hyōshigi accelerando' if g == .5 else None); g = max(.09, g * .86); t += g
t = SHOT['s39'][0]; g = .3
while t < SEC['D']['t'] - .03: k = (t - SHOT['s39'][0]) / 3.33; put('taiko', cut(odaiko(.4 + .6 * k), .3), t, .5 + .3 * k, (rng.random() - .5) * .3, 'roll to the sea' if g == .3 else None); g = max(.07, g * .9); t += g
tr = P.pluck('shamisen', 'A3', 3.3, .7, trem=14, buzz=.8, t60=1.0); tr = (tr * np.linspace(.1, 1, len(tr)) ** 1.6).astype(np.float32); put('shamisen', tr, SHOT['s39'][0], .7, -.2)

# ================= D · the wave (60 bpm heartbeat, free shakuhachi) =================
put('taiko', odaiko(1, True), SEC['D']['t'], 1.1, 0, 'THE SEA: ōdaiko'); gliss(scale('D3', 'D6'), SEC['D']['t'], .04, v=.6)
hb = []; t = SEC['D']['t'] + 1; g = 1.0
while t < HIT['silence'] - .05:
    hb.append(t); g = 1.0 if t < SHOT['s43'][0] else .75 if t < SHOT['s44'][0] else .55; t += g
for k, t in enumerate(hb): put('taiko', cut(odaiko(.45 + .4 * k / len(hb)), .7), t, .7, 0, 'heartbeat' if k == 0 else None)
AWE = [('D4', 2.8, -2, 0), ('A4', 2.2, -1.5, 0), ('Bb4', 1.2, 0, -1.0), ('A4', 2.4, 0, 0), ('D5', 1.8, -2, 0)]
t = SEC['D']['t'] + .6
for p, d, sl, fa in AWE: put('shakuhachi', shaku(p, d, .6, slide=sl, fall=fa, swell=.7, breath=1.1, rel=.5), t, 1, .08, 'awe phrase' if p == 'D4' else None); t += d + .25
put('perc', shime(.6), SHOT['s42'][0], .8, .3, 'spray'); gliss(scale('D4', 'D6')[::-1], SHOT['s42'][0] + .05, .03, v=.5)
for p in ['D4', 'A4']:
    tr = P.pluck('koto', p, HIT['silence'] - SHOT['s43'][0], .5, trem=11); tr = (tr * np.linspace(.15, 1, len(tr)) ** 1.4).astype(np.float32); put('koto', tr, SHOT['s43'][0], .6, (-.3, .3)[p == 'A4'], 'koto tremolo' if p == 'D4' else None)
CUES.append({'t': round(HIT['silence'], 4), 'stem': 'all', 'cue': 'SILENCE (music cut, tails too)'})
put('taiko', odaiko(1, True), HIT['catch'], 1.2, 0, 'CATCH: ōdaiko'); put('shamisen', sam('D3', .95, None, buzz=1.0, t60=3.0), HIT['catch'], 1, 0, 'catch: sawari D3')
put('koto', P.strum('koto', ['D4', 'A4', 'D5', 'A5'], None, .6, spread=.06), HIT['catch'] + .15, .7, .2)
put('taiko', odaiko(.9, True), HIT['crash'], 1, 0, 'CRASH')
t = HIT['crash'] + .2; g = .12
while t < HIT['crash'] + 1.4: put('taiko', cut(odaiko(.6 - (t - HIT['crash']) * .3), .25), t, .5, (rng.random() - .5) * .3); t += g
# the scroll rolls back: a long shamisen run + hyōshigi accelerando into the dusk
for k, p in enumerate(scale('D3', 'D6') + scale('D3', 'D6')[::-1][1:]):
    tt = HIT['rewind'] + k * (1.8 / 30)
    if tt < SEC['E']['t'] - .05: put('shamisen', sam(p, .45, .1, buzz=.5), tt, .65, -.4 + .8 * (k % 15) / 15, 'rewind run' if k == 0 else None)
t = HIT['rewind']; g = .4
while t < SEC['E']['t'] - .1: put('perc', hyoshigi(.5 + .4 * (t - HIT['rewind']) / 2), t, .7, (rng.random() - .5) * .4); g = max(.08, g * .8); t += g

# ================= E · home at dusk (66 bpm) =================
b = bt('E')
for k, p in enumerate(['D4', 'A4', 'D5']): put('koto', koto(p, .55), SHOT['s48'][0] + 1.3 + k * .42, .8, (k - 1) * .3, 'reprint: koto per block' if k == 0 else None)
LUL = [('A4', 2), ('G4', 1), ('A4', 1), ('Bb4', 1), ('A4', 2), (None, 1), ('G4', 2), ('D4', 1), ('Eb4', 1), ('D4', 3), (None, 1),
       ('A4', 2), ('Bb4', 1), ('D5', 1), ('A4', 2), ('G4', 2), ('Eb4', 1), ('D4', 3)]
t = SHOT['s49'][0]
for k, (p, d) in enumerate(LUL):
    if p: put('koto', koto(p, .42), t, .75, .15, 'koto lullaby' if k == 0 else None)
    if p and k % 4 == 0: put('koto', koto({'A4': 'D3', 'G4': 'G2', 'Bb4': 'G2', 'D4': 'D3', 'Eb4': 'A2', 'D5': 'D3'}[p], .3), t, .6, -.25)
    t += d * b
put('shakuhachi', shaku('A4', 1.8, .4, slide=-2, swell=.6, breath=1.1), SHOT['s50'][0] + .3, .85, .05, 'motif returns (soft)')
put('shakuhachi', shaku('Bb4', .5, .36, slide=0, swell=.1), SHOT['s50'][0] + 2.3, .85, .05)
put('shakuhachi', shaku('A4', 1.4, .38, slide=0, fall=-1.0), SHOT['s50'][0] + 2.85, .85, .05)
put('shakuhachi', shaku('G4', 1.8, .36, slide=-1, swell=.5), SHOT['s52'][0] + .9, .85, .05)
put('shakuhachi', shaku('D4', 2.6, .4, slide=-1, swell=.7, rel=.8), SHOT['s52'][0] + 2.9, .85, .05, 'motif resolves')
put('perc', rin(.6), HIT['gift'], .9, .15, 'GIFT: rin'); put('koto', koto('D5', .5, harmonic=True), HIT['gift'] + .05, .7, .2)
put('koto', koto('A5', .45, harmonic=True), HIT['blink'], .7, .25, 'BLINK: harmonic')
for k, p in enumerate(['A4', 'G4', 'Eb4', 'D4']): put('koto', koto(p, .4), SHOT['s55'][0] + k * b, .7, .1, 'last phrase' if k == 0 else None)
put('shamisen', sam('D3', .7, None, buzz=1.0, t60=3.2), HIT['end'], .8, 0, 'END: sawari left ringing'); put('perc', rin(.35, 784), HIT['end'] + .4, .5, -.2)

# ——————————— silence: cut everything (tails too) in the two ma ———————————
def ma(t0, t1, fade=.03):
    a, b_ = int(t0 * SR), int(t1 * SR); f = int(fade * SR)
    for k in stems:
        st = stems[k]; st[a:a + f] *= np.linspace(1, 0, f)[:, None]; st[a + f:b_] = 0
ma(HIT['stop'], HIT['snatch'] - .13)
ma(HIT['silence'], HIT['catch'] - .005, .25)
# ——————————— write ———————————
os.makedirs(os.path.join(HERE, 'stems'), exist_ok=True)
mixd = np.zeros((N, 2), np.float32)
G = {'shamisen': 1.7, 'shakuhachi': .7, 'koto': 1.6, 'taiko': .8, 'perc': .8}
for k, st in stems.items():
    sf.write(os.path.join(HERE, 'stems', k + '.wav'), st, SR, subtype='FLOAT'); mixd += st * G[k]
pk = np.abs(mixd).max(); mixd *= .89 / pk
sf.write(os.path.join(HERE, 'score.wav'), mixd, SR, subtype='FLOAT')
json.dump(sorted(CUES, key=lambda c: c['t']), open(os.path.join(HERE, 'cues.json'), 'w'), ensure_ascii=False, indent=0)
print('score.wav', round(N / SR, 2), 's; peak scale', round(.89 / pk, 3), '; cues', len(CUES))
