// The places of the film, each a stack of paper sheets in a Scene; the shots place the camera and animate the items.
import { mulberry, TAU, clamp, lerp, seg, ss, vnoise } from '/core/lib.js';
import { Scene } from './engine.js';
import { piece, strip, cut, text } from './paper.js';
import * as Wd from './world.js';
import { figure, rabbitLantern, poleLantern, walk, run } from './rig.js';

export const PAL = {
  day:   { sky: '#f4cf98', sea: '#d8a878', far: '#b47a5c', head: '#946048', vill: '#7e4e3c', vill2: '#5c362a', near: '#3a2220', front: '#180c08', light: '#ffdcae', floor: .5, lit: 1, amb: .06, fog: null },
  dusk:  { sky: '#5e4280', sea: '#9a78ae', far: '#6a5486', head: '#523c6c', vill: '#4e3866', vill2: '#3c2c54', near: '#261c38', front: '#100a18', light: '#ffcaa0', floor: .42, lit: .92, amb: .03, fog: null },
  fog:   { sky: '#2a3448', sea: '#66768e', far: '#56647c', head: '#44526a', vill: '#36445c', vill2: '#2c3850', near: '#182030', front: '#0a0e18', light: '#d0d8e8', floor: .42, lit: .82, amb: .02, fog: '#9aa8ba' },
  night: { sky: '#0c1534', sea: '#5e7ab8', far: '#6c88c4', head: '#445e98', vill: '#3f5a92', vill2: '#30487c', near: '#1e2c5a', front: '#0e1532', light: '#ffd9a8', floor: .42, lit: 1, amb: .02, fog: null },
};
const F0 = { px: 2.5 };

