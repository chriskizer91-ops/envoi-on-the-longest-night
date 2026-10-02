// Compresses Chris's images into the game's WebP copies, so pages stay light on a phone. Keep the originals in
// reference/ and compress from them again whenever the size or quality needs to change.
// Usage: node tools/compress.mjs <image ...> --out <dir> [--q 84] [--width 1448] [--name <new-name>]
// Needs sharp: npm install --prefix tools
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(new URL('./package.json', import.meta.url));
const sharp = require('sharp');
const args = process.argv.slice(2);
let out = '.', q = 84, width = 0, name = '';
const files = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--out') out = args[++i];
  else if (args[i] === '--q') q = +args[++i];
  else if (args[i] === '--width') width = +args[++i];
  else if (args[i] === '--name') name = args[++i];
  else files.push(args[i]);
}
fs.mkdirSync(out, { recursive: true });
let total = 0;
for (const f of files) {
  let img = sharp(f);
  const meta = await img.metadata();
  if (width && meta.width > width) img = img.resize({ width, kernel: 'lanczos3' });
  const dest = path.join(out, (name && files.length === 1 ? name : path.basename(f).replace(/\.[^.]+$/, '')) + '.webp');
  const info = await img.webp({ quality: q, effort: 6, smartSubsample: true }).toFile(dest);
  total += info.size;
  console.log(dest, info.width + 'x' + info.height, (info.size / 1024).toFixed(0) + ' KB');
}
if (files.length > 1) console.log('total', (total / 1048576).toFixed(2) + ' MB');
