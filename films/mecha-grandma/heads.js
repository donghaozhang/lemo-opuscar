// Heads for 《机甲外婆》 — the 80s construction (cranium sphere + egg jaw, almond eyes at the vertical middle, thick upper
// lash line, layered iris with two highlights, long thin brows, shadow-plane nose, coloured lines) for two characters:
//   外婆 (≈70): rounder jaw, narrower eyes with smile lines, silver hair swept back into a bun, red hairpin, reading glasses
//               pushed up into the hair (so the eyes always read), quilted plum jacket.
//   阿杰 (≈26): longer face, messy dark locks, dark circles, grey hoodie, headphones around the neck.
// Local coordinates: cranium centre (0,0), radius ≈80; eye line +22; chin ≈ +110. The face looks to screen right (q view).
import { cel, path, poly, line, TAU, rgba, mix, LWK } from './cel.js';

const LW = 1.5, LS = LW * .78, LH = LW * 1.05, LP = LW * 1.25;

// expressions: open, lid (+ = heavier upper lid), brow [inner dy, outer dy, arch] (+ = down), mouth, look, smileEyes, iris scale
export const EXPR = {
  neutral: { open: 1, lid: .1, brow: [0, 0, 2], mouth: 'closed' },
  worried: { open: .95, lid: .05, brow: [-8, 5, 2.5], mouth: 'frown', look: [-.1, .2] },
  resolute: { open: .88, lid: .38, brow: [7, -2, 1], mouth: 'set', look: [.35, 0] },
  fierce: { open: .78, lid: .55, brow: [14, -8, -1], mouth: 'grit', look: [.5, -.05], glint: .8 },
  sly: { open: .7, lid: .45, brow: [4, -6, 3], mouth: 'smirk', look: [.45, .05] },
  tender: { open: .7, lid: .15, brow: [-4, -1, 3], mouth: 'smile', smileEyes: true },
  laugh: { open: .0, lid: 0, brow: [-5, -2, 4], mouth: 'smileopen', smileEyes: true, closedHappy: true },
  surprised: { open: 1.12, lid: -.25, brow: [-10, -8, 5], mouth: 'oh', iris: .75 },
  dull: { open: .62, lid: .58, brow: [0, 2, 1], mouth: 'closed', look: [.2, .3] },
  startled: { open: 1.15, lid: -.3, brow: [-9, -6, 4], mouth: 'oh', iris: .7, look: [-.2, 0] },
  stunned: { open: 1.05, lid: -.15, brow: [-7, -3, 3.5], mouth: 'ohsmall', iris: .8 },
  moved: { open: .8, lid: .05, brow: [-9, 2, 3], mouth: 'smile', tear: true },
  happy: { open: .74, lid: .08, brow: [-4, -2, 3.5], mouth: 'smileopen', smileEyes: true },
  closed: { open: 0, lid: 0, brow: [0, 0, 2], mouth: 'closed' },
};

