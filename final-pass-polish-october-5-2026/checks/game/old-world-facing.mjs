// old-world-facing.mjs (the hub, after T17 walking 3 and the game fixer's note): a save made on the world map before the
// wilderness scenes comes down on a ground map facing into it, as every arrival from another map now does
// (checks/walking/arrivals.mjs): at a map's bottom edge north, at its left edge east, at its right edge west (at its
// top, south). Runs game.js's own OLD_WORLD, fromWorldAt and fromWorld (cut from its source, as
// old-world-crossroads.mjs does) on a save at each old place, and on one from nowhere near any (the fallback).
// Usage, from the repository's top folder: node final-pass-polish-october-5-2026/checks/game/old-world-facing.mjs
import fs from 'fs'; import path from 'path'; import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const R = path.resolve(new URL('../../..', import.meta.url).pathname);
globalThis.window = globalThis;
require(path.join(R, 'src/game/maps.js')); require(path.join(R, 'src/game/game.js'));
const MAPS = globalThis.MAPS, LANDINGS = globalThis.Game.LANDINGS, src = fs.readFileSync(path.join(R, 'src/game/game.js'), 'utf8');
const cut = (head) => { const i = src.indexOf(head); if (i < 0) throw new Error('not in game.js: ' + head); const ind = src.slice(src.lastIndexOf('\n', i) + 1, i), j = src.indexOf('\n' + ind + '}', i); return src.slice(i, src.indexOf('\n', j + 1)); };
const { fromWorld, OLD_WORLD } = new Function('MAPS', 'LANDINGS', cut('const OLD_WORLD = {') + '\n' + cut('function fromWorldAt(') + '\n' + cut('function fromWorld(sv)') + '\nreturn { fromWorld, OLD_WORLD };')(MAPS, LANDINGS);
const MW = 1536, MH = 1024, EDGE = 100;
const want = ([x, y]) => (y > MH - EDGE ? 'n' : x < EDGE ? 'e' : x > MW - EDGE ? 'w' : 's');
let bad = 0, n = 0;
const look = (what, sv) => {
  fromWorld(sv); n++;
  const W = sv.where, w = want(W.at), good = W.dir === w;
  if (!good) bad++;
  console.log((good ? '✓ ' : '✗ ') + what + ': on ' + W.map + ' at ' + W.at.join(',') + ', facing ' + W.dir + (good ? '' : ', not ' + w + ', into the map'));
};
for (const [k, p] of Object.entries(OLD_WORLD)) if (!p.camp) look('a save by ' + k, { v: 1, band: p.band, flags: { party: true, magpie: true, stoop: true }, where: { mode: 'world', at: p.at.slice() } });
look('a save from nowhere near any place (the fallback)', { v: 1, band: 0, flags: {}, where: { mode: 'world', at: [10, 10] } });
console.log(bad ? bad + ' of ' + n + ' face out of their map' : 'all ' + n + ' face into their map');
process.exit(bad ? 1 : 0);
