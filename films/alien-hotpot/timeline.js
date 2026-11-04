// timeline.js — single source of truth: sections (music grid), shots, dialogue, hits, foley.
// The page reads it directly; events.mjs exports it (window.EV) for score.py, mix.py, srt.mjs and cuecheck.py.
export const DUR = 145.4;
export const q = t => Math.floor(t * 12 + 1e-6) / 12;   // drawings on twos

// Music sections: t, bpm (0 = silence / free), end
export const SECS = [
  { id: 'rain', t: 0.0, bpm: 80, end: 19.5 },
  { id: 'fall', t: 19.5, bpm: 160, end: 22.5 },
  { id: 'impact', t: 22.5, bpm: 0, end: 23.25 },
  { id: 'title', t: 23.25, bpm: 120, end: 35.25 },
  { id: 'door', t: 35.25, bpm: 0, end: 38.25 },
  { id: 'order', t: 38.25, bpm: 100, end: 52.65 },
  { id: 'pot', t: 52.65, bpm: 120, end: 58.65 },
  { id: 'bite', t: 58.65, bpm: 0, end: 65.9 },
  { id: 'sting', t: 65.9, bpm: 120, end: 68.4 },
  { id: 'tripe', t: 68.4, bpm: 120, end: 88.4 },
  { id: 'fuel', t: 88.4, bpm: 120, end: 104.4 },
  { id: 'climax', t: 104.4, bpm: 60, end: 110.4 },
  { id: 'launch', t: 110.4, bpm: 120, end: 118.4 },
  { id: 'morning', t: 118.4, bpm: 120, end: 129.4 },
  { id: 'fleet', t: 129.4, bpm: 120, end: 135.9 },
  { id: 'button', t: 135.9, bpm: 0, end: 140.4 },
  { id: 'end', t: 140.4, bpm: 120, end: 145.4 },
];
export const sec = id => SECS.find(s => s.id === id);
export const beat = (id, n) => { const s = sec(id); return s.t + n * 60 / s.bpm; };

// Shots: [start, id]; each runs to the next start
export const SHOTS = [
  [0.0, 'city'], [4.0, 'alley'], [7.5, 'sign'], [10.5, 'shopWide'], [13.5, 'coins'], [17.25, 'liuSigh'],
  [19.5, 'fall'], [21.75, 'liuUp'], [22.5, 'impact'], [23.25, 'title'], [27.25, 'roof'], [31.25, 'cellRoof'],
  [35.25, 'door'], [38.25, 'liuBlink'], [39.45, 'duoAsk'], [43.05, 'screen1'], [46.65, 'liuNod'], [48.45, 'menu'],
  [52.65, 'potIn'], [55.15, 'cellBelt'], [56.65, 'pipBite'], [58.65, 'pipCU'], [63.9, 'zugBlink'], [64.9, 'liuArms'],
  [65.9, 'pipMore'], [68.4, 'tripe1'], [71.4, 'liuShake'], [72.9, 'lesson'], [77.9, 'antenna'], [80.9, 'mirror'],
  [84.9, 'zugEat'], [88.4, 'cellTable'], [90.4, 'experiment'], [93.4, 'whip'], [95.4, 'ladleSlide'], [97.9, 'fill'],
  [102.4, 'coin2'], [104.4, 'climax'], [110.4, 'street'], [114.4, 'launch'], [115.9, 'cityUp'], [118.4, 'morning'],
  [122.4, 'signTear'], [127.4, 'liuMorning'], [129.4, 'fleet'], [132.4, 'queue'], [135.9, 'liuLast'], [137.4, 'screen2'],
  [140.4, 'endCard'],
];
export function shotAt(t) {
  let i = 0; while (i + 1 < SHOTS.length && t >= SHOTS[i + 1][0]) i++;
  const t0 = SHOTS[i][0], t1 = i + 1 < SHOTS.length ? SHOTS[i + 1][0] : DUR;
  return { id: SHOTS[i][1], t0, t1, u: t - t0, d: t1 - t0, i };
}

