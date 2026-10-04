// serve.mjs: a small file server over the 3d-cutscenes folder, for the headless tools in this folder.
import http from 'http';
import fs from 'fs';
import path from 'path';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary' };
export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
export function serve() {
  return new Promise((ok) => {
    const s = http.createServer((q, r) => {
      const p = path.join(ROOT, decodeURIComponent(new URL(q.url, 'http://x').pathname));
      if (!p.startsWith(ROOT)) { r.writeHead(403); return r.end(); }
      fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); r.end(d); });
    });
    s.listen(0, '127.0.0.1', () => ok({ url: 'http://127.0.0.1:' + s.address().port, close: () => s.close() }));
  });
}
export async function browser() {
  const { createRequire } = await import('module'); const { execSync } = await import('child_process');
  const require = createRequire(import.meta.url);
  let pw; try { pw = require('playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
  return pw.chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--js-flags=--max-old-space-size=6144'] });
}
