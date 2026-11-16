// shoot.mjs: plays a built page headless at a phone's size and takes stills at chosen moments. The page must run with
// ?test (its clock then moves only when told) and offer window.__sb (the spell book) or window.__fight.
// Usage: node moon-faire-witches/tools/shoot.mjs <page.html> <out dir> [--size 915x412] [--plan plan.json]
//   plan: [{ "do": "cast", "id": "crescent", "book": "mf", "shots": [1.0, 2.4, 3.0] }, { "do": "look", "look": "envoi" }, ...]
//   shots are seconds after the spell starts; each still is <out>/<n>-<id>-<sec>.jpg. A still of the resting stage comes first.
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const args = process.argv.slice(2);
const page_ = path.resolve(args[0]), out = path.resolve(args[1]);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const [W, H] = opt('--size', '915x412').split('x').map(Number);
const plan = JSON.parse(fs.readFileSync(opt('--plan', ''), 'utf8'));
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
const t0 = Date.now();
await page.goto('file://' + page_ + '?test', { waitUntil: 'load', timeout: 180000 });
await page.waitForFunction(() => window.__sb && window.__sb.K.ready(), null, { timeout: 180000 });
console.log('loaded in', ((Date.now() - t0) / 1000).toFixed(1), 's');
await page.evaluate(() => window.__sb.K.step(1.5));
let n = 0;
const snap = async (name) => { const f = path.join(out, String(n++).padStart(2, '0') + '-' + name + '.jpg'); await page.screenshot({ path: f, type: 'jpeg', quality: 82 }); return f; };
await snap('rest');
for (const p of plan) {
  if (p.do === 'look') { await page.evaluate((l) => { if (window.__sb.K.look !== l) document.getElementById('look').click(); }, p.look); await page.evaluate(() => window.__sb.K.step(0.2)); await snap('look-' + p.look); continue; }
  if (p.do === 'book') { await page.evaluate((b) => window.__sb.setBook(b), p.book); await snap('book-' + p.book); continue; }
  // a move of Io's on its own, seen close: { "do": "move", "anim": "e_raise", "yaw": 1.2, "zoom": 3, "shots": [...] }
  if (p.do === 'move') {
    await page.evaluate((q) => { const S = window.__sb, K = S.K; S.io.tyaw = S.io.yaw = q.yaw != null ? q.yaw : S.io.home.yaw; document.getElementById('panel').style.visibility = 'hidden'; K.shotAt(S.io.pos, q.zoom || 3, 50, 1.0); S.io.m.play(q.anim, true); }, p);
    let at = 0;
    for (const s of p.shots || []) { await page.evaluate((d) => window.__sb.K.step(d), Math.max(1 / 30, s - at)); at = s; await snap(p.anim + '-' + s.toFixed(1)); }
    await page.evaluate(async () => { const S = window.__sb; S.io.m.reset(); document.getElementById('panel').style.visibility = ''; await S.K.step(0.3); });
    continue;
  }
  if (p.do === 'cast') {
    const tc = Date.now();
    if (p.book) await page.evaluate((b) => window.__sb.setBook(b), p.book);
    await page.evaluate((id) => { window.__sb.cast(id); }, p.id);
    let at = 0;
    // shots count from the moment her move starts, unless the plan says from the tap ("from": "cast")
    if (p.from !== 'cast') { let g = 0; while (!(await page.evaluate(() => window.__sb.io.m.busy)) && g++ < 100) await page.evaluate(() => window.__sb.K.step(1 / 30)); }
    for (const s of p.shots || []) { await page.evaluate((d) => window.__sb.K.step(d), Math.max(1 / 30, s - at)); at = s; await snap(p.id + '-' + s.toFixed(1)); }
    // let it finish
    let guard = 0; while (await page.evaluate(() => window.__sb.busy) && guard++ < 120) await page.evaluate(() => window.__sb.K.step(0.5));
    console.log(p.id, 'played in', ((Date.now() - tc) / 1000).toFixed(1), 's', guard >= 120 ? '(did not finish)' : '');
  }
}
const info = await page.evaluate(() => ({ tris: window.__sb.K.renderer.info.render.triangles, calls: window.__sb.K.renderer.info.render.calls, ioTris: window.__sb.io.m.triangles, look: window.__sb.K.look }));
console.log('last frame:', JSON.stringify(info));
console.log(errors.length ? 'ERRORS:\n' + errors.slice(0, 20).join('\n') : 'no errors');
await browser.close();
