// 《年兽来吃年夜饭》 — single source of truth for time: sections (bpm, beats), hit points, shots, banners.
// Dependency-free: imported by the page (main.js) and by tools/timeline.mjs (node) which writes timeline.json for the score, the foley and cuecheck.
export const SECS = [
  { id: 'A', name: '序', bpm: 90, beats: 12 },
  { id: 'B', name: '村里', bpm: 96, beats: 36 },
  { id: 'C', name: '山上', bpm: 60, beats: 14 },
  { id: 'D', name: '相遇', bpm: 112, beats: 42 },
  { id: 'E', name: '包饺子', bpm: 104, beats: 30 },
  { id: 'F', name: '山路', bpm: 76, beats: 20 },
  { id: 'G', name: '救援', bpm: 136, beats: 44 },
  { id: 'H', name: '高潮', bpm: 56, beats: 10 },
  { id: 'I', name: '年夜饭', bpm: 120, beats: 28 },
];
let acc = 0;
for (const s of SECS) { s.t = acc; s.beat = 60 / s.bpm; s.dur = s.beats * s.beat; acc += s.dur; }
export const DUR = Math.ceil(acc * 4) / 4 + .5;     // 144.75: the end card holds to the end
const S = Object.fromEntries(SECS.map(s => [s.id, s]));
export const tb = (id, b) => S[id].t + (b - 1) * S[id].beat;   // time of beat b (1-based) of section id; fractions allowed
export const secAt = t => { for (let i = SECS.length - 1; i >= 0; i--) if (t >= SECS[i].t) return SECS[i]; return SECS[0]; };
export const beatAt = t => { const s = secAt(t); return (t - s.t) / s.beat; };   // 0-based beat within the section

// hit points: every visual action the score must land on (section, beat)
export const HITS = {
  snip1: ['A', 1], snip2: ['A', 2], snip3: ['A', 3], snip4: ['A', 4], scrapFall: ['A', 4.5],
  titleIn: ['A', 6], title2: ['A', 6.5], title3: ['A', 7], title4: ['A', 7.5], title5: ['A', 8], title6: ['A', 8.5], title7: ['A', 9], seal: ['A', 10],
  village: ['B', 1], banner1: ['B', 1.5], crackersHung: ['B', 5], lanternLit: ['B', 7],
  fold1: ['B', 9], fold2: ['B', 11], fold3: ['B', 13], lookUp: ['B', 15], snipA: ['B', 19], snipB: ['B', 20], snipC: ['B', 21], snipD: ['B', 22],
  bowls: ['B', 25], banner2: ['B', 26], roofView: ['B', 31], busStop: ['B', 34],
  nianReveal: ['C', 1], banner3: ['C', 2], nianCU: ['C', 5.5], flake: ['C', 7], steam: ['C', 9.5], sniff: ['C', 11], rumble: ['C', 12], downhill: ['C', 13],
  bowlDown: ['D', 1], lookRoad: ['D', 3], creep: ['D', 7], twitch: ['D', 11], sneeze: ['D', 12.5], crackers: ['D', 15], dive: ['D', 17], eyes: ['D', 21], peek: ['D', 23],
  offer: ['D', 27], gulp: ['D', 31], clink: ['D', 33], nianHappy: ['D', 35], girlLaugh: ['D', 39],
  foldA: ['E', 1], foldB: ['E', 3], foldC: ['E', 5], pawTry: ['E', 7], squash: ['E', 9], poof: ['E', 9.5], giant: ['E', 14], laugh2: ['E', 17], grandmaDoor: ['E', 19], horns: ['E', 22], clock1130: ['E', 27],
  emptyChairs: ['F', 1], banner4: ['F', 2], busStuck: ['F', 5], wheels: ['F', 6], parents: ['F', 11], roofView2: ['F', 14], decide: ['F', 18],
  run: ['G', 1], bound1: ['G', 3], bound2: ['G', 5], bound3: ['G', 7], bound4: ['G', 9], reachBus: ['G', 11], squat: ['G', 13], lift: ['G', 15], free: ['G', 17], downhill2: ['G', 21], gallop: ['G', 23], clock1155: ['G', 31], villagers: ['G', 35], match: ['G', 37], skid: ['G', 41], hiss: ['G', 42],
  silence: ['H', 1], walkOut: ['H', 1.5], unfold: ['H', 3], softFace: ['H', 5], pinch: ['H', 6.5], door: ['H', 7], hug: ['H', 8.5], gong: ['H', 9.5],
  backlight: ['I', 1], fireworks1: ['I', 3], fireworks2: ['I', 5], table: ['I', 9], gulp2: ['I', 13], paste: ['I', 17], sneeze2: ['I', 19], smile: ['I', 20], outside: ['I', 23], endCard: ['I', 25],
};
export const T = Object.fromEntries(Object.entries(HITS).map(([k, [s, b]]) => [k, tb(s, b)]));

