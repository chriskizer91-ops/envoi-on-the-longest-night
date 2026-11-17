// bring-in-short-list.mjs: Chris's short-list pictures (November 17, 2026; docs/art-requests/15-3d-world-textures-short-list.md)
// into texture-packs/made/, labeled as rounds one and two are:
//  - each picture under its card's file name, checked against its zip's own image-index.csv (checksum and size); one made
//    again, in made/revised/ under the same name, beside the one it replaces;
//  - a row in made/index-short-list.csv (the same columns as made/index.csv: file, label, kind, round, zip, card, place,
//    width, height, sha256, note). A file of its own, because made/index.csv belongs to the textures-made job;
//  - each zip's prompts.json kept whole as made/prompts/<zip>.json.
// Usage: node moon-faire-witches/texture-packs/tools/bring-in-short-list.mjs <folder with one folder per unzipped zip>
//        (each folder named as its zip, e.g. Envoi-Shortlist-A-Walls). Then make-web-copies.mjs.
import fs from 'fs'; import path from 'path'; import crypto from 'crypto'; import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let sharp; try { sharp = require('sharp'); } catch (e) { sharp = require('/opt/npm-tools/node_modules/sharp'); }
const D = path.resolve(new URL('..', import.meta.url).pathname), MADE = path.join(D, 'made'), src = path.resolve(process.argv[2]);
const KIND = { A: 'Material', B: 'Flat view', C: 'Material', D: 'Plant', E: 'Ground' };
const KIND_OF = { 'shared_crate_side.png': 'Flat face', 'shared_market_produce.png': 'Flat face' };
const USED = { A: 'house walls', B: 'doors and windows', C: 'wood and things made of it', D: 'trees and bushes', E: 'made again' };
const shape = (w, h) => (w === h ? 'square' : w > h ? 'wide (3:2)' : 'tall (2:3)');
const csv = (s) => (/[",]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s);
const idx = path.join(MADE, 'index-short-list.csv');
const have = new Map();
if (fs.existsSync(idx)) for (const r of fs.readFileSync(idx, 'utf8').trim().split('\n').slice(1)) have.set(r.split(',')[0], r);
fs.mkdirSync(path.join(MADE, 'prompts'), { recursive: true });
let n = 0, bad = 0;
for (const zip of fs.readdirSync(src).sort()) {
  const dir = path.join(src, zip), ii = path.join(dir, 'image-index.csv'); if (!fs.existsSync(ii)) continue;
  for (const r of fs.readFileSync(ii, 'utf8').trim().split('\n').slice(1)) {
    const m = r.match(/^(\d+),([^,]+),("[^"]*"|[^,]*),([^,]*),(\d+),(\d+),([0-9a-f]+)/); if (!m) continue;
    const [, , file, label0, group, w, h, sha] = m, label = label0.replace(/^"|"$/g, ''), f = path.join(dir, file);
    const buf = fs.readFileSync(f), meta = await sharp(buf).metadata();
    if (crypto.createHash('sha256').update(buf).digest('hex') !== sha || meta.width !== +w || meta.height !== +h) { console.log('NOT AS ITS INDEX SAYS:', zip, file); bad++; continue; }
    // a picture made again (group E) doesn't overwrite the one it replaces: it goes in made/revised/ under the same file
    // name, and the game's copy is made from it (make-web-copies.mjs). Both stay, both labeled.
    const again = fs.existsSync(path.join(MADE, file)) && !have.has(file) || (have.get(file) || '').includes('made/revised/');
    if (again) { fs.mkdirSync(path.join(MADE, 'revised'), { recursive: true }); fs.writeFileSync(path.join(MADE, 'revised', file), buf); }
    else fs.writeFileSync(path.join(MADE, file), buf);
    have.set(file, [file, csv(label), csv((KIND_OF[file] || KIND[group] || 'Material') + ', ' + shape(+w, +h)), 'short list', zip, csv(label), '', w, h, sha, csv('short list group ' + group + ': ' + (USED[group] || '') + (again ? '; kept as made/revised/' + file + ', in place of made/' + file + ' (round two), which stays as it was' : ''))].join(','));
    n++;
  }
  if (fs.existsSync(path.join(dir, 'prompts.json'))) fs.copyFileSync(path.join(dir, 'prompts.json'), path.join(MADE, 'prompts', zip + '.json'));
}
fs.writeFileSync(idx, 'file,label,kind,round,zip,card,place,width,height,sha256,note\n' + [...have.values()].join('\n') + '\n');
console.log(n + ' pictures brought in, ' + bad + ' refused; ' + have.size + ' rows in made/index-short-list.csv');
