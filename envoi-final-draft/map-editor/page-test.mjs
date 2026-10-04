// page-test.mjs: drives the built map editor headless (Chromium, as tools/game-test.mjs does) with the mouse and
// keyboard, and fails on any page error. Build the page first:
//   node tools/build.mjs envoi-final-draft/map-editor/map-editor.html
// Usage: node envoi-final-draft/map-editor/page-test.mjs [dist/map-editor.html] [--out <dir>]
// First every step of the Walking Paths page's own test (envoi-game-pass-3/map-paths/page-test.mjs), since the map
// editor keeps its path tools as they were: zoom, drag, add and delete points, undo and redo, Smooth, new shapes, people
// and arrivals moved, the reach check, walking Io, the edits kept after a reload, download and check-edits.mjs, the
// cottage's steps, the page at phone width, and sending through a stand-in store (where Send everything new now sends
// the keepsakes too). Then the keepsakes: the two hidden ones where they lie today, one put on a map and found within
// reach, one out of reach and dragged back in, undo and redo, Delete, a note, walking Io to one and its card, sending
// one document per keepsake, everything kept after a reload, and the page at phone width.
// Each step saves a screenshot in --out (tools/.cache/map-editor-test by default). Exits 1 on any page error or failed
// step.
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { execSync, spawnSync } from 'child_process';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const HERE = path.dirname(new URL(import.meta.url).pathname), R = path.resolve(HERE, '../..');
const args = process.argv.slice(2);
let file = path.join(R, 'dist/map-editor.html'), out = path.join(R, 'tools/.cache/map-editor-test');
for (let i = 0; i < args.length; i++) { if (args[i] === '--out') out = path.resolve(args[++i]); else file = path.resolve(args[i]); }
fs.mkdirSync(out, { recursive: true });

const t0 = Date.now(), errs = [], fails = [];
const log = (s) => console.log(((Date.now() - t0) / 1000).toFixed(1).padStart(6) + 's  ' + s);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const check = (ok, what) => { if (ok) log('  ok: ' + what); else { fails.push(what); log('  FAILED: ' + what); } };

