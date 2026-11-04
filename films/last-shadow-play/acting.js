// Acting: every puppet's pose as a function of time. Show puppets in cloth units; people in the backstage world (B).
import { clamp, lerp, seg, ss, eo, ei, back, vnoise, hash, TAU } from '/core/lib.js';
import { keys, mixPose, tremor, pendulum } from './rig.js';
import { MREST, DREST, MLEG } from './show.js';
import { GREST, BREST } from './people.js';
import { T, DUR } from './timeline.js';

const E = (t, a, b) => ss(seg(t, a, b));
const GY = 654;                 // Monkey's standing waist height (cloth): ground 900 − legs
const DY = 754;                 // the demon's body origin (hem on the ground)
const sinA = (t, f, a) => Math.sin(t * f * TAU) * a;

// ================= Monkey King =================
const M = {
  lookout: { hF: [26, -46], hB: [-26, 60], bendF: -1, haF: -.4, staff: 1, staffHand: 'B', staffA: .25, head: -.12, legF: -.2, legB: .3, rot: -.06 },
  stand: { hF: [56, 92], hB: [-24, 96], bendF: 1, haF: 0, staff: 1, staffHand: 'F', staffA: -1.2, head: 0, legF: -.06, legB: .08, rot: 0 },
  guard: { hF: [70, 40], hB: [-30, 80], staff: 1, staffHand: 'F', staffA: -.6, head: -.05, legF: -.3, legB: .25, rot: .04 },
  strike: { hF: [96, 10], hB: [-20, 70], staff: 1, staffHand: 'F', staffA: 1.1, head: .05, legF: -.5, legB: .3, rot: .12 },
  raise: { hF: [40, -70], hB: [-30, 40], staff: 1, staffHand: 'F', staffA: -2.6, head: -.2, legF: -.9, legB: .1, rot: -.08 },
  crouch: { hF: [60, 70], hB: [-30, 90], staff: 1, staffHand: 'F', staffA: -.9, head: .1, legF: -.7, legB: .6, rot: .18, waist: .05 },
  tuck: { hF: [30, 40], hB: [-10, 40], staff: 1, staffHand: 'F', staffA: -.3, head: .3, legF: -1.4, legB: 1.2, rot: 0 },
  limp: { hF: [12, 124], hB: [-14, 122], staff: 1, staffHand: 'F', staffA: -.2, head: .45, legF: .05, legB: -.02, rot: 0 },
  pinned: { hF: [60, 90], hB: [-40, 80], staff: 1, staffHand: 'F', staffA: -.4, head: .5, legF: -.6, legB: .5, rot: .3, waist: .1 },
  victory: { hF: [30, -84], hB: [-50, 20], staff: 1, staffHand: 'F', staffA: -2.2, head: -.26, legF: -.1, legB: -.9, rot: -.1 },
  upStaff: { hF: [14, -96], hB: [-40, 60], staff: 1, staffHand: 'F', staffA: 0, head: -.3, legF: -.15, legB: .1, rot: -.06 }
};
export function monkeyPose(t) {
  if (t < T.monkeyIn) return null;
  if (t >= T.outOfLight && t < T.rise) return null;
  let p = { ...MREST, flip: 1 };
  const on = E(t, T.monkeyIn, T.monkeyIn + .5);
  // —— entrance on the cloud, freeze, then the somersault to the right ——
  if (t < T.twist) {
    const base = { ...M.lookout, x: 560, y: 414 };
    const settle = E(t, T.freeze1 + 1.2, T.freeze1 + 2.2);        // after the freeze, lower the hand, look around
    p = { ...p, ...mixPose(base, { ...M.stand, x: 560, y: 414, head: .1 }, settle) };
    p.head += -.15 * E(t, T.freeze1 + 2.6, T.freeze1 + 3.0) * (1 - E(t, T.freeze1 + 3.6, T.freeze1 + 4.0));
    if (on < 1) { p.press = on; }
  } else if (t < T.land1 + .4) {                                  // somersault from the cloud to the right, landing facing left
    const u = seg(t, T.flip1, T.land1), x = lerp(560, 1200, u), y = lerp(414, GY, u) - Math.sin(u * Math.PI) * 220;
    const fl = seg(t, T.flip1 + .05, T.land1 - .1);
    const tw = seg(t, T.twist, T.flip1);                           // anticipation on the twist
    p = { ...p, ...mixPose({ ...M.stand, x: 560, y: 414, rot: -.1 * tw }, { ...M.tuck, x, y }, seg(t, T.twist, T.flip1 + .15)), x, y, rot: fl * TAU };
    if (t >= T.land1) { const l = E(t, T.land1, T.land1 + .4); p = mixPose({ ...M.crouch, x: 1200, y: GY + 26, rot: TAU }, { ...M.stand, x: 1200, y: GY, rot: TAU }, l); p = { ...MREST, ...p, flip: -1, rot: 0, x: 1200, y: GY + 26 * (1 - l) }; }
    if (t < T.land1) p.flip = u > .55 ? -1 : 1;
  } else if (t < T.crouch) {                                      // on the ground at the right, facing left: twirl, watch the maiden, fight
    p = { ...p, ...M.stand, flip: -1, x: 1200, y: GY };
    const tw = seg(t, T.twirl1, T.twirl1 + 1.0); p.staffA = M.stand.staffA + tw * TAU * 2 * (1 - .5 * (1 - eo(tw)));
    // the double-take at the maiden
    p.head += -.22 * E(t, T.headTurn, T.headTurn + .25) * (1 - E(t, T.headTurn + .6, T.headTurn + .9)) + .25 * E(t, T.headTurn + .9, T.headTurn + 1.1) * (1 - E(t, T.headTurn + 1.8, T.headTurn + 2.2));
    p.rot += .12 * E(t, T.eyeFlare - 1.0, T.eyeFlare) * (1 - E(t, T.headSwap, T.headSwap + .8));
    // the fight: hop left and strike four times
    const hits = [[T.hit1, 1200, 1100], [T.hit2, 1100, 1000], [T.hit3, 1000, 1000], [T.hit4, 1000, 1000]];
    for (const [h, x0, x1] of hits) {
      const hop = seg(t, h - .5, h - .05), st = seg(t, h - .12, h), rec = seg(t, h, h + .4);
      if (t >= h - .5 && t < h + .45) {
        p.x = lerp(x0, x1, eo(hop)); p.y = GY - Math.sin(hop * Math.PI) * 30 * (x0 !== x1 ? 1 : .3);
        const sp = mixPose({ ...M.guard }, { ...M.strike }, ei(st));
        p = { ...p, ...mixPose(sp, { ...M.guard }, ss(rec)), x: p.x, y: p.y };
      }
    }
    if (t >= T.hit4 + .45) p = { ...p, ...M.guard, x: 1000, y: GY };
    if (t > T.freeze2 && t < T.freeze2 + .85) { const f = E(t, T.freeze2, T.freeze2 + .12); p = { ...p, ...mixPose(M.strike, M.raise, f), x: 1000, y: GY }; }
    else if (t >= T.freeze2 + .85 && t < T.hit3 - .5) p = { ...p, ...M.raise, x: 1000, y: GY };
    // the master's tremble passes into the puppet
    if (t > T.tremble1 && t < T.tremble1 + .5) { const k = 1 - seg(t, T.tremble1, T.tremble1 + .5); p.x += sinA(t, 11, 5 * k); p.rot += sinA(t, 13, .05 * k); }
  } else if (t < T.land2 + .4) {                                  // crouch, leap over the demon to the left, land facing right
    const c = E(t, T.crouch, T.leap), u = seg(t, T.leap, T.land2), x = lerp(1000, 420, u), y = lerp(GY, GY, u) - Math.sin(u * Math.PI) * 300;
    if (t < T.leap) p = { ...p, ...mixPose(M.guard, M.crouch, c), flip: -1, x: 1000, y: GY + 20 * c };
    else { const fl = seg(t, T.leap + .08, T.land2 - .1); p = { ...p, ...mixPose(M.crouch, M.tuck, E(t, T.leap, T.leap + .2)), flip: -1, x, y, rot: -fl * TAU }; if (u > .5) p.flip = 1; }
    if (t >= T.land2) { const l = E(t, T.land2, T.land2 + .4); p = { ...p, ...mixPose({ ...M.crouch }, { ...M.guard }, l), flip: 1, x: 420, y: GY + 24 * (1 - l), rot: lerp(.2, .04, l) }; }
  } else if (t < T.handOpens) {                                   // the freeze, then the tremor
    p = { ...p, ...M.guard, flip: 1, x: 420, y: GY };
    const k = seg(t, T.tremor, T.tremor + 2.5) * 1.0 + seg(t, T.faceHold, T.handOpens) * .6;
    p.x += sinA(t, 9, 6 * k) + (vnoise(t * 14) - .5) * 8 * k; p.y += sinA(t, 12, 3 * k); p.rot += sinA(t, 10, .06 * k); p.head += sinA(t, 8, .08 * k);
  } else if (t < T.outOfLight) {                                  // the rods slip; the puppet tilts and slides down out of the light
    const s = E(t, T.handOpens, T.fall), f = ei(seg(t, T.fall, T.outOfLight));
    p = { ...p, ...mixPose(M.guard, M.limp, s), flip: 1, x: 420 + 40 * f, y: lerp(GY, GY + 50, s) + 560 * f, rot: lerp(-.1 * s, -1.4, f) };
  } else if (t < T.grab) {                                        // the magic: the shadow rises by itself, weak; then pinned under the giant claw
    const r = eo(seg(t, T.rise, T.riseEnd));
    p = { ...p, ...M.limp, flip: 1, x: lerp(460, 420, r), y: lerp(GY + 560, GY, r), rot: lerp(-1.4, 0, r) + sinA(t, 1.7, .22 * r) };
    p.head = .45 - .3 * E(t, T.riseEnd, T.riseEnd + .6);
    const pin = E(t, T.clawDown, T.clawDown + .4);
    p = { ...p, ...mixPose({ ...p }, { ...M.pinned, x: 420, y: GY + 40 }, pin) };
    if (pin >= 1) { p.rot += sinA(t, 2.5, .05); p.head += sinA(t, 3, .06); }
    p.magic = r;
  } else if (t < T.tap) {                                         // the boy's hands: the jerk, then the flail
    const j = seg(t, T.jerk, T.jerk + .25), jb = seg(t, T.jerk + .25, T.jerk + .6);
    p = { ...p, ...mixPose(M.pinned, M.guard, E(t, T.grab, T.jerk + .3)), flip: 1, x: 420, y: GY + 40 - 90 * eo(j) + 50 * ss(jb) };
    if (t >= T.flail0) {
      const w = t * 14, k = 1 - .35 * seg(t, T.skullHit, T.tap);     // windmill arms, head swinging, hopping backward (left)
      p.hF = [60 + 60 * Math.cos(w) * k, 30 + 70 * Math.sin(w) * k]; p.hB = [-30 + 50 * Math.cos(w + 2) * k, 40 + 60 * Math.sin(w + 2) * k];
      p.bendF = Math.sin(w) > 0 ? 1 : -1; p.staffA = w * .5; p.head = sinA(t, 5, .45 * k); p.rot = sinA(t, 3.1, .15 * k);
      const hops = seg(t, T.flail0, T.flail1); p.x = lerp(420, 320, hops); p.y = GY - Math.abs(Math.sin(hops * Math.PI * 3)) * 26 * k;
      p.legF = -.3 + sinA(t, 6, .3); p.legB = .2 - sinA(t, 6, .3);
    }
    p.y = p.y ?? GY;
  } else if (t < T.land3 + .4) {                                  // the clean somersault to the right
    const c = E(t, T.tap, T.flip2), u = seg(t, T.flip2, T.land3), x = lerp(320, 520, u), y = GY - Math.sin(u * Math.PI) * 300;
    if (t < T.flip2) p = { ...p, ...mixPose(M.guard, M.crouch, c), flip: 1, x: 320, y: GY + 20 * c };
    else { const fl = seg(t, T.flip2 + .05, T.land3 - .08); p = { ...p, ...mixPose(M.crouch, M.tuck, E(t, T.flip2, T.flip2 + .2)), flip: 1, x, y, rot: fl * TAU }; }
    if (t >= T.land3) { const l = E(t, T.land3, T.land3 + .4); p = { ...p, ...mixPose(M.crouch, M.stand, l), flip: 1, x: 520, y: GY + 24 * (1 - l), rot: lerp(.2, 0, l) }; }
  } else if (t < T.victory) {                                     // twirl, the staff to the lamp, the strike
    p = { ...p, ...M.stand, flip: 1, x: 520, y: GY };
    const tw = seg(t, T.twirl2, T.twirlEnd); p.staffA = M.stand.staffA + tw * TAU * 2;
    const up = E(t, T.staffUp, T.staffUp + .6);
    p = { ...p, ...mixPose({ ...p }, { ...M.upStaff, x: 520, y: GY }, up) };
    if (up > 0) { p.staffWorld = 0; p.staffK = 1 + 3.0 * E(t, T.staffUp, T.staffTop); p.staffBlur = 9 * E(t, T.staffUp, T.staffTop); }
    const sw = seg(t, T.whip2, T.strike);
    if (t >= T.whip2) { p.staffWorld = lerp(0, Math.PI * .62, ei(sw)); p.hF = [lerp(14, 70, ei(sw)), lerp(-96, 10, ei(sw))]; p.rot = lerp(-.06, .2, ei(sw)); p.legF = -.5 * ei(sw); }
    if (t >= T.strike) { const r = E(t, T.strike, T.strike + .5); p.staffWorld = Math.PI * .62 + .1 * r; p.hF = [70, 10]; p.rot = .2 - .1 * r; p.staffK = lerp(4.0, 2.4, r); p.staffBlur = lerp(9, 3, r); p.legF = -.5 + .2 * r; }
  } else if (t < T.walkEnd) {                                     // the victory freeze, held through the cheer
    p = { ...p, ...M.victory, flip: 1, x: 520, y: GY, staffK: 1.6, staffBlur: 2 };
    const f = E(t, T.victory, T.victory + .18); p = mixPose({ ...p, ...M.strike, staffWorld: Math.PI * .62, staffK: 2.2, staffBlur: 3, rot: .1 }, p, f); p.staffWorld = f < 1 ? lerp(Math.PI * .62, -.5, f) : -.5;
  } else if (t < T.tilt1 + .5) return null;
  else {                                                          // dawn: raised by the boy, the somersault in place, the landing freeze
    p = { ...p, ...M.stand, flip: 1, x: 760, y: GY, staffA: -1.1 };
    const u = seg(t, T.flip3, T.flip3End), fl = seg(t, T.flip3 + .05, T.flip3End - .08);
    if (t >= T.twist2 && t < T.flip3) p = { ...p, ...mixPose(M.stand, M.crouch, E(t, T.twist2, T.flip3)), y: GY + 16 * E(t, T.twist2, T.flip3) };
    else if (t >= T.flip3 && t < T.flip3End) p = { ...p, ...mixPose(M.crouch, M.tuck, E(t, T.flip3, T.flip3 + .25)), x: lerp(760, 900, u), y: GY - Math.sin(u * Math.PI) * 260, rot: fl * TAU };
    else if (t >= T.flip3End) { const l = E(t, T.flip3End, T.land4); p = { ...p, ...mixPose(M.crouch, M.raise, l), x: 900, y: GY + 24 * (1 - l), rot: lerp(.2, -.08, l) }; }
  }
  // hand tremor (hand-held), stronger under tension; none during the magic (nobody holds it)
  const held = !(t >= T.outOfLight && t < T.grab);
  const tens = (t > T.tremor && t < T.handOpens) ? 0 : 1;
  if (held) { const tr = tremor(t, tens * (t > T.grab && t < T.tap ? 1.8 : 1), 3); p.x += tr.x; p.y += tr.y; p.rot += tr.a; }
  return p;
}
// ================= the demon =================
const D = {
  idle: { hF: [40, 96], hB: [-16, 98], head: 0, rot: 0, basket: 1 },
  claws: { hF: [60, -50], hB: [-36, -64], head: -.15, rot: -.06, basket: 0 },
  lunge: { hF: [100, 30], hB: [-20, 10], head: .12, rot: .25, basket: 0 },
  recoil: { hF: [40, 20], hB: [-50, 40], head: -.25, rot: -.22, basket: 0 },
  down: { hF: [60, 40], hB: [-60, 20], head: -.4, rot: -.9, basket: 0 }
};
export function demonPose(t) {
  if (t < T.maidenIn) return null;
  if (t > T.tattersEnd) return null;
  let p = { ...DREST, flip: -1, x: 620, y: DY, form: t >= T.headSwap + .35 ? 'skull' : 'maiden' };
  const on = E(t, T.maidenIn, T.maidenIn + .5);
  if (t < T.hit1 - .5) {
    const g = eo(seg(t, T.maidenIn, T.maidenIn + 1.7));
    p = { ...p, ...D.idle, x: lerp(250, 760, g), rot: sinA(t, 1.2, .05) * (1 - seg(t, T.headSwap, T.headSwap + .5)), head: sinA(t, .9, .06) };
    if (on < 1) p.press = on;
    p.headSwap = seg(t, T.headSwap, T.headSwap + .6);
    if (t > T.headSwap) p = { ...p, ...mixPose({ ...D.idle }, { ...D.claws }, E(t, T.headSwap + .3, T.headSwap + 1.2)), x: p.x, rot: p.rot - .1 * E(t, T.headSwap + .3, T.headSwap + 1.2) };
  } else if (t < T.leap) {
    p = { ...p, ...D.claws, x: 760 };
    const hits = [[T.hit1, 760, 680], [T.hit2, 680, 620], [T.hit3, 620, 620], [T.hit4, 620, 620]];
    for (const [h, x0, x1] of hits) { if (t >= h - .05 && t < h + .6) { const r = seg(t, h, h + .12), b = seg(t, h + .12, h + .6); p = { ...p, ...mixPose(mixPose(D.claws, D.recoil, eo(r)), D.claws, ss(b)), x: lerp(x0, x1, eo(seg(t, h, h + .3))) }; } }
    if (t >= T.hit4 + .6) { const lu = E(t, T.hit4 + .6, T.hit4 + 1.1); p = { ...p, ...mixPose(D.claws, D.lunge, lu), x: 620 + 80 * lu }; }
    if (t >= T.freeze2 && t < T.hit3 - .05) p = { ...p, ...D.claws, x: 620, rot: sinA(t, 2, .04) };
  } else if (t < T.rise) {
    // knocked back by the leap, falls, rises, turns to face Monkey (now at the left), advances, looms over the empty cloth after the fall
    const kb = seg(t, T.demonBack, T.demonBack + .5), rs = E(t, T.demonBack + 1.2, T.clawsUp);
    p = { ...p, ...mixPose(mixPose(D.lunge, D.down, eo(kb)), D.claws, rs), x: lerp(700, 860, eo(kb)) - 140 * E(t, T.clawsUp, T.tremor), flip: rs > .5 ? -1 : -1 };
    if (t > T.clawsUp) { p.rot += sinA(t, 1.4, .05); p.hF = [60 + sinA(t, 2.2, 10), -50 + sinA(t, 1.7, 8)]; }
    if (t > T.outOfLight) { const lu = E(t, T.outOfLight + .1, T.outOfLight + .7); p = { ...p, ...mixPose(D.claws, { ...D.lunge, hF: [110, 60] }, lu), x: 720 - 160 * lu }; }
  } else if (t < T.grab) {
    // the magic: pulled toward the lamp by nothing: grows and blurs, the claw comes down on Monkey
    const gr = E(t, T.grow, T.growEnd);
    p = { ...p, ...D.lunge, hF: [110, 60], x: lerp(560, 640, gr), sc: 1 + 1.5 * gr, blur: 16 * gr, rot: .25 - .2 * gr, head: .12 };
    const cd = E(t, T.clawDown, T.clawDown + .4); p.hF = [lerp(110, 150, cd), lerp(60, 40, cd) - 40 * cd]; p.rot += .2 * cd; p.hB = [-20 + 30 * cd, 10 - 60 * cd];
    if (cd >= 1) { p.rot += sinA(t, 1.2, .03); }
  } else if (t < T.strike) {
    const sb = eo(seg(t, T.snapBack, T.snapBack + .15));
    p = { ...p, ...D.claws, x: lerp(640, 600, sb), sc: lerp(2.5, 1, sb), blur: 16 * (1 - sb), rot: -.06 };
    if (t >= T.flail0 && t < T.skullHit) { const ch = seg(t, T.flail0, T.skullHit); p.x = lerp(600, 470, ch); p.y = DY - Math.abs(Math.sin(ch * Math.PI * 3)) * 16; p = { ...p, ...mixPose(D.claws, D.lunge, .5 + .5 * Math.sin(ch * Math.PI * 3)), x: p.x, y: p.y }; }
    if (t >= T.skullHit) { const sp = seg(t, T.skullHit, T.skullSpinEnd), st = E(t, T.skullHit, T.skullHit + .4); p.head = eo(sp) * TAU; p.x = lerp(470, 700, st); p.rot = .25 * Math.sin(st * Math.PI); p = { ...p, ...mixPose(D.recoil, D.claws, E(t, T.skullSpinEnd, T.skullSpinEnd + .8)), x: p.x, head: p.head, rot: p.rot }; }
    if (t >= T.skullSpinEnd + .8) { p = { ...p, ...D.claws, x: 700 }; p.hF = [60 + sinA(t, 2.5, 10), -50 + sinA(t, 1.9, 10)]; p.rot = -.06 + sinA(t, 1.3, .04); }
    if (t >= T.whip2) { const r = E(t, T.whip2, T.strike); p.hF = [60, -50 - 40 * r]; p.hB = [-36, -64 - 30 * r]; p.head = -.15 - .3 * r; p.rot = -.06 - .15 * r; }
  } else {
    // struck down: collapses; the skull lifts off into light, the body follows
    const dn = eo(seg(t, T.strike, T.strike + .4));
    p = { ...p, ...mixPose(D.claws, D.down, dn), x: 700 + 40 * dn, y: DY + 50 * dn, headSwap: 0 };
    p.off = { head: seg(t, T.skullOff, T.skullOff + 1.0), body: seg(t, T.skullOff + .4, T.skullOff + 1.5) };
  }
  if (t > T.maidenIn && !(t >= T.outOfLight && t < T.grab)) { const tr = tremor(t, 1, 7); p.x += tr.x; p.y = (p.y ?? DY) + tr.y; p.rot += tr.a; }
  return p;
}
// ================= show scenery state =================
export function sceneryState(t) {
  const st = { mountain: E(t, T.mountain, T.mountain + .5), pine: E(t, T.pine, T.pine + .5), cloud: null, label: null, ground: t >= T.mountain - .2 ? 1 : 0 };
  if (t >= T.cloudIn && t < T.cloudIn + 10) {
    const g = eo(seg(t, T.cloudIn, T.cloudIn + .9)), fl = seg(t, T.cloudFlip, T.cloudFlip + .45);
    const wob = (vnoise(t * 6) - .5) * .25 * (1 - E(t, T.cloudFlip + .5, T.cloudFlip + 1.4));
    const off = seg(t, T.land1 + .5, T.land1 + 1.4);
    st.cloud = { x: lerp(-260, 540, g) - 60 * off, y: 700 + 8 * Math.sin(t * 2) - 40 * off, rot: Math.PI * (1 - back(fl, 1.6)) + wob, sc: 1 + .8 * ei(off), blur: 28 * ei(off), alpha: 1 - ei(off), on: g < 1 ? g : 1 };
    if (off >= 1) st.cloud = null;
  }
  if (t >= T.labelIn && t < T.labelOut + .9) { const up = eo(seg(t, T.labelIn, T.labelIn + .5)), off = seg(t, T.labelOut, T.labelOut + .8); st.label = { x: 960, y: 118, sc: (1 + (1 - up) * 1.3) * (1 + ei(off) * .6), blur: (1 - up) * 24 + off * 24, alpha: (.3 + .7 * up) * (1 - ei(off)) }; }
  return st;
}
// ================= the people (backstage world B) =================
// hold = {F: anchorWorld|null, B: anchorWorld|null} rod anchors the hands hold (world B), set by film.js
const MASTER_EXPR = keys([
  [0, { brow: .05, browY: 0, lid: .25, pupil: [2, 0], mouth: 'line' }],
  [5.4, { brow: .05, browY: 0, lid: .25, pupil: [2, 0], mouth: 'line' }], [5.9, { brow: -.12, browY: 0, lid: .35, pupil: [2, 1], mouth: 'line' }], [7.2, { brow: .02, browY: 0, lid: .25, pupil: [1, 2], mouth: 'line' }],
  [9.4, { brow: -.15, browY: 0, lid: .3, pupil: [1, 2], mouth: 'down' }],
  [20.5, { brow: .08, browY: 0, lid: .2, pupil: [2, 0], mouth: 'line' }], [21.6, { brow: .04, browY: 1, lid: .22, pupil: [2, 0], mouth: 'smile' }],
  [27, { brow: .1, browY: 0, lid: .2, pupil: [3, 0], mouth: 'line' }], [32, { brow: .16, browY: -1, lid: .2, pupil: [3, 0], mouth: 'grim' }],
  [T.tremble1, { brow: .16, browY: -1, lid: .2, pupil: [3, 0], mouth: 'grim' }], [T.tremble1 + .3, { brow: -.15, browY: 0, lid: .32, pupil: [2, 1], mouth: 'grim' }], [T.tremble1 + 1.2, { brow: .1, browY: -1, lid: .22, pupil: [3, 0], mouth: 'grim' }],
  [T.tremor, { brow: .1, browY: -1, lid: .22, pupil: [3, 0], mouth: 'grim' }], [T.tremor + 1.5, { brow: -.25, browY: 0, lid: .36, pupil: [2, 1], mouth: 'grim' }],
  [T.faceHold, { brow: -.3, browY: 0, lid: .5, pupil: [0, 2], mouth: 'grim' }], [T.faceHold + 1.2, { brow: -.34, browY: 0, lid: .62, pupil: [-1, 2], mouth: 'down' }],
  [T.wrist, { brow: -.3, browY: 0, lid: .55, pupil: [-1, 2], mouth: 'down' }],
  [T.grab, { brow: -.3, browY: 0, lid: .55, pupil: [-1, 2], mouth: 'down' }], [T.grab + .6, { brow: -.1, browY: 1, lid: .3, pupil: [3, 0], mouth: 'line' }],
  [T.mime - .4, { brow: -.08, browY: 3, lid: .2, pupil: [3, 0], mouth: 'open' }], [T.flip2, { brow: -.08, browY: 3, lid: .2, pupil: [3, 0], mouth: 'open' }], [T.flip2 + .4, { brow: -.05, browY: 4, lid: .25, pupil: [3, -1], mouth: 'smile' }],
  [T.victory, { brow: -.05, browY: 3, lid: .3, pupil: [3, 0], mouth: 'smile' }], [T.gutter + .3, { brow: -.15, browY: 2, lid: .3, pupil: [2, 0], mouth: 'line' }],
  [T.torch, { brow: -.1, browY: 5, lid: .1, pupil: [3, 0], mouth: 'open' }], [T.torch + .8, { brow: -.05, browY: 3, lid: .3, pupil: [3, 0], mouth: 'smile' }],
  [T.straighten, { brow: 0, browY: 1, lid: .22, pupil: [2, 0], mouth: 'line' }], [T.look, { brow: -.04, browY: 2, lid: .28, pupil: [3, 1], mouth: 'line' }], [T.look + .6, { brow: -.04, browY: 2, lid: .3, pupil: [3, 1], mouth: 'smile' }],
  [T.lampOut, { brow: -.06, browY: 2, lid: .3, pupil: [3, 1], mouth: 'smile' }], [T.taken1, { brow: -.06, browY: 1, lid: .48, pupil: [2, 2], mouth: 'smile' }], [T.walkOff, { brow: 0, browY: 0, lid: .4, pupil: [2, 0], mouth: 'line' }]
]);
const BOY_EXPR = keys([
  [0, { brow: 0, browY: 0, lid: .4, pupil: [-1, 3], mouth: 'line' }],
  [20.8, { brow: 0, browY: 0, lid: .4, pupil: [-1, 3], mouth: 'line' }], [21.3, { brow: 0, browY: 1, lid: .3, pupil: [-4, 0], mouth: 'line' }],
  [T.eyeRoll - .1, { brow: 0, browY: 1, lid: .3, pupil: [-4, 0], mouth: 'line' }], [T.eyeRoll + .2, { brow: -.03, browY: 2, lid: .45, pupil: [-2, -3], mouth: 'down' }],
  [T.sigh, { brow: -.03, browY: 0, lid: .5, pupil: [-2, -3], mouth: 'down' }], [T.sigh + .5, { brow: 0, browY: 0, lid: .4, pupil: [0, 2], mouth: 'down' }],
  [T.rodGiven, { brow: 0, browY: 0, lid: .3, pupil: [2, 0], mouth: 'line' }],
  [T.cloudIn, { brow: -.1, browY: 3, lid: 0, pupil: [4, -1], mouth: 'o' }], [T.cloudFlip + .6, { brow: 0, browY: 1, lid: .1, pupil: [4, 0], mouth: 'line' }],
  [T.freeze1 + .5, { brow: 0, browY: 2, lid: .05, pupil: [4, 0], mouth: 'line' }], [T.land1, { brow: -.02, browY: 3, lid: .05, pupil: [4, 0], mouth: 'smile' }],
  [T.boyO, { brow: -.05, browY: 8, lid: 0, pupil: [4, -1], mouth: 'o' }], [T.hit1, { brow: 0, browY: 4, lid: .05, pupil: [4, 0], mouth: 'grin' }],
  [T.tremble1 + .4, { brow: -.08, browY: 3, lid: .05, pupil: [-2, 1], mouth: 'line' }], [T.tremble1 + 1.4, { brow: 0, browY: 3, lid: .05, pupil: [4, 0], mouth: 'smile' }],
  [T.tremor + .5, { brow: -.1, browY: 3, lid: .05, pupil: [-2, 1], mouth: 'line' }],
  [T.placardYeye, { brow: -.25, browY: 4, lid: 0, pupil: [-3, 1], mouth: 'o' }], [T.placardYeye + 1.0, { brow: -.25, browY: 4, lid: 0, pupil: [4, 0], mouth: 'o' }],
  [T.rise, { brow: -.15, browY: 6, lid: 0, pupil: [4, 0], mouth: 'open' }],
  [T.pupils - .2, { brow: -.15, browY: 6, lid: 0, pupil: [4, 0], mouth: 'open' }], [T.pupils, { brow: -.1, browY: 3, lid: .05, pupil: [-3, 2], mouth: 'line' }], [T.pupils + .5, { brow: -.05, browY: 2, lid: .05, pupil: [4, 2], mouth: 'line' }],
  [T.brows, { brow: .32, browY: -1, lid: .05, pupil: [4, 1], mouth: 'grim' }],
  [T.flail0, { brow: .2, browY: 0, lid: .1, pupil: [4, 1], mouth: 'grim' }], [T.tongue, { brow: .22, browY: -2, lid: .25, pupil: [4, 1], mouth: 'tongue' }],
  [T.tap + .3, { brow: .1, browY: 0, lid: .2, pupil: [-3, 1], mouth: 'line' }], [T.flip2, { brow: .1, browY: 0, lid: .1, pupil: [4, 0], mouth: 'grim' }], [T.land3, { brow: -.05, browY: 4, lid: 0, pupil: [4, 0], mouth: 'grin' }],
  [T.staffUp, { brow: .25, browY: 0, lid: .05, pupil: [3, -3], mouth: 'grin' }], [T.strike, { brow: .3, browY: -1, lid: .05, pupil: [4, 0], mouth: 'grim' }],
  [T.victory, { brow: -.05, browY: 5, lid: 0, pupil: [4, 0], mouth: 'grin' }],
  [T.gutter + .2, { brow: -.1, browY: 4, lid: 0, pupil: [2, -2], mouth: 'o' }], [T.pupils2, { brow: -.05, browY: 2, lid: .3, pupil: [-2, 3], mouth: 'line' }],
  [T.brows2, { brow: -.02, browY: 7, lid: 0, pupil: [-1, 1], mouth: 'open' }], [T.torch, { brow: 0, browY: 4, lid: 0, pupil: [4, 0], mouth: 'grin' }],
  [T.bigGong, { brow: -.05, browY: 5, lid: .2, pupil: [4, 0], mouth: 'grin' }],
  [T.look, { brow: 0, browY: 2, lid: .1, pupil: [1, 0], mouth: 'line' }], [T.lampOut, { brow: -.03, browY: 5, lid: 0, pupil: [1, 1], mouth: 'o' }],
  [T.taken0, { brow: -.03, browY: 3, lid: .05, pupil: [-1, 3], mouth: 'line' }], [T.taken1 + .3, { brow: -.02, browY: 3, lid: .25, pupil: [1, 1], mouth: 'smile' }],
  [T.walkOff, { brow: 0, browY: 1, lid: .2, pupil: [1, 0], mouth: 'smile' }],
  [T.tilt1, { brow: .1, browY: 0, lid: .15, pupil: [4, 0], mouth: 'line' }], [T.land4, { brow: .05, browY: 2, lid: .2, pupil: [4, 0], mouth: 'smile' }]
]);
export const masterExpr = t => MASTER_EXPR(t);
export const boyExpr = t => BOY_EXPR(t);

