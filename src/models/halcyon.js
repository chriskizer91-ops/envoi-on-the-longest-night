// From reference/demos/halcyon-in-the-night-square.html, touched up after her model and action sheets
// (reference/art/halcyon-model.png, -model-b.png, -actions.png, -actions-b.webp). three.js r128 (global THREE).
function makeHalcyon(opts) {
 'use strict';
 // Halcyon, the Gloam Knight. Code-built three.js r128 model for Moonlight in the Aether.
 // Units are meters, Y up, facing +Z, feet on y = 0. Her right side is -X. Same rig layout as Sol's.
 // For model-sheet renders, state.pose = 'sheet' stands her in the sheets' A-pose with the blade hung at her side.
 opts = opts || {};
 const DET = Math.max(.5, Math.min(1, opts.detail === undefined ? 1 : +opts.detail));
 const Q = (n, m) => Math.max(m || 3, Math.round(n * DET));
 let seed = 9133;
 const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
 const cl = (v, a, b) => (v < a ? a : v > b ? b : v);
 const sm = (a, b, x) => { const t = cl((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
 const lerp = (a, b, t) => a + (b - a) * t;
 const TAU = Math.PI * 2, PI = Math.PI;
 const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
 const tex = (c, rx, ry) => { const t = new THREE.CanvasTexture(c); if (rx) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry || rx); } t.anisotropy = 4; return t; };

 // ---------- painted textures ----------
 function blob(g, x, y, r, col, sx) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, col.replace(/[\d.]+\)$/, '0)'));
  g.save(); g.translate(x, y); g.scale(sx || 1, 1); g.translate(-x, -y); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
 }
 function speck(g, W, H, n, cols, a, b) { for (let i = 0; i < n; i++) { g.fillStyle = cols[(rnd() * cols.length) | 0]; const s = a + rnd() * (b - a); g.fillRect(rnd() * W, rnd() * H, s, s); } }
 function line(g, pts, w, col) { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke(); }
 function sunGlyph(g, x, y, r, rays, fill, dark) {
  g.save(); g.translate(x, y); g.fillStyle = fill;
  for (let i = 0; i < rays; i++) {
   const a = i / rays * TAU, L = i % 2 ? r * 1.6 : r * 2.4, w = i % 2 ? .1 : .15;
   g.beginPath(); g.moveTo(Math.cos(a - w) * r * 1.05, Math.sin(a - w) * r * 1.05); g.lineTo(Math.cos(a) * L, Math.sin(a) * L); g.lineTo(Math.cos(a + w) * r * 1.05, Math.sin(a + w) * r * 1.05); g.fill();
  }
  const gr = g.createRadialGradient(-r * .3, -r * .3, r * .1, 0, 0, r); gr.addColorStop(0, '#f6dc8e'); gr.addColorStop(.6, fill); gr.addColorStop(1, dark);
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill(); g.restore();
 }
 function faceCanvas() {
  const W = 512, H = 256, c = cvs(W, H), g = c.getContext('2d');
  g.fillStyle = '#c0ae9c'; g.fillRect(0, 0, W, H);
  const P = (az, y) => [(.25 + az / TAU) * W, (.124 - y) / .252 * H];
  speck(g, W, H, 3600, ['rgba(120,84,72,.06)', 'rgba(255,236,226,.05)', 'rgba(140,96,84,.05)'], 1, 3);
  const B = (az, y, r, col, sx) => { const p = P(az, y); blob(g, p[0], p[1], r, col, sx); };
  const Ln = (pts, w, col) => line(g, pts.map((q) => P(q[0], q[1])), w, col);
  for (const sd of [-1, 1]) {
   B(sd * .36, .004, 22, 'rgba(96,70,70,.3)', 1.5);
   B(sd * .42, -.022, 14, 'rgba(108,74,80,.3)', 1.7);
   B(sd * .62, -.04, 18, 'rgba(255,236,226,.16)', 1.5);
   B(sd * .64, -.075, 22, 'rgba(110,80,80,.24)', 1.2);
   B(sd * .11, -.034, 9, 'rgba(126,90,84,.26)', .8);
   B(sd * .06, -.054, 3.4, 'rgba(60,34,30,.62)', 1.5);
   B(sd * .95, .0, 26, 'rgba(110,86,96,.16)', 1.2);
   for (let k = 0; k < 3; k++) Ln([[sd * .62, -.006 + k * .006], [sd * (.75 + .03 * k), -.002 + k * .009 - .004 * k]], 1.1, 'rgba(110,72,66,.4)');
   Ln([[sd * .16, -.05], [sd * .25, -.072], [sd * .27, -.092]], 1.6, 'rgba(116,76,70,.42)');
   Ln([[sd * .3, -.019], [sd * .52, -.027]], 1.1, 'rgba(110,76,70,.32)');
  }
  for (let k = 0; k < 3; k++) Ln([[-.5, .05 + k * .012], [0, .053 + k * .012], [.5, .05 + k * .012]], 1.2, 'rgba(120,84,76,.26)');
  Ln([[-.05, .028], [-.045, .012]], 1.6, 'rgba(100,66,60,.5)'); Ln([[.05, .028], [.045, .012]], 1.6, 'rgba(100,66,60,.5)');
  B(0, -.046, 7, 'rgba(255,236,226,.24)'); B(0, -.064, 6, 'rgba(130,92,88,.22)', .7);
  B(0, -.11, 14, 'rgba(255,236,226,.12)', 1.4); B(0, -.126, 22, 'rgba(90,70,80,.26)', 2.6);
  // three red scars raked down her left cheek, from under the eye to the jaw, as on her sheets
  for (let k = 0; k < 3; k++) {
   const a = [.33 + k * .07, -.016 - k * .013], b = [.84 + k * .07, -.068 - k * .013];
   Ln([a, b], 5.4, 'rgba(168,70,64,.34)'); Ln([a, b], 2, 'rgba(126,30,28,.92)');
   for (let j = 1; j < 6; j++) { const m = [lerp(a[0], b[0], j / 6), lerp(a[1], b[1], j / 6)]; Ln([[m[0] - .02, m[1] - .009], [m[0] + .016, m[1] + .008]], 1, 'rgba(136,44,40,.55)'); }
  }
  return c;
 }
 function irisCanvas() {
  const S = 64, c = cvs(S * 2, S), g = c.getContext('2d');
  for (const [ox, cols] of [[0, ['#f2f8ff', '#8ec4ff', '#2c5cb0']], [S, ['#f2f8ff', '#8ec4ff', '#2c5cb0']]]) { // both eyes a cold, glowing blue
   const m = ox + S / 2, gr = g.createRadialGradient(m, S / 2, 2, m, S / 2, S / 2);
   gr.addColorStop(0, cols[0]); gr.addColorStop(.55, cols[1]); gr.addColorStop(.92, cols[2]); gr.addColorStop(1, '#1a1410');
   g.fillStyle = gr; g.fillRect(ox, 0, S, S);
   for (let i = 0; i < 46; i++) { const a = rnd() * TAU; line(g, [[m + Math.cos(a) * 7, S / 2 + Math.sin(a) * 7], [m + Math.cos(a) * 28, S / 2 + Math.sin(a) * 28]], 1, 'rgba(220,238,255,.35)'); }
   g.fillStyle = '#060a12'; g.beginPath(); g.arc(m, S / 2, 6.5, 0, TAU); g.fill();
   g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(m - 8, S / 2 - 9, 3, 0, TAU); g.fill();
  }
  return c;
 }
 function mouthCanvas() {
  const W = 256, H = 64, c = cvs(W, H), g = c.getContext('2d');
  const lip = '#a8726a', dk = '#3a1612', tooth = '#e6dcd0';
  const cell = (i, fn) => { g.save(); g.translate(i * 64 + 32, 32); fn(); g.restore(); };
  // 0 stern, 1 clenched, 2 battle cry, 3 pained
  cell(0, () => { line(g, [[-18, 2], [-8, -1], [0, 0], [8, -1], [18, 3]], 3, '#5a2c26'); g.fillStyle = lip; g.beginPath(); g.moveTo(-17, 3); g.quadraticCurveTo(0, 9, 17, 4); g.quadraticCurveTo(0, 5, -17, 3); g.fill(); });
  cell(1, () => { g.fillStyle = dk; g.fillRect(-15, -3, 30, 7); g.fillStyle = tooth; g.fillRect(-13, -2.5, 26, 3); g.fillRect(-12, 1, 24, 2.5); line(g, [[-17, -3], [0, -5], [17, -3]], 2.5, lip); line(g, [[-17, 4], [0, 7], [17, 4]], 3, lip); });
  cell(2, () => { g.fillStyle = dk; g.beginPath(); g.ellipse(0, 3, 13, 12, 0, 0, TAU); g.fill(); g.fillStyle = tooth; g.fillRect(-9, -8, 18, 3.5); g.fillStyle = '#8a3a34'; g.beginPath(); g.ellipse(0, 11, 7, 3, 0, 0, TAU); g.fill(); g.strokeStyle = lip; g.lineWidth = 3; g.beginPath(); g.ellipse(0, 3, 14, 13, 0, 0, TAU); g.stroke(); });
  cell(3, () => { g.fillStyle = dk; g.beginPath(); g.moveTo(-17, 0); g.quadraticCurveTo(0, -7, 17, 0); g.quadraticCurveTo(0, 10, -17, 0); g.fill(); g.fillStyle = tooth; g.fillRect(-11, -4, 22, 3); g.fillRect(-10, 3, 20, 2.5); line(g, [[-18, 0], [0, -7], [18, 0]], 2.5, lip); line(g, [[-18, 1], [0, 9], [18, 1]], 3, lip); });
  return c;
 }
 function heightCanvas(W, H, fn, str) {
  const h = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) h[y * W + x] = fn(x, y);
  const c = cvs(W, H), g = c.getContext('2d'), img = g.createImageData(W, H), d = img.data;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
   const dx = h[y * W + (x + 1) % W] - h[y * W + (x + W - 1) % W], dy = h[((y + 1) % H) * W + x] - h[((y + H - 1) % H) * W + x];
   const nx = -dx * str, ny = dy * str, l = Math.hypot(nx, ny, 1), i = (y * W + x) * 4;
   d[i] = (nx / l * .5 + .5) * 255; d[i + 1] = (ny / l * .5 + .5) * 255; d[i + 2] = (.5 / l + .5) * 255; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0); return c;
 }
 // blackened bronze: soot-dark plate, warm bronze where it has worn, fine scratches
 // ---------- v2 textures: charred plate with gold, kingfisher cloth, white hair, gloamsteel ----------
 function strandCanvas() {
  const W = 256, H = 64, c = cvs(W, H), g = c.getContext('2d');
  g.fillStyle = '#cdc8c0'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 110; i++) { const y = rnd() * H; line(g, [[0, y], [W, y + (rnd() - .5) * 5]], .6 + rnd() * 1.5, rnd() < .55 ? 'rgba(255,255,252,.5)' : 'rgba(92,86,90,.36)'); }
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(52,48,58,.6)'); gr.addColorStop(.28, 'rgba(0,0,0,0)'); gr.addColorStop(.72, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(52,48,58,.6)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  return c;
 }
 // charred plate: soot-black steel, bronze showing where it has worn, cold moon-blue bloom, fine scratches (tileable)
 function plateCanvas() {
  const S = 256, c = cvs(S, S), g = c.getContext('2d');
  g.fillStyle = '#4c4541'; g.fillRect(0, 0, S, S);
  const cols = ['rgba(12,10,12,.42)', 'rgba(12,10,12,.42)', 'rgba(150,112,66,.32)', 'rgba(78,86,106,.28)'];
  for (let i = 0; i < 84; i++) { const x = rnd() * S, y = rnd() * S, r = 10 + rnd() * 34, col = cols[(rnd() * 4) | 0]; for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) blob(g, x + ox, y + oy, r, col); }
  for (let i = 0; i < 190; i++) { const x = rnd() * S, y = rnd() * S, a = rnd() * PI, L = 4 + rnd() * 24; line(g, [[x, y], [x + Math.cos(a) * L, y + Math.sin(a) * L]], .8, rnd() < .6 ? 'rgba(196,160,104,.34)' : 'rgba(6,5,5,.55)'); }
  speck(g, S, S, 2600, ['rgba(0,0,0,.14)', 'rgba(176,138,86,.1)'], 1, 2);
  return c;
 }
 // four claw gouges raked through a crest, top right to bottom left, as on her sheet
 function claws(g, x, y, r) {
  for (let k = 0; k < 4; k++) {
   const o = (k - 1.5) * r * .34, a = [x + r * 1.0 + o, y - r * 1.25 - k * r * .05], b = [x - r * .95 + o, y + r * 1.3 - k * r * .05], m = [lerp(a[0], b[0], .5) + r * .06, lerp(a[1], b[1], .5)];
   line(g, [a, m, b], r * .15, 'rgba(10,8,8,.96)');
   line(g, [[a[0] + r * .05, a[1]], [m[0] + r * .05, m[1]], [b[0] + r * .05, b[1]]], r * .04, 'rgba(226,214,196,.8)');
  }
 }
 // the cuirass, unwrapped: u runs round the body (front centre in the middle), v from collar to waist
 function cuirassCanvas(plate) {
  const W = 1024, H = 512, c = cvs(W, H), g = c.getContext('2d');
  g.fillStyle = g.createPattern(plate, 'repeat'); g.fillRect(0, 0, W, H);
  const gl = (pts, w) => { line(g, pts.map((p) => [p[0], p[1] + w * .5]), w * 1.7, 'rgba(6,5,5,.6)'); line(g, pts, w, 'rgba(206,160,74,.96)'); line(g, pts.map((p) => [p[0], p[1] - w * .25]), w * .3, 'rgba(255,232,160,.75)'); };
  const sh = g.createLinearGradient(0, 0, 0, H); sh.addColorStop(0, 'rgba(0,0,0,.05)'); sh.addColorStop(.55, 'rgba(0,0,0,.0)'); sh.addColorStop(1, 'rgba(0,0,0,.4)'); g.fillStyle = sh; g.fillRect(0, 0, W, H);
  for (const sd of [-1, 1]) {
   blob(g, 512 + sd * 78, 300, 70, 'rgba(0,0,0,.4)', 1.5);
   blob(g, 512 + sd * 80, 200, 60, 'rgba(150,124,96,.16)', 1.3);
   gl([[512 + sd * 232, 120], [512 + sd * 150, 262], [512 + sd * 50, 300], [512, 268]], 5);
   gl([[512 + sd * 170, 22], [512 + sd * 84, 62], [512, 112]], 4);
   for (let k = 0; k < 3; k++) gl([[512 + sd * 250, 346 + k * 52], [512 + sd * 120, 368 + k * 52], [512, 338 + k * 52]], 3.5);
   const bx = sd < 0 ? 0 : W;
   gl([[bx - sd * 24, 50], [bx - sd * 130, 110], [bx - sd * 186, 250], [bx - sd * 70, 300], [bx - sd * 10, 276]], 4);
   for (let k = 0; k < 3; k++) gl([[bx - sd * 10, 352 + k * 50], [bx - sd * 215, 342 + k * 50]], 3);
   for (let k = 0; k < 5; k++) { g.fillStyle = 'rgba(226,186,104,.95)'; g.beginPath(); g.arc(512 + sd * (236 - k * 3), 150 + k * 44, 4, 0, TAU); g.fill(); }
  }
  for (let i = 0; i < 26; i++) { const x = 300 + rnd() * 424, y = 30 + rnd() * 450, a = rnd() * PI, L = 10 + rnd() * 40; line(g, [[x, y], [x + Math.cos(a) * L, y + Math.sin(a) * L]], 1, 'rgba(214,196,168,.3)'); }
  // chainmail at her sides, under the arms, between the breastplate and the backplate
  const mp = g.createPattern(mailCanvas(), 'repeat');
  for (const cx of [256, 768]) {
   const o = [[cx - 54, 512], [cx - 54, 150], [cx - 32, 102], [cx, 88], [cx + 32, 102], [cx + 54, 150], [cx + 54, 512]];
   g.save(); g.beginPath(); o.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.clip(); g.fillStyle = mp; g.fillRect(cx - 60, 80, 120, 440); g.restore(); gl(o, 4);
  }
  g.fillStyle = '#1c1917'; g.fillRect(0, 0, 3, H);
  return c;
 }
 // tabard atlas, [x, y, w, h] per piece: the skirt's front panel (to the knee) and back panel (to the ankle), and the tabard
 // over the breastplate, front and back. UVs map straight into these boxes; everything else is cut away.
 const TA = { f: [8, 8, 288, 620], b: [320, 8, 336, 1008], cf: [680, 8, 336, 520], cb: [680, 548, 336, 468] };
 const GOLD = 'rgba(206,164,84,.95)';
 // a gold sun-wheel: rings, eight spokes and a star at the hub
 function wheel(g, x, y, r, sy) {
  g.save(); g.translate(x, y); g.scale(1, sy || 1); g.lineCap = 'round';
  for (const [col, wk] of [['rgba(8,6,4,.5)', 1.8], [GOLD, 1]]) {
   g.strokeStyle = col;
   for (const [rr, lw] of [[r, .032], [r * .66, .024], [r * .2, .03]]) { g.lineWidth = r * lw * wk; g.beginPath(); g.arc(0, 0, rr, 0, TAU); g.stroke(); }
   for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, L = r * (i % 2 ? 1.06 : 1.28); g.lineWidth = r * (i % 2 ? .018 : .028) * wk; g.beginPath(); g.moveTo(Math.cos(a) * r * .2, Math.sin(a) * r * .2); g.lineTo(Math.cos(a) * L, Math.sin(a) * L); g.stroke(); }
  }
  g.fillStyle = GOLD; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU - PI / 2, rr = r * (i % 2 ? .06 : .3); g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.fill();
  g.restore();
 }
 function tabardCanvas() {
  const c = cvs(1024, 1024), g = c.getContext('2d');
  // the weave: specks painted once into a tile and laid over every panel as a pattern
  const wc = cvs(128, 128), wg = wc.getContext('2d');
  for (let k = 0; k < 410; k++) { wg.fillStyle = rnd() < .55 ? 'rgba(0,0,0,.13)' : 'rgba(255,255,255,.05)'; wg.fillRect(rnd() * 128, rnd() * 128, 1 + rnd() * 2, 1 + rnd() * 3); }
  const weave = g.createPattern(wc, 'repeat');
  // a cloth panel: folds, weave and wear inside a frayed outline, pale linen torn along the hem and sides, a thin gold border
  const panel = (r, cols, hemL, vee, edge) => {
   const [x, y, w, h] = r, yb = (f) => y + h - hemL - vee * Math.abs(2 * f - 1), n = Math.round(w / 9), P = [[x + 1, y], [x + w - 1, y]];
   for (let j = 1; j < 8; j++) P.push([x + w - rnd() * 3, lerp(y, yb(1), j / 8)]);
   for (let i = n; i >= 0; i--) { const f = i / n, b = yb(f); P.push([x + w * Math.min(1, f + .45 / n), b + hemL * (.3 + .7 * rnd())]); P.push([x + w * f, b + hemL * .2 * rnd()]); }
   for (let j = 7; j > 0; j--) P.push([x + rnd() * 3, lerp(y, yb(0), j / 8)]);
   g.save(); g.beginPath(); P.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.clip();
   const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, cols[0]); gr.addColorStop(.45, cols[1]); gr.addColorStop(1, cols[2]); g.fillStyle = gr; g.fillRect(x, y, w, h);
   for (let k = 0; k < 9; k++) { const fx = x + w * (k + .5 + (rnd() - .5) * .5) / 9, fw = 10 + rnd() * 14, lg = g.createLinearGradient(fx - fw, 0, fx + fw, 0); lg.addColorStop(0, 'rgba(0,0,0,0)'); lg.addColorStop(.5, rnd() < .7 ? 'rgba(0,0,0,.24)' : 'rgba(150,220,220,.08)'); lg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = lg; g.fillRect(fx - fw, y, fw * 2, h); }
   g.fillStyle = weave; g.fillRect(x, y, w, h);
   for (let k = 0; k < w * h / 2500; k++) blob(g, x + rnd() * w, y + rnd() * h, 6 + rnd() * 20, rnd() < .8 ? 'rgba(2,6,8,.32)' : 'rgba(170,150,110,.12)');
   if (hemL) for (let i = 0; i < w; i += 2) { const b = yb(i / w) - hemL * (.35 + .25 * rnd()); g.fillStyle = rnd() < .5 ? '#c9b994' : '#a8987a'; g.fillRect(x + i, b, 1.6, hemL * 2.2); }
   if (edge) for (const sx of [x, x + w - edge]) for (let j = y; j < yb(sx > x ? 1 : 0); j += 2) { g.fillStyle = rnd() < .5 ? '#c4b48e' : '#9c8c6e'; g.fillRect(sx + rnd() * 2, j, edge * (.6 + .4 * rnd()), 2.1); }
   g.restore();
   const i0 = edge + 7, yl = (f) => yb(f) - hemL * .5 - 4, pts = [[x + i0, y + 3], [x + i0, yl(0)]];
   for (let k = 1; k < 8; k++) pts.push([x + w * k / 8, yl(k / 8)]);
   pts.push([x + w - i0, yl(1)], [x + w - i0, y + 3]);
   line(g, pts.map((p) => [p[0], p[1] + 1.5]), 4.5, 'rgba(6,5,5,.45)'); line(g, pts, 2.6, GOLD);
  };
  const TEAL = ['#1a4e56', '#1f646d', '#133c44'];
  panel(TA.f, TEAL, 30, 0, 10); wheel(g, TA.f[0] + TA.f[2] / 2, TA.f[1] + TA.f[3] * .73, 100);
  panel(TA.b, ['#25272a', '#1e2023', '#131416'], 34, 70, 12); wheel(g, TA.b[0] + TA.b[2] / 2, TA.b[1] + TA.b[3] * .78, 118, 1.2);
  panel(TA.cf, TEAL, 0, 0, 0);
  { const [x, y, w] = TA.cf; g.save(); g.translate(x + w / 2, y + 196); sunGlyph(g, 0, 0, 40, 16, '#d8a848', '#7a5418'); claws(g, 0, 0, 74); g.restore(); }
  panel(TA.cb, TEAL, 0, 0, 0);
  return c;
 }
 function mailCanvas() {
  const S = 64, c = cvs(S, S), g = c.getContext('2d');
  g.fillStyle = '#161514'; g.fillRect(0, 0, S, S);
  for (let y = 0; y < S + 8; y += 6) for (let x = 0; x < S + 8; x += 8) { const ox = (y / 6) % 2 ? 4 : 0; g.strokeStyle = 'rgba(124,116,108,.75)'; g.lineWidth = 1.4; g.beginPath(); g.ellipse(x + ox, y, 3.6, 2.8, 0, PI * 1.05, PI * 2.95); g.stroke(); }
  return c;
 }
 // feathers, a 4 x 2 atlas of 128 x 256 cells with the quill at the bottom: kingfisher teal, grey-white, charcoal, white down;
 // then the skirt's long ragged strips: charcoal, teal, grey-white, and charcoal frayed pale at the tip
 function featherCanvas() {
  const W = 128, H = 256, c = cvs(W * 4, H * 2), g = c.getContext('2d');
  const K = [[['#8a9c96', '#1a5650', '#0a2422'], 0], [['#e2ded4', '#b4b2aa', '#7e7f7a'], 0], [['#707276', '#383a40', '#16181b'], 0], [['#ffffff', '#ecece6', '#b4b8b8'], 2],
   [['#4a4c50', '#222428', '#101114'], 1], [['#4a746c', '#164a46', '#08201e'], 1], [['#bdb6a6', '#8f8a7e', '#6a675e'], 1], [['#4c4e52', '#26282c', '#b4a688'], 1]];
  K.forEach(([cc, k], i) => {
   g.save(); g.beginPath(); g.rect((i % 4) * W, (i >> 2) * H, W, H); g.clip(); g.translate((i % 4) * W + W / 2, (i >> 2) * H + H - 2);
   const L = H - 6, hw = W * (k === 2 ? .46 : k ? .36 : .42);
   const gr = g.createLinearGradient(0, 0, 0, -L); gr.addColorStop(0, cc[0]); gr.addColorStop(.18, cc[1]); gr.addColorStop(.72, cc[1]); gr.addColorStop(1, cc[2]);
   g.fillStyle = gr; g.beginPath(); g.moveTo(0, 0);
   if (k === 1) { g.moveTo(-hw * .4, 0); g.quadraticCurveTo(-hw * 1.1, -L * .3, -hw * .9, -L * .55); g.quadraticCurveTo(-hw * .6, -L * .85, 0, -L); g.quadraticCurveTo(hw * .6, -L * .85, hw * .9, -L * .55); g.quadraticCurveTo(hw * 1.1, -L * .3, hw * .4, 0); }
   else { g.bezierCurveTo(-hw * 1.15, -L * .2, -hw, -L * .78, 0, -L); g.bezierCurveTo(hw, -L * .78, hw * 1.15, -L * .2, 0, 0); }
   g.fill();
   // barbs, then splits through the vane and a frayed tip
   for (let n = 0; n < 110; n++) { const y = -L * (.04 + .93 * rnd()), sd = rnd() < .5 ? -1 : 1; line(g, [[0, y], [sd * hw * (.4 + .6 * rnd()), y - L * .05]], .7, rnd() < .62 ? 'rgba(0,0,0,.24)' : 'rgba(255,255,255,.11)'); }
   g.globalCompositeOperation = 'destination-out';
   const ns = k === 1 ? 16 : k === 2 ? 16 : 6;
   for (let n = 0; n < ns; n++) { const y = -L * (.15 + .8 * rnd()), sd = n % 2 ? 1 : -1; line(g, [[sd * hw * (k === 2 ? .15 : k ? .45 : .3), y], [sd * hw * 1.2, y - L * (k ? .07 : .05)]], k === 2 ? 2.2 : 1.7, '#000'); }
   if (k === 1) for (let n = 0; n < 8; n++) { const x = (n / 7 - .5) * hw * 1.5; line(g, [[x, -L], [x * .9, -L * (.78 + .12 * rnd())]], 2.4, '#000'); }
   g.globalCompositeOperation = 'source-over';
   line(g, [[0, 0], [0, -L * .95]], 1.6, k === 2 ? 'rgba(196,200,200,.5)' : 'rgba(226,230,226,.5)');
   g.restore();
  });
  return c;
 }
 // gloamsteel: black glass, a thin glowing edge each side, a faint diamond lattice and crackle on the flat. This is the emissive
 // map; it is neutral so the emissive colour decides the glow: cold blue in battle, gold at the very end
 function bladeCanvas() {
  const W = 128, H = 512, c = cvs(W, H), g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  for (let k = -4; k < 16; k++) for (const s of [0, 1]) line(g, [[s * W, k * 36], [(1 - s) * W, k * 36 + 100]], 1.2, 'rgba(150,158,176,.4)');
  for (let i = 0; i < 16; i++) { let x = 20 + rnd() * 88, y = rnd() * H; const p = [[x, y]]; for (let k = 0; k < 5; k++) { x += (rnd() - .5) * 26; y += 6 + rnd() * 14; p.push([x, y]); } line(g, p, .8, 'rgba(130,136,152,.3)'); }
  for (const [x0, x1] of [[0, 22], [W, W - 22]]) { const gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.35, 'rgba(176,184,204,.9)'); gr.addColorStop(1, 'rgba(90,96,120,0)'); g.fillStyle = gr; g.fillRect(Math.min(x0, x1), 0, 22, H); }
  return c;
 }
 function softC(inner, mid, S) { S = S || 64; const c = cvs(S, S), g = c.getContext('2d'), m = S / 2, gr = g.createRadialGradient(m, m, 0, m, m, m); gr.addColorStop(0, inner); gr.addColorStop(.4, mid); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, S, S); return c; }
 // the rim of the dark sun: dark inside, a thin cold blue ring hugging the black disc, and lightning leaping off it
 function coronaCanvas() {
  const S = 256, c = cvs(S, S), g = c.getContext('2d'), m = S / 2;
  const gr = g.createRadialGradient(m, m, 0, m, m, m); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.36, 'rgba(0,0,0,0)'); gr.addColorStop(.41, 'rgba(232,244,255,1)'); gr.addColorStop(.5, 'rgba(100,164,255,.6)'); gr.addColorStop(1, 'rgba(20,50,140,0)');
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 10; i++) { let a = rnd() * TAU, r = m * .42; const p = [[m + Math.cos(a) * r, m + Math.sin(a) * r]]; for (let k = 0; k < 6; k++) { a += (rnd() - .5) * .4; r += m * (.04 + .05 * rnd()); p.push([m + Math.cos(a) * r, m + Math.sin(a) * r]); } line(g, p, 1.2 + rnd(), 'rgba(196,224,255,.85)'); }
  return c;
 }
 // a soft lumpy puff for the black smoke
 function smokeCanvas() { const S = 64, c = cvs(S, S), g = c.getContext('2d'); for (let i = 0; i < 10; i++) blob(g, 32 + (rnd() - .5) * 22, 32 + (rnd() - .5) * 22, 9 + rnd() * 12, 'rgba(255,255,255,.5)'); return c; }
 function discCanvas() { const S = 128, c = cvs(S, S), g = c.getContext('2d'), m = S / 2; g.fillStyle = '#000'; g.beginPath(); g.arc(m, m, m - 3, 0, TAU); g.fill(); return c; }

 // deepen v1's face paint so it reads at battle distance: sockets, cheek hollows, nose, lips, weathering
 function faceV2() {
  const c = faceCanvas(), g = c.getContext('2d'), W = c.width, H = c.height;
  const P = (az, y) => [(.25 + az / TAU) * W, (.124 - y) / .252 * H], B = (az, y, r, col, sx) => { const p = P(az, y); blob(g, p[0], p[1], r, col, sx); };
  g.globalCompositeOperation = 'multiply'; g.fillStyle = '#e8ded0'; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over';
  for (const sd of [-1, 1]) {
   B(sd * .4, .0, 20, 'rgba(58,36,44,.5)', 1.6); B(sd * .4, .014, 16, 'rgba(50,32,36,.4)', 1.9); B(sd * .42, .004, 26, 'rgba(36,24,28,.42)', 1.6);
   B(sd * .7, -.072, 24, 'rgba(76,46,48,.36)', 1.1); B(sd * .14, -.03, 10, 'rgba(70,44,42,.42)', .7);
   B(sd * .58, -.03, 12, 'rgba(255,226,208,.2)', 1.4); B(sd * 1.0, -.03, 30, 'rgba(60,44,56,.3)', 1);
   line(g, [P(sd * .2, -.052), P(sd * .3, -.074), P(sd * .31, -.096)], 2.2, 'rgba(84,50,46,.5)');
   line(g, [P(sd * .22, -.012), P(sd * .56, -.022)], 1.6, 'rgba(70,44,44,.42)');
  }
  B(0, -.02, 6, 'rgba(255,232,216,.3)', .7); B(0, -.062, 8, 'rgba(70,40,38,.4)', 1.5);
  B(0, -.082, 9, 'rgba(150,84,80,.4)', 2.4); B(0, -.1, 10, 'rgba(60,40,44,.32)', 2.2);
  return c;
 }
 const plateC = plateCanvas();
 const faceT = tex(faceV2()), irisT = tex(irisCanvas()), hairT = tex(strandCanvas(), 1, 1), metalT = tex(plateC, 2, 2), cuirT = tex(cuirassCanvas(plateC));
 const mouthT = tex(mouthCanvas()), tabardT = tex(tabardCanvas()), mailT = tex(mailCanvas(), 6, 6), featherT = tex(featherCanvas()), bladeT = tex(bladeCanvas());
 seed = 7741;
 const leatherN = tex(heightCanvas(128, 128, (x, y) => Math.sin(x * .7 + Math.sin(y * .31) * 2) * .3 + Math.sin(y * .9 + x * .13) * .25 + (rnd() - .5) * .5, 1.4), 3, 3);
 const dents = []; for (let i = 0; i < 26; i++) dents.push([rnd() * 128, rnd() * 128, 5 + rnd() * 10]);
 // hammer dents, each stamped over its own wrapped footprint (the same field as summing every dent at every pixel, far faster)
 const dentH = new Float32Array(128 * 128);
 for (const d of dents) for (let y = Math.floor(d[1] - d[2]); y <= d[1] + d[2]; y++) for (let x = Math.floor(d[0] - d[2]); x <= d[0] + d[2]; x++) { const r = Math.hypot(x - d[0], y - d[1]) / d[2]; if (r < 1) dentH[((y + 128) % 128) * 128 + (x + 128) % 128] -= (1 - r * r) * .6; }
 const hammerN = tex(heightCanvas(128, 128, (x, y) => dentH[y * 128 + x] + (rnd() - .5) * .08, 1.8), 2, 2);
 const glowT = tex(softC('rgba(255,255,255,1)', 'rgba(255,255,255,.32)')), coronaT = tex(coronaCanvas()), discT = tex(discCanvas()), smokeT = tex(smokeCanvas());
 const nv2 = (k) => new THREE.Vector2(k, k);
 const std = (c, r, x) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: r, metalness: 0 }, x || {}));
 const M = {
  face: std(0xffffff, .66, { map: faceT, emissive: 0x0e0b0a }),
  skin: std(0xac9886, .66, { emissive: 0x0e0b0a }),
  eyeW: std(0xf2ece6, .35, { emissive: 0x4a4440 }),
  irisG: std(0xffffff, .3, { map: irisT, emissiveMap: irisT, emissive: 0x8ec4ff, emissiveIntensity: .9 }),
  lid: std(0xffffff, .62, { vertexColors: true, emissive: 0x20120c }),
  brow: std(0x6a645f, .75, { emissive: 0x0e0c0b }),
  mouth: std(0xffffff, .6, { map: mouthT, transparent: true, depthWrite: false, emissive: 0x24120c, polygonOffset: true, polygonOffsetFactor: -2 }),
  mouth2: null,
  hair: std(0xf4f0ea, .58, { map: hairT, emissive: 0x24221f }),
  metal: std(0xffffff, .44, { metalness: .6, map: metalT, normalMap: hammerN, normalScale: nv2(.35), emissive: 0x0b0a0a }),
  cuir: std(0xffffff, .44, { metalness: .6, map: cuirT, normalMap: hammerN, normalScale: nv2(.3), emissive: 0x0b0a0a }),
  metalDk: std(0x8c8684, .5, { metalness: .55, map: metalT, emissive: 0x060606 }),
  gold: std(0xc89a4c, .36, { metalness: .66, emissive: 0x2a1d09 }),
  leather: std(0x4a3123, .66, { normalMap: leatherN, normalScale: nv2(.6), emissive: 0x140b06 }),
  mail: std(0xffffff, .5, { metalness: .5, map: mailT, emissive: 0x060606 }),
  tabard: std(0xffffff, .82, { map: tabardT, alphaTest: .45, side: THREE.DoubleSide, emissive: 0x04100f }),
  feather: std(0xffffff, .7, { map: featherT, alphaTest: .4, side: THREE.DoubleSide, emissive: 0x040605 }),
  edge: std(0x10141f, .12, { metalness: .75, emissiveMap: bladeT, emissive: 0x6aa8ff, emissiveIntensity: .9, side: THREE.DoubleSide }),
  crack: std(0x000000, .4, { emissive: 0xffe2a0, emissiveIntensity: 0, transparent: true, opacity: 0, depthWrite: false }),
  grip: std(0x1e1614, .7, { normalMap: leatherN, normalScale: nv2(.8), emissive: 0x080504 })
 };
 M.mouth2 = M.mouth.clone(); M.mouth2.map = M.mouth.map.clone(); M.mouth2.map.needsUpdate = true;
 // every material: alpha cuts ignore fade opacity, and a shared world-height clip lets the dark take her from the feet up;
 // the blade has its own clip, never below the ground, so a planted point sinks into the floor
 const CLIP = { value: -100 }, BCLIP = { value: 0 };
 const patch = (m, clip) => {
  m.onBeforeCompile = (s) => {
   s.uniforms.uClipY = clip;
   s.vertexShader = 'varying float vWY;\n' + s.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n vWY = ( modelMatrix * vec4( transformed, 1.0 ) ).y;');
   s.fragmentShader = 'uniform float uClipY;\nvarying float vWY;\n' + s.fragmentShader.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n if ( vWY < uClipY ) discard;')
    .replace('#include <alphatest_fragment>', '#ifdef ALPHATEST\n if ( diffuseColor.a < ALPHATEST * opacity ) discard;\n#endif');
  };
  m.customProgramCacheKey = () => 'halcyon-clip';
  return m;
 };
 for (const k in M) { patch(M[k], k === 'edge' || k === 'crack' ? BCLIP : CLIP); M[k].name = k; }

 // ---------- geometry helpers ----------
 const _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _q = new THREE.Quaternion(), _m4 = new THREE.Matrix4(), _e = new THREE.Euler();
 const YA = new THREE.Vector3(0, 1, 0);
 function mkGeo(P, U, I) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
  g.setIndex(I); g.computeVertexNormals(); return g;
 }
 // parametric grid surface; f(u, v, out). wrap welds the u seam normals.
 function surf(nu, nv, f, wrap, flip) {
  const P = [], U = [], I = [], o = [0, 0, 0];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const u = i / nu, v = j / nv; f(u, v, o); P.push(o[0], o[1], o[2]); U.push(u, 1 - v); }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
   const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
   if (flip) I.push(a, b, c, b, d, c); else I.push(a, c, b, b, c, d);
  }
  const g = mkGeo(P, U, I);
  if (wrap) {
   const n = g.attributes.normal;
   for (let j = 0; j <= nv; j++) {
    const a = j * (nu + 1), b = a + nu;
    _v.set(n.getX(a) + n.getX(b), n.getY(a) + n.getY(b), n.getZ(a) + n.getZ(b)).normalize();
    n.setXYZ(a, _v.x, _v.y, _v.z); n.setXYZ(b, _v.x, _v.y, _v.z);
   }
  }
  return g;
 }
 // profile [[r, y], ...] listed top to bottom; angle 0 faces +Z
 function lathe(prof, segs, o) {
  o = o || {};
  const a0 = o.a0 === undefined ? -PI : o.a0, a1 = o.a1 === undefined ? PI : o.a1, full = o.a0 === undefined;
  const sx = o.sx || 1, sz = o.sz || 1, cx = o.cx || 0, cz = o.cz || 0, n = prof.length - 1;
  const out = [0, 0, 0];
  return surf(segs, n * (o.sub || 1), (u, v, p) => {
   const k = v * n, i = Math.min(n - 1, Math.floor(k)), f = k - i, s = f * f * (3 - 2 * f), w = o.lin ? f : s;
   const r = lerp(prof[i][0], prof[i + 1][0], w), y = lerp(prof[i][1], prof[i + 1][1], f);
   const a = lerp(a0, a1, u);
   out[0] = cx + Math.sin(a) * r * sx; out[1] = y; out[2] = cz + Math.cos(a) * r * (o.zb && Math.cos(a) < 0 ? o.zb : sz);
   if (o.fn) o.fn(out, a, v, r);
   p[0] = out[0]; p[1] = out[1]; p[2] = out[2];
  }, full, o.flip);
 }
 // tube along a Catmull-Rom curve; rFn(t) radius, flat squashes the side facing upFn(point)
 const _c = new THREE.Vector3(), _t = new THREE.Vector3(), _n = new THREE.Vector3(), _b = new THREE.Vector3();
 function tube(pts, ns, nr, rFn, flat, upFn, twist) {
  const cv = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
  const P = [], U = [], I = [];
  for (let i = 0; i <= ns; i++) {
   const t = i / ns; cv.getPointAt(t, _c); cv.getTangentAt(t, _t);
   if (upFn) upFn(_c, _n, t); else _n.set(0, 0, 1);
   _n.addScaledVector(_t, -_n.dot(_t)); if (_n.lengthSq() < 1e-8) _n.set(1, 0, 0).addScaledVector(_t, -_t.x); _n.normalize();
   _b.crossVectors(_t, _n).normalize();
   const r = rFn(t), tw = twist ? twist * t : 0;
   for (let j = 0; j <= nr; j++) {
    const a = j / nr * TAU + tw, ca = Math.cos(a), sa = Math.sin(a);
    P.push(_c.x + (_n.x * ca * flat + _b.x * sa) * r, _c.y + (_n.y * ca * flat + _b.y * sa) * r, _c.z + (_n.z * ca * flat + _b.z * sa) * r);
    U.push(t, j / nr);
   }
  }
  for (let i = 0; i < ns; i++) for (let j = 0; j < nr; j++) { const a = i * (nr + 1) + j, b = a + 1, c = a + nr + 1, d = c + 1; I.push(a, b, c, b, d, c); }
  const g = mkGeo(P, U, I);
  const nm = g.attributes.normal;
  for (let i = 0; i <= ns; i++) { const a = i * (nr + 1), b = a + nr; _v.set(nm.getX(a) + nm.getX(b), nm.getY(a) + nm.getY(b), nm.getZ(a) + nm.getZ(b)).normalize(); nm.setXYZ(a, _v.x, _v.y, _v.z); nm.setXYZ(b, _v.x, _v.y, _v.z); }
  return g;
 }
 // closed thin plate from a surface f(u, v, out): outer face, inner face offset by th, and rims
 function slab(nu, nv, f, th, inset) {
  const P = [], U = [], I = [], o = [0, 0, 0], o2 = [0, 0, 0], N = [];
  const e = 1e-3;
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
   const u = i / nu, v = j / nv; f(u, v, o);
   f(Math.min(1, u + e), v, o2); const du = [o2[0] - o[0], o2[1] - o[1], o2[2] - o[2]]; if (u + e > 1) { f(u - e, v, o2); du[0] = o[0] - o2[0]; du[1] = o[1] - o2[1]; du[2] = o[2] - o2[2]; }
   f(u, Math.min(1, v + e), o2); const dv = [o2[0] - o[0], o2[1] - o[1], o2[2] - o[2]]; if (v + e > 1) { f(u, v - e, o2); dv[0] = o[0] - o2[0]; dv[1] = o[1] - o2[1]; dv[2] = o[2] - o2[2]; }
   _v.set(du[0], du[1], du[2]); _v2.set(dv[0], dv[1], dv[2]); _v.cross(_v2).normalize();
   const k = inset ? inset(u, v) : 1;
   P.push(o[0], o[1], o[2]); N.push(_v.x * th * k, _v.y * th * k, _v.z * th * k); U.push(u, 1 - v);
  }
  const n0 = P.length / 3;
  for (let k = 0; k < n0; k++) { P.push(P[k * 3] - N[k * 3], P[k * 3 + 1] - N[k * 3 + 1], P[k * 3 + 2] - N[k * 3 + 2]); U.push(U[k * 2], U[k * 2 + 1]); }
  const id = (i, j) => j * (nu + 1) + i;
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
   const a = id(i, j), b = id(i + 1, j), c = id(i, j + 1), d = id(i + 1, j + 1);
   I.push(a, b, c, b, d, c); I.push(a + n0, c + n0, b + n0, b + n0, c + n0, d + n0);
  }
  const g = mkGeo(P, U, I);
  // rims as separate quads so plate edges read as thick
  const R = [], RU = [], RI = [];
  const edge = (list) => {
   const base = R.length / 3;
   for (const k of list) { R.push(P[k * 3], P[k * 3 + 1], P[k * 3 + 2], P[(k + n0) * 3], P[(k + n0) * 3 + 1], P[(k + n0) * 3 + 2]); RU.push(0, 0, 0, 1); }
   for (let q = 0; q < list.length - 1; q++) { const a = base + q * 2; RI.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  };
  const top = [], bot = [], lef = [], rig = [];
  for (let i = 0; i <= nu; i++) { top.push(id(i, 0)); bot.push(id(nu - i, nv)); }
  for (let j = 0; j <= nv; j++) { rig.push(id(nu, j)); lef.push(id(0, nv - j)); }
  edge(top); edge(rig); edge(bot); edge(lef);
  const rg = mkGeo(R, RU, RI);
  return mergeGeos([g, rg]);
 }
 function mergeGeos(list) {
  let nv = 0, ni = 0;
  for (const g of list) { nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
  const P = new Float32Array(nv * 3), N = new Float32Array(nv * 3), U = new Float32Array(nv * 2), I = new Uint32Array(ni);
  let vo = 0, io = 0;
  for (const g of list) {
   const c = g.attributes.position.count;
   P.set(g.attributes.position.array, vo * 3); N.set(g.attributes.normal.array, vo * 3); if (g.attributes.uv) U.set(g.attributes.uv.array, vo * 2);
   if (g.index) { const a = g.index.array; for (let k = 0; k < a.length; k++) I[io + k] = a[k] + vo; io += a.length; } else { for (let k = 0; k < c; k++) I[io + k] = vo + k; io += c; }
   vo += c;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N, 3)); g.setAttribute('uv', new THREE.BufferAttribute(U, 2));
  g.setIndex(new THREE.BufferAttribute(I, 1)); return g;
 }
 const dummy = new THREE.Object3D();
 function place(geo, p, r, s, q) {
  if (!p && !r && !s && !q) return geo;
  dummy.position.set(p ? p[0] : 0, p ? p[1] : 0, p ? p[2] : 0);
  if (q) dummy.quaternion.copy(q); else dummy.rotation.set(r ? r[0] : 0, r ? r[1] : 0, r ? r[2] : 0, r && r[3] ? r[3] : 'XYZ');
  if (s === undefined || s === null) dummy.scale.set(1, 1, 1); else if (typeof s === 'number') dummy.scale.set(s, s, s); else dummy.scale.set(s[0], s[1], s[2]);
  dummy.updateMatrix(); const g = geo.clone(); g.applyMatrix4(dummy.matrix); return g;
 }
 // quaternion that turns +Y toward d (for orienting cylinders and plates along a direction)
 const qY = (d) => new THREE.Quaternion().setFromUnitVectors(YA, _v.set(d[0], d[1], d[2]).normalize());
 function seg(mat, w, a, b, r0, r1, rs, caps) {
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(d[0], d[1], d[2]);
  add(new THREE.CylinderGeometry(r1, r0, L, rs, 1, true), mat, w, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], null, null, qY(d));
  if (caps) { add(new THREE.SphereGeometry(r0, rs, Math.max(4, rs >> 1)), mat, w, a); add(new THREE.SphereGeometry(r1, rs, Math.max(4, rs >> 1)), mat, w, b); }
 }

 // ---------- skinned buckets: every piece is weighted, then merged per material ----------
 const BUCK = new Map();
 function add(geo, mat, w, p, r, s, q) {
  const g = place(geo, p, r, s, q);
  if (!g.attributes.normal) g.computeVertexNormals();
  const pos = g.attributes.position, n = pos.count, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
  if (typeof w === 'number') for (let i = 0; i < n; i++) { si[i * 4] = w; sw[i * 4] = 1; }
  else for (let i = 0; i < n; i++) {
   let inf = w(pos.getX(i), pos.getY(i), pos.getZ(i), i);
   if (inf.length > 1) { inf = inf.filter((e) => e[1] > 1e-4); if (inf.length > 4) inf = inf.sort((x, y) => y[1] - x[1]).slice(0, 4); }
   let tot = 0; for (const e of inf) tot += e[1];
   if (!tot) { si[i * 4] = 0; sw[i * 4] = 1; continue; }
   for (let k = 0; k < inf.length; k++) { si[i * 4 + k] = inf[k][0]; sw[i * 4 + k] = inf[k][1] / tot; }
  }
  let L = BUCK.get(mat); if (!L) BUCK.set(mat, (L = []));
  L.push({ g, si, sw });
 }
 function buildSkinned(parent, skeleton, list) {
  for (const [mat, L] of BUCK) {
   const geo = mergeGeos(L.map((e) => e.g));
   const nv = geo.attributes.position.count, SI = new Uint16Array(nv * 4), SW = new Float32Array(nv * 4);
   let o = 0; for (const e of L) { SI.set(e.si, o); SW.set(e.sw, o); o += e.si.length; }
   geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(SI, 4));
   geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(SW, 4));
   geo.computeBoundingSphere();
   mat.skinning = true;
   const m = new THREE.SkinnedMesh(geo, mat); m.frustumCulled = false;
   if (mat.transparent) m.renderOrder = 2;
   parent.add(m); m.bind(skeleton); list.push(m);
  }
  BUCK.clear();
 }

 // ---------- skeleton (63 bones): Sol's layout at 1.88 m, plus braid, tabard grid, crest and mantle springs ----------
 const root = new THREE.Group(); root.name = 'Halcyon';
 const bones = [], BI = {};
 function bone(name, parent, x, y, z) { const b = new THREE.Bone(); b.name = name; b.position.set(x, y, z); parent.add(b); BI[name] = bones.length; bones.push(b); return b; }
 const pelvis = bone('pelvis', root, 0, 1.01, 0);
 const spine = bone('spine', pelvis, 0, .115, 0);
 const chest = bone('chest', spine, 0, .157, 0);
 const neck = bone('neck', chest, 0, .203, -.008);
 const head = bone('head', neck, 0, .1, .01);
 // world points of the braid: from the nape under the helm, straight down her back to a gold cuff below the belts
 const BRP = [[0, 1.6, -.096], [0, 1.53, -.14], [0, 1.42, -.153], [0, 1.3, -.157], [0, 1.18, -.153], [0, 1.08, -.163], [0, .99, -.19]];
 const braid = [];
 { let p = head, w = [0, 1.585, .002]; for (let i = 0; i < 6; i++) { p = bone('braid' + i, p, BRP[i][0] - w[0], BRP[i][1] - w[1], BRP[i][2] - w[2]); w = BRP[i]; braid.push(p); } }
 // six feather springs along the top of the helm behind its front plate, front to back: x, y, z, then the way the feathers lean
 const CRP = [[0, 1.845, .028, 0, .82, -.57], [0, 1.85, -.006, 0, .64, -.77], [0, 1.842, -.038, 0, .45, -.89], [0, 1.822, -.068, 0, .22, -.97], [0, 1.79, -.092, 0, 0, -1], [0, 1.748, -.108, 0, -.3, -.95]];
 const crest = CRP.map((c, i) => bone('crest' + i, head, c[0], c[1] - 1.585, c[2] - .002));
 const arms = [], elbows = [], wrists = [], fing = [], thumb = [], mant = [];
 for (const sd of [-1, 1]) {
  const s = bone('shoulder' + sd, chest, .205 * sd, .173, -.012);
  const e = bone('elbow' + sd, s, 0, -.298, 0);
  const w = bone('wrist' + sd, e, 0, -.267, 0);
  const f1 = bone('fing1' + sd, w, -sd * .004, -.094, 0), f2 = bone('fing2' + sd, f1, 0, -.048, 0), f3 = bone('fing3' + sd, f2, 0, -.032, 0);
  const t1 = bone('thumb1' + sd, w, -sd * .006, -.034, .032), t2 = bone('thumb2' + sd, t1, 0, -.038, .008);
  arms.push(s); elbows.push(e); wrists.push(w); fing.push([f1, f2, f3]); thumb.push([t1, t2]);
  mant.push(bone('mant' + sd, s, sd * .03, -.06, 0));
 }
 const legs = [], knees = [], ankles = [], toes = [];
 for (const sd of [-1, 1]) {
  const h = bone('hip' + sd, pelvis, .1 * sd, -.062, 0);
  const k = bone('knee' + sd, h, 0, -.433, .008);
  const a = bone('ankle' + sd, k, 0, -.428, -.012);
  const t = bone('toe' + sd, a, 0, -.063, .141);
  legs.push(h); knees.push(k); ankles.push(a); toes.push(t);
 }
 // the skirt: 10 columns round the hips, two bones each. The front pair carries the knee-length front panel; the rest hang
 // under the feathers, which flare wide at the sides and back and reach the shins, longest at the back.
 const TBN = 10, TBA = [-2.62, -2.02, -1.46, -.96, -.2, .2, .96, 1.46, 2.02, 2.62], tabU = [], tabL = [], tabTip = [];
 const ell = (a, rx, rf, rb) => [Math.sin(a) * rx, Math.cos(a) * (Math.cos(a) > 0 ? rf : rb)];
 const skirtR = (a, y) => { const d = Math.max(0, 1.02 - y); return ell(a, .178 + .46 * d, .152 + .18 * d, .162 + .34 * d); };
 const skirtP = (a, y, off) => { const p = skirtR(a, y), k = 1 + (off || 0) / Math.hypot(p[0], p[1]); return [p[0] * k, y, p[1] * k]; };
 const hemY = (a) => lerp(.3, .1, sm(.9, 2.7, Math.abs(a)));
 const TY0 = 1.0, TY1 = .64;
 const tabRing = (a, k) => { const y = k ? (k === 1 ? TY1 : hemY(a)) : TY0; return [skirtR(a, y), y]; };
 for (let k = 0; k < TBN; k++) {
  const a = TBA[k], [p0, y0] = tabRing(a, 0), [p1, y1] = tabRing(a, 1), [p2, y2] = tabRing(a, 2);
  const U = bone('tabU' + k, pelvis, p0[0], y0 - 1.01, p0[1]), L = bone('tabL' + k, U, p1[0] - p0[0], y1 - y0, p1[1] - p0[1]);
  tabU.push(U); tabL.push(L); tabTip.push(new THREE.Vector3(p2[0] - p1[0], y2 - y1, p2[1] - p1[1]));
 }
 root.updateMatrixWorld(true);
 const bw = (b) => { b.getWorldPosition(_v); return [_v.x, _v.y, _v.z]; };
 const HW = bw(head);

 // ---------- skin weight functions (bind pose, world space) ----------
 function wTorso(x, y) {
  let w;
  if (y > 1.22) { const t = sm(1.22, 1.33, y); w = [[BI.spine, 1 - t], [BI.chest, t]]; }
  else if (y > 1.045) { const t = sm(1.045, 1.15, y); w = [[BI.pelvis, 1 - t], [BI.spine, t]]; }
  else w = [[BI.pelvis, 1]];
  const ax = Math.abs(x);
  if (y > 1.3 && ax > .115) { const k = sm(.115, .18, ax) * sm(1.3, 1.42, y) * .45; for (const e of w) e[1] *= 1 - k; w.push([BI['shoulder' + (x < 0 ? -1 : 1)], k]); }
  return w;
 }
 function wNeck(x, y) {
  if (y < 1.515) { const t = sm(1.46, 1.515, y); return [[BI.chest, 1 - t], [BI.neck, t]]; }
  const t = sm(1.565, 1.62, y); return [[BI.neck, 1 - t], [BI.head, t]];
 }
 function wLeg(x, y) {
  const sd = x < 0 ? -1 : 1, H = BI['hip' + sd], K = BI['knee' + sd], A = BI['ankle' + sd];
  if (y > .877) { const t = sm(1.01, .9, y); return [[BI.pelvis, 1 - t], [H, t]]; }
  if (y > .46) { const t = sm(.574, .47, y); return [[H, 1 - t], [K, t]]; }
  const t = sm(.136, .073, y); return [[K, 1 - t], [A, t]];
 }
 function wFoot(x, y, z) {
  const sd = x < 0 ? -1 : 1, K = BI['knee' + sd], A = BI['ankle' + sd], T = BI['toe' + sd];
  const tk = sm(.104, .157, y), tt = sm(.089, .157, z);
  return [[K, tk], [A, (1 - tk) * (1 - tt)], [T, (1 - tk) * tt]];
 }
 function wArm(x, y) {
  const sd = x < 0 ? -1 : 1, S = BI['shoulder' + sd], E = BI['elbow' + sd], Wr = BI['wrist' + sd];
  if (y > 1.42) { const t = sm(1.524, 1.43, y); return [[BI.chest, (1 - t) * .6], [S, 1 - (1 - t) * .6]]; }
  if (y > 1.206) return [[S, 1]];
  if (y > 1.117) { const t = sm(1.206, 1.117, y); return [[S, 1 - t], [E, t]]; }
  if (y > .913) return [[E, 1]];
  const t = sm(.913, .887, y); return [[E, 1 - t], [Wr, t]];
 }
 // weights along a bone chain: nearest segment, blended across joints
 function wChain(names, pts, parent, rootK) {
  const idx = names.map((n) => BI[n]), P = pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])), pb = parent ? BI[parent] : -1;
  const A = new THREE.Vector3(), D = new THREE.Vector3(), X = new THREE.Vector3();
  return (x, y, z) => {
   X.set(x, y, z); let best = 1e9, bi = 0, bt = 0;
   for (let i = 0; i < idx.length; i++) {
    D.subVectors(P[i + 1], P[i]); const L2 = D.lengthSq(), t = A.subVectors(X, P[i]).dot(D) / L2;
    const d = A.copy(P[i]).addScaledVector(D, cl(t, 0, 1)).distanceToSquared(X);
    if (d < best) { best = d; bi = i; bt = t; }
   }
   if (bi === 0 && bt < .3 && pb >= 0) { const k = sm(.3, -.15, bt) * (rootK || .6); return [[pb, k], [idx[0], 1 - k]]; }
   if (bt < .3 && bi > 0) { const k = sm(.3, 0, bt) * .5; return [[idx[bi - 1], k], [idx[bi], 1 - k]]; }
   if (bt > .7 && bi < idx.length - 1) { const k = sm(.7, 1, bt) * .5; return [[idx[bi], 1 - k], [idx[bi + 1], k]]; }
   return [[idx[bi], 1]];
  };
 }
 function crv(tab, c, y) {
  const n = tab.length; if (y >= tab[0][0]) return tab[0][c]; if (y <= tab[n - 1][0]) return tab[n - 1][c];
  let i = 0; while (i < n - 2 && y < tab[i + 1][0]) i++;
  const p0 = tab[Math.max(0, i - 1)][c], p1 = tab[i][c], p2 = tab[i + 1][c], p3 = tab[Math.min(n - 1, i + 2)][c];
  const t = (tab[i][0] - y) / (tab[i][0] - tab[i + 1][0]), t2 = t * t;
  return .5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (3 * p1 - p0 - 3 * p2 + p3) * t2 * t);
 }

 // ---------- head: a weathered, square-jawed face ----------
 const HC = [0, 1.69, .01];
 const HPL = [[.02, .077, .096, .102], [-.01, .077, .098, .101], [-.035, .074, .097, .094], [-.06, .068, .093, .08], [-.08, .063, .088, .064], [-.098, .056, .083, .048], [-.112, .044, .077, .034], [-.121, .03, .07, .02], [-.127, 0, .062, 0]];
 const HB = [[0, -.02, .08, .022, .008], [0, -.046, .1, .012, .015], [-.15, -.053, .06, .008, .0042], [.15, -.053, .06, .008, .0042],
  [-.41, -.004, .16, .016, -.009], [.41, -.004, .16, .016, -.009], [-.38, .019, .27, .01, .0055], [.38, .019, .27, .01, .0055],
  [-.62, -.034, .2, .016, .007], [.62, -.034, .2, .016, .007], [-.6, -.072, .22, .02, -.003], [.6, -.072, .22, .02, -.003],
  [0, -.074, .15, .006, .0035], [0, -.087, .13, .006, .0035], [0, -.113, .2, .013, .006]];
 function hprof(y) {
  if (y >= .02) { const k = Math.sqrt(Math.max(0, 1 - ((y - .02) / .104) ** 2)); return [.077 * k, .096 * k, .102 * k]; }
  return [crv(HPL, 1, y), crv(HPL, 2, y), crv(HPL, 3, y)];
 }
 function headR(az, y, o) {
  const pr = hprof(y), s = Math.sin(az), c = Math.cos(az);
  let x = pr[0] * s, z = c > 0 ? pr[1] * Math.pow(c, .8) : pr[2] * c, b = 0;
  if (c > .2) for (const h of HB) { const da = (az - h[0]) / h[2], dy = (y - h[1]) / h[3]; b += h[4] * Math.exp(-da * da - dy * dy); }
  if (b) { const L = Math.hypot(x, z) || 1; x += x / L * b; z += z / L * b; }
  o[0] = x; o[1] = y; o[2] = z; return o;
 }
 const _o0 = [0, 0, 0], _o1 = [0, 0, 0], _o2 = [0, 0, 0];
 function hp(az, y, off) {
  headR(az, y, _o0); headR(az + 1e-3, y, _o1); headR(az, y + 1e-3, _o2);
  const n = new THREE.Vector3(_o1[0] - _o0[0], _o1[1] - _o0[1], _o1[2] - _o0[2]).cross(_v2.set(_o2[0] - _o0[0], _o2[1] - _o0[1], _o2[2] - _o0[2])).normalize();
  off = off || 0;
  return { p: [HC[0] + _o0[0] + n.x * off, HC[1] + _o0[1] + n.y * off, HC[2] + _o0[2] + n.z * off], n };
 }
 add(surf(Q(60, 30), Q(44, 22), (u, v, o) => { headR((u - .25) * TAU, lerp(.124, -.128, v), o); o[0] += HC[0]; o[1] += HC[1]; o[2] += HC[2]; }, true), M.face, BI.head);
 add(lathe([[.05, 1.62], [.052, 1.56], [.056, 1.5], [.064, 1.46]], Q(20), { cz: -.012, sub: 2 }), M.skin, wNeck);

 // ---------- face: narrowed stern eyes, both a cold glowing blue, heavy low brows, a set mouth ----------
 const face = new THREE.Group(); head.add(face);
 const SX = .0172, SY = .0112, SZ = .0076, IRX = .0086, IRY = .0092;
 const EF = [];
 for (const sd of [-1, 1]) {
  const s = hp(sd * .41, -.004, -.0036);
  const zA = s.n.clone().lerp(new THREE.Vector3(0, 0, 1), .55).normalize(), xA = new THREE.Vector3().crossVectors(YA, zA).normalize(), yA = new THREE.Vector3().crossVectors(zA, xA);
  EF.push({ sd, m: new THREE.Matrix4().makeBasis(xA, yA, zA).setPosition(s.p[0] - HW[0], s.p[1] - HW[1], s.p[2] - HW[2]) });
 }
 const zS = (x, y) => SZ * Math.sqrt(Math.max(0, 1 - (x / SX) ** 2 - (y / SY) ** 2));
 {
  const gs = [];
  for (const f of EF) {
   const g = new THREE.SphereGeometry(1, Q(20), Q(12)); g.scale(SX, SY, SZ);
   const p = g.attributes.position, col = new Float32Array(p.count * 3);
   for (let i = 0; i < p.count; i++) { const r = Math.abs(p.getX(i)) / SX, k = 1 - .34 * sm(0, SY, p.getY(i)) - .06 * sm(-.4 * SY, -SY, p.getY(i)); col[i * 3] = k; col[i * 3 + 1] = k * (.94 - .08 * r); col[i * 3 + 2] = k * (.92 - .08 * r); }
   g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.applyMatrix4(f.m); gs.push(g);
  }
  const g = mergeGeos(gs); const col = new Float32Array(g.attributes.position.count * 3); let o = 0; for (const s of gs) { col.set(s.attributes.color.array, o); o += s.attributes.color.array.length; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  M.eyeW.vertexColors = true; face.add(new THREE.Mesh(g, M.eyeW));
 }
 // one iris mesh per eye; both glow a cold blue
 const IR = [];
 for (let e = 0; e < 2; e++) {
  const g = new THREE.RingGeometry(0, 1, Q(24, 12), 3), uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * .5 + (e ? .5 : 0));
  const nm = g.attributes.normal; _v.setFromMatrixColumn(EF[e].m, 2).normalize(); for (let i = 0; i < nm.count; i++) nm.setXYZ(i, _v.x, _v.y, _v.z);
  IR.push({ g, base: Float32Array.from(g.attributes.position.array), ox: 9, oy: 9 }); face.add(new THREE.Mesh(g, M.irisG));
 }
 function setGaze(ox, oy) {
  for (let e = 0; e < 2; e++) {
   const r = IR[e]; if (Math.abs(ox - r.ox) < 1e-5 && Math.abs(oy - r.oy) < 1e-5) continue;
   r.ox = ox; r.oy = oy; const p = r.g.attributes.position;
   for (let i = 0; i < p.count; i++) { const X = r.base[i * 3] * IRX + ox, Y = r.base[i * 3 + 1] * IRY + oy; _v.set(X, Y, zS(X, Y) + .0004).applyMatrix4(EF[e].m); p.setXYZ(i, _v.x, _v.y, _v.z); }
   p.needsUpdate = true;
  }
 }
 const EYEL = new THREE.Vector3().setFromMatrixPosition(EF[1].m);
 let lidMesh, browMesh;
 {
  const P = [], PC = [], C = [], I = [], U = [];
  const skn = [.86, .78, .74], crease = [.6, .48, .46], lash = [.12, .1, .1], lowL = [.72, .52, .5];
  const put = (f, x, y, yc, zl, col) => {
   const z = Math.max(zS(x, y) + .0011, .0026) + zl, zc = Math.max(zS(x, yc) + .0011, .0026) + zl;
   _v.set(x, y, z).applyMatrix4(f.m); P.push(_v.x, _v.y, _v.z); _v.set(x, yc, zc).applyMatrix4(f.m); PC.push(_v.x, _v.y, _v.z); C.push(col[0], col[1], col[2]); U.push(0, 0);
  };
  const grid = (nx, ny, fn, flip) => {
   const b = P.length / 3;
   for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) fn(i / nx, j / ny);
   for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = b + j * (nx + 1) + i, c = a + nx + 1; if (flip) I.push(a, a + 1, c, a + 1, c + 1, c); else I.push(a, c, a + 1, a + 1, c, c + 1); }
  };
  for (const f of EF) {
   const sd = f.sd, xo = (x) => x * sd;
   const yE = (x) => SY * (.74 - .36 * x * x + .1 * xo(x)), yC = (x) => SY * (-.5 + .22 * x * x + .04 * xo(x)), yT = (x) => SY * (1.4 - .3 * x * x + .06 * xo(x));
   grid(Q(12, 8), 5, (s, r) => { const x = lerp(-1.12, 1.12, s), X = x * SX; put(f, X, lerp(yT(x), yE(x), r), lerp(yT(x), yC(x), r), 0, r > .65 ? crease : skn); });
   grid(Q(14, 8), 2, (s, r) => { const x = lerp(-1.04, 1.06, s) * sd, X = x * SX, th = .0018; put(f, X, yE(x) - r * th, yC(x) - r * th * .7, .0011, lash); }, sd < 0);
   grid(Q(12, 6), 1, (s, r) => { const o = lerp(-.8, .98, s), x = o * sd, y = -SY * (.74 - .34 * x * x) - r * .0012; put(f, x * SX, y, y + .0004, .0006, lowL); }, sd < 0);
   grid(Q(12, 6), 3, (s, r) => { const x = lerp(-1.1, 1.1, s), y0 = -SY * (.74 - .34 * x * x) - .0012, y = lerp(y0, -SY * 1.35, r); put(f, x * SX, y, y, 0, skn); });
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
  g.setIndex(I); g.computeVertexNormals(); g.morphAttributes.position = [new THREE.Float32BufferAttribute(PC, 3)];
  M.lid.morphTargets = true; lidMesh = new THREE.Mesh(g, M.lid); lidMesh.morphTargetInfluences = [0]; face.add(lidMesh);
 }
 {
  // heavy brows set low and drawn in; the morph (k) knots them harder
  const mk = (k) => {
   const gs = [];
   for (const sd of [-1, 1]) {
    const pts = [hp(sd * (.12 + .01 * k), .0105 - .004 * k, .0026).p, hp(sd * .3, .0175 - .002 * k, .003).p, hp(sd * .5, .0195 + .001 * k, .003).p, hp(sd * .72, .0125, .0024).p];
    gs.push(tube(pts.map((p) => [p[0] - HW[0], p[1] - HW[1], p[2] - HW[2]]), Q(12, 6), Q(5, 4), (t) => .0046 * Math.pow(1 - t * .8, .6) + .0008, .4, (c, n) => n.set(c.x - HC[0] + HW[0], c.y - HC[1] + HW[1], c.z - HC[2] + HW[2])));
   }
   return mergeGeos(gs);
  };
  const g = mk(0); g.morphAttributes.position = [mk(1).attributes.position];
  M.brow.morphTargets = true; browMesh = new THREE.Mesh(g, M.brow); browMesh.morphTargetInfluences = [0]; face.add(browMesh);
 }
 const mouths = [];
 {
  const g = surf(Q(10, 6), Q(5, 3), (u, v, o) => { const s = hp(lerp(-.27, .27, u), lerp(-.07, -.094, v), .0011); o[0] = s.p[0] - HW[0]; o[1] = s.p[1] - HW[1]; o[2] = s.p[2] - HW[2]; });
  for (const mat of [M.mouth, M.mouth2]) { mat.map.repeat.set(.25, 1); const m = new THREE.Mesh(g, mat); m.renderOrder = 3; face.add(m); mouths.push(m); }
 }
 // white hair: swept back under the helm, showing at the temples beside its pointed brow, and loose strands down beside the face
 add(surf(Q(28, 14), 4, (u, v, o) => { const a = lerp(-1.3, 1.3, u), s = hp(a, lerp(.1, .036 - .044 * sm(.25, 1.1, Math.abs(a)), v), .004 + .003 * (1 - v)); o[0] = s.p[0]; o[1] = s.p[1]; o[2] = s.p[2]; }), M.hair, BI.head);
 for (const sd of [-1, 1]) for (const [a0, a1, yE, r] of [[.86, .76, -.2, .0062], [.78, .64, -.13, .005], [.95, .92, -.23, .006], [.7, .66, -.1, .0042], [1.02, 1.04, -.17, .0052]]) {
  const p0 = hp(sd * a0, .055, .005).p, p1 = hp(sd * lerp(a0, a1, .4), -.01, .009).p, p2 = hp(sd * a1, -.075, .014).p;
  const g = tube([p0, p1, p2, [HC[0] + (p2[0] - HC[0]) * 1.4, HC[1] + yE, HC[2] + (p2[2] - HC[2]) * .92]], Q(14, 8), Q(6, 4), (t) => r * (1 - .7 * t) + .0012, .7, (c, n) => n.set(c.x - HC[0], 0, c.z - HC[2]));
  add(g, M.hair, BI.head);
 }

 // ---------- the helm: open-faced and blackened, a pointed front plate from a peak above the crown down to a point at the brow,
 // cheek guards that flare away from the face, a flared neck guard, and a gold sun boss over each ear ----------
 {
  const yBot = (az) => { const a = Math.abs(az); return a < .95 ? .034 + .052 * Math.pow(a / .95, 1.1) : a < 1.12 ? lerp(.086, -.08, sm(.95, 1.12, a)) : lerp(-.08, -.03, sm(1.12, 1.55, a)) - .055 * sm(1.7, 2.7, a); };
  const off = (az, y, v) => { const a = Math.abs(az); return .012 + .004 * Math.sin(PI * v) + .03 * sm(1.9, PI, a) * sm(-.02, -.1, y) + .024 * sm(.9, 1.1, a) * (1 - sm(1.3, 1.6, a)) * sm(.03, -.08, y); };
  const hpt = (az, y, v, extra, o) => { const s = hp(az, Math.min(y, .12), off(az, y, v) + (extra || 0)); o[0] = s.p[0]; o[1] = s.p[1] + Math.max(0, y - .12) * .6; o[2] = s.p[2]; return o; };
  add(slab(Q(80, 40), Q(20, 10), (u, v, o) => { const az = lerp(-PI, PI, u), y = lerp(.128, yBot(az), v); return hpt(az, y, v, 0, o); }, .005), M.metal, BI.head);
  // close the crown of the helm, which otherwise shows her scalp when she bows her head
  {
   const P = [], U = [], I = [], ring = [], o = [0, 0, 0], c = [0, 0, 0];
   for (let i = 0; i < 48; i++) { const az = lerp(-PI, PI, i / 48); hpt(az, .128, 0, 0, o); ring.push([o[0], o[1], o[2]]); c[0] += o[0] / 48; c[1] += o[1] / 48; c[2] += o[2] / 48; }
   P.push(c[0], c[1] + .006, c[2]); U.push(.5, .5);
   for (const r of ring) { P.push(r[0], r[1], r[2]); U.push(.5, .5); }
   for (let i = 0; i < 48; i++) I.push(0, 1 + i, 1 + (i + 1) % 48);
   const g = mkGeo(P, U, I); g.computeVertexNormals();
   if (g.attributes.normal.getY(0) < 0) { const ix = g.index.array; for (let k = 0; k < ix.length; k += 3) { const t = ix[k + 1]; ix[k + 1] = ix[k + 2]; ix[k + 2] = t; } g.computeVertexNormals(); }
   add(g, M.metal, BI.head);
  }
  const rim = []; for (let i = 0; i <= 96; i++) { const az = lerp(-PI, PI, i / 96); rim.push(hpt(az, yBot(az), 1, .006, [0, 0, 0])); }
  add(tube(rim, Q(128, 64), Q(5, 4), () => .0045, 1, null), M.gold, BI.head);
  // the front plate: a pointed kite, ridged down the middle, rising free above the crown to a peak
  const yV = (a) => .034 + .052 * Math.pow(Math.abs(a) / .95, 1.1), yT = (a) => .18 - .094 * Math.abs(a) / .95;
  const fpt = (a, y, ex, o) => { hpt(a, Math.min(y, .1), .5, .004 + ex + .008 * Math.exp(-((a / .1) ** 2)), o); if (y > .1) { o[1] += y - .1; o[2] -= .3 * (y - .1); } return o; };
  add(slab(Q(24, 12), Q(14, 8), (u, v, o) => { const a = lerp(-.95, .95, u); return fpt(a, lerp(yV(a), yT(a), v), 0, o); }, .005), M.metal, BI.head);
  { const e = []; for (let i = 0; i <= 24; i++) { const a = lerp(-.95, .95, i / 24); e.push(fpt(a, yT(a), .003, [0, 0, 0])); } add(tube(e, Q(48, 24), Q(5, 4), () => .0042, 1, null), M.gold, BI.head); }
  { const e = []; for (let i = 0; i <= 10; i++) e.push(fpt(0, lerp(.04, .175, i / 10), .004, [0, 0, 0])); add(tube(e, Q(20, 10), Q(5, 4), () => .0028, 1, null), M.gold, BI.head); }
  // a ridge comb from the crown down the back, where the feathers rise, edged in gold
  const ridge = [], ridgeG = []; for (let i = 0; i <= 10; i++) { const yy = lerp(.125, -.03, i / 10); ridge.push(hpt(PI, yy, .5, .008, [0, 0, 0])); ridgeG.push(hpt(PI, yy, .5, .019, [0, 0, 0])); }
  add(tube(ridge, Q(20, 10), Q(6, 4), (t) => .008 + .005 * Math.sin(PI * t), .5, null), M.metalDk, BI.head);
  add(tube(ridgeG, Q(20, 10), Q(5, 4), () => .0028, 1, null), M.gold, BI.head);
  // the sun bosses: a dark disc in a gold ring, twelve gold rays and a gold dome
  for (const sd of [-1, 1]) {
   const b = hpt(sd * 1.3, .024, .5, .004, [0, 0, 0]), n = hp(sd * 1.3, .024, 0).n, q = new THREE.Quaternion().setFromUnitVectors(YA, n), at = (k, d, r) => [b[0] + n.x * k + d.x * r, b[1] + n.y * k + d.y * r, b[2] + n.z * k + d.z * r];
   add(new THREE.CylinderGeometry(.034, .036, .01, Q(20, 10)), M.metalDk, BI.head, b, null, null, q);
   add(new THREE.TorusGeometry(.034, .0045, Q(6, 4), Q(24, 12)), M.gold, BI.head, at(.005, n, 0), null, null, new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n));
   add(new THREE.SphereGeometry(.012, Q(10, 6), Q(8, 5)), M.gold, BI.head, at(.006, n, 0), null, [1, .55, 1], q);
   const e1 = new THREE.Vector3(0, 1, 0).addScaledVector(n, -n.y).normalize(), e2 = new THREE.Vector3().crossVectors(n, e1);
   for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, d = e1.clone().multiplyScalar(Math.cos(a)).addScaledVector(e2, Math.sin(a)), L = k % 2 ? .011 : .018; add(new THREE.ConeGeometry(.0042, L, 4), M.gold, BI.head, at(.0065, d, .013 + L / 2), null, null, new THREE.Quaternion().setFromUnitVectors(YA, d)); }
  }
 }
 // ---------- feather crest: a tall mohawk of kingfisher-teal, grey-white and charcoal feathers over white down, on six springs ----------
 // a feather card from the atlas, quill at `at`, turned by q; the tip bends back by `bend` and the vane cups
 function feather(L, W, cell, q, at, bend, cup) {
  const g = new THREE.PlaneGeometry(W, L, 2, 4); g.translate(0, L / 2, 0);
  const uv = g.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, (cell % 4 + uv.getX(k)) / 4, (cell < 4 ? .5 : 0) + uv.getY(k) * .5);
  const p = g.attributes.position, bd = bend === undefined ? .32 : bend; for (let k = 0; k < p.count; k++) { const y = p.getY(k), x = p.getX(k); p.setZ(k, -bd * (y / L) ** 2 * L + (cup === undefined ? 1.6 : cup) * x * x / W); }
  g.computeVertexNormals(); g.applyMatrix4(_m4.makeRotationFromQuaternion(q)); g.translate(at[0], at[1], at[2]); return g;
 }
 const qE = (x, y, z) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z, 'ZXY'));
 for (let i = 0; i < 6; i++) {
  const c = CRP[i], dir = new THREE.Vector3(c[3], c[4], c[5]).normalize(), gs = [], qd = new THREE.Quaternion().setFromUnitVectors(YA, dir);
  const N = Q(15, 8);
  for (let f = 0; f < N; f++) {
   const L = .22 + .07 * rnd() + i * .025, W = .1 + .035 * rnd(), cell = [0, 1, 0, 2, 0, 1, 0][(f + i * 3) % 7];
   const spread = (f / (N - 1) - .5) * (1.25 - .12 * i) + (rnd() - .5) * .2, tilt = (rnd() - .5) * .35, tw = (f % 2 ? PI / 2 : 0) + (rnd() - .5) * .8;
   gs.push(feather(L, W, cell, qd.clone().multiply(qE(tilt, tw, spread)), c));
  }
  for (let f = 0; f < 4; f++) gs.push(feather(.1 + .04 * rnd(), .07 + .02 * rnd(), 3, qd.clone().multiply(qE((rnd() - .5) * .6, rnd() * PI, (f - 1.5) * .55)), c));
  add(mergeGeos(gs), M.feather, BI['crest' + i]);
 }
 // ---------- the braid: three thick white strands down her back to a gold cuff, and a loose tuft below the belts ----------
 {
  const cv = new THREE.CatmullRomCurve3(BRP.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
  const NS = 78, T = new THREE.Vector3(), N = new THREE.Vector3(1, 0, 0), B = new THREE.Vector3(), C = new THREE.Vector3(), st = [[], [], []];
  for (let i = 0; i <= NS; i++) {
   const t = i / NS; cv.getPointAt(t, C); cv.getTangentAt(t, T);
   N.addScaledVector(T, -N.dot(T)).normalize(); B.crossVectors(T, N);
   const tap = (1 - .3 * t) * sm(-.02, .1, t), w = t * 12 * PI;
   for (let k = 0; k < 3; k++) { const ph = w + k * TAU / 3, a = Math.sin(ph) * .025 * tap, b = Math.sin(2 * ph) * .009 * tap; st[k].push([C.x + N.x * a + B.x * b, C.y + N.y * a + B.y * b, C.z + N.z * a + B.z * b]); }
  }
  const wB = wChain(BRP.slice(0, 6).map((_, i) => 'braid' + i), BRP, 'head', .9);
  for (const s of st) { const g = tube(s, Q(120, 60), Q(8, 5), (t) => .021 - .006 * t, 1, null); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * 4); add(g, M.hair, wB); }
  const e = BRP[6], d = [BRP[6][0] - BRP[5][0], BRP[6][1] - BRP[5][1], BRP[6][2] - BRP[5][2]];
  const at = (k) => [e[0] + d[0] * k, e[1] + d[1] * k, e[2] + d[2] * k], qR = qY(d).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(PI / 2, 0, 0)));
  add(new THREE.CylinderGeometry(.027, .024, .048, Q(14, 7)), M.gold, BI.braid5, at(-.12), null, null, qY(d));
  for (const k of [-.42, .2]) add(new THREE.TorusGeometry(.025, .0035, Q(5, 4), Q(16, 8)), M.gold, BI.braid5, at(k), null, null, qR);
  { const g = new THREE.ConeGeometry(.026, .17, Q(12, 6), 1, true); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getY(i), uv.getX(i) * 3); add(g, M.hair, BI.braid5, at(.62), null, null, qY([-d[0], -d[1], -d[2]])); }
 }

 // ---------- armour shell profile: y, half-width, front depth, back depth ----------
 const TPA = [[1.515, .062, .056, .062], [1.49, .094, .077, .083], [1.462, .138, .096, .101], [1.43, .168, .11, .112], [1.378, .18, .124, .118], [1.315, .178, .128, .116], [1.252, .17, .12, .11], [1.19, .16, .112, .106], [1.128, .151, .107, .103], [1.065, .148, .106, .105], [1.013, .158, .112, .117], [.96, .17, .116, .127], [.908, .168, .112, .125], [.877, .146, .1, .107], [.856, .07, .056, .056]];
 const bust = (x, y) => .017 * Math.exp(-(((Math.abs(x) - .068) / .05) ** 2) - ((y - 1.3) / .055) ** 2);
 const ridgeZ = (x, y) => .008 * Math.exp(-((x / .012) ** 2)) * sm(1.08, 1.2, y) * sm(1.47, 1.38, y);
 function armorPt(a, y, off, o) {
  const rx = crv(TPA, 1, y), rf = crv(TPA, 2, y), rb = crv(TPA, 3, y), c = Math.cos(a), s = Math.sin(a), rz = c > 0 ? rf : rb;
  const x = s * rx; let z = c * rz; if (c > 0) z += (bust(x, y) + ridgeZ(x, y)) * c;
  const nx = s / rx, nz = c / rz, L = Math.hypot(nx, nz) || 1;
  o[0] = x + nx / L * off; o[1] = y; o[2] = z + nz / L * off; return o;
 }
 const loop = (fn, n) => { const p = []; for (let i = 0; i <= n; i++) p.push(fn(lerp(-PI, PI, i / n), [0, 0, 0])); return p; };
 const trim = (pts, w, r) => add(tube(pts, Q(pts.length * 2, pts.length), Q(5, 4), () => r || .0035, 1, null), M.gold, w);

 // ---------- cuirass (gold-edged plates), the teal tabard over it, gorget, faulds, belts, mail ----------
 add(slab(Q(72, 36), Q(32, 16), (u, v, o) => armorPt(lerp(-PI, PI, u), lerp(1.462, 1.068, v), 0, o), .006), M.cuir, wTorso);
 trim(loop((a, o) => armorPt(a, 1.462, .006, o), 48), wTorso, .0045);
 trim(loop((a, o) => armorPt(a, 1.068, .007, o), 48), wTorso, .005);
 // the tabard over the breastplate, front and back, just proud of the plate; the front carries her clawed-out sun
 for (const [r, y0, a0] of [[TA.cf, 1.456, 0], [TA.cb, 1.43, PI]]) {
  const g = surf(Q(24, 12), Q(20, 10), (u, v, o) => { const y = lerp(y0, 1.07, v), w = a0 ? .56 : lerp(.58, .72, sm(1.455, 1.33, y)) - .03 * sm(1.25, 1.08, y); return armorPt(a0 + lerp(-w, w, u), y, .0105, o); });
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (r[0] + uv.getX(i) * r[2]) / 1024, 1 - (r[1] + (1 - uv.getY(i)) * r[3]) / 1024);
  add(g, M.tabard, wTorso);
 }
 for (const [y0, y1, r0, r1] of [[1.465, 1.5, .1, .084], [1.493, 1.528, .086, .072], [1.52, 1.556, .074, .066]]) {
  add(slab(Q(32, 16), 3, (u, v, o) => { const a = lerp(-PI, PI, u), r = lerp(r0, r1, v); o[0] = Math.sin(a) * r * 1.06; o[1] = lerp(y0, y1, v); o[2] = Math.cos(a) * r * .94 - .006; return o; }, .004), M.metal, wNeck);
  trim(loop((a, o) => { o[0] = Math.sin(a) * r1 * 1.07; o[1] = y1; o[2] = Math.cos(a) * r1 * .95 - .006; return o; }, 32), wNeck, .003);
 }
 // faulds over each hip, clear of the front and back panels
 for (let i = 0; i < 3; i++) for (const sd of [-1, 1]) {
  const y0 = 1.075 - i * .036, y1 = y0 - .048, off = .006 + i * .006, A = (u) => (sd < 0 ? lerp(-2.4, -.5, u) : lerp(.5, 2.4, u));
  add(slab(Q(24, 12), 3, (u, v, o) => armorPt(A(u), lerp(y0, y1, v), off + .004 * v, o), .004), M.metal, wTorso);
  const e = []; for (let k = 0; k <= 20; k++) e.push(armorPt(A(k / 20), y1, off + .008, [0, 0, 0])); trim(e, wTorso, .003);
 }
 // three leather belts: a broad one with a square gold buckle, one with a gold ring and a hanging strap, one slung across the hips
 for (const [yc, tilt, ab, hw, off, kind] of [[1.094, 0, 0, .024, .016, 0], [1.046, .018, .04, .019, .026, 1], [.997, -.03, -.66, .019, .034, 2]]) {
  add(slab(Q(48, 24), 2, (u, v, o) => { const a = lerp(-PI, PI, u), y = yc + tilt * Math.sin(a) + lerp(hw, -hw, v); return armorPt(a, y, off, o); }, .006), M.leather, wTorso);
  const p = armorPt(ab, yc + tilt * Math.sin(ab), off + .008, [0, 0, 0]), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ab, 0)), at = (x, y, z) => [p[0] + Math.cos(ab) * x + Math.sin(ab) * z, p[1] + y, p[2] - Math.sin(ab) * x + Math.cos(ab) * z];
  if (kind === 1) {
   add(new THREE.TorusGeometry(.021, .0045, Q(6, 4), Q(18, 9)), M.gold, wTorso, at(0, -.004, .002), null, null, q);
   add(new THREE.BoxGeometry(.03, .15, .006), M.leather, wTorso, at(0, -.09, .006), null, null, q);
   add(new THREE.BoxGeometry(.034, .012, .008), M.gold, wTorso, at(0, -.155, .007), null, null, q);
  } else {
   add(new THREE.BoxGeometry(kind ? .05 : .066, kind ? .044 : .06, .009), M.gold, wTorso, p, null, null, q);
   add(new THREE.BoxGeometry(kind ? .03 : .042, kind ? .024 : .034, .011), M.metalDk, wTorso, at(0, 0, .003), null, null, q);
   add(new THREE.BoxGeometry(.03, .1, .006), M.leather, wTorso, at(.04, -.06, -.004), null, null, q.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, .12))));
  }
 }
 const wSkirt = (x, y) => { const k = .7 * sm(.96, .7, y), sL = sm(-.05, .05, x); return [[BI.pelvis, 1 - k], [BI['hip-1'], k * (1 - sL)], [BI['hip1'], k * sL]]; };
 add(surf(Q(56, 28), Q(12, 6), (u, v, o) => { const a = lerp(-PI, PI, u), y = lerp(1.0, .62 + .03 * Math.cos(a), v); armorPt(a, Math.max(y, .9), .002 + .02 * v * v, o); o[1] = y; return o; }, true), M.mail, wSkirt);

 // ---------- the skirt: a teal front panel to the knee, a dark back panel to the ankle with its gold sun-wheel, and three tiers
 // of ragged feather strips in charcoal, teal and grey-white, flaring round the sides and back to the shins ----------
 const tabCol = (a) => {
  if (a < TBA[0]) a += TAU;
  for (let j = 0; j < TBN - 1; j++) if (a <= TBA[j + 1]) return [j, j + 1, cl((a - TBA[j]) / (TBA[j + 1] - TBA[j]), 0, 1)];
  return [TBN - 1, 0, cl((a - TBA[TBN - 1]) / (TBA[0] + TAU - TBA[TBN - 1]), 0, 1)];
 };
 const wCol = (j0, j1, t, y) => { const hv = sm(.8, .55, y), top = sm(1.04, .96, y); return [[BI.pelvis, 1 - top], [BI['tabU' + j0], (1 - t) * top * (1 - hv)], [BI['tabL' + j0], (1 - t) * top * hv], [BI['tabU' + j1], t * top * (1 - hv)], [BI['tabL' + j1], t * top * hv]]; };
 const wTab = (x, y, z) => { const [j0, j1, t] = tabCol(Math.atan2(x, z)); return wCol(j0, j1, t, y); };
 // the two panels hang flat from under the belts, each on its own pair of columns
 for (const [r, sd, y1, w0, w1, j0, j1] of [[TA.f, 1, .44, .15, .168, 4, 5], [TA.b, -1, .1, .17, .2, 0, 9]]) {
  const g = surf(Q(12, 6), Q(18, 9), (u, v, o) => {
   const y = lerp(sd > 0 ? 1.04 : 1.02, y1, v), s = lerp(-1, 1, u), bow = .012 * (1 - s * s);
   o[0] = s * lerp(w0, w1, v) * sd; o[1] = y; o[2] = sd > 0 ? .133 + .065 * sm(1.0, .45, y) + bow : -(.135 + .16 * Math.max(0, 1.0 - y) + bow); return o;
  });
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (r[0] + uv.getX(i) * r[2]) / 1024, 1 - (r[1] + (1 - uv.getY(i)) * r[3]) / 1024);
  add(g, M.tabard, (x, y) => wCol(j0, j1, sm(-.1, .1, x), y));
 }
 // a quaternion turning +Y along y and +Z toward z, for cards hung along a direction
 const _bX = new THREE.Vector3(), _bY = new THREE.Vector3(), _bZ = new THREE.Vector3(), _bM = new THREE.Matrix4();
 const qBasis = (y, z) => { _bY.set(y[0], y[1], y[2]).normalize(); _bZ.set(z[0], z[1], z[2]).addScaledVector(_bY, -_bZ.dot(_bY)).normalize(); _bX.crossVectors(_bY, _bZ); return new THREE.Quaternion().setFromRotationMatrix(_bM.makeBasis(_bX, _bY, _bZ)); };
 // tiers, long under-layer first: atlas cells, top height, length at the sides and toward the back, outward offset, splay.
 // They stop at the back panel, which covers the middle of her back.
 for (const [cells, y0, Ls, Lb, off, sp] of [[[4, 7, 4, 6, 7, 4, 5, 7], .965, .64, .86, 0, .03], [[7, 4, 6, 5, 4, 7], .98, .56, .72, .011, .05], [[5, 4, 2, 5, 4, 7, 2], .995, .46, .56, .022, .08], [[4, 2, 4, 5, 2, 4], 1.03, .28, .33, .042, .1]]) {
  const gs = []; let n = 0;
  for (let a = .9; a < 2.56; a += .062) for (const sd of [-1, 1]) {
   const aa = sd * (a + (rnd() - .5) * .05), L = lerp(Ls, Lb, sm(.9, 2.8, Math.abs(aa))) * (.86 + .28 * rnd()), yt = y0 - .14 * (1 - sm(1.05, 1.45, Math.abs(aa))), P0 = skirtP(aa, yt, off), P1 = skirtP(aa, yt - L * .97, off + sp);
   const tw = (n % 2 ? 1 : -1) * (.45 + .6 * rnd()) * sm(2.9, 2.2, Math.abs(aa)) + (rnd() - .5) * .4;
   gs.push(feather(L, .095 + .035 * rnd(), cells[n++ % cells.length], qBasis([P1[0] - P0[0], P1[1] - P0[1], P1[2] - P0[2]], [-P0[0], 0, -P0[2]]).multiply(qE(0, tw, (rnd() - .5) * .16)), P0, .2, .45));
  }
  add(mergeGeos(gs), M.feather, wTab);
 }
 // ---------- mantle: feathers hanging from under each pauldron down the back of the shoulder and under the arm, on its own spring ----------
 for (const sd of [-1, 1]) {
  const C = [sd * .205, 1.43, -.012], S = BI['shoulder' + sd], Mb = BI['mant' + sd], gs = [];
  for (let k = 0; k < 9; k++) {
   const ph = lerp(2.0, 4.5, k / 8) + (rnd() - .5) * .15, out = [sd * Math.sin(ph), 0, Math.cos(ph)], P0 = [C[0] + out[0] * .095, C[1] + (rnd() - .5) * .02, C[2] + out[2] * .1];
   gs.push(feather(.2 + .08 * rnd(), .065 + .02 * rnd(), [0, 2, 5, 0, 1, 2, 0, 5, 2][k], qBasis([out[0] * .3, -1, out[2] * .3], [-out[0], 0, -out[2]]).multiply(qE(0, (rnd() - .5) * .6, 0)), P0, .14));
  }
  add(mergeGeos(gs), M.feather, (x, y) => { const k = sm(1.4, 1.25, y); return [[S, (1 - k) * .7], [BI.chest, (1 - k) * .3], [Mb, k]]; });
 }

 // ---------- pauldrons (an upswept cap over three broad pointed lames), arms and gauntlets ----------
 for (const sd of [-1, 1]) {
  const S = BI['shoulder' + sd], C = new THREE.Vector3(sd * .205, 1.458, -.012), A = new THREE.Vector3(sd * .32, .95, 0).normalize(), E1 = new THREE.Vector3(0, 0, 1), D = new THREE.Vector3(sd * .95, -.32, 0);
  const wCap = () => [[S, .62], [BI.chest, .38]];
  const cPt = (R, th, ph, o) => { const sT = Math.sin(th), d = _v.copy(A).multiplyScalar(Math.cos(th)).addScaledVector(E1, sT * Math.cos(ph)).addScaledVector(D, sT * Math.sin(ph)); o[0] = C.x + d.x * R; o[1] = C.y + d.y * R; o[2] = C.z + d.z * R * 1.1; return o; };
  const capR = (v, ph) => .119 + .004 * Math.sin(PI * v) + (.012 + .014 * Math.exp(-(((ph - PI / 2) / .6) ** 2))) * sm(.74, 1, v);
  add(slab(Q(24, 12), Q(10, 5), (u, v, o) => { const ph = lerp(-.9, PI + .9, u); return cPt(capR(v, ph), lerp(0, 1.42, v), ph, o); }, .006), M.metal, wCap);
  { const e = []; for (let i = 0; i <= 24; i++) { const ph = lerp(-.9, PI + .9, i / 24); e.push(cPt(capR(1, ph) + .004, 1.42, ph, [0, 0, 0])); } trim(e, wCap, .0045); }

  const tipK = (ph) => Math.exp(-(((ph - PI / 2) / .55) ** 2));
  const bandPt = (r, y0, y1, ph, v, o) => { const k = tipK(ph) * v * v; o[0] = C.x + sd * Math.sin(ph) * (r + .024 * k); o[1] = lerp(y0, y1, v) - .042 * k; o[2] = C.z + Math.cos(ph) * (r + .006 * k) * 1.06; return o; };
  for (const [y0, y1, r0] of [[1.446, 1.358, .09], [1.39, 1.298, .096], [1.332, 1.238, .102]]) {
   add(slab(Q(20, 10), Q(5, 3), (u, v, o) => bandPt(r0 + .014 * v, y0, y1, lerp(-.75, PI + .75, u), v, o), .005), M.metal, wArm);
   const e = []; for (let i = 0; i <= 20; i++) e.push(bandPt(r0 + .018, y0, y1, lerp(-.75, PI + .75, i / 20), 1, [0, 0, 0])); trim(e, wArm, .0036);
  }
  // sun boss on the cap, and an upright fin toward the neck
  const md = cPt(.119, .62, PI / 2, [0, 0, 0]), nq = new THREE.Quaternion().setFromUnitVectors(YA, _v2.set(md[0] - C.x, md[1] - C.y, md[2] - C.z).normalize());
  add(new THREE.CylinderGeometry(.026, .029, .008, Q(16, 8)), M.gold, wCap, md, null, null, nq);
  for (let r = 0; r < 8; r++) { const a = r / 8 * TAU, d = new THREE.Vector3(Math.cos(a), 0, Math.sin(a)).applyQuaternion(nq); add(new THREE.ConeGeometry(.006, .024, 4), M.gold, wCap, [md[0] + d.x * .037, md[1] + d.y * .037, md[2] + d.z * .037], null, null, new THREE.Quaternion().setFromUnitVectors(YA, d)); }
  const fd = [sd * .5, .86, 0], fb = cPt(.112, .2, PI / 2, [0, 0, 0]);
  add(new THREE.ConeGeometry(.03, .08, Q(8, 4)), M.metal, wCap, [fb[0] + fd[0] * .034, fb[1] + fd[1] * .034, fb[2]], null, [.45, 1, 1.9], qY(fd));
  add(new THREE.ConeGeometry(.012, .032, Q(6, 4)), M.gold, wCap, [fb[0] + fd[0] * .076, fb[1] + fd[1] * .076, fb[2]], null, [.5, 1, 1.9], qY(fd));
  // mail sleeve showing below the pauldron, pointed couter with its fan, vambrace
  const ax = sd * .205, az = -.012, ring = (y, r, w, rr) => trim(loop((a, o) => { o[0] = ax + Math.sin(a) * r; o[1] = y; o[2] = az + Math.cos(a) * r; return o; }, 20), w, rr || .003);
  add(lathe([[.053, 1.4], [.052, 1.2], [.047, 1.1], [.04, .92]], Q(16, 8), { cx: ax, cz: az, sub: 3 }), M.mail, wArm);
  const wE = () => [[S, .45], [BI['elbow' + sd], .55]];
  add(new THREE.SphereGeometry(1, Q(16, 8), Q(12, 6)), M.metal, wE, [ax, 1.157, az - .022], null, [.054, .058, .054]);
  add(new THREE.ConeGeometry(.026, .07, Q(8, 4)), M.metal, wE, [ax, 1.15, az - .085], [-PI / 2 - .25, 0, 0], [.8, 1, 1]);
  add(new THREE.CylinderGeometry(.048, .048, .006, Q(16, 8)), M.metal, wE, [ax + sd * .046, 1.157, az - .01], [0, 0, PI / 2], [1, 1, 1.25]);
  add(new THREE.TorusGeometry(.048, .0034, Q(4, 3), Q(18, 9)), M.gold, wE, [ax + sd * .05, 1.157, az - .01], [0, PI / 2, 0], [1.25, 1, 1]);
  add(lathe([[.05, 1.13], [.05, 1.05], [.045, .97], [.042, .925]], Q(18, 10), { cx: ax, cz: az, sub: 3 }), M.metal, wArm);
  ring(1.128, .051, wArm); ring(.99, .048, wArm, .0024);
  // gauntlet: flared cuff, back plates, dark leather palm, articulated fingers and thumb
  const Wr = BI['wrist' + sd], th = thumb[sd < 0 ? 0 : 1];
  add(lathe([[.044, .95], [.049, .915], [.058, .872]], Q(16, 8), { cx: ax, cz: az, sub: 2 }), M.metal, (x, y) => { const t = sm(.93, .9, y); return [[BI['elbow' + sd], 1 - t], [Wr, t]]; });
  ring(.872, .059, Wr, .0032);
  const hx = ax - sd * .004;
  add(new THREE.BoxGeometry(.03, .094, .082), M.grip, Wr, [hx, .845, az + .002], null, null);
  for (let i = 0; i < 3; i++) add(new THREE.BoxGeometry(.009, .03, .088), M.metal, Wr, [hx + sd * .017, .875 - i * .03, az + .002], [0, 0, sd * .06]);
  for (const [y, L, i] of [[.796, .048, 0], [.748, .032, 1], [.716, .03, 2]]) {
   const b = BI['fing' + (i + 1) + sd];
   add(new THREE.BoxGeometry(.025, L, .078), M.grip, b, [hx, y - L / 2, az + .002]);
   add(new THREE.BoxGeometry(.009, L * .9, .082), M.metal, b, [hx + sd * .014, y - L / 2, az + .002]);
  }
  const t1 = bw(th[0]), t2 = bw(th[1]), tdir = [t2[0] - t1[0], t2[1] - t1[1], t2[2] - t1[2]];
  add(new THREE.BoxGeometry(.024, .042, .026), M.grip, BI['thumb1' + sd], [t1[0] + tdir[0] * .5, t1[1] + tdir[1] * .5, t1[2] + tdir[2] * .5], null, null, qY(tdir));
  add(new THREE.BoxGeometry(.022, .036, .024), M.metal, BI['thumb2' + sd], [t2[0] + tdir[0] * .45, t2[1] + tdir[1] * .45, t2[2] + tdir[2] * .45], null, null, qY(tdir));
 }

 // ---------- legs: tassets, ridged cuisses, pointed knee cops, greaves, heeled sabatons ----------
 for (const sd of [-1, 1]) {
  const lx = sd * .1, H = BI['hip' + sd];
  const wT = (x, y) => { const k = .55 * sm(.95, .82, y); return [[BI.pelvis, 1 - k], [H, k]]; };
  const ring = (y, r, cz, rr) => trim(loop((a, o) => { o[0] = lx + Math.sin(a) * r; o[1] = y; o[2] = cz + Math.cos(a) * r * 1.06; return o; }, 20), wLeg, rr || .003);
  for (let r = 0; r < 2; r++) {
   const y0 = .975 - r * .075, L = .105;
   add(slab(Q(8, 5), Q(5, 4), (u, v, o) => { const a = sd * lerp(.62, 1.45, u), y = y0 - v * L * (1 + .25 * Math.sin(PI * u)); armorPt(a, Math.max(y, .9), .032 + .03 * v + r * .012, o); o[1] = y; return o; }, .005), M.metal, wT);
   const e = []; for (let i = 0; i <= 8; i++) { const u = i / 8, a = sd * lerp(.62, 1.45, u), o = armorPt(a, .9, .066 + r * .012, [0, 0, 0]); o[1] = y0 - L * (1 + .25 * Math.sin(PI * u)); e.push(o); } trim(e, wT, .003);
  }
  add(lathe([[.086, .9], [.084, .78], [.074, .66], [.064, .565]], Q(20, 10), { cx: lx, cz: .004, sub: 3, sz: 1.06 }), M.metal, wLeg);
  ring(.585, .067, .004);
  { const p = []; for (let i = 0; i <= 6; i++) { const y = lerp(.87, .6, i / 6); p.push([lx, y, .004 + (crv([[.9, .086], [.78, .084], [.66, .074], [.565, .064]], 1, y) + .004) * 1.06]); } trim(p, wLeg, .003); }
  add(lathe([[.058, .6], [.056, .48]], Q(14, 8), { cx: lx, cz: .004 }), M.mail, wLeg);
  add(new THREE.SphereGeometry(1, Q(16, 8), Q(12, 6)), M.metal, wLeg, [lx, .52, .04], null, [.058, .064, .048]);
  for (const k of [[.55, 1.9, .3], [1.9, .55, .3]]) add(new THREE.OctahedronGeometry(.016, 0), M.gold, wLeg, [lx, .525, .088], null, k);
  add(new THREE.ConeGeometry(.03, .075, Q(8, 4)), M.metal, wLeg, [lx, .575, .07], [.42, 0, 0], [1, 1, .55]);
  add(new THREE.CylinderGeometry(.044, .044, .006, Q(16, 8)), M.metal, wLeg, [lx + sd * .056, .52, .018], [0, 0, PI / 2], [1, 1, 1.2]);
  add(new THREE.TorusGeometry(.044, .0034, Q(4, 3), Q(18, 9)), M.gold, wLeg, [lx + sd * .06, .52, .018], [0, PI / 2, 0], [1.2, 1, 1]);
  add(new THREE.TorusGeometry(.05, .0032, Q(4, 3), Q(18, 9), PI), M.gold, wLeg, [lx, .5, .034], [-.2, 0, PI], [1.1, 1, 1]);
  const GR = [[.475, .06], [.37, .07], [.25, .062], [.15, .052], [.105, .056]];
  add(lathe(GR.map((p) => [p[1], p[0]]), Q(20, 10), { cx: lx, cz: .0, sub: 3, sz: 1.1 }), M.metal, wLeg);
  ring(.472, .062, 0); ring(.125, .056, 0, .0034);
  { const p = []; for (let i = 0; i <= 6; i++) { const y = lerp(.46, .14, i / 6); p.push([lx, y, (crv(GR, 1, y) + .004) * 1.1]); } trim(p, wLeg, .003); }
  // sabaton: overlapping lames, a pointed toe, a low heel and a dark sole
  const fz0 = -.07, fz1 = .215;
  add(surf(Q(18, 9), Q(18, 9), (u, v, o) => { const a = lerp(-PI, PI, u), z = lerp(fz0, fz1, v), w = .052 * (1 - .55 * sm(.5, 1, v)) * Math.sqrt(Math.max(.04, Math.sin(PI * Math.min(1, v * 1.12 + .05)))), hh = lerp(.13, .034, sm(.12, .95, v)); o[0] = lx + Math.sin(a) * w; o[1] = Math.max(.014, .014 + hh * .5 + Math.cos(a) * hh * .5); o[2] = z; return o; }, true), M.metal, wFoot);
  for (let i = 0; i < 4; i++) { const z = .02 + i * .042, hh = lerp(.11, .05, i / 3); add(new THREE.TorusGeometry(.051 - i * .005, .003, Q(4, 3), Q(14, 7), PI), M.gold, wFoot, [lx, .014, z], [0, 0, 0], [1, hh / (.051 - i * .005), 1]); }
  add(new THREE.BoxGeometry(.086, .014, .255), M.metalDk, wFoot, [lx, .007, .07]);
  add(new THREE.BoxGeometry(.07, .034, .062), M.metalDk, wFoot, [lx, .017, -.036]);
 }

 // ---------- the gloamsteel greatsword: built along +Y, flats facing X, edges toward Z, then put in her right fist ----------
 const GRIP = new THREE.Matrix4().compose(new THREE.Vector3(.032, -.086, .02), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), PI / 2), new THREE.Vector3(1, 1, 1));
 const SWB = new THREE.Matrix4().multiplyMatrices(wrists[0].matrixWorld, GRIP);
 const swAdd = (geo, mat, p, r, s, q) => { let g = place(geo, p, r, s, q); if (g === geo) g = geo.clone(); g.applyMatrix4(SWB); add(g, mat, BI['wrist-1']); };
 const BL0 = .1, BL1 = 1.4;
 const bw2 = (y) => lerp(.058, .043, sm(BL0, 1.12, y)) * Math.sqrt(Math.max(0, 1 - sm(1.12, BL1, y) ** 1.25)) + .0004;
 const bth = (y) => lerp(.0095, .0055, sm(BL0, BL1, y)) * (1 - .6 * sm(1.2, BL1, y));
 for (const sd of [-1, 1]) {
  // black glass with a shallow fuller; the texture carries the cold blue edge
  swAdd(surf(Q(10, 6), Q(44, 22), (u, v, o) => { const y = lerp(BL0, BL1, v), zn = lerp(-1, 1, u), az = Math.abs(zn); o[0] = sd * bth(y) * ((1 - Math.pow(az, 1.2)) - .3 * Math.exp(-((zn / .28) ** 2)) * sm(1.25, 1.0, y)); o[1] = y; o[2] = zn * bw2(y); return o; }, false, sd < 0), M.edge);
  const pts = []; for (let i = 0; i <= 26; i++) { const y = lerp(.2, 1.28, i / 26); pts.push([sd * (bth(y) * .72 + .0006), y, (i % 2 ? 1 : -1) * .005 * (.5 + rnd()) + .004 * Math.sin(y * 9)]); }
  swAdd(tube(pts, Q(52, 26), 3, () => .0024, .2, (c, n) => n.set(sd, 0, 0)), M.crack);
 }
 // the crossguard: a blackened sun-wheel ringed and spoked in gold with short gold rays, and blackened quillons edged in gold
 // that end in spikes; a gold langet on each flat where the blade begins
 swAdd(new THREE.TorusGeometry(.05, .0065, Q(6, 4), Q(28, 14)), M.gold, [0, .07, 0], [0, PI / 2, 0]);
 swAdd(new THREE.CylinderGeometry(.046, .046, .022, Q(20, 10)), M.metalDk, [0, .07, 0], [0, 0, PI / 2]);
 swAdd(new THREE.SphereGeometry(.015, Q(12, 6), Q(8, 5)), M.gold, [0, .07, 0], null, [1.6, 1, 1]);
 for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; swAdd(new THREE.BoxGeometry(.026, .005, .036), M.gold, [0, .07 + Math.sin(a) * .03, Math.cos(a) * .03], [-a, 0, 0]); }
 for (let k = 0; k < 12; k++) {
  const a = (k + .5) / 12 * TAU, dy = Math.sin(a), dz = Math.cos(a), L = k % 2 ? .016 : .026;
  swAdd(new THREE.ConeGeometry(.0055, L, 4), M.gold, [0, .07 + dy * (.055 + L / 2), dz * (.055 + L / 2)], null, null, new THREE.Quaternion().setFromUnitVectors(YA, new THREE.Vector3(0, dy, dz)));
 }
 for (const s of [-1, 1]) {
  swAdd(new THREE.BoxGeometry(.02, .024, .12), M.metalDk, [0, .07, s * .115]);
  for (const e of [-1, 1]) swAdd(new THREE.BoxGeometry(.022, .004, .12), M.gold, [0, .07 + e * .012, s * .115]);
  swAdd(new THREE.SphereGeometry(.016, Q(8, 5), Q(6, 4)), M.gold, [0, .07, s * .178], null, [.9, 1.1, .7]);
  swAdd(new THREE.ConeGeometry(.017, .075, Q(8, 4)), M.metalDk, [0, .07, s * .222], [s * PI / 2, 0, 0], [.7, 1, 1]);
  swAdd(new THREE.BoxGeometry(.004, .032, .05), M.gold, [s * .011, .1, 0]);
 }
 // long two-hand grip wrapped in black leather, gold collars, a blackened spiked pommel
 swAdd(lathe([[.0175, .055], [.0185, .0], [.019, -.12], [.018, -.24]], Q(14, 8), { sub: 4 }), M.grip);
 for (let k = 0; k < 9; k++) swAdd(new THREE.TorusGeometry(.019, .0022, Q(4, 3), Q(12, 6)), M.grip, [0, .03 - k * .031, 0], [PI / 2 + .16, 0, 0]);
 for (const y of [.052, -.242]) swAdd(new THREE.TorusGeometry(.019, .0034, Q(5, 4), Q(16, 8)), M.gold, [0, y, 0], [PI / 2, 0, 0]);
 swAdd(new THREE.OctahedronGeometry(.024, 0), M.metalDk, [0, -.27, 0], null, [1, 1.3, 1]);
 swAdd(new THREE.TorusGeometry(.012, .003, Q(5, 4), Q(12, 6)), M.gold, [0, -.3, 0], [PI / 2, 0, 0]);
 swAdd(new THREE.ConeGeometry(.011, .07, Q(8, 4)), M.metalDk, [0, -.336, 0], [PI, 0, 0]);
 const TIP = new THREE.Vector3(0, BL1, 0), MIDB = new THREE.Vector3(0, .78, 0), BASEB = new THREE.Vector3(0, .14, 0), UPB = new THREE.Vector3(0, 1.1, 0);
 const swM = new THREE.Matrix4();
 const swordMatrix = () => swM.multiplyMatrices(wrists[0].matrixWorld, GRIP);

 // ---------- effects in world space (the scene adds fx); she carries no light of her own ----------
 const fx = new THREE.Group(); fx.name = 'HalcyonFX';
 const addB = (map, color, x) => Object.assign({ map, color, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }, x || {});
 const spr = (map, color, order, x) => { const s = new THREE.Sprite(new THREE.SpriteMaterial(addB(map, color, x))); s.renderOrder = order; fx.add(s); return s; };
 const eyeGlow = spr(glowT, 0x9cc8ff, 9), eyeGlow2 = spr(glowT, 0x9cc8ff, 9), edgeA = spr(glowT, 0x80b8ff, 6), edgeB = spr(glowT, 0x80b8ff, 6), crackGlow = spr(glowT, 0xffe2a0, 7);
 const sunDisc = spr(discT, 0x000000, 10, { blending: THREE.NormalBlending }), corona = spr(coronaT, 0xa8d0ff, 11);
 const pool = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshBasicMaterial({ color: 0x04060a, map: tex(softC('rgba(255,255,255,1)', 'rgba(255,255,255,.85)')), transparent: true, opacity: 0, depthWrite: false }));
 pool.rotation.x = -PI / 2; pool.renderOrder = 1; fx.add(pool);
 // the pale moth that rises out of her at the very end: her soul going home
 function mothCanvas() {
  const W = 128, H = 96, c = cvs(W, H), g = c.getContext('2d');
  const wing = (dy, sx, sy, a) => { g.save(); g.translate(4, H / 2 + dy); g.rotate(a); g.scale(sx, sy); const gr = g.createRadialGradient(34, 0, 2, 34, 0, 40); gr.addColorStop(0, 'rgba(255,250,236,1)'); gr.addColorStop(.6, 'rgba(240,232,255,.9)'); gr.addColorStop(1, 'rgba(210,200,255,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(34, 0, 38, 22, 0, 0, TAU); g.fill(); g.restore(); };
  wing(-12, 1.5, 1.1, -.35); wing(14, 1.05, .95, .45);
  g.fillStyle = 'rgba(190,176,236,.8)'; for (const [x, y] of [[70, 30], [52, 64]]) { g.beginPath(); g.arc(x, y, 6, 0, TAU); g.fill(); }
  return c;
 }
 const mothT = tex(mothCanvas());
 const moth = new THREE.Group(); moth.visible = false; fx.add(moth);
 const mothMat = new THREE.MeshBasicMaterial({ map: mothT, color: 0xfff6e6, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
 const wingG = new THREE.PlaneGeometry(.3, .22); wingG.translate(.15, 0, 0);
 const mWingL = new THREE.Mesh(wingG, mothMat), mWingR = new THREE.Mesh(wingG, mothMat); mWingR.scale.x = -1; moth.add(mWingL); moth.add(mWingR);
 const mothGlow = spr(glowT, 0xffe2a8, 12);
 function stepMoth(def, u, t, dt) {
  const on = def === ACTS.die && u > .5;
  moth.visible = on; mothGlow.visible = on;
  if (!on) return;
  const k = sm(.5, 1, u), op = sm(.5, .58, u) * (1 - sm(.92, 1, u));
  chest.updateWorldMatrix(true, false); chest.localToWorld(_p5.set(0, .1, .14));
  moth.position.set(_p5.x + .25 * Math.sin(k * 5.5), _p5.y + 2.6 * k * k + .1 * k, _p5.z + .2 * Math.cos(k * 4.5) * k);
  const flap = .25 + .95 * Math.abs(Math.sin(t * 13));
  mWingL.rotation.y = -flap; mWingR.rotation.y = flap; moth.rotation.set(-.3, root.rotation.y + .4 * Math.sin(t * 1.7), 0);
  mothMat.opacity = op; mothGlow.position.copy(moth.position); mothGlow.scale.setScalar(.7 + .15 * Math.sin(t * 6)); mothGlow.material.opacity = .85 * op;
 }
 // trail: an additive ribbon of the last 14 tip and mid-blade positions
 const TRN = 14, trPos = new Float32Array(TRN * 6), trCol = new Float32Array(TRN * 6), trIdx = [];
 for (let i = 0; i < TRN - 1; i++) { const a = i * 2; trIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
 const trGeo = new THREE.BufferGeometry();
 trGeo.setAttribute('position', new THREE.BufferAttribute(trPos, 3)); trGeo.setAttribute('color', new THREE.BufferAttribute(trCol, 3)); trGeo.setIndex(trIdx);
 const trail = new THREE.Mesh(trGeo, new THREE.MeshBasicMaterial({ vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
 trail.frustumCulled = false; trail.renderOrder = 6; trail.visible = false; fx.add(trail);
 const trTip = [], trMid = []; for (let i = 0; i < TRN; i++) { trTip.push(new THREE.Vector3()); trMid.push(new THREE.Vector3()); }
 // point particles, each with its own size and alpha; sizes are true world sizes in any perspective camera, including a narrow
 // zoomed battle camera. Light adds; the black smoke blends normally, so it darkens whatever is behind it.
 function particles(n, size, map, dark) {
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 4), ps = new Float32Array(n).fill(1), g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 4)); g.setAttribute('psize', new THREE.BufferAttribute(ps, 1));
  const pm = new THREE.PointsMaterial({ size, map: map || glowT, vertexColors: true, transparent: true, depthWrite: false, blending: dark ? THREE.NormalBlending : THREE.AdditiveBlending });
  pm.onBeforeCompile = (s) => { s.vertexShader = 'attribute float psize;\n' + s.vertexShader.replace('gl_PointSize = size;', 'gl_PointSize = size * psize;').replace('gl_PointSize *= ( scale / - mvPosition.z );', 'gl_PointSize *= ( scale * projectionMatrix[1][1] / - mvPosition.z );'); };
  pm.customProgramCacheKey = () => 'halcyon-pts';
  const pts = new THREE.Points(g, pm); pts.frustumCulled = false; pts.renderOrder = dark ? 5 : 8; fx.add(pts);
  return { pts, pos, col, ps, g, n, dark, vel: new Float32Array(n * 3), life: new Float32Array(n), max: new Float32Array(n).fill(1), tg: new Float32Array(n), sz: new Float32Array(n).fill(1), off: new Float32Array(n * 3), next: 0, live: 0 };
 }
 // black diamond flakes: the shards that whirl round Black Noon and tear off the dark as she retreats
 function shardCanvas() { const S = 32, c = cvs(S, S), g = c.getContext('2d'); g.fillStyle = '#07080c'; g.strokeStyle = 'rgba(120,170,255,.9)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(16, 2); g.lineTo(23.5, 16); g.lineTo(16, 30); g.lineTo(8.5, 16); g.closePath(); g.fill(); g.stroke(); return c; }
 const motes = particles(72, .075), sparks = particles(40, .04), smoke = particles(96, .5, smokeT, true), shards = particles(56, .1, tex(shardCanvas()), true);
 const EBLUE = new THREE.Color(0x6aa8ff), EGOLD = new THREE.Color(0xffc458), EGLOW = new THREE.Color(0x80b8ff);
 function emit(P, x, y, z, vx, vy, vz, life, sz) { const i = P.next; P.next = (i + 1) % P.n; P.pos.set([x, y, z], i * 3); P.vel.set([vx, vy, vz], i * 3); P.life[i] = life; P.max[i] = life; P.sz[i] = sz || 1; P.live++; return i; }
 // steps live particles; a system with none alive costs nothing and uploads nothing (each one fades to nothing as it dies)
 function stepP(P, dt, fn, colr) {
  P.pts.visible = P.live > 0;
  if (!P.live) return;
  let live = 0;
  for (let i = 0; i < P.n; i++) {
   const c = i * 4;
   if (P.life[i] <= 0) { P.col[c] = P.col[c + 1] = P.col[c + 2] = P.col[c + 3] = 0; continue; }
   P.life[i] -= dt; const k = Math.max(0, fn(i, dt, 1 - P.life[i] / P.max[i])); live++;
   if (P.dark) { P.col[c] = colr[0]; P.col[c + 1] = colr[1]; P.col[c + 2] = colr[2]; P.col[c + 3] = k; } else { P.col[c] = colr[0] * k; P.col[c + 1] = colr[1] * k; P.col[c + 2] = colr[2] * k; P.col[c + 3] = 1; }
  }
  P.live = live;
  P.g.attributes.position.needsUpdate = true; P.g.attributes.color.needsUpdate = true; if (P.dark) P.g.attributes.psize.needsUpdate = true;
 }

 // ---------- motion: poses are flat objects of channels (Sol's layout, so their stances rhyme) ----------
 // pelvis offset y/x/z and rotations; spine s, chest c, neck n, head h (YXZ euler);
 // feet as IK targets in root space (r/l F x y z, yaw r, pitch p); sword grip g, blade dir d, edge e (root space), elbow poles;
 // left hand: two = on the grip, lik = reach for lt; FK fallback lS/lE/lW; finger curls; face br/bl/mo;
 // effects: eye (the cold blue eyes blaze), drink (light streams), ch (dark sun), crack (warm light in the blade), fade,
 // sw (the dark swallowing her from the feet up as she retreats).
 const D3 = (x, y, z) => { const l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };
 // her ready stance is the Warden's high guard: both hands on the grip beside her head, the point toward her foe
 const READY = {
  y: -.08, x: 0, z: 0, pX: .05, pY: -.25, pZ: 0, sX: .02, sY: .05, sZ: 0, cX: .03, cY: .12, cZ: 0, nX: 0, nY: .04, hX: .03, hY: .08, hZ: 0,
  rFx: -.22, rFy: 0, rFz: -.2, rFr: -.6, rFp: 0, lFx: .19, lFy: 0, lFz: .2, lFr: .2, lFp: 0,
  gx: -.2, gy: 1.62, gz: .1, dx: .2, dy: .62, dz: .76, ex: -.16, ey: .78, ez: -.6,
  rPx: -.9, rPy: -.35, rPz: -.1,
  two: 1, lik: 0, lbl: 0, ltx: .2, lty: .95, ltz: .1, lPx: .2, lPy: -.8, lPz: .5,
  lSX: -.1, lSY: 0, lSZ: .15, lE: -.3, lWX: 0, lWZ: 0,
  fR: 1, fL: 1, br: .75, bl: .2, mo: 0,
  eye: .4, drink: 0, ch: 0, crack: 0, fade: 1, sw: 0
 };
 { const d = D3(READY.dx, READY.dy, READY.dz); READY.dx = d[0]; READY.dy = d[1]; READY.dz = d[2]; }
 const CH = Object.keys(READY).filter((k) => k !== 'mo');
 const cp = (a, b) => { for (const k of CH) a[k] = b[k]; a.mo = b.mo; return a; };
 const mix = (a, b, w) => { if (w <= 0) return a; for (const k of CH) a[k] += (b[k] - a[k]) * w; if (w >= .5) a.mo = b.mo; return a; };
 // guard: the blade held level across the body, both hands on it
 const GUARD = Object.assign({}, READY, {
  y: -.11, pX: .08, pY: -.15, cX: .06, cY: .06, hX: .06, hY: .08,
  rFx: -.19, rFz: -.12, rFr: -.5, lFx: .17, lFz: .18, lFr: .25,
  gx: -.2, gy: 1.4, gz: .26, dx: .96, dy: .22, dz: .14, ex: 0, ey: .6, ez: .8, rPx: -.5, rPy: -.8, rPz: .1,
  lPx: .6, lPy: -.7, lPz: -.1, br: .8, mo: 1, eye: .6
 });
 // the model sheet's A-pose, for turnaround renders (state.pose = 'sheet'): arms out from her sides, feet apart, blade hung down
 const SHEET = Object.assign({}, READY, { y: 0, pX: 0, pY: 0, sX: 0, sY: 0, cX: 0, cY: 0, nY: 0, hX: 0, hY: 0, rFx: -.15, rFz: 0, rFr: -.1, lFx: .15, lFz: 0, lFr: .1, gx: -.4, gy: .96, gz: .04, dx: 0, dy: -1, dz: .02, ex: 0, ey: 0, ez: 1, rPx: -.4, rPy: 0, rPz: -1, two: 0, lSX: 0, lSZ: .4, lE: -.12, fL: .5 });
 function K(u, o, s) {
  const k = Object.assign({}, o || {});
  if (s) { k.gx = s[0]; k.gy = s[1]; k.gz = s[2]; const d = D3(s[3], s[4], s[5]); k.dx = d[0]; k.dy = d[1]; k.dz = d[2]; if (s.length > 6) { k.ex = s[6]; k.ey = s[7]; k.ez = s[8]; } }
  return [u, k];
 }
 const ACTS = {};
 function act(name, dur, keys, o) {
  const t = [], p = []; let prev = READY;
  for (const [u, k] of keys) { const full = Object.assign({}, prev, k); t.push(u); p.push(full); prev = full; }
  ACTS[name] = Object.assign({ dur, t, p, hits: [], hold: false, interrupt: false, bi: .14, bo: .18, dash: null }, o || {});
 }
 // cubic keys; the first and last keys ease in and out of rest
 function evalKeys(def, u, out) {
  const T = def.t, Pk = def.p, n = T.length;
  let i = 0; while (i < n - 2 && u > T[i + 1]) i++;
  const t0 = T[i], t1 = T[i + 1], f = cl((u - t0) / (t1 - t0), 0, 1), ia = Math.max(0, i - 1), id = Math.min(n - 1, i + 2);
  const a = Pk[ia], b = Pk[i], c = Pk[i + 1], d = Pk[id], ta = T[ia], td = T[id], h = t1 - t0;
  const f2 = f * f, f3 = f2 * f, h00 = 2 * f3 - 3 * f2 + 1, h10 = f3 - 2 * f2 + f, h01 = 3 * f2 - 2 * f3, h11 = f3 - f2;
  const e0 = i === 0 ? 0 : 1, e1 = i + 2 >= n ? 0 : 1;
  for (const k of CH) { const m0 = e0 * (c[k] - a[k]) / Math.max(1e-6, t1 - ta) * h, m1 = e1 * (d[k] - b[k]) / Math.max(1e-6, td - t0) * h; out[k] = h00 * b[k] + h10 * m0 + h01 * c[k] + h11 * m1; }
  out.mo = f >= 1 ? c.mo : b.mo;
  return out;
 }

 // ---------- two-bone IK (Sol's) ----------
 const _S = new THREE.Vector3(), _E = new THREE.Vector3(), _Tt = new THREE.Vector3(), _Dd = new THREE.Vector3(), _Pp = new THREE.Vector3(), _B = new THREE.Vector3();
 const _X = new THREE.Vector3(), _Y = new THREE.Vector3(), _Z = new THREE.Vector3(), _mm = new THREE.Matrix4();
 const _qp = new THREE.Quaternion(), _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion();
 const restFix = (b) => new THREE.Quaternion().setFromUnitVectors(b.position.clone().normalize(), new THREE.Vector3(0, -1, 0));
 function ik2(b1, b2, L1, L2, T, pole, back, fix1, fix2) {
  b1.getWorldPosition(_S); b1.parent.getWorldQuaternion(_qp);
  _Dd.subVectors(T, _S); let d = _Dd.length(); _Dd.multiplyScalar(1 / (d || 1));
  d = cl(d, Math.abs(L1 - L2) + .02, L1 + L2 - 1e-4);
  const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d), hh = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  _Pp.copy(pole).addScaledVector(_Dd, -pole.dot(_Dd)); if (_Pp.lengthSq() < 1e-8) _Pp.set(0, 0, back ? 1 : -1); _Pp.normalize();
  _E.copy(_S).addScaledVector(_Dd, a).addScaledVector(_Pp, hh);
  _Tt.copy(_S).addScaledVector(_Dd, d);
  _Y.subVectors(_S, _E).normalize(); _B.subVectors(_Tt, _E).normalize();
  _Z.copy(_B).addScaledVector(_Y, -_B.dot(_Y)); if (_Z.lengthSq() < 1e-6) _Z.copy(_Pp).negate(); _Z.normalize(); if (back) _Z.negate();
  _X.crossVectors(_Y, _Z).normalize(); _Z.crossVectors(_X, _Y);
  _q1.setFromRotationMatrix(_mm.makeBasis(_X, _Y, _Z)); if (fix1) _q1.multiply(fix1);
  _Y.subVectors(_E, _Tt).normalize(); _Z.crossVectors(_X, _Y).normalize();
  _q2.setFromRotationMatrix(_mm.makeBasis(_X, _Y, _Z)); if (fix2) _q2.multiply(fix2);
  b1.quaternion.copy(_qp).invert().multiply(_q1);
  b2.quaternion.copy(_q1).invert().multiply(_q2);
  return _q2;
 }
 const legFix = legs.map((h, i) => [restFix(knees[i]), restFix(ankles[i])]);

 // ---------- actions ----------
 // V: blade in the vertical plane at angle phi from straight up (positive tips it forward), edge leading a forward chop
 // Hs: blade level at heading th (0 forward, + to her left), edge leading a sweep to her left
 const V = (phi, g, lx) => [g[0], g[1], g[2], lx || 0, Math.cos(phi), Math.sin(phi), 0, -Math.sin(phi), Math.cos(phi)];
 const Hs = (th, g, dy) => [g[0], g[1], g[2], Math.sin(th), dy || 0, Math.cos(th), Math.cos(th), 0, -Math.sin(th)];
 const POLE_LOW = { rPx: -.4, rPy: -.8, rPz: .1, lPx: .4, lPy: -.8, lPz: .1 };
 act('gloamCleave', 1.8, [K(0),
  K(.28, { y: -.03, pX: -.12, pY: -.1, cX: -.16, cY: .05, hX: -.06, hY: .05, rFz: -.18, lFz: .2, br: 1, mo: 1, eye: .7, rPx: -.7, rPy: .1, rPz: -.3, lPx: .7, lPy: .1, lPz: -.3 }, V(-1.2, [-.06, 1.86, -.02], -.05)),
  K(.5, { y: -.08, pX: .05, cX: .0, mo: 2 }, V(.6, [-.03, 1.66, .3])),
  K(.6, Object.assign({ y: -.16, pX: .28, pY: -.05, cX: .22, cY: 0, hX: .12, hY: 0, lFz: .34, rFz: -.22 }, POLE_LOW), V(2.05, [.0, 1.02, .5])),
  K(.74, { y: -.17, pX: .3, cX: .24 }, V(2.35, [.02, .86, .46])),
  K(1, READY)], { hits: [.6], trail: [[.42, .68]], dash: (u) => 1.2 * sm(.45, .58, u) * (1 - sm(.6, .72, u)) });
 act('duskArc', 1.8, [K(0),
  K(.3, { y: -.1, pY: -.62, sY: -.12, cY: -.25, cX: .06, hY: .3, rFx: -.22, rFz: -.12, lFx: .2, lFz: .2, br: 1, mo: 1, eye: .7, rPx: -.3, rPy: -.8, rPz: -.4, lPx: .5, lPy: -.8, lPz: -.2 }, Hs(-2.15, [-.34, 1.22, -.08], .08)),
  K(.46, { pY: -.2, cY: -.05, hY: .15, mo: 2 }, Hs(-.75, [-.22, 1.16, .3], .04)),
  K(.55, { y: -.13, pY: .15, sY: .05, cY: .12, hY: .0 }, Hs(.0, [.0, 1.14, .42], .0)),
  K(.68, { pY: .5, sY: .12, cY: .3, hY: -.2 }, Hs(1.05, [.24, 1.18, .2], .02)),
  K(.82, { pY: .45, cY: .28 }, Hs(1.25, [.22, 1.2, .12], .05)),
  K(.92, { pY: .15, cY: .1 }, [.0, 1.3, .28, .35, .72, .6, .36, -.69, .62]),
  K(1, READY)], { hits: [.55], trail: [[.36, .72]], bo: .24 });
 act('severance', 1.6, [K(0),
  K(.3, { y: -.12, pX: .02, pY: -.55, cY: -.25, hY: .4, rFz: -.2, lFz: .2, br: 1, mo: 1, eye: .7, rPx: -.5, rPy: -.7, rPz: -.4, lPx: .5, lPy: -.8, lPz: 0 }, [-.24, 1.06, -.12, .05, .08, 1, 1, 0, 0]),
  K(.5, Object.assign({ y: -.24, pX: .22, pY: -.15, cX: .1, cY: 0, hX: .0, hY: .15, rFz: -.42, rFp: .5, lFz: .52, lFx: .15, mo: 2 }, POLE_LOW), [-.02, 1.24, .72, .02, .02, 1, 1, 0, 0]),
  K(.68, { y: -.23 }, [-.02, 1.23, .7, .02, .0, 1, 1, 0, 0]),
  K(1, READY)], { hits: [.5], trail: [[.38, .58]], dash: (u) => 3.4 * sm(.3, .36, u) * (1 - sm(.48, .56, u)) });
 act('lightDrinker', 2.2, [K(0),
  K(.26, { y: -.06, pY: -.4, cY: -.15, hY: .25, br: 1, mo: 1, eye: .8 }, [-.24, 1.66, .04, -.35, .8, -.48, .0, .5, .86]),
  K(.4, { y: -.14, pX: .15, pY: .2, cY: .15, hY: -.05, mo: 2 }, [.16, 1.08, .36, .62, -.42, .66, .4, -.88, -.25]),
  K(.52, { y: -.06, pX: -.04, pY: -.2, cY: .05, cX: -.12, nX: -.08, hX: -.28, hY: .12, mo: 1, eye: 1, drink: 1, two: 0, lik: 1, ltx: .14, lty: 2.02, ltz: .2, lPx: .7, lPy: -.3, lPz: -.4, fL: .1, rPx: -.7, rPy: -.6, rPz: .1 }, [-.24, 1.3, .2, -.04, 1, .1, 0, -.1, 1]),
  K(.75, { drink: 1, eye: 1, cX: -.14, hX: -.32, lty: 2.05 }, [-.24, 1.32, .2, -.04, 1, .08, 0, -.08, 1]),
  K(.86, { drink: 0, eye: .6, two: 1, lik: 0, fL: 1, nX: 0, hX: .0 }),
  K(1, READY)], { hits: [.4], span: [.4, .75], trail: [[.28, .44]] });
 // Warden's Vow: the counter stance, low and wide, the blade held low across her body, her eyes blazing; held until her next action
 const VOW = Object.assign({}, READY, { y: -.15, pX: .1, pY: -.3, cX: .08, cY: .1, hX: .08, hY: .2, rFx: -.2, rFz: -.18, rFr: -.55, lFx: .16, lFz: .24, lFr: .2, br: 1, bl: .32, mo: 1, eye: 1, rPx: -.5, rPy: -.8, rPz: 0, lPx: .5, lPy: -.85, lPz: 0 });
 Object.assign(VOW, K(0, {}, [-.17, 1.0, .18, .62, -.42, .66, .29, .91, .31])[1]);
 act('vowStance', .8, [K(0), K(.3, { y: -.1, pX: .06, eye: .8, br: .8 }, [-.14, 1.2, .3, .03, .3, .95, 0, -.95, .3]), K(.65, VOW), K(1, VOW)], { hold: true });
 act('counter', .9, [K(0, VOW),
  K(.3, { y: -.2, pX: .15 }, V(2.1, [-.12, .9, .3])),
  K(.45, { y: -.06, pX: -.05, pY: .1, cX: -.1, cY: .15, hX: -.08, mo: 2, eye: 1, lFz: .3 }, V(.42, [.02, 1.52, .36])),
  K(.62, { y: -.04 }, V(-.1, [.05, 1.62, .2])),
  K(1, READY)], { hits: [.45], trail: [[.25, .55]], bi: .12, dash: (u) => 1.5 * sm(.25, .35, u) * (1 - sm(.42, .55, u)) });
 // Black Noon: the blade raised straight up while light bends into a dark sun, then the great cleave
 const NOON = Object.assign({}, READY, { y: -.02, pX: -.04, pY: -.05, sY: 0, cX: -.1, cY: .02, nX: -.06, hX: -.22, hY: .04, rFx: -.15, rFz: -.12, lFx: .14, lFz: .16, br: 1, bl: .1, mo: 1, eye: 1, ch: .6, rPx: -.8, rPy: -.3, rPz: 0, lPx: .8, lPy: -.3, lPz: 0 });
 Object.assign(NOON, K(0, {}, [-.02, 1.98, .08, 0, 1, .02, 0, -.02, 1])[1]);
 act('blackNoonCharge', 1.2, [K(0), K(.7, NOON), K(1, NOON)], { hold: true });
 act('blackNoon', 2.6, [K(0, NOON),
  K(.4, { y: .0, pX: -.14, cX: -.18, hX: -.12, ch: 1, mo: 2 }, V(-.75, [-.02, 2.02, -.05])),
  K(.55, { y: -.08, pX: .05, cX: .0, ch: 1 }, V(.7, [-.01, 1.7, .32])),
  K(.62, Object.assign({ y: -.22, pX: .34, cX: .26, hX: .15, lFz: .36, rFz: -.24, ch: 0, eye: 1 }, POLE_LOW), V(2.15, [.0, .98, .55])),
  K(.78, { y: -.23, pX: .36 }, V(2.4, [.02, .84, .5])),
  K(1, READY)], { hits: [.62], trail: [[.5, .72]], bi: .1, dash: (u) => 1.6 * sm(.5, .6, u) * (1 - sm(.62, .74, u)) });
 // "...Squire?": she loses her turn; the point drops into one hand, her head turns toward the voice and her free hand half reaches out
 act('stagger', 1.2, [K(0), K(.1, { pX: -.06, hX: -.08 }, [-.13, 1.22, .3, .04, .35, .94, 0, -.94, .35]),
  K(.25, { y: -.06, pX: -.12, cX: -.08, hX: -.15, hY: .2, rFz: -.26, lFz: .1, mo: 3, br: .2, bl: .4, eye: .3, rPx: -.5, rPy: -.8, rPz: 0 }, [-.14, 1.05, .25, .06, -.3, .95, 0, -.95, -.3]),
  K(.45, { y: -.08, pX: -.1, cX: -.06, cY: .12, hX: -.05, hY: .48, hZ: .06, rFz: -.3, lFz: .08, two: 0, lik: 1, ltx: .4, lty: 1.22, ltz: .4, lPx: .7, lPy: -.5, lPz: -.3, fL: .25, br: 0, bl: .5, eye: .1 }, [-.24, 1.0, .2, .1, -.72, .68, .12, .7, .7]),
  K(.65, { y: -.1, pX: .02, cX: .04, hX: .05, hY: .52, hZ: .05, ltx: .42, lty: 1.18, mo: 3, bl: .6 }, [-.22, .96, .22, .08, -.76, .64, .1, .66, .74]),
  K(.85, { two: 1, lik: 0, fL: 1, hX: .1, hY: .1, eye: .4, mo: 0, br: .6, bl: .2 }, [-.13, 1.16, .28, .0, .3, .95, 0, -.95, .3]),
  K(1, READY)], { dash: (u) => -.8 * (1 - sm(0, .3, u)) * sm(0, .06, u) });
 // appear: she walks out of the dark, the blade on her shoulder, and settles into her guard
 const CARRY = { two: 0, lik: 0, lSX: .1, lSZ: .12, lE: -.25, fL: .6, rPx: -.3, rPy: -.9, rPz: -.2, pY: 0, sY: 0, cY: 0, nY: 0, hY: 0, rFr: -.08, lFr: .08, rFx: -.1, lFx: .1, eye: 1 };
 const CS = [-.12, 1.25, .18, -.15, .55, -.82, 0, .82, .55];
 act('appear', 2.0, [K(0, Object.assign({ fade: 0, y: -.03, rFz: -.2, lFz: .2 }, CARRY), CS),
  K(.1, { fade: .4, rFz: .0, rFy: .09, y: -.01 }), K(.2, { fade: .8, rFz: .22, rFy: 0, lFz: -.2, y: -.04 }),
  K(.3, { fade: 1, lFz: .0, lFy: .09, y: -.01 }), K(.4, { lFz: .22, lFy: 0, rFz: -.2, y: -.04 }),
  K(.5, { rFz: .0, rFy: .08, y: -.01 }), K(.6, { rFz: .16, rFy: 0, lFz: -.14, y: -.04 }),
  K(.82, Object.assign({}, READY, { eye: .7 })), K(1, READY)], { bi: .01, dash: (u) => 1.1 * (1 - sm(.5, .7, u)) });
 // defeat, the very end: she kneels on one knee with both hands on the hilt of her planted blade, and its whole edge warms
 // from cold blue to a line of gold; a pale moth rises out of her, and she goes home with it (lore answer 10)
 const KNEEL = Object.assign({}, READY, { y: -.45, pX: .26, pY: -.12, cX: .16, cY: .05, hX: .38, hY: 0, mo: 3, bl: .6, br: .2, rFx: -.13, rFz: -.42, rFy: 0, rFp: 1.3, rFr: -.15, lFx: .14, lFz: .36, lFr: .1, two: 1, lik: 0, rPx: -.8, rPy: -.5, rPz: .1, lPx: .8, lPy: -.5, lPz: .1, gx: -.07, gy: 1.08, gz: .36, dx: 0, dy: -1, dz: -.04, ex: 0, ey: -.04, ez: 1, eye: .2 });
 act('die', 5.2, [K(0), K(.15, { pX: -.12, y: -.12, mo: 3, bl: .5, br: .8, hX: -.2, eye: .8 }, [-.1, 1.2, .25, .1, -.3, .95, 0, -.95, -.3]), K(.25, { y: -.3, pX: .15 }, [-.02, 1.08, .3, .05, -.55, .83, 0, -.83, -.55]),
  K(.33, KNEEL), K(.45, { crack: 1, cX: .2, hX: .42, eye: .2 }), K(.56, { crack: 1, cX: .16, hX: .1, eye: .05, br: .1, bl: .3 }),
  K(.72, { crack: 1, hX: -.05, fade: .65, eye: 0 }), K(.94, { crack: 1, hX: -.1, fade: 0 }), K(1, { crack: 1, fade: 0 })], { hold: true, bi: .1 });
 // retreat, at the end of the level 20 fight: the blade held low in one hand, she backs away, and black smoke swallows her from the feet up
 const LOW = { two: 0, lik: 0, lSX: -.06, lSZ: .2, lE: -.35, fL: .7, rPx: -.45, rPy: -.9, rPz: .2, pY: -.15, sY: 0, cY: .05, nY: 0, hY: .1, rFr: -.08, lFr: .08, rFx: -.1, lFx: .1, eye: .9, br: .9 };
 act('retreat', 2.6, [K(0), K(.12, LOW, [-.25, 1.0, .16, .12, -.7, .7, .12, .7, .7]),
  K(.22, { rFz: -.24, rFy: .08, y: -.02 }), K(.32, { rFz: -.1, rFy: 0, lFz: .1, y: -.04 }),
  K(.42, { lFz: -.24, lFy: .08, y: -.02 }), K(.52, { lFz: -.1, lFy: 0, rFz: .1, y: -.04, sw: .12 }),
  K(.62, { rFz: -.24, rFy: .08, y: -.02, sw: .3 }), K(.74, { rFz: -.1, rFy: 0, lFz: .1, y: -.04, sw: .6 }),
  K(.9, { sw: 1, fade: .35 }), K(1, { sw: 1, fade: 0 })], { hold: true, bi: .1, dash: (u) => -.9 * sm(.15, .25, u) * (1 - sm(.74, .86, u)) });
 act('hurt', .6, [K(0), K(.18, { pX: -.2, cX: -.16, hX: -.22, y: -.07, mo: 3, br: 1, bl: .5 }, [-.12, 1.42, .12, -.15, .8, -.58, 0, .58, .8]), K(.45, { pX: -.04, cX: -.04, hX: 0, mo: 1, bl: .25 }), K(1, READY)],
  { interrupt: true, bi: .08, dash: (u) => -1.6 * (1 - sm(0, .6, u)) * sm(0, .05, u) });
 act('block', .45, [K(0), K(.34, Object.assign({}, GUARD, { y: -.14, mo: 1 })), K(.7, GUARD), K(1, READY)],
  { interrupt: true, bi: .08, dash: (u) => (u < .35 ? -1.0 * Math.sin(PI * u / .35) : 0) });

 // ---------- skin and bind ----------
 root.updateMatrixWorld(true);
 const skeleton = new THREE.Skeleton(bones);
 const skinned = []; buildSkinned(root, skeleton, skinned);
 setGaze(0, 0);

 // ---------- secondary motion: spring chains on 1/120 s substeps, with body colliders ----------
 const DOWN = new THREE.Vector3(0, -1, 0), PH = 1 / 120;
 const COL = []; for (let i = 0; i < 10; i++) COL.push({ a: new THREE.Vector3(), b: new THREE.Vector3(), r: 0, seg: false });
 function updateColliders() {
  chest.localToWorld(COL[0].a.set(0, .07, .01)); COL[0].r = .165;
  spine.localToWorld(COL[1].a.set(0, 0, 0)); COL[1].r = .15;
  pelvis.localToWorld(COL[2].a.set(0, -.03, 0)); COL[2].r = .175;
  for (let i = 0; i < 2; i++) {
   legs[i].getWorldPosition(COL[3 + i].a); knees[i].getWorldPosition(COL[3 + i].b); COL[3 + i].r = .094; COL[3 + i].seg = true;
   knees[i].getWorldPosition(COL[5 + i].a); ankles[i].getWorldPosition(COL[5 + i].b); COL[5 + i].r = .074; COL[5 + i].seg = true;
   arms[i].getWorldPosition(COL[7 + i].a); elbows[i].getWorldPosition(COL[7 + i].b); COL[7 + i].r = .075; COL[7 + i].seg = true;
  }
  head.localToWorld(COL[9].a.set(0, .105, .008)); COL[9].r = .135;
 }
 const _ca = new THREE.Vector3(), _cb = new THREE.Vector3();
 function collide(p, v, ids, m) {
  for (const k of ids) {
   const c = COL[k];
   if (c.seg) { _cb.subVectors(c.b, c.a); const t = cl(_ca.subVectors(p, c.a).dot(_cb) / Math.max(1e-8, _cb.lengthSq()), 0, 1); _ca.copy(c.a).addScaledVector(_cb, t); } else _ca.copy(c.a);
   _cb.subVectors(p, _ca); const d = _cb.length(), R = c.r + m;
   if (d < R) { if (d < 1e-6) _cb.set(0, 0, -1); else _cb.multiplyScalar(1 / d); p.copy(_ca).addScaledVector(_cb, R); const vn = v.dot(_cb); if (vn < 0) v.addScaledVector(_cb, -vn); }
  }
 }
 function chain(bs, tip, o) {
  const offs = bs.slice(1).map((b) => b.position.clone()); offs.push(tip.clone());
  return Object.assign({ bs, offs, L: offs.map((v) => v.length()), p: offs.map(() => new THREE.Vector3()), v: offs.map(() => new THREE.Vector3()), T: offs.map(() => new THREE.Vector3()), K: 40, C: 5, gk: .4, gks: null, cols: [], m: .02, breeze: 0, gr: null, ph: rnd() * TAU, init: false }, o);
 }
 // the braid lies down her back from under the helm and hangs free below the belts
 const chBraid = chain(braid, new THREE.Vector3(BRP[6][0] - BRP[5][0], BRP[6][1] - BRP[5][1], BRP[6][2] - BRP[5][2]), { K: 44, C: 4.8, gks: [.02, .05, .3, .5, .62, .75], cols: [0, 1, 2, 7, 8, 9], m: .01, breeze: .004 });
 const chTab = tabU.map((U, k) => chain([U, tabL[k]], tabTip[k], { K: 32, C: 5.4, gks: [.18, .3], cols: [2, 3, 4, 5, 6], m: .045, breeze: .01, gr: .014, tab: true }));
 const chCrest = crest.map((b, i) => { const c = CRP[i]; return chain([b], new THREE.Vector3(c[3], c[4], c[5]).normalize().multiplyScalar(.2), { K: 58, C: 4.4, gk: .05, breeze: .014 }); });
 const chMant = mant.map((b, i) => chain([b], new THREE.Vector3((i ? 1 : -1) * .03, -.2, 0), { K: 40, C: 5, gk: .72, cols: [0, 7 + i], m: .05, breeze: .008 }));
 const CHAINS = [chBraid, ...chTab, ...chCrest, ...chMant];
 const _cq = new THREE.Quaternion(), _cq2 = new THREE.Quaternion(), _cq3 = new THREE.Quaternion(), _cv = new THREE.Vector3(), _cw = new THREE.Vector3(), _cj = new THREE.Vector3(), _back = new THREE.Vector3();
 function physics(t, dt, walk, sinking, reset) {
  updateColliders();
  root.getWorldQuaternion(_cq); _back.set(0, 0, -1).applyQuaternion(_cq);
  for (const ch of CHAINS) {
   ch.bs[0].getWorldPosition(_cj);
   for (let i = 0; i < ch.bs.length; i++) {
    ch.bs[i].getWorldQuaternion(_cq); _cv.copy(ch.offs[i]).applyQuaternion(_cq).normalize().lerp(DOWN, ch.gks ? ch.gks[i] : ch.gk);
    if (ch.breeze) { _cv.x += ch.breeze * Math.sin(t * 1.3 + ch.ph + i); _cv.z += ch.breeze * .7 * Math.sin(t * .9 + ch.ph * 1.7 + i * .5); }
    if (walk > 0 && ch.tab) _cv.addScaledVector(_back, .25 * walk);
    _cv.normalize(); ch.T[i].copy(_cj).addScaledVector(_cv, ch.L[i]); _cj.copy(ch.T[i]);
   }
   if (!ch.init || reset) { for (let i = 0; i < ch.p.length; i++) { ch.p[i].copy(ch.T[i]); ch.v[i].set(0, 0, 0); } ch.init = true; }
  }
  if (dt > 0) {
   const n = Math.max(1, Math.ceil(dt / PH - 1e-6)), h = dt / n;
   for (const ch of CHAINS) {
    const p = ch.p, v = ch.v, T = ch.T, K2 = ch.K, C2 = ch.C, g = ch.gr === null || sinking ? -9 : ch.gr;
    for (let s = 0; s < n; s++) {
     for (let i = 0; i < p.length; i++) { v[i].x += (K2 * (T[i].x - p[i].x) - C2 * v[i].x) * h; v[i].y += (K2 * (T[i].y - p[i].y) - C2 * v[i].y) * h; v[i].z += (K2 * (T[i].z - p[i].z) - C2 * v[i].z) * h; p[i].addScaledVector(v[i], h); }
     ch.bs[0].getWorldPosition(_cj);
     for (let i = 0; i < p.length; i++) {
      _cv.subVectors(p[i], _cj); const L = _cv.length() || 1; p[i].copy(_cj).addScaledVector(_cv, ch.L[i] / L);
      if (ch.cols.length) collide(p[i], v[i], ch.cols, ch.m);
      if (p[i].y < g) { p[i].y = g; if (v[i].y < 0) v[i].y = 0; v[i].x *= .9; v[i].z *= .9; }
      _cj.copy(p[i]);
     }
    }
   }
  }
  for (const ch of CHAINS) for (let i = 0; i < ch.bs.length; i++) {
   const b = ch.bs[i]; b.getWorldPosition(_cj); b.getWorldQuaternion(_cq);
   _cv.copy(ch.offs[i]).applyQuaternion(_cq).normalize(); _cw.subVectors(ch.p[i], _cj).normalize();
   _cq2.setFromUnitVectors(_cv, _cw); _cq3.copy(_cq).invert().multiply(_cq2).multiply(_cq);
   b.quaternion.multiply(_cq3); b.updateMatrixWorld(true);
  }
 }

 // ---------- applying a pose: FK spine, IK legs onto foot targets, IK arms onto the greatsword ----------
 const qRoot = new THREE.Quaternion(), _qa = new THREE.Quaternion(), _eu = new THREE.Euler(), _g = new THREE.Vector3(), _dw = new THREE.Vector3(), _ew = new THREE.Vector3(), _xs = new THREE.Vector3();
 const _lastXs = new THREE.Vector3(1, 0, 0), _e2 = new THREE.Vector3(), _tq2 = new THREE.Quaternion(), _qs = new THREE.Quaternion(), _qw = new THREE.Quaternion(), _wp = new THREE.Vector3(), _pole = new THREE.Vector3(), _tg = new THREE.Vector3(), _lq = [new THREE.Quaternion(), new THREE.Quaternion(), new THREE.Quaternion()], _tq = new THREE.Quaternion();
 const QG = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), PI / 2), QGI = QG.clone().invert();
 const GP = new THREE.Vector3().setFromMatrixPosition(GRIP), GPL = new THREE.Vector3(-GP.x, GP.y, GP.z - .02), LFC = new THREE.Vector3(0, -.135, 0);
 const LT = knees[0].position.length(), LS = ankles[0].position.length(), LU = elbows[0].position.length(), LFa = wrists[0].position.length();
 function setFingers(i, c) {
  const s = i === 0 ? 1 : -1;
  fing[i][0].rotation.set(0, 0, s * 1.3 * c); fing[i][1].rotation.set(0, 0, s * 1.5 * c); fing[i][2].rotation.set(0, 0, s * .95 * c);
  thumb[i][0].rotation.set(.3 * c, -s * .2 * c, s * .6 * c); thumb[i][1].rotation.set(0, 0, s * .75 * c);
 }
 function applyPose(P, sy) {
  pelvis.position.set(P.x, 1.01 + P.y + sy, P.z); pelvis.rotation.set(P.pX, P.pY, P.pZ, 'YXZ');
  spine.rotation.set(P.sX, P.sY, P.sZ, 'YXZ'); chest.rotation.set(P.cX, P.cY, P.cZ, 'YXZ');
  neck.rotation.set(P.nX, P.nY, 0, 'YXZ'); head.rotation.set(P.hX, P.hY, P.hZ, 'YXZ');
  for (const ch of CHAINS) for (const b of ch.bs) b.quaternion.set(0, 0, 0, 1);
  arms[1].rotation.set(P.lSX, P.lSY, P.lSZ); elbows[1].rotation.set(P.lE, 0, 0); wrists[1].rotation.set(P.lWX, 0, P.lWZ);
  root.updateMatrixWorld(true); root.getWorldQuaternion(qRoot);
  for (let i = 0; i < 2; i++) {
   const c = i ? 'l' : 'r', fr = P[c + 'Fr'], fp = P[c + 'Fp'], up = Math.max(0, fp);
   _tg.set(P[c + 'Fx'], P[c + 'Fy'] + .087 * Math.cos(fp) + .14 * Math.sin(up) + sy, P[c + 'Fz'] - .14 * (1 - Math.cos(up)));
   root.localToWorld(_tg);
   _pole.set(Math.sin(fr) + (i ? .12 : -.12), 0, Math.cos(fr)).applyQuaternion(qRoot);
   const q2 = ik2(legs[i], knees[i], LT, LS, _tg, _pole, true, legFix[i][0], legFix[i][1]);
   _qa.setFromEuler(_eu.set(fp, fr, 0, 'YXZ')).premultiply(qRoot);
   ankles[i].quaternion.copy(q2).invert().multiply(_qa);
   toes[i].rotation.set(-up * .85, 0, 0);
  }
  _g.set(P.gx, P.gy + sy, P.gz); root.localToWorld(_g);
  _dw.set(P.dx, P.dy, P.dz).normalize().applyQuaternion(qRoot);
  _ew.set(P.ex, P.ey, P.ez).applyQuaternion(qRoot); _ew.addScaledVector(_dw, -_ew.dot(_dw));
  // when the keyed edge turns ambiguous mid-swing, carry the last frame's orientation instead of flipping
  const el = _ew.length(); _e2.crossVectors(_lastXs, _dw);
  if (_e2.lengthSq() > 1e-8) { _e2.normalize(); const k = sm(.45, .12, el); if (el > 1e-6) _ew.multiplyScalar(1 / el); _ew.multiplyScalar(1 - k).addScaledVector(_e2, k); }
  if (_ew.lengthSq() < 1e-6) { _ew.set(0, -1, 0).addScaledVector(_dw, _dw.y); if (_ew.lengthSq() < 1e-6) _ew.set(0, 0, 1); }
  _ew.normalize(); _xs.crossVectors(_dw, _ew); _lastXs.copy(_xs);
  _qs.setFromRotationMatrix(_mm.makeBasis(_xs, _dw, _ew)); _qw.copy(_qs).multiply(QGI);
  _tg.copy(GP).applyQuaternion(_qw); _tg.subVectors(_g, _tg);
  _pole.set(P.rPx, P.rPy, P.rPz).applyQuaternion(qRoot);
  let q2 = ik2(arms[0], elbows[0], LU, LFa, _tg, _pole, false);
  wrists[0].quaternion.copy(q2).invert().multiply(_qw);
  const wI = Math.max(P.two, P.lik);
  if (wI > .001) {
   _lq[0].copy(arms[1].quaternion); _lq[1].copy(elbows[1].quaternion); _lq[2].copy(wrists[1].quaternion);
   // the left hand slides smoothly between the grip and its reach target, wrist and all
   const kL = sm(0, 1, P.lik / Math.max(1e-6, P.two + P.lik));
   _tg.copy(LFC).applyQuaternion(_qs).add(_g); _tg.sub(_wp.copy(GPL).applyQuaternion(_qw));
   if (kL > .001) { _wp.set(P.ltx, P.lty + sy, P.ltz); root.localToWorld(_wp); _tg.lerp(_wp, kL); }
   _pole.set(P.lPx, P.lPy, P.lPz).applyQuaternion(qRoot);
   q2 = ik2(arms[1], elbows[1], LU, LFa, _tg, _pole, false);
   _tq2.copy(q2).invert().multiply(_qw); wrists[1].quaternion.copy(_lq[2]).slerp(_tq2, 1 - kL);
   if (wI < .999) for (const [b, q] of [[arms[1], _lq[0]], [elbows[1], _lq[1]], [wrists[1], _lq[2]]]) { _tq.copy(b.quaternion); b.quaternion.copy(q).slerp(_tq, wI); }
  }
  setFingers(0, P.fR); setFingers(1, Math.max(P.fL, P.two));
  root.updateMatrixWorld(true);
 }

 // ---------- base layer: the high guard with breath, the measured stride with the blade shouldered, guard ----------
 const BP = {}, WP = {}, GP2 = {}, AP = {}, AP2 = {}, FIN = {}, SNAP = {};
 cp(FIN, READY); cp(SNAP, READY);
 const HALF = PI / 4.4, CSD = D3(-.15, .55, -.82), CSE = D3(0, .82, .55);
 function idlePose(t, out) {
  cp(out, READY); const b = Math.sin(t * 1.7);
  out.cX += .012 * b; out.gy += .008 * Math.sin(t * 1.7 - .6); out.gz += .004 * b; out.y += .004 * Math.sin(t * 1.7 + 1);
  out.x = .008 * Math.sin(t * .5); out.pZ = .01 * Math.sin(t * .5); out.hY += .04 * Math.sin(t * .33); out.eye += .08 * Math.sin(t * 2.3);
  return out;
 }
 function walkPose(phase, spd, out) {
  cp(out, READY); const zs = [0, 0];
  for (let i = 0; i < 2; i++) {
   const ph = ((phase + (i ? PI : 0)) % TAU + TAU) % TAU, s = ph / PI, c = i ? 'l' : 'r';
   let z, y, p;
   if (s < 1) { z = lerp(HALF / 2, -HALF / 2, s); y = 0; p = .5 * sm(.7, 1, s); }
   else { const q = s - 1; z = lerp(-HALF / 2, HALF / 2, sm(0, 1, q)); y = .1 * Math.sin(PI * q); p = lerp(.5, -.2, sm(0, .7, q)) * (1 - sm(.85, 1, q)); }
   zs[i] = z; out[c + 'Fx'] = i ? .11 : -.11; out[c + 'Fz'] = z; out[c + 'Fy'] = y; out[c + 'Fp'] = p; out[c + 'Fr'] = i ? .06 : -.06;
  }
  const sw = (zs[0] - zs[1]) / HALF;
  out.y = -.06 + .03 * Math.abs(Math.sin(phase)); out.pX = .06; out.cX = .02; out.hX = -.02;
  out.pY = .1 * sw; out.sY = -.04 * sw; out.cY = -.1 * sw; out.hY = .03 * sw; out.nY = 0; out.pZ = .03 * Math.cos(phase);
  out.two = 0; out.lik = 0; out.fL = .6; out.lSX = -.38 * sw; out.lSY = 0; out.lSZ = .12; out.lE = -.3 - .2 * Math.max(0, sw);
  out.gx = -.12; out.gy = 1.25 + .01 * Math.sin(phase * 2); out.gz = .18; out.dx = CSD[0]; out.dy = CSD[1]; out.dz = CSD[2]; out.ex = CSE[0]; out.ey = CSE[1]; out.ez = CSE[2];
  out.rPx = -.3; out.rPy = -.9; out.rPz = -.2; out.eye = .5; out.br = .5; out.mo = 0;
  return out;
 }

 // ---------- state, face, effects, interface ----------
 const state = { drink: 0, charge: 0, crack: 0, sink: 0 };
 const st = { init: false, px: 0, pz: 0, ph: 0, spd: 0, q: new THREE.Quaternion() }, _rq = new THREE.Quaternion();
 let actv = null, gOn = false, gW = 0, dashV = 0, liftV = 0, fadeV = 1, fadeE = 1, prevU = 0, rbT = 0, trOn = 0, moteAcc = 0, sinkV = 0, smokeAcc = 0, noonAcc = 0;
 let blinkIn = 2.5, blinkT = -1, lookT = 1.2, gzX = 0, gzY = 0, gzTX = 0, gzTY = 0, mCur = 0, mNext = 0, mK = 1;
 const _p1 = new THREE.Vector3(), _p2 = new THREE.Vector3(), _p3 = new THREE.Vector3(), _p4 = new THREE.Vector3(), _p5 = new THREE.Vector3();
 const EYEO = EYEL.clone().add(new THREE.Vector3(0, 0, .012)), EYEOR = new THREE.Vector3().setFromMatrixPosition(EF[0].m).add(new THREE.Vector3(0, 0, .012));
 const winK = (list, u) => { let k = 0; if (list) for (const r of list) k = Math.max(k, sm(r[0] - .03, r[0] + .02, u) * (1 - sm(r[1] - .03, r[1] + .02, u))); return k; };
 function animate(phase, walk, t, dt) {
  dt = dt > 0 ? Math.min(dt, .05) : 0;
  root.updateMatrixWorld();
  // a teleport or a sudden turn (a new battle, a turntable) restarts the springs instead of dragging cloth through her
  root.getWorldQuaternion(_rq);
  const rx = root.position.x, rz = root.position.z, jump = !st.init || Math.hypot(rx - st.px, rz - st.pz) > 1.2 || _rq.angleTo(st.q) > .6;
  st.q.copy(_rq);
  if (dt > 0 && st.init) st.spd += (Math.abs(phase - st.ph) / 4.4 / dt - st.spd) * Math.min(1, dt * 6);
  st.px = rx; st.pz = rz; st.ph = phase; st.init = true;
  gW += ((gOn ? 1 : 0) - gW) * (1 - Math.exp(-(dt || .016) * 9));
  walk = cl(walk || 0, 0, 1);
  idlePose(t, BP); if (state.pose === 'sheet') cp(BP, SHEET);
  if (walk > .001) mix(BP, walkPose(phase, st.spd, WP), walk);
  if (gW > .001) { cp(GP2, GUARD); GP2.cX += .01 * Math.sin(t * 2.2); mix(BP, GP2, gW * (1 - .6 * walk)); }
  let u = 0, def = null, W = 0;
  if (actv) { actv.t += dt; def = actv.def; u = Math.min(1, actv.t / def.dur); if (u >= 1 && !def.hold) { actv = null; def = null; u = 0; } }
  if (def) {
   evalKeys(def, u, AP); cp(AP2, SNAP); mix(AP2, AP, sm(0, def.bi, actv.t));
   W = def.hold ? 1 : 1 - sm(def.dur - def.bo, def.dur, actv.t);
   cp(FIN, BP); mix(FIN, AP2, W);
  } else if (rbT > 0) { rbT -= dt; cp(FIN, SNAP); mix(FIN, BP, 1 - Math.max(0, rbT) / .18); } else cp(FIN, BP);
  dashV = def && def.dash ? def.dash(u) * W : 0;
  liftV = Math.max(0, FIN.y + .05);
  sinkV = cl(+state.sink || 0, 0, 1);
  CLIP.value = FIN.sw > .001 ? FIN.sw * 2.35 - .04 : sinkV > .001 ? .0 : -100; BCLIP.value = Math.max(0, CLIP.value);
  applyPose(FIN, -2.1 * sinkV);
  physics(t, dt, walk, sinkV > .001, jump);
  // face: blinks, a fixed stare with small shifts, knotted brows, painted mouth shapes cross-faded
  if (dt > 0) { blinkIn -= dt; if (blinkIn <= 0 && blinkT < 0) { blinkT = 0; blinkIn = 2.5 + rnd() * 4; } }
  let bk = 0; if (blinkT >= 0) { blinkT += dt; const k = blinkT / .16; bk = k < 1 ? Math.sin(PI * k) : 0; if (k >= 1) blinkT = -1; }
  lidMesh.morphTargetInfluences[0] = Math.max(bk, cl(FIN.bl, 0, 1));
  browMesh.morphTargetInfluences[0] = cl(FIN.br, 0, 1);
  lookT -= dt; if (lookT <= 0) { lookT = 1.2 + rnd() * 2.5; gzTX = (rnd() - .5) * .003; gzTY = (rnd() - .5) * .0015; }
  const gx = def ? 0 : gzTX, gy = def ? 0 : gzTY; gzX += (gx - gzX) * Math.min(1, dt * 20); gzY += (gy - gzY) * Math.min(1, dt * 20);
  setGaze(gzX, gzY);
  const mo = Math.round(FIN.mo);
  if (mo !== mNext) { mCur = mK > .5 ? mNext : mCur; mNext = mo; mK = 0; }
  mK = Math.min(1, mK + (dt || .016) * 14); if (mK >= 1) mCur = mNext;
  M.mouth.map.offset.x = mCur * .25; M.mouth2.map.offset.x = mNext * .25;
  const fd = fadeE * cl(FIN.fade, 0, 1);
  applyFade(fd);
  M.mouth.opacity = (mCur === mNext ? 1 : 1 - mK) * fd; M.mouth2.opacity = (mCur === mNext ? 0 : mK) * fd;
  updateFX(def, u, t, dt, fd);
  prevU = u;
 }
 function updateFX(def, u, t, dt, fd) {
  swordMatrix();
  _p1.copy(TIP).applyMatrix4(swM); _p2.copy(MIDB).applyMatrix4(swM); _p3.copy(UPB).applyMatrix4(swM); _p4.copy(BASEB).applyMatrix4(swM);
  const drink = Math.max(cl(+state.drink || 0, 0, 1), FIN.drink), chg = Math.max(cl(+state.charge || 0, 0, 1), FIN.ch), crk = Math.max(cl(+state.crack || 0, 0, 1), FIN.crack), eye = cl(FIN.eye, 0, 1.2);
  // the cold edge drinks light and brightens; the dark sun swallows it; at the very end the whole edge warms to gold
  M.edge.emissive.copy(EBLUE).lerp(EGOLD, crk);
  M.edge.emissiveIntensity = Math.max(.05, (1.5 + 2.2 * drink + .25 * drink * Math.sin(t * 7)) * (1 - .85 * chg)) + 1.3 * crk;
  M.irisG.emissiveIntensity = .5 + 1.3 * eye;
  head.localToWorld(eyeGlow.position.copy(EYEO)); head.localToWorld(eyeGlow2.position.copy(EYEOR));
  for (const s of [eyeGlow, eyeGlow2]) { s.scale.setScalar(.05 + .07 * eye); s.material.opacity = (.2 + .6 * eye) * fd; }
  edgeA.position.copy(_p2); edgeB.position.copy(_p3);
  for (const s of [edgeA, edgeB]) { s.material.color.copy(EGLOW).lerp(EGOLD, crk); s.scale.setScalar(.3 + .25 * drink + .2 * crk); s.material.opacity = (.06 + .42 * drink + .34 * crk) * (1 - chg) * fd; }
  _p5.copy(_p2).lerp(_p3, .3); sunDisc.position.copy(_p5); corona.position.copy(_p5); sunDisc.scale.setScalar(.04 + .85 * chg); corona.scale.setScalar(2.4 * (.04 + .85 * chg));
  sunDisc.material.opacity = sm(0, .15, chg) * fd; corona.material.opacity = chg * (.75 + .25 * Math.sin(t * 5)) * fd; corona.material.rotation += dt * .5;
  M.crack.opacity = .55 * crk; M.crack.emissiveIntensity = 3.4 * crk;
  crackGlow.position.copy(_p2); crackGlow.scale.setScalar(.3 + .3 * crk); crackGlow.material.opacity = .75 * crk * (.85 + .15 * Math.sin(t * 9)) * fd; crackGlow.material.depthTest = crk < .01;
  // trail behind the blade
  const trK = def ? winK(def.trail, u) : 0, on = trK > .01;
  if (on && trOn === 0) for (let i = 0; i < TRN; i++) { trTip[i].copy(_p1); trMid[i].copy(_p2); }
  trOn = on ? trK : 0; trail.visible = on;
  if (on && dt > 0) { for (let i = TRN - 1; i > 0; i--) { trTip[i].copy(trTip[i - 1]); trMid[i].copy(trMid[i - 1]); } trTip[0].copy(_p1); trMid[0].copy(_p2); }
  if (on) {
   for (let i = 0; i < TRN; i++) { const k = trOn * Math.pow(1 - i / (TRN - 1), 1.5) * fd, a = trTip[i], b = trMid[i]; trPos.set([a.x, a.y, a.z, b.x, b.y, b.z], i * 6); trCol.set([.6 * k, .8 * k, 1.0 * k, .12 * k, .25 * k, .5 * k], i * 6); }
   trGeo.attributes.position.needsUpdate = true; trGeo.attributes.color.needsUpdate = true;
  }
  // stolen light streaming into the edge
  if (dt > 0 && drink > .05) {
   moteAcc += dt * 58 * drink;
   while (moteAcc > 1) { moteAcc -= 1; const a = (rnd() - .5) * 2.4, r = .7 + rnd() * 1.0; _p5.set(Math.sin(a) * r, .5 + rnd() * 1.4, Math.cos(a) * r); root.localToWorld(_p5); const i = emit(motes, _p5.x, _p5.y, _p5.z, 0, 0, 0, 1.4); motes.tg[i] = .15 + .85 * rnd(); }
  }
  stepP(motes, dt, (i, h, a) => {
   const p = motes.pos, v = motes.vel; _p5.copy(_p4).lerp(_p1, motes.tg[i]); _cv.set(_p5.x - p[i * 3], _p5.y - p[i * 3 + 1], _p5.z - p[i * 3 + 2]);
   const d = _cv.length(); if (d < .04) { motes.life[i] = 0; return 0; }
   _cv.multiplyScalar((1.3 + 3 * a) / d); const k = Math.min(1, h * 5), tx = -_cv.z * .9; _cv.z += _cv.x * .9; _cv.x += tx;
   v[i * 3] += (_cv.x * 2.5 - v[i * 3]) * k; v[i * 3 + 1] += (_cv.y * 2.5 - v[i * 3 + 1]) * k; v[i * 3 + 2] += (_cv.z * 2.5 - v[i * 3 + 2]) * k;
   p[i * 3] += v[i * 3] * h; p[i * 3 + 1] += v[i * 3 + 1] * h; p[i * 3 + 2] += v[i * 3 + 2] * h;
   return sm(0, .15, a) * Math.min(1, d * 4) * fd;
  }, [.85, .74, 1]);
  // cold blue sparks off the tip at each hit
  if (def && dt > 0) for (const hh of def.hits) if (prevU < hh && u >= hh) for (let i = 0; i < 16; i++) { const a = rnd() * TAU, sp = .8 + rnd() * 2; emit(sparks, _p1.x, _p1.y, _p1.z, Math.cos(a) * sp, .5 + rnd() * 1.8, Math.sin(a) * sp, .35 + rnd() * .25); }
  stepP(sparks, dt, (i, h, a) => { const p = sparks.pos, v = sparks.vel; v[i * 3 + 1] -= 6 * h; p[i * 3] += v[i * 3] * h; p[i * 3 + 1] += v[i * 3 + 1] * h; p[i * 3 + 2] += v[i * 3 + 2] * h; return (1 - a) * fd; }, [.6, .8, 1]);
  // the dark at her feet as she retreats into it (and the old black water, kept for the game's sink state)
  const dk = Math.max(sinkV, cl(FIN.sw, 0, 1));
  root.getWorldPosition(_p5); pool.position.set(_p5.x, .003, _p5.z); pool.scale.setScalar(.6 + .6 * dk); pool.material.opacity = .75 * sm(0, .12, dk) * fadeE * (FIN.sw > .001 ? sm(0, .45, FIN.fade) : 1);
  // black smoke boiling up round her as the dark takes her, with flakes torn off it; black shards and wisps whirling round the dark sun
  const swk = cl(FIN.sw, 0, 1), top = Math.max(.1, swk * 2.35 - .04);
  if (dt > 0 && swk > .01 && fd > .05) {
   smokeAcc += dt * 95 * sm(0, .15, swk);
   // most of it billows round the line the dark has reached, hiding it; the smoke goes with her, the flakes fly off
   while (smokeAcc > 1) {
    smokeAcc -= 1; const a = rnd() * TAU, r = .1 + .3 * rnd(), q = rnd() < .24, P = q ? shards : smoke;
    const i = emit(P, _p5.x + Math.sin(a) * r, Math.max(.06, top + .16 - .45 * rnd() * rnd() - (rnd() < .35 ? top * rnd() : 0)), _p5.z + Math.cos(a) * r, Math.sin(a) * (q ? .9 : .2), q ? .8 + .9 * rnd() : .06 + .2 * rnd(), Math.cos(a) * (q ? .9 : .2), q ? .8 + .6 * rnd() : 1 + .7 * rnd(), q ? .7 + .6 * rnd() : 1.2 + .8 * rnd());
    P.tg[i] = q ? -2 : -1; P.off[i * 3] = Math.sin(a) * r; P.off[i * 3 + 1] = P.pos[i * 3 + 1] - top; P.off[i * 3 + 2] = Math.cos(a) * r;
   }
  }
  if (dt > 0 && chg > .05 && fd > .05) {
   noonAcc += dt * 70 * chg;
   while (noonAcc > 1) { noonAcc -= 1; const q = rnd() < .6, P = q ? shards : smoke, i = emit(P, _p5.x, .6 + 2 * rnd(), _p5.z, .55 + .7 * rnd(), (rnd() - .3) * .35, 1.8 + 1.6 * rnd(), 1.2 + .8 * rnd(), q ? 1.1 + .9 * rnd() : .55 + .45 * rnd()); P.tg[i] = rnd() * TAU; }
  }
  // a whirling particle keeps (radius, rise, spin) in its velocity and its angle in tg; smoke (tg -1) drifts round her where
  // she goes and rises with the line the dark has reached; flakes (tg -2) fly off and slow
  for (const P of [smoke, shards]) stepP(P, dt, (i, h, a) => {
   const p = P.pos, v = P.vel, j = i * 3;
   if (P.tg[i] >= 0) { P.tg[i] += v[j + 2] * h; v[j] = Math.max(.2, v[j] - .08 * h); p[j] = _p5.x + Math.sin(P.tg[i]) * v[j]; p[j + 1] += v[j + 1] * h; p[j + 2] = _p5.z + Math.cos(P.tg[i]) * v[j]; }
   else {
    const dr = 1 - Math.min(1, 1.4 * h); v[j] *= dr; v[j + 2] *= dr; p[j + 1] += v[j + 1] * h;
    if (P.tg[i] < -1.5) { p[j] += v[j] * h; p[j + 2] += v[j + 2] * h; } else { P.off[j] += v[j] * h; P.off[j + 2] += v[j + 2] * h; p[j] = _p5.x + P.off[j]; p[j + 2] = _p5.z + P.off[j + 2]; p[j + 1] = Math.max(p[j + 1], top + P.off[j + 1]); }
   }
   P.ps[i] = P.sz[i] * (.6 + .9 * a);
   return sm(0, .12, a) * (1 - sm(.55, 1, a)) * .9;
  }, P === smoke ? [.02, .018, .03] : [1, 1, 1]);
  stepMoth(def, u, t, dt);
  // effects that have faded out entirely skip their draw call
  for (const o of [sunDisc, corona, crackGlow, edgeA, edgeB, pool]) o.visible = o.material.opacity > .002;
 }
 const ACTIONS = {};
 for (const n in ACTS) { const d = ACTS[n], e = { dur: d.dur, hits: d.hits.slice(), hold: d.hold, interrupt: d.interrupt }; if (d.span) e.span = d.span.slice(); ACTIONS[n] = Object.freeze(e); }
 Object.freeze(ACTIONS);
 function play(name, force) {
  const def = ACTS[name]; if (!def) return false;
  if (actv && !force && (actv.name === 'die' || (!def.interrupt && !(actv.def.hold && actv.t >= actv.def.dur - 1e-6)))) return false;
  const gone = FIN.fade < .5 || sinkV > .5;
  cp(SNAP, gone ? BP : FIN); if (gone) for (const ch of CHAINS) ch.init = false;
  actv = { name, def, t: 0 }; prevU = 0; rbT = 0; return true;
 }
 const fadeMats = [...new Set(skinned.map((m) => m.material).concat([M.eyeW, M.irisG, M.lid, M.brow]))].filter((m) => m !== M.crack), fadeT = fadeMats.map((m) => m.transparent);
 function applyFade(f) {
  if (Math.abs(f - fadeV) < 1e-4) return;
  const was = fadeV < .999, now = f < .999; fadeV = f;
  fadeMats.forEach((m, i) => { m.transparent = now || fadeT[i]; m.opacity = f; if (was !== now) m.needsUpdate = true; });
  root.visible = f > .002;
 }
 const ANC = { chest: [chest, new THREE.Vector3(0, .1, .14)], head: [head, new THREE.Vector3(0, .16, .04)] };
 function anchor(name, out) {
  out = out || new THREE.Vector3();
  if (name === 'hit') return out.copy(TIP).applyMatrix4(swordMatrix());
  if (name === 'blade') return out.copy(MIDB).applyMatrix4(swordMatrix());
  if (name === 'eye') { head.updateWorldMatrix(true, false); return head.localToWorld(out.copy(EYEO)); }
  const a = ANC[name] || ANC.chest; a[0].updateWorldMatrix(true, false); return a[0].localToWorld(out.copy(a[1]));
 }
 let tri = 0, draws = 0; const texs = new Set();
 root.traverse((o) => { if (o.isMesh) { draws++; tri += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; for (const k of ['map', 'normalMap', 'emissiveMap']) if (o.material[k]) texs.add(o.material[k].image); } });
 fx.traverse((o) => { if (o.isMesh || o.isSprite || o.isPoints) { draws++; if (o.material.map) texs.add(o.material.map.image); } });
 animate(0, 0, 0, 0);
 return {
  root, fx, skeleton, bones, animate, play,
  guard(on) { gOn = !!on; },
  reset() { const gone = FIN.fade < .5 || sinkV > .5; cp(SNAP, FIN); actv = null; gOn = false; gW = 0; rbT = gone ? 0 : .18; if (gone) for (const ch of CHAINS) ch.init = false; },
  get busy() { return !!actv && !(actv.def.hold && actv.t >= actv.def.dur - 1e-6); },
  get action() { return actv ? actv.name : ''; },
  get progress() { return actv ? Math.min(1, actv.t / actv.def.dur) : -1; },
  get dash() { return dashV; },
  get lift() { return liftV; },
  get state() { return state; }, set state(v) { if (v) Object.assign(state, v); },
  setFade(f) { fadeE = cl(+f, 0, 1); }, anchor, ACTIONS,
  stats: { triangles: Math.round(tri), bones: bones.length, drawCalls: draws, textures: texs.size }
 };
}
// halcyon.js: Halcyon, the Gloam Knight, for Moonlight in the Aether. three.js r128 (global THREE). Defines makeHalcyon(opts) only.
