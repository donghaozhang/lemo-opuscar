// 《中秋的灯》: the one timeline. Sections with a tempo, every hit on a (section, beat), the shot list, the subtitles.
// Pure module: the page imports it, tools/timeline.mjs writes timeline.json for mix.py and the checks.
export const SECS = [
  { id: 'A', t: 0, bpm: 72, beats: 42 },        // 家 home        0.000 – 35.000
  { id: 'B', bpm: 60, beats: 34 },              // 雾 fog        35.000 – 69.000
  { id: 'C', bpm: 54, beats: 21 },              // 灯塔 lighthouse 69.000 – 92.333
  { id: 'D', bpm: 84, beats: 37 },              // 灯链 chain    92.333 – 118.762
  { id: 'E', bpm: 66, beats: 25 },              // 团圆 reunion 118.762 – 141.490
];
for (let i = 1; i < SECS.length; i++) SECS[i].t = SECS[i - 1].t + SECS[i - 1].beats * 60 / SECS[i - 1].bpm;
export const DUR = +(SECS[SECS.length - 1].t + SECS[SECS.length - 1].beats * 60 / SECS[SECS.length - 1].bpm).toFixed(3);   // 141.49
const S = Object.fromEntries(SECS.map(s => [s.id, s]));
export const beat = (id, b) => +(S[id].t + b * 60 / S[id].bpm).toFixed(4);
export const B = id => 60 / S[id].bpm;

// —— hits: name → film second (every visual action the picture, the score and the Foley share) ——
const H = {};
const set = (k, id, b) => { H[k] = beat(id, b); };
set('lampOn', 'A', 1); set('title', 'A', 3); set('seal', 'A', 5); set('caption', 'A', 6.6);
H.snips = [16, 17, 18, 19].map(b => beat('A', b)); set('rabbitFree', 'A', 19.6);
set('blinkDelight', 'A', 21.4); set('rabbitUp', 'A', 22);
set('lidUp', 'A', 23.5); H.taps = [24, 25, 26].map(b => beat('A', b));
set('string', 'A', 28); set('lanternLift', 'A', 29); set('earFlop', 'A', 30); set('earFix', 'A', 30.7); set('point', 'A', 31.4);
H.duskLanterns = [33, 34, 35, 36].map(b => beat('A', b));
set('bounce', 'A', 38); set('shoulder', 'A', 39);
// B
set('fogIn', 'B', 0); H.boatLost = [2, 3, 4].map(b => beat('B', b)); set('tiltUp', 'B', 5); set('foghorn1', 'B', 6); set('moonLost', 'B', 7.2);
set('radioOn', 'B', 8); set('knob', 'B', 9); set('worry', 'B', 12); set('eyesCakes', 'B', 13.2); set('eyesWindow', 'B', 14.2);
set('flicker', 'B', 16.5); set('shadowCross', 'B', 17.5);
H.runSteps = [18.5, 19, 19.5, 20, 20.5, 21, 21.5, 22].map(b => beat('B', b)); set('gather', 'B', 20.5);
set('wheel', 'B', 22.5); set('wipe', 'B', 23.5); set('foghorn2', 'B', 24);
set('lookDown', 'B', 27.5); set('headLift', 'B', 28.3); set('rack', 'B', 28.6); set('stepOut', 'B', 29.8);
set('climb', 'B', 30); set('towerFoot', 'B', 33);
// C
H.slits = [.5, 1.5, 2.5, 3.5].map(b => beat('C', b));
set('setLantern', 'C', 5); set('stepBack', 'C', 6); set('clasp', 'C', 6.6);
set('seaSide', 'C', 8); set('fogOverDot', 'C', 9); set('oneNote', 'C', 10);
set('cu', 'C', 11); set('browsFold', 'C', 12); set('sink', 'C', 13); set('tears', 'C', 14.4); set('silence', 'C', 15.75);
set('click1', 'C', 18); set('eyesOpen', 'C', 18.3); set('click2', 'C', 19); set('click3', 'C', 20);
// D
H.pathLights = [0, 1, 2, 3, 4, 5, 6].map(b => beat('D', b));
set('motherLift', 'D', 7); set('motherLook', 'D', 9);
set('rise', 'D', 11); set('liftHigh', 'D', 12.2); set('settle', 'D', 13);
set('dollyOut', 'D', 15); H.galleryLights = [16, 17, 18, 19, 20, 21, 22, 23, 24].map(b => beat('D', b)); set('swell', 'D', 24);
set('fatherSees', 'D', 27); set('headTurn', 'D', 28.2); set('pointSea', 'D', 29.2); set('wheelTurn', 'D', 30.2);
set('fogOut', 'D', 31); set('moonBack', 'D', 33); set('boatIn', 'D', 35);
// E
set('boatBump', 'E', 1.4); set('stepOff', 'E', 1.8); set('run', 'E', 2.6); set('leap', 'E', 3.6); set('lift', 'E', 4);
H.cakeHands = [6, 7, 8].map(b => beat('E', b)); set('cuLantern', 'E', 11); set('rackOut', 'E', 12.4);
set('pullOut', 'E', 15); set('lampTable', 'E', 16.8); set('oldRabbit', 'E', 17.4); set('musicBox', 'E', 17); set('fade', 'E', 23);
export const HIT = H;

