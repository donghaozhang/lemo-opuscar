// Coverage: every medium, close-up and insert is its own complete print (sheet), cut inside a view.
// Each: cached blocks (sky g1, colour g2, key g0) + live acting (paint) + a camera inside the sheet.
import { clamp, lerp, seg, ss, eio, eo, ei, mulberry, hash, vnoise, track, spring, TAU } from '/core/lib.js';
import { W, H, FR, PAL, smooth, poly, carve, wob, line, bokashi, kasumi, rgba, mix } from './print.js';
import { pine, rain, claw } from './nature.js';
import { figure, catSide, pose, gait, blend, CP, catFace, fexpr, FE, kitten, monger, MP, manGait, mongerFace, mexpr, ME, kite, talons, fish, person, boat, bigPaw, bigHand, CAT } from './chars.js';
import { roofRow, ripples, lantern, lanternKey, fuji, kf } from './views.js';
import { SH, SEC, HIT, q8, q12 } from './timeline.js';

const S = PAL.sumi;
const K = (x, pts, w = 2.6, o = {}) => carve(x, pts, w, { col: S, ...o });
const rect = (x, c, x0, y0, x1, y1) => { x.fillStyle = c; x.fillRect(x0, y0, x1 - x0, y1 - y0); };
const bx = (a, b, t) => blend(a, b, ss(t));
const fx = (a, b, t) => { const o = {}; for (const k in a) o[k] = typeof a[k] === 'number' ? lerp(a[k], b[k] ?? a[k], ss(t)) : (t < .5 ? a[k] : b[k]); for (const k in b) if (!(k in o)) o[k] = b[k]; return o; };
const local = id => t => [t - SH[id].t0, SH[id].t1 - SH[id].t0];

// —— skies by place and hour ——
const SKY = {
  dawn: x => { bokashi(x, 0, 0, W, 520, PAL.beniP, .95, 0, { rough: 26, seed: 2 }); bokashi(x, 0, 380, W, 760, PAL.ochreL, 0, .5, { rough: 20, seed: 5 }); },
  rain: x => { bokashi(x, 0, 0, W, 560, '#2a2a2e', 1, .1, { rough: 30, seed: 41 }); bokashi(x, 0, 500, W, 1080, '#7d8a90', .2, .8, { rough: 18, seed: 43, col2: '#45586a' }); },
  snow: x => { bokashi(x, 0, 0, W, 700, '#55585e', .9, 0, { rough: 30, seed: 62 }); },
  field: x => { bokashi(x, 0, 0, W, 460, PAL.prus, .85, 0, { rough: 28, seed: 82 }); },
  pass: x => { bokashi(x, 0, 0, W, 700, PAL.ochre, .75, 0, { rough: 30, seed: 91 }); bokashi(x, 0, 0, W, 280, PAL.beniL, .5, 0, { rough: 24, seed: 92 }); },
  sea: x => { bokashi(x, 0, 0, W, 500, PAL.prus, .95, .1, { rough: 28, seed: 101 }); },
  dusk: x => { bokashi(x, 0, 0, W, 560, '#1a2440', 1, .55, { rough: 26, seed: 2, col2: '#3a4a6c' }); bokashi(x, 0, 420, W, 760, PAL.beniL, 0, .7, { rough: 20, seed: 5 }); },
};
function sheet(id, o) {
  return {
    id: o.sid || id, w: o.w || W, h: o.h || H,
    layers: { sky: { g: 1, grain: .13, draw: o.sky || (() => { }) }, col: { g: 2, grain: .05, draw: o.col || (() => { }) }, key: { g: 0, speck: .12, draw: o.key || (() => { }) } },
    cam: o.cam,
    paint(ctx, t, R) { R.L('sky'); R.L('col'); if (o.under) o.under(ctx, t, R, ...local(id)(t)); R.L('key'); if (o.paint) o.paint(ctx, t, R, ...local(id)(t)); },
    after: o.after ? (ctx, t, R) => o.after(ctx, t, R, ...local(id)(t)) : null,
  };
}
const push = (z0, z1, cx = W / 2, cy = H / 2, dx = 0, dy = 0) => (lt, d) => { const u = ss(lt / d); return { cx: cx + dx * u, cy: cy + dy * u, z: lerp(z0, z1, u) }; };

// —— shared set pieces ——
function stoneWall(x, x0, y0, x1, y1, col, seed = 5, row = 70) {
  if (col) rect(x, col, x0, y0, x1, y1);
  else { const R = mulberry(seed); x.strokeStyle = S; x.lineWidth = 2.2; for (let y = y0; y < y1; y += row) { x.beginPath(); x.moveTo(x0, y); x.lineTo(x1, y + (R() - .5) * 6); x.stroke(); let X = x0 + (Math.floor((y - y0) / row) % 2) * row * .6; while (X < x1) { X += row * (1.2 + R() * .8); x.beginPath(); x.moveTo(X, y); x.lineTo(X + (R() - .5) * 10, Math.min(y1, y + row)); x.stroke(); } } }
}
function basket(x, cx, cy, w, h, part) {
  // shallow bamboo basket (seen from above-front), lattice weave
  if (part === 'col') { x.fillStyle = PAL.straw; x.beginPath(); x.ellipse(cx, cy, w / 2, h / 2, 0, 0, TAU); x.fill(); x.fillStyle = mix(PAL.straw, '#6b4a22', .35); x.beginPath(); x.ellipse(cx, cy + h * .04, w / 2 * .9, h / 2 * .82, 0, 0, TAU); x.fill(); x.fillStyle = '#7b9a4a'; for (let i = 0; i < 7; i++) { x.beginPath(); x.ellipse(cx - w * .3 + i * w * .1, cy + Math.sin(i) * h * .1, w * .09, h * .05, .6 + i * .3, 0, TAU); x.fill(); } }
  if (part === 'key') {
    x.strokeStyle = S; x.lineWidth = 3; x.beginPath(); x.ellipse(cx, cy, w / 2, h / 2, 0, 0, TAU); x.stroke(); x.lineWidth = 2; x.beginPath(); x.ellipse(cx, cy + h * .04, w / 2 * .9, h / 2 * .82, 0, 0, TAU); x.stroke();
    x.save(); x.beginPath(); x.ellipse(cx, cy, w / 2, h / 2, 0, 0, TAU); x.ellipse(cx, cy + h * .04, w / 2 * .9, h / 2 * .82, 0, 0, TAU); x.clip('evenodd'); x.lineWidth = 1.4; for (let a = 0; a < TAU; a += .07) { x.beginPath(); x.moveTo(cx + Math.cos(a) * w * .44, cy + Math.sin(a) * h * .4); x.lineTo(cx + Math.cos(a + .05) * w * .52, cy + Math.sin(a + .05) * h * .52); x.stroke(); } x.restore();
  }
}
function planks(x, y0, y1, part, col = PAL.wood) {
  if (part === 'col') rect(x, col, 0, y0, W, y1);
  else { K(x, [[0, y0], [W, y0]], 3, { taper: [0, 0] }); const R = mulberry(9); for (let y = y0 + 40; y < y1; y += 40 + R() * 20) { x.strokeStyle = S; x.lineWidth = 1.2; x.beginPath(); x.moveTo(0, y); x.lineTo(W, y + (R() - .5) * 4); x.stroke(); } }
}
function awning(x, part, y = 150) {
  if (part === 'col') { x.fillStyle = PAL.straw; x.beginPath(); poly(x, [[0, 0], [W, 0], [W, y + 40], [0, y]]); x.fill(); }
  else { K(x, [[0, y], [W, y + 40]], 3.2, { taper: [0, 0] }); for (let X = 0; X < W; X += 26) { x.strokeStyle = mix(S, PAL.straw, .3); x.lineWidth = 1.3; x.beginPath(); x.moveTo(X, 0); x.lineTo(X - 30, y + X / W * 40); x.stroke(); } }
}
function rainLines(ctx, t, n = 1) { rain(ctx, q12(t), [-100, -100, W + 200, H + 100], { sets: [[-1.38, 260 * n, 2.4, PAL.sumi, .5], [-1.27, 150 * n, 1.6, '#5f5e58', .45]] }); }
function snowfall(ctx, t, seed = 7, n = 120, big = 1) { const R = mulberry(seed), tq = q8(t); ctx.fillStyle = '#f4f1e6'; for (let i = 0; i < n; i++) { const sp = 40 + R() * 60, X = R() * 2000 + Math.sin(tq + i) * 18, Y = (R() * 1200 + tq * sp) % 1200 - 60, r = (2 + R() * 5) * big; ctx.beginPath(); ctx.arc(X, Y, r, 0, TAU); ctx.fill(); } }
function riceStalks(x, y0, R, n, scale, part) {
  for (let i = 0; i < n; i++) {
    const X = R() * 2000 - 40, h = (120 + R() * 140) * scale, lean = (R() - .5) * .5;
    for (let k = 0; k < 4; k++) { const a = lean + (k - 1.5) * .18, tip = [X + Math.sin(a) * h, y0 - Math.cos(a) * h]; if (part === 'col') { x.strokeStyle = k % 2 ? PAL.green : PAL.greenD; x.lineWidth = 7 * scale; x.lineCap = 'round'; x.beginPath(); x.moveTo(X, y0); x.quadraticCurveTo(X + Math.sin(a) * h * .4, y0 - h * .6, tip[0], tip[1]); x.stroke(); } else K(x, [[X + 3 * scale, y0], [X + Math.sin(a) * h * .4 + 4 * scale, y0 - h * .6], [tip[0], tip[1]]], 1.4 * scale, { taper: [.1, .7] }); }
  }
}
function waveWall(x, part, top = 140, R = mulberry(3)) {
  // a big wave filling the right of a coverage frame (banded blues + flow lines + claws at the crest)
  const back = [[2000, 1100], [1960, 700], [1820, 380], [1600, top + 40], [1300, top], [1000, top + 60], [820, top + 180]];
  if (part === 'none') return back;
  if (part === 'col') {
    x.save(); x.beginPath(); smooth(x, [...back, [700, 380], [760, 700], [700, 1100]], true); x.clip();
    const g = x.createLinearGradient(0, top, 0, 1100); g.addColorStop(0, '#6f95bb'); g.addColorStop(.35, PAL.prus); g.addColorStop(1, '#0f2344'); x.fillStyle = g; x.fillRect(0, 0, 2000, 1200);
    x.strokeStyle = 'rgba(244,236,214,.85)'; x.lineCap = 'round'; for (let k = 0; k < 10; k++) { x.lineWidth = 4; x.beginPath(); smooth(x, back.map(([a, b], i) => [a - 30 - k * 50, b + 30 + k * 46])); x.stroke(); }
    x.restore();
  } else { x.strokeStyle = PAL.prusD; x.lineWidth = 4; x.beginPath(); smooth(x, [...back, [700, 380], [760, 700], [700, 1100]]); x.stroke(); }
  return back;
}
function crestClaws(ctx, back, t, sc = 1) { const R = mulberry(5 + Math.floor(q12(t) * 12) % 3); for (let i = 3; i < back.length - 1; i++) { const [a, b] = back[i], [a2, b2] = back[i + 1], ang = Math.atan2(b2 - b, a2 - a) - 1.1; for (let k = 0; k < 3; k++) claw(ctx, lerp(a, a2, k / 3), lerp(b, b2, k / 3), ang - .2, (60 + R() * 60) * sc, 28 * sc, -.9, { lw: 2.6, sub: 2 }); } }
function lanternGlow(ctx, lx, ly, r, a = 1) { const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, r); g.addColorStop(0, `rgba(255,198,110,${.5 * a})`); g.addColorStop(1, 'rgba(255,198,110,0)'); ctx.fillStyle = g; ctx.fillRect(lx - r, ly - r, r * 2, r * 2); }

