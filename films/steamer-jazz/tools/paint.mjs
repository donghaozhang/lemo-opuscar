// Paint the watercolour backgrounds once (slow: blurred washes) and save them as PNGs + bg/bg.json (origin and size in world units).
// node films/steamer-jazz/tools/paint.mjs
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const film = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), LIB = process.env.LIB || path.resolve(film, '../..');
const { openDemo, closeServer } = await import(path.join(LIB, 'core/render/page.mjs'));
const { browser, page } = await openDemo(film, { q: 'sheet=export' });
await page.evaluate(() => window.render(0));
const ex = await page.evaluate(() => window.EXPORT);
const meta = {};
for (const [k, v] of Object.entries(ex)) { fs.writeFileSync(path.join(film, 'bg', k + '.png'), Buffer.from(v.url.split(',')[1], 'base64')); meta[k] = { ox: v.ox, oy: v.oy, w: v.w, h: v.h }; }
fs.writeFileSync(path.join(film, 'bg', 'bg.json'), JSON.stringify(meta));
console.log('painted', Object.keys(meta).join(', '));
await browser.close(); closeServer();
