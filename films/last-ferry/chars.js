// Pixel characters for 《最后一班渡船》, drawn procedurally in a design grid of "units" (1 unit = 1 texel at density S=1).
// The same drawing renders at density 1 (wide shots, a 56-unit adult ≈ 56 px) and density 3 (close-ups: eyes with lids, pupils and brows
// are drawn only when S ≥ 2). Each frame is a pose object; frames are packed into an atlas; the billboard takes the scene light and casts a cut-out shadow.
import * as THREE from 'three';
import { PX, ramp, hex, mixc, texOf, billboard, blob, h2 } from './px.js';

export const SPX = 1 / 34;        // design unit → metres (an adult is 56 units ≈ 1.65 m)
const INK = hex('#1a1016');
const DZ = .22;
const R = (cols) => ramp(cols, DZ);

// —— Palettes ——
export const PAL = {
  skin:    R(['#9a6a4e', '#c58a68', '#e4ad88', '#f6cfae']),
  skinOld: R(['#8e6448', '#b8846a', '#d8a98c', '#ecc6a8']),
  skinKid: R(['#b57c62', '#dca286', '#f4c8a8', '#ffe0c8']),
  flush:   R(['#b8584e', '#d87868', '#ee9c88', '#f8b8a4']),
  hairK:   R(['#120d10', '#241820', '#3a2a34']),
  hairW:   R(['#8a8a90', '#b4b4bc', '#d8d8de', '#f0f0f4']),
  hairG:   R(['#4a4a52', '#6e6e78', '#95959e', '#b8b8c0']),
  indigo:  R(['#141c3a', '#1f2f62', '#2c468c', '#3a5fb0', '#5c82cc']),
  greyTr:  R(['#2a2a2e', '#444448', '#5e5e64', '#78787e']),
  straw:   R(['#6a5020', '#9a7a34', '#c6a44a', '#e6c868']),
  towel:   R(['#9a9a96', '#c8c8c4', '#ededea']),
  sandal:  R(['#3a2a18', '#5c4426', '#7e6036']),
  yellow:  R(['#9a7a10', '#d8b020', '#f6d838', '#fff08a']),
  track:   R(['#1c2a60', '#2a4090', '#3a5ab8', '#6a88d8']),
  trackW:  R(['#9aa4c0', '#c8d0e4', '#eef2fa']),
  red:     R(['#5a0c10', '#8e1418', '#c42626', '#e84848', '#ff8070']),
  redDeep: R(['#3e0a0c', '#6a1014', '#9a1a1a', '#c23030']),
  gold:    R(['#6a4a10', '#b08a24', '#e0b840', '#ffe080']),
  plum:    R(['#3a1a3e', '#5e2a66', '#84408c', '#a860ac']),
  dark:    R(['#15131a', '#24222a', '#36343e', '#4a4852']),
  brown:   R(['#2e1c10', '#4e3220', '#6e4a30', '#8e6642']),
  greyBl:  R(['#2c3440', '#46505e', '#64707e', '#8a96a4']),
  olive:   R(['#2c3018', '#484e26', '#666e36', '#88904a']),
  teal:    R(['#163a3a', '#245a5a', '#348080', '#52a4a0']),
  white:   R(['#a8a8b0', '#d4d4da', '#f2f2f6', '#ffffff']),
  grey:    R(['#5a5a60', '#80808a', '#a4a4ac', '#c8c8d0']),
  blanket: R(['#4a4e58', '#6a7080', '#8a92a4', '#aab2c2']),
  goose:   R(['#b8b8c0', '#dcdce2', '#f4f4f8', '#ffffff']),
  beak:    R(['#b86a10', '#e89a20', '#ffc048']),
  wood:    R(['#3a2612', '#5e3e1e', '#80582c', '#a07438']),
  paper:   R(['#c8c4b8', '#e8e4da', '#fbf8f0']),
  drum:    R(['#5a1a10', '#8a2a18', '#b84a28']),
  pink:    R(['#8a3a5a', '#c05a80', '#e888a8', '#f8b8cc']),
  cream:   R(['#8a8068', '#bcb092', '#e4d8b8', '#f8f0dc']),
};

// —— Pen: unit-coordinate drawing at density S ——
class Pen {
  constructor(P, E, S) { this.P = P; this.E = E; this.S = S; }
  rect(x, y, w, h, col) { const S = this.S; this.P.rect(Math.round(x * S), Math.round(y * S), Math.max(1, Math.round(w * S)), Math.max(1, Math.round(h * S)), col); }
  px(x, y, col) { this.rect(x, y, 1, 1, col); }
  // colour: a ramp fn (v fixed via rampV) or a function (x,y,dx,dy) → col, or a plain colour
  ell(cx, cy, rx, ry, col) { const S = this.S; this.P.ellipse(cx * S, cy * S, Math.max(.5, rx * S), Math.max(.5, ry * S), col); }
  poly(pts, col) { const S = this.S; this.P.poly(pts.map(p => [p[0] * S, p[1] * S]), col); }
  line(x0, y0, x1, y1, col, w = 1) {
    const S = this.S, n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * S * 1.5) + 1;
    for (let i = 0; i <= n; i++) { const u = i / n; this.rect(x0 + (x1 - x0) * u - w / 2, y0 + (y1 - y0) * u - w / 2, w, w, col); }
  }
  em(x, y, w, h, col) { if (!this.E) return; const S = this.S; this.E.rect(Math.round(x * S), Math.round(y * S), Math.max(1, Math.round(w * S)), Math.max(1, Math.round(h * S)), col); }
  // shading helper: ramp value by position inside a shape: light from upper-left (facing right → light on the face side)
  shade(ramp, base, kx = .25, ky = .2) { return (x, y, dx, dy) => ramp(base - (dx ?? 0) * kx * -1 - (dy ?? 0) * ky, x, y); }
}

