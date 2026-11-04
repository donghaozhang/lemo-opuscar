"""Original score for 《我的怪兽朋友》 (140 s), written from timeline.json, in the Crayon Picture Book's sound palette:
ukulele and nylon guitar (sampled, FreePats / VCSL), clarinet (VSCO 2 CE), recorder (VCSL), glockenspiel (VSCO 2 CE), a toy piano (a honky-tonk
upright layered with a kalimba tine), a music box (physically modelled comb teeth, core/audio/pluck.py), woodblock, shaker, claves, triangle and
sleigh bells (VCSL / VSCO). A minor for the lonely city, C major from the first page turn into the night; the eight-bar theme is hinted on the music
box while the monster is drawn, held back, and heard in full with the ukulele and recorder when the balloon is freed.
Run from the library root: .venv/bin/python films/monster-friend/music/score.py → music/score.wav, music/stems/*.wav, music/score.json"""
import sys, os, json
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '../../..'))
sys.path.insert(0, LIB)
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
from core.audio import sampler as S, pluck as P
from core.audio.sfx import SR, add

TL = json.load(open(os.path.join(HERE, '..', 'timeline.json')))
HIT, SHOT = TL['hit'], TL['shot']
DUR = TL['dur']; N = int(DUR * SR)
S.seed(14); np.random.seed(14)
st = {k: np.zeros((N, 2), np.float32) for k in ('uke', 'winds', 'box', 'toy', 'perc')}
marks = {}; SILENT = set()
def mark(k, t, silent=False):
    marks[k] = round(float(t), 4)
    if silent: SILENT.add(k)
def beat(sec, b):
    s = next(x for x in TL['secs'] if x['id'] == sec); return s['t'] + b * 60 / s['bpm']
rng = np.random.default_rng(5)

# ---------- voices ----------
def uke(t, pitch, dur=.6, vel=.6, pan=.1, gain=1.):
    add(st['uke'], S.note('ukulele', pitch, dur, vel, release=.35), t, gain, pan)
def uke_strum(t, pitches, dur=.5, vel=.6, up=False, spread=.018, pan=.1, gain=1.):
    ps = list(pitches)[::-1] if up else list(pitches)
    for i, p in enumerate(ps): uke(t + i * spread, p, dur, vel * (1 - .06 * i), pan, gain)
def nylon(t, pitch, dur=1.2, vel=.6, pan=-.15, gain=1.):
    add(st['uke'], S.note('guitar_nylon', pitch, dur, vel, release=.5), t, gain, pan)
def clar(t, pitch, dur, vel=.5, pan=-.2, gain=1., att=.08, rel=.35):
    add(st['winds'], S.note('clarinet', pitch, dur, vel, release=rel, attack=att), t, gain, pan)
def clar_stac(t, pitch, vel=.5, pan=-.25, gain=1.):
    add(st['winds'], S.note('clarinet_stac', pitch, .25, vel, release=.15), t, gain, pan)
def rec(t, pitch, dur, vel=.5, pan=.2, gain=1., att=.04):
    add(st['winds'], S.note('recorder', pitch, dur, vel, release=.3, attack=att), t, gain, pan)
def glock(t, pitch, vel=.5, pan=.3, gain=1., dur=None):
    x = S.note('glockenspiel', pitch, dur or 1.6, vel, release=.8); add(st['toy'], x, t, gain, pan)
def box(t, pitch, vel=.6, pan=0., gain=1., dur=None):
    add(st['box'], P.pluck('music_box', pitch, dur, vel), t, gain, pan)
def toy(t, pitch, vel=.6, pan=-.1, gain=1.):   # toy piano: a honky-tonk upright, short, plus a kalimba tine an octave up at low level
    x = S.note('honky_tonk', pitch, .35, vel, release=.4).astype(np.float64)
    x = sosfilt(butter(2, 3200, 'low', fs=SR, output='sos'), x)
    k = P.pluck('kalimba', S.midi(pitch) + 12, None, vel * .8).astype(np.float64) * .35
    y = x.copy(); n = min(len(y), len(k)); y[:n] += k[:n]
    add(st['toy'], y.astype(np.float32), t, gain, pan)
def perc(t, inst, var=None, vel=.6, gain=1., pan=0., dur=None):
    add(st['perc'], S.hit(inst, var, vel, dur), t, gain, pan)
def droop(x, semis, d):   # a music-box note winding down: varispeed from rate 1 to 2^(-semis/12) over d seconds
    x = np.asarray(x, np.float64); n = len(x); t = np.arange(n) / SR
    rate = np.where(t < d, 2 ** (-semis / 12 * (t / d) ** 1.4), 2 ** (-semis / 12))
    pos = np.cumsum(rate); pos = pos[pos < n - 1]
    return np.interp(pos, np.arange(n), x).astype(np.float32)
