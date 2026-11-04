// The painter's studio, seen from above the desk (desk space: 1 unit = 1 px at zoom 1 in the wide shot).
// Desk 1920×1080 world: the painting (a sheet 900×600 at (560,240)), the inkstone at the left, the brush, the brush rest, the seal-paste box,
// the incense holder at the right, and the painter asleep on the far edge with the head resting on the top of the sheet.
import { mk, draw, mass, blot, TONE } from './ink.js';
import { lerp, clamp, vnoise, VERM, add2, mid, rot, curve, vn2, keys, pulse } from './util.js';

export const SHEET = { x: 560, y: 240, w: 900, h: 600 };     // the painting on the desk (desk units); painting world 3000×2000 → scale .3
export const PSCALE = SHEET.w / 3000;
export const INKSTONE = { x: 300, y: 650 };
export const INCENSE = { x: 1650, y: 330 };
export const SEALBOX = { x: 1640, y: 760 };
export const DROP_AT = [478, 712];                               // where the drop lands on the desk, left of the sheet

// Desk: the far edge and the near edge as long dry strokes; the wood grain only near the edges (most of the desk is blank paper)
export function desk(L, o = {}) {
  const am = o.am ?? 1;
  draw(L, mk([[-200, 1005, .8], [700, 1000, 1.1], [1500, 1004, 1], [2200, 998, .7]], { w: 9, tone: .7, dry: .62, wet: .2, prof: 'even', seed: 901 }), 1, am);
  draw(L, mk([[-200, 1030, .6], [900, 1026, .9], [2200, 1032, .6]], { w: 4, tone: .5, dry: .75, prof: 'tip', seed: 902 }), 1, am * .8);
  draw(L, mk([[-200, 118, .7], [600, 114, 1], [1300, 118, .9], [2200, 112, .7]], { w: 7, tone: .62, dry: .66, wet: .15, prof: 'even', seed: 903 }), 1, am);
  // shadow of the sheet's near and left edge: the sheet is a thing lying on the desk
  draw(L, mk([[SHEET.x - 2, SHEET.y + 8], [SHEET.x - 2, SHEET.y + SHEET.h + 3]], { w: 5, tone: .35, dry: .5, wet: .6, prof: 'even', seed: 904 }), 1, am);
  draw(L, mk([[SHEET.x - 3, SHEET.y + SHEET.h + 3], [SHEET.x + SHEET.w + 2, SHEET.y + SHEET.h + 4]], { w: 6, tone: .4, dry: .45, wet: .6, prof: 'even', seed: 905 }), 1, am);
  draw(L, mk([[SHEET.x + SHEET.w + 2, SHEET.y + 4], [SHEET.x + SHEET.w + 3, SHEET.y + SHEET.h + 2]], { w: 2.4, tone: .3, dry: .6, prof: 'even', seed: 906 }), 1, am * .8);
  draw(L, mk([[SHEET.x + 4, SHEET.y - 1], [SHEET.x + SHEET.w - 2, SHEET.y - 2]], { w: 2, tone: .28, dry: .6, prof: 'even', seed: 907 }), 1, am * .7);
  // paperweight (镇纸): a dark wooden bar along the near edge of the sheet
  mass(L.wet, [[SHEET.x + 120, SHEET.y + SHEET.h - 14], [SHEET.x + 560, SHEET.y + SHEET.h - 16], [SHEET.x + 562, SHEET.y + SHEET.h + 4], [SHEET.x + 118, SHEET.y + SHEET.h + 6]], .55 * am, 1.2, 31);
  draw(L, mk([[SHEET.x + 118, SHEET.y + SHEET.h - 15], [SHEET.x + 562, SHEET.y + SHEET.h - 17]], { w: 3, tone: .9, dry: .4, prof: 'even', seed: 908 }), 1, am);
}

