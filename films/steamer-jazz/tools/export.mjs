// Export the film's timeline (sections, shots, cue hits, song) and subtitles from the page:
//   node films/delivery-hero/tools/export.mjs   (run from the library root, or with LIB set)
// → timeline.json (read by music/score.py, mix.py, tools/cuecheck.py) and steamer-jazz.srt (same SUBS array as the burned-in boxes)
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), film = path.resolve(here, '..');
const LIB = process.env.LIB || path.resolve(film, '../..');
const { openDemo, closeServer } = await import(path.join(LIB, 'core/render/page.mjs'));
const { browser, page } = await openDemo(film);
const tl = await page.evaluate(() => window.TIMELINE);
const subs = (await page.evaluate(() => window.SUBS)).sort((a, b) => a.t0 - b.t0);
fs.writeFileSync(path.join(film, 'timeline.json'), JSON.stringify(tl, null, 1));
const ts = s => { const ms = Math.round(s * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`; };
// subtitles never overlap: a cue ends where the next begins
for (let i = 0; i < subs.length - 1; i++) subs[i].t1 = Math.min(subs[i].t1, subs[i + 1].t0);
fs.writeFileSync(path.join(film, 'steamer-jazz.srt'), subs.map((s, i) => `${i + 1}\n${ts(s.t0)} --> ${ts(s.t1)}\n${s.text}\n`).join('\n'));
console.log('timeline: dur', tl.dur, 'sections', tl.sections.length, 'hits', tl.hits.length, '· srt cues', subs.length);
await browser.close(); closeServer();
