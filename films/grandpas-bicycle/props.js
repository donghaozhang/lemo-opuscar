// ---------- props: the bicycle, the stick, bags, trees, wall, lamp ----------
const INKB = '#2a2522', INKB2 = '#3b332d', STEEL = '#5a5752';
const BIKE = { R: 35.5, wb: 112, bb: [44, -30], saddle: [30, -99], headTop: [92, -88], headBot: [100, -60], grip: [82, -97], bell: [89, -94], rack: [[-34, -79], [14, -79]], crank: 17 };
// world point of a bike part, given the bike's placement (x,y = rear-wheel ground contact), dir, lean (rad), squash
function bikePt(Bk, p) {
  const s = Bk.squash ?? 1, c = Math.cos(Bk.lean || 0), sn = Math.sin(Bk.lean || 0);
  const x = p[0] * Bk.dir, y = p[1] * s;
  return [Bk.x + x * c - y * sn, Bk.y + x * sn + y * c];
}
const pedalPt = (Bk, side) => { const a = (Bk.crank || 0) + (side ? Math.PI : 0); return bikePt(Bk, [BIKE.bb[0] + Math.cos(a) * BIKE.crank, BIKE.bb[1] + Math.sin(a) * BIKE.crank]); };

function drawBike(ctx, cam, Bk, o = {}) {
  const z = cam.z, dir = Bk.dir, S = [], T = p => sp(cam, bikePt(Bk, p));
  const rot = (Bk.dist || 0) / BIKE.R;
  const A = { r: [0, -BIKE.R], f: [BIKE.wb, -BIKE.R] };
  const fr = o.frameCol || INKB, tyre = o.tyreCol || INKB2, a0 = o.alpha ?? 1;
  withSeed(o.seed || 21, () => {
    const wheel = (ax, ay) => {
      // tyre: four arcs of a thick wash, a thin rim, spokes rotating with distance
      const c = T([ax, ay]), R = BIKE.R * z;
      for (let k = 0; k < 4; k++) {
        const pts = []; for (let i = 0; i <= 8; i++) { const a = (k + i / 8) * Math.PI / 2 - Math.PI / 2 + rot * dir; pts.push([c[0] + Math.cos(a) * R, c[1] + Math.sin(a) * R]); }
        S.push(mk(pts, 4.2 * z, tyre, { prof: 'even', nb: z > 1.2 ? 3 : 0, a: .9, rib: .8, rough: .2 }));
      }
      { const pts = []; for (let i = 0; i <= 28; i++) { const a = i / 28 * Math.PI * 2 + rot * dir; pts.push([c[0] + Math.cos(a) * R * .9, c[1] + Math.sin(a) * R * .9]); } S.push(mk(pts, 1.2 * z, STEEL, { prof: 'even', nb: 0, a: .55 })); }
      const ns = o.spokes ?? (z < .6 ? 8 : 14);
      for (let i = 0; i < ns; i++) { const a = i / ns * Math.PI * 2 + rot * dir, b = a + .25; S.push(mk([[c[0] + Math.cos(a) * R * .12, c[1] + Math.sin(a) * R * .12], [c[0] + Math.cos(b) * R * .86, c[1] + Math.sin(b) * R * .86]], Math.max(.7, .9 * z), STEEL, { prof: 'even', nb: 0, a: .45 })); }
      dab(S, c[0], c[1], 3.2 * z, 3.2 * z, INKB, .9);
      // mudguard over the top
      { const pts = []; for (let i = 0; i <= 10; i++) { const a = Math.PI + i / 10 * Math.PI * .9 + .05 * Math.PI - (ax > 50 ? .15 : -.05) * dir; pts.push([c[0] + Math.cos(a) * (R + 4.5 * z), c[1] + Math.sin(a) * (R + 4.5 * z)]); } if (dir < 0) pts.reverse(); S.push(mk(pts, 3.6 * z, fr, { prof: 'even', nb: 0, a: .9, rib: .85 })); }
    };
    wheel(...A.r);
    const tube = (p, q, w = 3.4, col = fr) => { const a = T(p), b = T(q); S.push(mk(qcurve(a[0], a[1], b[0], b[1], 0, 5), w * z, col, { prof: 'even', nb: w * z > 7 ? 3 : 0, a: .92, rib: .85, rough: .15 })); };
    // rack over the rear wheel, stays, then the frame
    tube(BIKE.rack[0], BIKE.rack[1], 2.8); tube([BIKE.rack[0][0] + 4, BIKE.rack[0][1] + 3], [BIKE.rack[1][0] - 2, BIKE.rack[1][1] + 3], 1.6, STEEL);
    tube([-26, -76], [0, -BIKE.R], 1.8, STEEL); tube([10, -76], [0, -BIKE.R], 1.8, STEEL);
    tube([0, -BIKE.R], BIKE.bb, 3);                               // chain stay
    tube([0, -BIKE.R], [BIKE.saddle[0], BIKE.saddle[1] + 6], 3);  // seat stay
    tube(BIKE.bb, [BIKE.saddle[0], BIKE.saddle[1] + 4], 3.6);     // seat tube
    tube([BIKE.saddle[0] + 2, -90], [BIKE.headTop[0], BIKE.headTop[1] + 2], 3.6);  // top tube
    tube(BIKE.bb, [BIKE.headBot[0] - 2, BIKE.headBot[1] - 2], 3.6);               // down tube
    tube(BIKE.headTop, BIKE.headBot, 4);                            // head tube
    tube(BIKE.headBot, [BIKE.wb, -BIKE.R], 3.2);                    // fork
    // chain ring, cog, chain, cranks and pedals
    { const c = T(BIKE.bb); const pts = []; for (let i = 0; i <= 16; i++) { const a = i / 16 * Math.PI * 2; pts.push([c[0] + Math.cos(a) * 11 * z, c[1] + Math.sin(a) * 11 * z]); } S.push(mk(pts, 2.2 * z, INKB2, { prof: 'even', nb: 0, a: .85 })); }
    tube([BIKE.bb[0], BIKE.bb[1] - 11], [0, -BIKE.R - 4], 1.6, STEEL); tube([BIKE.bb[0], BIKE.bb[1] + 11], [0, -BIKE.R + 4], 1.6, STEEL);
    for (const side of [1, 0]) { const a = (Bk.crank || 0) + (side ? Math.PI : 0); const pe = [BIKE.bb[0] + Math.cos(a) * BIKE.crank, BIKE.bb[1] + Math.sin(a) * BIKE.crank]; tube(BIKE.bb, pe, 2.4, side ? mixc(STEEL, '#f1e9da', .35) : STEEL); const p = T(pe); dab(S, p[0], p[1], 5 * z, 1.8 * z, side ? mixc(INKB, '#f1e9da', .35) : INKB, .9); }
    wheel(...A.f);
    // saddle (sprung leather), handlebar, bell, lamp bracket
    { const p = T(BIKE.saddle); dab(S, p[0] + 2 * dir * z, p[1], 12 * z, 3.8 * z, '#4a2f22', .95, 0, z > 1.5 ? 3 : 0); dab(S, p[0] - 8 * dir * z, p[1] + 1 * z, 5 * z, 2.6 * z, '#4a2f22', .9); }
    { const a = T([BIKE.headTop[0] - 2, BIKE.headTop[1] - 2]), m = T([BIKE.headTop[0] + 4, BIKE.headTop[1] - 10]), b = T(BIKE.grip); S.push(mk(qctrl(a[0], a[1], m[0], m[1], b[0], b[1], 8), 3 * z, fr, { prof: 'even', nb: 0, a: .92 })); const g = T(BIKE.grip); dab(S, g[0], g[1], 5 * z, 2.4 * z, '#3b2a22', .95, Math.atan2(b[1] - m[1], b[0] - m[0])); }
    { const p = T(BIKE.bell); dab(S, p[0], p[1] - 2 * z, 4 * z, 3.2 * z, '#8f8a7e', .95); dab(S, p[0] - 1 * z, p[1] - 3.5 * z, 1.6 * z, 1.2 * z, '#f1e9da', .9); }
  });
  if (o.collect) return S;
  const p = o.p ?? 1;
  if (p >= 1) for (const s of S) drawS(ctx, s, 1, null, a0); else drawList(ctx, S, p, null, a0);
  return S;
}
// the bell, big, for the inserts: a domed cap, the lever, highlights left as paper
function bellStrokes(S, cx, cy, r, dir, lever = 0) {
  dab(S, cx, cy + r * .1, r, r * .78, '#8a857a', .95, 0, 5);
  dab(S, cx - dir * r * .2, cy - r * .2, r * .55, r * .4, '#a5a095', .6, 0, 3);
  dab(S, cx - dir * r * .3, cy - r * .35, r * .22, r * .14, '#f1e9da', .95);   // paper highlight
  dab(S, cx, cy + r * .78, r * 1.05, r * .12, '#4b4740', .9, 0, 3);          // the rim
  { const pts = qcurve(cx + dir * r * .5, cy + r * .55, cx + dir * r * 1.35, cy + r * .45 - lever * r * .3, -dir * r * .2, 6); S.push(mk(pts, r * .16, '#3a3632', { prof: 'tip', nb: 0, a: .92 })); }
  { const pts = qcurve(cx, cy + r * .85, cx, cy + r * 1.35, 0, 4); S.push(mk(pts, r * .2, '#3a3632', { prof: 'even', nb: 0, a: .9 })); }
}
function stickStrokes(S, x0, y0, len, z, dir, lean = 0) {
  // a hooked cane: the shaft, a curved handle at the top, a rubber foot
  const top = [x0 + Math.sin(lean) * len * dir, y0 - Math.cos(lean) * len];
  const s = mk(qcurve(x0, y0, top[0], top[1], 0, 8), 3.2 * z, '#5a3b25', { prof: 'even', nb: z > 1.5 ? 3 : 0, a: .92, rib: .85 });
  S.push(s, edgeOf(s, -1, Math.max(.8, .5 * z), INKB, .5));
  S.push(mk(qctrl(top[0], top[1], top[0] - dir * 2 * z, top[1] - 12 * z, top[0] - dir * 13 * z, top[1] - 6 * z, 8), 3.4 * z, '#5a3b25', { prof: 'even', nb: 0, a: .92 }));
  dab(S, x0, y0 + 1 * z, 2.6 * z, 1.6 * z, INKB, .85);
}
function satchelStrokes(S, cam, R, C, dir) {
  const z = cam.z, sh = R.sh, hip = R.hip;
  const bx = hip[0] - dir * 12, by = hip[1] - 4;
  const strap0 = sp(cam, [sh[0] + dir * 5, sh[1] + 3]), strap1 = sp(cam, [bx, by - 8]);
  S.push(mk(qcurve(strap0[0], strap0[1], strap1[0], strap1[1], 3 * z, 5), 2.6 * z, '#6b4a2e', { prof: 'even', nb: 0, a: .9 }));
  const b = sp(cam, [bx, by]); dab(S, b[0], b[1], 9 * z, 7 * z, '#8a6a42', .95, 0, z > 1.5 ? 3 : 0); dab(S, b[0], b[1] - 5 * z, 9 * z, 2.5 * z, '#6b4a2e', .9);
}
function backpackStrokes(S, cam, R, C, dir) {
  const z = cam.z, sh = R.sh, hip = R.hip;
  const cx = (sh[0] + hip[0]) / 2 - dir * 14, cy = (sh[1] + hip[1]) / 2 - 4;
  const b = sp(cam, [cx, cy]); dab(S, b[0], b[1], 10 * z, 16 * z, C.bag, .95, 0, z > 1.5 ? 4 : 0); dab(S, b[0] + dir * 2 * z, b[1] + 6 * z, 7 * z, 5 * z, mixc(C.bag, INKB, .25), .9);
  const s0 = sp(cam, [sh[0] + dir * 4, sh[1] + 2]), s1 = sp(cam, [cx + dir * 2, cy - 10]); S.push(mk(qcurve(s0[0], s0[1], s1[0], s1[1], -2 * z, 4), 2.6 * z, mixc(C.bag, INKB, .35), { prof: 'even', nb: 0, a: .85 }));
}
// the travel bag strapped to the rack
function rackBagStrokes(S, cam, Bk, col = '#6f6a5c', strapP = 1) {
  const z = cam.z, c = sp(cam, bikePt(Bk, [-10, -92]));
  dab(S, c[0], c[1], 26 * z, 13 * z, col, .95, 0, z > 1 ? 4 : 0); dab(S, c[0] - 4 * z * Bk.dir, c[1] - 7 * z, 14 * z, 5 * z, mixc(col, INKB, .3), .8);
  if (strapP > 0) { const a = sp(cam, bikePt(Bk, [-24, -80])), b = sp(cam, bikePt(Bk, [4, -106])); S.push(mk(qcurve(a[0], a[1], b[0], b[1], 6 * z, 6), 2.6 * z, '#3a3028', { prof: 'even', nb: 0, a: .9 })); }
}

