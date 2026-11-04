// 江户猫追鱼记 — the frame: shot → (scroll of view prints | one coverage sheet) → camera → sheets → overlays
import { clamp, lerp, seg, ss, eio, eo, ei, hash, mulberry, TAU } from '/core/lib.js';
import { W, H, FR, PAL, TX, mk, buildTextures, inkify, stampLayer, stampFn, drawSeal, cartouche, sealCanvas, vtext } from './print.js';
import { figure, catSide, gait, pose, blend, kite, fish } from './chars.js';
import { VIEWS, SLOT, SY, GAP, ORDER, BR, RB, SN, FD, PS, SEA, waveShape, BRIDGE, SNOWV, PASS, SEAV, FIELDS } from './views.js';
import { COVER } from './cover.js';
import { SHOTS, SH, SEC, DUR, HIT, q8, q12, beat } from './timeline.js';
import { testSheet } from './sheets_test.js';
import { events } from './events.js';

const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const QS = new URLSearchParams(location.search);
await document.fonts.load('400 40px Brush', '江户猫追鱼记一二三四五六七晨市骤雨雪寺稻田山岭怒涛暮归站住终鱼');
await document.fonts.load('600 40px Serif', '江户猫追鱼记站住终');
buildTextures();

// —— layer cache (LRU by pixel count) ——
const REG = [[0, 0], [2.2, -1.3], [-1.8, 1.9], [1.5, 2.2]];
const SHIFT = [[4, -5], [-6, 4], [5, 5], [-5, -4]];
const cache = new Map(); let cachePx = 0; const MAXPX = 1.1e8;
function layer(sheet, name) {
  const k = sheet.id + ':' + name;
  if (cache.has(k)) { const c = cache.get(k); cache.delete(k); cache.set(k, c); return c; }
  const d = sheet.layers[name], c = mk(sheet.w || W, sheet.h || H), x = c.getContext('2d');
  d.draw(x);
  const hk = hash(k.length * 7.3 + k.charCodeAt(0) + k.charCodeAt(k.length - 1));
  inkify(c, { speck: d.speck ?? .3, grain: (d.grain || 0) * 1.7, gx: hk * 400 - 200, baren: d.baren ?? (d.g ? .34 : .1), bx: (hk - .5) * 300, by: (hash(hk) - .5) * 200 });
  cache.set(k, c); cachePx += c.width * c.height;
  while (cachePx > MAXPX && cache.size > 1) { const [k0, c0] = cache.entries().next().value; cache.delete(k0); cachePx -= c0.width * c0.height; c0.width = c0.height = 0; }
  return c;
}
let TEXTS = [];
const SERIES = '江户猫追鱼记';
// —— one sheet: paper, border, blocks, live paint, cartouche, fibres ——
function drawSheet(sheet, M, t, o = {}) {
  const w = sheet.w || W, h = sheet.h || H, fr = { x0: FR.x0, y0: FR.y0, x1: w - (W - FR.x1), y1: h - (H - FR.y1) };
  ctx.save(); ctx.setTransform(M[0], M[1], M[2], M[3], M[4], M[5]);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip();
  for (let Y = 0; Y < h; Y += H) for (let X = 0; X < w; X += W) { ctx.save(); ctx.translate(X, Y); if ((X / W + Y / H) % 2) { ctx.translate(W, 0); ctx.scale(-1, 1); } ctx.drawImage(TX.paper, 0, 0); ctx.restore(); }
  ctx.save(); ctx.beginPath(); ctx.rect(fr.x0, fr.y0, fr.x1 - fr.x0, fr.y1 - fr.y0); ctx.clip();
  const R = {
    t, frozen: !!o.frozen, fr,
    L: (name, rev = 1) => { const g = sheet.layers[name].g; if (rev >= 1) ctx.drawImage(layer(sheet, name), REG[g][0], REG[g][1]); else if (rev > 0) stampLayer(ctx, layer(sheet, name), rev, REG[g], SHIFT[g]); },
    D: (g, fn) => { ctx.save(); ctx.translate(REG[g][0], REG[g][1]); fn(ctx); ctx.restore(); },
    fig: (fn, opt) => { if (!o.frozen) figure(ctx, fn, opt); },
    free: fn => { ctx.restore(); ctx.restore(); fn(ctx); ctx.save(); ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip(); ctx.save(); ctx.beginPath(); ctx.rect(fr.x0, fr.y0, fr.x1 - fr.x0, fr.y1 - fr.y0); ctx.clip(); },
  };
  sheet.paint(ctx, t, R);
  ctx.restore();
  // border: thick + thin
  ctx.strokeStyle = PAL.sumi; ctx.lineWidth = 3.4; ctx.strokeRect(fr.x0, fr.y0, fr.x1 - fr.x0, fr.y1 - fr.y0); ctx.lineWidth = 1.3; ctx.strokeRect(fr.x0 - 9, fr.y0 - 9, fr.x1 - fr.x0 + 18, fr.y1 - fr.y0 + 18);
  // view cartouche + seal
  const C = sheet.cart;
  if (C && !o.frozen) {
    const t0 = C.t0(), t1 = C.t1 ? C.t1() : 1e9;
    if (t >= t0 && t < t1) {
      const p = clamp((t - t0) / .35), sp = clamp((t - t0 - .5) / .3);
      let b; stampFn(ctx, x => { b = cartouche(x, C.x, C.y, C.title, { series: SERIES, w: 86, size: 52, ssize: 25 }); }, p, [0, -14]);
      if (b) {
        drawSeal(ctx, C.seal || '猫', C.x, b.y0 + b.h + 44, 56, sp, { seed: 3 + C.title.length, rot: .03 });
        if (p >= 1) { const sb = scr(M, b.x0, b.y0, b.x0 + b.w, b.y0 + b.h); TEXTS.push({ id: 'cart-' + sheet.id + '-s', text: SERIES, ...sb }); TEXTS.push({ id: 'cart-' + sheet.id, text: C.title, ...sb }); }
      }
    }
  }
  if (sheet.after) sheet.after(ctx, t, R);
  ctx.drawImage(TX.fiber, 0, 0); if (w > W) ctx.drawImage(TX.fiber, W, 0); if (h > H) ctx.drawImage(TX.fiber, 0, H);
  ctx.restore(); ctx.restore();
}
const scr = (M, a, b, c, d) => { const p = [[a, b], [c, d]].map(([x, y]) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]]); return { x0: Math.min(p[0][0], p[1][0]), y0: Math.min(p[0][1], p[1][1]), x1: Math.max(p[0][0], p[1][0]), y1: Math.max(p[0][1], p[1][1]) }; };
const camM = c => { const z = c.z || 1; return [z, 0, 0, z, W / 2 - z * c.cx, H / 2 - z * c.cy]; };

