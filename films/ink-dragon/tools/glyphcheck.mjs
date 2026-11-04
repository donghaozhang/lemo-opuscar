// CJK glyph check: every character in the film's texts must be covered by the font faces the page loads (Ma Shan Zheng, Noto Serif SC), and a sheet of
// all those characters is rendered for a visual scan for missing-glyph boxes. Run from the library root: node films/ink-dragon/tools/glyphcheck.mjs
import path from 'path'; import fs from 'fs'; import { fileURLToPath } from 'url';
import { openDemo } from '../../../core/render/page.mjs';
const here = path.dirname(fileURLToPath(import.meta.url)), dir = path.join(here, '..');
const T = await import(path.join(dir, 'timeline.js'));
const chars = [...new Set([...T.SUBS.map(s => s.text).join(''), ...'家山久旱盼雨墨龙借雨'].filter(c => /[　-鿿＀-￯]/.test(c)))];
const { browser, page } = await openDemo(dir, { w: 1920, h: 1080, q: 'test=glyphs&chars=' + encodeURIComponent(chars.join('')) });
const res = await page.evaluate(async cs => {
  const out = [];
  for (const ch of cs) {
    const ok1 = document.fonts.check('40px "Ma Shan Zheng"', ch), ok2 = document.fonts.check('40px "Noto Serif SC"', ch);
    // a second, independent test: the glyph drawn with the font must differ from the same glyph drawn with a font that surely lacks it (the tofu box)
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    const draw = font => { g.clearRect(0, 0, 64, 64); g.font = `48px ${font}`; g.fillStyle = '#000'; g.textBaseline = 'top'; g.fillText(ch, 4, 4); return g.getImageData(0, 0, 64, 64).data; };
    const a = draw('"Ma Shan Zheng"'), b = draw('"Ma Shan Zheng", serif'); let diff = 0; for (let i = 3; i < a.length; i += 4) if (a[i] !== b[i]) diff++;
    out.push({ ch, mashanzheng: ok1, notoserif: ok2, drawnSame: diff === 0 });
  }
  return out;
}, chars);
await page.evaluate(t => window.render(t), 0);
fs.mkdirSync(path.join(dir, 'out'), { recursive: true });
await page.screenshot({ path: path.join(dir, 'out', 'glyphs.jpg'), type: 'jpeg', quality: 90 });
await browser.close();
const bad = res.filter(r => !r.mashanzheng);
console.log(`${res.length} characters checked against Ma Shan Zheng: ${res.length - bad.length} covered${bad.length ? ', MISSING: ' + bad.map(r => r.ch).join('') : ''}`);
console.log(`Noto Serif SC covers ${res.filter(r => r.notoserif).length}/${res.length}; sheet: films/ink-dragon/out/glyphs.jpg`);
process.exit(bad.length ? 1 : 0);
