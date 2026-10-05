// title-fits.mjs (T17 game 2): the title screen fits the screen, with a save (Continue and its line) and without one:
// the game's name, every button and the help line inside the page, nothing cut at the top or the bottom. On the phone
// held sideways (915 x 412) it must fit; 390 x 844 and 1366 x 768 are measured too, so a change can be seen not to
// harm them. The fonts are the game's own (from tools/node_modules/@fontsource, as the offline build puts them inside),
// so the lines wrap as on the phone. Saves a screenshot of each in --out.
// Build first: node tools/build.mjs --min putting-it-all-together/game.html
// Usage, from the repository's top folder (it opens a browser):
//   flock /tmp/claude-0/browser.lock node final-pass-polish-october-5-2026/checks/game/title-fits.mjs [dist/game.html] [--out dir]
import fs from 'fs'; import path from 'path'; import { createRequire } from 'module'; import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const R = path.resolve(new URL('../../..', import.meta.url).pathname);
const args = process.argv.slice(2);
let file = path.join(R, 'dist/game.html'), out = path.join(R, 'tools/.cache/title-fits');
for (let i = 0; i < args.length; i++) { if (args[i] === '--out') out = path.resolve(args[++i]); else file = path.resolve(args[i]); }
fs.mkdirSync(out, { recursive: true });
const THREE_JS = fs.readFileSync(path.join(R, 'tools/.cache/three.min.js'));
const NM = path.join(R, 'tools/node_modules/@fontsource');
const face = (family, f, weight, style) => '@font-face{font-family:"' + family + '";font-style:' + style + ';font-weight:' + weight + ';src:url(data:font/woff2;base64,' + fs.readFileSync(path.join(NM, f)).toString('base64') + ') format("woff2")}';
const FONTS = [
  face('IM Fell English', 'im-fell-english/files/im-fell-english-latin-400-normal.woff2', 400, 'normal'),
  face('IM Fell English', 'im-fell-english/files/im-fell-english-latin-400-italic.woff2', 400, 'italic'),
  face('Atkinson Hyperlegible', 'atkinson-hyperlegible/files/atkinson-hyperlegible-latin-400-normal.woff2', 400, 'normal'),
  face('Atkinson Hyperlegible', 'atkinson-hyperlegible/files/atkinson-hyperlegible-latin-700-normal.woff2', 700, 'normal'),
].join('\n');
const browser = await pw.chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
let bad = 0;
for (const [w, h, must] of [[915, 412, true], [390, 844, false], [1366, 768, false]]) {
  for (const saved of [false, true]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.route('**/*', (route) => {
      const u = route.request().url();
      if (u.includes('three.min.js')) return route.fulfill({ status: 200, contentType: 'application/javascript', body: THREE_JS });
      if (u.includes('fonts.googleapis.com/css')) return route.fulfill({ status: 200, contentType: 'text/css', body: FONTS });
      if (u.startsWith('file:') || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
      return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
    });
    await page.goto('file://' + file);
    await page.waitForFunction(() => !!document.querySelector('.title h1') && !!window.GameState, null, { timeout: 30000 });
    await page.evaluate((s) => { localStorage.clear(); if (s) window.GameState.save(window.GameState.fresh(), 1); }, saved);
    await page.reload();
    await page.waitForFunction(() => !!document.querySelector('.title-help'), null, { timeout: 30000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
    const m = await page.evaluate(() => {
      const r = (e) => { const b = e.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom) }; };
      const box = document.querySelector('.title-box'), parts = [...box.children].map((e) => ({ what: e.tagName === 'BUTTON' ? e.textContent : e.className || e.tagName.toLowerCase(), ...r(e) }));
      return { box: r(box), parts, vh: innerHeight, cont: !!document.querySelector('.title-box button.go:not(.alt)') && /Continue/.test(box.textContent) };
    });
    await page.screenshot({ path: path.join(out, 'title-' + w + 'x' + h + (saved ? '-saved' : '') + '.png') });
    const cut = m.parts.filter((p) => p.top < 0 || p.bottom > m.vh);
    const line = w + ' x ' + h + (saved ? ', with a save' : ', no save') + ': the box ' + (m.box.bottom - m.box.top) + ' px tall, top at ' + m.box.top + ' of ' + m.vh + (cut.length ? '; cut: ' + cut.map((p) => p.what + ' (' + p.top + ' to ' + p.bottom + ')').join(', ') : '; all inside');
    if (saved && !m.cont) { bad++; console.log('✗ ' + line + ' (no Continue: the save was not seen)'); }
    else if (cut.length && must) { bad++; console.log('✗ ' + line); }
    else console.log((cut.length ? '! ' : '✓ ') + line);
    await page.close();
  }
}
await browser.close();
if (bad) { console.log(bad + ' wrong'); process.exit(1); }
console.log('all good');
