// map-editor-keepsake-places.mjs: the map editor keeps and sends only the keepsakes Chris moved (or wrote a note on), so
// a later move in items.js is followed, not reverted by his next send (T17, tools 9).
// The page opens as his browser has it: the storage the page kept before this fix (version 1: every keepsake's place,
// kept on his first visit, where the list put them on October 4 and 5), in which he really moved one, the Jetty Coin.
// Then items.js moves the Bogmire Hag-Stone (planted in the built page, before the map editor reads the list). It must:
//   - show the Hag-Stone where items.js puts it now, and the Jetty Coin where he put it;
//   - keep only his move in this browser (no copy of the other thirteen);
//   - send only his move: "Send everything new", through a stand-in store, writes the Jetty Coin's document alone.
// Usage, from the repository's top folder (it opens a browser):
//   flock /tmp/claude-0/browser.lock node final-pass-polish-october-5-2026/checks/tools/map-editor-keepsake-places.mjs [built page]
// (a page already built, such as a copy of an older build, instead of building dist/map-editor.html)
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createRequire } from 'module';
import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const R = process.cwd();
let built = process.argv[2] ? path.resolve(process.argv[2]) : null;
if (!built) { execSync('node tools/build.mjs envoi-final-draft/map-editor/map-editor.html', { cwd: R, stdio: 'ignore' }); built = path.join(R, 'dist/map-editor.html'); }
// where the list put the fourteen on October 4 and 5, as the page kept them then
const V1 = { 'crescent-locket': ['wickhollow', 458, 562], 'fen-heart-lamp': ['bogmire-heart', 775, 215], 'pass-bell': ['frozen-pass', 615, 625], 'wardens-brooch': ['thornwood', 1284, 816], 'node-sunstone': ['dawnroost-node', 205, 135], 'crossroads-pennant': ['crossroads', 1395, 470], 'forge-horseshoe': ['wickhollow', 1195, 690], 'jetty-coin': ['jetty', 470, 372], 'frog-ring': ['thornwood', 1380, 190], 'hag-stone': ['bogmire', 540, 240], 'bogstriders': ['bogmire', 1420, 750], 'kettle-helm': ['dawnroost', 215, 232], 'dockhand-gloves': ['shipyard', 170, 640], 'misthollow-cowl': ['misthollow', 135, 245] };
const places = Object.fromEntries(Object.entries(V1).map(([id, [map, x, y]]) => [id, { map, x, y }]));
places['jetty-coin'] = { map: 'jetty', x: 520, y: 380 }; // his own move
const HAG = [600, 300]; // where items.js puts the Hag-Stone later
// the plant: items.js's later move, read by the page before the map editor starts
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'keepsake-places-')), page0 = path.join(tmp, 'map-editor.html');
const html = fs.readFileSync(built, 'utf8'), at = html.indexOf('<script>\n/* envoi-final-draft/map-editor/map-editor.js */');
if (at < 0) throw new Error('no map-editor.js in ' + built);
fs.writeFileSync(page0, html.slice(0, at) + '<script>LOOT.ITEMS.find((it) => it.id === "hag-stone").at = ' + JSON.stringify(HAG) + ';</script>\n' + html.slice(at));

let failed = 0;
const check = (ok, what) => { console.log((ok ? '  ok: ' : '  FAILED: ') + what); if (!ok) failed++; };
const browser = await pw.chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 820 } });
  await ctx.addInitScript((kept) => {
    // his browser's storage from before (once only: a reload keeps what the page itself stored)
    if (!sessionStorage.getItem('planted')) { localStorage.setItem('envoi.map-editor.keepsakes.v1', JSON.stringify(kept)); sessionStorage.setItem('planted', '1'); }
    window.__writes = [];
    const db = { doc: (p) => ({ set: async (body) => { await new Promise((r) => setTimeout(r, 30)); window.__writes.push({ path: p, body: JSON.parse(JSON.stringify(body)) }); } }) };
    window.claude = { use: (name) => new Promise((r) => setTimeout(() => r(name === 'db' ? db : null), 150)) };
  }, { version: 1, places, notes: {} });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('file://' + page0);
  await page.waitForFunction(() => window.MapEditor && MapEditor.dbState === 'ready' && MapEditor.painted, null, { timeout: 30000 });
  const P = await page.evaluate(() => JSON.parse(JSON.stringify(MapEditor.places)));
  check(JSON.stringify(P['hag-stone']) === JSON.stringify({ map: 'bogmire', x: HAG[0], y: HAG[1] }), 'the Hag-Stone is where items.js puts it now: ' + JSON.stringify(P['hag-stone']));
  check(JSON.stringify(P['jetty-coin']) === JSON.stringify(places['jetty-coin']), 'the Jetty Coin is where he put it: ' + JSON.stringify(P['jetty-coin']));
  // what the page keeps in this browser, once it has stored (it does when the page is hidden, and after any change)
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  const kept = await page.evaluate(() => JSON.parse(localStorage.getItem('envoi.map-editor.keepsakes.v1')));
  const keptIds = Object.keys((kept && kept.places) || {});
  check(keptIds.length === 1 && keptIds[0] === 'jetty-coin', 'this browser keeps his move alone: ' + keptIds.join(', '));
  // send everything new
  const label = await page.evaluate(() => document.getElementById('mp-send-all').textContent);
  await page.click('#mp-send-all');
  await page.waitForFunction(() => /^Sent |Claude has everything|Nothing to send/.test(document.getElementById('mp-status').textContent), null, { timeout: 10000 });
  const sent = (await page.evaluate(() => window.__writes)).filter((x) => x.path.startsWith('places/'));
  const hag = sent.find((x) => x.path === 'places/hag-stone');
  check(sent.length === 1 && sent[0].path === 'places/jetty-coin', '“' + label + '” sends his move alone: ' + sent.map((x) => x.path).join(', '));
  check(!hag || (hag.body.x === HAG[0] && hag.body.y === HAG[1]), 'and never the Hag-Stone’s old place' + (hag ? ': ' + JSON.stringify([hag.body.x, hag.body.y]) : ''));
  check(!errs.length, 'no page errors' + (errs.length ? ': ' + errs.join('; ') : ''));
} finally { await browser.close(); fs.rmSync(tmp, { recursive: true, force: true }); }
console.log(failed ? '✗ ' + failed + ' failed' : '✓ the map editor keeps and sends only the keepsakes he moved');
process.exitCode = failed ? 1 : 0;
