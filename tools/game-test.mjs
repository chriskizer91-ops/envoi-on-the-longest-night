// game-test.mjs: plays the built game headless (Chromium + SwiftShader, as tools/check.mjs does) and reports any error.
// Build the page first: node tools/build.mjs --min putting-it-all-together/game.html
// Usage: node tools/game-test.mjs [dist/game.html]
//        [--steps title,new,walk,controls,world,wilds,menu,saves,scenes,save,wild,colossus,finale,keepsakes,songs,chapters]
//        [--band 4] [--level 18] [--out <dir>] [--size 960x540] [--turbo 8] [--offline]
// Without --steps it runs title,new,walk,world,menu,saves,save.
//   title:    the title screen comes up
//   new:      a new game starts, the prologue plays, and Io stands in her cottage
//   walk:     Io walks up Wickhollow's south road with the arrow keys
//   controls: the three ways to move her by pointer, on the same road: holding on the map steers her toward it, a quick
//             tap walks her there, and one thumb on the pad (here a mouse) walks her north and rolls round to north-east
//   world:    the Magpie (the world map is only for flying since the wilderness scenes): a road out of Io's cottage turns
//             her back with her line; then she walks to the Magpie at the end of Wickhollow's jetty by a tap and takes
//             her up, flies to the Warm Roads and lands at its camp, where its scene plays and she rests, the Magpie's
//             glow beside her
//   wilds:    a band's row of wilderness scenes walked by taps, from its camp, where the Magpie is moored, to its town (the
//             party as that band's gate chapter has it; --band 2, 3 or 4, else all three): on every scene the little
//             arrow points the way on, the camps have no random fights and the walks do (the hidden counter grows,
//             though no fight is let start), on the Ember Line road Sol relights a node by a tap (300 shards) while one
//             lit before offers nothing, and from the town the road back leads into the last scene. Not a default step
//             (3 to 4 minutes for the three)
//   menu:     the menu opens on every tab and closes; Settings plays a cutscene again ("Watch again", once a game has
//             shown it), over the menu, and Esc skips it
//   saves:    the game is saved in slot 2, its save code copied, and loaded back from the title's Load; then saves made
//             on the world map before the wilderness scenes: one by a node loads on the Ember Line road with its rest at
//             the Warm Roads camp's fire, one whose Magpie was left at Bogmire finds her moored at the camp, and the
//             title's Continue names where such a save opens
//   scenes:   the staged scenes play on their maps (Sol at the bridge, Quill at the jetty, the knight, Ysmera)
//   save:     the save is written, and the title offers Continue
//   wild:     a wild fight in the band (--band, at --level) is played to its end by the expert play style
//   colossus: the Bramble Colossus is fought the same way (band 4); headless, a whole fight takes a long while. The first
//             time, its cutscene plays first (envoi-final-draft/cutscenes/colossus-first-meeting/): the step sees it
//             draw, skips it with Esc as a player can, and checks the fight starts with the Colossus already standing
//   finale:   the finale's opening cutscene plays before the finale's first try, is skipped with Esc, and the fight starts
//             with Noctara and Halcyon already standing; the fight isn't played out (run it last)
//   keepsakes: the twenty (src/game/keepsakes.js): Io walks by a tap up Chris's secret way over Wickhollow's roof to the
//             Crescent Locket, into the nook by the east bridge for the Forge Horseshoe, and down the Thornwood's dark
//             trail to the Warden's Brooch; Nettie gives her shawl; each shows its card, which never counts them. The Items
//             page shows only what has been found and hands the horseshoe to Io; the Party tab adds them up; they count in
//             a fight and after it (more shards); and the first Bramble Colossus (cut short) leaves its two
//   songs:    Chris's songs play where they belong (the towns', the wilds': the Thornwood, then on into a wilderness
//             scene), each from where it was; the fights play their own theme, and the made-up music plays everywhere
//             else; Music Off quietens them (run after title or new)
//   chapters: the title's Chapters, for gates 5, 10 and 15 and the finale: each opens in the town before its gate (the
//             crossroads' own south road for gate 15, Misthollow for the finale), the party at the gate's level and saved,
//             after the town's arrival scene, with the little arrow pointing her on, and the Magpie moored at a landing
//             on a ground map
// Each step saves a screenshot in --out (tools/.cache/game-test by default). Exits 1 on any page error.
// three.js r128 comes from npm into tools/.cache, since the CDN is unreachable from the sandbox; the fonts are skipped.
// --offline tests the file Chris keeps (node tools/build.mjs --min --offline putting-it-all-together/game.html):
// nothing is served, any reach for the web fails the test, and its fonts must be inside it.
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const R = path.resolve(new URL('..', import.meta.url).pathname);
const cache = path.join(R, 'tools/.cache/three.min.js');
fs.mkdirSync(path.dirname(cache), { recursive: true });
if (!fs.existsSync(cache)) execSync('npm pack three@0.128.0 --silent && tar xzf three-0.128.0.tgz package/build/three.min.js && mv package/build/three.min.js . && rm -rf package three-0.128.0.tgz', { cwd: path.dirname(cache) });
const THREE_JS = fs.readFileSync(cache);

const args = process.argv.slice(2);
let file = path.join(R, 'dist/game.html'), out = path.join(R, 'tools/.cache/game-test'), size = [960, 540];
let steps = ['title', 'new', 'walk', 'world', 'menu', 'saves', 'save'], band = 1, level = 3, turbo = 8, offline = false;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--steps') steps = args[++i].split(',');
  else if (args[i] === '--band') band = +args[++i];
  else if (args[i] === '--level') level = +args[++i];
  else if (args[i] === '--out') out = path.resolve(args[++i]);
  else if (args[i] === '--size') size = args[++i].split('x').map(Number);
  else if (args[i] === '--turbo') turbo = +args[++i];
  else if (args[i] === '--offline') offline = true;
  else file = path.resolve(args[i]);
}
fs.mkdirSync(out, { recursive: true });