// Inkstone (砚): an oval stone, dark rim, a pool of ink (burnt) with a paper-white reflection; x, y centre; s scale (1 = desk wide)
export function inkstone(L, x, y, s = 1, o = {}) {
  const am = o.am ?? 1, R = 78 * s;
  const ring = (rx, ry, a, w, tone, seed, dry = .45) => { const pts = []; for (let i = 0; i <= 30; i++) { const t = i / 30 * Math.PI * 2 + a; pts.push([x + Math.cos(t) * rx * (1 + .02 * vnoise(i * .7 + seed)), y + Math.sin(t) * ry]); } draw(L, mk(pts, { w, tone, dry, wet: .5, prof: 'even', seed }), 1, am); };
  // stone body: pale mass + loaded rim
  const body = []; for (let i = 0; i < 24; i++) { const t = i / 24 * Math.PI * 2; body.push([x + Math.cos(t) * R * 1.12, y + Math.sin(t) * R * .9]); }
  mass(L.wet, body, .34 * am, 2 * s, 41);
  ring(R * 1.12, R * .9, .3, 8 * s, .8, 410, .4);
  // the pool: burnt ink, with the paper-white reflection left out (emptiness is the shine)
  const pool = []; for (let i = 0; i < 28; i++) { const t = i / 28 * Math.PI * 2; pool.push([x + Math.cos(t) * R * .8 * (1 + .03 * vnoise(i * 1.3)), y + 4 * s + Math.sin(t) * R * .58]); }
  mass(L.wet, pool, (o.pool ?? .9) * am, 1.5 * s, 42);
  mass(L.dry, pool, (o.pool ?? .9) * .55 * am, 1.5 * s, 43);
  // the shine: ink removed in a slanted ellipse
  for (const c of [L.wet, L.dry]) { c.save(); c.globalCompositeOperation = 'destination-out'; c.globalAlpha = .7 * (o.shine ?? 1); c.beginPath(); c.ellipse(x - R * .3, y - R * .12, R * .22, R * .09, -.4, 0, 7); c.fill(); c.restore(); }
  // the lip (where the drop hangs): a small notch at the front right
  draw(L, mk([[x + R * .55, y + R * .5], [x + R * .75, y + R * .62], [x + R * .95, y + R * .55]], { w: 5 * s, tone: .85, dry: .35, wet: .3, prof: 'brush', seed: 411 }), 1, am);
}

// Brush (毛笔): a long handle with a dark tip; (x, y) is the tip, a the direction of the handle from the tip
export function brush(L, x, y, a, s = 1, o = {}) {
  const am = o.am ?? 1, len = 300 * s, d = [Math.cos(a), Math.sin(a)];
  const tip = [x, y], ferrule = [x + d[0] * 48 * s, y + d[1] * 48 * s], end = [x + d[0] * len, y + d[1] * len];
  draw(L, mk([ferrule, mid(ferrule, end), end], { w: 9 * s, tone: .55, dry: .6, wet: .25, prof: 'even', rough: .04, seed: 421 }), 1, am);   // bamboo handle
  draw(L, mk([ferrule, end], { w: 2.4 * s, tone: .8, dry: .55, prof: 'even', seed: 422 }), 1, am * .7);                                       // its dark edge
  const n = [-d[1], d[0]];
  mass(L.wet, [[tip[0] + n[0] * 1.5 * s, tip[1] + n[1] * 1.5 * s], [ferrule[0] + n[0] * 7 * s, ferrule[1] + n[1] * 7 * s], [ferrule[0] - n[0] * 7 * s, ferrule[1] - n[1] * 7 * s], [tip[0] - n[0] * 1.5 * s, tip[1] - n[1] * 1.5 * s]], (o.inked ?? .85) * am, .8 * s, 44);   // the tip, loaded with ink
  draw(L, mk([ferrule, tip], { w: 7 * s, tone: .92, dry: .3, wet: .4, prof: 'cone', seed: 423 }), 1, am * (o.inked ?? .85));
  draw(L, mk([[ferrule[0] + n[0] * 8 * s, ferrule[1] + n[1] * 8 * s], [ferrule[0] - n[0] * 8 * s, ferrule[1] - n[1] * 8 * s]], { w: 3 * s, tone: .9, dry: .3, prof: 'even', seed: 424 }), 1, am);   // ferrule ring
  return { tip, end };
}

// Brush rest (笔架): three small peaks
export function brushRest(L, x, y, s = 1, am = 1) {
  s *= 1.8;
  mass(L.wet, [[x - 44 * s, y + 12 * s], [x - 25 * s, y - 14 * s], [x - 10 * s, y + 2 * s], [x + 5 * s, y - 18 * s], [x + 20 * s, y + 1 * s], [x + 33 * s, y - 12 * s], [x + 50 * s, y + 12 * s]], .3 * am, 1.5 * s, 430);
  draw(L, mk([[x - 40 * s, y + 10 * s], [x - 25 * s, y - 14 * s], [x - 10 * s, y + 4 * s], [x + 5 * s, y - 18 * s], [x + 20 * s, y + 3 * s], [x + 33 * s, y - 12 * s], [x + 46 * s, y + 10 * s]], { w: 6 * s, tone: .82, dry: .45, wet: .3, prof: 'even', seed: 431 }), 1, am);
  draw(L, mk([[x - 46 * s, y + 13 * s], [x + 52 * s, y + 13 * s]], { w: 5 * s, tone: .75, dry: .5, prof: 'even', seed: 432 }), 1, am);
}

