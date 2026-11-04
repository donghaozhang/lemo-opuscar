// ---------- the lane: one painted world in two views ----------
// Profile view: world x along the lane (100 px per metre), ground at y = 0, the wall behind. Deep view: looking down the
// lane in one-point perspective, for the shots about distance. Objects are built as strokes at the shot's zoom and cached.
const LANE = { x0: -800, x1: 5600, end: 5000, wallH: 230, gate: 250, window: 470, lamp: 4900 };
const SPR = new Map();
function spriteAt(key, z, build) {
  const k = key + '@' + z.toFixed(3); let s = SPR.get(k);
  if (!s) { const S = build(z); s = { S, spr: sprite(S) }; SPR.set(k, s); if (SPR.size > 400) { const first = SPR.keys().next().value; SPR.delete(first); } }
  return s;
}
// draw a cached object at screen (X, Y) with paint-in progress p (1 = finished sprite)
function drawObj(ctx, obj, X, Y, p = 1, alpha = 1, skew = 0) {
  ctx.setTransform(1, 0, skew, 1, X, Y); ctx.globalAlpha = alpha;
  if (p >= 1) ctx.drawImage(obj.spr.cv, obj.spr.x0, obj.spr.y0); else drawList(ctx, obj.S, p);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
}
// the objects of the profile lane for one season (world placement; builders make strokes in local px at scale z)
const WORLDS = {};
function laneWorld(season) {
  if (WORLDS[season]) return WORLDS[season];
  const P = SEASON[season], O = [];
  withSeed(season.length * 101 + 7, () => {
    // wall segments, with a gate and (winter) a lit window near the house end
    for (let x = LANE.x0; x < LANE.end; x += 600) {
      const len = Math.min(600, LANE.end - x), seedK = 1000 + x;
      O.push({ kind: 'wall', x, y: 0, par: .9, order: 0, key: 'wall' + season + x, build: z => withSeed(seedK, () => { const S = []; wallStrokes(S, 0, len * z, LANE.wallH * z, season, z); return S; }) });
    }
    // the corner: a facing wall block at the far end, and the lamp
    O.push({ kind: 'end', x: LANE.end, y: 0, par: .9, order: 0, key: 'end' + season, build: z => withSeed(77, () => { const S = []; S.push(mk(qcurve(0, -LANE.wallH * .9 * z, 420 * z, -LANE.wallH * .9 * z, 0, 8), LANE.wallH * 1.8 * z, mixc(P.wall2, P.sky, .35), { prof: 'even', nb: 0, a: .55, rib: 1, rough: .05 })); S.push(mk(qcurve(0, -LANE.wallH * 1.75 * z, 420 * z, -LANE.wallH * 1.75 * z, 0, 8), 8 * z, mixc(P.wall2, INKB, .4), { prof: 'even', nb: 3, a: .8 })); return S; }) });
    O.push({ kind: 'lamp', x: LANE.lamp, y: 0, par: .92, order: 2, key: 'lamp' + season, build: z => withSeed(78, () => { const S = []; lampStrokes(S, 0, 330 * z, z, season === 'winter' ? 1 : 0); return S; }) });
    O.push({ kind: 'gate', x: LANE.gate, y: 0, par: .9, order: 1, key: 'gate' + season, build: z => withSeed(79, () => { const S = []; gateStrokes(S, 0, LANE.wallH * .95 * z, season, z); return S; }) });
    if (season === 'winter') O.push({ kind: 'window', x: LANE.window, y: 0, par: .9, order: 1, key: 'win' + season, build: z => withSeed(80, () => { const S = []; S.push(mk(qcurve(0, -150 * z, 60 * z, -150 * z, 0, 5), 70 * z, '#e8b764', { prof: 'even', nb: 0, a: .9, rib: 1, rough: .03 })); S.push(mk(qcurve(-4 * z, -115 * z, 64 * z, -115 * z, 0, 5), 7 * z, '#4a3a2e', { prof: 'even', nb: 0, a: .9 })); S.push(mk(qcurve(-4 * z, -187 * z, 64 * z, -187 * z, 0, 5), 7 * z, '#4a3a2e', { prof: 'even', nb: 0, a: .9 })); S.push(mk(qcurve(30 * z, -185 * z, 30 * z, -117 * z, 0, 5), 4 * z, '#4a3a2e', { prof: 'even', nb: 0, a: .8 })); return S; }) });
    // trees behind the wall (crowns above the coping) and a few on the lane side near the far end
    let k = 0;
    for (let x = 600; x < LANE.end - 200; x += rnd(520, 700), k++) {
      const sc = rnd(.9, 1.15), seedK = 300 + k;
      O.push({ kind: 'tree', x, y: -140, par: .86, order: 1, sway: .006, key: 'tree' + season + k, build: z => withSeed(seedK, () => laneTree(sc * z, season).S) });
    }
    for (const [x, sc, sd] of [[3300, 1.2, 401], [4500, 1.1, 402]]) O.push({ kind: 'tree', x, y: 0, par: 1, order: 4, sway: .006, key: 'ftree' + season + x, build: z => withSeed(sd, () => laneTree(sc * z, season).S) });
    // ground: a band of wash in segments with texture
    for (let x = LANE.x0; x < LANE.x1; x += 600) {
      const seedK = 2000 + x;
      O.push({ kind: 'ground', x, y: 0, par: 1, order: 3, key: 'gnd' + season + x, build: z => withSeed(seedK, () => {
        const S = [];
        S.push(mkPoly([[-2, 0], [602 * z, 0], [602 * z, 130 * z], [-2, 130 * z]], P.ground, { a: .5, jit: 2 * z }));
        S.push(mkPoly([[-2, 120 * z], [602 * z, 120 * z], [602 * z, 215 * z], [-2, 215 * z]], P.ground, { a: .25, jit: 3 * z }));
        S.push(mkPoly([[-2, 205 * z], [602 * z, 205 * z], [602 * z, 300 * z], [-2, 300 * z]], P.ground, { a: .1, jit: 4 * z }));
        S.push(mk(qcurve(-2, 3 * z, 602 * z, 3 * z, rnd(-2, 2) * z, 10), 5 * z, mixc(P.ground, INKB, .45), { prof: 'flat', nb: 4, a: .75, rough: .3 }));  // the kerb line
        for (let i = 0; i < 14; i++) { const xx = rnd(0, 600) * z, yy = rnd(12, 130) * z; S.push(mk(qcurve(xx, yy, xx + rnd(20, 60) * z, yy + rnd(-2, 2) * z, rnd(-3, 3), 4), rnd(2, 4) * z, mixc(P.ground, INKB, .3), { prof: 'leaf', nb: 0, a: .35 })); }
        if (season === 'school' || season === 'leaving') for (let i = 0; i < 16; i++) { const xx = rnd(0, 600) * z, yy = rnd(8, 120) * z; S.push(mk(qcurve(xx, yy, xx + rnd(6, 10) * z, yy + rnd(-1, 1) * z, 1, 3), rnd(4, 6) * z, pick(P.leaves), { prof: 'leaf', nb: 0, a: .7 })); }
        if (season === 'spring') for (let i = 0; i < 12; i++) { const xx = rnd(0, 600) * z, yy = rnd(8, 120) * z; S.push(mk(qcurve(xx, yy, xx + 5 * z, yy, 0, 3), 4 * z, pick(P.blossom), { prof: 'leaf', nb: 0, a: .8 })); }
        if (season === 'winter') { S.push(mkPoly([[-2, 0], [602 * z, 0], [602 * z, 125 * z], [-2, 125 * z]], P.snow, { a: .8, jit: 3 * z })); S.push(mk(qcurve(-2, 4 * z, 602 * z, 4 * z, 0, 8), 10 * z, P.snow, { prof: 'flat', nb: 0, a: .9, rough: .3 })); }
        return S; }) });
    }
  });
  O.sort((a, b) => a.order - b.order);
  return WORLDS[season] = O;
}
// paint the profile lane. cam {x,y,z}; reveal(x) → paint-in progress for an object at world x (1 = done)
function drawLane(ctx, season, cam, t, o = {}) {
  const P = SEASON[season], z = cam.z, reveal = o.reveal || (() => 1);
  // sky: a wash across the top of the sheet, stronger in winter
  const skyA = (o.skyA ?? (season === 'winter' ? .7 : season === 'leaving' ? .45 : .32)) * clamp(reveal(cam.x));
  if (skyA > 0) { const gy = sy(cam, -LANE.wallH * 1.2); const g = ctx.createLinearGradient(0, 0, 0, Math.max(60, gy)); g.addColorStop(0, rgba(P.sky, skyA)); g.addColorStop(1, rgba(P.sky, 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, 1920, Math.max(60, gy)); }
  const W = laneWorld(season);
  for (const ob of W) {
    const X = (ob.x - cam.x * ob.par) * z + 960, Y = (ob.y - cam.y) * z + 540;
    const obj = spriteAt(ob.key, z, ob.build);
    if (X + obj.spr.x1 < -80 || X + obj.spr.x0 > 2000 || Y + obj.spr.y0 > 1160 || Y + obj.spr.y1 < -80) continue;
    const p = reveal(ob.x, ob.kind); if (p <= 0) continue;
    const sk = ob.sway && p >= 1 ? ob.sway * (Math.sin(t * 1.15 + ob.x) + .4 * Math.sin(t * 2.7 + ob.x * 2)) : 0;
    drawObj(ctx, obj, X, Y, p, ob.kind === 'tree' && ob.par < 1 ? .9 : 1, sk);
  }
}
// season weather: falling leaves, snow, petals (screen space, deterministic)
function drawWeather(ctx, season, t, cam, I = 1, o = {}) {
  if (I <= 0 || season === 'summer') return;
  const z = cam.z, N = Math.round((season === 'winter' ? 110 : season === 'spring' ? 70 : season === 'leaving' ? 48 : 22) * I);
  const P = SEASON[season];
  withSeed(5, () => {
    for (let i = 0; i < N; i++) {
      const sp0 = rnd(.5, 1), ph = rnd(0, 100), x0 = rnd(-200, 2100), wob = rnd(.6, 1.6);
      const fall = season === 'winter' ? 55 : season === 'spring' ? 70 : 120;
      const y = ((ph * 97 + t * fall * sp0 * z * .6) % 1300) - 150 + (o.yOff || 0);
      const x = x0 + Math.sin(t * wob + ph) * 30 * z * .6 + (season === 'leaving' ? t * 60 * z * .4 : 0) - (o.drift || 0);
      const xx = ((x + 300) % 2400 + 2400) % 2400 - 300; if (xx < -20 || xx > 1940) continue;
      ctx.save(); ctx.translate(xx, y); ctx.rotate(t * wob + ph);
      if (season === 'winter') { ctx.beginPath(); ctx.arc(0, 0, rnd(1.6, 3.2) * Math.sqrt(z) , 0, 7); ctx.fillStyle = rgba(P.snow, .9 * I); ctx.fill(); }
      else { const col = season === 'spring' ? pick(P.blossom) : pick(P.leaves), w = (season === 'spring' ? rnd(4, 7) : rnd(6, 10)) * Math.sqrt(z); ctx.beginPath(); ctx.ellipse(0, 0, w, w * .45, 0, 0, 7); ctx.fillStyle = rgba(col, .85 * I); ctx.fill(); }
      ctx.restore();
    }
  });
}
// winter dusk: the whole sheet cools; then the one warm window throws light on the snow (drawn after the lane)
function drawDusk(ctx, cam, I, lampX, lampY) {
  if (I <= 0) return;
  ctx.fillStyle = rgba('#4e5d70', .22 * I); ctx.fillRect(0, 0, 1920, 1080);
  const X = sx(cam, lampX), Y = sy(cam, lampY), r = 420 * cam.z;
  const g = ctx.createRadialGradient(X, Y, 0, X, Y, r); g.addColorStop(0, rgba('#e8b764', .42 * I)); g.addColorStop(.5, rgba('#e8b764', .14 * I)); g.addColorStop(1, rgba('#e8b764', 0));
  ctx.fillStyle = g; ctx.fillRect(X - r, Y - r, 2 * r, 2 * r);
}

// ---- deep view: looking down the lane ----
// V = {vx, vy, f, h}: vanishing point, focal length (px), camera height (m). A point at depth d (m), lateral x (m, + right),
// height y (m, up) → screen (vx + x f/d, vy + (h − y) f/d). Figures use a per-figure camera so drawFigure can be reused.
function deepPt(V, d, xm, ym = 0) { return [V.vx + xm * V.f / d, V.vy + (V.h - ym) * V.f / d]; }
function deepCam(V, d, xm, wx = 0) { const z = V.f / d / 100, [X, Y] = deepPt(V, d, xm, 0); return { x: wx - (X - 960) / z, y: -(Y - 540) / z, z }; }
function drawDeepLane(ctx, season, V, t, o = {}) {
  const P = SEASON[season], rev = o.reveal ?? 1, key = 'deep' + season + V.vx + ',' + V.vy + ',' + V.f + ',' + V.h + ',' + (o.near ?? 1);
  const obj = spriteAt(key, 1, () => withSeed(909, () => {
    const S = [], near = o.near ?? 1, far = 60, wallH = 2.3, lw = 2.0;
    // the block at the far end, and a sky wash above it
    const [ex, ey] = deepPt(V, far, 0, 0), [, eyT] = deepPt(V, far, 0, 4);
    S.push(mkPoly([[ex - 300, ey + 2], [ex + 300, ey + 2], [ex + 300, eyT], [ex - 300, eyT]], mixc(P.wall2, P.sky, .55), { a: .5, jit: 2 }));
    // ground: one trapezoid, lighter toward the far end (two polygons), then perspective texture lines
    { const [ax, ay] = deepPt(V, far, -lw * 1.3), [bx] = deepPt(V, far, lw * 1.3), [cx, cy] = deepPt(V, near, lw * 2.2), [dx] = deepPt(V, near, -lw * 2.2);
      S.push(mkPoly([[ax, ay], [bx, ay], [cx, cy + 60], [dx, cy + 60]], P.ground, { a: .42, jit: 3 }));
      const [mx, my] = deepPt(V, far / 4, -lw * 1.6), [nx] = deepPt(V, far / 4, lw * 1.6);
      S.push(mkPoly([[mx, my], [nx, my], [cx, cy + 60], [dx, cy + 60]], P.ground, { a: .2, jit: 4 }));
      if (season === 'winter') S.push(mkPoly([[ax, ay], [bx, ay], [cx, cy + 60], [dx, cy + 60]], P.snow, { a: .7, jit: 3 }));
      for (let i = 0; i < 26; i++) { const d = rnd(near * 1.1, far * .8), xm = rnd(-lw * 1.4, lw * 1.4), [x, y] = deepPt(V, d, xm), [x2, y2] = deepPt(V, d * .92, xm); S.push(mk([[x, y], [x2, y2]], Math.max(1.5, 90 / d), mixc(P.ground, INKB, .3), { prof: 'leaf', nb: 0, a: .3 })); }
      // the kerb lines on both sides
      for (const side of [-1, 1]) { const [k0x, k0y] = deepPt(V, far, side * lw * 1.02), [k1x, k1y] = deepPt(V, near, side * lw * 1.02); S.push(mk([[k0x, k0y], [(k0x + k1x) / 2, (k0y + k1y) / 2], [k1x, k1y]], 6, mixc(P.ground, INKB, .45), { prof: 'tip', nb: 3, a: .6, rough: .3 })); }
    }
    // left wall: one polygon from far to near, with a coping line, brick hints by depth
    { const [ax, ay] = deepPt(V, far, -lw), [, ty] = deepPt(V, far, -lw, wallH), [bx, by] = deepPt(V, near, -lw), [, ty2] = deepPt(V, near, -lw, wallH);
      S.push(mkPoly([[ax, ay], [bx, by], [bx, ty2], [ax, ty]], P.wall, { a: .6, jit: 3 }));
      S.push(mkPoly([[ax, ay], [(ax + bx) * .5, (ay + by) * .5], [(ax + bx) * .5, (ty + ty2) * .5], [ax, ty]], mixc(P.wall, P.sky, .5), { a: .35, jit: 2 }));
      S.push(mk([[ax, ty], [(ax + bx) / 2, (ty + ty2) / 2], [bx, ty2]], 9, mixc(P.wall2, INKB, .35), { prof: 'tip', nb: 3, a: .8, rough: .2 }));
      if (season === 'winter') S.push(mk([[ax, ty - 2], [(ax + bx) / 2, (ty + ty2) / 2 - 4], [bx, ty2 - 8]], 10, P.snow, { prof: 'tip', nb: 0, a: .9, rough: .3 }));
      for (let i = 0; i < 40; i++) { const d = rnd(near * 1.2, far * .7), ym = rnd(.2, wallH * .9), [x, y] = deepPt(V, d, -lw, ym), [x2] = deepPt(V, d * .9, -lw, ym); S.push(mk(qcurve(x, y, x2, y + (x2 - x) * .02, 0, 3), Math.max(1.5, 60 / d), P.wall2, { prof: 'even', nb: 0, a: .35 })); }
    }
    if (!/nolamp/.test(window.DBG || '')) // the lamp post at the corner
    { const [lx0, ly0] = deepPt(V, 50, lw * 1.1, 0), n0 = S.length; lampStrokes(S, lx0, 3.3 * V.f / 50, V.f / 50 / 100, season === 'winter' ? 1 : 0); for (const s of S.slice(n0)) for (const p of s.pts) p[1] += ly0; }
    // trees on the right, far to near (the nearest crowns reach into the frame from above)
    const ds = [44, 30, 20, 13, 8.5].filter(d => d >= near);
    if (!/notree/.test(window.DBG || '')) for (const d of ds) { const [tx, ty] = deepPt(V, d, lw * 1.15 + rnd(-.2, .2), 0), sc = V.f / d / 100 * rnd(.95, 1.15); const T = laneTree(sc, season).S; for (const s of T) for (const p of s.pts) { p[0] += tx; p[1] += ty; } S.push(...T); }
    return S;
  }));
  // paint-in: far first (the list is ordered far → near already)
  drawObj(ctx, obj, 0, 0, rev, 1);
}