def box_droop(t, pitch, semis=7, d=.7, vel=.7, pan=0., gain=1.):
    add(st['box'], droop(P.pluck('music_box', pitch, 1.4, vel), semis, d), t, gain, pan)

# the theme (C major), eight bars of four beats: (beat offset, pitch, beats)
THEME = [(0, 'E5', 1), (1, 'G5', 1), (2, 'A5', 1), (3, 'G5', 1), (4, 'E5', 1), (5, 'D5', 1), (6, 'C5', 2),
         (8, 'D5', 1), (9, 'E5', 1), (10, 'G5', 1), (11, 'E5', 1), (12, 'D5', 4),
         (16, 'E5', 1), (17, 'G5', 1), (18, 'A5', 1), (19, 'C6', 1), (20, 'B5', 1), (21, 'A5', 1), (22, 'G5', 1), (23, 'E5', 1),
         (24, 'D5', 1), (25, 'E5', 1), (26, 'D5', 1), (27, 'C5', 1), (28, 'C5', 4)]
CHORDS = {'C': ['G4', 'C5', 'E5', 'G5'], 'F': ['F4', 'A4', 'C5', 'F5'], 'G': ['G4', 'B4', 'D5', 'G5'], 'Am': ['A4', 'C5', 'E5', 'A5'], 'Dm': ['A4', 'D5', 'F5', 'A5'], 'Em': ['G4', 'B4', 'E5', 'G5']}
PROG = ['C', 'Am', 'F', 'G', 'C', 'Am', 'F', 'C']   # one chord per bar (bar 7: F then G on beat 3)

# ================= 新城 lonely 0–26 @72, A minor =================
b = 60 / 72
mark('crayonStart', 0.0, True)
clar(0.3, 'A3', 2.6, .42, -.2, .9, att=.5); clar(3.0, 'C4', 1.6, .42, -.2, .9, att=.2); clar(4.7, 'B3', 2.2, .4, -.2, .9, att=.15)
nylon(1.6, 'A2', 1.6, .5); mark('truck', HIT['truck'])
mark('pageIn', HIT['pageIn']); nylon(HIT['pageIn'], 'E3', 1.2, .55); nylon(HIT['pageIn'] + b * 2, 'A2', 1.2, .5)
# one toy-piano note per building drawn, a lonely descending scale
for i, p in enumerate(['E5', 'D5', 'C5', 'B4', 'A4', 'G4']): toy(3.4 + i * .5, p, .45, -.2 + i * .08); mark(f'house{i}', 3.4 + i * .5) if i == 0 else None
clar(7.0, 'E4', 2.4, .42, -.2, .9, att=.3); clar(9.5, 'D4', 1.5, .4, -.2, .9, att=.1); clar(11.0, 'C4', 1.2, .38, -.2, .9, att=.1)
mark('balloon', HIT['balloon']); glock(HIT['balloon'], 'A5', .35, .4, .8); glock(HIT['balloon'] + .5, 'C6', .3, .45, .7); glock(HIT['balloon'] + 1.0, 'E6', .28, .5, .6)
mark('title', HIT['title'])
for i, p in enumerate(['A4', 'C5', 'E5', 'A5']): box(HIT['title'] + i * .23, p, .5, 0, .8)
nylon(HIT['title'], 'A2', 2.0, .55); nylon(HIT['push'], 'E3', 1.5, .5); mark('push', HIT['push'])
# page 2: the kindergarten: a busier lilt (ukulele plucks in A minor), the teacher's wave a glock ding, then it thins out at the gate
mark('turn1', HIT['turn1'], True)
k0 = beat('city', 14.4)   # 12.0
for k in range(0, 17):
    t0 = k0 + k * b / 2
    if t0 >= HIT['gate'] - .1: break
    uke(t0, ['A4', 'C5', 'E5', 'C5'][k % 4], .4, .42 + .04 * (k % 2 == 0), .15, .85)
