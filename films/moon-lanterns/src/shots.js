// The shots: each builds (or shares) a scene, places the camera and animates the items from the timeline's hits. t is film time.
import { clamp, lerp, seg, ss, eio, eo, ei, back, track, TAU } from '/core/lib.js';
import { lampStagger, flicker } from './engine.js';
import { piece, cut } from './paper.js';
import * as Wd from './world.js';
import { figure, rabbitLantern, poleLantern, walk, run, mixPose, blinkAt, swap } from './rig.js';
import * as SC from './scenes.js';
import { HIT as H, beat, DISSOLVE } from './timeline.mjs';

const k = (t, a, b) => ss(seg(t, a, b));
const pend = (t, t0, amp = .35, f = 1.1, damp = .7) => t < t0 ? 0 : amp * Math.exp(-damp * (t - t0)) * Math.sin(TAU * f * (t - t0));
const cache = new Map();
const scene = (key, mk) => { if (!cache.has(key)) cache.set(key, mk()); return cache.get(key); };
function cam(S, keys) { const f = track(keys); return t => { const [x, y, z, focus] = f(t); S.cam.x = x; S.cam.y = y; S.cam.z = z; S.cam.focus = focus; }; }
function hold(S, L, F, side, p, rot = () => 0) { const it = S.add(L, p, {}); F.held = { it, side, rot }; return it; }
const box = (S, it) => { const pr = S.proj(-.012), w = it.p.w, h = it.p.h; return [pr.ox + (it.x - w / 2) * pr.s, pr.oy - (it.y + h / 2) * pr.s, pr.ox + (it.x + w / 2) * pr.s, pr.oy - (it.y - h / 2) * pr.s]; };
// a figure standing on a floor: hip height above the floor
const HIP = { girl: .039, mother: .0546, father: .0572, oldman: .0494, boy: .0364, woman: .052, fisher: .056, granny: .0478 };

export const SHOT = {};

// ———— s01 + s02: the lamp turns on; the title; push into the box to the village wide ————
function open() {
  return scene('open', () => {
    const V = SC.village('day'); const { S, it } = V; S.tag = 's01';
    S.box = { lit: 0 };
    const yue = figure(S, it.figL, { kind: 'girl', ppm: 7000, facing: 1 }), mom = figure(S, it.figL, { kind: 'mother', ppm: 7000, facing: 1 });
    yue.show(false); mom.show(false);
    const camf = cam(S, [[0, [0, .004, 1.5, 1.5]], [2.5, [0, .004, 1.32, 1.32]], [5, [.0, .006, 1.02, 1.02]], [7.5, [.02, .012, .66, .7]], [9.0, [.03, .015, .5, .57]], [10.1, [.035, .015, .49, .57]]]);
    const update = t => {
      S.showOnly([]); V.update(t); camf(t);
      const on = k(t, H.lampOn, H.lampOn + .5); S.box.lit = on; S.light.lit = on * SC.PAL.day.lit * (t > H.lampOn ? flicker(t) * .5 + .5 : 1);
      const n = S.layers.length; S.layers.forEach((L, i) => { L.lit = lampStagger(t, H.lampOn + .1, n, i, .45); });
      it.title.reveal.k = eo(seg(t, H.title, H.title + .9)); it.seal.vis = t >= H.seal; it.seal.sy = t < H.seal + .15 ? lerp(1.6, 1, k(t, H.seal, H.seal + .15)) : 1;
      it.caption.reveal.k = eo(seg(t, H.caption, H.caption + .7));
      S.grade = { expo: 1, vig: .45 };
    };
    return { S, update, subBottom: t => t < 5 ? 74 : 64, textBox: (id, t) => id === 'title' ? box(S, it.title) : id === 'caption' ? (() => { const pr = S.proj(-.074), w = it.caption.p.w, h = it.caption.p.h; return [pr.ox + (it.caption.x - w / 2) * pr.s, pr.oy - (it.caption.y + h / 2) * pr.s, pr.ox + (it.caption.x + w / 2) * pr.s, pr.oy - (it.caption.y - h / 2) * pr.s]; })() : null };
  });
}
SHOT.s01 = open; SHOT.s02 = open;

// ———— s03: A-Yue cutting at the table; the mother hangs a lantern by the door ————
SHOT.s03 = () => {
  const I = scene('intDay', () => SC.interior('day')), { S, it } = I; S.tag = 's03';
  const sc = hold(S, it.yueL, it.yue, 'near', piece({ w: .03, h: .03, ppm: 12000, color: '#2a2a30', finish: { px: 2, rim: .5 }, draw: x => Wd.scissors(x, { L: .012, a: .3 }) }), (p, hx, hy) => -1.3 + .15 * Math.sin(p._t * 7));
  const lan = poleLantern(S, it.figL, it.mother, 'near', 'round', .007, { pole: .02 }); lan.gate = 0; const momHeld = it.mother.held, yueHeld = it.yue.held;
  const camf = cam(S, [[10, [-.06, -.03, .21, .286]], [13.4, [-.055, -.028, .2, .276]]]);
  return { S, update(t) {
    S.showOnly(['s03']); I.update(t); camf(t); it.mother.held = momHeld; it.yue.held = yueHeld;
    const c = Math.sin(t * 7);
    it.yue.set({ x: -.03, y: -.08, facing: 1, hipN: 1.5, kneeN: -1.5, hipF: 1.45, kneeF: -1.45, body: -.12, head: -.42 + .02 * c, shN: 1.25 + .08 * c, elN: -1.55, shF: 1.05, elF: -1.5, expr: 'focus', blink: blinkAt(t, 11.2), _t: t });
    const hang = 1 - k(t, 11.4, 12.2);   // arms up at the hook, then lowered
    it.mother.set({ x: -.155, y: -.1 + HIP.mother, facing: -1, body: 0, head: .35 * hang, shN: lerp(.5, 2.7, hang), elN: lerp(-1.2, .2, hang), shF: lerp(.3, 2.4, hang), elF: lerp(-.4, .3, hang), expr: 'calm', blink: blinkAt(t, 12.6) });
    lan.rot = -.1 * hang + pend(t, 12.2, .25, 1.2, .9);
  } };
};

// ———— s04: top-down, the scissors cut the rabbit free ————
SHOT.s04 = () => {
  const C = scene('cut', () => SC.cuttingTop()), { S, it } = C;
  const camf = cam(S, [[13.3, [.0, .0, .21, .25]], [16.7, [.004, .002, .2, .24]]]);
  return { S, update(t) {
    camf(t);
    let kk = 0; H.snips.forEach(s => { kk += .25 * ss(seg(t, s - .05, s + .35)); }); kk = Math.min(1, kk);
    it.setCut(kk);
    const [px, py] = it.outline[Math.round(kk * 72)], [qx, qy] = it.outline[Math.max(0, Math.round(kk * 72) - 2)];
    const ang = Math.atan2(py - qy, px - qx) - Math.PI / 2;
    let open = .35; H.snips.forEach(s => { const u = (t - s) / .3; if (u > 0 && u < 1) open = .35 * (1 - Math.sin(u * Math.PI)); });
    it.scisOpen(open);
    const rs = -.08, pxr = px * Math.cos(rs) - py * Math.sin(rs), pyr = px * Math.sin(rs) + py * Math.cos(rs), angr = ang + rs;
    const L = .024 * .95, cx = pxr - Math.cos(angr + Math.PI / 2) * L, cy = pyr - Math.sin(angr + Math.PI / 2) * L;
    it.scis.x = cx; it.scis.y = cy; it.scis.rot = angr;
    it.handR.x = cx - Math.cos(angr + Math.PI / 2) * .008; it.handR.y = cy - Math.sin(angr + Math.PI / 2) * .008; it.handR.rot = angr;
    it.handL.x = -.034 + .002 * Math.sin(t * .8); it.handL.y = .004 + .001 * Math.sin(t * .6); it.handL.rot = .9;
    const free = k(t, H.rabbitFree, H.rabbitFree + .4);
    it.rabbit.vis = t > H.rabbitFree - .02; it.rabbit.y = .004 * free; it.rabbit.x = .002 * free; it.rabbit.rot = -.08 + .12 * free;
  } };
};

