// 愚公移山 — entry: the film, or a test sheet with ?test=<name>
const qs = new URLSearchParams(location.search);
const cv = document.getElementById('cv'), g = cv.getContext('2d');
await document.fonts.load('600 46px "Noto Serif SC"', '愚公移山太行王屋'); await document.fonts.load('900 46px "Noto Serif SC"', '愚公移山完');
const TL = await (await fetch('timeline.json')).json();
const ALL = TL.caps.map(c => c[3]).join('') + '愚公移山列子汤问完·';
await document.fonts.load('600 46px "Noto Serif SC"', ALL); await document.fonts.load('900 46px "Noto Serif SC"', ALL);
window.GLYPHS_OK = [...new Set(ALL)].filter(ch => !document.fonts.check('600 46px "Noto Serif SC"', ch));
const TEST = qs.get('test');
if (TEST) {
  const m = await import('./test.js');
  if (m.init) await m.init(qs);
  window.DUR = m.DUR ?? 1; window.render = t => m.test(g, TEST, t, qs); window.READY = true;
} else {
  const m = await import('./film.js');
  await m.init(g, qs);
  window.DUR = m.DUR; window.EV = m.EV; window.TEXTS = m.TEXTS; window.render = t => m.render(g, t); window.READY = true;
}
