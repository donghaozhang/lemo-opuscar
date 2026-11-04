// ---------- the film: pages, shots, notes, subtitles, sound events, compositor ----------
const TB = TL.B;
const camAt = (x, groundY, z) => ({ x, y: -(groundY - 540) / z, z });
const PAGES = [], SHOTS = [], NOTES = [], SUBS = [], EVENTS = [];
const ev = (t, type, o = {}) => EVENTS.push(Object.assign({ t: +t.toFixed(3), type }, o));
let FROZEN = new Map();

// ---- helpers ----
// paint-in of a lane page: walls first, then trees, ground, figures; swept left to right
function laneReveal(t0, cam) {
  const xl = cam.x - 960 / cam.z, xr = cam.x + 960 / cam.z;
  return (x, kind) => {
    const u = clamp((x - xl) / (xr - xl));
    const d = kind === 'wall' || kind === 'end' ? 0 : kind === 'gate' || kind === 'window' ? .5 : kind === 'ground' ? .4 : kind === 'lamp' ? .9 : 1.0;
    return clamp((t - t0 - d - u * .9) / .9);
  };
}
let t = 0; // the current time, shared with reveal closures
function mistDraw(ctx, c) {
  if (c <= 0) return;
  for (const [lift, a] of [[120, .55], [0, 1]]) {
    const top = 1180 - eio(c) * 1500 - lift;
    ctx.save(); ctx.beginPath(); ctx.moveTo(-10, 1100);
    for (let x = -10; x <= 1960; x += 40) ctx.lineTo(x, top + (vnoise(x * .006 + lift) - .5) * 160 + Math.sin(x * .01 + t) * 12);
    ctx.lineTo(1930, 1100); ctx.closePath(); ctx.clip(); ctx.globalAlpha = a; ctx.drawImage(PAPER_IMG, 0, 0); ctx.restore();
  }
}
function wipeClip(ctx, p) {
  const R = lerp(-170, 2120, eio(p)); ctx.beginPath(); ctx.moveTo(-10, -10);
  for (let y = -10; y <= 1090; y += 40) ctx.lineTo(R + (vnoise(y * .02 + 3) - .5) * 170, y);
  ctx.lineTo(-10, 1090); ctx.closePath(); ctx.clip();
}
// the figure's skin tone hand on something, big (inserts)
function drawStrokes(ctx, S, p = 1, a = 1) { if (p >= 1) for (const s of S) drawS(ctx, s, 1, null, a); else drawList(ctx, S, p, null, a); }
// the bell insert, big: the handlebar, a domed bell in layers, its lever, a thumb that flicks it (used twice: summer, spring)
function bellInsert(ctx, t, t0, tDing, skin, o = {}) {
  const S = [], z = o.z ?? 1, cx = 960, cy = 520;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(z, z);
  const flick = seg(t, tDing - .14, tDing) - seg(t, tDing + .06, tDing + .55);
  withSeed(o.seed || 12, () => {
    // the bar: a curved black tube with a shadow edge, and the rubber grip at right
    const bar = mk(qcurve(-980, 210, 620, 150, 18, 12), 54, INKB, { prof: 'flat', nb: 6, a: .92, rib: .82, rough: .08 }); S.push(bar, edgeOf(bar, 1, 5, '#000', .35));
    S.push(mk(qcurve(560, 150, 980, 140, 4, 8), 66, '#3b2a22', { prof: 'flat', nb: 5, a: .95, rib: .9, rough: .1 }));
    for (let i = 0; i < 5; i++) S.push(mk(qcurve(620 + i * 70, 118, 620 + i * 70, 176, 0, 3), 6, '#241a14', { prof: 'even', nb: 0, a: .5 }));
    // the clamp and the bell: rim, dome, cap, a paper highlight, the strike lever
    dab(S, 0, 120, 80, 22, '#4b4740', .9, 0, 3);
    dab(S, 0, 20, 175, 118, '#86817a', .95, 0, 6); dab(S, -20, -30, 150, 95, '#9a958b', .75, 0, 5); dab(S, -45, -75, 95, 52, '#aaa59a', .6, 0, 4);
    dab(S, 0, 95, 190, 24, '#4b4740', .92, 0, 4);
    dab(S, -70, -82, 42, 22, '#f1e9da', .95, -.3);
    dab(S, 22, 28, 60, 34, '#6e6a62', .45, 0, 3);
    const la = -.15 - flick * .55, L = 150; S.push(mk(qcurve(130, 64, 130 + Math.cos(la) * L, 64 + Math.sin(la) * L, -10, 7), 26, '#3a3632', { prof: 'even', nb: 3, a: .95, rib: .9 })); const le = [130 + Math.cos(la) * L, 64 + Math.sin(la) * L]; dab(S, le[0], le[1], 22, 20, '#3a3632', .95);
  });
  drawStrokes(ctx, S, seg(t, t0, t0 + 1.6));
  // the thumb comes in from below right, pushes the lever, drops back
  const th = ss(seg(t, t0 + .6, tDing - .12)), T = [];
  const tx = lerp(640, 300, th) - flick * 80, ty = lerp(560, 190, th) - flick * 60;
  withSeed(13, () => {
    const hand = mk(qcurve(tx + 420, ty + 360, tx + 120, ty + 110, -60, 8), 190, skin, { prof: 'flat', nb: 6, a: .92, rib: .85, rough: .08 }); T.push(hand);
    const thumb = mk(qcurve(tx + 150, ty + 120, tx, ty, -40, 8), 92, skin, { prof: 'tip', nb: 5, a: .95, rib: .88, rough: .1 }); T.push(thumb, edgeOf(thumb, -1, 7, mixc(skin, INKB, .45), .45));
    dab(T, tx + 10, ty + 6, 26, 18, mixc(skin, '#f1e9da', .55), .8, -.6);
  });
  if (th > 0) drawStrokes(ctx, T, 1, ss(seg(t, t0 + .6, t0 + .9)));
  ctx.restore();
}
// the seal-like stamp at the end
function stampDraw(ctx, x, y, p) {
  if (p <= 0) return;
  withSeed(404, () => {
    ctx.save(); ctx.globalAlpha = ss(p); ctx.translate(x, y); ctx.rotate(-.06);
    const S = []; S.push(mkPoly([[-62, -62], [62, -62], [62, 62], [-62, 62]], '#c8442a', { a: .55, jit: 3 }));
    for (let i = 0; i < 5; i++) S.push(mk(qcurve(-54, -46 + i * 23, 54, -46 + i * 23 + rnd(-2, 2), 0, 8), 7, '#b8401f', { prof: 'even', nb: 3, a: .3 }));
    drawStrokes(ctx, S);
    ctx.font = `600 36px ${FONT_SERIF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = rgba('#f1e9da', .95);
    ctx.fillText('小荷', 0, -22); ctx.fillText('画本', 0, 24);
    ctx.restore();
  });
}

// ---- notes on the page (screen space, persistent until the page ends) ----
// {page, id, txt, t0, t1, x, y, size, align, font: 'hand'|'mono'|'serif', anchor: [ax, ay] (leader), lead}
function note(o) { NOTES.push(o); }
function drawNotes(ctx, t, page) {
  for (const n of NOTES) {
    if (n.page !== page || t < n.t0 || t > n.t1) continue;
    const fadeOut = 1 - ss(seg(t, n.t1 - .4, n.t1)), p = seg(t, n.t0 + (n.anchor ? .35 : 0), n.t0 + (n.anchor ? .35 : 0) + (n.dur ?? Math.max(.8, n.txt.length * .13)));
    ctx.save(); ctx.globalAlpha = fadeOut * (n.a ?? 1);
    if (n.anchor) { const la = n.leadUntil ? 1 - ss(seg(t, n.leadUntil - .3, n.leadUntil)) : 1; if (la > 0) { ctx.globalAlpha = fadeOut * la; leaderL(ctx, n.x + (n.lead ?? 0), n.y + (n.leadY ?? (n.size || 44) * .55), n.anchor[0], n.anchor[1], seg(t, n.t0, n.t0 + .5), n.bend ?? 18); ctx.globalAlpha = fadeOut * (n.a ?? 1); } }
    if (n.font === 'mono') mono(ctx, n.id, n.txt, n.x, n.y, p, { size: n.size || 26, align: n.align });
    else if (n.font === 'serif') serif(ctx, n.id, n.txt, n.x, n.y, p, { size: n.size || 88, w: 600, align: n.align || 'center' });
    else hand(ctx, n.id, n.txt, n.x, n.y, p, { size: n.size || 44, align: n.align });
    if (n.tally) tally(ctx, n.x + n.tallyX, n.y + 8, n.tally, seg(t, n.t0 + 1.6, n.t0 + 2.6), 30);
    ctx.restore();
  }
}
function drawSubsHand(ctx, t) {
  for (const s of SUBS) {
    const f = ss(seg(t, s.t0, s.t0 + .25)) * (1 - ss(seg(t, s.t1 - .4, s.t1))); if (f <= 0) continue;
    ctx.save(); ctx.globalAlpha = f;
    hand(ctx, 'sub' + s.t0, s.text, 960, 985, seg(t, s.t0, s.t0 + s.text.length * .16), { size: 54, align: 'center', col: INKT, a: .85, noreg: true });
    ctx.restore();
  }
}

// ---- building ----
function buildFilm() {
  const he6 = CHARS.he6, he10 = CHARS.he10, he18 = CHARS.he18, he25 = CHARS.he25, gp60 = CHARS.gp60, gp64 = CHARS.gp64, gp72 = CHARS.gp72, gp79 = CHARS.gp79;
  const page = (id, t0, t1, season) => PAGES.push({ id, t0, t1, season });
  const shot = o => SHOTS.push(o);
  const ST = SEC;
  // ======== page 0: the bell and the specimen plate (0 – 11) ========
  page('plate', 0, ST.plate.end, null);
  // shot 1: the bell, three strokes, rung
  shot({ id: 'bell', t0: 0, t1: 3.0, page: 'plate', trans: 'none', draw(ctx, t) {
    bellInsert(ctx, t, 0.0, HT.ding0, he6.skin, { z: lerp(1, 1.05, ss(seg(t, 0, 3))) });
  } });
  ev(.15, 'brush', { dur: 1.6, pan: -.3 }); ev(HT.ding0, 'bell', { v: 1, hit: 'ding0' }); ev(HT.ding0 + .22, 'bell', { v: .7 });
  // shot 2: pull back to the plate, the bicycle paints itself in
  shot({ id: 'plate', t0: 3.0, t1: ST.plate.end, page: 'plate', trans: 'wipe', wipe: .7, draw(ctx, t) {
    const k = eio(seg(t, 3.0, 5.2)), z = lerp(6.5, 4.3, k);
    const cam = camAt(lerp(89, 58, k), lerp(540 + 94 * 6.5, 800, k), z);  // from the bell to the whole bicycle
    const p = seg(t, 3.0, 7.2);
    drawBike(ctx, cam, { x: 0, y: 0, dir: 1, crank: .4, dist: 0 }, { p, seed: 21, spokes: 16 });
  } });
  ev(3.0, 'brush', { dur: 4.0, pan: -.6, pan1: .6 }); ev(3.6, 'pencil', { dur: 1.2 }); ev(5.9, 'pencil', { dur: .9 }); ev(6.9, 'pencil', { dur: .7 }); ev(7.9, 'pencil', { dur: .7 });
  { const cam = camAt(58, 800, 4.3), P = p => sp(cam, p);
    note({ page: 'plate', id: 'title', txt: '外公的单车', t0: 3.6, t1: ST.plate.end, x: 960, y: 150, font: 'serif', size: 96, dur: 1.3 });
    note({ page: 'plate', id: 'n28', txt: '28寸 · 黑色', t0: 5.9, t1: ST.plate.end, x: 150, y: 930, anchor: P([0, -35.5]), lead: 120, leadY: -22, bend: -30, size: 44 });
    note({ page: 'plate', id: 'nbell', txt: '铃铛（很响）', t0: 6.9, t1: ST.plate.end, x: 1420, y: 250, anchor: P(BIKE.bell), lead: 60, leadY: 30, bend: 20, size: 44 });
    note({ page: 'plate', id: 'nrack', txt: '后座', t0: 7.9, t1: ST.plate.end, x: 190, y: 430, anchor: P([-12, -80]), lead: 80, leadY: 28, bend: 24, size: 48 }); }

  // ======== page 1: summer, age six (11 – 48.14) ========
  const S0 = ST.summer.t, SE = ST.summer.end, SB = (b, k = 0) => TB('summer', b, k);
  page('summer', S0, SE, 'summer');
  ev(S0, 'page', { hit: 'pageSummer' }); ev(S0 - .5, 'cicada', { dur: SE - S0 + 1.5, v: .5 }); ev(S0 + .1, 'brush', { dur: 2.6, pan: -.8, pan1: .8 });
  note({ page: 'summer', id: 'nsummer', txt: '夏 · 六岁 · 屋后的巷子', t0: S0 + 1.2, t1: SE, x: 110, y: 120, size: 46 });
  ev(S0 + 1.2, 'pencil', { dur: 1.4 });
  // shot 3: wide, the lane; grandpa wheels the bike in, Xiao He runs ahead
  shot({ id: 's3', t0: S0, t1: SB(3), page: 'summer', trans: 'turn', draw(ctx, t) {
    const cam = camAt(1000 + 300 * ss(seg(t, S0, SB(3))), 810, .72), rv = laneReveal(S0, cam);
    drawLane(ctx, 'summer', cam, t, { reveal: rv });
    const fp = clamp((t - S0 - 1.3) / .9), lt = t - S0, bx = 120 + 95 * lt, ph = lt * 1.1;
    const Bk = { x: bx, y: 0, dir: 1, dist: bx - 120, crank: (bx - 120) / (2.75 * BIKE.R) };
    drawBike(ctx, cam, Bk, { p: fp, seed: 21 });
    drawFigure(ctx, gp60, wheelPose(gp60, Bk, ph, { expr: E('calm') }), cam, { seed: 31, p: fp });
    const hx = 420 + 170 * lt; drawFigure(ctx, he6, runPose(he6, hx, lt * 2.4, 1, { expr: E('joy') }), cam, { seed: 32, p: clamp((t - S0 - 1.6) / .8) });
  } });
  ev(S0 + 1.5, 'steps', { dur: SB(3) - S0 - 1.5, rate: 4.8, v: .35, pan: -.1 }); ev(S0 + 1.6, 'chain', { dur: SB(3) - S0 - 1.6, v: .25 });
  // shot 4: medium two-shot: she scrambles onto the saddle, legs dangling; he holds the bike, amused
  shot({ id: 's4', t0: SB(3), t1: SB(5, 1.5), page: 'summer', trans: 'wipe', draw(ctx, t) {
    const cam = camAt(840, 820, 1.7), T0 = SB(3);
    drawLane(ctx, 'summer', cam, t);
    const Bk = { x: 780, y: 0, dir: 1, dist: 0, crank: .9 };
    drawBike(ctx, cam, Bk, { seed: 21 });
    const sad = bikePt(Bk, BIKE.saddle), grip = bikePt(Bk, BIKE.grip);
    // grandpa behind, holding the saddle and the bars, standing astride
    drawFigure(ctx, gp60, { x: 700, y: 0, dir: 1, lean: .22, turn: .4, expr: exprAt([[0, 'focus'], [T0 + 2.9, 'amused']], t, .6), feet: [[724, 0], [676, 0]], hands: [[sad[0] - 10, sad[1] + 2], [grip[0] - 6, grip[1] + 2]], kneeSide: [1, 1], elbowSide: [1, 1] }, cam, { seed: 31 });
    // Xiao He: on the near side, foot on the pedal, hop, then sits on the saddle with legs hunting for the pedals
    const ped0 = pedalPt(Bk, 0), ped1 = pedalPt(Bk, 1);
    const hunt = Math.sin((t - T0) * 9) * 7;
    const keys = [
      [T0, { x: 760, y: 0, dir: 1, hipY: -42, lean: .15, turn: .4, expr: E('determined'), feet: [[ped0[0], ped0[1]], [748, 0]], hands: [grip, [grip[0] - 3, grip[1] + 1]], kneeSide: [1, 1] }],
      [T0 + .7, { x: 790, y: 0, dir: 1, hipY: -78, lean: .3, turn: .4, expr: E('effort'), feet: [[ped0[0] + 2, ped0[1] - 8], [770, -14]], hands: [grip, [grip[0] - 3, grip[1] + 1]], kneeSide: [1, 1] }, .5],
      [T0 + 1.2, { x: sad[0] + 2, y: 0, dir: 1, hipY: sad[1] - 2, lean: .25, turn: .4, expr: E('worried'), feet: [[ped0[0] + hunt, ped0[1] + 6], [ped1[0], ped1[1] + 4]], hands: [grip, [grip[0] - 3, grip[1] + 1]], kneeSide: [1, 1] }, .45],
      [T0 + 2.6, { x: sad[0] + 2, y: 0, dir: 1, hipY: sad[1] - 2, lean: .3, turn: .4, expr: E('determined'), feet: [ped0, ped1], hands: [grip, [grip[0] - 3, grip[1] + 1]], kneeSide: [1, 1] }, .4],
    ];
    const P = poseSeq(keys, t); if (t > T0 + 1.1 && t < T0 + 2.3) P.feet = [[ped0[0] + hunt, ped0[1] + 6 - Math.abs(hunt) * .3], P.feet[1]];
    drawFigure(ctx, he6, P, cam, { seed: 32 });
  } });
  ev(SB(3) + .7, 'cloth', { v: .5 }); ev(SB(3) + 1.2, 'creak', { v: .5 }); ev(SB(3) + 1.3, 'tick', { n: 5, gap: .19, v: .25 }); ev(SB(3) + 2.6, 'tick', { n: 1, v: .5 });
  // shot 5: medium tracking: the first wobble and fall
  const F1 = HT.fall1;
  shot({ id: 's5', t0: SB(5, 1.5), t1: SB(7, 1), page: 'summer', trans: 'wipe', wipe: .3, draw(ctx, t) {
    const T0 = SB(5, 1.5), lt = t - T0, v = Math.min(1, lt / 1.2) * 140;
    const bx = 780 + v * lt * .6, fallK = seg(t, F1 - .35, F1), down = eo(fallK);
    const wob = Math.sin(lt * 7) * .07 * Math.min(1, lt) + Math.sin(lt * 13) * .03;
    const cam = camAt(bx + 90, 820, 1.45);
    drawLane(ctx, 'summer', cam, t);
    const Bk = { x: bx, y: 0, dir: 1, dist: bx - 780, crank: (bx - 780) / (2.75 * BIKE.R), lean: wob * (1 - down) - .35 * down, squash: 1 - .65 * down };
    // grandpa runs behind holding the saddle until the wobble throws her
    const gpP = pushPose(gp60, Bk, lt * 2.2, { expr: exprAt([[0, 'focus'], [F1 - .3, 'worried']], t, .3) });
    if (down > 0) { gpP.hands[0] = [bx + 10, -100 + 30 * down]; gpP.lean = .5 - .2 * down; }
    drawFigure(ctx, gp60, gpP, cam, { seed: 31 });
    drawBike(ctx, cam, Bk, { seed: 21 });
    const ride = ridePose(he6, { x: bx, y: 0, dir: 1, dist: Bk.dist, crank: Bk.crank, lean: wob }, { expr: exprAt([[0, 'determined'], [F1 - .6, 'worried']], t, .4) });
    ride.headRoll = wob * .8;
    const sit = { x: bx + 40, y: 0, dir: 1, hipY: -12, lean: -.3, turn: .5, expr: E('ouch'), feet: [[bx + 76, -2], [bx + 86, -6]], hands: [[bx + 16, -2], [bx + 54, -4]], kneeSide: [1, 1], elbowSide: [-1, -1], knee: 1 };
    const P = poseMix(ride, sit, down); if (down > 0 && down < 1) P.hipY = lerp(ride.hipY, sit.hipY, down) - 14 * Math.sin(down * Math.PI);
    drawFigure(ctx, he6, P, cam, { seed: 32 });
  } });
  ev(SB(5, 1.5), 'chain', { dur: F1 - SB(5, 1.5), v: .35 }); ev(SB(5, 1.5) + .2, 'steps', { dur: F1 - SB(5, 1.5) - .2, rate: 4.4, v: .4 }); ev(SB(5, 1.5) + .8, 'creak', { v: .45, dur: 1.2 });
  ev(F1, 'thud', { v: .8, hit: 'fall1' }); ev(F1 + .05, 'clatter', { v: .9 }); ev(F1 + .15, 'glock', { v: .6, n: 1 });
  // shot 6: wide, fall two (faster): over she goes, feet in the air
  const F2 = HT.fall2;
  shot({ id: 's6', t0: SB(7, 1), t1: SB(8, 2.5), page: 'summer', trans: 'wipe', wipe: .25, draw(ctx, t) {
    const T0 = SB(7, 1), lt = t - T0, v = 190, bx = 1300 + v * lt, down = eo(seg(t, F2 - .3, F2));
    const wob = Math.sin(lt * 11) * .09;
    const cam = camAt(1560, 800, .9);
    drawLane(ctx, 'summer', cam, t);
    const Bk = { x: bx, y: 0, dir: 1, dist: bx - 1300, crank: (bx - 1300) / (2.75 * BIKE.R), lean: wob * (1 - down) - .5 * down, squash: 1 - .7 * down };
    drawFigure(ctx, gp60, runPose(gp60, bx - 130 - 60 * down, lt * 2.3, 1, { expr: E('worried'), lean: .35, hands: [[bx - 60, -120], [bx - 170, -100]] }), cam, { seed: 31 });
    drawBike(ctx, cam, Bk, { seed: 21 });
    const ride = ridePose(he6, Bk, { expr: E('worried') });
    const flat = { x: bx + 70, y: 0, dir: 1, hipY: -10, lean: -1.2, turn: .4, expr: E('ouch'), feet: [[bx + 60, -60], [bx + 80, -70]], hands: [[bx + 20, -4], [bx + 30, -2]], kneeSide: [-1, -1], elbowSide: [1, 1], knee: 1 };
    const P = poseMix(ride, flat, down); if (down > 0 && down < 1) P.hipY -= 26 * Math.sin(down * Math.PI);
    drawFigure(ctx, he6, P, cam, { seed: 32 });
  } });
  ev(SB(7, 1), 'chain', { dur: F2 - SB(7, 1), v: .3 }); ev(F2, 'thud', { v: .7, hit: 'fall2' }); ev(F2 + .05, 'clatter', { v: .8 }); ev(F2 + .15, 'glock', { v: .6, n: 2 });
  // shot 7: insert: the bicycle alone tips into frame and lands; her sandal follows
  const F3 = HT.fall3;
  shot({ id: 's7', t0: SB(8, 2.5), t1: SB(10), page: 'summer', trans: 'wipe', wipe: .25, draw(ctx, t) {
    const cam = camAt(1960, 860, 2.3), T0 = SB(8, 2.5);
    drawLane(ctx, 'summer', cam, t);
    const down = eo(seg(t, F3 - .45, F3)), bounce = Math.sin(clamp((t - F3) / .25) * Math.PI) * .06;
    const Bk = { x: 1900, y: 0, dir: 1, dist: 40, crank: 1.2, lean: -.05 - .55 * down + bounce, squash: 1 - .72 * down };
    drawBike(ctx, cam, Bk, { seed: 21 });
    // the sandal: drops in from above after the bicycle, bounces once
    const sd = seg(t, F3 + .2, F3 + .55), sy0 = lerp(-260, -4, ei(sd)) - (sd >= 1 ? Math.abs(Math.sin(clamp((t - F3 - .55) / .3) * Math.PI)) * 22 : 0);
    if (sd > 0) { const S = []; withSeed(45, () => { const p = sp(cam, [1980, sy0]); dab(S, p[0], p[1], 11 * cam.z, 4.5 * cam.z, '#7a4a3a', .92, -.3 + sd * .5); dab(S, p[0] - 2 * cam.z, p[1] - 3 * cam.z, 7 * cam.z, 2 * cam.z, '#c8442a', .9, -.3 + sd * .5); }); drawStrokes(ctx, S); }
  } });
  ev(F3, 'clatter', { v: 1, hit: 'fall3' }); ev(F3 + .55, 'sandal', { v: .6 }); ev(F3 + .85, 'sandal', { v: .3 }); ev(F3 + .1, 'glock', { v: .6, n: 3 });
  // shot 8: insert, the scraped knee; the note with the tally
  shot({ id: 's8', t0: SB(10), t1: SB(12, 1.5), page: 'summer', trans: 'wipe', draw(ctx, t) {
    const T0 = SB(10), z = lerp(5.0, 5.6, ss(seg(t, T0, T0 + 4))), laneAlpha = .55;
    // she sits on the ground, knees up; the camera is on her near knee
    const bx = 1900, sit = { x: bx + 40, y: 0, dir: 1, hipY: -12, lean: -.25, turn: .5, expr: Object.assign({}, E('sniff'), { gaze: [.5, .6] }), feet: [[bx + 50, -2], [bx + 58, -5]], hands: [[bx + 16, -2], [bx + 50, -30]], kneeSide: [1, 1], elbowSide: [-1, -1], headTilt: .35 };
    const R0 = solve(he6, sit), cam = { x: (R0.legs[0].knee[0] + R0.head[0]) / 2 + 10, y: (R0.legs[0].knee[1] + R0.head[1]) / 2 + 4, z };
    drawLane(ctx, 'summer', cam, t, { alpha: laneAlpha });
    const R = drawFigure(ctx, he6, sit, cam, { seed: 32 });
    // the scrape blooms: a wash that spreads, then a few darker dots
    const bl = seg(t, T0 + .4, T0 + 1.8), k = sp(cam, R.legs[0].knee), S = [];
    withSeed(46, () => { dab(S, k[0] + 2 * z, k[1] + 1 * z, (2 + 4 * eo(bl)) * z, (1.6 + 3.2 * eo(bl)) * z, '#b8432e', .55 * ss(bl), .2, z > 4 ? 3 : 0); for (let i = 0; i < 6; i++) { const q = seg(bl, .5 + i * .07, .7 + i * .07); if (q > 0) dab(S, k[0] + rnd(-4, 4) * z, k[1] + rnd(-3, 3) * z, .8 * z * q, .6 * z * q, '#8a2f22', .75); } });
    drawStrokes(ctx, S);
  } });
  ev(SB(10) + .4, 'brush', { dur: 1.4, pan: .2, v: .5 }); ev(SB(10) + 1.6, 'pencil', { dur: 1.5 }); ev(SB(10) + 3.2, 'tick', { n: 3, gap: .3, v: .35 });
  note({ page: 'summer', id: 'nfall', txt: '第一次：摔了 3 次', t0: SB(10) + 1.6, t1: SE, x: 110, y: 930, size: 48, tally: 3, tallyX: 440 });
  // shot 9: close two-shot: he crouches to her height, 「我扶着呢」, she nods
  shot({ id: 's9', t0: SB(12, 1.5), t1: SB(15), page: 'summer', trans: 'wipe', draw(ctx, t) {
    const T0 = SB(12, 1.5), cam = camAt(2050, 1330, 7.2);
    drawLane(ctx, 'summer', cam, t);
    const cr = eo(seg(t, T0 + .2, T0 + 1.1));   // the crouch: his head comes down into frame
    const gP = { x: 1985, y: 0, dir: 1, hipY: lerp(-82, -40, cr), lean: lerp(.1, .35, cr), turn: .62, expr: exprAt([[0, 'calm'], [T0 + 1.3, 'gentle'], [T0 + 2.9, 'warm']], t, .6), feet: [[2006, 0], [1960, 0]], hands: [[2046, lerp(-100, -70, cr)], [1996, lerp(-90, -44, cr)]], kneeSide: [1, 1], elbowSide: [1, 1] };
    drawFigure(ctx, gp60, gP, cam, { seed: 31 });
    const nod = t > T0 + 2.9 ? Math.sin(clamp((t - T0 - 2.9) / .7) * Math.PI * 2) * .12 : 0;
    const hP = { x: 2112, y: 0, dir: -1, turn: .62, expr: exprAt([[0, 'sniff'], [T0 + 1.6, 'worried'], [T0 + 3.0, 'determined']], t, .6), feet: [[2104, 0], [2122, 0]], armSwing: [.1, -.05], headRoll: nod, knee: 1 };
    drawFigure(ctx, he6, hP, cam, { seed: 32 });
  } });
  ev(SB(12, 1.5) + .3, 'cloth', { v: .45 }); ev(SB(12, 1.5) + 1.25, 'pencil', { dur: .9 }); ev(SB(12, 1.5) + 3.0, 'breath', { v: .3 });
  SUBS.push({ t0: SB(12, 1.5) + 1.2, t1: SB(15) + .3, text: '我扶着呢' });
  // shot 10: insert: his hand closes on the back of the saddle
  shot({ id: 's10', t0: SB(15), t1: SB(16, 1), page: 'summer', trans: 'wipe', wipe: .4, draw(ctx, t) {
    const T0 = SB(15), cam = camAt(2016, 540 + 99 * 10, 10);
    drawLane(ctx, 'summer', cam, t);
    const Bk = { x: 1990, y: 0, dir: 1, dist: 60, crank: 2.0 };
    drawBike(ctx, cam, Bk, { seed: 21 });
    const sad = bikePt(Bk, BIKE.saddle), z = cam.z, S = [], k = eo(seg(t, T0 + .25, T0 + .85)), grip = ss(seg(t, T0 + .7, T0 + 1.1));
    const hx = lerp(sad[0] - 70, sad[0] - 20, k), hy = lerp(sad[1] - 40, sad[1] - 8, k), h = sp(cam, [hx, hy]);
    withSeed(47, () => { const a0 = sp(cam, [hx - 70, hy - 50]); S.push(mk(qcurve(a0[0], a0[1], h[0] - 10 * z, h[1] - 4 * z, 4 * z, 6), 8 * z, gp60.top, { prof: 'even', nb: 4, a: .9, rib: .78 })); S.push(mk(qcurve(h[0] - 24 * z, h[1] - 12 * z, h[0] - 6 * z, h[1] - 3 * z, 0, 4), 7 * z, gp60.skin, { prof: 'even', nb: 3, a: .9, rib: .8 })); handStrokes(S, h[0], h[1], 11 * z, 1, grip, gp60.skin, { rot: .35 }); });
    drawStrokes(ctx, S);
  } });
  ev(SB(15) + .9, 'grip', { v: .5 });
  // shot 11: the signature dolly: she pedals, he runs behind holding the saddle; a push into the hand that lets go
  const LG = HT.letGo;
  shot({ id: 's11', t0: SB(16, 1), t1: SB(21), page: 'summer', trans: 'wipe', draw(ctx, t) {
    const T0 = SB(16, 1), lt = t - T0, v = lerp(110, 230, ss(seg(t, T0, LG + 1.5)));
    const bx = 1990 + (t < T0 ? 0 : (() => { let s = 0; for (let u = 0; u < lt; u += .05) s += lerp(110, 230, ss(seg(T0 + u, T0, LG + 1.5))) * .05; return s; })());
    const Bk = { x: bx, y: 0, dir: 1, dist: bx - 1990, crank: (bx - 1990) / (2.75 * BIKE.R), lean: Math.sin(lt * 5) * .025 * (1 - ss(seg(t, LG, LG + 2))) };
    const sad = bikePt(Bk, BIKE.saddle);
    // the push: into the hand on the saddle around the letting-go, then back out
    const pin = ss(seg(t, LG - 1.1, LG - .3)) * (1 - ss(seg(t, LG + .7, LG + 1.6)));
    const z = lerp(1.6, 5.5, pin), cam = camAt(lerp(bx + 60, sad[0] - 8, pin), 820, z);
    const camF = { x: cam.x, y: lerp(-(820 - 540) / z, sad[1] - 6, pin), z };
    drawLane(ctx, 'summer', camF, t);
    // grandpa: runs behind holding the saddle; after letGo his hand opens, he slows and stops
    const stop = ss(seg(t, LG + .1, LG + 1.4)), gx = sad[0] - 58 - stop * (bx - 1990 - (() => { let s = 0; for (let u = 0; u < LG + .1 - T0; u += .05) s += lerp(110, 230, ss(seg(T0 + u, T0, LG + 1.5))) * .05; return s; })()) * 0;
    const gph = lt * 2.3;
    let gP = pushPose(gp60, Bk, gph, { expr: exprAt([[0, 'focus'], [LG - .4, 'gentle'], [LG + 1, 'warm']], t, .5) });
    if (t > LG - .05) { const open = ss(seg(t, LG, LG + .35)); gP.hands[0] = [sad[0] - 12 - 10 * open, sad[1] + 3 - 14 * open]; }
    if (stop > 0) { // he falls behind: his x slides back relative to the bicycle while his legs slow
      const back = (bx - 1990) - (bx - 1990) * (1 - stop) ; const gxs = sad[0] - 58 - (v * stop * (t - LG - .1)) * .9;
      const stand = { x: gxs, y: 0, dir: 1, hipY: -(gp60.thigh + gp60.shin - 4), lean: .12, turn: .35, expr: E('warm'), feet: [[gxs + 10, 0], [gxs - 12, 0]], hands: [[gxs + 28, -130], null], kneeSide: [1, 1], elbowSide: [1, 1] };
      const run = pushPose(gp60, Bk, gph, { expr: E('warm') }); run.x = gxs; run.hands[0] = [gxs + 40, -95]; run.feet = cycleFeet(gxs, gph * (1 - stop * .7), 46 * (1 - stop), 14 * (1 - stop), 1);
      gP = poseMix(run, stand, stop); gP.x = gxs;
    }
    drawFigure(ctx, gp60, gP, camF, { seed: 31 });
    drawBike(ctx, camF, Bk, { seed: 21 });
    const rP = ridePose(he6, Bk, { expr: exprAt([[0, 'focus'], [LG + 1.2, 'determined']], t, .5) });
    drawFigure(ctx, he6, rP, camF, { seed: 32 });
    // at the push-in: the hand on the saddle with fingers, drawn big over the figure's own hand
    if (pin > .15) { const S = [], open = ss(seg(t, LG, LG + .35)), hx = sad[0] - 12 - 10 * open, hy = sad[1] + 3 - 14 * open, h = sp(camF, [hx, hy]); withSeed(48, () => { const a0 = sp(camF, [hx - 44, hy - 36]); S.push(mk(qcurve(a0[0], a0[1], h[0] - 8 * z, h[1] - 3 * z, 3 * z, 6), 7.5 * z, gp60.top, { prof: 'even', nb: 4, a: .9, rib: .78 })); S.push(mk(qcurve(h[0] - 20 * z, h[1] - 9 * z, h[0] - 5 * z, h[1] - 2 * z, 0, 4), 6 * z, gp60.skin, { prof: 'even', nb: 3, a: .9, rib: .8 })); handStrokes(S, h[0], h[1], 9 * z, 1, 1 - open, gp60.skin, { rot: .35 }); }); drawStrokes(ctx, S, 1, pin); }
  } });
  ev(SB(16, 1), 'chain', { dur: SB(21) - SB(16, 1), v: .4, accel: 1 }); ev(SB(16, 1), 'steps', { dur: LG + 1.2 - SB(16, 1), rate: 4.6, v: .4, fade: 1 }); ev(LG, 'release', { v: .5, hit: 'letGo' }); ev(LG + .8, 'breath', { v: .35 });
  // shot 12: close-up: her face, concentration turning to joy
  shot({ id: 's12', t0: SB(21), t1: SB(23), page: 'summer', trans: 'wipe', draw(ctx, t) {
    const T0 = SB(21), lt = t - T0, bx = 4000 + 230 * lt;
    const Bk = { x: bx, y: 0, dir: 1, dist: bx - 3000, crank: (bx - 3000) / (2.75 * BIKE.R) };
    const rP = ridePose(he6, Bk, { expr: exprAt([[0, 'focus'], [T0 + 1.2, 'joy']], t, .7), turn: .5, wind: .6 + .1 * Math.sin(lt * 9) });
    const R0 = solve(he6, rP), camF = { x: R0.head[0] + 18, y: R0.head[1] + 6, z: 11 };
    drawLane(ctx, 'summer', camF, t, { alpha: .45 });
    drawBike(ctx, camF, Bk, { seed: 21 });
    drawFigure(ctx, he6, rP, camF, { seed: 32 });
  } });
  ev(SB(21), 'chain', { dur: SB(23) - SB(21), v: .3 }); ev(SB(21) + .2, 'wind', { dur: SB(23) - SB(21), v: .25 });
  // shot 13: over her shoulder: the lane behind her, grandpa far away, waving; 50 m
  shot({ id: 's13', t0: SB(23), t1: SE, page: 'summer', trans: 'wipe', draw(ctx, t) {
    const T0 = SB(23), V = { vx: 1060, vy: 450, f: 2300, h: 1.25 };
    drawDeepLane(ctx, 'summer', V, t, { near: 1.8 });
    // grandpa at the far end of the lane, waving
    const d = 53, cam = deepCam(V, d, -.4, 0), wv = Math.sin((t - T0) * 5) * .5;
    const wave = ss(seg(t, T0 + .5, T0 + 1.0));
    drawFigure(ctx, gp60, { x: 0, y: 0, dir: -1, turn: .8, expr: E('proud'), feet: [[8, 0], [-8, 0]], hands: [[-30 + 25 * wv * wave, -175 * wave - 40 * (1 - wave)], null], elbowSide: [-1, 1], kneeSide: [1, 1] }, cam, { seed: 31 });
    // her: the back of her head and shoulder, big, lower left; she turns a little (the pigtails swing)
    const S = []; withSeed(49, () => backHeadStrokes(S, 430, 760, 215, he6, .3 + .2 * Math.sin((t - T0) * 2)));
    drawStrokes(ctx, S);
    // the measured 50 m along the lane
    const [ax, ay] = deepPt(V, 3.2, .6), [bx2, by2] = deepPt(V, d, -.1);
    const dp = seg(t, T0 + .5, T0 + 1.5);
    ctx.save(); dimL(ctx, ax, ay, bx2, by2, dp); ctx.restore();
    mistDraw(ctx, seg(t, SE - 1.5, SE - .05));
  } });
  ev(SB(23) + .5, 'wave', { v: .2 }); ev(SB(23) + .5, 'pen', { dur: 1.0 }); ev(SE - 1.5, 'mist', { dur: 1.6 });
  note({ page: 'summer', id: 'n50', txt: '50 m', t0: SB(23) + .7, t1: SE, x: 1130, y: 600, font: 'mono', size: 30 });
  note({ page: 'summer', id: 'n50z', txt: '骑了 50 米！', t0: SB(23) + .75, t1: SE, x: 1330, y: 930, size: 52 });

  // ======== page 2: autumn, age ten, to school (48.14 – 64.14) ========
  const K0 = ST.school.t, KE = ST.school.end, KB = (b, k = 0) => TB('school', b, k);
  page('school', K0, KE, 'school');
  ev(K0, 'page', { hit: 'pageSchool' }); ev(K0 + .1, 'brush', { dur: 2.4, pan: -.8, pan1: .8 }); ev(K0 - .4, 'sparrows', { dur: KE - K0 + 1, v: .4 });
  note({ page: 'school', id: 'nschool', txt: '秋 · 十岁 · 上学路', t0: K0 + 1.3, t1: KE, x: 110, y: 120, size: 46 }); ev(K0 + 1.3, 'pencil', { dur: 1.2 });
  shot({ id: 's14', t0: K0, t1: KB(2), page: 'school', trans: 'turn', draw(ctx, t) {
    const cam = camAt(1100 + 200 * ss(seg(t, K0, KB(2))), 800, .62), rv = laneReveal(K0, cam);
    drawLane(ctx, 'school', cam, t, { reveal: rv });
    drawWeather(ctx, 'school', t, cam, ss(seg(t, K0 + 1, K0 + 2)));
    const lt = t - K0, bx = -500 + 330 * Math.max(0, lt - .9);
    const Bk = { x: bx, y: 0, dir: 1, dist: bx + 500, crank: (bx + 500) / (2.75 * BIKE.R), lean: Math.sin(lt * 4) * .012 };
    drawBike(ctx, cam, Bk, { seed: 21 });
    const R = drawFigure(ctx, he10, ridePose(he10, Bk, { expr: E('happy'), wind: .4 }), cam, { seed: 33 });
    const S = []; withSeed(50, () => satchelStrokes(S, cam, R, he10, 1)); drawStrokes(ctx, S);
  } });
  ev(K0 + 1.0, 'chain', { dur: KB(2) - K0 - 1, v: .35 });
  // shot 15: medium tracking: she passes grandpa at the corner and rings the bell; he lifts a hand
  const DK = HT.dingSchool;
  shot({ id: 's15', t0: KB(2), t1: KB(4), page: 'school', trans: 'wipe', draw(ctx, t) {
    const T0 = KB(2), lt = t - T0, bx = 4150 + 300 * lt;
    const cam = camAt(bx + 100, 830, 1.5);
    drawLane(ctx, 'school', cam, t);
    drawWeather(ctx, 'school', t, cam, 1, { drift: bx * .2 });
    const Bk = { x: bx, y: 0, dir: 1, dist: bx, crank: bx / (2.75 * BIKE.R) };
    // grandpa by the lamp post, a cloth bag in hand; his hand lifts as she rings
    const lift = ss(seg(t, DK + .3, DK + .9)) * (1 - ss(seg(t, DK + 2.2, DK + 2.8)));
    drawFigure(ctx, gp64, { x: 4760, y: 0, dir: -1, turn: .5, expr: exprAt([[0, 'calm'], [DK + .2, 'proud']], t, .5), feet: [[4752, 0], [4770, 0]], hands: [[4730 - 10 * lift, -95 - 80 * lift], null], elbowSide: [-1, 1], kneeSide: [1, 1] }, cam, { seed: 34 });
    drawBike(ctx, cam, Bk, { seed: 21 });
    const ring = seg(t, DK - .25, DK) - seg(t, DK + .1, DK + .5);
    const rP = ridePose(he10, Bk, { expr: exprAt([[0, 'happy'], [DK - .3, 'joy']], t, .4), wind: .4 });
    if (ring > 0) rP.hands[0] = [rP.hands[0][0] + 4 * ring, rP.hands[0][1] - 5 * ring];
    const R = drawFigure(ctx, he10, rP, cam, { seed: 33 });
    const S = []; withSeed(50, () => satchelStrokes(S, cam, R, he10, 1)); drawStrokes(ctx, S);
  } });
  ev(KB(2), 'chain', { dur: KB(4) - KB(2), v: .4 }); ev(DK, 'bell', { v: .9, hit: 'dingSchool' }); ev(DK + .2, 'bell', { v: .7 }); ev(DK + .35, 'cloth', { v: .3 });
  // shot 16: close-up: his face, proud, following her out of frame
  shot({ id: 's16', t0: KB(4), t1: KB(5, 2), page: 'school', trans: 'wipe', draw(ctx, t) {
    const T0 = KB(4), gP = { x: 4760, y: 0, dir: -1, turn: .78, expr: exprAt([[0, 'proud'], [T0 + 1.6, 'warm']], t, .8), feet: [[4752, 0], [4770, 0]], hands: [[4740, -100], null], elbowSide: [-1, 1], kneeSide: [1, 1] };
    const R0 = solve(gp64, gP), z = 9, cam = { x: R0.head[0] - 8, y: R0.head[1] + 5, z };
    drawLane(ctx, 'school', cam, t, { alpha: .45 });
    gP.expr = Object.assign({}, gP.expr, { gaze: [lerp(-.3, .5, ss(seg(t, T0 + .4, T0 + 2.2))), -.05] });
    drawFigure(ctx, gp64, gP, cam, { seed: 34 });
    drawWeather(ctx, 'school', t, cam, .3);
  } });
  ev(KB(4) + .9, 'pen', { dur: .8 }); ev(KB(4) + 1.2, 'pencil', { dur: .8 });
  note({ page: 'school', id: 'n12', txt: '1.2 km', t0: KB(4) + .9, t1: KE, x: 1300, y: 190, font: 'mono', size: 32 });
  note({ page: 'school', id: 'n12z', txt: '到学校', t0: KB(4) + 1.2, t1: KE, x: 1500, y: 190, size: 46 });
  // shot 17: deep view: she rides away down the lane, turns the corner; mist
  shot({ id: 's17', t0: KB(5, 2), t1: KE, page: 'school', trans: 'wipe', draw(ctx, t) {
    const T0 = KB(5, 2), V = { vx: 980, vy: 470, f: 1700, h: 1.5 };
    drawDeepLane(ctx, 'school', V, t, { near: 2 });
    const lt = t - T0, d = 9 + 9.5 * lt, turnK = ss(seg(d, 44, 50));
    if (d < 52) { const xm = -.2 + turnK * 2.6, cam = deepCam(V, d, xm, 0); const Bk = { x: 0, y: 0, dir: 1, dist: d * 100, crank: d * 100 / (2.75 * BIKE.R) }; ctx.save(); ctx.globalAlpha = 1 - turnK * .9; drawBike(ctx, cam, Bk, { seed: 21, spokes: 6 }); const R = drawFigure(ctx, he10, ridePose(he10, Bk, { expr: E('happy'), turn: .05 }), cam, { seed: 33 }); const S = []; withSeed(50, () => satchelStrokes(S, cam, R, he10, 1)); drawStrokes(ctx, S); ctx.restore(); }
    drawWeather(ctx, 'school', t, { x: 0, y: 0, z: .8 }, .8);
    mistDraw(ctx, seg(t, KE - 1.6, KE - .05));
  } });
  ev(KB(5, 2), 'chain', { dur: 2.4, v: .25, fade: 1 }); ev(KE - 1.6, 'mist', { dur: 1.7 });

  // ======== page 3: autumn, age eighteen, leaving for the city (64.14 – 79.14) ========
  const L0 = ST.leaving.t, LE = ST.leaving.end, LB = (b, k = 0) => TB('leaving', b, k);
  page('leaving', L0, LE, 'leaving');
  ev(L0, 'page', { hit: 'pageLeaving' }); ev(L0 + .1, 'brush', { dur: 2.4, pan: -.8, pan1: .8 }); ev(L0 - .3, 'autumnwind', { dur: LE - L0 + 1, v: .5 }); ev(L0 + 6, 'train', { v: .25 });
  note({ page: 'leaving', id: 'nleave', txt: '秋 · 十八岁 · 去城里上大学', t0: L0 + 1.4, t1: LE, x: 110, y: 120, size: 46 }); ev(L0 + 1.4, 'pencil', { dur: 1.6 });
  // shot 18: wide, grey autumn, leaves; she straps a bag to the rack by the gate; grandpa at the gate
  shot({ id: 's18', t0: L0, t1: LB(1, 2.4), page: 'leaving', trans: 'turn', draw(ctx, t) {
    const z = lerp(.72, .82, ss(seg(t, L0, LB(1, 2.4)))), cam = camAt(560, 800, z), rv = laneReveal(L0, cam);
    drawLane(ctx, 'leaving', cam, t, { reveal: rv });
    drawWeather(ctx, 'leaving', t, cam, ss(seg(t, L0 + 1, L0 + 2)));
    const fp = clamp((t - L0 - 1.4) / .9), Bk = { x: 520, y: 0, dir: 1, dist: 10, crank: .3 };
    drawFigure(ctx, gp64, { x: 330, y: 0, dir: 1, turn: .4, expr: E('calm'), feet: [[338, 0], [322, 0]], armSwing: [.1, -.1], kneeSide: [1, 1] }, cam, { seed: 34, p: fp });
    drawBike(ctx, cam, Bk, { seed: 21, p: fp });
    const S = []; withSeed(51, () => rackBagStrokes(S, cam, Bk, '#6f6a5c', 0)); drawStrokes(ctx, S, fp);
    const pull = Math.sin((t - L0) * 3) * 4;
    const R = drawFigure(ctx, he18, { x: 470, y: 0, dir: 1, turn: .35, expr: E('focus'), lean: .3, feet: [[486, 0], [452, 0]], hands: [[510 + pull, -92], [500, -84]], kneeSide: [1, 1], elbowSide: [1, 1] }, cam, { seed: 35, p: fp });
    const S2 = []; withSeed(52, () => backpackStrokes(S2, cam, R, he18, 1)); drawStrokes(ctx, S2, fp);
  } });
  // shot 19: insert: the bag on the rack, a strap pulled tight; his hand pats it
  shot({ id: 's19', t0: LB(1, 2.4), t1: LB(2, 2.4), page: 'leaving', trans: 'wipe', draw(ctx, t) {
    const T0 = LB(1, 2.4), cam = camAt(508, 540 + 90 * 5.5, 5.5);
    drawLane(ctx, 'leaving', cam, t);
    const Bk = { x: 520, y: 0, dir: 1, dist: 10, crank: .3 };
    drawBike(ctx, cam, Bk, { seed: 21 });
    const pullK = eo(seg(t, T0 + .3, T0 + .9)), S = [];
    withSeed(51, () => rackBagStrokes(S, cam, Bk, '#6f6a5c', pullK)); drawStrokes(ctx, S);
    // her hands pulling the strap (from the right), then his hand coming from the left to pat
    const z = cam.z, H = [];
    const hx = 546 - 18 * pullK, hy = -108 - 6 * pullK, h = sp(cam, [hx, hy]);
    withSeed(53, () => { const a0 = sp(cam, [hx + 60, hy - 60]); H.push(mk(qcurve(a0[0], a0[1], h[0] + 4 * z, h[1], -4 * z, 6), 6 * z, he18.top, { prof: 'even', nb: 3, a: .9, rib: .78 })); handStrokes(H, h[0], h[1], 9 * z, -1, 1, he18.skin, { rot: -.3 }); });
    const pat = seg(t, T0 + 1.4, T0 + 1.75), p2 = Math.abs(Math.sin(clamp((t - T0 - 1.75) / .9) * Math.PI * 2)) * 8;
    if (pat > 0) { const gx = lerp(430, 496, eo(pat)), gy = lerp(-150, -112, eo(pat)) - p2, g = sp(cam, [gx, gy]); withSeed(54, () => { const a0 = sp(cam, [gx - 60, gy - 50]); H.push(mk(qcurve(a0[0], a0[1], g[0] - 4 * z, g[1] - 1 * z, 4 * z, 6), 6.5 * z, gp64.top, { prof: 'even', nb: 3, a: .9, rib: .78 })); handStrokes(H, g[0], g[1], 6.5 * z, 1, .15, gp64.skin, { rot: .9 }); }); }
    drawStrokes(ctx, H);
  } });
  ev(LB(1, 2.4) + .3, 'strap', { v: .6 }); ev(LB(1, 2.4) + 1.85, 'pat', { v: .5 }); ev(LB(1, 2.4) + 2.1, 'pat', { v: .4 });
  // shot 20: medium two-shot: he at the gate, she on the saddle looking back; he waves
  shot({ id: 's20', t0: LB(2, 2.4), t1: LB(4), page: 'leaving', trans: 'wipe', draw(ctx, t) {
    const T0 = LB(2, 2.4), cam = camAt(470, 840, 2.3);
    drawLane(ctx, 'leaving', cam, t);
    drawWeather(ctx, 'leaving', t, cam, .8);
    const wave = ss(seg(t, T0 + 1.4, T0 + 1.9)), wv = Math.sin((t - T0) * 6) * .4 * wave;
    drawFigure(ctx, gp64, { x: 340, y: 0, dir: 1, turn: .55, expr: exprAt([[0, 'calm'], [T0 + 1.3, 'proud'], [T0 + 3.0, 'gentle']], t, .6), feet: [[352, 0], [328, 0]], hands: [[372 + 10 * wv, -100 - 85 * wave], null], kneeSide: [1, 1], elbowSide: [1, 1] }, cam, { seed: 34 });
    const Bk = { x: 560, y: 0, dir: 1, dist: 10, crank: 1.5 };
    drawBike(ctx, cam, Bk, { seed: 21 });
    const S = []; withSeed(51, () => rackBagStrokes(S, cam, Bk, '#6f6a5c', 1)); drawStrokes(ctx, S);
    const look = ss(seg(t, T0 + .4, T0 + 1.0));
    const rP = ridePose(he18, Bk, { expr: exprAt([[0, 'happy'], [T0 + 1.2, 'bitter'], [T0 + 3.0, 'warm']], t, .7), turn: lerp(.35, .7, look), headDir: look > .5 ? -1 : 1 });
    rP.feet = [[Bk.x + 60, 0], pedalPt(Bk, 1)];
    const R = drawFigure(ctx, he18, rP, cam, { seed: 35 });
  } });
  ev(LB(2, 2.4) + .5, 'cloth', { v: .3 }); ev(LB(2, 2.4) + 1.5, 'wave', { v: .25 }); ev(LB(2, 2.4) + 2.1, 'pencil', { dur: 1.3 });
  note({ page: 'leaving', id: 'nslow', txt: '外公说：路上慢点', t0: LB(2, 2.4) + 2.1, t1: LE, x: 1810, y: 120, size: 46, align: 'right' });
  // shot 21: high wide down the lane: she rides away, leaves blowing, he small at the gate
  shot({ id: 's21', t0: LB(4), t1: LE, page: 'leaving', trans: 'wipe', draw(ctx, t) {
    const T0 = LB(4), V = { vx: 1000, vy: 400, f: 1500, h: 3.6 };
    drawDeepLane(ctx, 'leaving', V, t, { near: 2.5 });
    const lt = t - T0, d = 6 + 7.5 * lt;
    { const cam = deepCam(V, 9, -1.5, 0); drawFigure(ctx, gp64, { x: 0, y: 0, dir: 1, turn: .4, expr: E('calm'), feet: [[6, 0], [-6, 0]], hands: [[20, -120 + 20 * Math.sin(lt * 3)], null], kneeSide: [1, 1] }, cam, { seed: 34 }); }
    if (d < 58) { const cam = deepCam(V, d, .1, 0); const Bk = { x: 0, y: 0, dir: 1, dist: d * 100, crank: d * 100 / (2.75 * BIKE.R) }; drawBike(ctx, cam, Bk, { seed: 21, spokes: 6 }); const S = []; withSeed(51, () => rackBagStrokes(S, cam, Bk, '#6f6a5c', 1)); drawStrokes(ctx, S); const R = drawFigure(ctx, he18, ridePose(he18, Bk, { expr: E('calm'), turn: .05 }), cam, { seed: 35 }); const S2 = []; withSeed(52, () => backpackStrokes(S2, cam, R, he18, 1)); drawStrokes(ctx, S2); }
    drawWeather(ctx, 'leaving', t, { x: 0, y: 0, z: .9 }, 1);
    const [ax, ay] = deepPt(V, 5, -.9), [bx2, by2] = deepPt(V, 48, -.4);
    ctx.save(); ctx.globalAlpha = 1 - ss(seg(t, LE - 1.2, LE - .6)); dimL(ctx, ax, ay, bx2, by2, seg(t, T0 + .6, T0 + 1.8)); ctx.restore();
    mistDraw(ctx, seg(t, LE - 1.6, LE - .05));
  } });
  ev(LB(4), 'chain', { dur: 3, v: .25, fade: 1 }); ev(LB(4) + .6, 'pen', { dur: 1.2 }); ev(LB(4) + 1.2, 'pencil', { dur: .9 }); ev(LE - 1.6, 'mist', { dur: 1.7 });
  note({ page: 'leaving', id: 'n380', txt: '380 km', t0: LB(4) + 1.0, t1: LE - .6, x: 1300, y: 940, font: 'mono', size: 32 });
  note({ page: 'leaving', id: 'n380z', txt: '去城里', t0: LB(4) + 1.3, t1: LE - .6, x: 1480, y: 940, size: 46 });

  // ======== page 4: winter, the bicycle in the snow (79.14 – 97.14) ========
  const W0 = ST.winter.t, WE = ST.winter.end, WB = (b, k = 0) => TB('winter', b, k);
  page('winter', W0, WE, 'winter');
  ev(W0, 'page', { hit: 'pageWinter' }); ev(W0 + .1, 'brush', { dur: 3.0, pan: -.8, pan1: .8, v: .6 }); ev(W0 - .2, 'winterwind', { dur: WE - W0 + 1.5, v: .55 });
  note({ page: 'winter', id: 'nwinter', txt: '冬 · 单车在雪里', t0: W0 + 1.5, t1: WE, x: 110, y: 120, size: 46 }); ev(W0 + 1.5, 'pencil', { dur: 1.2 });
  const stickX = 800;
  function winterBike(ctx, cam, p = 1) {
    const Bk = { x: 620, y: 0, dir: 1, dist: 0, crank: .9, lean: .02 };
    drawBike(ctx, cam, Bk, { seed: 21, p });
    const S = []; withSeed(55, () => { const z = cam.z; for (const [px, py, w] of [[BIKE.saddle[0] + 2, BIKE.saddle[1] - 4, 12], [BIKE.rack[0][0] + 24, BIKE.rack[0][1] - 3, 22], [BIKE.headTop[0] - 10, -92, 8], [56, -29, 60]]) { const q = sp(cam, bikePt(Bk, [px, py])); dab(S, q[0], q[1], w * z, 2.6 * z, SEASON.winter.snow, .95); } });
    drawStrokes(ctx, S, p);
    return Bk;
  }
  function winterStick(ctx, cam, p = 1, lean = .1) { const S = []; withSeed(56, () => stickStrokes(S, sx(cam, stickX), sy(cam, 0), 86 * cam.z, cam.z, 1, lean)); drawStrokes(ctx, S, p); }
  // shot 22: wide, the lane at dusk; snow; the bicycle leans under the wall; the one warm window
  shot({ id: 's22', t0: W0, t1: WB(1, 1), page: 'winter', trans: 'turn', draw(ctx, t) {
    const z = lerp(.8, .9, ss(seg(t, W0, WB(1, 1)))), cam = camAt(760, 800, z), rv = laneReveal(W0, cam);
    drawLane(ctx, 'winter', cam, t, { reveal: rv });
    const fp = clamp((t - W0 - 1.5) / 1.1);
    winterBike(ctx, cam, fp);
    winterStick(ctx, cam, clamp((t - W0 - 2.4) / .8));
    drawDusk(ctx, { x: cam.x * .9, y: cam.y, z: cam.z }, ss(seg(t, W0 + .4, W0 + 2.2)), LANE.window + 55, -150);
    drawWeather(ctx, 'winter', t, cam, ss(seg(t, W0 + .8, W0 + 2.4)));
  } });
  // shot 23: insert: the walking stick by the front wheel; 12 cm of snow
  shot({ id: 's23', t0: WB(1, 1), t1: WB(2, 1), page: 'winter', trans: 'wipe', draw(ctx, t) {
    const T0 = WB(1, 1), cam = camAt(720, 900, 3.2);
    drawLane(ctx, 'winter', cam, t);
    winterBike(ctx, cam, 1);
    winterStick(ctx, cam, seg(t, T0 + .3, T0 + 1.5), .1);
    drawDusk(ctx, { x: cam.x * .9, y: cam.y, z: cam.z }, 1, LANE.window + 55, -150);
    drawWeather(ctx, 'winter', t, cam, .7);
    const z = cam.z, x0 = sx(cam, 850), y0 = sy(cam, 0), y1 = sy(cam, -12);
    ctx.save(); dimL(ctx, x0, y0 + 8 * z, x0, y1, seg(t, T0 + 2.1, T0 + 2.7)); ctx.restore();
  } });
  ev(WB(1, 1) + .3, 'brush', { dur: 1.2, pan: 0, v: .45 }); ev(WB(1, 1) + 1.6, 'pencil', { dur: 1.1 }); ev(WB(1, 1) + 2.1, 'pen', { dur: .6 }); ev(WB(1, 1) + 2.8, 'pencil', { dur: .7 });
  note({ page: 'winter', id: 'nstick', txt: '外公的拐杖', t0: WB(1, 1) + 1.6, t1: WE, x: 1180, y: 250, size: 46, anchor: [sx(camAt(720, 900, 3.2), stickX + 6), sy(camAt(720, 900, 3.2), -40)], lead: -10, leadY: 26, bend: -20, leadUntil: WB(2, 1) + .3 });
  note({ page: 'winter', id: 'n12cm', txt: '12 cm', t0: WB(1, 1) + 2.7, t1: WE, x: sx(camAt(720, 900, 3.2), 850) + 24, y: sy(camAt(720, 900, 3.2), -8), font: 'mono', size: 30 });
  note({ page: 'winter', id: 'n12z', txt: '雪', t0: WB(1, 1) + 2.8, t1: WE, x: sx(camAt(720, 900, 3.2), 850) + 150, y: sy(camAt(720, 900, 3.2), -8), size: 44 });
  // shot 24: medium, through the window: grandpa inside by the lamp, looking out at the bicycle
  function windowScene(ctx, cam, t, T0, zoomHead) {
    drawLane(ctx, 'winter', cam, t);
    drawDusk(ctx, { x: cam.x * .9, y: cam.y, z: cam.z }, 1, LANE.window + 55, -150);
    // the room behind the glass: a dark warm wash clipped to the window, the lamp glow, then him, then the bars
    const camW = { x: cam.x * .9, y: cam.y, z: cam.z };   // the wall layer's parallax
    const wx0 = sx(camW, LANE.window), wy0 = sy(camW, -220), ww = 110 * cam.z, wh = 160 * cam.z;
    ctx.save(); ctx.beginPath(); ctx.rect(wx0, wy0, ww, wh); ctx.clip();
    ctx.fillStyle = rgba('#3a2a22', .82); ctx.fillRect(wx0, wy0, ww, wh);
    const g = ctx.createRadialGradient(wx0 + ww * .22, wy0 + wh * .35, 0, wx0 + ww * .22, wy0 + wh * .35, ww * .9); g.addColorStop(0, rgba('#e8b764', .75)); g.addColorStop(1, rgba('#e8b764', 0)); ctx.fillStyle = g; ctx.fillRect(wx0, wy0, ww, wh);
    const S = []; withSeed(57, () => { const lp = [wx0 + ww * .2, wy0 + wh * .42]; dab(S, lp[0], lp[1], 9 * cam.z, 7 * cam.z, '#f0c878', .95); S.push(mk(qcurve(lp[0], lp[1] + 6 * cam.z, lp[0], lp[1] + 40 * cam.z, 0, 4), 2.4 * cam.z, '#2a1e18', { prof: 'even', nb: 0, a: .9 })); }); drawStrokes(ctx, S);
    const gP = { x: LANE.window + 66, y: -10, dir: -1, turn: .9, expr: exprAt([[0, 'tired'], [T0 + 1.8, 'gentle']], t, .9), hipY: -(gp72.thigh + gp72.shin - 4), lean: .12, feet: [[LANE.window + 60, -10], [LANE.window + 72, -10]], hands: [[LANE.window + 34, -66], [LANE.window + 98, -64]], kneeSide: [1, 1], elbowSide: [-1, 1] };
    drawFigure(ctx, gp72, gP, camW, { seed: 36 });
    ctx.fillStyle = rgba('#aebbc8', .12); ctx.fillRect(wx0, wy0, ww, wh);
    ctx.restore();
    const F = []; withSeed(58, () => { const z = cam.z; F.push(mk(qcurve(wx0 - 4 * z, wy0 + wh / 2, wx0 - 4 * z, wy0 + wh / 2, 0, 2), 1, '#000', { nb: 0, a: 0 })); for (const [ax, ay, bx, by, w] of [[wx0 - 5 * z, wy0 - 4 * z, wx0 + ww + 5 * z, wy0 - 4 * z, 9], [wx0 - 5 * z, wy0 + wh + 3 * z, wx0 + ww + 5 * z, wy0 + wh + 3 * z, 8], [wx0 - 4 * z, wy0, wx0 - 4 * z, wy0 + wh, 7], [wx0 + ww + 4 * z, wy0, wx0 + ww + 4 * z, wy0 + wh, 7], [wx0 + ww / 2, wy0, wx0 + ww / 2, wy0 + wh, 4], [wx0, wy0 + wh * .45, wx0 + ww, wy0 + wh * .45, 4]]) F.push(mk(qcurve(ax, ay, bx, by, 0, 6), w * z, '#4a3a2e', { prof: 'flat', nb: w > 5 ? 3 : 0, a: .92, rib: .9 })); F.push(mk(qcurve(wx0 - 8 * z, wy0 - 10 * z, wx0 + ww + 8 * z, wy0 - 10 * z, 0, 6), 9 * z, SEASON.winter.snow, { prof: 'flat', nb: 0, a: .95, rough: .3 })); });
    drawStrokes(ctx, F);
    drawWeather(ctx, 'winter', t, cam, .6);
  }
  shot({ id: 's24', t0: WB(2, 1), t1: WB(3, 1.5), page: 'winter', trans: 'wipe', draw(ctx, t) {
    const T0 = WB(2, 1), z = lerp(3.0, 3.5, ss(seg(t, T0, T0 + 4.5))), cam = camAt((LANE.window + 56) / .9, 540 + 140 * z, z);
    windowScene(ctx, cam, t, T0);
  } });
  ev(WB(2, 1) + .4, 'clock', { dur: WB(3, 1.5) - WB(2, 1) - .4, v: .25 }); ev(WB(2, 1) + 1.9, 'creak', { v: .2 });
  // shot 25: close-up: his face at the window; one piano note; his eyes lower; mist
  shot({ id: 's25', t0: WB(3, 1.5), t1: WE, page: 'winter', trans: 'wipe', draw(ctx, t) {
    const T0 = WB(3, 1.5), z = 9.5;
    const ex = exprAt([[0, 'gentle'], [HT.pianoOne + .3, 'tired'], [HT.pianoOne + 1.5, 'closed'], [HT.pianoTwo + .6, 'gentle']], t, .8);
    const gP = { x: LANE.window + 66, y: -10, dir: -1, turn: .9, expr: ex, hipY: -(gp72.thigh + gp72.shin - 4), lean: .12, feet: [[LANE.window + 60, -10], [LANE.window + 72, -10]], hands: [[LANE.window + 34, -66], [LANE.window + 98, -64]], kneeSide: [1, 1], elbowSide: [-1, 1] };
    const G = solve(gp72, gP), cam = { x: G.head[0] - 3, y: G.head[1] + 7, z };
    // the room, the lamp glow and his face fill the frame; the window bars pass at the edge
    ctx.fillStyle = rgba('#3a2a22', .85); ctx.fillRect(0, 0, 1920, 1080);
    const g = ctx.createRadialGradient(300, 300, 0, 300, 300, 1500); g.addColorStop(0, rgba('#e8b764', .7)); g.addColorStop(1, rgba('#e8b764', 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, 1920, 1080);
    drawFigure(ctx, gp72, gP, cam, { seed: 36 });
    ctx.fillStyle = rgba('#aebbc8', .1); ctx.fillRect(0, 0, 1920, 1080);
    const F = []; withSeed(59, () => { F.push(mk(qcurve(1560, -20, 1560, 1100, 0, 6), 7 * z, '#4a3a2e', { prof: 'flat', nb: 4, a: .92, rib: .9 })); F.push(mk(qcurve(-20, 150, 1940, 150, 0, 6), 4 * z, '#4a3a2e', { prof: 'flat', nb: 3, a: .9, rib: .9 })); }); drawStrokes(ctx, F);
    drawWeather(ctx, 'winter', t, { x: 0, y: 0, z: 2 }, .5);
    mistDraw(ctx, seg(t, WE - 2.2, WE - .05));
  } });
  ev(WE - 2.2, 'mist', { dur: 2.3, v: .6 });

  // ======== page 5: spring, she comes home (97.14 – 115.71), the climax (115.71 – 124.29) ========
  const P0 = ST.spring.t, PE = ST.holding.end, PB = (b, k = 0) => TB('spring', b, k), HB = (b, k = 0) => TB('holding', b, k);
  page('spring', P0, PE, 'spring');
  ev(P0, 'page', { hit: 'pageSpring' }); ev(P0 + .1, 'brush', { dur: 3.2, pan: -.8, pan1: .8 }); ev(P0 + .3, 'birds', { dur: PE - P0, v: .45 }); ev(P0 - .3, 'springbreeze', { dur: PE - P0 + 1, v: .3 });
  note({ page: 'spring', id: 'nspring', txt: '春 · 我回来了', t0: P0 + 1.3, t1: ST.spring.end + 1.5, x: 110, y: 120, size: 46 }); ev(P0 + 1.3, 'pencil', { dur: 1.1 });
  const stickAt = (ctx, cam, x, p = 1, lean = .12) => { const S = []; withSeed(56, () => stickStrokes(S, sx(cam, x), sy(cam, 0), 86 * cam.z, cam.z, 1, lean)); drawStrokes(ctx, S, p); };
  // shot 26: wide, blossom; she wheels the bicycle out of the gate; he at the door with his stick
  shot({ id: 's26', t0: P0, t1: PB(1, 2), page: 'spring', trans: 'turn', draw(ctx, t) {
    const cam = camAt(640 + 80 * ss(seg(t, P0, PB(1, 2))), 800, .72), rv = laneReveal(P0, cam);
    drawLane(ctx, 'spring', cam, t, { reveal: rv });
    drawWeather(ctx, 'spring', t, cam, ss(seg(t, P0 + 1.5, P0 + 2.5)));
    const fp = clamp((t - P0 - 1.6) / .9), lt = Math.max(0, t - P0 - 1.9), bx = 330 + 70 * lt;
    const Bk = { x: bx, y: 0, dir: 1, dist: bx - 330, crank: (bx - 330) / (2.75 * BIKE.R) };
    drawFigure(ctx, gp79, { x: 300, y: 0, dir: 1, turn: .45, expr: E('gentle'), feet: [[310, 0], [292, 0]], hands: [[326, -92], null], kneeSide: [1, 1], elbowSide: [1, 1] }, cam, { seed: 37, p: fp });
    stickAt(ctx, cam, 332, fp, .06);
    drawBike(ctx, cam, Bk, { seed: 21, p: fp });
    drawFigure(ctx, he25, wheelPose(he25, Bk, lt * 1.0, { expr: E('warm') }), cam, { seed: 38, p: fp });
  } });
  ev(P0 + 1.9, 'chain', { dur: PB(1, 2) - P0 - 1.9, v: .2 }); ev(P0 + 2.0, 'steps', { dur: PB(1, 2) - P0 - 2, rate: 2.2, v: .25 });
  // shot 27: medium two-shot: she pats the back seat; he hesitates; she lifts him on; his hand on her shoulder
  const LF = HT.lift;
  shot({ id: 's27', t0: PB(1, 2), t1: PB(3, 1.5), page: 'spring', trans: 'wipe', draw(ctx, t) {
    const T0 = PB(1, 2), cam = camAt(640, 880, 2.5);
    drawLane(ctx, 'spring', cam, t);
    drawWeather(ctx, 'spring', t, cam, .6);
    const Bk = { x: 640, y: 0, dir: 1, dist: 10, crank: 2.6 };
    const rk = bikePt(Bk, [-8, -84]);
    // the stick: in his hand, then leaned on the wall when she takes his arm
    const stickLean = ss(seg(t, T0 + 2.0, T0 + 2.6));
    stickAt(ctx, cam, lerp(560, 522, stickLean), 1, lerp(.04, .14, stickLean));
    // she: pats the seat twice, then steadies the bike and lifts; her hands under his arm
    const pat = (t > T0 + .5 && t < T0 + 1.5) ? Math.abs(Math.sin((t - T0 - .5) * Math.PI * 2)) * 10 : 0;
    const heKeys = [
      [T0, { x: 575, y: 0, dir: 1, turn: .45, expr: E('warm'), lean: .25, feet: [[590, 0], [560, 0]], hands: [[rk[0] + 6, rk[1] - 6 - pat], [rk[0] - 20, rk[1] - 2]], kneeSide: [1, 1], elbowSide: [1, 1] }],
      [T0 + 2.4, { x: 548, y: 0, dir: 1, turn: .5, expr: E('calm'), lean: .3, feet: [[566, 0], [532, 0]], hands: [[524, -118], [536, -96]], kneeSide: [1, 1], elbowSide: [1, 1] }, .7],
      [LF - .35, { x: 556, y: 0, dir: 1, turn: .5, expr: E('effort'), lean: .42, hipY: -(he25.thigh + he25.shin - 14), feet: [[578, 0], [536, 0]], hands: [[540, -100], [548, -82]], kneeSide: [1, 1], elbowSide: [1, 1] }, .35],
      [LF + .35, { x: 572, y: 0, dir: 1, turn: .5, expr: E('effort'), lean: .3, hipY: -(he25.thigh + he25.shin - 6), feet: [[586, 0], [552, 0]], hands: [[rk[0] + 16, rk[1] - 26], [rk[0] + 2, rk[1] - 8]], kneeSide: [1, 1], elbowSide: [1, 1] }, .7],
      [LF + 1.4, { x: 585, y: 0, dir: 1, turn: .5, expr: E('warm'), lean: .2, feet: [[598, 0], [570, 0]], hands: [[rk[0] + 30, rk[1] - 18], [rk[0] + 10, rk[1] + 2]], kneeSide: [1, 1], elbowSide: [1, 1] }, .6],
    ];
    const heP = poseSeq(heKeys, t); if (t < T0 + 1.6) heP.hands[0] = [rk[0] + 6, rk[1] - 6 - pat];
    // he: standing with his stick, hesitates (a half step back), then is lifted onto the rack, side-saddle
    const gpKeys = [
      [T0, { x: 520, y: 0, dir: 1, turn: .6, expr: E('calm'), hipY: -(gp79.thigh + gp79.shin - 3), lean: .05, feet: [[528, 0], [512, 0]], hands: [[552, -92], [500, -90]], kneeSide: [1, 1], elbowSide: [1, 1] }],
      [T0 + 1.9, { x: 512, y: 0, dir: 1, turn: .65, expr: E('hesitant'), hipY: -(gp79.thigh + gp79.shin - 3), lean: -.02, feet: [[516, 0], [502, 0]], hands: [[548, -92], [496, -88]], kneeSide: [1, 1], elbowSide: [1, 1] }, .6],
      [LF - .35, { x: 536, y: 0, dir: 1, turn: .7, expr: E('calm'), hipY: -(gp79.thigh + gp79.shin - 8), lean: .18, feet: [[548, 0], [524, 0]], hands: [[572, -110], [540, -96]], kneeSide: [1, 1], elbowSide: [-1, 1] }, .5],
      [LF + .35, { x: rk[0], y: 0, dir: -1, turn: .85, expr: E('surprise'), hipY: rk[1] + 2, lean: .06, feet: [[rk[0] + 16, -24], [rk[0] + 26, -32]], hands: [[rk[0] - 40, rk[1] - 40], [rk[0] - 8, rk[1] + 18]], kneeSide: [-1, -1], elbowSide: [-1, 1] }, .6],
      [LF + 1.3, { x: rk[0], y: 0, dir: -1, turn: .85, expr: E('moved'), hipY: rk[1], lean: .06, feet: [[rk[0] + 16, -24], [rk[0] + 26, -32]], hands: [[574, -126], [rk[0] - 8, rk[1] + 18]], kneeSide: [-1, -1], elbowSide: [-1, 1] }, .7],
    ];
    const gpP = poseSeq(gpKeys, t); if (t > LF - .35 && t < LF + .35) gpP.hipY -= 10 * Math.sin(clamp((t - LF + .35) / .7) * Math.PI);
    if (gpP.dir < 0) { drawBike(ctx, cam, Bk, { seed: 21 }); drawFigure(ctx, gp79, gpP, cam, { seed: 37 }); drawFigure(ctx, he25, heP, cam, { seed: 38 }); }
    else { drawFigure(ctx, he25, heP, cam, { seed: 38 }); drawBike(ctx, cam, Bk, { seed: 21 }); drawFigure(ctx, gp79, gpP, cam, { seed: 37 }); }
  } });
  ev(PB(1, 2) + .5, 'pat', { v: .45 }); ev(PB(1, 2) + 1.0, 'pat', { v: .45 }); ev(PB(1, 2) + 2.3, 'stickwall', { v: .5 }); ev(LF - .3, 'breath', { v: .45 }); ev(LF - .1, 'cloth', { v: .6 }); ev(LF, 'lift', { v: .4, hit: 'lift' }); ev(LF + .3, 'creak', { v: .4 }); ev(LF + .6, 'cloth', { v: .3 });
  // shot 28: insert: her thumb flicks the bell
  const DS = HT.dingSpring;
  shot({ id: 's28', t0: PB(3, 1.5), t1: HT.dollyTwo, page: 'spring', trans: 'wipe', wipe: .4, draw(ctx, t) {
    const T0 = PB(3, 1.5), cam = camAt(640 + BIKE.bell[0], 540 + 96 * 7, 7);
    drawLane(ctx, 'spring', cam, t, { alpha: .4 });
    drawWeather(ctx, 'spring', t, { x: 0, y: 0, z: 1.5 }, .5);
    bellInsert(ctx, t, T0 - 1.6, DS, he25.skin, { z: .92, seed: 14 });
  } });
  ev(DS, 'bell', { v: 1, hit: 'dingSpring' }); ev(DS + .22, 'bell', { v: .75 });
  // shot 29: the dolly again, slower: both on the bicycle; blossom bursts overhead; the stick on the wall exits left
  const D2 = HT.dollyTwo, DE = ST.spring.end;
  shot({ id: 's29', t0: D2, t1: DE, page: 'spring', trans: 'wipe', draw(ctx, t) {
    const lt = t - D2, v = lerp(60, 120, ss(seg(t, D2, D2 + 2.5))), bx = 640 + (() => { let s = 0; for (let u = 0; u < lt; u += .05) s += lerp(60, 120, ss(seg(D2 + u, D2, D2 + 2.5))) * .05; return s; })();
    const Bk = { x: bx, y: 0, dir: 1, dist: bx - 640, crank: (bx - 640) / (2.75 * BIKE.R), lean: Math.sin(lt * 3) * .012 };
    const cam = camAt(bx + 30, 830, 1.6);
    drawLane(ctx, 'spring', cam, t);
    stickAt(ctx, cam, 522, 1, .14);
    // blossom bursts: on the near trees, clumps paint in within a second as the bicycle passes under them
    const z = cam.z;
    for (const [tx, sd] of [[1100, 71], [1750, 72], [2400, 73]]) { const k = clamp((bx - (tx - 420)) / 80); if (k <= 0) continue; const obj = spriteAt('burst' + sd, z, zz => withSeed(sd, () => { const S = []; for (let i = 0; i < 4; i++) clump(S, rnd(-120, 120) * zz, rnd(-470, -330) * zz, rnd(50, 80) * zz, 14, SEASON.spring.blossom, { l0: 10 * zz, l1: 22 * zz, w0: 7 * zz, w1: 12 * zz, a0: .7, a1: .95 }); return S; })); drawObj(ctx, obj, (tx - cam.x * .86) * z + 960, (-140 - cam.y) * z + 540, k, .95); }
    drawWeather(ctx, 'spring', t, cam, 1, { drift: bx * .3 });
    drawBike(ctx, cam, Bk, { seed: 21 });
    const rP = ridePose(he25, Bk, { expr: E('warm'), turn: .3 }), R = solve(he25, rP);
    const gP = passengerPose(gp79, Bk, R, { expr: exprAt([[0, 'calm'], [D2 + 2.5, 'moved']], t, 1) });
    drawFigure(ctx, gp79, gP, cam, { seed: 37 });
    drawFigure(ctx, he25, rP, cam, { seed: 38 });
  } });
  ev(D2, 'cut', { hit: 'dollyTwo' }); ev(D2, 'chain', { dur: DE - D2, v: .3, slow: 1 }); ev(D2 + 2.3, 'brush', { dur: 1.0, pan: .3, v: .35 }); ev(D2 + 4.0, 'brush', { dur: 1.0, pan: .3, v: .3 }); ev(D2 + 5.8, 'brush', { dur: 1.0, pan: .3, v: .3 });
  // shot 30: the climax: his face on the back seat; eyes closed, open, a smile; a petal; the line is written
  const H0 = ST.holding.t, LT = HT.lineTwo;
  shot({ id: 's30', t0: H0, t1: HB(2), page: 'spring', trans: 'wipe', wipe: .6, draw(ctx, t) {
    const lt = t - H0, bx = 1700 + 95 * lt;
    const Bk = { x: bx, y: 0, dir: 1, dist: bx - 640, crank: (bx - 640) / (2.75 * BIKE.R) };
    const rP = ridePose(he25, Bk, { expr: E('warm') }), R = solve(he25, rP);
    const ex = exprAt([[0, 'closed'], [H0 + 1.4, 'moved'], [H0 + 3.0, 'warm'], [LT + .4, 'joy']], t, .9);
    const gP = passengerPose(gp79, Bk, R, { expr: ex, turn: .88 });
    const G = solve(gp79, gP), z = 9.5, cam = { x: G.head[0] + 2, y: G.head[1] + 6, z };
    drawLane(ctx, 'spring', cam, t, { alpha: .45 });
    drawWeather(ctx, 'spring', t, cam, .25);
    drawBike(ctx, cam, Bk, { seed: 21 });
    drawFigure(ctx, gp79, gP, cam, { seed: 37 });
    // a petal lands on his shoulder
    const pt = seg(t, H0 + 2.8, H0 + 3.8); if (pt > 0) { const S = []; const sh = sp(cam, [G.sh[0] - 6, G.sh[1] - 4]); const px = lerp(sh[0] + 120, sh[0], eo(pt)) + Math.sin(pt * 9) * 14 * (1 - pt), py = lerp(sh[1] - 260, sh[1] - 6, ei(pt) * .4 + pt * .6); withSeed(62, () => dab(S, px, py, 9, 5, '#e8c9c9', .9, pt * 2)); drawStrokes(ctx, S); }
    drawWeather(ctx, 'spring', t, { x: 0, y: 0, z: 1.6 }, .35);
  } });
  ev(H0, 'cut', { hit: 'holding' }); ev(H0 + 2.9, 'petal', { v: .15 }); ev(LT, 'pencil', { dur: 1.5, v: .7, hit: 'lineTwo' }); ev(LT - .3, 'breath', { v: .25 });
  SUBS.push({ t0: LT, t1: PE + .2, text: '外公，我扶着您呢' });
  // shot 31: insert: his hand on her shoulder; her hand comes up and covers it
  shot({ id: 's31', t0: HB(2), t1: PE, page: 'spring', trans: 'wipe', wipe: .5, draw(ctx, t) {
    const T0 = HB(2), lt = t - H0, bx = 1700 + 95 * lt;
    const Bk = { x: bx, y: 0, dir: 1, dist: bx - 640, crank: (bx - 640) / (2.75 * BIKE.R) };
    const rP = ridePose(he25, Bk, { expr: E('warm') }), R = solve(he25, rP);
    const z = 15, cam = { x: R.sh[0] - 2, y: R.sh[1] + 4, z };
    drawLane(ctx, 'spring', cam, t, { alpha: .45 });
    drawFigure(ctx, he25, rP, cam, { seed: 38 });
    const S = [], sh = sp(cam, [R.sh[0] - 4, R.sh[1] + 6]);
    withSeed(63, () => { const a0 = sp(cam, [R.sh[0] - 60, R.sh[1] + 40]); S.push(mk(qcurve(a0[0], a0[1], sh[0] - 8 * z, sh[1] + 2 * z, -6 * z, 6), 6 * z, gp79.top, { prof: 'even', nb: 4, a: .9, rib: .78 })); handStrokes(S, sh[0], sh[1], 8 * z, 1, .35, gp79.skin, { rot: -.5 }); });
    const cv = eo(seg(t, T0 + .5, T0 + 1.5)); if (cv > 0) { const hx = lerp(sh[0] + 120 * z * .2, sh[0] + 4 * z, cv), hy = lerp(sh[1] + 80 * z * .2, sh[1] - 4 * z, cv); withSeed(64, () => { const a0 = sp(cam, [R.sh[0] + 40, R.sh[1] + 30]); S.push(mk(qcurve(hx + 30 * z * .3, hy + 60 * z * .3, hx + 2 * z, hy + 2 * z, 4 * z, 6), 5.2 * z, he25.top, { prof: 'even', nb: 3, a: .9, rib: .78 })); handStrokes(S, hx, hy, 7 * z, -1, .5 * cv, he25.skin, { rot: .6 }); }); }
    drawStrokes(ctx, S);
  } });
  ev(HB(2) + 1.2, 'cloth', { v: .25 });

  // ======== page 6: the last page, the two of them small (124.29 – 134.29) ========
  const N0 = ST.lane.t, NE = TL.DUR;
  page('lane', N0, NE, 'spring');
  ev(N0, 'page', { hit: 'pageLane' }); ev(N0 + .1, 'brush', { dur: 2.2, pan: -.8, pan1: .8, v: .5 }); ev(N0 + 1.4, 'pen', { dur: 1.0 });
  shot({ id: 's32', t0: N0, t1: NE - 2.0, page: 'lane', trans: 'turn', draw(ctx, t) {
    const V = { vx: 1040, vy: 450, f: 1750, h: 1.25 }, lt = t - N0;
    drawDeepLane(ctx, 'spring', V, t, { near: 1.4, reveal: seg(t, N0, N0 + 1.6) });
    const d = 24 + 3.2 * lt; if (d < 56) { const cam = deepCam(V, d, -.15, 0); const Bk = { x: 0, y: 0, dir: 1, dist: d * 100, crank: d * 100 / (2.75 * BIKE.R) }; const k = clamp((t - N0 - 1.2) / .8); drawBike(ctx, cam, Bk, { seed: 21, spokes: 6, p: k }); const rP = ridePose(he25, Bk, { expr: E('warm'), turn: .05 }), R = solve(he25, rP); drawFigure(ctx, gp79, passengerPose(gp79, Bk, R, { expr: E('warm'), turn: .3 }), cam, { seed: 37, p: k }); drawFigure(ctx, he25, rP, cam, { seed: 38, p: k }); }
    drawWeather(ctx, 'spring', t, { x: 0, y: 0, z: .8 }, .8);
    const [ax, ay] = deepPt(V, 3.2, .6), [bx2, by2] = deepPt(V, 50, -.1);
    ctx.save(); dimL(ctx, ax, ay, bx2, by2, seg(t, N0 + 1.4, N0 + 2.4)); ctx.restore();
  } });
  ev(N0 + 1.2, 'chain', { dur: 6, v: .15, fade: 1 });
  note({ page: 'lane', id: 'n50b', txt: '50 m', t0: N0 + 2.0, t1: NE - 1.6, x: 1130, y: 600, font: 'mono', size: 30 });
  note({ page: 'lane', id: 'n50bz', txt: '骑了 50 米，和那年一样', t0: N0 + 2.3, t1: NE - 1.6, x: 1810, y: 930, size: 52, align: 'right' });
  // shot 33: the brush lifts; mist to paper; the stamp
  shot({ id: 's33', t0: NE - 2.0, t1: NE, page: 'lane', trans: 'none', draw(ctx, t) {
    SHOTS.find(s => s.id === 's32').draw(ctx, t);
    mistDraw(ctx, seg(t, NE - 2.0, NE - .6));
    stampDraw(ctx, 1640, 880, seg(t, NE - 1.1, NE - .6));
  } });
  ev(NE - 2.0, 'mist', { dur: 1.6, v: .5 }); ev(NE - 1.1, 'stamp', { v: .6 });
  SHOTS.sort((a, b) => a.t0 - b.t0);
  for (const n of NOTES) if (n.font !== 'mono' && n.font !== 'serif') ev(n.t0 + (n.anchor ? .35 : 0), 'pencil', { dur: Math.max(.8, n.txt.length * .13), v: .5, auto: 1 });
  window.SUBS = SUBS; window.NOTES = NOTES; window.SHOTS = SHOTS;
}

// ---- compositor ----
let OFF1, OFF2;
function offCanvas(i) { const c = i === 1 ? (OFF1 = OFF1 || document.createElement('canvas')) : (OFF2 = OFF2 || document.createElement('canvas')); c.width = 1920; c.height = 1080; return c; }
function drawShotTo(c, s, tt) { const keep = t; t = tt; clearPaper(c); s.draw(c, tt); t = keep; }
function pageTurn(ctx, oldCv, p) {
  // the old sheet peels from the right edge toward the left; its back is paper
  const q = eio(p), E0 = lerp(1960, -360, q);
  ctx.save(); ctx.beginPath(); ctx.moveTo(-10, -10);
  for (let y = -10; y <= 1090; y += 60) ctx.lineTo(E0 + Math.sin(y / 1080 * Math.PI) * 90 * (1 - Math.abs(q - .5) * 2) * .6, y);
  ctx.lineTo(-10, 1090); ctx.closePath(); ctx.clip(); ctx.drawImage(oldCv, 0, 0); ctx.restore();
  // the curl: a strip of the paper's back with a shadow, and a shadow cast on the new page
  const w = 70 * Math.sin(Math.PI * clamp(q)) + 8;
  for (let y = -10; y <= 1090; y += 20) {
    const e = E0 + Math.sin(y / 1080 * Math.PI) * 90 * (1 - Math.abs(q - .5) * 2) * .6;
    const g = ctx.createLinearGradient(e - w, 0, e + w * 1.6, 0); g.addColorStop(0, rgba('#5a4a3a', 0)); g.addColorStop(.42, rgba('#5a4a3a', .22)); g.addColorStop(.5, rgba('#f6f0e3', .95)); g.addColorStop(.75, rgba('#e2d8c6', .9)); g.addColorStop(1, rgba('#5a4a3a', 0));
    ctx.fillStyle = g; ctx.fillRect(e - w, y, w * 2.6, 21);
  }
}
function renderFilm(ctx, tt) {
  t = tt;
  let i = SHOTS.findIndex(s => tt >= s.t0 && tt < s.t1); if (i < 0) i = tt >= TL.DUR ? SHOTS.length - 1 : 0;
  const s = SHOTS[i], prev = SHOTS[i - 1], page = PAGES.find(p => tt >= p.t0 && tt < p.t1) || PAGES[PAGES.length - 1];
  const prevPage = prev ? PAGES.find(p => p.id === prev.page) : null;
  if (s.trans === 'wipe' && prev && tt < s.t0 + (s.wipe || .5)) {
    drawShotTo(ctx, prev, tt);
    const off = offCanvas(1), c2 = off.getContext('2d'); drawShotTo(c2, s, tt);
    ctx.save(); wipeClip(ctx, seg(tt, s.t0, s.t0 + (s.wipe || .5))); ctx.drawImage(off, 0, 0); ctx.restore();
  } else if (s.trans === 'turn' && prev && tt < s.t0 + .85) {
    s.draw(ctx, tt);
    drawNotes(ctx, tt, page.id);
    let old = FROZEN.get(prev.id);
    if (!old) { old = offCanvas(2); const c2 = old.getContext('2d'); drawShotTo(c2, prev, prev.t1 - .02); drawNotes(c2, prev.t1 - .02, prevPage.id); const keepCv = document.createElement('canvas'); keepCv.width = 1920; keepCv.height = 1080; keepCv.getContext('2d').drawImage(old, 0, 0); FROZEN.set(prev.id, keepCv); old = keepCv; }
    pageTurn(ctx, old, seg(tt, s.t0, s.t0 + .85));
    drawSubsHand(ctx, tt);
    return;
  } else s.draw(ctx, tt);
  drawNotes(ctx, tt, page.id);
  drawSubsHand(ctx, tt);
}