// ———— s05: close-up, concentration → delight; the cut rabbit held up to the window ————
SHOT.s05 = () => {
  const I = scene('intDay', () => SC.interior('day')), { S, it } = I; S.tag = 's05';
  const yue = figure(S, it.yueL, { kind: 'girl', ppm: 20000, facing: 1 });
  const rab = hold(S, it.yueL, yue, 'near', piece({ w: .03, h: .03, ppm: 16000, color: '#c8261e', finish: { px: 2, rim: .4 }, ax: 0, ay: -.009, draw: x => { x.save(); x.translate(0, .012); Wd.rabbit(x, .0034); x.restore(); }, glow: x => { x.save(); x.translate(0, .012); Wd.rabbitGlow(x, .0034, { col: '#ffb070' }); x.restore(); } }), () => .3);
  const camf = cam(S, [[16.6, [-.028, -.046, .056, .132]], [19.3, [-.026, -.042, .058, .134]]]);
  return { S, update(t) {
    S.showOnly(['s05']); I.update(t); camf(t); it.yue.show(false); it.mother.show(false);
    const up = k(t, H.blinkDelight + .1, H.blinkDelight + .5), lift = eo(seg(t, H.rabbitUp, H.rabbitUp + .5));
    const e = swap(t, H.blinkDelight, 'focus', 'delight');
    yue.set({ x: -.03, y: -.08, facing: 1, hipN: 1.5, kneeN: -1.5, hipF: 1.45, kneeF: -1.45, body: -.1 + .1 * up, head: lerp(-.4, .12, up), shN: lerp(1.25, 2.3, lift), elN: lerp(-1.55, -.9, lift), shF: 1.05, elF: -1.5, ...e, blink: e.blink || blinkAt(t, 17.1) });
    rab.gate = .4 + .6 * lift;
    S.extra = [];
  } };
};

// ———— s06: the mooncake box: the lid lifts, three cakes, one two three ————
SHOT.s06 = () => {
  const I = scene('intDay', () => SC.interior('day')), { S, it } = I; S.tag = 's06';
  const hand = S.add(it.propL, piece({ w: .03, h: .04, ppm: 12000, color: '#140c08', finish: { px: 2, rim: .35 }, ax: 0, ay: .015, draw: x => { x.beginPath(); x.ellipse(0, .0, .007, .009, 0, 0, TAU); x.fill(); x.fillRect(-.006, .008, .012, .025); cut(x, () => { x.lineWidth = .0006; for (const q of [-.003, 0, .003]) { x.beginPath(); x.moveTo(q, -.002); x.lineTo(q * 1.2, -.008); x.stroke(); } }); } }), { x: .09, y: -.01, rot: -.5, vis: false });
  const camf = cam(S, [[19.1, [.055, -.042, .084, .144]], [22.6, [.057, -.04, .08, .14]]]);
  return { S, update(t) {
    S.showOnly(['s06']); I.update(t); camf(t); it.yue.show(false); it.mother.show(false);
    const lid = back(seg(t, H.lidUp, H.lidUp + .45), 1.4);
    it.lid.rot = lid * 1.75; it.cakes.forEach(c => { c.vis = t > H.lidUp + .15; });
    hand.vis = t > H.taps[0] - .6;
    let tx = .09, ty = -.018, dip = 0; H.taps.forEach((tt, i) => { const u = seg(t, tt - .5, tt - .05); if (u > 0) tx = lerp(i ? .05 + (i - 2) * .016 : .09, .05 + (i - 1) * .016, ss(u)); const d = (t - tt) / .25; if (d > 0 && d < 1) dip = Math.sin(d * Math.PI); });
    hand.x = tx; hand.y = ty - .0035 * dip + .004 * (1 - k(t, H.taps[0] - .6, H.taps[0] - .2)); hand.rot = -.4 - .2 * dip;
  } };
};

// ———— s07: two-shot: the string, the lantern lifted, the ear flops, the mother points to the sea ————
SHOT.s07 = () => {
  const I = scene('intDay', () => SC.interior('day')), { S, it } = I; S.tag = 's07';
  const yue = figure(S, it.yueL, { kind: 'girl', ppm: 12000, facing: -1 });
  const ears = [0, .45, .9].map(e => piece({ w: .04, h: .04 + .011, ppm: 12000, color: '#c8261e', finish: { px: 2, rim: .35 }, ax: 0, ay: (.04 + .011) / 2, draw: x => { x.fillStyle = '#2a1008'; x.fillRect(-.0002, -.011, .0004, .011); x.fillStyle = '#c8261e'; x.save(); x.translate(0, -.011); Wd.rabbit(x, .0046, { earR: e }); x.restore(); }, glow: x => { x.save(); x.translate(0, -.011); Wd.rabbitGlow(x, .0046, { earR: e }); x.restore(); } }));
  const lan = hold(S, it.yueL, yue, 'near', ears[0], () => 0);
  const camf = cam(S, [[22.4, [-.125, -.03, .19, .27]], [H.lanternLift, [-.125, -.03, .19, .27]], [H.earFlop, [-.118, -.02, .165, .245]], [26.8, [-.118, -.02, .165, .245]]]);
  return { S, update(t) {
    S.showOnly(['s07']); I.update(t); camf(t); it.yue.show(false); it.mother.held = null;
    const tie = k(t, H.string - .5, H.string), lift = back(seg(t, H.lanternLift, H.lanternLift + .5), 1.3), pt = k(t, H.point, H.point + .4), fix = k(t, H.earFix - .3, H.earFix);
    const flop = t < H.earFlop ? 0 : t < H.earFix ? Math.min(2, Math.floor((t - H.earFlop) / .09) + 1) : Math.max(0, 2 - Math.floor((t - H.earFix) / .09));
    lan.p = ears[flop];
    it.mother.set({ x: -.16, y: -.1 + HIP.mother, facing: 1, body: lerp(0, -.15, tie) * (1 - pt), head: lerp(-.3 * tie, .1, pt), shN: lerp(1.2, 1.6, pt), elN: lerp(-1.2 * (1 - tie) - .6 * tie, -.05, pt), shF: lerp(.9, .5, pt), elF: -1.0, expr: t > H.point ? 'calm' : 'focus', blink: blinkAt(t, 24.8) });
    yue.set({ x: -.095, y: -.1 + HIP.girl, facing: -1, body: 0, head: lerp(-.25, .3, lift) * (1 - pt) + .15 * pt, shN: lerp(1.0, 2.75, lift), elN: lerp(-1.2, -.2, lift), shF: lerp(.4, lerp(.4, 2.2, fix * (1 - pt)), 1), elF: lerp(-.6, -.9, fix * (1 - pt)), expr: t > H.lanternLift ? 'delight' : 'hope', blink: blinkAt(t, 23.6) || blinkAt(t, 25.9) });
    lan.rot = pend(t, H.lanternLift + .3, .45, 1.1, .8) + .25 * flop * .2;
  } };
};

// ———— s08: dusk over the harbour: the lanterns light one by one, the moon rises behind the headland ————
SHOT.s08 = () => {
  const V = scene('dusk', () => SC.village('dusk')), { S, it } = V; S.tag = 's08';
  const yue = figure(S, it.figL, { kind: 'girl', ppm: 7000, facing: 1, scale: .5 }), mom = figure(S, it.figL, { kind: 'mother', ppm: 7000, facing: 1, scale: .5 });
  const lan = rabbitLantern(S, it.figL, yue, 'near', .0014, { string: .003 });
  V.pierFigs = { yue, mom, lan };
  const camf = cam(S, [[26.5, [-.08, .005, .54, .64]], [31, [-.07, .01, .63, .72]]]);
  return { S, update(t) {
    S.showOnly(['s08']); V.update(t); camf(t);
    it.sky.gate = .35 + .65 * k(t, 26.7, 30.5);
    H.duskLanterns.forEach((tt, i) => { it.eaveItems[i].gate = k(t, tt, tt + .3); });
    it.eaveItems.forEach(e => { e.gate = e.gate * (e.gate > 0 ? flicker(t + e.x) : 0); });
    yue.set({ x: .085, y: -.057 + HIP.girl * .5, facing: 1, expr: 'hope', shN: .5, elN: -.6, shF: .2, elF: -.3 }); mom.set({ x: .07, y: -.057 + HIP.mother * .5, facing: 1, expr: 'calm', shN: .3, elN: -.5 });
    lan.rot = .1 * Math.sin(t * 1.3);
    S.extra = H.duskLanterns.map((tt, i) => ({ x: it.eaveItems[i].x, y: it.eaveItems[i].y - .005, z: -.08, r: .04, col: '#ffb060', k: .5 * k(t, tt, tt + .3) }));
  } };
};

