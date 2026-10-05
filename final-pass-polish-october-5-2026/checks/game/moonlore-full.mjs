// moonlore-full.mjs (T17 game 5): Io's Moonlore from the menu refuses, and keeps her MP, when no one it reaches needs
// it (everyone at full HP, or down), as a herb does ("No one needs it."); it still heals when someone is hurt. Loads the
// real rules.js, items.js, keepsakes.js and state.js.
// Usage, from the repository's top folder: node final-pass-polish-october-5-2026/checks/game/moonlore-full.mjs
import path from 'path'; import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const R = path.resolve(new URL('../../..', import.meta.url).pathname);
globalThis.window = globalThis;
for (const f of ['src/battle/rules.js', 'envoi-final-draft/items/items.js', 'src/game/keepsakes.js', 'src/game/state.js']) require(path.join(R, f));
const GS = globalThis.GameState;
const party = () => { const st = GS.fresh(); st.level = 10; st.flags.party = true; st.mp = 100; return st; };
let bad = 0;
const ok = (good, line) => { if (!good) bad++; console.log((good ? '✓ ' : '✗ ') + line); };
const cases = [
  // [what, the move, on whom, HP of Io and Sol (null: full), whether it should heal]
  ['Lunar Mend on Io at full HP', 'mend', 'io', [null, null], false],
  ['Lunar Mend on Sol at full HP, Io hurt', 'mend', 'sol', [50, null], false],
  ['Waxing Light with both at full HP', 'waxing', null, [null, null], false],
  ['Waxing Light with Io down and Sol at full HP', 'waxing', null, [0, null], false],
  ['Lunar Mend on Io, hurt', 'mend', 'io', [50, null], true],
  ['Waxing Light with Sol hurt', 'waxing', null, [null, 50], true],
];
for (const [what, move, who, [io, sol], heals] of cases) {
  const st = party(); st.hp.io = io; st.hp.sol = sol;
  const err = GS.healOutside(st, move, who);
  const good = heals ? err === null && st.mp < 100 : !!err && st.mp === 100;
  ok(good, what + ': ' + (err ? 'refused (“' + err + '”)' : 'healed') + ', MP ' + st.mp + ' of 100');
}
if (bad) { console.log(bad + ' wrong'); process.exit(1); }
console.log('all good');
