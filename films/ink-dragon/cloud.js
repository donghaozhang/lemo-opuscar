// 云: the stubborn sleeping cloud. A soft pale mass (清 → 淡) made of overlapping lumps with jittered edges, a loaded stroke along its underside for weight,
// a face in four strokes (two closed lids, brows, a mouth). `ink` 0..1 is the dragon's ink spreading inside it: a dark core grows from the entry
// point with tide-lines (edge pigment) and the whole mass darkens through the tones. When awake the eyes open (paper holes with ink pupils).
import { mk, draw, mass, blot, TONE } from './ink.js';
import { ripple } from './land.js';
import { lerp, clamp, vnoise, rot, add2, mid } from './util.js';
import { mulberry } from '/core/lib.js';

export const CEXPR = {
  asleep: { lid: 1, brow: 0, mouth: 0, open: 0 },
  mumble: { lid: 1, brow: -.15, mouth: .3, open: 0 },
  peek: { lid: .55, brow: .3, mouth: .1, open: .5 },      // one eye half open
  annoyed: { lid: .4, brow: .5, mouth: .2, open: 1 },
  blow: { lid: .8, brow: .4, mouth: 1, open: 1 },
  shocked: { lid: 0, brow: -.6, mouth: .6, open: 1 },
  sad: { lid: .3, brow: -.4, mouth: .35, open: 1 },
  heavy: { lid: .6, brow: -.2, mouth: .4, open: 1 },
};
export const mixC = (a, b, u) => { const o = {}; for (const k in a) o[k] = lerp(a[k], b[k], clamp(u)); return o; };

