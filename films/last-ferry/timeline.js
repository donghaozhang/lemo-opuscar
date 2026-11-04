// 《最后一班渡船》 — the timeline: one source of truth for picture, score, foley, subtitles and the checks.
// Sections carry the music grid; every cut, hit and dialogue box is placed on a beat of its section (beatT), so the cue check is exact.
export const DUR = 150.0;
export const FPS = 24;

// —— Music grid ——
export const SECS = [
  { id: 'morning',     t: 0.0,   bpm: 72,  beats: 36 },   // 3/4 · 12 bars → 30.0
  { id: 'noon',        t: 30.0,  bpm: 120, beats: 40 },   // 2/4 · 20 bars → 50.0
  { id: 'dusk',        t: 50.0,  bpm: 80,  beats: 24 },   // 4/4 · 6 bars → 68.0
  { id: 'night_quiet', t: 68.0,  bpm: 60,  beats: 13 },   // → 81.0
  { id: 'storm',       t: 81.0,  bpm: 100, beats: 36 },   // → 102.6
  { id: 'crossing',    t: 102.6, bpm: 120, beats: 44 },   // → 124.6
  { id: 'dawn',        t: 124.6, bpm: 80,  beats: 34 },   // → 150.1 (the film ends at 150.0)
];
export const secOf = id => SECS.find(s => s.id === id);
export const beatT = (id, beat) => { const s = secOf(id); return +(s.t + beat * 60 / s.bpm).toFixed(4); };
export const secAt = t => { let s = SECS[0]; for (const x of SECS) if (t >= x.t) s = x; return s; };