// Seal-paste box (印泥盒): a round lacquer box; the lid is ajar so a sliver of vermilion paste shows (the one red in the studio, rhyming with the eye)
export function sealBox(L, cc, x, y, s = 1, am = 1) {
  const ring = []; for (let i = 0; i < 26; i++) { const t = i / 26 * Math.PI * 2; ring.push([x + Math.cos(t) * 42 * s, y + Math.sin(t) * 34 * s]); }
  mass(L.wet, ring, .6 * am, 1.2 * s, 51);
  const pts = []; for (let i = 0; i <= 30; i++) { const t = i / 30 * Math.PI * 2 + .4; pts.push([x + Math.cos(t) * 43 * s, y + Math.sin(t) * 35 * s]); }
  draw(L, mk(pts, { w: 5 * s, tone: .85, dry: .4, wet: .3, prof: 'even', seed: 511 }), 1, am);
  const lid = []; for (let i = 0; i < 26; i++) { const t = i / 26 * Math.PI * 2; lid.push([x + 14 * s + Math.cos(t) * 40 * s, y - 10 * s + Math.sin(t) * 32 * s]); }
  mass(L.wet, lid, .5 * am, 1.2 * s, 52); mass(L.dry, lid, .25 * am, 1 * s, 53);
  draw(L, mk([[x - 22 * s, y - 30 * s], [x + 14 * s, y - 40 * s], [x + 50 * s, y - 28 * s]], { w: 3 * s, tone: .8, dry: .5, prof: 'tip', seed: 512 }), 1, am);   // lid rim highlight line
  cc.save(); cc.globalAlpha = .85 * am; cc.fillStyle = `rgb(${VERM.join(',')})`; cc.beginPath(); cc.ellipse(x - 20 * s, y + 14 * s, 14 * s, 7 * s, .5, 0, 7); cc.fill(); cc.restore();   // the paste showing under the lid
}

// Incense (香) in a small holder: the stick rises up-right in this view; `burn` 0..1 = how much has burnt (the ember sits at the burnt end), ash = ash pile
export function incense(L, cc, x, y, s = 1, o = {}) {
  const am = o.am ?? 1, burn = clamp(o.burn ?? 0), t = o.t ?? 0;
  // holder: a small bowl of sand
  const bowl = []; for (let i = 0; i < 24; i++) { const tt = i / 24 * Math.PI * 2; bowl.push([x + Math.cos(tt) * 44 * s, y + 10 * s + Math.sin(tt) * 20 * s]); }
  mass(L.wet, bowl, .42 * am, 1.4 * s, 61);
  const rim = []; for (let i = 0; i <= 30; i++) { const tt = i / 30 * Math.PI * 2 + .2; rim.push([x + Math.cos(tt) * 46 * s, y + 10 * s + Math.sin(tt) * 21 * s]); }
  draw(L, mk(rim, { w: 5 * s, tone: .82, dry: .42, wet: .3, prof: 'even', seed: 611 }), 1, am);
  draw(L, mk([[x - 40 * s, y + 24 * s], [x, y + 30 * s], [x + 40 * s, y + 24 * s]], { w: 3 * s, tone: .6, dry: .5, prof: 'tip', seed: 612 }), 1, am);   // foot
  // the stick: from the bowl up and to the right; full length 260
  const d = [Math.cos(-1.25), Math.sin(-1.25)], L0 = 260 * s, Lb = L0 * (1 - burn);
  const base = [x - 6 * s, y + 2 * s], ember = [base[0] + d[0] * Lb, base[1] + d[1] * Lb];
  if (Lb > 6 * s) draw(L, mk([base, mid(base, ember), ember], { w: 7 * s, tone: .85, dry: .42, wet: .25, prof: 'even', rough: .05, seed: 613 }), 1, am);
  // the burning ring: a small ring of burnt ink around a paper-white ember (the only "light" in the room is left blank)
  if (burn < .995) {
    blot(L.dry, ember[0], ember[1], 6.5 * s, .95 * am, 0, 1, 7); blot(L.wet, ember[0], ember[1], 9 * s, .5 * am, 0, 1, 8);
    for (const c of [L.wet, L.dry]) { c.save(); c.globalCompositeOperation = 'destination-out'; c.globalAlpha = .97; c.beginPath(); c.ellipse(ember[0], ember[1], 3.2 * s * (1 + .15 * Math.sin(t * 9)), 3.2 * s, 0, 0, 7); c.fill(); c.restore(); }
    // ash tip beyond the ember: pale grey, a little curled
    const ashL = Math.min(14 * s, L0 * burn * .3);
    if (ashL > 1) draw(L, mk([ember, [ember[0] + d[0] * ashL * .6 + 2 * s, ember[1] + d[1] * ashL * .6], [ember[0] + d[0] * ashL + 4 * s, ember[1] + d[1] * ashL + 1 * s]], { w: 5 * s, tone: .28, dry: .7, wet: .3, prof: 'even', seed: 614 }), 1, am);
    // smoke: one thin dry line wandering up (drawn on ones)
    const sm = []; const n = 22;
    for (let i = 0; i <= n; i++) { const u = i / n, h = u * 420 * s; sm.push([ember[0] + d[0] * 8 * s + Math.sin(u * 7 - t * 1.3) * 18 * u * s + (vnoise(u * 4 + t * .35) - .5) * 40 * u * u * s, ember[1] - h, .9 - u * .8]); }
    draw(L, mk(sm, { w: 3.6 * s, tone: .6, dry: .68, wet: .15, prof: 'tip', rough: .2, seed: 615 }), 1, am * (o.smoke ?? 1));
  }
  // ash pile on the desk below the stick, grows with burn
  const ap = clamp(burn * 1.2);
  for (let i = 0; i < 9; i++) { const u = i / 9; if (u > ap) break; blot(L.wet, x + 40 * s + i * 7 * s + (vnoise(i * 3.3) - .5) * 14 * s, y + 34 * s + (vnoise(i * 1.7 + 2) - .5) * 10 * s, (2.5 + 2 * vnoise(i)) * s, .28, 0, .5, 620 + i); }
  return { ember, base };
}

