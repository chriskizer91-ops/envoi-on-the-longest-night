// game-test.mjs: plays the built game headless (Chromium + SwiftShader, as tools/check.mjs does) and reports any error.
// Build the page first: node tools/build.mjs --min putting-it-all-together/game.html
// Usage: node tools/game-test.mjs [dist/game.html] [--steps title,new,walk,menu,saves,save,wild,colossus] [--band 4]
//        [--level 18] [--out <dir>] [--size 960x540] [--turbo 8] [--offline]
//   title:    the title screen comes up
//   new:      a new game starts, the prologue plays, and Io stands in her cottage
//   walk:     Io walks the Wickhollow square with the arrow keys
//   menu:     the menu opens on every tab and closes
//   saves:    the game is saved in slot 2, its save code copied, and loaded back from the title's Load
//   scenes:   the staged scenes play on their maps (Sol at the bridge, Quill at the jetty, the knight, Ysmera)
//   save:     the save is written, and the title offers Continue
//   wild:     a wild fight in the band (--band, at --level) is played to its end by the expert play style
//   colossus: the Bramble Colossus is fought the same way (band 4); headless, a whole fight takes a long while
// Each step saves a screenshot in --out (tools/.cache/game-test by default). Exits 1 on any page error.
// three.js r128 comes from npm into tools/.cache, since the CDN is unreachable from the sandbox; the fonts are skipped.
// --offline tests the file Chris keeps (node tools/build.mjs --min --offline putting-it-all-together/game.html):
// nothing is served, any reach for the web fails the test, and its fonts must be inside it.
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const R = path.resolve(new URL('..', import.meta.url).pathname);
const cache = path.join(R, 'tools/.cache/three.min.js');
fs.mkdirSync(path.dirname(cache), { recursive: true });
if (!fs.existsSync(cache)) execSync('npm pack three@0.128.0 --silent && tar xzf three-0.128.0.tgz package/build/three.min.js && mv package/build/three.min.js . && rm -rf package three-0.128.0.tgz', { cwd: path.dirname(cache) });
const THREE_JS = fs.readFileSync(cache);