// ——— eye (after head80.js) ———
function eye(g, P, ep, cx, cy, w, h, dir, fs, E, old) {
  const open = Math.max(0, E.open ?? 1), lid = E.lid || 0, W2 = w / 2, lash = P.lash;
  const X = u => cx + dir * u * W2;
  const inY = cy + h * .1, outY = cy - h * .08 - (E.smileEyes ? h * .06 : 0) + (old ? h * .06 : 0);
  const topY = cy - h * .5 * open + lid * h * .32;
  const botY = cy + h * .47 * Math.min(1, open + .25) - (E.smileEyes ? h * .3 : 0);
  if (E.closedHappy) {          // happy closed eyes: an upward arc
    cel(g, [[X(-1), cy + h * .12, 1], [X(0), cy - h * .22], [X(1.05), cy + h * .08, 1], [X(1.2), cy - h * .05, 1], [X(1), cy + h * .2], [X(0), cy - h * .06], [X(-.98), cy + h * .24, 1]], { f: lash });
    if (old) for (let k = 0; k < 3; k++) line(g, [[X(1.15), cy + k * 5 - 2], [X(1.5), cy + k * 7 - 6]], mix(P.skin.l, P.skin.f, .3), LS * .7);
    return;
  }
  if (open > .08) {
    const WP = path([[X(-1), inY, 1], [X(-.4), topY + h * .05], [X(.3), topY], [X(1), outY, 1], [X(.45), botY], [X(-.4), botY - h * .02]], true);
    g.save(); g.clip(WP);
    g.fillStyle = P.white_eye; g.fill(WP);
    g.fillStyle = mix(P.white_eye, P.skin.s, .55); g.fillRect(cx - w, topY - 6, w * 2, h * .24 + 6);
    const sc = E.iris || 1, iw = w * .27 * sc * (fs < 1 ? .92 : 1), ih = h * .48 * sc;
    const ix = cx + dir * W2 * .04 + (E.look?.[0] || 0) * w * .15 * dir, iy = cy + h * .08 + (E.look?.[1] || 0) * h * .14;
    const IR = new Path2D(); IR.ellipse(ix, iy, iw, ih, 0, 0, TAU);
    g.fillStyle = ep.f; g.fill(IR);
    g.save(); g.clip(IR);
    g.fillStyle = ep.s; g.fillRect(ix - iw, iy - ih, iw * 2, ih * .95);
    g.fillStyle = mix(ep.s, lash, .5); g.fillRect(ix - iw, iy - ih, iw * 2, ih * .38);
    g.fillStyle = mix(ep.l, lash, .3); g.beginPath(); g.ellipse(ix, iy - ih * .02, iw * .46, ih * .52, 0, 0, TAU); g.fill();
    g.fillStyle = ep.h; g.beginPath(); g.ellipse(ix, iy + ih * .9, iw * 1.05, ih * .52, 0, 0, TAU); g.fill();
    g.fillStyle = mix(ep.h, '#ffffff', .45); g.beginPath(); g.ellipse(ix, iy + ih * 1.05, iw * .7, ih * .32, 0, 0, TAU); g.fill();
    if (E.reflect) { g.strokeStyle = rgba(E.reflect, .85); g.lineWidth = iw * .18; g.beginPath(); g.arc(ix, iy, ih * .72, .3, 1.3); g.stroke(); }
    g.restore();
    g.strokeStyle = mix(ep.l, lash, .5); g.lineWidth = LW * .75 * LWK.k; g.stroke(IR);
    g.fillStyle = '#ffffff';
    g.beginPath(); g.ellipse(ix - dir * iw * .34, iy - ih * .34, iw * .42, ih * .27, -.5 * dir, 0, TAU); g.fill();
    g.beginPath(); g.arc(ix + dir * iw * .42, iy + ih * .34, iw * .2, 0, TAU); g.fill();
    if (E.glint) { g.save(); g.translate(ix - dir * iw * .34, iy - ih * .34); const s = E.glint * iw * 1.4; g.beginPath(); for (let k = 0; k < 8; k++) { const a = k * TAU / 8, r = k % 2 ? s * .18 : s; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.fill(); g.restore(); }
    if (E.tear) { g.fillStyle = rgba('#dff6ff', .9); g.beginPath(); g.ellipse(cx, botY - 1, w * .42, 2.6, 0, 0, TAU); g.fill(); }
    g.restore();
    line(g, [[X(.95), outY + h * .12], [X(.5), botY + 1], [X(.05), botY + 1.5]], mix(P.skin.l, P.skin.f, .35), LS * .8);
  }
  const t = h * .19;
  if (open > .08) {
    cel(g, [[X(-1.03), inY + 1, 1], [X(-.4), topY + h * .05 - t * .6], [X(.3), topY - t * .75], [X(.95), outY - t], [X(1.2), outY - t * (old ? 1.2 : 1.9), 1],
      [X(1.03), outY + t * .5], [X(.3), topY + t * .45], [X(-.4), topY + h * .05 + t * .35], [X(-.98), inY + t * .6, 1]], { f: lash });
    if (!old) line(g, [[X(-.25), topY - h * .22], [X(.45), topY - h * .25], [X(1), outY - h * .3]], mix(P.skin.l, P.skin.f, .3), LS * .85);
    else {          // older eyes: a heavier crease, smile lines at the outer corner, a soft bag below
      line(g, [[X(-.5), topY - h * .2], [X(.4), topY - h * .32], [X(1.05), outY - h * .22]], mix(P.skin.l, P.skin.f, .2), LS * .9);
      for (let k = 0; k < 3; k++) line(g, [[X(1.2), outY + k * 5 - 3], [X(1.55), outY + k * 8 - 9]], mix(P.skin.l, P.skin.f, .35), LS * .7);
      line(g, [[X(-.6), botY + h * .3], [X(.2), botY + h * .38], [X(.8), botY + h * .26]], mix(P.skin.l, P.skin.f, .45), LS * .7);
    }
  } else {
    cel(g, [[X(-1), inY, 1], [X(0), cy + h * .22], [X(1.05), outY + h * .04], [X(1.22), outY - t, 1], [X(1), outY + t * .8], [X(0), cy + h * .22 + t * .8], [X(-.98), inY + t * .5, 1]], { f: lash });
  }
  if (E.circles) { g.fillStyle = rgba('#6a4a8a', .28 * E.circles); g.beginPath(); g.ellipse(cx, botY + h * .22, w * .42, h * .14, 0, 0, TAU); g.fill(); }
}
function brow(g, P, ix, iy, ox, oy, B, thick = 1) {
  const a = [ix, iy + B[0]], c = [ox, oy + B[1]], m = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2 - B[2]];
  const t = 1.5 * thick;
  cel(g, [[a[0], a[1] - t, 1], [m[0], m[1] - t * 1.15], [c[0], c[1] - .2, 1], [m[0], m[1] + t * .85], [a[0], a[1] + t, 1]], { f: P.browCol || P.lash });
}
function mouth(g, P, cx, cy, w, type, fs = 1) {
  const L = cx - w / 2, R = cx + w / 2 * fs, lc = P.skin.l;
  const lowerLip = (y, ww) => line(g, [[cx - ww * .6, y], [cx + ww * .5, y]], mix(lc, P.skin.f, .5), LS * .75);
  if (type === 'closed' || type === 'set') {
    const dn = type === 'set' ? 1.6 : 0;
    line(g, [[L, cy + dn], [cx - w * .12, cy - .6], [cx + w * .06, cy + .2], [R, cy + dn]], lc, LS * 1.05); lowerLip(cy + 5.5, w * .2);
  } else if (type === 'frown') {
    line(g, [[L, cy + 3], [cx - w * .1, cy - .5], [cx + w * .1, cy - .5], [R, cy + 3.5]], lc, LS * 1.05); lowerLip(cy + 6, w * .2);
  } else if (type === 'smile') {
    line(g, [[L - 1, cy - 3], [cx - w * .15, cy + 1.6], [cx + w * .1, cy + 1.6], [R + 1, cy - 3]], lc, LS * 1.05); lowerLip(cy + 6.5, w * .16);
  } else if (type === 'smirk') {
    line(g, [[L, cy + 1], [cx, cy + 1], [R + 2, cy - 4]], lc, LS * 1.05); lowerLip(cy + 6, w * .16);
  } else {
    let pts, teeth = 0, tongue = 0, bot;
    if (type === 'smileopen') { pts = [[L - 1, cy - 3, 1], [cx, cy - 2], [R + 1, cy - 3, 1], [cx + w * .2, cy + 7], [cx, cy + 11], [cx - w * .22, cy + 7]]; teeth = 1; tongue = 1; bot = cy + 11; }
    else if (type === 'grit') { pts = [[L, cy, 1], [cx, cy - 1.5], [R, cy - 1, 1], [cx + w * .1, cy + 6], [cx - w * .1, cy + 6]]; teeth = 2; bot = cy + 6; }
    else if (type === 'oh') { pts = [[cx - w * .24, cy + 3], [cx, cy - 4], [cx + w * .22, cy + 3], [cx + w * .16, cy + 15], [cx - w * .16, cy + 15]]; bot = cy + 15; }
    else { pts = [[cx - w * .14, cy + 2], [cx, cy - 2], [cx + w * .13, cy + 2], [cx + w * .1, cy + 8], [cx - w * .1, cy + 8]]; bot = cy + 8; }   // ohsmall
    const MP = path(pts, true);
    g.save(); g.clip(MP); g.fillStyle = '#5a1a2a'; g.fill(MP);
    if (tongue) { g.fillStyle = '#e0707a'; g.beginPath(); g.ellipse(cx, bot + 1, w * .28, 6, 0, 0, TAU); g.fill(); }
    if (teeth === 1) { g.fillStyle = '#ffffff'; g.fillRect(cx - w, cy - 8, w * 2, 10.5); }
    if (teeth === 2) { g.fillStyle = '#ffffff'; g.fillRect(cx - w, cy - 8, w * 2, 20); g.strokeStyle = mix(lc, '#ffffff', .5); g.lineWidth = .8; g.beginPath(); g.moveTo(L, cy + 2.5); g.lineTo(R, cy + 2.5); g.stroke(); }
    g.restore();
    g.strokeStyle = lc; g.lineWidth = LS * 1.05 * LWK.k; g.lineJoin = 'round'; g.stroke(MP);
    lowerLip(bot + 4.5, w * .14);
  }
}
function lock(x0, y0, x1, y1, tx, ty, bend = 0) {
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, dx = tx - mx, dy = ty - my, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  return [[x0, y0], [x0 + dx * .55 + nx * bend, y0 + dy * .55 + ny * bend], [tx, ty, 1], [x1 + dx * .5 + nx * bend * .7, y1 + dy * .5 + ny * bend * .7], [x1, y1]];
}
function halo(g, P, cx, cy, rx, ry, a0, a1, th, teeth) {
  const up = [], dn = [];
  for (let i = 0; i <= teeth * 2; i++) {
    const u = i / (teeth * 2), a = a0 + (a1 - a0) * u, env = Math.sin(u * Math.PI) * .7 + .3;
    up.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    const depth = th * env * (i % 2 ? 1.9 : .55);
    dn.push([cx + Math.cos(a) * (rx - depth * .15), cy + Math.sin(a) * ry + depth]);
  }
  g.fillStyle = mix(P.hair.h, '#ffffff', .3);
  g.beginPath(); up.forEach((p, i) => g[i ? 'lineTo' : 'moveTo'](p[0], p[1])); for (let i = dn.length - 1; i >= 0; i--) g.lineTo(dn[i][0], dn[i][1]); g.closePath(); g.fill();
}

