// page-test.mjs: drives the built wilderness page headless (Chromium, as tools/game-test.mjs and the map editor's
// page-test.mjs do) by taps and clicks, as a player would, and fails on any page error or failed step. Build it first:
//   node tools/build.mjs envoi-final-draft/wilds/wilds.html
// Usage: node envoi-final-draft/wilds/page-test.mjs [dist/wilds.html] [--out <dir>] [--size 915x412]
// At the given size (915 x 412 is Chris's Pixel 7a held sideways; it passes at a laptop's 1366 x 768 too), with the
// device's theme light (the page stays dark): the bands' card, then for each band: start at its camp; walk to its rest
// and to its landing ground and use each (their notes); walk the whole row to its end card by taps on the field, through
// every scene, lighting the Ember Line road's three nodes on the way; check the end card names the place and counts the
// fights that would have started; and back to the camp with its button. Last, band 4 again to its end, and the end
// card's Choose a band. Every fight that would start is counted and its note checked; taps land only where nothing
// covers the field (the notes never do). The page must never scroll sideways, the cards must fit the screen, and the
// corner label and the notes must stay clear of the field's controls.
// A tap goes where a player would tap next: the goal itself when it is on screen (a spot, or a point inside an exit),
// else the farthest point of the way there that is. The way is found on the field's own grid (src/game/field.js: her
// feet and 6 px either side inside a walk area and outside every block and person, on 12 px cells), read from the
// scenes in the page (window.Wilds.maps), and map px become screen px as the field's camera puts them (field.js, toMap:
// screen = the canvas's corner + (map - cam) x cam.z).
// Each scene, note and end card is saved as a screenshot in --out (tools/.cache/wilds-test-<size> by default). Exits 1
// on any page error or failed step; the last line is "page test passed".
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const HERE = path.dirname(new URL(import.meta.url).pathname), R = path.resolve(HERE, '../..');
const args = process.argv.slice(2);
let file = path.join(R, 'dist/wilds.html'), out = null, size = [915, 412];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--out') out = path.resolve(args[++i]);
  else if (args[i] === '--size') size = args[++i].split('x').map(Number);
  else file = path.resolve(args[i]);
}
out = out || path.join(R, 'tools/.cache/wilds-test-' + size.join('x'));
fs.mkdirSync(out, { recursive: true });

const t0 = Date.now(), errs = [], fails = [], shots = [];
const log = (s) => console.log(((Date.now() - t0) / 1000).toFixed(1).padStart(6) + 's  ' + s);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const check = (ok, what) => { if (ok) log('  ok: ' + what); else { fails.push(what); log('  FAILED: ' + what); } };

