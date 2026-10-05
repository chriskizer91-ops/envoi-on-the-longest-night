// last-word.mjs: Envoi's Last Word (its banner, flash and shake) plays when its strike ends Noctara's Frost Dust.
// The finale is played in node by the engine and the expert play style (src/battle/engine.js, sim.js) until Envoi's
// strike ends the frost with a blow still waiting in it; that turn's log is then played by the battle screen's own
// playLog and envoiStrike (src/battle/screen.js), with stand-ins for the models, effects and windows, and the banners
// it shows are read. Exits 1 if the Last Word isn't shown.
// Usage (from the repository's top folder): node final-pass-polish-october-5-2026/checks/battles/last-word.mjs
import fs from 'fs';
import path from 'path';
import { R, grab, line } from './rig.mjs';
const SIM = globalThis.BattleSim, BE = globalThis.BattleEngine;

// a finale turn in which Envoi's strike (all its blows) ends the frost, and the blow waiting in the frost then lands
function findTurn() {
  for (let seed = 1; seed < 400; seed++) {
    const rand = BE.rng(seed * 2654435761 + 97), B = BE.create(Object.assign({ seed }, SIM.FIGHTS.finale.setup(20, rand))), pol = SIM.POLICIES.expert;
    let s, guard = 0;
    while ((s = B.turn()).type !== 'end' && ++guard < 5000) {
      const log = s.log, i = log.findIndex((e) => e.t === 'strike' && e.who === 'envoi'), j = log.findIndex((e) => e.t === 'frostEnds');
      if (i >= 0 && j > i && log.slice(i, j).filter((e) => e.t === 'hit').length === 9 && log.slice(j).some((e) => e.t === 'hit')) return { seed, log: JSON.parse(JSON.stringify(log)), B };
      if (s.type === 'choose') { const [id, t] = pol(B, s, rand); B.choose(id, t); }
    }
  }
  return null;
}
const found = findTurn();
if (!found) { console.log('FAIL: no finale turn found in which Envoi’s strike ends the frost'); process.exit(1); }
const { seed, log, B } = found;

// anything the screen asks of a model, an effect or a sound: a stand-in that answers every call
const any = new Proxy(function () {}, { get: (t, k) => (k === 'then' ? undefined : k === Symbol.toPrimitive ? () => 0 : any), apply: () => any });
const banners = [];
const UI = new Proxy({ banner: (text) => banners.push(text) }, { get: (t, k) => t[k] || any });
const envoiSrc = fs.readFileSync(path.join(R, 'src/models/envoi.js'), 'utf8');
const envoiHits = JSON.parse(envoiSrc.match(/envoi: A\([\d.]+, (\[[^\]]+\])/)[1]);
const fig = (key) => ({ key, pos: { x: 0, z: 0 }, tall: 2, m: new Proxy({ ACTIONS: { envoi: { hits: envoiHits } }, progress: 1, busy: false }, { get: (t, k) => (k in t ? t[k] : any) }) });
const F = {}; for (const u of B.units) F[u.key] = fig(u.key);
const EN = Object.assign(fig('envoi'), { on: true });
const E = { unit: (k) => B.unit(k), get over() { return null; } };
const env = {
  S: { guard: {} }, F, FX: any, SND: any, UI, E, D: new Proxy({}, { get: () => ({ hp: 1, mp: 0, heat: 0 }) }), EN, ENV: { ward: fig('ward') },
  transform: any, lunaraStrike: any, useHerb: any, lureTurn: any, bloomTurn: any, chargeTurn: any, hesitate: any, anyMove: any,
  SOL_MOVES: {}, IO_MOVES: {}, WISP_MOVES: {}, HALCYON_MOVES: {}, BRAMBLE_MOVES: {}, COLOSSUS_MOVES: {}, NOCTARA_MOVES: {}, WRAITH_MOVES: {},
  firstFoe: () => F[B.foes[0].key], living: () => [F.io], io: () => F.io, chest: () => any, envoiShot: any, envoiHide: any, addShake: any, hitStop: any,
  wait: async () => {}, until: async () => {}, untilP: async () => {}, V: () => any, shotField: any, warded: () => false, reach: () => [F.io], sync: any,
  apply: () => {}, word: any, cfg: { envoiLines: [] },
};
const body = [line('const OWN_BANNER'), grab('function events(list)'), grab('async function thaw(hd, ev)'), grab('async function envoiStrike(ev)'), grab('async function playLog(log)'), 'return playLog;'].join('\n');
const names = Object.keys(env);
const playLog = new Function(...names, body)(...names.map((k) => env[k]));
await playLog(log);

const lastWord = banners.includes('Last Word');
console.log('seed ' + seed + ': Envoi’s strike ends the frost, then ' + log.slice(log.findIndex((e) => e.t === 'frostEnds')).filter((e) => e.t === 'hit').length + ' blow(s) from the frost land; the banners shown: ' + banners.join(', '));
console.log(lastWord ? 'ok: the Last Word is shown' : 'FAIL: the Last Word is never shown');
process.exit(lastWord ? 0 : 1);