// ———— s09: the pier end at dusk: A-Yue bounces on her toes, the mother's hand on her shoulder ————
SHOT.s09 = () => {
  const V = scene('dusk', () => SC.village('dusk')), { S, it } = V; S.tag = 's09';
  const yue = figure(S, it.figL, { kind: 'girl', ppm: 12000, facing: 1 }), mom = figure(S, it.figL, { kind: 'mother', ppm: 12000, facing: 1 });
  const lan = rabbitLantern(S, it.figL, yue, 'near', .0034, { string: .006 });
  const camf = cam(S, [[30.7, [.09, -.005, .19, .262]], [35.2, [.092, -.003, .185, .257]]]);
  return { S, update(t) {
    S.showOnly(['s09']); V.update(t); camf(t);
    it.sky.gate = 1; it.eaveItems.forEach(e => { e.gate = flicker(t + e.x); });
    const b = t - H.bounce, ant = b > -.35 && b < 0 ? Math.sin((b + .35) / .35 * Math.PI) * .5 : 0, hop = b > 0 && b < .5 ? Math.sin(b / .5 * Math.PI) : 0, hop2 = b > .55 && b < 1.0 ? Math.sin((b - .55) / .45 * Math.PI) * .6 : 0;
    const sh = k(t, H.shoulder - .4, H.shoulder);
    yue.set({ x: .09, y: -.057 + HIP.girl - .004 * ant + .006 * (hop + hop2), facing: 1, body: 0, head: .25 + .1 * hop, hipN: -.2 * ant + .2 * hop, kneeN: .5 * ant, hipF: -.1 * ant, kneeF: .5 * ant, shN: .6 + .3 * hop, elN: -.7, shF: .3, elF: -.4, expr: 'hope', blink: blinkAt(t, 32.2) || blinkAt(t, 34.1) });
    mom.set({ x: .066, y: -.057 + HIP.mother, facing: 1, body: 0, head: .2, shN: lerp(.4, 1.05, sh), elN: lerp(-.5, -.95, sh), shF: .2, elF: -.3, expr: 'calm', blink: blinkAt(t, 33.4) });
    lan.rot = .12 * Math.sin(t * 1.4) + pend(t, H.bounce, .3, 1.2, .9);
    S.extra = [{ x: lan.x, y: lan.y - .012, z: -.072, r: .03, col: '#ff9050', k: .4 }];
  } };
};

// ———— s10: the fog rolls in from the sea; the boats' lights go out one by one ————
SHOT.s10 = () => {
  const V = scene('fog', () => SC.village('fog')), { S, it } = V;
  const camf = cam(S, [[34.8, [.07, -.02, .42, .54]], [40.2, [.075, -.018, .41, .53]]]);
  return { S, update(t) {
    S.showOnly([]); V.update(t); camf(t);
    it.fog.forEach((f, i) => { const u = eo(seg(t, H.fogIn + i * .55, H.fogIn + i * .55 + 4.2)); f.it.x = lerp(.95, .0, u) + .01 * Math.sin(t * .13 + i); f.L.alpha = f.a * Math.min(1, u * 3); });
    it.boats.forEach((b, i) => { b.gate = 1 - .9 * k(t, H.boatLost[i], H.boatLost[i] + .5); });
    it.sky.gate = 1 - .5 * k(t, 36, 40);
    it.eaveItems.forEach(e => { e.gate = flicker(t + e.x); });
  } };
};

// ———— s11: tilt up to the moon; a sheet of fog swallows it; foghorn ————
SHOT.s11 = () => {
  const V = scene('fog', () => SC.village('fog')), { S, it } = V;
  const camf = cam(S, [[39.9, [.075, -.018, .41, .53]], [40.4, [.08, -.01, .41, .53]], [42.6, [.1, .12, .41, .53]], [43.2, [.1, .125, .41, .53]]]);
  return { S, update(t) {
    S.showOnly([]); V.update(t); camf(t);
    it.fog.forEach((f, i) => { f.it.x = .01 * Math.sin(t * .13 + i); f.L.alpha = f.a; });
    it.fog[0].it.y = -.03 + lerp(0, .19, eio(seg(t, H.moonLost - 1.2, H.moonLost + .6)));
    it.fog[1].it.y = -.018 + lerp(0, .12, eio(seg(t, H.moonLost - .8, H.moonLost + 1)));
    it.sky.gate = .5 - .35 * k(t, H.moonLost, H.moonLost + .8);
    it.boats.forEach(b => { b.gate = .1; });
  } };
};

// ———— s12: the radio; the mother leans in and turns the knob ————
SHOT.s12 = () => {
  const I = scene('intNight', () => SC.interior('night')), { S, it } = I;
  const camf = cam(S, [[42.9, [.1, -.042, .07, .13]], [45, [.08, -.035, .12, .18]], [47.2, [.03, -.03, .17, .236]]]);
  return { S, update(t) {
    S.showOnly([]); I.update(t); camf(t);
    it.radio.gate = (1 + .12 * Math.sin(t * 37) * Math.sin(t * 11)) * (t > H.radioOn ? 1 : .6);
    const lean = k(t, H.knob - .7, H.knob - .1), twist = Math.sin(seg(t, H.knob, H.knob + .4) * Math.PI) * .3;
    it.mother.held = null; it.mother.set({ x: .02, y: -.1 + HIP.mother, facing: 1, body: -.35 * lean, head: -.1 * lean, shN: lerp(.6, 1.5, lean), elN: lerp(-.8, -.25 + twist, lean), shF: .5, elF: -.9, expr: 'worry', blink: blinkAt(t, 45.6) });
    it.yue.held = null; it.yue.set({ x: -.03, y: -.08, facing: 1, hipN: 1.5, kneeN: -1.5, hipF: 1.45, kneeF: -1.45, body: -.05, head: .1, shN: 1.0, elN: -1.6, shF: .9, elF: -1.5, expr: 'worry', blink: blinkAt(t, 46.2) });
    S.extra = [{ x: it.lamp.x, y: it.lamp.y - .014, z: -.1, r: .08, col: '#ffb060', k: .45 * it.lamp.gate }];
  } };
};

// ———— s13: close-up: worry; her eyes go to the cakes, then up to the window ————
SHOT.s13 = () => {
  const I = scene('intNight', () => SC.interior('night')), { S, it } = I; S.tag = 's13';
  const yue = figure(S, it.yueL, { kind: 'girl', ppm: 20000, facing: 1 });
  const camf = cam(S, [[46.9, [-.028, -.046, .056, .132]], [50.2, [-.027, -.045, .057, .133]]]);
  return { S, update(t) {
    S.showOnly(['s13']); I.update(t); camf(t); it.yue.show(false); it.mother.show(false);
    const c = k(t, H.eyesCakes, H.eyesCakes + .35), w = k(t, H.eyesWindow, H.eyesWindow + .4);
    yue.set({ x: -.03, y: -.08, facing: 1, hipN: 1.5, kneeN: -1.5, hipF: 1.45, kneeF: -1.45, body: -.05, head: lerp(.05, -.28, c) + .5 * w, shN: 1.0, elN: -1.6, shF: .9, elF: -1.5, expr: 'worry', blink: blinkAt(t, H.eyesCakes - .12) || blinkAt(t, H.eyesWindow - .1) });
    S.extra = [{ x: it.lamp.x, y: it.lamp.y - .014, z: -.1, r: .08, col: '#ffb060', k: .45 * it.lamp.gate }];
  } };
};

// ———— s14: the three mooncakes; the lamp flickers; a shadow crosses them ————
SHOT.s14 = () => {
  const I = scene('intNight', () => SC.interior('night')), { S, it } = I; S.tag = 's14';
  const shadowL = S.layer({ z: -.045, trans: .05 });
  const mom = figure(S, shadowL, { kind: 'mother', ppm: 6000, facing: -1 });
  const camf = cam(S, [[49.8, [.055, -.042, .082, .142]], [53.7, [.055, -.041, .08, .14]]]);
  return { S, update(t) {
    S.showOnly(['s14']); I.update(t); camf(t); it.yue.show(false); it.mother.show(false);
    it.lid.rot = 1.75; it.cakes.forEach(c => { c.vis = true; });
    const f = t - H.flicker, dip = f > 0 && f < .9 ? 1 - .7 * Math.abs(Math.sin(f * 14)) * Math.exp(-f * 2) : 1;
    S.light.lit = SC.PAL.fog.lit * .95 * dip; it.lamp.gate = dip * (1 + .06 * Math.sin(7.3 * t) * Math.sin(3.1 * t));
    const cross = seg(t, H.shadowCross - .2, H.shadowCross + .9);
    const r = run(cross * 1.6); mom.set({ x: lerp(.13, -.03, cross), y: -.06, facing: -1, expr: 'worry', ...r, vis: cross > 0 && cross < 1 });
    S.extra = [{ x: it.lamp.x, y: it.lamp.y - .014, z: -.1, r: .08, col: '#ffb060', k: .45 * dip }];
  } };
};

