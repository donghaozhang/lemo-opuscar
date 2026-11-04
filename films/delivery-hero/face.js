// face.js — parametric faces: one model per character drawn at any scale (s≈1.1 for 32×32 portraits, s≈3 for close-up busts)
// Head unit space: centre (0,0), y down; a head is ~22 units tall. 3/4 view facing right (flip for left).
import { C, T, FB, sprite, outline, clamp, lerp } from './px.js';

const SK = { d: C.skinS, m: C.skin, l: C.sand, line: C.dbrown };
// expression presets: brow [tilt (+ = inner end up: worried/sad; − = inner down: angry/determined), raise], lid (0 open..1 closed), low (lower lid up: smile/squint),
// pup [dx,dy] (−1..1), mouth, extras
export const EXPR = {
  neutral: { brow: [0, 0], lid: .15, low: 0, pup: [.3, 0], mouth: 'flat' },
  sleepy: { brow: [.2, -.4], lid: .78, low: .2, pup: [0, .4], mouth: 'drool' },
  startled: { brow: [.1, 1.4], lid: -.15, low: 0, pup: [0, 0], pupS: .6, mouth: 'o', shock: 1 },
  determined: { brow: [-1, -.2], lid: .3, low: .15, pup: [.6, 0], mouth: 'grin' },
  dread: { brow: [1.1, .6], lid: .05, low: 0, pup: [.2, -.5], pupS: .7, mouth: 'wobble', sweat: 1 },
  deadpan: { brow: [0, -.3], lid: .55, low: .1, pup: [.8, 0], mouth: 'flat' },
  tired: { brow: [.6, -.1], lid: .5, low: .1, pup: [.2, .5], mouth: 'pant', sweat: 1 },
  soft: { brow: [.5, .2], lid: .3, low: .35, pup: [.4, .1], mouth: 'smile' },
  hesitant: { brow: [.8, .3], lid: .25, low: 0, pup: [.1, .7], mouth: 'flat2' },
  sing: { brow: [.4, .5], lid: .6, low: .5, pup: [.2, 0], mouth: 'sing' },
  wink: { brow: [-.2, .4], lid: .1, low: .3, pup: [.6, 0], mouth: 'grin', wink: 1 },
  happy: { brow: [.2, .6], lid: 0, low: .55, pup: [.3, 0], mouth: 'open' },
  sadWet: { brow: [1.2, .2], lid: .35, low: 0, pup: [-.2, .6], mouth: 'frown', drip: 1 },
  joy: { brow: [.3, .8], lid: 1, low: .8, pup: [.3, 0], mouth: 'open', blush: 1 },
  surprised: { brow: [.2, 1.2], lid: -.1, low: 0, pup: [.3, 0], pupS: .75, mouth: 'o' },
  wistful: { brow: [.9, .1], lid: .45, low: .2, pup: [-.3, .5], mouth: 'smallsmile' },
  tearful: { brow: [1, .3], lid: .35, low: .6, pup: [.2, 0], mouth: 'smile', tear: 1, blush: 1 },
  overjoyed: { brow: [.5, 1], lid: 0, low: .8, pup: [0, 0], mouth: 'open', blush: 1, tear: .5 },
  scared: { brow: [1.3, 1.2], lid: -.2, low: 0, pup: [-.6, 0], pupS: .55, mouth: 'scream', sweat: 1, shock: 1 },
};

// —— characters ——
export const CHAR = {
  rider: { w: 1, eyeIris: C.dbrown, brow: C.ink, skin: SK, hair: [C.ink, C.night, C.dslate] },
  kid: { w: .92, eyeIris: C.dbrown, brow: C.umber, skin: SK, hair: [C.ink, C.umber, C.dbrown], big: 1.15 },
  lady: { w: .95, eyeIris: C.umber, brow: C.slate, skin: { d: C.skinS, m: C.skin, l: C.sand, line: C.brown }, hair: [C.slate, C.steel, C.silver] },
};