// —— the scroll (mounting paper between the view prints) ——
const TOTAL = SLOT.bridge + W;
function drawMount(M) {
  ctx.save(); ctx.setTransform(M[0], M[1], M[2], M[3], M[4], M[5]);
  ctx.fillStyle = PAL.mount; ctx.fillRect(-400, -1700, TOTAL + 800, 3200);
  ctx.globalAlpha = .5; ctx.globalCompositeOperation = 'multiply';
  const z = M[0], x0 = -M[4] / z, x1 = (W - M[4]) / z, y0 = -M[5] / z, y1 = (H - M[5]) / z;
  for (let X = Math.floor(x0 / W) * W; X < x1; X += W) for (let Y = Math.floor(y0 / H) * H; Y < y1; Y += H) ctx.drawImage(TX.paper, X, Y);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = PAL.mountD; ctx.fillRect(-400, -1240, TOTAL + 800, 26); ctx.fillRect(-400, 1300, TOTAL + 800, 26);
  ctx.restore();
}
const VC = id => [SLOT[id] + VIEWS[id].w / 2, SY(id) + VIEWS[id].h / 2];
const at = (id, x, y) => [SLOT[id] + x, SY(id) + y];   // sheet coords → world
function drawScroll(cam, t, o = {}) {
  const M = camM(cam); drawMount(M);
  const half = W / 2 / (cam.z || 1) + 100;
  for (const id of ORDER) {
    const v = VIEWS[id], x0 = SLOT[id]; if (x0 + v.w < cam.cx - half || x0 > cam.cx + half) continue;
    const Mi = [M[0], M[1], M[2], M[3], M[4] + M[0] * x0, M[5] + M[3] * SY(id)];
    drawSheet(v, Mi, o.freeze ? o.freeze[id] ?? t : t, { frozen: !!o.freeze });
  }
  return M;
}

