// main.js — director for 《外卖勇者》: shot table, UI track (dialog / messages / menus = subtitles), HUD (battery = HP, clock), transitions,
// sound events (window.EV), subtitles (window.SUBS) and on-screen texts (window.TEXTS) — all from the same tables.
import { W, H, FB, C, T, makeOut, lutAt, darken, whiten, dimIdx, mosaic, swirl, dissolve, clamp, lerp, seg, ss, eo, ei, eio, back, mod, hash, bayer, LIGHT, WARM, LL, WW, sprite, outline } from './px.js';
import { text, text2, text2W, textW, wrap, MISSING } from './font.js';
import { win, dialog, msg, hud, menu, ICON, heart, popNum, questBox, hand, typed, DLG, arrow, RECTS } from './ui.js';
import { bust, portrait, EXPR } from './face.js';
import { figure, POSES, poseAt, blend } from './rig.js';
import { ebike, headCone, bag, bowl, phoneSmall, umbrella, dog, trafficLight, floodBlob, savePoint } from './props.js';
import * as S from './scenes.js';

const q = new URLSearchParams(location.search);
const fb = new FB(), out = makeOut(document.getElementById('c'));

// ———————————————— shot table (durations in s; start times accumulate) ————————————————
const SHOT_D = [
  ['s01', 3.0], ['s02', 1.8], ['s03', 5.0], ['s04', 4.0],
  ['s05', 4.0], ['s06', 4.0], ['s07', 2.5], ['s08', 3.4],
  ['s09', 3.2], ['s10', 4.0], ['s11', 3.2], ['s12', 2.8],
  ['s13', 2.6], ['s14', 6.4],
  ['s15', 2.2], ['s16', 3.8], ['s17', 3.6], ['s18', 2.6],
  ['s19', 1.6], ['s20', 3.0], ['s21', 3.4], ['s22', 3.0],
  ['s23', 3.0], ['s24', 1.5], ['s25', 4.5], ['s26', 3.0], ['s27', 4.2], ['s28', 3.0],
  ['s29', 2.2], ['s30', 2.5], ['s31', 3.3], ['s32', 2.6], ['s33', 3.5], ['s34', 4.6],
  ['s35', 3.8], ['s36', 7.5], ['s37', 3.6], ['s38', 4.0],
  ['s39', 1.8], ['s40', 3.2], ['s41', 2.3], ['s42', 2.7],
  ['s43', 3.0], ['s44', 3.4], ['s45', 3.5],
];
const SH = {}; { let t = 0; for (const [id, d] of SHOT_D) { SH[id] = { id, t0: +t.toFixed(3), d, t1: +(t + d).toFixed(3) }; t += d; } }
const DUR = +SHOT_D.reduce((a, [, d]) => a + d, 0).toFixed(3);
const at = (id, lt) => +(SH[id].t0 + lt).toFixed(3);
// music sections (the score reads these through events.json → timeline.json)
const SECT = [
  { id: 'open', t: 0, bpm: 0 }, { id: 'ow', t: SH.s05.t0, bpm: 120 }, { id: 'b1', t: SH.s09.t0, bpm: 150 }, { id: 'ride', t: SH.s13.t0, bpm: 120 },
  { id: 'b2', t: SH.s14.t0, bpm: 150 }, { id: 'kid', t: SH.s15.t0, bpm: 120 }, { id: 'dog', t: SH.s19.t0, bpm: 150 }, { id: 'boss', t: SH.s23.t0, bpm: 160 },
  { id: 'hush', t: SH.s29.t0, bpm: 0 }, { id: 'tender', t: SH.s30.t0, bpm: 80 }, { id: 'drop', t: SH.s35.t0, bpm: 0 }, { id: 'song', t: SH.s36.t0 + .6, bpm: 105 },
  { id: 'still', t: SH.s37.t0, bpm: 0 }, { id: 'payoff', t: SH.s40.t0, bpm: 80 }, { id: 'fanfare', t: SH.s44.t0, bpm: 120 }, { id: 'coda', t: SH.s45.t0, bpm: 120 }, { id: 'end', t: DUR, bpm: 0 },
];
const beatOf = (sec, n) => { const s = SECT.find(x => x.id === sec); return +(s.t + n * 60 / s.bpm).toFixed(3); };

// ———————————————— events, UI track, subtitles, texts ————————————————
const EV = [], SUBS = [], UI = [], HITS = [];
const ev = (t, type, o = {}) => EV.push({ t: +(+t).toFixed(3), type, ...o });
const hit = (name, t, sec, beat) => HITS.push({ name, t: +t.toFixed(3), sec, beat });
const PITCH = { rider: 1.0, kid: 1.45, lady: .82, sys: 1.2, dog: 1.0 };
function typing(t0, s, cps, who) { let k = 0; const ch = [...s]; for (let i = 0; i < ch.length; i++) { if (' …，。！？：、♪'.includes(ch[i])) continue; if (k++ % 2 === 0) ev(t0 + i / cps, 'blip', { p: PITCH[who] || 1, who }); } }
// dialog box (subtitle)
function D(id, lt0, lt1, who, s, o = {}) {
  const t0 = at(id, lt0), t1 = at(id, lt1);
  UI.push({ kind: 'dlg', t0, t1, who, text: s, ...o });
  SUBS.push({ t0, t1, text: s });
  ev(t0, 'open'); if (!o.song) typing(t0 + .15, s, o.cps || 12, who);
}
// top message (battle / system)
function M(id, lt0, lt1, s, o = {}) {
  const t0 = at(id, lt0), t1 = at(id, lt1);
  UI.push({ kind: 'msg', t0, t1, text: s, ...o }); SUBS.push({ t0, t1, text: s }); ev(t0, 'open', { soft: 1 }); typing(t0 + .05, s, 18, 'sys');
}
// menu window
function MENU(id, lt0, lt1, o) { UI.push({ kind: 'menu', t0: at(id, lt0), t1: at(id, lt1), ...o }); ev(at(id, lt0), 'open', { soft: 1 }); }

// ———————————————— HUD state: battery (HP) and clock as functions of time ————————————————
const BAT = [[0, 41], [at('s14', 3.7), 41], [at('s14', 4.3), 29], [at('s20', .8), 29], [at('s20', .9), 28],
  [at('s26', .6), 28], [at('s27', 1.0), 18], [at('s27', 1.3), 38], [at('s28', 2.0), 9], [at('s35', 0), 9], [at('s36', .4), 9], [at('s38', .9), 3], [at('s38', 1.0), 0]];
function battery(t) { for (let i = 1; i < BAT.length; i++) if (t < BAT[i][0]) { const [t0, a] = BAT[i - 1], [t1, b] = BAT[i]; return Math.round(lerp(a, b, clamp((t - t0) / Math.max(.001, t1 - t0), 0, 1))); } return BAT[BAT.length - 1][1]; }
const CLK = [[0, '23:40'], [SH.s08.t0, '23:43'], [at('s11', .8), '23:44'], [at('s11', 1.4), '23:45'], [at('s11', 2.0), '23:46'], [at('s11', 2.6), '23:47'], [SH.s14.t0, '23:49'],
  [SH.s15.t0, '23:51'], [SH.s19.t0, '23:53'], [SH.s23.t0, '23:54'], [at('s27', .5), '23:55'], [at('s27', 1.8), '23:56'], [at('s27', 3.0), '23:57'], [at('s28', 0), '23:58'], [at('s28', 2.5), '23:59'], [at('s37', .8), '00:00']];
function clock(t) { let c = CLK[0][1]; for (const [t0, s] of CLK) if (t >= t0) c = s; return c; }
for (let i = 1; i < CLK.length; i++) if (CLK[i][0] > SH.s05.t0 && CLK[i][0] < SH.s12.t1) ev(CLK[i][0], 'clocktick');
// battery tick-down sounds
for (let i = 1; i < BAT.length; i++) { const [t0] = BAT[i - 1], [t1, b] = BAT[i]; if (b < BAT[i - 1][1] && t1 - t0 < 1) for (let s = t0; s < t1; s += .05) ev(s, 'hptick'); }