// ---- trees (local coords, root at 0,0, y up negative; sc scales lengths and widths) ----
const SEASON = {
  summer:  { leaves: ['#8fae62', '#7a9a52', '#a3bd73', '#5f8044'], light: '#e9dcb4', wall: '#c9b48e', wall2: '#b39c76', ground: '#d9c9a2', sky: '#eadfbd', shade: '#4d6b3a', trunk: '#5a4636' },
  school:  { leaves: ['#d4913f', '#c27a2e', '#e2a855', '#a35b2a'], light: '#f0d9a0', wall: '#c9b48e', wall2: '#b39c76', ground: '#dcc497', sky: '#f1e0b6', shade: '#8a5a2a', trunk: '#5a4636' },
  leaving: { leaves: ['#b9772f', '#a66a2a', '#c48d49', '#7b4d26'], light: '#dcc9a2', wall: '#bfae8f', wall2: '#a4957a', ground: '#cdbb96', sky: '#cfd3cf', shade: '#6a4a2a', trunk: '#4e3d30' },
  winter:  { leaves: [], light: '#c9d0d8', wall: '#8c96a2', wall2: '#6f7d8c', ground: '#b6bec9', sky: '#aeb7c2', shade: '#50606f', trunk: '#3a3a40', snow: '#f1e9da' },
  spring:  { leaves: ['#a3c08a', '#b9d09a', '#8db072'], blossom: ['#e8c9c9', '#f0d8d4', '#dfb3b6', '#f3e0dc'], light: '#ead9d2', wall: '#c7b7a0', wall2: '#ad9c84', ground: '#d6cbb2', sky: '#ecdfd8', shade: '#6c8a5a', trunk: '#5a4636' },
};
function laneTree(sc, season, o = {}) {
  const P = SEASON[season], S = [], Hh = rnd(400, 500) * sc, lean = rnd(-.08, .08), tx = lean * Hh, ty = -Hh * .5, tips = [];
  const trunkPts = qcurve(0, 0, tx, ty, rnd(-10, 10) * sc, 10), tw = rnd(18, 24) * sc;
  const trunk = mk(trunkPts, tw, P.trunk, { prof: 'trunk', nb: 0, a: .95, rib: .9, rough: .12 });
  S.push(trunk, edgeOf(trunk, 1, 2 * sc, INKB, .6));
  function limb(x, y, ang, len, w, depth) {
    const pts = polar(x, y, ang, len, rnd(-.25, .25) * len, 7);
    S.push(mk(pts, w, P.trunk, { prof: 'tip', nb: 0, a: .95, rib: .9 }));
    const e = pts[pts.length - 1];
    if (depth <= 0 || len < 24 * sc) { tips.push(e); return; }
    const nk = rnd() < .45 ? 3 : 2;
    for (let k = 0; k < nk; k++) limb(e[0], e[1], ang + (k - (nk - 1) / 2) * .62 + rnd(-.25, .25), len * rnd(.6, .76), w * .62, depth - 1);
  }
  const nl = 3; for (let k = 0; k < nl; k++) limb(tx, ty, -Math.PI / 2 + (k - 1) * .6 + rnd(-.2, .2), Hh * rnd(.28, .36), tw * .55, 2);
  if (season === 'winter') { for (const [x, y] of tips) { S.push(mk(qcurve(x, y, x + rnd(-6, 6) * sc, y - rnd(4, 8) * sc, 0, 3), 4 * sc, P.snow, { prof: 'leaf', nb: 0, a: .9 })); } }
  else {
    const cols = season === 'spring' ? P.blossom : P.leaves, n = season === 'leaving' ? 10 : 18;
    for (const [x, y] of tips) clump(S, x, y - 2 * sc, rnd(40, 58) * sc, n, cols, { dir: Math.PI / 2, spread: .6, l0: 12 * sc, l1: 24 * sc, w0: 7 * sc, w1: 12 * sc, sx: 1.25, sy: .75, a0: .65, a1: .9 });
    if (season === 'spring') for (const [x, y] of tips) clump(S, x, y - 4 * sc, rnd(30, 46) * sc, 9, P.leaves, { l0: 8 * sc, l1: 16 * sc, w0: 5 * sc, w1: 8 * sc, a0: .5, a1: .7 });
  }
  return { S, top: ty - Hh * .5, tips };
}
// a short wall segment with brick texture and a tiled coping; local x from 0 to len
function wallStrokes(S, x0, len, h, season, sc = 1) {
  const P = SEASON[season];
  S.push(mkPoly([[x0 - 2, 0], [x0 + len + 2, 0], [x0 + len + 2, -h], [x0 - 2, -h]], P.wall, { a: .6, jit: 2.5 * sc }));
  for (let x = x0 + rnd(0, 30); x < x0 + len; x += rnd(26, 60)) { const y = -rnd(10, h - 12); S.push(mk(qcurve(x, y, x + rnd(14, 26) * sc, y + rnd(-1, 1), 0, 4), rnd(5, 8) * sc, P.wall2, { prof: 'even', nb: 0, a: rnd(.3, .5) })); }
  S.push(mk(qcurve(x0 - 2, -h - 3 * sc, x0 + len + 2, -h - 3 * sc, 0, 10), 7 * sc, mixc(P.wall2, INKB, .35), { prof: 'flat', nb: 3, a: .85, rough: .2 }));   // coping
  if (season === 'winter') S.push(mk(qcurve(x0 - 2, -h - 8 * sc, x0 + len + 2, -h - 8 * sc, 0, 10), 8 * sc, P.snow, { prof: 'flat', nb: 0, a: .95, rough: .3 }));
  { const base = mk(qcurve(x0 - 2, -4 * sc, x0 + len + 2, -4 * sc, 0, 8), 8 * sc, mixc(P.wall2, INKB, .25), { prof: 'flat', nb: 0, a: .35 }); S.push(base); }
}
function gateStrokes(S, x, h, season, sc = 1) {
  const P = SEASON[season];
  S.push(mkPoly([[x, 0], [x + 56 * sc, 0], [x + 56 * sc, -h * .92], [x, -h * .92]], '#5a3e2e', { a: .9, jit: 1.5 * sc }));
  S.push(mk(qcurve(x + 28 * sc, -h * .9, x + 28 * sc, -2, 0, 6), 2 * sc, INKB, { prof: 'flat', nb: 0, a: .6 }));
  for (const yy of [-h * .7, -h * .35]) S.push(mk(qcurve(x + 4 * sc, yy, x + 52 * sc, yy, 0, 4), 2 * sc, INKB, { prof: 'flat', nb: 0, a: .35 }));
  S.push(mk(qcurve(x - 8 * sc, -h * 1.02, x + 64 * sc, -h * 1.02, 0, 6), 12 * sc, mixc(P.wall2, INKB, .45), { prof: 'flat', nb: 3, a: .9 }));
  dab(S, x + 40 * sc, -h * .48, 2.5 * sc, 2.5 * sc, '#8a7a4a', .9);
}
function lampStrokes(S, x, h, sc = 1, lit = 0) {
  const s = mk(qcurve(x, 0, x, -h, 0, 8), 5 * sc, INKB2, { prof: 'even', nb: 0, a: .9, rib: .9 }); S.push(s);
  S.push(mk(qctrl(x, -h, x + 10 * sc, -h - 14 * sc, x + 26 * sc, -h - 10 * sc, 6), 3.5 * sc, INKB2, { prof: 'even', nb: 0, a: .9 }));
  dab(S, x + 28 * sc, -h - 4 * sc, 6 * sc, 5 * sc, lit ? '#e8b764' : '#9a948a', .95);
}
