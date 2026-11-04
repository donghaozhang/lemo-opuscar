// 愚公移山 · close-up heads (three-quarter view, turned toward +x), built for 500–900 px tall faces.
// Skin is carved white with black hatching only on the shadow side; eyes, brows, mouth and wrinkles are black wood
// left standing, drawn per frame from a continuous expression so they can act (blink, squint, look, laugh).
//   drawFace(g, M, who, expr, t)   M: matrix placing the face centre; 1 unit = head half-height of 300 px
import * as WC from './engine/index.js';
import * as INK from './ink.js';
import { put, mul, T, R, S, about } from './rig.js';
import { clamp, lerp, mulberry } from '/core/lib.js';

const U = 300, PI = Math.PI;
const L_FACE = WC.light(-.62, -.5, .6);                  // key from upper left: the far cheek (right) falls into shadow
const sc = (P, k = U) => P.map(([x, y]) => [x * k, y * k]);
const cache = {};
function shp(key, polys, o) { return cache[key] || (cache[key] = WC.shape(polys, o)); }
function strokes(key, fn) { return cache[key] || (cache[key] = fn()); }

// expression fields: bin (inner brow, + up / − down), bout (outer brow), open (eye, 0..1.2), squint (lower lid up),
// look [x,y], smile (−1..1 mouth corners), jaw (0..1), mw (mouth width ×), teeth, happy (closed-eye arcs), cheek
export const FX = {
  yugong: {
    weary: { bin: .5, bout: -.3, open: .55, squint: .1, look: [0, .35], smile: -.5, jaw: 0, mw: .9 },
    resolve: { bin: -1, bout: .3, open: .62, squint: .45, look: [.1, 0], smile: -.35, jaw: 0, mw: .85 },
    laugh: { bin: .3, bout: -.2, open: 0, happy: 1, squint: .6, smile: 1, jaw: .7, mw: 1.2, cheek: 1 },
    warm: { bin: .2, bout: -.1, open: .5, squint: .5, smile: .8, jaw: .1, mw: 1.05, cheek: .6, look: [-.4, .25] },
    exhale: { bin: .55, bout: -.25, open: .35, squint: .1, look: [0, .5], smile: -.2, jaw: .12, mw: .8 },
    calm: { bin: .05, bout: .05, open: .95, squint: .15, look: [-.1, -.05], smile: 0, jaw: 0, mw: .85 },
    serene: { bin: .25, bout: -.1, open: 0, happy: .7, squint: .3, smile: .7, jaw: 0, mw: 1.0, cheek: .5 },
  },
  boy: {
    grin: { bin: .35, bout: .1, open: 1.05, squint: .15, look: [-.2, -.1], smile: 1, jaw: .55, mw: 1.15, teeth: 1, cheek: .8 },
    pout: { bin: -1, bout: .45, open: .9, squint: .2, look: [.45, 0], smile: -.7, jaw: 0, mw: .55, pout: 1 },
    wonder: { bin: .8, bout: .4, open: 1.2, squint: 0, look: [.3, -.25], smile: 0, jaw: .45, mw: .45 },
    happy: { bin: .3, bout: 0, open: 0, happy: 1, squint: .5, smile: 1, jaw: .4, mw: 1.1, teeth: 1, cheek: 1 },
  },
  zhisou: {
    smug: { bin: -.2, bout: .7, open: .55, squint: .3, look: [.35, .15], smile: .55, jaw: 0, mw: 1.0, asym: 1 },
    laugh: { bin: .1, bout: .3, open: 0, happy: 1, squint: .7, smile: 1, jaw: 1, mw: 1.25, cheek: 1 },
    fading: { bin: .15, bout: .2, open: .8, squint: .1, look: [.3, .1], smile: .05, jaw: .08, mw: .95 },
    speechless: { bin: 1, bout: .7, open: 1.2, squint: 0, look: [.6, -.3], smile: -.2, jaw: 1, mw: .7 },
  },
};
export function fblend(a, b, u) { const o = { ...a }; for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) { const x = a[k] ?? 0, y = b[k] ?? 0; o[k] = Array.isArray(x) || Array.isArray(y) ? [lerp((x || [0, 0])[0], (y || [0, 0])[0], u), lerp((x || [0, 0])[1], (y || [0, 0])[1], u)] : lerp(x, y, u); } return o; }

