// zone-test.mjs: walks Io through a zone page's exits, place to place, headless, and checks each switch: that she is in
// the right place, at the right spot (where the road's `at` puts her, or by the road the 3D moved out to a wild place's
// edge), on ground she can stand on, outside every exit, facing into the place with the camera behind her; and that
// nothing leaks: after each switch the screen's memory (renderer.info.memory: geometries, textures, and the shader
// programs), what is left with no place at all (between the two), and the page's JavaScript memory after a clean-up.
// Each place must come back to the same counts every time she enters it. Then (zone 1, or --resume) that reopening the
// page puts her back where she was (the shared save), (--world) that walking into a road out to the wide world shows
// the Magpie's card, and (zone 1, or --handback) the air-travel hook and the way back: opened with ?fly=<this page>,
// walking up to the Magpie goes there with her spot, and the page opens at it; and ?landing=<id> opens at a landing.
// Stills (--out): the fade with the next place's name, Io just arrived after each exit, the Magpie's card.
// Usage: node moon-faire-witches/world3d/tools/zone-test.mjs dist/zone-1.html [--route jetty,wickhollow,...]
//          [--out dir] [--size 412x915] [--resume] [--world] [--handback] [--route-only (zone 1: just the route)]
// The route starts where the page starts (the zone's first landing); each next place must be a road away.
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const args = process.argv.slice(2);
const page_ = path.resolve(args[0]);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const zoneN = +((path.basename(page_).match(/zone-(\d+)/) || [])[1] || 1);
const ROUTES = { 1: 'jetty,wickhollow,jetty,wickhollow,cottage,wickhollow,thornwood,bogmire,bogmire-heart,bogmire,thornwood,wickhollow' };
const route = (opt('--route', ROUTES[zoneN]) || '').split(',').filter(Boolean);
const out = opt('--out', null), [W, H] = opt('--size', '412x915').split('x').map(Number);
const ALL = zoneN === 1 && !args.includes('--route-only');
const RESUME = args.includes('--resume') || ALL, WORLD = args.includes('--world') || ALL, HANDBACK = args.includes('--handback') || ALL;
if (out) fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--js-flags=--expose-gc', '--enable-precise-memory-info'] });
const page = await (await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })).newPage();
const errors = [], said = {};
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { said[m.type()] = (said[m.type()] || 0) + 1; });
page.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !/GL Driver Message|GPU stall/.test(m.text())) errors.push(m.type() + ': ' + m.text()); });
let shot = 0;
const still = async (name) => { if (!out) return; const f = path.join(out, String(shot++).padStart(2, '0') + '-' + name + '.jpg'); await page.screenshot({ path: f, type: 'jpeg', quality: 84 }); console.log('  still:', path.basename(f)); };
const quiet = () => page.evaluate(() => { document.getElementById('load').style.display = 'none'; document.getElementById('toast').style.display = 'none'; });

async function open(q) {
  const t0 = Date.now();
  await page.goto('file://' + page_ + q, { waitUntil: 'load', timeout: 300000 });
  await page.waitForFunction(() => window.__ready || /wrong/.test(document.getElementById('loadmsg').textContent), null, { timeout: 300000 });
  const msg = await page.evaluate(() => document.getElementById('loadmsg').textContent);
  if (/wrong/.test(msg)) throw new Error(msg);
  await quiet();
  return ((Date.now() - t0) / 1000).toFixed(1);
}
// the counts, after a clean-up of the page's JavaScript memory
const measure = () => page.evaluate(() => {
  if (window.gc) window.gc();
  const w = window.__w3d, m = w.renderer.info.memory, heap = performance.memory ? performance.memory.usedJSHeapSize : null;
  return { geometries: m.geometries, textures: m.textures, programs: w.renderer.info.programs.length, heap: heap && +(heap / 1048576).toFixed(1), teardown: w.teardown || null };
});

