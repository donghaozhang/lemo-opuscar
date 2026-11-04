// ---------- main: paper, compositor, sheets, page contract ----------
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const Q = new URLSearchParams(location.search); window.DBG = Q.get('dbg') || '';
let PAPER_IMG;
window.DUR = TL.DUR;

function clearPaper(c) { c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.shadowBlur = 0; c.drawImage(PAPER_IMG, 0, 0); }

function render(t) {
  TXT = [];
  clearPaper(ctx);
  const sheet = Q.get('sheet');
  if (sheet === 'model') return sheetModel(ctx);
  if (sheet === 'expr') return sheetExpr(ctx);
  if (sheet === 'poses') return sheetPoses(ctx);
  if (sheet === 'lane') return sheetLane(ctx, Q.get('season') || 'summer', Q.get('mode') || 'profile');
  if (typeof renderFilm === 'function') renderFilm(ctx, t);
}
window.render = render;
window.TEXTS = t => { render(t); return TXT.slice(); };

(async () => {
  PAPER_IMG = new Image(); PAPER_IMG.src = 'paper.jpg'; await PAPER_IMG.decode();
  try { await Promise.all([`400 44px ${FONT_HAND}`, `400 40px ${FONT_SERIF}`, `600 88px ${FONT_SERIF}`, `500 26px ${FONT_MONO}`].map(f => document.fonts.load(f, '外公的单车'))); } catch (e) { console.warn('fonts', e); }
  if (typeof buildFilm === 'function') buildFilm();
  window.EV = typeof EVENTS !== 'undefined' ? EVENTS : [];
  window.READY = true;
})();
