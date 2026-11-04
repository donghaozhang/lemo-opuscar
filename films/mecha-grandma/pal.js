// Colour models (色指定) for 《机甲外婆》: daylight base colours → one set per lighting (night street, warm lamp,
// cold monitor, storm, dawn, backlit). Skin is specified by hand per set (multiplying turns faces pink under neon).
import { hex } from './cel.js';

export const BASE = {
  // 外婆
  gskin: { f: '#f6d2bc', s: '#d69c8a', h: '#fff0e6', l: '#6a3a32' },
  ghair: { f: '#d9d6e6', s: '#9e98b8', h: '#ffffff', l: '#5a5078' },        // silver hair, lavender shadow
  gjacket: { f: '#8a3a6a', s: '#5c2148', h: '#c46a9a', l: '#2e0e24' },      // quilted plum jacket
  gshirt: { f: '#efe4cf', s: '#c2b296', l: '#5a4a32' },
  gpants: { f: '#3e3a52', s: '#26233a', h: '#625c80', l: '#100e1c' },
  apron: { f: '#7aa6c8', s: '#4f7a9e', h: '#b6d6ee', l: '#1e3a52' },
  pin: { f: '#e8343a', s: '#a01c2a', h: '#ff9a8a', l: '#4a0a10' },          // red hairpin
  glasses: { f: '#c99a4a', s: '#8a6426', h: '#ffe0a0', l: '#3a2610' },
  geye: { f: '#6a3e26', s: '#3a1e10', h: '#c08a5a', l: '#1e0e06' },
  // 阿杰
  jskin: { f: '#f3d0bc', s: '#cf998a', h: '#fff0e8', l: '#5a3030' },
  jhair: { f: '#2c2a44', s: '#17152a', h: '#6a64a0', l: '#0c0a1a' },
  hoodie: { f: '#8a8ea0', s: '#5e6276', h: '#c0c4d4', l: '#262a3a' },
  jeye: { f: '#4a3a5a', s: '#241a32', h: '#9a86b8', l: '#100a1a' },
  phone: { f: '#2a2a34', s: '#16161d', h: '#5c5c70', l: '#08080c' },
  // 大黄
  mech: { f: '#f2b81e', s: '#b97a0e', h: '#ffe27a', l: '#4a2c06' },
  mechDark: { f: '#4a4652', s: '#2c2934', h: '#7c7888', l: '#101016' },
  mechGrey: { f: '#9a98a6', s: '#6a6878', h: '#d0ceda', l: '#2a2834' },
  stripeK: { f: '#1e1c24', s: '#121016', l: '#08070a' },
  glass: { f: '#6ac6e8', s: '#3a86b0', h: '#e6fbff', l: '#163a52' },
  // props
  cloth: { f: '#e23a3a', s: '#a81e2a', h: '#ff8a7a', l: '#4a0a12' },        // the red checked cloth
  tin: { f: '#c8ccd6', s: '#8a90a2', h: '#ffffff', l: '#3a3e4e' },
  dumpling: { f: '#f6efe0', s: '#d8c8a8', h: '#ffffff', l: '#7a6a4a' },
  drone: { f: '#3a3f52', s: '#22263a', h: '#6a7090', l: '#0a0c16' },
  white: { f: '#f3f6fc', s: '#a9b3cd', h: '#ffffff', l: '#39456a' },
  rider: { f: '#2f9a6a', s: '#1c6a46', h: '#7ad6a6', l: '#0a2e1e' },
  white_eye: '#fbf8ff',
  lash: '#2a1620',
  mouth: '#9a3b4a',
  blush: '#ff9a9a',
};
const mul = (c, m) => { const v = hex(c); return '#' + v.map((x, i) => Math.max(0, Math.min(255, Math.round(x * m[i]))).toString(16).padStart(2, '0')).join(''); };
export const LIGHTS = {
  day: { lit: [1, 1, 1], shade: [1, 1, 1], line: [1, 1, 1] },
  warm: { lit: [1.04, .9, .74], shade: [.82, .64, .66], line: [.95, .8, .8] },        // apartment lamp
  night: { lit: [.74, .72, 1.0], shade: [.52, .48, .9], line: [.8, .7, 1.1] },        // neon street in the rain
  storm: { lit: [.62, .64, .86], shade: [.42, .42, .7], line: [.7, .66, 1.0] },        // garage / tower in the storm
  mono: { lit: [.74, .86, 1.08], shade: [.46, .54, .82], line: [.7, .8, 1.1] },        // monitor light
  dawn: { lit: [1.06, .92, .82], shade: [.84, .66, .78], line: [1, .82, .85] },
  backlit: { lit: [.4, .3, .52], shade: [.24, .16, .36], line: [.4, .25, .5] },
};
export function palette(name) {
  const L = LIGHTS[name], out = {};
  for (const [k, v] of Object.entries(BASE)) {
    if (typeof v === 'string') { out[k] = mul(v, L.lit); continue; }
    out[k] = {}; for (const [kk, c] of Object.entries(v)) out[k][kk] = mul(c, kk === 's' ? L.shade : kk === 'l' ? L.line : L.lit);
  }
  return out;
}
export const PAL = {}; for (const k in LIGHTS) PAL[k] = palette(k);
// skin by hand per set (neutral lit, coloured shadow)
const SK = {
  night: { g: { f: '#e8c6c0', s: '#9c80b2', h: '#fff2f2' }, j: { f: '#e4c4c0', s: '#957cb0', h: '#fff0f0' } },
  storm: { g: { f: '#dcc0c0', s: '#8c7aa6', h: '#f6ecf0' }, j: { f: '#d8bcbe', s: '#8676a2', h: '#f4eaee' } },
  mono: { g: { f: '#d6dcef', s: '#8a92c0', h: '#f2f6ff' }, j: { f: '#d2d8ee', s: '#8088ba', h: '#eef4ff' } },
  warm: { g: { f: '#fbd2b0', s: '#d08a74', h: '#fff0de' }, j: { f: '#f8ceb0', s: '#c88470', h: '#fff0de' } },
  dawn: { g: { f: '#fbd6c0', s: '#d69a96', h: '#fff2e8' }, j: { f: '#f8d2bf', s: '#d09494', h: '#fff2e8' } },
};
for (const k in SK) { Object.assign(PAL[k].gskin, SK[k].g); Object.assign(PAL[k].jskin, SK[k].j); }
