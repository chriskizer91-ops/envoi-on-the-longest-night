// Screenshots tools/lineup/lineup.html in headless Chromium (SwiftShader). Usage: node render.mjs <view> [<view> ...]
import { createRequire } from 'module';
import { execSync } from 'child_process';
import fs from 'fs';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const dir = new URL('.', import.meta.url).pathname;
const outDir = process.env.OUT || dir + 'out/';
fs.mkdirSync(outDir, { recursive: true });
const browser = await pw.chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 720 } });
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await page.goto('file://' + dir + 'lineup.html', { waitUntil: 'load', timeout: 180000 });
await page.waitForFunction(() => window.__report, null, { timeout: 180000 });
console.log(JSON.stringify(await page.evaluate(() => window.__report), null, 1));
for (const v of process.argv.slice(2)) {
  const calls = await page.evaluate((v) => window.view(v), v);
  await page.screenshot({ path: outDir + v.replace(':', '-') + '.png' });
  console.log('view', v, 'draw calls', calls);
}
console.log('page errors:', errs.slice(0, 10));
await browser.close();