// ——— face outlines (q = 3/4 view looking right, front) ———
const FACE = {
  g: {          // 外婆: rounder, softer jaw, fuller cheek
    q: { face: [[-64, -44], [-68, -4], [-68, 30], [-62, 58], [-50, 82], [-28, 100], [0, 108], [22, 103], [38, 92], [48, 76], [52, 62], [55, 46], [56, 30], [52, 16], [55, 0], [54, -40], [18, -64], [-36, -64]],
      neck: [[-34, 66], [10, 86], [16, 134], [-40, 134]], chinShadow: [[-46, 62], [20, 62], [20, 92], [0, 109], [-28, 100], [-50, 82]],
      farShade: [[90, 30], [90, 120], [16, 106], [32, 96], [42, 82], [48, 66], [52, 50], [56, 30]],
      eyes: [{ x: -20, y: 22, w: 40, h: 30, dir: -1, fs: 1 }, { x: 35, y: 20, w: 24, h: 28, dir: 1, fs: .6 }],
      brows: [[0, -2, -40, 0], [24, -4, 46, 1]], mouth: { x: 18, y: 74, w: 30, fs: .75 },
      nose: [[42, 40], [46, 50], [39, 54], [39, 48]], blush: [[-32, 50, 15, 5], [44, 48, 6, 3.5]], ear: [-50, 26] },
    front: { face: [[-66, -40], [-68, 4], [-66, 36], [-60, 62], [-48, 86], [-26, 102], [0, 108], [26, 102], [48, 86], [60, 62], [66, 36], [68, 4], [66, -40], [36, -64], [-36, -64]],
      neck: [[-27, 76], [27, 76], [30, 134], [-30, 134]], chinShadow: [[-40, 72], [40, 72], [40, 90], [26, 102], [0, 109], [-26, 102], [-40, 90]],
      farShade: [[90, 26], [90, 120], [26, 104], [46, 88], [58, 64], [64, 40], [66, 26]],
      eyes: [{ x: -36, y: 22, w: 38, h: 28, dir: -1, fs: 1 }, { x: 36, y: 22, w: 38, h: 28, dir: 1, fs: 1 }],
      brows: [[-14, -4, -54, -2], [14, -4, 54, -2]], mouth: { x: 0, y: 74, w: 26, fs: 1 },
      nose: [[3, 40], [7, 53], [1, 55]], blush: [[-44, 50, 14, 5], [44, 50, 14, 5]], ear: null },
  },
  j: {          // 阿杰: longer face, firmer jaw
    q: { face: [[-62, -44], [-66, -4], [-65, 32], [-58, 64], [-44, 92], [-20, 112], [6, 120], [26, 113], [40, 98], [47, 80], [50, 64], [54, 46], [56, 30], [51, 16], [54, 0], [54, -40], [18, -64], [-36, -64]],
      neck: [[-34, 70], [14, 96], [18, 146], [-40, 146]], chinShadow: [[-44, 68], [22, 68], [22, 100], [6, 121], [-20, 112], [-44, 92]],
      farShade: [[90, 30], [90, 130], [20, 118], [36, 104], [44, 86], [48, 70], [52, 52], [56, 30]],
      eyes: [{ x: -20, y: 24, w: 40, h: 30, dir: -1, fs: 1 }, { x: 35, y: 22, w: 24, h: 28, dir: 1, fs: .6 }],
      brows: [[0, -4, -42, -2], [24, -6, 48, -2]], mouth: { x: 20, y: 80, w: 30, fs: .75 },
      nose: [[42, 42], [46, 54], [39, 58], [39, 50]], blush: [[-30, 52, 12, 4], [44, 50, 5, 3]], ear: [-50, 28] },
    front: { face: [[-64, -40], [-66, 4], [-64, 38], [-56, 68], [-42, 94], [-22, 112], [0, 120], [22, 112], [42, 94], [56, 68], [64, 38], [66, 4], [64, -40], [36, -64], [-36, -64]],
      neck: [[-26, 80], [26, 80], [30, 146], [-30, 146]], chinShadow: [[-40, 76], [40, 76], [40, 96], [22, 112], [0, 121], [-22, 112], [-40, 96]],
      farShade: [[90, 26], [90, 130], [22, 114], [42, 96], [56, 70], [62, 44], [64, 26]],
      eyes: [{ x: -35, y: 24, w: 38, h: 28, dir: -1, fs: 1 }, { x: 35, y: 24, w: 38, h: 28, dir: 1, fs: 1 }],
      brows: [[-14, -4, -54, -2], [14, -4, 54, -2]], mouth: { x: 0, y: 80, w: 26, fs: 1 },
      nose: [[3, 42], [7, 55], [1, 58]], blush: [[-42, 52, 12, 4], [42, 52, 12, 4]], ear: null },
  },
};

