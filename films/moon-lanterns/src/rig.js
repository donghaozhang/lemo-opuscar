// Jointed cut-paper figures: a torso sheet, a head sheet, limb sheets anchored at the joints; rotation only (and the sheet slides).
// The face is cut: eyes with a paper pupil, lids, brow slits, a mouth; expressions are different cuts, swapped on a blink.
import { clamp, lerp, TAU, ss } from '/core/lib.js';
import { cut, piece } from './paper.js';
import { rabbit, lantern, LANTERN_COL } from './world.js';

export const EXPR = {
  neutral: { eye: 'open', brow: 0, browY: 0, mouth: 'line' },
  calm: { eye: 'open', brow: .05, browY: .02, mouth: 'smile' },
  focus: { eye: 'half', brow: -.18, browY: -.06, mouth: 'tilt', tongue: true },
  delight: { eye: 'wide', brow: .02, browY: .14, mouth: 'big' },
  worry: { eye: 'wide', brow: .5, browY: .1, mouth: 'down' },
  hope: { eye: 'wide', brow: .18, browY: .16, mouth: 'smile' },
  despair: { eye: 'sad', brow: .65, browY: -.02, mouth: 'opendown', tears: true },
  joy: { eye: 'happy', brow: .12, browY: .12, mouth: 'big', tears: true },
  stern: { eye: 'half', brow: -.3, browY: -.06, mouth: 'line' },
  alarm: { eye: 'wide', brow: .3, browY: .2, mouth: 'o' },
  relief: { eye: 'happy', brow: .1, browY: .1, mouth: 'smile' },
};
const KIND = {
  girl: { H: .075, headK: .225, buns: true, fringe: true, sleeve: 1.25, color: '#140c08' },
  mother: { H: .105, headK: .19, bun: true, apron: true, sleeve: 1.2, color: '#140c08' },
  father: { H: .11, headK: .19, cap: true, collar: true, broad: 1.25, sleeve: 1.1, color: '#140c08' },
  oldman: { H: .095, headK: .2, hat: true, bent: .25, stick: true, sleeve: 1.2, color: '#140c08' },
  boy: { H: .07, headK: .23, cap: true, sleeve: 1.3, color: '#140c08' },
  woman: { H: .1, headK: .19, bun: true, basket: true, sleeve: 1.2, color: '#140c08' },
  fisher: { H: .108, headK: .19, hat: true, broad: 1.15, sleeve: 1.1, color: '#140c08' },
  granny: { H: .092, headK: .2, scarf: true, bent: .15, sleeve: 1.3, color: '#140c08' },
};

