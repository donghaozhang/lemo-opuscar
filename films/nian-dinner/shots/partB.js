// Part B: 30.5–67 s. The lonely Nian on the mountain → the steam → downhill → the bowl at the gate → the creep and the sneeze → firecrackers and the dive → eyes in the snow → the offer and the gulp → two faces
import * as X from './common.js';
const { PAL, canvas, fillPaper, paperShadow, noShadow, piece, fill, cut, trace, Pl, P, ellipsePoly, curve, put, mul, T, S, R, ap, beginLight, pool, lightRect, applyLight, bloom, E,
  drawGirl, walkPose, drawNian, NPOSE, NJ, runPose, drawFolk, kit, HOUSES, HERO, GATE, GROUND, NIGHT, kitchenKit, foldedSheet, W, H, cam, st, E_, pt, mixPose, shake, pop, drawVillage, drawMountain, roadAt, burst, flash, crackerBurst, spray, steamTrail, mountainKit,
  TT, tb, clamp, lerp, seg, ss, eio, eo, ei, back, hash, track, spring } = X;
export const EV = [];
export const SHOTS = {};
const ev = (t, type, extra = {}) => EV.push({ t, type, ...extra });

// the Nian on the mountain: sits hunched on the near ridge at road u ≈ .78 (the top of the road); its breath moves the head and body a little
function nianSit(t, extra = {}) {
  const b = Math.sin(st(t) * 1.4) * .012;
  return { ...NPOSE.sit, lean: .1 + b, head: .12 + b * 2, eye: 'lonely', tail: .55, ...extra };
}
const NIAN_SPOT = { x: 1720, y: 760 };   // world position on the near ridge
function drawNianOnRidge(gg, C, t, pose, sc = 1.0, dx = 0, dy = 0) {
  return drawNian(gg, mul(C, mul(T(NIAN_SPOT.x + dx, NIAN_SPOT.y + dy), mul(S(sc), T(0, -NJ.ground)))), pose, { shadow: 1.6 });
}
// ---------- the wide: low, the Nian small and alone at the top of the ridge; slight push ----------
export function shotMountainWide(g, t) {
  const z = .5 + .06 * seg(t, TT.nianReveal, TT.nianCU), C = cam(1500 + 80 * seg(t, TT.nianReveal, TT.nianCU), 560, z);
  drawMountain(g, C, t, { amb: 'rgb(150,150,200)', bloom: .3, midLayer: gg => drawNianOnRidge(gg, C, t, nianSit(t), .62, 0, 20) });
}
ev(TT.nianReveal, 'windbed', { dur: 14, gain: 1.4 }); ev(TT.nianReveal, 'drum');

// ---------- the close-up: lonely face; a snowflake lands on the nose ----------
export function shotNianCU(g, t) {
  const C = cam(1760, 300, 1.15);
  const flake = t > TT.flake - 1.2;
  drawMountain(g, C, t, { amb: 'rgb(160,160,206)', bloom: .3, snow: false, midLayer: gg => {
    const r = drawNianOnRidge(gg, C, t, nianSit(t, { eye: t > TT.flake + .15 ? 'lookup' : 'lonely' }), 1.0, 0, 20);
    // the snowflake: drifts down to the nose, lands at flake, sits there
    if (flake) {
      const u = seg(t, TT.flake - 1.2, TT.flake), n = r.joints.nose;
      const fx = n[0] + (1 - u) * 90 + Math.sin(u * 12) * 18 * (1 - u), fy = n[1] - 18 - (1 - u) * 260;
      gg.save(); gg.setTransform(1, 0, 0, 1, fx, fy); gg.fillStyle = '#f4f4fb'; gg.shadowColor = 'rgba(0,0,0,.3)'; gg.shadowBlur = 3; gg.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28; gg.moveTo(0, 0); gg.lineTo(Math.cos(a) * 12, Math.sin(a) * 12); } gg.lineWidth = 3.5; gg.strokeStyle = '#f4f4fb'; gg.stroke(); gg.restore();
    }
  } });
  // breath: a small cream cloud from the snout, every 3 s
  const ph = ((t - 35.2) % 3 + 3) % 3;
  if (ph < 1.4) { const u = ph / 1.4; g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = (1 - u) * .5; g.fillStyle = '#e9e4f2'; g.beginPath(); g.arc(560 - 80 * u, 430 - 60 * u, 18 + 40 * u, 0, 7); g.fill(); g.restore(); }
  drawSnowfall(g, t, C, 1, {}); drawSnowfall(g, t, C, 2, {});
}
import { drawSnowfall } from '../sets/village.js';
ev(35.2, 'breath'); ev(38.2, 'breath'); ev(TT.flake, 'tick');

