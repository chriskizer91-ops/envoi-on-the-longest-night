// build-guards.mjs: tools/build.mjs stops a page that would break or not publish (T17, tools 3 and 8).
//   3. Art left outside the page: a path in single quotes (the build puts only double-quoted ones inside) or one naming
//      a file that isn't there stays a path, which the page would look for beside itself. The build must fail and name it.
//   8. Sizes: the copy to publish (<name>.artifact.html) is printed in bytes and fails over 16,000,000 (a published
//      page's limit); with --offline, the file Chris keeps fails over 30,000,000 (his 30 MB), and its copy to publish,
//      never published, isn't held to 16,000,000 (the real one is 16.4 MB).
// Each case is a small planted page built by the real build.mjs into dist/ (and removed after); then the game itself
// must still build with --min.
// Usage, from the repository's top folder: node final-pass-polish-october-5-2026/checks/tools/build-guards.mjs
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
const R = process.cwd(), tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'build-guards-'));
let failed = 0;
const check = (ok, what) => { console.log((ok ? '  ok: ' : '  FAILED: ') + what); if (!ok) failed++; };
// a page of one script, built as build.mjs builds any page
function plant(name, js, flags) {
  fs.writeFileSync(path.join(tmp, name + '.js'), js);
  fs.writeFileSync(path.join(tmp, name + '.html'), '<!doctype html>\n<html><head><meta charset="utf-8"><title>' + name + '</title></head><body>\n<script src="./' + name + '.js"></script>\n</body></html>\n');
  const r = spawnSync(process.execPath, ['tools/build.mjs', ...flags, path.join(tmp, name + '.html')], { cwd: R, encoding: 'utf8' });
  for (const f of [name + '.html', name + '.artifact.html', name + '.beside.json']) fs.rmSync(path.join(R, 'dist', f), { force: true });
  const said = (r.stdout + r.stderr).trim(); console.log(said.replace(/^/gm, '      '));
  return { status: r.status, said };
}
const big = (n) => 'window.BIG = "' + 'x'.repeat(n) + '";\n';
try {
  console.log('art in single quotes, and art that isn’t there');
  let r = plant('guard-art', "const a = 'art/keepsakes/crescent-locket.png', b = \"art/nowhere/missing.webp\";\n", []);
  check(r.status === 1, 'the build fails (exit ' + r.status + ')');
  check(/art\/keepsakes\/crescent-locket\.png/.test(r.said) && /art\/nowhere\/missing\.webp/.test(r.said), 'and names both paths');
  console.log('an example path in a comment (src/game/stills.js has one), which the page never reads');
  r = plant('guard-comment', '// for example:  sol: "art/stills/still-sol.webp",\n/* or \'art/nowhere/x.png\' */\nwindow.OK = 1;\n', []);
  check(r.status === 0, 'builds (exit ' + r.status + ')');
  console.log('a page whose copy to publish is over 16,000,000 bytes');
  r = plant('guard-big', big(16000100), []);
  check(r.status === 1, 'the build fails (exit ' + r.status + ')');
  check(/guard-big\.artifact\.html: 16,000,\d{3} bytes/.test(r.said), 'and prints the copy to publish in bytes');
  console.log('a page just under it');
  r = plant('guard-fits', big(15999000), []);
  check(r.status === 0 && /guard-fits\.artifact\.html: 15,999,\d{3} bytes/.test(r.said), 'builds (exit ' + r.status + '), its copy to publish printed in bytes');
  console.log('the file to keep (--offline) at 17 MB, its copy to publish over 16,000,000');
  r = plant('guard-keep', big(17000000), ['--offline']);
  check(r.status === 0, 'builds: an --offline copy to publish is never published (exit ' + r.status + ')');
  console.log('the file to keep (--offline) over 30,000,000 bytes');
  r = plant('guard-huge', big(30000100), ['--offline']);
  check(r.status === 1 && /30,000,000/.test(r.said), 'the build fails, naming the 30,000,000 (exit ' + r.status + ')');
  console.log('the game');
  const g = spawnSync(process.execPath, ['tools/build.mjs', '--min', 'putting-it-all-together/game.html'], { cwd: R, encoding: 'utf8' });
  console.log((g.stdout + g.stderr).trim().replace(/^/gm, '      '));
  check(g.status === 0 && /game\.artifact\.html: \d{2},\d{3},\d{3} bytes/.test(g.stdout), 'builds with --min, its copy to publish printed in bytes');
} finally { fs.rmSync(tmp, { recursive: true, force: true }); }
console.log(failed ? '✗ ' + failed + ' failed' : '✓ the build stops art left outside the page and pages too big');
process.exitCode = failed ? 1 : 0;