// ———————————————————————— the village, the sea and the headland (wides, the harbour, the pier) ————————————————————————
export function village(variant, o = {}) {
  const P = PAL[variant], S = new Scene({ light: { x: -.04, y: .06, z: -.15, r: .24, col: P.light, lit: P.lit, floor: P.floor }, cam: { z: .5, focus: .6, aper: 2.4, maxCoc: 14 }, amb: P.amb });
  const it = {};
  // sky (the moon is a hole in it, with its glow gated; stars at night)
  const sky = S.layer({ z: -.142, trans: .95, floor: .62, shadow: false });
  const hasMoon = variant !== 'day';
  it.sky = S.add(sky, piece({ w: 1.3, h: .6, ppm: 1600, color: P.sky, finish: false, draw: x => { x.fillRect(-.65, -.3, 1.3, .6); if (hasMoon) Wd.moonHole(x, .17, .125, .021); if (variant === 'night' || variant === 'fog') it._stars = Wd.stars(x, { w: 1.3, h: .6, n: variant === 'night' ? 140 : 40, seed: 11, minY: .0 }); },
    glow: hasMoon ? g => { Wd.moonGlow(g, .17, .125, .021, variant === 'fog' ? '#e8eefc' : '#fff4d0'); if (it._stars) it._stars(g); } : null }), { gate: 1 });
  // the sea: far band with scallops, and in front of the village a nearer band
  const seaL = S.layer({ z: -.128, trans: .85 });
  it.sea = S.add(seaL, piece({ w: 1.3, h: .32, ppm: 2200, color: P.sea, finish: F0, draw: x => Wd.sea(x, { x0: -.65, x1: .65, top: .12, depth: .3, r: .007, seed: 1, rows: 4 }) }), { y: -.13 });
  // far boats with mast lamps
  const boatsL = S.layer({ z: -.124, trans: .7 });
  it.boats = [];
  [[.04, -.012, .013], [.11, -.006, .011], [.17, -.014, .012]].forEach(([bx, by, L], i) => {
    let lamp; const p = piece({ w: L * 1.6, h: L * 1.2, ppm: 9000, color: P.far, finish: { px: 1.5 }, draw: x => { lamp = Wd.boat(x, { cx: 0, y: -L * .3, L, flip: i === 1 }); }, glow: g => { g.fillStyle = '#ffd090'; g.beginPath(); g.arc(lamp.lamp.x, lamp.lamp.y, lamp.lamp.r * 1.3, 0, TAU); g.fill(); g.fillStyle = '#ffb870'; g.fillRect(lamp.win.x, lamp.win.y, lamp.win.w, lamp.win.h); } });
    it.boats.push(S.add(boatsL, p, { x: bx, y: by, gate: variant === 'day' ? 0 : 1 }));
  });
  // the headland with the old lighthouse (dark) and pines
  const headL = S.layer({ z: -.112, trans: .6 });
  const prof = u => { const s = ss((u - .0) / .22); return .095 * s + .012 * Math.sin(u * 60) * s + .006 * Math.sin(u * 150 + 1) * s; };
  it.head = S.add(headL, piece({ w: 1.2, h: .5, ppm: 2600, color: P.head, finish: F0, draw: x => Wd.rocks(x, { x0: -.1, x1: .7, base: -.04, h: .095, prof, seed: 5 }) }), { x: .1 });
  let LH; it.lighthouse = S.add(headL, piece({ w: .07, h: .1, ppm: 9000, color: variant === 'day' ? '#7a6a62' : P.vill2, finish: { px: 1.5, rim: .4 }, draw: x => { LH = Wd.lighthouse(x, { cx: 0, base: -.045, h: .085 }); }, glow: g => { g.fillStyle = '#ffd9a0'; for (const p of LH.lamp.panes) g.fillRect(p.x, p.y, p.w, p.h); } }), { x: .25, y: .1, gate: 0 });
  S.add(headL, piece({ w: .5, h: .08, ppm: 3000, color: P.vill2, finish: F0, draw: x => Wd.pines(x, { x0: -.1, x1: .25, base: -.04, h: .026, gap: .018, seed: 7 }) }), { x: .44, y: .085 });
  S.add(headL, piece({ w: .5, h: .14, ppm: 3000, color: P.vill2, finish: F0, draw: x => Wd.pines(x, { x0: -.12, x1: .1, base: u => -.045 + prof(u + .13) - .004, h: .02, gap: .017, seed: 8 }) }), { x: .23, y: .0 });
  // the village: back row on the hill, front row by the harbour; lanterns hang at the eaves (lit from dusk)
  const hill = u => { let y = 0; for (const [cx, hh, w] of [[-.42, .11, .3], [-.14, .06, .2]]) { const d = Math.abs(u - cx) / w; y = Math.max(y, hh * Math.max(0, 1 - d * d)); } return y; };
  const backL = S.layer({ z: -.098, trans: .5 });
  it.backHoles = [];
  S.add(backL, piece({ w: 1.3, h: .5, ppm: 2400, color: P.vill, finish: F0, draw: x => {
    Wd.hills(x, { x0: -.65, x1: .65, base: -.045, list: [[-.42, .11, .3], [-.14, .06, .2]] });
    for (const [hx, w, h, win, sd] of [[-.5, .05, .03, 2, 1], [-.44, .045, .028, 1, 2], [-.37, .055, .032, 2, 3], [-.3, .05, .03, 2, 4], [-.23, .048, .028, 1, 5], [-.16, .052, .031, 2, 6], [-.09, .046, .027, 1, 7], [-.03, .05, .03, 2, 8]]) it.backHoles.push(...Wd.house(x, { cx: hx, base: -.045 + hill(hx) - .004, w, h, win, seed: sd }));
  }, glow: g => Wd.houseGlow(g, it.backHoles, '#ffb862') }), { gate: variant === 'day' ? 0 : 1 });
  const frontVL = S.layer({ z: -.08, trans: .35 });
  it.frontHoles = []; it.eaves = [];
  const fv = piece({ w: 1.3, h: .4, ppm: 3000, color: P.vill2, finish: F0, draw: x => {
    x.fillRect(-.65, -.2, .62, .14);   // the quay (the sea is open to the right of it)
    for (const [hx, w, h, win, door, sd] of [[-.47, .07, .04, 2, false, 11], [-.37, .075, .044, 2, true, 12], [-.27, .068, .04, 2, false, 13], [-.17, .072, .042, 2, true, 14], [-.08, .066, .04, 2, false, 15]]) it.frontHoles.push(...Wd.house(x, { cx: hx, base: -.06, w, h, win, door, seed: sd }));
    Wd.pier(x, { x0: -.04, x1: .11, y: -.063, h: .006, posts: 7 });
    // lanterns at the eaves and on the pier posts: lotus, fish, star, carp
    it.eaves = [Wd.eaveLantern(x, -.335, -.018, 'lotus', .009, Wd.LANTERN_COL.lotus), Wd.eaveLantern(x, .105, -.034, 'fish', .009, Wd.LANTERN_COL.fish), Wd.eaveLantern(x, -.2, -.015, 'star', .009, Wd.LANTERN_COL.star), Wd.eaveLantern(x, -.06, -.017, 'carp', .009, Wd.LANTERN_COL.carp)];
  } });
  // the eave lanterns glow separately so each can light on its own beat
  it.frontV = S.add(frontVL, fv, {});
  it.frontWin = S.add(frontVL, piece({ w: 1.3, h: .4, ppm: 3000, color: '#000', finish: false, draw: () => {}, glow: g => Wd.houseGlow(g, it.frontHoles, '#ffb862') }), { gate: variant === 'day' ? 0 : 1 });
  it.eaveItems = [];
  [[-.335, -.018, 'lotus'], [.105, -.034, 'fish'], [-.2, -.015, 'star'], [-.06, -.017, 'carp']].forEach(([lx, ly, kind]) => {
    it.eaveItems.push(S.add(frontVL, piece({ w: .05, h: .05, ppm: 6000, color: '#000', finish: false, draw: () => {}, glow: g => { g.save(); g.translate(0, -.009 * 1.05); Wd.lanternGlow(g, kind, .009); g.restore(); } }), { x: lx, y: ly, gate: variant === 'day' || variant === 'dusk' ? 0 : 1 }));
  });
  // fog sheets (only in the fog variant), slid in by the shots
  it.fog = [];
  if (P.fog) for (const [z, seed, a] of [[-.119, 21, .5], [-.104, 22, .5], [-.09, 23, .48], [-.07, 24, .45]]) {
    const L = S.layer({ z, trans: .92, floor: .6, alpha: a, fog: true, shadow: false, recv: false });
    it.fog.push({ L, it: S.add(L, piece({ w: 1.5, h: .24, ppm: 1600, color: P.fog, finish: false, draw: x => Wd.fogSheet(x, { w: 1.5, h: .24, seed }) }), { x: .9, y: -.03 + (seed - 21) * .012 }), a });
  }
  // near rocks and the front silhouette
  const nearL = S.layer({ z: -.055, trans: .15 });
  S.add(nearL, piece({ w: 1.4, h: .3, ppm: 2400, color: P.near, finish: F0, draw: x => Wd.rocks(x, { x0: -.7, x1: .7, base: -.15, h: .055, seed: 31, jag: 1.4 }) }), { y: -.03 });
  const frontL = S.layer({ z: -.03, trans: .05 });
  S.add(frontL, piece({ w: .5, h: .3, ppm: 3000, color: P.front, finish: F0, draw: x => { Wd.rocks(x, { x0: -.25, x1: .25, base: -.15, h: .06, seed: 41, jag: 1.6 }); } }), { x: -.38, y: -.07 });
  S.add(frontL, piece({ w: .5, h: .3, ppm: 3000, color: P.front, finish: F0, draw: x => { Wd.rocks(x, { x0: -.25, x1: .25, base: -.15, h: .045, seed: 42, jag: 1.6 }); } }), { x: .4, y: -.075 });
  // strips (the opening only)
  if (variant === 'day') {
    const stripL = S.layer({ z: -.012, trans: .5, shadow: false, recv: false });
    it.title = S.add(stripL, strip({ w: .2, h: .05, text: '中秋的灯', size: .034, font: 'MaShanZheng', name: 'title', paper: '#f3e2bd', ink: '#3a1810', spacing: .003 }), { x: .09, y: .085, reveal: { from: 'right', k: 0 }, vis: true });
    it.seal = S.add(stripL, piece({ w: .02, h: .02, ppm: 8000, color: '#c8322a', finish: { px: 2, rim: .2, under: .2 }, draw: x => { x.beginPath(); x.roundRect(-.007, -.007, .014, .014, .001); x.fill(); text(x, '月', 0, .0003, .0105, 'MaShanZheng', { fill: '#f7e9d2' }); } }), { x: .172, y: .072, vis: false });
    const capL = S.layer({ z: -.074, trans: .5, shadow: false, recv: false });
    it.caption = S.add(capL, strip({ w: .16, h: .022, text: '八月十五 · 石崖渔村', size: .013, font: 'MaShanZheng', name: 'caption', paper: '#efdcb4', ink: '#3a1810', spacing: .001 }), { x: -.09, y: -.078, reveal: { from: 'left', k: 0 } });
  }
  // figures at the pier end (built on demand by the shots)
  const figL = S.layer({ z: -.072, trans: .1 });
  it.figL = figL;
  const t0 = {};
  const update = t => {
    it.sea.x = .003 * Math.sin(t * .45); it.sea.y = -.13 + .001 * Math.sin(t * .7);
    it.boats.forEach((b, i) => { b.y = (i === 1 ? -.006 : i ? -.014 : -.012) + .0012 * Math.sin(t * 1.1 + i * 2); b.rot = .03 * Math.sin(t * .9 + i); });
    for (const e of it.eaveItems) e.gate = Math.min(1, e.gate) * (e.gate > 0 ? 1 + .05 * Math.sin(7.3 * t) * Math.sin(3.1 * t + e.x * 100) : 0);
  };
  return { S, it, update, variant };
}

