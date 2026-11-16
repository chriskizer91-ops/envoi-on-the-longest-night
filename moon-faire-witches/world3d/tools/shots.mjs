// shots.mjs: plays a built 3D place headless at a phone's size and takes stills: Io at set spots with the camera behind
// her, and the guide (the painting from above). Prints page errors and the page's own numbers.
// Usage: node moon-faire-witches/world3d/tools/shots.mjs dist/envoi-3d-wickhollow.html <out dir> [--size 412x915] [--plan plan.json]
//   plan: [{ "name": "start", "io": [777, 600, 3.14], "cam": [yaw, pitch], "walk": [x, y, mag, seconds], "guide": true }]
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const args = process.argv.slice(2);
const page_ = path.resolve(args[0]), out = path.resolve(args[1]);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const [W, H] = opt('--size', '412x915').split('x').map(Number);
const plan = JSON.parse(fs.readFileSync(opt('--plan', path.join(path.dirname(new URL(import.meta.url).pathname), 'plan-wickhollow.json')), 'utf8'));
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !/GL Driver Message/.test(m.text())) errors.push(m.type() + ': ' + m.text()); });
const t0 = Date.now();
await page.goto('file://' + page_ + '?test', { waitUntil: 'load', timeout: 240000 });
await page.waitForFunction(() => window.__ready || /wrong/.test(document.getElementById('loadmsg').textContent), null, { timeout: 240000 });
console.log('loaded in', ((Date.now() - t0) / 1000).toFixed(1), 's', await page.evaluate(() => document.getElementById('loadmsg').textContent));
await page.evaluate(() => { document.getElementById('load').style.display = 'none'; document.getElementById('toast').style.display = 'none'; });
const info = await page.evaluate(() => ({ stats: window.__w3d.P.stats, used: window.__w3d.P.used, io: window.__w3d.numbers().io }));
console.log('world:', JSON.stringify(info.stats), '· Io:', info.io, 'triangles');
console.log('textures:', Object.entries(info.used).map(([k, v]) => k + ' ' + v).join(', '));
let n = 0;
for (const p of plan) {
  const r = await page.evaluate(async (p) => {
    const w = window.__w3d;
    w.guide(!!(p.guide || p.top), !p.top);
    if (p.io) w.setIo(p.io[0], p.io[1], p.io[2]);
    if (p.cam) w.setCam(p.cam[0], p.cam[1], p.cam[2]); else w.C.auto = 0;
    w.P.scene.updateMatrixWorld();
    if (p.walk) { w.push(p.walk[0], p.walk[1], p.walk[2]); w.step(p.walk[3], 30); w.push(null); }
    // { "to": [x, y] }: steered there by the thumb's input, turned by the camera, as a phone's would be
    if (p.to) {
      const M = w.P.M;
      for (let f = 0; f < 30 * 40; f++) {
        const dx = M.x(p.to[0]) - M.x(w.io.px), dz = M.z(p.to[1]) - M.z(w.io.py), L = Math.hypot(dx, dz);
        if (L < 0.4) break;
        const fx = -Math.sin(w.C.yaw), fz = -Math.cos(w.C.yaw), rx = Math.cos(w.C.yaw), rz = -Math.sin(w.C.yaw);
        w.push((dx * rx + dz * rz) / L, -(dx * fx + dz * fz) / L, p.mag || 0.75); w.step(1 / 30, 30, false);
      }
      w.push(null);
    }
    const t0 = performance.now(); const num = w.step(p.settle || 0.5, 30); const ms = (performance.now() - t0);
    const t1 = performance.now(); w.render(); const one = performance.now() - t1;
    return { num, at: [Math.round(w.io.px), Math.round(w.io.py)], one: +one.toFixed(1) };
  }, p);
  const f = path.join(out, String(n++).padStart(2, '0') + '-' + p.name + '.jpg');
  await page.screenshot({ path: f, type: 'jpeg', quality: 84 });
  console.log(path.basename(f), 'Io at', r.at.join(','), '·', r.num.triangles, 'triangles,', r.num.calls, 'draw calls, one frame', r.one, 'ms (software)');
}
console.log(errors.length ? errors.length + ' page errors:\n  ' + [...new Set(errors)].slice(0, 12).join('\n  ') : 'no page errors');
await browser.close();
