// The single source of truth: music sections (tempo grid), hit points on that grid, shots, placards. The page, the score, the foley and the checks all read this.
export const DUR = 140;
// sections: id, start, bpm (0 = free), beats
export const SECS = [
  { id: 'prologue', t: 0, bpm: 0, end: 16 },
  { id: 'square', t: 16, bpm: 120, beats: 24 },          // 16–28
  { id: 'show1', t: 28, bpm: 132, beats: 84 },           // 28–66.18
  { id: 'crisis', t: 66.18, bpm: 48, beats: 16 },        // 66.18–86.18
  { id: 'comeback', t: 86.18, bpm: 144, beats: 53 },     // 86.18–108.26
  { id: 'lamp', t: 108.26, bpm: 0, end: 125 },
  { id: 'dawn', t: 125, bpm: 60, beats: 15 }             // 125–140
];
export const beatT = (id, b) => { const s = SECS.find(x => x.id === id); return +(s.t + (s.bpm ? b * 60 / s.bpm : b)).toFixed(3); };
const B = beatT;
// Hit points: every visual action that the music must land on (section, beat); free sections give seconds
export const HIT = {
  match: .6, lampOn: 4.2, drop1: 7.8, drop2: 8.3, drop3: 8.9, jugTap: 9.6, titleIn: 10.8, titleOut: 15.3,
  squareIn: 16.0, beckon: B('square', 9), eyeRoll: B('square', 16), sigh: B('square', 17), pocket: B('square', 18.5), rodGiven: B('square', 20.5),
  clap1: B('square', 22), clap2: B('square', 22.8), clap3: B('square', 23.6),
  mountain: B('show1', 0.5), pine: B('show1', 1.5), cloudIn: B('show1', 2.6), cloudFlip: B('show1', 4.4), pushIn: B('show1', 4.4),
  monkeyIn: B('show1', 7.7), freeze1: B('show1', 8.8), labelIn: B('show1', 8.4), labelOut: B('show1', 15.4),
  twist: B('show1', 19.4), flip1: B('show1', 19.8), land1: B('show1', 22), cloudOff: +(B('show1', 22) + .5).toFixed(3), twirl1: B('show1', 22.6),
  maidenIn: B('show1', 26), headTurn: B('show1', 30.8), laugh: B('show1', 33.9), eyeFlare: B('show1', 40.7), whip1: B('show1', 44),
  headSwap: B('show1', 46.2), boyO: B('show1', 51.5), headDown: B('show1', 53.9),
  hit1: B('show1', 58.3), hit2: B('show1', 60.3), freeze2: B('show1', 62.3), hit3: B('show1', 64.3), hit4: B('show1', 66), tremble1: B('show1', 69.5),
  crouch: B('show1', 73), leap: B('show1', 74.4), land2: B('show1', 76.1), freeze3: B('show1', 76.1), demonBack: B('show1', 76.6), clawsUp: B('show1', 81.4),
  tremor: B('crisis', 0), hardCut: B('crisis', .66), faceHold: B('crisis', 2.3), handOpens: B('crisis', 4.3), rodsSlip: B('crisis', 4.7), fall: B('crisis', 5.5), outOfLight: B('crisis', 6.6), gasp: B('crisis', 6.8),
  placardYeye: B('crisis', 7.7), wrist: B('crisis', 8.3), rise: B('crisis', 9.9), riseEnd: B('crisis', 11.1), grow: B('crisis', 11.1), growEnd: B('crisis', 12.7), clawDown: B('crisis', 13.1), pupils: B('crisis', 14.5), brows: B('crisis', 15.1), move: B('crisis', 15.5),
  grab: B('comeback', .2), snapBack: B('comeback', .3), jerk: B('comeback', 1), flail0: B('comeback', 4.4), flail1: B('comeback', 9.2), skullHit: B('comeback', 10.4), skullSpinEnd: B('comeback', 12.4),
  tongue: B('comeback', 12.8), mime: B('comeback', 15.6), tap: B('comeback', 19.2), flip2: B('comeback', 21.2), land3: B('comeback', 23.6), twirl2: B('comeback', 24.6), twirlEnd: B('comeback', 27.4),
  staffUp: B('comeback', 29.6), staffTop: B('comeback', 35.6), suona: B('comeback', 33.2), whip2: B('comeback', 35.6), strike: B('comeback', 39.2), demonDown: B('comeback', 39.4),
  skullOff: B('comeback', 43.3), tattersEnd: B('comeback', 48.8), victory: B('comeback', 46.4), childStands: B('comeback', 51.2),
  gutter: 108.26, out: 109.26, pupils2: 110.9, brows2: 111.4, hand2: 111.8, phoneOut: 112.8, click: 113.4, torch: 113.5, raised: 114.0, clothLit: 114.2,
  stageLit: 115.5, bigGong: 115.6, straighten: 118.8, look: 119.6, musicDrop: 120.0, lampLift: 121.8, lampOut: 122.6, taken0: 123.4, taken1: 124.2,
  walkOff: 125.5, walkEnd: 128.0, cricketsOut: 126.5, birds: 127.0,
  tilt0: 129.0, tilt1: 132.5, twist2: B('dawn', 10), flip3: B('dawn', 10.2), flip3End: B('dawn', 11), land4: 137.6, endIn: 138.2, pluck: 138.2
};
export const T = HIT;
// Shots: [t0, t1, id, set]  set: F = the square (front), B = behind the screen, D = dawn front, E = dawn back
export const SHOTS = [
  [0, 3.0, 'match', 'B'], [3.0, 7.0, 'lamp', 'B'], [7.0, 10.5, 'jug', 'B'], [10.5, 16.0, 'title', 'F'],
  [16.0, 20.5, 'square', 'F'], [20.5, 23.5, 'beckon', 'B'], [23.5, 26.0, 'boyPhone', 'B'], [26.0, 28.0, 'rodHand', 'B'],
  [28.0, 31.5, 'seat', 'F'], [31.5, 34.5, 'entrance', 'F'], [34.5, 37.0, 'handsTwist', 'B'], [37.0, 39.5, 'flip', 'F'],
  [39.5, 43.0, 'maiden', 'F'], [43.0, 45.5, 'laugh', 'F'], [45.5, 48.5, 'eye', 'F'], [48.5, 51.0, 'swap', 'F'],
  [51.0, 54.0, 'boyHooked', 'B'], [54.0, 58.0, 'fight', 'F'], [58.0, 61.0, 'handsFight', 'B'], [61.0, 64.0, 'leap', 'F'], [64.0, 66.18, 'claws', 'F'],
  [66.18, 69.0, 'handsTremor', 'B'], [69.0, 71.0, 'faceMaster', 'B'], [71.0, 73.0, 'handOpens', 'B'], [73.0, 75.5, 'fall', 'F'],
  [75.5, 78.0, 'faceBoy', 'B'], [78.0, 82.0, 'magic', 'B'], [82.0, 84.0, 'giant', 'F'], [84.0, 86.18, 'resolve', 'B'],
  [86.18, 88.0, 'grab', 'B'], [88.0, 91.5, 'flail', 'F'], [91.5, 93.5, 'tongue', 'B'], [93.5, 95.0, 'tap', 'B'], [95.0, 98.0, 'cleanFlip', 'F'],
  [98.0, 101.0, 'staffUp', 'B'], [101.0, 104.0, 'strike', 'F'], [104.0, 107.0, 'liftoff', 'F'], [107.0, 108.26, 'crowdCheer', 'F'],
  [108.26, 110.5, 'gutter', 'B'], [110.5, 112.5, 'pocketLook', 'B'], [112.5, 115.5, 'torch', 'B'], [115.5, 118.5, 'stageLit', 'F'],
  [118.5, 121.5, 'straighten', 'B'], [121.5, 125.0, 'handover', 'B'], [125.0, 129.0, 'walkoff', 'B'],
  [129.0, 133.0, 'dawnWide', 'D'], [133.0, 137.5, 'dawnBack', 'E'], [137.5, 140.0, 'dawnEnd', 'D']
];
export const shotAt = t => SHOTS.find(s => t >= s[0] && t < s[1]) || SHOTS[SHOTS.length - 1];
// Placards (storyteller's board) and plaques; .srt is built from these
export const PLACARDS = [
  { id: 'P1', t0: 16.5, t1: 20.0, text: '村口，入夜。最后一场。' },
  { id: 'P2', t0: 21.0, t1: 23.5, text: '放下手机，来搭把手。' },
  { id: 'P3', t0: 75.8, t1: 78.0, text: '爷爷？' },
  { id: 'P4', t0: 122.0, t1: 125.0, text: '灯，交给你了。' }
];
export const PLAQUES = [
  { id: 'T1', t0: HIT.titleIn, t1: HIT.titleOut, text: '最后一场皮影戏' },
  { id: 'L1', t0: HIT.labelIn, t1: HIT.labelOut, text: '《三打白骨精》' },
  { id: 'T2', t0: HIT.endIn, t1: DUR, text: '完' }
];
