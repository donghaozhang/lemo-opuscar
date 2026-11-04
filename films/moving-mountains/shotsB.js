// 愚公移山 · shots E1–I5: the mockery, the answer, Heaven, the giants and the knife, the open road
import * as WC from './engine/index.js';
import * as ST from './stage.js';
import * as WD from './world.js';
import * as INK from './ink.js';
import { drawFig, EXPR } from './chars.js';
import { drawFace, FX, fblend } from './faces.js';
import { tool, pole, drawBasket } from './props.js';
import { T, S, R, mul, ap } from './rig.js';
import { plate, block, captionAt, BUF, shotById } from './film.js';
import { curl, peelState } from './trans.js';
import { ss, eio, eo, ei, seg, tw, key, walk, run, swingPose, knife, PI } from './anim.js';
import { clamp, lerp, mulberry } from '/core/lib.js';

const PW = ST.PW, PH = ST.PH, RV = ST.RV, G = WD.GROUND;
const C = {}; const once = (k, f) => C[k] || (C[k] = f());
export const SHOTS = {};
const F = (x, y, k, flip = false) => mul(T(x, y), S(flip ? -k : k, k));
const hr = (x, y) => { const v = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return v - Math.floor(v); };
SHOTS._missing = { draw(g, lt, t, sh) { plate(g, t, lt, sh, {}, m => { }); } };