// —— Face at density S: skin oval, hair, hat, eyes, brows, mouth; the expression params decide everything ——
// Expressions: brows (bi inner, bo outer: + = down), lids (0 open .. 1 closed), pupil dx/dy, mouth: 'line'|'smile'|'o'|'open'|'down'|'blow'|'wide'
const EXPR = {
  calm:   { bi: 0, bo: 0, lid: .15, mouth: 'line' },
  smile:  { bi: -.1, bo: .1, lid: .45, mouth: 'smile' },
  grave:  { bi: .7, bo: -.1, lid: .25, mouth: 'down' },
  firm:   { bi: .5, bo: .1, lid: .2, mouth: 'line', pdx: .3 },
  fear:   { bi: -.6, bo: -.4, lid: -.2, mouth: 'o', pdx: .2 },
  tender: { bi: -.5, bo: .2, lid: .4, mouth: 'smile' },
  ask:    { bi: -.5, bo: -.3, lid: 0, mouth: 'o' },
  happy:  { bi: -.2, bo: 0, lid: 1, mouth: 'wide', curve: 1 },
  shout:  { bi: -.7, bo: -.5, lid: -.2, mouth: 'open' },
  closed: { bi: .2, bo: .1, lid: 1, mouth: 'line' },
  blow:   { bi: .3, bo: 0, lid: .9, mouth: 'blow' },
  fever:  { bi: .4, bo: .1, lid: 1, mouth: 'open', flush: 1 },
  shy:    { bi: -.2, bo: .1, lid: .3, mouth: 'smile', pdx: -.2, pdy: .3, flush: .6 },
  worry:  { bi: -.6, bo: .3, lid: .2, mouth: 'down' },
  tired:  { bi: .1, bo: .3, lid: .6, mouth: 'line' },
  wide:   { bi: -.4, bo: -.3, lid: -.2, mouth: 'line' },
};
export function drawFace(pen, o) {
  // o: {cx, cy, r (face radius units), skin, hair, hat, hatCol, old, kid, expr, blink, look (-1 down .. 1 up), cap colour, veil}
  const S = pen.S, { cx, cy, r } = o, E = { ...(EXPR[o.expr] || EXPR.calm) }, look = o.look || 0;
  if (o.blink) E.lid = 1;
  const skin = o.skin, hair = o.hair;
  // head shape: 3/4 view facing right; face centre a little right of the head centre
  pen.ell(cx, cy, r, r * 1.06, (x, y, dx, dy) => skin(.62 - dx * .12 - dy * .25, x, y));
  // ear (back side)
  pen.ell(cx - r * .95, cy + r * .1, r * .18, r * .28, (x, y, dx, dy) => skin(.45 - dy * .2, x, y));
  // hair / hat
  const hy = cy - r * .55;
  if (o.hair === 'black' || o.hair === 'grey' || o.hair === 'white') {
    const H = hair === 'black' ? PAL.hairK : hair === 'grey' ? PAL.hairG : PAL.hairW;
    pen.ell(cx - r * .15, cy - r * .35, r * 1.02, r * .78, (x, y, dx, dy) => H(.55 - dy * .3 - dx * .15, x, y));
    pen.rect(cx - r * 1.1, cy - r * .5, r * .5, r * 1.1, H(.35, 0, 0));          // back of the hair, down to the ear
    if (o.fringe !== false) for (let i = 0; i < 5; i++) pen.rect(cx - r * .7 + i * r * .33, cy - r * .55 + (i % 2) * .5, r * .3, r * .35 + (i % 3) * .2, H(.5, i, 0));
  } else if (o.hair === 'bun') {
    const H = o.hairCol || PAL.hairK;
    pen.ell(cx - r * .15, cy - r * .35, r * 1.02, r * .78, (x, y, dx, dy) => H(.55 - dy * .3 - dx * .15, x, y));
    pen.ell(cx - r * 1.05, cy - r * .35, r * .42, r * .42, (x, y, dx, dy) => H(.6 - dy * .3, x, y));   // the bun
    pen.rect(cx - r * 1.0, cy - r * .3, r * .4, r * .9, H(.35, 0, 0));
    if (o.flower) { pen.ell(cx - r * .5, cy - r * .95, r * .3, r * .3, PAL.red(.7, 0, 0)); pen.px(cx - r * .5, cy - r * .95, PAL.gold(.9, 0, 0)); }
  } else if (o.hair === 'stubble') {   // old man: white stubble round the jaw, thin white hair
    pen.ell(cx - r * .2, cy - r * .45, r * .95, r * .55, (x, y, dx, dy) => PAL.hairW(.5 - dy * .3, x, y));
    pen.rect(cx - r * 1.05, cy - r * .4, r * .4, r * .8, PAL.hairW(.35, 0, 0));
  }
  if (o.hair === 'stubble' || o.old) {   // stubble on the jaw
    for (let i = 0; i < 7; i++) { const a = .2 + i * .22; const x = cx + Math.cos(a) * r * .8, y = cy + Math.sin(a) * r * .9; if (S >= 2 || i % 2) pen.rect(x, y, .6, .6, PAL.hairW(.6, i, 0)); }
  }
  // hats
  if (o.hat === 'straw') {   // flat straw hat with a wide brim, a cone top
    const bw = r * 2.0, by = cy - r * .62;
    pen.poly([[cx - bw * .55, by], [cx + bw * .7, by + .6], [cx + bw * .72, by + 1.4], [cx - bw * .6, by + 1.2]], (x, y) => PAL.straw(.55 + (y % 2) * .15, x, y));
    pen.poly([[cx - r * 1.0, by], [cx + r * 1.0, by], [cx + r * .6, by - r * 1.05], [cx - r * .35, by - r * 1.1]], (x, y) => PAL.straw(.75 - (y - (by - r)) / r * .25, x, y));
    pen.rect(cx - r * .9, by - .4, r * 1.85, .7, PAL.straw(.3, 0, 0));   // band shadow
  } else if (o.hat === 'ycap') {   // the yellow school cap: round crown + a short peak to the right
    pen.ell(cx - r * .1, cy - r * .7, r * 1.05, r * .68, (x, y, dx, dy) => PAL.yellow(.7 - dy * .3 - dx * .15, x, y));
    pen.poly([[cx + r * .5, cy - r * .6], [cx + r * 1.5, cy - r * .62], [cx + r * 1.5, cy - r * .38], [cx + r * .5, cy - r * .3]], (x, y) => PAL.yellow(.45, x, y));
    pen.px(cx - r * .1, cy - r * 1.4, PAL.yellow(.95, 0, 0));
  } else if (o.hat === 'cap') {   // the groom's round black cap with a red knot
    pen.ell(cx - r * .1, cy - r * .55, r * 1.05, r * .7, (x, y, dx, dy) => PAL.dark(.7 - dy * .4, x, y));
    pen.rect(cx - r * 1.1, cy - r * .35, r * 2.2, .7, PAL.red(.6, 0, 0)); pen.px(cx - r * .1, cy - r * 1.3, PAL.red(.85, 0, 0));
  } else if (o.hat === 'nurse') {
    pen.poly([[cx - r * .9, cy - r * .55], [cx + r * .9, cy - r * .55], [cx + r * .6, cy - r * 1.25], [cx - r * .6, cy - r * 1.25]], (x, y) => PAL.white(.85, x, y));
    pen.rect(cx - r * .15, cy - r * 1.1, r * .3, r * .4, PAL.red(.7, 0, 0));
  } else if (o.hat === 'veil') {   // a red cloth over the bride's hair (face visible)
    pen.ell(cx - r * .15, cy - r * .4, r * 1.1, r * .85, (x, y, dx, dy) => PAL.red(.55 - dy * .3 - dx * .1, x, y));
    pen.rect(cx - r * 1.15, cy - r * .3, r * .45, r * 1.5, PAL.red(.4, 0, 0));
    pen.px(cx - r * .3, cy - r * 1.1, PAL.gold(.9, 0, 0)); pen.px(cx + r * .1, cy - r * 1.2, PAL.gold(.8, 0, 0));
  }
  // —— features —— (face centre fx slightly to the right because of the 3/4 view)
  const fx = cx + r * .25, ey = cy - r * .05 - look * r * .12;
  const eyes = [[fx + r * .45, 1], [fx - r * .32, .8]];   // near eye, far eye (narrower)
  if (S < 2) {
    // density 1: dots and a brow stroke; the expression only through lids/brow position
    for (const [ex, k] of eyes) { if (E.lid >= .9) pen.rect(ex - .5, ey, 1, 1, skin(.25, 0, 0)); else pen.px(ex - .5, ey, INK); }
    const bb = (o.hair === 'white' || o.hair === 'stubble' || o.hair === 'grey') ? PAL.hairW(.9, 0, 0) : PAL.hairK(.5, 0, 0);
    for (const [ex, k] of eyes) pen.rect(ex - 1, ey - 1.6 + (ex > fx ? E.bi : E.bo) * .5, 2, .8, bb);
    if (E.mouth === 'smile' || E.mouth === 'wide') pen.rect(fx + r * .1, cy + r * .5, 2, 1, skin(.2, 0, 0));
    else if (E.mouth === 'o' || E.mouth === 'open') pen.rect(fx + r * .25, cy + r * .45, 1, 1.5, INK);
    if (E.flush) { pen.px(fx + r * .7, cy + r * .25, PAL.flush(.7, 0, 0)); pen.px(fx - r * .5, cy + r * .25, PAL.flush(.7, 0, 0)); }
    pen.px(fx + r * .85, cy + r * .15, skin(.35, 0, 0));   // nose
    return;
  }
  // density ≥ 2: real eyes
  const w = r * .3, hgt = r * .2 * (1 - Math.min(1, Math.max(0, E.lid)) * .7 + (E.lid < 0 ? -E.lid * .7 : 0));
  const pdx = (E.pdx || 0) * r * .12, pdy = (E.pdy || 0) * r * .1 - look * r * .05;
  for (const [ex, k] of eyes) {
    const ew = w * k;
    if (E.lid >= 1) {   // closed: a curved line (happy = curve up)
      const curve = E.curve ? .45 : .08;
      for (let i = -2; i <= 2; i++) pen.rect(ex + i * ew * .45 - .4, ey - .2 + Math.abs(i) * curve, .9, .9, INK);
      continue;
    }
    pen.ell(ex, ey, ew, hgt, (x, y, dx, dy) => PAL.white(.85 - dy * .2, x, y));
    pen.ell(ex + pdx, ey + pdy, ew * .62, Math.min(hgt * .98, ew * .7), (x, y, dx, dy) => R(['#12141c', '#1e2432', '#2a3448'])(.45 - dy * .3, x, y));
    pen.rect(ex + pdx - ew * .05, ey + pdy - hgt * .5, ew * .3, ew * .3, hex('#ffffff'));   // catchlight
    pen.rect(ex - ew, ey - hgt - .3, ew * 2, .7, INK);                                      // upper lid line
    if (E.lid > .3) pen.rect(ex - ew, ey - hgt - .2, ew * 2, hgt * E.lid * .9, skin(.4, 0, 0));   // lid lowering
    if (o.old) { pen.rect(ex - ew * .9, ey + hgt + .5, ew * 1.6, .5, skin(.3, 0, 0)); }       // bag under the eye
  }
  // brows: inner end toward fx; angles from E.bi (inner) / E.bo (outer)
  const bb = (o.hair === 'white' || o.hair === 'stubble' || o.hair === 'grey') ? PAL.hairW(.85, 0, 0) : PAL.hairK(.45, 0, 0);
  for (const [ex, k] of eyes) {
    const ew = w * k, inner = ex > fx ? ex - ew * .9 : ex + ew * .9, outer = ex > fx ? ex + ew * 1.05 : ex - ew * 1.05;
    const by = ey - hgt - r * .26 - r * .06 * (E.lid < 0 ? 1 : 0);
    pen.line(inner, by + E.bi * r * .3, outer, by + E.bo * r * .3, bb, o.old ? 1.3 : 1.1);
  }
  // nose: a short line on the bridge and a dot
  pen.rect(fx + r * .78, cy + r * .05, .7, r * .35, skin(.38, 0, 0)); pen.rect(fx + r * .62, cy + r * .32, r * .3, .6, skin(.3, 0, 0));
  // mouth
  const my = cy + r * .5, mx = fx + r * .25;
  if (E.mouth === 'line') pen.rect(mx - r * .25, my, r * .55, .9, skin(.12, 0, 0));
  else if (E.mouth === 'smile') { for (let i = -2; i <= 2; i++) pen.rect(mx + i * r * .15, my - Math.abs(i) * r * .11 + r * .18, r * .17, .9, skin(.12, 0, 0)); }
  else if (E.mouth === 'wide') { pen.ell(mx, my + r * .05, r * .3, r * .17, (x, y, dx, dy) => dy < -.2 ? INK : R(['#7a2a30', '#b04048'])(.5, x, y)); pen.rect(mx - r * .3, my - r * .12, r * .6, .8, INK); }
  else if (E.mouth === 'down') { for (let i = -2; i <= 2; i++) pen.rect(mx + i * r * .14, my + Math.abs(i) * r * .1, r * .16, .9, skin(.12, 0, 0)); }
  else if (E.mouth === 'o') pen.ell(mx, my + r * .05, r * .14, r * .18, INK);
  else if (E.mouth === 'open') pen.ell(mx, my + r * .08, r * .26, r * .22, (x, y, dx, dy) => dy > .3 ? R(['#7a2a30', '#b04048'])(.5, x, y) : INK);
  else if (E.mouth === 'blow') { pen.ell(mx, my + r * .05, r * .13, r * .12, INK); pen.ell(fx + r * .1, cy + r * .4, r * .45, r * .35, (x, y, dx, dy) => skin(.7 - dy * .2, x, y)); pen.ell(mx, my + r * .05, r * .12, r * .1, INK); }
  if (E.flush) { pen.ell(fx + r * .75, cy + r * .28, r * .2, r * .12, PAL.flush(.75, 0, 0)); pen.ell(fx - r * .45, cy + r * .28, r * .22, r * .12, PAL.flush(.75, 0, 0)); }
  if (o.old) { pen.rect(fx + r * .95, cy + r * .25, .6, r * .4, skin(.3, 0, 0)); pen.rect(fx - r * .05, cy + r * .72, r * .5, .5, skin(.3, 0, 0)); }   // nasolabial line, chin line
}