// ———————————————————————————— A · dawn market ————————————————————————————
const s01 = sheet('s01', {
  sky: x => { SKY.dawn(x); },
  col: x => { basket(x, 1100, 760, 1700, 760, 'col'); },
  key: x => { basket(x, 1100, 760, 1700, 760, 'key'); },
  cam: push(1, 1.045, 960, 560),
  paint(ctx, t, R, lt) {
    R.fig(A => { fish(A, [1000, 640], 760, -.12, 0, 4); fish(A, [1180, 830], 780, -.08, .05, 4); });
    // the paw creeps in from the left (anticipation: a small pull back before it reaches), claws come out at 1.8 s and it freezes
    const u = ss(seg(lt, .9, 1.7)), back = Math.sin(clamp((lt - .7) / .25) * Math.PI) * 30;
    const px = lerp(-420, 330, u) - back, cl = ss(seg(lt, 1.75, 1.95));
    if (lt > .7) R.fig(A => bigPaw(A, q8(lt) === lt ? px : px, 600 + Math.sin(lt * 2) * 6, 340, .08, cl));
  },
});
// under the bridge (two impressions): dawn (s03) and dusk (s49)
function underBridge(imp) {
  const dusk = imp === 'dusk';
  return {
    sky: x => { (dusk ? SKY.dusk : SKY.dawn)(x); bokashi(x, 0, 760, 1100, 1080, dusk ? '#1d2a44' : PAL.sky, .7, 1, { rough: 14, seed: 31, col2: dusk ? '#0d1424' : PAL.prus }); if (dusk) { x.fillStyle = 'rgba(232,170,90,.5)'; for (let i = 0; i < 8; i++) x.fillRect(300 + i * 9, 900 + i * 18, 90 - i * 8, 4); } },
    col: x => {
      // the bridge deck overhead (bold foreground framing), piles, stone embankment with the hollow, the ledge
      rect(x, dusk ? '#2b221b' : PAL.woodD, 0, 0, W, 170); for (let X = 60; X < W; X += 220) rect(x, dusk ? '#3b2e24' : PAL.wood, X, 160, X + 40, 200);
      rect(x, dusk ? '#2b221b' : PAL.woodD, 380, 170, 430, 1080); rect(x, dusk ? '#2b221b' : PAL.woodD, 470, 170, 505, 1080);
      rect(x, dusk ? '#4c5262' : '#a9a99b', 1040, 170, W, 860);
      x.fillStyle = dusk ? '#0b0d14' : '#2b2a2a'; x.beginPath(); x.moveTo(1240, 860); x.lineTo(1240, 600); x.quadraticCurveTo(1420, 400, 1600, 600); x.lineTo(1600, 860); x.fill();
      rect(x, dusk ? '#5d6272' : PAL.greyL, 560, 860, W, 930); rect(x, dusk ? '#3f4454' : '#8b8a80', 560, 930, W, 960);
      x.fillStyle = dusk ? '#5a4a30' : PAL.straw; x.beginPath(); poly(x, [[1270, 860], [1300, 820], [1560, 815], [1580, 860]]); x.fill();
    },
    key: x => {
      K(x, [[0, 170], [W, 170]], 3.4, { taper: [0, 0] }); for (let X = 60; X < W; X += 220) { x.strokeStyle = S; x.lineWidth = 2; x.strokeRect(X, 160, 40, 40); }
      for (let X = 0; X < W; X += 30) { x.lineWidth = 1; x.beginPath(); x.moveTo(X, 20); x.lineTo(X, 150); x.stroke(); }
      x.lineWidth = 2.4; x.strokeRect(380, 170, 50, 910); x.strokeRect(470, 170, 35, 910);
      K(x, [[1040, 170], [1040, 860]], 3); stoneWall(x, 1040, 170, W, 860, null, 5, 76);
      K(x, [[1240, 860], [1240, 600], [1420, 470], [1600, 600], [1600, 860]], 3.2, { taper: [0, 0] });
      K(x, [[560, 860], [W, 860]], 3, { taper: [0, 0] }); K(x, [[560, 930], [W, 930]], 2.4, { taper: [0, 0] }); K(x, [[560, 960], [W, 960]], 2, { taper: [0, 0] });
      for (let X = 600; X < W; X += 150) { x.lineWidth = 1.6; x.beginPath(); x.moveTo(X, 862); x.lineTo(X + 10, 928); x.stroke(); }
      ripples(x, 780, 1080, 0, 560, 5, S);
    },
  };
}
const UB = underBridge('dawn'), UBD = underBridge('dusk');
const s03 = sheet('s03', {
  ...UB, sid: 'ub_dawn', cam: push(1, 1.07, 1000, 600, 60, 20),
  paint(ctx, t, R, lt) {
    const tq = q8(lt);
    // the kitten peeks out of the hollow; the cat sitting on the ledge turns its head to it
    const peek = ss(seg(lt, .3, 1.1));
    R.fig(A => kitten(A, 1420, 865 + (1 - peek) * 160, 300, { E: fexpr('hungry', { gy: -.4, gx: -.5 }), t: tq, bob: Math.sin(tq * 4) }));
    const look = ss(seg(lt, .9, 1.4));
    R.fig(A => catSide(A, 900, 870, 420, 1, pose('sit', { ha: lerp(-.15, .12, look), tw: .12, eye: lerp(.9, 1, look), brow: lerp(0, .3, look) }), { t: tq, look: look }));
  },
});
const s04 = sheet('s04', {
  sky: x => { rect(x, '#2b2a2a', 0, 0, W, H); },
  col: x => { rect(x, '#a9a99b', 0, 0, 260, H); rect(x, '#a9a99b', 1660, 0, W, H); x.fillStyle = PAL.straw; x.beginPath(); poly(x, [[0, 900], [W, 880], [W, H], [0, H]]); x.fill(); },
  key: x => { K(x, [[260, 0], [260, H]], 3.4); K(x, [[1660, 0], [1660, H]], 3.4); stoneWall(x, 0, 0, 260, H, null, 7, 90); stoneWall(x, 1660, 0, W, H, null, 8, 90); K(x, [[0, 900], [W, 880]], 2.6); },
  cam: push(1, 1.03),
  paint(ctx, t, R, lt) {
    const tq = q8(lt), mew = Math.sin(clamp((lt - .5) / .7) * Math.PI);
    R.fig(A => { kitten(A, 960, 1240, 980, { E: fexpr('hungry', { jaw: .15 + .55 * mew, mouth: 1, open: 1.15 + .1 * mew, gy: -.6, ear: -.2 - .2 * mew }), t: tq }); });
  },
});
const s05 = sheet('s05', {
  sky: x => { SKY.dawn(x); },
  col: x => { rect(x, '#a9a99b', 1300, 0, W, H); rect(x, PAL.woodD, 0, 0, W, 120); },
  key: x => { stoneWall(x, 1300, 120, W, H, null, 9, 90); K(x, [[1300, 120], [1300, H]], 3.4); K(x, [[0, 120], [W, 120]], 3.4); },
  cam: push(1, 1.08, 960, 560, 0, -10),
  paint(ctx, t, R, lt) {
    const u = seg(lt, .5, 1.9), e = fx(fexpr('neutral', { gx: -.2, gy: .2 }), fexpr('determined', { gx: .6, gy: -.35 }), u);
    e.ear = lerp(0, .25, ss(u)) + .25 * Math.sin(clamp((lt - .2) / .5) * Math.PI); e.tilt = lerp(0, -.06, ss(u));
    R.fig(A => catFace(A, 940, 600, 820, e, { t: q8(lt) }));
  },
});
const stall = {
  sky: x => { SKY.dawn(x); },
  col: x => { awning(x, 'col', 150); planks(x, 860, H, 'col', PAL.ochreL); rect(x, PAL.woodL, 1150, 560, W, 600); rect(x, PAL.wood, 1180, 600, 1210, 860); rect(x, PAL.wood, 1850, 600, 1880, 860); for (let i = 0; i < 4; i++) rect(x, PAL.ai, 1080 + i * 220, 190, 1270 + i * 220, 330); },
  key: x => { awning(x, 'key', 150); planks(x, 860, H, 'key'); x.strokeStyle = S; x.lineWidth = 2.6; x.strokeRect(1150, 560, 800, 40); x.strokeRect(1180, 600, 30, 260); x.strokeRect(1850, 600, 30, 260); for (let i = 0; i < 4; i++) x.strokeRect(1080 + i * 220, 190, 190, 140); },
};
const s06 = sheet('s06', {
  ...stall, cam: push(1, 1.0),
  under(ctx, t, R, lt) { R.fig(A => { for (let i = 0; i < 5; i++) fish(A, [1260 + i * 130, 545], 150, .1 * (i % 2 ? 1 : -1), 0, 2.4); }); },
  paint(ctx, t, R, lt) {
    const tq = q8(lt);
    // the fishmonger arranging fish, back turned (faces right); the basket of two fish in the foreground
    R.fig(A => monger(A, 1420, 862, 660, 1, fx(MP.arrange, { ...MP.arrange, hnx: .38, hny: -.47 }, .5 + .5 * Math.sin(tq * 5)), { pole: 'none' }));
    R.fig(A => { basketFig(A, 760, 900, 380); fish(A, [740, 870], 220, -.2, 0, 2.6); fish(A, [790, 905], 230, -.12, 0, 2.6); });
    // the cat sneaks in low from the left (each step on the pizzicato), then crouches behind the basket
    const u = seg(lt, 0, 2.7), cx = lerp(-160, 520, u), crouch = ss(seg(lt, 2.6, 3.1));
    R.fig(A => catSide(A, cx, 885, 300, 1, blend(gait('sneak', (tq * 1.5) % 1, 'sneak', 1 - crouch), pose('crouch', { eye: .85, pupil: 1, brow: -.6 }), crouch), { t: tq, look: .3 }));
  },
});
function basketFig(A, cx, cy, w) { A.group([x => { x.ellipse(cx, cy, w / 2, w * .2, 0, 0, TAU); }], PAL.straw, 2.6); A.atop(x => { x.strokeStyle = mix(PAL.straw, '#6b4a22', .5); x.lineWidth = 2; for (let i = -8; i <= 8; i++) { x.beginPath(); x.moveTo(cx + i * w * .055, cy - w * .2); x.lineTo(cx + i * w * .05, cy + w * .2); x.stroke(); } x.fillStyle = '#7b9a4a'; x.beginPath(); x.ellipse(cx, cy - w * .02, w * .4, w * .12, 0, 0, TAU); x.fill(); }); }
const s07 = sheet('s07', {
  sky: x => { SKY.dawn(x); }, col: x => { awning(x, 'col', 210); }, key: x => { awning(x, 'key', 210); },
  cam: push(1, 1.04, 960, 560),
  paint(ctx, t, R, lt) {
    const y = ss(seg(lt, .15, .8)) * (1 - ss(seg(lt, 1.6, 1.95)));
    const e = fx(mexpr('neutral', { open: .6, lid: .3 }), mexpr('yawn'), y); e.tilt = -.08 * y + .05 * ss(seg(lt, 1.6, 2));
    R.fig(A => mongerFace(A, 960, 560, 600, e, { t: lt }));
  },
});
const s08 = sheet('s08', {
  sky: x => { SKY.dawn(x); }, col: x => { basket(x, 1000, 820, 1900, 820, 'col'); }, key: x => { basket(x, 1000, 820, 1900, 820, 'key'); },
  cam: push(1.04, 1),
  paint(ctx, t, R, lt) {
    // anticipation: the paw rises and hangs; the hook; the fish is dragged out left; the second fish rocks
    const rise = ss(seg(lt, 0, .6)), hook = ss(seg(lt, 1.25, 1.45)), pull = ei(seg(lt, 1.55, 2.3));
    const px = 560 - pull * 1300, py = lerp(520, 300, rise) + hook * 330;
    const rock = Math.sin((lt - 1.5) * 9) * Math.exp(-(lt - 1.5) * 2) * (lt > 1.5 ? .08 : 0);
    R.fig(A => { fish(A, [1180, 900], 900, -.08 + rock, rock, 4.2); if (lt < 1.55) fish(A, [940, 700], 880, -.14, 0, 4.2); });
    R.fig(A => { bigPaw(A, px, py, 360, .5 - hook * .4, .4 + .6 * ss(seg(lt, .5, .9))); if (lt >= 1.55) fish(A, [px + 430, py + 140], 880, -.14 - pull * .3, pull * .3, 4.2); });
  },
});
const s09 = sheet('s09', {
  ...stall, sid: 'stall2',
  cam: push(1.02, 1.06, 900, 560),
  under(ctx, t, R, lt) { R.fig(A => { for (let i = 0; i < 5; i++) fish(A, [1260 + i * 130, 545], 150, .1 * (i % 2 ? 1 : -1), 0, 2.4); }); },
  paint(ctx, t, R, lt) {
    const tq = q8(lt), turn = lt > 1.1;
    R.fig(A => monger(A, 1500, 862, 640, turn ? -1 : 1, turn ? fx(MP.stand, { ...MP.stand, brow: .8, eye: 1.2 }, 1) : fx(MP.arrange, MP.stand, ss(seg(lt, .6, 1.05))), { pole: 'none' }));
    R.fig(A => { basketFig(A, 760, 900, 380); fish(A, [790, 905], 230, -.12, 0, 2.6); });
    // frozen mid-tiptoe: one paw raised, the fish in its mouth; only the eyes slide to us
    const P = pose('sneak', { fny: -.12, fnx: .52, eye: 1.05, pupil: .9, brow: .5, ha: .05 });
    R.fig(A => catSide(A, 480, 885, 330, 1, P, { t: tq, fish: 1, look: -1 + ss(seg(lt, .3, .7)) * 0 }));
    // the eyes look to camera: a little sweat bead pops
    if (lt > .5) R.fig(A => { const p = [560, 600 - (lt - .5) * 20]; A.group([x => { x.moveTo(p[0], p[1] - 16); x.quadraticCurveTo(p[0] + 10, p[1], p[0], p[1] + 8); x.quadraticCurveTo(p[0] - 10, p[1], p[0], p[1] - 16); }], PAL.skyL, 2, PAL.prusD); });
  },
});
const s10 = sheet('s10', {
  sky: x => { SKY.dawn(x); }, col: x => { awning(x, 'col', 120); }, key: x => { awning(x, 'key', 120); },
  cam: (lt, d) => { const k = ss(seg(lt, .62, .8)); return { cx: 960, cy: 600, z: lerp(1, 1.12, k) }; },
  paint(ctx, t, R, lt) {
    const tk = HIT.take - SH.s10.t0, sh = HIT.shout - SH.s10.t0;
    let e = lt < tk - .25 ? mexpr('neutral', { gx: .5 }) : lt < tk ? mexpr('neutral', { gx: -.6, brow: .2 }) : lt < sh ? mexpr('take') : mexpr('furious');
    if (lt >= tk && lt < tk + .12) e = fx(mexpr('neutral'), mexpr('take'), .6);   // a one-frame smear into the take (deliberate pop)
    R.fig(A => mongerFace(A, 960, 600, 640, e, { t: lt }));
  },
});
const s11 = sheet('s11', {
  ...stall, sid: 'stall3', cam: push(1, 1),
  under(ctx, t, R, lt) { R.fig(A => { for (let i = 0; i < 5; i++) fish(A, [1260 + i * 130, 545], 150, .1 * (i % 2 ? 1 : -1), 0, 2.4); }); },
  paint(ctx, t, R, lt) {
    const tq = q8(lt), go = seg(lt, .35, .65);
    R.fig(A => monger(A, 1500, 862, 640, -1, mexprBody(lt), { pole: 'none' }));
    R.fig(A => basketFig(A, 760, 900, 380));
    if (go < 1) {
      const P = lt < .35 ? blend(pose('sneak', { eye: 1.1 }), pose('crouch', { eye: 1.2, ear: -.5, brow: .3 }), ss(lt / .3)) : pose('leap', { ear: -.6 });
      R.fig(A => catSide(A, lerp(480, -500, ei(go)), 885 - (go > 0 ? 60 : 0), 330 * (1 + go * .3), -1, { ...P, hx: P.hx * (1 + go * .5) }, { t: tq, fish: 1 }));
    }
    // paper puff where the cat was
    if (lt > .4) { const k = seg(lt, .4, 1.2); R.fig(A => { for (let i = 0; i < 4; i++) { const r = (40 + i * 22) * (.5 + k), cx = 520 - i * 60 - k * 60, cy = 820 - i * 15; A.group([x => x.ellipse(cx, cy, r, r * .6, 0, 0, TAU)], PAL.white, 2.4, S); } }, { colour: 1 - k }); for (let i = 0; i < 5; i++) R.D(0, x => { x.strokeStyle = S; x.lineWidth = 3; x.globalAlpha = 1 - k; x.beginPath(); x.moveTo(300 - k * 400, 700 + i * 40); x.lineTo(900 - k * 300, 700 + i * 40); x.stroke(); x.globalAlpha = 1; }); }
  },
});
function mexprBody(lt) { return { ...MP.stand, lean: .1, hnx: .32, hny: -.85, brow: -1, mouth: 2, eye: 1.2 }; }