// ================================================================ THE MOCKERY
function riverBend() {
  return once('river', () => ({
    sky: WD.sky('river', [-600, -600, PW + 1200, 1200], (x, y) => clamp(.4 + .55 * clamp((y + 100) / 600)), { sp: 13, seed: 101 }),
    hills: WD.massif('rhill', { peak: [1250, 330], hwL: 900, hwR: 900, seed: 9, base: 560, sp: 7, wmax: 7, n: 10, halo: 4 }),
    bank: WD.ground('bank', 560, 1500, { fall: 300, seed: 102 }),
    willow: WD.willow('w1', 170, 900, 760, { seed: 4 }),
  }));
}
function river(m, lt) {
  // a white river curving through the bend with black ripple lines (re-cut on twos)
  const P = WC.spline([[-300, 640], [500, 600], [1100, 640], [1500, 610], [2200, 630], [2200, 700], [1500, 690], [1100, 720], [500, 690], [-300, 720]], 6, true);
  INK.poly(m, P, '#fff');
  const r = mulberry(3 + Math.floor(tw(lt) * 12) % 3);
  for (let i = 0; i < 26; i++) { const x = -200 + r() * 2300, y = 630 + r() * 70; INK.taper(m, [[x, y], [x + 50, y - 3], [x + 100, y]], 3, '#000'); }
}
SHOTS.E1 = {   // through the willow: the Wise Old Man of the river bend strolls in with his fan
  draw(g, lt, t, sh) {
    const K = riverBend(), lk = tw(lt);
    plate(g, t, lt, sh, { x: PW / 2, y: PH / 2, z: 1 }, m => {
      ST.carve(m, K.sky); WD.drawMassif(m, K.hills, 9, 0, 1); ST.carveShape(m, K.bank); river(m, lt);
      const x = lerp(700, 1150, ss(seg(lt, 0, 2.4)));
      const p = lt < 2.4 ? walk(lk * .9, { lean: -.06, head: -.12, a1: -1.3, e1: -1.4, expr: 'smug' }, { stride: .28, arm: .05 }) : { lean: -.08, head: -.2, a1: -1.3, e1: -1.4, expr: 'smug' };
      p.a2 = .2; p.e2 = -1.5;
      drawFig(m, F(x, 800, .78), 'zhisou', p, 1e9, { prop: (g2) => tool(g2, 'fan', 0, 20, -PI / 2 + .3 * Math.sin(lk * 6), 1, 1e9, { open: .8 }) });
      WD.drawWillow(m, K.willow, 9, lt, 1);
    });
  },
  ev: () => [{ lt: 0, type: 'river_bed', dur: 2.7 }, { lt: .3, type: 'fan', g: .5 }, { lt: 1.3, type: 'fan', g: .5 }],
};
SHOTS.E2 = {   // CU: he laughs — head back, eyes squeezed, shaking
  draw(g, lt, t, sh) {
    const lk = tw(lt);
    const e = key([[0, FX.zhisou.smug], [.35, FX.zhisou.smug], [.55, FX.zhisou.laugh], [2.73, FX.zhisou.laugh]], lk);
    const back = ss(seg(lk, .35, .6)) * .16, shake = lk > .55 ? Math.abs(Math.sin((lk - .55) * 3 / .45 * PI)) * 14 : 0;
    plate(g, t, lt, sh, { x: PW / 2, y: PH / 2, z: 1 + .03 * Math.sin(lk * 20) * (lk > .55 ? 1 : 0) }, m => {
      ST.carve(m, riverBend().sky);
      drawFace(m, mul(T(860, 520 - shake), mul(R(-back), S(.95))), 'zhisou', e);
      // the fan flutters at the edge of frame
      tool(m, 'fan', 1380, 760, -PI / 2 - .6 + .25 * Math.sin(lk * 18), 3.2, 1e9, { open: 1 });
    });
  },
  ev: () => [.6, .9, 1.2, 1.5, 1.8, 2.1].map((l, i) => ({ lt: l, type: 'laugh_tok', g: 1 - i * .1 })),
};
SHOTS.E3 = {   // insert: thin fingers pluck one blade of grass from the slope; the wind takes it
  draw(g, lt, t, sh) {
    const PL = .6, lk = lt, z = lt < PL ? 1.1 : 1.4;
    plate(g, t, lt, sh, { x: 980, y: 400, z }, m => {
      // the slope: dark earth with grass blades carved white
      INK.poly(m, [[-400, 560], [2400, 380], [2400, 1500], [-400, 1500]], '#000');
      const sl = once('slope', () => WD.sky('slope', [-400, -400, 2800, 1000], (x, y) => clamp(.12 + .3 * clamp((y + 100) / 700)), { sp: 12, seed: 111 }));
      m.save(); m.beginPath(); m.moveTo(-400, -400); m.lineTo(2400, -400); m.lineTo(2400, 380); m.lineTo(-400, 560); m.clip(); ST.carve(m, sl); m.restore();
      const r = mulberry(5);
      for (let i = 0; i < 70; i++) { const x = -300 + i * 38 + r() * 20, y = 560 - (x + 400) * .064 + 10 + r() * 30, h = 40 + r() * 50, sw = Math.sin(lt * 3 + i) * 6; INK.taper(m, [[x, y], [x + sw + 6, y - h * .6], [x + sw * 1.6 + 10, y - h]], 6, '#fff', { a: .05, b: .8 }); }
      // the one blade: rooted, then plucked, held up, then blown away
      const bx = 1000, by = 520;
      let pos, ang;
      if (lk < PL) { pos = [bx, by]; ang = -PI / 2; }
      else if (lk < 1.7) { const u = ss(seg(lk, PL, 1.2)); pos = [bx + 40 * u, by - 260 * u]; ang = -PI / 2 + .1 * u; }
      else { const u = seg(lk, 1.7, 2.73); pos = [bx + 40 + 1100 * u * u + 60 * Math.sin(u * 9), by - 260 - 380 * u + 50 * Math.sin(u * 7)]; ang = -PI / 2 + u * 7; }
      const L = 230, tipx = pos[0] + Math.cos(ang) * L, tipy = pos[1] + Math.sin(ang) * L;
      INK.taper(m, [pos, [(pos[0] + tipx) / 2 + 8, (pos[1] + tipy) / 2], [tipx, tipy]], 22, '#fff', { a: .05, b: .7 });
      INK.taper(m, [pos, [(pos[0] + tipx) / 2 + 8, (pos[1] + tipy) / 2], [tipx, tipy]], 2.4, '#000', { a: .2, b: .6 });
      // the fingers: long white thumb and forefinger pinching, black sleeve from the upper left
      if (lk < 1.75) {
        const hx = lk < PL ? lerp(700, bx - 10, ss(seg(lk, 0, PL))) : pos[0] - 10, hy = lk < PL ? lerp(200, by - 40, ss(seg(lk, 0, PL))) : pos[1] - 40;
        INK.poly(m, [[hx - 520, hy - 520], [hx - 380, hy - 640], [hx - 90, hy - 110], [hx - 170, hy - 30]], '#000');
        INK.taper(m, [[hx - 380, hy - 640], [hx - 90, hy - 110]], 6, '#fff', { spline: false });
        INK.poly(m, WC.spline([[hx - 160, hy - 60], [hx - 90, hy - 120], [hx - 30, hy - 60], [hx + 14, hy + 4], [hx - 10, hy + 22], [hx - 60, hy - 10], [hx - 120, hy - 10]], 3, true), '#fff');
        INK.taper(m, WC.spline([[hx - 160, hy - 60], [hx - 120, hy - 10], [hx - 60, hy - 10], [hx - 10, hy + 22], [hx + 14, hy + 4], [hx - 30, hy - 60], [hx - 90, hy - 120]], 3), 4, '#000');
        INK.taper(m, [[hx - 100, hy - 50], [hx - 40, hy - 30], [hx, hy + 6]], 3, '#000');
        INK.taper(m, [[hx - 64, hy - 74], [hx - 56, hy - 54]], 3, '#000');   // a knuckle crease
      }
      if (lk > 1.7) for (let i = 0; i < 8; i++) { const y = 200 + i * 60, x = ((lk - 1.7) * 1600 + i * 300) % 2200 - 200; INK.taper(m, [[x, y], [x + 200, y - 30]], 3, '#fff', { a: .3, b: .6 }); }
    });
  },
  ev: () => [{ lt: .6, type: 'pluck' }, { lt: 1.7, type: 'gust', dur: 1.0 }],
};
// E4: over the scoffer's shoulder (hat, ear, collar, back of the head) down to Yu Gong's family at the dig
function backOfHead(m, x, y, k, lt) {
  m.save(); m.translate(x, y); m.scale(k, k);
  // shoulder mass (black) with a white rim on top, the collar line, the nape (white skin), the ear, the hat from behind
  INK.poly(m, WC.spline([[-520, 500], [-500, 200], [-330, 60], [-120, 20], [80, 40], [240, 120], [380, 300], [420, 500]], 6, true), '#000');
  INK.taper(m, WC.spline([[-500, 210], [-330, 66], [-120, 26], [80, 46], [240, 126], [370, 290]], 6), 10, '#fff', { a: .2, b: .3 });
  for (let i = 0; i < 5; i++) INK.taper(m, [[-300 + i * 120, 140 + i * 10], [-320 + i * 130, 480]], 4, '#fff', { a: .3, b: .6 });
  // collar: a crossed white band
  INK.taper(m, [[-140, 40], [-40, 140], [60, 60]], 16, '#fff', { a: .1, b: .1 });
  // the neck (white skin) with a black keep-line and the hairline
  INK.poly(m, WC.spline([[-120, 40], [-120, -140], [40, -150], [60, 40]], 4, true), '#fff');
  INK.taper(m, [[-120, 30], [-120, -140]], 6, '#000', { spline: false }); INK.taper(m, [[56, 36], [40, -150]], 6, '#000', { spline: false });
  // head from behind: black hair tied up, the tall cap
  INK.poly(m, WC.spline([[-190, -110], [-200, -320], [-60, -420], [120, -380], [150, -200], [100, -100], [-40, -80]], 4, true), '#000');
  INK.taper(m, WC.spline([[-180, -140], [-190, -310], [-60, -410]], 4), 8, '#fff', { a: .2, b: .4 });
  for (let i = 0; i < 6; i++) INK.taper(m, [[-160 + i * 40, -300], [-150 + i * 42, -120]], 3, '#fff', { a: .4, b: .6 });
  INK.poly(m, [[-210, -300], [-230, -760], [160, -780], [170, -300]], '#000');
  INK.taper(m, [[-226, -720], [-210, -310]], 8, '#fff', { a: .1, b: .1, spline: false });
  INK.taper(m, [[-212, -380], [166, -390]], 8, '#fff', { spline: false });
  // the ear: white, with its inner curl in black
  INK.poly(m, WC.spline([[120, -230], [175, -260], [196, -190], [170, -110], [130, -120]], 3, true), '#fff');
  INK.taper(m, WC.spline([[134, -220], [176, -240], [186, -184], [160, -130]], 3), 6, '#000');
  INK.taper(m, [[156, -210], [166, -170], [150, -150]], 4, '#000');
  m.restore();
}
SHOTS.E4 = {
  draw(g, lt, t, sh) {
    const lk = tw(lt);
    plate(g, t, lt, sh, { x: PW / 2, y: PH / 2, z: 1 }, m => {
      // below: the dig at the mountain's foot, seen from the bank above
      const K = riverBend(); ST.carve(m, K.sky);
      const M = WD.massif('e4m', { peak: [1350, -200], hwL: 700, hwR: 900, seed: 41, base: 760, sp: 8 }); WD.drawMassif(m, M, 9, 0, 1);
      ST.carveShape(m, WD.ground('e4', 740, 1600, { fall: 260, seed: 121 }));
      INK.poly(m, [[1050, 760], [1100, 700], [1250, 690], [1330, 760]], '#fff');
      const ph = (d) => ((lk + d) / 1.36 + .6) % 1;
      drawFig(m, F(1150, 790, .42), 'son', swingPose(ph(0), { expr: 'resolve' }), 1e9, { prop: (g2) => tool(g2, 'pick', 0, 22, PI / 2, 1) });
      drawFig(m, F(1010, 790, .42), 'yugong', { lean: .2, head: -.45, expr: 'neutral', a1: .1, e1: -.8 }, 1e9, { prop: (g2) => tool(g2, 'hoe', 0, 22, -PI / 2 - .2, 1) });
      drawFig(m, F(930, 790, .42), 'boy', { head: -.5, expr: 'pout', a1: -.4, e1: -1.6 }, 1e9, { prop: (g2) => tool(g2, 'basket', 0, 30, 0, 1, 1e9, { w: 46, h: 32 }) });
      drawFig(m, F(1290, 790, .42, true), 'grandson', { lean: .45, a1: -.8, e1: -.6, head: .2 });
      // foreground: the scoffer from behind, pointing down at them with his folded fan
      const pt = ss(seg(lk, .3, .7));
      m.save(); m.translate(500, 640); m.rotate(.12 + .22 * pt); m.scale(.8, .8);
      INK.poly(m, [[0, -40], [520, -70], [530, 10], [0, 40]], '#000'); INK.taper(m, [[0, -36], [520, -66]], 6, '#fff', { spline: false });
      INK.poly(m, WC.spline([[510, -60], [570, -70], [600, -30], [570, 10], [520, 10]], 3, true), '#fff');
      tool(m, 'fan', 570, -30, .1, 1.2, 1e9, { open: 0 });
      m.restore();
      backOfHead(m, 330, 760, 1.0, lt);
    });
  },
  ev: () => [{ lt: .3, type: 'fan', g: .7 }, { lt: .1, type: 'laugh_tok', g: .4 }],
};
SHOTS.E5 = {   // CU: the boy pouts and glares, clutching his tiny basket — the only one who is angry
  draw(g, lt, t, sh) {
    const lk = tw(lt), tr = Math.sin(lk * 40) * 2 * seg(lk, 1.2, 2.7);
    const e = key([[0, { ...FX.boy.wonder, look: [.5, -.2] }], [.5, FX.boy.pout], [2.73, { ...FX.boy.pout, look: [.6, -.1] }]], lk);
    plate(g, t, lt, sh, { x: PW / 2, y: PH / 2, z: lerp(1, 1.05, lt / 2.73) }, m => {
      ST.carve(m, riverBend().sky.filter((s, i) => i % 3 === 0));
      drawFace(m, mul(T(860 + tr, 440), S(1.15)), 'boy', e);
      tool(m, 'basket', 900, 900, .05, 3.6, 1e9, { w: 60, h: 42 });
      for (const sx of [-1, 1]) INK.poly(m, WC.spline([[900 + sx * 120, 830], [900 + sx * 80, 790], [900 + sx * 30, 800], [900 + sx * 40, 870], [900 + sx * 100, 880]], 3, true), '#fff');
    });
  },
  ev: () => [{ lt: .5, type: 'huff' }],
};

