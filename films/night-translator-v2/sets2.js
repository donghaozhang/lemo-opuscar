// v2 set pieces: the viewer and the films inside it, the mountain, flames, the ladder, the drying film, montage
// inserts, the page insert with brush corrections, foreground layers. Tonal values only (Redraw inks them).
import { form, stroke, ellipsePts, catmull, grey, mottle } from './engine/ink.js';
import { red } from './mask.js';
import { clamp, lerp, hash, ss } from './lib.js';
import { can, clock, FLOOR } from './sets.js';

const circ = (cx, cy, r, n = 32) => ellipsePts(cx, cy, r, r, 0, n);
const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
export const glow = (g, x, y, r, a, v = 1) => {
  if (a <= .003) return;
  const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, grey(v, a)); gr.addColorStop(1, grey(v, 0));
  g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
};

// ---------------------------------------------------------------- the viewer gate: a film frame between sprocket strips
// draws the frame surround, then calls inner(g) clipped to the picture area (film coords 1440×1080)
export const GATE_IN = { x: 210, y: 95, w: 1020, h: 765 };
export function viewerGate(g, t, inner, o = {}) {
  form(g, rect(-50, -50, 1540, 1180), { v: .1, line: 0, grad: 0 });
  // the film strip running vertically, slight travel
  const off = (t * (o.run ?? 40)) % 120;
  form(g, rect(130, -60, 1180, 1200), { v: .2, line: 2, grad: .1 });
  for (let y = -120; y < 1200; y += 120) for (const x of [150, 1264]) form(g, rect(x, y + off, 26, 60), { v: .82, line: 1.2, grad: 0 });
  g.save(); g.beginPath(); const R = GATE_IN; g.roundRect(R.x, R.y, R.w, R.h, 26); g.clip();
  g.translate(R.x, R.y); g.scale(R.w / 1440, R.h / 1080);
  inner(g);
  g.restore();
  // the viewer's lens vignette and a cross-hair-free bezel
  const gr = g.createRadialGradient(720, 500, 300, 720, 500, 900); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.55)');
  g.fillStyle = gr; g.fillRect(0, 0, 1440, 1080);
}

