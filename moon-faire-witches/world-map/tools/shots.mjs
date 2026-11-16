// shots.mjs: opens a built map page headless at a phone's size and takes stills of set views; prints page errors and
// the page's own numbers.
// Usage: node moon-faire-witches/world-map/tools/shots.mjs dist/envoi-map-where.html <out dir> [--size 412x915]
//   views (below): { name, io: place, open: [zones], view: { x, y, dist, yaw } or 'io' (flown to Io), touch: steps }
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const args = process.argv.slice(2);
const page_ = path.resolve(args[0]), out = path.resolve(args[1]);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const [W, H] = opt('--size', '412x915').split('x').map(Number);
const only = opt('--only', '');
const VIEWS = [
  { name: 'whole', io: 'wickhollow', open: [1], view: { x: 2304, y: 1536, dist: 99999, yaw: 0 } },
  { name: 'wickhollow', io: 'wickhollow', open: [1], view: 'io' },
  { name: 'wickhollow-close', io: 'wickhollow', open: [1], view: { dist: 520 } },
  { name: 'bogmire-heart', io: 'bogmire-heart', open: [1], view: 'io' },
  { name: 'dawnroost', io: 'dawnroost', open: [1, 2], view: 'io' },
  { name: 'dawnroost-wide', io: 'dawnroost', open: [1, 2], view: { dist: 3300 } },
  { name: 'crossroads', io: 'crossroads', open: [1, 2, 3], view: 'io' },
  { name: 'misthollow', io: 'misthollow', open: [1, 2, 3, 4], view: 'io' },
  { name: 'misthollow-turned', io: 'misthollow', open: [1, 2, 3, 4], view: { dist: 900, yaw: 2.4 } },
  { name: 'all-open', io: 'frozen-pass', open: [1, 2, 3, 4], view: { x: 2304, y: 1536, dist: 99999, yaw: 0 } },
];
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !/GL Driver Message|GPU stall/.test(m.text())) errors.push(m.type() + ': ' + m.text()); });
const t0 = Date.now();
await page.goto('file://' + page_ + '?test', { waitUntil: 'load', timeout: 240000 });
await page.waitForFunction(() => window.__ready || /wrong/.test(document.getElementById('loadmsg').textContent), null, { timeout: 240000 });
console.log('loaded in', ((Date.now() - t0) / 1000).toFixed(1), 's', await page.evaluate(() => document.getElementById('loadmsg').textContent));
await page.evaluate(() => { document.getElementById('hint').style.display = 'none'; window.__map.stop(); });
for (const v of VIEWS) {
  if (only && !only.split(',').includes(v.name)) continue;
  const r = await page.evaluate(async (v) => {
    const m = window.__map, P = window.MapPlaces;
    m.setOpen(v.open); await m.setIo(v.io, null, false);
    document.getElementById('chip-place').textContent = P.PLACES[v.io].name; document.getElementById('chip-zone').textContent = P.ZONES[P.PLACES[v.io].zone].name;
    const at = m.io.at;
    if (v.view === 'io') m.view = { x: at[0], y: at[1], dist: 1150, yaw: 0 };
    else m.view = Object.assign({ x: at[0], y: at[1], yaw: 0 }, v.view);
    for (let i = 0; i < 40; i++) m.step(1 / 30); // the camera settles on the ground's height
    m.render();
    return m.numbers();
  }, v);
  const f = path.join(out, v.name + '.png');
  await page.screenshot({ path: f });
  console.log(v.name.padEnd(18), r.triangles + ' triangles, ' + r.calls + ' draw calls');
}
console.log(errors.length ? errors.join('\n') : '0 page errors');
await browser.close();
