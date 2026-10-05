// lunara-spot.mjs: Lunara rises clear of the foes in every arena fight, the Bramble Colossus's above all (she rose inside
// it). Her spot is worked out by the battle screen's own line (src/battle/screen.js, WELL and LUN) from each of the game's
// fights as it sets them up in its arena (src/game/fights.js); then the ground between her and each foe, past the foe's
// own width (halfW, or its shadow's), must be at least a metre, and she must stand in the arena's frame, head to foot.
// Usage (from the repository's top folder): node final-pass-polish-october-5-2026/checks/battles/lunara-spot.mjs
import { line, arenaOf } from './rig.mjs';
const GF = globalThis.GameFights;
const FIGHTS = [
  ['band 1 wilds', 'wild', { band: 1, pack: ['wisp', 'wisp', 'wraith'] }], ['band 2 wilds', 'wild', { band: 2, pack: ['wisp', 'wraith', 'wraith'] }],
  ['band 3 wilds', 'wild', { band: 3, pack: ['frostWisp', 'wraith', 'wraith'] }], ['band 4 wilds', 'wild', { band: 4, pack: ['frostWisp', 'frostWisp', 'wraith'] }],
  ['the Bramble Horror', 'wild', { band: 3, pack: ['bramble?'] }], ['the Bramble Colossus', 'wild', { band: 4, pack: ['colossus'] }],
  ['gate 5', 'greatWraith', {}], ['gate 10', 'dawnroost', {}], ['gate 15', 'halcyon', {}], ['the finale', 'finale', {}],
];
const where = new Function('AF', 'ARENA', 'cfg', 'SC', 'spot', 'g', line('const WELL = AF ?') + '\nreturn { WELL, LUN };');
let bad = 0;
for (const [name, kind, opts] of FIGHTS) {
  const c = GF.config(kind, { level: 18, xp: 0, flags: { party: true, refit: true, envoi: true, stoop: true }, hp: {}, herbs: {} }, Object.assign({ arena: true, weather: 'clear' }, opts));
  const A = globalThis.ARENAS[c.arena], { LUN } = where({}, A, c, {}, (p) => ({ x: p[0], z: p[1] }), null);
  const foes = c.fight().foes.map((f, i) => ({ id: f.id, at: c.slots[i], look: c.foeLook[f.id] }));
  const clear = Math.min(...foes.map((f) => Math.hypot(LUN.x - f.at[0], LUN.z - f.at[1]) - (f.look.halfW || f.look.shadow || 0.5)));
  const cam = arenaOf(c.arena).camera, V = new THREE.Vector3();
  const inFrame = [0, 4.3].every((y) => { V.set(LUN.x, y, LUN.z).project(cam); return Math.abs(V.x) <= 1 && Math.abs(V.y) <= 1 && V.z < 1; });
  const ok = clear >= 1 && inFrame;
  if (!ok) bad++;
  console.log((ok ? 'ok   ' : 'FAIL ') + name + ' (' + c.arena + '): Lunara at [' + LUN.x.toFixed(1) + ', ' + LUN.z.toFixed(1) + '], ' + clear.toFixed(1) + ' m clear of the nearest foe’s edge' + (inFrame ? '' : ', NOT in the frame'));
}
console.log(bad ? 'FAIL: ' + bad + ' fights' : 'all good');
process.exit(bad ? 1 : 0);
