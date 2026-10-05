// keepsakes-fight-pinned.mjs: the game test's keepsakes step fights the same fight every time (T17, tools 10). Its pack
// and weather were rolled at random, so the step took about 100 s or about 300 s.
// It reads the options that step passes to the game's battle (in tools/game-test.mjs, or the file given), and sets the
// fight up 400 times with the game's own src/game/fights.js, the arenas on and the band 1 wilds' arena's own weather:
// every time must be the same pack in the same weather.
// Usage, from the repository's top folder: node final-pass-polish-october-5-2026/checks/tools/keepsakes-fight-pinned.mjs [game-test.mjs]
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const R = process.cwd(), file = path.resolve(process.argv[2] || 'tools/game-test.mjs');
const src = fs.readFileSync(file, 'utf8');
const step = src.slice(src.indexOf("step === 'keepsakes'"), src.indexOf('} else if (step ===', src.indexOf("step === 'keepsakes'") + 10));
const m = step.match(/window\.__game\.battle\('wild', (\{[^}]*\})\)/);
if (!m) { console.log('✗ no wild fight in the keepsakes step of ' + file); process.exit(1); }
const opts = new Function('return ' + m[1])();
// the game's fight setup, as the page has it: rules, the simulator's packs, the state, the keepsakes, the arena
globalThis.window = globalThis; globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
for (const f of ['src/battle/rules.js', 'src/battle/engine.js', 'src/battle/sim.js', 'src/game/state.js', 'envoi-final-draft/items/items.js', 'src/game/keepsakes.js', 'src/stage/arena-river-glade.js', 'src/game/fights.js']) require(path.join(R, f));
window.makeArenaField = window.makeArenaField || (() => null); // the arena's 3D isn't drawn here: its place and weather are
const st = window.GameState.fresh(); st.flags.party = true;
const seen = {};
for (let i = 0; i < 400; i++) {
  const c = window.GameFights.config('wild', st, opts), k = c.fight().foes.map((f) => f.id).join(' + ') + ', ' + (c.weather || 'no weather');
  seen[k] = (seen[k] || 0) + 1;
}
const kinds = Object.keys(seen);
console.log('the keepsakes step fights with ' + m[1] + ': ' + kinds.map((k) => k + ' (' + seen[k] + ')').join('; '));
console.log(kinds.length === 1 ? '✓ the same fight every time: ' + kinds[0] : '✗ ' + kinds.length + ' different fights in 400');
process.exitCode = kinds.length === 1 ? 0 : 1;
