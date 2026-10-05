// check-maps.mjs: can Io reach everything on every traced map? Walks each map's grid (the field engine's own rule: her
// feet and 6 px either side inside a walk area and outside every block and person) from the map's start and from every
// arrival point, and reports any exit, person, spot (the keepsakes in items.js among them) or arrival she can't reach. Whatever the grid misses is looked for
// again along the narrow ways (field.js's fine search: 4 px steps on the same rule), where Chris's secret paths run, and
// is named as reached that way. Usage: [MAPS_EXTRA=file.js,...] node tools/check-maps.mjs [mapId]
import path from 'path'; import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const R = path.resolve(new URL('..', import.meta.url).pathname);
require(path.join(R, 'src/game/maps.js'));
// maps traced but not yet in the game (the wilderness scenes, src/game/maps-wilds.js, until Chris's okay), and any
// files named in MAPS_EXTRA (comma-separated: a map traced in a file of its own, before it joins the others)
import fs from 'fs';
for (const f of [path.join(R, 'src/game/maps-wilds.js'), ...(process.env.MAPS_EXTRA || '').split(',').filter(Boolean).map((x) => path.resolve(x))]) if (fs.existsSync(f)) require(f);
const MAPS = globalThis.MAPS, CELL = 12, GW = 128, GH = 86, REACH = 58;
// the keepsakes that lie on a map are spots too (the game adds them from items.js)
globalThis.window = globalThis; require(path.join(R, 'envoi-final-draft/items/items.js'));
for (const it of globalThis.LOOT.ITEMS) if (it.home && it.at && MAPS[it.home]) MAPS[it.home].spots = (MAPS[it.home].spots || []).concat({ kind: 'keepsake', id: it.id, at: it.at });
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
  const open = q.length;
  console.log((probs.length ? '✗ ' : '✓ ') + id + ': ' + open + ' cells reachable' + (narrow.length ? ' (along a narrow way: ' + narrow.join('; ') + ')' : '') + (probs.length ? '\n    ' + probs.join('\n    ') : ''));
  bad += probs.length;
}
process.exitCode = bad ? 1 : 0;