const headCache = new Map();
// the head sheet: anchored at the neck (bottom of the face). rf = face radius
function head(kind, rf, expr, blink, ppm, color, facing) {
  const key = `${kind}|${rf.toFixed(5)}|${expr}|${blink}|${ppm}|${color}|${facing}`;
  if (headCache.has(key)) return headCache.get(key);
  const E = EXPR[expr] || EXPR.neutral, K = KIND[kind], b = blink / 3;
  const W = rf * 3.4, Hh = rf * 3.4, ax = 0, ay = -rf * 1.05;   // anchor: the neck, just under the chin
  const p = piece({
    w: W, h: Hh, ppm, color, ax, ay, name: 'head',
    draw: x => {
      // face and hair
      x.beginPath(); x.ellipse(0, 0, rf * .98, rf * 1.02, 0, 0, TAU); x.fill();
      x.beginPath(); x.moveTo(-rf * .95, -rf * .1); x.quadraticCurveTo(-rf * .6, -rf * 1.12, 0, -rf * 1.05); x.quadraticCurveTo(rf * .6, -rf * 1.12, rf * .95, -rf * .1); x.closePath(); x.fill();   // chin / jaw
      x.beginPath(); x.ellipse(0, rf * .25, rf * 1.05, rf * .9, 0, Math.PI, TAU); x.fill();   // hair cap
      if (K.buns) { for (const s of [-1, 1]) { x.beginPath(); x.arc(s * rf * .8, rf * .95, rf * .34, 0, TAU); x.fill(); cut(x, () => { x.lineWidth = rf * .05; x.beginPath(); x.arc(s * rf * .8, rf * .95, rf * .18, .3, 2.6); x.stroke(); }); } x.beginPath(); x.moveTo(-rf * .48, rf * 1.05); x.lineTo(-rf * .3, rf * 1.3); x.lineTo(-rf * .2, rf * 1.05); x.closePath(); x.fill(); }   // buns and a ribbon
      if (K.bun) { x.beginPath(); x.ellipse(-facing * rf * .85, rf * .55, rf * .4, rf * .34, 0, 0, TAU); x.fill(); x.fillRect(-facing * rf * 1.1 - rf * .03, rf * .6, rf * .06, rf * .5); }   // a low bun with a hairpin
      if (K.cap) { x.beginPath(); x.ellipse(0, rf * .55, rf * 1.1, rf * .7, 0, 0, Math.PI); x.fill(); x.fillRect(-rf * .3, rf * .5, facing > 0 ? rf * 1.7 : -rf * 1.7, rf * .14); }   // a fisherman's cap with a brim
      if (K.hat) { x.beginPath(); x.moveTo(-rf * 1.6, rf * .5); x.lineTo(0, rf * 1.5); x.lineTo(rf * 1.6, rf * .5); x.closePath(); x.fill(); cut(x, () => { x.lineWidth = rf * .04; for (let k = 1; k < 4; k++) { x.beginPath(); x.moveTo(-rf * 1.3 * (1 - k / 4), rf * .5 + rf * k / 4); x.lineTo(rf * 1.3 * (1 - k / 4), rf * .5 + rf * k / 4); x.stroke(); } }); }   // a conical hat
      if (K.scarf) { x.beginPath(); x.moveTo(-rf * 1.15, -rf * .4); x.quadraticCurveTo(-rf * 1.2, rf * 1.1, 0, rf * 1.25); x.quadraticCurveTo(rf * 1.2, rf * 1.1, rf * 1.15, -rf * .4); x.lineTo(rf * .95, -rf * .3); x.quadraticCurveTo(rf * .9, rf * .9, 0, rf * 1.0); x.quadraticCurveTo(-rf * .9, rf * .9, -rf * .95, -rf * .3); x.closePath(); x.fill(); }
      // the hairline: a wavy slit so the fringe reads in the backlight
      if (K.fringe) cut(x, () => { x.lineWidth = rf * .035; x.beginPath(); x.moveTo(-rf * .7, rf * .44); for (let i = 0; i < 4; i++) { x.quadraticCurveTo(-rf * .7 + rf * 1.4 * (i + .5) / 4, rf * .3, -rf * .7 + rf * 1.4 * (i + 1) / 4, rf * .44); } x.stroke(); });
      // ears
      if (!K.buns && !K.scarf) for (const s of [-1, 1]) { x.beginPath(); x.ellipse(s * rf * .98, rf * .02, rf * .12, rf * .18, 0, 0, TAU); x.fill(); }
      // eyes
      const ey = rf * .12, ex = rf * .4, ew = rf * .21, eh = E.eye === 'wide' ? rf * .19 : E.eye === 'half' ? rf * .15 : rf * .13;
      for (const s of [-1, 1]) {
        const cx = s * ex;
        if (E.eye === 'happy' || E.eye === 'sad') {   // closed: a crescent slit
          cut(x, () => { x.lineWidth = rf * .06; x.beginPath(); if (E.eye === 'happy') x.arc(cx, ey - rf * .06, ew * .9, Math.PI * 1.15, Math.PI * 1.85); else x.arc(cx, ey + rf * .12, ew * .9, Math.PI * .15, Math.PI * .85); x.stroke(); });
          continue;
        }
        cut(x, () => { x.beginPath(); x.ellipse(cx, ey, ew, eh, 0, 0, TAU); x.fill(); });
        // pupil: a paper island on a bridge from the lower lid
        x.beginPath(); x.arc(cx + s * rf * .02, ey - eh * .05, rf * .075, 0, TAU); x.fill(); x.fillRect(cx + s * rf * .02 - rf * .025, ey - eh - rf * .01, rf * .05, eh);
        // lids: the upper lid comes down with the blink (and the half-lid of concentration)
        const lid = Math.max(b, E.eye === 'half' ? .42 : 0);
        if (lid > 0) { x.beginPath(); x.rect(cx - ew * 1.1, ey + eh - eh * 2 * lid, ew * 2.2, eh * 2 * lid + rf * .02); x.fill(); }
      }
      // brows: slits, inner end up for worry, down for a frown
      for (const s of [-1, 1]) { cut(x, () => { x.save(); x.translate(s * ex, ey + rf * .3 + rf * E.browY); x.rotate(-s * E.brow); x.lineWidth = rf * .075; x.lineCap = 'round'; x.beginPath(); x.moveTo(-rf * .22, 0); x.lineTo(rf * .22, 0); x.stroke(); x.restore(); }); }
      // nose: a tiny slit
      cut(x, () => { x.lineWidth = rf * .04; x.beginPath(); x.arc(facing * rf * .04, -rf * .2, rf * .06, Math.PI * .2, Math.PI * .8); x.stroke(); });
      // mouth
      const my = -rf * .5;
      cut(x, () => {
        x.lineWidth = rf * .06; x.lineCap = 'round'; x.beginPath();
        if (E.mouth === 'smile') { x.lineWidth = rf * .08; x.arc(0, my + rf * .14, rf * .26, Math.PI * 1.15, Math.PI * 1.85); x.stroke(); }
        else if (E.mouth === 'big') { x.moveTo(-rf * .3, my + rf * .06); x.lineTo(rf * .3, my + rf * .06); x.quadraticCurveTo(0, my - rf * .4, -rf * .3, my + rf * .06); x.fill(); }
        else if (E.mouth === 'line') { x.moveTo(-rf * .14, my); x.lineTo(rf * .14, my); x.stroke(); }
        else if (E.mouth === 'down') { x.arc(0, my - rf * .16, rf * .2, Math.PI * .2, Math.PI * .8); x.stroke(); }
        else if (E.mouth === 'opendown') { x.moveTo(-rf * .2, my - rf * .12); x.lineTo(rf * .2, my - rf * .12); x.quadraticCurveTo(0, my + rf * .2, -rf * .2, my - rf * .12); x.fill(); }
        else if (E.mouth === 'o') { x.arc(0, my, rf * .09, 0, TAU); x.fill(); }
        else if (E.mouth === 'tilt') { x.ellipse(facing * rf * .1, my, rf * .08, rf * .06, 0, 0, TAU); x.fill(); }
      });
      if (E.tongue) { x.beginPath(); x.ellipse(facing * rf * .1, my - rf * .05, rf * .05, rf * .04, 0, 0, TAU); x.fill(); }
      if (E.mouth === 'big') { x.fillRect(-rf * .2, my + rf * .02, rf * .4, rf * .03); }   // teeth line as paper left
      if (E.tears) for (const s of [-1, 1]) cut(x, () => { x.beginPath(); x.moveTo(s * ex, ey - eh * 1.4); x.lineTo(s * ex + rf * .05, ey - rf * .38); x.lineTo(s * ex - rf * .05, ey - rf * .38); x.closePath(); x.fill(); });
    },
    glow: x => {   // the cut holes glow warm so the face reads at any size
      const ey = rf * .12, ex = rf * .4, ew = rf * .21, eh = E.eye === 'wide' ? rf * .19 : E.eye === 'half' ? rf * .15 : rf * .13;
      x.fillStyle = '#ffd9a0'; x.strokeStyle = '#ffd9a0';
      for (const s of [-1, 1]) { const cx = s * ex; if (E.eye === 'happy' || E.eye === 'sad') { x.lineWidth = rf * .06; x.beginPath(); if (E.eye === 'happy') x.arc(cx, ey - rf * .06, ew * .9, Math.PI * 1.15, Math.PI * 1.85); else x.arc(cx, ey + rf * .12, ew * .9, Math.PI * .15, Math.PI * .85); x.stroke(); continue; } x.beginPath(); x.ellipse(cx, ey, ew, eh, 0, 0, TAU); x.fill(); }
      x.strokeStyle = '#d8b890'; for (const s of [-1, 1]) { x.save(); x.translate(s * ex, ey + rf * .3 + rf * E.browY); x.rotate(-s * E.brow); x.lineWidth = rf * .075; x.lineCap = 'round'; x.beginPath(); x.moveTo(-rf * .22, 0); x.lineTo(rf * .22, 0); x.stroke(); x.restore(); }
      x.fillStyle = '#ffb888'; x.strokeStyle = '#ffb888'; const my = -rf * .5; x.lineWidth = rf * .06; x.beginPath();
      if (E.mouth === 'smile') { x.lineWidth = rf * .08; x.arc(0, my + rf * .14, rf * .26, Math.PI * 1.15, Math.PI * 1.85); x.stroke(); }
      else if (E.mouth === 'big') { x.moveTo(-rf * .3, my + rf * .06); x.lineTo(rf * .3, my + rf * .06); x.quadraticCurveTo(0, my - rf * .4, -rf * .3, my + rf * .06); x.fill(); }
      else if (E.mouth === 'line') { x.moveTo(-rf * .14, my); x.lineTo(rf * .14, my); x.stroke(); }
      else if (E.mouth === 'down') { x.arc(0, my - rf * .16, rf * .2, Math.PI * .2, Math.PI * .8); x.stroke(); }
      else if (E.mouth === 'opendown') { x.moveTo(-rf * .2, my - rf * .12); x.lineTo(rf * .2, my - rf * .12); x.quadraticCurveTo(0, my + rf * .2, -rf * .2, my - rf * .12); x.fill(); }
      else if (E.mouth === 'o') { x.arc(0, my, rf * .09, 0, TAU); x.fill(); }
      else if (E.mouth === 'tilt') { x.ellipse(facing * rf * .1, my, rf * .08, rf * .06, 0, 0, TAU); x.fill(); }
      if (E.tears) { x.fillStyle = '#fff0d0'; for (const s of [-1, 1]) { x.beginPath(); x.moveTo(s * ex, ey - eh * 1.4); x.lineTo(s * ex + rf * .05, ey - rf * .38); x.lineTo(s * ex - rf * .05, ey - rf * .38); x.closePath(); x.fill(); } }
    },
    finish: { px: Math.max(1.5, ppm * .0004), rim: .3, under: .25 },
  });
  headCache.set(key, p); return p;
}