// The painter asleep: seen from above, head on the far edge of the sheet, resting on the folded arm; the body beyond the far edge of the desk (a robe mass)
// o: {breath (0..1 breathing phase), lift (0..1 head lifted), am}
export function painter(L, x, y, s = 1, o = {}) {
  // (x, y) = centre of the head, which rests on the crossed forearms along the far edge of the sheet. Seen from the front and above:
  // the back and shoulders rise beyond the desk edge, two big sleeves fall from the shoulders to the elbows on the desk, the forearms cross under the head.
  const am = o.am ?? 1, br = (o.breath ?? 0) * 5 * s, lift = clamp(o.lift ?? 0);
  const hy = y - 90 * s * lift;                                                     // the head rises as the painter wakes
  // back: pale mass, breathing
  mass(L.wet, [[x - 150 * s, y - 20 * s], [x - 140 * s, y - 150 * s - br], [x - 60 * s, y - 205 * s - br], [x + 60 * s, y - 205 * s - br], [x + 150 * s, y - 150 * s - br], [x + 160 * s, y - 20 * s]], .17 * am, 3 * s, 71, [x, y - 205 * s, x, y, 1.2, .4]);
  draw(L, mk([[x - 10 * s, y - 198 * s - br], [x - 4 * s, y - 110 * s - br * .5], [x, y - 60 * s]], { w: 3 * s, tone: .5, dry: .7, prof: 'tip', seed: 719 }), 1, am * .7);   // back seam
  // collar: the crossed collar at the nape (seen from behind the head)
  draw(L, mk([[x - 40 * s, hy - 60 * s], [x, hy - 76 * s - br * .3], [x + 40 * s, hy - 60 * s]], { w: 5 * s, tone: .8, dry: .45, wet: .2, prof: 'tip', seed: 723 }), 1, am);
  // sleeves: from the shoulders down to the elbows on the desk (big loaded strokes, dark edges outward)
  const sleeve = (sg, sd) => {
    const sh = [x + sg * 120 * s, y - 165 * s - br], el = [x + sg * 215 * s, y + 55 * s], inn = [x + sg * 95 * s, y + 20 * s];
    mass(L.wet, [[sh[0] - sg * 25 * s, sh[1] + 10 * s], [sh[0] + sg * 40 * s, sh[1]], [el[0] + sg * 30 * s, el[1] - 30 * s], [el[0] + sg * 10 * s, el[1] + 30 * s], [inn[0], inn[1] + 30 * s], [inn[0] - sg * 10 * s, inn[1] - 40 * s]], .15 * am, 3 * s, sd);
    draw(L, mk([[sh[0] + sg * 30 * s, sh[1] - 4 * s], [lerp(sh[0], el[0], .5) + sg * 36 * s, lerp(sh[1], el[1], .5)], [el[0] + sg * 28 * s, el[1] - 10 * s]], { w: 24 * s, tone: .64, darkDir: [sg, 0], side: .85, brWet: true, body: .22, dry: .42, wet: .9, prof: 'robe', seed: sd + 1 }), 1, am);
    draw(L, mk([[sh[0] - sg * 20 * s, sh[1] + 16 * s], [lerp(sh[0], inn[0], .5) - sg * 4 * s, lerp(sh[1], inn[1], .5)], [inn[0] - sg * 6 * s, inn[1] - 30 * s]], { w: 10 * s, tone: .45, darkDir: [-sg, 0], side: .8, brWet: true, body: .15, dry: .5, wet: .8, prof: 'robe', seed: sd + 2 }), 1, am);
    // the cuff at the elbow and the forearm lying on the desk toward the head
    draw(L, mk([[el[0] + sg * 30 * s, el[1] - 34 * s], [el[0] + sg * 36 * s, el[1]], [el[0] + sg * 24 * s, el[1] + 34 * s]], { w: 5 * s, tone: .78, dry: .45, prof: 'tip', seed: sd + 3 }), 1, am);
    const fa0 = [el[0] + sg * 10 * s, el[1] + 20 * s], fa1 = [x - sg * 70 * s, hy + 52 * s - 10 * s * lift];
    mass(L.wet, [[fa0[0], fa0[1] - 26 * s], [fa1[0], fa1[1] - 24 * s], [fa1[0], fa1[1] + 22 * s], [fa0[0], fa0[1] + 26 * s]], .14 * am, 2.5 * s, sd + 4);
    draw(L, mk([[fa0[0], fa0[1] + 26 * s], [lerp(fa0[0], fa1[0], .5), lerp(fa0[1], fa1[1], .5) + 30 * s], [fa1[0], fa1[1] + 22 * s]], { w: 14 * s, tone: .6, darkDir: [0, 1], side: .85, brWet: true, body: .2, dry: .42, wet: .9, prof: 'robe', seed: sd + 5 }), 1, am);
    for (let i = 0; i < 3; i++) draw(L, mk([[fa1[0], fa1[1] - 12 * s + i * 11 * s], [fa1[0] - sg * 34 * s, fa1[1] - 8 * s + i * 12 * s]], { w: 4 * s, tone: .72, dry: .4, wet: .2, prof: 'nail', seed: sd + 6 + i }), 1, am);   // fingers
  };
  sleeve(-1, 720); sleeve(1, 730);
  // the head, face down on the forearms: we see the crown: hair mass, the bun, a hairpin; as it lifts, the face turns up: brow and closed eyes appear
  const R0 = 64 * s;
  const head = []; for (let i = 0; i < 24; i++) { const t = i / 24 * Math.PI * 2; head.push([x + Math.cos(t) * R0, hy + Math.sin(t) * R0 * .92]); }
  mass(L.wet, head, .1 * am, 2 * s, 73);
  const hair = []; for (let i = 0; i < 24; i++) { const t = i / 24 * Math.PI * 2; hair.push([x + Math.cos(t) * R0 * .92, hy - 14 * s * lift + Math.sin(t) * R0 * (.88 - .45 * lift)]); }
  mass(L.wet, hair, .82 * am, 2.4 * s, 74);
  draw(L, mk([[x + 52 * s, hy + 30 * s - 30 * s * lift], [x + 60 * s, hy - 20 * s], [x, hy - 58 * s], [x - 60 * s, hy - 20 * s], [x - 52 * s, hy + 30 * s - 30 * s * lift]], { w: 12 * s, tone: .92, darkDir: [0, -1], side: .85, brWet: true, body: .3, dry: .4, wet: .9, prof: 'robe', seed: 716, gapLen: 200 }), 1, am);   // hair contour
  const bun = []; for (let i = 0; i < 16; i++) { const t = i / 16 * Math.PI * 2; bun.push([x + Math.cos(t) * 20 * s, hy - 48 * s + 14 * s * lift + Math.sin(t) * 17 * s]); }
  mass(L.wet, bun, .95 * am, 1.2 * s, 75);
  draw(L, mk([[x - 36 * s, hy - 54 * s + 14 * s * lift], [x + 36 * s, hy - 50 * s + 14 * s * lift]], { w: 3.4 * s, tone: .9, dry: .4, prof: 'tip', seed: 717 }), 1, am);   // hairpin
  if (lift > .3) {   // the face turned up: brows and two closed eyes (the painter wakes with eyes still shut, then they open as two dots)
    const k = clamp((lift - .3) / .5), fy = hy + 22 * s;
    for (const sg of [-1, 1]) { draw(L, mk([[x + sg * 34 * s, fy - 8 * s], [x + sg * 22 * s, fy - 12 * s], [x + sg * 10 * s, fy - 8 * s]], { w: 2.8 * s, tone: .8 * k, dry: .45, prof: 'tip', seed: 760 + sg }), 1, am); draw(L, mk([[x + sg * 32 * s, fy + 6 * s], [x + sg * 22 * s, fy + 10 * s * (1 - (o.eyes ?? 0)) ], [x + sg * 12 * s, fy + 6 * s]], { w: 2.4 * s, tone: .85 * k, dry: .4, prof: 'tip', seed: 764 + sg }), 1, am); }
    draw(L, mk([[x, fy + 14 * s], [x + 3 * s, fy + 26 * s]], { w: 2.4 * s, tone: .7 * k, dry: .5, prof: 'tip', seed: 768 }), 1, am);   // nose
  }
  return { head: [x, hy], nose: [x, hy + 40 * s] };
}