function P(f, s, ox, oy, x, y) { return [ox + x * s, oy + y * s]; }
// one eye. (ex,ey) centre in px; ew,eh half sizes in px; near = bigger eye
function eye(f, cx, cy, ew, eh, e, ch, s, far) {
  const lid = clamp(e.wink && !far ? 1 : e.lid, -.3, 1), low = clamp(e.low, 0, 1);
  const top = cy - eh + lid * 2 * eh, bot = cy + eh - low * eh * 1.1;
  const pr = Math.max(1, Math.min(ew, eh) * .78 * (e.pupS || 1));
  const px = cx + e.pup[0] * (ew - pr) * .9, py = cy + e.pup[1] * (eh - pr) * .8;
  if (lid >= .92) { // closed: a lid arc (smiling if low>0)
    const k = Math.max(1, Math.round(s * .55));
    for (let x = Math.floor(cx - ew); x <= Math.ceil(cx + ew); x++) { const u = (x + .5 - cx) / ew; const yy = cy + (low > .2 ? -1 : .3) * eh * .5 * (1 - u * u) + eh * .3; for (let j = 0; j < k; j++) f.px(x, Math.round(yy) + j, C.ink); }
    return;
  }
  for (let y = Math.floor(cy - eh - 1); y <= Math.ceil(cy + eh + 1); y++) for (let x = Math.floor(cx - ew - 1); x <= Math.ceil(cx + ew + 1); x++) {
    const X = x + .5, Y = y + .5, nx = (X - cx) / ew, ny = (Y - cy) / eh;
    if (nx * nx + ny * ny > 1.0 || Y < top || Y > bot) continue;
    const dp = Math.hypot(X - px, Y - py);
    let c = C.white;
    if (dp <= pr) c = s >= 2 && dp > pr * .55 ? ch.eyeIris : C.ink;
    f.px(x, y, c);
  }
  // highlight
  if (s >= 2) { const hr = Math.max(1, Math.round(pr * .3)); f.rect(Math.round(px - pr * .45), Math.round(py - pr * .5), hr, hr, C.white); }
  else if (pr >= 1 && eh >= 2) f.px(Math.round(px - .6), Math.round(py - .8), C.white);
  // upper lid line (thick), with lash flick at the outer end
  const k = Math.max(1, Math.round(s * .6));
  for (let x = Math.floor(cx - ew - (s >= 2 ? 1 : 0)); x <= Math.ceil(cx + ew); x++) {
    const u = (x + .5 - cx) / ew; if (Math.abs(u) > 1.12) continue;
    const ye = cy - eh * Math.sqrt(Math.max(0, 1 - Math.min(1, u * u))); const yy = Math.max(ye, top) - (lid > .05 ? 0 : 0);
    for (let j = 0; j < k; j++) f.px(x, Math.round(yy - k + 1 + j), C.ink);
  }
  if (s >= 2) { f.px(Math.round(cx + ew + 1), Math.round(Math.max(top, cy - eh * .6) - k), C.ink); }
  // lower lid hint (smile squint)
  if (low > .25 && s >= 1.5) for (let x = Math.floor(cx - ew * .8); x <= Math.ceil(cx + ew * .8); x++) f.px(x, Math.round(bot + .5), ch.skin.d);
}
function brow(f, cx, cy, ew, eh, e, ch, s, far) {
  const [tilt, raise] = e.brow; const k = Math.max(1, Math.round(s * .75));
  const base = cy - eh - Math.max(1.5, s * 1.3) - raise * s * 1.4;
  // inner end is toward the face centre: near eye's inner end is to its right, far eye's inner end to its left
  const innerDir = far ? -1 : 1;
  const len = ew * 1.25;
  for (let x = Math.floor(cx - len); x <= Math.ceil(cx + len); x++) {
    const u = (x + .5 - cx) / len; if (Math.abs(u) > 1) continue;
    const yy = base - tilt * u * innerDir * s * 1.3 - (1 - u * u) * s * .5;
    for (let j = 0; j < k; j++) f.px(x, Math.round(yy) + j, ch.brow);
  }
}
function mouth(f, mx, my, s, e, ch) {
  const m = e.mouth, u = Math.max(1, s), line = C.ink, inside = C.crimson, tongue = C.rose;
  const w = 2.4 * u;
  const curve = (amp, w2 = w, th = Math.max(1, Math.round(s * .55))) => { for (let x = Math.floor(mx - w2); x <= Math.ceil(mx + w2); x++) { const v = (x + .5 - mx) / w2; const y = my + amp * (1 - v * v) - amp * .5; for (let j = 0; j < th; j++) f.px(x, Math.round(y) + j, line); } };
  if (m === 'flat') { curve(0, w * .8); return; }
  if (m === 'flat2') { curve(.3 * u, w * .55); return; }
  if (m === 'smile') { curve(1.1 * u); return; }
  if (m === 'smallsmile') { curve(.7 * u, w * .7); return; }
  if (m === 'frown') { curve(-1.0 * u, w * .8); return; }
  if (m === 'smirk') { curve(.6 * u, w * .7); f.px(mx + w * .8, my - u * .6, line); return; }
  if (m === 'wobble') { for (let x = Math.floor(mx - w); x <= Math.ceil(mx + w); x++) { const y = my + Math.round(Math.sin((x - mx) / u * 2.2) * .7 * u); f.px(x, y, line); if (s > 2) f.px(x, y + 1, line); } return; }
  if (m === 'drool') { curve(.2 * u, w * .6); f.px(mx + w * .7, my + 1, C.cyan); f.px(mx + w * .7, my + 2, C.cyan); if (s > 2) f.rect(mx + w * .7, my, 2, 3 * u, C.cyan); return; }
  const open = (rx, ry, oy = 0) => {
    f.ell(mx, my + oy, rx, ry, (x, y, nx, ny) => (nx * nx + ny * ny > .62 && s >= 2) ? line : ny > .35 && s >= 2 ? tongue : inside);
    if (s < 2) { f.px(Math.round(mx - rx), Math.round(my + oy), line); f.px(Math.round(mx + rx - 1), Math.round(my + oy), line); }
  };
  if (m === 'o') { open(1.1 * u, 1.4 * u, .5 * u); return; }
  if (m === 'scream') { open(1.6 * u, 1.9 * u, .7 * u); return; }
  if (m === 'pant') { open(1.4 * u, .9 * u, .2 * u); return; }
  if (m === 'sing') { open(1.2 * u, 1.3 * u, .4 * u); return; }
  if (m === 'grin') { // D-shaped with teeth
    f.poly([[mx - w, my - .4 * u], [mx + w, my - .6 * u], [mx + w * .6, my + 1.3 * u], [mx - w * .5, my + 1.1 * u]], s >= 2 ? inside : C.ink);
    if (s >= 2) f.rect(mx - w + 1, my - .5 * u, w * 2 - 2, Math.max(1, .6 * u), C.white);
    return;
  }
  if (m === 'open') { // happy open smile
    f.poly([[mx - w * 1.05, my - .5 * u], [mx + w * 1.05, my - .5 * u], [mx + w * .55, my + 1.4 * u], [mx - w * .55, my + 1.4 * u]], s >= 2 ? inside : C.ink);
    if (s >= 2) { f.ell(mx, my + 1 * u, w * .45, .5 * u, tongue); f.rect(mx - w + 1, my - .5 * u, w * 2 - 2, 1, line); }
    return;
  }
  curve(0);
}

