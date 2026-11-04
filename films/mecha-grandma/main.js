// 《机甲外婆》 — page entry.
import { canvas, W, H } from './cel.js';
import { makePost } from './post.js';
const qs = new URLSearchParams(location.search);
const [sc, g] = canvas(W, H), [gc, e] = canvas(W, H), [ovc, ov] = canvas(W, H);
const post = makePost(document.getElementById('gl'));
const CJK = '机甲外婆人物设定表情正面夜霓虹台灯暖屏幕冷黎明担心下决心凶狡黠慈爱大笑阿杰发呆吓一跳愣住感动开心';
await Promise.all(['500 40px "Noto Sans SC"', '700 40px "Noto Sans SC"', '900 40px "Noto Sans SC"', '400 40px "ZCOOL QingKe HuangYou"'].map(f => document.fonts.load(f, CJK)));
await Promise.all(['600 40px "Barlow SC"', '700 40px "Barlow SC"', 'italic 800 40px Kanit', 'italic 900 40px Kanit'].map(f => document.fonts.load(f)));
const mods = {};
const film = qs.has('scene') ? null : await import('./film.js');
window.render = async t => {
  for (const x of [g, e]) { x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.filter = 'none'; }
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H); e.fillStyle = '#000'; e.fillRect(0, 0, W, H); ov.clearRect(0, 0, W, H);
  let over = {};
  if (qs.has('scene')) { const [f, fn] = qs.get('scene').split('.'); const m = mods[f] || (mods[f] = await import('./' + f + '.js')); over = (await m[fn](g, e, t, ov)) || {}; }
  else if (qs.has('textsOnly')) return;
  else over = film.renderFilm(g, e, ov, t) || {};
  const fr = Math.round(t * 24);
  post.render(sc, gc, fr, ovc, qs.get('raw') ? { bloom: 0, halo: 0, soft: 0, flick: 0, lift: 0, contrast: 0, fade: 0, sat: 1, tint: [1, 1, 1], scan: 0, grille: 0, bleed: 1, rshift: 0, glow: 0, corner: 0, noiseA: 0, power: 1, track: 0, expo: 1 } : over);
};
if (film) { window.DUR = film.DUR; window.EV = film.events(); window.TEXTS = t => film.texts(t); }
window.READY = true;
