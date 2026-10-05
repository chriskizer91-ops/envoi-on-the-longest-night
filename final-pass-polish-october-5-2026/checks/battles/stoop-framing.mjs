// stoop-framing.mjs: Sol's Kestrel Stoop hover is in the shot in every arena, on the phone held sideways (915 x 412), held
// upright (390 x 844) and on a laptop (1366 x 768). The battle screen's own camera director, its stoopRise and stoop
// actions and learnStoop (src/battle/screen.js) frame each of the game's fights in its arena (src/game/fights.js), with
// the battle windows as tall as the game draws them there; then her head as she hangs (about 3 m up, src/models/sol.js)
// is put through the shot's camera:
//   - Kestrel Stoop's rise, and the stoop that starts from the hover: her head inside the frame, her hanging feet above
//     the windows, and the foe she aims at shown above the windows (on the laptop the whole shot fits: her ground and
//     the foe's feet above the windows too)
//   - the whole field (shotField) while she hangs there: her head inside the frame
//   - gate 15's end, "Sol learns Kestrel Stoop": her head below the letterbox and the banner
// Exits 1 if any is off.
// Usage (from the repository's top folder): node final-pass-polish-october-5-2026/checks/battles/stoop-framing.mjs
import { grab, director, fighter } from './rig.mjs';
const GF = globalThis.GameFights;

