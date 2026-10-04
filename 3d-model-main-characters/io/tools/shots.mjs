// shots.mjs: pictures of the built study page, headless (Chromium with SwiftShader, through Playwright), driven through
// its test hooks (window.__io). three.js is served from ../../.cache/three.min.js in place of cdnjs; the fonts fall back.
// Usage: node tools/shots.mjs <outDir> [--q medium|high|max] [--size 1280x800] step ...
//   steps, in order: eval:<js with io = window.__io>  frames:<n> (each 1/30 s)  shot:<name>  wait:<ms>
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const dir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const three = path.resolve(dir, '../.cache/three.min.js');
const [out, ...rest] = process.argv.slice(2);
let size = [1280, 800], q = 'high'; const steps = [];
for (let i = 0; i < rest.length; i++) { if (rest[i] === '--q') q = rest[++i]; else if (rest[i] === '--size') size = rest[++i].split('x').map(Number); else steps.push(rest[i]); }
fs.mkdirSync(out, { recursive: true });
const browser = await pw.chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--allow-file-access-from-files', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: size[0], height: size[1] } });
const errs = []; page.on('pageerror', (e) => errs.push('pageerror: ' + e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await page.route('**/*', (r) => { const u = r.request().url(); if (u.includes('three.min.js')) return r.fulfill({ path: three, contentType: 'text/javascript' }); if (u.startsWith('file:')) return r.continue(); return r.abort(); });
const t0 = Date.now();
await page.goto('file://' + path.join(dir, 'Io_Main_Character_Study.html') + '?test&q=' + q, { waitUntil: 'load' });
await page.waitForFunction(() => (window.__io && window.__io.ready) || window.__err, null, { timeout: 600000 });
const err = await page.evaluate(() => window.__err); if (err) { console.log(err); console.log(errs.join('\n')); process.exit(1); }
console.log('ready in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s', JSON.stringify(await page.evaluate(() => ({ ms: window.__io.E.ms, stats: window.__io.E.stats }))));
for (const s of steps) {
 const [k, ...v] = s.split(':'), arg = v.join(':');
 if (k === 'eval') await page.evaluate((js) => { const io = window.__io; return (0, eval)('(function(io){' + js + '})')(io); }, arg);
 else if (k === 'frames') await page.evaluate((n) => { for (let i = 0; i < n; i++) window.__io.frame(1 / 30, i < n - 1); }, +arg);
 else if (k === 'wait') await page.waitForTimeout(+arg);
 else if (k === 'shot') { const f = path.join(out, arg + '.png'); await page.screenshot({ path: f }); console.log('shot', f); }
}
console.log(errs.length ? errs.slice(0, 12).join('\n') : 'no errors');
await browser.close();
