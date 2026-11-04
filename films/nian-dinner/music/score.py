"""《年兽来吃年夜饭》 — original score. D gong pentatonic (D E F# A B). Sections and hit points from ../timeline.json.
Instruments: erhu (Karoryfer samples), dizi → flute (VSCO 2 CE), zheng → dan_tranh / dan_tranh_trem (VCSL), pipa (physical model), suona (own synthesis),
woodblock, frame drum, bass drum, clash cymbals, suspended cymbal, small and big gong (VCSL / VSCO 2 CE).
Run from the library root: .venv/bin/python films/nian-dinner/music/score.py → music/score.wav, music/stems/*.wav, music/score.json, music/CREDITS.txt"""
import sys, os, json
HERE = os.path.dirname(os.path.abspath(__file__)); FILM = os.path.dirname(HERE)
ROOT = os.environ.get('LIB') or os.path.abspath(os.path.join(FILM, '..', '..'))
sys.path.insert(0, ROOT)
import numpy as np, soundfile as sf
from core.audio import sampler as S, pluck as P
from core.audio.sfx import SR, add, bp, lp, hp, noise, norm

TL = json.load(open(os.path.join(FILM, 'timeline.json')))
DUR = TL['dur']; N = int(DUR * SR); SEC = {s['id']: s for s in TL['secs']}; HIT = TL['hits']
def tb(sid, b): s = SEC[sid]; return s['t'] + (b - 1) * s['beat']
def bl(sid): return SEC[sid]['beat']
os.makedirs(os.path.join(HERE, 'stems'), exist_ok=True)
S.seed(11); rng = np.random.default_rng(23)
STEMS = {k: np.zeros((N, 2), np.float32) for k in ['winds', 'strings', 'perc']}
KEY = {}
def hum(t, amt=.006): return t + float(rng.uniform(-amt, amt))
def vv(v, amt=.05): return float(np.clip(v + rng.uniform(-amt, amt), .05, 1))

# ---------- the suona: own synthesis (bright double reed with a scoop and a fast vibrato) ----------
def suona_tone(pitch, dur, vel=.7, scoop=1.0, vib=5.6, bright=1.0):
    f0 = S.hz(pitch); n = int((dur + .3) * SR); tt = np.arange(n) / SR
    semi = -scoop * np.exp(-tt / .05) + .2 * np.sin(2 * np.pi * vib * tt) * np.clip((tt - .16) / .3, 0, 1)
    f = f0 * 2 ** (semi / 12); ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.zeros(n)
    for k in range(1, 22): x += np.sin(k * ph) / k ** .75 * (1 if k < 10 else .55)
    y = bp(x, 400, 7000) + 1.5 * bp(x, 1200, 2600) * bright + .7 * bp(x, 2700, 4300) * bright
    env = np.minimum(1, tt / .03) * np.where(tt < dur, 1, np.exp(-(tt - dur) / .09))
    y = y * env + hp(noise(n / SR), 3000)[:n] * .025 * env
    return norm(y) * vel
def suona(t, p, d, v=.6, g=1.0, pan=-.1, **kw): add(STEMS['winds'], suona_tone(p, d, vv(v, .04), **kw), t - .03, g, pan)   # the attack reaches full level 30 ms in: start early so the note lands on the beat
def erhu(t, p, d, v=.5, g=1.0, pan=.15): add(STEMS['winds'], S.note('erhu', p, d, vel=vv(v), attack=.06), hum(t), g, pan)
def glide(x, curve, dur):
    n = int(dur * SR); tt = np.arange(n) / SR; ks, vs = zip(*curve); semi = np.interp(tt, ks, vs); pos = np.cumsum(2 ** (semi / 12)); pos = pos[pos < len(x) - 2]
    i = pos.astype(int); f = pos - i; y = x[i] * (1 - f) + x[i + 1] * f; fd = min(len(y), int(.08 * SR)); y[-fd:] *= np.linspace(1, 0, fd); return y.astype(np.float32)
def erhu_glide(t, pitch, curve, dur, vel=.5, g=1.0, pan=.15): add(STEMS['winds'], glide(S.note('erhu', pitch, dur * 1.8 + .5, vel=vel, attack=.08), curve, dur), t, g, pan)
def dizi(t, p, d, v=.5, g=1.0, pan=-.3, grace=None):
    if grace: add(STEMS['winds'], S.note('flute', grace, .07, vel=vv(v * .8)), hum(t) - .06, g * .7, pan)
    add(STEMS['winds'], S.note('flute', p, d, vel=vv(v), attack=.02), hum(t), g, pan)
def pipa(t, p, d, v=.65, g=1.0, pan=-.15, trem=None, **kw):
    if trem: kw['trem'] = trem
    add(STEMS['strings'], P.pluck('pipa', p, d, vel=vv(v), **kw), hum(t), g, pan)
