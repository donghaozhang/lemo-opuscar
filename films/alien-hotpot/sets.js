// sets.js — the places: rain city, the alley with the shop and its roof, the shop interior, plus morning versions.
// World units ≈ pixels at zoom 1 (a wide shot of each set fills x 0–1920, y 0–1080).
import { clamp, lerp, hash, TAU } from '/core/lib.js';
import { INK, g, push, pop, translate, rotate, scale, shape, fillOnly, stroke, ell, arc, spline, rr, rect, noodle, quad, dot, text, bands, screenRect, S, tx, W, H } from './toon.js';
import { C, mix, mul, saucer, puff, pot, coin, hexCoin } from './chars.js';

export const FONT = '"ZCOOL KuaiLe"';
// heavy rounded lettering: fill + a same-colour round-join stroke, optional outline
export function sign(str, x, y, size, fill, { outline = 0, ol = INK, rot = 0, align = 'center', heavy = 3 } = {}) {
  if (outline) text(str, x, y, { font: `${size}px ${FONT}`, fill: ol, align, rot, outlineW: outline + heavy * 2, outlineCol: ol });
  text(str, x, y, { font: `${size}px ${FONT}`, fill, align, rot, outlineW: heavy, outlineCol: fill });
}

// —— palettes ——
export const NIGHT = {
  sky: ['#16173a', '#1f2150', '#28296a', '#33317a'], far: '#2a2a5e', farW: '#ffb648', mid: '#3a3470', midS: '#2c2758', near: '#4a4482', nearS: '#38326a',
  wall: '#5b5a8c', wallS: '#45447a', shopWall: '#6b4f6e', shopWallS: '#523a57', street: '#24224a', streetS: '#1b1a3a', kerb: '#3a3866', win: '#ffb648', winS: '#e08a2a',
  neonA: '#ff4f9a', neonB: '#ffb648', signBoard: '#7d2630', signTx: '#ffd98a', roof: '#3f3a6a', roofS: '#2f2b56', wood: '#5a3a3a', rain: 'rgba(190,200,255,.42)',
};
export const MORNING = {
  sky: ['#9fd6e8', '#bfe3ea', '#ffe0bf', '#ffcfa3'], far: '#c9b8c8', farW: '#fff1d6', mid: '#d9a58e', midS: '#c08a76', near: '#e8b796', nearS: '#cf9c7c',
  wall: '#f1d9b8', wallS: '#d9b996', shopWall: '#d9734e', shopWallS: '#b85a3a', street: '#8e8a9e', streetS: '#77738a', kerb: '#b0aabb', win: '#fff1d6', winS: '#e8cfa8',
  neonA: '#c9a0b4', neonB: '#e0c08a', signBoard: '#9a2f3b', signTx: '#ffe9b0', roof: '#b86f58', roofS: '#9a5a46', wood: '#8a5a3a', rain: 'rgba(0,0,0,0)',
};

// —— rain (screen space, on ones) ——
export function rain(t, { n = 140, col = NIGHT.rain, ang = .18, len = 46, speed = 1900 } = {}) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.strokeStyle = col; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath();
  for (let i = 0; i < n; i++) {
    const x0 = hash(i * 1.71) * (W + 400) - 200, ph = (hash(i * 3.3) + t * speed / (H + 200) * (.8 + hash(i * 9.1) * .4)) % 1;
    const y = ph * (H + 200) - 100, x = x0 - ph * (H + 200) * ang;
    g.moveTo(x, y); g.lineTo(x - len * ang, y + len);
  }
  g.stroke();
}
// windows grid helper
function windows(x, y, w, h, cols, rows, P, seed, lit = .45) {
  const cw = w / cols, ch = h / rows;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const hh = hash(seed + i * 7.3 + j * 13.1); if (hh > lit + .35) continue;
    fillOnly(rect(x + i * cw + cw * .22, y + j * ch + ch * .25, cw * .56, ch * .5), hh < lit ? P.farW : P.midS, { boil: .3 });
  }
}