// ---------- the steam: pan up from the village roofs to the nose; sniff; rumble ----------
export function shotSteam(g, t) {
  const u = eio(seg(t, TT.steam - .5, TT.steam + 1.6));
  const C = cam(lerp(1400, 1720, u), lerp(1040, 420, u), lerp(.75, 1.05, u));
  const sniff = t >= TT.sniff, rumble = t >= TT.rumble;
  const dy = rumble ? shake(t, [TT.rumble, TT.rumble + .35], 7, 40) : 0;
  drawMountain(g, cam(C[4] === 0 ? 0 : (960 - C[4]) / C[0], (540 - C[5]) / C[0] + dy / C[0], C[0]), t, { amb: 'rgb(160,160,206)', bloom: .35,
    midLayer: gg => {
      // the village roofs far below (a few small houses at the foot of the ridge) with a chimney steaming
      const V = kit(); for (let k = 0; k < 3; k++) { const hp = V.houses[k]; put(gg, hp, mul(C, mul(T(1220 + k * 150, 1150), S(.42))), { shadow: .6 }); put(gg, hp.snowCap, mul(C, mul(T(1220 + k * 150, 1150), S(.42))), { shadow: .3 }); }
      // the steam trail: a cut-cloud ribbon from the chimney up to the Nian's nose
      const prog = seg(t, TT.steam - .4, TT.sniff);
      const pose = nianSit(t, { eye: rumble ? 'curious' : sniff ? 'sniff' : 'lookup', head: sniff ? .22 + .04 * Math.sin(st(t) * 30) : .1 });
      if (rumble && t < TT.rumble + .5) pose.lean = .1 + .05 * Math.sin((t - TT.rumble) * 40);
      const r = drawNianOnRidge(gg, C, t, pose, 1.0, 0, 20);
      const n = r.joints.nose, nx = (n[0] - C[4]) / C[0], ny = (n[1] - C[5]) / C[0];
      steamTrail(gg, C, [[1300, 1030], [1340, 920], [1300, 820], [1380, 700], [1440, 600], [1420, 500], [nx - 60, ny + 70], [nx - 20, ny + 20], [nx + 10, ny - 10]], prog, '#f3eef8', 38);
    } });
}
ev(TT.sniff, 'sniff'); ev(TT.sniff + .5, 'sniff'); ev(TT.rumble, 'rumble');

// ---------- downhill: it turns and lumbers down the road, the ridge shaking ----------
export function shotDownhill(g, t) {
  const u = seg(t, TT.downhill, TT.downhill + 2.0), steps = [TT.downhill + .3, TT.downhill + .8, TT.downhill + 1.3, TT.downhill + 1.8];
  const dy = shake(t, steps, 8, 50);
  const nx = NIAN_SPOT.x - 520 * eio(u), ny = NIAN_SPOT.y + 20 + 70 * eio(u);
  const C = cam(nx + 120, ny - 260 + dy, .8);
  drawMountain(g, C, t, { amb: 'rgb(150,150,200)', bloom: .3, midLayer: gg => {
    const ph = st(t) * 6.5, p = u < .12 ? mixPose(nianSit(t), NPOSE.crouch, u / .12) : { ...NPOSE.crouch, ...runPose(ph, .6), eye: 'determined', lean: -.2, bob: Math.abs(Math.cos(ph)) * 10 };
    drawNian(gg, mul(C, mul(T(nx, ny), mul(S(1.0), T(0, -NJ.ground)))), p, { shadow: 1.6 });
  } });
}
[.3, .8, 1.3, 1.8].forEach(d => ev(TT.downhill + d, 'thud'));

