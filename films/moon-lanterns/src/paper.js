// Paper: textures (fibre grain, pulp mottle), pieces (one cut sheet baked once: colour, cut-outs, finish, silhouette, glow map), text on paper.
// Metre space, y up, origin at the piece's centre. A piece is drawn by the compositor (engine.js) with a per-frame transform.
import { mulberry, TAU } from '/core/lib.js';

export function cv(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }

// —— fibre grain: front-face texture of card stock ——
function makeGrain(n, seed) {
  const c = cv(n, n), x = c.getContext('2d'), R = mulberry(seed), img = x.createImageData(n, n), d = img.data;
  for (let i = 0; i < n * n; i++) { const v = R(); d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v < .5 ? 0 : 255; d[i * 4 + 3] = Math.abs(v - .5) * 26; }
  x.putImageData(img, 0, 0); x.lineCap = 'round';
  for (let i = 0; i < n * 1.4; i++) {
    const px = R() * n, py = R() * n, a = R() * TAU, l = 5 + R() * 22;
    x.strokeStyle = R() < .5 ? 'rgba(40,30,20,.09)' : 'rgba(255,255,255,.14)'; x.lineWidth = .5 + R() * .8;
    x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a + .5) * l * .5, py + Math.sin(a + .5) * l * .5, px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke();
  }
  return c;
}
export const GRAIN = makeGrain(512, 7);

// —— pulp mottle: the flocculent cloud seen when card is backlit; tileable, greyscale around 50 % ——
function makeCloud(n, seed) {
  const R = mulberry(seed), c = cv(n, n), x = c.getContext('2d');
  x.fillStyle = '#808080'; x.fillRect(0, 0, n, n);
  for (const [cnt, rmin, rmax, a] of [[60, 40, 120, .22], [260, 10, 40, .16], [900, 3, 10, .12]]) {
    for (let i = 0; i < cnt; i++) {
      const px = R() * n, py = R() * n, r = rmin + R() * (rmax - rmin), v = R() < .5 ? 0 : 255;
      for (const ox of [-n, 0, n]) for (const oy of [-n, 0, n]) {
        const g = x.createRadialGradient(px + ox, py + oy, 0, px + ox, py + oy, r);
        g.addColorStop(0, `rgba(${v},${v},${v},${a})`); g.addColorStop(1, `rgba(${v},${v},${v},0)`);
        x.fillStyle = g; x.fillRect(px + ox - r, py + oy - r, r * 2, r * 2);
      }
    }
  }
  x.lineCap = 'round';
  for (let i = 0; i < n * 2; i++) {
    const px = R() * n, py = R() * n, a = R() * TAU, l = 6 + R() * 30;
    x.strokeStyle = `rgba(255,255,255,${.05 + R() * .12})`; x.lineWidth = .6 + R();
    x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a + .6) * l * .5, py + Math.sin(a + .6) * l * .5, px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke();
  }
  return c;
}
export const CLOUD = makeCloud(512, 3);
export const CLOUD_M = .09;   // the mottle tile covers 9 cm of paper