// ================================================================ THE ANSWER
const F1face = (m, lt) => {
  const lk = tw(lt);
  const e = key([[0, FX.yugong.weary], [.6, FX.yugong.exhale], [1.6, FX.yugong.exhale], [2.6, FX.yugong.calm], [5.6, FX.yugong.calm]], lk);
  const breath = Math.sin(seg(lk, .5, 1.6) * PI) * 10;
  drawFace(m, mul(T(PW / 2 + 30, 400 + breath), S(1.32)), 'yugong', e);
};
function dimSky() { return once('dim', () => WD.sky('dim', [-300, -300, PW + 600, PH + 600], (x, y) => clamp(.08 + .3 * clamp((y - 200) / 700) ** 2), { sp: 15, seed: 131 })); }
SHOTS.F1 = {
  draw(g, lt, t, sh) {
    const z = lerp(1, 1.12, ss(lt / 5.56));
    plate(g, t, lt, sh, { x: PW / 2, y: PH / 2 - 40 * ss(lt / 5.56), z }, m => { ST.carve(m, dimSky()); F1face(m, lt); });
  },
  ev: () => [{ lt: .65, type: 'breath', dur: 1.2 }],
};
// the generations: a road over the hills; father, son, grandson, great-grandson… each with a basket, carved one by one
function genPlate(m, lt, T0) {
  const K = once('gen', () => ({
    sky: WD.sky('gen', [-3000, -1500, PW + 6000, 2300], (x, y) => clamp(.35 + .6 * clamp((y + 300) / 820) ** 1.5), { sp: 13, seed: 141 }),
    hills: WD.ground('gen', 520, 2600, { fall: 500, seed: 142, wave: 26 }),
    mtn: WD.massif('genm', { peak: [2000, -260], hwL: 900, hwR: 1600, seed: 33, base: 540, sp: 9 }),
  }));
  ST.carve(m, K.sky); WD.drawMassif(m, K.mtn, 9, 0, 1); ST.carveShape(m, K.hills);
  // the road: from the near foreground to the horizon, a carved white path narrowing
  const road = []; for (let i = 0; i <= 60; i++) { const u = i / 60; road.push([lerp(300, 1500, u ** .7) + 60 * Math.sin(u * 6), lerp(1000, 525, u ** .5)]); }
  for (let i = 0; i < road.length - 1; i++) { const u = i / 60, w = lerp(130, 4, u ** .6); INK.taper(m, [road[i], road[i + 1]], w, '#fff', { a: 0, b: 0, spline: false }); }
  // the line of carriers: i = 0 is Yu Gong in front; further back they get smaller, each carved in turn
  const N = 26;
  for (let i = N - 1; i >= 0; i--) {
    const u = Math.min(.985, .08 + i * .036 + i * i * .0007), j = Math.floor(u * 60), p = road[j], k = lerp(.95, .025, Math.pow(u, .55));
    const appear = T0 + i * .16;
    if (lt < appear) continue;
    const pose = walk(tw(lt) * .8 + i * .3, { lean: i === 0 ? .3 : .12 }, { stride: .3, arm: .1 });
    const who = i === 0 ? 'yugong' : i === 1 ? 'son' : i === 2 ? 'grandson' : i === 3 ? 'boy' : ['son', 'grandson', 'son', 'boy'][i % 4];
    const small = k * 1 < .22;
    drawFig(m, F(p[0] + 40, p[1], k, true), who, pose, 1e9, small ? { sil: 2.6 / k, front: (g2, out) => { const s = ap(out.shoulder, 0, 0); pole(g2, s[0], s[1], 0, -k, 1e9, { span: 120, fill: .9 }); } } : { front: (g2, out) => { const s = ap(out.shoulder, 0, 0); pole(g2, s[0], s[1] + 4, 0, k, 1e9, { span: 140, fill: .9, swing: .06 * Math.sin(lt * 4 + i) }); } });
  }
}
SHOTS.F2 = {   // the peel: from his face to the plate of generations printed over him
  draw(g, lt, t, sh) {
    const [ac, ag] = BUF[0], [bc, bg] = BUF[1], [cc, cg] = BUF[2];
    const cam = { x: 900, y: 600, z: 1.0 };
    plate(bg, t, lt, sh, cam, m => genPlate(m, lt, .7), { hard: false });
    if (lt > 1.6) { g.drawImage(bc, 0, 0); return; }
    const f1 = shotById('F1');
    plate(ag, f1.t1, 5.56, f1, { x: PW / 2, y: PH / 2 - 40, z: 1.12 }, m => { ST.carve(m, dimSky()); F1face(m, 5.56); }, { hard: false, cap: false });
    // the back of the pulled sheet: paper, the face showing through mirrored
    cg.setTransform(1, 0, 0, 1, 0, 0); cg.fillStyle = '#EFE8D8'; cg.fillRect(0, 0, 1920, 1080);
    cg.save(); cg.globalAlpha = .22; cg.globalCompositeOperation = 'multiply'; cg.translate(1920, 0); cg.scale(-1, 1); cg.drawImage(ac, 0, 0); cg.restore();
    g.drawImage(bc, 0, 0);
    const ps = peelState(seg(lt, 0, 1.6), 170);
    curl(g, ac, cc, ps.xf, ps.r);
  },
  ev: () => [{ lt: 0, type: 'peel', dur: 1.6 }],
};
SHOTS.F3 = {   // the line goes on without end: continuous pull-back as cuts spread
  draw(g, lt, t, sh) {
    const u = eio(lt / 4.44), cam = { x: lerp(900, 1050, u), y: lerp(600, 520, u), z: lerp(1.0, .52, u) };
    plate(g, t, lt, sh, cam, m => genPlate(m, lt + 5.56, .7), { hard: false });
  },
  ev: () => [{ lt: 0, type: 'pullback', dur: 4.4, g: .4 }],
};
SHOTS.F4 = {   // ECU: his eyes, calm, unblinking
  draw(g, lt, t, sh) {
    const e = { ...FX.yugong.calm, look: [-.05, -.05] };
    plate(g, t, lt, sh, { x: PW / 2 - 40, y: 330, z: lerp(2.3, 2.42, lt / 4.44) }, m => { ST.carve(m, dimSky()); drawFace(m, mul(T(PW / 2 + 30, 420), S(1.32)), 'yugong', e); });
  },
  ev: () => [],
};

