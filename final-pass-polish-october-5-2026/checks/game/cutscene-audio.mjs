// cutscene-audio.mjs (the hub's follow-up to T17 game 6): a cutscene's own sound (its AudioContext, made inside the
// cutscene) waits while the page is hidden, as the game's music and the battle's do, and goes on when it shows again;
// and once the cutscene is over the page's AudioContext is the browser's own again. Counts every AudioContext the page
// makes, plays "The Colossus, first met" again from the menu's Settings, hides and shows the page as a phone does
// (document.hidden and its visibilitychange), reads each one's state, then skips the cutscene with Esc.
// Build first: node tools/build.mjs --min putting-it-all-together/game.html
// Usage, from the repository's top folder (it opens a browser; the cutscene takes about a minute to build headless):
//   flock /tmp/claude-0/browser.lock node final-pass-polish-october-5-2026/checks/game/cutscene-audio.mjs [dist/game.html]
import fs from 'fs'; import path from 'path'; import { createRequire } from 'module'; import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const R = path.resolve(new URL('../../..', import.meta.url).pathname);
const file = path.resolve(process.argv[2] || path.join(R, 'dist/game.html'));
const THREE_JS = fs.readFileSync(path.join(R, 'tools/.cache/three.min.js'));
const browser = await pw.chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 915, height: 412 } });
const errs = [];
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
await page.route('**/*', (route) => {
  const u = route.request().url();
  if (u.includes('three.min.js')) return route.fulfill({ status: 200, contentType: 'application/javascript', body: THREE_JS });
  if (u.startsWith('file:') || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
  return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
});
// every AudioContext the page makes, in the order made; and a way to hide and show the page
await page.addInitScript(() => {
  const Real = window.AudioContext; window.__ctxs = [];
  window.__AC = window.AudioContext = window.webkitAudioContext = class extends Real { constructor(...a) { super(...a); window.__ctxs.push(this); } };
  let hidden = false;
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (hidden ? 'hidden' : 'visible') });
  window.__show = (v) => { hidden = !v; document.dispatchEvent(new Event('visibilitychange')); };
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const states = () => page.evaluate(() => window.__ctxs.map((c) => c.state));
let bad = 0;
const ok = (good, line) => { if (!good) bad++; console.log((good ? '✓ ' : '✗ ') + line); };
try {
  await page.goto('file://' + file);
  await page.waitForFunction(() => !!document.querySelector('.title h1') && !!window.__game, null, { timeout: 30000 });
  await page.evaluate(() => { localStorage.clear(); const s = GameState.fresh(); s.where = { mode: 'field', map: 'wickhollow', at: [700, 470], dir: 'n' }; s.done.first = true; s.flags.party = true; s.seen = { 'colossus-first-meeting': true }; GameState.save(s, 1); });
  await page.reload();
  await page.waitForSelector('.title-box button', { timeout: 30000 });
  await page.click('.title-box button:text-is("Continue")');
  await page.waitForFunction(() => window.__game.mode === 'field' && !window.__game.busy, null, { timeout: 30000 });
  const before = (await states()).length;
  await page.evaluate(() => { window.__game.menu(); });
  await page.waitForSelector('.gmenu .gmenu-tabs', { timeout: 10000 });
  await page.click('.gmenu-tabs button:text-is("Settings")');
  await page.click('.gmenu-body button:text-is("The Colossus, first met")');
  await page.waitForFunction(() => { const b = document.querySelector('.cutscene-layer.is-over .cs-skip'); return !!b && !b.hidden; }, null, { timeout: 180000, polling: 500 });
  await page.waitForFunction((n) => window.__ctxs.length > n && window.__ctxs.every((c) => c.state === 'running'), before, { timeout: 60000, polling: 500 });
  await sleep(1500);
  let s = await states();
  ok(s.length > before, 'the cutscene made its own sound: ' + s.join(', ') + ' (the game’s ' + before + ', then the cutscene’s)');
  await page.evaluate(() => window.__show(false)); await sleep(600);
  s = await states();
  ok(s.every((x) => x === 'suspended'), 'the page hidden during the cutscene: ' + s.join(', '));
  await page.evaluate(() => window.__show(true)); await sleep(600);
  s = await states();
  ok(s.every((x) => x === 'running'), 'the page shown again: ' + s.join(', '));
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('.cutscene-layer'), null, { timeout: 15000 });
  const own = await page.evaluate(() => window.AudioContext === window.__AC);
  ok(own && !!(await page.$('.gmenu')), 'skipped with Esc, over the menu, which stays; the page’s AudioContext is its own again (' + own + ')');
} catch (e) { bad++; console.log('✗ ' + e.message.split('\n')[0]); await page.screenshot({ path: path.join(R, 'tools/.cache/cutscene-audio-stopped.png') }).catch(() => {}); }
await browser.close();
if (errs.length) { bad++; console.log('✗ page errors: ' + errs.join(' | ')); }
if (bad) { console.log(bad + ' wrong'); process.exit(1); }
console.log('all good');
