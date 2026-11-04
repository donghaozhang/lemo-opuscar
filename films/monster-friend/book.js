// Page turns: the page that fills the screen lifts at its right edge and turns over to the left (its spine is the left edge of the screen), revealing
// the next page beneath. Both pages are snapshots of the composited picture; the turning page is 64 vertical strips, each at its own angle (the paper
// bends: the outer edge lags), enlarged a little by perspective as it lifts; a soft shadow runs ahead of the edge on the page below.
import { W, H } from './crayon.js';
import { ss, clamp } from '/core/lib.js';
const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return { c, g: c.getContext('2d') }; };
export const SNAP_A = mk(), SNAP_B = mk(), TURN = mk();
export function snap(P, glCanvas) { P.g.setTransform(1, 0, 0, 1, 0, 0); P.g.clearRect(0, 0, W, H); P.g.drawImage(glCanvas, 0, 0); }
const D = 5200;
const toS = (x, y, f) => [(x - W / 2) * f + W / 2, (y - H / 2) * f + H / 2];
export function drawTurn(g, u, A, B) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
  g.drawImage(B.c, 0, 0);
  const th = Math.PI * ss(u);
  if (th < 0.002) { g.drawImage(A.c, 0, 0); return; }
  if (th > Math.PI - 0.002) return;
  // shadow on the page below, ahead of the turning edge
  if (th < Math.PI / 2) {
    const ex = W * Math.cos(th); const gr = g.createLinearGradient(ex, 0, ex + 320 * (1 - Math.cos(th)) + 40, 0);
    gr.addColorStop(0, `rgba(40,28,15,${0.38 * Math.sin(th)})`); gr.addColorStop(1, 'rgba(40,28,15,0)'); g.fillStyle = gr; g.fillRect(ex, 0, W - ex, H);
  }
  const N = 64, sw = W / N;
  const ang = x => th - 0.5 * Math.sin(th) * Math.pow(x / W, 1.6);
  for (let i = N - 1; i >= 0; i--) {
    const u0 = W * i / N, u1 = W * (i + 1) / N;
    const aA = ang(u0), aB = ang(u1), am = ang((u0 + u1) / 2);
    if (Math.cos(am) <= 0) continue;   // the back of the page is off-screen (past the spine)
    const hA = u0 * Math.sin(aA), hB = u1 * Math.sin(aB), fA = D / (D - hA), fB = D / (D - hB);
    const [XA, YA0] = toS(u0 * Math.cos(aA), 0, fA), [, YA1] = toS(u0 * Math.cos(aA), H, fA), [XB, YB0] = toS(u1 * Math.cos(aB), 0, fB);
    if (Math.abs(XB - XA) < 0.2) continue;
    g.save();
    g.setTransform((XB - XA) / sw, (YB0 - YA0) / sw, 0, (YA1 - YA0) / H, XA, YA0);
    g.drawImage(A.c, u0, 0, sw, H, 0, 0, sw * 1.04, H);
    const shade = 0.3 * Math.sin(am) * (0.5 + 0.5 * u0 / W);
    g.fillStyle = `rgba(40,28,15,${shade})`; g.fillRect(0, 0, sw * 1.04, H);
    g.restore();
  }
  // the lifted edge catches a little light: a thin pale line along the turning edge
  const aE = ang(W), hE = W * Math.sin(aE), fE = D / (D - hE); const [XE, YE0] = toS(W * Math.cos(aE), 0, fE), [, YE1] = toS(W * Math.cos(aE), H, fE);
  g.strokeStyle = `rgba(255,250,240,${0.5 * Math.sin(th)})`; g.lineWidth = 3; g.beginPath(); g.moveTo(XE, YE0); g.lineTo(XE, YE1); g.stroke();
}