def zheng(t, p, d=1.2, v=.5, g=1.0, pan=.25): add(STEMS['strings'], S.note('dan_tranh', p, d, vel=vv(v)), hum(t), g, pan)
def zheng_trem(t, p, d, v=.35, g=1.0, pan=.2): add(STEMS['strings'], S.note('dan_tranh_trem', p, d, vel=v, attack=.25), t, g, pan)
def gliss(t, notes, step=.028, v=.5, g=.8, pan=.25):
    for i, p in enumerate(notes): zheng(t + i * step, p, .9, v * (.8 + .4 * i / max(1, len(notes) - 1)), g, pan)
def wb(t, v=.6, var='a', g=1.0, pan=.35): add(STEMS['perc'], S.hit('woodblock', var, vel=vv(v, .04)), hum(t, .003), g, pan)
def drum(t, kind='large', v=.7, g=1.0, pan=0): add(STEMS['perc'], S.hit('frame_drum', kind, vel=vv(v, .04)), hum(t, .003), g, pan)
def bd(t, v=.8, g=1.0): add(STEMS['perc'], S.hit('bass_drum', None, vel=v), t, g, 0)
def gong(t, kind='small', v=.6, g=1.0, pan=0): add(STEMS['perc'], S.hit('gong2', kind, vel=v), t - (.15 if kind == 'small' else .05), g, pan)   # the small gong's sample swells in over ~150 ms
def tamtam(t, v=.9, g=1.2): add(STEMS['perc'], S.hit('gong', None, vel=v), t, g, 0)
def clash(t, kind='short', v=.6, g=1.0, pan=.2): add(STEMS['perc'], S.hit('clash', kind, vel=v), t, g, pan)
def cymroll(t, d, v=.5, g=1.0): add(STEMS['perc'], S.hit('sus_cymbal', 'roll', vel=v, dur=d), t, g, .1)

# ---------- theme 1 (festive), in beats: (pitch, beats) ----------
TH1 = [('D5', 1), ('E5', 1), ('F#5', 1.5), ('E5', .5), ('D5', 1), ('B4', 1), ('A4', 2),
       ('B4', 1), ('D5', 1), ('E5', 1), ('F#5', 1), ('A5', 1.5), ('F#5', .5), ('E5', 2),
       ('F#5', 1), ('E5', 1), ('D5', 1), ('B4', 1), ('A4', 1), ('B4', 1), ('D5', 2),
       ('E5', .5), ('D5', .5), ('B4', 1), ('A4', 1), ('B4', 1), ('D5', 3), (None, 1)]
CH = {'D': ['D3', 'A3', 'D4', 'F#4'], 'E': ['E3', 'B3', 'E4', 'B3'], 'B': ['B2', 'F#3', 'B3', 'D4'], 'A': ['A2', 'E3', 'A3', 'E4']}
HARM1 = ['D', 'D', 'B', 'A', 'D', 'B', 'A', 'D']
def melody(t0, phrase, inst, beat, v=.6, octave=0, g=1.0, pan=None, trem_min=2):
    t = t0
    for p, n in phrase:
        d = n * beat
        if p is not None:
            pp = S.midi(p) + 12 * octave
            if inst == 'pipa': pipa(t, pp, d + .15, v, g, pan if pan is not None else -.15, trem=14 if n >= trem_min else None)
            elif inst == 'dizi': dizi(t, pp, d * .95, v, g, pan if pan is not None else -.3, grace=(pp + 2 if n >= 2 else None))
            elif inst == 'erhu': erhu(t, pp, d * .98, v, g, pan if pan is not None else .15)
            elif inst == 'suona': suona(t, pp, d * .92, v, g, pan if pan is not None else -.1, scoop=.6 if n < 1 else 1.0)
            elif inst == 'zheng': zheng(t, pp, d, v, g, pan if pan is not None else .25)
        t += d
def zheng_bars(t0, harm, beat, v=.42, g=1.0, dens=4):
    for b, h in enumerate(harm):
        notes = CH[h]
        for k in range(dens): zheng(t0 + b * 4 * beat + k * (4 * beat / dens), notes[k % len(notes)], .8, v * (1.1 if k == 0 else .9), g)
def groove(t0, bars, beat, v=.5, g=1.0, drums=True, wbv=.5):
    for b in range(bars):
        for k in range(4):
            t = t0 + (b * 4 + k) * beat
            wb(t, wbv if k % 2 == 0 else wbv * .75, 'a' if k == 0 else 'b' if k % 2 else 'c', g)
            if drums: drum(t, 'large' if k == 0 else 'small' if k == 2 else 'small_muted', v if k == 0 else v * .7, g)