const browser = await pw.chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: size[0], height: size[1] } });
const errs = [];
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
await page.route('**/*', (route) => {
  const u = route.request().url();
  if (offline) {
    if (u.startsWith('file:') || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
    errs.push('reached for the web: ' + u.slice(0, 120));
    return route.abort();
  }
  if (u.includes('three.min.js')) return route.fulfill({ status: 200, contentType: 'application/javascript', body: THREE_JS });
  if (u.startsWith('file:') || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
  return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
});
const t0 = Date.now();
const log = (s) => console.log(((Date.now() - t0) / 1000).toFixed(1).padStart(6) + 's  ' + s);
const shot = async (name) => { await page.screenshot({ path: path.join(out, name + '.png') }); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(fn, arg, ms, what) {
  try { await page.waitForFunction(fn, arg, { timeout: ms, polling: 250 }); }
  catch (e) { await shot('timeout-' + what.replace(/\W+/g, '-')); throw new Error('timed out waiting for ' + what); }
}
// tap through the dialogue box until it closes (or until `until` is true)
// a cutscene: wait until it draws, picture it, skip it with Esc as a player can, and wait for its fight to start
// a step that plays on from the title (the save step ends there) continues the game first
async function inPlay() {
  if (!await page.evaluate(() => !!document.querySelector('.game>.title'))) return;
  await page.click('.title-box button:text-is("Continue")');
  await waitFor(() => !document.querySelector('.game>.title') && !window.__game.busy, null, 30000, 'the game to continue');
}
async function throughCutscene(name) {
  await waitFor(() => !!document.querySelector('.cutscene-layer canvas'), null, 120000, 'the ' + name + ' cutscene to draw');
  await waitFor(() => { const b = document.querySelector('.cutscene-layer .cs-skip'); return !!b && !b.hidden; }, null, 120000, 'the ' + name + ' cutscene to play');
  await new Promise((r) => setTimeout(r, 6000));
  await shot(name + '-cutscene');
  await page.keyboard.press('Escape');
  await waitFor(() => !!window.__battle, null, 120000, 'the battle screen after the cutscene');
  log('  its cutscene played, and was skipped with Esc');
}
async function talkThrough(ms, until) {
  const end = Date.now() + (ms || 60000);
  while (Date.now() < end) {
    const st = await page.evaluate(() => { const b = document.querySelector('.talk'); return { open: !!b && !b.hidden, choices: b ? b.querySelectorAll('.talk-choices button').length : 0 }; });
    if (until && await page.evaluate(until)) return;
    if (!st.open) { if (!until) return; await sleep(250); continue; }
    if (st.choices) await page.click('.talk-choices button');
    else await page.click('.talk-words');
    await sleep(120);
  }
  throw new Error('the dialogue never closed');
}

// ---------- walking by taps, as a player does (from envoi-final-draft/wilds/page-test.mjs: plan, settle, walkOut and
// useSpot, reading the game's field) ----------
// in the page: where to tap next toward a goal ({ rect } an exit, or { at } a spot): the goal itself when it is on screen
// (a spot, or a point inside an exit), else the farthest point of the way there that is, found on the field's own grid
// (field.js: her feet and 6 px either side inside a walk area and outside every block and person, on 12 px cells) and
// put on the screen as the field's camera puts it. A tap never lands near anything else she could walk up to and use
function tapToward(goal) {
  const f = window.__game.field, m = f.map, P = f.P, cam = f.cam;
  const cv = f.root.querySelector('.field-cv'), r = cv.getBoundingClientRect();
  const CELL = 12, GW = Math.ceil(1536 / CELL), GH = Math.ceil(1024 / CELL), REACH = 58;
  const inPoly = (pts, x, y) => { let ins = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins; } return ins; };
  const free = (x, y) => m.walk.some((p) => inPoly(p, x, y)) && !(m.block || []).some((p) => inPoly(p, x, y)) && !(m.people || []).some((n) => Math.abs(n.at[0] - x) < 11 && Math.abs(n.at[1] - y) < 7);
  const stand = (x, y) => free(x, y) && free(x - 6, y) && free(x + 6, y);
  const G = (window.__gtGrids = window.__gtGrids || {}), gk = m.id + ':' + (m.people || []).map((n) => n.at.join(',')).join(';');
  let grid = G[gk];
  if (!grid) {
    grid = new Uint8Array(GW * GH);
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) { const x = i * CELL + 6, y = j * CELL + 6; grid[j * GW + i] = stand(x, y) && stand(x, y - 5) && stand(x, y + 5) && stand(x - 5, y) && stand(x + 5, y) ? 1 : 0; }
    G[gk] = grid;
  }
  const centre = (c) => [(c % GW) * CELL + 6, Math.floor(c / GW) * CELL + 6];
  const isGoal = goal.rect ? (x, y) => x >= goal.rect[0] - 8 && x <= goal.rect[2] + 8 && y >= goal.rect[1] - 8 && y <= goal.rect[3] + 8
    : (x, y) => Math.hypot(x - goal.at[0], (y - goal.at[1]) * 1.3) < REACH - 4; // in reach of the spot (field.js, near)
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
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
  // where she stands on a narrow way, or the goal lies along one, the way as the field's fine search finds it
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
  const toS = ([x, y]) => [r.left + (x - cam.x) * cam.z, r.top + (y - cam.y) * cam.z];
  const onField = ([sx, sy]) => sx >= r.left + 6 && sx <= r.right - 6 && sy >= r.top + 6 && sy <= r.bottom - 6 && document.elementFromPoint(sx, sy) === cv;
  // everything else she could walk up to and use: the spots showing, and the people
  const others = (m.spots || []).filter((s) => s.at && !(s.hide && s.hide()) && !(goal.at && s.at[0] === goal.at[0] && s.at[1] === goal.at[1])).concat((m.people || []).filter((n) => !n.hidden));
  const clearOf = ([x, y]) => others.every((s) => Math.hypot(s.at[0] - x, s.at[1] - 20 - y) > 40 && Math.hypot(s.at[0] - x, s.at[1] - y) > 36);
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
// wait while she walks: until she has stopped (still for a few polls), or something happens (the game is busy, or she
// is on another map), or 40 s have passed
async function settle(map0) {
  const now = () => page.evaluate(() => { const g = window.__game, f = g.field; return { map: f.map && f.map.id, mode: g.mode, busy: g.busy, moving: f.P.moving, x: f.P.x, y: f.P.y }; });
  const s0 = await now(), t = Date.now();
  let still = 0, moved = false;
  await sleep(120);
  while (Date.now() - t < 40000) {
    const s = await now();
    if (s.busy || s.mode !== 'field' || s.map !== map0) return 'changed';
    if (Math.hypot(s.x - s0.x, s.y - s0.y) > 2) moved = true;
    still = s.moving ? 0 : still + 1;
    if (still >= 3 && (moved || Date.now() - t > 1200)) return 'stopped';
    await sleep(100);
  }
  return 'timeout';
}
// walk her out of the map by an exit, by taps, and through whatever the next map's arrival plays; the taps it took
async function walkOut(ex, next) {
  const map0 = await page.evaluate(() => window.__game.field.map.id);
  for (let k = 0; k < 60; k++) {
    const p = await page.evaluate(tapToward, { rect: ex.rect });
    if (p.error) throw new Error(p.error);
    await page.mouse.click(p.sx, p.sy);
    const r = await settle(map0);
    if (r === 'timeout') throw new Error('she was still walking after 40 s on ' + map0);
    if (r === 'changed') { await talkThrough(60000, "window.__game.mode === 'field' && !window.__game.busy && !!window.__game.field.map && window.__game.field.map.id === " + JSON.stringify(next)); return k + 1; }
  }
  throw new Error('60 taps did not take her out of ' + map0 + ' to ' + next);
}
// walk her to a spot by taps and use it (a tap on it walks her there and uses it; in reach, Enter): true once its words
// have played through, false when she stands by it and nothing is offered (it is hidden: used already)
async function useSpot(spot) {
  const map0 = await page.evaluate(() => window.__game.field.map.id);
  for (let k = 0; k < 40; k++) {
    const s = await page.evaluate(([x, y]) => { const g = window.__game, f = g.field, n = f.near(); return { busy: g.busy, d: Math.hypot(f.P.x - x, (f.P.y - y) * 1.3), it: !!(n && n.ref && n.ref.at && n.ref.at[0] === x && n.ref.at[1] === y) }; }, spot.at);
    if (s.busy) { await talkThrough(60000, () => !window.__game.busy); return true; }
    if (s.it) { await page.keyboard.press('Enter'); await sleep(300); continue; }
    if (s.d < 50) return false;
    const p = await page.evaluate(tapToward, { at: spot.at }); if (p.error) throw new Error(p.error);
    await page.mouse.click(p.sx, p.sy);
    if (await settle(map0) === 'timeout') throw new Error('walking to ' + (spot.label || spot.id) + ' on ' + map0);
  }
  throw new Error('40 taps did not bring Io to ' + (spot.label || spot.id));
}

let failed = false;
try {
  await page.goto('file://' + file);
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) { /* none */ } });
  await page.reload();
  for (const step of steps) {
    log('step ' + step);
    if (step === 'title') {
      await waitFor(() => !!document.querySelector('.title h1'), null, 30000, 'the title');
      if (offline) {
        // the four faces the page uses, loaded from inside the file
        const faces = await page.evaluate(async () => {
          const want = ['16px "IM Fell English"', 'italic 16px "IM Fell English"', '16px "Atkinson Hyperlegible"', 'bold 16px "Atkinson Hyperlegible"'];
          const got = await Promise.all(want.map((f) => document.fonts.load(f)));
          return want.map((f, i) => f + ': ' + (!got[i].length ? 'missing' : got[i].every((x) => x.status === 'loaded') ? 'loaded' : 'not loaded'));
        });
        const bad = faces.filter((f) => !/: loaded$/.test(f));
        if (bad.length) throw new Error('fonts not inside the file: ' + bad.join('; '));
        log('  fonts inside the file: ' + faces.length);
      }
      await shot('title');
    } else if (step === 'new') {
      await page.click('.title-box button');
      await talkThrough(90000, () => window.__game && window.__game.mode === 'field' && !window.__game.busy);
      await waitFor(() => window.__game.field.map && window.__game.field.map.id === 'cottage', null, 30000, 'the cottage');
      await sleep(600); await shot('cottage');
    } else if (step === 'walk') {
      await page.evaluate(() => { window.__game.goField('wickhollow', [780, 940]); });
      await waitFor(() => window.__game.field.map.id === 'wickhollow' && !window.__game.busy, null, 30000, 'the square');
      const p0 = await page.evaluate(() => [window.__game.field.P.x, window.__game.field.P.y]);
      await page.keyboard.down('ArrowUp'); await sleep(1200); await page.keyboard.up('ArrowUp'); // up the south road
      const p1 = await page.evaluate(() => [window.__game.field.P.x, window.__game.field.P.y]);
      if (Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) < 20) throw new Error('Io did not walk: ' + p0 + ' to ' + p1);
      await shot('walk');
    } else if (step === 'controls') {
      // the three ways to move her by pointer: hold on the map to steer toward it, a quick tap to walk there, and one
      // thumb on the pad (here a mouse), held toward the top
      await page.evaluate(() => { window.__game.goField('wickhollow', [780, 940]); });
      await waitFor(() => window.__game.field.map.id === 'wickhollow' && !window.__game.busy, null, 30000, 'the square');
      await sleep(400);
      const at = () => page.evaluate(() => [window.__game.field.P.x, window.__game.field.P.y]);
      const box = await page.$eval('.field-cv', (c) => { const r = c.getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; });
      let p0 = await at();
      await page.mouse.move(box[0] + box[2] / 2, box[1] + box[3] * 0.12); await page.mouse.down(); await sleep(1300); await page.mouse.up();
      let p1 = await at();
      if (p0[1] - p1[1] < 20) throw new Error('holding the map did not steer her north: ' + p0 + ' to ' + p1);
      log('  held on the map: ' + Math.round(p0[1] - p1[1]) + ' px north');
      await sleep(300); p0 = await at();
      await page.mouse.click(box[0] + box[2] / 2, box[1] + box[3] * 0.8); await sleep(1500);
      p1 = await at();
      if (p1[1] - p0[1] < 15) throw new Error('a tap below her did not walk her there: ' + p0 + ' to ' + p1);
      log('  tapped below her: ' + Math.round(p1[1] - p0[1]) + ' px south');
      await sleep(300); p0 = await at();
      const pad = await page.$eval('.pad', (c) => { const r = c.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2, r.width]; });
      await page.mouse.move(pad[0], pad[1] - pad[2] * 0.4); await page.mouse.down(); await sleep(1000);
      const lit = await page.$$eval('.pad .lit', (b) => b.map((x) => x.className).join(' '));
      await page.mouse.move(pad[0] + pad[2] * 0.4, pad[1] - pad[2] * 0.4); await sleep(200);
      const lit2 = await page.$$eval('.pad .lit', (b) => b.map((x) => x.className).join(' '));
      await page.mouse.up(); p1 = await at();
      if (p0[1] - p1[1] < 15 || !/pad-n/.test(lit) || !(/pad-n/.test(lit2) && /pad-e/.test(lit2))) throw new Error('the pad: ' + p0 + ' to ' + p1 + ', lit ' + lit + ' then ' + lit2);
      log('  the pad: ' + Math.round(p0[1] - p1[1]) + ' px north, rolling to ' + lit2.replace(/pad-/g, ''));
      await shot('controls');
    } else if (step === 'world') {
      // the world map is only for flying the Magpie (Chris, October 3): the party as the story has it when the Magpie first
      // flies to the Warm Roads (band 1 won, Bogmire's refit fitted), the Magpie at Wickhollow's jetty
      await inPlay();
      await page.evaluate(() => { const g = window.__game, st = g.state; Object.assign(st.done, { first: true, 'visit:bogmire': true, greatWraith: true }); Object.assign(st.flags, { party: true, magpie: true, lights: true, refit: true }); st.magpie = 'wickhollow'; st.band = Math.max(st.band, 2); g.goField('cottage', [760, 950]); });
      await waitFor(() => window.__game.field.map.id === 'cottage' && !window.__game.busy, null, 30000, 'the cottage');
      await sleep(400);
      // a road out of the picture turns her back: the cottage's south road, with her line
      const road = await page.evaluate(() => window.MAPS.cottage.exits.find((e) => e.to === 'world' && e.rect[3] >= 1024));
      const line = await page.evaluate((k) => window.SCRIPT.scenes[k][0][1], road.say);
      const r0 = await page.evaluate(tapToward, { rect: road.rect });
      if (r0.error) throw new Error(r0.error);
      await page.mouse.click(r0.sx, r0.sy);
      await waitFor((t) => { const b = document.querySelector('.talk'), s = document.querySelector('.talk-said'); return !!b && !b.hidden && !!s && s.textContent === t; }, line, 30000, 'her line at the road out');
      await shot('world-road-out');
      await talkThrough(30000);
      await waitFor(() => !window.__game.busy, null, 10000, 'the game after her line');
      const back = await page.evaluate((r) => { const g = window.__game, P = g.field.P; return { map: g.field.map.id, mode: g.mode, P: [Math.round(P.x), Math.round(P.y)], inside: P.x >= r[0] - 8 && P.x <= r[2] + 8 && P.y >= r[1] - 8 && P.y <= r[3] + 8 }; }, road.rect);
      if (back.map !== 'cottage' || back.mode !== 'field' || back.inside) throw new Error('the road out of the cottage: ' + JSON.stringify(back));
      log('  the cottage’s south road turns her back with her line, at ' + back.P);
      // the Magpie at the end of the jetty, by a tap: she walks there and is asked to take her up
      await page.evaluate(() => { window.__game.goField('jetty', [768, 700]); });
      await waitFor(() => window.__game.field.map.id === 'jetty' && !window.__game.busy, null, 30000, 'the jetty');
      await sleep(400);
      const mag = await page.evaluate(() => window.__game.field.map.spots.find((s) => s.kind === 'magpie').at);
      const p = await page.evaluate(tapToward, { at: mag });
      if (p.error || !p.direct) throw new Error('the Magpie is not there to tap: ' + JSON.stringify(p));
      await page.mouse.click(p.sx, p.sy);
      await waitFor(() => document.querySelectorAll('.talk-choices button').length > 0, null, 30000, 'the Magpie to offer a flight');
      await page.click('.talk-choices button:text-is("Fly")');
      const t1 = Date.now();
      await waitFor(() => window.__game.mode === 'fly' && !!window.__game.flyer && window.__game.flyer.state.mode === 'fly', null, 120000, 'the Magpie to take off');
      await sleep(500); await shot('world-fly');
      // her own steering toward a stop (fly.js), as a tap on it would set it
      await page.evaluate(() => window.__game.flyer.flyTo('warmCamp'));
      await waitFor(() => { const c = document.querySelector('.fly-card'); return !!c && !c.hidden && /Warm Roads/.test(c.textContent); }, null, 300000, 'the Warm Roads to offer a landing');
      await page.click('.fly-card button');
      // the camp's first landing: its scene, then Rest
      await talkThrough(120000, () => window.__game.mode === 'field' && !window.__game.busy && !!window.__game.field.map && window.__game.field.map.id === 'warm-roads-camp' && !!window.__game.state.done['camp:warmCamp']);
      log('  flew from Wickhollow to the Warm Roads in ' + ((Date.now() - t1) / 1000).toFixed(0) + ' s');
      await sleep(600);
      const w = await page.evaluate(() => { const g = window.__game, st = g.state, L = g.LANDINGS.warmCamp, n = g.field.near(); return { magpie: st.magpie, camp: !!st.done['camp:warmCamp'], P: [g.field.P.x, g.field.P.y], at: L.field && L.field[1], rest: st.rest, near: n && n.label, goal: g.goal }; });
      if (w.magpie !== 'warmCamp' || !w.camp || !w.at || Math.hypot(w.P[0] - w.at[0], w.P[1] - w.at[1]) > 40 || w.rest.map !== 'warm-roads-camp' || w.near !== 'The Magpie' || !w.goal || w.goal.kind !== 'exit') throw new Error('the landing at the Warm Roads: ' + JSON.stringify(w));
      log('  landed at the Warm Roads camp: its scene, a rest there, the Magpie in reach; the arrow points the way on');
      await shot('world');
    } else if (step === 'wilds') {
      // each band's row of wilderness scenes, from the camp where the Magpie is moored to the band's town, walked by taps
      const ROWS = { 2: ['warmCamp', ['warm-roads-camp', 'ember-line-road', 'dawnroost-road'], 'dawnroost'], 3: ['northCamp', ['northern-camp', 'eldergrove-edge', 'cold-moor'], 'crossroads'], 4: ['frozenCamp', ['frozen-camp', 'frostmere-shore'], 'frozen-pass'] };
      // the Ember Line nodes, field spots with the world map's ids: node2 lit by a tap; node1, lit before, offers nothing
      const emberNodes = async () => {
        const node = (id) => page.evaluate((id) => window.MAPS['ember-line-road'].spots.find((s) => s.kind === 'node' && s.id === id), id);
        const shards = () => page.evaluate(() => window.__game.state.shards);
        const sh0 = await shards();
        if (!await useSpot(await node('node2'))) throw new Error('node2 was not offered');
        const lit = await page.evaluate(() => ({ done: !!window.__game.state.done.node2, shown: window.__game.field.map.spots.some((s) => s.id === 'node2' && !(s.hide && s.hide())) })), sh1 = await shards();
        if (!lit.done || lit.shown || sh1 !== sh0 + 300) throw new Error('node2: ' + JSON.stringify(lit) + ', shards ' + sh0 + ' → ' + sh1); // 150 a band, as on the world map
        await shot('wilds-node2');
        if (await useSpot(await node('node1'))) throw new Error('node1, lit before, was offered again');
        if (await shards() !== sh1) throw new Error('node1, lit before, gave shards again');
        log('  Sol relit node2 by a tap (+300 shards), and it went dark; node1, lit before, offers nothing');
      };
      for (const b of band >= 2 && band <= 4 ? [band] : [2, 3, 4]) {
        const [camp, row, end] = ROWS[b], last = row[row.length - 1], tb = Date.now();
        await inPlay();
        // the party as the band's gate chapter has it (its camp's scene played), the Magpie moored at the camp; node1 lit
        await page.evaluate(([b, camp]) => { const g = window.__game, st = g.chapterState(g.CHAPTERS[b]); st.magpie = camp; if (b === 2) st.done.node1 = true; g.state = st; const L = g.LANDINGS[camp]; g.goField(L.field[0], L.field[1], 's'); }, [b, camp]);
        await talkThrough(60000, "window.__game.mode === 'field' && !window.__game.busy && window.__game.field.map.id === '" + row[0] + "'");
        await sleep(400);
        const m0 = await page.evaluate(() => { const g = window.__game, n = g.field.near(); return { near: n && n.label, magpie: g.field.map.spots.filter((s) => s.kind === 'magpie' && !(s.hide && s.hide())).length }; });
        if (m0.near !== 'The Magpie' || m0.magpie !== 1) throw new Error('band ' + b + ': the Magpie at ' + row[0] + ': ' + JSON.stringify(m0));
        await page.evaluate(() => window.__game.field.setCounter(-1e6)); // no random fight starts on the row: the counter carries map to map
        for (let i = 0; i < row.length; i++) {
          const id = row[i], next = row[i + 1] || end;
          const s = await page.evaluate(([id, next]) => { const g = window.__game, m = window.MAPS[id]; return { on: g.field.map.id, kind: m.kind, wild: m.wild || null, scene: window.GameFights.WILD_SCENE[m.band], ex: (m.exits || []).find((e) => e.to === next) || null, goal: g.goal, counter: g.field.P.counter }; }, [id, next]);
          if (s.on !== id || !s.ex) throw new Error('band ' + b + ': on ' + s.on + ', looking for ' + id + '’s way to ' + next);
          const isCamp = s.kind === 'camp';
          if (isCamp ? !!s.wild : !(s.wild && s.wild.band === b && s.wild.scene === s.scene)) throw new Error(id + '’s random fights: ' + JSON.stringify(s.wild));
          const r = s.ex.rect, gl = s.goal; // game.js exitMark: 30 px inside the exit's middle
          if (!gl || gl.kind !== 'exit' || gl.x < r[0] - 40 || gl.x > r[2] + 40 || gl.y < r[1] - 40 || gl.y > r[3] + 40) throw new Error('on ' + id + ' the arrow doesn’t point the way to ' + next + ': ' + JSON.stringify(gl));
          await shot('wilds-' + id);
          if (id === 'ember-line-road') await emberNodes();
          const c0 = await page.evaluate(() => window.__game.field.P.counter);
          const taps = await walkOut(s.ex, next);
          const grew = (await page.evaluate(() => window.__game.field.P.counter)) - c0;
          if (isCamp ? grew !== 0 : grew < 300) throw new Error(id + ': the fights’ counter grew ' + Math.round(grew) + ' px' + (isCamp ? ' in a camp' : ''));
          log('  ' + id + ' → ' + next + ', ' + taps + (taps === 1 ? ' tap' : ' taps') + (isCamp ? ' (a camp: no fights)' : ', ' + Math.round(grew) + ' px toward a fight'));
        }
        // the town at the end of the row, where the last scene's exit brings her, facing into it; and the road back
        const e = await page.evaluate(([last, end]) => { const g = window.__game, x = window.MAPS[last].exits.find((q) => q.to === end); return { on: g.field.map.id, P: [g.field.P.x, g.field.P.y], dir: g.field.P.dir, at: x.at, want: x.dir, goal: g.goal, back: (window.MAPS[end].exits || []).find((q) => q.to === last) || null }; }, [last, end]);
        if (e.on !== end || Math.hypot(e.P[0] - e.at[0], e.P[1] - e.at[1]) > 20 || !e.goal || (e.want && e.dir !== e.want)) throw new Error('the end of band ' + b + '’s road: ' + JSON.stringify(e));
        await shot('wilds-' + end);
        if (!e.back) throw new Error(end + ' has no road back into ' + last);
        await walkOut(e.back, last);
        const P2 = await page.evaluate(() => [window.__game.field.P.x, window.__game.field.P.y]);
        if (Math.hypot(P2[0] - e.back.at[0], P2[1] - e.back.at[1]) > 20) throw new Error('back into ' + last + ' at ' + P2.map(Math.round) + ', not ' + e.back.at);
        await shot('wilds-back-' + last);
        log('  band ' + b + ': ' + row.join(' → ') + ' → ' + end + ' (arriving facing ' + e.dir + '), and back into ' + last + ', in ' + ((Date.now() - tb) / 1000).toFixed(0) + ' s');
      }
    } else if (step === 'menu') {
      await page.evaluate(() => { window.__game.menu(); });
      await waitFor(() => !!document.querySelector('.gmenu'), null, 10000, 'the menu');
      for (const tab of await page.$$eval('.gmenu-tabs button', (b) => b.map((x) => x.textContent))) {
        await page.click('.gmenu-tabs button:text-is("' + tab + '")'); await sleep(200); await shot('menu-' + tab.toLowerCase());
      }
      // a cutscene the game has shown can be watched again from Settings, over the menu
      if (await page.evaluate(() => !!(window.CUTSCENES && window.CUTSCENES['colossus-first-meeting']))) {
        const had = await page.evaluate(() => { const st = window.__game.state, h = !!(st.seen && st.seen['colossus-first-meeting']); st.seen = Object.assign(st.seen || {}, { 'colossus-first-meeting': true }); return h; });
        await page.click('.gmenu-tabs button:text-is("Settings")'); await sleep(200);
        await page.click('.gmenu-body button:text-is("The Colossus, first met")');
        await waitFor(() => { const b = document.querySelector('.cutscene-layer.is-over .cs-skip'); return !!b && !b.hidden; }, null, 120000, 'the cutscene to play again');
        await sleep(8000); await shot('menu-watch-again');
        await page.keyboard.press('Escape');
        await waitFor(() => !document.querySelector('.cutscene-layer'), null, 5000, 'Esc to skip the cutscene');
        if (!await page.evaluate(() => !!document.querySelector('.gmenu'))) throw new Error('the menu closed under the cutscene');
        if (!had) await page.evaluate(() => { delete window.__game.state.seen['colossus-first-meeting']; });
        log('  Settings plays a cutscene again, over the menu');
      }
      await page.click('.gmenu-foot button:text-is("Close")');
      await waitFor(() => !document.querySelector('.gmenu'), null, 10000, 'the menu to close');
    } else if (step === 'wild' || step === 'colossus') {
      await page.evaluate(([L, b]) => { const st = window.__game.state; st.level = L; st.flags = Object.assign(st.flags, { party: true, refit: L > 5, envoi: L > 10, stoop: L > 15 }); st.band = Math.max(st.band, b); }, [level, band]);
      const kind = step === 'colossus' ? 'colossus' : 'wild';
      const opts = step === 'colossus' ? { band: 4, pack: ['colossus'] } : { band, scene: null };
      const cut = step === 'colossus' && await page.evaluate(() => !!(window.CUTSCENES && window.CUTSCENES['colossus-first-meeting']) && !(window.__game.state.seen && window.__game.state.seen['colossus-first-meeting']));
      await page.evaluate(([k, o]) => { window.__game.battle(k === 'colossus' ? 'wild' : k, o); }, [kind, opts]);
      if (cut) await throughCutscene('colossus');
      await waitFor(() => !!window.__battle, null, 60000, 'the battle screen');
      await page.evaluate((tb) => { window.__battle.auto = 'expert'; window.__battle.turbo = tb; }, turbo);
      await waitFor(() => window.__battle && window.__battle.state && window.__battle.state !== 'boot' && window.__battle.state !== 'intro', null, 240000, 'the fight to begin');
      await shot(step + '-fight');
      await waitFor(() => window.__battle && window.__battle.state === 'over' && !document.getElementById('end').hidden, null, 1500000, 'the fight to end');
      const res = await page.evaluate(() => ({ outcome: window.__battle.result.outcome, title: document.getElementById('endTitle').textContent }));
      log('  ' + res.title + ' (' + res.outcome + ')');
      await shot(step + '-end');
      await page.click('#again');
      await waitFor(() => !document.querySelector('.battle-layer'), null, 60000, 'the battle to close');
      const r = await page.evaluate(() => ({ fights: window.__game.state.fights, wins: window.__game.state.wins, level: window.__game.state.level }));
      log('  after the fight: ' + JSON.stringify(r));
      await talkThrough(30000);
      await shot(step + '-after');
    } else if (step === 'keepsakes') {
      // the twenty keepsakes (src/game/keepsakes.js): found on the maps by a tap and the action button, given by Nettie,
      // left by the first Bramble Colossus; each shows its card, which never counts them; the Items page shows only what
      // has been found and hands a shared one over; and they count in a fight and after it
      const walk = async (x, y, what) => {
        const t1 = Date.now();
        await page.evaluate(([x, y]) => window.__game.field.walkTo(x, y), [x, y]);
        await waitFor(([x, y]) => { const P = window.__game.field.P; return Math.hypot(P.x - x, P.y - y) < 14; }, [x, y], 40000, what);
        log('  ' + what + ' by a tap, in ' + ((Date.now() - t1) / 1000).toFixed(1) + ' s');
      };
      const items = () => page.evaluate(() => Object.assign({}, window.__game.state.items));
      // its card: shown, never a count of the twenty, then closed with Enter as a player can
      const card = async (id) => {
        await talkThrough(30000, '!!document.querySelector(".kcard-layer")');
        await waitFor(() => !!document.querySelector('.kcard-layer'), null, 30000, 'the card of ' + id);
        const t = await page.$eval('.kcard-layer', (e) => e.textContent);
        if (/\b20\b|twenty|left to find/i.test(t)) throw new Error('the card counts the keepsakes: ' + t);
        await sleep(400); await shot('keepsake-card-' + id);
        await page.$eval('.kcard-layer', (e) => { e.dataset.seen = '1'; });
        await page.keyboard.press('Enter');
        await waitFor(() => !document.querySelector('.kcard-layer[data-seen]'), null, 10000, 'the card to close'); // (another may follow it)
      };
      const pick = async (id, what, who) => {
        const label = await page.evaluate(() => (window.__game.field.near() || {}).label);
        if (label !== 'Something glinting') throw new Error('nothing to pick up ' + what + ': ' + label);
        await page.keyboard.press('Enter');
        await card(id);
        await waitFor(() => !window.__game.busy, null, 10000, 'the game after the card');
        const it = await items();
        if (it[id] !== who) throw new Error(id + ' is worn by ' + it[id] + ', not ' + who);
        const after = await page.evaluate(() => (window.__game.field.near() || {}).label);
        if (after === 'Something glinting') throw new Error('the keepsake ' + what + ' is still there once found');
        log('  ' + id + ' found ' + what + ', and ' + who + ' wears it');
      };
      await inPlay();
      await page.evaluate(() => { const g = window.__game; g.state.flags.party = true; g.state.done.first = true; g.goField('wickhollow', [700, 440]); });
      await waitFor(() => window.__game.field.map.id === 'wickhollow' && !window.__game.busy, null, 30000, 'the square');
      await walk(458, 562, 'up the tree and along the roof');
      await shot('keepsake-roof');
      await pick('crescent-locket', 'on the roof', 'io');
      await walk(700, 440, 'back down to the square');
      // Nettie's gift as Io sets out with Sol, then her shop
      await walk(568, 462, 'to Nettie');
      const nl = await page.evaluate(() => (window.__game.field.near() || {}).label);
      if (nl !== 'Talk to Nettie') throw new Error('not by Nettie: ' + nl);
      await page.keyboard.press('Enter');
      await card('knotted-shawl');
      await waitFor(() => !!document.querySelector('.gmenu'), null, 20000, 'Nettie’s shop');
      await page.click('.gmenu-foot button:text-is("Done")');
      await waitFor(() => !document.querySelector('.gmenu') && !window.__game.busy, null, 10000, 'the shop to close');
      if ((await items())['knotted-shawl'] !== 'io') throw new Error('Nettie’s shawl is not Io’s: ' + JSON.stringify(await items()));
      log('  Nettie gives Io her shawl, then her shop opens');
      await page.evaluate(() => { window.__game.goField('wickhollow', [1150, 680]); });
      await waitFor(() => !window.__game.busy, null, 30000, 'the east bridge');
      await walk(1195, 690, 'into the nook by the east bridge');
      await pick('forge-horseshoe', 'in the nook', 'sol');
      await page.evaluate(() => { window.__game.goField('thornwood', [800, 540]); });
      await waitFor(() => window.__game.field.map.id === 'thornwood' && !window.__game.busy, null, 30000, 'the Thornwood');
      await page.evaluate(() => window.__game.field.setCounter(-1e6)); // no wild fight on the way
      await walk(1284, 816, 'down the dark trail');
      await shot('keepsake-woods');
      await pick('wardens-brooch', 'in the woods', 'sol');
      // the Items page: only what has been found, never how many are left; hand the shared horseshoe to Io
      await page.evaluate(() => { window.__game.menu(); });
      await waitFor(() => !!document.querySelector('.gmenu'), null, 10000, 'the menu');
      await page.click('.gmenu-tabs button:text-is("Items")'); await sleep(400);
      const tiles = await page.$$eval('.ks-col', (cols) => cols.map((c) => ({ who: c.querySelector('h3').textContent, n: c.querySelectorAll('.ks-tile').length })));
      const itext = await page.$eval('.gmenu-body', (b) => b.textContent);
      if (/\b20\b|twenty|left to find|of 20/i.test(itext)) throw new Error('the Items page counts the keepsakes: ' + itext);
      if (JSON.stringify(tiles) !== JSON.stringify([{ who: 'Io', n: 2 }, { who: 'Sol', n: 2 }])) throw new Error('the Items page shows ' + JSON.stringify(tiles));
      await shot('keepsake-items');
      await page.click('.ks-tile[title="The Forge Horseshoe"]');
      await waitFor(() => !!document.querySelector('.kcard-layer'), null, 10000, 'the horseshoe’s card');
      await shot('keepsake-items-card');
      await page.click('.kcard-actions button:text-is("Give it to Io")');
      await waitFor(() => !document.querySelector('.kcard-layer'), null, 10000, 'the card to close');
      if ((await items())['forge-horseshoe'] !== 'io') throw new Error('the horseshoe was not handed to Io');
      if (!await page.evaluate(() => !!document.querySelector('.gmenu'))) throw new Error('the menu closed with the card');
      const tiles2 = await page.$$eval('.ks-col', (cols) => cols.map((c) => c.querySelectorAll('.ks-tile').length));
      if (tiles2.join() !== '3,1') throw new Error('after handing it over the Items page shows ' + tiles2);
      log('  the Items page shows Io 2 and Sol 2, and hands the horseshoe to Io');
      await page.click('.gmenu-tabs button:text-is("Party")'); await sleep(300);
      const party = await page.$eval('.gmenu-body', (b) => b.textContent);
      if (!party.includes('Her keepsakes: +8.75% healing · +1% HP') || !party.includes('Her keepsakes: +2.5% HP · +2.5% damage')) throw new Error('the Party tab does not add them up: ' + party);
      await shot('keepsake-party');
      await page.click('.gmenu-foot button:text-is("Close")');
      await waitFor(() => !document.querySelector('.gmenu'), null, 10000, 'the menu to close');
      // in a fight: each hero's keepsakes, as the game's maximums have them
      await page.evaluate(() => { window.__game.battle('wild', { band: 1, scene: null }); });
      await waitFor(() => window.__battle && window.__battle.state && window.__battle.state !== 'boot' && window.__battle.state !== 'intro', null, 240000, 'the fight to begin');
      const hs = await page.evaluate(() => {
        const E = window.__battle.engine, GS = window.GameState, st = window.__game.state, h = (id) => E.heroes.find((x) => x.id === id);
        const io = h('io'), sol = h('sol');
        return { io: [io.maxHp, GS.maxHp(st, 'io'), io.maxMp, GS.maxMp(st), io.boostHeal, io.tranceMul, io.herbMul], sol: [sol.maxHp, GS.maxHp(st, 'sol'), sol.boostDmg, sol.tranceMul] };
      });
      const close = (a, b) => Math.abs(a - b) < 1e-9;
      if (hs.io[0] !== hs.io[1] || hs.io[2] !== hs.io[3] || hs.sol[0] !== hs.sol[1] || !close(hs.io[4], 1.0875) || !close(hs.io[5], 1.1) || !close(hs.io[6], 1.1) || !close(hs.sol[2], 1.025) || !close(hs.sol[3], 1.1)) throw new Error('the keepsakes do not count in the fight: ' + JSON.stringify(hs));
      log('  in a fight: Io ' + hs.io[0] + ' HP, heals x' + hs.io[4] + ', Trance x' + hs.io[5] + ', herbs x' + hs.io[6] + '; Sol ' + hs.sol[0] + ' HP, blows x' + hs.sol[2] + ', Trance x' + hs.sol[3]);
      await page.evaluate((tb) => { for (const f of window.__battle.engine.foes) window.__battle.weaken(5, f.key); window.__battle.auto = 'expert'; window.__battle.turbo = tb; }, turbo);
      await waitFor(() => window.__battle && window.__battle.state === 'over' && !document.getElementById('end').hidden, null, 900000, 'the fight to end');
      await page.click('#again');
      // the horseshoe, now Io's, still finds more shards for the party
      await waitFor(() => { const t = document.querySelector('.toast'); return !!t && !t.hidden && /more shards/.test(t.textContent); }, null, 30000, 'the keepsakes’ shards');
      log('  after the win: ' + await page.$eval('.toast', (t) => t.textContent));
      await waitFor(() => !document.querySelector('.battle-layer'), null, 60000, 'the battle to close');
      await talkThrough(30000);
      // the first Bramble Colossus leaves one for each of them (its cutscene marked seen, and the fight cut short)
      await page.evaluate(() => { const st = window.__game.state; st.level = 18; st.band = 4; st.flags = Object.assign(st.flags, { refit: true, envoi: true, stoop: true }); st.seen = Object.assign(st.seen || {}, { 'colossus-first-meeting': true }); window.__game.battle('wild', { band: 4, pack: ['colossus'] }); });
      await waitFor(() => window.__battle && window.__battle.state && window.__battle.state !== 'boot' && window.__battle.state !== 'intro', null, 240000, 'the Colossus to stand');
      await page.evaluate((tb) => { for (const f of window.__battle.engine.foes) window.__battle.weaken(5, f.key); window.__battle.auto = 'expert'; window.__battle.turbo = tb; }, turbo);
      await waitFor(() => window.__battle && window.__battle.state === 'over' && !document.getElementById('end').hidden, null, 900000, 'the Colossus to fall');
      const out = await page.evaluate(() => window.__battle.result && window.__battle.result.outcome);
      if (out !== 'win') throw new Error('the cut-short Colossus fight ended ' + out);
      await page.click('#again');
      await card('heart-seed');
      await card('colossus-thorn');
      await waitFor(() => !window.__game.busy, null, 20000, 'the game after the Colossus');
      const it = await items();
      if (it['heart-seed'] !== 'io' || it['colossus-thorn'] !== 'sol') throw new Error('the Colossus’s keepsakes: ' + JSON.stringify(it));
      log('  the first Colossus left the Heart-Seed (Io) and the Thorn (Sol)');
    } else if (step === 'songs') {
      const songs = () => page.evaluate(() => window.__game.songs.state());
      const near = (a, b) => Math.abs(a - b) < 0.02;
      async function hear(want, what) {
        await sleep(2500);
        const s = await songs(), m = await page.evaluate(() => window.__game.music);
        if (m !== want) throw new Error(what + ': playing ' + m + ', not ' + want + ' ' + JSON.stringify(s));
        if (s.playing && (s.songs[s.playing].paused || !(s.songs[s.playing].at > 0.5))) throw new Error(what + ': the song is not playing ' + JSON.stringify(s));
        log('  ' + what + ': ' + want + (s.playing ? ' at ' + s.songs[s.playing].at.toFixed(1) + ' s, level ' + s.songs[s.playing].level.toFixed(2) : ' (made-up)'));
        return s;
      }
      await page.evaluate(() => { const g = window.__game; g.audioInit(); g.state.flags.party = true; g.goField('wickhollow', [780, 940]); });
      await waitFor(() => window.__game.field.map.id === 'wickhollow' && !window.__game.busy, null, 30000, 'the square');
      let s = await hear('town', 'Wickhollow');
      if (!near(s.songs.town.level, 0.37)) throw new Error('the town song is not at its level: ' + s.songs.town.level);
      const townAt = s.songs.town.at;
      await page.evaluate(() => { window.__game.goField('thornwood', [60, 456]); });
      await waitFor(() => window.__game.field.map.id === 'thornwood' && !window.__game.busy, null, 30000, 'the Thornwood');
      s = await hear('wilds', 'the Thornwood');
      if (!s.songs.town.paused || s.songs.town.at < townAt) throw new Error('the town song did not stop where it was ' + JSON.stringify(s));
      const wildAt = s.songs.wilds.at;
      await page.evaluate(() => { window.__game.battle('wild', { band: 1, scene: null }); });
      await waitFor(() => window.__battle && window.__battle.state && window.__battle.state !== 'boot' && window.__battle.state !== 'intro', null, 240000, 'the fight to begin');
      await sleep(2500); s = await songs();
      const theme = await page.evaluate(() => window.__game.battleTheme);
      if (s.playing || !s.songs.wilds.paused || !theme) throw new Error('a fight should play its own theme, and no song: ' + JSON.stringify(s) + ', theme ' + theme);
      log('  a fight: the battle theme, no song');
      await page.evaluate((tb) => { for (const f of window.__battle.engine.foes) window.__battle.weaken(5, f.key); window.__battle.auto = 'expert'; window.__battle.turbo = tb; }, turbo);
      await waitFor(() => window.__battle && window.__battle.state === 'over' && !document.getElementById('end').hidden, null, 900000, 'the fight to end');
      await page.click('#again');
      await waitFor(() => !document.querySelector('.battle-layer'), null, 60000, 'the battle to close');
      await talkThrough(30000);
      s = await hear('wilds', 'back in the Thornwood');
      if (s.songs.wilds.at < wildAt) throw new Error('the wilds song started again instead of going on: ' + s.songs.wilds.at + ' < ' + wildAt);
      // the wilderness scenes play it too, carrying on from where it was
      const wildAt2 = s.songs.wilds.at;
      await page.evaluate(() => { window.__game.goField('ember-line-road', window.MAPS['ember-line-road'].start); });
      await waitFor(() => window.__game.field.map.id === 'ember-line-road' && !window.__game.busy, null, 30000, 'the Ember Line road');
      s = await hear('wilds', 'the Ember Line road');
      if (s.songs.wilds.at < wildAt2) throw new Error('the wilds song started again on the Ember Line road: ' + s.songs.wilds.at + ' < ' + wildAt2);
      await page.evaluate(() => { window.__game.goField('cottage', [838, 520]); });
      await waitFor(() => window.__game.field.map.id === 'cottage' && !window.__game.busy, null, 30000, 'the cottage');
      s = await hear('title', 'the cottage');
      if (!s.songs.wilds.paused) throw new Error('the wilds song still plays in the cottage');
      // Music Off and back on, from the menu's settings
      await page.evaluate(() => { window.__game.goField('wickhollow', [780, 940]); });
      await waitFor(() => window.__game.field.map.id === 'wickhollow' && !window.__game.busy, null, 30000, 'the square');
      await hear('town', 'Wickhollow again');
      await page.evaluate(() => { window.__game.menu(); });
      await waitFor(() => !!document.querySelector('.gmenu'), null, 10000, 'the menu');
      await page.click('.gmenu-tabs button:text-is("Settings")');
      const musicRow = page.locator('.gm-item', { has: page.locator('span:text-is("Music")') });
      await musicRow.locator('button:text-is("Off")').click(); await sleep(1500);
      s = await songs();
      if (!s.songs.town.paused) throw new Error('Music Off left the song playing ' + JSON.stringify(s));
      await musicRow.locator('button:text-is("Loud")').click(); await sleep(1500);
      s = await songs();
      if (s.songs.town.paused || !near(s.songs.town.level, 0.37 / 0.75)) throw new Error('Music Loud did not bring the song back louder ' + JSON.stringify(s));
      log('  Music off, then loud: level ' + s.songs.town.level.toFixed(2));
      const surround = await page.$$eval('.gm-item span', (x) => x.map((e) => e.textContent).filter((t) => t === 'Surroundings').length);
      if (!surround) throw new Error('no Surroundings volume in the settings');
      await musicRow.locator('button:text-is("Normal")').click();
      await page.click('.gmenu-foot button:text-is("Close")');
      await waitFor(() => !document.querySelector('.gmenu'), null, 10000, 'the menu to close');
    } else if (step === 'finale') {
      await inPlay();
      await page.evaluate(() => { const st = window.__game.state; st.level = 20; st.band = 4; st.flags = Object.assign(st.flags, { party: true, refit: true, envoi: true, charge: true, stoop: true, shipyard: true, upgrade2: true }); if (st.seen) delete st.seen['finale-opening']; });
      await page.evaluate(() => { window.__game.battle('finale'); });
      await throughCutscene('finale');
      await waitFor(() => window.__battle && window.__battle.state === 'battle', null, 240000, 'the finale to begin');
      const seen = await page.evaluate(() => !!(window.__game.state.seen && window.__game.state.seen['finale-opening']));
      if (!seen) throw new Error('the finale cutscene isn’t marked seen');
      await shot('finale-fight');
      log('  the finale began after its cutscene, which won’t play again');
    } else if (step === 'chapters') {
      // each gate's chapter from the title: Io in the town before the gate (the crossroads' own south road; Misthollow
      // for the finale), the party at the gate's level, saved, after the town's arrival scene; and the little arrow
      // pointing her on
      const want = [null, ['bogmire', 5], ['dawnroost', 10], ['crossroads', 15], ['misthollow', 20]];
      for (let k = 1; k < want.length; k++) {
        await page.evaluate(() => { try { localStorage.clear(); } catch (e) { /* none */ } });
        await page.reload();
        await waitFor(() => !!document.querySelector('.title h1'), null, 30000, 'the title');
        await page.click('.title-box button:text-is("Chapters")');
        await waitFor(() => document.querySelectorAll('.talk-choices button').length > 0, null, 10000, 'the chapters');
        await page.click('.talk-choices button:nth-child(' + (k + 1) + ')');
        await waitFor((m) => window.__game && window.__game.mode === 'field' && window.__game.field.map && window.__game.field.map.id === m, want[k][0], 30000, 'chapter ' + k);
        await talkThrough(30000, () => !window.__game.busy);
        // (the Magpie moored at a landing on a ground map: a dock, or a camp's landing ground)
        const st = await page.evaluate(() => ({ level: window.__game.state.level, band: window.__game.state.band, flags: Object.keys(window.__game.state.flags).join(' '), saved: !!localStorage.getItem('envoi.save.v1'), goal: window.__game.goal, magpie: window.__game.state.magpie, moored: (() => { const g = window.__game, L = g.LANDINGS[g.state.magpie]; return L && L.field && window.MAPS[L.field[0]] ? L.field[0] : null; })() }));
        if (st.level !== want[k][1] || !st.saved || !st.goal || !st.moored) throw new Error('chapter ' + k + ': ' + JSON.stringify(st));
        log('  ' + want[k][0] + ': level ' + st.level + ', band ' + st.band + ', flags ' + st.flags + '; the arrow: ' + st.goal.kind + ' at ' + Math.round(st.goal.x) + ', ' + Math.round(st.goal.y) + '; the Magpie at ' + st.magpie + ' (' + st.moored + ')');
        await sleep(500); await shot('chapter-' + k);
      }
    } else if (step === 'saves') {
      // the Saves tab: save in slot 2, copy the save code, then load it back from the title, to the map it was saved on
      const savedMode = await page.evaluate(() => window.__game.mode);
      await page.evaluate(() => { window.__game.menu(); });
      await waitFor(() => !!document.querySelector('.gmenu'), null, 10000, 'the menu');
      await page.click('.gmenu-tabs button:text-is("Saves")');
      await page.click('.gmenu-body .gm-item:nth-child(3) button');
      await waitFor(() => localStorage.getItem('envoi.slot') === '2', null, 10000, 'slot 2 to be in use');
      await page.click('.gmenu-body button:text-is("Copy")');
      await waitFor(() => !!document.querySelector('textarea.code'), null, 10000, 'the save code');
      const code = await page.$eval('textarea.code', (t) => t.value);
      if (!/^ENVOI1:/.test(code)) throw new Error('no save code: ' + code.slice(0, 40));
      log('  save code: ' + code.length + ' letters');
      await shot('saves-code');
      await page.click('.gmenu-foot button:text-is("Done")');
      await page.click('.gmenu-foot button:text-is("Title")');
      await waitFor(() => !!document.querySelector('.title h1'), null, 10000, 'the title');
      await page.click('.title-box button:text-is("Load")');
      await page.click('.talk-choices button:text-is("Paste a save code")');
      await page.fill('textarea.code', code);
      await page.click('.gmenu-foot button:text-is("Load it")');
      await waitFor((m) => window.__game.mode === m && !window.__game.busy, savedMode, 30000, 'the loaded game');
      await shot('saves-loaded');
      // saves made on the world map before the wilderness scenes (nobody walks it now): each loads on the ground maps
      const worldSave = (magpie, at, rest) => page.evaluate(([magpie, at, rest]) => {
        const GS = window.GameState, s = GS.fresh();
        Object.assign(s, { level: 9, band: 2, magpie, shards: 1234 }); Object.assign(s.flags, { party: true, magpie: true, lights: true, refit: true });
        Object.assign(s.done, { first: true, 'visit:bogmire': true, greatWraith: true, 'camp:warmCamp': true, node1: true });
        s.landings = { wickhollow: true, bogmire: true, warmCamp: true };
        s.where = { mode: 'world', at, dir: 's' }; s.rest = rest; return GS.code(s);
      }, [magpie, at, rest]);
      const loadCode = async (code, until) => {
        await page.evaluate(() => { window.__game.menu(); });
        await waitFor(() => !!document.querySelector('.gmenu'), null, 10000, 'the menu');
        await page.click('.gmenu-foot button:text-is("Title")');
        await waitFor(() => !!document.querySelector('.title h1'), null, 10000, 'the title');
        await page.click('.title-box button:text-is("Load")');
        await page.click('.talk-choices button:text-is("Paste a save code")');
        await page.fill('textarea.code', code);
        await page.click('.gmenu-foot button:text-is("Load it")');
        await talkThrough(30000, until || (() => window.__game.mode === 'field' && !window.__game.busy));
        return page.evaluate(() => { const g = window.__game, s = g.state, P = g.field.P; return { map: g.field.map && g.field.map.id, P: [Math.round(P.x), Math.round(P.y)], where: s.where.mode, rest: s.rest, magpie: s.magpie, node1: !!s.done.node1, level: s.level }; });
      };
      // by node1's old marker, its rest at the Warm Roads camp: on the Ember Line road, the rest by the camp's fire
      const o = await loadCode(await worldSave('warmCamp', [960, 1440], { mode: 'world', at: [820, 1560] }));
      const fire = await page.evaluate(() => window.MAPS['warm-roads-camp'].spots.find((s) => s.kind === 'rest').at), elr = await page.evaluate(() => window.MAPS['ember-line-road'].start);
      if (o.map !== 'ember-line-road' || Math.hypot(o.P[0] - elr[0], o.P[1] - elr[1]) > 20 || o.where !== 'field' || o.rest.mode !== 'field' || o.rest.map !== 'warm-roads-camp' || JSON.stringify(o.rest.at) !== JSON.stringify(fire) || !o.node1 || o.level !== 9) throw new Error('a save from the world map: ' + JSON.stringify(o));
      log('  a save from the world map by a node loads on ' + o.map + ' at ' + o.P + ', its rest by the camp’s fire');
      await shot('saves-old-world');
      // its Magpie left at Bogmire, which no road reaches from here now: she is moored at the camp, and a note says so
      await page.evaluate(() => { const t = document.querySelector('.game .toast'); window.__toasts = []; new MutationObserver(() => window.__toasts.push(t.textContent)).observe(t, { childList: true, characterData: true, subtree: true }); });
      const o2 = await loadCode(await worldSave('bogmire', [1000, 1450], { mode: 'field', map: 'bogmire', at: [1208, 281] }));
      const toast = (await page.evaluate(() => window.__toasts)).find((x) => /moored at/.test(x)) || '';
      if (o2.map !== 'ember-line-road' || o2.magpie !== 'warmCamp' || !toast || o2.rest.map !== 'bogmire') throw new Error('a save from the world map, its Magpie at Bogmire: ' + JSON.stringify(o2) + ' ' + JSON.stringify(await page.evaluate(() => window.__toasts)));
      log('  one with the Magpie at Bogmire: ' + toast);
      // the title's Continue names where such a save opens
      await page.evaluate((code) => { const s = window.GameState.fromCode(code); s.saved = Date.now() + 60000; localStorage.setItem('envoi.save.v1.3', JSON.stringify(s)); }, await worldSave('warmCamp', [960, 1440], { mode: 'world', at: [820, 1560] }));
      await page.evaluate(() => { window.__game.menu(); });
      await waitFor(() => !!document.querySelector('.gmenu'), null, 10000, 'the menu');
      await page.click('.gmenu-foot button:text-is("Title")');
      await waitFor(() => !!document.querySelector('.title h1'), null, 10000, 'the title');
      await page.reload();
      await waitFor(() => !!document.querySelector('.title-save'), null, 30000, 'the title after a reload');
      const tl = await page.$eval('.title-save', (e) => e.textContent);
      if (!/^Slot 3 · .*The Ember Line road$/.test(tl)) throw new Error('the title’s Continue line for a save from the world map: ' + tl);
      log('  the title: "' + tl + '"');
      await page.click('.title-box button:text-is("Continue")');
      await waitFor(() => window.__game.mode === 'field' && !window.__game.busy && window.__game.field.map.id === 'ember-line-road', null, 30000, 'Continue to open on the Ember Line road');
      await shot('saves-old-continue');
    } else if (step === 'scenes') {
      // the staged scenes: each one's people walk in on its map; a screenshot as they arrive, and at the scene's end
      // as the story stands when each scene plays: the first fight won, Sol with Io, and so on
      await page.evaluate(() => { const st = window.__game.state; st.done.first = true; Object.assign(st.flags, { party: true }); st.done.halcyon = true; });
      const SC = [['sol', 'wickhollow', [780, 702]], ['magpie', 'jetty', [1100, 392]], ['ambush', 'crossroads', [768, 592]], ['shipyard', 'shipyard', [760, 985]]];
      for (const [id, map, at] of SC) {
        await page.evaluate(([m, a]) => { window.__game.goField(m, a); }, [map, at]);
        // a first visit can play its own scene on arrival (the shipyard's): tap through it
        await sleep(600); await talkThrough(90000, () => window.__game.mode === 'field' && !window.__game.busy);
        await waitFor((m) => window.__game.field.map && window.__game.field.map.id === m && !window.__game.busy, map, 30000, 'the map ' + map);
        await page.evaluate((x) => { window.__game.scene(x); }, id);
        // let the first walk play, then tap through, taking a picture at the first line said with everyone in place
        await sleep(1500);
        let shotN = 0;
        const end = Date.now() + 120000;
        while (Date.now() < end) {
          const st = await page.evaluate(() => ({ busy: window.__game.busy, open: !!document.querySelector('.talk') && !document.querySelector('.talk').hidden, actors: ['sol', 'quill', 'halcyon', 'ysmera'].filter((k) => window.__game.field.stage.actor(k)).length }));
          if (!st.busy) break;
          if (st.open) {
            if (shotN < 2) { await sleep(400); await shot('scene-' + id + '-' + shotN++); }
            await page.click('.talk-words'); await sleep(250); await page.click('.talk-words').catch(() => {});
          }
          await sleep(500);
        }
        await shot('scene-' + id + '-end');
        log('  scene ' + id + ' played');
      }
    } else if (step === 'save') {
      await page.evaluate(() => { window.__game.menu(); });
      await waitFor(() => !!document.querySelector('.gmenu'), null, 10000, 'the menu');
      await page.click('.gmenu-foot button:text-is("Title")');
      await waitFor(() => !!document.querySelector('.title h1'), null, 10000, 'the title again');
      const cont = await page.$$eval('.title-box button', (b) => b.map((x) => x.textContent));
      if (!cont.includes('Continue')) throw new Error('no Continue on the title: ' + cont.join(', '));
      await shot('save');
    } else throw new Error('no step ' + step);
  }
} catch (e) { failed = true; console.log('FAILED: ' + e.message); }
await browser.close();
for (const e of errs) console.log(e);
if (errs.length) failed = true;
console.log(failed ? 'game test failed' : 'game test passed: ' + steps.join(', ') + ' in ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s');
process.exit(failed ? 1 : 0);