// walk her into the road to `to` from a few metres inside it, steered by the thumb's input as a phone's would be,
// until the page starts the switch; how long she was inside the road's rectangle before it did
const walkInto = (to) => page.evaluate((to) => {
  const w = window.__w3d, Z = window.__zone, P = w.P, M = P.M;
  const r = Z.roads.find((q) => q.to === to);
  if (!r) return { why: 'no road from ' + Z.here + ' to ' + to };
  const o = Z.outward(P.place, r.rect), cx = (r.rect[0] + r.rect[2]) / 2, cy = (r.rect[1] + r.rect[3]) / 2, inRect = (x, y) => x >= r.rect[0] && x <= r.rect[2] && y >= r.rect[1] && y <= r.rect[3];
  // a spot 2 to 6 m in from the road, straight back from it (or a little to one side), clear all the way to it
  let s = null;
  const clear = (x, y) => { for (let i = 0; i <= 20; i++) if (!w.fits(x + (cx - x) * i / 20 - o[0] * 4, y + (cy - y) * i / 20 - o[1] * 4)) return false; return true; };
  for (const d of [60, 80, 100, 120, 150]) { for (const side of [0, 10, -10, 20, -20, 30, -30]) { const x = cx - o[0] * d - o[1] * side, y = cy - o[1] * d - o[0] * side; if (w.fits(x, y) && clear(x, y)) { s = [x, y]; break; } } if (s) break; }
  if (!s) return { why: 'no clear ground in front of the road to ' + to };
  const yaw = Math.atan2(o[0], o[1]); w.C.yaw = yaw + Math.PI; w.setIo(s[0], s[1], yaw); w.C.auto = 0; w.io.speed = 0;
  const goal = [cx + o[0] * 30, cy + o[1] * 30];
  let frames = 0, inside = 0;
  while (frames < 30 * 25 && !Z.switching) {
    const dx = M.x(goal[0]) - M.x(w.io.px), dz = M.z(goal[1]) - M.z(w.io.py), L = Math.hypot(dx, dz) || 1;
    const fx = -Math.sin(w.C.yaw), fz = -Math.cos(w.C.yaw), rx = Math.cos(w.C.yaw), rz = -Math.sin(w.C.yaw);
    w.push((dx * rx + dz * rz) / L, -(dx * fx + dz * fz) / L, 0.75); w.step(1 / 30, 30, false); frames++;
    if (inRect(w.io.px, w.io.py) && !Z.switching) inside++;
  }
  w.push(null);
  return { started: Z.switching, from: s.map(Math.round), seconds: +(frames / 30).toFixed(1), inside: +(inside / 30).toFixed(2), road: r.label };
}, to);

// where she should be after a road from `from` (worked out here from maps.js and the places' own exits)
const check = (from) => page.evaluate((from) => {
  const w = window.__w3d, Z = window.__zone, P = w.P, place = P.place, io = w.io, MAPS = window.MAPS;
  const road2d = MAPS[from].exits.find((e) => e.to === Z.here);
  const backs3d = place.exits || [], back2d = MAPS[Z.here].exits.find((e) => e.to === from);
  // the 3D road back: the 2D one's rectangle, else the one with its label (a wild place moves it out to its edge)
  const lab = (s) => String(s).toLowerCase().replace(/[’‘]/g, "'");
  const back3d = backs3d.find((e) => e.rect.join() === back2d.rect.join()) || backs3d.find((e) => lab(e.label) === lab(back2d.label));
  let want = road2d.at.slice();
  if (back3d && back3d.rect.join() !== back2d.rect.join()) want = [want[0] + ((back3d.rect[0] + back3d.rect[2]) - (back2d.rect[0] + back2d.rect[2])) / 2, want[1] + ((back3d.rect[1] + back3d.rect[3]) - (back2d.rect[1] + back2d.rect[3])) / 2];
  const r = back3d.rect, thin = r[2] - r[0] < r[3] - r[1], ox = thin ? Math.sign((r[0] + r[2]) / 2 - place.size[0] / 2) : 0, oy = thin ? 0 : Math.sign((r[1] + r[3]) / 2 - place.size[1] / 2);
  const facing = -(Math.sin(io.yaw) * ox + Math.cos(io.yaw) * oy);   // 1: straight in, away from the road she came by
  const camOff = Math.atan2(Math.sin(w.C.yaw - io.yaw - Math.PI), Math.cos(w.C.yaw - io.yaw - Math.PI));
  const inExit = backs3d.some((e) => io.px >= e.rect[0] - 6 && io.px <= e.rect[2] + 6 && io.py >= e.rect[1] - 6 && io.py <= e.rect[3] + 6);
  const off = Math.hypot((io.px - want[0]) * P.M.SX, (io.py - want[1]) * P.M.SZ);
  return { place: Z.here, at: [Math.round(io.px), Math.round(io.py)], want: want.map(Math.round), off: +off.toFixed(2), fits: w.fits(io.px, io.py), inExit, facing: +facing.toFixed(2), camOff: +camOff.toFixed(3), name: place.name };
}, from);

