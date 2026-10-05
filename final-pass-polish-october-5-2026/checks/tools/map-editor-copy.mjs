// map-editor-copy.mjs: where the map editor can't reach its store (opened outside claude.ai), it offers no "Download my
// work" (a viewer on claude.ai never downloads, though the page said "Downloaded your work... Give the file to Claude"),
// says to use "Copy my work" instead, and Copy gives his work as text that check-edits.mjs and apply-edits.mjs read
// (T17, tools 2).
// Builds the map editor (dist/map-editor.html), opens it headless with no store, moves one walk point on Wickhollow,
// presses Copy my work (the clipboard caught by the test) and checks what it gave.
// Usage, from the repository's top folder (it opens a browser):
//   flock /tmp/claude-0/browser.lock node final-pass-polish-october-5-2026/checks/tools/map-editor-copy.mjs [built page]
// (a page already built, such as a copy of an older build, instead of building dist/map-editor.html)
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createRequire } from 'module';
import { execSync, spawnSync } from 'child_process';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const R = process.cwd();
let built = process.argv[2] ? path.resolve(process.argv[2]) : null;
if (!built) { execSync('node tools/build.mjs envoi-final-draft/map-editor/map-editor.html', { cwd: R, stdio: 'ignore' }); built = path.join(R, 'dist/map-editor.html'); }
let failed = 0;
const check = (ok, what) => { console.log((ok ? '  ok: ' : '  FAILED: ') + what); if (!ok) failed++; };
const browser = await pw.chromium.launch();
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'map-editor-copy-'));
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 820 } });
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('file://' + built);
  await page.waitForFunction(() => window.MapEditor && MapEditor.dbState === 'none' && MapEditor.painted, null, { timeout: 30000 });
  const shown = (id) => page.evaluate((id) => { const e = document.getElementById(id); return !!e && !e.hidden && e.offsetParent !== null; }, id);
  // the panel's words, buttons left out, as they show
  const words = await page.evaluate(() => {
    const sec = document.getElementById('mp-copy').closest('.mp-sec'), out = [], tw = document.createTreeWalker(sec, NodeFilter.SHOW_TEXT);
    for (let n; (n = tw.nextNode());) { const p = n.parentElement; if (!p.closest('button, a, textarea') && p.getClientRects().length) out.push(n.textContent); }
    return out.join(' ').replace(/\s+/g, ' ').trim();
  });
  const visible = await page.evaluate(() => document.getElementById('mp-copy').closest('.mp-sec').innerText);
  check(!/Download/i.test(visible) && !(await shown('mp-download')), 'no Download my work in the Send to Claude panel');
  check(/Copy my work/.test(words), 'the panel says to use Copy my work: “' + words + '”');
  check(await shown('mp-copy') && !(await page.evaluate(() => document.getElementById('mp-copy').disabled)), 'Copy my work is there to press');
  // one change (Wickhollow's first walk point, moved as the page's own test moves it), then Copy, the clipboard caught
  // as a paste to Claude would get it
  await page.evaluate(() => { window.__copied = null; navigator.clipboard.writeText = (t) => { window.__copied = t; return Promise.resolve(); }; });
  const toScreen = (q) => page.evaluate(([x, y]) => { const v = MapEditor.view, r = document.getElementById('mp-cv').getBoundingClientRect(); return [r.left + (x - v.x) * v.z, r.top + (y - v.y) * v.z]; }, q);
  const p0 = await page.evaluate(() => MapEdits.traced(MAPS, 'wickhollow').walk[0][0]);
  let a = await toScreen(p0); await page.mouse.move(a[0], a[1]);
  for (let i = 0; i < 3; i++) { await page.mouse.wheel(0, -300); await page.waitForTimeout(60); }
  await page.waitForTimeout(150);
  a = await toScreen(p0); const b = await toScreen([p0[0] - 12, p0[1] - 10]);
  await page.mouse.move(a[0], a[1]); await page.mouse.down();
  for (let i = 1; i <= 10; i++) { await page.mouse.move(a[0] + (b[0] - a[0]) * i / 10, a[1] + (b[1] - a[1]) * i / 10); await page.waitForTimeout(16); }
  await page.mouse.up(); await page.waitForTimeout(300);
  check(JSON.stringify(await page.evaluate(() => MapEditor.works.wickhollow && MapEditor.works.wickhollow.walk[0][0])) === JSON.stringify([p0[0] - 12, p0[1] - 10]), 'a walk point moved on Wickhollow');
  await page.click('#mp-copy'); await page.waitForTimeout(300);
  const status = await page.evaluate(() => document.getElementById('mp-status').textContent), text = await page.evaluate(() => window.__copied);
  check(/^Copied your work/.test(status), 'Copy says: “' + status + '”');
  let work = null; try { work = JSON.parse(text); } catch (e) { /* checked below */ }
  check(!!work && work.version === 2 && work.maps && work.maps.wickhollow && Array.isArray(work.keepsakes), 'it copied his work: ' + (work ? Object.keys(work.maps || {}).join(', ') + ' and ' + (work.keepsakes || []).length + ' keepsakes' : String(text).slice(0, 60)));
  if (work) {
    const f = path.join(tmp, 'work.json'); fs.writeFileSync(f, text);
    const chk = spawnSync(process.execPath, ['envoi-game-pass-3/map-paths/check-edits.mjs', f], { cwd: R, encoding: 'utf8' });
    check(chk.status === 0, 'check-edits.mjs finds it safe to apply');
    // apply-edits.mjs in a scratch copy of the files it reads, never the game's maps.js
    for (const g of ['envoi-game-pass-3/map-paths/apply-edits.mjs', 'envoi-game-pass-3/map-paths/edits-core.js', 'src/game/maps.js', 'envoi-final-draft/items/items.js']) {
      fs.mkdirSync(path.dirname(path.join(tmp, 'r', g)), { recursive: true }); fs.copyFileSync(path.join(R, g), path.join(tmp, 'r', g));
    }
    const ap = spawnSync(process.execPath, [path.join(tmp, 'r/envoi-game-pass-3/map-paths/apply-edits.mjs'), f], { encoding: 'utf8' });
    check(ap.status === 0 && /applied wickhollow walk/.test(ap.stdout), 'apply-edits.mjs writes it: ' + ap.stdout.trim().split('\n').filter((l) => /applied|✗/.test(l)).join('; '));
  }
  check(!errs.length, 'no page errors' + (errs.length ? ': ' + errs.join('; ') : ''));
} finally { await browser.close(); fs.rmSync(tmp, { recursive: true, force: true }); }
console.log(failed ? '✗ ' + failed + ' failed' : '✓ outside claude.ai the map editor offers Copy my work, not a download');
process.exitCode = failed ? 1 : 0;
