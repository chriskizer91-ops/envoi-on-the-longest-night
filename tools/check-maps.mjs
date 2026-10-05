// check-maps.mjs: can Io reach everything on every traced map? Walks each map's grid (the field engine's own rule: her
// feet and 6 px either side inside a walk area and outside every block and person) from the map's start and from every
// arrival point, and reports any exit, person, spot (the keepsakes in items.js among them) or arrival she can't reach. Whatever the grid misses is looked for
// again along the narrow ways (field.js's fine search: 4 px steps on the same rule), where Chris's secret paths run, and
// is named as reached that way. The arrivals from other maps must be a point she can stand on, or one within 14 px of a
// cell she can reach, and outside every exit; the other ways onto a map, where the Magpie lands (game.js LANDINGS) and
// each chapter's start and rest (game.js CHAPTERS), must be ground she stands on, outside every exit. And each map's own
// rules: every exit leads to a map, or is a road out of the picture that she turns back from (`to: 'world'`, with its
// line in script.js); a camp has a rest, no random fights, and a landing ground (`land`) she can reach where the Magpie
// lands; wherever she lands, at a dock or a camp, Io is set down in reach of her and beside her glow; a map's fights are
// its own band's; and its painting is there.
// Usage: [MAPS_EXTRA=file.js,...] node tools/check-maps.mjs [mapId]  (MAPS_EXTRA: maps traced in files of their own,
// before they join maps.js)
import fs from 'fs'; import path from 'path'; import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const R = path.resolve(new URL('..', import.meta.url).pathname);
require(path.join(R, 'src/game/maps.js'));
// maps traced in files of their own (comma-separated), before they join maps.js: a mistyped file stops the check
for (const f of (process.env.MAPS_EXTRA || '').split(',').filter(Boolean)) require(path.resolve(f));
const MAPS = globalThis.MAPS, CELL = 12, GW = 128, GH = 86, REACH = 58;
// the keepsakes that lie on a map are spots too (the game adds them from items.js)
globalThis.window = globalThis; require(path.join(R, 'envoi-final-draft/items/items.js'));
for (const it of globalThis.LOOT.ITEMS) if (it.home && it.at && MAPS[it.home]) MAPS[it.home].spots = (MAPS[it.home].spots || []).concat({ kind: 'keepsake', id: it.id, at: it.at });
// where else Io comes onto a map: the Magpie's landings and the chapters' starts and rests (game.js only defines
// window.Game as it loads), and the roads' lines (script.js)
let GAME = {}, SCENES = null;
try { require(path.join(R, 'src/game/game.js')); GAME = globalThis.Game || {}; } catch (e) { console.log('(game.js would not load, so the landings and the chapters go unchecked: ' + e.message + ')'); }
try { require(path.join(R, 'src/game/script.js')); SCENES = globalThis.SCRIPT.scenes; } catch (e) { console.log('(script.js would not load, so the roads’ lines go unchecked: ' + e.message + ')'); }
const intoMap = (id) => [
  ...Object.entries(GAME.LANDINGS || {}).filter(([, L]) => L.field && L.field[0] === id).map(([k, L]) => ['the Magpie’s landing ' + k, L.field[1]]),
  ...(GAME.CHAPTERS || []).flatMap((c) => [[c.where, 'start'], [c.rest, 'rest']].filter(([w]) => w && w[0] === id).map(([w, k]) => ['chapter “' + c.name + '”’s ' + k, w[1]])),
];
const inPoly = (pts, x, y) => { let ins = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins; } return ins; };
let bad = 0;
for (const [id, m] of Object.entries(MAPS)) {
  if (process.argv[2] && id !== process.argv[2]) continue;
  const free = (x, y) => m.walk.some((p) => inPoly(p, x, y)) && !(m.block || []).some((p) => inPoly(p, x, y)) && !(m.people || []).some((n) => Math.abs(n.at[0] - x) < 11 && Math.abs(n.at[1] - y) < 7);
  const stand = (x, y) => free(x, y) && free(x - 6, y) && free(x + 6, y);
  const grid = new Uint8Array(GW * GH); for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) grid[j * GW + i] = stand(i * CELL + 6, j * CELL + 6) && stand(i * CELL + 6, j * CELL + 1) && stand(i * CELL + 6, j * CELL + 11) && stand(i * CELL + 1, j * CELL + 6) && stand(i * CELL + 11, j * CELL + 6) ? 1 : 0;
  const cellOf = (x, y) => Math.min(GH - 1, Math.floor(y / CELL)) * GW + Math.min(GW - 1, Math.floor(x / CELL));
  // the nearest open cell to a point
  const near = (x, y) => { let best = -1, bd = 1e9; for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) if (grid[j * GW + i]) { const d = (i * CELL + 6 - x) ** 2 + (j * CELL + 6 - y) ** 2; if (d < bd) { bd = d; best = j * GW + i; } } return [best, Math.sqrt(bd)]; };
  const [s0] = near(...m.start);
  const seen = new Uint8Array(GW * GH); const q = [s0]; seen[s0] = 1;
  for (let h = 0; h < q.length; h++) { const c = q[h], ci = c % GW, cj = (c - ci) / GW; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const i = ci + di, j = cj + dj; if (i < 0 || j < 0 || i >= GW || j >= GH) continue; const n = j * GW + i; if (grid[n] && !seen[n]) { seen[n] = 1; q.push(n); } } }
  const reachable = (x, y, r) => { for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) if (seen[j * GW + i] && Math.hypot(i * CELL + 6 - x, (j * CELL + 6 - y) * 1.3) < r) return true; return false; };
  const inRectReach = (rc) => { for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) { const x = i * CELL + 6, y = j * CELL + 6; if (seen[j * GW + i] && x >= rc[0] - 14 && x <= rc[2] + 14 && y >= rc[1] - 14 && y <= rc[3] + 14) return true; } return false; };
  // the narrow ways: every point she can step to from the start in 4 px steps (no cutting corners), found once if needed
  let fine = null;
  const fineReach = (x, y, r) => {
    if (!fine) {
      const F = 4, [x0, y0] = m.start, key = (i, j) => (i + 512) * 1024 + j + 512, ok = new Map(), seen2 = new Set([key(0, 0)]);
      const can = (i, j) => { const k = key(i, j); let v = ok.get(k); if (v === undefined) ok.set(k, v = stand(x0 + i * F, y0 + j * F)); return v; };
      fine = [[x0, y0]]; const q2 = [[0, 0]];
      for (let h = 0; h < q2.length; h++) {
        const [ci, cj] = q2[h];
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
          const i = ci + di, j = cj + dj, k = key(i, j);
          if (seen2.has(k) || !can(i, j) || (di && dj && (!can(ci + di, cj) || !can(ci, cj + dj)))) continue;
          seen2.add(k); q2.push([i, j]); fine.push([x0 + i * F, y0 + j * F]);
        }
      }
    }
    return fine.some(([px, py]) => Math.hypot(px - x, (py - y) * 1.3) < r);
  };
  const probs = [], narrow = [];
  for (const ex of m.exits || []) if (!inRectReach(ex.rect)) probs.push('exit to ' + ex.to + ' ' + JSON.stringify(ex.rect));
  for (const n of m.people || []) if (!reachable(n.at[0], n.at[1], REACH)) probs.push('person ' + n.id + ' at ' + n.at);
  for (const s of m.spots || []) {
    const what = s.kind + ' ' + (s.id || s.label) + ' at ' + s.at;
    if (s.rect) { if (!inRectReach(s.rect)) probs.push('event ' + s.id); } else if (!reachable(s.at[0], s.at[1], REACH)) (fineReach(s.at[0], s.at[1], REACH) ? narrow : probs).push(what);
  }
  // arrivals from other maps
  const inExit = (r, x, y) => x >= r[0] - 8 && x <= r[2] + 8 && y >= r[1] - 8 && y <= r[3] + 8;
  for (const [oid, om] of Object.entries(MAPS)) for (const ex of om.exits || []) if (ex.to === id) {
    for (const e2 of m.exits || []) if (inExit(e2.rect, ex.at[0], ex.at[1])) probs.push('arrival from ' + oid + ' at ' + ex.at + ' is inside the exit to ' + e2.to); const [c, d] = near(...ex.at); if (!seen[c] || d > 14) probs.push('arrival from ' + oid + ' at ' + ex.at + (d > 14 ? ' (' + Math.round(d) + ' px off the walk)' : ' (cut off)')); }
  // where the Magpie lands, and the chapters' starts and rests: a point she can stand on (Dawnroost's chapter rest stands
  // 15 px from a whole open cell), since the field moves her off any other to the nearest open cell, where the checks
  // here don't look (the shipyard's landing set her down in front of the Magpie's glow that way)
  for (const [what, at] of intoMap(id)) {
    for (const e2 of m.exits || []) if (inExit(e2.rect, at[0], at[1])) probs.push(what + ' at ' + at + ' is inside the exit to ' + e2.to);
    const [c, d] = near(...at);
    if (!stand(at[0], at[1])) probs.push(what + ' at ' + at + ' is not ground she can stand on' + (d > 14 ? ' (' + Math.round(d) + ' px off the walk)' : '')); else if (!seen[c]) probs.push(what + ' at ' + at + ' (cut off)');
  }
  // every exit leads to a map, or is a road out of the picture that she turns back from, saying its line
  for (const ex of m.exits || []) {
    if (ex.to === 'world') { if (SCENES && !(SCENES[ex.say] || []).length) probs.push('the road out ' + JSON.stringify(ex.rect) + ' has no line to say (`say`: ' + ex.say + ', in script.js scenes)'); }
    else if (!MAPS[ex.to]) probs.push('exit to ' + ex.to + ': no such map');
  }
  // a camp: a rest, no random fights, and a landing ground she can reach, where the Magpie lands and sets her down in
  // reach of her (game.js puts the Magpie's spot at land)
  if (m.kind === 'camp' || m.land) {
    if (!(m.spots || []).some((s) => s.kind === 'rest')) probs.push('a camp with no rest');
    if (m.wild) probs.push('random fights in a camp');
    if (!Array.isArray(m.land)) probs.push('a camp with no land');
    else {
      const [c, d] = near(...m.land); if (d > 14 || !seen[c]) probs.push('its land at ' + m.land + ' is off the ground she can reach');
      const Ls = Object.entries(GAME.LANDINGS || {}).filter(([, L]) => L.field && L.field[0] === id);
      if (GAME.LANDINGS && !Ls.length) probs.push('a landing ground the Magpie never lands on (game.js LANDINGS)');
    }
  }
  // wherever the Magpie lands, at a dock or a camp, she sets Io down in reach of her and beside her glow, not in front of
  // it (field.js draws a spot's glow 6 px above its point, before the figures; the same rule as game-test's landing). A
  // dock's Magpie is its spot here; a camp's is its land (game.js adds the spot). Bogmire's west dock is added by
  // game.js alone, so it goes unchecked here.
  const glow = ((m.spots || []).find((s) => s.kind === 'magpie') || {}).at || (Array.isArray(m.land) && m.land);
  if (glow) for (const [k, L] of Object.entries(GAME.LANDINGS || {}).filter(([, L]) => L.field && L.field[0] === id)) {
    const [x, y] = L.field[1];
    if (Math.hypot(x - glow[0], (y - glow[1]) * 1.3) >= REACH) probs.push('the Magpie’s landing ' + k + ' sets Io down at ' + L.field[1] + ', out of reach of her at ' + glow);
    else if (Math.abs(glow[0] - x) < 30 && glow[1] - 6 <= y) probs.push('the Magpie’s landing ' + k + ' sets Io down at ' + L.field[1] + ', in front of her glow at ' + glow);
  }
  if (m.wild && m.wild.band !== m.band) probs.push('band ' + m.wild.band + ' fights on a band ' + m.band + ' map');
  if (!m.src || !fs.existsSync(path.join(R, m.src))) probs.push('no painting at ' + m.src); // a bad src leaves the field undrawn and Io frozen (field.js, load)
  const open = q.length;
  console.log((probs.length ? '✗ ' : '✓ ') + id + ': ' + open + ' cells reachable' + (narrow.length ? ' (along a narrow way: ' + narrow.join('; ') + ')' : '') + (probs.length ? '\n    ' + probs.join('\n    ') : ''));
  bad += probs.length;
}
process.exitCode = bad ? 1 : 0;