# ================= A 序 =================
B_A = bl('A')
gliss(HIT['scrapFall'], ['D5', 'B4', 'A4', 'F#4', 'E4', 'D4'], .06, .45, .7)          # the scrap falls: a descending zheng run
for i in range(7): wb(HIT['titleIn'] + i / 3, .7, 'a' if i % 2 == 0 else 'c', 1.0, 0)   # one woodblock per cut letter
pipa(HIT['titleIn'], 'D4', 2.6, .5, .9, trem=13); zheng_trem(HIT['titleIn'] + .3, 'A3', 2.4, .25, .7)
gong(HIT['seal'] - .02, 'small', .6, .9); wb(HIT['seal'], .9, 'a', 1.2, 0)
for i, p in enumerate(['D4', 'A4', 'D5', 'F#5']): pipa(HIT['seal'] - .04 + i * .015, p, 1.8, .7, 1.0)
dizi(HIT['seal'], 'D6', 1.0, .5, .6)
melody(HIT['seal'] + .67, [('A5', .5), ('B5', .5), ('A5', .5), ('F#5', .5), ('E5', 1)], 'dizi', B_A, .5, 0, .8)   # pickup into the village
KEY['title'] = HIT['titleIn']; KEY['seal'] = HIT['seal']

# ================= B 村里 =================
B_B = bl('B'); tB = tb('B', 1)
melody(tB, TH1[:14], 'dizi', B_B, .55, 0, .9)                      # bars 1–4 on the dizi
melody(tB, TH1[:14], 'pipa', B_B, .45, 0, .6)
zheng_bars(tB, HARM1[:4], B_B, .4, .9)
groove(tB, 4, B_B, .55, .9)
gong(HIT['crackersHung'], 'small', .5, .8); gong(HIT['lanternLit'], 'small', .35, .6)
for k in ['fold1', 'fold2', 'fold3']: wb(HIT[k], .85, 'c', 1.1, 0)
melody(tb('B', 17), TH1[14:21], 'pipa', B_B, .6, 0, .95)             # bars 5–6: the pipa takes the tune
zheng_bars(tb('B', 17), HARM1[4:6], B_B, .36, .85)
groove(tb('B', 17), 2, B_B, .45, .8, wbv=.4)
for k, p in zip(['snipA', 'snipB', 'snipC', 'snipD'], ['A5', 'B5', 'D6', 'E6']): zheng(HIT[k], S.midi(p) - 12, .6, .5, .9, .4)
# bar 7–9: the music thins at the empty chairs: erhu alone over a low zheng pedal
zheng(tb('B', 25), 'D3', 3.0, .5, .9); zheng(tb('B', 27), 'A3', 2.0, .4, .8)
erhu_glide(HIT['banner2'], 'A4', [(0, 0), (1.0, 0), (1.6, 2), (2.8, 2), (3.4, 0)], 3.6, .5, .9)
zheng(tb('B', 29), 'B2', 3.0, .45, .9); zheng(tb('B', 31), 'D3', 2.0, .4, .8)
erhu_glide(HIT['roofView'], 'D5', [(0, 0), (1.4, 0), (2.0, -3), (3.2, -3)], 3.4, .5, .9)
drum(HIT['busStop'], 'large_muted', .7, 1.0)
erhu(tb('B', 35), 'E4', 1.4, .45, .85)
KEY['village'] = tB; KEY['banner2'] = HIT['banner2']; KEY['busStop'] = HIT['busStop']

# ================= C 山上 =================
B_C = bl('C'); tC = tb('C', 1)
drum(tC, 'large', .9, 1.3); bd(tC, .5, .8); zheng(tC, 'D3', 3.5, .6, 1.0, 0); zheng(tC + .03, 'A3', 3.5, .4, .8, 0)
for b in [1, 3, 5]: t = tb('C', b + .6); drum(t, 'large_muted', .6, 1.0); drum(t + .24, 'large_muted', .45, .9)   # heartbeat
erhu_glide(tC + .5, 'A4', [(0, 0), (1.3, 0), (1.9, -3), (2.8, -3), (3.3, -5), (4.3, -5), (4.9, -7), (6.2, -7)], 6.4, .55, 1.0)    # the lonely theme: A → F# → E → D
zheng(tb('C', 3), 'B2', 2.0, .4, .8); zheng(tb('C', 5), 'A2', 2.0, .35, .8)
# 35.0–38.5 near silence (the close-up): nothing but the film's breath
# the steam rises: zheng harmonics climbing, one per half second
for i, p in enumerate(['D4', 'E4', 'F#4', 'A4', 'B4', 'D5']): zheng(HIT['steam'] + i * .5, p, 1.4, .3 + .04 * i, .7, .3)
dizi(HIT['sniff'], 'B5', .18, .45, .6, grace='A5'); dizi(HIT['sniff'] + .5, 'B5', .18, .45, .6, grace='A5')   # two sniffs
for i in range(3): bd(HIT['rumble'] + i * .11, .35 + .1 * i, .7)
for i, t in enumerate([HIT['downhill'] + .3, HIT['downhill'] + .8, HIT['downhill'] + 1.3, HIT['downhill'] + 1.8]): wb(t, .7, 'a', 1.0, 0); zheng(t, 'D3', .5, .55, .9, 0); drum(t, 'large', .6 + .08 * i, 1.0)
KEY['nianReveal'] = tC; KEY['steam'] = HIT['steam']; KEY['sniff'] = HIT['sniff']; KEY['rumble'] = HIT['rumble']

