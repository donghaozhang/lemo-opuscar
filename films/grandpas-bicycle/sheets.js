// ---------- model sheet, expression sheet, pose sheet (?sheet=model|expr|poses) ----------
function sheetLabel(ctx, txt, x, y, size = 22) { ctx.save(); ctx.font = `400 ${size}px ${FONT_MONO}`; ctx.fillStyle = rgba(INKT, .7); ctx.textAlign = 'center'; ctx.fillText(txt, x, y); ctx.restore(); }
function standPose(C, x, dir, turn, expr, o = {}) {
  return Object.assign({ x, y: 0, dir, turn, expr: EXPR[expr] || EXPR.neutral, feet: [[x + 7 * dir, 0], [x - 7 * dir, 0]], armSwing: [.12, -.1] }, o);
}
function sheetModel(ctx) {
  const cam = { x: 0, y: 12, z: 1.7 };
  const row = [['he6', 'determined'], ['he10', 'happy'], ['he18', 'bitter'], ['he25', 'warm'], ['gp60', 'amused'], ['gp64', 'proud'], ['gp72', 'tired'], ['gp79', 'gentle']];
  const xs = [-520, -400, -270, -140, 10, 150, 290, 430];
  row.forEach(([id, ex], i) => {
    const C = CHARS[id], x = xs[i];
    drawFigure(ctx, C, standPose(C, x, 1, .35, ex), cam, { seed: 3 + i });
    sheetLabel(ctx, `${id} · ${C.h / 100} m`, sx(cam, x), sy(cam, 0) + 30);
  });
  // second row: 3/4 front at head scale, facing left, and the bicycle with the two main characters
  const cam2 = { x: 0, y: -314, z: 1.4 };
  ctx.save();
  drawFigure(ctx, CHARS.he6, standPose(CHARS.he6, -520, -1, .75, 'joy'), cam2, { seed: 31 });
  drawFigure(ctx, CHARS.gp60, standPose(CHARS.gp60, -420, -1, .75, 'gentle'), cam2, { seed: 32 });
  const Bk = { x: -120, y: 0, dir: 1, crank: .6, dist: 20 };
  drawBike(ctx, cam2, Bk);
  // grandpa standing behind the bike holding the saddle, Xiao He on it
  const sad = bikePt(Bk, BIKE.saddle);
  drawFigure(ctx, CHARS.he6, { x: sad[0] + 2, y: 0, dir: 1, hipY: sad[1] - 3, lean: .25, turn: .3, expr: EXPR.determined, feet: [pedalPt(Bk, 0), pedalPt(Bk, 1)], hands: [bikePt(Bk, BIKE.grip), bikePt(Bk, [BIKE.grip[0] - 2, BIKE.grip[1] + 1])], kneeSide: [1, 1] }, cam2, { seed: 33 });
  drawFigure(ctx, CHARS.gp60, { x: sad[0] - 50, y: 0, dir: 1, lean: .35, turn: .35, expr: EXPR.amused, feet: [[sad[0] - 36, 0], [sad[0] - 66, 0]], hands: [[sad[0] - 10, sad[1] + 2], null], kneeSide: [1, 1] }, cam2, { seed: 34 });
  // grandpa side-saddle on the rack, Xiao He (25) riding, facing right
  const Bk2 = { x: 300, y: 0, dir: 1, crank: 2.2, dist: 40 };
  drawBike(ctx, cam2, Bk2);
  const sad2 = bikePt(Bk2, BIKE.saddle);
  drawFigure(ctx, CHARS.he25, { x: sad2[0] + 4, y: 0, dir: 1, hipY: sad2[1] - 3, lean: .18, turn: .3, expr: EXPR.warm, feet: [pedalPt(Bk2, 0), pedalPt(Bk2, 1)], hands: [bikePt(Bk2, BIKE.grip), bikePt(Bk2, [BIKE.grip[0] - 2, BIKE.grip[1] + 1])], kneeSide: [1, 1] }, cam2, { seed: 35 });
  const rk = bikePt(Bk2, [-8, -84]);
  drawFigure(ctx, CHARS.gp79, { x: rk[0], y: 0, dir: -1, hipY: rk[1], lean: .05, turn: .85, expr: EXPR.moved, feet: [[rk[0] + 18, -22], [rk[0] + 26, -30]], hands: [[sad2[0] + 10, sad2[1] - 46], [rk[0] - 6, rk[1] + 20]], kneeSide: [-1, -1], elbowSide: [-1, 1] }, cam2, { seed: 36 });
  ctx.restore();
  // palette
  const pal = [['#c8442a', '小荷的红'], ['#2a2522', '单车 · 墨'], ['#8fae62', '夏'], ['#d4913f', '秋'], ['#8c96a2', '冬'], ['#e8c9c9', '春']];
  pal.forEach(([c, n], i) => { withSeed(70 + i, () => drawS(ctx, mk(qcurve(1380 + i * 90, 80, 1440 + i * 90, 80, 0, 5), 26, c, { prof: 'even', nb: 3, a: .9 }))); hand(ctx, 'pal' + i, n, 1410 + i * 90, 125, 1, { size: 24, align: 'center', noreg: true }); });
  serif(ctx, 'sheet', '《外公的单车》 · 人物设定', 300, 60, 1, { size: 34, align: 'left', noreg: true });
}
function sheetLane(ctx, season, mode) {
  if (mode === 'deep') {
    const V = { vx: 1000, vy: 470, f: 1700, h: 1.4 };
    drawDeepLane(ctx, season, V, 0, { near: 1.2 });
    // grandpa far down the lane, waving; Xiao He near, back to us
    const C = CHARS.gp60, d = 48, cam = deepCam(V, d, -.6, 0);
    drawFigure(ctx, C, standPose(C, 0, -1, .7, 'proud', { hands: [[-20, -200], null], elbowSide: [-1, 1] }), cam, { seed: 5 });
    return;
  }
  const cam = { x: 1200, y: -160, z: .62 };
  drawLane(ctx, season, cam, 0);
  drawWeather(ctx, season, 1.3, cam, 1);
  const Bk = { x: 900, y: 0, dir: 1, crank: 1, dist: 30 }; drawBike(ctx, cam, Bk);
  drawFigure(ctx, CHARS.gp60, standPose(CHARS.gp60, 760, 1, .35, 'amused'), cam, { seed: 9 });
  drawFigure(ctx, CHARS.he6, standPose(CHARS.he6, 1150, 1, .35, 'joy'), cam, { seed: 10 });
  if (season === 'winter') drawDusk(ctx, cam, 1, LANE.window + 30, -150);
}
function sheetExpr(ctx) {
  const names = [['he6', ['determined', 'worried', 'ouch', 'sniff', 'focus', 'joy', 'surprise', 'happy']], ['he25', ['bitter', 'warm', 'effort', 'moved', 'calm', 'happy', 'joy', 'hesitant']], ['gp60', ['amused', 'gentle', 'proud', 'calm', 'worried', 'focus', 'happy', 'surprise']], ['gp79', ['tired', 'closed', 'moved', 'gentle', 'hesitant', 'warm', 'calm', 'joy']]];
  names.forEach(([id, list], r) => list.forEach((ex, i) => {
    const C = CHARS[id], S = []; const cx = 150 + i * 235, cy = 150 + r * 250;
    withSeed(100 + r * 10 + i, () => drawHead(S, C, [cx, cy], 72, (i % 2 ? -1 : 1), .7, EXPR[ex], 6));
    for (const s of S) drawS(ctx, s);
    sheetLabel(ctx, ex, cx, cy + 112, 18);
  }));
  serif(ctx, 'sheet', '表情', 60, 40, 1, { size: 28, align: 'left', noreg: true });
}
function sheetPoses(ctx) {
  const cam = { x: 0, y: -80, z: 1.5 };
  // run-push, fall, crouch, lift, wave, walk with stick
  const Bk = { x: -560, y: 0, dir: 1, crank: 1.0, dist: 60 }; drawBike(ctx, cam, Bk);
  const sad = bikePt(Bk, BIKE.saddle);
  drawFigure(ctx, CHARS.he6, { x: sad[0] + 2, y: 0, dir: 1, hipY: sad[1] - 3, lean: .3, turn: .3, expr: EXPR.focus, feet: [pedalPt(Bk, 0), pedalPt(Bk, 1)], hands: [bikePt(Bk, BIKE.grip), bikePt(Bk, [BIKE.grip[0] - 2, BIKE.grip[1] + 1])], kneeSide: [1, 1] }, cam, { seed: 41 });
  drawFigure(ctx, CHARS.gp60, { x: sad[0] - 70, y: 0, dir: 1, lean: .55, turn: .3, expr: EXPR.focus, feet: [[sad[0] - 40, -6], [sad[0] - 100, -22]], hands: [[sad[0] - 12, sad[1] + 2], [sad[0] - 60, -110]], kneeSide: [1, 1], hipY: -78 }, cam, { seed: 42 });
  // fall: on the ground, sitting
  drawFigure(ctx, CHARS.he6, { x: -250, y: 0, dir: 1, hipY: -12, lean: -.3, turn: .5, expr: EXPR.ouch, feet: [[-215, -2], [-205, -6]], hands: [[-272, -2], [-236, -4]], kneeSide: [1, 1], elbowSide: [-1, -1], knee: 1 }, cam, { seed: 43 });
  // crouch (grandpa to her height) + she stands sniffing
  drawFigure(ctx, CHARS.gp60, { x: -80, y: 0, dir: 1, hipY: -40, lean: .35, turn: .6, expr: EXPR.gentle, feet: [[-60, 0], [-110, 0]], hands: [[-20, -70], [-50, -40]], kneeSide: [1, 1], elbowSide: [1, 1] }, cam, { seed: 44 });
  drawFigure(ctx, CHARS.he6, standPose(CHARS.he6, 20, -1, .6, 'sniff', { knee: 1 }), cam, { seed: 45 });
  // the lift: she (25) lifting grandpa (79) onto the rack
  const Bk2 = { x: 220, y: 0, dir: 1, crank: .3 }; drawBike(ctx, cam, Bk2);
  const rk = bikePt(Bk2, [-8, -84]);
  drawFigure(ctx, CHARS.he25, { x: rk[0] - 50, y: 0, dir: 1, lean: .4, turn: .4, expr: EXPR.effort, feet: [[rk[0] - 30, 0], [rk[0] - 72, 0]], hands: [[rk[0] - 8, rk[1] - 10], [rk[0] - 16, rk[1] + 12]], kneeSide: [1, 1], hipY: -70 }, cam, { seed: 46 });
  drawFigure(ctx, CHARS.gp79, { x: rk[0], y: 0, dir: -1, hipY: rk[1] + 6, lean: .1, turn: .85, expr: EXPR.hesitant, feet: [[rk[0] + 14, -18], [rk[0] + 22, -26]], hands: [[rk[0] - 44, rk[1] - 30], [rk[0] - 10, rk[1] + 18]], kneeSide: [-1, -1], elbowSide: [-1, 1] }, cam, { seed: 47 });
  // wave, and walking with the stick
  drawFigure(ctx, CHARS.gp64, standPose(CHARS.gp64, 500, -1, .5, 'proud', { hands: [[478, -175], null], elbowSide: [-1, 1] }), cam, { seed: 48 });
  drawFigure(ctx, CHARS.gp79, standPose(CHARS.gp79, 620, 1, .5, 'tired', { hands: [[646, -88], null], feet: [[628, 0], [606, 0]] }), cam, { seed: 49 });
  { const S = []; withSeed(50, () => stickStrokes(S, sx(cam, 650), sy(cam, 0), 86 * cam.z, cam.z, 1, .08)); for (const s of S) drawS(ctx, s); }
  serif(ctx, 'sheet', '关键动作', 60, 40, 1, { size: 28, align: 'left', noreg: true });
}
