// Usage: node tools/turnaround/render.mjs <model> <fn> <outDir> [--light studio] [--size 1600x900] [--q k=v] view ...
//   views: front | left | back | right | three | face[:front|three] | bust | <kind>:<yaw>:<action>:<seconds>
//   --q anchor=<name> makes face frame another anchor (chest, blade, orb...); --q fov=<deg> sets the close-up's lens (6)
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const dir = path.dirname(new URL(import.meta.url).pathname);
const cache = path.join(dir, '../.cache/three.min.js');
if (!fs.existsSync(cache)) { fs.mkdirSync(path.dirname(cache), { recursive: true }); execSync('npm pack three@0.128.0 --silent && tar xzf three-0.128.0.tgz package/build/three.min.js && mv package/build/three.min.js . && rm -rf package three-0.128.0.tgz', { cwd: path.dirname(cache) }); }
const [model, fn, out, ...rest] = process.argv.slice(2);
let size = [1600, 900]; const q = new URLSearchParams({ model, fn }); const views = []; const evals = [];
for (let i = 0; i < rest.length; i++) {
  if (rest[i] === '--light') q.set('light', rest[++i]);
  else if (rest[i] === '--size') size = rest[++i].split('x').map(Number);
  else if (rest[i] === '--q') { const [k, v] = rest[++i].split('='); q.set(k, v); }
  else if (rest[i] === '--eval') evals.push(rest[++i]);
  else views.push(rest[i]);
}
q.set('w', size[0]); q.set('h', size[1]);
fs.mkdirSync(out, { recursive: true });
const browser = await pw.chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: size[0], height: size[1] } });
const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await page.goto('file://' + path.join(dir, 'turnaround.html') + '?' + q.toString(), { waitUntil: 'load' });
await page.waitForFunction(() => window.__ready || window.__err, null, { timeout: 120000 });
const err = await page.evaluate(() => window.__err); if (err) { console.log(err); process.exit(1); }
for (const e of evals) await page.evaluate((e) => { const m = window.__m; (0, eval)('(function(m){' + e + '})')(m); }, e);
let n = 0;
for (const v of views) { await page.evaluate((v) => window.__view(v), v); const f = path.join(out, String(++n).padStart(2, '0') + '-' + v.replace(/:/g, '_') + '.png'); await page.screenshot({ path: f }); console.log('shot', f); }
console.log(errs.length ? errs.join('\n') : 'no errors');
await browser.close();
