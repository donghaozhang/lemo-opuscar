// 愚公移山 · shots T1–D5: the title, the detour, the decision, the dig, the seasons
import * as WC from './engine/index.js';
import * as ST from './stage.js';
import * as WD from './world.js';
import * as INK from './ink.js';
import { drawFig, EXPR } from './chars.js';
import { drawFace, FX, fblend } from './faces.js';
import { tool, pole, grip, drawBasket } from './props.js';
import { T, S, R, mul, ap } from './rig.js';
import { plate, block, captionAt, BUF } from './film.js';
import { curl, peelState } from './trans.js';
import { ss, eio, eo, ei, seg, tw, key, walk, run, swingPose, knife, PI } from './anim.js';
import { clamp, lerp, mulberry } from '/core/lib.js';

const PW = ST.PW, PH = ST.PH, RV = ST.RV, G = WD.GROUND;
const C = {}; const once = (k, f) => C[k] || (C[k] = f());
export const SHOTS = {};
const F = (x, y, k, flip = false) => mul(T(x, y), S(flip ? -k : k, k));

// ================================================================ TITLE
const TITLE = { cx: PW / 2, cy: PH / 2 - 20, size: 300, text: '愚公移山' };
function titleCuts(mirror) {
  return once('title' + mirror, () => {
    const font = `900 ${TITLE.size}px "Noto Serif SC"`;
    const reg = new WC.Region(q => { q.save(); if (mirror) { q.translate(2 * TITLE.cx, 0); q.scale(-1, 1); } q.font = font; q.textAlign = 'center'; q.textBaseline = 'middle'; try { q.letterSpacing = '30px'; } catch (e) { } q.fillText(TITLE.text, TITLE.cx + 15, TITLE.cy); q.restore(); }, { res: 1, bbox: [TITLE.cx - 760, TITLE.cy - 200, TITLE.cx + 760, TITLE.cy + 200] });
    // first character (愚) sits at the right on the mirrored block: carve from right to left there
    const kx = mirror ? (x => clamp(1 - (x - TITLE.cx + 700) / 1400)) : (x => clamp((x - TITLE.cx + 700) / 1400));
    const cuts = WC.hatch(reg, { dir: WC.dirAngle(PI / 2 - .35), tone: () => 1, sp: 4.2, wmax: 5.4, seed: 3, seg: [14, 50], gap: [0, 1], reveal: RV((x, y) => kx(x), 900, .03) });
    // a border rule carved round the title panel
    const rule = WC.cutAlong([[TITLE.cx - 720, TITLE.cy + 210], [TITLE.cx + 720, TITLE.cy + 210]], { w: 7, kind: 'v', seg: [200, 500], gap: [0, 2], seed: 4, reveal: { t0: .9, t1: 1, speed: 2000 } });
    const rule2 = WC.cutAlong([[TITLE.cx - 720, TITLE.cy - 220], [TITLE.cx + 720, TITLE.cy - 220]], { w: 7, kind: 'v', seg: [200, 500], gap: [0, 2], seed: 5, reveal: { t0: 0, t1: .1, speed: 2000 } });
    return { cuts, rule, rule2, kx };
  });
}
const T1W = [.15, 3.7];
SHOTS.T1 = {
  draw(g, lt, t) {
    const Tc = titleCuts(true), u = seg(lt, T1W[0], T1W[1]);
    // the knife front moves right → left across the mirrored title
    const fx = TITLE.cx + 700 - 1400 * clamp(u * 1.02), cam = { x: lerp(fx, PW / 2, ss(seg(lt, 2.6, 3.9))), y: TITLE.cy, z: lerp(2.3, 1.12, ss(seg(lt, 0, 3.9))) };
    const tips = [];
    block(g, cam, m => {
      ST.carve(m, Tc.rule2, lt, T1W[0], T1W[1]);
      ST.carve(m, Tc.cuts, lt, T1W[0], T1W[1], '#fff', tips);
      ST.carve(m, Tc.rule, lt, T1W[0], T1W[1]);
      for (const tp of tips.slice(0, 6)) WC.chip(m, tp, 1.6);
    }, { sheen: .2 });
    // the knife, at the tip that is cutting now (block is mirrored: plate x → mirrored x)
    const tp = tips.length ? tips[tips.length - 1] : { x: 2 * TITLE.cx - fx, y: TITLE.cy };
    const sx = 2 * TITLE.cx - tp.x, k = ST.camMatrix(cam, true), X = k[0] * sx + k[4], Y = k[3] * tp.y + k[5];
    if (lt < 3.85) knife(g, X, Y, -2.5 + .15 * Math.sin(lt * 9), .9 * cam.z / 1.6 + .3);
  },
  ev: () => [{ lt: .02, type: 'knife_in', g: 1 }, { lt: .15, type: 'carve', dur: 3.5, g: .8 }, ...[0, 1, 2, 3].map(i => ({ lt: T1W[0] + (T1W[1] - T1W[0]) * i / 4 + .02, type: 'knife_in', g: .7 }))],
};
// T2: the brayer inks the block, the sheet goes down, the baren rubs it, the print is pulled
function titlePrint(g, wet = false) {   // the true print of the title (T3's plate) into g
  const Tc = titleCuts(false);
  ST.begin({}); ST.carve(ST.m, Tc.cuts); ST.carve(ST.m, Tc.rule); ST.carve(ST.m, Tc.rule2); ST.end();
  ST.m.save(); ST.m.font = '600 34px "Noto Serif SC"'; ST.m.textAlign = 'center'; ST.m.textBaseline = 'middle'; ST.m.fillStyle = '#000'; try { ST.m.letterSpacing = '12px'; } catch (e) { } ST.m.fillText('列子 · 汤问', 966, ST.IMG.y + ST.IMG.h + 72); try { ST.m.letterSpacing = '0px'; } catch (e) { } ST.m.restore();
  return ST.print(g, { seed: 3, inkSeed: 2 });
}
SHOTS.T2 = {
  draw(g, lt, t) {
    const Tc = titleCuts(true), cam = { x: PW / 2, y: TITLE.cy, z: 1.12 };
    const wetX = lt < .45 ? lerp(-200, 2200, lt / .45) : -1;
    const [bc, bg] = BUF[0], [pc, pg] = BUF[1], [qc, qg] = BUF[2];
    block(bg, cam, m => { ST.carve(m, Tc.cuts); ST.carve(m, Tc.rule); ST.carve(m, Tc.rule2); }, { wetX, sheen: lt < .5 ? .28 : .16 });
    if (lt < .45) { g.drawImage(bc, 0, 0); const x = wetX; g.fillStyle = 'rgba(30,30,30,.9)'; g.fillRect(x - 70, 0, 60, 1080); g.fillStyle = 'rgba(150,150,150,.35)'; g.fillRect(x - 70, 0, 8, 1080); return; }
    // the sheet's back: paper with the ink soaking through, mirrored (it reads backwards from behind)
    titlePrint(pg);
    qg.setTransform(1, 0, 0, 1, 0, 0); qg.fillStyle = '#EFE8D8'; qg.fillRect(0, 0, 1920, 1080);
    const soak = seg(lt, .62, .9) * .3; qg.save(); qg.globalAlpha = soak; qg.translate(1920, 0); qg.scale(-1, 1); qg.globalCompositeOperation = 'multiply'; qg.drawImage(pc, 0, 0); qg.restore();
    if (lt < .62) {   // sheet lays down from the top with its shadow
      g.drawImage(bc, 0, 0);
      const d = ss(seg(lt, .45, .62)), y = lerp(-1100, 0, d);
      g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(0, y + 1080, 1920, 30 * (1 - d) + 6);
      g.drawImage(qc, 0, y);
      return;
    }
    if (lt < .9) { g.drawImage(qc, 0, 0); const a = (lt - .62) * 40, bx = 960 + Math.cos(a) * 520, by = 540 + Math.sin(a) * 220; const rg = g.createRadialGradient(bx, by, 10, bx, by, 160); rg.addColorStop(0, 'rgba(60,40,20,.28)'); rg.addColorStop(1, 'rgba(60,40,20,0)'); g.fillStyle = rg; g.fillRect(bx - 170, by - 170, 340, 340); return; }
    const ps = peelState(seg(lt, .9, 1.5) * .92, 160);
    g.drawImage(bc, 0, 0);
    curl(g, qc, pc, ps.xf, ps.r);
  },
  ev: () => [{ lt: 0, type: 'brayer' }, { lt: .45, type: 'paper' }, { lt: .62, type: 'baren', dur: .28 }, { lt: .9, type: 'peel', dur: .6 }],
};
SHOTS.T3 = {
  draw(g, lt, t) {
    const z = 1 + .03 * ss(lt / 2.5);
    titlePrint(g);
    if (z !== 1) { const [bc, bg] = BUF[0]; bg.drawImage(g.canvas, 0, 0); g.fillStyle = '#EFE8D8'; g.fillRect(0, 0, 1920, 1080); g.drawImage(bc, 0, 0, 1920, 1080, -(z - 1) * 960, -(z - 1) * 490, 1920 * z, 1080 * z); }
  },
  texts: lt => [{ id: 'title', text: '愚公移山', x0: 300, y0: 280, x1: 1620, y1: 660 }, { id: 'liezi', text: '列子·汤问', x0: 820, y0: 960, x1: 1100, y1: 1010 }],
  ev: () => [{ lt: 0, type: 'ding', g: 1 }],
};

