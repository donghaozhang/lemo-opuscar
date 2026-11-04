// Sets and props, painted in grey values (the Redraw pass inks them).
// The archive is one world (1440×1080, floor at y = 900) shared by the extreme wide and the desk full shot.
import { form, stroke, ellipsePts, catmull, grey, mottle, H } from './engine/ink.js';
import { red } from './mask.js';
import { clamp, lerp, hash } from './lib.js';

export const FLOOR = 900;
const circ = (cx, cy, r, n = 32) => ellipsePts(cx, cy, r, r, 0, n);
const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
const glow = (g, x, y, r, a, v = 1) => {
  if (a <= .003) return;
  const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, grey(v, a)); gr.addColorStop(1, grey(v, 0));
  g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
};

// a film can seen face-on (stored upright, face out)
export function can(g, x, y, r, v = .58, o = {}) {
  form(g, circ(x, y, r, 28), { v, line: 1.8, grad: .2, shade: r * .18 });
  form(g, circ(x, y, r * .78, 24), { v: v + .1, line: .9, grad: .1 });
  form(g, circ(x, y, r * .2, 12), { v: v - .3, line: .8 });
  if (o.label) { form(g, rect(x - r * .55, y - r * .62, r * 1.1, r * .34), { v: .93, line: .8, grad: 0 }); }
}

// ---- shelves: rows of cans; `lit` = array of 8 row brightnesses (0..1); emptyFill = the last slot (0 empty → 1 filled)
export const SHELF = { L: [20, 360], R: [1080, 1420], top: 60, rowH: 105, n: 8, perRow: 6 };
export const SLOT = { side: 'R', row: 3, i: 1 };
export function slotPos() { const [x0] = SHELF.R; return [x0 + 30 + SLOT.i * 56 + 0, FLOOR - SLOT.row * SHELF.rowH - 52]; }
function shelfBlock(g, x0, x1, side, o) {
  const lit = o.lit || [], base = o.base ?? .3;
  form(g, rect(x0, SHELF.top, x1 - x0, FLOOR - SHELF.top), { v: base - .08, line: 2.4, grad: .1 });
  for (let r = 0; r < SHELF.n; r++) {
    const yb = FLOOR - r * SHELF.rowH, L = clamp(lit[r] ?? 0);
    const v = base + .02 + L * .26;
    form(g, rect(x0 + 6, yb - SHELF.rowH + 8, x1 - x0 - 12, SHELF.rowH - 14), { v: v - .06, line: 0, grad: .2 });
    for (let i = 0; i < SHELF.perRow; i++) {
      const cx = x0 + 30 + i * 56, cy = yb - 52;
      const empty = side === SLOT.side && r === SLOT.row && i === SLOT.i;
      if (empty) {
        form(g, circ(cx, cy, 24, 24), { v: .06 + L * .1, line: 1.2, grad: 0 });
        const f = clamp(o.slotFill ?? 0);
        if (f > 0) can(g, cx, cy + (1 - f) * 0, 24, .5 + L * .4);
        continue;
      }
      can(g, cx, cy, 24, .36 + L * .3 + (hash(r * 7 + i + (side === 'R' ? 50 : 0)) - .5) * .08);
    }
    form(g, rect(x0, yb - 8, x1 - x0, 10), { v: .22 + L * .3, line: 1.6, grad: .1 });     // plank
    // the row lamp: a small shaded bulb at the block's inner end
    const lx = side === 'L' ? x1 - 18 : x0 + 18, ly = yb - SHELF.rowH + 16;
    form(g, [[lx - 14, ly], [lx + 14, ly], [lx + 8, ly - 10], [lx - 8, ly - 10]], { v: .2 + L * .2, line: 1.4 });
    form(g, circ(lx, ly + 5, 6, 12), { v: .45 + L * .55, line: 1.2, grad: 0 });
    if (L > .01) { g.save(); g.globalAlpha = L * .5; glow(g, lx, ly + 20, 120, .6); g.restore(); }
  }
}