clar(12.6, 'E4', 1.6, .4, -.2, .85, att=.2); clar(14.2, 'C4', 1.4, .4, -.2, .85, att=.1)
mark('teacherWave', HIT['teacherWave']); glock(HIT['teacherWave'], 'E6', .4, .35, .7)
mark('gate', HIT['gate']); clar(HIT['gate'], 'A3', 3.2, .4, -.2, .9, att=.3); nylon(HIT['gate'], 'A2', 2.0, .45)
mark('childWave', HIT['childWave']); toy(HIT['childWave'], 'E5', .4, .2); toy(HIT['childWave'] + .18, 'G5', .4, .2)
# the close-up: one low clarinet note, nearly nothing; the mouth opens: a breath of a recorder that never becomes a note
mark('mouth', SHOT['s06'], True); clar(SHOT['s06'], 'A3', 3.4, .32, -.2, .85, att=.6)
mark('mouthOpen', HIT['mouthOpen'], True); rec(HIT['mouthOpen'], 'E5', .5, .18, .2, .6, att=.3)
mark('ots', HIT['ots']); nylon(HIT['ots'], 'A2', 2.4, .5); clar(HIT['ots'] + .5, 'E4', 2.0, .32, -.2, .8, att=.5)

# ================= 夜与画 magic 26–56 @60, C major =================
mark('turn2', HIT['turn2'], True)
mark('roomDraw0', HIT['roomDraw0'], True)
# the music box hints the theme (bars 1–2, one note per beat) while the room draws itself; a glockenspiel twinkle on the lamp and on the wash
for off, p, d in THEME[:7]: box(26.6 + off * 1.0, p, .55, 0, .9)
mark('lamp', HIT['lamp']); glock(HIT['lamp'], 'C6', .5, .3, .9); glock(HIT['lamp'] + .08, 'G6', .4, .3, .7)
mark('wash0', HIT['wash0'], True)
for i in range(7): glock(HIT['wash0'] + .3 + i * .36 + rng.random() * .08, ['E6', 'G6', 'C7', 'D6', 'A6', 'G6', 'E6'][i], .22 + .08 * rng.random(), .3 - .1 * (i % 3), .55)
clar(26.6, 'C3', 3.0, .3, -.2, .8, att=.8); clar(29.8, 'G3', 2.6, .3, -.2, .8, att=.6)
mark('boxIn', HIT['boxIn']); toy(HIT['boxIn'], 'C4', .5, -.1); toy(HIT['boxIn'] + .06, 'E4', .45, -.1)
for i, tt in enumerate([30.6, 31.3]): toy(tt, ['G5', 'A5'][i], .35, 0, .7)   # the hand hovers over red, then yellow
mark('purple', HIT['purple']); box(HIT['purple'], 'E6', .6, 0, .9); box(HIT['purple'] + .1, 'G6', .5, 0, .7)
# the drawing: the theme's first four bars on the music box, slow (one note per beat at 60), a clarinet holding the root
mark('draw0', HIT['draw0'])
for off, p, d in THEME[:12]: box(HIT['draw0'] + off * .62, p, .5, 0, .85)
clar(HIT['draw0'], 'C3', 5.0, .3, -.2, .8, att=1.0); clar(HIT['draw0'] + 5.2, 'G3', 2.4, .3, -.2, .8, att=.6)
for off, p in [(0, 'E5'), (1, 'G5'), (2, 'C6')]: box(HIT['drawFill0'] + 1.2 + off * .62, p, .45, 0, .7)
mark('washPage', HIT['washPage'])
for i, p in enumerate(['C6', 'E6', 'G6', 'C7', 'E7']): glock(HIT['washPage'] + i * .11, p, .35 + .05 * i, .2, .6)
mark('eyesShine', HIT['eyesShine']); glock(HIT['eyesShine'], 'C7', .6, .2, 1.0); glock(HIT['eyesShine'] + .02, 'E7', .5, .3, .8); glock(HIT['eyesShine'] + .04, 'G7', .45, .1, .7)
mark('pupils', HIT['pupils']); perc(HIT['pupils'], 'woodblock', 'a', .45, .6, .2); perc(HIT['pupils'] + .2, 'woodblock', 'b', .45, .6, -.2)
mark('blink', HIT['blink']); perc(HIT['blink'], 'triangle', 'muted', .35, .5, .3)
box(HIT['looks'], 'G5', .45, -.2, .7); box(HIT['looks'] + .4, 'E5', .45, .2, .7); box(HIT['looks'] + .8, 'C6', .5, 0, .8)
mark('armOut', HIT['armOut'], True); clar(HIT['armOut'], 'E3', 1.0, .4, -.2, .9, att=.2)
mark('climb', HIT['climb'])
for i, p in enumerate(['C5', 'D5', 'E5', 'G5', 'A5', 'C6']): box(HIT['climb'] + i * .18, p, .5, 0, .8)
mark('land', HIT['land']); perc(HIT['land'], 'frame_drum', 'small', .5, .7); toy(HIT['land'], 'C3', .6, 0, .9); toy(HIT['land'] + .05, 'G3', .5, 0, .7)
mark('jaw', HIT['jaw']); rec(HIT['jaw'], 'C6', .4, .3, .2, .6, att=.02)
mark('gasp', HIT['gasp']); clar(HIT['gasp'], 'A5', .35, .45, -.1, .8, att=.01, rel=.1)
# the shrink: the music box droops and stops; then the first literal silence
mark('shrink1', HIT['shrink1']); box_droop(HIT['shrink1'] - .35, 'E6', 9, .5, .7)
mark('peek', HIT['peek']); box(HIT['peek'], 'E5', .5, 0, .8)
mark('giggle', HIT['giggle']); toy(HIT['giggle'], 'G5', .5, 0, .8); toy(HIT['giggle'] + .12, 'C6', .5, 0, .8); toy(HIT['giggle'] + .24, 'E6', .5, 0, .8)
mark('pop', HIT['pop']); perc(HIT['pop'], 'woodblock', 'c', .7, .9); glock(HIT['pop'], 'C6', .6, .2, 1.0); uke_strum(HIT['pop'], CHORDS['C'], .9, .55)
uke_strum(HIT['pop'] + 1.0, CHORDS['F'], .9, .45); uke_strum(HIT['pop'] + 1.8, CHORDS['C'], 1.2, .5)
mark('hug', HIT['hug']); clar(HIT['hug'], 'E4', 1.4, .42, -.2, .9, att=.15); clar(HIT['hug'] + .4, 'G4', 1.0, .4, -.2, .8, att=.1); uke_strum(HIT['hug'], CHORDS['C'], 1.4, .5)