// ———————————————————————— the house (afternoon, and the cold evening) ————————————————————————
export function interior(variant) {
  const day = variant === 'day';
  const C = day ? { sky: '#f8e0ae', out: '#c89068', wall: '#d19a5c', back: '#8c4c26', table: '#4a2410', props: '#5a2c14', front: '#1c0c06', light: '#ffdcae', lit: 1.05, floor: .62, amb: .1 }
                : { sky: '#6a7a94', out: '#3c4a62', wall: '#4e4036', back: '#2e2018', table: '#1c1410', props: '#2a1a10', front: '#0a0604', light: '#d8dcec', lit: .75, floor: .4, amb: .03 };
  const S = new Scene({ light: { x: .08, y: .02, z: -.15, r: .2, col: C.light, lit: C.lit, floor: C.floor }, cam: { z: .22, focus: .29, aper: 2, maxCoc: 14 }, amb: C.amb });
  const it = {};
  const sky = S.layer({ z: -.142, trans: .95, floor: .7, shadow: false });
  S.add(sky, piece({ w: .8, h: .5, ppm: 1600, color: C.sky, finish: false, draw: x => x.fillRect(-.4, -.25, .8, .5) }));
  // outside, seen through the door: the headland and the dark lighthouse
  const outL = S.layer({ z: -.13, trans: .75 });
  let LH; S.add(outL, piece({ w: .5, h: .3, ppm: 4000, color: C.out, finish: F0, draw: x => { Wd.rocks(x, { x0: -.25, x1: .25, base: -.1, h: .07, prof: u => .07 * ss((u + .25) / .3), seed: 5 }); LH = Wd.lighthouse(x, { cx: .1, base: -.03, h: .07 }); } }), { x: -.245, y: -.02 });
  // the wall with a lattice window and the door opening
  const wallL = S.layer({ z: -.115, trans: .45 });
  it.winRect = null;
  S.add(wallL, piece({ w: .8, h: .5, ppm: 2800, color: C.wall, finish: F0, draw: x => { x.fillRect(-.4, -.25, .8, .5); it.winRect = Wd.lattice(x, { cx: .085, cy: .025, w: .1, h: .085, nx: 3, ny: 3 }); cut(x, () => { x.beginPath(); x.roundRect(-.2, -.12, .07, .17, [0, 0, .035, .035]); x.fill(); }); cut(x, () => { const R = mulberry(17); x.lineWidth = .0008; for (let i = 0; i < 60; i++) { const yy = -.12 + R() * .3, xx = -.12 + R() * .5, w = .008 + R() * .02; if (xx > .02 && xx < .15 && yy > -.03 && yy < .08) continue; x.beginPath(); x.moveTo(xx, yy); x.lineTo(xx + w, yy + (R() - .5) * .002); x.stroke(); } }); } }));
  // a shelf with jars, a hanging oil lamp (the house lamp), a hanging festival lantern
  const backL = S.layer({ z: -.1, trans: .3 });
  it.lamp = S.add(backL, piece({ w: .06, h: .08, ppm: 6000, color: C.back, finish: { px: 2 }, draw: x => { x.fillRect(-.002, 0, .004, .03); x.beginPath(); x.moveTo(-.012, 0); x.lineTo(.012, 0); x.lineTo(.008, -.028); x.lineTo(-.008, -.028); x.closePath(); x.fill(); cut(x, () => { x.beginPath(); x.ellipse(0, -.014, .006, .009, 0, 0, TAU); x.fill(); }); x.fillRect(-.009, -.03, .018, .003); }, glow: g => { g.fillStyle = '#ffc070'; g.beginPath(); g.ellipse(0, -.014, .006, .009, 0, 0, TAU); g.fill(); } }), { x: -.07, y: .06, gate: day ? 0 : 1 });
  S.add(backL, piece({ w: .2, h: .1, ppm: 4000, color: C.back, finish: F0, draw: x => { x.fillRect(-.1, 0, .2, .005); for (const [jx, jw, jh] of [[-.07, .018, .03], [-.04, .014, .022], [.0, .02, .035], [.04, .012, .018], [.07, .016, .026]]) { x.beginPath(); x.roundRect(jx - jw / 2, .005, jw, jh, jw * .3); x.fill(); x.fillRect(jx - jw * .3, .005 + jh, jw * .6, .004); } } }), { x: -.02, y: .04 });
  it.eave = S.add(backL, piece({ w: .04, h: .05, ppm: 6000, color: C.back, finish: { px: 2 }, draw: x => { x.fillRect(-.001, .012, .002, .013); Wd.lantern(x, 'round', .009, {}); }, glow: g => Wd.lanternGlow(g, 'round', .009) }), { x: .19, y: .07, gate: day ? 0 : 1 });
  // the mother, behind the table, and A-Yue at the table
  it.figL = S.layer({ z: -.082, trans: .12 });
  it.mother = figure(S, it.figL, { kind: 'mother', ppm: day ? 9000 : 10000, facing: 1 });
  it.yueL = S.layer({ z: -.076, trans: .1 });
  it.yue = figure(S, it.yueL, { kind: 'girl', ppm: 16000, facing: 1 });
  // the table and the things on it: the red paper, the mooncake box, the radio
  const tableL = S.layer({ z: -.066, trans: .18 });
  S.add(tableL, piece({ w: .3, h: .12, ppm: 4000, color: C.table, finish: F0, draw: x => Wd.tableTop(x, { x0: -.12, x1: .14, y: .0, th: .007 }) }), { x: .03, y: -.06 });
  it.stool = S.add(S.layer({ z: -.079, trans: .15 }), piece({ w: .05, h: .03, ppm: 5000, color: C.table, finish: F0, draw: x => Wd.stool(x, 0, -.02, .03, .02) }), { x: -.03, y: -.08 });
  const propL = S.layer({ z: -.06, trans: .28 });
  it.propL = propL;
  it.box = S.add(propL, piece({ w: .07, h: .03, ppm: 8000, color: C.props, finish: { px: 2 }, draw: x => Wd.mooncakeBox(x, { cx: 0, cy: .0, w: .06, h: .022 }) }), { x: .05, y: -.049 });
  it.lid = S.add(propL, piece({ w: .07, h: .03, ppm: 8000, color: C.props, finish: { px: 2 }, ax: -.03, ay: 0, draw: x => { x.beginPath(); x.roundRect(-.031, -.003, .062, .006, .002); x.fill(); cut(x, () => { x.lineWidth = .0006; x.beginPath(); x.moveTo(-.026, 0); x.lineTo(.026, 0); x.stroke(); }); } }), { x: .02, y: -.038, rot: 0 });
  it.cakes = [];
  [-.016, 0, .016].forEach((cx, i) => it.cakes.push(S.add(propL, piece({ w: .02, h: .02, ppm: 10000, color: '#a07848', finish: { px: 2, rim: .45 }, draw: x => Wd.mooncake(x, 0, 0, .007), glow: g => { g.fillStyle = '#ffd8a0'; g.lineWidth = .0005; g.beginPath(); g.arc(0, 0, .0043, 0, TAU); g.stroke(); } }), { x: .05 + cx, y: -.044, gate: .8, vis: false })));
  let dial; it.radio = S.add(propL, piece({ w: .05, h: .04, ppm: 8000, color: C.props, finish: { px: 2 }, draw: x => { dial = Wd.radio(x, { cx: 0, cy: 0, w: .036, h: .022 }); }, glow: g => { g.fillStyle = '#ffd890'; g.fillRect(dial.x, dial.y, dial.w, dial.h); } }), { x: .105, y: -.042, gate: day ? .2 : 1 });
  it.paper = S.add(propL, piece({ w: .05, h: .04, ppm: 8000, color: '#c8261e', finish: { px: 2, rim: .4 }, draw: x => { x.beginPath(); x.moveTo(-.02, -.006); x.lineTo(.02, -.006); x.lineTo(.018, .004); x.lineTo(-.016, .005); x.closePath(); x.fill(); } }), { x: -.045, y: -.056 });
  // the front: a door jamb at the left, a beam at the top
  const frontL = S.layer({ z: -.03, trans: .04 });
  S.add(frontL, piece({ w: .05, h: .4, ppm: 2000, color: C.front, finish: F0, draw: x => x.fillRect(-.025, -.2, .05, .4) }), { x: -.255, y: 0 });
  S.add(frontL, piece({ w: .8, h: .08, ppm: 2000, color: C.front, finish: F0, draw: x => x.fillRect(-.4, -.04, .8, .08) }), { x: .1, y: .16 });
  const update = t => { if (!day) it.lamp.gate = 1 + .06 * Math.sin(7.3 * t) * Math.sin(3.1 * t); };
  return { S, it, update, variant };
}