// ———— s15: the pier in the fog: the mother runs its length, villagers gather with lanterns ————
SHOT.s15 = () => {
  const V = scene('fog', () => SC.village('fog')), { S, it } = V; S.tag = 's15';
  const mom = figure(S, it.figL, { kind: 'mother', ppm: 10000, facing: 1, scale: .5 });
  const ml = poleLantern(S, it.figL, mom, 'near', 'round', .003, { pole: .008 }); ml.gate = 1;
  const vill = [['oldman', 'lotus', -.06], ['woman', 'star', -.04], ['fisher', 'fish', -.02]].map(([kind, kindL, x]) => { const F = figure(S, it.figL, { kind, ppm: 10000, facing: 1, scale: .5 }); const l = poleLantern(S, it.figL, F, 'near', kindL, .0035, { pole: .009 }); return { F, l, x }; });
  const camf = cam(S, [[53.3, [-.11, -.028, .3, .372]], [57.7, [.03, -.026, .3, .372]]]);
  return { S, update(t) {
    S.showOnly(['s15']); V.update(t); camf(t);
    it.fog.forEach((f, i) => { f.it.x = .012 * Math.sin(t * .15 + i); f.L.alpha = f.a; }); it.sky.gate = .15; it.boats.forEach(b => { b.gate = .05; }); it.eaveItems.forEach(e => { e.gate = flicker(t + e.x) * .7; });
    const u = seg(t, H.runSteps[0] - .2, H.runSteps[7] + .3), ph = (t - H.runSteps[0]) / 1.0;
    const r = run(ph); mom.set({ x: lerp(-.11, .1, u), y: -.057 + HIP.mother * .5 + r.bob * .15, facing: 1, expr: 'worry', ...r, blink: blinkAt(t, 55.0) });
    ml.rot = -.4 + .35 * Math.sin(ph * TAU * 2 + 1);
    vill.forEach((v, i) => { const g = k(t, H.gather + i * .35, H.gather + i * .35 + .3); v.F.set({ x: v.x, y: -.057 + HIP[v.F.spec.kind] * .5, facing: 1, expr: 'worry', shN: .5, elN: -1.3, shF: .2, elF: -.4, head: .1 }); v.l.gate = g * flicker(t + i); });
    S.extra = [{ x: ml.x, y: ml.y - .01, z: -.072, r: .03, col: '#ffb060', k: .45 }, ...vill.map(v => ({ x: v.l.x, y: v.l.y - .011, z: -.072, r: .03, col: '#ffb060', k: .4 * v.l.gate }))];
  } };
};

// ———— s16: the father at the wheel in the fog; he wipes the window; nothing ————
SHOT.s16 = () => {
  const B = scene('boat', () => SC.boatScene()), { S, it } = B;
  const camf = cam(S, [[57.3, [.0, -.01, .22, .306]], [61.7, [.002, -.008, .215, .301]]]);
  return { S, update(t) {
    S.showOnly([]); B.update(t); camf(t);
    const [sw, rl] = S.boatSway; it.boatLayers.forEach(L => { L.oy = sw; L.ox = .3 * sw; });
    const wipe = seg(t, H.wipe, H.wipe + 1.6), wv = wipe > 0 && wipe < 1 ? Math.sin(wipe * Math.PI) : 0, wobble = Math.sin(t * 9) * .25 * wv;
    it.father.set({ x: 0, y: -.07, facing: 1, body: -.06, head: -.1 + .15 * wv, shN: lerp(1.05, 2.35, wv), elN: lerp(-1.0, -.9 + wobble, wv), shF: .95, elF: -1.1, expr: t > H.wipe + 1.2 ? 'worry' : 'stern', blink: blinkAt(t, 58.1) || blinkAt(t, 60.6) });
    it.wheel.rot = .25 * Math.sin(t * .8) * (1 - wv) + .15 * Math.sin((t - H.wheel) * 3) * seg(t, H.wheel, H.wheel + .3) * (1 - seg(t, H.wheel + .5, H.wheel + 1));
    S.extra = [{ x: it.lamp.x, y: it.lamp.y - .006, z: -.07, r: .07, col: '#ffb060', k: .5 * flicker(t) }];
  } };
};

// ———— s17: A-Yue at the door; she looks at the lantern, lifts her head; rack focus to the lighthouse; she goes ————
SHOT.s17 = () => {
  const I = scene('intNight', () => SC.interior('night')), { S, it } = I; S.tag = 's17';
  const yue = figure(S, it.yueL, { kind: 'girl', ppm: 12000, facing: 1 });
  const lan = rabbitLantern(S, it.yueL, yue, 'near', .0034, { string: .006 });
  const f = t => lerp(.296, .35, eio(seg(t, H.rack, H.rack + 1.0)));
  return { S, update(t) {
    S.showOnly(['s17']); I.update(t); S.cam.x = -.165; S.cam.y = -.035; S.cam.z = .22; S.cam.focus = f(t); it.yue.show(false); it.mother.show(false);
    const look = k(t, H.lookDown - .4, H.lookDown), up = k(t, H.headLift - .1, H.headLift + .4), go = eo(seg(t, H.stepOut, H.stepOut + 1.0));
    const w = walk((t - H.stepOut) * 1.8);
    const facing = t > H.stepOut + .15 ? -1 : 1;
    yue.set({ x: -.19 - .05 * go, y: -.1 + HIP.girl + (go ? w.bob * .3 : 0), facing, body: 0, head: lerp(0, -.45, look) * (1 - up) + .3 * up * (1 - go), shN: go ? w.shN : lerp(.3, 1.0, look), elN: go ? w.elN : lerp(-.4, -1.3, look), shF: go ? w.shF : .3, elF: go ? w.elF : -.5, hipN: go ? w.hipN : 0, kneeN: go ? w.kneeN : 0, hipF: go ? w.hipF : 0, kneeF: go ? w.kneeF : 0, expr: t > H.headLift ? 'hope' : 'worry', blink: blinkAt(t, H.headLift - .05) || blinkAt(t, 62.0) });
    lan.rot = .1 * Math.sin(t * 1.5) + (go ? .2 * Math.sin(t * 6) : 0);
    S.extra = [{ x: lan.x, y: lan.y - .012, z: -.076, r: .03, col: '#ff9050', k: .45 }, { x: it.lamp.x, y: it.lamp.y - .014, z: -.1, r: .08, col: '#ffb060', k: .4 }];
  } };
};

// ———— s18: tilt up the cliff path: a tiny red glow zigzags up to the dark tower ————
SHOT.s18 = () => {
  const C = scene('cliff', () => SC.cliff()), { S, it } = C; S.tag = 's18';
  const yue = figure(S, it.figL, { kind: 'girl', ppm: 9000, facing: 1, scale: .32 });
  const lan = rabbitLantern(S, it.figL, yue, 'near', .0012, { string: .002 });
  C.climber = { yue, lan };
  const camf = cam(S, [[64.8, [-.07, -.085, .5, .59]], [66, [-.06, -.06, .5, .59]], [68.6, [.0, .09, .5, .59]], [69.3, [.01, .1, .5, .59]]]);
  return { S, update(t) {
    S.showOnly(['s18']); C.update(t); camf(t);
    const u = clamp((t - H.climb) / (H.towerFoot - H.climb) * .96), [px, py, dir] = SC.pathAt(u);
    const w = walk((t - H.climb) * 2.2, .5);
    yue.set({ x: px, y: py + HIP.girl * .32 + w.bob * .1, facing: dir, body: -.1, head: .2, ...w, shN: .6, elN: -.9, expr: 'hope' });
    lan.rot = .25 * Math.sin((t - H.climb) * TAU * 1.1);
    it.slits.forEach(s => { s.gate = 0; }); it.dot.gate = 0;
    S.extra = [{ x: lan.x, y: lan.y - .004, z: -.082, r: .03, col: '#ff9050', k: .55 }];
  } };
};

