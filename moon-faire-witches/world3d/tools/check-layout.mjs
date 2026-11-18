// check-layout.mjs: two checks of a 3D place against its walking map. It opens the page: the second check builds the
// place in a headless browser (the engine and the place only, no Io and no textures: a few seconds), straight from
// the files, so it needs no build first. --no-page skips that check.
// 1. Does anything solid in a 3D place stand on ground Io can walk in the 2D game? For each building's footprint, each
//    wall and each lamp, the share of it that lies on the walking map's walk area (and outside its blocks).
// 2. The 2D walk in 3D: every point of the walking map's walk areas (less its blocks) on a 2 px grid, and every point of
//    each event's rect (the map's spots), against where Io can stand in the place as the engine builds it. How many
//    she can't stand on, with a few examples.
// Usage: node moon-faire-witches/world3d/tools/check-layout.mjs [place] [--no-page]
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const R = path.resolve(new URL('../../..', import.meta.url).pathname);
globalThis.window = globalThis;
require(path.join(R, 'src/game/maps.js'));
const id = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'wickhollow';
require(path.join(R, 'moon-faire-witches/world3d/places', id + '.js'));
const P = window.W3D_PLACES[id], M = window.MAPS[P.mapId];
const inPoly = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
const walkable = (x, y) => M.walk.concat((P.walkAdd || []).map((a) => a.poly || a)).some((p) => inPoly(p, x, y)) && !M.block.some((p) => inPoly(p, x, y));
const report = [];
const share = (name, pts) => { const n = pts.filter(([x, y]) => walkable(x, y)).length; report.push([name, n, pts.length]); };
for (const b of P.buildings) { const [x0, y0, x1, y1] = b.fp, pts = []; for (let x = x0 + 1; x < x1; x += 3) for (let y = y0 + 1; y < y1; y += 3) pts.push([x, y]); share('building ' + b.id, pts); }
for (const [i, w] of P.walls.entries()) { const pts = []; for (let k = 1; k < w.pts.length; k++) { const [ax, ay] = w.pts[k - 1], [bx, by] = w.pts[k], L = Math.hypot(bx - ax, by - ay); const nx = -(by - ay) / L, ny = (bx - ax) / L, half = (w.t / 2) / 0.045; for (let s = 0; s <= L; s += 2) for (const o of [-half, 0, half]) pts.push([ax + (bx - ax) * s / L + nx * o, ay + (by - ay) * s / L + ny * o]); } share('wall ' + i + ' ' + JSON.stringify(w.pts[0]), pts); }
for (const l of P.lamps || []) share('lamp ' + l.kind + ' ' + l.at, [l.at]);
// bushes and flower beds are solid now (anywhere that looks walkable is walkable, so what blocks must be off the paths)
for (const f of P.flowers || []) { const [x, y, r] = f, pts = [[x, y]]; for (let a = 0; a < 6.28; a += 0.8) pts.push([x + Math.cos(a) * r * 0.7 / 0.04, y + Math.sin(a) * r * 0.7 / 0.05]); share('bush ' + JSON.stringify(f), pts); }
let bad = 0;
for (const [n, k, of] of report) { if (k) { bad++; console.log((k / of * 100).toFixed(1).padStart(6) + '%  ' + n + ' (' + k + ' of ' + of + ' points on walkable ground)'); } }
console.log(bad ? bad + ' things touch walkable ground' : 'nothing solid stands on walkable ground (' + report.length + ' things checked)');