// —— Adult body (3/4 view facing right). Frame 40×58 units, feet at y=56 ——
// p: {step, arm, sit, kneel, lean, bob, look, expr, blink, hat ('on'|'off'|'cup'), umb ('closed'|'half'|'open'|'flip'), carry, drum, item}
function drawAdult(pen, c, p) {
  const S = pen.S, by = (p.bob || 0), lean = p.lean || 0;
  const top = c.top, bot = c.bot, skin = c.skin;
  const stoop = c.stoop || 0;
  const sit = !!p.sit, kneel = !!p.kneel;
  const groundY = 56, hipY = sit ? 44 : kneel ? 50 : 38, torsoTop = (sit ? 27 : kneel ? 33 : 18) + by + stoop * 1.5;
  const hx = 18 + lean * 1.5 + stoop * 1.2, hy = torsoTop - 9 + stoop * 1.2;
  // —— legs ——
  if (sit) {   // sitting on a ledge, legs forward (to the right), feet hanging
    pen.poly([[12, hipY], [25, hipY], [27, hipY + 8], [15, hipY + 9]], (x, y) => bot(.55 - (y - hipY) * .03, x, y));
    pen.rect(24, hipY + 6, 4, 5, bot(.5, 0, 0)); pen.rect(18, hipY + 7, 4, 5, bot(.4, 0, 0));
    pen.rect(24, hipY + 11, 5, 2, c.shoe(.5, 0, 0)); pen.rect(18, hipY + 12, 5, 2, c.shoe(.4, 0, 0));
  } else if (kneel) {
    pen.poly([[10, hipY], [24, hipY], [26, 56], [8, 56]], (x, y) => bot(.5 - (y - hipY) * .03, x, y));
    pen.rect(6, 53, 8, 3, c.shoe(.45, 0, 0));
  } else {
    const st = p.step ?? -1;
    const legs = st < 0 ? [[13, 0], [19, 0]] : [[[11, 0], [21, -1]], [[14, -1], [18, 0]], [[21, -1], [11, 0]], [[18, 0], [14, -1]]][st];
    legs.forEach(([lx, ly], i) => {
      pen.poly([[lx, hipY], [lx + 5, hipY], [lx + 5, 52 + ly], [lx, 52 + ly]], (x, y) => bot((i ? .55 : .8) - (y - hipY) * .015, x, y));
      pen.rect(lx - .5, 52 + ly, 6.5, 2.5, c.shoe(i ? .45 : .65, 0, 0)); pen.rect(lx - .5, 54 + ly, 7, 1, c.shoe(.2, 0, 0));
      if (c.rolled) pen.rect(lx - .5, 46 + ly, 6, 2, bot(.3, 0, 0));
    });
  }
  // —— torso (jacket): trapezoid, with a front opening line ——
  const shL = 10 + lean, shR = 25 + lean, hmL = 10, hmR = 26;
  pen.poly([[shL, torsoTop], [shR, torsoTop], [hmR, hipY + 2], [hmL, hipY + 2]], (x, y) => { const u = (y - torsoTop) / (hipY + 2 - torsoTop), l = shL + (hmL - shL) * u, r = shR + (hmR - shR) * u, s = (x - l) / (r - l); let v = .7 - s * .45 + (1 - u) * .1; if (s > .6 && s < .66) v -= .25; if (c.fold && (x + (y >> 2)) % 6 === 0 && u > .3) v -= .12; return top(v, x, y); });
  if (c.collar) { pen.rect(shL + 3, torsoTop, 10, 2, c.collar(.8, 0, 0)); }
  if (c.belt) pen.rect(hmL + 1, hipY - 1, hmR - hmL - 2, 2, c.belt(.4, 0, 0));
  if (c.towel) { pen.poly([[shL + 1, torsoTop - 1], [shL + 6, torsoTop - 1], [shL + 7, torsoTop + 14], [shL + 2, torsoTop + 14]], (x, y) => PAL.towel(.6 + ((y >> 1) % 2) * .2, x, y)); }
  if (c.apron) pen.poly([[shL + 4, torsoTop + 6], [shR - 4, torsoTop + 6], [hmR - 3, hipY + 1], [hmL + 3, hipY + 1]], (x, y) => c.apron(.6, x, y));
  if (c.sash) pen.poly([[shR - 2, torsoTop + 1], [shR, torsoTop + 3], [hmL + 2, hipY + 1], [hmL, hipY - 1]], (x, y) => c.sash(.7, x, y));
  // —— arms ——
  const arm = p.arm || 'low', sl = (pts, w = 3) => pts.forEach(([x, y]) => pen.rect(x - w / 2, y - w / 2, w, w, top(.45, x, y)));
  const hand = (x, y, w = 3) => pen.rect(x - w / 2, y - w / 2, w, w, skin(.55, 0, 0));
  const aX = shR - 3, aY = torsoTop + 3;   // shoulder
  const farHand = (x, y) => pen.rect(x, y, 2.5, 2.5, skin(.3, 0, 0));
  if (arm === 'low') { sl([[aX, aY], [aX + 1, aY + 4], [aX + 1.5, aY + 8], [aX + 1.5, aY + 12]]); hand(aX + 1.5, aY + 15); farHand(shL - 1, aY + 13); }
  if (arm === 'wave') { sl([[aX, aY], [aX + 2, aY - 3], [aX + 4, aY - 7], [aX + 5, aY - 11]]); hand(aX + 5 + (p.w || 0), aY - 14); farHand(shL - 1, aY + 13); }
  if (arm === 'hold') {   // both hands forward at chest height, holding something small
    sl([[aX, aY], [aX + 3, aY + 2], [aX + 6, aY + 4]]); hand(aX + 8, aY + 5); sl([[shL + 2, aY + 1], [shL + 6, aY + 3], [shL + 10, aY + 5]], 2.5);
  }
  if (arm === 'up2') {   // both arms up (hands raised, the goose-coaxing / the cheer)
    sl([[aX, aY], [aX + 2, aY - 4], [aX + 3, aY - 8]]); hand(aX + 3, aY - 11); sl([[shL + 1, aY], [shL - 1, aY - 4], [shL - 2, aY - 8]], 2.5); farHand(shL - 3, aY - 11);
  }
  if (arm === 'point') { sl([[aX, aY], [aX + 4, aY + 1], [aX + 8, aY + 1], [aX + 12, aY + 1]]); hand(aX + 14, aY + 1); farHand(shL - 1, aY + 13); }
  if (arm === 'rope') { sl([[aX, aY + 2], [aX + 3, aY + 6], [aX + 5, aY + 10]]); hand(aX + 6, aY + 13); pen.line(aX + 6, aY + 13, aX + 14, aY + 22, PAL.wood(.9, 0, 0), 1); }
  if (arm === 'carry') {   // the bundle in both arms in front of the chest
    sl([[aX, aY], [aX + 2, aY + 5], [aX + 1, aY + 9]]); sl([[shL + 1, aY + 1], [shL + 4, aY + 6], [shL + 8, aY + 9]], 2.5);
    pen.ell(shL + 10, aY + 7, 8, 5.5, (x, y, dx, dy) => PAL.blanket(.6 - dy * .3 - dx * .1, x, y));   // the blanket bundle
    pen.ell(shL + 15, aY + 4.5, 3.2, 3.2, (x, y, dx, dy) => PAL.skinKid(.6 - dy * .2, x, y));          // the boy's head
    pen.ell(shL + 14.6, aY + 2.6, 3.6, 2.2, (x, y, dx, dy) => PAL.yellow(.7 - dy * .3, x, y));         // the yellow cap
    if (S >= 2) { pen.rect(shL + 16, aY + 5, 1.6, .6, INK); pen.rect(shL + 13, aY + 5, 1.4, .6, INK); pen.ell(shL + 16.5, aY + 6.3, .8, .5, PAL.flush(.8, 0, 0)); }
    hand(aX + 1, aY + 11); hand(shL + 9, aY + 11, 2.5);
  }
  if (arm === 'umb') {   // holding an umbrella stick up beside the head
    const ux = aX + 6, uy = torsoTop - 14;
    sl([[aX, aY], [aX + 3, aY - 2], [aX + 5, aY - 4]]); hand(ux, aY - 5);
    pen.line(ux, aY - 5, ux, uy + 2, PAL.dark(.7, 0, 0), 1);
    const st = p.umb || 'open';
    if (st === 'closed') pen.poly([[ux - 1.2, uy - 2], [ux + 1.2, uy - 2], [ux + 1, aY - 2], [ux - 1, aY - 2]], (x, y) => PAL.red(.5, x, y));
    else if (st === 'half') pen.poly([[ux - 5, uy + 6], [ux, uy - 2], [ux + 5, uy + 6]], (x, y) => PAL.red(.6 + (y - uy) * .02, x, y));
    else if (st === 'open') { pen.ell(ux, uy + 3, 11, 5.5, (x, y, dx, dy) => dy > .05 ? null : PAL.red(.75 - Math.abs(dx) * .3 - dy * .2, x, y)); pen.rect(ux - 11, uy + 2.6, 22, 1.2, PAL.redDeep(.6, 0, 0)); pen.px(ux, uy - 3, PAL.gold(.9, 0, 0)); }
    else if (st === 'flip') { pen.ell(ux, uy, 10, 5, (x, y, dx, dy) => dy < -.05 ? null : PAL.red(.55 - Math.abs(dx) * .3, x, y)); pen.rect(ux - 10, uy - .6, 20, 1.2, PAL.redDeep(.6, 0, 0)); pen.px(ux, uy + 6, PAL.gold(.9, 0, 0)); }
    farHand(shL - 1, aY + 13);
  }
  if (arm === 'drum') {   // a small drum hung at the belly, both hands beating
    pen.ell(hmL + 8, hipY - 4, 7, 4.5, (x, y, dx, dy) => PAL.drum(.6 - dy * .2, x, y)); pen.ell(hmL + 8, hipY - 6.2, 6.4, 2.2, (x, y, dx, dy) => PAL.cream(.75 - dy * .1, x, y));
    const k = p.beat ? 1 : 0; sl([[aX, aY], [aX - 1, aY + 5], [aX - 3, aY + 9 + k]]); hand(aX - 4, aY + 11 + k * 2); farHand(shL + 2, aY + 10 - k);
  }
  if (arm === 'cane') { sl([[aX, aY + 1], [aX + 2, aY + 5], [aX + 3, aY + 9]]); hand(aX + 4, aY + 12); pen.line(aX + 4, aY + 12, aX + 5, 56, PAL.wood(.7, 0, 0), 1); farHand(shL - 1, aY + 13); }
  if (arm === 'basket') { sl([[aX, aY + 1], [aX + 1, aY + 6], [aX + 1, aY + 11]]); hand(aX + 1, aY + 14); pen.ell(aX + 2, aY + 21, 5, 4, (x, y, dx, dy) => PAL.straw(.5 - dy * .2 + ((x + y) % 2) * .15, x, y)); pen.line(aX - 2, aY + 15, aX + 6, aY + 15, PAL.straw(.3, 0, 0)); farHand(shL - 1, aY + 13); }
  if (arm === 'match') {   // right arm out and down, a match in the hand (tip emissive)
    sl([[aX, aY + 1], [aX + 4, aY + 4], [aX + 8, aY + 6]]); hand(aX + 10, aY + 7);
    pen.line(aX + 10, aY + 7, aX + 15, aY + 9, PAL.wood(.9, 0, 0), .8); pen.rect(aX + 15, aY + 8.4, 1.3, 1.3, hex('#fff0a0')); pen.em(aX + 15, aY + 8.4, 1.3, 1.3, hex('#fff0a0'));
    farHand(shL - 1, aY + 13);
  }
  if (arm === 'cup') {   // both arms forward-down, the hat held as a shield (the hat drawn below the hands)
    sl([[aX, aY + 1], [aX + 4, aY + 5], [aX + 7, aY + 9]]); hand(aX + 8, aY + 11); sl([[shL + 2, aY + 2], [shL + 7, aY + 6], [shL + 12, aY + 9]], 2.5);
    pen.poly([[aX + 3, aY + 12], [aX + 16, aY + 12], [aX + 14, aY + 17], [aX + 5, aY + 17]], (x, y) => PAL.straw(.6 + (y % 2) * .15, x, y));
  }
  if (arm === 'knees') {   // sitting, hands on the knees, the hat on the knees
    sl([[aX, aY + 1], [aX + 2, aY + 6], [aX + 4, aY + 11]]); hand(aX + 5, aY + 14);
    if (p.hat === 'knees') pen.poly([[hmL + 6, hipY + 1], [hmR + 3, hipY + 1], [hmR + 1, hipY + 5], [hmL + 8, hipY + 5]], (x, y) => PAL.straw(.65 + (y % 2) * .15, x, y));
  }
  if (arm === 'blow') { sl([[aX, aY + 1], [aX + 3, aY + 5], [aX + 5, aY + 9]]); hand(aX + 6, aY + 12); }
  if (arm === 'bow') { sl([[aX - 1, aY + 2], [aX + 1, aY + 6], [aX + 3, aY + 9]]); hand(aX + 4, aY + 11); farHand(shL - 1, aY + 11); }
  if (arm.startsWith('row')) {   // the stern oar: hands on the handle, the shaft runs down-right out of frame
    const k = +arm[3], hx0 = [aX + 7, aX + 9, aX + 5, aX + 3][k], hy0 = [aY + 4, aY + 8, aY + 9, aY + 5][k];
    sl([[aX, aY + 1], [(aX + hx0) / 2, (aY + hy0) / 2]]); hand(hx0, hy0); hand(hx0 - 3, hy0 + 1, 2.5);
    pen.line(hx0 - 6, hy0 - 1, hx0 + 16, hy0 + 16 + k * 1.2, PAL.wood(.75, 0, 0), 1.4);
    pen.line(hx0 - 6, hy0 - 1, hx0 - 2, hy0, PAL.wood(.9, 0, 0), 1.4);
  }
  // —— head ——
  drawFace(pen, { cx: hx, cy: hy, r: 6.3, skin, hair: c.hair, hairCol: c.hairCol, hat: p.hat === 'off' || p.hat === 'knees' || p.hat === 'cup' ? (c.hatOff || null) : c.hat, old: c.old, expr: p.expr || c.expr || 'calm', blink: p.blink, look: p.look, flower: c.flower });
}

