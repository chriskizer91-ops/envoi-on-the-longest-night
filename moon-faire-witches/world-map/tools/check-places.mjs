// check-places.mjs: every walking place and landing on the 3D map stands on land (art/land.png, read off the day atlas)
// and in its own zone (World.BANDS); prints each place's height and its neighbours on foot with the way they lie.
// Usage: node moon-faire-witches/world-map/tools/check-places.mjs
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const R = path.resolve(new URL('../../..', import.meta.url).pathname);
const sharp = require(path.join(R, 'tools/node_modules/sharp'));
const win = {};
vm.runInNewContext(fs.readFileSync(path.join(R, 'src/game/world.js'), 'utf8'), { window: win });
vm.runInNewContext(fs.readFileSync(path.join(R, 'moon-faire-witches/world-map/map/places.js'), 'utf8'), { window: win });
const mctx = { window: win, console }; vm.runInNewContext(fs.readFileSync(path.join(R, 'src/game/maps.js'), 'utf8'), mctx);
const { World, MapPlaces: M } = win, MAPS = mctx.MAPS || win.MAPS;
const art = path.join(R, 'moon-faire-witches/world-map/art');
const land = await sharp(path.join(art, 'land.png')).raw().toBuffer({ resolveWithObject: true });
const hgt = await sharp(path.join(art, 'height.png')).raw().toBuffer({ resolveWithObject: true });
const at = (img, x, y, ch) => { const W = img.info.width, c = img.info.channels; const i = (Math.round(y / 8) * W + Math.round(x / 8)) * c; return ch.map((k) => img.data[i + k]); };
const onLand = (x, y) => at(land, x, y, [0])[0] > 127;
const heightAt = (x, y) => { const [r, g] = at(hgt, x, y, [0, 1]); return (r * 256 + g) / 10 - 100; };
let bad = 0;
const way = (dx, dy) => { const a = Math.atan2(-dy, dx) * 180 / Math.PI; return ['east', 'north-east', 'north', 'north-west', 'west', 'south-west', 'south', 'south-east'][((Math.round(a / 45) % 8) + 8) % 8]; };
for (const [id, p] of Object.entries(M.PLACES)) {
  const [x, y] = p.at, band = World.bandAt(x, y), ok = onLand(x, y) && band === p.zone;
  if (!ok) bad++;
  const exits = ((MAPS && MAPS[id] && MAPS[id].exits) || []).filter((e) => e.to !== 'world' && M.PLACES[e.to]).map((e) => {
    const [ex, ey] = [(e.rect[0] + e.rect[2]) / 2, (e.rect[1] + e.rect[3]) / 2], painted = way(ex - 768, ey - 512);
    const q = M.PLACES[e.to].at, onMap = way(q[0] - x, q[1] - y);
    return e.to + ' (' + painted + (painted === onMap ? '' : ', on the map ' + onMap) + ')';
  });
  console.log((ok ? 'ok  ' : 'BAD ') + id.padEnd(16) + ' zone ' + p.zone + (band === p.zone ? '' : ' (the atlas says ' + band + ')') + (onLand(x, y) ? '' : ' IN WATER') + ' · ' + Math.round(heightAt(x, y) * 10) + ' m · exits: ' + exits.join(', '));
}
for (const [id, l] of Object.entries(M.LANDINGS)) {
  const [x, y] = l.sky, band = World.bandAt(x, y);
  if (band !== l.zone) { bad++; console.log('BAD landing ' + id + ' zone ' + l.zone + ', the atlas says ' + band); }
}
console.log(bad ? bad + ' wrong' : 'all ' + Object.keys(M.PLACES).length + ' places on land in their own zones; all ' + Object.keys(M.LANDINGS).length + ' landings in their zones');
process.exit(bad ? 1 : 0);
