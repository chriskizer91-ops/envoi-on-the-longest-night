// make-ground-layers.mjs: packs the world-map ground textures Chris made (texture-packs/made/, the "aethermoor" cards
// of round 2, and eight of the walking places' own ground cards; a stand-in from texture-packs/world/aethermoor/stand-in/
// wherever a world-map one isn't made yet) into one picture the
// 3D map reads: art/aethermoor-ground-layers.webp, 2048 wide, 512 x 512 squares four to a row, left to right, top to bottom,
// in the order of LAYERS below (art/LABELS.md lists them). Each texture repeats, so the land stays sharp at any zoom.
// Usage: node moon-faire-witches/world-map/tools/make-ground-layers.mjs [--made <folder of the made textures>]
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const R = path.resolve(new URL('../../..', import.meta.url).pathname);
const sharp = require(path.join(R, 'tools/node_modules/sharp'));
// (four are the ones Chris made for this map on November 17, to be seen from high up: the open sea, the shallows,
// the mountains' layered rock, and scree with snow; they took the places of deep_sea, shallow_sea, bare_rock and
// snowy_mountainside. They are kept in art/world-map-round-1/, and read from there if not in the made folder)
export const LAYERS = ['pine_forest', 'broadleaf_forest', 'grassland', 'farmland', 'willow_marsh', 'beach_sand', 'desert_ground', 'sandstone_mesa',
  'aethermoor_mountain_rock', 'coastal_cliff', 'snowfield', 'aethermoor_mountain_scree_snow', 'river_water', 'aethermoor_sea_shallows', 'aethermoor_sea_from_high', 'mountain_lake',
  // the zones' own ground, from their walking places' cards: zone 2's flowered grass; zone 3's frosted heather, frosted
  // firs and bracken; zone 4's frost meadow, snow-laden firs, frosted undergrowth and frost moor
  'dawn_grass_flowers', 'moor_heather_frost', 'frostmere_frost_meadow', 'fir_foliage_frosted', 'fir_foliage_snowladen', 'moor_bracken_heather', 'frosted_undergrowth', 'crossroads_frost_moor',
  // zone 4's frozen rivers and lakes
  'shared_lake_ice',
  // drifts of meadow and of clover in zone 1's open grass
  'shared_grass_meadow', 'riverglade_clover_grass'];
const mi = process.argv.indexOf('--made');
const MADE = mi >= 0 ? path.resolve(process.argv[mi + 1]) : path.join(R, 'moon-faire-witches/texture-packs/made');
const STAND = path.join(R, 'moon-faire-witches/texture-packs/world/aethermoor/stand-in');
const T = 512, tiles = [], rows = [];
for (const [i, name] of LAYERS.entries()) {
  const here = path.join(R, 'moon-faire-witches/world-map/art/world-map-round-1', name + '.png');
  const made = fs.existsSync(path.join(MADE, name + '.png')) ? path.join(MADE, name + '.png') : here, file = fs.existsSync(made) ? made : path.join(STAND, name + '.png');
  const buf = fs.readFileSync(file), st = await sharp(buf).stats();
  tiles.push({ input: await sharp(buf).resize(T, T, { kernel: 'lanczos3' }).removeAlpha().toBuffer(), left: (i % 4) * T, top: Math.floor(i / 4) * T });
  rows.push({ i, name, made: file === made, sha: crypto.createHash('sha256').update(buf).digest('hex').slice(0, 12), mean: st.channels.slice(0, 3).map((c) => Math.round(c.mean)) });
  console.log(String(i).padStart(2) + ' ' + name.padEnd(20) + (file === made ? 'made    ' : 'STAND-IN') + ' ' + rows[i].sha + '  average colour ' + rows[i].mean.join(', '));
}
const out = path.join(R, 'moon-faire-witches/world-map/art/aethermoor-ground-layers.webp');
await sharp({ create: { width: 4 * T, height: Math.ceil(LAYERS.length / 4) * T, channels: 3, background: '#000' } }).composite(tiles).webp({ quality: 84, effort: 5 }).toFile(out);
console.log('aethermoor-ground-layers.webp ' + (fs.statSync(out).size / 1024).toFixed(0) + ' KB · ' + rows.filter((r) => r.made).length + ' of ' + rows.length + ' made by Chris');