// ——— hair ———
function hairG(g, P, view, layer, st) {          // silver hair swept back into a bun; glasses pushed up; red pin
  const q = view === 'q';
  if (layer === 'back') {
    cel(g, q ? [[-70, -76], [-86, -44], [-84, -8], [-70, 6], [-56, -24], [10, -60], [40, -60], [56, -40], [52, -74], [10, -100], [-40, -98]]
      : [[-74, -70], [-84, -30], [-74, -4], [-62, -22], [62, -22], [74, -4], [84, -30], [74, -70], [0, -104]], { f: P.hair.s, s: mix(P.hair.s, '#000000', .2), so: [-6, -6], l: P.hair.l, lw: LH });
    // the bun
    const bx = q ? -58 : 0, by = q ? -96 : -110;
    const bun = new Path2D(); bun.ellipse(bx, by, 34, 28, -.3, 0, TAU);
    cel(g, bun, { f: P.hair.f, s: P.hair.s, so: [-6, -6], h: P.hair.h, ho: [5, 5], l: P.hair.l, lw: LH });
    for (let k = 0; k < 3; k++) line(g, [[bx - 24 + k * 6, by - 10 + k * 8], [bx + 2 + k * 4, by - 18 + k * 9], [bx + 22, by - 4 + k * 7]], mix(P.hair.l, P.hair.s, .4), LH * .55);
    // the red hairpin through the bun
    cel(g, poly([[bx - 46, by + 14], [bx + 40, by - 22], [bx + 42, by - 17], [bx - 44, by + 19]]), { f: P.pin.f, s: P.pin.s, so: [-1, -2], l: P.pin.l, lw: LS });
    const bead = new Path2D(); bead.arc(bx + 44, by - 21, 7, 0, TAU); cel(g, bead, { f: P.pin.f, h: P.pin.h, ho: [2, 2], l: P.pin.l, lw: LS });
    return;
  }
  // front: the swept-back cap with comb lines
  const cap = q ? [[54, -34], [50, -60], [24, -86], [-24, -94], [-66, -76], [-84, -36], [-80, 6], [-64, 18], [-58, -14], [-36, -44], [6, -54], [36, -50]]
    : [[60, -30], [52, -64], [20, -90], [-20, -90], [-52, -64], [-60, -30], [-64, 10], [-54, 4], [-40, -40], [0, -54], [40, -40], [54, 4], [64, 10]];
  cel(g, cap, { f: P.hair.f, s: P.hair.s, so: [-7, -7], h: P.hair.h, l: P.hair.l, lw: LH });
  const lc = mix(P.hair.l, P.hair.s, .35);
  if (q) for (let k = 0; k < 6; k++) line(g, [[44 - k * 4, -50 + k * 2], [10 - k * 14, -76 + k * 1], [-40 - k * 6, -70 + k * 9]], lc, LH * .5);
  else for (let k = -2; k <= 2; k++) line(g, [[k * 14, -52], [k * 18, -76], [k * 16, -88]], lc, LH * .5);
  // a sheen
  g.save(); g.clip(path(cap)); halo(g, P, q ? -8 : 0, -10, q ? 64 : 70, 56, Math.PI * 1.15, Math.PI * 1.8, 6, 7); g.restore();
  // reading glasses pushed up into the hair
  if (st.glasses !== 'down') {
    const gy = q ? -70 : -74, gx = q ? [2, 36] : [-26, 26], rw = q ? [16, 11] : [17, 17];
    for (let i = 0; i < 2; i++) { const L = new Path2D(); L.ellipse(gx[i], gy, rw[i], rw[i] * .7, 0, 0, TAU); cel(g, L, { f: rgba('#dff4ff', .55), l: P.glasses.l, lw: LP * 1.1 }); g.strokeStyle = P.glasses.f; g.lineWidth = 2.2 * LWK.k; g.stroke(L); }
    line(g, [[gx[0] + rw[0], gy], [gx[1] - rw[1], gy]], P.glasses.f, 2.2);
  }
}
function hairJ(g, P, view, layer, st) {          // messy dark locks
  const q = view === 'q', ph = st.ph || 0, wob = Math.sin(ph * TAU) * 2 * (st.wind ?? 0);
  if (layer === 'back') {
    cel(g, q ? [[-80, -40], [-92, 4], [-84, 30], [-64, 34], [-46, -10], [20, -40], [58, -30], [62, -70], [20, -104], [-40, -100]]
      : [[-84, -40], [-88, 10], [-74, 30], [-60, 10], [-50, -20], [50, -20], [60, 10], [74, 30], [88, 10], [84, -40], [0, -106]], { f: P.hair.s, s: mix(P.hair.s, '#000000', .3), so: [-8, -8], l: P.hair.l, lw: LH });
    return;
  }
  const cap = q ? [[-88, 4], [-94, -44], [-70, -90], [-24, -108], [24, -104], [60, -80], [68, -46], [60, -6], [46, -30], [0, -54], [-58, -34]]
    : [[-84, 6], [-90, -44], [-60, -96], [0, -110], [60, -96], [90, -44], [84, 6], [60, -30], [0, -54], [-60, -30]];
  cel(g, cap, { f: P.hair.f, s: P.hair.s, so: [-9, -9], h: P.hair.h, l: P.hair.l, lw: LH });
  const locks = q ? [[-60, -86, -24, -96, -44, -6, -2], [-30, -96, 6, -98, -14, 4, 3], [0, -98, 34, -90, 20, -8, 5], [26, -90, 58, -72, 52, 0, 6], [44, -76, 66, -52, 64, 10, 5], [-90, -50, -58, -76, -86, 16, -6], [-12, -104, 18, -106, 6, -116, -6]]
    : [[-56, -88, -20, -98, -34, -8, -3], [-24, -98, 12, -100, -6, 6, 2], [8, -100, 44, -90, 30, -6, 4], [40, -88, 70, -64, 62, 6, 5], [-80, -60, -50, -84, -72, 10, -5], [-6, -106, 20, -108, 10, -118, -6]];
  g.save(); g.fillStyle = P.hair.s; for (const L of locks) { const [x0, y0, x1, y1, tx, ty, b] = L; g.fill(path(lock(x0 - 8, y0, x1 + 8, y1, tx, ty + 3 + wob, b))); } g.restore();
  for (const L of locks) { const [x0, y0, x1, y1, tx, ty, b] = L; cel(g, lock(x0, y0, x1, y1, tx, ty + wob, b), { f: P.hair.f, s: P.hair.s, so: [-5, -5], l: mix(P.hair.l, P.hair.s, .45), lw: LH * .6 }); }
  g.save(); const HC = new Path2D(); HC.addPath(path(cap)); for (const L of locks) { const [x0, y0, x1, y1, tx, ty, b] = L; HC.addPath(path(lock(x0, y0, x1, y1, tx, ty + wob, b))); }
  g.clip(HC); halo(g, P, q ? -12 : 0, -14, 70, 56, Math.PI * 1.12, Math.PI * 1.85, 7, 8); g.restore();
}