// ———— s19: the tower in the fog: the small light climbs it window by window ————
SHOT.s19 = () => {
  const C = scene('cliff', () => SC.cliff()), { S, it } = C;
  const camf = cam(S, [[68.9, [.2, .115, .37, .48]], [73.6, [.2, .12, .36, .47]]]);
  return { S, update(t) {
    S.showOnly([]); C.update(t); camf(t);
    it.slits.forEach((s, i) => { const tt = H.slits[i]; s.gate = (k(t, tt, tt + .25) - .75 * k(t, tt + .7, tt + 1.3)) * flicker(t); });
    it.dot.gate = k(t, H.slits[3] + 1.0, H.slits[3] + 1.3);
    S.extra = it.slits.map(s => ({ x: s.x, y: s.y, z: -.11, r: .03, col: '#ff9050', k: .5 * s.gate }));
  } };
};

// ———— s20: the lamp room: she sets the rabbit lantern in the window and steps back, hands clasped ————
SHOT.s20 = () => {
  const R = scene('lamp', () => SC.lampRoom()), { S, it } = R; S.tag = 's20';
  const lan = rabbitLantern(S, it.figL, it.yue, 'near', .0034, { string: .006 });
  const camf = cam(S, [[73.2, [-.03, -.02, .205, .279]], [78.1, [-.035, -.022, .2, .274]]]);
  return { S, update(t) {
    S.showOnly(['s20']); R.update(t); camf(t);
    const inn = seg(t, 73.44, H.setLantern - .3), reach = k(t, H.setLantern - .3, H.setLantern), back_ = eo(seg(t, H.stepBack, H.stepBack + .6)), cl = k(t, H.clasp - .2, H.clasp + .3);
    const w = walk((t - 73.44) * 2.0, .45), walking = inn > 0 && inn < 1;
    const x = lerp(-.14, -.055, eo(inn)) - .035 * back_;
    const set = t >= H.setLantern; it.rabbitStill.vis = set;
    it.yue.set({ x, y: -.09 + HIP.girl + (walking ? w.bob * .3 : 0), facing: back_ > .5 ? 1 : 1, body: lerp(0, -.25, reach) * (1 - back_), head: lerp(0, -.3, reach) * (1 - back_) + .25 * cl,
      hipN: walking ? w.hipN : 0, kneeN: walking ? w.kneeN : 0, hipF: walking ? w.hipF : 0, kneeF: walking ? w.kneeF : 0,
      shN: lerp(walking ? w.shN : .5, 1.4, reach) * (1 - back_) + lerp(.3, 1.15, cl) * back_, elN: lerp(-.8, -.3, reach) * (1 - back_) + lerp(-.4, -2.3, cl) * back_,
      shF: lerp(walking ? w.shF : .2, .3, reach) * (1 - back_) + lerp(.3, 1.1, cl) * back_, elF: -.4 * (1 - back_) + lerp(-.4, -2.3, cl) * back_, expr: set ? 'hope' : 'calm', blink: blinkAt(t, 74.0) || blinkAt(t, 76.9) });
    lan.vis = !set; lan.rot = .15 * Math.sin(t * 1.4) + (walking ? .2 * Math.sin(t * 6) : 0);
    const lx = set ? it.rabbitStill.x : lan.x, ly = set ? it.rabbitStill.y - .003 : lan.y - .012;
    S.extra = [{ x: lx, y: ly, z: -.066, r: .05, col: '#ff9050', k: .55 * flicker(t) }];
  } };
};

// ———— s21: from the sea side: the lighthouse in fog with one tiny red dot; the fog drifts over it ————
SHOT.s21 = () => {
  const C = scene('cliff', () => SC.cliff()), { S, it } = C;
  const camf = cam(S, [[77.7, [.1, .0, .64, .75]], [81.4, [.11, .005, .66, .77]]]);
  return { S, update(t) {
    S.showOnly([]); C.update(t); camf(t);
    it.slits.forEach(s => { s.gate = 0; }); it.dot.gate = flicker(t);
    it.fog[0].it.y = lerp(0, .12, eio(seg(t, H.fogOverDot - .4, H.fogOverDot + 1.4)));
    S.extra = [{ x: it.dot.x, y: it.dot.y, z: -.11, r: .012, col: '#ff8050', k: .4 }];
  } };
};

// ———— s22: the close-up, held: hope folds into despair; she sinks and cries; the light at its lowest; silence ————
SHOT.s22 = () => {
  const R = scene('lamp', () => SC.lampRoom()), { S, it } = R; S.tag = 's22';
  const yue = figure(S, it.figL, { kind: 'girl', ppm: 22000, facing: 1 });
  const tearL = S.layer({ z: -.072, trans: .1, shadow: false, recv: false });
  const tear = () => S.add(tearL, piece({ w: .004, h: .005, ppm: 24000, color: '#140c08', finish: false, draw: x => { x.fillStyle = '#4a3a30'; x.beginPath(); x.moveTo(0, .0016); x.lineTo(.0008, -.0004); x.arc(0, -.0008, .0008, 0, Math.PI); x.closePath(); x.fill(); }, glow: g => { g.fillStyle = '#fff0d0'; g.beginPath(); g.moveTo(0, .0016); g.lineTo(.0008, -.0004); g.arc(0, -.0008, .0008, 0, Math.PI); g.closePath(); g.fill(); } }), { vis: false });
  const tears = [tear(), tear(), tear(), tear()];
  R.cu = { yue, tears };
  const camf = cam(S, [[81, [-.092, -.004, .056, .13]], [H.sink, [-.092, -.004, .056, .13]], [H.sink + 1.2, [-.094, -.024, .056, .13]], [89.2, [-.094, -.025, .056, .13]]]);
  return { S, update(t) {
    S.showOnly(['s22']); R.update(t); camf(t); it.yue.show(false); it.rabbitStill.vis = true;
    const sink = eio(seg(t, H.sink, H.sink + 1.1)), low = k(t, H.silence - .4, H.silence + .3);
    let e = { expr: 'hope', blink: 0 };
    if (t >= H.browsFold - .02 && t < H.tears - .02) e = swap(t, H.browsFold, 'hope', 'worry'); else if (t >= H.tears - .02) e = swap(t, H.tears, 'worry', 'despair');
    yue.set({ x: -.095, y: -.09 + HIP.girl - .02 * sink, facing: 1, body: .05 * sink, head: lerp(.2, -.3, sink), hipN: 1.5 * sink, kneeN: -1.5 * sink, hipF: 1.45 * sink, kneeF: -1.45 * sink, shN: lerp(1.15, .9, sink), elN: lerp(-2.3, -2.0, sink), shF: lerp(1.1, .8, sink), elF: lerp(-2.3, -1.8, sink), ...e, blink: e.blink || blinkAt(t, 84.3) });
    // tears: drops slide down the cheeks, two at a time, from the eyes
    const [nx, ny] = yue.neck; const hr = yue.pose.head + yue.pose.body;
    tears.forEach((d, i) => { const t0 = H.tears + .3 + i * .55, u = (t - t0) / .9; d.vis = u > 0 && u < 1; const s = i % 2 ? 1 : -1; const ex = s * yue.rf * .4, ey = yue.rf * 1.05 + yue.rf * .05 - u * yue.rf * .9; d.x = nx + ex * Math.cos(hr) - ey * Math.sin(hr); d.y = ny + ex * Math.sin(hr) + ey * Math.cos(hr); });
    const g = (1 - .6 * low) * flicker(t * (1 + low)); it.rabbitStill.gate = g; S.light.lit = .8 * (1 - .28 * low);
    S.extra = [{ x: it.rabbitStill.x, y: it.rabbitStill.y - .003, z: -.066, r: .06, col: '#ff9050', k: .7 * g + .15 }];
    S.grade = { expo: 1 - .06 * low, vig: .45 + .12 * low };
  } };
};

