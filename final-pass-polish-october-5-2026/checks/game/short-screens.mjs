// short-screens.mjs (the hub's follow-up to T17): every screen of the game's own, on a phone held sideways in Chrome,
// whose address bar stays (915 x 356; 915 x 330 with the status bar too): the title's questions (Load, Chapters, the
// slot to start in, and the one before a full slot), the box to paste a save code, the prologue, the menu on each of
// its pages, the save code's box, a keepsake's card (found, and from the Items page), the dialogue with Nettie and her
// herb shop, and the ending. Each must be usable: the screen's box on the screen, every button wholly on it, inside any
// panel it sits in, and taking a tap at its middle; and nothing scrolls but a panel made to (the menu's page, the words
// of the dialogue, a keepsake's card). Lines of the dialogue that scroll inside it are listed, not failed. The last pass
// is at 915 x 330 again with the menu's Text size at Large.
// The fonts are the game's own; motion is reduced, so the words show at once. Saves a screenshot of each in --out.
// Build first: node tools/build.mjs --min putting-it-all-together/game.html
// Usage, from the repository's top folder (it opens a browser):
//   flock /tmp/claude-0/browser.lock node final-pass-polish-october-5-2026/checks/game/short-screens.mjs [dist/game.html]
//     [--out dir] [--size 915x356,915x330,915x330big]
import fs from 'fs'; import path from 'path'; import { createRequire } from 'module'; import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const R = path.resolve(new URL('../../..', import.meta.url).pathname);
const args = process.argv.slice(2);
let file = path.join(R, 'dist/game.html'), out = path.join(R, 'tools/.cache/short-screens'), sizes = [[915, 356], [915, 330], [915, 330, 'big']];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--out') out = path.resolve(args[++i]);
  else if (args[i] === '--size') sizes = args[++i].split(',').map((s) => { const m = /^(\d+)x(\d+)(big)?$/.exec(s); return [+m[1], +m[2], m[3]]; });
  else file = path.resolve(args[i]);
}
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
// the page's own measure: the screen's box (the last one matching), the buttons in it, and the boxes not made to scroll
function fits(rootSel, needSel, fixedSel) {
  const V = { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
  const inside = (r, c) => r.left >= c.left - 0.5 && r.right <= c.right + 0.5 && r.top >= c.top - 0.5 && r.bottom <= c.bottom + 0.5;
  const all = document.querySelectorAll(rootSel), root = all[all.length - 1];
  if (!root) return { bad: ['no ' + rootSel + ' on the screen'], info: [] };
  const bad = [], info = [], rr = root.getBoundingClientRect();
  if (!inside(rr, V)) bad.push('its box is off the screen (' + Math.round(rr.top) + ' to ' + Math.round(rr.bottom) + ')');
  for (const e of needSel.length ? root.querySelectorAll(needSel.join(',')) : []) {
    const r = e.getBoundingClientRect(); if (!r.width || !r.height) continue;
    let whole = inside(r, V);
    for (let a = e.parentElement; a && whole && a !== document.body; a = a.parentElement) { const cs = getComputedStyle(a); if (cs.overflowY !== 'visible' || cs.overflowX !== 'visible') whole = inside(r, a.getBoundingClientRect()); }
    const x = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    if (!whole || !x || !(x === e || e.contains(x))) bad.push('“' + (e.textContent || e.getAttribute('aria-label') || e.tagName).trim().slice(0, 24) + '” ' + (whole ? 'covered' : 'not wholly on the screen') + ' (' + Math.round(r.top) + ' to ' + Math.round(r.bottom) + ')');
  }
  for (const sel of fixedSel) { const e = root.matches(sel) ? root : root.querySelector(sel); if (e && e.scrollHeight > e.clientHeight + 1) bad.push(sel + ' needs scrolling (' + e.scrollHeight + ' px in ' + e.clientHeight + ')'); }
  const w = root.querySelector('.talk-words') || (root.matches('.talk') ? root.querySelector('.talk-words') : null);
  if (w && w.scrollHeight > w.clientHeight + 1) info.push('its words scroll (' + w.scrollHeight + ' px in ' + w.clientHeight + ')');
  const b = root.querySelector('.gmenu-body'); if (b) info.push('its page shows ' + b.clientHeight + ' px');
  return { bad, info, top: Math.round(rr.top), bottom: Math.round(rr.bottom) };
}
const browser = await pw.chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
let bad = 0;
for (const [W, H, big] of sizes) {
  const page = await browser.newPage({ viewport: { width: W, height: H }, reducedMotion: 'reduce' });
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  await page.route('**/*', (route) => {
    const u = route.request().url();
    if (u.includes('three.min.js')) return route.fulfill({ status: 200, contentType: 'application/javascript', body: THREE_JS });
    if (u.includes('fonts.googleapis.com/css')) return route.fulfill({ status: 200, contentType: 'text/css', body: FONTS });
    if (u.startsWith('file:') || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
    return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
  });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const tag = W + 'x' + H + (big ? ' large text' : '');
  const check = async (name, rootSel, needSel, fixedSel) => {
    await sleep(250);
    const m = await page.evaluate(fits.toString().replace(/^function fits/, '(function') + ')(' + JSON.stringify(rootSel) + ',' + JSON.stringify(needSel) + ',' + JSON.stringify(fixedSel || []) + ')');
    await page.screenshot({ path: path.join(out, tag.replace(/ /g, '-') + '-' + name.replace(/\W+/g, '-').replace(/^-|-$/g, '') + '.png') });
    if (m.bad.length) bad++;
    console.log((m.bad.length ? '✗ ' : '✓ ') + tag + ' ' + name + (m.top != null ? ' (' + m.top + ' to ' + m.bottom + ')' : '') + (m.bad.length ? ': ' + m.bad.join('; ') : '') + (m.info.length ? ' [' + m.info.join('; ') + ']' : ''));
  };
  const talk = () => page.evaluate(() => { const t = document.querySelector('.talk'); return t && !t.hidden ? (t.querySelectorAll('.talk-choices button').length ? 'choices' : 'words') : null; });
  const until = async (fn, ms, what) => { try { await page.waitForFunction(fn, null, { timeout: ms || 30000, polling: 200 }); } catch (e) { throw new Error('timed out waiting for ' + what); } };
  const choose = async (text) => { await page.locator('.talk-choices button', { hasText: text }).first().click(); await sleep(250); };
  // a save in slot 1: Wickhollow's square by Nettie's stall, Sol with Io, shards to spend, and every keepsake found but
  // the one Nettie gives (so her gift's card shows too)
  const boot = async (make) => {
    await page.goto('file://' + file);
    await until(() => !!document.querySelector('.title h1') && !!window.__game && !!window.GameState, 30000, 'the title');
    await page.evaluate(make);
    if (big) await page.evaluate(() => localStorage.setItem('envoi.settings', JSON.stringify({ big: true })));
    await page.reload();
    await until(() => !!document.querySelector('.title-box button'), 30000, 'the title');
    await page.evaluate(() => document.fonts.ready);
  };
  const square = () => { localStorage.clear(); const s = GameState.fresh(); s.where = { mode: 'field', map: 'wickhollow', at: [568, 470], dir: 'n' }; s.done.first = true; s.flags.party = true; s.shards = 2000; s.level = 4; s.items = {}; for (const it of LOOT.ITEMS) if (it.giver !== 'nettie') s.items[it.id] = it.wear === 'either' ? '' : it.wear; GameState.save(s, 1); };
  try {
    // ---------- the title's questions and the prologue ----------
    await boot(square);
    await page.click('.title-box button:text-is("Load")'); await until(() => document.querySelectorAll('.talk-choices button').length > 0, 10000, 'Load');
    await check('Load: which game', '.talk', ['.talk-choices button'], ['.talk']);
    await choose('Paste a save code'); await until(() => !!document.querySelector('textarea.code'), 10000, 'the box to paste');
    await check('the box to paste a save code', '.gmenu-card', ['button', 'textarea'], ['.gmenu-card']);
    await page.click('.gmenu-foot button:text-is("Back")'); await sleep(300);
    await page.click('.title-box button:text-is("Chapters")'); await until(() => document.querySelectorAll('.talk-choices button').length > 0, 10000, 'Chapters');
    await check('Chapters: start from where', '.talk', ['.talk-choices button'], ['.talk']);
    await choose('Back');
    await page.click('.title-box button:text-is("New game")'); await until(() => document.querySelectorAll('.talk-choices button').length > 0, 10000, 'the slot question');
    await check('the slot to start in', '.talk', ['.talk-choices button'], ['.talk']);
    await choose('Slot 1'); await until(() => [...document.querySelectorAll('.talk-choices button')].some((b) => /Start over it/.test(b.textContent)), 10000, 'the question before a full slot');
    await check('before a full slot', '.talk', ['.talk-choices button'], ['.talk']);
    await choose('Back'); await until(() => { const t = document.querySelector('.game>.title'); return !!t && !t.hidden; }, 10000, 'the title again');
    await page.click('.title-box button:text-is("New game")'); await until(() => document.querySelectorAll('.talk-choices button').length > 0, 10000, 'the slot question again');
    await choose('Slot 2');
    // the prologue: its painting, and each of its lines
    await until(() => !!document.querySelector('.prologue.on') && (() => { const t = document.querySelector('.talk'); return t && !t.hidden; })(), 30000, 'the prologue');
    for (let k = 1; k <= 8; k++) {
      try { await page.waitForFunction(() => { const t = document.querySelector('.talk'); return (t && !t.hidden) || window.__game.mode === 'field'; }, null, { timeout: 5000 }); } catch (e) { break; }
      if (await talk() !== 'words') break;
      const pic = await page.evaluate(() => !!document.querySelector('.prologue'));
      await check('the prologue, line ' + k + (pic ? ' (over its painting)' : ''), '.talk', [], ['.talk']);
      await page.click('.talk-words'); await sleep(900);
    }
    // ---------- in the game: the menu, the save code, a keepsake's card, Nettie and her shop ----------
    await boot(square);
    await page.click('.title-box button:text-is("Continue")');
    await until(() => window.__game.mode === 'field' && !window.__game.busy, 30000, 'the square');
    await page.evaluate(() => { window.__game.menu(); });
    await until(() => !!document.querySelector('.gmenu .gmenu-tabs'), 10000, 'the menu');
    for (const tab of ['Party', 'Herbs', 'Items', 'Moonlore', 'Saves', 'Settings']) {
      await page.click('.gmenu-tabs button:text-is("' + tab + '")');
      await check('the menu: ' + tab, '.gmenu-card', ['.gmenu-tabs button', '.gmenu-foot button'], ['.gmenu-card']);
    }
    // every keepsake's card, from the Items page
    await page.click('.gmenu-tabs button:text-is("Items")');
    const tiles = await page.$$eval('.gmenu-body .ks-tile', (b) => b.map((x) => x.getAttribute('aria-label')));
    for (const name of tiles) {
      await page.click('.gmenu-body .ks-tile[aria-label="' + name.replace(/"/g, '\\"') + '"]'); await until(() => !!document.querySelector('.kcard-layer'), 10000, 'a keepsake’s card');
      await check('the card of ' + name + ', from the Items page', '.kcard-layer', ['button'], ['.kcard-layer']);
      await page.keyboard.press('Escape'); await until(() => !document.querySelector('.kcard-layer'), 5000, 'the card to close');
    }
    await page.click('.gmenu-tabs button:text-is("Saves")'); await page.click('.gmenu-body button:text-is("Copy")');
    await until(() => !!document.querySelector('textarea.code'), 10000, 'the save code');
    await check('the save code’s box', '.gmenu-card', ['button', 'textarea'], ['.gmenu-card']);
    await page.click('.gmenu-foot button:text-is("Done")'); await sleep(300);
    await page.click('.gmenu-foot button:text-is("Close")');
    await until(() => !document.querySelector('.gmenu') && window.__game.mode === 'field' && !window.__game.busy, 10000, 'the menu to close');
    // Nettie: her words, the keepsake she gives once Sol is with Io (its card), then her shop
    await page.keyboard.press('Enter');
    const end = Date.now() + 40000; let saw = new Set();
    while (Date.now() < end && !(await page.$('.gmenu .gmenu-body button'))) {
      if (await page.$('.kcard-layer')) { if (!saw.has('card')) { saw.add('card'); await check('a keepsake’s card, found', '.kcard-layer', ['button'], ['.kcard-layer']); } await page.click('.kcard-actions button:last-child'); await sleep(400); continue; }
      const t = await talk();
      if (t === 'words') { const n = saw.size; saw.add('w' + n); await check('Nettie’s words ' + n, '.talk', [], ['.talk']); await page.click('.talk-words'); await sleep(400); continue; }
      if (t === 'choices') { await check('a question by Nettie', '.talk', ['.talk-choices button'], ['.talk']); await page.click('.talk-choices button'); await sleep(400); continue; }
      await sleep(300);
    }
    await check('Nettie’s herb shop', '.gmenu-card', ['.gmenu-foot button', 'h2'], ['.gmenu-card']);
    await page.click('.gmenu-foot button:text-is("Done")'); await sleep(300);
    // ---------- the ending: the finale won (its battle stood in for), its words over the stars, then its last screen ----------
    await boot(() => { localStorage.clear(); const s = window.__game.chapterState(window.__game.CHAPTERS[4]); s.where = { mode: 'field', map: 'moonwell', at: [775, 800], dir: 'n' }; s.seen = { 'finale-opening': true }; GameState.save(s, 1); });
    await page.evaluate(() => { window.BattleScreen.start = (cfg) => { const t = setTimeout(() => { window.__stubDone = true; cfg.game.onEnd({ outcome: 'win', heroes: [{ id: 'io', hp: 9, mp: 2 }, { id: 'sol', hp: 9 }], xp: 0, shards: 0, herbs: {} }); }, 300); return { stop() { clearTimeout(t); } }; }; });
    await page.click('.title-box button:text-is("Continue")');
    await until(() => window.__game.mode === 'field' && !window.__game.busy, 30000, 'the dead Moonwell');
    await page.keyboard.down('ArrowUp'); await until(() => !!window.__stubDone, 30000, 'the finale'); await page.keyboard.up('ArrowUp');
    await until(() => !!document.querySelector('.ending') && (() => { const t = document.querySelector('.talk'); return t && !t.hidden; })(), 30000, 'the ending');
    for (let k = 1; k <= 10 && !(await page.$('.ending-box button')); k++) {
      if (await talk() === 'words') { await check('the ending, line ' + k, '.talk', [], ['.talk']); await page.click('.talk-words'); }
      await sleep(800);
    }
    await until(() => !!document.querySelector('.ending-box button'), 15000, 'the ending’s last screen');
    await check('the ending’s last screen', '.ending-box', ['button'], ['.ending-box']);
  } catch (e) { bad++; console.log('✗ ' + tag + ' ' + e.message.split('\n')[0]); await page.screenshot({ path: path.join(out, tag.replace(/ /g, '-') + '-stopped.png') }); }
  if (errs.length) { bad++; console.log('✗ ' + tag + ' page errors: ' + errs.join(' | ')); }
  await page.close();
}
await browser.close();
if (bad) { console.log(bad + ' wrong'); process.exit(1); }
console.log('all good');