// —— drawing helpers in metre space ——
export const cut = (x, fn) => { x.save(); x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000'; x.strokeStyle = '#000'; fn(); x.restore(); };
export function paint(w, h, draw, ppm) {
  const c = cv(w * ppm, h * ppm), x = c.getContext('2d');
  x.setTransform(ppm, 0, 0, -ppm, c.width / 2, c.height / 2);
  draw(x, ppm);
  x.setTransform(1, 0, 0, 1, 0, 0);
  return c;
}
// text on a metric canvas (locally flipped back upright). size in metres
export function text(x, s, px, py, size, font, o = {}) {
  x.save(); x.translate(px, py); x.scale(.001, -.001); if (o.rot) x.rotate(o.rot);
  x.font = `${o.weight || ''} ${size * 1000}px ${font}`.trim(); x.textAlign = o.align || 'center'; x.textBaseline = o.base || 'middle';
  x.fillStyle = o.fill || '#000'; if (o.spacing) x.letterSpacing = `${o.spacing * 1000}px`;
  x.fillText(s, 0, 0); if (o.stroke) { x.lineWidth = o.stroke * 1000; x.strokeStyle = o.fill; x.stroke(); } x.restore();
}
export function vtext(x, s, px, py, size, font, o = {}) { const gap = o.gap ?? 1.08; [...s].forEach((ch, i) => text(x, ch, px, py - i * size * gap, size, font, o)); }

// —— finish: fibre grain, a thin warm rim on the top edge, a dark band under the bottom edge (pixel space) ——
export function finish(c, o = {}) {
  const x = c.getContext('2d'), W = c.width, H = c.height;
  if (o.grain !== false) { x.save(); x.globalCompositeOperation = 'source-atop'; x.globalAlpha = o.grainA ?? .9; x.fillStyle = x.createPattern(GRAIN, 'repeat'); x.fillRect(0, 0, W, H); x.restore(); }
  const band = (dy, col, blur) => {
    const t = cv(W, H), y = t.getContext('2d');
    y.drawImage(c, 0, 0); y.globalCompositeOperation = 'destination-out'; y.drawImage(c, 0, dy);
    y.globalCompositeOperation = 'source-in'; y.fillStyle = col; y.fillRect(0, 0, W, H);
    x.save(); x.globalCompositeOperation = 'source-atop'; if (blur) x.filter = `blur(${blur}px)`; x.drawImage(t, 0, 0); x.restore();
  };
  const px = o.px ?? 3;
  if (o.rim !== 0) band(px, o.rimCol || `rgba(255,236,200,${o.rim ?? .32})`, .6);
  if (o.under !== 0) band(-px, `rgba(0,0,0,${o.under ?? .26})`, .8);
  return c;
}

// A piece: { w, h (m), ppm, color, draw(x, ppm) (fills already set to the paper colour; use cut() for holes), glow(x) (optional: paint the lit holes in their light colour),
//            finish: {…} or false, ax, ay (anchor in metres from the centre; the piece rotates about it and is placed by it) }
export function piece(o) {
  const ppm = o.ppm || 5000;
  const c = paint(o.w, o.h, (x, k) => { x.fillStyle = o.color || '#000'; x.strokeStyle = o.color || '#000'; x.lineCap = x.lineJoin = 'round'; o.draw(x, k); }, ppm);
  if (o.finish !== false) finish(c, { px: Math.max(1.5, ppm * .0006), ...(o.finish || {}) });
  // silhouette for shadows
  const s = cv(c.width, c.height), sx = s.getContext('2d'); sx.drawImage(c, 0, 0); sx.globalCompositeOperation = 'source-in'; sx.fillStyle = '#000'; sx.fillRect(0, 0, s.width, s.height);
  let g = null;
  if (o.glow) g = paint(o.w, o.h, (x, k) => { x.lineCap = x.lineJoin = 'round'; o.glow(x, k); }, ppm);
  return { c, s, g, w: o.w, h: o.h, ppm, ax: o.ax || 0, ay: o.ay || 0, name: o.name || '' };
}
// A piece from an existing canvas (already finished), in metres
export function fromCanvas(c, w, h, o = {}) {
  const s = cv(c.width, c.height), sx = s.getContext('2d'); sx.drawImage(c, 0, 0); sx.globalCompositeOperation = 'source-in'; sx.fillStyle = '#000'; sx.fillRect(0, 0, s.width, s.height);
  return { c, s, g: o.g || null, w, h, ppm: c.width / w, ax: o.ax || 0, ay: o.ay || 0, name: o.name || '' };
}
// a paper strip with text (dark glyphs on a pale strip); the strip grows from an anchor edge (see engine 'reveal')
export function strip(o) {
  const pad = o.pad ?? o.size * .5, w = o.w, h = o.h;
  return piece({
    w, h, ppm: o.ppm || 6000, color: o.paper || '#f1e2bf', name: o.name,
    draw: (x) => {
      x.beginPath(); x.roundRect(-w / 2, -h / 2, w, h, o.r ?? h * .08); x.fill();
      if (o.deckle) { cut(x, () => { const R = mulberry(o.seed || 2); for (let u = -w / 2; u < w / 2; u += .0012) { x.beginPath(); x.arc(u, -h / 2, .0004 + R() * .0008, 0, TAU); x.fill(); x.beginPath(); x.arc(u, h / 2, .0004 + R() * .0008, 0, TAU); x.fill(); } }); }
      if (o.vertical) vtext(x, o.text, 0, h / 2 - pad - o.size * .5, o.size, o.font, { fill: o.ink || '#3a1a10', weight: o.weight, gap: o.gap });
      else text(x, o.text, 0, 0, o.size, o.font, { fill: o.ink || '#3a1a10', weight: o.weight, spacing: o.spacing });
      if (o.seal) {   // a small red seal square with the character cut white
        const [sx, sy, ss, ch] = o.seal; x.fillStyle = '#c8322a'; x.beginPath(); x.roundRect(sx - ss / 2, sy - ss / 2, ss, ss, ss * .08); x.fill();
        text(x, ch, sx, sy + ss * .02, ss * .72, o.font, { fill: '#f7e9d2', weight: o.weight });
      }
    },
    finish: { px: 2.5, rim: .25, under: .22 },
  });
}
