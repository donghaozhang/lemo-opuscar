// CJK glyph check, part 2: render every 0.25 s and collect any character the page drew without a glyph (window.MISSING).
// Part 1 is tools/glyphs.py, which fails when the font lacks a character used in the source.
import path from 'path'; import { fileURLToPath } from 'url';
const film = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), LIB = process.env.LIB || path.resolve(film, '../..');
const { openDemo, closeServer } = await import(path.join(LIB, 'core/render/page.mjs'));
const { browser, page } = await openDemo(film);
const r = await page.evaluate(() => { for (let t = 0; t < window.DUR; t += .25) window.render(t); return { missing: [...window.MISSING], dur: window.DUR }; });
console.log(`glyphcheck: ${Math.ceil(r.dur / .25)} frames, missing glyphs: ${r.missing.length ? r.missing.join('') : 'none'}`);
await browser.close(); closeServer(); process.exit(r.missing.length ? 1 : 0);
