// sheet.js — model sheet / expression sheet / look tests: ?sheet=expr|model|look&t=…
import { W, H, FB, C, T, makeOut, lutAt } from './px.js';
import { bust, portrait, EXPR } from './face.js';
import { text } from './font.js';
const q = new URLSearchParams(location.search), kind = q.get('sheet');
const fb = new FB(), out = makeOut(document.getElementById('c'));
const mods = { expr: () => import('./sheets/expr.js'), model: () => import('./sheets/model.js'), look: () => import('./sheets/look.js') };
const m = await (mods[kind] || mods.expr)();
window.DUR = 1;
window.render = t => { fb.clear(C.night); m.draw(fb, +(q.get('t') || t)); out.present(fb, lutAt(+(q.get('t') || t)), m.over?.(), null); out.show(); };
window.READY = true;
