// subtitles from events.json (the page's own cue times) → alien-hotpot.srt, with the speaker name
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const E = JSON.parse(fs.readFileSync(path.join(HERE, 'events.json'), 'utf8'));
const ts = s => { const ms = Math.round(s * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, x = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`; };
const subs = E.ev.filter(e => e.type === 'sub').sort((a, b) => a.t - b.t);
const out = subs.map((s, i) => `${i + 1}\n${ts(s.t)} --> ${ts(s.t1)}\n${s.who}：${s.text}\n`).join('\n');
fs.writeFileSync(path.join(HERE, 'alien-hotpot.srt'), out); console.log('srt', subs.length, 'cues');
