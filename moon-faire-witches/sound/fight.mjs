// fight.mjs: plays fights of the built battle page (dist/battle.html) headless, to their end, with the sound really
// on, and reports what the sound did: every sound name the fight called and how often, any name called that the sound
// file doesn't have (missing: must be 0), any sound that failed while being made (errors: must be 0), which parts of
// the music played, and any page error. The sound is reached by wrapping makeBattleSound as the page loads; no file of
// the game is changed for it.
// Usage: node moon-faire-witches/sound/fight.mjs [dist/battle.html] [--fights band1,gate5] [--level 12] [--turbo 6] [--trance]
//   --trance: fills both witches' Trance gauges as the fight begins, so the trance sounds and the music's lift are played
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let pw; try { pw = require('/opt/npm-tools/node_modules/playwright'); } catch { pw = require('playwright'); }
const R = path.resolve(new URL('../..', import.meta.url).pathname);
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(k); return i < 0 ? d : args[i + 1]; };
const file = path.resolve(args[0] && !args[0].startsWith('--') ? args[0] : path.join(R, 'dist/battle.html'));
const fights = opt('--fights', 'band1').split(','), level = +opt('--level', 12), turbo = +opt('--turbo', 6), TRANCE = args.includes('--trance');
const browser = await pw.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 915, height: 412 } });
const errs = []; page.on('pageerror', (e) => errs.push('pageerror: ' + e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
// the sound is wrapped once the page has loaded (a wrapper set before load is replaced by the page's own
// `function makeBattleSound`, which is why the first version of this tool counted nothing); the battle makes its sound
// only when a fight starts, so it is always made through the wrapper
const wrapSound = () => {
  const real = window.makeBattleSound; window.__snd = { made: [], calls: {}, moods: [], starts: [] };
  window.makeBattleSound = (o) => {
    const S = real(o), T = window.__snd; T.made.push(S);
    const sfx = new Proxy({}, { get: (_, k) => (...a) => { T.calls[k] = (T.calls[k] || 0) + 1; return S.sfx[k](...a); } });
    const startMusic = (m) => { T.starts.push(m || 'battle'); return S.startMusic(m); };
    return new Proxy(S, { get: (o2, k) => (k === 'sfx' ? sfx : k === 'startMusic' ? startMusic : o2[k]) });
  };
  setInterval(() => { const T = window.__snd, S = T.made[T.made.length - 1]; if (S && S.musicOn && T.moods[T.moods.length - 1] !== S.mood) T.moods.push(S.mood); }, 100);
};
const t0 = Date.now(), log = (s) => console.log(((Date.now() - t0) / 1000).toFixed(0).padStart(5) + 's  ' + s);
await page.goto('file://' + file, { waitUntil: 'load', timeout: 180000 });
await page.waitForFunction(() => !!window.__arena, null, { timeout: 180000 });
await page.evaluate(wrapSound);
let bad = 0;
for (const id of fights) {
  await page.evaluate(() => { const T = window.__snd; T.calls = {}; T.moods = []; T.starts = []; });
  await page.evaluate(([i, l]) => { window.__arena.start(i, { level: l, watch: "expert" }); }, [id, level]);
  await page.waitForFunction(() => !!window.__battle, null, { timeout: 180000 });
  await page.evaluate((tb) => { window.__snd.made.forEach((S) => S.init()); window.__battle.turbo = tb; }, turbo);
  await page.waitForFunction(() => window.__battle.state === 'battle', null, { timeout: 600000, polling: 250 });
  if (TRANCE) await page.evaluate(() => { for (const h of window.__battle.engine.heroes) window.__battle.charge(h.key, { trance: true }); });
  await page.waitForFunction(() => window.__battle.state === 'over' && !document.getElementById('end').hidden, null, { timeout: 2400000, polling: 500 });
  const r = await page.evaluate(() => { const T = window.__snd, S = T.made[T.made.length - 1], B = window.__battle;
    return { outcome: B.result.outcome, t: Math.round(B.t), foes: B.engine.foes.map((f) => f.id).join(', '), calls: T.calls, moods: T.moods, starts: T.starts, missing: T.made.flatMap((x) => [...x.missing]), errors: T.made.flatMap((x) => x.errors), audio: S.names.length }; });
  const n = Object.values(r.calls).reduce((a, b) => a + b, 0);
  log(id + ' (' + r.foes + '): ' + r.outcome + ' after ' + r.t + ' s of battle. ' + n + ' sounds played, ' + Object.keys(r.calls).length + ' different. Missing ' + r.missing.length + ', errors ' + r.errors.length + '. Music asked for: ' + r.starts.join(', ') + '; parts heard: ' + r.moods.join(' > '));
  log('  ' + Object.entries(r.calls).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + v).join(', '));
  for (const m of r.missing.concat(r.errors)) log('  ! ' + m);
  bad += r.missing.length + r.errors.length;
  await page.evaluate(() => window.__arena.stop());
}
log('page errors: ' + errs.length); for (const e of errs.slice(0, 8)) log('  ! ' + e);
await browser.close();
process.exit(bad || errs.length ? 1 : 0);
