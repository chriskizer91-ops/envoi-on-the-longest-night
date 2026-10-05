// arrivals.mjs: every way Io comes onto a walking map shows all of her, and has her face into the map (T17, walking 1
// and 3, in handoff/wrap-up-2026-10-05.md).
// 1. All of her is in the picture. The camera stops at the painting's top edge (field.js), so feet nearer the top than
//    her height (52 map px, game.js's ioH) leave her head and shoulders above the screen. Every arrival from another map,
//    every Magpie landing (game.js LANDINGS) and each chapter's start and rest (game.js CHAPTERS) stands at y 56 or more.
// 2. She faces into the map. With no `dir` she faces the viewer (south), so an arrival at a map's bottom edge faced
//    back out through the exit she came in by, and one at a side edge faced along it. An arrival at the bottom faces
//    north, at the left edge east, at the right edge west (at the top, south: the default).
// Usage, from the repository's top folder: node final-pass-polish-october-5-2026/checks/walking/arrivals.mjs
// Exits 1 on any problem.
import path from 'path'; import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const R = path.resolve(new URL('../../..', import.meta.url).pathname);
require(path.join(R, 'src/game/maps.js'));
globalThis.window = globalThis;
require(path.join(R, 'src/game/game.js'));
const MAPS = globalThis.MAPS, GAME = globalThis.Game, MW = 1536, MH = 1024, IO_H = 52, TOP = IO_H + 4, EDGE = 100;
const probs = [];
let n = 0;
const high = (what, at) => { n++; if (at[1] < TOP) probs.push(what + ' at ' + JSON.stringify(at) + ': her feet ' + at[1] + ' px from the top, so her head is ' + (IO_H - at[1]) + ' px above the screen'); };
for (const [oid, om] of Object.entries(MAPS)) for (const ex of om.exits || []) {
  if (!MAPS[ex.to]) continue; // a road out of the picture, which turns her back
  const what = 'the arrival from ' + oid + ' on ' + ex.to, [x, y] = ex.at;
  high(what, ex.at);
  const edge = y < EDGE ? 'top' : y > MH - EDGE ? 'bottom' : x < EDGE ? 'left' : x > MW - EDGE ? 'right' : null;
  const want = { top: 's', bottom: 'n', left: 'e', right: 'w' }[edge], got = ex.dir || 's';
  if (want && got !== want) probs.push(what + ' at ' + JSON.stringify(ex.at) + ' (its ' + edge + ' edge) faces ' + got + ', not ' + want + ', into the map');
}
for (const [k, L] of Object.entries(GAME.LANDINGS)) if (L.field) high('the Magpie’s landing ' + k + ' on ' + L.field[0], L.field[1]);
for (const c of GAME.CHAPTERS) for (const [w, k] of [[c.where, 'start'], [c.rest, 'rest']]) if (w) high('chapter “' + c.name + '”’s ' + k + ' on ' + w[0], w[1]);
for (const p of probs) console.log('✗ ' + p);
console.log(probs.length ? probs.length + ' problems in ' + n + ' ways onto the maps' : '✓ all ' + n + ' ways onto the maps show all of Io, and every arrival faces into its map');
process.exit(probs.length ? 1 : 0);