const t0 = Date.now();
console.log('zone', zoneN, '· loaded in', await open('?test'), 's');
const first = await page.evaluate(() => ({ here: window.__zone.here, have: window.__zone.have, at: [Math.round(window.__w3d.io.px), Math.round(window.__w3d.io.py)] }));
console.log('places on the page:', first.have.join(', '), '· starts at', first.here, first.at.join(','));
if (route.length && route[0] !== first.here) throw new Error('the route starts at ' + route[0] + ' but the page starts at ' + first.here);
await page.evaluate(() => window.__w3d.step(0.5, 30));
const counts = {}, rows = [];
const m0 = await measure(); counts[first.here] = [m0];
console.log(`  start   ${first.here.padEnd(15)} geometries ${m0.geometries}, textures ${m0.textures}, programs ${m0.programs}, heap ${m0.heap} MB`);
await still('start-' + first.here);

// the Magpie, where she's moored at the start (zone 1: at the end of the jetty's pier)
const toMagpie = () => page.evaluate(() => {
  const w = window.__w3d, Z = window.__zone, L = window.W3D_ZONES[Z.n].landings.find((l) => l.place === Z.here);
  if (!L) return null;
  const M = w.P.M; let frames = 0;
  while (frames < 30 * 12 && !document.getElementById('magpie').classList.contains('on')) {
    const dx = M.x(L.magpie[0]) - M.x(w.io.px), dz = M.z(L.magpie[1]) - M.z(w.io.py), D = Math.hypot(dx, dz) || 1;
    const fx = -Math.sin(w.C.yaw), fz = -Math.cos(w.C.yaw), rx = Math.cos(w.C.yaw), rz = -Math.sin(w.C.yaw);
    w.push((dx * rx + dz * rz) / D, -(dx * fx + dz * fz) / D, 0.6); w.step(1 / 30, 30, false); frames++;
  }
  w.push(null); w.step(0.3, 30);
  return { card: document.getElementById('magpie').classList.contains('on'), seconds: +(frames / 30).toFixed(1), at: [Math.round(w.io.px), Math.round(w.io.py)] };
});
const mag = await toMagpie();
if (mag) { console.log('The Magpie at the landing:', mag.card ? 'card shown' : 'NO CARD', 'after', mag.seconds, 's, Io at', mag.at.join(',')); await still('magpie-card'); await page.evaluate(() => document.getElementById('magpie').classList.remove('on')); }

