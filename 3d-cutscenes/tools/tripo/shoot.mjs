// shoot.mjs: headless pictures of a model through view.html. Model paths are from this folder (tools/tripo), and a
// meshopt-compressed model needs --meshopt. Shot options: y (height looked at), dist, yaw (degrees, toward her left),
// up, fov, mode ('flat' colours only, 'clay' shape only), anime (no normal map, no metal), box [x0, x1, y0, y1] (orthographic).
// Usage, from 3d-cutscenes: node tools/tripo/shoot.mjs ../../.cache/io-tripo-free.glb /tmp/shots 500x500 'face:{"y":0.845,"dist":0.36}'
import { serve, browser } from './serve.mjs';
const args = process.argv.slice(2), mo = args.includes('--meshopt'), [model, out, size, ...shots] = args.filter((a) => a !== '--meshopt');
const [w, h] = size.split('x').map(Number), srv = await serve(), b = await browser();
const page = await b.newPage({ viewport: { width: w, height: h } });
const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
const fs = await import('fs'); fs.mkdirSync(out, { recursive: true });
await page.goto(srv.url + '/tools/tripo/view.html?f=' + encodeURIComponent(model) + (mo ? '&mo=1' : ''));
await page.waitForFunction(() => window.__ready || window.__err, null, { timeout: 300000 });
const err = await page.evaluate(() => window.__err); if (err) console.log(err);
for (const s of shots) { const k = s.indexOf(':'), name = s.slice(0, k), o = JSON.parse(s.slice(k + 1)); await page.evaluate((x) => window.shot(x), o); await page.screenshot({ path: `${out}/${name}.png` }); console.log('shot', name); }
console.log(errs.length ? errs.join('\n') : 'no errors'); await b.close(); srv.close();
