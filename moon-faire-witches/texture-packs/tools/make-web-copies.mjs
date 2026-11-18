// make-web-copies.mjs: the copies of Chris's made textures that the game's pages carry (the reskin job, November 17, 2026).
// The originals in ../made/ stay exactly as Chris made them (PNG, about 2.5 MB each). A page that carried them as they are
// would be over 100 MB a zone, so each gets a copy here at its FULL size (no shrinking: the laptop is the main screen) in
// WebP at quality 95, about a quarter of the weight, with nothing the eye can tell apart.
// Every copy keeps its card's file name (shared_cobbles_town.png -> shared_cobbles_town.webp) and has a row in
// ../made-web/index.csv that points back to its original's row in ../made/index.csv or ../made/index-short-list.csv.
// A picture Chris made again sits in ../made/revised/ under the same name; the copy here is made from that one.
//
// Cut-outs (the short list's doors, windows, boughs and bushes: one thing on plain grey): the copy is trimmed to the thing
// itself and its grey background made see-through, so the game can lay it on a wall or build a tree's crown from it.
//  - a door or a window ("Flat view"): only grey joined to the picture's edge goes (its stones are grey too);
//  - a bough or a bush ("Plant"): all the grey goes, the gaps between the leaves too.
// What each was trimmed to is written to ../../world3d/engine/cutouts.js (W3D.CUTOUTS: its size, and where its foot or its
// cut end is), which the 3D pages read.
// Usage: node moon-faire-witches/texture-packs/tools/make-web-copies.mjs   (again whenever made/ gains or changes a picture)
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let sharp; try { sharp = require('sharp'); } catch (e) { try { sharp = require(path.resolve(new URL('../../../tools/node_modules/sharp', import.meta.url).pathname)); } catch (e2) { sharp = require('/opt/npm-tools/node_modules/sharp'); } }
const D = path.resolve(new URL('..', import.meta.url).pathname), MADE = path.join(D, 'made'), OUT = path.join(D, 'made-web');
const Q = 95;
fs.mkdirSync(OUT, { recursive: true });
// the originals' rows, for each copy's label and kind
const label = {}, kind = {}, round = {};
for (const ix of ['index.csv', 'index-short-list.csv']) {
  if (!fs.existsSync(path.join(MADE, ix))) continue;
  for (const r of fs.readFileSync(path.join(MADE, ix), 'utf8').trim().split('\n').slice(1)) {
    const m = r.match(/^([^,]+),("(?:[^"]|"")*"|[^,]*),("(?:[^"]|"")*"|[^,]*),([^,]*),/); if (!m) continue;
    label[m[1]] = m[2].replace(/^"|"$/g, ''); kind[m[1]] = m[3].replace(/^"|"$/g, ''); round[m[1]] = m[4];
  }
}
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const cutKind = (f) => (round[f] === 'short list' && /^Flat view/.test(kind[f]) ? 'flat' : round[f] === 'short list' && /^Plant/.test(kind[f]) ? 'plant' : null);

