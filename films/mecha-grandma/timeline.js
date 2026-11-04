// 《机甲外婆》 — the cue sheet: music sections (tempo, bars of 4/4), the shot list on the bar grid, the named hits.
// Single source of truth for picture, score, Foley, subtitles and the cue check. Cuts land on bars or half bars.
export const FPS = 24;
const SECS = [          // [name, bpm, bars, mood]
  ['OPEN',   104, 5,   'intro pad → brass hit on the title'],
  ['HOME',    84, 7,   'night ballad: FM e-piano, soft bass, rain'],
  ['GARAGE', 100, 6,   'build-up: toms, rising arpeggio; cough, smack, power-up stab'],
  ['DRIVE',  132, 8,   'anime action / city-pop funk'],
  ['BILL',   132, 6,   'action: brass stabs, freeze on the catch'],
  ['DRONE',  132, 8,   'comic suspense → "ta-da" → groove'],
  ['CLIMB',   92, 5,   'half-time tension: pad, toms, arpeggio, wind'],
  ['WINDOW',  70, 5,   'hush: e-piano single notes → SILENCE → one chord'],
  ['DAWN',    96, 7,   'warm city-pop finale, semitone lift'],
  ['END',     96, 2,   'button: brass + bell'],
];
export const SEC = {};
let t = 0;
for (const [name, bpm, bars, mood] of SECS) { const beat = 60 / bpm, dur = beat * 4 * bars; SEC[name] = { name, bpm, bars, beat, bar: beat * 4, t0: t, t1: t + dur, dur, mood }; t += dur; }
export const DUR = +t.toFixed(4);
export const at = (s, bar = 0) => SEC[s].t0 + bar * SEC[s].bar;            // time of bar (fractions allowed)
export const secAt = tt => { for (const k in SEC) if (tt < SEC[k].t1) return SEC[k]; return SEC.END; };
export const q12 = t => Math.floor(t * 12 + 1e-6) / 12, q8 = t => Math.floor(t * 8 + 1e-6) / 8;   // characters on twos, beats on threes

// shots: [section, start bar, painter, options]
export const SHOTS = [
  ['OPEN', 0, 'crane'], ['OPEN', 3, 'title'],
  ['HOME', 0, 'apartment'], ['HOME', 1, 'photo'], ['HOME', 1.75, 'phoneBuzz'], ['HOME', 2.5, 'chat', { which: 1 }], ['HOME', 4.25, 'decide'],
  ['HOME', 5.25, 'kitchen'], ['HOME', 5.75, 'knot'], ['HOME', 6.25, 'liftBox'],
  ['GARAGE', 0, 'garageWide'], ['GARAGE', 1, 'unveil'], ['GARAGE', 2, 'cockpitIn'], ['GARAGE', 3, 'level', { tap: true }], ['GARAGE', 3.5, 'cough'],
  ['GARAGE', 4.5, 'eyesOn'], ['GARAGE', 5, 'stepOut'],
  ['DRIVE', 0, 'sideTrack', { leg: 1 }], ['DRIVE', 2, 'bands'], ['DRIVE', 3, 'charge'], ['DRIVE', 4, 'boxInsert'], ['DRIVE', 5, 'overhead'], ['DRIVE', 6, 'sideTrack', { leg: 2 }],
  ['BILL', 0, 'billboard'], ['BILL', 1, 'rider'], ['BILL', 1.5, 'gasp'], ['BILL', 2, 'lunge'], ['BILL', 2.5, 'impact'], ['BILL', 2.75, 'catchHold'],
  ['BILL', 4, 'setDown'], ['BILL', 5, 'nod'],
  ['DRONE', 0, 'droneIn'], ['DRONE', 1, 'hud', { which: 1 }], ['DRONE', 2.5, 'smack'], ['DRONE', 3.5, 'showBox'], ['DRONE', 4.5, 'hud', { which: 2 }], ['DRONE', 6.25, 'escort'],
  ['CLIMB', 0, 'towerLow'], ['CLIMB', 1, 'climb'], ['CLIMB', 2, 'gust'], ['CLIMB', 2.5, 'level', { gust: true }], ['CLIMB', 3, 'climbFace'], ['CLIMB', 4, 'arrive'],
  ['WINDOW', 0, 'desk'], ['WINDOW', 1, 'jieClose'], ['WINDOW', 1.5, 'tap'], ['WINDOW', 2, 'theHand'], ['WINDOW', 3, 'eyesECU'], ['WINDOW', 3.75, 'wave'], ['WINDOW', 4.25, 'laugh'],
  ['DAWN', 0, 'palm'], ['DAWN', 1.5, 'dumpling'], ['DAWN', 2, 'grandmaLaugh'], ['DAWN', 2.5, 'pullBack'], ['DAWN', 4.5, 'snap'], ['DAWN', 5.25, 'oldPhoto'], ['DAWN', 6, 'chat', { which: 2 }],
  ['END', 0, 'endCard'],
].map(([sec, b, name, opt]) => ({ sec, b, name, opt: opt || {}, t0: at(sec, b) }));
SHOTS.forEach((s, i) => { s.t1 = i + 1 < SHOTS.length ? SHOTS[i + 1].t0 : DUR; s.i = i; });
export const shotAt = tt => { let s = SHOTS[0]; for (const x of SHOTS) { if (x.t0 <= tt + 1e-9) s = x; else break; } return s; };