# ================= 早晨与捣蛋 trouble 56–80 @120, C major, bouncy =================
b = .5
mark('turn3', HIT['turn3'], True)
def trouble_bar(t0, ch, vel=.55):
    pts = CHORDS[ch]
    uke_strum(t0, pts, .45, vel); uke_strum(t0 + b, pts, .3, vel * .8); uke_strum(t0 + b * 1.5, pts, .3, vel * .7, up=True)
    uke_strum(t0 + b * 2, pts, .45, vel * .9); uke_strum(t0 + b * 3, pts, .3, vel * .8); uke_strum(t0 + b * 3.5, pts, .3, vel * .7, up=True)
    root = {'C': 'C3', 'F': 'F3', 'G': 'G2', 'Am': 'A2'}[ch]
    clar_stac(t0, root, .5, -.25, .9); clar_stac(t0 + b * 2, root if ch != 'C' else 'G2', .45, -.25, .8)
    perc(t0 + b, 'woodblock', 'a', .4, .5, .2); perc(t0 + b * 3, 'woodblock', 'b', .4, .5, -.2)
    for i in range(8): perc(t0 + i * b / 2, 'shaker', 'down' if i % 2 == 0 else 'up', .3 + .1 * (i % 2 == 0), .35, .3)
prog = ['C', 'C', 'F', 'G', 'C', 'Am', 'F', 'G', 'C', 'C', 'F', 'G', 'C', 'Am', 'F', 'G', 'C', 'C', 'F', 'G', 'C', 'Am', 'F', 'G']
k = 0; t = 56.0
while t < HIT['twitch'] - .05:
    trouble_bar(t, prog[k % len(prog)], .5 if t < 59 else (.38 if t >= HIT['crunch1'] - 1 else .55)); t += 4 * b; k += 1
# a playful recorder tune over the walk (59–63) and the table (63–66)
walk_tune = [(0, 'G5', .5), (.5, 'E5', .5), (1, 'G5', .5), (1.5, 'A5', .5), (2, 'G5', 1), (3, 'E5', .5), (3.5, 'D5', .5), (4, 'C5', 1), (5, 'D5', .5), (5.5, 'E5', .5), (6, 'D5', 2),
             (8, 'G5', .5), (8.5, 'E5', .5), (9, 'G5', .5), (9.5, 'C6', .5), (10, 'B5', 1), (11, 'A5', .5), (11.5, 'G5', .5), (12, 'E5', 1), (13, 'D5', .5), (13.5, 'E5', .5), (14, 'C5', 2)]