# ================= D 相遇 =================
B_D = bl('D'); tD = tb('D', 1)
zheng(tD, 'D3', 2.0, .45, .9); zheng(tD + .02, 'A3', 2.0, .35, .8); zheng(tD + .04, 'D4', 2.0, .3, .8)
for i, (p, d) in enumerate([('D4', 1), ('F#4', 1), ('A4', 2)]): pipa(tb('D', 1 + i * 1.0), p, d * B_D, .5, .9)
erhu_glide(HIT['lookRoad'], 'A4', [(0, 0), (.5, 0), (1.0, -3), (1.6, -3)], 1.8, .45, .9)   # a sigh
# the creep groove: sneaky pipa on the off-beats + woodblock
SNEAK = [('B3', .5), ('D4', .5), ('B3', .5), ('D4', .5), ('E4', .5), ('D4', .5), ('B3', 1)]
for rep in range(2): melody(tb('D', 7) + rep * 4 * B_D, SNEAK, 'pipa', B_D, .55, 0, .9, trem_min=9)
for b in range(7, 11): wb(tb('D', b), .45, 'b', .9); wb(tb('D', b + .5), .35, 'c', .8)
drum(tb('D', 7), 'small', .5, .9); drum(tb('D', 9), 'small', .5, .9)
wb(HIT['twitch'], .8, 'a', 1.1, 0)                                           # the twitch: one woodblock, then nothing
# the sneeze: suona "hah-CHOO" + cymbal + bass drum
suona(HIT['sneeze'] - .26, 'A5', .2, .55, 1.0, scoop=.4); suona(HIT['sneeze'] - .04, 'D5', .55, .75, 1.1, scoop=2.5)
clash(HIT['sneeze'], 'short', .7, 1.0); bd(HIT['sneeze'], .7, .9)
# firecrackers: a frame-drum roll and fast woodblocks; the dive: bass drum + crash + a falling zheng run
for i in range(10): drum(HIT['crackers'] + i * .11, 'small', .4 + .03 * i, .9); wb(HIT['crackers'] + i * .11 + .05, .4, 'c', .8)
bd(HIT['dive'], .95, 1.1); clash(HIT['dive'], 'crash', .8, 1.0); gliss(HIT['dive'], ['A5', 'F#5', 'E5', 'D5', 'B4', 'A4', 'F#4', 'D4'], .035, .55, .9)
pipa(HIT['dive'] + .6, 'D3', 1.2, .5, .9)
# the eyes: sparse plucks; the peek: two "tic toc" woodblocks
for i, t in enumerate([tb('D', 19), tb('D', 20)]): pipa(t, ['A4', 'B4'][i], .8, .4, .8)
zheng(HIT['eyes'], 'A5', 1.5, .5, .9, .4); wb(HIT['peek'], .6, 'c', 1.0, .3); wb(HIT['peek'] + .27, .5, 'a', 1.0, -.3)
# the offer: the groove returns gently; the gulp: a low suona "wump"; the clink: a small gong
for rep in range(2): melody(HIT['offer'] + rep * 4 * B_D, SNEAK, 'pipa', B_D, .5, 0, .85, trem_min=9)
for b in range(27, 31): wb(tb('D', b), .4, 'b', .85); wb(tb('D', b + .5), .3, 'c', .75)
suona(HIT['gulp'] - .07, 'D4', .55, .7, 1.1, scoop=3.0, bright=.7); bd(HIT['gulp'], .8, 1.0); wb(HIT['gulp'], .6, 'c', 1.0, 0)
gong(HIT['clink'], 'small', .5, .9)
# two faces: the suona's own playful tune, then the dizi laughs
TH3 = [('D5', .5), ('E5', .5), ('F#5', .5), ('A5', .5), ('B5', 1), ('A5', .5), ('F#5', .5), ('E5', .5), ('D5', .5), ('E5', 1)]
melody(HIT['nianHappy'] - .09, TH3, 'suona', B_D, .55, 0, .9); wb(HIT['nianHappy'], .9, 'a', 1.2, 0); drum(HIT['nianHappy'], 'large', .8, 1.1)
zheng_bars(HIT['nianHappy'], ['D', 'A'], B_D, .38, .85)
groove(HIT['nianHappy'], 2, B_D, .5, .85, wbv=.45)
for i in range(6): dizi(HIT['girlLaugh'] + i * .14, ['A5', 'B5'][i % 2], .12, .5, .7)
pipa(HIT['girlLaugh'] + .9, 'D5', 1.4, .6, .9, trem=15)
wb(tb('D', 42), .6, 'a', 1.0); wb(tb('D', 42.5), .6, 'c', 1.0)
KEY['creep'] = tb('D', 7); KEY['sneeze'] = HIT['sneeze']; KEY['dive'] = HIT['dive']; KEY['gulp'] = HIT['gulp']; KEY['nianHappy'] = HIT['nianHappy']

