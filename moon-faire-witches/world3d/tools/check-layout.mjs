// check-layout.mjs: does anything solid in a 3D place stand on ground Io can walk in the 2D game? For each building's
// footprint, each wall and each lamp, the share of it that lies on the walking map's walk area (and outside its blocks).
// Usage: node moon-faire-witches/world3d/tools/check-layout.mjs [place] [--draw out.jpg]
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const R = path.resolve(new URL('../../..', import.meta.url).pathname);
globalThis.window = globalThis;
require(path.join(R, 'src/game/maps.js'));
const id = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'wickhollow';
require(path.join(R, 'moon-faire-witches/world3d/places', id + '.js'));
const P = window.W3D_PLACES[id], M = window.MAPS[P.mapId];
const inPoly = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
const walkable = (x, y) => M.walk.some((p) => inPoly(p, x, y)) && !M.block.some((p) => inPoly(p, x, y));
const report = [];
const share = (name, pts) => { const n = pts.filter(([x, y]) => walkable(x, y)).length; report.push([name, n, pts.length]); };
for (const b of P.buildings) { const [x0, y0, x1, y1] = b.fp, pts = []; for (let x = x0 + 1; x < x1; x += 3) for (let y = y0 + 1; y < y1; y += 3) pts.push([x, y]); share('building ' + b.id, pts); }
for (const [i, w] of P.walls.entries()) { const pts = []; for (let k = 1; k < w.pts.length; k++) { const [ax, ay] = w.pts[k - 1], [bx, by] = w.pts[k], L = Math.hypot(bx - ax, by - ay); const nx = -(by - ay) / L, ny = (bx - ax) / L, half = (w.t / 2) / 0.045; for (let s = 0; s <= L; s += 2) for (const o of [-half, 0, half]) pts.push([ax + (bx - ax) * s / L + nx * o, ay + (by - ay) * s / L + ny * o]); } share('wall ' + i + ' ' + JSON.stringify(w.pts[0]), pts); }
for (const l of P.lamps) share('lamp ' + l.kind + ' ' + l.at, [l.at]);
let bad = 0;
for (const [n, k, of] of report) { if (k) { bad++; console.log((k / of * 100).toFixed(1).padStart(6) + '%  ' + n + ' (' + k + ' of ' + of + ' points on walkable ground)'); } }
console.log(bad ? bad + ' things touch walkable ground' : 'nothing solid stands on walkable ground (' + report.length + ' things checked)');