for off, p, d in walk_tune: rec(HIT['walk'] + off * b * 2 / 1.0, p, d * b * 2 * .9, .42, .2, .75, att=.03)
mark('zip', HIT['zip']); glock(HIT['zip'], 'G6', .4, .3, .7); glock(HIT['zip'] + .1, 'C7', .35, .3, .6)
mark('walk', HIT['walk'], True); mark('sunUp', HIT['sunUp']); glock(HIT['sunUp'], 'C6', .5, .2, .8); glock(HIT['sunUp'] + .25, 'E6', .45, .2, .7); glock(HIT['sunUp'] + .5, 'G6', .5, .2, .8)
mark('table', HIT['table'], True); mark('unzip', HIT['unzip']); glock(HIT['unzip'], 'C7', .4, .3, .6); glock(HIT['unzip'] + .1, 'G6', .35, .3, .5)
# the crayons eaten: a toy-piano note each, climbing; the yellow one last gets a glock
for i, (key, p) in enumerate([('crunch1', 'C5'), ('crunch2', 'E5'), ('crunch3', 'G5'), ('crunch4', 'C6')]): mark(key, HIT[key]); toy(HIT[key], p, .7, 0, 1.4); perc(HIT[key], 'woodblock', 'c', .5, .7, 0)
mark('crunchY', HIT['crunchY']); toy(HIT['crunchY'], 'E6', .6, 0, 1.0); glock(HIT['crunchY'], 'E7', .5, .2, .8)
# the sneeze: the band stops at the twitch; a shaker tremolo; a rising glock run for the anticipation; the sneeze is a glock gliss down and a sleigh-bell shake
mark('twitch', HIT['twitch'])
for i in range(14): perc(HIT['twitch'] + i * .085, 'shaker', 'up' if i % 2 else 'down', .2 + .02 * i, .3, .3)
mark('antic', HIT['antic'], True)
for i, p in enumerate(['C6', 'D6', 'E6', 'F6', 'G6', 'A6', 'B6']): glock(HIT['antic'] + i * .08, p, .3 + .04 * i, .1, .6)
mark('sneeze', HIT['sneeze']); perc(HIT['sneeze'], 'sleighbells', None, .7, .9, .1); perc(HIT['sneeze'], 'woodblock', 'c', .7, .8)
for i, p in enumerate(['C7', 'A6', 'F6', 'D6', 'B5', 'G5', 'E5', 'C5']): glock(HIT['sneeze'] + .05 + i * .07, p, .5 - .03 * i, -.4 + .1 * i, .8)
mark('kidsLook', HIT['kidsLook']); rec(HIT['kidsLook'], 'A5', .3, .35, .2, .7, att=.01); rec(HIT['kidsLook'] + .2, 'C6', .4, .35, .2, .7, att=.01)
# the sandpit: the band comes back softly
t = HIT['sandpit']; k = 0
while t < HIT['bell'] - .05:
    trouble_bar(t, ['C', 'F', 'C', 'G'][k % 4], .42); t += 4 * b; k += 1
mark('sandpit', HIT['sandpit'], True); mark('pat', HIT['pat']); perc(HIT['pat'], 'woodblock', 'c', .6, .8); perc(HIT['pat'] + .3, 'woodblock', 'c', .55, .8)
mark('giggle2', HIT['giggle2']); toy(HIT['giggle2'], 'G5', .45, 0, .8); toy(HIT['giggle2'] + .12, 'B5', .45, 0, .8); toy(HIT['giggle2'] + .24, 'D6', .45, 0, .8)
mark('laughCU', HIT['laughCU'], True)
mark('bell', HIT['bell'], True)   # the bell is foley; the band stops dead there (gated below)