// ———————————————————————————— B · the kite ————————————————————————————
const RAILW = 3840;
const s12 = sheet('s12', {
  w: RAILW,
  sky: x => { bokashi(x, 0, 0, RAILW, 520, PAL.beniP, .95, 0, { rough: 26, seed: 2 }); bokashi(x, 0, 560, RAILW, 1080, PAL.sky, .6, 1, { rough: 16, seed: 9, col2: PAL.prus }); },
  col: x => { roofRow(x, 640, 0, RAILW, mulberry(3), { col: '#6c7682', h: 60 }); rect(x, PAL.woodL, 0, 700, RAILW, 730); for (let X = 100; X < RAILW; X += 300) rect(x, PAL.woodL, X - 14, 730, X + 14, 1080); rect(x, PAL.wood, 0, 900, RAILW, 950); },
  key: x => { roofRow(x, 640, 0, RAILW, mulberry(3), { lines: true, h: 60 }); K(x, [[0, 700], [RAILW, 700]], 3, { taper: [0, 0] }); K(x, [[0, 730], [RAILW, 730]], 3, { taper: [0, 0] }); for (let X = 100; X < RAILW; X += 300) { x.strokeStyle = S; x.lineWidth = 2.6; x.strokeRect(X - 14, 730, 28, 350); } K(x, [[0, 900], [RAILW, 900]], 2.6, { taper: [0, 0] }); K(x, [[0, 950], [RAILW, 950]], 2.6, { taper: [0, 0] }); },
  cam: (lt, d) => ({ cx: 2900 - lt * 300 - 120, cy: 560, z: 1 }),
  paint(ctx, t, R, lt) {
    const tq = q8(lt), cx = 2900 - lt * 300, up = ss(seg(lt, 1.6, 2.0));
    // proud trot along the rail, head high, tail up; the shadow slides over; eyes up
    R.fig(A => catSide(A, cx, 700, 330, -1, { ...gait('walk', (tq * 1.6) % 1), hdy: -.26, ha: lerp(-.12, -.45, up), ta: -1.7, eye: lerp(.8, 1.2, up), brow: lerp(.2, .6, up) }, { t: tq, fish: 1 }));
    const sh = seg(lt, 1.2, 2.6);
    if (sh > 0 && sh < 1) R.D(0, x => { x.save(); x.globalAlpha = .28; x.fillStyle = '#1b1820'; const sx = lerp(cx + 900, cx - 900, sh), sy = 520; x.beginPath(); x.ellipse(sx, sy, 520, 120, 0, 0, TAU); x.fill(); x.beginPath(); x.moveTo(sx - 520, sy); x.lineTo(sx - 880, sy - 140); x.lineTo(sx - 300, sy - 60); x.fill(); x.beginPath(); x.moveTo(sx + 300, sy - 20); x.lineTo(sx + 820, sy - 260); x.lineTo(sx + 480, sy + 40); x.fill(); x.restore(); });
  },
});
const s13 = sheet('s13', {
  sky: x => { SKY.dawn(x); },
  cam: push(1, 1.05),
  paint(ctx, t, R, lt) {
    const g = HIT.snatch - SH.s13.t0, down = eo(seg(lt, 0, g)), grip = ss(seg(lt, g - .05, g + .12));
    // the fish in the cat's jaws below; the talons strike from above
    R.fig(A => catFace(A, 1350, 1250, 1100, fexpr('surprised', { gy: -.8, fish: 1, ear: .2 }), { t: lt }));
    R.fig(A => talons(A, 980, lerp(-260, 640, down) + grip * 30, 420, grip));
  },
});
const s14 = sheet('s14', {
  sky: x => { SKY.dawn(x); }, col: x => { rect(x, PAL.woodL, 0, 900, W, 935); }, key: x => { K(x, [[0, 900], [W, 900]], 3, { taper: [0, 0] }); K(x, [[0, 935], [W, 935]], 3, { taper: [0, 0] }); },
  cam: push(1, 1.02),
  paint(ctx, t, R, lt) {
    const tq = q8(lt), up = eo(seg(lt, 0, 1.6));
    R.fig(A => kite(A, lerp(1000, 760, up), lerp(380, -260, up), 900, -1, Math.sin(tq * 12), { fish: 1, claws: 1, t }));
    // the cat jumps and snaps on air
    const j = Math.sin(clamp((lt - .25) / .8) * Math.PI), snap = lt > .55 && lt < .9;
    R.fig(A => catSide(A, 1100, 900 - j * 120, 430, -1, blend(pose('stand', { ha: -.5 }), pose('leap', { ha: -.7, jaw: snap ? .9 : 0, eye: 1.2, pupil: .2, brow: .7 }), j), { t: tq }));
  },
});
const s15 = sheet('s15', {
  sky: x => { SKY.dawn(x); kasumi(x, 600, 700, 1400, 40, PAL.white, .9); },
  cam: (lt, d) => ({ cx: 960 + Math.sin(lt * 40) * 6 * seg(lt, .67, 1.2) * (1 - seg(lt, 1.2, 1.6)), cy: 560, z: lerp(1, 1.1, ss(lt / d)) }),
  paint(ctx, t, R, lt) {
    const f = HIT.fury - SH.s15.t0, e = lt < f ? fexpr('shocked') : fx(fexpr('shocked'), fexpr('furious'), seg(lt, f, f + .25));
    R.fig(A => kite(A, 1700 - lt * 200, 200 - lt * 40, 140, -1, Math.sin(q8(lt) * 14), { fish: 1, t }));
    R.fig(A => catFace(A, 900, 620, 840, e, { t: q8(lt) }));
  },
});

