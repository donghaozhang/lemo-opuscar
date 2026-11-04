// 《深夜翻译官》 — page entry. window.render(t) draws frame t; ?scene=frames.<fn> renders a look-development sheet.
const Q = new URLSearchParams(location.search);
const cv = document.getElementById('c'), g = cv.getContext('2d');
const ZH = '天亮之前全部译完硝酸胶片一点就着您刚才看的就是最后一卷完深夜翻译官摔断一条腿祝你演出顺利消防译毕默';
await Promise.all(['700 40px "Noto Serif SC"', '900 40px "Noto Serif SC"'].map(f => document.fonts.load(f, ZH)));
await Promise.all(['700 40px "Playfair Display SC"', '900 40px "Playfair Display SC"', '400 40px "Old Standard TT"', 'italic 400 40px "Old Standard TT"', '700 40px "Old Standard TT"'].map(f => document.fonts.load(f)));
const film = await import('./film.js');
const mods = {};
window.EV = film.events();
window.SUBS = film.subtitleCues();
window.TEXTS = t => film.texts(t);
window.render = async t => {
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (Q.has('scene')) {
    const [file, fn] = Q.get('scene').split('.');
    const m = mods[file] || (mods[file] = await import('./' + file + '.js'));
    g.fillStyle = '#000'; g.fillRect(0, 0, 1920, 1080);
    await m[fn](g, t, Object.fromEntries(Q)); return;
  }
  if (Q.has('textsOnly')) return;                       // readcheck: texts only, no drawing
  film.renderFilm(g, t);
};
window.DUR = film.DUR;
window.READY = true;
