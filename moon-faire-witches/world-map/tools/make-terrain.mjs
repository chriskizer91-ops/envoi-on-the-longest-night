// make-terrain.mjs: reads the land of Aethermoor off Chris's DAY atlas (4608 x 3072, north up; the night atlas has the
// same layout) and writes it as data for a real 3D model of the world: no painting goes on the model.
// Writes into moon-faire-witches/world-map/art/ (labels in art/LABELS.md):
//   aethermoor-terrain-kinds.png   1152 x 768 (one pixel = 4 atlas pixels = 40 m). Red = the kind of ground:
//                                  0 sea, 1 river, 2 lake, 3 pine forest, 4 leafy forest, 5 grass, 6 farmland, 7 fen,
//                                  8 beach sand, 9 desert, 10 red mesa rock, 11 grey rock, 12 snow
//   aethermoor-terrain-height.png  1152 x 768. Height in atlas pixels (1 atlas px = 10 m), as red * 256 + green in
//                                  tenths of a pixel, plus 100 px (so the sea floor stays above 0). Sea level is 0.
// How the height is inferred (the painting has no height in it): the sea is low and deepens away from the coast; land
// rises from its shores and swells inland; painted grey rock stands up as crags and sea cliffs; where the painting has
// mountains (rock and snow, mostly the north-east) the land rises into ridged peaks, highest under the snow; the east's
// red rock stands as flat-topped mesas with cliff steps; the fen is flat; rivers run in their valleys and lakes lie flat.
// Usage: node moon-faire-witches/world-map/tools/make-terrain.mjs [--look <folder>]   (--look: pictures to check by eye)
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const R = path.resolve(new URL('../../..', import.meta.url).pathname);
const sharp = require(path.join(R, 'tools/node_modules/sharp'));
const OUT = path.join(R, 'moon-faire-witches/world-map/art');
fs.mkdirSync(OUT, { recursive: true });
const DAY = path.join(R, 'reference/art/world-map/day/Aethermoor-Nine-Region-Atlas.webp');
const S = 4, W = 4608 / S, H = 3072 / S, N = W * H;
const KIND = { sea: 0, river: 1, lake: 2, pine: 3, leafy: 4, grass: 5, farm: 6, fen: 7, sand: 8, desert: 9, mesa: 10, rock: 11, snow: 12 };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sstep = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