// Build a figure in layer L of scene S. spec: { kind, ppm, color, facing, scale }
export function figure(S, L, spec) {
  const K = KIND[spec.kind], H = K.H * (spec.scale || 1), color = spec.color || K.color, ppm = spec.ppm || 6000, facing0 = spec.facing || 1;
  const rf = H * K.headK * .5 * 1.04, neckY = H * .76, torsoH = H * .34, torsoW = H * .19 * (K.broad || 1), La = H * .17, Lf = H * .16, Lt = H * .19, Ls = H * .2, shDx = torsoW * .6, hipDx = torsoW * .22;
  const mk = o => piece({ ppm, color, finish: { px: Math.max(1.5, ppm * .0004), rim: .3, under: .25 }, ...o });
  // torso, anchored at the hip centre (bottom), neck at the top
  const torso = mk({ w: torsoW * 2.2, h: torsoH * 1.25, ax: 0, ay: -torsoH * .5, name: 'torso', draw: x => {
    const w = torsoW, h = torsoH;
    x.beginPath(); x.moveTo(-w * .6, -h * .5); x.lineTo(w * .6, -h * .5); x.lineTo(w * .5, h * .2); x.quadraticCurveTo(w * .5, h * .5, w * .28, h * .5); x.lineTo(-w * .28, h * .5); x.quadraticCurveTo(-w * .5, h * .5, -w * .5, h * .2); x.closePath(); x.fill();
    x.fillRect(-w * .12, h * .48, w * .24, h * .1);   // neck
    if (K.collar) { x.beginPath(); x.moveTo(-w * .34, h * .5); x.lineTo(-w * .4, h * .66); x.lineTo(0, h * .56); x.lineTo(w * .4, h * .66); x.lineTo(w * .34, h * .5); x.closePath(); x.fill(); }
    cut(x, () => {   // a jacket's edge and a sash
      x.lineWidth = h * .035; x.lineCap = 'round';
      x.beginPath(); x.moveTo(0, h * .45); x.lineTo(w * .14, h * .3); x.lineTo(w * .16, -h * .2); x.stroke();
      if (K.apron) { x.beginPath(); x.moveTo(-w * .3, h * .12); x.lineTo(-w * .3, -h * .5); x.moveTo(w * .3, h * .12); x.lineTo(w * .3, -h * .5); x.moveTo(-w * .3, h * .12); x.lineTo(w * .3, h * .12); x.stroke(); }
      else { x.beginPath(); x.moveTo(-w * .5, -h * .02); x.lineTo(w * .5, -h * .02); x.stroke(); }
      if (K.buns) { for (let i = 0; i < 3; i++) { x.beginPath(); x.arc(w * .3, h * .3 - i * h * .16, h * .025, 0, TAU); x.fill(); } }   // buttons (frog closures)
    });
  } });
  // limbs: anchored at the upper joint, pointing down (−y)
  const limb = (L, w0, w1, name, foot) => mk({ w: Math.max(w0, w1) * 3 + (foot ? L * .5 : 0), h: L * 1.4, ax: 0, ay: L * .5, name, draw: x => {
    x.beginPath(); x.moveTo(-w0 / 2, 0); x.lineTo(w0 / 2, 0); x.lineTo(w1 / 2, -L); x.lineTo(-w1 / 2, -L); x.closePath(); x.fill();
    x.beginPath(); x.arc(0, 0, w0 / 2, 0, TAU); x.fill();
    if (foot === 'hand') { x.beginPath(); x.ellipse(0, -L - w1 * .3, w1 * .75, w1 * .95, 0, 0, TAU); x.fill(); cut(x, () => { x.lineWidth = w1 * .12; x.beginPath(); x.moveTo(-w1 * .05, -L - w1 * .5); x.lineTo(w1 * .25, -L - w1 * 1.0); x.stroke(); }); }
    if (foot === 'foot') { x.beginPath(); x.moveTo(-w1 * .55, -L + w1 * .2); x.lineTo(w1 * 1.2, -L + w1 * .2); x.quadraticCurveTo(w1 * 1.4, -L - w1 * .3, w1 * 1.0, -L - w1 * .4); x.lineTo(-w1 * .55, -L - w1 * .4); x.closePath(); x.fill(); }
    if (foot === 'sleeve') { x.beginPath(); x.moveTo(-w0 * .5, 0); x.lineTo(w0 * .5, 0); x.lineTo(w1 * .5 * K.sleeve, -L); x.lineTo(-w1 * .5 * K.sleeve, -L); x.closePath(); x.fill(); cut(x, () => { x.lineWidth = w1 * .12; x.beginPath(); x.moveTo(-w1 * .35 * K.sleeve, -L + w1 * .25); x.lineTo(w1 * .35 * K.sleeve, -L + w1 * .25); x.stroke(); }); }
  } });
  const upper = limb(La, torsoW * .34, torsoW * .3 * K.sleeve, 'upper', 'sleeve'), fore = limb(Lf, torsoW * .26, torsoW * .2, 'fore', 'hand');
  const thigh = limb(Lt, torsoW * .36, torsoW * .3, 'thigh'), shin = limb(Ls, torsoW * .3, torsoW * .26, 'shin', 'foot');
  const parts = {};
  const order = ['farThigh', 'farShin', 'nearThigh', 'nearShin', 'farUpper', 'farFore', 'torso', 'head', 'nearUpper', 'nearFore'];
  const pc = { farThigh: thigh, farShin: shin, nearThigh: thigh, nearShin: shin, farUpper: upper, farFore: fore, torso, head: null, nearUpper: upper, nearFore: fore };
  for (const n of order) parts[n] = S.add(L, pc[n] || torso, { vis: true, bloom: n === 'head' ? .25 : 1 });
  const F = { parts, H, rf, held: null, pose: null, spec, S, L };
  F.hands = { near: [0, 0], far: [0, 0] }; F.neck = [0, 0]; F.top = [0, 0];
  // the pose: hip position x,y; body, head rotations; near/far shoulder, elbow, hip, knee; expr, blink (0..3), facing
  F.set = (P) => {
    const p = { x: 0, y: 0, body: 0, head: 0, shN: 0, elN: 0, shF: 0, elF: 0, hipN: 0, kneeN: 0, hipF: 0, kneeF: 0, expr: 'neutral', blink: 0, facing: facing0, alpha: 1, ...P };
    F.pose = p; const f = p.facing, bend = K.bent || 0;
    const rot = (ang, vx, vy) => [vx * Math.cos(ang) - vy * Math.sin(ang), vx * Math.sin(ang) + vy * Math.cos(ang)];
    const place = (it, x, y, ang, pz) => { it.x = p.x + f * x; it.y = p.y + y; it.rot = f * ang; it.sx = f; it.sy = 1; it.alpha = p.alpha; if (pz) it.p = pz; };
    // legs from the hip
    for (const side of ['near', 'far']) {
      const hdx = side === 'near' ? hipDx : -hipDx, hA = side === 'near' ? p.hipN : p.hipF, kA = side === 'near' ? p.kneeN : p.kneeF;
      place(parts[side + 'Thigh'], hdx, 0, hA);
      const [kx, ky] = rot(hA, 0, -Lt); place(parts[side + 'Shin'], hdx + kx, ky, hA + kA);
    }
    // torso from the hip, leaning by body (+ the stoop of the old)
    const bA = p.body + bend * f * -1 * 0;   // stoop handled as a forward lean on facing
    const lean = p.body + (bend ? -bend : 0);
    place(parts.torso, 0, 0, lean);
    const [nx, ny] = rot(lean, 0, torsoH); F.neck = [p.x + f * nx, p.y + ny];
    place(parts.head, nx, ny, lean + p.head, head(spec.kind, rf, p.expr, Math.round(clamp(p.blink, 0, 3)), ppm, color, 1));
    const [tx, ty] = rot(lean + p.head, 0, rf * 2.3); F.top = [p.x + f * (nx + tx), p.y + ny + ty];
    // arms from the shoulders
    for (const side of ['near', 'far']) {
      const sdx = side === 'near' ? shDx : -shDx, sA = side === 'near' ? p.shN : p.shF, eA = side === 'near' ? p.elN : p.elF;
      const [sx, sy] = rot(lean, sdx, torsoH * .92);
      place(parts[side + 'Upper'], sx, sy, lean + sA);
      const [ex, ey] = rot(lean + sA, 0, -La); place(parts[side + 'Fore'], sx + ex, sy + ey, lean + sA + eA);
      const [hx, hy] = rot(lean + sA + eA, 0, -Lf - torsoW * .1); F.hands[side] = [p.x + f * (sx + ex + hx), p.y + sy + ey + hy, lean + sA + eA];
    }
    if (F.held) { const [hx, hy] = F.hands[F.held.side]; F.held.it.x = hx; F.held.it.y = hy; F.held.it.rot = F.held.rot(p, hx, hy); F.held.it.alpha = p.alpha; }
    return F;
  };
  F.show = v => { for (const n of order) parts[n].vis = v; if (F.held) F.held.it.vis = v; };
  return F;
}

