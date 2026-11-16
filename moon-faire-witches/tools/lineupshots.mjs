// lineupshots.mjs: stills of dist/lineup.html (Everyone Who Fights), headless, with the page's clock stepped (?test).
// Usage: node moon-faire-witches/tools/lineupshots.mjs <out dir> [--size 412x915] [--only id,id] [--moves]
//   Without --moves: one still of each model as it is picked. With --moves: also one still part-way through each of its
//   first moves.
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pw = require('/opt/npm-tools/node_modules/playwright');
const R = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const a = process.argv.slice(2); let out = a[0], size = [915, 412], only = null, moves = false, file = path.join(R, 'dist/lineup.html'), nMoves = 3;
for (let i = 1; i < a.length; i++) { if (a[i] === '--size') size = a[++i].split('x').map(Number); else if (a[i] === '--only') only = a[++i].split(','); else if (a[i] === '--moves') moves = true; else if (a[i] === '--n') nMoves = +a[++i]; else if (a[i] === '--file') file = path.resolve(a[++i]); }
fs.mkdirSync(out, { recursive: true });
const b = await pw.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: size[0], height: size[1] } });
const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto('file://' + file + '?test', { timeout: 180000 }); await p.waitForFunction(() => window.__ln && window.__ln.K.ready(), null, { timeout: 180000 });
const step = (s) => p.evaluate((s) => window.__ln.K.step(s, 30), s);
await step(1);
const ids = await p.evaluate(() => window.__ln.L.map((e) => e.id + ':' + e.group));
const log = [];
for (const ig of ids) {
  const [id, g] = ig.split(':'); if (only && !only.includes(id)) continue;
  await p.evaluate(([id, g]) => { window.__ln.group(g); window.__ln.pick(id); }, [id, g]); await step(1.5);
  await p.screenshot({ path: path.join(out, id + '.png') });
  const info = await p.evaluate(() => ({ cap: document.getElementById('cap').textContent, moves: [...document.querySelectorAll('#moves .chip')].map((c) => c.textContent) }));
  log.push(id + ': ' + info.moves.length + ' moves: ' + info.moves.join(' | ') + '\n   ' + info.cap);
  if (moves) {
    for (const mv of info.moves.slice(0, nMoves)) {
      await p.evaluate((mv) => window.__ln.play(mv), mv);
      let t = 0; const shotAt = 1.6; let shot = false;
      while (t < 30) { await step(0.4); t += 0.4; if (!shot && t >= shotAt) { await p.screenshot({ path: path.join(out, id + '-' + mv.replace(/[^a-z0-9]+/gi, '_') + '.png') }); shot = true; } if (!(await p.evaluate(() => window.__ln.busy))) break; }
    }
  }
}
fs.writeFileSync(path.join(out, 'log.txt'), log.join('\n') + '\nERRORS: ' + errs.length + '\n' + errs.slice(0, 10).join('\n'));
console.log(log.join('\n')); console.log('errors', errs.length, errs.slice(0, 6));
await b.close();
