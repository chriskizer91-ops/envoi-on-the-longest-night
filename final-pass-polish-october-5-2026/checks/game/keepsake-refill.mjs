// keepsake-refill.mjs (T17 game 7): taking a keepsake that adds HP (or MP) off and putting it on again gives back no HP
// (or MP): a hero who wasn't full is held inside the lower maximum, not marked full; a full one stays full. Loads the
// real rules.js, items.js, keepsakes.js and state.js, and wears and takes off the keepsakes as the Items page does
// (Keepsakes.wear, then GameState.fit).
// Usage, from the repository's top folder: node final-pass-polish-october-5-2026/checks/game/keepsake-refill.mjs
import path from 'path'; import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const R = path.resolve(new URL('../../..', import.meta.url).pathname);
globalThis.window = globalThis;
for (const f of ['src/battle/rules.js', 'envoi-final-draft/items/items.js', 'src/game/keepsakes.js', 'src/game/state.js']) require(path.join(R, f));
const GS = globalThis.GameState, K = globalThis.Keepsakes;
let bad = 0;
const ok = (good, line) => { if (!good) bad++; console.log((good ? '✓ ' : '✗ ') + line); };
const toggle = (st, id, who) => { K.wear(st, id, ''); GS.fit(st); K.wear(st, id, who); GS.fit(st); };
// the Warden's Brooch (Sol's HP) and the Moonglass (Io's MP)
for (const [id, who, what] of [['wardens-brooch', 'sol', 'HP'], ['moonglass', 'io', 'MP']]) {
  const st = GS.fresh(); st.level = 12; st.flags.party = true; st.items = { [id]: who };
  const max = () => (what === 'HP' ? GS.maxHp(st, who) : GS.maxMp(st)), now = () => (what === 'HP' ? GS.hpOf(st, who) : GS.mpOf(st));
  const set = (v) => { if (what === 'HP') st.hp[who] = v; else st.mp = v; };
  const withIt = max(); K.wear(st, id, ''); const without = max(); K.wear(st, id, who);
  // hurt, but above the maximum without it: off and on again
  const mid = without + Math.floor((withIt - without) / 2);
  set(mid); toggle(st, id, who);
  ok(now() <= mid, id + ' (' + what + ' ' + without + ' to ' + withIt + '), worn at ' + mid + ', off and on again: ' + now() + ' of ' + max());
  // hurt, under that maximum: as it was
  set(without - 10); toggle(st, id, who);
  ok(now() === without - 10, id + ', worn at ' + (without - 10) + ', off and on again: ' + now() + ' of ' + max());
  // full: stays full, at either maximum
  set(null); K.wear(st, id, ''); GS.fit(st); const offFull = now() === without; K.wear(st, id, who); GS.fit(st);
  ok(offFull && now() === withIt, id + ', full: full without it (' + offFull + ') and full with it again (' + now() + ' of ' + max() + ')');
}
if (bad) { console.log(bad + ' wrong'); process.exit(1); }
console.log('all good');
