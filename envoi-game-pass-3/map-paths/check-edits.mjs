// check-edits.mjs: checks walking-path edits from the map paths page (envoi-game-pass-3/map-paths) before they go into
// the game. It reads the file the page downloads or copies ("Download my edits", "Copy my edits"), one map's document
// from the page's store (edits/<map id>, as read back, or its `data`), or a list of any of these. For each map, with the
// page's own rules (edits-core.js):
//   - every walk area, block and front is a closed shape: three or more different points round some ground, every
//     point inside the painting's 1536 x 1024 (a repeated closing point or a shape crossing itself is a warning)
//   - the exits, people and spots are maps.js's own, in its order, and inside the painting
//   - each arrival leads to this map in maps.js (another map's exit) or game.js (the Magpie); one from the world map
//     (in edits made before the wilderness scenes, since when nobody walks it) is left out with a note
//   - the edits were made on the game's tracing as it is now (or it says what changed since)
//   - with the edits applied, Io can still reach every exit, person, spot and arrival (tools/check-maps.mjs's rule),
//     and no walk area is cut off from the rest; only problems the game's tracing doesn't already have count
// It also checks that the page's copy of game.js's Magpie arrivals (edits-core.js) still matches game.js.
// Usage: node envoi-game-pass-3/map-paths/check-edits.mjs <edits.json> [more.json ...]
// Exits 1 when a map's edits can't go into the game as they are (an error, something she could reach before and can't
// now, or 12 or more of the field's 12 px cells of walk area newly cut off: ground meant to go can still be applied,
// after a look), 0 when every map's edits are safe to apply.
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const HERE = path.dirname(new URL(import.meta.url).pathname), R = path.resolve(HERE, '../..');
require(path.join(R, 'src/game/maps.js'));
require(path.join(HERE, 'edits-core.js'));
globalThis.window = globalThis; require(path.join(R, 'src/game/game.js'));
// (game.js has no world-map places since the wilderness scenes: nothing comes onto a map from the world map now)
const MAPS = globalThis.MAPS, E = globalThis.MapEdits, GAME = { PLACES: globalThis.Game.PLACES || {}, LANDINGS: globalThis.Game.LANDINGS || {} };

const files = process.argv.slice(2);
if (!files.length) { console.log('Usage: node envoi-game-pass-3/map-paths/check-edits.mjs <edits.json> [more.json ...]'); process.exit(2); }

// the page's copy of game.js's arrivals
const drift = [];
for (const [k, p] of Object.entries(GAME.PLACES)) if (p.map) { const c = E.WORLD_IN[k]; if (!c || c[0] !== p.map || JSON.stringify(c[1]) !== JSON.stringify(p.arrive)) drift.push('the world map’s ' + k); }
for (const k of Object.keys(E.WORLD_IN)) if (!GAME.PLACES[k] || !GAME.PLACES[k].map) drift.push('the world map’s ' + k + ' (gone from game.js)');
for (const [k, L] of Object.entries(GAME.LANDINGS)) if (L.field) { const c = E.MAGPIE_IN[k]; if (!c || c[0] !== L.field[0] || JSON.stringify(c[1]) !== JSON.stringify(L.field[1])) drift.push('the Magpie’s ' + k); }
for (const k of Object.keys(E.MAGPIE_IN)) if (!GAME.LANDINGS[k] || !GAME.LANDINGS[k].field) drift.push('the Magpie’s ' + k + ' (gone from game.js)');
if (drift.length) console.log('! the page’s copy of game.js’s arrivals is out of date for ' + drift.join(', ') + ': update WORLD_IN and MAGPIE_IN in edits-core.js');

// every map document in a file: the page's download ({ maps: { id: doc } }), one document, a store read ({ data }),
// or a list of these
function docsOf(v, where) {
  if (Array.isArray(v)) return v.flatMap((x, i) => docsOf(x, where + '[' + i + ']'));
  if (v && typeof v === 'object') {
    if (v.maps && typeof v.maps === 'object' && !Array.isArray(v.maps)) return Object.entries(v.maps).map(([k, d]) => ({ d, where, key: k }));
    if (v.data && typeof v.data === 'object' && v.data.map) return [{ d: v.data, where }];
    if (v.map) return [{ d: v, where }];
  }
  return [{ d: v, where, notDoc: true }];
}