// ================================================================ HEAVEN
SHOTS.G1 = {   // CU: the scoffer's smile fades; his fan stops
  draw(g, lt, t, sh) {
    const lk = tw(lt), e = key([[0, { ...FX.zhisou.smug, smile: .8 }], [.25, FX.zhisou.smug], [1.2, FX.zhisou.fading]], lk);
    plate(g, t, lt, sh, { x: PW / 2, y: PH / 2, z: 1.08 }, m => {
      ST.carve(m, riverBend().sky.filter((s, i) => i % 2 === 0));
      drawFace(m, mul(T(860, 500), S(.95)), 'zhisou', e);
      tool(m, 'fan', 1380, 760, -PI / 2 - .6 + .25 * Math.sin(Math.min(lk, .6) * 18) * (1 - seg(lk, .3, .7)), 3.2, 1e9, { open: 1 });
    });
  },
  ev: () => [{ lt: .62, type: 'tick', g: .6 }],
};
function stoneFace(m, lt) {
  // the cliff with a face in the rock: closed seams → eyes open (.5) → fright (1.8): brows up, eyes wide, mouth a cave
  const K = once('stone', () => ({ S: WC.shape([[[-400, -400], [PW + 400, -400], [PW + 400, PH + 400], [-400, PH + 400]]], { tone: () => (x, y) => { const d = Math.hypot((x - 916) / 1.3, y - 430); const row = Math.floor(y / 120 + .3 * Math.sin(x * .007)), f = (y / 120 + .3 * Math.sin(x * .007)) % 1; return clamp((.12 + .6 * hr(row, Math.floor(x / 200))) * Math.pow(1 - Math.abs(f), 2) * clamp(d / 380) + .55 * clamp(1 - d / 520) * (.5 + .5 * Math.sin(d * .05))); }, dir: (x, y) => Math.atan2(y - 430, x - 916) + PI / 2, sp: 11, wmax: 11, lo: .2, halo: 0, res: 4, seed: 151 }) }));
  ST.carveShape(m, K.S);
  const open = ss(seg(lt, .5, .9)), fright = ss(seg(lt, 1.8, 2.0));
  for (const s of [-1, 1]) {
    const ex = 916 + s * 190, ey = 380 - fright * 20, w = 150 + fright * 30, h = 8 + open * 40 + fright * 34;
    INK.poly(m, WC.spline([[ex - w / 2, ey], [ex, ey - h], [ex + w / 2, ey], [ex, ey + h * .8]], 3, true), open > .05 ? '#fff' : '#000');
    INK.taper(m, [[ex - w / 2 - 10, ey], [ex, ey - h - 6], [ex + w / 2 + 10, ey]], 12, '#000');
    if (open > .05) { const pr = (26 - fright * 10) * open; INK.blob(m, ex + s * -8 * (1 - fright), ey + 2, pr, pr, '#000'); INK.blob(m, ex + s * -8 * (1 - fright) + 6, ey - 6, pr * .25, pr * .25, '#fff'); }
    // stone brow: a heavy ledge rising in fright
    INK.poly(m, [[ex - w * .7, ey - h - 40 - fright * 50 + s * 10 * (1 - fright)], [ex + w * .7, ey - h - 40 - fright * 50 - s * 10 * (1 - fright)], [ex + w * .6, ey - h - 18 - fright * 46], [ex - w * .6, ey - h - 18 - fright * 46]], '#000');
    INK.taper(m, [[ex - w * .7, ey - h - 42 - fright * 50], [ex + w * .7, ey - h - 42 - fright * 50]], 6, '#fff', { spline: false });
  }
  // the mouth: a seam that opens into a black cave in fright
  const mh = 10 + fright * 90;
  INK.poly(m, WC.spline([[760, 680], [916, 670 - fright * 20], [1072, 680], [916, 680 + mh]], 3, true), '#000');
  INK.taper(m, [[750, 670], [916, 660 - fright * 22], [1082, 670]], 6, '#fff');
  // two stone snakes held at the sides, recoiling
  for (const s of [-1, 1]) {
    const base = [916 + s * 620, 900], rec = fright * 1;
    const pts = []; for (let i = 0; i <= 30; i++) { const u = i / 30; pts.push([base[0] + s * Math.sin(u * 7 + lt * 2) * 40 * (1 - u) - s * rec * 120 * u * u, base[1] - u * 520 - rec * 60 * u]); }
    INK.taper(m, pts, 46, '#000', { a: .02, b: .3 });
    INK.taper(m, pts, 36, '#fff', { a: .02, b: .3 });
    for (let i = 2; i < 30; i += 3) INK.taper(m, [[pts[i][0] - 18, pts[i][1]], [pts[i][0] + 18, pts[i][1] - 6]], 5, '#000', { spline: false });
    const h = pts[30]; INK.blob(m, h[0], h[1] - 6, 30, 22, '#000'); INK.blob(m, h[0] - s * 8, h[1] - 12, 6, 6, '#fff');
    INK.taper(m, [[h[0], h[1] - 20], [h[0] + s * 6, h[1] - 52], [h[0] + s * 16, h[1] - 62]], 3, '#fff');
  }
}
SHOTS.G2 = {
  draw(g, lt, t, sh) {
    const z = lt < 1.8 ? 1.0 : 1.18;
    plate(g, t, lt, sh, { x: PW / 2, y: PH / 2 - (lt > 1.8 ? 30 : 0), z }, m => stoneFace(m, tw(lt)));
  },
  ev: () => [{ lt: .5, type: 'stone_grind', dur: .5 }, { lt: 1.8, type: 'fright', g: 1 }, { lt: 0, type: 'tremolo', dur: 3.3 }],
};
SHOTS.G3 = {   // crane up into the clouds: Heaven's light carved from above
  draw(g, lt, t, sh) {
    const K = once('heaven', () => ({
      sky: WD.sky('heaven', [-1200, -2400, PW + 2400, 3600], (x, y) => clamp(.25 + .35 * clamp(1 - Math.hypot(x - 916, y + 900) / 1800)), { sp: 13, seed: 161 }),
      clouds: [[400, 520, 210], [1450, 420, 240], [900, 120, 260], [250, -200, 200], [1500, -260, 220], [900, -620, 300]].map(([x, y, s], i) => WD.cloud('h' + i, x, y, s, { seed: 20 + i })),
      rays: WD.sunRays('heaven', 916, -900, { a0: PI * .2, a1: PI * .8, n: 34, r0: 200, r1: [1600, 2300], w: 30, seed: 17 }),
    }));
    const u = eio(lt / 3.33), cam = { x: PW / 2, y: lerp(560, -380, u), z: lerp(1.0, .9, u) };
    plate(g, t, lt, sh, cam, m => {
      ST.carve(m, K.sky);
      ST.carve(m, K.rays, lt, .8, 2.6, '#fff');
      for (const c of K.clouds) WD.drawCloud(m, c, 9, 0, 1);
    });
  },
  ev: () => [{ lt: .8, type: 'heaven_swell', dur: 2.5 }, { lt: 2.4, type: 'rumble_in', dur: 1.0 }],
};
SHOTS.G4 = { draw(g, lt, t, sh) { plate(g, t, lt, sh, {}, m => { }, { hard: false }); }, ev: () => [] };

