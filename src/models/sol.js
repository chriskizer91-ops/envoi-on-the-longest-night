// Imported unchanged from reference/demos/sol-in-the-night-square.html. three.js r128 (global THREE).
function makeSol(opts) {
 'use strict';
 // Solenne "Sol" Kestrel, the last Ember Warden. Code-built three.js r128 model for Moonlight in the Aether.
 // Units are meters, Y up, facing +Z, feet on y = 0. Her right side is -X.
 opts = opts || {};
 const DET = Math.max(.5, Math.min(1, opts.detail === undefined ? 1 : +opts.detail));
 const Q = (n, m) => Math.max(m || 3, Math.round(n * DET));
 let seed = 1778;
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
 function sunGlyph(g, x, y, r, sx, rays, fill, line) {
  g.save(); g.translate(x, y); g.scale(sx || 1, 1);
  g.fillStyle = fill;
  for (let i = 0; i < rays; i++) {
   const a = i / rays * TAU, L = i % 2 ? r * 1.55 : r * 2.25, w = i % 2 ? .11 : .16;
   g.beginPath(); g.moveTo(Math.cos(a - w) * r * 1.08, Math.sin(a - w) * r * 1.08); g.lineTo(Math.cos(a) * L, Math.sin(a) * L); g.lineTo(Math.cos(a + w) * r * 1.08, Math.sin(a + w) * r * 1.08); g.fill();
  }
  const gr = g.createRadialGradient(-r * .3, -r * .3, r * .1, 0, 0, r); gr.addColorStop(0, '#fff1b8'); gr.addColorStop(.55, fill); gr.addColorStop(1, '#a8701c');
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
  g.strokeStyle = line; g.lineWidth = Math.max(1, r * .12); g.beginPath(); g.arc(0, 0, r * .72, 0, TAU); g.stroke();
  g.restore();
 }
 function faceCanvas() {
  const W = 512, H = 256, c = cvs(W, H), g = c.getContext('2d');
  g.fillStyle = '#eaa47c'; g.fillRect(0, 0, W, H);
  const P = (az, y) => [(.25 + az / TAU) * W, (.132 - y) / .277 * H];
  speck(g, W, H, 2400, ['rgba(160,80,50,.05)', 'rgba(255,220,190,.05)'], 1, 3);
  let p;
  for (const sd of [-1, 1]) { p = P(sd * .58, -.058); blob(g, p[0], p[1], 20, 'rgba(236,112,92,.24)', 1.4); }
  p = P(0, -.05); blob(g, p[0], p[1], 8, 'rgba(226,112,92,.12)');
  for (const sd of [-1, 1]) { p = P(sd * .43, .012); blob(g, p[0], p[1], 13, 'rgba(176,86,62,.16)', 1.6); }
  p = P(0, -.135); blob(g, p[0], p[1], 20, 'rgba(160,80,52,.12)', 2);
  p = P(0, -.084); blob(g, p[0], p[1], 10, 'rgba(206,104,96,.22)', 2.2);
  for (let i = 0; i < 400; i++) {
   const az = (rnd() - .5) * 1.5, y = -.015 - rnd() * .055;
   const d = Math.exp(-((Math.abs(az) - .42) ** 2) / .03) * Math.exp(-((y + .044) ** 2) / .0003) + .8 * Math.exp(-(az * az) / .01) * Math.exp(-((y + .032) ** 2) / .0002);
   if (rnd() > d * .55) continue;
   p = P(az, y); g.fillStyle = 'rgba(' + ((150 + rnd() * 30) | 0) + ',' + ((70 + rnd() * 20) | 0) + ',40,' + (.28 + rnd() * .25).toFixed(2) + ')';
   g.beginPath(); g.arc(p[0], p[1], .55 + rnd() * .55, 0, TAU); g.fill();
  }
  return c;
 }
 function armCanvas() {
  const W = 256, H = 128, c = cvs(W, H), g = c.getContext('2d');
  g.fillStyle = '#e39d74'; g.fillRect(0, 0, W, H);
  speck(g, W, H, 900, ['rgba(150,70,40,.07)', 'rgba(255,215,185,.07)'], 1, 3);
  for (let i = 0; i < 70; i++) { g.fillStyle = 'rgba(140,64,36,.35)'; g.beginPath(); g.arc(rnd() * W, rnd() * H, .6 + rnd() * .8, 0, TAU); g.fill(); }
  // the burn scar curls from the wrist (bottom) up the outer right forearm (left half of the atlas)
  for (let i = 0; i < 46; i++) {
   const t = i / 45, u = .25 - .17 * Math.sin(t * 2.6) - .07 * t, v = 1 - t * .98;
   const x = u * W * .5 + (rnd() - .5) * 7, y = v * H + (rnd() - .5) * 5, r = (7 - 4 * t) * (.7 + rnd() * .6);
   blob(g, x, y, r * 1.6, 'rgba(196,92,84,.55)');
   g.fillStyle = rnd() < .5 ? 'rgba(244,170,150,.7)' : 'rgba(160,60,56,.55)';
   g.beginPath(); g.ellipse(x, y, r * .8, r * .45, rnd() * 3, 0, TAU); g.fill();
  }
  return c;
 }
 function irisCanvas() {
  const S = 128, c = cvs(S, S), g = c.getContext('2d'), m = S / 2;
  let gr = g.createRadialGradient(m, m + 10, 4, m, m, m);
  gr.addColorStop(0, '#ffd27a'); gr.addColorStop(.42, '#e0901e'); gr.addColorStop(.78, '#8a4810'); gr.addColorStop(1, '#2a1004');
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 150; i++) {
   const a = rnd() * TAU, r0 = 15 + rnd() * 6, r1 = 32 + rnd() * 28;
   g.strokeStyle = rnd() < .55 ? 'rgba(255,226,150,.25)' : 'rgba(70,26,4,.3)'; g.lineWidth = .6 + rnd();
   g.beginPath(); g.moveTo(m + Math.cos(a) * r0, m + Math.sin(a) * r0); g.lineTo(m + Math.cos(a) * r1, m + Math.sin(a) * r1); g.stroke();
  }
  gr = g.createLinearGradient(0, 0, 0, S * .55); gr.addColorStop(0, 'rgba(30,10,2,.8)'); gr.addColorStop(1, 'rgba(30,10,2,0)'); g.fillStyle = gr; g.fillRect(0, 0, S, S * .55);
  g.fillStyle = '#140804'; g.beginPath(); g.ellipse(m, m + 2, 15, 18, 0, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(28,10,2,.95)'; g.lineWidth = 6; g.beginPath(); g.arc(m, m, m - 3, 0, TAU); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.ellipse(m - 15, m - 17, 11, 9, -.4, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255,240,210,.8)'; g.beginPath(); g.arc(m + 16, m + 18, 5, 0, TAU); g.fill();
  return c;
 }
 function mouthCanvas() {
  const W = 512, H = 64, c = cvs(W, H), g = c.getContext('2d');
  const lip = '#9a3e36', dark = '#3a0f0c';
  // 0: confident half-smile (her left corner, viewer right, lifts)
  g.save(); g.translate(0, 0);
  blob(g, 64, 41, 16, 'rgba(214,112,104,.45)', 1.9);
  g.strokeStyle = lip; g.lineWidth = 3.2; g.lineCap = 'round';
  g.beginPath(); g.moveTo(34, 31); g.quadraticCurveTo(62, 40, 96, 26); g.stroke();
  g.lineWidth = 1.6; g.beginPath(); g.moveTo(95, 27); g.quadraticCurveTo(100, 24, 101, 21); g.stroke();
  g.restore();
  // 1: gritted teeth
  g.save(); g.translate(128, 0);
  g.fillStyle = dark; g.beginPath(); g.ellipse(64, 32, 34, 13, 0, 0, TAU); g.fill();
  g.fillStyle = '#f6eee6'; g.beginPath(); g.ellipse(64, 32, 30, 9.5, 0, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(90,50,40,.75)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(36, 32); g.lineTo(92, 32); g.stroke();
  for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(64 + i * 8, 24); g.lineTo(64 + i * 8, 40); g.stroke(); }
  g.strokeStyle = lip; g.lineWidth = 3.5; g.beginPath(); g.ellipse(64, 32, 34, 13, 0, 0, TAU); g.stroke();
  g.restore();
  // 2: open, shouting or hurt
  g.save(); g.translate(256, 0);
  g.fillStyle = dark; g.beginPath(); g.ellipse(64, 33, 22, 20, 0, 0, TAU); g.fill();
  g.fillStyle = '#b8505a'; g.beginPath(); g.ellipse(64, 47, 14, 6, 0, 0, TAU); g.fill();
  g.fillStyle = '#f6eee6'; g.fillRect(48, 14, 32, 6);
  g.strokeStyle = lip; g.lineWidth = 3.5; g.beginPath(); g.ellipse(64, 33, 22, 20, 0, 0, TAU); g.stroke();
  g.restore();
  // 3: closed, pained
  g.save(); g.translate(384, 0);
  g.strokeStyle = lip; g.lineWidth = 3; g.lineCap = 'round';
  g.beginPath(); g.moveTo(42, 34); g.quadraticCurveTo(64, 28, 86, 35); g.stroke();
  blob(g, 64, 41, 12, 'rgba(214,112,104,.35)', 1.8);
  g.restore();
  return c;
 }
 function hairCanvas() {
  const W = 256, H = 64, c = cvs(W, H), g = c.getContext('2d');
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 120; i++) { g.fillStyle = rnd() < .55 ? 'rgba(70,14,4,.24)' : 'rgba(255,214,170,.22)'; g.fillRect(0, rnd() * H, W, .6 + rnd() * 1.8); }
  const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, 'rgba(60,10,2,.35)'); gr.addColorStop(.3, 'rgba(60,10,2,0)'); gr.addColorStop(.85, 'rgba(255,190,120,0)'); gr.addColorStop(1, 'rgba(255,190,120,.3)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  return c;
 }
 function linenCanvas() {
  const S = 128, c = cvs(S, S), g = c.getContext('2d');
  g.fillStyle = '#f1e7d2'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < S; i += 2) { g.fillStyle = 'rgba(120,90,60,.06)'; g.fillRect(0, i, S, 1); g.fillRect(i, 0, 1, S); }
  for (let i = 0; i < 9; i++) { const x = rnd() * S, gr = g.createLinearGradient(x - 9, 0, x + 9, 0); gr.addColorStop(0, 'rgba(110,80,50,0)'); gr.addColorStop(.5, 'rgba(110,80,50,.12)'); gr.addColorStop(1, 'rgba(110,80,50,0)'); g.fillStyle = gr; g.fillRect(x - 9, 0, 18, S); }
  return c;
 }
 function weave(g, W, H, a) { for (let i = 0; i < W * H / 40; i++) { g.fillStyle = rnd() < .5 ? 'rgba(0,0,0,' + a + ')' : 'rgba(255,255,255,' + a * .6 + ')'; g.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 3, 1); } }
 function vine(g, x0, y0, len, horiz, col) {
  g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 1.6;
  for (let s = 0; s < len; s += 22) {
   const x = horiz ? x0 + s : x0, y = horiz ? y0 : y0 + s, f = (s / 22) % 2 ? 1 : -1;
   g.beginPath();
   if (horiz) { g.moveTo(x, y); g.bezierCurveTo(x + 6, y - 9 * f, x + 14, y - 9 * f, x + 22, y); }
   else { g.moveTo(x, y); g.bezierCurveTo(x - 9 * f, y + 6, x - 9 * f, y + 14, x, y + 22); }
   g.stroke();
   const cx = horiz ? x + 11 : x - 7 * f, cy = horiz ? y - 8 * f : y + 11;
   g.beginPath(); g.arc(cx, cy, 3.2, 0, TAU * .8); g.stroke();
   g.beginPath(); g.arc(horiz ? x + 18 : x - 3 * f, horiz ? y - 3 * f : y + 18, 1.6, 0, TAU); g.fill();
  }
 }
 function tabardCanvas() {
  const W = 128, H = 512, c = cvs(W, H), g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#de6a22'); gr.addColorStop(.7, '#cf5a1c'); gr.addColorStop(1, '#b8461a');
  g.fillStyle = gr; g.fillRect(0, 0, W, H); weave(g, W, H, .05);
  const tip = .86 * H, gold = '#f2c45a';
  const outline = (k) => { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, tip - k * .3); g.lineTo(W / 2, H - k * 1.25); g.lineTo(W - k, tip - k * .3); g.lineTo(W - k, 0); };
  g.lineJoin = 'miter'; g.strokeStyle = gold; g.lineWidth = 5; outline(6); g.stroke();
  g.strokeStyle = '#8a3612'; g.lineWidth = 1.2; outline(10.5); g.stroke();
  g.strokeStyle = gold; g.lineWidth = 1.6; outline(13); g.stroke();
  g.fillStyle = gold; g.fillRect(W / 2 - 1, 30, 2, .58 * H - 72);
  sunGlyph(g, W / 2, .6 * H, 19, 1, 16, gold, '#b06a14');
  g.fillStyle = '#f6d47a'; g.beginPath(); g.moveTo(W / 2, H - 30); g.lineTo(W / 2 - 9, H - 52); g.lineTo(W / 2, H - 62); g.lineTo(W / 2 + 9, H - 52); g.fill();
  return c;
 }
 function capeCanvas() {
  const W = 512, H = 512, c = cvs(W, H), g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#2c3a70'); gr.addColorStop(1, '#222c58');
  g.fillStyle = gr; g.fillRect(0, 0, W, H); weave(g, W, H, .05);
  for (let i = 0; i < 14; i++) { const x = rnd() * W, gg = g.createLinearGradient(x - 20, 0, x + 20, 0); gg.addColorStop(0, 'rgba(10,14,40,0)'); gg.addColorStop(.5, 'rgba(10,14,40,.18)'); gg.addColorStop(1, 'rgba(10,14,40,0)'); g.fillStyle = gg; g.fillRect(x - 20, 0, 40, H); }
  const gold = '#e3ad48', B = H - 40;
  g.fillStyle = gold; g.fillRect(0, B + 24, W, 16); g.fillRect(0, 0, 14, H); g.fillRect(W - 14, 0, 14, H);
  g.fillStyle = '#fbd987'; g.fillRect(0, B + 26, W, 2); g.fillRect(3, 0, 2, H); g.fillRect(W - 5, 0, 2, H);
  g.strokeStyle = gold; g.lineWidth = 2; g.strokeRect(22, -4, W - 44, B + 18);
  vine(g, 26, B + 6, W - 52, true, gold); vine(g, 30, 10, B - 20, false, gold); vine(g, W - 30, 10, B - 20, false, gold);
  sunGlyph(g, W / 2, .6 * H, 30, 1, 16, '#efbd56', '#a46a18');
  return c;
 }
 function liningCanvas() {
  const W = 256, H = 128, c = cvs(W, H), g = c.getContext('2d');
  g.fillStyle = '#b8842e'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 22; i++) { const x = rnd() * W, gr = g.createLinearGradient(x - 7, 0, x + 7, 0); gr.addColorStop(0, 'rgba(120,70,10,0)'); gr.addColorStop(.5, 'rgba(120,70,10,.24)'); gr.addColorStop(1, 'rgba(120,70,10,0)'); g.fillStyle = gr; g.fillRect(x - 7, 0, 14, H); }
  let gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(36,18,2,.72)'); gr.addColorStop(.45, 'rgba(36,18,2,.32)'); gr.addColorStop(1, 'rgba(36,18,2,.05)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, 'rgba(36,18,2,0)'); gr.addColorStop(.18, 'rgba(36,18,2,.22)'); gr.addColorStop(.5, 'rgba(36,18,2,.4)'); gr.addColorStop(.82, 'rgba(36,18,2,.22)'); gr.addColorStop(1, 'rgba(36,18,2,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  weave(g, W, H, .05);
  return c;
 }
 function bodiceCanvas() {
  const W = 512, H = 256, c = cvs(W, H), g = c.getContext('2d');
  g.fillStyle = '#6e3f22'; g.fillRect(0, 0, W, H);
  for (let r = 0; r < 26; r++) for (let k = 0; k < 44; k++) {
   const x = k * 12 + (r % 2) * 6, y = r * 10;
   const gr = g.createLinearGradient(0, y - 6, 0, y + 6); gr.addColorStop(0, 'rgba(150,96,58,.55)'); gr.addColorStop(1, 'rgba(40,20,8,.55)');
   g.fillStyle = gr; g.beginPath(); g.arc(x, y, 6.5, 0, PI); g.fill();
  }
  const half = (v) => (v < .62 ? lerp(.125, .072, sm(.15, .62, v)) : .072) * W;
  g.fillStyle = '#d4601e'; g.beginPath();
  for (let i = 0; i <= 20; i++) { const v = i / 20; g.lineTo(W / 2 - half(v), v * H); }
  for (let i = 20; i >= 0; i--) { const v = i / 20; g.lineTo(W / 2 + half(v), v * H); }
  g.fill(); g.save(); g.clip(); weave(g, W, H, .06); g.restore();
  g.strokeStyle = '#f0c058'; g.lineWidth = 3;
  for (const sd of [-1, 1]) { g.beginPath(); for (let i = 0; i <= 20; i++) { const v = i / 20; g.lineTo(W / 2 + sd * half(v), v * H); } g.stroke(); }
  sunGlyph(g, W / 2, .3 * H, 13, 1.3, 16, '#f2c45a', '#a86a16');
  g.fillStyle = '#f2c45a'; g.fillRect(W / 2 - 1, .42 * H, 2, .4 * H);
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
 function metalCanvas() {
  const S = 256, c = cvs(S, S), g = c.getContext('2d');
  g.fillStyle = '#e8e2d8'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 260; i++) { g.fillStyle = rnd() < .5 ? 'rgba(90,60,30,.07)' : 'rgba(255,250,235,.1)'; g.fillRect(0, rnd() * S, S, .5 + rnd() * 1.5); }
  for (let i = 0; i < 40; i++) blob(g, rnd() * S, rnd() * S, 6 + rnd() * 18, 'rgba(110,80,40,.12)');
  return c;
 }
 function gripCanvas() {
  const S = 64, c = cvs(S, S), g = c.getContext('2d');
  g.fillStyle = '#5a321c'; g.fillRect(0, 0, S, S);
  for (let i = -S; i < S * 2; i += 12) { const gr = g.createLinearGradient(i, 0, i + 12, 0); gr.addColorStop(0, '#3a1e0e'); gr.addColorStop(.5, '#8a5634'); gr.addColorStop(1, '#3a1e0e'); g.fillStyle = gr; g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 12, 0); g.lineTo(i + 12 + S * .5, S); g.lineTo(i + S * .5, S); g.fill(); }
  return c;
 }
 function knitCanvas() {
  const S = 64, c = cvs(S, S), g = c.getContext('2d');
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, S, S);
  for (let x = 0; x < S; x += 4) { g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(x, 0, 1.5, S); }
  speck(g, S, S, 300, ['rgba(0,0,0,.08)', 'rgba(255,255,255,.1)'], 1, 2);
  return c;
 }

 const faceT = tex(faceCanvas()), armT = tex(armCanvas()), irisT = tex(irisCanvas()), hairT = tex(hairCanvas());
 const mouthC = mouthCanvas(), metalT = tex(metalCanvas(), 2, 2);
 const leatherN = tex(heightCanvas(128, 128, (x, y) => Math.sin(x * .7 + Math.sin(y * .31) * 2) * .3 + Math.sin(y * .9 + x * .13) * .25 + (rnd() - .5) * .5, 1.4), 3, 3);
 const dents = []; for (let i = 0; i < 28; i++) dents.push([rnd() * 128, rnd() * 128, 5 + rnd() * 9]);
 const hammerN = tex(heightCanvas(128, 128, (x, y) => { let v = 0; for (const d of dents) for (const ox of [-128, 0, 128]) for (const oy of [-128, 0, 128]) { const r = Math.hypot(x - d[0] - ox, y - d[1] - oy) / d[2]; if (r < 1) v -= (1 - r * r) * .6; } return v + (rnd() - .5) * .06; }, 1.6), 2, 2);
 const nv2 = (k) => new THREE.Vector2(k, k);
 const std = (c, r, x) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: r, metalness: 0 }, x || {}));
 const M = {
  face: std(0xffffff, .6, { map: faceT, emissive: 0x2c160c }),
  skin: std(0xffffff, .62, { map: armT, emissive: 0x2c160c }),
  skinS: std(0xeaa47c, .62, { emissive: 0x2c160c }),
  hair: std(0xd24c22, .5, { map: hairT, emissive: 0x2a0c04 }),
  hair2: std(0xaa3a1a, .55, { map: hairT, emissive: 0x200803 }),
  hairCap: std(0x8a3216, .62, { map: hairT, emissive: 0x1a0602 }),
  brow: std(0x7a3218, .7, { emissive: 0x1a0804 }),
  eyeW: std(0xfffaf4, .35, { emissive: 0x5c5650 }),
  iris: std(0xffffff, .3, { map: irisT, emissiveMap: irisT, emissive: 0x6c5c4c }),
  lid: std(0xffffff, .6, { vertexColors: true, emissive: 0x24120a }),
  mouth: std(0xffffff, .6, { map: tex(mouthC), transparent: true, depthWrite: false, emissive: 0x2a140c, polygonOffset: true, polygonOffsetFactor: -2 }),
  mouth2: null, lip: std(0xb8604c, .6, { emissive: 0x2a0c08 }),
  bronze: std(0xb98a4a, .4, { metalness: .4, map: metalT, normalMap: hammerN, normalScale: nv2(.35), emissive: 0x33200a }),
  bronzeDk: std(0x8a6232, .5, { metalness: .3, emissive: 0x1e1206 }),
  gold: std(0xf3bb4c, .28, { metalness: .45, emissive: 0x442a08 }),
  leather: std(0x603820, .62, { normalMap: leatherN, normalScale: nv2(.6), emissive: 0x1a0c04 }),
  leatherDk: std(0x4a2a16, .7, { normalMap: leatherN, normalScale: nv2(.5), emissive: 0x140804 }),
  glove: std(0x5e3620, .58, { normalMap: leatherN, normalScale: nv2(.5), emissive: 0x160a04 }),
  linen: std(0xffffff, .85, { map: tex(linenCanvas(), 2, 2), emissive: 0x2a2620 }),
  tabard: std(0xffffff, .72, { map: tex(tabardCanvas()), emissive: 0x2a1004, side: THREE.DoubleSide }),
  bodice: std(0xffffff, .66, { map: tex(bodiceCanvas()), emissive: 0x1e0c04 }),
  cape: std(0xffffff, .78, { map: tex(capeCanvas()), emissive: 0x0e1224 }),
  lining: std(0xa8845a, .6, { map: tex(liningCanvas()), metalness: .08, emissive: 0x0a0601, side: THREE.BackSide }),
  legging: std(0x4e352a, .85, { map: tex(knitCanvas(), 6, 6), emissive: 0x120a08 }),
  sole: std(0x2e1c12, .8, { emissive: 0x0c0604 }),
  steel: std(0xe2e6ee, .2, { metalness: .55, emissive: 0x2c2c34 }),
  grip: std(0xffffff, .6, { map: tex(gripCanvas(), 1, 5), emissive: 0x140804 }),
  edge: std(0xffd896, .3, { metalness: .2, emissive: 0x000000 }),
  stone: std(0xff9c2a, .15, { emissive: 0xff6a10, emissiveIntensity: .55 })
 };
 M.mouth2 = M.mouth.clone(); M.mouth2.map = M.mouth.map.clone(); M.mouth2.map.needsUpdate = true;

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

 // ---------- skeleton (54 bones) ----------
 const root = new THREE.Group(); root.name = 'Sol';
 const bones = [], BI = {};
 function bone(name, parent, x, y, z) { const b = new THREE.Bone(); b.name = name; b.position.set(x, y, z); parent.add(b); BI[name] = bones.length; bones.push(b); return b; }
 const pelvis = bone('pelvis', root, 0, .97, 0);
 const spine = bone('spine', pelvis, 0, .11, 0);
 const chest = bone('chest', spine, 0, .15, 0);
 const neck = bone('neck', chest, 0, .195, -.008);
 const head = bone('head', neck, 0, .095, .008);
 const braid = [];
 { let p = head; const off = [[0, .045, -.108], [0, -.07, -.05], [0, -.088, -.012], [0, -.088, -.004], [0, -.088, 0], [0, -.088, 0]];
  for (let i = 0; i < 6; i++) { p = bone('braid' + i, p, off[i][0], off[i][1], off[i][2]); braid.push(p); } }
 const TUFT = ['tuftR', 'tuftL', 'tuftF', 'tuftC'];
 const tufts = [bone('tuftR', head, -.1, .075, .02), bone('tuftL', head, .1, .075, .02), bone('tuftF', head, .0, .2, .085), bone('tuftC', head, .0, .225, -.05)];
 const arms = [], elbows = [], wrists = [], fing = [], thumb = [];
 for (const sd of [-1, 1]) {
  const s = bone('shoulder' + sd, chest, .195 * sd, .165, -.01);
  const e = bone('elbow' + sd, s, 0, -.285, 0);
  const w = bone('wrist' + sd, e, 0, -.255, 0);
  const f1 = bone('fing1' + sd, w, -sd * .004, -.088, 0), f2 = bone('fing2' + sd, f1, 0, -.045, 0), f3 = bone('fing3' + sd, f2, 0, -.03, 0);
  const t1 = bone('thumb1' + sd, w, -sd * .006, -.032, .03), t2 = bone('thumb2' + sd, t1, 0, -.036, .008);
  arms.push(s); elbows.push(e); wrists.push(w); fing.push([f1, f2, f3]); thumb.push([t1, t2]);
 }
 const pauld = bone('pauld', arms[1], .04, .035, 0);
 const legs = [], knees = [], ankles = [], toes = [];
 for (const sd of [-1, 1]) {
  const h = bone('hip' + sd, pelvis, .095 * sd, -.06, 0);
  const k = bone('knee' + sd, h, 0, -.415, .008);
  const a = bone('ankle' + sd, k, 0, -.41, -.012);
  const t = bone('toe' + sd, a, 0, -.06, .135);
  legs.push(h); knees.push(k); ankles.push(a); toes.push(t);
 }
 const tabF = [bone('tabF1', pelvis, 0, .04, .128)]; tabF.push(bone('tabF2', tabF[0], 0, -.24, .012));
 const tabB = [bone('tabB1', pelvis, 0, .03, -.132)]; tabB.push(bone('tabB2', tabB[0], 0, -.21, -.012));
 root.updateMatrixWorld(true);
 const bw = (b) => { b.getWorldPosition(_v); return [_v.x, _v.y, _v.z]; };
 const HW = bw(head);

 // ---------- skin weight functions (bind pose, world space) ----------
 function wTorso(x, y) {
  let w;
  if (y > 1.17) { const t = sm(1.17, 1.27, y); w = [[BI.spine, 1 - t], [BI.chest, t]]; }
  else if (y > 1.0) { const t = sm(1.0, 1.1, y); w = [[BI.pelvis, 1 - t], [BI.spine, t]]; }
  else w = [[BI.pelvis, 1]];
  const ax = Math.abs(x);
  if (y > 1.24 && ax > .11) { const k = sm(.11, .17, ax) * sm(1.24, 1.36, y) * .45; for (const e of w) e[1] *= 1 - k; w.push([BI['shoulder' + (x < 0 ? -1 : 1)], k]); }
  return w;
 }
 function wNeck(x, y) {
  if (y < 1.45) { const t = sm(1.4, 1.45, y); return [[BI.chest, 1 - t], [BI.neck, t]]; }
  const t = sm(1.5, 1.55, y); return [[BI.neck, 1 - t], [BI.head, t]];
 }
 function wLeg(x, y) {
  const sd = x < 0 ? -1 : 1, H = BI['hip' + sd], K = BI['knee' + sd], A = BI['ankle' + sd];
  if (y > .84) { const t = sm(.97, .86, y); return [[BI.pelvis, 1 - t], [H, t]]; }
  if (y > .44) { const t = sm(.55, .45, y); return [[H, 1 - t], [K, t]]; }
  const t = sm(.13, .07, y); return [[K, 1 - t], [A, t]];
 }
 function wFoot(x, y, z) {
  const sd = x < 0 ? -1 : 1, K = BI['knee' + sd], A = BI['ankle' + sd], T = BI['toe' + sd];
  const tk = sm(.1, .15, y), tt = sm(.085, .15, z);
  return [[K, tk], [A, (1 - tk) * (1 - tt)], [T, (1 - tk) * tt]];
 }
 function wArm(x, y) {
  const sd = x < 0 ? -1 : 1, S = BI['shoulder' + sd], E = BI['elbow' + sd], Wr = BI['wrist' + sd];
  if (y > 1.36) { const t = sm(1.46, 1.37, y); return [[BI.chest, (1 - t) * .6], [S, 1 - (1 - t) * .6]]; }
  if (y > 1.155) return [[S, 1]];
  if (y > 1.06) { const t = sm(1.155, 1.07, y); return [[S, 1 - t], [E, t]]; }
  if (y > .875) return [[E, 1]];
  const t = sm(.875, .85, y); return [[E, 1 - t], [Wr, t]];
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

 // ---------- head: a lathe of sculpted cross-sections with soft features ----------
 const HC = [0, 1.622, .006];
 const HPL = [[.03, .094, .108, .114], [-.01, .093, .11, .113], [-.04, .088, .108, .104], [-.065, .081, .103, .092], [-.088, .072, .096, .072], [-.106, .065, .088, .052], [-.121, .054, .08, .036], [-.133, .039, .071, .024], [-.141, .018, .06, .012], [-.145, .0, .046, .0]];
 const HB = [[0, -.028, .1, .026, .006], [0, -.05, .12, .013, .011], [-.17, -.057, .07, .009, .004], [.17, -.057, .07, .009, .004],
  [-.43, -.008, .17, .02, -.007], [.43, -.008, .17, .02, -.007], [-.4, .024, .25, .012, .003], [.4, .024, .25, .012, .003],
  [-.6, -.055, .22, .028, .006], [.6, -.055, .22, .028, .006], [0, -.077, .17, .007, .004], [0, -.09, .15, .007, .0035], [0, -.128, .2, .014, .004]];
 function hprof(y) {
  if (y >= .03) { const k = Math.sqrt(Math.max(0, 1 - ((y - .03) / .102) ** 2)); return [.094 * k, .108 * k, .114 * k]; }
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
 add(surf(Q(64, 32), Q(48, 24), (u, v, o) => { headR((u - .25) * TAU, lerp(.132, -.145, v), o); o[0] += HC[0]; o[1] += HC[1]; o[2] += HC[2]; }, true), M.face, BI.head);
 add(lathe([[.043, 1.57], [.045, 1.5], [.049, 1.44], [.058, 1.4]], Q(20), { cz: -.012, sub: 2 }), M.skinS, wNeck);
 // ears with small gold hoops
 for (const sd of [-1, 1]) {
  const e = hp(sd * 1.5, -.025, .004).p, q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, sd * .25, sd * .12));
  const L = (v) => [e[0] + v[0], e[1] + v[1], e[2] + v[2]];
  add(new THREE.SphereGeometry(1, Q(14), Q(10)), M.skinS, BI.head, L([sd * .005, .002, -.006]), null, [.008, .025, .016], q);
  add(new THREE.SphereGeometry(1, Q(10), Q(8)), M.lip, BI.head, L([sd * .0105, .003, -.004]), null, [.0035, .015, .009], q);
  add(new THREE.TorusGeometry(.016, .0042, Q(6), Q(14), PI * 1.1), M.skinS, BI.head, L([sd * .009, .006, -.008]), [0, sd * PI / 2 + sd * .25, PI * .05]);
  add(new THREE.SphereGeometry(.0068, Q(8), Q(6)), M.skinS, BI.head, L([sd * .007, -.019, -.002]));
  add(new THREE.TorusGeometry(.0072, .0015, Q(5), Q(16)), M.gold, BI.head, L([sd * .009, -.03, .003]), [0, PI / 2 + sd * .3, 0]);
 }

 // ---------- face: eyes with real lids, brows, painted mouth shapes ----------
 const face = new THREE.Group(); head.add(face);
 const SX = .0248, SY = .0218, SZ = .0094, IRX = .0158, IRY = .0174;
 const EF = [];
 for (const sd of [-1, 1]) {
  const s = hp(sd * .43, -.008, -.0032);
  const zA = s.n.clone().lerp(new THREE.Vector3(0, 0, 1), .55).normalize(), xA = new THREE.Vector3().crossVectors(YA, zA).normalize(), yA = new THREE.Vector3().crossVectors(zA, xA);
  EF.push({ sd, m: new THREE.Matrix4().makeBasis(xA, yA, zA).setPosition(s.p[0] - HW[0], s.p[1] - HW[1], s.p[2] - HW[2]) });
 }
 const zS = (x, y) => SZ * Math.sqrt(Math.max(0, 1 - (x / SX) ** 2 - (y / SY) ** 2));
 {
  const gs = [];
  for (const f of EF) {
   const g = new THREE.SphereGeometry(1, Q(22), Q(14)); g.scale(SX, SY, SZ);
   const p = g.attributes.position, col = new Float32Array(p.count * 3);
   for (let i = 0; i < p.count; i++) { const k = 1 - .32 * sm(.0, SY, p.getY(i)) - .05 * sm(-.4 * SY, -SY, p.getY(i)); col[i * 3] = k; col[i * 3 + 1] = k * .97; col[i * 3 + 2] = k * .95; }
   g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.applyMatrix4(f.m); gs.push(g);
  }
  const g = mergeGeos(gs); const col = new Float32Array(g.attributes.position.count * 3); let o = 0; for (const s of gs) { col.set(s.attributes.color.array, o); o += s.attributes.color.array.length; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  M.eyeW.vertexColors = true; face.add(new THREE.Mesh(g, M.eyeW));
 }
 // irises: one mesh, vertices re-seated on the eyeball when the gaze moves
 const ir = { base: null, g: null, nper: 0, ox: [9, 9], oy: [9, 9] };
 {
  const rg = new THREE.RingGeometry(0, 1, Q(28, 12), 4), gs = [EF[0], EF[1]].map(() => rg.clone()); ir.nper = rg.attributes.position.count;
  ir.base = Float32Array.from(rg.attributes.position.array);
  ir.g = mergeGeos(gs); face.add(new THREE.Mesh(ir.g, M.iris));
  const nm = ir.g.attributes.normal;
  for (let e = 0; e < 2; e++) { _v.setFromMatrixColumn(EF[e].m, 2).normalize(); for (let i = 0; i < ir.nper; i++) nm.setXYZ(e * ir.nper + i, _v.x, _v.y, _v.z); }
 }
 function setGaze(ox, oy) {
  const p = ir.g.attributes.position;
  for (let e = 0; e < 2; e++) {
   if (Math.abs(ox - ir.ox[e]) < 1e-5 && Math.abs(oy - ir.oy[e]) < 1e-5) continue;
   ir.ox[e] = ox; ir.oy[e] = oy;
   for (let i = 0; i < ir.nper; i++) {
    const X = ir.base[i * 3] * IRX + ox, Y = ir.base[i * 3 + 1] * IRY + oy;
    _v.set(X, Y, zS(X, Y) + .0004).applyMatrix4(EF[e].m); p.setXYZ(e * ir.nper + i, _v.x, _v.y, _v.z);
   }
  }
  p.needsUpdate = true;
 }
 // lids and lashes: vertex colored, morph target 0 closes them
 let lidMesh, browMesh;
 {
  const P = [], PC = [], C = [], I = [], U = [];
  const skin = [.88, .6, .45], crease = [.8, .5, .38], lash = [.12, .055, .04], lowL = [.42, .2, .13];
  const put = (f, x, y, yc, zl, col) => {
   const z = Math.max(zS(x, y) + .0011, .0029) + zl, zc = Math.max(zS(x, yc) + .0011, .0029) + zl;
   _v.set(x, y, z).applyMatrix4(f.m); P.push(_v.x, _v.y, _v.z);
   _v.set(x, yc, zc).applyMatrix4(f.m); PC.push(_v.x, _v.y, _v.z); C.push(col[0], col[1], col[2]); U.push(0, 0);
  };
  const grid = (nx, ny, fn, flip) => {
   const b = P.length / 3;
   for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) fn(i / nx, j / ny);
   for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = b + j * (nx + 1) + i, c = a + nx + 1; if (flip) I.push(a, a + 1, c, a + 1, c + 1, c); else I.push(a, c, a + 1, a + 1, c, c + 1); }
  };
  for (const f of EF) {
   const sd = f.sd, xo = (x) => x * sd;
   const yE = (x) => SY * (.72 - .38 * x * x + .06 * xo(x)), yC = (x) => SY * (-.5 + .22 * x * x), yT = (x) => SY * (1.3 - .25 * x * x);
   grid(Q(14, 8), 5, (s, r) => { const x = lerp(-1.1, 1.1, s), X = x * SX; put(f, X, lerp(yT(x), yE(x), r), lerp(yT(x), yC(x), r), 0, r > .7 ? crease : skin); });
   grid(Q(18, 10), 2, (s, r) => {
    const o = lerp(-1.02, 1.34, s), x = o * sd, xc = Math.min(1, Math.abs(o)) * Math.sign(x), X = x * SX;
    const wing = Math.max(0, o - .98), th = .0026 * (o > .85 ? Math.max(.18, 1 - (o - .85) / .55) : 1) * (o < -.85 ? .45 : 1);
    const y0 = (o <= .98 ? yE(x) : yE(xc) + wing * .036), y1 = (o <= .98 ? yC(x) : yC(xc) - wing * .01);
    put(f, o > .98 ? xc * SX + sd * wing * SX * .9 : X, y0 - r * th, y1 - r * th * .7, .0011, lash);
   }, sd < 0);
   grid(Q(12, 6), 1, (s, r) => { const o = lerp(-.72, .96, s), x = o * sd, y = -SY * (.8 - .36 * x * x) - r * .0011; put(f, x * SX, y, y + .0004, .0006, lowL); }, sd < 0);
   grid(Q(12, 6), 3, (s, r) => { const x = lerp(-1.08, 1.08, s), y0 = -SY * (.8 - .36 * x * x) - .0011, y = lerp(y0, -SY * 1.22, r); put(f, x * SX, y, y, 0, skin); });
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
  g.setIndex(I); g.computeVertexNormals();
  g.morphAttributes.position = [new THREE.Float32BufferAttribute(PC, 3)];
  M.lid.morphTargets = true; lidMesh = new THREE.Mesh(g, M.lid); lidMesh.morphTargetInfluences = [0]; face.add(lidMesh);
 }
 {
  const mk = (frown) => {
   const gs = [];
   for (const sd of [-1, 1]) {
    const k = frown ? 1 : 0;
    const pts = [hp(sd * (.12 + .03 * k), .027 - .009 * k, .0035).p, hp(sd * .27, .038 - .003 * k, .004).p, hp(sd * .45, .041 + .002 * k, .004).p, hp(sd * .64, .03 + .003 * k, .003).p];
    gs.push(place(tube(pts.map((p) => [p[0] - HW[0], p[1] - HW[1], p[2] - HW[2]]), Q(12, 6), Q(6, 4), (t) => .0052 * Math.pow(1 - t, .6) + .0011, .42, (c, n) => n.set(c.x - HC[0] + HW[0], c.y - HC[1] + HW[1], c.z - HC[2] + HW[2])), null));
   }
   return mergeGeos(gs);
  };
  const g = mk(false); g.morphAttributes.position = [mk(true).attributes.position];
  M.brow.morphTargets = true; browMesh = new THREE.Mesh(g, M.brow); browMesh.morphTargetInfluences = [0]; face.add(browMesh);
 }
 const mouths = [];
 {
  const g = surf(Q(10, 6), Q(5, 3), (u, v, o) => { const s = hp(lerp(-.31, .31, u), lerp(-.072, -.094, v), .0012); o[0] = s.p[0] - HW[0]; o[1] = s.p[1] - HW[1]; o[2] = s.p[2] - HW[2]; });
  for (const mat of [M.mouth, M.mouth2]) { mat.map.repeat.set(.25, 1); const m = new THREE.Mesh(g, mat); m.renderOrder = 3; face.add(m); mouths.push(m); }
 }

 // ---------- hair: a scalp cap and layered, chunky tousled locks ----------
 const tmpS = [0, 0, 0];
 function scalpPt(az, el, off) { headR(az, el >= 0 ? .132 * Math.sin(Math.min(el, 1.565)) : .145 * Math.sin(Math.max(el, -1.2)), tmpS); tmpS[1] += .006; const L = Math.hypot(tmpS[0], tmpS[1], tmpS[2]), k = (L + off) / L; return [HC[0] + tmpS[0] * k, HC[1] + tmpS[1] * k, HC[2] + tmpS[2] * k]; }
 {
  const elMin = (az) => { const a = Math.abs(az); return a < 1.45 ? lerp(.5, .05, sm(.25, 1.45, a)) : lerp(.05, -.62, sm(1.45, PI, a)); };
  add(surf(Q(48, 24), Q(16, 8), (u, v, o) => { const az = lerp(-PI, PI, u), p = scalpPt(az, lerp(PI / 2, elMin(az), v), .006); o[0] = p[0]; o[1] = p[1]; o[2] = p[2]; }, true), M.hairCap, BI.head);
 }
 const HUP = (c, n) => n.set(c.x - HC[0], c.y - HC[1] + .025, c.z - HC[2]);
 function lock(az0, el0, az1, el1, o) {
  const n = 7, pts = [];
  for (let i = 0; i <= n; i++) {
   const t = i / n, az = lerp(az0, az1, t) + (o.bend || 0) * Math.sin(PI * t), el = lerp(el0, el1, t) + (o.arc || 0) * Math.sin(PI * t);
   pts.push(scalpPt(az, el, lerp(o.r0 === undefined ? -.004 : o.r0, o.r1 === undefined ? .03 : o.r1, t) + (o.bulge || 0) * Math.sin(PI * Math.min(1, t * 1.15))));
  }
  if (o.flick) { const f = o.flick; for (const [i, k] of [[n, 1], [n - 1, .4], [n - 2, .1]]) { pts[i][0] += f[0] * k; pts[i][1] += f[1] * k; pts[i][2] += f[2] * k; } }
  const ns = Q(o.seg || 14, 7), nr = Q(o.rs || 8, 5), w0 = o.w || .045, tp = o.taper || .55;
  const g = tube(pts, ns, nr, (t) => w0 * Math.pow(1 - t, tp) * (.8 + .2 * Math.sin(PI * Math.min(1, t * 2))) + .0012, o.flat || .3, HUP);
  const tf = o.tuft === undefined ? -1 : o.tuft, amt = o.amt || .8;
  add(g, o.mat || (rnd() < .5 ? M.hair : M.hair2), tf < 0 ? BI.head : (x, y, z, i) => { const k = amt * sm(.12, 1, Math.floor(i / (nr + 1)) / ns); return [[BI.head, 1 - k], [BI[TUFT[tf]], k]]; });
 }
 const out = (az, k, up) => [Math.sin(az) * k, up || 0, Math.cos(az) * k];
 // crown: three rings sweeping outward and down, tips curling out
 [[16, 1.12, .042, .03, .05], [14, 1.34, .05, .022, .048], [7, 1.47, .05, .006, .04]].forEach(([N, el0, r1, bul, w], ring) => {
  for (let k = 0; k < N; k++) {
   const az = -PI + (k + .5 + ring * .33) / N * TAU + (rnd() - .5) * .12, a = Math.abs(az);
   if (a < .7 && ring < 2) continue;
   const el1 = a < 1.6 ? lerp(.36, .1, sm(.7, 1.6, a)) : lerp(.1, -.3, sm(1.6, PI, a));
   lock(az, el0, az + (rnd() - .5) * .35, el1 + ring * .16, { r1, bulge: bul, w: w * (.9 + rnd() * .25), flick: out(az, .016, .01 + rnd() * .012), tuft: a > 2.2 ? 3 : -1, mat: ring === 1 ? M.hair : rnd() < .5 ? M.hair : M.hair2 });
  }
 });
 // bangs, swept from a part over her right eye toward her left, ending at the brows
 [[-.5, 1.0, -.26, .3, .046, .016], [-.32, 1.08, -.02, .24, .05, .016], [-.14, 1.12, .22, .26, .05, .016], [.04, 1.06, .44, .22, .048, .017], [.22, .98, .66, .12, .044, .02], [-.66, .9, -.6, .02, .04, .022], [.42, .9, .9, -.12, .04, .026], [-.42, .98, -.42, .12, .036, .02]].forEach((b, i) => {
  lock(b[0], b[1], b[2], b[3], { w: b[4], r1: b[5], bulge: .02, arc: .1, flick: [.004, -.002, .012], tuft: 2, amt: .55, mat: i % 2 ? M.hair2 : M.hair });
 });
 lock(-.34, 1.2, -.08, .6, { w: .044, r1: .05, bulge: .02, flick: [.0, .018, .018], tuft: 2, mat: M.hair });
 lock(.04, 1.26, .28, .62, { w: .044, r1: .05, bulge: .02, flick: [.01, .02, .016], tuft: 2, mat: M.hair });
 // sides: temple locks, a full puff above the ear, locks behind it; tips flick outward
 for (const sd of [-1, 1]) {
  const T = sd < 0 ? 0 : 1;
  lock(sd * .92, .66, sd * 1.06, -.5, { w: .04, r1: .022, bulge: .02, flick: [sd * .012, -.004, .012], tuft: T });
  lock(sd * 1.15, .74, sd * 1.32, -.3, { w: .048, r1: .042, bulge: .03, flick: [sd * .026, .004, .006], tuft: T });
  lock(sd * 1.42, .78, sd * 1.52, .08, { w: .052, r1: .058, bulge: .03, flick: [sd * .028, .012, -.004], tuft: T, mat: M.hair });
  lock(sd * 1.78, .66, sd * 1.95, -.48, { w: .05, r1: .04, bulge: .03, flick: [sd * .024, -.004, -.01], tuft: T });
  lock(sd * 2.15, .6, sd * 2.3, -.48, { w: .05, r1: .04, bulge: .028, flick: [sd * .02, -.006, -.014], tuft: T });
  lock(sd * 1.6, .95, sd * 1.75, .18, { w: .05, r1: .06, bulge: .024, flick: [sd * .028, .018, -.008], tuft: T, mat: M.hair });
  lock(sd * 1.0, .9, sd * 1.2, .2, { w: .046, r1: .052, bulge: .02, flick: [sd * .024, .014, .01], tuft: T, mat: M.hair2 });
 }
 // back: locks to the nape, leaving room for the braid underneath
 for (let k = 0; k < 10; k++) {
  const az = PI + (k - 4.5) * .19 + (rnd() - .5) * .08, b = (k - 4.5) / 4.5;
  lock(az, .8 - Math.abs(b) * .15, az + b * .22, -.52 - (1 - Math.abs(b)) * .1, { w: .05, r1: .034, bulge: .03, flick: [b * .02, -.004, -.02], tuft: 3, amt: .5 });
 }

 // ---------- the braid: chunky lobes, gold bands, a spiral gold cord and a loose tuft ----------
 const BJ = braid.map(bw); BJ.push([BJ[5][0], BJ[5][1] - .088, BJ[5][2]]);
 {
  const wB = wChain(braid.map((b) => b.name), BJ, 'head', .7);
  const cv = new THREE.CatmullRomCurve3(BJ.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
  const T = new THREE.Vector3(), C = new THREE.Vector3(), Xl = new THREE.Vector3(1, 0, 0), N = new THREE.Vector3(), mtx = new THREE.Matrix4();
  const frame = (s) => { cv.getPointAt(s, C); cv.getTangentAt(s, T); N.crossVectors(Xl, T).normalize(); };
  const NL = Q(16, 10);
  for (let k = 0; k < NL; k++) {
   const s = .06 + k / (NL - 1) * .76, side = k % 2 ? 1 : -1, sc = lerp(1.0, .74, s); frame(s);
   const ax = T.clone().applyAxisAngle(N, side * .62), lat = new THREE.Vector3().crossVectors(ax, N).normalize();
   mtx.makeBasis(lat, ax, N);
   add(new THREE.SphereGeometry(1, Q(12, 8), Q(8, 6)), k % 3 ? M.hair : M.hair2, wB, [C.x + side * .0085 * sc, C.y, C.z], null, [.02 * sc, .033 * sc, .016 * sc], new THREE.Quaternion().setFromRotationMatrix(mtx));
  }
  const cpts = []; for (let i = 0; i <= 12; i++) { frame(.03 + i / 12 * .82); cpts.push([C.x, C.y, C.z]); }
  add(tube(cpts, Q(24, 12), Q(8, 5), (t) => .0145 * lerp(1, .72, t), 1, (c, n) => n.set(0, 0, -1)), M.hair2, wB);
  for (const [s, r, h] of [[.035, .0245, .032], [.845, .0185, .024]]) {
   frame(s); const q = new THREE.Quaternion().setFromUnitVectors(YA, T);
   add(new THREE.CylinderGeometry(r, r, h, Q(18, 10), 1, true), M.gold, wB, [C.x, C.y, C.z], null, null, q);
   for (const e of [-.5, .5]) add(new THREE.TorusGeometry(r, .0024, Q(5, 4), Q(18, 10)), M.gold, wB, [C.x + T.x * h * e, C.y + T.y * h * e, C.z + T.z * h * e], null, null, q.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), PI / 2)));
  }
  frame(.86); const c0 = C.clone();
  for (let i = 0; i < 7; i++) {
   const dx = (i - 3) * .009, dz = (i % 2 ? 1 : -1) * .006;
   add(tube([[c0.x + dx * .3, c0.y, c0.z], [c0.x + dx * .8, c0.y - .04, c0.z + dz], [c0.x + dx * 1.4, c0.y - .085 - Math.abs(i - 3) * -.004, c0.z + dz * 1.5]], Q(8, 5), Q(5, 4), (t) => .009 * Math.pow(1 - t, .8) + .0005, .6, (c, n) => n.set(0, 0, -1)), i % 2 ? M.hair : M.hair2, wB);
  }
 }

 // ---------- torso ----------
 const TP = [[1.445, .055, .05, .055], [1.425, .085, .068, .075], [1.4, .125, .085, .092], [1.37, .15, .098, .103], [1.32, .16, .11, .108], [1.26, .157, .112, .106], [1.2, .15, .106, .1], [1.14, .14, .099, .096], [1.08, .13, .094, .092], [1.02, .128, .093, .094], [.97, .14, .1, .108], [.92, .152, .104, .118], [.87, .15, .1, .115], [.84, .13, .088, .098], [.82, .06, .05, .05]];
 function crv(tab, c, y) {
  const n = tab.length; if (y >= tab[0][0]) return tab[0][c]; if (y <= tab[n - 1][0]) return tab[n - 1][c];
  let i = 0; while (i < n - 2 && y < tab[i + 1][0]) i++;
  const p0 = tab[Math.max(0, i - 1)][c], p1 = tab[i][c], p2 = tab[i + 1][c], p3 = tab[Math.min(n - 1, i + 2)][c];
  const t = (tab[i][0] - y) / (tab[i][0] - tab[i + 1][0]), t2 = t * t;
  return .5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (3 * p1 - p0 - 3 * p2 + p3) * t2 * t);
 }
 const bust = (x, y) => .019 * Math.exp(-(((Math.abs(x) - .066) / .048) ** 2) - ((y - 1.236) / .05) ** 2);
 function bodyPt(a, y, off, o) {
  const rx = crv(TP, 1, y), rf = crv(TP, 2, y), rb = crv(TP, 3, y), c = Math.cos(a), s = Math.sin(a), rz = c > 0 ? rf : rb;
  const x = s * rx; let z = c * rz; if (c > 0) z += bust(x, y) * c;
  const nx = s / rx, nz = c / rz, L = Math.hypot(nx, nz) || 1;
  o[0] = x + nx / L * off; o[1] = y; o[2] = z + nz / L * off; return o;
 }
 add(surf(Q(64, 32), Q(44, 22), (u, v, o) => bodyPt(lerp(-PI, PI, u), lerp(1.445, .82, v), 0, o), true), M.bodice, wTorso);
 // bronze half-plate over the upper chest, framing the orange front
 for (const sd of [-1, 1]) {
  const a0 = sd < 0 ? -1.62 : .72, a1 = sd < 0 ? -.72 : 1.62;
  add(slab(Q(12, 6), Q(8, 4), (u, v, o) => { const a = lerp(a0, a1, u), inner = sd < 0 ? u : 1 - u, top = lerp(1.405, 1.385, inner), bot = lerp(1.29, 1.31, inner) - .03 * Math.sin(PI * u); bodyPt(a, lerp(top, bot, v), .008 + .004 * Math.sin(PI * v), o); }, .005), M.bronze, wTorso);
  const e = []; for (let i = 0; i <= 8; i++) e.push(bodyPt(sd * .72, lerp(1.385, 1.31, i / 8), .014, [0, 0, 0]));
  add(tube(e, Q(10, 5), Q(5, 4), () => .0032, 1, null), M.gold, wTorso);
 }
 // high linen collar inside a bronze gorget, both open at the throat
 add(slab(Q(28, 14), 3, (u, v, o) => { const a = lerp(.24, TAU - .24, u), r = lerp(.064, .059, v), y = lerp(1.487, 1.425, v); o[0] = Math.sin(a) * r; o[1] = y; o[2] = Math.cos(a) * r * .92 - .008; }, .003), M.linen, wNeck);
 for (const [y0, y1, r0, r1, op] of [[1.452, 1.4, .078, .1, .42], [1.418, 1.37, .098, .13, .3]])
  add(slab(Q(32, 16), 3, (u, v, o) => { const a = lerp(op, TAU - op, u), pk = .012 * Math.max(0, 1 - Math.min(u, 1 - u) * 9); o[0] = Math.sin(a) * lerp(r0, r1, v); o[1] = lerp(y0, y1, v) - pk; o[2] = Math.cos(a) * lerp(r0, r1, v) * .86 - .008; }, .0045), M.bronze, wTorso);
 // two belts with bronze buckles
 for (const [y0, y1, off, ab] of [[1.024, .992, .013, -.3], [.978, .95, .016, .36]]) {
  add(slab(Q(48, 24), 2, (u, v, o) => bodyPt(lerp(-PI, PI, u), lerp(y0, y1, v), off, o), .004), M.leatherDk, wTorso);
  const p = bodyPt(ab, (y0 + y1) / 2, off + .006, [0, 0, 0]), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ab, 0)), yc = (y0 + y1) / 2;
  for (const [dx, dy, sx, sy] of [[-.019, 0, .005, .038], [.019, 0, .005, .038], [0, .017, .043, .005], [0, -.017, .043, .005]])
   add(new THREE.BoxGeometry(sx, sy, .006), M.bronze, wTorso, [p[0] + Math.cos(ab) * dx, yc + dy, p[2] - Math.sin(ab) * dx], null, null, q);
  add(new THREE.BoxGeometry(.004, .032, .005), M.gold, wTorso, [p[0], yc, p[2] + .002], null, null, q);
 }
 // linen underskirt; its hem follows the thighs
 const wSkirt = (x, y) => { const k = .65 * sm(.95, .72, y), sL = sm(-.05, .05, x); return [[BI.pelvis, 1 - k], [BI['hip-1'], k * (1 - sL)], [BI['hip1'], k * sL]]; };
 add(surf(Q(56, 28), Q(12, 6), (u, v, o) => { const a = lerp(-PI, PI, u), y = lerp(.995, .715 + .02 * Math.cos(a), v); bodyPt(a, Math.max(y, .88), .008 + .05 * v * v + .006 * v * Math.sin(12 * a), o); o[1] = y; }, true), M.linen, wSkirt);
 // faulds: two rows of bronze feather plates round the hips, open at the front for the tabard
 for (let row = 0; row < 2; row++) {
  const y0 = row ? .93 : .99, L = row ? .12 : .11, list = row ? [.6, .94, 1.28, 1.62, 1.96] : [.43, .77, 1.11, 1.45, 1.79, 2.1];
  for (const sd of [-1, 1]) for (const ac0 of list) {
   const ac = sd * ac0, front = sm(.2, .75, Math.cos(ac));
   const wF = (x, y, z, i) => { const k = .45 * front * sm(.92, .82, y); return [[BI.pelvis, 1 - k], [BI['hip' + sd], k]]; };
   add(slab(Q(5, 4), Q(7, 5), (u, v, o) => {
    const tw = v < .62 ? 1 : Math.sqrt(Math.max(0, 1 - ((v - .62) / .38) ** 2)) * .92 + .08;
    const a = ac + (u - .5) * .4 * tw, y = y0 - v * L;
    bodyPt(a, Math.max(y, .885), .024 + .026 * v + (row ? 0 : .01) + .005 * Math.sin(PI * u), o); o[1] = y;
   }, .0042), M.bronze, wF);
  }
 }
 // tabards, front and back: burnt orange, gold sun, a pointed hem
 const tabW = (bonesT) => (x, y) => {
  if (y > .99) return [[BI.pelvis, 1]];
  if (y > .93) { const t = sm(.99, .94, y); return [[BI.pelvis, 1 - t], [BI[bonesT[0]], t]]; }
  const t = sm(.8, .74, y); return [[BI[bonesT[0]], 1 - t], [BI[bonesT[1]], t]];
 };
 for (const back of [false, true]) {
  const Lmax = back ? .47 : .525, nu = Q(10, 6), nv = Q(22, 12);
  const g = surf(nu, nv, (u, v, o) => {
   const L = Lmax - .055 * Math.abs(2 * u - 1), y = 1.03 - v * L, hw = lerp(.062, .071, v), x = (u - .5) * 2 * hw;
   const base = back ? -(.138 + .025 * sm(.95, .62, y)) : .122 + .03 * sm(.96, .56, y);
   o[0] = x; o[1] = y; o[2] = base - (back ? -1 : 1) * 2.2 * x * x * (1 - .6 * v);
  }, false, back);
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) { const u = uv.getX(i), v = 1 - uv.getY(i); uv.setY(i, 1 - v * (Lmax - .055 * Math.abs(2 * u - 1)) / Lmax); }
  add(g, M.tabard, tabW(back ? ['tabB1', 'tabB2'] : ['tabF1', 'tabF2']));
 }

 // ---------- arms ----------
 for (const sd of [-1, 1]) {
  const cx = sd * .195, cz = -.01;
  add(lathe([[.02, 1.47], [.058, 1.457], [.077, 1.425], [.085, 1.375], [.084, 1.31], [.079, 1.245], [.07, 1.185], [.061, 1.152], [.057, 1.14]], Q(28, 14), { cx, cz, sub: 2, fn: (p, a, v) => { const k = 1 + .06 * Math.sin(8 * a + sd) * sm(.15, .6, v); p[0] = cx + (p[0] - cx) * k; p[2] = cz + (p[2] - cz) * k; } }), M.linen, wArm);
  add(new THREE.TorusGeometry(.058, .0115, Q(8, 5), Q(24, 12)), M.linen, wArm, [cx, 1.146, cz], [PI / 2, 0, 0]);
  const fa = lathe([[.041, 1.17], [.0405, 1.11], [.0435, 1.05], [.042, .99], [.036, .92], [.031, .875], [.029, .855]], Q(20, 12), { cx, cz, sub: 2 });
  const uv = fa.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, (sd < 0 ? 0 : .5) + uv.getX(i) * .5);
  add(fa, M.skin, wArm);
  add(lathe([[.052, .997], [.054, .984], [.049, .96], [.044, .92], [.04, .887], [.0385, .866]], Q(22, 12), { cx, cz, sub: 2 }), M.bronze, BI['elbow' + sd]);
  for (const [y, r] of [[.99, .053], [.869, .039]]) add(new THREE.TorusGeometry(r, .0036, Q(6, 4), Q(22, 12)), M.gold, BI['elbow' + sd], [cx, y, cz], [PI / 2, 0, 0]);
  // gloved hand: leather palm and fingers, bronze back plate and knuckles
  const W0 = bw(wrists[sd < 0 ? 0 : 1]), H = (p) => [W0[0] + p[0], W0[1] + p[1], W0[2] + p[2]];
  const wr = BI['wrist' + sd], f = ['fing1' + sd, 'fing2' + sd, 'fing3' + sd].map((n) => BI[n]);
  add(new THREE.SphereGeometry(1, Q(16, 8), Q(12, 6)), M.glove, wr, H([-sd * .002, -.05, 0]), null, [.0175, .05, .041]);
  add(new THREE.SphereGeometry(1, Q(12, 6), Q(8, 5)), M.glove, wr, H([-sd * .008, -.036, .022]), null, [.012, .026, .014]);
  add(slab(Q(6, 3), Q(5, 3), (u, v, o) => { const z = lerp(-.035, .035, u); o[0] = W0[0] + sd * (.0155 + .006 * Math.cos(PI * (u - .5))); o[1] = W0[1] + lerp(-.008, -.08, v); o[2] = W0[2] + z; }, .003), M.bronze, wr);
  const zs = [.026, .0088, -.0088, -.026], ls = [.97, 1, .95, .8];
  for (let k = 0; k < 4; k++) {
   const z = zs[k], s = ls[k], r = .0092 * (k === 3 ? .86 : 1), x = -sd * .004;
   const j = [[x, -.088, z], [x, -.088 - .045 * s, z], [x, -.088 - .075 * s, z], [x, -.088 - .098 * s, z]].map(H);
   seg(M.glove, f[0], j[0], j[1], r, r * .95, Q(8, 5), true);
   seg(M.glove, f[1], j[1], j[2], r * .95, r * .88, Q(8, 5), true);
   seg(M.glove, f[2], j[2], j[3], r * .88, r * .8, Q(8, 5), true);
   add(new THREE.SphereGeometry(1, Q(8, 5), Q(6, 4)), M.bronze, f[0], H([x + sd * .006, -.1, z]), null, [.006, .016, .0085]);
  }
  add(new THREE.CylinderGeometry(.008, .008, .075, Q(8, 5)), M.bronze, f[0], H([sd * .008, -.088, 0]), [PI / 2, 0, 0], [.8, 1, 1]);
  const t1 = BI['thumb1' + sd], t2 = BI['thumb2' + sd], tb = [[-sd * .006, -.032, .03], [-sd * .006, -.068, .038], [-sd * .006, -.094, .042]].map(H);
  seg(M.glove, t1, tb[0], tb[1], .0105, .0095, Q(8, 5), true);
  seg(M.glove, t2, tb[1], tb[2], .0095, .0085, Q(8, 5), true);
 }

 // ---------- pauldrons: a kestrel-feather fan on the left, banded plates on the right ----------
 for (const sd of [-1, 1]) {
  const C = [sd * .205, 1.398, -.008], R = sd > 0 ? .096 : .089, Pz = new THREE.Vector3(sd * .5, 1, 0).normalize();
  const E1 = new THREE.Vector3(0, 0, 1), E2 = new THREE.Vector3().crossVectors(Pz, E1).normalize(), D = new THREE.Vector3();
  const S = BI['shoulder' + sd], wP = [[BI.chest, .25], [S, .75]];
  add(slab(Q(28, 14), Q(8, 5), (u, v, o) => { const al = u * TAU, be = v * (sd > 0 ? 1.18 : 1.08); D.copy(Pz).multiplyScalar(Math.cos(be)).addScaledVector(E1, Math.cos(al) * Math.sin(be)).addScaledVector(E2, Math.sin(al) * Math.sin(be)); o[0] = C[0] + D.x * R; o[1] = C[1] + D.y * R; o[2] = C[2] + D.z * R * 1.12; }, .006), M.bronze, () => wP);
  if (sd < 0) {
   for (let k = 0; k < 3; k++) add(slab(Q(16, 8), 3, (u, v, o) => { const ph = lerp(-1.45, 1.45, u), r = .09 + .006 * k + .013 * v, y = 1.372 - .031 * k - .046 * v; o[0] = C[0] - Math.cos(ph) * r; o[1] = y; o[2] = C[2] + Math.sin(ph) * r * 1.08; }, .0045), M.bronze, () => [[BI.chest, .12], [S, .88]]);
   continue;
  }
  // sun boss
  const bd = new THREE.Vector3(.55, .62, .56).normalize(), bp = [C[0] + .052, C[1] + .066, C[2] + .05], bq = new THREE.Quaternion().setFromUnitVectors(YA, bd);
  add(new THREE.CylinderGeometry(.029, .031, .009, Q(22, 10)), M.gold, () => wP, bp, null, null, bq);
  add(new THREE.SphereGeometry(.014, Q(12, 6), Q(8, 4)), M.gold, () => wP, [bp[0] + bd.x * .004, bp[1] + bd.y * .004, bp[2] + bd.z * .004], null, null, bq.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0)));
  for (let k = 0; k < 12; k++) {
   const a = k / 12 * TAU, L = k % 2 ? .011 : .018, dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a)).applyQuaternion(bq);
   add(new THREE.ConeGeometry(.0045, L, 4), M.gold, () => wP, [bp[0] + dir.x * (.03 + L / 2), bp[1] + dir.y * (.03 + L / 2), bp[2] + dir.z * (.03 + L / 2)], null, null, new THREE.Quaternion().setFromUnitVectors(YA, dir));
  }
  // three rows of long bronze feathers fanning down and back
  const F = new THREE.Vector3(), N = new THREE.Vector3(), Sv = new THREE.Vector3();
  [[7, .11, .08, .035], [7, .138, .074, .01], [6, .165, .068, -.015]].forEach(([n, L, rad, yo], row) => {
   for (let k = 0; k < n; k++) {
    const be = lerp(-.85, 1.2, (k + .5 * (row % 2)) / (n - .5)), rt = [C[0] + Math.cos(be) * rad * .9, C[1] + yo, C[2] + Math.sin(be) * rad];
    F.set(.45 + .08 * row, -1, .42 * Math.sin(be) + .12).normalize();
    N.set(Math.cos(be), .28, Math.sin(be)).normalize(); N.addScaledVector(F, -N.dot(F)).normalize(); Sv.crossVectors(F, N);
    const len = L * (1 + .12 * Math.sin(be)), Wd = .021;
    add(slab(Q(4, 3), Q(8, 5), (u, v, o) => {
     const w = Wd * (v < .7 ? lerp(.62, 1, sm(0, .45, v)) : Math.sqrt(Math.max(0, 1 - ((v - .7) / .3) ** 2)) * .95 + .05), s = (u - .5) * 2;
     const lift = .005 * (1 - s * s) + .02 * v * v;
     o[0] = rt[0] + F.x * v * len + Sv.x * s * w + N.x * lift; o[1] = rt[1] + F.y * v * len + Sv.y * s * w + N.y * lift; o[2] = rt[2] + F.z * v * len + Sv.z * s * w + N.z * lift;
    }, .0035), row === 1 ? M.bronzeDk : M.bronze, BI.pauld);
   }
  });
 }

 // ---------- legs: leggings, knee cops, greaves, boots, sabatons ----------
 for (const sd of [-1, 1]) {
  const cx = sd * .095;
  add(lathe([[.07, .975], [.092, .93], [.091, .86], [.085, .77], [.075, .67], [.065, .585], [.059, .53], [.057, .48], [.058, .43]], Q(24, 12), { cx, cz: .004, sub: 2, fn: (p) => { if ((p[0] - cx) * sd < 0) p[0] = cx + (p[0] - cx) * .84; } }), M.legging, wLeg);
  add(lathe([[.056, .448], [.059, .39], [.058, .31], [.051, .23], [.046, .16], [.047, .12], [.05, .1]], Q(22, 12), { cx, cz: .002, sub: 2 }), M.leather, wLeg);
  const kw = [[BI['hip' + sd], .45], [BI['knee' + sd], .55]];
  add(slab(Q(14, 8), Q(8, 5), (u, v, o) => { const a = lerp(-1.35, 1.35, u), y = lerp(.575, .445, v), r = .06 + .013 * Math.sin(PI * v) + .006 * Math.cos(a) ** 6; o[0] = cx + Math.sin(a) * r; o[1] = y; o[2] = .012 + Math.cos(a) * r; }, .005), M.bronze, () => kw);
  add(slab(Q(7, 4), Q(5, 3), (u, v, o) => { const a = lerp(-1.0, 1.0, u), r = .012 + .032 * v; o[0] = cx + sd * (.068 + .008 * v); o[1] = .51 + Math.sin(a) * r; o[2] = .004 + Math.cos(a) * r * .9; }, .0035), M.bronze, () => kw);
  for (const [y0, y1, r0] of [[.615, .58, .07], [.448, .418, .064]]) add(slab(Q(12, 6), 2, (u, v, o) => { const a = lerp(-1.25, 1.25, u), r = r0 + .004 * v; o[0] = cx + Math.sin(a) * r; o[1] = lerp(y0, y1, v); o[2] = .006 + Math.cos(a) * r; }, .004), M.bronze, () => (y0 > .5 ? [[BI['hip' + sd], .8], [BI['knee' + sd], .2]] : [[BI['knee' + sd], 1]]));
  add(slab(Q(16, 8), Q(10, 5), (u, v, o) => {
   const a = lerp(-1.4, 1.4, u), y = lerp(.4, .14, v), br = crv([[.448, .056], [.39, .059], [.31, .058], [.23, .051], [.16, .046], [.12, .047]], 1, y);
   const r = br + .006 + .005 * Math.cos(a) ** 10 + .007 * sm(.37, .4, y), cz = lerp(-.004, .008, (y - .085) / .41);
   o[0] = cx + Math.sin(a) * r; o[1] = y; o[2] = cz + Math.cos(a) * r;
  }, .0045), M.bronze, wLeg);
  const A0 = bw(ankles[sd < 0 ? 0 : 1]), Fp = (p) => [A0[0] + p[0], A0[1] + p[1], A0[2] + p[2]], wf = wFoot;
  // boot: one sculpted shell (heel, instep, rounded toe box), a sole, a heel block and a bronze toe cap
  const li = (tab, x) => { for (let i = 1; i < tab.length; i++) if (x <= tab[i][0]) return lerp(tab[i - 1][1], tab[i][1], cl((x - tab[i - 1][0]) / (tab[i][0] - tab[i - 1][0]), 0, 1)); return tab[tab.length - 1][1]; };
  const BW = [[-.075, .032], [-.04, .039], [0, .043], [.09, .047], [.15, .042], [.178, .034]], BT = [[-.075, -.03], [-.03, .022], [.01, .032], [.06, .002], [.11, -.028], [.178, -.052]];
  const bootPt = (u, v, off, o) => {
   const a = lerp(-PI, PI, u), z = lerp(-.075, .178, v), e = Math.sqrt(Math.max(0, 1 - Math.pow(2 * v - 1, 6))), top = li(BT, z), bot = -.079;
   const w = li(BW, z) * e + off, h = (top - bot) / 2 * Math.sqrt(e) + off, sa = Math.sin(a), ca = Math.cos(a);
   const p = Fp([Math.sign(sa) * Math.pow(Math.abs(sa), .8) * w, (top + bot) / 2 + Math.sign(ca) * Math.pow(Math.abs(ca), .8) * h, z]); o[0] = p[0]; o[1] = p[1]; o[2] = p[2];
  };
  add(surf(Q(22, 12), Q(18, 10), (u, v, o) => bootPt(u, v, 0, o), true), M.leather, wf);
  add(slab(Q(12, 6), Q(8, 5), (u, v, o) => bootPt(lerp(.27, .73, u), lerp(.8, .995, v), .002, o), .0035), M.bronze, wf);
  add(slab(Q(10, 6), Q(14, 8), (u, v, o) => { const z = lerp(-.078, .182, v), e = Math.sqrt(Math.max(0, 1 - Math.pow(2 * v - 1, 6))), p = Fp([lerp(-1, 1, u) * (li(BW, z) * e + .005), -.077, z]); o[0] = p[0]; o[1] = p[1]; o[2] = p[2]; }, .009), M.sole, wf);
  add(new THREE.CylinderGeometry(.03, .032, .02, Q(12, 6)), M.sole, wf, Fp([0, -.075, -.045]));
 }

 // ---------- cape: midnight blue, gold lining, hangs from the shoulders behind the arms ----------
 const CT = .34 * PI;
 function capePt(u, v, o) {
  const tp = lerp(-CT, CT, u), s = Math.sin(tp), c = Math.pow(Math.abs(Math.cos(tp)), .35);
  if (v < .1) {
   const k = v / .1, kk = sm(0, 1, k);
   o[0] = s * lerp(.1, .24, kk); o[2] = -c * lerp(.078, .138, kk); o[1] = lerp(1.457 - .04 * s * s, 1.398 - .03 * s * s, k) + .012 * Math.sin(PI * k);
  } else {
   const k = (v - .1) / .9, yH = .48 - .055 * s ** 4 + .012 * Math.cos(6 * tp), fold = (.016 * Math.sin(6.5 * tp + 1.0) + .007 * Math.sin(13 * tp + .3)) * Math.pow(k, 1.2);
   const rx = lerp(.24, .31, Math.pow(k, 1.1)) + fold, rz = lerp(.138, .232, Math.pow(k, .85)) + fold;
   o[0] = s * rx; o[2] = -c * rz - .012 * Math.sin(PI * Math.min(1, k * 2.2)); o[1] = lerp(1.398 - .03 * s * s, yH, k);
  }
  return o;
 }
 const chW = bw(chest), capeU = [], capeL = [], capeTip = [];
 for (let k = 0; k < 5; k++) {
  const u = k / 4, a = capePt(u, .1, [0, 0, 0]), b = capePt(u, .56, [0, 0, 0]), t = capePt(u, 1, [0, 0, 0]);
  const U = bone('capeU' + k, chest, a[0] - chW[0], a[1] - chW[1], a[2] - chW[2]); const L = bone('capeL' + k, U, b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  capeU.push(U); capeL.push(L); capeTip.push(new THREE.Vector3(t[0] - b[0], t[1] - b[1], t[2] - b[2]));
 }
 {
  const nu = Q(44, 22), nv = Q(32, 16), g = surf(nu, nv, capePt, false, true);
  const wC = (x, y, z, i) => {
   const u = (i % (nu + 1)) / nu, v = Math.floor(i / (nu + 1)) / nv, f = Math.min(3.999, u * 4), k0 = Math.floor(f), fr = f - k0;
   const t1 = sm(.08, .2, v), t2 = sm(.48, .64, v);
   return [[BI.chest, 1 - t1], [BI['capeU' + k0], t1 * (1 - t2) * (1 - fr)], [BI['capeU' + (k0 + 1)], t1 * (1 - t2) * fr], [BI['capeL' + k0], t1 * t2 * (1 - fr)], [BI['capeL' + (k0 + 1)], t1 * t2 * fr]];
  };
  add(g, M.cape, wC); add(g, M.lining, wC);
  const top = []; for (let i = 0; i <= 16; i++) { const p = capePt(i / 16, .004, [0, 0, 0]); top.push([p[0], p[1] + .004, p[2] - .002]); }
  add(tube(top, Q(32, 16), Q(6, 4), () => .0062, 1, null), M.gold, BI.chest);
  const cp = capePt(.5, .02, [0, 0, 0]);
  add(new THREE.CylinderGeometry(.022, .022, .008, Q(18, 8)), M.gold, BI.chest, [cp[0], cp[1] - .012, cp[2] - .006], [PI / 2 - .3, 0, 0]);
 }

 // ---------- the sunsteel sword, built along +Y with the edge toward +Z, then put in her right fist ----------
 const GRIP = new THREE.Matrix4().compose(new THREE.Vector3(.03, -.08, .02), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), PI / 2), new THREE.Vector3(1, 1, 1));
 const SWB = new THREE.Matrix4().multiplyMatrices(wrists[0].matrixWorld, GRIP);
 const swAdd = (geo, mat, p, r, s, q) => { let g = place(geo, p, r, s, q); if (g === geo) g = geo.clone(); g.applyMatrix4(SWB); add(g, mat, BI['wrist-1']); };
 const BL0 = .07, BL1 = .975;
 const spineZ = (y) => { const t = sm(.84, BL1, y); return lerp(-.021, .016, t * t); };
 const edgeZ = (y) => lerp(.03 - .006 * (y - BL0) / (BL1 - BL0), .016, sm(.9, BL1, y));
 const thick = (y) => lerp(.0034, .0011, sm(.75, BL1, y));
 const bladeFace = (side, u0, u1, lift) => surf(3, Q(28, 14), (u, v, o) => { const y = lerp(BL0, BL1, v), uu = lerp(u0, u1, u); o[0] = side * (thick(y) * (1 - uu * uu) + lift); o[1] = y; o[2] = lerp(spineZ(y), edgeZ(y), uu); }, false, side < 0);
 for (const sd of [-1, 1]) {
  swAdd(bladeFace(sd, 0, 1, 0), M.steel);
  swAdd(bladeFace(sd, .78, 1, .0005), M.edge);
  swAdd(surf(1, 8, (u, v, o) => { const y = lerp(.09, .7, v), zc = lerp(spineZ(y), edgeZ(y), .3); o[0] = sd * (thick(y) * .92 + .0005); o[1] = y; o[2] = zc + (u - .5) * .005; }, false, sd < 0), M.gold);
 }
 swAdd(surf(1, Q(28, 14), (u, v, o) => { const y = lerp(BL0, BL1, v); o[0] = lerp(-1, 1, u) * thick(y); o[1] = y; o[2] = spineZ(y); }), M.steel);
 swAdd(new THREE.CylinderGeometry(.024, .024, .02, Q(20, 10)), M.gold, [0, .055, 0], [0, 0, PI / 2]);
 swAdd(new THREE.TorusGeometry(.034, .0046, Q(6, 4), Q(26, 12)), M.gold, [0, .055, 0], [0, PI / 2, 0]);
 for (const s of [-1, 1]) {
  swAdd(new THREE.ConeGeometry(.0095, .085, Q(8, 4)), M.gold, [0, .055, s * .079], [s * PI / 2, 0, 0], [1, 1, .62]);
  swAdd(new THREE.SphereGeometry(.0085, Q(8, 5), Q(6, 4)), M.gold, [0, .055, s * .037]);
 }
 swAdd(new THREE.ConeGeometry(.009, .042, Q(8, 4)), M.gold, [0, .106, .004], null, [.5, 1, 1]);
 for (let k = 0; k < 8; k++) {
  const a = (k + .5) / 8 * TAU, dy = Math.sin(a), dz = Math.cos(a);
  if (Math.abs(dy) > .85) continue;
  swAdd(new THREE.ConeGeometry(.0055, .03, 4), M.gold, [0, .055 + dy * .05, dz * .05], null, null, new THREE.Quaternion().setFromUnitVectors(YA, new THREE.Vector3(0, dy, dz)));
 }
 swAdd(new THREE.SphereGeometry(.0158, Q(14, 8), Q(10, 6)), M.stone, [0, .055, 0], null, [.92, 1, 1]);
 swAdd(lathe([[.0146, .047], [.0158, .0], [.0163, -.06], [.0157, -.12], [.0148, -.163]], Q(14, 8), { sub: 3 }), M.grip);
 for (const y of [.046, -.162]) swAdd(new THREE.TorusGeometry(.0158, .003, Q(5, 4), Q(16, 8)), M.gold, [0, y, 0], [PI / 2, 0, 0]);
 swAdd(new THREE.CylinderGeometry(.011, .013, .016, Q(12, 6)), M.gold, [0, -.17, 0]);
 swAdd(new THREE.CylinderGeometry(.025, .025, .016, Q(20, 10)), M.gold, [0, -.192, 0], [0, 0, PI / 2]);
 swAdd(new THREE.SphereGeometry(.0115, Q(12, 6), Q(8, 5)), M.gold, [0, -.192, 0], null, [1.05, 1, 1]);
 for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, dy = Math.sin(a), dz = Math.cos(a), L = k % 2 ? .009 : .014; swAdd(new THREE.ConeGeometry(.0042, L, 4), M.gold, [0, -.192 + dy * (.025 + L / 2), dz * (.025 + L / 2)], null, null, new THREE.Quaternion().setFromUnitVectors(YA, new THREE.Vector3(0, dy, dz))); }

 // ---------- bind ----------
 root.updateMatrixWorld(true);
 const skeleton = new THREE.Skeleton(bones);
 const skinned = []; buildSkinned(root, skeleton, skinned);
 setGaze(0, 0);

 // ---------- effects in world space (the scene adds fx) ----------
 const fx = new THREE.Group(); fx.name = 'SolFX';
 const addB = (map, color, x) => Object.assign({ map, color, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }, x || {});
 function softC(inner, mid) { const c = cvs(128, 128), g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, inner); gr.addColorStop(.4, mid); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return c; }
 function haloC() {
  const S = 256, c = cvs(S, S), g = c.getContext('2d'), m = S / 2;
  let gr = g.createRadialGradient(m, m, 20, m, m, m); gr.addColorStop(0, 'rgba(255,240,200,.5)'); gr.addColorStop(.42, 'rgba(255,200,110,.22)'); gr.addColorStop(1, 'rgba(255,160,60,0)');
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, L = i % 2 ? .7 : .97, w = i % 2 ? .035 : .05; g.fillStyle = i % 2 ? 'rgba(255,214,140,.5)' : 'rgba(255,238,190,.75)'; g.beginPath(); g.moveTo(m + Math.cos(a - w) * 52, m + Math.sin(a - w) * 52); g.lineTo(m + Math.cos(a) * m * L, m + Math.sin(a) * m * L); g.lineTo(m + Math.cos(a + w) * 52, m + Math.sin(a + w) * 52); g.fill(); }
  g.strokeStyle = 'rgba(255,246,214,.95)'; g.lineWidth = 5; g.shadowColor = '#ffcf7a'; g.shadowBlur = 14; g.beginPath(); g.arc(m, m, 50, 0, TAU); g.stroke();
  g.lineWidth = 2; g.beginPath(); g.arc(m, m, 62, 0, TAU); g.stroke();
  return c;
 }
 function shimmerC() {
  const c = cvs(64, 128), g = c.getContext('2d');
  for (let y = 0; y < 128; y += 2) {
   const env = Math.sin(PI * y / 128) ** 1.5, x0 = 32 + 6 * Math.sin(y * .09) + 3 * Math.sin(y * .23 + 1), a = (.05 + .07 * Math.sin(y * .05 + .5) ** 2) * env;
   const gr = g.createLinearGradient(x0 - 22, 0, x0 + 22, 0); gr.addColorStop(0, 'rgba(255,220,170,0)'); gr.addColorStop(.5, 'rgba(255,220,170,' + a.toFixed(3) + ')'); gr.addColorStop(1, 'rgba(255,220,170,0)');
   g.fillStyle = gr; g.fillRect(x0 - 22, y, 44, 2);
  }
  return c;
 }
 const glowT = tex(softC('rgba(255,255,255,1)', 'rgba(255,255,255,.3)')), emberT = tex(softC('rgba(255,255,255,1)', 'rgba(255,240,200,.5)'));
 const bladeGlow = new THREE.Sprite(new THREE.SpriteMaterial(addB(glowT, 0xff9a3a))); bladeGlow.renderOrder = 6; fx.add(bladeGlow);
 const stoneGlow = new THREE.Sprite(new THREE.SpriteMaterial(addB(glowT, 0xffb050))); stoneGlow.renderOrder = 7; fx.add(stoneGlow);
 const tipFlare = new THREE.Sprite(new THREE.SpriteMaterial(addB(glowT, 0xfff0c0))); tipFlare.renderOrder = 8; fx.add(tipFlare);
 const shimmerT = tex(shimmerC());
 const shimmer = new THREE.Sprite(new THREE.SpriteMaterial(addB(shimmerT, 0xffd8a8))); shimmer.renderOrder = 6; fx.add(shimmer);
 const aura = new THREE.Sprite(new THREE.SpriteMaterial(addB(tex(softC('rgba(255,170,90,.7)', 'rgba(255,120,40,.25)')), 0xff8030))); aura.renderOrder = 1; fx.add(aura);
 const halo = new THREE.Sprite(new THREE.SpriteMaterial(addB(tex(haloC()), 0xffe2a8))); halo.renderOrder = 1; fx.add(halo);
 const sunL = new THREE.PointLight(0xffa040, 0, 4.5, 2); fx.add(sunL);
 // trail: an additive ribbon of the last 14 tip positions
 const TRN = 14, trPos = new Float32Array(TRN * 6), trCol = new Float32Array(TRN * 6), trIdx = [];
 for (let i = 0; i < TRN - 1; i++) { const a = i * 2; trIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
 const trGeo = new THREE.BufferGeometry();
 trGeo.setAttribute('position', new THREE.BufferAttribute(trPos, 3)); trGeo.setAttribute('color', new THREE.BufferAttribute(trCol, 3)); trGeo.setIndex(trIdx);
 const trail = new THREE.Mesh(trGeo, new THREE.MeshBasicMaterial({ vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
 trail.frustumCulled = false; trail.renderOrder = 6; trail.visible = false; fx.add(trail);
 const trTip = [], trMid = []; for (let i = 0; i < TRN; i++) { trTip.push(new THREE.Vector3()); trMid.push(new THREE.Vector3()); }
 // embers and sparks
 const NE = 48, eP = new Float32Array(NE * 3), eC = new Float32Array(NE * 3), eV = new Float32Array(NE * 3), eL = new Float32Array(NE), eM = new Float32Array(NE);
 const eGeo = new THREE.BufferGeometry(); eGeo.setAttribute('position', new THREE.BufferAttribute(eP, 3)); eGeo.setAttribute('color', new THREE.BufferAttribute(eC, 3));
 const embers = new THREE.Points(eGeo, new THREE.PointsMaterial({ size: .045, map: emberT, vertexColors: true, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
 embers.frustumCulled = false; embers.renderOrder = 7; fx.add(embers);
 let eNext = 0;
 function emit(p, vx, vy, vz, life) { const i = eNext; eNext = (eNext + 1) % NE; eP[i * 3] = p.x; eP[i * 3 + 1] = p.y; eP[i * 3 + 2] = p.z; eV[i * 3] = vx; eV[i * 3 + 1] = vy; eV[i * 3 + 2] = vz; eL[i] = life; eM[i] = life; }
 function stepEmbers(dt) {
  for (let i = 0; i < NE; i++) {
   if (eL[i] <= 0) { eC[i * 3] = eC[i * 3 + 1] = eC[i * 3 + 2] = 0; continue; }
   eL[i] -= dt; const k = Math.max(0, eL[i] / eM[i]);
   eV[i * 3 + 1] += (eM[i] < .5 ? -4.5 : .9) * dt; eV[i * 3] *= 1 - dt * 1.5; eV[i * 3 + 2] *= 1 - dt * 1.5;
   eP[i * 3] += eV[i * 3] * dt; eP[i * 3 + 1] += eV[i * 3 + 1] * dt; eP[i * 3 + 2] += eV[i * 3 + 2] * dt;
   eC[i * 3] = k; eC[i * 3 + 1] = .55 * k * k + .12 * k; eC[i * 3 + 2] = .12 * k * k * k;
  }
  eGeo.attributes.position.needsUpdate = true; eGeo.attributes.color.needsUpdate = true;
 }
 // sword-space points
 const TIP = new THREE.Vector3(0, .965, .017), MIDB = new THREE.Vector3(0, .5, .005), BASEB = new THREE.Vector3(0, .12, .004), STONE = new THREE.Vector3(0, .055, 0);
 const swM = new THREE.Matrix4();
 const swordMatrix = () => swM.multiplyMatrices(wrists[0].matrixWorld, GRIP);

 // ---------- motion: poses are flat objects of channels ----------
 // pelvis offset y/x/z and rotations; spine s, chest c, neck n, head h (YXZ euler);
 // feet as IK targets in root space (r/l F x y z, yaw r, pitch p); sword grip g, blade dir d, edge e (root space), elbow poles;
 // left hand: two = on the hilt, lik = reach for lt, lbl = palm on the blade; FK fallback lS/lE/lW; finger curls; face br/bl/mo.
 const D3 = (x, y, z) => { const l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };
 const READY = {
  y: -.045, x: 0, z: 0, pX: .06, pY: -.32, pZ: 0, sX: .02, sY: .06, sZ: 0, cX: .04, cY: .14, cZ: 0, nX: 0, nY: .05, hX: .03, hY: .08, hZ: 0,
  rFx: -.15, rFy: 0, rFz: -.13, rFr: -.62, rFp: 0, lFx: .12, lFy: 0, lFz: .15, lFr: .12, lFp: 0,
  gx: -.04, gy: .98, gz: .3, dx: .1, dy: .36, dz: .93, ex: 0, ey: -.93, ez: .36,
  rPx: -.8, rPy: -.45, rPz: -.35,
  two: 1, lik: 0, lbl: 0, ltx: .2, lty: .95, ltz: .1, lPx: .8, lPy: -.45, lPz: -.25,
  lSX: -.1, lSY: 0, lSZ: .15, lE: -.3, lWX: 0, lWZ: 0,
  fR: 1, fL: 1, br: .12, bl: 0, mo: 0
 };
 const CH = Object.keys(READY).filter((k) => k !== 'mo');
 const cp = (a, b) => { for (const k of CH) a[k] = b[k]; a.mo = b.mo; return a; };
 const mix = (a, b, w) => { if (w <= 0) return a; for (const k of CH) a[k] += (b[k] - a[k]) * w; if (w >= .5) a.mo = b.mo; return a; };
 const GUARD = Object.assign({}, READY, {
  y: -.11, pX: .1, pY: -.18, cX: .06, cY: .06, hX: .08, hY: .1,
  rFx: -.2, rFz: -.1, rFr: -.55, lFx: .17, lFz: .17, lFr: .28,
  gx: -.25, gy: 1.2, gz: .3, dx: .97, dy: .1, dz: .2, ex: 0, ey: .25, ez: 1, rPx: -.5, rPy: -.85, rPz: -.1,
  two: 0, lik: 1, lbl: 1, lPx: .6, lPy: -.7, lPz: -.3, fL: .15, br: .6, mo: 1
 });
 function K(u, o, s) {
  const k = Object.assign({}, o || {});
  if (s) { k.gx = s[0]; k.gy = s[1]; k.gz = s[2]; const d = D3(s[3], s[4], s[5]); k.dx = d[0]; k.dy = d[1]; k.dz = d[2]; if (s.length > 6) { k.ex = s[6]; k.ey = s[7]; k.ez = s[8]; } }
  return [u, k];
 }
 const ACTS = {};
 function act(name, dur, keys, o) {
  const t = [], p = []; let prev = READY;
  for (const [u, k] of keys) { const full = Object.assign({}, prev, k); t.push(u); p.push(full); prev = full; }
  ACTS[name] = Object.assign({ dur, t, p, hits: [], hold: false, interrupt: false, bi: .12, bo: .16, dash: null }, o || {});
 }
 function evalKeys(def, u, out) {
  const T = def.t, Pk = def.p, n = T.length;
  let i = 0; while (i < n - 2 && u > T[i + 1]) i++;
  const t0 = T[i], t1 = T[i + 1], f = cl((u - t0) / (t1 - t0), 0, 1), ia = Math.max(0, i - 1), id = Math.min(n - 1, i + 2);
  const a = Pk[ia], b = Pk[i], c = Pk[i + 1], d = Pk[id], ta = T[ia], td = T[id], h = t1 - t0;
  const f2 = f * f, f3 = f2 * f, h00 = 2 * f3 - 3 * f2 + 1, h10 = f3 - 2 * f2 + f, h01 = 3 * f2 - 2 * f3, h11 = f3 - f2;
  for (const k of CH) {
   const m0 = (c[k] - a[k]) / Math.max(1e-6, t1 - ta) * h, m1 = (d[k] - b[k]) / Math.max(1e-6, td - t0) * h;
   out[k] = h00 * b[k] + h10 * m0 + h01 * c[k] + h11 * m1;
  }
  out.mo = f >= 1 ? c.mo : b.mo;
  return out;
 }

 // ---------- two-bone IK ----------
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

 // ---------- actions (keys inherit from the previous key; u is 0..1 through the action) ----------
 const bump = (a, b, v) => (u) => (u > a && u < b ? v * Math.sin(PI * (u - a) / (b - a)) : 0);
 const G = (o) => Object.assign({}, GUARD, o || {});
 const ONE = { two: 0, lik: 0, lSX: -.25, lSZ: .3, lE: -.45, fL: .35 };
 // the attack
 act('combo', 1.5, [
  K(0, {}),
  K(.1, { pY: -.55, cY: -.25, cX: -.06, y: -.06, br: .6, mo: 1, rPx: -.7, rPy: -.1, rPz: -.6 }, [-.22, 1.45, .12, -.25, .65, -.72, .2, .75, .6]),
  K(.22, { pY: .2, cY: .25, cX: .04, y: -.09, lFz: .24, rPx: -.8, rPy: -.5, rPz: -.2 }, [.06, 1.08, .46, .55, -.2, .81, .7, -.7, 0]),
  K(.3, { pY: .32, cY: .32 }, [.2, .92, .32, .75, -.5, .42]),
  K(.36, { pY: .36, cY: .35 }, [.22, .9, .28, .72, -.45, .35, -.3, .6, .6]),
  K(.45, { pY: -.25, cY: -.25, y: -.05, rPx: -.6, rPy: -.7, rPz: -.2 }, [-.06, 1.25, .46, -.55, .45, .7]),
  K(.53, { pY: -.38, cY: -.3 }, [-.25, 1.42, .25, -.6, .72, -.35]),
  K(.62, { pY: -.42, cY: -.2, cX: -.12, y: -.03, br: .85, rPx: -.7, rPy: -.2, rPz: -.5 }, [-.15, 1.66, .05, .1, .55, -.83, 0, .83, .55]),
  K(.72, { y: -.18, pX: .28, pY: .2, cY: .25, cX: .12, lFz: .44, rFz: -.3, mo: 2, br: 1, rPx: -.8, rPy: -.5, rPz: -.2 }, [.08, .98, .6, .35, -.5, .79]),
  K(.82, { y: -.16, pY: .32, cY: .3, mo: 1 }, [.22, .8, .42, .55, -.8, .25]),
  K(1, READY)
 ], { hits: [.22, .45, .72], dash: bump(.62, .76, 5.5), trail: [[.12, .3], [.33, .54], [.63, .84]] });

 // sword arts
 act('flareCut', 1.7, [
  K(0, {}),
  K(.2, Object.assign({}, ONE, { y: -.14, pY: -.62, cY: -.3, pX: .12, lSX: -.75, lSZ: .35, lE: -.5, fL: .15, br: .8, mo: 1, lFz: .2, rFz: -.18, rPx: -.6, rPy: -.3, rPz: -.7 }), [-.3, .78, -.08, -.35, -.3, -.89, 0, -1, 0]),
  K(.44, { y: -.18, pY: -.66 }, [-.34, .7, -.14, -.3, -.4, -.86]),
  K(.55, { y: -.04, pY: .35, cY: .3, pX: -.02, cX: -.06, lSX: .25, lSZ: .65, lE: -.25, mo: 2, rFz: -.02, rPx: -.8, rPy: -.55, rPz: 0 }, [.08, 1.3, .46, .42, .7, .58]),
  K(.64, { y: 0, pY: .45, cY: .35 }, [.25, 1.62, .18, .3, .94, -.15]),
  K(.85, { two: 1, y: -.04, pY: -.1, cY: .1, mo: 0, br: .3, rFz: -.1 }, [.04, 1.2, .3, .1, .8, .6]),
  K(1, READY)
 ], { hits: [.55], fire: [[.22, .72]], trail: [[.47, .7]] });
 act('sunder', 1.6, [
  K(0, {}),
  K(.22, { y: -.01, pX: -.1, cX: -.14, hX: -.12, pY: -.15, cY: .05, br: .7, mo: 1, lFz: .22, rPx: -.7, rPy: .2, rPz: -.5, lPx: .7, lPy: .2, lPz: -.5 }, [-.04, 1.78, -.02, 0, .3, -.95, 0, .95, .3]),
  K(.44, { y: -.03, lFz: .3 }, [-.04, 1.8, -.06, 0, .2, -.98]),
  K(.58, { y: -.21, pX: .32, cX: .18, hX: .1, mo: 2, br: 1, lFz: .44, rFz: -.26, rPx: -.7, rPy: -.55, rPz: -.1, lPx: .7, lPy: -.55, lPz: -.1 }, [0, .95, .52, 0, -.45, .89]),
  K(.68, { y: -.23 }, [0, .78, .45, 0, -.78, .62]),
  K(.88, { y: -.08, pX: .1, cX: .05, mo: 0, br: .3, lPx: .8, lPy: -.45, lPz: -.25 }, [0, .95, .3, .05, .3, .95]),
  K(1, READY)
 ], { hits: [.58], sparks: [.58], dash: bump(.44, .6, 1.6), trail: [[.46, .7]] });
 const emberKeys = [
  K(0, {}),
  K(.12, Object.assign({}, ONE, { y: -.14, pX: .38, pY: -.1, cY: 0, cX: .1, lSX: .55, lSZ: .25, lE: -.9, fL: .8, br: .8, mo: 1, rFz: -.25, lFz: .25 }), [-.3, .85, -.18, -.25, -.25, -.94, 0, -1, 0]),
  K(.2, { y: -.1, pX: .42, rFz: .22, lFz: -.28, lFy: .14, lFp: .5 }),
  K(.26, { rFz: .3, lFz: -.2, lFy: 0, lFp: 0, rFy: .02 }),
  K(.3, { pY: .32, cY: .25, pX: .2, y: -.12, lSX: -.3, lSZ: .6, lE: -.4, rFy: 0 }, [.12, 1.1, .5, .75, .05, .66]),
  K(.36, { pY: .42 }, [.25, 1.18, .32, .85, .3, -.4]),
  K(.42, { pY: -.3, cY: -.25 }, [-.12, 1.15, .5, -.72, .1, .68]),
  K(.48, { pY: -.36, y: -.06 }, [-.2, 1.55, .15, -.2, .7, -.68]),
  K(.54, { pY: .2, cY: .2, y: -.15 }, [.06, 1.0, .52, .42, -.5, .76]),
  K(.6, { pY: .36 }, [.22, .85, .3, .6, -.55, -.58]),
  K(.66, { pY: -.2, cY: -.15, y: -.04, mo: 2 }, [-.04, 1.32, .5, -.32, .72, .62]),
  K(.78, { pY: -.3, mo: 1 }, [-.2, 1.55, .2, -.3, .9, -.3]),
  K(1, READY)
 ];
 act('emberRush', 2.0, emberKeys, { hits: [.3, .42, .54, .66], dash: (u) => (u < .14 ? 0 : u < .3 ? 8 * sm(.14, .18, u) * (1 - sm(.26, .3, u)) : u < .7 ? 1.2 * (1 - sm(.62, .7, u)) : 0), fire: [[.15, .74]], fireK: .6, trail: [[.27, .72]] });
 act('solarCrest', 2.1, [
  K(0, {}),
  K(.14, { y: -.25, pX: .26, cX: .08, br: .8, mo: 1, lFz: .2, rFz: -.18 }, [-.05, .76, .26, .05, .15, .99]),
  K(.24, { y: .24, pX: .05, cX: 0, rFy: .04, lFy: .06, rFp: .6, lFp: .6 }, [-.04, 1.5, .2, 0, .7, .71]),
  K(.32, { y: .85, rFy: 1.05, lFy: 1.15, rFz: -.06, lFz: .1, rFp: .4, lFp: .3, hX: -.15 }, [-.02, 2.62, .02, 0, .85, -.5, 0, .5, .85]),
  K(.45, { y: 1.4, rFy: 1.62, lFy: 1.72, hX: -.3, cX: -.12, pX: -.08, mo: 2 }, [0, 3.28, -.05, 0, .95, -.3]),
  K(.55, { y: .75, rFy: .55, lFy: .62, hX: 0, cX: .05, pX: .1 }, [0, 2.45, .38, 0, .3, .95]),
  K(.62, { y: -.27, rFy: 0, lFy: 0, rFp: 0, lFp: 0, rFz: -.2, lFz: .3, pX: .35, cX: .15, br: 1 }, [0, .72, .56, 0, -.82, .57]),
  K(.74, { y: -.29, mo: 1 }, [0, .68, .52, 0, -.88, .47]),
  K(.9, { y: -.1, pX: .1, cX: .04, mo: 0, br: .3 }, [-.02, .95, .3, .05, .45, .89]),
  K(1, READY)
 ], { hits: [.62], sparks: [.62], dash: bump(.22, .6, 2.6), trail: [[.47, .7]], fire: [[.3, .68]], flare: [[.36, .56]] });
 act('guardStep', .5, [K(0, {}), K(.4, G({ lFz: .24, y: -.13 })), K(1, G())], { interrupt: true, bi: .06, dash: bump(0, .6, 3.0) });

 // Dawnbreaker
 act('daybreak', 1.9, [
  K(0, {}),
  K(.1, { pY: -.5, cY: -.25, y: -.05, br: .7, mo: 1 }, [-.22, 1.48, .1, -.25, .65, -.72, .2, .75, .6]),
  K(.18, { pY: .2, cY: .25, y: -.09, lFz: .24 }, [.06, 1.08, .46, .55, -.2, .81]),
  K(.25, { pY: .35, cY: .32 }, [.22, .9, .3, .72, -.45, .35]),
  K(.32, { pY: -.25, cY: -.25, y: -.05 }, [-.06, 1.25, .46, -.55, .45, .7]),
  K(.39, { pY: .3, cY: .2 }, [.2, 1.55, .15, .3, .6, -.74]),
  K(.46, { pY: -.22, cY: -.2, y: -.1 }, [-.08, 1.0, .5, -.45, -.45, .77]),
  K(.53, { pY: -.42 }, [-.25, .9, .3, -.7, -.4, -.6]),
  K(.6, { pY: .3, cY: .25, y: -.08 }, [.12, 1.12, .5, .78, .05, .62]),
  K(.7, { y: -.01, pX: -.1, cX: -.14, pY: -.15, cY: .05, lFz: .2, rPx: -.7, rPy: .2, rPz: -.5, lPx: .7, lPy: .2, lPz: -.5 }, [-.04, 1.8, -.02, 0, .35, -.94, 0, .94, .35]),
  K(.8, { y: -.21, pX: .32, cX: .18, mo: 2, br: 1, lFz: .44, rFz: -.26, rPx: -.7, rPy: -.55, rPz: -.1, lPx: .7, lPy: -.55, lPz: -.1 }, [0, .95, .55, 0, -.45, .89]),
  K(.9, { y: -.2, mo: 1 }, [0, .8, .46, 0, -.75, .66]),
  K(1, READY)
 ], { hits: [.18, .32, .46, .6, .8], sparks: [.8], dash: bump(.7, .82, 4), trail: [[.08, .64], [.72, .9]] });
 const hn = [K(0, {})], HS = [
  [{ pY: -.5, cY: -.25 }, [-.22, 1.48, .1, -.25, .65, -.72], { pY: .2, cY: .25, y: -.09 }, [.06, 1.08, .46, .55, -.2, .81]],
  [{ pY: .35, cY: .3 }, [.22, .9, .3, .72, -.45, .35], { pY: -.25, cY: -.25, y: -.05 }, [-.06, 1.25, .46, -.55, .45, .7]],
  [{ pY: .3, cY: .2 }, [.2, 1.55, .15, .3, .6, -.74], { pY: -.22, cY: -.2, y: -.1 }, [-.08, 1.0, .5, -.45, -.45, .77]],
  [{ pY: -.42 }, [-.25, .9, .3, -.7, -.4, -.6], { pY: .3, cY: .25, y: -.08 }, [.12, 1.12, .5, .78, .05, .62]],
  [{ pY: .36 }, [.22, .85, .3, .6, -.55, -.58], { pY: -.2, cY: -.15, y: -.04 }, [-.04, 1.32, .5, -.32, .72, .62]],
  [{ pY: -.42, cY: -.2, cX: -.12 }, [-.15, 1.66, .05, .1, .55, -.83], { y: -.18, pX: .28, pY: .2, cY: .25, cX: .12, mo: 2 }, [.08, .98, .6, .35, -.5, .79]]
 ];
 HS.forEach((h, i) => { const u = .12 + i * .1; hn.push(K(u - .055, Object.assign({ br: .8, mo: 1 }, h[0]), h[1])); hn.push(K(u, h[2], h[3])); });
 hn.push(K(.7, { y: -.2, pX: .2, pY: -.1, cY: .05, cX: .05, two: 1, mo: 1 }, [0, .85, .3, 0, .2, .98]));
 hn.push(K(.8, { y: .04, pX: -.06, cX: -.12, hX: -.35, lFz: .12, rFz: -.12, mo: 1 }, [0, 1.72, .15, 0, 1, .06, 0, 0, 1]));
 hn.push(K(.85, { y: .06, mo: 2, br: 1 }, [0, 1.9, .12, 0, 1, .0]));
 hn.push(K(.95, { y: .02 }, [0, 1.86, .12, 0, 1, .02]));
 hn.push(K(1, READY));
 act('highNoon', 3.2, hn, { hits: [.12, .22, .32, .42, .52, .62, .85], dash: (u) => (u > .05 && u < .62 ? .9 : 0), trail: [[.05, .66]], flare: [[.78, .97]] });
 act('transform', 2.6, [
  K(0, {}),
  K(.2, { y: -.07, hX: .28, pY: -.15, cY: .08, br: .25, bl: .75, mo: 3, rPx: -.7, rPy: -.6, rPz: .1, lPx: .7, lPy: -.6, lPz: .1 }, [0, 1.25, .22, 0, 1, .05, 0, 0, 1]),
  K(.45, { y: -.1, hX: .3 }),
  K(.6, { y: -.04, hX: -.1, bl: 0, mo: 0 }),
  K(.72, Object.assign({}, ONE, { lSX: -.2, lSZ: .55, lE: -.3, fL: .1, pY: -.4, cY: -.1 }), [-.42, 1.15, .2, -.85, -.1, .5]),
  K(.86, { two: 1, pY: -.32, cY: .14, rPx: -.8, rPy: -.45, rPz: -.35, lPx: .8, lPy: -.45, lPz: -.25 }, [-.03, 1.0, .3, .06, .55, .83, 0, -.83, .55]),
  K(1, READY)
 ], { flare: [[.18, .7]] });
 act('kestrel', 1.6, [
  K(0, {}),
  K(.2, { two: 0, lik: 1, ltx: .2, lty: 1.42, ltz: .64, lPx: .4, lPy: -.8, lPz: -.4, fL: 0, pY: -.05, cY: .12, hX: -.05, hY: .04, mo: 2, br: .65, rFz: -.18, lFz: .22 }, [-.3, .88, .18, -.15, -.45, .88, 0, -1, 0]),
  K(.6, { mo: 2, lty: 1.45 }),
  K(.75, { mo: 0, br: .3 }),
  K(1, READY)
 ]);

 // reactions
 act('hurt', .6, [
  K(0, {}),
  K(.18, { pX: -.22, cX: -.18, hX: -.25, y: -.06, mo: 2, br: 1, bl: .5 }, [-.05, .92, .22, .05, .35, .94]),
  K(.45, { pX: -.05, cX: -.05, hX: 0, mo: 3, bl: .2 }),
  K(1, READY)
 ], { interrupt: true, bi: .05, dash: (u) => (u < .4 ? -2.2 * Math.sin(PI * u / .4) : 0) });
 act('block', .45, [K(0, {}), K(.3, G({ y: -.14, pX: .04, cX: .0, mo: 1 })), K(.7, G()), K(1, READY)], { interrupt: true, bi: .05, dash: (u) => (u < .35 ? -1.2 * Math.sin(PI * u / .35) : 0) });
 const KNEEL = { y: -.43, pX: .26, pY: -.12, cX: .16, cY: .05, hX: .38, hY: 0, mo: 3, bl: .6, br: .6, rFx: -.12, rFz: -.4, rFy: 0, rFp: 1.3, rFr: -.15, lFx: .13, lFz: .34, lFr: .1, two: 0, lik: 1, ltx: .14, lty: .58, ltz: .3, lPx: .7, lPy: .1, lPz: -.6, fL: .6, rPx: -.6, rPy: -.3, rPz: -.5, gx: .02, gy: .74, gz: .38, dx: .02, dy: -1, dz: .06, ex: 0, ey: 0, ez: 1 };
 act('kneel', 1.4, [K(0, {}), K(.3, { pX: -.1, y: -.1, mo: 2, bl: .5, br: 1 }), K(.65, KNEEL), K(1, { cX: .21, hX: .46 })], { hold: true, interrupt: true });
 act('rise', 1.0, [K(0, Object.assign({}, KNEEL, { cX: .21, hX: .46 })), K(.5, { y: -.2, rFz: -.22, rFp: .4, rFx: -.14, pX: .15, cX: .08, hX: .1, lik: 0, two: 1, mo: 3, bl: .2 }, [-.02, .9, .3, .05, .4, .92]), K(1, READY)], { bi: .22 });
 act('victory', 2.0, [
  K(0, {}),
  K(.25, Object.assign({}, ONE, { pY: -.45, cY: -.2, y: -.05 }), [-.42, 1.0, .26, -.7, -.35, .62]),
  K(.45, { pY: -.35, cY: -.1 }, [-.36, 1.45, .2, -.3, .9, .3]),
  K(.65, { pY: -.25, cY: .12, y: -.03, lik: 1, ltx: .17, lty: .98, ltz: .02, lPx: .8, lPy: 0, lPz: -.6, fL: .7, hY: .16, hZ: .08, hX: -.04, mo: 0, br: 0, rFz: -.08, lFz: .12, rPx: -.6, rPy: -.7, rPz: .2 }, [-.1, 1.28, .22, -.3, .6, -.74, 0, .6, .8]),
  K(1, { hZ: .1 })
 ], { hold: true });

 // ---------- secondary motion: spring chains on 1/120 s substeps, with body colliders ----------
 head.scale.setScalar(1.07);
 const DOWN = new THREE.Vector3(0, -1, 0), PH = 1 / 120;
 const COL = []; for (let i = 0; i < 10; i++) COL.push({ a: new THREE.Vector3(), b: new THREE.Vector3(), r: 0, seg: false });
 function updateColliders() {
  chest.localToWorld(COL[0].a.set(0, .07, -.005)); COL[0].r = .152;
  spine.localToWorld(COL[1].a.set(0, 0, -.005)); COL[1].r = .128;
  pelvis.localToWorld(COL[2].a.set(0, -.05, -.005)); COL[2].r = .16;
  for (let i = 0; i < 2; i++) {
   legs[i].getWorldPosition(COL[3 + i].a); knees[i].getWorldPosition(COL[3 + i].b); COL[3 + i].r = .092; COL[3 + i].seg = true;
   knees[i].getWorldPosition(COL[5 + i].a); ankles[i].getWorldPosition(COL[5 + i].b); COL[5 + i].r = .07; COL[5 + i].seg = true;
   arms[i].getWorldPosition(COL[7 + i].a); elbows[i].getWorldPosition(COL[7 + i].b); COL[7 + i].r = .075; COL[7 + i].seg = true;
  }
  head.localToWorld(COL[9].a.set(0, .1, 0)); COL[9].r = .14;
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
  return Object.assign({ bs, offs, L: offs.map((v) => v.length()), p: offs.map(() => new THREE.Vector3()), v: offs.map(() => new THREE.Vector3()), T: offs.map(() => new THREE.Vector3()), rest: bs.map(() => new THREE.Quaternion()), K: 40, C: 5, gk: .4, cols: [], m: .02, breeze: 0, init: false }, o);
 }
 const chBraid = chain(braid, new THREE.Vector3(0, -.088, 0), { K: 42, C: 4.2, gk: .55, cols: [0, 1, 2, 9], m: .024, breeze: .006 });
 const chCape = capeU.map((b, k) => chain([b, capeL[k]], capeTip[k], { K: 36, C: 4.6, gk: .45, cols: [0, 1, 2, 3, 4, 5, 6, 7, 8], m: .032, breeze: .012 }));
 const chTabF = chain(tabF, new THREE.Vector3(0, -.27, .004), { K: 46, C: 5.5, gk: .6, cols: [3, 4], m: .022, breeze: .004 });
 const chTabB = chain(tabB, new THREE.Vector3(0, -.21, -.004), { K: 46, C: 5.5, gk: .6, cols: [2, 3, 4], m: .02 });
 const TT = [[-.02, -.07, .006], [.02, -.07, .006], [.02, -.05, .05], [0, -.03, -.075]];
 const chTuft = tufts.map((b, i) => chain([b], new THREE.Vector3(TT[i][0], TT[i][1], TT[i][2]), { K: 58, C: 5.5, gk: .12, hair: true }));
 const chPauld = chain([pauld], new THREE.Vector3(.012, -.13, 0), { K: 60, C: 5, gk: .08 });
 const CHAINS = [chBraid, ...chCape, chTabF, chTabB, ...chTuft, chPauld];
 const _cq = new THREE.Quaternion(), _cq2 = new THREE.Quaternion(), _cq3 = new THREE.Quaternion(), _cv = new THREE.Vector3(), _cw = new THREE.Vector3(), _cj = new THREE.Vector3();
 function physics(t, dt, tk, reset) {
  updateColliders();
  let ci = 0;
  for (const ch of CHAINS) {
   ci++;
   const gk = ch === chBraid ? lerp(ch.gk, -.3, tk) : ch.hair ? lerp(ch.gk, -.55, tk) : ch.gk;
   ch.bs[0].getWorldPosition(_cj);
   for (let i = 0; i < ch.bs.length; i++) {
    ch.bs[i].getWorldQuaternion(_cq); _cv.copy(ch.offs[i]).applyQuaternion(_cq).normalize().lerp(DOWN, gk);
    if (ch.breeze) { _cv.x += ch.breeze * Math.sin(t * 1.3 + ci * .9 + i); _cv.z += ch.breeze * .7 * Math.sin(t * .9 + ci * 1.7 + i * .5); }
    _cv.normalize(); ch.T[i].copy(_cj).addScaledVector(_cv, ch.L[i]); _cj.copy(ch.T[i]);
   }
   if (!ch.init || reset) { for (let i = 0; i < ch.p.length; i++) { ch.p[i].copy(ch.T[i]); ch.v[i].set(0, 0, 0); } ch.init = true; }
  }
  if (dt > 0) {
   const n = Math.max(1, Math.ceil(dt / PH - 1e-6)), h = dt / n;
   for (const ch of CHAINS) {
    const p = ch.p, v = ch.v, T = ch.T, K = ch.K, C = ch.C;
    for (let s = 0; s < n; s++) {
     for (let i = 0; i < p.length; i++) { v[i].x += (K * (T[i].x - p[i].x) - C * v[i].x) * h; v[i].y += (K * (T[i].y - p[i].y) - C * v[i].y) * h; v[i].z += (K * (T[i].z - p[i].z) - C * v[i].z) * h; p[i].addScaledVector(v[i], h); }
     ch.bs[0].getWorldPosition(_cj);
     for (let i = 0; i < p.length; i++) { _cv.subVectors(p[i], _cj); const L = _cv.length() || 1; p[i].copy(_cj).addScaledVector(_cv, ch.L[i] / L); if (ch.cols.length) collide(p[i], v[i], ch.cols, ch.m); _cj.copy(p[i]); }
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

 // ---------- applying a pose: FK spine, IK legs onto foot targets, IK arms onto the sword ----------
 const qRoot = new THREE.Quaternion(), _qa = new THREE.Quaternion(), _eu = new THREE.Euler(), _g = new THREE.Vector3(), _dw = new THREE.Vector3(), _ew = new THREE.Vector3(), _xs = new THREE.Vector3();
 const _qs = new THREE.Quaternion(), _qw = new THREE.Quaternion(), _wp = new THREE.Vector3(), _pole = new THREE.Vector3(), _tg = new THREE.Vector3(), _lq = [new THREE.Quaternion(), new THREE.Quaternion(), new THREE.Quaternion()], _tq = new THREE.Quaternion();
 const QG = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), PI / 2), QGI = QG.clone().invert();
 const GP = new THREE.Vector3().setFromMatrixPosition(GRIP), GPL = new THREE.Vector3(-GP.x, GP.y, GP.z - .02), LFC = new THREE.Vector3(0, -.095, 0);
 const LT = knees[0].position.length(), LS = ankles[0].position.length(), LU = elbows[0].position.length(), LFa = wrists[0].position.length();
 function setFingers(i, c) {
  const s = i === 0 ? 1 : -1;
  fing[i][0].rotation.set(0, 0, s * 1.3 * c); fing[i][1].rotation.set(0, 0, s * 1.5 * c); fing[i][2].rotation.set(0, 0, s * .95 * c);
  thumb[i][0].rotation.set(.3 * c, -s * .2 * c, s * .6 * c); thumb[i][1].rotation.set(0, 0, s * .75 * c);
 }
 function applyPose(P) {
  pelvis.position.set(P.x, .97 + P.y, P.z); pelvis.rotation.set(P.pX, P.pY, P.pZ, 'YXZ');
  spine.rotation.set(P.sX, P.sY, P.sZ, 'YXZ'); chest.rotation.set(P.cX, P.cY, P.cZ, 'YXZ');
  neck.rotation.set(P.nX, P.nY, 0, 'YXZ'); head.rotation.set(P.hX, P.hY, P.hZ, 'YXZ');
  for (const ch of CHAINS) for (let i = 0; i < ch.bs.length; i++) ch.bs[i].quaternion.copy(ch.rest[i]);
  arms[1].rotation.set(P.lSX, P.lSY, P.lSZ); elbows[1].rotation.set(P.lE, 0, 0); wrists[1].rotation.set(P.lWX, 0, P.lWZ);
  root.updateMatrixWorld(true); root.getWorldQuaternion(qRoot);
  for (let i = 0; i < 2; i++) {
   const c = i ? 'l' : 'r', fr = P[c + 'Fr'], fp = P[c + 'Fp'], up = Math.max(0, fp);
   _tg.set(P[c + 'Fx'], P[c + 'Fy'] + .085 * Math.cos(fp) + .13 * Math.sin(up), P[c + 'Fz'] - .13 * (1 - Math.cos(up)));
   root.localToWorld(_tg);
   _pole.set(Math.sin(fr) + (i ? .12 : -.12), 0, Math.cos(fr)).applyQuaternion(qRoot);
   const q2 = ik2(legs[i], knees[i], LT, LS, _tg, _pole, true, legFix[i][0], legFix[i][1]);
   _qa.setFromEuler(_eu.set(fp, fr, 0, 'YXZ')).premultiply(qRoot);
   ankles[i].quaternion.copy(q2).invert().multiply(_qa);
   toes[i].rotation.set(-up * .85, 0, 0);
  }
  _g.set(P.gx, P.gy, P.gz); root.localToWorld(_g);
  _dw.set(P.dx, P.dy, P.dz).normalize().applyQuaternion(qRoot);
  _ew.set(P.ex, P.ey, P.ez).applyQuaternion(qRoot); _ew.addScaledVector(_dw, -_ew.dot(_dw));
  if (_ew.lengthSq() < 1e-6) { _ew.set(0, -1, 0).addScaledVector(_dw, _dw.y); if (_ew.lengthSq() < 1e-6) _ew.set(0, 0, 1); }
  _ew.normalize(); _xs.crossVectors(_dw, _ew);
  _qs.setFromRotationMatrix(_mm.makeBasis(_xs, _dw, _ew)); _qw.copy(_qs).multiply(QGI);
  _tg.copy(GP).applyQuaternion(_qw); _tg.subVectors(_g, _tg);
  _pole.set(P.rPx, P.rPy, P.rPz).applyQuaternion(qRoot);
  let q2 = ik2(arms[0], elbows[0], LU, LFa, _tg, _pole, false);
  wrists[0].quaternion.copy(q2).invert().multiply(_qw);
  const wI = Math.max(P.two, P.lik);
  if (wI > .001) {
   _lq[0].copy(arms[1].quaternion); _lq[1].copy(elbows[1].quaternion); _lq[2].copy(wrists[1].quaternion);
   const onHilt = P.two >= P.lik;
   if (onHilt) { _tg.copy(LFC).applyQuaternion(_qs).add(_g); _tg.sub(_wp.copy(GPL).applyQuaternion(_qw)); }
   else {
    _tg.set(P.ltx, P.lty, P.ltz); root.localToWorld(_tg);
    if (P.lbl > 0) { _wp.copy(_g).addScaledVector(_dw, .5).addScaledVector(_ew, -.05); _tg.lerp(_wp, cl(P.lbl, 0, 1)); }
   }
   _pole.set(P.lPx, P.lPy, P.lPz).applyQuaternion(qRoot);
   q2 = ik2(arms[1], elbows[1], LU, LFa, _tg, _pole, false);
   if (onHilt) wrists[1].quaternion.copy(q2).invert().multiply(_qw);
   if (wI < .999) for (const [b, q] of [[arms[1], _lq[0]], [elbows[1], _lq[1]], [wrists[1], _lq[2]]]) { _tq.copy(b.quaternion); b.quaternion.copy(q).slerp(_tq, wI); }
  }
  setFingers(0, P.fR); setFingers(1, Math.max(P.fL, P.two));
  root.updateMatrixWorld(true);
 }

 // ---------- base layer: idle stance with breath, walk/run cycle, guard ----------
 const BP = {}, WP = {}, GP2 = {}, AP = {}, AP2 = {}, AP3 = {}, FIN = {}, SNAP = {};
 cp(FIN, READY); cp(SNAP, READY);
 const HALF = PI / 4.4;
 function idlePose(t, out) {
  cp(out, READY); const b = Math.sin(t * 2.0);
  out.cX += .012 * b; out.gy += .008 * Math.sin(t * 2.0 - .6); out.gz += .004 * b; out.y += .004 * Math.sin(t * 2.0 + 1);
  out.x = .008 * Math.sin(t * .6); out.pZ = .012 * Math.sin(t * .6); out.hY += .04 * Math.sin(t * .37);
  return out;
 }
 function walkPose(phase, spd, out) {
  cp(out, READY);
  const run = sm(2.6, 4.2, spd), zs = [0, 0];
  for (let i = 0; i < 2; i++) {
   const ph = ((phase + (i ? PI : 0)) % TAU + TAU) % TAU, s = ph / PI, c = i ? 'l' : 'r';
   let z, y, p;
   if (s < 1) { z = lerp(HALF / 2, -HALF / 2, s); y = 0; p = .55 * sm(.7, 1, s); }
   else { const q = s - 1; z = lerp(-HALF / 2, HALF / 2, sm(0, 1, q)); y = (.09 + .08 * run) * Math.sin(PI * q); p = lerp(.55, -.25, sm(0, .7, q)) * (1 - sm(.85, 1, q)); }
   zs[i] = z; out[c + 'Fx'] = i ? .1 : -.1; out[c + 'Fz'] = z; out[c + 'Fy'] = y; out[c + 'Fp'] = p; out[c + 'Fr'] = i ? .08 : -.08;
  }
  const sw = (zs[0] - zs[1]) / HALF;
  out.y = -.055 + .03 * Math.abs(Math.sin(phase)) - .03 * run;
  out.pX = .06 + .14 * run; out.cX = .02 + .06 * run; out.hX = -.03 - .06 * run;
  out.pY = .12 * sw; out.sY = -.05 * sw; out.cY = -.12 * sw; out.hY = .03 * sw; out.nY = 0; out.pZ = .035 * Math.cos(phase);
  out.two = 0; out.lik = 0; out.fL = .35; out.br = .1; out.mo = 0;
  out.lSX = -.42 * sw * (1 + .6 * run); out.lSY = 0; out.lSZ = .14; out.lE = -.35 - .25 * Math.max(0, sw) - .9 * run;
  const d = D3(-.12, -.42 + .3 * run, .9 - 1.4 * run);
  out.gx = -.25; out.gy = .86 + .06 * run; out.gz = .1 - .09 * sw * (1 - run) - .1 * run; out.dx = d[0]; out.dy = d[1]; out.dz = d[2]; out.ex = 0; out.ey = -1; out.ez = 0;
  out.rPx = -.6; out.rPy = -.3; out.rPz = -.75;
  return out;
 }
 // the leading edge turns toward the swing direction when the blade moves fast
 const _ev = new THREE.Vector3(), _ed = new THREE.Vector3(), _e2 = new THREE.Vector3(), _e3 = new THREE.Vector3();
 function edgeLead(def, u, P) {
  const du = .012; evalKeys(def, Math.min(1, u + du), AP3);
  _ev.set(AP3.gx + AP3.dx * .9 - P.gx - P.dx * .9, AP3.gy + AP3.dy * .9 - P.gy - P.dy * .9, AP3.gz + AP3.dz * .9 - P.gz - P.dz * .9).multiplyScalar(1 / (du * def.dur));
  const sp = _ev.length(); if (sp < 1.2) return;
  _ed.set(P.dx, P.dy, P.dz).normalize(); _ev.addScaledVector(_ed, -_ev.dot(_ed)); if (_ev.lengthSq() < 1e-6) return; _ev.normalize();
  _e2.set(P.ex, P.ey, P.ez).addScaledVector(_ed, -P.ex * _ed.x - P.ey * _ed.y - P.ez * _ed.z); if (_e2.lengthSq() < 1e-6) _e2.copy(_ev); _e2.normalize();
  const ang = Math.atan2(_e3.crossVectors(_e2, _ev).dot(_ed), _e2.dot(_ev)) * sm(1.2, 3.5, sp);
  _e3.crossVectors(_ed, _e2); _e2.multiplyScalar(Math.cos(ang)).addScaledVector(_e3, Math.sin(ang));
  P.ex = _e2.x; P.ey = _e2.y; P.ez = _e2.z;
 }

 // ---------- per-frame update ----------
 const state = { heat: 0, sunburn: 0, trance: 0 };
 const st = { init: false, px: 0, pz: 0, ph: 0, spd: 0 };
 let actv = null, gOn = false, gW = 0, dashV = 0, liftV = 0, fadeV = 1, prevU = 0, eAcc = 0, trOn = 0, rbT = 0;
 let blinkIn = 2, blinkT = -1, lookT = 1.2, gzX = 0, gzY = 0, gzTX = 0, gzTY = 0, mCur = 0, mNext = 0, mK = 1;
 const _p1 = new THREE.Vector3(), _p2 = new THREE.Vector3(), _p3 = new THREE.Vector3(), _p4 = new THREE.Vector3();
 const AMB = new THREE.Color(1.0, .45, .08), WHT = new THREE.Color(1.0, .92, .76), STL = M.steel.emissive.clone(), _col = new THREE.Color();
 const winK = (list, u) => { let k = 0; if (list) for (const r of list) k = Math.max(k, sm(r[0] - .03, r[0] + .02, u) * (1 - sm(r[1] - .03, r[1] + .02, u))); return k; };
 function animate(phase, walk, t, dt) {
  dt = dt > 0 ? Math.min(dt, .05) : 0;
  root.updateMatrixWorld();
  const rx = root.position.x, rz = root.position.z, jump = !st.init || Math.hypot(rx - st.px, rz - st.pz) > 1.2;
  if (dt > 0 && st.init) st.spd += (Math.abs(phase - st.ph) / 4.4 / dt - st.spd) * Math.min(1, dt * 6);
  st.px = rx; st.pz = rz; st.ph = phase; st.init = true;
  gW += ((gOn ? 1 : 0) - gW) * (1 - Math.exp(-(dt || .016) * 9));
  walk = cl(walk || 0, 0, 1);
  idlePose(t, BP);
  if (walk > .001) mix(BP, walkPose(phase, st.spd, WP), walk);
  if (gW > .001) { cp(GP2, GUARD); GP2.cX += .01 * Math.sin(t * 2.2); mix(BP, GP2, gW * (1 - .6 * walk)); }
  let u = 0, def = null, W = 0;
  if (actv) {
   actv.t += dt; def = actv.def; u = Math.min(1, actv.t / def.dur);
   if (u >= 1 && !def.hold) { actv = null; def = null; u = 0; }
  }
  if (def) {
   evalKeys(def, u, AP); edgeLead(def, u, AP);
   cp(AP2, SNAP); mix(AP2, AP, sm(0, def.bi, actv.t));
   W = def.hold ? 1 : 1 - sm(def.dur - def.bo, def.dur, actv.t);
   cp(FIN, BP); mix(FIN, AP2, W);
  } else if (rbT > 0) { rbT -= dt; cp(FIN, SNAP); mix(FIN, BP, 1 - Math.max(0, rbT) / .18); } else cp(FIN, BP);
  dashV = def && def.dash ? def.dash(u) * W : 0;
  liftV = Math.max(0, FIN.y + .045);
  applyPose(FIN);
  const tk = cl(+state.trance || 0, 0, 1);
  physics(t, dt, tk, jump);
  // face: blinks, gaze, brows, painted mouth shapes cross-faded
  if (dt > 0) { blinkIn -= dt; if (blinkIn <= 0 && blinkT < 0) { blinkT = 0; blinkIn = 2 + rnd() * 3.5; } }
  let bk = 0; if (blinkT >= 0) { blinkT += dt; const k = blinkT / .17; bk = k < 1 ? Math.sin(PI * k) : 0; if (k >= 1) blinkT = -1; }
  lidMesh.morphTargetInfluences[0] = Math.max(bk, cl(FIN.bl, 0, 1));
  browMesh.morphTargetInfluences[0] = cl(FIN.br, 0, 1);
  lookT -= dt; if (lookT <= 0) { lookT = .8 + rnd() * 2.2; gzTX = (rnd() - .5) * .004; gzTY = (rnd() - .5) * .002; }
  const gx = def ? 0 : gzTX, gy = def ? -.0006 : gzTY; gzX += (gx - gzX) * Math.min(1, dt * 20); gzY += (gy - gzY) * Math.min(1, dt * 20);
  setGaze(gzX, gzY + .0006);
  const mo = Math.round(FIN.mo);
  if (mo !== mNext) { mCur = mK > .5 ? mNext : mCur; mNext = mo; mK = 0; }
  mK = Math.min(1, mK + (dt || .016) * 14); if (mK >= 1) mCur = mNext;
  M.mouth.map.offset.x = mCur * .25; M.mouth2.map.offset.x = mNext * .25;
  M.mouth.opacity = (mCur === mNext ? 1 : 1 - mK) * fadeV; M.mouth2.opacity = (mCur === mNext ? 0 : mK) * fadeV;
  updateFX(def, u, t, dt, tk);
  prevU = u;
 }
 function updateFX(def, u, t, dt, tk) {
  swordMatrix();
  _p1.copy(TIP).applyMatrix4(swM); _p2.copy(MIDB).applyMatrix4(swM); _p3.copy(STONE).applyMatrix4(swM); _p4.copy(BASEB).applyMatrix4(swM);
  const heat = cl(+state.heat || 0, 0, 1), sb = state.sunburn ? 1 : 0, k1 = sm(.05, .7, heat), k2 = Math.max(sm(.7, 1, heat), tk);
  const trK = def ? winK(def.trail, u) : 0, fiK = def ? winK(def.fire, u) * (def.fireK || 1) : 0, flK = def ? winK(def.flare, u) : 0;
  _col.copy(AMB).lerp(WHT, k2).multiplyScalar(.1 + 1.0 * k1 + .6 * k2 + .6 * fiK + .6 * flK); M.edge.emissive.copy(_col);
  M.steel.emissive.copy(STL).lerp(_col.set(.5, .26, .08), .5 * Math.max(sm(.75, 1, heat), fiK * .6)).lerp(WHT, .25 * tk);
  M.stone.emissiveIntensity = .55 + 1.2 * heat + 1.0 * tk + fiK + flK;
  bladeGlow.position.copy(_p2); bladeGlow.scale.setScalar(.55 + .35 * k1 + .35 * tk + .3 * fiK); bladeGlow.material.opacity = (.26 * k1 + .22 * k2 + .35 * fiK) * fadeV;
  bladeGlow.material.color.copy(AMB).lerp(WHT, k2 * .7);
  stoneGlow.position.copy(_p3); stoneGlow.scale.setScalar(.16 + .12 * heat + .1 * tk); stoneGlow.material.opacity = (.32 + .35 * heat + .3 * tk) * fadeV;
  tipFlare.position.copy(_p1); tipFlare.scale.setScalar(.2 + 1.5 * flK); tipFlare.material.opacity = flK * fadeV;
  shimmer.position.copy(_p2).y += .12; shimmer.scale.set(.36 + .03 * Math.sin(t * 4.3), .95 + .06 * Math.sin(t * 5.1), 1); shimmer.material.rotation = .05 * Math.sin(t * 3.7); shimmer.material.opacity = (.5 * sm(.7, 1, heat) + .15 * tk) * fadeV;
  chest.localToWorld(aura.position.set(0, .0, .02)); aura.scale.setScalar(2.1 + .08 * Math.sin(t * 3.1)); aura.material.opacity = .22 * sb * (.85 + .15 * Math.sin(t * 7.3)) * fadeV;
  chest.localToWorld(halo.position.set(0, .24, -.34)); halo.scale.setScalar(1.25 + .04 * Math.sin(t * 2)); halo.material.opacity = Math.min(1, .7 * tk + .35 * flK) * fadeV; halo.material.rotation = t * .12;
  sunL.position.copy(_p2); sunL.color.copy(AMB).lerp(WHT, k2); sunL.intensity = (.3 * k1 + .9 * tk + 1.2 * fiK + 1.2 * flK) * fadeV;
  // trail
  const on = trK > .01 || fiK > .2;
  if (on && trOn === 0) for (let i = 0; i < TRN; i++) { trTip[i].copy(_p1); trMid[i].copy(_p2); }
  trOn = on ? Math.max(trK, fiK) : 0; trail.visible = on;
  if (on && dt > 0) {
   for (let i = TRN - 1; i > 0; i--) { trTip[i].copy(trTip[i - 1]); trMid[i].copy(trMid[i - 1]); }
   trTip[0].copy(_p1); trMid[0].copy(_p2);
  }
  if (on) {
   _col.copy(AMB).lerp(WHT, Math.max(k2, .25));
   const fr = fiK > .1;
   for (let i = 0; i < TRN; i++) {
    const k = trOn * Math.pow(1 - i / (TRN - 1), 1.5) * fadeV, a = trTip[i], b = trMid[i];
    trPos.set([a.x, a.y, a.z, b.x, b.y, b.z], i * 6);
    if (fr) trCol.set([k, .55 * k, .12 * k, .5 * k, .12 * k, .02 * k], i * 6);
    else trCol.set([_col.r * k, _col.g * k, _col.b * k, .3 * _col.r * k, .3 * _col.g * k, .3 * _col.b * k], i * 6);
   }
   trGeo.attributes.position.needsUpdate = true; trGeo.attributes.color.needsUpdate = true;
  }
  // embers from the blade, sparks at impacts
  if (dt > 0) {
   eAcc += dt * (70 * fiK + 10 * sm(.85, 1, heat) + 14 * tk * (.3 + trK));
   while (eAcc >= 1) { eAcc -= 1; const s = rnd(); _p3.copy(_p4).lerp(_p1, s); emit(_p3, (rnd() - .5) * .5, .35 + rnd() * .7, (rnd() - .5) * .5, .6 + rnd() * .7); }
   if (def && def.sparks) for (const h of def.sparks) if (prevU < h && u >= h) for (let i = 0; i < 18; i++) { const a = rnd() * TAU, sp = .8 + rnd() * 2.2; emit(_p1, Math.cos(a) * sp, .6 + rnd() * 2.0, Math.sin(a) * sp, .3 + rnd() * .2); }
   stepEmbers(dt);
  }
  embers.material.opacity = fadeV;
 }

 // ---------- public interface ----------
 const ACTIONS = {};
 for (const n in ACTS) { const d = ACTS[n]; ACTIONS[n] = Object.freeze({ dur: d.dur, hits: d.hits.slice(), hold: d.hold, interrupt: d.interrupt }); }
 Object.freeze(ACTIONS);
 function play(name, force) {
  const def = ACTS[name]; if (!def) return false;
  if (actv && !force && !def.interrupt && !(actv.def.hold && actv.t >= actv.def.dur - 1e-6)) return false;
  cp(SNAP, FIN); actv = { name, def, t: 0 }; prevU = 0; rbT = 0; return true;
 }
 head.scale.setScalar(1.06);
 const fadeMats = [...new Set(skinned.map((m) => m.material).concat([M.eyeW, M.iris, M.lid, M.brow]))], fadeT = fadeMats.map((m) => m.transparent);
 function setFade(f) {
  f = cl(+f, 0, 1); if (Math.abs(f - fadeV) < 1e-4) return;
  const was = fadeV < .999, now = f < .999; fadeV = f;
  fadeMats.forEach((m, i) => { m.transparent = now || fadeT[i]; m.opacity = f; if (was !== now) m.needsUpdate = true; });
  root.visible = f > .002;
 }
 const ANC = { chest: [chest, new THREE.Vector3(0, .08, .1)], head: [head, new THREE.Vector3(0, .14, .03)] };
 function anchor(name, out) {
  out = out || new THREE.Vector3();
  if (name === 'hit') return out.copy(TIP).applyMatrix4(swordMatrix());
  if (name === 'blade') return out.copy(MIDB).applyMatrix4(swordMatrix());
  if (name === 'sunstone') return out.copy(STONE).applyMatrix4(swordMatrix());
  const a = ANC[name] || ANC.chest; a[0].updateWorldMatrix(true, false); return a[0].localToWorld(out.copy(a[1]));
 }
 let tri = 0, draws = 0; const texs = new Set();
 root.traverse((o) => { if (o.isMesh) { draws++; tri += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; for (const k of ['map', 'normalMap', 'emissiveMap']) if (o.material[k]) texs.add(o.material[k].image); } });
 fx.traverse((o) => { if (o.isMesh || o.isSprite || o.isPoints) draws++; });
 animate(0, 0, 0, 0);
 return {
  root, fx, skeleton, bones, animate, play,
  guard(on) { gOn = !!on; },
  reset() { cp(SNAP, FIN); actv = null; gOn = false; gW = 0; rbT = .18; },
  get busy() { return !!actv && !(actv.def.hold && actv.t >= actv.def.dur - 1e-6); },
  get action() { return actv ? actv.name : ''; },
  get progress() { return actv ? Math.min(1, actv.t / actv.def.dur) : -1; },
  get dash() { return dashV; },
  get lift() { return liftV; },
  get state() { return state; }, set state(v) { if (v) Object.assign(state, v); },
  setFade, anchor, ACTIONS,
  stats: { triangles: Math.round(tri), bones: bones.length, drawCalls: draws, textures: texs.size }
 };
}
