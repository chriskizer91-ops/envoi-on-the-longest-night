// downed-kneels.mjs: a hero who is down when a fight opens (a fled fight leaves her at 0 HP: only a win revives)
// kneels, as one who goes down in a fight does, and stays kneeling through the fight's opening; the hero still up
// doesn't. The battle screen's own begin(), newEngine(), resetHeroes() and intro() (src/battle/screen.js) open a band 2
// wild fight from the game's config (src/game/fights.js) with Io down, then with Sol down, on stand-in models that
// note every action they are asked to play; each action must be one the hero's own model has (src/models/witch.js,
// sol.js: Io's look and moves stay hers). A hero revived in the fight gets up with her model's `rise`, as before (apply's
// revive, run on the same stand-ins).
// Usage (from the repository's top folder): node final-pass-polish-october-5-2026/checks/battles/downed-kneels.mjs
import fs from 'fs';
import path from 'path';
import { R, grab } from './rig.mjs';

const any = new Proxy(function () {}, { get: (t, k) => (k === 'then' ? undefined : k === Symbol.toPrimitive ? () => 0 : any), apply: () => any });
// the actions each hero's own model has
const actionsOf = (file) => new Set([...fs.readFileSync(path.join(R, 'src/models', file), 'utf8').matchAll(/(?:\bact\('|^\s{4}|\bACTS\.)(\w+)(?:'|: \{ dur:| = \{ dur:)/gm)].map((m) => m[1]));
const OWN = { io: actionsOf('witch.js'), sol: actionsOf('sol.js') };

function open(down) {
  const P = { level: 8, xp: 0, flags: { party: true, refit: true }, hp: { io: null, sol: null }, herbs: {} };
  P.hp[down] = 0;
  const cfg = window.GameFights.config('wild', P, { band: 2, pack: ['wraith', 'wisp'], arena: false, scene: 'warm-road' });
  const played = { io: [], sol: [] };
  const model = (key) => ({ root: { visible: true }, fx: null, action: '', played: played[key], reset() { this.action = ''; }, guard() {},
    play(name) { this.played.push(name); this.action = name; } });
  const heroes = ['io', 'sol'].map((key) => ({ key, m: model(key), home: { x: 0, z: 0, yaw: 0 }, pos: { x: 0, z: 0 }, look: {} }));
  const F = { io: heroes[0], sol: heroes[1] };
  const env = {
    cfg, BE: globalThis.BattleEngine, PICK: { level: 8, pack: 0 }, S: {}, D: {}, E: null, F, heroes, foes: [], io: () => F.io,
    $: () => ({ hidden: true, style: {} }), UI: any, FX: any, SND: any, AF: null, BF: null, LU: { m: { reset() {}, root: {}, fx: null }, shadow: {} }, EN: null, ENV: {},
    TOWN: { a: [], to: [] }, SKY: {}, skyTo() {}, darkTo() {}, envoiHide() {}, buildFoes() {}, PACE: {}, clock: { t: 0 },
    shot() {}, shotAt() {}, shotField() {}, followShot() {}, applyCam() {}, wait: async () => {}, skipP: null, skipRes: null, IW: 1536, IH: 1024, camera: {},
    THREE: globalThis.THREE, ROUTE: [], moveTo: async () => {}, faceYaw: () => 0, layoutView() {},
  };
  const body = [grab('function newEngine()'), grab('function resetHeroes()'), 'const ws = (sec) => Promise.race([wait(sec), skipP]);', grab('async function intro(quick)'), grab('async function begin(quick)'), 'return { begin, get E() { return E; } };'].join('\n');
  const names = Object.keys(env);
  return { run: new Function(...names, body)(...names.map((k) => env[k])), heroes, played, env };
}

let bad = 0;
for (const down of ['io', 'sol']) {
  const t = open(down);
  await t.run.begin(true);
  for (const h of t.heroes) {
    const isDown = t.run.E.unit(h.key).hp <= 0, last = h.m.action, strange = h.m.played.filter((a) => !OWN[h.key].has(a));
    const ok = (isDown ? last === 'kneel' : last !== 'kneel') && !strange.length;
    if (!ok) bad++;
    console.log((ok ? 'ok   ' : 'FAIL ') + h.key + (isDown ? ' (down, 0 HP)' : ' (up)') + ': played ' + (h.m.played.join(', ') || 'nothing') + '; holds ' + (last || 'her stance') +
      (strange.length ? '; not her model’s own: ' + strange.join(', ') : ''));
  }
}
// revived in the fight: the screen's own apply() for a revive event gets her up with her model's rise
{
  const t = open('sol'); await t.run.begin(true);
  const sol = t.heroes[1];
  const env = Object.assign({}, t.env, { E: t.run.E, word() {}, chest() {}, nf: String, RL: globalThis.BattleRules, head() {} });
  const names = Object.keys(env);
  const apply = new Function(...names, grab('function apply(e, o)') + '\nreturn apply;')(...names.map((k) => env[k]));
  apply({ t: 'revive', who: 'sol', n: 100 });
  const ok = sol.m.action === 'rise';
  if (!ok) bad++;
  console.log((ok ? 'ok   ' : 'FAIL ') + 'sol revived in the fight: played ' + sol.m.played.join(', '));
}
console.log(bad ? 'FAIL: ' + bad + ' wrong' : 'all good');
process.exit(bad ? 1 : 0);