const day = await sharp(DAY).resize(W, H).removeAlpha().raw().toBuffer();
const hue = new Float32Array(N), sat = new Float32Array(N), val = new Float32Array(N), mnv = new Float32Array(N);
for (let i = 0; i < N; i++) {
  const r = day[i * 3] / 255, g = day[i * 3 + 1] / 255, b = day[i * 3 + 2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  let h = 0;
  if (mx !== mn) { if (mx === r) h = 60 * ((g - b) / (mx - mn)); else if (mx === g) h = 60 * (2 + (b - r) / (mx - mn)); else h = 60 * (4 + (r - g) / (mx - mn)); }
  if (h < 0) h += 360;
  hue[i] = h; sat[i] = mx ? (mx - mn) / mx : 0; val[i] = mx; mnv[i] = mn;
}
const AX = (i) => (i % W + 0.5) * S, AY = (i) => (Math.floor(i / W) + 0.5) * S; // a pixel's place on the atlas
// soft boxes on the atlas: 1 inside, fading to 0 over `soft` atlas pixels outside
const box = (x0, y0, x1, y1, soft) => (ax, ay) => { const dx = Math.max(x0 - ax, 0, ax - x1), dy = Math.max(y0 - ay, 0, ay - y1); return Math.max(0, 1 - Math.hypot(dx, dy) / soft); };
// where the painting's country changes (texture-packs/world/aethermoor/inventory.md)
const HIGH = [box(2500, 0, 3800, 1120, 120), box(0, 0, 780, 300, 60), box(3700, 0, 4608, 300, 80)]; // snow mountains
const high = new Float32Array(N), east = new Float32Array(N); // east: the desert country, found below
for (let i = 0; i < N; i++) { const ax = AX(i), ay = AY(i); high[i] = Math.max(...HIGH.map((f) => f(ax, ay))); }

// box blur run three times (close to a soft round blur)
function blur(a, r) {
  let src = Float32Array.from(a), tmp = new Float32Array(N);
  for (let pass = 0; pass < 3; pass++) {
    for (let y = 0; y < H; y++) { let acc = 0; for (let x = -r; x <= r; x++) acc += src[y * W + clamp(x, 0, W - 1)]; for (let x = 0; x < W; x++) { tmp[y * W + x] = acc / (2 * r + 1); acc += src[y * W + Math.min(W - 1, x + r + 1)] - src[y * W + Math.max(0, x - r)]; } }
    for (let x = 0; x < W; x++) { let acc = 0; for (let y = -r; y <= r; y++) acc += tmp[clamp(y, 0, H - 1) * W + x]; for (let y = 0; y < H; y++) { src[y * W + x] = acc / (2 * r + 1); acc += tmp[Math.min(H - 1, y + r + 1) * W + x] - tmp[Math.max(0, y - r) * W + x]; } }
  }
  return src;
}
// how far each pixel is from the nearest pixel where mask is set (in these pixels), by two sweeps
function distance(mask) {
  const d = new Float32Array(N).fill(1e9), D2 = Math.SQRT2;
  for (let i = 0; i < N; i++) if (mask[i]) d[i] = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; let v = d[i]; if (x > 0) v = Math.min(v, d[i - 1] + 1); if (y > 0) { v = Math.min(v, d[i - W] + 1); if (x > 0) v = Math.min(v, d[i - W - 1] + D2); if (x < W - 1) v = Math.min(v, d[i - W + 1] + D2); } d[i] = v; }
  for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) { const i = y * W + x; let v = d[i]; if (x < W - 1) v = Math.min(v, d[i + 1] + 1); if (y < H - 1) { v = Math.min(v, d[i + W] + 1); if (x < W - 1) v = Math.min(v, d[i + W + 1] + D2); if (x > 0) v = Math.min(v, d[i + W - 1] + D2); } d[i] = v; }
  return d;
}
// joined patches of a mask: calls each(members) once per patch
function patches(mask, each) {
  const seen = new Uint8Array(N), stack = new Int32Array(N);
  for (let i0 = 0; i0 < N; i0++) {
    if (!mask[i0] || seen[i0]) continue;
    let top = 0; const members = []; stack[top++] = i0; seen[i0] = 1;
    while (top) { const i = stack[--top], x = i % W; members.push(i);
      if (x > 0 && mask[i - 1] && !seen[i - 1]) { seen[i - 1] = 1; stack[top++] = i - 1; }
      if (x < W - 1 && mask[i + 1] && !seen[i + 1]) { seen[i + 1] = 1; stack[top++] = i + 1; }
      if (i >= W && mask[i - W] && !seen[i - W]) { seen[i - W] = 1; stack[top++] = i - W; }
      if (i < N - W && mask[i + W] && !seen[i + W]) { seen[i + W] = 1; stack[top++] = i + W; } }
    each(members);
  }
}
// noise (the same every run): smooth gradient noise, each layer turned a little so no grid shows
const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
const grad = (xi, yi, fx, fy) => { const a = hash(xi, yi) * Math.PI * 2; return Math.cos(a) * fx + Math.sin(a) * fy; };
function pnoise(x, y) { // about -0.7 to 0.7
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * fx * (fx * (fx * 6 - 15) + 10), v = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
  return (grad(xi, yi, fx, fy) * (1 - u) + grad(xi + 1, yi, fx - 1, fy) * u) * (1 - v) + (grad(xi, yi + 1, fx, fy - 1) * (1 - u) + grad(xi + 1, yi + 1, fx - 1, fy - 1) * u) * v;
}
const turn = (x, y) => [x * 0.8 - y * 0.6, x * 0.6 + y * 0.8];
function fbm(x, y, oct) { let v = 0, a = 0.5, t = 0; for (let o = 0; o < oct; o++) { v += a * (pnoise(x, y) * 0.72 + 0.5); t += a; [x, y] = turn(x * 2.03 + 17.3, y * 2.03 + 9.1); a *= 0.5; } return v / t; }
function ridged(x, y, oct) { let v = 0, a = 0.5, t = 0, w = 1; for (let o = 0; o < oct; o++) { let n = 1 - Math.min(1, Math.abs(pnoise(x, y)) * 1.9); n *= n * w; w = clamp(n * 1.8, 0, 1); v += a * n; t += a; [x, y] = turn(x * 2.1 + 31.7, y * 2.1 + 5.3); a *= 0.5; } return v / t; }

