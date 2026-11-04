// 《年兽来吃年夜饭》 — page entry: fonts, test pages, then the film (shots.js)
const qs = new URLSearchParams(location.search);
const cv = document.getElementById('cv'), g = cv.getContext('2d');
await document.fonts.load('700 40px "Noto Serif SC"', '年兽来吃年夜饭除夕');
await document.fonts.load('400 40px "Ma Shan Zheng"', '年兽来吃年夜饭新春快乐');
const TEST = qs.get('test');
if (TEST) {
  const m = await import('./sheet.js');
  window.DUR = 1;
  window.render = t => {
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none';
    if (TEST === 'sheet_girl') m.girlSheet(g); else if (TEST === 'sheet_nian') m.nianSheet(g); else if (TEST === 'expr') m.exprSheet(g);
  };
  window.READY = true;
} else {
  const film = await import('./shots.js');
  film.start(g, qs);
}