// the rabbit lantern as a held piece: string from the hand, pendulum swing (rotation about the hand). r = rabbit unit (m)
export function rabbitLantern(S, L, F, side, r, o = {}) {
  const str = o.string ?? r * 1.6, ppm = o.ppm || F.spec.ppm || 6000;
  const p = piece({ w: r * 4, h: r * 3.6 + str, ppm, color: '#c8261e', ax: 0, ay: (r * 3.6 + str) / 2, name: 'rabbit',
    draw: x => { x.fillStyle = '#2a1008'; x.fillRect(-r * .025, -str, r * .05, str); x.fillStyle = '#c8261e'; x.save(); x.translate(0, -str); rabbit(x, r, { earR: o.earR || 0 }); x.restore(); },
    glow: x => { x.save(); x.translate(0, -str); rabbit(x, r, { earR: o.earR || 0, col: '#ffa050' })(x); x.restore(); }, finish: { px: Math.max(1.5, ppm * .0004), rim: .35, under: .2 } });
  const it = S.add(L, p, { gate: 1 });
  F.held = { it, side, rot: o.rot || (() => 0) };
  return it;
}
// a festival lantern on a short pole, held in a hand; kind from world.lantern
export function poleLantern(S, L, F, side, kind, r, o = {}) {
  const pole = o.pole ?? r * 2.6, ppm = o.ppm || F.spec.ppm || 6000, col = LANTERN_COL[kind];
  const p = piece({ w: r * 3.4, h: pole + r * 2.4, ppm, color: '#120a06', ax: 0, ay: (pole + r * 2.4) / 2, name: 'lantern-' + kind,
    draw: x => { x.fillRect(-r * .04, -pole * .2, r * .08, pole * .45); x.save(); x.translate(0, pole * .25 + r); x.fillStyle = '#120a06'; x.fillRect(-r * .03, -r * .9, r * .06, r * .6); lantern(x, kind, r, { col }); x.restore(); x.fillRect(-r * .06, -pole, r * .12, pole * .85); },
    glow: x => { x.save(); x.translate(0, pole * .25 + r); lantern(x, kind, r, { col })(x); x.restore(); }, finish: { px: Math.max(1.5, ppm * .0004), rim: .3, under: .2 } });
  const it = S.add(L, p, { gate: 0 });
  F.held = { it, side, rot: o.rot || (() => 0) };
  return it;
}

