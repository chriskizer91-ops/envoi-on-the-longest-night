// world-mask.mjs: the world map's walking mask (plan phase 4), made from Chris's day atlas, which lines up exactly with the
// night one and shows water plainly (blue and teal) where the night hides it. Each 8 x 8 atlas cell is water or land;
// rivers and straits narrower than about 32 px are closed over (the pixel Io crosses them as if by a ford or a bridge),
// specks of water inside the land are filled, and the land round every place is kept open. Writes src/game/world-mask.js
// (globalThis.WORLD_MASK = { w, h, cell, rle }: runs of 0 water and 1 land, row by row) and checks that each place
// can be walked to from the next. Usage: node tools/world-mask.mjs [preview.png]
import path from 'path'; import fs from 'fs'; import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const R = path.resolve(new URL('..', import.meta.url).pathname);
const sharp = require(path.join(R, 'tools/node_modules/sharp'));
const CELL = 8, W = 4608 / CELL, H = 3072 / CELL;
const { data } = await sharp(path.join(R, 'reference/art/world-map/day/Aethermoor-Nine-Region-Atlas.webp')).resize(W, H).raw().toBuffer({ resolveWithObject: true });
let land = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) { const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2]; land[i] = b > r + 22 && b >= g - 6 ? 0 : 1; }
const morph = (a, rad, grow) => { const o = new Uint8Array(W * H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let v = grow ? 0 : 1; for (let dy = -rad; dy <= rad && v === (grow ? 0 : 1); dy++) for (let dx = -rad; dx <= rad; dx++) { if (dx * dx + dy * dy > rad * rad) continue; const X = x + dx, Y = y + dy; const s = X < 0 || Y < 0 || X >= W || Y >= H ? 0 : a[Y * W + X]; if (grow ? s : !s) { v = grow ? 1 : 0; break; } } o[y * W + x] = v; } return o; };
// closing: grow the land by two cells, then shrink it back
land = morph(morph(land, 2, true), 2, false);
// fill water specks smaller than 40 cells, and drop land specks smaller than 6
function components(val) { const id = new Int32Array(W * H).fill(-1), sizes = []; for (let i = 0; i < W * H; i++) { if (land[i] !== val || id[i] >= 0) continue; const q = [i]; id[i] = sizes.length; let n = 0; while (q.length) { const c = q.pop(); n++; const x = c % W, y = (c - x) / W; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue; const j = Y * W + X; if (land[j] === val && id[j] < 0) { id[j] = sizes.length; q.push(j); } } } sizes.push(n); } return { id, sizes }; }
{ const { id, sizes } = components(0); for (let i = 0; i < W * H; i++) if (land[i] === 0 && sizes[id[i]] < 40) land[i] = 1; }
{ const { id, sizes } = components(1); for (let i = 0; i < W * H; i++) if (land[i] === 1 && sizes[id[i]] < 6) land[i] = 0; }
// the places (design decisions, seventeenth round) and the wild ground maps' entrances on the way between them
const PLACES = { wickhollow: [1348, 1838], thornwood: [1530, 2160], bogmire: [1752, 2512], dawnroost: [1325, 1098], crossroads: [1960, 820], shipyard: [2097, 599], frozenPass: [3270, 980], misthollow: [3500, 735] };
for (const [x, y] of Object.values(PLACES)) for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) { const X = Math.floor(x / CELL) + dx, Y = Math.floor(y / CELL) + dy; if (dx * dx + dy * dy <= 36 && X >= 0 && Y >= 0 && X < W && Y < H) land[Y * W + X] = 1; }
// can each place be walked to from the one before it?
function reach(a, b) { const s = Math.floor(a[1] / CELL) * W + Math.floor(a[0] / CELL), t = Math.floor(b[1] / CELL) * W + Math.floor(b[0] / CELL); const seen = new Uint8Array(W * H); const q = [s]; seen[s] = 1; let steps = 0; const dist = new Int32Array(W * H); for (let h = 0; h < q.length; h++) { const c = q[h]; if (c === t) return dist[c] * CELL; const x = c % W, y = (c - x) / W; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue; const j = Y * W + X; if (land[j] && !seen[j]) { seen[j] = 1; dist[j] = dist[c] + 1; q.push(j); } } } return -1; }
for (const [a, b] of [['wickhollow', 'thornwood'], ['thornwood', 'bogmire'], ['wickhollow', 'dawnroost'], ['dawnroost', 'crossroads'], ['crossroads', 'shipyard'], ['shipyard', 'frozenPass'], ['frozenPass', 'misthollow']]) console.log(a + ' -> ' + b + ': ' + (reach(PLACES[a], PLACES[b]) < 0 ? 'NOT connected' : 'about ' + reach(PLACES[a], PLACES[b]) + ' px on foot'));
// run-length rows
let rle = '', run = 0, cur = land[0];
const out = []; for (let i = 0; i < W * H; i++) { if (land[i] === cur) run++; else { out.push(run); cur = land[i]; run = 1; } } out.push(run);
rle = out.map((n) => n.toString(36)).join(',');
fs.writeFileSync(path.join(R, 'src/game/world-mask.js'), '// world-mask.js: made by tools/world-mask.mjs from the day atlas; do not edit. Runs alternate water (first) and land, row by row, in base 36.\nglobalThis.WORLD_MASK = { w: ' + W + ', h: ' + H + ', cell: ' + CELL + ', first: ' + land[0] + ', rle: "' + rle + '" };\n');
console.log('mask', W + 'x' + H, (rle.length / 1024).toFixed(1) + ' KB');
const prev = process.argv[2];
if (prev) {
  const o = Buffer.alloc(W * H * 4); for (let i = 0; i < W * H; i++) { o[i * 4] = land[i] ? 255 : 0; o[i * 4 + 1] = land[i] ? 230 : 60; o[i * 4 + 2] = land[i] ? 80 : 255; o[i * 4 + 3] = land[i] ? 70 : 150; }
  const ov = await sharp(o, { raw: { width: W, height: H, channels: 4 } }).resize(1152, 768, { kernel: 'nearest' }).png().toBuffer();
  let svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1152" height="768">'; for (const [n, [x, y]] of Object.entries(PLACES)) svg += '<circle cx="' + x / 4 + '" cy="' + y / 4 + '" r="5" fill="#f0f" stroke="#000"/><text x="' + (x / 4 + 7) + '" y="' + (y / 4 + 4) + '" fill="#fff" font-size="13" stroke="#000" stroke-width="0.5">' + n + '</text>'; svg += '</svg>';
  await sharp(path.join(R, 'reference/art/world-map/night/Aethermoor-Natural-Night-Atlas.webp')).resize(1152, 768).composite([{ input: ov }, { input: Buffer.from(svg) }]).png().toFile(prev);
}
