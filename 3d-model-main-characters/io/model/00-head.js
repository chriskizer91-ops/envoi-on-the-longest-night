// io.js: Io, the Witch, as a main-character study (the laptop reference). three.js r128 (global THREE).
// Defines makeIo(opts) only, with the same interface, bones, moves, hit times and anchors as the game's model
// (src/models/witch.js, makeWitch), so it can stand in for it unchanged.
//
// What it is: the game's Io, kept exactly as she looks and moves (every bone, proportion, colour, lock of hair, fold and
// motion is the game model's), and built again at the level of detail of the Bramble Colossus field study. Nothing is
// redesigned; every part is made the way the real thing is made:
//  - her face is one smooth sculpt with her nose and cheeks in it, its skin painted (her blush is in the skin now) and lit
//    as skin is, with light glowing red through its edges; her eyes have a painted iris with depth, a wet cornea that
//    catches the night, and lashes and brows of single hairs;
//  - her hair keeps every lock where it was, each now a bundle of fine strands with its own highlight running along it;
//  - her coat and hat are velvet with a pile that shines at the edges, the stars on them are embroidered in gold and silk
//    thread, the coat has its lining and a thickness, and its trim is a woven gold braid with piping round its edges;
//  - her dress glitters as it moves through the light, her bodice is a fine knotted net, her sash is satin;
//  - her boots are creased leather with stitched straps and real buckles; her hands have shaped fingers and lacquered nails;
//  - the gold and silver are polished metal that reflect the night, her dagger has a ridged, engraved blade and a wrapped
//    grip, her glasses have glass in them, the horns on her hat are ridged horn;
//  - her flame is a living flame, and her spells' light is drawn at a higher resolution.
//
// opts: { detail .25 to 1 (1, the default, is the laptop reference; .5 is about a third of its triangles; .25 is near the
//         game's budget), shadows (true: she casts and takes shadows), linear (default true: colours are painted for a
//         linear, tone-mapped renderer with an environment; false for the game's plain one) }
function makeIo(opts) {
 'use strict';
 // Units are meters, Y up, facing +Z, her feet on the ground at the origin. Her right side is -X: the dagger hand.
 opts = opts || {};
 const DET = Math.max(.25, Math.min(1, opts.detail == null || !Number.isFinite(+opts.detail) ? 1 : +opts.detail));
 const Q = (n, m) => Math.max(m || 3, Math.round(n * DET));
 const TAU = Math.PI * 2, PI = Math.PI;
 // the game model's own stream: it places her hair, her sparks and motes and times her blinks. Each part that used it
 // starts it again where the game model had it, so every lock and spark falls where it did there.
 let hs = 90210;
 const hr = () => (hs = (hs * 16807) % 2147483647) / 2147483647;
 const SEED = { hair: 768023001, spark: 1213765947, motes: 1176445400, starmap: 1996422933, motion: 1126508089 };
 // a second stream for everything new (strands, stitches, paint), so its counts never move the first
 let s2 = 4471;
 const r2 = () => (s2 = (s2 * 16807) % 2147483647) / 2147483647;
 const rr = (a, b) => a + (b - a) * r2();
 const cl = (v, a, b) => (v < a ? a : v > b ? b : v);
 const sm = (e0, e1, x) => { const u = cl((x - e0) / (e1 - e0), 0, 1); return u * u * (3 - 2 * u); };
 const lerp = (a, b, t) => a + (b - a) * t;
 const V3 = (x, y, z) => new THREE.Vector3(x || 0, y || 0, z || 0);
 const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
 // colour: everything is chosen in sRGB, as the game model lists it; LIN turns it linear for a tone-mapped renderer and
 // marks painted colour maps as sRGB so the renderer decodes them
 const LIN = opts.linear !== false;
 const lin1 = (v) => (LIN ? Math.pow(cl(v, 0, 16), 2.2) : v);
 const C = (hex) => { const c = new THREE.Color(hex); if (LIN) c.convertSRGBToLinear(); return c; };
 const CR = (r, g, b) => new THREE.Color(lin1(r), lin1(g), lin1(b));
 const tex = (c, rx, ry, data) => {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; if (rx) t.repeat.set(rx, ry || rx);
  t.anisotropy = 8; if (LIN && !data) t.encoding = THREE.sRGBEncoding;
  return t;
 };
 const dataTex = (c, rx, ry) => tex(c, rx, ry, true);
 const TS = DET > .6 ? 1 : .5;                         // texture size: halved below detail .6

 // ---------- painting helpers ----------
 // Each surface is painted twice in step: its colour, and a height field (white stands up, black sinks) that becomes its
 // normal map, so stitches, grain and pile catch the light where they really are. Some also get a third map: roughness in
 // green and metalness in blue, so gold thread shines in velvet.
 const css = (r, g, b, a) => `rgba(${r | 0},${g | 0},${b | 0},${a === undefined ? 1 : a})`;
 const hgt = (v, a) => css(v * 255, v * 255, v * 255, a === undefined ? 1 : a);
 function pair(W, H, col, h0) {
  const c = cvs(W, H), g = c.getContext('2d'), hc = cvs(W, H), h = hc.getContext('2d');
  g.fillStyle = col; g.fillRect(0, 0, W, H); h.fillStyle = hgt(h0 === undefined ? .5 : h0); h.fillRect(0, 0, W, H);
  return { c, g, hc, h, W, H };
 }
 // draw f(ox, oy) once per neighbouring tile, so marks that cross an edge come back on the other side
 const tiled = (W, H, f) => { for (const ox of [-W, 0, W]) for (const oy of [-H, 0, H]) f(ox, oy); };
 // a tiling normal map from a height canvas (k: how deep)
 function normalFrom(src, k) {
  const W = src.width, H = src.height, s = src.getContext('2d').getImageData(0, 0, W, H).data, h = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) h[i] = s[i * 4] / 255;
  const c = cvs(W, H), g = c.getContext('2d'), img = g.createImageData(W, H), d = img.data;
  const at = (x, y) => h[((y + H) % H) * W + (x + W) % W];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
   const dx = at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x - 1, y) - at(x - 1, y + 1);
   const dy = at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1);
   const nx = -dx * k, ny = dy * k, l = Math.hypot(nx, ny, 1), i = (y * W + x) * 4;
   d[i] = (nx / l * .5 + .5) * 255; d[i + 1] = (ny / l * .5 + .5) * 255; d[i + 2] = (1 / l * .5 + .5) * 255; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0); return c;
 }
 const blur = (cv, px) => { const c = cvs(cv.width, cv.height), g = c.getContext('2d'); g.filter = 'blur(' + px + 'px)'; tiled(cv.width, cv.height, (ox, oy) => g.drawImage(cv, ox, oy)); g.filter = 'none'; return c; };
 // a canvas painted pixel by pixel: f(x, y, out) writes r, g, b, a (0 to 255)
 function perPixel(W, H, f) {
  const c = cvs(W, H), g = c.getContext('2d'), img = g.createImageData(c.width, c.height), d = img.data, o = [0, 0, 0, 255];
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) { o[3] = 255; f(x, y, o); const i = (y * c.width + x) * 4; d[i] = o[0]; d[i + 1] = o[1]; d[i + 2] = o[2]; d[i + 3] = o[3]; }
  g.putImageData(img, 0, 0); return c;
 }
 // value noise on a tiling lattice, for painting (n cells across)
 function noise2(n, seed) {
  const L = new Float32Array(n * n); let s = seed || 1;
  for (let i = 0; i < n * n; i++) { s = (s * 16807) % 2147483647; L[i] = s / 2147483647; }
  return (u, v) => {
   const x = u * n, y = v * n, xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
   const a = L[((yi % n + n) % n) * n + (xi % n + n) % n], b = L[((yi % n + n) % n) * n + ((xi + 1) % n + n) % n];
   const c = L[(((yi + 1) % n + n) % n) * n + (xi % n + n) % n], d = L[(((yi + 1) % n + n) % n) * n + ((xi + 1) % n + n) % n];
   const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
   return lerp(lerp(a, b, sx), lerp(c, d, sx), sy);
  };
 }
 // the four-pointed star the game model scatters on her coat and hat
 function star4(g, x, y, r) {
  g.beginPath(); g.moveTo(x, y - r);
  g.quadraticCurveTo(x, y, x + r, y); g.quadraticCurveTo(x, y, x, y + r);
  g.quadraticCurveTo(x, y, x - r, y); g.quadraticCurveTo(x, y, x, y - r); g.fill();
 }