// ———— s23: a click below; her eyes open; the point of view down the cliff: one light, two, three ————
SHOT.s23 = () => {
  const R = scene('lamp', () => SC.lampRoom()), C = scene('cliff', () => SC.cliff()); C.S.tag = 's23';
  if (!R.cu) SHOT.s22();
  const vill = [['oldman', 'lotus', .05], ['woman', 'star', .1], ['fisher', 'fish', .15]].map(([kind, kindL, u]) => { const F = figure(C.S, C.it.figL, { kind, ppm: 9000, facing: 1, scale: .3 }); const l = poleLantern(C.S, C.it.figL, F, 'near', kindL, .0024, { pole: .006 }); return { F, l, u }; });
  C.first3 = vill;
  const shot = { S: R.S };
  shot.update = t => {
    if (t < 90.2) {
      shot.S = R.S; R.S.showOnly(['s22']); R.update(t); const { yue } = R.cu; R.it.yue.show(false); R.cu.tears.forEach(d => { d.vis = false; }); R.it.rabbitStill.vis = true;
      R.S.cam.x = -.094; R.S.cam.y = -.025 + .008 * k(t, H.eyesOpen, H.eyesOpen + .5); R.S.cam.z = .056; R.S.cam.focus = .13;
      const up = k(t, H.eyesOpen, H.eyesOpen + .5), e = swap(t, H.eyesOpen - .12, 'despair', 'alarm');
      yue.set({ x: -.095, y: -.09 + HIP.girl - .02, facing: 1, body: .05 - .1 * up, head: lerp(-.3, .35, up), hipN: 1.5, kneeN: -1.5, hipF: 1.45, kneeF: -1.45, shN: .9, elN: -2.0, shF: .8, elF: -1.8, ...e });
      const g = .4 * flicker(t); R.it.rabbitStill.gate = g; R.S.light.lit = .8 * .72;
      R.S.extra = [{ x: R.it.rabbitStill.x, y: R.it.rabbitStill.y - .003, z: -.066, r: .06, col: '#ff9050', k: .7 * g + .15 }];
      R.S.grade = { expo: .94, vig: .55 };
    } else {
      shot.S = C.S; C.S.showOnly(['s23']); C.update(t);
      C.S.cam.x = -.12; C.S.cam.y = -.08; C.S.cam.z = .34; C.S.cam.focus = .43;
      C.it.sill.vis = true; C.it.sill.y = -.22;
      C.it.slits.forEach(s => { s.gate = 0; }); C.it.dot.gate = flicker(t);
      const clicks = [H.click1, H.click2, H.click3];
      vill.forEach((v, i) => { const [px, py, dir] = SC.pathAt(v.u + (t - 90.2) * .004); const w = walk((t - 85) * 1.6, .4); v.F.set({ x: px, y: py + HIP[v.F.spec.kind] * .3 + w.bob * .08, facing: dir, ...w, shN: .5, elN: -1.3, expr: 'calm' }); v.l.gate = k(t, clicks[i], clicks[i] + .25) * flicker(t + i); });
      C.S.extra = vill.map(v => ({ x: v.l.x, y: v.l.y - .007, z: -.082, r: .05, col: '#ffb060', k: .7 * v.l.gate }));
      C.S.grade = { expo: 1, vig: .45 };
    }
  };
  return shot;
};

// ———— s24: the path from above: the villagers climb, lighting their lanterns one by one ————
const PATH_KINDS = [['oldman', 'lotus'], ['woman', 'star'], ['fisher', 'fish'], ['granny', 'carp'], ['boy', 'round'], ['mother', 'round'], ['fisher', 'lotus'], ['woman', 'round'], ['oldman', 'star'], ['boy', 'carp']];
function climbers(C) {
  if (C.climbers) return C.climbers;
  C.S.tag = 's24';
  C.climbers = PATH_KINDS.map(([kind, kindL], i) => { if (i < 3 && C.first3) return { ...C.first3[i], u0: .05 + i * .05 }; const F = figure(C.S, C.it.figL, { kind, ppm: 9000, facing: 1, scale: .3 }); const l = poleLantern(C.S, C.it.figL, F, 'near', kindL, .0024, { pole: .006 }); return { F, l, u0: .22 + (i - 3) * .07 }; });
  return C.climbers;
}
function moveClimbers(C, t, t0, lightTimes, speed = .006) {
  const cl = climbers(C);
  cl.forEach((v, i) => { const u = clamp(v.u0 + (t - t0) * speed, 0, .97), [px, py, dir] = SC.pathAt(u); const w = walk((t - 80 + i * .3) * 1.5, .4); v.F.set({ x: px, y: py + HIP[v.F.spec.kind] * .3 + w.bob * .08, facing: dir, ...w, shN: .5, elN: -1.3, expr: i === 5 ? 'hope' : 'calm' }); const tt = lightTimes[i]; v.l.gate = (tt === undefined ? 0 : k(t, tt, tt + .25)) * flicker(t + i); });
  return cl.map(v => ({ x: v.l.x, y: v.l.y - .007, z: -.082, r: .065, col: '#ffb060', k: 1.0 * v.l.gate }));
}
SHOT.s24 = () => {
  const C = scene('cliff', () => SC.cliff()), { S, it } = C; if (!C.first3) SHOT.s23();
  const camf = cam(S, [[92.1, [-.1, -.03, .44, .53]], [97.5, [-.07, -.01, .39, .48]]]);
  const lights = [H.click1, H.click2, H.click3, ...H.pathLights.slice(1)];
  return { S, update(t) {
    S.showOnly(['s23', 's24']); C.update(t); camf(t); it.sill.vis = false;
    it.slits.forEach(s => { s.gate = 0; }); it.dot.gate = flicker(t);
    S.extra = moveClimbers(C, t, 90.2, lights);
    S.light.col = '#d8d4dc';
  } };
};

// ———— s25: the mother at the front of the line lifts her lantern and looks up the tower ————
SHOT.s25 = () => {
  const C = scene('cliff', () => SC.cliff()), { S, it } = C; if (!C.first3) SHOT.s23(); climbers(C); S.tag = 's25';
  const mom = figure(S, it.closeL, { kind: 'mother', ppm: 20000, facing: 1, scale: .3 });
  const ml = poleLantern(S, it.closeL, mom, 'near', 'round', .0018, { pole: .0055 }); ml.gate = 1;
  const [px, py] = SC.pathAt(.56);
  return { S, update(t) {
    S.showOnly(['s23', 's24', 's25']); C.update(t); it.sill.vis = false;
    S.cam.x = px + .004; S.cam.y = py + .024; S.cam.z = -.0; S.cam.focus = .078; S.cam.aper = 1.2;
    const lift = back(seg(t, H.motherLift, H.motherLift + .6), 1.2), look = k(t, H.motherLook, H.motherLook + .5);
    mom.set({ x: px, y: py + HIP.mother * .3, facing: 1, body: -.05, head: .15 + .35 * look, shN: lerp(.5, 2.2, lift), elN: lerp(-1.3, -.3, lift), shF: .3, elF: -.5, expr: look > .5 ? 'hope' : 'worry', blink: blinkAt(t, H.motherLook - .1) });
    ml.rot = .1 * Math.sin(t * 1.2) + pend(t, H.motherLift + .5, .3, 1.1, .9);
    const lights = [H.click1, H.click2, H.click3, ...H.pathLights.slice(1)];
    S.extra = [...moveClimbers(C, t, 90.2, lights), { x: ml.x, y: ml.y - .006, z: -.078, r: .03, col: '#ffb060', k: .6 * flicker(t) }];
    S.light.col = '#dcd4d8';
  } };
};

// ———— s26: A-Yue in the lamp-room window, from outside: she rises and lifts the rabbit lantern high ————
SHOT.s26 = () => {
  const E = scene('lampExt', () => SC.lampRoomExt()), { S, it } = E; S.tag = 's26';
  const lan = rabbitLantern(S, it.figL, it.yue, 'near', .0034, { string: .006 });
  const camf = cam(S, [[100, [-.03, -.07, .12, .22]], [103.2, [-.03, -.062, .12, .22]]]);
  return { S, update(t) {
    S.showOnly(['s26']); E.update(t); camf(t);
    const rise = eio(seg(t, H.rise, H.rise + .7)), lift = back(seg(t, H.liftHigh, H.liftHigh + .55), 1.25), e = swap(t, H.liftHigh + .1, 'alarm', 'joy');
    it.yue.set({ x: -.03, y: -.11 + HIP.girl - .032 * (1 - rise), facing: 1, body: .05 * (1 - rise), head: lerp(.35, .3, rise), hipN: 1.5 * (1 - rise), kneeN: -1.5 * (1 - rise), hipF: 1.45 * (1 - rise), kneeF: -1.45 * (1 - rise), shN: lerp(lerp(.9, .6, rise), 2.9, lift), elN: lerp(-2.0, .15, lift), shF: lerp(lerp(.8, .5, rise), 2.7, lift), elF: lerp(-1.8, .2, lift), ...e });
    lan.rot = pend(t, H.liftHigh + .45, .5, 1.0, .9);
    S.extra = [{ x: lan.x, y: lan.y - .012, z: -.1, r: .05, col: '#ff9050', k: .6 * flicker(t) }, { x: .0, y: -.12, z: -.08, r: .14, col: '#ffb060', k: .35 }];
  } };
};