// ---------------------------------------------------------------- shared geometry (units of U)
const SPEC = {
  yugong: { headP: [[-.08, -1.0], [.36, -.92], [.6, -.66], [.7, -.3], [.74, .02], [.7, .32], [.56, .6], [.36, .8], [.08, .86], [-.3, .74], [-.56, .5], [-.7, .16], [-.78, -.3], [-.62, -.74]],
    eyeN: [-.16, -.1], eyeF: [.38, -.1], ew: .3, nose: [[.2, -.3], [.3, .06], [.4, .2], [.32, .28], [.18, .26]], mouth: [.14, .5], ear: [-.7, .02] },
  boy: { headP: [[-.06, -.98], [.42, -.88], [.7, -.56], [.82, -.12], [.8, .3], [.62, .64], [.3, .86], [-.06, .9], [-.42, .76], [-.7, .46], [-.84, .02], [-.8, -.46], [-.52, -.84]],
    eyeN: [-.2, .02], eyeF: [.44, .02], ew: .36, nose: [[.22, .04], [.3, .22], [.36, .3], [.26, .36], [.14, .32]], mouth: [.14, .56], ear: [-.8, .08] },
  zhisou: { headP: [[-.06, -1.0], [.34, -.94], [.56, -.66], [.62, -.3], [.64, .06], [.6, .42], [.48, .76], [.3, 1.02], [.1, 1.1], [-.2, .96], [-.46, .62], [-.6, .2], [-.68, -.3], [-.52, -.78]],
    eyeN: [-.12, -.12], eyeF: [.38, -.12], ew: .27, nose: [[.2, -.34], [.32, .1], [.46, .3], [.34, .38], [.2, .36]], mouth: [.16, .62], ear: [-.62, 0] },
};

function headShape(who) {
  const sp = SPEC[who];
  return shp(who + '.head', [sc(WC.spline(sp.headP, .02, true))], { white: true, light: L_FACE, R: 120, sp: 9, wmax: 7, lo: .5, hi: .98, amb: .22, k: 1.0, halo: 9, seed: 31, dir: 'contour', depth: 80, seg: [40, 160], gap: [6, 20], res: 3 });
}
// head silhouettes for the hair/hat/beard pieces
function extras(who) {
  return cache[who + '.x'] || (cache[who + '.x'] = (() => {
    const X = [];
    if (who === 'yugong') {
      // white side hair (behind the ear) with black strands, a black topknot and a white pin
      X.push({ s: WC.shape([sc(WC.spline([[-.64, -.66], [-.82, -.34], [-.86, .1], [-.78, .46], [-.66, .58], [-.66, .26], [-.72, -.06], [-.66, -.4]], .02, true))], { white: true, light: L_FACE, R: 40, sp: 9, lo: .6, amb: .2, halo: 6, seed: 33, dir: PI / 2 + .5, res: 3 }),
        lines: [[[-.66, -.6], [-.8, -.2], [-.78, .3]], [[-.72, -.5], [-.86, 0], [-.74, .5]]] });
      X.push({ s: WC.shape([sc(WC.spline([[-.3, -.9], [-.22, -1.24], [.08, -1.3], [.22, -1.06], [.08, -.94]], .02, true))], { light: L_FACE, R: 30, sp: 8, lo: .45, halo: 7, seed: 34, res: 3 }), pin: [[-.52, -1.06], [.46, -1.2]] });
    }
    if (who === 'boy') {
      // black hair cap and two buns
      X.push({ s: WC.shape([sc(WC.spline([[-.84, .1], [-.86, -.5], [-.5, -.96], [.08, -1.04], [.56, -.84], [.74, -.5], [.52, -.52], [.3, -.66], [0, -.6], [-.3, -.46], [-.52, -.16], [-.6, .2]], .02, true))], { light: L_FACE, R: 60, sp: 10, lo: .62, k: .9, halo: 8, seed: 35, dir: 'contour', res: 3 }) });
      for (const [cx, cy] of [[-.62, -.98], [.28, -1.12]]) X.push({ s: WC.shape([sc(WC.ellipse(cx, cy, .26, .24, 24))], { light: L_FACE, R: 40, sp: 8, lo: .4, halo: 8, seed: 36 + cx * 10 | 0, dir: WC.dirRing(cx * U, cy * U), res: 3 }), back: true });
    }
    if (who === 'zhisou') {
      // tall black scholar's cap with a white band line
      X.push({ s: WC.shape([sc([[-.6, -.6], [-.66, -1.95], [.5, -2.05], [.58, -.66], [.3, -.72], [-.1, -.7]])], { light: L_FACE, R: 60, sp: 11, lo: .66, k: .85, halo: 9, seed: 37, a0: PI / 2, res: 3 }), lines: [[[-.62, -.86], [.56, -.92]], [[-.64, -1.4], [.54, -1.48]]] });
    }
    return X;
  })());
}

