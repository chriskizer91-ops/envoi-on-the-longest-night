// battle-fit.mjs: the battle's windows fit the screen and leave the fight in view, on the phone held sideways (915 x 412
// full screen; 915 x 356 and 915 x 330 in Chrome under its address bar), held upright (390 x 844) and on a laptop
// (1366 x 768). It plays the built game (dist/game.html, or the file given) headless, starts a new game and a band 4 wild
// fight (three foes) at level 18 a point short of level 19, with Io's Trance ready so her first menu has all eight
// commands, and at each size looks at:
//   - Io's eight commands, a sub-menu of five (Moonlore) and the target list (Flame Bolt's three foes): every row at
//     least 36 px tall (a thumb's width), the menu inside the screen, every fighter's head and feet on the screen above
//     it (the arena's view slides down until their feet clear the menus; a giant's head may go out of the top), the
//     foes' window (with its bars) clear of the menus, and the party's turn and Trance gauges on the screen. Held
//     upright the fighters are listed, not judged: there the arena's frame, which must fill the screen's height, is
//     too narrow for the field (Io stands off its left edge, before these changes too), and its view can't slide down
//     past the painting's mirrored strip
//   - the end card of the win, with its level-up: all of it, and Continue, on the screen without scrolling
// Exits 1 on any miss or page error. Pictures go to --shots <dir> (none by default).
// Usage (from the repository's top folder, after node tools/build.mjs --min putting-it-all-together/game.html; with the
// browser lock): flock /tmp/claude-0/browser.lock node final-pass-polish-october-5-2026/checks/battles/battle-fit.mjs [dist/game.html] [--shots <dir>]
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { execSync } from 'child_process';
const R = path.resolve(new URL('../../..', import.meta.url).pathname);
const require = createRequire(path.join(R, 'tools/package.json'));
let pw; try { pw = require('playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const args = process.argv.slice(2);
let file = path.join(R, 'dist/game.html'), shots = null;
for (let i = 0; i < args.length; i++) { if (args[i] === '--shots') shots = path.resolve(args[++i]); else file = path.resolve(args[i]); }
if (shots) fs.mkdirSync(shots, { recursive: true });
const SIZES = [[915, 412], [915, 356], [915, 330], [390, 844], [1366, 768]];
const THREE_JS = fs.readFileSync(path.join(R, 'tools/.cache/three.min.js'));

const browser = await pw.chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 915, height: 412 } });
const errs = [];
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
await page.route('**/*', (route) => {
  const u = route.request().url();
  if (u.includes('three.min.js')) return route.fulfill({ status: 200, contentType: 'application/javascript', body: THREE_JS });
  if (u.startsWith('file:') || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
  return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
});
const t0 = Date.now();
const log = (s) => console.log(((Date.now() - t0) / 1000).toFixed(1).padStart(6) + 's  ' + s);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const wf = (fn, arg, ms) => page.waitForFunction(fn, arg, { timeout: ms || 120000, polling: 250 });
let bad = 0;
const say = (ok, text) => { if (!ok) bad++; log((ok ? 'ok   ' : 'FAIL ') + text); };

// what is on the screen now, in CSS pixels
function look() {
  const box = (e) => { if (!e || e.hidden || !e.getClientRects().length) return null; const b = e.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom, h: b.height }; };
  const B = window.__battle;
  return {
    w: innerWidth, h: innerHeight, ui: box(document.getElementById('ui')), cmd: box(document.getElementById('cmd')), enemy: box(document.getElementById('enemy')),
    rows: [...document.querySelectorAll('#cmd button')].map((b) => b.getBoundingClientRect().height),
    gauges: [...document.querySelectorAll('#status .gs')].map(box), spots: B && 'spots' in B ? B.spots : null,
    card: box(document.querySelector('#end .card')), again: box(document.getElementById('again')), lvl: box(document.getElementById('lvlBox')),
    scroll: (() => { const o = document.getElementById('end'); return o ? [o.scrollTop, o.scrollHeight, o.clientHeight] : null; })(),
  };
}
const inside = (b, L) => b && b.t >= -0.5 && b.b <= L.h + 0.5 && b.l >= -0.5 && b.r <= L.w + 0.5;
async function atSizes(what, judge) {
  for (const [w, h] of SIZES) {
    await page.setViewportSize({ width: w, height: h }); await sleep(1500);
    const L = await page.evaluate(look);
    if (shots) await page.screenshot({ path: path.join(shots, what.replace(/\W+/g, '-') + '-' + w + 'x' + h + '.png') });
    const [ok, text] = judge(L);
    say(ok, what + ' at ' + w + ' x ' + h + ': ' + text);
  }
  await page.setViewportSize({ width: 915, height: 412 }); await sleep(600);
}
function menuJudge(L) {
  const rows = L.rows.length ? Math.min(...L.rows) : 0, top = L.ui ? L.ui.t : L.h;
  const giants = (s) => s.tall > 3; // a giant's head may go out of the top (the arena's rule)
  const lost = L.spots ? L.spots.filter((s) => s.feet[1] > top || s.feet[1] > L.h || (!giants(s) && s.head[1] < 0)).map((s) => s.kind) : [];
  const enemyClear = !L.enemy || L.enemy.b <= top;
  const gaugesOn = L.gauges.length && L.gauges.every((g) => inside(g, L));
  const ok = rows >= 36 && inside(L.cmd, L) && (L.w < L.h || !lost.length) && enemyClear && gaugesOn;
  return [ok, L.rows.length + ' rows, the shortest ' + rows.toFixed(0) + ' px; the menus from y ' + top.toFixed(0) + ' of ' + L.h +
    (L.spots ? '; the fighters ' + (lost.length ? 'NOT all on the screen above them: ' + lost.join(', ') : 'all on the screen above them') : '; (no fighter positions in this build)') +
    '; the foes’ window ' + (L.enemy ? 'to y ' + L.enemy.b.toFixed(0) : 'hidden') + (enemyClear ? '' : ' (INTO the menus)') + '; the gauges ' + (gaugesOn ? 'on the screen' : 'OFF it')];
}