// draw a head into f with centre (ox, oy) at scale s. Returns key points (eyes, mouth, top) in px.
export function head(f, who, e, ox, oy, s, o = {}) {
  const ch = CHAR[who], k = s * (ch.big || 1), sk = ch.skin;
  const hx = o.turn ?? 0;                     // −1..1 small head turn (shifts features)
  const R = 10 * k * ch.w, RY = 11 * k;
  // skin shading: light from the upper left
  const shade = (x, y, nx, ny) => { const l = -nx * .55 - ny * .5; return l > .55 ? sk.l : l < -.32 ? sk.d : sk.m; };
  // jaw/cheek: head ellipse + chin pushed toward facing side
  f.ell(ox, oy, R, RY, shade);
  f.ell(ox + 2.5 * k, oy + 4.5 * k, R * .62, RY * .55, shade);
  // ear (on the near side, left)
  f.ell(ox - R * .72, oy + 1.5 * k, 2.1 * k, 2.8 * k, (x, y, nx, ny) => nx * nx + ny * ny > .45 ? sk.d : sk.m);
  if (s >= 2) f.ell(ox - R * .72, oy + 1.5 * k, 1 * k, 1.6 * k, sk.line);
  // features
  const fx = ox + (2.6 + hx * 1.5) * k, fy = oy + 1.9 * k;
  const nearX = fx - 3.3 * k, farX = fx + 4.0 * k;
  const ew = Math.max(1.5, 2.3 * k * (ch.big ? 1.05 : 1)), eh = Math.max(2, 2.85 * k * (ch.big ? 1.05 : 1));
  const shock = e.shock ? 1.12 : 1;
  eye(f, nearX, fy, ew * shock, eh * shock, e, ch, s, false);
  eye(f, farX, fy, ew * .82 * shock, eh * .95 * shock, e, ch, s, true);
  brow(f, nearX, fy, ew, eh, e, ch, s, false);
  brow(f, farX, fy, ew * .85, eh, e, ch, s, true);
  // nose: a small shadow wedge on the far side
  const nx0 = fx + 1.3 * k, ny0 = fy + 3.2 * k;
  if (s >= 2) { f.poly([[nx0 + 1.6 * k, ny0 - 2.4 * k], [nx0 + 2.1 * k, ny0 + .4 * k], [nx0 - .2 * k, ny0 + .5 * k]], sk.d); f.px(nx0 - .2 * k, ny0 + .4 * k, sk.line); }
  else { f.px(Math.round(nx0 + 1), Math.round(ny0), sk.d); }
  // cheeks / blush
  if (e.blush) { const bc = C.pink; for (const [bx, bw] of [[nearX - .5 * k, 1.6 * k], [farX + 1 * k, 1.1 * k]]) for (let i = 0; i < Math.max(2, bw * 2); i++) if (i % 2 === 0 || s < 2) f.px(Math.round(bx - bw + i), Math.round(fy + eh + 1.5 * k), bc); }
  // mouth
  const mx = fx + .6 * k, my = fy + 6.0 * k;
  mouth(f, Math.round(mx), Math.round(my), s, e, ch);
  // lady: wrinkles + glasses
  if (who === 'lady') {
    if (s >= 2) { f.line(nearX - ew - 1.5 * k, fy + eh * .2, nearX - ew - .7 * k, fy + eh * .9, sk.line); f.line(fx - 1.5 * k, my - 1.4 * k, fx - 2.4 * k, my + .3 * k, sk.d); }
    if (s >= 2) {   // thin round glasses, wide enough to leave the eye clear
      const ring = (cx, rx, ry) => { for (let a = 0; a < 96; a++) { const t = a / 96 * Math.PI * 2; f.px(cx + Math.cos(t) * rx, fy + .4 * k + Math.sin(t) * ry, C.silver); } };
      ring(nearX, ew + 1.6 * k, eh + 1.3 * k); ring(farX, ew * .82 + 1.3 * k, eh + 1.3 * k);
      f.line(nearX + ew + 1.6 * k, fy, farX - ew * .82 - 1.3 * k, fy, C.silver);
    } else f.px(Math.round((nearX + farX) / 2), Math.round(fy - 1), C.silver);
  }
  // sweat / tear / drip
  if (e.sweat) { const sx = ox + R * .85, sy = oy - 3 * k; f.ell(sx, sy + 1.2 * k, 1.1 * k, 1.6 * k, C.cyan); f.px(sx, sy - .4 * k, C.cyan); if (s >= 2) f.px(sx - .3 * k, sy + .6 * k, C.white); }
  if (e.tear) { const tx = nearX + ew * .2, ty = fy + eh + .8 * k; const n = Math.max(1, Math.round(e.tear * 3 * k)); f.rect(tx, ty, Math.max(1, Math.round(k * .7)), n, C.cyan); f.px(tx, ty, C.white); }
  if (e.drip) { f.rect(ox + R * .3, oy - 4 * k, 1, 2 * k, C.cyan); f.rect(farX + 2 * k, fy + 5 * k, 1, 2 * k, C.cyan); }
  return { nearX, farX, fy, mx, my, R, RY, k };
}

