// 《最后一班渡船》 — page contract: window.render(t), DUR, READY, EV, TEXTS. Tilt-shift is on by default (?tilt=0 turns it off).
import * as THREE from 'three';
import { makePost } from './post_ts.js';
import { DUR, SHOTS, shotAt, T, LINES } from './timeline.js';
import { buildTown } from './town.js';
import { drawOverlay, overlayReady, texts } from './ui.js';

const W = 1920, H = 1080, Q = new URLSearchParams(location.search);
const SS = +(Q.get('ss') ?? 1);   // no GPU here: 1× with 4-sample MSAA; 2× would be the style's default on a GPU
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
const camera = new THREE.PerspectiveCamera(32, W / H, .25, 1200);
await overlayReady();
const town = buildTown();
const post = makePost(renderer, town.scene, camera, W, H, { ssaa: SS });
post.bloom.strength = .5; post.bloom.radius = .75; post.bloom.threshold = .85;
const V = post.vig.uniforms; V.amt.value = .6; V.warm.value = .1; V.contrast.value = .22; V.sat.value = 1.05;
if (Q.has('nobloom')) post.bloom.enabled = false;
renderer.domElement.style.width = W + 'px'; renderer.domElement.style.height = H + 'px';
const TILT = Q.get('tilt') !== '0';
const _v = new THREE.Vector3();
function tiltCenter(subject, fixed) {
  if (fixed != null) return fixed;
  if (!subject) return .5;
  camera.updateMatrixWorld(); _v.copy(subject).project(camera);
  return Math.min(.8, Math.max(.2, _v.y * .5 + .5));
}
window.DUR = DUR;
window.render = t => {
  const shot = shotAt(t);
  if (shot.card) { renderer.setRenderTarget(null); renderer.setClearColor('#0c0705'); renderer.clear(); drawOverlay(t); return; }
  post.vig.uniforms.fade.value = 1; post.bloom.strength = .5; post.bloom.threshold = .85; renderer.toneMappingExposure = 1.15;
  V.warm.value = .1; V.sat.value = 1.05; V.amt.value = .6; V.contrast.value = .22;
  const r = town.update(t, shot, camera, post, renderer);
  if (TILT) {
    const wide = r.tiltC != null;   // wides get the full tilt band; closer shots a gentle one
    post.dof.tiltAmt = wide ? 17 : 6; post.dof.tiltC = tiltCenter(r.subject, r.tiltC); post.dof.tiltW = wide ? .075 : .16; post.dof.tiltF = .3; post.dof.maxCoc = Math.max(post.dof.maxCoc, 24);
    if (shot.id === 's38') { const u = Math.min(1, Math.max(0, (t - T.underBridge) / (DUR - .6 - T.underBridge))); post.dof.tiltAmt = 6 + u * 20; post.dof.tiltW = .16 - u * .13; post.dof.tiltF = .3 - u * .12; }
    V.sat.value *= 1.12; V.contrast.value = .28;
  } else post.dof.tiltAmt = 0;
  if (Q.has('nodof')) post.dof.maxCoc = 0;
  post.composer.render();
  drawOverlay(t);
};
window.TEXTS = texts;
// sound events for the mixer (foley on the frame)
const EV = [];
const ev = (t, type, o = {}) => EV.push({ t: +t.toFixed(3), type, ...o });
ev(T.boatDown, 'boatdown'); ev(T.boatDown + 7.5, 'boatdown', { g: .5 }); ev(T.boatDown + 15, 'boatdown', { g: .4 });
for (let k = 0; k < 6; k++) ev(2.5 + k * 3.2, 'oar', { pan: .1 });
for (const L of LINES) ev(L.t, 'chime', { id: L.id });
ev(T.hull, 'hull'); [0, .35, .7, 1.05].forEach((d, i) => { ev(T.kidsOff + d + .5, 'step_wood'); ev(T.kidsOff + d + .95, 'step_stone'); ev(T.kidsOff + d + 1.4, 'step_stone'); ev(T.kidsOff + d + 1.85, 'step_stone'); });
T.umb.forEach((t0, i) => ev(t0, 'umbrella', { pan: -.2 + i * .15 })); ev(T.gust, 'gust'); ev(T.gustBack, 'umbrella', { g: .6 });
for (let k = 0; k < 6; k++) ev(T.board + k * .35, 'step_wood', { g: .5 }); for (let k = 0; k < 6; k++) ev(T.board + .9 + k * .35, 'step_boat', { g: .6 });
ev(T.candyToss, 'toss'); ev(T.candyLand, 'candy');
for (let k = 0; k < 7; k++) ev(37.0 + k * 1.6, 'oar', { pan: .1, g: .7 });
T.winOn.forEach((t0, i) => ev(t0, 'window', { i })); ev(T.winOn[2], 'lamp');
T.honk.forEach(t0 => ev(t0, 'honk')); ev(T.flap, 'flap'); ev(T.hop, 'hop'); ev(T.honkLight, 'honk', { g: .7 });
ev(T.match1, 'match'); ev(T.lit1, 'lantern_on');
for (let k = 0; k < 4; k++) ev(61 + k * 1.6, 'oar', { pan: .1, g: .6 });
ev(T.rope, 'rope'); ev(T.rope + .7, 'rope', { g: .7 }); for (let k = 0; k < 3; k++) ev(T.rope + 1.5 + k * .45, 'step_wood', { g: .5 }); ev(T.sit, 'cloth');
ev(T.breath, 'breath'); ev(T.blow, 'blow');
ev(T.wind, 'wind'); ev(T.rain, 'rain');
for (const f of [T.flash1, T.flash2, T.flash3, T.flash4, T.flash5, T.flash6]) ev(f, 'flash');
for (let k = 0; k < 14; k++) ev(T.run + k * .24, 'step_wet', { pan: -.5 + k * .06 }); for (let k = 0; k < 3; k++) ev(T.run + 3.5 + k * .25, 'step_stone', { g: .7 }); for (let k = 0; k < 2; k++) ev(T.run + 4.3 + k * .25, 'step_wood', { g: .7 });
ev(T.match2, 'match'); ev(T.lit2, 'lantern_on');
ev(T.castOff, 'castoff'); for (let k = 0; k < 10; k++) ev(T.castOff + .8 + k * 1.15, 'oar_hard', { pan: .1 });
ev(T.gutter, 'gutter'); T.heart.forEach(t0 => ev(t0, 'heart')); ev(T.cup, 'cloth'); ev(T.revive, 'revive');
ev(T.arrive, 'hull', { g: .8 }); ev(T.door, 'door'); ev(T.door + .2, 'doorbell'); for (let k = 0; k < 5; k++) ev(T.upSteps + k * .3, 'step_stone', { g: .6 }); ev(T.doorClose, 'door_close');
ev(T.birds, 'birds'); ev(T.cracker, 'crackers'); ev(T.ribbon, 'ribbon'); ev(T.crowd, 'crowd'); ev(T.crowd + 2, 'honk', { g: .5 });
for (let k = 0; k < 12; k++) ev(T.xsRun + k * .22, 'step_stone', { g: .5, pan: -.2 + k * .04 }); for (let k = 0; k < 3; k++) ev(T.xsRun + 1.5 + k * .25, 'step_wood', { g: .5 });
ev(T.kneel, 'cloth'); ev(T.boatDown2, 'boatdown');
window.EV = EV;
window.READY = true;