// —— the shots on the scroll: camera + free runners (figures crossing the mount) ——
const ease = eio;
function runner(M, fn) { ctx.save(); ctx.setTransform(M[0], M[1], M[2], M[3], M[4], M[5]); figure(ctx, fn); ctx.restore(); }
const SCROLL = {
  s02(t, lt, d) { const u = ss(seg(lt, 0, 3.6)); return { cx: VC('bridge')[0] + 760 * (1 - u), cy: 540 }; },
  s16() { return { cx: VC('bridge')[0], cy: 540 }; },
  s17(t, lt, d, M) { return { cx: lerp(VC('bridge')[0], VC('rain')[0], ease(seg(lt, .15, d))), cy: 540 }; },
  s18(t, lt, d) { return { cx: VC('rain')[0] - 60 * lt / d, cy: 540 }; },
  s22(t, lt, d) { return { cx: lerp(VC('rain')[0] - 60, VC('snow')[0], ease(seg(lt, .1, d))), cy: 540 }; },
  s23(t, lt, d) { const u = ease(seg(lt, .2, d - .4)); return { cx: VC('snow')[0], cy: lerp(540, 540 - 540, u) }; },
  s28(t, lt, d) { return { cx: lerp(VC('snow')[0], SLOT.fields + FD.w - 960, ease(seg(lt, 0, d))), cy: lerp(0, 540, ease(seg(lt, 0, d))) }; },
  s29(t, lt, d) { return { cx: SLOT.fields + clamp(FIELDS.track(t) - 300, 960, FD.w - 960), cy: 540 }; },
  s34(t, lt, d) { const a = SLOT.fields + clamp(FIELDS.track(SH.s29.t1) - 300, 960, FD.w - 960); return { cx: lerp(a, VC('pass')[0], ease(seg(lt, 0, d))), cy: 540 }; },
  s35(t, lt, d) { const u = ease(seg(lt, 3.3, d)); return { cx: VC('pass')[0], cy: lerp(540, -540, u) }; },
  s39(t, lt, d) { const u = ease(seg(lt, 1.0, d - .3)), z = lerp(1, .82, Math.sin(Math.PI * u)); return { cx: lerp(VC('pass')[0], VC('sea')[0], u), cy: lerp(-560, 540, ss(seg(lt, .8, d - .2))), z }; },
  s40() { return { cx: VC('sea')[0] + 0, cy: 540 }; },
  s45(t, lt, d) {   // tilt up past the border with the fish, then push in on the catch (the cat ≈ a third of the frame), hold
    const u = ease(seg(lt, .2, 1.5)), p = ease(seg(lt, 1.3, 2.1)), c = at('sea', 980, -70);
    return { cx: lerp(VC('sea')[0] - 40 * u, c[0], p), cy: lerp(lerp(540, 250, u), c[1], p), z: lerp(lerp(1, .9, u), 1.85, p) }; },
  s46(t, lt, d) { const u = ease(seg(lt, 0, 1.5)), c = at('sea', 980, -70); return { cx: lerp(c[0], VC('sea')[0], u), cy: lerp(c[1], 540, u), z: lerp(1.85, 1, u) }; },
  s47(t, lt, d) { const u = ease(seg(lt, 0, d)); return { cx: lerp(VC('sea')[0], VC('bridge')[0], u), cy: 540, z: 1 - .12 * Math.sin(Math.PI * u) }; },
  s48() { return { cx: VC('bridge')[0], cy: 540 }; },
  s55(t, lt, d) { const z = lerp(1.08, 1, ss(lt / d)); return { cx: VC('bridge')[0] + 120 * (1 - ss(lt / d)), cy: 540 - 40 * (1 - ss(lt / d)), z }; },
  s56(t, lt, d) { return { cx: VC('bridge')[0], cy: 540 }; },
};
// free runners during the slides (drawn over sheets and mount, in world coordinates)
function runners(id, t, lt, d, M) {
  const tq = q8(t);
  if (id === 's17') {
    const u = ss(seg(lt, 0, d - .1)), a = at('bridge', 980, BR.deck(980)), b = at('rain', 1750, RB.deck + 2);
    runner(M, A => { kite(A, lerp(a[0] - 500, b[0] - 900, u), lerp(260, 250, u), 120, -1, Math.sin(tq * 14), { fish: 1, t }); catSide(A, lerp(a[0], b[0], u), lerp(a[1], b[1], u), 75, -1, gait('run', (tq * 2.6) % 1), { t: tq }); });
  }
  if (id === 's22') {
    const u = ss(seg(lt, 0, d - .1)), a = at('rain', 250, RB.deck + 2), b = at('snow', 1660, SN.eave - 40);
    runner(M, A => { catSide(A, lerp(a[0], b[0], u), lerp(a[1], b[1], u), 75, -1, gait('run', (tq * 2.6) % 1), { t: tq }); });
  }
  if (id === 's28') {
    const u = ss(seg(lt, 0, d)), a = at('snow', 760, SN.ridge + 300), b = at('fields', 3900, FD.levee - 4);
    runner(M, A => catSide(A, lerp(a[0], b[0], u), lerp(a[1], b[1], u), 80, -1, gait('run', (tq * 2.6) % 1), { t: tq }));
  }
  if (id === 's34') {
    const u = ss(seg(lt, 0, d)), a = at('fields', 1500, FD.levee - 4), b = at('pass', 1500, 2088);
    runner(M, A => catSide(A, lerp(a[0], b[0], u), lerp(a[1], b[1], u), 80, -1, gait('run', (tq * 2.6) % 1), { t: tq }));
  }
  if (id === 's39') {
    const u = ss(seg(lt, 1.6, d - .2)), a = at('pass', 1040, 552), b = at('sea', 150, 800);
    if (lt > 1.6) runner(M, A => catSide(A, lerp(a[0], b[0], u), lerp(a[1], b[1], u), 80, -1, gait('run', (tq * 2.6) % 1), { t: tq }));
  }
}