// —— Shots —— (a = start, b = end; each boundary is a beat of its section)
const B = beatT;
export const SHOTS = [
  { id: 'card1', a: 0,                b: B('morning', 3),   card: '清晨', num: 'I' },
  { id: 's1',  a: B('morning', 3),    b: B('morning', 7),   set: 'town', desc: 'water insert: the paper boat set down' },
  { id: 's2',  a: B('morning', 7),    b: B('morning', 16),  set: 'town', desc: 'crane up to the dawn wide, title' },
  { id: 's3',  a: B('morning', 16),   b: B('morning', 23),  set: 'town', desc: 'medium-high on the ferry, Xiao Shi asks' },
  { id: 's4',  a: B('morning', 23),   b: B('morning', 28),  set: 'town', desc: 'close on Lao Zhou' },
  { id: 's5',  a: B('morning', 28),   b: B('morning', 32),  set: 'town', desc: 'rack focus to the bridge gap' },
  { id: 's6',  a: B('morning', 32),   b: B('morning', 36),  set: 'town', desc: 'far pier: children off, the wave' },
  { id: 'card2', a: B('noon', 0),     b: B('noon', 5),      card: '正午', num: 'II' },
  { id: 's7',  a: B('noon', 5),       b: B('noon', 13),     set: 'town', desc: 'noon wide: umbrellas pop open, boarding' },
  { id: 's8',  a: B('noon', 13),      b: B('noon', 22),     set: 'town', desc: 'lateral tracking with the red cluster' },
  { id: 's9',  a: B('noon', 22),      b: B('noon', 31),     set: 'town', desc: 'medium: the bride, the candy in the hat' },
  { id: 's10', a: B('noon', 31),      b: B('noon', 40),     set: 'town', desc: 'top-down: the ferry and the gap' },
  { id: 'card3', a: B('dusk', 0),     b: B('dusk', 3),      card: '黄昏', num: 'III' },
  { id: 's11', a: B('dusk', 3),       b: B('dusk', 8),      set: 'town', desc: 'dusk wide: windows pop on' },
  { id: 's12', a: B('dusk', 8),       b: B('dusk', 14),     set: 'town', desc: 'the goose refuses to board' },
  { id: 's13', a: B('dusk', 14),      b: B('dusk', 19),     set: 'town', desc: 'two-shot mid-river: the last crossing?' },
  { id: 's14', a: B('dusk', 19),      b: B('dusk', 24),     set: 'town', desc: 'close: the lantern is lit, shadows jump' },
  { id: 'card4', a: B('night_quiet', 0), b: B('night_quiet', 2), card: '夜', num: 'IV' },
  { id: 's15', a: B('night_quiet', 2),  b: B('night_quiet', 5.5), set: 'town', desc: 'night wide: tying up' },
  { id: 's16', a: B('night_quiet', 5.5), b: B('night_quiet', 9.5), set: 'town', desc: 'he sits on the pier, push in' },
  { id: 's17', a: B('night_quiet', 9.5), b: B('night_quiet', 13), set: 'town', desc: 'close: he blows out the lantern' },
  { id: 's18', a: B('storm', 0),      b: B('storm', 6),     set: 'town', desc: 'wide: wind, first flash, rain' },
  { id: 's19', a: B('storm', 6),      b: B('storm', 12),    set: 'town', desc: 'lateral: the mother runs with the boy' },
  { id: 's20', a: B('storm', 12),     b: B('storm', 21),    set: 'town', desc: 'two-shot on the pier: the ask' },
  { id: 's21', a: B('storm', 21),     b: B('storm', 24),    set: 'town', desc: 'insert in a flash: the missing span' },
  { id: 's22', a: B('storm', 24),     b: B('storm', 29),    set: 'town', desc: 'close: the boy, fevered' },
  { id: 's23', a: B('storm', 29),     b: B('storm', 36),    set: 'town', desc: 'close: Lao Zhou decides, relights' },
  { id: 's24', a: B('crossing', 0),   b: B('crossing', 8),  set: 'town', desc: 'signature wide: one light in the storm' },
  { id: 's25', a: B('crossing', 8),   b: B('crossing', 12), set: 'town', desc: 'insert: hands on the oar' },
  { id: 's26', a: B('crossing', 12),  b: B('crossing', 17), set: 'town', desc: 'low medium: the boat crabbing' },
  { id: 's27', a: B('crossing', 17),  b: B('crossing', 25), set: 'town', desc: 'close: the lantern gutters, heartbeat' },
  { id: 's28', a: B('crossing', 25),  b: B('crossing', 30), set: 'town', desc: 'close: the hat cups the lantern' },
  { id: 's29', a: B('crossing', 30),  b: B('crossing', 37), set: 'town', desc: 'far steps: the clinic door opens' },
  { id: 's30', a: B('crossing', 37),  b: B('crossing', 44), set: 'town', desc: 'close: Lao Zhou breathing, rain thinning' },
  { id: 'card5', a: B('dawn', 0),     b: B('dawn', 3),      card: '黎明', num: 'V' },
  { id: 's31', a: B('dawn', 3),       b: B('dawn', 8),      set: 'town', desc: 'dawn wide: the bridge opens' },
  { id: 's32', a: B('dawn', 8),       b: B('dawn', 13),     set: 'town', desc: 'Lao Zhou alone, rack focus' },
  { id: 's33', a: B('dawn', 13),      b: B('dawn', 16),     set: 'town', desc: 'the yellow cap runs down the steps' },
  { id: 's34', a: B('dawn', 16),      b: B('dawn', 18),     set: 'town', desc: 'close: his reaction' },
  { id: 's35', a: B('dawn', 18),      b: B('dawn', 22),     set: 'town', desc: 'two-shot: the gift' },
  { id: 's36', a: B('dawn', 22),      b: B('dawn', 25),     set: 'town', desc: 'insert: the written boat' },
  { id: 's37', a: B('dawn', 25),      b: B('dawn', 30),     set: 'town', desc: 'he sets it on the water; it drifts under the bridge' },
  { id: 's38', a: B('dawn', 30),      b: DUR,               set: 'town', desc: 'into the light; the band narrows; fade' },
];
export const shotAt = t => SHOTS.find(s => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
export const shot = id => SHOTS.find(s => s.id === id);

// —— Events —— (named hits; every one is on a beat of its section)
export const T = {
  boatDown: B('morning', 3.5),             // 3.0: the paper boat touches the water
  title: B('morning', 10), titleOut: B('morning', 15.5),
  dlgXs1: B('morning', 16.5), dlgXs1Out: B('morning', 22.75),
  dlgLz1: B('morning', 23.5), dlgLz1Out: B('morning', 27.75),
  rackBridge: B('morning', 29),            // focus hands over to the bridge
  hull: B('morning', 32),                  // the hull knocks the far steps
  kidsOff: B('morning', 32.5),             // children hop off (3 steps)
  wave: B('morning', 34),
  umb: [6, 7, 8, 9].map(b => B('noon', b)), // umbrellas pop open
  gust: B('noon', 11), gustBack: B('noon', 12.5),
  board: B('noon', 12),
  dlgBr1: B('noon', 23), dlgBr1Out: B('noon', 30.5),
  candyToss: B('noon', 25.5), candyLand: B('noon', 27),
  winOn: [4, 5, 6, 7, 8, 9, 10, 11].map(b => B('dusk', b)),  // windows pop on, one per beat
  honk: [B('dusk', 9), B('dusk', 10.5), B('dusk', 12)], flap: B('dusk', 10.5), hop: B('dusk', 13),
  dlgOb1: B('dusk', 14.5), dlgOb1Out: B('dusk', 18.75),
  match1: B('dusk', 19.25), lit1: B('dusk', 19.5),  // the lantern is lit at dusk
  dlgLz2: B('dusk', 19.75), dlgLz2Out: B('dusk', 23.75),
  honkLight: B('dusk', 23),
  rope: B('night_quiet', 3),               // the rope goes round the post
  sit: B('night_quiet', 5.5),
  breath: B('night_quiet', 10), blow: B('night_quiet', 10.5),   // 78.5: the lantern goes out, the music stops
  wind: B('storm', 0), flash1: B('storm', 1), rain: B('storm', 2.5),
  flash2: B('storm', 9), flash3: B('storm', 21), flash4: B('crossing', 3), flash5: B('crossing', 19), flash6: B('crossing', 34),
  run: B('storm', 6),                      // the mother runs along the lane
  dlgMo1: B('storm', 12.5), dlgMo1Out: B('storm', 20.75),
  lookBridge: B('storm', 31), lookLantern: B('storm', 32), match2: B('storm', 33), lit2: B('storm', 33.5),
  dlgLz3: B('storm', 34), dlgLz3Out: B('crossing', 2),
  castOff: B('crossing', 0),
  gutter: B('crossing', 17), dark: B('crossing', 20), heart: [20, 22, 24].map(b => B('crossing', b)),
  cup: B('crossing', 25), revive: B('crossing', 26), strings: B('crossing', 27),
  arrive: B('crossing', 30), door: B('crossing', 32), upSteps: B('crossing', 34), doorClose: B('crossing', 36),
  silence2: B('crossing', 37),
  birds: B('dawn', 0), cracker: B('dawn', 4), crackerEnd: B('dawn', 6), ribbon: B('dawn', 6), crowd: B('dawn', 6.5),
  xsRun: B('dawn', 13), look: B('dawn', 16),
  dlgXs2: B('dawn', 18.25), dlgXs2Out: B('dawn', 22),
  kneel: B('dawn', 25.5), boatDown2: B('dawn', 27), underBridge: B('dawn', 30), fade: B('dawn', 32),
};

// —— Dialogue boxes —— (the .srt is exported from this table)
export const LINES = [
  { id: 'xs1', who: '小石', face: 'xs_ask',    t: T.dlgXs1, out: T.dlgXs1Out, text: '周爷爷，明天还有船吗？' },
  { id: 'lz1', who: '老周', face: 'lz_smile',  t: T.dlgLz1, out: T.dlgLz1Out, text: '明天就走桥啦。' },
  { id: 'br1', who: '新娘', face: 'br_joy',    t: T.dlgBr1, out: T.dlgBr1Out, text: '周伯，吃喜糖！' },
  { id: 'ob1', who: '老伯', face: 'ob_ask',    t: T.dlgOb1, out: T.dlgOb1Out, text: '老周，末班了？' },
  { id: 'lz2', who: '老周', face: 'lz_calm',   t: T.dlgLz2, out: T.dlgLz2Out, text: '嗯，末班船。' },
  { id: 'mo1', who: '母亲', face: 'mo_fear',   t: T.dlgMo1, out: T.dlgMo1Out, text: '周师傅，小石烧得厉害！' },
  { id: 'lz3', who: '老周', face: 'lz_firm',   t: T.dlgLz3, out: T.dlgLz3Out, text: '上船。' },
  { id: 'xs2', who: '小石', face: 'xs_shy',    t: T.dlgXs2, out: T.dlgXs2Out, text: '周爷爷，给你。' },
];
export const TITLE = '最后一班渡船';
export const BOAT_TEXT = '谢谢周爷爷';