// ---------- the gate at night: 小雪 brings a bowl out, sets it down, looks down the empty road ----------
const NIGHTI = (i, t) => (i === HERO.i ? 1 : .8);
export function shotGateBowl(g, t) {
  const K = kitchenKit(), C = cam(GATE.x - 160, 700, 1.15);
  const walkIn = seg(t, TT.bowlDown - .5, TT.bowlDown - .05), down = E_(st(t), TT.bowlDown - .2, TT.bowlDown + .05), up = E_(st(t), TT.bowlDown + .3, TT.bowlDown + .7);
  const look = E_(st(t), TT.lookRoad, TT.lookRoad + .4);
  drawVillage(g, C, t, { mode: 'night', winI: NIGHTI, flowers: () => 1, bloom: .5,
    front: gg => {
      const gx = GATE.x - 330 + 90 * (1 - walkIn), bowlOn = t >= TT.bowlDown;
      const ph = st(t) * 8;
      const pose = walkIn < 1 ? walkPose(ph, .55, { expr: 'neutral', shF: -1.4, elF: -.3, shB: -1.3, elB: -.35, handF: 'open', handB: 'open' })
        : { expr: look > 0 ? 'sad' : 'lookdown', lean: lerp(.0, .45, down) * (1 - up), hipF: lerp(-.06, -.9, down * (1 - up)), knF: lerp(0, 1.0, down * (1 - up)), hipB: lerp(.06, -.5, down * (1 - up)), knB: lerp(0, .8, down * (1 - up)), shF: lerp(-1.4, -1.0, down) * (1 - up) + -.4 * up, elF: lerp(-.3, -.2, down) * (1 - up) + -.6 * up, shB: lerp(-1.3, -1.0, down) * (1 - up) + -.3 * up, elB: -.35 * (1 - up) - .5 * up, handF: 'open', handB: 'open', head: lerp(.1, .25, down) * (1 - up) + lerp(0, -.35, look) * up, flip: look > .5 };
      drawGirl(gg, mul(C, T(gx, GROUND + 60)), { ...pose, ground: walkIn >= 1, prop: bowlOn ? null : (q, M2) => put(q, K.bowlSide, mul(M2, mul(T(8, 4), S(.85))), { shadow: .9 }) });
      if (bowlOn) { const s = pop(t, TT.bowlDown, 1.08); put(gg, K.bowlSide, mul(C, mul(T(GATE.x - 230, GROUND + 58), S(.85 * s))), { shadow: 1 }); }
    } });
}
for (let k = 0; k < 4; k++) ev(TT.bowlDown - .55 + k * .14, 'crunch', { gain: .6 });
ev(TT.bowlDown, 'bowl'); ev(TT.bowlDown - .5, 'windbed', { dur: 23, gain: .7 });