const h = at;
export const HIT = {
  power: 0.05, title: h('OPEN', 3), titleGlint: h('OPEN', 4),
  photoSlide: h('HOME', 1.2), buzz: h('HOME', 1.85), msg1: h('HOME', 2.6), msg2: h('HOME', 2.95), msg3: h('HOME', 3.2), msg4: h('HOME', 3.45),
  decide: h('HOME', 4.75), glasses: h('HOME', 5.0), lid: h('HOME', 5.5), knot: h('HOME', 6.0), lift: h('HOME', 6.5),
  flash1: h('GARAGE', .5), tug: h('GARAGE', 1.25), unveil: h('GARAGE', 1.5), sit: h('GARAGE', 2.25), tapLevel: h('GARAGE', 3.25),
  cough1: h('GARAGE', 3.75), cough2: h('GARAGE', 4.0), smack: h('GARAGE', 4.25), eyesOn: h('GARAGE', 4.5), door: h('GARAGE', 5.0), step1: h('GARAGE', 5.5),
  drive: h('DRIVE', 0), swerve: h('DRIVE', 3.5),
  tear: h('BILL', .5), rider: h('BILL', 1.1), gasp: h('BILL', 1.5), lunge: h('BILL', 2), impact: h('BILL', 2.5), catch: h('BILL', 2.75), setDown: h('BILL', 4.3), thumbs: h('BILL', 4.7), nod: h('BILL', 5.4),
  siren: h('DRONE', 0), lock: h('DRONE', 1), static: h('DRONE', 2.6), smack2: h('DRONE', 3.0), showBox: h('DRONE', 3.75), scan2: h('DRONE', 4.5), ident: h('DRONE', 4.6), green: h('DRONE', 6.25),
  climb: h('CLIMB', 0), gust: h('CLIMB', 2.1), slip: h('CLIMB', 2.2), level: h('CLIMB', 2.6), arrive: h('CLIMB', 4.4),
  tap1: h('WINDOW', 1.55), tap2: h('WINDOW', 1.7), turn: h('WINDOW', 1.8), hand: h('WINDOW', 2), silence: h('WINDOW', 3), chord: h('WINDOW', 3.75), wave: h('WINDOW', 3.85), laugh: h('WINDOW', 4.5),
  dawn: h('DAWN', 0), bite: h('DAWN', 1.6), pull: h('DAWN', 2.5), sun: h('DAWN', 3.2), shutter: h('DAWN', 4.9), match: h('DAWN', 5.25), sent: h('DAWN', 6.3), lift2: h('DAWN', 4),
  end: h('END', 0),
};
// on-screen texts (also the .srt)
export const TXT = {
  tv: '台风预警', chat1: ['吃了吗？', '还在公司', '三天没下楼了', '没空吃'], chat2: ['吃了。', '好孩子'],
  hud1: ['未登记机甲', '威胁等级：高'], hud2: ['识别：饺子 ×24', '威胁等级：外婆'], floor: '88F', title: '机甲外婆', end: '完',
  photoOld: '1979 · 大黄', bill: '台风预警', dash: '大黄',
};
