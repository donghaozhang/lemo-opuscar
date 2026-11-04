// 大黄 — an old yellow construction mech; the security drone; the lunchbox. Cel-shaded (flat fill + hard shadow + hard
// highlight + coloured line). Local units: mech origin at the ground between the feet, ≈ 640 units tall; it faces the
// camera in 'front' (a slight 3/4), or screen right in 'side'. Emissive parts (eye lamps, beacon, cockpit light) also go
// onto the glow canvas; the mech's silhouette is stamped black into the glow canvas so neon never bleeds through it.
import { cel, path, poly, line, TAU, rgba, mix, LWK } from './cel.js';
import { lamp } from './fx.js';

const rr = (x, y, w, h, r) => { const p = new Path2D(); p.roundRect(x, y, w, h, r); return p; };
const LWM = 3.2;
function part(g, P, shape, c, o = {}) { return cel(g, shape, { f: c.f, s: c.s, h: c.h, l: c.l, lw: o.lw ?? LWM, so: o.so ?? [-10, -10], ho: o.ho ?? [6, 6], rim: o.rim, sh: o.sh, hi: o.hi, clipFn: o.clipFn }); }
function stripes(g, P, x, y, w, h) {
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.fillStyle = P.stripeK.f;
  for (let k = -2; k < w / 28 + 2; k++) { g.beginPath(); g.moveTo(x + k * 56, y + h); g.lineTo(x + k * 56 + 28, y + h); g.lineTo(x + k * 56 + 28 + h, y); g.lineTo(x + k * 56 + h, y); g.fill(); }
  g.restore(); g.strokeStyle = P.mech.l; g.lineWidth = 2 * LWK.k; g.strokeRect(x, y, w, h);
}
// a hand: palm block + three fingers + thumb. pose 'open' | 'fist' | 'grip' | 'flat' | 'point'; returns the palm centre
function hand(g, P, x, y, ang, pose, s = 1, rim) {
  if (pose === 'tray') {            // palm up, seen from the front: a wide plate with the fingertips curled up at its rim
    g.save(); g.translate(x, y); g.scale(s, s);
    part(g, P, rr(-34, -40, 68, 50, 10), P.mechDark, { so: [-4, -4], lw: 2.4 });
    part(g, P, rr(-78, 0, 156, 34, 14), P.mech, { rim, lw: 2.8 });
    for (let i = 0; i < 4; i++) part(g, P, rr(-70 + i * 38, -18, 26, 30, 9), P.mechGrey, { so: [-3, -3], lw: 2.2 });
    g.restore(); return;
  }
  g.save(); g.translate(x, y); g.rotate(ang); g.scale(s, s);
  const curl = { open: 0, flat: 0, grip: .9, fist: 1.6, point: 1.6 }[pose] ?? 0;
  for (let i = 0; i < 3; i++) {                       // fingers (drawn first, behind the palm when curled)
    const fx = -26 + i * 26, L1 = 36, L2 = 30, c1 = curl * .7, c2 = curl;
    const isPoint = pose === 'point' && i === 2;
    const a1 = isPoint ? 0 : c1, a2 = isPoint ? 0 : c2;
    const p0 = [fx, 40], p1 = [fx + Math.sin(a1) * 0, 40 + Math.cos(a1) * L1], p2 = [p1[0], p1[1] + Math.cos(a1 + a2) * L2];
    const k = Math.min(1, curl);
    const seg = (a, b, w) => { const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, nx = -dy / d * w, ny = dx / d * w; return poly([[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]]); };
    if (curl > .1 && !isPoint) { part(g, P, rr(fx - 12, 36, 24, 34 - k * 10, 8), P.mechGrey, { so: [-3, -3], lw: 2.4 }); }
    else { part(g, P, seg(p0, p1, 12), P.mechGrey, { so: [-3, -3], lw: 2.4 }); part(g, P, seg(p1, p2, 11), P.mechGrey, { so: [-3, -3], lw: 2.4 }); }
  }
  part(g, P, rr(-46, -34, 92, 80, 18), P.mech, { rim, lw: 2.8 });                // palm block
  part(g, P, rr(-40, -10, 80, 12, 4), P.mechDark, { so: [-2, -2], lw: 2 });
  const ta = pose === 'open' || pose === 'flat' ? -.9 : .3;                         // thumb
  g.save(); g.translate(40, 0); g.rotate(ta); part(g, P, rr(-10, -6, 22, 50, 10), P.mechGrey, { so: [-3, -3], lw: 2.4 }); g.restore();
  g.restore();
}
// arm from shoulder (sx, sy): upper angle a1, elbow a2 (radians from straight down), hand pose; returns the wrist point
function arm(g, P, sx, sy, a1, a2, pose, side, rim, handAng) {
  const L1 = 120, L2 = 120;
  const ex = sx + Math.sin(a1) * L1, ey = sy + Math.cos(a1) * L1, wx = ex + Math.sin(a1 + a2) * L2, wy = ey + Math.cos(a1 + a2) * L2;
  const tube = (ax, ay, bx, by, w, c) => { const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy) || 1, nx = -dy / d * w, ny = dx / d * w; part(g, P, poly([[ax + nx, ay + ny], [bx + nx * .85, by + ny * .85], [bx - nx * .85, by - ny * .85], [ax - nx, ay - ny]]), c, { rim, so: [-8, -6] }); };
  tube(sx, sy, ex, ey, 30, P.mechDark);
  // hydraulic piston along the upper arm
  line(g, [[sx + 14, sy + 10], [ex + 10, ey - 10]], P.mechGrey.f, 7); line(g, [[sx + 14, sy + 10], [ex + 10, ey - 10]], P.mechGrey.l, 1.6);
  const elbow = new Path2D(); elbow.arc(ex, ey, 30, 0, TAU); part(g, P, elbow, P.mechGrey, { so: [-5, -5] });
  tube(ex, ey, wx, wy, 38, P.mech);
  part(g, P, rr(wx - 40, wy - 18, 80, 30, 8), P.mechDark, { so: [-4, -4] });
  hand(g, P, wx, wy + 20, handAng ?? (a1 + a2) * .6, pose, 1.15, rim);
  return [wx, wy + 20];
}
// st: x, y (ground), s (scale), view 'front'|'side', walk (phase 0..1, 0 = standing), lean, bob, eyes (0..1 lamp), beacon (0..1),
//     armL/armR: { a1, a2, pose, handAng }, cockpit(g) callback (draws 外婆 inside the dome, local coords centre (0,0) r 70),
//     rim (colour), damage (scuffs), steam
export function mech(g, e, P, st) {
  const s = st.s ?? 1, view = st.view || 'front';
  g.save(); g.translate(st.x, st.y); g.scale(s * (st.flip ?? 1), s);
  const w = st.walk ?? 0, swing = Math.sin(w * TAU), bob = (st.bob ?? 0) + Math.abs(Math.cos(w * TAU)) * -10 * (w ? 1 : 0);
  // ground shadow
  g.save(); g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(0, 4, 220, 28, 0, 0, TAU); g.fill(); g.restore();
  // legs: hips at ±80, -230
  const leg = (hx, ph, near) => {
    const k = Math.sin(ph), lift = Math.max(0, Math.sin(ph + Math.PI / 2)) * 30;
    const kx = hx + k * 26, ky = -130 + bob * .5, fx = hx + k * 46, fy = -lift;
    part(g, P, poly([[hx - 40, -240 + bob], [hx + 40, -240 + bob], [kx + 36, ky], [kx - 36, ky]]), P.mechDark, { so: [-8, -4], rim: st.rim });
    const knee = new Path2D(); knee.arc(kx, ky, 34, 0, TAU); part(g, P, knee, P.mech, { so: [-5, -5] });
    part(g, P, poly([[kx - 40, ky], [kx + 40, ky], [fx + 46, fy - 40], [fx - 46, fy - 40]]), P.mech, { rim: st.rim });
    part(g, P, rr(fx - 70, fy - 46, 140, 46, 12), P.mechDark, { so: [-6, -6] });
    stripes(g, P, fx - 60, fy - 40, 120, 14);
  };
  if (view === 'side') { leg(-30, w * TAU + Math.PI, false); leg(30, w * TAU, true); }
  else { leg(-90, w * TAU + Math.PI, false); leg(90, w * TAU, true); }
  g.translate(0, bob); g.rotate(st.lean ?? 0);
  // back exhausts
  for (const k of [-1, 1]) part(g, P, rr(k * 120 - 18, -600, 36, 110, 10), P.mechGrey, { so: [-4, -4] });
  if (st.steam) for (let i = 0; i < 6; i++) { const u = (st.steam + i / 6) % 1; g.fillStyle = rgba('#e8eef8', .35 * (1 - u)); g.beginPath(); g.arc(-120 + Math.sin(i) * 8, -610 - u * 160, 16 + u * 40, 0, TAU); g.fill(); }
  // far arm (behind the torso)
  const aL = st.armL || { a1: .35, a2: -.2, pose: 'open' }, aR = st.armR || { a1: -.35, a2: .2, pose: 'open' };
  const handL = arm(g, P, -180, -470, aL.a1, aL.a2, aL.pose, -1, st.rim, aL.handAng);
  // torso
  const T = new Path2D(); T.roundRect(-160, -540, 320, 320, 46);
  part(g, P, T, P.mech, { so: [-16, -14], ho: [8, 8], rim: st.rim, clipFn: gg => {
    gg.fillStyle = rgba(P.mech.l, .5); for (const [sx, sy, sr] of [[-120, -280, 10], [96, -510, 7], [130, -300, 12]]) { gg.beginPath(); gg.arc(sx, sy, sr, 0, TAU); gg.fill(); }   // scuffs
    gg.fillStyle = P.mech.s; gg.fillRect(-160, -250, 320, 30); } });
  stripes(g, P, -150, -262, 300, 24);
  // rivets
  g.fillStyle = P.mech.s; for (let i = 0; i < 6; i++) for (const yy of [-528, -238]) { g.beginPath(); g.arc(-130 + i * 52, yy, 5, 0, TAU); g.fill(); }
  // cockpit dome
  const CX = 0, CY = -390, CR = 86;
  const dome = new Path2D(); dome.arc(CX, CY, CR, 0, TAU);
  part(g, P, (() => { const p = new Path2D(); p.arc(CX, CY, CR + 16, 0, TAU); return p; })(), P.mechDark, { so: [-4, -4] });
  g.save(); g.clip(dome);
  g.fillStyle = mix(P.glass.s, '#0a0a18', .55); g.fillRect(CX - CR, CY - CR, CR * 2, CR * 2);
  if (st.cockLight) { const gr = g.createRadialGradient(CX, CY + 40, 10, CX, CY + 40, CR * 1.4); gr.addColorStop(0, rgba('#ffcf80', .6 * st.cockLight)); gr.addColorStop(1, rgba('#ffcf80', 0)); g.fillStyle = gr; g.fillRect(CX - CR, CY - CR, CR * 2, CR * 2); }
  if (st.cockpit) { g.save(); g.translate(CX, CY + 24); st.cockpit(g); g.restore(); }
  g.fillStyle = rgba(P.glass.h, .3); g.beginPath(); g.ellipse(CX - 30, CY - 40, 40, 18, -.6, 0, TAU); g.fill();
  g.fillStyle = rgba('#ffffff', .55); g.beginPath(); g.ellipse(CX - 42, CY - 46, 16, 6, -.6, 0, TAU); g.fill();
  g.restore();
  g.strokeStyle = P.glass.l; g.lineWidth = 3 * LWK.k; g.stroke(dome);
  // head with eye lamps
  part(g, P, rr(-110, -630, 220, 100, 28), P.mech, { rim: st.rim });
  part(g, P, rr(-96, -604, 192, 52, 20), P.mechDark, { so: [-4, -4] });
  const eyes = st.eyes ?? 1;
  for (const k of [-1, 1]) {
    const ex = k * 50, ey = -578, er = 20;
    const E = new Path2D(); E.arc(ex, ey, er, 0, TAU);
    g.fillStyle = eyes > .05 ? mix('#fff4c0', '#ffd23f', .3) : P.mechGrey.s; g.fill(E);
    g.strokeStyle = P.mech.l; g.lineWidth = 2.5 * LWK.k; g.stroke(E);
    if (eyes > .05 && e) { e.save(); e.setTransform(g.getTransform()); lamp(null, e, ex, ey, er * 1.4, '#ffd23f', eyes); e.restore(); }
  }
  // beacon
  part(g, P, rr(-16, -656, 32, 28, 6), P.mechGrey, { so: [-2, -2] });
  const bc = new Path2D(); bc.arc(0, -664, 14, Math.PI, 0); bc.closePath(); g.fillStyle = (st.beacon ?? 0) > .5 ? '#ffb040' : '#b0602a'; g.fill(bc); g.strokeStyle = P.mech.l; g.lineWidth = 2 * LWK.k; g.stroke(bc);
  if ((st.beacon ?? 0) > .5 && e) { e.save(); e.setTransform(g.getTransform()); lamp(null, e, 0, -664, 26, '#ff9a2a', st.beacon); e.restore(); }
  // shoulders + stencil
  for (const k of [-1, 1]) {
    const sp = new Path2D(); sp.roundRect(k * 180 - 64, -520, 128, 96, 30);
    part(g, P, sp, P.mech, { rim: st.rim, so: [-8, -8] });
    if (k === -1) { g.save(); g.fillStyle = P.stripeK.f; g.font = '900 46px "Noto Sans SC"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('大黄', -180, -470); g.restore(); }
  }
  // near arm
  const handR = arm(g, P, 180, -470, aR.a1, aR.a2, aR.pose, 1, st.rim, aR.handAng);
  g.restore();
  // stamp the silhouette black on the glow canvas (neon must not bleed through the mech)
  if (e && st.stamp !== false) { e.save(); e.setTransform(g.getTransform()); e.translate(st.x, st.y); e.scale(s * (st.flip ?? 1), s); e.fillStyle = '#000'; e.fill(T); e.fillRect(-200, -250, 400, 250); e.restore(); }
  const toW = p => [st.x + p[0] * s * (st.flip ?? 1), st.y + (p[1] + bob) * s];
  return { handL: toW(handL), handR: toW(handR), dome: toW([CX, CY]) };
}

// ——— the security drone: lens eye, rotors, a light bar (red = threat, green = escort), a little screen ———
export function drone(g, e, P, x, y, s, o = {}) {
  g.save(); g.translate(x, y); g.scale(s, s); g.rotate(o.tilt ?? 0);
  const col = o.green ? '#4dff9a' : '#ff3a4a';
  for (const k of [-1, 1]) {
    line(g, [[k * 40, -6], [k * 110, -30]], P.drone.l, 9); line(g, [[k * 40, -6], [k * 110, -30]], P.drone.f, 6);
    g.fillStyle = rgba('#cfe0ff', .25); g.beginPath(); g.ellipse(k * 110, -36, 70, 12, 0, 0, TAU); g.fill();
    g.strokeStyle = rgba('#e6f0ff', .4); g.lineWidth = 2; g.beginPath(); g.ellipse(k * 110, -36, 70, 12, 0, 0, TAU); g.stroke();
    cel(g, rr(k * 110 - 10, -44, 20, 16, 4), { f: P.drone.h, l: P.drone.l, lw: 2 });
  }
  const B = new Path2D(); B.ellipse(0, 0, 66, 44, 0, 0, TAU);
  cel(g, B, { f: P.drone.f, s: P.drone.s, so: [-8, -8], h: P.drone.h, ho: [5, 5], l: P.drone.l, lw: 3 });
  cel(g, rr(-50, -30, 100, 12, 5), { f: col, l: P.drone.l, lw: 2 });
  const L = new Path2D(); L.arc(0, 12, 24, 0, TAU);
  cel(g, L, { f: '#101420', l: P.drone.l, lw: 3 });
  g.fillStyle = col; g.beginPath(); g.arc(0, 12, 11, 0, TAU); g.fill(); g.fillStyle = '#ffffff'; g.beginPath(); g.arc(-6, 6, 4, 0, TAU); g.fill();
  if (e) { e.save(); e.setTransform(g.getTransform()); lamp(null, e, 0, 12, 22, col, 1); e.fillStyle = rgba(col, .8); e.fillRect(-50, -30, 100, 12); e.restore(); }
  if (o.beam && e) {                                    // the scan beam: a cone toward the target
    const [bx, by] = o.beam; g.save(); g.globalAlpha = .28; g.fillStyle = col; g.beginPath(); g.moveTo(0, 12); g.lineTo(bx - 120, by); g.lineTo(bx + 120, by); g.fill(); g.restore();
    e.save(); e.setTransform(g.getTransform()); e.globalAlpha = .35; e.fillStyle = col; e.beginPath(); e.moveTo(0, 12); e.lineTo(bx - 120, by); e.lineTo(bx + 120, by); e.fill(); e.restore();
  }
  g.restore();
}

// ——— the lunchbox: a three-tier tin wrapped in the red checked cloth, knot on top, steam ———
export function lunchbox(g, P, x, y, s, o = {}) {
  g.save(); g.translate(x, y); g.scale(s, s); g.rotate(o.tilt ?? 0);
  cel(g, rr(-60, -20, 120, 96, 12), { f: P.tin.f, s: P.tin.s, so: [-8, -6], h: P.tin.h, ho: [4, 4], l: P.tin.l, lw: 2.6 });
  for (const yy of [12, 44]) line(g, [[-60, yy], [60, yy]], P.tin.l, 2);
  // the cloth: wraps the box, knot with two ears on top
  const cloth = poly([[-64, -26], [64, -26], [66, 20], [52, 30], [-52, 30], [-66, 20]]);
  cel(g, cloth, { f: P.cloth.f, s: P.cloth.s, so: [-6, -6], l: P.cloth.l, lw: 2.6, clipFn: gg => {
    gg.strokeStyle = rgba('#ffffff', .55); gg.lineWidth = 5; for (let k = -6; k < 7; k++) { gg.beginPath(); gg.moveTo(k * 20, -30); gg.lineTo(k * 20, 32); gg.stroke(); gg.beginPath(); gg.moveTo(-70, k * 10); gg.lineTo(70, k * 10); gg.stroke(); } } });
  cel(g, [[-14, -26], [-50, -66], [-30, -74, 1], [-4, -34], [4, -34], [30, -74, 1], [50, -66], [14, -26]], { f: P.cloth.f, s: P.cloth.s, so: [-4, -4], h: P.cloth.h, ho: [2, 2], l: P.cloth.l, lw: 2.4 });
  const kn = new Path2D(); kn.ellipse(0, -30, 14, 11, 0, 0, TAU); cel(g, kn, { f: P.cloth.f, s: P.cloth.s, so: [-3, -3], l: P.cloth.l, lw: 2.4 });
  if (o.steam != null) for (let i = 0; i < 3; i++) {
    const u = (o.steam * .6 + i / 3) % 1;
    g.strokeStyle = rgba('#ffffff', .65 * Math.sin(u * Math.PI)); g.lineWidth = 6 - u * 3; g.lineCap = 'round';
    g.beginPath(); for (let k = 0; k <= 8; k++) { const v = k / 8; g.lineTo(-24 + i * 24 + Math.sin(v * 5 + u * 6 + i) * 8, -80 - u * 60 - v * 70); } g.stroke();
  }
  g.restore();
}