// —— hair / helmet / accessories per character (drawn after the face) ——
export function hairBack(f, who, ox, oy, s, o = {}) {
  const ch = CHAR[who], k = s * (ch.big || 1), R = 10 * k * ch.w, RY = 11 * k, [hd, hm, hl] = ch.hair;
  if (who === 'rider') { // tuft out of the back of the helmet: 3 spikes
    f.poly([[ox - R * .6, oy - 1 * k], [ox - R - 4.5 * k, oy + 1.5 * k], [ox - R * .8, oy + 2.5 * k], [ox - R - 3.5 * k, oy + 5 * k], [ox - R * .5, oy + 5 * k], [ox - R - 1.5 * k, oy + 8 * k], [ox - R * .2, oy + 6 * k]], hm);
  }
  if (who === 'lady') { f.ell(ox - R * .5, oy - RY * 1.0, 5.2 * k, 4.4 * k, (x, y, nx, ny) => (-nx * .5 - ny * .6) > .3 ? hl : hm); }
  if (who === 'kid') {}
}
export function hairFront(f, who, ox, oy, s, e, o = {}) {
  const ch = CHAR[who], k = s * (ch.big || 1), R = 10 * k * ch.w, RY = 11 * k, [hd, hm, hl] = ch.hair;
  if (who === 'rider') {
    // helmet: orange shell covering the top to the brow line, white stripe, dark rim, strap, antenna flag
    const shell = (x, y, nx, ny) => { const l = -nx * .6 - ny * .55; return l > .55 ? C.amber : l < -.15 ? C.rust : C.orange; };
    const rim = oy - 5.2 * k;
    f.clip = [0, 0, f.w, Math.round(rim)]; f.ell(ox + .8 * k, oy - 1 * k, R * 1.12, RY * 1.02, shell); f.clip = [0, 0, f.w, f.h];
    f.rect(ox - R * 1.06, rim - Math.max(1, k * .9), R * 2.2, Math.max(1, Math.round(k * 1.1)), C.umber);
    // stripe
    f.clip = [0, 0, f.w, Math.round(rim - k)];
    for (let y = Math.floor(oy - RY * 1.1); y < rim; y++) { const xm = ox + .4 * k + (y - oy) * .25; f.rect(xm - 1.2 * k, y, Math.max(1, 2.2 * k), 1, C.white); }
    f.clip = [0, 0, f.w, f.h];
    f.poly([[ox - R * 1.0, rim], [ox - R * .55, rim], [ox - R * .62, oy - .5 * k], [ox - R * .92, oy + .5 * k]], hm);
    // strap: down the near cheek edge to under the chin
    f.line(ox - R * .78, rim, ox - R * .62, oy + RY * .55, C.umber); f.line(ox - R * .62, oy + RY * .55, ox + 1 * k, oy + RY * .98, C.umber);
    // antenna flag (silhouette mark)
    const ax = ox - 3 * k, ay = oy - RY * 1.02; const sway = o.sway || 0;
    f.line(ax, ay, ax - 2.2 * k + sway * k, ay - 7 * k, C.ink);
    f.poly([[ax - 2.2 * k + sway * k, ay - 7 * k], [ax + 2.6 * k + sway * k * 1.5, ay - 5.6 * k], [ax - 1.6 * k + sway * k, ay - 4.2 * k]], C.amber);
    if (o.hood) { // raincoat hood over the helmet
      f.clip = [0, 0, f.w, Math.round(rim + 1)];
      f.ell(ox + .5 * k, oy - .5 * k, R * 1.22, RY * 1.12, (x, y, nx, ny) => (-nx * .6 - ny * .5) > .5 ? C.cyan : C.blue);
      f.clip = [0, 0, f.w, f.h];
    }
  }
  if (who === 'kid') {
    const hair = (x, y, nx, ny) => { const l = -nx * .6 - ny * .6; return l > .6 ? hl : l < -.1 ? hd : hm; };
    f.clip = [0, 0, f.w, Math.round(oy - 2.6 * k)]; f.ell(ox, oy - .5 * k, R * 1.08, RY * 1.06, hair); f.clip = [0, 0, f.w, f.h];
    // fringe spikes over the forehead
    const by = oy - 2.8 * k;
    f.poly([[ox - R * .9, by - 2 * k], [ox - 3 * k, by + 2.2 * k], [ox - 1 * k, by - .5 * k], [ox + 2.5 * k, by + 2 * k], [ox + 3.5 * k, by - .5 * k], [ox + 7 * k, by + 1.5 * k], [ox + R, by - 2 * k]], hm);
    // side hair over the ear
    f.poly([[ox - R * 1.04, oy - 3 * k], [ox - R * .55, oy - 3 * k], [ox - R * .6, oy + 1 * k], [ox - R * .95, oy + 2.5 * k]], hm);
    // cowlick: 2 big spikes up (silhouette)
    f.poly([[ox - 2 * k, oy - RY * .9], [ox - 4.5 * k, oy - RY - 6 * k], [ox + .5 * k, oy - RY * .98], [ox + 1.5 * k, oy - RY - 4.5 * k], [ox + 3 * k, oy - RY * .9]], hm);
    if (o.wet) { for (const dx of [-5, 1, 6]) f.rect(ox + dx * k, by + 1.5 * k, 1, Math.max(1, 1.5 * k), C.cyan); }
  }
  if (who === 'lady') {
    const hair = (x, y, nx, ny) => { const l = -nx * .6 - ny * .6; return l > .5 ? hl : l < -.2 ? hd : hm; };
    f.clip = [0, 0, f.w, Math.round(oy - 2.4 * k)]; f.ell(ox, oy - .2 * k, R * 1.07, RY * 1.05, hair); f.clip = [0, 0, f.w, f.h];
    // parted waves at the temple + side hair over the ear
    f.poly([[ox - R * 1.05, oy - 3 * k], [ox - R * .5, oy - 2.6 * k], [ox - R * .6, oy + 2 * k], [ox - R * .95, oy + 3 * k]], hm);
    f.line(ox + 1 * k, oy - RY * .95, ox - 3 * k, oy - 3 * k, hd);
    // hairpin through the bun (red wood)
    const bx = ox - R * .45, by = oy - RY * .95;
    f.line(bx - 5 * k, by - 3.5 * k, bx + 3 * k, by + .5 * k, C.crimson); if (s >= 2) f.line(bx - 5 * k, by - 3.5 * k + 1, bx + 3 * k, by + .5 * k + 1, C.crimson);
    f.disc(bx - 5 * k, by - 3.5 * k, Math.max(1, .9 * k), C.red);
  }
}