# ================= 树下 the hush 80–100 @60 (free) =================
mark('turn4', HIT['turn4'], True)
# the recorder alone for the tableau and the tilt (A minor, sad), nothing else
sad = [(0, 'E5', 1.5), (1.5, 'D5', 1), (2.5, 'C5', 1.5), (4, 'B4', 1), (5, 'A4', 2.5), (8, 'C5', 1), (9, 'D5', 1), (10, 'E5', 2), (12, 'D5', 1), (13, 'C5', 1), (14, 'B4', 3)]
for off, p, d in sad: rec(80.8 + off * .5 * 1.0, p, d * .5 * .95, .4, .15, .8, att=.08)
mark('playDraw0', HIT['playDraw0'], True); mark('tilt', HIT['tilt'])
for off, p, d in [(0, 'E5', 1), (1, 'G5', 1), (2, 'A5', 2.5)]: rec(HIT['tilt'] + off * .6, p, d * .6, .42, .15, .8, att=.04)
mark('balloonSeen', HIT['balloonSeen']); glock(HIT['balloonSeen'], 'A6', .35, .3, .6)
mark('nudge', HIT['nudge']); clar_stac(HIT['nudge'], 'E4', .5, -.2, .8); clar_stac(HIT['nudge'] + .25, 'G4', .45, -.2, .7)
mark('skid', HIT['skid']); rec(HIT['skid'], 'A5', .3, .5, .15, .9, att=.005); rec(HIT['skid'] + .15, 'G5', .5, .4, .15, .7, att=.01)
# from the freeze: the music box alone, the theme's first bar winding down, slower and lower, and a droop at the shrink
mark('freeze', HIT['freeze'], True)
gaps = [.5, .58, .68, .82, 1.0]; t = HIT['freeze'] + .2
for i, p in enumerate(['E5', 'G5', 'A5', 'G5', 'E5']): box(t, p, .5 - .05 * i, 0, .85); t += gaps[i]
mark('shrink2', HIT['shrink2']); box_droop(HIT['shrink2'], 'D5', 12, 1.1, .6)
mark('lookBean', HIT['lookBean']); box(HIT['lookBean'], 'C5', .4, 0, .7)
mark('lookNini', HIT['lookNini']); box(HIT['lookNini'], 'E5', .38, 0, .7)
mark('lookCrayon', HIT['lookCrayon'], True)   # then a full second of nothing (95–96)
mark('breath', HIT['breath'], True)
mark('step', HIT['step']); nylon(HIT['step'], 'C3', 1.2, .5, -.1, .9)
mark('nihao', HIT['nihao']); uke(HIT['nihao'], 'C5', 1.4, .6, .1, 1.0)   # the one ukulele note under 你好
mark('niniUp', HIT['niniUp']); glock(HIT['niniUp'], 'E6', .45, .3, .8)

# ================= 气球与朋友 finale 100–125 @120: the theme in full =================
b = .5
mark('turn5', HIT['turn5'], True)
def theme_full(t0, vel=.6, recorder=True, glk=True, perc_on=True, clar_on=True, bars=8):
    for bar in range(bars):
        tb = t0 + bar * 4 * b; ch = PROG[bar % 8]
        if bar % 8 == 6:   # F then G
            uke_strum(tb, CHORDS['F'], .4, vel); uke_strum(tb + b, CHORDS['F'], .3, vel * .8); uke_strum(tb + b * 1.5, CHORDS['F'], .3, vel * .7, up=True)
            uke_strum(tb + 2 * b, CHORDS['G'], .4, vel); uke_strum(tb + 3 * b, CHORDS['G'], .3, vel * .8); uke_strum(tb + b * 3.5, CHORDS['G'], .3, vel * .7, up=True)
        else:
            for i, (off, up) in enumerate([(0, 0), (1, 0), (1.5, 1), (2, 0), (3, 0), (3.5, 1)]): uke_strum(tb + off * b, CHORDS[ch], .4 if i in (0, 3) else .3, vel * (1 if i in (0, 3) else .75), up=bool(up))
        if clar_on:
            root = {'C': 'C3', 'F': 'F3', 'G': 'G2', 'Am': 'A2'}[ch]; clar_stac(tb, root, .5, -.25, .9); clar_stac(tb + 2 * b, root, .42, -.25, .8)
        if perc_on:
            perc(tb + b, 'woodblock', 'a', .4, .5, .2); perc(tb + 3 * b, 'woodblock', 'b', .4, .5, -.2)
            for i in range(8): perc(tb + i * b / 2, 'shaker', 'down' if i % 2 == 0 else 'up', .3 + .1 * (i % 2 == 0), .35, .3)
    for off, p, d in THEME[:bars * 4 if bars < 8 else 29]:
        if off >= bars * 4: continue
        if recorder: rec(t0 + off * b, p, d * b * .92, .5, .2, .9, att=.02)
        if glk: glock(t0 + off * b, p, .35 if d < 2 else .45, .3, .55)
