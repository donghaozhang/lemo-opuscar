// ---------- timeline: one grid for picture, score, foley and checks ----------
// Sections are laid end to end; each has a tempo, a metre and a length in bars. Everything else (page turns, falls,
// the bell, the letting-go) is a (section, bar, beat) on this grid. Exported to timeline.json by export_timeline.mjs.
const SECS = [
  { id: 'bell',    bpm: 120, beats: 4, bars: 1.5 },   // the hook: a half-painted bell, rung
  { id: 'plate',   bpm: 120, beats: 4, bars: 4 },     // the specimen page: the bicycle paints itself
  { id: 'summer',  bpm: 126, beats: 3, bars: 26 },    // age 6: the lane, three falls, 我扶着呢, 50 m
  { id: 'school',  bpm: 120, beats: 4, bars: 8 },     // age 10: to school, past him at the corner
  { id: 'leaving', bpm: 96,  beats: 4, bars: 6 },     // age 18: the bag on the back seat, off to the city
  { id: 'winter',  bpm: 60,  beats: 4, bars: 4.5 },   // the bicycle in the snow, the walking stick
  { id: 'spring',  bpm: 84,  beats: 4, bars: 6.5 },   // home; the lift; the bell; the ride
  { id: 'holding', bpm: 84,  beats: 4, bars: 3 },     // his face; 外公，我扶着您呢; one piano
  { id: 'lane',    bpm: 84,  beats: 4, bars: 3.5 },   // the two of them small; 50 m, like that year
];
let _t = 0;
for (const s of SECS) { s.t = _t; s.beat = 60 / s.bpm; s.bar = s.beat * s.beats; s.dur = s.bar * s.bars; _t += s.dur; s.end = _t; }
const DUR = +_t.toFixed(3);
const SEC = Object.fromEntries(SECS.map(s => [s.id, s]));
// B(section, bar, beat): seconds on the grid (bar and beat are 0-based, fractions allowed)
const B = (id, bar = 0, beat = 0) => +(SEC[id].t + (bar * SEC[id].beats + beat) * SEC[id].beat).toFixed(4);

// Hits the picture and the score must share (name → grid position). cuecheck.py compares EV against these.
const HIT = {
  ding0:      ['bell', 0, 1.8],      // the first ring of the bell
  pageSummer: ['summer', 0, 0],
  fall1:      ['summer', 7, 0],
  fall2:      ['summer', 8, 1],
  fall3:      ['summer', 9, 1],
  letGo:      ['summer', 19, 0],     // his fingers open on the saddle
  pageSchool: ['school', 0, 0],
  dingSchool: ['school', 2, 2],
  pageLeaving:['leaving', 0, 0],
  pageWinter: ['winter', 0, 0],
  pianoOne:   ['winter', 3, 2.5],    // the single felt-piano note in the hush
  pianoTwo:   ['winter', 4, 0.5],
  pageSpring: ['spring', 0, 0],
  lift:       ['spring', 2, 2],      // she lifts him onto the back seat
  dingSpring: ['spring', 3, 2],
  dollyTwo:   ['spring', 4, 0],
  holding:    ['holding', 0, 0],     // close-up; music drops to the piano alone
  lineTwo:    ['holding', 1, 2],     // 外公，我扶着您呢 is written
  pageLane:   ['lane', 0, 0],
  lastChord:  ['lane', 2, 0],
};
const HT = Object.fromEntries(Object.entries(HIT).map(([k, v]) => [k, B(...v)]));

if (typeof window !== 'undefined') { window.TL = { SECS, SEC, DUR, B, HIT, HT }; }
if (typeof module !== 'undefined') module.exports = { SECS, SEC, DUR, B, HIT, HT };
