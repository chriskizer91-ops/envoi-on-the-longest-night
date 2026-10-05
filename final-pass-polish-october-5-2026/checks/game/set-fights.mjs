// set-fights.mjs (T17 game 3 and 4): the story's flags for the first fight and Halcyon's ambush are saved before the
// scene that follows each, so closing the game during that scene doesn't bring the fight back on Continue; and an
// ambush whose battle couldn't run isn't counted as fought (nor Kestrel Stoop learned): the party wakes at its rest, as
// after the other set fights. The battle itself is stood in for (BattleScreen.start ends at once, won, lost or failed),
// since only what the game does around it is checked. Each case loads a save placed inside the fight's event.
// Build first: node tools/build.mjs --min putting-it-all-together/game.html
// Usage, from the repository's top folder (it opens a browser):
//   flock /tmp/claude-0/browser.lock node final-pass-polish-october-5-2026/checks/game/set-fights.mjs [dist/game.html]
import fs from 'fs'; import path from 'path'; import { createRequire } from 'module'; import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const R = path.resolve(new URL('../../..', import.meta.url).pathname);
const file = path.resolve(process.argv[2] || path.join(R, 'dist/game.html'));
const THREE_JS = fs.readFileSync(path.join(R, 'tools/.cache/three.min.js'));
const browser = await pw.chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 915, height: 412 } });
const errs = [];
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 4).join(' / ')));
await page.route('**/*', (route) => {
  const u = route.request().url();
  if (u.includes('three.min.js')) return route.fulfill({ status: 200, contentType: 'application/javascript', body: THREE_JS });
  if (u.startsWith('file:') || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
  return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// tap the dialogue on until `until` holds
async function tapUntil(until, ms, arg) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await page.evaluate(until, arg)) return;
    const b = await page.evaluate(() => { const t = document.querySelector('.talk'); return t && !t.hidden ? (t.querySelectorAll('.talk-choices button').length ? 'choice' : 'words') : null; });
    if (b === 'choice') await page.click('.talk-choices button'); else if (b === 'words') await page.click('.talk-words');
    await sleep(150);
  }
  throw new Error('timed out');
}
// a save inside the fight's event (made in the page, from the game's own state), then Continue, the battle stood in for
async function from(make, outcome) {
  await page.goto('file://' + file);
  await page.waitForFunction(() => !!document.querySelector('.title h1') && !!window.__game, null, { timeout: 30000 });
  await page.evaluate(make);
  await page.reload();
  await page.waitForFunction(() => !!document.querySelector('.title-box button') && !!window.BattleScreen, null, { timeout: 30000 });
  await page.evaluate((o) => {
    window.BattleScreen.start = (cfg) => {
      const t = setTimeout(() => {
        window.__stubDone = true;
        if (o === 'error') cfg.game.onError();
        else cfg.game.onEnd({ outcome: o, heroes: window.__game.state.flags.party ? [{ id: 'io', hp: 0, mp: 0 }, { id: 'sol', hp: 0 }] : [{ id: 'io', hp: 9, mp: 2 }], xp: 0, shards: 0, herbs: {} });
      }, 300);
      return { stop() { clearTimeout(t); } };
    };
  }, outcome);
  await page.click('.title-box button:text-is("Continue")');
}
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('envoi.save.v1')));
const said = (words) => { const t = document.querySelector('.talk-said'); return !!window.__stubDone && !!t && t.textContent.includes(words); };
let bad = 0;
const ok = (good, line) => { if (!good) bad++; console.log((good ? '✓ ' : '✗ ') + line); };
try {
  // the first fight, won: Sol's scene follows (Io starts near, not on, the spot that scene walks her to: field.js's
  // walk to the very point she stands on can go wrong, which is not what this checks)
  await from(() => { const s = GameState.fresh(); s.where = { mode: 'field', map: 'wickhollow', at: [770, 640], dir: 'n' }; GameState.save(s, 1); }, 'win');
  await tapUntil(said, 60000, 'Someone comes running');
  let sv = await saved();
  ok(sv.done.first && sv.flags.party, 'the first fight, won: during Sol’s scene the save has the fight done (' + !!sv.done.first + ') and Sol in the party (' + !!sv.flags.party + ')');
  // Halcyon's ambush, lost (whichever way it ends, the story goes on): the Kestrel scene follows
  const atAmbush = () => { const s = window.__game.chapterState(window.__game.CHAPTERS[3]); s.where = { mode: 'field', map: 'crossroads', at: [640, 470], dir: 'e' }; GameState.save(s, 1); };
  await from(atAmbush, 'lose');
  await tapUntil(said, 60000, 'It was her');
  sv = await saved();
  ok(sv.done.halcyon && sv.flags.stoop && sv.hp.io == null && sv.hp.sol == null, 'Halcyon’s ambush: during the Kestrel scene the save has it fought (' + !!sv.done.halcyon + '), Kestrel Stoop learned (' + !!sv.flags.stoop + ') and the party rested (HP ' + JSON.stringify(sv.hp) + ')');
  // Halcyon's ambush, its battle failing: not fought, and the party wakes at its rest
  await from(atAmbush, 'error');
  await tapUntil(() => !!window.__stubDone && window.__game.mode === 'field' && !window.__game.busy, 60000);
  const g = await page.evaluate(() => ({ done: !!window.__game.state.done.halcyon, stoop: !!window.__game.state.flags.stoop, map: window.__game.field.map.id }));
  ok(!g.done && !g.stoop && g.map === 'northern-camp', 'Halcyon’s ambush, its battle failing: fought ' + g.done + ', Kestrel Stoop ' + g.stoop + ', the party on ' + g.map);
} catch (e) { bad++; console.log('✗ ' + e.message); }
await browser.close();
if (errs.length) { bad++; console.log('✗ page errors: ' + errs.join(' | ')); }
if (bad) { console.log(bad + ' wrong'); process.exit(1); }
console.log('all good');