// Dialogue. who: ZUG (low, flat, slow) · PIP (high, fast) · LIU (closed-mouth hum) · TR (translator beeps)
// syl = gibberish syllables (voice.py); sub = what they mean (the subtitle).
export const LINES = [
  { id: 'zug1', who: 'ZUG', t: 28.6, syl: 5, sub: '能源舱……空了。' },
  { id: 'pip1', who: 'PIP', t: 30.15, syl: 9, sub: '完了完了完了！' },
  { id: 'zug2', who: 'ZUG', t: 40.0, syl: 8, sub: '我们需要能修飞船的东西。' },
  { id: 'tr1', who: 'TR', t: 43.5, syl: 7, sub: '我们要——最辣的。' },
  { id: 'liu1', who: 'LIU', t: 47.0, syl: 1, sub: '嗯。' },
  { id: 'pip3', who: 'PIP', t: 66.4, syl: 4, sub: '……再来一盘。' },
  { id: 'zug3', who: 'ZUG', t: 70.65, syl: 3, sub: '……它缩了。' },
  { id: 'liu2', who: 'LIU', t: 73.0, syl: 4, sub: '七上八下。' },
  { id: 'pip4', who: 'PIP', t: 78.3, syl: 6, sub: '天线！收信号！' },
  { id: 'zug4', who: 'ZUG', t: 86.7, syl: 2, sub: '……好吃。' },
  { id: 'pip5', who: 'PIP', t: 90.65, syl: 3, sub: '它亮了！' },
  { id: 'pip6', who: 'PIP', t: 92.1, syl: 7, sub: '是锅！锅就是燃料！' },
  { id: 'zug5', who: 'ZUG', t: 98.1, syl: 2, sub: '加满。' },
  { id: 'zug6', who: 'ZUG', t: 102.6, syl: 4, sub: '谢谢款待。' },
  { id: 'pip7', who: 'PIP', t: 111.1, syl: 4, sub: '再见！好吃！' },
  { id: 'tr2', who: 'TR', t: 137.8, syl: 6, sub: '再来一盘 ×200' },
];
export const WHO = {
  ZUG: { name: '祖格', col: '#7b6fae' }, PIP: { name: '皮皮', col: '#3d5fd0' },
  LIU: { name: '刘姨', col: '#9a2f3b' }, TR: { name: '翻译器', col: '#c98a2a' },
};

// Visual hits that must land on the music grid (cuecheck.py): name → [time, section, beat]
export const HITS = {
  clink1: [14.25, 'rain', 19], clink2: [15.0, 'rain', 20], clink3: [15.75, 'rain', 21],
  impact: [22.5, 'fall', 8],
  title1: [23.25, 'title', 0], title2: [23.75, 'title', 1], title3: [24.25, 'title', 2], title4: [24.75, 'title', 3],
  hatch: [27.75, 'title', 9], wisp: [33.25, 'title', 20],
  screenSwap: [44.25, 'order', 10],
  potDown: [53.15, 'pot', 1], chomp: [58.65, 'bite', 0],
  more: [65.9, 'sting', 0],
  dip1: [73.4, 'tripe', 10], dip8: [76.9, 'tripe', 17],
  full: [100.4, 'fuel', 24], coinDown: [102.9, 'fuel', 29],
  launch: [114.4, 'launch', 8], tear: [124.4, 'morning', 12],
};
export const DIPS = [0, 1, 2, 3, 4, 5, 6, 7].map(i => 73.4 + i * .5);          // Liu's lesson
export const DIPS2 = [0, 1, 2, 3, 4, 5, 6].map(i => 81.4 + i * .5);           // the mirror shot

