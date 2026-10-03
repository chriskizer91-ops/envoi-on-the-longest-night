// trace-overlay.mjs: draws a ground map's traced walk areas, blocks, exits, people and spots over its painting, to check the
// tracing by eye. Usage: node tools/trace-overlay.mjs <mapId> <out.png> [width]
// Walk areas are green, blocks red, exits blue, people gold, other spots white, event areas pink; labels name each.
import path from 'path'; import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const R = path.resolve(new URL('..', import.meta.url).pathname);
const sharp = require(path.join(R, 'tools/node_modules/sharp'));
require(path.join(R, 'src/game/maps.js'));
const [id, out, wA] = process.argv.slice(2);
const M = globalThis.MAPS[id]; if (!M) { console.error('no map ' + id); process.exit(1); }
const src = path.join(R, 'reference/art/walk', path.basename(M.src).replace('.webp', '.png'));
const W = 1536, H = 1024;
const poly = (pts, fill, stroke) => '<polygon points="' + pts.map((p) => p.join(',')).join(' ') + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="3"/>';
const rect = (r, fill, stroke) => '<rect x="' + r[0] + '" y="' + r[1] + '" width="' + (r[2] - r[0]) + '" height="' + (r[3] - r[1]) + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="3"/>';
const label = (x, y, t, c) => '<text x="' + x + '" y="' + y + '" fill="' + c + '" font-size="22" font-family="sans-serif" stroke="#000" stroke-width="1">' + t + '</text>';
let svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '">';
for (let x = 0; x < W; x += 100) svg += '<line x1="' + x + '" y1="0" x2="' + x + '" y2="' + H + '" stroke="#ff0" stroke-opacity="0.25"/><text x="' + (x + 2) + '" y="16" fill="#ff0" font-size="14">' + x + '</text>';
for (let y = 0; y < H; y += 100) svg += '<line x1="0" y1="' + y + '" x2="' + W + '" y2="' + y + '" stroke="#ff0" stroke-opacity="0.25"/><text x="2" y="' + (y - 2) + '" fill="#ff0" font-size="14">' + y + '</text>';
for (const p of M.walk || []) svg += poly(p, 'rgba(60,255,120,0.22)', 'rgba(60,255,120,0.9)');
for (const p of M.block || []) svg += poly(p, 'rgba(255,60,60,0.3)', 'rgba(255,60,60,0.9)');
for (const e of M.exits || []) { svg += rect(e.rect, 'rgba(80,140,255,0.3)', 'rgba(80,160,255,1)'); svg += label(e.rect[0] + 4, e.rect[1] + 24, '→ ' + e.to, '#9cf'); }
for (const n of M.people || []) { svg += '<circle cx="' + n.at[0] + '" cy="' + n.at[1] + '" r="14" fill="rgba(255,210,80,0.8)" stroke="#000"/>' + label(n.at[0] + 16, n.at[1] + 6, n.name, '#fd6'); }
for (const s of M.spots || []) { if (s.rect) { svg += rect(s.rect, 'rgba(255,120,255,0.18)', 'rgba(255,120,255,0.9)') + label(s.rect[0] + 4, s.rect[1] + 24, s.kind + ':' + s.id, '#f9f'); continue; } svg += '<circle cx="' + s.at[0] + '" cy="' + s.at[1] + '" r="12" fill="rgba(255,255,255,0.8)" stroke="#000"/>' + label(s.at[0] + 14, s.at[1] + 6, s.kind + (s.id ? ':' + s.id : ''), '#fff'); }
if (M.start) svg += '<circle cx="' + M.start[0] + '" cy="' + M.start[1] + '" r="10" fill="#f6f" stroke="#000"/>';
svg += '</svg>';
const buf = await sharp(src).resize(W, H).composite([{ input: Buffer.from(svg) }]).png().toBuffer();
await sharp(buf).resize(+(wA || 1200)).png().toFile(out);
console.log('wrote ' + out);
