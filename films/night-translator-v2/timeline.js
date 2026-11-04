// 《深夜翻译官》 v2 — the cue sheet. Single source of truth for picture (shots), score, mix, subtitles, cue check.
export const FPS = 24;
// [name, bpm, beats, cue-sheet mood]
const SECS = [
  ['COLD',   66, 11,  'Misterioso — cold open'],
  ['TITLE',  96, 12,  'Introduction — 小译 theme; the blind'],
  ['ESTAB',  72, 11,  'Misterioso → 老校 theme (pompous)'],
  ['SAY',    72, 5.5, '老校 theme, card'],
  ['GULP',   72, 3,   'the gulp'],
  ['WEST',  120, 30,  'Allegretto — western pastiche'],
  ['ROMA',  126, 33,  'Romance parody (violins)'],
  ['MONS',  104, 29,  'Misterioso comico — monster'],
  ['MONT',  152, 20,  'Hurry — montage, both themes'],
  ['JAM',    88, 9,   'Agitato setup — the jam; silence 1'],
  ['SHOUT', 152, 8,   'Agitato — card'],
  ['FIRE',  160, 40,  'Agitato hurry — the race; silence 2; the catch'],
  ['TENDER', 66, 12,  'Valse lente — both themes'],
  ['SAY2',   66, 4,   'clarinet alone — card'],
  ['DAWN',   88, 16,  'Maestoso — the seal, the slot, the lamps'],
  ['LAST',   66, 4.5, 'Tenderly — card'],
  ['END',    66, 5,   'final chord; curtains close'],
];
export const SEC = {};
let t = 0;
for (const [name, bpm, beats, mood] of SECS) { const beat = 60 / bpm, dur = beat * beats; SEC[name] = { name, bpm, beats, beat, t0: t, t1: t + dur, dur, mood }; t += dur; }
export const DUR = +t.toFixed(4);
export const at = (name, b = 0) => SEC[name].t0 + b * SEC[name].beat;
export const secAt = tt => { for (const k in SEC) if (tt < SEC[k].t1) return SEC[k]; return SEC.END; };

// Shots: [section, start beat, painter, options]. A shot lasts until the next one starts.
export const SHOTS = [
  ['COLD', 0, 'coldRoll'], ['COLD', 3.5, 'coldBump'], ['COLD', 6.5, 'coldFace'], ['COLD', 8.5, 'coldTilt'], ['COLD', 10, 'coldTake'],
  ['TITLE', 0, 'title'],
  ['ESTAB', 0, 'estWide'], ['ESTAB', 6, 'ljIntro'],
  ['SAY', 0, 'card'], ['GULP', 0, 'gulp'],
  ['WEST', 0, 'deskGrab', { reel: 'WEST' }], ['WEST', 3, 'viewer', { reel: 'WEST' }], ['WEST', 6, 'reelCard', { reel: 'WEST' }], ['WEST', 12, 'page', { reel: 'WEST' }],
  ['WEST', 18, 'ljRead', { reel: 'WEST' }], ['WEST', 20, 'pageFix', { reel: 'WEST' }], ['WEST', 25, 'deskThrow', { reel: 'WEST' }],
  ['ROMA', 0, 'viewer', { reel: 'ROMA' }], ['ROMA', 3, 'reelCard', { reel: 'ROMA' }], ['ROMA', 9, 'page', { reel: 'ROMA' }], ['ROMA', 15.5, 'deskFlip'],
  ['ROMA', 21.5, 'pageFix', { reel: 'ROMA' }], ['ROMA', 28.5, 'deskDuck'],
  ['MONS', 0, 'viewer', { reel: 'MONS' }], ['MONS', 3, 'reelCard', { reel: 'MONS' }], ['MONS', 9, 'thinkCats'], ['MONS', 13, 'pageHand', { reel: 'MONS' }], ['MONS', 22, 'deskCatch'],
  ['MONT', 0, 'mClock', { h0: 1.0, h1: 2.4 }], ['MONT', 2.5, 'mKeys'], ['MONT', 5, 'mTube'], ['MONT', 7.5, 'mStamp'], ['MONT', 10, 'mWide'],
  ['MONT', 13, 'mClock', { h0: 3.6, h1: 4.4 }], ['MONT', 14.5, 'mReel'], ['MONT', 17, 'mBasket'],
  ['JAM', 0, 'jamDesk'], ['JAM', 4, 'jamInsert'], ['JAM', 7, 'jamFace'],
  ['SHOUT', 0, 'card'],
  ['FIRE', 0, 'fireDesk'], ['FIRE', 5, 'fireTrack', { leg: 1 }], ['FIRE', 14, 'ljTrack'], ['FIRE', 19, 'fireTrack', { leg: 2 }], ['FIRE', 24, 'catchWide'],
  ['TENDER', 0, 'dryWide'], ['TENDER', 4.5, 'penHandover'], ['TENDER', 7, 'patTwo'],
  ['SAY2', 0, 'card'],
  ['DAWN', 0, 'dawnSeal'], ['DAWN', 5, 'dawnLift'], ['DAWN', 9, 'dawnWide'],
  ['LAST', 0, 'card'], ['END', 0, 'card'],
].map(([sec, b, name, opt]) => ({ sec, b, name, opt: opt || {}, t0: at(sec, b) }));
SHOTS.forEach((s, i) => { s.t1 = i + 1 < SHOTS.length ? SHOTS[i + 1].t0 : DUR; s.i = i; });
export const shotAt = tt => { let s = SHOTS[0]; for (const x of SHOTS) { if (x.t0 <= tt + 1e-9) s = x; else break; } return s; };

