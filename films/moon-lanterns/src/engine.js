// Compositor: a shallow box of parallel paper sheets seen through a small lens, in Canvas2D.
// Per frame, back to front: each layer's pieces are drawn in screen space, lit by the backlight (Gaussian falloff around the light point,
// pulp mottle, translucency per layer), shaded by the soft shadows of the sheets in front, blurred by depth of field, and composited;
// lit holes go into a glow buffer that blooms over the picture. Box framing clips the stack to the cavity and draws the frame and the room.
import { clamp, lerp, vnoise, TAU } from '/core/lib.js';
import { cv, CLOUD, CLOUD_M } from './paper.js';

export const W = innerWidth || 1920, H = innerHeight || 1080;
const FOV = 26 * Math.PI / 180, F = (H / 2) / Math.tan(FOV / 2);   // focal length in px
export const BOX = { w: .56, h: .33, d: .16, rim: .034 };           // the cavity (m) and the wood frame's width

const pool = []; function scratch(i) { if (!pool[i]) pool[i] = cv(W, H); return pool[i]; }
const gBuf = cv(W / 2, H / 2), gBlur = cv(W / 4, H / 4), gBlur2 = cv(W / 8, H / 8);
let cloudPat = null;

const hex = (h, k = 1) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) * k, ((n >> 8) & 255) * k, (n & 255) * k]; };
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

export class Scene {
  constructor(o = {}) {
    this.layers = [];
    this.light = { x: 0, y: .02, z: -.15, r: .16, col: '#ffd7a0', lit: 1, floor: .4, ...(o.light || {}) };   // the backlight: a warm point behind the sky sheet
    this.amb = o.amb ?? .05;                                                                                   // front light on the paper faces (0..1)
    this.cam = { x: 0, y: 0, z: .44, focus: .5, aper: 3, maxCoc: 16, hand: 1, ...(o.cam || {}) };
    this.grade = { expo: 1, fade: 1, vig: .4, sat: 1 };
    this.box = null;            // { lit } when the frame is in the picture (box framing)
    this.bloom = { k: .55, k2: .35, r: 10, r2: 28 };
    this.extra = [];            // per-frame point lights: { x, y, z, r, col, k }
    this.bg = o.bg || '#000';
  }
  layer(o) { const L = { z: 0, trans: .3, alpha: 1, items: [], shadow: true, recv: true, fog: false, lit: 1, ox: 0, oy: 0, ...o }; this.layers.push(L); this.layers.sort((a, b) => a.z - b.z); return L; }
  add(L, p, o = {}) { const it = { p, x: 0, y: 0, rot: 0, sx: 1, sy: 1, gate: 1, alpha: 1, vis: true, reveal: null, tag: this.tag, ...o }; L.items.push(it); return it; }
  // hide every item another shot created (so a frame looks the same whichever worker rendered the shots before it)
  showOnly(tags) { for (const L of this.layers) for (const it of L.items) if (it.tag && !tags.includes(it.tag)) it.vis = false; }

  // world → screen for a sheet at depth z (the camera looks down −z; sheets are parallel to the box front)
  proj(z, cam = this.cam) { const s = F / (cam.z - z); return { s, ox: W / 2 - cam.x * s, oy: H / 2 + cam.y * s }; }
  // the camera with hand-held micro drift
  camAt(t) { const c = this.cam, k = c.hand * .0006; return { ...c, x: c.x + (vnoise(t * .9 + 3) - .5) * 2 * k, y: c.y + (vnoise(t * 1.1 + 17) - .5) * 2 * k }; }