# ================= E 包饺子 =================
B_E = bl('E'); tE = tb('E', 1)
melody(tE, TH1[:7], 'dizi', B_E, .5, 0, .85); zheng_bars(tE, ['D', 'D'], B_E, .4, .9)
for b in range(1, 9): wb(tb('E', b), .4 if b % 2 else .3, 'b' if b % 2 else 'c', .8)
for k in ['foldA', 'foldB', 'foldC']: wb(HIT[k], .85, 'c', 1.1, 0)
# the paw: a tumbling pipa figure, the squash, the poof
for i, p in enumerate(['A5', 'F#5', 'E5', 'D5', 'B4', 'A4']): pipa(HIT['pawTry'] + i * .12, p, .4, .5, .9)
bd(HIT['squash'], .9, 1.1); clash(HIT['squash'], 'short', .6, 1.0); pipa(HIT['squash'], 'D3', 1.0, .7, 1.0)
gliss(HIT['poof'], ['D4', 'E4', 'F#4', 'A4', 'B4', 'D5', 'E5', 'F#5', 'A5'], .03, .45, .8)
# the giant dumpling: a comic suona "ta-daa" and a small gong
suona(HIT['giant'] - .25, 'D5', .22, .6, 1.0, scoop=.6); suona(HIT['giant'], 'A5', 1.3, .7, 1.1, scoop=1.5); gong(HIT['giant'] - .02, 'small', .6, 1.0); clash(HIT['giant'], 'short', .55, 1.0); bd(HIT['giant'], .6, .9)
zheng_bars(tb('E', 13), ['D', 'A'], B_E, .4, .85)
# laughing: dizi and pipa trade a two-note laugh
for i in range(4): dizi(HIT['laugh2'] + i * .29, ['F#5', 'E5'][i % 2], .2, .5, .75); pipa(HIT['laugh2'] + i * .29 + .14, ['D5', 'B4'][i % 2], .3, .5, .8)
wb(HIT['grandmaDoor'], .7, 'a', 1.0, 0)
for i in range(4): dizi(HIT['grandmaDoor'] + 1.0 + i * .29, ['A5', 'F#5'][i % 2], .2, .45, .7)
# the horns insert: zheng harmonics, soft; then the clock: woodblock ticks over a low pedal
for i, p in enumerate(['A5', 'B5', 'A5']): zheng(HIT['horns'] + .3 + i * .6, p, 1.2, .3, .7, .3)
zheng(HIT['clock1130'], 'D3', 2.4, .5, .9); zheng_trem(HIT['clock1130'], 'A3', 2.3, .22, .6)
for i in range(4): wb(HIT['clock1130'] + i * B_E, .55, 'b', 1.0, .4 if i % 2 else -.4)
KEY['squash'] = HIT['squash']; KEY['giant'] = HIT['giant']; KEY['clock1130'] = HIT['clock1130']

# ================= F 山路 =================
B_F = bl('F'); tF = tb('F', 1)
zheng(tF, 'B2', 3.0, .45, .9); zheng_trem(tF, 'D4', 6.0, .2, .6)
erhu_glide(tF + .2, 'D4', [(0, 0), (2.4, 0), (3.0, 2), (5.4, 2), (6.0, 4), (8.0, 4)], 8.2, .5, 1.0)       # D → E → F# rising slowly
for b in [1, 3, 5, 7, 9, 11, 13, 15, 17]: drum(tb('F', b), 'large_muted', .55, 1.0); drum(tb('F', b) + .3, 'large_muted', .4, .9)
bd(HIT['busStuck'], .7, 1.0); zheng_trem(HIT['wheels'], 'A3', 3.0, .3, .7)
gliss(HIT['wheels'] + .3, ['A3', 'B3', 'D4', 'E4', 'F#4'], .12, .35, .7)
erhu(HIT['parents'], 'A5', 2.2, .5, .9); erhu(HIT['parents'] + 1.6, 'F#5', 1.0, .45, .85)
zheng(HIT['roofView2'], 'B2', 2.5, .5, .95); zheng_trem(HIT['roofView2'], 'E4', 3.0, .3, .7)
drum(HIT['roofView2'] + .5, 'large', .7, 1.1)
bd(HIT['decide'], 1.0, 1.4); tamtam(HIT['decide'], .45, .9)                                               # the decision: one big drum
cymroll(HIT['decide'] + .7, tb('G', 1) - HIT['decide'] - .7 + .1, .55, 1.0)
KEY['busStuck'] = HIT['busStuck']; KEY['decide'] = HIT['decide']