const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: size[0], height: size[1] }, colorScheme: 'light' });
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
// nothing from the web but the fonts (skipped here, as game-test.mjs skips them: the sandbox can't reach Google Fonts)
await page.route('**/*', (route) => {
  const u = route.request().url();
  if (u.startsWith('file:') || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
  if (/^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(u)) return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
  errs.push('reached for the web: ' + u.slice(0, 120)); return route.abort();
});
const ev = (fn, arg) => page.evaluate(fn, arg);
let shotN = 0;
async function shot(name) { const f = path.join(out, String(++shotN).padStart(2, '0') + '-' + name + '.png'); await page.screenshot({ path: f }); shots.push(f); return f; }
async function waitFor(fn, arg, ms, what) {
  try { await page.waitForFunction(fn, arg, { timeout: ms, polling: 100 }); }
  catch (e) { throw new Error('waited ' + (ms / 1000) + ' s for ' + what); }
}
const idle = (what) => waitFor(() => window.Wilds && !Wilds.busy, null, 15000, what || 'the page to settle');

// ---------- in the page: where to tap next, toward a goal ({ rect } an exit, or { at } a spot) ----------
function plan(goal) {
  const W = window.Wilds, f = W.field, m = f.map, P = f.P, cam = f.cam;
  const cv = f.root.querySelector('.field-cv'), r = cv.getBoundingClientRect();
  const CELL = 12, GW = Math.ceil(1536 / CELL), GH = Math.ceil(1024 / CELL), REACH = 58;
  const inPoly = (pts, x, y) => { let ins = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins; } return ins; };
  const free = (x, y) => m.walk.some((p) => inPoly(p, x, y)) && !(m.block || []).some((p) => inPoly(p, x, y)) && !(m.people || []).some((n) => Math.abs(n.at[0] - x) < 11 && Math.abs(n.at[1] - y) < 7);
  const stand = (x, y) => free(x, y) && free(x - 6, y) && free(x + 6, y);
  const G = (window.__wlGrids = window.__wlGrids || {});
  let grid = G[m.id];
  if (!grid) {
    grid = new Uint8Array(GW * GH);
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) { const x = i * CELL + 6, y = j * CELL + 6; grid[j * GW + i] = stand(x, y) && stand(x, y - 5) && stand(x, y + 5) && stand(x - 5, y) && stand(x + 5, y) ? 1 : 0; }
    G[m.id] = grid;
  }
  const centre = (c) => [(c % GW) * CELL + 6, Math.floor(c / GW) * CELL + 6];
  const isGoal = goal.rect ? (x, y) => x >= goal.rect[0] - 8 && x <= goal.rect[2] + 8 && y >= goal.rect[1] - 8 && y <= goal.rect[3] + 8
    : (x, y) => Math.hypot(x - goal.at[0], (y - goal.at[1]) * 1.3) < REACH - 4; // in reach of the spot (field.js, near)
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
  // breadth-first over the grid from her cell, over the whole map
  const start = Math.min(GH - 1, Math.floor(P.y / CELL)) * GW + Math.min(GW - 1, Math.floor(P.x / CELL));
  const prev = new Int32Array(GW * GH).fill(-1), way = []; let end = -1;
  if (grid[start]) {
    prev[start] = start; const q = [start];
    for (let h = 0; h < q.length; h++) {
      const c = q[h], [x, y] = centre(c);
      if (end < 0 && isGoal(x, y)) end = c;
      const ci = c % GW, cj = (c - ci) / GW;
      for (const [di, dj] of DIRS) {
        const i = ci + di, j = cj + dj; if (i < 0 || j < 0 || i >= GW || j >= GH) continue;
        const n = j * GW + i; if (prev[n] >= 0 || !grid[n]) continue;
        if (di && dj && (!grid[cj * GW + i] || !grid[j * GW + ci])) continue; // no cutting corners
        prev[n] = c; q.push(n);
      }
    }
    if (end >= 0) { for (let c = end; c !== start; c = prev[c]) way.push(centre(c)); way.reverse(); }
  }
  // where she stands on a narrow way, or the goal lies along one (a way under 22 px wide has no open cell), the way as
  // the field's fine search finds it (field.js, fineWay): 4 px steps on the same rule as her feet, no cutting corners
  if (end < 0) {
    const F = 4, x0 = P.x, y0 = P.y, key = (i, j) => (i + 512) * 1024 + j + 512, ok = new Map(), from = new Map([[key(0, 0), null]]), q = [[0, 0]];
    const can = (i, j) => { const k = key(i, j); let v = ok.get(k); if (v === undefined) ok.set(k, (v = stand(x0 + i * F, y0 + j * F))); return v; };
    let hit = null;
    for (let h = 0; h < q.length && h < 200000 && !hit; h++) {
      const [ci, cj] = q[h];
      if (isGoal(x0 + ci * F, y0 + cj * F)) { hit = [ci, cj]; break; }
      for (const [di, dj] of DIRS) {
        const i = ci + di, j = cj + dj, k = key(i, j);
        if (from.has(k) || !can(i, j) || (di && dj && (!can(ci + di, cj) || !can(ci, cj + dj)))) continue;
        from.set(k, [ci, cj]); q.push([i, j]);
      }
    }
    if (!hit) return { error: 'no way on ' + m.id + ' from ' + [Math.round(P.x), Math.round(P.y)] + ' to ' + JSON.stringify(goal) };
    for (let c = hit; c && (c[0] || c[1]); c = from.get(key(c[0], c[1]))) way.push([x0 + c[0] * F, y0 + c[1] * F]);
    way.reverse();
  }
  // map px to screen px, as the field's camera puts them; a tap must land on the field itself, nowhere near any other
  // spot (a tap on a spot walks her there and uses it)
  const toS = ([x, y]) => [r.left + (x - cam.x) * cam.z, r.top + (y - cam.y) * cam.z];
  const onField = ([sx, sy]) => sx >= r.left + 6 && sx <= r.right - 6 && sy >= r.top + 6 && sy <= r.bottom - 6 && document.elementFromPoint(sx, sy) === cv;
  const others = (m.spots || []).filter((s) => s.at && !(goal.at && s.at[0] === goal.at[0] && s.at[1] === goal.at[1]));
  const clearOf = ([x, y]) => others.every((s) => Math.hypot(s.at[0] - x, s.at[1] - 20 - y) > 40 && Math.hypot(s.at[0] - x, s.at[1] - y) > 36);
  // on a way the grid can't see, the field finds a tapped walk by its fine search only where she stands on the narrow
  // way or the tap lands on it (field.js, findRoute): until she is on it, a tap goes on its narrow part
  const fine = end < 0, onNarrow = !grid[start], narrowAt = ([x, y]) => !grid[Math.min(GH - 1, Math.floor(y / CELL)) * GW + Math.min(GW - 1, Math.floor(x / CELL))] && stand(x, y);
  let pick = null;
  if (fine && !onNarrow) for (let k = way.length - 1; k >= 0 && !pick; k--) { const s = toS(way[k]); if (narrowAt(way[k]) && onField(s) && clearOf(way[k])) pick = { s, at: way[k], direct: false }; }
  if (pick) { /* onto the narrow way first */ }
  else if (goal.at) { const s = toS(goal.at); if (onField(s)) pick = { s, at: goal.at, direct: true }; }
  else {
    // a cell inside the exit she can get to, nearest its middle
    const cx = (goal.rect[0] + goal.rect[2]) / 2, cy = (goal.rect[1] + goal.rect[3]) / 2; let bd = 1e9;
    for (let c = 0; c < GW * GH; c++) {
      if (prev[c] < 0) continue; const p = centre(c); if (!isGoal(p[0], p[1]) || !clearOf(p)) continue;
      const s = toS(p); if (!onField(s)) continue;
      const d = (p[0] - cx) ** 2 + (p[1] - cy) ** 2; if (d < bd) { bd = d; pick = { s, at: p, direct: true }; }
    }
  }
  if (!pick) for (let k = way.length - 1; k >= 0 && !pick; k--) { const s = toS(way[k]); if (onField(s) && clearOf(way[k])) pick = { s, at: way[k], direct: false }; }
  if (!pick) return { error: 'nothing on the way to tap on ' + m.id + ' from ' + [Math.round(P.x), Math.round(P.y)] };
  return { sx: pick.s[0], sy: pick.s[1], at: pick.at.map(Math.round), direct: pick.direct, cells: way.length };
}

