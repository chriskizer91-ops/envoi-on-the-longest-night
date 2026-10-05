// still-walk.mjs: the walking map can't freeze when Io (or anyone in a scene) is walked to the point she already stands
// on (found by the game fixer in the final pass; field.js walkAlong). The field's clock (`last`) is set from
// performance.now() when it resumes or shows, which can be later than the next frame's own time, so that frame's step
// came out negative; a walk of no length then divided nothing by nothing, her position became NaN, the drawing threw
// ("createRadialGradient ... non-finite") and the frame loop stopped: the map froze until a reload.
// Here the field resumes with its clock 200 ms ahead (as a late resume puts it, only more), Io is walked to her own
// point, and then walked on by the arrow keys: she must stay where she was, walk on, and no page error come.
// Build first (node tools/build.mjs --min putting-it-all-together/game.html), then, from the repository's top folder:
//   flock /tmp/claude-0/browser.lock node final-pass-polish-october-5-2026/checks/walking/still-walk.mjs [dist/game.html]
// Exits 1 if it fails.
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const R = path.resolve(new URL('../../..', import.meta.url).pathname);
const file = path.resolve(process.argv[2] || path.join(R, 'dist/game.html'));
const THREE_JS = fs.readFileSync(path.join(R, 'tools/.cache/three.min.js')); // game-test.mjs fetches it once
const browser = await pw.chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 915, height: 412 } });
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.route('**/*', (route) => {
  const u = route.request().url();
  if (u.includes('three.min.js')) return route.fulfill({ status: 200, contentType: 'application/javascript', body: THREE_JS });
  if (u.startsWith('file:') || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
  return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ok = false, said = '';
try {
  await page.goto('file://' + file);
  await page.waitForFunction(() => !!document.querySelector('.title-box button'), null, { timeout: 60000 });
  await page.click('.title-box button');
  for (let k = 0; k < 400; k++) {
    const s = await page.evaluate(() => { const g = window.__game, b = document.querySelector('.talk'); return { play: !!g && g.mode === 'field' && !g.busy, open: !!b && !b.hidden }; });
    if (s.play) break;
    if (s.open) await page.click('.talk-words').catch(() => {});
    await sleep(150);
  }
  await page.evaluate(() => { window.__game.state.done.first = true; window.__game.goField('wickhollow', [780, 940], 'n'); });
  await page.waitForFunction(() => window.__game.field.map.id === 'wickhollow' && !window.__game.busy, null, { timeout: 30000 });
  await sleep(500);
  const before = await page.evaluate(() => {
    const f = window.__game.field, pn = performance.now.bind(performance), at = [f.P.x, f.P.y];
    performance.now = () => pn() + 200; f.resume(); performance.now = pn; // the clock ahead of the next frame
    f.stage.io([at.slice()]); // to the point she stands on
    return at;
  });
  await sleep(800);
  const mid = await page.evaluate(() => [window.__game.field.P.x, window.__game.field.P.y]);
  await page.keyboard.down('ArrowUp'); await sleep(900); await page.keyboard.up('ArrowUp');
  const after = await page.evaluate(() => [window.__game.field.P.x, window.__game.field.P.y]);
  const stayed = mid.every(Number.isFinite) && Math.hypot(mid[0] - before[0], mid[1] - before[1]) < 1;
  const walked = after.every(Number.isFinite) && before[1] - after[1] > 20;
  ok = stayed && walked && !errs.length;
  said = 'walked to her own point ' + before.map(Math.round) + ': ' + (stayed ? 'stayed there' : 'went to ' + mid) + '; then by the arrow keys: ' + (walked ? 'walked on ' + Math.round(before[1] - after[1]) + ' px' : 'at ' + after + ' (the map froze)') + (errs.length ? '; page errors: ' + errs.slice(0, 2).join(' | ') : '');
} catch (e) { said = 'the check stopped: ' + e.message; }
await browser.close();
console.log((ok ? '✓ ' : '✗ ') + said);
process.exit(ok ? 0 : 1);