// ———————————————— script: UI track per shot ————————————————
// s01–s04 open
ev(0, 'bed', { name: 'rain', t1: DUR, gain: 1 });
ev(at('s01', .3), 'snore'); ev(at('s01', 1.0), 'snore');
ev(at('s01', 1.4), 'ping'); hit('ping', at('s01', 1.4)); ev(at('s01', 1.45), 'boing'); ev(at('s01', 1.78), 'land'); ev(at('s01', 1.8), 'clack');
ev(at('s02', .5), 'pop');
ev(SH.s03.t0, 'mosaic', { up: 1 }); ev(at('s03', .2), 'ding'); ['.5', '.75', '1.0'].forEach(x => ev(at('s03', +x), 'blip', { p: 1.6, who: 'sys' }));
ev(at('s03', 2.5), 'cursor');
UI.push({ kind: 'quest', t0: at('s04', .1), t1: SH.s04.t1, title: '任务', text: '午夜前送达一碗长寿面' }); ev(at('s04', .1), 'quest'); typing(at('s04', .45), '午夜前送达一碗长寿面', 12, 'sys');
SUBS.push({ t0: at('s04', .1), t1: SH.s04.t1, text: '任务：午夜前送达一碗长寿面' });
MENU('s04', .5, 4.0, { x: 226, y: 92, items: [{ label: '接受' }, { label: '拒绝' }], cur: () => 0, sel: at('s04', 3.3) });
ev(at('s04', 3.3), 'select'); ev(at('s04', 3.35), 'accept'); hit('accept', at('s04', 3.3));
// s05 title over the overworld; s06 equip; s07 mount; s08 travel
ev(SH.s05.t0, 'mosaic', { up: 0 }); hit('ow_downbeat', SH.s05.t0, 'ow', 0);
MENU('s06', .2, 4.0, { x: 214, y: 30, w: 100, items: [{ label: '雨衣', icon: ICON.coat }, { label: '充电宝', icon: ICON.bank }, { label: '备用雨伞', icon: ICON.umbrella }], cur: () => 0, sel: at('s06', 1.0), title: '道具' });
ev(at('s06', .5), 'cursor'); ev(at('s06', 1.0), 'select'); ev(at('s06', 1.2), 'cloth'); ev(at('s06', 1.95), 'gust'); ev(at('s06', 2.0), 'flap'); ev(at('s06', 2.8), 'swat');
hit('equip', at('s06', 1.0), 'ow', 10);
ev(at('s07', .45), 'jump'); ev(at('s07', 1.0), 'seat'); hit('seat', at('s07', 1.0), 'ow', 18); ev(at('s07', 1.5), 'click'); ev(at('s07', 1.7), 'motor', { d: 1.0 }); ev(at('s07', 1.8), 'splash', { g: .5 });
ev(at('s08', .2), 'motor', { d: 2.3, g: .5 }); ev(at('s08', 2.5), 'alert'); hit('alert1', at('s08', 2.5), 'ow', 26); ev(at('s08', 2.6), 'swirl');
// s09–s12 battle 1: the red light
ev(SH.s09.t0, 'stomp'); hit('b1_in', SH.s09.t0, 'b1', 0);
M('s09', .2, 3.2, '红灯 挡路了！');
const CMD = [{ label: '攻击' }, { label: '等待' }, { label: '道具' }, { label: '逃跑' }];
UI.push({ kind: 'cmd', t0: SH.s10.t0, t1: SH.s11.t1, items: CMD });
ev(at('s10', .2), 'open', { soft: 1 }); ev(at('s10', .25), 'cursor'); ev(at('s10', 1.2), 'cursor'); ev(at('s10', 1.3), 'select');
ev(at('s10', 1.35), 'zip'); ev(at('s10', 1.55), 'buzz'); ev(at('s10', 1.6), 'yank');
M('s10', 1.3, 4.0, '不能闯红灯！');
ev(at('s11', .1), 'cursor'); ev(at('s11', .2), 'select');
M('s11', .3, 3.2, '小满 等啊等……');
for (let s = .5; s < 3.0; s += 1 / 6) ev(at('s11', s), 'tap', { g: .5 });
ev(at('s11', 1.6), 'yawn'); ev(at('s11', 2.2), 'reset');
ev(SH.s12.t0, 'green'); hit('green', SH.s12.t0, 'b1', 26);
M('s12', .1, 2.8, '绿灯 亮了！');
ev(at('s12', .3), 'victory');
// s13 ride; s14 battle 2
ev(at('s13', 0), 'motor', { d: 2.6, g: .8 }); ev(at('s13', 1.8), 'swirl');
ev(SH.s14.t0, 'rise', { d: 1.2 }); hit('b2_in', SH.s14.t0, 'b2', 0);
M('s14', .1, 3.2, '积水 涨上来了！');
ev(at('s14', 3.0), 'rev'); ev(at('s14', 3.2), 'dash'); hit('dash', at('s14', 3.2), 'b2', 8); ev(at('s14', 3.5), 'bigsplash'); ev(at('s14', 3.5), 'hit');
M('s14', 3.6, 6.4, '手机进水了！'); ev(at('s14', 3.65), 'zap');
ev(at('s14', 5.0), 'shake');
// s15–s18 bus stop
ev(at('s15', .2), 'motor', { d: .8, g: .6 }); ev(at('s15', 1.0), 'skid'); hit('skid', at('s15', 1.0), 'kid', 2);
D('s16', .1, 3.8, 'kid', '公交停了……我走过去。', { expr: 'sadWet', wet: 1 });
MENU('s17', .02, 3.6, { x: 8, y: 26, w: 100, items: [{ label: '雨衣', icon: ICON.coat }, { label: '充电宝', icon: ICON.bank }, { label: '备用雨伞', icon: ICON.umbrella, dimAt: at('s17', 1.6) }], cur: (t) => t < at('s17', .6) ? 0 : t < at('s17', .9) ? ss(seg(t, at('s17', .6), at('s17', .7))) : 1 + ss(seg(t, at('s17', .9), at('s17', 1.0))), sel: at('s17', 1.6) });
ev(at('s17', .6), 'cursor'); ev(at('s17', .9), 'cursor'); ev(at('s17', 1.6), 'select'); ev(at('s17', 2.0), 'umbrella'); hit('umbrella', at('s17', 2.0), 'kid', 16); ev(at('s17', 2.1), 'item');
D('s18', .1, 2.6, 'kid', '谢谢叔叔！', { expr: 'joy', noPortrait: 1 });
// s19–s22 the dog
ev(at('s19', .2), 'motor', { d: .6, g: .5 }); ev(at('s19', .8), 'alert'); ev(at('s19', 1.0), 'swirl');
ev(SH.s20.t0, 'bark'); ev(at('s20', .35), 'bark'); ev(at('s20', .6), 'scare'); ev(at('s20', 1.2), 'bark'); hit('b3_in', SH.s20.t0, 'dog', 4);
M('s20', .1, 3.0, '大黄 汪汪汪！');
const CMD3 = [{ label: '攻击' }, { label: '等待' }, { label: '摸摸', newAt: at('s21', .4) }, { label: '逃跑' }];
UI.push({ kind: 'cmd', t0: SH.s21.t0, t1: SH.s21.t1, items: CMD3 });
ev(at('s21', .4), 'sparkle'); ev(at('s21', 1.0), 'cursor'); ev(at('s21', 1.4), 'select'); ev(at('s21', 1.8), 'pat'); ev(at('s21', 2.1), 'pat'); ev(at('s21', 2.4), 'pat'); ev(at('s21', 2.0), 'heart'); ev(at('s21', 2.5), 'heart');
hit('pat', at('s21', 1.4), 'dog', 15);
M('s22', .03, 3.0, '大黄 成了朋友！'); ev(at('s22', .3), 'victory', { soft: 1 }); ev(at('s22', .5), 'woof');
// s23–s28 boss: the stairs
[.6, 1.0, 1.4].forEach(x => ev(at('s23', x), 'liftbuzz')); ev(at('s23', 2.2), 'thunk');
ev(at('s24', .3), 'sweat');
ev(at('s25', .0), 'bosssting'); hit('boss_well', SH.s25.t0, 'boss', 12);
M('s25', .3, 4.5, 'BOSS：二十八层楼梯');
ev(SH.s26.t0, 'swirlin'); ev(at('s26', .4), 'shout'); ev(at('s26', .75), 'lighton'); hit('lighton', at('s26', .75), 'boss', 26);
M('s26', .3, 3.0, '声控灯 亮了！');
for (let s = .1; s < 4.1; s += .25) ev(at('s27', s), 'step', { v: .7 + .3 * Math.sin(s * 5), stair: 1 });
ev(at('s27', 1.0), 'item'); M('s27', 1.0, 4.2, '充电宝：电量+20%');
for (const f of [1.0, 2.0, 3.0, 4.0]) ev(at('s27', f), 'floor');
ev(at('s28', .3), 'step', { v: .5, stair: 1 }); ev(at('s28', .6), 'step', { v: .4, stair: 1 }); ev(at('s28', .9), 'flop'); ev(at('s28', 1.0), 'bossdown'); ev(at('s28', 2.0), 'boing'); ev(at('s28', 2.5), 'clocktick');
M('s28', .2, 3.0, '楼梯 倒下了。');
// s29–s34 the door
ev(at('s29', .5), 'knock'); ev(at('s29', .8), 'knock'); hit('knock', at('s29', .5));
ev(at('s30', 0), 'latch'); ev(at('s30', .3), 'creak', { d: 1.0 }); ev(at('s30', .4), 'warm'); hit('door', SH.s30.t0, 'tender', 0);
D('s31', .1, 3.3, 'lady', '哎呀，淋成这样……', { noPortrait: 1, cps: 9 });
D('s32', .1, 2.6, 'rider', '……蜡烛呢？', { noPortrait: 1, cps: 9 }); ev(at('s32', .2), 'rustle');
D('s33', .04, 3.5, 'lady', '没事。今天是我生日。', { noPortrait: 1, cps: 9 });
D('s34', .1, 4.6, 'lady', '孙子说要来，我叫他别来了。', { expr: 'wistful', cps: 9 });
// s35–s38 the decision, the song, 00:00, the phone dies
MENU('s35', .9, 3.8, { x: 214, y: 30, w: 96, items: [{ label: '手电筒', icon: ICON.light }], cur: () => 0, sel: at('s35', 3.0), hesitate: [at('s35', 1.6), at('s35', 2.9)] });
ev(at('s35', 1.0), 'cursor'); ev(at('s35', 3.0), 'select'); ev(at('s35', 3.15), 'click'); hit('torch', at('s35', 3.0));
// the song: public-domain birthday tune, one syllable per note; blips are the melody (mix renders them as 'sing' events)
const SONG = [['祝', 0, .75], ['你', .75, .25], ['生', 1, 1], ['日', 2, 1], ['快', 3, 1], ['乐', 4, 2], ['祝', 6, .75], ['你', 6.75, .25], ['生', 7, 1], ['日', 8, 1], ['快', 9, 1], ['乐', 10, 2]];
const SONG_N = [55, 55, 57, 55, 60, 59, 55, 55, 57, 55, 62, 60];   // G G A G C B / G G A G D C (in C)
const songT0 = at('s36', .6), sb = 60 / 105;
SONG.forEach(([ch, b, d], i) => ev(songT0 + b * sb, 'sing', { n: SONG_N[i], d: d * sb * .92 }));
hit('song', songT0, 'song', 0);
UI.push({ kind: 'dlg', t0: at('s36', .3), t1: SH.s36.t1, who: 'rider', text: '♪ 祝你生日快乐 ♪', song: { t0: songT0, beats: SONG.map(s => s[1]), sb }, expr: 'sing' });
SUBS.push({ t0: at('s36', .3), t1: SH.s36.t1, text: '♪ 祝你生日快乐 ♪' }); ev(at('s36', .3), 'open', { soft: 1 });
ev(at('s37', .8), 'chime'); hit('midnight', at('s37', .8));
ev(at('s38', .55), 'breath'); ev(at('s38', 1.0), 'click'); ev(at('s38', 1.02), 'bitdrop'); ev(at('s38', 1.0), 'silence', { t1: at('s38', 2.0) }); hit('dark', at('s38', 1.0));
M('s38', 1.2, 4.0, '手机没电了。');
// s39–s42 pay-off
for (let s = at('s38', 2.2); s < SH.s40.t0 + .6; s += .32) ev(s, 'step', { v: .45, stair: 1, kid: 1 });
ev(at('s40', .4), 'shake');
D('s40', 0, 3.2, 'kid', '奶奶！生日快乐！', { expr: 'happy' }); hit('kid', SH.s40.t0, 'payoff', 0);
D('s41', .1, 2.3, 'lady', '小豆？！', { noPortrait: 1 });
D('s42', .1, 2.7, 'kid', '雨伞叔叔！', { expr: 'joy' }); ev(at('s42', 1.8), 'wink');
// s43–s45 save, level up, end
ev(at('s43', .2), 'sparkle');
UI.push({ kind: 'save', t0: at('s43', .02), t1: SH.s43.t1, text: '要存档吗？', sel: at('s43', 1.6) }); SUBS.push({ t0: at('s43', .02), t1: SH.s43.t1, text: '要存档吗？' });
ev(at('s43', .02), 'open'); ev(at('s43', 1.0), 'cursor'); ev(at('s43', 1.6), 'select'); for (let s = 1.7; s < 2.5; s += .08) ev(at('s43', s), 'savetick'); ev(at('s43', 2.5), 'saved');
UI.push({ kind: 'level', t0: at('s44', .1), t1: SH.s44.t1, text: '小满 升级了！', text2: '温暖 +1' }); SUBS.push({ t0: at('s44', .1), t1: SH.s44.t1, text: '小满 升级了！温暖 +1' });
hit('fanfare', SH.s44.t0, 'fanfare', 0); ev(SH.s44.t0, 'sparkle');
ev(at('s45', .6), 'rainstop'); ev(at('s45', .9), 'motor', { d: 2.0, g: .4 }); ev(at('s45', 1.4), 'woof', { g: .5 });
// rain bed automation (gain per shot)
const RAINGAIN = { s25: .3, s26: .25, s27: .25, s28: .3, s29: .35, s30: .3, s31: .3, s32: .3, s33: .3, s34: .3, s35: .35, s36: .2, s37: .2, s38: .15, s39: .15, s40: .2, s41: .2, s42: .2, s43: .15, s44: .15, s45: 1, s23: .4, s24: .4, s14: .6 };
for (const [id] of SHOT_D) ev(SH[id].t0, 'raingain', { g: RAINGAIN[id] ?? 1 });