// ---------- in the page: the layout ----------
function layout() {
  const box = (e) => { if (!e || e.hidden || e.closest('[hidden]')) return null; const r = e.getBoundingClientRect(); return r.width && r.height ? { l: r.left, t: r.top, r: r.right, b: r.bottom } : null; };
  const q = (s) => box(document.querySelector(s));
  const note = document.getElementById('wl-note'), f = window.Wilds && Wilds.field;
  // Io as the field draws her (field.js, draw): her feet where the camera puts them, 52 map px tall at its closeness
  const io = () => { const cv = f.root.querySelector('.field-cv').getBoundingClientRect(), z = f.cam.z, h = 52 * z, x = cv.left + (f.P.x - f.cam.x) * z, y = cv.top + (f.P.y - f.cam.y) * z; return { l: x - h * 0.4, t: y - h, r: x + h * 0.4, b: y }; };
  return {
    io: f && f.map && !f.root.hidden && Wilds.mode === 'walk' ? io() : null,
    vw: innerWidth, vh: innerHeight,
    sw: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    corner: q('#wl-corner'), mini: q('.wilds .mini'), pad: q('.wilds .pad'), act: q('.wilds .field-act'),
    note: note.classList.contains('on') ? box(note) : null,
    start: q('.wl-start-card'), end: q('.wl-end-card'),
    bg: getComputedStyle(document.body).backgroundColor,
  };
}
const meet = (a, b) => !!a && !!b && a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
const inside = (a, L) => !!a && a.l >= -0.5 && a.t >= -0.5 && a.r <= L.vw + 0.5 && a.b <= L.vh + 0.5;
async function checkLayout(where) {
  const L = await ev(layout);
  const bad = [];
  if (L.sw > L.vw) bad.push('the page scrolls sideways (' + L.sw + ' > ' + L.vw + ')');
  if (L.corner) { for (const k of ['mini', 'pad', 'act']) if (meet(L.corner, L[k])) bad.push('the corner label is over the ' + k); if (!inside(L.corner, L)) bad.push('the corner label is off the screen'); }
  if (L.note) { if (!inside(L.note, L)) bad.push('the note is off the screen'); for (const k of ['corner', 'mini', 'pad', 'act', 'io']) if (meet(L.note, L[k])) bad.push('the note is over ' + (k === 'io' ? 'Io' : 'the ' + k)); }
  if (L.start && !inside(L.start, L)) bad.push('the bands card is larger than the screen');
  if (L.end && !inside(L.end, L)) bad.push('the end card is larger than the screen');
  check(!bad.length, 'the layout ' + where + (bad.length ? ': ' + bad.join('; ') : ''));
}
const noteText = () => ev(() => { const n = document.getElementById('wl-note'); return { on: n.classList.contains('on'), title: document.getElementById('wl-note-title').textContent, body: document.getElementById('wl-note-body').textContent }; });

