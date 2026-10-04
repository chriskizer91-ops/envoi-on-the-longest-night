// face.mjs: close-up pictures of Io's face from tools/face.html, headless (Chromium with SwiftShader, through Playwright),
// to compare the study's face and the cutscene face with Chris's paper doll. three.js comes from ../.cache/three.min.js.
// Usage, from this folder: node tools/face.mjs <outDir> [--size 800x800] [--detail 1] name:{json shot options} ...
//   e.g. node tools/face.mjs /tmp/f 'cut-front:{"who":"cut"}' 'cut-34:{"who":"cut","yaw":35}' 'study-front:{"who":"study"}'
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const dir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const [out, ...rest] = process.argv.slice(2);
let size = [800, 800], detail = 1; const shots = [];
for (let i = 0; i < rest.length; i++) {
  if (rest[i] === '--size') size = rest[++i].split('x').map(Number);
  else if (rest[i] === '--detail') detail = +rest[++i];
  else { const k = rest[i].indexOf(':'); shots.push([rest[i].slice(0, k), JSON.parse(rest[i].slice(k + 1))]); }
}
fs.mkdirSync(out, { recursive: true });
const browser = await pw.chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--allow-file-access-from-files', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: size[0], height: size[1] } });
const errs = []; page.on('pageerror', (e) => errs.push('pageerror: ' + e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
const t0 = Date.now();
await page.goto('file://' + path.join(dir, 'tools/face.html') + '?detail=' + detail, { waitUntil: 'load' });
await page.waitForFunction(() => (window.__face && window.__face.ready) || window.__err, null, { timeout: 600000 }).catch(() => {});
if (errs.length) { console.log(errs.join('\n')); process.exit(1); }
console.log('ready in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s', JSON.stringify(await page.evaluate(() => window.__face.ms)));
for (const [name, o] of shots) {
  const r = await page.evaluate((x) => window.__face.shot(x), o);
  const f = path.join(out, name + '.png'); await page.screenshot({ path: f });
  console.log(name, JSON.stringify(r));
}
console.log(errs.length ? errs.join('\n') : 'no errors');
await browser.close();