// ---------- the creep along the wall; the window flower on the wall makes it sneeze ----------
export function shotCreep(g, t) {
  const V = kit();
  const u = seg(st(t), TT.creep, TT.twitch), nx = GATE.x - 1500 + 820 * eio(u), ny = GROUND + 40;
  const sneeze = t >= TT.sneeze, pre = t > TT.twitch;
  const C = cam(nx + 80 + (sneeze ? shake(t, [TT.sneeze], 10, 50) : 0), 640, .78);
  const ph = st(t) * 5;
  drawVillage(g, C, t, { mode: 'night', winI: NIGHTI, flowers: () => 1, bloom: .5,
    mid: gg => {
      // a window flower pasted on the wall section the Nian passes
      const fx = GATE.x - 700, flap = sneeze ? Math.sin((t - TT.sneeze) * 18) * .5 * Math.exp(-(t - TT.sneeze) * 2.5) : 0;
      put(gg, V.flowerS, mul(C, mul(T(fx, GROUND - 60), mul(R(flap), S(.3)))), { shadow: .6 });
      if (sneeze) burst(gg, C, t, TT.sneeze, nx - 300, ny - 300, 8, '#eef0f8', 140, 8, 21);
    },
    front: gg => {
      let pose;
      if (!pre) pose = { ...NPOSE.crouch, ...runPose(ph, .5), lean: -.25, head: .25, eye: 'curious', bob: Math.abs(Math.cos(ph)) * 5 };
      else if (!sneeze) { const k = seg(t, TT.twitch, TT.sneeze); pose = { ...NPOSE.crouch, head: .25 - .75 * k, eye: k > .5 ? 'sniff' : 'curious', jaw: .4 * k, lean: -.25 - .25 * k, bob: 30 * k }; }   // anticipation: head goes back, mouth opens, body rises
      else { const k = t - TT.sneeze; const fwd = k < .09 ? 1 : Math.max(0, 1 - (k - .09) * 3); pose = { ...NPOSE.crouch, head: 1.0 * fwd - .1, jaw: .8 * fwd, eye: k < .6 ? 'sneeze' : 'curious', lean: -.25 + .4 * fwd, shF: -.9 - .8 * fwd, bob: -20 * fwd }; }
      drawNian(gg, mul(C, mul(T(nx, ny), mul(S(.92), T(0, -NJ.ground)))), pose, { shadow: 1.6 });
    } });
}
for (let k = 0; k < 5; k++) ev(TT.creep + .2 + k * .42, 'thud', { gain: .35 });
ev(TT.twitch, 'sniff'); ev(TT.twitch + .4, 'inhale'); ev(TT.sneeze, 'sneeze'); ev(TT.sneeze + .05, 'paperflap');

// ---------- the panic: a firecracker string pops at the far end; it leaps and dives into the drift ----------
export function shotPanic(g, t) {
  const V = kit(), C = cam(GATE.x - 300, 660, .72);
  const nx0 = GATE.x - 560, ny = GROUND + 40;
  const leap = seg(t, TT.crackers, TT.crackers + .5), dive = seg(st(t), TT.dive - .35, TT.dive + .3);
  const dy = shake(t, [TT.dive], 9, 50);
  drawVillage(g, cam(GATE.x - 300, 660 + dy / .72, .72), t, { mode: 'night', winI: NIGHTI, flowers: () => 1, bloom: .5,
    mid: gg => {
      // the Nian: creeping → startled leap (squash then stretch) → dives behind the big drift at the left
      let pose, x = nx0, y = ny, sc = 1;
      if (t < TT.crackers) { pose = { ...NPOSE.crouch, head: .2, eye: 'curious' }; }
      else if (t < TT.dive - .35) { const h = Math.sin(leap * Math.PI); pose = { ...NPOSE.panic, head: -.3, jaw: .7 }; y = ny - 260 * h; sc = leap < .15 ? 1 - .15 * (leap / .15) : 1 + .08 * h; x = nx0 - 120 * leap; pose.scaleXY = [sc < 1 ? 1.15 : .95, sc]; }
      else { const d = eio(dive); pose = { ...NPOSE.panic, lean: -.9 * d, head: .4, jaw: .4, eye: 'panic', shF: -2.4, shB: -2.2 }; x = nx0 - 120 - 320 * d; y = ny + 60 * d; }
      const M = mul(C, mul(T(x, y), mul(S(.92), T(0, -NJ.ground))));
      drawNian(gg, pose.scaleXY ? mul(M, S(pose.scaleXY[0], pose.scaleXY[1])) : M, pose, { shadow: 1.6 });
      // the big drift in front (the Nian ends up behind it, only its eye above): drawn in `front`
    },
    front: gg => {
      const d = eio(dive), bulge = 1 + .25 * Math.sin(Math.min(1, Math.max(0, (t - TT.dive) / .5)) * Math.PI);
      put(gg, V.drifts[2], mul(C, mul(T(nx0 - 420, GROUND + 70), S(1.5, 1.35 * bulge))), { shadow: .8 });
      if (t >= TT.dive) spray(gg, C, t, TT.dive, nx0 - 420, GROUND - 60, 18, 260, 11, 5);
      // firecrackers at the far right end of the village (a string hung at house 4)
      crackerBurst(gg, C, t, TT.crackers, HOUSES[4].x - 120, GROUND - 120, 18, 1.3);
      crackerBurst(gg, C, t, TT.crackers + 1.0, HOUSES[3].x + 160, GROUND - 100, 12, 1.2);
    } });
}
ev(TT.crackers, 'crackers', { dur: 1.6 }); ev(TT.crackers + 1.0, 'crackers', { dur: 1.2 }); ev(TT.crackers + .05, 'yelp'); ev(TT.crackers + .5, 'thud', { gain: .5 }); ev(TT.dive, 'whump'); ev(TT.dive + .1, 'snowspray');