// ———————————————— drawing helpers ————————————————
const hudOn = (t) => { const id = shotAt(t).id; return ['s01', 's04', 's08', 's13', 's15', 's16', 's17', 's19', 's23', 's25', 's29', 's30', 's35', 's36', 's37', 's38'].includes(id); };
function drawHUD(t) {
  const sid = shotAt(t).id; if (sid === 's01' && t < .6) return;
  const b = battery(t); hud(fb, b, clock(t), { blink: Math.floor(t * 4) % 2 === 0, clockCol: clock(t) === '00:00' ? C.goldL : C.yellow });
}
function statusWin(t, o = {}) {   // battle status: name, HP = battery, time
  const x = 128, y = 132, w = 188, h = 45; win(fb, x, y, w, h);
  text(fb, '小满', x + 10, y + 6, C.white, { shadow: C.ink });
  const b = battery(t); const bc = b <= 15 ? C.hot : C.lime;
  text(fb, '电量', x + 48, y + 6, C.silver, { shadow: C.ink });
  fb.rect(x + 78, y + 10, 62, 6, C.ink); fb.rect(x + 79, y + 11, Math.round(60 * b / 100), 4, bc);
  text(fb, `${b}%`, x + 146, y + 6, b <= 15 ? C.hot : C.white, { shadow: C.ink });
  text(fb, '时间', x + 48, y + 24, C.silver, { shadow: C.ink }); text(fb, clock(t), x + 80, y + 24, C.yellow, { shadow: C.ink });
  if (o.floor) { text(fb, o.floor, x + 134, y + 24, C.cyan, { shadow: C.ink }); }
}
function cmdWin(t, items, ui) {
  const x = 4, y = 132, w = 120, h = 45; win(fb, x, y, w, h);
  items.forEach((it, i) => {
    const cx = x + 18 + (i % 2) * 52, cy = y + 6 + Math.floor(i / 2) * 18;
    if (it.newAt) { if (t < it.newAt) { text(fb, '？？', cx, cy, C.slate, { shadow: C.ink }); return; } if (t < it.newAt + .6 && Math.floor(t * 12) % 2) return; }
    text(fb, it.label, cx, cy, it.newAt ? C.pink : C.white, { shadow: C.ink });
  });
  return { x, y };
}
function cmdCursor(t, idx, bob = true) { const x = 4, y = 132; const i = Math.floor(idx), f = idx - i; const ci = (k) => [x + 6 + (k % 2) * 52, y + 9 + Math.floor(k / 2) * 18]; const a = ci(i), b = ci(Math.min(3, i + 1)); const cx = Math.round(lerp(a[0], b[0], f)), cy = Math.round(lerp(a[1], b[1], f)); hand(fb, cx - (bob ? Math.floor(t * 4) % 2 : 0), cy); }

function drawUI(t) {
  for (const u of UI) {
    if (t < u.t0 || t >= u.t1) continue; const lt = t - u.t0;
    if (u.kind === 'dlg') {
      let shown = u.text, cps = u.cps || 12;
      const o = { name: { rider: '小满', kid: '小豆', lady: '林奶奶' }[u.who], text: u.text, t: lt, cps };
      if (!u.noPortrait) o.portrait = portrait(u.who, u.expr || 'neutral', { wet: u.wet });
      if (u.song) { // reveal one syllable per sung note
        const chars = [...u.text]; const n = u.song.beats.filter(b => t >= u.song.t0 + b * u.song.sb).length; const idx = [2, 3, 4, 5, 6, 7, 2, 3, 4, 5, 6, 7];
        const k = n === 0 ? 2 : n <= 6 ? 2 + n : 8 + 2; // show "♪ " then syllables; second phrase re-sung: keep full line
        o.text = u.text; o.t = 99; o.cps = 1;
        const vis = Math.min(chars.length, n <= 6 ? 2 + n : chars.length);
        dialog(fb, { ...o, t: Math.max(lt, .2), text: chars.slice(0, vis).join(''), noArrow: true });
        // bouncing note above the box on each beat
        const lastB = u.song.beats.filter(b => t >= u.song.t0 + b * u.song.sb).pop();
        if (lastB !== undefined) { const ph = t - (u.song.t0 + lastB * u.song.sb); if (ph < .3) text(fb, '♪', 280, DLG.y - 18 - Math.round(6 * Math.sin(ph / .3 * Math.PI)), C.yellow, { outline: C.ink }); }
        continue;
      }
      dialog(fb, o);
    }
    if (u.kind === 'msg') msg(fb, u.text, lt, { hud: hudOn(t) });
    if (u.kind === 'quest') questBox(fb, u.title, u.text, lt, { w: 206, x: 10, y: 22 });
    if (u.kind === 'menu') {
      const items = u.items.map(it => ({ ...it, dim: it.dimAt !== undefined && t >= it.dimAt }));
      const sel = u.sel !== undefined && t >= u.sel && t < u.sel + .25 && Math.floor(t * 16) % 2;
      const hes = u.hesitate && t >= u.hesitate[0] && t < u.hesitate[1];
      const dx = Math.round(-120 * (1 - eo(clamp(lt / .3, 0, 1)))) * (u.x < 160 ? 1 : -1);
      if (u.title) { win(fb, u.x + dx, u.y - 18, 46, 19, { fill: [C.plum, C.night] }); text(fb, u.title, u.x + dx + 10, u.y - 15, C.yellow, { shadow: C.ink }); }
      menu(fb, u.x + dx, u.y, items, sel ? null : u.cur(t), t, { w: u.w || 86, bob: !hes });
    }
    if (u.kind === 'cmd') {
      cmdWin(t, u.items, u);
    }
    if (u.kind === 'save') {
      const x = 70, y = 4 + Math.round(-60 * (1 - eo(clamp(lt / .3, 0, 1)))); win(fb, x, y, 180, 62, { fill: [C.plum, C.night] });
      text(fb, u.text, x + 14, y + 8, C.white, { shadow: C.ink });
      const tl = t - u.sel; const saving = t >= u.sel;
      text(fb, '是', x + 40, y + 28, C.white, { shadow: C.ink }); text(fb, '否', x + 104, y + 28, C.white, { shadow: C.ink });
      if (!saving || Math.floor(t * 16) % 2) hand(fb, x + 26 - (saving ? 0 : Math.floor(t * 4) % 2), y + 31);
      if (saving) { const p = clamp(tl / .8, 0, 1); fb.rect(x + 14, y + 48, 152, 6, C.ink); fb.rect(x + 15, y + 49, Math.round(150 * p), 4, C.cyan); if (p >= 1) text(fb, '已存档', x + 120, y + 28, C.lime, { shadow: C.ink }); }
    }
    if (u.kind === 'level') {
      const x = 64, y = 4 + Math.round(-70 * (1 - eo(clamp(lt / .3, 0, 1)))); win(fb, x, y, 192, 66, { fill: [C.plum, C.night] });
      text(fb, u.text, x + 14, y + 8, C.yellow, { shadow: C.ink });
      text(fb, '温暖', x + 14, y + 30, C.white, { shadow: C.ink });
      const p = clamp((lt - .5) / .6, 0, 1); fb.rect(x + 52, y + 34, 82, 6, C.ink); fb.rect(x + 53, y + 35, Math.round(lerp(40, 80, p)), 4, C.pink);
      if (lt > 1.1) { const pop = lt < 1.3 ? -2 : 0; text(fb, '+1', x + 142, y + 30 + pop, C.lime, { shadow: C.ink }); }
      if (lt > 1.4) for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + lt * 2; fb.px(x + 160 + Math.cos(a) * (8 + (lt * 10) % 6), y + 36 + Math.sin(a) * (5 + (lt * 10) % 4), k % 2 ? C.yellow : C.white); }
    }
  }
}
// TEXTS for readcheck: every text visible at t with its box (in 1920×1080 px)
const K = 6;
function texts(t) {
  const L = [];
  for (const u of UI) {
    if (t < u.t0 || t >= u.t1) continue;
    if (u.kind === 'dlg') L.push({ id: 'dlg' + u.t0, text: u.text, x0: DLG.x * K, y0: DLG.y * K, x1: (DLG.x + DLG.w) * K, y1: (DLG.y + DLG.h) * K });
    if (u.kind === 'msg') L.push({ id: 'msg' + u.t0, text: u.text, x0: 4 * K, y0: 4 * K, x1: 312 * K, y1: 23 * K });
    if (u.kind === 'quest') { L.push({ id: 'questT', text: u.title, x0: 10 * K, y0: 22 * K, x1: 216 * K, y1: 44 * K }); L.push({ id: 'questB', text: u.text, x0: 10 * K, y0: 44 * K, x1: 216 * K, y1: 68 * K }); }
    if (u.kind === 'menu') L.push({ id: 'menu' + u.t0, text: u.items.map(i => i.label).join(' '), x0: Math.max(0, u.x - 2) * K, y0: u.y * K, x1: Math.min(320, u.x + (u.w || 86)) * K, y1: (u.y + u.items.length * 16 + 10) * K });
    if (u.kind === 'cmd') L.push({ id: 'cmd' + u.t0, text: u.items.map(i => i.label).join(' '), x0: 4 * K, y0: 132 * K, x1: 124 * K, y1: 177 * K });
    if (u.kind === 'save') L.push({ id: 'save', text: u.text + ' 是 否', x0: 70 * K, y0: 4 * K, x1: 250 * K, y1: 66 * K });
    if (u.kind === 'level') L.push({ id: 'level', text: u.text + u.text2, x0: 64 * K, y0: 4 * K, x1: 256 * K, y1: 70 * K });
  }
  const s = shotAt(t);
  if (s.id === 's05') L.push({ id: 'title', text: '《外卖勇者》', x0: 60 * K, y0: 50 * K, x1: 260 * K, y1: 90 * K });
  if (s.id === 's03') { const lt = t - s.t0; const rows = [[.2, '新订单', 29, 47], [.5, '长寿面×1', 52, 76], [.75, '幸福里3栋2803', 82, 106], [1.0, '备注请帮忙插一根蜡烛', 112, 156]]; for (const [l0, tx, y0, y1] of rows) if (lt >= l0) L.push({ id: 'ph' + l0, text: tx, x0: 106 * K, y0: y0 * K, x1: 214 * K, y1: y1 * K }); }
  if (s.id === 's23') L.push({ id: 'liftsign', text: '电梯维修', x0: 126 * K, y0: 56 * K, x1: 194 * K, y1: 76 * K });
  if (s.id === 's45' && t - s.t0 >= 1.5) L.push({ id: 'end', text: '完', x0: 140 * K, y0: 46 * K, x1: 180 * K, y1: 80 * K });
  return L;
}

