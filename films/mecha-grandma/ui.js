// Screens and type: the phone chat, the drone HUD, the chrome title, the end card, the old photo frame caption.
// Every function draws and returns the text boxes it drew (screen pixels) so TEXTS can report exactly what is visible.
import { rgba, mix, TAU, W, H } from './cel.js';
const box = (id, text, x0, y0, x1, y1) => ({ id, text, x0, y0, x1, y1 });

// phone chat: bubbles = [{who:'me'|'them', text, t}] shown when lt >= t; header name. Phone at (x, y) scale s (screen 360×640 units)
export function phoneChat(g, e, x, y, s, header, bubbles, lt, o = {}) {
  const out = [];
  g.save(); g.translate(x, y); g.scale(s, s); g.rotate(o.rot ?? 0);
  // body
  g.fillStyle = '#16161e'; g.beginPath(); g.roundRect(-196, -360, 392, 720, 44); g.fill();
  g.strokeStyle = '#3a3a4a'; g.lineWidth = 4; g.stroke();
  // screen
  g.save(); g.beginPath(); g.roundRect(-180, -340, 360, 680, 30); g.clip();
  const bg = o.bg || '#e9edf2'; g.fillStyle = bg; g.fillRect(-180, -340, 360, 680);
  g.fillStyle = '#d6dce4'; g.fillRect(-180, -340, 360, 86);
  g.fillStyle = '#20242c'; g.font = '700 30px "Noto Sans SC"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(header, 0, -290);
  let by = -220;
  for (const b of bubbles) {
    if (lt < b.t) { if (lt > b.t - .6 && b.who === 'them') { g.fillStyle = '#ffffff'; g.beginPath(); g.roundRect(-160, by, 96, 50, 22); g.fill(); for (let k = 0; k < 3; k++) { g.fillStyle = rgba('#6a7080', .4 + .6 * ((Math.floor(lt * 6) + k) % 3 === 0)); g.beginPath(); g.arc(-136 + k * 22, by + 25, 6, 0, TAU); g.fill(); } } break; }
    g.font = '700 34px "Noto Sans SC"'; const tw = g.measureText(b.text).width, bw = tw + 44, bh = 64;
    const pop = Math.min(1, (lt - b.t) * 8), sc = .7 + .3 * pop;
    const bx = b.who === 'me' ? 160 - bw : -160;
    g.save(); g.translate(bx + bw / 2, by + bh / 2); g.scale(sc, sc);
    g.fillStyle = b.who === 'me' ? '#8fe07a' : '#ffffff'; g.beginPath(); g.roundRect(-bw / 2, -bh / 2, bw, bh, 24); g.fill();
    g.fillStyle = '#16181e'; g.textAlign = 'center'; g.fillText(b.text, 0, 2);
    g.restore();
    const M = g.getTransform(), p0 = M.transformPoint(new DOMPoint(bx, by)), p1 = M.transformPoint(new DOMPoint(bx + bw, by + bh));
    out.push(box('chat_' + b.text, b.text, Math.min(p0.x, p1.x), Math.min(p0.y, p1.y), Math.max(p0.x, p1.x), Math.max(p0.y, p1.y)));
    by += bh + 26;
  }
  g.restore();
  if (e) { e.save(); e.setTransform(g.getTransform()); e.fillStyle = rgba('#cfe6ff', .25); e.beginPath(); e.roundRect(-180, -340, 360, 680, 30); e.fill(); e.restore(); }
  g.restore();
  if (o.thumb) { g.save(); g.translate(x, y); g.scale(s, s); o.thumb(g); g.restore(); }
  return out;
}

