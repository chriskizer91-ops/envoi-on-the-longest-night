// Renders a built bench page headless (Chromium + SwiftShader) and screenshots it.
// Usage: node tools/check.mjs dist/noctara.html --out <dir> [--size 1280x800] [--wait 350] shot shot ...
//   shots: idle | <action>@<u> (u = 0 to 1 through the action) | <action>@<s>s (seconds in, for a model with no
//   ACTIONS table, such as an original) | view=close|full|square | before | after
//   --wait: real milliseconds before each screenshot, so damage numbers, which fade in with CSS, show up
// three.js r128 comes from npm into tools/.cache, since the CDN is unreachable from the sandbox.
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
const page_ = path.resolve(args.shift());
let out = path.join(R, 'tools/.cache/shots'), size = [1280, 800], wait = 350;
const shots = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--out') out = path.resolve(args[++i]);
  else if (args[i] === '--size') size = args[++i].split('x').map(Number);
  else if (args[i] === '--wait') wait = +args[++i];
  else shots.push(args[i]);
}
fs.mkdirSync(out, { recursive: true });
const browser = await pw.chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: size[0], height: size[1] } });
const errs = [];
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
await page.route('**/*', (route) => {
  const u = route.request().url();
  if (u.includes('three.min.js')) return route.fulfill({ status: 200, contentType: 'application/javascript', body: THREE_JS });
  if (u.startsWith('file:') || u.startsWith('data:')) return route.continue();
  return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
});
const t0 = Date.now();
await page.goto('file://' + page_, { waitUntil: 'load', timeout: 120000 });
await page.waitForFunction(() => window.__bench && window.__bench.ready, null, { timeout: 120000 });
await page.evaluate(() => { window.__bench.DBG.freeze = true; });
console.log('ready in', Date.now() - t0, 'ms; budget', JSON.stringify(await page.evaluate(() => window.__bench.budget)));
let n = 0;
for (const s of shots) {
  if (s.startsWith('view=')) { await page.evaluate((m) => window.__bench.setView(m), s.slice(5)); continue; }
  if (s === 'before' || s === 'after') { await page.evaluate((a) => window.__bench.setAfter(a), s === 'after'); console.log('model:', s, JSON.stringify(await page.evaluate(() => window.__bench.budget))); continue; }
  let name = s;
  if (s === 'idle') await page.evaluate(() => window.__bench.advance(1.2));
  else {
    const [act, u = '0.5'] = s.split('@');
    const secs = u.endsWith('s') ? +u.slice(0, -1) : null;
    const dur = await page.evaluate((a) => { const m = window.__bench.ctx.subject.m; return m.ACTIONS && m.ACTIONS[a] ? m.ACTIONS[a].dur : null; }, act);
    if (dur === null && secs === null) { console.log('no ACTIONS entry for', act + '; give the time in seconds instead, as', act + '@1.2s'); continue; }
    await page.evaluate((a) => { window.__bench.play(a); window.__bench.advance(1 / 60); }, act);
    await page.evaluate((sec) => window.__bench.advance(sec), secs !== null ? secs : dur * +u);
    name = act + '-' + (secs !== null ? String(secs).replace('.', '_') + 's' : String(Math.round(+u * 100)).padStart(3, '0'));
  }
  const file = path.join(out, String(++n).padStart(2, '0') + '-' + name + '.png');
  if (wait) await page.waitForTimeout(wait);
  await page.screenshot({ path: file });
  console.log('shot', path.relative(process.cwd(), file));
}
console.log(errs.length ? errs.slice(0, 12).join('\n') : 'no errors');
await browser.close();