// ---- the western: mesas, a saguaro, a rider galloping left → right, dust
export function western(g, t) {
  const sky = g.createLinearGradient(0, 0, 0, 1080); sky.addColorStop(0, grey(.95)); sky.addColorStop(.62, grey(.8)); sky.addColorStop(1, grey(.6));
  g.fillStyle = sky; g.fillRect(0, 0, 1440, 1080);
  form(g, circ(1120, 260, 90, 30), { v: 1, line: 1.5, grad: 0 });
  form(g, [[-50, 700], [120, 700], [160, 520], [420, 510], [460, 700], [900, 700], [940, 600], [1180, 590], [1220, 700], [1500, 700], [1500, 1100], [-50, 1100]], { v: .45, line: 2.4, grad: .15 });
  form(g, rect(-50, 780, 1540, 400), { v: .62, line: 2, grad: .1 });
  // saguaro
  const cx = 300; form(g, rect(cx - 18, 560, 36, 260), { v: .3, line: 2 }); form(g, [[cx - 18, 690], [cx - 70, 690], [cx - 70, 600], [cx - 50, 600], [cx - 50, 670], [cx - 18, 670]], { v: .3, line: 2 });
  form(g, [[cx + 18, 650], [cx + 64, 650], [cx + 64, 570], [cx + 44, 570], [cx + 44, 630], [cx + 18, 630]], { v: .3, line: 2 });
  // the rider (silhouette), galloping across
  const x = 330 + t * 260, ph = t * 11, by = 800 + Math.abs(Math.sin(ph)) * -18;
  for (let i = 0; i < 4; i++) { const k = (ph * .5 + i * .37) % 1; g.save(); g.globalAlpha = (1 - k) * .5; form(g, circ(x - 160 - k * 120, 870 - k * 30, 20 + k * 40, 16), { v: .8, line: 0 }); g.restore(); }
  const leg = (hx, hy, a) => stroke(g, [[hx, hy], [hx + Math.sin(a) * 30, hy + 40], [hx + Math.sin(a) * 40 - 6, hy + 80]], 9, { taper: .2 });
  leg(x - 70, by + 10, Math.sin(ph) * .9); leg(x - 50, by + 10, Math.sin(ph + 1) * .9); leg(x + 50, by + 10, Math.sin(ph + 2.4) * .9); leg(x + 70, by + 10, Math.sin(ph + 3.2) * .9);
  form(g, ellipsePts(x, by - 10, 100, 36, 0, 30), { v: .15, line: 2.4 });
  form(g, [[x + 70, by - 30], [x + 130, by - 100], [x + 175, by - 90], [x + 160, by - 66], [x + 110, by - 4]], { v: .15, line: 2.4 });
  stroke(g, [[x - 98, by - 20], [x - 150, by + 20 + Math.sin(ph) * 10]], 8, { taper: .6 });
  form(g, [[x - 20, by - 40], [x + 20, by - 40], [x + 14, by - 120], [x - 10, by - 120]], { v: .15, line: 2 });
  form(g, circ(x + 2, by - 140, 18, 16), { v: .15, line: 2 });
  form(g, [[x - 40, by - 150], [x + 44, by - 150], [x + 30, by - 160], [x + 18, by - 186], [x - 14, by - 186], [x - 26, by - 160]], { v: .1, line: 2 });
}
// ---- the romance: a balcony under the moon, two silhouettes leaning in, a heart iris
export function romance(g, t, heart = 1) {
  form(g, rect(-50, -50, 1540, 1180), { v: .3, line: 0, grad: .2 });
  form(g, circ(980, 300, 170, 40), { v: .97, line: 1.5, grad: .05 });
  for (let i = 0; i < 30; i++) form(g, circ(hash(i) * 1440, hash(i + 9) * 500, 2 + hash(i + 3) * 3, 8), { v: .9, line: 0 });
  form(g, rect(200, 760, 1040, 30), { v: .15, line: 2 });
  for (let i = 0; i < 14; i++) form(g, rect(230 + i * 72, 790, 18, 200), { v: .15, line: 1.5 });
  form(g, rect(200, 980, 1040, 120), { v: .15, line: 2 });
  const lean = ss(clamp(t / 1.6)) * 26;
  // him: hat, coat
  form(g, [[560 + lean, 760], [690 + lean, 760], [670 + lean, 500], [590 + lean, 500]], { v: .1, line: 2 });
  form(g, circ(632 + lean, 455, 40, 20), { v: .1, line: 2 });
  form(g, [[570 + lean, 430], [700 + lean, 430], [680 + lean, 420], [665 + lean, 380], [600 + lean, 380], [585 + lean, 420]], { v: .07, line: 2 });
  // her: bobbed hair, long dress
  form(g, [[760 - lean, 760], [880 - lean, 760], [840 - lean, 520], [790 - lean, 520]], { v: .1, line: 2 });
  form(g, circ(812 - lean, 470, 36, 20), { v: .1, line: 2 });
  form(g, [[770 - lean, 470], [775 - lean, 430], [812 - lean, 418], [852 - lean, 430], [856 - lean, 480], [836 - lean, 460], [790 - lean, 460]], { v: .06, line: 2 });
  // heart iris (black outside a heart that narrows)
  if (heart < 1.5) {
    const k = clamp(heart), s = lerp(160, 1400, k), cx = 720, cy = 520;
    g.save(); g.beginPath(); g.rect(-60, -60, 1560, 1200);
    g.moveTo(cx, cy + s * .55); g.bezierCurveTo(cx - s * 1.1, cy - s * .1, cx - s * .5, cy - s * .85, cx, cy - s * .35);
    g.bezierCurveTo(cx + s * .5, cy - s * .85, cx + s * 1.1, cy - s * .1, cx, cy + s * .55); g.closePath();
    g.fillStyle = grey(.04); g.fill('evenodd'); g.restore();
  }
}
// ---- the monster picture: rooftops in the rain, a lumbering giant with lamp eyes, lightning
export function monster(g, t, flash = 0) {
  form(g, rect(-50, -50, 1540, 1180), { v: .22 + flash * .6, line: 0, grad: .15 });
  const step = Math.sin(t * 3) * 10, mx = 760 + t * 30;
  // the giant (behind the roofs)
  form(g, [[mx - 200, 1100], [mx - 170, 500], [mx - 120, 330], [mx - 30, 270], [mx + 60, 280], [mx + 140, 360], [mx + 190, 520], [mx + 220, 1100]], { v: .08 + flash * .1, line: 2.4 });
  stroke(g, [[mx - 150, 470], [mx - 260, 620 + step], [mx - 300, 760 + step]], 26, { taper: .3 });
  stroke(g, [[mx + 170, 470], [mx + 280, 600 - step], [mx + 330, 740 - step]], 26, { taper: .3 });
  for (const k of [-1, 1]) form(g, circ(mx + 15 + k * 40, 345, 15, 14), { v: .98, line: 1.2, grad: 0 });
  // rooftops
  const roofs = [[-40, 760], [150, 700], [300, 780], [460, 690], [640, 760], [820, 720], [1000, 790], [1180, 700], [1360, 770], [1500, 760]];
  for (let i = 0; i < roofs.length - 1; i++) {
    const [x0, y0] = roofs[i], [x1] = roofs[i + 1];
    form(g, [[x0, 1100], [x0, y0], [(x0 + x1) / 2, y0 - 70], [x1, y0], [x1, 1100]], { v: .14, line: 2 });
    for (let w = 0; w < 2; w++) form(g, rect(x0 + 30 + w * 60, y0 + 60, 26, 34), { v: hash(i * 3 + w) > .5 ? .9 : .3, line: 1 });
  }
  // rain
  g.save(); g.strokeStyle = grey(.85, .5); g.lineWidth = 2; g.beginPath();
  for (let i = 0; i < 140; i++) { const x = (hash(i) * 1600 + t * 300) % 1500 - 30, y = (hash(i + 50) * 1100 + t * 1400) % 1180 - 60; g.moveTo(x, y); g.lineTo(x - 12, y + 46); }
  g.stroke(); g.restore();
  if (flash > .02) { g.save(); g.globalAlpha = flash * .5; g.fillStyle = '#fff'; g.fillRect(-50, -50, 1540, 1180); g.restore(); stroke(g, [[1100, -20], [1040, 160], [1090, 200], [1010, 420]], 7 * flash, { taper: .3 }); }
}
// ---- cats and dogs (the imagined literal translation)
export function catSil(g, x, y, s, a) { g.save(); g.translate(x, y); g.rotate(a); g.scale(s, s);
  form(g, ellipsePts(0, 0, 26, 15, 0, 20), { v: .12, line: 1.8 }); form(g, circ(24, -12, 13, 14), { v: .12, line: 1.8 });
  form(g, [[16, -20], [19, -34], [26, -22]], { v: .12, line: 1.2 }); form(g, [[26, -22], [33, -33], [35, -18]], { v: .12, line: 1.2 });
  stroke(g, catmull([[-24, -2], [-40, -14], [-44, -34], [-36, -42]], false, 5), 5, { taper: .4 });
  for (const lx of [-14, 12]) stroke(g, [[lx, 10], [lx - 4, 26]], 4.5, { taper: 0 }); g.restore(); }