// The painter's hand entering the frame (for the inserts): a sleeve from the top, the hand with a finger extended or holding the brush
// x, y = fingertip (or brush tip grip); a = direction the arm comes from (radians); hold = 'finger' | 'brush'
export function hand(L, x, y, a, s = 1, o = {}) {
  const am = o.am ?? 1, d = [Math.cos(a), Math.sin(a)], n = [-d[1], d[0]];
  const P = (u, v) => [x + d[0] * u * s + n[0] * v * s, y + d[1] * u * s + n[1] * v * s];
  const sleeve = (u0) => {   // a wide pale sleeve with one dark outer edge and a cuff line
    mass(L.wet, [P(u0, -42), P(u0 + 190, -54), P(u0 + 190, 52), P(u0 + 2, 40)], .13 * am, 2.5 * s, 82);
    draw(L, mk([P(u0 + 6, -44), P(u0 + 90, -50), P(u0 + 190, -55)], { w: 16 * s, tone: .5, darkDir: [n[0], n[1]], side: .85, brWet: true, body: .2, dry: .45, wet: .9, prof: 'robe', seed: 817 }), 1, am);
    draw(L, mk([P(u0 + 2, -42), P(u0 + 6, 0), P(u0, 40)], { w: 6 * s, tone: .78, dry: .45, wet: .2, prof: 'tip', seed: 818 }), 1, am);
  };
  if (o.hold === 'brush') {
    // the fingers closed around the handle 60 units up the brush: a pale fist with a dark outer contour, the thumb across
    mass(L.wet, [P(56, -20), P(80, -28), P(118, -26), P(124, 20), P(84, 30), P(58, 16)], .2 * am, 1.5 * s, 81);
    draw(L, mk([P(58, -18), P(84, -30), P(120, -27)], { w: 6 * s, tone: .8, dry: .42, wet: .2, prof: 'nail', seed: 811 }), 1, am);
    for (let i = 0; i < 3; i++) draw(L, mk([P(68 + i * 16, 22 - i * 3), P(60 + i * 14, 8 - i * 2), P(70 + i * 14, -4 - i)], { w: 5 * s, tone: .82, dry: .42, prof: 'nail', seed: 812 + i }), 1, am);
    draw(L, mk([P(84, -26), P(66, -12), P(72, 2)], { w: 5 * s, tone: .84, dry: .4, prof: 'nail', seed: 816 }), 1, am);
    sleeve(122);
    return P(70, 0);
  }
  // a pointing finger: the index finger reaches the fingertip at (x, y); the others curl under; a pale palm with one dark outer contour
  mass(L.wet, [P(0, -6), P(14, -16), P(42, -26), P(84, -26), P(86, 22), P(42, 30), P(12, 16)], .18 * am, 1.5 * s, 83);
  draw(L, mk([P(14, -16), P(46, -28), P(84, -27)], { w: 6 * s, tone: .8, dry: .42, wet: .2, prof: 'nail', seed: 822 }), 1, am);
  draw(L, mk([P(-2, 0), P(16, -4), P(34, -9)], { w: 7 * s, tone: .86, dry: .4, wet: .2, prof: 'rise', seed: 821 }), 1, am);
  for (let i = 0; i < 3; i++) draw(L, mk([P(28 + i * 15, 14 + i * 4), P(22 + i * 13, 28 + i * 3)], { w: 5 * s, tone: .8, dry: .45, prof: 'nail', seed: 823 + i }), 1, am);
  draw(L, mk([P(44, -22), P(28, -10)], { w: 5 * s, tone: .82, dry: .42, prof: 'nail', seed: 826 }), 1, am);
  sleeve(86);
  return [x, y];
}