// ---- wall clock: hours as a float (12.0 = midnight, 17.98 = 5:59)
export function clock(g, x, y, r, hours) {
  form(g, circ(x, y, r + 7, 40), { v: .24, line: 2.4, grad: .2 });
  form(g, circ(x, y, r, 40), { v: .9, line: 1.4, grad: .1 });
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; stroke(g, [[x + Math.sin(a) * r * .8, y - Math.cos(a) * r * .8], [x + Math.sin(a) * r * .93, y - Math.cos(a) * r * .93]], i % 3 ? 1.6 : 3.2, { taper: 0 }); }
  const ah = (hours % 12) / 12 * Math.PI * 2, am = (hours % 1) * Math.PI * 2;
  stroke(g, [[x, y], [x + Math.sin(ah) * r * .5, y - Math.cos(ah) * r * .5]], 5, { taper: .2 });
  stroke(g, [[x, y], [x + Math.sin(am) * r * .78, y - Math.cos(am) * r * .78]], 3, { taper: .2 });
  form(g, circ(x, y, 3.5, 10), { v: .1, line: 0 });
}

// ---- the archive world. o: dawn (0..1), lit[8], pile (0..1), done (0..1), hours, slotFill, lampOn (desk lamp 0..1),
//      viewerSpin (rad), smoke (0..1), jam (0..1), typing (key index)
export const DESK = { x0: 600, x1: 800, top: 830 };
export const TUBE_OUT = [884, 694];
export const PILE = { x: 432, y: FLOOR };
export const BASKET = { x: 1028, y: FLOOR };
export const VIEWER = { x: 640, y: 800 };
export function archive(g, o = {}) {
  const dawn = clamp(o.dawn ?? 0), wall = lerp(.38, .58, dawn);
  // back wall + mottle
  form(g, rect(-200, -200, 1840, FLOOR + 200), { v: wall, line: 0, grad: .12 });
  mottle(g, 0, 0, 1440, FLOOR, .12, 3);
  // arched window: night pane → dawn
  const wx0 = 560, wx1 = 880, wy0 = 70, wy1 = 420, pane = lerp(.5, .98, dawn);
  const arch = [];
  for (let i = 0; i <= 20; i++) { const a = Math.PI + i / 20 * Math.PI; arch.push([720 + Math.cos(a) * 160, wy0 + 160 + Math.sin(a) * 160]); }
  const win = [[wx0, wy1], ...arch, [wx1, wy1]];
  form(g, win.map(([x, y]) => [x + (x - 720) * .07, y + (y < wy1 ? -8 : 10)]), { v: wall - .12, line: 2.4 });
  form(g, win, { v: pane, line: 2, grad: .2 });
  if (dawn < .5) { g.save(); g.globalAlpha = 1 - dawn * 2; form(g, circ(790, 170, 26, 24), { v: .95, line: 1, grad: 0 }); g.restore(); }
  for (const x of [640, 720, 800]) form(g, rect(x - 4, wy0 + 10, 8, wy1 - wy0 - 10), { v: .16, line: 1 });
  for (const y of [190, 300]) form(g, rect(wx0, y - 4, wx1 - wx0, 8), { v: .16, line: 1 });
  form(g, rect(wx0 - 20, wy1, wx1 - wx0 + 40, 16), { v: .4, line: 2 });
  // dawn beam across the room
  if (dawn > .01) {
    g.save(); g.globalAlpha = dawn * .32; g.fillStyle = grey(1);
    g.beginPath(); g.moveTo(wx0, wy1); g.lineTo(wx1, wy1); g.lineTo(1120, FLOOR + 60); g.lineTo(700, FLOOR + 60); g.closePath(); g.fill(); g.restore();
  }
  // shelves
  shelfBlock(g, SHELF.L[0], SHELF.L[1], 'L', { lit: o.lit, base: wall - .04, slotFill: o.slotFill });
  shelfBlock(g, SHELF.R[0], SHELF.R[1], 'R', { lit: o.lit, base: wall - .04, slotFill: o.slotFill });
  // floor
  form(g, rect(-200, FLOOR, 1840, 400), { v: lerp(.34, .55, dawn), line: 2, grad: .1 });
  for (let i = -6; i < 16; i++) stroke(g, [[720 + i * 110 * .7, FLOOR + 4], [720 + i * 160, 1080]], 1.2, { taper: 0, alpha: .5 });
  // clock
  clock(g, 720, 474, 38, o.hours ?? 12);
  // desk lamp: cord, shade, pool of light on the bench and floor
  const lamp = o.lampOn ?? 1;
  stroke(g, [[700, -10], [700, 556]], 1.6, { taper: 0 });
  form(g, [[668, 590], [732, 590], [714, 556], [686, 556]], { v: .2, line: 2 });
  form(g, ellipsePts(700, 592, 32, 6, 0, 20), { v: .5 + lamp * .48, line: 1.2, grad: 0 });
  g.save(); g.globalAlpha = .55 * lamp; glow(g, 700, 800, 330, .9); g.restore();
  // a wall sconce behind the proof stand: Lao Jiao reads as a dark silhouette against its light
  form(g, rect(1000, 560, 16, 30), { v: .3, line: 1.4 }); form(g, circ(1008, 556, 9, 14), { v: .98, line: 1, grad: 0 });
  g.save(); g.globalAlpha = .7 * lamp; glow(g, 1000, 600, 260, .95); g.restore();
  // pneumatic tube (desk → proof stand), brass
  const tube = catmull([[760, 800], [764, 660], [790, 600], [850, 600], [884, 640], [884, 690]], false, 8);
  tubeShape(g, tube, 14, .62);
  form(g, ellipsePts(884, 692, 11, 4, 0, 16), { v: .1, line: 1.4 });
  // proof stand (lectern)
  form(g, [[850, 712], [930, 700], [934, 712], [854, 724]], { v: .5, line: 2, grad: .15 });
  form(g, rect(886, 716, 12, FLOOR - 716), { v: .3, line: 1.6 });
  form(g, rect(866, FLOOR - 10, 52, 10), { v: .25, line: 1.6 });
  // done basket
  basket(g, BASKET.x, BASKET.y, o.done ?? 0);
  // bench
  form(g, rect(DESK.x0, DESK.top, DESK.x1 - DESK.x0, 18), { v: .52, line: 2.2, grad: .2, shade: 4 });
  for (const x of [DESK.x0 + 10, DESK.x1 - 24]) form(g, rect(x, DESK.top + 18, 14, FLOOR - DESK.top - 18), { v: .38, line: 1.6 });
  viewer(g, VIEWER.x, VIEWER.y, o);
  typewriter(g, 728, 830, o.typing ?? 0, o.paper ?? 0);
  // the mountain of cans to translate
  pile(g, PILE.x, PILE.y, o.pile ?? 1);
}
function tubeShape(g, pts, w, v) {
  const L = [], R = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    L.push([pts[i][0] - ty * w / 2, pts[i][1] + tx * w / 2]); R.push([pts[i][0] + ty * w / 2, pts[i][1] - tx * w / 2]);
  }
  form(g, L.concat(R.reverse()), { v, line: 2, grad: .25 });
}
// pile: a pyramid of cans, emptied from the top (fullness 0..1)
export const PILE_ROWS = [6, 5, 4, 3, 2, 1];
export function pile(g, x, y, full) {
  const total = 21, n = Math.round(clamp(full) * total); let k = 0;
  for (let r = 0; r < PILE_ROWS.length; r++) for (let i = 0; i < PILE_ROWS[r]; i++) {
    if (k++ >= n) return;
    const cx = x + (i - (PILE_ROWS[r] - 1) / 2) * 42 + (hash(r * 9 + i) - .5) * 4, cy = y - 22 - r * 36;
    can(g, cx, cy, 21, .5 + hash(r * 3 + i * 5) * .14);
  }
}
export function pileTop(full) {              // where the next can is taken from
  const n = Math.max(0, Math.round(clamp(full) * 21) - 1); let k = 0;
  for (let r = 0; r < PILE_ROWS.length; r++) for (let i = 0; i < PILE_ROWS[r]; i++) { if (k++ === n) return [PILE.x + (i - (PILE_ROWS[r] - 1) / 2) * 42, PILE.y - 22 - r * 36]; }
  return [PILE.x, PILE.y - 22];
}
function basket(g, x, y, done) {
  // pages stacked inside, rising with `done`
  const h = 8 + done * 40;
  for (let i = 0; i < 6; i++) form(g, rect(x - 34 + (hash(i) - .5) * 6, y - 20 - h + i * 2, 68, 8), { v: .93, line: .8, grad: 0 });
  form(g, [[x - 44, y - 50], [x + 44, y - 50], [x + 36, y], [x - 36, y]], { v: .42, line: 2.2, grad: .2 });
  for (let i = -3; i <= 3; i++) stroke(g, [[x + i * 12, y - 48], [x + i * 10, y - 2]], 1.1, { taper: 0 });
}
function viewer(g, x, y, o) {
  // a reel viewer: box with a lens, two spools on top (feed + take-up), the film running between
  form(g, rect(x - 40, y - 4, 80, 34), { v: .3, line: 2.2, grad: .2, shade: 4 });
  form(g, circ(x + 32, y + 12, 9, 16), { v: .8 + (o.viewerLight ?? 0) * .2, line: 1.6 });
  const sp = o.viewerSpin ?? 0, jam = o.jam ?? 0;
  for (const [sx, k] of [[x - 22, 1], [x + 22, -1]]) {
    form(g, circ(sx, y - 26, 20, 26), { v: .55, line: 1.8, grad: .2 });
    for (let i = 0; i < 3; i++) { const a = sp * k + i * Math.PI * 2 / 3; form(g, circ(sx + Math.cos(a) * 11, y - 26 + Math.sin(a) * 11, 4, 10), { v: .2, line: 0 }); }
    form(g, circ(sx, y - 26, 3, 8), { v: .15, line: 0 });
  }
  stroke(g, [[x - 22, y - 6], [x - 10, y - 2], [x + 10, y - 2], [x + 22, y - 6]], 2.2 + jam * 2, { taper: 0 });
  if (jam > .01) {                                              // a buckled loop of film where it jams
    stroke(g, catmull([[x - 6, y - 3], [x - 2, y - 3 - jam * 22], [x + 8, y - 3 - jam * 18], [x + 6, y - 3]], false, 6), 2.4, { taper: 0 });
  }
}
function typewriter(g, x, y, key, paper) {
  form(g, [[x - 40, y], [x + 40, y], [x + 32, y - 26], [x - 32, y - 26]], { v: .2, line: 2, grad: .2, shade: 4 });
  for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) {
    const down = (Math.floor(key) % 12) === r * 6 + i && key > 0;
    form(g, circ(x - 25 + i * 10 + r * 4, y - 6 - r * 8 + (down ? 2 : 0), 3.4, 10), { v: down ? .6 : .85, line: .8 });
  }
  form(g, rect(x - 36, y - 38, 72, 12), { v: .35, line: 1.6, grad: .2 });     // platen
  const ph = 10 + clamp(paper) * 22;
  form(g, rect(x - 18, y - 38 - ph, 36, ph), { v: .94, line: 1, grad: 0 });
  for (let i = 0; i < Math.floor(clamp(paper) * 4); i++) stroke(g, [[x - 13, y - 44 - i * 5], [x + 6 + hash(i) * 6, y - 44 - i * 5]], 1, { taper: 0, alpha: .7 });
}
// a single page in flight / on the lectern
export function page(g, x, y, a = 0, o = {}) {
  g.save(); g.translate(x, y); g.rotate(a); g.scale(o.s ?? 1, o.s ?? 1);
  if (o.ball) {
    form(g, catmull([[-12, -2], [-6, -12], [6, -11], [13, -3], [10, 9], [-2, 13], [-12, 7]], true, 4), { v: .9, line: 1.6, grad: .3, shade: 4 });
    stroke(g, [[-6, -4], [2, 2], [8, -2]], 1, { taper: .2 });
    if (o.mark) red(g, m => { m.fillRect(-5, -1, 9, 2.5); });
  } else {
    form(g, rect(-13, -17, 26, 34), { v: .94, line: 1.2, grad: .05 });
    for (let i = 0; i < 4; i++) stroke(g, [[-9, -11 + i * 6], [6 - (i % 2) * 4, -11 + i * 6]], .9, { taper: 0, alpha: .7 });
    if (o.tick) stroke(g, [[-5, 8], [-1, 13], [8, 2]], 2.2, { taper: .2 });
    if (o.mark) red(g, m => { m.lineWidth = 2.6; m.beginPath(); m.moveTo(-9, -12); m.lineTo(9, 10); m.moveTo(9, -12); m.lineTo(-9, 10); m.stroke(); });
  }
  g.restore();
}

