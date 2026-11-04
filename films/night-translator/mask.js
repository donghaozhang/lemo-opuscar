// The one colour: the proof-reader's red ink. Anything drawn through red() goes into the tonal frame as a mid-dark
// grey (so it inks and reads in black-and-white) and into the colour mask in red with the same transform; FilmPost
// keeps the hue where the mask has alpha. film.js sets the mask context for each frame (null = no mask).
export const RED = '#b0281d';
let M = null, A = 1;
export function setMask(m) { M = m; }
export function maskAlpha(a) { A = a; }
export function red(g, draw, v = .38, tonal = null) {
  g.save(); g.fillStyle = g.strokeStyle = `rgb(${v * 255 | 0},${v * 255 | 0},${v * 255 | 0})`;
  (tonal || (() => draw(g)))(); g.restore();
  if (!M) return;
  M.save(); M.setTransform(g.getTransform()); M.globalAlpha = A; M.fillStyle = M.strokeStyle = RED; draw(M); M.restore();
}