// The painter in side view (for the two-shot with the dragon and the waking): seated at the desk, slumped forward, the head resting cheek-down on the
// crossed forearms, facing the camera-left end of the desk. (x, y) = where the cheek meets the arms (the face's chin point); s scale; o: {breath, lift (0..1 sits up), eyes (0..1 open)}
export function painterSide(L, x, y, s = 1, o = {}) {
  const am = o.am ?? 1, br = (o.breath ?? 0) * 4 * s, lift = clamp(o.lift ?? 0), eyes = clamp(o.eyes ?? 0);
  // the forearms crossed on the desk: a long pale mass with one loaded stroke, cuffs at both ends
  mass(L.wet, [[x - 90 * s, y - 34 * s], [x + 300 * s, y - 40 * s], [x + 310 * s, y + 10 * s], [x - 100 * s, y + 10 * s]], .16 * am, 3 * s, 91);
  draw(L, mk([[x - 96 * s, y + 8 * s], [x + 100 * s, y + 12 * s], [x + 310 * s, y + 6 * s]], { w: 16 * s, tone: .62, darkDir: [0, 1], side: .85, brWet: true, body: .22, dry: .42, wet: .9, prof: 'robe', seed: 911, gapLen: 500 }), 1, am);
  draw(L, mk([[x - 96 * s, y - 34 * s], [x - 102 * s, y - 12 * s], [x - 94 * s, y + 10 * s]], { w: 6 * s, tone: .78, dry: .45, prof: 'tip', seed: 912 }), 1, am);   // the near cuff
  for (let i = 0; i < 3; i++) draw(L, mk([[x - 100 * s, y - 24 * s + i * 11 * s], [x - 134 * s, y - 20 * s + i * 12 * s]], { w: 4.2 * s, tone: .72, dry: .4, wet: .2, prof: 'nail', seed: 913 + i }), 1, am);   // the fingers, over the desk's edge
  // the head: rises and turns up as the painter wakes (lift). Asleep: the cheek on the arms, the face toward the left; the bun on top, the back of the head to the right
  const hx = x + 70 * s + 40 * s * lift, hy = y - 54 * s - 120 * s * lift, R0 = 58 * s, tilt = -.55 * (1 - lift);
  const T = p => rot([hx + p[0] * s, hy + p[1] * s], [hx, hy], tilt);
  const face = []; for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; face.push(T([Math.cos(a) * 54 * (1 + .06 * Math.cos(a * 2)), Math.sin(a) * 60])); }
  mass(L.wet, face, .1 * am, 2 * s, 92);
  // hair: the back half of the head and the top, with the bun
  const hair = []; for (let i = 0; i <= 14; i++) { const a = -Math.PI * .95 + i / 14 * Math.PI * 1.05; hair.push(T([Math.cos(a) * 58, Math.sin(a) * 62 - 2])); } hair.push(T([-4, -20]), T([-22, 8]));
  mass(L.wet, hair, .8 * am, 2.4 * s, 93);
  draw(L, mk([T([-40, -42]), T([0, -64]), T([44, -42]), T([58, 0])], { w: 12 * s, tone: .92, darkDir: [0, -1], side: .85, brWet: true, body: .3, dry: .4, wet: .9, prof: 'robe', seed: 916, gapLen: 200 }), 1, am);   // hair contour
  draw(L, mk([T([-30, -48]), T([-24, -10]), T([-32, 30])], { w: 4.5 * s, tone: .82, dry: .45, prof: 'tip', seed: 917 }), 1, am);   // hairline at the temple
  const bun = []; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; bun.push(T([10 + Math.cos(a) * 19, -78 + Math.sin(a) * 16])); }
  mass(L.wet, bun, .95 * am, 1.2 * s, 94);
  draw(L, mk([T([-26, -84]), T([44, -78])], { w: 3.4 * s, tone: .9, dry: .4, prof: 'tip', seed: 918 }), 1, am);   // hairpin
  // the face in profile: brow, closed eye (opens with `eyes`), nose, mouth, ear
  draw(L, mk([T([-46, -22]), T([-30, -27]), T([-16, -22])], { w: 3.2 * s, tone: .8, dry: .45, prof: 'tip', seed: 919 }), 1, am);   // brow
  draw(L, mk([T([-44, -6]), T([-34, -1 - 7 * eyes]), T([-24, -6])], { w: 2.6 * s, tone: .86, dry: .4, prof: 'tip', seed: 920 }), 1, am);   // the eye: an arc, opening into a dot
  if (eyes > .5) blot(L.dry, T([-34, -5])[0], T([-34, -5])[1], 3.2 * s, .9 * am, 0, 1, 921);
  draw(L, mk([T([-50, -4]), T([-60, 14]), T([-50, 20])], { w: 2.8 * s, tone: .78, dry: .45, prof: 'tip', seed: 922 }), 1, am);   // nose
  draw(L, mk([T([-46, 32]), T([-36, 34])], { w: 2.4 * s, tone: .7, dry: .5, prof: 'tip', seed: 923 }), 1, am);                 // mouth
  draw(L, mk([T([10, -6]), T([20, 6]), T([10, 18])], { w: 2.6 * s, tone: .72, dry: .45, prof: 'tip', seed: 924 }), 1, am);     // ear
  // the back and shoulders behind, rising and breathing; sits up with lift
  const bx = x + 150 * s + 20 * s * lift, by0 = y - 40 * s;
  mass(L.wet, [[bx - 60 * s, by0], [bx + 20 * s, by0 - 150 * s - br - 90 * s * lift], [bx + 110 * s, by0 - 170 * s - br - 90 * s * lift], [bx + 190 * s, by0 - 80 * s - 60 * s * lift], [bx + 210 * s, by0 + 10 * s]], .2 * am, 3 * s, 95, [bx, by0 - 170 * s, bx, by0 + 10 * s, 1.1, .5]);
  draw(L, mk([[bx + 200 * s, by0 + 10 * s], [bx + 190 * s, by0 - 90 * s - 60 * s * lift], [bx + 110 * s, by0 - 172 * s - br - 90 * s * lift]], { w: 24 * s, tone: .66, darkDir: [1, 0], side: .85, brWet: true, body: .22, dry: .42, wet: .9, prof: 'robe', seed: 925 }), 1, am);   // the back
  draw(L, mk([[bx - 50 * s, by0 - 4 * s], [bx + 10 * s, by0 - 140 * s - br - 80 * s * lift], [bx + 100 * s, by0 - 168 * s - br - 90 * s * lift]], { w: 14 * s, tone: .5, darkDir: [-1, 0], side: .8, brWet: true, body: .15, dry: .5, wet: .8, prof: 'robe', seed: 926 }), 1, am);   // the chest side / collar
  return { face: T([-40, 0]), nose: T([-58, 14]) };
}

