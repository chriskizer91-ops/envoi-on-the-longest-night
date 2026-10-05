// try-test.mjs: plays the page of polish to try (dist/try.html, from tools/make-try.mjs) headless, as tools/game-test.mjs
// plays the game, and checks that each of its three ideas (handoff/tasks.md, I06, I08, I12) does what it says, with no
// page errors:
//   words: a new game's prologue goes by with no tap, each line moving on a pause after it has all appeared, the pause
//          growing with the line's length and following the words' speed (Slow longer, Fast shorter); a tap still moves
//          a line on at once; a question's choices wait; Settings has "Words move on" just after "Words", saved with the
//          other settings, and "On a tap" makes a line wait for a tap again
//   door:  Io walks out of her cottage to Wickhollow and back: the game's sound 'door' plays once each way, on the
//          effects' volume; the cottage's road out, shut before Sol has joined, plays none
//   buy10: in Nettie's shop, Buy 10 buys ten moonpetals and takes their shards, then only the five lavenders the bag has
//          room for (it holds 99), then only the three mugworts the shards cover, each with the buy's sound, and saved
// --off checks the game itself has the three off (node tools/try-test.mjs dist/game.html --off): its lines wait for a
// tap, Settings has no "Words move on" and saves no reading setting, no door sounds, and its shops have no Buy 10.
// Build first: node tools/build.mjs --min putting-it-all-together/game.html && node tools/make-try.mjs
// Usage: node tools/try-test.mjs [dist/try.html] [--off] [--size 915x412] [--out <dir>]
// Screenshots go in --out (tools/.cache/try-test by default). Exits 1 on a failed check or any page error. One browser
// test at a time (as game-test).
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const R = path.resolve(new URL('..', import.meta.url).pathname);
// three.js r128, which the page loads from the web: from tools' own npm copy, or fetched once into tools/.cache
const cache = path.join(R, 'tools/.cache/three.min.js'), local = path.join(R, 'tools/node_modules/three/build/three.min.js');
fs.mkdirSync(path.dirname(cache), { recursive: true });
if (!fs.existsSync(cache)) {
  if (fs.existsSync(local)) fs.copyFileSync(local, cache);
  else execSync('npm pack three@0.128.0 --silent && tar xzf three-0.128.0.tgz package/build/three.min.js && mv package/build/three.min.js . && rm -rf package three-0.128.0.tgz', { cwd: path.dirname(cache) });
}
const THREE_JS = fs.readFileSync(cache);

const args = process.argv.slice(2);
let file = path.join(R, 'dist/try.html'), out = path.join(R, 'tools/.cache/try-test'), size = [915, 412], off = false;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--off') off = true;
  else if (args[i] === '--size') size = args[++i].split('x').map(Number);
  else if (args[i] === '--out') out = path.resolve(args[++i]);
  else file = path.resolve(args[i]);
}
fs.mkdirSync(out, { recursive: true });