// ---------- water ----------
const water = new Uint8Array(N);
for (let i = 0; i < N; i++) water[i] = hue[i] > 165 && hue[i] < 250 && sat[i] > (high[i] > 0.5 ? 0.5 : 0.28) && day[i * 3 + 2] / 255 > 0.25 ? 1 : 0;
// the blue shadows of the painted snow, and lone blue flecks in a forest, aren't water
patches(water, (m) => { let hi = 0; for (const i of m) hi += high[i] > 0.5 ? 1 : 0; if (m.length < (hi > m.length / 2 ? 400 : 14)) for (const i of m) water[i] = 0; });
// the white surf along the coast belongs to the sea: white beside water becomes water, three pixels deep
for (let pass = 0; pass < 3; pass++) {
  const add = [];
  for (let i = W; i < N - W; i++) if (!water[i] && mnv[i] > 0.66 && sat[i] < 0.24 && high[i] < 0.5 && (water[i - 1] || water[i + 1] || water[i - W] || water[i + W])) add.push(i);
  for (const i of add) water[i] = 1;
}
// where people have built (texture-packs/world/aethermoor/inventory.md): the painted roofs and walls there are grey,
// blue and red, which would read as rock, water and desert; under a town the ground is counted as grass
const SETTLED = [[1348, 1838, 120], [1752, 2512, 110], [1325, 1098, 120], [2097, 599, 110], [3500, 735, 110], [2340, 1240, 250], [990, 728, 80], [3790, 538, 90], [1060, 1245, 100], [2898, 2588, 80]];
const town = new Float32Array(N);
for (let i = 0; i < N; i++) { const ax = AX(i), ay = AY(i); let t = 0; for (const [x, y, r] of SETTLED) t = Math.max(t, 1 - sstep(r * 0.6, r, Math.hypot(ax - x, ay - y))); town[i] = t; }
for (let i = 0; i < N; i++) if (AX(i) < 2600 && AY(i) > 1000) high[i] *= 1 - town[i]; // the capital's island is no mountain (its pale walls aren't snow)
// lone specks of land in the sea smaller than a rock go under
{ const landM = new Uint8Array(N); for (let i = 0; i < N; i++) landM[i] = water[i] ? 0 : 1; patches(landM, (m) => { if (m.length < 6) for (const i of m) water[i] = 1; }); }
// open water (the sea and the lakes) is what's left after wearing the edges away and growing them back; the rest is river
const dLand = distance(Uint8Array.from(water, (v) => (v ? 0 : 1))); // inside water: how far to land
const core = new Uint8Array(N); for (let i = 0; i < N; i++) core[i] = water[i] && dLand[i] > 3.2 ? 1 : 0;
const dCore = distance(core), open = new Uint8Array(N);
for (let i = 0; i < N; i++) open[i] = water[i] && dCore[i] <= 4.4 ? 1 : 0;
const kind = new Uint8Array(N).fill(255);
patches(open, (m) => {
  let edge = false; for (const i of m) { const x = i % W, y = (i / W) | 0; if (x === 0 || y === 0 || x === W - 1 || y === H - 1) { edge = true; break; } }
  const k = edge || m.length > 20000 ? KIND.sea : KIND.lake; for (const i of m) kind[i] = k;
});
for (let i = 0; i < N; i++) if (water[i] && kind[i] === 255) kind[i] = KIND.river;
// a small patch of "river" that reaches neither the sea nor a lake is a blue roof or a shadow, not water (the fen's
// pools are real: those stay)
{
  const FENPOOLS = box(1700, 2150, 3050, 2760, 60);
  patches(Uint8Array.from(kind, (v) => (v === KIND.river ? 1 : 0)), (m) => {
    let joins = false, inTown = 0, inFen = 0;
    for (const i of m) { const x = i % W; if ((x > 0 && (kind[i - 1] === KIND.sea || kind[i - 1] === KIND.lake)) || (x < W - 1 && (kind[i + 1] === KIND.sea || kind[i + 1] === KIND.lake)) || (i >= W && (kind[i - W] === KIND.sea || kind[i - W] === KIND.lake)) || (i < N - W && (kind[i + W] === KIND.sea || kind[i + W] === KIND.lake))) joins = true; inTown += town[i] > 0.5 ? 1 : 0; inFen += FENPOOLS(AX(i), AY(i)) > 0.5 ? 1 : 0; }
    const limit = inTown > m.length / 2 ? 700 : inFen > m.length / 2 ? 0 : 90;
    if (!joins && m.length < limit) for (const i of m) { kind[i] = 255; water[i] = 0; }
  });
}
const land = new Uint8Array(N); for (let i = 0; i < N; i++) land[i] = water[i] ? 0 : 1;