// Named hits (section, beat): the picture lands on these, the score and the trap box write to them.
const h = (s, b) => at(s, b);
export const HIT = {
  bump: h('COLD', 5), bulb: h('COLD', 6), eyes: h('COLD', 7.2), lookUp: h('COLD', 7.8), take: h('COLD', 10.4),
  titleIn: h('TITLE', .5), peek: h('TITLE', 3), lookUs: h('TITLE', 4), grab: h('TITLE', 4.75), snap: h('TITLE', 5), nod: h('TITLE', 6), drop: h('TITLE', 10),
  roll: h('ESTAB', 1), park: h('ESTAB', 5), unfold: h('ESTAB', 7), flourish: h('ESTAB', 8.5), point: h('ESTAB', 10),
  say: h('SAY', 0), gulp: h('GULP', .8), nodGo: h('GULP', 2),
  wGrab: h('WEST', 1), wThread: h('WEST', 2.2), wCard: h('WEST', 6), wPage: h('WEST', 12), wZoom: h('WEST', 18.5), wRecoil: h('WEST', 19.3),
  wStrike: h('WEST', 20.4), wFix: h('WEST', 20.8), wCrumple: h('WEST', 25.3), wThrow: h('WEST', 25.8), wBonk: h('WEST', 26.8), wLook: h('WEST', 27.6),
  rCard: h('ROMA', 3), rPage: h('ROMA', 9), rCrouch: h('ROMA', 15.8), rFlip: h('ROMA', 16.6), rPop: h('ROMA', 18), rTopple: h('ROMA', 20.4),
  rStrike: h('ROMA', 22), rFix: h('ROMA', 22.4), rThrow: h('ROMA', 29), rDuck: h('ROMA', 29.4), rPile: h('ROMA', 30.3),
  mFlash: h('MONS', 1.5), mCard: h('MONS', 3), mThink: h('MONS', 9.5), mPage: h('MONS', 13), mPen: h('MONS', 16.5), mStrike: h('MONS', 17), mFix: h('MONS', 17.5),
  mThrow: h('MONS', 22.6), mCatch: h('MONS', 23.4), mPop: h('MONS', 24), mUnfold: h('MONS', 25), mNod: h('MONS', 27), mBow: h('MONS', 27.8),
  mont: h('MONT', 0), matchCut: h('MONT', 14.5),
  jThread: h('JAM', .5), jam: h('JAM', 2), jBump: h('JAM', 3), spark: h('JAM', 6), jWide: h('JAM', 7.3), silence1: h('JAM', 8.3),
  shout: h('SHOUT', 0),
  yank: h('FIRE', .5), hot: h('FIRE', 1), race: h('FIRE', 5), ladder: h('FIRE', 10), ljGrab: h('FIRE', 16), trip: h('FIRE', 25.5), launch: h('FIRE', 26),
  catch: h('FIRE', 29), heal: h('FIRE', 30), popUp: h('FIRE', 34),
  hang: h('TENDER', .5), handover: h('TENDER', 5.5), raise: h('TENDER', 9), pat: h('TENDER', 10), pat2: h('TENDER', 10.5),
  say2: h('SAY2', 0),
  seal: h('DAWN', 1.5), hoist: h('DAWN', 5.5), slot: h('DAWN', 8), six: h('DAWN', 9.2), lamps: h('DAWN', 9.5),
  last: h('LAST', 0), end: h('END', 0), curtainOut: h('END', 3), lampOff: h('END', 4.8),
};
export const LAMP_ROWS = 8;
export const lampAt = i => HIT.lamps + i * SEC.DAWN.beat * .5;
// per-sequence print look (tint, damage, sepia, motion sampling)
export const TINT = { blue: [.72, .84, 1.0], amber: [1.0, .8, .5], rose: [1.0, .74, .8], green: [.72, 1.0, .78], gold: [1.0, .86, .62], none: [1, 1, 1] };
