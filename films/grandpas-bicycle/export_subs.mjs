// SUBS + NOTES from the page → out/srt_cues.json (for core/render/srt.py). Run from the library root: node films/grandpas-bicycle/export_subs.mjs
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
import { openDemo, closeServer } from '../../core/render/page.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const { browser, page } = await openDemo(HERE);
const cues = await page.evaluate(() => {
  const out = [];
  for (const s of window.SUBS) out.push({ t0: s.t0, t1: s.t1, text: s.text });
  for (const n of window.NOTES) { if (n.id === 'title') continue; out.push({ t0: +(n.t0 + (n.anchor ? .35 : 0)).toFixed(2), t1: +Math.min(n.t1, n.t0 + 7).toFixed(2), text: n.txt + (n.tally ? ' |||' : '') }); }
  return out.sort((a, b) => a.t0 - b.t0);
});
// merge the measured value with the hand label that follows it on the same line (e.g. "1.2 km" + "到学校")
const merged = [];
for (const c of cues) {
  const p = merged[merged.length - 1], num = p && (p.text.match(/[0-9.]+/) || [])[0];
  if (p && num && Math.abs(c.t0 - p.t0) < .7) { p.text = c.text.includes(num) ? c.text : p.text + ' ' + c.text; p.t1 = Math.max(p.t1, c.t1); }
  else merged.push(c);
}
for (let i = 1; i < merged.length; i++) if (merged[i].t0 < merged[i - 1].t1) merged[i - 1].t1 = +(merged[i].t0 - .05).toFixed(2);
fs.mkdirSync(path.join(HERE, 'out'), { recursive: true });
fs.writeFileSync(path.join(HERE, 'out', 'srt_cues.json'), JSON.stringify(merged, null, 1));
console.log('srt cues', merged.length);
await browser.close(); await closeServer(); process.exit(0);