// —— the catch above the border (s45) and the fall back (s46): figures escape the sheet ——
function catchScene(id, t, lt, M) {
  const s = at('sea', 0, 0), P = (x, y) => [s[0] + x, s[1] + y];
  const G = waveShape(SEAV.rise(t), SEAV.crash(t)), boatP = [G.face[2][0] - 30, G.face[2][1] + 40];
  if (id === 's45') {
    // slow motion: the fish is flung from the lip up over the top border into the mount; the cat leaps out of the print after it
    const ct = HIT.catch - SH.s45.t0, u = seg(lt, 0, ct);
    const fx = lerp(G.tip[0], 900, ss(u)), fy = lerp(G.tip[1], -190, eo(u));
    const cu = seg(lt, .45, ct), cx = lerp(boatP[0] - 10, fx + 90, ss(cu)), cy = lerp(boatP[1] - 30, fy + 95, eo(cu));
    runner(M, A => {
      if (lt < ct) fish(A, P(fx, fy), 170, -lt * 2.6, Math.sin(lt * 6) * .4, 2.6);
      const Pc = lt < .45 ? blend(pose('crouch', { eye: 1.2, pupil: 1, rot: .3 }), pose('crouch', { eye: 1.3, pupil: 1, hy: -.38, rot: .4 }), ss(lt / .45)) : lt < ct ? blend(pose('leap', { eye: 1.3, pupil: 1, jaw: .8, brow: .6, rot: .5 }), pose('leap', { jaw: .3, eye: 1.2, rot: .2 }), seg(lt, ct - .3, ct)) : pose('leap', { eye: .7, jaw: 0, ha: -.2, brow: -.3, rot: .1 * Math.sin((lt - ct) * 3) });
      catSide(A, ...P(cx, cy), 210, -1, Pc, { t: q8(t), fish: lt >= ct ? 1 : 0 });
    });
  }
  if (id === 's46') {
    const u = ss(seg(lt, 0, 1.4)), a = [990, -95], b = [640 + 60, 850 - 70];
    runner(M, A => catSide(A, ...P(lerp(a[0], b[0], u), lerp(a[1], b[1], u) - Math.sin(u * Math.PI) * 80), 190, -1, blend(pose('leap', { ha: -.2, rot: -.5 * u }), pose('crouch', { ear: -.2, eye: .8 }), ss(seg(lt, 1.1, 1.5))), { t: q8(t), fish: 1 }));
  }
}
// —— screen overlays: the fishmonger's shout (horizontal cartouche) ——
const SHOUT = { t0: HIT.shout, t1: SH.s12.t0 + .7, text: '站——住！' };
function subtitle(t) {
  if (t < SHOUT.t0 || t >= SHOUT.t1) return;
  const a = clamp((t - SHOUT.t0) / .22), fo = 1 - clamp((t - (SHOUT.t1 - .25)) / .25);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.font = '400 64px Brush'; const tw = ctx.measureText(SHOUT.text).width, w = tw + 170, h = 104, x0 = (W - w) / 2, y0 = 92;
  ctx.globalAlpha = fo;
  stampFn(ctx, x => {
    x.fillStyle = 'rgba(243,231,198,.97)'; x.fillRect(x0, y0, w, h);
    x.strokeStyle = PAL.sumi; x.lineWidth = 3; x.strokeRect(x0, y0, w, h); x.lineWidth = 1.2; x.strokeRect(x0 + 6, y0 + 6, w - 12, h - 12);
    x.fillStyle = PAL.sumi; x.textAlign = 'left'; x.textBaseline = 'middle'; x.font = '400 64px Brush'; x.fillText(SHOUT.text, x0 + 120, y0 + h / 2 + 4);
  }, a, [0, 0]);
  const sc = sealCanvas('鱼', 50, { seed: 17 }); ctx.globalAlpha = fo * a * .92; ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(sc, x0 + 34, y0 + h / 2 - sc.height / 2);
  ctx.restore();
  if (a >= 1 && fo >= 1) TEXTS.push({ id: 'shout', text: SHOUT.text, x0, y0, x1: x0 + w, y1: y0 + h });
}
// opening title on the dawn print (s02): a big vertical cartouche + the first view slip
function titleCard(t, M) {
  const a0 = SH.s02.t0 + 1.0; if (t < a0 || t >= SH.s03.t0) return;
  const p = clamp((t - a0) / .35), sp = clamp((t - a0 - .55) / .3);
  ctx.save(); ctx.setTransform(M[0], M[1], M[2], M[3], M[4] + M[0] * SLOT.bridge, M[5]);
  let b1, b2;
  stampFn(ctx, x => { b1 = cartouche(x, 1790, 64, SERIES, { series: '', w: 112, size: 78 }); b2 = cartouche(x, 1680, 64, '一 晨市', { series: '', w: 78, size: 46, fill: '#f3e7c6' }); }, p, [0, -14]);
  if (b1) { drawSeal(ctx, '猫鱼', 1790, b1.y0 + b1.h + 56, 76, sp, { seed: 9, rot: .03 }); if (p >= 1) { const Mi = [M[0], M[1], M[2], M[3], M[4] + M[0] * SLOT.bridge, M[5]]; TEXTS.push({ id: 'title', text: SERIES, ...scr(Mi, b1.x0, b1.y0, b1.x0 + b1.w, b1.y0 + b1.h) }); TEXTS.push({ id: 'view1', text: '一 晨市', ...scr(Mi, b2.x0, b2.y0, b2.x0 + b2.w, b2.y0 + b2.h) }); } }
  ctx.restore();
}
// dusk cartouche (s48) and the end slip (s56) on the bridge print
function duskCards(t, M) {
  const Mi = [M[0], M[1], M[2], M[3], M[4] + M[0] * SLOT.bridge, M[5]];
  const c0 = SH.s48.t0 + 1.2, c1 = SH.s49.t0;
  if (t >= c0 && t < c1) { const p = clamp((t - c0) / .3); ctx.save(); ctx.setTransform(...Mi); let b; stampFn(ctx, x => { b = cartouche(x, 130, 70, '七 暮归', { series: SERIES, w: 86, size: 52, ssize: 25 }); }, p, [0, -14]); if (b) drawSeal(ctx, '猫', 130, b.y0 + b.h + 44, 56, clamp((t - c0 - .4) / .3), { seed: 11 }); ctx.restore(); if (p >= 1 && b) { TEXTS.push({ id: 'cart-dusk-s', text: SERIES, ...scr(Mi, b.x0, b.y0, b.x0 + b.w, b.y0 + b.h) }); TEXTS.push({ id: 'cart-dusk', text: '七 暮归', ...scr(Mi, b.x0, b.y0, b.x0 + b.w, b.y0 + b.h) }); } }
  const e0 = SH.s56.t0 + 1.3;
  if (t >= e0) { const p = clamp((t - e0) / .35); ctx.save(); ctx.setTransform(...Mi); let b; stampFn(ctx, x => { b = cartouche(x, 1100, 600, '终', { series: '', w: 96, size: 66 }); }, p, [0, -14]); if (b) drawSeal(ctx, '猫鱼', 1100, b.y0 + b.h + 60, 84, clamp((t - e0 - .5) / .3), { seed: 31, normal: true }); ctx.restore(); if (p >= 1 && b) TEXTS.push({ id: 'end', text: '终', ...scr(Mi, b.x0, b.y0, b.x0 + b.w, b.y0 + b.h) }); }
}

