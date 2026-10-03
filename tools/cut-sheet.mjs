// cut-sheet.mjs: turns a generated walk sheet (art request 08: six steps in each of four directions, on a transparent or
// a plain green background) into the game's walker: every figure found on the sheet by itself, then laid out again in
// even cells with its feet on one line, at the size the phone needs, as WebP, with a small JSON beside it.
// Usage: node tools/cut-sheet.mjs <sheet.png> <out-name> [--height 170] [--q 85] [--out art/walkers] [--preview x.png]
//   out-name: the walker's id (art/walkers/<id>.webp and <id>.json); --height: a full-height figure's height in the output
//   (an adult; children and gnomes come out smaller, as drawn); --preview also writes the cut frames on a dark ground
// The JSON: { cols: 6, rows: 4, cell: [w, h], foot: [x, y] (the feet's spot in each cell), h: the tallest figure's
// height, rows order: s, w, e, n (toward the viewer, left, right, away) }
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(new URL('./package.json', import.meta.url));
const sharp = require('sharp');

const args = process.argv.slice(2), pos = [];
let height = 170, q = 85, outDir = 'art/walkers', preview = '';
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--height') height = +args[++i];
  else if (args[i] === '--q') q = +args[++i];
  else if (args[i] === '--out') outDir = args[++i];
  else if (args[i] === '--preview') preview = args[++i];
  else pos.push(args[i]);
}
const [file, id] = pos;
if (!file || !id) { console.error('usage: node tools/cut-sheet.mjs <sheet.png> <id> [--height 170]'); process.exit(1); }
const COLS = 6, ROWS = 4;

// a PNG's content-credentials block (C2PA) can stop sharp: keep only the chunks an image needs
function plainPng(buf) {
  if (buf.toString('ascii', 1, 4) !== 'PNG') return buf;
  const keep = new Set(['IHDR', 'PLTE', 'tRNS', 'IDAT', 'IEND', 'gAMA', 'sRGB', 'cHRM', 'iCCP']), parts = [buf.subarray(0, 8)];
  for (let o = 8; o + 12 <= buf.length;) { const len = buf.readUInt32BE(o), type = buf.toString('ascii', o + 4, o + 8); if (keep.has(type)) parts.push(buf.subarray(o, o + 12 + len)); o += 12 + len; }
  return Buffer.concat(parts);
}
const { data, info } = await sharp(plainPng(fs.readFileSync(file))).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, px = (x, y) => (y * W + x) * 4;

// 1. the background: a sheet without transparency has a plain ground; whatever is close to its corners' colour goes
let opaque = 0; for (let i = 3; i < data.length; i += 4) if (data[i] > 250) opaque++;
if (opaque > W * H * 0.9) {
  const cs = [[2, 2], [W - 3, 2], [2, H - 3], [W - 3, H - 3]].map(([x, y]) => [data[px(x, y)], data[px(x, y) + 1], data[px(x, y) + 2]]);
  const bg = [0, 1, 2].map((c) => Math.round(cs.reduce((s, v) => s + v[c], 0) / cs.length));
  const green = bg[1] > 150 && bg[0] < 120 && bg[2] < 120;
  for (let i = 0; i < data.length; i += 4) {
    const d = Math.hypot(data[i] - bg[0], data[i + 1] - bg[1], data[i + 2] - bg[2]);
    if (d < 60) data[i + 3] = 0;
    else if (d < 110) data[i + 3] = Math.round(255 * (d - 60) / 50);
    // a green ground leaves a green fringe: pull the green down to the other two
    if (green && data[i + 3] > 0) { const m = Math.max(data[i], data[i + 2]); if (data[i + 1] > m) data[i + 1] = m; }
  }
  console.log('  ground keyed out: rgb(' + bg.join(', ') + ')');
}

