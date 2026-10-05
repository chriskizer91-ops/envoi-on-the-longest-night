// endings.mjs: the two endings no test had played in an arena, played through the game (dist/game.html, or the file given)
// as a player reaches them, cut short where it can be:
//   - the spared ending (gate 15): from the chapter's state, Io walks into the knight's ambush at the northern crossroads,
//     its scene is tapped through, and in the crossroads arena the party is brought to 1 HP and falls; Sol stands over
//     Io, Halcyon spares them and leaves, Sol learns Kestrel Stoop, the end card says "Spared", and after Continue the
//     game plays its Kestrel scene and the rest by the well, back on the map
//   - the finale's ending: from the approach chapter, Io walks up the dead Moonwell's steps into the court, its cutscene
//     plays and is skipped, and in the dead Moonwell's arena Noctara and Halcyon are brought to 1 HP and the expert play
//     style wins (Sol first rising on Kestrel Stoop, for a look at her hover there); the battle's ending plays, the end
//     card follows, and after Continue the game's ending screens play to "The End" and its "Back to the title" button
// At gate 15's end, as Sol learns Kestrel Stoop, and in the finale as she hangs on it, her head must be on the screen.
// Exits 1 on a page error or if either doesn't reach its end. Pictures go to --shots <dir>.
// Usage (from the repository's top folder, with the browser lock):
//   flock /tmp/claude-0/browser.lock node final-pass-polish-october-5-2026/checks/battles/endings.mjs [dist/game.html] [--shots <dir>]
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
const snap = async (name) => { if (shots) await page.screenshot({ path: path.join(shots, name + '.png') }); };
// tap through the dialogue box (and any choice) until `until` holds
async function talkThrough(until, ms) {
  for (const end = Date.now() + (ms || 120000); Date.now() < end;) {
    if (await page.evaluate(until)) return;
    const open = await page.evaluate(() => { const b = document.querySelector('.talk'); return !!b && !b.hidden; });
    if (open) { const ch = await page.$('.talk-choices button'); if (ch) await ch.click(); else await page.click('.talk-words'); }
    await sleep(200);
  }
  throw new Error('the talk never got there');
}
// from a chapter's state, onto a map, and walk north (the arrow key held) until the event there takes over
async function walkInto(chapter, map, at) {
  await page.evaluate(([c, m, a]) => { const G = window.__game; G.state = G.chapterState(G.CHAPTERS[c]); G.goField(m, a, 'n'); }, [chapter, map, at]);
  await wf(([m]) => window.__game.field.map && window.__game.field.map.id === m && !window.__game.busy, [map], 30000);
  const stand = await page.evaluate(([a]) => window.__game.field.canStand(a[0], a[1]), [at]);
  if (!stand) throw new Error('Io can’t stand at ' + at + ' on ' + map);
  await page.evaluate(() => window.__game.field.setCounter(0));
  await page.keyboard.down('ArrowUp');
  try { await wf(() => window.__game.busy, null, 20000); } finally { await page.keyboard.up('ArrowUp'); }
}
let bad = 0;
const say = (ok, text) => { if (!ok) bad++; log((ok ? 'ok   ' : 'FAIL ') + text); };
try {
  await page.goto('file://' + file, { waitUntil: 'load', timeout: 180000 });
  await wf(() => !!document.querySelector('.title h1'));
  await page.click('.title-box button');
  await talkThrough(() => window.__game && window.__game.mode === 'field' && !window.__game.busy);
  log('a new game, in the cottage');

  // ---------- the spared ending ----------
  await walkInto(3, 'crossroads', [768, 612]);
  log('Io walks into the knight’s ambush at the crossroads');
  await talkThrough(() => !!window.__battle, 120000);
  await wf(() => window.__battle && window.__battle.state === 'battle', null, 300000);
  const where1 = await page.evaluate(() => (window.__battle.arena ? window.__battle.arena.place.id : null));
  say(where1 === 'crossroads', 'the knight’s fight is in ' + (where1 ? 'the ' + where1 + ' arena' : 'no arena (the flat painting)'));
  await page.evaluate(() => { const B = window.__battle; B.weaken(1, 'io'); B.weaken(1, 'sol'); B.turbo = 3; });
  for (let k = 0; k < 120 && !await page.evaluate(() => window.__battle.state === 'over'); k++) {
    if (await page.evaluate(() => window.__battle.menuOpen)) await page.keyboard.press('Enter');
    await sleep(500);
  }
  await wf(() => { const b = document.getElementById('banner'); return b.classList.contains('on') && /learns Kestrel Stoop/.test(b.textContent); }, null, 300000);
  await sleep(1200); await snap('learns-kestrel-stoop');
  const learn = await page.evaluate(() => { const s = (window.__battle.spots || []).find((f) => f.key === 'sol'); return s ? s.head[1] : null; });
  say(learn != null && learn >= 0, '“Sol learns Kestrel Stoop”: her head at y ' + (learn == null ? '?' : learn.toFixed(0)) + ' of ' + (await page.evaluate(() => innerHeight)));
  await wf(() => window.__battle.state === 'over' && !document.getElementById('end').hidden, null, 300000);
  const end1 = await page.evaluate(() => ({ title: document.getElementById('endTitle').textContent, text: document.getElementById('endText').textContent, trace: window.__battle.trace.map((x) => x[0]).join(' ') }));
  await snap('spared-end-card');
  say(end1.title === 'Spared' && /stand/.test(end1.trace) && /stoop/.test(end1.trace), 'the spared ending played (' + end1.trace + '); the end card: “' + end1.title + '”, “' + end1.text + '”');
  await page.click('#again');
  await talkThrough(() => !window.__game.busy && window.__game.mode === 'field' && !document.querySelector('.battle-layer'), 120000);
  const after1 = await page.evaluate(() => ({ map: window.__game.field.map.id, done: !!window.__game.state.done.halcyon, stoop: !!window.__game.state.flags.stoop }));
  await snap('spared-after');
  say(after1.done && after1.stoop, 'after Continue: the Kestrel scene and the rest by the well played, back on ' + after1.map + ' (Halcyon met: ' + after1.done + ', Kestrel Stoop learned: ' + after1.stoop + ')');

  // ---------- the finale's ending ----------
  await walkInto(4, 'moonwell', [775, 820]);
  log('Io walks up the dead Moonwell’s steps into the court');
  const cut = await page.evaluate(() => !!(window.CUTSCENES && window.CUTSCENES['finale-opening']));
  if (cut) {
    await wf(() => { const b = document.querySelector('.cutscene-layer .cs-skip'); return !!b && !b.hidden; }, null, 180000);
    await sleep(3000); await snap('finale-cutscene');
    await page.keyboard.press('Escape');
    log('its cutscene played, and was skipped with Esc');
  }
  await wf(() => !!window.__battle, null, 180000);
  await wf(() => window.__battle && window.__battle.state === 'battle', null, 300000);
  const where2 = await page.evaluate(() => (window.__battle.arena ? window.__battle.arena.place.id : null));
  say(where2 === 'dead-moonwell', 'the finale is in ' + (where2 ? 'the ' + where2 + ' arena' : 'no arena (the flat painting)'));
  // first, Sol's Kestrel Stoop (Io defends meanwhile), for a picture of her hanging in the air in this arena
  await page.evaluate(() => { window.__battle.engine.hero('sol').heat = 100; });
  for (let n = 0; n < 6; n++) {
    await wf(() => window.__battle.menuOpen, null, 300000);
    if (await page.evaluate(() => window.__battle.engine.cur.id === 'sol')) {
      await page.click('#cmd button:has-text("Sword Arts")'); await sleep(300); await page.click('#cmd button:has-text("Kestrel Stoop")'); await sleep(300); await page.keyboard.press('Enter');
      break;
    }
    await page.click('#cmd button:has-text("Defend")'); await sleep(400);
  }
  await wf(() => window.__battle.shown.sol && window.__battle.shown.sol.aloft, null, 300000);
  await sleep(1500); await snap('kestrel-stoop-hover');
  const hover = await page.evaluate(() => { const s = window.__battle.spots.find((f) => f.key === 'sol'); return s ? s.head[1] : null; });
  say(hover != null && hover >= 0, 'Sol hangs in the air on Kestrel Stoop: her head at y ' + (hover == null ? '?' : hover.toFixed(0)) + ' of ' + (await page.evaluate(() => innerHeight)));
  await page.evaluate(() => { const B = window.__battle; for (const f of B.engine.foes) B.weaken(1, f.key); B.auto = 'expert'; B.turbo = 4; });
  for (let k = 0; k < 6 && await page.evaluate(() => window.__battle.menuOpen); k++) { await page.keyboard.press('Enter'); await sleep(300); }
  await wf(() => window.__battle.state === 'over' && !document.getElementById('end').hidden, null, 900000);
  const end2 = await page.evaluate(() => ({ title: document.getElementById('endTitle').textContent, outcome: window.__battle.result.outcome, trace: window.__battle.trace.map((x) => x[0]).join(' ') }));
  await snap('finale-end-card');
  say(end2.outcome === 'win' && /sending/.test(end2.trace) && /home/.test(end2.trace), 'the finale’s ending played (' + end2.trace + '); the end card: “' + end2.title + '”');
  await page.click('#again');
  await talkThrough(() => { const h = document.querySelector('.ending h2'); return !!h && /The End/.test(h.textContent); }, 240000);
  await sleep(800); await snap('the-end');
  const fin = await page.evaluate(() => ({ h: document.querySelector('.ending h2').textContent, button: [...document.querySelectorAll('.ending button')].map((b) => b.textContent).join(', '), done: !!window.__game.state.done.finale }));
  say(fin.done && /Back to the title/.test(fin.button), 'the game’s ending screens: “' + fin.h + '”, its button “' + fin.button + '” (the finale done: ' + fin.done + ')');
} catch (e) { bad++; log('FAIL: ' + e.message); await snap('failed'); }
if (errs.length) { bad++; log('FAIL: page errors: ' + errs.slice(0, 6).join(' | ')); }
await browser.close();
console.log(bad ? 'FAIL: ' + bad + ' misses' : 'all good');
process.exit(bad ? 1 : 0);