# ================= G 救援 =================
B_G = bl('G'); tG = tb('G', 1)
clash(tG, 'crash', .9, 1.2); bd(tG, 1.0, 1.3)
def action_drums(t0, bars, v=.8):
    for b in range(bars):
        for k in range(4):
            t = t0 + (b * 4 + k) * B_G
            if k % 2 == 0: bd(t, v, 1.1)
            drum(t, 'large' if k % 2 else 'small', v * (.9 if k % 2 else .6), 1.0)
            drum(t + B_G / 2, 'small_muted', v * .5, .9)
            wb(t, .45, 'a' if k == 0 else 'b', .8); wb(t + B_G / 2, .35, 'c', .7)
action_drums(tG, 2)
TH1F = [('D5', .5), ('E5', .5), ('F#5', .75), ('E5', .25), ('D5', .5), ('B4', .5), ('A4', 1), ('B4', .5), ('D5', .5), ('E5', .5), ('F#5', .5), ('A5', .75), ('F#5', .25), ('E5', 1)]
melody(tG, TH1F, 'suona', B_G, .6, 0, 1.0)
zheng_trem(tG, 'D4', 3.5, .35, .8); zheng_trem(tG + .02, 'A4', 3.5, .3, .7)
for k in ['bound1', 'bound2', 'bound3', 'bound4']: clash(HIT[k], 'short', .65, 1.0); bd(HIT[k], .95, 1.2)
gong(HIT['reachBus'], 'small', .7, 1.1); suona(HIT['reachBus'], 'A5', 1.4, .6, 1.0, scoop=1.2)
zheng_trem(HIT['squat'], 'B2', 2.4, .35, .9); zheng_trem(HIT['squat'] + .3, 'D3', 2.1, .3, .8)
for i in range(6): drum(HIT['squat'] + i * .14, 'small_muted', .4 + .06 * i, .9)
clash(HIT['lift'], 'crash', .95, 1.3); bd(HIT['lift'], 1.0, 1.3); tamtam(HIT['lift'] - .03, .5, 1.0)
add(STEMS['winds'], glide(suona_tone('D5', 1.4, .75, scoop=.3), [(0, 0), (.5, 0), (.9, 7), (1.3, 7)], 1.3), HIT['lift'], 1.1, -.1)
for i, p in enumerate(['D3', 'A3', 'D4', 'F#4', 'A4', 'D5']): zheng(HIT['free'] - .02 + i * .012, p, 2.5, .65, .9)
clash(HIT['free'], 'short', .8, 1.1); bd(HIT['free'], 1.0, 1.2); suona(HIT['free'] - .07, 'D6', 1.2, .65, 1.0, scoop=1.0)
dizi(HIT['free'], 'D6', 1.2, .5, .6)
# the gallop downhill: x.xx x.xx on bass drum and frame drum, suona triumphant
def gallop(t0, n):
    for i in range(n):
        t = t0 + i * B_G * 2
        bd(t, .95, 1.1); drum(t + B_G * .75, 'small', .6, .9); drum(t + B_G, 'large', .8, 1.0); drum(t + B_G * 1.5, 'small', .5, .9); wb(t, .5, 'a', .8); wb(t + B_G, .4, 'b', .8)
gallop(HIT['downhill2'], 5)
melody(HIT['gallop'], TH1F[:7], 'suona', B_G, .6, 0, 1.0); melody(HIT['gallop'], TH1F[:7], 'dizi', B_G, .5, 1, .55)
zheng_trem(HIT['downhill2'], 'D4', 4.4, .35, .8)
for i in range(4): clash(HIT['gallop'] + i * B_G * 2, 'short', .55, .9)
# 11:55: the drive drops to ticks and a pulse; the villagers: a worried erhu; the match: a cymbal; the skid: a crash and a roll into silence
for i in range(4): wb(HIT['clock1155'] + i * B_G, .6, 'b', 1.0, .4 if i % 2 else -.4)
zheng_trem(HIT['clock1155'], 'B3', 4.5, .3, .8); bd(HIT['clock1155'], .6, .9); bd(HIT['clock1155'] + 2 * B_G, .6, .9)
erhu_glide(HIT['villagers'], 'A5', [(0, 0), (.4, 0), (.7, -2), (1.3, -2)], 1.5, .55, 1.0)
clash(HIT['match'], 'short', .6, 1.0); drum(HIT['match'], 'large', .7, 1.0)
for i in range(8): drum(HIT['match'] + .4 + i * .19, 'small', .4 + .05 * i, .9)
clash(HIT['skid'], 'crash', 1.0, 1.3); bd(HIT['skid'], 1.0, 1.3); tamtam(HIT['skid'], .6, 1.1)
gliss(HIT['skid'], ['A5', 'F#5', 'E5', 'D5', 'B4', 'A4'], .04, .5, .9)
KEY['run'] = tG; KEY['lift'] = HIT['lift']; KEY['free'] = HIT['free']; KEY['gallop'] = HIT['gallop']; KEY['skid'] = HIT['skid']