// ———————————————— shots ————————————————
const shotList = SHOT_D.map(([id]) => SH[id]);
function shotAt(t) { for (const s of shotList) if (t < s.t1) return s; return shotList[shotList.length - 1]; }
let RAIN = 1, MODE = 'rain', LUTX = null, POST = [];
const INDOOR = new Set(['s23', 's24', 's25', 's26', 's27', 's28', 's29', 's30', 's31', 's32', 's33', 's34', 's35', 's36', 's37', 's38', 's39', 's40', 's41', 's42', 's43', 's44']);
const flagSway = (t, k = 1) => Math.round(Math.sin(t * 9) * k);
// rider on bike helper (side view)
function riderOnBike(gx, gy, t, o = {}) {
  const u = o.u || 1, face = o.face || 1;
  const bk = ebike(fb, gx, gy, { u, light: o.light ?? 1, spin: o.spin || 0, bounce: o.bounce || 0, face });
  const p = o.pose || POSES.ride;
  figure(fb, 'rider', p, bk.seat[0] + 1.5 * u * face, bk.seat[1] + 11.6 * u + (p.hipY || 0) * 0, { u, face, coat: o.coat, hood: o.hood, flag: o.flag ?? flagSway(t, 1), expr: o.expr, sweat: o.sweat });
  return bk;
}

