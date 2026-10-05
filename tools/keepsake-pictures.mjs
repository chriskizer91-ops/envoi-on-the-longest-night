// keepsake-pictures.mjs: the twenty keepsakes' small pictures for the game, made from Chris's art packs (art request
// 14, October 4, 2026, evening). His packs stay as they came in reference/art/keepsakes/ (each item a 1254 x 1254
// transparent PNG, numbered 01 to 20 in the order of envoi-final-draft/items/items.js); this writes
// art/keepsakes/<keepsake id>.png, a tiny PNG of each (Chris: "we make tiny pngs of them"), 256 pixels square with
// its transparency, in 256 colours, about 28 KB each. Run it again whenever the size needs to change.
// Usage: node tools/keepsake-pictures.mjs [--size 256] [--out art/keepsakes]
// Needs sharp: npm install --prefix tools
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(new URL('./package.json', import.meta.url));
const sharp = require('sharp');
const R = path.resolve(new URL('..', import.meta.url).pathname);
const args = process.argv.slice(2);
let size = 256, out = path.join(R, 'art/keepsakes');
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--size') size = +args[++i];
  else if (args[i] === '--out') out = path.resolve(args[++i]);
}
// the keepsakes in their order (window.LOOT), read from the locked list
globalThis.window = globalThis;
require(path.join(R, 'envoi-final-draft/items/items.js'));
const ITEMS = globalThis.LOOT.ITEMS;
// Chris's PNGs can carry a content-credentials block (C2PA) that sharp won't read: keep only the chunks an image needs
function plainPng(buf) {
  if (buf.toString('ascii', 1, 4) !== 'PNG') return buf;
  const keep = new Set(['IHDR', 'PLTE', 'tRNS', 'IDAT', 'IEND', 'gAMA', 'sRGB', 'cHRM', 'iCCP']), parts = [buf.subarray(0, 8)];
  for (let o = 8; o + 12 <= buf.length;) { const len = buf.readUInt32BE(o), type = buf.toString('ascii', o + 4, o + 8); if (keep.has(type)) parts.push(buf.subarray(o, o + 12 + len)); o += 12 + len; }
  return Buffer.concat(parts);
}
const packs = path.join(R, 'reference/art/keepsakes');
const found = {};
for (const p of fs.readdirSync(packs)) {
  const dir = path.join(packs, p, 'items');
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir)) { const m = /^(\d\d)-.*\.png$/.exec(f); if (m) found[+m[1]] = path.join(dir, f); }
}
fs.mkdirSync(out, { recursive: true });
let total = 0;
for (let n = 1; n <= ITEMS.length; n++) {
  const it = ITEMS[n - 1], f = found[n];
  if (!f) { console.log('missing: ' + String(n).padStart(2, '0') + ' ' + it.name); continue; }
  const dest = path.join(out, it.id + '.png');
  const info = await sharp(plainPng(fs.readFileSync(f)))
    .resize({ width: size, height: size, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: 'lanczos3' })
    .png({ palette: true, quality: 90, effort: 10, compressionLevel: 9 }).toFile(dest);
  total += info.size;
  console.log(path.relative(R, dest).padEnd(42), path.basename(f).padEnd(34), (info.size / 1024).toFixed(1) + ' KB');
}
console.log('total', (total / 1024).toFixed(0) + ' KB');