# ================= H 高潮 =================
B_H = bl('H')
# silence from the skid's tail to the unfold (the mix handles the cut); the unfold: one zheng note
zheng(HIT['unfold'] - .01, 'D5', 3.0, .6, 1.0, 0); zheng(HIT['unfold'] + .02, 'A5', 3.0, .35, .8, .2)
# the soft face: erhu alone, tender
erhu_glide(HIT['softFace'], 'D5', [(0, 0), (1.2, 0), (1.7, -5), (2.6, -5), (3.0, -3), (4.2, -3), (4.6, 0), (6.4, 0)], 6.6, .55, 1.1)
zheng(HIT['door'], 'D3', 2.6, .45, .9); zheng(HIT['door'] + .25, 'A3', 2.3, .35, .8); zheng(HIT['door'] + .5, 'F#4', 2.0, .3, .8)
dizi(HIT['hug'], 'D6', 1.1, .45, .7); dizi(HIT['hug'] + 1.1 * .5, 'A5', .6, .4, .65)
erhu(HIT['hug'] + .3, 'A4', 1.0, .5, .9)
# midnight: the big gong, the tutti chord ringing over into the finale
tamtam(HIT['gong'], 1.0, 1.5); bd(HIT['gong'], 1.0, 1.3); clash(HIT['gong'], 'crash', .8, 1.0)
for i, p in enumerate(['D3', 'A3', 'D4', 'F#4', 'A4', 'D5']): zheng(HIT['gong'] - .02 + i * .012, p, 2.8, .7, .95)
suona(HIT['gong'], 'D5', 1.5, .65, 1.0, scoop=1.5); dizi(HIT['gong'], 'D6', 1.5, .5, .6)
KEY['unfold'] = HIT['unfold']; KEY['softFace'] = HIT['softFace']; KEY['gong'] = HIT['gong']

# ================= I 年夜饭 =================
B_I = bl('I'); tI = tb('I', 1)
melody(tI, TH1[:14], 'suona', B_I, .6, 0, 1.0); melody(tI, TH1[:14], 'dizi', B_I, .5, 1, .5); melody(tI, TH1[:14], 'pipa', B_I, .5, 0, .7); bd(tI, .9, 1.1); wb(tI, .8, 'a', 1.1, 0)
zheng_bars(tI, HARM1[:4], B_I, .45, .95); groove(tI, 4, B_I, .7, 1.0, wbv=.55)
clash(tI, 'crash', .7, 1.0); clash(tb('I', 5), 'short', .6, .9)
for k in ['fireworks1', 'fireworks2']: clash(HIT[k], 'crash', .6, .9); gliss(HIT[k], ['D4', 'F#4', 'A4', 'D5', 'F#5', 'A5', 'D6'], .028, .45, .8)
# the table: lighter, warm; the gulp; the paste; the sneeze; the smile
melody(tb('I', 9), TH1[14:21], 'dizi', B_I, .5, 0, .8); melody(tb('I', 9), TH1[14:21], 'pipa', B_I, .5, 0, .8)
zheng_bars(tb('I', 9), HARM1[4:6], B_I, .4, .9); groove(tb('I', 9), 2, B_I, .5, .85, wbv=.4)
suona(HIT['gulp2'] - .12, 'D4', .5, .65, 1.0, scoop=3.0, bright=.7); bd(HIT['gulp2'], .8, 1.0); wb(HIT['gulp2'], .6, 'c', 1.0, 0)
wb(HIT['paste'], .8, 'c', 1.1, 0)
suona(HIT['sneeze2'] - .15, 'A5', .12, .4, .8, scoop=.4); suona(HIT['sneeze2'], 'D5', .35, .5, .9, scoop=2.5); wb(HIT['sneeze2'], .5, 'a', .9)
for i in range(4): dizi(HIT['smile'] + i * .12, ['A5', 'B5'][i % 2], .1, .45, .65)
# outside: the last phrase and the cadence on D at the end card; a small gong closes
melody(HIT['outside'], TH1[21:26], 'suona', B_I, .6, 0, 1.0); melody(HIT['outside'], TH1[21:26], 'dizi', B_I, .5, 1, .5); melody(HIT['outside'], TH1[21:26], 'pipa', B_I, .5, 0, .7)
zheng_bars(HIT['outside'], ['A'], B_I, .4, .9); groove(HIT['outside'], 1, B_I, .6, .9, wbv=.5)
pipa(HIT['endCard'], 'D5', 2.4, .75, 1.0, trem=12); suona(HIT['endCard'], 'D5', 2.0, .6, 1.0, scoop=1.2); dizi(HIT['endCard'], 'D6', 2.0, .5, .55)
for i, p in enumerate(['D3', 'A3', 'D4', 'F#4', 'A4', 'D5']): zheng(HIT['endCard'] - .02 + i * .012, p, 3.0, .6, .9)
erhu(HIT['endCard'], 'A4', 2.0, .4, .5); gong(HIT['endCard'], 'small', .6, 1.0); bd(HIT['endCard'], .8, 1.0); clash(HIT['endCard'], 'crash', .6, .9)
for i in range(2): wb(HIT['endCard'] + 1.0 + i * .5, .6, 'a', 1.0, 0)
gong(HIT['endCard'] + 2.0, 'small', .55, 1.0)
KEY['finale'] = tI; KEY['endCard'] = HIT['endCard']

