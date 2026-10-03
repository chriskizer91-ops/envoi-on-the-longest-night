// make-versions.mjs: squeezes Chris's example wilderness painting (reference/art/walk/wilds/wilderness-path-example.webp,
// 1500 x 1000, left untouched) into the versions the Wilderness Walk Squeeze page compares, the way tools/compress.mjs
// squeezes the game's art: sharp, Lanczos down to the width, AVIF at effort 6. Then it measures each version: its pixels,
// its size, and how much detail it keeps. Detail kept is SSIM against the painting as he sent it, the way the town maps'
// page measured it: each version scaled back up smoothly to 1500 x 1000, compared on brightness with an 11-pixel
// Gaussian window, in four close-ups (the path, the oak, the stone wall and the flowers), and averaged. The whole
// painting is measured too, for reference.
// Writes img/original.webp (a byte-for-byte copy), img/<id>.avif, and versions.js, the numbers the page reads. The
// picture paths in versions.js are "./img/..." in double quotes, so tools/build.mjs puts the pictures inside the page.
// Usage: node envoi-game-pass-3/walk-squeeze/make-versions.mjs   (needs sharp: npm install --prefix tools)
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const HERE = path.dirname(new URL(import.meta.url).pathname), R = path.resolve(HERE, '../..');
const sharp = createRequire(path.join(R, 'tools/package.json'))('sharp');
const SOURCE = path.join(R, 'reference/art/walk/wilds/wilderness-path-example.webp');

// light: squeezed harder at the same size (quality 30 rather than 45, as on the town maps' page); extra light: 20.
// 100% extra light is here because the first measurements showed that, weight for weight, keeping every pixel and
// squeezing harder keeps more of this painting than making it smaller (100% light and 75% weigh the same).
const VERSIONS = [
  { id: 'original', name: 'Original', scale: 1, q: 0, tag: 'As you sent it' },
  { id: 'a100', name: '100%', scale: 1, q: 45 },
  { id: 'a100l', name: '100% light', scale: 1, q: 30 },
  { id: 'a100xl', name: '100% extra light', scale: 1, q: 20 },
  { id: 'a75', name: '75%', scale: 0.75, q: 45 },
  { id: 'a75l', name: '75% light', scale: 0.75, q: 30, tag: 'Town maps' },
  { id: 'a63l', name: '63% light', scale: 0.63, q: 30 },
  { id: 'a50l', name: '50% light', scale: 0.5, q: 30 },
  { id: 'a50xl', name: '50% extra light', scale: 0.5, q: 20 },
];
// the close-ups, in the painting's own 1500 x 1000 pixels: [left, top, width, height]
const PATCHES = { path: [632, 650, 256, 256], oak: [330, 230, 256, 256], wall: [1000, 140, 256, 256], flowers: [400, 590, 256, 256] };