export function dogSil(g, x, y, s, a) { g.save(); g.translate(x, y); g.rotate(a); g.scale(s, s);
  form(g, ellipsePts(0, 0, 32, 17, 0, 20), { v: .2, line: 1.8 }); form(g, ellipsePts(30, -14, 16, 13, 0, 14), { v: .2, line: 1.8 });
  form(g, ellipsePts(46, -10, 9, 6, 0, 10), { v: .2, line: 1.4 }); form(g, ellipsePts(24, -4, 7, 13, .3, 10), { v: .08, line: 1.2 });
  stroke(g, [[-30, -6], [-46, -22]], 5, { taper: .3 });
  for (const lx of [-18, -6, 14, 24]) stroke(g, [[lx, 12], [lx, 30]], 5, { taper: 0 }); g.restore(); }

// ---------------------------------------------------------------- the mountain of cans (cold-open tilt-up), world 1440 × 3000
export function mountain(g, o = {}) {
  form(g, rect(-200, -2400, 1840, 3400), { v: .2, line: 0, grad: .1 });
  // the pile: a tall cone of cans up into the dark
  for (let r = 0; r < 44; r++) {
    const n = Math.max(1, 22 - Math.floor(r / 2)), y = FLOOR - 24 - r * 44;
    for (let i = 0; i < n; i++) {
      const x = 720 + (i - (n - 1) / 2) * 46 + (hash(r * 17 + i) - .5) * 10;
      can(g, x, y, 23, .3 + hash(r * 5 + i) * .12 + clamp((y - (o.lightY ?? 900) + 400) / 900) * .25);
    }
  }
  // one can teetering at the very top
  const top = FLOOR - 24 - 44 * 44;
  g.save(); g.translate(720, top + 22); g.rotate(Math.sin((o.t ?? 0) * 7) * .12 * (o.teeter ?? 1)); can(g, 0, -22, 23, .55); g.restore();
  form(g, rect(-200, FLOOR, 1840, 400), { v: .25, line: 2, grad: .1 });
}

