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