// a cut-out: grey out, trimmed. Returns { buf (webp), w, h, pivot: [u, v from the top], box }
async function cutOut(src, mode) {
  const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, N = W * H;
  // the background: the mean of the border
  const bg = [0, 0, 0]; let n = 0;
  for (let x = 0; x < W; x++) for (const y of [0, 2, H - 3, H - 1]) { const i = (y * W + x) * 3; bg[0] += data[i]; bg[1] += data[i + 1]; bg[2] += data[i + 2]; n++; }
  for (let c = 0; c < 3; c++) bg[c] /= n;
  const dist = (i) => Math.max(Math.abs(data[i * 3] - bg[0]), Math.abs(data[i * 3 + 1] - bg[1]), Math.abs(data[i * 3 + 2] - bg[2]));
  const T0 = 9, T1 = 30;   // nearer the grey than T0: background; beyond T1: the thing itself; between, a soft edge
  const alpha = new Uint8Array(N).fill(255);
  if (mode === 'plant') { for (let i = 0; i < N; i++) { const d = dist(i); alpha[i] = d <= T0 ? 0 : d >= T1 ? 255 : Math.round(255 * (d - T0) / (T1 - T0)); } }
  else {
    // flood in from the edge through near-grey pixels
    const seen = new Uint8Array(N), q = new Int32Array(N); let qh = 0, qt = 0;
    const push = (i) => { if (!seen[i] && dist(i) < T1) { seen[i] = 1; q[qt++] = i; } };
    for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); } for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
    while (qh < qt) { const i = q[qh++], x = i % W, y = (i / W) | 0; const d = dist(i); alpha[i] = d <= T0 ? 0 : Math.round(255 * (d - T0) / (T1 - T0));
      if (d > T0 + 6) continue;   // the soft edge doesn't carry the flood on (so it can't creep into a grey stone)
      if (x > 0) push(i - 1); if (x < W - 1) push(i + 1); if (y > 0) push(i - W); if (y < H - 1) push(i + W); }
  }
  // the box round what's left
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (alpha[y * W + x] > 128) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const pad = mode === 'plant' ? 6 : 2; x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(W - 1, x1 + pad); y1 = Math.min(H - 1, y1 + pad);
  const w = x1 - x0 + 1, h = y1 - y0 + 1, out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y + y0) * W + x + x0, o = (y * w + x) * 4, a = alpha[i] / 255;
    for (let c = 0; c < 3; c++) { let v = data[i * 3 + c]; if (a > 0.02 && a < 1) v = (v - (1 - a) * bg[c]) / a; out[o + c] = Math.max(0, Math.min(255, Math.round(v))); }   // the grey taken out of soft edges
    out[o + 3] = alpha[i];
  }
  // see-through pixels take a neighbour's colour (so no grey bleeds in when the picture is drawn small): a few passes
  for (let pass = 0; pass < 6; pass++) {
    const cp = Buffer.from(out);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const o = (y * w + x) * 4; if (cp[o + 3] > 8) continue; let r = 0, g = 0, b = 0, k = 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue; const p = (yy * w + xx) * 4; if (cp[p + 3] > 8 || cp[p] + cp[p + 1] + cp[p + 2] !== 0 && pass > 0 && cp[p + 3] === 1) { r += cp[p]; g += cp[p + 1]; b += cp[p + 2]; k++; } }
      if (k) { out[o] = r / k; out[o + 1] = g / k; out[o + 2] = b / k; out[o + 3] = 1; } }
  }
  for (let i = 3; i < out.length; i += 4) if (out[i] === 1) out[i] = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const o = (y * w + x) * 4; if (out[o + 3] === 0 && out[o] + out[o + 1] + out[o + 2] === 0) { out[o] = 40; out[o + 1] = 50; out[o + 2] = 50; } }
  // where it stands or was cut: the middle of what is solid along the bottom rows (a hanging bough: along the top)
  const mid = (rows) => { let s = 0, k = 0; for (const y of rows) for (let x = 0; x < w; x++) if (out[(y * w + x) * 4 + 3] > 128) { s += x; k++; } return k ? s / k / w : 0.5; };
  const band = Math.max(4, Math.round(h * 0.03)), bottom = [], top = []; for (let i = 0; i < band; i++) { bottom.push(h - 1 - pad - i); top.push(pad + i); }
  const buf = await sharp(out, { raw: { width: w, height: h, channels: 4 } }).webp({ quality: Q, alphaQuality: 100, effort: 5, smartSubsample: true }).toBuffer();
  return { buf, w, h, foot: +mid(bottom).toFixed(3), head: +mid(top).toFixed(3), box: [x0, y0, x1, y1] };
}

const out = ['file,label,made_from,width,height,bytes,original_bytes,webp_quality,original_sha256,note'];
const cuts = {};
let a = 0, b = 0, n = 0;
for (const f of fs.readdirSync(MADE).filter((x) => x.endsWith('.png')).sort()) {
  // a picture made again (made/revised/<the same name>) is the one the game's copy is made from
  const rev = path.join(MADE, 'revised', f), revised = fs.existsSync(rev);
  const src = revised ? rev : path.join(MADE, f), dst = path.join(OUT, f.replace(/\.png$/, '.webp')), id = f.replace(/\.png$/, '');
  const meta = await sharp(src).metadata(), cut = cutKind(f);
  let w = meta.width, h = meta.height, note = revised ? 'made again: from made/revised/' + f : '';
  if (revised && !cut) await sharp(src).webp({ quality: Q, effort: 5, smartSubsample: true }).toFile(dst);
  if (cut) {
    const c = await cutOut(src, cut); fs.writeFileSync(dst, c.buf); w = c.w; h = c.h;
    cuts[id] = { w, h, foot: c.foot, head: c.head };
    note = 'cut-out: trimmed to ' + c.box.join(' ') + ' of the original, grey background see-through';
  } else if (!fs.existsSync(dst) || fs.statSync(dst).mtimeMs < fs.statSync(src).mtimeMs) await sharp(src).webp({ quality: Q, effort: 5, smartSubsample: true }).toFile(dst);
  const s0 = fs.statSync(src).size, s1 = fs.statSync(dst).size; a += s0; b += s1; n++;
  out.push([path.basename(dst), '"' + (label[f] || '') + '"', (revised ? 'made/revised/' : 'made/') + f, w, h, s1, s0, Q, sha(src), '"' + note + '"'].join(','));
}
fs.writeFileSync(path.join(OUT, 'index.csv'), out.join('\n') + '\n');
const cj = path.resolve(D, '../world3d/engine/cutouts.js');
fs.writeFileSync(cj, '// cutouts.js: made by texture-packs/tools/make-web-copies.mjs. Each cut-out (a door, a window, a bough, a bush: one thing,\n// its grey background see-through) as trimmed: its size in pixels, and how far across its foot (the bottom) and its head\n// (the top) the solid part sits (0 to 1). Don\'t edit: run the tool again.\n(function (G) {\n  \'use strict\';\n  (G.W3D = G.W3D || {}).CUTOUTS = ' + JSON.stringify(cuts, null, 2).replace(/\n/g, '\n  ') + ';\n})(window);\n');
console.log(n + ' copies: ' + (a / 1e6).toFixed(0) + ' MB of originals -> ' + (b / 1e6).toFixed(0) + ' MB, full size, WebP quality ' + Q + '; ' + Object.keys(cuts).length + ' cut-outs (engine/cutouts.js)');