// ———————————————————————————— C · the chase ————————————————————————————
const s19 = sheet('s19', {
  sky: x => { SKY.rain(x); }, col: x => { planks(x, 860, H, 'col'); }, key: x => { planks(x, 860, H, 'key'); },
  cam: push(1, 1),
  paint(ctx, t, R, lt) {
    const tq = q8(lt);
    // legs of walkers in both directions; the big umbrella cropping the top right
    [[300, 1], [820, -1], [1300, 1], [1700, -1]].forEach(([x0, d], i) => R.fig(A => person(A, x0 + d * lt * 90, 880, 1300, d, 'umbrella', (tq * .9 + i * .25) % 1, { ucol: ['#c9b07a', PAL.ai, '#b8412f', '#8b8a80'][i] })));
    const u = seg(lt, 0, 1.8), cx = lerp(2100, -300, u), y = 880 - Math.abs(Math.sin(u * 9)) * 30;
    R.fig(A => catSide(A, cx, y, 300, -1, gait('run', (tq * 2.6) % 1), { t: tq }));
    R.fig(A => person(A, 1500, 1900, 2600, -1, 'umbrella', .2, { ucol: '#c9b07a', utilt: .2 }));
    rainLines(ctx, t);
  },
});
const s20 = sheet('s20', {
  sky: x => { SKY.rain(x); roofRow(x, 640, 0, W, mulberry(4), { col: '#8a9196', wall: '#c4c3b5', h: 50 }); }, col: x => { planks(x, 860, H, 'col'); }, key: x => { roofRow(x, 640, 0, W, mulberry(4), { lines: true, h: 50 }); planks(x, 860, H, 'key'); },
  cam: push(1, 1.03),
  paint(ctx, t, R, lt) {
    const tq = q8(lt), hit = HIT.umbrella - SH.s20.t0;
    const mx = lerp(2200, -200, seg(lt, 0, 2.3));
    // the walker he crashes into falls; the umbrella spins up and lands on his head
    const fallen = ss(seg(lt, hit, hit + .3));
    R.fig(A => person(A, 900 - fallen * 60, 880 + fallen * 40, 520, 1, 'cape', 0, {}));
    const fly = seg(lt, hit, hit + .6);
    const onHead = lt > hit + .6;
    R.fig(A => monger(A, mx, 880, 560, -1, manGait('run', (tq * 1.7) % 1), { pole: 'hand', umbrella: onHead }));
    if (lt > hit && !onHead) { const ux = lerp(900, mx, fly), uy = lerp(560, 400, fly) - Math.sin(fly * Math.PI) * 300; R.fig(A => { A.group([x => { x.save(); x.translate(ux, uy); x.rotate(fly * 9); x.moveTo(-110, 20); x.quadraticCurveTo(0, -60, 110, 20); x.lineTo(0, 30); x.closePath(); x.restore(); }], '#c9b07a', 2.6); }); }
    if (lt < hit) R.fig(A => person(A, 900, 880, 520, 1, 'umbrella', (tq) % 1, { ucol: '#c9b07a' }));
    rainLines(ctx, t);
  },
});
const s21 = sheet('s21', {
  sky: x => { SKY.rain(x); },
  cam: push(1, 1.05),
  paint(ctx, t, R, lt) {
    const shake = seg(lt, .35, 1.3), e = fexpr('wet', { tilt: Math.sin(lt * 34) * .22 * Math.sin(shake * Math.PI), open: lt > 1.3 ? .4 : .2 });
    R.fig(A => catFace(A, 960, 600, 800, e, { t: q8(lt) * 3 }));
    if (shake > 0 && shake < 1) { const Rn = mulberry(Math.floor(lt * 12)); R.fig(A => { for (let i = 0; i < 18; i++) { const a = Rn() * TAU, d = 380 + Rn() * 300; A.group([x => x.ellipse(960 + Math.cos(a) * d, 600 + Math.sin(a) * d * .7, 10, 16, a, 0, TAU)], PAL.skyL, 1.8, PAL.prusD); } }); }
    rainLines(ctx, t, .8);
  },
});
const snowRoof = (x, part, slope = .36, y0 = 300) => {
  const T = X => y0 + X * slope;
  if (part === 'col') { x.fillStyle = '#4c5560'; x.beginPath(); poly(x, [[0, T(0) + 60], [W, T(W) + 60], [W, T(W) + 220], [0, T(0) + 220]]); x.fill(); x.fillStyle = '#cfd5d8'; x.beginPath(); poly(x, [[0, T(0) + 46], [W, T(W) + 46], [W, T(W) + 60], [0, T(0) + 60]]); x.fill(); }
  else { K(x, [[0, T(0)], [W, T(W)]], 3, { taper: [0, 0] }); K(x, [[0, T(0) + 220], [W, T(W) + 220]], 3, { taper: [0, 0] }); for (let X = 0; X < W; X += 60) { x.strokeStyle = S; x.lineWidth = 1.4; x.beginPath(); x.moveTo(X, T(X) + 64); x.lineTo(X + 18, T(X) + 216); x.stroke(); } }
  return T;
};
const s24 = sheet('s24', {
  sky: x => { SKY.snow(x); }, col: x => { snowRoof(x, 'col', .3, 700); }, key: x => { snowRoof(x, 'key', .3, 700); },
  cam: push(1, 1.06),
  paint(ctx, t, R, lt) {
    const e = fexpr('sly', { gx: -.5, gy: -.6, tilt: -.05 });
    R.fig(A => catFace(A, 980, 620, 780, e, { t: q8(lt) }));
    const b = seg(lt, .6, 1.5); if (b > 0 && b < 1) R.fig(A => { const r = 40 + b * 120; A.group([x => x.ellipse(980 - b * 240, 760 - b * 60, r, r * .55, 0, 0, TAU)], PAL.white, 2.2, PAL.greyD); }, { colour: 1 - b });
    snowfall(ctx, t, 11, 90, 1.6);
  },
});
const s25 = sheet('s25', {
  sky: x => { SKY.snow(x); }, col: x => { snowRoof(x, 'col', .42, 100); rect(x, PAL.plaster, 0, 1000, W, H); }, key: x => { snowRoof(x, 'key', .42, 100); K(x, [[1500, 851], [1500, 900]], 3); },
  cam: push(1, 1),
  paint(ctx, t, R, lt) {
    const tq = q8(lt), T = X => 100 + X * .42, bell = HIT.bell - SH.s25.t0;
    // the kite on the slope above takes off as the cat pounces
    const k = seg(lt, .45, 1.3); R.fig(A => kite(A, lerp(420, 120, k), lerp(T(420) - 70, -200, ei(k)), 460, -1, k > 0 ? Math.sin(tq * 14) : -.9, { fish: 1, t }));
    let cx, cy, P;
    if (lt < .35) { cx = 900; cy = T(900); P = blend(pose('sneak'), pose('crouch', { rot: -.4 }), ss(lt / .35)); P.rot = -.4; }
    else if (lt < .8) { const u = seg(lt, .35, .8); cx = lerp(900, 520, u); cy = T(cx) - Math.sin(u * Math.PI) * 220; P = pose('leap', { rot: -.2 }); }
    else { const u = ei(seg(lt, .8, bell)); cx = lerp(520, 1440, u); cy = T(cx) + 8; P = pose('slide', { rot: -.4 }); if (lt > bell) { const v = seg(lt, bell, bell + .6); cx = 1440 + v * 300; cy = T(1440) + 8 + v * v * 500; } }
    R.fig(A => catSide(A, cx, cy, 300, lt < .8 ? -1 : 1, P, { t: tq }));
    // the bell hanging under the eave, swinging after the hit
    const sw = lt > bell ? Math.sin((lt - bell) * 9) * Math.exp(-(lt - bell) * 1.5) * .4 : 0;
    R.fig(A => { const p = [1500, 900]; A.group([x => { x.save(); x.translate(p[0], p[1]); x.rotate(sw); x.moveTo(-60, 0); x.lineTo(60, 0); x.lineTo(80, 150); x.lineTo(-80, 150); x.closePath(); x.restore(); }], '#8a7a44', 3); });
    snowfall(ctx, t, 13, 80, 1.4);
  },
});
const s26 = sheet('s26', {
  sky: x => { SKY.snow(x); }, col: x => { rect(x, '#4c5560', 0, 0, W, 160); rect(x, PAL.plaster, 0, 160, W, 860); for (let X = 200; X < W; X += 420) rect(x, '#8a3a2c', X, 160, X + 40, 860); }, key: x => { K(x, [[0, 160], [W, 160]], 3); for (let X = 200; X < W; X += 420) { x.strokeStyle = S; x.lineWidth = 2.4; x.strokeRect(X, 160, 40, 700); } K(x, [[0, 860], [W, 860]], 3); },
  cam: push(1, 1.04, 960, 560),
  paint(ctx, t, R, lt) {
    const tq = q8(lt), dump = HIT.snowdump - SH.s26.t0;
    const mx = lerp(1700, 1000, ss(seg(lt, 0, dump - .05)));
    if (lt < dump + .1) R.fig(A => monger(A, mx, 880, 560, -1, lt < dump - .15 ? manGait('run', (tq * 1.6) % 1) : { ...MP.stand, ha: -.4, brow: .8, eye: 1.3, mouth: 2 }, { pole: 'hand' }));
    // the avalanche: white blocks fall; then a snowman with a headband, blinking
    const f = seg(lt, dump - .05, dump + .25);
    if (f > 0 && f < 1) R.fig(A => { for (let i = 0; i < 5; i++) A.group([x => x.ellipse(mx + (i - 2) * 90, lerp(-100, 640, f) + i * 30, 150, 90, 0, 0, TAU)], PAL.white, 3, PAL.greyD); });
    if (lt >= dump + .1) R.fig(A => {
      A.group([x => x.ellipse(1000, 760, 260, 160, 0, 0, TAU), x => x.ellipse(1000, 560, 170, 150, 0, 0, TAU)], PAL.white, 3, PAL.greyD);
      A.group([x => { x.moveTo(840, 520); x.lineTo(1160, 510); x.lineTo(1160, 545); x.lineTo(840, 555); x.closePath(); }], PAL.white, 2.4);
      A.atop(x => { x.strokeStyle = PAL.ai; x.lineWidth = 4; for (let i = 0; i < 8; i++) { x.beginPath(); x.moveTo(850 + i * 40, 522); x.lineTo(870 + i * 40, 552); x.stroke(); } });
      const bl = (lt * 2.2) % 1 < .12;
      for (const ex of [950, 1050]) { if (bl) A.line([[ex - 18, 600], [ex + 18, 600]], 4); else A.kfill(x => x.ellipse(ex, 600, 13, 16, 0, 0, TAU)); }
      A.kfill(x => x.ellipse(1000, 668, 22, 14, 0, 0, TAU), '#7a2b22');
    });
    // the cat drops onto the snowman's head and springs off left
    const c = seg(lt, dump + .35, dump + 1.2);
    if (c > 0 && c < 1) R.fig(A => catSide(A, lerp(1100, 200, ss(c)), lerp(-100, 420, Math.min(1, c * 2.2)) - (c > .45 ? Math.sin((c - .45) / .55 * Math.PI) * 120 : 0), 260, -1, c < .45 ? pose('slide') : pose('leap'), { t: tq }));
    snowfall(ctx, t, 17, 70, 1.4);
  },
});
const s27 = sheet('s27', {
  sky: x => { SKY.snow(x); },
  cam: push(1, 1.05, 960, 540),
  paint(ctx, t, R, lt) { R.fig(A => kite(A, 1460, 700, 3000, -1, -.6, { t: 0, lw: 6 })); R.D(0, x => { x.strokeStyle = S; x.lineWidth = 9; x.lineCap = 'round'; x.beginPath(); x.moveTo(880, 625); x.quadraticCurveTo(940, 600 + ss(seg(lt, .3, .7)) * 22, 1010, 618); x.stroke(); }); snowfall(ctx, t, 19, 60, 2); },
});
const s30 = sheet('s30', {
  sky: x => { SKY.field(x); fuji(x, 1500, 520, 700, 260, { body: PAL.prusL }); },
  col: x => { rect(x, PAL.green, 0, 520, W, H); riceStalks(x, 1080, mulberry(4), 70, 1.6, 'col'); },
  key: x => { fuji(x, 1500, 520, 700, 260, { lines: true }); riceStalks(x, 1080, mulberry(4), 70, 1.6, 'key'); },
  cam: push(1, 1),
  paint(ctx, t, R, lt) {
    const tq = q8(lt), u = seg(lt, 0, 1.8), cx = lerp(2100, -250, u), cy = 840 - Math.abs(Math.sin(u * 7)) * 110;
    R.fig(A => catSide(A, cx, cy, 330, -1, gait('run', (tq * 2.4) % 1), { t: tq }));
    // foreground stalks bend away as the cat passes
    R.D(2, x => { const Rn = mulberry(8); for (let i = 0; i < 40; i++) { const X = Rn() * 2000, h = 300 + Rn() * 260, push = Math.exp(-Math.pow((X - cx) / 260, 2)) * (X < cx ? -1 : 1) * .5, a = (Rn() - .5) * .3 + push; x.strokeStyle = i % 2 ? PAL.green : PAL.greenD; x.lineWidth = 14; x.lineCap = 'round'; x.beginPath(); x.moveTo(X, 1120); x.quadraticCurveTo(X + Math.sin(a) * h * .4, 1120 - h * .6, X + Math.sin(a) * h, 1120 - Math.cos(a) * h); x.stroke(); x.strokeStyle = S; x.lineWidth = 2.4; x.stroke(); } });
  },
});
const s31 = sheet('s31', {
  sky: x => { SKY.field(x); },
  col: x => { rect(x, PAL.green, 0, 520, W, 700); rect(x, PAL.ochreL, 0, 700, W, 760); rect(x, '#8db0a6', 0, 760, W, H); },
  key: x => { K(x, [[0, 520], [W, 520]], 2); K(x, [[0, 700], [W, 700]], 2.6, { taper: [0, 0] }); K(x, [[0, 760], [W, 760]], 2.6, { taper: [0, 0] }); riceStalks(x, 1060, mulberry(6), 40, .8, 'key'); ripples(x, 800, 1080, 0, W, 9, S); },
  cam: push(1, 1.03),
  paint(ctx, t, R, lt) {
    const tq = q8(lt), sl = HIT.splash - SH.s31.t0;
    if (lt < sl) R.fig(A => monger(A, lerp(1900, 1150, seg(lt, 0, sl)), 720, 560, -1, lt < sl - .25 ? manGait('run', (tq * 1.7) % 1) : MP.fall, { pole: 'hand' }));
    else { const f = seg(lt, sl, sl + .35); R.fig(A => monger(A, lerp(1150, 980, f), lerp(720, 980, ei(f)), 560, -1, { ...MP.fall, lean: lerp(-.6, -1.4, f) }, { pole: 'hand', poleAng: -2 })); }
    // the splash (water claws) and the farmer's hat popping off
    const sp = seg(lt, sl + .25, sl + 1.1); if (sp > 0 && sp < 1) R.D(1, x => { for (let i = 0; i < 9; i++) claw(x, 900 + i * 40, 900, -1.57 + (i - 4) * .3, 200 * Math.sin(sp * Math.PI) + 40, 40, (i < 4 ? -1 : 1) * .8, { lw: 2.6, sub: 1, fill: '#f4ecd6', ink: PAL.prusD }); });
    R.fig(A => person(A, 520, 980, 420, 1, 'farmer', 0, { bend: lt < sl + .2 ? 1 : 0 }));
    if (lt > sl + .2) { const h = seg(lt, sl + .2, sl + 1.4); R.fig(A => A.group([x => { x.save(); x.translate(530 + h * 120, 560 - Math.sin(h * Math.PI) * 300); x.rotate(h * 8); x.moveTo(-90, 20); x.lineTo(0, -30); x.lineTo(90, 20); x.closePath(); x.restore(); }], PAL.straw, 2.6)); }
  },
});
const s32 = sheet('s32', {
  sky: x => { SKY.field(x); fuji(x, 960, 1000, 1700, 720, { body: PAL.prusL }); },
  col: x => { fuji(x, 960, 1000, 1700, 720, { snow: PAL.white, seed: 7 }); rect(x, PAL.green, 0, 1000, W, H); },
  key: x => { fuji(x, 960, 1000, 1700, 720, { lines: true, lw: 3 }); K(x, [[0, 1000], [W, 1000]], 3); },
  cam: push(1.02, 1),
  paint(ctx, t, R, lt) {
    // the arched leap held over the peak: the back arch rhymes with the mountain
    const u = seg(lt, 0, 1.8), cx = lerp(1500, 420, ss(u)), cy = 700 - Math.sin(u * Math.PI) * 120;
    R.fig(A => catSide(A, cx, cy, 620, -1, { ...gait('run', .5), arch: .2, eye: .9, brow: -.4 }, { t: q8(lt) }));
    kasumiLive(ctx, 960, 870, 1800, 40);
  },
});
function kasumiLive(ctx, cx, cy, w, h) { kasumi(ctx, cx, cy, w, h, PAL.white, .92); }
const s33 = sheet('s33', {
  sky: x => { SKY.field(x); }, col: x => { rect(x, PAL.green, 0, 860, W, H); riceStalks(x, 1100, mulberry(2), 30, 1.2, 'col'); }, key: x => { K(x, [[0, 860], [W, 860]], 2.4); riceStalks(x, 1100, mulberry(2), 30, 1.2, 'key'); },
  cam: (lt, d) => ({ cx: 960 + ss(seg(lt, .9, d)) * 300, cy: 560, z: lerp(1, 1.06, ss(lt / d)) }),
  paint(ctx, t, R, lt) { const p = Math.sin(lt * 18) * .5 + .5; R.fig(A => catFace(A, 940, 560, 780, fexpr('pant', { jaw: .25 + .2 * p, gx: -.6 }), { t: q8(lt) })); },
});
const s36 = sheet('s36', {
  sky: x => { SKY.pass(x); kasumi(x, 900, 760, 1600, 50, PAL.white, .9); },
  col: x => { x.fillStyle = PAL.woodD; x.beginPath(); poly(x, [[1050, 1080], [1170, 1080], [1150, 0], [1070, 0]]); x.fill(); },
  key: x => { K(x, [[1050, 1080], [1070, 0]], 3.2, { taper: [0, 0] }); K(x, [[1170, 1080], [1150, 0]], 3.2, { taper: [0, 0] }); for (let i = 0; i < 30; i++) { x.strokeStyle = S; x.lineWidth = 1.6; x.beginPath(); x.arc(1080 + (i % 3) * 30, 40 + i * 36, 12, .3, 2.8); x.stroke(); } },
  cam: push(1, 1.03),
  paint(ctx, t, R, lt) {
    const tq = q8(lt), u = seg(lt, 0, 1.66);
    R.fig(A => { pine(A.col, 1300, 300, 1.6, { seed: 4, lean: .2, lines: false, minI: 5 }); pine(A.key, 1300, 300, 1.6, { seed: 4, lean: .2, fills: false, minI: 5 }); });
    const off = seg(lt, .7, 1.6);
    R.fig(A => kite(A, 1350 - off * 600, lerp(200, -250, ei(off)), 360, -1, off > 0 ? Math.sin(tq * 14) : -.8, { fish: 1, t }));
    R.fig(A => catSide(A, 1110, lerp(1150, 380, u), 280, 1, { ...gait('run', (tq * 2.2) % 1), rot: -1.57, ha: .3 }, { t: tq }));
  },
});
const s37 = sheet('s37', {
  sky: x => { SKY.pass(x); },
  col: x => { x.fillStyle = '#9a8a5a'; x.beginPath(); poly(x, [[0, 1080], [0, 760], [W, 300], [W, 1080]]); x.fill(); x.strokeStyle = PAL.ochreL; x.lineWidth = 120; x.beginPath(); x.moveTo(-50, 900); x.lineTo(2000, 420); x.stroke(); },
  key: x => { K(x, [[0, 760], [W, 300]], 3); for (const o of [-60, 60]) K(x, [[-50, 900 + o], [2000, 420 + o]], 2.4, { taper: [0, 0] }); },
  cam: push(1, 1.03),
  paint(ctx, t, R, lt) {
    const tq = q8(lt), u = seg(lt, 0, 1.66), X = lerp(1500, 1250, u), Y = 900 - (X + 50) * (480 / 2050) + 40;
    R.fig(A => monger(A, X, Y, 560, -1, { ...MP.crawl, fnx: .14 + .04 * Math.sin(tq * 6), hnx: .5 + .05 * Math.sin(tq * 6 + 2) }, { pole: 'hand', poleAng: 1.2, sweat: true, t: lt }));
  },
});
const s38 = sheet('s38', {
  sky: x => { SKY.pass(x); },
  cam: (lt, d) => ({ cx: 960, cy: 560, z: lerp(1, 1.08, ss(seg(lt, .8, d))) }),
  paint(ctx, t, R, lt) { const a = seg(lt, .75, 1.05); R.fig(A => mongerFace(A, 960, 560, 620, fx(mexpr('exhausted'), mexpr('agape'), a), { t: lt })); },
});