let fails = mag && !mag.card ? 1 : 0, worldDone = !WORLD;
// a road to a place that isn't on this page yet: walking into it shows the road's name, and she stays
for (const to of await page.evaluate(() => window.__zone.roads.filter((r) => r.to !== 'world' && !window.__zone.have.includes(r.to)).map((r) => r.to))) {
  await page.evaluate(() => { document.getElementById('toast').textContent = ''; });
  const r = await walkInto(to);
  const said_ = await page.evaluate(() => document.getElementById('toast').textContent), stayed = await page.evaluate(() => !window.__zone.switching);
  const ok = !r.started && stayed && said_.indexOf(r.road) === 0;
  if (!ok) fails++;
  console.log((ok ? '  ok   ' : '  FAIL ') + 'the road to ' + to + ' (not built yet): ' + (r.started ? 'it switched' : 'she stays') + ', and it says "' + said_ + '"');
}
for (let i = 1; i < route.length; i++) {
  const from = route[i - 1], to = route[i];
  // a road out to the wide world, once (zone 1: the cottage's): the Magpie's card, and no switch
  if (!worldDone) {
    const wr = await page.evaluate(() => (window.__zone.roads.find((r) => r.to === 'world') || {}).label);
    if (wr) {
      worldDone = true;
      const r = await walkInto('world');
      await page.evaluate(() => window.__w3d.step(0.3, 30));
      const card = await page.evaluate(() => document.getElementById('magpie').classList.contains('on'));
      const ok = card && !r.started && await page.evaluate(() => !window.__zone.switching);
      if (!ok) fails++;
      console.log((ok ? '  ok   ' : '  FAIL ') + 'a road out to the wide world (' + r.road + ' from ' + from + '): ' + (card ? 'the Magpie\'s card' : 'no card') + (r.started ? ', and it switched' : ', no switch'));
      if (ok) await still('magpie-card-world-road');
      await page.evaluate(() => document.getElementById('magpie').classList.remove('on'));
    }
  }
  const w = await walkInto(to);
  if (!w.started) { fails++; console.log('  FAIL', from, '->', to + ':', w.why || 'walked ' + w.seconds + ' s and never went'); break; }
  const ts = Date.now();
  await page.waitForFunction(() => !window.__zone.switching, null, { timeout: 400000, polling: 200 });
  // the fade's card, as it shows while the next place is built (in a test run the build is over before a still can be
  // taken, so the card is shown again for it: the same card, with the place's name)
  if (i === 1) {
    await page.evaluate(() => { document.getElementById('fadename').textContent = window.__w3d.P.place.name; document.getElementById('fade').classList.add('on'); });
    await still('fade-card-' + to); await page.evaluate(() => document.getElementById('fade').classList.remove('on'));
  }
  const secs = ((Date.now() - ts) / 1000).toFixed(1);
  const c = await check(from), m = await measure();
  (counts[to] = counts[to] || []).push(m);
  const ok = c.place === to && c.fits && !c.inExit && c.off < 1.5 && c.facing > 0.9 && Math.abs(c.camOff) < 0.02;
  if (!ok) fails++;
  rows.push({ i, from, to, c, m, w, secs });
  console.log(`${ok ? '  ok  ' : '  FAIL'} ${String(i).padStart(2)} ${from} -> ${to}: in ${c.place} at ${c.at.join(',')} (the road puts her at ${c.want.join(',')}, ${c.off} m off), ` +
    `facing in ${c.facing}, camera behind ${c.camOff === 0 ? 'exactly' : c.camOff}; walked ${w.seconds} s, ${w.inside} s inside the road before it went; built in ${secs} s`);
  console.log(`         geometries ${m.geometries}, textures ${m.textures}, programs ${m.programs}, heap ${m.heap} MB · with no place at all: geometries ${m.teardown.geometries}, textures ${m.teardown.textures}`);
  await page.evaluate(() => window.__w3d.step(0.4, 30));
  if (i <= 2 || ['cottage', 'thornwood', 'bogmire-heart'].includes(to) && !rows.slice(0, -1).some((r) => r.to === to)) await still('arrived-' + to);
}

// the same place, the same counts, every time she enters it; and the same baseline with no place at all
console.log('Each place, every time she entered it (geometries / textures / programs):');
for (const id in counts) {
  const L = counts[id], same = L.every((q) => q.geometries === L[0].geometries && q.textures === L[0].textures);
  if (!same) fails++;
  console.log(`  ${same ? 'ok  ' : 'LEAK'} ${id.padEnd(15)} ${L.map((q) => q.geometries + ' / ' + q.textures + ' / ' + q.programs).join('  ·  ')}`);
}
const base = rows.map((r) => r.m.teardown).filter(Boolean);
const flat = base.every((b) => b.geometries === base[0].geometries && b.textures === base[0].textures);
if (!flat) fails++;
if (base.length) console.log(`  ${flat ? 'ok  ' : 'LEAK'} with no place at all, after each teardown: ${[...new Set(base.map((b) => b.geometries + ' / ' + b.textures))].join(', ')}`);
const heaps = [m0].concat(rows.map((r) => r.m)).map((q) => q.heap);
console.log('  JavaScript memory after each switch (MB):', heaps.join(', '));

