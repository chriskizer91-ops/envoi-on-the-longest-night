// townshots.mjs: the town page headless at a phone's size: each town with its people, then a talk.
// Usage: node townshots.mjs page.html outdir [WxH]
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const [pg, out, size] = process.argv.slice(2);
const [W, H] = (size || '915x412').split('x').map(Number);
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await b.newContext({ viewport: { width: W, height: H } })).newPage();
const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await page.goto('file://' + pg, { waitUntil: 'load', timeout: 180000 });
await page.waitForFunction(() => window.__walker && window.__walker.loaded && window.__onfoot && window.__town.field, null, { timeout: 180000 });
const ALL = [['wickhollow', [705, 640], 'nettie'], ['jetty', [1100, 440], 'quill'], ['bogmire', [700, 420], 'pell'], ['dawnroost', [880, 540], 'tamsin'], ['shipyard', [880, 470], 'tock'], ['misthollow', [700, 860], 'watch']];
let n = 0; const snap = async (name) => { await page.screenshot({ path: out + '/' + String(n++).padStart(2, '0') + '-' + name + '.jpg', type: 'jpeg', quality: 85 }); };
const TOWNS = process.env.TOWNS ? ALL.filter((t) => process.env.TOWNS.split(',').includes(t[0])) : ALL;
for (const [id, at, who] of TOWNS) {
  await page.evaluate(([id, at]) => window.__onfoot.go(id, at, 's'), [id, at]);
  await page.waitForTimeout(6000);
  await snap(id);
}
// a talk in Wickhollow
await page.evaluate(() => window.__onfoot.go('wickhollow', [620, 470], 'n'));
await page.waitForTimeout(5000);
await page.evaluate(() => { const p = window.MAPS.wickhollow.people.find((x) => x.id === 'nettie'); p.face = 's'; window.__town.converse(p); });
await page.waitForTimeout(2500); await snap('talk-nettie');
const info = await page.evaluate(() => ({ folk: Object.keys(window.MOON_FOLK_CAST).map((id) => [id, !!window.__town.FOLK.npc(id)]).filter((x) => x[1]).map((x) => x[0]) }));
console.log(JSON.stringify(info)); console.log(errs.length ? errs.slice(0, 8).join('\n') : 'no errors');
await b.close();