const browser = await pw.chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: size[0], height: size[1] } });
const errs = [];
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
await page.route('**/*', (route) => {
  const u = route.request().url();
  if (u.includes('three.min.js')) return route.fulfill({ status: 200, contentType: 'application/javascript', body: THREE_JS });
  if (u.startsWith('file:') || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
  return route.fulfill({ status: 200, contentType: 'text/css', body: '' }); // the fonts
});
const t0 = Date.now();
const log = (s) => console.log(((Date.now() - t0) / 1000).toFixed(1).padStart(6) + 's  ' + s);
const shot = async (name) => { await page.screenshot({ path: path.join(out, name + '.png') }); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(fn, arg, ms, what) {
  try { await page.waitForFunction(fn, arg, { timeout: ms, polling: 100 }); }
  catch (e) { await shot('timeout-' + what.replace(/\W+/g, '-')); throw new Error('timed out waiting for ' + what); }
}
const check = (ok, what) => { if (!ok) throw new Error(what); };
// the pause before a said line moves on by itself (src/game/talk.js): 1.2 s and 45 ms a letter at Normal words, over
// the square root of the words' speed (Slow 0.5, Fast 2; all at once as Normal)
const pauseFor = (text, speed) => (1200 + 45 * text.length) / (speed > 0 ? Math.sqrt(speed) : 1);
const near = (got, want) => got >= want - 60 && got <= want * 1.3 + 600; // never early; late only by a busy page
// with the switch off, tap through what's said until `until` holds (with it on, the test never taps: the words go by)
async function tapThrough(until, ms) {
  const end = Date.now() + (ms || 60000);
  while (Date.now() < end) {
    if (await page.evaluate(until)) return;
    const st = await page.evaluate(() => { const b = document.querySelector('.talk'); return { open: !!b && !b.hidden, choices: b ? b.querySelectorAll('.talk-choices button').length : 0 }; });
    if (st.open && st.choices) await page.click('.talk-choices button');
    else if (st.open) await page.click('.talk-words');
    await sleep(150);
  }
  throw new Error('what was said never ended');
}
const goOn = async (until, ms, what) => { if (off) await tapThrough(until, ms); await waitFor(until, null, ms || 60000, what); };
// a line said as the game says one, without waiting on it
const sayLine = (text) => page.evaluate((t) => { window.__done = null; const n = window.__lines.length; window.__game.talk.say([t]).then(() => { window.__done = performance.now(); }); return n; }, text);
const lineAfter = (n, text) => page.evaluate(([n, t]) => window.__lines.slice(n).find((x) => x.text === t) || null, [n, text]);
const doors = () => page.evaluate(() => window.__sfx.filter((s) => s.id === 'door'));
const savedSettings = () => page.evaluate(() => JSON.parse(localStorage.getItem('envoi.settings') || '{}'));
const rowInView = (label) => page.locator('.gm-item', { has: page.locator('span:text-is("' + label + '")') }).scrollIntoViewIfNeeded();
// the menu's Settings, a choice in one of its rows, then closed
async function setting(label, choice) {
  await page.evaluate(() => { window.__game.menu(); });
  await waitFor(() => !!document.querySelector('.gmenu'), null, 10000, 'the menu');
  await page.click('.gmenu-tabs button:text-is("Settings")');
  if (label) await page.locator('.gm-item', { has: page.locator('span:text-is("' + label + '")') }).locator('button:text-is("' + choice + '")').click();
  const labels = await page.$$eval('.gmenu-body .gm-item > span', (s) => s.map((x) => x.textContent));
  const pressed = await page.$$eval('.gmenu-body .gm-item', (rs) => Object.fromEntries(rs.map((r) => [r.querySelector('span').textContent, (r.querySelector('button[aria-pressed="true"]') || {}).textContent || null])));
  return { labels, pressed, close: async () => { await page.click('.gmenu-foot button:text-is("Close")'); await waitFor(() => !document.querySelector('.gmenu') && !window.__game.busy, null, 10000, 'the menu to close'); } };
}

let failed = false;
try {
  await page.goto('file://' + file);
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) { /* none */ } });
  await page.reload();
  log('step title');
  await waitFor(() => !!document.querySelector('.title h1') && !!window.__game, null, 30000, 'the title');
  const sw = await page.evaluate(() => ({ title: document.title, on: window.ENVOI_TRY || null }));
  if (off) check(!sw.on, 'the game has switches on: ' + JSON.stringify(sw.on));
  else check(sw.title === 'Envoi: Polish to Try' && sw.on && sw.on.words === true && sw.on.door === true && sw.on.buy10 === true, 'not the page of polish to try: ' + JSON.stringify(sw));
  log('  "' + sw.title + '", ' + (sw.on ? 'switches ' + JSON.stringify(sw.on) : 'no switches'));
  // the sounds the game plays through its effects (game.js sfx() calls ThareiaAudio.playSfx), and each line the
  // dialogue box shows: when it had all appeared (full) and when it went (end)
  await page.evaluate(() => {
    const A = window.ThareiaAudio, play = A.playSfx;
    window.__sfx = [];
    A.playSfx = function (s, t, gain, bus) { window.__sfx.push({ id: typeof s === 'string' ? s : s && s.id, gain: gain == null ? null : gain, bus: bus || 'effects' }); return play.apply(this, arguments); };
    window.__lines = []; let cur = null;
    setInterval(() => {
      const b = document.querySelector('.talk'), now = performance.now();
      const s = b && !b.hidden ? b.querySelector('.talk-said').textContent : null;
      if (cur && (s === null || s.length < cur.text.length || !s.startsWith(cur.text))) { cur.end = now; cur = null; }
      if (s !== null && !cur) window.__lines.push(cur = { text: s, full: now });
      else if (cur && s !== cur.text) { cur.text = s; cur.full = now; }
    }, 15);
  });

  // ---------- the words (I06) ----------
  log('step words');
  const prologue = await page.evaluate(() => window.SCRIPT.scenes.prologue.map((l) => (typeof l === 'string' ? l : l[1])));
  await page.click('.title-box button:text-is("New game")');
  const inCottage = () => window.__game.mode === 'field' && window.__game.field.map && window.__game.field.map.id === 'cottage' && !window.__game.busy;
  if (off) {
    // a line waits for a tap, however long it's been there
    await waitFor((t) => { const s = document.querySelector('.talk-said'); return !!s && s.textContent === t; }, prologue[0], 30000, 'the first line');
    await sleep(pauseFor(prologue[0], 1) + 2500);
    const still = await page.evaluate((t) => { const b = document.querySelector('.talk'); return !b.hidden && b.querySelector('.talk-said').textContent === t; }, prologue[0]);
    check(still, 'the first line moved on with no tap');
    log('  the first line waits for a tap');
  }
  await goOn(inCottage, 120000, 'the prologue to end, Io in her cottage');
  if (!off) {
    const lines = await page.evaluate(() => window.__lines);
    const got = prologue.map((t) => { const L = lines.find((x) => x.text === t); return L && L.end ? Math.round(L.end - L.full) : null; });
    prologue.forEach((t, i) => check(got[i] != null && near(got[i], pauseFor(t, 1)), 'prologue line ' + (i + 1) + ' (' + t.length + ' letters) moved on after ' + got[i] + ' ms, not about ' + Math.round(pauseFor(t, 1))));
    log('  the prologue went by with no tap: ' + prologue.map((t, i) => t.length + ' letters, ' + got[i] + ' ms (' + Math.round(pauseFor(t, 1)) + ')').join('; '));
  }
  await sleep(500); await shot('cottage');
  // a tap still moves a line on at once
  const long = 'The lamps by the bridge are flickering, and the bells in the square have gone quiet. Something is waiting up there tonight.';
  let n = await sayLine(long);
  await waitFor(([n, t]) => window.__lines.slice(n).some((x) => x.text === t), [n, long], 20000, 'the long line to appear');
  await sleep(400);
  const tc = await page.evaluate(() => performance.now());
  await page.click('.talk-words');
  await waitFor(() => window.__done != null, null, 5000, 'the tap to move the line on');
  const tapMs = Math.round(await page.evaluate((tc) => window.__done - tc, tc));
  check(tapMs < 1500, 'a tap took ' + tapMs + ' ms to move the line on');
  log('  a tap moved a line on in ' + tapMs + ' ms' + (off ? '' : ' (it would have waited ' + Math.round(pauseFor(long, 1)) + ')'));
  // a question's choices always wait
  await page.evaluate(() => { window.__asked = null; window.__game.talk.ask(null, 'Which way?', ['North', 'South']).then((i) => { window.__asked = i; }); });
  await sleep(pauseFor('Which way?', 1) + 2500);
  const asking = await page.evaluate(() => ({ open: !document.querySelector('.talk').hidden, choices: document.querySelectorAll('.talk-choices button').length, asked: window.__asked }));
  check(asking.open && asking.choices === 2 && asking.asked === null, 'the choices did not wait: ' + JSON.stringify(asking));
  await page.click('.talk-choices button:text-is("South")');
  await waitFor(() => window.__asked === 1, null, 5000, 'the choice');
  log('  a question waited for its choice');
  if (off) {
    const S = await setting(null);
    await rowInView('Words'); await shot('settings'); await S.close();
    check(!S.labels.includes('Words move on'), 'the game shows "Words move on"');
    const S2 = await setting('Words', 'Normal'); await S2.close();
    const kept = await savedSettings();
    check(!('auto' in kept), 'the game saved a reading setting: ' + JSON.stringify(kept));
    n = await sayLine('A line that waits for a tap.');
    await sleep(pauseFor('A line that waits for a tap.', 1) + 2500);
    check(await page.evaluate(() => window.__done == null && !document.querySelector('.talk').hidden), 'a line moved on with no tap');
    await page.click('.talk-words');
    await waitFor(() => window.__done != null, null, 5000, 'the tap');
    log('  Settings: ' + S.labels.join(', ') + '; nothing saved of a reading setting; a line waits for a tap');
  } else {
    // the pause follows the words' speed
    const short = 'A short line, said by itself.';
    const pauses = {};
    for (const [label, sp] of [['Slow', 0.5], ['Fast', 2], ['All at once', 0], ['Normal', 1]]) {
      const S = await setting('Words', label); await S.close();
      n = await sayLine(short);
      await waitFor(() => window.__done != null, null, 20000, 'the line to move on at ' + label);
      const L = await lineAfter(n, short);
      pauses[label] = L && L.end ? Math.round(L.end - L.full) : null;
      check(pauses[label] != null && near(pauses[label], pauseFor(short, sp)), 'at ' + label + ' words the line moved on after ' + pauses[label] + ' ms, not about ' + Math.round(pauseFor(short, sp)));
    }
    check(pauses.Slow > pauses.Normal && pauses.Normal > pauses.Fast, 'the pause does not follow the words: ' + JSON.stringify(pauses));
    log('  the same line\'s pause: ' + Object.entries(pauses).map(([k, v]) => k + ' ' + v + ' ms').join(', '));
    // the reading setting, just after the words' speed, starts on, and is saved with the others
    let S = await setting(null);
    await rowInView('Words move on'); await shot('settings');
    const w = S.labels.indexOf('Words');
    check(w >= 0 && S.labels[w + 1] === 'Words move on', 'no "Words move on" just after "Words": ' + S.labels.join(', '));
    check(S.pressed['Words move on'] === 'By themselves', 'the words do not start moving on by themselves: ' + S.pressed['Words move on']);
    await S.close();
    S = await setting('Words move on', 'On a tap'); await S.close();
    check((await savedSettings()).auto === false, 'On a tap was not saved: ' + JSON.stringify(await savedSettings()));
    const wait = 'A line that waits for a tap.';
    n = await sayLine(wait);
    await sleep(pauseFor(wait, 1) + 2500);
    check(await page.evaluate(() => window.__done == null && !document.querySelector('.talk').hidden), 'with On a tap, a line moved on by itself');
    await page.click('.talk-words');
    await waitFor(() => window.__done != null, null, 5000, 'the tap');
    S = await setting('Words move on', 'By themselves'); await S.close();
    check((await savedSettings()).auto === true, 'By themselves was not saved: ' + JSON.stringify(await savedSettings()));
    log('  Settings: "Words move on" after "Words", on at first; On a tap waits for a tap; both saved');
  }

  // ---------- the door (I08) ----------
  log('step door');
  await page.evaluate(() => { window.__sfx.length = 0; });
  const walk = (x, y) => page.evaluate(([x, y]) => window.__game.field.walkTo(x, y), [x, y]);
  // the cottage's road south, shut before Sol has joined: Io turns back with a line, and no door
  await walk(746, 1016);
  await waitFor(() => window.__lines.some((x) => /Something is wrong up in the square/.test(x.text)), null, 40000, 'Io to turn back on the road out');
  await goOn(() => !window.__game.busy && document.querySelector('.talk').hidden, 30000, 'her line to end');
  check(await page.evaluate(() => window.__game.field.map.id === 'cottage'), 'the shut road led out of the cottage');
  let d = await doors();
  check(d.length === 0, 'a door played on a shut road: ' + JSON.stringify(d));
  log('  the shut road out: Io turns back, no door');
  // out of the cottage by its north path, to Wickhollow, and back by the square's south road
  await walk(552, 8);
  await waitFor(() => window.__game.field.map && window.__game.field.map.id === 'wickhollow' && !window.__game.busy, null, 40000, 'Wickhollow');
  d = await doors();
  if (off) check(d.length === 0, 'the game played a door: ' + JSON.stringify(d));
  else check(d.length === 1 && d[0].bus === 'effects', 'into Wickhollow: ' + JSON.stringify(d));
  await sleep(400); await shot('wickhollow');
  await walk(780, 1018);
  await waitFor(() => window.__game.field.map && window.__game.field.map.id === 'cottage' && !window.__game.busy, null, 40000, 'the cottage again');
  d = await doors();
  if (off) check(d.length === 0, 'the game played a door: ' + JSON.stringify(d));
  else check(d.length === 2 && d.every((x) => x.bus === 'effects' && x.gain === null), 'back to the cottage: ' + JSON.stringify(d));
  log(off ? '  to Wickhollow and back: no door' : '  to Wickhollow and back: the door each way, on the effects\' volume');

  // ---------- Buy 10 (I12) ----------
  log('step buy10');
  // Nettie's shop, with the bag nearly full of lavender and shards for ten moonpetals, five lavenders and three mugworts
  // and not quite a fourth
  const pr = await page.evaluate(() => {
    const RL = window.BattleRules, K = window.Keepsakes, st = window.__game.state;
    const price = (id) => Math.round(RL.herbPrice(id, 1) * (1 - K.party(st).herbPrice / 100));
    const p = Object.fromEntries(Object.keys(RL.HERBS).map((id) => [id, price(id)]));
    st.done.first = true; // (her shop stands inside the square's first scene)
    st.herbs = Object.assign({}, st.herbs, { moonpetal: 3, lavender: 94, mugwort: 3 });
    st.shards = 10 * p.moonpetal + 5 * p.lavender + 4 * p.mugwort - 1;
    window.__game.goField('wickhollow', [568, 462]);
    return p;
  });
  await waitFor(() => window.__game.field.map.id === 'wickhollow' && !window.__game.busy, null, 30000, 'the square');
  const label = await page.evaluate(() => (window.__game.field.near() || {}).label);
  check(label === 'Talk to Nettie', 'not by Nettie: ' + label);
  await page.evaluate(() => { window.__sfx.length = 0; });
  await page.keyboard.press('Enter');
  await goOn(() => !!document.querySelector('.gmenu'), 60000, 'Nettie’s shop');
  const rows = () => page.$$eval('.gmenu-body .gm-item', (rs) => rs.map((r) => ({ name: r.querySelector('span').firstChild.textContent, price: r.querySelector('b').textContent, buttons: [...r.querySelectorAll('button')].map((b) => (b.disabled ? '(' + b.textContent + ')' : b.textContent)) })));
  const herbs = () => page.evaluate(() => ({ herbs: Object.assign({}, window.__game.state.herbs), shards: window.__game.state.shards, saved: (JSON.parse(localStorage.getItem('envoi.save.v1') || '{}').herbs || {}) }));
  const buys = () => page.evaluate(() => window.__sfx.filter((s) => s.id === 'ui-buy').length);
  let r = await rows();
  await shot('shop');
  check(r.length === 5 && r[0].price === String(pr.moonpetal) && r[1].price === String(pr.lavender) && r[2].price === String(pr.mugwort), 'the shop\'s prices: ' + JSON.stringify(r));
  const h0 = await herbs();
  if (off) {
    check(r.every((x) => x.buttons.length === 1 && !/^\(?Buy \d+\)?$/.test(x.buttons[0])), 'the game\'s shop has a Buy 10: ' + JSON.stringify(r));
    await page.locator('.gmenu-body .gm-item').nth(0).locator('button:text-is("Buy")').click();
    const h1 = await herbs();
    check(h1.herbs.moonpetal === 4 && h1.shards === h0.shards - pr.moonpetal && h1.saved.moonpetal === 4 && await buys() === 1, 'Buy: ' + JSON.stringify([h0, h1]));
    log('  no Buy 10; Buy buys one: ' + JSON.stringify(r.map((x) => x.name + ' ' + x.buttons.join(' '))));
  } else {
    check(r[0].buttons.join() === 'Buy,Buy 10' && r[1].buttons.join() === 'Buy,Buy 5' && r[2].buttons.join() === 'Buy,Buy 10', 'the shop\'s buttons: ' + JSON.stringify(r));
    // ten moonpetals
    await page.locator('.gmenu-body .gm-item').nth(0).locator('button:text-is("Buy 10")').click();
    const h1 = await herbs();
    check(h1.herbs.moonpetal === 13 && h1.shards === h0.shards - 10 * pr.moonpetal && h1.saved.moonpetal === 13 && await buys() === 1, 'Buy 10 moonpetals: ' + JSON.stringify([h0, h1]));
    log('  Buy 10: moonpetals 3 to 13, shards ' + h0.shards + ' to ' + h1.shards + ', saved, its sound once');
    // only the five lavenders the bag has room for
    r = await rows();
    check(r[1].buttons.join() === 'Buy,Buy 5', 'lavender: ' + JSON.stringify(r[1]));
    await page.locator('.gmenu-body .gm-item').nth(1).locator('button:text-is("Buy 5")').click();
    const h2 = await herbs();
    r = await rows();
    check(h2.herbs.lavender === 99 && h2.shards === h1.shards - 5 * pr.lavender && h2.saved.lavender === 99 && r[1].buttons.join() === '(Full),(Buy 10)', 'Buy 10 lavenders with room for 5: ' + JSON.stringify([h1, h2, r[1]]));
    log('  with room for five: lavender 94 to 99, then Full');
    // only the three mugworts the shards cover
    check(r[2].buttons.join() === 'Buy,Buy 3', 'mugwort: ' + JSON.stringify(r[2]));
    await page.locator('.gmenu-body .gm-item').nth(2).locator('button:text-is("Buy 3")').click();
    const h3 = await herbs();
    r = await rows();
    check(h3.herbs.mugwort === 6 && h3.shards === pr.mugwort - 1 && h3.saved.mugwort === 6 && r[2].buttons.join() === '(Buy),(Buy 10)' && await buys() === 3, 'Buy 10 mugworts with shards for 3: ' + JSON.stringify([h2, h3, r[2]]));
    log('  with shards for three: mugwort 3 to 6, ' + h3.shards + ' shards left, and none more');
    await shot('shop-after');
  }
  await page.click('.gmenu-foot button:text-is("Done")');
  await waitFor(() => !document.querySelector('.gmenu') && !window.__game.busy, null, 10000, 'the shop to close');
} catch (e) { failed = true; console.log('FAILED: ' + e.message); }
await browser.close();
for (const e of errs) console.log(e);
if (errs.length) failed = true;
console.log(failed ? 'try test failed' : 'try test passed: ' + (off ? 'the game has the three off (words wait for a tap, no door, no Buy 10)' : 'words, door, buy10') + ' in ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s');
process.exit(failed ? 1 : 0);