// ---------------------------------------------------------------- flames (licking tongues, white-hot core)
export function flame(g, x, y, size, t, amt = 1) {
  if (amt <= .02) return;
  const n = 4;
  for (let i = 0; i < n; i++) {
    const ph = t * (9 + i * 2.3) + i * 1.7, h = size * (.8 + .5 * Math.sin(ph) * .5 + hash(i) * .3) * amt;
    const w = size * .28 * (1 - i * .12), bx = x + (i - (n - 1) / 2) * size * .16;
    const tipx = bx + Math.sin(ph * .7) * size * .2;
    form(g, catmull([[bx - w, y], [bx - w * .7, y - h * .4], [tipx, y - h], [bx + w * .7, y - h * .4], [bx + w, y]], true, 6), { v: i % 2 ? .97 : .85, line: 1.6, grad: .15 });
  }
}
// ---- a rolling library ladder (crosses the aisle)
export function ladder(g, x, y, h = 520) {
  for (const k of [-1, 1]) form(g, rect(x + k * 46 - 7, y - h, 14, h), { v: .4, line: 2, grad: .2 });
  for (let i = 1; i < 9; i++) form(g, rect(x - 46, y - i * h / 9 - 4, 92, 8), { v: .45, line: 1.4 });
  for (const k of [-1, 1]) form(g, circ(x + k * 46, y + 8, 10, 14), { v: .2, line: 1.6 });
}
// ---- the drying film: a strip hung between two points with frames and drips
export function dryingFilm(g, p0, p1, sag, t, o = {}) {
  const N = 26, pts = [];
  for (let i = 0; i <= N; i++) { const u = i / N; pts.push([lerp(p0[0], p1[0], u), lerp(p0[1], p1[1], u) + Math.sin(u * Math.PI) * sag + Math.sin(t * 2 + u * 6) * 3]); }
  stroke(g, pts, 26, { taper: 0 });
  for (let i = 1; i < N; i++) {
    const [x, y] = pts[i];
    form(g, rect(x - 9, y - 9, 18, 18), { v: .8 - (i % 3) * .05, line: .8, grad: 0 });
    if (i % 3 === 0 && (o.drips ?? 1) > 0) { const ph = (t * .9 + hash(i)) % 1; form(g, ellipsePts(x, y + 14 + ph * 160, 2.5, 4, 0, 8), { v: .92, line: .6 }); }
  }
  return pts;
}