const SHOTS = {
  // s01 — wide street, rain, rider asleep on the parked bike; ping; jolt
  s01(t, lt) {
    S.street(fb, t, 0);
    const jolt = lt < 1.45 ? 0 : lt < 1.62 ? 1 : lt < 1.85 ? 2 : 3;
    const pose = jolt === 0 ? { ...POSES.sitSleep, hipY: 4 + (Math.floor(lt * 2) % 2) * .4 } : jolt === 1 ? { ...POSES.ride, hipY: -4, lean: -8, sq: 1.18, armB: [150, 20], armF: [160, 10] } : jolt === 2 ? { ...POSES.ride, hipY: 4.5, sq: .84, lean: 26 } : POSES.ride;
    const bk = ebike(fb, 92, 124, { light: 0, bounce: jolt === 2 ? 1 : 0 });
    figure(fb, 'rider', pose, bk.seat[0] + 1.5, bk.seat[1] + 11.6, { expr: jolt ? 'startled' : 'sleepy', blink: jolt === 0, flag: jolt >= 2 ? flagSway(lt * 2, 2) : 0 });
    // phone on the handlebar mount: lights up on the ping
    const on = lt >= 1.4; fb.rect(bk.bar[0] + 1, bk.bar[1] - 4, 3, 5, C.ink); if (on) { fb.rect(bk.bar[0] + 2, bk.bar[1] - 3, 1, 3, C.glow); fb.glow(bk.bar[0] + 2, bk.bar[1] - 2, 8, 8, LIGHT, .9); }
    // snore bubbles; "!" on the ping
    if (lt < 1.4) for (let k = 0; k < 2; k++) { const ph = (lt * .8 + k * .5) % 1; text(fb, 'z', 84 + k * 4 + ph * 6, 84 - ph * 14 - k * 4, C.silver, { size: 8, shadow: C.ink }); }
    if (lt >= 1.4 && lt < 2.6) { const pop = lt < 1.5 ? 3 : 0; text(fb, '!', 104, 66 - pop, C.yellow, { outline: C.ink }); }
    S.splashes(fb, t, 128, 178, 30);
    LUTX = (L) => lt < .6 ? darken(L, 1 - Math.floor(lt / .15) / 4) : L;
  },
  // s02 — close-up: sleepy → startled, phone glow on his face
  s02(t, lt) {
    S.cuBack(fb, t, 'street');
    const e = lt < .5 ? 'sleepy' : 'startled'; const pop = lt >= .5 && lt < .62 ? -3 : 0;
    const b = bust('rider', e, 3.1, { w: 150, h: 150, sway: flagSway(t, 1) });
    fb.blit(b.spr, 92, 36 + pop);
    // phone glow from below right
    if (lt >= .5) { fb.relight(120, 70, 160, 110, (x, y) => { const d = Math.hypot((x - 226) / 80, (y - 184) / 90); return d < 1 && bayer(x, y) < (1 - d) * 1.5 ? LIGHT : null; }); fb.rect(212, 150, 28, 36, C.ink); fb.rect(215, 153, 22, 30, C.glow); }
  },
  // s03 — insert: the order on the phone (thumbnail expand + mosaic in)
  s03(t, lt) {
    S.cuBack(fb, t, 'night'); RAIN = .5;
    const px0 = 100, py0 = 6;
    // hand
    fb.ell(160, 176, 70, 26, (x, y, nx, ny) => ny < -.4 ? C.skin : C.skinS); fb.ell(214, 150, 10, 22, C.skin);
    // phone body
    fb.rect(px0, py0, 120, 178, C.ink); fb.rect(px0 + 2, py0 + 2, 116, 174, C.night); fb.rect(px0 + 6, py0 + 12, 108, 166, C.white);
    fb.rect(px0 + 50, py0 + 5, 20, 2, C.dslate);
    // status bar
    fb.rect(px0 + 6, py0 + 12, 108, 11, C.dslate); text(fb, '23:40', px0 + 9, py0 + 12, C.white, { size: 8 });
    fb.frame(px0 + 92, py0 + 15, 12, 6, C.white); fb.rect(px0 + 104, py0 + 17, 1, 2, C.white); fb.rect(px0 + 93, py0 + 16, 4, 4, C.lime); text(fb, '41%', px0 + 75, py0 + 12, C.white, { size: 8 });
    // app header
    fb.rect(px0 + 6, py0 + 23, 108, 18, C.orange); text(fb, '新订单', px0 + 38, py0 + 26, C.white, { shadow: C.rust });
    const row = (k, lt0, draw) => { if (lt < lt0) return; const dy = lt < lt0 + .12 ? 3 : 0; draw(py0 + 46 + k * 30 + dy); };
    row(0, .5, y => { fb.rect(px0 + 10, y, 100, 24, C.silver); bowl(fb, px0 + 22, y + 13, .45, t, { steam: false }); text(fb, '长寿面×1', px0 + 38, y + 6, C.ink); });
    row(1, .75, y => { fb.rect(px0 + 10, y, 100, 24, C.silver); fb.ell(px0 + 20, y + 11, 4, 5, C.red); fb.disc(px0 + 20, y + 10, 1.5, C.white); text(fb, '幸福里3栋2803', px0 + 28, y + 6, C.ink); });
    row(2, 1.0, y => {
      const hl = lt > 2.5 && Math.floor(lt * 3) % 2 === 0;
      fb.rect(px0 + 10, y, 100, 44, hl ? C.yellow : C.sand); text(fb, '备注', px0 + 14, y + 3, C.rust, { size: 8 });
      text(fb, '请帮忙插一根', px0 + 14, y + 13, C.ink); text(fb, '蜡烛', px0 + 14, y + 28, C.ink);
      // a little candle icon
      fb.rect(px0 + 92, y + 26, 4, 12, C.white); fb.frame(px0 + 92, y + 26, 4, 12, C.slate); fb.px(px0 + 94, y + 24, C.amber); fb.px(px0 + 94, y + 23, C.yellow);
    });
    // rain drops on the glass
    for (let k = 0; k < 6; k++) { const x = px0 + 12 + Math.round(hash(k, 31) * 96), y = py0 + 30 + Math.round(hash(k, 32) * 130); fb.rect(x, y, 2, 3, C.cyan); fb.px(x, y, C.white); }
    // thumb
    fb.ell(232, 150, 14, 20, (x, y, nx, ny) => nx < -.3 ? C.skinS : C.skin);
    if (lt < .5) POST.push(u => mosaic(u, Math.round(lerp(10, 1, lt / .5)), 160, 90));
  },
  // s04 — the quest box over the street; accept
  s04(t, lt) {
    S.street(fb, t, 0);
    const pose = lt > 3.4 && lt < 3.9 ? { ...POSES.ride, armF: [170, 0], sq: 1.05 } : POSES.ride;
    const bk = ebike(fb, 92, 124, { light: lt > 3.4 ? 1 : 0 });
    figure(fb, 'rider', pose, bk.seat[0] + 1.5, bk.seat[1] + 11.6, { flag: flagSway(t, 1) });
    if (lt > 3.4) headCone(fb, bk.light[0], bk.light[1], 1, 80, LIGHT);
    S.splashes(fb, t, 128, 178, 30);
    if (lt > 3.6) POST.push(u => mosaic(u, Math.round(lerp(1, 12, (lt - 3.6) / .4))));
  },
  // s05 — overworld establishing + title
  s05(t, lt) {
    const cx = lerp(160, 330, eio(lt / 4)), cy = lerp(260, 118, eio(lt / 4));
    S.overworld(fb, t, cx, cy, { bike: { ...S.routePoint(0), light: 1 } });
    // title: 2× glyphs, 8-neighbour ink outline, row gradient, Bayer dissolve in/out
    const s = '外卖勇者', w = text2W(s, 12, 4), x = Math.round((W - w) / 2), y = 56;
    const tf = new FB(); tf.clear(T);
    win(tf, x - 22, y - 10, w + 44, 64, { fill: [C.night, C.deep] });
    text(tf, '《', x - 16, y + 7, C.yellow); text(tf, '》', x + w + 4, y + 7, C.yellow);
    text2(tf, s, x, y, r => r < 6 ? C.goldL : r < 12 ? C.amber : r < 18 ? C.orange : C.rust, { outline: C.ink, track: 4 });
    text(tf, '最后一单', x + w / 2 - 24, y + 36, C.silver, { shadow: C.ink });
    const a = lt < .5 ? lt / .5 : lt > 3.5 ? (4 - lt) / .5 : 1;
    for (let i = 0; i < W * H; i++) { const c = tf.d[i]; if (c !== T && bayer(i % W, (i / W) | 0) < a) fb.d[i] = c; }
    if (lt < .4) POST.push(u => mosaic(u, Math.round(lerp(12, 1, lt / .4))));
  },
  // s06 — medium: equip the raincoat; the hood blows over his face; he swats it back
  s06(t, lt) {
    S.street(fb, t, 40);
    const coat = lt >= 1.2, hoodOver = lt >= 2.0 && lt < 2.8;
    const pose = poseAt([[0, POSES.stand], [1.0, POSES.stand], [1.2, { ...POSES.shrug, sq: 1.04 }], [1.5, POSES.stand], [2.0, { ...POSES.stand, lean: -6 }], [2.6, { ...POSES.stand, armF: [160, 60], lean: -4 }], [2.8, { ...POSES.stand, armF: [120, 20] }], [3.1, POSES.stand]], lt);
    ebike(fb, 168, 178, { u: 2.2, light: 0 });
    figure(fb, 'rider', pose, 92, 182, { u: 2.4, coat, hood: coat && !hoodOver && lt > 2.8, expr: lt < 1.0 ? 'neutral' : lt < 2.0 ? 'determined' : lt < 3.0 ? 'deadpan' : 'deadpan', flag: flagSway(t, 2) });
    if (hoodOver) { // the hood flipped over his face: a teal blob covering the head, flapping (12 fps)
      const fl = Math.floor(lt * 12) % 2; fb.ell(98 + fl, 84, 18, 15, (x, y, nx, ny) => (-nx * .6 - ny * .5) > .4 ? C.cyan : C.blue); fb.ell(98 + fl, 84, 18, 15, (x, y, nx, ny) => nx * nx + ny * ny > .85 ? C.ink : T);
      fb.line(84, 96, 72 - fl * 2, 104, C.blue);
    }
    if (lt >= 1.2 && lt < 1.4) for (let k = 0; k < 8; k++) { const a = k / 8 * 6.28; fb.px(92 + Math.cos(a) * (20 + (lt - 1.2) * 60), 110 + Math.sin(a) * (16 + (lt - 1.2) * 40), C.white); }
    RAIN = lt >= 1.9 && lt < 2.3 ? 1.6 : 1;
  },
  // s07 — full: crouch, hop, land on the seat (squash), bounce, headlight, go
  s07(t, lt) {
    S.street(fb, t, 40);
    const go = lt > 1.8 ? ei(seg(lt, 1.8, 2.5)) * 260 : 0;
    const bounce = lt > 1.0 && lt < 1.5 ? Math.round(Math.sin((lt - 1.0) / .5 * Math.PI * 2) * 2 * (1 - (lt - 1.0) / .5)) : 0;
    const bk = ebike(fb, 150 + go, 124, { light: lt > 1.5 ? 1 : 0, bounce, spin: go * .3 });
    if (lt < 1.0) {
      const p = poseAt([[0, POSES.stand], [.45, POSES.crouch], [.6, POSES.jump], [1.0, POSES.jump]], lt);
      const k = seg(lt, .45, 1.0); const x = lerp(118, bk.seat[0] + 1.5, k), y = lerp(124, bk.seat[1] + 11.6, k) - Math.sin(k * Math.PI) * 14;
      figure(fb, 'rider', p, x, y, { coat: 1, hood: 1, flag: flagSway(t, 1) });
    } else {
      const p = lt < 1.15 ? { ...POSES.ride, sq: .82, hipY: 5 } : POSES.ride;
      figure(fb, 'rider', p, bk.seat[0] + 1.5, bk.seat[1] + 11.6 + bounce, { coat: 1, hood: 1, flag: lt > 1.8 ? -2 : flagSway(t * 2, 2) });
    }
    if (lt > 1.5) headCone(fb, bk.light[0], bk.light[1], 1, 90, LIGHT);
    S.splashes(fb, t, 128, 178, 30);
    if (lt > 1.8 && lt < 2.4) for (let k = 0; k < 6; k++) fb.px(bk.seat[0] - 20 - k * 4, 124 - (k % 3), C.silver);
  },
  // s08 — overworld travel, "!" and the encounter swirl
  s08(t, lt) {
    const u = lerp(0, .19, clamp(lt / 2.5, 0, 1)); const p = S.routePoint(u);
    const { ox, oy } = S.overworld(fb, t, p.x + 20, p.y - 10, { bike: { ...p, light: 1 }, route: [u + .01, u + .2] });
    if (lt > 2.5) text(fb, '!', p.x - ox - 2, p.y - oy - 22 - (lt < 2.6 ? 3 : 0), C.red, { outline: C.ink });
    if (lt > 2.6) { const s = (lt - 2.6) / .8; POST.push(u2 => { swirl(u2, s); mosaic(u2, 1 + Math.round(s * 6)); dissolve(u2, Math.min(.75, Math.max(0, s * 1.4 - .4))); }); }
  },
  // s09–s12 battle: the red light
  s09(t, lt) { battle1(t, lt, 0); },
  s10(t, lt) { battle1(t, lt, 1); },
  s11(t, lt) { battle1(t, lt, 2); },
  s12(t, lt) { battle1(t, lt, 3); },
  // s13 — parallax ride
  s13(t, lt) {
    const s = 300 + lt * 260; S.cityScroll(fb, t, s);
    const bob = Math.floor(t * 8) % 2;
    riderOnBike(150, 150 + bob, t, { u: 1.5, coat: 1, hood: 1, spin: lt * 20, flag: -2 });
    headCone(fb, 150 + 21, 150 - 27, 1, 110, LIGHT);
    for (let k = 0; k < 7; k++) { const x = mod(260 - lt * 600 + k * 50, 340) - 10; fb.hline(x, x + 12, 70 + k * 12, C.slate); }      // speed lines
    S.railing(fb, s); S.splashes(fb, t, 150, 178, 22);
    if (lt > 1.8) { const s2 = (lt - 1.8) / .8; POST.push(u2 => { swirl(u2, s2); mosaic(u2, 1 + Math.round(s2 * 6)); dissolve(u2, Math.min(.75, Math.max(0, s2 * 1.4 - .4))); }); }
  },
  // s14 — battle: the flooded underpass
  s14(t, lt) {
    S.battleBG(fb, t, 'under');
    const rise = clamp(lt / 1.2, 0, 1), hitT = lt - 3.5, dead = hitT > .4;
    if (!dead || Math.floor(lt * 12) % 2) floodBlob(fb, 90, 128, dead ? Math.max(0, 1 - (hitT - .4) * 1.5) : rise, t, { angry: 1, flash: hitT > 0 && hitT < .15 });
    // the rider charges on the bike: anticipation (lean back), dash (left), return
    const dash = lt < 3.0 ? 0 : lt < 3.2 ? -4 * seg(lt, 3.0, 3.2) : lt < 3.5 ? lerp(-4, -110, eo(seg(lt, 3.2, 3.5))) : lt < 4.3 ? lerp(-110, 0, eio(seg(lt, 3.5, 4.3))) : 0;
    const shake = lt > 5.0 && lt < 5.6 ? (Math.floor(lt * 24) % 2 ? 1 : -1) : 0;
    riderOnBike(246 + dash + shake, 128, t, { u: 1.5, face: -1, coat: 1, hood: 1, spin: -lt * 8, sweat: lt > 3.6 && lt < 5, pose: lt > 2.9 && lt < 3.2 ? { ...POSES.ride, lean: 4 } : POSES.ride });
    // drips after the splash
    if (lt > 3.6) for (let k = 0; k < 4; k++) { const ph = (lt * 2 + k * .25) % 1; fb.px(240 + k * 5, 100 + ph * 24, C.cyan); }
    // the splash: arcs of spray
    if (hitT > 0 && hitT < .8) for (let k = 0; k < 24; k++) { const a = -Math.PI * (.15 + .7 * hash(k, 3)), v = 60 + hash(k, 4) * 80; const x = 140 + Math.cos(a) * v * hitT, y = 120 + Math.sin(a) * v * hitT + 160 * hitT * hitT; fb.rect(x, y, 2, 2, k % 3 ? C.cyan : C.white); }
    popNum(fb, '-999', 90, 70, hitT, C.white);
    popNum(fb, '-12%', 246, 84, lt - 3.75, C.hot);
    statusWin(t);
    cutIn(t, at('s14', 4.6), at('s14', 5.8), 'rider', { ...EXPR.deadpan, drip: 1 }, { coat: 1, hood: 1 });
    if (lt > 3.5 && lt < 3.85) POST.push(u => shakeRGB(u, lt - 3.5));
    if (lt > 6.1) LUTX = L => darken(L, (lt - 6.1) / .3);
  },
  // s15 — bus stop, wide; skid stop; the soaked kid on the bench
  s15(t, lt) {
    S.busStop(fb, t, 0);
    const shiver = Math.floor(t * 12) % 2;
    figure(fb, 'kid', { ...POSES.sit, hipY: 4.5 + shiver * .3, headTilt: 14 }, 186 + shiver, 124, { wet: 1, face: -1 });
    const x = lt < 1.0 ? lerp(-30, 110, eo(lt / 1.0)) : 110;
    riderOnBike(x, 124, t, { coat: 1, hood: 1, light: 1, spin: x * .3, pose: lt > .9 && lt < 1.2 ? { ...POSES.ride, lean: 30, sq: .9 } : POSES.ride });
    if (lt > .9 && lt < 1.6) for (let k = 0; k < 8; k++) { const ph = lt - .9; fb.px(x + 14 + k * 3, 124 - ph * 20 * Math.sin(k) + ph * ph * 40, C.cyan); }
    headCone(fb, x + 14, 106, 1, 60, LIGHT);
    S.splashes(fb, t, 128, 178, 26);
    if (lt < .3) LUTX = L => darken(L, 1 - lt / .3);
  },
  // s16 — two-shot medium: the kid speaks
  s16(t, lt) {
    S.busStop(fb, t, 70);
    const shiver = Math.floor(t * 12) % 2;
    figure(fb, 'kid', { ...POSES.sit, hipY: 4.5, headTilt: 16, look: -.4 }, 210 + shiver, 128, { u: 2.2, wet: 1, face: -1, expr: 'sadWet' });
    figure(fb, 'rider', POSES.stand, 96, 132, { u: 2.2, coat: 1, hood: 1, expr: lt < 2 ? 'neutral' : 'soft', flag: flagSway(t) });
    S.splashes(fb, t, 128, 132, 10);
  },
  // s17 — the gift: item menu, hand-over, the umbrella pops open
  s17(t, lt) {
    S.busStop(fb, t, 70);
    const shiver = lt < 2.0 ? Math.floor(t * 12) % 2 : 0;
    const kidPose = lt < 2.1 ? { ...POSES.sit, hipY: 4.5, headTilt: 16 } : { ...POSES.sit, hipY: 4.2, headTilt: -10, armF: [150, 10] };
    const kidFig = figure(fb, 'kid', kidPose, 210 + shiver, 128, { u: 2.2, wet: 1, face: -1, expr: lt < 2.1 ? 'sadWet' : 'surprised' });
    const rp = poseAt([[0, POSES.stand], [.3, { ...POSES.stand, armF: [-60, 40], lean: -5 }], [1.6, { ...POSES.stand, armF: [-60, 40] }], [2.0, POSES.reach], [2.6, POSES.reach], [3.0, POSES.stand]], lt);
    const rf = figure(fb, 'rider', rp, 96, 132, { u: 2.2, coat: 1, hood: 1, expr: lt < 1.6 ? 'neutral' : 'soft', flag: flagSway(t) });
    // the umbrella: closed in his hand → handed over → pops open over the kid (protected red)
    if (lt > 1.6 && lt < 2.0) { const k = seg(lt, 1.6, 2.0); const x = lerp(rf.hand[0], kidFig.hand[0], k), y = lerp(rf.hand[1], kidFig.hand[1] - 6, k); fb.line(x, y + 6, x + 4, y - 18, C.uRD); fb.line(x + 1, y + 6, x + 5, y - 18, C.uR); }
    if (lt >= 2.0) { const k = clamp((lt - 2.0) / .18, 0, 1); umbrella(fb, kidFig.hand[0] + 4, kidFig.hand[1] + 2, 1.5, k < 1 ? k : 1 + Math.sin((lt - 2.18) * 20) * .05 * Math.max(0, 1 - (lt - 2.18) * 3), -12); }
    // rain stops falling on the kid under the umbrella: draw a dry shadow region is implicit
  },
  // s18 — close-up: the kid's joy under the red umbrella
  s18(t, lt) {
    S.cuBack(fb, t, 'bus'); RAIN = .7;
    umbrella(fb, 150, 104, 4.2, 1, 10); RECTS.push([86, 10, 170, 170]);
    const b = bust('kid', lt < .3 ? 'surprised' : 'joy', 2.6, { w: 140, h: 130, wet: 1 });
    fb.blit(b.spr, 96, 22 + (lt > .3 && lt < .45 ? -2 : 0));
  },
  // s19 — overworld: arriving at 幸福里 gate; "!"
  s19(t, lt) {
    const u = lerp(.7, .78, clamp(lt / .8, 0, 1)), p = S.routePoint(u);
    const { ox, oy } = S.overworld(fb, t, p.x + 10, p.y, { bike: { ...p, light: 1 }, dog: 1, route: [u + .01, 1] });
    if (lt > .8) text(fb, '!', p.x - ox - 2, p.y - oy - 22, C.red, { outline: C.ink });
    if (lt > 1.0) { const s = (lt - 1.0) / .6; POST.push(u2 => { swirl(u2, s); mosaic(u2, 1 + Math.round(s * 6)); dissolve(u2, Math.min(.75, Math.max(0, s * 1.4 - .4))); }); }
  },
  s20(t, lt) { battle3(t, lt, 0); },
  s21(t, lt) { battle3(t, lt, 1); },
  s22(t, lt) { battle3(t, lt, 2); },
  // s23 — lobby: the lift is broken; he jabs the button
  s23(t, lt) {
    S.lobby(fb, t);
    const jab = [.6, 1.0, 1.4].some(x => lt >= x && lt < x + .15);
    const p = lt < 2.2 ? (jab ? { ...POSES.stand, armF: [95, 0], lean: 6 } : { ...POSES.stand, armF: [70, 30] }) : { ...POSES.slump, lean: 14, headTilt: 30 };
    S.liftButton(fb, jab);
    figure(fb, 'rider', p, lt < 2.2 ? 196 : 190, 150, { u: 2, coat: 1, expr: lt < 2.2 ? 'determined' : 'deadpan', flag: flagSway(t) });
    bag(fb, 180, 132, 1.4);
    if (jab) text(fb, '×', 226, 60, C.red, { outline: C.ink });
    if (lt < .3) LUTX = L => darken(L, 1 - lt / .3);
  },
  // s24 — close-up: dread
  s24(t, lt) {
    S.cuBack(fb, t, 'stair');
    const b = bust('rider', 'dread', 3.1, { w: 150, h: 150, coat: 1 }); fb.blit(b.spr, 92 + (Math.floor(t * 12) % 2), 36);
    const d = lt * 30; fb.ell(206, 70 + d, 3, 4, C.cyan); fb.px(205, 69 + d, C.white);
  },
  // s25 — the well: push up 28 floors (signature shot)
  s25(t, lt) {
    const p = Math.floor(ss(clamp(lt / 4.2, 0, 1)) * 40) / 40; S.well(fb, t, p * .82, 0);
    RAIN = 0;
  },
  // s26 — boss battle frame: shout → the sound-activated light
  s26(t, lt) {
    const lit = lt >= .75;
    S.battleBG(fb, t, 'stairs');
    bossStairs(t, lt, lit);
    const shout = lt > .4 && lt < .8;
    figure(fb, 'rider', shout ? { ...POSES.stand, headTilt: -20, lean: -10, armB: [30, 90], armF: [30, 95], sq: 1.06 } : POSES.stand, 250, 128, { u: 1.8, coat: 1, face: -1, expr: shout ? 'startled' : 'determined', flag: flagSway(t) });
    bag(fb, 240, 112, 1.2);
    if (shout) { for (let k = 0; k < 3; k++) { const r = 8 + k * 6 + (lt - .25) * 40; fb.line(232 - r, 80 - k * 4, 226 - r, 76 - k * 6, C.white); } text(fb, '啊——！', 196, 62, C.white, { outline: C.ink }); }
    if (!lit) LUTX = L => dimIdx(L, 2);
    else if (lt < .9) POST.push(u => dissolve(u, .25 * (1 - (lt - .75) / .15), 0xffffffff));
    statusWin(t, { floor: '1F' });
    if (lt < .4) POST.push(u => { const s = 1 - lt / .4; swirl(u, s * .6); mosaic(u, 1 + Math.round(s * 5)); });
  },
  // s27 — the climb montage: 7F → 15F → 22F (jump cuts), battery drains, the power bank at 7F
  s27(t, lt) {
    const segs = [[0, 6.1], [1.4, 14.1], [2.8, 21.1]]; const sg = lt < 1.4 ? 0 : lt < 2.8 ? 1 : 2; const l2 = lt - segs[sg][0];
    const p = segs[sg][1] + l2 * .22;
    const foot = S.stairs(fb, t, p, { lit: 1, floor0: 1 });
    const [fx, fy] = foot(p); const step = Math.floor(lt * 8) % 2;
    figure(fb, 'rider', step ? POSES.climb0 : POSES.climb1, fx, fy - step, { u: 1.8, coat: 1, expr: sg === 2 ? 'tired' : 'determined', flag: flagSway(t, 2), sweat: sg >= 1 });
    bag(fb, fx + 14, fy - 30 - (Math.floor((lt - .06) * 8) % 2 ? 0 : 1), 1.3);
    // flashlight beam ahead and up the flight
    fb.relight(fx, 0, 180, fy, (x, y) => { const dx = x - fx - 10, dy = y - (fy - 34); if (dx < 0) return null; const a = Math.abs(dy + dx * .46) / (dx * .4 + 4); return a < 1 && bayer(x, y) < (1 - a) * (1 - dx / 180) * 1.8 ? LIGHT : null; });
    statusWin(t, { floor: (Math.floor(p) + 1) + 'F' });
    if (sg === 0 && lt > 1.0 && lt < 1.4) { const k = lt - 1.0; ICON.bank(fb, fx - 4, fy - 62 - k * 20); }
    if (lt > 1.4 && lt < 1.45 || lt > 2.8 && lt < 2.85) POST.push(u => dissolve(u, .5, 0xff000000));
  },
  // s28 — 28F: the last steps, flop, pop back up
  s28(t, lt) {
    const p = 26.7 + Math.min(lt, .8) * .35;
    const foot = S.stairs(fb, t, 26.95, { lit: 1, floor0: 1, sx: 120, sy: 120 });
    const [fx, fy] = foot(Math.min(p, 26.98));
    const pose = lt < .8 ? { ...POSES.hunch, lean: 50, hipY: 3 } : lt < 2.0 ? POSES.flop : lt < 2.3 ? { ...POSES.jump, sq: 1.15 } : POSES.stand;
    const gx = lt < .8 ? fx : fx + 20, gy = lt < .8 ? fy : fy;
    figure(fb, 'rider', pose, gx, gy, { u: 2, coat: 1, expr: lt < 2 ? 'tired' : 'determined', blink: lt > .9 && lt < 2.0, flag: flagSway(t, 2) });
    bag(fb, gx + (lt < 2.0 ? 30 : 16), gy - (lt < 2.0 ? 12 : 30), 1.3);
    if (lt > .9 && lt < 2.0) text(fb, '@', gx + 6, gy - 30 - (lt * 6) % 4, C.silver, { size: 8 });
    statusWin(t, { floor: '28F' });
    if (lt > 2.7) LUTX = L => darken(L, (lt - 2.7) / .3);
  },
  // s29 — door 2803: knock knock (silence)
  s29(t, lt) {
    S.corridor(fb, t, 0, { lampOn: lt > .4 });
    const p = [.5, .8].some(x => lt >= x && lt < x + .12) ? POSES.knock2 : lt > .3 && lt < 1.1 ? POSES.knock : POSES.stand;
    figure(fb, 'rider', p, 116, 124, { u: 2.2, coat: 1, expr: 'neutral', flag: flagSway(t) });
    bag(fb, 98, 104, 1.3);
    if ([.5, .8].some(x => lt >= x && lt < x + .2)) text(fb, '咚', 140, 74, C.white, { outline: C.ink });
    if (lt < .3) LUTX = L => darken(L, 1 - lt / .3);
  },
  // s30 — the door opens by steps; warm light floods; she appears
  s30(t, lt) {
    const open = Math.floor(clamp((lt - .3) / 1.0, 0, 1) * 6) / 6;
    S.corridor(fb, t, open, { lampOn: 1 });
    if (open > .3) figure(fb, 'lady', { ...POSES.hunch, lean: 12 }, 164, 124, { u: 2.0, face: -1, expr: 'surprised' });
    fb.map = open > 0 ? WARM : null;
    figure(fb, 'rider', POSES.stand, 116, 124, { u: 2.2, coat: 1, expr: open > .3 ? 'surprised' : 'neutral', flag: flagSway(t) });
    fb.map = null;
    bag(fb, 98, 104, 1.3);
  },
  // s31 — CU lady: surprised → soft
  s31(t, lt) { S.cuBack(fb, t, 'door'); const b = bust('lady', lt < 1.0 ? 'surprised' : 'soft', 3.0, { w: 150, h: 190 }); fb.blit(b.spr, 86, 6); },
  // s32 — CU rider: looks into the bag — no candle
  s32(t, lt) {
    S.cuBack(fb, t, 'doorOut');
    const e = lt < 1.2 ? { ...EXPR.hesitant, pup: [0, 1] } : EXPR.hesitant;
    const b = bust('rider', e, 3.0, { w: 150, h: 190, coat: 1, hood: 1 }); fb.blit(b.spr, 84, 6);
    fb.relight(0, 0, 200, 180, (x, y) => (x < 140 && bayer(x, y) < (1 - x / 160)) ? WARM : null);
  },
  // s33 — CU lady: "it's my birthday"
  s33(t, lt) { S.cuBack(fb, t, 'door'); const b = bust('lady', lt < 1.6 ? 'soft' : 'wistful', 3.0, { w: 150, h: 190 }); fb.blit(b.spr, 86, 6 - (lt > 1.6 ? 1 : 0)); },
  // s34 — over-the-shoulder medium: the grandson she told not to come
  s34(t, lt) {
    S.interior(fb, t);
    figure(fb, 'lady', { ...POSES.holdFront, lean: 6, headTilt: lt > 2 ? 14 : 4 }, 214, 156, { u: 3.0, face: -1, expr: lt < 2 ? 'soft' : 'wistful' });
    bowl(fb, 182, 104, 1.1, t);
    // rider's shoulder and helmet, out of focus in the foreground (dark, left)
    fb.ell(40, 150, 70, 60, C.night); fb.ell(52, 70, 34, 36, C.dbrown); fb.clip = [0, 0, W, 64]; fb.ell(54, 66, 37, 37, C.rust); fb.clip = [0, 0, W, H];
    fb.rect(16, 62, 78, 4, C.umber);
  },
  // s35 — CU rider + phone 9%: hesitation, then the flashlight
  s35(t, lt) {
    S.cuBack(fb, t, 'doorOut');
    const e = lt < 2.6 ? { ...EXPR.hesitant, pup: [.4, .9] } : lt < 3.0 ? EXPR.soft : EXPR.determined;
    const b = bust('rider', e, 3.0, { w: 150, h: 190, coat: 1, hood: 1 }); fb.blit(b.spr, 40, 10);
    fb.ell(200, 176, 30, 16, C.skin); fb.rect(180, 112, 40, 64, C.ink); fb.rect(183, 116, 34, 56, lt < 3.1 ? C.navy : C.white);
    const bt = battery(t); fb.frame(190, 130, 18, 9, C.white); fb.rect(208, 132, 1, 5, C.white); fb.rect(191, 131, Math.max(1, Math.round(16 * bt / 100)), 7, C.hot);
    if (lt < 3.1) text(fb, `${bt}%`, 190, 142, C.hot, { shadow: C.ink });
    if (lt >= 3.1) fb.glow(200, 112, 60, 50, LIGHT, 1);
    fb.relight(0, 0, 160, 180, (x, y) => (x < 120 && bayer(x, y) < (1 - x / 140) * .9) ? WARM : null);
  },
  // s36 — two-shot: the phone held up like a candle; he sings (push-in 1 px every 1.5 s)
  s36(t, lt) {
    S.interior(fb, t);
    const push = Math.floor(lt / 1.5), u = 3.0 + push * .04;
    const sway = Math.round(Math.sin((t - SH.s36.t0 - .6) / (60 / 105) * Math.PI / 3) * 3);
    figure(fb, 'lady', { ...POSES.holdFront, lean: 6, headTilt: 6 }, 226 + push, 154, { u, face: -1, expr: lt < 3 ? 'surprised' : 'soft' });
    bowl(fb, 192 + push, 102, 1.1, t);
    const rf = figure(fb, 'rider', { ...POSES.sing, lean: sway }, 100 - push, 154, { u, coat: 1, expr: 'sing', flag: 0 });
    const hx = rf.hand[0], hy = rf.hand[1];
    fb.rect(hx - 3, hy - 16, 7, 14, C.ink); fb.rect(hx - 2, hy - 15, 5, 12, C.dslate);
    const fl = Math.floor(t * 12) % 3;
    fb.glow(hx, hy - 18, 50, 44, LIGHT, 1);
    fb.disc(hx, hy - 18, 2 + (fl === 1 ? 1 : 0), C.white); fb.px(hx, hy - 22 - fl, C.white); fb.px(hx, hy - 21, C.glow);
  },
  // s37 — CU lady: tearful smile; 00:00
  s37(t, lt) {
    S.cuBack(fb, t, 'door');
    const b = bust('lady', 'tearful', 3.0, { w: 150, h: 190 }); fb.blit(b.spr, 86, 6);
    fb.relight(60, 60, 200, 120, (x, y) => { const d = Math.hypot((x - 130) / 80, (y - 170) / 70); return d < 1 && bayer(x, y) < (1 - d) * 1.3 ? LIGHT : null; });
  },
  // s38 — she blows it out; the phone dies; only the warm doorway light remains
  s38(t, lt) {
    S.interior(fb, t);
    const u = 3.2, lean = lt > .3 && lt < 1.0 ? 16 : 6;
    figure(fb, 'lady', { ...POSES.holdFront, lean, headTilt: 6 }, 228, 154, { u, face: -1, expr: lt > .4 && lt < 1.0 ? { ...EXPR.soft, mouth: 'o', lid: .7 } : lt < 1.0 ? 'tearful' : 'soft' });
    bowl(fb, 192, 102, 1.1, t, { steam: true });
    const rf = figure(fb, 'rider', lt < 2.0 ? POSES.sing : POSES.stand, 100, 154, { u, coat: 1, expr: lt < 1.0 ? 'sing' : lt < 2.4 ? 'deadpan' : 'soft', flag: 0 });
    const hx = rf.hand[0], hy = rf.hand[1];
    if (lt < 2.0) { fb.rect(hx - 3, hy - 16, 7, 14, C.ink); fb.rect(hx - 2, hy - 15, 5, 12, C.dslate); }
    if (lt < 1.0) { fb.glow(hx, hy - 18, 50, 44, LIGHT, 1); fb.disc(hx, hy - 18, 2, C.white); }
    if (lt > .55 && lt < 1.0) for (let k = 0; k < 5; k++) fb.px(178 - (lt - .55) * 120 - k * 3, 70 + k % 2, C.silver);
    if (lt >= 1.0) LUTX = L => dimIdx(L, lt < 1.15 ? 1 : 2);
  },
  // s39 — the dark stairwell: a red umbrella climbs toward 28F
  s39(t, lt) {
    const foot = S.stairs(fb, t, 26.5, { lit: 0, floor0: 1, sx: 170, sy: 110 });
    const q = 25.95 + Math.floor(lt * 8) / 8 * .32; const [x, y] = foot(q); const bob = Math.floor(lt * 6) % 2;
    figure(fb, 'kid', bob ? POSES.climb0 : POSES.climb1, x, y - bob, { u: 1.6, expr: 'happy' });
    umbrella(fb, x + 6, y - 22 - bob, 1.6, 1, 8);
    LUTX = L => dimIdx(L, 1);
  },
  // s40 — the kid at the door
  s40(t, lt) {
    S.corridor(fb, t, 1, { lampOn: 1 });
    figure(fb, 'lady', { ...POSES.holdFront, lean: 8 }, 162, 124, { u: 2.0, face: -1, expr: 'surprised' });
    bowl(fb, 146, 92, .55, t, { steam: false });
    const kx = lt < .6 ? lerp(330, 236, eo(lt / .6)) : 236;
    const kf = figure(fb, 'kid', lt < .6 ? (Math.floor(lt * 8) % 2 ? POSES.walk0 : POSES.walk2) : { ...POSES.stand, armF: [150, 10] }, kx, 124, { u: 2.1, face: -1, expr: 'happy' });
    if (lt < 1.2) umbrella(fb, kf.hand[0] - 2, kf.hand[1] + 2, 1.5, lt < .9 ? 1 : 1 - (lt - .9) / .3, 10);
    else { fb.line(kf.hand[0], kf.hand[1] + 4, kf.hand[0] + 3, kf.hand[1] - 18, C.uRD); fb.line(kf.hand[0] + 1, kf.hand[1] + 4, kf.hand[0] + 4, kf.hand[1] - 18, C.uR); }
    fb.map = WARM; figure(fb, 'rider', POSES.stand, 100, 124, { u: 2.2, coat: 1, expr: 'surprised', flag: 0 }); fb.map = null;
  },
  // s41 — CU lady: overjoyed
  s41(t, lt) { S.cuBack(fb, t, 'door'); const b = bust('lady', lt < .4 ? 'surprised' : 'overjoyed', 3.0, { w: 150, h: 190 }); fb.blit(b.spr, 86, 6 - (lt > .4 && lt < .55 ? 2 : 0)); },
  // s42 — three-shot: the kid recognises the rider; wink
  s42(t, lt) {
    S.corridor(fb, t, 1, { lampOn: 1 });
    figure(fb, 'lady', { ...POSES.holdFront, lean: 8 }, 164, 126, { u: 2.1, face: -1, expr: 'overjoyed' });
    bowl(fb, 146, 92, .55, t, { steam: false });
    figure(fb, 'kid', lt > .2 ? { ...POSES.reach, armF: [95, 0] } : POSES.stand, 232, 126, { u: 2.2, face: -1, expr: 'joy' });
    fb.line(256, 126, 259, 102, C.uRD); fb.line(257, 126, 260, 102, C.uR);
    fb.map = WARM; figure(fb, 'rider', lt > 1.8 ? { ...POSES.stand, armF: [150, 30] } : POSES.stand, 98, 126, { u: 2.3, coat: 1, expr: lt > 1.8 ? 'wink' : 'soft', flag: 0 }); fb.map = null;
    if (lt > 1.8 && lt < 2.3) { fb.px(124, 70, C.white); fb.px(126, 68, C.yellow); fb.px(122, 68, C.yellow); }
  },
  // s43 — save point
  s43(t, lt) {
    S.corridor(fb, t, 1, { lampOn: 1 });
    figure(fb, 'lady', POSES.stand, 164, 124, { u: 2.0, face: -1, expr: 'overjoyed' });
    figure(fb, 'kid', POSES.stand, 192, 124, { u: 1.9, face: -1, expr: 'joy' });
    fb.map = WARM; figure(fb, 'rider', POSES.stand, 104, 124, { u: 2.2, coat: 1, expr: 'soft', flag: 0 }); fb.map = null;
    if (lt > .2) savePoint(fb, 60, 96, t, 1.2);
  },
  // s44 — level up over the three-shot
  s44(t, lt) {
    S.corridor(fb, t, 1, { lampOn: 1 });
    figure(fb, 'lady', POSES.stand, 164, 124, { u: 2.0, face: -1, expr: 'overjoyed' });
    figure(fb, 'kid', lt > 1.2 ? { ...POSES.jump, hipY: -2 } : POSES.stand, 192, 124 - (lt > 1.2 && lt < 1.6 ? 4 : 0), { u: 1.9, face: -1, expr: 'joy' });
    fb.map = WARM; figure(fb, 'rider', lt > 1.1 ? { ...POSES.stand, armF: [170, 10] } : POSES.stand, 104, 124, { u: 2.2, coat: 1, expr: lt > 1.1 ? 'happy' : 'soft', flag: 0 }); fb.map = null;
    savePoint(fb, 60, 96, t, 1.2);
    if (lt > 3.0) POST.push(u => mosaic(u, Math.round(lerp(1, 10, (lt - 3.0) / .4))));
  },
  // s45 — the street after the rain (palette swap at 0.6 s): stars, the warm window; he rides away; 完
  s45(t, lt) {
    if (lt >= .6) { MODE = 'clear'; RAIN = 0; }
    S.nightEnd(fb, t);
    if (lt < .6) { S.splashes(fb, t, 122, 178, 30); }
    const x = lt < .9 ? 260 : lerp(260, -40, ei(seg(lt, .9, 3.4)));
    const bk = riderOnBike(x, 140, t, { u: 1.4, face: -1, coat: 0, spin: -lt * 10, flag: 1 });
    headCone(fb, x - 20, 115, -1, 90, LIGHT);
    dog(fb, 300, 140, 'wag', t, { u: 1.2, face: 1 });
    if (lt >= 1.5) {
      const tf = new FB(); tf.clear(T); text2(tf, '完', 148, 50, r => r < 8 ? C.goldL : C.amber, { outline: C.ink });
      const a = clamp((lt - 1.5) / .4, 0, 1); for (let i = 0; i < W * H; i++) { const c = tf.d[i]; if (c !== T && bayer(i % W, (i / W) | 0) < a) fb.d[i] = c; }
    }
    if (lt < .4) POST.push(u2 => mosaic(u2, Math.round(lerp(10, 1, lt / .4))));
    if (lt > 3.0) LUTX = L => darken(L, (lt - 3.0) / .5);
  },
};

