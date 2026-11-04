// subs.js → out/srt.json (then core/render/srt.py makes the .srt)
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const D = join(dirname(fileURLToPath(import.meta.url)), '..');
const { subtitleCues } = await import(join(D, 'subs.js'));
mkdirSync(join(D, 'out'), { recursive: true });
const cues = subtitleCues().map(c => ({ ...c, t0: +c.t0.toFixed(3), t1: +c.t1.toFixed(3) }));
writeFileSync(join(D, 'out/srt.json'), JSON.stringify(cues, null, 1));
console.log(cues.length, 'cues → out/srt.json');
