// walls-test.mjs: the brief's check that Io walks from the Moonwell to each edge of the square without passing through a
// wall. In the built page, headless: for each goal, a path is found over the walkable ground (the walking map's own
// areas, less everything solid the 3D adds), and Io is steered along it by the same thumb input a phone gives, frame by
// frame at 30 frames a second. Every frame, where her feet are is checked: on walkable ground, outside every building.
// Then she is pushed straight at each building for six seconds: she must not get in.
// Usage: node moon-faire-witches/world3d/tools/walls-test.mjs dist/envoi-3d-wickhollow.html
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const page_ = path.resolve(process.argv[2]);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: 412, height: 915 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('file://' + page_ + '?test');
await page.waitForFunction(() => window.__ready, null, { timeout: 240000 });
const GOALS = null;   // the place's own: place.checks.goals
const res = await page.evaluate(async () => {
  const w = window.__w3d, P = w.P, M = P.M, out = [], GOALS = P.place.checks.goals;
  const box = P.place.buildings.map((b) => b.fp);
  const inHouse = (x, y) => box.some((f) => x > f[0] && x < f[2] && y > f[1] && y < f[3]);
  // a path over the walkable ground: A* on a 5 px grid, then thinned to the corners
  function find(sx, sy, tx, ty) {
    const C = 5, gi = (x) => Math.round(x / C), W = 1000, key = (i, j) => (j + 100) * W + (i + 100);
    const s = [gi(sx), gi(sy)], t = [gi(tx), gi(ty)], g = new Map(), came = new Map(), heap = [];
    const push = (f, k) => { heap.push([f, k]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
    const ij = (k) => [k % W - 100, Math.floor(k / W) - 100];
    const k0 = key(...s); g.set(k0, 0); push(0, k0);
    const done = new Set();
    while (heap.length) {
      const [, k] = pop(); if (done.has(k)) continue; done.add(k);
      const [i, j] = ij(k);
      if (Math.abs(i - t[0]) <= 1 && Math.abs(j - t[1]) <= 1) { const p = [[tx, ty]]; let q = k; while (q != null) { const [a, b] = ij(q); p.unshift([a * C, b * C]); q = came.get(q); } return p; }
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const ni = i + di, nj = j + dj, nk = key(ni, nj);
        if (done.has(nk) || !w.fits(ni * C, nj * C)) continue;
        const ng = g.get(k) + Math.hypot(di, dj);
        if (g.has(nk) && g.get(nk) <= ng) continue;
        g.set(nk, ng); came.set(nk, k); push(ng + Math.hypot(ni - t[0], nj - t[1]), nk);
      }
    }
    return null;
  }
  // steer her along the path with the thumb's own input, turned by the camera as a phone's would be
  function follow(path, maxSec) {
    let k = 1, frames = 0, bad = 0, house = 0, far = 0; const dt = 1 / 30;
    while (k < path.length && frames < maxSec * 30) {
      const [tx, ty] = path[k], dx = M.x(tx) - M.x(w.io.px), dz = M.z(ty) - M.z(w.io.py), L = Math.hypot(dx, dz);
      if (L < 0.35) { k++; continue; }
      const fx = -Math.sin(w.C.yaw), fz = -Math.cos(w.C.yaw), rx = Math.cos(w.C.yaw), rz = -Math.sin(w.C.yaw);
      const ix = (dx * rx + dz * rz) / L, iy = -(dx * fx + dz * fz) / L;
      w.push(ix, iy, 0.75); w.step(dt, 30, false); frames++;
      if (!P.walkable(w.io.px, w.io.py)) bad++;
      if (inHouse(w.io.px, w.io.py)) house++;
    }
    w.push(null);
    const [gx, gy] = path[path.length - 1]; far = Math.hypot(M.x(gx) - M.x(w.io.px), M.z(gy) - M.z(w.io.py));
    return { frames, bad, house, far, at: [Math.round(w.io.px), Math.round(w.io.py)], wp: path[Math.min(k, path.length - 1)] };
  }
  const MW = P.place.checks.from;
  for (const [name, x, y] of GOALS) {
    w.setIo(MW[0], MW[1], Math.PI); w.setCam(0); w.C.auto = 0; w.io.speed = 0;
    const p = find(MW[0], MW[1], x, y);
    if (!p) { out.push({ name, ok: false, why: 'no way there over walkable ground' }); continue; }
    const r = follow(p, 90);
    out.push({ name, ok: r.bad === 0 && r.house === 0 && r.far < 0.8, seconds: +(r.frames / 30).toFixed(1), metres: +(p.reduce((a, q, i) => i ? a + Math.hypot(M.x(q[0]) - M.x(p[i - 1][0]), M.z(q[1]) - M.z(p[i - 1][1])) : 0, 0)).toFixed(1), offWalk: r.bad, inHouse: r.house, endsFrom: +r.far.toFixed(2), at: r.at, wp: r.wp });
  }
  // straight at every building, from in front of it, for six seconds
  const push = [];
  for (const b of P.place.buildings) {
    const f = b.fp, cx = (f[0] + f[2]) / 2;
    let sy = null; for (let y = f[3] + 6; y < f[3] + 120; y += 3) if (w.fits(cx, y)) { sy = y; break; }
    if (sy == null) { push.push({ id: b.id, skipped: 'no ground in front' }); continue; }
    w.setIo(cx, sy, Math.PI); w.setCam(0); w.C.auto = 99;
    let inside = 0; w.push(0, -1, 1);
    for (let i = 0; i < 180; i++) { w.step(1 / 30, 30, false); if (inHouse(w.io.px, w.io.py)) inside++; }
    w.push(null);
    push.push({ id: b.id, frames: 180, inside, stoppedAt: Math.round(w.io.py), wall: f[3] });
  }
  return { out, push };
});
let fails = 0;
console.log('From the start to each edge and door (Io steered by thumb input, 30 frames a second):');
for (const r of res.out) { if (!r.ok) fails++; console.log((r.ok ? '  ok   ' : '  FAIL ') + r.name + (r.why ? ': ' + r.why : ': ' + r.metres + ' m in ' + r.seconds + ' s, frames off the walk ' + r.offWalk + ', inside a house ' + r.inHouse + ', ends ' + r.endsFrom + ' m from the goal' + (r.ok ? '' : ' (stopped at ' + r.at + ', heading for ' + r.wp + ')'))); }
console.log('Pushed straight at each building for 6 seconds:');
for (const r of res.push) { if (r.inside) fails++; console.log('  ' + (r.skipped ? 'skip ' : r.inside ? 'FAIL ' : 'ok   ') + r.id + (r.skipped ? ' (' + r.skipped + ')' : ': frames inside ' + r.inside + ', stopped at y ' + r.stoppedAt + ' (its wall at ' + r.wall + ')')); }
console.log(fails ? fails + ' failed' : 'all passed', errors.length ? '· page errors: ' + errors.join('; ') : '· no page errors');
await browser.close();
