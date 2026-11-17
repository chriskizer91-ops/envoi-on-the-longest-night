// shots.mjs: opens a built map page headless at a phone's size and takes stills of set views; prints page errors and
// the page's own numbers.
// Usage: node moon-faire-witches/world-map/tools/shots.mjs dist/envoi-map-where.html <out dir> [--size 412x915] [--detail phone|laptop]
//   views (below): { name, io: place, open: [zones], view: { x, y, dist, yaw, tilt } or 'io' (as flown to Io), mist: 0 (none), bare: true (no names or buttons) }   [--only a,b]
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
  { name: 'whole', io: 'wickhollow', open: [1], view: { x: 2304, y: 1536, dist: 99999, yaw: 0, tilt: 0.95 } },
  { name: 'all-open', io: 'frozen-pass', open: [1, 2, 3, 4], view: { x: 2304, y: 1536, dist: 99999, yaw: 0, tilt: 0.95 } },
  { name: 'top-down', io: 'dawnroost', open: [1, 2, 3, 4], view: { x: 2304, y: 1536, dist: 99999, yaw: 0, tilt: 1.5 } },
  { name: 'land-from-above', io: 'dawnroost', open: [1, 2, 3, 4], mist: 0, bare: true, view: { x: 2304, y: 1536, dist: 3660, yaw: 0, tilt: 1.5 } }, // to hold beside the atlas (at 1152x768)
  { name: 'land-turned', io: 'dawnroost', open: [1, 2, 3, 4], mist: 0, bare: true, view: { x: 2304, y: 1700, dist: 4300, yaw: 0.55, tilt: 0.5 } },
  { name: 'wickhollow', io: 'wickhollow', open: [1], view: 'io' },
  { name: 'wickhollow-low', io: 'wickhollow', open: [1, 2], view: { dist: 520, tilt: 0.3, yaw: 0.6 } },
  { name: 'bogmire', io: 'bogmire', open: [1], view: 'io' },
  { name: 'dawnroost', io: 'dawnroost', open: [1, 2], view: 'io' },
  { name: 'crossroads', io: 'crossroads', open: [1, 2, 3], view: 'io' },
  { name: 'misthollow', io: 'misthollow', open: [1, 2, 3, 4], view: 'io' },
  { name: 'peaks-from-south', io: 'misthollow', open: [1, 2, 3, 4], view: { x: 3200, y: 700, dist: 1900, yaw: 0.5, tilt: 0.34 } },
  { name: 'peaks-in-mist', io: 'wickhollow', open: [1], view: { x: 3200, y: 700, dist: 1900, yaw: 0.5, tilt: 0.34 } },
  { name: 'trees-wickhollow', io: 'wickhollow', open: [1, 2], view: { x: 1300, y: 1905, dist: 150, yaw: 0.5, tilt: 0.3 } },
  { name: 'trees-leafy', io: 'wickhollow', open: [1, 2], view: { x: 1085, y: 1535, dist: 120, yaw: -0.4, tilt: 0.32 } },
  { name: 'trees-fen', io: 'bogmire', open: [1, 2], view: { x: 1930, y: 2330, dist: 130, yaw: 0.2, tilt: 0.3 } },
  { name: 'trees-frost', io: 'cold-moor', open: [1, 2, 3], view: { x: 1500, y: 700, dist: 140, yaw: 0.9, tilt: 0.3 } },
  { name: 'trees-snow', io: 'frozen-camp', open: [1, 2, 3, 4], view: { x: 2790, y: 1080, dist: 130, yaw: -0.6, tilt: 0.3 } },
  { name: 'trees-mid', io: 'dawnroost', open: [1, 2], view: { x: 1240, y: 1180, dist: 420, yaw: 0.3, tilt: 0.5 } },
  { name: 'trees-far-1', io: 'wickhollow', open: [1, 2], view: { x: 1085, y: 1535, dist: 330, yaw: -0.4, tilt: 0.42 } },
  { name: 'trees-far-2', io: 'wickhollow', open: [1, 2], view: { x: 1085, y: 1535, dist: 700, yaw: -0.4, tilt: 0.5 } },
  { name: 'trees-far-3', io: 'wickhollow', open: [1, 2], view: { x: 1085, y: 1535, dist: 1050, yaw: -0.4, tilt: 0.55 } },
  { name: 'peaks-close', io: 'misthollow', open: [1, 2, 3, 4], view: { x: 3300, y: 600, dist: 700, yaw: -0.7, tilt: 0.36 } },
  { name: 'peaks-above', io: 'misthollow', open: [1, 2, 3, 4], view: { x: 3200, y: 600, dist: 1700, yaw: 0, tilt: 1.1 } },
  { name: 'coast', io: 'wickhollow', open: [1, 2], view: { x: 620, y: 1750, dist: 420, yaw: 1.2, tilt: 0.38 } },
  { name: 'coast-low', io: 'wickhollow', open: [1, 2], view: { x: 560, y: 1500, dist: 160, yaw: 2.2, tilt: 0.24 } },
  { name: 'shore', io: 'wickhollow', open: [1, 2], view: { x: 470, y: 1560, dist: 260, yaw: -1.4, tilt: 0.33 } },
  { name: 'bay', io: 'wickhollow', open: [1, 2], view: { x: 1560, y: 1700, dist: 600, yaw: 0.3, tilt: 0.55 } },
  { name: 'river', io: 'wickhollow', open: [1, 2], view: { x: 1440, y: 1840, dist: 230, yaw: 0.4, tilt: 0.5 } },
  { name: 'town-wickhollow', io: 'jetty', open: [1, 2], view: { x: 1348, y: 1840, dist: 95, yaw: 0.35, tilt: 0.5 } },
  { name: 'town-bogmire', io: 'thornwood', open: [1, 2], view: { x: 1752, y: 2512, dist: 100, yaw: -0.4, tilt: 0.5 } },
  { name: 'town-dawnroost', io: 'dawnroost-road', open: [1, 2], view: { x: 1325, y: 1098, dist: 100, yaw: 0.3, tilt: 0.5 } },
  { name: 'town-misthollow', io: 'frozen-pass', open: [1, 2, 3, 4], view: { x: 3500, y: 735, dist: 100, yaw: 0.4, tilt: 0.5 } },
  { name: 'town-shipyard', io: 'crossroads', open: [1, 2, 3, 4], view: { x: 2097, y: 599, dist: 110, yaw: -0.3, tilt: 0.5 } },
  { name: 'town-far', io: 'jetty', open: [1, 2], view: { x: 1348, y: 1840, dist: 420, yaw: 0.35, tilt: 0.6 } },
  { name: 'castle', io: 'crossroads', open: [1, 2, 3, 4], view: { x: 2340, y: 1240, dist: 420, yaw: -0.5, tilt: 0.42 } },
  { name: 'mesas', io: 'crossroads', open: [1, 2, 3, 4], view: { x: 3650, y: 1750, dist: 1500, yaw: 2.2, tilt: 0.45 } },
  { name: 'west-from-sea', io: 'dawnroost', open: [1, 2, 3, 4], view: { x: 1100, y: 1500, dist: 2400, yaw: -1.5, tilt: 0.4 } },
];
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !/GL Driver Message|GPU stall/.test(m.text())) errors.push(m.type() + ': ' + m.text()); });
const t0 = Date.now();
await page.goto('file://' + page_ + '?test' + (opt('--detail', '') ? '&detail=' + opt('--detail', '') : ''), { waitUntil: 'load', timeout: 240000 });
await page.waitForFunction(() => window.__ready || /wrong/.test(document.getElementById('loadmsg').textContent), null, { timeout: 240000 });
console.log('loaded in', ((Date.now() - t0) / 1000).toFixed(1), 's', await page.evaluate(() => document.getElementById('loadmsg').textContent));
await page.evaluate(() => { document.getElementById('hint').style.display = 'none'; window.__map.stop(); });
console.log('on the map:', JSON.stringify(await page.evaluate(() => window.__map.stats)));
for (const v of VIEWS) {
  if (only && !only.split(',').includes(v.name)) continue;
  const r = await page.evaluate(async (v) => {
    const m = window.__map, P = window.MapPlaces;
    m.setOpen(v.open); m.mist(v.mist === undefined ? 1 : v.mist); await m.setIo(v.io, null, false);
    document.querySelector('.map-labels').style.display = v.bare ? 'none' : ''; for (const id of ['chip', 'move', 'find']) document.getElementById(id).style.display = v.bare ? 'none' : '';
    document.getElementById('chip-place').textContent = P.PLACES[v.io].name; document.getElementById('chip-zone').textContent = P.ZONES[P.PLACES[v.io].zone].name;
    const at = m.io.at;
    if (v.view === 'io') m.view = { x: at[0], y: at[1], dist: 1000, yaw: 0, tilt: 0.72 };
    else m.view = Object.assign({ x: at[0], y: at[1], yaw: 0, tilt: 0.72 }, v.view);
    for (let i = 0; i < 40; i++) m.step(1 / 30); // the camera settles on the ground's height
    m.render();
    const nb = m.numbers(); nb.kind = m.kindAt(m.view.x, m.view.y); return nb;
  }, v);
  const f = path.join(out, v.name + '.png');
  await page.screenshot({ path: f });
  console.log(v.name.padEnd(18), r.triangles + ' triangles, ' + r.calls + ' draw calls' + (r.models && (r.models.near || r.models.mid || r.models.far) ? ' · tree models: ' + r.models.near + ' detailed, ' + r.models.mid + ' middle, ' + r.models.far + ' light' : ''));
}
console.log(errors.length ? errors.join('\n') : '0 page errors');
await browser.close();