// —— the city (extreme wide): hillside stacks, a rail line through a building, the river ——
export function city(t, P = NIGHT, { streak = null, train = 0 } = {}) {
  bands(P.sky, -900, 760);
  // far hills
  shape(spline([[-600, 600], [-200, 380], [300, 440], [700, 330], [1100, 420], [1500, 300], [1900, 380], [2500, 520], [2500, 900], [-600, 900]]), { fill: P.far, lw: 5 });
  // tall towers on the far hill
  for (let i = 0; i < 9; i++) {
    const x = -100 + i * 250 + hash(i) * 60, h = 340 + hash(i + 3) * 300, w = 110 + hash(i + 6) * 50, y = 520 - h;
    shape(rect(x, y, w, h + 300), { fill: P.mid, lw: 5, shade: () => fillOnly(rect(x + w * .66, y - 10, w, h + 320), P.midS, { boil: .3 }) });
    windows(x + 6, y + 14, w - 12, h - 20, 4, Math.floor(h / 40), P, i * 11);
    if (i === 4) { shape(rect(x + w / 2 - 4, y - 60, 8, 60), { fill: P.midS, lw: 4 }); dot(x + w / 2, y - 64, 8, P.neonA); }
  }
  if (streak) streak();
  // the rail line on its pillars, going through a building
  const ry = 640;
  shape(rect(-300, ry, 2600, 26), { fill: P.nearS, lw: 5 });
  for (let i = 0; i < 9; i++) shape(rect(-200 + i * 300, ry + 26, 30, 300), { fill: P.nearS, lw: 5 });
  const tx_ = lerp(-700, 2300, ((t * .09 + train) % 1));
  shape(rr(tx_, ry - 46, 520, 46, 14), { fill: '#d9d4e8', lw: 5, shade: () => { for (let k = 0; k < 8; k++) fillOnly(rect(tx_ + 20 + k * 62, ry - 38, 40, 20), P.win, { boil: .2 }); fillOnly(rect(tx_, ry - 14, 520, 14), '#ff4f9a', { boil: .2 }); } });
  // the building the rail passes through (drawn over the train with a hole)
  const bx = 1180; shape([[bx, 380], [bx + 240, 380], [bx + 240, ry - 60], [bx, ry - 60]], { fill: P.near, lw: 6 });
  shape([[bx, ry + 26], [bx + 240, ry + 26], [bx + 240, 1000], [bx, 1000]], { fill: P.near, lw: 6 });
  windows(bx + 10, 400, 220, 160, 5, 4, P, 77, .6);
  // the river and its reflections
  shape(rect(-300, 860, 2600, 400), { fill: P.streetS, lw: 5 });
  for (let i = 0; i < 26; i++) { const x = hash(i * 5.5) * 1920, w = 30 + hash(i) * 90, yy = 880 + (i % 5) * 34; fillOnly(rect(x, yy, w, 6), i % 3 ? P.farW : P.neonA, { alpha: .55, boil: .3 }); }
  // near rooftops, stacked down the hill (old Chongqing houses)
  for (let i = 0; i < 8; i++) {
    const x = -120 + i * 280, y = 720 + (i % 3) * 30 + hash(i * 2) * 30, w = 260, h = 300;
    shape([[x, y], [x + w / 2, y - 60], [x + w, y], [x + w, y + h], [x, y + h]], { fill: i % 2 ? P.near : P.mid, lw: 6, shade: () => fillOnly(rect(x + w * .6, y - 80, w, h + 100), P.nearS, { boil: .3 }) });
    for (let k = 0; k < 2; k++) if (hash(i * 3 + k) > .3) shape(rect(x + 40 + k * 110, y + 40, 60, 50), { fill: P.win, lw: 5 });
  }
}

