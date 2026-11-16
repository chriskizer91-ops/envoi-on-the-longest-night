// walkshots.mjs: the walking page, headless at a phone's size: stills of Io standing, walking each way, kneeling.
// Usage: node walkshots.mjs page.html outdir [WxH]
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const [pg, out, size] = process.argv.slice(2);
const [W, H] = (size || '915x412').split('x').map(Number);
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await b.newContext({ viewport: { width: W, height: H }, hasTouch: false })).newPage();
const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await page.goto('file://' + pg, { waitUntil: 'load', timeout: 180000 });
await page.waitForFunction(() => window.__walker && window.__walker.loaded && window.__onfoot, null, { timeout: 180000 });
await page.waitForTimeout(2500);
let n = 0; const snap = async (name) => { await page.screenshot({ path: out + '/' + String(n++).padStart(2, '0') + '-' + name + '.jpg', type: 'jpeg', quality: 85 }); };
await snap('stand');
for (const [k, ms] of [['ArrowRight', 1400], ['ArrowDown', 1100], ['ArrowLeft', 1400], ['ArrowUp', 1200]]) {
  await page.keyboard.down(k); await page.waitForTimeout(ms * 0.6); await snap('walk-' + k); await page.waitForTimeout(ms * 0.4); await page.keyboard.up(k); await page.waitForTimeout(300);
}
await page.evaluate(() => window.__onfoot.field.pose('kneel', 3)); await page.waitForTimeout(1500); await snap('kneel');
const info = await page.evaluate(() => ({ P: window.__onfoot.P && { x: window.__onfoot.P.x, y: window.__onfoot.P.y, dir: window.__onfoot.P.dir }, cv: [window.__walker.canvas.width, window.__walker.canvas.height] }));
console.log(JSON.stringify(info)); console.log(errs.length ? errs.slice(0, 8).join('\n') : 'no errors');
await b.close();