// 2. every figure: what is solid on the sheet, gathered by which nominal cell its middle falls in (a crow on a shoulder,
// a loose feather or a hat brim come with their figure)
const solid = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) solid[i] = data[i * 4 + 3] > 40 ? 1 : 0;
const label = new Int32Array(W * H).fill(-1), boxes = [];
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = y * W + x; if (!solid[i] || label[i] >= 0) continue;
  const b = { x0: x, y0: y, x1: x, y1: y, n: 0, sx: 0, sy: 0 }, st = [i]; label[i] = boxes.length;
  while (st.length) {
    const c = st.pop(), cx = c % W, cy = (c - cx) / W; b.n++; b.sx += cx; b.sy += cy;
    if (cx < b.x0) b.x0 = cx; if (cx > b.x1) b.x1 = cx; if (cy < b.y0) b.y0 = cy; if (cy > b.y1) b.y1 = cy;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const n = ny * W + nx; if (solid[n] && label[n] < 0) { label[n] = boxes.length; st.push(n); }
    }
  }
  boxes.push(b);
}
const big = boxes.filter((b) => b.n > 60);
const cellW = W / COLS, cellH = H / ROWS, figs = Array.from({ length: COLS * ROWS }, () => null);
for (const b of big) {
  const c = Math.min(COLS - 1, Math.floor(b.sx / b.n / cellW)), r = Math.min(ROWS - 1, Math.floor(b.sy / b.n / cellH)), k = r * COLS + c;
  const f = figs[k] || (figs[k] = { x0: 1e9, y0: 1e9, x1: -1, y1: -1, parts: [] });
  f.x0 = Math.min(f.x0, b.x0); f.y0 = Math.min(f.y0, b.y0); f.x1 = Math.max(f.x1, b.x1); f.y1 = Math.max(f.y1, b.y1); f.parts.push(boxes.indexOf(b));
}
const missing = figs.map((f, i) => (f ? null : i)).filter((i) => i !== null);
if (missing.length) { console.error('  no figure found in cells ' + missing.map((i) => 'row ' + (Math.floor(i / COLS) + 1) + ' col ' + (i % COLS + 1)).join(', ')); process.exit(1); }

// 3. each figure's feet: the middle of its lowest tenth
for (const f of figs) {
  const band = Math.max(4, Math.round((f.y1 - f.y0) * 0.1)); let sx = 0, n = 0;
  for (let y = f.y1 - band; y <= f.y1; y++) for (let x = f.x0; x <= f.x1; x++) { const i = y * W + x; if (solid[i] && f.parts.includes(label[i])) { sx += x; n++; } }
  f.fx = n ? sx / n : (f.x0 + f.x1) / 2; f.fy = f.y1;
}
// 4. even cells: every figure at one scale (the tallest figure becomes --height), its feet on the same spot
const tallest = Math.max(...figs.map((f) => f.y1 - f.y0 + 1)), s = height / tallest;
const left = Math.max(...figs.map((f) => f.fx - f.x0)), right = Math.max(...figs.map((f) => f.x1 - f.fx)), up = Math.max(...figs.map((f) => f.fy - f.y0));
const pad = 4, cw = Math.ceil((left + right) * s) + pad * 2, ch = Math.ceil(up * s) + pad * 2, foot = [Math.round(left * s) + pad, Math.round(up * s) + pad];
const comps = [];
for (let k = 0; k < figs.length; k++) {
  const f = figs[k], w = f.x1 - f.x0 + 1, h = f.y1 - f.y0 + 1;
  // only this figure's own pixels, not a neighbour's stray parts inside its box
  const buf = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (f.y0 + y) * W + f.x0 + x; if (!f.parts.includes(label[i]) && solid[i]) continue; data.copy(buf, (y * w + x) * 4, i * 4, i * 4 + 4); }
  const rw = Math.max(1, Math.round(w * s)), rh = Math.max(1, Math.round(h * s));
  const img = await sharp(buf, { raw: { width: w, height: h, channels: 4 } }).resize(rw, rh, { kernel: 'lanczos3' }).png().toBuffer();
  comps.push({ input: img, left: (k % COLS) * cw + Math.round(foot[0] - (f.fx - f.x0) * s), top: Math.floor(k / COLS) * ch + Math.round(foot[1] - (f.fy - f.y0) * s) });
}
fs.mkdirSync(outDir, { recursive: true });
const sheet = sharp({ create: { width: cw * COLS, height: ch * ROWS, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(comps);
const out = path.join(outDir, id + '.webp');
await sheet.clone().webp({ quality: q, alphaQuality: 90, effort: 6 }).toFile(out);
const meta = { cols: COLS, rows: ROWS, order: ['s', 'w', 'e', 'n'], cell: [cw, ch], foot, h: Math.round(height), heights: figs.map((f) => Math.round((f.y1 - f.y0 + 1) * s)) };
fs.writeFileSync(path.join(outDir, id + '.json'), JSON.stringify(meta));
if (preview) await sharp(await sheet.clone().png().toBuffer()).flatten({ background: '#2a2338' }).png().toFile(preview);
console.log(out, (cw * COLS) + 'x' + (ch * ROWS), (fs.statSync(out).size / 1024).toFixed(0) + ' KB', 'cell ' + cw + 'x' + ch, 'feet at ' + foot.join(','));
