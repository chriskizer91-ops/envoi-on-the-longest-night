// check.mjs: plays Envoi Sound Check (the built "Envoi Sound Check.html") headless and checks that every button makes
// sound with no page error: each press, a sound (an oscillator or a buffer of the game's sound engines started, or one of
// Chris's songs) must begin within its wait. Then the marks and Copy my notes, and pictures of the page on a phone held
// sideways and upright. One browser at a time (flock /tmp/claude-0/browser.lock).
// Usage, from the repository's top folder:
//   flock /tmp/claude-0/browser.lock node final-pass-polish-october-5-2026/sound-tool/check.mjs [page] [--quick]
// (--quick presses only the first button of each group). Exits 1 on any miss or page error.
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const HERE = path.dirname(new URL(import.meta.url).pathname);
const args = process.argv.slice(2), quick = args.includes('--quick');
const file = path.resolve(args.find((a) => !a.startsWith('--')) || path.join(HERE, '..', 'Envoi Sound Check.html'));
const out = '/tmp/claude-0/sound-check'; fs.mkdirSync(out, { recursive: true });
const browser = await pw.chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 915, height: 412 } });
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
// count every sound the page starts: oscillators and buffers (the engines) and media (the songs)
await page.addInitScript(() => {
  window.__started = 0;
  // (a buffer's start is its own: AudioBufferSourceNode overrides AudioScheduledSourceNode's)
  for (const P of [window.AudioScheduledSourceNode, window.AudioBufferSourceNode].filter(Boolean).map((C) => C.prototype)) {
    if (!Object.prototype.hasOwnProperty.call(P, 'start')) continue;
    const st = P.start; P.start = function (...a) { window.__started++; return st.apply(this, a); };
  }
  const M = HTMLMediaElement.prototype, pl = M.play; M.play = function (...a) { window.__started++; return pl.apply(this, a); };
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let bad = 0, n = 0;
try {
  await page.goto('file://' + file);
  await page.waitForFunction(() => !!window.__soundCheck, null, { timeout: 30000 });
  await page.click('#start');
  await page.waitForFunction(() => window.__soundCheck.on, null, { timeout: 10000 });
  await page.evaluate(() => { for (const d of document.querySelectorAll('details.group')) d.open = true; });
  const buttons = await page.$$eval('.plays button', (bs) => bs.map((b, i) => ({ i, text: b.textContent, card: b.closest('.card').querySelector('h3').textContent, group: b.closest('details').querySelector('h2').textContent })));
  const seen = new Set();
  for (const b of buttons) {
    if (quick && seen.has(b.group)) continue; seen.add(b.group);
    n++;
    const before = await page.evaluate(() => window.__started);
    await page.$$eval('.plays button', (bs, i) => bs[i].click(), b.i);
    // a cutscene builds its sounds first (a few seconds headless); a place's first sound or song comes at once (its music)
    const wait = /^Cutscenes/.test(b.group) ? 12000 : 2500;
    let got = 0;
    for (const end = Date.now() + wait; Date.now() < end && !got; await sleep(150)) got = (await page.evaluate(() => window.__started)) - before;
    const ok = got > 0;
    if (!ok) bad++;
    console.log((ok ? 'ok   ' : 'MISS ') + b.group + ' / ' + b.card + ' / ' + b.text.replace('▶ ', '') + (ok ? '' : ': no sound began'));
  }
  await page.click('#stopAll');
  await sleep(500);
  // the marks, kept, and Copy my notes
  await page.$$eval('.card', (cs) => { cs[0].querySelector('.judge button[data-v="fix"]').click(); cs[1].querySelector('.judge button[data-v="keep"]').click(); });
  await page.fill('.card >> nth=0 >> .judge input', 'too quiet when she runs');
  await page.click('#copy');
  await sleep(400);
  const copied = await page.$eval('#copyBox', (t) => t.value);
  const notesOk = /Soft steps on earth \[steps-earth\]: Fix: too quiet when she runs/.test(copied) && /Soft steps on stone \[steps-stone\]: Keep/.test(copied);
  if (!notesOk) bad++;
  console.log((notesOk ? 'ok   ' : 'MISS ') + 'the marks and Copy my notes' + (notesOk ? '' : ': ' + copied.slice(0, 200)));
  await page.reload(); await page.waitForFunction(() => !!window.__soundCheck, null, { timeout: 30000 });
  const kept = await page.$eval('#count', (e) => e.textContent);
  const keptOk = /^2 of /.test(kept);
  if (!keptOk) bad++;
  console.log((keptOk ? 'ok   ' : 'MISS ') + 'the marks kept after a reload: ' + kept);
  await page.evaluate(() => { localStorage.clear(); });
  for (const [w, h] of [[915, 412], [390, 844]]) {
    await page.setViewportSize({ width: w, height: h }); await page.reload(); await sleep(600);
    await page.evaluate(() => { const d = document.querySelectorAll('details.group'); d[1].open = true; });
    await page.screenshot({ path: path.join(out, 'page-' + w + 'x' + h + '.png') });
    const wide = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    if (wide) { bad++; console.log('MISS the page scrolls sideways at ' + w + ' x ' + h); }
  }
} catch (e) { bad++; console.log('MISS the check stopped: ' + e.message); }
await browser.close();
if (errs.length) { bad++; console.log('MISS page errors: ' + errs.slice(0, 5).join(' | ')); }
console.log(bad ? bad + ' misses' : 'sound check passed: ' + n + ' buttons each made sound, the notes are kept and copied, no page errors');
process.exit(bad ? 1 : 0);