// ---------------------------------------------------------------- page insert: typed literal, red strike, brush correction
// o: typed (0..1 letters shown), strike (0..1), fix (0..1 reveal), pen (null | [x, y] where the pen hand is), rot
export function pageInsert(g, o, T) {
  form(g, rect(-50, -50, 1540, 1180), { v: .42, line: 0, grad: .2 });
  for (let i = 0; i < 30; i++) stroke(g, catmull([[-50, i * 40 + 10], [500, i * 40 + 14 + Math.sin(i) * 6], [1500, i * 40 + 8]], false, 6), 1.2, { taper: 0, alpha: .35 });
  g.save(); g.translate(720, 540); g.rotate(o.rot ?? -.02);
  form(g, rect(-480, -400, 960, 800), { v: .94, line: 2.4, grad: .08, shade: 10 });
  if (o.creased) for (let i = 0; i < 9; i++) { const a = hash(i + (o.seed ?? 0)) * 6.28; stroke(g, [[Math.cos(a) * 40, Math.sin(a) * 30], [Math.cos(a) * 300, Math.sin(a) * 225]], 1.1, { taper: .4, alpha: .35 }); }
  g.fillStyle = grey(.12); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  g.font = 'italic 400 32px "Old Standard TT"'; g.fillText(T.head, -410, -310);
  stroke(g, [[-410, -290], [410, -290]], 1.4, { taper: 0 });
  g.font = '400 28px "Old Standard TT"'; g.fillText('ENGLISH:', -410, -215); g.fillText('中文：', -410, -15);
  g.font = '700 70px "Old Standard TT"'; g.fillText(T.en, -410, -130);
  // the typed literal (typewriter reveal)
  g.font = '700 92px "Noto Serif SC"';
  const chars = [...T.bad], k = Math.floor(clamp(o.typed ?? 1) * chars.length + 1e-6);
  g.fillText(chars.slice(0, k).join(''), -410, 100);
  const w = g.measureText(T.bad).width;
  const sk = clamp(o.strike ?? 0);
  if (sk > 0) red(g, m => { m.lineWidth = 12; m.lineCap = 'round'; m.beginPath(); m.moveTo(-420, 70); m.lineTo(-420 + (w + 24) * sk, 70 - 12 * sk); m.stroke(); m.beginPath(); m.moveTo(-420, 86); m.lineTo(-420 + (w + 24) * sk, 84 - 6 * sk); m.stroke(); }, .3);
  const fx = clamp(o.fix ?? 0);
  if (fx > 0) red(g, m => {
    m.save(); m.beginPath(); m.rect(-440, 140, 900 * fx + 1, 240); m.clip();
    m.rotate(-.04); m.font = '400 150px "Ma Shan Zheng"'; m.textAlign = 'left'; m.textBaseline = 'alphabetic'; m.fillText(T.fix, -380, 320);
    m.restore();
  }, .3);
  g.restore();
  // 老校's pen hand entering the insert (a hands close-up)
  if (o.pen) penHand(g, o.pen[0], o.pen[1], 2.6, -.5);
}
// a big hand holding the red pen (close-up scale): forearm from off frame right
export function penHand(g, x, y, s = 2.5, a = -.5, noPen = false) {
  g.save(); g.translate(x, y); g.scale(s, s); g.rotate(a);
  form(g, [[30, -14], [420, -30], [420, 30], [30, 14]], { v: .32, line: 2.4, grad: .25 });            // forearm tube
  form(g, circ(30, 0, 18, 18), { v: .5, line: 1.8 });                                                 // wrist joint
  for (const k of [-1, 0, 1]) stroke(g, [[22, k * 8], [6, k * 12], [-4, k * 6]], 7, { taper: .2 });   // grip
  if (!noPen) form(g, [[-150, -5], [26, -7], [26, 7], [-150, 5]], { v: .58, line: 1.8, grad: .2 });              // the pen
  if (!noPen) red(g, m => { m.beginPath(); m.moveTo(-150, -5); m.lineTo(-176, 0); m.lineTo(-150, 5); m.closePath(); m.fill(); }, .38);
  g.restore();
}
// a three-prong robot grip at close-up scale (小译's hand), arm from off frame left
export function gripHand(g, x, y, s = 2.5, a = .3, open = .3) {
  g.save(); g.translate(x, y); g.scale(s, s); g.rotate(a);
  form(g, [[-380, -9], [-10, -9], [-10, 9], [-380, 9]], { v: .66, line: 2, grad: .25 });
  form(g, circ(0, 0, 12, 16), { v: .5, line: 1.6 });
  for (const k of [-1, 0, 1]) { const aa = k * (.35 + open * .5); stroke(g, [[0, 0], [Math.cos(aa) * 22, Math.sin(aa) * 22], [Math.cos(aa + k * .4) * 40, Math.sin(aa + k * .4) * 40]], 8, { taper: .2 }); }
  g.restore();
}