// ---------- the kinds of ground: each pixel votes by its colour, the votes are softened, the most votes wins ----------
// (the atlas's colours, measured: forest and grass are yellow-green to green, hue 45 to 170; pines darker and bluer,
// leafy woods and grass yellower; fields, desert floor and lit rock are all gold-orange, hue 20 to 45, so those are
// told apart by what is round them: fields lie among green, the desert among more desert)
const LAND = ['pine', 'leafy', 'grass', 'farm', 'fen', 'sand', 'desert', 'mesa', 'rock', 'snow'];
const vote = Object.fromEntries(LAND.map((k) => [k, new Float32Array(N)]));
const landF = Float32Array.from(land), dWater = distance(water); // on land: how far to any water (sea, river, lake)
const near = (mask, r) => { const a = blur(mask, r), l = blur(landF, r); for (let i = 0; i < N; i++) a[i] = l[i] > 0.05 ? a[i] / l[i] : 0; return a; };
const green = new Float32Array(N), earth = new Float32Array(N), wet = new Float32Array(N);
for (let i = 0; i < N; i++) {
  if (land[i]) { const h = hue[i]; green[i] = h >= 45 && h < 170 && sat[i] > 0.3 ? 1 : 0; earth[i] = (h < 45 || h > 330) && sat[i] > 0.38 && val[i] > 0.3 ? 1 : 0; }
  wet[i] = kind[i] === KIND.river || kind[i] === KIND.lake ? 1 : 0;
}
// the desert: where coloured earth far outnumbers green, in the east half; the fen: green cut by many channels, in the south
const earthNear = near(earth, 14), wetNear = blur(wet, 14);
const EASTBOX = box(2750, 1050, 4608, 3072, 260), FENBOX = box(1700, 2150, 3050, 2760, 160);
const desertZ = new Float32Array(N), fenZ = new Float32Array(N);
for (let i = 0; i < N; i++) { const ax = AX(i), ay = AY(i); desertZ[i] = sstep(0.36, 0.5, earthNear[i]) * sstep(0.2, 0.7, EASTBOX(ax, ay)); fenZ[i] = sstep(0.025, 0.06, wetNear[i]) * sstep(0.2, 0.7, FENBOX(ax, ay)) * (1 - desertZ[i]); east[i] = desertZ[i]; }
for (let i = 0; i < N; i++) {
  if (!land[i]) continue;
  const h = hue[i], s = sat[i], v = val[i], e = desertZ[i], f = fenZ[i], hi = high[i];
  if (town[i] > 0.5 && !green[i] && hi < 0.5) { vote.grass[i] = 0.6; continue; } // roofs, walls and streets
  if (mnv[i] > 0.7 && s < 0.2) { if (hi > 0.3) vote.snow[i] = 1; else if (dWater[i] < 10) vote.sand[i] = 0.7; else vote.rock[i] = 0.6; continue; }
  if (green[i]) {
    if (f > 0.5) { vote.fen[i] = 1; continue; }
    if (h >= 85 || s < 0.42) vote.pine[i] = 1; // darker, bluer green
    else if (v > 0.52) { vote.grass[i] = 1; vote.leafy[i] = 0.35; }
    else { vote.leafy[i] = 1; vote.pine[i] = 0.25; }
  } else if (h < 45 || h > 330) {
    if (e > 0.5) { if (v < 0.6) vote.mesa[i] = 1; else vote.desert[i] = 0.62; } // rust faces mark a mesa; its lit top looks like the floor
    else if (f > 0.5) vote.fen[i] = 0.7;
    else if (s < 0.24) vote.rock[i] = 1; // grey
    else if (v > 0.72 && s < 0.45) { if (dWater[i] < 12) vote.sand[i] = 1; else vote.rock[i] = 0.7; } // pale: a beach, or a lit rock face
    else if (v > 0.66 && s >= 0.45 && hi < 0.4) vote.farm[i] = 1; // gold and orange fields
    else vote.rock[i] = 0.9; // brown rock faces
  } else vote.rock[i] = hi > 0.3 ? 1 : 0.45; // blue-grey: a shaded rock or snow face, a roof, a shadow
}
// fields lie among green: a gold patch with rock or desert all round it is lit rock
const greenNear = near(green, 6);
for (let i = 0; i < N; i++) if (vote.farm[i] && greenNear[i] < 0.45) { vote.rock[i] += 0.8; vote.farm[i] = 0; }
const RAD = { snow: 1, sand: 1, mesa: 3, desert: 3, farm: 2 };
const soft = Object.fromEntries(LAND.map((k) => [k, blur(vote[k], RAD[k] || 2)]));
for (let i = 0; i < N; i++) {
  if (!land[i]) continue;
  let best = 'grass', bv = 0.0001;
  for (const k of LAND) { const v = soft[k][i]; if (v > bv) { bv = v; best = k; } }
  kind[i] = KIND[best];
}
// farmland is a patchwork, green fields among the gold: grass and leaves close among gold fields are fields too
{ const gold = near(vote.farm, 5); for (let i = 0; i < N; i++) if (land[i] && gold[i] > 0.1 && (kind[i] === KIND.grass || kind[i] === KIND.leafy)) kind[i] = KIND.farm; }

