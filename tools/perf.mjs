// Measures a bench page's model: the per-frame cost of animate() for the touched-up model and the original,
// idle and during one action, plus each one's budget. Usage: node tools/perf.mjs dist/<id>.html <action>
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const THREE_JS = fs.readFileSync(new URL('./.cache/three.min.js', import.meta.url));
const file = path.resolve(process.argv[2]), action = process.argv[3] || 'hurt';
const b = await pw.chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
await p.route('**/*', (r) => { const u = r.request().url(); if (u.includes('three.min.js')) return r.fulfill({ status: 200, contentType: 'application/javascript', body: THREE_JS }); if (u.startsWith('file:') || u.startsWith('data:')) return r.continue(); return r.fulfill({ status: 200, body: '' }); });
await p.goto('file://' + file, { waitUntil: 'load' });
await p.waitForFunction(() => window.__bench && window.__bench.ready);
const res = await p.evaluate((act) => {
  window.__bench.DBG.freeze = true;
  const out = {};
  for (const ver of ['after', 'before']) {
    window.__bench.setAfter(ver === 'after');
    const m = window.__bench.ctx.subject.m; let t = 0;
    const step = (wb) => (m.animate ? m.animate(0, wb, t += 1 / 60, 1 / 60) : m.update(t += 1 / 60, 1 / 60));
    for (let i = 0; i < 30; i++) step(0);
    const t0 = performance.now(); for (let i = 0; i < 300; i++) step(0.3); const idle = (performance.now() - t0) / 300;
    if (m.play) m.play(act, true);
    const t1 = performance.now(); for (let i = 0; i < 300; i++) step(0); const busy = (performance.now() - t1) / 300;
    out[ver] = { idleMs: +idle.toFixed(2), actionMs: +busy.toFixed(2), budget: window.__bench.budget };
  }
  return out;
}, action);
console.log(JSON.stringify(res, null, 1));
await b.close();