// bust (close-up): torso + neck + head into a fresh sprite; returns {spr, pts}
// who, expr name|object, s scale, o: {w,h, hx, sway, hood, wet, look, body:'jacket'|'coat'|'cardigan'|'kidcoat', breath}
export function bust(who, ex, s, o = {}) {
  const e = typeof ex === 'string' ? EXPR[ex] : ex;
  const w = o.w || Math.round(44 * s), h = o.h || Math.round(40 * s);
  const f = sprite(w, h); const ox = Math.round(w * .48), oy = Math.round(h * .42) - (o.breath || 0);
  const k = s * (CHAR[who].big || 1);
  body(f, who, ox, oy, s, o, h);
  hairBack(f, who, ox, oy, s, o);
  // neck
  const sk = CHAR[who].skin;
  f.rect(ox - 3 * k, oy + 8 * k, 6.5 * k, 5 * k, sk.d);
  const pts = head(f, who, e, ox, oy, s, o);
  hairFront(f, who, ox, oy, s, e, o);
  outline(f, C.ink);
  return { spr: f, pts: { ...pts, ox, oy } };
}
function body(f, who, ox, oy, s, o, h) {
  const k = s * (CHAR[who].big || 1), sy = oy + 11.5 * k;
  const mats = {
    rider: [C.ink, C.night, C.navy, C.blue], coat: [C.ink, C.navy, C.blue, C.cyan], lady: [C.umber, C.plum, C.rose, C.pink], kid: [C.ink, C.dgreen, C.green, C.lime],
  };
  const m = who === 'rider' ? (o.hood || o.coat ? mats.coat : mats.rider) : who === 'lady' ? mats.lady : mats.kid;
  const sh = (x, y, nx, ny) => { const l = -nx * .5 - ny * .5; return l > .45 ? m[3] : l < -.25 ? m[1] : m[2]; };
  f.ell(ox + 1 * s, sy + 12 * s, 17 * s, 13 * s, sh); for (let y = Math.round(sy + 12 * s); y < h; y++) for (let x = Math.round(ox - 16 * s); x < ox + 18 * s; x++) f.px(x, y, sh(x, y, (x - ox) / (17 * s), 0));
  if (who === 'rider' && !(o.hood || o.coat)) { // reflective stripe + collar
    for (let x = Math.round(ox - 17 * s); x < ox + 18 * s; x++) for (let j = 0; j < Math.max(1, 1.4 * s); j++) if (f.get(x, sy + 8 * s + j) !== T) f.px(x, sy + 8 * s + j, C.amber);
    f.poly([[ox - 5 * s, sy - 1 * s], [ox + 6 * s, sy - 1 * s], [ox + 2 * s, sy + 5 * s]], C.night);
  }
  if (who === 'lady') { // collar of a white blouse + buttons
    f.poly([[ox - 5 * s, sy - 1 * s], [ox + 6 * s, sy - 1 * s], [ox + 1 * s, sy + 5 * s]], C.silver);
    for (let i = 0; i < 3; i++) f.px(ox + 1 * s, sy + (7 + i * 4) * s, C.sand);
  }
  if (who === 'kid') { // backpack straps
    f.rect(ox - 9 * s, sy + 1 * s, 2.5 * s, 18 * s, C.dgreen); f.rect(ox + 8 * s, sy + 1 * s, 2.5 * s, 18 * s, C.dgreen);
  }
}
// portrait 32×32 (dialog box): head and shoulders at s≈1.05
export function portrait(who, ex, o = {}) {
  const s = who === 'kid' ? 1.0 : 1.08;
  const b = bust(who, ex, s, { ...o, w: 32, h: 34 });
  return fb => fb.blit(b.spr, 0, who === 'lady' ? 1 : who === 'kid' ? 2 : 1);
}
