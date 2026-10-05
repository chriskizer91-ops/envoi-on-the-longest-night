// guard-tag.mjs: Sol's Guard says what it costs in her menu ("−40 Heat"), as her Sword Arts do. A fight is played with the
// engine (src/battle/engine.js) until Sol's turn, and her menu is built from her options by the battle screen's own
// menuMain and tagOf (src/battle/screen.js).
// Usage (from the repository's top folder): node final-pass-polish-october-5-2026/checks/battles/guard-tag.mjs
import { grab, line } from './rig.mjs';
const S = globalThis.BattleSim, BE = globalThis.BattleEngine, RL = globalThis.BattleRules;
const rand = BE.rng(7), B = BE.create(Object.assign({ seed: 7 }, S.FIGHTS.halcyon.setup(18, rand)));
let s; for (let g = 0; g < 200 && !(s && s.type === 'choose' && s.unit.id === 'sol'); g++) { s = B.turn(); if (s.type === 'choose' && s.unit.id !== 'sol') { const [id, t] = S.POLICIES.expert(B, s, rand); B.choose(id, t); } }
const menuMain = new Function('heroes', grab('function menuMain(s)') + '\n' + line('const tagOf = ') + '\nreturn menuMain;')([{}, {}]);
const guard = menuMain(s).find((it) => it.id === 'guard');
console.log('Sol’s menu: ' + menuMain(s).map((it) => it.label + (it.tag ? ' [' + it.tag + ']' : '')).join(', ') + ' (Guard costs ' + -RL.HEROES.sol.moves.guard.heat + ' Heat in rules.js)');
const ok = guard && guard.tag === '−' + -RL.HEROES.sol.moves.guard.heat + ' Heat';
console.log(ok ? 'ok: Guard is tagged with its Heat' : 'FAIL: Guard has no Heat tag');
process.exit(ok ? 0 : 1);
