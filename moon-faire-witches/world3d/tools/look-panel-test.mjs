// look-panel-test.mjs (the reskin job): opens the settings panel, switches the Flipbook look on, saves a picture.
// Usage: node look-panel-test.mjs dist/envoi-3d-wickhollow.html out.jpg [1280x720]
import path from 'path'; import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('/opt/npm-tools/node_modules/playwright');
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const [W, H] = (process.argv[4] || '1280x720').split('x').map(Number);
const page = await (await browser.newContext({ viewport: { width: W, height: H } })).newPage();
const errs = []; page.on('pageerror', (e) => errs.push(e.message));
await page.goto('file://' + path.resolve(process.argv[2]), { timeout: 240000 });
await page.waitForFunction(() => document.getElementById('lookbtn') && getComputedStyle(document.getElementById('load')).opacity === '0' || document.getElementById('load').style.display === 'none', null, { timeout: 240000 });
await page.waitForTimeout(6000);
await page.click('#lookbtn'); await page.click('#lookflip'); await page.waitForTimeout(2500);
await page.screenshot({ path: process.argv[3], type: 'jpeg', quality: 85 });
console.log('saved look:', await page.evaluate(() => localStorage.getItem('envoi3d-look')), errs.length ? errs : 'no page errors');
await browser.close();
