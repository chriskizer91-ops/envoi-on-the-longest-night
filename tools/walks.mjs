// walks.mjs: how long each walk through the wilds is on the game's own maps, and how many random fights it meets, beside
// the `fights` src/game/story.js gives it (the journey's simulator, src/battle/chain.js, plays that many). A walk goes
// straight through: from where Io comes onto each map (the Magpie's landing at a band's camp, game.js LANDINGS, or the
// exit of the map before) to its way out toward the band's town or gate, the way a tap walks her (field.js: the
// shortest way over the 12 px grid of cells she can stand in, pulled straight). Only maps with random fights (`wild`)
// count: the camps have none. The fights come as field.js brings them: every 770 map px walked on average, never under
// 440 (game.js, at the menu's Normal), with the counter and its threshold carried from map to map and in from the walking
// before. Band 2's walk is also measured lighting the Ember Line road's three nodes on the way (the nearest next), and
// the fights that adds are checked against story.js's `nodeFights`, which the simulator plays too, with the nodes' shards.
// Run it after Chris's path edits change a walk's length (T09); when a walk's fights differ, set story.js's `fights` (or
// `nodeFights`), then node tools/chain.mjs (and --results src/battle/chain-results.js). Exits 0: it only informs.
// Usage: [MAPS_EXTRA=file.js,...] node tools/walks.mjs
// From the T02 step 2 plan's draft (envoi-final-draft/wilds/plan-into-the-game.md).
import path from 'path'; import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const R = path.resolve(new URL('..', import.meta.url).pathname);
globalThis.window = globalThis;
require(path.join(R, 'src/game/maps.js'));
for (const f of (process.env.MAPS_EXTRA || '').split(',').filter(Boolean)) require(path.resolve(f));
require(path.join(R, 'src/game/story.js'));
require(path.join(R, 'src/game/game.js'));
const MAPS = globalThis.MAPS, LANDINGS = globalThis.Game.LANDINGS, CELL = 12, GW = 128, GH = 86, MEAN = 770, MIN = 440;
// story.js's walks, map by map: [map, where she comes on (the map she comes from, a landing, or a story event's area she
// set out from), where she leaves (the map she goes to, or a story event's area she walks into)]
const WALKS = {
  thornwood: [['thornwood', 'wickhollow', 'bogmire']],
  warmRoads: [['warm-roads-camp', { landing: 'warmCamp' }, 'ember-line-road'], ['ember-line-road', 'warm-roads-camp', 'dawnroost-road'], ['dawnroost-road', 'ember-line-road', 'dawnroost']],
  northernWilds: [['northern-camp', { landing: 'northCamp' }, 'eldergrove-edge'], ['eldergrove-edge', 'northern-camp', 'cold-moor'], ['cold-moor', 'eldergrove-edge', 'crossroads'],
    ['crossroads', 'cold-moor', { event: 'halcyon' }], ['crossroads', { event: 'halcyon' }, 'shipyard']],
  frozenPass: [['frozen-camp', { landing: 'frozenCamp' }, 'frostmere-shore'], ['frostmere-shore', 'frozen-camp', 'frozen-pass'], ['frozen-pass', 'frostmere-shore', 'misthollow']],
};
const inPoly = (pts, x, y) => { let ins = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins; } return ins; };
const centre = (c) => [(c % GW) * CELL + 6, Math.floor(c / GW) * CELL + 6];
// a tap's walk on map id from point `from` to the first cell where goal(x, y) holds: its length, and where it ends
function walk(id, from, goal) {
  const m = MAPS[id];
  const free = (x, y) => m.walk.some((p) => inPoly(p, x, y)) && !(m.block || []).some((p) => inPoly(p, x, y)) && !(m.people || []).some((n) => Math.abs(n.at[0] - x) < 11 && Math.abs(n.at[1] - y) < 7);
  const stand = (x, y) => free(x, y) && free(x - 6, y) && free(x + 6, y);
  const grid = new Uint8Array(GW * GH);
  for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) { const [x, y] = centre(j * GW + i); grid[j * GW + i] = stand(x, y) && stand(x, y - 5) && stand(x, y + 5) && stand(x - 5, y) && stand(x + 5, y) ? 1 : 0; }
  let s = -1, bd = Infinity; for (let c = 0; c < GW * GH; c++) if (grid[c]) { const [x, y] = centre(c), d = (x - from[0]) ** 2 + (y - from[1]) ** 2; if (d < bd) { bd = d; s = c; } }
  const dist = new Float64Array(GW * GH).fill(Infinity), prev = new Int32Array(GW * GH).fill(-1), q = [[0, s]]; dist[s] = 0; let end = -1;
  while (q.length) {
    let k = 0; for (let i = 1; i < q.length; i++) if (q[i][0] < q[k][0]) k = i;
    const [d, c] = q.splice(k, 1)[0]; if (d > dist[c]) continue;
    if (goal(...centre(c))) { end = c; break; }
    const ci = c % GW, cj = (c - ci) / GW;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      const i = ci + di, j = cj + dj, n = j * GW + i; if (i < 0 || j < 0 || i >= GW || j >= GH || !grid[n]) continue;
      if (di && dj && (!grid[cj * GW + i] || !grid[j * GW + ci])) continue;
      const nd = d + (di && dj ? Math.SQRT2 : 1); if (nd < dist[n]) { dist[n] = nd; prev[n] = c; q.push([nd, n]); }
    }
  }
  if (end < 0) return { L: NaN, end: from };
  const pts = []; for (let c = end; c !== s; c = prev[c]) pts.push(centre(c)); pts.reverse();
  const clear = (x0, y0, x1, y1) => { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 2); for (let i = 1; i <= n; i++) if (!stand(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n)) return false; return true; };
  let [x, y] = centre(s), L = Math.hypot(x - from[0], y - from[1]), i = 0;
  while (i < pts.length) { let j = i; while (j + 1 < pts.length && clear(x, y, ...pts[j + 1])) j++; L += Math.hypot(pts[j][0] - x, pts[j][1] - y); [x, y] = pts[j]; i = j + 1; }
  return { L, end: [x, y] };
}
const rectOf = (id, ev) => MAPS[id].spots.find((s) => s.id === ev).rect;
const exitTo = (id, to) => (MAPS[id].exits || []).find((e) => e.to === to);
const inRect = (r, pad) => (x, y) => x >= r[0] - pad && x <= r[2] + pad && y >= r[1] - pad && y <= r[3] + pad;
const comeOn = (id, from) => (typeof from === 'string' ? exitTo(from, id).at : from.landing ? LANDINGS[from.landing].field[1] : (() => { const r = rectOf(id, from.event); return [(r[0] + r[2]) / 2, r[3] - 10]; })());
const leaveBy = (id, to) => (typeof to === 'string' ? inRect(exitTo(id, to).rect, 8) : inRect(rectOf(id, to.event), 0));
const legLength = ([id, from, to]) => walk(id, comeOn(id, from), leaveBy(id, to)).L;
// the Ember Line road from where she comes on, to each node in turn (the nearest by walking next), then to its way out
function nodeTour() {
  const id = 'ember-line-road', nodes = MAPS[id].spots.filter((s) => s.kind === 'node');
  let at = comeOn(id, 'warm-roads-camp'), L = 0;
  const left = nodes.slice(), order = [];
  while (left.length) {
    let best = null;
    for (const s of left) { const w = walk(id, at, (x, y) => Math.hypot(x - s.at[0], (y - s.at[1]) * 1.3) < 54); if (w.L === w.L && (!best || w.L < best.w.L)) best = { s, w }; }
    if (!best) break;
    L += best.w.L; at = best.w.end; order.push(best.s.id); left.splice(left.indexOf(best.s), 1);
  }
  return { L: L + walk(id, at, leaveBy(id, 'dawnroost-road')).L, order };
}
// the fights a walk meets on average: each walker comes on with the counter and its threshold as earlier wild walking
// left them (a stretch walked before), and both carry from map to map
function fights(legs, N) {
  const gap = () => Math.max(MIN, MEAN * (0.55 + Math.random() * 0.9));
  let tot = 0;
  for (let k = 0; k < N; k++) {
    let c = 0, next = gap();
    for (let before = Math.random() * 4000 + 2000; ;) { if (next - c > before) { c += before; break; } before -= next - c; c = 0; next = gap(); }
    for (const l of legs) { if (!l.wild) continue; let left = l.L; for (;;) { if (next - c > left) { c += left; break; } left -= next - c; tot++; c = 0; next = gap(); } }
  }
  return tot / N;
}
const story = Object.fromEntries(globalThis.STORY.PATH.filter((s) => s.walk).map((s) => [s.walk, s.fights]));
let off = 0;
for (const [name, legs] of Object.entries(WALKS)) {
  const L = legs.map((l) => ({ id: l[0], L: legLength(l), wild: !!MAPS[l[0]].wild }));
  const wild = L.filter((l) => l.wild).reduce((a, l) => a + l.L, 0), f = fights(L, 50000), n = Math.max(1, Math.round(f));
  if (n !== story[name]) off++;
  console.log(name.padEnd(14) + Math.round(wild).toString().padStart(6) + ' px of wild ground, about ' + f.toFixed(1) + ' fights: ' + n + (n === story[name] ? ', as story.js has it' : ', story.js has ' + story[name]));
  console.log(''.padEnd(14) + L.map((l) => l.id + ' ' + Math.round(l.L) + (l.wild ? '' : ' (no fights)')).join(', '));
  if (name === 'warmRoads') {
    const t = nodeTour(), L2 = L.map((l) => (l.id === 'ember-line-road' ? Object.assign({}, l, { L: t.L }) : l)), wild2 = L2.filter((l) => l.wild).reduce((a, l) => a + l.L, 0);
    // story.js's nodeFights: the fights the ways to the nodes add to the walk's own
    const f2 = fights(L2, 50000), more = Math.max(0, Math.round(f2) - n), step = globalThis.STORY.PATH.find((s) => s.walk === name), had = step && step.nodeFights;
    console.log(''.padEnd(14) + 'lighting the three nodes on the way (' + t.order.join(', ') + '): ' + Math.round(wild2) + ' px, about ' + f2.toFixed(1) + ' fights: ' + more + ' more' + (more === had ? ', as story.js has it' : ', story.js has ' + had + ' (nodeFights)'));
    if (more !== had) off++;
  }
}
console.log(off ? off + (off === 1 ? ' walk differs' : ' walks differ') + ' from story.js: set its `fights`, then node tools/chain.mjs' : 'Every walk meets the fights story.js gives it.');