const args = process.argv.slice(2);
let file = path.join(R, 'dist/game.html'), out = path.join(R, 'tools/.cache/game-test'), size = [960, 540];
let steps = ['title', 'new', 'walk', 'menu', 'saves', 'save'], band = 1, level = 3, turbo = 8, offline = false;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--steps') steps = args[++i].split(',');
  else if (args[i] === '--band') band = +args[++i];
  else if (args[i] === '--level') level = +args[++i];
  else if (args[i] === '--out') out = path.resolve(args[++i]);
  else if (args[i] === '--size') size = args[++i].split('x').map(Number);
  else if (args[i] === '--turbo') turbo = +args[++i];
  else if (args[i] === '--offline') offline = true;
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
  if (offline) {
    if (u.startsWith('file:') || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
    errs.push('reached for the web: ' + u.slice(0, 120));
    return route.abort();
  }
  if (u.includes('three.min.js')) return route.fulfill({ status: 200, contentType: 'application/javascript', body: THREE_JS });
  if (u.startsWith('file:') || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
  return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
});
const t0 = Date.now();
const log = (s) => console.log(((Date.now() - t0) / 1000).toFixed(1).padStart(6) + 's  ' + s);
const shot = async (name) => { await page.screenshot({ path: path.join(out, name + '.png') }); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(fn, arg, ms, what) {
  try { await page.waitForFunction(fn, arg, { timeout: ms, polling: 250 }); }
  catch (e) { await shot('timeout-' + what.replace(/\W+/g, '-')); throw new Error('timed out waiting for ' + what); }
}
// tap through the dialogue box until it closes (or until `until` is true)
async function talkThrough(ms, until) {
  const end = Date.now() + (ms || 60000);
  while (Date.now() < end) {
    const st = await page.evaluate(() => { const b = document.querySelector('.talk'); return { open: !!b && !b.hidden, choices: b ? b.querySelectorAll('.talk-choices button').length : 0 }; });
    if (until && await page.evaluate(until)) return;
    if (!st.open) { if (!until) return; await sleep(250); continue; }
    if (st.choices) await page.click('.talk-choices button');
    else await page.click('.talk-words');
    await sleep(120);
  }
  throw new Error('the dialogue never closed');
}

let failed = false;
try {
  await page.goto('file://' + file);
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) { /* none */ } });
  await page.reload();
  for (const step of steps) {
    log('step ' + step);
    if (step === 'title') {
      await waitFor(() => !!document.querySelector('.title h1'), null, 30000, 'the title');
      if (offline) {
        // the four faces the page uses, loaded from inside the file
        const faces = await page.evaluate(async () => {
          const want = ['16px "IM Fell English"', 'italic 16px "IM Fell English"', '16px "Atkinson Hyperlegible"', 'bold 16px "Atkinson Hyperlegible"'];
          const got = await Promise.all(want.map((f) => document.fonts.load(f)));
          return want.map((f, i) => f + ': ' + (!got[i].length ? 'missing' : got[i].every((x) => x.status === 'loaded') ? 'loaded' : 'not loaded'));
        });
        const bad = faces.filter((f) => !/: loaded$/.test(f));
        if (bad.length) throw new Error('fonts not inside the file: ' + bad.join('; '));
        log('  fonts inside the file: ' + faces.length);
      }
      await shot('title');
    } else if (step === 'new') {
      await page.click('.title-box button');
      await talkThrough(90000, () => window.__game && window.__game.mode === 'field' && !window.__game.busy);
      await waitFor(() => window.__game.field.map && window.__game.field.map.id === 'cottage', null, 30000, 'the cottage');
      await sleep(600); await shot('cottage');
    } else if (step === 'walk') {
      await page.evaluate(() => { window.__game.goField('wickhollow', [768, 900]); });
      await waitFor(() => window.__game.field.map.id === 'wickhollow' && !window.__game.busy, null, 30000, 'the square');
      const p0 = await page.evaluate(() => [window.__game.field.P.x, window.__game.field.P.y]);
      await page.keyboard.down('ArrowLeft'); await sleep(1200); await page.keyboard.up('ArrowLeft');
      const p1 = await page.evaluate(() => [window.__game.field.P.x, window.__game.field.P.y]);
      if (Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) < 20) throw new Error('Io did not walk: ' + p0 + ' to ' + p1);
      await shot('walk');
    } else if (step === 'menu') {
      await page.evaluate(() => { window.__game.menu(); });
      await waitFor(() => !!document.querySelector('.gmenu'), null, 10000, 'the menu');
      for (const tab of await page.$$eval('.gmenu-tabs button', (b) => b.map((x) => x.textContent))) {
        await page.click('.gmenu-tabs button:text-is("' + tab + '")'); await sleep(200); await shot('menu-' + tab.toLowerCase());
      }
      await page.click('.gmenu-foot button:text-is("Close")');
      await waitFor(() => !document.querySelector('.gmenu'), null, 10000, 'the menu to close');
    } else if (step === 'wild' || step === 'colossus') {
      await page.evaluate(([L, b]) => { const st = window.__game.state; st.level = L; st.flags = Object.assign(st.flags, { party: true, refit: L > 5, envoi: L > 10, stoop: L > 15 }); st.band = Math.max(st.band, b); }, [level, band]);
      const kind = step === 'colossus' ? 'colossus' : 'wild';
      const opts = step === 'colossus' ? { band: 4, pack: ['colossus'] } : { band, scene: null };
      await page.evaluate(([k, o]) => { window.__game.battle(k === 'colossus' ? 'wild' : k, o); }, [kind, opts]);
      await waitFor(() => !!window.__battle, null, 60000, 'the battle screen');
      await page.evaluate((tb) => { window.__battle.auto = 'expert'; window.__battle.turbo = tb; }, turbo);
      await waitFor(() => window.__battle && window.__battle.state && window.__battle.state !== 'boot' && window.__battle.state !== 'intro', null, 240000, 'the fight to begin');
      await shot(step + '-fight');
      await waitFor(() => window.__battle && window.__battle.state === 'over' && !document.getElementById('end').hidden, null, 1500000, 'the fight to end');
      const res = await page.evaluate(() => ({ outcome: window.__battle.result.outcome, title: document.getElementById('endTitle').textContent }));
      log('  ' + res.title + ' (' + res.outcome + ')');
      await shot(step + '-end');
      await page.click('#again');
      await waitFor(() => !document.querySelector('.battle-layer'), null, 60000, 'the battle to close');
      const r = await page.evaluate(() => ({ fights: window.__game.state.fights, wins: window.__game.state.wins, level: window.__game.state.level }));
      log('  after the fight: ' + JSON.stringify(r));
      await talkThrough(30000);
      await shot(step + '-after');
    } else if (step === 'saves') {
      // the Saves tab: save in slot 2, copy the save code, then load it back from the title
      await page.evaluate(() => { window.__game.menu(); });
      await waitFor(() => !!document.querySelector('.gmenu'), null, 10000, 'the menu');
      await page.click('.gmenu-tabs button:text-is("Saves")');
      await page.click('.gmenu-body .gm-item:nth-child(3) button');
      await waitFor(() => localStorage.getItem('envoi.slot') === '2', null, 10000, 'slot 2 to be in use');
      await page.click('.gmenu-body button:text-is("Copy")');
      await waitFor(() => !!document.querySelector('textarea.code'), null, 10000, 'the save code');
      const code = await page.$eval('textarea.code', (t) => t.value);
      if (!/^ENVOI1:/.test(code)) throw new Error('no save code: ' + code.slice(0, 40));
      log('  save code: ' + code.length + ' letters');
      await shot('saves-code');
      await page.click('.gmenu-foot button:text-is("Done")');
      await page.click('.gmenu-foot button:text-is("Title")');
      await waitFor(() => !!document.querySelector('.title h1'), null, 10000, 'the title');
      await page.click('.title-box button:text-is("Load")');
      await page.click('.talk-choices button:text-is("Paste a save code")');
      await page.fill('textarea.code', code);
      await page.click('.gmenu-foot button:text-is("Load it")');
      await waitFor(() => window.__game.mode === 'field' && !window.__game.busy, null, 30000, 'the loaded game');
      await shot('saves-loaded');
    } else if (step === 'scenes') {
      // the staged scenes: each one's people walk in on its map; a screenshot as they arrive, and at the scene's end
      // as the story stands when each scene plays: the first fight won, Sol with Io, and so on
      await page.evaluate(() => { const st = window.__game.state; st.done.first = true; Object.assign(st.flags, { party: true }); st.done.halcyon = true; });
      const SC = [['sol', 'wickhollow', [780, 702]], ['magpie', 'jetty', [1100, 392]], ['ambush', 'crossroads', [768, 592]], ['shipyard', 'shipyard', [760, 985]]];
      for (const [id, map, at] of SC) {
        await page.evaluate(([m, a]) => { window.__game.goField(m, a); }, [map, at]);
        // a first visit can play its own scene on arrival (the shipyard's): tap through it
        await sleep(600); await talkThrough(90000, () => window.__game.mode === 'field' && !window.__game.busy);
        await waitFor((m) => window.__game.field.map && window.__game.field.map.id === m && !window.__game.busy, map, 30000, 'the map ' + map);
        await page.evaluate((x) => { window.__game.scene(x); }, id);
        // let the first walk play, then tap through, taking a picture at the first line said with everyone in place
        await sleep(1500);
        let shotN = 0;
        const end = Date.now() + 120000;
        while (Date.now() < end) {
          const st = await page.evaluate(() => ({ busy: window.__game.busy, open: !!document.querySelector('.talk') && !document.querySelector('.talk').hidden, actors: ['sol', 'quill', 'halcyon', 'ysmera'].filter((k) => window.__game.field.stage.actor(k)).length }));
          if (!st.busy) break;
          if (st.open) {
            if (shotN < 2) { await sleep(400); await shot('scene-' + id + '-' + shotN++); }
            await page.click('.talk-words'); await sleep(250); await page.click('.talk-words').catch(() => {});
          }
          await sleep(500);
        }
        await shot('scene-' + id + '-end');
        log('  scene ' + id + ' played');
      }
    } else if (step === 'save') {
      await page.evaluate(() => { window.__game.menu(); });
      await waitFor(() => !!document.querySelector('.gmenu'), null, 10000, 'the menu');
      await page.click('.gmenu-foot button:text-is("Title")');
      await waitFor(() => !!document.querySelector('.title h1'), null, 10000, 'the title again');
      const cont = await page.$$eval('.title-box button', (b) => b.map((x) => x.textContent));
      if (!cont.includes('Continue')) throw new Error('no Continue on the title: ' + cont.join(', '));
      await shot('save');
    } else throw new Error('no step ' + step);
  }
} catch (e) { failed = true; console.log('FAILED: ' + e.message); }
await browser.close();
for (const e of errs) console.log(e);
if (errs.length) failed = true;
console.log(failed ? 'game test failed' : 'game test passed: ' + steps.join(', ') + ' in ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s');
process.exit(failed ? 1 : 0);