// —— Child body (3/4 view facing right). Frame 40×58, feet at y=56; 40 units tall ——
function drawChild(pen, c, p) {
  const S = pen.S, by = p.bob || 0, sit = !!p.sit;
  const top = c.top, bot = c.bot, skin = c.skin;
  const hipY = sit ? 46 : 42, torsoTop = (sit ? 34 : 30) + by, hx = 18, hy = torsoTop - 7.5;
  if (sit) { pen.poly([[12, hipY], [24, hipY], [26, hipY + 6], [14, hipY + 7]], (x, y) => bot(.55, x, y)); pen.rect(23, hipY + 5, 3.5, 4, bot(.5, 0, 0)); pen.rect(17, hipY + 6, 3.5, 4, bot(.4, 0, 0)); pen.rect(23, hipY + 9, 4.5, 1.6, c.shoe(.5, 0, 0)); pen.rect(17, hipY + 10, 4.5, 1.6, c.shoe(.4, 0, 0)); }
  else {
    const st = p.step ?? -1;
    const legs = st < 0 ? [[14, 0], [19, 0]] : [[[12, 0], [21, -1]], [[15, -1], [18, 0]], [[21, -1], [12, 0]], [[18, 0], [15, -1]]][st];
    legs.forEach(([lx, ly], i) => { pen.poly([[lx, hipY], [lx + 4, hipY], [lx + 4, 53 + ly], [lx, 53 + ly]], (x, y) => bot((i ? .55 : .8), x, y)); pen.rect(lx - .5, 53 + ly, 5.5, 2.5, c.shoe(i ? .45 : .65, 0, 0)); pen.rect(lx - .5, 55 + ly, 6, 1, c.shoe(.2, 0, 0)); });
  }
  const shL = 11, shR = 24;
  pen.poly([[shL, torsoTop], [shR, torsoTop], [shR + 1, hipY + 1], [shL - 1, hipY + 1]], (x, y) => { const u = (y - torsoTop) / (hipY + 1 - torsoTop), s = (x - shL) / (shR - shL); let v = .7 - s * .4; if (c.stripe && s > .62 && s < .72) return PAL.trackW(.8, x, y); return top(v, x, y); });
  if (c.scarf) { pen.poly([[shL + 3, torsoTop - 1], [shR - 3, torsoTop - 1], [shL + 9, torsoTop + 6]], (x, y) => PAL.red(.7, x, y)); }
  if (c.satchel) { pen.poly([[shR - 4, torsoTop + 1], [shR - 2, torsoTop + 1], [shL + 2, hipY], [shL, hipY - 1]], (x, y) => PAL.brown(.5, x, y)); pen.rect(shL - 2, hipY - 4, 6, 6, PAL.brown(.6, 0, 0)); }
  const arm = p.arm || 'low', sl = (pts) => pts.forEach(([x, y]) => pen.rect(x - 1.25, y - 1.25, 2.5, 2.5, top(.45, x, y)));
  const hand = (x, y) => pen.rect(x - 1.25, y - 1.25, 2.5, 2.5, skin(.55, 0, 0));
  const aX = shR - 2, aY = torsoTop + 2;
  if (arm === 'low') { sl([[aX, aY], [aX + 1, aY + 4], [aX + 1, aY + 8]]); hand(aX + 1, aY + 10.5); }
  if (arm === 'wave') { sl([[aX, aY], [aX + 2, aY - 3], [aX + 4, aY - 6], [aX + 5, aY - 9]]); hand(aX + 5 + (p.w || 0), aY - 12); }
  if (arm === 'drop') { sl([[aX, aY], [aX + 4, aY + 3], [aX + 7, aY + 7], [aX + 9, aY + 11]]); hand(aX + 10, aY + 13.5); if (p.boat) paperBoat(pen, aX + 12, aY + 12.5, 1); }
  if (arm === 'hold') { sl([[aX, aY], [aX + 4, aY + 2], [aX + 7, aY + 3]]); hand(aX + 9, aY + 4); sl([[shL + 1, aY], [shL + 5, aY + 2], [shL + 9, aY + 3]]); hand(shL + 11, aY + 4); if (p.boat) paperBoat(pen, aX + 9, aY + 1, 1.2, p.boatText); }
  if (arm === 'run') { const k = p.step || 0; sl([[aX, aY], [aX + 3, aY + (k % 2 ? 3 : -2)], [aX + 5, aY + (k % 2 ? 6 : -1)]]); hand(aX + 6, aY + (k % 2 ? 8 : 0)); }
  drawFace(pen, { cx: hx, cy: hy, r: 5.4, skin, hair: c.hair, hat: p.hat === 'off' ? null : c.hat, kid: true, expr: p.expr || c.expr || 'calm', blink: p.blink, look: p.look });
}