// —— battle 1: the red light ——
function battle1(t, lt, part) {
  S.battleBG(fb, t, 'cross');
  const T0 = SH.s09.t0, bt = t - T0;
  // enemy slides in, stomps
  const ex = bt < .4 ? lerp(-40, 82, eo(bt / .4)) : 82;
  const green = part === 3;
  const wait = part === 2;
  let count = 99;
  if (wait) { const w = lt; count = w < .8 ? 3 : w < 1.4 ? 2 : w < 2.0 ? 1 : w < 2.2 ? 0 : 99; }
  const mood = green ? 'shy' : (wait && lt > 2.2) ? 'smirk' : 'stern';
  trafficLight(fb, ex, 128, green ? 'green' : 'red', mood, t, green ? 15 : count);
  // the rider on the bike facing left
  let x = 248, pose = POSES.ride, expr;
  if (part === 1) {   // hesitate on 攻击 (head shake), flee attempt → yanked back
    if (lt > .5 && lt < 1.1) pose = { ...POSES.ride, headTilt: Math.round(Math.sin(lt * 25)) * 8 };
    if (lt > 1.35 && lt < 1.6) x = 248 + (lt - 1.35) * 200;
    if (lt >= 1.6 && lt < 1.8) x = lerp(298, 244, (lt - 1.6) / .2);
    if (lt >= 1.6 && lt < 1.9) pose = { ...POSES.ride, sq: .85, hipY: 5 };
  }
  if (wait) { pose = lt > 1.5 && lt < 2.1 ? { ...POSES.ride, headTilt: -18, lean: 6 } : { ...POSES.ride, lean: 26, armF: [60, 60] }; }
  if (green && lt < .6) pose = { ...POSES.ride, armF: [170, 0], sq: 1.06 };
  riderOnBike(x, 128, t, { u: 1.6, face: -1, coat: 1, hood: 1, spin: green ? lt * 10 : 0, pose, sweat: part === 1 && lt > 1.6 });
  if (wait) { const tap = Math.floor(lt * 6) % 2; fb.rect(x - 4, 127 - tap, 4, 2, C.ink); }
  if (wait && lt > 1.5 && lt < 2.1) text(fb, '哈～', x - 30, 78, C.silver, { size: 8, shadow: C.ink });
  if (wait) cutIn(t, at('s11', 2.25), at('s11', 3.1), 'rider', 'deadpan', { coat: 1, hood: 1 });
  if (part === 1 && lt > 1.55 && lt < 2.0) { text(fb, '哔！', ex + 24, 40, C.red, { outline: C.ink }); }
  if (green && lt > .3) for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + lt * 3; fb.px(ex + Math.cos(a) * 18, 36 + Math.sin(a) * 18, C.lime); }
  // command window (s10–s11) or plain status
  if (part === 1 || part === 2) {
    const hes = part === 1 && lt > .4 && lt < 1.15;
    let idx = part === 1 ? (lt < 1.2 ? 0 : 0 + 3 * ss(seg(lt, 1.2, 1.3))) : (lt < .1 ? 3 : 3 - 2 * ss(seg(lt, 0, .1)));
    if (part === 1 && lt >= 1.3) idx = 3;
    if (part === 1 && lt >= 3.7) idx = 3 - 2 * ss(seg(lt, 3.7, 3.9));
    // cursor 攻击(0) 等待(1) 道具(2) 逃跑(3): grid positions
    const pos = k => [10 + (k % 2) * 52, 141 + Math.floor(k / 2) * 18];
    const a = pos(Math.floor(idx)), b = pos(Math.min(3, Math.ceil(idx))); const f = idx - Math.floor(idx);
    statusWin(t);
    drawUIOnly('cmd', t);
    const sel = (part === 1 && lt >= 1.3 && lt < 1.5) || (part === 2 && lt >= .2 && lt < .4);
    if (!sel || Math.floor(t * 16) % 2) hand(fb, Math.round(lerp(a[0], b[0], f)) - (hes ? 0 : Math.floor(t * 4) % 2), Math.round(lerp(a[1], b[1], f)));
  } else statusWin(t);
  if (part === 0 && bt < .3) LUTX = L => whiten(L, 1 - bt / .3);
  if (part === 0 && bt > .4 && bt < .7) POST.push(u => shakeRGB(u, bt - .4));
  if (part === 3 && lt > 2.4) POST.push(u => mosaic(u, Math.round(lerp(1, 12, (lt - 2.4) / .4))));
}
// —— battle 3: the dog ——
function battle3(t, lt, part) {
  S.battleBG(fb, t, 'gate');
  const T0 = SH.s20.t0, bt = t - T0;
  const dx = bt < .4 ? lerp(-30, 90, eo(bt / .4)) : 90;
  let dpose = part === 0 ? (Math.floor(lt * 3) % 2 ? 'bark' : 'stand') : part === 1 ? (lt < 1.8 ? 'bark' : 'sit') : 'roll';
  dog(fb, dx, 128, dpose, t, { u: 2.2, face: 1, tongue: part === 1 && lt > 2.0 });
  if (part === 0 && Math.floor(lt * 3) % 2) text(fb, '汪！', dx + 20, 66 - (Math.floor(lt * 6) % 2), C.white, { outline: C.ink });
  // rider: scared jump on the first bark, then the pat
  let x = 250, pose = POSES.stand, expr = 'determined';
  if (part === 0 && lt > .6 && lt < 1.1) { pose = POSES.shock; expr = 'scared'; }
  if (part === 0 && lt >= 1.1) { pose = { ...POSES.stand, lean: -8 }; expr = 'dread'; }
  if (part === 1) {
    if (lt < 1.4) { pose = { ...POSES.stand, lean: -6 }; expr = 'hesitant'; }
    else { x = lerp(250, 134, ss(seg(lt, 1.4, 1.75))); pose = lt < 1.75 ? (Math.floor(lt * 8) % 2 ? POSES.walk0 : POSES.walk2) : (Math.floor(lt * 6) % 2 ? POSES.pat : { ...POSES.pat, armF: [80, -20] }); expr = 'soft'; }
  }
  if (part === 2) { x = 134; pose = { ...POSES.stand, armF: [130, 20] }; expr = 'happy'; }
  const shockY = part === 0 && lt > .6 && lt < 1.1 ? -Math.round(Math.sin((lt - .6) / .5 * Math.PI) * 10) : 0;
  figure(fb, 'rider', pose, x, 128 + shockY, { u: 1.8, coat: 1, face: -1, expr, sweat: part === 0 && lt > .6, flag: flagSway(t) });
  if (part === 0) popNum(fb, '-1%', 250, 70, lt - .7, C.hot);
  if (part === 0) cutIn(t, at('s20', 1.3), at('s20', 2.3), 'rider', 'scared', { coat: 1 });
  if (part >= 1) for (let k = 0; k < 4; k++) { const st = part === 1 ? 2.0 + k * .25 : k * .4; const ph = (lt - st); if (ph > 0 && ph < 1.2) heart(fb, dx - 6 + k * 8 + Math.sin(ph * 6) * 3, 70 - ph * 30, k % 2 ? C.pink : C.hot); }
  statusWin(t);
  if (part === 1) {
    drawUIOnly('cmd', t);
    const idx = lt < 1.0 ? 1 : 1 + ss(seg(lt, 1.0, 1.1)); const pos = k => [10 + (k % 2) * 52, 141 + Math.floor(k / 2) * 18];
    const a = pos(Math.floor(idx)), b = pos(Math.min(3, Math.ceil(idx))); const f = idx - Math.floor(idx);
    const sel = lt >= 1.4 && lt < 1.6; if (!sel || Math.floor(t * 16) % 2) hand(fb, Math.round(lerp(a[0], b[0], f)) - Math.floor(t * 4) % 2, Math.round(lerp(a[1], b[1], f)));
  }
  if (part === 0 && bt < .3) LUTX = L => whiten(L, 1 - bt / .3);
  if (part === 2 && lt > 2.7) LUTX = L => darken(L, (lt - 2.7) / .3);
}
// —— boss: the 28-floor staircase as an enemy ——
function bossStairs(t, lt, lit) {
  const c1 = lit ? C.slate : C.dslate, c2 = lit ? C.steel : C.slate;
  for (let k = 0; k < 8; k++) { const x = 20 + k * 14, y = 128 - k * 12; fb.rect(x, y, 16, 128 - y, c1); fb.rect(x, y, 16, 2, c2); fb.rect(x, y, 1, 128 - y, c2); }
  // eyes on the top step
  const blink = Math.floor(t * 2) % 7 === 0;
  for (const ex of [126, 142]) { fb.rect(ex - 5, 28, 10, blink ? 2 : 8, C.white); if (!blink) fb.rect(ex - 2, 30, 4, 5, C.red); }
  fb.line(118, 22, 130, 26, C.ink); fb.line(150, 22, 138, 26, C.ink);
  text(fb, '28', 64, 80, C.red, { outline: C.ink });
}
// battle cut-in: a band slides in with the rider's face (a game-native close-up)
function cutIn(t, t0, t1, who, ex, o = {}) {
  if (t < t0 || t >= t1) return; const lt = t - t0, out = t1 - t;
  const k = Math.min(eo(clamp(lt / .15, 0, 1)), eo(clamp(out / .12, 0, 1)));
  const y0 = 46, h = 66, dx = Math.round((1 - k) * 330);
  const band = new FB(); band.clear(T);
  band.gradV(0, y0, W, h, [C.navy, C.night, C.deep]);
  for (let i = 0; i < 9; i++) { const yy = y0 + 4 + Math.floor(hash(i, 5) * (h - 8)), xx = mod(Math.round(-t * 400 + hash(i, 6) * 400), 400) - 40; band.hline(xx, xx + 30, yy, C.blue); }
  const b = bust(who, ex, 2.2, { w: 110, h: 110, coat: o.coat, hood: o.hood, wet: o.wet });
  band.clip = [0, y0, W, y0 + h]; band.blit(b.spr, 190, y0 - 18); band.clip = [0, 0, W, H];
  band.rect(0, y0, W, 1, C.white); band.rect(0, y0 + h - 1, W, 1, C.white); band.rect(0, y0 + 1, W, 1, C.ink); band.rect(0, y0 + h - 2, W, 1, C.ink);
  for (let y = y0; y < y0 + h; y++) for (let x = 0; x < W; x++) { const c = band.d[y * W + x]; if (c !== T && x + dx < W) fb.px(x + dx, y, c); }
  RECTS.push([dx, y0, W, h]);
}
function drawUIOnly(kind, t) { for (const u of UI) if (u.kind === kind && t >= u.t0 && t < u.t1) cmdWin(t, u.items, u); }
function shakeRGB(u32, k) { const amp = k < .12 ? 3 : k < .22 ? 2 : k < .3 ? 1 : 0; if (!amp) return; const src = u32.slice(); const dx = (Math.floor(k * 24) % 2 ? amp : -amp); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) u32[y * W + x] = src[y * W + clamp(x + dx, 0, W - 1)]; }