// the old man's beard: a white mass with black strands, from the cheeks down past the frame
function beard() {
  return cache.beard || (cache.beard = (() => {
    const P = sc(WC.spline([[-.5, .2], [-.42, .62], [-.3, 1.2], [-.1, 1.9], [.12, 2.5], [.28, 2.0], [.5, 1.3], [.66, .7], [.7, .28], [.56, .46], [.36, .62], [.16, .66], [-.06, .6], [-.3, .4]], .02, true));
    const s = WC.shape([P], { white: true, light: WC.light(-.5, -.3, .7), R: 50, sp: 10, lo: .6, amb: .25, halo: 8, seed: 38, dir: PI / 2 + .1, res: 3 });
    const rnd = mulberry(5), lines = [];
    for (let i = 0; i < 14; i++) { const x0 = -.42 + i * .085 + (rnd() - .5) * .03, y0 = .56 + Math.abs(i - 6.5) * .02; lines.push(sc([[x0, y0], [x0 + .04 + (rnd() - .5) * .06, y0 + .5], [x0 * .55 + .1 + (rnd() - .5) * .05, y0 + 1.05 + rnd() * .3]])); }
    return { s, lines };
  })());
}

// ---------------------------------------------------------------- draw
export function drawFace(g, M, who, e, t = 1e9, o = {}) {
  const sp = SPEC[who], X = extras(who), H = headShape(who);
  put(g, M, () => {
    // halos of everything first (one silhouette)
    for (const x of X) if (x.back) WC.drawStrokes(g, x.s.halo, { t, color: '#fff' });
    WC.drawStrokes(g, H.halo, { t, color: '#fff' });
    for (const x of X) if (!x.back) WC.drawStrokes(g, x.s.halo, { t, color: '#fff' });
    if (who === 'yugong') WC.drawStrokes(g, beard().s.halo, { t, color: '#fff' });
    for (const x of X) if (x.back) x.s.draw(g, t);
    WC.fillPoly(g, H.polys, '#fff'); WC.drawStrokes(g, H.strokes, { t, color: '#000' });
    // keep-line: a black knife line just inside the head edge
    const kl = strokes(who + '.kl', () => WC.cutAlong(WC.offsetPoly(H.polys[0], -3), { closed: true, w: 5, kind: 'k', seg: [80, 260], gap: [0, 2], seed: 41 }));
    WC.drawStrokes(g, kl, { t, color: '#000' });
    // ear
    const [ex, ey] = sp.ear;
    INK.taper(g, sc([[ex + .08, ey - .14], [ex - .04, ey - .1], [ex - .05, ey + .1], [ex + .06, ey + .16]]), 9, '#000', { a: .2, b: .2 });
    INK.taper(g, sc([[ex + .04, ey - .06], [ex + .0, ey + .04], [ex + .05, ey + .08]]), 5, '#000');
    features(g, who, e, sp);
    for (const x of X) if (!x.back) {
      x.s.draw(g, t);
      if (x.lines) for (const l of x.lines) INK.taper(g, sc(l), 5, x.s === X[0].s && who === 'yugong' ? '#000' : '#fff', { a: .15, b: .2 });
      if (x.pin) INK.taper(g, sc(x.pin), 10, '#fff', { a: .1, b: .1 });
    }
    if (who === 'yugong') drawBeard(g, e, t);
    if (who === 'zhisou') zhisouHair(g, e);
  });
}