// wait while she walks: until she has stopped (not moving for a few frames' polls), or the scene or the page's mode
// changes (an exit), or a while has passed
async function settle(map0) {
  const s0 = await ev(() => [Wilds.field.P.x, Wilds.field.P.y]), t = Date.now();
  let still = 0, moved = false;
  await sleep(120);
  while (Date.now() - t < 40000) {
    const s = await ev(() => ({ map: Wilds.field.map && Wilds.field.map.id, mode: Wilds.mode, busy: Wilds.busy, moving: Wilds.field.P.moving, x: Wilds.field.P.x, y: Wilds.field.P.y }));
    if (s.busy || s.mode !== 'walk' || s.map !== map0) { await idle('the next scene'); return 'changed'; }
    if (Math.hypot(s.x - s0[0], s.y - s0[1]) > 2) moved = true;
    still = s.moving ? 0 : still + 1;
    if (still >= 3 && (moved || Date.now() - t > 1200)) return 'stopped';
    await sleep(100);
  }
  return 'timeout';
}

// the fights that would have started: each one's note, and a screenshot of the first in each band
let seenFights = 0, fightShot = false, taps = 0;
async function countFights(band) {
  const n = await ev(() => Wilds.fights);
  if (n === seenFights) return;
  const lg = await ev(() => Wilds.log.filter((e) => e.kind === 'fight'));
  const last = lg[lg.length - 1], nt = await noteText();
  check(n === seenFights + 1 && lg.length === n, 'one more fight would have started (' + n + ' on this walk), on ' + (last && last.map) + ' at ' + (last && last.at));
  check(nt.on && nt.title === 'A band ' + band + ' fight would start here' && nt.body === 'Fights on this walk: ' + n, 'its note: "' + nt.title + ' / ' + nt.body + '"');
  const sub = await ev(() => document.getElementById('wl-sub').textContent);
  check(sub === 'Band ' + band + ' · ' + n + (n === 1 ? ' fight' : ' fights') + ' so far', 'the corner counts it: "' + sub + '"');
  if (!fightShot) { await checkLayout('with a fight note'); await shot('b' + band + '-fight-note'); fightShot = true; }
  seenFights = n;
}

