// vow-guard.mjs: the balance's expert play style (src/battle/sim.js) never has Sol attack Halcyon through Warden's Vow, her
// counter stance: it guards instead, whatever Sol's Heat (it used to attack under 40 Heat, so Halcyon's balance targets
// measured an imperfect expert). Halcyon's ambush at 15, 18 and 20 and the finale at 20 are played 200 times each with the
// engine (src/battle/engine.js), and every choice Sol makes while a foe stands in the Vow is counted.
// Usage (from the repository's top folder): node final-pass-polish-october-5-2026/checks/battles/vow-guard.mjs
import './rig.mjs';
const S = globalThis.BattleSim, BE = globalThis.BattleEngine;
let into = 0, turns = 0;
const chose = {};
for (const [fight, level] of [['halcyon', 15], ['halcyon', 18], ['halcyon', 20], ['finale', 20]]) {
  for (let seed = 1; seed <= 200; seed++) {
    const rand = BE.rng(seed * 2654435761 + 97), B = BE.create(Object.assign({ seed }, S.FIGHTS[fight].setup(level, rand))), pol = S.POLICIES.expert;
    let s, g = 0;
    while ((s = B.turn()).type !== 'end' && ++g < 20000) {
      if (s.type !== 'choose') continue;
      const [id, t] = pol(B, s, rand), f = t ? B.unit(t) : null;
      if (s.unit.id === 'sol' && B.foes.some((u) => u.vow > 0 && B.alive(u))) { turns++; chose[id] = (chose[id] || 0) + 1; if (id === 'attack' && f && f.vow > 0) into++; }
      B.choose(id, t);
    }
  }
}
console.log('Sol’s choices while a foe stands in Warden’s Vow: ' + Object.entries(chose).map(([k, v]) => k + ' ' + v).join(', ') + ' (' + turns + ' turns)');
console.log(into ? 'FAIL: ' + into + ' times she attacks the foe in the Vow' : 'ok: she never attacks the foe in the Vow');
process.exit(into ? 1 : 0);
