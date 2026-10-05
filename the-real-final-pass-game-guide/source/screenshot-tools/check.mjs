import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pw = require('/opt/node22/lib/node_modules/playwright');
const S = process.env.S, W = +(process.argv[2] || 1280), tag = process.argv[3] || 'd';
const ids = (process.argv[4] || 'top,contents,new,walk1,bosses,keepsakes').split(',');
const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: 900 }, deviceScaleFactor: 1 });
const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await page.goto('file://' + S + '/../envoi-real-final-pass-guide.html', { waitUntil: 'load' });
await page.waitForTimeout(1500);
const ov = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, h: document.documentElement.scrollHeight }));
console.log(tag, JSON.stringify(ov), errs.join(' | '));
for (const id of ids) {
  const el = await page.$('#' + id);
  if (!el) { console.log('no', id); continue; }
  await el.scrollIntoViewIfNeeded();
  await page.evaluate(() => document.querySelectorAll('img[loading=lazy]').forEach(i => i.loading = 'eager'));
  await page.waitForTimeout(400);
  const bb = await el.boundingBox();
  await page.screenshot({ path: S + '/check/' + tag + '-' + id + '.png', clip: { x: 0, y: bb.y + (await page.evaluate(() => window.scrollY)), width: W, height: Math.min(bb.height, 2600) }, fullPage: true });
}
await browser.close();