// ---- smoke wisps rising from a point (deterministic by t)
export function smoke(g, x, y, amt, t, o = {}) {
  if (amt <= .01) return;
  const n = o.n ?? 7;
  for (let i = 0; i < n * 2; i++) {
    const life = ((t * (o.speed ?? .55) + i / (n * 2) + hash(i) * .07) % 1), u = life;
    const px = x + Math.sin(u * 6 + i * 2.1 + t) * 16 * u + (o.drift ?? 0) * u * 60 + (hash(i * 3) - .5) * 10, py = y - u * (o.rise ?? 150);
    const r = (10 + u * 34) * (o.s ?? 1);
    const a = amt * Math.sin(Math.min(1, u * 4) * Math.PI / 2) * (1 - u) * .55;
    const gr = g.createRadialGradient(px, py, 0, px, py, r);
    gr.addColorStop(0, grey(o.v ?? .8, a)); gr.addColorStop(.6, grey(o.v ?? .8, a * .7)); gr.addColorStop(1, grey(o.v ?? .8, 0));
    g.fillStyle = gr; g.fillRect(px - r, py - r, 2 * r, 2 * r);
  }
}
// ---- the aisle (tracking shot): long rows of shelving seen side-on; drawn in world coords for x in [x0, x1]
export function aisleBack(g, x0, x1, o = {}) {
  form(g, rect(x0 - 10, -100, x1 - x0 + 20, FLOOR + 100), { v: .26, line: 0, grad: .1 });
  const step = 300;
  for (let b = Math.floor(x0 / step) - 1; b <= Math.ceil(x1 / step); b++) {
    const bx = b * step;
    form(g, rect(bx + 10, 80, step - 20, FLOOR - 80), { v: .22, line: 1.8, grad: .1 });
    for (let r = 0; r < 7; r++) {
      const yb = FLOOR - r * 115;
      for (let i = 0; i < 5; i++) can(g, bx + 46 + i * 52, yb - 52, 22, .34 + hash(b * 31 + r * 7 + i) * .14);
      form(g, rect(bx + 10, yb - 8, step - 20, 9), { v: .2, line: 1.2 });
    }
    // a hanging aisle lamp every other bay
    if (b % 2 === 0) { stroke(g, [[bx + step / 2, -100], [bx + step / 2, 40]], 1.2, { taper: 0 }); form(g, [[bx + step / 2 - 22, 60], [bx + step / 2 + 22, 60], [bx + step / 2 + 10, 40], [bx + step / 2 - 10, 40]], { v: .2, line: 1.6 }); }
  }
  form(g, rect(x0 - 10, FLOOR, x1 - x0 + 20, 300), { v: .36, line: 2, grad: .1 });
  for (let b = Math.floor(x0 / 90); b <= Math.ceil(x1 / 90); b++) stroke(g, [[b * 90, FLOOR + 6], [b * 90 - 40, 1080]], 1, { taper: 0, alpha: .4 });
}
// foreground uprights passing in front (drawn with their own parallax by the shot)
export function aisleFront(g, x0, x1) {
  const step = 520;
  for (let b = Math.floor(x0 / step) - 1; b <= Math.ceil(x1 / step); b++) {
    const bx = b * step + 120;
    form(g, rect(bx, -100, 70, 1400), { v: .14, line: 2.4, grad: .2, shade: 6 });
    for (let r = 0; r < 6; r++) form(g, rect(bx - 40, 120 + r * 190, 150, 14), { v: .18, line: 1.6 });
  }
}
// ---- end of the aisle: brick end wall, the fire-bucket stand, the loose film strip on the floor
export function aisleEnd(g, o = {}) {
  const dawn = clamp(o.dawn ?? 0);
  form(g, rect(-200, -200, 1840, FLOOR + 200), { v: .28 + dawn * .2, line: 0, grad: .12 });
  // shelves on the left two thirds
  for (let b = 0; b < 3; b++) {
    const bx = -60 + b * 300;
    form(g, rect(bx + 10, 80, 280, FLOOR - 80), { v: .22 + dawn * .15, line: 1.8, grad: .1 });
    for (let r = 0; r < 7; r++) {
      const yb = FLOOR - r * 115;
      for (let i = 0; i < 5; i++) can(g, bx + 46 + i * 52, yb - 52, 22, .34 + dawn * .2 + hash(b * 31 + r * 7 + i) * .14);
      form(g, rect(bx + 10, yb - 8, 280, 9), { v: .2, line: 1.2 });
    }
  }
  // brick end wall
  form(g, rect(860, -100, 700, FLOOR + 100), { v: .46 + dawn * .2, line: 2, grad: .15 });
  for (let r = 0; r < 26; r++) { const y = -60 + r * 38; stroke(g, [[860, y], [1460, y]], 1, { taper: 0, alpha: .45 }); for (let i = 0; i < 10; i++) { const x = 860 + i * 70 + (r % 2) * 35; stroke(g, [[x, y], [x, y + 38]], 1, { taper: 0, alpha: .45 }); } }
  mottle(g, 860, 0, 600, FLOOR, .14, 9);
  // the sign above the bucket
  form(g, rect(960, 380, 170, 86), { v: .9, line: 2.2, grad: .05 });
  red(g, m => { m.font = '700 54px "Noto Serif SC"'; m.textAlign = 'center'; m.textBaseline = 'middle'; m.fillText('消防', 1045, 425); });
  // a fire lamp bracket
  form(g, rect(1032, 470, 26, 40), { v: .3, line: 1.4 });
  // floor
  form(g, rect(-200, FLOOR, 1840, 300), { v: .36 + dawn * .15, line: 2, grad: .1 });
  for (let b = -2; b < 20; b++) stroke(g, [[b * 90, FLOOR + 6], [b * 90 - 40, 1080]], 1, { taper: 0, alpha: .4 });
  // the loose film strip curling on the floor (the trip)
  if (o.strip !== false) {
    const sx = o.stripX ?? 610;
    stroke(g, catmull([[sx - 90, FLOOR + 30], [sx - 30, FLOOR + 22], [sx + 10, FLOOR - 10], [sx + 40, FLOOR + 6], [sx + 110, FLOOR + 28]], false, 8), 9, { taper: .05 });
    for (let i = 0; i < 9; i++) form(g, rect(sx - 80 + i * 22, FLOOR + 22 - Math.sin(i * .6) * 8, 4, 4), { v: .85, line: 0 });
  }
}
export function bucket(g, x, y, o = {}) {
  // a cone-bottomed fire bucket with a bail handle; (x, y) = rim centre
  form(g, [[x - 52, y], [x + 52, y], [x + 40, y + 70], [x, y + 98], [x - 40, y + 70]], { v: .55, line: 2.4, grad: .25, shade: 8 });
  form(g, ellipsePts(x, y, 52, 11, 0, 30), { v: o.water ? .62 : .2, line: 2 });
  red(g, m => { m.beginPath(); m.moveTo(x - 46, y + 18); m.lineTo(x + 46, y + 18); m.lineTo(x + 38, y + 40); m.lineTo(x - 38, y + 40); m.closePath(); m.fill(); });
  stroke(g, catmull([[x - 52, y], [x - 40, y - 56], [x + 40, y - 56], [x + 52, y]], false, 8), 2.4, { taper: 0 });
}

