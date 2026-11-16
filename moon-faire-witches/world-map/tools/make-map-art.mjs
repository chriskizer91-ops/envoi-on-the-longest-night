// make-map-art.mjs: the 3D map's pictures, made from Chris's two atlases of Aethermoor (4608 x 3072, north up, the same
// layout by day and by night). Writes into moon-faire-witches/world-map/art/:
//   night-<1..4>.avif  the night atlas in four quarters (2304 x 1536 each: every phone's graphics take a picture that size)
//   height.png         the land's height, 576 x 384 (one pixel for every 8 atlas pixels), read off the DAY atlas:
//                      water is low, land rises from its shore, and the painted rock and snow stand up as mountains.
//                      Height in atlas pixels (1 atlas px = 10 m), kept as red * 256 + green, in tenths of a pixel.
//   land.png           the same size: white where the day atlas shows land, black where it shows water (for checks)
// Usage: node moon-faire-witches/world-map/tools/make-map-art.mjs [--tiles] [--look]
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const R = path.resolve(new URL('../../..', import.meta.url).pathname);
const sharp = require(path.join(R, 'tools/node_modules/sharp'));
const OUT = path.join(R, 'moon-faire-witches/world-map/art');
fs.mkdirSync(OUT, { recursive: true });
const NIGHT = path.join(R, 'reference/art/world-map/night/Aethermoor-Natural-Night-Atlas.webp');
const DAY = path.join(R, 'reference/art/world-map/day/Aethermoor-Nine-Region-Atlas.webp');

// ---- the night atlas in four quarters ----
for (let q = 0; q < 4; q++) {
  const x = (q % 2) * 2304, y = Math.floor(q / 2) * 1536;
  const f = path.join(OUT, 'night-' + (q + 1) + '.avif');
  if (fs.existsSync(f) && !process.argv.includes('--tiles')) continue; // made once (slow); --tiles makes them again
  await sharp(NIGHT).extract({ left: x, top: y, width: 2304, height: 1536 }).avif({ quality: 58, effort: 5 }).toFile(f);
  console.log('night-' + (q + 1) + '.avif', (fs.statSync(f).size / 1024).toFixed(0) + ' KB');
}