// ——— bust bodies ———
function bodyG(g, P, view, E) {
  const dx = view === 'q' ? -12 : 0, dy = E.shoulders || 0;
  cel(g, [[-170 + dx, 330], [-160 + dx, 210 + dy], [-120 + dx, 166 + dy], [-50 + dx, 146 + dy * .5], [44 + dx, 146 + dy * .5], [108 + dx, 164 + dy], [148 + dx, 206 + dy], [156 + dx, 330]],
    { f: P.gjacket.f, s: P.gjacket.s, so: [-26, -10], h: P.gjacket.h, ho: [8, 6], l: P.gjacket.l, lw: LW * 1.1,
      clipFn: gg => { gg.strokeStyle = rgba(P.gjacket.l, .5); gg.lineWidth = 1.6; for (let k = 0; k < 7; k++) { gg.beginPath(); gg.moveTo(-180 + dx, 200 + k * 26); gg.quadraticCurveTo(0 + dx, 190 + k * 26 + 10, 170 + dx, 200 + k * 26); gg.stroke(); } } });
  // blouse collar
  cel(g, [[-40 + dx, 140 + dy * .5], [0 + dx, 176], [40 + dx, 140 + dy * .5], [30 + dx, 128], [0 + dx, 150], [-30 + dx, 128]], { f: P.gshirt.f, s: P.gshirt.s, so: [-3, -4], l: P.gshirt.l, lw: LW });
  cel(g, [[-58 + dx, 150 + dy * .5], [-34 + dx, 128], [-4 + dx, 170], [-30 + dx, 200]], { f: P.gjacket.h, l: P.gjacket.l, lw: LW });
  cel(g, [[56 + dx, 150 + dy * .5], [32 + dx, 128], [4 + dx, 170], [28 + dx, 200]], { f: P.gjacket.f, s: P.gjacket.s, so: [-3, -3], l: P.gjacket.l, lw: LW });
}
function bodyJ(g, P, view, E) {
  const dx = view === 'q' ? -12 : 0, dy = E.shoulders || 0;
  cel(g, [[-186 + dx, 340], [-176 + dx, 222 + dy], [-130 + dx, 176 + dy], [-56 + dx, 158 + dy * .5], [50 + dx, 158 + dy * .5], [118 + dx, 174 + dy], [162 + dx, 220 + dy], [172 + dx, 340]],
    { f: P.hoodie.f, s: P.hoodie.s, so: [-28, -10], h: P.hoodie.h, ho: [8, 6], l: P.hoodie.l, lw: LW * 1.1 });
  // hood bunched around the neck
  cel(g, [[-84 + dx, 170 + dy * .5], [-60 + dx, 140], [0 + dx, 150], [60 + dx, 140], [84 + dx, 170 + dy * .5], [50 + dx, 196], [0 + dx, 186], [-50 + dx, 196]], { f: P.hoodie.f, s: P.hoodie.s, so: [-6, -8], h: P.hoodie.h, ho: [0, 4], l: P.hoodie.l, lw: LW });
  line(g, [[-10 + dx, 186], [-14 + dx, 250]], P.hoodie.l, LW * .7); line(g, [[12 + dx, 186], [16 + dx, 246]], P.hoodie.l, LW * .7);
  // headphones around the neck
  const hp = (x, y) => { const c = new Path2D(); c.ellipse(x, y, 20, 26, .2, 0, TAU); cel(g, c, { f: P.phone.f, s: P.phone.s, so: [-3, -3], h: P.phone.h, ho: [2, 2], l: '#08080c', lw: LP }); };
  line(g, [[-56 + dx, 158], [0 + dx, 196], [56 + dx, 158]], P.phone.f, 6);
  hp(-60 + dx, 162); hp(58 + dx, 160);
}

