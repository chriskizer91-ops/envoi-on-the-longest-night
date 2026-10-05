// chapter-start-rest.mjs (T17 game 1): every chapter (game.js CHAPTERS) starts on a road that leads somewhere, never
// on a road out of the picture she turns back from (`to: 'world'`, which she can't have come by), and its rest, where a
// lost fight wakes the party, is on a map with a place to rest (an inn, a hall, a camp). Gate 15 used to start and
// rest on the crossroads' closed south road. Loads the real maps.js and game.js, as tools/check-maps.mjs does.
// Usage, from the repository's top folder: node final-pass-polish-october-5-2026/checks/game/chapter-start-rest.mjs
import path from 'path'; import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const R = path.resolve(new URL('../../..', import.meta.url).pathname);
globalThis.window = globalThis;
require(path.join(R, 'src/game/maps.js')); require(path.join(R, 'src/game/game.js'));
const MAPS = globalThis.MAPS, CHAPTERS = globalThis.Game.CHAPTERS;
const inPoly = (pts, x, y) => { let ins = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins; } return ins; };
// a walk area holds a closed road when the middle of a `to: 'world'` exit lies in it
const closedRoad = (m, poly) => (m.exits || []).some((ex) => ex.to === 'world' && inPoly(poly, (ex.rect[0] + ex.rect[2]) / 2, (ex.rect[1] + ex.rect[3]) / 2));
let bad = 0;
for (const c of CHAPTERS) {
  if (!c.where) continue;
  const [sid, [sx, sy]] = c.where, sm = MAPS[sid];
  const on = sm.walk.filter((p) => inPoly(p, sx, sy));
  if (on.some((p) => closedRoad(sm, p))) { bad++; console.log('✗ ' + c.name + ': starts at ' + sid + ' ' + sx + ',' + sy + ', on a road out of the picture she turns back from'); }
  else console.log('✓ ' + c.name + ': starts at ' + sid + ' ' + sx + ',' + sy + ', on a road that leads on');
  const [rid, [rx, ry]] = c.rest, rm = MAPS[rid], fire = (rm.spots || []).find((s) => s.kind === 'rest');
  if (!fire) { bad++; console.log('✗ ' + c.name + ': rests at ' + rid + ' ' + rx + ',' + ry + ', a map with nowhere to rest'); }
  else console.log('✓ ' + c.name + ': rests at ' + rid + ' ' + rx + ',' + ry + ' (' + fire.label + ')');
}
if (bad) { console.log(bad + ' wrong'); process.exit(1); }
console.log('all good');