// An oil lamp on the desk: a small stand, a dish, and the flame left as paper-white with a dark wick; `k` = flicker 0..1. (top-down desk view)
export function lamp(L, x, y, s = 1, o = {}) {
  const am = o.am ?? 1, fl = o.flicker ?? 0;
  const dish = []; for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; dish.push([x + Math.cos(a) * 46 * s, y + Math.sin(a) * 30 * s]); }
  mass(L.wet, dish, .5 * am, 1.5 * s, 96);
  const rim = []; for (let i = 0; i <= 30; i++) { const a = i / 30 * Math.PI * 2 + .3; rim.push([x + Math.cos(a) * 47 * s, y + Math.sin(a) * 31 * s]); }
  draw(L, mk(rim, { w: 5 * s, tone: .85, dry: .4, wet: .3, prof: 'even', seed: 961 }), 1, am);
  draw(L, mk([[x - 30 * s, y + 44 * s], [x, y + 52 * s], [x + 30 * s, y + 44 * s]], { w: 4 * s, tone: .7, dry: .5, prof: 'tip', seed: 962 }), 1, am);   // the foot
  // the flame: a teardrop of paper left blank with a dark halo and the wick
  blot(L.wet, x + 18 * s, y - 8 * s, 22 * s, .6 * am, 0, .8, 963); blot(L.dry, x + 18 * s, y - 8 * s, 14 * s, .5 * am, 0, .8, 964);
  for (const c of [L.wet, L.dry]) { c.save(); c.globalCompositeOperation = 'destination-out'; c.globalAlpha = .97; c.beginPath(); c.ellipse(x + 18 * s + fl * 2, y - 8 * s, 9 * s * (1 + .15 * fl), 13 * s, .2 * fl, 0, 7); c.fill(); c.restore(); }
  draw(L, mk([[x + 10 * s, y + 6 * s], [x + 18 * s, y - 2 * s]], { w: 3 * s, tone: .9, dry: .3, prof: 'tip', seed: 965 }), 1, am);   // wick
  return [x + 18 * s, y - 8 * s];
}
