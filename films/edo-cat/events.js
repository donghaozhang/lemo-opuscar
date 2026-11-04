// Sound events (foley + ambience), all derived from the timeline; exported by core/render/events.mjs to events.json.
import { SH, SEC, SECS, HIT, SHOTS, DUR } from './timeline.js';
export function events() {
  const ev = [], add = (type, t, o = {}) => { if (t >= 0 && t < DUR) ev.push({ t: +t.toFixed(3), type, ...o }); };
  const b = id => SEC[id].b;
  // —— ambience beds (J-cuts: the next place is heard before it is seen) ——
  add('amb', 0, { w: 'dawn', d: SH.s17.t0 + .6 });
  add('amb', SH.s17.t0 + .3, { w: 'rain', d: SH.s22.t1 - SH.s17.t0 - .1 });
  add('amb', SH.s22.t0 + 1.0, { w: 'snow', d: SH.s28.t1 - SH.s22.t0 - .6 });
  add('amb', SH.s28.t0 + .8, { w: 'field', d: SH.s34.t1 - SH.s28.t0 - .4 });
  add('amb', SH.s34.t0 + .6, { w: 'mountain', d: SH.s39.t0 + 2 - SH.s34.t0 });
  add('amb', SH.s39.t0 + 1.2, { w: 'sea', d: SH.s47.t1 - SH.s39.t0 - .6 });
  add('amb', SH.s47.t1 - .4, { w: 'dusk', d: DUR - SH.s47.t1 + .4 });
  // —— paper: scroll slides, cartouche slips and seals, printing ——
  add('scroll', SH.s02.t0, { d: 3.4, v: .55 });
  for (const id of ['s17', 's22', 's28', 's34']) add('scroll', SH[id].t0, { d: SH[id].t1 - SH[id].t0, v: .8 });
  add('scroll', SH.s39.t0 + 1, { d: SH.s39.t1 - SH.s39.t0 - 1, v: .7 });
  add('scroll', SH.s47.t0, { d: 2.0, v: 1.2, fast: 1 });
  const carts = [SH.s02.t0 + 1.0, SH.s18.t0 + .35, SH.s23.t0 + 1.0, SH.s29.t0 + .3, SH.s35.t0 + 1.2, SH.s40.t0 + .3, SH.s48.t0 + 3.2, SH.s56.t0 + 1.6];
  carts.forEach(t => { add('slip', t, { v: .5 }); add('seal', t + .5, { v: .8 }); });
  add('slip', HIT.shout, { v: .6 }); add('seal', HIT.shout + .05, { v: .6 });
  // dusk reprint: dawn blocks peel, dusk blocks printed; the end: blocks peel off one by one
  add('peel', SH.s48.t0 + .25, { v: .8 }); [0, 1, 2].forEach(k => { add('block', SH.s48.t0 + 1.3 + k * .42 - .1, { v: .6 }); add('baren', SH.s48.t0 + 1.3 + k * .42, { d: .34, v: .8 }); });
  [0, 1, 2].forEach(k => add('peel', SH.s56.t0 + .5 + k * .5, { v: .6 }));
  // —— A: dawn market ——
  add('basket', SH.s01.t0 + .3, { v: .4 }); add('claws', SH.s01.t0 + 1.8, { v: .7 }); add('paw', HIT.paw, { v: .5 });
  add('mew', SH.s03.t0 + .6, { v: .5 }); add('mew', SH.s04.t0 + .55, { v: .9 }); add('purr', SH.s05.t0 + .3, { d: 1.2, v: .3 });
  for (let k = 0; k < 4; k++) add('paw', SH.s06.t0 + k * b('A'), { v: .45 });
  add('yawn', SH.s07.t0 + .15, { d: 1.5, v: .7 }); add('scratch', SH.s07.t0 + 1.55, { v: .5 });
  add('claws', SH.s08.t0 + .55, { v: .5 }); add('fishslap', HIT.hook, { v: .9 }); add('drag', HIT.hook + .15, { d: .7, v: .6 }); add('basket', HIT.hook + .1, { v: .6 });
  add('gulp', SH.s09.t0 + .5, { v: .5 }); add('footturn', SH.s09.t0 + 1.1, { v: .6 });
  add('whoosh', SH.s11.t0 + .35, { d: .35, v: 1 });
  // —— B: the kite ——
  for (let k = 0; k < 3; k++) add('paw', SH.s12.t0 + k * b('B') * .5 + .1, { v: .35 });
  add('wing', HIT.stop + .5, { v: .5 }); add('wing', HIT.stop + 1.1, { v: .8 });
  add('snatch', HIT.snatch, { v: 1 }); add('kitecry', SH.s14.t0 + .4, { v: .8 });
  for (let k = 0; k < 4; k++) add('wing', SH.s14.t0 + k * .35, { v: .9 - k * .15 });
  add('jaw', SH.s14.t0 + .6, { v: .8 }); add('yowl', HIT.fury, { v: .9 });
  add('whoosh', SH.s16.t0 + .1, { d: .4, v: .6 }); add('pole', SH.s16.t0 + .6, { v: .5 });
  // —— C: the chase ——
  const run = (t0, t1, v = .35, m = 'soft') => { for (let t = t0; t < t1; t += .14) add('paw', t, { v, m }); };
  run(SH.s18.t0, SH.s18.t1, .3, 'wet'); run(SH.s19.t0, SH.s19.t0 + 1.8, .45, 'wet');
  add('umbrella', HIT.umbrella, { v: .9 }); add('thud', HIT.umbrella + .1, { v: .7 }); add('umbrella', HIT.umbrella + .55, { v: .6 });
  add('shake', SH.s21.t0 + .35, { d: 1.0, v: .8 });
  run(SH.s23.t0 + .3, SH.s23.t1, .25, 'snow'); add('breath', SH.s24.t0 + .6, { v: .5 });
  add('wing', SH.s25.t0 + .5, { v: .8 }); add('roofslide', SH.s25.t0 + .8, { d: HIT.bell - SH.s25.t0 - .8, v: .8 }); add('bell', HIT.bell, { v: 1 });
  add('snowdump', HIT.snowdump, { v: 1 }); add('thud', HIT.snowdump + .5, { v: .5 });
  run(SH.s29.t0, SH.s29.t1, .25, 'soft'); add('swish', SH.s30.t0 + .1, { d: 1.7, v: .8 });
  add('slip', HIT.splash - .2, { v: .3 }); add('splash', HIT.splash + .2, { v: 1 }); add('pop', HIT.splash + .25, { v: .7 });
  add('pant', SH.s33.t0, { d: 1.3, v: .6 });
  run(SH.s35.t0, SH.s35.t1, .3, 'soft'); add('scrabble', SH.s36.t0, { d: 1.6, v: .7 }); add('kitecry', SH.s36.t0 + .8, { v: .9 });
  add('pole', SH.s37.t0 + .3, { v: .4 }); add('pole', SH.s37.t0 + 1.1, { v: .4 }); add('pant', SH.s37.t0, { d: 1.6, v: .5, deep: 1 }); add('gasp', SH.s38.t0 + .8, { v: .6 });
  // —— D: the wave ——
  add('wavebuild', SH.s40.t0, { d: HIT.silence - SH.s40.t0, v: 1 });
  run(SH.s40.t0, SH.s40.t1, .3, 'sand'); add('creak', SH.s41.t0 + .3, { v: .8 }); add('thud', SH.s41.t0 + 1.2, { v: .6, wood: 1 });
  add('spray', SH.s42.t0, { v: 1 }); add('wing', SH.s42.t0 + .3, { v: .8 }); add('fishfall', SH.s42.t0 + .55, { v: .5 });
  add('creak', SH.s43.t0 + .5, { v: .6 });
  add('leap', SH.s45.t0 + .45, { v: .7 }); add('catch', HIT.catch, { v: 1 });
  add('crash', HIT.crash, { v: 1 }); add('thud', HIT.crash + .9, { v: .6, wood: 1 });
  // —— E: home ——
  add('templebell', SH.s48.t0 + .2, { v: .35 });
  for (let k = 0; k < 6; k++) add('paw', SH.s49.t0 + k * .37, { v: .35, m: 'wet' }); add('fishslap', SH.s49.t0 + 2.3, { v: .6 }); add('mew', SH.s49.t0 + 2.5, { v: .8 });
  for (let k = 0; k < 10; k++) add('nibble', SH.s50.t0 + .3 + k * .32, { v: .4 });
  add('footsteps', SH.s51.t0 + .1, { d: .8, v: .4 }); add('sigh', SH.s52.t0 + 1.1, { v: .7 });
  add('fishlay', HIT.gift, { v: .9 });
  for (let k = 0; k < 6; k++) add('step', SH.s55.t0 + .2 + k * .55, { v: .35, m: 'wood' });
  // the music grid and hit points for the score, the mixer and the cue check
  for (const s of SECS) ev.push({ t: s.t, type: 'sec', id: s.id, bpm: s.bpm, beats: s.beats });
  for (const [id, t] of Object.entries(HIT)) ev.push({ t: +t.toFixed(4), type: 'hit', id });
  for (const s of SHOTS) ev.push({ t: s.t0, type: 'shot', id: s.id, t1: s.t1 });
  return ev.sort((a, b) => a.t - b.t);
}