// ———————————————— render ————————————————
function render(t) {
  t = clamp(t, 0, DUR - 1e-4);
  const s = shotAt(t), lt = t - s.t0;
  RAIN = INDOOR.has(s.id) ? 0 : 1; MODE = 'rain'; LUTX = null; POST = []; fb.map = null; fb.clip = [0, 0, W, H]; RECTS.length = 0;
  fb.clear(C.ink);
  SHOTS[s.id](t, lt);
  if (hudOn(t)) drawHUD(t);
  drawUI(t);
  let L = lutAt(t, MODE);
  if (LUTX) L = LUTX(L);
  if (RAIN > 0 && MODE === 'rain') {
    const rl = S.rainLayer(Math.min(1.6, RAIN), RAIN > 1.2 ? 3 : 1), keep = RAIN < .9 ? RAIN : 1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const c = rl.d[y * W + x]; if (c === T) continue; if (keep < 1 && hash(x, y, 77) > keep) continue;
      let inUI = false; for (const [rx, ry, rw, rh] of RECTS) if (x >= rx && y >= ry && x < rx + rw && y < ry + rh) { inUI = true; break; }
      if (!inUI) fb.d[y * W + x] = c;
    }
  }
  out.present(fb, L);
  for (const p of POST) out.post(p);
  out.show();
}
window.DUR = DUR; window.render = render; window.EV = EV.sort((a, b) => a.t - b.t); window.SUBS = SUBS; window.TEXTS = texts;
window.TIMELINE = { dur: DUR, shots: shotList, sections: SECT, hits: HITS, song: { t0: songT0, sb, notes: SONG.map((s, i) => ({ b: s[1], d: s[2], n: SONG_N[i] })) } };
window.READY = true;
