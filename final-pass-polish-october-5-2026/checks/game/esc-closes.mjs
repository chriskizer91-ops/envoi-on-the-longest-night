// esc-closes.mjs (T17 game 8): Esc closes the menu after any choice in it (Settings, Herbs, Moonlore, Saves: a choice
// redraws the page and takes the focus with it), and the boxes that have a close or cancel button close with Esc as
// that button does: the save code's box (over the menu, which stays), the herb shop, and the box to paste a save code
// (on the title). Plays the built game from a save in Wickhollow's square, by Nettie's stall, with shards to spend.
// Build first: node tools/build.mjs --min putting-it-all-together/game.html
// Usage, from the repository's top folder (it opens a browser):
//   flock /tmp/claude-0/browser.lock node final-pass-polish-october-5-2026/checks/game/esc-closes.mjs [dist/game.html]
import fs from 'fs'; import path from 'path'; import { createRequire } from 'module'; import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const R = path.resolve(new URL('../../..', import.meta.url).pathname);
const file = path.resolve(process.argv[2] || path.join(R, 'dist/game.html'));
const THREE_JS = fs.readFileSync(path.join(R, 'tools/.cache/three.min.js'));
const browser = await pw.chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 915, height: 412 } });
const errs = [];
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
await page.route('**/*', (route) => {
  const u = route.request().url();
  if (u.includes('three.min.js')) return route.fulfill({ status: 200, contentType: 'application/javascript', body: THREE_JS });
  if (u.startsWith('file:') || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
  return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let bad = 0;
const ok = (good, line) => { if (!good) bad++; console.log((good ? '✓ ' : '✗ ') + line); };
const menus = () => page.evaluate(() => document.querySelectorAll('.gmenu').length);
const esc = async () => { await page.keyboard.press('Escape'); await sleep(400); };
// the menu open on a tab
async function openMenu(tab) {
  await page.evaluate(() => { window.__game.menu(); });
  await page.waitForSelector('.gmenu .gmenu-tabs', { timeout: 10000 });
  await page.click('.gmenu-tabs button:text-is("' + tab + '")');
}
// the menu shut by its own Close button, after a check that left it open
async function shut() { while (await menus()) { await page.click('.gmenu-foot button:text-is("' + ((await page.$('textarea.code')) ? 'Done' : 'Close') + '")'); await sleep(300); } }
try {
  await page.goto('file://' + file);
  await page.waitForFunction(() => !!document.querySelector('.title h1') && !!window.__game, null, { timeout: 30000 });
  await page.evaluate(() => { localStorage.clear(); const s = GameState.fresh(); s.where = { mode: 'field', map: 'wickhollow', at: [568, 470], dir: 'n' }; s.done.first = true; s.shards = 2000; s.hp.io = 20; GameState.save(s, 1); });
  await page.reload();
  await page.waitForSelector('.title-box button', { timeout: 30000 });
  await page.click('.title-box button:text-is("Continue")');
  await page.waitForFunction(() => window.__game.mode === 'field' && !window.__game.busy, null, { timeout: 30000 });
  // a choice on each page that has them, then Esc
  const choices = [
    ['Settings', 'Map light: Bright', async () => { await page.click('.gmenu-body button:text-is("Bright")'); }],
    ['Herbs', 'a Moonpetal on Io', async () => { await page.click('.gmenu-body .gm-item button:text-is("Use")'); await page.click('.gmenu-body button:text-is("Io")'); }],
    ['Moonlore', 'Lunar Mend on Io', async () => { await page.click('.gmenu-body button:text-is("Cast")'); await page.click('.gmenu-body button:text-is("Io")'); }],
    ['Saves', 'Save here, in slot 1', async () => { await page.click('.gmenu-body .gm-item:nth-child(2) button:text-is("Save here")'); }],
  ];
  for (const [tab, what, act] of choices) {
    await openMenu(tab); await act(); await sleep(300);
    const open = await menus(); await esc();
    const left = await menus();
    ok(open === 1 && left === 0, tab + ', after ' + what + ': Esc ' + (left ? 'left the menu open' : 'closed the menu'));
    await shut();
  }
  // the save code's box over the menu: Esc closes the box alone, and then the menu
  await openMenu('Saves'); await page.click('.gmenu-body button:text-is("Copy")');
  await page.waitForSelector('textarea.code', { timeout: 10000 });
  await esc();
  const box = !!(await page.$('textarea.code')), under = await menus();
  await esc();
  const after = await menus();
  ok(!box && under === 1 && after === 0, 'the save code’s box: Esc ' + (box ? 'left it open' : 'closed it') + ', the menu ' + (under ? 'still there' : 'gone') + '; Esc again ' + (after ? 'left the menu open' : 'closed the menu'));
  await shut();
  // the herb shop: Nettie's stall, a herb bought, then Esc
  await page.waitForFunction(() => window.__game.mode === 'field' && !window.__game.busy, null, { timeout: 10000 });
  await page.keyboard.press('Enter');
  const end = Date.now() + 30000;
  while (Date.now() < end && !(await page.$('.gmenu .gmenu-body button'))) { if (await page.evaluate(() => { const t = document.querySelector('.talk'); return !!t && !t.hidden; })) await page.click('.talk-words'); await sleep(200); }
  const shards = await page.evaluate(() => window.__game.state.shards);
  await page.click('.gmenu-body button:text-is("Buy")'); await sleep(300);
  const bought = (await page.evaluate(() => window.__game.state.shards)) < shards;
  await esc();
  const shop = await menus();
  ok(bought && !shop, 'the herb shop, after a herb bought (' + bought + '): Esc ' + (shop ? 'left it open' : 'closed it'));
  if (shop) await page.click('.gmenu-foot button:text-is("Done")');
  await page.waitForFunction(() => window.__game.mode === 'field' && !window.__game.busy, null, { timeout: 10000 });
  ok(true, 'and the game went on, on the map');
  // the box to paste a save code, from the title's Load: Esc goes back to the title, as Back does
  await openMenu('Party'); await page.click('.gmenu-foot button:text-is("Title")');
  await page.waitForSelector('.title-box button', { timeout: 10000 });
  await page.click('.title-box button:text-is("Load")');
  await page.click('.talk-choices button:text-is("Paste a save code")');
  await page.waitForSelector('textarea.code', { timeout: 10000 });
  await esc();
  const paste = !!(await page.$('textarea.code')), title = await page.evaluate(() => { const t = document.querySelector('.game>.title'); return !!t && !t.hidden; });
  ok(!paste && title, 'the box to paste a save code: Esc ' + (paste ? 'left it open' : 'closed it') + (title ? ', back on the title' : ''));
} catch (e) { bad++; console.log('✗ ' + e.message.split('\n')[0]); }
await browser.close();
if (errs.length) { bad++; console.log('✗ page errors: ' + errs.join(' | ')); }
if (bad) { console.log(bad + ' wrong'); process.exit(1); }
console.log('all good');
