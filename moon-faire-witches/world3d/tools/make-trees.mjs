// make-trees.mjs: where the trees stand in a 3D place, read from its painting. The painting's woods and water are both
// dark blue-green at night; the place's data traces the water and the lawns by hand, so what is left of the dark is woods.
// A tree goes on a jittered grid wherever the painting is mostly woods, away from the walk, the buildings, the water and
// the lawns; past the painting's edges the woods go on, thinner, so the world has no edge.
// Usage: node moon-faire-witches/world3d/tools/make-trees.mjs [place]   -> moon-faire-witches/world3d/places/<place>-trees.js
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const R = path.resolve(new URL('../../..', import.meta.url).pathname);
const sharp = require(path.join(R, 'tools/node_modules/sharp'));
globalThis.window = globalThis;
require(path.join(R, 'src/game/maps.js'));
require(path.join(R, 'moon-faire-witches/world3d/places/wickhollow.js'));
const id = process.argv[2] || 'wickhollow';
const P = window.W3D_PLACES[id], M = window.MAPS[P.mapId];
const png = path.join(R, P.painting.replace('art/walk/', 'reference/art/walk/').replace('.avif', '.png'));
const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, C = info.channels;
// woods (or water): dark, green or blue over red
const dark = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) {
  const r = data[i * C], g = data[i * C + 1], b = data[i * C + 2], mx = Math.max(r, g, b);
  dark[i] = ((g > r * 1.12 && g >= b * 0.85 && mx < 140) || (b > r * 1.6 && b > g * 1.25 && mx < 70)) ? 1 : 0;
}
// summed table, for the share of dark in any square
const S = new Float64Array((W + 1) * (H + 1));
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) S[(y + 1) * (W + 1) + x + 1] = dark[y * W + x] + S[y * (W + 1) + x + 1] + S[(y + 1) * (W + 1) + x] - S[y * (W + 1) + x];
const darkShare = (x, y, r) => { const x0 = Math.max(0, Math.round(x - r)), x1 = Math.min(W, Math.round(x + r)), y0 = Math.max(0, Math.round(y - r)), y1 = Math.min(H, Math.round(y + r)); if (x1 <= x0 || y1 <= y0) return 0; const s = S[y1 * (W + 1) + x1] - S[y0 * (W + 1) + x1] - S[y1 * (W + 1) + x0] + S[y0 * (W + 1) + x0]; return s / ((x1 - x0) * (y1 - y0)); };
const inPoly = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
const edge = (poly, x, y) => { let d = 1e9; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [ax, ay] = poly[j], [bx, by] = poly[i], dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1))); d = Math.min(d, Math.hypot(x - ax - t * dx, y - ay - t * dy)); } return d; };
const nearWalk = (x, y, m) => M.walk.some((p) => inPoly(p, x, y) || edge(p, x, y) < m);
const inBuilding = (x, y, m) => P.buildings.some((b) => x > b.fp[0] - m && x < b.fp[2] + m && y > b.fp[1] - m && y < b.fp[3] + m);
const inWater = (x, y, m) => P.water.some((w) => inPoly(w.poly, x, y) && edge(w.poly, x, y) > m);
const inLawn = (x, y) => P.lawns.some((l) => inPoly(l, x, y));
let s = 7;
const rnd = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e6) / 1e6; };
const trees = [];
const STEP = 46;
// the roads that go on past the painting's edges (they stay open)
const roads = [[740, 1024, 822, 1800], [1536, 330, 2200, 410], [-600, 700, 0, 770]];
for (let gy = -420; gy < H + 420; gy += STEP) for (let gx = -460; gx < W + 460; gx += STEP) {
  const x = gx + (rnd() - 0.5) * STEP * 0.9, y = gy + (rnd() - 0.5) * STEP * 0.9;
  const inside = x >= 0 && x < W && y >= 0 && y < H;
  if (inside) { if (darkShare(x, y, 26) < 0.62) continue; }
  else if (rnd() < 0.18) continue;
  if (nearWalk(x, y, 30) || inBuilding(x, y, 16) || inWater(x, y, -6) || inLawn(x, y)) continue;
  if (roads.some((r) => x > r[0] - 30 && x < r[2] + 30 && y > r[1] - 30 && y < r[3] + 30)) continue;
  if (x > 690 && x < 860 && y < 230) continue;           // in front of the chapel
  const fir = rnd() < (y > 640 ? 0.34 : 0.2);
  const size = 0.8 + rnd() * 0.45 + (inside ? 0 : 0.15);
  trees.push([Math.round(x), Math.round(y), +(size.toFixed(2)), fir ? 1 : 0, Math.round(rnd() * 1000)]);
}
const out = path.join(R, 'moon-faire-witches/world3d/places', id + '-trees.js');
fs.writeFileSync(out, '// ' + path.basename(out) + ': made by world3d/tools/make-trees.mjs from the painting (do not edit by hand).\n' +
  '// [x, y (painting pixels), size, 1 if a fir, seed]\n(window.W3D_TREES = window.W3D_TREES || {})[' + JSON.stringify(id) + '] = ' + JSON.stringify(trees) + ';\n');
console.log(out, trees.length + ' trees (' + trees.filter((t) => t[3]).length + ' firs), ' + trees.filter((t) => t[0] >= 0 && t[0] < W && t[1] >= 0 && t[1] < H).length + ' on the painting');