// ---- the height map ----
const S = 4, W = 4608 / S, H = 3072 / S; // worked at a quarter of the atlas (1152 x 768), written at an eighth
const day = await sharp(DAY).resize(W, H).removeAlpha().raw().toBuffer();
const N = W * H, water = new Float32Array(N), rock = new Float32Array(N), snow = new Float32Array(N);
for (let i = 0; i < N; i++) {
  const r = day[i * 3] / 255, g = day[i * 3 + 1] / 255, b = day[i * 3 + 2] / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), s = mx ? (mx - mn) / mx : 0;
  let h = 0;
  if (mx !== mn) { if (mx === r) h = 60 * ((g - b) / (mx - mn)); else if (mx === g) h = 60 * (2 + (b - r) / (mx - mn)); else h = 60 * (4 + (r - g) / (mx - mn)); }
  if (h < 0) h += 360;
  // in the mountains the snow's pale blue shadows look like water: there it must be a deep, strong blue
  const ax = 4608 * (i % W) / W, ay = 3072 * Math.floor(i / W) / H, high = (ax > 2500 && ay < 1150) || (ax < 780 && ay < 300) || (ax > 3700 && ay < 300);
  water[i] = h > 165 && h < 250 && s > (high ? 0.5 : 0.28) && b > 0.25 ? 1 : 0;
  snow[i] = mn > 0.72 && s < 0.18 ? 1 : 0;
  // grey and brown rock: little colour, between dark and light (the painted mountains' faces)
  rock[i] = !water[i] && s < 0.45 && (h < 55 || h > 330) && mx > 0.22 && mx < 0.85 ? 1 : 0;
}
// box blur, run three times (close to a soft round blur)
function blur(a, r) {
  let src = Float32Array.from(a), tmp = new Float32Array(N);
  for (let pass = 0; pass < 3; pass++) {
    for (let y = 0; y < H; y++) { let acc = 0; for (let x = -r; x <= r; x++) acc += src[y * W + Math.min(W - 1, Math.max(0, x))]; for (let x = 0; x < W; x++) { tmp[y * W + x] = acc / (2 * r + 1); acc += src[y * W + Math.min(W - 1, x + r + 1)] - src[y * W + Math.max(0, x - r)]; } }
    for (let x = 0; x < W; x++) { let acc = 0; for (let y = -r; y <= r; y++) acc += tmp[Math.min(H - 1, Math.max(0, y)) * W + x]; for (let y = 0; y < H; y++) { src[y * W + x] = acc / (2 * r + 1); acc += tmp[Math.min(H - 1, y + r + 1) * W + x] - tmp[Math.max(0, y - r) * W + x]; } }
  }
  return src;
}
// blue shadows on the painted snow and rock read as water: a patch of "water" smaller than a lake is dropped, the
// limit higher in the mountains (Frostmere Lake, the smallest real lake there, is about 550 of these pixels)
{
  const seen = new Uint8Array(N), stack = new Int32Array(N);
  const mountain = (i) => { const x = i % W, y = (i / W) | 0, ax = 4608 * x / W, ay = 3072 * y / H; return (ax > 2500 && ay < 1150) || (ax < 780 && ay < 300) || (ax > 3700 && ay < 300); };
  for (let i0 = 0; i0 < N; i0++) {
    if (!water[i0] || seen[i0]) continue;
    let n = 0, top = 0, inMount = 0; const members = [];
    stack[top++] = i0; seen[i0] = 1;
    while (top) { const i = stack[--top]; members.push(i); n++; if (mountain(i)) inMount++;
      const x = i % W; for (const j of [i - 1, i + 1, i - W, i + W]) { if (j < 0 || j >= N || seen[j] || !water[j]) continue; if ((j === i - 1 && x === 0) || (j === i + 1 && x === W - 1)) continue; seen[j] = 1; stack[top++] = j; } }
    const limit = inMount > n / 2 ? 400 : 14;
    if (n < limit) for (const i of members) water[i] = 0;
  }
}
// land: the water mask softened once, so lone flecks of blue in a forest don't count as water
const wSoft = blur(water, 1), land = new Float32Array(N);
for (let i = 0; i < N; i++) land[i] = wSoft[i] < 0.5 ? 1 : 0;
// how far each land pixel is from water (in quarter-atlas pixels), by two sweeps
const d = new Float32Array(N).fill(1e9);
for (let i = 0; i < N; i++) if (!land[i]) d[i] = 0;
const D1 = 1, D2 = Math.SQRT2;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; let v = d[i]; if (x > 0) v = Math.min(v, d[i - 1] + D1); if (y > 0) { v = Math.min(v, d[i - W] + D1); if (x > 0) v = Math.min(v, d[i - W - 1] + D2); if (x < W - 1) v = Math.min(v, d[i - W + 1] + D2); } d[i] = v; }
for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) { const i = y * W + x; let v = d[i]; if (x < W - 1) v = Math.min(v, d[i + 1] + D1); if (y < H - 1) { v = Math.min(v, d[i + W] + D1); if (x < W - 1) v = Math.min(v, d[i + W + 1] + D2); if (x > 0) v = Math.min(v, d[i + W - 1] + D2); } d[i] = v; }
// where the mountains are, by the atlas (inventory.md): the northeast range round Peak's Veil and Misthollow, the
// northwest snow island, the northeast coast's peaks, and the eastern canyon country's mesas (lower). Elsewhere the land
// is forest, fen and farmland: low hills only
const box = (x0, y0, x1, y1, soft) => (x, y) => { const ax = 4608 * x / W, ay = 3072 * y / H; const dx = Math.max(x0 - ax, 0, ax - x1), dy = Math.max(y0 - ay, 0, ay - y1); return Math.max(0, 1 - Math.hypot(dx, dy) / soft); };
const RANGES = [
  [box(2550, 60, 3750, 1080, 260), 1.0], // the northeast peaks (Peak's Veil, Frostmere, Misthollow)
  [box(3750, 0, 4608, 260, 200), 0.8], // the far northeast coast's peaks
  [box(0, 0, 760, 280, 160), 0.85], // the northwest snow island
  [box(3050, 1150, 4350, 2450, 220), 0.45], // the canyon country (mesas: flatter tops)
  [box(800, 250, 1700, 900, 250), 0.25], // the north-west hills
];
const peaksRaw = new Float32Array(N);
for (let i = 0; i < N; i++) peaksRaw[i] = Math.min(1, snow[i] * 1.2 + rock[i] * 0.8);
const peaks = blur(peaksRaw, 4), peaksWide = blur(peaksRaw, 11);
const lum = new Float32Array(N);
for (let i = 0; i < N; i++) lum[i] = (day[i * 3] * 0.3 + day[i * 3 + 1] * 0.59 + day[i * 3 + 2] * 0.11) / 255;
const lumBlur = blur(lum, 2);
const h = new Float32Array(N);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = y * W + x;
  let range = 0.12; for (const [f, k] of RANGES) range = Math.max(range, f(x, y) * k);
  if (!land[i]) { h[i] = -3; continue; }
  // the shore: a short rise from the water, then the land's own swell, higher inland
  const dist = d[i] * S; // in atlas pixels
  const shore = Math.min(1, dist / 40), inland = 1 - Math.exp(-dist / 260);
  let v = 3 + shore * 9 + inland * 34;
  // the mountains: the painted rock and snow, wide (the massif) and nearer (each group of peaks), lifted where the ranges
  // are; broad and rounded (the painting draws each peak's own crags, so the land under it needn't)
  v += range * (peaksWide[i] * 145 + peaks[i] * 45);
  // a little of the painting's own light and shade, as texture (a lit face up, a shaded face down)
  v += (lum[i] - lumBlur[i]) * 8 * (0.3 + range);
  h[i] = Math.max(1, v);
}
// the whole field softened once more (no single-pixel spikes), the water kept below the land
const hs = blur(h, 1);
for (let i = 0; i < N; i++) hs[i] = land[i] ? Math.max(1.5, hs[i]) : Math.min(-1, hs[i]);
// written at an eighth of the atlas (576 x 384), in tenths of an atlas pixel, offset by 100 px so the sea floor stays above 0
const W2 = W / 2, H2 = H / 2, png = Buffer.alloc(W2 * H2 * 3), lpng = Buffer.alloc(W2 * H2);
let max = 0;
for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) {
  let v = 0, l = 0;
  for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const i = (2 * y + dy) * W + 2 * x + dx; v += hs[i] / 4; l += land[i] / 4; }
  max = Math.max(max, v);
  const t = Math.max(0, Math.min(65535, Math.round((v + 100) * 10)));
  const o = (y * W2 + x) * 3; png[o] = t >> 8; png[o + 1] = t & 255; png[o + 2] = 0;
  lpng[y * W2 + x] = l >= 0.5 ? 255 : 0;
}
await sharp(png, { raw: { width: W2, height: H2, channels: 3 } }).png({ compressionLevel: 9 }).toFile(path.join(OUT, 'height.png'));
await sharp(lpng, { raw: { width: W2, height: H2, channels: 1 } }).png({ compressionLevel: 9 }).toFile(path.join(OUT, 'land.png'));
console.log('height.png', (fs.statSync(path.join(OUT, 'height.png')).size / 1024).toFixed(0) + ' KB,', 'highest point', max.toFixed(0), 'atlas px (' + (max * 10).toFixed(0) + ' m)');
// a picture of it to look at (not used by the page)
if (process.argv.includes('--look')) {
  const g = Buffer.alloc(W2 * H2);
  for (let i = 0; i < W2 * H2; i++) { const t = png[i * 3] * 256 + png[i * 3 + 1]; g[i] = Math.max(0, Math.min(255, (t / 10 - 100) / max * 255)); }
  await sharp(g, { raw: { width: W2, height: H2, channels: 1 } }).png().toFile('/home/claude/look/height-look.png');
}