// a folded paper boat (side view): hull trapezoid + the sail triangle
export function paperBoat(pen, x, y, k = 1, text = null) {
  pen.poly([[x - 5 * k, y], [x + 5 * k, y], [x + 3 * k, y + 2.2 * k], [x - 3 * k, y + 2.2 * k]], (px, py) => PAL.paper(.75 - (py - y) * .1, px, py));
  pen.poly([[x - 1.8 * k, y], [x + 1.8 * k, y], [x, y - 3.2 * k]], (px, py) => PAL.paper(.9, px, py));
  pen.rect(x - 5 * k, y - .3, 10 * k, .7, PAL.paper(.35, 0, 0));
}

// —— The goose (frame 30×30, feet at y=28) ——
function drawGoose(pen, c, p) {
  const G = PAL.goose, pose = p.pose || 'idle', S = pen.S;
  const bob = p.bob || 0;
  // feet
  if (pose !== 'sit') for (const fx of [11, 16]) { pen.rect(fx, 25 + bob, 3, 3, PAL.beak(.6, 0, 0)); pen.rect(fx - 1, 27, 5, 1, PAL.beak(.4, 0, 0)); }
  // body: an egg, tail up-left
  const byy = (pose === 'sit' ? 22 : 19) + bob;
  pen.ell(13, byy, 9, 5.5, (x, y, dx, dy) => G(.7 - dy * .3 - dx * .1, x, y));
  pen.poly([[4, byy - 2], [7, byy - 6], [9, byy - 1]], (x, y) => G(.8, x, y));
  // wings
  if (pose === 'flap0' || pose === 'flap1') { const up = pose === 'flap0' ? -10 : -4; pen.poly([[10, byy - 3], [15, byy - 3], [18, byy + up], [6, byy + up + 2]], (x, y) => G(.85 - (y - byy) * .01, x, y)); pen.poly([[12, byy - 2], [16, byy - 2], [21, byy + up + 3], [10, byy + up + 2]], (x, y) => G(.6, x, y)); }
  else pen.ell(12, byy - 1, 6, 3, (x, y, dx, dy) => G(.55 - dy * .2, x, y));
  // neck + head
  const back = pose === 'refuse';
  const nx = back ? 14 : 20, ny0 = byy - 3, hx = pose === 'honk' ? 24 : back ? 13 : pose === 'sit' ? 21 : 23, hy = pose === 'honk' ? 3 + bob : back ? 6 + bob : pose === 'sit' ? 12 + bob : 7 + bob;
  pen.line(nx, ny0, hx - 1, hy + 3, G(.7, 0, 0), 2.6);
  pen.ell(hx, hy, 3.2, 2.8, (x, y, dx, dy) => G(.8 - dy * .25, x, y));
  const open = pose === 'honk' ? 1.6 : 0;
  pen.poly([[hx + 2, hy - 1], [hx + 7, hy - .5 - open], [hx + 2, hy + .8]], (x, y) => PAL.beak(.8, x, y));
  if (open) pen.poly([[hx + 2, hy + .2], [hx + 6.5, hy + 1.6], [hx + 2, hy + 1.8]], (x, y) => PAL.beak(.5, x, y));
  pen.rect(hx + 2.4, hy - 1.6, 1.6, 1, PAL.beak(.3, 0, 0));   // the knob
  if (S >= 2) { pen.ell(hx + .6, hy - .6, .75, .75, INK); pen.rect(hx + .5, hy - .9, .35, .35, hex('#ffffff')); } else pen.px(hx + .4, hy - .8, INK);
  if (pose === 'refuse') { pen.rect(hx - 3, hy - 4, 1.2, .6, INK); }   // a cross brow
}