// ================================================================ THE DETOUR
SHOTS.B1 = {   // the two mountains carve themselves; slow pull back + crane down
  draw(g, lt, t, sh) {
    const u = ss(lt / 4.17), cam = { x: PW / 2, y: lerp(370, PH / 2, u), z: lerp(1.32, 1.0, u) };
    plate(g, t, lt, sh, cam, m => { WD.drawMountains(m, lt, 0, 1.7); }, { hard: false });
  },
  ev: () => [{ lt: 0, type: 'gouge_run', dur: 1.7, g: .8 }, { lt: 0, type: 'wind', dur: 4.2, g: .5 }],
};
SHOTS.B2 = {   // the cottage at the foot of the cliff: push toward the door
  draw(g, lt, t, sh) {
    const u = eio(lt / 2.5), cam = { x: lerp(820, 690, u), y: lerp(560, 600, u), z: lerp(1.05, 1.6, u) };
    plate(g, t, lt, sh, cam, m => { WD.drawCottage(m, lt, 0, .55); });
  },
  ev: () => [{ lt: 0, type: 'gouge_run', dur: .55, g: .5 }],
};
// Yu Gong steps out with his pole, the front basket bumps the rock, he looks up, up, up
const B3cam = { x: 700, y: 560, z: 2.15 };
function yugongDoor(m, lt, fig) {
  // door opens .1–.5; he steps out .4–1.5; bump at 1.55; recoil; look up 1.9–2.9
  const xs = key([[0, 560], [.4, 600], [1.5, 700], [1.6, 696], [1.75, 688], [3.4, 688]], lt);
  const ph = lt < 1.5 ? (lt - .4) * 1.6 : 0;
  let p = { lean: .32, head: -.1, expr: 'neutral', a1: -.3, e1: -1.6, a2: .2, e2: -.3, beard: 0 };
  if (lt > .4 && lt < 1.5) p = walk(ph, p, { stride: .3, arm: .1, bob: 5 });
  // bump: the head jerks back, beard follows through
  const bump = lt > 1.55 && lt < 1.9 ? Math.sin(seg(lt, 1.55, 1.9) * PI) : 0;
  p.lean -= .25 * bump; p.head -= .3 * bump; p.beard = .25 * bump;
  if (lt > 1.55 && lt < 1.95) p.expr = { ...EXPR.shock, jaw: .5 };
  const up = ss(seg(lt, 1.95, 2.9));
  p.head -= .75 * up; p.lean -= .22 * up; p.beard += -.3 * up;
  if (lt > 1.95) p.expr = { ...EXPR.up, open: 1.1 };
  return drawFig(m, F(xs, 700, .62), 'yugong', p, 1e9, { back: (g, out) => { const s = out.shoulder; const [x, y] = ap(out.M, ...ap(out.root, 0, 0)); }, front: (g, out) => {
    const sh = ap(out.shoulder, 0, 0), sw = lt < 1.55 ? .06 * Math.sin(lt * 8) : -.18 * Math.exp(-(lt - 1.55) * 3) * Math.cos((lt - 1.55) * 14);
    pole(g, sh[0] - 4, sh[1] + 6, .04, .62, 1e9, { swing: sw, fill: 0, span: 150, w: 80, h: 56 });
  } });
}
SHOTS.B3 = {
  draw(g, lt, t, sh) {
    const lk = tw(lt);
    plate(g, t, lt, sh, B3cam, m => {
      WD.drawCottage(m, 9, 0, 1, { door: ss(seg(lk, .1, .5)) });
      yugongDoor(m, lk);
    });
  },
  ev: () => [{ lt: .12, type: 'door' }, { lt: .55, type: 'step' }, { lt: .85, type: 'step' }, { lt: 1.15, type: 'step' }, { lt: 1.45, type: 'step' }, { lt: 1.55, type: 'bump' }, { lt: 2.0, type: 'look' }],
};
// B4: tilt up the cliff to the summit lost in cloud
function cliffTop() {
  return once('clifftop', () => ({
    sky: WD.sky('tall', [-600, -3600, PW + 1200, 4600], (x, y) => clamp(.25 + .5 * clamp((y + 3200) / 2600)), { sp: 13 }),
    clouds: [WD.cloud('c1', 900, -2520, 150, { seed: 3 }), WD.cloud('c2', 1400, -2300, 120, { seed: 5 }), WD.cloud('c3', 600, -2100, 110, { seed: 7 })],
  }));
}
SHOTS.B4 = {
  draw(g, lt, t, sh) {
    const u = eio(seg(lt, .1, 2.4)), cam = { x: lerp(820, 900, u), y: lerp(560, -2280, u), z: lerp(1.6, 1.0, ss(lt / 1.2)) };
    const K = cliffTop();
    plate(g, t, lt, sh, cam, m => {
      ST.carve(m, K.sky.filter(s => true));
      WD.drawCottage(m, 9, 0, 1, { door: 1 });
      drawFig(m, F(688, 700, .62), 'yugong', { lean: .1, head: -.9, expr: 'up', a1: -.3, e1: -1.6, beard: -.3 }, 1e9, { front: (g, out) => { const s = ap(out.shoulder, 0, 0); pole(g, s[0] - 4, s[1] + 6, .04, .62, 1e9, { fill: 0, span: 150, w: 80, h: 56 }); } });
      for (const c of K.clouds) WD.drawCloud(m, c, 9, 0, 1);
    });
  },
  ev: () => [{ lt: .1, type: 'whoosh_up', dur: 2.3 }],
};
// B5: the map — the knife cuts the long detour; a tiny walker; three nights pass
SHOTS.B5 = {
  draw(g, lt, t, sh) {
    const K = WD.mapPlate(), u = seg(lt, .3, 4.5), D = K.detour, n = D.length;
    const i = Math.min(n - 1, Math.floor(eio(u) * (n - 1))), tip = D[i];
    const cam = { x: lerp(tip[0], PW / 2, ss(seg(lt, 3.6, 5))), y: lerp(tip[1], PH / 2, ss(seg(lt, 3.6, 5))), z: lerp(1.9, 1.0, ss(seg(lt, 3.4, 5))) };
    plate(g, t, lt, sh, cam, m => {
      ST.carve(m, K.field, lt, 0, .3);
      ST.carve(m, K.river);
      for (const s of K.pk) ST.carveShape(m, s, lt, 0, .3, { white: true });
      WD.house(m, ...WD.MAP.house, 1.1, false);
      for (const [dx, dy, s] of [[0, 0, 1], [70, 18, .8], [-66, 26, .85], [20, 50, .9], [110, -10, .7]]) WD.house(m, WD.MAP.market[0] + dx, WD.MAP.market[1] + dy, s, false);
      INK.taper(m, [[WD.MAP.market[0] + 40, WD.MAP.market[1] - 40], [WD.MAP.market[0] + 40, WD.MAP.market[1] - 110]], 5, '#fff', { spline: false }); INK.poly(m, [[WD.MAP.market[0] + 42, WD.MAP.market[1] - 110], [WD.MAP.market[0] + 90, WD.MAP.market[1] - 98], [WD.MAP.market[0] + 42, WD.MAP.market[1] - 86]], '#fff');
      // the road so far: a single knife line
      if (i > 1) INK.taper(m, D.slice(0, i + 1), 9, '#fff', { a: .01, b: .02, spline: false });
      // a dotted trail of footprints behind
      for (let k = 0; k < i; k += 14) INK.blob(m, D[k][0] + 10, D[k][1] + 12, 2.5, 2, '#fff');
      // nights: three crescent moons carved above the road, one per night
      [[1.5, [1100, 140]], [2.5, [1600, 330]], [3.5, [1240, 640]]].forEach(([tm, [x, y]]) => { if (lt > tm) { const a = ss(seg(lt, tm, tm + .3)); INK.blob(m, x, y, 26 * a, 26 * a, '#fff'); INK.blob(m, x + 11, y - 6, 22 * a, 22 * a, '#000'); } });
      // the walker: a little carrier with a pole, bobbing
      if (u > 0 && u < 1) { const p = walk(lt * 2.2, { lean: .3 }, { stride: .4 }); drawFig(m, F(tip[0], tip[1] - 4, .085), 'yugong', p, 1e9, { sil: 22 }); }
    }, { hard: true });
  },
  ev: () => [{ lt: .3, type: 'carve_line', dur: 4.2, g: .7 }, { lt: 1.5, type: 'night' }, { lt: 2.5, type: 'night' }, { lt: 3.5, type: 'night' }],
};
// B6: CU — dusk, sweat; weariness turns into a decision
function duskSky() { return once('dusk', () => WD.sky('dusk', [-200, -200, PW + 400, PH + 400], (x, y) => clamp(.1 + .55 * clamp((y - 250) / 640) ** 2), { sp: 14, seed: 41 })); }
SHOTS.B6 = {
  draw(g, lt, t, sh) {
    const lk = tw(lt), e = key([[0, FX.yugong.weary], [.9, FX.yugong.weary], [1.5, FX.yugong.resolve]], lk);
    const nod = Math.sin(seg(lk, 1.5, 1.9) * PI) * .03;
    const cam = { x: PW / 2, y: PH / 2, z: lerp(1, 1.07, ss(lt / 2.5)) };
    plate(g, t, lt, sh, cam, m => {
      ST.carve(m, duskSky());
      drawFace(m, mul(T(PW / 2 + 40, 420 + nod * 600), mul(R(.04 - nod), S(1.0))), 'yugong', e);
      // a bead of sweat on the temple (carved white), sliding down
      const sy = 300 + 60 * seg(lt, 0, 1.4); INK.blob(m, PW / 2 - 150, sy, 7, 11, '#fff');
    });
  },
  ev: () => [{ lt: 1.5, type: 'resolve' }],
};