// ———————————————————————————— D · the wave ————————————————————————————
const s41 = sheet('s41', {
  sky: x => { SKY.sea(x); bokashi(x, 0, 420, W, 1080, PAL.prusL, .9, 1, { rough: 16, seed: 103, col2: PAL.prusD }); },
  col: x => { x.fillStyle = PAL.ochreL; x.beginPath(); x.moveTo(0, 860); x.quadraticCurveTo(700, 900, 1100, 1080); x.lineTo(0, 1080); x.fill(); },
  key: x => { K(x, [[0, 420], [W, 420]], 1.8); K(x, [[0, 860], [700, 900], [1100, 1080]], 2.6); ripples(x, 440, 900, 600, W, 3, PAL.prusD); },
  cam: push(1, 1.03),
  paint(ctx, t, R, lt) {
    const tq = q8(lt), u = ss(seg(lt, 0, 2));
    const bxp = lerp(980, 1250, u), byp = 880 + Math.sin(lt * 3) * 6;
    R.D(1, x => { for (let i = 0; i < 6; i++) claw(x, 900 + i * 90, 940, -1.4, 60, 22, -.8, { lw: 2.2 }); });
    const b = boatFig(R, bxp, byp, 640, 1, -.05 + Math.sin(lt * 3) * .03);
    [[-260], [260]].forEach(([dx], i) => R.fig(A => person(A, bxp + dx * (1 - u * .4) - 80, 960, 420, 1, 'fisher', (tq * 1.3 + i * .5) % 1)));
    // the cat: run, leap at 0.9 s, land at the prow
    const j = seg(lt, .6, 1.2);
    let cx, cy, P;
    if (lt < .6) { cx = lerp(-150, 640, lt / .6); cy = 960; P = gait('run', (tq * 2.6) % 1); }
    else if (j < 1) { cx = lerp(640, b.prow[0] - 60, ss(j)); cy = lerp(960, b.prow[1] + 10, j) - Math.sin(j * Math.PI) * 260; P = pose('leap'); }
    else { cx = b.prow[0] - 60; cy = b.prow[1] + 10; P = pose('crouch', { ha: -.3, eye: 1.1, brow: -.4 }); }
    R.fig(A => catSide(A, cx, cy, 300, 1, P, { t: tq }));
  },
});
function boatFig(R, x0, y0, s, dir, tilt) { let o; R.fig(A => { o = boat(A, x0, y0, s, dir, { tilt, oar: true }); }); if (!o) { const q = [x0 + dir * .46 * s, y0 - .18 * s]; o = { prow: q, deck: [x0, y0 - .07 * s] }; } return o; }
const s42 = sheet('s42', {
  sky: x => { SKY.sea(x); bokashi(x, 0, 500, W, 1080, PAL.prus, .5, 1, { rough: 20, seed: 7 }); },
  cam: push(1, 1.05),
  paint(ctx, t, R, lt) {
    const open = ss(seg(lt, .35, .75)), drop = ei(seg(lt, .55, 2));
    R.D(1, x => { const k = seg(lt, 0, .5); for (let i = 0; i < 12; i++) claw(x, 600 + i * 70, 1200 - k * 420, -1.57 + (i - 6) * .12, 300 * k + 40, 70, (i < 6 ? -1 : 1) * .9, { lw: 3, sub: 2 }); });
    R.fig(A => talons(A, 960, 420, 380, 1 - open));
    R.fig(A => fish(A, [960, 620 + drop * 700], 520, -1.4 - drop * 2, Math.sin(lt * 10) * .3, 3.4));
  },
});
const s43 = sheet('s43', {
  sky: x => { SKY.sea(x); }, col: x => { waveWall(x, 'col', 60); }, key: x => { waveWall(x, 'key', 60); },
  cam: push(1, 1.08, 900, 600),
  paint(ctx, t, R, lt) {
    const tq = q8(lt), back = waveWall(null, 'none', 60);
    crestClaws(ctx, back, t, 1.4);
    const u = seg(lt, 0, 3), bxp = lerp(400, 640, u), byp = lerp(980, 820, u);
    const b = boatFig(R, bxp, byp, 700, 1, .38);
    R.fig(A => catSide(A, b.prow[0] - 80, b.prow[1] + 8, 280, 1, pose('crouch', { rot: -.38, ha: -.6, eye: 1.25, pupil: .9, brow: .5, ear: .3 }), { t: tq }));
    const f = seg(lt, 0, 3); R.fig(A => fish(A, [lerp(900, 980, f), lerp(-60, 220, f)], 240, lt * 4, Math.sin(lt * 9) * .3, 2.6));
  },
});
const s44 = sheet('s44', {
  sky: x => { SKY.sea(x); }, col: x => { const g = x.createLinearGradient(0, 0, 0, 500); g.addColorStop(0, '#0f2344'); g.addColorStop(1, PAL.prus); x.fillStyle = g; x.beginPath(); x.moveTo(0, 0); x.lineTo(W, 0); x.lineTo(W, 260); x.quadraticCurveTo(960, 520, 0, 300); x.fill(); },
  key: x => { x.strokeStyle = PAL.prusD; x.lineWidth = 4; x.beginPath(); x.moveTo(W, 260); x.quadraticCurveTo(960, 520, 0, 300); x.stroke(); },
  cam: (lt, d) => ({ cx: 960, cy: 600, z: lerp(1, 1.07, ss(lt / d)) }),
  paint(ctx, t, R, lt) {
    const Rn = mulberry(3 + Math.floor(q12(t) * 12) % 2);
    R.D(1, x => { for (let i = 0; i < 16; i++) { const X = i * 130, Y = 300 + 200 * Math.sin(i / 15 * Math.PI) * .8; claw(x, X, Y, 1.2 + (Rn() - .5) * .4, 120 + Rn() * 60, 40, .9, { lw: 2.6, sub: 2 }); } });
    const e = fx(fexpr('surprised', { gy: -.7 }), fexpr('awed', { gy: -.85 }), seg(lt, .2, 1.6)); e.open = lerp(1.1, 1.38, ss(seg(lt, .2, 2))); e.pupil = lerp(.6, 1, ss(seg(lt, .5, 2.5)));
    R.fig(A => catFace(A, 960, 700, 860, e, { t: q8(lt) }));
  },
});