// —— Atlas builder ——
export function atlasOf(draw, cfg, table, S, FW, FH) {
  const names = Object.keys(table), n = names.length;
  const P = new PX(FW * S * n, FH * S), E = new PX(FW * S * n, FH * S);
  names.forEach((k, i) => {
    const p1 = new PX(FW * S, FH * S), e1 = new PX(FW * S, FH * S);
    draw(new Pen(p1, e1, S), cfg, table[k]); p1.outline(.3);
    for (let y = 0; y < FH * S; y++) for (let x = 0; x < FW * S; x++) { const c = p1.get(x, y); if (c) P.set(i * FW * S + x, y, c); const e = e1.get(x, y); if (e) E.set(i * FW * S + x, y, e); }
  });
  const tex = texOf(P.done()), em = texOf(E.done());
  for (const t of [tex, em]) t.repeat.set(1 / n, 1);
  return { tex, em, names, n, canvas: P.c, FW, FH };
}

// —— Character configs ——
export const CFG = {
  lz:   { kind: 'adult', skin: PAL.skinOld, hair: 'stubble', hat: 'straw', hatOff: 'stubble', old: true, top: PAL.indigo, bot: PAL.greyTr, shoe: PAL.sandal, towel: true, rolled: true, fold: true, expr: 'calm' },
  mo:   { kind: 'adult', skin: PAL.skin, hair: 'bun', top: PAL.plum, bot: PAL.dark, shoe: PAL.dark, collar: PAL.cream, expr: 'worry' },
  br:   { kind: 'adult', skin: PAL.skin, hair: 'bun', hat: 'veil', flower: true, top: PAL.red, bot: PAL.red, shoe: PAL.red, sash: PAL.gold, expr: 'happy' },
  gr:   { kind: 'adult', skin: PAL.skin, hair: 'black', hat: 'cap', top: PAL.red, bot: PAL.dark, shoe: PAL.dark, sash: PAL.gold, expr: 'smile' },
  gu1:  { kind: 'adult', skin: PAL.skin, hair: 'black', top: PAL.teal, bot: PAL.dark, shoe: PAL.dark, expr: 'smile' },
  gu2:  { kind: 'adult', skin: PAL.skin, hair: 'bun', top: PAL.pink, bot: PAL.greyBl, shoe: PAL.dark, expr: 'happy' },
  gu3:  { kind: 'adult', skin: PAL.skin, hair: 'black', top: PAL.olive, bot: PAL.brown, shoe: PAL.dark, expr: 'smile' },
  gu4:  { kind: 'adult', skin: PAL.skin, hair: 'black', top: PAL.greyBl, bot: PAL.dark, shoe: PAL.dark, expr: 'happy' },
  ob:   { kind: 'adult', skin: PAL.skinOld, hair: 'grey', old: true, stoop: 1, top: PAL.brown, bot: PAL.greyTr, shoe: PAL.dark, expr: 'calm' },
  ow:   { kind: 'adult', skin: PAL.skinOld, hair: 'bun', hairCol: PAL.hairG, old: true, stoop: 1, top: PAL.greyBl, bot: PAL.dark, shoe: PAL.dark, expr: 'smile' },
  nurse:{ kind: 'adult', skin: PAL.skin, hair: 'black', hat: 'nurse', top: PAL.white, bot: PAL.white, shoe: PAL.dark, expr: 'calm' },
  xs:   { kind: 'child', skin: PAL.skinKid, hair: 'black', hat: 'ycap', top: PAL.track, bot: PAL.track, shoe: PAL.white, scarf: true, stripe: true, satchel: true, expr: 'calm' },
  k1:   { kind: 'child', skin: PAL.skinKid, hair: 'black', top: PAL.track, bot: PAL.track, shoe: PAL.white, scarf: true, stripe: true, satchel: true, expr: 'smile' },
  k2:   { kind: 'child', skin: PAL.skinKid, hair: 'bun', top: PAL.track, bot: PAL.track, shoe: PAL.white, scarf: true, stripe: true, expr: 'happy' },
  k3:   { kind: 'child', skin: PAL.skinKid, hair: 'black', top: PAL.track, bot: PAL.track, shoe: PAL.white, scarf: true, satchel: true, expr: 'calm' },
  goose:{ kind: 'goose' },
  t1:   { kind: 'adult', skin: PAL.skin, hair: 'black', top: PAL.greyBl, bot: PAL.dark, shoe: PAL.dark, expr: 'smile' },
  t2:   { kind: 'adult', skin: PAL.skin, hair: 'bun', top: PAL.olive, bot: PAL.greyTr, shoe: PAL.dark, expr: 'happy' },
  t3:   { kind: 'adult', skin: PAL.skinOld, hair: 'grey', old: true, top: PAL.brown, bot: PAL.dark, shoe: PAL.dark, expr: 'smile' },
  t4:   { kind: 'adult', skin: PAL.skin, hair: 'black', top: PAL.teal, bot: PAL.greyBl, shoe: PAL.dark, expr: 'calm' },
};
// pose tables
const WALK = (extra = {}) => ({ w0: { step: 0, ...extra }, w1: { step: 1, bob: -1, ...extra }, w2: { step: 2, ...extra }, w3: { step: 3, bob: -1, ...extra } });
export const POSES = {
  lz: {
    idle0: {}, idle1: { bob: 1 }, blink: { blink: 1 },
    row0: { arm: 'row0', lean: 1 }, row1: { arm: 'row1', lean: 1.5 }, row2: { arm: 'row2', lean: -.5 }, row3: { arm: 'row3', lean: -1 },
    rowSmile0: { arm: 'row0', lean: 1, expr: 'smile' }, rowSmile1: { arm: 'row1', lean: 1.5, expr: 'smile' }, rowSmile2: { arm: 'row2', lean: -.5, expr: 'smile' }, rowSmile3: { arm: 'row3', lean: -1, expr: 'smile' },
    rowHard0: { arm: 'row0', lean: 2, expr: 'firm' }, rowHard1: { arm: 'row1', lean: 3, expr: 'firm' }, rowHard2: { arm: 'row2', lean: 0, expr: 'firm' }, rowHard3: { arm: 'row3', lean: -1.5, expr: 'firm' },
    wave0: { arm: 'wave', expr: 'smile' }, wave1: { arm: 'wave', w: 1, expr: 'smile' },
    catchUp: { arm: 'up2', hat: 'off', expr: 'smile' }, catchDone: { arm: 'hold', hat: 'off', expr: 'happy' },
    smile: { expr: 'smile' }, calm: { expr: 'calm' }, grave: { expr: 'grave' }, firm: { expr: 'firm' }, fear: { expr: 'fear' }, tender: { expr: 'tender' }, tired: { expr: 'tired' },
    lookDown: { expr: 'grave', look: -1 }, lookUp: { expr: 'calm', look: 1 }, lookUpSmile: { expr: 'smile', look: 1 }, lookUpWide: { expr: 'wide', look: 1 },
    rope0: { arm: 'rope', lean: 1 }, rope1: { arm: 'rope', lean: 2, bob: 1 },
    sit: { sit: 1, arm: 'knees', hat: 'knees', expr: 'tired' }, sitLook: { sit: 1, arm: 'knees', hat: 'knees', expr: 'calm', look: 1 }, sitBlink: { sit: 1, arm: 'knees', hat: 'knees', expr: 'tired', blink: 1 },
    sitTender: { sit: 1, arm: 'knees', hat: 'knees', expr: 'tender', look: 1 }, sitWide: { sit: 1, arm: 'knees', hat: 'knees', expr: 'wide', look: 1 },
    breath: { sit: 1, arm: 'blow', hat: 'knees', expr: 'closed', lean: -1 }, blow: { sit: 1, arm: 'blow', hat: 'knees', expr: 'blow', lean: 2 },
    match: { arm: 'match', expr: 'firm', lean: 1 }, matchLit: { arm: 'match', expr: 'tender', lean: 1 },
    cup: { arm: 'cup', hat: 'cup', expr: 'firm', lean: 2 }, cupRelief: { arm: 'cup', hat: 'cup', expr: 'tender', lean: 1 },
    standBreath0: { expr: 'tired', lean: 1 }, standBreath1: { expr: 'tired', lean: 2, bob: 1 },
    kneel: { kneel: 1, arm: 'hold', expr: 'tender', look: -1 }, kneelSet: { kneel: 1, arm: 'point', expr: 'tender', look: -1 },
    hold: { arm: 'hold', expr: 'tender' },
    ...WALK(),
  },
  xs: {
    sit: { sit: 1 }, sit1: { sit: 1, bob: 1 }, sitBlink: { sit: 1, blink: 1 }, sitAsk: { sit: 1, expr: 'ask' }, sitSmile: { sit: 1, expr: 'smile' }, sitLook: { sit: 1, expr: 'calm', look: 1 },
    drop0: { sit: 1, arm: 'drop', boat: 1, expr: 'smile', look: -1 }, drop1: { sit: 1, arm: 'drop', expr: 'smile', look: -1 },
    wave0: { arm: 'wave', expr: 'happy' }, wave1: { arm: 'wave', w: 1, expr: 'happy' },
    idle0: {}, idle1: { bob: 1 },
    hold: { arm: 'hold', boat: 1, expr: 'shy' }, holdUp: { arm: 'hold', boat: 1, expr: 'smile', look: 1 },
    fever: { expr: 'fever' },
    ...WALK({ arm: 'run', expr: 'happy' }),
  },
  kid: { sit: { sit: 1 }, sit1: { sit: 1, bob: 1 }, idle0: {}, idle1: { bob: 1 }, ...WALK({ arm: 'run' }) },
  mo: { ...WALK({ arm: 'carry', expr: 'fear', lean: 2 }), stand: { arm: 'carry', expr: 'fear' }, plead: { arm: 'carry', expr: 'shout', lean: 1 }, relief: { arm: 'carry', expr: 'tender' }, idle0: { arm: 'carry', expr: 'worry' }, idle1: { arm: 'carry', expr: 'worry', bob: 1 }, walk: { arm: 'low', expr: 'smile' } },
  br: { idle0: { expr: 'happy' }, idle1: { bob: 1, expr: 'happy' }, toss: { arm: 'wave', expr: 'happy' }, hold: { arm: 'hold', expr: 'happy' }, ...WALK({ expr: 'happy' }) },
  gr: { idle0: { expr: 'smile' }, idle1: { bob: 1, expr: 'smile' }, hat: { arm: 'wave', expr: 'fear' }, ...WALK({ expr: 'smile' }) },
  gu: { closed: { arm: 'umb', umb: 'closed' }, half: { arm: 'umb', umb: 'half' }, open: { arm: 'umb', umb: 'open' }, open1: { arm: 'umb', umb: 'open', bob: 1 }, flip: { arm: 'umb', umb: 'flip', expr: 'fear' }, ...WALK({ arm: 'umb', umb: 'open' }), idle0: {}, idle1: { bob: 1 } },
  drum: { d0: { arm: 'drum' }, d1: { arm: 'drum', beat: 1 }, ...WALK({ arm: 'drum' }) },
  ob: { idle0: { arm: 'cane' }, idle1: { arm: 'cane', bob: 1 }, coax0: { arm: 'up2', expr: 'ask' }, coax1: { arm: 'up2', expr: 'ask', bob: 1 }, ask: { arm: 'cane', expr: 'ask' }, nod: { arm: 'cane', look: -1, expr: 'smile' }, ...WALK({ arm: 'cane' }) },
  ow: { idle0: { arm: 'basket' }, idle1: { arm: 'basket', bob: 1 }, bow: { arm: 'bow', lean: 3, look: -1, expr: 'smile' }, ...WALK({ arm: 'basket' }) },
  nurse: { idle0: { arm: 'hold' }, idle1: { arm: 'hold', bob: 1 }, open: { arm: 'point', expr: 'fear' } },
  goose: { idle: { pose: 'idle' }, idle1: { pose: 'idle', bob: 1 }, honk: { pose: 'honk' }, flap0: { pose: 'flap0' }, flap1: { pose: 'flap1' }, refuse: { pose: 'refuse' }, sit: { pose: 'sit' }, walk0: { pose: 'idle', bob: 0 }, walk1: { pose: 'idle', bob: -1 } },
  town: { idle0: {}, idle1: { bob: 1 }, ...WALK(), cheer0: { arm: 'up2', expr: 'happy' }, cheer1: { arm: 'up2', expr: 'happy', bob: 1 } },
};