try {
  await page.goto('file://' + file, { waitUntil: 'load', timeout: 180000 });
  await wf(() => !!document.querySelector('.title h1'));
  await page.click('.title-box button');
  for (const end = Date.now() + 120000; Date.now() < end;) {
    if (await page.evaluate(() => window.__game && window.__game.mode === 'field' && !window.__game.busy)) break;
    const open = await page.evaluate(() => { const b = document.querySelector('.talk'); return !!b && !b.hidden; });
    if (open) { const ch = await page.$('.talk-choices button'); if (ch) await ch.click(); else await page.click('.talk-words'); }
    await sleep(150);
  }
  log('a new game, in the cottage');
  await page.evaluate(() => {
    const st = window.__game.state; st.level = 18; st.xp = window.BattleRules.xpNeed(18) - 1; st.band = 4;
    st.flags = Object.assign(st.flags, { party: true, refit: true, envoi: true, stoop: true });
    window.__game.battle('wild', { band: 4, pack: ['frostWisp', 'frostWisp', 'wraith'], weather: 'clear', scene: null });
  });
  await wf(() => !!window.__battle);
  await page.evaluate(() => { window.__battle.turbo = 4; });
  await wf(() => window.__battle && window.__battle.state === 'battle', null, 300000);
  await page.evaluate(() => { const E = window.__battle.engine; E.hero('io').tranceReady = true; window.__battle.turbo = 1; });
  log('the fight has begun, Io’s Trance ready');
  // Sol's turns: Guard, until Io's menu comes (her Trance first)
  for (let n = 0; n < 8; n++) {
    await wf(() => window.__battle.menuOpen, null, 300000);
    if (await page.evaluate(() => window.__battle.engine.cur.id === 'io')) break;
    await page.click('#cmd button:has-text("Guard")'); await sleep(400);
  }
  const n = await page.evaluate(() => document.querySelectorAll('#cmd button').length);
  log('Io’s menu: ' + n + ' commands (' + (await page.evaluate(() => [...document.querySelectorAll('#cmd button')].map((b) => b.textContent.trim()).join(', '))) + ')');
  await page.evaluate(() => { window.__battle.turbo = 0; });
  await atSizes('Io’s eight commands', menuJudge);
  await page.click('#cmd button:has-text("Moonlore")'); await sleep(300);
  await atSizes('Moonlore (a sub-menu of five)', menuJudge);
  await page.click('#cmd button:has-text("Back")'); await sleep(300);
  await page.click('#cmd button:has-text("Witchcraft")'); await sleep(300);
  await page.click('#cmd button:has-text("Flame Bolt")'); await sleep(300);
  await atSizes('Flame Bolt’s targets', menuJudge);
  await page.evaluate(() => { window.__battle.turbo = 1; });
  await page.keyboard.press('Enter');
  // the win: the foes brought down to 1 HP, the expert play style choosing, any menu already open answered
  await page.evaluate(() => { const B = window.__battle; for (const f of B.engine.foes) B.weaken(1, f.key); B.auto = 'expert'; B.turbo = 6; });
  for (let k = 0; k < 6 && await page.evaluate(() => window.__battle.menuOpen); k++) { await page.keyboard.press('Enter'); await sleep(300); }
  await wf(() => window.__battle && window.__battle.state === 'over' && !document.getElementById('end').hidden, null, 900000);
  log('the fight is won');
  await sleep(1500);
  await atSizes('the end card', (L) => {
    const noScroll = L.scroll && L.scroll[0] === 0 && L.scroll[1] <= L.scroll[2] + 1;
    const ok = inside(L.again, L) && inside(L.card, L) && !!L.lvl && noScroll;
    return [ok, 'the level-up ' + (L.lvl ? 'shown' : 'NOT shown') + '; Continue ' + (L.again ? 'from y ' + L.again.t.toFixed(0) + ' to ' + L.again.b.toFixed(0) : 'missing') + ' of ' + L.h +
      '; the card ' + (L.card ? L.card.h.toFixed(0) + ' px tall, ' + (inside(L.card, L) ? 'all on the screen' : 'NOT all on the screen') : 'missing') + (noScroll ? '' : ', the overlay scrolls (' + L.scroll[1] + ' px of ' + L.scroll[2] + ')')];
  });
} catch (e) { bad++; log('FAIL: ' + e.message); if (shots) await page.screenshot({ path: path.join(shots, 'failed.png') }); }
if (errs.length) { bad++; log('FAIL: page errors: ' + errs.slice(0, 6).join(' | ')); }
await browser.close();
console.log(bad ? 'FAIL: ' + bad + ' misses' : 'all good');
process.exit(bad ? 1 : 0);
