// Self-host the fonts (OFL, from Google Fonts): Noto Serif SC (title, subtitles) and Long Cang (hand notes), both subset to
// the CJK characters used in the page's scripts; IBM Plex Mono for measured labels. Run from the project folder: node fetch_fonts.mjs
import fs from 'fs';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const src = ['text.js', 'timeline.js', 'main.js', 'scenes.js'].filter(f => fs.existsSync(f)).map(f => fs.readFileSync(f, 'utf8')).join('');
const cjk = [...new Set([...src].filter(c => c.charCodeAt(0) > 0x2e80))].join('');
const latin = '0123456789 .,:!?()·—«»《》（）：！，。、abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+-×≈°%kmc';
const chars = [...new Set(cjk + latin)].join('');
const fams = [
  `family=Noto+Serif+SC:wght@400;600&text=${encodeURIComponent(chars)}`,
  `family=Long+Cang&text=${encodeURIComponent(chars)}`,
  `family=IBM+Plex+Mono:wght@400;500`,
];
let out = '', n = 0; fs.mkdirSync('fonts', { recursive: true });
for (const f of fams) {
  const r = await fetch(`https://fonts.googleapis.com/css2?${f}&display=block`, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`fonts css ${r.status} for ${f.slice(0, 40)}`);
  let css = await r.text();
  for (const u of [...new Set(css.match(/https:\/\/[^)]+/g) || [])]) {
    const name = `f${n++}.woff2`;
    fs.writeFileSync('fonts/' + name, Buffer.from(await (await fetch(u)).arrayBuffer()));
    css = css.split(u).join('fonts/' + name);
  }
  out += css;
}
fs.writeFileSync('fonts.css', out);
fs.writeFileSync('fonts/chars.txt', chars);
console.log('font files', n, 'chars', chars.length, 'cjk', cjk.length);
