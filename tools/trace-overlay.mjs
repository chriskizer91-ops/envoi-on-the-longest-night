// trace-overlay.mjs: draws a ground map's traced walk areas, blocks, fronts, exits, people and spots over its painting,
// to check the tracing by eye. Usage: node tools/trace-overlay.mjs <mapId> <out.png> [width] [--grid 50] [--crop x,y,w,h]
//   [--plain] (the painting and the grid only)
// Walk areas are green, blocks red, fronts (the painting's pieces drawn over Io when she's behind them) violet with their
// base line, exits blue, people gold, other spots white, event areas pink; labels name each. --crop draws only that part
// of the map (in map px), scaled to width; the grid's numbers are map px.
import fs from 'fs'; import path from 'path'; import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const R = path.resolve(new URL('..', import.meta.url).pathname);
const sharp = require(path.join(R, 'tools/node_modules/sharp'));
require(path.join(R, 'src/game/maps.js'));
const args = process.argv.slice(2), pos = [];
let grid = 100, crop = null, plain = false;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--grid') grid = +args[++i];
  else if (args[i] === '--crop') crop = args[++i].split(',').map(Number);
  else if (args[i] === '--plain') plain = true;
  else pos.push(args[i]);
}
const [id, out, wA] = pos;
const M = globalThis.MAPS[id]; if (!M) { console.error('no map ' + id); process.exit(1); }
const W = 1536, H = 1024;
const [cx, cy, cw, ch] = crop || [0, 0, W, H];
const width = +(wA || 1200), k = width / cw, height = Math.round(ch * k);
// the original painting (its content-credentials block, which sharp won't read, left out)
function plainPng(buf) {
  if (buf.toString('ascii', 1, 4) !== 'PNG') return buf;
  const keep = new Set(['IHDR', 'PLTE', 'tRNS', 'IDAT', 'IEND', 'gAMA', 'sRGB', 'cHRM', 'iCCP']), parts = [buf.subarray(0, 8)];
  for (let o = 8; o + 12 <= buf.length;) { const len = buf.readUInt32BE(o), type = buf.toString('ascii', o + 4, o + 8); if (keep.has(type)) parts.push(buf.subarray(o, o + 12 + len)); o += 12 + len; }
  return Buffer.concat(parts);
}
const src = path.join(R, 'reference/art/walk', path.basename(M.src).replace('.webp', '.png'));
const X = (x) => ((x - cx) * k).toFixed(1), Y = (y) => ((y - cy) * k).toFixed(1);
const sw = Math.max(1.5, 3 * k * 0.6), fs1 = Math.max(12, Math.round(14 * Math.min(1.6, k)));
const poly = (pts, fill, stroke, dash) => '<polygon points="' + pts.map((p) => X(p[0]) + ',' + Y(p[1])).join(' ') + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + sw + '"' + (dash ? ' stroke-dasharray="6 4"' : '') + '/>';
const rect = (r, fill, stroke) => '<rect x="' + X(r[0]) + '" y="' + Y(r[1]) + '" width="' + ((r[2] - r[0]) * k).toFixed(1) + '" height="' + ((r[3] - r[1]) * k).toFixed(1) + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + sw + '"/>';
const label = (x, y, t, c) => '<text x="' + X(x) + '" y="' + Y(y) + '" fill="' + c + '" font-size="' + fs1 + '" font-family="sans-serif" stroke="#000" stroke-width="0.8">' + t + '</text>';
let svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '">';
for (let x = Math.ceil(cx / grid) * grid; x <= cx + cw; x += grid) { const major = x % (grid * 2) === 0; svg += '<line x1="' + X(x) + '" y1="0" x2="' + X(x) + '" y2="' + height + '" stroke="#ff0" stroke-opacity="' + (major ? 0.45 : 0.22) + '"/>'; if (major) svg += '<text x="' + (+X(x) + 2) + '" y="' + fs1 + '" fill="#ff0" font-size="' + fs1 + '" stroke="#000" stroke-width="0.6">' + x + '</text>'; }
for (let y = Math.ceil(cy / grid) * grid; y <= cy + ch; y += grid) { const major = y % (grid * 2) === 0; svg += '<line x1="0" y1="' + Y(y) + '" x2="' + width + '" y2="' + Y(y) + '" stroke="#ff0" stroke-opacity="' + (major ? 0.45 : 0.22) + '"/>'; if (major) svg += '<text x="2" y="' + (+Y(y) - 2) + '" fill="#ff0" font-size="' + fs1 + '" stroke="#000" stroke-width="0.6">' + y + '</text>'; }
if (!plain) {
  for (const p of M.walk || []) svg += poly(p, 'rgba(60,255,120,0.2)', 'rgba(60,255,120,0.9)');
  for (const p of M.block || []) svg += poly(p, 'rgba(255,60,60,0.3)', 'rgba(255,60,60,0.9)');
  for (const f of M.front || []) { svg += poly(f.pts, 'rgba(190,110,255,0.22)', 'rgba(200,130,255,0.95)', true); const xs = f.pts.map((p) => p[0]); svg += '<line x1="' + X(Math.min(...xs)) + '" y1="' + Y(f.base) + '" x2="' + X(Math.max(...xs)) + '" y2="' + Y(f.base) + '" stroke="#e0b0ff" stroke-width="' + sw + '"/>'; }
  for (const e of M.exits || []) { svg += rect(e.rect, 'rgba(80,140,255,0.3)', 'rgba(80,160,255,1)'); svg += label(e.rect[0] + 4, e.rect[1] + 24, '→ ' + e.to, '#9cf'); }
  for (const n of M.people || []) { svg += '<circle cx="' + X(n.at[0]) + '" cy="' + Y(n.at[1]) + '" r="' + 6 * k + '" fill="rgba(255,210,80,0.8)" stroke="#000"/>' + label(n.at[0] + 10, n.at[1] + 6, n.name, '#fd6'); }
  for (const s of M.spots || []) { if (s.rect) { svg += rect(s.rect, 'rgba(255,120,255,0.12)', 'rgba(255,120,255,0.9)') + label(s.rect[0] + 4, s.rect[1] + 24, s.kind + ':' + s.id, '#f9f'); continue; } svg += '<circle cx="' + X(s.at[0]) + '" cy="' + Y(s.at[1]) + '" r="' + 5 * k + '" fill="rgba(255,255,255,0.8)" stroke="#000"/>' + label(s.at[0] + 10, s.at[1] + 6, s.kind + (s.id ? ':' + s.id : ''), '#fff'); }
  if (M.start) svg += '<circle cx="' + X(M.start[0]) + '" cy="' + Y(M.start[1]) + '" r="' + 5 * k + '" fill="#f6f" stroke="#000"/>';
}
svg += '</svg>';
const base = await sharp(plainPng(fs.readFileSync(src))).extract({ left: cx, top: cy, width: cw, height: ch }).resize(width, height, { kernel: 'nearest' }).png().toBuffer();
await sharp(base).composite([{ input: Buffer.from(svg) }]).png().toFile(out);
console.log('wrote ' + out);
