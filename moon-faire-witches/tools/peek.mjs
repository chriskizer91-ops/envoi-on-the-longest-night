// peek.mjs: a still of a built page after running a bit of script in it (?test). Usage: node peek.mjs page.html out.jpg "js" [WxH] [query]
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const [pg, out, js, size, q] = process.argv.slice(2);
const [W, H] = (size || '915x412').split('x').map(Number);
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await b.newContext({ viewport: { width: W, height: H } })).newPage();
const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
await page.goto('file://' + pg + '?test' + (q ? '&' + q : ''), { waitUntil: 'load', timeout: 180000 });
await page.waitForFunction(() => (window.__sb && window.__sb.K.ready()) || (window.__fight && window.__fight.ready && window.__fight.ready()), null, { timeout: 180000 });
const r = await page.evaluate(js);
if (r !== undefined) console.log(JSON.stringify(r));
await page.screenshot({ path: out, type: 'jpeg', quality: 85 });
console.log(errs.length ? errs.slice(0, 10).join('\n') : 'no errors');
await b.close();