// ---------- SSIM (Wang et al. 2004) on brightness, 11-tap Gaussian (sigma 1.5), windows wholly inside the rectangle ----------
const K = (() => { const k = []; let s = 0; for (let i = -5; i <= 5; i++) { const v = Math.exp(-(i * i) / 4.5); k.push(v); s += v; } return k.map((v) => v / s); })();
const luma = (raw, n, ch) => { const Y = new Float64Array(n); for (let i = 0; i < n; i++) Y[i] = 0.299 * raw[i * ch] + 0.587 * raw[i * ch + 1] + 0.114 * raw[i * ch + 2]; return Y; };
function ssim(A, B, W, [x0, y0, w, h]) {
  const r = 5, ow = w - 2 * r, oh = h - 2 * r, maps = [0, 1, 2, 3, 4].map(() => new Float64Array(w * h));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const a = A[(y0 + y) * W + x0 + x], b = B[(y0 + y) * W + x0 + x], i = y * w + x;
    maps[0][i] = a; maps[1][i] = b; maps[2][i] = a * a; maps[3][i] = b * b; maps[4][i] = a * b;
  }
  const blur = (m) => {
    const hz = new Float64Array(ow * h), out = new Float64Array(ow * oh);
    for (let y = 0; y < h; y++) for (let x = 0; x < ow; x++) { let v = 0; for (let k = 0; k < 11; k++) v += K[k] * m[y * w + x + k]; hz[y * ow + x] = v; }
    for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) { let v = 0; for (let k = 0; k < 11; k++) v += K[k] * hz[(y + k) * ow + x]; out[y * ow + x] = v; }
    return out;
  };
  const [ma, mb, aa, bb, ab] = maps.map(blur), C1 = (0.01 * 255) ** 2, C2 = (0.03 * 255) ** 2;
  let sum = 0;
  for (let i = 0; i < ow * oh; i++) {
    const va = aa[i] - ma[i] * ma[i], vb = bb[i] - mb[i] * mb[i], cov = ab[i] - ma[i] * mb[i];
    sum += ((2 * ma[i] * mb[i] + C1) * (2 * cov + C2)) / ((ma[i] * ma[i] + mb[i] * mb[i] + C1) * (va + vb + C2));
  }
  return sum / (ow * oh);
}
// a picture as brightness at the painting's full size, scaled back up smoothly when it is smaller
async function brightness(file, W, H) {
  let img = sharp(file);
  const m = await img.metadata();
  if (m.width !== W || m.height !== H) img = img.resize(W, H, { kernel: 'lanczos3' });
  const { data, info } = await img.removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return luma(data, W * H, info.channels);
}

const imgDir = path.join(HERE, 'img');
fs.mkdirSync(imgDir, { recursive: true });
const meta = await sharp(SOURCE).metadata(), W = meta.width, H = meta.height;
const ref = await brightness(SOURCE, W, H);
const out = [];
for (const v of VERSIONS) {
  const file = path.join(imgDir, v.q ? v.id + '.avif' : 'original.webp');
  if (!v.q) { fs.copyFileSync(SOURCE, file); fs.chmodSync(file, 0o644); }
  else {
    const w = Math.round(W * v.scale);
    let img = sharp(SOURCE);
    if (w < W) img = img.resize({ width: w, kernel: 'lanczos3' });
    await img.avif({ quality: v.q, effort: 6 }).toFile(file);
  }
  const m = await sharp(file).metadata(), bytes = fs.statSync(file).size;
  const Y = await brightness(file, W, H);
  const close = Object.fromEntries(Object.entries(PATCHES).map(([k, rect]) => [k, +ssim(ref, Y, W, rect).toFixed(3)]));
  const detail = +(Object.values(close).reduce((a, b) => a + b, 0) / 4).toFixed(3);
  const whole = +ssim(ref, Y, W, [0, 0, W, H]).toFixed(3);
  out.push({ id: v.id, name: v.name, tag: v.tag || '', px: [m.width, m.height], fmt: v.q ? 'AVIF' : 'WebP', q: v.q || null, bytes, detail, close, whole,
    src: './img/' + path.basename(file) });
  console.log(v.name.padEnd(16), (m.width + ' x ' + m.height).padEnd(12), (bytes / 1024).toFixed(0).padStart(4) + ' KB',
    ' detail ' + (detail * 100).toFixed(1) + '%', ' ' + Object.entries(close).map(([k, s]) => k + ' ' + (s * 100).toFixed(1)).join(', '), ' whole ' + (whole * 100).toFixed(1) + '%');
}
const js = '// versions.js: written by make-versions.mjs (run it again rather than editing this). The example painting\'s\n' +
  '// versions, measured: px (width, height), bytes, detail (SSIM averaged over the four close-ups), close (each close-up),\n' +
  '// whole (the whole painting). Defines window.SQUEEZE.\n' +
  'window.SQUEEZE = {\n  "painting": ' + JSON.stringify([W, H]) + ',\n  "patches": ' + JSON.stringify(PATCHES) + ',\n  "versions": [\n' +
  out.map((v) => '    ' + JSON.stringify(v)).join(',\n') + '\n  ]\n};\n';
fs.writeFileSync(path.join(HERE, 'versions.js'), js);
console.log('wrote versions.js');
