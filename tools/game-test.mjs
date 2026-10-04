// game-test.mjs: plays the built game headless (Chromium + SwiftShader, as tools/check.mjs does) and reports any error.
// Build the page first: node tools/build.mjs --min putting-it-all-together/game.html
// Usage: node tools/game-test.mjs [dist/game.html] [--steps title,new,walk,controls,world,menu,saves,save,wild,colossus,chapters]
//        [--band 4]
//        [--level 18] [--out <dir>] [--size 960x540] [--turbo 8] [--offline]
//   title:    the title screen comes up
//   new:      a new game starts, the prologue plays, and Io stands in her cottage
//   walk:     Io walks up Wickhollow's south road with the arrow keys
//   world:    Io walks the world map
//   menu:     the menu opens on every tab and closes
//   saves:    the game is saved in slot 2, its save code copied, and loaded back from the title's Load
//   scenes:   the staged scenes play on their maps (Sol at the bridge, Quill at the jetty, the knight, Ysmera)
//   save:     the save is written, and the title offers Continue
//   wild:     a wild fight in the band (--band, at --level) is played to its end by the expert play style
//   colossus: the Bramble Colossus is fought the same way (band 4); headless, a whole fight takes a long while
//   keepsakes: Io walks by a tap up Chris's secret way over Wickhollow's roof to her keepsake, and down the Thornwood's
//             dark trail to Sol's; each is found once, named in the Party tab, and counts in a fight
//   songs:    Chris's songs play where they belong (the towns', the wilds'), each from where it was; the fights play
//             their own theme, and the made-up music plays everywhere else; Music Off quietens them (run after title or new)
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
let steps = ['title', 'new', 'walk', 'world', 'menu', 'saves', 'save'], band = 1, level = 3, turbo = 8, offline = false;
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
      await page.evaluate(() => { window.__game.goField('wickhollow', [780, 940]); });
      await waitFor(() => window.__game.field.map.id === 'wickhollow' && !window.__game.busy, null, 30000, 'the square');
      const p0 = await page.evaluate(() => [window.__game.field.P.x, window.__game.field.P.y]);
      await page.keyboard.down('ArrowUp'); await sleep(1200); await page.keyboard.up('ArrowUp'); // up the south road
      const p1 = await page.evaluate(() => [window.__game.field.P.x, window.__game.field.P.y]);
      if (Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) < 20) throw new Error('Io did not walk: ' + p0 + ' to ' + p1);
      await shot('walk');
    } else if (step === 'controls') {
      // the three ways to move her by pointer: hold on the map to steer toward it, a quick tap to walk there, and one
      // thumb on the pad (here a mouse), held toward the top
      await page.evaluate(() => { window.__game.goField('wickhollow', [780, 940]); });
      await waitFor(() => window.__game.field.map.id === 'wickhollow' && !window.__game.busy, null, 30000, 'the square');
      await sleep(400);
      const at = () => page.evaluate(() => [window.__game.field.P.x, window.__game.field.P.y]);
      const box = await page.$eval('.field-cv', (c) => { const r = c.getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; });
      let p0 = await at();
      await page.mouse.move(box[0] + box[2] / 2, box[1] + box[3] * 0.12); await page.mouse.down(); await sleep(1300); await page.mouse.up();
      let p1 = await at();
      if (p0[1] - p1[1] < 20) throw new Error('holding the map did not steer her north: ' + p0 + ' to ' + p1);
      log('  held on the map: ' + Math.round(p0[1] - p1[1]) + ' px north');
      await sleep(300); p0 = await at();
      await page.mouse.click(box[0] + box[2] / 2, box[1] + box[3] * 0.8); await sleep(1500);
      p1 = await at();
      if (p1[1] - p0[1] < 15) throw new Error('a tap below her did not walk her there: ' + p0 + ' to ' + p1);
      log('  tapped below her: ' + Math.round(p1[1] - p0[1]) + ' px south');
      await sleep(300); p0 = await at();
      const pad = await page.$eval('.pad', (c) => { const r = c.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2, r.width]; });
      await page.mouse.move(pad[0], pad[1] - pad[2] * 0.4); await page.mouse.down(); await sleep(1000);
      const lit = await page.$$eval('.pad .lit', (b) => b.map((x) => x.className).join(' '));
      await page.mouse.move(pad[0] + pad[2] * 0.4, pad[1] - pad[2] * 0.4); await sleep(200);
      const lit2 = await page.$$eval('.pad .lit', (b) => b.map((x) => x.className).join(' '));
      await page.mouse.up(); p1 = await at();
      if (p0[1] - p1[1] < 15 || !/pad-n/.test(lit) || !(/pad-n/.test(lit2) && /pad-e/.test(lit2))) throw new Error('the pad: ' + p0 + ' to ' + p1 + ', lit ' + lit + ' then ' + lit2);
      log('  the pad: ' + Math.round(p0[1] - p1[1]) + ' px north, rolling to ' + lit2.replace(/pad-/g, ''));
      await shot('controls');
    } else if (step === 'world') {
      await page.evaluate(() => { window.__game.goWorld(1348, 1900); });
      await waitFor(() => window.__game.mode === 'world' && !window.__game.busy, null, 30000, 'the world map');
      await sleep(600);
      const w0 = await page.evaluate(() => [window.__game.world.P.x, window.__game.world.P.y]);
      await page.keyboard.down('ArrowRight'); await sleep(900); await page.keyboard.up('ArrowRight');
      const w1 = await page.evaluate(() => [window.__game.world.P.x, window.__game.world.P.y]);
      if (Math.hypot(w1[0] - w0[0], w1[1] - w0[1]) < 10) throw new Error('Io did not walk the world map: ' + w0 + ' to ' + w1);
      await shot('world');
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
    } else if (step === 'keepsakes') {
      const walk = async (x, y, what) => {
        const t1 = Date.now();
        await page.evaluate(([x, y]) => window.__game.field.walkTo(x, y), [x, y]);
        await waitFor(([x, y]) => { const P = window.__game.field.P; return Math.hypot(P.x - x, P.y - y) < 14; }, [x, y], 40000, what);
        log('  ' + what + ' by a tap, in ' + ((Date.now() - t1) / 1000).toFixed(1) + ' s');
      };
      const pick = async (id, what) => {
        const label = await page.evaluate(() => (window.__game.field.near() || {}).label);
        if (label !== 'Something glinting') throw new Error('nothing to pick up ' + what + ': ' + label);
        await page.keyboard.press('Enter');
        await talkThrough(30000, '!window.__game.busy && !!window.__game.state.keepsakes && !!window.__game.state.keepsakes.' + id);
        const after = await page.evaluate(() => (window.__game.field.near() || {}).label);
        if (after === 'Something glinting') throw new Error('the keepsake ' + what + ' is still there once found');
      };
      await page.evaluate(() => { const g = window.__game; g.state.flags.party = true; g.state.done.first = true; g.goField('wickhollow', [700, 440]); });
      await waitFor(() => window.__game.field.map.id === 'wickhollow' && !window.__game.busy, null, 30000, 'the square');
      await walk(458, 562, 'up the tree and along the roof');
      await shot('keepsake-roof');
      await pick('io', 'on the roof');
      await walk(700, 440, 'back down to the square');
      await page.evaluate(() => { window.__game.goField('thornwood', [800, 540]); });
      await waitFor(() => window.__game.field.map.id === 'thornwood' && !window.__game.busy, null, 30000, 'the Thornwood');
      await page.evaluate(() => window.__game.field.setCounter(-1e6)); // no wild fight on the way
      await walk(1284, 816, 'down the dark trail');
      await shot('keepsake-woods');
      await pick('sol', 'in the woods');
      await page.evaluate(() => { window.__game.menu(); });
      await waitFor(() => !!document.querySelector('.gmenu'), null, 10000, 'the menu');
      await page.click('.gmenu-tabs button:text-is("Party")'); await sleep(300);
      const party = await page.$eval('.gmenu-body', (b) => b.textContent);
      if (!party.includes('Carries the Crescent Locket') || !party.includes('Carries the Warden’s Brooch')) throw new Error('the Party tab does not name the keepsakes: ' + party);
      await shot('keepsake-party');
      await page.click('.gmenu-foot button:text-is("Close")');
      await waitFor(() => !document.querySelector('.gmenu'), null, 10000, 'the menu to close');
      // in a fight: Sol's max HP and her blows a tenth more, Io's Moonlore heals a quarter more
      await page.evaluate(() => { window.__game.battle('wild', { band: 1, scene: null }); });
      await waitFor(() => window.__battle && window.__battle.state && window.__battle.state !== 'boot' && window.__battle.state !== 'intro', null, 240000, 'the fight to begin');
      const hs = await page.evaluate(() => {
        const RL = window.BattleRules, E = window.__battle.engine, L = window.__game.state.level, sol = E.heroes.find((h) => h.id === 'sol'), io = E.heroes.find((h) => h.id === 'io');
        return { solHp: sol.maxHp, want: Math.round(RL.HEROES.sol.hp * RL.scale(L) * 1.1), dmg: sol.boostDmg, heal: io.boostHeal, state: window.GameState.maxHp(window.__game.state, 'sol') };
      });
      if (hs.solHp !== hs.want || hs.state !== hs.want || hs.dmg !== 1.1 || hs.heal !== 1.25) throw new Error('the keepsakes do not count in the fight: ' + JSON.stringify(hs));
      log('  in a fight: Sol ' + hs.solHp + ' HP, blows x' + hs.dmg + ', Io heals x' + hs.heal);
      await page.evaluate((tb) => { for (const f of window.__battle.engine.foes) window.__battle.weaken(5, f.key); window.__battle.auto = 'expert'; window.__battle.turbo = tb; }, turbo);
      await waitFor(() => window.__battle && window.__battle.state === 'over' && !document.getElementById('end').hidden, null, 900000, 'the fight to end');
      await page.click('#again');
      await waitFor(() => !document.querySelector('.battle-layer'), null, 60000, 'the battle to close');
      await talkThrough(30000);
    } else if (step === 'songs') {
      const songs = () => page.evaluate(() => window.__game.songs.state());
      const near = (a, b) => Math.abs(a - b) < 0.02;
      async function hear(want, what) {
        await sleep(2500);
        const s = await songs(), m = await page.evaluate(() => window.__game.music);
        if (m !== want) throw new Error(what + ': playing ' + m + ', not ' + want + ' ' + JSON.stringify(s));
        if (s.playing && (s.songs[s.playing].paused || !(s.songs[s.playing].at > 0.5))) throw new Error(what + ': the song is not playing ' + JSON.stringify(s));
        log('  ' + what + ': ' + want + (s.playing ? ' at ' + s.songs[s.playing].at.toFixed(1) + ' s, level ' + s.songs[s.playing].level.toFixed(2) : ' (made-up)'));
        return s;
      }
      await page.evaluate(() => { const g = window.__game; g.audioInit(); g.state.flags.party = true; g.goField('wickhollow', [780, 940]); });
      await waitFor(() => window.__game.field.map.id === 'wickhollow' && !window.__game.busy, null, 30000, 'the square');
      let s = await hear('town', 'Wickhollow');
      if (!near(s.songs.town.level, 0.37)) throw new Error('the town song is not at its level: ' + s.songs.town.level);
      const townAt = s.songs.town.at;
      await page.evaluate(() => { window.__game.goField('thornwood', [60, 456]); });
      await waitFor(() => window.__game.field.map.id === 'thornwood' && !window.__game.busy, null, 30000, 'the Thornwood');
      s = await hear('wilds', 'the Thornwood');
      if (!s.songs.town.paused || s.songs.town.at < townAt) throw new Error('the town song did not stop where it was ' + JSON.stringify(s));
      const wildAt = s.songs.wilds.at;
      await page.evaluate(() => { window.__game.battle('wild', { band: 1, scene: null }); });
      await waitFor(() => window.__battle && window.__battle.state && window.__battle.state !== 'boot' && window.__battle.state !== 'intro', null, 240000, 'the fight to begin');
      await sleep(2500); s = await songs();
      const theme = await page.evaluate(() => window.__game.battleTheme);
      if (s.playing || !s.songs.wilds.paused || !theme) throw new Error('a fight should play its own theme, and no song: ' + JSON.stringify(s) + ', theme ' + theme);
      log('  a fight: the battle theme, no song');
      await page.evaluate((tb) => { for (const f of window.__battle.engine.foes) window.__battle.weaken(5, f.key); window.__battle.auto = 'expert'; window.__battle.turbo = tb; }, turbo);
      await waitFor(() => window.__battle && window.__battle.state === 'over' && !document.getElementById('end').hidden, null, 900000, 'the fight to end');
      await page.click('#again');
      await waitFor(() => !document.querySelector('.battle-layer'), null, 60000, 'the battle to close');
      await talkThrough(30000);
      s = await hear('wilds', 'back in the Thornwood');
      if (s.songs.wilds.at < wildAt) throw new Error('the wilds song started again instead of going on: ' + s.songs.wilds.at + ' < ' + wildAt);
      await page.evaluate(() => { window.__game.goField('cottage', [838, 520]); });
      await waitFor(() => window.__game.field.map.id === 'cottage' && !window.__game.busy, null, 30000, 'the cottage');
      s = await hear('title', 'the cottage');
      if (!s.songs.wilds.paused) throw new Error('the wilds song still plays in the cottage');
      // Music Off and back on, from the menu's settings
      await page.evaluate(() => { window.__game.goField('wickhollow', [780, 940]); });
      await waitFor(() => window.__game.field.map.id === 'wickhollow' && !window.__game.busy, null, 30000, 'the square');
      await hear('town', 'Wickhollow again');
      await page.evaluate(() => { window.__game.menu(); });
      await waitFor(() => !!document.querySelector('.gmenu'), null, 10000, 'the menu');
      await page.click('.gmenu-tabs button:text-is("Settings")');
      const musicRow = page.locator('.gm-item', { has: page.locator('span:text-is("Music")') });
      await musicRow.locator('button:text-is("Off")').click(); await sleep(1500);
      s = await songs();
      if (!s.songs.town.paused) throw new Error('Music Off left the song playing ' + JSON.stringify(s));
      await musicRow.locator('button:text-is("Loud")').click(); await sleep(1500);
      s = await songs();
      if (s.songs.town.paused || !near(s.songs.town.level, 0.37 / 0.75)) throw new Error('Music Loud did not bring the song back louder ' + JSON.stringify(s));
      log('  Music off, then loud: level ' + s.songs.town.level.toFixed(2));
      const surround = await page.$$eval('.gm-item span', (x) => x.map((e) => e.textContent).filter((t) => t === 'Surroundings').length);
      if (!surround) throw new Error('no Surroundings volume in the settings');
      await musicRow.locator('button:text-is("Normal")').click();
      await page.click('.gmenu-foot button:text-is("Close")');
      await waitFor(() => !document.querySelector('.gmenu'), null, 10000, 'the menu to close');
    } else if (step === 'chapters') {
      // each gate's chapter from the title: Io in the town before the gate (the crossroads' own south road; Misthollow
      // for the finale), the party at the gate's level, saved, after the town's arrival scene; and the little arrow
      // pointing her on
      const want = [null, ['bogmire', 5], ['dawnroost', 10], ['crossroads', 15], ['misthollow', 20]];
      for (let k = 1; k < want.length; k++) {
        await page.evaluate(() => { try { localStorage.clear(); } catch (e) { /* none */ } });
        await page.reload();
        await waitFor(() => !!document.querySelector('.title h1'), null, 30000, 'the title');
        await page.click('.title-box button:text-is("Chapters")');
        await waitFor(() => document.querySelectorAll('.talk-choices button').length > 0, null, 10000, 'the chapters');
        await page.click('.talk-choices button:nth-child(' + (k + 1) + ')');
        await waitFor((m) => window.__game && window.__game.mode === 'field' && window.__game.field.map && window.__game.field.map.id === m, want[k][0], 30000, 'chapter ' + k);
        await talkThrough(30000, () => !window.__game.busy);
        const st = await page.evaluate(() => ({ level: window.__game.state.level, band: window.__game.state.band, flags: Object.keys(window.__game.state.flags).join(' '), saved: !!localStorage.getItem('envoi.save.v1'), goal: window.__game.goal }));
        if (st.level !== want[k][1] || !st.saved || !st.goal) throw new Error('chapter ' + k + ': ' + JSON.stringify(st));
        log('  ' + want[k][0] + ': level ' + st.level + ', band ' + st.band + ', flags ' + st.flags + '; the arrow: ' + st.goal.kind + ' at ' + Math.round(st.goal.x) + ', ' + Math.round(st.goal.y));
        await sleep(500); await shot('chapter-' + k);
      }
    } else if (step === 'saves') {
      // the Saves tab: save in slot 2, copy the save code, then load it back from the title, to the map it was saved on
      const savedMode = await page.evaluate(() => window.__game.mode);
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
      await waitFor((m) => window.__game.mode === m && !window.__game.busy, savedMode, 30000, 'the loaded game');
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