// ---------- the height (atlas pixels; sea level 0) ----------
const is = (k) => Float32Array.from(kind, (v) => (v === KIND[k] ? 1 : 0));
const rockM = is('rock'), snowM = is('snow'), mesaM = is('mesa'), fenM = is('fen');
const stone = new Float32Array(N); for (let i = 0; i < N; i++) stone[i] = Math.min(1, rockM[i] + snowM[i]);
const massif = blur(stone, 11), peaks = blur(stone, 3), snowB = blur(snowM, 5), crag = blur(rockM, 3), cragWide = blur(rockM, 9);
const mesaNear = blur(mesaM, 2), mesaWide = blur(mesaM, 6), fenB = blur(fenM, 5);
const dSeaLake = distance(Uint8Array.from(kind, (v) => (v === KIND.sea || v === KIND.lake ? 1 : 0)));
const hgt = new Float32Array(N);
for (let i = 0; i < N; i++) {
  if (!land[i]) continue;
  const ax = AX(i), ay = AY(i), d = dWater[i] * S, dOpen = dSeaLake[i] * S, flat = 1 - 0.85 * fenB[i];
  // land rises from its shores (a short step up from the sea, gentler from a river), then swells inland
  let v = 1.2 + sstep(0, 26, d) * 5 + sstep(0, 22, dOpen) * 3 + (1 - Math.exp(-dOpen / 340)) * 20 * flat;
  v += (fbm(ax / 150, ay / 150, 4) - 0.5) * 16 * flat * sstep(10, 90, dOpen); // the land rolls
  // grey rock outside the mountains: crags and sea cliffs
  v += (crag[i] * 13 + cragWide[i] * 24) * (1 - high[i]) * (1 - east[i]) * (1 - 0.85 * town[i]) * sstep(0, 14, d);
  // the mountains: a massif under the painted rock and snow, peaks on it, highest under the snow
  // (rising over the first mile and a half from the sea, not straight out of it)
  const rise = sstep(0, 160, dOpen), m = high[i] * massif[i] * rise;
  v += high[i] * rise * (massif[i] * 95 + peaks[i] * 50 + snowB[i] * 60);
  v += m * (ridged(ax / 190, ay / 190, 4) * 105 + ridged(ax / 60 + 9, ay / 60 + 4, 3) * 20) * sstep(0.12, 0.5, massif[i]);
  // the east: flat-topped mesas, in two cliff steps, on a rolling desert floor
  const e = east[i];
  v += e * (sstep(0.42, 0.56, mesaNear[i]) * 30 + sstep(0.5, 0.62, mesaWide[i]) * sstep(0.8, 0.95, mesaNear[i]) * 22 + mesaWide[i] * 10);
  hgt[i] = Math.max(0.8, v);
}
// one soft pass over the land so no single pixel spikes (the mesas' steps stay steep enough)
{ const hb = blur(hgt, 1), lb = blur(Float32Array.from(land), 1); for (let i = 0; i < N; i++) if (land[i]) hgt[i] = Math.max(0.8, hb[i] / Math.max(lb[i], 0.35)); }
// the sea floor: a shallow shelf, then deeper
for (let i = 0; i < N; i++) if (kind[i] === KIND.sea) hgt[i] = -0.6 - sstep(0, 70, dLand[i] * S) * 16 - sstep(60, 400, dLand[i] * S) * 14;
// rivers: at sea level where they meet the sea, climbing inland no faster than their banks
{
  const lh = new Float32Array(N); for (let i = 0; i < N; i++) lh[i] = land[i] ? hgt[i] : 0;
  const hb = blur(lh, 3), lb = blur(Float32Array.from(land), 3);
  const from = new Float32Array(N).fill(1e9), q = [];
  for (let i = 0; i < N; i++) if (kind[i] === KIND.river) { const x = i % W; if ((x > 0 && kind[i - 1] === KIND.sea) || (x < W - 1 && kind[i + 1] === KIND.sea) || (i >= W && kind[i - W] === KIND.sea) || (i < N - W && kind[i + W] === KIND.sea)) { from[i] = 0; q.push(i); } }
  for (let qi = 0; qi < q.length; qi++) { const i = q[qi], x = i % W; for (const j of [i - 1, i + 1, i - W, i + W]) { if (j < 0 || j >= N || kind[j] !== KIND.river || from[j] <= from[i] + 1) continue; if ((j === i - 1 && x === 0) || (j === i + 1 && x === W - 1)) continue; from[j] = from[i] + 1; q.push(j); } }
  for (let i = 0; i < N; i++) if (kind[i] === KIND.river) {
    const bank = lb[i] > 0.02 ? hb[i] / lb[i] : 2, run = from[i] > 1e8 ? 1e9 : (from[i] - 3) * S * 0.09;
    hgt[i] = Math.min(bank * 0.8 - 0.8, run);
    if (hgt[i] <= 0.15) hgt[i] = Math.min(hgt[i], -0.5); // down at the sea it is the sea's water
  }
}
// lakes lie flat, a little under their lowest shore
patches(Uint8Array.from(kind, (v) => (v === KIND.lake ? 1 : 0)), (m) => {
  let low = 1e9; for (const i of m) for (const j of [i - 1, i + 1, i - W, i + W]) if (j >= 0 && j < N && land[j]) low = Math.min(low, hgt[j]);
  for (const i of m) hgt[i] = (low > 1e8 ? 2 : low) - 0.6;
});

