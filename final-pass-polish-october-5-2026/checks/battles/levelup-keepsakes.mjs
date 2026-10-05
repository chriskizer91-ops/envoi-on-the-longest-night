// levelup-keepsakes.mjs: the level-up card gives each hero's HP and Io's MP as the game will have them, with what their
// keepsakes add. A band 4 fight is set up from the game's config (src/game/fights.js) for a party wearing keepsakes worth
// +10% HP on Io, +25% MP and +15% HP on Sol (the multipliers fights.js hands the engine, as items.js gives them); the
// battle screen's own newEngine() and showEnd() (src/battle/screen.js) make the end card of a win worth a level, and its
// numbers are compared with the game's own maxHp and maxMp at both levels (src/game/state.js: the base, scaled by the
// level, and the keepsakes).
// Usage (from the repository's top folder): node final-pass-polish-october-5-2026/checks/battles/levelup-keepsakes.mjs
import { grab } from './rig.mjs';
const RL = globalThis.BattleRules, BE = globalThis.BattleEngine;
const GEAR = { io: { hp: 10, mp: 25 }, sol: { hp: 15, mp: 0 } };
const c = globalThis.GameFights.config('wild', { level: 18, xp: 0, flags: { party: true, refit: true, envoi: true, stoop: true }, hp: {}, herbs: {} }, { band: 4, pack: ['wraith'], arena: false });
const plain = c.fight;
c.fight = () => { const f = plain(); for (const p of f.party) { p.hpMul = 1 + GEAR[p.id].hp / 100; if (p.id === 'io') p.mpMul = 1 + GEAR.io.mp / 100; } return f; };
// the page: elements by id, and el() adding to them
const els = {};
const $ = (id) => (els[id] = els[id] || { id, textContent: '', hidden: true, style: {}, kids: [], focus() {}, set innerHTML(v) { this.kids = []; } });
const el = (tag, attrs, parent, text) => { const e = { tag, textContent: text === undefined ? '' : String(text) }; if (parent) parent.kids.push(e); return e; };
Object.defineProperty($('lvlList'), 'textContent', { set() { this.kids = []; }, get() { return this.kids.map((k) => k.textContent).join(' | '); } });
const env = {
  cfg: c, BE, RL, PICK: { level: 18, pack: 0 }, S: {}, D: {}, E: null, heroes: [{ key: 'io' }, { key: 'sol' }], clock: { t: 0 }, PACE: { fps: {}, cap: 30 },
  $, el, nf: (n) => Math.round(n).toLocaleString('en-US'), SND: { sfx: { chime() {} } }, coarse: true, setTimeout: () => 0,
};
const names = Object.keys(env);
const run = new Function(...names, grab('function newEngine()') + '\n' + grab('function showEnd(r)') + '\nreturn { newEngine, showEnd, get E() { return E; } };')(...names.map((k) => env[k]));
run.newEngine();
const lead = run.E.unit('io'), L = lead.level;
run.showEnd({ outcome: 'win', xp: RL.xpNeed(L), shards: 0 });
const rows = $('lvlList').kids.map((k) => k.textContent);
const shown = {}; for (let i = 0; i < rows.length; i += 2) shown[rows[i]] = rows[i + 1];
// the game's own numbers (state.js maxHp, maxMp)
const hp = (id, lv) => Math.round(RL.HEROES[id].hp * RL.scale(lv) * (1 + GEAR[id].hp / 100)), mp = (lv) => Math.round(RL.HEROES.io.mp * RL.mpScale(lv) * (1 + GEAR.io.mp / 100));
const nf = env.nf, want = { 'Io’s HP': nf(hp('io', L)) + ' → ' + nf(hp('io', L + 1)), 'Sol’s HP': nf(hp('sol', L)) + ' → ' + nf(hp('sol', L + 1)), 'Io’s MP': mp(L) + ' → ' + mp(L + 1) };
let bad = 0;
for (const k in want) { const ok = shown[k] === want[k]; if (!ok) bad++; console.log((ok ? 'ok   ' : 'FAIL ') + k + ': the card says ' + shown[k] + ', the game will have ' + want[k] + (k === 'Io’s HP' ? ' (her fight began at ' + nf(lead.maxHp) + ')' : '')); }
console.log(bad ? 'FAIL: ' + bad + ' wrong' : 'all good');
process.exit(bad ? 1 : 0);