// ——— the head ———
// who: 'g' | 'j'; o: view 'q'|'front', expr, E overrides, look, open, mouth, body (true), ph (wind phase), wind, light [lx,ly]
export function head(g, PAL, who, o = {}) {
  const P = { ...PAL, skin: who === 'g' ? PAL.gskin : PAL.jskin, hair: who === 'g' ? PAL.ghair : PAL.jhair, lash: who === 'g' ? '#3a1e26' : PAL.lash };
  if (who === 'j') P.browCol = PAL.jhair.l;
  else P.browCol = mix(PAL.ghair.l, '#3a1e26', .4);
  const ep = who === 'g' ? PAL.geye : PAL.jeye;
  const view = o.view || 'q', V = FACE[who][view];
  const E = { ...EXPR[o.expr || 'neutral'], ...(o.E || {}) };
  if (o.look) E.look = o.look; if (o.open != null) E.open = o.open; if (o.mouth) E.mouth = o.mouth; if (o.lid != null) E.lid = o.lid;
  if (who === 'j' && E.circles == null) E.circles = o.circles ?? 0;
  const old = who === 'g', hair = who === 'g' ? hairG : hairJ;
  const lx = o.light?.[0] ?? -1, ly = o.light?.[1] ?? -.8;
  hair(g, P, view, 'back', o);
  if (o.body !== false) (who === 'g' ? bodyG : bodyJ)(g, P, view, E);
  cel(g, poly(V.neck), { f: P.skin.f, s: P.skin.s, l: P.skin.l, lw: LS, sh: [V.chinShadow] });
  if (who === 'j' && o.body !== false) { line(g, [[-56, 158], [0, 196], [56, 158]], P.phone.f, 6); }
  if (V.ear) { const [ex, ey] = V.ear; cel(g, [[ex + 6, ey - 18], [ex - 8, ey - 16], [ex - 12, ey + 4], [ex - 4, ey + 20], [ex + 8, ey + 16]], { f: P.skin.f, s: P.skin.s, sh: [[[ex - 2, ey - 10], [ex - 6, ey + 2], [ex, ey + 12], [ex + 4, ey]]], l: P.skin.l, lw: LS }); }
  cel(g, V.face, { f: P.skin.f, s: P.skin.s, l: P.skin.l, lw: LS, h: P.skin.h, sh: o.light ? [] : [V.farShade], so: o.light ? [lx * 12, ly * 12] : null,
    rim: o.rim ? { c: o.rim, d: [-lx * 2.5, -ly * 2] } : null });
  for (const [x, y, rx, ry] of V.blush) { g.fillStyle = rgba(PAL.blush, o.blush ?? (old ? .22 : .12)); g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); }
  // nose: shadow plane + a stroke
  g.fillStyle = P.skin.s; g.beginPath(); V.nose.forEach((p, i) => g[i ? 'lineTo' : 'moveTo'](p[0], p[1])); g.closePath(); g.fill();
  const nb = V.nose[2]; line(g, [[nb[0] - 1, nb[1] + .5], [nb[0] + 5, nb[1] - 1.5]], P.skin.l, LS);
  if (old) {          // age: nasolabial folds, two faint forehead lines
    const m = V.mouth; line(g, [[V.nose[0][0] - 14, V.nose[2][1] + 4], [m.x - m.w * .6, m.y - 4]], mix(P.skin.l, P.skin.f, .45), LS * .75);
    if (view === 'front') line(g, [[V.nose[0][0] + 14, V.nose[2][1] + 2], [m.x + m.w * .62, m.y + 2]], mix(P.skin.l, P.skin.f, .45), LS * .75);
    for (let k = 0; k < 2; k++) line(g, [[-30, -24 + k * 9], [0, -28 + k * 9], [30, -24 + k * 9]], mix(P.skin.l, P.skin.f, .6), LS * .6);
  }
  mouth(g, P, V.mouth.x, V.mouth.y, V.mouth.w, E.mouth, V.mouth.fs);
  for (const ey of V.eyes) eye(g, P, ep, ey.x, ey.y, ey.w, ey.h, ey.dir, ey.fs, E, old);
  hair(g, P, view, 'front', o);
  for (const b of V.brows) brow(g, P, b[0], b[1], b[2], b[3], E.brow || [0, 0, 2], who === 'j' ? 1.4 : 1.1);
  if (E.sweat) { const sx = view === 'q' ? -56 : -60; cel(g, [[sx, -12, 1], [sx + 7, 4], [sx, 10], [sx - 7, 4]], { f: '#e8f8ff', l: '#4a6a98', lw: LS, h: '#ffffff', hi: [[[sx - 3, 2], [sx - 1, -2], [sx - 4, 6]]] }); }
}
