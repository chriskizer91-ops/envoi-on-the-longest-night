// hidden-audio.mjs (T17 game 6): while the page is hidden (another app, the screen off) the made-up music's sound
// (thareia-audio.js) and the battle's (sound.js) wait, as Chris's songs pause (songs.js), and they go on when the page
// shows again; a sound the game had already stopped before the page was hidden is left stopped. Counts every
// AudioContext the page makes, hides and shows the page as a phone does (document.hidden and its visibilitychange),
// and reads each one's state.
// Build first: node tools/build.mjs --min putting-it-all-together/game.html
// Usage, from the repository's top folder (it opens a browser):
//   flock /tmp/claude-0/browser.lock node final-pass-polish-october-5-2026/checks/game/hidden-audio.mjs [dist/game.html]
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
  window.AudioContext = window.webkitAudioContext = class extends Real { constructor(...a) { super(...a); window.__ctxs.push(this); } };
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
  // the sound starts as at the player's first tap, and the made-up music plays
  await page.evaluate(() => { window.__game.audioInit(); window.ThareiaAudio.musicPlay(window.ThareiaAudio.MUSIC[0].id); });
  await page.waitForFunction(() => window.__ctxs.length >= 2 && window.__ctxs.every((c) => c.state === 'running'), null, { timeout: 10000 });
  ok(true, 'the made-up music’s and the battle’s sound: ' + (await states()).join(', ') + ' (' + (await page.evaluate(() => window.ThareiaAudio.musicPlaying())) + ' playing)');
  await page.evaluate(() => window.__show(false)); await sleep(500);
  let s = await states();
  ok(s.every((x) => x === 'suspended'), 'the page hidden: ' + s.join(', '));
  await page.evaluate(() => window.__show(true)); await sleep(500);
  s = await states();
  ok(s.every((x) => x === 'running'), 'the page shown again: ' + s.join(', '));
  // a sound the game had stopped itself before the page was hidden stays stopped when it shows again (each in turn)
  for (const k of [0, 1]) {
    await page.evaluate((i) => window.__ctxs[i].suspend(), k); await sleep(200);
    await page.evaluate(() => window.__show(false)); await sleep(400);
    await page.evaluate(() => window.__show(true)); await sleep(500);
    s = await states();
    ok(s[k] === 'suspended' && s[1 - k] === 'running', ['the made-up music’s', 'the battle’s'][k] + ' sound stopped before the page was hidden, then shown again: ' + s.join(', '));
    await page.evaluate((i) => window.__ctxs[i].resume(), k); await sleep(200);
  }
  // hidden, the sound asked for again (the made-up music started anew; a battle's sound made ready, as a fight starting
  // does) still waits until the page shows
  await page.evaluate(() => { window.__b = window.makeBattleSound(); window.__b.init(); });
  await page.waitForFunction(() => window.__ctxs.length >= 3 && window.__ctxs[2].state === 'running', null, { timeout: 10000 });
  await page.evaluate(() => window.__show(false)); await sleep(400);
  await page.evaluate(() => { window.ThareiaAudio.musicPlay(window.ThareiaAudio.MUSIC[1].id); window.__b.init(); }); await sleep(500);
  s = await states();
  ok(s.every((x) => x === 'suspended'), 'hidden, the music started again and a battle’s sound made ready: ' + s.join(', '));
  await page.evaluate(() => window.__show(true)); await sleep(500);
  s = await states();
  ok(s.every((x) => x === 'running'), 'and shown again: ' + s.join(', '));
} catch (e) { bad++; console.log('✗ ' + e.message); }
await browser.close();
if (errs.length) { bad++; console.log('✗ page errors: ' + errs.join(' | ')); }
if (bad) { console.log(bad + ' wrong'); process.exit(1); }
console.log('all good');
