// old-world-crossroads.mjs (the hub's follow-up to T17 game 1): a save made on the world map by the northern crossroads,
// before the wilderness scenes, comes down where the cold moor's road brings Io into the crossroads, facing in (east),
// not on its south road, which is closed (she turns back from it). Runs game.js's own OLD_WORLD, fromWorldAt and
// fromWorld (cut from its source, as they live inside Game.start) on such a save, with the real maps.js and LANDINGS.
// Usage, from the repository's top folder: node final-pass-polish-october-5-2026/checks/game/old-world-crossroads.mjs
import fs from 'fs'; import path from 'path'; import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const R = path.resolve(new URL('../../..', import.meta.url).pathname);
globalThis.window = globalThis;
require(path.join(R, 'src/game/maps.js')); require(path.join(R, 'src/game/game.js'));
const MAPS = globalThis.MAPS, LANDINGS = globalThis.Game.LANDINGS, src = fs.readFileSync(path.join(R, 'src/game/game.js'), 'utf8');
// a piece of the source: from its first line to the first line after it that closes at the same indent
const cut = (head) => { const i = src.indexOf(head); if (i < 0) throw new Error('not in game.js: ' + head); const ind = src.slice(src.lastIndexOf('\n', i) + 1, i), j = src.indexOf('\n' + ind + '}', i); return src.slice(i, src.indexOf('\n', j + 1)); };
const run = new Function('MAPS', 'LANDINGS', cut('const OLD_WORLD = {') + '\n' + cut('function fromWorldAt(') + '\n' + cut('function fromWorld(sv)') + '\nreturn { fromWorld };');
const { fromWorld } = run(MAPS, LANDINGS);
const inPoly = (pts, x, y) => { let ins = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins; } return ins; };
const closedRoad = (m, poly) => (m.exits || []).some((ex) => ex.to === 'world' && inPoly(poly, (ex.rect[0] + ex.rect[2]) / 2, (ex.rect[1] + ex.rect[3]) / 2));
let bad = 0;
const ok = (good, line) => { if (!good) bad++; console.log((good ? '✓ ' : '✗ ') + line); };
// a band-3 save on the world map at the crossroads' own place there, its last rest at the northern camp's fire
const sv = { v: 1, band: 3, flags: { party: true, magpie: true }, where: { mode: 'world', at: [1960, 820] }, rest: { mode: 'world', at: [1150, 620] } };
fromWorld(sv);
const W = sv.where, m = MAPS[W.map], on = m ? m.walk.filter((p) => inPoly(p, W.at[0], W.at[1])) : [];
ok(W.map === 'crossroads', 'it comes down on ' + W.map);
ok(on.length && !on.some((p) => closedRoad(m, p)), 'at ' + W.at.join(',') + ', ' + (on.some((p) => closedRoad(m, p)) ? 'on a road out of the picture she turns back from' : on.length ? 'on a road that leads on' : 'off every walk area'));
const moor = (m.exits || []).find((ex) => ex.to === 'cold-moor'), back = MAPS['cold-moor'].exits.find((ex) => ex.to === 'crossroads');
ok(W.at[0] === back.at[0] && W.at[1] === back.at[1] && W.dir === back.dir, 'where the cold moor’s road brings her in (' + back.at.join(',') + ', facing ' + back.dir + '): facing ' + W.dir + (moor ? '' : ' (no road to the moor?)'));
ok(sv.rest.map === 'northern-camp', 'its rest: ' + sv.rest.map + ' ' + sv.rest.at.join(','));
if (bad) { console.log(bad + ' wrong'); process.exit(1); }
console.log('all good');