// Foley: [t, name, gain, pan]. Beds (rain, room tone, bubbling, birds) are laid per section in mix.py.
export const FOLEY = [
  [2.4, 'streak', .5, .4],
  [8.2, 'flap', .6, 0], [9.3, 'flap', .5, 0],
  [14.25, 'clink', 1, -.1], [15.0, 'clink', 1, 0], [15.75, 'clink', 1, .1], [16.05, 'roll', .8, -.2], [16.85, 'drop', .9, -.4],
  [17.9, 'sigh', .8, 0],
  [19.5, 'whine', .9, .3], [20.3, 'sparks', .7, .2], [21.0, 'sparks', .6, 0], [21.75, 'rattle', .8, 0],
  [22.5, 'impact', 1.2, 0], [23.0, 'debris', .7, 0],
  [27.75, 'hatch', 1, 0], [27.8, 'hiss', .6, 0], [28.2, 'clank', .6, 0], [29.85, 'boing', .8, .2], [30.1, 'land', .8, .2],
  [31.6, 'blip', .7, 0], [32.1, 'blip', .7, 0], [32.6, 'blip', .7, 0], [33.25, 'flicker', .8, 0], [34.0, 'tap', .8, 0], [34.3, 'tap', .8, 0],
  [35.6, 'bell', 1, .4], [35.75, 'creak', .7, .4], [36.4, 'drip', .5, .4], [36.9, 'drip', .5, .4], [37.5, 'drip', .5, .4],
  [38.7, 'blink', .6, 0], [42.4, 'click', .8, .2], [44.1, 'glitch', .9, 0],
  [49.3, 'tap', .6, 0], [49.95, 'tap', .7, 0],
  [53.15, 'clunk', 1, 0], [53.45, 'ignite', .8, 0], [55.3, 'flicker', .6, 0],
  [57.2, 'clack', .7, .2], [57.7, 'clack', .7, .2], [58.6, 'chomp', 1, .2],
  [59.6, 'gulp', .9, 0], [62.2, 'pfft', 1, -.3], [62.35, 'pfft', 1, .3], [62.5, 'pfft', .9, 0], [62.7, 'kettle', .7, 0],
  [64.2, 'blink', .6, 0], [65.3, 'blink', .5, 0], [66.1, 'plate', .7, .2],
  [68.9, 'splash', .8, 0], [70.4, 'boing', .9, -.1], [71.6, 'swish', .5, 0], [72.0, 'swish', .5, 0],
  [78.6, 'pop', .8, -.1], [78.9, 'pop', .8, -.1],
  [85.5, 'slurp', .9, 0], [86.0, 'chomp', .7, 0], [87.6, 'squeak', .5, 0],
  [91.0, 'whoosh', .4, 0], [91.6, 'whoosh', .4, 0], [92.2, 'whoosh', .4, 0], [92.8, 'whoosh', .4, 0],
  [93.4, 'whip', .8, -.3], [94.05, 'whip', .8, .3], [94.75, 'whip', .8, 0],
  [96.7, 'scrape', .8, 0],
  [98.4, 'glug', 1, 0], [99.0, 'glug', 1, 0], [99.6, 'glug', 1, 0], [100.4, 'charge', 1, 0], [100.8, 'boing', .7, .3],
  [102.9, 'clink', 1, 0], [103.0, 'coinhum', .6, 0],
  [110.4, 'engine', .9, 0], [114.4, 'launch', 1.2, 0], [115.95, 'streak', .7, 0], [118.0, 'twinkle', .6, 0],
  [124.4, 'rip', 1, 0], [124.75, 'slap', 1, 0],
  [129.6, 'fleet', 1, 0],
  [136.3, 'blink', .7, 0],
];
export function dipFoley() { return [...DIPS, ...DIPS2].map(t => [t + .08, 'dip', .55, 0]); }

// Title / tags
export const TITLE = '外星人来吃火锅';
export const TAGS = [
  { t0: 4.3, t1: 10.4, text: '重庆 · 雨夜 · 23:47', col: '#ffb648' },
  { t0: 118.7, t1: 122.4, text: '次日 · 07:30', col: '#b84a2a' },
];
