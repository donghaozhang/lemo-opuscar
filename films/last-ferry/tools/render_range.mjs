// Render only a time range of the film (same capture pipeline as core/render/video.mjs):
//   node films/last-ferry/tools/render_range.mjs <a> <b> [--fps 24] [--workers 2] [--q 'k=v'] [--out films/last-ferry/out/range.mp4]
// Run from the library root ($LIB). Frames [round(a*fps), round(b*fps)). Splice the result into a full render with tools/splice.py.
import fs from 'fs'; import path from 'path'; import { spawn, execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
const FILM = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIB = process.env.LIB || path.resolve(FILM, '..', '..');
const { openDemo, closeServer } = await import(path.join(LIB, 'core', 'render', 'page.mjs'));
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const A = +args[0], B = +args[1], FPS = +opt('--fps', 24), WK = +opt('--workers', 2), Q = opt('--q', '');
const out = path.resolve(opt('--out', path.join(FILM, 'out', `range_${A}_${B}.mp4`)));
const tmp = fs.mkdtempSync(path.join(FILM, 'out', 'range_tmp-'));
const F0 = Math.round(A * FPS), F1 = Math.round(B * FPS), TOTAL = F1 - F0, per = Math.ceil(TOTAL / WK), t0 = Date.now();
await Promise.all([...Array(WK)].map(async (_, w) => {
  const a = F0 + w * per, b = Math.min(F1, a + per); if (a >= b) return;
  const { browser, page } = await openDemo(FILM, { q: Q });
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', path.join(tmp, `seg_${w}.mp4`)]);
  for (let f = a; f < b; f++) {
    await page.evaluate(t => window.render(t), f / FPS);
    const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if ((f - a) % 60 === 0) console.log(`w${w} ${f - a}/${b - a}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await browser.close();
}));
const list = path.join(tmp, 'segs.txt');
fs.writeFileSync(list, [...Array(WK)].map((_, w) => `file 'seg_${w}.mp4'`).filter((_, w) => w * per < TOTAL).join('\n'));
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', out]);
fs.rmSync(tmp, { recursive: true, force: true });
const sec = (Date.now() - t0) / 1000;
console.log('done', out, TOTAL, 'frames', sec.toFixed(1) + 's');
closeServer(); process.exit(0);