// reopening the page puts her back where she was (?test&save keeps it for the test, as the phone does)
if (RESUME && rows.length) {
  await open('?test&save');
  const st = await page.evaluate(() => window.__zone.here);
  const target = rows[0].to;
  const r = await walkInto(target);
  if (r.started) await page.waitForFunction(() => !window.__zone.switching, null, { timeout: 400000, polling: 200 });
  await page.evaluate(() => { const w = window.__w3d; w.push(0, -1, 0.7); w.step(1.5, 30, false); w.push(null); w.step(0.5, 30, false); });
  const before = await page.evaluate(() => ({ here: window.__zone.here, at: [Math.round(window.__w3d.io.px), Math.round(window.__w3d.io.py)], yaw: +window.__w3d.io.yaw.toFixed(2) }));
  await page.evaluate(() => dispatchEvent(new Event('pagehide')));
  await open('?test&save');
  const after = await page.evaluate(() => ({ here: window.__zone.here, at: [Math.round(window.__w3d.io.px), Math.round(window.__w3d.io.py)], yaw: +window.__w3d.io.yaw.toFixed(2) }));
  const ok = after.here === before.here && Math.hypot(after.at[0] - before.at[0], after.at[1] - before.at[1]) <= 2 && Math.abs(after.yaw - before.yaw) < 0.01;
  if (!ok) fails++;
  console.log(`${ok ? '  ok  ' : '  FAIL'} reopened: started at ${st}, walked to ${before.here} ${before.at.join(',')}, back after reopening at ${after.here} ${after.at.join(',')} (facing ${before.yaw} then ${after.yaw})`);
  await page.evaluate(() => localStorage.removeItem('envoi3d-save'));
}
// the air-travel hook out, and the way back in: a page opened with ?fly=<page> goes there when she walks up to the
// Magpie, with her spot in its query; here that page is this one, so it opens again at her spot, as a flight hands back
if (HANDBACK) {
  await open('?test&fly=' + encodeURIComponent(path.basename(page_) + '?test'));
  const start = await page.evaluate(() => window.__zone.here);
  // the address the hook went to, as the page arrives (the page tidies its address once it has read the spot)
  const seen = [], onNav = (f) => { if (f === page.mainFrame()) seen.push(f.url()); };
  page.on('framenavigated', onNav);
  const nav = page.waitForNavigation({ timeout: 300000 });
  try { await toMagpie(); } catch (e) { /* the page went on while walking */ }
  await nav;
  await page.waitForFunction(() => window.__ready, null, { timeout: 300000 });
  page.off('framenavigated', onNav);
  const gone = seen.find((u) => /[?&]place=/.test(u)) || seen[0] || '';
  const q = new URL(gone).searchParams, back = await page.evaluate(() => ({ here: window.__zone.here, at: [Math.round(window.__w3d.io.px), Math.round(window.__w3d.io.py)], url: location.search }));
  const want = (q.get('at') || '').split(',').map(Number);
  let ok = q.get('zone') === String(zoneN) && q.get('place') === start && !!q.get('landing') && back.here === start && Math.hypot(back.at[0] - want[0], back.at[1] - want[1]) <= 2 && !/place=/.test(back.url);
  if (!ok) fails++;
  console.log(`${ok ? '  ok  ' : '  FAIL'} the hook went to ${gone.replace(/^.*\//, '')}, and the page opened at ${back.here} ${back.at.join(',')} (the address then ${back.url})`);
  const L = await page.evaluate((n) => window.W3D_ZONES[n].landings.filter((l) => window.__zone.have.includes(l.place)), zoneN);
  const Lb = L[L.length - 1];
  if (Lb) {
    await open('?test&landing=' + Lb.id);
    const at = await page.evaluate(() => ({ here: window.__zone.here, at: [Math.round(window.__w3d.io.px), Math.round(window.__w3d.io.py)] }));
    ok = at.here === Lb.place && Math.hypot(at.at[0] - Lb.stand[0], at.at[1] - Lb.stand[1]) <= 20;
    if (!ok) fails++;
    console.log(`${ok ? '  ok  ' : '  FAIL'} ?landing=${Lb.id}: opened at ${at.here} ${at.at.join(',')} (the landing's spot ${Lb.stand.join(',')})`);
  }
}
console.log('console messages:', JSON.stringify(said));
console.log((fails ? fails + ' failed' : 'all passed') + ' · ' + (errors.length ? errors.length + ' page errors:\n  ' + [...new Set(errors)].slice(0, 12).join('\n  ') : 'no page errors') + ' · ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s');
await browser.close();
process.exit(fails || errors.length ? 1 : 0);