# ================= reverb, silence windows, export =================
REV = {'winds': (.5, .2), 'strings': (.48, .18), 'perc': (.4, .13)}
GAIN = {'winds': .78, 'strings': .85, 'perc': .9}
env = np.ones(N, np.float32); tt = np.arange(N) / SR
def zero(a, b, fin=.03, fout=.03):
    m = (tt >= a) & (tt < b); env[m] = 0
    ia = int(a * SR); k = int(fin * SR); env[max(0, ia - k):ia] = np.minimum(env[max(0, ia - k):ia], np.linspace(1, 0, ia - max(0, ia - k)))
    ib = int(b * SR); k = int(fout * SR); env[ib:ib + k] = np.minimum(env[ib:ib + k], np.linspace(0, 1, k))
zero(HIT['nianCU'], HIT['steam'] - .5, .6, .4)                 # the close-up: breath only
zero(HIT['twitch'] + .3, HIT['sneeze'] - .25, .05, .01)        # before the sneeze
zero(HIT['hiss'] + .9, HIT['unfold'] + .08, .9, .01)            # the silence before the unfold
m = tt >= DUR - 1.2; env[m] *= np.linspace(1, 0, m.sum()) ** 1.5
out = {}
for k, x in STEMS.items():
    y = S.room(x, *REV[k]) * GAIN[k]; y *= env[:, None]; out[k] = y.astype(np.float32)
mix = sum(out.values()); pk = np.abs(mix).max(); g = (10 ** (-1.5 / 20)) / pk
for k in out: out[k] *= g; sf.write(os.path.join(HERE, 'stems', k + '.wav'), out[k], SR)
mix *= g
sf.write(os.path.join(HERE, 'score.wav'), mix, SR)
json.dump(KEY, open(os.path.join(HERE, 'score.json'), 'w'), indent=1)
open(os.path.join(HERE, 'CREDITS.txt'), 'w').write('\n'.join(S.credits(['erhu', 'flute', 'dan_tranh', 'dan_tranh_trem', 'woodblock', 'frame_drum', 'bass_drum', 'clash', 'sus_cymbal', 'gong2', 'gong'])) + '\nPipa: physical-model plucked string (core/audio/pluck.py), original synthesis. Suona: own additive synthesis (music/score.py).\n')
# ---------- self-check ----------
db = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
seg = lambda a, b: mix[int(a * SR):int(b * SR)]
print('peak dBFS', round(20 * np.log10(np.abs(mix).max()), 2), 'len', round(len(mix) / SR, 2))
for s in TL['secs']: print(f"{s['id']} {s['name']:4s} {s['t']:6.1f}-{s['t'] + s['dur']:6.1f} RMS {db(seg(s['t'], s['t'] + s['dur'])):6.1f} dB")
print('silence CU', round(20 * np.log10(np.abs(seg(HIT['nianCU'] + .7, HIT['steam'] - 1)).max() + 1e-12), 1), 'silence unfold', round(20 * np.log10(np.abs(seg(HIT['hiss'] + 1.9, HIT['unfold'] - .05)).max() + 1e-12), 1))
from scipy.signal import welch
f, Pw = welch(mix.mean(1), SR, nperseg=8192); band = lambda lo, hi: 10 * np.log10(Pw[(f >= lo) & (f < hi)].sum() + 1e-20)
print('band dB 20-120', round(band(20, 120), 1), '120-250', round(band(120, 250), 1), '250-2k', round(band(250, 2000), 1), '2k-8k', round(band(2000, 8000), 1), '8k-20k', round(band(8000, 20000), 1))