// ———————————————————————————— E · home at dusk ————————————————————————————
const s49 = sheet('s49', {
  ...UBD, sid: 'ub_dusk', cam: push(1, 1.05, 1000, 600, 40, 10),
  under(ctx, t, R) { R.D(0, x => lanternGlow(x, 200, 120, 400, .9)); },
  paint(ctx, t, R, lt) {
    const tq = q8(lt), u = seg(lt, 0, 2.2), drop = lt > 2.3;
    R.fig(A => catSide(A, lerp(-200, 1000, ss(u)), 870, 400, 1, u < 1 ? gait('limp', (tq * 1.2) % 1, 'wet') : pose('sit', { ha: .2, ear: -.3, eye: .7 }), { t: tq, fish: drop ? 0 : 1 }));
    if (drop) R.fig(A => fish(A, [1180, 850], 300, .1, 0, 2.6));
    const k = ss(seg(lt, 1.6, 2.6)), hop = Math.abs(Math.sin(seg(lt, 2.2, 3.6) * Math.PI * 2)) * 60 * (lt < 3.6 ? 1 : 0);
    R.fig(A => kitten(A, lerp(1420, 1300, k), 865 - hop + (1 - k) * 120, 300, { E: fexpr(lt > 2.4 ? 'surprised' : 'hungry', { gx: -.5 }), t: tq, bob: Math.sin(tq * 6) }));
  },
});
const s50 = sheet('s50', {
  sky: x => { SKY.dusk(x); }, col: x => { rect(x, '#5d6272', 0, 860, W, H); rect(x, '#4c5262', 0, 0, 380, 860); }, key: x => { K(x, [[0, 860], [W, 860]], 3); stoneWall(x, 0, 0, 380, 860, null, 4, 80); K(x, [[380, 0], [380, 860]], 3); },
  cam: push(1, 1.04),
  under(ctx, t, R) { R.D(0, x => lanternGlow(x, 1500, 200, 700, .8)); },
  paint(ctx, t, R, lt) {
    const tq = q8(lt), chew = Math.sin(lt * 10) * .5 + .5;
    R.fig(A => { fish(A, [760, 900], 420, .05, 0, 3); kitten(A, 720, 980, 360, { E: fexpr('eat'), t: tq, dip: .6 + .2 * chew }); });
    R.fig(A => catFace(A, 1360, 520, 760, fexpr('tender', { tilt: .1, gx: -.6, gy: .5 }), { t: tq }));
  },
});
const BRT = 1800;   // tall sheet: ledge at the bottom, bridge rail at the top
const s51 = sheet('s51', {
  h: BRT,
  sky: x => { bokashi(x, 0, 0, W, 900, '#1a2440', 1, .55, { rough: 26, seed: 2, col2: '#3a4a6c' }); bokashi(x, 0, 700, W, 1100, PAL.beniL, 0, .6, { rough: 20, seed: 5 }); bokashi(x, 0, 1100, W, BRT, '#1d2a44', .8, 1, { rough: 14, seed: 31, col2: '#0d1424' }); },
  col: x => { rect(x, '#3b2e24', 0, 560, W, 640); for (let X = 100; X < W; X += 300) rect(x, '#2b221b', X, 640, X + 40, 1500); rect(x, '#5d6272', 0, 1560, W, BRT); x.strokeStyle = '#4a3a2c'; x.lineWidth = 14; x.beginPath(); x.moveTo(0, 440); x.lineTo(W, 440); x.stroke(); for (let X = 60; X < W; X += 200) rect(x, '#4a3a2c', X, 440, X + 16, 560); },
  key: x => { K(x, [[0, 560], [W, 560]], 3, { taper: [0, 0] }); K(x, [[0, 640], [W, 640]], 3, { taper: [0, 0] }); for (let X = 100; X < W; X += 300) { x.strokeStyle = S; x.lineWidth = 2.4; x.strokeRect(X, 640, 40, 860); } K(x, [[0, 1560], [W, 1560]], 3); K(x, [[0, 434], [W, 434]], 2.6); K(x, [[0, 448], [W, 448]], 2); for (let X = 60; X < W; X += 200) { x.lineWidth = 2; x.strokeRect(X, 440, 16, 120); } ripples(x, 1250, 1550, 0, W, 4, S); },
  cam: (lt, d) => { const u = ss(seg(lt, .4, 2.6)); return { cx: 960, cy: lerp(BRT - 540, 540, u), z: 1 }; },
  paint(ctx, t, R, lt) {
    const tq = q8(lt);
    R.fig(A => { catSide(A, 1000, 1580, 260, 1, pose('sit', { ha: .2, eye: .6 }), { t: tq }); kitten(A, 1200, 1575, 190, { E: fexpr('eat'), t: tq, dip: .6 }); fish(A, [1230, 1560], 200, 0, 0, 2.4); });
    const l = 760 + Math.sin(tq * 9) * 2;
    R.D(0, x => lanternGlow(x, 1060, 520, 420, .9));
    R.fig(A => monger(A, 1000, 560, 520, 1, { ...MP.lantern, ha: .55, neck: .25, brow: .2, eye: .7 }, { lantern: true, lit: true }));
  },
});
const s52 = sheet('s52', {
  sky: x => { SKY.dusk(x); },
  cam: push(1, 1.06),
  under(ctx, t, R) { R.D(0, x => lanternGlow(x, 1500, 760, 800, 1)); },
  paint(ctx, t, R, lt) {
    const a = seg(lt, 1.0, 1.6), b = seg(lt, 2.0, 2.8);
    const e = lt < 1.6 ? fx(mexpr('stern'), mexpr('sigh'), a) : fx(mexpr('sigh'), mexpr('soft'), b);
    R.fig(A => mongerFace(A, 940, 560, 620, e, { t: lt, wet: 1 }));
  },
});
const s53 = sheet('s53', {
  sky: x => { rect(x, '#5d6272', 0, 0, W, H); }, key: x => { stoneWall(x, 0, 0, W, H, null, 3, 140); },
  cam: push(1.02, 1),
  under(ctx, t, R) { R.D(0, x => lanternGlow(x, 1700, 100, 900, .9)); },
  paint(ctx, t, R, lt) {
    const g = HIT.gift - SH.s53.t0, inn = ss(seg(lt, 0, g)), out = ss(seg(lt, g + .5, 2.6));
    R.fig(A => { fish(A, [620, 760], 700, .1, 0, 4); kitten(A, 520, 820, 520, { E: fexpr('eat'), t: q8(lt), dip: .7 }); });
    const hx = lerp(2100, 1300, inn) + out * 800, hy = lerp(-200, 560, inn) - out * 700;
    if (lt < g + .05) R.fig(A => { bigHand(A, hx, hy, 380, 2.4, { curl: .4 }); fish(A, [hx - 200, hy + 160], 700, .05, 0, 4); });
    else R.fig(A => { fish(A, [1160, 720], 700, .05, 0, 4); bigHand(A, hx, hy, 380, 2.4, { curl: 0 }); });
  },
});
const s54 = sheet('s54', {
  sky: x => { SKY.dusk(x); }, col: x => { rect(x, '#4c5262', 0, 0, 300, H); }, key: x => { stoneWall(x, 0, 0, 300, H, null, 6, 90); K(x, [[300, 0], [300, H]], 3); },
  cam: push(1, 1.05),
  under(ctx, t, R) { R.D(0, x => lanternGlow(x, 1600, 200, 700, .8)); },
  paint(ctx, t, R, lt) {
    const bl = HIT.blink - SH.s54.t0, k = seg(lt, bl - .2, bl + .5);
    let e = fx(fexpr('surprised', { gy: -.7 }), fexpr('surprised', { gy: -.8, gx: .4 }), seg(lt, .2, .6));
    if (lt > bl - .2) { e = fx(e, fexpr('tender', { happy: 0, open: .5 }), seg(lt, bl - .2, bl + .3)); e.blink = Math.sin(clamp(k) * Math.PI); }
    if (lt > bl + .5) e = fexpr('tender', { tilt: .06 });
    R.fig(A => catFace(A, 960, 600, 820, e, { t: q8(lt) }));
  },
});

export const COVER = { s01, s03, s04, s05, s06, s07, s08, s09, s10, s11, s12, s13, s14, s15, s19, s20, s21, s24, s25, s26, s27, s30, s31, s32, s33, s36, s37, s38, s41, s42, s43, s44, s49, s50, s51, s52, s53, s54 };