// drone HUD: red (threat) or green (identified). lines = [text, text]; lt seconds into the shot; track = noise amount
export function hud(g, e, lines, lt, col, o = {}) {
  const out = [];
  g.save();
  // reticle brackets around the target
  const cx = o.cx ?? 960, cy = o.cy ?? 520, rw = o.rw ?? 420, rh = o.rh ?? 340, k = Math.min(1, lt * 3), pulse = .7 + .3 * Math.sin(lt * 14);
  for (const ctx of [g, e]) { if (!ctx) continue;
    ctx.strokeStyle = rgba(col, ctx === g ? .95 : .7 * pulse); ctx.lineWidth = ctx === g ? 5 : 10;
    const ww = rw * (1.4 - .4 * k), hh = rh * (1.4 - .4 * k), L = 70;
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { ctx.beginPath(); ctx.moveTo(cx + sx * ww, cy + sy * (hh - L)); ctx.lineTo(cx + sx * ww, cy + sy * hh); ctx.lineTo(cx + sx * (ww - L), cy + sy * hh); ctx.stroke(); }
  }
  // scan line
  const sy = cy - rh + ((lt * 500) % (rh * 2));
  g.fillStyle = rgba(col, .25); g.fillRect(cx - rw, sy, rw * 2, 8);
  // corner text
  g.font = '700 30px "Barlow SC"'; g.fillStyle = rgba(col, .9); g.textAlign = 'left'; g.textBaseline = 'top';
  g.fillText('SEC-DRN 07 · ' + (o.ok ? 'OK' : 'ALERT'), 60, 50); g.fillText('REC ●', 1740, 50);
  // the message panel
  const px = 120, py = 760;
  g.fillStyle = rgba('#0a0a12', .72); g.fillRect(px - 20, py - 20, 820, 220);
  g.strokeStyle = col; g.lineWidth = 4; g.strokeRect(px - 20, py - 20, 820, 220);
  lines.forEach((t, i) => {
    g.font = `900 ${i ? 58 : 66}px "Noto Sans SC"`; g.fillStyle = i ? '#ffffff' : col; g.textAlign = 'left'; g.textBaseline = 'top';
    g.fillText(t, px, py + i * 92); const w = g.measureText(t).width;
    out.push(box('hud_' + t, t, px, py + i * 92, px + w, py + i * 92 + (i ? 58 : 66)));
    if (e) { e.font = g.font; e.fillStyle = rgba(col, .5); e.textAlign = 'left'; e.textBaseline = 'top'; e.fillText(t, px, py + i * 92); }
  });
  g.restore();
  return out;
}

// chrome title (STYLE §4): sky → white horizon → violet → pink → gold, dark + neon outlines, flicker-on, light sweep, glint
export function chromeTitle(g, e, text, cx, cy, size, lt, o = {}) {
  const chars = [...text], n = chars.length;
  g.save(); g.font = `900 ${size}px "Noto Sans SC"`; g.textBaseline = 'middle'; g.textAlign = 'center';
  const tw = g.measureText(text).width, x0 = cx - tw / 2;
  const flick = i => { const on = (lt * 12 - i * 2); return on < 0 ? 0 : on < 3 ? (Math.floor(on) % 2 ? .3 : 1) : 1; };
  let x = x0;
  for (let i = 0; i < n; i++) {
    const cw = g.measureText(chars[i]).width, a = o.full ? 1 : flick(i);
    if (a > 0) {
      g.save(); g.translate(x + cw / 2, cy); g.transform(1, 0, -.18, 1, 0, 0); g.globalAlpha = a;
      g.lineJoin = 'round'; g.strokeStyle = '#120a24'; g.lineWidth = size * .14; g.strokeText(chars[i], 0, 0);
      g.strokeStyle = o.neon || '#ff3fa4'; g.lineWidth = size * .05; g.strokeText(chars[i], 0, 0);
      const gr = g.createLinearGradient(0, -size * .5, 0, size * .5);
      gr.addColorStop(0, '#6ac8ff'); gr.addColorStop(.46, '#e6f6ff'); gr.addColorStop(.5, '#ffffff'); gr.addColorStop(.53, '#7a4ad0'); gr.addColorStop(.72, '#ff6ab0'); gr.addColorStop(1, '#ffd25a');
      g.fillStyle = gr; g.fillText(chars[i], 0, 0);
      g.restore();
      if (e) { e.save(); e.font = g.font; e.textAlign = 'center'; e.textBaseline = 'middle'; e.translate(x + cw / 2, cy); e.transform(1, 0, -.18, 1, 0, 0); e.globalAlpha = a * .55; e.strokeStyle = o.neon || '#ff3fa4'; e.lineWidth = size * .08; e.strokeText(chars[i], 0, 0); e.restore(); }
    }
    x += cw;
  }
  // light sweep
  const sw = ((lt - (o.sweepAt ?? .6)) / .7);
  if (sw > 0 && sw < 1) { g.save(); g.globalCompositeOperation = 'lighter'; const sx = x0 - 200 + sw * (tw + 400); const gr = g.createLinearGradient(sx - 80, 0, sx + 80, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(sx - 80, cy - size * .6, 160, size * 1.2); g.restore(); }
  g.restore();
  return [box('title_' + text, text, x0, cy - size * .55, x0 + tw, cy + size * .55)];
}
export function glint(e, x, y, s) {
  if (s <= 0) return;
  e.save(); e.globalCompositeOperation = 'lighter'; e.translate(x, y);
  for (const [a, L] of [[0, 160], [Math.PI / 2, 160], [Math.PI / 4, 70], [-Math.PI / 4, 70]]) { e.save(); e.rotate(a); const gr = e.createLinearGradient(-L * s, 0, L * s, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, `rgba(255,255,255,${.95 * Math.min(1, s)})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); e.fillStyle = gr; e.fillRect(-L * s, -3, L * s * 2, 6); e.restore(); }
  e.restore();
}
