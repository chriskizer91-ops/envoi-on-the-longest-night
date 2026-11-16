// battleshots.mjs: stills of the new battle (dist/battle.html) at set moments of set moves, headless (Chromium +
// SwiftShader). A plan picks a fight and scripts the witches' turns; each scripted move is frozen at the fractions of its
// animation asked for and photographed (with the Flipbook look too when asked).
// Usage: node moon-faire-witches/tools/battleshots.mjs <plan.json> [--out dir] [--size 915x412]
// plan: { fight: 'band2', level: 10, weather: 'clear', seed: 3,
//         turns: [ { who: 'io', move: 'thorn', anim: ['thorn'], at: [0.4, 0.7], flip: false, prep: { trance: true } }, ... ] }
//   who: io or jester. move: the rules' move id (the menu's). anim: the model's action names to watch (the first one seen
//   is the move's). at: the fractions of that action to photograph. flip: each shot again with the Flipbook look.
//   prep: before her turn, { trance } her trance made ready, { fate: 'all' | 'first' } the foes' Fate set to their Life
//   (sealed), { foeHp: n } every foe down to n HP. Turns not scripted play as the expert would.
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pw = require('/opt/npm-tools/node_modules/playwright');
const R = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const args = process.argv.slice(2);
let planFile = null, out = '/tmp/sb/battleshots', size = [915, 412], file = path.join(R, 'dist/battle.html');
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--out') out = path.resolve(args[++i]);
  else if (args[i] === '--size') size = args[++i].split('x').map(Number);
  else if (args[i] === '--file') file = path.resolve(args[++i]);
  else planFile = args[i];
}
const plan = JSON.parse(fs.readFileSync(planFile, 'utf8'));
fs.mkdirSync(out, { recursive: true });
const browser = await pw.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: size[0], height: size[1] } });
const errs = [];
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
const t0 = Date.now(), log = (s) => console.log(((Date.now() - t0) / 1000).toFixed(1).padStart(6) + 's  ' + s);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await page.goto('file://' + file, { waitUntil: 'load', timeout: 180000 });
await page.waitForFunction(() => !!window.__arena, null, { timeout: 120000 });
await page.evaluate(() => { try { localStorage.setItem('mfw.flipbook', '0'); } catch (e) { /* none */ } });
log('page up');
await page.evaluate(([p]) => {
  const own = Math.random; let s = (p.seed || 1) % 2147483646 + 1;
  Math.random = () => (s = (s * 16807) % 2147483647) / 2147483647;
  try { window.__arena.start(p.fight, { level: p.level, weather: p.weather, watch: 'expert' }); } finally { Math.random = own; }
}, [plan]);
await page.waitForFunction(() => window.__battle && window.__battle.state === 'battle', null, { timeout: 600000, polling: 250 });
log('battle on');
// the script, the freezer and the record of every action each witch played
await page.evaluate(([turns]) => {
  const B = window.__battle, W = window;
  W.__turns = turns.map((t, i) => Object.assign({ i, done: false }, t)); W.__cur = null; W.__shot = null; W.__seen = []; W.__k = 0;
  W.__turbo = 3; B.turbo = 3;
  B.auto = (E, s, rand) => {
    const id = s.unit.id, nx = W.__turns.find((t) => !t.done && !t.started);
    if (nx && nx.who === id) {
      if (nx.prep && (!nx.prepped || nx.prep.fate || nx.prep.foeHp != null)) {
        const first = !nx.prepped; nx.prepped = true; const p = nx.prep;
        if (p.trance && first) { B.charge(s.unit.key, { trance: true }); if (nx.trance) { W.__cur = { name: nx.who + '-trance', who: nx.who, anim: nx.trance.anim, at: nx.trance.at, flip: nx.trance.flip }; W.__k = 0; } }
        if (p.foeHp != null) for (const f of E.foes) if (f.hp > 0) B.charge(f.key, { hp: Math.min(f.hp, p.foeHp) });
        if (p.fate) { const fs2 = E.foes.filter((f) => f.hp > 0); for (const f of p.fate === 'all' ? fs2 : fs2.slice(0, 1)) B.charge(f.key, { fate: f.hp }); }
        if (p.mp != null) B.charge(s.unit.key, { mp: p.mp });
        // a prepared change shows at its next turn: the menu is rebuilt from the engine's options
        if (p.trance && first) return W.BattleSim.POLICIES.expert(E, s, rand);
      }
      const o = s.options.find((x) => x.id === nx.move && x.ok);
      if (o) {
        nx.started = true; W.__cur = nx; W.__k = 0;
        const tg = nx.target === 'self' ? s.unit.key : o.targets && o.targets.length ? (nx.target ? o.targets.find((k) => k === nx.target) || o.targets[0] : o.targets[0]) : undefined;
        return [nx.move, tg];
      }
      W.__seen.push('skip ' + id + ' ' + nx.move + ' (' + (s.options.find((x) => x.id === nx.move) || { why: 'not known' }).why + ')');
    }
    return W.BattleSim.POLICIES.expert(E, s, rand);
  };
  const last = {};
  const tick = () => {
    const F = B.F;
    for (const k of ['io', 'jester']) { const f = F && F[k]; if (!f) continue; const a = f.m.action; if (a !== last[k]) { last[k] = a; W.__seen.push(k + ':' + a + '@' + B.t.toFixed(1)); } }
    const c = W.__cur;
    if (c && !W.__shot && F && F[c.who]) {
      const m = F[c.who].m, at = c.at || [];
      if (c.anim.includes(m.action) && W.__k < at.length && m.progress >= at[W.__k]) { B.turbo = 0; W.__shot = { name: c.name || (c.who + '-' + c.move), k: W.__k, p: m.progress, a: m.action }; W.__k++; }
      if (W.__k >= at.length) c.done = true;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}, [plan.turns]);
const n = plan.turns.length;
let shots = 0;
const deadline = Date.now() + (plan.minutes || 25) * 60000;
while (Date.now() < deadline) {
  const st = await page.evaluate(() => ({ shot: window.__shot, over: window.__battle.state === 'over', done: window.__turns.filter((t) => t.done).length }));
  if (st.shot) {
    const T = plan.turns.find((t) => (t.name || t.who + '-' + t.move) === st.shot.name) || plan.turns.map((t) => t.trance && Object.assign({ name: t.who + '-trance' }, t.trance)).find((t) => t && t.name === st.shot.name);
    await sleep(700);
    const base = st.shot.name + '-' + (st.shot.k + 1);
    await page.screenshot({ path: path.join(out, base + '.png') });
    log('shot ' + base + ' (' + st.shot.a + ' at ' + st.shot.p.toFixed(2) + ')'); shots++;
    if (T && T.flip) {
      await page.evaluate(() => window.__battle.flipbook(true)); await sleep(900);
      await page.screenshot({ path: path.join(out, base + '-flip.png') });
      await page.evaluate(() => window.__battle.flipbook(false)); await sleep(300);
    }
    await page.evaluate(() => { window.__shot = null; window.__battle.turbo = window.__turbo; });
    continue;
  }
  if (st.over || st.done >= n) break;
  await sleep(150);
}
const seen = await page.evaluate(() => window.__seen);
const res = await page.evaluate(() => ({ state: window.__battle.state, result: window.__battle.result, t: window.__battle.t }));
fs.writeFileSync(path.join(out, 'seen.json'), JSON.stringify({ seen, res, errs }, null, 1));
log(shots + ' shots; battle ' + res.state + ' at ' + res.t.toFixed(1) + ' s; ' + errs.length + ' errors');
for (const e of errs.slice(0, 8)) console.log('  ' + e);
await browser.close();
