// look.mjs: headless pictures of a model, through look.html (Chromium with SwiftShader, through Playwright).
// Usage: node look.mjs <outDir> [--src a.js,b.js] [--fn makeIo] [--opts '{}'] [--light night|game|studio] [--size 1200x900]
//          [--eval 'js with m'] view ...
//   views: front | left | back | right | three | threeb | face | bust | hands | feet | act:<yaw>:<action>:<seconds> |
//          walk:<yaw>:<seconds> | cam:x,y,z:tx,ty,tz:fov       --info prints triangles, bones and draw calls
// Paths in --src are relative to look.html (this folder). three.js r128 is read from ../../.cache/three.min.js.
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const dir = path.dirname(new URL(import.meta.url).pathname);
const cache = path.join(dir, '../../.cache/three.min.js');
if (!fs.existsSync(cache)) { fs.mkdirSync(path.dirname(cache), { recursive: true }); execSync('npm pack three@0.128.0 --silent && tar xzf three-0.128.0.tgz package/build/three.min.js && mv package/build/three.min.js . && rm -rf package three-0.128.0.tgz', { cwd: path.dirname(cache) }); }
const [out, ...rest] = process.argv.slice(2);
let size = [1200, 900], info = false; const q = new URLSearchParams(); const views = [], evals = [];
for (let i = 0; i < rest.length; i++) {
  const a = rest[i];
  if (a === '--src') q.set('src', rest[++i]); else if (a === '--fn') q.set('fn', rest[++i]); else if (a === '--opts') q.set('opts', rest[++i]);
  else if (a === '--light') q.set('light', rest[++i]); else if (a === '--exp') q.set('exp', rest[++i]); else if (a === '--size') size = rest[++i].split('x').map(Number);
  else if (a === '--eval') evals.push(rest[++i]); else if (a === '--info') info = true; else if (a.startsWith('--q=')) { const [k, v] = a.slice(4).split('='); q.set(k, v || '1'); } else views.push(a);
}
q.set('w', size[0]); q.set('h', size[1]);
fs.mkdirSync(out, { recursive: true });
const browser = await pw.chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--allow-file-access-from-files', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: size[0], height: size[1] } });
const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
await page.goto('file://' + path.join(dir, 'look.html') + '?' + q.toString(), { waitUntil: 'load' });
await page.waitForFunction(() => window.__ready || window.__err, null, { timeout: 300000 });
const err = await page.evaluate(() => window.__err); if (err) { console.log(err); console.log(errs.join('\n')); process.exit(1); }
for (const e of evals) await page.evaluate((e) => { const m = window.__m; (0, eval)('(function(m){' + e + '})')(m); }, e);
let n = 0;
for (const v of views) {
  await page.evaluate((v) => window.__view(v), v);
  const f = path.join(out, String(++n).padStart(2, '0') + '-' + v.replace(/[:,]/g, '_') + '.png');
  await page.screenshot({ path: f }); console.log('shot', f);
}
if (info) console.log(JSON.stringify(await page.evaluate(() => window.__info())));
console.log(errs.length ? errs.slice(0, 20).join('\n') : 'no errors');
await browser.close();