const DRAW = { adult: drawAdult, child: drawChild, goose: drawGoose };
// Character object: billboard + shadow blob; frame(name) swaps the atlas window; face(cam, flip) turns it to the lens
export function makeChar(id, posesId, S = 1, extra = {}) {
  const cfg = CFG[id], draw = DRAW[cfg.kind], table = { ...(POSES[posesId] || POSES[id]), ...extra };
  const FW = cfg.kind === 'goose' ? 30 : 40, FH = cfg.kind === 'goose' ? 30 : 58;
  const A = atlasOf(draw, cfg, table, S, FW, FH);
  const mesh = billboard(A.tex, FW * SPX, FH * SPX, { em: A.em, emCol: '#ffffff', emI: 2.4 });
  mesh.material.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <output_fragment>', 'outgoingLight = min(outgoingLight, diffuseColor.rgb * 1.45 + totalEmissiveRadiance);\n#include <output_fragment>'); };
  const root = new THREE.Group(); root.add(mesh); root.userData.char = id;
  const sh = blob(cfg.kind === 'goose' ? .22 : .4, .5); sh.position.y = .015; root.add(sh);
  const self = {
    id, root, mesh, atlas: A, shadowBlob: sh, S, cur: null,
    frame(name) { const i = A.names.indexOf(name); if (i < 0) throw new Error(id + ' frame ' + name); A.tex.offset.x = A.em.offset.x = i / A.n; self.cur = name; },
    face(cam, flip = false) { root.rotation.y = Math.atan2(cam.position.x - root.position.x, cam.position.z - root.position.z); mesh.scale.x = flip ? -1 : 1; },
    // world position of a point given in frame units (x from the left edge, y from the top)
    at(ux, uy, flip = false) { const v = new THREE.Vector3((ux - FW / 2) * SPX * (flip ? -1 : 1), (FH - uy) * SPX, .06); v.applyAxisAngle(new THREE.Vector3(0, 1, 0), root.rotation.y); return v.add(root.position); },
    headPos(flip = false) { return self.at(cfg.kind === 'child' ? 18 : 18, cfg.kind === 'child' ? 23 : 9, flip); },
  };
  return self;
}
export { drawAdult, drawChild, drawGoose, Pen, EXPR };
