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
const id = process.argv[2] || 'wickhollow';
require(path.join(R, 'moon-faire-witches/world3d/places', id + '.js'));
const P = window.W3D_PLACES[id], M = window.MAPS[P.mapId];
const png = path.join(R, P.paintingPng);
const TG = Object.assign({ dark: 0.62, step: 46, fir: 0.2, firSouth: 0.34, thorn: 0, keepOut: [], roads: [] }, P.treeGen || {});
// past the painting: { density (0 to 1), clump (how wide the woods' clumps are, px), clear (below this the noise makes a
// clearing), kinds: [leafy, fir, thorn] shares, size: [smallest, largest] } (default: the old even margin of woods)
const OUT = Object.assign({ density: 0.82, clump: 0, clear: 0, kinds: null, size: [0.95, 1.4] }, TG.out || {});
const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
const vnoise = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); return (hash(xi, yi) * (1 - u) + hash(xi + 1, yi) * u) * (1 - v) + (hash(xi, yi + 1) * (1 - u) + hash(xi + 1, yi + 1) * u) * v; };
const EXT = P.extent || [-460, -420, 1536 + 460, 1024 + 420];
const pick = (w, u) => { const t = w[0] + w[1] + w[2]; return u * t < w[0] ? 0 : u * t < w[0] + w[1] ? 1 : 2; };
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
const nearWalk = (x, y, m) => M.walk.concat((P.walkAdd || []).map((a) => a.poly || a)).some((p) => inPoly(p, x, y) || edge(p, x, y) < m);
const inBuilding = (x, y, m) => P.buildings.some((b) => x > b.fp[0] - m && x < b.fp[2] + m && y > b.fp[1] - m && y < b.fp[3] + m);
const inWater = (x, y, m) => P.water.some((w) => inPoly(w.poly, x, y) && edge(w.poly, x, y) > m);
const inLawn = (x, y) => P.lawns.some((l) => inPoly(l, x, y));
let s = 7;
const rnd = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e6) / 1e6; };
const trees = [];
const STEP = TG.step;
// the roads that go on past the painting's edges (they stay open), and anywhere else no tree goes
const roads = TG.roads;
for (let gy = EXT[1]; gy < EXT[3]; gy += STEP) for (let gx = EXT[0]; gx < EXT[2]; gx += STEP) {
  const x = gx + (rnd() - 0.5) * STEP * 0.9, y = gy + (rnd() - 0.5) * STEP * 0.9;
  const inside = x >= 0 && x < W && y >= 0 && y < H;
  let dens = OUT.density;
  if (!inside && OUT.clump) { const n = vnoise(x / OUT.clump, y / OUT.clump) * 0.7 + vnoise(x / OUT.clump * 3.1, y / OUT.clump * 3.1) * 0.3; dens *= n < OUT.clear ? 0 : Math.min(1, (n - OUT.clear) / 0.25); }
  if (inside) { if (darkShare(x, y, 26) < TG.dark) continue; }
  else if (rnd() > dens) continue;
  if (nearWalk(x, y, 30) || inBuilding(x, y, 16) || inWater(x, y, -6) || inLawn(x, y)) continue;
  if (roads.some((r) => x > r[0] - 30 && x < r[2] + 30 && y > r[1] - 30 && y < r[3] + 30)) continue;
  if (TG.keepOut.some((r) => x > r[0] && x < r[2] && y > r[1] && y < r[3])) continue;
  let kind = rnd() < (y > H * 0.62 ? TG.firSouth : TG.fir) ? 1 : 0;
  if (TG.thorn && rnd() < TG.thorn) kind = 2;
  if (!inside && OUT.kinds) kind = pick(OUT.kinds, rnd());
  const size = inside ? 0.8 + rnd() * 0.45 : OUT.size[0] + rnd() * (OUT.size[1] - OUT.size[0]);
  trees.push([Math.round(x), Math.round(y), +(size.toFixed(2)), kind, Math.round(rnd() * 1000)]);
}
const out = path.join(R, 'moon-faire-witches/world3d/places', id + '-trees.js');
fs.writeFileSync(out, '// ' + path.basename(out) + ': made by world3d/tools/make-trees.mjs from the painting (do not edit by hand).\n' +
  '// [x, y (painting pixels), size, kind (0 leafy, 1 fir, 2 bare and thorny), seed]\n(window.W3D_TREES = window.W3D_TREES || {})[' + JSON.stringify(id) + '] = ' + JSON.stringify(trees) + ';\n');
console.log(out, trees.length + ' trees (' + trees.filter((t) => t[3] === 1).length + ' firs, ' + trees.filter((t) => t[3] === 2).length + ' bare thorny), ' + trees.filter((t) => t[0] >= 0 && t[0] < W && t[1] >= 0 && t[1] < H).length + ' on the painting');