const browser = await pw.chromium.launch();
async function openPage(ctx, tag) {
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push(tag + ' pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(tag + ' console: ' + m.text()); });
  await page.route('**/*', (route) => {
    const u = route.request().url();
    if (u.startsWith('file:') || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
    errs.push(tag + ' reached for the web: ' + u.slice(0, 120)); return route.abort();
  });
  await page.goto('file://' + file);
  await page.waitForFunction(() => window.MapPaths && MapPaths.dbState !== 'waiting' && MapPaths.painted, null, { timeout: 20000, polling: 100 });
  await sleep(300);
  return page;
}
const ctx = await browser.newContext({ viewport: { width: 1366, height: 820 }, acceptDownloads: true });
let page = await openPage(ctx, 'main');
const shot = (name) => page.screenshot({ path: path.join(out, name + '.png') });
const ev = (fn, arg) => page.evaluate(fn, arg);
const W = () => ev(() => MapPaths.works[MapPaths.map]);
const toScreen = (p) => ev(([x, y]) => { const v = MapPaths.view, r = document.getElementById('mp-cv').getBoundingClientRect(); return [r.left + (x - v.x) * v.z, r.top + (y - v.y) * v.z]; }, p);
async function dragMap(from, to) {
  const a = await toScreen(from), b = await toScreen(to);
  await page.mouse.move(a[0], a[1]); await page.mouse.down();
  for (let i = 1; i <= 10; i++) { await page.mouse.move(a[0] + (b[0] - a[0]) * i / 10, a[1] + (b[1] - a[1]) * i / 10); await sleep(16); }
  await page.mouse.up(); await sleep(120);
}
async function clickMap(p, opts) { const a = await toScreen(p); await page.mouse.click(a[0], a[1], opts); await sleep(120); }

try {
  log('open: ' + path.relative(R, file));
  const w0 = await W();
  check(await ev(() => MapPaths.map) === 'wickhollow', 'the page opens on Wickhollow');
  check(await ev(() => !document.getElementById('mp-download').hidden && document.getElementById('mp-send-row').hidden), 'outside claude.ai it offers Download, not Send');
  await shot('01-open');

  log('zoom in round the west stairs');
  const z0 = await ev(() => MapPaths.view.z), p0 = w0.walk[0][0];
  const s0 = await toScreen(p0); await page.mouse.move(s0[0], s0[1]);
  for (let i = 0; i < 3; i++) { await page.mouse.wheel(0, -300); await sleep(60); }
  await sleep(150);
  check(await ev(() => MapPaths.view.z) > z0 * 1.5, 'the wheel zooms in');
  await shot('02-zoom');

  log('drag a point');
  await dragMap(p0, [p0[0] - 12, p0[1] - 10]);
  let w = await W();
  check(Math.abs(w.walk[0][0][0] - (p0[0] - 12)) <= 1 && Math.abs(w.walk[0][0][1] - (p0[1] - 10)) <= 1, 'walk area 1, point 1 moved from ' + p0 + ' to ' + w.walk[0][0]);
  await shot('03-drag-point');

  log('add a point: double-click an edge');
  // an edge of the square's walk area in view, long enough, its 35% point clear of every other shape and their edges
  // (Chris's tracing has shapes close together, so the edge is found rather than fixed)
  const n0 = w.walk[0].length, rect = await ev(() => { const r = document.getElementById('mp-cv').getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; });
  const inside = (c, poly) => { let o = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > c[1]) !== (yj > c[1]) && c[0] < (xj - xi) * (c[1] - yi) / (yj - yi) + xi) o = !o; } return o; };
  const segD = (c, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((c[0] - a[0]) * dx + (c[1] - a[1]) * dy) / L2)); return Math.hypot(c[0] - a[0] - t * dx, c[1] - a[1] - t * dy); };
  const others = w.walk.slice(1).concat(w.block, w.front.map((f) => f.pts));
  let ek = -1, q = null;
  for (let k = 1; k < n0 - 1 && ek < 0; k++) {
    const a = w.walk[0][k], b = w.walk[0][k + 1], c = [a[0] + (b[0] - a[0]) * 0.35, a[1] + (b[1] - a[1]) * 0.35], sc = await toScreen(c);
    if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 40 || sc[0] < rect[0] + 20 || sc[0] > rect[2] - 20 || sc[1] < rect[1] + 20 || sc[1] > rect[3] - 20) continue;
    if (others.some((poly) => inside(c, poly) || poly.some((v, i) => segD(c, v, poly[(i + 1) % poly.length]) < 14))) continue;
    if (w.walk[0].some((v) => Math.hypot(v[0] - c[0], v[1] - c[1]) < 12)) continue;
    ek = k; q = c;
  }
  check(ek > 0, 'an edge in view to add a point to: ' + (ek > 0 ? 'edge ' + ek + ', at ' + q.map(Math.round) : 'none found'));
  const sq = await toScreen(q); await page.mouse.dblclick(sq[0], sq[1]); await sleep(150);
  w = await W();
  check(w.walk[0].length === n0 + 1, 'the edge has a new point (' + n0 + ' → ' + w.walk[0].length + ' points), at ' + JSON.stringify(w.walk[0][ek + 1]));
  await shot('04-add-point');

  log('undo and redo');
  await page.keyboard.press('Control+z'); await sleep(120);
  check((await W()).walk[0].length === n0, 'Ctrl+Z takes the new point away');
  await shot('05-undo');
  await page.keyboard.press('Control+Shift+z'); await sleep(120);
  check((await W()).walk[0].length === n0 + 1, 'Ctrl+Shift+Z puts it back');
  await page.keyboard.press('Control+y'); await sleep(80);
  await page.keyboard.press('Control+z'); await sleep(120);
  check((await W()).walk[0].length === n0, 'and Ctrl+Z takes it away again');

  log('smooth a shape: the bench by the middle house (a block)');
  await ev(() => MapPaths.fit()); await sleep(100);
  const bench = (await W()).block[2];
  await clickMap([1070, 647]);
  check(JSON.stringify(await ev(() => MapPaths.sel)) === JSON.stringify({ kind: 'block', i: 2 }), 'a click inside the bench picks it');
  await page.click('#mp-smooth'); await sleep(150);
  w = await W();
  check(w.block[2].length === bench.length * 2, 'Smooth rounds its corners (' + bench.length + ' → ' + w.block[2].length + ' points: ' + JSON.stringify(w.block[2]) + ')');
  await shot('06-smooth');

  log('draw a new block');
  const nb = w.block.length;
  await page.click('[data-tool="block"]'); await sleep(80);
  // across the foot of the lane up the big house's west side
  for (const p of [[262, 372], [298, 372], [298, 392], [262, 392]]) await clickMap(p);
  await page.keyboard.press('Enter'); await sleep(150);
  w = await W();
  check(w.block.length === nb + 1 && w.block[nb].length === 4, 'Enter closes it: a new block of 4 points (' + JSON.stringify(w.block[nb]) + ')');
  await shot('07-new-block');

  log('move a person: Nettie');
  const nettie = w.people[0].at.slice();
  await dragMap(nettie, [nettie[0] + 14, nettie[1] + 16]);
  w = await W();
  check(Math.abs(w.people[0].at[0] - nettie[0] - 14) <= 1 && Math.abs(w.people[0].at[1] - nettie[1] - 16) <= 1, 'Nettie moved from ' + nettie + ' to ' + w.people[0].at);
  await shot('08-move-person');

  log('the reach check: the new block cuts off the lane up the big house\'s west side');
  await page.click('label:has(#mp-l-reach)'); await sleep(700);
  let reachText = await ev(() => document.getElementById('mp-reach').textContent);
  check(/cut off from the rest/.test(reachText), 'the reach check warns: “' + reachText.trim() + '”');
  await shot('09-reach-cut-off');

  log('zoom in, and drag the whole block somewhere harmless');
  const sb = await toScreen([340, 410]); await page.mouse.move(sb[0], sb[1]);
  for (let i = 0; i < 3; i++) { await page.mouse.wheel(0, -300); await sleep(60); }
  await sleep(150);
  await clickMap([280, 382]);
  check(JSON.stringify(await ev(() => MapPaths.sel)) === JSON.stringify({ kind: 'block', i: nb }), 'a click inside the new block picks it');
  await dragMap([280, 382], [440, 442]); await sleep(500);
  w = await W();
  check(JSON.stringify(w.block[nb]) === JSON.stringify([[422, 432], [458, 432], [458, 452], [422, 452]]), 'the block moved whole: ' + JSON.stringify(w.block[nb]));
  reachText = await ev(() => document.getElementById('mp-reach').textContent);
  check(/reach everything/.test(reachText), 'and the reach check is happy again: “' + reachText.trim() + '”');
  await shot('10-block-moved');
  await ev(() => MapPaths.fit()); await sleep(150);

  log('walk it');
  await page.click('#mp-walk');
  await page.waitForFunction(() => MapPaths.walking && MapPaths.field && MapPaths.field.map, null, { timeout: 10000 });
  await sleep(900);
  const fm = await ev(() => ({ w0: MapPaths.field.map.walk[0][0], blocks: MapPaths.field.map.block.length, nettie: MapPaths.field.map.people[0].at, x: MapPaths.field.P.x, y: MapPaths.field.P.y }));
  w = await W();
  check(JSON.stringify(fm.w0) === JSON.stringify(w.walk[0][0]) && fm.blocks === w.block.length && JSON.stringify(fm.nettie) === JSON.stringify(w.people[0].at), 'the field walks the edited map (point, new block, Nettie’s place)');
  await page.keyboard.down('ArrowRight'); await sleep(700); await page.keyboard.up('ArrowRight');
  await page.keyboard.down('ArrowDown'); await sleep(450); await page.keyboard.up('ArrowDown');
  await sleep(250);
  const p1 = await ev(() => [MapPaths.field.P.x, MapPaths.field.P.y]);
  check(Math.hypot(p1[0] - fm.x, p1[1] - fm.y) > 30, 'the arrow keys walk her (' + fm.x.toFixed(0) + ',' + fm.y.toFixed(0) + ' → ' + p1[0].toFixed(0) + ',' + p1[1].toFixed(0) + ')');
  await shot('11-walk');
  const box = await page.locator('.field-cv').boundingBox();
  await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.62); await sleep(1500);
  const p2 = await ev(() => [MapPaths.field.P.x, MapPaths.field.P.y]);
  check(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) > 20, 'a click walks her there (' + p1.map((v) => v.toFixed(0)) + ' → ' + p2.map((v) => v.toFixed(0)) + ')');
  await shot('12-walk-click');
  await page.keyboard.press('Escape'); await sleep(250);
  check(!(await ev(() => MapPaths.walking)), 'Esc brings the editing back');
  await shot('13-back-to-editing');

  log('the edits are kept after a reload');
  const before = JSON.stringify(await W());
  await page.reload(); await page.waitForFunction(() => window.MapPaths && MapPaths.painted && MapPaths.dbState !== 'waiting', null, { timeout: 20000 }); await sleep(300);
  check(JSON.stringify(await ev(() => MapPaths.works.wickhollow)) === before, 'Wickhollow’s edits came back from this browser');
  check(await ev(() => document.querySelector('#mp-maps li.is-current .mp-chip').textContent) === 'edited', 'the map list marks Wickhollow “edited”');
  await shot('14-after-reload');

  log('move an arrival on another map: the Thornwood, coming from Bogmire');
  await page.click('.mp-map-pick >> text=The Thornwood'); await sleep(400);
  await page.waitForFunction(() => MapPaths.painted, null, { timeout: 10000 });
  const arr = (await W()).arrivals.find((x) => x.from === 'bogmire');
  await dragMap(arr.at, [arr.at[0] - 14, arr.at[1] - 4]);
  const arr2 = (await W()).arrivals.find((x) => x.from === 'bogmire');
  const bogExit = await ev(() => MapEdits.body(MAPS, MapPaths.works, 'bogmire').exits[0]);
  check(Math.abs(arr2.at[0] - arr.at[0] + 14) <= 1 && JSON.stringify(bogExit.at) === JSON.stringify(arr2.at), 'the arrival moved to ' + arr2.at + ', and Bogmire’s exit to the Thornwood now lands there too');
  await shot('15-thornwood-arrival');

  log('download the edits, and check them');
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.click('#mp-download')]);
  const edits = path.join(out, 'edits.json'); await dl.saveAs(edits);
  const doc = JSON.parse(fs.readFileSync(edits, 'utf8'));
  check(doc.maps && doc.maps.wickhollow && doc.maps.thornwood && Object.keys(doc.maps).length === 2, 'the file holds the two changed maps (' + Object.keys(doc.maps || {}).join(', ') + ')');
  const chk = spawnSync(process.execPath, [path.join(R, 'envoi-game-pass-3/map-paths/check-edits.mjs'), edits], { encoding: 'utf8' });
  console.log(chk.stdout.replace(/^/gm, '        '));
  check(chk.status === 0, 'check-edits.mjs finds the downloaded edits safe to apply');
  await page.click('#mp-copy'); await sleep(300);
  const copied = await ev(() => ({ status: document.getElementById('mp-status').textContent, box: !document.getElementById('mp-copybox').hidden && document.getElementById('mp-copybox').value.length }));
  check(/Copied|already selected/.test(copied.status), 'Copy: “' + copied.status + '”');
  await shot('16-download-copy');

  log('more on Io’s cottage: delete a point and a shape, a new front, its base line, Esc, an exit’s corner, a nudge');
  await page.click('.mp-map-pick >> text=Io\'s cottage'); await page.waitForFunction(() => MapPaths.painted, null, { timeout: 10000 }); await sleep(250);
  const zoomAt = async (p) => { await ev(() => MapPaths.fit()); await sleep(60); const a = await toScreen(p); await page.mouse.move(a[0], a[1]); for (let i = 0; i < 3; i++) { await page.mouse.wheel(0, -300); await sleep(50); } await sleep(120); };
  let c = await W(); const nw0 = c.walk[0].length;
  await ev(() => MapPaths.fit()); await sleep(80);
  await clickMap([603, 160]); await page.keyboard.press('Delete'); await sleep(120);
  c = await W();
  check(c.walk[0].length === nw0 - 1 && !c.walk[0].some((q) => q[0] === 603 && q[1] === 160), 'a picked point goes with Delete (' + nw0 + ' → ' + c.walk[0].length + ' points)');
  await zoomAt([1106, 598]);
  await clickMap([1106, 598]);
  check(JSON.stringify(await ev(() => MapPaths.sel)) === JSON.stringify({ kind: 'block', i: 0 }), 'a click inside the cauldron’s tripod picks that block');
  await page.keyboard.press('Backspace'); await sleep(120);
  c = await W();
  check(c.block.length === 2 && JSON.stringify(c.block[0]) === JSON.stringify([[1100, 610], [1142, 610], [1142, 642], [1100, 642]]), 'a picked shape goes with Backspace (3 → ' + c.block.length + ' blocks)');
  await ev(() => MapPaths.fit()); await sleep(80);
  const nf = c.front.length;
  await page.click('[data-tool="front"]'); await sleep(60);
  for (const q of [[200, 600], [260, 600], [262, 680], [198, 680], [200, 600]]) await clickMap(q);
  c = await W();
  check(c.front.length === nf + 1 && c.front[nf].pts.length === 4 && c.front[nf].base === 680, 'a click on the first point closes a new front, its base line at its foot (y ' + (c.front[nf] && c.front[nf].base) + ')');
  const zf = await ev(() => MapPaths.view.z);
  await dragMap([262 + 14 / zf, 680], [262 + 14 / zf, 662]);
  c = await W();
  check(c.front[nf].base === 662, 'its diamond moves the base line (680 → ' + c.front[nf].base + ')');
  await shot('17-new-front');
  const nwalks = c.walk.length;
  await page.click('[data-tool="walk"]'); await sleep(60);
  await clickMap([300, 300]); await clickMap([340, 300]);
  await page.keyboard.press('Escape'); await sleep(80);
  c = await W();
  check(c.walk.length === nwalks && await ev(() => document.querySelector('[data-tool="walk"]').getAttribute('aria-pressed')) === 'true', 'Esc cancels a shape half drawn');
  await page.keyboard.press('Escape'); await sleep(80);
  check(await ev(() => document.querySelector('[data-tool="select"]').getAttribute('aria-pressed')) === 'true', 'a second Esc goes back to Pick and move');
  await zoomAt([604, 20]);
  await dragMap([604, 20], [620, 32]);
  c = await W();
  check(JSON.stringify(c.exits[0].rect) === JSON.stringify([500, 0, 620, 32]), 'an exit’s corner resizes it: ' + JSON.stringify(c.exits[0].rect));
  await dragMap([560, 10], [570, 14]);
  c = await W();
  check(JSON.stringify(c.exits[0].rect) === JSON.stringify([510, 4, 630, 36]), 'and dragging inside it moves it: ' + JSON.stringify(c.exits[0].rect));
  await ev(() => MapPaths.fit()); await sleep(80);
  const from = c.arrivals.findIndex((x) => x.from === 'wickhollow'), at0 = c.arrivals[from].at.slice();
  await clickMap(at0);
  for (let i = 0; i < 3; i++) await page.keyboard.press('Shift+ArrowRight');
  await sleep(100); c = await W();
  check(JSON.stringify(c.arrivals[from].at) === JSON.stringify([at0[0] + 3, at0[1]]), 'Shift+arrows nudge the picked arrival 3 px: ' + c.arrivals[from].at);
  await page.keyboard.press('Control+z'); await sleep(80); c = await W();
  check(JSON.stringify(c.arrivals[from].at) === JSON.stringify(at0), 'and one Ctrl+Z takes the three nudges back');
  await clickMap([230, 640]);
  const pickedFront = await ev(() => MapPaths.sel);
  await page.click('label:has(#mp-l-front)'); await sleep(80);
  check(pickedFront && pickedFront.kind === 'front' && (await ev(() => MapPaths.sel)) === null, 'hiding the fronts lets go of the picked front');
  await page.click('label:has(#mp-l-front)'); await sleep(80);
  await shot('18-cottage-edited');
  log('back to the game’s tracing, and undo it');
  const reset = page.locator('#mp-maps li:nth-child(2) .mp-reset');
  await reset.click(); await sleep(80);
  check(/Sure\?/.test(await reset.textContent()), 'the first click asks “' + (await reset.textContent()) + '”');
  await reset.click(); await sleep(200);
  check(await ev(() => MapEdits.geom(MapPaths.works.cottage) === MapEdits.geom(MapEdits.traced(MAPS, 'cottage'))) && await ev(() => document.querySelector('#mp-maps li:nth-child(2) .mp-chip').hidden), 'the second puts the cottage back as the game traced it');
  await page.keyboard.press('Control+z'); await sleep(150);
  check((await W()).walk[0].length === nw0 - 1, 'Ctrl+Z brings the changes back');
  await reset.click(); await sleep(60); await reset.click(); await sleep(150);

  log('the page at phone width');
  await page.setViewportSize({ width: 390, height: 844 }); await sleep(400);
  const wide = await ev(() => document.documentElement.scrollWidth - window.innerWidth);
  check(wide <= 0, 'no sideways scrolling at 390 px (' + wide + ' px over)');
  await page.screenshot({ path: path.join(out, '19-phone.png'), fullPage: true });
  await page.close();

  log('send to Claude, through a stand-in store');
  const ctx2 = await browser.newContext({ viewport: { width: 1366, height: 820 } });
  await ctx2.addInitScript(() => {
    window.__writes = []; window.__failNext = false;
    const db = { doc: (p) => ({ set: async (body) => { await new Promise((r) => setTimeout(r, 80)); if (window.__failNext) { window.__failNext = false; throw { code: 'invalid_argument', message: 'a test refusal' }; } window.__writes.push({ path: p, body: JSON.parse(JSON.stringify(body)) }); } }) };
    window.claude = { use: (name) => new Promise((r) => setTimeout(() => r(name === 'db' ? db : null), 200)) };
  });
  page = await openPage(ctx2, 'send');
  check(await ev(() => window.__writes.length) === 0, 'nothing is written on load');
  check(await ev(() => !document.getElementById('mp-send-row').hidden && document.getElementById('mp-download').hidden), 'inside claude.ai it offers Send, not Download');
  const v1 = (await W()).walk[0][3];
  await ev(() => MapPaths.fit()); await sleep(80);
  await dragMap(v1, [v1[0] + 6, v1[1] + 8]);
  await page.click('#mp-send-one');
  await page.waitForFunction(() => /^Sent /.test(document.getElementById('mp-status').textContent), null, { timeout: 8000 });
  let writes = await ev(() => window.__writes);
  check(writes.length === 1 && writes[0].path === 'edits/wickhollow', 'Send this map writes one document: ' + (writes[0] && writes[0].path));
  const body = writes[0] && writes[0].body;
  check(body && JSON.stringify(body.walk[0][3]) === JSON.stringify([v1[0] + 6, v1[1] + 8]) && body.changed.includes('walk'), 'its body has the moved point, and changed: ' + JSON.stringify(body && body.changed));
  log('  the document’s fields: ' + Object.keys(body || {}).join(', '));
  check(await ev(() => document.querySelector('#mp-maps li.is-current .mp-chip').textContent) === 'sent', 'the map list marks Wickhollow “sent”');
  await shot('20-sent');
  await page.click('.mp-map-pick >> text=The jetty'); await page.waitForFunction(() => MapPaths.painted, null, { timeout: 10000 }); await sleep(200);
  const j = (await W()).walk[0][2];
  await dragMap(j, [j[0] - 6, j[1]]);
  await ev(() => { window.__failNext = true; });
  await page.click('#mp-send-all');
  await page.waitForFunction(() => /couldn’t send/i.test(document.getElementById('mp-status').textContent), null, { timeout: 8000 });
  const errText = await ev(() => document.getElementById('mp-status').textContent);
  check(/^Couldn’t send The jetty: .*invalid_argument/.test(errText), 'a refused write shows its error: “' + errText + '”');
  await shot('21-send-error');
  await page.click('#mp-send-all');
  await page.waitForFunction(() => /^Sent 1 map/.test(document.getElementById('mp-status').textContent), null, { timeout: 8000 });
  writes = await ev(() => window.__writes);
  const sentEdits = writes.filter((x) => x.path.startsWith('edits/')), sentPlaces = writes.filter((x) => x.path.startsWith('places/'));
  check(sentEdits.length === 2 && sentEdits[1].path === 'edits/jetty', 'Send everything new sends only the jetty’s paths (Wickhollow is already sent): ' + sentEdits.map((x) => x.path).join(', '));
  check(sentPlaces.length === 20 && writes.length === 22, 'and one document for each of the twenty keepsakes, the first time: ' + sentPlaces.length);
  fs.writeFileSync(path.join(out, 'sent.json'), JSON.stringify(sentEdits.map((x) => x.body), null, 1));
  const chk3 = spawnSync(process.execPath, [path.join(R, 'envoi-game-pass-3/map-paths/check-edits.mjs'), path.join(out, 'sent.json')], { encoding: 'utf8' });
  console.log(chk3.stdout.replace(/^/gm, '        '));
  check(chk3.status === 0, 'check-edits.mjs finds the sent documents safe to apply');
  await page.close();

  log('the keepsakes');
  const ctx3 = await browser.newContext({ viewport: { width: 1366, height: 820 } });
  await ctx3.addInitScript(() => {
    window.__writes = [];
    const db = { doc: (p) => ({ set: async (body) => { await new Promise((r) => setTimeout(r, 40)); window.__writes.push({ path: p, body: JSON.parse(JSON.stringify(body)) }); } }) };
    window.claude = { use: (name) => new Promise((r) => setTimeout(() => r(name === 'db' ? db : null), 150)) };
  });
  page = await openPage(ctx3, 'keepsakes');
  const P = () => ev(() => JSON.parse(JSON.stringify(MapEditor.places)));
  let pl = await P();
  check(JSON.stringify(pl['crescent-locket']) === JSON.stringify({ map: 'wickhollow', x: 458, y: 562 }) && JSON.stringify(pl['wardens-brooch']) === JSON.stringify({ map: 'thornwood', x: 1284, y: 816 }), 'the two hidden ones start where they lie in the game today');
  const lyingAt = await ev(() => LOOT.ITEMS.filter((it) => it.source === 'hidden' || it.source === 'found').map((it) => [it.id, it.home, it.at]));
  check(lyingAt.length === 14 && lyingAt.every(([id, home, a]) => pl[id] && pl[id].map === home && pl[id].x === a[0] && pl[id].y === a[1]) && Object.keys(pl).length === 14, 'all fourteen that lie on a map start where the list puts them');
  check(await ev(() => [...Array(1)].every(() => ['wickhollow', 'jetty', 'thornwood', 'bogmire', 'bogmire-heart', 'dawnroost', 'dawnroost-node', 'crossroads', 'shipyard', 'frozen-pass', 'misthollow'].every((m) => MapEditor.outOf(m).size === 0))), 'and Io can reach every one of them');
  await page.click('#me-mode-keepsakes'); await sleep(200);
  check(await ev(() => MapEditor.mode) === 'keepsakes' && await ev(() => getComputedStyle(document.querySelector('[data-for="paths"]')).display) === 'none', 'Keepsakes shows its part of the panel, and hides the path tools');
  check(await ev(() => document.querySelectorAll('#me-groups .ip-item').length) === 20, 'the list has all twenty');
  check(await ev(() => !!document.querySelector('#me-card canvas.me-pic') && /Crescent Locket/.test(document.querySelector('#me-card h3').textContent)), 'the card shows the picked one, with its stand-in picture');
  await shot('30-keepsakes');
  // the Hag-Stone: picking it in the list opens Bogmire, where it lies; then put it beside where a new walk starts there
  await page.click('#me-groups .ip-item >> text=The Bogmire Hag-Stone'); await page.waitForFunction(() => MapEditor.painted && MapEditor.map === 'bogmire', null, { timeout: 10000 }); await sleep(200);
  check(await ev(() => MapEditor.map) === 'bogmire' && /Lies on Bogmire/.test(await ev(() => document.querySelector('#me-card .ip-state').textContent)), 'picking the Hag-Stone opens Bogmire, where it lies');
  const st = (await W()).start;
  await page.click('#me-card button >> text=Put it somewhere else here'); await sleep(100);
  await clickMap([st[0], st[1] - 10]); await sleep(250);
  pl = await P();
  check(pl['hag-stone'] && pl['hag-stone'].map === 'bogmire' && Math.abs(pl['hag-stone'].x - st[0]) <= 2 && Math.abs(pl['hag-stone'].y - (st[1] - 10)) <= 2, 'a click on the painting puts it there: ' + JSON.stringify(pl['hag-stone']));
  check(await ev(() => !MapEditor.outOf('bogmire').has('hag-stone')) && /Io can reach it/.test(await ev(() => document.querySelector('#me-card .ip-state').textContent)), 'and Io can reach it there');
  check(await ev(() => document.querySelector('#mp-maps li.is-current .me-n').textContent) === '2 keepsakes', 'the maps list counts Bogmire’s two');
  // the Bogstriders: somewhere she can't reach, then dragged back
  await page.click('#me-groups .ip-item >> text=The Bogstriders'); await sleep(150);
  let outAt = null;
  for (const c of [[24, 24], [1512, 24], [24, 1000], [1512, 1000], [768, 16]]) {
    await ev((p) => MapEditor.putHere('bogstriders', p[0], p[1]), c); await sleep(120);
    if (await ev(() => MapEditor.outOf('bogmire').has('bogstriders'))) { outAt = c; break; }
  }
  check(!!outAt, 'a corner of the painting is out of her reach: ' + JSON.stringify(outAt));
  check(await ev(() => document.querySelector('#me-groups .ip-item[aria-pressed="true"] .mp-chip').textContent) === 'out of reach', 'the list marks it “out of reach”');
  await ev(() => MapEditor.fit()); await sleep(100); await shot('31-out-of-reach');
  await dragMap(outAt, [st[0] + 30, st[1] - 10]); await sleep(250);
  pl = await P();
  check(Math.abs(pl.bogstriders.x - (st[0] + 30)) <= 3 && !(await ev(() => MapEditor.outOf('bogmire').has('bogstriders'))), 'dragging its glint moves it back within reach');
  await page.keyboard.press('Control+z'); await sleep(200);
  check(JSON.stringify((await P()).bogstriders) === JSON.stringify({ map: 'bogmire', x: outAt[0], y: outAt[1] }), 'Ctrl+Z puts it back where it was');
  await page.keyboard.press('Control+Shift+z'); await sleep(200);
  check(Math.abs((await P()).bogstriders.x - (st[0] + 30)) <= 3, 'Ctrl+Shift+Z moves it again');
  await page.click('#mp-cv', { position: { x: 5, y: 5 } }); await sleep(80);
  await page.keyboard.press('Delete'); await sleep(200);
  check((await P()).bogstriders === null, 'Delete takes the picked one off the map');
  await page.keyboard.press('Control+z'); await sleep(200);
  check(!!(await P()).bogstriders, 'and Ctrl+Z puts it back');
  // a note on the Hag-Stone, then walking her to it, and its card
  await page.click('#me-groups .ip-item >> text=The Bogmire Hag-Stone'); await sleep(150);
  await page.fill('#me-card textarea', 'By the jars, where Old Wenna can see it'); await sleep(400);
  await page.click('#mp-walk');
  await page.waitForFunction(() => MapEditor.walking && MapEditor.field && MapEditor.field.map, null, { timeout: 10000 }); await sleep(700);
  const spot = await ev(() => MapEditor.field.map.spots.find((s) => s.item === 'hag-stone'));
  check(!!spot && spot.kind === 'keepsake' && spot.label === 'Something glinting', 'the walk has it as a glint, as the hidden ones are');
  check(await ev(() => !MapEditor.field.map.spots.some((s) => s.kind === 'keepsake' && !s.item)), 'and none of the map’s own keepsake spots');
  await page.keyboard.press('Enter'); await sleep(400);
  check(await ev(() => MapEditor.foundOpen) && /Hag-Stone/.test(await ev(() => document.getElementById('me-found-name').textContent)), 'the action button by it shows its card');
  check(await ev(() => document.querySelectorAll('#me-found-helps li').length) === 2, 'with its two helps');
  await shot('32-found');
  await page.keyboard.press('Enter'); await sleep(250);
  check(!(await ev(() => MapEditor.foundOpen)) && (await ev(() => MapEditor.found)).includes('hag-stone'), 'Enter closes the card, and it stays found');
  await page.keyboard.press('Escape'); await sleep(300);
  check(!(await ev(() => MapEditor.walking)), 'Esc brings the editing back');
  // sending: one document per keepsake
  await page.click('#mp-send-all');
  await page.waitForFunction(() => /^Sent /.test(document.getElementById('mp-status').textContent), null, { timeout: 10000 });
  const kw = (await ev(() => window.__writes)).filter((x) => x.path.startsWith('places/'));
  const hag = kw.find((x) => x.path === 'places/hag-stone');
  check(kw.length === 20 && hag && hag.body.map === 'bogmire' && hag.body.note === 'By the jars, where Old Wenna can see it' && hag.body.wear === 'either', 'Send everything new writes one document per keepsake, the Hag-Stone’s with its place and note: ' + kw.length + ' ' + JSON.stringify(hag && hag.body));
  const gift = kw.find((x) => x.path === 'places/knotted-shawl');
  check(gift && gift.body.source === 'gift' && gift.body.giver === 'nettie' && gift.body.map === null, 'a gift says who gives it, and has no place');
  check(await ev(() => document.getElementById('mp-send-all').disabled), 'then there is nothing new to send');
  // kept after a reload
  await page.reload(); await page.waitForFunction(() => window.MapEditor && MapEditor.painted && MapEditor.dbState !== 'waiting', null, { timeout: 20000 }); await sleep(300);
  pl = await P();
  check(pl['hag-stone'] && pl['hag-stone'].map === 'bogmire' && pl.bogstriders && await ev(() => MapEditor.mode) === 'keepsakes', 'the places and the mode come back from this browser');
  check(await ev(() => document.getElementById('mp-send-all').disabled), 'and the page remembers they were sent');
  log('the keepsakes at phone width');
  await page.setViewportSize({ width: 390, height: 844 }); await sleep(400);
  const wide2 = await ev(() => document.documentElement.scrollWidth - window.innerWidth);
  check(wide2 <= 0, 'no sideways scrolling at 390 px (' + wide2 + ' px over)');
  await page.screenshot({ path: path.join(out, '33-phone-keepsakes.png'), fullPage: true });
  await page.close();
} catch (e) {
  fails.push('the run stopped: ' + (e && e.message ? e.message.split('\n')[0] : e));
  log('STOPPED: ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e));
  try { await page.screenshot({ path: path.join(out, 'stopped.png') }); } catch (er) { /* the page may be gone */ }
}
await browser.close();
for (const e of errs) console.log('  page error: ' + e);
console.log(fails.length || errs.length ? '✗ ' + fails.length + ' failed, ' + errs.length + ' page errors' : '✓ every step passed, no page errors. Screenshots in ' + out);
process.exitCode = fails.length || errs.length ? 1 : 0;