// the cutting insert, top-down: the red sheet, the scissors, the hands
export function cuttingTop() {
  const S = new Scene({ light: { x: 0, y: .0, z: -.15, r: .25, col: '#ffdcae', lit: 1.1, floor: .7 }, cam: { z: .2, focus: .24, aper: 2, maxCoc: 10 }, amb: .14 });
  const it = {};
  const tableL = S.layer({ z: -.08, trans: .55 });
  S.add(tableL, piece({ w: .5, h: .3, ppm: 2400, color: '#6a3a1c', finish: F0, draw: x => { x.fillRect(-.25, -.15, .5, .3); cut(x, () => { x.lineWidth = .0007; for (let i = 0; i < 12; i++) { const yy = -.14 + i * .025; x.beginPath(); x.moveTo(-.25, yy + .003 * Math.sin(i)); x.lineTo(.25, yy - .002 * Math.sin(i * 2)); x.stroke(); } }); } }));
  // the rabbit outline (metre space, origin at the sheet centre)
  const R = .012;
  const outline = []; { const n = 72; for (let i = 0; i <= n; i++) { const a = i / n * TAU; let r = R * (1 + .08 * Math.cos(2 * a)); let px = Math.cos(a) * r * 1.15, py = Math.sin(a) * r * .95 - R * .3; if (a > Math.PI * .25 && a < Math.PI * .75) { const e = Math.sin((a - Math.PI * .25) * 2) ; py += R * .9 * e * (Math.abs(a - Math.PI / 2) < .35 ? .4 : 1); } outline.push([px, py]); } }
  const sheetL = S.layer({ z: -.07, trans: .6 });
  it.sheet = S.add(sheetL, piece({ w: .09, h: .07, ppm: 7000, color: '#c8261e', finish: { px: 2, rim: .4 }, draw: x => { x.beginPath(); x.moveTo(-.04, -.03); x.lineTo(.042, -.028); x.lineTo(.04, .032); x.lineTo(-.042, .03); x.closePath(); x.fill(); } }), { rot: -.08 });
  // the growing slit, re-baked by progress (cheap: a small canvas)
  const slitL = S.layer({ z: -.069, trans: .3, shadow: false });
  it.slit = S.add(slitL, piece({ w: .09, h: .07, ppm: 7000, color: '#000', finish: false, draw: () => {} }), { rot: -.08 });
  it.setCut = k => { const key = Math.round(clamp(k) * 72); if (it._k === key) return; it._k = key; it.slit.p = piece({ w: .09, h: .07, ppm: 7000, color: '#3a1a0c', finish: false, draw: x => { x.lineWidth = .0012; x.lineCap = 'round'; x.beginPath(); for (let i = 0; i <= key; i++) { const [px, py] = outline[i]; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); } }); };
  it.setCut(0);
  // the cut rabbit: the same outline as a separate red piece (lifts free at the end)
  const rabL = S.layer({ z: -.062, trans: .6 });
  it.rabbit = S.add(rabL, piece({ w: .05, h: .05, ppm: 8000, color: '#c8261e', finish: { px: 2, rim: .4 }, draw: x => { x.beginPath(); outline.forEach(([px, py], i) => i ? x.lineTo(px, py) : x.moveTo(px, py)); x.closePath(); x.fill(); cut(x, () => { x.beginPath(); x.ellipse(R * .4, -R * .2, R * .12, R * .15, 0, 0, TAU); x.fill(); }); } }), { vis: false, rot: -.08 });
  // the scissors and the hands (A-Yue's mitten hands, from above)
  const toolL = S.layer({ z: -.055, trans: .08 });
  it.scis = S.add(toolL, piece({ w: .05, h: .06, ppm: 8000, color: '#2a2a30', finish: { px: 2, rim: .5 }, ax: 0, ay: 0, draw: x => Wd.scissors(x, { L: .024, a: .35 }) }), { x: 0, y: 0, rot: 0 });
  it.scisOpen = a => { const key = Math.round(a * 10); if (it._sk === key) return; it._sk = key; it.scis.p = piece({ w: .05, h: .06, ppm: 8000, color: '#2a2a30', finish: { px: 2, rim: .5 }, draw: x => Wd.scissors(x, { L: .024, a: key / 10 }) }); };
  const hand = (name) => piece({ w: .04, h: .05, ppm: 8000, color: '#140c08', finish: { px: 2, rim: .35 }, name, draw: x => { x.beginPath(); x.ellipse(0, 0, .0065, .0085, 0, 0, TAU); x.fill(); x.fillRect(-.0055, -.03, .011, .024); cut(x, () => { x.lineWidth = .0006; for (const k of [-.003, 0, .003]) { x.beginPath(); x.moveTo(k, .002); x.lineTo(k * 1.2, .008); x.stroke(); } }); } });
  it.handR = S.add(toolL, hand('handR'), { x: .0, y: -.03, rot: 0 });
  it.handL = S.add(toolL, hand('handL'), { x: -.03, y: .0, rot: .9 });
  it.outline = outline;
  return { S, it, update: () => {} };
}

