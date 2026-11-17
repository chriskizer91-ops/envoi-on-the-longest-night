// make-web-copies.mjs: the copies of Chris's made textures that the game's pages carry (the reskin job, November 17, 2026).
// The originals in ../made/ stay exactly as Chris made them (PNG, about 2.5 MB each). A page that carried them as they are
// would be over 100 MB a zone, so each gets a copy here at its FULL size (no shrinking: the laptop is the main screen) in
// WebP at quality 95, about a quarter of the weight, with nothing the eye can tell apart.
// Every copy keeps its card's file name (shared_cobbles_town.png -> shared_cobbles_town.webp) and has a row in
// ../made-web/index.csv that points back to its original's row in ../made/index.csv.
// Usage: node moon-faire-witches/texture-packs/tools/make-web-copies.mjs   (again whenever made/ gains or changes a picture)
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let sharp; try { sharp = require('sharp'); } catch (e) { try { sharp = require(path.resolve(new URL('../../../tools/node_modules/sharp', import.meta.url).pathname)); } catch (e2) { sharp = require('/opt/npm-tools/node_modules/sharp'); } }
const D = path.resolve(new URL('..', import.meta.url).pathname), MADE = path.join(D, 'made'), OUT = path.join(D, 'made-web');
const Q = 95;
fs.mkdirSync(OUT, { recursive: true });
// the originals' rows, for each copy's label
const rows = fs.readFileSync(path.join(MADE, 'index.csv'), 'utf8').trim().split('\n').slice(1);
const label = {}; for (const r of rows) { const m = r.match(/^([^,]+),("[^"]*"|[^,]*),/); if (m) label[m[1]] = m[2].replace(/^"|"$/g, ''); }
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const out = ['file,label,made_from,width,height,bytes,original_bytes,webp_quality,original_sha256'];
let a = 0, b = 0, n = 0;
for (const f of fs.readdirSync(MADE).filter((x) => x.endsWith('.png')).sort()) {
  const src = path.join(MADE, f), dst = path.join(OUT, f.replace(/\.png$/, '.webp'));
  const meta = await sharp(src).metadata();
  if (!fs.existsSync(dst) || fs.statSync(dst).mtimeMs < fs.statSync(src).mtimeMs) await sharp(src).webp({ quality: Q, effort: 5, smartSubsample: true }).toFile(dst);
  const s0 = fs.statSync(src).size, s1 = fs.statSync(dst).size; a += s0; b += s1; n++;
  out.push([path.basename(dst), '"' + (label[f] || '') + '"', 'made/' + f, meta.width, meta.height, s1, s0, Q, sha(src)].join(','));
}
fs.writeFileSync(path.join(OUT, 'index.csv'), out.join('\n') + '\n');
console.log(n + ' copies: ' + (a / 1e6).toFixed(0) + ' MB of originals -> ' + (b / 1e6).toFixed(0) + ' MB, full size, WebP quality ' + Q);
