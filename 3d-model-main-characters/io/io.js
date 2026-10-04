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

 // ---------- painted textures ----------
 // Every map is painted at one repeat; each part scales its own UVs to the repeat the game model gave it, so the stars,
 // braid and net sit at the same size on her as before.

 // velvet with embroidered stars: the coat (and sleeves and hood) and the hat. The game model's star cloth, painted four
 // times larger: the same number of stars to a tile, the same colours and sizes, now worked in thread (gold thread shines
 // as metal; the pink is silk), over velvet whose pile is crushed in soft patches and lies one way
 function VELVET(base, nStars, cols, rmin, rmax, seed) {
  const W = 1024 * TS, k = W / 256, P = pair(W, W, base, .5), g = P.g, h = P.h;
  const rmC = cvs(W, W), rm = rmC.getContext('2d'); rm.fillStyle = 'rgb(0,212,0)'; rm.fillRect(0, 0, W, W);
  // crushed pile: big soft patches lighter and darker, painted pixel by pixel over the base
  const n1 = noise2(6, seed), n2 = noise2(23, seed + 7), b = new THREE.Color(base);
  const pile = perPixel(W, W, (x, y, o) => {
   const u = x / W, v = y / W, n = n1(u, v) * .65 + n2(u, v) * .35, l = .84 + .3 * n;
   o[0] = b.r * 255 * l; o[1] = b.g * 255 * l; o[2] = b.b * 255 * l;
  });
  g.drawImage(pile, 0, 0);
  const hp = perPixel(W, W, (x, y, o) => { const v = (n2(x / W * 3 % 1, y / W * 3 % 1) - .5) * .1 + .5; o[0] = o[1] = o[2] = v * 255; });
  h.drawImage(hp, 0, 0);
  // the game model's flecks: dark and pale specks in the pile
  for (let i = 0; i < W * 4 / k; i++) { g.fillStyle = r2() < .55 ? 'rgba(20,0,12,0.10)' : 'rgba(255,200,230,0.05)'; g.fillRect(r2() * W, r2() * W, (1 + r2() * 4) * k * .7, (1 + r2() * 4) * k * .7); }
  // fine pile, lying one way: short strokes, a little lighter at their tips
  g.lineCap = 'round';
  for (let i = 0; i < 9000 * TS; i++) { const x = r2() * W, y = r2() * W, l = (3 + r2() * 6) * k * .5; g.strokeStyle = r2() < .5 ? 'rgba(0,0,0,.03)' : 'rgba(255,190,220,.018)'; g.lineWidth = .8 * k * .5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + l * .2, y + l); g.stroke(); }
  // the stars, embroidered: a raised star of thread, satin-stitched out along its four points, with a fine dark outline
  const thread = (col) => { const c = new THREE.Color(col); return [c.r * 255, c.g * 255, c.b * 255]; };
  for (let i = 0; i < nStars; i++) {
   const x = r2() * W, y = r2() * W, r = (rmin + r2() * (rmax - rmin)) * k, col = cols[(r2() * cols.length) | 0], t = thread(col), gold = col !== '#ff9fd0';
   tiled(W, W, (ox, oy) => {
    const X = x + ox, Y = y + oy;
    g.fillStyle = 'rgba(40,6,20,.55)'; star4(g, X, Y + r * .06, r * 1.12);
    g.fillStyle = col; star4(g, X, Y, r);
    // satin stitches: lines from the middle out along each point, alternately lighter and darker
    g.lineWidth = Math.max(.6, r * .07);
    for (let s = 0; s < 28; s++) {
     const a = s / 28 * TAU, rr2 = r * (.55 + .45 * Math.pow(Math.abs(Math.cos(2 * a)), 6));
     g.strokeStyle = s % 2 ? css(t[0] * .72, t[1] * .7, t[2] * .7, .7) : css(Math.min(255, t[0] * 1.15), Math.min(255, t[1] * 1.12), Math.min(255, t[2] * 1.1), .55);
     g.beginPath(); g.moveTo(X, Y); g.lineTo(X + Math.cos(a) * rr2 * .9, Y + Math.sin(a) * rr2 * .9); g.stroke();
    }
    h.fillStyle = hgt(.92); star4(h, X, Y, r);
    h.strokeStyle = hgt(.62, .8); h.lineWidth = Math.max(.6, r * .05);
    for (let s = 0; s < 14; s++) { const a = s / 14 * TAU; h.beginPath(); h.moveTo(X, Y); h.lineTo(X + Math.cos(a) * r * .8, Y + Math.sin(a) * r * .8); h.stroke(); }
    rm.fillStyle = gold ? 'rgb(0,92,230)' : 'rgb(0,118,0)'; star4(rm, X, Y, r);
   });
  }
  // the game model's glints: tiny beads of the same threads
  for (let i = 0; i < nStars * 4; i++) {
   const x = r2() * W, y = r2() * W, col = cols[(r2() * cols.length) | 0], s = 1.3 * k * .8, a = .35 + r2() * .6;
   g.globalAlpha = a; g.fillStyle = col; g.beginPath(); g.arc(x, y, s, 0, TAU); g.fill(); g.globalAlpha = 1;
   h.fillStyle = hgt(.85, a); h.beginPath(); h.arc(x, y, s, 0, TAU); h.fill();
   rm.fillStyle = col !== '#ff9fd0' ? 'rgb(0,80,210)' : 'rgb(0,100,0)'; rm.beginPath(); rm.arc(x, y, s, 0, TAU); rm.fill();
  }
  return { map: tex(P.c), normal: dataTex(normalFrom(blur(P.hc, .6 * k * .5), 2.4)), rm: dataTex(rmC) };
 }
 const COATV = VELVET('#8e2a57', 38, ['#f2c15a', '#e8a93e', '#ff9fd0'], 1.5, 4.5, 31);
 const HATV = VELVET('#7c1d4f', 16, ['#f2c15a', '#e8a93e'], 2, 5, 57);

 // the trim: the game model's ribbon (burgundy, a gold band along it, a row of gold blocks, a dark lower edge), woven:
 // a twill ribbon, the band a twisted gold cord, the blocks satin-stitched in two golds
 const TRIM = (() => {
  const W = 512 * TS, H = 64 * TS, k = W / 256, P = pair(W, H, '#5c1238', .45), g = P.g, h = P.h;
  const rmC = cvs(W, H), rm = rmC.getContext('2d'); rm.fillStyle = 'rgb(0,150,0)'; rm.fillRect(0, 0, W, H);
  g.lineWidth = h.lineWidth = .7 * k;
  for (let x = -H; x < W + H; x += 2.2 * k) { g.strokeStyle = 'rgba(20,0,10,.25)'; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + H * .5, H); g.stroke(); h.strokeStyle = hgt(.35, .6); h.beginPath(); h.moveTo(x, 0); h.lineTo(x + H * .5, H); h.stroke(); }
  // the cord: short slanted twists along a gold band
  g.fillStyle = '#e8ad48'; g.fillRect(0, 2 * k, W, 4 * k); h.fillStyle = hgt(.86); h.fillRect(0, 2 * k, W, 4 * k); rm.fillStyle = 'rgb(0,90,220)'; rm.fillRect(0, 2 * k, W, 4 * k);
  for (let x = 0; x < W; x += 2 * k) {
   g.strokeStyle = 'rgba(120,70,10,.75)'; g.lineWidth = .7 * k; g.beginPath(); g.moveTo(x, 2 * k); g.lineTo(x + 2 * k, 6 * k); g.stroke();
   g.strokeStyle = 'rgba(255,236,170,.6)'; g.lineWidth = .45 * k; g.beginPath(); g.moveTo(x + .6 * k, 2 * k); g.lineTo(x + 2.4 * k, 5.6 * k); g.stroke();
   h.strokeStyle = hgt(.55); h.lineWidth = .6 * k; h.beginPath(); h.moveTo(x, 2 * k); h.lineTo(x + 2 * k, 6 * k); h.stroke();
  }
  // the blocks, each satin-stitched across, alternately pale and deep gold
  for (let i = 0; i < 16; i++) {
   const x = (i * 16 + 4) * k, y = 15 * k, w = 8 * k, hh = 6 * k;
   g.fillStyle = i % 2 ? '#f7d68d' : '#e0a33c'; g.fillRect(x, y, w, hh);
   h.fillStyle = hgt(.9); h.fillRect(x, y, w, hh); rm.fillStyle = 'rgb(0,84,225)'; rm.fillRect(x, y, w, hh);
   for (let s = 0; s <= w; s += .9 * k) { g.fillStyle = 'rgba(110,60,10,.35)'; g.fillRect(x + s, y, .35 * k, hh); h.fillStyle = hgt(.7, .8); h.fillRect(x + s, y, .35 * k, hh); }
   g.strokeStyle = 'rgba(60,20,10,.6)'; g.lineWidth = .5 * k; g.strokeRect(x, y, w, hh);
  }
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 27 * k, W, 5 * k); h.fillStyle = hgt(.3); h.fillRect(0, 28 * k, W, 4 * k);
  return { map: tex(P.c), normal: dataTex(normalFrom(blur(P.hc, .4 * k), 2.2)), rm: dataTex(rmC) };
 })();

 // the dress: the game model's black tulle with warm glints, painted as a fine net with sequins caught in it (the light
 // catching single threads is the shader's)
 const DRESS = (() => {
  const W = 1024 * TS, k = W / 256, P = pair(W, W, '#1f171c', .5), g = P.g, h = P.h;
  for (let i = 0; i < W * 2 / k; i++) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(r2() * W, r2() * W, (2 + r2() * 3) * k * .8, (2 + r2() * 3) * k * .8); }
  // the net: a hexagonal mesh of fine threads
  const cell = 7 * k * .5; g.strokeStyle = 'rgba(70,52,62,.35)'; h.strokeStyle = hgt(.72, .7); g.lineWidth = h.lineWidth = .55 * k * .5;
  for (let y = 0, row = 0; y < W + cell; y += cell * .866, row++) for (let x = (row % 2) * cell * .5; x < W + cell; x += cell) {
   for (const ctx of [g, h]) { ctx.beginPath(); ctx.arc(x, y, cell * .5, 0, TAU); ctx.stroke(); }
  }
  // the game model's 1600 glints, now sequins: a round disc, bright on one side
  const em = cvs(W, W), e = em.getContext('2d'); e.fillStyle = '#000'; e.fillRect(0, 0, W, W);
  for (let i = 0; i < 1000; i++) {
   const x = r2() * W, y = r2() * W, b = 70 + r2() * 120, r = (r2() < .75 ? .6 : .9) * k * .75;
   const col = `rgb(${b | 0},${(b * .82) | 0},${(b * .74) | 0})`;
   g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
   e.fillStyle = col; e.beginPath(); e.arc(x, y, r, 0, TAU); e.fill();
   h.fillStyle = hgt(.9); h.beginPath(); h.arc(x, y, r, 0, TAU); h.fill();
  }
  return { map: tex(P.c), emis: tex(em), normal: dataTex(normalFrom(blur(P.hc, .5), 1.6)) };
 })();

 // satin with glints (the sash, grey with white glints) and the hat band (brown, warm glints, made furry by its shells)
 function SATIN(base, n, warm, seed) {
  const W = 512 * TS, k = W / 128, P = pair(W, W, base, .5), g = P.g, h = P.h, nz = noise2(5, seed);
  const b = new THREE.Color(base);
  g.drawImage(perPixel(W, W, (x, y, o) => { const l = .86 + .28 * nz(x / W, y / W); o[0] = b.r * 255 * l; o[1] = b.g * 255 * l; o[2] = b.b * 255 * l; }), 0, 0);
  for (let i = 0; i < W * 2 / k; i++) { g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(r2() * W, r2() * W, (2 + r2() * 3) * k * .7, (2 + r2() * 3) * k * .7); }
  const em = cvs(W, W), e = em.getContext('2d'); e.fillStyle = '#000'; e.fillRect(0, 0, W, W);
  for (let i = 0; i < n; i++) {
   const x = r2() * W, y = r2() * W, bb = 110 + r2() * 145, s = (r2() < .75 ? .55 : .9) * k * .7;
   const col = warm ? `rgb(${bb | 0},${(bb * .82) | 0},${(bb * .74) | 0})` : `rgb(${bb | 0},${bb | 0},${bb | 0})`;
   for (const ctx of [g, e]) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); ctx.fill(); }
  }
  // a fine weave
  h.strokeStyle = hgt(.62, .5); h.lineWidth = .5 * k * .4; for (let x = 0; x < W; x += 1.6 * k * .5) { h.beginPath(); h.moveTo(x, 0); h.lineTo(x, W); h.stroke(); }
  return { map: tex(P.c), emis: tex(em), normal: dataTex(normalFrom(blur(P.hc, .5), 1.2)) };
 }
 const SASH = SATIN('#4d4248', 700, false, 11);
 const BAND = SATIN('#3a2422', 500, true, 13);

 // the bodice: the game model's diamond net (eight diamonds to a tile), knotted where its threads cross
 const NET = (() => {
  const W = 512 * TS, k = W / 64, P = pair(W, W, '#1b141b', .3), g = P.g, h = P.h;
  const line = (ctx, x0, y0, x1, y1) => { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); };
  for (let pass = 0; pass < 2; pass++) for (let q = -W; q <= W * 2; q += 8 * k) {
   g.lineWidth = (pass ? .4 : .95) * k; g.strokeStyle = pass ? 'rgba(200,180,190,.25)' : 'rgba(150,128,140,0.55)';
   line(g, q, 0, q + W, W); line(g, q, W, q + W, 0);
   if (!pass) { h.lineWidth = 1.3 * k; h.strokeStyle = hgt(.85); line(h, q, 0, q + W, W); line(h, q, W, q + W, 0); }
  }
  for (let x = 0; x <= W; x += 4 * k) for (let y = 0; y <= W; y += 4 * k) {
   if (((x + y) / (4 * k)) % 2) continue;
   g.fillStyle = 'rgba(166,146,156,.6)'; g.beginPath(); g.arc(x, y, .75 * k, 0, TAU); g.fill();
   h.fillStyle = hgt(1); h.beginPath(); h.arc(x, y, 1 * k, 0, TAU); h.fill();
  }
  for (let i = 0; i < 60; i++) { const b = 150 + r2() * 105; g.fillStyle = `rgb(${b | 0},${(b * 0.85) | 0},${(b * 0.8) | 0})`; g.fillRect(r2() * W, r2() * W, k * .6, k * .6); }
  return { map: tex(P.c), normal: dataTex(normalFrom(blur(P.hc, .4 * k), 2.6)) };
 })();

 // leather: her boots and the dagger's grip. Pebbled grain, creases where it bends, worn paler on the edges of the creases
 const LEATHER = (() => {
  const W = 1024 * TS, P = pair(W, W, '#2e1f22', .5), g = P.g, h = P.h, k = W / 256;
  const n1 = noise2(9, 3), n2 = noise2(64, 5), n3 = noise2(150, 9);
  g.drawImage(perPixel(W, W, (x, y, o) => { const u = x / W, v = y / W, l = .8 + .35 * n1(u, v) + .12 * (n2(u, v) - .5); o[0] = 46 * l; o[1] = 31 * l; o[2] = 34 * l; }), 0, 0);
  h.drawImage(perPixel(W, W, (x, y, o) => { const u = x / W, v = y / W, p = n3(u, v), q = n2(u, v); const c = Math.pow(Math.abs(p - .5) * 2, .6); o[0] = o[1] = o[2] = (.35 + .4 * c + .15 * q) * 255; }), 0, 0);
  // creases: wandering lines across, in bunches, each a dark groove with a pale worn lip
  g.lineCap = h.lineCap = 'round';
  for (let i = 0; i < 70; i++) {
   const y0 = r2() * W, x0 = r2() * W, len = (40 + r2() * 160) * k * .5, amp = (2 + r2() * 4) * k * .5;
   const pts = []; for (let s = 0; s <= 12; s++) pts.push([x0 + s / 12 * len, y0 + Math.sin(s * .9 + i) * amp]);
   const path = (ctx, dy) => { ctx.beginPath(); pts.forEach((p, j) => (j ? ctx.lineTo(p[0], p[1] + dy) : ctx.moveTo(p[0], p[1] + dy))); ctx.stroke(); };
   for (const ox of [0, -W]) {
    g.save(); g.translate(ox, 0); g.strokeStyle = 'rgba(10,4,6,.45)'; g.lineWidth = 1.4 * k * .5; path(g, 0); g.strokeStyle = 'rgba(120,96,96,.18)'; g.lineWidth = 1.2 * k * .5; path(g, -1.5 * k * .5); g.restore();
    h.save(); h.translate(ox, 0); h.strokeStyle = hgt(.05, .8); h.lineWidth = 1.6 * k * .5; path(h, 0); h.strokeStyle = hgt(.8, .5); h.lineWidth = 1.4 * k * .5; path(h, -1.6 * k * .5); h.restore();
   }
  }
  const rmC = perPixel(W, W, (x, y, o) => { o[0] = 0; o[1] = (.42 + .3 * n1(x / W * 2 % 1, y / W * 2 % 1)) * 255; o[2] = 0; });
  return { map: tex(P.c), normal: dataTex(normalFrom(blur(P.hc, .5), 2.8)), rm: dataTex(rmC) };
 })();

 // horn: fine growth lines across it, between the ridges the geometry makes
 const HORN = (() => {
  const W = 512 * TS, H = 128 * TS, P = pair(W, H, '#e9cfa4', .5), g = P.g, h = P.h;
  for (let i = 0; i < 260; i++) {
   const x = r2() * W, w = .5 + r2() * 1.5, a = .05 + r2() * .12;
   g.fillStyle = r2() < .5 ? `rgba(120,90,60,${a})` : `rgba(255,248,230,${a})`; g.fillRect(x, 0, w, H);
   h.fillStyle = hgt(r2() < .5 ? .35 : .65, .5); h.fillRect(x, 0, w * 1.3, H);
  }
  for (let i = 0; i < 400 * TS; i++) { g.fillStyle = 'rgba(140,110,80,.08)'; g.fillRect(r2() * W, r2() * H, 2 + r2() * 12, .6); }
  return { map: tex(P.c), normal: dataTex(normalFrom(blur(P.hc, .6), 2)) };
 })();

 // the iris: the game model's amber-brown eye, at four times its resolution: fibres, a darker rim, the lid's shadow over
 // its top and a warm glow low in it, round a deep pupil
 const IRIS = (() => {
  const S = 512 * TS, k = S / 128, c = cvs(S, S), g = c.getContext('2d'), m = S / 2;
  let gr = g.createRadialGradient(m, m + 8 * k, 4 * k, m, m, m);
  gr.addColorStop(0, '#d8a060'); gr.addColorStop(0.45, '#9a5a2a'); gr.addColorStop(0.8, '#5a2f16'); gr.addColorStop(1, '#241208');
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 700; i++) {
   const a = r2() * TAU, r0 = (14 + r2() * 6) * k, r1 = (30 + r2() * 30) * k;
   g.strokeStyle = r2() < .5 ? 'rgba(255,215,160,0.2)' : 'rgba(40,16,4,0.26)'; g.lineWidth = (.3 + r2() * .6) * k;
   g.beginPath(); g.moveTo(m + Math.cos(a) * r0, m + Math.sin(a) * r0); g.quadraticCurveTo(m + Math.cos(a + .08) * (r0 + r1) * .5, m + Math.sin(a + .08) * (r0 + r1) * .5, m + Math.cos(a) * r1, m + Math.sin(a) * r1); g.stroke();
  }
  // the collarette, a ragged ring round the pupil, and a few dark crypts
  g.strokeStyle = 'rgba(255,200,130,.35)'; g.lineWidth = 2 * k; g.beginPath(); for (let i = 0; i <= 90; i++) { const a = i / 90 * TAU, r = (25 + 2.5 * Math.sin(a * 13) + 1.5 * Math.sin(a * 29)) * k; i ? g.lineTo(m + Math.cos(a) * r, m + Math.sin(a) * r) : g.moveTo(m + Math.cos(a) * r, m + Math.sin(a) * r); } g.stroke();
  for (let i = 0; i < 40; i++) { const a = r2() * TAU, r = (30 + r2() * 26) * k; g.fillStyle = 'rgba(30,10,2,.3)'; g.beginPath(); g.ellipse(m + Math.cos(a) * r, m + Math.sin(a) * r, 2.2 * k, 1 * k, a, 0, TAU); g.fill(); }
  gr = g.createLinearGradient(0, 0, 0, S * 0.58); gr.addColorStop(0, 'rgba(20,6,2,0.85)'); gr.addColorStop(1, 'rgba(20,6,2,0)');
  g.fillStyle = gr; g.fillRect(0, 0, S, S * 0.58);
  gr = g.createRadialGradient(m, S * 0.84, 2 * k, m, S * 0.84, S * 0.38); gr.addColorStop(0, 'rgba(255,200,130,0.65)'); gr.addColorStop(1, 'rgba(255,200,130,0)');
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  g.fillStyle = '#120804'; g.beginPath(); g.ellipse(m, m + 3 * k, 16 * k, 21 * k, 0, 0, TAU); g.fill();
  gr = g.createRadialGradient(m, m, m - 9 * k, m, m, m); gr.addColorStop(0, 'rgba(22,8,3,0)'); gr.addColorStop(.5, 'rgba(22,8,3,.95)'); gr.addColorStop(1, 'rgba(22,8,3,1)');
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  return tex(c);
 })();

 // her face's skin, in the head's own sphere UVs: her skin tone, the blush she always wears (the game model's two pink
 // discs, now in the skin, soft at their edges), a warmer nose tip, and a faint unevenness, with pores in its relief
 const FACE = (() => {
  const W = 1024 * TS, H = 512 * TS, base = new THREE.Color('#f0b894'), blush = new THREE.Color('#ff8a8a'), shade = new THREE.Color('#eaa585');
  const nz = noise2(24, 21), nz2 = noise2(90, 23);
  const az0 = (x) => { const ph = x / W * TAU; return Math.atan2(-Math.cos(ph), Math.sin(ph)); };
  const c = perPixel(W, H, (x, y, o) => {
   const th = y / H * PI, el = PI / 2 - th, az = az0(x);
   let r = base.r, gg = base.g, b = base.b;
   const v = (nz(x / W, y / H) - .5) * .05; r += v; gg += v * .8; b += v * .7;
   // blush: a soft oval on each cheek
   for (const sd of [-1, 1]) {
    const dx = (az - sd * .56) * Math.cos(el) / .175, dy = (el + .3) / .094, d = Math.hypot(dx, dy), a = .4 * (1 - sm(.2, 1.35, d));
    r = lerp(r, blush.r, a); gg = lerp(gg, blush.g, a); b = lerp(b, blush.b, a);
   }
   // the nose tip, warmer
   { const d = Math.hypot(az * Math.cos(el) / .06, (el + .245) / .05), a = .55 * (1 - sm(.3, 1.2, d)); r = lerp(r, shade.r, a); gg = lerp(gg, shade.g, a); b = lerp(b, shade.b, a); }
   // a little warmth under the brows and round the jaw, where skin is thinner and in shade
   { const a = .18 * sm(-.55, -.85, el) + .08 * sm(.5, .9, Math.abs(az) / 1.6); r = lerp(r, shade.r * .95, a); gg = lerp(gg, shade.g * .9, a); b = lerp(b, shade.b * .9, a); }
   o[0] = cl(r, 0, 1) * 255; o[1] = cl(gg, 0, 1) * 255; o[2] = cl(b, 0, 1) * 255;
  });
  const hc = perPixel(W, H, (x, y, o) => { const p = nz2(x / W, y / H); o[0] = o[1] = o[2] = (.5 + .5 * (p - .5) + (r2() - .5) * .18) * 255; });
  return { map: tex(c), normal: dataTex(normalFrom(blur(hc, .6), 1.2)) };
 })();
 // skin elsewhere (neck, arms, legs, hands): pores only
 const SKIN = (() => {
  const W = 256 * TS, nz = noise2(40, 41);
  const hc = perPixel(W, W, (x, y, o) => { o[0] = o[1] = o[2] = (.5 + .45 * (nz(x / W, y / W) - .5) + (r2() - .5) * .25) * 255; });
  return dataTex(normalFrom(blur(hc, .6), 1.4), 1, 1);
 })();

 // the dagger's blade: steel with a crescent and a line of small stars engraved down its middle (u along the blade, v across)
 const BLADE = (() => {
  const W = 512 * TS, H = 128 * TS, P = pair(W, H, '#c8c8d2', .6), g = P.g, h = P.h, k = W / 512;
  for (let i = 0; i < 900 * TS; i++) { const y = r2() * H, x = r2() * W, l = 20 + r2() * 90; g.fillStyle = r2() < .5 ? 'rgba(255,255,255,.08)' : 'rgba(60,60,80,.08)'; g.fillRect(x, y, l * k, .7); h.fillStyle = hgt(r2() < .5 ? .66 : .54, .5); h.fillRect(x, y, l * k, .7); }
  g.strokeStyle = 'rgba(40,40,60,.75)'; h.strokeStyle = hgt(.05); g.lineWidth = h.lineWidth = 2.2 * k;
  for (const ctx of [g, h]) { ctx.beginPath(); ctx.arc(70 * k, H / 2, 26 * k, PI * .2, PI * 1.8); ctx.arc(84 * k, H / 2 - 6 * k, 22 * k, PI * 1.75, PI * .25, true); ctx.closePath(); ctx.stroke(); }
  for (let i = 0; i < 6; i++) { const x = (130 + i * 52) * k, r = (9 - i) * k; g.fillStyle = 'rgba(40,40,60,.7)'; star4(g, x, H / 2, r); h.fillStyle = hgt(.08); star4(h, x, H / 2, r); }
  for (const ctx of [g, h]) { ctx.beginPath(); for (let x = 110 * k; x < W * .86; x += 3 * k) { const y = H / 2 + Math.sin(x / (18 * k)) * 14 * k; x === 110 * k ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.lineWidth = 1.2 * k; ctx.stroke(); }
  const rmC = cvs(W, H), rm = rmC.getContext('2d'); rm.fillStyle = 'rgb(0,52,255)'; rm.fillRect(0, 0, W, H);
  rm.globalCompositeOperation = 'source-over'; rm.drawImage(P.hc, 0, 0); // the engraving darker in G (rougher)
  const d = rm.getImageData(0, 0, W, H); for (let i = 0; i < d.data.length; i += 4) { const e = d.data[i] < 60; d.data[i] = 0; d.data[i + 1] = e ? 170 : 52; d.data[i + 2] = 255; } rm.putImageData(d, 0, 0);
  return { map: tex(P.c), normal: dataTex(normalFrom(blur(P.hc, .5), 3)), rm: dataTex(rmC) };
 })();

 // crushed velvet for the scrunchie
 const CRUSH = (() => {
  const W = 256 * TS, nz = noise2(12, 61), nz2 = noise2(31, 67);
  const hc = perPixel(W, W, (x, y, o) => { const u = x / W, v = y / W; o[0] = o[1] = o[2] = (.5 + .5 * Math.sin((u * 3 + nz(u, v) * 1.5) * TAU) * .5 + (nz2(u, v) - .5) * .4) * 255; });
  return dataTex(normalFrom(blur(hc, .8), 2.5));
 })();

 // ---------- materials ----------
 // Shader additions, each where the real material needs it:
 //  - skin: light wraps a little past the edge of the lit side and comes out warm and red there, as it does through skin;
 //  - hair: two highlights run along each strand (a sharp pale one and a broad tinted one, shifted along it), broken up
 //    strand by strand, as hair shines;
 //  - glitter: a share of tiny facets in the dress, sash and hat band each catch a light only when it, the facet and the
 //    eye line up, so they twinkle as she moves and the camera turns;
 //  - fur: the hat band's shells thin out toward their tips into a fuzz;
 //  - a faint cool rim at the edges facing away, so she reads against the night;
 //  - her spells' white glow and her trance's blue (the game model lerps every emissive toward them; here they are added);
 //  - the starlight cloak of her trance, exactly as the game model draws it.
 const U = {
  time: { value: 0 }, glow: { value: 0 }, glowC: { value: CR(.48, .48, .5) }, trance: { value: 0 }, trC: { value: C('#6a80d8') },
  rim: { value: .3 }, rimC: { value: CR(.42, .45, .66) }, sss: { value: CR(1, .36, .24) }, glitC: { value: CR(1, .92, .82) }
 };
 const NOISE = 'float ioH(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}\n';
 const KEYS = ['skin', 'hair', 'glit', 'fur', 'rim', 'glow', 'tr', 'star', 'dark'];
 function patch(m, o) {
  const key = 'io1-' + KEYS.map((k) => (o[k] ? k + o[k] : '')).join('');
  m.onBeforeCompile = (sh) => {
   Object.assign(sh.uniforms, { uTime: U.time, uGlow: U.glow, uGlowC: U.glowC, uTrance: U.trance, uTrC: U.trC, uRim: U.rim, uRimC: U.rimC, uSSS: U.sss, uGlitC: U.glitC });
   if (o.star) sh.uniforms.starMap = { value: STARMAP };
   let vs = sh.vertexShader, fs = sh.fragmentShader;
   vs = 'varying vec3 vDP;\nvarying vec3 vWP;\n' + (o.hair ? 'attribute vec3 aHT;\nvarying vec3 vHT;\nvarying vec2 vHU;\n' : '') + (o.fur ? 'attribute float aShell;\nvarying float vShell;\n' : '') + vs;
   vs = vs.replace('#include <begin_vertex>', '#include <begin_vertex>\n vDP = position;' + (o.fur ? ' vShell = aShell;' : '') + (o.hair ? ' vHU = uv;' : ''));
   if (o.hair) vs = vs.replace('#include <skinnormal_vertex>', '#include <skinnormal_vertex>\n vec3 hT = aHT;\n#ifdef USE_SKINNING\n hT = (skinMatrix * vec4(hT, 0.)).xyz;\n#endif\n vHT = normalize((modelViewMatrix * vec4(hT, 0.)).xyz);');
   vs = vs.replace('#include <project_vertex>', '#include <project_vertex>\n vWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
   fs = 'varying vec3 vDP;\nvarying vec3 vWP;\nuniform float uTime, uGlow, uTrance, uRim;\nuniform vec3 uGlowC, uTrC, uRimC, uSSS, uGlitC;\n' + (o.hair ? 'varying vec3 vHT;\nvarying vec2 vHU;\n' : '') + (o.fur ? 'varying float vShell;\n' : '') +
    (o.star ? 'uniform sampler2D starMap;\n' : '') + NOISE + fs;
   let fn = '';
   if (o.skin) fn += 'vec3 ioSSS(IncidentLight dl, GeometricContext g) { float d = dot(g.normal, dl.direction); float w = clamp((d + .5) / 1.5, 0., 1.); return dl.color * max(0., w * w - max(d, 0.)) * uSSS * ' + (+o.skin).toFixed(2) + '; }\n';
   if (o.hair) fn += 'vec3 ioHair(IncidentLight dl, GeometricContext g, vec3 base) { vec3 T = normalize(vHT), N = g.normal, H = normalize(dl.direction + g.viewDir);\n' +
    ' float id = floor(vHU.y * 4096.), nz = ioH(vec3(id, 3.1, 7.7)), sp = .55 + .9 * ioH(vec3(floor(vHU.x * 40.), id, 1.));\n' +
    ' vec3 T1 = normalize(T + N * (-.1 + .08 * nz)), T2 = normalize(T + N * (.16 + .12 * nz)); float a = dot(T1, H), b = dot(T2, H);\n' +
    ' float s1 = pow(sqrt(max(0., 1. - a * a)), 160.), s2 = pow(sqrt(max(0., 1. - b * b)), 34.); float dif = clamp(dot(N, dl.direction) * .55 + .45, 0., 1.);\n' +
    ' return dl.color * dif * (s1 * .1 * vec3(1., .96, .92) + s2 * .45 * base * vec3(1.35, .85, .7)) * sp; }\n';
   if (o.glit) fn += 'vec3 ioGlit(IncidentLight dl, GeometricContext g) { vec3 c = floor(vDP * ' + (+o.glit).toFixed(1) + '); float h = ioH(c); if (h < .62) return vec3(0.);\n' +
    ' vec3 j = vec3(ioH(c + 1.7), ioH(c + 3.1), ioH(c + 5.3)) - .5; vec3 n = normalize(g.normal + j * 1.6); float s = pow(max(dot(n, normalize(dl.direction + g.viewDir)), 0.), 600.);\n' +
    ' return dl.color * s * 14. * uGlitC; }\n';
   if (fn) fs = fs.replace('#include <lights_pars_begin>', '#include <lights_pars_begin>\n' + fn);
   let add = '';
   if (o.skin) add += '\n\t\treflectedLight.directDiffuse += ioSSS(directLight, geometry) * material.diffuseColor;';
   if (o.hair) add += '\n\t\treflectedLight.directSpecular += ioHair(directLight, geometry, material.diffuseColor);';
   if (o.glit) add += '\n\t\treflectedLight.directSpecular += ioGlit(directLight, geometry);';
   if (add) fs = fs.replace('#include <lights_fragment_begin>', THREE.ShaderChunk.lights_fragment_begin.split('RE_Direct( directLight, geometry, material, reflectedLight );').join('RE_Direct( directLight, geometry, material, reflectedLight );' + add));
   // the fuzz: each shell keeps fewer fibres, and the lower ones are in their shade
   if (o.fur) fs = fs.replace('#include <map_fragment>', '#include <map_fragment>\n if (vShell > .001) { float n = ioH(vec3(floor(vUv.x * 1400.), floor(vUv.y * 70.), 0.)); if (n < vShell * .95 + .02) discard; }\n diffuseColor.rgb *= .5 + .5 * vShell + .2 * step(.001, vShell);');
   if (o.star) fs = fs.replace('#include <map_fragment>', '#include <map_fragment>\n vec4 stc = texture2D(starMap, vUv * 0.6 + vec2(uTime * 0.004, uTime * 0.012));' + (LIN ? ' stc.rgb = pow(stc.rgb, vec3(2.2));' : '') + '\n diffuseColor.rgb = mix(diffuseColor.rgb, stc.rgb * 0.75 + ' + (LIN ? 'vec3(0.0005, 0.0014, 0.0155)' : 'vec3(0.03, 0.05, 0.15)') + ', uTrance);');
   let em = '';
   if (o.star) em += '\n totalEmissiveRadiance += stc.rgb * stc.rgb * 1.8 * uTrance * (0.7 + 0.3 * sin(uTime * 3.0 + vUv.x * 37.0 + vUv.y * 23.0));';
   if (o.rim) em += '\n totalEmissiveRadiance += uRimC * uRim * ' + (+o.rim).toFixed(2) + ' * pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 3.);';
   if (o.glow) em += '\n totalEmissiveRadiance += uGlowC * uGlow * ' + (+o.glow).toFixed(2) + ';';
   if (o.tr) em += '\n totalEmissiveRadiance += uTrC * uTrance * ' + (+o.tr).toFixed(2) + ';';
   if (em) fs = fs.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>' + em);
   sh.vertexShader = vs; sh.fragmentShader = fs;
  };
  m.customProgramCacheKey = () => key;
  return m;
 }
 const std = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: .8, metalness: 0, skinning: true }, o));
 const phys = (o) => new THREE.MeshPhysicalMaterial(Object.assign({ roughness: .8, metalness: 0, skinning: true }, o));
 const nv2 = (k) => new THREE.Vector2(k, k);
 const METAL = LIN ? 1 : .4;                           // the game's plain renderer has no night to reflect: less metal there
 const ADD = { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false };
 // the trance's starlight (the game model's map, painted at twice the size, from the same stream)
 hs = SEED.starmap;
 const STARMAP = tex((() => {
  const S = 512, k = 2, c = cvs(S, S), g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, S);
  gr.addColorStop(0, '#2a3c86'); gr.addColorStop(0.5, '#1b2660'); gr.addColorStop(1, '#2c2470'); g.fillStyle = gr; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 900; i++) { const b = 150 + hr() * 105; g.fillStyle = 'rgba(' + (b | 0) + ',' + ((b * 0.96) | 0) + ',255,' + (0.35 + hr() * 0.65).toFixed(2) + ')'; const s = (hr() < 0.85 ? 1 : 2) * k; g.fillRect(hr() * S, hr() * S, s, s); }
  g.fillStyle = '#ffffff'; for (let i = 0; i < 26; i++) { const x = hr() * S, y = hr() * S, r = (2 + hr() * 4) * k; for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) star4(g, x + dx, y + dy, r); }
  return c;
 })(), 1, 1, true);
 const M = {
  face: patch(std({ map: FACE.map, normalMap: FACE.normal, normalScale: nv2(.08), roughness: .5 }), { skin: 1, rim: .5, glow: 1 }),
  skin: patch(std({ color: C('#f0b894'), normalMap: SKIN, normalScale: nv2(.22), roughness: .55 }), { skin: 1, rim: .5, glow: 1 }),
  lid: patch(std({ color: C('#f0b894'), roughness: .5 }), { skin: 1, glow: 1 }),
  skinShade: patch(std({ color: C('#eaa585'), normalMap: SKIN, normalScale: nv2(.2), roughness: .6 }), { skin: 1, rim: .5, glow: 1 }),
  lip: patch(phys({ color: C('#c85a6e'), roughness: .34, clearcoat: .6, clearcoatRoughness: .22 }), { skin: .6, glow: 1 }),
  nail: patch(phys({ color: C('#4a1850'), roughness: .22, clearcoat: 1, clearcoatRoughness: .06 }), { glow: 1 }),
  hair: patch(std({ vertexColors: true, roughness: .7, envMapIntensity: .15 }), { hair: 1, glow: 1, tr: .45 }),
  lash: patch(std({ vertexColors: true, roughness: .55, envMapIntensity: .4 }), { glow: 1 }),
  scrunchie: patch(phys({ color: C('#7d2e9a'), roughness: .72, sheen: CR(.62, .4, .8), normalMap: CRUSH, normalScale: nv2(.9) }), { rim: .6, glow: 1 }),
  coat: patch(phys({ map: COATV.map, normalMap: COATV.normal, normalScale: nv2(.6), roughnessMap: COATV.rm, metalnessMap: COATV.rm, roughness: 1, metalness: METAL, sheen: CR(.34, .14, .26), envMapIntensity: .35 }), { star: 1, rim: 1, glow: 1 }),
  lining: patch(phys({ color: C('#4a1334'), roughness: .42, sheen: CR(.4, .2, .34), side: THREE.BackSide }), { glow: 1 }),
  trim: patch(phys({ map: TRIM.map, normalMap: TRIM.normal, normalScale: nv2(1), roughnessMap: TRIM.rm, metalnessMap: TRIM.rm, roughness: 1, metalness: METAL, emissive: C('#2a0a18').multiplyScalar(.5) }), { rim: .6, glow: 1 }),
  gold: patch(phys({ color: C('#efbd5c'), metalness: METAL, roughness: .24, clearcoat: .4, clearcoatRoughness: .1, emissive: C('#3a2206').multiplyScalar(.35) }), { glow: 1 }),
  silver: patch(phys({ color: C('#dddbe4'), metalness: METAL, roughness: .2, clearcoat: .3, emissive: C('#1c1c22').multiplyScalar(.4) }), { glow: 1 }),
  blade: patch(phys({ map: BLADE.map, normalMap: BLADE.normal, normalScale: nv2(.7), roughnessMap: BLADE.rm, metalnessMap: BLADE.rm, metalness: METAL, roughness: 1, envMapIntensity: 1.3 }), { glow: 1 }),
  handle: patch(phys({ map: LEATHER.map, color: CR(.62, .6, .62), normalMap: LEATHER.normal, normalScale: nv2(.8), roughness: .62 }), { glow: 1 }),
  boot: patch(phys({ map: LEATHER.map, normalMap: LEATHER.normal, normalScale: nv2(.55), roughnessMap: LEATHER.rm, roughness: 1, clearcoat: .28, clearcoatRoughness: .38 }), { rim: .7, glow: 1 }),
  bootDark: patch(phys({ map: LEATHER.map, color: CR(.62, .56, .58), normalMap: LEATHER.normal, normalScale: nv2(.6), roughness: .66, clearcoat: .15 }), { rim: .5, glow: 1 }),
  dress: patch(phys({ map: DRESS.map, emissiveMap: DRESS.emis, emissive: CR(.12, .12, .12), normalMap: DRESS.normal, normalScale: nv2(.7), roughness: .6, sheen: CR(.22, .16, .22), side: THREE.DoubleSide }), { glit: 260, rim: .8, glow: 1 }),
  bodice: patch(std({ map: NET.map, normalMap: NET.normal, normalScale: nv2(1), roughness: .78 }), { rim: .3, glow: 1 }),
  sash: patch(phys({ map: SASH.map, emissiveMap: SASH.emis, emissive: CR(.2, .2, .2), normalMap: SASH.normal, normalScale: nv2(.5), roughness: .4, sheen: CR(.62, .6, .68), side: THREE.DoubleSide }), { glit: 300, rim: .6, glow: 1 }),
  hat: patch(phys({ map: HATV.map, normalMap: HATV.normal, normalScale: nv2(.6), roughnessMap: HATV.rm, metalnessMap: HATV.rm, roughness: 1, metalness: METAL, sheen: CR(.32, .13, .24), side: THREE.DoubleSide, envMapIntensity: .35 }), { rim: 1, glow: 1 }),
  hatBand: patch(phys({ map: BAND.map, emissiveMap: BAND.emis, emissive: CR(.12, .12, .12), normalMap: BAND.normal, normalScale: nv2(.6), roughness: .9, sheen: CR(.4, .3, .26) }), { fur: 1, rim: .5, glow: 1 }),
  horn: patch(phys({ map: HORN.map, normalMap: HORN.normal, normalScale: nv2(.8), vertexColors: true, roughness: .36, clearcoat: .45, clearcoatRoughness: .28 }), { rim: .6, glow: 1 }),
  cord: patch(std({ color: C('#151015'), roughness: .62, normalMap: CRUSH, normalScale: nv2(.4) }), { glow: 1 }),
  eyeW: patch(phys({ color: 0xffffff, vertexColors: true, roughness: .28, clearcoat: .8, clearcoatRoughness: .1, emissive: C('#3c3c40') }), { glow: 1 }),
  iris: patch(phys({ map: IRIS, emissiveMap: IRIS, emissive: C('#5a5a5a'), roughness: .3, clearcoat: 1, clearcoatRoughness: .05 }), { glow: 1, tr: .8 }),
  shine: new THREE.MeshBasicMaterial({ color: 0xffffff }),
  frame: patch(phys({ color: C('#141014'), roughness: .24, metalness: .6 * METAL, clearcoat: .8, clearcoatRoughness: .12 }), { glow: 1 }),
  // glass that only adds what it reflects (so it never darkens her eyes), and a breath of tint
  lens: new THREE.MeshPhysicalMaterial(Object.assign({ color: 0x000000, roughness: .04, metalness: 0, clearcoat: 1, clearcoatRoughness: .02, envMapIntensity: 1.1 }, ADD)),
  lensTint: new THREE.MeshStandardMaterial({ color: C('#dfe8ff'), roughness: .05, transparent: true, opacity: .07, depthWrite: false }),
  cornea: new THREE.MeshPhysicalMaterial(Object.assign({ color: 0x000000, roughness: .02, metalness: 0, clearcoat: 1, clearcoatRoughness: .02, envMapIntensity: .9 }, ADD))
 };
 for (const k in M) M[k].name = k;
 const LINING = [{ m: M.lining, c: M.lining.color.clone() }];
 const INDIGO = C('#1c2660');

 // ---------- skeleton: the game model's 51 bones, where they were ----------
 const root = new THREE.Group(); root.name = 'Io';
 const bones = [], BI = {};
 function bone(name, parent, x, y, z) {
  const b = new THREE.Bone(); b.name = name; b.position.set(x, y, z); parent.add(b);
  BI[name] = bones.length; bones.push(b); return b;
 }
 const pelvis = bone('pelvis', root, 0, 0.86, 0);
 const spine = bone('spine', pelvis, 0, 0.12, 0);
 const chest = bone('chest', spine, 0, 0.14, 0);
 const neck = bone('neck', chest, 0, 0.16, 0); neck.rotation.order = 'YXZ';
 const headB = bone('head', neck, 0, 0.10, 0); headB.rotation.order = 'YXZ';
 const legs = [], knees = [], ankles = [], arms = [], elbows = [], wrists = [];
 for (const sd of [-1, 1]) {
  const h = bone('hip' + sd, pelvis, 0.075 * sd, -0.07, 0), k = bone('knee' + sd, h, 0, -0.36, 0), a = bone('ankle' + sd, k, 0, -0.34, 0);
  legs.push(h); knees.push(k); ankles.push(a);
  const s = bone('shoulder' + sd, chest, 0.155 * sd, 0.075, 0), e = bone('elbow' + sd, s, 0, -0.235, 0), w = bone('wrist' + sd, e, 0, -0.215, 0);
  arms.push(s); elbows.push(e); wrists.push(w);
 }
 const SK = 8, skirt = [];
 for (let k = 0; k < SK; k++) {
  const a = k / SK * TAU, b = bone('skirt' + k, pelvis, 0.12 * Math.sin(a), 0.02, 0.12 * Math.cos(a) * 0.9);
  b.rotation.order = 'YXZ'; b.rotation.y = a; skirt.push(b);
 }
 const CK = 8, coatU = [], coatL = [];
 for (let k = 0; k < CK; k++) {
  const a = (k + 0.5) / CK * TAU, u = bone('coatU' + k, pelvis, 0.2 * Math.sin(a), 0.06, 0.2 * Math.cos(a) * 0.88);
  u.rotation.order = 'YXZ'; u.rotation.y = a;
  const l = bone('coatL' + k, u, 0, -0.3, 0.035); l.rotation.order = 'YXZ';
  coatU.push(u); coatL.push(l);
 }
 const hairA = bone('hairA', headB, 0, -0.085, -0.14), hairB = bone('hairB', hairA, 0, -0.17, -0.03), hairC = bone('hairC', hairB, 0, -0.17, -0.005);
 const sideL1 = bone('sideL1', headB, 0.125, -0.02, 0.05), sideL2 = bone('sideL2', sideL1, 0.005, -0.1, 0.005);
 const sideR1 = bone('sideR1', headB, -0.125, -0.02, 0.05), sideR2 = bone('sideR2', sideR1, -0.005, -0.1, 0.005);
 const hatB = bone('hat', headB, 0.0, 0.1, -0.012); hatB.rotation.set(-0.2, 0, 0.07);
 const hatA1 = bone('hatA', hatB, 0, 0.25, -0.02), hatA2 = bone('hatB', hatA1, -0.035, 0.1, -0.035);
 root.updateMatrixWorld(true);
 const bw = (b) => { const v = new THREE.Vector3(); b.getWorldPosition(v); return [v.x, v.y, v.z]; };

 // ---------- skin weights: the game model's, by where a point is in the bind pose ----------
 const ring = (x, z, zs, n, off) => ((((Math.atan2(x, z / zs) / TAU) * n - (off || 0)) % n) + n) % n;
 function wTorso(x, y) {
  if (y >= 1.1) { const t = sm(1.1, 1.16, y); return [[BI.spine, 1 - t], [BI.chest, t]]; }
  if (y >= 0.95) { const t = sm(0.95, 1.1, y); return [[BI.pelvis, 1 - t], [BI.spine, t]]; }
  return [[BI.pelvis, 1]];
 }
 function wSkirt(x, y, z) {
  if (y >= 0.9) return wTorso(x, y, z);
  const s = sm(0.9, 0.6, y);
  const f = ring(x, z, 0.9, SK), k0 = Math.floor(f) % SK, fr = f - Math.floor(f);
  return [[BI.pelvis, 1 - s], [BI['skirt' + k0], s * (1 - fr)], [BI['skirt' + ((k0 + 1) % SK)], s * fr]];
 }
 function wCoat(x, y, z) {
  if (y >= 1.0) { const t = sm(1.0, 1.12, y); return [[BI.spine, 1 - t], [BI.chest, t]]; }
  if (y >= 0.93) { const t = sm(0.93, 1.0, y); return [[BI.pelvis, 1 - t], [BI.spine, t]]; }
  const s1 = sm(0.93, 0.74, y), s2 = sm(0.68, 0.42, y);
  const f = ring(x, z, 0.88, CK, 0.5), k0 = Math.floor(f) % CK, k1 = (k0 + 1) % CK, fr = f - Math.floor(f);
  return [[BI.pelvis, 1 - s1], [BI['coatU' + k0], s1 * (1 - s2) * (1 - fr)], [BI['coatU' + k1], s1 * (1 - s2) * fr], [BI['coatL' + k0], s1 * s2 * (1 - fr)], [BI['coatL' + k1], s1 * s2 * fr]];
 }
 function wLeg(x, y) {
  const sd = x < 0 ? -1 : 1, H = BI['hip' + sd], K = BI['knee' + sd];
  if (y >= 0.48) return [[H, 1]];
  const t = sm(0.48, 0.4, y); return [[H, 1 - t], [K, t]];
 }
 function wArm(x, y) {
  const sd = x < 0 ? -1 : 1, S = BI['shoulder' + sd], E = BI['elbow' + sd];
  if (y > 1.16) { const c = sm(1.16, 1.25, y) * 0.55; return [[S, 1 - c], [BI.chest, c]]; }
  if (y > 1.0) return [[S, 1]];
  if (y > 0.93) { const t = sm(1.0, 0.93, y); return [[S, 1 - t], [E, t]]; }
  return [[E, 1]];
 }
 function wHair(x, y, z) {
  if (z < -0.06 || Math.abs(x) < 0.1) {
   if (y > 1.33) return [[BI.head, 1]];
   if (y > 1.22) { const t = sm(1.33, 1.22, y); return [[BI.head, 1 - t], [BI.hairA, t]]; }
   if (y > 1.08) { const t = sm(1.2, 1.08, y); return [[BI.hairA, 1 - t], [BI.hairB, t]]; }
   const t = sm(1.02, 0.9, y); return [[BI.hairB, 1 - t], [BI.hairC, t]];
  }
  const L = x > 0, S1 = BI[L ? 'sideL1' : 'sideR1'], S2 = BI[L ? 'sideL2' : 'sideR2'];
  if (y > 1.36) return [[BI.head, 1]];
  if (y > 1.3) { const t = sm(1.36, 1.3, y); return [[BI.head, 1 - t], [S1, t]]; }
  const t = sm(1.26, 1.16, y); return [[S1, 1 - t], [S2, t]];
 }

 // ---------- geometry helpers ----------
 const dummy = new THREE.Object3D(), _nm = new THREE.Matrix3();
 // a geometry moved by a matrix, with its hair directions (aHT) turned too
 function xform(g, m) {
  g.applyMatrix4(m);
  const t = g.attributes.aHT;
  if (t) { for (let i = 0; i < t.count; i++) { _v.set(t.getX(i), t.getY(i), t.getZ(i)).transformDirection(m); t.setXYZ(i, _v.x, _v.y, _v.z); } t.needsUpdate = true; }
  return g;
 }
 const _v = new THREE.Vector3();
 // a copy of geo placed by position, rotation (or quaternion) and scale, as every part adds its pieces
 function place(geo, p, rot, sc, quat) {
  dummy.position.set(p ? p[0] : 0, p ? p[1] : 0, p ? p[2] : 0);
  if (quat) dummy.quaternion.copy(quat); else dummy.rotation.set(rot ? rot[0] : 0, rot ? rot[1] : 0, rot ? rot[2] : 0);
  if (sc === null || sc === undefined) dummy.scale.set(1, 1, 1);
  else if (typeof sc === 'number') dummy.scale.set(sc, sc, sc);
  else dummy.scale.set(sc[0], sc[1], sc[2]);
  dummy.updateMatrix();
  return xform(geo.clone(), dummy.matrix);
 }
 // merges geometries into one indexed geometry with every attribute any of them has; one that lacks an attribute gets
 // white for colour, straight up for a hair direction, nothing for the rest
 const DEF = { color: [1, 1, 1], aHT: [0, 1, 0] };
 function merge(list) {
  let nv = 0, ni = 0; const keys = new Map();
  for (const g of list) {
   nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count;
   for (const k of Object.keys(g.attributes)) if (!keys.has(k)) { const a = g.attributes[k]; keys.set(k, { size: a.itemSize, T: a.array.constructor }); }
  }
  const out = new THREE.BufferGeometry();
  for (const [k, { size, T }] of keys) {
   const A = new T(nv * size), d = DEF[k];
   let o = 0;
   for (const g of list) {
    const a = g.attributes[k], c = g.attributes.position.count;
    if (a) A.set(a.array.length === c * size ? a.array : a.array.subarray(0, c * size), o);
    else if (d) for (let i = 0; i < c; i++) for (let s = 0; s < size; s++) A[o + i * size + s] = d[s];
    o += c * size;
   }
   out.setAttribute(k, new THREE.BufferAttribute(A, size));
  }
  const I = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
  let vo = 0, io = 0;
  for (const g of list) {
   const c = g.attributes.position.count;
   if (g.index) { const a = g.index.array; for (let k = 0; k < a.length; k++) I[io + k] = a[k] + vo; io += a.length; }
   else { for (let k = 0; k < c; k++) I[io + k] = vo + k; io += c; }
   vo += c;
  }
  out.setIndex(new THREE.BufferAttribute(I, 1));
  out.computeBoundingSphere();
  return out;
 }
 function weights(geo, fn) {
  const pos = geo.attributes.position, n = pos.count, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
   let inf = fn(pos.getX(i), pos.getY(i), pos.getZ(i)).filter((e) => e[1] > 1e-4).sort((a, b) => b[1] - a[1]).slice(0, 4);
   if (!inf.length) inf = [[0, 1]];
   let tot = 0; for (const e of inf) tot += e[1];
   inf.forEach((e, k) => { si[i * 4 + k] = e[0]; sw[i * 4 + k] = e[1] / tot; });
  }
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
  geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
 }
 // ---------- pooling: one skinned mesh per material (built at bind) ----------
 // Skinned parts pool their geometry by material. A rigid part riding on a bone, directly or through a group that never
 // moves relative to it (STATIC), pools too: it is skinned to that bone with full weight, so it moves exactly as if it
 // were parented to it. Only see-through materials stay meshes of their own.
 const POOL = new Map(), STATIC = new Set();
 // three.js r128 compiles a material once, skinned or not, for every object that uses it: a part that is not skinned
 // (lids, lashes, the dagger's charm) gets its own copy of a material the skinned body also uses, as the game model does
 const plainCache = new Map();
 function plain(m) {
  if (!m.skinning) return m;
  let c = plainCache.get(m);
  if (!c) { c = m.clone(); c.skinning = false; c.onBeforeCompile = m.onBeforeCompile; c.customProgramCacheKey = m.customProgramCacheKey; c.name = m.name; plainCache.set(m, c); }
  return c;
 }
 function boneOf(p) { while (p && !p.isBone) { if (!STATIC.has(p)) return null; p = p.parent; } return p || null; }
 function poolAdd(mat, geo, rigid) { let list = POOL.get(mat); if (!list) POOL.set(mat, (list = [])); list.push({ geo, rigid }); }
 function part(wfn) {
  const buckets = new Map();
  return {
   add(geo, mat, p, rot, sc, quat) { const g = place(geo, p, rot, sc, quat); let list = buckets.get(mat); if (!list) buckets.set(mat, (list = [])); list.push(g); return this; },
   addWorld(geo, mat) { let list = buckets.get(mat); if (!list) buckets.set(mat, (list = [])); list.push(geo); return this; },
   build(parent, off) {
    const out = [], bone = wfn ? null : boneOf(parent);
    for (const [mat, list] of buckets) {
     const geo = merge(list);
     if (wfn) { weights(geo, wfn); poolAdd(mat, geo, null); continue; }
     if (bone && !mat.transparent) { poolAdd(mat, geo, { parent, off, bone }); continue; }
     const m = new THREE.Mesh(geo, plain(mat));
     if (off) m.position.set(-off[0], -off[1], -off[2]);
     if (mat.transparent) m.renderOrder = 2;
     parent.add(m); out.push(m);
    }
    return out;
   }
  };
 }
 const _q = new THREE.Quaternion(), _d = new THREE.Vector3(), YA = new THREE.Vector3(0, 1, 0), ZA = new THREE.Vector3(0, 0, 1);
 function seg(P, mat, a, b, r0, r1, rs, caps) {
  _d.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const L = _d.length(); _d.multiplyScalar(1 / L);
  _q.setFromUnitVectors(YA, _d);
  P.add(new THREE.CylinderGeometry(r1, r0, L, rs, 1, !!caps), mat, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], null, null, _q);
  if (caps) {
   P.add(new THREE.SphereGeometry(r0, rs, Math.max(6, rs >> 1)), mat, a);
   P.add(new THREE.SphereGeometry(r1, rs, Math.max(6, rs >> 1)), mat, b);
  }
 }
 // a profile made smooth: n points between each pair, passing through every one of them
 function smoothP(prof, n) {
  if (n <= 1) return prof;
  const cv = new THREE.SplineCurve(prof.map((p) => new THREE.Vector2(p[0], p[1])));
  return cv.getPoints((prof.length - 1) * n).map((p) => [p.x, p.y]);
 }
 function lathe(profile, segs, disp, zs, phiStart, phiLen, xs) {
  const full = phiLen === undefined, np = profile.length;
  const g = new THREE.LatheGeometry(profile.map((p) => new THREE.Vector2(p[0], p[1])), segs, full ? Math.PI : phiStart, full ? TAU : phiLen);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
   let x = pos.getX(i), z = pos.getZ(i);
   const y = pos.getY(i), r = Math.hypot(x, z);
   if (disp && r > 1e-6) { const k = disp(r, y, Math.atan2(x, z)) / r; x *= k; z *= k; }
   pos.setXYZ(i, x * (xs || 1), y, z * (zs || 1));
  }
  g.computeVertexNormals();
  if (full) {
   const n = g.attributes.normal;
   for (let j = 0; j < np; j++) {
    const a = j, b = segs * np + j;
    const x = n.getX(a) + n.getX(b), y = n.getY(a) + n.getY(b), z = n.getZ(a) + n.getZ(b), l = Math.hypot(x, y, z) || 1;
    n.setXYZ(a, x / l, y / l, z / l); n.setXYZ(b, x / l, y / l, z / l);
   }
  }
  return g;
 }
 function sheet(nu, nv, fn, uvRot) {
  const P = new Float32Array((nu + 1) * (nv + 1) * 3), Uv = new Float32Array((nu + 1) * (nv + 1) * 2), idx = [], o = [0, 0, 0];
  let k = 0;
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
   const u = i / nu, v = j / nv; fn(u, v, o);
   P[k * 3] = o[0]; P[k * 3 + 1] = o[1]; P[k * 3 + 2] = o[2];
   if (uvRot) { Uv[k * 2] = v; Uv[k * 2 + 1] = u; } else { Uv[k * 2] = u; Uv[k * 2 + 1] = 1 - v; }
   k++;
  }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
   const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
   idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(Uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
 }
 // uv scaled, as the game model's texture repeats were
 const uvs = (g, sx, sy) => { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * sx, uv.getY(i) * sy); return g; };
 // a colour per vertex from its position (light tints and shade in the creases, linear)
 function vcol(g, fn) {
  const p = g.attributes.position, n = p.count, a = new Float32Array(n * 3), o = [1, 1, 1];
  for (let i = 0; i < n; i++) { o[0] = o[1] = o[2] = 1; fn(p.getX(i), p.getY(i), p.getZ(i), o, i); a[i * 3] = o[0]; a[i * 3 + 1] = o[1]; a[i * 3 + 2] = o[2]; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g;
 }
 // a tube along a curve whose cross-section can be flattened against a surface (locks, the hat's crown, horns, fingers).
 // It carries its direction along the curve (aHT), for hair.
 const _c = new THREE.Vector3(), _t = new THREE.Vector3(), _o = new THREE.Vector3(), _w = new THREE.Vector3(), _vv = new THREE.Vector3();
 function strand(pts, TSg, RS, rFn, flat, centerFn) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
  const g = new THREE.TubeGeometry(curve, TSg, 1, RS, false);
  const pos = g.attributes.position, ht = new Float32Array(pos.count * 3);
  for (let i = 0; i <= TSg; i++) {
   const t = i / TSg; curve.getPointAt(t, _c); curve.getTangentAt(t, _t);
   const cen = centerFn ? centerFn(_c) : null;
   if (cen) { _o.subVectors(_c, cen); _o.addScaledVector(_t, -_o.dot(_t)); }
   if (!cen || _o.lengthSq() < 1e-10) _o.copy(g.normals[i]);
   _o.normalize(); _w.crossVectors(_t, _o).normalize();
   const r = rFn(t);
   for (let j = 0; j <= RS; j++) {
    const idx = i * (RS + 1) + j;
    _vv.fromBufferAttribute(pos, idx).sub(_c);
    const a = _vv.dot(_o), b = _vv.dot(_w);
    _vv.copy(_c).addScaledVector(_o, a * r * flat).addScaledVector(_w, b * r);
    pos.setXYZ(idx, _vv.x, _vv.y, _vv.z);
    ht[idx * 3] = _t.x; ht[idx * 3 + 1] = _t.y; ht[idx * 3 + 2] = _t.z;
   }
  }
  g.setAttribute('aHT', new THREE.BufferAttribute(ht, 3));
  g.computeVertexNormals();
  return g;
 }
 // Fine strands through a lock: K thin tubes of RS sides along the lock's centre line, each placed somewhere in the lock's
 // section (most of them near its surface, where they show), wandering a little, tapering, some ending early, each a
 // slightly different shade and darker toward the root and the lock's inside. Returns one geometry with position, normal,
 // uv (x along the strand, y the strand's number), color and aHT (the direction along it).
 let strandId = 0;
 const _fr = { P: [], T: [], O: [], W: [] };
 function lockStrands(pts, K, N, RS, rFn, flat, cenFn, col, o) {
  o = o || {};
  const lean = o.lean === undefined ? .7 : o.lean, thick = o.thick || .00058, jit = o.jitter === undefined ? .35 : o.jitter, inner = o.inner === undefined ? .3 : o.inner;
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
  const fr = curve.computeFrenetFrames(N, false), F = _fr;
  for (let i = 0; i <= N; i++) {
   const t = i / N, P = F.P[i] || (F.P[i] = V3()), T = F.T[i] || (F.T[i] = V3()), O = F.O[i] || (F.O[i] = V3()), W = F.W[i] || (F.W[i] = V3());
   curve.getPointAt(t, P); curve.getTangentAt(t, T);
   const cen = cenFn ? cenFn(P) : null;
   if (cen) { O.subVectors(P, cen); O.addScaledVector(T, -O.dot(T)); }
   if (!cen || O.lengthSq() < 1e-10) O.copy(fr.normals[i]);
   O.normalize(); W.crossVectors(T, O).normalize();
  }
  const nv = K * (N + 1) * RS, pos = new Float32Array(nv * 3), nrm = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), cc = new Float32Array(nv * 3), ht = new Float32Array(nv * 3);
  const idx = new Uint32Array(K * N * RS * 6);
  let v = 0, ii = 0;
  for (let k = 0; k < K; k++) {
   const ang = r2() * TAU, rad = Math.min(1.08, (1 - inner) + inner * Math.sqrt(r2()) + .08 * r2()), a = Math.cos(ang) * rad, b = Math.sin(ang) * rad;
   const ph1 = r2() * TAU, ph2 = r2() * TAU, f1 = 3 + r2() * 6, f2 = 4 + r2() * 7, tip = 1 - Math.pow(r2(), 2) * (o.short || .22), sh = .82 + r2() * .34, rot = r2() * TAU;
   const id = (strandId++ % 4096) / 4096 + .5 / 4096, th = thick * (.7 + r2() * .6);
   const v0 = v;
   for (let i = 0; i <= N; i++) {
    const t = i / N, P = F.P[i], T = F.T[i], O = F.O[i], W = F.W[i], R = rFn(t);
    const wo = jit * R * Math.sin(f1 * t * PI + ph1) * t, ww = jit * R * Math.sin(f2 * t * PI + ph2) * t;
    const cx = P.x + O.x * (a * R * flat + wo) + W.x * (b * R + ww), cy = P.y + O.y * (a * R * flat + wo) + W.y * (b * R + ww), cz = P.z + O.z * (a * R * flat + wo) + W.z * (b * R + ww);
    const rs = th * (1 - .55 * t) * (1 - sm(tip - .1, tip, t)) + 1e-5;
    const shade = sh * (.5 + .5 * sm(0, .14, t)) * (.6 + .4 * rad) * (1 + .1 * t);
    for (let j = 0; j < RS; j++) {
     const q = j / RS * TAU + rot, cq = Math.cos(q), sq = Math.sin(q);
     const nx = O.x * cq + W.x * sq, ny = O.y * cq + W.y * sq, nz = O.z * cq + W.z * sq;
     pos[v * 3] = cx + nx * rs; pos[v * 3 + 1] = cy + ny * rs; pos[v * 3 + 2] = cz + nz * rs;
     const mx = nx * lean + O.x, my = ny * lean + O.y, mz = nz * lean + O.z, ml = Math.hypot(mx, my, mz) || 1;
     nrm[v * 3] = mx / ml; nrm[v * 3 + 1] = my / ml; nrm[v * 3 + 2] = mz / ml;
     uv[v * 2] = t; uv[v * 2 + 1] = id;
     cc[v * 3] = col.r * shade; cc[v * 3 + 1] = col.g * shade; cc[v * 3 + 2] = col.b * shade;
     ht[v * 3] = T.x; ht[v * 3 + 1] = T.y; ht[v * 3 + 2] = T.z;
     v++;
    }
   }
   for (let i = 0; i < N; i++) for (let j = 0; j < RS; j++) {
    const A = v0 + i * RS + j, B = v0 + i * RS + (j + 1) % RS, Cc = A + RS, D = B + RS;
    idx[ii++] = A; idx[ii++] = B; idx[ii++] = Cc; idx[ii++] = B; idx[ii++] = D; idx[ii++] = Cc;
   }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.BufferAttribute(cc, 3)); g.setAttribute('aHT', new THREE.BufferAttribute(ht, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  return g;
 }
 // a cross outline extruded with a bevel (the gold crosses on her necklace, hat chain and charm): a bar w by h, a crossbar
 // cw by ch whose middle is cy above the bar's, d deep
 function crossGeo(w, h, cw, ch, cy, d, bev) {
  const s = new THREE.Shape(), x = w / 2, y = h / 2, X = cw / 2, Y0 = cy - ch / 2, Y1 = cy + ch / 2;
  s.moveTo(-x, -y); s.lineTo(x, -y); s.lineTo(x, Y0); s.lineTo(X, Y0); s.lineTo(X, Y1); s.lineTo(x, Y1); s.lineTo(x, y); s.lineTo(-x, y);
  s.lineTo(-x, Y1); s.lineTo(-X, Y1); s.lineTo(-X, Y0); s.lineTo(-x, Y0); s.lineTo(-x, -y);
  const g = new THREE.ExtrudeGeometry(s, { depth: d - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev * .8, bevelSegments: 2, curveSegments: 1 });
  g.translate(0, 0, -(d - 2 * bev) / 2); g.computeVertexNormals();
  return g;
 }
 const _e = new THREE.Euler();
 const offE = (c, rot, v) => { _v.set(v[0], v[1], v[2]).applyEuler(_e.set(rot[0], rot[1], rot[2])); return [c[0] + _v.x, c[1] + _v.y, c[2] + _v.z]; };
 const qz = (q, a) => q.clone().multiply(new THREE.Quaternion().setFromAxisAngle(ZA, a));
 const interp = (tab, y) => {
  if (y <= tab[0][1]) return tab[0][0];
  for (let i = 0; i < tab.length - 1; i++) { const a = tab[i], b = tab[i + 1]; if (y <= b[1]) return a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]); }
  return tab[tab.length - 1][0];
 };
 const _bx = new THREE.Vector3(), _by = new THREE.Vector3(), _bz = new THREE.Vector3(), _bm = new THREE.Matrix4();

 // ---------- the body: every part where the game model has it, at its size, drawn finer ----------
 const SMP = DET > .6 ? 4 : 2;                       // points added between each pair of a profile
 const Tp = part(wTorso);
 Tp.add(uvs(lathe(smoothP([[0.118, 1.13], [0.126, 1.16], [0.13, 1.19], [0.12, 1.22], [0.098, 1.25], [0.07, 1.28], [0.05, 1.3]], SMP), Q(96, 24), null, 0.78, undefined, undefined, 1.22), 6, 2), M.skin);
 const bust = (r, y, a) => r + 0.016 * Math.exp(-(((y - 1.085) / 0.035) ** 2)) * Math.max(0, Math.cos(a)) ** 2;
 Tp.add(uvs(lathe(smoothP([[0.112, 0.86], [0.1, 0.9], [0.094, 0.95], [0.1, 1.0], [0.114, 1.04], [0.126, 1.08], [0.128, 1.11], [0.124, 1.14], [0.12, 1.165], [0.104, 1.17]], SMP), Q(144, 32), bust, 0.82, undefined, undefined, 1.05), 10, 5), M.bodice);
 Tp.build(root);

 // the sash: a satin band, a gathered knot and two tails
 const Sk = part(wSkirt);
 Sk.add(uvs(lathe(smoothP([[0.112, 0.876], [0.116, 0.884], [0.116, 0.912], [0.11, 0.921]], 3), Q(128, 24), (r, y, a) => r + .0006 * Math.sin(a * 23), 0.9), 3, 1), M.sash);
 { const k = new THREE.SphereGeometry(1, Q(40, 16), Q(28, 10)), p = k.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), f = 1 + .09 * Math.cos(5 * Math.atan2(y, x)) * (1 - Math.abs(z)); p.setXYZ(i, x * f, y * f, z); } k.computeVertexNormals(); Sk.add(uvs(k, 3, 1), M.sash, [0.012, 0.895, 0.104], null, [0.024, 0.02, 0.016]); }
 for (const s of [-1, 1]) {
  const pts = [[0.012 + 0.006 * s, 0.888, 0.112], [0.02 * s + 0.013, 0.82, 0.148], [0.03 * s + 0.014, 0.75, 0.166]];
  Sk.add(uvs(strand(pts, Q(40, 10), 12, (t) => 0.011 * (1 - 0.3 * t) * (1 + .06 * Math.sin(t * 19)), 0.3, (c) => new THREE.Vector3(0, c.y, 0)), 3, 1), M.sash);
 }
 // the dress: three ruffled tiers, the lower two open at the slit; its ruffles are the game model's, with a fine gathering
 const ruff = (amp, n, y0, y1) => (r, y, a) => r + amp * sm(y0, y1, y) * (Math.sin(n * a + 0.5) + 0.35 * Math.sin(2 * n * a + 1.3) + .1 * Math.sin(4.7 * n * a + 2.1));
 const SLIT = 0.42, DSEG = Q(256, 60);
 Sk.add(uvs(lathe(smoothP([[0.14, 0.575], [0.212, 0.582], [0.2, 0.64], [0.176, 0.72], [0.148, 0.8], [0.124, 0.86], [0.108, 0.9]], 3), DSEG, ruff(0.012, 12, 0.72, 0.6), 0.9), 5, 3), M.dress);
 Sk.add(uvs(lathe(smoothP([[0.2, 0.3], [0.274, 0.306], [0.262, 0.38], [0.242, 0.48], [0.216, 0.56], [0.19, 0.6], [0.162, 0.645]], 3), DSEG, ruff(0.017, 11, 0.5, 0.32), 0.9, SLIT + 0.17, TAU - 0.34), 5, 3), M.dress);
 Sk.add(uvs(lathe(smoothP([[0.27, 0.05], [0.322, 0.056], [0.312, 0.12], [0.296, 0.22], [0.276, 0.3], [0.255, 0.34], [0.232, 0.372]], 3), DSEG, ruff(0.02, 13, 0.25, 0.07), 0.9, SLIT + 0.24, TAU - 0.48), 5, 3), M.dress);
 Sk.build(root);

 const Lg = part(wLeg);
 for (const sd of [-1, 1]) Lg.add(uvs(lathe(smoothP([[0.052, 0.39], [0.057, 0.44], [0.061, 0.5], [0.068, 0.58], [0.074, 0.66], [0.08, 0.74], [0.084, 0.8], [0.08, 0.86]], SMP), Q(64, 14), null, 0.95), 5, 4), M.skin, [0.075 * sd, 0, 0]);
 Lg.build(root);

 const Ar = part(wArm);
 for (const sd of [-1, 1]) Ar.add(uvs(lathe(smoothP([[0.027, 0.735], [0.029, 0.76], [0.033, 0.82], [0.036, 0.88], [0.037, 0.94], [0.035, 0.965], [0.039, 1.0], [0.043, 1.08], [0.045, 1.15], [0.044, 1.2], [0.034, 1.235], [0.0, 1.248]], SMP), Q(48, 12), null, 0.92), 4, 4), M.skin, [0.155 * sd, 0, 0]);
 Ar.build(root);

 // ---------- the coat: open front, handkerchief-point hem, the game model's folds; velvet outside, satin lining inside,
 // a thickness between them, its gold-braid trim, and gold piping round every edge ----------
 const CT = smoothP([[0.38, 0.26], [0.335, 0.42], [0.265, 0.6], [0.205, 0.76], [0.168, 0.88], [0.158, 0.98], [0.162, 1.1], [0.176, 1.18], [0.19, 1.225], [0.152, 1.265], [0.105, 1.295]], 24);
 const aOpen = (v) => 0.5 + 0.34 * v;
 const hemY = (a) => 0.35 - 0.08 * Math.max(0, Math.cos(7 * (a - Math.PI))) ** 2 - 0.045 * Math.max(0, -Math.cos(a));
 function coatPt(u, v, o, off) {
  const ao = aOpen(v), a = ao + u * (TAU - 2 * ao);
  const y = v < 0.08 ? lerp(1.295, 1.215, v / 0.08) : lerp(1.215, hemY(a), (v - 0.08) / 0.92);
  const lo = sm(0.95, 0.32, y);
  const r = interp(CT, y) + lo * (0.026 * Math.sin(9 * a + 0.7) + 0.01 * Math.sin(17 * a + 2.1) + .0032 * Math.sin(31 * a + .4)) + (off || 0);
  const top = sm(1.14, 1.22, y), mid = sm(0.95, 1.05, y) * (1 - top);
  const xs = 1 + 0.12 * top - 0.05 * mid, zs = 0.9 - 0.18 * sm(1.12, 1.22, y);
  o[0] = r * Math.sin(a) * xs; o[1] = y; o[2] = r * Math.cos(a) * zs;
 }
 // a gold cord along a line of points, closing round if asked
 const piping = (pts, r, closed, n) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => V3(p[0], p[1], p[2])), !!closed), n, r, Q(8, 5), !!closed);
 const Co = part(wCoat);
 const CNU = Q(320, 64), CNV = Q(110, 22), _o3 = [0, 0, 0];
 Co.addWorld(uvs(sheet(CNU, CNV, (u, v, o) => coatPt(u, v, o, 0)), 5, 3), M.coat);
 Co.addWorld(uvs(sheet(CNU, CNV, (u, v, o) => coatPt(u, v, o, -0.0026)), 5, 3), M.lining);
 Co.addWorld(uvs(sheet(CNU, 2, (u, v, o) => coatPt(u, 0.968 + v * 0.032, o, 0.003)), 40, 1), M.trim);
 Co.addWorld(uvs(sheet(2, CNV, (u, v, o) => coatPt(u * 0.012, v, o, 0.003), true), 10, 1), M.trim);
 Co.addWorld(uvs(sheet(2, CNV, (u, v, o) => coatPt(0.988 + u * 0.012, v, o, 0.003), true), 10, 1), M.trim);
 Co.addWorld(uvs(sheet(CNU, 2, (u, v, o) => coatPt(u, v * 0.03, o, 0.003)), 10, 1), M.trim);
 {
  const edge = [], n = 90;
  for (let i = 0; i <= n; i++) { coatPt(0, i / n, _o3, -0.0012); edge.push(_o3.slice()); }
  for (let i = 1; i <= 160; i++) { coatPt(i / 160, 1, _o3, -0.0012); edge.push(_o3.slice()); }
  for (let i = n - 1; i >= 0; i--) { coatPt(1, i / n, _o3, -0.0012); edge.push(_o3.slice()); }
  Co.addWorld(piping(edge, .0024, false, Q(900, 200)), M.gold);
 }
 Co.build(root);

 function sleevePt(sd) {
  return (u, v, o, off) => {
   const a = u * TAU;
   const yEnd = 0.87 - 0.11 * Math.pow(Math.max(0, -Math.cos(a)), 1.5);
   const y = lerp(1.24, yEnd, v);
   let r = lerp(0.062, 0.078, sm(0, 0.35, v)) + 0.066 * sm(0.4, 1.0, v) ** 2 + 0.012 * sm(0.6, 1, v) * Math.sin(7 * a + sd) + .0025 * sm(.3, 1, v) * Math.sin(17 * a + 2 * sd);
   r = r * lerp(0.4, 1, sm(0, 0.12, v)) + (off || 0);
   o[0] = 0.155 * sd + r * Math.sin(a); o[1] = y; o[2] = r * Math.cos(a);
  };
 }
 const Sl = part(wArm);
 for (const sd of [-1, 1]) {
  const f = sleevePt(sd), NU = Q(120, 24), NV = Q(56, 10);
  Sl.addWorld(uvs(sheet(NU, NV, (u, v, o) => f(u, v, o, 0)), 2, 1.5), M.coat);
  Sl.addWorld(uvs(sheet(NU, NV, (u, v, o) => f(u, v, o, -0.0022)), 2, 1.5), M.lining);
  Sl.addWorld(uvs(sheet(NU, 2, (u, v, o) => f(u, 0.955 + v * 0.045, o, 0.003)), 10, 1), M.trim);
  const cuff = []; for (let i = 0; i < 120; i++) { f(i / 120, 1, _o3, -0.001); cuff.push(_o3.slice()); }
  Sl.addWorld(piping(cuff, .0022, true, Q(240, 60)), M.gold);
 }
 Sl.build(root);

 // the hood, lying down at the back of the neck, in soft folds
 const chB = bw(chest), Hood = part();
 {
  const g = new THREE.SphereGeometry(1, Q(64, 16), Q(40, 10)), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), f = 1 + .07 * Math.sin(7 * Math.atan2(x, z) + 1) * (1 - Math.abs(y)) + .04 * Math.sin(13 * Math.atan2(x, y)); p.setXYZ(i, x * f, y * f, z * f); }
  g.computeVertexNormals();
  Hood.add(uvs(g, 5, 3), M.coat, [0, 1.175, -0.1], null, [0.13, 0.055, 0.05]);
 }
 Hood.add(uvs(new THREE.TorusGeometry(0.12, 0.006, Q(12, 6), Q(96, 16), Math.PI), 10, 1), M.trim, [0, 1.2, -0.11], [Math.PI / 2 + 0.25, 0, Math.PI], [1, 0.42, 1]);
 Hood.build(chest, chB);

 // ---------- knee-high boots: creased leather, two stitched straps with gold buckles, a rolled top, a crescent anklet ----------
 const BOOTP = [[0.046, -0.345], [0.049, -0.3], [0.052, -0.22], [0.056, -0.12], [0.059, -0.05], [0.066, -0.02], [0.068, -0.004], [0.062, 0.0]];
 for (let i = 0; i < 2; i++) {
  const sd = i === 0 ? -1 : 1;
  const Bs = part();
  Bs.add(uvs(lathe(smoothP(BOOTP, 3), Q(72, 14), (r, y, a) => r + .0005 * sm(-.34, -.3, y) * (1 - sm(-.3, -.22, y)) * Math.sin(a * 9), 0.95), 1.5, 1.2), M.boot);
  Bs.add(new THREE.TorusGeometry(.0625, .0022, Q(8, 5), Q(72, 16)), M.bootDark, [0, -.0008, 0], [Math.PI / 2, 0, 0], [1, .95, 1]);
  for (const y of [-0.27, -0.13]) {
   const R = interp(BOOTP.map((p) => [p[0], p[1]]), y);
   Bs.add(uvs(lathe([[R - .001, y - .0068], [R + .0045, y - .0066], [R + .0058, y - .004], [R + .006, y + .004], [R + .0045, y + .0066], [R - .001, y + .0068]], Q(72, 14), null, 0.95), 3, .2), M.bootDark);
   // the buckle: a gold frame on her outer side with its prong, and the strap's end through it
   const bx = sd * (R + .007);
   for (const [p, s] of [[[0, .0095, 0], [.0028, .0028, .021]], [[0, -.0095, 0], [.0028, .0028, .021]], [[0, 0, .0093], [.0028, .021, .0028]], [[0, 0, -.0093], [.0028, .021, .0028]]]) {
    Bs.add(new THREE.CylinderGeometry(.0014, .0014, Math.max(s[1], s[2]), 8), M.gold, [bx + p[0], y + p[1], .004 + p[2]], s[1] > s[2] ? null : [Math.PI / 2, 0, 0]);
    for (const e of [-1, 1]) if (s[1] > s[2]) Bs.add(new THREE.SphereGeometry(.0016, 8, 6), M.gold, [bx + p[0], y + p[1] + e * .0105, .004 + p[2]]);
   }
   Bs.add(new THREE.CylinderGeometry(.0009, .0009, .018, 6), M.gold, [bx + sd * .0012, y, .004], [Math.PI / 2, 0, 0]);
   Bs.add(new THREE.BoxGeometry(0.009, 0.012, 0.014, 2, 2, 2), M.bootDark, [sd * (R + .009), y, -.012]);
  }
  Bs.build(knees[i]);
  const Ft = part();
  Ft.add(uvs(new THREE.SphereGeometry(1, Q(40, 12), Q(28, 8)), 1, 1), M.boot, [0, -0.036, 0.04], null, [0.047, 0.042, 0.1]);
  Ft.add(uvs(new THREE.SphereGeometry(1, Q(32, 10), Q(24, 8)), 1, 1), M.boot, [0, -0.048, 0.1], null, [0.04, 0.032, 0.05]);
  // the sole, its edge a little proud of the upper, and a block heel
  Ft.add(uvs(lathe([[0, -.5], [.96, -.5], [1, -.38], [1, .38], [.96, .5], [0, .5]], Q(48, 12)), 2, 1), M.bootDark, [0, -0.082, 0.042], null, [0.05, 0.014, 0.115]);
  Ft.add(new THREE.BoxGeometry(0.042, 0.05, 0.04, 3, 4, 3), M.bootDark, [0, -0.07, -0.035]);
  Ft.add(new THREE.TorusGeometry(0.05, 0.0028, Q(10, 5), Q(96, 16)), M.gold, [0, 0.0, 0.002], [Math.PI / 2 - 0.1, 0, 0]);
  Ft.add(new THREE.TorusGeometry(0.009, 0.0026, Q(10, 5), Q(32, 12), Math.PI * 1.3), M.gold, [sd * 0.034, -0.014, 0.037], [0, sd * 0.8, Math.PI * 1.35]);
  Ft.build(ankles[i]);
 }

 // ---------- hands: the game model's slender fingers, each one smooth tube through its joints, lacquered nails ----------
 function finger(P, a, m, b, r0, r1) {
  const g = strand([a, m, b], Q(18, 6), Q(12, 6), (t) => lerp(r0, r1, t) * (1 + .07 * Math.exp(-(((t - .5) / .1) ** 2))), 1, null);
  P.addWorld(uvs(g, 1, 1), M.skin);
  P.add(new THREE.SphereGeometry(r1, Q(12, 6), Q(10, 5)), M.skin, b);
  P.add(new THREE.SphereGeometry(r0, Q(12, 6), Q(10, 5)), M.skin, a);
 }
 function hand(P, sd, cup) {
  P.add(uvs(new THREE.SphereGeometry(1, Q(32, 12), Q(24, 8)), 1, 1), M.skin, [0, -0.028, 0.002], null, [0.016, 0.03, 0.03]);
  const zs = [0.016, 0.005, -0.006, -0.016], L1 = [0.019, 0.021, 0.02, 0.016], L2 = [0.017, 0.019, 0.018, 0.015];
  for (let f = 0; f < 4; f++) {
   const a1 = cup ? 0.35 + f * 0.06 : 1.25 + f * 0.05, a2 = a1 + (cup ? 0.45 : 1.45);
   const b = [-sd * 0.002, -0.054, zs[f]];
   const m = [b[0] - sd * L1[f] * Math.sin(a1), b[1] - L1[f] * Math.cos(a1), b[2]];
   const d2 = [-sd * Math.sin(a2), -Math.cos(a2), 0], tip = [m[0] + d2[0] * L2[f], m[1] + d2[1] * L2[f], m[2]];
   finger(P, b, m, tip, 0.0068, 0.0056);
   const n = [sd * Math.cos(a2), -Math.sin(a2), 0];
   _bz.set(n[0], n[1], n[2]).normalize(); _by.set(-d2[0], -d2[1], -d2[2]).normalize(); _bx.crossVectors(_by, _bz); _bm.makeBasis(_bx, _by, _bz);
   P.add(new THREE.SphereGeometry(1, Q(16, 8), Q(12, 6)), M.nail, [tip[0] - d2[0] * 0.004 + n[0] * 0.005, tip[1] - d2[1] * 0.004 + n[1] * 0.005, tip[2]], null, [0.0048, 0.0065, 0.0018], new THREE.Quaternion().setFromRotationMatrix(_bm));
  }
  const t0 = [-sd * 0.006, -0.02, 0.026];
  const t1 = cup ? [-sd * 0.016, -0.036, 0.04] : [-sd * 0.02, -0.04, 0.03];
  const t2 = cup ? [-sd * 0.024, -0.05, 0.046] : [-sd * 0.024, -0.055, 0.016];
  finger(P, t0, t1, t2, 0.0078, 0.0064);
 }
 for (let i = 0; i < 2; i++) { const P = part(); hand(P, i === 0 ? -1 : 1, i === 1); P.build(wrists[i]); }
 const Br = part();
 [[0.0335, M.silver, 0.0], [0.035, M.cord, 0.012], [0.034, M.silver, 0.022]].forEach((b, k) => Br.add(new THREE.TorusGeometry(b[0], 0.0034, Q(12, 6), Q(72, 22)), b[1], [0, -0.178 - b[2], 0], [Math.PI / 2 + 0.12 * (k - 1), 0, 0.1 * k]));
 Br.build(elbows[1]);

 // ---------- the dagger (her right hand): a wrapped grip with gold rings, a fluted pommel, a ringed guard, and a ridged
 // blade with a fuller, engraved with a crescent and stars ----------
 const dagger = new THREE.Group(); dagger.position.set(0.018, -0.048, 0.004); dagger.rotation.set(-0.25, 0, 0); wrists[0].add(dagger); STATIC.add(dagger);
 const Dg = part();
 {
  const grip = lathe(smoothP([[0.0115, -0.0425], [0.0112, 0], [0.0105, 0.0425]], 12), Q(48, 12), (r, y, a) => r + .0007 * Math.abs(Math.sin(a + y * 230)));
  Dg.add(uvs(grip, 1, 1), M.handle, [0, 0, 0], [Math.PI / 2, 0, 0]);
  const pom = lathe(smoothP([[0, -.013], [.008, -.011], [.0125, -.004], [.013, .002], [.009, .01], [.004, .0125], [0, .013]], 4), Q(48, 12), (r, y, a) => r * (1 + .07 * Math.abs(Math.cos(4 * a))));
  Dg.add(pom, M.gold, [0, 0, -0.05], [Math.PI / 2, 0, 0]);
 }
 for (const z of [-0.03, -0.01, 0.01, 0.03]) Dg.add(new THREE.TorusGeometry(0.0113, 0.0017, Q(8, 4), Q(40, 14)), M.gold, [0, 0, z]);
 Dg.add(new THREE.TorusGeometry(0.019, 0.0042, Q(16, 8), Q(64, 20)), M.gold, [0, 0, 0.049]);
 Dg.add(lathe(smoothP([[.0062, -.035], [.0048, -.02], [.0044, 0], [.0048, .02], [.0062, .035]], 4), Q(20, 8), null, .9), M.gold, [0, 0, 0.049], [0, 0, Math.PI / 2]);
 for (const x of [-0.037, 0.037]) Dg.add(new THREE.SphereGeometry(0.007, Q(24, 8), Q(16, 6)), M.gold, [x, 0, 0.049]);
 {
  // the blade: a section with edges, bevels and a fuller groove down the middle, tapering to its point
  const SEC = [[1, 0], [.84, .3], [.36, .94], [.17, 1], [0, .74], [-.17, 1], [-.36, .94], [-.84, .3], [-1, 0], [-.84, -.3], [-.36, -.94], [-.17, -1], [0, -.74], [.17, -1], [.36, -.94], [.84, -.3], [1, 0]];
  const NL = Q(48, 10), ns = SEC.length, P = new Float32Array((NL + 1) * ns * 3), UVb = new Float32Array((NL + 1) * ns * 2), idx = [];
  for (let i = 0; i <= NL; i++) {
   const t = i / NL, w = 0.02 * (1 - t) * (1 + .14 * Math.sin(PI * t)), h = 0.0036 * (1 - t) * (1 + .1 * Math.sin(PI * t)), z = 0.056 + t * 0.19;
   for (let j = 0; j < ns; j++) { const k = i * ns + j; P[k * 3] = SEC[j][0] * w; P[k * 3 + 1] = SEC[j][1] * h; P[k * 3 + 2] = z; UVb[k * 2] = t * .92 + .04; UVb[k * 2 + 1] = SEC[j][0] * .5 + .5; }
  }
  for (let i = 0; i < NL; i++) for (let j = 0; j < ns - 1; j++) { const a = i * ns + j, b = a + 1, c = a + ns, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.BufferAttribute(UVb, 2)); g.setIndex(idx); g.computeVertexNormals();
  Dg.addWorld(g, M.blade);
 }
 Dg.build(dagger);
 const charm = new THREE.Group(); charm.position.set(0, 0, -0.058); dagger.add(charm);
 const Ch = part();
 for (let k = 0; k < 3; k++) Ch.add(new THREE.TorusGeometry(0.005, 0.0013, Q(8, 4), Q(20, 8)), M.gold, [0, -0.006 - k * 0.009, 0], [0, k % 2 ? Math.PI / 2 : 0, 0]);
 Ch.add(new THREE.TorusGeometry(0.009, 0.0025, Q(10, 5), Q(40, 14), Math.PI * 1.3), M.gold, [0, -0.041, 0], [0, 0, Math.PI * 1.35]);
 Ch.add(crossGeo(.003, .022, .013, .003, .006, .003, .0006), M.gold, [0, -0.066, 0]);
 Ch.build(charm);

 // ---------- necklace: a twisted black cord, a gold crescent and cross ----------
 const Nl = part();
 {
  const cord = new THREE.CatmullRomCurve3([[0, 1.275, -0.075], [0.066, 1.268, -0.03], [0.078, 1.245, 0.04], [0.046, 1.2, 0.1], [0, 1.162, 0.123], [-0.046, 1.2, 0.1], [-0.078, 1.245, 0.04], [-0.066, 1.268, -0.03]].map((p) => new THREE.Vector3(p[0], p[1], p[2])), true);
  const n = Q(480, 64), fr = cord.computeFrenetFrames(n, true), c = V3();
  for (let ply = 0; ply < 2; ply++) {
   const pts = [];
   for (let i = 0; i < n; i++) { const t = i / n, th = t * TAU * 80 + ply * PI; cord.getPointAt(t, c); pts.push(c.clone().addScaledVector(fr.normals[i], Math.cos(th) * .0012).addScaledVector(fr.binormals[i], Math.sin(th) * .0012)); }
   Nl.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), n * 2, 0.00135, Q(6, 4), true), M.cord);
  }
 }
 Nl.add(new THREE.TorusGeometry(0.004, 0.0015, Q(8, 4), Q(24, 10)), M.gold, [0, 1.157, 0.126]);
 Nl.add(new THREE.TorusGeometry(0.017, 0.0042, Q(12, 6), Q(48, 18), Math.PI).rotateZ(Math.PI), M.gold, [0, 1.145, 0.128]);
 Nl.add(crossGeo(.0042, .03, .017, .0042, .006, .003, .0007), M.gold, [0, 1.108, 0.13]);
 Nl.build(chest, chB);

 // ---------- head: the game model's round face, one smooth sculpt ----------
 const Nk = part();
 Nk.add(uvs(new THREE.CylinderGeometry(0.041, 0.047, 0.14, Q(48, 16), 4, true), 4, 1), M.skin, [0, 1.3, -0.005]);
 Nk.build(neck, bw(neck));
 const head = new THREE.Group(); headB.add(head); STATIC.add(head);
 const HR = 0.15, HS = [1.0, 1.06, 0.97];
 const headPt = (az, el, k) => [HR * HS[0] * Math.sin(az) * Math.cos(el) * k, HR * HS[1] * Math.sin(el) * k, HR * HS[2] * Math.cos(az) * Math.cos(el) * k];
 function jaw(x, y, z) {
  if (y < -0.1) { const k = 1 - 0.3 * Math.pow((-y - 0.1) / 0.9, 1.4); x *= k; z *= lerp(1, k, 0.6); }
  return [x * HR * HS[0], y * HR * HS[1], z * HR * HS[2]];
 }
 function frameAt(az, el, off) {
  const p = jaw(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
  const a = HR * HS[0], b = HR * HS[1], c = HR * HS[2];
  _bz.set(p[0] / (a * a), p[1] / (b * b), p[2] / (c * c)).normalize();
  _bx.crossVectors(YA, _bz).normalize(); _by.crossVectors(_bz, _bx);
  _bm.makeBasis(_bx, _by, _bz);
  return { p: [p[0] + _bz.x * off, p[1] + _bz.y * off, p[2] + _bz.z * off], q: new THREE.Quaternion().setFromRotationMatrix(_bm) };
 }
 // the sculpt: her nose is now part of the face (the game model's small nose, the same size and place, risen out of the
 // skin rather than set on it), with cheeks a touch fuller under the blush
 const hg = new THREE.SphereGeometry(1, Q(160, 40), Q(120, 30)), hpos = hg.attributes.position;
 for (let i = 0; i < hpos.count; i++) {
  const ux = hpos.getX(i), uy = hpos.getY(i), uz = hpos.getZ(i), az = Math.atan2(ux, uz), el = Math.asin(cl(uy, -1, 1));
  let bump = .0062 * Math.exp(-((az / .062) ** 2) * Math.cos(el) - (((el + .245) / .046) ** 2)) * (uz > 0 ? 1 : 0);
  for (const sd of [-1, 1]) bump += .0016 * Math.exp(-(((az - sd * .5) / .26) ** 2) - (((el + .32) / .16) ** 2));
  const p = jaw(ux, uy, uz), k = 1 + bump / Math.hypot(p[0], p[1], p[2]);
  hpos.setXYZ(i, p[0] * k, p[1] * k, p[2] * k);
 }
 hg.computeVertexNormals();
 const headC = new THREE.Vector3(0, 0, 0);
 // fine dark hairs (brows and lashes): each a tapering tube through three points
 const fibre = (P, mat, pts, r0, col) => P.addWorld(lockStrands(pts, 1, 6, Q(5, 3), () => 0, 1, null, col, { thick: r0, jitter: 0, short: .001 }), mat);
 const DARK = C('#3a2224'), LASH = C('#1e1216'), LASHLOW = C('#5a3434');
 const Hd = part();
 Hd.addWorld(hg, M.face);
 const _p3 = V3(), _q3 = new THREE.Quaternion();
 const atFrame = (f, local) => _p3.set(local[0], local[1], local[2]).applyQuaternion(f.q).add(V3(f.p[0], f.p[1], f.p[2])).toArray();
 for (const sd of [-1, 1]) {
  const b0 = headPt(sd * 1.5, -0.12, 0.96), b1 = [sd * 0.157, -0.005, -0.02], b2 = [sd * 0.168, 0.038, -0.04];
  Hd.add(uvs(strand([b0, b1, b2], Q(32, 12), Q(20, 10), (t) => 0.017 * Math.pow(1 - t, 0.7) + 0.0015, 0.42, () => headC), 1, 1), M.skin);
  Hd.add(uvs(strand([headPt(sd * 1.5, -0.1, 0.985), [sd * 0.16, -0.002, -0.02], [sd * 0.168, 0.035, -0.038]], Q(28, 10), Q(16, 8), (t) => 0.011 * Math.pow(1 - t, 0.8), 0.35, () => headC), 1, 1), M.skinShade);
  // the brow: the game model's arc, as a soft band thicker at its inner end, with single hairs combed out along it
  const fb = frameAt(sd * 0.31, 0.2, 0.0015), fq = qz(fb.q, -sd * 0.08), F = { p: fb.p, q: fq };
  const arc = (s, rad) => { const th = PI * .29 + s * PI * .42; return atFrame(F, [rad * Math.cos(th), rad * Math.sin(th) * .55, 0]); };
  const inner = (s) => (sd < 0 ? s : 1 - s);
  const bpts = []; for (let s = 0; s <= 1.0001; s += .1) bpts.push(arc(s, .033));
  Hd.addWorld(lockStrands(bpts, 1, Q(24, 10), Q(8, 4), () => 0, 1, null, DARK, { thick: .0034, jitter: 0, short: .001 }), M.lash);
  for (let k = 0; k < Q(34, 10); k++) {
   const s = r2(), w = .0025 * (1 - .6 * inner(s)), out = sd < 0 ? -1 : 1, s2b = cl(s + out * -.06 * (sd < 0 ? -1 : 1), 0, 1);
   const a = arc(s, .033 - .0016 + (r2() - .5) * w), b = arc(cl(s + (sd < 0 ? .05 : -.05), 0, 1), .033 + .0012 + (r2() - .5) * w * .5);
   void s2b; void out;
   const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + .0006, (a[2] + b[2]) / 2 + .0006];
   fibre(Hd, M.lash, [a, m, b], .00055 + .0004 * (1 - inner(s)), DARK);
  }
 }
 { const f = frameAt(0, -0.42, 0.0005); Hd.add(new THREE.TorusGeometry(0.017, 0.003, Q(12, 6), Q(48, 16), Math.PI * 0.62).rotateZ(Math.PI * 1.19), M.lip, f.p, null, null, f.q); }
 { const f = frameAt(0, -0.47, -0.0005); Hd.add(new THREE.SphereGeometry(1, Q(32, 12), Q(20, 8)), M.lip, f.p, null, [0.0085, 0.0036, 0.004], f.q); }
 Hd.build(head);

 // eyes: shaded whites, a painted iris that looks around, a wet cornea over it that reflects the night, the game model's
 // two highlights, real lids for blinking, a lash line with single lashes and the two long flicks at the outer corner.
 // The whites, irises and highlights never move within an eye, so they sit in head space and are shared by both eyes.
 const SX = 0.03, SY = 0.036, SZ = 0.0078;
 const zS = (x, y) => SZ * Math.sqrt(Math.max(0, 1 - (x / SX) ** 2 - (y / SY) ** 2));
 const eyes = [], whiteG = [], shineG = [], irisE = [], darkE = part();
 for (const sd of [-1, 1]) {
  const f = frameAt(sd * 0.34, -0.07, -0.003);
  const eg = new THREE.Group(); eg.position.set(f.p[0], f.p[1], f.p[2]); eg.quaternion.copy(f.q); head.add(eg); eg.updateMatrix(); STATIC.add(eg);
  const sg = new THREE.SphereGeometry(1, Q(64, 24), Q(40, 16)); sg.scale(SX, SY, SZ);
  vcol(sg, (x, y, z, o) => { const k = 1 - 0.32 * sm(0.006, 0.034, y) - 0.06 * sm(-0.018, -0.036, y) - .05 * sm(.6, 1, Math.abs(x) / SX); o[0] = o[1] = lin1(k); o[2] = lin1(Math.min(1, k * 1.02)); });
  whiteG.push(sg.applyMatrix4(eg.matrix));
  const ig = new THREE.RingGeometry(0, 1, Q(72, 32), Q(14, 5)), ip = ig.attributes.position, base = new Float32Array(ip.count * 2);
  for (let i = 0; i < ip.count; i++) { base[i * 2] = ip.getX(i) * 0.0215; base[i * 2 + 1] = ip.getY(i) * 0.028; }
  irisE.push({ ig, base, n: ip.count, m: eg.matrix.clone(), q: eg.quaternion.clone() });
  shineG.push(merge([place(new THREE.SphereGeometry(0.0062, Q(24, 10), Q(16, 8)), [-0.0075, 0.0085, 0.0098]), place(new THREE.SphereGeometry(0.0033, Q(16, 8), Q(12, 6)), [0.007, -0.0135, 0.0092])]).applyMatrix4(eg.matrix));
  // the lower lash line and a few short lower lashes
  const low = (s, rr2) => { const th = PI * 1.25 + s * PI * .5; return [rr2 * 1.02 * Math.cos(th), -0.002 + rr2 * 1.2 * Math.sin(th), 0.004]; };
  const lpts = []; for (let s = 0; s <= 1.0001; s += .1) lpts.push(low(s, .0285));
  darkE.addWorld(xform(lockStrands(lpts, 1, Q(20, 8), Q(6, 4), () => 0, 1, null, LASHLOW, { thick: .0015, jitter: 0, short: .001 }), eg.matrix), M.lash);
  for (let k = 0; k < Q(10, 4); k++) {
   const s = .15 + .8 * (k + .5) / 10 * (sd < 0 ? 1 : 1), a = low(s, .0285), b = low(s + sd * .02, .0335 + .002 * r2());
   fibre(darkE, M.lash, [a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, .0055], [b[0], b[1], .006]].map((p) => _p3.set(p[0], p[1], p[2]).applyMatrix4(eg.matrix).toArray()), .00045, LASHLOW);
  }
  const dome = new THREE.SphereGeometry(1, Q(64, 24), Q(20, 8), 0, TAU, 0, Math.PI / 2); dome.rotateX(Math.PI / 2);
  const lid = new THREE.Group(); lid.position.set(0, 0.038, 0); eg.add(lid);
  const LD = part(); LD.add(dome, M.lid, [0, -0.038, 0], null, [0.0325, 0.038, 0.0105]); LD.build(lid);
  const lowL = new THREE.Group(); lowL.position.set(0, -0.038, 0); eg.add(lowL);
  const LW = part(); LW.add(dome, M.lid, [0, 0.038, 0], null, [0.0325, 0.038, 0.0105]); LW.build(lowL);
  // the upper lashes: the game model's lash line, a tapering band along the lid's edge, with lashes sweeping up and out,
  // longer toward the outer corner, and its two long flicks
  const lash = new THREE.Group(); eg.add(lash);
  const LS = part();
  const up = (s, rad) => { const th = PI * .03 + s * PI * .94; return [rad * 1.04 * Math.cos(th), -0.0366 + rad * 1.22 * Math.sin(th), 0.0035]; };
  const upts = []; for (let s = 0; s <= 1.0001; s += .05) upts.push(up(s, .03));
  LS.addWorld(lockStrands(upts, 1, Q(40, 12), Q(8, 4), () => 0, 1, null, LASH, { thick: .0034, jitter: 0, short: .001 }), M.lash);
  for (let k = 0; k < Q(36, 8); k++) {
   const s = (k + r2() * .6) / 36, outer = sd < 0 ? 1 - s : s, a = up(s, .03), th = PI * .03 + s * PI * .94;
   const dx = Math.cos(th) + sd * .5 * outer, dy = Math.sin(th) * 1.2 + .25, dl = Math.hypot(dx, dy), l = (.0025 + .0055 * outer * outer) * (.75 + .5 * r2());
   const b = [a[0] + dx / dl * l * .8, a[1] + dy / dl * l * .8 + l * .25, a[2] + l * .55], m = [a[0] + dx / dl * l * .45, a[1] + dy / dl * l * .45, a[2] + l * .45];
   fibre(LS, M.lash, [a, m, b], .00028 + .0002 * outer, LASH);
  }
  for (const [x, y, ang, len, r0] of [[sd * 0.0395, -0.024, -sd * 1.05, .02, .0045], [sd * 0.036, -0.011, -sd * 1.45, .015, .0034]]) {
   // a flick: the game model's cone, now curving a little up at its tip
   const dir = [-Math.sin(ang), Math.cos(ang)], a = [x - dir[0] * len / 2, y - dir[1] * len / 2, .004], b = [x + dir[0] * len / 2, y + dir[1] * len / 2 + .002, .0045];
   LS.addWorld(lockStrands([a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, .0048], b], 1, Q(14, 6), Q(8, 4), () => 0, 1, null, LASH, { thick: r0 * .82, jitter: 0, short: .001 }), M.lash);
  }
  LS.build(lash);
  // the cornea: clear, catching the night and the lamps; hidden with the highlights when the eye closes
  const cg = new THREE.SphereGeometry(1, Q(48, 16), Q(16, 6), 0, TAU, 0, Math.PI / 2); cg.rotateX(Math.PI / 2); cg.scale(SX * .96, SY * .96, .0094);
  const cornea = new THREE.Mesh(cg, M.cornea); cornea.renderOrder = 3; eg.add(cornea);
  lid.visible = lowL.visible = false;
  eyes.push({ lid, low: lowL, lash, cornea });
 }
 darkE.build(head);
 head.add(new THREE.Mesh(merge(whiteG), plain(M.eyeW)));
 const irisG = merge(irisE.map((e) => e.ig)), irisMesh = new THREE.Mesh(irisG, plain(M.iris));
 irisMesh.frustumCulled = false; head.add(irisMesh);
 const shineGeo = merge(shineG), SH0 = shineG[0].index.count, SH1 = shineG[1].index.count, shineMesh = new THREE.Mesh(shineGeo, M.shine);
 head.add(shineMesh);
 const IR = { ox: 9, oy: 9 };
 function setIris(ox, oy) {
  if (Math.abs(ox - IR.ox) < 1e-4 && Math.abs(oy - IR.oy) < 1e-4) return;
  IR.ox = ox; IR.oy = oy;
  const pos = irisG.attributes.position, nrm = irisG.attributes.normal;
  let o = 0;
  for (const e of irisE) {
   for (let i = 0; i < e.n; i++) {
    const x = e.base[i * 2], y = e.base[i * 2 + 1], X = x + ox, Y = y + oy, Z = zS(X, Y);
    _v.set(X, Y, Z + 0.0005).applyMatrix4(e.m); pos.setXYZ(o + i, _v.x, _v.y, _v.z);
    _v.set(X / (SX * SX), Y / (SY * SY), Z / (SZ * SZ) + 1e-3).normalize().applyQuaternion(e.q); nrm.setXYZ(o + i, _v.x, _v.y, _v.z);
   }
   o += e.n;
  }
  pos.needsUpdate = true; nrm.needsUpdate = true;
 }
 setIris(0, 0); IR.ox = IR.oy = 9; // a sensible ring until the first frame sets the real gaze
 // highlights show for each open eye; the right eye (drawn first) is never more closed than the left
 function setShine(v0, v1) {
  shineMesh.visible = v0 || v1;
  shineGeo.setDrawRange(v0 ? 0 : SH0, (v0 ? SH0 : 0) + (v1 ? SH1 : 0));
  eyes[0].cornea.visible = v0; eyes[1].cornea.visible = v1;
 }

 // round glasses: fine black frames with hinges, and glass that reflects
 const Gl = part(), GlL = part(), rimC = [];
 for (const sd of [-1, 1]) {
  const f = frameAt(sd * 0.34, -0.066, 0);
  const c = [f.p[0] + sd * 0.004, f.p[1], f.p[2] + 0.02];
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, sd * 0.2, 0));
  Gl.add(new THREE.TorusGeometry(0.047, 0.0036, Q(14, 6), Q(120, 36)), M.frame, c, null, null, q);
  const lg = new THREE.CircleGeometry(0.046, Q(64, 28)), lp = lg.attributes.position;
  for (let i = 0; i < lp.count; i++) { const r = Math.hypot(lp.getX(i), lp.getY(i)) / .046; lp.setZ(i, .0035 * (1 - r * r)); }
  lg.computeVertexNormals();
  GlL.add(lg, M.lensTint, c, null, null, q); GlL.add(lg, M.lens, c, null, null, q);
  rimC.push(c);
  const outer = [c[0] + sd * 0.046, c[1] + 0.003, c[2] - 0.0094], mid = [sd * 0.152, c[1] + 0.004, 0.05], ear = headPt(sd * 1.5, -0.03, 1.03);
  Gl.add(new THREE.BoxGeometry(.006, .0052, .007), M.frame, [outer[0] - sd * .001, outer[1], outer[2] + .002], [0, sd * .2, 0]);
  seg(Gl, M.frame, outer, mid, 0.0028, 0.0028, Q(12, 6), true);
  seg(Gl, M.frame, mid, ear, 0.0028, 0.0026, Q(12, 6), true);
 }
 Gl.add(new THREE.TorusGeometry(0.016, 0.003, Q(12, 6), Q(40, 14), Math.PI * 0.8).rotateZ(Math.PI * 0.1), M.frame, [0, rimC[0][1] - 0.002, (rimC[0][2] + rimC[1][2]) / 2 + 0.002]);
 Gl.build(head); GlL.build(head);

 // ---------- hair: the game model's every lock, where it was, each now a dark core filled out with fine strands ----------
 // Scalp, bangs and crown ride on her head; the side locks and the long wavy ponytail are skinned to their own bones and
 // swing with the game model's springs. The random stream starts where the game model's did, so each lock has the same
 // place, wave and shade (the darker or the lighter of her two browns) as there.
 hs = SEED.hair;
 const strand0 = strandId;
 const HAIR1 = C('#56383a'), HAIR2 = C('#7a5a55'), CORE = .62;
 const lockMat = () => (hr() < 0.62 ? HAIR1 : HAIR2);
 const coreCol = (g, c) => vcol(g, (x, y, z, o) => { o[0] = c.r * CORE; o[1] = c.g * CORE; o[2] = c.b * CORE; });
 const HQ = { K: (n) => Q(n * 2, 4), N: (n) => Q(Math.round(n * .7), 8), RS: 3 };
 const Hc = part();
 const capG = new THREE.SphereGeometry(1, Q(96, 24), Q(48, 12), 0, TAU, 0, Math.PI * 0.56); capG.rotateX(-0.45);
 M.cap = patch(std({ color: C('#4c3134'), roughness: .72, side: THREE.DoubleSide }), { glow: 1 }); M.cap.name = 'cap';
 Hc.add(capG, M.cap, [0, 0.003, -0.004], null, [HR * HS[0] * 1.05, HR * HS[1] * 1.05, HR * HS[2] * 1.06]);
 function wavy(pts, amp, freq, ph, cen, n) {
  const cv = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
  const out = [], T = new THREE.Vector3(), O = new THREE.Vector3(), S = new THREE.Vector3(), P = new THREE.Vector3();
  for (let i = 0; i <= n; i++) {
   const u = i / n; cv.getPointAt(u, P); cv.getTangentAt(u, T);
   O.subVectors(P, cen(P)); O.addScaledVector(T, -O.dot(T)).normalize(); S.crossVectors(T, O).normalize();
   const w = amp * u * Math.sin(freq * u + ph), w2 = amp * 0.6 * u * Math.sin(freq * u + ph + 1.4);
   out.push([P.x + S.x * w + O.x * w2, P.y + S.y * w + O.y * w2, P.z + S.z * w + O.z * w2]);
  }
  return out;
 }
 // one lock: its core (the game model's lock, darker, so gaps between strands look deep) and its strands
 function lock(P, pts, TSg, RSg, rFn, flat, cen, col, K, N, o) {
  P.addWorld(coreCol(strand(pts, TSg, RSg, (t) => rFn(t) * .92, flat, cen), col), M.hair);
  P.addWorld(lockStrands(pts, K, N, HQ.RS, rFn, flat, cen, col, o), M.hair);
 }
 const PART = 0.18;
 for (let i = 0; i < 12; i++) {
  const az = -0.88 + i * (1.76 / 11) + (hr() - 0.5) * 0.05, side = az > PART ? 1 : -1;
  const endEl = 0.12 + hr() * 0.13 - (Math.abs(az) > 0.62 ? 0.32 : 0);
  const p0 = headPt(PART + (az - PART) * 0.3, 1.2, 0.97), p1 = headPt(az + side * 0.08, 0.62, 1.13), p2 = headPt(az + side * 0.17, endEl, 1.11);
  const pts = wavy([p0, p1, p2], 0.009, 7, hr() * 6, () => headC, 10), col = lockMat();
  lock(Hc, pts, Q(44, 11), Q(10, 5), (t) => 0.021 * Math.pow(1 - t, 0.7) + 0.0015, 0.5, () => headC, col, HQ.K(26), HQ.N(26), { jitter: .3 });
 }
 const tie = [0, -0.085, -0.14];
 for (let i = 0; i < 13; i++) {
  const az = Math.PI / 2 + 0.15 + i * ((Math.PI - 0.3) / 12);
  const p0 = headPt(az, 1.32, 0.97), p1 = headPt(az, 0.55, 1.13), p2 = [tie[0] + Math.sin(az) * 0.025, tie[1] + 0.02, tie[2] + 0.012];
  lock(Hc, [p0, p1, p2], Q(40, 10), Q(10, 5), (t) => 0.032 * (1 - 0.5 * t), 0.42, () => headC, lockMat(), HQ.K(30), HQ.N(22), { jitter: .2, short: .05 });
 }
 // a few stray hairs lifting off the crown
 for (let k = 0; k < Q(24, 4); k++) {
  const az = rr(-2.6, 2.6), p0 = headPt(az, rr(.6, 1.2), 1.1), p1 = headPt(az + rr(-.2, .2), rr(.2, .7), 1.2 + rr(0, .05)), p2 = headPt(az + rr(-.3, .3), rr(-.2, .4), 1.18 + rr(0, .08));
  Hc.addWorld(lockStrands([p0, p1, p2], 1, Q(12, 6), 3, () => 0, 1, null, r2() < .6 ? HAIR1 : HAIR2, { thick: .0005, jitter: 0, short: .001 }), M.hair);
 }
 Hc.build(head);
 const hb = bw(headB), Wd = (p) => [p[0] + hb[0], p[1] + hb[1], p[2] + hb[2]];
 const Hs = part(wHair);
 const sideCen = new THREE.Vector3(hb[0], hb[1] - 0.05, hb[2]);
 for (const sd of [-1, 1]) {
  for (let k = 0; k < 5; k++) {
   const az = sd * (0.72 + k * 0.16);
   const p0 = headPt(az, 0.72, 0.99), p1 = headPt(az, 0.15, 1.2), p2 = headPt(az - sd * 0.02, -0.45, 1.3 + k * 0.02);
   const p3 = [p2[0] + sd * (0.02 + k * 0.006), p2[1] - 0.1 - hr() * 0.04, p2[2] - 0.02 - k * 0.008];
   const pts = wavy([p0, p1, p2, p3].map(Wd), 0.016, 9, hr() * 6, () => sideCen, 12), col = lockMat();
   lock(Hs, pts, Q(60, 14), Q(10, 5), (t) => 0.024 * Math.pow(1 - t, 0.55) + 0.002, 0.5, () => sideCen, col, HQ.K(28), HQ.N(34), { jitter: .35 });
  }
 }
 for (let i = 0; i < 28; i++) {
  const fx = i / 27 - 0.5, len = 0.44 + hr() * 0.1, ph = hr() * TAU, pts = [];
  for (let k = 0; k <= 8; k++) {
   const s = k / 8;
   const x = fx * 0.04 + fx * 0.27 * Math.sin(s * 1.5) + 0.03 * Math.sin(s * 10 + ph) * s;
   const y = -0.085 - s * len;
   const z = -0.15 - 0.045 * Math.sin(s * 2.4) - 0.07 * s * s + 0.012 * Math.cos(s * 9 + ph) * s - Math.abs(fx) * 0.03 * s;
   pts.push(Wd([x, y, z]));
  }
  const r0 = 0.02 + 0.006 * Math.cos(i);
  lock(Hs, pts, Q(60, 14), Q(10, 5), (t) => r0 * Math.pow(1 - t, 0.55) + 0.0025, 0.45, (cc) => new THREE.Vector3(0, cc.y, 0.03), lockMat(), HQ.K(20), HQ.N(40), { jitter: .4, short: .3 });
 }
 // strays in the ponytail, wandering wider than the locks
 for (let k = 0; k < Q(40, 6); k++) {
  const fx = rr(-.75, .75), len = rr(.3, .52), ph = rr(0, TAU), pts = [];
  for (let j = 0; j <= 8; j++) {
   const s = j / 8;
   pts.push(Wd([fx * 0.04 + fx * 0.3 * Math.sin(s * 1.5) + 0.045 * Math.sin(s * 8 + ph) * s, -0.09 - s * len, -0.155 - 0.05 * Math.sin(s * 2.4) - 0.075 * s * s + 0.02 * Math.cos(s * 7 + ph) * s]));
  }
  Hs.addWorld(lockStrands(pts, 1, Q(28, 10), 3, () => 0, 1, null, r2() < .6 ? HAIR1 : HAIR2, { thick: .0006, jitter: 0, short: .2 }), M.hair);
 }
 Hs.build(root);
 const HAIR_STRANDS = strandId - strand0;
 const Sc = part(), scG = new THREE.TorusGeometry(0.028, 0.013, Q(32, 10), Q(96, 22)), scP = scG.attributes.position;
 for (let i = 0; i < scP.count; i++) {
  const x = scP.getX(i), y = scP.getY(i), a = Math.atan2(y, x), k = 1 + 0.12 * Math.sin(a * 11) + .025 * Math.sin(a * 37 + 1);
  const cx = Math.cos(a) * 0.028, cy = Math.sin(a) * 0.028;
  scP.setXYZ(i, cx + (x - cx) * k, cy + (y - cy) * k, scP.getZ(i) * k);
 }
 scG.computeVertexNormals();
 Sc.add(uvs(scG, 2, 1), M.scrunchie, [0, -0.01, -0.012], [Math.PI / 2 + 0.3, 0, 0]);
 Sc.build(hairA);

 // ---------- the hat: drooping brim (now with a thickness and a wired edge), the bent crown whose tip flops, the fuzzy
 // band (real fuzz now), ridged ram horns, the silver chain with its gold crosses, the big gold charm ----------
 const HatP = part();
 const brimPt = (u, v, o, dy) => {
  const a = u * TAU, r = lerp(0.115, 0.335, v), e = (r - 0.115) / 0.22;
  o[0] = r * Math.sin(a); o[2] = r * Math.cos(a) * 0.97;
  o[1] = -0.028 * Math.pow(e, 1.7) + 0.013 * Math.sin(3 * a + 1) * Math.pow(e, 1.2) - 0.012 * Math.max(0, Math.cos(a)) * e + (dy || 0);
 };
 HatP.addWorld(uvs(sheet(Q(256, 48), Q(24, 5), (u, v, o) => brimPt(u, v, o)), 2, 3), M.hat);
 HatP.addWorld(uvs(sheet(Q(256, 48), Q(24, 5), (u, v, o) => brimPt(u, v, o, -.0035)), 2, 3), M.hat);
 const edge = []; for (let k = 0; k < 160; k++) { const o = [0, 0, 0]; brimPt(k / 160, 1, o, -.00175); edge.push(new THREE.Vector3(o[0], o[1], o[2])); }
 HatP.add(uvs(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(edge, true), Q(240, 60), 0.0045, Q(10, 6), true), 2, 3), M.hat);
 const BANDP = smoothP([[0.13, -0.008], [0.136, 0.0], [0.138, 0.022], [0.135, 0.046], [0.127, 0.054]], 3);
 const bandDisp = (r, y, a) => r + (y < 0.008 ? 0.004 * Math.sin(36 * a) : 0);
 HatP.add(uvs(lathe(BANDP, Q(192, 64), bandDisp, 1), 6, 1), M.hatBand);
 { const NS = Q(6, 2); for (let k = 1; k <= NS; k++) { const g = uvs(lathe(BANDP, Q(192, 64), (r, y, a) => bandDisp(r, y, a) + k / NS * .0026, 1), 6, 1); g.setAttribute('aShell', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count).fill(k / NS), 1)); HatP.add(g, M.hatBand); } }
 const ridge = (t) => Math.pow(Math.abs(Math.sin(t * PI * 12)), .6);
 for (const sd of [-1, 1]) {
  const pts = [[sd * 0.122, 0.028, 0.0], [sd * 0.185, 0.04, -0.03], [sd * 0.228, 0.085, -0.045], [sd * 0.22, 0.132, -0.02], [sd * 0.185, 0.128, 0.012], [sd * 0.172, 0.1, 0.02]];
  const TSh = Q(160, 20), RSh = Q(24, 8);
  const g = strand(pts, TSh, RSh, (t) => 0.03 * (1 - t * 0.8) * (1 + .06 * (ridge(t) - .5)), 1, null);
  vcol(g, (x, y, z, o, i) => { const t = Math.floor(i / (RSh + 1)) / TSh, k = lerp(.74, 1, ridge(t)) * lerp(1, .9, t); o[0] = k; o[1] = k * lerp(1, .96, t); o[2] = k * lerp(1, .93, t); });
  HatP.add(uvs(g, 3, 1), M.horn);
 }
 const chainPt = (s) => { const ang = s * 1.2; return [0.142 * Math.sin(ang), 0.062 - 0.03 * (1 - s * s), 0.142 * Math.cos(ang) * 0.97]; };
 for (let k = 0; k <= 34; k++) { const s = -1 + k / 17; HatP.add(new THREE.TorusGeometry(0.0052, 0.0014, Q(8, 4), Q(20, 8)), M.silver, chainPt(s), [k % 2 ? Math.PI / 2 : 0, s * 1.2, 0]); }
 for (const s of [-0.72, -0.4, 0.4, 0.72]) {
  const p = chainPt(s), ry = s * 1.2;
  HatP.add(crossGeo(.0032, .02, .012, .0032, .004, .0025, .0005), M.gold, [p[0], p[1] - 0.016, p[2]], [0, ry, 0]);
 }
 HatP.add(new THREE.TorusGeometry(0.019, 0.0036, Q(16, 8), Q(72, 24)), M.gold, [0, 0.085, 0.132], [-0.12, 0, 0]);
 HatP.add(crossGeo(.0045, .034, .026, .0045, .003, .003, .0006), M.gold, [0, 0.085, 0.133], [-0.12, 0, 0]);
 HatP.add(crossGeo(.0055, .075, .0055, .0001, 0, .0035, .0007), M.gold, [0, 0.03, 0.14], [-0.12, 0, 0]);
 HatP.build(hatB);
 const crownG = uvs(strand([[0, -0.012, 0], [0, 0.1, -0.004], [0.004, 0.2, -0.025], [-0.02, 0.29, -0.055], [-0.075, 0.36, -0.08], [-0.14, 0.385, -0.07], [-0.185, 0.36, -0.045]], Q(180, 20), Q(72, 14),
  (t) => (0.127 * Math.pow(1 - t, 0.85) + 0.004) * (1 + 0.05 * Math.sin(t * 25 + 1.3)), 1, null), 2, 3);
 crownG.applyMatrix4(hatB.matrixWorld);
 const hatY = bw(hatB)[1];
 const Cr = part((x, y) => {
  if (y < hatY + 0.16) return [[BI.hat, 1]];
  if (y < hatY + 0.26) { const t = sm(hatY + 0.16, hatY + 0.26, y); return [[BI.hat, 1 - t], [BI.hatA, t]]; }
  const t = sm(hatY + 0.28, hatY + 0.35, y); return [[BI.hatA, 1 - t], [BI.hatB, t]];
 });
 Cr.addWorld(crownG, M.hat);
 Cr.build(root);

 // ---------- bind: one skinned mesh per pooled material ----------
 root.updateMatrixWorld(true);
 const _pm = new THREE.Matrix4(), _po = new THREE.Matrix4(), skinned = [];
 for (const [mat, list] of POOL) {
  const geos = list.map(({ geo, rigid }) => {
   if (rigid) {
    // a rigid piece goes into bind space and follows its bone at full weight, exactly as when it was parented to it
    _pm.copy(rigid.parent.matrixWorld);
    if (rigid.off) _pm.multiply(_po.makeTranslation(-rigid.off[0], -rigid.off[1], -rigid.off[2]));
    xform(geo, _pm);
    const n = geo.attributes.position.count, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4), b = bones.indexOf(rigid.bone);
    for (let i = 0; i < n; i++) { si[i * 4] = b; sw[i * 4] = 1; }
    geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
    geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
   }
   return geo;
  });
  const g = geos.length > 1 ? merge(geos) : geos[0];
  if (mat !== M.hair && g.attributes.aHT) g.deleteAttribute('aHT');
  if (!mat.vertexColors && g.attributes.color) g.deleteAttribute('color');
  const m = new THREE.SkinnedMesh(g, mat);
  m.frustumCulled = false; root.add(m); skinned.push(m);
 }
 const skeleton = new THREE.Skeleton(bones);
 for (const m of skinned) m.bind(skeleton);
 if (opts.shadows) root.traverse((o) => { if (o.isMesh && !o.material.transparent) { o.castShadow = o.isSkinnedMesh; o.receiveShadow = true; } });

 // ---------- the purple flame in her left palm: a living flame, rising sparks, and a real light ----------
 // The game model's flame is a painted flipbook; this one is drawn as it burns: a wisp whose spine sways and curls as the
 // flipbook's did (at the same pace), its edges licked by noise, a white heart low in it, two layers out of step. It turns
 // moon-white for her moonlight spells, as the game model's cross-fades to its white flame.
 const flame = new THREE.Group(); flame.position.set(-0.07, -0.042, 0.006); wrists[1].add(flame);
 const FLC = (pal) => pal.map((p) => CR(p[0] / 255, p[1] / 255, p[2] / 255));
 const PURP = FLC([[120, 20, 200], [200, 70, 255], [255, 225, 255]]), MOONF = FLC([[110, 140, 255], [190, 215, 255], [255, 255, 255]]);
 const FLAME_VS = 'uniform vec2 uSize; uniform vec2 uCen; varying vec2 vUv;\nvoid main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(0., 0., 0., 1.);\n' +
  ' vec3 up = (viewMatrix * vec4(0., 1., 0., 0.)).xyz; vec2 u2 = length(up.xy) > .05 ? normalize(up.xy) : vec2(0., 1.); vec2 r2 = vec2(u2.y, -u2.x);\n' +
  ' vec2 p = (uv - uCen) * uSize; mv.xy += r2 * p.x + u2 * p.y; gl_Position = projectionMatrix * mv; }';
 // The game model's flame is a flipbook: eight frames, each three passes of soft discs along a spine of two bezier curves
 // (a sway, then a curl at the tip) whose control points swing with the frame's phase. Here the same spine and passes are
 // drawn for every frame as it burns, the phase running smoothly at the flipbook's pace, with noise licking its edges.
 const FLAME_FS = 'uniform float uTime, uPhase, uOp, uWhite; uniform vec3 uA, uB, uC, uA2, uB2, uC2; varying vec2 vUv;\n' +
  'float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }\n' +
  'float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }\n' +
  'float bz(float a, float b, float c, float d, float t){ float u = 1. - t; return u * u * u * a + 3. * u * u * t * b + 3. * u * t * t * c + t * t * t * d; }\n' +
  'void main(){ vec2 P = vec2(vUv.x * 96., (1. - vUv.y) * 176.); float ph = (uTime * 1.75 + uPhase) * 6.2831853;\n' +
  ' float X0 = 48., X1 = 28. + sin(ph) * 9., X2 = 70. + sin(ph + 1.9) * 10., X3 = 50. + sin(ph + .7) * 6.;\n' +
  ' float Y0 = 160., Y1 = 118., Y2 = 72., Y3 = 28. + sin(ph * 2.) * 6.;\n' +
  ' float W1 = X3 - 16. + sin(ph + 2.5) * 8., W2 = X3 + 10., W3 = X3 - 4. + sin(ph + 1.) * 6., Z1 = Y3 - 12., Z2 = Y3 - 24., Z3 = 10. + sin(ph) * 4.;\n' +
  ' P.x += (vn(vec2(P.y * .05 - uTime * 2.6, uPhase * 9.)) - .5) * 9. * (1. - P.y / 176.);\n' +
  ' float o = 0., m = 0., c = 0.;\n' +
  ' for (int i = 0; i <= 56; i++) { float t = float(i) / 56.; bool top = t > .72; float tt = top ? (t - .72) / .28 : t / .72;\n' +
  '  vec2 S = top ? vec2(bz(X3, W1, W2, W3, tt), bz(Y3, Z1, Z2, Z3, tt)) : vec2(bz(X0, X1, X2, X3, tt), bz(Y0, Y1, Y2, Y3, tt));\n' +
  '  float r = (1. - t * .85) * (.8 + .2 * sin(t * 20. + ph)), d2 = dot(P - S, P - S);\n' +
  '  o += exp(-d2 / (42. * 42. * r * r) * 3.); m += exp(-d2 / (27. * 27. * r * r) * 3.); c += exp(-d2 / (13. * 13. * r * r) * 3.); }\n' +
  ' o = 1. - exp(-o * .13 * .7); m = 1. - exp(-m * .22 * .7); c = 1. - exp(-c * .4 * .7);\n' +
  ' vec3 A = mix(uA, uA2, uWhite), B = mix(uB, uB2, uWhite), C = mix(uC, uC2, uWhite);\n' +
  ' vec3 col = A * o * .95 + B * m * .9 + C * c * 1.05;\n' +
  ' gl_FragColor = vec4(col * uOp, 1.); }';
 const flames = [0, 1].map((k) => {
  const mt = new THREE.ShaderMaterial(Object.assign({ vertexShader: FLAME_VS, fragmentShader: FLAME_FS, uniforms: {
   uSize: { value: new THREE.Vector2(.2, .36) }, uCen: { value: new THREE.Vector2(.5, .06) }, uTime: U.time, uPhase: { value: k * .5 }, uOp: { value: 1 }, uWhite: { value: 0 },
   uA: { value: PURP[0] }, uB: { value: PURP[1] }, uC: { value: PURP[2] }, uA2: { value: MOONF[0] }, uB2: { value: MOONF[1] }, uC2: { value: MOONF[2] } } }, ADD));
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mt); m.geometry.translate(.5, .5, 0); m.frustumCulled = false; m.renderOrder = 5; flame.add(m); return m;
 });
 const softCanvas = (S, stops) => { const c = cvs(S, S), g = c.getContext('2d'), gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2); for (const s of stops) gr.addColorStop(s[0], s[1]); g.fillStyle = gr; g.fillRect(0, 0, S, S); return c; };
 const palmGlow = new THREE.Sprite(new THREE.SpriteMaterial(Object.assign({ map: tex(softCanvas(128, [[0, 'rgba(230,150,255,0.9)'], [0.35, 'rgba(170,60,255,0.35)'], [1, 'rgba(120,20,220,0)']])), color: 0xb0b0b0 }, ADD)));
 palmGlow.scale.set(0.16, 0.16, 1); palmGlow.renderOrder = 5; flame.add(palmGlow);
 function starSprite() {
  const S = 128, c = cvs(S, S), g = c.getContext('2d'), m = S / 2;
  const gr = g.createRadialGradient(m, m, 0, m, m, m); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.2, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  g.fillStyle = '#ffffff'; star4(g, m, m, m * 0.95);
  return c;
 }
 const STAR = tex(starSprite());
 hs = SEED.spark;
 const NPt = 18 + Q(18, 0), ptPos = new Float32Array(NPt * 3), ptCol = new Float32Array(NPt * 3), ptSeed = [];
 for (let i = 0; i < NPt; i++) ptSeed.push(i < 18 ? [hr() * TAU, 0.35 + hr() * 0.6, hr()] : [r2() * TAU, 0.3 + r2() * 0.7, r2()]);
 const ptGeo = new THREE.BufferGeometry();
 ptGeo.setAttribute('position', new THREE.BufferAttribute(ptPos, 3)); ptGeo.setAttribute('color', new THREE.BufferAttribute(ptCol, 3));
 const sparks = new THREE.Points(ptGeo, new THREE.PointsMaterial(Object.assign({ size: 0.028, map: STAR, vertexColors: true }, ADD)));
 sparks.frustumCulled = false; sparks.renderOrder = 6; flame.add(sparks);
 const fLight = new THREE.PointLight(0xb455ff, 1.4, 3.2, 2); fLight.position.set(0, 0.09, 0); flame.add(fLight);

 // ---------- effects in world space (the scene adds `fx`) ----------
 const fx = new THREE.Group(); fx.name = 'IoFX';
 const addBlend = (map, color, extra) => Object.assign({ map, color, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }, extra || {});
 function beamCanvas() {
  const W = 128, H = 512, c = cvs(W, H), g = c.getContext('2d'), img = g.createImageData(W, H), d = img.data;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
   const dx = (x - W / 2 + 0.5) / (W / 2), vy = 1 - y / H;
   const core = Math.exp(-dx * dx * 7) * 0.75 + Math.exp(-dx * dx * 55) * 0.6 + Math.exp(-dx * dx * 300) * .3;
   const a = Math.min(1, core * Math.min(1, vy * 7) * Math.pow(1 - vy, 1.1));
   const i = (y * W + x) * 4; d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = a * 255;
  }
  g.putImageData(img, 0, 0); return c;
 }
 // her moon sigil: the game model's (two rings, a dotted ring, a crescent, eight stars), drawn at four times the size with
 // the moon's phases between the outer rings and fine ticks
 function sigilCanvas() {
  const S = 1024 * TS, k = S / 256, c = cvs(S, S), g = c.getContext('2d'), m = S / 2;
  g.strokeStyle = '#ffffff'; g.fillStyle = '#ffffff'; g.shadowColor = '#bcd2ff'; g.shadowBlur = 10 * k;
  g.lineWidth = 3.5 * k; g.beginPath(); g.arc(m, m, 118 * k, 0, TAU); g.stroke();
  g.lineWidth = 1.6 * k; g.beginPath(); g.arc(m, m, 102 * k, 0, TAU); g.stroke();
  g.beginPath(); g.arc(m, m, 70 * k, 0, TAU); g.stroke();
  g.lineWidth = .6 * k; g.beginPath(); g.arc(m, m, 66 * k, 0, TAU); g.stroke();
  for (let i = 0; i < 28; i++) { const a = i / 28 * TAU; g.beginPath(); g.arc(m + Math.cos(a) * 110 * k, m + Math.sin(a) * 110 * k, (i % 4 ? 1.8 : 3.4) * k, 0, TAU); g.fill(); }
  for (let i = 0; i < 120; i++) { const a = i / 120 * TAU, r0 = (i % 5 ? 96 : 92) * k; g.lineWidth = .5 * k; g.beginPath(); g.moveTo(m + Math.cos(a) * r0, m + Math.sin(a) * r0); g.lineTo(m + Math.cos(a) * 100 * k, m + Math.sin(a) * 100 * k); g.stroke(); }
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + .59, x = m + Math.cos(a) * 81 * k, y = m + Math.sin(a) * 81 * k, ph = i / 8; g.beginPath(); g.arc(x, y, 4.5 * k, 0, TAU); g.lineWidth = .6 * k; g.stroke(); g.beginPath(); g.arc(x, y, 4.5 * k, -PI / 2, PI / 2, false); g.ellipse(x, y, 4.5 * k * Math.abs(Math.cos(ph * PI)), 4.5 * k, 0, PI / 2, -PI / 2, ph < .5); g.fill(); }
  g.beginPath(); g.arc(m, m, 52 * k, 0, TAU); g.arc(m + 20 * k, m - 12 * k, 45 * k, 0, TAU, true); g.fill('evenodd');
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2; star4(g, m + Math.cos(a) * 86 * k, m + Math.sin(a) * 86 * k, (i % 2 ? 6 : 9) * k); }
  return c;
 }
 const moonG = new THREE.Group(); fx.add(moonG);
 const beam = new THREE.Sprite(new THREE.SpriteMaterial(addBlend(tex(beamCanvas()), 0xd6e2ff)));
 beam.center.set(0.5, 0); beam.renderOrder = 4; moonG.add(beam);
 const sigil = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.8), new THREE.MeshBasicMaterial(addBlend(tex(sigilCanvas()), 0xcfe0ff)));
 sigil.rotation.x = -Math.PI / 2; sigil.position.y = 0.02; sigil.renderOrder = 3; moonG.add(sigil);
 const pool = new THREE.Mesh(new THREE.CircleGeometry(3.2, 96), new THREE.MeshBasicMaterial(addBlend(tex(softCanvas(256, [[0, 'rgba(255,255,255,1)'], [.45, 'rgba(255,255,255,0.3)'], [1, 'rgba(255,255,255,0)']])), 0xb9ccff)));
 pool.rotation.x = -Math.PI / 2; pool.position.y = 0.015; pool.renderOrder = 2; moonG.add(pool);
 const aura = new THREE.Sprite(new THREE.SpriteMaterial(addBlend(tex(softCanvas(256, [[0, 'rgba(255,255,255,0.95)'], [.45, 'rgba(220,232,255,0.35)'], [1, 'rgba(255,255,255,0)']])), 0xeef3ff)));
 aura.scale.set(2.0, 2.5, 1); aura.renderOrder = 7; moonG.add(aura);
 hs = SEED.motes;
 const NM = 48 + Q(48, 0), mPos = new Float32Array(NM * 3), mCol = new Float32Array(NM * 3), mSeed = [];
 for (let i = 0; i < NM; i++) mSeed.push(i < 48 ? [hr() * TAU, 0.25 + hr() * 0.45, hr(), 0.3 + hr() * 1.0] : [r2() * TAU, 0.2 + r2() * 0.5, r2(), 0.2 + r2() * 1.1]);
 const mGeo = new THREE.BufferGeometry();
 mGeo.setAttribute('position', new THREE.BufferAttribute(mPos, 3)); mGeo.setAttribute('color', new THREE.BufferAttribute(mCol, 3));
 const motes = new THREE.Points(mGeo, new THREE.PointsMaterial(Object.assign({ size: 0.07, map: STAR, vertexColors: true }, ADD)));
 motes.frustumCulled = false; motes.renderOrder = 8; moonG.add(motes);
 const moonLight = new THREE.PointLight(0xe4ecff, 0, 6.5, 2); moonLight.position.set(0, 1.2, 0.6); moonG.add(moonLight);
 moonG.visible = false;
 const WHITE = new THREE.Color(0xdfe8ff), PURPLE = new THREE.Color(0xb455ff), MOONC = new THREE.Color(0xe4ecff);
 void WHITE;

 // the steel-blue ribbon that follows the dagger tip through a strike: the game model's 16 last positions, drawn as a
 // smooth curve through them
 const TRN = 16, TRS = 4, TRV = (TRN - 1) * TRS + 1, trPos = new Float32Array(TRV * 2 * 3), trCol = new Float32Array(TRV * 2 * 3), trIdx = [];
 for (let i = 0; i < TRV - 1; i++) { const a = i * 2; trIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
 const trGeo = new THREE.BufferGeometry();
 trGeo.setAttribute('position', new THREE.BufferAttribute(trPos, 3)); trGeo.setAttribute('color', new THREE.BufferAttribute(trCol, 3)); trGeo.setIndex(trIdx);
 const trail = new THREE.Mesh(trGeo, new THREE.MeshBasicMaterial({ vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
 trail.frustumCulled = false; trail.renderOrder = 6; trail.visible = false; fx.add(trail);
 const tipL = new THREE.Vector3(0, 0, 0.246), midL = new THREE.Vector3(0, 0, 0.09), trTip = [], trMid = [];
 for (let i = 0; i < TRN; i++) { trTip.push(new THREE.Vector3()); trMid.push(new THREE.Vector3()); }
 const cr1 = (p0, p1, p2, p3, t, out) => { const t2 = t * t, t3 = t2 * t; out.set(0, 0, 0).addScaledVector(p0, -t3 + 2 * t2 - t).addScaledVector(p1, 3 * t3 - 5 * t2 + 2).addScaledVector(p2, -3 * t3 + 4 * t2 + t).addScaledVector(p3, t3 - t2).multiplyScalar(.5); return out; };

 // ---------- Lunar Trance: the starlight cloak (in the coat's shader), ghost moth wings, a crescent aura ----------
 function ghostWing(hind) {
  const k = 4 * TS, H0 = (hind ? 384 : 256), c = cvs(256 * k, H0 * k), g = c.getContext('2d');
  g.scale(k, k);
  const path = () => {
   g.beginPath();
   if (!hind) { g.moveTo(8, 150); g.quadraticCurveTo(110, 70, 246, 34); g.quadraticCurveTo(252, 120, 205, 180); g.quadraticCurveTo(110, 204, 8, 168); }
   else { g.moveTo(8, 20); g.quadraticCurveTo(170, 0, 226, 110); g.quadraticCurveTo(232, 192, 172, 222); g.quadraticCurveTo(150, 300, 162, 374); g.quadraticCurveTo(134, 362, 122, 242); g.quadraticCurveTo(58, 204, 8, 62); }
   g.closePath();
  };
  path(); g.save(); g.clip();
  const ry = hind ? 30 : 155, gr = g.createRadialGradient(8, ry, 6, 8, ry, hind ? 330 : 250);
  gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(0.5, 'rgba(185,215,255,0.5)'); gr.addColorStop(1, 'rgba(150,190,255,0.28)');
  g.fillStyle = gr; g.fillRect(0, 0, 256, H0);
  // fine scales, a soft shimmer over the wing
  for (let i = 0; i < 2600 * TS; i++) { g.fillStyle = r2() < .5 ? 'rgba(255,255,255,.08)' : 'rgba(150,180,255,.07)'; g.beginPath(); g.ellipse(r2() * 256, r2() * H0, .9, .5, r2() * PI, 0, TAU); g.fill(); }
  g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 1.2;
  for (let i = 0; i < 9; i++) { const a = -1.0 + i * (hind ? 0.27 : 0.21); g.beginPath(); g.moveTo(8, ry); g.quadraticCurveTo(110, ry + Math.sin(a) * 50, 8 + Math.cos(a) * 270, ry + Math.sin(a) * (hind ? 290 : 170)); g.stroke(); }
  // the finer veins between
  g.strokeStyle = 'rgba(255,255,255,0.16)'; g.lineWidth = .5;
  for (let i = 0; i < 26; i++) { const a = -1.05 + i * (hind ? .092 : .072); g.beginPath(); g.moveTo(40, ry + Math.sin(a) * 14); g.quadraticCurveTo(130, ry + Math.sin(a) * 60, 8 + Math.cos(a) * 270, ry + Math.sin(a) * (hind ? 290 : 170)); g.stroke(); }
  const ex = hind ? 132 : 150, ey = hind ? 126 : 118;
  [[17, 'rgba(255,255,255,0.8)'], [12, 'rgba(120,170,255,0.7)'], [7, 'rgba(255,255,255,0.9)'], [3, 'rgba(90,130,255,.9)']].forEach(([r, col]) => { g.fillStyle = col; g.beginPath(); g.ellipse(ex, ey, r, r * 1.15, 0.3, 0, TAU); g.fill(); });
  g.restore(); path(); g.strokeStyle = '#ffffff'; g.shadowColor = '#cfe0ff'; g.shadowBlur = 12; g.lineWidth = 3; g.stroke();
  return c;
 }
 const gwm = (cnv) => new THREE.MeshBasicMaterial({ map: tex(cnv), color: 0xdcecff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
 const gwMF = gwm(ghostWing(false)), gwMH = gwm(ghostWing(true));
 const tWing = new THREE.Group(); tWing.position.set(0, 0.1, -0.18); chest.add(tWing); tWing.visible = false;
 // both fore wings are one mesh and both hind wings another; their corners are placed each frame (in trance only)
 // through the game model's side, fore and hind joints
 const tSides = [], FORE = new THREE.PlaneGeometry(0.95, 0.95), HIND = new THREE.PlaneGeometry(0.8, 1.2);
 const foreGeo = merge([FORE, FORE]), hindGeo = merge([HIND, HIND]);
 for (const [geo, mat] of [[foreGeo, gwMF], [hindGeo, gwMH]]) { const w = new THREE.Mesh(geo, mat); w.renderOrder = 6; w.frustumCulled = false; tWing.add(w); }
 for (const sd of [-1, 1]) {
  const side = new THREE.Object3D(); side.scale.x = sd;
  const fo = new THREE.Object3D(); fo.rotation.z = 0.2;
  const hi = new THREE.Object3D(); hi.position.set(0, -0.07, -0.01); hi.rotation.z = -0.25; hi.updateMatrix();
  tSides.push({ side, fo, hi, sd });
 }
 const _wm = new THREE.Matrix4(), _wt = new THREE.Matrix4();
 function wingCorners(geo, k, base, m) {
  const pos = geo.attributes.position, b = base.attributes.position;
  for (let i = 0; i < 4; i++) { _v.fromBufferAttribute(b, i).applyMatrix4(m); pos.setXYZ(k * 4 + i, _v.x, _v.y, _v.z); }
  pos.needsUpdate = true;
 }
 function placeWings() {
  tSides.forEach((s, k) => {
   s.side.updateMatrix(); s.fo.updateMatrix();
   wingCorners(foreGeo, k, FORE, _wm.multiplyMatrices(s.side.matrix, s.fo.matrix).multiply(_wt.makeTranslation(0.445, 0.08, 0)));
   wingCorners(hindGeo, k, HIND, _wm.multiplyMatrices(s.side.matrix, s.hi.matrix).multiply(_wt.makeTranslation(0.375, -0.538, 0)));
  });
 }
 const tAura = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex((() => { const S = 512, k = 2, c = cvs(S, S), g = c.getContext('2d'); g.shadowColor = '#cfe0ff'; g.shadowBlur = 26 * k; g.fillStyle = '#ffffff'; g.beginPath(); g.arc(128 * k, 128 * k, 96 * k, 0, TAU); g.arc(150 * k, 104 * k, 86 * k, 0, TAU, true); g.fill('evenodd'); return c; })()), color: 0xdfe9ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
 tAura.position.set(0, 0.32, -0.45); tAura.scale.setScalar(1.3); tAura.renderOrder = 1; tAura.visible = false; chest.add(tAura);

 // ---------- motion: the game model's, unchanged (its springs, its blinking and looking about, every action's keys,
 // durations and blends); only what it drives is drawn differently ----------
 hs = SEED.motion;
 const K0 = (x) => ({ x, v: 0 });
 const skS = skirt.map(() => K0(0.02)), cuS = coatU.map(() => K0(0.03)), clS = coatL.map(() => K0(0.02));
 const hairS = [K0(0), K0(0), K0(0), K0(0), K0(0), K0(0)];
 const sideS = [K0(0), K0(0), K0(0), K0(0)];
 const hatS = [K0(0), K0(0), K0(0), K0(0)];
 const chS = [K0(0), K0(0)];
 const st = { init: false, px: 0, pz: 0, vx: 0, vz: 0, ax: 0, az: 0, prevYaw: 0, yawRate: 0, acc: 0, hp: new THREE.Vector3(), hv: new THREE.Vector3(), ha: new THREE.Vector3() };
 let lookYaw = 0, lookPitch = 0, lookTY = 0, lookTP = 0, lookTimer = 1.5, blinkIn = 1.5 + hr() * 2, blinkT = -1;
 let trK = 0, act = null, glowK = 0, dashV = 0, liftV = 0, moonKv = 0, trailOn = 0, guardOn = false, gW = 0, trance = 0, glowTint = 0;
 const PH = 1 / 120;
 const spring = (s, target, h, K, C) => { s.v += (K * (target - s.x) - C * s.v) * h; s.x += s.v * h; };
 const _hp = new THREE.Vector3(), _hq = new THREE.Quaternion(), _t1 = new THREE.Vector3(), _t2 = new THREE.Vector3(), _wq = new THREE.Quaternion();
 const kf = (u, ts, vs) => {
  if (u <= ts[0]) return vs[0];
  for (let i = 0; i < ts.length - 1; i++) if (u <= ts[i + 1]) { const f = (u - ts[i]) / (ts[i + 1] - ts[i]), s2 = f * f * (3 - 2 * f); return vs[i] + (vs[i + 1] - vs[i]) * s2; }
  return vs[vs.length - 1];
 };
 const win = (u, a, b, e) => sm(a, a + e, u) * (1 - sm(b - e, b, u));
 const IN_OUT = (a, b) => [[0, a, b, 1], [0, 1, 1, 0]];
 // Channels: pelvis drop/lean/twist/roll, chest pitch/twist, right (dagger) arm, left (flame) arm, legs, head pitch.
 const ACTS = {
  cast: { dur: 1.4 },
  lunge: { dur: 0.9, t: [0, 0.2, 0.36, 0.6, 1], w: IN_OUT(0.1, 0.78),
   pDY: [0, -0.05, -0.17, -0.15, 0], pX: [0, -0.06, 0.32, 0.28, 0], pY: [0, -0.18, 0.2, 0.15, 0], cY: [0, -0.5, 0.32, 0.26, 0], cX: [0, 0, 0.12, 0.1, 0],
   sX0: [-0.18, 0.4, -1.45, -1.4, -0.18], sZ0: [-0.32, -1.0, -0.08, -0.12, -0.32], eX0: [-0.55, -1.5, -0.08, -0.15, -0.55], wX0: [0.12, 0.2, 1.25, 1.2, 0.12],
   sX1: [-0.75, -0.95, 0.6, 0.5, -0.75], sZ1: [0.3, 0.45, 0.55, 0.5, 0.3], eX1: [-1.25, -0.9, -0.35, -0.4, -1.25],
   h0: [0, -0.25, -1.0, -0.95, 0], k0: [0.03, 0.45, 1.1, 1.05, 0.03], a0: [0, -0.2, -0.1, -0.1, 0],
   h1: [0, -0.1, 0.55, 0.5, 0], k1: [0.03, 0.35, 0.15, 0.2, 0.03], a1: [0, -0.15, 0.35, 0.3, 0], hp: [0, 0.1, -0.08, -0.05, 0],
   dash: (u) => (u > 0.2 && u < 0.5 ? 5.5 * Math.sin(Math.PI * (u - 0.2) / 0.3) : 0), trail: [[0.18, 0.72]] },
  combo: { dur: 1.75, t: [0, 0.08, 0.17, 0.27, 0.37, 0.48, 0.6, 0.7, 0.82, 1], w: IN_OUT(0.06, 0.88),
   pDY: [0, -0.04, -0.06, -0.05, -0.06, -0.05, -0.17, -0.15, -0.05, 0], pX: [0, 0.05, 0.14, 0.1, 0.14, 0.02, 0.32, 0.28, 0.08, 0],
   pY: [0, -0.2, 0.25, 0.2, -0.2, -0.15, 0.2, 0.15, 0.05, 0], cY: [0, -0.45, 0.4, 0.45, -0.35, -0.5, 0.32, 0.26, 0.05, 0], cX: [0, 0, 0.08, 0.06, 0.08, 0, 0.12, 0.1, 0.02, 0],
   sX0: [-0.18, -0.4, -1.2, -1.1, -1.15, 0.3, -1.45, -1.4, -0.5, -0.18], sZ0: [-0.32, -1.25, 0.35, 0.45, -1.15, -0.6, -0.1, -0.12, -0.3, -0.32],
   eX0: [-0.55, -0.9, -0.25, -1.2, -0.15, -1.5, -0.08, -0.15, -0.6, -0.55], wX0: [0.12, 0.4, 0.6, 0.5, 0.6, 0.2, 1.25, 1.2, 0.3, 0.12],
   sX1: [-0.75, -0.6, 0, 0.05, 0, -0.3, 0.6, 0.5, -0.4, -0.75], sZ1: [0.3, 0.45, 0.55, 0.55, 0.5, 0.45, 0.55, 0.5, 0.35, 0.3], eX1: [-1.25, -1.1, -0.8, -0.8, -0.8, -0.9, -0.35, -0.4, -1.0, -1.25],
   h0: [0, -0.25, -0.4, -0.35, -0.4, -0.25, -1.0, -0.95, -0.3, 0], k0: [0.03, 0.35, 0.45, 0.4, 0.45, 0.4, 1.1, 1.05, 0.35, 0.03], a0: [0, -0.1, -0.05, -0.05, -0.05, -0.15, -0.1, -0.1, -0.05, 0],
   h1: [0, 0.15, 0.3, 0.25, 0.3, 0.1, 0.55, 0.5, 0.15, 0], k1: [0.03, 0.2, 0.2, 0.2, 0.2, 0.3, 0.15, 0.2, 0.15, 0.03], a1: [0, 0.05, 0.1, 0.1, 0.1, 0, 0.35, 0.3, 0.05, 0],
   hp: [0, 0.05, 0, 0, 0, 0.1, -0.08, -0.05, 0, 0],
   dash: (u) => (u > 0.5 && u < 0.62 ? 3.4 * Math.sin(Math.PI * (u - 0.5) / 0.12) : 0), trail: [[0.1, 0.21], [0.3, 0.41], [0.5, 0.68]] },
  throw: { dur: 1.15, t: [0, 0.3, 0.44, 0.6, 1], w: IN_OUT(0.1, 0.8),
   pX: [0, -0.05, 0.16, 0.12, 0], pY: [0, 0.2, -0.15, -0.1, 0], cY: [0, 0.45, -0.4, -0.3, 0], cX: [0, -0.05, 0.1, 0.08, 0],
   sX1: [-0.75, 0.35, -1.5, -1.3, -0.75], sZ1: [0.3, 0.6, 0.12, 0.15, 0.3], eX1: [-1.25, -1.7, -0.2, -0.35, -1.25],
   sX0: [-0.18, -0.3, 0.25, 0.2, -0.18], sZ0: [-0.32, -0.45, -0.55, -0.5, -0.32], eX0: [-0.55, -0.7, -0.5, -0.5, -0.55],
   h0: [0, 0.1, 0.25, 0.2, 0], k0: [0.03, 0.15, 0.2, 0.2, 0.03], a0: [0, 0, 0.1, 0.1, 0], h1: [0, -0.3, -0.45, -0.4, 0], k1: [0.03, 0.35, 0.4, 0.35, 0.03], a1: [0, -0.05, 0.05, 0.05, 0],
   flame: (u) => (u < 0.44 ? 1 + 0.6 * sm(0.2, 0.44, u) : sm(0.62, 0.95, u)) },
  crescent: { dur: 2.4, t: [0, 0.15, 0.3, 0.55, 0.64, 0.8, 1], w: IN_OUT(0.08, 0.88),
   pDY: [0, 0.02, 0.05, 0.05, 0, 0, 0], cX: [0, -0.08, -0.12, -0.1, 0.08, 0.06, 0], hp: [0, -0.08, -0.12, -0.1, 0, 0, 0], cY: [0, 0, 0, 0, 0.3, 0.25, 0], pX: [0, 0, -0.03, -0.03, 0.15, 0.12, 0],
   sX0: [-0.18, -0.9, -1.35, -1.3, -1.5, -1.45, -0.18], sZ0: [-0.32, -0.9, -1.15, -1.1, -0.1, -0.12, -0.32], eX0: [-0.55, -0.5, -0.3, -0.3, -0.05, -0.1, -0.55], wX0: [0.12, 0.3, 0.3, 0.3, 1.2, 1.15, 0.12],
   sX1: [-0.75, -1.0, -1.35, -1.3, -0.9, -0.85, -0.75], sZ1: [0.3, 0.9, 1.15, 1.1, 0.6, 0.55, 0.3], eX1: [-1.25, -0.6, -0.3, -0.3, -0.7, -0.8, -1.25],
   h0: [0, -0.1, -0.1, -0.1, -0.35, -0.3, 0], k0: [0.03, 0.1, 0.1, 0.1, 0.35, 0.3, 0.03], h1: [0, 0.1, 0.1, 0.1, 0.25, 0.2, 0], k1: [0.03, 0.1, 0.1, 0.1, 0.15, 0.15, 0.03],
   glow: (u) => 0.35 * kf(u, [0, 0.2, 0.62, 0.8], [0, 1, 1, 0]) },
  mend: { dur: 1.9, t: [0, 0.25, 0.75, 1], w: IN_OUT(0.15, 0.85),
   sX1: [-0.75, -0.55, -0.55, -0.75], sZ1: [0.3, 0.02, 0.02, 0.3], eX1: [-1.25, -1.95, -1.95, -1.25],
   sX0: [-0.18, -0.35, -0.35, -0.18], sZ0: [-0.32, -0.2, -0.2, -0.32], eX0: [-0.55, -1.3, -1.3, -0.55],
   hp: [0, 0.2, 0.2, 0], pDY: [0, -0.02, -0.02, 0], cX: [0, 0.05, 0.05, 0],
   shut: [0.22, 0.78], glow: (u) => 0.5 * kf(u, [0, 0.25, 0.7, 1], [0, 1, 1, 0]), tint: 1 },
  hurt: { dur: 0.6, t: [0, 0.15, 0.45, 1], w: IN_OUT(0.05, 0.7),
   pX: [0, -0.25, -0.1, 0], cX: [0, -0.2, -0.08, 0], hp: [0, -0.3, -0.1, 0], pDY: [0, -0.05, -0.02, 0],
   sX0: [-0.18, 0.35, 0.1, -0.18], sZ0: [-0.32, -0.75, -0.5, -0.32], eX0: [-0.55, -0.3, -0.45, -0.55],
   sX1: [-0.75, -0.2, -0.5, -0.75], sZ1: [0.3, 0.85, 0.5, 0.3], eX1: [-1.25, -0.5, -0.9, -1.25],
   h0: [0, 0.15, 0.05, 0], k0: [0.03, 0.25, 0.1, 0.03], h1: [0, -0.2, -0.1, 0], k1: [0.03, 0.35, 0.15, 0.03],
   dash: (u) => (u < 0.3 ? -1.8 * Math.sin(Math.PI * u / 0.3) : 0), shut: [0.03, 0.4], interrupt: true },
  block: { dur: 0.45, t: [0, 0.2, 1], w: IN_OUT(0.05, 0.6), pX: [0, -0.12, 0], hp: [0, -0.1, 0], cX: [0, -0.06, 0],
   dash: (u) => (u < 0.3 ? -0.8 * Math.sin(Math.PI * u / 0.3) : 0), interrupt: true },
  kneel: { dur: 1.3, t: [0, 0.3, 0.6, 1], w: [[0, 0.25, 1], [0, 1, 1]], hold: true, interrupt: true,
   pDY: [0, -0.1, -0.36, -0.36], pX: [0, -0.2, 0.3, 0.35], cX: [0, -0.15, 0.2, 0.25], hp: [0, -0.3, 0.35, 0.45],
   h0: [0, 0.1, -1.5, -1.5], k0: [0.03, 0.3, 1.5, 1.5], a0: [0, 0, 0, 0], h1: [0, 0.1, 0, 0], k1: [0.03, 0.4, 1.5, 1.5], a1: [0, 0.1, 0.45, 0.45],
   sX0: [-0.18, 0.3, -0.25, -0.2], sZ0: [-0.32, -0.7, -0.2, -0.15], eX0: [-0.55, -0.3, -0.3, -0.2],
   sX1: [-0.75, -0.3, 0.05, 0.1], sZ1: [0.3, 0.8, 0.25, 0.2], eX1: [-1.25, -0.5, -0.35, -0.3],
   flame: (u) => 1 - 0.7 * sm(0.3, 1, u) },
  victory: { dur: 1.9, t: [0, 0.3, 0.55, 1], w: [[0, 0.2, 1], [0, 1, 1]], hold: true,
   sX1: [-0.75, -1.6, -2.5, -2.45], sZ1: [0.3, 0.4, 0.3, 0.32], eX1: [-1.25, -0.8, -0.3, -0.35],
   sX0: [-0.18, -0.8, -0.1, -0.1], sZ0: [-0.32, -0.9, -0.55, -0.55], eX0: [-0.55, -0.4, -0.25, -0.25], wX0: [0.12, 0.8, 0.2, 0.2],
   pZ: [0, 0, 0.07, 0.08], pY: [0, 0.3, -0.1, -0.1], cY: [0, 0.3, 0.1, 0.1], hp: [0, -0.1, -0.12, -0.1],
   h0: [0, 0, 0.05, 0.05], k0: [0.03, 0.1, 0.12, 0.12], h1: [0, 0, -0.08, -0.08], k1: [0.03, 0.05, 0.02, 0.02],
   flame: (u) => 1 + 0.8 * sm(0.3, 0.6, u), wink: 0.55 },
  moon: { dur: 2.8, t: [0, 0.18, 0.75, 1], w: IN_OUT(0.12, 0.85),
   pDY: [0, 0.08, 0.16, 0], pX: [0, -0.05, -0.08, 0], cX: [0, -0.1, -0.16, 0],
   sX0: [-0.18, -0.3, -0.35, -0.18], sZ0: [-0.32, -0.8, -0.95, -0.32], eX0: [-0.55, -0.3, -0.2, -0.55], wX0: [0.12, 0.3, 0.4, 0.12],
   sX1: [-0.75, -2.2, -2.75, -0.75], sZ1: [0.3, 0.3, 0.22, 0.3], eX1: [-1.25, -0.5, -0.25, -1.25],
   h0: [0, -0.1, -0.15, 0], k0: [0.03, 0.25, 0.35, 0.03], a0: [0, 0.35, 0.5, 0], h1: [0, 0.05, 0.1, 0], k1: [0.03, 0.25, 0.35, 0.03], a1: [0, 0.35, 0.5, 0],
   hp: [0, -0.1, -0.16, 0], moon: (u) => kf(u, [0, 0.15, 0.3, 0.72, 1], [0, 0.6, 1, 1, 0]), float: true }
 };
 ACTS.summon = { dur: 2.6, t: [0, 0.18, 0.4, 0.62, 0.85, 1], w: IN_OUT(0.08, 0.9),
  sX0: [-0.18, -2.4, -2.6, -0.6, -0.6, -0.18], sZ0: [-0.32, -0.5, -0.45, 0.25, 0.25, -0.32], eX0: [-0.55, -0.25, -0.2, -1.9, -1.9, -0.55],
  sX1: [-0.75, -2.5, -2.7, -0.6, -0.6, -0.75], sZ1: [0.3, 0.5, 0.45, -0.05, -0.05, 0.3], eX1: [-1.25, -0.3, -0.2, -1.9, -1.9, -1.25],
  hp: [0, -0.25, -0.3, 0.3, 0.3, 0], cX: [0, -0.12, -0.14, 0.15, 0.15, 0], pDY: [0, 0.02, 0.03, -0.36, -0.36, 0], pX: [0, -0.05, -0.06, 0.25, 0.25, 0],
  h0: [0, 0, 0, -1.5, -1.5, 0], k0: [0.03, 0.05, 0.05, 1.5, 1.5, 0.03], a0: [0, 0, 0, 0, 0, 0], h1: [0, 0, 0, 0, 0, 0], k1: [0.03, 0.05, 0.05, 1.5, 1.5, 0.03], a1: [0, 0, 0, 0.45, 0.45, 0],
  glow: (u) => 0.45 * kf(u, [0, 0.2, 0.85, 1], [0, 1, 1, 0]), flame: (u) => 1 + 0.5 * kf(u, [0, 0.3, 0.6, 1], [0, 1, 0.3, 0]), shut: [0.55, 0.9] };
 ACTS.briar = { dur: 1.35, t: [0, 0.3, 0.45, 0.72, 1], w: IN_OUT(0.1, 0.85),
  sX1: [-0.75, -2.0, -0.45, -0.5, -0.75], sZ1: [0.3, 0.45, 0.2, 0.2, 0.3], eX1: [-1.25, -0.6, -0.25, -0.3, -1.25],
  pDY: [0, 0.02, -0.28, -0.26, 0], pX: [0, -0.06, 0.38, 0.34, 0], hp: [0, -0.12, 0.3, 0.28, 0], cX: [0, -0.05, 0.15, 0.12, 0],
  h0: [0, 0, -0.85, -0.8, 0], k0: [0.03, 0.05, 1.05, 1.0, 0.03], a0: [0, 0, -0.1, -0.1, 0], h1: [0, 0, 0.4, 0.38, 0], k1: [0.03, 0.05, 0.8, 0.75, 0.03], a1: [0, 0, 0.4, 0.38, 0],
  sX0: [-0.18, -0.4, 0.2, 0.15, -0.18], sZ0: [-0.32, -0.5, -0.6, -0.55, -0.32],
  flame: (u) => 1 + 0.7 * kf(u, [0, 0.3, 0.45, 0.6, 1], [0, 1, 1.2, 0.3, 0]) };
 ACTS.transform = { dur: 2.6, t: [0, 0.2, 0.45, 0.55, 0.75, 1], w: IN_OUT(0.08, 0.9),
  sX0: [-0.18, -0.7, -0.7, -1.9, -1.85, -0.18], sZ0: [-0.32, 0.45, 0.45, -1.2, -1.15, -0.32], eX0: [-0.55, -2.0, -2.0, -0.15, -0.2, -0.55],
  sX1: [-0.75, -0.7, -0.7, -1.9, -1.85, -0.75], sZ1: [0.3, -0.2, -0.2, 1.2, 1.15, 0.3], eX1: [-1.25, -2.0, -2.0, -0.15, -0.2, -1.25],
  hp: [0, 0.3, 0.2, -0.3, -0.25, 0], cX: [0, 0.12, 0.08, -0.2, -0.16, 0], pDY: [0, -0.08, 0.12, 0.2, 0.18, 0],
  k0: [0.03, 0.25, 0.15, 0.22, 0.2, 0.03], k1: [0.03, 0.25, 0.15, 0.22, 0.2, 0.03], a0: [0, 0.1, 0.25, 0.35, 0.3, 0], a1: [0, 0.1, 0.25, 0.35, 0.3, 0],
  flame: (u) => 1 + 0.9 * kf(u, [0, 0.45, 0.55, 0.8, 1], [0, 0.4, 1.2, 0.4, 0]), shut: [0.12, 0.48], glow: (u) => 0.6 * kf(u, [0, 0.4, 0.6, 1], [0.2, 0.5, 1, 0]) };
 const GUARD = { sX0: -1.15, sZ0: 0.35, eX0: -1.35, wX0: 0.35, sX1: -1.0, sZ1: 0.15, eX1: -0.8, h0: -0.25, k0: 0.3, h1: 0.25, k1: 0.3, a1: 0.1, pDY: -0.05, cY: 0.15, hp: 0.05 };
 // rise (new in this pass): getting up after kneel. It starts from the pose she is holding, captured when it is
 // played so nothing pops; from a kneel she pushes up off her front knee, then she blends back into her idle.
 // It needs a pose to rise from, so it returns false when she is already up.
 const RISE_DUR = 1.2;
 ACTS.rise = { dur: RISE_DUR, t: [0, 1], w: [[0, 1], [0, 0]] };
 const POSE_KEYS = ['pDY', 'pX', 'pY', 'pZ', 'cX', 'cY', 'hp', 'sX0', 'sZ0', 'eX0', 'wX0', 'sX1', 'sZ1', 'eX1', 'h0', 'k0', 'a0', 'h1', 'k1', 'a1'];
 const IDLE = { pDY: 0, pX: 0, pY: 0, pZ: 0, cX: 0, cY: 0, hp: 0, sX0: -0.18, sZ0: -0.32, eX0: -0.55, wX0: 0.12, sX1: -0.75, sZ1: 0.3, eX1: -1.25, h0: 0, k0: 0.03, a0: 0, h1: 0, k1: 0.03, a1: 0 };
 const PUSH = { pDY: -0.17, pX: 0.3, cX: 0.16, hp: 0.22, h0: -0.95, k0: 1.0, a0: -0.08, h1: 0.22, k1: 0.75, a1: 0.22, sX0: -0.45, sZ0: -0.25, eX0: -0.65, sX1: -0.45, sZ1: 0.35, eX1: -0.85 };
 function riseFrom(cur) {
  const d = cur.def, u0 = Math.min(1, cur.t / cur.dur), w0 = kf(u0, d.w[0], d.w[1]);
  if (w0 < 0.05) return null;
  const kneel = cur.type === 'kneel', R = { dur: RISE_DUR, t: kneel ? [0, 0.42, 1] : [0, 1], w: [[0, 0.72, 1], [w0, w0, 0]] };
  for (const k of POSE_KEYS) {
   if (!d[k]) continue;
   const v0 = kf(u0, d.t, d[k]);
   R[k] = kneel ? [v0, PUSH[k] !== undefined ? PUSH[k] : lerp(v0, IDLE[k], 0.5), IDLE[k]] : [v0, IDLE[k]];
  }
  const f0 = d.flame ? d.flame(u0) : 1;
  R.flame = (u) => lerp(f0, 1, sm(0.15, 0.85, u));
  return R;
 }
 function play(name, force) {
  let def = ACTS[name]; if (!def) return false;
  if (act && !force && !def.interrupt && !(act.def.hold)) return false;
  if (name === 'rise') { def = act && act.type !== 'cast' && act.type !== 'rise' ? riseFrom(act) : null; if (!def) return false; }
  act = { type: name, t: 0, dur: def.dur, def }; return true;
 }

 // ---------- every frame: the game model's animate(), line for line, but for what draws her flame (its shader's size and
 // whiteness), her glow (shared uniforms instead of rewriting emissive colours) and the trail (a smooth curve) ----------
 function animate(phase, wb, t, dt) {
  dt = dt > 0 ? Math.min(dt, 0.05) : 0;
  const idt = dt > 0 ? dt : 1 / 60;
  const ph = phase, s = Math.sin(ph), c = Math.cos(ph);
  const rx = root.position.x, rz = root.position.z, yaw = root.rotation.y;
  const jump = !st.init || Math.hypot(rx - st.px, rz - st.pz) > 1.2;
  if (jump) { st.px = rx; st.pz = rz; st.vx = st.vz = st.ax = st.az = 0; st.prevYaw = yaw; st.yawRate = 0; }
  const kv = 1 - Math.exp(-idt / 0.08), ka = 1 - Math.exp(-idt / 0.06);
  if (dt > 0) {
   const nvx = st.vx + ((rx - st.px) / dt - st.vx) * kv, nvz = st.vz + ((rz - st.pz) / dt - st.vz) * kv;
   st.ax += ((nvx - st.vx) / dt - st.ax) * ka; st.az += ((nvz - st.vz) / dt - st.az) * ka;
   st.vx = nvx; st.vz = nvz;
   let dyaw = yaw - st.prevYaw; dyaw = Math.atan2(Math.sin(dyaw), Math.cos(dyaw));
   st.yawRate += (dyaw / dt - st.yawRate) * (1 - Math.exp(-dt / 0.12));
  }
  st.px = rx; st.pz = rz; st.prevYaw = yaw;
  const cy = Math.cos(yaw), sy = Math.sin(yaw), alx = st.ax * cy - st.az * sy, alz = st.ax * sy + st.az * cy;

  // actions
  let cast = 0, w = 0, P = null, u = 0;
  if (act) {
   act.t += dt; u = Math.min(1, act.t / act.dur);
   if (u >= 1 && !act.def.hold) { act = null; u = 0; }
   else if (act.type === 'cast') cast = Math.sin(Math.PI * Math.min(1, u * 1.2));
   else { P = act.def; w = kf(u, P.w[0], P.w[1]); }
  }
  const type = act ? act.type : '', isMoon = type === 'moon';
  gW += ((guardOn ? 1 : 0) - gW) * (1 - Math.exp(-idt * 9));
  const gw = gW * (1 - w);
  const V = (key, base) => {
   let v = GUARD[key] !== undefined ? lerp(base, GUARD[key], gw) : base;
   return P && P[key] ? lerp(v, kf(u, P.t, P[key]), w) : v;
  };
  dashV = P && P.dash ? P.dash(u) : 0;
  moonKv = P && P.moon ? P.moon(u) : 0;
  const glowV = Math.max(P && P.glow ? P.glow(u) : 0, trance * 0.28);
  glowTint += (((P && P.tint) ? 1 : 0) - glowTint) * (1 - Math.exp(-idt * 6));
  const flameS = P && P.flame ? P.flame(u) : 1;

  // body: base walk/idle pose, guard stance and action poses blended on top
  const lean = cl(alz * 0.005, -0.1, 0.1) * (1 - w), bank = cl(-st.yawRate * wb * 0.03, -0.1, 0.1);
  const pDY = V('pDY', 0);
  liftV = Math.max(0, pDY);
  pelvis.position.set(-s * 0.012 * wb * (1 - w), 0.86 + Math.abs(c) * 0.018 * wb - 0.006 * wb + Math.sin(t * 1.9) * 0.003 * (1 - wb) + pDY + (P && P.float ? Math.sin(t * 3) * 0.012 * w : 0) + trance * (0.07 + 0.015 * Math.sin(t * 2.2)), 0);
  pelvis.rotation.set(V('pX', wb * 0.035 + lean), V('pY', -s * 0.09 * wb), V('pZ', (c * 0.05 * wb + Math.sin(t * 0.45) * 0.02 * (1 - wb)) * (1 - w) + bank));
  spine.rotation.set(-0.01 * wb, s * 0.05 * wb * (1 - w), -pelvis.rotation.z * 0.35);
  chest.rotation.set(V('cX', lean * 0.2 - 0.05 * cast), V('cY', s * 0.07 * wb - 0.1 * cast), -c * 0.02 * wb * (1 - w) - pelvis.rotation.z * 0.25);
  const br = Math.sin(t * 2.0) * 0.006 * (1 - 0.5 * wb); chest.scale.set(1 + br, 1 + br * 0.4, 1 + br);
  const hipW = [0, 0];
  for (let i = 0; i < 2; i++) {
   const sg = i === 0 ? 1 : -1, hipB = sg * s * 0.42 * wb, kneeB = wb * (0.05 + 0.85 * Math.max(0, -sg * c)) + 0.03;
   const ankB = -(hipB + kneeB) * 0.65 + Math.max(0, sg * s) * 0.25 * wb;
   hipW[i] = V('h' + i, hipB);
   legs[i].rotation.set(hipW[i] - pelvis.rotation.x, 0, -pelvis.rotation.z + sg * 0.02);
   knees[i].rotation.x = V('k' + i, kneeB);
   ankles[i].rotation.x = V('a' + i, ankB);
  }
  const sw = -s * 0.22 * wb + Math.sin(t * 1.2) * 0.02 * (1 - wb);
  arms[0].rotation.set(V('sX0', -0.18 + sw - lean * 0.5), 0, V('sZ0', -0.32 + Math.sin(t * 0.9) * 0.015 * (1 - wb)));
  elbows[0].rotation.set(V('eX0', -0.55 - 0.2 * Math.max(0, -sw) - 0.05 * wb), 0, 0);
  wrists[0].rotation.set(V('wX0', 0.12), 0, 0.1);
  const bob = Math.sin(ph * 2) * 0.025 * wb + Math.sin(t * 1.6) * 0.02 * (1 - wb);
  arms[1].rotation.set(V('sX1', -0.75 - 0.95 * cast + bob), 0, V('sZ1', 0.3 + 0.1 * cast));
  elbows[1].rotation.set(V('eX1', -1.25 + 0.75 * cast - bob * 0.5), Math.PI / 2, 0);
  wrists[1].rotation.set(0.05 + 0.2 * cast + (isMoon ? 0.35 * w : 0), 0, -0.15);

  // gaze
  if (P && !isMoon) { lookTY = 0; lookTP = 0.04; }
  else if (isMoon) { lookTY = 0; lookTP = -0.2; }
  else if (cast > 0.05) { lookTY = 0.35; lookTP = -0.18; }
  else if (wb > 0.3) { lookTY = cl(st.yawRate * 0.15, -0.5, 0.5); lookTP = 0.06; lookTimer = 0.8 + hr(); }
  else if (dt > 0) {
   lookTimer -= dt;
   if (lookTimer <= 0) {
    if (hr() < 0.3) { lookTY = 0.32; lookTP = 0.12; } else { lookTY = (hr() - 0.5) * 1.1; lookTP = (hr() - 0.55) * 0.25; }
    lookTimer = 2.2 + hr() * 3; if (blinkT < 0 && hr() < 0.6) blinkT = 0;
   }
  }
  const kl = 1 - Math.exp(-idt * (P ? 9 : 4));
  lookYaw += (lookTY - lookYaw) * kl; lookPitch += (lookTP - lookPitch) * kl;
  neck.rotation.set(lookPitch * 0.4, lookYaw * 0.35 - chest.rotation.y * 0.5, 0);
  headB.rotation.set(lookPitch * 0.6 + 0.015 * wb * Math.abs(s) - lean * 0.3 + V('hp', 0), lookYaw * 0.5 - chest.rotation.y * 0.35 - pelvis.rotation.y * 0.3,
   -chest.rotation.z * 0.5 - pelvis.rotation.z * 0.5 + Math.sin(t * 0.7) * 0.025 * (1 - wb));
  if (blinkT < 0) { blinkIn -= dt; if (blinkIn <= 0) blinkT = 0; }
  let close = 0;
  if (blinkT >= 0) { blinkT += dt; const bu = blinkT / 0.16; if (bu >= 1) { blinkT = -1; blinkIn = 1.8 + hr() * 3.2; } else close = Math.sin(Math.PI * Math.min(1, bu * 1.1)); }
  if (P && P.shut) close = Math.max(close, win(u, P.shut[0], P.shut[1], 0.06));
  const eyeX = cl((lookTY - lookYaw) * 0.018 + lookYaw * 0.007, -0.007, 0.007), eyeY = cl(-lookPitch * 0.018, -0.005, 0.004);
  setIris(eyeX, eyeY);
  const hlOn = [false, false];
  eyes.forEach((e, i) => {
   const cc = (P && P.wink && i === 1) ? Math.max(close, sm(P.wink, P.wink + 0.08, u)) : close;
   e.lid.visible = e.low.visible = cc > 0.01;
   e.lid.scale.set(1, 0.085 + (0.8 - 0.085) * cc, 0.45 + 0.55 * cc);
   e.low.scale.set(1, 0.015 + 0.225 * cc, 0.45 + 0.55 * cc);
   e.lash.position.y = 0.038 - 0.076 * e.lid.scale.y;
   e.lash.scale.y = 1 - 0.85 * cc;
   hlOn[i] = cc < 0.35;
  });
  setShine(hlOn[0], hlOn[1]);

  // physics: skirt, two-level cloak, hair chain and side locks, floppy hat tip, dagger charms
  root.updateMatrixWorld(true);
  headB.getWorldPosition(_hp);
  if (jump) {
   for (const k of skS) { k.x = 0.02; k.v = 0; } for (const k of cuS) { k.x = 0.03; k.v = 0; } for (const k of clS) { k.x = 0.02; k.v = 0; }
   for (const k of [...hairS, ...sideS, ...hatS, ...chS]) { k.x = k.v = 0; }
   st.hp.copy(_hp); st.hv.set(0, 0, 0); st.ha.set(0, 0, 0); st.acc = 0; st.init = true;
  }
  if (dt > 0) {
   _t1.subVectors(_hp, st.hp).divideScalar(dt);
   _t2.copy(st.hv); st.hv.lerp(_t1, kv); _t2.subVectors(st.hv, _t2).divideScalar(dt); st.ha.lerp(_t2, ka);
  }
  st.hp.copy(_hp);
  headB.getWorldQuaternion(_hq).invert(); _t1.copy(st.ha).applyQuaternion(_hq);
  const hax = _t1.x, haz = _t1.z, headPitch = headB.rotation.x + neck.rotation.x + chest.rotation.x + pelvis.rotation.x;
  const bounce = Math.sin(ph * 2 + 0.4) * wb, mk = moonKv, billow = Math.sin(t * 4.2), lw = type === 'lunge' || type === 'combo' ? w : 0;
  const skT = skirt.map((b, k) => {
   const a = k / SK * TAU, dot = alx * Math.sin(a) + alz * Math.cos(a);
   let kick = 0;
   for (let i = 0; i < 2; i++) kick += Math.max(0, -hipW[i]) * Math.max(0, Math.cos(a - (i === 0 ? -0.3 : 0.3))) ** 2;
   return cl(0.02 - dot * 0.004 + kick * 0.18 + Math.abs(c) * 0.012 * wb + 0.05 * cast + mk * (0.12 + 0.04 * Math.sin(t * 5 + k)), -0.03, 0.4);
  });
  const cuT = coatU.map((b, k) => {
   const a = (k + 0.5) / CK * TAU, dot = alx * Math.sin(a) + alz * Math.cos(a);
   let kick = 0;
   for (let i = 0; i < 2; i++) kick += Math.max(0, -hipW[i]) * Math.max(0, Math.cos(a - (i === 0 ? -0.5 : 0.5))) ** 2;
   return cl(0.03 - dot * 0.006 + Math.abs(c) * 0.02 * wb + 0.04 * wb * Math.max(0, -Math.cos(a)) + 0.08 * cast + mk * (0.24 + 0.06 * Math.sin(t * 3.4 + k * 1.3)) + lw * 0.25 * Math.max(0, -Math.cos(a)) + kick * 0.12, -0.04, 0.55);
  });
  const clT = coatL.map((b, k) => {
   const a = (k + 0.5) / CK * TAU, dot = alx * Math.sin(a) + alz * Math.cos(a);
   return cl(0.02 - dot * 0.008 + Math.sin(ph * 2 + k) * 0.03 * wb + 0.1 * cast + mk * (0.22 + 0.1 * Math.sin(t * 4 + k * 1.7)) + lw * 0.3 * Math.max(0, -Math.cos(a)), -0.08, 0.6);
  });
  const hT = [cl(haz * 0.003, -0.12, 0.12) - headPitch * 0.9 + bounce * 0.015 + mk * 0.3, cl(-hax * 0.003, -0.1, 0.1),
   cl(haz * 0.004, -0.15, 0.15) + bounce * 0.02 + mk * (0.25 + 0.08 * billow), cl(-hax * 0.004, -0.12, 0.12),
   cl(haz * 0.005, -0.18, 0.18) + bounce * 0.025 + mk * (0.3 + 0.12 * billow), cl(-hax * 0.005, -0.14, 0.14)];
  const sT = cl(haz * 0.004, -0.14, 0.14) + bounce * 0.02 - headPitch * 0.4 + mk * 0.3;
  const tT = [cl(haz * 0.004, -0.12, 0.12) + bounce * 0.03 + mk * 0.1 * billow, cl(-hax * 0.004, -0.1, 0.1), cl(haz * 0.006, -0.2, 0.2) + bounce * 0.05 + mk * 0.18 * billow, cl(-hax * 0.006, -0.16, 0.16)];
  const nSteps = Math.min(8, Math.floor((st.acc + dt) / PH));
  st.acc = nSteps === 8 ? 0 : st.acc + dt - nSteps * PH;
  for (let n = 0; n < nSteps; n++) {
   for (let k = 0; k < SK; k++) spring(skS[k], skT[k], PH, 110, 8);
   for (let k = 0; k < CK; k++) { spring(cuS[k], cuT[k], PH, 70, 6); spring(clS[k], clT[k] + cuS[k].v * 0.02, PH, 45, 4.5); }
   spring(hairS[0], hT[0], PH, 80, 6); spring(hairS[1], hT[1], PH, 80, 6);
   spring(hairS[2], hT[2], PH, 60, 4.5); spring(hairS[3], hT[3], PH, 60, 4.5);
   spring(hairS[4], hT[4], PH, 45, 3.5); spring(hairS[5], hT[5], PH, 45, 3.5);
   for (const k of sideS) spring(k, sT, PH, 90, 5);
   spring(hatS[0], tT[0], PH, 90, 5); spring(hatS[1], tT[1], PH, 90, 5); spring(hatS[2], tT[2], PH, 60, 3.5); spring(hatS[3], tT[3], PH, 60, 3.5);
   spring(chS[0], cl(-alz * 0.02, -0.5, 0.5) + bounce * 0.15, PH, 50, 3); spring(chS[1], cl(alx * 0.02, -0.4, 0.4), PH, 50, 3);
  }
  for (let k = 0; k < SK; k++) skirt[k].rotation.x = -skS[k].x;
  for (let k = 0; k < CK; k++) { coatU[k].rotation.x = -cuS[k].x; coatL[k].rotation.x = -clS[k].x; }
  hairA.rotation.set(hairS[0].x, 0, hairS[1].x); hairB.rotation.set(hairS[2].x, 0, hairS[3].x); hairC.rotation.set(hairS[4].x, 0, hairS[5].x);
  sideL1.rotation.x = sideS[0].x; sideL2.rotation.x = sideS[1].x * 1.3; sideR1.rotation.x = sideS[2].x; sideR2.rotation.x = sideS[3].x * 1.3;
  hatA1.rotation.set(hatS[0].x, 0, hatS[1].x); hatA2.rotation.set(hatS[2].x, 0, hatS[3].x);

  // hanging things point down; the flame stays upright and follows the action
  root.updateMatrixWorld(true);
  dagger.getWorldQuaternion(_wq).invert();
  charm.quaternion.copy(_wq).multiply(_hq.setFromEuler(_e.set(chS[0].x, 0, chS[1].x)));
  wrists[1].getWorldQuaternion(_wq).invert(); flame.quaternion.copy(_wq);
  const whiteF = Math.max(mk, trance);
  U.time.value = t;
  const fs = (1 + 0.06 * Math.sin(t * 9)) * (1 + 0.9 * cast + 0.7 * mk) * flameS + 1e-4;
  flames[0].material.uniforms.uSize.value.set(0.2 * fs, 0.36 * fs); flames[1].material.uniforms.uSize.value.set(0.16 * fs, 0.29 * fs);
  for (const f of flames) f.material.uniforms.uWhite.value = whiteF;
  palmGlow.scale.setScalar(0.16 * (1 + 0.5 * cast) * (1 + 0.08 * Math.sin(t * 13)) * Math.min(1, flameS + 0.2));
  palmGlow.material.opacity = 1 - whiteF * 0.8;
  fLight.color.copy(PURPLE).lerp(MOONC, whiteF);
  fLight.intensity = (1.3 + 0.22 * Math.sin(t * 13) + 0.14 * Math.sin(t * 7.3)) * (1 + 1.2 * cast + 1.2 * mk) * Math.min(1.4, 0.15 + flameS);
  fLight.distance = 3.2 + 1.5 * cast + 1.5 * mk;
  for (let i = 0; i < NPt; i++) {
   const sd = ptSeed[i], age = (t * sd[1] * (1 + cast) + sd[2]) % 1, ang = sd[0] + age * 5, r = 0.02 + 0.045 * age * (1 + cast);
   ptPos[i * 3] = Math.cos(ang) * r; ptPos[i * 3 + 1] = 0.02 + age * 0.3 * (1 + cast); ptPos[i * 3 + 2] = Math.sin(ang) * r;
   const k = Math.sin(Math.PI * age) * (0.75 + 0.25 * Math.sin(t * 20 + i)) * Math.min(1, flameS);
   ptCol[i * 3] = 0.9 * k; ptCol[i * 3 + 1] = lerp(0.55, 0.93, whiteF) * k; ptCol[i * 3 + 2] = k;
  }
  ptGeo.attributes.position.needsUpdate = true; ptGeo.attributes.color.needsUpdate = true;

  // light effects: moonlight (beam, sigil, pool), aura for trance and healing, rising motes; she glows
  const auraK = Math.max(mk, glowV);
  moonG.visible = auraK > 0.001;
  if (moonG.visible) {
   moonG.position.set(rx, 0, rz);
   beam.visible = sigil.visible = mk > 0.001;
   beam.material.opacity = mk * 0.8; beam.scale.set(1.4 + 0.4 * mk, 8, 1);
   sigil.material.opacity = mk * 0.9; sigil.rotation.z = t * 0.4; sigil.scale.setScalar(0.65 + 0.35 * mk);
   pool.material.opacity = auraK * 0.5;
   pool.material.color.setRGB(lerp(0.72, 0.62, glowTint), lerp(0.8, 1.0, glowTint), lerp(1.0, 0.72, glowTint));
   aura.material.opacity = auraK * (0.5 + 0.08 * Math.sin(t * 6)); aura.position.set(0, 1.0 + pDY, 0);
   aura.material.color.setRGB(lerp(0.93, 0.8, glowTint), 1, lerp(1, 0.82, glowTint));
   moonLight.intensity = auraK * 3.2;
   moonLight.color.setRGB(lerp(0.9, 0.75, glowTint), 1, lerp(1, 0.8, glowTint));
   for (let i = 0; i < NM; i++) {
    const sd = mSeed[i], age = (t * sd[1] + sd[2]) % 1, ang = sd[0] + age * 2.5, r = sd[3] * (1 - 0.35 * age) * (0.6 + 0.4 * mk);
    mPos[i * 3] = Math.cos(ang) * r; mPos[i * 3 + 1] = age * (1.4 + 1.8 * mk); mPos[i * 3 + 2] = Math.sin(ang) * r;
    const k = Math.sin(Math.PI * age) * auraK;
    mCol[i * 3] = lerp(0.85, 0.6, glowTint) * k; mCol[i * 3 + 1] = 0.95 * k; mCol[i * 3 + 2] = lerp(1, 0.7, glowTint) * k;
   }
   mGeo.attributes.position.needsUpdate = true; mGeo.attributes.color.needsUpdate = true;
  }
  const gk = Math.max(mk * 0.5, glowV * 0.35);
  glowK = gk; trK = trance; U.glow.value = gk; U.trance.value = trance;
  tWing.visible = trance > 0.01;
  if (tWing.visible) { gwMF.opacity = gwMH.opacity = 0.85 * trance; const fl = Math.sin(t * 2.4); for (const sw of tSides) { sw.side.rotation.y = sw.sd * (0.45 + 0.3 * fl); sw.side.scale.set(sw.sd * (0.3 + 0.7 * trance), 0.3 + 0.7 * trance, 1); sw.fo.rotation.x = 0.08 * fl; } placeWings(); }
  tAura.visible = trance > 1e-3; // below this its additive light is under half a color step: nothing to draw
  tAura.material.opacity = 0.7 * trance; tAura.material.rotation = Math.sin(t * 0.5) * 0.1; tAura.scale.setScalar(1.2 + 0.1 * Math.sin(t * 1.7));
  for (const L of LINING) L.m.color.copy(L.c).lerp(INDIGO, trance);

  // dagger trail during strikes
  let trOn = 0;
  if (P && P.trail) for (const r of P.trail) trOn = Math.max(trOn, win(u, r[0], r[1], 0.05));
  if (trOn > 0 && trailOn === 0) { dagger.localToWorld(_t1.copy(tipL)); dagger.localToWorld(_t2.copy(midL)); for (let i = 0; i < TRN; i++) { trTip[i].copy(_t1); trMid[i].copy(_t2); } }
  trailOn = trOn; trail.visible = trOn > 0;
  if (trail.visible) {
   for (let i = TRN - 1; i > 0; i--) { trTip[i].copy(trTip[i - 1]); trMid[i].copy(trMid[i - 1]); }
   dagger.localToWorld(trTip[0].copy(tipL)); dagger.localToWorld(trMid[0].copy(midL));
   for (let i = 0; i < TRV; i++) {
    const s = i / TRS, i0 = Math.min(TRN - 1, Math.floor(s)), f = s - i0, im = Math.max(0, i0 - 1), i1 = Math.min(TRN - 1, i0 + 1), i2 = Math.min(TRN - 1, i0 + 2);
    cr1(trTip[im], trTip[i0], trTip[i1], trTip[i2], f, _t1); cr1(trMid[im], trMid[i0], trMid[i1], trMid[i2], f, _t2);
    const k = trOn * Math.pow(1 - s / (TRN - 1), 1.6);
    trPos.set([_t1.x, _t1.y, _t1.z, _t2.x, _t2.y, _t2.z], i * 6);
    trCol.set([k, k, k, 0.35 * k, 0.4 * k, 0.55 * k], i * 6);
   }
   trGeo.attributes.position.needsUpdate = true; trGeo.attributes.color.needsUpdate = true;
  }
 }

 const _tp = new THREE.Vector3();

 // ---------- the Model Build Spec interface, as the game model has it ----------
 // Hit and cue times (0 to 1) as the battle demo times them (the game model's, unchanged).
 const TIMES = {
  lunge: { hits: [0.36] }, combo: { hits: [0.17, 0.37, 0.6] },
  throw: { hits: [0.87], cues: [0.44] }, crescent: { hits: [0.733, 0.788, 0.842, 0.896, 0.95], cues: [0.18, 0.6] },
  briar: { hits: [0.613], cues: [0.45] }, mend: { hits: [0.6] },
  moon: { hits: [0.407, 0.521, 0.636], cues: [0.3, 0.389] }, summon: { cues: [0.3, 0.569] }, transform: { cues: [0.55] }
 };
 const ACTIONS = {};
 for (const n in ACTS) {
  const d = ACTS[n], q = TIMES[n] || {};
  ACTIONS[n] = Object.freeze({ dur: d.dur, hits: Object.freeze((q.hits || []).slice()), cues: Object.freeze((q.cues || []).slice()), hold: !!d.hold, interrupt: !!d.interrupt });
 }
 Object.freeze(ACTIONS);
 // named points in world space: the game model's (chest, head, hit or tip, flame, handL, handR) and, for labels and close
 // views, her parts: hatTip, horn, charm, glasses, eye, ponytail, scrunchie, coat, dress, sash, boot, necklace, bracelet, dagger
 const GLASS = rimC[1].slice(), EYE = frameAt(0.34, -0.07, 0).p;
 function anchor(name, out) {
  out = out || new THREE.Vector3();
  const at = (b, x, y, z) => { b.updateWorldMatrix(true, false); return b.localToWorld(out.set(x, y, z)); };
  switch (name) {
   case 'hit': case 'tip': dagger.updateWorldMatrix(true, false); return dagger.localToWorld(out.copy(tipL));
   case 'flame': return flame.getWorldPosition(out);
   case 'head': return at(headB, 0, 0, 0.05);
   case 'handL': return at(wrists[1], 0, -0.03, 0.002);
   case 'handR': return at(wrists[0], 0, -0.03, 0.002);
   case 'hatTip': return at(hatA2, -0.05, 0.02, 0.01);
   case 'horn': return at(hatB, 0.215, 0.115, -0.02);
   case 'charm': return at(hatB, 0, 0.085, 0.135);
   case 'glasses': return at(headB, GLASS[0], GLASS[1], GLASS[2]);
   case 'eye': return at(headB, EYE[0], EYE[1], EYE[2]);
   case 'ponytail': return at(hairB, 0, -0.06, -0.02);
   case 'scrunchie': return at(hairA, 0, -0.01, -0.012);
   case 'coat': return at(coatL[1], 0, -0.1, 0.02);
   case 'dress': return at(pelvis, 0.08, -0.62, 0.22);
   case 'sash': return at(pelvis, 0.012, 0.035, 0.104);
   case 'boot': return at(knees[1], 0, -0.2, 0.05);
   case 'necklace': return at(chest, 0, 1.145 - chB[1], 0.128);
   case 'bracelet': return at(elbows[1], 0, -0.19, 0);
   case 'dagger': return at(dagger, 0, 0, 0.15);
   default: return chest.getWorldPosition(out);
  }
 }
 // state: trance (0 to 1) brings in the starlight cloak, ghost wings and crescent aura (the same as m.trance)
 const state = {};
 Object.defineProperty(state, 'trance', { enumerable: true, get: () => trance, set: (v) => { trance = cl(v, 0, 1); } });
 // a party member does not fade; at 0 she is hidden, anything above shows her
 let fade = 1;
 function setFade(f) {
  const was = fade > 0.001; fade = cl(Number.isFinite(+f) ? +f : 1, 0, 1);
  const now = fade > 0.001; if (now !== was) { root.visible = now; fx.visible = now; }
 }

 return {
  root, skeleton, bones, animate, flameLight: fLight, flame, fx,
  play, cast() { return play('cast'); }, lunge() { return play('lunge'); }, moonlight() { return play('moon'); },
  guard(on) { guardOn = !!on; },
  reset() { act = null; guardOn = false; gW = 0; trance = 0; },
  set trance(v) { trance = cl(v, 0, 1); }, get trance() { return trance; },
  ACTIONS, anchor, setFade, get fade() { return fade; },
  get state() { return state; }, set state(v) { if (v) Object.assign(state, v); },
  get busy() { return !!act && !(act.def.hold && act.t >= act.dur); },
  get action() { return act ? act.type : ''; },
  get casting() { return !!act && act.type === 'cast'; },
  get progress() { return act ? Math.min(1, act.t / act.dur) : -1; },
  get dash() { return dashV; },
  get lift() { return liftV; },
  get moon() { return moonKv; },
  tip(out) { return dagger.localToWorld((out || _tp).copy(tipL)); },
  flamePos(out) { return flame.getWorldPosition(out || _tp); },
  chestPos(out) { return chest.getWorldPosition(out || _tp); },
  // for the study page: the rim's strength (0 to 1), and the detail it was built at
  set rim(v) { U.rim.value = .3 * cl(v, 0, 2); }, detail: DET, strands: HAIR_STRANDS
 };
}