// ---- 2. the 2D walk in 3D ----
if (!process.argv.includes('--no-page')) {
  const { chromium } = require('/opt/npm-tools/node_modules/playwright');
  // the page is served from the repository's own files under one made-up address, so everything it loads is its own;
  // pictures are left out (a texture that doesn't load is a flat colour, and where she stands doesn't depend on them)
  const ORIGIN = 'http://w3d-check.local/', W3 = 'moon-faire-witches/world3d/';
  const scripts = ['tools/node_modules/three/build/three.min.js', 'src/game/maps.js', 'envoi-final-draft/items/items.js', W3 + 'engine/core.js', W3 + 'engine/paint.js',
    W3 + 'engine/world.js', W3 + 'places/' + id + '.js', W3 + 'places/' + id + '-trees.js'].filter((f) => fs.existsSync(path.join(R, f)));
  const html = '<!doctype html><meta charset="utf-8"><body>' + scripts.map((s) => '<script src="/' + s + '"></script>').join('') + '</body>';
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  try {
    const page = await (await browser.newContext({ viewport: { width: 412, height: 915 } })).newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.route('**/*', (rt) => {
      const u = rt.request().url();
      if (u === ORIGIN + W3 + 'check.html') return rt.fulfill({ status: 200, contentType: 'text/html', body: html });
      if (u.startsWith(ORIGIN) && /\.js$/.test(u)) { const f = path.join(R, decodeURIComponent(u.slice(ORIGIN.length))); if (f.startsWith(R) && fs.existsSync(f)) return rt.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(f) }); }
      return rt.fulfill({ status: 404, body: '' });
    });
    const t0 = Date.now();
    await page.goto(ORIGIN + W3 + 'check.html', { waitUntil: 'load', timeout: 120000 });
    const res = await page.evaluate(async (id) => {
      const place = window.W3D_PLACES[id], renderer = new THREE.WebGLRenderer({ canvas: document.createElement('canvas') });
      const P3 = await W3D.buildPlace(place, renderer), M = window.MAPS[place.mapId], inP = W3D.inPoly;
      const boxed = (ps) => ps.map((p) => { const b = [1e9, 1e9, -1e9, -1e9]; for (const [x, y] of p) { b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], y); b[2] = Math.max(b[2], x); b[3] = Math.max(b[3], y); } return { p, b }; });
      const WALK = boxed(M.walk), BLOCK = boxed(M.block), inAny = (L, x, y) => L.some((q) => x >= q.b[0] && x <= q.b[2] && y >= q.b[1] && y <= q.b[3] && inP(q.p, x, y));
      const in2D = (x, y) => inAny(WALK, x, y) && !inAny(BLOCK, x, y);
      // a 2 px grid over a box, at the odd pixels; what isn't walkable in 3D, grouped into 32 px tiles for the examples
      const sample = (b, keep) => {
        const out = { n: 0, bad: 0, off2D: 0, tiles: {} };
        for (let y = 2 * Math.floor(b[1] / 2) + 1; y <= b[3]; y += 2) for (let x = 2 * Math.floor(b[0] / 2) + 1; x <= b[2]; x += 2) {
          if (!keep(x, y)) continue;
          out.n++;
          if (P3.walkable(x, y)) continue;
          out.bad++; if (!in2D(x, y)) out.off2D++;
          const k = Math.floor(x / 32) * 32 + ',' + Math.floor(y / 32) * 32; (out.tiles[k] = out.tiles[k] || { n: 0, at: [x, y] }).n++;
        }
        out.tiles = Object.entries(out.tiles).sort((a, c) => c[1].n - a[1].n).slice(0, 5).map(([k, v]) => ({ tile: k, n: v.n, at: v.at }));
        return out;
      };
      const all = [1e9, 1e9, -1e9, -1e9]; for (const q of WALK) { all[0] = Math.min(all[0], q.b[0]); all[1] = Math.min(all[1], q.b[1]); all[2] = Math.max(all[2], q.b[2]); all[3] = Math.max(all[3], q.b[3]); }
      const walk = sample(all, in2D);
      const events = (M.spots || []).filter((s) => s.rect).map((s) => ({ id: s.id || s.kind, rect: s.rect, ...sample(s.rect, () => true) }));
      return { walk, events };
    }, id);
    const secs = ((Date.now() - t0) / 1000).toFixed(0), num = (v) => v.toLocaleString('en-US');
    const ex = (r) => r.tiles.map((t) => '(' + t.at.join(', ') + ')' + (t.n > 1 ? ' and ' + (t.n - 1) + ' more in its 32 px tile' : '')).join('; ');
    console.log('The 2D walk in 3D (the place built in a headless page, ' + secs + ' s): ' + num(res.walk.n) + ' points of the walk less its blocks, on a 2 px grid: ' +
      (res.walk.bad ? num(res.walk.bad) + ' not walkable in 3D' : 'every one walkable in 3D'));
    if (res.walk.bad) console.log('  e.g. ' + ex(res.walk));
    for (const e of res.events) {
      console.log('  event ' + e.id + ' ' + JSON.stringify(e.rect) + ': ' + num(e.n) + ' points, ' + (e.bad ? num(e.bad) + ' not walkable in 3D (' + num(e.off2D) + ' of them off the 2D walk too)' : 'every one walkable in 3D'));
      if (e.bad) console.log('    e.g. ' + ex(e));
    }
    if (!res.events.length) console.log('  (no event rects in the map\'s spots)');
    if (errors.length) console.log('page errors: ' + errors.join('; '));
  } finally { await browser.close(); }
}
