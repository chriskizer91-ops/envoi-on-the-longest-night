// field-check.mjs: three of the audit's walking findings, played in the built game at a Pixel 7a held sideways
// (915 x 412, or --size) (T17, walking 2, 4 and 5, in handoff/wrap-up-2026-10-05.md).
//   ambush:   Halcyon's ambush fires on the crossroads, a wild map, with the random fights' counter nearly full. It
//             starts the count again, so no random fight comes a step or two after it (the counter is 0 when it fires).
//   question: the Magpie's question on the jetty. While it's asked the d-pad is hidden, as the action button is (it used
//             to show above and through the short question box), and it's back once the question is answered.
//   mini-map: the mini-map, tapped big, stays clear of the d-pad's Up button (at 915 x 412 it ran 18 px under it).
//   mist:     the Magpie flown into the mist over a band she can't reach yet says she needs more lift; flown into the
//             mist that never lifts (band 0, under mist all game), it says so instead, not that she needs more lift.
// Build first (node tools/build.mjs --min putting-it-all-together/game.html), then, from the repository's top folder:
//   flock /tmp/claude-0/browser.lock node final-pass-polish-october-5-2026/checks/walking/field-check.mjs [dist/game.html] [--size 915x356]
// Exits 1 if any check fails; screenshots go to /tmp/claude-0/field-check-<size>.
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const R = path.resolve(new URL('../../..', import.meta.url).pathname);
// --size WxH: another screen (915x356 is the phone with Chrome's address bar showing)
const argv = process.argv.slice(2), si = argv.indexOf('--size'), size = si >= 0 ? argv.splice(si, 2)[1].split('x').map(Number) : [915, 412];
const file = path.resolve(argv[0] || path.join(R, 'dist/game.html')), out = '/tmp/claude-0/field-check-' + size.join('x');
fs.mkdirSync(out, { recursive: true });
const THREE_JS = fs.readFileSync(path.join(R, 'tools/.cache/three.min.js')); // game-test.mjs fetches it once

