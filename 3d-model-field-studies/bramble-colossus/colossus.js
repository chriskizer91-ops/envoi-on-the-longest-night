// colossus.js: the Bramble Colossus, field-study version (the reference model). three.js r128 (global THREE).
// Defines makeBrambleColossus(opts) only, with the same interface, moves, hit times and anchors as the game's model
// (3d-model-new-character-ideas/bramble-colossus/colossus.js), so it can stand in for it unchanged.
//
// What it is: a blackberry thicket that hunts, grown as big as a house over a century or more. A mound of twisted roots,
// a spire of three old canes braided round each other, and on top a thorned bud taller than a person that opens into a
// five-petalled flower round its heart, a glowing blackberry the size of a barrel. Four great canes grow from the spire:
// the two in front are its arms, the two behind arch back like a mane. Six more arch out over the soil as its legs. It has
// no face: the bud turns toward its prey, gapes and feeds, and each heartbeat runs down the spire into its roots.
//
// This version keeps that body, its rig and every move, and rebuilds how it looks at the level of detail a laptop can
// draw, thinking about what it is in the world: it lives where Noctara's cold comes down off the frozen pass, and its
// heart is warm. So its breath steams in the night air, frost furs the tips of its outermost canes and leaves but never
// the ones near its heart, and its roots run on far under the meadow (state.xray shows them, with the heartbeat running
// out along them). Everything is built from what a real blackberry is made of: five-angled canes with a waxy bloom and
// hooked prickles flattened at the base, compound leaves of three and five toothed leaflets that are paler and felted
// underneath and glow when the moon is behind them, fruit at every stage from hard green to glossy black with the dry
// styles still on each drupelet, old grey dead canes tangled through the mound, and a flower with crinkled petals and a
// crowd of stamens.
//
// opts: { detail .25 to 1 (1, the default, is the laptop reference; .5 is about a third of its triangles; .25 is near the
//         game's budget), level 1 to 20 (bigger, darker, longer thorns, veins that glow at rest), size (an extra overall
//         scale; 1 = about 7.5 m tall and 11 m across at rest, its arms reaching 9 m), shadows (true: it casts and takes
//         shadows, with depth materials that match its cuts and fades), linear (default true: colours are painted for a
//         linear, tone-mapped renderer; false for the game's plain one) }
function makeBrambleColossus(opts) {
 'use strict';
 // Units are meters, Y up, facing +Z, the mound on the ground at the origin. Its right side is -X; the lead arm (the one
 // that lances) is the front great cane on its right.
 opts = opts || {};
 const DET = Math.max(.25, Math.min(1, opts.detail === undefined ? 1 : +opts.detail || 1));
 const Q = (n, m) => Math.max(m || 3, Math.round(n * DET));
 const TAU = Math.PI * 2, PI = Math.PI;
 let seed = 90217;
 const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
 const rr = (a, b) => a + (b - a) * rnd();
 let seed2 = 4471;
 const rnd2 = () => (seed2 = (seed2 * 16807) % 2147483647) / 2147483647;
 const r2 = (a, b) => a + (b - a) * rnd2();
 let seed3 = 31337; // a third stream for the fine detail (prickles, drupelets, hairs), so its counts never shift the rest
 const rnd3 = () => (seed3 = (seed3 * 16807) % 2147483647) / 2147483647;
 const r3 = (a, b) => a + (b - a) * rnd3();
 const cl = (v, a, b) => (v < a ? a : v > b ? b : v);
 const sm = (a, b, x) => { const t = cl((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
 const lerp = (a, b, t) => a + (b - a) * t;
 const win = (u, a, b, e) => sm(a - e, a + e, u) * (1 - sm(b - e, b + e, u));
 const V3 = (x, y, z) => new THREE.Vector3(x || 0, y || 0, z || 0);
 const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
 const YAX = V3(0, 1, 0);
 // colour: everything is painted and listed in sRGB as an artist would pick it; LIN turns vertex colours linear for a
 // tone-mapped renderer, and marks painted colour maps as sRGB so the renderer decodes them
 const LIN = opts.linear !== false;
 const lin1 = (v) => (LIN ? Math.pow(cl(v, 0, 8), 2.2) : v);
 const lc = (c) => [lin1(c[0]), lin1(c[1]), lin1(c[2])];
 const C3 = (r, g, b) => new THREE.Color(lin1(r), lin1(g), lin1(b));
 const tex = (c, rx, ry, data) => {
  const t = new THREE.CanvasTexture(c);
  if (rx) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry || rx); }
  t.anisotropy = 8; if (LIN && !data) t.encoding = THREE.sRGBEncoding;
  return t;
 };
 const dataTex = (c, rx, ry) => tex(c, rx, ry, true);

 // ---------- its size and the level look ----------
 const LEVEL = cl(opts.level === undefined ? 1 : Math.round(+opts.level) || 1, 1, 20), TIER = (LEVEL - 1) / 19;
 const SZ = (1 + .1 * TIER) * (opts.size > 0 ? +opts.size : 1);
 const CR = 2.1, CH = 1.4, MOSS = .4;                  // the root mound: radius, height, moss
 const NS = 10;                                        // a cane's segments: NS + 1 bones
 const SPN = 6, SPH = CH * .55, SPL = 4.3, SPS = SPL / SPN, BY = SPH + SPL + .1; // the spire: segments, where it starts, its length; BY the bud's base
 const DARK = 1 - .16 * TIER, THS = 1 + .3 * TIER, VEIN = .3 + .5 * sm(.3, 1, TIER);
 const REACH = 8.2;                                    // where its prey stands, from its middle
 const WARM = 4.5, COLD = 9.5;                         // frost: none within WARM of its middle, full past COLD (body meters)

 const root = new THREE.Group(); root.name = 'BrambleColossus';
 const base = new THREE.Group(); root.add(base);       // everything of the body, scaled by SZ
 const fx = new THREE.Group(); fx.name = root.name + 'FX';
 // ---------- painted textures ----------
 // Each surface is painted twice in step: its colour, and a height field (white stands up, black sinks) that becomes its
 // normal map, so ridges, fissures and veins catch the moonlight where they really are.
 const TS = DET > .6 ? 1 : .5;                         // texture size: halved below detail .6
 const css = (r, g, b, a) => `rgba(${r | 0},${g | 0},${b | 0},${a === undefined ? 1 : a})`;
 const hgt = (v, a) => css(v * 255, v * 255, v * 255, a === undefined ? 1 : a);
 function pair(W, H, col, h0) {
  const c = cvs(W, H), g = c.getContext('2d'), hc = cvs(W, H), h = hc.getContext('2d');
  g.fillStyle = col; g.fillRect(0, 0, W, H); h.fillStyle = hgt(h0 === undefined ? .5 : h0); h.fillRect(0, 0, W, H);
  return { c, g, hc, h, W, H };
 }
 // draw f(ctx, ox, oy) once per neighbouring tile, so marks that cross an edge come back on the other side
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

 // young cane bark: wine-plum, streaked along its length, with the bluish waxy bloom blackberry canes wear (rubbed thin on
 // the ridges), pale lenticels across it and a few healed splits. u runs round the cane (its five ridges are geometry),
 // v along it
 const BARK = (() => {
  const W = 512 * TS, H = 1024 * TS, P = pair(W, H, css(60 * DARK, 23 * DARK, 31 * DARK)), g = P.g, h = P.h, k = TS;
  const streak = (x, w, col, a, hv, ha) => tiled(W, H, (ox) => {
   const gr = g.createLinearGradient(x + ox - w, 0, x + ox + w, 0); gr.addColorStop(0, css(...col, 0)); gr.addColorStop(.5, css(...col, a)); gr.addColorStop(1, css(...col, 0)); g.fillStyle = gr; g.fillRect(x + ox - w, 0, w * 2, H);
   if (ha) { const hr = h.createLinearGradient(x + ox - w, 0, x + ox + w, 0); hr.addColorStop(0, hgt(hv, 0)); hr.addColorStop(.5, hgt(hv, ha)); hr.addColorStop(1, hgt(hv, 0)); h.fillStyle = hr; h.fillRect(x + ox - w, 0, w * 2, H); }
  });
  const tones = [[86, 34, 40], [34, 12, 18], [70, 58, 40], [104, 48, 44], [50, 18, 32], [62, 30, 50]];
  for (let i = 0; i < 70; i++) streak(rnd() * W, (1 + rnd() * 7) * k, tones[i % 6].map((v) => v * DARK), .12 + rnd() * .22, rnd() < .5 ? .6 : .4, .2);
  // mottling, so no streak runs too evenly
  for (let i = 0; i < 500 * TS; i++) { const x = rnd() * W, y = rnd() * H, r = (6 + rnd() * 30) * k, c = rnd() < .5 ? 'rgba(20,6,12,.12)' : 'rgba(110,60,60,.07)'; tiled(W, H, (ox, oy) => { g.fillStyle = c; g.beginPath(); g.ellipse(x + ox, y + oy, r * .5, r * 1.6, 0, 0, TAU); g.fill(); }); }
  // the waxy bloom: long soft bluish-grey bands
  for (let i = 0; i < 26; i++) { const x = rnd() * W, y = rnd() * H, w = (10 + rnd() * 40) * k, l = (80 + rnd() * 380) * k; tiled(W, H, (ox, oy) => { const q = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, w); q.addColorStop(0, css(126, 116, 140, .12)); q.addColorStop(1, css(126, 116, 140, 0)); g.save(); g.translate(x + ox, y + oy); g.scale(1, l / w); g.translate(-x - ox, -y - oy); g.fillStyle = q; g.fillRect(x + ox - w, y + oy - w, w * 2, w * 2); g.restore(); }); }
  // fine fibres
  g.lineCap = h.lineCap = 'round';
  for (let i = 0; i < 900; i++) {
   const x = rnd() * W, y = rnd() * H, l = (20 + rnd() * 120) * k, dk = rnd() < .55, w = (.5 + rnd() * 1.1) * k;
   tiled(W, H, (ox, oy) => {
    g.strokeStyle = dk ? 'rgba(24,8,14,.22)' : 'rgba(150,96,96,.08)'; g.lineWidth = w; g.beginPath(); g.moveTo(x + ox, y + oy); g.bezierCurveTo(x + ox + (rnd() - .5) * 3, y + oy + l * .3, x + ox + (rnd() - .5) * 3, y + oy + l * .7, x + ox, y + oy + l); g.stroke();
    h.strokeStyle = dk ? 'rgba(0,0,0,.18)' : 'rgba(255,255,255,.12)'; h.lineWidth = w * 1.4; h.beginPath(); h.moveTo(x + ox, y + oy); h.lineTo(x + ox, y + oy + l); h.stroke();
   });
  }
  // lenticels: short pale dashes across the cane, raised, each with a dark lip below
  for (let i = 0; i < 420 * TS; i++) {
   const x = rnd() * W, y = rnd() * H, w = (3 + rnd() * 7) * k, t = (1 + rnd() * 1.2) * k;
   tiled(W, H, (ox, oy) => { g.fillStyle = 'rgba(176,140,120,.45)'; g.beginPath(); g.ellipse(x + ox, y + oy, w, t, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(20,6,10,.3)'; g.fillRect(x + ox - w * .8, y + oy + t, w * 1.6, t * .8); h.fillStyle = hgt(.9, .8); h.beginPath(); h.ellipse(x + ox, y + oy, w, t, 0, 0, TAU); h.fill(); });
  }
  // healed splits: short dark lens-shaped cracks with paler lips
  for (let i = 0; i < 26; i++) {
   const x = rnd() * W, y = rnd() * H, l = (30 + rnd() * 70) * k, w = (2 + rnd() * 3) * k;
   tiled(W, H, (ox, oy) => { g.fillStyle = 'rgba(150,110,96,.35)'; g.beginPath(); g.ellipse(x + ox, y + oy, w * 2.2, l * .55, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(16,6,8,.85)'; g.beginPath(); g.ellipse(x + ox, y + oy, w * .6, l * .5, 0, 0, TAU); g.fill(); h.fillStyle = hgt(.7, .6); h.beginPath(); h.ellipse(x + ox, y + oy, w * 2.2, l * .55, 0, 0, TAU); h.fill(); h.fillStyle = hgt(.05, 1); h.beginPath(); h.ellipse(x + ox, y + oy, w * .6, l * .5, 0, 0, TAU); h.fill(); });
  }
  // nodes: faint rings where a leaf once grew
  for (const ny of [.1, .43, .77]) { const y = ny * H, gr = g.createLinearGradient(0, y - 14 * k, 0, y + 14 * k); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.5, 'rgba(28,8,16,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, y - 14 * k, W, 28 * k); h.fillStyle = hgt(.62, .5); h.fillRect(0, y - 4 * k, W, 8 * k); }
  return { map: tex(P.c, 1, 1), normal: dataTex(normalFrom(blur(P.hc, .7 * k), 3.2), 1, 1) };
 })();
 // old bark, for the spire, the great canes' bases and the dead canes: grey-brown, split into long plates by deep
 // fissures, the plates' edges lifting and flaking, with crusts of grey-green lichen
 const OLDBARK = (() => {
  const W = 512 * TS, H = 1024 * TS, P = pair(W, H, css(92 * DARK, 78 * DARK, 70 * DARK), .62), g = P.g, h = P.h, k = TS;
  for (let i = 0; i < 1600 * TS; i++) { const x = rnd() * W, y = rnd() * H, s = (2 + rnd() * 9) * k, c = rnd() < .5 ? 'rgba(60,46,40,.25)' : 'rgba(150,134,120,.16)'; tiled(W, H, (ox, oy) => { g.fillStyle = c; g.fillRect(x + ox, y + oy, s * .4, s * 2.5); }); }
  // fissures: long wandering dark grooves, each drawn as a dark core in a soft groove
  g.lineCap = h.lineCap = 'round'; g.lineJoin = h.lineJoin = 'round';
  for (let i = 0; i < 46; i++) {
   const pts = []; let x = rnd() * W, y = -40 * k; const w = (2 + rnd() * 5) * k;
   while (y < H + 40 * k) { pts.push([x, y]); y += (10 + rnd() * 26) * k; x += (rnd() - .5) * 14 * k; }
   const line = (ctx, ox, wd) => { ctx.beginPath(); pts.forEach((p, j) => (j ? ctx.lineTo(p[0] + ox, p[1]) : ctx.moveTo(p[0] + ox, p[1]))); ctx.lineWidth = wd; ctx.stroke(); };
   for (const ox of [-W, 0, W]) { g.strokeStyle = 'rgba(40,30,26,.5)'; line(g, ox, w * 2.6); g.strokeStyle = 'rgba(14,10,9,.95)'; line(g, ox, w); h.strokeStyle = hgt(.3, .7); line(h, ox, w * 3.2); h.strokeStyle = hgt(0, 1); line(h, ox, w * 1.1); }
  }
  // the plates' lifted edges (a light rim on one side) and crossing cracks
  for (let i = 0; i < 260 * TS; i++) { const x = rnd() * W, y = rnd() * H, l = (8 + rnd() * 26) * k; tiled(W, H, (ox, oy) => { g.strokeStyle = 'rgba(186,170,150,.4)'; g.lineWidth = 1.4 * k; g.beginPath(); g.moveTo(x + ox, y + oy); g.lineTo(x + ox + l, y + oy + (rnd() - .5) * 4 * k); g.stroke(); g.strokeStyle = 'rgba(12,8,8,.6)'; g.lineWidth = 1.2 * k; g.beginPath(); g.moveTo(x + ox, y + oy + 2 * k); g.lineTo(x + ox + l, y + oy + 2 * k); g.stroke(); h.strokeStyle = hgt(.12, .9); h.lineWidth = 2 * k; h.beginPath(); h.moveTo(x + ox, y + oy + 2 * k); h.lineTo(x + ox + l, y + oy + 2 * k); h.stroke(); }); }
  // lichen: pale grey-green crusts with a darker ring
  for (let i = 0; i < 70 * TS; i++) { const x = rnd() * W, y = rnd() * H, r = (6 + rnd() * 22) * k; tiled(W, H, (ox, oy) => { const q = g.createRadialGradient(x + ox, y + oy, r * .2, x + ox, y + oy, r); q.addColorStop(0, 'rgba(150,160,124,.55)'); q.addColorStop(.75, 'rgba(118,130,96,.45)'); q.addColorStop(1, 'rgba(118,130,96,0)'); g.fillStyle = q; g.fillRect(x + ox - r, y + oy - r, r * 2, r * 2); h.fillStyle = hgt(.7, .3); h.beginPath(); h.arc(x + ox, y + oy, r * .8, 0, TAU); h.fill(); }); }
  return { map: tex(P.c, 1, 1), normal: dataTex(normalFrom(blur(P.hc, .8 * k), 4), 1, 1) };
 })();
 // root wood: grey-brown fibres twisting round old roots, soil in the crevices, moss here and there
 const WOOD = (() => {
  const W = 512 * TS, H = 512 * TS, P = pair(W, H, '#4c3a2c', .5), g = P.g, h = P.h, k = TS;
  g.lineCap = h.lineCap = 'round';
  for (let i = 0; i < 260; i++) {
   const x = rnd() * W, col = rnd(), wd = (1 + rnd() * 5) * k, hv = col < .45 ? .15 : .8;
   g.strokeStyle = col < .45 ? 'rgba(22,15,10,.32)' : col < .8 ? 'rgba(112,88,64,.22)' : 'rgba(150,128,100,.16)';
   h.strokeStyle = hgt(hv, .5);
   // a 45-degree twist with a wobble that repeats every H, so the texture tiles both ways
   for (const ox of [-2 * W, -W, 0, W]) for (const ctx of [g, h]) { ctx.lineWidth = ctx === h ? wd * 1.3 : wd; ctx.beginPath(); for (let y = 0; y <= H; y += 4 * k) { const xx = x + ox + y + Math.sin(y * TAU / H * 3 + i) * 5 * k; if (y) ctx.lineTo(xx, y); else ctx.moveTo(xx, y); } ctx.stroke(); }
  }
  for (let i = 0; i < 2600 * TS; i++) { g.fillStyle = rnd() < .6 ? 'rgba(0,0,0,.2)' : 'rgba(170,140,110,.1)'; g.fillRect(rnd() * W, rnd() * H, k, (2 + rnd() * 5) * k); }
  for (let i = 0; i < 160; i++) { const x = rnd() * W, y = rnd() * H, r = (10 + rnd() * 40) * k, c = rnd() < .5 ? 'rgba(18,12,8,.18)' : 'rgba(120,100,80,.1)'; tiled(W, H, (ox, oy) => { g.fillStyle = c; g.beginPath(); g.arc(x + ox, y + oy, r, 0, TAU); g.fill(); }); }
  for (let i = 0; i < 70 * MOSS; i++) { const x = rnd() * W, y = rnd() * H, r = (8 + rnd() * 26) * k; tiled(W, H, (ox, oy) => { const q = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r); q.addColorStop(0, 'rgba(78,100,44,.6)'); q.addColorStop(1, 'rgba(78,100,44,0)'); g.fillStyle = q; g.fillRect(x - r + ox, y - r + oy, r * 2, r * 2); }); }
  return { map: tex(P.c, 1, 1), normal: dataTex(normalFrom(blur(P.hc, .8 * k), 3.4), 1, 1) };
 })();

 // leaflets: an atlas of four, each in its own square with its base at the bottom middle and its tip at the top, the shape
 // in the alpha (doubly toothed, the long point blackberry leaflets have): 0 a dark glossy winter-green one, 1 one turned
 // wine-red by the cold, 2 a young bronze one, 3 a dead brown one with holes. The underside is the shader's (paler, felted)
 const LEAF = (() => {
  const S = 1024 * TS, k = TS, c = cvs(S * 2, S * 2), g = c.getContext('2d'), hc = cvs(S * 2, S * 2), h = hc.getContext('2d');
  h.fillStyle = hgt(.5); h.fillRect(0, 0, S * 2, S * 2);
  const PAL = [
   { d: [18, 36, 20], m: [34, 64, 32], l: [66, 104, 48], v: [118, 156, 86], e: [60, 30, 40] },
   { d: [52, 12, 26], m: [92, 24, 40], l: [128, 52, 58], v: [166, 104, 96], e: [40, 8, 20] },
   { d: [64, 30, 14], m: [104, 58, 26], l: [146, 98, 50], v: [188, 150, 96], e: [80, 34, 20] },
   { d: [54, 38, 22], m: [88, 64, 36], l: [120, 92, 56], v: [150, 122, 80], e: [60, 40, 24] }];
  for (let cell = 0; cell < 4; cell++) {
   const P = PAL[cell], ox = (cell % 2) * S, oy = Math.floor(cell / 2) * S, len = S * .94, wid = S * .6, x0 = ox + S / 2, y0 = oy + S - S * .03;
   const teeth = 22, half = (f) => .5 * wid * Math.pow(Math.sin(PI * Math.pow(f, .72)), .8) * (1 - .3 * Math.pow(f, 4)) * (f > .86 ? 1 - .55 * sm(.86, 1, f) : 1);
   const tooth = (f, sd) => { const q = f * teeth + (sd > 0 ? 0 : .5), fr = q - Math.floor(q), big = Math.floor(q) % 2 === 0; return f < .05 || f > .97 ? 0 : wid * (big ? .05 : .028) * Math.pow(fr, 1.8); };
   const pts = []; const N = 220;
   for (let i = 0; i <= N; i++) { const f = i / N; pts.push([half(f) + tooth(f, 1), f * len]); }
   for (let i = N; i >= 0; i--) { const f = i / N; pts.push([-half(f) - tooth(f, -1), f * len]); }
   const path = (ctx) => { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(x0 + p[0], y0 - p[1]) : ctx.moveTo(x0 + p[0], y0 - p[1]))); ctx.closePath(); };
   g.save(); h.save(); path(g); g.clip(); path(h); h.clip();
   const gr = g.createLinearGradient(0, y0, 0, y0 - len); gr.addColorStop(0, css(...P.d)); gr.addColorStop(.3, css(...P.m)); gr.addColorStop(1, css(...P.m.map((v, i) => lerp(v, P.l[i], .3))));
   g.fillStyle = gr; g.fillRect(ox, oy, S, S);
   // blistered tissue between the veins: each panel bulges (light in colour, high in height) and creases at the veins
   const nv = 10, lat = [];
   for (let q = 0; q < nv; q++) { const f = .06 + q / nv * .84; lat.push(f); }
   for (const f of lat) for (const sd of [-1, 1]) {
    const hw = half(f + .04), bx = x0 + sd * hw * .5, by = y0 - (f + .05) * len, r = Math.max(4, hw * .5);
    let q = g.createRadialGradient(bx, by, 0, bx, by, r); q.addColorStop(0, css(...P.l, .4)); q.addColorStop(1, css(...P.l, 0)); g.fillStyle = q; g.fillRect(bx - r, by - r, r * 2, r * 2);
    q = h.createRadialGradient(bx, by, 0, bx, by, r); q.addColorStop(0, hgt(.85, .8)); q.addColorStop(1, hgt(.5, 0)); h.fillStyle = q; h.fillRect(bx - r, by - r, r * 2, r * 2);
   }
   // mottling, and the cold's wine-dark blotches on the green
   for (let i = 0; i < 260; i++) { const x = ox + rnd() * S, y = oy + rnd() * S, r = (2 + rnd() * 9) * k; g.fillStyle = rnd() < .5 ? css(...P.d, .16) : css(...P.l, .1); g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
   if (cell === 0) for (let i = 0; i < 9; i++) { const x = ox + rr(.2, .8) * S, y = oy + rr(.1, .7) * S, r = rr(30, 90) * k, q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, 'rgba(86,20,50,.45)'); q.addColorStop(1, 'rgba(86,20,50,0)'); g.fillStyle = q; g.fillRect(x - r, y - r, r * 2, r * 2); }
   if (cell === 1) for (let i = 0; i < 6; i++) { const x = ox + rr(.25, .75) * S, y = oy + rr(.2, .8) * S, r = rr(40, 100) * k, q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, 'rgba(60,52,24,.35)'); q.addColorStop(1, 'rgba(60,52,24,0)'); g.fillStyle = q; g.fillRect(x - r, y - r, r * 2, r * 2); }
   // the vein net: a midrib, ten pairs of laterals running out to the big teeth, and a fine net between them
   g.lineCap = h.lineCap = 'round';
   const lateral = (ctx, sd, f, w) => { const yb = y0 - f * len, hw = half(Math.min(.98, f + .1)); ctx.beginPath(); ctx.moveTo(x0, yb); ctx.quadraticCurveTo(x0 + sd * hw * .5, yb - len * .04, x0 + sd * hw * .97, yb - len * .13); ctx.lineWidth = w; ctx.stroke(); };
   ctx2(g, h, (ctx, isH) => {
    ctx.strokeStyle = isH ? hgt(.2, .9) : css(...P.d, .7); for (const f of lat) for (const sd of [-1, 1]) lateral(ctx, sd, f, (isH ? 9 : 7) * k);
    ctx.strokeStyle = isH ? hgt(.62, 1) : css(...P.v, .75); for (const f of lat) for (const sd of [-1, 1]) lateral(ctx, sd, f, 2.4 * k);
    ctx.strokeStyle = isH ? hgt(.15, 1) : css(...P.d, .75); ctx.lineWidth = 12 * k; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 - len * .97); ctx.stroke();
    ctx.strokeStyle = isH ? hgt(.72, 1) : css(...P.v, .92); ctx.lineWidth = 4.5 * k; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 - len * .97); ctx.stroke();
   });
   for (let i = 0; i < 700 * TS; i++) { // the fine net: short crooked links between laterals
    const f = rr(.08, .92), sd = rnd() < .5 ? -1 : 1, hw = half(f), x = x0 + sd * hw * rr(.1, .9), y = y0 - f * len, a = rr(-1, 1) + (rnd() < .5 ? 0 : PI / 2), l = rr(6, 18) * k;
    g.strokeStyle = css(...P.d, .3); g.lineWidth = 1.4 * k; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    h.strokeStyle = hgt(.35, .5); h.lineWidth = 2 * k; h.beginPath(); h.moveTo(x, y); h.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); h.stroke();
   }
   // a glossy band along one side of the midrib, and a dark, then pale, rim round the edge
   const sh = g.createLinearGradient(x0 - wid * .5, 0, x0 + wid * .5, 0); sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(.6, 'rgba(230,255,220,.08)'); sh.addColorStop(.72, 'rgba(255,255,255,0)'); g.fillStyle = sh; g.fillRect(ox, oy, S, S);
   if (cell === 3) { // dead: dark rot spreading from the edges, and holes eaten through it
    for (let i = 0; i < 60; i++) { const x = ox + rnd() * S, y = oy + rnd() * S, r = (8 + rnd() * 40) * k; g.fillStyle = rnd() < .6 ? 'rgba(46,30,16,.35)' : 'rgba(170,140,90,.18)'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
    g.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 14; i++) { const f = rr(.15, .85), x = x0 + (rnd() - .5) * half(f) * 1.4, y = y0 - f * len, r = rr(6, 22) * k; g.beginPath(); g.ellipse(x, y, r, r * rr(.6, 1.2), rnd() * 3, 0, TAU); g.fill(); } g.globalCompositeOperation = 'source-over';
   }
   g.restore(); h.restore();
   path(g); g.strokeStyle = css(...P.e, .9); g.lineWidth = 5 * k; g.stroke(); g.strokeStyle = css(...P.l, .5); g.lineWidth = 1.6 * k; g.stroke();
  }
  function ctx2(a, b, f) { f(a, false); f(b, true); }
  const t = tex(c); t.generateMipmaps = true;
  return { map: t, normal: dataTex(normalFrom(blur(hc, 1.2 * k), 2.6)) };
 })();

 // the flower: an atlas of two halves, each with its base at the bottom and its shape in the alpha. Left, a petal: broad,
 // crinkled like tissue, rose at its edge deepening to crimson and a near-black throat, veins fanning out of the throat.
 // Right, a sepal: felted wine-plum, a pale midrib, drawn out to a long point (its inside is the shader's crimson)
 const BLOOM = (() => {
  const S = 1024 * TS, k = TS, c = cvs(S * 2, S), g = c.getContext('2d'), hc = cvs(S * 2, S), h = hc.getContext('2d');
  h.fillStyle = hgt(.5); h.fillRect(0, 0, S * 2, S);
  const shape = (ctx, cx, wf) => { ctx.beginPath(); for (let i = 0; i <= 256; i++) { const f = i <= 128 ? i / 128 : (256 - i) / 128, sd = i <= 128 ? 1 : -1, x = cx + sd * wf(f, sd), y = S - 3 - f * (S - 8); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.closePath(); };
  const petal = (f, sd) => S * .47 * Math.pow(Math.sin(PI * (.06 + .94 * f)), .45) * (.35 + .65 * Math.sqrt(f)) + S * .008 * Math.sin(f * 60 + sd) + S * .012 * Math.sin(f * 17 + sd * 2);
  const sepal = (f) => S * .41 * Math.pow(Math.sin(PI * Math.min(1, .05 + f * .97)), .9) * (1 - .45 * Math.pow(f, 1.4));
  g.save(); shape(g, S / 2, petal); g.clip(); h.save(); shape(h, S / 2, petal); h.clip();
  let q = g.createRadialGradient(S / 2, S, 0, S / 2, S, S * .98); q.addColorStop(0, '#10010a'); q.addColorStop(.16, '#420516'); q.addColorStop(.42, '#801232'); q.addColorStop(.78, '#b23a5a'); q.addColorStop(1, '#d87892');
  g.fillStyle = q; g.fillRect(0, 0, S, S);
  // crinkles: long soft wavy ridges across the petal, like crumpled tissue
  for (let i = 0; i < 700; i++) { const x = rnd() * S, y = rnd() * S, a = (rnd() - .5) * .8, l = (30 + rnd() * 120) * k, w = (3 + rnd() * 9) * k, dk = rnd() < .5; g.fillStyle = dk ? 'rgba(60,6,24,.07)' : 'rgba(255,210,220,.06)'; g.beginPath(); g.ellipse(x, y, l, w, a, 0, TAU); g.fill(); h.fillStyle = hgt(dk ? .32 : .7, .25); h.beginPath(); h.ellipse(x, y, l, w, a, 0, TAU); h.fill(); }
  g.lineCap = h.lineCap = 'round';
  for (let i = 0; i < 90; i++) { const a = (i / 89 - .5) * 2.7, l = S * rr(.45, .97), w = rr(1.4, 3.6) * k, al = rr(.2, .5); const pts = []; for (let j = 0; j <= 12; j++) pts.push([S / 2 + Math.sin(a) * l * j / 12 + rr(-3, 3) * k, S - 4 - Math.cos(a * .72) * l * j / 12]);
   g.strokeStyle = 'rgba(56,2,18,' + al.toFixed(2) + ')'; g.lineWidth = w; g.beginPath(); pts.forEach((p, j) => (j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke();
   h.strokeStyle = hgt(.66, .6); h.lineWidth = w * 1.5; h.beginPath(); pts.forEach((p, j) => (j ? h.lineTo(p[0], p[1]) : h.moveTo(p[0], p[1]))); h.stroke(); }
  g.restore(); h.restore();
  g.save(); shape(g, S * 1.5, sepal); g.clip(); h.save(); shape(h, S * 1.5, sepal); h.clip();
  q = g.createLinearGradient(S, 0, S * 2, 0); q.addColorStop(0, '#3a1020'); q.addColorStop(.5, '#5e2236'); q.addColorStop(1, '#3a1020'); g.fillStyle = q; g.fillRect(S, 0, S, S);
  for (let i = 0; i < 9000 * TS; i++) { const x = S + rnd() * S, y = rnd() * S, l = (2 + rnd() * 6) * k, a = rnd() * TAU, dk = rnd() < .5; g.strokeStyle = dk ? 'rgba(16,4,8,.35)' : 'rgba(200,140,150,.15)'; g.lineWidth = k; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); h.fillStyle = hgt(dk ? .4 : .62, .4); h.fillRect(x, y, k * 1.5, k * 1.5); }
  g.strokeStyle = 'rgba(206,160,140,.55)'; g.lineWidth = 14 * k; g.beginPath(); g.moveTo(S * 1.5, S); g.quadraticCurveTo(S * 1.5 + 12 * k, S * .5, S * 1.5, 10); g.stroke();
  h.strokeStyle = hgt(.8, .8); h.lineWidth = 18 * k; h.beginPath(); h.moveTo(S * 1.5, S); h.quadraticCurveTo(S * 1.5 + 12 * k, S * .5, S * 1.5, 10); h.stroke();
  g.restore(); h.restore();
  shape(g, S * 1.5, sepal); g.strokeStyle = 'rgba(154,88,100,.7)'; g.lineWidth = 18 * k; g.stroke();
  return { map: tex(c), normal: dataTex(normalFrom(blur(hc, 1 * k), 2.4)) };
 })();

 // the soil under the mound: dark earth fading out, crumbs, pebbles, fallen leaves and bits of dead cane
 const soilMap = (() => {
  const S = 1024 * TS, k = TS, c = cvs(S, S), g = c.getContext('2d'), hh = S / 2;
  const q = g.createRadialGradient(hh, hh, 0, hh, hh, hh); q.addColorStop(0, 'rgba(30,22,16,.97)'); q.addColorStop(.42, 'rgba(40,30,20,.85)'); q.addColorStop(.78, 'rgba(48,36,24,.35)'); q.addColorStop(1, 'rgba(48,36,24,0)');
  g.fillStyle = q; g.fillRect(0, 0, S, S);
  g.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < 9000 * TS; i++) { const a = rnd() * TAU, r = Math.sqrt(rnd()) * hh, x = hh + Math.cos(a) * r, y = hh + Math.sin(a) * r; g.fillStyle = rnd() < .5 ? 'rgba(12,8,5,.5)' : 'rgba(100,80,56,.32)'; g.fillRect(x, y, (1 + rnd() * 2.5) * k, (1 + rnd() * 2.5) * k); }
  for (let i = 0; i < 120; i++) { const a = rnd() * TAU, r = Math.sqrt(rnd()) * hh * .85, x = hh + Math.cos(a) * r, y = hh + Math.sin(a) * r, s = (2 + rnd() * 6) * k; g.fillStyle = 'rgba(124,112,100,.7)'; g.beginPath(); g.ellipse(x, y, s, s * .7, rnd() * 3, 0, TAU); g.fill(); g.fillStyle = 'rgba(18,12,8,.5)'; g.beginPath(); g.ellipse(x + k, y + 1.5 * k, s, s * .5, 0, 0, Math.PI); g.fill(); }
  for (let i = 0; i < 110; i++) { const a = rnd() * TAU, r = (.3 + .6 * rnd()) * hh, x = hh + Math.cos(a) * r, y = hh + Math.sin(a) * r, s = (8 + rnd() * 12) * k; g.save(); g.translate(x, y); g.rotate(rnd() * TAU); g.fillStyle = rnd() < .5 ? 'rgba(112,80,44,.7)' : rnd() < .5 ? 'rgba(96,30,40,.6)' : 'rgba(60,78,40,.55)'; g.beginPath(); g.ellipse(0, 0, s, s * .45, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(30,18,10,.5)'; g.lineWidth = k; g.beginPath(); g.moveTo(-s, 0); g.lineTo(s, 0); g.stroke(); g.restore(); }
  for (let i = 0; i < 60; i++) { const a = rnd() * TAU, r = (.25 + .65 * rnd()) * hh, x = hh + Math.cos(a) * r, y = hh + Math.sin(a) * r, l = (14 + rnd() * 40) * k, b = rnd() * TAU; g.strokeStyle = rnd() < .5 ? 'rgba(120,108,96,.6)' : 'rgba(74,52,38,.7)'; g.lineWidth = 2 * k; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(b) * l, y + Math.sin(b) * l); g.stroke(); }
  return tex(c);
 })();
 // sprites: a soft dot, a dust puff, a curl of steam, a single falling leaflet and a tongue of flame (painted pale so
 // each particle can be tinted)
 function radial(stops, s) { const c = cvs(s, s), g = c.getContext('2d'), h = s / 2, gr = g.createRadialGradient(h, h, 0, h, h, h); for (const [o, col] of stops) gr.addColorStop(o, col); g.fillStyle = gr; g.fillRect(0, 0, s, s); return tex(c); }
 const dotT = radial([[0, 'rgba(255,255,255,1)'], [.22, 'rgba(255,255,255,.6)'], [.5, 'rgba(255,255,255,.12)'], [1, 'rgba(255,255,255,0)']], 64);
 const softPuff = (n, a, seedK) => { const c = cvs(128, 128), g = c.getContext('2d'); for (let i = 0; i < n; i++) { const x = 30 + rnd() * 68, y = 30 + rnd() * 68, r = 10 + rnd() * 26, q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, 'rgba(255,255,255,' + a + ')'); q.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = q; g.fillRect(0, 0, 128, 128); } const m = g.createRadialGradient(64, 64, 24, 64, 64, 63); m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)'); g.globalCompositeOperation = 'destination-in'; g.fillStyle = m; g.fillRect(0, 0, 128, 128); return tex(c); };
 const puffT = softPuff(30, .24), steamT = softPuff(46, .14);
 const leafT = (() => { const c = cvs(64, 64), g = c.getContext('2d'); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(32, 62); g.bezierCurveTo(6, 44, 10, 14, 32, 2); g.bezierCurveTo(54, 14, 58, 44, 32, 62); g.fill(); g.strokeStyle = 'rgba(150,150,150,.8)'; g.lineWidth = 2; g.beginPath(); g.moveTo(32, 60); g.lineTo(32, 6); g.stroke(); return tex(c); })();
 const flameT = (() => {
  const S = 128, c = cvs(S, S), g = c.getContext('2d');
  for (const [w, a] of [[30, .35], [20, .6], [11, 1]]) {
   g.beginPath(); g.moveTo(64, 6); g.bezierCurveTo(64 + w * .5, 40, 64 + w, 78, 64 + w * .7, 104); g.quadraticCurveTo(64, 128, 64 - w * .7, 104); g.bezierCurveTo(64 - w, 78, 64 - w * .5, 40, 64, 6);
   const q = g.createLinearGradient(0, 0, 0, S); q.addColorStop(0, 'rgba(255,255,255,0)'); q.addColorStop(.55, 'rgba(255,255,255,' + a * .7 + ')'); q.addColorStop(.85, 'rgba(255,255,255,' + a + ')'); q.addColorStop(1, 'rgba(255,255,255,' + a * .5 + ')');
   g.fillStyle = q; g.fill();
  }
  return tex(c);
 })();
 // the ground splitting, painted into three channels: red the fissure and the cracks off it, green the glowing root that
 // runs along the bottom of it, blue the lips of torn-up earth either side (the strip is about 1 m wide)
 const crackT = (() => {
  const W = 1024, H = 256, c = cvs(W, H), g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'lighter'; g.lineCap = g.lineJoin = 'round';
  const line = [], fork = [];
  for (let x = 0, y = H / 2; x <= W; x += 12) { y = cl(y + r2(-12, 12), H * .38, H * .62); line.push([x, y]); if (x > 60 && x < W - 100 && rnd2() < .3) fork.push([x, y]); }
  const stroke = (pts, col, w, oy) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1] + (oy || 0)) : g.moveTo(p[0], p[1] + (oy || 0)))); g.stroke(); };
  stroke(line, 'rgba(0,0,255,.35)', 44, -34); stroke(line, 'rgba(0,0,255,.35)', 44, 34);
  for (const [x, y] of fork) { const pts = [[x, y]]; let px = x, py = y; const a = (rnd2() < .5 ? -1 : 1) * r2(.6, 1.2); for (let i = 0; i < 6; i++) { px += 14 + rnd2() * 12; py += Math.sin(a) * (10 + rnd2() * 10); pts.push([px, py]); } stroke(pts, 'rgba(255,0,0,.75)', 10); stroke(pts, 'rgba(0,0,255,.2)', 22); }
  stroke(line, 'rgba(255,0,0,.6)', 56); stroke(line, 'rgba(255,0,0,.95)', 30);
  stroke(line, 'rgba(0,255,0,.45)', 20); stroke(line, 'rgba(0,255,0,1)', 7);
  return dataTex(c);
 })();
 // ---------- materials ----------
 // Shader additions shared by the body: a dissolve that burns away with a glowing edge, a clean break through a severed
 // cane, leaves that rustle, thin out (state.wilt) and wither, a faint cool rim, veins that glow from the crevices (uVein:
 // x feeding, y where a pulse has run to, z its strength, w the glow at rest), char from fire, a cut at the ground it
 // rises through (uClip), leaves that redden in its wrath, sepals and petals lit from inside by the heart, and the heart
 // glowing through its drupelets. New in this version:
 //  - light through leaves and petals: moonlight (or the heart's light) from behind a leaf passes through it, warmed and
 //    tinted by it, and a leaf seen against the moon glows; shadowed leaves stay dark, since the shadowed light is used;
 //  - frost: rime on the upper faces of everything far enough from its warm heart (uFrost; none within WARM meters of its
 //    middle, full past COLD), glinting as the camera moves;
 //  - old bark: the spire, the great canes' bases and the dead canes blend into grey fissured bark (aOld);
 //  - the leaves' undersides are paler, matte and felted, as a bramble's are;
 //  - depth materials for shadows that match every cut, fade, sway and leaf shape.
 const MAXC = 10;
 const U = {
  time: { value: 0 }, flut: { value: 1 }, dis: { value: 0 }, disCol: { value: new THREE.Color(0xffa040) }, with: { value: 0 }, thin: { value: 0 },
  rim: { value: .16 }, rimC: { value: new THREE.Color(0x8c8ab8) }, cut: { value: Array.from({ length: MAXC }, () => new THREE.Vector4(2, 2, 0, 0)) },
  vein: { value: new THREE.Vector4(0, -1, 0, VEIN) }, veinC: { value: new THREE.Color(1, .14, .42) }, char: { value: 0 }, burn: { value: 0 },
  clip: { value: -1e4 }, wrath: { value: 0 }, hb: { value: .5 }, heartC: { value: new THREE.Color(1, .16, .36) },
  frost: { value: opts.frost === undefined ? .55 : +opts.frost }, ctr: { value: V3() }, warm: { value: V3(WARM, COLD, 1) }, trans: { value: 1 }
 };
 const NOISE = 'float brH(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}\n' +
  'float brN(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(brH(i),brH(i+vec3(1,0,0)),f.x),mix(brH(i+vec3(0,1,0)),brH(i+vec3(1,1,0)),f.x),f.y),mix(mix(brH(i+vec3(0,0,1)),brH(i+vec3(1,0,1)),f.x),mix(brH(i+vec3(0,1,1)),brH(i+vec3(1,1,1)),f.x),f.y),f.z);}\n';
 const UNI = (sh, extra) => Object.assign(sh.uniforms, { uTime: U.time, uFlut: U.flut, uDis: U.dis, uDisCol: U.disCol, uWith: U.with, uThin: U.thin, uRim: U.rim, uRimC: U.rimC, uCut: U.cut,
  uVein: U.vein, uVeinC: U.veinC, uChar: U.char, uBurn: U.burn, uClip: U.clip, uWrath: U.wrath, uHB: U.hb, uHeartC: U.heartC, uFrost: U.frost, uCtr: U.ctr, uWarm: U.warm, uTrans: U.trans }, extra || {});
 // the vertex side shared by colour and depth: bind-pose position for noise, world height, world position and normal,
 // the severing cut's lookup and the leaves' flutter
 function vsPatch(vs, o, depth) {
  vs = 'varying vec3 vDP;\nvarying vec3 vWP;\nvarying vec3 vWN;\nuniform float uTime;\nuniform float uFlut;\n' + (o.cut ? 'attribute vec2 aCn;\nuniform vec4 uCut[' + MAXC + '];\nvarying float vCs;\nvarying vec4 vCut;\n' : '') +
   (o.flut ? 'attribute vec4 aFl;\nvarying float vThinR;\n' : '') + (o.vein && !depth ? 'attribute vec2 aVn;\nvarying vec2 vVn;\n' : '') + (o.old && !depth ? 'attribute float aOld;\nvarying float vOld;\n' : '') + (o.heart && !depth ? 'attribute vec2 aHt;\nvarying vec2 vHt;\n' : '') + vs;
  vs = vs.replace('#include <begin_vertex>', '#include <begin_vertex>\n vDP = position;\n' + (o.vein && !depth ? ' vVn = aVn;\n' : '') + (o.old && !depth ? ' vOld = aOld;\n' : '') + (o.heart && !depth ? ' vHt = aHt;\n' : '') +
   (o.cut ? ' vCs = aCn.y; vCut = vec4(2., 2., 0., 0.); if (aCn.x > -.5) { int ci = int(aCn.x + .5); for (int i = 0; i < ' + MAXC + '; i++) { if (i == ci) vCut = uCut[i]; } }\n' : '') +
   (o.flut ? ' { float a = aFl.x * uFlut; transformed += objectNormal * a * (.035 * sin(uTime * 2.3 + aFl.y) + .02 * sin(uTime * 5.3 + aFl.y * 1.7) + .01 * sin(uTime * 9.1 + aFl.y * 2.9)); vThinR = aFl.z; }\n' : ''));
  vs = vs.replace('#include <project_vertex>', '#include <project_vertex>\n vWP = (modelMatrix * vec4(transformed, 1.0)).xyz; vWN = normalize(mat3(modelMatrix) * objectNormal);');
  return vs;
 }
 // the discards shared by colour and depth: below the ground it rises through, the dissolve, the severing cut, thinning
 function discards(o) {
  return ' if (vWP.y < uClip) discard;\n float brE = 0.0, brCh = 0.0; float brNz = .72 * brN(vDP * 9.) + .28 * brN(vDP * 23.);\n' +
   ' if (uDis > 0.0) { float th = uDis * 1.1 - .05; if (brNz < th) discard; brE = 1. - smoothstep(0., .055, brNz - th); }\n' +
   (o.cut ? ' if (vCut.x < 1.5) { float e = .035 * (brNz - .5), s = vCs - e; if (s > vCut.x && s < vCut.y) discard;\n' +
    '  brE = max(brE, vCut.w * (1. - smoothstep(0., .02, min(abs(s - vCut.x), abs(s - vCut.y)))));\n' +
    '  if (s >= vCut.y && vCut.z > 0.) { float th = vCut.z * 1.1 - .05; if (brNz < th) discard; brE = max(brE, 1. - smoothstep(0., .055, brNz - th)); } }\n' : '') +
   (o.flut ? ' if (vThinR < uThin) discard;\n' : '');
 }
 const FS_HEAD = 'varying vec3 vDP;\nvarying vec3 vWP;\nvarying vec3 vWN;\nuniform float uTime;\nuniform float uDis;\nuniform vec3 uDisCol;\nuniform float uWith;\nuniform vec3 uWithC;\nuniform float uThin;\nuniform float uRim;\nuniform float uRimS;\nuniform vec3 uRimC;\n' +
  'uniform vec4 uVein;\nuniform vec3 uVeinC;\nuniform float uChar;\nuniform float uBurn;\nuniform float uClip;\nuniform float uWrath;\nuniform float uHB;\nuniform vec3 uHeartC;\nuniform float uFrost;\nuniform vec3 uCtr;\nuniform vec3 uWarm;\nuniform float uTrans;\nuniform float uTransS;\nuniform float uFrostS;\n';
 const KEYS_P = ['flut', 'cut', 'rim', 'vein', 'bloom', 'heart', 'crev', 'char', 'frost', 'trans', 'old', 'back'];
 function patch(m, o) {
  const key = 'brc2-' + KEYS_P.map((k) => (o[k] ? k + o[k] : '')).join('');
  const extra = { uRimS: { value: o.rim || 0 }, uWithC: { value: o.withC || new THREE.Color(.4, .3, .2) }, uTransS: { value: o.trans || 0 }, uFrostS: { value: o.frost || 0 } };
  if (o.old) Object.assign(extra, { uOldMap: { value: OLDBARK.map }, uOldN: { value: OLDBARK.normal } });
  m.onBeforeCompile = (sh) => {
   UNI(sh, extra);
   let vs = vsPatch(sh.vertexShader, o, false), fs = sh.fragmentShader;
   fs = FS_HEAD + (o.cut ? 'varying float vCs;\nvarying vec4 vCut;\n' : '') + (o.flut ? 'varying float vThinR;\n' : '') + (o.vein ? 'varying vec2 vVn;\n' : '') +
    (o.old ? 'varying float vOld;\nuniform sampler2D uOldMap;\nuniform sampler2D uOldN;\n' : '') + (o.heart ? 'varying vec2 vHt;\n' : '') + NOISE + fs;
   // light through a leaf or petal: what arrives on its far side passes through, strongest looking toward the light
   if (o.trans) {
    fs = fs.replace('#include <common>', '#include <common>\nvec3 brTrans(IncidentLight dl, GeometricContext g) { float b = max(0., -dot(g.normal, dl.direction)); float f = pow(max(0., dot(g.viewDir, -dl.direction)), 3.); return dl.color * (b * .55 + b * f * 1.6) * uTrans * uTransS; }\n');
    fs = fs.split('RE_Direct( directLight, geometry, material, reflectedLight );').join('RE_Direct( directLight, geometry, material, reflectedLight );\n\t\treflectedLight.directDiffuse += brTrans( directLight, geometry ) * material.diffuseColor;');
   }
   fs = fs.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n' + discards(o));
   // the old bark, sampled at its own scale and blended in by aOld
   if (o.old) {
    fs = fs.replace('#include <map_fragment>', '#include <map_fragment>\n { vec4 ob = texture2D(uOldMap, vUv * vec2(1., .6)); ob = mapTexelToLinear(ob); diffuseColor.rgb = mix(diffuseColor.rgb, ob.rgb, vOld); }');
    fs = fs.replace('vec3 mapN = texture2D( normalMap, vUv ).xyz * 2.0 - 1.0;', 'vec3 mapN = mix(texture2D( normalMap, vUv ).xyz, texture2D( uOldN, vUv * vec2(1., .6) ).xyz, vOld) * 2.0 - 1.0;');
   }
   fs = fs.replace('#include <color_fragment>', '#include <color_fragment>\n { float lum = dot(diffuseColor.rgb, vec3(.3, .59, .11)); diffuseColor.rgb = mix(diffuseColor.rgb, uWithC * (.4 + lum * 1.5), uWith); }\n' +
    // the leaves' undersides: paler, greyer and felted
    (o.back ? ' if (!gl_FrontFacing) { float l = dot(diffuseColor.rgb, vec3(.3, .59, .11)); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(l * .9, l * 1.05, l * .85) * 1.25, .45); }\n diffuseColor.rgb *= mix(vec3(1.), vec3(1.55, .5, .42), uWrath * .6);\n' : '') +
    (o.bloom ? ' if (gl_FrontFacing) { if (vUv.x < .5) diffuseColor.rgb *= .62; } else if (vUv.x > .5) diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.42, .02, .07), .65);\n' : '') +
    (o.char ? ' if (uChar > 0.0) { float n3 = brN(vDP * 3.1); brCh = clamp((uChar * ' + o.char.toFixed(2) + ' * 1.7 - (' + (o.flut ? 'vThinR * .5 + n3 * .3 + brNz * .2' : 'n3 * .7 + brNz * .3') + ')) * 5., 0., 1.); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.012, .008, .006), brCh); }\n' : '') +
    // frost: rime on the upper faces, from WARM to COLD meters out from its middle, gathering more in the creases of noise
    (o.frost ? ' float brFr = 0.0; { float d = length(vWP.xz - uCtr.xz) / max(uWarm.z, .01); float up = (gl_FrontFacing ? 1. : -1.) * vWN.y; float nz = brN(vWP * 7.) * .6 + brN(vWP * 31.) * .4;\n' +
     '  brFr = uFrost * uFrostS * smoothstep(uWarm.x, uWarm.y, d) * smoothstep(-.2, .7, up + (nz - .5) * .9); brFr = clamp(brFr * 1.25, 0., 1.);\n' +
     '  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.62, .68, .8) * (.85 + .3 * nz), brFr * .7); }\n' : ''));
   if (o.frost) fs = fs.replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = mix(roughnessFactor, .55, brFr);');
   fs = fs.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += uDisCol * brE * 1.6;\n' +
    (o.char ? ' totalEmissiveRadiance += vec3(1., .42, .12) * brCh * (1. - brCh) * 3. * uBurn;\n' : '') +
    (o.vein ? ' { float l = pow(max(dot(texelColor.rgb, vec3(.3, .59, .11)), 1e-4), .4545), crev = 1. - smoothstep(' + (o.crev || '.06, .16') + ', l);\n' +
     '  float vg = vVn.x * (uVein.w * (.55 + .45 * sin(uTime * 1.3 - vVn.y * 6.)) + uVein.x * (.6 + .4 * sin(uTime * 6. - vVn.y * 15.)) + uVein.z * exp(-pow((vVn.y - uVein.y) * 4.5, 2.)));\n' +
     '  totalEmissiveRadiance += uVeinC * vg * (.06 + 1.4 * crev); }\n' : '') +
    (o.bloom ? ' totalEmissiveRadiance += uHeartC * uHB * .22 * (1. - smoothstep(0., .5, vUv.y)) * (gl_FrontFacing ? .6 : 1.);\n' : '') +
    (o.heart ? ' { float fr = pow(1. - abs(dot(normalize(normal), normalize(vViewPosition))), 1.5); totalEmissiveRadiance = uHeartC * uHB * (.1 + vHt.x * 2.6) * (.35 + .65 * vHt.y) * (.3 + 1.7 * fr); }\n' : '') +
    (o.frost ? ' if (brFr > .05) { vec3 vd = normalize(cameraPosition - vWP); float gl = brH(floor(vWP * 260.)); float tw = pow(max(0., sin(dot(vd, vec3(41.3, 27.1, 33.7)) + gl * 90.)), 40.); totalEmissiveRadiance += vec3(.75, .85, 1.) * step(.93, gl) * tw * brFr * .9; }\n' : ''));
   if (o.rim) fs = fs.replace('#include <dithering_fragment>', ' gl_FragColor.rgb += uRimC * (uRim * uRimS * pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 2.6));\n#include <dithering_fragment>');
   sh.vertexShader = vs; sh.fragmentShader = fs;
  };
  m.customProgramCacheKey = () => key;
  m.userData.patch = o;
  return m;
 }
 // the shadow pass's version of a material: the same discards, sway and leaf shapes
 function depthOf(m) {
  const o = m.userData.patch || {}, d = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, skinning: true, map: m.alphaTest > 0 ? m.map : null, alphaTest: m.alphaTest || 0, side: m.side });
  d.onBeforeCompile = (sh) => {
   UNI(sh);
   sh.vertexShader = vsPatch(sh.vertexShader.replace('#include <begin_vertex>', '#include <beginnormal_vertex>\n#include <begin_vertex>'), o, true);
   sh.fragmentShader = 'varying vec3 vDP;\nvarying vec3 vWP;\nvarying vec3 vWN;\nuniform float uDis;\nuniform float uThin;\nuniform float uClip;\n' + (o.cut ? 'varying float vCs;\nvarying vec4 vCut;\n' : '') + (o.flut ? 'varying float vThinR;\n' : '') + NOISE +
    sh.fragmentShader.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n' + discards(o));
  };
  d.customProgramCacheKey = () => 'brc2d-' + (o.cut ? 'c' : '') + (o.flut ? 'f' : '') + (m.alphaTest > 0 ? 'a' : '');
  return d;
 }
 const std = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: .8, metalness: 0 }, o));
 const phys = (o) => new THREE.MeshPhysicalMaterial(Object.assign({ roughness: .8, metalness: 0 }, o));
 const ADD = { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false };
 const M = {
  bark: patch(phys({ map: BARK.map, normalMap: BARK.normal, normalScale: new THREE.Vector2(1.1, 1.1), vertexColors: true, roughness: .6, sheen: new THREE.Color(.05, .045, .065), envMapIntensity: .55, skinning: true }), { cut: true, rim: 1, char: .45, vein: true, crev: '.07, .17', frost: .9, old: true, withC: new THREE.Color(.3, .26, .22) }),
  wood: patch(std({ map: WOOD.map, normalMap: WOOD.normal, normalScale: new THREE.Vector2(1.2, 1.2), vertexColors: true, roughness: .92, envMapIntensity: .5, skinning: true }), { cut: true, rim: .8, vein: true, crev: '.07, .17', frost: .6, withC: new THREE.Color(.32, .28, .24) }),
  vc: patch(std({ vertexColors: true, roughness: .42, skinning: true }), { cut: true, rim: .8, char: .4, frost: .7, trans: .25, withC: new THREE.Color(.36, .3, .24) }),
  leaf: patch(std({ map: LEAF.map, normalMap: LEAF.normal, normalScale: new THREE.Vector2(.9, .9), vertexColors: true, alphaTest: .45, side: THREE.DoubleSide, roughness: .52, skinning: true }), { cut: true, flut: true, rim: .55, char: 1, frost: 1, trans: 1, back: true, withC: new THREE.Color(.46, .33, .18) }),
  berry: patch(phys({ vertexColors: true, roughness: .3, clearcoat: .9, clearcoatRoughness: .12, emissive: 0x000000, skinning: true }), { cut: true, rim: .5, frost: .8, trans: .35, withC: new THREE.Color(.13, .09, .08) }),
  bloom: patch(phys({ map: BLOOM.map, normalMap: BLOOM.normal, normalScale: new THREE.Vector2(.8, .8), vertexColors: true, alphaTest: .5, side: THREE.DoubleSide, roughness: .7, sheen: new THREE.Color(.22, .06, .1), envMapIntensity: .5, skinning: true }), { rim: .6, char: .8, bloom: true, trans: 1.2, frost: .5, withC: new THREE.Color(.42, .32, .24) }),
  heart: patch(phys({ vertexColors: true, roughness: .28, clearcoat: .6, clearcoatRoughness: .2, metalness: .02, skinning: true }), { rim: .4, heart: true }),
  soil: new THREE.MeshStandardMaterial({ map: soilMap, transparent: true, depthWrite: false, roughness: 1, color: new THREE.Color(1, 1, 1).lerp(new THREE.Color(.75, .95, .7), MOSS * .4), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })
 };
 // the roots under the meadow, seen only in x-ray: lines of light the heartbeat runs out along
 const XRAY = { value: 0 };
 M.xray = new THREE.ShaderMaterial({
  uniforms: { uX: XRAY, uVein: U.vein, uVeinC: U.veinC, uTime: U.time },
  vertexShader: 'attribute vec2 aVn;\nvarying vec2 vVn;\nvarying float vF;\nvoid main(){ vVn = aVn; vec4 mv = modelViewMatrix * vec4(position, 1.0); vF = -mv.z; gl_Position = projectionMatrix * mv; }',
  fragmentShader: 'uniform float uX; uniform vec4 uVein; uniform vec3 uVeinC; uniform float uTime; varying vec2 vVn; varying float vF;\n' +
   'void main(){ float p = exp(-pow((vVn.y - uVein.y) * 3.2, 2.)) * (uVein.z + .35); float rest = .22 + .1 * sin(uTime * 1.3 - vVn.y * 5.);\n' +
   ' vec3 c = mix(vec3(.55, .32, .5), uVeinC * 2.4, clamp(p * 1.4, 0., 1.)) * (rest + p * 1.6) * vVn.x; gl_FragColor = vec4(c * uX, 1.); }',
  transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false
 });
 // ---------- skeleton ----------
 // ground (stays put), crown (the whole body: rise, lean, twist), mass (the mound: pulse and squash), SPN + 1 bones up the
 // spire, and the bud on top with its heart, its stamens and a chain for each sepal and petal. Each cane is a chain of
 // NS + 1 bones running straight out along its azimuth in the bind pose: the arms and the mane grow from the spire, the
 // legs from the mound. Berry bunches hang from pendulum bones.
 const bones = [], BI = {};
 function bone(name, parent, x, y, z, order) { const b = new THREE.Bone(); b.name = name; b.position.set(x, y, z); if (order) b.rotation.order = order; parent.add(b); BI[name] = bones.length; bones.push(b); return b; }
 const ground = bone('ground', base, 0, 0, 0), crown = bone('crown', ground, 0, 0, 0, 'YXZ'), mass = bone('mass', crown, 0, 0, 0);
 const SP = []; for (let i = 0; i <= SPN; i++) SP.push(bone('sp' + i, i ? SP[i - 1] : crown, 0, i ? SPS : SPH, 0, 'YXZ'));
 const bud = bone('bud', SP[SPN], 0, .1, 0, 'YXZ'), heart = bone('heart', bud, 0, .12, 0), stam = bone('stam', bud, 0, 0, 0);
 // sepals and petals: chains standing straight up in the bind pose; animate() folds them into a bud or opens them out
 const SEL = 2.5, PEL = 1.85, SEP = [], PET = [];
 function flap(nm, a, r, y, n, len) {
  const b0 = bone(nm + '_0', bud, Math.sin(a) * r, y, Math.cos(a) * r, 'YXZ'); b0.rotation.set(-PI / 2, a, 0);
  const ch = [b0]; for (let i = 1; i <= n; i++) ch.push(bone(nm + '_' + i, ch[i - 1], 0, 0, len / n));
  return { ch, a, r, y, n, len, seg: len / n, ph: rnd() * TAU };
 }
 for (let i = 0; i < 5; i++) { SEP.push(flap('se' + i, (i + .5) / 5 * TAU, .5, 0, 3, SEL)); PET.push(flap('pe' + i, i / 5 * TAU, .36, .06, 2, PEL)); }
 // the canes: g its group (L the lead arm, on its right; M the other arm; H the mane; F, S and B the legs at the front,
 // the sides and the back), a its azimuth, j the spire bone it grows from (-1: the mound), its length, base and tip radius
 const CSPEC = [['L', -.55, 4, 9, .27, .05], ['M', .55, 4, 8.6, .26, .05], ['H', -2.45, 3, 7.4, .23, .045], ['H', 2.45, 3, 7.4, .23, .045]];
 for (let k = 0; k < 6; k++) { const a = -PI + (k + .5) * TAU / 6 + (rnd() - .5) * .14; CSPEC.push([Math.abs(a) < 1.05 ? 'F' : Math.abs(a) < 2.1 ? 'S' : 'B', a, -1, rr(6, 6.6), .18, .032]); }
 const CANES = [];
 for (const [g, a, j, len, rB, rT] of CSPEC) {
  const k = CANES.length, great = j >= 0, rb = great ? .44 : CR * .5, hb = great ? 0 : CH * .5, pb = great ? SP[j] : crown;
  const b0 = bone('cb' + k, pb, Math.sin(a) * rb, hb, Math.cos(a) * rb, 'YXZ'); b0.rotation.y = a;
  const chain = [b0]; for (let i = 1; i <= NS; i++) chain.push(bone('c' + k + '_' + i, chain[i - 1], 0, 0, len / NS));
  CANES.push({ k, g, a, len, seg: len / NS, rB, rT, great, pb, B: V3(Math.sin(a) * rb, great ? SPH + j * SPS : hb, Math.cos(a) * rb), chain, ph: rnd() * TAU, sgn: a < 0 ? -1 : 1,
   dl: (rnd() - .5) * .12, dc: (rnd() - .5) * .25, cutJ: -1, piece: null, cm: .55 + .8 * rnd(), jb: Array.from({ length: NS + 1 }, () => (rnd() - .5) * .12), jy: Array.from({ length: NS + 1 }, () => (rnd() - .5) * .09),
   theta: new Float32Array(NS + 1), bend: new Float32Array(NS + 1), yawW: new Float32Array(NS + 1) });
 }
 const NC = CANES.length, LEAD = CANES[0], MATE = CANES[1];
 root.updateMatrixWorld(true);
 // ---------- geometry helpers ----------
 const BK = new Map(); // material -> geometries to merge into one skinned mesh
 const put = (mat, g) => { let l = BK.get(mat); if (!l) BK.set(mat, (l = [])); l.push(g); return g; };
 function geo(pos, idx, extra) {
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  for (const k in extra || {}) if (extra[k]) g.setAttribute(k, new THREE.Float32BufferAttribute(extra[k][0], extra[k][1]));
  g.setIndex(idx); return g;
 }
 function surf(nu, nv, f, uvf) {
  const pos = [], uv = [], idx = [], o = [0, 0, 0];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const u = i / nu, v = j / nv; f(u, v, o); pos.push(o[0], o[1], o[2]); const t = uvf ? uvf(u, v) : [u, 1 - v]; uv.push(t[0], t[1]); }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = geo(pos, idx, { uv: [uv, 2] }); g.computeVertexNormals(); return g;
 }
 // a tube along a curve with a radius that may vary along it and around it (Frenet frames, for roots and stems)
 function tube(pts, segs, rs, rFn, uvK) {
  const curve = pts.getPointAt ? pts : new THREE.CatmullRomCurve3(pts.map((p) => (p.isVector3 ? p : V3(p[0], p[1], p[2]))));
  const fr = curve.computeFrenetFrames(segs, false), pos = [], nor = [], uv = [], idx = [], P = V3(), D = V3();
  for (let i = 0; i <= segs; i++) {
   const t = i / segs; curve.getPointAt(t, P);
   for (let j = 0; j <= rs; j++) { const th = j / rs * TAU, r = rFn(t, th); D.copy(fr.normals[i]).multiplyScalar(Math.cos(th)).addScaledVector(fr.binormals[i], Math.sin(th)); pos.push(P.x + D.x * r, P.y + D.y * r, P.z + D.z * r); nor.push(D.x, D.y, D.z); uv.push(j / rs, t * (uvK || 1)); }
  }
  for (let i = 0; i < segs; i++) for (let j = 0; j < rs; j++) { const a = i * (rs + 1) + j, b = a + rs + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  return geo(pos, idx, { normal: [nor, 3], uv: [uv, 2] });
 }
 // a near-straight tube along d from s0 to s1 in the bind pose, rings held square to d by a fixed frame (e1, e2):
 // canes, shoots and horns. wob(s, out) nudges the axis sideways and up a little. Normals come from the surface itself,
 // so ridges and knots shade.
 function rodTube(B, d, e1, e2, s0, s1, nu, rs, rFn, wob, uvLen, uvRound) {
  const pos = [], uv = [], idx = [], S = [], TH = [], w = [0, 0];
  for (let i = 0; i <= nu; i++) {
   const s = lerp(s0, s1, i / nu); w[0] = w[1] = 0; if (wob) wob(s, w);
   const cx = B.x + d.x * s + e1.x * w[0] + e2.x * w[1], cy = B.y + d.y * s + e1.y * w[0] + e2.y * w[1], cz = B.z + d.z * s + e1.z * w[0] + e2.z * w[1];
   for (let j = 0; j <= rs; j++) {
    const th = j / rs * TAU, r = rFn(s, th), c = Math.cos(th), sn = Math.sin(th);
    pos.push(cx + (e1.x * c + e2.x * sn) * r, cy + (e1.y * c + e2.y * sn) * r, cz + (e1.z * c + e2.z * sn) * r); uv.push(j / rs * (uvRound || 1), (s - s0) / (uvLen || .5)); S.push(s); TH.push(th);
   }
  }
  for (let i = 0; i < nu; i++) for (let j = 0; j < rs; j++) { const a = i * (rs + 1) + j, b = a + rs + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  const g = geo(pos, idx, { uv: [uv, 2] }); g.computeVertexNormals(); seamNormals(g, nu, rs);
  g.userData.S = S; g.userData.TH = TH; return g;
 }
 // a tube's first and last column of vertices share a seam: give both the same normal
 function seamNormals(g, nu, rs) { const n = g.attributes.normal; for (let i = 0; i <= nu; i++) { const a = i * (rs + 1), b = a + rs; const x = n.getX(a) + n.getX(b), y = n.getY(a) + n.getY(b), z = n.getZ(a) + n.getZ(b), l = Math.hypot(x, y, z) || 1; n.setXYZ(a, x / l, y / l, z / l); n.setXYZ(b, x / l, y / l, z / l); } }
 function skinW(g, fn) {
  const p = g.attributes.position, n = p.count, si = new Float32Array(n * 4), sw = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
   let inf = fn(p.getX(i), p.getY(i), p.getZ(i), i).filter((e) => e[1] > 1e-4).sort((a, b) => b[1] - a[1]).slice(0, 4);
   if (!inf.length) inf = [[0, 1]];
   let tot = 0; for (const e of inf) tot += e[1];
   inf.forEach((e, k) => { si[i * 4 + k] = e[0]; sw[i * 4 + k] = e[1] / tot; });
  }
  g.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4)); return g;
 }
 const rigid = (g, b) => skinW(g, () => [[BI[b.name], 1]]);
 function attr(g, name, size, fn) { const n = g.attributes.position.count, a = new Float32Array(n * size), o = new Array(size); for (let i = 0; i < n; i++) { fn(i, o); for (let k = 0; k < size; k++) a[i * size + k] = o[k]; } g.setAttribute(name, new THREE.BufferAttribute(a, size)); return g; }
 // vertex colours, given in sRGB (made linear here when LIN)
 const colorAll = (g, c) => { const q = lc(c); return attr(g, 'color', 3, (i, o) => { o[0] = q[0]; o[1] = q[1]; o[2] = q[2]; }); };
 const shadeBy = (g, f) => attr(g, 'color', 3, (i, o) => { const p = g.attributes.position, c = f(p.getX(i), p.getY(i), p.getZ(i), i); o[0] = lin1(c[0]); o[1] = lin1(c[1]); o[2] = lin1(c[2]); });
 // which cane a vertex belongs to and how far along it (for the severing cut); -1 for everything else
 const cnAll = (g, k, f) => attr(g, 'aCn', 2, (i, o) => { o[0] = k; o[1] = f; });
 const oldAll = (g, v) => attr(g, 'aOld', 1, (i, o) => { o[0] = v; });
 // a chain's skin weights at distance s along it: a linear blend between neighbouring bones, centred on each joint
 function chainW(chain, seg, n, s) {
  const f = s / seg - .5, i0 = Math.floor(f), t = f - i0;
  if (s <= seg * .5) return [[BI[chain[0].name], 1]];
  if (s >= (n + .5) * seg) return [[BI[chain[n].name], 1]];
  return [[BI[chain[i0].name], 1 - t], [BI[chain[i0 + 1].name], t]];
 }
 const caneW = (C, s) => chainW(C.chain, C.seg, NS, s);
 const DEF = { color: 1, skinWeight: [1, 0, 0, 0], aCn: [-1, 0], aFl: [0, 0, 1, 0] };
 function mergeAll(list) {
  const names = new Set(); let nv = 0, ni = 0;
  for (const g of list) { if (!g.attributes.normal) g.computeVertexNormals(); for (const k in g.attributes) names.add(k); nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
  const out = new THREE.BufferGeometry();
  for (const k of names) {
   const size = list.find((g) => g.attributes[k]).attributes[k].itemSize, arr = new Float32Array(nv * size); let vo = 0;
   for (const g of list) {
    const c = g.attributes.position.count, a = g.attributes[k];
    if (a) arr.set(a.array, vo * size);
    else if (DEF[k] === 1) arr.fill(1, vo * size, (vo + c) * size);
    else if (DEF[k]) for (let i = 0; i < c; i++) for (let q = 0; q < size; q++) arr[(vo + i) * size + q] = DEF[k][q];
    vo += c;
   }
   out.setAttribute(k, new THREE.BufferAttribute(arr, size));
  }
  const I = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni); let vo = 0, io = 0;
  for (const g of list) { const c = g.attributes.position.count; if (g.index) { const a = g.index.array; for (let k = 0; k < a.length; k++) I[io + k] = a[k] + vo; io += a.length; } else { for (let k = 0; k < c; k++) I[io + k] = vo + k; io += c; } vo += c; }
  out.setIndex(new THREE.BufferAttribute(I, 1)); out.computeBoundingSphere(); return out;
 }
 const _m4 = new THREE.Matrix4();

 // ---------- prickles ----------
 // A blackberry prickle: broad and flattened where it grows from the cane (its base runs along the cane, not round it),
 // narrowing fast and hooking back toward the cane's base; wine-red at the root like the bark, then red-brown, then
 // straw at the hard point. S the surface point, n out of the surface, d along the cane toward its tip.
 const PR_C = [[.3, .1, .13], [.4, .13, .1], [.78, .64, .46]];
 function prickle(S, n, d, len, rb, hk, dead) {
  const nu = DET > .6 ? 6 : 3, rs = DET > .6 ? 7 : 4, pos = [], col = [], idx = [], T = V3(), P = V3(), e1 = V3(), e2 = V3();
  const hook = hk === undefined ? .5 + .25 * rnd3() : hk;
  for (let i = 0; i <= nu; i++) {
   const t = i / nu; P.copy(S).addScaledVector(n, len * t - rb * .35).addScaledVector(d, -len * hook * t * t);
   T.copy(n).multiplyScalar(len).addScaledVector(d, -2 * len * hook * t).normalize();
   e1.copy(d).addScaledVector(T, -d.dot(T)).normalize(); e2.crossVectors(T, e1).normalize(); // e1 along the cane, e2 across it
   const r = rb * Math.pow(1 - t, 1.25), along = r * (1 + 1.6 * Math.pow(1 - t, 2.2)), across = r * .62;
   let c = t < .4 ? PR_C[0].map((v, k) => lerp(v, PR_C[1][k], t / .4)) : PR_C[1].map((v, k) => lerp(v, PR_C[2][k], sm(.4, .92, t)));
   if (dead) c = c.map((v, k) => lerp(v, [.5, .46, .42][k], .7));
   const q = lc(c.map((v) => v * DARK));
   for (let j = 0; j < rs; j++) { const th = j / rs * TAU, cx = Math.cos(th) * along, sx = Math.sin(th) * across; pos.push(P.x + e1.x * cx + e2.x * sx, P.y + e1.y * cx + e2.y * sx, P.z + e1.z * cx + e2.z * sx); col.push(q[0], q[1], q[2]); }
  }
  for (let i = 0; i < nu; i++) for (let j = 0; j < rs; j++) { const a = i * rs + j, b = i * rs + (j + 1) % rs; idx.push(a, a + rs, b, b, a + rs, b + rs); }
  const g = geo(pos, idx, { color: [col, 3] }); g.computeVertexNormals(); return g;
 }

 // ---------- leaves ----------
 // A compound leaf: a prickly stalk from O along Ly, and on it three leaflets (a long terminal one and two to the sides)
 // or five (two more, smaller, lower down, swept back), each a curved surface folded along its midrib, drooping and
 // twisting a little, with the atlas's toothed leaflet on it. Ln is the leaf's face. kind: 0 winter-green, 1 wine-red,
 // 2 young bronze, 3 dead. Returns { leaf (M.leaf), stalk (M.vc) } geometries in the body's bind space.
 const leafTint = () => [r3(.84, 1.1), r3(.88, 1.12), r3(.8, 1.04)];
 function compoundLeaf(O, Ly, Ln, size, kind, five, fl) {
  const ny = DET > .6 ? 7 : 4, nx = DET > .6 ? 4 : 2, Lx = V3().crossVectors(Ly, Ln).normalize(), Nn = V3().crossVectors(Lx, Ly).normalize();
  const pl = size * r3(.22, .32), tip = O.clone().addScaledVector(Ly, pl).addScaledVector(Nn, pl * .12);
  const stalk = tube([O, O.clone().lerp(tip, .5).addScaledVector(Nn, pl * .1), tip], 3, DET > .6 ? 5 : 3, (t) => size * .016 * (1 - .35 * t));
  colorAll(stalk, kind === 3 ? [.42, .3, .2] : [.36 * DARK, .2 * DARK, .14]);
  const leaves = [], pr = [];
  const ph = fl && fl.ph !== undefined ? fl.ph : r3(0, TAU), amp = fl && fl.amp !== undefined ? fl.amp : 1, thin = fl && fl.thin !== undefined ? fl.thin : rnd3();
  const tint = leafTint(), u0 = (kind % 2) * .5, v0 = kind < 2 ? .5 : 0;
  const one = (P0, dir, L, W) => {
   const dx = V3().crossVectors(dir, Nn).normalize(), dn = V3().crossVectors(dx, dir).normalize(), fold = r3(.1, .2), droop = r3(.12, .3), twist = r3(-.25, .25), curlE = r3(-.05, .12);
   const pos = [], uv = [], idx = [], flA = [], cA = [];
   for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
    const xn = i / nx * 2 - 1, yn = j / ny, x = xn * W / 2, y = yn * L;
    const z = fold * W * Math.abs(xn) * (1 - .4 * yn) - droop * L * yn * yn + curlE * W * xn * xn + twist * x * yn;
    pos.push(P0.x + dx.x * x + dir.x * y + dn.x * z, P0.y + dx.y * x + dir.y * y + dn.y * z, P0.z + dx.z * x + dir.z * y + dn.z * z);
    uv.push(u0 + (xn * .5 + .5) * .5, v0 + .003 + yn * .494); flA.push(amp * Math.pow(yn, 1.3) * L * 4, ph, thin, 0); const q = lc(tint); cA.push(q[0], q[1], q[2]);
   }
   for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
   const g = geo(pos, idx, { uv: [uv, 2], aFl: [flA, 4], color: [cA, 3] }); g.computeVertexNormals(); leaves.push(g);
  };
  const L1 = size * .62, W1 = L1 * .62, rot = (a) => V3().copy(Ly).applyAxisAngle(Nn, a);
  one(tip.clone().addScaledVector(Ly, -L1 * .04), Ly.clone(), L1, W1);
  for (const sd of [-1, 1]) {
   one(tip.clone().addScaledVector(Ly, -L1 * .03), rot(sd * r3(.85, 1.05)), L1 * .82, W1 * .82);
   if (five) one(tip.clone().addScaledVector(Ly, -pl * .35), rot(sd * r3(1.75, 2.05)), L1 * .55, W1 * .55);
  }
  // two tiny hooked prickles on the stalk's underside
  if (DET > .6) for (let i = 0; i < 2; i++) { const f = .3 + .35 * i; pr.push(prickle(O.clone().lerp(tip, f).addScaledVector(Nn, -size * .012), Nn.clone().negate(), Ly.clone().negate(), size * .045, size * .014, .5, kind === 3)); }
  return { leaf: leaves, stalk: [stalk].concat(pr) };
 }

 // ---------- fruit ----------
 // A blackberry: round drupelets packed over an ellipsoid round a dark core, each still carrying its dry style (a fine
 // whisker), with a green calyx of five reflexed sepals where its stalk joins. ripe 0 hard green, .4 red, .7 and on
 // glossy purple-black. Built hanging down from (cx, cy, cz). out collects berries; hairs collects whiskers and calyx.
 const DRUP = (() => { // a drupelet cap facing +z: a centre, two rings; normals from the sphere
  const p = [0, 0, 1], i = [], R = DET > .6 ? [[.62, 7], [1.32, 7]] : [[1.3, 5]];
  let base = 1;
  R.forEach(([el, n], r) => { for (let k = 0; k < n; k++) { const a = (k + r * .5) / n * TAU; p.push(Math.sin(el) * Math.cos(a), Math.sin(el) * Math.sin(a), Math.cos(el)); } });
  const n0 = R[0][1];
  for (let k = 0; k < n0; k++) i.push(0, 1 + k, 1 + (k + 1) % n0);
  if (R.length > 1) { const n1 = R[1][1], o1 = 1 + n0; for (let k = 0; k < n1; k++) { const a = 1 + k, b = 1 + (k + 1) % n0, c = o1 + k, d = o1 + (k + 1) % n1; i.push(a, c, d, a, d, b); } }
  return { p, i };
 })();
 const CORE = (() => { const g = new THREE.SphereGeometry(1, 8, 6); return { p: Array.from(g.attributes.position.array), i: Array.from(g.index.array) }; })();
 function berry(cx, cy, cz, len, rad, ripe, out, hairs) {
  const col = ripe > .7 ? [.1, .035, .1] : ripe > .35 ? [.52, .04, .1] : ripe > .2 ? [.62, .26, .12] : [.42, .55, .2];
  const P = out.p, N = out.n, C = out.c, I = out.i;
  const _o = V3(), _z = V3(0, 0, 1), _qq = new THREE.Quaternion(), _t = V3();
  const hl = len / 2, cy0 = cy - hl, rd = rad * .36, n = Math.max(14, Math.round(DET > .6 ? 46 + 30 * rad / .03 * .1 : 24));
  for (let k = 0; k < n; k++) {
   const z = 1 - 1.85 * (k + .5) / n, q = Math.sqrt(Math.max(0, 1 - z * z)), th = k * 2.39996 + rnd3() * .2;
   const nx = q * Math.cos(th), nz = q * Math.sin(th), x = cx + nx * rad * .92, y = cy0 + z * hl * .92, zz = cz + nz * rad * .92;
   _o.set(nx / rad, z / hl, nz / rad).normalize(); _qq.setFromUnitVectors(_z, _o);
   const j = .82 + .36 * rnd3(), r = rd * (.9 + .25 * rnd3()) * (z < -.6 ? .85 : 1);
   const cc = lc([col[0] * j, col[1] * j, col[2] * (ripe > .7 ? .9 + .5 * rnd3() : j)]), b = P.length / 3;
   for (let m = 0; m < DRUP.p.length; m += 3) { _t.set(DRUP.p[m], DRUP.p[m + 1], DRUP.p[m + 2]).applyQuaternion(_qq); P.push(x + _t.x * r, y + _t.y * r, zz + _t.z * r); N.push(_t.x, _t.y, _t.z); C.push(cc[0], cc[1], cc[2]); }
   for (const ii of DRUP.i) I.push(b + ii);
   // its style: a fine whisker standing out of the drupelet's top, dark on a ripe berry, pale on an unripe one
   if (hairs && DET > .6 && rnd3() < .8) {
    const hb = hairs.p.length / 3, L = r * r3(1, 1.8), w = r * .09, hc = lc(ripe > .7 ? [.24, .16, .12] : [.7, .62, .44]);
    _t.set(x, y, zz).addScaledVector(_o, r * .9); const e = V3().crossVectors(_o, Math.abs(_o.y) < .9 ? YAX : _z).normalize(), f = V3().crossVectors(_o, e);
    for (const [a, b2] of [[e, f], [f, e]]) {
     const hb2 = hairs.p.length / 3;
     hairs.p.push(_t.x - a.x * w, _t.y - a.y * w, _t.z - a.z * w, _t.x + a.x * w, _t.y + a.y * w, _t.z + a.z * w, _t.x + _o.x * L, _t.y + _o.y * L, _t.z + _o.z * L);
     for (let m = 0; m < 3; m++) { hairs.n.push(b2.x, b2.y, b2.z); hairs.c.push(hc[0], hc[1], hc[2]); }
     hairs.i.push(hb2, hb2 + 1, hb2 + 2, hb2, hb2 + 2, hb2 + 1);
    }
    void hb;
   }
  }
  const cc = lc([col[0] * .4, col[1] * .4, col[2] * .4]), b = P.length / 3; // the dark core fills the gaps
  for (let m = 0; m < CORE.p.length; m += 3) { P.push(cx + CORE.p[m] * rad * .86, cy0 + CORE.p[m + 1] * hl * .86, cz + CORE.p[m + 2] * rad * .86); N.push(CORE.p[m], CORE.p[m + 1], CORE.p[m + 2]); C.push(cc[0], cc[1], cc[2]); }
  for (const ii of CORE.i) I.push(b + ii);
  // the calyx: five small sepals folded back up the stalk
  if (hairs) {
   const gc = lc(ripe > .7 ? [.3, .3, .16] : [.34, .44, .18]);
   for (let k = 0; k < 5; k++) {
    const a = k / 5 * TAU + rnd3(), ox = Math.cos(a), oz = Math.sin(a), hb = hairs.p.length / 3, w = rad * .32, L = rad * .9;
    const bx = cx + ox * rad * .2, by = cy + rad * .05, bz = cz + oz * rad * .2;
    hairs.p.push(bx - oz * w, by, bz + ox * w, bx + oz * w, by, bz - ox * w, cx + ox * L, cy + L * .55, cz + oz * L);
    for (let m = 0; m < 3; m++) { hairs.n.push(0, 1, 0); hairs.c.push(gc[0], gc[1], gc[2]); }
    hairs.i.push(hb, hb + 1, hb + 2, hb, hb + 2, hb + 1);
   }
  }
 }
 // a hanging bunch: a stalk with short branches, berries biggest and ripest at the top and every stage of ripeness among
 // them (it fruits all winter); returns berry geometry and stalk, calyx and whisker geometry (vertex-coloured), both in
 // the cluster's own space (origin at the attachment)
 function bunch(n, size) {
  const out = { p: [], n: [], c: [], i: [] }, hairs = { p: [], n: [], c: [], i: [] }, stems = [], yaw = rnd() * TAU, L = size * .2;
  for (let i = 0; i < n; i++) {
   const f = n > 1 ? i / (n - 1) : 0, a = yaw + i * 2.4, r = size * (.035 + .035 * Math.sin(PI * Math.min(1, f * 1.3))) * (i ? 1 : 0);
   const y = -size * .03 - f * L, x = Math.cos(a) * r, z = Math.sin(a) * r, q = rnd(), ripe = q < .12 ? .1 : q < .24 ? .3 : q < .36 ? .5 : .8 + .2 * rnd();
   const len = size * (.05 - .012 * f) * (.9 + .2 * rnd()) * (ripe < .35 ? .8 : 1), rad = len * .6;
   berry(x, y - .006, z, len, rad, ripe, out, hairs);
   const s = tube([[0, -f * L * .8, 0], [x * .5, y + .01, z * .5], [x, y + .002, z]], 3, DET > .6 ? 4 : 3, (t) => size * .0045 * (1 - .4 * t));
   colorAll(s, [.24 * DARK, .26 * DARK, .12]); stems.push(s);
  }
  const main = tube([[0, .01, 0], [0, -L * .4, size * .004], [0, -L * .85, 0]], 5, DET > .6 ? 5 : 3, (t) => size * .006 * (1 - .5 * t)); colorAll(main, [.26 * DARK, .22 * DARK, .12]); stems.push(main);
  const g = geo(out.p, out.i, { normal: [out.n, 3], color: [out.c, 3] });
  if (hairs.p.length) stems.push(geo(hairs.p, hairs.i, { normal: [hairs.n, 3], color: [hairs.c, 3] }));
  return { berries: g, stems };
 }
 // ---------- the root mound: a lumpy dome under a tangle of twisted roots, ribs of root arching out of the soil, old grey
 // dead canes snarled through it, and the litter of its own fallen leaves round it ----------
 const domeR = (e, a) => CR * Math.pow(Math.max(0, Math.cos(e)), .8) * (1 + .08 * Math.sin(a * 5 + e * 3) + .05 * Math.sin(a * 11 - e * 7) + .025 * Math.sin(a * 23 + e * 13));
 const domeY = (e) => CH * Math.sin(Math.max(0, e));
 // veins: x how strongly a vertex glows, y how far along the veins it is from the heart (0 at the heart, about .5 at the
 // foot of the spire, 1.5 and on at the ends of the roots): each heartbeat runs out along y
 const vein = (g, x, y0, y1, ring) => attr(g, 'aVn', 2, (i, o) => { o[0] = x; o[1] = lerp(y0, y1, Math.floor(i / ring) / Math.max(1, g.attributes.position.count / ring - 1)); });
 const domeP = (e, a, k, out) => { const r = domeR(e, a) * (k || 1); return out.set(Math.sin(a) * r, domeY(e) * (k || 1), Math.cos(a) * r); };
 const domeN = (e, a, out) => out.set(Math.sin(a) * Math.cos(e) * CH, Math.sin(e) * CR, Math.cos(a) * Math.cos(e) * CH).normalize();
 // mound parts low and far out are held by the ground, the rest by the mound
 function wCrown(x, y, z) { const g = sm(CR * .95, CR * 1.6, Math.hypot(x, z)) * sm(.3, .04, y); return [[BI.mass, 1 - g], [BI.ground, g]]; }
 const mossy = (y, ny, k) => { const m = MOSS * sm(.2, .8, ny) * sm(.1, CH * .6, y) * k; return m; };
 {
  const g = surf(Q(110, 40), Q(36, 14), (u, v, o) => { const a = u * TAU, e = lerp(-.14, PI / 2, v), r = domeR(e, a) * (1 + .04 * Math.sin(a * 37 + e * 19) * Math.sin(e * 3)); o[0] = Math.sin(a) * r; o[1] = domeY(e) - .03 + .03 * Math.sin(a * 17 + e * 29); o[2] = Math.cos(a) * r; }, (u, v) => [u * 8, v * 3]);
  const nn = g.attributes.normal;
  shadeBy(g, (x, y, z, i) => { const k = lerp(.34, .62, sm(-.02, CH, y)) * DARK, m = mossy(y, nn.getY(i), 1.2); return [k * lerp(1, .7, m), k * lerp(.9, 1.15, m), k * lerp(.82, .6, m)]; });
  attr(g, 'aVn', 2, (i, o) => { o[0] = .5; o[1] = .55 + .2 * (1 - g.attributes.position.getY(i) / CH); });
  put(M.wood, cnAll(skinW(g, wCrown), -1, 0));
 }
 {
  // twisted roots spiralling down over the dome and out into the soil, each a bundle of fibres
  for (let i = 0, n = Q(52, 12); i < n; i++) {
   const a0 = rnd() * TAU, e0 = rr(.4, 1.3), tw = (rnd() < .5 ? -1 : 1) * rr(.5, 2.2), endR = CR * rr(1.1, 2.05), r0 = rr(.06, .15), pts = [];
   for (let j = 0; j <= 12; j++) {
    const t = j / 12, a = a0 + tw * t, e = lerp(e0, 0, Math.pow(t, .8)), R = lerp(domeR(e, a) + r0 * .55, endR, sm(.58, 1, t));
    pts.push(V3(Math.sin(a) * R, domeY(e) * (1 - sm(.6, .95, t)) + r0 * .45 - .12 * sm(.88, 1, t), Math.cos(a) * R));
   }
   const kt = r2(.12, .7), kk = r2(.25, .6), ph = rnd() * 9, fib = r2(5, 8), rs = Q(12, 5);
   const g = tube(pts, Q(44, 10), rs, (t, th) => r0 * (1.2 - .6 * t) * (1 + .1 * Math.sin(th * fib + t * 40 + ph) + .08 * Math.sin(th * 2 + t * 13 + ph)) * (1 + kk * Math.exp(-Math.pow((t - kt) / .05, 2))), 6);
   g.computeVertexNormals();
   const nn = g.attributes.normal;
   shadeBy(g, (x, y, z, k) => { const c = (.6 + .25 * sm(0, CH, y)) * DARK, m = mossy(y, nn.getY(k), 1); return [c * lerp(1, .72, m), c * lerp(.92, 1.12, m), c * lerp(.85, .62, m)]; });
   vein(g, r2(.75, 1.05), .55 + .1 * (1 - e0 / 1.3), 1.6, rs + 1);
   put(M.wood, cnAll(skinW(g, wCrown), -1, 0));
  }
  // ribs: great roots that arch up out of the soil round the mound and plunge back in
  for (let i = 0, n = Q(11, 5); i < n; i++) {
   const a = (i + rr(.1, .9)) / n * TAU, Re = CR * rr(1.9, 2.7), hA = rr(.55, 1.1), r0 = rr(.1, .17), pts = [];
   for (let j = 0; j <= 12; j++) { const t = j / 12, R = lerp(CR * .8, Re, t), aa = a + .25 * Math.sin(PI * t); pts.push(V3(Math.sin(aa) * R, lerp(CH * .35, -.14, t) + hA * Math.sin(PI * Math.min(1, t * 1.15)), Math.cos(aa) * R)); }
   const rs = Q(14, 6), ph = rnd() * 9;
   const g = tube(pts, Q(48, 12), rs, (t, th) => r0 * (1.1 - .55 * t) * (1 + .1 * Math.sin(th * 6 + t * 50 + ph) + .1 * Math.sin(th * 2 + t * 15)), 6);
   g.computeVertexNormals(); shadeBy(g, () => [.66 * DARK, .6 * DARK, .54 * DARK]); vein(g, .9, .6, 1.4, rs + 1);
   put(M.wood, cnAll(skinW(g, wCrown), -1, 0));
  }
  // fine rootlets spreading over the ground
  for (let i = 0, n = Q(80, 14); i < n; i++) {
   const len = rr(1.2, 3.4), r0 = rr(.02, .05), pts = [];
   let a = rnd() * TAU, R = CR * rr(.82, .98);
   for (let j = 0; j <= 8; j++) { const t = j / 8; pts.push(V3(Math.sin(a) * R, .02 + r0 * .3 - .05 * sm(.85, 1, t), Math.cos(a) * R)); a += rr(-.1, .1); R += len / 8; }
   const g = tube(pts, Q(16, 5), Q(5, 3), (t) => r0 * (1 - .78 * t), 3); shadeBy(g, () => [.56 * DARK, .5 * DARK, .44 * DARK]); vein(g, .8, 1, 1.7, Q(5, 3) + 1);
   put(M.wood, cnAll(skinW(g, wCrown), -1, 0));
  }
  // dead canes: old grey arching canes, long since dead and still armed, snarled over the mound and out between its legs;
  // a real thicket is half dead wood. They stand stiff (held by the mound or the ground)
  for (let i = 0, n = Q(30, 8); i < n; i++) {
   const a0 = rnd() * TAU, a1 = a0 + rr(-.9, .9), R0 = CR * rr(.2, .8), R1 = CR * rr(1.3, 2.8), hgt = rr(.7, 2.2), r0 = rr(.03, .07), pts = [];
   for (let j = 0; j <= 10; j++) { const t = j / 10, a = lerp(a0, a1, t), R = lerp(R0, R1, t); pts.push(V3(Math.sin(a) * R, lerp(CH * rr(.5, .9), -.05, Math.pow(t, 1.6)) + hgt * Math.sin(PI * Math.min(1, t * 1.05)) * (1 - t * .3), Math.cos(a) * R)); }
   const curve = new THREE.CatmullRomCurve3(pts), rs = Q(7, 4), segs = Q(36, 8);
   const g = tube(curve, segs, rs, (t, th) => r0 * (1 - .55 * t) * (1 + .1 * Math.cos(5 * th)), 2.5);
   g.computeVertexNormals();
   const grey = rr(.62, .82);
   shadeBy(g, () => [grey * .95, grey * .9, grey * .86]); oldAll(g, 1); attr(g, 'aVn', 2, (i2, o) => { o[0] = 0; o[1] = 2; });
   put(M.bark, cnAll(skinW(g, wCrown), -1, 0));
   const P = V3(), T = V3(), Nn = V3();
   for (let k = 0, np = Q(Math.round(curve.getLength() * 7), 3); k < np; k++) {
    const t = (k + rnd3()) / np, r = r0 * (1 - .55 * t); curve.getPointAt(t, P); curve.getTangentAt(t, T);
    Nn.set(rnd3() - .5, rnd3() - .5, rnd3() - .5).addScaledVector(T, -0); Nn.addScaledVector(T, -Nn.dot(T)).normalize(); P.addScaledVector(Nn, r * .85);
    const tl = r * 1.6 + .02; put(M.vc, cnAll(skinW(prickle(P.clone(), Nn.clone(), T.clone(), tl, tl * .42, .5, true), () => wCrown(P.x, P.y, P.z)), -1, 0));
   }
  }
 }

 // ---------- the spire: three old canes braided round each other, out of the mound up to the bud ----------
 const spW = (s) => chainW(SP, SPS, SPN, s);
 const strandC = (j, s, out) => { const f = cl(s / SPL, 0, 1), ph = j * TAU / 3 + s * 1.45, R = lerp(.46, .26, f); return out.set(Math.sin(ph) * R, SPH + s, Math.cos(ph) * R); };
 for (let j = 0; j < 3; j++) {
  const pts = []; for (let i = 0; i <= 30; i++) pts.push(strandC(j, lerp(-.5, SPL + .3, i / 30), V3()));
  const rs = Q(25, 10);
  const g = tube(pts, Q(150, 30), rs, (t, th) => lerp(.4, .22, t) * (1 + .055 * Math.cos(th * 5 + t * 3 + j)) * (1 + .05 * Math.sin(th * 3 + t * 23 + j)) * (1 + .16 * Math.exp(-Math.pow(((t * 8 + j * .37) % 1 - .5) * 7, 2))), 3.2);
  g.computeVertexNormals();
  const p = g.attributes.position;
  shadeBy(g, (x, y, z, i) => { const ring = i % (rs + 1), th = ring / rs * TAU, gr = .5 + .5 * Math.cos(th * 5 + j), k = (.82 + .18 * sm(SPH, BY, y)) * DARK * lerp(.78, 1.06, gr); return [k, k * .95, k * .92]; });
  oldAll(g, 0); attr(g, 'aOld', 1, (i, o) => { o[0] = .85 - .5 * sm(SPH + SPL * .6, BY, p.getY(i)); });
  attr(g, 'aVn', 2, (i, o) => { const ring = i % (rs + 1), th = ring / rs * TAU; o[0] = .8 * (.35 + .65 * (.5 - .5 * Math.cos(th * 5 + j))); o[1] = .5 * (1 - cl((p.getY(i) - SPH) / SPL, 0, 1)); });
  put(M.bark, cnAll(skinW(g, (x, y) => spW(y - SPH)), -1, 0));
 }
 {
  // hooked prickles all the way up the braid, on its ridges
  const P = V3(), N = V3();
  for (let i = 0, n = Q(170, 30); i < n; i++) {
   const j = i % 3, s = lerp(-.1, SPL - .15, (i + rnd3() * .9) / n), a = j * TAU / 3 + s * 1.45 + rr(-.7, .7);
   N.set(Math.sin(a), rr(-.15, .35), Math.cos(a)).normalize(); strandC(j, s, P).addScaledVector(N, lerp(.38, .21, cl(s / SPL, 0, 1)));
   const tl = (.2 + .1 * rnd3()) * THS; put(M.vc, cnAll(skinW(prickle(P.clone(), N.clone(), YAX, tl, tl * .42), () => spW(s)), -1, 0));
  }
  // leaves up the braid, and a ruff of them under the bud
  for (let i = 0, n = Q(44, 14), nr = Q(16, 7); i < n; i++) {
   const top = i >= n - nr, s = top ? SPL - .05 : rr(.1, SPL - .5), a = top ? (i - n + nr + rnd() * .4) / nr * TAU : rnd() * TAU, R = top ? .42 : lerp(.75, .45, s / SPL);
   P.set(Math.sin(a) * R, SPH + s, Math.cos(a) * R);
   const Ly = V3(Math.sin(a), top ? rr(-.5, -.1) : rr(.1, .7), Math.cos(a)).normalize(), Ln = V3(rr(-.3, .3), 1, rr(-.3, .3)); Ln.addScaledVector(Ly, -Ln.dot(Ly)).normalize();
   const sz = top ? rr(.95, 1.25) : rr(.75, 1.05), kind = top ? (rnd() < .3 ? 1 : 0) : rnd() < .35 ? 1 : 0;
   const L = compoundLeaf(P.clone(), Ly, Ln, sz, kind, rnd() < .6, { amp: .7 });
   for (const g of L.leaf) put(M.leaf, cnAll(skinW(g, () => spW(s)), -1, 0));
   for (const g of L.stalk) put(M.vc, cnAll(skinW(g, () => spW(s)), -1, 0));
  }
 }

 // ---------- canes: five-angled, tapering, knotted, wine-dark with a waxy bloom, old and grey toward the base, armed with
 // hooked prickles on their angles, leafy, fruiting at the tips ----------
 const BERRIES = [];  // pendulum bones: { bone, len, X, Xp, ... }
 function addBunch(parent, local, at, n, size, cn) {
  const b = bone('b' + BERRIES.length, parent, local.x, local.y, local.z);
  const bn = bunch(n, size), M4 = _m4.makeTranslation(at.x, at.y, at.z);
  bn.berries.applyMatrix4(M4); put(M.berry, cnAll(rigid(bn.berries, b), cn[0], cn[1]));
  for (const s of bn.stems) { s.applyMatrix4(M4); put(M.vc, cnAll(rigid(s, b), cn[0], cn[1])); }
  BERRIES.push({ bone: b, len: size * .13, X: V3(), Xp: V3(), init: false, size, sway: rnd() * TAU });
  return b;
 }
 const RIDGE = (th, s, tw) => { const c = .5 + .5 * Math.cos(5 * (th + tw * s)); return c * c; }; // 1 on a ridge, 0 in a groove
 for (const C of CANES) {
  const d = V3(Math.sin(C.a), 0, Math.cos(C.a)), e1 = V3(Math.cos(C.a), 0, -Math.sin(C.a)), e2 = YAX, B = C.B, len = C.len;
  const rB = C.rB * (1 + .15 * TIER), rT = C.rT, kn = C.great ? .8 : .6, tw = r2(-.25, .25);
  const rad = (s) => (s < 0 ? rB * 1.12 : lerp(rB, rT, Math.pow(s / len, .72)) * (1 + .11 * Math.exp(-Math.pow((((s + .2) / kn) % 1 - .5) * 6, 2)))) * sm(len + .08, len - .2, s);
  const wob = (s, w) => { const k = sm(0, 1.4, s); w[0] = .05 * Math.sin(s * 1.1 + C.ph) * k; w[1] = .035 * Math.sin(s * 1.5 + C.ph * 1.7) * k; };
  const ax = (s, out) => { const w = [0, 0]; wob(s, w); return out.copy(B).addScaledVector(d, s).addScaledVector(e1, w[0]).addScaledVector(e2, w[1]); };
  C.rad = rad; C.ax = ax; C.d = d; C.e1 = e1; C.tw = tw;
  const oldTo = C.great ? 2.4 : 1.5, oldK = C.great ? 1 : .75;
  {
   const rs = Q(C.great ? 25 : 20, 10), nu = Q(Math.round(len * (C.great ? 24 : 22)), 28);
   const g = rodTube(B, d, e1, e2, -.35, len + .08, nu, rs, (s, th) => rad(s) * (1 + .085 * (2 * RIDGE(th, s, tw) - 1) * sm(-.3, .4, s) + .02 * Math.sin(th * 3 + s * 7)), wob, C.great ? 2.4 : 1.7), S = g.userData.S, TH = g.userData.TH;
   attr(g, 'color', 3, (i, o) => { const f = sm(.55, 1, S[i] / len), rg = RIDGE(TH[i], S[i], tw), ao = lerp(.74, 1.06, rg); o[0] = lin1(lerp(1, .9, f) * ao); o[1] = lin1(lerp(1, 1.12, f) * ao); o[2] = lin1(lerp(1, .74, f) * ao); });
   attr(g, 'aOld', 1, (i, o) => { o[0] = oldK * (1 - sm(oldTo * .4, oldTo, S[i])); });
   skinW(g, (x, y, z, i) => caneW(C, Math.max(0, S[i]))); attr(g, 'aCn', 2, (i, o) => { o[0] = C.k; o[1] = S[i] / len; });
   attr(g, 'aVn', 2, (i, o) => { const gr = 1 - RIDGE(TH[i], S[i], tw); o[0] = (C.great ? .6 : .45) * (.25 + .75 * gr); o[1] = (C.great ? .3 : .62) + Math.max(0, S[i]) / len * .9; });
   put(M.bark, g);
  }
  const P = V3(), N = V3(), O = V3(), Ly = V3(), Ln = V3();
  // hooked prickles on the cane's five angles
  for (let i = 0, n = Q(Math.round(len * 14), 10); i < n; i++) {
   const s = lerp(.12, len * .97, (i + rnd3() * .8) / n), th = (Math.floor(rnd3() * 5) * TAU / 5) - tw * s + r3(-.12, .12), r = rad(s) * 1.06;
   N.copy(e1).multiplyScalar(Math.cos(th)).addScaledVector(e2, Math.sin(th)); ax(s, P).addScaledVector(N, r * .92);
   const tl = (r * .62 + .025) * (rnd3() < .35 ? .55 : 1) * (.85 + .3 * rnd3()) * 1.25 * THS; put(M.vc, cnAll(skinW(prickle(P.clone(), N.clone(), d, tl, tl * .44), () => caneW(C, s)), C.k, s / len));
  }
  // great hooks toward the tips of the arms (and the mane and the front legs): what catch and hold
  for (let i = 0, n = { L: 9, M: 8, H: 4, F: 3 }[C.g] || 0; i < n; i++) {
   const s = lerp(.55, .94, (i + r2(.1, .9)) / n) * len, th = r2(-.9, .9) + (i % 2 ? PI : 0) - PI / 2, r = rad(s);
   N.copy(e1).multiplyScalar(Math.cos(th)).addScaledVector(e2, Math.sin(th)); ax(s, P).addScaledVector(N, r * .85);
   const tl = (r * 1.4 + .1) * THS; put(M.vc, cnAll(skinW(prickle(P.clone(), N.clone(), d, tl, tl * .4, r2(.8, 1)), () => caneW(C, s)), C.k, s / len));
  }
  // compound leaves on prickly stalks: five leaflets low down, three higher up, young bronze ones at the tip; the cold
  // has turned some wine-red, and the lowest on the legs are dead
  for (let i = 0, nL = Q(Math.round(len * 3.4), 6); i < nL; i++) {
   const f = lerp(.08, .96, (i + .2 + rnd() * .6) / nL), s = f * len, sg = i % 2 ? 1 : -1, th = sg > 0 ? rr(.1, .8) : PI - rr(.1, .8), r = rad(s);
   N.copy(e1).multiplyScalar(Math.cos(th)).addScaledVector(e2, Math.sin(th)); ax(s, P).addScaledVector(N, r * .8);
   Ly.copy(e1).multiplyScalar(sg * rr(.5, .9)).addScaledVector(e2, rr(.15, .6)).addScaledVector(d, rr(.3, .7)).normalize();
   Ln.copy(e2).addScaledVector(V3(rr(-1, 1), 0, rr(-1, 1)), .35); Ln.addScaledVector(Ly, -Ln.dot(Ly)).normalize();
   const sz = rr(.85, 1.2) * (C.great ? 1 : .9) * (1 - .3 * f), kind = f > .84 && rnd() < .45 ? 2 : !C.great && f < .22 && rnd() < .4 ? 3 : rnd() < .32 ? 1 : 0;
   const L = compoundLeaf(P.clone(), Ly.clone(), Ln.clone(), sz, kind, f < .55 && rnd() < .75, { amp: 1 });
   for (const g of L.leaf) put(M.leaf, cnAll(skinW(g, () => caneW(C, s)), C.k, f));
   for (const g of L.stalk) put(M.vc, cnAll(skinW(g, () => caneW(C, s)), C.k, f));
  }
  // fruit: a heavy bunch near the tip of each arm, the mane and the front and side legs, on its own pendulum, and a second
  // smaller one further in on the great canes
  if (C.g !== 'B') for (const f of C.great ? [.9, .66] : [.9]) {
   const s = f * len, ip = Math.min(NS, Math.round(s / C.seg)), w = [0, 0]; wob(s, w);
   const local = V3(w[0], w[1] - rad(s) * .8, s - ip * C.seg), at = ax(s, V3()).addScaledVector(e2, -rad(s) * .8);
   const nb = Math.max(3, Math.round((C.great ? 8 : 6) * (f < .8 ? .6 : 1) * (1 + .3 * TIER) * (.85 + .3 * rnd()) * Math.max(.5, DET)));
   const bb = addBunch(C.chain[ip], local, at, nb, (C.great ? 3.6 : 3) * (f < .8 ? .85 : 1) * (1 + .1 * TIER), [C.k, f]);
   if (f > .8) C.bunch1 = bb;
  }
  // where a leg's tip touches the soil it has rooted, as bramble tips do: a tuft of fine roots into the ground
  if (!C.great) {
   const s = len * .985, base0 = ax(s, V3());
   for (let i = 0; i < Q(6, 3); i++) {
    const a = rnd3() * TAU, L = r3(.18, .45), p1 = base0.clone().add(V3(Math.cos(a) * L * .4, -L * .35, Math.sin(a) * L * .4)), p2 = base0.clone().add(V3(Math.cos(a) * L, -L, Math.sin(a) * L));
    const g = tube([base0.clone(), p1, p2], 4, 3, (t) => .012 * (1 - .8 * t)); colorAll(g, [.52, .42, .34]);
    put(M.vc, cnAll(skinW(g, () => caneW(C, s)), C.k, .99));
   }
  }
 }
 // leaves round the legs' bases, hiding where they leave the mound
 for (const C of CANES) if (!C.great) for (let i = 0; i < Q(6, 3); i++) {
  const s = rr(.05, 1.3), P = C.ax(s, V3()).addScaledVector(YAX, C.rad(s) * .6), Ly = V3().copy(C.e1).multiplyScalar(rr(-1, 1)).addScaledVector(YAX, rr(.4, .9)).addScaledVector(C.d, rr(-.2, .5)).normalize();
  const Ln = V3(rr(-.5, .5), 1, rr(-.5, .5)); Ln.addScaledVector(Ly, -Ln.dot(Ly)).normalize();
  const L = compoundLeaf(P, Ly, Ln, rr(.8, 1.1), rnd() < .3 ? 1 : 0, true, { amp: .8 });
  for (const g of L.leaf) put(M.leaf, cnAll(skinW(g, () => caneW(C, s)), C.k, s / C.len));
  for (const g of L.stalk) put(M.vc, cnAll(skinW(g, () => caneW(C, s)), C.k, s / C.len));
 }

 // ---------- the mound's own leaves: the thicket it hides in, dead ones low down, fallen ones round it, and fruit ----------
 {
  const P = V3(), N = V3(), Ly = V3(), Ln = V3();
  for (let i = 0, n = Q(300, 60); i < n; i++) {
   const a = rnd() * TAU, e0 = Math.asin(Math.pow(rnd(), .75)) * 1.1, low = e0 < .35, e = Math.min(e0, 1.2);
   domeP(e, a, rr(.98, 1.18), P); domeN(e, a, N); P.y += .03;
   Ly.copy(N).add(V3(rr(-.5, .5), rr(.2, .7), rr(-.5, .5))).normalize();
   Ln.copy(YAX).multiplyScalar(.7).addScaledVector(N, .5).add(V3(rr(-.3, .3), 0, rr(-.3, .3))); Ln.addScaledVector(Ly, -Ln.dot(Ly)).normalize();
   const kind = low && rnd() < .4 ? 3 : rnd() < .08 ? 2 : rnd() < .35 ? 1 : 0;
   const L = compoundLeaf(P.clone().addScaledVector(Ly, -.08), Ly.clone(), Ln.clone(), rr(.8, 1.15), kind, rnd() < .6, { amp: .7 });
   for (const g of L.leaf) put(M.leaf, cnAll(skinW(g, () => [[BI.mass, 1]]), -1, 0));
   for (const g of L.stalk) put(M.vc, cnAll(skinW(g, () => [[BI.mass, 1]]), -1, 0));
  }
  // fallen leaves on the soil round it: wine-red and brown, lying flat, held by the ground
  for (let i = 0, n = Q(110, 20); i < n; i++) {
   const a = rnd() * TAU, R = CR * (.9 + 1.6 * Math.sqrt(rnd())); P.set(Math.sin(a) * R, .025, Math.cos(a) * R);
   Ly.set(rr(-1, 1), rr(-.05, .08), rr(-1, 1)).normalize(); Ln.set(rr(-.15, .15), 1, rr(-.15, .15)); Ln.addScaledVector(Ly, -Ln.dot(Ly)).normalize();
   const L = compoundLeaf(P.clone(), Ly.clone(), Ln.clone(), rr(.5, .8), rnd() < .55 ? 3 : 1, rnd() < .5, { amp: .05, thin: 1 });
   for (const g of L.leaf) put(M.leaf, cnAll(skinW(g, () => [[BI.ground, 1]]), -1, 0));
   for (const g of L.stalk) put(M.vc, cnAll(skinW(g, () => [[BI.ground, 1]]), -1, 0));
  }
  for (let i = 0, nb = Math.max(3, Math.round(6 * DET)); i < nb; i++) { const at = domeP(rr(.4, .95), (i + rnd() * .6) / nb * TAU, 1.05, V3()); addBunch(mass, at, at, Math.max(3, Math.round(rr(4, 7) * Math.max(.5, DET))), 2.6, [-1, 0]); }
 }
 // ---------- the bud: five sepals round five petals, a crowd of stamens, a ring of fangs, and the heart ----------
 for (const F of SEP.concat(PET)) {
  const isS = F.n === 3, out = V3(Math.sin(F.a), 0, Math.cos(F.a)), tg = V3(Math.cos(F.a), 0, -Math.sin(F.a)), B = V3(out.x * F.r, BY + F.y, out.z * F.r), W = isS ? 1.5 : 1.55, cup = isS ? .2 : .28;
  const ph = rnd() * 9, crink = isS ? 0 : .022, nu = Q(isS ? 12 : 16, 6), nv = Q(isS ? 24 : 18, 8);
  const g = surf(nu, nv, (u, v, o) => {
   const xn = u * 2 - 1, x = xn * W / 2, c = cup * W * xn * xn * Math.sin(PI * Math.min(1, .15 + v)) + (isS ? .05 * W * Math.pow(Math.abs(xn), 3) * v : .06 * W * Math.pow(Math.abs(xn), 4) * v);
   const wr = crink * (Math.sin(u * 23 + v * 5 + ph) * .6 + Math.sin(v * 31 + u * 7 + ph * 2) * .4) * sm(0, .3, v);
   o[0] = B.x + tg.x * x - out.x * (c + wr); o[1] = B.y + v * F.len; o[2] = B.z + tg.z * x - out.z * (c + wr);
  }, (u, v) => [(isS ? .5 : 0) + u * .5, v]);
  colorAll(g, isS ? [DARK, DARK, DARK] : [1, 1, 1]);
  put(M.bloom, skinW(g, (x, y) => chainW(F.ch, F.seg, F.n, y - B.y)));
  if (isS) { // prickles down its back, and a hooked claw at its tip
   for (let i = 0; i < Q(7, 4); i++) { const s = (.14 + i * .12) * F.len, P = B.clone().addScaledVector(YAX, s).addScaledVector(out, .02).addScaledVector(tg, r3(-.12, .12)); put(M.vc, skinW(prickle(P, out.clone().addScaledVector(YAX, .35).normalize(), YAX, .2 * THS, .07), () => chainW(F.ch, F.seg, F.n, s))); }
   const s = F.len * .96; put(M.vc, skinW(prickle(B.clone().addScaledVector(YAX, s), YAX.clone().addScaledVector(out, -.5).normalize(), out, .36 * THS, .08, .9), () => chainW(F.ch, F.seg, F.n, s)));
  }
 }
 for (let i = 0, n = Q(170, 36); i < n; i++) { // stamens: pale filaments in three rings round the heart, gold anthers at their tips
  const ring = i % 3, a = (i + rnd3() * .8) / n * TAU, r0 = rr(.56, .66) - ring * .03, r1 = r0 + rr(.2, .45) + ring * .1, h = rr(.42, .74) + ring * .08, y0 = BY + .14;
  const p0 = V3(Math.sin(a) * r0, y0, Math.cos(a) * r0), p1 = V3(Math.sin(a) * (r0 + r1) * .5, y0 + h * .72, Math.cos(a) * (r0 + r1) * .5), p2 = V3(Math.sin(a) * r1, y0 + h, Math.cos(a) * r1);
  const f = tube([p0, p1, p2], DET > .6 ? 5 : 3, DET > .6 ? 4 : 3, (t) => .013 * (1 - .45 * t));
  colorAll(f, [.92, .8, .82]); put(M.vc, rigid(f, stam));
  const an = new THREE.SphereGeometry(.035, DET > .6 ? 6 : 4, DET > .6 ? 4 : 3); an.deleteAttribute('uv'); an.scale(1, 1.6, 1); an.rotateZ(rr(-.5, .5)); an.translate(p2.x, p2.y + .03, p2.z); colorAll(an, [.98, .72, .26]); put(M.vc, rigid(an, stam));
 }
 for (let i = 0; i < 10; i++) { // a ring of fangs, curving in over the heart
  const a = (i + .5) / 10 * TAU, out = V3(Math.sin(a), 0, Math.cos(a));
  put(M.vc, rigid(prickle(V3(out.x * .7, BY + .1, out.z * .7), V3(-out.x * .6, .8, -out.z * .6).normalize(), out, .58 * THS, .11, .85), bud));
 }
 { // the heart: a blackberry as big as a barrel, its drupelets lit from inside, each with its style still standing
  const o = { p: [], n: [], c: [], i: [], h: [] }, HR = .58, HL = 1.2, cy = BY + .12 + HL * .5, N = Q(320, 80), _t = V3(), _qq = new THREE.Quaternion(), _z = V3(0, 0, 1), nn = V3();
  const CG = DRUP.p.length / 3, ring1 = DET > .6 ? 7 : 5, hc = lc([.22, .03, .1]);
  for (let k = 0; k < N; k++) {
   const z = 1 - 2 * (k + .5) / N, q = Math.sqrt(1 - z * z), th = k * 2.39996, nx = q * Math.cos(th), nz = q * Math.sin(th), r = HR * .18 * Math.sqrt(130 / N) * 1.25 * (1 - .3 * Math.max(0, -z)) * (.92 + .16 * rnd3()), gl = rnd3();
   const px = nx * HR, py = cy + z * HL * .5, pz = nz * HR, b = o.p.length / 3;
   _qq.setFromUnitVectors(_z, nn.set(nx / HR, z / (HL * .5), nz / HR).normalize());
   for (let m = 0; m < CG; m++) { _t.set(DRUP.p[m * 3], DRUP.p[m * 3 + 1], DRUP.p[m * 3 + 2]).applyQuaternion(_qq); o.p.push(px + _t.x * r, py + _t.y * r, pz + _t.z * r); o.n.push(_t.x, _t.y, _t.z); o.c.push(hc[0], hc[1], hc[2]); o.h.push(.12 + .55 * gl, m === 0 ? 1 : m <= ring1 ? .55 : 0); }
   for (const ii of DRUP.i) o.i.push(b + ii);
   if (DET > .6 && rnd3() < .7) { // a style: a fine glowing whisker
    const hb = o.p.length / 3, L = r * r3(.9, 1.6), w = r * .06, e = V3().crossVectors(nn, Math.abs(nn.y) < .9 ? YAX : _z).normalize();
    _t.set(px, py, pz).addScaledVector(nn, r * .9);
    o.p.push(_t.x - e.x * w, _t.y - e.y * w, _t.z - e.z * w, _t.x + e.x * w, _t.y + e.y * w, _t.z + e.z * w, _t.x + nn.x * L, _t.y + nn.y * L, _t.z + nn.z * L);
    for (let m = 0; m < 3; m++) { o.n.push(nn.x, nn.y, nn.z); o.c.push(hc[0], hc[1], hc[2]); o.h.push(.05, .3); }
    o.i.push(hb, hb + 1, hb + 2, hb, hb + 2, hb + 1);
   }
  }
  const b = o.p.length / 3; for (let m = 0; m < CORE.p.length; m += 3) { o.p.push(CORE.p[m] * HR * .9, cy + CORE.p[m + 1] * HL * .45, CORE.p[m + 2] * HR * .9); o.n.push(CORE.p[m], CORE.p[m + 1], CORE.p[m + 2]); o.c.push(hc[0] * .4, hc[1] * .4, hc[2] * .4); o.h.push(.06, 0); }
  for (const ii of CORE.i) o.i.push(b + ii);
  put(M.heart, rigid(geo(o.p, o.i, { normal: [o.n, 3], color: [o.c, 3], aHt: [o.h, 2] }), heart));
 }

 // ---------- Thornwood: thorned shoots as tall as young trees that burst up out of the soil round the prey ----------
 // Each is a chain of UN + 1 bones under the ground bone, built along +Z and parked under the soil at a scale of nothing;
 // animate() plants them in a ring round the prey's feet, grows them up, closes them over it and draws them back down.
 const SNARE = [], UN = 4, NE = Q(10, 7);
 for (let m = 0; m < NE; m++) {
  const len = r2(3, 4.2), seg = len / UN, B = V3(0, -1, 0), d = V3(0, 0, 1), e1 = V3(1, 0, 0), e2 = V3(0, 1, 0), tw = r2(-.3, .3);
  const b0 = bone('u' + m + '_0', ground, B.x, B.y, B.z, 'YXZ');
  const chain = [b0]; for (let i = 1; i <= UN; i++) chain.push(bone('u' + m + '_' + i, chain[i - 1], 0, 0, seg));
  const rad = (s) => lerp(.19, .03, Math.pow(Math.max(0, s) / len, .8)) * sm(len + .04, len - .14, s) * (1 + .12 * Math.exp(-Math.pow(((Math.max(0, s) / .8) % 1 - .5) * 6, 2)));
  const ph = r2(0, TAU), wob = (s, w) => { w[0] = .07 * Math.sin(s * 1.6 + ph); w[1] = .05 * Math.sin(s * 1.2 + ph * 1.3); };
  const g = rodTube(B, d, e1, e2, -.1, len + .04, Q(60, 12), Q(15, 6), (s, th) => rad(s) * (1 + .08 * (2 * RIDGE(th, s, tw) - 1)), wob, 1.6), S = g.userData.S, TH = g.userData.TH;
  skinW(g, (x, y, z, i) => chainW(chain, seg, UN, S[i])); attr(g, 'color', 3, (i, o) => { const f = S[i] / len, ao = lerp(.76, 1.05, RIDGE(TH[i], S[i], tw)); o[0] = lin1(lerp(.95, .86, f) * ao); o[1] = lin1(lerp(.88, 1.1, f) * ao); o[2] = lin1(lerp(.9, .72, f) * ao); });
  attr(g, 'aVn', 2, (i, o) => { o[0] = .5 * (1 - RIDGE(TH[i], S[i], tw)); o[1] = 1.4 + S[i] / len * .5; });
  put(M.bark, cnAll(g, -1, 0));
  const P = V3(), N = V3(), w = [0, 0];
  for (let i = 0, n = Q(Math.round(len * 16), 8); i < n; i++) {
   const s = lerp(.15, len * .95, (i + r3(.1, .9)) / n), th = Math.floor(rnd3() * 5) * TAU / 5 - tw * s + r3(-.1, .1), r = rad(s); wob(s, w);
   N.copy(e1).multiplyScalar(Math.cos(th)).addScaledVector(e2, Math.sin(th)); P.copy(B).addScaledVector(d, s).addScaledVector(e1, w[0]).addScaledVector(e2, w[1]).addScaledVector(N, r * .9);
   const tl = (r * 1.1 + .06) * 1.3 * THS; put(M.vc, cnAll(skinW(prickle(P.clone(), N.clone(), d, tl, tl * .42, r3(.6, .95)), () => chainW(chain, seg, UN, s)), -1, 0));
  }
  for (let i = 0; i < Q(4, 2); i++) {
   const s = r2(.3, .85) * len, sg = i % 2 ? 1 : -1; wob(s, w); P.copy(B).addScaledVector(d, s).addScaledVector(e1, w[0]).addScaledVector(e2, w[1]);
   const Ly = V3().copy(e1).multiplyScalar(sg * r2(.5, .9)).addScaledVector(d, r2(.3, .7)).addScaledVector(e2, r2(-.3, .3)).normalize(), Ln = V3().copy(e2).addScaledVector(d, .3);
   Ln.addScaledVector(Ly, -Ln.dot(Ly)).normalize();
   const L = compoundLeaf(P.clone().addScaledVector(Ly, .06), Ly, Ln, r2(.5, .7), rnd2() < .7 ? 2 : 0, false, { amp: 1.2, thin: rnd2() });
   for (const gg of L.leaf) put(M.leaf, cnAll(skinW(gg, () => chainW(chain, seg, UN, s)), -1, 0));
   for (const gg of L.stalk) put(M.vc, cnAll(skinW(gg, () => chainW(chain, seg, UN, s)), -1, 0));
  }
  SNARE.push({ chain, len, a: (m + r2(-.3, .3)) / NE * TAU, R: r2(1.3, 1.9), t0: r2(0, .06), lean: r2(.25, .45), curl: r2(.3, .4), ph: r2(0, TAU), g: 0, up: false, down: false });
 }
 // ---------- bind ----------
 base.scale.setScalar(SZ);
 root.updateMatrixWorld(true);
 const skeleton = new THREE.Skeleton(bones);
 const bodyMeshes = [], SHADOWS = !!opts.shadows;
 for (const [mat, list] of BK) {
  const m = new THREE.SkinnedMesh(mergeAll(list), mat); m.frustumCulled = false; base.add(m); bodyMeshes.push(m);
  m.castShadow = m.receiveShadow = SHADOWS; if (SHADOWS) m.customDepthMaterial = depthOf(mat);
 }
 BK.clear();
 root.updateMatrixWorld(true);
 for (const m of bodyMeshes) m.bind(skeleton);
 for (const b of bones) b.userData.bind = { p: b.position.clone(), q: b.quaternion.clone(), parent: b.parent };
 const soil = new THREE.Mesh(new THREE.CircleGeometry(CR * 2.9, Q(64, 20)), M.soil); soil.rotation.x = -PI / 2; soil.position.y = .006; soil.renderOrder = -1; soil.receiveShadow = SHADOWS; base.add(soil);

 // ---------- its roots under the meadow, for state.xray ----------
 // Fifteen great roots run out from under the mound, sinking as they go and branching twice, out to about 22 m: the reach
 // it feels the meadow with and spreads its warmth through. Drawn only in x-ray, as lines of light the heartbeat runs out
 // along (aVn as the veins': x brightness, y how far along from the heart).
 const xroots = (() => {
  const pos = [], idx = [], vn = [], P = V3(), D = V3(), T = V3(), E1 = V3(), E2 = V3();
  function root1(p0, dir, len, r0, d0, depth) {
   const n = Math.max(6, Math.round(len * 1.6)), pts = [p0.clone()], q = p0.clone(), dd = dir.clone();
   for (let i = 1; i <= n; i++) { dd.x += r3(-.25, .25); dd.z += r3(-.25, .25); dd.y = lerp(dd.y, -.08, .3) + r3(-.05, .05); dd.normalize(); q.addScaledVector(dd, len / n); q.y = Math.min(q.y, -.12); pts.push(q.clone()); }
   const curve = new THREE.CatmullRomCurve3(pts), segs = n * 3, rs = 4, b = pos.length / 3;
   const fr = curve.computeFrenetFrames(segs, false);
   for (let i = 0; i <= segs; i++) {
    const t = i / segs; curve.getPointAt(t, P); const r = r0 * (1 - .7 * t);
    for (let j = 0; j <= rs; j++) { const th = j / rs * TAU; D.copy(fr.normals[i]).multiplyScalar(Math.cos(th)).addScaledVector(fr.binormals[i], Math.sin(th)); pos.push(P.x + D.x * r, P.y + D.y * r, P.z + D.z * r); vn.push(lerp(1, .35, t) * (depth ? .7 : 1), d0 + t * len / 10); }
   }
   for (let i = 0; i < segs; i++) for (let j = 0; j < rs; j++) { const a = b + i * (rs + 1) + j, c = a + rs + 1; idx.push(a, c, a + 1, a + 1, c, c + 1); }
   if (depth < 2) for (let k = 0, nb = depth ? 2 : 3; k < nb; k++) {
    const t = r3(.25, .85); curve.getPointAt(t, P); curve.getTangentAt(t, T); E1.set(-T.z, 0, T.x).normalize().multiplyScalar(rnd3() < .5 ? -1 : 1);
    root1(P.clone(), T.clone().lerp(E1, r3(.5, .9)).normalize(), len * r3(.35, .6), r0 * (1 - .7 * t) * .8, d0 + t * len / 10, depth + 1);
   }
   void E2;
  }
  for (let i = 0; i < 15; i++) { const a = (i + r3(.1, .9)) / 15 * TAU; root1(V3(Math.sin(a) * CR * .5, -.3, Math.cos(a) * CR * .5), V3(Math.sin(a), -.25, Math.cos(a)).normalize(), r3(13, 21), r3(.07, .12), .6, 0); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aVn', new THREE.Float32BufferAttribute(vn, 2)); g.setIndex(idx);
  const m = new THREE.Mesh(g, M.xray); m.frustumCulled = false; m.visible = false; m.renderOrder = 20; base.add(m); return m;
 })();

 // ---------- points: world-sized soft sprites with their own color, size and spin ----------
 const PV = 'attribute vec4 aCol; attribute float aSize; attribute float aRot; uniform float uScale; varying vec4 vC; varying float vR;\nvoid main(){ vC = aCol; vR = aRot; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = aCol.a > 0.002 ? aSize * uScale * projectionMatrix[1][1] / -mv.z : 0.0; }';
 const PF = 'uniform sampler2D uMap; varying vec4 vC; varying float vR;\nvoid main(){ vec2 p = gl_PointCoord - .5; float c = cos(vR), s = sin(vR); p = vec2(c * p.x - s * p.y, s * p.x + c * p.y) + .5; if (p.x < 0. || p.x > 1. || p.y < 0. || p.y > 1.) discard; vec4 t = texture2D(uMap, vec2(p.x, 1.0 - p.y)); gl_FragColor = vec4(vC.rgb * t.rgb, vC.a * t.a); }';
 const _v2 = new THREE.Vector2();
 function points(n, map, blend, order) {
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 4), size = new Float32Array(n), rot = new Float32Array(n), g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aCol', new THREE.BufferAttribute(col, 4).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aSize', new THREE.BufferAttribute(size, 1).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aRot', new THREE.BufferAttribute(rot, 1).setUsage(THREE.DynamicDrawUsage));
  const m = new THREE.ShaderMaterial({ uniforms: { uMap: { value: map }, uScale: { value: 400 } }, vertexShader: PV, fragmentShader: PF, transparent: true, depthWrite: false, blending: blend });
  const p = new THREE.Points(g, m); p.frustumCulled = false; p.renderOrder = order || 8;
  p.onBeforeRender = (r) => { const rt = r.getRenderTarget(); if (rt) m.uniforms.uScale.value = rt.height * .5; else { r.getDrawingBufferSize(_v2); m.uniforms.uScale.value = _v2.y * .5; } };
  return { p, pos, col, size, rot, g, n, m, vel: new Float32Array(n * 3), life: new Float32Array(n), max: new Float32Array(n).fill(1), base: new Float32Array(n * 4), sz: new Float32Array(n * 2), drag: new Float32Array(n), up: new Float32Array(n), spin: new Float32Array(n), sway: new Float32Array(n), next: 0, live: 2 };
 }
 // falling leaves and petals, dust and soil, motes (pollen, stolen life, embers), chips (bark and thorn, berry juice, sap
 // and clods of soil, all heavy and dark), and flames
 const LF = points(Q(220, 100), leafT, THREE.NormalBlending, 8), DU = points(240, puffT, THREE.NormalBlending, 7), MO = points(380, dotT, THREE.AdditiveBlending, 9), CHP = points(320, dotT, THREE.NormalBlending, 8);
 const FL = points(Q(180, 90), flameT, THREE.AdditiveBlending, 9); FL.upright = true; FL.end = C3(.55, .06, .02);
 // its breath: steam rising off the warm mound and out of the bud into the cold air
 const STM = points(Q(300, 120), steamT, THREE.NormalBlending, 6); STM.upright = true;
 fx.add(LF.p, DU.p, MO.p, CHP.p, FL.p, STM.p);
 // whip trails: a ribbon behind each great cane's tip and each front leg's, all in one mesh
 const TRN = 16, TRC = CANES.filter((c) => c.great || c.g === 'F'), trPos = new Float32Array(TRC.length * TRN * 6), trCol = new Float32Array(TRC.length * TRN * 6), trIdx = [];
 for (let r = 0; r < TRC.length; r++) for (let i = 0; i < TRN - 1; i++) { const a = (r * TRN + i) * 2; trIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
 const trG = new THREE.BufferGeometry(); trG.setAttribute('position', new THREE.BufferAttribute(trPos, 3).setUsage(THREE.DynamicDrawUsage)); trG.setAttribute('color', new THREE.BufferAttribute(trCol, 3).setUsage(THREE.DynamicDrawUsage)); trG.setIndex(trIdx);
 const trail = new THREE.Mesh(trG, new THREE.MeshBasicMaterial(Object.assign({ vertexColors: true, side: THREE.DoubleSide }, ADD))); trail.frustumCulled = false; trail.visible = false; trail.renderOrder = 7; fx.add(trail);
 const TR = TRC.map((C) => ({ C, tip: Array.from({ length: TRN }, () => V3()), mid: Array.from({ length: TRN }, () => V3()), prev: 0 }));
 // the heart's light, spilling out between the sepals onto the canes round it, and the firelight while it burns
 const heartLight = new THREE.PointLight(0xff3a6a, 0, 11 * SZ, 2), fireLight = new THREE.PointLight(0xff7a2c, 0, 9 * SZ, 2); fx.add(heartLight, fireLight);
 // cracks in the ground: six strips, each from ckA to ckB, rewritten every frame they show; their roots glow like the veins
 const NCK = 6, ckPos = new Float32Array(NCK * 12), ckUv = [], ckIdx = [], ckA = [], ckB = [], ckOn = new Float32Array(NCK);
 for (let i = 0; i < NCK; i++) { ckUv.push(0, 0, 0, 1, 1, 0, 1, 1); const b = i * 4; ckIdx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); ckA.push(V3()); ckB.push(V3()); }
 const ckG = new THREE.BufferGeometry(); ckG.setAttribute('position', new THREE.BufferAttribute(ckPos, 3).setUsage(THREE.DynamicDrawUsage)); ckG.setAttribute('uv', new THREE.Float32BufferAttribute(ckUv, 2)); ckG.setIndex(ckIdx);
 const crack = new THREE.Mesh(ckG, new THREE.ShaderMaterial({
  uniforms: { uMap: { value: crackT }, uOpen: { value: 0 }, uGlow: { value: 0 }, uFade: { value: 0 }, uGlowC: U.veinC },
  vertexShader: 'varying vec2 vUv;\nvoid main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: 'uniform sampler2D uMap; uniform float uOpen, uGlow, uFade; uniform vec3 uGlowC; varying vec2 vUv;\n' +
   'void main(){ vec4 t = texture2D(uMap, vUv); float o = (1. - smoothstep(uOpen - .06, uOpen, vUv.x)) * smoothstep(0., .08, vUv.x) * (1. - smoothstep(.93, 1., vUv.x)) * uFade;\n' +
   ' vec3 c = mix(vec3(.025, .016, .012), vec3(.3, .22, .15), t.b * (1. - t.r)); c = mix(c, uGlowC * 1.8, t.g * uGlow);\n' +
   ' float a = max(max(t.r, t.b * .7), t.g * uGlow) * o; if (a < .01) discard; gl_FragColor = vec4(c, a); }',
  transparent: true, depthWrite: false, side: THREE.DoubleSide }));
 crack.frustumCulled = false; crack.visible = false; crack.renderOrder = 6; fx.add(crack);
 // shockwaves: rings racing out over the ground (the Awakening's roar, Hammerfall, Wrath, the spire's fall). Dust ones
 // darken what they pass over; glowing ones add light.
 const SHK = [0, 1, 2, 3].map(() => {
  const m = new THREE.Mesh(new THREE.RingGeometry(.6, 1, Q(80, 40), 1), new THREE.ShaderMaterial({
   uniforms: { uC: { value: new THREE.Color() }, uA: { value: 0 } }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
   vertexShader: 'varying float vR;\nvoid main(){ vR = length(position.xy); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
   fragmentShader: 'uniform vec3 uC; uniform float uA; varying float vR;\nvoid main(){ float e = smoothstep(.62, .92, vR) * (1. - smoothstep(.94, 1., vR)); if (e * uA < .004) discard; gl_FragColor = vec4(uC, e * uA); }' }));
  m.rotation.x = -PI / 2; m.frustumCulled = false; m.visible = false; m.renderOrder = 6; fx.add(m);
  return { m, t: 0, dur: 1, r0: 0, r1: 1, a: 0 };
 });
 let shkN = 0;
 function shock(x, z, r0, r1, dur, col, a, glow) { const S = SHK[shkN++ % SHK.length]; S.m.position.set(x, root.position.y + .04, z); S.t = 0; S.dur = dur; S.r0 = r0; S.r1 = r1; S.a = a; S.m.material.uniforms.uC.value.copy(col); S.m.material.blending = glow ? THREE.AdditiveBlending : THREE.NormalBlending; S.m.visible = true; }
 // Thorn Volley's thorns: thrown in high arcs, sticking where they land, then crumbling away (one instanced mesh)
 const NTV = 30, TV = new THREE.InstancedMesh(prickle(V3(), V3(0, 0, 1), V3(0, 1, 0), 1, .17, .45), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .45 }), NTV);
 TV.instanceMatrix.setUsage(THREE.DynamicDrawUsage); TV.frustumCulled = false; fx.add(TV);
 const TVS = Array.from({ length: NTV }, () => ({ t: -1, T: 1, p0: V3(), v: V3(), d: V3(), spin: 0, stick: -1 })), M0 = new THREE.Matrix4().makeScale(0, 0, 0);
 for (let i = 0; i < NTV; i++) TV.setMatrixAt(i, M0);
 let tvN = 0;
 // ribbons: life spiralling down the spire into the roots as it feeds (Devour), or pollen streaming to its prey (Siren Bloom)
 const DRN = 3, DRS = 26, drPos = new Float32Array(DRN * (DRS + 1) * 6), drCol = new Float32Array(DRN * (DRS + 1) * 6), drIdx = [];
 for (let r = 0; r < DRN; r++) for (let i = 0; i < DRS; i++) { const a = (r * (DRS + 1) + i) * 2; drIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
 const drG = new THREE.BufferGeometry(); drG.setAttribute('position', new THREE.BufferAttribute(drPos, 3).setUsage(THREE.DynamicDrawUsage)); drG.setAttribute('color', new THREE.BufferAttribute(drCol, 3).setUsage(THREE.DynamicDrawUsage)); drG.setIndex(drIdx);
 const drain = new THREE.Mesh(drG, new THREE.MeshBasicMaterial(Object.assign({ vertexColors: true, side: THREE.DoubleSide }, ADD))); drain.frustumCulled = false; drain.visible = false; drain.renderOrder = 8; fx.add(drain);

 function emit(P, x, y, z, vx, vy, vz, life, c, a, s0, s1, drag, up, spin, sway) {
  const i = P.next; P.next = (i + 1) % P.n; P.live = 2;
  P.pos[i * 3] = x; P.pos[i * 3 + 1] = y; P.pos[i * 3 + 2] = z; P.vel[i * 3] = vx; P.vel[i * 3 + 1] = vy; P.vel[i * 3 + 2] = vz;
  P.life[i] = P.max[i] = life; P.base[i * 4] = c.r; P.base[i * 4 + 1] = c.g; P.base[i * 4 + 2] = c.b; P.base[i * 4 + 3] = a; P.sz[i * 2] = s0; P.sz[i * 2 + 1] = s1;
  P.drag[i] = drag || 0; P.up[i] = up || 0; P.spin[i] = spin || 0; P.sway[i] = sway || 0; P.rot[i] = P.upright ? 0 : rnd() * TAU;
 }
 function stepP(P, dt, fadeIn, t) {
  if (P.live <= 0) return;
  const pos = P.pos, vel = P.vel, col = P.col; let alive = 0;
  for (let i = 0; i < P.n; i++) {
   if (P.life[i] <= 0) { if (col[i * 4 + 3] !== 0) { col[i * 4 + 3] = 0; P.size[i] = 0; } continue; }
   alive++; P.life[i] -= dt; const age = 1 - Math.max(0, P.life[i]) / P.max[i], dr = Math.exp(-P.drag[i] * dt);
   vel[i * 3] *= dr; vel[i * 3 + 1] = vel[i * 3 + 1] * dr + P.up[i] * dt; vel[i * 3 + 2] *= dr;
   const sw = P.sway[i] ? P.sway[i] * Math.sin(t * 3.1 + i * 1.7) : 0;
   pos[i * 3] += (vel[i * 3] + sw) * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += (vel[i * 3 + 2] + sw * .6) * dt;
   if (pos[i * 3 + 1] < .01) { pos[i * 3 + 1] = .01; vel[i * 3] *= .5; vel[i * 3 + 1] = 0; vel[i * 3 + 2] *= .5; P.spin[i] *= .9; }
   P.rot[i] += P.spin[i] * dt;
   const k = Math.min(1, age / (fadeIn || .15)) * (1 - age * age);
   if (P.end) { const f = Math.min(1, age * 1.4); col[i * 4] = lerp(P.base[i * 4], P.end.r, f); col[i * 4 + 1] = lerp(P.base[i * 4 + 1], P.end.g, f); col[i * 4 + 2] = lerp(P.base[i * 4 + 2], P.end.b, f); }
   else { col[i * 4] = P.base[i * 4]; col[i * 4 + 1] = P.base[i * 4 + 1]; col[i * 4 + 2] = P.base[i * 4 + 2]; }
   col[i * 4 + 3] = P.base[i * 4 + 3] * k;
   P.size[i] = lerp(P.sz[i * 2], P.sz[i * 2 + 1], age);
  }
  P.live = alive > 0 ? 2 : P.live - 1;
  for (const k of ['position', 'aCol', 'aSize', 'aRot']) P.g.attributes[k].needsUpdate = true;
 }
 // ---------- poses and actions ----------
 // body: y the mound's rise (it sinks deep into the earth before it appears), lean, tw twist, rl roll, sq squash, sw swirl
 //   (every cane turns the same way round it; Maelstrom spins it), coil (every cane curls sideways along its length), pulse
 //   breathing, gr growth
 // spire: sp pitch (+ forward), sb the bow of its top, sy twist, ss side bend, sk how far it turns to its prey, fall (felled,
 //   it topples forward and to its right)
 // bud: op how open (0 a closed bud, 1 a flower, more flares it), hb the heart's glow, gp a gulp (the bud swells), inn the
 //   prey is inside it
 // canes, by group (L the lead arm, M the other arm, H the mane, F, S and B the legs): l lift, c curl (negative arches it
 //   back), t tip curl, y swing toward the front, w writhe, k reach for the target (state.target)
 // reach: ikd how far toward the target, ikh height added (meters), wrap the tip's coil round what it holds, pull drags the
 //   reach point into the flower (where it feeds), tn twines the arms round each other
 // look: glow (the fruit gleams), lure (pollen), fade (1 solid, 0 gone), trail (whip trails), rust (leaves rustle), wither,
 //   dust, drain (life running down into the roots), shed (falling leaves), feed (the veins glow), fire
 const G6 = ['L', 'M', 'H', 'F', 'S', 'B'];
 function cg(g, l, c, t, y, w, k) { const o = {}, gs = g === '*' ? G6 : g.split(''); for (const q of gs) { if (l !== undefined) o[q + 'l'] = l; if (c !== undefined) o[q + 'c'] = c; if (t !== undefined) o[q + 't'] = t; if (y !== undefined) o[q + 'y'] = y; if (w !== undefined) o[q + 'w'] = w; if (k !== undefined) o[q + 'k'] = k; } return o; }
 const K = (...a) => Object.assign({}, ...a);
 // battle idle: the spire leaning a little at its prey, the bud just parted on the heart's glow, the arms arched out with
 // their tips on the soil before it, the mane up and back, the legs arched out round it like a spider's
 const BASE = K({ y: 0, lean: 0, tw: 0, rl: 0, sq: 0, sw: 0, coil: 0, pulse: 1, gr: 1, sp: .1, sb: .16, sy: 0, ss: 0, sk: .7, fall: 0, op: .14, hb: .55, gp: 0, inn: 0,
  ikd: 1, ikh: 0, wrap: 0, pull: 0, tn: 0, glow: .2, lure: 0, fade: 1, trail: 0, rust: 1, wither: 0, dust: 0, drain: 0, shed: 0, feed: 0, fire: 0 },
  cg('LM', .85, 2.7, .7, .32, .8, 0), cg('H', .75, 1.1, .6, -.25, 1.1, 0), cg('F', 1.2, 2.2, .6, .12, 1, 0), cg('S', 1.1, 2.5, .4, 0, 1, 0), cg('B', 1.05, 2.5, .45, -.1, 1, 0));
 const KEYS = Object.keys(BASE);
 // resting, disguised: a hill of brambles, the spire bowed over the mound with its bud hidden in the leaves
 const REST = K(cg('LM', -.1, 1.5, .5, .4, .2), cg('H', .25, 1.7, .5, .2, .2), cg('FSB', .7, 1.9, .4, -.04, .2), { coil: 2, y: -.15, sq: .1, pulse: .35, rust: .45, sp: .9, sb: 1.9, ss: .2, sk: 0, op: 0, hb: .08, glow: 0 });
 // alert: the spire straightens and leans at its prey, the bud parts on the heart's glow, every cane rises toward it
 const ALERT = K(cg('LM', .95, 1.3, 1.4, .45, .45), cg('H', 1.1, .3, .3, -.3, .5), cg('F', 1.32, 1.35, 1.55, .32, .45), cg('S', 1.28, 1.45, 1.45, .4, .45), cg('B', 1.22, 1.65, 1.2, .3, .45),
  { y: .06, lean: -.04, sq: -.04, sp: .2, sb: .3, sk: 1, op: .34, hb: .95, glow: .4, rust: 1.6, feed: .25 });
 // guard: the arms crossed before the spire, the bud shut tight
 const GUARD = K(cg('LM', .6, 1.2, .8, 1.05, .3), cg('H', .8, .9, .5, -.1, .3), cg('FS', 1.45, 1.4, 1, .75, .35), cg('B', 1.25, 2.3, .5, .2, .5), { sp: -.06, sb: .08, op: 0, hb: .25, lean: -.04, sq: .04, rust: 1.3 });
 const WALK = { lean: .05, rust: 1.4, y: .03, sp: .16 };
 const ACTS = {};
 const EASE = { s: (x) => x * x * (3 - 2 * x), l: (x) => x, i: (x) => x * x, o: (x) => 1 - (1 - x) * (1 - x) };
 function act(name, dur, keys, o) {
  const t = [], p = [], e = []; let prev = BASE;
  for (const [u, k, ez] of keys) { const full = Object.assign({}, prev, k); t.push(u); p.push(full); e.push(EASE[ez || 's']); prev = full; }
  ACTS[name] = Object.assign({ dur, t, p, e, hits: [], cues: [], hold: false, interrupt: false, rate: 12, snap: null }, o || {});
 }
 function evalKeys(def, u, out) {
  const T = def.t, Pk = def.p; let i = 0; while (i < T.length - 2 && u > T[i + 1]) i++;
  const a = T[i], b = T[i + 1], s = b > a ? cl((u - a) / (b - a), 0, 1) : 1, f = def.e[i + 1](s);
  for (const k of KEYS) out[k] = lerp(Pk[i][k], Pk[i + 1][k], f);
 }
 const ARMS = (k) => cg('LM', undefined, undefined, undefined, undefined, undefined, k);
 // Awakening: it heaves up out of the splitting earth, spikes first, plants its legs, rears and roars its bud open
 act('appear', 4.6, [[0, K(REST, cg('LM', 1.45, -.4, .2, .9, .3), cg('H', 1.5, -.2, .2, .6, .3), cg('FSB', 1.5, -.6, -.2, .4, .3), { y: -8.6, sp: 0, sb: 0, ss: 0, op: 0, hb: .3, coil: 0, pulse: 1 })],
  [.06, { dust: 1, feed: .4 }], [.14, { y: -6.6, shed: .5 }, 'i'], [.42, { y: 0, sq: -.06, rust: 2.4, feed: .7 }, 'o'],
  [.5, K(cg('FSB', 1.3, 2.4, .6, .1, 1.4), cg('LM', .9, 1.2, 1, .5, .8), cg('H', 1, .4, .3, -.2, 1.2), { sq: .08, dust: .6, shed: .2 }), 'o'],
  [.58, K(cg('LM', 1.4, -.6, .4, .1, .5), cg('H', 1.5, -.7, .2, -.3, .8), { sp: -.5, sb: -.3, op: .3, hb: 1, lean: -.08, y: .1, sq: -.08, dust: .1, feed: 1, rust: 2.6 })],
  [.66, { op: 1.4, hb: 2.2, sq: -.1, shed: 1.2, rust: 3.2 }, 'o'], [.8, K(ALERT, { op: .6, hb: 1.2, shed: 0, dust: 0 })], [1, BASE]],
  { snap: KEYS, cues: [.04, .62], rate: 10 });
 // Alert: the spire turns and leans at its prey, every cane rising toward it
 act('alert', 1.8, [[0, {}], [.3, ALERT, 'o'], [.7, K(ALERT, cg('*', undefined, undefined, undefined, undefined, .25))], [1, BASE]], { cues: [.22], rate: 9 });
 // Siren Bloom: the flower opens wide, arms spread in welcome, pollen pouring over the party (the hit is a charm)
 act('bloom', 3.4, [[0, {}],
  [.22, K(cg('LM', .95, .9, .5, -.25, .4), cg('H', 1.25, -.5, -.2, -.5, .6), cg('FSB', 1.0, 2.5, .5, -.05, .3), { sp: -.12, sb: -.1, sk: 1, op: 1.05, hb: 1.3, glow: .8, lure: .6, y: .05, rust: .6 }), 'o'],
  [.34, { op: 1.15, lure: 1.6, glow: 1.2, hb: 1.5 }], [.78, { op: 1.0, lure: 1.1, glow: 1 }], [1, BASE]], { hits: [.55], cues: [.3], rate: 7 });
 // Thorn Lance: the lead arm draws back high, spears down through its prey into the ground, and rips free
 act('lance', 1.8, [[0, {}],
  [.26, K(cg('L', 1.3, -.7, .2, -.2, .2, 0), cg('M', .7, 1.8, .8, .5, .5), { sp: -.2, sb: -.1, sk: 1, sy: .35, tw: .1, lean: -.06, y: .04, op: .4, hb: 1, rust: 1.8 }), 'o'],
  [.4, { Lk: 1, ikd: 1.02, ikh: -.5, wrap: .2, trail: 1, sp: .35, sb: .3, sy: -.15, tw: -.06, lean: .12, sq: .08, rust: 2.6 }, 'i'],
  [.5, { wrap: .5 }], [.66, { Lk: .85, trail: 0, sp: .2 }],
  [.86, K(cg('L', .6, 2, .8, .3, .6, 0), { sp: .1, sy: 0, lean: 0, tw: 0, op: .2, sq: 0 }), 'o'], [1, BASE]], { hits: [.44], cues: [.3], rate: 22 });
 // Hammerfall: the arms rise and twine into one club, hang, then fall on the prey; a shockwave runs over the party
 act('slam', 3.0, [[0, {}],
  [.24, K(cg('LM', 1.05, -.25, -.2, .62, .2, 0), { sp: -.42, sb: -.3, sk: 1, op: .7, hb: 1.2, lean: -.1, y: .1, sq: -.08, rust: 2, tn: 1 }), 'o'],
  [.4, K(cg('LM', 1.15, -.4, -.3, .62, .3), { sp: -.5, sb: -.35, hb: 1.7, feed: .5, tn: 1.2 })],
  [.46, K(ARMS(1), { ikd: 1, ikh: -1.5, wrap: .1, trail: 1, sp: .38, sb: .32, lean: .16, y: -.05, sq: .12, rust: 3, op: .3, tn: 0 }), 'i'],
  [.56, { sq: .06 }], [.7, { Lk: .9, Mk: .9, trail: 0, sp: .25, feed: .3 }],
  [.88, K(cg('LM', .7, 1.9, .8, .4, .7, 0), { sp: .1, sb: .2, lean: 0, y: 0, sq: 0, op: .2, hb: .7 }), 'o'], [1, BASE]],
  { hits: [.5, .6], cues: [.36], rate: 18 });
 // Maelstrom: it winds round, then every cane whirls round it twice at three heights, striking the party four times
 act('whirl', 3.6, [[0, {}],
  [.2, K(cg('LM', -.15, .3, .2, -.4, .3), cg('H', .5, .5, .2, -.3, .3), cg('FSB', .55, .9, .3, .2, .3), { sw: -.9, sy: -.6, tw: -.12, sp: -.06, sb: 0, sk: 0, op: .2, rust: 2, y: .08, sq: -.06 }), 'o'],
  [.3, { sw: 0, sy: .2, trail: 1, rust: 3, dust: 1 }, 'i'],
  [.78, { sw: TAU * 2, trail: 1, dust: 1 }, 'l'],
  [.86, K(cg('LM', .6, 1.8, .7, .3, .8), cg('H', 1, .5, .4, -.15, 1), cg('FSB', 1.2, 2.5, .5, .05, 1), { sw: TAU * 2 + .25, sy: 0, tw: 0, sk: .7, trail: 0, dust: 0, op: .2 }), 'o'],
  [1, K(BASE, { sw: TAU * 2 })]], { hits: [.36, .48, .6, .72], cues: [.2], rate: 14 });
 // Thorn Volley: two whip-cracks of the arms and mane fling thorns that rain on the party in three waves
 act('volley', 3.2, [[0, {}],
  [.28, K(cg('LM', 1.6, -1.6, -.5, .25, .6), cg('H', 1.5, -1.3, -.4, .1, .6), { sp: -.38, sb: -.25, sk: 1, op: .9, hb: 1.4, lean: -.1, y: .08, sq: -.08, rust: 2.4 }), 'o'],
  [.38, K(cg('LM', .9, 1.6, .9, .4, .4), cg('H', 1.2, .4, .3, .4, .4), { sp: .28, sb: .2, lean: .12, trail: 1, sq: .06, rust: 3 }), 'i'],
  [.44, K(cg('LM', 1.4, -.8, -.2, .3, .6), cg('H', 1.45, -.9, -.2, .2, .6), { sp: -.2, trail: .6 }), 'o'],
  [.5, K(cg('LM', .8, 1.7, .9, .4, .4), cg('H', 1.1, .5, .3, .4, .4), { sp: .3, trail: 1 }), 'i'],
  [.66, K(cg('LM', .7, 2, .8, .35, .6), cg('H', 1, .6, .4, -.1, .8), { sp: .12, trail: 0, op: .4 }), 'o'], [1, BASE]],
  { hits: [.58, .68, .78], cues: [.38, .5], rate: 16 });
 // Devour: the arms lift the prey into the flower, which shuts; three gulps (a blow, then a heal) while life spirals down
 // the spire; then it bursts open and the arms set the prey back where it stood
 act('devour', 5.2, [[0, {}],
  [.12, K(cg('LM', 1.3, -.6, .2, .3, .6, 0), { sp: -.15, sb: -.1, sk: 1, op: .3, hb: 1, lean: -.06, y: .05, rust: 2 }), 'o'],
  [.17, K(ARMS(1), { ikd: 1, wrap: 2.6, trail: .7, sp: .2, lean: .08 }), 'i'],
  [.26, { trail: 0, ikh: .5 }],
  [.42, { ikh: 5.4, pull: .55, sp: -.28, sb: -.25, op: 1.25, hb: 1.6, glow: .8 }],
  [.47, { pull: 1, ikh: 4.6, inn: 1 }, 'i'],
  [.52, K(cg('LM', .9, 1.4, .9, .4, .6, 0), { op: 0, hb: 1.2, sq: .06, gp: .4, drain: 1, feed: 1, sp: -.05, sb: .1 }), 'i'],
  [.58, { feed: 1.4, gp: 1 }], [.62, { feed: .8, gp: .2 }], [.68, { feed: 1.4, gp: 1 }], [.72, { feed: .8, gp: .2 }], [.78, { feed: 1.4, gp: 1 }], [.82, { feed: .8, gp: 0, drain: .3 }],
  [.86, K(ARMS(1), { op: 1.35, hb: 1.8, drain: 0, feed: .3, ikh: 4.6, pull: 1 }), 'o'],
  [.95, { pull: 0, ikh: 0, inn: 0, op: .6, sp: .15 }, 'o'],
  [.97, K(ARMS(0), { wrap: 0 })], [1, BASE]],
  { hits: [.2, .58, .68, .78], cues: [.62, .72, .82, .9], rate: 12 });
 // Thornwood: canes stab the soil, the ground splits toward the prey and tree-tall shoots burst up round it and squeeze
 // (animate() drives the shoots)
 act('briar', 3.8, [[0, {}],
  [.2, K(cg('LM', 1.6, -1, .2, .2, .6), cg('H', 1.5, -.8, .1, 0, .6), cg('FSB', 1.75, 1.6, .9, .15, .6), { sp: -.35, sb: -.2, sk: 1, op: .8, hb: 1.4, lean: -.1, y: .08, sq: -.08, rust: 2, feed: .3 }), 'o'],
  [.3, K(cg('LM', .3, 2.9, 1.3, .5, .3), cg('H', .9, 1.2, .6, .3, .3), cg('FSB', .25, 2.9, 1.3, .6, .3), { sp: .35, sb: .3, op: .2, lean: .14, y: -.04, sq: .14, rust: 2.8, dust: 1, feed: 1 }), 'i'],
  [.36, { dust: 0, sq: .06 }],
  [.6, K(cg('*', undefined, undefined, undefined, undefined, 1.2), { feed: .8, rust: 1.6, op: .5 })],
  [.66, { sq: .12, feed: 1.2, rust: 2.4, hb: 1.5 }], [.74, { sq: .05, feed: .7, hb: 1 }],
  [.86, K(cg('LM', 1.2, 1, .8, .3, .6), cg('FSB', 1.55, 1.5, .9, .3, .6), { sp: .1, lean: -.06, y: .04, sq: -.05, dust: .7, feed: .2, op: .2 }), 'o'],
  [1, BASE]], { hits: [.46, .66], cues: [.3, .86], rate: 14 });
 // Wrath: it curls in, then bursts open in a ring of red light; the battle sets state.wrath for its second phase's look
 act('enrage', 3.2, [[0, {}],
  [.28, K(cg('LM', .2, 3.2, 1.2, .9, .4), cg('H', .4, 2.6, .8, .6, .4), cg('FSB', .9, 3.2, 1, .3, .4), { coil: 1.8, sp: .55, sb: .9, ss: .1, op: 0, hb: .4, y: -.1, sq: .16, lean: .06, rust: .6, feed: .4 })],
  [.4, K(cg('LM', 1.7, -1.2, -.4, -.5, 1.6), cg('H', 1.6, -1.4, -.4, -.5, 1.6), cg('FSB', 1.6, 1.3, .2, -.2, 1.6), { coil: 0, sp: -.62, sb: -.4, ss: 0, op: 1.45, hb: 2.4, y: .16, sq: -.14, lean: -.12, rust: 3.6, feed: 1.5, shed: 1.5, dust: 1 }), 'o'],
  [.58, { shed: .3, dust: 0 }], [.78, K(ALERT, { op: .5, hb: 1.4, feed: .6 })], [1, BASE]],
  { cues: [.42], rate: 12 });
 // Hurt: the spire rocks back, every cane flinching away
 act('hurt', .8, [[0, {}], [.16, K(cg('*', 1.35, 1.8, .2, -.35, 2.5), { sp: -.3, sb: -.2, ss: .12, lean: -.12, y: .04, sq: -.08, op: .05, hb: .3, shed: 1.2, rust: 3 })], [1, BASE]], { interrupt: true, rate: 16 });
 act('block', .6, [[0, {}], [.3, K(GUARD, { lean: -.08, rust: 1.6 })], [.7, {}], [1, BASE]], { interrupt: true, rate: 18 });
 // Scorch: its recoil from fire; leaves catch and curl black, and the char fades over the next few seconds
 act('burn', 1.8, [[0, {}],
  [.12, K(cg('*', 1.5, .9, .1, -.5, 3.2), { sp: -.45, sb: -.3, ss: .15, op: 0, hb: .3, lean: -.2, y: .08, sq: -.1, shed: 2, rust: 3.6, fire: 1 }), 'o'],
  [.32, K(cg('*', 1.35, 1.3, .3, -.4, 2.4), { sp: -.3, ss: -.1, lean: -.14, fire: 1, shed: 1 })],
  [.62, K(cg('*', 1.2, 1.9, .5, -.15, 1.5), { sp: 0, ss: 0, lean: -.05, fire: .45, shed: .4, rust: 2 })],
  [1, BASE]], { interrupt: true, rate: 14 });
 act('rest', 2.0, [[0, {}], [1, REST]], { hold: true, rate: 5 });
 // Felled: a last flail, then the spire topples like a tree, the heart beats once more and goes dark, and it crumbles away
 act('die', 5.6, [[0, {}],
  [.08, K(cg('*', 1.6, 1.2, .5, .1, 3), { sp: -.4, sb: -.3, op: 1.3, hb: 2, lean: -.1, y: .08, sq: -.08, rust: 3, shed: 1, feed: 1.4 })],
  [.2, { op: .9, hb: 1.2, ss: .15 }],
  [.44, K(cg('LM', .1, .6, .2, -.2, .4), cg('H', -1.1, .9, .3, .2, .4), cg('FSB', .2, .5, .1, -.1, .15), { fall: 1, sp: .2, sb: .5, ss: .3, coil: 1, op: .5, hb: .9, lean: .05, y: -.1, sq: .25, shed: 1.6, dust: 1, feed: .2 }), 'i'],
  [.52, { fall: .95, dust: .4 }, 'o'], [.56, { fall: 1 }],
  [.7, { hb: 1.6, feed: 1 }], [.76, { hb: .1, feed: 0, wither: .6, shed: .6, dust: 0 }],
  [.9, { wither: 1, op: .3, pulse: 0, shed: 0 }], [.97, { fade: 0 }], [1, { fade: 0 }]],
  { hold: true, interrupt: true, cues: [.2, .5, .7], rate: 10 });
 // ---------- runtime ----------
 // state (written by the page or the battle): target, glow, wilt, wrath, open as the game's model; and for the field study:
 // xray (0 to 1, its roots under the meadow), frost (0 to 1, how cold the night is; its heart keeps the frost off its middle),
 // breath (0 to 1 and on, how much it steams), wind ({ x, z } in m/s, which way its steam drifts)
 const state = { target: null, glow: 1, wilt: 0, wrath: 0, open: 0, xray: 0, frost: undefined, breath: 1, wind: null };
 const FIN = Object.assign({}, BASE), TGT = Object.assign({}, BASE);
 let actv = null, gOn = false, gW = 0, fadeE = 1, liftV = 0, walkS = 0, lastName = '', lastU = 0, lastPhase = 0;
 // the idle cane that tastes the air (TW), the pulse running out along the veins (VW), where a held prey belongs, the char
 // fire leaves, the heartbeat (HB the time since the last one, beat its swell) and how far into its wrath it is
 const TW = { k: -1, t: 0, dur: 2, wait: 2.2, e: 0 }, VW = { t: 9, s: 0 }, held = V3();
 let charV = 0, holdV = 0, idleW = 1, playN = 0, curN = 0, lastN = 0, HB = 0, beat = 0, wrathV = 0, spInit = false;
 function play(name, force) {
  let def = ACTS[name]; if (!def) return false;
  const gone = FIN.fade < .02 && (!actv || actv.name === 'die');
  if (gone && name !== 'appear') { name = 'appear'; def = ACTS.appear; }
  if (actv && !force) {
   if (actv.name === 'die' && name !== 'appear') return false;
   if (!def.interrupt && !(actv.def.hold && actv.t >= actv.def.dur - 1e-6)) return false;
  }
  if (def.snap) { for (const k of def.snap) FIN[k] = def.p[0][k]; for (const C of CANES) C.sp = null; spInit = false; for (const Bq of BERRIES) Bq.init = false; }
  if (name === 'appear') { regrow(); charV = 0; }
  actv = { name, def, t: 0, n: ++playN };
  return true;
 }
 // a pulse of light running out from the heart along the veins (strength s; about a second to reach the roots' ends)
 const pulse = (s) => { VW.t = 0; VW.s = s; };
 const _a = V3(), _b = V3(), _c = V3(), _d = V3(), _tg = V3(), _sd = V3(), _cf = V3(), _up = V3(), _z1 = V3(0, 0, 1), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion();
 const lerpA = (a, b, t) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * t;
 const TIPW = new Float32Array(NS + 1); TIPW[NS - 3] = .2; TIPW[NS - 2] = .35; TIPW[NS - 1] = .45;
 // follow-through: each cane joint chases its pose on a spring, stiff near its base and softer toward the tip (slightly
 // underdamped); the great canes are heavier and swing slower
 const SPK = Float32Array.from({ length: NS + 1 }, (_, i) => 1150 * (1 - .62 * i / NS)), SPD = SPK.map((k) => 2 * .42 * Math.sqrt(k));
 // where each group takes hold round the prey: sideways (toward its own side) and up, in meters
 const HOLD = { L: [.32, .12], M: [.32, -.12], H: [.4, .5], F: [.5, -.3], S: [.6, .4], B: [.5, .7] };
 const IK = { yaw: 0, phi: 0, kap: 0, s: 0 };
 // a constant-curvature arc from the cane's base whose point at s* passes through the target (in its parent's space); a far
 // target makes the cane stretch, moving s* out toward the tip, and what is left past s* coils round the prey
 function solveReach(C, T) {
  _a.copy(T); C.pb.worldToLocal(_a);
  const B = C.chain[0].position, dx = _a.x - B.x, dy = _a.y - B.y, dz = _a.z - B.z, d = Math.hypot(dx, dz), c = Math.hypot(d, dy), s = IK.s = cl(c, C.len * .74, C.len * .9);
  IK.yaw = Math.atan2(dx, dz);
  let kap = 0;
  if (c < s * .999) { let lo = 0, hi = TAU / s * .98; for (let i = 0; i < 18; i++) { const m = (lo + hi) / 2; if (2 * Math.sin(m * s / 2) / m - c > 0) lo = m; else hi = m; } kap = (lo + hi) / 2; }
  IK.phi = Math.min(2.5, Math.atan2(dy, d) + kap * s / 2); IK.kap = kap;
 }
 const st = { init: false, px: 0, pz: 0, acc: 0 }, PH = 1 / 120, DOWN = V3(0, -1, 0);
 // the spire's springs: each joint's pitch and side bend chase the pose, heavily; SPB is how much of the bow each joint takes
 const SPB = [0, 0, .06, .12, .2, .28, .34], SPX = SP.map(() => ({ x: 0, v: 0, z: 0, w: 0 }));
 // after the bind: each fruit bone's "down" in its own frame, so a bunch hangs plumb whatever holds it
 for (const Bq of BERRIES) { Bq.bone.getWorldQuaternion(_q); Bq.hang = DOWN.clone().applyQuaternion(_q.invert()).normalize(); Bq.dd = r2(0, .14); Bq.dk = 0; }
 // a point along the spire, f from its foot (0) to the bud (1)
 function spinePt(f, out) { const x = cl(f, 0, 1) * SPN, i = Math.min(SPN - 1, Math.floor(x)); SP[i].getWorldPosition(out); SP[i + 1].getWorldPosition(_d); return out.lerp(_d, x - i); }

 function animate(phase, walk, t, dt) {
  dt = dt > 0 ? Math.min(dt, .05) : 0;
  walk = cl(walk || 0, 0, 1);
  let u = 0, name = '';
  curN = actv ? actv.n : 0;
  if (actv) { actv.t += dt; u = Math.min(1, actv.t / actv.def.dur); name = actv.name; if (u >= 1 && !actv.def.hold) actv = null; }
  if (actv) evalKeys(actv.def, u, TGT); else Object.assign(TGT, BASE);
  if (name !== 'whirl') FIN.sw = Math.atan2(Math.sin(FIN.sw), Math.cos(FIN.sw)); // after Maelstrom's turns, without unwinding them
  gW += ((gOn && !actv ? 1 : 0) - gW) * (dt > 0 ? 1 - Math.exp(-dt * 7) : 0);
  const wk = actv ? 0 : walk;
  walkS += (wk - walkS) * (dt > 0 ? 1 - Math.exp(-dt * 6) : 1);
  if (gW > 1e-3) for (const k in GUARD) TGT[k] = lerp(TGT[k], GUARD[k], gW);
  if (walkS > 1e-3) for (const k in WALK) TGT[k] = lerp(TGT[k], WALK[k], walkS * (1 - gW));
  // the battle can hold the bud open, its heart bare, between its turns (state.open, 0 to 1)
  const heldOpen = cl(+state.open || 0, 0, 1); if (heldOpen > 0) { TGT.op = Math.max(TGT.op, 1.05 * heldOpen); TGT.hb = Math.max(TGT.hb, 1.3 * heldOpen); }
  const rate = actv ? actv.def.rate : 6, kk = dt > 0 ? 1 - Math.exp(-dt * rate) : 0;
  for (const q of KEYS) FIN[q] += (TGT[q] - FIN[q]) * kk;
  if (dt > 0) wrathV += (cl(+state.wrath || 0, 0, 1) - wrathV) * (1 - Math.exp(-dt * 1.2));
  const P = FIN, tt = t * (1 + .12 * wrathV);
  // the mound: breathing, the creep's bob, lean, twist and squash
  const breath = .5 + .5 * Math.sin(tt * .9), ps = .025 * P.pulse * (breath - .5);
  crown.position.set(0, P.y + walkS * .05 * Math.abs(Math.sin(phase)) + .012 * breath * P.pulse, 0);
  crown.rotation.set(P.lean + walkS * .04 + .01 * Math.sin(tt * .6) * P.pulse, P.tw + .014 * Math.sin(tt * .45) * P.pulse, P.rl + .01 * Math.sin(tt * .55) * P.pulse);
  mass.scale.set(1 + P.sq * .5 + ps, 1 - P.sq + ps * 1.4, 1 + P.sq * .5 + ps); crown.scale.setScalar(P.gr);
  // moved somewhere new by the battle: the springs start again
  const rx = root.position.x, rz = root.position.z;
  if (!st.init || Math.hypot(rx - st.px, rz - st.pz) > 3 * SZ) { st.init = true; for (const Bq of BERRIES) Bq.init = false; for (const C of CANES) C.sp = null; spInit = false; }
  st.px = rx; st.pz = rz;
  root.updateMatrixWorld(true);
  // the prey: state.target (world), or a point before it at chest height
  const tg = state.target; if (tg) _tg.set(tg.x, tg.y, tg.z); else root.localToWorld(_tg.set(0, 1.1, REACH * SZ));
  _sd.set(_tg.x - rx, 0, _tg.z - rz); const tl = _sd.length() || 1; _sd.set(_sd.z / tl, 0, -_sd.x / tl);
  // idle: every couple of seconds one cane lifts its tip and tastes the air, swaying, then settles (more often in its wrath)
  idleW += ((actv ? 0 : 1 - gW) - idleW) * (dt > 0 ? 1 - Math.exp(-dt * 3) : 0);
  if (dt > 0) {
   if (TW.k < 0) { TW.wait -= dt; if (TW.wait <= 0) { const live = CANES.filter((c) => c.cutJ < 0); if (live.length) { TW.k = live[(rnd2() * live.length) | 0].k; TW.t = 0; TW.dur = r2(2, 3); } else TW.wait = 1; } }
   else { TW.t += dt; if (TW.t >= TW.dur) { TW.k = -1; TW.wait = r2(.8, 2.6) * (1 - .5 * wrathV); } }
  }
  TW.e = TW.k < 0 ? 0 : Math.pow(Math.sin(PI * cl(TW.t / TW.dur, 0, 1)), 2) * idleW * (1 - walkS);
  // the heartbeat: a double beat every 1.7 s (quicker in its wrath); while it waits, each one runs out along its veins
  if (dt > 0) { HB += dt; const per = 1.7 - .55 * wrathV; if (HB > per) { HB -= per; if (!actv && P.fade > .9) pulse(.35 + .35 * TIER + .5 * wrathV); } }
  beat = (Math.exp(-Math.pow((HB - .08) / .06, 2)) + .6 * Math.exp(-Math.pow((HB - .32) / .07, 2))) * P.pulse;
  // the physics substeps this frame, for the springs of the canes, the spire and the fruit
  const nSteps = Math.min(8, Math.floor((st.acc + dt) / PH)); st.acc = nSteps === 8 ? 0 : st.acc + dt - nSteps * PH;
  // ---------- the spire: it turns to its prey (sk), pitches (sp), bows at the top (sb), bends to the side (ss), twists (sy)
  // and, felled, topples forward and to its right; each joint chases its pose on a heavy spring ----------
  crown.worldToLocal(_a.copy(_tg)); const aim = cl(Math.atan2(_a.x, _a.z), -1.1, 1.1) * P.sk;
  const swX = .02 * Math.sin(tt * .7) * P.pulse, swZ = .016 * Math.sin(tt * .53 + 1) * P.pulse;
  for (let i = 0; i <= SPN; i++) {
   const S = SPX[i], X = P.sp / (SPN + 1) + P.sb * SPB[i] + swX + (i ? .03 : .95) * P.fall, Z = P.ss / (SPN + 1) + swZ + (i ? .03 : .6) * P.fall;
   if (!spInit) { S.x = X; S.z = Z; S.v = S.w = 0; }
   for (let n = 0; n < nSteps; n++) { S.v += (95 * (X - S.x) - 10 * S.v) * PH; S.x += S.v * PH; S.w += (95 * (Z - S.z) - 10 * S.w) * PH; S.z += S.w * PH; }
   SP[i].rotation.set(S.x, (i < 2 ? aim * .5 : 0) + P.sy / (SPN + 1), S.z);
  }
  spInit = true; SP[0].updateMatrixWorld(true);
  // ---------- the bud: it opens (op) and flares past open, gulps (gp), and the heart beats ----------
  const so = Math.max(0, P.op), o1 = sm(0, 1, so), ox = Math.max(0, so - 1), po = sm(.25, 1, so);
  bud.scale.setScalar(1 + .07 * P.gp); bud.rotation.set(.035 * Math.sin(tt * 1.1) * P.pulse, 0, .03 * Math.sin(tt * .8 + 1) * P.pulse);
  heart.scale.setScalar(1 + .05 * beat + .06 * P.gp); stam.scale.setScalar(Math.max(1e-3, sm(.2, .85, so)));
  for (const F of SEP) {
   const th = lerp(PI / 2 - .3, .2, o1) - .45 * ox + .025 * Math.sin(tt * 1.7 + F.ph) * o1, cu = lerp(.48, -.26, o1) - .2 * ox;
   F.ch[0].rotation.set(-th, F.a, 0); for (let i = 1; i <= F.n; i++) F.ch[i].rotation.x = -cu * (i < F.n ? 1 : .5);
  }
  for (const F of PET) {
   const th = lerp(PI / 2 - .08, .5, po) - .25 * ox + .03 * Math.sin(tt * 1.3 + F.ph) * po, cu = lerp(.5, -.12, po);
   F.ch[0].rotation.set(-th, F.a, 0); for (let i = 1; i <= F.n; i++) F.ch[i].rotation.x = -cu * (i < F.n ? 1 : .5);
  }
  bud.updateMatrixWorld(true);
  // the flower's middle, where it feeds; where a held prey belongs, and how firmly it is held
  bud.localToWorld(_cf.set(0, .75, 0));
  held.copy(_tg); held.y += P.ikh; held.lerp(_cf, P.pull);
  holdV = cl(Math.max(cl(Math.max(P.Lk, P.Mk), 0, 1) * sm(.7, 1.7, P.wrap), P.inn), 0, 1) * cl(P.fade * 2, 0, 1);
  // ---------- canes ----------
  for (const C of CANES) {
   const g = C.g, nJ = C.cutJ >= 0 ? C.cutJ : NS + 1;
   let lift = P[g + 'l'] + C.dl, curl = P[g + 'c'] + C.dc, tip = P[g + 't'];
   const w = P[g + 'w'] * (1 + .5 * wrathV), k = P[g + 'k'];
   let yaw = C.a - C.sgn * P[g + 'y'] + P.sw + w * .03 * Math.sin(tt * .6 + C.ph);
   if (TW.k === C.k && TW.e > 0) { const e = TW.e; lift += .3 * e; curl -= .9 * e; tip -= .8 * e; yaw += .16 * Math.sin(tt * 1.8 + C.ph) * e; }
   // the creep: alternate legs lift and swing forward, the others plant and pull
   if (walkS > 1e-3 && !C.great) { const p = phase + (C.k % 2) * PI, swg = Math.max(0, Math.sin(p)); lift += .3 * swg * walkS; curl -= .45 * swg * walkS; yaw += -Math.sin(C.a) * .2 * Math.cos(p) * walkS; }
   const bj = curl / (NS - 1), twn = g === 'L' || g === 'M' ? P.tn * C.sgn : 0;
   for (let i = 1; i < NS; i++) { C.bend[i] = bj + C.jb[i] + tip * TIPW[i] + w * .045 * Math.sin(tt * 1.1 + i * .85 + C.ph); C.yawW[i] = C.jy[i] + w * .04 * Math.sin(tt * .8 + i * .7 + C.ph * 1.3) + twn * .2 * Math.sin(i * 1.9); }
   let th0 = lift - C.bend[1] * .5 + w * .025 * Math.sin(tt * .5 + C.ph);
   if (k > 1e-3) {
    const H = HOLD[g]; C.chain[0].getWorldPosition(_b);
    _c.copy(_tg).addScaledVector(_sd, H[0] * C.sgn).add(_d.set(0, H[1], 0));
    _c.sub(_b).multiplyScalar(P.ikd).add(_b); _c.y += P.ikh; _c.lerp(_cf, P.pull);
    solveReach(C, _c);
    const jr = Math.round(IK.s / C.seg);
    yaw = lerpA(yaw, IK.yaw, k); th0 = lerp(th0, IK.phi - IK.kap * C.seg * .5, k);
    // past the reach point the tip coils round the prey: mostly sideways, round its body, a little downward
    const cw = Math.min(1.3, P.wrap / Math.max(1, NS - jr));
    for (let i = 1; i < NS; i++) { C.bend[i] = lerp(C.bend[i], i < jr ? IK.kap * C.seg : cw * .4, k); C.yawW[i] = lerp(C.yawW[i], i < jr ? C.yawW[i] * .15 : -C.sgn * cw * .95, k); }
   }
   const SPc = C.sp || (C.sp = { b: Float32Array.from(C.bend), bv: new Float32Array(NS + 1), y: Float32Array.from(C.yawW), yv: new Float32Array(NS + 1) });
   // a cane reaching for its prey stiffens, so it lands on the beat of its hit and still whips a little past it
   const sk = (1 + 3 * k) * (C.great ? .5 + .6 * k : .8), sd = Math.sqrt(sk);
   for (let n = 0; n < nSteps; n++) for (let i = 1; i < NS; i++) {
    SPc.bv[i] += (SPK[i] * sk * (C.bend[i] - SPc.b[i]) - SPD[i] * sd * SPc.bv[i]) * PH; SPc.b[i] += SPc.bv[i] * PH;
    SPc.yv[i] += (SPK[i] * sk * (C.yawW[i] - SPc.y[i]) - SPD[i] * sd * SPc.yv[i]) * PH; SPc.y[i] += SPc.yv[i] * PH;
   }
   for (let i = 1; i < NS; i++) { C.bend[i] = SPc.b[i]; C.yawW[i] = SPc.y[i]; }
   // keep it out of the ground: a joint that would sink is laid along the soil instead (not while it is still under it)
   C.pb.getWorldQuaternion(_q); _up.set(0, 1, 0).applyQuaternion(_q.invert());
   // (the height a joint gains is rho * sin(theta + dl): the parent's tilt, however large, along the cane's own plane)
   C.chain[0].getWorldPosition(_b); const hx = Math.sin(yaw) * _up.x + Math.cos(yaw) * _up.z, rho = Math.max(.05, Math.hypot(hx, _up.y)), dl = Math.atan2(hx, _up.y), by = (_b.y - root.position.y) / SZ, gnd = P.y > -.3;
   let th = th0, y = 0;
   for (let i = 0; i < NS; i++) {
    if (i > 0) th -= C.bend[i];
    const fl = C.rad(Math.min(C.len, (i + 1) * C.seg)) + .02 - by;
    let thW = th + dl, ny = y + C.seg * rho * Math.sin(thW);
    if (gnd && ny < fl) { const a = Math.asin(cl((fl - y) / (C.seg * rho), -1, 1)); thW = thW < -PI / 2 ? -PI - a : a; th = thW - dl; ny = y + C.seg * rho * Math.sin(thW); }
    C.theta[i] = th; y = ny;
   }
   C.chain[0].rotation.set(-C.theta[0], yaw, 0);
   const cj = P.coil * C.cm / (NS - 1);
   for (let i = 1; i < NS && i < nJ; i++) { C.chain[i].rotation.x = C.theta[i - 1] - C.theta[i]; C.chain[i].rotation.y = C.yawW[i] + cj; }
   if (nJ > NS) C.chain[NS].rotation.x = tip * .12;
   C.swing = walkS > 1e-3 && !C.great ? Math.sin(phase + (C.k % 2) * PI) : -1;
  }
  // ---------- Thornwood's shoots: planted round the prey's feet, up out of the soil, closing, squeezing, gone ----------
  const ug = name === 'briar' && P.fade > .02;
  if (ug) base.worldToLocal(_d.set(_tg.x, root.position.y, _tg.z));
  for (const S of SNARE) {
   const b0 = S.chain[0], e0 = .44 + S.t0, x = ug ? cl((u - e0) / .07, 0, 1) : 0;
   const gIn = x <= 0 ? 0 : 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2), gOut = ug ? 1 - sm(.85 + S.t0 * .6, .94 + S.t0 * .6, u) : 0;
   S.g = gIn * gOut;
   if (S.g <= 1e-3) { b0.position.set(0, -1, 0); b0.scale.setScalar(1e-4); continue; }
   const px = _d.x + Math.cos(S.a) * S.R / SZ, pz = _d.z + Math.sin(S.a) * S.R / SZ, close = sm(e0 + .03, .6, u), sq = win(u, .62, .71, .025);
   b0.position.set(px, _d.y, pz); b0.scale.setScalar(S.g);
   b0.rotation.set(-(PI / 2 + S.lean - close * (S.lean + .22) - .12 * sq), Math.atan2(_d.x - px, _d.z - pz), 0);
   for (let i = 1; i <= UN; i++) { const c = S.chain[i]; c.rotation.x = close * S.curl * (1 + .45 * sq) + .05 * Math.sin(tt * 2.6 + S.ph + i * 1.3) * close; c.rotation.y = .08 * Math.sin(tt * 2 + S.ph * 1.7 + i) * close; }
  }
  root.updateMatrixWorld(true);
  // ---------- fruit on pendulums ----------
  const damp = Math.exp(-1.8 * PH), floorY = P.y > -.3 ? root.position.y + .05 * SZ : -1e4, dying = name === 'die' ? u : 0;
  for (const Bq of BERRIES) {
   const b = Bq.bone, L = Bq.len * SZ, dk = dying > 0 ? Math.pow(sm(.3 + Bq.dd, .46 + Bq.dd, dying), 2) : 0;
   if (dk > 0 || Bq.dk > 0) { // on defeat the fruit lets go and drops to the soil; it hangs again when it grows back
    b.position.copy(b.userData.bind.p); _a.copy(b.position).applyMatrix4(b.parent.matrixWorld);
    if (dk > 0) { _a.y = lerp(_a.y, Math.min(_a.y, floorY + L * .4), dk); b.position.copy(b.parent.worldToLocal(_c.copy(_a))); }
    Bq.dk = dk;
   } else _a.copy(b.position).applyMatrix4(b.parent.matrixWorld);
   if (!Bq.init || Bq.X.distanceTo(_a) > L * 4) { Bq.X.copy(_a); Bq.X.y -= L; Bq.Xp.copy(Bq.X); Bq.init = true; }
   for (let n = 0; n < nSteps; n++) {
    _b.subVectors(Bq.X, Bq.Xp).multiplyScalar(damp); Bq.Xp.copy(Bq.X); Bq.X.add(_b); Bq.X.y -= 9.8 * PH * PH;
    Bq.X.x += Math.sin(tt * 1.3 + Bq.sway) * 1.5e-6 * P.rust; Bq.X.z += Math.cos(tt * 1.1 + Bq.sway) * 1.5e-6 * P.rust;
    _c.subVectors(Bq.X, _a); const l = _c.length() || 1e-6; Bq.X.copy(_a).addScaledVector(_c, L / l);
    if (Bq.X.y < floorY) Bq.X.y = floorY;
   }
   _c.subVectors(Bq.X, _a).normalize(); b.parent.getWorldQuaternion(_q); _c.applyQuaternion(_q.invert());
   b.quaternion.setFromUnitVectors(Bq.hang, _c);
   b.updateMatrixWorld(true);
  }
  // ---------- severed pieces fall, settle and burn away ----------
  for (const C of CANES) if (C.piece) {
   const pc = C.piece, b = pc.b; pc.t += dt;
   if (!pc.rest) {
    pc.vel.y -= 9.8 / SZ * dt; b.position.addScaledVector(pc.vel, dt);
    if (b.position.y < .08) { b.position.y = .08; if (pc.vel.y < -.8) { puff(b.getWorldPosition(_a), 8, 1); } pc.vel.y = pc.vel.y < -.8 ? -pc.vel.y * .22 : 0; pc.vel.x *= .5; pc.vel.z *= .5; if (pc.vel.lengthSq() < .02) pc.rest = true; }
   }
   _a.set(0, 0, 1).applyQuaternion(b.quaternion); _b.set(_a.x, 0, _a.z); if (_b.lengthSq() < 1e-4) _b.set(1, 0, 0); _b.normalize();
   _q.setFromUnitVectors(_a, _b).multiply(b.quaternion); b.quaternion.slerp(_q, 1 - Math.exp(-dt * (b.position.y <= .081 ? 5 : 1.6)));
   for (let i = pc.j + 1; i <= NS; i++) { const c = C.chain[i]; c.rotation.x *= Math.exp(-dt * 3); c.rotation.y *= Math.exp(-dt * 3); }
   U.cut.value[C.k].z = sm(1.5, 2.8, pc.t); U.cut.value[C.k].w = Math.max(0, 1 - pc.t * 1.3);
   b.updateMatrixWorld(true);
  }
  // ---------- looks ----------
  const fk = cl(P.fade, 0, 1) * fadeE;
  U.time.value = tt; U.flut.value = P.rust * (1 + .6 * walkS);
  U.ctr.value.copy(root.position); U.warm.value.z = SZ; if (state.frost !== undefined) U.frost.value = cl(+state.frost || 0, 0, 1);
  if (dt > 0) XRAY.value += (cl(+state.xray || 0, 0, 1) - XRAY.value) * (1 - Math.exp(-dt * 4)); xroots.visible = XRAY.value > .01;
  U.dis.value = 1 - fk; U.disCol.value.copy(name === 'appear' ? GROWC : BURNC); U.with.value = cl(Math.max(P.wither, state.wilt * .3), 0, 1); U.thin.value = cl(+state.wilt || 0, 0, 1) * .45;
  U.clip.value = name === 'appear' && u < .7 ? root.position.y + .004 : -1e4;
  M.soil.opacity = fk;
  M.berry.emissive.copy(BERRYGLOW).multiplyScalar(cl(P.glow, 0, 2) * .32 * fk * (state.glow === undefined ? 1 : +state.glow));
  // the veins: a glow while it feeds, the glow at rest (stronger at the higher levels and in its wrath), and each pulse
  // running out from the heart, down the spire and into the roots and the canes
  if (dt > 0) VW.t += dt;
  U.vein.value.set(cl(P.feed, 0, 1.5) * fk, VW.t / .9 * 1.8 - .1, VW.s * (1 - sm(.8, 1.1, VW.t)) * fk, lerp(VEIN, 1.3, wrathV) * fk * (1 - P.wither));
  U.veinC.value.copy(VEINC).lerp(WRATHC, wrathV); U.wrath.value = wrathV;
  U.heartC.value.copy(HEARTC).lerp(WRATHC, wrathV * .45); U.hb.value = cl(P.hb, 0, 2.5) * (1 + .7 * beat) * (1 + .35 * wrathV) * fk * (1 - P.wither * .9);
  // fire: flames while it burns, and the char they leave, which fades over the next few seconds
  if (dt > 0) charV = P.fire > .05 ? Math.min(.34, charV + dt * P.fire * .7) : Math.max(0, charV - dt * .06);
  U.char.value = charV * fk; U.burn.value = cl(P.fire, 0, 1) * fk;
  liftV = Math.max(0, P.y * SZ);
  updateFX(name, u, t, dt, fk, phase);
  lastName = name; lastU = u; lastPhase = phase; lastN = curN;
 }
 // ---------- effects ----------
 const fxS = { acc: { shed: 0, dust: 0, lure: 0, drain: 0, fire: 0, rip: 0, sap: 0, erupt: 0, vortex: 0, ember: 0, steam: 0 } };
 const STEAMC = C3(.62, .62, .7), STEAMH = C3(1, .55, .66);
 const GROWC = C3(.55, .95, .3), BURNC = C3(1, .6, .22), C1 = new THREE.Color(), LEAFC = C3(.42, .58, .28), DEADC = C3(.62, .46, .26), DUSTC = C3(.34, .27, .2), CHIPC = C3(.2, .1, .08);
 const SWEET = [C3(1, .72, .45), C3(1, .5, .62), C3(1, .9, .7)], DRAINC = C3(.75, 1, .42), PETALC = C3(.95, .8, .82);
 const JUICEC = C3(.3, .015, .09), SOILC = C3(.16, .11, .07), SMOKEC = C3(.13, .11, .11), FLAMEC = C3(1, .8, .4), EMBERC = C3(1, .45, .12);
 const BERRYGLOW = C3(.55, .12, .2);
 const VEINC = C3(1, .14, .42), WRATHC = C3(1, .3, .08), HEARTC = C3(1, .16, .36);
 const lim = (C) => (C.cutJ >= 0 ? C.cutJ - 1 : NS);
 const tipW = (C, out) => C.chain[lim(C)].getWorldPosition(out);
 function canePt(C, f, out) {
  const s = f * C.len, j = Math.min(Math.floor(s / C.seg), NS - 1);
  if (j + 1 > lim(C)) return tipW(C, out);
  C.chain[j].getWorldPosition(out); C.chain[j + 1].getWorldPosition(_d); return out.lerp(_d, s / C.seg - j);
 }
 const crossed = (name, u, n, h) => name === n && lastName === n && lastU < h && u >= h;
 function leafBurst(p, n, spread, wither, col) {
  for (let i = 0; i < n; i++) emit(LF, p.x + (rnd() - .5) * spread, p.y + (rnd() - .5) * spread, p.z + (rnd() - .5) * spread, (rnd() - .5) * 3.4, rnd() * 2.6, (rnd() - .5) * 3.4, 2 + rnd() * 1.2, C1.copy(col || LEAFC).lerp(DEADC, wither).multiplyScalar(.8 + .4 * rnd()), 1, (.22 + .12 * rnd()) * SZ, (.22 + .12 * rnd()) * SZ, 1.8, -1.6, (rnd() - .5) * 8, .7);
 }
 function chips(p, n, sp) { for (let i = 0; i < n; i++) emit(CHP, p.x, p.y, p.z, (rnd() - .5) * sp, rnd() * sp * .8, (rnd() - .5) * sp, .7 + rnd() * .5, CHIPC, .95, (.05 + .04 * rnd()) * SZ, .03 * SZ, 1.2, -8); }
 function puff(p, n, s) { for (let i = 0; i < n; i++) { const a = rnd() * TAU; emit(DU, p.x + Math.cos(a) * .2 * s, Math.max(.1, p.y), p.z + Math.sin(a) * .2 * s, Math.cos(a) * .9 * s, .3 + rnd() * .4, Math.sin(a) * .9 * s, 1.4 + rnd() * .8, DUSTC, .5, .5 * s * SZ, 1.5 * s * SZ, 1.5, .12); } }
 // berry juice and dark sap: heavy drops that fall and splash; clods of soil thrown up out of the ground
 function juice(p, n, sp) { for (let i = 0; i < n; i++) emit(CHP, p.x, p.y, p.z, (rnd() - .5) * sp, (.2 + rnd() * .8) * sp, (rnd() - .5) * sp, .7 + rnd() * .5, JUICEC, 1, (.06 + .05 * rnd()) * SZ, .04 * SZ, .5, -9); }
 function clods(p, n, sp, up) { for (let i = 0; i < n; i++) { const a = rnd() * TAU, r = rnd() * sp; emit(CHP, p.x + Math.cos(a) * .15, p.y + .03, p.z + Math.sin(a) * .15, Math.cos(a) * r, up * (.6 + rnd() * .7), Math.sin(a) * r, .8 + rnd() * .6, SOILC, 1, (.07 + .08 * rnd()) * SZ, .05 * SZ, .35, -9.8); } }
 function ring(n, r0, r1, s) { for (let i = 0; i < n; i++) { const a = rnd() * TAU, r = rr(r0, r1) * SZ; _a.set(root.position.x + Math.cos(a) * r, .1, root.position.z + Math.sin(a) * r); emit(DU, _a.x, _a.y, _a.z, Math.cos(a) * 1.4, .4 + rnd() * .5, Math.sin(a) * 1.4, 1.5 + rnd() * .7, DUSTC, .55, .6 * s * SZ, 1.9 * s * SZ, 1.4, .12); } }
 // the cracks: strip i runs from ckA[i] to ckB[i], w (by SZ) to each side; open how far along they have split (0 to 1.1)
 let ckUsed = false;
 function crackDraw(open, glow, fade, w) {
  for (let i = 0; i < NCK; i++) {
   const A = ckA[i], B = ckB[i], dx = B.x - A.x, dz = B.z - A.z, len = Math.hypot(dx, dz) || 1, ww = w * SZ * ckOn[i] * (len > .3 ? 1 : 0), sx = dz / len * ww, sz = -dx / len * ww;
   ckPos.set([A.x - sx, A.y, A.z - sz, A.x + sx, A.y, A.z + sz, B.x - sx, B.y, B.z - sz, B.x + sx, B.y, B.z + sz], i * 12);
  }
  ckG.attributes.position.needsUpdate = true; crack.visible = ckUsed = true;
  const cu = crack.material.uniforms; cu.uOpen.value = open; cu.uGlow.value = glow; cu.uFade.value = fade;
 }
 const cracksFrom = (c, L0, L1) => { for (let i = 0; i < NCK; i++) { const a = (i + rr(-.3, .3)) / NCK * TAU, L = rr(L0, L1) * SZ; ckA[i].copy(c); ckB[i].set(c.x + Math.sin(a) * L, c.y, c.z + Math.cos(a) * L); ckOn[i] = 1; } };
 // Thorn Volley: [launched at, lands at, how many], each wave thrown from the arms' and the mane's tips
 const VOLLEY = [[.38, .58, 9], [.42, .68, 9], [.5, .78, 10]];
 function launch(a, b, T) { const S = TVS[tvN++ % NTV]; S.p0.copy(a); S.v.subVectors(b, a).multiplyScalar(1 / T); S.v.y += 4.9 * T; S.t = 0; S.T = T; S.stick = -1; S.spin = rr(-9, 9); }
 const _m4b = new THREE.Matrix4(), _sc = V3();
 function stepVolley(dt) {
  let any = false;
  for (let i = 0; i < NTV; i++) {
   const S = TVS[i]; if (S.t < 0) continue; any = true; S.t += dt;
   if (S.stick < 0) { // in flight, point first along its arc
    const tt = Math.min(S.t, S.T); _a.copy(S.p0).addScaledVector(S.v, tt); _a.y -= 4.9 * tt * tt; S.d.copy(S.v); S.d.y -= 9.8 * tt; S.d.normalize();
    if (S.t >= S.T) { S.stick = 0; _a.y = root.position.y; _c.copy(_a); clods(_c, 5, 1.8, 2.6); puff(_c, 2, .9); chips(_c, 4, 2.4); }
    _q.setFromUnitVectors(_z1, S.d).multiply(_q2.setFromAxisAngle(_z1, S.spin * S.t)); _a.addScaledVector(S.d, -(S.stick < 0 ? .5 : .72) * SZ);
    if (S.stick === 0) S.p0.copy(_a);
    TV.setMatrixAt(i, _m4b.compose(_a, _q, _sc.setScalar(SZ)));
   } else { // stuck in the soil; after a while it crumbles away
    S.stick += dt; const k = 1 - sm(1.8, 2.4, S.stick);
    if (k <= 0) { S.t = -1; TV.setMatrixAt(i, M0); _c.copy(S.p0).addScaledVector(S.d, .7 * SZ); puff(_c, 2, .7); continue; }
    _q.setFromUnitVectors(_z1, S.d).multiply(_q2.setFromAxisAngle(_z1, S.spin * S.T)); TV.setMatrixAt(i, _m4b.compose(S.p0, _q, _sc.setScalar(SZ * k)));
   }
  }
  if (any || stepVolley.was) TV.instanceMatrix.needsUpdate = true; stepVolley.was = any;
 }
 function updateFX(name, u, t, dt, fk, phase) {
  const P = FIN;
  ckUsed = false;
  // whip trails: which canes trail depends on the move
  const trW = (C) => (name === 'whirl' ? 1.7 : name === 'lance' ? +(C === LEAD) : name === 'volley' ? +C.great : +(C === LEAD || C === MATE));
  let anyT = false;
  TR.forEach((T, r) => {
   const C = T.C, kk = P.trail * fk * trW(C) * (C.cutJ < 0 ? 1 : 0), o = r * TRN * 6;
   if (kk > .01) {
    anyT = true; tipW(C, _a); canePt(C, .88, _b);
    if (T.prev <= .01) for (let i = 0; i < TRN; i++) { T.tip[i].copy(_a); T.mid[i].copy(_b); }
    for (let i = TRN - 1; i > 0; i--) { T.tip[i].copy(T.tip[i - 1]); T.mid[i].copy(T.mid[i - 1]); }
    T.tip[0].copy(_a); T.mid[0].copy(_b);
    for (let i = 0; i < TRN; i++) { const k = kk * Math.pow(1 - i / (TRN - 1), 3), r0 = lerp(.24, .42, wrathV), g0 = lerp(.13, .1, wrathV), b0 = lerp(.16, .04, wrathV); trPos.set([T.tip[i].x, T.tip[i].y, T.tip[i].z, T.mid[i].x, T.mid[i].y, T.mid[i].z], o + i * 6); trCol.set([r0 * k, g0 * k, b0 * k, .02 * k, .01 * k, .01 * k], o + i * 6); }
   } else if (T.prev > .01) trCol.fill(0, o, o + TRN * 6);
   T.prev = kk;
  });
  trail.visible = anyT; if (anyT) trG.attributes.position.needsUpdate = trG.attributes.color.needsUpdate = true;
  // leaves shaken loose, dust, pollen
  const amb = fk * (name === 'die' ? 1 - sm(.7, .95, u) : 1);
  fxS.acc.shed += dt * (P.shed * 60 + .2 * P.rust) * amb;
  while (fxS.acc.shed >= 1) {
   fxS.acc.shed -= 1; const r = rnd();
   if (r < .3) mass.localToWorld(_a.set((rnd() - .5) * CR * 1.4, CH * rr(.4, 1.1), (rnd() - .5) * CR * 1.4)); else if (r < .45) spinePt(rr(.1, 1), _a); else canePt(CANES[(rnd() * NC) | 0], rr(.15, .95), _a);
   leafBurst(_a, 1, .2 * SZ, Math.max(P.wither, state.wilt * .5));
  }
  fxS.acc.dust += dt * P.dust * 60 * amb; while (fxS.acc.dust >= 1) { fxS.acc.dust -= 1; ring(1, CR * .9, CR * 2.4, 1); }
  // Siren Bloom's pollen: sweet glowing motes pouring off the heart and drifting over its prey
  fxS.acc.lure += dt * P.lure * 70 * fk;
  while (fxS.acc.lure >= 1) { fxS.acc.lure -= 1; heart.localToWorld(_a.set((rnd() - .5) * .6, rr(.5, 1.1), (rnd() - .5) * .6)); _b.subVectors(_tg, _a); const tm = rr(1.6, 2.6); emit(MO, _a.x, _a.y, _a.z, _b.x / tm + (rnd() - .5) * .6, _b.y / tm + rr(.2, .7), _b.z / tm + (rnd() - .5) * .6, tm * 1.05, SWEET[(rnd() * 3) | 0], .75, .14 * SZ, .07 * SZ, .25, -.3, 0, .35); }
  // the ribbons: pollen streaming from the heart to the prey (Siren Bloom), or stolen life spiralling down the spire into
  // the roots (Devour)
  const dk = cl(P.drain, 0, 1) * fk, lk = cl(P.lure * .6, 0, 1) * fk, rk = Math.max(dk, lk); drain.visible = rk > .01;
  if (drain.visible) {
   const pol = lk > dk; heart.localToWorld(_b.set(0, .8, 0));
   for (let r = 0, o = 0; r < DRN; r++) {
    const ph = r * TAU / DRN, cc = pol ? SWEET[r] : DRAINC;
    for (let i = 0; i <= DRS; i++, o += 6) {
     const s = i / DRS;
     if (pol) { const th = s * TAU * 1.3 + t * 3 + ph, rad = (.15 + .5 * Math.sin(PI * s)) * SZ; _a.copy(_b).lerp(_tg, s); _a.x += Math.cos(th) * rad; _a.y += Math.sin(PI * s) * (1.2 + .3 * r) * SZ + Math.sin(th) * rad * .6; _a.z += Math.sin(th) * rad; }
     else { const th = s * TAU * 2.2 - t * 4 + ph, rad = (.55 + .15 * Math.sin(s * 9 + t)) * SZ; spinePt(1 - s, _a); _a.x += Math.cos(th) * rad; _a.y += lerp(.6, -.2, s) * SZ; _a.z += Math.sin(th) * rad; }
     const w = (pol ? .06 : .1) * SZ * (1 - .4 * s), k = (pol ? .9 : 1.2) * rk * sm(0, .08, s) * sm(1, .9, s) * (.25 + .75 * Math.pow(Math.max(0, Math.sin(s * 14 - t * (pol ? 6 : 10) + ph * 2)), 2));
     drPos[o] = drPos[o + 3] = _a.x; drPos[o + 1] = _a.y - w; drPos[o + 4] = _a.y + w; drPos[o + 2] = drPos[o + 5] = _a.z;
     drCol[o] = drCol[o + 3] = cc.r * k; drCol[o + 1] = drCol[o + 4] = cc.g * k; drCol[o + 2] = drCol[o + 5] = cc.b * k * .85;
    }
   }
   drG.attributes.position.needsUpdate = drG.attributes.color.needsUpdate = true;
  }
  // fire: flames licking up along the canes, the spire and off the mound, with smoke and embers; and in its wrath, embers
  // rising off it all the time
  fxS.acc.fire += dt * P.fire * 160 * fk;
  while (fxS.acc.fire >= 1) {
   fxS.acc.fire -= 1; const r = rnd();
   if (r < .25) mass.localToWorld(_a.set((rnd() - .5) * CR * 1.3, CH * rr(.5, 1.05), (rnd() - .5) * CR * 1.3)); else if (r < .45) spinePt(rnd(), _a); else canePt(CANES[(rnd() * NC) | 0], rr(.1, .9), _a);
   emit(FL, _a.x, _a.y, _a.z, (rnd() - .5) * .5, 1 + rnd(), (rnd() - .5) * .5, .5 + rnd() * .4, FLAMEC, .9, (.6 + .4 * rnd()) * SZ, .15 * SZ, 1.2, 2.2, 0, .2);
   if (rnd() < .3) emit(DU, _a.x, _a.y + .2, _a.z, (rnd() - .5) * .3, .7 + rnd() * .5, (rnd() - .5) * .3, 1.6 + rnd() * .6, SMOKEC, .45, .5 * SZ, 1.8 * SZ, 1, .4);
   if (rnd() < .25) emit(MO, _a.x, _a.y, _a.z, (rnd() - .5) * 1.2, 1.2 + rnd(), (rnd() - .5) * 1.2, 1 + rnd() * .8, EMBERC, .9, .07 * SZ, .02 * SZ, .8, .6, 0, .4);
  }
  fxS.acc.ember += dt * wrathV * 16 * fk;
  while (fxS.acc.ember >= 1) { fxS.acc.ember -= 1; const r = rnd(); if (r < .4) spinePt(rnd(), _a); else if (r < .7) mass.localToWorld(_a.set((rnd() - .5) * CR * 1.5, CH * rr(.3, 1), (rnd() - .5) * CR * 1.5)); else canePt(CANES[(rnd() * NC) | 0], rr(.05, .6), _a); emit(MO, _a.x, _a.y, _a.z, (rnd() - .5) * .4, .5 + rnd() * .7, (rnd() - .5) * .4, 1.6 + rnd(), EMBERC, .8, .06 * SZ, .015 * SZ, .5, .3, 0, .35); }
  // the heart's light between the sepals (much brighter as it opens), and the firelight while it burns
  heart.localToWorld(heartLight.position.set(0, .6, 0)); heartLight.color.copy(U.heartC.value); heartLight.intensity = U.hb.value * (.5 + 1.7 * sm(.05, .9, P.op)) * .75;
  const fireI = cl(P.fire, 0, 1) * fk * 4 * (.78 + .22 * Math.sin(t * 31) * Math.sin(t * 17.3)); fireLight.intensity = fireI; if (fireI > 0) spinePt(.25, fireLight.position);
  // a severed cane's stump bleeds dark sap for a while
  for (const C of CANES) if (C.bleed > 0 && C.cutJ > 0) {
   C.bleed -= dt; fxS.acc.sap += dt * 18 * fk * Math.min(1, C.bleed);
   while (fxS.acc.sap >= 1) { fxS.acc.sap -= 1; C.chain[C.cutJ - 1].localToWorld(_a.set(0, 0, C.seg * .5)); emit(CHP, _a.x, _a.y, _a.z, (rnd() - .5) * .4, -.1, (rnd() - .5) * .4, .9, JUICEC, 1, .07 * SZ, .04 * SZ, .3, -7); }
  }
  // ---------- the moves ----------
  // Awakening: the ground trembles and splits, earth erupts as it heaves up, its legs slam down, and the bud roars open
  if (name === 'appear') {
   if (crossed(name, u, 'appear', ACTS.appear.cues[0])) { _a.set(root.position.x, root.position.y + .012, root.position.z); cracksFrom(_a, 6, 8.5); ring(24, CR * .5, CR * 2.4, 1.2); }
   const s0 = sm(.03, .16, u), fade = 1 - sm(.6, .75, u);
   if (s0 > 0 && fade > 0) crackDraw(s0 * 1.1, (.5 + .5 * sm(.1, .2, u)) * (1 - sm(.45, .7, u)), fade, .9);
   if (u > .12 && u < .46) { fxS.acc.erupt += dt * 110 * fk; while (fxS.acc.erupt >= 1) { fxS.acc.erupt -= 1; const a = rnd() * TAU, r = CR * rr(.5, 1.35) * SZ; _a.set(root.position.x + Math.sin(a) * r, root.position.y + .05, root.position.z + Math.cos(a) * r); if (rnd() < .6) clods(_a, 1, 2.2, 4.2); else puff(_a, 1, 1.4); } }
   if (crossed(name, u, 'appear', .5)) for (const C of CANES) if (!C.great) { tipW(C, _a); clods(_a, 8, 2.4, 3); puff(_a, 4, 1.1); }
   if (crossed(name, u, 'appear', ACTS.appear.cues[1])) { const x = root.position.x, z = root.position.z; shock(x, z, 1, 17 * SZ, 1.4, VEINC, .9, true); shock(x, z, 1, 12 * SZ, 1.8, DUSTC, .75, false); bud.localToWorld(_a.set(0, 1, 0)); leafBurst(_a, 20, 2.5 * SZ, 0); leafBurst(_a, 14, 2 * SZ, 0, PETALC); chips(_a, 20, 5); ring(30, CR * .6, CR * 2.8, 1.3); pulse(2.2); }
  }
  // Thorn Lance: a crater where it spears into the soil; it rips free
  if (crossed(name, u, 'lance', ACTS.lance.hits[0]) && LEAD.cutJ < 0) { tipW(LEAD, _a); chips(_a, 24, 4); juice(_a, 16, 3.4); leafBurst(_a, 8, .5 * SZ, 0); _b.set(_a.x, root.position.y + .05, _a.z); clods(_b, 26, 3, 4.5); puff(_b, 8, 1.5); shock(_b.x, _b.z, .3, 4.5 * SZ, .7, DUSTC, .75, false); }
  if (crossed(name, u, 'lance', .66) && LEAD.cutJ < 0) { tipW(LEAD, _a); chips(_a, 12, 3); clods(_a, 14, 2.4, 3.6); juice(_a, 8, 2.4); }
  // Hammerfall: the club lands; the ground splits from the crater and a shockwave runs out over the party
  if (name === 'slam') {
   if (crossed(name, u, 'slam', ACTS.slam.hits[0])) {
    tipW(LEAD, _a); tipW(MATE, _b); _a.lerp(_b, .5); _a.y = root.position.y + .012;
    clods(_a, 40, 4.4, 5.2); chips(_a, 26, 5); puff(_a, 14, 2.2); leafBurst(_a, 12, 1.5 * SZ, 0); juice(_a, 10, 3.4);
    shock(_a.x, _a.z, .5, 12 * SZ, 1.2, DUSTC, .9, false); shock(_a.x, _a.z, .3, 8 * SZ, .8, VEINC, .85, true); cracksFrom(_a, 4, 7); pulse(1.8);
   }
   const s0 = sm(.5, .6, u), fade = 1 - sm(.82, .97, u);
   if (s0 > 0 && fade > 0) crackDraw(s0 * 1.1, (.4 + .6 * sm(.5, .55, u)) * (1 - sm(.68, .9, u)), fade, 1);
   if (crossed(name, u, 'slam', .7)) for (const C of [LEAD, MATE]) if (C.cutJ < 0) { tipW(C, _a); chips(_a, 10, 2.6); clods(_a, 10, 2.2, 3.2); }
  }
  // Maelstrom: a vortex of dust and leaves round it while its canes whirl
  if (name === 'whirl') {
   fxS.acc.vortex += dt * P.trail * 80 * fk;
   while (fxS.acc.vortex >= 1) {
    fxS.acc.vortex -= 1; const a = rnd() * TAU, r = rr(3, 10) * SZ, x = root.position.x + Math.sin(a) * r, z = root.position.z + Math.cos(a) * r, v = 5 + rnd() * 4;
    emit(DU, x, .2, z, Math.cos(a) * v, .4 + rnd() * .8, -Math.sin(a) * v, 1.2 + rnd() * .6, DUSTC, .5, .7 * SZ, 2.2 * SZ, 1.4, .35);
    if (rnd() < .4) emit(LF, x, rr(.5, 3.5), z, Math.cos(a) * v * 1.2, rr(.5, 1.5), -Math.sin(a) * v * 1.2, 1.5, C1.copy(LEAFC).multiplyScalar(.8 + .4 * rnd()), 1, .25 * SZ, .25 * SZ, 1, -1, (rnd() - .5) * 12, .5);
   }
   for (const h of ACTS.whirl.hits) if (crossed(name, u, 'whirl', h)) for (const C of CANES) if (C.great && C.cutJ < 0) { tipW(C, _a); leafBurst(_a, 3, .4 * SZ, 0); chips(_a, 5, 3.4); }
  }
  // Thorn Volley: each whip-crack throws a wave of thorns in high arcs onto the ground round the prey
  for (const [ul, uh, n] of VOLLEY) if (crossed(name, u, 'volley', ul)) {
   const T = (uh - ul) * ACTS.volley.dur;
   for (let i = 0; i < n; i++) { const C = CANES[i % 4]; if (C.cutJ >= 0) continue; tipW(C, _a); const a = rnd() * TAU, r = Math.sqrt(rnd()) * 3.4 * SZ; _b.set(_tg.x + Math.sin(a) * r, root.position.y, _tg.z + Math.cos(a) * r); launch(_a, _b, T * rr(.94, 1)); chips(_a, 2, 2); }
  }
  stepVolley(dt);
  // Devour: the arms seize; the flower takes the prey and shuts; three gulps; it spits it back out
  if (name === 'devour') {
   if (crossed(name, u, 'devour', ACTS.devour.hits[0])) for (const C of [LEAD, MATE]) if (C.cutJ < 0) { tipW(C, _a); chips(_a, 10, 3.4); leafBurst(_a, 4, .3 * SZ, 0); }
   if (crossed(name, u, 'devour', .5)) { bud.localToWorld(_a.set(0, 1.2, 0)); leafBurst(_a, 14, 1.4 * SZ, 0, PETALC); juice(_a, 16, 3.4); pulse(1.6); }
   for (const h of ACTS.devour.hits.slice(1)) if (crossed(name, u, 'devour', h)) { bud.localToWorld(_a.set(0, 1, 0)); for (let i = 0; i < 18; i++) emit(MO, _a.x, _a.y, _a.z, (rnd() - .5) * 3.4, rnd() * 2.4, (rnd() - .5) * 3.4, .7, DRAINC, .85, .14 * SZ, .02 * SZ, 2.6); pulse(1.4); }
   if (crossed(name, u, 'devour', .86)) { bud.localToWorld(_a.set(0, 1.1, 0)); juice(_a, 22, 4.4); leafBurst(_a, 16, 1.6 * SZ, 0, PETALC); chips(_a, 10, 3.4); }
  }
  // Siren Bloom: a slow sweet ring of light as the flower opens
  if (crossed(name, u, 'bloom', ACTS.bloom.cues[0])) shock(root.position.x, root.position.z, 1, 11 * SZ, 2.4, SWEET[1], .4, true);
  // Thornwood: the canes stab into the soil, the ground splits toward the prey, the shoots burst up and sink back
  if (name === 'briar') {
   const UG = ACTS.briar;
   if (crossed(name, u, 'briar', UG.cues[0])) { pulse(2); for (const C of CANES) if (C.cutJ < 0 && C.g !== 'B' && C.g !== 'H') { tipW(C, _a); clods(_a, 8, 2.4, 3.2); puff(_a, 4, 1.2); } }
   _b.set(_tg.x, root.position.y + .012, _tg.z);
   if (crossed(name, u, 'briar', .318)) { let n = 0; for (const C of [LEAD, MATE].concat(CANES.filter((c) => c.g === 'F' || c.g === 'S'))) if (n < NCK && C.cutJ < 0) { tipW(C, ckA[n]); ckA[n].y = _b.y; ckOn[n++] = 1; } for (; n < NCK; n++) ckOn[n] = 0; }
   for (let i = 0; i < NCK; i++) ckB[i].copy(_b);
   const s0 = sm(.32, .44, u), fade = 1 - sm(.86, .98, u);
   if (s0 > 0 && fade > 0) {
    crackDraw(s0 * 1.1, (.45 + .55 * sm(.4, .46, u)) * (1 - sm(.7, .9, u)) * fk, fade * fk, 1);
    if (s0 < 1) { fxS.acc.rip += dt * 60; while (fxS.acc.rip >= 1) { fxS.acc.rip -= 1; const i = (rnd() * NCK) | 0; if (!ckOn[i]) continue; _c.copy(ckA[i]).lerp(_b, s0); puff(_c, 1, .9); if (rnd() < .5) clods(_c, 1, 1, 2.2); } }
   }
   for (const S of SNARE) {
    if (S.g > .02 && !S.up) { S.up = true; S.chain[0].getWorldPosition(_c); clods(_c, 10, 2.2, 4); puff(_c, 4, 1.4); chips(_c, 5, 3); }
    if (S.up && !S.down && u > .86 + S.t0 * .6) { S.down = true; S.chain[0].getWorldPosition(_c); puff(_c, 3, 1.2); clods(_c, 4, 1.2, 2); }
   }
   if (crossed(name, u, 'briar', UG.hits[0])) { _c.set(_tg.x, root.position.y + .05, _tg.z); clods(_c, 18, 3, 4.6); }
   if (crossed(name, u, 'briar', UG.hits[1])) { _c.copy(_tg); chips(_c, 20, 3.4); leafBurst(_c, 10, .8 * SZ, 0); }
   if (crossed(name, u, 'briar', UG.cues[1])) for (const C of CANES) if (C.cutJ < 0 && !C.great) { tipW(C, _a); clods(_a, 6, 1.6, 3); puff(_a, 2, .9); }
  } else if (SNARE[0].up) for (const S of SNARE) S.up = S.down = false;
  // Wrath: a ring of red light and a storm of embers as it bursts open
  if (crossed(name, u, 'enrage', ACTS.enrage.cues[0])) {
   const x = root.position.x, z = root.position.z; shock(x, z, 1, 19 * SZ, 1.5, WRATHC, 1, true); shock(x, z, .8, 13 * SZ, 1.9, DUSTC, .7, false);
   bud.localToWorld(_a.set(0, 1, 0)); for (let i = 0; i < 60; i++) emit(MO, _a.x, _a.y, _a.z, (rnd() - .5) * 9, rnd() * 6, (rnd() - .5) * 9, 1.2 + rnd(), EMBERC, 1, .12 * SZ, .03 * SZ, 1.4, -2);
   leafBurst(_a, 24, 3 * SZ, .2); ring(30, CR * .6, CR * 3, 1.4); pulse(2.4);
  }
  // the moments of being hurt, burnt and felled
  const fresh = curN !== 0 && curN !== lastN;
  if (name === 'hurt' && fresh) { spinePt(.5, _a); leafBurst(_a, 18, 1.4 * SZ, state.wilt * .5); chips(_a, 14, 3.6); juice(_a, 10, 2.6); }
  if (name === 'burn' && fresh) { spinePt(.4, _a); for (let i = 0; i < 30; i++) emit(FL, _a.x + (rnd() - .5) * CR * SZ, _a.y + rnd() * 2, _a.z + (rnd() - .5) * CR * SZ, (rnd() - .5) * 1.6, 1.4 + rnd(), (rnd() - .5) * 1.6, .6 + rnd() * .3, FLAMEC, 1, (.6 + .4 * rnd()) * SZ, .15 * SZ, 1.5, 1.8); leafBurst(_a, 14, 1.4 * SZ, .7); }
  if (crossed(name, u, 'die', .06)) pulse(2);
  if (crossed(name, u, 'die', ACTS.die.cues[0])) { spinePt(.06, _a); chips(_a, 30, 4.4); juice(_a, 14, 3); leafBurst(_a, 10, 1 * SZ, .3); }
  if (crossed(name, u, 'die', ACTS.die.cues[1])) { bud.localToWorld(_a.set(0, .8, 0)); _a.y = root.position.y + .05; shock(_a.x, _a.z, .5, 12 * SZ, 1.3, DUSTC, .9, false); clods(_a, 36, 4, 4.6); puff(_a, 14, 2.2); leafBurst(_a, 24, 2 * SZ, .5, PETALC); ring(24, CR * .5, CR * 2.6, 1.3); }
  if (crossed(name, u, 'die', ACTS.die.cues[2])) { pulse(2.2); heart.localToWorld(_a.set(0, .6, 0)); for (let i = 0; i < 40; i++) emit(MO, _a.x, _a.y, _a.z, (rnd() - .5) * 4, rnd() * 3, (rnd() - .5) * 4, 1 + rnd(), HEARTC, 1, .14 * SZ, .02 * SZ, 1.5, -1); }
  // the creep: a puff where each leg sets down
  if (walkS > .05) for (const C of CANES) if (!C.great) { const p0 = Math.sin(lastPhase + (C.k % 2) * PI), p1 = Math.sin(phase + (C.k % 2) * PI); if (p0 > 0 && p1 <= 0 && C.cutJ < 0) { tipW(C, _a); puff(_a, 2, .8); } }
  // the shockwaves race out and fade
  for (const S of SHK) if (S.m.visible) { S.t += dt; const f = S.t / S.dur; if (f >= 1) { S.m.visible = false; continue; } S.m.scale.setScalar(Math.max(.01, lerp(S.r0, S.r1, 1 - Math.pow(1 - f, 3)))); S.m.material.uniforms.uA.value = S.a * Math.pow(1 - f, 1.5) * sm(0, .05, f) * fk; }
  if (!ckUsed && crack.visible) crack.visible = false;
  // its breath: steam off the warm mound all the time, more from the bud as it opens and while it feeds, drifting downwind
  {
   const wnd = state.wind || { x: .35, z: .1 }, br = Math.max(0, state.breath === undefined ? 1 : +state.breath) * U.frost.value * 1.6;
   const so = sm(.1, .9, P.op);
   fxS.acc.steam += dt * br * fk * (9 + 26 * so + 18 * cl(P.feed, 0, 1.5) + 10 * cl(P.dust, 0, 1)) * (name === 'die' ? 1 - sm(.7, .9, u) : 1);
   while (fxS.acc.steam >= 1) {
    fxS.acc.steam -= 1; const fromBud = rnd() < .2 + .5 * so;
    if (fromBud) heart.localToWorld(_a.set(rr(-.4, .4), rr(.6, 1.3), rr(-.4, .4))); else mass.localToWorld(_a.set(...[rr(-1, 1), 0, rr(-1, 1)].map((v, i) => (i === 1 ? 0 : v * CR * .8)))).setY(root.position.y + rr(.3, 1.2) * CH * SZ);
    C1.copy(STEAMC).lerp(STEAMH, fromBud ? .25 + .5 * so : .05);
    emit(STM, _a.x, _a.y, _a.z, wnd.x * rr(.3, .8) + rr(-.08, .08), rr(.25, .55) * (fromBud ? 1.3 : 1), wnd.z * rr(.3, .8) + rr(-.08, .08), rr(3.5, 6), C1, rr(.1, .2), rr(.5, .9) * SZ, rr(2, 3.6) * SZ, .25, .06, rr(-.2, .2), .12);
   }
  }
  stepP(LF, dt, .1, t); stepP(DU, dt, .3, t); stepP(MO, dt, .2, t); stepP(CHP, dt, .05, t); stepP(FL, dt, .12, t); stepP(STM, dt, .3, t);
 }

 // ---------- losing a cane, and growing it back ----------
 function sever(k) {
  if (k === undefined || k === null) { const live = CANES.filter((c) => c.cutJ < 0 && c !== LEAD); const pool = live.length ? live : CANES.filter((c) => c.cutJ < 0); if (!pool.length) return -1; k = pool[(rnd() * pool.length) | 0].k; }
  const C = CANES[k]; if (!C || C.cutJ >= 0) return -1;
  const j = cl(Math.round(NS * rr(.42, .7)), 3, NS - 2), b = C.chain[j];
  canePt(C, j / NS, _a); chips(_a, 30, 4); leafBurst(_a, 12, .5 * SZ, 0); juice(_a, 20, 3.4);
  base.attach(b);
  C.cutJ = j; C.bleed = 3; C.piece = { b, j, t: 0, rest: false, vel: V3(Math.sin(C.a) * .6, .8, Math.cos(C.a) * .6) }; // in the body's own space
  U.cut.value[k].set((j - .5) / NS, (j + .5) / NS, 0, 1);
  return k;
 }
 function regrow() {
  for (const C of CANES) {
   if (C.cutJ < 0) continue;
   const b = C.chain[C.cutJ]; C.chain[C.cutJ - 1].add(b);
   for (let i = C.cutJ; i <= NS; i++) { const bd = C.chain[i].userData.bind; C.chain[i].position.copy(bd.p); C.chain[i].quaternion.copy(bd.q); }
   C.cutJ = -1; C.piece = null; C.bleed = 0; U.cut.value[C.k].set(2, 2, 0, 0);
  }
 }
 // ---------- interface ----------
 const ACTIONS = {};
 for (const n in ACTS) { const d = ACTS[n]; ACTIONS[n] = Object.freeze({ dur: d.dur, hits: d.hits.slice(), cues: d.cues.slice(), hold: d.hold, interrupt: d.interrupt }); }
 Object.freeze(ACTIONS);
 function anchor(name, out) {
  out = out || V3();
  switch (name) {
   case 'hit': case 'tip': return tipW(LEAD, out);
   case 'lure': case 'bloom': return heart.localToWorld(out.set(0, 1.25, 0)); // the open flower's middle, over the heart
   case 'heart': return heart.localToWorld(out.set(0, .55, 0));               // its weak point, hidden while the bud is shut
   case 'head': case 'top': case 'bud': return bud.localToWorld(out.set(0, 2.1, 0));
   case 'crown': case 'mouth': return mass.localToWorld(out.set(0, CH * .6, 0));
   case 'grasp': return tipW(LEAD, out).add(tipW(MATE, _a)).multiplyScalar(.5);
   case 'held': return out.copy(held); // where a held prey's chest belongs; see holding and inside
   case 'snare': case 'impact': { const tg = state.target; return tg ? out.set(tg.x, root.position.y, tg.z) : root.localToWorld(out.set(0, 0, REACH * SZ)); }
   case 'feet': return out.copy(root.position);
   default: { // 'chest' and anything else: the front of the spire, halfway up
    const m = /^cane(\d+)$/.exec(name); if (m && CANES[+m[1]]) return tipW(CANES[+m[1]], out);
    return SP[3].localToWorld(out.set(0, 0, .5));
   }
  }
 }
 animate(0, 0, 0, 0);
 let tri = 0, draws = 0, nb = 0; const texs = new Set();
 root.traverse((o) => { if (o.isBone) nb++; if (o.isMesh || o.isPoints) { draws++; if (o.isMesh) tri += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; for (const k of ['map', 'normalMap', 'emissiveMap']) if (o.material[k]) texs.add(o.material[k].image); } });
 fx.traverse((o) => { if (o.isMesh || o.isPoints) draws++; });
 return {
  root, fx, animate, play, ACTIONS, anchor, sever, regrow,
  guard(on) { gOn = !!on; },
  reset() { actv = null; gOn = false; gW = 0; Object.assign(FIN, BASE); regrow(); state.wilt = 0; charV = 0; VW.t = 9; HB = 0; for (const C of CANES) C.sp = null; spInit = false; for (const S of TVS) S.t = -1; for (let i = 0; i < NTV; i++) TV.setMatrixAt(i, M0); TV.instanceMatrix.needsUpdate = true; },
  get busy() { return !!actv && !(actv.def.hold && actv.t >= actv.def.dur - 1e-6); },
  get action() { return actv ? actv.name : ''; },
  get progress() { return actv ? Math.min(1, actv.t / actv.def.dur) : -1; },
  get dash() { return 0; }, get lift() { return liftV; },
  get state() { return state; }, set state(v) { if (v) Object.assign(state, v); },
  setFade(f) { fadeE = cl(+f, 0, 1); },
  get gone() { return FIN.fade < .02 && !!actv && actv.name === 'die'; },
  get holding() { return holdV; },               // 0 to 1: how firmly it holds its prey (Devour); the prey belongs at anchor('held')
  get inside() { return cl(FIN.inn, 0, 1); },   // 0 to 1: the prey is inside the shut bud (Devour); over .5 the battle hides it
  get open() { return cl(FIN.op, 0, 1.5); },    // how open the bud is: over about .6 its heart is bare to blows
  get wrath() { return wrathV; },
  get canes() { return CANES.filter((c) => c.cutJ < 0).length; },
  get greatCanes() { return CANES.filter((c) => c.great && c.cutJ < 0).length; },
  height: (BY + 2.35) * SZ, width: 11 * SZ, reach: REACH * SZ, level: LEVEL, variant: 'colossus',
  stats: { triangles: Math.round(tri), drawCalls: draws, textures: texs.size, bones: nb }
 };
}