// —— the alley: the shop, its roof and neighbours ——
export const SHOP = { door: [905, 560, 170, 340], sign: [700, 410, 640, 100], roofY: 150, chim: [1290, -60, 44, 210], ground: 900 };
export function alley(t, P = NIGHT, o = {}) {
  const k12 = Math.floor(t * 12);
  bands(P.sky, -1600, 700);
  // far skyline behind the roof (seen in the roof shots)
  shape(spline([[-800, 160], [-300, -80], [200, 0], [700, -160], [1300, -60], [1900, -200], [2700, 40], [2700, 700], [-800, 700]]), { fill: P.far, lw: 5 });
  for (let i = 0; i < 10; i++) { const x = -600 + i * 330 + hash(i * 4) * 80, h = 380 + hash(i + 9) * 340, w = 120 + hash(i) * 60, y = 120 - h; shape(rect(x, y, w, h + 300), { fill: P.mid, lw: 5, shade: () => fillOnly(rect(x + w * .65, y - 10, w, h + 320), P.midS, { boil: .3 }) }); windows(x + 6, y + 14, w - 12, h - 30, 4, Math.floor(h / 44), P, i * 31); }
  if (o.sky) o.sky();
  // left neighbour: a shuttered noodle shop with a neon 面
  shape(rect(-700, 40, 1340, 900), { fill: P.wall, lw: 7, shade: () => fillOnly(rect(420, 30, 300, 920), P.wallS, { boil: .3 }) });
  shape(rect(90, 560, 460, 340), { fill: P.wallS, lw: 7, shade: () => { for (let i = 0; i < 12; i++) fillOnly(rect(90, 576 + i * 28, 460, 6), P.wall, { boil: .3 }); } });
  for (const [x, y] of [[140, 200], [380, 200], [140, 380], [380, 380]]) { shape(rect(x, y, 150, 120), { fill: hash(x + y) > .4 ? P.win : P.wallS, lw: 6 }); stroke([[x + 75, y], [x + 75, y + 120]], 5); }
  shape(rr(560, 300, 60, 160, 10), { fill: P.streetS, lw: 6 });
  const flick = o.neonOff ? 0 : 1;
  sign('面', 590, 380, 60, flick ? P.neonA : P.wallS, { heavy: 2 });
  shape(rect(240, 470, 120, 70), { fill: '#b7b3c9', lw: 6, shade: () => { for (let i = 0; i < 4; i++) fillOnly(rect(250, 482 + i * 14, 100, 5), '#8d89a3', { boil: .3 }); } });   // air conditioner
  // the shop building
  shape(rect(640, SHOP.roofY, 760, 760), { fill: P.shopWall, lw: 7, shade: () => fillOnly(rect(1200, SHOP.roofY - 10, 260, 780), P.shopWallS, { boil: .3 }) });
  shape(rect(620, SHOP.roofY - 30, 800, 34), { fill: P.roof, lw: 7 });   // parapet
  // the chimney (the hot-pot vent), steam with a hint of red
  const [cx, cy, cw, ch] = SHOP.chim;
  shape(rect(cx, cy, cw, ch), { fill: P.roofS, lw: 6 }); shape(rect(cx - 10, cy - 16, cw + 20, 20), { fill: P.roof, lw: 6 });
  if (o.chimSteam !== 0) for (let i = 0; i < 3; i++) { const ph = (t * .35 + i / 3) % 1; puff(cx + cw / 2, cy - 20, ph, -Math.PI / 2 + .25, 1, mix('#ffffff', '#ff8a7a', .35)); }
  // the TV antenna + water tank on the roof
  stroke([[720, SHOP.roofY - 30], [720, -60]], 6); stroke([[690, -40], [750, -40]], 5); stroke([[680, -10], [760, -10]], 5);
  shape(rr(1120, SHOP.roofY - 120, 120, 92, 14), { fill: P.wallS, lw: 6 });
  if (o.roof) o.roof();
  // upper floor window with laundry
  shape(rect(760, 200, 220, 150), { fill: o.winOff ? P.wallS : P.win, lw: 7 }); stroke([[870, 200], [870, 350]], 5);
  stroke([[1010, 230], [1260, 250]], 4); for (let i = 0; i < 3; i++) shape(rr(1040 + i * 70, 236 + i * 4, 44, 60, 6), { fill: ['#ffffff', P.neonA, '#7a9be0'][i], lw: 5 });
  // the sign board 老刘火锅 (the 锅 flickers at night)
  const [sx, sy, sw, sh] = SHOP.sign;
  shape(rr(sx, sy, sw, sh, 10), { fill: P.signBoard, lw: 7 });
  const chars = '老刘火锅';
  for (let i = 0; i < 4; i++) { const on = !(o.flicker && i === 3 && (k12 % 7 < 2 || (k12 % 23) < 3)); sign(chars[i], sx + 90 + i * 152, sy + sh / 2 + 4, 76, on && !o.signOff ? P.signTx : mix(P.signBoard, '#000000', .25), { heavy: 3 }); }
  // the shop window: fogged, warm light, the shape of the counter inside
  shape(rect(680, 590, 190, 240), { fill: o.shopOff ? P.wallS : P.win, lw: 7, shade: () => { fillOnly(rect(680, 760, 190, 80), P.winS, { boil: .3 }); fillOnly(ell(760, 650, 50, 30, 14), 'rgba(255,255,255,.35)', { boil: .3 }); } });
  stroke([[775, 590], [775, 830]], 5);
  // the door
  const [dx, dy, dw, dh] = SHOP.door;
  shape(rect(dx, dy, dw, dh), { fill: P.wood, lw: 7 });
  shape(rect(dx + 18, dy + 20, dw - 36, 170), { fill: o.shopOff ? P.wallS : P.win, lw: 6 });
  if (o.door) o.door(dx, dy, dw, dh);
  dot(dx + dw - 24, dy + 220, 8, '#d9b44a');
  // right neighbour: tall, with a vertical neon 旅馆
  shape(rect(1400, -300, 1000, 1200), { fill: P.near, lw: 7, shade: () => fillOnly(rect(1800, -320, 700, 1240), P.nearS, { boil: .3 }) });
  windows(1460, -260, 420, 700, 4, 9, P, 501, .5);
  shape(rr(1420, 380, 70, 220, 10), { fill: P.streetS, lw: 6 });
  sign('旅', 1455, 440, 52, P.neonB, { heavy: 2 }); sign('馆', 1455, 540, 52, P.neonB, { heavy: 2 });
  // overhead wires
  stroke(quad([-200, 80], [600, 180], [1400, 60], 20), 4); stroke(quad([-200, 120], [900, 240], [2200, 20], 20), 4);
  // the street: wet, with reflections
  shape(rect(-700, SHOP.ground, 3200, 500), { fill: P.street, lw: 7 });
  shape(rect(-700, SHOP.ground, 3200, 26), { fill: P.kerb, lw: 6 });
  for (let i = 0; i < 22; i++) { const x = -200 + hash(i * 2.2) * 2300, w = 40 + hash(i * 1.1) * 120, yy = 960 + (i % 6) * 32; fillOnly(rect(x, yy, w, 7), i % 4 === 0 ? P.neonA : P.win, { alpha: P === MORNING ? .25 : .45, boil: .3 }); }
}
// the 转让 sign taped on the door glass (from outside)
export function zhuanrang(x, y, s = 1, { t = 0, torn = 0, flap = 0 } = {}) {
  push(); translate(x, y); scale(s); rotate(-.04 + flap * .03 * Math.sin(t * 9));
  shape(rect(-70, -52, 140, 104), { fill: '#fbf6ea', lw: 5 });
  sign('转让', 0, -8, 46, '#c8202a', { heavy: 2 });
  text('电话 138****', 0, 34, { font: `16px ${FONT}`, fill: INK });
  for (const [ax, ay] of [[-64, -48], [64, -48]]) shape(rect(ax - 16, ay - 7, 32, 14), { fill: 'rgba(240,230,170,.85)', lw: 3 });
  pop();
}
export function renzheng(x, y, s = 1) {
  push(); translate(x, y); scale(s); rotate(.03);
  shape(rect(-120, -70, 240, 140), { fill: '#fbf6ea', lw: 6 });
  sign('外星人认证', 0, -24, 40, '#1d6f8a', { heavy: 2 });
  saucer(0, 34, .16, { glow: 0 });
  pop();
}

