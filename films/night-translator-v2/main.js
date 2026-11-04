// 《深夜翻译官》 v2 — page entry. window.render(t) draws frame t; ?scene=frames.<fn> renders a look sheet; ?textsOnly=1 for readcheck.
const Q = new URLSearchParams(location.search);
const cv = document.getElementById('c'), g = cv.getContext('2d');
const ZH = '深夜翻译官一卷默片天亮之前一个字也不许错老校硝酸胶片点就着不错您刚看的这正是第千完小校对抓住你马我头在脚跟上天下猫狗别急神魂颠倒倾盆大雨消防译毕：——！。，……「」';
await Promise.all(['700 40px "Noto Serif SC"', '900 40px "Noto Serif SC"', '400 40px "Ma Shan Zheng"'].map(f => document.fonts.load(f, ZH)));
await Promise.all(['700 40px "Playfair Display SC"', '900 40px "Playfair Display SC"', '400 40px "Old Standard TT"', 'italic 400 40px "Old Standard TT"', '700 40px "Old Standard TT"',
  '400 40px "Rye"', '400 40px "Pinyon Script"', '400 40px "UnifrakturMaguntia"'].map(f => document.fonts.load(f)));
const film = await import('./film.js');
const mods = {};
window.EV = film.events();
window.TEXTS = t => film.texts(t);
window.render = async t => {
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (Q.has('scene')) {
    const [file, fn] = Q.get('scene').split('.');
    const m = mods[file] || (mods[file] = await import('./' + file + '.js'));
    g.fillStyle = '#000'; g.fillRect(0, 0, 1920, 1080);
    await m[fn](g, t, Object.fromEntries(Q)); return;
  }
  if (Q.has('textsOnly')) return;
  film.renderFilm(g, t);
};
window.DUR = film.DUR;
window.READY = true;