// —— shots: [id, start, transition into it] ——
export const SHOTS = [
  ['s01', beat('A', 0), 'cut'], ['s02', beat('A', 6), 'through'], ['s03', beat('A', 12), 'dissolve'], ['s04', beat('A', 16), 'dissolve'],
  ['s05', beat('A', 20), 'dissolve'], ['s06', beat('A', 23), 'cut'], ['s07', beat('A', 27), 'cut'], ['s08', beat('A', 32), 'dissolve'],
  ['s09', beat('A', 37), 'dissolve'],
  ['s10', beat('B', 0), 'dissolve'], ['s11', beat('B', 5), 'curtain'], ['s12', beat('B', 8), 'dissolve'], ['s13', beat('B', 12), 'cut'],
  ['s14', beat('B', 15), 'cut'], ['s15', beat('B', 18.5), 'dissolve'], ['s16', beat('B', 22.5), 'dissolve'], ['s17', beat('B', 26.5), 'dissolve'],
  ['s18', beat('B', 30), 'dissolve'],
  ['s19', beat('C', 0), 'dissolve'], ['s20', beat('C', 4), 'dissolve'], ['s21', beat('C', 8), 'dissolve'], ['s22', beat('C', 11), 'dissolve'],
  ['s23', beat('C', 18), 'cut'],
  ['s24', beat('D', 0), 'dissolve'], ['s25', beat('D', 7), 'cut'], ['s26', beat('D', 11), 'cut'], ['s27', beat('D', 15), 'dissolve'],
  ['s28', beat('D', 26), 'cut'], ['s29', beat('D', 31), 'dissolve'],
  ['s30', beat('E', 0), 'dissolve'], ['s31', beat('E', 5), 'dissolve'], ['s32', beat('E', 11), 'dissolve'], ['s33', beat('E', 15), 'through'],
];
export const DISSOLVE = .7;

// —— subtitles (Noto Serif SC): the radio's words and one closing line. Paper strips are not subtitled. ——
export const CUES = [
  { id: 'r1', t0: beat('B', 8.4), t1: beat('B', 12.9), text: '……大雾……船只看不见港口……' },
  { id: 'r2', t0: beat('B', 15), t1: beat('B', 18.9), text: '……阿海的船，还在外面……' },
  { id: 'end', t0: beat('E', 16.5), t1: beat('E', 22.2), text: '岸上有灯，船就不会迷路。' },
];
// paper strips (reading-time check: window.TEXTS)
export const STRIPS = [
  { id: 'title', text: '中秋的灯', t0: beat('A', 3), t1: beat('A', 8.4) },
  { id: 'caption', text: '八月十五 · 石崖渔村', t0: beat('A', 6.6), t1: beat('A', 11.8) },
];