// ---------- eyes in the snow: the top of the head above the drift; 小雪's face enters upside-down ----------
export function shotEyesInSnow(g, t) {
  const V = kit(), C = cam(GATE.x - 980, GROUND - 120, 1.5);
  const peek = t >= TT.peek, ue = E_(st(t), TT.peek, TT.peek + .4);
  drawVillage(g, C, t, { mode: 'night', winI: NIGHTI, flowers: () => 1, bloom: .5, snow: false,
    mid: gg => {
      // the Nian behind the drift: head and horns rise so the eye clears the snow; the eye blinks panic → curious
      const rise = E_(st(t), TT.eyes, TT.eyes + .5), eye = t < TT.peek + .6 ? 'panic' : 'curious';
      drawNian(gg, mul(C, mul(T(GATE.x - 1020, GROUND + 200 - 110 * rise), mul(S(.92), T(0, -NJ.ground)))), { ...NPOSE.panic, lean: 0, head: -.1, jaw: 0, eye, shF: -.5, shB: .5 }, { shadow: 1.6 });
    },
    front: gg => {
      put(gg, V.drifts[2], mul(C, mul(T(GATE.x - 980, GROUND + 70), S(1.5, 1.35))), { shadow: .8 });
      // 小雪 comes to the drift from the right and bends over it to look at the eye
      if (peek) { const gx = GATE.x - 560 - 60 * ue; drawGirl(gg, mul(C, T(gx, GROUND + 60)), { expr: t > TT.peek + .8 ? 'smile' : 'surprise', flip: true, lean: -.45 * ue, head: .35 * ue, shF: -.6, elF: -.9, shB: -.4, elB: -.8, hipF: .15 * ue, hipB: -.1 * ue, handF: 'mitten', handB: 'mitten' }, { shadow: 1.2 }); }
    } });
  drawSnowfall(g, t, C, 1, {});
}
ev(TT.eyes + .2, 'snowsettle'); ev(TT.peek, 'cloth'); ev(TT.peek + .3, 'tick');