// shots: [start, name]; a shot runs to the next start
export const SHOTS = [
  [0, 'macro'], [T.scrapFall, 'titleWide'], [T.village, 'street'], [T.crackersHung - .2, 'gate'], [tb('B', 8.5), 'foldTD'], [T.lookUp - .5, 'girlCU'],
  [tb('B', 18.5), 'cutIns'], [T.bowls - .5, 'bowls'], [T.roofView, 'roofView'],
  [T.nianReveal, 'mountainWide'], [T.nianCU, 'nianCU'], [T.steam - .5, 'steam'], [T.downhill, 'downhill'],
  [T.bowlDown - .5, 'gateBowl'], [T.creep, 'creep'], [T.crackers - .5, 'panic'], [T.eyes, 'eyesInSnow'], [T.offer - .5, 'offer'], [T.nianHappy, 'twoFaces'],
  [T.foldA - .3, 'foldTD2'], [T.pawTry - .3, 'pawTD'], [T.laugh2 - .3, 'laughGrandma'], [T.horns, 'hornsIns'], [T.clock1130, 'clock1'],
  [T.emptyChairs, 'emptyChairs'], [T.busStuck, 'busStuck'], [T.parents, 'parentsCU'], [T.roofView2, 'roofView2'], [T.decide - .6, 'decideCU'],
  [T.run, 'runUp'], [T.reachBus, 'liftBus'], [T.downhill2, 'carryDown'], [T.clock1155, 'clock2'], [T.villagers, 'villagersMatch'], [T.skid, 'skidHalt'],
  [T.silence, 'walkOut'], [T.softFace, 'softFace'], [T.pinch, 'pinchDoor'], [T.hug, 'hug'],
  [T.backlight, 'backlitVillage'], [T.table, 'dinner'], [T.paste, 'pasteCU'], [T.outside, 'outsideEnd'],
];
export const shotAt = t => { for (let i = SHOTS.length - 1; i >= 0; i--) if (t >= SHOTS[i][0]) return { t0: SHOTS[i][0], t1: SHOTS[i + 1] ? SHOTS[i + 1][0] : DUR, name: SHOTS[i][1] }; return { t0: 0, t1: SHOTS[1][0], name: SHOTS[0][1] }; };

// banners (the storyteller's lines as red paper strips; also the .srt). Hold ≥ chars/4.5 + 1.5 s and ≥ 4 s.
const hold = s => Math.max(4, [...s.replace(/[，。！？、]/g, '')].length / 4.5 + 1.5);
export const BANNERS = [
  { id: 'L1', t0: T.banner1, text: '除夕，北方的小村下雪了。' },
  { id: 'L2', t0: T.banner2, text: '爸爸妈妈的车，还在山路上。' },
  { id: 'L3', t0: T.banner3, text: '山上的年兽今年不饿，只是有点孤单。' },
  { id: 'L4', t0: T.banner4, text: '十一点半了，车还没到。' },
].map(b => ({ ...b, t1: b.t0 + hold(b.text) + .2 }));
export const TITLE = '年兽来吃年夜饭';
export const END = '新年快乐';
