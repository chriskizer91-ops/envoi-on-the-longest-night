// make-buildings.mjs: reads the buildings of every walking place from the 3D world (moon-faire-witches/world3d/places/,
// the world-3d job's, read only): each one's footprint, its wall storeys and what they are made of, its roof (which way
// the ridge runs, how high, a lean-to or not), its chimneys, its belfry and its windows; and which textures that place
// uses for stone, timber, planks and roofs. Writes:
//   map/buildings.js                      the buildings, place by place, for the 3D map to stand in their true arrangement
//   art/aethermoor-building-layers.webp   the wall and roof textures they wear (Chris's made ones from texture-packs/made/;
//                                         a stand-in wherever one isn't made yet), 256 x 256 squares, four to a row,
//                                         in the order printed (art/LABELS.md lists them)
// Usage: node moon-faire-witches/world-map/tools/make-buildings.mjs [--ref <git ref to read the places from>] [--made <folder>]
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { execSync } from 'child_process';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const R = path.resolve(new URL('../../..', import.meta.url).pathname);
const sharp = require(path.join(R, 'tools/node_modules/sharp'));
const arg = (k) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : null; };
const ref = arg('--ref'), MADE = arg('--made') ? path.resolve(arg('--made')) : path.join(R, 'moon-faire-witches/texture-packs/made');
const DIR = 'moon-faire-witches/world3d/places';
const IDS = ['wickhollow', 'cottage', 'bogmire', 'bogmire-heart', 'dawnroost', 'misthollow', 'moonwell', 'shipyard', 'frostmere-shore'];
const read = (id) => (ref ? execSync(`git -C "${R}" show ${ref}:${DIR}/${id}.js`, { maxBuffer: 1 << 28 }).toString() : fs.readFileSync(path.join(R, DIR, id + '.js'), 'utf8'));
const sha = ref ? execSync(`git -C "${R}" rev-parse --short ${ref}`).toString().trim() : 'the working copy';
// the 3D world's own choice of texture for each kind of surface, unless a place says otherwise (engine/world.js, SURF)
const SURF = { stone: 'shared_stone_wall_rough', dry: 'shared_drystone', timber: 'wick_wall_timber_plaster', planks: 'shared_boardwalk_planks', roof: 'shared_roof_tiles_red', cloth: 'shared_awning_stripes' };
// textures the map's other towns and the castle wear (the towns no walking place covers), always packed
const ALWAYS = ['shared_stone_wall_rough', 'wick_wall_timber_plaster', 'shared_roof_tiles_red', 'shared_roof_thatch', 'shared_planks_wall', 'shared_roof_shingle', 'shared_wall_castle', 'misthollow_roof_blue_slate', 'shared_stone_wall_frosted', 'shared_roof_slate_snow'];
const layers = ALWAYS.slice(), layerOf = (id) => { let i = layers.indexOf(id); if (i < 0) { i = layers.length; layers.push(id); } return i; };
const G = {}; G.window = G; G.console = console;
const places = {}, stand = {};
for (const id of IDS) {
  vm.runInNewContext(read(id), G, { filename: id + '.js' });
  const p = G.W3D_PLACES[id], surf = Object.assign({}, SURF, p.surfaces || {}), r2 = (v) => Math.round(v * 100) / 100;
  for (const t of p.textures || []) stand[t.id] = path.join(R, 'moon-faire-witches/world3d', t.stand);
  places[id] = (p.buildings || []).map((b) => {
    const roof = b.roof || { ridge: 'ns', rise: 2, over: 0.3 };
    const o = { fp: b.fp, walls: b.walls.map((w) => [layerOf(surf[w.t]), r2(w.h)]), roof: [layerOf(surf[roof.mat || 'roof']), roof.ridge === 'ew' ? 1 : 0, r2(roof.rise), r2(roof.over || 0), roof.lean || ''] };
    if (b.chimneys) o.chim = b.chimneys.map((c) => [c.x, c.y, c.w, c.d, c.h]);
    if (b.belfry) o.belfry = 1;
    if (b.floor != null) o.floor = r2(b.floor);
    // its windows: [side, the place along that side in the painting's pixels, how high in metres]
    const win = (b.windows || []).filter((w) => !w.dark).map((w) => [w.side, w.side === 's' || w.side === 'n' ? w.x : w.y, r2((w.side === 's' || w.side === 'n' ? w.y : w.z) + w.h / 2)]);
    if (win.length) o.win = win;
    return o;
  });
  console.log(id.padEnd(16) + String(places[id].length).padStart(3) + ' buildings · walls of ' + [...new Set((p.buildings || []).flatMap((b) => b.walls.map((w) => surf[w.t])))].join(', ') + ' · roofs of ' + [...new Set((p.buildings || []).map((b) => surf[(b.roof || {}).mat || 'roof']))].join(', '));
}
// the textures, packed; each one's average colour kept too (for a phone that can't hold the textures)
const T = 256, tiles = [], info = [];
for (const [i, id] of layers.entries()) {
  const made = path.join(MADE, id + '.png'), file = fs.existsSync(made) ? made : stand[id];
  if (!file || !fs.existsSync(file)) throw new Error('no texture for ' + id);
  const buf = fs.readFileSync(file), st = await sharp(buf).removeAlpha().stats();
  tiles.push({ input: await sharp(buf).resize(T, T, { kernel: 'lanczos3' }).removeAlpha().toBuffer(), left: (i % 4) * T, top: Math.floor(i / 4) * T });
  info.push({ id, made: file === made, avg: st.channels.slice(0, 3).map((c) => Math.round(c.mean) / 255) });
  console.log(String(i).padStart(2) + ' ' + id.padEnd(28) + (file === made ? 'made' : 'STAND-IN'));
}
const out = path.join(R, 'moon-faire-witches/world-map/art/aethermoor-building-layers.webp');
await sharp({ create: { width: 4 * T, height: Math.ceil(layers.length / 4) * T, channels: 3, background: '#000' } }).composite(tiles).webp({ quality: 84, effort: 5 }).toFile(out);
const js = `// buildings.js: the buildings of every walking place that has any, read from the 3D world's places (${DIR}/, at ${sha})
// by tools/make-buildings.mjs. Not written by hand: run the tool again when the places change.
// layers: the wall and roof textures, in the order they are packed in art/aethermoor-building-layers.webp (avg: each one's
// average colour). places: for each place, its buildings: fp (the footprint in its painting's pixels: x0, y0, x1, y1),
// walls (each storey: [texture layer, height in metres], from the ground up), roof ([texture layer, 1 if the ridge runs
// east-west, its rise in metres, its overhang, and the side a lean-to is high on or '']), chim (chimneys: x, y in pixels;
// width, depth, height in metres), belfry, floor (a raised floor's height), win (windows: side, place along it, height).
// A painting's pixel is 0.04 m across and 0.05 m down, from its middle (768, 512).
window.MAP_BUILDINGS = ${JSON.stringify({ layers: info.map((l) => ({ id: l.id, avg: l.avg.map((v) => Math.round(v * 1000) / 1000) })), places })};
`;
fs.writeFileSync(path.join(R, 'moon-faire-witches/world-map/map/buildings.js'), js);
console.log('map/buildings.js: ' + Object.values(places).reduce((a, b) => a + b.length, 0) + ' buildings in ' + IDS.length + ' places (from ' + sha + ') · aethermoor-building-layers.webp ' + (fs.statSync(out).size / 1024).toFixed(0) + ' KB, ' + info.filter((l) => l.made).length + ' of ' + info.length + ' made by Chris');