function features(g, who, e, sp) {
  const open = e.open ?? .9, look = e.look || [0, 0], squint = e.squint ?? 0, happy = e.happy ?? 0, cheek = e.cheek ?? 0;
  const bin = e.bin ?? 0, bout = e.bout ?? 0, asym = e.asym ?? 0;
  const old = who !== 'boy';
  // ---- eyes: near (left, bigger) and far (right, foreshortened)
  for (const [k, [cx, cy], wf] of [[0, sp.eyeN, 1], [1, sp.eyeF, .78]]) {
    const w = sp.ew * wf * U, x = cx * U, y = cy * U - cheek * .02 * U;
    if (open < .06 || happy > .5) {
      // closed: a happy arch (laughing / serene) or a flat lid line
      const arch = happy > .5 ? -.12 : .05;
      INK.taper(g, [[x - w * .55, y + w * .05], [x, y + arch * w * 1.6], [x + w * .55, y + w * .02]], Math.max(6, w * .12), '#000', { a: .2, b: .25 });
      if (old) INK.taper(g, [[x + w * .55, y], [x + w * .8, y - w * .12]], 4, '#000');
    } else {
      INK.eye(g, x, y, w, { open: Math.min(1.25, open) * (1 - squint * .35), prof: 0, lookX: look[0], lookY: look[1], lid: 1.4, iris: who === 'boy' ? .62 : .52 });
      // lower lid raised by squint / cheek
      if (squint > .2) INK.taper(g, [[x - w * .45, y + w * .16], [x, y + w * (.2 - squint * .08)], [x + w * .45, y + w * .14]], 4 + squint * 3, '#000', { a: .3, b: .3 });
    }
    // eye bags / crow's feet for the old
    if (old) {
      INK.taper(g, [[x - w * .35, y + w * .36], [x, y + w * .44], [x + w * .38, y + w * .36]], 3.5, '#000', { a: .3, b: .3 });
      const cf = k === 0 ? -1 : 1, ox = x + cf * w * .62;
      if (k === 0) for (let i = -1; i <= 1; i++) INK.taper(g, [[ox, y + i * w * .1], [ox - w * .22, y + i * w * .18 - w * .02]], 3, '#000');
    }
    // brow: inner end toward the nose (x toward the face centre between the eyes)
    const inner = k === 0 ? 1 : -1, by = y - w * (.62 + (who === 'zhisou' ? .12 : 0)) - (bin + bout) * .05 * U;
    const bi = [x + inner * w * .5, by - bin * .07 * U], bm = [x, by - w * .12 - (bin + bout) * .02 * U - (asym && k === 1 ? .05 * U : 0)], bo = [x - inner * w * .55, by - bout * .06 * U + .02 * U];
    const bw = who === 'yugong' ? .075 * U : who === 'boy' ? .05 * U : .04 * U;
    if (who === 'yugong') {   // bushy drooping brows: several strands, ends hanging past the eye
      for (let s = 0; s < 4; s++) INK.taper(g, [[bi[0], bi[1] + s * 4], [bm[0], bm[1] + s * 5], [bo[0] - inner * w * .12, bo[1] + w * .2 + s * 4]], bw * (.55 - s * .08), '#000', { a: .1, b: .5, seed: s + k * 4 });
    } else INK.taper(g, [bi, bm, bo], bw, '#000', { a: .1, b: .45, seed: k });
    // frown lines between the brows when the inner brows come down
    if (k === 0 && bin < -.4) { const mx = (sp.eyeN[0] + sp.eyeF[0]) / 2 * U; INK.taper(g, [[mx - .03 * U, by - .02 * U], [mx - .02 * U, by + .1 * U]], 5, '#000'); INK.taper(g, [[mx + .03 * U, by - .02 * U], [mx + .03 * U, by + .09 * U]], 4, '#000'); }
    if (k === 0 && bin > .5 && old) { const mx = (sp.eyeN[0] + sp.eyeF[0]) / 2 * U; for (let i = 0; i < 3; i++) INK.taper(g, [[mx - .12 * U, by - (.08 + i * .07) * U], [mx, by - (.11 + i * .07) * U], [mx + .14 * U, by - (.08 + i * .07) * U]], 4, '#000'); }
  }
  // forehead wrinkles (old)
  if (old) for (let i = 0; i < 3; i++) { const y = (-.62 - i * .08) * U - bin * .02 * U; INK.taper(g, [[-.32 * U, y + .02 * U], [.05 * U, y - .01 * U], [.4 * U, y + .03 * U]], 4, '#000', { a: .35, b: .35, seed: i }); }
  // ---- nose: a thin knife line on the lit flank, a narrow shadow wedge on the far flank, the underside and nostril
  const N = sc(sp.nose), nk = who === 'boy' ? .6 : 1;
  INK.taper(g, [[N[0][0] - .05 * U, N[0][1] + .02 * U], [N[0][0] - .02 * U * nk, (N[0][1] + N[1][1]) / 2], [N[1][0] - .05 * U * nk, N[1][1]]], 4, '#000', { a: .3, b: .3 });
  INK.poly(g, [[N[0][0] + .01 * U, N[0][1]], [N[0][0] + .04 * U, N[0][1] + .02 * U], [N[1][0] + .05 * U * nk, N[1][1] + .02 * U], [N[2][0] + .01 * U, N[2][1]], [N[1][0], N[1][1]]], '#000');
  INK.taper(g, [[N[2][0] + .01 * U, N[2][1] - .01 * U], [N[3][0], N[3][1] + .01 * U], [N[4][0], N[4][1]], [N[4][0] - .07 * U * nk, N[4][1] - .07 * U * nk]], 8 * nk + 2, '#000', { a: .2, b: .5 });
  INK.blob(g, N[3][0] - .07 * U * nk, N[3][1] - .015 * U, .028 * U * nk, .016 * U * nk, '#000', -.3);
  // naso-labial folds deepen with the smile
  const smile = e.smile ?? 0, jaw = e.jaw ?? 0, mw = (e.mw ?? 1) * (who === 'boy' ? .2 : .24) * U;
  const [mx0, my0] = sp.mouth, mx = mx0 * U, my = my0 * U + jaw * .04 * U;
  if (old || smile > .8) {
    INK.taper(g, [[mx - .22 * U, my - .3 * U], [mx - mw * 1.05 - .04 * U, my - .08 * U], [mx - mw * 1.1, my + .06 * U]], 4 + Math.max(0, smile) * 4, '#000', { a: .2, b: .4 });
    INK.taper(g, [[mx + .22 * U, my - .3 * U], [mx + mw * .9 + .04 * U, my - .1 * U]], 3 + Math.max(0, smile) * 3, '#000', { a: .2, b: .4 });
  }
  if (cheek > .3 && who === 'boy') { INK.taper(g, [[sp.eyeN[0] * U - .1 * U, .3 * U], [sp.eyeN[0] * U + .05 * U, .34 * U]], 3, '#000'); }
  // ---- mouth
  if (who === 'yugong') return;          // drawn inside the beard
  mouth(g, mx, my, mw, e, who);
}
function mouth(g, mx, my, mw, e, who) {
  const smile = e.smile ?? 0, jaw = e.jaw ?? 0, asym = e.asym ?? 0;
  const lc = [mx - mw, my - smile * .07 * U], rc = [mx + mw * .82, my - smile * .07 * U - asym * .05 * U];
  if (jaw > .08) {
    const top = my - .02 * U - Math.max(0, smile) * .02 * U, bot = my + jaw * .2 * U + .02 * U;
    const P = WC.spline([lc, [mx, top], rc, [mx + mw * .3, bot], [mx - mw * .4, bot]], 3, true);
    INK.poly(g, P, '#000');
    if (e.teeth) {   // upper teeth with the gap of a seven-year-old (始龀)
      const ty = top + .012 * U, th = .06 * U;
      for (const [a, b] of [[-.62, -.12], [.1, .55]]) INK.poly(g, [[mx + a * mw, ty], [mx + b * mw, ty - .006 * U], [mx + b * mw - .01 * U, ty + th], [mx + a * mw + .01 * U, ty + th * .9]], '#fff');
    }
    if (jaw > .4) INK.blob(g, mx, bot - .05 * U, mw * .4, .035 * U * jaw, '#fff');     // tongue catching light
  } else {
    INK.taper(g, [lc, [mx, my + smile * .03 * U + (e.pout ? .02 * U : 0)], rc], 8, '#000', { a: .15, b: .15 });
    if (e.pout) { INK.taper(g, [[mx - mw * .5, my + .06 * U], [mx, my + .1 * U], [mx + mw * .5, my + .06 * U]], 6, '#000'); }
    else INK.taper(g, [[mx - mw * .4, my + .07 * U], [mx + mw * .3, my + .07 * U]], 5, '#000');      // under-lip shadow
  }
  // chin dimple
  INK.taper(g, [[mx - .06 * U, my + .22 * U + jaw * .2 * U], [mx + .06 * U, my + .22 * U + jaw * .2 * U]], 4, '#000');
}
function drawBeard(g, e, t) {
  const B = beard(), jaw = e.jaw ?? 0, smile = e.smile ?? 0;
  // mouth opening inside the beard first (black), then moustache over it
  const mx = .14 * U, my = .5 * U;
  B.s.draw(g, t);
  for (const l of B.lines) INK.taper(g, l, 6, '#000', { a: .25, b: .4 });
  if (jaw > .06) INK.poly(g, WC.spline([[mx - .16 * U, my - smile * .04 * U], [mx, my - .02 * U], [mx + .14 * U, my - smile * .04 * U], [mx + .04 * U, my + jaw * .22 * U], [mx - .08 * U, my + jaw * .2 * U]], 3, true), '#000');
  else INK.taper(g, [[mx - .16 * U, my + .02 * U - smile * .04 * U], [mx, my + .04 * U], [mx + .14 * U, my + .02 * U - smile * .04 * U]], 7, '#000');
  // moustache: two white drooping wings with black keep-lines
  for (const s of [-1, 1]) {
    const P = sc(WC.spline([[.16, .34], [.16 + s * .18, .36 - smile * .03], [.16 + s * .32, .5 - smile * .06], [.16 + s * .36, .66 - smile * .05], [.16 + s * .2, .48], [.16, .42]], .02, true));
    INK.poly(g, P, '#fff');
    INK.taper(g, sc([[.16 + s * .02, .36], [.16 + s * .2, .4 - smile * .03], [.16 + s * .34, .62 - smile * .05]]), 4, '#000', { a: .2, b: .3 });
    INK.taper(g, sc([[.16, .43], [.16 + s * .2, .5 - smile * .03], [.16 + s * .34, .66 - smile * .05]]), 5, '#000', { a: .2, b: .3 });
  }
}
function zhisouHair(g, e) {
  const smile = e.smile ?? 0, jaw = e.jaw ?? 0;
  // thin black moustache, waxed points, and a pointed goatee
  for (const s of [-1, 1]) INK.taper(g, sc([[.16 + s * .02, .52], [.16 + s * .18, .52 - smile * .05], [.16 + s * .4, .44 - smile * .1]]), 12, '#000', { a: .1, b: .6 });
  const cy = .86 + jaw * .2;
  INK.poly(g, sc(WC.spline([[.08, cy], [.24, cy], [.2, cy + .3], [.16, cy + .6], [.12, cy + .3]], .02, true)), '#000');
}
