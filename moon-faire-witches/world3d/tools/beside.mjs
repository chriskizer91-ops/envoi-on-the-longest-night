// beside.mjs: a place's 3D from straight above (the still shots.mjs takes with { "top": true }), cut to the painting's
// area, beside the painting itself, for comparing the layout by eye.
// Usage: node moon-faire-witches/world3d/tools/beside.mjs <place> <top still.jpg> <out.jpg>
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const R = path.resolve(new URL('../../..', import.meta.url).pathname);
const sharp = require(path.join(R, 'tools/node_modules/sharp'));
globalThis.window = globalThis;
const [id, still, out] = process.argv.slice(2);
require(path.join(R, 'moon-faire-witches/world3d/places', id + '.js'));
const P = window.W3D_PLACES[id];
const [PW, PH] = P.size, pW = PW * 0.04, pH = PH * 0.05;
const meta = await sharp(still).metadata(), W = meta.width, H = meta.height, asp = W / H;
// the guide's camera fits the painting's width (or its height, on a tall screen) with 3% to spare
let hw = pW / 2 * 1.03, hh = hw / asp; if (hh < pH / 2 * 1.03) { hh = pH / 2 * 1.03; hw = hh * asp; }
const ppm = W / (2 * hw), cw = Math.round(pW * ppm), ch = Math.round(pH * ppm);
const top = await sharp(still).extract({ left: Math.round((W - cw) / 2), top: Math.round((H - ch) / 2), width: cw, height: ch }).resize(768, 640, { fit: 'fill' }).toBuffer();
const paint = await sharp(path.join(R, P.paintingPng)).resize(768, 640, { fit: 'fill' }).toBuffer();
await sharp({ create: { width: 768 * 2 + 12, height: 640, channels: 3, background: { r: 14, g: 12, b: 30 } } })
  .composite([{ input: top, left: 0, top: 0 }, { input: paint, left: 780, top: 0 }]).jpeg({ quality: 86 }).toFile(out);
console.log(out, '(left: the 3D from above; right: the painting, both stretched alike)');
