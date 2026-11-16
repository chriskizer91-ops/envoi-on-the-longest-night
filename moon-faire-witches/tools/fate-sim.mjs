// fate-sim.mjs: plays many fights of the new party (Io and the Jester) through the copied engine with a simple careful
// player, to check the rules run and to measure wins, seals and Curtain Calls. Usage: node fate-sim.mjs [fights] [level] [pack]
//   pack: a list like wraith,wisp,wisp (Envoi's foe ids)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
globalThis.window = globalThis;
require('../src/battle/rules.js'); require('../src/battle/engine.js');
const RL = globalThis.BattleRules, BE = globalThis.BattleEngine;
const N = +(process.argv[2] || 300), L = +(process.argv[3] || 3), PACK = (process.argv[4] || 'wraith,wisp,wisp').split(',');
const flags = { party: true, refit: true, envoi: L > 10 };
let wins = 0, seals = 0, curtains = 0, turns = 0, catches = 0, lowHp = 0, errors = 0;
function pick(E, s) {
  const o = (id) => s.options.find((x) => x.id === id && x.ok);
  const io = E.hero('io'), J = E.hero('jester'), hurt = [io, J].filter((h) => E.alive(h)).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
  if (s.unit.id === 'jester') {
    if (o('curtain')) return ['curtain'];
    if (o('seal')) return ['seal'];
    if (J.hp < J.maxHp * 0.4 && o('hheal')) return ['hheal'];
    if (E.taunt === 0 && o('jab')) return ['jab', s.options.find((x) => x.id === 'jab').targets[0]];
    return ['rebuke', s.options.find((x) => x.id === 'rebuke').targets[0]];
  }
  if (o('moonlight')) return ['moonlight', o('moonlight').targets[0]];
  if (s.options.find((x) => x.id === 'revive' && x.ok)) return ['revive', o('revive').targets[0]];
  if (hurt && hurt.hp < hurt.maxHp * 0.45 && o('salve')) return ['salve', hurt.key];
  if (o('envoi')) return ['envoi', o('envoi').targets[0]];
  if (o('lunara') && hurt && hurt.hp < hurt.maxHp * 0.5) return ['lunara', o('lunara').targets[0]];
  if (o('thorn')) return ['thorn', o('thorn').targets[0]];
  return ['attack', s.options.find((x) => x.id === 'attack').targets[0]];
}
for (let i = 0; i < N; i++) {
  try {
    const E = BE.create({ seed: 1000 + i, party: [{ id: 'io', level: L }, { id: 'jester', level: L }], foes: PACK.map((id) => ({ id, level: L })), flags, ends: { canFlee: false }, herbs: {} });
    let g = 0;
    while (!E.over && g++ < 400) {
      const r = E.turn();
      for (const e of r.log) { if (e.t === 'catch') catches++; }
      if (r.type === 'choose') { const [id, t] = pick(E, r); const log = E.choose(id, t); for (const e of log) { if (e.t === 'curtain') curtains++; if (e.t === 'hit' && e.sealedEnd) seals++; if (e.t === 'catch') catches++; } }
    }
    if (E.over === 'win') wins++;
    const R = E.result(); turns += R.turns; lowHp += R.low;
  } catch (e) { errors++; if (errors < 3) console.error(e); }
}
console.log(JSON.stringify({ level: L, pack: PACK, fights: N, win: (wins / N * 100).toFixed(1) + '%', sealsPerFight: (seals / N).toFixed(2), curtainCalls: (curtains / N * 100).toFixed(1) + '%', catchesPerFight: (catches / N).toFixed(1), turns: (turns / N).toFixed(1), lowestHp: (lowHp / N * 100).toFixed(0) + '%', errors }));