mark('grow', HIT['grow'])
# the grow: ukulele strums swelling with the clarinet climbing (100–102), then the theme in full from 102
for i, (ch, v) in enumerate([('C', .4), ('G', .48), ('Am', .56), ('F', .66)]): uke_strum(HIT['grow'] + i * .5, CHORDS[ch], .5, v, spread=.03)
for i, p in enumerate(['C4', 'E4', 'G4', 'C5']): clar(HIT['grow'] + i * .5, p, .55, .42 + .05 * i, -.2, .9, att=.05)
perc(HIT['grow'] + 1.5, 'sleighbells', None, .5, .6, .2)
theme_full(102.0, .6)
mark('lift', HIT['lift']); glock(HIT['lift'], 'C7', .5, .3, .8)
mark('freed', HIT['freed']); perc(HIT['freed'], 'sleighbells', None, .7, .9, .1); glock(HIT['freed'], 'G7', .55, .2, .9)
mark('niniLaugh', HIT['niniLaugh'])
for i, p in enumerate(['C6', 'E6', 'G6', 'C7', 'E7']): glock(HIT['niniLaugh'] + i * .07, p, .4 + .03 * i, .3, .7)
mark('twinkle', HIT['twinkle']); perc(HIT['twinkle'], 'triangle', 'open', .4, .6, .3)
mark('burp', HIT['burp']); clar(HIT['burp'], 'D3', .5, .55, -.2, 1.0, att=.02, rel=.2)
mark('crayonPop', HIT['crayonPop']); perc(HIT['crayonPop'], 'woodblock', 'c', .85, 1.3); toy(HIT['crayonPop'], 'E6', .75, 0, 1.3); perc(HIT['crayonPop'], 'claves', None, .6, .8, .1)
# the yellow monster drawn (110–115): the theme's second half softly, music box and ukulele only
for off, p, d in THEME[12:]: box(110.0 + (off - 12) * b, p, .5, 0, .8)
for bar, ch in enumerate(['G', 'C', 'Am', 'F']):
    tb = 110.0 + bar * 4 * b
    uke_strum(tb, CHORDS[ch], .5, .4); uke_strum(tb + 2 * b, CHORDS[ch], .4, .35)
mark('draw2', HIT['draw2'], True); mark('eyes2', HIT['eyes2']); perc(HIT['eyes2'], 'woodblock', 'a', .45, .6, .2); perc(HIT['eyes2'] + .2, 'woodblock', 'b', .45, .6, -.2)
mark('shake', HIT['shake']); perc(HIT['shake'], 'shaker', 'roll', .6, .7, .1, dur=.5)
mark('hop', HIT['hop']); toy(HIT['hop'], 'G5', .5, 0, .9); toy(HIT['hop'] + .1, 'C6', .55, 0, .9); glock(HIT['hop'] + .1, 'C7', .4, .3, .7)
# the play: the theme again, tutti
mark('chase', HIT['chase']); theme_full(115.0, .62)
mark('bounce', HIT['bounce']); glock(HIT['bounce'], 'E6', .55, .3, .9); glock(HIT['bounce'] + .5, 'G6', .55, .3, .9); perc(HIT['bounce'], 'woodblock', 'c', .6, .8); perc(HIT['bounce'] + .5, 'woodblock', 'c', .6, .8)
mark('ride', HIT['ride']); perc(HIT['ride'], 'sleighbells', None, .55, .7, .2)
mark('twoShot', HIT['twoShot'], True)
# the last bars before the turn: a cadence
uke_strum(123.0, CHORDS['F'], .8, .5); uke_strum(123.5, CHORDS['G'], .8, .5); uke_strum(124.0, CHORDS['C'], 1.4, .55); glock(124.0, 'C6', .4, .3, .7)

# ================= 晚安 lullaby 125–140 @60 =================
mark('wash2', HIT['wash2'], True)
for off, p, d in THEME[:12]: box(125.6 + off * .75, p, .45, 0, .85)
clar(125.6, 'C3', 4.5, .28, -.2, .8, att=1.2); clar(130.2, 'G3', 2.0, .25, -.2, .7, att=.8)
mark('yawn', HIT['yawn']); clar(HIT['yawn'], 'E4', 1.0, .3, -.2, .7, att=.3)
mark('shrink3', HIT['shrink3']); box_droop(HIT['shrink3'], 'E5', 5, .9, .45, 0, .8)
mark('climbIn', HIT['climbIn'])
for i, p in enumerate(['C6', 'A5', 'G5', 'E5', 'D5', 'C5']): box(HIT['climbIn'] + .2 + i * .25, p, .4 - .03 * i, 0, .75)
mark('inBook', HIT['inBook']); box(HIT['inBook'], 'C5', .4, 0, .8); box(HIT['inBook'] + .03, 'E5', .35, 0, .6); box(HIT['inBook'] + .06, 'G5', .3, 0, .5)
mark('bookCloses', HIT['bookCloses']); perc(HIT['bookCloses'], 'frame_drum', 'small_muted', .4, .6)
mark('turn6', HIT['turn6'], True)
mark('lastDraw0', HIT['lastDraw0'], True)
for off, p, d in THEME[16:]: box(HIT['lastDraw0'] + (off - 16) * .5, p, .4, 0, .7)
mark('letters', HIT['letters'])
for i, p in enumerate(['C6', 'E6', 'G6', 'C7']): glock(HIT['letters'] + i * .25, p, .45, .3 - .2 * i, .8)
box(HIT['letters'] + 1.0, 'C5', .5, 0, .8); box(HIT['letters'] + 1.03, 'E5', .45, 0, .6); box(HIT['letters'] + 1.06, 'G5', .4, 0, .5); box(HIT['letters'] + 1.09, 'C6', .45, 0, .6)
mark('crayonDown', HIT['crayonDown'], True)
# nothing after 138