// ———————————————————————— the cliff, the path and the lighthouse (close) ————————————————————————
export const PATH = [[-.3, -.14], [-.12, -.1], [-.22, -.055], [-.02, -.02], [-.12, .02], [.08, .055], [.16, .07]];   // the zigzag up to the tower door
export function pathAt(u) { const n = PATH.length - 1, k = Math.min(n - 1, Math.floor(u * n)), f = u * n - k; return [lerp(PATH[k][0], PATH[k + 1][0], f), lerp(PATH[k][1], PATH[k + 1][1], f), Math.sign(PATH[k + 1][0] - PATH[k][0]) || 1]; }
export function cliff(o = {}) {
  const P = PAL.fog, S = new Scene({ light: { x: .0, y: .08, z: -.15, r: .26, col: P.light, lit: .82, floor: .42 }, cam: { z: .5, focus: .6, aper: 2.4, maxCoc: 14 }, amb: .02 });
  const it = {};
  const sky = S.layer({ z: -.142, trans: .95, floor: .62, shadow: false });
  S.add(sky, piece({ w: 1.3, h: .7, ppm: 1600, color: P.sky, finish: false, draw: x => { x.fillRect(-.65, -.35, 1.3, .7); Wd.moonHole(x, -.1, .2, .021); it._stars = Wd.stars(x, { w: 1.3, h: .7, n: 60, seed: 12, minY: .02 }); }, glow: g => { Wd.moonGlow(g, -.1, .2, .021, '#e8eefc'); it._stars(g); } }), { gate: .2 });
  it.skyGlow = sky.items[0];
  const seaL = S.layer({ z: -.128, trans: .85 });
  it.sea = S.add(seaL, piece({ w: 1.3, h: .3, ppm: 2200, color: P.sea, finish: F0, draw: x => Wd.sea(x, { x0: -.65, x1: .65, top: .12, depth: .3, r: .008, seed: 2, rows: 3 }) }), { y: -.2 });
  // fog, four sheets
  it.fog = [];
  for (const [z, seed, a, y] of [[-.12, 31, .5, .0], [-.102, 32, .5, -.03], [-.088, 33, .45, .02], [-.064, 34, .4, -.06]]) {
    const L = S.layer({ z, trans: .92, floor: .6, alpha: a, fog: true, shadow: false, recv: false });
    it.fog.push({ L, it: S.add(L, piece({ w: 1.6, h: .3, ppm: 1500, color: P.fog, finish: false, draw: x => Wd.fogSheet(x, { w: 1.6, h: .3, seed }) }), { x: 0, y }), a, y });
  }
  // the headland mass (back), the tower on its plateau, pines
  const headL = S.layer({ z: -.11, trans: .6 });
  const prof = u => .2 * ss((u + .35) / .5) + .008 * Math.sin(u * 50) + .004 * Math.sin(u * 130);
  S.add(headL, piece({ w: 1.4, h: .6, ppm: 2400, color: P.head, finish: F0, draw: x => Wd.rocks(x, { x0: -.7, x1: .7, base: -.16, h: .2, prof, seed: 6 }) }));
  let LH; it.tower = S.add(headL, piece({ w: .09, h: .15, ppm: 8000, color: P.vill2, finish: { px: 2, rim: .4 }, draw: x => { LH = Wd.lighthouse(x, { cx: 0, base: -.06, h: .12 }); }, glow: g => { g.fillStyle = '#ffd9a0'; for (const p of LH.lamp.panes) g.fillRect(p.x, p.y, p.w, p.h); } }), { x: .2, y: .09, gate: 0 });
  it.LH = () => LH;
  // the slit windows as separate lights (each gated), and the lamp-room's rabbit dot
  it.slits = LH.slits.map(s => S.add(headL, piece({ w: s.w * 3, h: s.h * 2, ppm: 8000, color: '#000', finish: false, draw: () => {}, glow: g => { g.fillStyle = '#ff9a60'; g.beginPath(); g.roundRect(-s.w / 2, -s.h / 2, s.w, s.h, s.w / 2); g.fill(); } }), { x: .2 + s.x + s.w / 2, y: .09 + s.y + s.h / 2, gate: 0 }));
  it.dot = S.add(headL, piece({ w: .01, h: .01, ppm: 12000, color: '#000', finish: false, draw: () => {}, glow: g => { g.fillStyle = '#ff8a50'; g.beginPath(); g.arc(0, 0, .0022, 0, TAU); g.fill(); } }), { x: .2 + LH.lamp.panes[1].x + LH.lamp.panes[1].w / 2, y: .09 + LH.lamp.y + LH.lamp.h * .4, gate: 0 });
  S.add(headL, piece({ w: .4, h: .08, ppm: 3000, color: P.vill2, finish: F0, draw: x => Wd.pines(x, { x0: -.2, x1: .2, base: -.04, h: .03, gap: .02, seed: 9 }) }), { x: .4, y: .09 });
  // the gallery: figures with lanterns stand on it (built by the shots)
  it.galleryL = S.layer({ z: -.106, trans: .5 });
  // the front slope with the path (its own lighter sheet), figures on the path, A-Yue's small lantern
  const slopeL = S.layer({ z: -.09, trans: .4 });
  S.add(slopeL, piece({ w: 1.4, h: .5, ppm: 2400, color: P.vill, finish: F0, draw: x => Wd.rocks(x, { x0: -.7, x1: .7, base: -.2, h: .25, prof: u => .25 * ss((u + .4) / .55) * (u < .2 ? 1 : 1 - (u - .2) * .3) + .01 * Math.sin(u * 70) , seed: 7 }) }), { y: -.02 });
  const pathL = S.layer({ z: -.086, trans: .45, shadow: false });
  S.add(pathL, piece({ w: 1.0, h: .4, ppm: 3000, color: P.far, finish: { px: 2, rim: .2 }, draw: x => { x.strokeStyle = x.fillStyle; Wd.pathBand(x, { pts: PATH, w: .012 }); } }), { y: .006 });
  it.figL = S.layer({ z: -.082, trans: .12 });
  it.closeL = S.layer({ z: -.078, trans: .12 });
  // front rocks and a dark edge
  const nearL = S.layer({ z: -.05, trans: .12 });
  S.add(nearL, piece({ w: 1.4, h: .3, ppm: 2400, color: P.near, finish: F0, draw: x => Wd.rocks(x, { x0: -.7, x1: .7, base: -.15, h: .06, seed: 51, jag: 1.5 }) }), { y: -.09 });
  const frontL = S.layer({ z: -.028, trans: .04 });
  S.add(frontL, piece({ w: .6, h: .4, ppm: 2400, color: P.front, finish: F0, draw: x => Wd.rocks(x, { x0: -.3, x1: .3, base: -.2, h: .09, seed: 52, jag: 1.8 }) }), { x: -.42, y: -.1 });
  // the lamp-room sill (for the point of view from the window)
  it.sill = S.add(frontL, piece({ w: 1.2, h: .2, ppm: 2000, color: P.front, finish: F0, draw: x => { x.fillRect(-.6, -.1, 1.2, .2); } }), { y: -.2, vis: false });
  const update = t => { it.sea.x = .003 * Math.sin(t * .4); for (const f of it.fog) { f.it.x = .01 * Math.sin(t * .13 + f.y * 40); } };
  return { S, it, update };
}