const UP = 2.95, BOB = 0.055; // her hover's height and its bob (src/models/sol.js, UP and stoopRise's post)
// the windows as the game draws them while a move plays (measured in the game: the party's window 132 px tall, 172 on
// the upright phone; layoutView adds 12)
const SIZES = [{ w: 915, h: 412, uiH: 144 }, { w: 390, h: 844, uiH: 184 }, { w: 1366, h: 768, uiH: 144 }];
const FIGHTS = [
  ['band 1 wilds', 'wild', { band: 1, pack: ['wisp', 'wisp', 'wraith'] }], ['band 2 wilds', 'wild', { band: 2, pack: ['wisp', 'wraith', 'wraith'] }],
  ['band 3 wilds', 'wild', { band: 3, pack: ['frostWisp', 'wraith', 'wraith'] }], ['band 4 wilds', 'wild', { band: 4, pack: ['frostWisp', 'frostWisp', 'wraith'] }],
  ['the Bramble Horror', 'wild', { band: 3, pack: ['bramble?'] }], ['the Bramble Colossus', 'wild', { band: 4, pack: ['colossus'] }],
  ['gate 5', 'greatWraith', {}], ['gate 10', 'dawnroost', {}], ['gate 15', 'halcyon', {}], ['the finale', 'finale', {}],
];
const any = new Proxy(function () {}, { get: (t, k) => (k === 'then' ? undefined : k === Symbol.toPrimitive ? () => 0 : any), apply: () => any });
const UI = new Proxy({ menuOpen: false }, { get: (t, k) => (k in t ? t[k] : any) }); // the windows, with no menu open while a move plays
const asFn = (text) => '(' + text.replace(/^async (\w+)\(/, 'async function $1(') + ')';
const ACT = { stoopRise: asFn(grab('async stoopRise(h, t, ev)')), stoop: asFn(grab('async stoop(h, t, ev)')), learnStoop: '(' + grab('async function learnStoop(mark)') + ')' };

let bad = 0;
const say = (ok, text) => { if (!ok) bad++; if (!ok || process.env.VERBOSE) console.log((ok ? 'ok   ' : 'FAIL ') + text); };
for (const size of SIZES) {
  const top = { learn: Math.max(0.09 * size.h, 51) + 2 }; // the letterbox (9% of the height) and the banner (to 51 px)
  const winTop = size.h - size.uiH + 4; // the windows' top edge (8 px off the bottom; uiH is their height and 12)
  let worst = { rise: 1e9, stoop: 1e9, field: 1e9, learn: 1e9 };
  for (const [name, kind, opts] of FIGHTS) {
    const c = GF.config(kind, { level: 18, xp: 0, flags: { party: true, refit: true, envoi: kind === 'finale', stoop: true }, hp: {}, herbs: {} }, Object.assign({ arena: true, weather: 'clear' }, opts));
    const foes = c.fight().foes;
    const all = c.heroes.map((h) => fighter(h.id, 'hero', h.home, h)).concat(c.slots.slice(0, foes.length).map((sl, i) => fighter('f' + i, 'foe', sl, c.foeLook[foes[i].id])));
    const sol = all.find((f) => f.key === 'sol');
    const where = name + ' (' + c.arena + ') at ' + size.w + ' x ' + size.h;
    for (const t of all.filter((f) => f.side === 'foe')) {
      for (const act of ['stoopRise', 'stoop']) {
        sol.m.action = act === 'stoop' ? 'stoopRise' : '';
        const d = director(c.arena, size, all, {
          faceTo() {}, SND: any, UI, FX: any, untilP: async () => {}, until: async () => {}, wait: async () => {}, D: { sol: { aloft: true } }, E: { over: null },
          countering: () => false, strikeFx() {}, chest: () => any, addShake() {}, counterBlow: async () => {}, goHome: async () => {},
        });
        await d.run(ACT[act])(sol, t, { has: () => false, rest() {} });
        d.settle();
        const head = d.screenOf(sol.pos.x, UP + sol.tall + BOB, sol.pos.z).y, feet = d.screenOf(sol.pos.x, UP - BOB, sol.pos.z).y;
        const chest = d.screenOf(t.pos.x, t.tall * 0.6, t.pos.z).y, tFeet = d.screenOf(t.pos.x, 0, t.pos.z).y, ground = d.screenOf(sol.pos.x, 0, sol.pos.z).y;
        const laptop = size.w >= 1200;
        const ok = head >= 4 && feet <= winTop && chest <= winTop - 8 && (!laptop || (tFeet <= winTop && ground <= winTop));
        worst[act === 'stoop' ? 'stoop' : 'rise'] = Math.min(worst[act === 'stoop' ? 'stoop' : 'rise'], head);
        say(ok, where + ', ' + (act === 'stoop' ? 'the stoop' : 'the rise') + ' at ' + t.kind + ': her head at y ' + head.toFixed(0) + ', her hanging feet ' + feet.toFixed(0) +
          ', the foe’s chest ' + chest.toFixed(0) + ' and feet ' + tFeet.toFixed(0) + ', her ground ' + ground.toFixed(0) + ' (the windows from ' + winTop + ')');
      }
    }
    // the whole field while she hangs
    {
      sol.m.action = 'stoopRise';
      const d = director(c.arena, size, all);
      d.shotField(2); d.settle();
      const head = d.screenOf(sol.pos.x, UP + sol.tall + BOB, sol.pos.z).y;
      worst.field = Math.min(worst.field, head);
      say(head >= 4, where + ', the whole field while she hangs: her head at y ' + head.toFixed(0));
      sol.m.action = '';
    }
    // gate 15's end: Sol learns Kestrel Stoop
    if (kind === 'halcyon') {
      const F = { sol: Object.assign(sol, { tyaw: 0, home: { yaw: 0 } }) };
      const d = director(c.arena, size, all, { F, cfg: { stoopLines: [] }, D: { sol: { hp: 100 } }, SND: any, UI, FX: any, untilP: async () => {}, wait: async () => {} });
      await d.run(ACT.learnStoop)();
      d.settle();
      const head = d.screenOf(sol.pos.x, UP + sol.tall + BOB, sol.pos.z).y;
      worst.learn = head;
      say(head >= top.learn, where + ', “Sol learns Kestrel Stoop”: her head at y ' + head.toFixed(0) + ' (the letterbox and the banner to ' + top.learn.toFixed(0) + ')');
    }
  }
  console.log(size.w + ' x ' + size.h + ': her head at the highest at y ' + Object.entries(worst).map(([k, v]) => k + ' ' + v.toFixed(0)).join(', '));
}
console.log(bad ? 'FAIL: ' + bad + ' shots lose her' : 'all good');
process.exit(bad ? 1 : 0);
