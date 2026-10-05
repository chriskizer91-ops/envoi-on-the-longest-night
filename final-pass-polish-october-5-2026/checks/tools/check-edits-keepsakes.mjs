// check-edits-keepsakes.mjs: check-edits.mjs checks that Io can still reach the keepsakes, which left maps.js for
// items.js on October 5 (756b70b), so that a path edit cutting one off no longer passes (T17, tools 5).
// Bogmire's edits, made as the map editor makes them (MapEdits.body), in four files:
//   1. the small walk area under the Bogstriders (the east end of the southern boardwalk) taken away: she can't get near
//      enough to pick them up, so it must fail and name them;
//   2. the same edits in "Copy my work", with the Bogstriders moved by Chris to the end of another boardwalk: it must
//      pass, the keepsake checked where he put it;
//   3. a point of a walk area 1 px to the side, with the Bogstriders moved by him to a corner she can't get to: fail;
//   4. that same 1 px edit alone, every keepsake where items.js has it: pass.
// Usage, from the repository's top folder: node final-pass-polish-october-5-2026/checks/tools/check-edits-keepsakes.mjs
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
const lies = (it) => it.source === 'hidden' || it.source === 'found';
const bs = ITEMS.find((it) => it.id === 'bogstriders'), hag = ITEMS.find((it) => it.id === 'hag-stone');
if (!bs || bs.home !== 'bogmire' || !hag || hag.home !== 'bogmire') throw new Error('the check expects the Bogstriders and the Hag-Stone on Bogmire, as items.js had them on October 5');

// the walk area under the Bogstriders, taken away
const w1 = E.traced(MAPS, 'bogmire'), k = w1.walk.findIndex((p) => E.inPoly(p, bs.at[0], bs.at[1]));
w1.walk.splice(k, 1);
const cut = E.body(MAPS, { bogmire: w1 }, 'bogmire');
// a point 1 px to the side, on the walk area under the Hag-Stone (its first point)
const w2 = E.traced(MAPS, 'bogmire'), kh = w2.walk.findIndex((p) => E.inPoly(p, hag.at[0], hag.at[1]));
w2.walk[kh][0] = [w2.walk[kh][0][0] + 1, w2.walk[kh][0][1]];
const nudge = E.body(MAPS, { bogmire: w2 }, 'bogmire');
// the twenty as "Copy my work" carries them, with the Bogstriders at `at` on Bogmire
const keepsakes = (at) => ITEMS.map((it) => {
  const p = it.id === 'bogstriders' ? at : lies(it) ? it.at : null;
  return { item: it.id, name: it.name, wear: it.wear, source: it.source, giver: it.giver || null, map: p ? (it.id === 'bogstriders' ? 'bogmire' : it.home) : null, x: p ? p[0] : null, y: p ? p[1] : null, note: '' };
});
const work = (doc, at) => ({ game: 'Envoi on the Longest Night', what: 'the map editor: walking-path edits, and where the keepsakes are', version: 2, savedAt: new Date().toISOString(), maps: { bogmire: doc }, keepsakes: keepsakes(at) });

const cases = [
  { name: 'the walk area under the Bogstriders taken away', file: { id: 'edits/bogmire', data: cut }, safe: false },
  { name: 'the same, with Chris’s Bogstriders moved to the Hag-Stone’s boardwalk', file: work(cut, [hag.at[0] + 20, hag.at[1]]), safe: true },
  { name: 'a point 1 px to the side, his Bogstriders in a corner she can’t get to', file: work(nudge, [24, 24]), safe: false },
  { name: 'the 1 px edit alone, every keepsake where items.js has it', file: nudge, safe: true },
];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'check-edits-keepsakes-'));
let failed = 0;
const check = (ok, what) => { console.log((ok ? '  ok: ' : '  FAILED: ') + what); if (!ok) failed++; };
try {
  cases.forEach((c, i) => {
    console.log(c.name);
    const f = path.join(tmp, 'edits-' + i + '.json'); fs.writeFileSync(f, JSON.stringify(c.file));
    const r = spawnSync(process.execPath, [path.join(R, 'envoi-game-pass-3/map-paths/check-edits.mjs'), f], { encoding: 'utf8' });
    console.log(r.stdout.trim().replace(/^/gm, '      '));
    if (c.safe) check(r.status === 0, 'check-edits.mjs finds it safe (exit ' + r.status + ')');
    else check(r.status === 1 && /can’t reach now: .*Bogstriders/.test(r.stdout), 'check-edits.mjs refuses it, naming the Bogstriders (exit ' + r.status + ')');
  });
} finally { fs.rmSync(tmp, { recursive: true, force: true }); }
console.log(failed ? '✗ ' + failed + ' failed' : '✓ check-edits.mjs checks the keepsakes’ reach, where Chris put them');
process.exitCode = failed ? 1 : 0;
