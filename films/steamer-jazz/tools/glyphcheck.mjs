// CJK glyph check, part 2: collect every text drawn on screen (window.TEXTS every 0.5 s) and every subtitle, and check that each
// character is one fonts.py verified against both OFL fonts' cmaps (fonts/chars.json). Part 1 is tools/fonts.py.
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const film = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), LIB = process.env.LIB || path.resolve(film, '../..');
const { openDemo, closeServer } = await import(path.join(LIB, 'core/render/page.mjs'));
const covered = new Set(JSON.parse(fs.readFileSync(path.join(film, 'fonts', 'chars.json'), 'utf8')));
const { browser, page } = await openDemo(film);
const strs = await page.evaluate(() => { const out = new Set(window.SUBS.map(s => s.text)); for (let t = 0; t < window.DUR; t += .5) for (const x of window.TEXTS(t)) out.add(x.text); return [...out]; });
const miss = new Set(); let n = 0;
for (const s of strs) for (const ch of s) { if (ch.codePointAt(0) < 0x2000 || ch === ' ') continue; n++; if (!covered.has(ch)) miss.add(ch); }
console.log(`glyphcheck: ${strs.length} on-screen strings, ${n} CJK characters, missing: ${miss.size ? [...miss].join('') : 'none'}`);
await browser.close(); closeServer(); process.exit(miss.size ? 1 : 0);