// ================================================================ THE GIANTS AND THE KNIFE
function giant(m, x, base, k, rise, flip, lt) {
  // a colossal bent figure: back and shoulders under the peak, head bowed, one arm braced; rim-lit from the sky
  m.save(); m.translate(x, base - rise); m.scale(flip ? -k : k, k);
  const body = WC.spline([[-300, 400], [-320, 0], [-260, -260], [-120, -420], [80, -470], [260, -400], [340, -240], [330, 60], [300, 400]], 6, true);
  INK.poly(m, body, '#000');
  INK.taper(m, WC.spline([[-320, 0], [-260, -260], [-120, -420], [80, -470], [260, -400], [340, -240]], 6), 16, '#fff', { a: .2, b: .2 });
  for (let i = 0; i < 9; i++) INK.taper(m, [[-200 + i * 50, -380 + Math.abs(i - 4) * 18], [-230 + i * 54, -160 + Math.abs(i - 4) * 10]], 6, '#fff', { a: .2, b: .7 });
  // bowed head in front, low
  INK.blob(m, 330, -250, 90, 100, '#000'); INK.taper(m, [[300, -340], [380, -320], [420, -240]], 10, '#fff');
  INK.blob(m, 380, -230, 14, 8, '#fff'); INK.taper(m, [[360, -262], [400, -258]], 6, '#fff');
  // arm reaching up to hold the mountain's flank
  INK.taper(m, [[-200, -300], [-380, -520], [-420, -700]], 110, '#000', { a: .05, b: .05 });
  INK.taper(m, [[-200, -330], [-372, -540], [-400, -700]], 10, '#fff');
  m.restore();
}
SHOTS.H1 = {
  draw(g, lt, t, sh) {
    const rise = eo(seg(lt, .05, 1.8)), lift = ss(seg(lt, 1.5, 2.5)) * 30;
    const shk = lt < .6 ? Math.sin(lt * 80) * 6 * (1 - lt / .6) : 0;
    plate(g, t, lt, sh, { x: PW / 2 + shk, y: PH / 2 - 20, z: lerp(1.0, 1.06, lt / 2.5) }, m => {
      const W = WD.mountains();
      ST.carve(m, W.sky);
      // giants behind the mountains, rising
      giant(m, 360, 1350, 1.15, rise * 900, false, lt);
      giant(m, 1520, 1350, 1.15, rise * 860, true, lt);
      m.save(); m.translate(0, -lift);
      WD.drawMassif(m, W.far, 9, 0, 1); WD.drawMassif(m, W.ww, 9, 0, 1); WD.drawMassif(m, W.th, 9, 0, 1);
      m.restore();
      ST.carveShape(m, W.ground); WD.notch(m, 1);
    });
  },
  ev: () => [{ lt: 0, type: 'BOOM', g: 1 }, { lt: .8, type: 'giant_step', g: .8 }, { lt: 1.6, type: 'giant_step', g: .9 }, { lt: 1.5, type: 'rumble', dur: 1.0 }],
};
// H2: the block itself — the giants carry the peaks away and the knife clears what is left, sweep by sweep
function sweeps() {
  return once('sweeps', () => {
    const r = mulberry(21), S = [];
    const order = [[420, -40, 980, 760], [180, 160, 820, 760], [700, 40, 140, 760], [1500, 60, 960, 760], [1160, 140, 1800, 760], [1300, -80, 860, 700], [80, 420, 1700, 720], [-80, 300, 900, 640]];
    order.forEach(([x0, y0, x1, y1], i) => {
      for (let j = -6; j <= 6; j++) { const ox = j * 34 + (r() - .5) * 10, oy = j * 15; const pts = WC.resample([[x0 + ox, y0 + oy], [(x0 + x1) / 2 + ox + (r() - .5) * 80, (y0 + y1) / 2 + oy], [x1 + ox, y1 + oy]], 6); S.push({ i, st: WC.mkStroke(pts, pts.map((_, k) => (30 + 6 * Math.sin(k * .7 + j)) * Math.sin(PI * Math.min(.98, (k + 1) / pts.length)) ** .3), { kind: 'u', seed: i * 10 + j + 4, chip: .22 }) }); }
    });
    return S;
  });
}
const H2B = .833;   // one beat at 72 bpm
SHOTS.H2 = {
  draw(g, lt, t, sh) {
    const cam = { x: PW / 2, y: PH / 2 - 20, z: lerp(1.08, .98, ss(lt / 6.67)) };
    const W = WD.mountains(), go = ss(seg(lt, .4, 4.6));
    const SW = sweeps(), tips = [];
    block(g, cam, m => {
      ST.carve(m, W.sky);
      // the giants stride outward carrying the summits on their backs
      for (const [s, M] of [[-1, W.th], [1, W.ww]]) {
        m.save(); m.translate(s * go * 1400, -go * 260 + Math.abs(Math.sin(go * 9)) * 20);
        giant(m, s < 0 ? 360 : 1520, 1350 - 860, 1.15, 0, s > 0, lt);
        WD.drawMassif(m, M, 9, 0, 1);
        m.restore();
      }
      WD.drawMassif(m, W.far, 9, 0, 1);
      ST.carveShape(m, W.ground);
      // the knife: one great sweep per beat, clearing the rock down to pale wood
      m.fillStyle = '#fff';
      for (const { i, st } of SW) { const t0 = .5 + i * H2B * .7 + (st.seed % 13) * .012, pr = clamp((lt - t0) / .32); if (pr <= 0) continue; m.beginPath(); const L = WC.strokePath(m, st, pr < 1 ? pr * (.55 + .45 * pr) : 1); m.fill(); if (pr < 1 && L > 0) tips.push({ x: st.p[Math.min(st.p.length - 2, Math.floor(st.p.length / 2 * pr) * 2)], y: st.p[Math.min(st.p.length - 1, Math.floor(st.p.length / 2 * pr) * 2 + 1)] }); }
      // light floods from the gap: carved rays from the far horizon
      ST.carve(m, WD.sunRays('flood', 916, 700, { a0: PI, a1: 2 * PI, n: 40, r0: 60, r1: [900, 1500], w: 26, seed: 31 }), lt, 4.4, 6.2);
    }, { mirror: true, sheen: .18 });
    if (tips.length) { const tp = tips[tips.length - 1], k = ST.camMatrix(cam, true), sx = ST.PW - tp.x; knife(g, k[0] * sx + k[4], k[3] * tp.y + k[5], -2.2, 2.4); }
  },
  ev: () => { const e = [{ lt: 0, type: 'rock_tear', dur: 4.6, g: .8 }]; for (let i = 0; i < 8; i++) e.push({ lt: .5 + i * H2B * .7, type: 'gouge', g: 1 - i * .05 }); e.push({ lt: 4.4, type: 'light_swell', dur: 2.2 }); return e; },
};
// H3 / I3: the open road south and the sunrise — the first red of the film
function roadPlate() {
  return once('road', () => ({
    sky: WD.sky('road', [-2400, -1600, PW + 4800, 2400], (x, y) => clamp(.3 + .7 * clamp((y + 200) / 760) ** 1.3 + .4 * Math.exp(-((x - 1300) ** 2 + (y - 560) ** 2) / 2e5)), { sp: 12, seed: 171 }),
    rays: WD.sunRays('road', 1300, 560, { a0: PI * 1.0, a1: PI * 2.0, n: 46, r0: 150, r1: [900, 1700], w: 20, seed: 19 }),
    sun: WD.sunDisc('road', 1300, 560, 120),
    land: WD.ground('road', 580, 2400, { fall: 330, seed: 172 }),
  }));
}
function drawRoad(m, c, lt, red) {
  const K = roadPlate();
  ST.carve(m, K.sky); ST.carve(m, K.rays, lt, .2, 1.4);
  ST.carveShape(m, K.sun, lt, 0, .5, { white: false });
  INK.blob(m, 1300, 560, 120, 120, '#fff');
  ST.carveShape(m, K.land);
  // the horizon line cutting the sun in half: it is rising
  INK.poly(m, [[-2400, 582], [4400, 582], [4400, 3000], [-2400, 3000]], '#000');
  ST.carveShape(m, K.land);
  // the road: from the bottom left to the sun, a white band with black ruts
  INK.poly(m, [[-600, 1200], [400, 1200], [1302, 584], [1296, 584]], '#fff');
  for (const f of [.3, .5, .72]) INK.taper(m, [[lerp(-600, 400, f), 1200], [1299, 586]], 5, '#000', { a: .05, b: .9, spline: false });
  // the colour plate: the sun disc and its rays, glowing out of the cuts
  if (red > 0) {
    WC.plate(c, [WC.ellipse(1300, 560, 132, 132, 48)], red);
    for (let k = 1; k <= 6; k++) { c.save(); c.globalAlpha = .16 * red; c.beginPath(); c.arc(1300, 560, 140 + k * 90 * red, PI, 2 * PI); c.lineTo(1300, 560); c.fillStyle = '#000'; c.fill(); c.restore(); }
    c.save(); c.globalAlpha = .4 * red; c.beginPath(); c.moveTo(-600, 1200); c.lineTo(400, 1200); c.lineTo(1302, 584); c.lineTo(1296, 584); c.fillStyle = '#000'; c.fill(); c.restore();
  }
}
SHOTS.H3 = {
  draw(g, lt, t, sh) {
    const u = eio(lt / 4.17), red = ss(seg(lt, .25, 1.6));
    plate(g, t, lt, sh, { x: lerp(1100, 1000, u), y: lerp(260, 560, u), z: lerp(1.25, 1.0, u) }, (m, c) => {
      drawRoad(m, c, lt, red);
      // the family in silhouette at the roadside, watching (small, bottom left)
      for (const [w, x, k] of [['yugong', 260, .5], ['son', 360, .5], ['grandson', 450, .5]]) drawFig(m, F(x, 1020, k), w, { lean: w === 'yugong' ? .2 : 0, head: -.1, expr: 'smile' }, 1e9, { sil: 6 });
    });
  },
  ev: () => [{ lt: 0, type: 'red_dawn', g: 1 }, { lt: .25, type: 'swell_bright', dur: 3.9 }],
};