// walk her out of the scene by an exit, by taps
async function walkOut(ex, band) {
  const map0 = await ev(() => Wilds.field.map.id);
  for (let k = 0; k < 60; k++) {
    const p = await ev(plan, { rect: ex.rect });
    if (p.error) throw new Error(p.error);
    taps++; await page.mouse.click(p.sx, p.sy);
    const r = await settle(map0);
    if (r === 'timeout') throw new Error('she was still walking after 40 s on ' + map0);
    if (r === 'changed') { log('  out of ' + map0 + ' by the exit to ' + ex.to + ' (' + (k + 1) + (k ? ' taps)' : ' tap)')); return; }
    await countFights(band);
  }
  throw new Error('60 taps did not take her out of ' + map0 + ' to ' + ex.to);
}

// walk her to a spot by taps and use it: a tap on it when it is on screen (she walks there and uses it), else on the way
// there; once it is in reach, the gold button that names it
async function useSpot(spot, band) {
  const map0 = await ev(() => Wilds.field.map.id), uses0 = await ev(() => Wilds.uses);
  for (let k = 0; k < 40; k++) {
    if ((await ev(() => Wilds.uses)) > uses0) return true;
    const near = await ev(() => { const b = document.querySelector('.wilds .field-act'), n = Wilds.field.near(); return b && !b.hidden && n && n.ref.at ? { label: b.textContent, at: n.ref.at } : null; });
    if (near && near.at[0] === spot.at[0] && near.at[1] === spot.at[1]) { taps++; await page.click('.wilds .field-act'); await sleep(250); continue; }
    const p = await ev(plan, spot.at ? { at: spot.at } : null);
    if (p.error) throw new Error(p.error);
    taps++; await page.mouse.click(p.sx, p.sy);
    const r = await settle(map0);
    if (r !== 'stopped') throw new Error('walking to ' + (spot.label || spot.kind) + ' on ' + map0 + ': ' + r);
    await countFights(band);
  }
  return (await ev(() => Wilds.uses)) > uses0;
}
const near2 = (P, s) => Math.hypot(s.at[0] - P.x, s.at[1] - P.y);

async function chooseBand(band) {
  await page.click('button[data-band="' + band + '"]');
  await waitFor((b) => window.Wilds && Wilds.mode === 'walk' && !Wilds.busy && Wilds.band === b, band, 15000, 'band ' + band + ' to start');
  await sleep(350);
}

