// arena-test.mjs: plays the new battles' demo (dist/arena.html) headless (Chromium + SwiftShader, as game-test.mjs does)
// and reports any page error. Build it first: node tools/build.mjs demos/arena.html
// Usage: node tools/arena-test.mjs [dist/arena.html] [--fights band1,gate5,...] [--size 915x412] [--level 8]
//        [--weather clear|rain|storm] [--to shot|end|turns:N] [--at 6] [--turbo 6] [--seed N] [--out <dir>] [--jpg <dir>]
//   --fights: the demo's fight ids (first, band1 to band4, horror, colossus, gate5, gate10, gate15, finale); all by default
//   --seed: each fight's rolls (the wilds' pack, its foes' levels, the weather) come from a generator seeded with N and
//           the fight's id, so two runs (before and after a change) fight the same foes in the same weather; the fights
//           themselves play as they come
//   --to shot: each fight is watched (the expert play style) until it has run --at seconds of battle, then a moment at
//            normal speed and a screenshot; then the next hero's command is waited for, and what that frame costs to
//            draw (draw calls, triangles) is counted with the arena and without it (report.json has every count, and
//            how many stones and birds were up); in the first arena fight the Sharpness button is then pressed round
//            its three settings, each checked in the 3D layer's size;
//        end: the screenshot, then on to the fight's end card; turns:N: the screenshot, then on for N more turns'
//            worth of battle (about six seconds each)
//   --jpg: also save each screenshot as a small JPEG named after its place, for a README (a second fight in a place
//          adds its own name: eldergrove-horror.jpg, frostmere-colossus.jpg)
// three.js r128 comes from npm into tools/.cache, since the CDN is unreachable from the sandbox; the fonts are skipped.
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const R = path.resolve(new URL('..', import.meta.url).pathname);
const cache = path.join(R, 'tools/.cache/three.min.js');
fs.mkdirSync(path.dirname(cache), { recursive: true });
if (!fs.existsSync(cache)) execSync('npm pack three@0.128.0 --silent && tar xzf three-0.128.0.tgz package/build/three.min.js && mv package/build/three.min.js . && rm -rf package three-0.128.0.tgz', { cwd: path.dirname(cache) });
const THREE_JS = fs.readFileSync(cache);

const args = process.argv.slice(2);
let file = path.join(R, 'dist/arena.html'), out = path.join(R, 'tools/.cache/arena-test'), size = [915, 412], fights = null, level = null, weather = null, to = 'shot', at = 6, turbo = 6, jpg = null, seed = 0;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--fights') fights = args[++i].split(',');
  else if (args[i] === '--seed') seed = Math.abs(Math.round(+args[++i])) || 0;
  else if (args[i] === '--size') size = args[++i].split('x').map(Number);
  else if (args[i] === '--level') level = +args[++i];
  else if (args[i] === '--weather') weather = args[++i];
  else if (args[i] === '--to') to = args[++i];
  else if (args[i] === '--at') at = +args[++i];
  else if (args[i] === '--turbo') turbo = +args[++i];
  else if (args[i] === '--out') out = path.resolve(args[++i]);
  else if (args[i] === '--jpg') jpg = path.resolve(args[++i]);
  else file = path.resolve(args[i]);
}
fs.mkdirSync(out, { recursive: true }); if (jpg) fs.mkdirSync(jpg, { recursive: true });