// ================================================================ THE DECISION (night) AND THE DIG
function interior() {
  return once('interior', () => {
    const r = mulberry(3);
    const floor = WD.ground('floor', 700, 1400, { tone: (x, y) => clamp(.75 - Math.hypot(x - 900, (y - 700) * 3) / 900), sp: 10, seed: 51 });
    const lampRays = WC.rays(900, 560, { n: 60, r0: 60, r1: [260, 900], w: 12, seed: 7, jit: .8, kind: 'u' });
    const beams = []; for (let i = 0; i < 9; i++) beams.push(...WC.cutAlong([[0, 140 + i * 6], [PW, 132 + i * 7]], { w: 3, kind: 'v', seg: [80, 300], gap: [20, 80], seed: i }));
    return { floor, lampRays, beams };
  });
}
function lamp(m, x, y, lt, k = 1) {
  const fl = .85 + .15 * Math.sin(tw(lt) * 31) * Math.sin(tw(lt) * 13);
  // table and lamp bowl (black), flame (white teardrop), glow cuts
  INK.poly(m, [[x - 110 * k, y + 80 * k], [x + 110 * k, y + 80 * k], [x + 90 * k, y + 100 * k], [x - 90 * k, y + 100 * k]], '#000');
  INK.poly(m, [[x - 30 * k, y + 10 * k], [x + 30 * k, y + 10 * k], [x + 12 * k, y + 30 * k], [x + 8 * k, y + 80 * k], [x - 8 * k, y + 80 * k], [x - 12 * k, y + 30 * k]], '#000');
  INK.poly(m, WC.spline([[x, y - 46 * k * fl], [x + 12 * k, y - 8 * k], [x, y + 6 * k], [x - 12 * k, y - 8 * k]], 2, true), '#fff');
  INK.blob(m, x, y - 4 * k, 4 * k, 9 * k, '#000');
}
function nightRoom(m, lt, o = {}) {
  const K = interior(), fl = .9 + .1 * Math.sin(tw(lt) * 23);
  // lamp light: rays radiating from the flame, longer where it falls on the floor
  m.save(); m.translate(900, 560); m.scale(fl, fl); m.translate(-900, -560); ST.carve(m, K.lampRays); m.restore();
  ST.carveShape(m, K.floor);
  // the window: night sky with stars and the black mountain filling it
  INK.poly(m, WC.rect(1380, 170, 300, 240), '#fff');
  const st = WD.flecks('stars', 40, [1380, 170, 300, 120], [1.5, 3.5], 9);
  INK.poly(m, [[1380, 410], [1380, 300], [1450, 230], [1520, 270], [1600, 190], [1680, 250], [1680, 410]], '#000');
  m.save(); m.beginPath(); m.rect(1380, 170, 300, 240); m.clip(); ST.carve(m, st, 9, 0, 1, '#000'); m.restore();
  for (const [x0, y0, x1, y1] of [[1380, 290, 1680, 290], [1530, 170, 1530, 410]]) INK.taper(m, [[x0, y0], [x1, y1]], 10, '#000', { spline: false });
  ST.carve(m, K.beams, 9, 0, 1, '#000');
}
SHOTS.C1 = {
  draw(g, lt, t, sh) {
    const lk = tw(lt);
    plate(g, t, lt, sh, { x: 960, y: 470, z: 1.05 }, m => {
      nightRoom(m, lk);
      // sons and grandson, seated (sitting on their heels), facing left toward the lamp and the old man
      const sit = { q1: 1.35, k1: 2.7, q2: 1.25, k2: 2.6, lean: .12, a1: .5, e1: -1.2, a2: .4, e2: -1.1 };
      const turn = ss(seg(lk, .6, 1.0));
      drawFig(m, F(1150, 760, .95, true), 'son', { ...sit, head: -.05 - .1 * turn, expr: lk > .7 ? 'neutral' : 'neutral' });
      drawFig(m, F(1330, 770, .9, true), 'son', { ...sit, head: .1 - .15 * turn, expr: 'neutral' });
      drawFig(m, F(1500, 775, .85, true), 'grandson', { ...sit, head: -.1 * turn, expr: { ...EXPR.neutral, open: 1.1 } });
      lamp(m, 900, 560, lk);
      // Yu Gong stands, slams his fist on his palm (.55), then points at the mountain in the window (1.2 →)
      const slam = key([[0, { lean: .3, a1: .2, e1: -1.4, a2: .1, e2: -1.5, expr: 'resolve', head: -.05 }], [.4, { lean: .15, a1: -1.6, e1: -1.8, a2: .0, e2: -1.6, expr: 'resolve', head: -.15 }], [.55, { lean: .42, a1: -.5, e1: -1.4, a2: .1, e2: -1.5, expr: 'resolve', head: .1 }], [1.0, { lean: .35, a1: -.4, e1: -1.3, a2: .1, e2: -1.5, expr: 'resolve', head: 0 }],
        [1.35, { lean: .2, a1: -2.15, e1: -.15, a2: .2, e2: -.6, expr: 'resolve', head: -.35 }], [3.6, { lean: .2, a1: -2.2, e1: -.1, a2: .2, e2: -.6, expr: 'resolve', head: -.35 }]], lk);
      drawFig(m, F(560, 790, 1.05), 'yugong', { ...slam, beard: lk > .55 && lk < .9 ? .15 : 0 });
    });
  },
  ev: () => [{ lt: 0, type: 'night_bed', dur: 5.7 }, { lt: .55, type: 'thump', g: 1 }, { lt: 1.35, type: 'cloth' }],
};
SHOTS.C2 = {   // the family consents: nods, one raises his pick
  draw(g, lt, t, sh) {
    const lk = tw(lt);
    plate(g, t, lt, sh, { x: lerp(1300, 1330, lt / 2.14), y: 520, z: lerp(1.65, 1.75, lt / 2.14) }, m => {
      nightRoom(m, lk);
      const sit = { q1: 1.35, k1: 2.7, q2: 1.25, k2: 2.6, lean: .12, a1: .5, e1: -1.2, a2: .4, e2: -1.1 };
      const nod = d => Math.sin(seg(lk, d, d + .5) * PI) * .35;
      drawFig(m, F(1150, 760, .95, true), 'son', { ...sit, head: -.15 + nod(.2), expr: 'resolve' });
      const raise = ss(seg(lk, .9, 1.25));
      drawFig(m, F(1330, 770, .9, true), 'son', { ...sit, head: -.05 + nod(.5) - .2 * raise, a1: lerp(.5, -2.6, raise), e1: lerp(-1.2, -.2, raise), expr: raise > .5 ? 'grin' : 'resolve' }, 1e9, { prop: (g2, out) => tool(g2, 'pick', 0, 22, PI / 2 + .2, 1, 1e9) });
      drawFig(m, F(1500, 775, .85, true), 'grandson', { ...sit, head: -.1 + nod(.8), expr: 'smile' });
      lamp(m, 900, 560, lk);
    });
  },
  ev: () => [{ lt: .2, type: 'cloth', g: .5 }, { lt: 1.0, type: 'pick_raise' }],
};
// C3: dawn — the family marches out along the ridge, silhouettes against carved rays
function dawn() {
  return once('dawn', () => ({
    sky: WD.sky('dawn', [-1600, -400, PW + 3200, 1100], (x, y) => clamp(.35 + .65 * clamp((y + 100) / 720) ** 1.2), { sp: 12, seed: 61 }),
    rays: WD.sunRays('dawn', 1500, 640, { a0: PI * 1.05, a1: PI * 1.95, n: 30, r0: 140, r1: [700, 1400], w: 22 }),
    hill: WC.shape([[[-1600, 640], ...WC.spline([[-1600, 640], [-200, 610], [600, 630], [1400, 600], [2400, 625], [3400, 640]], 20), [3400, 640], [3400, 1400], [-1600, 1400]]], { tone: () => (x, y) => clamp(.5 - (y - 620) / 60), dir: 0, sp: 9, lo: .3, halo: 0, res: 4, seed: 62 }),
  }));
}
SHOTS.C3 = {
  draw(g, lt, t, sh) {
    const K = dawn(), lk = tw(lt), cx = lerp(700, 1050, lt / 2.14);
    plate(g, t, lt, sh, { x: cx, y: 420, z: 1.0 }, m => {
      ST.carve(m, K.sky); ST.carve(m, K.rays, 9, 0, 1, '#fff');
      ST.carveShape(m, K.hill);
      // the procession, right to left order: son with pick, son with pole, grandson, Yu Gong with hoe
      const x0 = 520 + lt * 160;
      const who = [['son', 230, 'pick'], ['son', 60, 'pole'], ['grandson', -100, 'basket'], ['yugong', -250, 'hoe']];
      who.forEach(([w, dx, tl], i) => {
        const p = walk(lk * 1.5 + i * .23, { lean: w === 'yugong' ? .3 : .08, a1: -2.3, e1: -.9 }, { stride: .4, arm: 0 });
        const k = w === 'yugong' ? .42 : .42;
        drawFig(m, F(x0 + dx, 628, k), w, p, 1e9, { sil: 5, front: (g2, out) => {
          const s = ap(out.shoulder, 0, 0);
          if (tl === 'pole') pole(g2, s[0], s[1] + 4, 0, k, 1e9, { fill: 0, swing: .1 * Math.sin(lk * 9 + i), span: 130 });
        }, prop: tl === 'pole' ? null : (g2, out) => tool(g2, tl === 'basket' ? 'basket' : tl, 0, 22, tl === 'basket' ? 0 : -PI / 2 - .8, 1, 1e9, { w: 60, h: 40 }) });
      });
    });
  },
  ev: () => [{ lt: 0, type: 'dawn_bed', dur: 2.1 }, ...[.1, .45, .8, 1.15, 1.5, 1.85].map(l => ({ lt: l, type: 'step', g: .5 }))],
};
// C4: insert — the first blow of the pick on the rock
function rockFace() {
  return once('rockface', () => {
    const r = mulberry(12);
    const P = [[-400, -400], [PW + 400, -400], [PW + 400, PH + 400], [-400, PH + 400]];
    const S = WC.shape([P], { tone: () => (x, y) => { const row = Math.floor(y / 140 + .4 * Math.sin(x * .006)), col = Math.floor((x + row * 97) / 260); const v = (Math.sin(row * 12.9 + col * 78.2) * 43758.5) % 1; const f = (y / 140 + .4 * Math.sin(x * .006)) % 1; return clamp((.15 + .8 * Math.abs(v)) * Math.pow(1 - f, 1.8)); }, dir: (x, y) => .08 * Math.sin(y * .01), sp: 12, wmax: 12, lo: .2, halo: 0, res: 4, seed: 71, seg: [60, 260] });
    return { S };
  });
}
SHOTS.C4 = {
  draw(g, lt, t, sh) {
    const HIT = .18, lk = lt, z = lt < HIT ? 1.0 : 1.22 + .02 * Math.exp(-(lt - HIT) * 9) * Math.sin((lt - HIT) * 60);
    plate(g, t, lt, sh, { x: 900, y: 450, z }, m => {
      ST.carveShape(m, rockFace().S);
      // cracks grow from the impact point
      const ix = 980, iy = 470;
      if (lt > HIT) { const u = eo(seg(lt, HIT, HIT + .25)); const r = mulberry(4); for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2 + r(), L = (60 + r() * 110) * u, pts = [[ix, iy]]; for (let k = 1; k <= 4; k++) pts.push([ix + Math.cos(a + (r() - .5) * .6) * L * k / 4, iy + Math.sin(a + (r() - .5) * .6) * L * k / 4]); INK.taper(m, pts, 7, '#000', { a: .05, b: .6, spline: false }); }
        INK.blob(m, ix, iy, 26 * u, 18 * u, '#fff'); }
      // sparks and chips: stab cuts flying out
      if (lt > HIT && lt < HIT + .6) { const r = mulberry(9), u = (lt - HIT); for (let i = 0; i < 26; i++) { const a = -PI * (.1 + r() * .8) - (r() < .3 ? PI * .4 : 0), v = 500 + r() * 900, x = ix + Math.cos(a) * v * u, y = iy + Math.sin(a) * v * u + 900 * u * u; INK.taper(m, [[x, y], [x - Math.cos(a) * 18, y - Math.sin(a) * 18]], 5 * (1 - u / .6), '#fff', { spline: false }); } }
      // the pick: swings in from upper left (anticipation inside the cut), strikes, recoils
      const ang = key([[0, -1.35], [HIT, -.15], [HIT + .1, -.24], [HIT + .35, -.6], [1.43, -.75]], lt, x => x);
      const hx = ix - 250 * Math.cos(ang) * 0 , pv = [ix - 520, iy - 260];
      tool(m, 'pick', ix - 600 * Math.cos(ang + .38), iy - 600 * Math.sin(ang + .38) + 60, ang + .38, 2.4, 1e9);
    });
  },
  ev: () => [{ lt: .18, type: 'pick_hit', g: 1.2 }],
};
// the dig site: the foot of Taihang, rock face at left, rubble ground
function digSite() {
  return once('dig', () => ({
    sky: WD.sky('dig', [-1200, -600, PW + 2400, 1100], (x, y) => clamp(.45 + .5 * clamp((y + 100) / 700)), { sp: 13, seed: 81 }),
    wall: WC.shape([[[-1200, 900], [-1200, -800], [380, -800], [420, -200], [360, 120], [470, 380], [430, 620], [520, 760], [560, 900]]], { light: WD.TAIHANG && WC.light(.8, -.4, .4), tone: () => (x, y) => { const row = Math.floor(y / 90 + .3 * Math.sin(x * .01)), f = (y / 90 + .3 * Math.sin(x * .01)) % 1; const v = Math.abs((Math.sin(row * 12.9 + Math.floor(x / 150) * 78.2) * 43758.5) % 1); return clamp((.15 + .8 * v) * Math.pow(1 - f, 2) * clamp(1 - (420 - x) / 700) + .6 * clamp(1 - Math.abs(x - 470) / 40)); }, dir: .05, sp: 10, lo: .25, halo: 6, res: 4, seed: 82 }),
    ground: WD.ground('dig', 760, 1600, { fall: 200, seed: 83, wave: 14 }),
    rubble: WD.flecks('rubble', 90, [450, 740, 1500, 160], [3, 9], 84, .3),
  }));
}
function digBG(m) { const K = digSite(); ST.carve(m, K.sky); ST.carveShape(m, K.ground); ST.carveShape(m, K.wall); ST.carve(m, K.rubble); }
SHOTS.C5 = {   // toil on the beat: two sons swing picks in turn, the grandson loads, Yu Gong hoes
  draw(g, lt, t, sh) {
    const lk = tw(lt), bl = sh.bl, cam = { x: lerp(860, 980, lt / 2.86), y: 480, z: 1.05 };
    plate(g, t, lt, sh, cam, m => {
      digBG(m);
      // strikes land on beats: phase .4 of swing = the strike
      const ph = (d) => ((lk + d) / (bl * 2) + .6) % 1;
      drawFig(m, F(620, 800, .95), 'son', swingPose(ph(0), { expr: 'resolve' }), 1e9, { prop: (g2) => tool(g2, 'pick', 0, 22, PI / 2 + .1, 1) });
      drawFig(m, F(860, 790, .9), 'son', swingPose(ph(bl), { expr: 'resolve' }), 1e9, { prop: (g2) => tool(g2, 'pick', 0, 22, PI / 2 + .1, 1) });
      // grandson loading a basket (bending, scooping)
      const sc = Math.sin(lk / bl * PI) ** 2;
      drawFig(m, F(1180, 800, .9, true), 'grandson', { lean: .5 + .3 * sc, a1: -.6 - .5 * sc, e1: -.5, a2: -.4 - .4 * sc, e2: -.6, head: .2, q1: .5, k1: .7, q2: .1, k2: .3, expr: 'resolve' });
      tool(m, 'basket', 1060, 770, 0, 1.1, 1e9, { w: 90, h: 60, fill: .3 + .7 * clamp(lt / 2.6) });
      // Yu Gong with the hoe, his own slower rhythm
      drawFig(m, F(1420, 800, .95), 'yugong', swingPose(((lk) / (bl * 4) + .2) % 1, { lean: .3, expr: 'resolve' }), 1e9, { prop: (g2) => tool(g2, 'hoe', 0, 22, PI / 2 + .1, 1) });
    });
  },
  ev: (sh) => { const e = []; for (let b = 0; b < 4; b++) e.push({ lt: b * sh.bl, type: 'pick_hit', g: .7, pan: b % 2 ? .3 : -.3 }); e.push({ lt: .3, type: 'earth', g: .5 }, { lt: 1.6, type: 'earth', g: .5 }, { lt: 0, type: 'hoe', g: .5 }); return e; },
};
// C6: the neighbour's boy runs in with a tiny basket and skids to a stop by the tall sons
const BOYSTOP = 2.2;
SHOTS.C6 = {
  draw(g, lt, t, sh) {
    const lk = tw(lt);
    const bx = key([[0, 1900], [BOYSTOP, 1000], [3.6, 1000]], lt, u => 1 - (1 - u) * (1 - u));
    const cam = { x: lerp(1300, 980, ss(seg(lt, 0, BOYSTOP + .3))), y: 520, z: 1.25 };
    plate(g, t, lt, sh, cam, m => {
      digBG(m);
      drawFig(m, F(760, 800, .95), 'son', { ...swingPose(.6), lean: lt > BOYSTOP + .2 ? .15 : .45, head: lt > BOYSTOP + .4 ? .55 : .1, a1: -.7, a2: -.5, expr: lt > BOYSTOP + .4 ? 'smile' : 'resolve' }, 1e9, { prop: (g2) => tool(g2, 'pick', 0, 22, PI / 2 + .1, 1) });
      // the boy: run → skid (squash) → stand on tiptoe holding up his basket
      let p;
      if (lt < BOYSTOP) p = run(lk * 3.2, { expr: 'grin', head: -.1 });
      else { const u = seg(lt, BOYSTOP, BOYSTOP + .35); p = key([[BOYSTOP, { lean: -.35, q1: -.6, k1: .1, q2: .5, k2: .6, a1: -1.2, e1: -.4, a2: .4, e2: -.4, expr: 'grin', head: .1, squash: .82 }], [BOYSTOP + .25, { lean: .05, q1: 0, k1: 0, q2: 0, k2: 0, a1: -2.6, e1: -.3, a2: .1, e2: -.3, expr: 'grin', head: -.35, squash: 1.06 }], [BOYSTOP + .5, { lean: 0, a1: -2.7, e1: -.3, a2: .1, e2: -.3, expr: 'grin', head: -.4, squash: 1, lift: 6 }]], lt); }
      drawFig(m, F(bx, 800, 1.0, true), 'boy', p, 1e9, { prop: (g2, out) => tool(g2, 'basket', 0, 30, 0, 1, 1e9, { w: 46, h: 32, fill: 0 }) });
      // skid dust: stab flecks behind his feet
      if (lt > BOYSTOP - .1 && lt < BOYSTOP + .7) { const u = seg(lt, BOYSTOP - .1, BOYSTOP + .7), r = mulberry(3); for (let i = 0; i < 16; i++) INK.blob(m, bx + 30 + r() * 160 * u, 790 - r() * 70 * u - 20 * Math.sin(u * PI), 5 * (1 - u) + 1, 3 * (1 - u) + 1, '#fff'); }
    });
  },
  ev: (sh) => [...[0, .16, .32, .48, .64, .8, .96, 1.12, 1.28, 1.44, 1.6, 1.76, 1.92, 2.08].map(l => ({ lt: l, type: 'patter', g: .4 + l * .2 })), { lt: BOYSTOP, type: 'skid' }, { lt: BOYSTOP + .5, type: 'basket_rattle' }],
};
// C7: CU — the boy's gap-toothed grin, his tiny basket held up; a big old hand drops ONE pebble in
const PEB = 1.7;
SHOTS.C7 = {
  draw(g, lt, t, sh) {
    const lk = tw(lt);
    const e = key([[0, FX.boy.grin], [PEB - .2, FX.boy.grin], [PEB + .1, { ...FX.boy.wonder, look: [.5, .6] }], [PEB + .6, { ...FX.boy.wonder, look: [.5, .6] }], [PEB + .85, FX.boy.happy]], lk);
    plate(g, t, lt, sh, { x: PW / 2, y: PH / 2, z: 1.0 }, m => {
      ST.carve(m, digSite().sky);
      const bob = Math.sin(lk * 7) * 4;
      drawFace(m, mul(T(700, 470 + bob), S(1.12)), 'boy', e);
      // his little fist and the tiny basket held up beside his face
      const bx = 1210, by = 520 - 10 * ss(seg(lk, 0, .4)) + (lk > PEB + .05 && lk < PEB + .3 ? 18 * Math.sin(seg(lk, PEB + .05, PEB + .3) * PI) : 0);
      tool(m, 'basket', bx, by, -.05, 3.2, 1e9, { w: 60, h: 42, fill: 0 });
      INK.poly(m, WC.spline([[bx - 60, by - 30], [bx - 20, by - 60], [bx + 30, by - 64], [bx + 70, by - 30], [bx + 40, by - 40], [bx - 30, by - 36]], 3, true), '#fff');   // the rope handle, carved
      // the old hand from the top with the pebble
      const hy = key([[0, -500], [1.0, -500], [1.45, -60], [PEB + .5, -60], [2.6, -500]], lk);
      m.save(); m.translate(bx + 10, hy);
      INK.poly(m, [[-90, -400], [70, -400], [80, 40], [-80, 40]], '#000');
      INK.taper(m, [[-80, 30], [80, 30]], 6, '#fff', { spline: false });
      INK.poly(m, WC.spline([[-70, 40], [60, 40], [80, 110], [50, 180], [-10, 200], [-60, 160], [-80, 100]], 3, true), '#fff');
      INK.taper(m, WC.spline([[-70, 40], [-80, 100], [-60, 160], [-10, 200], [50, 180], [80, 110], [60, 40]], 3), 6, '#000');
      for (let i = 0; i < 3; i++) INK.taper(m, [[-40 + i * 30, 120], [-36 + i * 30, 180]], 4, '#000', { spline: false });
      m.restore();
      // the pebble falls into the basket
      const py = lk < PEB ? hy + 210 : Math.min(by + 10, hy + 210 + 2400 * (lk - PEB) ** 2);
      if (lk > 1.2) { INK.blob(m, bx + 10, py, 15, 12, '#fff'); INK.taper(m, [[bx, py + 6], [bx + 18, py + 8]], 3, '#000', { spline: false }); }
    });
  },
  ev: () => [{ lt: PEB + .09, type: 'pebble', g: 1 }],
};
// C8: two-shot — Yu Gong laughs and pats the boy's head
SHOTS.C8 = {
  draw(g, lt, t, sh) {
    const lk = tw(lt);
    plate(g, t, lt, sh, { x: 900, y: 460, z: 1.45 }, m => {
      digBG(m);
      const pat = Math.max(0, Math.sin(seg(lk, .5, 1.7) * PI * 3));
      const shake = Math.sin(lk * 26) * .04 * (lk < 1.9 ? 1 : 0);
      drawFig(m, F(760, 790, .95), 'yugong', { lean: .38 + shake, head: -.1 + shake, a1: lerp(-1.25, -1.05, pat), e1: lerp(-.5, -.95, pat), a2: .2, e2: -.6, expr: 'laugh', beard: shake * 2 }, 1e9, { farProp: (g2) => tool(g2, 'hoe', 0, 22, PI / 2 - .2, 1) });
      drawFig(m, F(1010, 790 - 8 * pat, 1.0, true), 'boy', { head: -.35 + .2 * pat, expr: 'grin', a1: -.4, e1: -1.6, a2: .1, squash: 1 - .05 * pat }, 1e9, { prop: (g2) => tool(g2, 'basket', 0, 30, 0, 1, 1e9, { w: 46, h: 32, fill: .15 }) });
    });
  },
  ev: () => [{ lt: .5, type: 'pat' }, { lt: .9, type: 'pat' }, { lt: 1.3, type: 'pat' }],
};
// C9: the procession of carriers across the plain to the far sea
SHOTS.C9 = {
  draw(g, lt, t, sh) {
    const K = WD.sea(), lk = tw(lt), u = ss(lt / 2.86);
    plate(g, t, lt, sh, { x: lerp(560, 1250, u), y: 440, z: 1.0 }, m => {
      ST.carve(m, K.skyS);
      // plain (left two thirds) then the sea at right beyond a shore line
      const plain = once('plain', () => WD.ground('plain', 470, 1400, { fall: 380, seed: 91, sp: 12 }));
      m.save(); m.beginPath(); m.rect(-2000, -1000, 3300, 3000); m.clip(); ST.carveShape(m, plain); m.restore();
      m.save(); m.beginPath(); m.rect(1300, 455, 3000, 2000); m.clip(); INK.poly(m, WC.rect(1300, 455, 3000, 2000), '#000'); ST.carve(m, K.waves); m.restore();
      INK.taper(m, [[1300, 450], [1290, 500], [1310, 600], [1280, 900]], 10, '#fff');
      for (let i = 0; i < 12; i++) {
        const x = -300 + i * 150 + lt * 90, y = 472 + 4 * Math.sin(i), k = .3;
        const p = walk(lk * 1.4 + i * .37, { lean: .2 }, { stride: .35, arm: .1 });
        drawFig(m, F(x, y, k), i % 4 === 3 ? 'grandson' : i === 5 ? 'yugong' : 'son', p, 1e9, { sil: 7, front: (g2, out) => { const s = ap(out.shoulder, 0, 0); pole(g2, s[0], s[1] + 4, 0, k, 1e9, { span: 120, fill: .9, swing: .08 * Math.sin(lk * 8 + i) }); } });
      }
    });
  },
  ev: () => [{ lt: 0, type: 'sea_bed', dur: 5.0, g: .7 }, { lt: 0, type: 'wind', dur: 2.9, g: .4 }],
};
// C10: insert — a basket tips at the shore, earth falls into the waves
SHOTS.C10 = {
  draw(g, lt, t, sh) {
    const K = WD.sea(), lk = tw(lt), tip = ss(seg(lt, .15, .55)) * 1.9, SPL = .85;
    plate(g, t, lt, sh, { x: 900, y: 600, z: 1.7 }, m => {
      ST.carve(m, K.skyS);
      INK.poly(m, WC.rect(-200, 455, 2400, 1500), '#000');
      m.save(); m.translate(0, (lk * 40) % 20); ST.carve(m, K.waves); m.restore();
      // the shore rock at left
      INK.poly(m, [[-200, 520], [560, 500], [640, 560], [620, 1300], [-200, 1300]], '#000');
      INK.taper(m, [[-200, 516], [560, 498], [640, 560], [622, 900]], 8, '#fff');
      // the basket tipping over the edge
      tool(m, 'basket', 620, 470, tip, 2.0, 1e9, { w: 90, h: 64, fill: Math.max(0, 1 - tip / 1.2) });
      // falling earth clods (black with white edges) and the splash
      if (lt > .4) { const r = mulberry(5); for (let i = 0; i < 18; i++) { const d = lt - .4 - r() * .2; if (d < 0) continue; const x = 700 + r() * 140 + d * 120, y = 520 + 900 * d * d + r() * 20; if (y > 760) continue; INK.blob(m, x, y, 8 + r() * 12, 6 + r() * 9, '#fff', r() * 3); INK.blob(m, x, y, 6 + r() * 9, 4 + r() * 7, '#000', r() * 3); } }
      if (lt > SPL) { const u = seg(lt, SPL, SPL + .9), r = mulberry(7); for (let i = 0; i < 30; i++) { const a = -PI * (.15 + r() * .7), v = 260 + r() * 300, x = 770 + Math.cos(a) * v * u, y = 760 + Math.sin(a) * v * u + 600 * u * u; INK.blob(m, x, y, 7 * (1 - u) + 2, 5 * (1 - u) + 2, '#fff'); } INK.blob(m, 770, 765, 120 * eo(u), 18 * (1 - u) + 2, '#fff'); }
    });
  },
  ev: () => [{ lt: 0, type: 'sea_bed', dur: 2.2, g: .9 }, { lt: .3, type: 'earth', g: .8 }, { lt: .85, type: 'splash', g: 1 }],
};