// —— render ——
export function shotAt(t) { let s = SHOTS[0]; for (const x of SHOTS) if (t >= x.t0 - 1e-6) s = x; return s; }
function renderFrame(t) {
  TEXTS = [];
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = PAL.mount; ctx.fillRect(0, 0, W, H);
  const sh = shotAt(t), lt = t - sh.t0, d = sh.t1 - sh.t0;
  if (SCROLL[sh.id]) {
    const cam = SCROLL[sh.id](t, lt, d);
    let freeze = null;
    if (sh.id === 's47') freeze = { sea: SH.s46.t1 - .01, pass: SH.s38.t1 - .3, fields: SH.s33.t0, snow: SH.s27.t0, rain: SH.s21.t0, bridge: SH.s47.t1 + 2 };
    const M = drawScroll(cam, t, { freeze });
    runners(sh.id, t, lt, d, M);
    if (sh.id === 's45' || sh.id === 's46') catchScene(sh.id, t, lt, M);
    if (sh.id === 's02') titleCard(t, M);
    if (['s48', 's55', 's56'].includes(sh.id)) duskCards(t, M);
  } else {
    const C = COVER[sh.id];
    if (C) { const cam = C.cam ? C.cam(lt, d, t) : { cx: (C.w || W) / 2, cy: (C.h || H) / 2, z: 1 }; const M = camM(cam); drawMount(M); drawSheet(C, M, t); }
  }
  subtitle(t);
}
window.render = t => { if (QS.get('test')) return testSheet(ctx, QS.get('test'), t); renderFrame(t); };
window.DUR = DUR;
window.EV = events();
window.TEXTS = t => { renderFrame(t); return TEXTS; };
window.SHOTS = SHOTS;
window.render(parseFloat(QS.get('t') ?? '3'));
window.READY = true;