// outside the mountains and the desert, painted grey rock is mostly cliff faces: it has given the land its crags
// and steps above; the 3D model paints any steep face as bare rock by itself, so here that ground takes the kind of
// what grows round it (otherwise every crag would be a bald grey dome)
{
  const GROW = ['pine', 'leafy', 'grass', 'farm', 'fen'], wide = Object.fromEntries(GROW.map((k) => [k, blur(vote[k], 6)]));
  // (sand is a beach: low ground by the water. Pale ground standing higher is a lit cliff, so it is regrown too)
  for (let i = 0; i < N; i++) if (land[i] && high[i] < 0.3 && east[i] < 0.5 && (kind[i] === KIND.rock || (kind[i] === KIND.sand && hgt[i] > 7))) {
    let best = 'grass', bv = 0.004; for (const k of GROW) if (wide[k][i] > bv) { bv = wide[k][i]; best = k; }
    kind[i] = KIND[best];
  }
}
// in the mountains, the highest ground is under snow whether or not the painting shows it at that very spot
for (let i = 0; i < N; i++) if (land[i] && high[i] > 0.5 && (kind[i] === KIND.rock || kind[i] === KIND.pine) && hgt[i] > 205 + (fbm(AX(i) / 40, AY(i) / 40, 3) - 0.5) * 60) kind[i] = KIND.snow;