// ================================================================ THE SEASONS: the same plate re-cut
function seasonPlate(m, lt, season, n, sh) {
  WD.drawMountains(m, 9, 0, 1);
  WD.notch(m, n);
  const r = mulberry(season.length);
  // the diggers at the foot: tiny swinging figures in the notch
  for (let i = 0; i < 4; i++) { const p = swingPose(((tw(lt) + i * .3) / .62) % 1); drawFig(m, F(300 + i * 26 - 20, WD.GROUND + 26, .07, i % 2 === 1), i === 3 ? 'yugong' : 'son', p, 1e9, { sil: 22 }); }
  const T0 = 0, T1 = .45;
  if (season === 'spring') {
    const B = WD.blossomBranch('sp');
    m.save(); m.translate(-60, 40); ST.carveShape(m, B.main, lt, T0, T1); for (const [x, y, rr] of B.buds) { if (lt > T0 + (x + 200) / 900 * (T1 - T0)) { INK.blob(m, x, y, rr, rr * .9, '#fff'); INK.blob(m, x, y, rr * .3, rr * .3, '#000'); } } m.restore();
    for (let i = 0; i < 14; i++) { const ph = (lt * .35 + i / 14) % 1, x = 100 + i * 120 + Math.sin(lt * 2 + i) * 30 + ph * 300, y = 80 + ph * 600; INK.blob(m, x, y, 5, 3, '#fff', lt * 3 + i); }
  }
  if (season === 'summer') {
    const rays = WD.sunRays('summer', 1650, -40, { a0: PI * .45, a1: PI * 1.0, n: 26, r0: 160, r1: [700, 1300], w: 18, seed: 13 });
    ST.carve(m, rays, lt, T0, T1);
    INK.blob(m, 1650, -40, 150, 150, '#fff');
    for (let i = 0; i < 7; i++) { const y = WD.GROUND - 20 + i * 4; INK.taper(m, [[900 + i * 60, y], [1000 + i * 60, y - 4 + 4 * Math.sin(lt * 9 + i)], [1100 + i * 60, y]], 2, '#fff'); }
  }
  if (season === 'autumn') {
    for (let i = 0; i < 18; i++) { const y = 120 + i * 30, x = ((lt * 900 + i * 230) % 2400) - 300; INK.taper(m, [[x, y], [x + 220, y - 12], [x + 380, y - 6]], 4, '#fff', { a: .3, b: .5 }); }
    for (let i = 0; i < 40; i++) { const ph = (lt * .9 + i / 40) % 1, x = ph * 2000 - 100 + 60 * Math.sin(i), y = 200 + ((i * 97) % 500) + 60 * Math.sin(ph * 9 + i); INK.blob(m, x, y, 7, 3.5, '#fff', ph * 12 + i); INK.blob(m, x, y, 3, 1.4, '#000', ph * 12 + i); }
  }
  if (season === 'winter') {
    // snow caps carved on the peaks, snow on the ground, falling stab cuts
    const W = WD.mountains();
    for (const M of [W.th, W.ww]) { const [px, py] = M.peak; INK.poly(m, [[px - 160, py + 210], [px - 60, py + 120], [px, py - 2], [px + 70, py + 110], [px + 190, py + 220], [px + 120, py + 190], [px + 60, py + 230], [px, py + 180], [px - 50, py + 240], [px - 110, py + 200]], '#fff'); INK.taper(m, [[px, py + 20], [px + 4, py + 160]], 4, '#000'); }
    INK.poly(m, [[-500, WD.GROUND + 10], [PW + 500, WD.GROUND + 10], [PW + 500, WD.GROUND + 80], [-500, WD.GROUND + 90]], '#fff');
    for (let i = 0; i < 6; i++) INK.taper(m, [[i * 330 - 100, WD.GROUND + 40 + i % 2 * 12], [i * 330 + 120, WD.GROUND + 34 + i % 2 * 12]], 4, '#000');
    const fl = WD.flecks('snow', 260, [-200, -300, PW + 400, 1400], [2.5, 6], 77);
    m.save(); m.translate(Math.sin(lt) * 20, (lt * 160) % 1400 - 700); ST.carve(m, fl); m.translate(0, 1400); ST.carve(m, fl); m.restore();
  }
}
const SEASONS = { D1: ['spring', .25], D2: ['summer', .42], D3: ['autumn', .6], D4: ['winter', .78] };
for (const [id, [season, n]] of Object.entries(SEASONS)) SHOTS[id] = {
  draw(g, lt, t, sh) { plate(g, t, lt, sh, { x: PW / 2, y: PH / 2, z: 1.0 }, m => seasonPlate(m, lt, season, n, sh)); },
  ev: () => [{ lt: 0, type: 'season_hit', season }, { lt: 0, type: season + '_bed', dur: 2.6 }, { lt: .05, type: 'gouge_run', dur: .4, g: .5 }],
};
// D5: from the notch (it looks big) pull back until it is a scratch on an enormous mountain
SHOTS.D5 = {
  draw(g, lt, t, sh) {
    const u = eio(seg(lt, .4, 3.4)), z = Math.exp(lerp(Math.log(9), 0, u));
    plate(g, t, lt, sh, { x: lerp(330, PW / 2, u), y: lerp(WD.GROUND + 2, PH / 2, u), z }, m => {
      WD.drawMountains(m, 9, 0, 1);
      WD.notch(m, 1);
      for (let i = 0; i < 5; i++) { const p = swingPose(((tw(lt) + i * .3) / .62) % 1, { expr: 'resolve' }); drawFig(m, F(282 + i * 22, WD.GROUND + 26, .07, i % 2 === 1), i === 4 ? 'boy' : i === 2 ? 'yugong' : 'son', p, 1e9, z > 3 ? {} : { sil: 22 }); }
    });
  },
  ev: () => [{ lt: .4, type: 'pullback', dur: 3.0 }, { lt: 3.15, type: 'plink' }],
};
