import { C } from '../px.js';
import * as S from '../scenes.js';
const q = new URLSearchParams(location.search), sc = q.get('scene') || 'street';
let rain = true;
export function draw(fb, t) {
  if (sc === 'street') S.street(fb, t, +(q.get('cam') || 0));
  if (sc === 'over') S.overworld(fb, t, +(q.get('cx') || 200), +(q.get('cy') || 200), { route: [0, 1], bike: { ...S.routePoint(.3), light: 1 }, dog: 1 });
  if (sc === 'city') S.cityScroll(fb, t, 400);
  if (sc.startsWith('battle')) S.battleBG(fb, t, sc.split('-')[1]);
  if (sc === 'bus') S.busStop(fb, t);
  if (sc === 'lobby') S.lobby(fb, t);
  if (sc === 'well') S.well(fb, t, +(q.get('p') || 0), +(q.get('l') || 0));
  if (sc === 'stairs') S.stairs(fb, t, 100);
  if (sc === 'door') S.corridor(fb, t, +(q.get('o') || 0));
  if (sc === 'interior') S.interior(fb, t);
  if (sc.startsWith('cu')) S.cuBack(fb, t, sc.split('-')[1]);
}
export const over = () => (sc === 'well' || sc === 'interior' || sc.startsWith('battle-stairs') || sc === 'lobby' || sc === 'door' || sc === 'stairs') ? null : S.rainLayer(1, 1);