// ———— s27: the showpiece: dolly out from the tower; the line of lanterns climbs the path and lines the gallery; the fog turns gold ————
SHOT.s27 = () => {
  const C = scene('cliff', () => SC.cliff()), { S, it } = C; if (!C.first3) SHOT.s23(); climbers(C); S.tag = 's27';
  const LH = it.LH();
  const gal = [-.028, -.021, -.014, -.007, 0, .007, .014, .021, .028].map((dx, i) => { const F = figure(S, it.galleryL, { kind: PATH_KINDS[(i + 2) % PATH_KINDS.length][0], ppm: 12000, facing: dx < 0 ? 1 : -1, scale: .16 }); const l = poleLantern(S, it.galleryL, F, 'near', ['round', 'lotus', 'fish', 'star', 'carp', 'round', 'lotus', 'fish', 'star'][i], .0014, { pole: .0035 }); return { F, l, dx }; });
  const gy = .09 + (-.06 + .12 * .78) + .12 * .025 + .12 * .006;
  const camf = cam(S, [[102.9, [.1, .04, .36, .46]], [106, [.08, .035, .44, .54]], [111.1, [.04, .02, .66, .76]]]);
  const lights = [H.click1, H.click2, H.click3, ...H.pathLights.slice(1)];
  return { S, update(t) {
    S.showOnly(['s23', 's24', 's27']); C.update(t); camf(t); it.sill.vis = false;
    it.slits.forEach(s => { s.gate = 0; }); it.dot.gate = flicker(t);
    const ex = moveClimbers(C, t, 90.2, lights, .007);
    gal.forEach((g, i) => { const tt = H.galleryLights[i]; g.F.set({ x: .2 + g.dx, y: gy + HIP[g.F.spec.kind] * .16, facing: g.dx < 0 ? 1 : -1, shN: .5, elN: -1.3, expr: 'hope' }); g.l.gate = k(t, tt, tt + .25) * flicker(t + i); ex.push({ x: g.l.x, y: g.l.y - .004, z: -.106, r: .045, col: '#ffb060', k: 1.0 * g.l.gate }); });
    const sw = k(t, H.swell - .3, H.swell + .6); it.tower.gate = sw * flicker(t); if (sw > 0) ex.push({ x: .2, y: .09 + .12 * .84, z: -.11, r: .09, col: '#ffd090', k: .9 * sw });
    S.bloom.k = .75; S.bloom.k2 = .5; S.extra = ex;
    const warm = k(t, 103, 110); S.light.col = warm < .5 ? '#d8d4dc' : '#e8d4c0'; S.light.lit = .82 + .18 * warm;
    S.grade = { expo: 1 + .08 * sw, vig: .4 };
  } };
};

// ———— s28: the father sees the line of lights; his head turns, he points, he turns the wheel ————
SHOT.s28 = () => {
  const B = scene('boat', () => SC.boatScene()), { S, it } = B;
  const camf = cam(S, [[110.7, [.0, -.01, .22, .306]], [114.7, [.01, -.008, .215, .301]]]);
  return { S, update(t) {
    S.showOnly([]); B.update(t); camf(t);
    const [sw] = S.boatSway; it.boatLayers.forEach(L => { L.oy = sw; L.ox = .3 * sw; });
    const see = k(t, H.fatherSees, H.fatherSees + 1.0), turn = eio(seg(t, H.headTurn, H.headTurn + .5)), pt = back(seg(t, H.pointSea, H.pointSea + .5), 1.2), wt = eio(seg(t, H.wheelTurn, H.wheelTurn + .9));
    it.chain.gate = see * flicker(t);
    const e = swap(t, H.headTurn + .25, 'worry', 'relief');
    it.father.set({ x: 0, y: -.07, facing: 1, body: -.06 - .08 * pt, head: -.1 + .3 * turn, shN: lerp(1.05, 1.0, wt), elN: lerp(-1.0, -1.4, wt), shF: lerp(.95, 1.6, pt) - .9 * pt * wt, elF: lerp(-1.1, .0, pt) - .9 * pt * wt, ...e });
    it.wheel.rot = .2 * Math.sin(t * .8) * (1 - wt) - 1.3 * wt;
    S.extra = [{ x: it.lamp.x, y: it.lamp.y - .006, z: -.07, r: .07, col: '#ffb060', k: .5 * flicker(t) }, { x: .2, y: .0, z: -.09, r: .16, col: '#ffb060', k: .55 * see }];
  } };
};

// ———— s29: the fog thins and slides away; the moon burns through above the lighthouse; the boat's light heads in ————
SHOT.s29 = () => {
  const V = scene('fog', () => SC.village('fog')), { S, it } = V; S.tag = 's29';
  const chain = S.add(S.layers.find(L => L.z === -.112), piece({ w: .3, h: .16, ppm: 4000, color: '#000', finish: false, draw: () => {}, glow: g => { g.fillStyle = '#ffb862'; for (let i = 0; i < 12; i++) { const u = i / 11; g.beginPath(); g.arc(-.1 + u * .2, -.07 + u * .13 + .005 * Math.sin(i * 1.7), .0022, 0, TAU); g.fill(); } } }), { x: .18, y: .06, gate: 0 });
  const camf = cam(S, [[114.3, [.08, .02, .5, .61]], [119, [.07, .03, .5, .61]]]);
  return { S, update(t) {
    S.showOnly(['s29']); chain.vis = true; V.update(t); camf(t);
    it.fog.forEach((f, i) => { const u = ei(seg(t, H.fogOut + (3 - i) * .4, H.fogOut + (3 - i) * .4 + 3.2)); f.it.x = lerp(0, -1.1, u); f.it.y = -.03 + (i) * .012; f.L.alpha = f.a * (1 - .6 * u); });
    const moon = k(t, H.moonBack, H.moonBack + 1.4); it.sky.gate = .15 + .85 * moon;
    S.light.lit = lerp(.82, 1, moon); S.light.col = moon < .5 ? '#d0d8e8' : '#ffd9a8';
    chain.gate = flicker(t); it.lighthouse.gate = flicker(t) * .9;
    it.boats.forEach((b, i) => { b.gate = i === 0 ? 1 : .6; }); it.boats[0].x = lerp(.17, .09, eio(seg(t, H.boatIn - 1, H.boatIn + 2.5))); it.boats[0].y = -.02;
    it.eaveItems.forEach(e => { e.gate = flicker(t + e.x); });
    S.extra = [{ x: .25, y: .11, z: -.112, r: .1, col: '#ffb060', k: .4 }];
    S.grade = { expo: 1 + .05 * moon, vig: .4 - .05 * moon };
  } };
};