let failed = 0, maps = 0, unread = 0;
for (const f of files) {
  let data;
  try { data = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { console.log('✗ ' + f + ': can’t read it as JSON (' + e.message + ')'); unread++; continue; }
  const docs = docsOf(data, path.basename(f));
  if (!docs.length) console.log('· ' + f + ': no maps in it');
  for (const { d, where, key, notDoc } of docs) {
    maps++;
    if (notDoc) { console.log('✗ ' + where + ': this isn’t a map’s edits'); failed++; continue; }
    const { errors, warnings: all } = E.validate(MAPS, d, GAME);
    // what the game's tracing has already (Wickhollow's well ring repeats its first point) isn't news
    const known = MAPS[d.map] ? E.validate(MAPS, E.body(MAPS, {}, d.map), GAME).warnings : [];
    const warnings = all.filter((x) => !known.includes(x));
    if (key && d.map !== key) errors.push('it is filed under ' + key + ' but says it is ' + d.map);
    const name = MAPS[d.map] ? MAPS[d.map].name : String(d.map);
    let reachLine = '', fresh = [], lessGround = '';
    if (!errors.length) {
      const before = E.reach(MAPS, d.map, E.traced(MAPS, d.map)), after = E.reach(MAPS, d.map, E.applied(MAPS, d));
      fresh = after.problems.filter((p) => !before.problems.some((q) => q.text === p.text));
      const old = after.problems.filter((p) => before.problems.some((q) => q.text === p.text));
      reachLine = after.reached + ' cells she can reach (' + before.reached + ' as traced)';
      for (const p of old) warnings.push('as in the game’s tracing: ' + p.text);
      // walk area she can stand on but can't get to, beyond what the tracing already has (a block's footprint isn't)
      const cut = (after.open - after.reached) - (before.open - before.reached);
      if (cut >= 12) lessGround = cut + ' cells (12 px squares) of walk area are cut off from the rest, which the game’s tracing doesn’t have (orange on the page’s “Where Io can reach”); if that ground was meant to go, the edits can still be applied';
      else if (cut > 3) warnings.push(cut + ' cells (12 px squares) of walk area are cut off from the rest, which the game’s tracing doesn’t have');
    }
    const bad = errors.length || fresh.length || lessGround;
    if (bad) failed++;
    const shapes = d.shapes ? ['walk', 'block', 'front'].map((k) => { const s = d.shapes[k]; if (!s) return ''; const n = s.fromTracing.filter((x) => x == null).length; return n || s.dropped.length ? k + ': ' + n + ' new or changed, ' + s.dropped.length + ' of the tracing’s gone' : ''; }).filter(Boolean).join('; ') : '';
    console.log((bad ? '✗ ' : '✓ ') + d.map + ' (' + name + ', from ' + where + ')' + (Array.isArray(d.changed) ? ': ' + (d.changed.length ? 'changed ' + d.changed.join(', ') : 'no changes') : '') + (reachLine ? ' · ' + reachLine : ''));
    if (shapes) console.log('    ' + shapes);
    for (const s of errors) console.log('    error: ' + s);
    for (const p of fresh) console.log('    can’t reach now: ' + p.text + ' (near ' + p.at.join(', ') + ')');
    if (lessGround) console.log('    cut off: ' + lessGround);
    for (const s of warnings) console.log('    note: ' + s);
  }
}
if (unread) console.log(unread + (unread === 1 ? ' file' : ' files') + ' couldn’t be read.');
if (maps) console.log(failed ? failed + ' of ' + maps + ' maps need a look before their edits go into the game.' : (maps === 1 ? 'The map’s edits are' : 'All ' + maps + ' maps’ edits are') + ' safe to apply.');
process.exitCode = failed || unread ? 1 : 0;