// ———————————————————————— the lamp room ————————————————————————
export function lampRoom() {
  const P = PAL.fog, S = new Scene({ light: { x: -.02, y: .03, z: -.15, r: .2, col: P.light, lit: .8, floor: .45 }, cam: { z: .2, focus: .27, aper: 2, maxCoc: 14 }, amb: .02 });
  const it = {};
  const sky = S.layer({ z: -.142, trans: .95, floor: .6, shadow: false });
  S.add(sky, piece({ w: .8, h: .5, ppm: 1600, color: P.sky, finish: false, draw: x => x.fillRect(-.4, -.25, .8, .5) }));
  it.fog = [];
  for (const [z, seed, a] of [[-.125, 41, .55], [-.112, 42, .5]]) { const L = S.layer({ z, trans: .92, floor: .6, alpha: a, fog: true, shadow: false, recv: false }); it.fog.push({ L, it: S.add(L, piece({ w: 1.2, h: .3, ppm: 1500, color: P.fog, finish: false, draw: x => Wd.fogSheet(x, { w: 1.2, h: .3, seed, top: .6 }) }), { y: .02 }), a }); }
  // the railing outside the glass
  const railL = S.layer({ z: -.105, trans: .3 });
  S.add(railL, piece({ w: .6, h: .1, ppm: 3000, color: P.vill2, finish: F0, draw: x => { x.fillRect(-.3, -.002, .6, .004); x.fillRect(-.3, -.05, .6, .004); for (let i = 0; i <= 14; i++) x.fillRect(-.3 + i * .6 / 14 - .0015, -.05, .003, .05); } }), { y: -.04 });
  // the wall of the lamp room with three panes
  const wallL = S.layer({ z: -.095, trans: .4 });
  S.add(wallL, piece({ w: .8, h: .5, ppm: 2400, color: '#2e3a50', finish: F0, draw: x => { x.fillRect(-.4, -.25, .8, .5); cut(x, () => { for (let i = -1; i <= 1; i++) { x.beginPath(); x.rect(i * .11 - .045, -.07, .09, .16); x.fill(); } }); for (let i = -1; i <= 1; i++) { x.fillRect(i * .11 - .001, -.07, .002, .16); x.fillRect(i * .11 - .045, .02, .09, .002); } } }));
  // the dead lamp: a pale glass drum on a pedestal, unlit; its lens rings cut
  const lampL = S.layer({ z: -.088, trans: .55 });
  it.deadLamp = S.add(lampL, piece({ w: .1, h: .14, ppm: 5000, color: '#6a7488', finish: { px: 2, rim: .45 }, draw: x => { x.beginPath(); x.roundRect(-.028, -.02, .056, .075, .006); x.fill(); x.fillRect(-.02, -.05, .04, .03); x.fillRect(-.03, -.052, .06, .004); cut(x, () => { x.lineWidth = .0012; for (let k = 0; k < 5; k++) { x.beginPath(); x.ellipse(0, .018, .02, .006 + k * .005, 0, 0, TAU); x.stroke(); } }); }, glow: g => { g.fillStyle = '#fff0c8'; g.beginPath(); g.roundRect(-.026, -.018, .052, .07, .006); g.fill(); } }), { x: .08, y: -.02, gate: 0 });
  // the sill, the rabbit lantern on it; A-Yue
  it.figL = S.layer({ z: -.074, trans: .12 });
  it.yue = figure(S, it.figL, { kind: 'girl', ppm: 18000, facing: 1 });
  const sillL = S.layer({ z: -.07, trans: .12 });
  S.add(sillL, piece({ w: .8, h: .1, ppm: 2400, color: '#161c2c', finish: F0, draw: x => { x.fillRect(-.4, -.05, .8, .05); cut(x, () => { x.lineWidth = .0008; for (let i = 0; i < 20; i++) { x.beginPath(); x.moveTo(-.4 + i * .04, -.03); x.lineTo(-.4 + i * .04 + .03, -.03); x.stroke(); } }); } }), { y: -.04 });
  it.propL = S.layer({ z: -.066, trans: .1 });
  it.rabbitStill = S.add(it.propL, piece({ w: .03, h: .03, ppm: 14000, color: '#c8261e', finish: { px: 2, rim: .35 }, ax: 0, ay: .012, draw: x => { x.save(); x.translate(0, .012); Wd.rabbit(x, .0034); x.restore(); }, glow: x => { x.save(); x.translate(0, .012); Wd.rabbitGlow(x, .0034); x.restore(); } }), { x: -.03, y: -.04, gate: 1, vis: false });
  const frontL = S.layer({ z: -.03, trans: .04 });
  S.add(frontL, piece({ w: .12, h: .5, ppm: 2000, color: '#0a0e18', finish: F0, draw: x => x.fillRect(-.06, -.25, .12, .5) }), { x: -.2 });
  const update = t => { for (const f of it.fog) f.it.x = .008 * Math.sin(t * .17 + f.a * 10); };
  return { S, it, update };
}

// the lamp room seen from outside (A-Yue in the window)
export function lampRoomExt() {
  const P = PAL.fog, S = new Scene({ light: { x: .0, y: .02, z: -.15, r: .2, col: P.light, lit: .85, floor: .45 }, cam: { z: .2, focus: .3, aper: 2, maxCoc: 14 }, amb: .02 });
  const it = {};
  const sky = S.layer({ z: -.142, trans: .95, floor: .6, shadow: false });
  S.add(sky, piece({ w: .8, h: .5, ppm: 1600, color: P.sky, finish: false, draw: x => x.fillRect(-.4, -.25, .8, .5) }));
  const fogL = S.layer({ z: -.128, trans: .92, floor: .6, alpha: .5, fog: true, shadow: false, recv: false });
  it.fog = S.add(fogL, piece({ w: 1.2, h: .3, ppm: 1500, color: P.fog, finish: false, draw: x => Wd.fogSheet(x, { w: 1.2, h: .3, seed: 44, top: .6 }) }), { y: .0 });
  // the back wall of the lamp room with its panes, the dead lamp, A-Yue, the front panes' frame, the railing, the dome
  const backL = S.layer({ z: -.118, trans: .4 });
  S.add(backL, piece({ w: .5, h: .3, ppm: 2400, color: '#2e3a50', finish: F0, draw: x => { x.fillRect(-.25, -.15, .5, .12); x.fillRect(-.25, .09, .5, .06); for (let i = -2; i <= 2; i++) x.fillRect(i * .09 - .003, -.03, .006, .12); } }));
  const lampL = S.layer({ z: -.112, trans: .55 });
  it.deadLamp = S.add(lampL, piece({ w: .1, h: .14, ppm: 5000, color: '#5e6878', finish: { px: 2, rim: .45 }, draw: x => { x.beginPath(); x.roundRect(-.028, -.02, .056, .075, .006); x.fill(); x.fillRect(-.02, -.05, .04, .03); cut(x, () => { x.lineWidth = .0012; for (let k = 0; k < 5; k++) { x.beginPath(); x.ellipse(0, .018, .02, .006 + k * .005, 0, 0, TAU); x.stroke(); } }); }, glow: g => { g.fillStyle = '#fff0c8'; g.beginPath(); g.roundRect(-.026, -.018, .052, .07, .006); g.fill(); } }), { x: .07, y: -.03, gate: 0 });
  it.figL = S.layer({ z: -.1, trans: .12 });
  it.yue = figure(S, it.figL, { kind: 'girl', ppm: 16000, facing: 1 });
  const frameL = S.layer({ z: -.09, trans: .3 });
  S.add(frameL, piece({ w: .6, h: .4, ppm: 2400, color: '#1c2434', finish: F0, draw: x => { x.fillRect(-.3, -.2, .6, .4); cut(x, () => { for (let i = -1; i <= 1; i++) { x.beginPath(); x.rect(i * .11 - .048, -.075, .096, .165); x.fill(); } }); for (let i = -1; i <= 1; i++) x.fillRect(i * .11 - .001, -.075, .002, .165); } }));
  const railL = S.layer({ z: -.08, trans: .2 });
  S.add(railL, piece({ w: .6, h: .1, ppm: 3000, color: '#141a28', finish: F0, draw: x => { x.fillRect(-.3, -.002, .6, .004); x.fillRect(-.3, -.046, .6, .004); for (let i = 0; i <= 16; i++) x.fillRect(-.3 + i * .6 / 16 - .0015, -.046, .003, .046); x.fillRect(-.3, -.06, .6, .014); } }), { y: -.075 });
  it.galleryL = railL;
  const domeL = S.layer({ z: -.07, trans: .1 });
  S.add(domeL, piece({ w: .6, h: .2, ppm: 2400, color: '#0e1422', finish: F0, draw: x => { x.beginPath(); x.moveTo(-.3, 0); x.quadraticCurveTo(0, .12, .3, 0); x.lineTo(.3, .1); x.lineTo(-.3, .1); x.closePath(); x.fill(); } }), { y: .1 });
  const update = t => { it.fog.x = .01 * Math.sin(t * .2); };
  return { S, it, update };
}

