// Full figures for wide and medium shots: heads from heads.js on cel bodies with sloped shoulders, rounded joints and
// mitten hands. Local origin: between the feet (sit: the seat point at y = 0 under the hips).
// who 'g' (外婆 ≈5.4 heads, round-shouldered, a little stoop) | 'j' (阿杰 ≈6.6 heads, lanky).
// o: pose 'stand'|'walk'|'sit', ph (walk phase), armL/armR [shoulder, elbow] (radians from straight down; + swings the hand
// toward screen right), expr, view, look, lean, hold(g, handR, handL) drawn last, rim. Returns hand points (local units).
import { cel, path, poly, line, TAU, mix } from './cel.js';
import { head } from './heads.js';
function limb(g, a, b, w0, w1, c, rim) {
  const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d;
  cel(g, path([[a[0] + nx * w0, a[1] + ny * w0], [(a[0] + b[0]) / 2 + nx * (w0 + w1) * .52, (a[1] + b[1]) / 2 + ny * (w0 + w1) * .52], [b[0] + nx * w1, b[1] + ny * w1, 1], [b[0] - nx * w1, b[1] - ny * w1, 1],
    [(a[0] + b[0]) / 2 - nx * (w0 + w1) * .52, (a[1] + b[1]) / 2 - ny * (w0 + w1) * .52], [a[0] - nx * w0, a[1] - ny * w0]]), { f: c.f, s: c.s, so: [-7, -5], h: c.h, l: c.l, lw: 2.2, rim });
}
function joint(g, p, r, c) { const J = new Path2D(); J.arc(p[0], p[1], r, 0, TAU); cel(g, J, { f: c.f, s: c.s, so: [-4, -4], l: c.l, lw: 2 }); }
function mitten(g, p, ang, skin) {
  g.save(); g.translate(p[0], p[1]); g.rotate(ang);
  cel(g, path([[-16, -6], [-18, 14], [-10, 30], [8, 30], [16, 14], [14, -6]]), { f: skin.f, s: skin.s, so: [-3, -3], l: skin.l, lw: 1.8 });
  cel(g, path([[12, 0], [24, 6], [24, 16], [14, 14]]), { f: skin.f, l: skin.l, lw: 1.6 });
  g.restore();
}
export function figure(g, PAL, who, o = {}) {
  const G = who === 'g', P = PAL;
  const skin = G ? P.gskin : P.jskin, top = G ? P.gjacket : P.hoodie, legs = P.gpants;
  const ph = o.ph ?? 0, walk = o.pose === 'walk', sit = o.pose === 'sit';
  const legLen = G ? 430 : 540, torsoH = G ? 300 : 360, tw = G ? 132 : 118;
  const hipY = sit ? -40 : -legLen, bob = walk ? -Math.abs(Math.sin(ph * TAU)) * 12 : 0;
  g.save(); g.translate(0, bob);
  // legs (far first)
  for (const k of [1, -1]) {
    const sw = walk ? Math.sin(ph * TAU + (k > 0 ? 0 : Math.PI)) * .3 : 0;
    const hx = k * (G ? 50 : 42), hip = [hx, hipY];
    let kn, ft;
    if (sit) { kn = [hx + 230, hipY - 6]; ft = [kn[0] + 30 * (k > 0 ? 1 : .6), kn[1] + 210]; }
    else { kn = [hx + Math.sin(sw) * legLen * .5, hipY + Math.cos(sw) * legLen * .5]; const s2 = sw - (walk && sw < 0 ? .5 : 0); ft = [kn[0] + Math.sin(s2) * legLen * .5, kn[1] + Math.cos(s2) * legLen * .5]; }
    const c = k > 0 ? { ...legs, f: mix(legs.f, legs.s, .35) } : legs;
    limb(g, hip, kn, G ? 52 : 46, G ? 42 : 38, c); limb(g, kn, ft, G ? 42 : 38, G ? 32 : 30, c);
    cel(g, path([[ft[0] - 30, ft[1] - 22], [ft[0] + 40, ft[1] - 20], [ft[0] + 62, ft[1] - 4, 1], [ft[0] + 60, ft[1] + 6, 1], [ft[0] - 34, ft[1] + 6, 1]]), { f: G ? '#4a2e34' : '#eceaf2', s: G ? '#2a181e' : '#aaa8ba', so: [-3, -3], l: '#1a0e12', lw: 2 });
  }
  // torso: sloped shoulders, a slight stoop for 外婆, jacket hem flaring over the hips
  const lean = o.lean ?? (G ? .06 : 0);
  g.save(); g.translate(0, hipY); g.rotate(lean); g.translate(0, -hipY);
  const shY = hipY - torsoH, neck = [0, shY - 10];
  const T = [[-34, shY - 12], [-tw * .78, shY + 4], [-tw, shY + 42], [-tw * .96, hipY - 40], [-tw * 1.06, hipY + (G ? 70 : 40), 1], [tw * 1.06, hipY + (G ? 70 : 40), 1], [tw * .96, hipY - 40], [tw, shY + 42], [tw * .78, shY + 4], [34, shY - 12]];
  // far arm behind the torso
  const hands = {};
  const drawArm = (k, A) => {
    const s0 = [k * (tw - 18), shY + 40], L = G ? 175 : 210;
    const el = [s0[0] + Math.sin(A[0]) * L, s0[1] + Math.cos(A[0]) * L], hd = [el[0] + Math.sin(A[0] + A[1]) * L * .95, el[1] + Math.cos(A[0] + A[1]) * L * .95];
    limb(g, s0, el, G ? 40 : 36, G ? 34 : 30, top, o.rim); joint(g, el, G ? 33 : 29, top); limb(g, el, hd, G ? 34 : 30, G ? 30 : 26, top, o.rim);
    mitten(g, hd, -(A[0] + A[1]), skin);
    hands[k < 0 ? 'L' : 'R'] = hd;
  };
  drawArm(1, o.armR ?? [-.12, .15]);
  cel(g, path(T), { f: top.f, s: top.s, so: [-22, -8], h: top.h, ho: [8, 6], l: top.l, lw: 2.6, rim: o.rim, clipFn: gg => {
    if (G) { gg.strokeStyle = mix(top.l, top.f, .55); gg.lineWidth = 2; for (let k = 1; k < 7; k++) { gg.beginPath(); gg.moveTo(-tw * 1.1, shY + k * 46); gg.quadraticCurveTo(0, shY + k * 46 + 14, tw * 1.1, shY + k * 46); gg.stroke(); } }
    else { gg.strokeStyle = top.l; gg.lineWidth = 2; gg.beginPath(); gg.moveTo(-tw * .9, hipY - 10); gg.lineTo(tw * .9, hipY - 10); gg.stroke(); gg.fillStyle = top.s; gg.fillRect(-60, hipY - 120, 120, 70); } } });
  if (G) { cel(g, path([[-30, shY - 10], [0, shY + 40], [30, shY - 10], [22, shY - 22], [0, shY + 6], [-22, shY - 22]]), { f: P.gshirt.f, l: P.gshirt.l, lw: 2 }); line(g, [[0, shY + 40], [4, hipY + 60]], top.l, 2); }
  else { cel(g, path([[-70, shY + 10], [-50, shY - 20], [0, shY - 8], [50, shY - 20], [70, shY + 10], [36, shY + 40], [0, shY + 30], [-36, shY + 40]]), { f: top.f, s: top.s, so: [-4, -6], h: top.h, l: top.l, lw: 2 }); }
  // head
  g.save(); g.translate(G ? 6 : 0, shY - (G ? 118 : 140)); const hs = G ? 1.06 : 1.0; g.scale(hs, hs);
  head(g, PAL, who, { view: o.view || 'q', expr: o.expr || 'neutral', look: o.look, body: false, circles: o.circles, rim: o.rimHead, E: o.E, glasses: o.glasses, young: o.young, hardhat: o.hardhat });
  g.restore();
  if (!G) { const hp = (x, y) => { const c = new Path2D(); c.ellipse(x, y, 20, 24, .2, 0, TAU); cel(g, c, { f: P.phone.f, s: P.phone.s, so: [-3, -3], l: '#08080c', lw: 2 }); }; line(g, [[-50, shY + 4], [0, shY + 34], [50, shY + 4]], P.phone.f, 6); hp(-56, shY + 6); hp(54, shY + 4); }
  drawArm(-1, o.armL ?? [.12, -.15]);
  if (o.hold) o.hold(g, hands.R, hands.L);
  g.restore();
  g.restore();
  return hands;
}
