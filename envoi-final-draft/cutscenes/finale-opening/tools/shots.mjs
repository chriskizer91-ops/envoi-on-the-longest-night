// shots.mjs: pictures of the built page, headless (Chromium with SwiftShader, through Playwright), driven through its test
// hooks (window.__cs). three.js r128 is served from the repository's tools/node_modules (npm install --prefix tools, from
// the repository's top folder) in place of cdnjs. Usage, from this folder:
//   node tools/shots.mjs <outDir> [--q light|phone|laptop] [--size 915x412] step ...
//   steps, in order: at:<seconds> (play to there, then draw)  frames:<n> (each 1/30 s)  handover (the hand-over, as when
//   skipped)  speed:<seconds> (draw that many seconds of the film, one frame each 1/30 s, and report how fast)
//   eval:<js with cs = window.__cs>  wait:<ms>  shot:<name>
// Any error on the page is printed at the end; it ends with "no errors" when there were none.
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const dir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const three = path.resolve(dir, '../../../tools/node_modules/three/build/three.min.js');
if (!fs.existsSync(three)) { console.log('three.js r128 is missing: npm install --prefix tools, from the repository\'s top folder'); process.exit(1); }
const [out, ...rest] = process.argv.slice(2);
let size = [915, 412], q = 'phone'; const steps = [];
for (let i = 0; i < rest.length; i++) { if (rest[i] === '--q') q = rest[++i]; else if (rest[i] === '--size') size = rest[++i].split('x').map(Number); else steps.push(rest[i]); }
fs.mkdirSync(out, { recursive: true });
const browser = await pw.chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--allow-file-access-from-files', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: size[0], height: size[1] } });
const errs = []; page.on('pageerror', (e) => errs.push('pageerror: ' + e.message)); page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
await page.route('**/*', (r) => { const u = r.request().url(); if (u.includes('three.min.js')) return r.fulfill({ path: three, contentType: 'text/javascript' }); if (u.startsWith('file:') || u.startsWith('data:')) return r.continue(); return r.abort(); });
const t0 = Date.now();
await page.goto('file://' + path.join(dir, 'Finale_Opening_Cutscene.html') + '?test&q=' + q, { waitUntil: 'load' });
await page.waitForFunction(() => (window.__cs && window.__cs.ready) || window.__err, null, { timeout: 900000 });
const err = await page.evaluate(() => window.__err); if (err) { console.log(err); console.log(errs.join('\n')); process.exit(1); }
console.log('ready in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s', JSON.stringify(await page.evaluate(() => window.__cs.stats())));
// the film only: the page's covers are hidden for the pictures
await page.evaluate(() => { for (const id of ['load', 'start', 'endcard']) { const el = document.getElementById(id); if (el) el.hidden = true; } });
for (const s of steps) {
  const [k, ...v] = s.split(':'), arg = v.join(':'), t1 = Date.now();
  let r = null;
  if (k === 'at') r = await page.evaluate((t) => window.__cs.at(t, 2), +arg);
  else if (k === 'frames') r = await page.evaluate((n) => window.__cs.step(n), +arg);
  else if (k === 'handover') r = await page.evaluate(() => window.__cs.handover());
  else if (k === 'speed') {
    // draw arg seconds of the film from where it is, one frame each 1/30 s, timing the drawing (the browser waits for each)
    r = await page.evaluate((sec) => { const cs = window.__cs, n = Math.round(sec * 30), t = performance.now(); let o = null; for (let i = 0; i < n; i++) o = cs.step(1); const ms = (performance.now() - t) / n; return { frames: n, msPerFrame: +ms.toFixed(1), fps: +(1000 / ms).toFixed(1), last: o }; }, +arg);
  } else if (k === 'eval') r = await page.evaluate((js) => { const cs = window.__cs; return (0, eval)('(function(cs){' + js + '})')(cs); }, arg);
  else if (k === 'wait') { await page.waitForTimeout(+arg); continue; }
  else if (k === 'shot') { const f = path.join(out, arg + '.png'); await page.screenshot({ path: f, timeout: 240000 }); console.log('shot', f); continue; }
  console.log(s, JSON.stringify(r), ((Date.now() - t1) / 1000).toFixed(1) + ' s');
}
// SwiftShader's own notes when a picture is read back ("GPU stall due to ReadPixels") are the test browser's, not the page's
const real = errs.filter((e) => !/GL Driver Message/.test(e));
console.log(real.length ? real.slice(0, 16).join('\n') : 'no errors');
await browser.close();