// ———— s30: the pier: the boat bumps the pier, the father steps off, the run, the leap, the lift ————
SHOT.s30 = () => {
  const V = scene('night', () => SC.village('night')), { S, it } = V; S.tag = 's30';
  const boatL = S.layer({ z: -.076, trans: .2 });
  let bw; const boat = S.add(boatL, piece({ w: .09, h: .06, ppm: 8000, color: SC.PAL.night.near, finish: { px: 2, rim: .4 }, draw: x => { bw = Wd.boat(x, { cx: 0, y: -.01, L: .05, flip: true }); }, glow: g => { g.fillStyle = '#ffd090'; g.beginPath(); g.arc(bw.lamp.x, bw.lamp.y, bw.lamp.r * 1.3, 0, TAU); g.fill(); g.fillStyle = '#ffb870'; g.fillRect(bw.win.x, bw.win.y, bw.win.w, bw.win.h); } }), { x: .3, y: -.065, gate: 1 });
  const SCL = .6, dad = figure(S, it.figL, { kind: 'father', ppm: 12000, facing: -1, scale: SCL }), mom = figure(S, it.figL, { kind: 'mother', ppm: 12000, facing: 1, scale: SCL }), yue = figure(S, it.figL, { kind: 'girl', ppm: 12000, facing: 1, scale: SCL });
  const lan = rabbitLantern(S, it.figL, yue, 'near', .002, { string: .004 });
  const vill = [['oldman', 'lotus', -.055], ['woman', 'star', -.035], ['fisher', 'fish', -.015]].map(([kind, kindL, x]) => { const F = figure(S, it.figL, { kind, ppm: 10000, facing: 1, scale: SCL }); const l = poleLantern(S, it.figL, F, 'near', kindL, .0036, { pole: .01 }); l.gate = 1; return { F, l, x }; });
  const camf = cam(S, [[118.5, [.07, -.03, .24, .312]], [123.5, [.085, -.028, .2, .272]]]);
  return { S, update(t) {
    S.showOnly(['s30']); boat.vis = true; V.update(t); camf(t); it.sky.gate = 1; it.eaveItems.forEach(e => { e.gate = flicker(t + e.x); });
    const arrive = eo(seg(t, 118.76, H.boatBump)), bump = t > H.boatBump ? .002 * Math.exp(-(t - H.boatBump) * 3) * Math.sin((t - H.boatBump) * 12) : 0;
    boat.x = lerp(.3, .14, arrive) + bump; boat.y = -.062 + .001 * Math.sin(t * 1.1); boat.rot = .02 * Math.sin(t * .9);
    const off = seg(t, H.stepOff, H.stepOff + 1.1), rr = seg(t, H.run, H.leap), lp = seg(t, H.leap, H.lift), lf = k(t, H.lift, H.lift + .5);
    const dw = walk((t - H.stepOff) * 1.6, .5), walking = off > 0 && off < 1;
    dad.set({ vis: t > H.stepOff - .3, x: lerp(.145, .108, eo(off)), y: -.057 + HIP.father * SCL + (walking ? dw.bob * .2 : 0) + (t < H.stepOff + .3 ? .006 * (1 - off * 3) : 0), facing: -1, ...(walking ? dw : {}), shN: lf ? lerp(.6, 2.4, lf) : (walking ? dw.shN : .4), elN: lf ? lerp(-.5, -.6, lf) : (walking ? dw.elN : -.4), shF: lf ? 2.3 : (walking ? dw.shF : .3), elF: lf ? -.6 : -.3, expr: t > H.leap ? 'relief' : 'calm', head: .1 + .2 * lf });
    const mr = run(rr * 3.5), yr = run(rr * 4);
    mom.set({ x: lerp(.01, .09, eo(rr)), y: -.057 + HIP.mother * SCL + (rr > 0 && rr < 1 ? mr.bob * .2 : 0), facing: 1, ...(rr > 0 && rr < 1 ? mr : { shN: .9, elN: -1.0, shF: .6, elF: -.8 }), expr: 'joy', head: .15 });
    const jump = lp > 0 ? Math.sin(Math.min(1, lp) * Math.PI) : 0;
    yue.set({ x: lerp(.03, .115, eo(rr)) + .01 * lp, y: -.057 + HIP.girl * SCL + (rr > 0 && rr < 1 ? yr.bob * .2 : 0) + .02 * jump + .035 * lf, facing: 1, ...(rr > 0 && rr < 1 ? yr : {}), shN: lp > 0 ? 2.6 : .5, elN: lp > 0 ? -.3 : -.6, shF: lp > 0 ? 2.4 : .3, elF: lp > 0 ? -.3 : -.4, hipN: lf ? .8 : (rr > 0 && rr < 1 ? yr.hipN : 0), kneeN: lf ? -1.2 : (rr > 0 && rr < 1 ? yr.kneeN : 0), hipF: lf ? .7 : (rr > 0 && rr < 1 ? yr.hipF : 0), kneeF: lf ? -1.0 : (rr > 0 && rr < 1 ? yr.kneeF : 0), expr: t > H.run ? 'joy' : 'hope', head: .2 });
    lan.rot = .2 * Math.sin(t * 5) * (rr > 0 && rr < 1 ? 1 : .2) + pend(t, H.lift, .5, 1.0, .8);
    vill.forEach((v, i) => { v.F.set({ x: v.x, y: -.057 + HIP[v.F.spec.kind] * SCL, facing: 1, shN: .5, elN: -1.3, expr: 'joy', head: .1 }); v.l.gate = flicker(t + i); });
    S.extra = [{ x: lan.x, y: lan.y - .007, z: -.072, r: .03, col: '#ff9050', k: .4 }, ...vill.map(v => ({ x: v.l.x, y: v.l.y - .012, z: -.072, r: .04, col: '#ffb060', k: .45 })), { x: boat.x + bw.lamp.x, y: boat.y + bw.lamp.y, z: -.076, r: .04, col: '#ffd090', k: .35 }];
  } };
};

// ———— s31: the feast under the moon: three cakes, three hands ————
function feastPose(F, x, facing, hand, reach, expr, t, bl) {
  F.set({ x, y: -.085, facing, hipN: 1.5, kneeN: -1.5, hipF: 1.45, kneeF: -1.45, body: -.05 - .1 * reach, head: -.05 - .15 * reach, shN: lerp(.9, 1.5, reach), elN: lerp(-1.4, -1.2, reach), shF: .8, elF: -1.3, expr, blink: blinkAt(t, bl) });
}
SHOT.s31 = () => {
  const Fe = scene('feast', () => SC.feast()), { S, it } = Fe; S.tag = 's31';
  const camf = cam(S, [[123, [-.005, -.02, .3, .384]], [129, [-.0, -.015, .25, .334]]]);
  const cake = () => piece({ w: .02, h: .02, ppm: 12000, color: '#a07848', finish: { px: 2, rim: .45 }, draw: x => Wd.mooncake(x, 0, 0, .0065) });
  const held = [hold(S, it.propL, it.mother, 'near', cake()), hold(S, it.propL, it.yue, 'near', cake()), hold(S, it.propL, it.father, 'near', cake())]; [it.mother, it.yue, it.father].forEach(F => { F.held.auto = false; });
  return { S, update(t) {
    S.showOnly(['s31']); Fe.update(t); camf(t); S.box = null; it.oldRabbit.vis = false;
    const r = H.cakeHands.map(tt => Math.sin(Math.min(1, seg(t, tt - .5, tt + .9)) * Math.PI));
    feastPose(it.mother, -.085, 1, 0, r[0], 'joy', t, 125.3); feastPose(it.yue, -.0, 1, 1, r[1], 'delight', t, 126.6); feastPose(it.father, .085, -1, 2, r[2], 'relief', t, 124.4);
    H.cakeHands.forEach((tt, i) => { const taken = t > tt + .1; it.cakes[i].vis = !taken; held[i].vis = taken; });
    S.extra = [{ x: it.rabbit.x, y: it.rabbit.y - .012, z: -.064, r: .06, col: '#ff9050', k: .5 * it.rabbit.gate }];
  } };
};

// ———— s32 + s33: the rabbit lantern under the moon; rack focus into warm light; pull out of the box to the lamp on the table ————
function close_() {
  return scene('close', () => {
    const Fe = scene('feast', () => SC.feast()), { S, it } = Fe; if (!it.mother.held) SHOT.s31();
    const camf = cam(S, [[128.5, [.072, -.028, .1, .164]], [H.rackOut, [.074, -.028, .1, .164]], [H.rackOut + 1.2, [.074, -.028, .1, .035]], [H.pullOut, [.074, -.028, .1, .035]], [H.pullOut + 2.5, [.05, -.03, .5, .5]], [H.pullOut + 5.2, [.0, -.03, 1.4, 1.4]], [H.pullOut + 7, [.0, -.03, 1.5, 1.5]]]);
    return { S, update(t) {
      S.showOnly(['s31']); Fe.update(t); camf(t); [it.mother, it.yue, it.father].forEach(F => { F.held.it.vis = true; });
      feastPose(it.mother, -.085, 1, 0, 0, 'joy', t, 0); feastPose(it.yue, -.0, 1, 1, 0, 'delight', t, 0); feastPose(it.father, .085, -1, 2, 0, 'relief', t, 0);
      it.cakes.forEach(c => { c.vis = false; });
      S.box = t >= H.pullOut ? { lit: 1 } : null; it.oldRabbit.vis = t >= H.pullOut;
      const warm = k(t, H.rackOut + .2, H.rackOut + 1.3) * (1 - k(t, H.pullOut, H.pullOut + 1));
      S.bloom.k = .55 + .6 * warm; S.bloom.k2 = .35 + .5 * warm;
      S.extra = [{ x: it.rabbit.x, y: it.rabbit.y - .012, z: -.064, r: .06, col: '#ff9050', k: .55 * it.rabbit.gate }, { x: .3, y: -.12, z: .05, r: .32, col: '#ffb878', k: .75 }];
      S.grade = { expo: 1 + .15 * warm, vig: .4 };
    }, subBottom: t => t > H.pullOut + 3 ? 74 : 64 };
  });
}
SHOT.s32 = close_; SHOT.s33 = close_;