const browser = await pw.chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: size[0], height: size[1] } });
const errs = [];
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
await page.route('**/*', (route) => {
  const u = route.request().url();
  if (u.includes('three.min.js')) return route.fulfill({ status: 200, contentType: 'application/javascript', body: THREE_JS });
  if (u.startsWith('file:') || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
  return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = (name) => page.screenshot({ path: path.join(out, name + '.png') });
async function waitFor(fn, arg, ms, what) {
  try { await page.waitForFunction(fn, arg, { timeout: ms, polling: 200 }); }
  catch (e) { await shot('timeout'); throw new Error('timed out waiting for ' + what); }
}
async function talkThrough(ms, until) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (until && await page.evaluate(until)) return;
    const s = await page.evaluate(() => { const b = document.querySelector('.talk'); return { open: !!b && !b.hidden, choices: b ? b.querySelectorAll('.talk-choices button').length : 0 }; });
    if (!s.open) { if (!until) return; await sleep(250); continue; }
    if (s.choices) await page.click('.talk-choices button'); else await page.click('.talk-words');
    await sleep(120);
  }
  throw new Error('the dialogue never closed');
}
const inPlay = () => window.__game && window.__game.mode === 'field' && !window.__game.busy;
const results = [];
const check = (name, ok, said) => { results.push([name, ok, said]); console.log((ok ? '✓ ' : '✗ ') + name + ': ' + said); };

try {
  await page.goto('file://' + file);
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) { /* none */ } });
  await page.reload();
  await waitFor(() => !!document.querySelector('.title-box button'), null, 60000, 'the title');
  await page.click('.title-box button');
  await talkThrough(90000, inPlay);

  // ---- ambush: the party as the Gate 15 chapter has it, on the crossroads just south of Halcyon's ambush ----
  await page.evaluate(() => { const g = window.__game; g.state = g.chapterState(g.CHAPTERS.find((c) => /Gate 15/.test(c.name))); g.goField('crossroads', [770, 700], 'n'); });
  await talkThrough(90000, () => window.__game.field.map && window.__game.field.map.id === 'crossroads' && window.__game.mode === 'field' && !window.__game.busy);
  const spot = await page.evaluate(() => {
    const f = window.__game.field, s = f.map.spots.find((x) => x.id === 'halcyon'), r = s.rect;
    // the nearest ground she stands on a few steps south of the ambush's edge, on the road's middle
    for (let y = r[3] + 6; y < r[3] + 80; y += 2) for (let dx = 0; dx <= 200; dx += 4) for (const x of [770 - dx, 770 + dx]) if (f.canStand(x, y)) return { at: [x, y], rect: r };
    return null;
  });
  if (!spot) throw new Error('no ground south of the ambush');
  await page.evaluate((at) => window.__game.goField('crossroads', at, 'n'), spot.at);
  await talkThrough(30000, inPlay);
  const before = await page.evaluate(() => { const f = window.__game.field; f.setCounter(f.gap - 60); return { counter: Math.round(f.P.counter), gap: Math.round(f.gap) }; });
  await page.keyboard.down('ArrowUp');
  await waitFor(() => window.__game.busy > 0, null, 15000, 'the ambush to fire');
  await page.keyboard.up('ArrowUp');
  const at = await page.evaluate(() => { const f = window.__game.field; return { counter: Math.round(f.P.counter), map: f.map.id, battle: !!window.__battle, y: Math.round(f.P.y) }; });
  check('ambush', at.counter === 0, 'counter ' + before.counter + ' of ' + before.gap + ' before; ' + at.counter + ' when the ambush fired at y ' + at.y + ' (the rect ends at ' + spot.rect[3] + ')');
  await shot('ambush');

  // ---- question: the Magpie's, on Wickhollow's jetty, the party as the world step has it ----
  await page.reload();
  await waitFor(() => !!document.querySelector('.title-box button'), null, 60000, 'the title again');
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) { /* none */ } });
  await page.reload();
  await waitFor(() => !!document.querySelector('.title-box button'), null, 60000, 'the title again');
  await page.click('.title-box button');
  await talkThrough(90000, inPlay);
  await page.evaluate(() => { const g = window.__game, st = g.state; Object.assign(st.done, { first: true, 'visit:bogmire': true, greatWraith: true }); Object.assign(st.flags, { party: true, magpie: true, lights: true, refit: true }); st.magpie = 'wickhollow'; st.band = Math.max(st.band, 2); g.goField('jetty', g.LANDINGS.wickhollow.field[1], 's'); });
  await waitFor(() => window.__game.field.map.id === 'jetty' && window.__game.mode === 'field' && !window.__game.busy, null, 30000, 'the jetty');
  await sleep(500);
  const shown = () => page.evaluate(() => { const p = document.querySelector('.pad'), r = p.getBoundingClientRect(); return getComputedStyle(p).display !== 'none' && !p.closest('[hidden]') && r.width > 0; });
  const pad0 = await shown();
  await page.keyboard.press('Enter');
  await waitFor(() => document.querySelectorAll('.talk-choices button').length > 0, null, 30000, 'the Magpie to ask');
  await sleep(300);
  const asked = await page.evaluate(() => [...document.querySelectorAll('.talk-choices button')].map((b) => b.textContent));
  const padAsked = await shown();
  await shot('question');
  await page.click('.talk-choices button:last-child');
  await waitFor(() => window.__game.mode === 'field' && !window.__game.busy, null, 30000, 'the question to close');
  await sleep(300);
  const pad1 = await shown();
  check('question', pad0 && !padAsked && pad1, 'the d-pad ' + (pad0 ? 'shows' : 'is hidden') + ' on the jetty, ' + (padAsked ? 'shows' : 'is hidden') + ' while the Magpie asks (' + asked.join(' / ') + '), ' + (pad1 ? 'shows' : 'is hidden') + ' after');

  // ---- mini-map: tapped big, clear of the d-pad's Up button ----
  await page.click('.mini');
  await sleep(700);
  const mm = await page.evaluate(() => { const a = document.querySelector('.mini').getBoundingClientRect(), b = document.querySelector('.pad-n').getBoundingClientRect(); return { mini: [a.left, a.top, a.right, a.bottom].map(Math.round), up: [b.left, b.top, b.right, b.bottom].map(Math.round), big: document.querySelector('.mini').classList.contains('big') }; });
  const ox = Math.min(mm.mini[2], mm.up[2]) - Math.max(mm.mini[0], mm.up[0]), oy = Math.min(mm.mini[3], mm.up[3]) - Math.max(mm.mini[1], mm.up[1]);
  check('mini-map', mm.big && !(ox > 0 && oy > 0), 'big mini-map ' + JSON.stringify(mm.mini) + ', the Up button ' + JSON.stringify(mm.up) + (ox > 0 && oy > 0 ? ': overlapping ' + ox + ' x ' + oy + ' px' : ': clear') + (mm.mini[2] - mm.mini[0] < 300 ? ' (only ' + (mm.mini[2] - mm.mini[0]) + ' px wide)' : ''));
  await shot('mini-map');
  await page.click('.mini');
  await sleep(400);

  // ---- mist: up in the Magpie, flown into each mist ----
  await page.keyboard.press('Enter');
  await waitFor(() => document.querySelectorAll('.talk-choices button').length > 0, null, 30000, 'the Magpie to ask again');
  await page.click('.talk-choices button:text-is("Fly")');
  await waitFor(() => window.__game.mode === 'fly' && !!window.__game.flyer && window.__game.flyer.state.mode === 'fly', null, 120000, 'the Magpie to take off');
  // two places on the atlas a little short of a mist's edge, flying straight at it: band 0's (under mist all game), and
  // a band above the party's (closed until the Magpie has more lift)
  const aims = await page.evaluate(() => {
    const B = window.World.bandAt, open = window.__game.state.band, find = (bad) => {
      for (let y = 300; y < 2800; y += 24) for (let x = 300; x < 4300; x += 24) {
        const b = B(x, y); if (!(b > 0 && b <= open)) continue;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          let ok = true; for (let k = 1; k <= 3; k++) { const c = B(x + dx * 12 * k, y + dy * 12 * k); if (!(c > 0 && c <= open)) { ok = false; break; } }
          if (ok && bad(B(x + dx * 12 * 6, y + dy * 12 * 6)) && bad(B(x + dx * 12 * 9, y + dy * 12 * 9))) return { x, y, yaw: Math.atan2(dx, dy) };
        }
      }
      return null;
    };
    return { never: find((b) => b === 0), closed: find((b) => b > open) };
  });
  const mistLine = async (aim) => {
    await page.evaluate((a) => { const S = window.__game.flyer.state; S.pos.set(a.x / 12 - 192, 0, a.y / 12 - 128); S.yaw = a.yaw; S.speed = 0; }, aim);
    await sleep(3200); // the plate's last mist line is let stand 3 s
    const t0 = await page.evaluate(() => document.querySelector('.fly .field-plate').textContent);
    await page.keyboard.down('ArrowUp');
    let said = null;
    for (let k = 0; k < 40 && !said; k++) { await sleep(150); said = await page.evaluate(() => { const p = document.querySelector('.fly .field-plate'); return /mist/i.test(p.textContent) ? p.textContent : null; }); }
    await page.keyboard.up('ArrowUp');
    return said || '(no mist line; the plate said "' + t0 + '")';
  };
  if (!aims.never || !aims.closed) throw new Error('no mist edge found: ' + JSON.stringify(aims));
  const never = await mistLine(aims.never);
  await shot('mist-never');
  const closed = await mistLine(aims.closed);
  await shot('mist-closed');
  check('mist', /needs more lift/.test(closed) && /mist/i.test(never) && !/needs more lift/.test(never), 'into the mist that never lifts: "' + never + '"; into a band not open yet: "' + closed + '"');
} catch (e) {
  console.log('✗ the check stopped: ' + e.message);
  results.push(['run', false, e.message]);
}
if (errs.length) { console.log('✗ page errors: ' + errs.join(' | ')); results.push(['errors', false, '']); }
await browser.close();
const bad = results.filter((r) => !r[1]);
console.log(bad.length ? bad.length + ' of ' + results.length + ' failed' : 'field check passed: ' + results.map((r) => r[0]).join(', '));
process.exit(bad.length ? 1 : 0);