// ———————————————————————— the boat, in the fog ————————————————————————
export function boatScene() {
  const P = PAL.fog, S = new Scene({ light: { x: .0, y: .04, z: -.15, r: .22, col: P.light, lit: .8, floor: .45 }, cam: { z: .22, focus: .3, aper: 2, maxCoc: 14 }, amb: .02 });
  const it = {};
  const sky = S.layer({ z: -.142, trans: .95, floor: .6, shadow: false });
  S.add(sky, piece({ w: .9, h: .5, ppm: 1600, color: P.sky, finish: false, draw: x => x.fillRect(-.45, -.25, .9, .5) }));
  const seaL = S.layer({ z: -.132, trans: .85 });
  it.sea = S.add(seaL, piece({ w: .9, h: .2, ppm: 2400, color: P.sea, finish: F0, draw: x => Wd.sea(x, { x0: -.45, x1: .45, top: .05, depth: .2, r: .01, seed: 3, rows: 2 }) }), { y: -.1 });
  // the chain of lights on the shore, far (gated in the second boat shot)
  it.chain = S.add(S.layer({ z: -.128, trans: .8, shadow: false }), piece({ w: .3, h: .16, ppm: 4000, color: '#000', finish: false, draw: () => {}, glow: g => { g.fillStyle = '#ffb862'; for (let i = 0; i < 14; i++) { const u = i / 13; g.beginPath(); g.arc(-.12 + u * .24, -.06 + u * .11 + .006 * Math.sin(i * 1.7), .0028 + .0006 * (i % 3), 0, TAU); g.fill(); } } }), { x: .14, y: .02, gate: 0 });
  it.fog = [];
  for (const [z, seed, a, y] of [[-.125, 51, .55, .0], [-.11, 52, .5, -.03], [-.1, 53, .45, .03]]) { const L = S.layer({ z, trans: .92, floor: .6, alpha: a, fog: true, shadow: false, recv: false }); it.fog.push({ L, it: S.add(L, piece({ w: 1.2, h: .3, ppm: 1500, color: P.fog, finish: false, draw: x => Wd.fogSheet(x, { w: 1.2, h: .3, seed, top: .7 }) }), { y }), a, y }); }
  // the boat: the wheelhouse back wall (dark), the father, the wheel, the front wall with the window, the cabin lamp
  it.boatLayers = [];
  const backL = S.layer({ z: -.095, trans: .35 }); it.boatLayers.push(backL);
  S.add(backL, piece({ w: .3, h: .2, ppm: 3000, color: '#1e2838', finish: F0, draw: x => { x.fillRect(-.15, -.1, .3, .12); cut(x, () => { x.beginPath(); x.rect(-.1, -.06, .2, .06); x.fill(); }); x.fillRect(-.002, -.06, .004, .06); } }), { y: -.01 });
  it.figL = S.layer({ z: -.086, trans: .12 }); it.boatLayers.push(it.figL);
  it.father = figure(S, it.figL, { kind: 'father', ppm: 14000, facing: 1 });
  const wheelL = S.layer({ z: -.08, trans: .1 }); it.boatLayers.push(wheelL);
  it.wheel = S.add(wheelL, piece({ w: .07, h: .07, ppm: 8000, color: '#201810', finish: { px: 2, rim: .4 }, draw: x => { x.beginPath(); x.arc(0, 0, .021, 0, TAU); x.fill(); cut(x, () => { x.beginPath(); x.arc(0, 0, .017, 0, TAU); x.fill(); }); for (let i = 0; i < 8; i++) { x.save(); x.rotate(i * Math.PI / 4); x.fillRect(-.0013, 0, .0026, .026); x.restore(); } x.beginPath(); x.arc(0, 0, .004, 0, TAU); x.fill(); } }), { x: .0, y: -.068, rot: 0 });
  const frontW = S.layer({ z: -.07, trans: .06 }); it.boatLayers.push(frontW);
  S.add(frontW, piece({ w: .5, h: .3, ppm: 2400, color: '#0c1220', finish: F0, draw: x => { x.fillRect(-.25, -.15, .5, .3); cut(x, () => { x.beginPath(); x.roundRect(-.12, -.07, .24, .13, .006); x.fill(); }); x.fillRect(-.001, -.07, .002, .13); cut(x, () => { x.lineWidth = .0008; for (let i = 0; i < 6; i++) { x.beginPath(); x.moveTo(-.24, -.1 - i * .008); x.lineTo(.24, -.1 - i * .008); x.stroke(); } }); } }), { y: -.01 });
  it.lamp = S.add(frontW, piece({ w: .03, h: .04, ppm: 8000, color: '#0c1220', finish: { px: 2 }, draw: x => { x.fillRect(-.001, 0, .002, .012); x.beginPath(); x.moveTo(-.008, 0); x.lineTo(.008, 0); x.lineTo(.006, -.012); x.lineTo(-.006, -.012); x.closePath(); x.fill(); cut(x, () => { x.beginPath(); x.ellipse(0, -.006, .004, .005, 0, 0, TAU); x.fill(); }); }, glow: g => { g.fillStyle = '#ffc070'; g.beginPath(); g.ellipse(0, -.006, .004, .005, 0, 0, TAU); g.fill(); } }), { x: -.1, y: .05, gate: 1 });
  const frontL = S.layer({ z: -.03, trans: .04 });
  S.add(frontL, piece({ w: .8, h: .12, ppm: 2000, color: '#06080e', finish: F0, draw: x => x.fillRect(-.4, -.06, .8, .12) }), { y: -.14 });
  const update = t => { const sw = .004 * Math.sin(t * 1.25), rl = .035 * Math.sin(t * .95 + 1); S.boatSway = [sw, rl]; it.sea.x = .004 * Math.sin(t * .5); for (const f of it.fog) f.it.x = .012 * Math.sin(t * .2 + f.y * 30); };
  return { S, it, update };
}

