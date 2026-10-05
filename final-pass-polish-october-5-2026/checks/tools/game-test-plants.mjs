// game-test-plants.mjs: the game test now fails on what it used to let pass (T17, tools 3, 4 and 7). Each fault is
// planted in a copy of the built game (a script at the end of the page), and tools/game-test.mjs must fail on it, naming
// the fault:
//   arena:   the band 1 wilds' arena taken out of the page, so its fight falls back to the flat painting while the arenas
//            are on (steps title,new,wild);
//   scene:   Sol's scene at the bridge emptied, so it never plays (title,new,scenes);
//   save:    every save made from the menu dropped (title,new,save);
//   sound:   the places' sounds played at the Effects' volume, as before Surroundings had its own (title,new,menu);
//   offline: the file Chris keeps asking for a picture beside it ('../art/...'), in dist/ beside the repository's art/
//            (--offline, title).
// With --old, the game test as it was before this pass (tools/game-test.mjs at 74f4631, copied into tools/ for the run)
// is run on the same plants instead, and must pass them all: the faults it let through.
// It builds what it needs: the file Chris keeps (--min --offline), then the game with --min, which stays in dist/.
// Every browser run goes through the shared lock, one at a time (flock /tmp/claude-0/browser.lock).
// Usage, from the repository's top folder:
//   node final-pass-polish-october-5-2026/checks/tools/game-test-plants.mjs [--old] [--only arena,scene,save,sound,offline]
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execSync, spawnSync } from 'child_process';
const R = process.cwd(), args = process.argv.slice(2), OLD = args.includes('--old');
const only = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',') : null;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'game-test-plants-'));
const tool = OLD ? path.join(R, 'tools/.game-test-before.mjs') : path.join(R, 'tools/game-test.mjs');
if (OLD) fs.writeFileSync(tool, execSync('git show 74f4631:tools/game-test.mjs', { cwd: R }));
const PLANTS = {
  arena: { steps: 'title,new,wild', js: "delete window.ARENAS['river-glade'];", fails: /fell back to its flat painting/ },
  scene: { steps: 'title,new,scenes', js: 'window.SCRIPT.scenes.sol = [];', fails: /the scene sol said nothing/ },
  save: { steps: 'title,new,save', js: "(function () { const GS = window.GameState, save = GS.save; GS.save = function () { return document.querySelector('.gmenu') ? true : save.apply(this, arguments); }; })();", fails: /“Save over it” didn’t put this game in slot/ },
  sound: { steps: 'title,new,menu', js: '(function () { const A = window.ThareiaAudio, play = A.playSfx; A.playSfx = function (snd, t, g) { return play.call(this, snd, t, g); }; })();', fails: /with Effects at Off, the cottage’s own sounds never came/ },
  offline: { steps: 'title', js: "new Image().src = '../art/keepsakes/crescent-locket.png';", fails: /reached outside the file for file:\/\/.*\/art\/keepsakes\/crescent-locket\.png/, offline: true },
};
const plant = (src, js, to) => { const h = fs.readFileSync(src, 'utf8'), at = h.lastIndexOf('</body>'); fs.writeFileSync(to, h.slice(0, at) + '<script>/* a planted fault */ ' + js + '</script>\n' + h.slice(at)); };
let failed = 0, n = 0;
const check = (ok, what) => { console.log((ok ? '  ok: ' : '  FAILED: ') + what); if (!ok) failed++; };
const keep = path.join(R, 'dist/plant-offline.html');
try {
  // the file Chris keeps, planted in dist/ (beside dist/, '../art/' is the repository's), then the game with --min
  if (!only || only.includes('offline')) {
    execSync('node tools/build.mjs --min --offline putting-it-all-together/game.html', { cwd: R, stdio: 'ignore' });
    plant(path.join(R, 'dist/game.html'), PLANTS.offline.js, keep);
  }
  execSync('node tools/build.mjs --min putting-it-all-together/game.html', { cwd: R, stdio: 'ignore' });
  for (const [name, p] of Object.entries(PLANTS)) {
    if (only && !only.includes(name)) continue;
    const page = p.offline ? keep : path.join(tmp, 'plant-' + name + '.html');
    if (!p.offline) plant(path.join(R, 'dist/game.html'), p.js, page);
    console.log(name + ': ' + (OLD ? 'the game test from before this pass' : 'the game test') + ', steps ' + p.steps + (p.offline ? ', --offline' : ''));
    const t0 = Date.now();
    const r = spawnSync('flock', ['/tmp/claude-0/browser.lock', process.execPath, tool, page, '--steps', p.steps, '--size', '915x412', '--out', path.join(tmp, 'out-' + n++), ...(p.offline ? ['--offline'] : [])], { cwd: R, encoding: 'utf8', timeout: 40 * 60 * 1000 });
    const out = (r.stdout || '') + (r.stderr || ''), last = out.trim().split('\n').filter((l) => /FAILED|game test (passed|failed)|reached/.test(l)).slice(-3).join(' / ');
    console.log('      ' + last + ' (' + Math.round((Date.now() - t0) / 1000) + ' s, exit ' + r.status + ')');
    if (OLD) check(r.status === 0, 'it passes the planted fault');
    else check(r.status === 1 && p.fails.test(out), 'it fails, naming the fault');
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true }); fs.rmSync(keep, { force: true });
  if (OLD) fs.rmSync(tool, { force: true });
}
console.log(failed ? '✗ ' + failed + ' failed' : OLD ? '✓ the game test from before this pass let every planted fault through' : '✓ the game test fails on every planted fault');
process.exitCode = failed ? 1 : 0;