  // draw one item (piece canvas or silhouette) under a projection
  item(x, it, pr, sil = false, dy = 0, sc = 1) {
    const p = it.p, img = sil ? p.s : p.c; if (!img) return;
    const k = pr.s / p.ppm;
    x.setTransform(sc, 0, 0, sc, sc * (pr.ox + it.x * pr.s), sc * (pr.oy - (it.y + dy) * pr.s));
    x.rotate(-it.rot); x.scale(it.sx * k, it.sy * k);
    if (it.reveal) {   // a strip growing from an edge: clip, never squash
      const r = clamp(it.reveal.k), w = img.width, h = img.height; x.beginPath();
      if (it.reveal.from === 'left') x.rect(-w / 2, -h / 2, w * r, h); else if (it.reveal.from === 'right') x.rect(w / 2 - w * r, -h / 2, w * r, h);
      else if (it.reveal.from === 'top') x.rect(-w / 2, -h / 2, w, h * r); else x.rect(-w / 2, h / 2 - h * r, w, h * r);
      x.clip();
    }
    x.drawImage(img, -p.ax * p.ppm - img.width / 2, p.ay * p.ppm - img.height / 2);
  }
  glowItem(x, it, pr, sc = 1) {
    const p = it.p, img = p.g; if (!img) return;
    const k = pr.s / p.ppm;
    x.setTransform(sc, 0, 0, sc, sc * (pr.ox + it.x * pr.s), sc * (pr.oy - it.y * pr.s));
    x.rotate(-it.rot); x.scale(it.sx * k, it.sy * k);
    x.drawImage(img, -p.ax * p.ppm - img.width / 2, p.ay * p.ppm - img.height / 2);
  }
  // screen bounding box of a layer's visible items
  bbox(L, pr) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const it of L.items) { if (!it.vis || it.alpha <= 0) continue; const p = it.p, r = Math.hypot(p.w * it.sx, p.h * it.sy) / 2 + Math.hypot(p.ax, p.ay); const cx = pr.ox + it.x * pr.s, cy = pr.oy - it.y * pr.s, rs = r * pr.s; x0 = Math.min(x0, cx - rs); y0 = Math.min(y0, cy - rs); x1 = Math.max(x1, cx + rs); y1 = Math.max(y1, cy + rs); }
    if (x0 > x1) return null;
    x0 = Math.max(0, Math.floor(x0) - 64); y0 = Math.max(0, Math.floor(y0) - 64); x1 = Math.min(W, Math.ceil(x1) + 64); y1 = Math.min(H, Math.ceil(y1) + 64);
    if (x1 <= x0 || y1 <= y0) return null;
    return [x0, y0, x1 - x0, y1 - y0];
  }
  // the cavity opening at depth z, on screen (box framing)
  cavityRect(z, cam) { const pr = this.proj(z, cam); return [pr.ox - BOX.w / 2 * pr.s, pr.oy - BOX.h / 2 * pr.s, BOX.w * pr.s, BOX.h * pr.s]; }

  render(out, t, o = {}) {
    const cam = this.camAt(t), ctx = out.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.filter = 'none';
    ctx.fillStyle = this.bg; ctx.fillRect(0, 0, W, H);
    const G = gBuf.getContext('2d'); G.setTransform(1, 0, 0, 1, 0, 0); G.globalCompositeOperation = 'source-over'; G.globalAlpha = 1; G.filter = 'none'; G.clearRect(0, 0, W / 2, H / 2);
    const front = this.cavityRect(0, cam);
    if (this.box) this.room(ctx, cam, t);
    const C = scratch(0).getContext('2d'), Lc = scratch(1), L = Lc.getContext('2d'), Li = scratch(2).getContext('2d');
    if (!cloudPat) { cloudPat = C.createPattern(CLOUD, 'repeat'); }
    const lit = this.light.lit, lcol = hex(this.light.col);
    for (let k = 0; k < this.layers.length; k++) {
      const Ly = this.layers[k]; if (Ly.alpha <= 0) continue;
      const pr = this.proj(Ly.z, cam); if (Ly.ox) pr.ox += Ly.ox * pr.s; if (Ly.oy) pr.oy -= Ly.oy * pr.s;
      const bb = this.bbox(Ly, pr); if (!bb) continue;
      const [bx, by, bw, bh] = bb;
      // 1. content
      C.setTransform(1, 0, 0, 1, 0, 0); C.globalCompositeOperation = 'source-over'; C.globalAlpha = 1; C.filter = 'none'; C.clearRect(bx, by, bw, bh);
      C.save(); C.beginPath(); C.rect(bx, by, bw, bh); C.clip();
      for (const it of Ly.items) { if (!it.vis || it.alpha <= 0) continue; C.globalAlpha = it.alpha; this.item(C, it, pr); }
      C.restore();
      // 2. light: backlight through the paper (Gaussian falloff around the light point, pulp mottle) + front ambient + point lights
      Li.setTransform(1, 0, 0, 1, 0, 0); Li.globalCompositeOperation = 'source-over'; Li.globalAlpha = 1; Li.filter = 'none';
      const lp = this.proj(Ly.z, cam), lx = lp.ox + this.light.x * lp.s, ly = lp.oy - this.light.y * lp.s, lr = this.light.r * lp.s * (1 + Math.max(0, Ly.z - this.light.z) * 2);
      const tr = Ly.room ? 0 : Ly.trans * lit * Ly.lit, fl = Ly.floor ?? this.light.floor;
      const g = Li.createRadialGradient(lx, ly, 0, lx, ly, lr * 1.6);
      const c0 = lcol.map(v => v * tr), cf = lcol.map(v => v * tr * fl);
      g.addColorStop(0, rgb(c0)); g.addColorStop(.35, rgb(c0.map((v, i) => lerp(v, cf[i], .25)))); g.addColorStop(.7, rgb(c0.map((v, i) => lerp(v, cf[i], .75)))); g.addColorStop(1, rgb(cf));
      Li.fillStyle = g; Li.fillRect(bx, by, bw, bh);
      if (!Ly.room && tr > .02) {   // mottle, in metre space
        Li.save(); Li.globalCompositeOperation = 'overlay'; Li.globalAlpha = .6 * Math.min(1, tr * 2.2);
        const m = new DOMMatrix(); const ks = pr.s * CLOUD_M / CLOUD.width; m.a = ks; m.d = ks; m.e = pr.ox % (CLOUD.width * ks); m.f = pr.oy % (CLOUD.height * ks); cloudPat.setTransform(m);
        Li.fillStyle = cloudPat; Li.fillRect(bx, by, bw, bh); Li.restore();
      }
      Li.globalCompositeOperation = 'lighter';
      const amb = (Ly.amb ?? this.amb) * 255; Li.fillStyle = rgb([amb, amb * .96, amb * .9]); Li.fillRect(bx, by, bw, bh);
      for (const pl of this.extra) {   // lanterns and lamps: a warm pool on the sheets near them (behind and, weaker, in front)
        const dz = pl.z - Ly.z, w = Ly.room ? 1 : dz >= -0.002 ? 1 / (1 + dz * 60) : .35 / (1 - dz * 80); if (w * pl.k < .01) continue;
        const px = lp.ox + pl.x * lp.s, py = lp.oy - pl.y * lp.s, rr = pl.r * lp.s * (1 + Math.abs(dz) * 6);
        const pg = Li.createRadialGradient(px, py, 0, px, py, rr); const pc = hex(pl.col, pl.k * w * (Ly.room ? 1 : .35 + Ly.trans));
        pg.addColorStop(0, rgb(pc)); pg.addColorStop(.3, rgb(pc, .55)); pg.addColorStop(1, rgb(pc, 0)); Li.fillStyle = pg; Li.fillRect(Math.max(bx, px - rr), Math.max(by, py - rr), Math.min(bw, rr * 2), Math.min(bh, rr * 2));
      }
      Li.globalCompositeOperation = 'source-over';
      // 3. L = C × light, holes kept
      L.setTransform(1, 0, 0, 1, 0, 0); L.globalCompositeOperation = 'source-over'; L.globalAlpha = 1; L.filter = 'none'; L.clearRect(bx, by, bw, bh);
      L.drawImage(scratch(0), bx, by, bw, bh, bx, by, bw, bh);
      L.globalCompositeOperation = 'multiply'; L.drawImage(scratch(2), bx, by, bw, bh, bx, by, bw, bh);
      L.globalCompositeOperation = 'destination-in'; L.drawImage(scratch(0), bx, by, bw, bh, bx, by, bw, bh);
      // 4. soft shadows of the sheets in front (a top spot: the shadow falls a little below the caster, softer with the gap)
      if (Ly.recv) {
        L.globalCompositeOperation = 'source-atop';
        for (let j = k + 1; j < this.layers.length; j++) {
          const Fj = this.layers[j]; const gap = Fj.z - Ly.z; if (gap > .06) break; if (!Fj.shadow || Fj.alpha <= 0) continue;
          const a = .55 * (1 - gap / .06) * Fj.alpha, blur = (1.2 + gap * 220) * (pr.s / 4500); if (a < .03) continue;
          // the casting sheet's silhouettes go into one scratch canvas, blurred once (not once per piece)
          const Sh = scratch(3).getContext('2d'); Sh.setTransform(1, 0, 0, 1, 0, 0); Sh.globalCompositeOperation = 'source-over'; Sh.globalAlpha = 1; Sh.filter = 'none';
          const m = Math.ceil(blur * 3); Sh.clearRect(bx - m, by - m, bw + 2 * m, bh + 2 * m);
          Sh.save(); Sh.beginPath(); Sh.rect(bx - m, by - m, bw + 2 * m, bh + 2 * m); Sh.clip();
          let any = false; for (const it of Fj.items) { if (!it.vis || it.alpha <= 0) continue; this.item(Sh, it, pr, true, -gap * .5); any = true; }
          Sh.restore(); if (!any) continue;
          L.save(); L.beginPath(); L.rect(bx, by, bw, bh); L.clip(); L.globalAlpha = a; L.filter = `blur(${blur.toFixed(1)}px)`;
          L.drawImage(scratch(3), bx - m, by - m, bw + 2 * m, bh + 2 * m, bx - m, by - m, bw + 2 * m, bh + 2 * m);
          L.restore();
        }
        L.globalCompositeOperation = 'source-over';
      }
      // 5. lit holes: the light inside windows and lanterns, gated per item
      L.globalCompositeOperation = 'source-over';
      G.setTransform(.5, 0, 0, .5, 0, 0);
      for (const it of Ly.items) { if (!it.vis || !it.p.g || it.gate <= 0) continue; L.globalAlpha = it.gate * it.alpha; this.glowItem(L, it, pr); G.globalAlpha = it.gate * it.alpha * Ly.alpha * (it.bloom ?? 1); if (G.globalAlpha > .01) this.glowItem(G, it, pr, .5); }
      L.globalAlpha = 1; G.globalAlpha = 1;
      if (Ly.fog) { G.globalCompositeOperation = 'source-over'; G.globalAlpha = Ly.alpha * .6; for (const it of Ly.items) if (it.vis) this.item(G, it, pr, true, 0, .5); G.globalAlpha = 1; }
      G.setTransform(1, 0, 0, 1, 0, 0);
      // 6. composite with depth of field (and the cavity clip in box framing)
      const d = cam.z - Ly.z, coc = clamp(Math.abs(cam.aper * (1 / cam.focus - 1 / d)) * 9, 0, cam.maxCoc);
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (this.box && !Ly.room) { const r = this.cavityRect(Ly.z, cam); ctx.beginPath(); ctx.rect(Math.max(r[0], front[0]), Math.max(r[1], front[1]), Math.min(r[0] + r[2], front[0] + front[2]) - Math.max(r[0], front[0]), Math.min(r[1] + r[3], front[1] + front[3]) - Math.max(r[1], front[1])); ctx.clip(); }
      ctx.globalAlpha = Ly.alpha; if (coc > .35) ctx.filter = `blur(${coc.toFixed(1)}px)`;
      ctx.drawImage(Lc, bx, by, bw, bh, bx, by, bw, bh);
      ctx.restore();
    }
    // 7. bloom from the glow buffer, two radii
    const b1 = gBlur.getContext('2d'), b2 = gBlur2.getContext('2d');
    b1.setTransform(1, 0, 0, 1, 0, 0); b1.globalCompositeOperation = 'source-over'; b1.globalAlpha = 1; b1.clearRect(0, 0, W / 4, H / 4); b1.filter = `blur(${(this.bloom.r / 4).toFixed(1)}px)`; b1.drawImage(gBuf, 0, 0, W / 4, H / 4); b1.filter = 'none';
    b2.setTransform(1, 0, 0, 1, 0, 0); b2.globalCompositeOperation = 'source-over'; b2.globalAlpha = 1; b2.clearRect(0, 0, W / 8, H / 8); b2.filter = `blur(${(this.bloom.r2 / 8).toFixed(1)}px)`; b2.drawImage(gBuf, 0, 0, W / 8, H / 8); b2.filter = 'none';
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter';
    if (this.box) { ctx.beginPath(); ctx.rect(front[0] - 6, front[1] - 6, front[2] + 12, front[3] + 12); ctx.clip(); }
    ctx.globalAlpha = this.bloom.k; ctx.drawImage(gBlur, 0, 0, W, H); ctx.globalAlpha = this.bloom.k2; ctx.drawImage(gBlur2, 0, 0, W, H);
    ctx.restore();
    if (this.box) this.frame(ctx, cam, t);
    // 8. grade: vignette, exposure, fade (every key falls back to its default each frame)
    const gr = { expo: 1, fade: 1, vig: .4, ...(o.grade || this.grade) };
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'multiply';
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * .95); vg.addColorStop(0, 'rgba(255,255,255,1)'); vg.addColorStop(1, rgb([255 * (1 - gr.vig), 255 * (1 - gr.vig), 255 * (1 - gr.vig)]));
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    if (gr.expo < .999) { const e = 255 * gr.expo; ctx.fillStyle = rgb([e, e, e]); ctx.fillRect(0, 0, W, H); }
    if (gr.expo > 1.001) { ctx.globalCompositeOperation = 'lighter'; const e = 255 * (gr.expo - 1); ctx.fillStyle = rgb([e, e * .95, e * .85]); ctx.fillRect(0, 0, W, H); }
    if (gr.fade < .999) { ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = `rgba(0,0,0,${1 - gr.fade})`; ctx.fillRect(0, 0, W, H); }
    ctx.restore();
  }

  // —— box framing: the room and the cavity walls (before the stack) ——
  room(ctx, cam, t) {
    const lit = this.box.lit, pr0 = this.proj(0, cam), prB = this.proj(-BOX.d, cam), prT = this.proj(.7, cam);
    const fr = this.cavityRect(0, cam), bk = this.cavityRect(-BOX.d, cam);
    // the wall behind the table, in the dark; the lamp's spill reaches it faintly
    ctx.fillStyle = '#07060a'; ctx.fillRect(0, 0, W, H);
    // table top: a plane at y = −(BOX.h/2 + rim) from the box front toward the camera
    const yT = -(BOX.h / 2 + BOX.rim + .004), x0 = -1.2, x1 = 1.2;
    const near = this.proj(Math.min(cam.z - .02, .9), cam), far = this.proj(-BOX.d - .02, cam);
    ctx.beginPath(); ctx.moveTo(far.ox + x0 * far.s, far.oy - yT * far.s); ctx.lineTo(far.ox + x1 * far.s, far.oy - yT * far.s); ctx.lineTo(near.ox + x1 * near.s, near.oy - yT * near.s); ctx.lineTo(near.ox + x0 * near.s, near.oy - yT * near.s); ctx.closePath();
    const tg = ctx.createLinearGradient(0, far.oy - yT * far.s, 0, near.oy - yT * near.s); tg.addColorStop(0, '#1a110a'); tg.addColorStop(1, '#0a0705'); ctx.fillStyle = tg; ctx.fill();
    ctx.save(); ctx.clip();   // wood grain
    ctx.strokeStyle = 'rgba(90,60,30,.22)'; ctx.lineWidth = 1.2;
    for (let i = 0; i < 40; i++) { const xx = x0 + (x1 - x0) * (i + .5) / 40 + (vnoise(i * 3.1) - .5) * .04; ctx.beginPath(); ctx.moveTo(far.ox + xx * far.s, far.oy - yT * far.s); ctx.lineTo(near.ox + (xx + (vnoise(i * 7.7) - .5) * .06) * near.s, near.oy - yT * near.s); ctx.stroke(); }
    // spill: warm pool on the table in front of the box
    if (lit > 0) {
      const sp = ctx.createRadialGradient(pr0.ox, fr[1] + fr[3], 0, pr0.ox, fr[1] + fr[3], fr[2] * 1.1);
      sp.addColorStop(0, `rgba(255,190,110,${.55 * lit})`); sp.addColorStop(.4, `rgba(255,170,90,${.22 * lit})`); sp.addColorStop(1, 'rgba(255,160,80,0)');
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = sp; ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
    // cavity: black lining walls between the front opening and the back
    ctx.fillStyle = '#060608';
    const quad = (a, b, c, d) => { ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.lineTo(...c); ctx.lineTo(...d); ctx.closePath(); ctx.fill(); };
    ctx.fillStyle = '#0b0a0c'; quad([fr[0], fr[1]], [fr[0] + fr[2], fr[1]], [bk[0] + bk[2], bk[1]], [bk[0], bk[1]]);                                     // top wall
    ctx.fillStyle = '#121014'; quad([fr[0], fr[1] + fr[3]], [fr[0] + fr[2], fr[1] + fr[3]], [bk[0] + bk[2], bk[1] + bk[3]], [bk[0], bk[1] + bk[3]]);     // floor of the cavity
    ctx.fillStyle = '#0e0c10'; quad([fr[0], fr[1]], [bk[0], bk[1]], [bk[0], bk[1] + bk[3]], [fr[0], fr[1] + fr[3]]); quad([fr[0] + fr[2], fr[1]], [bk[0] + bk[2], bk[1]], [bk[0] + bk[2], bk[1] + bk[3]], [fr[0] + fr[2], fr[1] + fr[3]]);
    ctx.fillStyle = '#000'; ctx.fillRect(bk[0], bk[1], bk[2], bk[3]);
  }
  // the wood frame around the opening (after the stack)
  frame(ctx, cam, t) {
    const lit = this.box.lit, fr = this.cavityRect(0, cam), pr = this.proj(0, cam), rim = BOX.rim * pr.s, pf = this.proj(.012, cam), rf = pf.s * BOX.rim;
    const ox = fr[0] - rim, oy = fr[1] - rim, ow = fr[2] + 2 * rim, oh = fr[3] + 2 * rim;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.beginPath(); ctx.rect(ox, oy, ow, oh); ctx.rect(fr[0], fr[1], fr[2], fr[3]); ctx.fillStyle = '#2a1a0e'; ctx.fill('evenodd');
    ctx.beginPath(); ctx.rect(ox, oy, ow, oh); ctx.rect(fr[0], fr[1], fr[2], fr[3]); ctx.clip('evenodd');
    // bevel: top and left lighter, bottom darker; the lamp's own light warms the inner edge
    const bevel = ctx.createLinearGradient(ox, oy, ox, oy + oh); bevel.addColorStop(0, '#4a3220'); bevel.addColorStop(.5, '#2e1d10'); bevel.addColorStop(1, '#1a1008'); ctx.fillStyle = bevel; ctx.fillRect(ox, oy, ow, oh);
    ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 2; ctx.strokeRect(ox + 1, oy + 1, ow - 2, oh - 2);
    if (lit > 0) { const ig = ctx.createLinearGradient(0, fr[1], 0, fr[1] + fr[3]); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,180,100,${.35 * lit})`; ctx.lineWidth = Math.max(2, rim * .18); ctx.strokeRect(fr[0] - 1, fr[1] - 1, fr[2] + 2, fr[3] + 2); }
    ctx.restore();
  }
}

// —— helpers for shots ——
export const lampStagger = (t, t0, n, i, dt = .4) => clamp((t - t0 - i * dt / Math.max(1, n - 1)) / .5);   // 0→1 per layer index, far first
export const flicker = t => 1 + .06 * Math.sin(7.3 * t) * Math.sin(3.1 * t);