// ---------- the offer: she holds the bowl out; it rises, sniffs, eats the whole bowl in one gulp; the empty bowl clinks down ----------
export function shotOffer(g, t) {
  const V = kit(), K = kitchenKit(), C = cam(GATE.x - 820, GROUND - 160, .95);
  const rise = E_(st(t), TT.offer - .4, TT.offer + .6), lean = E_(st(t), TT.gulp - .5, TT.gulp - .05), back_ = E_(st(t), TT.gulp + .25, TT.gulp + .7);
  const gulped = t >= TT.gulp, spat = t >= TT.clink - .3;
  drawVillage(g, C, t, { mode: 'night', winI: NIGHTI, flowers: () => 1, bloom: .5,
    mid: gg => {
      const x = GATE.x - 1020 + 160 * rise, y = GROUND + 200 - 160 * rise;
      const pose = { ...NPOSE.crouch, lean: -.2 + .35 * lean - .35 * back_, head: .2 + .3 * lean - .25 * back_, jaw: lean > .3 && !gulped ? .85 * lean : gulped && t < TT.gulp + .25 ? .95 : 0, eye: gulped ? (t < TT.gulp + .5 ? 'eat' : 'happy') : lean > .3 ? 'eat' : rise < 1 ? 'curious' : 'sniff', shF: -.9, shB: -.4, tongue: lean > .3 && !gulped };
      const r = drawNian(gg, mul(C, mul(T(x, y), mul(S(.92), T(0, -NJ.ground)))), pose, { shadow: 1.6 });
      // the bowl after the gulp: spat out, falls, lands on the snow with a clink
      if (spat) { const u = seg(t, TT.clink - .3, TT.clink), m = r.joints.mouth; const bx = lerp(m[0] / C[0] - C[4] / C[0], GATE.x - 700, u), by = lerp(m[1] / C[0] - C[5] / C[0], GROUND + 50, ei(u)); put(gg, K.bowlSide, mul(C, mul(T(bx, by), mul(R(u * 5 * (1 - u) + (u >= 1 ? 0 : 0)), S(.85)))), { shadow: 1 }); }
    },
    front: gg => {
      put(gg, V.drifts[2], mul(C, mul(T(GATE.x - 980, GROUND + 70), S(1.5, 1.35 * (1 - .2 * rise)))), { shadow: .8 });
      // 小雪 holds out the bowl with both arms until the gulp
      const held = !gulped;
      drawGirl(gg, mul(C, T(GATE.x - 520, GROUND + 60)), { expr: gulped ? (t < TT.clink ? 'surprise' : 'laugh') : 'smile', lean: -.06, shF: -1.6, elF: -.2, shB: -1.5, elB: -.25, handF: 'open', handB: 'open', head: -.12, prop: held ? (q, M2) => put(q, K.bowlSide, mul(M2, mul(T(10, -2), S(.85))), { shadow: .9 }) : null }, { shadow: 1.2 });
      if (gulped && t < TT.gulp + .4) spray(gg, C, t, TT.gulp, GATE.x - 760, GROUND - 160, 6, 90, 7, 7);
    } });
}
ev(TT.offer - .4, 'snowsettle'); ev(TT.offer, 'cloth'); ev(TT.gulp - .4, 'sniff'); ev(TT.gulp, 'gulp'); ev(TT.gulp + .4, 'burp'); ev(TT.clink, 'clink');

// ---------- two faces: the Nian happy (CU), then 小雪 laughing (CU) ----------
export function shotTwoFaces(g, t) {
  const V = kit();
  if (t < TT.girlLaugh) {
    const C = cam(GATE.x - 1020, GROUND - 420, 1.3);
    drawVillage(g, C, t, { mode: 'night', winI: NIGHTI, flowers: () => 1, bloom: .5, mid: gg => { drawNian(gg, mul(C, mul(T(GATE.x - 860, GROUND + 40), mul(S(.92), T(0, -NJ.ground)))), { ...NPOSE.crouch, lean: -.1, head: .05 + .03 * Math.sin(st(t) * 6), eye: 'happy', jaw: .15, shF: -.9, shB: -.4 }, { shadow: 1.6 }); } });
  } else {
    const C = cam(GATE.x - 520, GROUND - 330, 2.0), ts = st(t), hop = Math.abs(Math.sin((t - TT.girlLaugh) * 9)) * 14 * (t < TT.girlLaugh + 1.2 ? 1 : 0);
    drawVillage(g, C, t, { mode: 'night', winI: NIGHTI, flowers: () => 1, bloom: .5, front: gg => {
      drawGirl(gg, mul(C, T(GATE.x - 520, GROUND + 60 - hop)), { expr: 'laugh', lean: .1 + .04 * Math.sin(ts * 12), head: -.22 + .05 * Math.sin(ts * 12), shF: -.4, elF: -1.7, shB: -.3, elB: -1.5, handF: 'mitten', handB: 'mitten' }, { shadow: 1.2 });
    } });
  }
}
ev(TT.nianHappy, 'purr'); ev(TT.girlLaugh, 'giggle'); ev(TT.girlLaugh + .4, 'giggle');

Object.assign(SHOTS, { mountainWide: shotMountainWide, nianCU: shotNianCU, steam: shotSteam, downhill: shotDownhill, gateBowl: shotGateBowl, creep: shotCreep, panic: shotPanic, eyesInSnow: shotEyesInSnow, offer: shotOffer, twoFaces: shotTwoFaces });