// ---- the insert: the returned page on the desk
export function pageInsert(g, o, T) {
  form(g, rect(-50, -50, 1540, 1180), { v: .42, line: 0, grad: .2 });
  for (let i = 0; i < 30; i++) stroke(g, catmull([[-50, i * 40 + 10], [500, i * 40 + 14 + Math.sin(i) * 6], [1500, i * 40 + 8]], false, 6), 1.2, { taper: 0, alpha: .35 });
  g.save(); g.translate(720, 560); g.rotate(-.025);
  // crumple creases (it was a ball): faint lines
  form(g, rect(-470, -380, 940, 760), { v: .93, line: 2.4, grad: .08, shade: 10 });
  for (let i = 0; i < 9; i++) { const a = hash(i) * 6.28, r = 300; stroke(g, [[Math.cos(a) * 40, Math.sin(a) * 30], [Math.cos(a) * r, Math.sin(a) * r * .75]], 1.1, { taper: .4, alpha: .35 }); }
  g.fillStyle = grey(.12); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  g.font = 'italic 400 34px "Old Standard TT"'; g.fillText('Reel 417 · Title No. 12', -400, -290);
  stroke(g, [[-400, -270], [400, -270]], 1.4, { taper: 0 });
  g.font = '400 30px "Old Standard TT"'; g.fillText('ENGLISH:', -400, -180);
  g.font = '700 92px "Old Standard TT"'; g.fillText(T.en, -400, -90);
  g.font = '400 30px "Old Standard TT"'; g.fillText('CHINESE:', -400, 20);
  g.font = '700 96px "Noto Serif SC"'; g.fillText(T.bad, -400, 125);
  const w = g.measureText(T.bad).width;
  // the red strike, drawn left → right
  const sk = clamp(o.strike ?? 0);
  if (sk > 0) red(g, m => { m.lineWidth = 11; m.lineCap = 'round'; m.beginPath(); m.moveTo(-410, 96); m.lineTo(-410 + (w + 20) * sk, 96 - 14 * sk); m.stroke(); m.beginPath(); m.moveTo(-410, 112); m.lineTo(-410 + (w + 20) * sk, 112 - 8 * sk); m.stroke(); }, .3);
  // the correction, written in red, revealed left → right
  const fx = clamp(o.fix ?? 0);
  if (fx > 0) {
    red(g, m => {
      m.save(); m.beginPath(); m.rect(-420, 160, 860 * fx + 1, 200); m.clip();
      m.transform(1, 0, -.12, 1, 0, 0); m.font = '700 100px "Noto Serif SC"'; m.textAlign = 'left'; m.textBaseline = 'alphabetic'; m.fillText(T.fix, -370, 300);
      m.restore();
    }, .3);
  }
  g.restore();
}