// —— the shop interior ——
export const SHOPIN = { counterTop: 640, tableTop: 700, potX: 1080, potY: 668, door: [1530, 250, 240, 510] };
export function interior(t, o = {}) {
  const P = o.P || {}, dark = o.dark || 0;
  const K = (c) => (dark ? mix(c, '#0b0a1a', dark) : c);
  const wallU = K(P.wallU || '#e6d8b4'), wallUS = K(P.wallUS || '#c9b88e'), tile = K(P.tile || '#2f5d5a'), tileS = K(P.tileS || '#244a48'), floor = K(P.floor || '#6b3a2e'), floorS = K(P.floorS || '#57302a');
  // wall, upper (smoked cream) and lower (teal tiles)
  fillOnly(rect(-800, -600, 3600, 1300), wallU, { boil: 0 });
  shape(spline([[-800, -600], [400, -600], [300, 0], [-800, 200]]), { fill: wallUS, stroke: false, boil: .3 });
  shape(rect(-800, 470, 3600, 300), { fill: tile, lw: 6, shade: () => { for (let i = 0; i < 40; i++) fillOnly(rect(-800 + i * 90, 470, 5, 300), tileS, { boil: .3 }); for (let j = 0; j < 3; j++) fillOnly(rect(-800, 560 + j * 90, 3600, 5), tileS, { boil: .3 }); } });
  shape(rect(-800, 760, 3600, 700), { fill: floor, lw: 6, shade: () => { for (let i = 0; i < 30; i++) fillOnly([[-800 + i * 140, 760], [-760 + i * 140, 760], [-1100 + i * 180, 1460], [-1140 + i * 180, 1460]], floorS, { boil: .3 }); } });
  // calendar + a faded poster of a pot
  shape(rect(380, 140, 150, 200), { fill: K('#f4efe2'), lw: 6, shade: () => fillOnly(rect(380, 140, 150, 50), K('#c8202a'), { boil: .3 }) });
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) dot(400 + i * 36, 220 + j * 36, 4, K('#8d89a3'));
  // menu board
  shape(rr(620, 110, 360, 330, 12), { fill: K('#82502b'), lw: 7 });
  if (o.menu !== false) menuBoard(K, o.menuHi);
  // the door with its glass: the street at night, rain, the back of the 转让 paper
  const [dx, dy, dw, dh] = SHOPIN.door;
  shape(rect(dx, dy, dw, dh), { fill: K('#6a4232'), lw: 7 });
  shape(rect(dx + 24, dy + 26, dw - 48, 250), { fill: o.outside || K('#1f2150'), lw: 6, shade: () => {
    if (!o.outside) { for (let i = 0; i < 10; i++) { const x = dx + 30 + hash(i * 3.3) * (dw - 60), ph = (hash(i) + t * 1.4) % 1; fillOnly(rect(x, dy + 26 + ph * 250, 3, 26), 'rgba(190,200,255,.5)', { boil: 0 }); } fillOnly(rect(dx + 24, dy + 200, dw - 48, 80), K('#28296a'), { boil: .3 }); }
    if (!o.noSign) { fillOnly(rect(dx + 60, dy + 70, 120, 90), K('#e8e0cc'), { boil: .3 }); }
  } });
  dot(dx + 30, dy + 300, 9, '#d9b44a');
  if (o.door) o.door();
  // doorbell
  stroke([[dx + dw - 40, dy - 10], [dx + dw - 40, dy + 16]], 4); shape(arc(dx + dw - 40, dy + 30, 16, 16, Math.PI, TAU, 10).concat([[dx + dw - 24, dy + 34], [dx + dw - 56, dy + 34]]), { fill: '#d9b44a', lw: 5 });
  // fluorescent tube + red lantern (the practicals)
  stroke([[880, -200], [880, 40]], 4); stroke([[1180, -200], [1180, 40]], 4);
  shape(rr(820, 40, 420, 26, 12), { fill: o.tubeOff ? K('#9aa3b5') : '#f4fbff', lw: 6 });
  stroke([[1420, -200], [1420, 80]], 4);
  shape(ell(1420, 140, 62, 58, 30), { fill: K('#d6321f'), lw: 7, shade: () => { fillOnly(ell(1440, 150, 44, 54, 20), K('#a8200f'), { boil: .3 }); for (const x of [-30, 0, 30]) fillOnly(rect(1420 + x - 2, 84, 4, 112), K('#a8200f'), { boil: .3 }); } });
  shape(rect(1396, 196, 48, 14), { fill: '#d9b44a', lw: 5 }); for (let i = 0; i < 5; i++) stroke([[1404 + i * 8, 212], [1404 + i * 8, 250]], 3, { line: '#d9b44a' });
  if (o.back) o.back();
}
export function menuBoard(K = c => c, hi = -1) {
  sign('菜单', 800, 150, 40, K('#ffd98a'), { heavy: 2 });
  const items = [['九宫格', '锅底'], ['毛肚', '鸭肠'], ['微辣', '特辣'], ['最辣', '']];
  items.forEach(([a, b], i) => {
    const y = 210 + i * 58;
    shape(rr(640, y - 22, 320, 46, 6), { fill: i === 3 ? K('#c8202a') : K('#f1e3c6'), lw: 5 });
    sign(a, b ? 720 : 800, y + 2, 30, i === 3 ? '#ffe9b0' : K('#3b2a2a'), { heavy: 1.5 });
    if (b) sign(b, 880, y + 2, 30, i === 3 ? '#ffe9b0' : K('#3b2a2a'), { heavy: 1.5 });
  });
  if (hi >= 0) shape(rr(632, 210 + hi * 58 - 30, 336, 62, 10), { lw: 7, line: '#ff4f9a' });
}
export function counter(o = {}) {
  const K = o.K || (c => c);
  shape(rect(40, SHOPIN.counterTop, 560, 500), { fill: K('#8a4a32'), lw: 7, shade: () => { fillOnly(rect(40, SHOPIN.counterTop + 30, 560, 8), K('#6e3824'), { boil: .3 }); for (let i = 0; i < 4; i++) fillOnly(rect(80 + i * 130, SHOPIN.counterTop + 70, 6, 400), K('#6e3824'), { boil: .3 }); } });
  shape(rect(20, SHOPIN.counterTop - 24, 600, 30), { fill: K('#a8683b'), lw: 7 });
}
export function table(o = {}) {
  const K = o.K || (c => c), y = SHOPIN.tableTop;
  for (const x of [800, 1360]) shape(rect(x - 14, y + 20, 28, 260), { fill: K('#5a3a2a'), lw: 6 });
  shape(rr(700, y - 10, 760, 40, 10), { fill: K('#a8683b'), lw: 7, shade: () => fillOnly(rect(700, y + 14, 760, 20), K('#82502b'), { boil: .3 }) });
  shape(rect(720, y + 30, 720, 44), { fill: K('#82502b'), lw: 6 });
}
export function stool(x, y, h, K = c => c) {
  for (const s of [-1, 1]) stroke([[x + s * 30, y], [x + s * 40, y + h]], 8, { line: K('#5a3a2a') });
  shape(rr(x - 50, y - 18, 100, 22, 8), { fill: K('#c8202a'), lw: 6 });
}

// —— insert sets ——
// top-down counter for the coins
export function counterTop(K = c => c) {
  fillOnly(rect(-1000, -1000, 4000, 3000), K('#a8683b'), { boil: 0 });
  for (let i = 0; i < 12; i++) fillOnly(rect(-1000, 60 + i * 96, 4000, 5), K('#8d5530'), { boil: .4 });
  shape(rr(1240, 150, 520, 420, 20), { fill: K('#5d6170'), lw: 7, shade: () => fillOnly(rr(1260, 170, 480, 380, 14), K('#43465a'), { boil: .3 }) });   // the empty cash tin
  shape(rr(140, 700, 420, 300, 16), { fill: K('#f4efe2'), lw: 7, shade: () => { for (let i = 0; i < 5; i++) fillOnly(rect(170, 740 + i * 50, 360, 5), K('#d8cfba'), { boil: .3 }); } });   // the account book
  sign('今日', 350, 760, 44, K('#3b2a2a'), { heavy: 2 });
}