// ———————————————————————— the feast under the moon, and the keepsake ————————————————————————
export function feast() {
  const P = PAL.night, S = new Scene({ light: { x: .02, y: .06, z: -.15, r: .22, col: P.light, lit: 1, floor: .42 }, cam: { z: .26, focus: .34, aper: 2, maxCoc: 14 }, amb: .02 });
  const it = {};
  const sky = S.layer({ z: -.142, trans: .95, floor: .62, shadow: false });
  S.add(sky, piece({ w: .7, h: .4, ppm: 2000, color: P.sky, finish: false, draw: x => { x.fillRect(-.35, -.2, .7, .4); Wd.moonHole(x, .05, .1, .026); it._stars = Wd.stars(x, { w: .7, h: .4, n: 90, seed: 13, minY: -.02 }); }, glow: g => { Wd.moonGlow(g, .05, .1, .026); it._stars(g); } }), { gate: 1 });
  const seaL = S.layer({ z: -.128, trans: .85 });
  it.sea = S.add(seaL, piece({ w: .7, h: .2, ppm: 2600, color: P.sea, finish: F0, draw: x => Wd.sea(x, { x0: -.35, x1: .35, top: .08, depth: .2, r: .006, seed: 4, rows: 3 }) }), { y: -.08 });
  const headL = S.layer({ z: -.116, trans: .6 });
  let LH; S.add(headL, piece({ w: .5, h: .25, ppm: 3000, color: P.head, finish: F0, draw: x => { Wd.rocks(x, { x0: -.25, x1: .25, base: -.06, h: .07, prof: u => .07 * ss((u + .2) / .3), seed: 5 }); LH = Wd.lighthouse(x, { cx: .12, base: .01, h: .06 }); }, glow: g => { g.fillStyle = '#ffb862'; for (let i = 0; i < 7; i++) { g.beginPath(); g.arc(.12 - .02 + i * .0066, .056, .0014, 0, TAU); g.fill(); } } }), { x: .2, y: -.02, gate: 1 });
  const villL = S.layer({ z: -.104, trans: .45 });
  it.vHoles = []; it.vEaves = [];
  S.add(villL, piece({ w: .7, h: .2, ppm: 3000, color: P.vill, finish: F0, draw: x => { x.fillRect(-.35, -.1, .7, .06); for (const [hx, w, h, sd] of [[-.26, .06, .036, 21], [-.17, .064, .04, 22], [-.08, .06, .036, 23]]) it.vHoles.push(...Wd.house(x, { cx: hx, base: -.04, w, h, win: 2, seed: sd })); it.vEaves = [Wd.eaveLantern(x, -.22, -.0, 'lotus', .008, Wd.LANTERN_COL.lotus), Wd.eaveLantern(x, -.125, -.0, 'fish', .008, Wd.LANTERN_COL.fish), Wd.eaveLantern(x, -.035, -.002, 'star', .008, Wd.LANTERN_COL.star)]; }, glow: g => { Wd.houseGlow(g, it.vHoles); it.vEaves.forEach(e => e(g)); } }), { gate: 1 });
  const shoreL = S.layer({ z: -.09, trans: .3 });
  S.add(shoreL, piece({ w: .7, h: .2, ppm: 3000, color: P.near, finish: F0, draw: x => { Wd.pier(x, { x0: -.35, x1: .35, y: -.08, h: .007, posts: 12 }); } }), { y: -.0 });
  // the family behind the table
  it.figL = S.layer({ z: -.08, trans: .12 });
  it.mother = figure(S, it.figL, { kind: 'mother', ppm: 10000, facing: 1 });
  it.father = figure(S, it.figL, { kind: 'father', ppm: 10000, facing: -1 });
  it.yue = figure(S, it.figL, { kind: 'girl', ppm: 12000, facing: 1 });
  const tableL = S.layer({ z: -.07, trans: .15 });
  S.add(tableL, piece({ w: .3, h: .1, ppm: 4000, color: P.front, finish: F0, draw: x => Wd.tableTop(x, { x0: -.14, x1: .14, y: 0, th: .007 }) }), { y: -.05 });
  it.propL = S.layer({ z: -.064, trans: .12 });
  it.cakes = [-.03, 0, .03].map(cx => S.add(it.propL, piece({ w: .02, h: .02, ppm: 12000, color: '#a07848', finish: { px: 2, rim: .45 }, draw: x => Wd.mooncake(x, 0, 0, .0065), glow: g => { g.strokeStyle = '#ffd8a0'; g.lineWidth = .0005; g.beginPath(); g.arc(0, 0, .004, 0, TAU); g.stroke(); } }), { x: cx - .02, y: -.043, gate: .5 }));
  it.rabbit = S.add(it.propL, piece({ w: .04, h: .04, ppm: 14000, color: '#c8261e', finish: { px: 2, rim: .35 }, ax: 0, ay: .017, draw: x => { x.save(); x.translate(0, .017); Wd.rabbit(x, .0048); x.restore(); }, glow: x => { x.save(); x.translate(0, .017); Wd.rabbitGlow(x, .0048); x.restore(); } }), { x: .075, y: -.05, gate: 1 });
  const frontL = S.layer({ z: -.03, trans: .04 });
  S.add(frontL, piece({ w: .4, h: .2, ppm: 3000, color: P.front, finish: F0, draw: x => Wd.rocks(x, { x0: -.2, x1: .2, base: -.1, h: .05, seed: 61, jag: 1.6 }) }), { x: -.28, y: -.1 });
  // the room: the old faded rabbit lantern beside the lamp (a room layer, lit by the spill)
  const roomL = S.layer({ z: .09, room: true, amb: .0, shadow: false, recv: false });
  it.oldRabbit = S.add(roomL, piece({ w: .14, h: .14, ppm: 3000, color: '#8a4038', finish: { px: 2.5, rim: .25, under: .3 }, ax: 0, ay: .066, draw: x => { x.save(); x.translate(0, .066); Wd.rabbit(x, .018, { earR: .4 }); x.restore(); x.fillStyle = '#3a2418'; x.fillRect(-.045, -.08, .09, .005); } }), { x: .36, y: -.167, vis: false });
  const update = t => { it.sea.x = .003 * Math.sin(t * .45); it.rabbit.gate = 1 + .06 * Math.sin(7.3 * t) * Math.sin(3.1 * t); };
  return { S, it, update };
}
