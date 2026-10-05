// apply-edits-shapes.mjs: apply-edits.mjs writes what check-edits.mjs has just passed as safe, in every shape of file the
// two read, and says so plainly when it can't (T17, tools 1).
// One map's edits (Wickhollow: a point of its first walk area 4 px lower) in the four shapes Claude gets them in: one
// store row ({ data }), a list of store rows, the map editor's "Copy my work" ({ game, version: 2, maps, keepsakes })
// and a bare document. For each, check-edits.mjs passes it, and apply-edits.mjs, run in a scratch copy of the files it
// needs (never the game's own maps.js), writes the moved point, changes nothing else, and exits 0. The export also
// carries a keepsake Chris moved: apply-edits must name it and say it goes into items.js by hand. A list of keepsake rows
// (the `places` collection) must say the same and leave maps.js alone, and a file with no map's edits in it must exit 1.
// Usage, from the repository's top folder: node final-pass-polish-october-5-2026/checks/tools/apply-edits-shapes.mjs
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createRequire } from 'module';
import { spawnSync } from 'child_process';
const require = createRequire(import.meta.url);
const R = process.cwd();
require(path.join(R, 'src/game/maps.js'));
require(path.join(R, 'envoi-game-pass-3/map-paths/edits-core.js'));
globalThis.window = globalThis; require(path.join(R, 'envoi-final-draft/items/items.js'));
const MAPS = globalThis.MAPS, E = globalThis.MapEdits, ITEMS = globalThis.LOOT.ITEMS;

// the edit, made as the page makes it (MapEdits.body)
const w = E.traced(MAPS, 'wickhollow'), moved = [w.walk[0][1][0], w.walk[0][1][1] + 4];
w.walk[0][1] = moved.slice();
const doc = E.body(MAPS, { wickhollow: w }, 'wickhollow');
if (JSON.stringify(doc.changed) !== '["walk"]') throw new Error('the edit should change the walk areas only: ' + JSON.stringify(doc.changed));
// the twenty keepsakes as the export carries them (map-editor.js docOf), the Hag-Stone moved
const lies = (it) => it.source === 'hidden' || it.source === 'found';
const keepsakes = ITEMS.map((it) => ({ item: it.id, name: it.name, wear: it.wear, source: it.source, giver: it.giver || null, map: lies(it) ? it.home : null, x: lies(it) ? it.at[0] : null, y: lies(it) ? it.at[1] : null, note: '' }));
const hag = keepsakes.find((k) => k.item === 'hag-stone'); hag.x += 40; hag.note = 'By the jars';
const row = (d, id) => ({ id, version: 3, data: d });

const cases = [
  { name: 'one store row', file: row(doc, 'edits/wickhollow'), applies: true },
  { name: 'a list of store rows', file: [row(doc, 'edits/wickhollow')], applies: true },
  { name: 'the map editor’s “Copy my work”', file: { game: 'Envoi on the Longest Night', what: 'the map editor: walking-path edits, and where the keepsakes are', version: 2, savedAt: new Date().toISOString(), maps: { wickhollow: doc }, keepsakes }, applies: true, keepsake: true },
  { name: 'a bare document', file: doc, applies: true },
  { name: 'a list of keepsake rows (places)', file: keepsakes.map((k) => row(Object.assign({ sent: new Date().toISOString() }, k), 'places/' + k.item)), applies: false, keepsake: true },
  { name: 'a file with no map’s edits in it', file: { hello: 'world' }, applies: false, refused: true },
];

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'apply-edits-check-'));
const original = fs.readFileSync(path.join(R, 'src/game/maps.js'), 'utf8');
// every map's shapes, but Wickhollow's first walk area
const rest = (M) => JSON.stringify(Object.keys(M).map((id) => [id, id === 'wickhollow' ? M[id].walk.slice(1) : M[id].walk, M[id].block, M[id].front]));
const readMaps = (p) => JSON.parse(spawnSync(process.execPath, ['-e', 'require(' + JSON.stringify(p) + '); process.stdout.write(JSON.stringify(globalThis.MAPS))'], { encoding: 'utf8' }).stdout);
const restBefore = rest(MAPS);
let failed = 0;
const check = (ok, what) => { console.log((ok ? '  ok: ' : '  FAILED: ') + what); if (!ok) failed++; };
try {
  cases.forEach((c, i) => {
    console.log(c.name);
    // a scratch copy of the files apply-edits.mjs reads, laid out as in the repository
    const root = path.join(tmp, 'r' + i);
    for (const f of ['envoi-game-pass-3/map-paths/apply-edits.mjs', 'envoi-game-pass-3/map-paths/edits-core.js', 'src/game/maps.js', 'envoi-final-draft/items/items.js']) {
      fs.mkdirSync(path.dirname(path.join(root, f)), { recursive: true }); fs.copyFileSync(path.join(R, f), path.join(root, f));
    }
    const file = path.join(tmp, 'edits-' + i + '.json'); fs.writeFileSync(file, JSON.stringify(c.file, null, 1));
    if (c.applies) {
      const chk = spawnSync(process.execPath, [path.join(R, 'envoi-game-pass-3/map-paths/check-edits.mjs'), file], { encoding: 'utf8' });
      check(chk.status === 0, 'check-edits.mjs passes it as safe (exit ' + chk.status + ')');
    }
    const ap = spawnSync(process.execPath, [path.join(root, 'envoi-game-pass-3/map-paths/apply-edits.mjs'), file], { cwd: root, encoding: 'utf8' });
    const said = (ap.stdout + ap.stderr).trim();
    console.log(said.replace(/^/gm, '      '));
    const after = fs.readFileSync(path.join(root, 'src/game/maps.js'), 'utf8');
    if (c.applies) {
      const M = readMaps(path.join(root, 'src/game/maps.js'));
      check(ap.status === 0, 'apply-edits.mjs exits 0 (' + ap.status + ')');
      check(JSON.stringify(M.wickhollow.walk[0][1]) === JSON.stringify(moved), 'it wrote the moved point: ' + JSON.stringify(M.wickhollow.walk[0][1]) + ', wanted ' + JSON.stringify(moved));
      check(rest(M) === restBefore, 'and changed no other shape');
    } else {
      check(after === original, 'maps.js is left as it was');
      check(c.refused ? ap.status === 1 : ap.status === 0, 'apply-edits.mjs exits ' + (c.refused ? 1 : 0) + ' (' + ap.status + ')');
    }
    if (c.keepsake) check(/Hag-Stone/.test(said) && /items\.js/.test(said) && /hand/.test(said), 'it names the moved Hag-Stone and says the keepsakes go into items.js by hand');
  });
} finally { fs.rmSync(tmp, { recursive: true, force: true }); }
console.log(failed ? '✗ ' + failed + ' failed' : '✓ apply-edits.mjs reads every shape check-edits.mjs reads');
process.exitCode = failed ? 1 : 0;