// ---------- written ----------
const kpng = Buffer.alloc(N * 3), hpng = Buffer.alloc(N * 3);
let top = 0, topAt = 0; const count = new Array(13).fill(0);
for (let i = 0; i < N; i++) {
  kpng[i * 3] = kind[i]; count[kind[i]]++;
  const t = clamp(Math.round((hgt[i] + 100) * 10), 0, 65535); hpng[i * 3] = t >> 8; hpng[i * 3 + 1] = t & 255;
  if (hgt[i] > top) { top = hgt[i]; topAt = i; }
}
const kf = path.join(OUT, 'aethermoor-terrain-kinds.png'), hf = path.join(OUT, 'aethermoor-terrain-height.png');
await sharp(kpng, { raw: { width: W, height: H, channels: 3 } }).png({ compressionLevel: 9 }).toFile(kf);
await sharp(hpng, { raw: { width: W, height: H, channels: 3 } }).png({ compressionLevel: 9 }).toFile(hf);
const names = Object.keys(KIND);
console.log('kinds ' + (fs.statSync(kf).size / 1024).toFixed(0) + ' KB · height ' + (fs.statSync(hf).size / 1024).toFixed(0) + ' KB');
console.log('highest point: ' + Math.round(top * 10) + ' m at atlas ' + Math.round(AX(topAt)) + ', ' + Math.round(AY(topAt)));
console.log('the map by kind: ' + names.map((n, k) => n + ' ' + (100 * count[k] / N).toFixed(1) + '%').join(', '));
// pictures to check by eye: the kinds in plain colours, and the height as shaded relief
const li = process.argv.indexOf('--look');
if (li >= 0) {
  const dir = process.argv[li + 1]; fs.mkdirSync(dir, { recursive: true });
  const COL = [[20, 50, 120], [60, 130, 230], [90, 170, 240], [20, 80, 40], [50, 130, 50], [130, 180, 70], [230, 200, 80], [110, 120, 60], [240, 225, 170], [215, 175, 110], [170, 80, 50], [130, 130, 135], [250, 250, 255]];
  const a = Buffer.alloc(N * 3), b = Buffer.alloc(N * 3);
  for (let i = 0; i < N; i++) {
    const c = COL[kind[i]]; a[i * 3] = c[0]; a[i * 3 + 1] = c[1]; a[i * 3 + 2] = c[2];
    const x = i % W, dx = (hgt[Math.min(N - 1, i + 1)] - hgt[Math.max(0, i - 1)]) / (2 * S), dy = (hgt[Math.min(N - 1, i + W)] - hgt[Math.max(0, i - W)]) / (2 * S);
    const sh = clamp(0.55 + (-dx - dy) * 0.9, 0, 1), base = clamp(hgt[i] / 260, 0, 1);
    const g = hgt[i] <= 0 ? 40 : 60 + 140 * sh + 55 * base; b[i * 3] = hgt[i] <= 0 ? 20 : g; b[i * 3 + 1] = hgt[i] <= 0 ? 40 : g; b[i * 3 + 2] = hgt[i] <= 0 ? 90 : g;
    void x;
  }
  await sharp(a, { raw: { width: W, height: H, channels: 3 } }).jpeg({ quality: 85 }).toFile(path.join(dir, 'kinds.jpg'));
  await sharp(b, { raw: { width: W, height: H, channels: 3 } }).jpeg({ quality: 85 }).toFile(path.join(dir, 'relief.jpg'));
}