const browser = await pw.chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: size[0], height: size[1] } });
const errs = [];
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
await page.route('**/*', (route) => {
  const u = route.request().url();
  if (u.includes('three.min.js')) return route.fulfill({ status: 200, contentType: 'application/javascript', body: THREE_JS });
  if (u.startsWith('file:') || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
  return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
});
const t0 = Date.now();
const log = (s) => console.log(((Date.now() - t0) / 1000).toFixed(1).padStart(6) + 's  ' + s);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// the frame's cost once it stops changing: three frames drawn since the change, one after another, that cost the same
// (the camera has finished easing into its shot, and any shaders the change needed are built)
async function settle() {
  const f0 = (await page.evaluate(() => window.__battle.drawn)).frame;
  let a = null, same = 0;
  for (let i = 0; i < 100 && same < 2; i++) {
    await sleep(300);
    const b = await page.evaluate(() => window.__battle.drawn);
    if (b.frame < f0 + 2 || (a && b.frame === a.frame)) continue;
    same = a && a.calls === b.calls && a.triangles === b.triangles ? same + 1 : 0; a = b;
  }
  return a;
}
async function waitFor(fn, arg, ms, what) {
  try { await page.waitForFunction(fn, arg, { timeout: ms, polling: 250 }); }
  catch (e) { await page.screenshot({ path: path.join(out, 'timeout-' + what.replace(/\W+/g, '-') + '.png') }); throw new Error('timed out waiting for ' + what); }
}
await page.goto('file://' + file, { waitUntil: 'load', timeout: 180000 });
await waitFor(() => !!window.__arena, null, 120000, 'the demo');
log('the demo is up at ' + size.join('x'));
await page.screenshot({ path: path.join(out, '00-list.png') });
const ids = fights || (await page.evaluate(() => window.__arena.FIGHTS.map((F) => F.id)));
const report = [], named = new Set();
let failed = false, sharpDone = false;
for (const id of ids) {
  const before = errs.length;
  try {
    const info = await page.evaluate(([id2, o, sd]) => {
      // --seed: the rolls made as the fight is set up come from a seeded generator, then the page's own comes back
      const own = Math.random;
      if (sd) { let s = sd % 2147483646 + 1; for (const ch of id2) s = (s * 31 + ch.charCodeAt(0)) % 2147483646 + 1; Math.random = () => (s = (s * 16807) % 2147483647) / 2147483647; }
      try { const c = window.__arena.start(id2, o); return { arena: c.arena || null, weather: c.weather || null, scene: c.scene }; }
      finally { Math.random = own; }
    }, [id, { level: level || undefined, weather: weather || undefined, watch: 'expert' }, seed]);
    await waitFor(() => !!window.__battle, null, 120000, id + ' to build');
    await page.evaluate((tb) => { window.__battle.turbo = tb; }, turbo);
    await waitFor(() => window.__battle && window.__battle.state === 'battle', null, 400000, id + ' to begin');
    const tb = await page.evaluate(() => window.__battle.t);
    await waitFor((t) => window.__battle && (window.__battle.t > t || window.__battle.state === 'over'), tb + at, 600000, id + ' to run ' + at + ' s');
    // a moment at normal speed, so the frame shows the fight as it plays
    await page.evaluate(() => { window.__battle.turbo = 1; });
    await sleep(2500);
    const drawn = await page.evaluate(() => {
      const B = window.__battle, A = B.arena, st = A ? A.stats : null;
      return Object.assign({ state: B.state, foes: B.engine.foes.map((f) => f.id + ' ' + f.level).join(', '), party: B.engine.heroes.map((h) => h.id + ' ' + h.level).join(', '), tufts: st ? st.liveTufts : 0, weather: A ? A.weather : null }, B.drawn);
    });
    const shot = path.join(out, id + '.png');
    await page.screenshot({ path: shot });
    // what a frame costs (--to shot): counted at the shot every turn opens on, the whole field with the party and its
    // foes all in view. The next hero's turn is left waiting for a command, the battle is paused there, and once the
    // camera has settled the frame is counted; then again without the arena (the fighters, effects and windows alone)
    if (to === 'shot') {
      await page.evaluate((t) => { window.__battle.auto = null; window.__battle.turbo = t; }, turbo);
      await waitFor(() => window.__battle.menuOpen || window.__battle.state === 'over', null, 600000, id + ' to wait for a command');
      await page.evaluate(() => { window.__battle.turbo = 0; });
      const full = await settle();
      Object.assign(drawn, full, { at: 'the command shot' });
      // what of the arena's own was up in that frame: the stones and clods still flying or lying, and the birds or bats
      // in the air (an arena that has these counts draws neither while there are none)
      Object.assign(drawn, await page.evaluate(() => { const A = window.__battle.arena, st = A && A.stats; return st && st.debris != null ? { debris: st.debris, birds: st.birds } : {}; }));
      if (info.arena) {
        await page.evaluate(() => { window.__battle.arena.root.visible = false; });
        const bare = await settle();
        await page.evaluate(() => { window.__battle.arena.root.visible = true; });
        drawn.fieldCalls = full.calls - bare.calls; drawn.fieldTriangles = full.triangles - bare.triangles;
      }
      await page.screenshot({ path: path.join(out, id + '-counted.png') });
      // the Sharpness button (once a run, in the first arena fight counted, on a page that has it): each press draws the
      // 3D at once at the next sharpness, 3/4 to half to full and back to 3/4, and keeps it for the next fight
      if (info.arena && !sharpDone && await page.evaluate(() => !!document.getElementById('sharp') && !!(window.__battle && window.__battle.sharp))) {
        sharpDone = true;
        const now = () => page.evaluate(() => Object.assign({ label: document.querySelector('#sharp span').textContent, kept: localStorage.getItem('envoi.sharp'), css: document.getElementById('gl').clientHeight }, window.__battle.sharp));
        const seen = [await now()];
        for (let k = 0; k < 3; k++) { await page.click('#sharp'); await sleep(500); seen.push(await now()); if (k === 0) await page.screenshot({ path: path.join(out, id + '-half-sharp.png') }); }
        const want = [0.75, 0.5, 1, 0.75];
        const bad = seen.filter((s, k) => s.sharp !== want[k] || Math.abs(s.ratio - s.dpr * want[k]) > 1e-6 || s.h !== Math.floor(s.css * s.ratio) || (k && s.kept !== String(want[k])));
        log('  the Sharpness button: ' + seen.map((s) => s.label).join(', ') + '; the 3D drawn ' + seen.map((s) => s.h).join(', ') + ' pixels tall on a stage ' + seen[0].css + ' tall' + (bad.length ? ': WRONG ' + JSON.stringify(seen) : ''));
        if (bad.length) failed = true;
      }
    }
    if (jpg) {
      // named after the place; a second fight in the same place (the Bramble Horror, the Colossus) adds its own name
      const sharp = createRequire(path.join(R, 'tools/package.json'))('sharp');
      let name = info.arena || info.scene || id;
      if (named.has(name)) name += '-' + id;
      named.add(name);
      await sharp(shot).jpeg({ quality: 72, mozjpeg: true }).toFile(path.join(jpg, name + '.jpg'));
    }
    log(id + ' (' + (info.arena || 'flat: ' + info.scene) + ', ' + (drawn.weather || 'clear') + '): ' + drawn.calls + ' draw calls, ' + Math.round(drawn.triangles / 1000) + 'k triangles' +
      (drawn.fieldCalls != null ? ' (the arena itself ' + drawn.fieldCalls + ' calls, ' + Math.round(drawn.fieldTriangles / 1000) + 'k triangles)' : '') + '; ' + drawn.party + ' against ' + drawn.foes + '; ' + drawn.tufts + ' live tufts' +
      (drawn.debris != null ? '; ' + drawn.debris + ' stones up, ' + drawn.birds + ' birds up' : ''));
    let outcome = null;
    if (to === 'end' || to.startsWith('turns:')) {
      await page.evaluate((t) => { window.__battle.turbo = t; }, turbo);
      if (to === 'end') {
        await waitFor(() => window.__battle && window.__battle.state === 'over' && !document.getElementById('end').hidden, null, 2400000, id + ' to end');
        outcome = await page.evaluate(() => ({ outcome: window.__battle.result.outcome, title: document.getElementById('endTitle').textContent, t: Math.round(window.__battle.t) }));
        await page.screenshot({ path: path.join(out, id + '-end.png') });
        log(id + ': ' + outcome.title + ' (' + outcome.outcome + ') after ' + outcome.t + ' s of battle');
      } else {
        const n = +to.slice(6), turns0 = await page.evaluate(() => window.__battle.engine.turnCount || window.__battle.engine.turns || 0);
        const tt = await page.evaluate(() => window.__battle.t);
        await waitFor(([t, k]) => window.__battle && (window.__battle.t > t + k * 6 || window.__battle.state === 'over'), [tt, n], 1200000, id + ' to play ' + n + ' turns');
        await page.screenshot({ path: path.join(out, id + '-later.png') });
        log(id + ': played on to ' + Math.round(await page.evaluate(() => window.__battle.t)) + ' s of battle (' + turns0 + ')');
      }
    }
    report.push({ id, arena: info.arena, weather: drawn.weather, calls: drawn.calls, triangles: drawn.triangles, fieldCalls: drawn.fieldCalls, fieldTriangles: drawn.fieldTriangles, party: drawn.party, foes: drawn.foes, tufts: drawn.tufts, debris: drawn.debris, birds: drawn.birds, outcome: outcome && outcome.outcome });
    await page.evaluate(() => window.__arena.stop());
  } catch (e) {
    failed = true; log(id + ': ' + e.message);
    try { await page.evaluate(() => window.__arena.stop()); } catch (e2) { /* the page is gone */ }
  }
  if (errs.length > before) { failed = true; log(id + ': errors:\n  ' + errs.slice(before, before + 8).join('\n  ')); }
}
fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 1));
await browser.close();
console.log(failed ? 'arena test FAILED' : 'arena test passed');
process.exit(failed ? 1 : 0);