// S: {x, y, r (base radius), breath (-1..1), ink 0..1, inkAt [x, y] (entry point, local), expr, squash, lean (radians), tug (wisp pulled: [dx, dy, k]), puffTo [dir] }
export function cloud(A, S, X = {}) {
  const L = A.ink, x = S.x, y = S.y, r = S.r, am = X.am ?? 1, t = X.t ?? 0;
  const br = 1 + .035 * (S.breath ?? 0), sq = S.squash ?? 1, lean = S.lean ?? 0;
  const T = p => rot([x + p[0] * br, y + p[1] * br * sq], [x, y], lean);
  const ink = clamp(S.ink ?? 0);
  // lumps: a wide base and five bumps on top; a sleeping cloud is a loaf
  const lumps = [[0, .12, 1.3, .62], [-.72, -.2, .62, .55], [-.25, -.42, .7, .6], [.3, -.4, .66, .58], [.78, -.15, .58, .5], [-1.05, .15, .42, .4], [1.08, .18, .42, .38]];
  const tone0 = lerp(.14, .5, ink), tone1 = lerp(.2, .62, ink);
  // silhouette: the union of the lumps as one radial outline (so no lump edge shows inside), with a vertical gradient (paler on top)
  const union = (scale) => { const poly = [], n = 72; for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a); let best = 0; for (const [cx, cy, rx, ry] of lumps) { const ox = cx * r, oy = cy * r, A = (ca * ca) / (rx * rx * r * r) + (sa * sa) / (ry * ry * r * r), B = 2 * (ox * ca / (rx * rx * r * r) + oy * sa / (ry * ry * r * r)) * -1, C = (ox * ox) / (rx * rx * r * r) + (oy * oy) / (ry * ry * r * r) - 1; const D = B * B - 4 * A * C; if (D < 0) continue; const tt = (-B + Math.sqrt(D)) / (2 * A); if (tt > best) best = tt; } const rr = best * scale * (1 + .05 * vnoise(k * .7 + 3) - .025); poly.push(T([ca * rr, sa * rr])); } return poly; };
  mass(L.wet, union(1), tone0 * am, 5, 30, [T([0, -.9 * r])[0], T([0, -.9 * r])[1], T([0, .7 * r])[0], T([0, .7 * r])[1], .55, 1.3]);
  mass(L.wet, union(.78), tone1 * .5 * am, 4, 31, [T([0, -.9 * r])[0], T([0, -.9 * r])[1], T([0, .7 * r])[0], T([0, .7 * r])[1], .3, 1.2]);
  // underside: a loaded stroke, dark edge downward (weight), heavier as it fills with ink
  draw(L, mk([T([-1.25 * r, .3 * r]), T([-.6 * r, .68 * r]), T([.1 * r, .74 * r]), T([.7 * r, .66 * r]), T([1.28 * r, .34 * r])], { w: r * .22, tone: lerp(.42, .85, ink), darkDir: [0, 1], side: .85, brWet: true, body: lerp(.15, .35, ink), dry: lerp(.55, .3, ink), wet: .95, prof: 'robe', nb: 36, seed: 310, gapLen: 400 }), 1, am);
  // a few soft dry strokes suggesting the tops of the lumps (the cloud's "cun")
  for (let i = 0; i < 4; i++) { const lp = lumps[1 + i]; draw(L, mk([T([(lp[0] - lp[2] * .7) * r, (lp[1] - lp[3] * .3) * r]), T([lp[0] * r, (lp[1] - lp[3] * .95) * r]), T([(lp[0] + lp[2] * .7) * r, (lp[1] - lp[3] * .3) * r])], { w: r * .07, tone: lerp(.28, .55, ink), dry: .62, wet: .5, prof: 'lens', seed: 320 + i, gapLen: 300 }), 1, am * .8); }
  // the dragon's ink spreading inside: a dark core with tide-lines, from the entry point
  if (ink > 0) {
    const e = S.inkAt || [0, -.3];
    const Rk = ink * r * 1.5;
    for (let ring = 0; ring < 4; ring++) {
      const rr = Rk * (1 - ring * .22), a = (.22 + ring * .16) * clamp(ink * 1.5);
      const poly = []; for (let k = 0; k < 30; k++) { const an = k / 30 * Math.PI * 2, n2 = 1 + .22 * vnoise(ring * 13 + k * .9) - .11; poly.push(T([e[0] * r + Math.cos(an) * rr * n2, e[1] * r + Math.sin(an) * rr * n2 * .8])); }
      mass(L.wet, poly, a * am, 3, 340 + ring);
    }
    // the tide-line at the front of the ink: an open ring in the dry layer
    const poly = []; for (let k = 0; k <= 30; k++) { const an = k / 30 * Math.PI * 1.9 + .3, n2 = 1 + .22 * vnoise(k * .9) - .11; poly.push(T([e[0] * r + Math.cos(an) * Rk * n2, e[1] * r + Math.sin(an) * Rk * n2 * .8])); }
    draw(L, mk(poly, { w: r * .05, tone: .6 * clamp(ink * 2), dry: .55, wet: .5, prof: 'brush', seed: 350, gapLen: 500 }), 1, am * clamp(1.2 - ink));
  }
  // the face: on the front-right of the loaf (the dragon comes from the right)
  const E = S.expr || CEXPR.asleep, fx = .55 * r, fy = -.12 * r;
  const eyeR = r * (.085 + .03 * (E.open > .5 && E.lid < .2 ? 1 : 0) + .05 * clamp(ink * 1.5) * (E.open > .5 ? 1 : 0)), ex1 = fx + .12 * r, ex2 = fx - .22 * r, ey = fy;
  const lidAt = (cx, lid, open) => {
    // closed: one downward arc (a sleeping lid); open: a paper hole with an ink pupil, the lid covering `lid` of it
    if (open < .5 || lid > .92) { draw(L, mk([T([cx - eyeR * 1.3, ey]), T([cx, ey + eyeR * .9 * (1 - (E.mouth > .9 ? .6 : 0))]), T([cx + eyeR * 1.3, ey])], { w: r * .028, tone: .82, dry: .4, wet: .2, prof: 'tip', seed: 360 + cx }), 1, am); return; }
    const c = T([cx, ey]);
    for (const k of ['wet', 'dry']) { const g = L[k]; g.save(); g.globalCompositeOperation = 'destination-out'; g.globalAlpha = .9; g.beginPath(); g.ellipse(c[0], c[1], eyeR, eyeR * .8, lean, 0, 7); g.fill(); g.restore(); }
    const ly = -eyeR * .8 + 2 * eyeR * .8 * lid;
    L.dry.save(); L.dry.translate(c[0], c[1]); L.dry.rotate(lean); L.dry.beginPath(); L.dry.ellipse(0, 0, eyeR, eyeR * .8, 0, 0, 7); L.dry.clip(); L.dry.fillStyle = `rgba(0,0,0,${.7 * am})`; L.dry.fillRect(-eyeR - 1, -eyeR, 2 * eyeR + 2, ly + eyeR); L.dry.restore();
    blot(L.dry, c[0] + (S.look?.[0] || 0) * eyeR * .35, c[1] + eyeR * .12 + (S.look?.[1] || 0) * eyeR * .3, eyeR * .36, .95 * am, 0, 1, 370);
    draw(L, mk([T([cx - eyeR * 1.2, ey + ly * .9]), T([cx + eyeR * 1.2, ey + ly * .9])], { w: r * .024, tone: .85, dry: .4, prof: 'tip', seed: 365 + cx }), 1, am);
  };
  lidAt(ex1, E.lid, E.open); lidAt(ex2, Math.min(1, E.lid + (E.open < 1 ? .5 : 0)), E.open);     // the far eye opens later (peek = one eye)
  // brows: angle = mood
  for (const [cx, sg] of [[ex1, 1], [ex2, -1]]) draw(L, mk([T(rot([cx - eyeR * 1.4, ey - eyeR * 1.7], [cx, ey - eyeR * 1.7], E.brow * .6 * sg)), T(rot([cx + eyeR * 1.4, ey - eyeR * 1.7], [cx, ey - eyeR * 1.7], E.brow * .6 * sg))], { w: r * .032, tone: .7, dry: .5, wet: .2, prof: 'lens', seed: 380 + cx }), 1, am);
  // mouth: a small line, opens into a round "o" (blow) or a wavy mumble
  const mx = fx - .02 * r, my = fy + .24 * r, mo = E.mouth;
  if (mo < .25) draw(L, mk([T([mx - r * .1, my]), T([mx, my + r * .02 * (1 - mo * 4)]), T([mx + r * .1, my])], { w: r * .025, tone: .75, dry: .45, prof: 'tip', seed: 390 }), 1, am);
  else { const poly = []; for (let k = 0; k <= 16; k++) { const a = k / 16 * Math.PI * 2; poly.push(T([mx + Math.cos(a) * r * .07 * mo, my + Math.sin(a) * r * .09 * mo])); } draw(L, mk(poly, { w: r * .025, tone: .8, dry: .4, wet: .2, prof: 'even', seed: 391 }), 1, am); mass(L.wet, poly, .5 * am, 1, 392); }
  // the snore bubble at the nose: grows with the breath and pops
  if (S.bubble > 0) { const bx = T([fx + .3 * r, fy + .1 * r]), rb = r * .09 * S.bubble; const poly = []; for (let k = 0; k <= 20; k++) { const a = k / 20 * Math.PI * 1.85; poly.push([bx[0] + Math.cos(a) * rb, bx[1] + Math.sin(a) * rb]); } draw(L, mk(poly, { w: r * .018, tone: .5, dry: .5, wet: .3, prof: 'brush', seed: 395 }), 1, am * (S.bubbleA ?? 1)); }
  // a wisp pulled out by the dragon: a thin pale tongue of cloud towards (dx, dy)
  if (S.tug && S.tug[2] > 0) { const [dx, dy, k] = S.tug, b = T([1.1 * r, .25 * r]); const poly = [b, [b[0] + dx * .5 * k, b[1] + dy * .5 * k - r * .06 * k], [b[0] + dx * k, b[1] + dy * k], [b[0] + dx * .5 * k, b[1] + dy * .5 * k + r * .08 * k]]; mass(L.wet, poly, .42 * am, 3, 398); draw(L, mk([b, [b[0] + dx * .5 * k, b[1] + dy * .5 * k], [b[0] + dx * k, b[1] + dy * k]], { w: r * .09 * (1 - k * .4), tone: .5, dry: .55, wet: .7, prof: 'tip', seed: 399 }), 1, am); }
  // a gust: dry streaks out of the mouth
  if (S.gust > 0) { const g = S.gust, m = T([mx + r * .1, my]); for (let i = 0; i < 7; i++) { const sp = (i - 3) * .09, L2 = r * (1.2 + .5 * vnoise(i)) * g; draw(L, mk([m, [m[0] + Math.cos(sp) * L2 * .5, m[1] + Math.sin(sp) * L2 * .5 + Math.sin(i * 2 + t * 20) * 4], [m[0] + Math.cos(sp) * L2, m[1] + Math.sin(sp) * L2]], { w: r * .03, tone: .45 * g, dry: .72, wet: .05, prof: 'tip', seed: 400 + i }), 1, am); } }
  // falling drops from the underside (the rain begins)
  if (S.drops > 0) { const R = mulberry(27); for (let i = 0; i < 14; i++) { if (R() > S.drops) continue; const bx = x + (R() - .5) * 2.2 * r, by = y + .72 * r + ((R() * 200 + t * 420) % 260) * (.5 + S.drops); draw(L, mk([[bx, by - 10], [bx, by + 10]], { w: 4, tone: .55, dry: .4, wet: .5, prof: 'lens', seed: 410 + i }), 1, am); } }
  return { face: T([fx, fy]), mouth: T([mx, my]), wisp: T([1.1 * r, .25 * r]), top: T([0, -.9 * r]) };
}