// —— motion helpers (angles in radians; phase in cycles) ——
export function walk(ph, amp = .55) {   // a walk cycle: legs and counter-swinging arms, a slight bob
  const s = Math.sin(ph * TAU), c = Math.cos(ph * TAU);
  return { hipN: amp * s, kneeN: Math.max(0, -c) * amp * 1.1 * (s < 0 ? 1 : .3), hipF: -amp * s, kneeF: Math.max(0, c) * amp * 1.1 * (s > 0 ? 1 : .3), shN: -amp * .55 * s, elN: -.3, shF: amp * .55 * s, elF: -.3, bob: Math.abs(s) * .018 };
}
export function run(ph, amp = .9) {
  const s = Math.sin(ph * TAU), c = Math.cos(ph * TAU);
  return { hipN: amp * s, kneeN: Math.max(0, -c) * amp * 1.3, hipF: -amp * s, kneeF: Math.max(0, c) * amp * 1.3, shN: -amp * .7 * s, elN: -.9, shF: amp * .7 * s, elF: -.9, bob: Math.abs(s) * .04, body: -.18 };
}
export const mixPose = (a, b, u) => { const o = { ...a }; for (const k in b) o[k] = typeof b[k] === 'number' && typeof a[k] === 'number' ? lerp(a[k], b[k], u) : (u < .5 ? (a[k] ?? b[k]) : b[k]); return o; };
// blink envelope: 0..3 lid level over a 0.24 s blink starting at t0
export const blinkAt = (t, t0) => { const u = (t - t0) / .24; if (u < 0 || u > 1) return 0; return Math.round(3 * Math.sin(u * Math.PI)); };
// an expression swap on a blink: before t0 → a, after the lids close → b
export const swap = (t, t0, a, b) => ({ expr: t < t0 + .1 ? a : b, blink: blinkAt(t, t0) });
