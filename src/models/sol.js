// sol.js: Solenne "Sol" Kestrel, the last Ember Warden. three.js r128 (global THREE). Defines makeSol(opts) only.
// Touched up from src/models/originals/sol.js after her sheets (reference/art/sol-model.webp, which wins, and sol-model-b.webp):
// a sculpted face with sun-browned, freckled skin, amber eyes and a half-smile; copper hair cut above the ears; brushed bronze
// half-plate with gold edges and a sun on the breastplate; the burnt-orange tabard with its sun crest; a midnight-blue cape with
// a hood, gold edging, a sun on the back and a chain clasp; a blade that glows amber-gold. Fewer materials and draw calls.
// Her skeleton, every action and its timing, Heat, Sunburn and the Dawnbreaker trance are unchanged.
function makeSol(opts) {
 'use strict';
 // Units are meters, Y up, facing +Z, feet on y = 0. Her right side is -X.
 opts = opts || {};
 const DET = Math.max(.5, Math.min(1, opts.detail === undefined ? 1 : +opts.detail));
 const Q = (n, m) => Math.max(m || 3, Math.round(n * DET));
 let seed = 1778;
 const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
 const cl = (v, a, b) => (v < a ? a : v > b ? b : v);
 const sm = (a, b, x) => { const t = cl((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
 const lerp = (a, b, t) => a + (b - a) * t;
 const G2 = (dx, dy, sx, sy) => Math.exp(-(dx * dx) / (sx * sx) - (dy * dy) / (sy * sy));
 const win = (u, a, b, e) => sm(a - e, a + e, u) * (1 - sm(b - e, b + e, u));
 const TAU = Math.PI * 2, PI = Math.PI;
 const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
 const tex = (c, rx, ry) => { const t = new THREE.CanvasTexture(c); if (rx) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry || rx); } t.anisotropy = 4; return t; };

 // ---------- materials: a warm rim light on every surface, so she reads in the dark and glows with Heat ----------
 const RIM = { c: { value: new THREE.Color(1, .62, .32) }, k: { value: .1 } };
 function std(c, r, x, rimS) {
  const m = new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: r, metalness: 0 }, x || {}));
  const s = { value: rimS === undefined ? 1 : rimS };
  m.onBeforeCompile = (sh) => {
   sh.uniforms.uRimC = RIM.c; sh.uniforms.uRimK = RIM.k; sh.uniforms.uRimS = s;
   sh.fragmentShader = 'uniform vec3 uRimC;\nuniform float uRimK;\nuniform float uRimS;\n' + sh.fragmentShader.replace('#include <dithering_fragment>',
    'float rimF = 1.0 - abs(dot(normalize(normal), normalize(vViewPosition)));\n gl_FragColor.rgb += uRimC * (uRimK * uRimS * pow(rimF, 2.6));\n#include <dithering_fragment>');
  };
  m.customProgramCacheKey = () => 'sol-rim';
  return m;
 }

 // ---------- painted textures ----------
 function blob(g, x, y, r, col, sx) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, col.replace(/[\d.]+\)$/, '0)'));
  g.save(); g.translate(x, y); g.scale(sx || 1, 1); g.translate(-x, -y); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
 }
 // fine noise laid from one small tile, so no canvas is ever read back
 let NT = null;
 function grain(g, x, y, w, h, amt) {
  if (!NT) { NT = cvs(128, 128); const t = NT.getContext('2d'), id = t.createImageData(128, 128), d = id.data; for (let i = 0; i < d.length; i += 4) { d[i] = d[i + 1] = d[i + 2] = rnd() < .5 ? 0 : 255; d[i + 3] = rnd() * 255; } t.putImageData(id, 0, 0); }
  g.save(); g.globalAlpha = Math.min(1, amt / 120); g.fillStyle = g.createPattern(NT, 'repeat'); g.fillRect(x, y, w, h); g.restore();
 }
 function weave(g, x0, y0, W, H, a) { for (let i = 0; i < W * H / 80; i++) { g.fillStyle = rnd() < .5 ? 'rgba(0,0,0,' + a + ')' : 'rgba(255,255,255,' + a * .6 + ')'; g.fillRect(x0 + rnd() * W, y0 + rnd() * H, 1 + rnd() * 3, 1); } }
 // the Ember Wardens' sun: a disc in a ring, long rays up and down, shorter rays across, small rays between
 function sun(g, x, y, r, sy, fill, dark) {
  g.save(); g.translate(x, y); g.scale(1, sy || 1); g.fillStyle = fill;
  for (let i = 0; i < 16; i++) {
   const a = i / 16 * TAU - PI / 2, q = i % 4, L = q === 0 ? (i % 8 === 0 ? 3.3 : 2.4) : q === 2 ? 1.85 : 1.4, w = q === 0 ? .2 : q === 2 ? .15 : .1;
   g.beginPath(); g.moveTo(Math.cos(a - w) * r * 1.12, Math.sin(a - w) * r * 1.12); g.lineTo(Math.cos(a) * r * L, Math.sin(a) * r * L); g.lineTo(Math.cos(a + w) * r * 1.12, Math.sin(a + w) * r * 1.12); g.closePath(); g.fill();
  }
  g.beginPath(); g.arc(0, 0, r * 1.16, 0, TAU); g.fill();
  g.strokeStyle = dark; g.lineWidth = Math.max(1, r * .1); g.beginPath(); g.arc(0, 0, r * .9, 0, TAU); g.stroke();
  const gr = g.createRadialGradient(-r * .25, -r * .3, r * .1, 0, 0, r * .9); gr.addColorStop(0, 'rgba(255,244,200,.4)'); gr.addColorStop(1, 'rgba(255,244,200,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r * .9, 0, TAU); g.fill();
  g.restore();
 }
 // the lower ornament: a spear point rising out of two scrolls
 function fleur(g, x, y, h, sy, fill) {
  g.save(); g.translate(x, y); g.scale(1, sy || 1); g.fillStyle = fill; g.strokeStyle = fill; g.lineCap = 'round';
  const w = h * .17;
  g.beginPath(); g.moveTo(0, -h * .5); g.lineTo(w * .62, -h * .08); g.lineTo(w * .2, h * .02); g.lineTo(w * .2, h * .5); g.lineTo(-w * .2, h * .5); g.lineTo(-w * .2, h * .02); g.lineTo(-w * .62, -h * .08); g.closePath(); g.fill();
  g.lineWidth = Math.max(1.4, h * .05);
  for (const s of [-1, 1]) {
   g.beginPath(); g.moveTo(s * w * .2, h * .3); g.bezierCurveTo(s * w * 1.5, h * .14, s * w * 2.5, h * .34, s * w * 1.7, h * .44); g.bezierCurveTo(s * w * 1.1, h * .5, s * w * .95, h * .36, s * w * 1.35, h * .34); g.stroke();
   g.beginPath(); g.moveTo(s * w * .2, h * .12); g.quadraticCurveTo(s * w * 1.2, h * .02, s * w * 1.6, -h * .1); g.stroke();
  }
  g.beginPath(); g.moveTo(-w * .9, h * .2); g.lineTo(w * .9, h * .2); g.stroke();
  g.restore();
 }

 // skin atlas: her face painted in its front view (left half), her forearms (right half)
 const FW = 512, FS = FW / 2.2, PX = (X) => (X / 1.1 * .5 + .5) * FW, PY = (Y) => (.5 - Y / 1.1 * .5) * FW;
 const SKIN = '#c4845c';
 function skinCanvas() {
  const c = cvs(1024, 512), g = c.getContext('2d');
  g.fillStyle = SKIN; g.fillRect(0, 0, 1024, 512); grain(g, 0, 0, 1024, 512, 7);
  const B = (X, Y, r, col, sx) => blob(g, PX(X), PY(Y), r * FS, col, sx);
  B(0, .42, .5, 'rgba(222,160,118,.3)', 1.3);          // forehead
  B(0, -.12, .1, 'rgba(232,170,128,.4)', .5);          // the ridge of the nose
  B(0, -.3, .07, 'rgba(242,188,146,.36)');             // the tip of the nose catching light
  for (const s of [-1, 1]) {
   B(s * .52, -.07, .2, 'rgba(232,168,126,.36)', 1.3);  // cheekbones
   B(s * .8, .2, .28, 'rgba(118,62,38,.28)');          // temples
   B(s * .5, -.42, .17, 'rgba(126,66,42,.22)', .9);     // under the cheekbones
   B(s * .74, -.64, .28, 'rgba(104,54,34,.32)');       // the jaw turning under
   B(s * .37, .07, .21, 'rgba(100,44,24,.46)', 1.35);   // warm shadow in the sockets
   B(s * .55, .1, .11, 'rgba(84,36,20,.36)');          // deepest at the outer corners
   B(s * .36, -.1, .12, 'rgba(150,82,58,.2)', 1.5);     // under the eyes
   B(s * .1, -.21, .075, 'rgba(126,64,40,.4)', .5);     // the sides of the nose
   B(s * .075, -.385, .028, 'rgba(64,24,14,.62)');      // nostrils
   B(s * .125, -.36, .045, 'rgba(110,52,32,.35)');      // the creases of the nostril wings
   B(s * .48, -.25, .21, 'rgba(214,96,74,.2)', 1.3);    // sun on the cheeks
   B(s * .38, .24, .19, 'rgba(90,40,22,.16)', 2.2);     // under the brows
  }
  B(0, -.17, .13, 'rgba(208,96,74,.14)', 2);           // sun across the nose
  B(0, -1.04, .38, 'rgba(96,48,30,.45)', 1.5);         // under the chin
  B(0, -.55, .22, 'rgba(160,74,58,.26)', 1.9);         // lip tint under the painted mouth
  B(0, -.425, .06, 'rgba(104,46,30,.32)', 1.5);        // the shadow under the nose
  B(0, -.675, .1, 'rgba(110,52,34,.3)', 2);            // under the lower lip
  // smile lines from the nose to the corners of the mouth
  g.save(); g.strokeStyle = 'rgba(120,60,40,.12)'; g.lineWidth = 3; g.lineCap = 'round'; g.shadowColor = 'rgba(120,60,40,.25)'; g.shadowBlur = 4;
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(PX(s * .19), PY(-.39)); g.quadraticCurveTo(PX(s * .34), PY(-.45), PX(s * .35), PY(-.57)); g.stroke(); }
  g.restore();
  // freckles across the nose and cheeks
  for (let i = 0; i < 2200; i++) {
   const X = (rnd() - .5) * 1.6, Y = .02 - rnd() * .42;
   const d = Math.exp(-((Math.abs(X) - .42) ** 2) / .05) * Math.exp(-((Y + .2) ** 2) / .014) + .9 * Math.exp(-(X * X) / .014) * Math.exp(-((Y + .16) ** 2) / .008);
   if (rnd() > d * .7) continue;
   g.fillStyle = 'rgba(' + ((128 + rnd() * 30) | 0) + ',' + ((60 + rnd() * 20) | 0) + ',' + ((32 + rnd() * 12) | 0) + ',' + (.22 + rnd() * .3).toFixed(2) + ')';
   g.beginPath(); g.arc(PX(X), PY(Y), .8 + rnd() * 1.1, 0, TAU); g.fill();
  }
  // forearms: x 512-767 her right, 768-1023 her left; u runs round the arm (front at the middle), v from the elbow down
  for (let k = 0; k < 2; k++) for (let i = 0; i < 110; i++) { g.fillStyle = 'rgba(126,58,32,' + (.18 + rnd() * .2).toFixed(2) + ')'; g.beginPath(); g.arc(512 + k * 256 + rnd() * 256, rnd() * 512, .8 + rnd() * .9, 0, TAU); g.fill(); }
  // the burn scar: a branching, curling mark on her right forearm, on the side her sword grip turns outward; mostly under the vambrace
  const segs = [];
  const grow = (x, y, a, len, w, depth) => {
   for (let s = 0; s < len; s += 5) {
    const na = a + (rnd() - .5) * .7, nx = x + Math.sin(na) * 2.9, ny = y + Math.cos(na) * 5;
    segs.push([x, y, nx, ny, w * (1 - s / len * .55)]);
    if (depth > 0 && rnd() < .13) grow(nx, ny, na + (rnd() < .5 ? -1 : 1) * (.5 + rnd() * .7), len * (.28 + rnd() * .3), w * .62, depth - 1);
    x = nx; y = ny; a = na;
   }
  };
  grow(607, 16, -.05, 300, 3.4, 3); grow(625, 40, -.25, 220, 2.6, 2);
  g.lineCap = 'round';
  for (const [col, k] of [['rgba(170,78,66,.3)', 2.8], ['rgba(116,34,30,.72)', 1], ['rgba(236,156,136,.32)', .32]]) { g.strokeStyle = col; for (const s of segs) { g.lineWidth = s[4] * k; g.beginPath(); g.moveTo(s[0], s[1]); g.lineTo(s[2], s[3]); g.stroke(); } }
  g.fillStyle = SKIN; g.fillRect(992, 0, 32, 32); // a clean swatch for the neck and ears
  return c;
 }
 function irisCanvas() {
  const S = 128, c = cvs(S, S), g = c.getContext('2d'), h = S / 2;
  g.fillStyle = '#efe4d6'; g.fillRect(0, 0, S, S);
  const gr = g.createRadialGradient(h, h, 0, h, h, h);
  gr.addColorStop(0, '#2a1204'); gr.addColorStop(.3, '#8a4a0c'); gr.addColorStop(.44, '#f0aa36'); gr.addColorStop(.7, '#d48420'); gr.addColorStop(.86, '#7a3a08'); gr.addColorStop(.94, '#2a1204'); gr.addColorStop(1, '#2a1204');
  g.fillStyle = gr; g.beginPath(); g.arc(h, h, h, 0, TAU); g.fill();
  for (let i = 0; i < 90; i++) { const a = rnd() * TAU; g.strokeStyle = rnd() < .55 ? 'rgba(255,214,130,.3)' : 'rgba(90,40,6,.3)'; g.lineWidth = 1 + rnd(); g.beginPath(); g.moveTo(h + Math.cos(a) * h * .32, h + Math.sin(a) * h * .32); g.lineTo(h + Math.cos(a) * h * .86, h + Math.sin(a) * h * .86); g.stroke(); }
  g.fillStyle = '#0c0503'; g.beginPath(); g.arc(h, h, h * .29, 0, TAU); g.fill();
  const sh = g.createLinearGradient(0, 0, 0, S * .5); sh.addColorStop(0, 'rgba(30,12,4,.6)'); sh.addColorStop(1, 'rgba(30,12,4,0)'); g.fillStyle = sh; g.fillRect(0, 0, S, S * .5);
  g.fillStyle = 'rgba(255,255,255,.92)'; g.beginPath(); g.ellipse(h - h * .3, h - h * .34, h * .15, h * .12, -.4, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255,240,210,.6)'; g.beginPath(); g.arc(h + h * .3, h + h * .32, h * .07, 0, TAU); g.fill();
  return c;
 }
 // mouth shapes, each in a 128 x 64 cell that covers X -.42 to .42 and Y -.44 to -.64 of the face
 function mouthCanvas() {
  const c = cvs(512, 64), g = c.getContext('2d'), mx = (X) => 64 + X * 152.4, my = (Y) => (-.44 - Y) * 320;
  const lipU = '#7a3428', lipL = '#a64c40', line = '#320e08';
  // 0: a confident half-smile, her left corner (viewer's right) lifted
  g.fillStyle = lipU; g.beginPath(); g.moveTo(mx(-.3), my(-.527)); g.quadraticCurveTo(mx(-.17), my(-.482), mx(-.055), my(-.477)); g.lineTo(mx(0), my(-.492)); g.lineTo(mx(.055), my(-.476));
  g.quadraticCurveTo(mx(.18), my(-.472), mx(.325), my(-.5)); g.quadraticCurveTo(mx(.14), my(-.532), mx(0), my(-.536)); g.quadraticCurveTo(mx(-.14), my(-.537), mx(-.29), my(-.53)); g.fill();
  g.fillStyle = lipL; g.beginPath(); g.moveTo(mx(-.27), my(-.533)); g.quadraticCurveTo(mx(-.14), my(-.543), mx(0), my(-.54)); g.quadraticCurveTo(mx(.15), my(-.535), mx(.3), my(-.508));
  g.quadraticCurveTo(mx(.17), my(-.622), mx(0), my(-.626)); g.quadraticCurveTo(mx(-.17), my(-.624), mx(-.27), my(-.533)); g.fill();
  blob(g, mx(.01), my(-.574), 9, 'rgba(244,176,156,.42)', 2.4);
  g.strokeStyle = line; g.lineWidth = 2.2; g.lineCap = 'round'; g.beginPath(); g.moveTo(mx(-.31), my(-.524)); g.quadraticCurveTo(mx(-.14), my(-.546), mx(0), my(-.54)); g.quadraticCurveTo(mx(.17), my(-.532), mx(.335), my(-.495)); g.stroke();
  g.lineWidth = 1.4; g.beginPath(); g.moveTo(mx(.333), my(-.496)); g.quadraticCurveTo(mx(.36), my(-.5), mx(.37), my(-.485)); g.stroke(); g.beginPath(); g.moveTo(mx(-.31), my(-.524)); g.quadraticCurveTo(mx(-.33), my(-.522), mx(-.34), my(-.512)); g.stroke();
  // 1: gritted teeth
  g.save(); g.translate(128, 0);
  g.fillStyle = '#2a0c08'; g.beginPath(); g.ellipse(64, 31, 40, 12, 0, 0, TAU); g.fill();
  g.fillStyle = '#f2e8de'; g.beginPath(); g.ellipse(64, 31, 36, 8.5, 0, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(90,50,40,.7)'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(30, 31); g.lineTo(98, 31); g.stroke();
  for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(64 + i * 9, 23); g.lineTo(64 + i * 9, 39); g.stroke(); }
  g.strokeStyle = lipU; g.lineWidth = 4; g.beginPath(); g.ellipse(64, 31, 40, 12, 0, PI, TAU); g.stroke();
  g.strokeStyle = lipL; g.lineWidth = 5; g.beginPath(); g.ellipse(64, 31, 40, 12, 0, 0, PI); g.stroke();
  g.restore();
  // 2: open, shouting or hurt
  g.save(); g.translate(256, 0);
  g.fillStyle = '#2a0c08'; g.beginPath(); g.ellipse(64, 34, 25, 19, 0, 0, TAU); g.fill();
  g.fillStyle = '#b4505a'; g.beginPath(); g.ellipse(64, 47, 15, 6, 0, 0, TAU); g.fill();
  g.fillStyle = '#f2e8de'; g.fillRect(46, 16, 36, 6);
  g.strokeStyle = lipU; g.lineWidth = 4; g.beginPath(); g.ellipse(64, 34, 25, 19, 0, PI, TAU); g.stroke();
  g.strokeStyle = lipL; g.lineWidth = 5; g.beginPath(); g.ellipse(64, 34, 25, 19, 0, 0, PI); g.stroke();
  g.restore();
  // 3: closed and pained, the corners pulled down
  g.save(); g.translate(384, 0);
  g.fillStyle = lipU; g.beginPath(); g.moveTo(mx(-.2), my(-.545)); g.quadraticCurveTo(mx(0), my(-.5), mx(.2), my(-.545)); g.quadraticCurveTo(mx(0), my(-.53), mx(-.2), my(-.545)); g.fill();
  g.fillStyle = lipL; g.beginPath(); g.moveTo(mx(-.19), my(-.548)); g.quadraticCurveTo(mx(0), my(-.535), mx(.19), my(-.548)); g.quadraticCurveTo(mx(0), my(-.6), mx(-.19), my(-.548)); g.fill();
  g.strokeStyle = line; g.lineWidth = 2; g.beginPath(); g.moveTo(mx(-.22), my(-.556)); g.quadraticCurveTo(mx(0), my(-.528), mx(.22), my(-.556)); g.stroke();
  g.restore();
  return c;
 }
 function hairCanvas() {
  const W = 256, H = 64, c = cvs(W, H), g = c.getContext('2d');
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 170; i++) { g.fillStyle = rnd() < .55 ? 'rgba(60,12,2,.17)' : 'rgba(255,214,170,.17)'; g.fillRect(0, rnd() * H, W, .6 + rnd() * 1.4); }
  const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, 'rgba(50,8,2,.4)'); gr.addColorStop(.3, 'rgba(50,8,2,0)'); gr.addColorStop(.8, 'rgba(255,196,130,0)'); gr.addColorStop(1, 'rgba(255,196,130,.32)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  return c;
 }
 // cloth atlas: the quilted gambeson and orange waist band round her torso (top half), dark trousers (bottom left), cream linen (bottom right)
 function clothCanvas() {
  const c = cvs(512, 512), g = c.getContext('2d');
  g.fillStyle = '#3c2c24'; g.fillRect(0, 0, 512, 256);
  for (let k = -256; k < 512; k += 14) for (const s of [-1, 1]) { g.strokeStyle = 'rgba(16,8,4,.55)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(k, 0); g.lineTo(k + s * 256, 256); g.stroke(); g.strokeStyle = 'rgba(120,96,80,.2)'; g.beginPath(); g.moveTo(k + 1.5, 0); g.lineTo(k + 1.5 + s * 256, 256); g.stroke(); }
  grain(g, 0, 0, 512, 256, 10);
  const r0 = (1.445 - 1.094) / .625 * 256, r1 = (1.445 - 1.03) / .625 * 256;
  g.fillStyle = '#b44a1c'; g.fillRect(0, r0, 512, r1 - r0); weave(g, 0, r0, 512, r1 - r0, .07);
  g.fillStyle = 'rgba(40,12,4,.35)'; g.fillRect(0, r0, 512, 2); g.fillRect(0, r1 - 2, 512, 2);
  // trousers
  g.fillStyle = '#4a3226'; g.fillRect(0, 256, 256, 256); weave(g, 0, 256, 256, 256, .07);
  for (let i = 0; i < 9; i++) { const x = rnd() * 256, gg = g.createLinearGradient(x - 10, 0, x + 10, 0); gg.addColorStop(0, 'rgba(20,10,6,0)'); gg.addColorStop(.5, 'rgba(20,10,6,.22)'); gg.addColorStop(1, 'rgba(20,10,6,0)'); g.fillStyle = gg; g.fillRect(x - 10, 256, 20, 256); }
  // linen
  g.fillStyle = '#c9b894'; g.fillRect(256, 256, 256, 256);
  for (let i = 0; i < 256; i += 2) { g.fillStyle = 'rgba(120,90,60,.06)'; g.fillRect(256, 256 + i, 256, 1); g.fillRect(256 + i, 256, 1, 256); }
  for (let i = 0; i < 12; i++) { const x = 256 + rnd() * 256, gg = g.createLinearGradient(x - 9, 0, x + 9, 0); gg.addColorStop(0, 'rgba(110,80,50,0)'); gg.addColorStop(.5, 'rgba(110,80,50,.13)'); gg.addColorStop(1, 'rgba(110,80,50,0)'); g.fillStyle = gg; g.fillRect(x - 9, 256, 18, 256); }
  return c;
 }
 const toTorso = (g) => { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, .5 + uv.getY(i) * .5); return g; };
 const toTrousers = (g) => { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * .5, uv.getY(i) * .5); return g; };
 const toLinen = (g) => { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, .5 + uv.getX(i) * .5, uv.getY(i) * .5); return g; };
 // the tabard: front panel (left half) with the sun crest and the ornament below it, back panel (right half)
 const TAB = [
  { back: false, top: 1.02, hw0: .094, hw1: .1, Ls: .58, Lt: .66 },
  { back: true, top: 1.03, hw0: .078, hw1: .084, Ls: .53, Lt: .6 }
 ];
 const tabL = (T, u) => lerp(T.Ls, T.Lt, 1 - Math.abs(2 * u - 1));
 function tabardCanvas() {
  const c = cvs(512, 512), g = c.getContext('2d'), gold = '#e8b44c', goldD = '#9a5c16';
  for (let k = 0; k < 2; k++) {
   const T = TAB[k], x0 = k * 256, by = (x) => tabL(T, x / 256) / T.Lt * 512;
   const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#cf5c20'); gr.addColorStop(.7, '#c2501c'); gr.addColorStop(1, '#a8401a');
   g.fillStyle = gr; g.fillRect(x0, 0, 256, 512); weave(g, x0, 0, 256, 512, .06); grain(g, x0, 0, 256, 512, 8);
   const outline = (ins) => { g.beginPath(); g.moveTo(x0 + ins, -2); g.lineTo(x0 + ins, by(ins) - ins * .55); g.lineTo(x0 + 128, by(128) - ins * 1.25); g.lineTo(x0 + 256 - ins, by(256 - ins) - ins * .55); g.lineTo(x0 + 256 - ins, -2); };
   g.lineJoin = 'miter'; g.strokeStyle = gold; g.lineWidth = 13; outline(10); g.stroke();
   g.strokeStyle = 'rgba(255,236,170,.4)'; g.lineWidth = 2; outline(6); g.stroke();
   g.strokeStyle = goldD; g.lineWidth = 1.6; outline(17.5); g.stroke();
   g.strokeStyle = gold; g.lineWidth = 2.6; outline(23); g.stroke();
   if (!k) {
    // the crest: 256 px across 0.2 m, 512 px down 0.66 m, so circles are drawn squashed to 0.6
    const sy = (512 / T.Lt) / (256 / (2 * T.hw1));
    sun(g, x0 + 128, (T.top - .72) / T.Lt * 512, 30, sy, gold, goldD);
    fleur(g, x0 + 128, (T.top - .465) / T.Lt * 512, 74, 1, gold);
   } else fleur(g, x0 + 128, (T.top - .52) / T.Lt * 512, 56, 1, gold);
  }
  return c;
 }
 // the cape: outer side (left half) and lining (right half). u runs across her back, v down from the collar; the texture's
 // v is the drop from 1.46 m so its scale is the same in every column, and the gold hem follows the pointed hem.
 const CT = 1.58, CTOP = 1.46, CLEN = .93;
 const hem = (tp) => .53 + .23 * Math.pow(Math.min(1, Math.abs(tp) / CT), 1.1);
 function capeCanvas() {
  const c = cvs(1024, 512), g = c.getContext('2d'), gold = '#dfa844', goldHi = '#fbd987', goldD = '#8a5a18';
  const hy = (x) => (CTOP - hem(lerp(-CT, CT, x / 512))) / CLEN * 512;
  for (let k = 0; k < 2; k++) {
   const x0 = k * 512;
   const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, k ? '#1a2142' : '#26326a'); gr.addColorStop(1, k ? '#141a36' : '#1e2856');
   g.fillStyle = gr; g.fillRect(x0, 0, 512, 512); weave(g, x0, 0, 512, 512, .05); grain(g, x0, 0, 512, 512, 6);
   for (let i = 0; i < 16; i++) { const x = x0 + rnd() * 512, gg = g.createLinearGradient(x - 22, 0, x + 22, 0); gg.addColorStop(0, 'rgba(6,8,30,0)'); gg.addColorStop(.5, 'rgba(6,8,30,.2)'); gg.addColorStop(1, 'rgba(6,8,30,0)'); g.fillStyle = gg; g.fillRect(x - 22, 0, 44, 512); }
   // gold edging all round: the sides and the pointed hem, with a thin inner line
   const band = (ins, w, col) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(x0 + ins, -4); for (let i = 0; i <= 64; i++) { const x = lerp(ins, 512 - ins, i / 64); g.lineTo(x0 + x, hy(x) - ins); } g.lineTo(x0 + 512 - ins, -4); g.stroke(); };
   band(9, 20, gold); band(4, 2, goldHi); band(27, 3, gold);
   if (k) continue;
   // a large sun between her shoulders: the cape is about 0.53 m across there and 0.93 m long
   sun(g, x0 + 256, (CTOP - 1.19) / CLEN * 512, 44, (512 / CLEN) / (512 / .63), gold, goldD);
   // and the ornament lower down, with smaller ones near the hem corners
   fleur(g, x0 + 256, (CTOP - .74) / CLEN * 512, 120, .9, gold);
   for (const s of [-1, 1]) { g.save(); g.translate(x0 + 256 + s * 150, hy(256 + s * 150) - 58); g.rotate(s * .5); fleur(g, 0, 0, 44, 1, gold); g.restore(); }
  }
  return c;
 }
 // brushed, worn bronze: fine streaks, darker patina and scratches; tinted per part by vertex colour
 function bronzeCanvas() {
  const S = 256, c = cvs(S, S), g = c.getContext('2d');
  g.fillStyle = '#e2cfae'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 520; i++) { g.fillStyle = rnd() < .5 ? 'rgba(70,44,18,.08)' : 'rgba(255,244,220,.1)'; g.fillRect(0, rnd() * S, S, .5 + rnd() * 1.3); }
  const wrapB = (x, y, r, col) => { for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) blob(g, x + ox, y + oy, r, col); };
  for (let i = 0; i < 30; i++) wrapB(rnd() * S, rnd() * S, 10 + rnd() * 26, 'rgba(66,46,24,.2)');
  for (let i = 0; i < 10; i++) wrapB(rnd() * S, rnd() * S, 6 + rnd() * 12, 'rgba(56,76,58,.12)');
  for (let i = 0; i < 40; i++) { const x = rnd() * S, y = rnd() * S, a = rnd() * PI, L = 6 + rnd() * 22; g.strokeStyle = rnd() < .6 ? 'rgba(255,246,226,.3)' : 'rgba(50,30,12,.25)'; g.lineWidth = .7; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }
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

 const skinT = tex(skinCanvas()), irisT = tex(irisCanvas()), hairT = tex(hairCanvas()), mouthC = mouthCanvas();
 const clothT = tex(clothCanvas()), tabT = tex(tabardCanvas()), capeT = tex(capeCanvas()), bronzeT = tex(bronzeCanvas(), 2, 2);
 const leatherN = tex(heightCanvas(128, 128, (x, y) => Math.sin(x * .7 + Math.sin(y * .31) * 2) * .3 + Math.sin(y * .9 + x * .13) * .25 + (rnd() - .5) * .5, 1.4), 3, 3);
 const dents = []; for (let i = 0; i < 28; i++) dents.push([rnd() * 128, rnd() * 128, 5 + rnd() * 9]);
 // hammered dents on a tile that wraps: only the nearest copy of each dent can reach a pixel
 const hammerN = tex(heightCanvas(128, 128, (x, y) => { let v = 0; for (const d of dents) { let dx = x - d[0], dy = y - d[1]; dx -= Math.round(dx / 128) * 128; dy -= Math.round(dy / 128) * 128; const r2 = (dx * dx + dy * dy) / (d[2] * d[2]); if (r2 < 1) v -= (1 - r2) * .6; } return v + (rnd() - .5) * .06; }, 1.6), 2, 2);
 const nv2 = (k) => new THREE.Vector2(k, k), GREY = (k) => new THREE.Color(k, k, k);
 const M = {
  skin: std(0xffffff, .58, { map: skinT, vertexColors: true, emissive: 0x2a140a }, .8),
  eye: std(0xffffff, .5, { vertexColors: true, morphTargets: true, emissive: 0x2a140a }, .4),
  iris: std(0xffffff, .3, { map: irisT, emissiveMap: irisT, emissive: 0x7a5a3a }, .2),
  mouth: std(0xffffff, .55, { map: tex(mouthC), transparent: true, depthWrite: false, emissive: 0x2a140c, polygonOffset: true, polygonOffsetFactor: -2 }, 0),
  mouth2: null,
  hair: std(0xffffff, .58, { map: hairT, vertexColors: true, emissive: 0x240a04 }, .9),
  bronze: std(0xffffff, .44, { metalness: .5, map: bronzeT, normalMap: hammerN, normalScale: nv2(.32), vertexColors: true, emissive: 0x261a0c }),
  gold: std(0xf0b448, .3, { metalness: .55, emissive: 0x4c3008 }, 1.2),
  leather: std(0xffffff, .64, { normalMap: leatherN, normalScale: nv2(.55), vertexColors: true, emissive: 0x160a04 }),
  cloth: std(0xffffff, .86, { map: clothT, emissive: GREY(.09), emissiveMap: clothT }),
  tabard: std(0xffffff, .74, { map: tabT, emissive: GREY(.15), emissiveMap: tabT, side: THREE.DoubleSide }),
  cape: std(0xffffff, .8, { map: capeT, emissive: GREY(.2), emissiveMap: capeT }, 1.2),
  lining: std(0xffffff, .72, { map: capeT, emissive: GREY(.14), emissiveMap: capeT, side: THREE.BackSide }),
  steel: std(0xe0a24a, .28, { metalness: .45, emissive: 0x5a2a06 }),
  edge: std(0xffe0a0, .25, { metalness: .2, emissive: 0x000000 }),
  stone: std(0xff9c2a, .15, { emissive: 0xff6a10, emissiveIntensity: .55 }, 0)
 };
 M.mouth2 = M.mouth.clone(); M.mouth2.map = M.mouth.map.clone(); M.mouth2.map.needsUpdate = true;

 // ---------- geometry helpers ----------
 const _v = new THREE.Vector3(), _v2 = new THREE.Vector3();
 const YA = new THREE.Vector3(0, 1, 0), ZA = new THREE.Vector3(0, 0, 1);
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
  const cx = o.cx || 0, cz = o.cz || 0, n = prof.length - 1;
  const out = [0, 0, 0];
  return surf(segs, n * (o.sub || 1), (u, v, p) => {
   const k = v * n, i = Math.min(n - 1, Math.floor(k)), f = k - i;
   const r = lerp(prof[i][0], prof[i + 1][0], f * f * (3 - 2 * f)), y = lerp(prof[i][1], prof[i + 1][1], f), a = lerp(-PI, PI, u);
   out[0] = cx + Math.sin(a) * r; out[1] = y; out[2] = cz + Math.cos(a) * r;
   if (o.fn) o.fn(out, a, v, r);
   p[0] = out[0]; p[1] = out[1]; p[2] = out[2];
  }, true);
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
  for (const g of list) { if (!g.attributes.normal) g.computeVertexNormals(); nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
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

 // ---------- skinned buckets: pieces are weighted, tinted, then merged per material into one SkinnedMesh ----------
 // TINT (an [r, g, b] or a function of the vertex) colours what add() takes next, for materials that use vertex colours.
 const BUCK = new Map();
 let TINT = null;
 const tinted = (col, fn) => { const was = TINT; TINT = col; fn(); TINT = was; };
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
  let col = null;
  if (TINT) { col = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const c = typeof TINT === 'function' ? TINT(pos.getX(i), pos.getY(i), pos.getZ(i), i) : TINT; col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2]; } }
  let L = BUCK.get(mat); if (!L) BUCK.set(mat, (L = []));
  L.push({ g, si, sw, col });
 }
 function buildSkinned(parent, skeleton, list) {
  for (const [mat, L] of BUCK) {
   const geo = mergeGeos(L.map((e) => e.g));
   const nv = geo.attributes.position.count, SI = new Uint16Array(nv * 4), SW = new Float32Array(nv * 4);
   let o = 0; for (const e of L) { SI.set(e.si, o); SW.set(e.sw, o); o += e.si.length; }
   geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(SI, 4));
   geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(SW, 4));
   if (L.some((e) => e.col)) { const C = new Float32Array(nv * 3).fill(1); let q = 0; for (const e of L) { if (e.col) C.set(e.col, q); q += e.g.attributes.position.count * 3; } geo.setAttribute('color', new THREE.BufferAttribute(C, 3)); mat.vertexColors = true; }
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
 { let p = head; const off = [[0, .085, -.098], [0, -.075, -.05], [0, -.096, -.012], [0, -.096, -.004], [0, -.096, 0], [0, -.096, 0]];
  for (let i = 0; i < 6; i++) { p = bone('braid' + i, p, off[i][0], off[i][1], off[i][2]); braid.push(p); } }
 const TUFT = ['tuftR', 'tuftL', 'tuftF', 'tuftC'];
 const tufts = [bone('tuftR', head, -.088, .1, .005), bone('tuftL', head, .088, .1, .005), bone('tuftF', head, .0, .19, .07), bone('tuftC', head, .0, .21, -.06)];
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
 const tabF = [bone('tabF1', pelvis, 0, .04, .128)]; tabF.push(bone('tabF2', tabF[0], 0, -.25, .012));
 const tabB = [bone('tabB1', pelvis, 0, .03, -.132)]; tabB.push(bone('tabB2', tabB[0], 0, -.22, -.012));
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

 // ---------- head: a sculpted egg; X and Y (-1.1 to 1.1) are both its front view and the face texture ----------
 const HC = [0, 1.632, .008], HR = [.078, .12, .096];
 const xSq = (Y) => 1 - .1 * sm(-.05, -.95, Y) + .05 * G2(0, Y + .5, 1, .2); // a round face: the lower face kept full, the jaw soft
 function faceD(X, Y) {
  let d = 0;
  for (const s of [-1, 1]) {
   d -= .085 * G2(X - s * .37, Y - .04, .15, .1);       // eye sockets
   d += .04 * G2(X - s * .36, Y - .19, .22, .06);       // brow ridge
   d += .055 * G2(X - s * .55, Y + .12, .19, .13);      // cheekbones
   d += .034 * G2(X - s * .45, Y + .3, .2, .15);        // full, round cheeks, lifted by her smile
   d += .03 * G2(X - s * .12, Y + .37, .055, .045);     // the wings of the nose
   d -= .012 * G2(X - s * .32, Y + .5, .05, .11);       // smile lines
   d -= .009 * G2(X - s * .31, Y + .515 - (s > 0 ? .024 : .008), .035, .032); // the corners of her half-smile, her left one higher
  }
  d += .012 * G2(X, Y - .14, .1, .07);                                           // between the brows, kept low: no bulb at the bridge
  d += Math.exp(-X * X / .0075) * win(Y, -.34, .05, .05) * (.05 + .15 * sm(.04, -.3, Y)); // a straight nose
  d += .078 * G2(X, Y + .32, .1, .065); d -= .018 * G2(X, Y + .41, .07, .03);   // its rounded tip, and under it
  d += .034 * G2(X, Y + .48, .27, .042); d += .045 * G2(X, Y + .585, .23, .048);  // full lips
  d -= .022 * G2(X, Y + .533, .3, .016); d -= .022 * G2(X, Y + .69, .2, .04);    // the mouth line, under the lip
  d += .06 * G2(X, Y + .82, .23, .1);                                            // chin
  return d;
 }
 // head point from a direction on the unit sphere, in head units; the jaw is shortened so her chin sits at Y = -.86
 const yJ = (Y0) => (Y0 < 0 ? Y0 * (1 - .14 * Y0 * Y0) : Y0);
 const yJinv = (Y) => { if (Y >= 0) return Y; let y = Y; for (let i = 0; i < 5; i++) y -= (y * (1 - .14 * y * y) - Y) / (1 - .42 * y * y); return y; };
 function headU(X0, Y0, Z0, o) {
  const Y = yJ(Y0), X = X0 * xSq(Y);
  let Z = Z0 > 0 ? Z0 * (1 - .08 * sm(-.05, -.95, Y)) : Z0 * 1.08;
  // the lower face is brought forward from the sphere so her mouth and chin sit under her brow in profile
  if (Z > 0) Z += Math.exp(-X * X / .3) * .8 * Math.max(0, .95 - Math.sqrt(Math.max(0, 1 - Y * Y))) * sm(-.1, -.5, Y) * sm(0, .5, Z0);
  if (Z > 0) Z += faceD(X, Y) * sm(0, .35, Z);
  o[0] = X; o[1] = Y; o[2] = Z; return o;
 }
 const _hu = [0, 0, 0];
 const headW = (o, out) => out.set(HC[0] + o[0] * HR[0], HC[1] + o[1] * HR[1], HC[2] + o[2] * HR[2]);
 // the face point whose front view is (X, Y), and the way it faces
 function faceAt(X, Y, off) {
  const P = (x, y, out) => { const y0 = yJinv(y), x0 = x / xSq(y), z0 = Math.sqrt(Math.max(0, 1 - x0 * x0 - y0 * y0)); return headW(headU(x0, y0, z0, _hu), out); };
  const p = P(X, Y, new THREE.Vector3()), px = P(X + 1e-3, Y, new THREE.Vector3()), py = P(X, Y + 1e-3, new THREE.Vector3());
  const n = new THREE.Vector3().crossVectors(px.sub(p), py.sub(p)).normalize(); if (n.z < 0) n.negate();
  if (off) p.addScaledVector(n, off);
  return { p, n };
 }
 const PLAIN = [.985, .985]; // the clean skin swatch in the atlas
 const plainUV = (g) => { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, PLAIN[0], PLAIN[1]); return g; };
 {
  const g = surf(Q(72, 36), Q(54, 28), (u, v, o) => { const th = (u - .5) * TAU, ph = v * PI; headU(Math.sin(ph) * Math.sin(th), Math.cos(ph), Math.sin(ph) * Math.cos(th), o); o[0] = HC[0] + o[0] * HR[0]; o[1] = HC[1] + o[1] * HR[1]; o[2] = HC[2] + o[2] * HR[2]; }, true);
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) { let X = (p.getX(i) - HC[0]) / HR[0]; const Y = (p.getY(i) - HC[1]) / HR[1]; if (p.getZ(i) < HC[2]) X = (X < 0 ? -1 : 1) * 1.07; uv.setXY(i, (cl(X, -1.08, 1.08) / 1.1 * .5 + .5) * .5, Y / 1.1 * .5 + .5); }
  add(g, M.skin, BI.head);
 }
 // a strong neck, shaded under the jaw
 tinted((x, y) => { const k = 1 - .22 * sm(1.47, 1.53, y); return [k, k * .97, k * .95]; }, () => add(plainUV(lathe([[.05, 1.57], [.054, 1.5], [.058, 1.45], [.066, 1.405]], Q(20), { cz: -.01, sub: 2 })), M.skin, wNeck));
 // ears, with gold hoops
 for (const sd of [-1, 1]) {
  const ph = PI / 2 + .1, th = sd * 1.64; headU(Math.sin(ph) * Math.sin(th), Math.cos(ph), Math.sin(ph) * Math.cos(th), _hu);
  const e = [HC[0] + _hu[0] * HR[0], HC[1] + _hu[1] * HR[1], HC[2] + _hu[2] * HR[2]], q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, sd * .3, sd * .1));
  const L = (v) => [e[0] + v[0], e[1] + v[1], e[2] + v[2]];
  tinted([.86, .8, .77], () => {
   add(plainUV(new THREE.SphereGeometry(1, Q(12), Q(10))), M.skin, BI.head, L([sd * .002, -.002, -.006]), null, [.0065, .019, .012], q);
   add(plainUV(new THREE.TorusGeometry(.0125, .0032, Q(6), Q(14), PI * 1.15)), M.skin, BI.head, L([sd * .005, .002, -.008]), [0, sd * PI / 2 + sd * .3, PI * .05]);
   add(plainUV(new THREE.SphereGeometry(.006, Q(8), Q(6))), M.skin, BI.head, L([sd * .006, -.017, -.001]));
  });
  tinted([.62, .4, .32], () => add(plainUV(new THREE.SphereGeometry(1, Q(10), Q(8))), M.skin, BI.head, L([sd * .0085, .002, -.003]), null, [.003, .013, .008], q));
  add(new THREE.TorusGeometry(.0098, .0017, Q(5), Q(18)), M.gold, BI.head, L([sd * .0075, -.03, .002]), [0, PI / 2 + sd * .55, 0]);
 }

 // ---------- face: eyes with real lids, brows, painted mouth shapes ----------
 const face = new THREE.Group(); head.add(face);
 const SX = .0178, SY = .0116, SZ = .0078, IRX = .0079, IRY = .0082;
 const EF = [-1, 1].map((sd) => {
  const { p, n } = faceAt(sd * .37, .045);
  const zA = n.clone().lerp(ZA, .5).normalize(), xA = new THREE.Vector3().crossVectors(YA, zA).normalize(), yA = new THREE.Vector3().crossVectors(zA, xA);
  const o = p.clone().addScaledVector(zA, -SZ * .55);
  return { sd, m: new THREE.Matrix4().makeBasis(xA, yA, zA).setPosition(o.x - HW[0], o.y - HW[1], o.z - HW[2]) };
 });
 const zS = (x, y) => SZ * Math.sqrt(Math.max(0, 1 - (x / SX) ** 2 - (y / SY) ** 2));
 // irises: one mesh, its vertices re-seated on the eyeball when the gaze moves
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
    _v.set(X, Y, zS(X, Y) + .0003).applyMatrix4(EF[e].m); p.setXYZ(e * ir.nper + i, _v.x, _v.y, _v.z);
   }
  }
  p.needsUpdate = true;
 }
 // eye whites, lids and lashes, and brows in one vertex-coloured mesh: morph 0 closes the lids, morph 1 knits the brows
 let eyeMesh;
 {
  const P = [], PB = [], PF = [], C = [], I = [];
  const V = (b, k, f, col) => { P.push(b.x, b.y, b.z); PB.push(k.x, k.y, k.z); PF.push(f.x, f.y, f.z); C.push(col[0], col[1], col[2]); };
  for (const f of EF) {
   const g = new THREE.SphereGeometry(1, Q(20), Q(14)); g.scale(SX, SY, SZ);
   const p = g.attributes.position, b0 = P.length / 3;
   for (let i = 0; i < p.count; i++) { const k = 1.3 - .32 * sm(.5, 1, Math.abs(p.getX(i)) / SX) - .3 * sm(.1, SY, p.getY(i)); _v.fromBufferAttribute(p, i).applyMatrix4(f.m); V(_v, _v, _v, [k, k * .96, k * .92]); }
   for (let k = 0; k < g.index.count; k++) I.push(g.index.array[k] + b0);
  }
  const skin = [.64, .4, .27], crease = [.36, .18, .11], lash = [.05, .025, .02], lowL = [.36, .19, .13], under = [.72, .47, .32];
  const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const _a = new THREE.Vector3(), _k = new THREE.Vector3();
  const put = (f, x, y, yc, zl, col) => {
   const z = Math.max(zS(x, y) + .0009, .0024) + zl, zc = Math.max(zS(x, yc) + .0009, .0024) + zl;
   _a.set(x, y, z).applyMatrix4(f.m); _k.set(x, yc, zc).applyMatrix4(f.m); V(_a, _k, _a, col);
  };
  const grid = (nx, ny, fn, flip) => {
   const b = P.length / 3;
   for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) fn(i / nx, j / ny);
   for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = b + j * (nx + 1) + i, c = a + nx + 1; if (flip) I.push(a, a + 1, c, a + 1, c + 1, c); else I.push(a, c, a + 1, a + 1, c, c + 1); }
  };
  for (const f of EF) {
   const sd = f.sd;
   const yE = (x) => SY * (.62 - .44 * x * x + .13 * x * sd), yC = (x) => SY * (-.5 + .22 * x * x), yT = (x) => SY * (1.45 - .3 * x * x);
   grid(Q(12, 8), 5, (s, r) => { const x = lerp(-1.15, 1.15, s); put(f, x * SX, lerp(yT(x), yE(x), r), lerp(yT(x), yC(x), r), 0, mix3(skin, crease, sm(.3, 1, r))); });
   // the lash line, dark and a little winged at the outer corner
   grid(Q(16, 8), 2, (s, r) => {
    const o = lerp(-1.04, 1.3, s), x = o * sd, xc = Math.min(1, Math.abs(o)) * Math.sign(x), wing = Math.max(0, o - .98);
    const th = .0034 * (o > .85 ? Math.max(.2, 1 - (o - .85) / .5) : 1) * (o < -.85 ? .5 : 1);
    const y0 = o <= .98 ? yE(x) : yE(xc) + wing * .024, y1 = o <= .98 ? yC(x) : yC(xc) - wing * .005;
    put(f, o > .98 ? xc * SX + sd * wing * SX * .85 : x * SX, y0 - r * th, y1 - r * th * .7, .001, lash);
   }, sd < 0);
   grid(Q(12, 6), 1, (s, r) => { const o = lerp(-.8, .97, s), x = o * sd, y = -SY * (.7 - .32 * x * x) - r * .0009; put(f, x * SX, y, y, .0006, mix3(lash, lowL, .55)); }, sd < 0);
   grid(Q(12, 6), 3, (s, r) => { const x = lerp(-1.12, 1.12, s), y0 = -SY * (.7 - .32 * x * x) - .0009, y = lerp(y0, -SY * 1.4, r); put(f, x * SX, y, y, 0, lowL.map((c, i) => lerp(c, under[i], sm(0, 1, r)))); });
  }
  // brows: thick, dark and defined, a little arched toward the tail
  const browPts = (sd, k) => [[.12 - .015 * k, .18 - .03 * k], [.29 - .01 * k, .218 - .012 * k], [.46, .226 + .004 * k], [.63, .175 + .006 * k]].map(([x, y]) => { const p = faceAt(sd * x, y, .0034).p; return [p.x - HW[0], p.y - HW[1], p.z - HW[2]]; });
  const browUp = (c, n) => n.set(c.x - HC[0] + HW[0], c.y - HC[1] + HW[1], c.z - HC[2] + HW[2]);
  for (const sd of [-1, 1]) {
   const g0 = tube(browPts(sd, 0), Q(12, 6), Q(6, 4), (t) => .0054 * Math.pow(1 - t, .55) + .0012, .4, browUp), g1 = tube(browPts(sd, 1), Q(12, 6), Q(6, 4), (t) => .0054 * Math.pow(1 - t, .55) + .0012, .4, browUp);
   const b0 = P.length / 3, p0 = g0.attributes.position, p1 = g1.attributes.position;
   for (let i = 0; i < p0.count; i++) { _a.fromBufferAttribute(p0, i); _k.fromBufferAttribute(p1, i); V(_a, _a, _k, [.2, .1, .06]); }
   for (let k = 0; k < g0.index.count; k++) I.push(g0.index.array[k] + b0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(P.length / 3 * 2), 2));
  g.setIndex(I); g.computeVertexNormals();
  g.morphAttributes.position = [new THREE.Float32BufferAttribute(PB, 3), new THREE.Float32BufferAttribute(PF, 3)];
  eyeMesh = new THREE.Mesh(g, M.eye); eyeMesh.morphTargetInfluences = [0, 0]; face.add(eyeMesh);
 }
 {
  const g = surf(Q(12, 6), Q(5, 3), (u, v, o) => { const p = faceAt(lerp(-.42, .42, u), lerp(-.44, -.64, v), .0011).p; o[0] = p.x - HW[0]; o[1] = p.y - HW[1]; o[2] = p.z - HW[2]; });
  for (const mat of [M.mouth, M.mouth2]) { mat.map.repeat.set(.25, 1); const m = new THREE.Mesh(g, mat); m.renderOrder = 3; face.add(m); }
 }

 // ---------- hair: copper, short and tousled, full on top, swept from a part on her right; her ears show ----------
 const HAIRC = [[.5, .18, .08], [.57, .22, .1], [.43, .15, .065], [.63, .27, .12], [.52, .2, .09]];
 const tmpS = [0, 0, 0];
 function scalpPt(az, el, off) {
  const ph = PI / 2 - cl(el, -1.25, 1.565); headU(Math.sin(ph) * Math.sin(az), Math.cos(ph), Math.sin(ph) * Math.cos(az), tmpS);
  const x = tmpS[0] * HR[0], y = tmpS[1] * HR[1] + .004, z = tmpS[2] * HR[2], L = Math.hypot(x, y, z), k = (L + off) / L;
  return [HC[0] + x * k, HC[1] + y * k, HC[2] + z * k];
 }
 {
  const elMin = (az) => { const a = Math.abs(az); return a < 1.0 ? lerp(.55, .34, sm(.3, 1.0, a)) : a < 1.5 ? .28 : lerp(.28, -.62, sm(1.5, 2.05, a)); };
  tinted([.34, .11, .045], () => add(surf(Q(48, 24), Q(16, 8), (u, v, o) => { const az = lerp(-PI, PI, u), p = scalpPt(az, lerp(PI / 2, elMin(az), v), .005); o[0] = p[0]; o[1] = p[1]; o[2] = p[2]; }, true), M.hair, BI.head));
 }
 const HUP = (c, n) => n.set(c.x - HC[0], c.y - HC[1] + .02, c.z - HC[2]);
 function lock(az0, el0, az1, el1, o) {
  const n = 7, pts = [];
  for (let i = 0; i <= n; i++) {
   const t = i / n, az = lerp(az0, az1, t) + (o.bend || 0) * Math.sin(PI * t), el = lerp(el0, el1, t) + (o.arc || 0) * Math.sin(PI * t);
   pts.push(scalpPt(az, el, lerp(o.r0 === undefined ? -.003 : o.r0, (o.r1 === undefined ? .025 : o.r1) * .7, t) + (o.bulge || 0) * .58 * Math.sin(PI * Math.min(1, t * 1.15))));
  }
  if (o.flick) { const f = o.flick; for (const [i, k] of [[n, .55], [n - 1, .22], [n - 2, .05]]) { pts[i][0] += f[0] * k; pts[i][1] += f[1] * k; pts[i][2] += f[2] * k; } }
  // wispy: every lock is slimmer than its listed width and tapers to a fine point
  const ns = Q(o.seg || 14, 7), nr = Q(o.rs || 6, 5), w0 = (o.w || .038) * .74, tp = o.taper || .62;
  const g = tube(pts, ns, nr, (t) => w0 * Math.pow(1 - t, tp) * (.8 + .2 * Math.sin(PI * Math.min(1, t * 2))) + .0006, o.flat || .42, HUP);
  const tf = o.tuft === undefined ? -1 : o.tuft, amt = o.amt || .8;
  tinted(o.col || HAIRC[(rnd() * HAIRC.length) | 0], () => add(g, M.hair, tf < 0 ? BI.head : (x, y, z, i) => { const k = amt * sm(.12, 1, Math.floor(i / (nr + 1)) / ns); return [[BI.head, 1 - k], [BI[TUFT[tf]], k]]; }));
 }
 const out = (az, k, up) => [Math.sin(az) * k, up || 0, Math.cos(az) * k];
 // crown: three rings sweeping out and down, the side locks stopping above the ears, tips curling out
 const elEnd = (a) => a < 1.25 ? lerp(.46, .4, sm(.7, 1.25, a)) : a < 1.9 ? .4 : lerp(.3, -.32, sm(1.9, PI, a));
 [[21, 1.1, .03, .05, .044], [18, 1.32, .038, .05, .042], [9, 1.46, .05, .03, .038]].forEach(([N, el0, r1, bul, w], ring) => {
  for (let k = 0; k < N; k++) {
   const az = -PI + (k + .5 + ring * .33) / N * TAU + (rnd() - .5) * .12, a = Math.abs(az);
   if (a < .75 && ring < 2) continue;
   lock(az, el0, az + (rnd() - .5) * .35, elEnd(a) + ring * .14, { r1, bulge: bul, w: w * (.9 + rnd() * .25), flick: out(az, .014, .01 + rnd() * .01), tuft: a > 2.2 ? 3 : -1 });
  }
 });
 // the fringe: swept from the part over her right eye across her forehead toward her left temple
 for (let k = 0; k < 9; k++) {
  const t = k / 8, az0 = lerp(-.52, -.28, t) + (rnd() - .5) * .05, el0 = lerp(.9, 1.24, t);
  lock(az0, el0, az0 + lerp(.6, 1.1, t), lerp(.18, .38, t), { w: .036 + .006 * Math.sin(PI * t), r1: .013 + .012 * t, bulge: .022 + .012 * t, arc: .12, bend: .06, flick: [.006, -.002, .008], tuft: 2, amt: .55, flat: .42 });
 }
 // strands falling on the part side, by her right temple
 lock(-.58, .95, -.84, .32, { w: .03, r1: .016, bulge: .016, arc: .06, flick: [-.006, -.004, .008], tuft: 2, amt: .5 });
 lock(-.7, .9, -1.02, .38, { w: .03, r1: .018, bulge: .016, flick: [-.008, -.002, .006], tuft: 0, amt: .5 });
 lock(-.42, 1.0, -.5, .3, { w: .026, r1: .012, bulge: .012, flick: [0, -.004, .01], tuft: 2, amt: .5 });
 lock(-.34, 1.2, -.08, .66, { w: .038, r1: .046, bulge: .02, flick: [0, .016, .016], tuft: 2 });
 lock(.04, 1.26, .3, .66, { w: .038, r1: .046, bulge: .02, flick: [.01, .018, .014], tuft: 2 });
 // sides: short, tousled, cut above the ears; her left side carries more of the sweep
 for (const sd of [-1, 1]) {
  const L = sd > 0 ? 1 : 0; // [az0, el0, az1, el1, width, tip lift, bulge, flick out, up, forward]
  for (const h of [[.92, .7, 1.08, .3 - .06 * L, .034, .02, .018, .012, -.004, .012], [1.18, .78, 1.36, .36 - .05 * L, .042, .042, .032, .026, .008, .006], [1.46, .8, 1.58, .12, .046, .03, .03, .02, .002, -.004], [1.32, .62, 1.5, .22, .036, .016, .016, .01, -.002, .002],
   [1.84, .68, 2.02, .02, .04, .032, .024, .02, -.004, -.01], [2.16, .6, 2.3, -.24, .04, .032, .022, .016, -.006, -.012], [1.62, .96, 1.76, .42, .042, .054, .03, .028, .016, -.008], [1.02, .9, 1.22, .42, .038, .042, .018, .02, .012, .01]])
   lock(sd * h[0], h[1], sd * h[2], h[3], { w: h[4], r1: h[5], bulge: h[6], flick: [sd * h[7], h[8], h[9]], tuft: L });
 }
 // back: layered locks drawn down and in toward the braid at the back of her head
 for (let k = 0; k < 12; k++) {
  const az = PI + (k - 5.5) * .2 + (rnd() - .5) * .08, b = (k - 5.5) / 5.5;
  lock(az, .82 - Math.abs(b) * .12, PI + (az - PI) * .4, -.12 - .22 * Math.abs(b), { w: .042, r1: .012, bulge: .026, flick: [b * .01, -.004, -.01], tuft: 3, amt: .45 });
 }
 // and shorter layers over them, loose at the nape behind her ears
 for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) lock(sd * (1.95 + k * .3), .55 - k * .05, sd * (2.05 + k * .3), -.42 + k * .04, { w: .036, r1: .02, bulge: .02, flick: [sd * .012, -.006, -.012], tuft: 3, amt: .4 });
 // fine stray wisps over the crown, the sides and the fringe, flicking out: what makes the cut read as tousled
 for (let k = 0; k < 26; k++) {
  const az = -PI + rnd() * TAU, a = Math.abs(az), el0 = .75 + rnd() * .7;
  if (a > 2.3) continue;
  lock(az, el0, az + (rnd() - .5) * .5, Math.max(elEnd(a) + .05, el0 - .35 - rnd() * .3), { w: .02 + rnd() * .008, r1: .03 + rnd() * .02, bulge: .02, flick: out(az, .02 + rnd() * .012, .006 + rnd() * .012), taper: .8, rs: 5, seg: 10, tuft: a > 2.2 ? 3 : a < .75 ? 2 : -1, amt: .5 });
 }

 // ---------- the braid: chunky lobes, gold bands near its top and end, a spiral gold cord and a loose tuft ----------
 const BJ = braid.map(bw); BJ.push([BJ[5][0], BJ[5][1] - .096, BJ[5][2]]);
 {
  const wB = wChain(braid.map((b) => b.name), BJ, 'head', .7);
  const cv = new THREE.CatmullRomCurve3(BJ.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
  const T = new THREE.Vector3(), C = new THREE.Vector3(), Xl = new THREE.Vector3(1, 0, 0), N = new THREE.Vector3(), mtx = new THREE.Matrix4();
  const frame = (s) => { cv.getPointAt(s, C); cv.getTangentAt(s, T); N.crossVectors(Xl, T).normalize(); };
  const NL = Q(18, 10);
  for (let k = 0; k < NL; k++) {
   const s = .06 + k / (NL - 1) * .76, side = k % 2 ? 1 : -1, sc = lerp(.95, .7, s); frame(s);
   const ax = T.clone().applyAxisAngle(N, side * .62), lat = new THREE.Vector3().crossVectors(ax, N).normalize();
   mtx.makeBasis(lat, ax, N);
   tinted(HAIRC[k % 3], () => add(new THREE.SphereGeometry(1, Q(12, 8), Q(8, 6)), M.hair, wB, [C.x + side * .0082 * sc, C.y, C.z], null, [.019 * sc, .031 * sc, .015 * sc], new THREE.Quaternion().setFromRotationMatrix(mtx)));
  }
  const cpts = []; for (let i = 0; i <= 12; i++) { frame(.03 + i / 12 * .82); cpts.push([C.x, C.y, C.z]); }
  tinted(HAIRC[2], () => add(tube(cpts, Q(24, 12), Q(8, 5), (t) => .0138 * lerp(1, .72, t), 1, (c, n) => n.set(0, 0, -1)), M.hair, wB));
  // a thin gold cord spiralling down the braid
  const spr = []; for (let i = 0; i <= 40; i++) { const s = .07 + i / 40 * .72, a = i * .9; frame(s); const lat = new THREE.Vector3().crossVectors(T, N).normalize(), r = .0175 * lerp(.95, .72, s); spr.push([C.x + (lat.x * Math.cos(a) + N.x * Math.sin(a)) * r, C.y + (lat.y * Math.cos(a) + N.y * Math.sin(a)) * r, C.z + (lat.z * Math.cos(a) + N.z * Math.sin(a)) * r]); }
  add(tube(spr, Q(80, 30), 4, () => .0016, 1, null), M.gold, wB);
  for (const [s, r, h] of [[.035, .0225, .03], [.845, .0172, .024]]) {
   frame(s); const q = new THREE.Quaternion().setFromUnitVectors(YA, T);
   add(new THREE.CylinderGeometry(r, r, h, Q(18, 10), 1, true), M.gold, wB, [C.x, C.y, C.z], null, null, q);
   for (const e of [-.5, .5]) add(new THREE.TorusGeometry(r, .0024, Q(5, 4), Q(18, 10)), M.gold, wB, [C.x + T.x * h * e, C.y + T.y * h * e, C.z + T.z * h * e], null, null, q.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), PI / 2)));
  }
  frame(.86); const c0 = C.clone();
  for (let i = 0; i < 7; i++) {
   const dx = (i - 3) * .0085, dz = (i % 2 ? 1 : -1) * .006;
   tinted(HAIRC[i % 4], () => add(tube([[c0.x + dx * .3, c0.y, c0.z], [c0.x + dx * .8, c0.y - .042, c0.z + dz], [c0.x + dx * 1.4, c0.y - .09 + Math.abs(i - 3) * .004, c0.z + dz * 1.5]], Q(8, 5), Q(5, 4), (t) => .0088 * Math.pow(1 - t, .8) + .0005, .6, (c, n) => n.set(0, 0, -1)), M.hair, wB));
  }
 }

 // ---------- torso: a quilted gambeson under the plate, an orange band at the waist ----------
 const TP = [[1.445, .064, .056, .06], [1.425, .092, .072, .078], [1.4, .125, .085, .092], [1.37, .15, .098, .103], [1.32, .16, .11, .108], [1.26, .157, .112, .106], [1.2, .15, .106, .1], [1.14, .14, .099, .096], [1.08, .13, .094, .092], [1.02, .128, .093, .094], [.97, .14, .1, .108], [.92, .152, .104, .118], [.87, .15, .1, .115], [.84, .13, .088, .098], [.82, .06, .05, .05]];
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
 add(toTorso(surf(Q(64, 32), Q(44, 22), (u, v, o) => bodyPt(lerp(-PI, PI, u), lerp(1.445, .82, v), 0, o), true)), M.cloth, wTorso);

 // ---------- the breastplate: brushed bronze shaped to her, gold-edged, with a small gold sun on the chest ----------
 const BRZ = [.64, .48, .3], BRZd = [.5, .37, .22], BRZl = [.72, .55, .34];
 const bpTop = (a) => { const A = Math.abs(a); return A < .38 ? lerp(1.386, 1.416, sm(0, .38, A)) : A < .9 ? lerp(1.416, 1.396, sm(.38, .9, A)) : A < 1.55 ? lerp(1.396, 1.272, sm(.9, 1.55, A)) : lerp(1.272, 1.3, sm(1.55, 2.1, A)); };
 const bpBot = (a) => 1.106 + .016 * sm(.05, .6, Math.abs(a));
 function bpPt(a, y, off, o) {
  bodyPt(a, y, off, o);
  const c = Math.cos(a); if (c > 0) { const x = o[0]; o[2] += c * (.008 * Math.exp(-(((Math.abs(x) - .066) / .05) ** 2) - ((y - 1.245) / .06) ** 2) + .004 * Math.exp(-x * x / .0005) * sm(1.23, 1.15, y)); }
  return o;
 }
 tinted(BRZ, () => add(slab(Q(40, 20), Q(16, 8), (u, v, o) => { const a = lerp(-2.05, 2.05, u); bpPt(a, lerp(bpTop(a), bpBot(a), v), .013, o); }, .005), M.bronze, wTorso));
 // the lame below it, with rivets
 tinted(BRZd, () => add(slab(Q(36, 18), 2, (u, v, o) => { const a = lerp(-1.95, 1.95, u); bodyPt(a, lerp(1.112, 1.078, v), .019, o); }, .004), M.bronze, wTorso));
 const trim = (pts, r, w) => add(tube(pts, Q(pts.length * 2, 10), Q(5, 4), () => r, 1, null), M.gold, w || wTorso);
 {
  const top = [], bot = [], lb = [];
  for (let i = 0; i <= 30; i++) { const a = lerp(-2.05, 2.05, i / 30); top.push(bpPt(a, bpTop(a) - .002, .0175, [0, 0, 0])); bot.push(bpPt(a, bpBot(a) + .002, .0175, [0, 0, 0])); }
  for (let i = 0; i <= 24; i++) { const a = lerp(-1.95, 1.95, i / 24); lb.push(bodyPt(a, 1.08, .0235, [0, 0, 0])); }
  trim(top, .0036); trim(bot, .0032); trim(lb, .0026);
  for (let k = -3; k <= 3; k++) { const p = bodyPt(k * .42, 1.095, .0235, [0, 0, 0]); add(new THREE.SphereGeometry(.0042, Q(8, 5), Q(6, 4)), M.gold, wTorso, p); }
 }
 {
  // the sun on her chest: long rays across and down, shorter ones up and between
  const L = [.054, .034, .092, .034, .1, .034, .092, .034], sh = new THREE.Shape();
  for (let k = 0; k < 8; k++) { const f = PI / 2 - k * PI / 4, fv = f - PI / 8; if (k) sh.lineTo(Math.cos(f) * L[k], Math.sin(f) * L[k]); else sh.moveTo(Math.cos(f) * L[k], Math.sin(f) * L[k]); sh.lineTo(Math.cos(fv) * .018, Math.sin(fv) * .018); }
  sh.closePath();
  const p0 = bpPt(0, 1.33, .0172, [0, 0, 0]), p1 = bpPt(.01, 1.33, .0172, [0, 0, 0]), p2 = bpPt(0, 1.34, .0172, [0, 0, 0]);
  const n = new THREE.Vector3(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]).cross(new THREE.Vector3(p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2])).normalize(); if (n.z < 0) n.negate();
  const q = new THREE.Quaternion().setFromUnitVectors(ZA, n);
  add(new THREE.ExtrudeGeometry(sh, { depth: .0026, bevelEnabled: false, curveSegments: 2 }), M.gold, wTorso, p0, null, null, q);
  add(new THREE.CylinderGeometry(.015, .017, .006, Q(16, 8)), M.gold, wTorso, [p0[0] + n.x * .003, p0[1] + n.y * .003, p0[2] + n.z * .003], null, null, new THREE.Quaternion().setFromUnitVectors(YA, n));
 }
 // a dark leather collar standing round her neck, open at the throat, piped in gold
 tinted([.26, .2, .17], () => add(slab(Q(28, 14), 3, (u, v, o) => { const a = lerp(.42, TAU - .42, u), r = lerp(.073, .063, v); o[0] = Math.sin(a) * r; o[1] = lerp(1.402, 1.492 - .03 * Math.max(0, Math.cos(a)) ** 2, v); o[2] = Math.cos(a) * r * .94 - .008; }, .004), M.leather, wNeck));
 { const pts = []; for (let i = 0; i <= 20; i++) { const a = lerp(.42, TAU - .42, i / 20); pts.push([Math.sin(a) * .064, 1.493 - .03 * Math.max(0, Math.cos(a)) ** 2, Math.cos(a) * .064 * .94 - .008]); } trim(pts, .0022, wNeck); }

 // ---------- the hood on her shoulders; a chain and sun clasps fasten the cape ----------
 function hoodPt(u, v, o) {
  const a = lerp(.6, TAU - .6, u), b = 1 - Math.abs(a - PI) / (PI - .6);
  const r = lerp(.08, lerp(.152, .182, b), v) + .032 * Math.sin(PI * v) * (.35 + .65 * b) + .008 * Math.sin(a * 9) * v;
  const y = lerp(1.462 - .008 * b, 1.425 - .14 * b * b * b, v) + .026 * Math.sin(PI * v) * (.5 + .5 * b);
  o[0] = Math.sin(a) * r; o[1] = y; o[2] = Math.cos(a) * r * .93 - .012; return o;
 }
 {
  const g = slab(Q(40, 20), Q(8, 5), hoodPt, .006), uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, .75, .985); // the lining's deeper navy, so the hood reads against the cape
  add(g, M.cape, BI.chest);
  const e = []; for (let i = 0; i <= 30; i++) { const p = hoodPt(i / 30, 1, [0, 0, 0]); e.push([p[0] * 1.012, p[1] - .002, p[2] * 1.012]); }
  trim(e, .0045, BI.chest);
  const cl2 = [hoodPt(0, .42, [0, 0, 0]), hoodPt(1, .42, [0, 0, 0])];
  for (const c of cl2) {
   c[2] += .008; const qn = new THREE.Quaternion().setFromUnitVectors(YA, _v.set(c[0] * 1.2, .3, 1).normalize());
   add(new THREE.CylinderGeometry(.013, .014, .006, Q(16, 8)), M.gold, BI.chest, c, null, null, qn);
   for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, d = new THREE.Vector3(Math.cos(a), 0, Math.sin(a)).applyQuaternion(qn); add(new THREE.ConeGeometry(.0034, k % 2 ? .008 : .012, 4), M.gold, BI.chest, [c[0] + d.x * .018, c[1] + d.y * .018, c[2] + d.z * .018], null, null, new THREE.Quaternion().setFromUnitVectors(YA, d)); }
  }
  add(new THREE.SphereGeometry(.0062, Q(10, 6), Q(8, 4)), M.stone, BI.chest, [cl2[1][0] + .002, cl2[1][1] + .001, cl2[1][2] + .006]);
  const ch = []; for (let i = 0; i <= 16; i++) { const t = i / 16, p = [lerp(cl2[0][0], cl2[1][0], t), lerp(cl2[0][1], cl2[1][1], t) - .03 * Math.sin(PI * t), 0]; p[2] = bodyPt(Math.atan2(p[0], .1), p[1], .022, [0, 0, 0])[2] + .004; ch.push(p); }
  add(tube(ch, Q(48, 24), 4, (t) => .0022 + .0009 * Math.cos(t * PI * 26) ** 2, 1, null), M.gold, BI.chest);
 }

 // ---------- two leather belts with gold buckles, and pouches at her hips ----------
 tinted([.42, .25, .14], () => {
  add(slab(Q(48, 24), 2, (u, v, o) => bodyPt(lerp(-PI, PI, u), lerp(1.045, 1.017, v), .015, o), .004), M.leather, wTorso);
  add(slab(Q(48, 24), 2, (u, v, o) => { const a = lerp(-PI, PI, u), yc = .985 - .026 * Math.sin(a); return bodyPt(a, yc + lerp(.013, -.013, v), .02, o); }, .004), M.leather, wTorso);
 });
 for (const [ab, yc, off] of [[0, 1.031, .02], [.55, .985 - .026 * Math.sin(.55), .025]]) {
  const p = bodyPt(ab, yc, off, [0, 0, 0]), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ab, 0));
  for (const [dx, dy, sx, sy] of [[-.02, 0, .005, .036], [.02, 0, .005, .036], [0, .0155, .045, .005], [0, -.0155, .045, .005]])
   add(new THREE.BoxGeometry(sx, sy, .006), M.gold, wTorso, [p[0] + Math.cos(ab) * dx, yc + dy, p[2] - Math.sin(ab) * dx], null, null, q);
  add(new THREE.BoxGeometry(.004, .03, .005), M.gold, wTorso, [p[0] + Math.sin(ab) * .002, yc, p[2] + Math.cos(ab) * .002], null, null, q);
 }
 const wHip = (sd) => (x, y) => [[BI.pelvis, .7], [BI['hip' + sd], .3]];
 for (const [ab, top, sd] of [[-1.3, 1.02, -1], [1.32, .968, 1]]) {
  const p = bodyPt(ab, top - .045, .045, [0, 0, 0]), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ab, 0));
  tinted([.36, .21, .11], () => add(new THREE.BoxGeometry(.064, .076, .032, 2, 2, 1), M.leather, wHip(sd), p, null, null, q));
  tinted([.27, .15, .08], () => add(new THREE.BoxGeometry(.068, .034, .036), M.leather, wHip(sd), [p[0] + Math.sin(ab) * .002, p[1] + .025, p[2] + Math.cos(ab) * .002], null, null, q));
  add(new THREE.SphereGeometry(.0045, Q(8, 5), Q(6, 4)), M.gold, wHip(sd), [p[0] + Math.sin(ab) * .02, p[1] + .01, p[2] + Math.cos(ab) * .02]);
 }

 // cream underskirt panels at her hips, either side of the tabard, falling to mid-thigh; the cape covers the back
 const wSkirt = (x, y) => { const k = .82 * sm(.97, .74, y), sL = sm(-.05, .05, x); return [[BI.pelvis, 1 - k], [BI['hip-1'], k * (1 - sL)], [BI['hip1'], k * sL]]; };
 for (const sd of [-1, 1]) add(toLinen(slab(Q(18, 9), Q(8, 4), (u, v, o) => { const a = sd * lerp(.3, 1.85, u), y = lerp(.995, .73 + .03 * Math.cos(a), v); bodyPt(a, Math.max(y, .88), .03 + .062 * sm(-.1, .8, v) + .005 * v * Math.sin(9 * a), o); o[1] = y; }, .003)), M.cloth, wSkirt);
 // the tabard, front and back: burnt orange, gold-bordered, pointed; the front carries the sun crest
 const tabW = (bonesT) => (x, y) => {
  if (y > .99) return [[BI.pelvis, 1]];
  if (y > .93) { const t = sm(.99, .94, y); return [[BI.pelvis, 1 - t], [BI[bonesT[0]], t]]; }
  const t = sm(.8, .74, y); return [[BI[bonesT[0]], 1 - t], [BI[bonesT[1]], t]];
 };
 for (const T of TAB) {
  const back = T.back, nu = Q(10, 6), nv = Q(26, 14);
  const g = surf(nu, nv, (u, v, o) => {
   const y = T.top - v * tabL(T, u), hw = lerp(T.hw0, T.hw1, v), x = (u - .5) * 2 * hw;
   const base = back ? -(.138 + .028 * sm(.95, .6, y)) : .108 + .04 * sm(1.0, .56, y);
   o[0] = x; o[1] = y; o[2] = base - (back ? -1 : 1) * 1.9 * x * x * (1 - .6 * v);
  }, false, back);
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) { const u = uv.getX(i), v = 1 - uv.getY(i); uv.setXY(i, (back ? .5 : 0) + u * .5, 1 - v * tabL(T, u) / T.Lt); }
  add(g, M.tabard, tabW(back ? ['tabB1', 'tabB2'] : ['tabF1', 'tabF2']));
 }

 // ---------- arms: full linen sleeves pushed to the elbows, bronze vambraces, dark leather gloves ----------
 for (const sd of [-1, 1]) {
  const cx = sd * .195, cz = -.01;
  add(toLinen(lathe([[.02, 1.47], [.06, 1.457], [.08, 1.425], [.089, 1.375], [.09, 1.31], [.087, 1.245], [.081, 1.19], [.073, 1.145], [.066, 1.118], [.062, 1.105]], Q(28, 14), { cx, cz, sub: 2, fn: (p, a, v) => { const k = 1 + .06 * Math.sin(8 * a + sd) * sm(.15, .6, v) + .04 * Math.sin(5 * a - sd) * sm(.6, 1, v); p[0] = cx + (p[0] - cx) * k; p[2] = cz + (p[2] - cz) * k; } })), M.cloth, wArm);
  add(toLinen(new THREE.TorusGeometry(.061, .0135, Q(8, 5), Q(24, 12))), M.cloth, wArm, [cx, 1.104, cz], [PI / 2, 0, 0]);
  add(toLinen(new THREE.TorusGeometry(.066, .01, Q(8, 5), Q(24, 12))), M.cloth, wArm, [cx, 1.124, cz], [PI / 2, .1 * sd, 0]);
  const fa = lathe([[.041, 1.17], [.0405, 1.11], [.0435, 1.05], [.042, .99], [.036, .92], [.031, .875], [.029, .855]], Q(20, 12), { cx, cz, sub: 2 });
  const uv = fa.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, .5 + (sd < 0 ? 0 : .25) + uv.getX(i) * .25);
  add(fa, M.skin, wArm);
  tinted(BRZ, () => add(lathe([[.056, 1.046], [.052, 1.034], [.0485, 1.0], [.045, .96], [.041, .92], [.0392, .888], [.0385, .868]], Q(22, 12), { cx, cz, sub: 2 }), M.bronze, BI['elbow' + sd]));
  tinted(BRZl, () => add(slab(Q(4, 3), Q(8, 4), (u, v, o) => { const a = lerp(-.42, .42, u) + sd * PI / 2, y = lerp(1.03, .885, v), r = lerp(.0505, .041, v) + .003; o[0] = cx + Math.sin(a) * r; o[1] = y; o[2] = cz + Math.cos(a) * r; }, .003), M.bronze, BI['elbow' + sd]));
  for (const [y, r] of [[1.045, .057], [.87, .0395]]) add(new THREE.TorusGeometry(r, .0036, Q(6, 4), Q(22, 12)), M.gold, BI['elbow' + sd], [cx, y, cz], [PI / 2, 0, 0]);
  // gloved hand
  const W0 = bw(wrists[sd < 0 ? 0 : 1]), H = (p) => [W0[0] + p[0], W0[1] + p[1], W0[2] + p[2]];
  const wr = BI['wrist' + sd], f = ['fing1' + sd, 'fing2' + sd, 'fing3' + sd].map((n) => BI[n]);
  tinted([.3, .17, .1], () => {
   add(lathe([[.0405, .876], [.043, .862], [.047, .846], [.046, .836]], Q(18, 10), { cx, cz, sub: 1 }), M.leather, (x, y) => [[BI['elbow' + sd], sm(.85, .876, y)], [wr, 1 - sm(.85, .876, y)]]);
   add(new THREE.SphereGeometry(1, Q(16, 8), Q(12, 6)), M.leather, wr, H([-sd * .002, -.05, 0]), null, [.0178, .05, .041]);
   add(new THREE.SphereGeometry(1, Q(12, 6), Q(8, 5)), M.leather, wr, H([-sd * .008, -.036, .022]), null, [.012, .026, .014]);
   const zs = [.026, .0088, -.0088, -.026], ls = [.97, 1, .95, .8];
   for (let k = 0; k < 4; k++) {
    const z = zs[k], s = ls[k], r = .0092 * (k === 3 ? .86 : 1), x = -sd * .004;
    const j = [[x, -.088, z], [x, -.088 - .045 * s, z], [x, -.088 - .075 * s, z], [x, -.088 - .098 * s, z]].map(H);
    seg(M.leather, f[0], j[0], j[1], r, r * .95, Q(8, 5), true);
    seg(M.leather, f[1], j[1], j[2], r * .95, r * .88, Q(8, 5), true);
    seg(M.leather, f[2], j[2], j[3], r * .88, r * .8, Q(8, 5), true);
   }
   const t1 = BI['thumb1' + sd], t2 = BI['thumb2' + sd], tb = [[-sd * .006, -.032, .03], [-sd * .006, -.068, .038], [-sd * .006, -.094, .042]].map(H);
   seg(M.leather, t1, tb[0], tb[1], .0105, .0095, Q(8, 5), true);
   seg(M.leather, t2, tb[1], tb[2], .0095, .0085, Q(8, 5), true);
  });
 }

 // ---------- pauldrons: kestrel feathers and a sunstone boss on the left, a small plain plate on the right ----------
 for (const sd of [-1, 1]) {
  const C = [sd * .205, 1.398, -.008], R = sd > 0 ? .096 : .086, Pz = new THREE.Vector3(sd * .5, 1, 0).normalize();
  const E1 = new THREE.Vector3(0, 0, 1), E2 = new THREE.Vector3().crossVectors(Pz, E1).normalize(), D = new THREE.Vector3();
  const S = BI['shoulder' + sd], wP = [[BI.chest, .25], [S, .75]];
  const capP = (al, be, rr) => { D.copy(Pz).multiplyScalar(Math.cos(be)).addScaledVector(E1, Math.cos(al) * Math.sin(be)).addScaledVector(E2, Math.sin(al) * Math.sin(be)); return [C[0] + D.x * rr, C[1] + D.y * rr, C[2] + D.z * rr * 1.12]; };
  const BE = sd > 0 ? 1.15 : 1.02;
  tinted(BRZ, () => add(slab(Q(28, 14), Q(8, 5), (u, v, o) => { const p = capP(u * TAU, v * BE, R); o[0] = p[0]; o[1] = p[1]; o[2] = p[2]; }, .006), M.bronze, () => wP));
  { const rim = []; for (let i = 0; i <= 28; i++) rim.push(capP(i / 28 * TAU, BE, R + .004)); trim(rim, .0034, () => wP); }
  if (sd < 0) {
   for (let k = 0; k < 2; k++) {
    tinted(k ? BRZd : BRZ, () => add(slab(Q(16, 8), 3, (u, v, o) => { const ph = lerp(-1.4, 1.4, u), r = .086 + .006 * k + .013 * v, y = 1.37 - .03 * k - .044 * v; o[0] = C[0] - Math.cos(ph) * r; o[1] = y; o[2] = C[2] + Math.sin(ph) * r * 1.08; }, .0045), M.bronze, () => [[BI.chest, .12], [S, .88]]));
   }
   const e = []; for (let i = 0; i <= 16; i++) { const ph = lerp(-1.4, 1.4, i / 16), r = .1 + .0045; e.push([C[0] - Math.cos(ph) * r, 1.37 - .03 - .044, C[2] + Math.sin(ph) * r * 1.08]); }
   trim(e, .003, () => [[BI.chest, .12], [S, .88]]);
   continue;
  }
  // the sun boss and its sunstone
  const bd = new THREE.Vector3(.55, .62, .56).normalize(), bp = [C[0] + .052, C[1] + .066, C[2] + .05], bq = new THREE.Quaternion().setFromUnitVectors(YA, bd);
  const at = (k) => [bp[0] + bd.x * k, bp[1] + bd.y * k, bp[2] + bd.z * k];
  add(new THREE.CylinderGeometry(.027, .03, .01, Q(22, 10)), M.gold, () => wP, bp, null, null, bq);
  add(new THREE.TorusGeometry(.0165, .0032, Q(6, 4), Q(18, 10)), M.gold, () => wP, at(.006), null, null, bq.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), PI / 2)));
  add(new THREE.SphereGeometry(.0145, Q(14, 8), Q(10, 6)), M.stone, () => wP, at(.004), null, [1, .55, 1], bq);
  for (let k = 0; k < 12; k++) {
   const a = k / 12 * TAU, L = k % 2 ? .013 : .022, dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a)).applyQuaternion(bq);
   add(new THREE.ConeGeometry(.0048, L, 4), M.gold, () => wP, [bp[0] + dir.x * (.028 + L / 2), bp[1] + dir.y * (.028 + L / 2), bp[2] + dir.z * (.028 + L / 2)], null, null, new THREE.Quaternion().setFromUnitVectors(YA, dir));
  }
  // four rows of long bronze feathers fanning down and back over the upper arm
  const F = new THREE.Vector3(), N = new THREE.Vector3(), Sv = new THREE.Vector3();
  [[8, .1, .084, .036], [8, .13, .08, .014], [7, .16, .074, -.01], [7, .19, .068, -.034]].forEach(([n, L, rad, yo], row) => {
   for (let k = 0; k < n; k++) {
    const be = lerp(-.9, 1.25, (k + .5 * (row % 2)) / (n - .5)), rt = [C[0] + Math.cos(be) * rad * .9, C[1] + yo, C[2] + Math.sin(be) * rad];
    F.set(.42 + .07 * row, -1, .42 * Math.sin(be) + .12).normalize();
    N.set(Math.cos(be), .28, Math.sin(be)).normalize(); N.addScaledVector(F, -N.dot(F)).normalize(); Sv.crossVectors(F, N);
    const len = L * (1 + .12 * Math.sin(be)), Wd = .02;
    tinted(row % 2 ? BRZd : (k % 2 ? BRZ : BRZl), () => add(slab(Q(4, 3), Q(8, 5), (u, v, o) => {
     const w = Wd * (v < .7 ? lerp(.62, 1, sm(0, .45, v)) : Math.sqrt(Math.max(0, 1 - ((v - .7) / .3) ** 2)) * .95 + .05), s = (u - .5) * 2;
     const lift = .005 * (1 - s * s) + .02 * v * v;
     o[0] = rt[0] + F.x * v * len + Sv.x * s * w + N.x * lift; o[1] = rt[1] + F.y * v * len + Sv.y * s * w + N.y * lift; o[2] = rt[2] + F.z * v * len + Sv.z * s * w + N.z * lift;
    }, .0035), M.bronze, BI.pauld));
   }
  });
 }

 // ---------- legs: dark trousers, round knee cops, bronze greaves over strapped leather boots ----------
 for (const sd of [-1, 1]) {
  const cx = sd * .095, K = BI['knee' + sd];
  add(toTrousers(lathe([[.072, .975], [.088, .93], [.092, .86], [.09, .77], [.083, .67], [.072, .585], [.063, .53], [.059, .48], [.058, .43]], Q(24, 12), { cx, cz: .004, sub: 2, fn: (p) => { if ((p[0] - cx) * sd < 0) p[0] = cx + (p[0] - cx) * .84; } })), M.cloth, wLeg);
  tinted([.4, .25, .14], () => {
   add(lathe([[.061, .462], [.0585, .44], [.059, .39], [.058, .31], [.051, .23], [.046, .16], [.047, .12], [.05, .1]], Q(22, 12), { cx, cz: .002, sub: 2 }), M.leather, wLeg);
   add(new THREE.TorusGeometry(.06, .006, Q(6, 4), Q(22, 12)), M.leather, wLeg, [cx, .458, .002], [PI / 2, 0, 0]);
  });
  // straps with gold buckles round the boot shafts
  for (const y of [.375, .29, .2]) {
   const br = crv([[.448, .059], [.39, .059], [.31, .058], [.23, .051], [.16, .046], [.12, .047]], 1, y) + .0035;
   tinted([.25, .14, .08], () => add(slab(Q(20, 10), 1, (u, v, o) => { const a = lerp(-PI, PI, u); o[0] = cx + Math.sin(a) * br; o[1] = y + lerp(.007, -.007, v); o[2] = .002 + Math.cos(a) * br; }, .002), M.leather, wLeg));
   add(new THREE.BoxGeometry(.004, .014, .012), M.gold, wLeg, [cx + sd * (br + .002), y, .002]);
  }
  // knee cop: a round dome with a fan on the outside, rimmed in gold
  const kw = [[BI['hip' + sd], .4], [K, .6]], kc = [cx, .51, .05];
  const kp = (al, be, o) => { o[0] = kc[0] + Math.sin(be) * Math.cos(al) * .058; o[1] = kc[1] + Math.sin(be) * Math.sin(al) * .064; o[2] = kc[2] + Math.cos(be) * .028 - .012 * Math.sin(be) ** 2; return o; };
  tinted(BRZ, () => add(slab(Q(18, 9), Q(8, 5), (u, v, o) => kp(u * TAU, v * 1.35, o), .004), M.bronze, () => kw));
  { const rim = []; for (let i = 0; i <= 24; i++) rim.push(kp(i / 24 * TAU, 1.35, [0, 0, 0])); trim(rim, .003, () => kw); }
  tinted(BRZ, () => add(slab(Q(7, 4), Q(5, 3), (u, v, o) => { const a = lerp(-1.1, 1.1, u), r = .016 + .04 * v; o[0] = cx + sd * (.068 + .012 * v); o[1] = .51 + Math.sin(a) * r; o[2] = .006 + Math.cos(a) * r * .85; }, .0035), M.bronze, () => kw));
  // greave over the front of the shin, gold-trimmed top and bottom
  const gr = (a, y, o) => { const br = crv([[.448, .059], [.39, .059], [.31, .058], [.23, .051], [.16, .046], [.12, .047]], 1, y); const r = br + .008 + .005 * Math.cos(a) ** 10 + .006 * sm(.37, .4, y), cz = lerp(-.004, .008, (y - .085) / .41); o[0] = cx + Math.sin(a) * r; o[1] = y; o[2] = cz + Math.cos(a) * r; return o; };
  tinted(BRZ, () => add(slab(Q(16, 8), Q(10, 5), (u, v, o) => gr(lerp(-1.3, 1.3, u), lerp(.42, .145, v), o), .0045), M.bronze, wLeg));
  for (const y of [.418, .147]) { const e = []; for (let i = 0; i <= 14; i++) { const p = gr(lerp(-1.3, 1.3, i / 14), y, [0, 0, 0]); e.push([p[0] + (p[0] - cx) * .06, p[1], p[2] + (p[2] - .002) * .06]); } trim(e, .0032, wLeg); }
  const A0 = bw(ankles[sd < 0 ? 0 : 1]), Fp = (p) => [A0[0] + p[0], A0[1] + p[1], A0[2] + p[2]], wf = wFoot;
  // boot: one sculpted shell (heel, instep, rounded toe), a sole and a heel block, a strap across the instep
  const li = (tab, x) => { for (let i = 1; i < tab.length; i++) if (x <= tab[i][0]) return lerp(tab[i - 1][1], tab[i][1], cl((x - tab[i - 1][0]) / (tab[i][0] - tab[i - 1][0]), 0, 1)); return tab[tab.length - 1][1]; };
  const BW = [[-.075, .032], [-.04, .039], [0, .043], [.09, .047], [.15, .042], [.178, .034]], BT = [[-.075, -.03], [-.03, .022], [.01, .032], [.06, .002], [.11, -.028], [.178, -.052]];
  const bootPt = (u, v, off, o) => {
   const a = lerp(-PI, PI, u), z = lerp(-.075, .178, v), e = Math.sqrt(Math.max(0, 1 - Math.pow(2 * v - 1, 6))), top = li(BT, z), bot = -.079;
   const w = li(BW, z) * e + off, h = (top - bot) / 2 * Math.sqrt(e) + off, sa = Math.sin(a), ca = Math.cos(a);
   const p = Fp([Math.sign(sa) * Math.pow(Math.abs(sa), .8) * w, (top + bot) / 2 + Math.sign(ca) * Math.pow(Math.abs(ca), .8) * h, z]); o[0] = p[0]; o[1] = p[1]; o[2] = p[2];
  };
  tinted([.4, .24, .13], () => add(surf(Q(22, 12), Q(18, 10), (u, v, o) => bootPt(u, v, 0, o), true), M.leather, wf));
  tinted([.25, .14, .08], () => add(slab(Q(10, 5), 1, (u, v, o) => bootPt(lerp(.25, .75, u), lerp(.5, .58, v), .0025, o), .002), M.leather, wf));
  add(new THREE.BoxGeometry(.012, .004, .012), M.gold, wf, Fp([sd * .046, -.005, .045]));
  tinted([.16, .1, .065], () => {
   add(slab(Q(10, 6), Q(14, 8), (u, v, o) => { const z = lerp(-.078, .182, v), e = Math.sqrt(Math.max(0, 1 - Math.pow(2 * v - 1, 6))), p = Fp([lerp(-1, 1, u) * (li(BW, z) * e + .005), -.077, z]); o[0] = p[0]; o[1] = p[1]; o[2] = p[2]; }, .009), M.leather, wf);
   add(new THREE.CylinderGeometry(.03, .032, .02, Q(12, 6)), M.leather, wf, Fp([0, -.075, -.045]));
  });
 }

 // ---------- cape: midnight blue edged in gold, a sun on the back, falling to a point behind her knees ----------
 function capePt(u, v, o) {
  // past a right angle from the back, cos turns negative and the edge comes forward over the shoulder
  const tp = lerp(-CT, CT, u), s = Math.sin(tp), ct = Math.cos(tp), c = Math.sign(ct) * Math.pow(Math.abs(ct), .35);
  if (v < .1) {
   const k = v / .1, kk = sm(0, 1, k);
   // the top arches out over the shoulder caps (their tops are near 1.45 m), then the cape falls outside the arms
   o[0] = s * lerp(.1, .275, kk); o[2] = -c * lerp(.08, .14, kk); o[1] = lerp(1.458 - .012 * s * s, 1.432 - .045 * s * s, k) + .036 * Math.sin(PI * k) * (.4 + .6 * s * s);
  } else {
   const k = (v - .1) / .9, yH = hem(tp), fold = (.016 * Math.sin(6.5 * tp + 1.0) + .007 * Math.sin(13 * tp + .3)) * Math.pow(k, 1.2);
   const rx = lerp(.275, .35, Math.pow(k, 1.1)) + fold, rz = lerp(.14, .235, Math.pow(k, .85)) + fold;
   o[0] = s * rx; o[2] = -c * rz - .012 * Math.sin(PI * Math.min(1, k * 2.2)); o[1] = lerp(1.432 - .045 * s * s, yH, k);
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
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * .5, 1 - (CTOP - p.getY(i)) / CLEN);
  const gl = g.clone(), ul = gl.attributes.uv; for (let i = 0; i < ul.count; i++) ul.setX(i, ul.getX(i) + .5);
  const wC = (x, y, z, i) => {
   const u = (i % (nu + 1)) / nu, v = Math.floor(i / (nu + 1)) / nv, f = Math.min(3.999, u * 4), k0 = Math.floor(f), fr = f - k0;
   const t1 = sm(.08, .2, v), t2 = sm(.48, .64, v);
   return [[BI.chest, 1 - t1], [BI['capeU' + k0], t1 * (1 - t2) * (1 - fr)], [BI['capeU' + (k0 + 1)], t1 * (1 - t2) * fr], [BI['capeL' + k0], t1 * t2 * (1 - fr)], [BI['capeL' + (k0 + 1)], t1 * t2 * fr]];
  };
  add(g, M.cape, wC); add(gl, M.lining, wC);
 }

 // ---------- the sunsteel sword, built along +Y, edge toward +Z, then put in her right fist ----------
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
  swAdd(bladeFace(sd, .72, 1, .0005), M.edge);
  // the fuller: a darker line down the middle of each face
  tinted([.42, .27, .12], () => swAdd(surf(1, 8, (u, v, o) => { const y = lerp(.09, .74, v), zc = lerp(spineZ(y), edgeZ(y), .32); o[0] = sd * (thick(y) * .92 + .0005); o[1] = y; o[2] = zc + (u - .5) * .0055; }, false, sd < 0), M.bronze));
 }
 swAdd(surf(1, Q(28, 14), (u, v, o) => { const y = lerp(BL0, BL1, v); o[0] = lerp(-1, 1, u) * thick(y); o[1] = y; o[2] = spineZ(y); }), M.steel);
 // the crossguard: a spiky gold sun holding an orange sunstone, with two long quillons
 swAdd(new THREE.CylinderGeometry(.025, .025, .02, Q(20, 10)), M.gold, [0, .055, 0], [0, 0, PI / 2]);
 swAdd(new THREE.TorusGeometry(.034, .0046, Q(6, 4), Q(26, 12)), M.gold, [0, .055, 0], [0, PI / 2, 0]);
 for (const s of [-1, 1]) {
  swAdd(new THREE.ConeGeometry(.0095, .09, Q(8, 4)), M.gold, [0, .055, s * .081], [s * PI / 2, 0, 0], [1, 1, .62]);
  swAdd(new THREE.SphereGeometry(.0085, Q(8, 5), Q(6, 4)), M.gold, [0, .055, s * .037]);
 }
 swAdd(new THREE.ConeGeometry(.009, .044, Q(8, 4)), M.gold, [0, .108, .004], null, [.5, 1, 1]);
 for (let k = 0; k < 12; k++) {
  const a = (k + .5) / 12 * TAU, dy = Math.sin(a), dz = Math.cos(a);
  if (Math.abs(dz) > .95) continue;
  swAdd(new THREE.ConeGeometry(.0052, k % 2 ? .022 : .032, 4), M.gold, [0, .055 + dy * .05, dz * .05], null, null, new THREE.Quaternion().setFromUnitVectors(YA, new THREE.Vector3(0, dy, dz)));
 }
 swAdd(new THREE.SphereGeometry(.0158, Q(14, 8), Q(10, 6)), M.stone, [0, .055, 0], null, [.92, 1, 1]);
 // a dark leather grip with gold bands, and a round sun pommel
 tinted([.2, .11, .06], () => swAdd(lathe([[.0146, .047], [.0158, .0], [.0163, -.06], [.0157, -.12], [.0148, -.163]], Q(14, 8), { sub: 3, fn: (p, a, v) => { const k = 1 + .06 * Math.sin(v * 38 + a * 2) ** 2; p[0] *= k; p[2] *= k; } }), M.leather));
 for (const y of [.046, -.06, -.162]) swAdd(new THREE.TorusGeometry(.0162, .0031, Q(5, 4), Q(16, 8)), M.gold, [0, y, 0], [PI / 2, 0, 0]);
 swAdd(new THREE.CylinderGeometry(.011, .013, .016, Q(12, 6)), M.gold, [0, -.17, 0]);
 swAdd(new THREE.CylinderGeometry(.025, .025, .016, Q(20, 10)), M.gold, [0, -.192, 0], [0, 0, PI / 2]);
 swAdd(new THREE.SphereGeometry(.0085, Q(10, 6), Q(8, 5)), M.stone, [0, -.192, 0], null, [1.3, 1, 1]);
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
 const upC = cvs(64, 256), ug = upC.getContext('2d');
 for (let y = 0; y < 256; y += 2) { const v = y / 256, a = Math.sin(PI * Math.pow(v, 1.4)) * (.55 + .45 * Math.sin(y * .19) ** 2), x0 = 32 + 5 * Math.sin(y * .06), gr = ug.createLinearGradient(x0 - 30, 0, x0 + 30, 0); gr.addColorStop(0, 'rgba(255,190,110,0)'); gr.addColorStop(.5, 'rgba(255,190,110,' + a.toFixed(3) + ')'); gr.addColorStop(1, 'rgba(255,190,110,0)'); ug.fillStyle = gr; ug.fillRect(0, y, 64, 2); }
 const updraft = new THREE.Sprite(new THREE.SpriteMaterial(addB(tex(upC), 0xffa850))); updraft.renderOrder = 5; fx.add(updraft);
 const burst = new THREE.Sprite(new THREE.SpriteMaterial(addB(halo.material.map, 0xffd890))); burst.renderOrder = 8; fx.add(burst);
 const _pw = new THREE.Vector3();
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
  y: -.07, x: 0, z: 0, pX: .06, pY: -.32, pZ: 0, sX: .02, sY: .06, sZ: 0, cX: .04, cY: .14, cZ: 0, nX: 0, nY: .05, hX: .03, hY: .08, hZ: 0,
  rFx: -.2, rFy: 0, rFz: -.17, rFr: -.62, rFp: 0, lFx: .17, lFy: 0, lFz: .2, lFr: .12, lFp: 0,
  gx: -.05, gy: 1.0, gz: .29, dx: .18, dy: .55, dz: .82, ex: 0, ey: -.83, ez: .56,
  rPx: -.8, rPy: -.45, rPz: -.35,
  two: 1, lik: 0, lbl: 0, ltx: .2, lty: .95, ltz: .1, lPx: .8, lPy: -.45, lPz: -.25,
  lSX: -.1, lSY: 0, lSZ: .15, lE: -.3, lWX: 0, lWZ: 0,
  fR: 1, fL: 1, br: .12, bl: 0, cs: 0, bs: 0, mo: 0
 };
 const CH = Object.keys(READY).filter((k) => k !== 'mo');
 const cp = (a, b) => { for (const k of CH) a[k] = b[k]; a.mo = b.mo; return a; };
 const mix = (a, b, w) => { if (w <= 0) return a; for (const k of CH) a[k] += (b[k] - a[k]) * w; if (w >= .5) a.mo = b.mo; return a; };
 const GUARD = Object.assign({}, READY, {
  y: -.13, pX: .1, pY: -.18, cX: .06, cY: .06, hX: .08, hY: .1,
  rFx: -.25, rFz: -.12, rFr: -.55, lFx: .22, lFz: .2, lFr: .28,
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
 hn.push(K(.77, { y: .04, pX: -.06, cX: -.12, hX: -.35, lFz: .12, rFz: -.12, mo: 1 }, [0, 1.84, .12, 0, 1, .03, 0, 0, 1]));
 hn.push(K(.85, { y: -.24, pX: .3, cX: .2, hX: .04, pY: .25, cY: .15, lFz: .44, rFz: -.34, mo: 2, br: 1 }, [.1, .86, .56, .45, -.45, .77]));
 hn.push(K(.93, { y: -.22, pY: .32, cY: .2 }, [.24, .76, .42, .78, -.4, .48]));
 hn.push(K(1, READY));
 act('highNoon', 3.2, hn, { hits: [.12, .22, .32, .42, .52, .62, .85], dash: (u) => (u > .05 && u < .62 ? .9 : 0), trail: [[.05, .66], [.77, .92]], flare: [[.78, .97]] });
 act('transform', 2.6, [
  K(0, {}),
  K(.2, { y: -.07, hX: .28, pY: -.15, cY: .08, br: .25, bl: .75, mo: 3, rPx: -.7, rPy: -.6, rPz: .1, lPx: .7, lPy: -.6, lPz: .1 }, [0, 1.25, .22, 0, 1, .05, 0, 0, 1]),
  K(.38, { y: -.1, hX: .3 }),
  K(.52, Object.assign({}, ONE, { y: .01, pX: -.08, cX: -.2, hX: -.42, bl: .85, mo: 0, br: 0, lSX: -.05, lSZ: 1.15, lE: -.12, fL: 0, pY: -.1, cY: .05 }), [-.36, .9, .2, -.28, -.6, .75]),
  K(.66, { y: .02, cX: -.22, hX: -.45 }),
  K(.76, { y: -.04, pX: .02, cX: -.04, hX: -.05, bl: 0, lSZ: .5, lSX: -.2, lE: -.3, fL: .1, pY: -.4, cY: -.1 }, [-.42, 1.1, .22, -.8, -.15, .55]),
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

 // Kestrel Stoop, turn one: she crouches, springs about 3 m up and hangs there like a kestrel, her cape spread like wings,
 // her braid streaming, her sword drawn back over her shoulder, bobbing slowly over a faint amber updraft until she stoops.
 const UP = 2.95;
 const HOVER = Object.assign({}, READY, { y: UP, pX: .2, pY: -.12, cX: .08, cY: .06, hX: -.1, hY: .06,
  rFx: -.13, rFy: UP + .22, rFz: -.2, rFr: -.2, rFp: .55, lFx: .13, lFy: UP + .3, lFz: -.02, lFr: .15, lFp: .7,
  two: 0, lik: 0, lbl: 0, lSX: .2, lSY: 0, lSZ: .9, lE: -.35, fL: .25, rPx: -.5, rPy: .25, rPz: -.8, cs: 1, bs: 1, br: .55, mo: 0 });
 const HSW = [-.2, 1.6 + UP, -.1, -.12, .42, -.9, 0, .9, .42];
 const hsw = (dy) => [HSW[0], HSW[1] + dy, HSW[2], HSW[3], HSW[4], HSW[5], HSW[6], HSW[7], HSW[8]];
 act('stoopRise', 1.4, [
  K(0, {}),
  K(.16, Object.assign({}, ONE, { y: -.26, pX: .38, cX: .16, hX: -.05, rFz: -.2, lFz: .2, br: .7, mo: 1, cs: .15, rPx: -.5, rPy: .2, rPz: -.7 }), [-.24, 1.28, -.12, -.2, .5, -.84, 0, .84, .5]),
  K(.3, { y: .14, pX: -.12, cX: -.1, hX: -.2, rFp: .5, lFp: .45, rFy: .02, lFy: .04, cs: .4, bs: .3, mo: 2 }, [-.2, 1.76, -.1, -.12, .45, -.88, 0, .88, .45]),
  K(.5, { y: 2.2, pX: .1, cX: .04, hX: -.15, rFy: 2.45, lFy: 2.5, rFz: -.15, lFz: -.05, rFp: .5, lFp: .6, lSX: .2, lSZ: .8, cs: .85, bs: .8, mo: 1 }, hsw(2.2 - UP)),
  K(.7, Object.assign({}, HOVER, { y: UP + .1, rFy: UP + .32, lFy: UP + .4 }), hsw(.1)),
  K(1, HOVER, HSW)
 ], { hold: true, interrupt: false, bi: .1, updraft: [[.32, 1.2]],
  post: (u, P, t) => { if (u < .62) return; const k = sm(.62, .9, u), b = .055 * Math.sin(t * 2.1) * k; for (const c of ['y', 'rFy', 'lFy', 'gy', 'lty']) P[c] += b; P.pX += .03 * Math.sin(t * 2.1 + 1.2) * k; P.pZ += .025 * Math.sin(t * 1.3) * k; } });
 // turn two: she folds and dives sword-first at state.target (dash carries her there), lands the biggest blow in the game
 // with a sunburst and a splash of sparks, and rises out of the landing crouch
 let stoopD = 2.5;
 act('stoop', 1.4, [
  K(0, HOVER, HSW),
  K(.1, { y: UP + .12, pX: .5, cX: .25, hX: -.35, rFy: UP + .45, lFy: UP + .5, rFz: -.3, lFz: -.22, two: 1, cs: .4, bs: .2, br: .9, mo: 1, rPx: -.8, rPy: -.45, rPz: -.35, lPx: .8, lPy: -.45, lPz: -.25 }, [0, 1.37 + UP, .3, 0, .55, .83, 0, .83, -.55]),
  K(.24, { y: 1.8, pX: 1.05, cX: .32, hX: -.75, rFy: 2.62, lFy: 2.7, rFz: -.78, lFz: -.66, rFp: .9, lFp: .9, cs: 0, bs: 0, mo: 2 }, [0, 2.62, .62, 0, -.7, .71, 0, .71, .7]),
  K(.36, { y: .7, pX: .95, cX: .3, hX: -.68, rFy: 1.38, lFy: 1.3, rFz: -.68, lFz: -.42, rFp: .6, lFp: .5 }, [0, 1.52, .66, 0, -.62, .78]),
  K(.45, { y: -.32, pX: .42, cX: .22, hX: -.1, rFy: 0, lFy: 0, rFz: -.36, lFz: .36, rFp: 0, lFp: 0, br: 1, mo: 2 }, [0, .98, .58, 0, -.36, .93]),
  K(.6, { y: -.36, pX: .45, cX: .24, hX: 0, mo: 1 }, [0, .88, .54, 0, -.62, .78]),
  K(.82, { y: -.14, pX: .16, cX: .08, br: .4, mo: 0, rFz: -.2, lFz: .22 }, [-.02, .95, .32, .05, .4, .92]),
  K(1, READY)
 ], { hits: [.45], sparks: [.45], sparkN: 40, burst: .45, aim: true, fire: [[.08, .48]], fireK: .7, trail: [[.1, .5]],
  dash: (u) => (u > .1 && u < .45 ? stoopD * PI / (2 * 1.4 * .35) * Math.sin(PI * (u - .1) / .35) : 0) });

 // reactions
 act('hurt', .6, [
  K(0, {}),
  K(.18, { pX: -.3, cX: -.26, hX: -.42, y: -.09, two: 0, lik: 0, lSX: -1.5, lSZ: .55, lE: -.75, fL: .1, mo: 2, br: 1, bl: .5 }, [-.24, 1.0, .16, -.5, -.2, .84]),
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
  head.localToWorld(COL[9].a.set(0, .11, 0)); COL[9].r = .13;
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
 const chBraid = chain(braid, new THREE.Vector3(0, -.096, 0), { K: 42, C: 4.2, gk: .55, cols: [0, 1, 2, 9], m: .03, breeze: .006 });
 const chCape = capeU.map((b, k) => chain([b, capeL[k]], capeTip[k], { K: 36, C: 4.6, gk: .45, cols: [0, 1, 2, 3, 4, 5, 6, 7, 8], m: .032, breeze: .012, wing: new THREE.Vector3((k - 2) * .55, -.55 + .22 * Math.abs(k - 2), -.75 + .2 * Math.abs(k - 2)).normalize() }));
 const chTabF = chain(tabF, new THREE.Vector3(0, -.4, .004), { K: 46, C: 5.5, gk: .6, cols: [3, 4, 5, 6], m: .022, breeze: .004 });
 const chTabB = chain(tabB, new THREE.Vector3(0, -.35, -.004), { K: 46, C: 5.5, gk: .6, cols: [2, 3, 4, 5, 6], m: .02 });
 const TT = [[-.02, -.07, .006], [.02, -.07, .006], [.02, -.05, .05], [0, -.03, -.075]];
 const chTuft = tufts.map((b, i) => chain([b], new THREE.Vector3(TT[i][0], TT[i][1], TT[i][2]), { K: 58, C: 5.5, gk: .12, hair: true }));
 const chPauld = chain([pauld], new THREE.Vector3(.012, -.13, 0), { K: 60, C: 5, gk: .08 });
 const CHAINS = [chBraid, ...chCape, chTabF, chTabB, ...chTuft, chPauld];
 const _cq = new THREE.Quaternion(), _cq2 = new THREE.Quaternion(), _cq3 = new THREE.Quaternion(), _cq4 = new THREE.Quaternion(), _cv = new THREE.Vector3(), _cw = new THREE.Vector3(), _cj = new THREE.Vector3();
 function physics(t, dt, tk, reset) {
  updateColliders();
  let ci = 0;
  const fl = Math.max(tk, cl(FIN.bs, 0, 1)), wing = cl(FIN.cs, 0, 1);
  if (wing > .001) chest.getWorldQuaternion(_cq4);
  for (const ch of CHAINS) {
   ci++;
   const gk = ch === chBraid ? lerp(ch.gk, -.3, fl) : ch.hair ? lerp(ch.gk, -.55, fl) : ch.gk;
   ch.bs[0].getWorldPosition(_cj);
   for (let i = 0; i < ch.bs.length; i++) {
    ch.bs[i].getWorldQuaternion(_cq); _cv.copy(ch.offs[i]).applyQuaternion(_cq).normalize().lerp(DOWN, gk);
    if (ch.wing && wing > .001) _cv.lerp(_cw.copy(ch.wing).applyQuaternion(_cq4), wing * (i ? .85 : .7));
    if (ch.breeze) { const bz = ch.breeze * (ch === chBraid ? 1 + 3 * fl : 1); _cv.x += bz * Math.sin(t * 1.3 + ci * .9 + i); _cv.z += bz * .7 * Math.sin(t * .9 + ci * 1.7 + i * .5); }
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
 const st = { init: false, px: 0, pz: 0, ry: 0, ph: 0, spd: 0 };
 let actv = null, gOn = false, gW = 0, dashV = 0, liftV = 0, fadeV = 1, prevU = 0, eAcc = 0, uAcc = 0, trOn = 0, rbT = 0;
 let blinkIn = 2, blinkT = -1, lookT = 1.2, gzX = 0, gzY = 0, gzTX = 0, gzTY = 0, mCur = 0, mNext = 0, mK = 1;
 const _p1 = new THREE.Vector3(), _p2 = new THREE.Vector3(), _p3 = new THREE.Vector3(), _p4 = new THREE.Vector3();
 const AMB = new THREE.Color(1.0, .45, .08), WHT = new THREE.Color(1.0, .92, .76), STL = M.steel.emissive.clone(), _col = new THREE.Color();
 const winK = (list, u) => { let k = 0; if (list) for (const r of list) k = Math.max(k, sm(r[0] - .03, r[0] + .02, u) * (1 - sm(r[1] - .03, r[1] + .02, u))); return k; };
 function animate(phase, walk, t, dt) {
  dt = dt > 0 ? Math.min(dt, .05) : 0;
  root.updateMatrixWorld();
  // a teleport or a sudden turn (a model sheet's view) settles the cloth and hair at once instead of whipping them round
  const rx = root.position.x, rz = root.position.z, ry = root.rotation.y, jump = !st.init || Math.hypot(rx - st.px, rz - st.pz) > 1.2 || Math.abs(Math.atan2(Math.sin(ry - st.ry), Math.cos(ry - st.ry))) > .6;
  if (dt > 0 && st.init) st.spd += (Math.abs(phase - st.ph) / 4.4 / dt - st.spd) * Math.min(1, dt * 6);
  st.px = rx; st.pz = rz; st.ry = ry; st.ph = phase; st.init = true;
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
   evalKeys(def, u, AP); edgeLead(def, u, AP); if (def.post) def.post(u, AP, t);
   cp(AP2, SNAP); mix(AP2, AP, sm(0, actv.bi, actv.t));
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
  eyeMesh.morphTargetInfluences[0] = Math.max(bk, cl(FIN.bl, 0, 1));
  eyeMesh.morphTargetInfluences[1] = cl(FIN.br, 0, 1);
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
  // sunsteel glows amber-gold at rest, brighter with Heat, white-hot in Sunburn and the trance
  _col.copy(AMB).lerp(WHT, k2).multiplyScalar(.55 + .8 * k1 + .6 * k2 + .6 * fiK + .6 * flK); M.edge.emissive.copy(_col);
  M.steel.emissive.copy(STL).lerp(_col.set(.62, .32, .07), Math.max(.5 * k1, fiK * .6)).lerp(WHT, .45 * k2);
  RIM.k.value = .1 + .08 * k1 + .3 * tk + .2 * flK;
  M.stone.emissiveIntensity = .55 + 1.2 * heat + 1.0 * tk + fiK + flK;
  bladeGlow.position.copy(_p2); bladeGlow.scale.setScalar(.55 + .35 * k1 + .35 * tk + .3 * fiK); bladeGlow.material.opacity = (.1 + .2 * k1 + .22 * k2 + .35 * fiK) * fadeV;
  bladeGlow.material.color.copy(AMB).lerp(WHT, k2 * .7);
  stoneGlow.position.copy(_p3); stoneGlow.scale.setScalar(.16 + .12 * heat + .1 * tk); stoneGlow.material.opacity = (.32 + .35 * heat + .3 * tk) * fadeV;
  tipFlare.position.copy(_p1); tipFlare.scale.setScalar(.2 + 1.5 * flK); tipFlare.material.opacity = flK * fadeV;
  shimmer.position.copy(_p2).y += .12; shimmer.scale.set(.36 + .03 * Math.sin(t * 4.3), .95 + .06 * Math.sin(t * 5.1), 1); shimmer.material.rotation = .05 * Math.sin(t * 3.7); shimmer.material.opacity = (.5 * sm(.7, 1, heat) + .15 * tk) * fadeV;
  chest.localToWorld(aura.position.set(0, .0, .02)); aura.scale.setScalar(2.1 + .08 * Math.sin(t * 3.1)); aura.material.opacity = .22 * sb * (.85 + .15 * Math.sin(t * 7.3)) * fadeV;
  chest.localToWorld(halo.position.set(0, .24, -.34)); halo.scale.setScalar(1.25 + .04 * Math.sin(t * 2)); halo.material.opacity = Math.min(1, .7 * tk + .35 * flK) * fadeV; halo.material.rotation = t * .12;
  sunL.position.copy(_p2); sunL.color.copy(AMB).lerp(WHT, k2); sunL.intensity = (.3 * k1 + .9 * tk + 1.2 * fiK + 1.2 * flK) * fadeV;
  // Kestrel Stoop: a faint amber updraft beneath her while she hangs in the air, a sunburst where she lands
  const upK = def && def.updraft ? winK(def.updraft, u) : 0;
  pelvis.getWorldPosition(_pw);
  updraft.position.set(_pw.x, liftV * .5 + .05, _pw.z); updraft.scale.set(.8 + .06 * Math.sin(t * 3.1), liftV + .3, 1); updraft.material.opacity = .7 * upK * (.85 + .15 * Math.sin(t * 4.3)) * fadeV; updraft.material.rotation = .04 * Math.sin(t * 2.3);
  const bu = def && def.burst !== undefined ? (u - def.burst) / .2 : -1, bk = bu >= 0 && bu < 1 ? 1 - bu : 0;
  burst.position.copy(_p1); burst.scale.setScalar(.5 + 2.8 * Math.sqrt(Math.max(0, bu))); burst.material.opacity = bk * bk * fadeV; burst.material.rotation = t * .5;
  if (bk > 0) { tipFlare.position.copy(_p1); tipFlare.scale.setScalar(.3 + 1.6 * bk); tipFlare.material.opacity = Math.max(tipFlare.material.opacity, bk * fadeV); sunL.intensity = Math.max(sunL.intensity, 2.2 * bk * fadeV); }
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
   if (upK > .05) { uAcc += dt * 16 * upK; while (uAcc >= 1) { uAcc -= 1; _p3.set(_pw.x + (rnd() - .5) * .7, rnd() * liftV * .8, _pw.z + (rnd() - .5) * .7); emit(_p3, (rnd() - .5) * .2, 1.2 + rnd() * 1.4, (rnd() - .5) * .2, .8 + rnd() * .8); } }
   if (def && def.sparks) for (const h of def.sparks) if (prevU < h && u >= h) for (let i = 0; i < (def.sparkN || 18); i++) { const a = rnd() * TAU, sp = .8 + rnd() * 2.2; emit(_p1, Math.cos(a) * sp, .6 + rnd() * 2.0, Math.sin(a) * sp, .3 + rnd() * .2); }
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
  if (def.aim) { const T = state.target, yaw = root.rotation.y; stoopD = 2.5; if (T && isFinite(T.x) && isFinite(T.z)) stoopD = cl((T.x - root.position.x) * Math.sin(yaw) + (T.z - root.position.z) * Math.cos(yaw) - 1.15, 0, 7); }
  const air = FIN.y > .5; cp(SNAP, FIN); actv = { name, def, t: 0, bi: def.aim ? (air ? def.bi : .3) : air ? Math.max(def.bi, .38) : def.bi }; prevU = 0; rbT = 0; return true;
 }
 const fadeMats = [...new Set(skinned.map((m) => m.material).concat([M.eye, M.iris]))], fadeT = fadeMats.map((m) => m.transparent);
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
