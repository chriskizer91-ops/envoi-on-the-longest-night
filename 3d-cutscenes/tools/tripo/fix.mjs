// fix.mjs: runs fix.html headless on a picture-to-3D model: presses the hair lying across the face back into it, smooths
// the face, and paints the picture's face, neck and skin onto it. Writes <outBase>.jpg (the new colour texture) and
// <outBase>.pos.bin / .nor.bin / .idx.bin (the new positions, normals and triangles), for glb.py.
// Usage, from 3d-cutscenes: node tools/tripo/fix.mjs tools/tripo/fix.json /tmp/io-fixed
import fs from 'fs';
import { serve, browser } from './serve.mjs';
const [cfgPath, outBase] = process.argv.slice(2); const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const srv = await serve(), b = await browser(), page = await b.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await page.goto(srv.url + '/tools/tripo/fix.html'); await page.waitForFunction(() => window.__ready);
const t0 = Date.now(); const r = await page.evaluate((c) => window.fix(c), cfg);
if (r.log.diag) { fs.writeFileSync(outBase + '-diag.png', Buffer.from(r.log.diag.split(',')[1], 'base64')); delete r.log.diag; }
if (r.tex) { fs.writeFileSync(outBase + '.jpg', Buffer.from(r.tex.split(',')[1], 'base64')); for (const k of ['pos', 'nor', 'idx']) fs.writeFileSync(`${outBase}.${k}.bin`, Buffer.from(r[k], 'base64')); }
console.log(JSON.stringify(r.log), 'in', ((Date.now() - t0) / 1000).toFixed(1), 's'); console.log(errs.length ? errs.join('\n') : 'no errors');
await b.close(); srv.close();
