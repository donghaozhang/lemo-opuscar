// Model sheet and expression sheet for the two characters (?scene=sheets.model | sheets.expr). Neutral daylight colours.
import { W, H, LWK } from './cel.js';
import { PAL } from './pal.js';
import { head } from './heads.js';
function cell(g, x, y, w, h, label, fn) {
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.fillStyle = '#e6e2ea'; g.fillRect(x, y, w, h); fn(); g.restore();
  g.strokeStyle = '#8a8494'; g.lineWidth = 2; g.strokeRect(x + 1, y + 1, w - 2, h - 2);
  g.fillStyle = '#3a3448'; g.font = '700 30px "Noto Sans SC"'; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(label, x + 14, y + 10);
}
export function model(g, e, t) {
  g.fillStyle = '#cfcad6'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#2a2436'; g.font = '900 40px "Noto Sans SC"'; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText('机甲外婆 · 人物设定 MODEL SHEET', 24, 12);
  const P = PAL.day;
  const items = [['外婆 · 3/4', 'g', 'q', 'neutral'], ['外婆 · 正面', 'g', 'front', 'neutral'], ['阿杰 · 3/4', 'j', 'q', 'neutral'], ['阿杰 · 正面', 'j', 'front', 'neutral']];
  items.forEach(([lab, who, view, expr], i) => cell(g, i * 480, 70, 480, 560, lab, () => { g.translate(i * 480 + 250, 70 + 250); g.scale(1.25, 1.25); head(g, P, who, { view, expr, circles: who === 'j' ? .8 : 0 }); }));
  const sets = [['夜·霓虹', 'night'], ['台灯·暖', 'warm'], ['屏幕·冷', 'mono'], ['黎明', 'dawn']];
  sets.forEach(([lab, k], i) => cell(g, i * 480, 630, 480, 450, '外婆 ' + lab, () => { g.translate(i * 480 + 250, 630 + 220); g.scale(1.05, 1.05); head(g, PAL[k], 'g', { view: 'q', expr: 'tender' }); }));
}
export function expr(g, e, t) {
  g.fillStyle = '#cfcad6'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#2a2436'; g.font = '900 40px "Noto Sans SC"'; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText('机甲外婆 · 表情设定 EXPRESSION SHEET', 24, 12);
  const P = PAL.day;
  const G = [['担心', 'worried'], ['下决心', 'resolute'], ['凶', 'fierce'], ['狡黠', 'sly'], ['慈爱', 'tender'], ['大笑', 'laugh']];
  const J = [['发呆', 'dull'], ['吓一跳', 'startled'], ['愣住', 'stunned'], ['感动', 'moved'], ['开心', 'happy'], ['大笑', 'laugh']];
  G.forEach(([lab, ex], i) => cell(g, i * 320, 66, 320, 500, '外婆 ' + lab, () => { g.translate(i * 320 + 170, 66 + 230); g.scale(1.0, 1.0); head(g, P, 'g', { view: 'q', expr: ex }); }));
  J.forEach(([lab, ex], i) => cell(g, i * 320, 570, 320, 510, '阿杰 ' + lab, () => { g.translate(i * 320 + 170, 570 + 236); g.scale(1.0, 1.0); head(g, P, 'j', { view: 'q', expr: ex, circles: ex === 'dull' ? 1 : .3 }); }));
}
import { mech, drone, lunchbox } from './mech.js';
export function mechs(g, e, t) {
  g.fillStyle = '#cfcad6'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#2a2436'; g.font = '900 40px "Noto Sans SC"'; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText('大黄 · 机甲设定 / 无人机 / 饭盒', 24, 12);
  const P = PAL.day;
  const pilot = gg => { gg.scale(.42, .42); head(gg, P, 'g', { view: 'front', expr: 'resolute', body: true }); };
  cell(g, 0, 66, 640, 1014, '大黄 · 正面', () => { mech(g, e, P, { x: 320, y: 1020, s: 1.3, eyes: 1, beacon: 1, cockpit: pilot, cockLight: .6, armL: { a1: .2, a2: -.1, pose: 'open' }, armR: { a1: -.25, a2: .1, pose: 'fist' } }); });
  cell(g, 640, 66, 640, 1014, '大黄 · 托饭盒 / 迈步', () => {
    const r = mech(g, e, P, { x: 960, y: 1020, s: 1.3, walk: .2, eyes: 1, cockpit: pilot, armL: { a1: .3, a2: -.4, pose: 'fist' }, armR: { a1: -1.3, a2: -.5, pose: 'flat', handAng: -1.57 } });
    lunchbox(g, P, r.handR[0] + 10, r.handR[1] - 70, 1.1, { steam: 0 });
  });
  cell(g, 1280, 66, 640, 500, '无人机 · 警戒 / 护送', () => { drone(g, e, P, 1440, 300, 1.3, { beam: [0, 260] }); drone(g, e, P, 1760, 420, 1.0, { green: true }); });
  cell(g, 1280, 566, 640, 514, '饭盒（红格子布）', () => { lunchbox(g, P, 1600, 860, 2.4, { steam: .3 }); });
}
import { figure } from './people.js';
export function bodies(g, e, t) {
  g.fillStyle = '#cfcad6'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#2a2436'; g.font = '900 40px "Noto Sans SC"'; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText('全身 · 外婆 / 阿杰', 24, 12);
  const P = PAL.day;
  const items = [['外婆 站', 'g', { expr: 'neutral' }], ['外婆 走', 'g', { pose: 'walk', ph: .25, expr: 'resolute', armL: [-.4, .3], armR: [.5, .4] }], ['外婆 端饭盒', 'g', { expr: 'tender', armL: [1.1, .5], armR: [1.0, .6], hold: (gg, R, L) => lunchbox(gg, P, (R[0] + L[0]) / 2, (R[1] + L[1]) / 2 - 60, .9, {}) }],
    ['阿杰 站', 'j', { expr: 'neutral' }], ['阿杰 坐', 'j', { pose: 'sit', expr: 'happy', armL: [.9, .6], armR: [.7, .7] }]];
  items.forEach(([lab, who, o], i) => cell(g, i * 384, 66, 384, 1014, lab, () => { g.translate(i * 384 + 170, 1000); g.scale(.8, .8); figure(g, P, who, o); }));
}