// The master's body: standing in the prologue and at the hand-over; seated for the show. Returns {x, y, stand, rot, head, headFlip, hF, hB, handF, handB}
export function masterBody(t) {
  const st = t < 11 ? 1 : t < T.straighten ? 0 : E(t, T.straighten, T.straighten + 1.2);
  let x = t < 11 ? 1300 : lerp(1420, 1300, st), y = lerp(640, 486, st);
  let p = { ...GREST, x, y, stand: st, rot: .06, head: 0, headFlip: 1, handF: 'grip', handB: 'grip', hF: null, hB: null, shin: 0 };
  // prologue: the match, the lamp, the jug (hands in world B)
  if (t < 3) { const s = eo(seg(t, T.match - .3, T.match)); p.handF = 'pinch'; p.handB = 'open'; p.hFw = [1190 - 10 * s, 340 - 30 * s]; p.hBw = [1250, 420]; p.matchA = -.5 + .3 * s; }
  else if (t < 7) { const u = E(t, 3.0, 4.0); p.handF = 'pinch'; p.handB = 'open'; p.hFw = [lerp(1180, 1166, u), lerp(310, 200, u)]; p.hBw = [1250, 420]; p.matchA = lerp(-.2, .35, u);
    const sh = seg(t, 5.5, 5.9); if (sh > 0) { p.hFw = [1170 + 40 * Math.sin(sh * Math.PI * 3) * (1 - sh), 200 + 60 * ss(sh)]; p.matchA = .35 + 1.2 * sh; }
    if (t > 5.9) { const k = (1 - seg(t, 6.3, 7)); p.hFw[0] += sinA(t, 8, 4 * k); p.hFw[1] += sinA(t, 11, 3 * k); } }
  else if (t < 11) { const u = E(t, 7.0, 7.6), dn = E(t, 10.1, 10.6); p.handF = 'grip'; p.handB = 'open'; p.hFw = [lerp(1200, 1160, u) + 30 * dn, lerp(300, 150, u) + 220 * dn]; p.jugA = lerp(0, -1.9, u) * (1 - dn) ; p.hBw = [1240, 330 - 20 * u + 120 * dn];
    const tap = seg(t, T.jugTap - .1, T.jugTap + .3); if (tap > 0 && tap < 1) { p.hFw[1] += Math.sin(tap * Math.PI * 2) * 12; p.jugA += Math.sin(tap * Math.PI * 2) * .3; } }
  // seated show: hands follow the rods (film.js fills hFw/hBw when holding); otherwise rest targets
  else if (t < T.handOpens) { p.hFw = null; p.hBw = null;
    if (t >= 20.5 && t < 23.6) { p.head = .04; const w = seg(t, 21.0, 22.2); p.handF = 'open'; p.hFw = [1190 - 40 * Math.sin(w * Math.PI * 2) * (w < 1 ? 1 : 0), 500 - 50 * Math.sin(w * Math.PI)]; p.hBw = [1300, 560]; }
    if (t >= 23.6 && t < 28.2) { p.handF = 'grip'; p.hFw = [1170 - 20 * E(t, 26.0, 26.4), 560]; const c = [T.clap1, T.clap2, T.clap3]; let hb = [1500, 560]; for (const ct of c) { const u = seg(t, ct - .18, ct + .15); if (u > 0 && u < 1) hb = [1500, 560 - 70 * Math.sin(u * Math.PI)]; } p.hBw = hb; p.handB = 'open'; }
    if (t >= T.tremble1 && t < T.tremble1 + .5) { p.tremble = 1 - seg(t, T.tremble1, T.tremble1 + .5); }
    if (t >= T.tremor) { p.tremble = (seg(t, T.tremor, T.tremor + 2.5) * 1.3 + .6 * seg(t, T.faceHold, T.handOpens)); p.head = .12 * E(t, T.faceHold, T.faceHold + .8) + .2 * E(t, T.faceHold + .8, T.handOpens); p.rot = .06 + .1 * E(t, T.faceHold, T.handOpens); }
  }
  else if (t < T.straighten) {
    // the hand opens, the rods slip, hands to the lap, the wrist clutched; hunched
    const op = E(t, T.handOpens, T.handOpens + .3), lap = E(t, T.rodsSlip + .6, T.fall + .6), cl = E(t, T.wrist, T.wrist + .6);
    p.handF = op > .5 ? 'open' : 'grip'; p.handB = cl > .5 ? 'grip' : 'grip';
    p.hFw = [lerp(1080, 1230, lap), lerp(420, 560, lap)]; p.hBw = [lerp(1060, 1290, lap), lerp(470, 600, lap)];
    if (cl > 0) { p.hBw = [lerp(1290, 1250, cl), lerp(600, 560, cl)]; p.hFw = [1230, 560]; }
    p.rot = .16 + .12 * cl; p.head = .2 + .15 * cl; p.tremble = .5 * (1 - lap);
    if (t > T.mime - .3) { const m = E(t, T.mime - .3, T.mime), tw = seg(t, T.mime, T.mime + .5), tp = seg(t, T.tap - .5, T.tap + .4);
      p.rot = .28 - .2 * m; p.head = .35 - .3 * m; p.handB = 'pinch';
      p.hBw = [lerp(1250, 1180, m) - 60 * ss(tp) * (tp < 1 ? 1 : 1), lerp(560, 440, m) + 40 * Math.sin(tp * Math.PI) * 0]; p.hBa = tw * TAU;
      if (t > T.tap + .4) { p.hBw = [1200, 500]; }
      if (t > T.flip2) { p.rot = .08; p.head = -.05; p.hBw = [1240, 520]; p.hFw = [1230, 560]; } }
  } else {
    // stands, reaches for the lamp, hands it over, walks off
    const r = E(t, T.lampLift - .6, T.lampLift), dn = E(t, T.lampLift, T.lampOut), rel = E(t, T.taken1, T.taken1 + .6), wk = seg(t, T.walkOff, T.walkEnd);
    p.handF = 'grip'; p.handB = 'open';
    p.hFw = [lerp(lerp(1240, 1140, r), 1180, dn), lerp(lerp(430, 150, r), 500, dn)];
    p.hBw = [1240, 440 - 30 * dn];
    if (rel > 0) { p.hFw = [lerp(1180, 1250, rel), lerp(500, 540, rel)]; p.handF = 'open'; }
    p.head = .05 - .1 * E(t, T.look, T.look + .5);
    if (wk > 0) { p.x = lerp(1300, 2100, wk); p.walk = wk; p.hFw = [p.x - 60 + 30 * Math.sin(wk * 30), 480]; p.hBw = [p.x + 20, 500]; p.head = .1; }
  }
  return p;
}
export function boyBody(t) {
  // bench (prologue) → walks to a low stool by the cloth's edge while pocketing the phone → stands up to grab the rods
  const mv = 0, up = E(t, T.move, T.move + .7);
  const seated = t < T.move, bench = false;
  let x = lerp(1090, 1100, up), y = lerp(720, 585, up), stand = up;
  let p = { ...BREST, x, y, stand, rot: 0, head: 0, headFlip: 1, handF: 'open', handB: 'open', hFw: null, hBw: null, shin: bench ? .2 : 0, phone: 0, phoneOn: 0, torch: 0, walk: mv > 0 && mv < 1 ? mv : null };
  if (t < T.pocket) {   // on the bench with the phone
    p.phone = 1; p.phoneOn = 1; p.handF = 'pinch'; p.handB = 'pinch'; p.hFw = [1010, 600 + sinA(t, 1.3, 3)]; p.hBw = [1030, 616]; p.head = .35; p.rot = .1;
    if (t > T.beckon) { const l = E(t, 21.3, 21.7); p.head = .35 - .3 * l; p.headFlip = l > .5 ? -1 : 1; }
    const sg = E(t, T.sigh, T.sigh + .35) * (1 - E(t, T.sigh + .5, T.sigh + 1.0)); p.rot += .1 * sg; p.head += .1 * sg;
  } else if (t < T.rodGiven) { const u = E(t, T.pocket, T.pocket + .5); p.phone = 1 - seg(t, T.pocket + .25, T.pocket + .5); p.phoneOn = 0; p.handF = 'pinch'; p.hFw = [x - 80 + 50 * u, lerp(600, 640, u)]; p.hBw = [x - 60, 616]; p.head = .2; }
  else if (t < T.land1 + 1.4) { p.handF = 'grip'; p.handB = 'open'; p.hFw = null; p.hBw = [1040, 640]; const tk = E(t, T.rodGiven, T.rodGiven + .4); p.handF = tk > .5 ? 'grip' : 'open'; if (tk < .5) p.hFw = [1120 - 60 * tk, 580]; }
  else if (t < T.move) { p.hFw = [1020, 600 + sinA(t, .7, 4)]; p.hBw = [1040, 640]; p.head = -.05 - .08 * E(t, T.boyO, T.boyO + .4) + .1 * E(t, T.placardYeye, T.placardYeye + .4) - .15 * E(t, T.rise, T.rise + .5); p.rot = -.04 * E(t, T.boyO, T.boyO + .4);
    if (t > T.placardYeye && t < T.placardYeye + 1.0) p.headFlip = -1;
    if (t > T.brows) { p.rot = -.1 * E(t, T.brows, T.move); } }
  else if (t < T.phoneOut) {
    p.handF = 'grip'; p.handB = 'grip'; p.rot = -.1; p.hFw = null; p.hBw = null;
    const g = E(t, T.move, T.grab); if (g < 1) { p.hFw = [lerp(1020, 900, g), lerp(600, 540, g)]; p.hBw = [lerp(1040, 930, g), lerp(640, 560, g)]; p.handF = 'open'; p.handB = 'open'; }
    p.tense = t > T.flail0 && t < T.tap ? 1 : 0;
    if (t > T.flail0 && t < T.tap) { p.rot = -.1 + sinA(t, 3, .05); }
    if (t > T.staffUp) { p.rot = -.18 * E(t, T.staffUp, T.staffTop); p.head = -.25 * E(t, T.staffUp, T.staffTop) + .2 * E(t, T.whip2, T.strike); }
    if (t > T.victory) { p.rot = -.05; p.head = -.1; }
    if (t > T.gutter) { p.head = -.1 + .2 * E(t, T.pupils2, T.pupils2 + .4) - .15 * E(t, T.brows2, T.brows2 + .3); }
  } else if (t < T.walkEnd) {
    // the phone: out of the pocket, click, raised behind the Monkey King; then the hands take the lamp
    const out = E(t, T.phoneOut, T.phoneOut + .5), up = E(t, T.raised - .4, T.raised + .2), tk = E(t, T.taken0, T.taken1);
    p.handB = 'grip'; p.handF = 'pinch'; p.phone = 1; p.phoneOn = t >= T.click ? 1 : 0; p.torch = t >= T.torch ? 1 : 0;
    p.hFw = [lerp(1130, 1040, up), lerp(560 + 40 * (1 - out), 470, up)]; p.hBw = null;
    if (t > T.straighten) { p.hBw = [1060, 520]; p.hFw = [1040, 470]; p.head = -.1 * E(t, T.look, T.look + .5); }
    if (t > T.look) p.headFlip = -1;
    if (tk > 0) { p.handF = 'open'; p.handB = 'open'; p.phone = 1 - tk; p.torch = 1 - tk; p.hFw = [lerp(1040, 1160, tk), lerp(470, 500, tk)]; p.hBw = [lerp(1060, 1190, tk), lerp(520, 525, tk)]; p.head = -.1 + .15 * tk; }
    if (t > T.taken1 + .3) { p.handF = 'grip'; p.handB = 'grip'; p.hFw = [1160, 500]; p.hBw = [1190, 525]; p.head = .12 + .05 * sinA(t, .5, 1); p.headFlip = t > T.walkOff + 1.5 ? 1 : -1; }
  } else {   // dawn: alone with the Monkey King
    p.handF = 'grip'; p.handB = 'grip'; p.hFw = null; p.hBw = null; p.x = 1100; p.rot = -.06; p.head = -.05;
    if (t > T.twist2 - .2 && t < T.flip3 + .3) p.hFa = seg(t, T.twist2, T.flip3 + .2) * TAU;
  }
  return p;
}
// Lamp states: the oil lamp (I), the match (I), the phone torch (I); plus their world positions in B
export function lights(t) {
  const fl = 1 + .06 * (vnoise(t * 7) - .5) * 2 + .03 * Math.sin(t * 23);
  let lamp = 0;
  if (t >= T.lampOn) { const u = t - T.lampOn; lamp = (u < .45 ? lerp(.1, 1, eo(u / .45)) + .35 * Math.sin(u / .45 * Math.PI) : 1) * fl; }
  if (t >= T.gutter) { const g = seg(t, T.gutter, T.out); lamp = lerp(1, .3, g) * (1 - .55 * g * Math.abs(Math.sin(t * 43)) ) * fl; }
  if (t >= T.out) lamp = .3 * fl * (1 + .5 * (vnoise(t * 11) - .5));
  if (t >= T.walkOff) lamp *= 1 - E(t, T.cricketsOut, T.walkEnd);
  if (t >= T.tilt0) lamp = 0;
  let match = 0;
  if (t >= T.match && t < 5.6) { match = t < T.match + .1 ? seg(t, T.match, T.match + .1) * 1.4 : (.9 + .1 * Math.sin(t * 40)) * (1 + .3 * vnoise(t * 9)); if (t > 5.45) match *= 1 - seg(t, 5.45, 5.6); }
  let torch = 0;
  if (t >= T.torch) { const u = t - T.torch; torch = u < .3 ? lerp(0, 1, eo(u / .3)) + .5 * Math.sin(u / .3 * Math.PI) : 1; }
  if (t >= T.taken0) torch *= 1 - E(t, T.taken0, T.taken1);
  return { lamp, match, torch };
}
// Pendulum chains, pre-simulated over the whole film
export const SIM = (() => {
  const mk = (fn, n, k, c, gain, lim) => pendulum(t => { const p = fn(t); return p ? { x: p.x, y: p.y, a: (p.rot || 0) + (p.head || 0) } : { x: 0, y: 0, a: 0 }; }, 0, DUR, n, k, c, gain, lim);
  const safe = fn => t => { try { return fn(t); } catch (e) { return null; } };
  return { monkeyFeat: mk(safe(monkeyPose), 10, 60, 5, [.0022, .9], .8), monkeyTail: mk(safe(monkeyPose), 9, 40, 4, [.002, .5], .7),
    demonRib: mk(safe(demonPose), 9, 30, 3.5, [.0025, .6], .8),
    masterBeard: mk(safe(masterBody), 6, 50, 5, [.0012, .5], .5), boyTuft: mk(safe(boyBody), 5, 70, 6, [.0016, .6], .6) };
})();