let code = 0;
try {
  log('open ' + path.relative(R, file) + ' at ' + size.join(' x '));
  // every picture is inside the built page: the build puts in each "art/..." it can find, so one still named is a picture
  // whose file is missing (a scene's src spelt wrong, say)
  const missing = [...new Set(fs.readFileSync(file, 'utf8').match(/["'`]art\/[^"'`]+/g) || [])].map((s) => s.slice(1));
  check(!missing.length, 'every picture is inside the page' + (missing.length ? ': no file for ' + missing.join(', ') : ''));
  await page.goto('file://' + file);
  await waitFor(() => window.Wilds && Wilds.paintedReady && document.querySelectorAll('.wl-band img').length === 3 && [...document.querySelectorAll('.wl-band img')].every((i) => i.complete), null, 30000, 'the page and painted Io to load');
  await sleep(400);
  check(await ev(() => [...document.querySelectorAll('.wl-band img')].every((i) => i.naturalWidth > 0)), 'the three camps’ pictures show on the bands card');
  const L0 = await ev(layout);
  check(L0.bg === 'rgb(5, 3, 12)', 'the night stays dark with the device in its light theme (the page is ' + L0.bg + ')');
  const cards = await ev(() => [...document.querySelectorAll('.wl-band')].map((b) => ({ band: +b.dataset.band, text: b.textContent, on: !b.disabled })));
  check(cards.length === 3 && cards.every((c) => c.on), 'three bands to choose: ' + cards.map((c) => c.text).join(' | '));
  check(/Band 2.*The Warm Roads/.test(cards[0].text) && /Band 3.*The northern wilds/.test(cards[1].text) && /Band 4.*The northeast peaks/.test(cards[2].text), 'each named for its region');
  check(await ev(() => document.title) === 'Wilderness at Night', 'the page is called "Wilderness at Night"');
  await checkLayout('of the bands card');
  await shot('bands');

  const BANDS = await ev(() => Wilds.BANDS), ENDS = await ev(() => Wilds.ENDS);
  const summary = [];
  for (const B of BANDS) {
    const band = B.band, camp = B.row[0];
    seenFights = 0; fightShot = false; taps = 0;
    const tb = Date.now();
    log('band ' + band + ': ' + B.row.join(' → ') + ' → ' + B.end);
    await chooseBand(band);
    let st = await ev(() => ({ map: Wilds.field.map.id, P: [Wilds.field.P.x, Wilds.field.P.y], start: Wilds.maps[Wilds.field.map.id].start }));
    check(st.map === camp && Math.hypot(st.P[0] - st.start[0], st.P[1] - st.start[1]) < 14, 'Io starts at ' + camp + ' (the map’s start ' + st.start + '; she stands at ' + st.P.map(Math.round) + ')');
    const corner = await ev(() => ({ scene: document.getElementById('wl-scene').textContent, sub: document.getElementById('wl-sub').textContent, name: Wilds.field.map.name }));
    check(corner.scene === corner.name && corner.sub.startsWith('Band ' + band + ' · '), 'the corner label: "' + corner.scene + ' / ' + corner.sub + '"');
    await checkLayout('at ' + camp);
    await shot('b' + band + '-' + camp);

    // the camp's rest and its landing ground, the nearer first
    const spots = await ev((id) => Wilds.maps[id].spots.filter((s) => s.kind === 'rest' || (s.kind === 'look' && s.id === 'landing')), camp);
    check(spots.some((s) => s.kind === 'rest') && spots.some((s) => s.kind === 'look'), 'the camp has a rest and a landing ground (' + spots.map((s) => s.label + ' at ' + s.at).join('; ') + ')');
    const P0 = await ev(() => ({ x: Wilds.field.P.x, y: Wilds.field.P.y }));
    spots.sort((a, b) => near2(P0, a) - near2(P0, b));
    for (const s of spots) {
      const used = await useSpot(s, band);
      const nt = await noteText(), last = (await ev(() => Wilds.log.filter((e) => e.kind === 'spot'))).pop();
      check(used && last && last.spot === s.kind, 'Io walks to ' + s.label + ' and uses it');
      if (s.kind === 'rest') check(nt.on && nt.title === s.label + ': a rest.' && nt.body === 'In the game Io and Sol rest here and the game is saved.', 'the rest’s note: "' + nt.title + ' ' + nt.body + '"');
      else check(nt.on && nt.title === 'The landing ground' && nt.body === 'The Magpie sets down here.', 'the landing ground’s note: "' + nt.title + ' ' + nt.body + '"');
      await checkLayout('with the ' + (s.kind === 'rest' ? 'rest' : 'landing ground') + '’s note');
      await shot('b' + band + '-' + (s.kind === 'rest' ? 'rest' : 'landing-ground'));
    }

    // the row, scene by scene, to its end
    for (let i = 0; i < B.row.length; i++) {
      const id = B.row[i], next = B.row[i + 1] || B.end;
      st = await ev(() => ({ map: Wilds.field.map.id, mode: Wilds.mode }));
      check(st.map === id && st.mode === 'walk', 'Io is on ' + id);
      if (i > 0) {
        const c = await ev(() => ({ scene: document.getElementById('wl-scene').textContent, sub: document.getElementById('wl-sub').textContent, name: Wilds.field.map.name }));
        check(c.scene === c.name && c.sub.startsWith('Band ' + band + ' · '), 'the corner label: "' + c.scene + ' / ' + c.sub + '"');
        await checkLayout('on ' + id);
        await shot('b' + band + '-' + id);
      }
      // the Ember Line nodes, each lit once, the nearest next
      let nodes = await ev((m) => Wilds.maps[m].spots.filter((s) => s.kind === 'node'), id);
      if (id === 'ember-line-road') check(nodes.length === 3 && ['node1', 'node2', 'node3'].every((n) => nodes.some((s) => s.id === n)), 'the Ember Line road has its three nodes (' + nodes.map((s) => s.id + ' at ' + s.at).join('; ') + ')');
      while (nodes.length) {
        const P = await ev(() => ({ x: Wilds.field.P.x, y: Wilds.field.P.y }));
        nodes.sort((a, b) => near2(P, a) - near2(P, b));
        const s = nodes.shift();
        const used = await useSpot(s, band), nt = await noteText(), lit = await ev(() => Wilds.lit);
        check(used && lit.includes(s.id), 'Sol lights ' + s.id + ' (lit on this walk: ' + lit.join(', ') + ')');
        check(nt.on && nt.title === 'An Ember Line node: Sol relights it here' && /^Lit on this walk: \d of \d$/.test(nt.body), 'its note: "' + nt.title + ' / ' + nt.body + '"');
        const lab = await ev((sid) => Wilds.field.map.spots.find((x) => x.id === sid).label, s.id);
        check(lab === 'A lit Ember Line node', 'it is marked lit for this walk ("' + lab + '")');
        await checkLayout('with a node’s note');
        await shot('b' + band + '-' + s.id);
      }
      if (id === 'ember-line-road') { const sub2 = await ev(() => document.getElementById('wl-sub2').textContent); check(sub2 === 'Ember Line nodes lit: 3 of 3', 'the corner: "' + sub2 + '"'); }
      const ex = await ev(([m, to]) => Wilds.maps[m].exits.find((e) => e.to === to), [id, next]);
      check(!!ex, id + ' has an exit to ' + next);
      if (!ex) throw new Error('no exit from ' + id + ' to ' + next);
      await walkOut(ex, band);
      await countFights(band);
    }

    // the end of the road
    await waitFor(() => Wilds.mode === 'end' && !Wilds.busy, null, 15000, 'the end card');
    await sleep(300);
    const end = await ev(() => ({ name: document.getElementById('wl-end-name').textContent, text: document.getElementById('wl-end-text').textContent, fights: document.getElementById('wl-end-fights').textContent, nodes: document.getElementById('wl-end-nodes').hidden ? null : document.getElementById('wl-end-nodes').textContent, kicker: document.getElementById('wl-end-kicker').textContent, n: Wilds.fights, logged: Wilds.log.filter((e) => e.kind === 'fight').length, behind: Wilds.field.map.id, again: document.getElementById('wl-again').textContent, choose: document.getElementById('wl-choose').textContent }));
    const n = end.n, want = n ? n + (n === 1 ? ' fight' : ' fights') + ' would have started on the way.' : 'No fights would have started on the way.';
    check(end.name === ENDS[B.end], 'the end card names ' + end.name);
    check(end.text === 'Io has reached ' + ENDS[B.end].replace(/^The /, 'the ') + '. In the game she walks on into it from here.', 'it says she walks on into it in the game: "' + end.text + '"');
    check(end.fights === want && n === seenFights && n === end.logged, 'it counts the fights on the way: "' + end.fights + '" (the test counted ' + seenFights + ')');
    if (band === 2) check(end.nodes === 'Ember Line nodes lit on the way: 3 of 3', 'and the nodes: "' + end.nodes + '"');
    check(end.behind === B.end, 'behind it, ' + B.end + '’s painting, with Io where the exit brings her');
    check(end.again === 'Back to the camp' && end.choose === 'Choose a band', 'its buttons: ' + end.again + ', ' + end.choose);
    await checkLayout('of the end card');
    await shot('b' + band + '-end-' + B.end);

    // back to the camp, with the button
    await page.click('#wl-again');
    await waitFor((c) => Wilds.mode === 'walk' && !Wilds.busy && Wilds.field.map.id === c, camp, 15000, 'the camp again');
    await sleep(300);
    st = await ev(() => ({ P: [Wilds.field.P.x, Wilds.field.P.y], start: Wilds.field.map.start, fights: Wilds.fights, lit: Wilds.lit.length, sub: document.getElementById('wl-sub').textContent, corner: !document.getElementById('wl-corner').hidden }));
    check(Math.hypot(st.P[0] - st.start[0], st.P[1] - st.start[1]) < 14 && st.fights === 0 && st.lit === 0 && st.corner && st.sub === 'Band ' + band + ' · no fights yet', 'Back to the camp: at ' + camp + '’s start, the count begun again ("' + st.sub + '")');
    await shot('b' + band + '-back-at-camp');
    summary.push('band ' + band + ': ' + B.row.length + ' scenes to ' + B.end + ', ' + taps + ' taps, ' + seenFights + (seenFights === 1 ? ' fight, ' : ' fights, ') + ((Date.now() - tb) / 1000).toFixed(0) + ' s');

    // and to the bands, with the corner's button
    await page.click('#wl-back');
    await waitFor(() => Wilds.mode === 'start' && !Wilds.busy, null, 15000, 'the bands card');
    await sleep(200);
    check(await ev(() => !document.getElementById('wl-start').hidden && document.getElementById('wl-corner').hidden), 'Choose a band, in the corner, brings back the bands');
  }

  // band 4 once more, to its end card's Choose a band
  log('band 4 again, to the end card’s Choose a band');
  seenFights = 0; fightShot = true;
  const B4 = BANDS.find((b) => b.band === 4);
  await chooseBand(4);
  for (let i = 0; i < B4.row.length; i++) {
    const ex = await ev(([m, to]) => Wilds.maps[m].exits.find((e) => e.to === to), [B4.row[i], B4.row[i + 1] || B4.end]);
    await walkOut(ex, 4); await countFights(4);
  }
  await waitFor(() => Wilds.mode === 'end' && !Wilds.busy, null, 15000, 'the end card');
  await page.click('#wl-choose');
  await waitFor(() => Wilds.mode === 'start' && !Wilds.busy, null, 15000, 'the bands card');
  await sleep(300);
  check(await ev(() => !document.getElementById('wl-start').hidden && document.getElementById('wl-end').hidden && document.getElementById('wl-corner').hidden), 'the end card’s Choose a band brings back the bands');
  await checkLayout('of the bands card, again');

  for (const s of summary) log(s);
} catch (e) {
  fails.push('stopped: ' + (e && e.message ? e.message : e));
  log('STOPPED: ' + (e && e.message ? e.message : e));
  try { await shot('stopped'); } catch (e2) { /* no screenshot */ }
}
await browser.close();
log(shots.length + ' screenshots in ' + out);
if (errs.length) { console.log('page errors:\n  ' + errs.join('\n  ')); code = 1; }
if (fails.length) { console.log('failed:\n  ' + fails.join('\n  ')); code = 1; }
if (!code) console.log('page test passed');
process.exit(code);
