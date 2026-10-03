// Compresses Chris's images into the game's WebP copies, so pages stay light on a phone. Keep the originals in
// reference/ and compress from them again whenever the size or quality needs to change.
// Usage: node tools/compress.mjs <image ...> --out <dir> [--q 84] [--width 1448] [--name <new-name>] [--avif]
//   --avif writes AVIF instead of WebP (its quality runs lower for the same look: 45 is about WebP's 80)
// Needs sharp: npm install --prefix tools
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(new URL('./package.json', import.meta.url));
const sharp = require('sharp');
const args = process.argv.slice(2);
let out = '.', q = 84, width = 0, name = '', avif = false;
const files = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--out') out = args[++i];
  else if (args[i] === '--q') q = +args[++i];
  else if (args[i] === '--width') width = +args[++i];
  else if (args[i] === '--name') name = args[++i];
  else if (args[i] === '--avif') avif = true;
  else files.push(args[i]);
}
fs.mkdirSync(out, { recursive: true });
let total = 0;
// Chris's PNGs can carry a content-credentials block (C2PA) that sharp won't read: keep only the chunks an image needs
function plainPng(buf) {
  if (buf.toString('ascii', 1, 4) !== 'PNG') return buf;
  const keep = new Set(['IHDR', 'PLTE', 'tRNS', 'IDAT', 'IEND', 'gAMA', 'sRGB', 'cHRM', 'iCCP']), parts = [buf.subarray(0, 8)];
  for (let o = 8; o + 12 <= buf.length;) { const len = buf.readUInt32BE(o), type = buf.toString('ascii', o + 4, o + 8); if (keep.has(type)) parts.push(buf.subarray(o, o + 12 + len)); o += 12 + len; }
  return Buffer.concat(parts);
}
for (const f of files) {
  let img = sharp(plainPng(fs.readFileSync(f)));
  const meta = await img.metadata();
  if (width && meta.width > width) img = img.resize({ width, kernel: 'lanczos3' });
  const dest = path.join(out, (name && files.length === 1 ? name : path.basename(f).replace(/\.[^.]+$/, '')) + (avif ? '.avif' : '.webp'));
  const info = await (avif ? img.avif({ quality: q, effort: 6 }) : img.webp({ quality: q, effort: 6, smartSubsample: true })).toFile(dest);
  total += info.size;
  console.log(dest, info.width + 'x' + info.height, (info.size / 1024).toFixed(0) + ' KB');
}
if (files.length > 1) console.log('total', (total / 1048576).toFixed(2) + ' MB');