# ================= reverb, gates, silences, bus =================
def verb(d):
    d['uke'] = S.room(d['uke'], size=.4, mix=.14); d['winds'] = S.room(d['winds'], size=.5, mix=.22); d['box'] = S.room(d['box'], size=.45, mix=.2)
    d['toy'] = S.room(d['toy'], size=.4, mix=.16); d['perc'] = S.room(d['perc'], size=.35, mix=.12)
    return d
st = verb(st)
def gate_zero(x, a, b2, fade=.03):
    ia, ib, nf = int(a * SR), int(b2 * SR), int(fade * SR)
    x[ia - nf:ia] *= np.linspace(1, 0, nf, dtype=np.float32)[:, None]; x[ia:ib] = 0
zones = [tuple(z) for z in TL['silence']]
for k in st:
    for a, b2 in zones: gate_zero(st[k], a, b2)
    # the bell at 78.8: the band stops dead (nothing until the page turn at 79.4)
    gate_zero(st[k], HIT['bell'], HIT['turn4'] + .6, .02)
    # the dead stop at the freeze (90.0): the recorder's tail cut short before the music box alone
    if k != 'box': gate_zero(st[k], HIT['freeze'], HIT['step'] - .1, .05)
    # fade into the two page turns that end a section (11.4, 25.4): the lonely section thins out
    for c in (HIT['turn1'], HIT['turn2'], HIT['turn3'], HIT['turn5']):
        i0, i1 = int((c - .6) * SR), int(c * SR); st[k][i0:i1] *= np.linspace(1, .35, i1 - i0, dtype=np.float32)[:, None]
    i0, i1 = int(138.0 * SR), int(138.9 * SR); st[k][i0:i1] *= np.linspace(1, 0, i1 - i0, dtype=np.float32)[:, None] ** 2; st[k][i1:] = 0
BUS = {'uke': 1.0, 'winds': 1.15, 'box': 1.1, 'toy': .9, 'perc': .8}
mix = sum(st[k] * g for k, g in BUS.items())
pk = np.abs(mix).max(); tgt = 10 ** (-1.2 / 20); sc = tgt / pk if pk > tgt else 1.0
mix *= sc
os.makedirs(os.path.join(HERE, 'stems'), exist_ok=True)
for k, g in BUS.items(): sf.write(os.path.join(HERE, 'stems', f'{k}.wav'), (st[k] * g * sc).astype(np.float32), SR, subtype='FLOAT')
sf.write(os.path.join(HERE, 'score.wav'), mix.astype(np.float32), SR, subtype='FLOAT')

# ---------- self-check ----------
def rms_db(a, b2):
    s = mix[int(a * SR):int(b2 * SR)]; return round(float(20 * np.log10(np.sqrt(np.mean(s ** 2)) + 1e-12)), 1)
def onset(t, win=.08):
    h = int(.0025 * SR); a0 = max(0, int((t - win) * SR))
    seg = mix[a0:int((t + win) * SR)].mean(1)
    e = np.sqrt(np.convolve(seg ** 2, np.ones(h) / h, 'same') + 1e-12)
    d = e[h:] - e[:-h]; i = int(np.argmax(d)); return round((a0 + i + h // 2) / SR, 4)
secs = {s['id']: (s['t'], s['t'] + s['beats'] * 60 / s['bpm']) for s in TL['secs']}
report = {'dur': len(mix) / SR, 'peak_dbfs': round(float(20 * np.log10(np.abs(mix).max())), 2),
          'rms_db': {k: rms_db(*v) for k, v in secs.items()},
          'silence_max_abs': {f'{a}-{b2}': float(np.abs(mix[int(a * SR):int(b2 * SR)]).max()) for a, b2 in zones},
          'onsets': {k: onset(v) for k, v in marks.items()}}
json.dump({'marks': marks, 'silent': sorted(SILENT), 'selfcheck': report}, open(os.path.join(HERE, 'score.json'), 'w'), indent=1, ensure_ascii=False)
print(json.dumps(report, indent=1, ensure_ascii=False))
print('\n'.join(S.credits(['ukulele', 'guitar_nylon', 'clarinet', 'clarinet_stac', 'recorder', 'glockenspiel', 'honky_tonk', 'woodblock', 'shaker', 'triangle', 'sleighbells', 'frame_drum'])))