// ---------------------------------------------------------------- montage inserts
export function bigClock(g, hours, o = {}) {
  form(g, rect(-50, -50, 1540, 1180), { v: .34, line: 0, grad: .15 }); mottle(g, 0, 0, 1440, 1080, .12, 5);
  clock(g, 720, 540, 380, hours);
}
export function reelFace(g, spin) {
  form(g, rect(-50, -50, 1540, 1180), { v: .3, line: 0, grad: .15 });
  form(g, circ(720, 540, 420, 64), { v: .6, line: 3, grad: .25, shade: 20 });
  form(g, circ(720, 540, 380, 64), { v: .72, line: 1.6, grad: .1 });
  for (let i = 0; i < 3; i++) { const a = spin + i * Math.PI * 2 / 3; form(g, circ(720 + Math.cos(a) * 210, 540 + Math.sin(a) * 210, 95, 30), { v: .18, line: 2 }); }
  form(g, circ(720, 540, 50, 24), { v: .3, line: 2 }); form(g, circ(720, 540, 16, 12), { v: .1, line: 1 });
}
export function keysClose(g, t, o = {}) {
  form(g, rect(-50, -50, 1540, 1180), { v: .3, line: 0, grad: .15 });
  for (let r = 0; r < 3; r++) for (let i = 0; i < 8; i++) {
    const k = r * 8 + i, down = Math.floor(t * 16) % 24 === (k * 7) % 24;
    const x = 260 + i * 130 + r * 40, y = 520 + r * 150 + (down ? 12 : 0);
    form(g, circ(x, y, 46, 24), { v: down ? .55 : .85, line: 2, grad: .15 }); form(g, circ(x, y, 34, 20), { v: down ? .6 : .9, line: 1 });
  }
  // two grips hammering
  const a = Math.floor(t * 8) % 2;
  gripHand(g, 520 + a * 60, 380 + (a ? 40 : 0), 1.8, 1.2, .2); gripHand(g, 980 - a * 50, 360 + (a ? 0 : 40), 1.8, 1.4, .2);
}
export function tubeOutlet(g, t) {
  form(g, rect(-50, -50, 1540, 1180), { v: .36, line: 0, grad: .15 });
  form(g, [[560, -60], [880, -60], [880, 420], [560, 420]], { v: .62, line: 3, grad: .3 });
  form(g, ellipsePts(720, 420, 160, 40, 0, 30), { v: .1, line: 2.4 });
  for (let i = 0; i < 4; i++) {
    const u = ((t * 1.6 + i / 4) % 1), y = 420 + u * 800, a = u * 4 + i;
    g.save(); g.translate(720 + Math.sin(i * 2 + u * 3) * 160 * u, y); g.rotate(a); form(g, rect(-110, -140, 220, 280), { v: .94, line: 2, grad: .05 });
    for (let l = 0; l < 6; l++) stroke(g, [[-80, -100 + l * 36], [70 - (l % 2) * 30, -100 + l * 36]], 3, { taper: 0, alpha: .7 }); g.restore();
  }
}
export function stampClose(g, t, period = .35) {
  form(g, rect(-50, -50, 1540, 1180), { v: .5, line: 0, grad: .15 });
  for (let i = 0; i < 5; i++) { g.save(); g.translate(560 + i * 40, 760 - i * 12); g.rotate(-.1 + i * .05); form(g, rect(-260, -170, 520, 340), { v: .93, line: 2, grad: .05 }); stroke(g, [[-130, 30], [-40, 110], [150, -100]], 18, { taper: .2 }); g.restore(); }
  const u = (t / period) % 1, down = Math.sin(Math.min(1, u * 2) * Math.PI);
  const y = 280 + down * 260;
  form(g, rect(650, y - 520, 60, 380), { v: .3, line: 2.4, grad: .2 });
  form(g, rect(600, y - 160, 160, 60), { v: .5, line: 2 });
  form(g, rect(540, y - 100, 280, 110), { v: .15, line: 2.6, grad: .2 });
  red(g, m => m.fillRect(540, y, 280, 12), .3);
}
export function basketOverflow(g, t, k) {
  form(g, rect(-50, -50, 1540, 1180), { v: .36, line: 0, grad: .15 });
  const h = 100 + k * 420;
  for (let i = 0; i < 14; i++) form(g, rect(450 + (hash(i) - .5) * 60, 860 - h + i * (h / 14), 540, 26), { v: .93, line: 1.2, grad: 0 });
  form(g, [[380, 640], [1060, 640], [990, 1100], [450, 1100]], { v: .42, line: 3, grad: .2 });
  for (let i = -6; i <= 6; i++) stroke(g, [[720 + i * 52, 650], [720 + i * 44, 1090]], 2.4, { taper: 0 });
  for (let i = 0; i < 3; i++) { const u = ((t * 1.2 + i / 3) % 1); g.save(); g.translate(600 + i * 120, -100 + u * 700); g.rotate(u * 3 + i); form(g, rect(-110, -140, 220, 280), { v: .95, line: 2 }); g.restore(); }
}

// ---------------------------------------------------------------- foreground layer: a near shelf post and hanging cans, parallax
export function foreground(g, camX, k = 1.35, side = 'L', v = .08) {
  g.save();
  const x = (side === 'L' ? 60 : 1380) - (camX - 720) * (k - 1);
  form(g, rect(x - 70, -80, 140, 1300), { v, line: 2.4, grad: .2 });
  for (let i = 0; i < 3; i++) can(g, x + (side === 'L' ? 110 : -110), 200 + i * 300, 52, .14);
  g.restore();
}