// ================================================================ FINALE
SHOTS.I1 = {   // CU: the scoffer speechless — jaw dropped, eyes wide, the fan slipping away
  draw(g, lt, t, sh) {
    const lk = tw(lt), e = key([[0, FX.zhisou.fading], [.2, FX.zhisou.speechless]], lk, eo);
    plate(g, t, lt, sh, { x: PW / 2, y: PH / 2, z: lt < .2 ? 1.0 : 1.14 }, (m, c) => {
      const K = roadPlate(); ST.carve(m, K.sky);
      drawFace(m, mul(T(860, 500), S(.95)), 'zhisou', e);
      const fy = 760 + 900 * ss(seg(lk, .7, 1.6)) ** 2, fa = -PI / 2 - .6 + seg(lk, .7, 1.6) * 3;
      tool(m, 'fan', 1380, fy, fa, 3.2, 1e9, { open: 1 - seg(lk, .7, 1.2) });
      // the red sunrise behind him, a thin glow on the carved sky
      { const gr = c.createRadialGradient(1900, 40, 40, 1900, 40, 760); gr.addColorStop(0, 'rgba(0,0,0,.75)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(900, -300, 1400, 1300); }
    });
  },
  ev: () => [{ lt: .2, type: 'bonk', g: 1 }, { lt: 1.2, type: 'fan_drop' }],
};
SHOTS.I2 = {   // CU: Yu Gong at peace, eyes closed, a red rim on his beard
  draw(g, lt, t, sh) {
    const lk = tw(lt), e = key([[0, FX.yugong.calm], [.5, FX.yugong.serene]], lk);
    plate(g, t, lt, sh, { x: PW / 2, y: PH / 2, z: lerp(1.02, 1.0, lt / 2.2) }, (m, c) => {
      ST.carve(m, roadPlate().sky);
      drawFace(m, mul(T(PW / 2 + 30, 400), S(1.15)), 'yugong', e);
      { const gr = c.createRadialGradient(1950, 200, 60, 1950, 200, 900); gr.addColorStop(0, 'rgba(0,0,0,.8)'); gr.addColorStop(.6, 'rgba(0,0,0,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(800, -300, 1500, 1500); }
    });
  },
  ev: () => [],
};
SHOTS.I3 = {   // the boy runs down the new road toward the sun, his tiny basket bouncing with its one pebble
  draw(g, lt, t, sh) {
    const lk = tw(lt);
    const u = seg(lt, 0, 5.56), along = eo(u);
    const p0 = [80, 1150], p1 = [1290, 600];
    const pos = [lerp(p0[0], p1[0], along ** 1.4), lerp(p0[1], p1[1], along ** 1.4)], k = lerp(1.1, .05, along ** 1.1);
    const cam = { x: lerp(500, 1100, ss(u * 1.3)), y: lerp(820, 560, ss(u * 1.2)), z: lerp(1.45, 1.0, ss(u)) };
    plate(g, t, lt, sh, cam, (m, c) => {
      drawRoad(m, c, 9, 1);
      const pose = run(lk * 2.6, { expr: 'happy', head: -.15 });
      drawFig(m, F(pos[0], pos[1], k), 'boy', pose, 1e9, k < .3 ? { sil: 3 / k } : { prop: (g2, out) => { tool(g2, 'basket', 0, 30, Math.sin(lk * 16) * .3, 1, 1e9, { w: 46, h: 32 }); const b = Math.abs(Math.sin(lk * 16)) * 14; INK.blob(g2, 0, 22 - b, 7, 6, '#fff'); } });
    });
  },
  ev: () => [...Array.from({ length: 18 }, (_, i) => ({ lt: i * .19, type: 'patter', g: .7 - i * .035 })), { lt: 0, type: 'basket_rattle' }],
};
SHOTS.I4 = {   // the map again: no mountains; the knife cuts the straight road from the house to the market
  draw(g, lt, t, sh) {
    const K = WD.mapPlate(), u = seg(lt, .25, 2.6), D = K.straight, n = D.length;
    const i = Math.min(n - 1, Math.floor(eio(u) * (n - 1))), tip = D[i];
    const cam = { x: lerp(tip[0], PW / 2, ss(seg(lt, 2.4, 3.8))), y: lerp(tip[1], PH / 2, ss(seg(lt, 2.4, 3.8))), z: lerp(1.6, 1.0, ss(seg(lt, 2.2, 3.8))) };
    plate(g, t, lt, sh, cam, (m, c) => {
      ST.carve(m, K.field); ST.carve(m, K.river);
      // where the mountains were: two flat scars of fresh-cut wood with long level cuts
      for (const [x, y] of [[560, 400], [1180, 430]]) for (let j = 0; j < 5; j++) INK.taper(m, [[x - 260, y - 40 + j * 22], [x + 260, y - 40 + j * 22]], 5, '#fff', { a: .1, b: .1, spline: false });
      WD.house(m, ...WD.MAP.house, 1.1, true);
      for (const [dx, dy, s] of [[0, 0, 1], [70, 18, .8], [-66, 26, .85], [20, 50, .9], [110, -10, .7]]) WD.house(m, WD.MAP.market[0] + dx, WD.MAP.market[1] + dy, s, true);
      if (i > 1) INK.taper(m, D.slice(0, i + 1), 12, '#fff', { a: .01, b: .02, spline: false });
      // the old detour, faint, left behind
      for (let k2 = 0; k2 < K.detour.length; k2 += 18) INK.blob(m, K.detour[k2][0], K.detour[k2][1], 3, 3, '#fff');
      // the red sun in the east corner
      INK.blob(m, 1600, 110, 60, 60, '#fff'); WC.plate(c, [WC.ellipse(1600, 110, 66, 66, 32)], 1);
      for (let a = 0; a < 12; a++) { const aa = a / 12 * PI * 2; INK.taper(m, [[1600 + Math.cos(aa) * 80, 110 + Math.sin(aa) * 80], [1600 + Math.cos(aa) * 120, 110 + Math.sin(aa) * 120]], 8, '#fff', { spline: false }); }
      if (u > 0 && u < 1) for (let k2 = 0; k2 < 3; k2++) WC.chip(m, { x: tip[0] + k2 * 6, y: tip[1] - k2 * 4, a: 1.2 + k2, w: 6 }, 1.4);
    });
  },
  ev: () => [{ lt: .25, type: 'carve_line', dur: 2.35, g: 1 }],
};
// I5: the end plate — 完 carved white out of a black panel, the red sun above it, a last fresh print
function endCuts() {
  return once('end', () => {
    const reg = new WC.Region(q => { q.font = '900 230px "Noto Serif SC"'; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('完', PW / 2, 500); }, { res: 1, bbox: [PW / 2 - 200, 300, PW / 2 + 200, 700] });
    return WC.hatch(reg, { dir: WC.dirAngle(PI / 2 - .35), tone: () => 1, sp: 4.2, wmax: 5.4, seed: 7, seg: [14, 50], gap: [0, 1], reveal: RV((x, y) => clamp((y - 330) / 360), 900, .05) });
  });
}
SHOTS.I5 = {
  draw(g, lt, t, sh) {
    plate(g, t, lt, sh, { x: PW / 2, y: PH / 2, z: 1 }, (m, c) => {
      ST.carve(m, endCuts(), lt, .15, 1.2);
      const a = ss(seg(lt, 1.3, 2.2));
      if (a > 0) { INK.blob(m, PW / 2, 210, 44 * a, 44 * a, '#fff'); WC.plate(c, [WC.ellipse(PW / 2, 210, 50 * a, 50 * a, 32)], 1); }
    });
  },
  texts: lt => lt > 1.2 ? [{ id: 'end', text: '完', x0: 820, y0: 330, x1: 1100, y1: 720 }] : [],
  ev: () => [{ lt: .15, type: 'carve', dur: 1.05, g: 1 }, { lt: 1.3, type: 'ding', g: .8 }],
};
