// lunara.js: Lunara, the Pale Mother, the Witch's moth-goddess summon. three.js r128 (global THREE). Defines makeLunara(opts) only.
// Touched up from src/models/originals/lunara.js after her pose sheet (reference/art/lunara-pose-sheet.png): a sculpted face with
// closed eyes on real lids, long lavender-silver hair in a few big locks on springs, the gold crescent halo and circlet, a white
// gown with gold detail, sheer sleeves that hang with gravity, luna-moth wings that close around her for Pale Mother's Embrace,
// and readable mid-tones with a soft glow under the game's lighting. The moon disc behind her is gone; the moon is now her orb.
function makeLunara(opts) {
 'use strict';
 // Units are meters, Y up, facing +Z. She is built as a 1.76 m figure with her hem at y = 0 inside `body`, which scales her by K
 // to about 3.1 m to the top of her hair; `base` floats her HOVER meters off the ground. Her right side is -X.
 // Every mesh is skinned to one skeleton (hands, hair, wings and skirt included), so the body costs one draw call per material.
 opts = opts || {};
 const DET = Math.max(.5, Math.min(1, opts.detail === undefined ? 1 : +opts.detail));
 const Q = (n, m) => Math.max(m || 3, Math.round(n * DET));
 const TAU = Math.PI * 2, PI = Math.PI;
 let seed = 5113;
 const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
 const cl = (v, a, b) => (v < a ? a : v > b ? b : v);
 const sm = (a, b, x) => { const t = cl((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
 const lerp = (a, b, t) => a + (b - a) * t;
 const win = (u, a, b, e) => sm(a - e, a + e, u) * (1 - sm(b - e, b + e, u));
 const G2 = (dx, dy, sx, sy) => Math.exp(-(dx * dx) / (sx * sx) - (dy * dy) / (sy * sy));
 const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
 const tex = (c, rx, ry) => { const t = new THREE.CanvasTexture(c); if (rx) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry || rx); } t.anisotropy = 4; return t; };
 const V3 = (x, y, z) => new THREE.Vector3(x || 0, y || 0, z || 0);
 const K = 1.78, HOVER = .55;

 const root = new THREE.Group(); root.name = 'Lunara';
 const base = new THREE.Group(); base.position.y = HOVER; root.add(base); // hover, rise and drift
 const body = new THREE.Group(); body.scale.setScalar(K); base.add(body);
 const fx = new THREE.Group(); fx.name = 'LunaraFX';
 const CLIP = new THREE.Plane(new THREE.Vector3(0, 1, 0), .003); // nothing of her shows below the floor (state.floor)
 const state = { target: { x: 0, y: 1.2, z: 4 }, floor: 0, glow: 1, eyes: 0 };

 // ---------- painted textures ----------
 function blob(g, x, y, r, col, sx) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, col.replace(/[\d.]+\)$/, '0)'));
  g.save(); g.translate(x, y); g.scale(sx || 1, 1); g.translate(-x, -y); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
 }
 function radial(stops, size) { const s = size || 128, h = s / 2, c = cvs(s, s), g = c.getContext('2d'), gr = g.createRadialGradient(h, h, 0, h, h, h); for (const [o, col] of stops) gr.addColorStop(o, col); g.fillStyle = gr; g.fillRect(0, 0, s, s); return tex(c); }
 const GOLD = '#b8893e', GOLDHI = 'rgba(255,240,196,.62)', GOLDE = '#6a4c1e';
 // white silk: soft folds of light and shade running down, and a black emissive layer for the gold to glow on
 function fabric(W, H, col, n) {
  const c = cvs(W, H), g = c.getContext('2d', { willReadFrequently: true }), e = cvs(W, H), eg = e.getContext('2d');
  g.fillStyle = col; g.fillRect(0, 0, W, H);
  for (let i = 0; i < (n || 80); i++) {
   const x = rnd() * W, w = 4 + rnd() * W * .035, a = (.05 + rnd() * .09).toFixed(3), cc = rnd() < .55 ? '112,128,190' : '255,253,250';
   const gr = g.createLinearGradient(x - w, 0, x + w, 0); gr.addColorStop(0, 'rgba(' + cc + ',0)'); gr.addColorStop(.5, 'rgba(' + cc + ',' + a + ')'); gr.addColorStop(1, 'rgba(' + cc + ',0)');
   g.fillStyle = gr; g.fillRect(x - w, 0, w * 2, H);
  }
  const id = g.getImageData(0, 0, W, H), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const k = (rnd() - .5) * 6; d[i] += k; d[i + 1] += k; d[i + 2] += k; }
  g.putImageData(id, 0, 0);
  eg.fillStyle = '#000'; eg.fillRect(0, 0, W, H);
  return { c, g, e, eg, W, H };
 }
 function gRect(F, x, y, w, h) { F.g.fillStyle = GOLD; F.g.fillRect(x, y, w, h); F.g.fillStyle = GOLDHI; F.g.fillRect(x, y, w, Math.max(1, h * .3)); F.eg.fillStyle = GOLDE; F.eg.fillRect(x, y, w, h); }
 function gLine(F, lw, path) {
  for (const [ctx, col, w] of [[F.g, GOLD, lw], [F.eg, GOLDE, lw], [F.g, GOLDHI, lw * .35]]) {
   ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); path(ctx); ctx.stroke(); ctx.restore();
  }
 }
 function curl(F, lw, x, y, a, r, s, t) {
  gLine(F, lw, (c) => { c.moveTo(x, y); const n = 18; for (let k = 1; k <= n; k++) { const f = k / n, ang = a + s * f * TAU * (t || .8), rr = r * (1 - .7 * f); c.lineTo(x + Math.cos(a) * r * f * 1.2 + Math.cos(ang) * rr * f, y + Math.sin(a) * r * f * 1.2 + Math.sin(ang) * rr * f); } });
 }
 function star4(F, lw, x, y, rx, ry) { gLine(F, lw, (c) => { c.moveTo(x, y - ry); c.quadraticCurveTo(x, y, x + rx, y); c.quadraticCurveTo(x, y, x, y + ry); c.quadraticCurveTo(x, y, x - rx, y); c.quadraticCurveTo(x, y, x, y - ry); }); }
 const fin = (F, rx, ry) => [tex(F.c, rx, ry), tex(F.e, rx, ry)];

 // skirt: u runs around her (front at the middle), v runs waist to hem
 const skirtF = fabric(1024, 512, '#f6f3ee');
 {
  const F = skirtF, W = F.W, H = F.H, cx = W / 2;
  for (let i = 0; i < 900; i++) { // a shimmer of tiny stars, thicker toward the hem
   const x = rnd() * W, y = H * (.3 + .7 * Math.pow(rnd(), .6)), s = rnd() < .08 ? 2.2 : 1.2;
   F.g.fillStyle = 'rgba(176,184,255,.55)'; F.g.fillRect(x, y, s, s); F.eg.fillStyle = 'rgba(110,120,230,.7)'; F.eg.fillRect(x, y, s, s);
  }
  gRect(F, 0, H - 15, W, 9); gRect(F, 0, H - 22, W, 2.5);
  for (let x = 0; x < W; x += 48) { curl(F, 1.6, x, H - 30, -PI * .5, 12, 1, .75); curl(F, 1.6, x + 24, H - 30, -PI * .5, 12, -1, .75); star4(F, 1.3, x + 12, H - 54, 5, 9); }
  for (const s of [-1, 1]) gLine(F, 1.8, (c) => { c.moveTo(cx + s * 16, 0); c.bezierCurveTo(cx + s * 22, H * .4, cx + s * 40, H * .7, cx + s * 58, H - 30); });
  // the front panel: a gold vine down the middle with paired curls and stars, and two finer vines beside it
  gLine(F, 2.4, (c) => { c.moveTo(cx, 4); c.lineTo(cx, H - 24); });
  for (let y = 22; y < H - 50; y += 34) { for (const s of [-1, 1]) curl(F, 1.5, cx, y, s < 0 ? PI * .8 : PI * .2, 11, s, .75); if ((y / 34 | 0) % 2) star4(F, 1.4, cx, y + 17, 4, 7); }
  for (const s of [-1, 1]) {
   gLine(F, 1.4, (c) => { c.moveTo(cx + s * 64, 10); c.bezierCurveTo(cx + s * 70, H * .35, cx + s * 84, H * .7, cx + s * 100, H - 34); });
   for (let k = 0; k < 9; k++) { const f = (k + .5) / 9, x = cx + s * (64 + 36 * f * f), y = 10 + f * (H - 50); curl(F, 1.2, x, y, s < 0 ? PI * .1 : PI * .9, 8, -s, .7); }
  }
  for (let i = 0; i < 26; i++) { const x = cx + (rnd() - .5) * W * .55, y = H * (.45 + .45 * rnd()); star4(F, 1.1, x, y, 3.5, 6); } // little gold stars on the lower skirt
  gRect(F, 0, H - 31, W, 2); for (let x = 6; x < W; x += 12) { F.g.fillStyle = GOLD; F.g.beginPath(); F.g.arc(x, H - 3, 2.2, 0, TAU); F.g.fill(); }
 }
 // bodice: u around, v from the neckline down to the waist
 const bodF = fabric(512, 256, '#f8f5f1', 40);
 {
  const F = bodF, W = F.W, H = F.H, cx = W / 2;
  gRect(F, 0, 0, W, 7); gRect(F, 0, H - 9, W, 8);
  for (const s of [-1, 1]) {
   gLine(F, 3, (c) => { c.moveTo(cx + s * 62, 6); c.quadraticCurveTo(cx + s * 30, H * .55, cx, H - 8); });
   gLine(F, 2, (c) => { c.moveTo(cx + s * 34, 6); c.quadraticCurveTo(cx + s * 16, H * .4, cx + s * 4, H * .7); });
   curl(F, 1.6, cx + s * 74, 40, s < 0 ? PI * .8 : PI * .2, 14, s, .8);
   curl(F, 1.4, cx + s * 54, 96, s < 0 ? PI * .6 : PI * .4, 11, -s, .7);
   gLine(F, 1.6, (c) => { c.moveTo(cx + s * 100, H * .5); c.quadraticCurveTo(cx + s * 52, H * .54, cx + s * 20, H * .64); });
   gLine(F, 1.4, (c) => { c.moveTo(cx + s * 128, 8); c.lineTo(cx + s * 128, H - 10); });
  }
  star4(F, 1.8, cx, H * .42, 7, 14);
  // filigree lace over the bust and down the sides, beads along the neckline, and a heavier band under the bust
  for (const s of [-1, 1]) {
   for (let k = 0; k < 5; k++) curl(F, 1.3, cx + s * (40 + 14 * k), 22 + 10 * (k % 2), s < 0 ? PI * .5 : PI * .5, 7, s, .7);
   for (let k = 0; k < 6; k++) curl(F, 1.2, cx + s * (92 + 6 * k), 60 + 26 * k, s < 0 ? PI * .9 : PI * .1, 8, -s, .7);
   gLine(F, 2.2, (c) => { c.moveTo(cx + s * 110, H * .55); c.quadraticCurveTo(cx + s * 56, H * .6, cx + s * 14, H * .7); });
  }
  for (let x = 4; x < W; x += 9) { F.g.fillStyle = GOLD; F.g.beginPath(); F.g.arc(x, 11, 1.8, 0, TAU); F.g.fill(); F.eg.fillStyle = GOLDE; F.eg.beginPath(); F.eg.arc(x, 11, 1.8, 0, TAU); F.eg.fill(); }
 }
 // sheer sleeves and overskirt: pale periwinkle gauze; the sleeve gets gold at its band and cuff
 const slT = (() => {
  const c = cvs(256, 256), g = c.getContext('2d'); g.fillStyle = '#c9d9fb'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 40; i++) { const x = rnd() * 256, w = 3 + rnd() * 10; g.fillStyle = rnd() < .5 ? 'rgba(255,255,255,.18)' : 'rgba(120,120,180,.12)'; g.fillRect(x - w / 2, 0, w, 256); }
  g.fillStyle = '#c9a25a'; g.fillRect(0, 248, 256, 5); g.fillRect(0, 0, 256, 4);
  g.strokeStyle = 'rgba(214,190,130,.9)'; g.lineWidth = 1.6; for (let x = 0; x < 256; x += 16) { g.beginPath(); g.arc(x + 8, 246, 7, PI, TAU); g.stroke(); }
  for (let i = 0; i < 160; i++) { g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(rnd() * 256, rnd() * 240, 1.2, 1.2); }
  return tex(c);
 })();
 const ovT = (() => {
  const c = cvs(256, 256), g = c.getContext('2d'); g.fillStyle = '#eef0fb'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 30; i++) { const x = rnd() * 256, w = 4 + rnd() * 14; g.fillStyle = rnd() < .5 ? 'rgba(255,255,255,.25)' : 'rgba(140,140,200,.12)'; g.fillRect(x - w / 2, 0, w, 256); }
  for (let i = 0; i < 220; i++) { const b = rnd(); g.fillStyle = 'rgba(255,255,255,' + (.4 + .6 * b).toFixed(2) + ')'; const s = b > .93 ? 2.2 : 1.1; g.fillRect(rnd() * 256, rnd() * 256, s, s); }
  return tex(c, 5, 2);
 })();

 // the face, painted in the head's front view: X and Y run -1.1 to 1.1 across and up
 const FW = 512, FS = FW / 2.2, PX = (X) => (X / 1.1 * .5 + .5) * FW, PY = (Y) => (.5 - Y / 1.1 * .5) * FW;
 function faceTex() {
  const c = cvs(FW, FW), g = c.getContext('2d');
  g.fillStyle = '#f3ebe6'; g.fillRect(0, 0, FW, FW);
  const B = (X, Y, r, col, sx) => blob(g, PX(X), PY(Y), r * FS, col, sx);
  B(0, .36, .55, 'rgba(250,242,246,.5)', 1.3); B(0, -.12, .13, 'rgba(252,246,248,.55)', .45); B(0, -.84, .15, 'rgba(250,242,246,.35)', 1.2);
  for (const s of [-1, 1]) {
   B(s * .5, -.25, .21, 'rgba(240,164,176,.16)', 1.25);  // a soft blush
   B(s * .78, .16, .3, 'rgba(160,152,192,.22)');        // temples
   B(s * .7, -.6, .28, 'rgba(160,148,182,.26)');        // the jaw turning under
   B(s * .36, .06, .21, 'rgba(176,164,214,.42)', 1.45); // lavender over the closed lids
   B(s * .52, .08, .12, 'rgba(150,134,198,.36)');       // deeper at the outer corners
   B(s * .085, -.2, .06, 'rgba(186,164,180,.22)', .5);  // the sides of the nose
   B(s * .062, -.365, .018, 'rgba(130,86,108,.4)');     // nostrils
  }
  B(0, -1.02, .36, 'rgba(150,142,176,.42)', 1.5);        // under the chin
  g.save(); g.lineCap = 'round';
  for (const s of [-1, 1]) { // thin, soft brows in lavender-grey
   g.strokeStyle = 'rgba(150,132,178,.9)'; g.lineWidth = 3; g.beginPath(); g.moveTo(PX(s * .14), PY(.185)); g.quadraticCurveTo(PX(s * .34), PY(.285), PX(s * .58), PY(.215)); g.stroke();
  }
  g.strokeStyle = '#3a2846'; // the lash lines of the closed eyes (the lids carry them too; this reads from afar)
  for (const s of [-1, 1]) {
   g.lineWidth = 3.2; g.beginPath(); g.moveTo(PX(s * .2), PY(-.005)); g.quadraticCurveTo(PX(s * .36), PY(-.07), PX(s * .53), PY(-.01)); g.stroke();
   g.lineWidth = 1.8; g.beginPath(); g.moveTo(PX(s * .52), PY(-.012)); g.quadraticCurveTo(PX(s * .57), PY(-.03), PX(s * .6), PY(-.06)); g.stroke();
  }
  g.restore();
  // small soft rose lips in a faint smile
  const ML = -.515;
  g.fillStyle = '#c98494'; g.beginPath(); g.moveTo(PX(-.15), PY(ML + .004)); g.quadraticCurveTo(PX(-.07), PY(-.465), PX(-.022), PY(-.475)); g.quadraticCurveTo(PX(0), PY(-.468), PX(.022), PY(-.475)); g.quadraticCurveTo(PX(.07), PY(-.465), PX(.15), PY(ML + .004)); g.quadraticCurveTo(PX(0), PY(ML - .006), PX(-.15), PY(ML + .004)); g.fill();
  g.fillStyle = '#d797a4'; g.beginPath(); g.moveTo(PX(-.13), PY(ML - .002)); g.quadraticCurveTo(PX(0), PY(ML - .01), PX(.13), PY(ML - .002)); g.quadraticCurveTo(PX(.08), PY(-.585), PX(0), PY(-.588)); g.quadraticCurveTo(PX(-.08), PY(-.585), PX(-.13), PY(ML - .002)); g.fill();
  B(0, -.56, .04, 'rgba(255,222,232,.45)', 1.8);
  g.strokeStyle = '#8a4a60'; g.lineWidth = 1.8; g.lineCap = 'round'; g.beginPath(); g.moveTo(PX(-.16), PY(ML + .012)); g.quadraticCurveTo(PX(-.08), PY(ML - .006), PX(0), PY(ML - .004)); g.quadraticCurveTo(PX(.08), PY(ML - .006), PX(.16), PY(ML + .012)); g.stroke();
  return tex(c);
 }
 function irisTex() {
  const S = 64, c = cvs(S, S), g = c.getContext('2d'), h = S / 2;
  g.fillStyle = '#ddd8ec'; g.fillRect(0, 0, S, S);
  const gr = g.createRadialGradient(h, h, 0, h, h, h); gr.addColorStop(0, '#3a3466'); gr.addColorStop(.3, '#7a72b4'); gr.addColorStop(.6, '#b8b2e8'); gr.addColorStop(.86, '#8a80c4'); gr.addColorStop(.95, '#2a2448'); gr.addColorStop(1, '#2a2448');
  g.fillStyle = gr; g.beginPath(); g.arc(h, h, h, 0, TAU); g.fill();
  g.fillStyle = '#0d0a18'; g.beginPath(); g.arc(h, h, h * .28, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(h - h * .3, h - h * .34, h * .12, 0, TAU); g.fill();
  return tex(c);
 }
 // hair: lavender-silver strands, darker at the edges of each lock, pointed wisps at the ends (the last stretch of v)
 // The wisps are cut into a separate mask and the colour is kept under them, so the filtered tips stay silver
 // instead of fringing dark against transparent black.
 function hairTex() {
  const W = 256, H = 512, c = cvs(W, H), g = c.getContext('2d', { willReadFrequently: true });
  const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, '#adb0c6'); gr.addColorStop(.28, '#dadcea'); gr.addColorStop(.5, '#f6f7fc'); gr.addColorStop(.72, '#dadcea'); gr.addColorStop(1, '#adb0c6');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const gv = g.createLinearGradient(0, 0, 0, H); gv.addColorStop(0, 'rgba(80,86,124,.16)'); gv.addColorStop(.3, 'rgba(70,58,112,0)'); gv.addColorStop(.75, 'rgba(255,250,255,.08)'); gv.addColorStop(1, 'rgba(255,250,255,.2)');
  g.fillStyle = gv; g.fillRect(0, 0, W, H);
  for (let k = 0; k < 9; k++) { const y = (k + .5) / 9 * H, q = g.createLinearGradient(0, y - 30, 0, y + 30); q.addColorStop(0, 'rgba(255,255,255,0)'); q.addColorStop(.5, 'rgba(255,255,255,.13)'); q.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = q; g.fillRect(0, y - 30, W, 60); }
  for (let i = 0; i < 520; i++) {
   const x = rnd() * W, lt = rnd() < .5, y0 = rnd() * H * .25;
   g.strokeStyle = lt ? 'rgba(250,248,255,' + (.08 + rnd() * .16).toFixed(2) + ')' : 'rgba(96,90,124,' + (.06 + rnd() * .14).toFixed(2) + ')'; g.lineWidth = .8 + rnd() * 1.8;
   g.beginPath(); g.moveTo(x, y0); g.bezierCurveTo(x + (rnd() - .5) * 10, y0 + H * .3, x + (rnd() - .5) * 14, y0 + H * .6, x + (rnd() - .5) * 10, H); g.stroke();
  }
  const m = cvs(W, H), mg = m.getContext('2d', { willReadFrequently: true });
  mg.fillStyle = '#fff'; mg.fillRect(0, 0, W, H); mg.globalCompositeOperation = 'destination-out'; mg.fillStyle = '#000';
  const top = H * .92; mg.beginPath(); mg.moveTo(0, H + 2); let x = 0;
  mg.lineTo(0, top + rnd() * 20);
  while (x < W) { const w = 7 + rnd() * 16; mg.lineTo(x + w * .5, H - rnd() * (H - top) * .25); x += w; mg.lineTo(Math.min(W, x), top + rnd() * (H - top) * .35); }
  mg.lineTo(W, H + 2); mg.closePath(); mg.fill();
  const col = g.getImageData(0, 0, W, H).data, al = mg.getImageData(0, 0, W, H).data, px = new Uint8Array(W * H * 4);
  for (let y = 0; y < H; y++) { const s0 = y * W * 4, d0 = (H - 1 - y) * W * 4; for (let i = 0; i < W * 4; i += 4) { px[d0 + i] = col[s0 + i]; px[d0 + i + 1] = col[s0 + i + 1]; px[d0 + i + 2] = col[s0 + i + 2]; px[d0 + i + 3] = al[s0 + i + 3]; } }
  const t = new THREE.DataTexture(px, W, H, THREE.RGBAFormat);
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 4; t.needsUpdate = true;
  return t;
 }
 // luna-moth wings, one atlas: the forewing in the left half, the hindwing (with its long tail) in the right half.
 // Both are painted in meters as seen from the front, so the wing panels map straight onto them.
 function wingTex() {
  const S = 1024, c = cvs(S, S), g = c.getContext('2d');
  const FK = 512 / .9, HK = 512 / .85;
  const fX = (x) => x * FK, fY = (y) => (2.02 - y) * FK, hX = (x) => 512 + x * HK, hY = (y) => (1.32 - y) * HK;
  const fore = { k: FK, X: fX, Y: fY, root: [.04, 1.29], eyes: [[.55, 1.66, .055], [.75, 1.83, .028]], pts: [[.04, 1.3], [.1, 1.56, .32, 1.86, .62, 1.98], [.78, 2.01, .88, 1.96, .89, 1.84], [.9, 1.66, .84, 1.46, .7, 1.34], [.54, 1.24, .26, 1.2, .06, 1.22]], outer: [1, 2, 3] };
  const hind = { k: HK, X: hX, Y: hY, root: [.04, 1.24], eyes: [[.5, .9, .05], [.66, .7, .026]], pts: [[.04, 1.26], [.24, 1.28, .56, 1.2, .72, 1.06], [.85, .94, .84, .7, .7, .58], [.62, .52, .57, .46, .56, .38], [.56, .26, .52, .13, .44, .07], [.37, .03, .3, .09, .35, .15], [.4, .2, .44, .3, .42, .44], [.34, .6, .16, .86, .06, 1.06]], outer: [2, 3, 4, 5, 6] };
  function path(Wg, segs) {
   g.beginPath(); const p = Wg.pts; g.moveTo(Wg.X(p[0][0]), Wg.Y(p[0][1]));
   for (let i = 1; i < p.length; i++) { const q = p[i]; if (segs && !segs.includes(i)) { g.moveTo(Wg.X(q[4]), Wg.Y(q[5])); continue; } g.bezierCurveTo(Wg.X(q[0]), Wg.Y(q[1]), Wg.X(q[2]), Wg.Y(q[3]), Wg.X(q[4]), Wg.Y(q[5])); }
   if (!segs) g.closePath();
  }
  for (const Wg of [fore, hind]) {
   const k = Wg.k, rx = Wg.X(Wg.root[0]), ry = Wg.Y(Wg.root[1]);
   g.save(); path(Wg); g.clip();
   let gr = g.createRadialGradient(rx, ry, 4, rx, ry, .95 * k);
   gr.addColorStop(0, '#5f9479'); gr.addColorStop(.3, '#83b79c'); gr.addColorStop(.62, '#a0cdb4'); gr.addColorStop(1, '#bbdfca');
   g.fillStyle = gr; g.fillRect(0, 0, S, S);
   for (let i = 0; i < 30; i++) blob(g, rx + rnd() * .8 * k, ry - (rnd() - .4) * .8 * k, (.06 + rnd() * .12) * k, rnd() < .5 ? 'rgba(226,206,240,.13)' : 'rgba(176,214,250,.15)'); // pearly sheen
   for (let i = 0; i < 3000; i++) { g.fillStyle = rnd() < .5 ? 'rgba(255,255,255,.16)' : 'rgba(64,112,90,.1)'; g.fillRect(rnd() * S, rnd() * S, 1.6, .8); }
   g.strokeStyle = 'rgba(62,108,86,.5)'; g.lineWidth = 1.8; // veins from the root
   for (let i = 0; i < 9; i++) { const a = (Wg === fore ? -1.25 : .1) + i * (Wg === fore ? .2 : .2), L = .95 * k; g.beginPath(); g.moveTo(rx, ry); g.quadraticCurveTo(rx + Math.cos(a) * L * .45 + 10, ry - Math.sin(-a) * L * .2, rx + Math.cos(a) * L, ry + Math.sin(a) * L); g.stroke(); }
   // a pale streak along the leading edge, then the plum margin, scalloped in mint on its inner side
   g.lineCap = 'round'; g.lineJoin = 'round';
   if (Wg === hind) { path(Wg, [2, 3]); g.strokeStyle = 'rgba(92,64,128,.55)'; g.lineWidth = .3 * k; g.stroke(); } // the hindwing darkens to plum along its outer lobe
   path(Wg, Wg.outer); g.strokeStyle = 'rgba(214,238,200,.9)'; g.lineWidth = .13 * k; g.stroke();
   path(Wg, Wg.outer); g.strokeStyle = '#553a78'; g.lineWidth = .085 * k; g.stroke();
   path(Wg, Wg.outer); g.strokeStyle = '#34244e'; g.lineWidth = .05 * k; g.stroke();
   if (Wg === fore) { path(Wg, [1]); g.strokeStyle = '#3a2852'; g.lineWidth = .12 * k; g.stroke(); path(Wg, [1]); g.strokeStyle = 'rgba(214,190,120,.9)'; g.lineWidth = .016 * k; g.setLineDash([]); g.stroke(); }
   for (let i = 0; i < 60; i++) { // mint scallops riding the inner edge of the margin
    const pi = Wg.outer[(rnd() * Wg.outer.length) | 0], q = Wg.pts[pi], p0 = Wg.pts[pi - 1], tt = rnd(), it = 1 - tt;
    const x0 = p0.length > 2 ? p0[4] : p0[0], y0 = p0.length > 2 ? p0[5] : p0[1];
    const bx = it * it * it * x0 + 3 * it * it * tt * q[0] + 3 * it * tt * tt * q[2] + tt * tt * tt * q[4], by = it * it * it * y0 + 3 * it * it * tt * q[1] + 3 * it * tt * tt * q[3] + tt * tt * tt * q[5];
    g.fillStyle = 'rgba(196,232,196,.8)'; g.beginPath(); g.arc(Wg.X(bx), Wg.Y(by), .012 * k, 0, TAU); g.fill();
   }
   // the eye spot: a gold ring, plum and violet rings, a dark pupil and a white glint
   for (const e of Wg.eyes) {
    const ex = Wg.X(e[0]), ey = Wg.Y(e[1]), er = e[2] * k;
    for (const [f, col] of [[1.18, 'rgba(255,248,214,.55)'], [1, '#d6b468'], [.86, '#2a1d3e'], [.72, '#6e4c94'], [.52, '#a487c8'], [.38, '#1a1228']]) { g.fillStyle = col; g.beginPath(); g.ellipse(ex, ey, er * f, er * f * 1.08, .3, 0, TAU); g.fill(); }
    g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.ellipse(ex - er * .16, ey - er * .18, er * .12, er * .08, -.6, 0, TAU); g.fill();
   }
   g.restore();
   path(Wg); g.strokeStyle = 'rgba(214,196,150,.95)'; g.lineWidth = 2.2; g.stroke();
  }
  return tex(c);
 }
 const moonC = (solid) => {
  const S = 256, c = cvs(S, S), g = c.getContext('2d');
  if (solid) { g.fillStyle = '#c9d4f4'; g.fillRect(0, 0, S, S); }
  const gr = g.createRadialGradient(110, 100, 10, 128, 128, 128); gr.addColorStop(0, '#ffffff'); gr.addColorStop(.7, '#e3ebff'); gr.addColorStop(1, '#b9c8f0');
  g.fillStyle = gr; g.beginPath(); g.arc(128, 128, 126, 0, TAU); g.fill();
  for (let i = 0; i < 30; i++) { const r = 4 + rnd() * 18, a = rnd() * TAU, d = rnd() * 100; g.fillStyle = 'rgba(150,165,210,' + (.15 + rnd() * .25).toFixed(2) + ')'; g.beginPath(); g.arc(128 + Math.cos(a) * d, 128 + Math.sin(a) * d, r, 0, TAU); g.fill(); }
  return tex(c);
 };
 const faceMap = faceTex(), irisMap = irisTex(), hairMap = hairTex(), wingMap = wingTex(), moonT = moonC(false), moonSolid = moonC(true);
 const [skMap, skEm] = fin(skirtF), [bdMap, bdEm] = fin(bodF);
 const glowT = radial([[0, 'rgba(255,255,255,1)'], [.22, 'rgba(255,255,255,.5)'], [1, 'rgba(255,255,255,0)']]);
 const dotT = radial([[0, 'rgba(255,255,255,1)'], [.35, 'rgba(255,255,255,.6)'], [1, 'rgba(255,255,255,0)']], 64);
 const ringT = radial([[0, 'rgba(255,255,255,0)'], [.72, 'rgba(255,255,255,0)'], [.84, 'rgba(255,255,255,.9)'], [.9, 'rgba(255,255,255,.3)'], [1, 'rgba(255,255,255,0)']], 256);
 const sparkT = (() => { const c = cvs(64, 64), g = c.getContext('2d'); g.drawImage(dotT.image, 16, 16, 32, 32); g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(31, 4, 2, 56); g.fillRect(4, 31, 56, 2); const q = g.createRadialGradient(32, 32, 0, 32, 32, 30); q.addColorStop(0, 'rgba(0,0,0,0)'); q.addColorStop(1, 'rgba(0,0,0,1)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = q; g.fillRect(0, 0, 64, 64); return tex(c); })();
 const cresT = (() => { // a crisp crescent moon over a soft violet glow
  const c = cvs(128, 128), g = c.getContext('2d');
  const shape = (r) => { g.beginPath(); g.arc(64, 64, r, 0, TAU); g.arc(64 + r * .42, 64 - r * .3, r * .86, 0, TAU, true); };
  const q = g.createRadialGradient(64, 64, 0, 64, 64, 62); q.addColorStop(0, 'rgba(190,180,255,.5)'); q.addColorStop(1, 'rgba(190,180,255,0)'); g.fillStyle = q; g.fillRect(0, 0, 128, 128);
  g.fillStyle = 'rgba(214,206,255,.55)'; shape(50); g.fill('evenodd');
  g.fillStyle = '#ffffff'; shape(42); g.fill('evenodd');
  return tex(c); })();

 // ---------- materials: mid-tones, a lavender rim light, a floor clip, and alpha cuts that ignore fading ----------
 const U = { rim: { value: .3 }, rimC: { value: new THREE.Color(0xc8d0ff) }, time: { value: 0 }, selfK: { value: 1 } };
 const allMats = [];
 function std(key, color, rough, o, po) {
  po = po || {};
  const m = new THREE.MeshStandardMaterial(Object.assign({ color, roughness: rough, metalness: 0 }, o || {}));
  const rS = { value: po.rim === undefined ? 1 : po.rim }, uS = { value: new THREE.Color().fromArray(po.self || [0, 0, 0]) };
  m.clippingPlanes = [CLIP];
  m.onBeforeCompile = (sh) => {
   sh.uniforms.uRim = U.rim; sh.uniforms.uRimC = U.rimC; sh.uniforms.uRimS = rS; sh.uniforms.uTime = U.time; sh.uniforms.uSelf = uS; sh.uniforms.uSelfK = U.selfK;
   if (po.uniforms) Object.assign(sh.uniforms, po.uniforms);
   sh.fragmentShader = 'uniform float uRim;\nuniform vec3 uRimC;\nuniform float uRimS;\nuniform vec3 uSelf;\nuniform float uSelfK;\n' + sh.fragmentShader
    .replace('#include <alphatest_fragment>', '#ifdef ALPHATEST\n if ( diffuseColor.a < ALPHATEST * opacity ) discard;\n#endif')
    .replace('#include <dithering_fragment>', 'float nFr = 1.0 - abs(dot(normalize(normal), normalize(vViewPosition)));\n gl_FragColor.rgb += uSelf * uSelfK * diffuseColor.rgb + uRimC * (uRim * uRimS * pow(nFr, 2.4)) * opacity;\n#include <dithering_fragment>');
   if (po.vert) { sh.vertexShader = po.vhead + sh.vertexShader; for (const [a, b] of po.vert) sh.vertexShader = sh.vertexShader.replace(a, b); }
  };
  m.customProgramCacheKey = () => 'lunara-' + key;
  allMats.push({ m, op: m.opacity, tr: m.transparent }); return m;
 }
 // the skirt ripples on the GPU, more toward the hem (bind space, before skinning)
 const FL_HEAD = 'uniform float uTime;\nuniform float uAmp;\n';
 const FLUTTER = ['#include <begin_vertex>', '#include <begin_vertex>\n{\n float hk = clamp((1.065 - position.y) / 1.065, 0.0, 1.0);\n float an = atan(position.x, position.z);\n float wv = sin(an * 7.0 + uTime * 1.5 - position.y * 5.0) * 0.6 + sin(an * 3.0 - uTime * 1.05 + position.y * 3.0) * 0.4;\n vec2 dr = normalize(position.xz + vec2(1e-5, 0.0));\n float am = uAmp * hk * hk;\n transformed.xz += dr * (wv * am);\n transformed.y += am * 0.35 * sin(an * 5.0 + uTime * 1.9);\n}'];
 // the sleeves hang with gravity whatever the arms do: each vertex knows the point on the arm it hangs from (skinned the same way)
 // and how far it may fall; its lower side drops toward the floor, the upper side stays on the arm
 const DR_HEAD = 'attribute vec4 anchor;\nuniform float uTime;\nuniform float uDrape;\n';
 const DRAPE = ['#include <skinning_vertex>', '#include <skinning_vertex>\n#ifdef USE_SKINNING\n{\n vec4 av = bindMatrix * vec4(anchor.xyz, 1.0);\n vec4 as4 = boneMatX * av * skinWeight.x + boneMatY * av * skinWeight.y + boneMatZ * av * skinWeight.z + boneMatW * av * skinWeight.w;\n vec3 ac = (bindMatrixInverse * as4).xyz;\n vec3 rd = transformed - ac;\n float rl = max(length(rd), 1e-4);\n float L = anchor.w * uDrape;\n float kk = smoothstep(-0.45, 0.95, -rd.y / rl);\n transformed.y -= L * kk;\n transformed.x += L * 0.1 * sin(uTime * 1.6 + anchor.y * 11.0 + rd.z * 40.0);\n transformed.z += L * 0.1 * cos(uTime * 1.3 + anchor.y * 9.0 + rd.x * 40.0);\n}\n#endif'];
 const GE = new THREE.Color(0xffffff), SKK = .96; // SKK: skin albedo, shared by body, face and lids so they match
 // the night light (lavender sky, warm fill) turns white pink; these fills put the green back so silk and skin read white
 const SELF_SKIN = [.12, .2, .15], SELF_SILK = [.12, .2, .14];
 const M = {
  skin: std('skin', new THREE.Color(.94, .9, .87).multiplyScalar(SKK), .6, { emissive: 0x0c0a10, skinning: true }, { rim: .7, self: SELF_SKIN }),
  face: std('face', new THREE.Color(SKK, SKK, SKK), .58, { map: faceMap, emissive: 0x0c0a10 }, { rim: .7, self: SELF_SKIN }),
  eyeW: std('eyew', 0xffffff, .3, { vertexColors: true, emissive: 0x16121c }, { rim: .2 }),
  iris: std('iris', 0xffffff, .25, { map: irisMap, emissive: 0xd0c8ff, emissiveMap: irisMap, emissiveIntensity: .2 }, { rim: .2 }),
  lid: std('lid', new THREE.Color(SKK, SKK, SKK), .6, { vertexColors: true, emissive: 0x0c0a10, morphTargets: true }, { rim: .7, self: SELF_SKIN }),
  mouthIn: std('mouth', 0x3a1626, .7, {}, { rim: 0 }),
  hair: std('hair', new THREE.Color(.96, .96, .99), .48, { map: hairMap, alphaTest: .45, side: THREE.DoubleSide, emissive: 0x0e0e18, skinning: true }, { rim: 1.0, self: [.16, .23, .17] }),
  gold: std('gold', 0xecc476, .3, { metalness: .5, emissive: 0x5c4416, skinning: true }, { rim: .45, self: [.16, .11, .02] }),
  gem: std('gem', 0x8fa2ff, .12, { metalness: .2, emissive: 0x4a50c0, emissiveIntensity: .7, skinning: true }, { rim: 1.2 }),
  bodice: std('bodice', new THREE.Color(.86, .85, .83), .6, { map: bdMap, emissive: GE, emissiveMap: bdEm, emissiveIntensity: .35, skinning: true }, { rim: .7, self: SELF_SILK }),
  skirt: std('skirt', new THREE.Color(.86, .85, .83), .72, { map: skMap, emissive: GE, emissiveMap: skEm, emissiveIntensity: .3, side: THREE.DoubleSide, skinning: true }, { rim: .5, self: SELF_SILK, vhead: FL_HEAD, vert: [FLUTTER], uniforms: { uAmp: { value: .016 } } }),
  over: std('over', 0xf8f8ff, .45, { map: ovT, transparent: true, opacity: .24, depthWrite: false, side: THREE.DoubleSide, emissive: 0x0c0c18, skinning: true }, { rim: .9, self: [.1, .16, .16], vhead: FL_HEAD, vert: [FLUTTER], uniforms: { uAmp: { value: .03 } } }),
  sleeve: std('sleeve', new THREE.Color(.86, .92, 1), .5, { map: slT, transparent: true, opacity: .56, depthWrite: false, side: THREE.DoubleSide, emissive: 0x101830, skinning: true }, { rim: 1.2, self: [.08, .15, .19], vhead: DR_HEAD, vert: [DRAPE], uniforms: { uDrape: { value: 1 } } }),
  wing: std('wing', 0xe6e6e6, .55, { map: wingMap, emissive: GE, emissiveMap: wingMap, emissiveIntensity: .18, alphaTest: .5, side: THREE.DoubleSide, skinning: true }, { rim: .5, self: [.03, .08, .06] }),
 };
 const CLOTH_EM = [[M.bodice, .35], [M.skirt, .3], [M.wing, .18]];

 // ---------- geometry helpers ----------
 function mergeGeos(list) {
  const names = new Set();
  for (const g of list) { if (!g.attributes.normal) g.computeVertexNormals(); for (const k in g.attributes) names.add(k); }
  let nv = 0, ni = 0; for (const g of list) { nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
  const out = new THREE.BufferGeometry(), I = new Uint32Array(ni);
  for (const k of names) {
   const sz = list.find((g) => g.attributes[k]).attributes[k].itemSize, A = new Float32Array(nv * sz); let vo = 0;
   for (const g of list) { const c = g.attributes.position.count, a = g.attributes[k]; if (a) A.set(a.array, vo * sz); else if (k === 'color') A.fill(1, vo * sz, (vo + c) * sz); vo += c; }
   out.setAttribute(k, new THREE.BufferAttribute(A, sz));
  }
  let vo = 0, io = 0;
  for (const g of list) { const c = g.attributes.position.count; if (g.index) { const a = g.index.array; for (let k = 0; k < a.length; k++) I[io + k] = a[k] + vo; io += a.length; } else { for (let k = 0; k < c; k++) I[io + k] = vo + k; io += c; } vo += c; }
  out.setIndex(new THREE.BufferAttribute(I, 1)); return out;
 }
 // a grid surface from f(u, v, out); outward faces when u runs to her left and v runs down. seam: the grid wraps around.
 function surf(nu, nv, f, uvf, seam) {
  const pos = [], uv = [], idx = [], o = [0, 0, 0];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const u = i / nu, v = j / nv; f(u, v, o); pos.push(o[0], o[1], o[2]); const t = uvf ? uvf(u, v, o) : [u, 1 - v]; uv.push(t[0], t[1]); }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  if (seam) { const nr = g.attributes.normal.array, w = nu + 1; for (let j = 0; j <= nv; j++) { const a = j * w * 3, b = (j * w + nu) * 3; for (let q = 0; q < 3; q++) { const m = (nr[a + q] + nr[b + q]) / 2; nr[a + q] = nr[b + q] = m; } } }
  return g;
 }
 function tubeR(pts, ns, nr, rFn, closed) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => (p.isVector3 ? p : V3(p[0], p[1], p[2]))), !!closed);
  const g = new THREE.TubeGeometry(curve, ns, 1, nr, !!closed), pos = g.attributes.position, c = V3(), v = V3();
  for (let i = 0; i <= ns; i++) { curve.getPointAt(i / ns, c); const r = rFn(i / ns); for (let j = 0; j <= nr; j++) { const k = i * (nr + 1) + j; v.fromBufferAttribute(pos, k).sub(c).multiplyScalar(r).add(c); pos.setXYZ(k, v.x, v.y, v.z); } }
  g.computeVertexNormals(); return g;
 }
 // Catmull-Rom through column c of a table whose rows are keyed by column 0, descending (or ascending with asc)
 function crv(T, c, y, asc) {
  const n = T.length, key = (i) => (asc ? -T[i][0] : T[i][0]), yy = asc ? -y : y;
  if (yy >= key(0)) return T[0][c]; if (yy <= key(n - 1)) return T[n - 1][c];
  let i = 0; while (i < n - 2 && yy < key(i + 1)) i++;
  const p0 = T[Math.max(0, i - 1)][c], p1 = T[i][c], p2 = T[i + 1][c], p3 = T[Math.min(n - 1, i + 2)][c];
  const t = (key(i) - yy) / (key(i) - key(i + 1)), t2 = t * t;
  return .5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (3 * p1 - p0 - 3 * p2 + p3) * t2 * t);
 }
 function crescentShape(R, d, r2) {
  const yi = (R * R - r2 * r2 + d * d) / (2 * d), xi = Math.sqrt(Math.max(0, R * R - yi * yi)), a0 = Math.atan2(yi, xi), b0 = Math.atan2(yi - d, -xi), b1 = Math.atan2(yi - d, xi) + TAU;
  const s = new THREE.Shape(); s.absarc(0, 0, R, a0, PI - a0, true); s.absarc(0, d, r2, b0, b1, false); return s;
 }
 const _o3 = new THREE.Object3D();
 function place(g, p, r, s) {
  _o3.position.set(p ? p[0] : 0, p ? p[1] : 0, p ? p[2] : 0); _o3.rotation.set(r ? r[0] : 0, r ? r[1] : 0, r ? r[2] : 0);
  if (s === undefined || s === null) _o3.scale.set(1, 1, 1); else if (typeof s === 'number') _o3.scale.setScalar(s); else _o3.scale.set(s[0], s[1], s[2]);
  _o3.updateMatrix(); g.applyMatrix4(_o3.matrix); return g;
 }

 // ---------- skeleton: 56 bones in body space; every bone starts unrotated, so a bone's bind frame is its position ----------
 const bones = [], BI = {};
 function bone(name, parent, x, y, z) { const b = new THREE.Bone(); b.name = name; b.position.set(x, y, z); parent.add(b); BI[name] = bones.length; bones.push(b); return b; }
 const BP = (b) => { const v = V3(); let o = b; while (o && o !== body) { v.add(o.position); o = o.parent; } return v; };
 const hips = bone('hips', body, 0, .95, 0);
 const spine = bone('spine', hips, 0, .12, 0);
 const chest = bone('chest', spine, 0, .16, -.005);
 const neck = bone('neck', chest, 0, .203, -.012);
 const head = bone('head', neck, 0, .085, .008);
 const skA = bone('skA', hips, 0, -.06, 0), skB = bone('skB', skA, 0, -.44, 0);
 const UA = .27, FA = .245;
 const FING = [[.024, [.044, .038]], [.008, [.048, .042]], [-.008, [.045, .038]], [-.023, [.035, .03]]];
 const arms = [-1, 1].map((sx) => {
  const sh = bone('sh' + sx, chest, sx * .17, .19, -.012), el = bone('el' + sx, sh, 0, -UA, 0), wr = bone('wr' + sx, el, 0, -FA, 0);
  const fingers = FING.map(([z, ln], k) => { const f0 = bone('f0' + sx + k, wr, 0, -.082, z), f1 = bone('f1' + sx + k, f0, 0, -ln[0], 0); return { f0, f1, ln, z }; });
  const t0 = bone('t0' + sx, wr, -sx * .006, -.024, .03), t1 = bone('t1' + sx, t0, 0, -.034, 0);
  return { sx, sh, el, wr, fingers, thumb: { t0, t1 } };
 });
 const R = arms[0], L = arms[1];
 // wings hinge at the back of her ribs: a root and a mid joint each, so they can spread, flap and wrap around her
 const wings = [-1, 1].map((sx) => {
  const fr = bone('wf' + sx, chest, sx * .045, .07, -.11), fm = bone('wfm' + sx, fr, sx * .255, 0, 0);
  const hr = bone('wh' + sx, chest, sx * .04, 0, -.117), hm = bone('whm' + sx, hr, sx * .26, 0, 0);
  return { sx, fr, fm, hr, hm };
 });
 const HB = BP(head), HC = V3(0, .096, .012), HR = [.074, .096, .086];
 const hb = (x, y, z) => [HB.x + x, HB.y + y, HB.z + z]; // head space to body space (bind)
 // five big locks of hair, each on a chain of three bones: three down her back, two over her shoulders to the waist
 const LOCKS = [
  { n: 'hC', pts: [hb(0, .17, -.05), hb(0, .1, -.095), [0, 1.5, -.13], [0, 1.28, -.165], [0, 1.0, -.19], [0, .7, -.25], [0, .4, -.34], [0, .1, -.47]], w: (t) => lerp(.09, .2, sm(0, .5, t)) * (1 - .62 * sm(.76, 1, t)), th: (t) => .03 * (1 - .4 * t), side: () => V3(1, 0, 0), wave: .05, back: 1 },
  { n: 'hL', pts: [hb(.06, .15, -.035), hb(.095, .07, -.055), [.15, 1.47, -.1], [.2, 1.3, -.13], [.23, 1.02, -.155], [.25, .74, -.21], [.28, .46, -.29], [.31, .22, -.38]], w: (t) => lerp(.065, .135, sm(0, .4, t)) * (1 - .66 * sm(.72, 1, t)), th: (t) => .026 * (1 - .4 * t), side: (t) => V3(1, 0, -.6).normalize(), wave: .05, back: 1 },
  { n: 'hR', pts: [hb(-.06, .15, -.035), hb(-.095, .07, -.055), [-.15, 1.47, -.1], [-.2, 1.3, -.13], [-.23, 1.02, -.155], [-.25, .74, -.21], [-.28, .46, -.29], [-.31, .22, -.38]], w: (t) => lerp(.065, .135, sm(0, .4, t)) * (1 - .66 * sm(.72, 1, t)), th: (t) => .026 * (1 - .4 * t), side: (t) => V3(1, 0, .6).normalize(), wave: .05, back: 1 },
  { n: 'hFL', pts: [hb(.074, .09, .045), hb(.09, .02, .05), hb(.1, -.05, .04), [.15, 1.41, .07], [.145, 1.22, .13], [.15, 1.0, .135], [.17, .8, .16]], w: (t) => lerp(.03, .066, sm(0, .25, t)) * (1 - .5 * sm(.75, 1, t)), th: (t) => .016 * (1 - .3 * t), side: (t) => V3(.35, 0, -1).normalize(), wave: .03, back: 0 },
  { n: 'hGL', pts: [hb(.085, .05, -.03), hb(.11, -.02, -.005), [.16, 1.44, .03], [.178, 1.34, .085], [.172, 1.18, .12], [.178, 1.0, .128], [.19, .84, .145]], w: (t) => lerp(.026, .055, sm(0, .3, t)) * (1 - .5 * sm(.75, 1, t)), th: (t) => .015 * (1 - .3 * t), side: (t) => V3(.6, 0, -1).normalize(), wave: .03, back: 0 },
  { n: 'hFR', pts: [hb(-.074, .09, .045), hb(-.09, .02, .05), hb(-.1, -.05, .04), [-.15, 1.41, .07], [-.145, 1.22, .13], [-.15, 1.0, .135], [-.17, .8, .16]], w: (t) => lerp(.03, .066, sm(0, .25, t)) * (1 - .5 * sm(.75, 1, t)), th: (t) => .016 * (1 - .3 * t), side: (t) => V3(.35, 0, 1).normalize(), wave: .03, back: 0 },
  { n: 'hGR', pts: [hb(-.085, .05, -.03), hb(-.11, -.02, -.005), [-.16, 1.44, .03], [-.178, 1.34, .085], [-.172, 1.18, .12], [-.178, 1.0, .128], [-.19, .84, .145]], w: (t) => lerp(.026, .055, sm(0, .3, t)) * (1 - .5 * sm(.75, 1, t)), th: (t) => .015 * (1 - .3 * t), side: (t) => V3(.6, 0, 1).normalize(), wave: .03, back: 0 },
 ];
 for (const Lk of LOCKS) {
  Lk.curve = new THREE.CatmullRomCurve3(Lk.pts.map((p) => V3(p[0], p[1], p[2])));
  Lk.P = [0, .3, .62, 1].map((t) => Lk.curve.getPointAt(t));
  let par = head, pw = HB.clone(); Lk.bones = [];
  for (let i = 0; i < 3; i++) { const b = bone(Lk.n + i, par, Lk.P[i].x - pw.x, Lk.P[i].y - pw.y, Lk.P[i].z - pw.z); Lk.bones.push(b); par = b; pw = Lk.P[i]; }
  Lk.tip = Lk.P[3].clone().sub(Lk.P[2]); Lk.ph = rnd() * TAU;
 }

 // ---------- skin weights (bind pose, body space) ----------
 function wTorso(x, y) {
  let w;
  if (y > 1.19) { const t = sm(1.15, 1.25, y); w = [[BI.spine, 1 - t], [BI.chest, t]]; }
  else if (y > 1.0) { const t = sm(1.0, 1.12, y); w = [[BI.hips, 1 - t], [BI.spine, t]]; }
  else w = [[BI.hips, 1]];
  const ax = Math.abs(x);
  if (y > 1.3 && ax > .1) { const k = sm(.1, .17, ax) * sm(1.3, 1.42, y) * .45; for (const e of w) e[1] *= 1 - k; w.push([BI['sh' + (x < 0 ? -1 : 1)], k]); }
  return w;
 }
 function wNeck(x, y) { if (y < 1.47) { const t = sm(1.42, 1.47, y); return [[BI.chest, 1 - t], [BI.neck, t]]; } const t = sm(1.51, 1.56, y); return [[BI.neck, 1 - t], [BI.head, t]]; }
 function wArmFn(A, noWrist) {
  const S = BI[A.sh.name], E = BI[A.el.name], Wr = BI[A.wr.name], sy = BP(A.sh).y, ey = BP(A.el).y, wy = BP(A.wr).y;
  return (x, y) => {
   if (y > sy - .035) { const t = sm(sy + .035, sy - .035, y); return [[BI.chest, (1 - t) * .5], [S, 1 - (1 - t) * .5]]; }
   if (y > ey + .035) return [[S, 1]];
   if (y > ey - .035) { const t = sm(ey + .035, ey - .035, y); return [[S, 1 - t], [E, t]]; }
   if (noWrist || y > wy + .02) return [[E, 1]];
   const t = sm(wy + .02, wy - .01, y); return [[E, 1 - t], [Wr, t]];
  };
 }
 function wSkirt(x, y) {
  const h = (1.065 - y) / 1.065;
  if (h < .06) return [[BI.hips, 1]];
  if (h < .42) { const t = sm(.06, .42, h); return [[BI.hips, 1 - t], [BI.skA, t]]; }
  const t = sm(.42, 1, h); return [[BI.skA, 1 - t], [BI.skB, t]];
 }
 // weights along a chain: nearest segment, blended across joints, and into the parent at the root
 function wChain(bs, P, parent, rootK) {
  const idx = bs.map((b) => BI[b.name]), pb = BI[parent.name], A = V3(), D = V3(), X = V3();
  return (x, y, z) => {
   X.set(x, y, z); let best = 1e9, bi = 0, bt = 0;
   for (let i = 0; i < idx.length; i++) { D.subVectors(P[i + 1], P[i]); const t = A.subVectors(X, P[i]).dot(D) / D.lengthSq(); const d = A.copy(P[i]).addScaledVector(D, cl(t, 0, 1)).distanceToSquared(X); if (d < best) { best = d; bi = i; bt = t; } }
   if (bi === 0 && bt < .35) { const k = sm(.35, -.1, bt) * (rootK || .7); return [[pb, k], [idx[0], 1 - k]]; }
   if (bt < .3 && bi > 0) { const k = sm(.3, 0, bt) * .5; return [[idx[bi - 1], k], [idx[bi], 1 - k]]; }
   if (bt > .7 && bi < idx.length - 1) { const k = sm(.7, 1, bt) * .5; return [[idx[bi], 1 - k], [idx[bi + 1], k]]; }
   return [[idx[bi], 1]];
  };
 }
 const BUCK = new Map();
 function add(geo, mat, w, p, r, s) {
  const g = (p || r || s !== undefined) ? place(geo, p, r, s) : geo;
  if (!g.attributes.normal) g.computeVertexNormals();
  const pos = g.attributes.position, n = pos.count, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
  if (typeof w === 'number') for (let i = 0; i < n; i++) { si[i * 4] = w; sw[i * 4] = 1; }
  else for (let i = 0; i < n; i++) {
   let inf = w(pos.getX(i), pos.getY(i), pos.getZ(i)).filter((e) => e[1] > 1e-4);
   if (inf.length > 4) inf = inf.sort((a, b) => b[1] - a[1]).slice(0, 4);
   let tot = 0; for (const e of inf) tot += e[1];
   if (!tot) { si[i * 4] = BI.hips; sw[i * 4] = 1; continue; }
   for (let k = 0; k < inf.length; k++) { si[i * 4 + k] = inf[k][0]; sw[i * 4 + k] = inf[k][1] / tot; }
  }
  let Lst = BUCK.get(mat); if (!Lst) BUCK.set(mat, (Lst = [])); Lst.push({ g, si, sw });
 }

 // ---------- body ----------
 // torso: elliptical rings from the base of the neck to the hips, with a soft bust; skin above the neckline, the bodice below
 const TPROF = [[1.475, .046, .044], [1.45, .082, .064], [1.425, .136, .08], [1.39, .149, .09], [1.345, .145, .1], [1.295, .139, .106], [1.245, .128, .1], [1.185, .114, .086], [1.125, .104, .078], [1.065, .11, .08], [1.0, .128, .088], [.94, .142, .096]];
 function torsoPt(th, y, grow, o) {
  const rx = crv(TPROF, 1, y), rz = crv(TPROF, 2, y), x = Math.sin(th) * (rx + grow); let z = Math.cos(th) * (rz + grow);
  if (z > 0) z += .03 * Math.exp(-Math.pow((y - 1.29) / .042, 2)) * Math.exp(-Math.pow((Math.abs(x) - .062) / .044, 2));
  o[0] = x; o[1] = y; o[2] = z - .006; return o;
 }
 const neckY = (th) => { const a = Math.abs(th); return 1.302 + .052 * sm(.2, 2.3, a) + .02 * Math.exp(-Math.pow((a - .42) / .2, 2)); };
 add(surf(Q(48), Q(16), (u, v, o) => torsoPt((u - .5) * TAU, lerp(1.475, 1.25, v), 0, o), null, true), M.skin, wTorso);
 add(surf(Q(64), Q(26), (u, v, o) => { const th = (u - .5) * TAU; return torsoPt(th, lerp(neckY(th), 1.05, v), .0035, o); }, (u, v) => [u, 1 - v], true), M.bodice, wTorso);
 { const g = new THREE.CylinderGeometry(.032, .039, .15, Q(20), 5, true); g.translate(0, 1.49, -.012); add(g, M.skin, wNeck); }
 // arms: bare shoulders, slender arms
 for (const A of arms) {
  const S = BP(A.sh), E = BP(A.el), W = BP(A.wr), w = wArmFn(A);
  add(new THREE.SphereGeometry(.046, Q(16), Q(12)), M.skin, w, [S.x, S.y - .006, S.z]);
  add(tubeR([[S.x, S.y, S.z], [S.x, (S.y + E.y) / 2, S.z + .004], [E.x, E.y, E.z]], Q(12), Q(14), (t) => lerp(.042, .031, t)), M.skin, w);
  add(new THREE.SphereGeometry(.031, Q(12), Q(10)), M.skin, w, [E.x, E.y, E.z]);
  add(tubeR([[E.x, E.y, E.z], [E.x, (E.y + W.y) / 2, E.z + .003], [W.x, W.y + .008, W.z]], Q(12), Q(12), (t) => lerp(.029, .02, t)), M.skin, w);
 }
 // hands: long pale fingers, each segment on its own bone
 for (const A of arms) {
  const W = BP(A.wr);
  { const g = new THREE.SphereGeometry(1, Q(14), Q(10)); g.scale(.012, .043, .033); add(g, M.skin, BI[A.wr.name], [W.x, W.y - .046, W.z]); }
  const seg = (b, len, r0, r1) => { const P = BP(b), g = new THREE.CylinderGeometry(r1, r0, len, Q(8, 6), 1, false); g.translate(P.x, P.y - len / 2, P.z); const tp = new THREE.SphereGeometry(r1, Q(8, 6), Q(6, 4)); tp.translate(P.x, P.y - len, P.z); add(mergeGeos([g, tp]), M.skin, BI[b.name]); };
  for (const F of A.fingers) { seg(F.f0, F.ln[0], .0068, .006); seg(F.f1, F.ln[1], .0058, .0046); }
  seg(A.thumb.t0, .034, .0078, .0066); seg(A.thumb.t1, .03, .0064, .0052);
 }
 // legs and feet under the skirt; they show only when it lifts
 for (const sx of [-1, 1]) {
  add(tubeR([[sx * .07, .95, 0], [sx * .068, .5, .005], [sx * .062, .09, 0]], Q(10), Q(10), (t) => lerp(.055, .03, t)), M.skin, BI.hips);
  const f = new THREE.SphereGeometry(1, Q(10), Q(8)); f.scale(.026, .05, .028); add(f, M.skin, BI.hips, [sx * .062, .068, .012], [-.25, 0, 0]);
 }
 // skirt: an A-line from the waist to the floor with soft folds, and a sheer starry overskirt
 const SKT = [[0, .118, .088], [.1, .16, .13], [.3, .205, .182], [.6, .285, .272], [1, .405, .385]];
 function skirtPt(th, v, grow, o, drop) {
  const rx = crv(SKT, 1, v, true), rz = crv(SKT, 2, v, true), back = Math.max(0, -Math.cos(th));
  const fold = 1 + (.02 + .07 * v) * (.6 * Math.sin(th * 11 + 1.3) + .4 * Math.sin(th * 7 + .4)) * sm(0, .15, v);
  o[0] = Math.sin(th) * (rx + grow) * fold; o[2] = Math.cos(th) * (rz * (1 + .22 * v * v * back) + grow) * fold;
  o[1] = 1.065 * (1 - v) + .012 * v * Math.sin(th * 9 + .5) - .015 * v * v * back - (drop || 0) * v; return o;
 }
 add(surf(Q(96), Q(30), (u, v, o) => skirtPt((u - .5) * TAU, v, 0, o), (u, v) => [u, 1 - v], true), M.skirt, wSkirt);
 add(surf(Q(80), Q(26), (u, v, o) => skirtPt((u - .5) * TAU + .05, v, .012 + .03 * v, o, .012), (u, v) => [u, 1 - v], true), M.over, wSkirt);
 // sleeves: sheer bells from the upper arm to the wrist; the drape shader lets their lower side hang
 for (const A of arms) {
  const sx = A.sx, S = BP(A.sh), Wp = BP(A.wr), y0 = S.y - .085, y1 = Wp.y + .012, w = wArmFn(A, true);
  const nu = Q(32, 16), nv = Q(24, 12), P = [], UV = [], AN = [], idx = [];
  for (let j = 0; j <= nv; j++) {
   const s = j / nv;
   for (let i = 0; i <= nu; i++) {
    const a = i / nu * TAU, se = Math.min(1.06, s * (1 + .05 * Math.sin(a * 5 + sx))), y = lerp(y0, y1, se), r = .05 + .1 * Math.pow(s, 1.7);
    const cx = S.x + sx * .012 * s, cz = S.z + .006;
    P.push(cx + Math.sin(a) * r * 1.05, y, cz + Math.cos(a) * r); UV.push(i / nu, 1 - s); AN.push(cx, y, cz, .27 * Math.pow(s, 1.6));
   }
  }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setAttribute('anchor', new THREE.Float32BufferAttribute(AN, 4)); g.setIndex(idx); g.computeVertexNormals();
  add(g, M.sleeve, w);
 }

 // ---------- head: a delicate face on an egg; the front view of the face is painted in X and Y ----------
 const _hn = [0, 0, 0];
 function headN(u, v, o) {
  const th = (u - .5) * TAU, ph = v * PI;
  let X = Math.sin(ph) * Math.sin(th), Y = Math.cos(ph), Z = Math.sin(ph) * Math.cos(th);
  const low = sm(-.05, -.95, Y);
  X *= 1 - .3 * low + .035 * G2(0, Y + .45, 1, .2);  // a soft, narrow lower face and a small chin
  if (Z > 0) Z *= 1 - .08 * low; else Z *= 1.06;
  if (Z > 0) {
   let d = 0;
   for (const s of [-1, 1]) {
    d -= .045 * G2(X - s * .36, Y - .02, .15, .1);    // shallow eye sockets
    d += .03 * G2(X - s * .34, Y - .2, .22, .06);     // soft brows
    d += .04 * G2(X - s * .5, Y + .17, .2, .14);      // rounded cheeks
    d += .015 * G2(X - s * .1, Y + .37, .045, .035);  // the wings of the nose
    d -= .012 * G2(X - s * .25, Y + .52, .06, .1);    // the corners of the mouth
   }
   d += .02 * G2(X, Y - .14, .1, .07);
   d += Math.exp(-X * X / .006) * win(Y, -.32, .0, .05) * (.03 + .08 * sm(.0, -.28, Y)); // a small straight nose
   d += .045 * G2(X, Y + .31, .06, .05); d -= .012 * G2(X, Y + .39, .05, .025);
   d += .025 * G2(X, Y + .47, .15, .035); d += .03 * G2(X, Y + .565, .13, .04);          // lips
   d -= .016 * G2(X, Y + .515, .17, .014); d -= .016 * G2(X, Y + .66, .15, .035);
   d += .04 * G2(X, Y + .82, .15, .09);                                                     // a small round chin
   Z += d * sm(0, .35, Z);
  }
  o[0] = X; o[1] = Y; o[2] = Z; return o;
 }
 const headPt = (u, v, out) => { headN(u, v, _hn); return out.set(_hn[0] * HR[0] + HC.x, _hn[1] * HR[1] + HC.y, _hn[2] * HR[2] + HC.z); };
 function mesh(geo, mat, parent) { const m = new THREE.Mesh(geo, mat); parent.add(m); return m; }
 mesh(surf(Q(96), Q(72), (u, v, o) => { headN(u, v, o); o[0] = o[0] * HR[0] + HC.x; o[1] = o[1] * HR[1] + HC.y; o[2] = o[2] * HR[2] + HC.z; },
  (u, v, o) => [((o[0] - HC.x) / HR[0]) / 1.1 * .5 + .5, ((o[1] - HC.y) / HR[1]) / 1.1 * .5 + .5], true), M.face, head);
 // the head surface point whose front view is (X, Y), and the way it faces
 function faceAt(X, Y) {
  let bu = .5, bv = .5, best = 1e9;
  for (const span of [.5, .05, .005]) {
   const cu = bu, cv = bv;
   for (let a = -10; a <= 10; a++) for (let b = -10; b <= 10; b++) {
    const u = cu + a * span / 10, v = cv + b * span / 10; if (v <= 0 || v >= 1) continue;
    headN(u, v, _hn); if (_hn[2] <= 0) continue;
    const e = (_hn[0] - X) ** 2 + (_hn[1] - Y) ** 2; if (e < best) { best = e; bu = u; bv = v; }
   }
  }
  const p = headPt(bu, bv, V3()), pu = headPt(bu + .002, bv, V3()), pv = headPt(bu, bv + .002, V3());
  const n = V3().crossVectors(pu.sub(p), pv.sub(p)).normalize(); if (n.z < 0) n.negate();
  return { p, n };
 }
 // eyes: whites and pale violet irises under lids that rest closed; the lid morph opens them (state.eyes)
 const SX = .0145, SY = .0094, SZ = .0052, IRR = .0058, YA = V3(0, 1, 0), ZF = V3(0, 0, 1);
 const zS = (x, y) => SZ * Math.sqrt(Math.max(0, 1 - (x / SX) ** 2 - (y / SY) ** 2));
 const EF = [-1, 1].map((sd) => {
  const { p, n } = faceAt(sd * .36, .01);
  const zA = n.clone().lerp(ZF, .5).normalize(), xA = V3().crossVectors(YA, zA).normalize(), yA = V3().crossVectors(zA, xA);
  const o = p.clone().addScaledVector(zA, -SZ * .8);
  return { sd, m: new THREE.Matrix4().makeBasis(xA, yA, zA).setPosition(o.x, o.y, o.z) };
 });
 {
  const gs = [], ir = [];
  for (const f of EF) {
   const g = new THREE.SphereGeometry(1, Q(20), Q(14)); g.scale(SX, SY, SZ);
   const p = g.attributes.position, col = new Float32Array(p.count * 3);
   for (let i = 0; i < p.count; i++) { const k = 1 - .3 * sm(.45, 1, Math.abs(p.getX(i)) / SX) - .25 * sm(0, SY, p.getY(i)); col[i * 3] = k * .86; col[i * 3 + 1] = k * .84; col[i * 3 + 2] = k * .9; }
   g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.applyMatrix4(f.m); gs.push(g);
   const r = new THREE.RingGeometry(0, 1, Q(24, 12), 2), rp = r.attributes.position;
   for (let i = 0; i < rp.count; i++) { const X = rp.getX(i) * IRR, Y = rp.getY(i) * IRR - .0006; rp.setXYZ(i, X, Y, zS(X, Y) + .0003); }
   r.computeVertexNormals(); r.applyMatrix4(f.m); ir.push(r);
  }
  mesh(mergeGeos(gs), M.eyeW, head); mesh(mergeGeos(ir), M.iris, head);
 }
 let lidMesh;
 {
  const P = [], PO = [], C = [], I = [], _v = V3();
  const skin = [.78, .75, .8], shade = [.64, .6, .74], lash = [.2, .14, .26];
  const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const put = (f, x, y, yo, zl, col) => { // y: where it rests (closed); yo: where it goes when open
   const z = Math.max(zS(x, y) + .0009, .0024) + zl, zo = Math.max(zS(x, yo) + .0009, .0024) + zl;
   _v.set(x, y, z).applyMatrix4(f.m); P.push(_v.x, _v.y, _v.z); _v.set(x, yo, zo).applyMatrix4(f.m); PO.push(_v.x, _v.y, _v.z); C.push(col[0], col[1], col[2]);
  };
  const grid = (nx, ny, fn) => {
   const b = P.length / 3;
   for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) fn(i / nx, j / ny);
   for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = b + j * (nx + 1) + i, c = a + nx + 1; I.push(a, c, a + 1, a + 1, c, c + 1); }
  };
  for (const f of EF) {
   const sd = f.sd;
   const yL = (x) => -SY * (.62 - .3 * x * x), yC = (x) => yL(x) + SY * .05, yE = (x) => SY * (.4 - .42 * x * x + .06 * x * sd);
   const lens = (x) => Math.sqrt(Math.max(0, 1 - (x / 1.16) ** 2)), yT = (x) => yC(x) + SY * (.12 + 1.45 * lens(x)), yB = (x) => yL(x) - SY * (.08 + .7 * lens(x)); // lid edges meet at the corners
   grid(Q(14, 8), 6, (s, r) => { const x = lerp(-1.15, 1.15, s); put(f, x * SX, lerp(yT(x), yC(x), r), lerp(yT(x), yE(x), r), 0, mix3(skin, shade, sm(.25, 1, r))); });
   grid(Q(14, 8), 2, (s, r) => { const x = lerp(-1.08, 1.12, s), th = .0016 + .0014 * sm(.2, 1.1, x * sd); put(f, x * SX, yC(x) - r * th, yE(x) - r * th, .0011, lash); });
   grid(Q(12, 6), 3, (s, r) => { const x = lerp(-1.1, 1.1, s), y0 = yL(x) - .0006, y = lerp(y0, yB(x), r); put(f, x * SX, y, y, 0, skin); });
   // lashes: fine dark points along the closed edge, longest at the outer corner, sweeping down and out
   for (let k = 0; k < 7; k++) {
    const xu = sd * lerp(.15, 1.1, k / 6), len = SY * lerp(.35, .95, k / 6), b = P.length / 3, dx = sd * SX * .4 * (k / 6), hw = SX * .045;
    put(f, xu * SX - hw, yC(xu), yE(xu), .0013, lash); put(f, xu * SX + hw, yC(xu), yE(xu), .0013, lash);
    put(f, xu * SX + dx, yC(xu) - len, yE(xu) + len, .0016, lash);
    I.push(b, b + 2, b + 1);
   }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(P.length / 3 * 2), 2));
  g.setIndex(I); g.computeVertexNormals(); g.morphAttributes.position = [new THREE.Float32BufferAttribute(PO, 3)];
  { const nr = g.attributes.normal, half = nr.count / 2, zl = [V3().setFromMatrixColumn(EF[0].m, 2), V3().setFromMatrixColumn(EF[1].m, 2)]; for (let i = 0; i < nr.count; i++) { const z = zl[i < half ? 0 : 1]; _v.set(nr.getX(i), nr.getY(i), nr.getZ(i)).lerp(z, .85).normalize(); nr.setXYZ(i, _v.x, _v.y, _v.z); } }
  lidMesh = mesh(g, M.lid, head); lidMesh.morphTargetInfluences = [0];
 }
 const mouthIn = (() => { const { p, n } = faceAt(0, -.515); const m = mesh(new THREE.CircleGeometry(1, Q(16, 8)), M.mouthIn, head); m.position.copy(p).addScaledVector(n, .0006); m.quaternion.setFromUnitVectors(ZF, n); m.scale.set(.0105, .0001, 1); m.visible = false; return m; })();
 // pointed ears with gold cuffs
 for (const s of [-1, 1]) {
  const e = new THREE.ConeGeometry(.016, .072, Q(10, 6)); e.scale(1, 1, .38); e.translate(0, .036, 0);
  const q = place(e, null, [-.55, s * .5, -s * .78]); add(q, M.skin, BI.head, [HB.x + s * .066, HB.y + HC.y + .004, HB.z + HC.z - .012]);
  add(new THREE.TorusGeometry(.009, .0022, 5, Q(14)), M.gold, BI.head, [HB.x + s * .085, HB.y + HC.y + .03, HB.z + HC.z - .028], [0, s * .9, 0]);
 }

 // ---------- hair: a cap parted in the middle, curtain bangs, and the five big locks ----------
 const hairUV = (u, v) => [.5 + .26 * Math.sin(u * TAU * 5), lerp(.98, .5, v)];
 {
  const vEnd = (th) => { const a = Math.abs(th); return .3 + .42 * sm(.45, 1.5, a) + .07 * sm(2.0, 2.8, a); };
  const g = surf(Q(64), Q(22), (u, v, o) => {
   const th = (u - .5) * TAU, a = Math.abs(th), ph = v * vEnd(th) * PI;
   const X = Math.sin(ph) * Math.sin(th), Y = Math.cos(ph), Z = Math.sin(ph) * Math.cos(th);
   const part = 1 - .025 * Math.exp(-th * th / .02) * sm(.5, .1, v);
   const vol = (1.09 + .07 * sm(.4, 1, v) * sm(.6, 1.6, a)) * part;
   o[0] = HB.x + X * HR[0] * vol + HC.x; o[1] = HB.y + Y * HR[1] * (1.06 + .01 * (1 - v)) + HC.y; o[2] = HB.z + Z * HR[2] * (Z > 0 ? 1.06 : 1.1 * vol) + HC.z; return o;
  }, (u, v) => hairUV(u, v), true);
  add(g, M.hair, BI.head);
 }
 // a flattened lock along a curve: wide across `side`, thin through it, rippled, tapering into the wisps at the end of the texture
 function lockGeo(curve, ns, nr, wFn, thFn, sideFn, wave, ph) {
  const pos = [], uv = [], idx = [], c = V3(), T = V3(), S = V3(), N = V3();
  for (let i = 0; i <= ns; i++) {
   const t = i / ns; curve.getPointAt(t, c); curve.getTangentAt(t, T);
   S.copy(sideFn(t)); S.addScaledVector(T, -S.dot(T)).normalize(); N.crossVectors(T, S).normalize();
   const wv = wave * (Math.sin(t * 13 + ph) + .35 * Math.sin(t * 29 + ph * 2)) * sm(0, .22, t), w = wFn(t), th = thFn(t);
   c.addScaledVector(S, wv * .7).addScaledVector(N, wv * .5);
   for (let j = 0; j <= nr; j++) {
    const a = j / nr * TAU, ca = Math.cos(a), sa = Math.sin(a), rip = 1 + .1 * Math.sin(a * 3 + t * 11 + ph) * sm(.05, .4, t);
    pos.push(c.x + S.x * ca * w * rip + N.x * sa * th, c.y + S.y * ca * w * rip + N.y * sa * th, c.z + S.z * ca * w * rip + N.z * sa * th);
    uv.push(.5 + .5 * ca, 1 - t);
   }
  }
  for (let i = 0; i < ns; i++) for (let j = 0; j < nr; j++) { const a = i * (nr + 1) + j, b = a + nr + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
 }
 for (const s of [-1, 1]) { // curtain bangs from the part, sweeping over the temples to the cheeks
  for (const [a, b, w] of [[.006, .028, .026], [.03, .05, .024]]) {
   const c = new THREE.CatmullRomCurve3([hb(s * a, .196, .035), hb(s * (a + .03), .178, .07), hb(s * (b + .035), .142, .097), hb(s * (b + .045), .085, .09), hb(s * (b + .046), .02, .07), hb(s * (b + .036), -.04, .052)].map((p) => V3(p[0], p[1], p[2])));
   const g = lockGeo(c, Q(22, 12), Q(10, 6), (t) => w * (1 - .8 * t * t), () => .007, () => V3(1, .2, .2), .004, s * 2), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, .45 + .5 * uv.getY(i));
   add(g, M.hair, BI.head);
  }
 }
 for (const Lk of LOCKS) add(lockGeo(Lk.curve, Q(44, 18), Q(14, 8), Lk.w, Lk.th, Lk.side, Lk.wave, Lk.ph), M.hair, wChain(Lk.bones, Lk.P, head, .75));
 for (const s of [-1, 1]) { // two under-locks close the gaps between the back locks into one mass; they ride the centre chain, so no extra bones
  const c = new THREE.CatmullRomCurve3([hb(s * .035, .12, -.085), [s * .09, 1.48, -.12], [s * .12, 1.26, -.15], [s * .14, .98, -.17], [s * .16, .68, -.228], [s * .18, .38, -.318], [s * .19, .15, -.425]].map((p) => V3(p[0], p[1], p[2])));
  add(lockGeo(c, Q(40, 16), Q(12, 8), (t) => lerp(.05, .12, sm(0, .45, t)) * (1 - .6 * sm(.74, 1, t)), (t) => .022 * (1 - .4 * t), () => V3(1, 0, -s * .3).normalize(), .045, s * 1.3 + 1), M.hair, wChain(LOCKS[0].bones, LOCKS[0].P, head, .75));
 }

 // ---------- gold and gems: the great halo ring, the circlet, the collar and chest piece, cuffs, belt, chains and pendants ----------
 {
  const ext = (shape, depth, bev) => { const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 2, curveSegments: Q(40, 16) }); g.translate(0, 0, -depth / 2); return g; };
  const bead = (r, w, p, m) => add(new THREE.SphereGeometry(r, 7, 5), m || M.gold, w, p);
  const star4 = (r, k) => { const sh = new THREE.Shape(); for (let i = 0; i < 8; i++) { const a = PI / 2 + i * PI / 4, rr = i % 2 ? r * k : r; if (i) sh.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); else sh.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } return sh; };
  // a fine chain of beads hanging from a point, ending in a teardrop gem
  const pendant = (w, p, n, step, gem) => { for (let k = 0; k < n; k++) bead(k % 2 ? .0028 : .0036, w, [p[0], p[1] - k * step, p[2]]); add(new THREE.OctahedronGeometry(gem, 0), M.gem, w, [p[0], p[1] - n * step - gem * 1.2, p[2]], null, [1, 1.7, .75]); };
  // the great ring behind her head: nearly a full circle of gold, beaded outside, a fine line inside, the crescent moon at its
  // top and little pendants hanging at her ears
  const hz = HC.z - .17, hy = HC.y + .06, RO = .245, RI = .218, A0 = -PI / 2 + .3, A1 = 3 * PI / 2 - .3;
  { const sh = new THREE.Shape(); sh.absarc(0, 0, RO, A0, A1, false); sh.absarc(0, 0, RI, A1, A0, true); add(ext(sh, .01, .0026), M.gold, BI.head, hb(0, hy, hz), [-.06, 0, 0]); }
  const ringPt = (r, a, dz) => hb(Math.cos(a) * r, hy + Math.sin(a) * r * Math.cos(.06), hz + dz - Math.sin(a) * r * Math.sin(.06));
  { const pts = []; for (let k = 0; k <= 60; k++) pts.push(V3(...ringPt(.207, lerp(A0 + .06, A1 - .06, k / 60), .002))); add(tubeR(pts, Q(120, 48), 5, () => .0024), M.gold, BI.head); }
  for (let k = 0; k <= 46; k++) bead(k % 2 ? .0034 : .0056, BI.head, ringPt(.254, lerp(A0 + .03, A1 - .03, k / 46), 0));
  for (const a of [PI / 4, 3 * PI / 4, -PI / 7, PI + PI / 7]) add(ext(star4(.019, .32), .004, .001), M.gold, BI.head, ringPt(.2315, a, .007), [-.06, 0, 0]);
  add(ext(crescentShape(.07, .03, .058), .009, .0024), M.gold, BI.head, hb(0, hy + RO, hz + .004), [-.06, 0, 0]);
  add(new THREE.SphereGeometry(.0125, Q(14, 8), Q(10, 6)), M.gem, BI.head, hb(0, hy + RO + .014, hz + .012));
  for (const s of [-1, 1]) for (const a of [.16, .4]) { const q = ringPt(RO + .004, s < 0 ? PI + a : -a, .006); pendant(BI.head, [q[0], q[1] - .006, q[2]], 5, .0105, .0075); }
  // the circlet: a fine band at the hairline with a teardrop gem on her brow
  { const pts = []; for (let k = 0; k <= 32; k++) { const a = lerp(-1.75, 1.75, k / 32); pts.push(V3(HB.x + Math.sin(a) * .085, HB.y + HC.y + .05 + .022 * (1 - Math.cos(a)), HB.z + HC.z + Math.cos(a) * .081)); } add(tubeR(pts, Q(64, 32), 6, () => .0032), M.gold, BI.head); }
  { const g = new THREE.SphereGeometry(1, Q(12, 6), Q(10, 5)); g.scale(.0065, .011, .005); add(g, M.gem, BI.head, hb(0, HC.y + .045, HC.z + HR[2] * 1.03)); }
  add(new THREE.TorusGeometry(.009, .0018, 5, Q(16)), M.gold, BI.head, hb(0, HC.y + .045, HC.z + HR[2] * 1.01), null, [.85, 1.3, 1]);
  for (const s of [-1, 1]) pendant(BI.head, hb(s * .087, HC.y + .012, HC.z - .03), 3, .009, .0055); // earrings below the cuffs
  // the collar: a double choker, three tiers of gold over her collarbones, a filigree medallion and drops, and straps to the bodice
  const chestPt = (x, y, off) => { const rx = crv(TPROF, 1, y) + off, o = [0, 0, 0]; torsoPt(Math.asin(cl(x / rx, -1, 1)), y, off, o); return V3(o[0], o[1], o[2]); };
  add(new THREE.TorusGeometry(.043, .0052, 6, Q(32)), M.gold, wNeck, [0, 1.478, -.01], [PI / 2 - .12, 0, 0]);
  add(new THREE.TorusGeometry(.0465, .0042, 6, Q(32)), M.gold, wNeck, [0, 1.458, -.01], [PI / 2 - .12, 0, 0]);
  for (let k = 0; k < 13; k++) { const a = lerp(-1.25, 1.25, k / 12); bead(.0042, wNeck, [Math.sin(a) * .047, 1.468, -.01 + Math.cos(a) * .047]); }
  add(new THREE.SphereGeometry(.007, Q(10, 6), Q(8, 5)), M.gem, BI.chest, [0, 1.462, .041]);
  for (let t = 0; t < 3; t++) {
   const pts = []; for (let k = 0; k <= 26; k++) { const sx = lerp(-1, 1, k / 26), x = sx * (.068 + .026 * t), y = 1.452 - .006 * t - (.03 + .024 * t) * Math.pow(1 - sx * sx, .8); pts.push(chestPt(x, y, .006)); }
   add(tubeR(pts, Q(52, 26), 5, () => .0029 - .0003 * t), M.gold, wTorso);
   if (t === 1) for (let k = 2; k <= 24; k += 2) bead(.0036, wTorso, pts[k].toArray());
   if (t === 2) for (const sx of [-.82, -.55, -.27, .27, .55, .82]) { const k = Math.round((sx + 1) / 2 * 26), q = pts[k]; pendant(wTorso, [q.x, q.y - .004, q.z + .002], 2, .008, .0045); }
  }
  { const sh = new THREE.Shape(); sh.moveTo(0, .02); sh.quadraticCurveTo(.016, .006, 0, -.024); sh.quadraticCurveTo(-.016, .006, 0, .02); const c = chestPt(0, 1.366, .01); add(ext(sh, .004, .0012), M.gold, wTorso, [c.x, c.y, c.z], [-.25, 0, 0]); add(new THREE.SphereGeometry(.0072, 10, 8), M.gem, wTorso, [c.x, c.y + .002, c.z + .005]); pendant(wTorso, [c.x, c.y - .027, c.z + .002], 2, .008, .0068); }
  for (const s of [-1, 1]) { const x1 = .108, y1 = neckY(Math.asin(cl(x1 / crv(TPROF, 1, 1.34), -1, 1))) + .004, pts = []; for (let k = 0; k <= 10; k++) { const f = k / 10; pts.push(chestPt(s * lerp(.12, x1, f), lerp(1.44, y1, f), .006)); } add(tubeR(pts, Q(20, 10), 5, () => .0026), M.gold, wTorso); }
  // the neckline's gold edge, a line of beads down the bodice, and the double belt with its crescent clasp and drops
  { const pts = []; for (let k = 0; k < 64; k++) { const th = (k / 64 - .5) * TAU, o = [0, 0, 0]; torsoPt(th, neckY(th), .006, o); pts.push(V3(o[0], o[1], o[2])); } add(tubeR(pts, Q(160, 64), 5, () => .0038, true), M.gold, wTorso); }
  for (let k = 0; k < 9; k++) { const q = chestPt(0, lerp(1.285, 1.095, k / 8), .007); bead(k % 2 ? .0038 : .0055, wTorso, q.toArray()); }
  for (const [y, gr, r] of [[1.078, .011, .0058], [1.062, .013, .0045]]) { const pts = []; for (let k = 0; k < 48; k++) { const th = (k / 48 - .5) * TAU, o = [0, 0, 0]; torsoPt(th, y, gr, o); pts.push(V3(o[0], o[1], o[2])); } add(tubeR(pts, Q(96, 40), 6, () => r, true), M.gold, wTorso); }
  add(ext(crescentShape(.034, .012, .03), .006, .0015), M.gold, BI.hips, [0, 1.064, .098], [0, 0, PI]);
  add(new THREE.SphereGeometry(.011, Q(12, 6), Q(10, 5)), M.gem, BI.hips, [0, 1.064, .103]);
  // chains down the front of the skirt: a long centre chain to a four-pointed star, two side chains to small stars, and swags
  { const o = [0, 0, 0];
   for (let k = 0; k < 26; k++) { const v = .02 + k / 25 * .6; skirtPt(0, v, .012, o); bead(k % 3 === 0 ? .006 : .0042, wSkirt, [o[0], o[1], o[2]]); }
   skirtPt(0, .64, .016, o); add(ext(star4(.032, .28), .005, .0012), M.gold, wSkirt, [o[0], o[1] - .03, o[2]]);
   add(new THREE.SphereGeometry(.007, 8, 6), M.gem, wSkirt, [o[0], o[1] - .03, o[2] + .006]);
   for (const s of [-1, 1]) {
    for (let k = 0; k < 17; k++) { const v = .03 + k / 16 * .4; skirtPt(s * .42, v, .013, o); bead(k % 3 === 0 ? .0052 : .0038, wSkirt, [o[0], o[1], o[2]]); }
    skirtPt(s * .42, .445, .016, o); add(ext(star4(.021, .3), .004, .001), M.gold, wSkirt, [o[0], o[1] - .02, o[2]], [0, s * .42, 0]);
    add(new THREE.SphereGeometry(.005, 8, 6), M.gem, wSkirt, [o[0], o[1] - .02, o[2] + .004]);
    for (const [a0, a1, d] of [[.12, .95, .16], [.1, .4, .1]]) for (let k = 0; k < 14; k++) { const f = k / 13, th = s * lerp(a0, a1, f), v = .03 + d * Math.sin(PI * f); skirtPt(th, v, .014, o); bead(.0036, wSkirt, [o[0], o[1], o[2]]); }
    for (const th of [.2, .62]) { skirtPt(s * th, .035, .014, o); pendant(wSkirt, [o[0], o[1] - .006, o[2]], 2, .009, .0055); }
   }
  }
  // cuffs: a double band set with beads and a gem on each upper arm, with a dangle; a double cuff at each wrist
  for (const A of arms) {
   const S = BP(A.sh), Wp = BP(A.wr), y0 = S.y - .085, w = wArmFn(A), cx = S.x + A.sx * .002, cz = S.z + .006;
   for (const [dy, r, tr] of [[.008, .0535, .0048], [-.012, .0515, .0042]]) add(new THREE.TorusGeometry(r, tr, 6, Q(28)), M.gold, w, [cx, y0 + dy, cz], [PI / 2, 0, 0]);
   for (let k = 0; k < 10; k++) { const a = k / 10 * TAU; bead(.0036, w, [cx + Math.sin(a) * .055, y0 - .002, cz + Math.cos(a) * .055]); }
   add(new THREE.SphereGeometry(.0068, 10, 8), M.gem, w, [cx + A.sx * .057, y0 - .002, cz]);
   pendant(w, [cx + A.sx * .058, y0 - .016, cz], 3, .0095, .006);
   for (const [dy, r] of [[.03, .0255], [.012, .0245]]) add(new THREE.TorusGeometry(r, .0042, 6, Q(20)), M.gold, wArmFn(A), [Wp.x, Wp.y + dy, Wp.z], [PI / 2, 0, 0]);
   for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; bead(.003, wArmFn(A), [Wp.x + Math.sin(a) * .027, Wp.y + .021, Wp.z + Math.cos(a) * .027]); }
  }
 }

 // ---------- wings: painted panels that bend at the mid joint ----------
 for (const Wg of wings) {
  for (const fore of [true, false]) {
   const sx = Wg.sx, x1 = fore ? .9 : .85, yA = fore ? 1.12 : .02, yB = fore ? 2.02 : 1.32, z0 = fore ? -.115 : -.122, nu = Q(26, 12), nv = Q(26, 12);
   const rb = BI[(fore ? Wg.fr : Wg.hr).name], mb = BI[(fore ? Wg.fm : Wg.hm).name];
   const yh = fore ? 1.3 : 1.23, WS = 1.1; // the panels are painted at one size and built 10% larger about the hinge
   const g = surf(nu, nv, (u, v, o) => { const x = lerp(.03, x1, u), y = lerp(yB, yA, v); o[0] = sx * x * WS; o[1] = yh + (y - yh) * WS; o[2] = z0 - .05 * Math.pow(x / x1, 2) + .012 * Math.sin(PI * u) * Math.sin(PI * v); return o; },
    (u, v) => { const x = lerp(.03, x1, u), y = lerp(yB, yA, v); return fore ? [x / .9 * .5, 1 - (2.02 - y) / .9 * .5] : [.5 + x / .85 * .5, 1 - (1.32 - y) * (512 / .85) / 1024]; });
   add(g, M.wing, (x) => { const t = sm(.1, .42, Math.abs(x)); return [[rb, 1 - t], [mb, t]]; });
  }
 }

 // ---------- build the skinned meshes ----------
 root.updateMatrixWorld(true);
 const skeleton = new THREE.Skeleton(bones);
 const skinned = [];
 for (const [mat, Lst] of BUCK) {
  const geo = mergeGeos(Lst.map((e) => e.g)), nv = geo.attributes.position.count, SI = new Uint16Array(nv * 4), SW = new Float32Array(nv * 4);
  let o = 0; for (const e of Lst) { SI.set(e.si, o); SW.set(e.sw, o); o += e.si.length; }
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(SI, 4)); geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(SW, 4));
  geo.computeBoundingSphere();
  const m = new THREE.SkinnedMesh(geo, mat); m.frustumCulled = false; if (mat.transparent) m.renderOrder = 2;
  body.add(m); m.bind(skeleton); skinned.push(m);
 }
 BUCK.clear();

 // ---------- effects: her aura, the halo's glow, the moon orb, crescents, motes, wing dust and sparkles; one light ----------
 function spr(map, color, order) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); s.visible = false; s.renderOrder = order || 5; fx.add(s); return s; }
 // point particles; sizes are true world sizes in the narrow, zoomed battle camera
 function particles(n, size, map) {
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('color', new THREE.BufferAttribute(col, 3).setUsage(THREE.DynamicDrawUsage));
  const pm = new THREE.PointsMaterial({ size, map: map || dotT, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  pm.onBeforeCompile = (s) => { s.vertexShader = s.vertexShader.replace('gl_PointSize *= ( scale / - mvPosition.z );', 'gl_PointSize *= ( scale * projectionMatrix[1][1] / - mvPosition.z );'); };
  pm.customProgramCacheKey = () => 'lunara-pts';
  const pts = new THREE.Points(g, pm); pts.frustumCulled = false; pts.renderOrder = 8; fx.add(pts);
  return { pts, pos, col, g, n, vel: new Float32Array(n * 3), tint: new Float32Array(n * 3), life: new Float32Array(n), max: new Float32Array(n).fill(1), ph: new Float32Array(n), next: 0, live: 0 };
 }
 function emit(P, x, y, z, vx, vy, vz, life, r, g, b) { const i = P.next; P.next = (i + 1) % P.n; P.pos[i * 3] = x; P.pos[i * 3 + 1] = y; P.pos[i * 3 + 2] = z; P.vel[i * 3] = vx; P.vel[i * 3 + 1] = vy; P.vel[i * 3 + 2] = vz; P.tint[i * 3] = r; P.tint[i * 3 + 1] = g; P.tint[i * 3 + 2] = b; P.life[i] = life; P.max[i] = life; P.ph[i] = rnd() * TAU; return i; }
 function stepP(P, dt, drag, grav, tw, t) {
  let live = 0; const p = P.pos, v = P.vel, f = Math.exp(-drag * dt);
  for (let i = 0; i < P.n; i++) {
   if (P.life[i] <= 0) { if (P.col[i * 3] || P.col[i * 3 + 1]) P.col[i * 3] = P.col[i * 3 + 1] = P.col[i * 3 + 2] = 0; continue; }
   live++; P.life[i] -= dt; const a = 1 - P.life[i] / P.max[i];
   v[i * 3] *= f; v[i * 3 + 1] = v[i * 3 + 1] * f + grav * dt; v[i * 3 + 2] *= f;
   p[i * 3] += v[i * 3] * dt; p[i * 3 + 1] += v[i * 3 + 1] * dt; p[i * 3 + 2] += v[i * 3 + 2] * dt;
   const k = Math.max(0, Math.sin(PI * Math.min(1, a * 1.1)) * (1 - tw + tw * (.5 + .5 * Math.sin(t * 13 + P.ph[i]))));
   P.col[i * 3] = P.tint[i * 3] * k; P.col[i * 3 + 1] = P.tint[i * 3 + 1] * k; P.col[i * 3 + 2] = P.tint[i * 3 + 2] * k;
  }
  if (live || P.live) { P.g.attributes.position.needsUpdate = true; P.g.attributes.color.needsUpdate = true; }
  P.live = live;
 }
 const aura = spr(glowT, 0x9d92f0, 2), haloGlow = spr(glowT, 0xffdfa6, 3), orbGlow = spr(glowT, 0xd6e0ff, 6), orbRings = [spr(ringT, 0xe6ecff, 7), spr(ringT, 0xb8c8ff, 7)];
 const handGlow = [spr(glowT, 0xd8dcff, 6), spr(glowT, 0xd8dcff, 6)];
 const orbMesh = new THREE.Mesh(new THREE.SphereGeometry(1, Q(28, 16), Q(20, 12)), new THREE.MeshBasicMaterial({ map: moonSolid, transparent: true })); orbMesh.visible = false; orbMesh.renderOrder = 6; fx.add(orbMesh);
 const crescents = []; for (let i = 0; i < 10; i++) crescents.push({ s: spr(cresT, 0xe6e2ff, 9), t: -1, from: V3(), to: V3(), side: 1 });
 const motes = particles(110, .07, dotT), dust = particles(90, .06, sparkT), sparks = particles(420, .09, sparkT);
 const light = new THREE.PointLight(0xd8dcff, 0, 9, 2); fx.add(light);

 // ---------- poses and actions ----------
 // body: y lift (m), sink (m, below her hover), dx/dz drift (m), turn (whole body), lean, sway, tw (chest turn), hp/hy/hr head pitch, turn, roll
 // arms (r her right, l her left): f forward raise, s side raise, u upper-arm turn, e elbow, t forearm turn, w wrist, c finger curl, p finger spread
 // wings: wo open (0 folded behind her, 1 spread, more than 1 flung wide), wf wrapped around her, wl lifted, fa flap
 // look: fl skirt flare, hf hair floating, glow, orb (its size), ot (the orb thrown up), lid (0 closed), mo lips parted, fade, aim (turn to the target)
 const BASE = { y: 0, sink: 0, dx: 0, dz: 0, turn: 0, lean: .02, sway: 0, tw: 0, hp: .12, hy: 0, hr: .05,
  rf: .14, rs: .3, ru: .2, re: .42, rt: .35, rw: .2, rc: .3, rp: .3,
  lf: .14, ls: .3, lu: .2, le: .42, lt: .35, lw: .2, lc: .3, lp: .3,
  wo: 1, wf: 0, wl: 0, fa: 1, fl: 0, hf: 0, glow: 1, orb: 0, ot: 0, lid: 0, mo: 0, fade: 1, aim: 0 };
 const KEYS = Object.keys(BASE);
 const ARMK = ['f', 's', 'u', 'e', 't', 'w', 'c', 'p'];
 const both = (o) => { const r = {}; for (const k in o) { if (ARMK.includes(k)) { r['r' + k] = o[k]; r['l' + k] = o[k]; } else r[k] = o[k]; } return r; };
 const side = (sd, o) => { const r = {}; for (const k in o) r[ARMK.includes(k) ? sd + k : k] = o[k]; return r; };
 const right = (o) => side('r', o), left = (o) => side('l', o);
 const mix = (...a) => Object.assign({}, ...a);
 const OPEN = both({ f: .25, s: 1.05, u: 0, e: .25, t: PI * .9, w: -.2, c: .15, p: .5 });
 const RISE = both({ f: .1, s: .62, u: .1, e: .2, t: .2, w: -.25, c: .2, p: .45 });
 const ORB_CHEST = both({ f: .62, s: .1, u: .75, e: 1.45, t: .9, w: -.1, c: .45, p: .3 });
 const ORB_UP = both({ f: 2.75, s: .32, u: .2, e: .55, t: PI * .5, w: .15, c: .4, p: .3 });
 const GUARD = mix(both({ f: .55, s: .05, u: .6, e: 1.6, t: .4, c: .45 }), { wf: .3, hp: .18, lean: .04 });
 const ACTS = {};
 function act(name, dur, keys, o) {
  const t = [], p = []; let prev = BASE;
  for (const [u, k] of keys) { const full = Object.assign({}, prev, k); t.push(u); p.push(full); prev = full; }
  ACTS[name] = Object.assign({ name, dur, t, p, hits: [], cues: [], hold: false, interrupt: false, rate: 11, snap: null, dash: null, pulse: null }, o || {});
 }
 function evalKeys(def, u, out) {
  const T = def.t, Pk = def.p; let i = 0; while (i < T.length - 2 && u > T[i + 1]) i++;
  const a = T[i], b = T[i + 1], s = b > a ? cl((u - a) / (b - a), 0, 1) : 1, e = s * s * (3 - 2 * s);
  for (const k of KEYS) out[k] = lerp(Pk[i][k], Pk[i + 1][k], e);
 }
 // rising from the Moonwell's light: arms down and open, toes pointed, hair and skirt lifting; the wings unfurl as she clears it
 act('appear', 3.4, [[0, mix(RISE, { sink: -3.3, wo: 0, hf: 1, fl: .7, glow: 1.5, hp: -.1, fade: 1 })],
  [.68, { sink: 0, fl: .45 }],
  [.8, mix(OPEN, { wo: 1.15, hf: .3, fl: .12, glow: 1.7, hp: -.04 })],
  [.92, { glow: 1.3 }],
  [1, BASE]], { cues: [.02, .78], snap: ['sink', 'fade', 'wo', 'hf'], rate: 12 });
 // Pale Mother's Embrace: the wings close around her, hand on her heart; then they open and she reaches out to the party
 act('embrace', 3.6, [[0, {}],
  [.1, mix(OPEN, { wo: 1.15, wl: .3, glow: 1.3, hp: -.05 })],
  [.3, mix(right({ f: .7, s: -.1, u: .9, e: 2.1, t: .4, w: .2, c: .35, p: .2 }), left({ f: .55, s: 0, u: .7, e: 1.9, t: .3, c: .4 }), { wf: 1, wo: 1, wl: 0, glow: 1.6, hp: .32, lean: .06 })],
  [.5, { glow: 1.9 }],
  [.6, mix(left({ f: .9, s: .35, u: 0, e: .2, t: PI * .8, w: -.15, c: .1, p: .5 }), right({ f: .25, s: .55, u: .1, e: .3, t: PI * .7, w: -.2, c: .15, p: .45 }), { wf: 0, wo: 1.2, wl: .2, glow: 2.1, hp: .05, lean: -.03 })],
  [.84, { glow: 1.4 }],
  [1, BASE]], { hits: [.62], cues: [.3], rate: 9 });
 // Silver Requiem, the charge: the moon gathers at her heart, then she lifts it overhead and holds it there
 act('charge', 2.2, [[0, {}],
  [.3, mix(ORB_CHEST, { orb: .55, glow: 1.4, hp: .2, wo: 1.05 })],
  [.5, { orb: 1 }],
  [.85, mix(ORB_UP, { orb: 1, glow: 1.6, hp: -.18, wo: 1.15, lean: -.04 })],
  [1, {}]], { hold: true, cues: [.08], rate: 9 });
 // Silver Requiem: the moon thrown up, six moonbeams called down with the crescent wave from her outstretched hand, then Moonfall.
 // Built twice, so the wave comes from whichever hand is nearer the target.
 const RELEASE_HITS = [.25, .3, .35, .4, .45, .5, .78];
 for (const sd of ['r', 'l']) {
  const od = sd === 'r' ? 'l' : 'r';
  act('release_' + sd, 4.2, [[0, mix(ORB_UP, { orb: 1, glow: 1.6, hp: -.18, wo: 1.15 })],
   [.07, mix(both({ f: 2.95, e: .12, s: .25 }), { ot: .35, orb: 1, glow: 1.8, y: .08, hp: -.25 })],
   [.1, { ot: .35, orb: 0 }],
   [.18, mix(side(sd, { f: 1.35, s: .55, u: 0, e: .05, t: PI * .55, w: -.35, c: .05, p: .6 }), side(od, { f: -.3, s: .45, u: .1, e: .3, t: .3, w: .1, c: .25, p: .3 }), { aim: 1, ot: 0, orb: 0, glow: 1.3, hp: .05, y: 0, wo: 1.05 })],
   [.53, {}],
   [.6, mix(both({ f: 2.6, s: .55, u: 0, e: .25, t: PI * .6, w: 0, c: .15, p: .5 }), { aim: .4, hp: -.25, glow: 1.6, wo: 1.2, y: .1 })],
   [.72, {}],
   [.78, mix(both({ f: .9, s: .55, u: 0, e: .1, t: PI * .5, w: -.4, c: .1, p: .55 }), { aim: .7, hp: .1, lean: .1, glow: 2, y: -.05, mo: .2 })],
   [.88, { mo: 0 }],
   [1, BASE]], { hits: RELEASE_HITS, cues: [.07, .56], rate: 10, pulse: { k: sd + 'e', at: RELEASE_HITS.slice(0, 6), amt: .35, w: .018 } });
 }
 // leaving: she turns to the side, head back, and drifts away into sparkles
 act('leave', 2.6, [[0, {}],
  [.22, mix(both({ f: -.15, s: .35, u: .1, e: .2, t: .3, w: -.3, c: .15, p: .4 }), { turn: 1.2, hp: -.35, hr: -.1, wo: .7, hf: .4, fl: .3, glow: 1.4 })],
  [.95, { dx: 1.3, y: 1.0, fade: 0, wo: .5, glow: .8 }],
  [1, { dx: 1.3, y: 1.0, fade: 0 }]], { hold: true, cues: [.2], rate: 8 });
 act('hurt', .6, [[0, {}], [.2, mix(both({ f: .35, s: .18, u: .5, e: 1.1, c: .7 }), { lean: -.2, hp: -.28, hr: .14, wf: .3, glow: .7, mo: .45, y: .04 })], [1, BASE]],
  { interrupt: true, rate: 16, dash: (u) => -.7 * (1 - sm(0, .5, u)) * sm(0, .05, u) });
 act('block', .45, [[0, {}], [.3, mix(GUARD, { wf: .6, lean: -.06, hp: .2 })], [.7, {}], [1, BASE]], { interrupt: true, rate: 18, dash: (u) => (u < .35 ? -.4 * Math.sin(PI * u / .35) : 0) });

 // ---------- secondary motion: hair on spring chains (1/120 s substeps, body colliders), a skirt that sways, wings that lag ----------
 const DOWN = V3(0, -1, 0), UPV = V3(0, 1, 0), PH = 1 / 120;
 const COL = []; for (let i = 0; i < 9; i++) COL.push({ a: V3(), r: 0 });
 function updateColliders() {
  head.localToWorld(COL[0].a.copy(HC)); COL[0].r = .1 * K;
  chest.localToWorld(COL[1].a.set(0, .06, .012)); COL[1].r = .132 * K;
  spine.localToWorld(COL[2].a.set(0, -.02, -.01)); COL[2].r = .118 * K;
  hips.localToWorld(COL[3].a.set(0, -.12, 0)); COL[3].r = .19 * K;
  hips.localToWorld(COL[4].a.set(0, -.42, -.03)); COL[4].r = .25 * K;
  hips.localToWorld(COL[5].a.set(0, -.7, -.05)); COL[5].r = .31 * K;
  R.sh.localToWorld(COL[6].a.set(0, -.02, 0)); COL[6].r = .058 * K;
  L.sh.localToWorld(COL[7].a.set(0, -.02, 0)); COL[7].r = .058 * K;
  hips.localToWorld(COL[8].a.set(0, -.92, -.06)); COL[8].r = .4 * K;
 }
 const _cb = V3();
 function collide(p, v, ids, m) {
  for (const k of ids) { const c = COL[k]; _cb.subVectors(p, c.a); const d = _cb.length(), Rr = c.r + m; if (d < Rr) { if (d < 1e-6) _cb.set(0, 0, -1); else _cb.multiplyScalar(1 / d); p.copy(c.a).addScaledVector(_cb, Rr); const vn = v.dot(_cb); if (vn < 0) v.addScaledVector(_cb, -vn); } }
 }
 const CH = LOCKS.map((Lk) => ({ bs: Lk.bones, offs: [Lk.bones[1].position.clone(), Lk.bones[2].position.clone(), Lk.tip.clone()], L: [0, 0, 0], p: [V3(), V3(), V3()], v: [V3(), V3(), V3()], T: [V3(), V3(), V3()],
  K: Lk.back ? 34 : 40, C: Lk.back ? 4.6 : 5, gks: Lk.back ? [.12, .42, .6] : [.2, .5, .62], cols: Lk.back ? [0, 2, 3, 4, 5, 6, 7, 8] : [0, 1, 3, 4, 6, 7], m: .02 * K, ph: Lk.ph, init: false }));
 for (const ch of CH) ch.L = ch.offs.map((o) => o.length() * K);
 const _cm = new THREE.Matrix4(), _cj = V3(), _cv = V3(), _cw = V3(), _cq = new THREE.Quaternion(), _cq2 = new THREE.Quaternion(), _cq3 = new THREE.Quaternion();
 function physics(t, dt, hf, reset) {
  updateColliders();
  // world matrices are fresh here (animate updated them), so read them instead of walking the parents again
  for (const ch of CH) {
   _cj.setFromMatrixPosition(ch.bs[0].matrixWorld);
   for (let i = 0; i < 3; i++) {
    _cv.copy(ch.offs[i]).transformDirection(ch.bs[i].matrixWorld).lerp(DOWN, ch.gks[i] * (1 - hf));
    if (hf > 0) _cv.lerp(UPV, hf * .55 * i / 2).x += hf * .25 * Math.sin(t * 1.3 + ch.ph + i);
    _cv.x += .012 * Math.sin(t * 1.1 + ch.ph + i); _cv.z += .01 * Math.sin(t * .8 + ch.ph * 1.7 + i * .5);
    _cv.normalize(); ch.T[i].copy(_cj).addScaledVector(_cv, ch.L[i]); _cj.copy(ch.T[i]);
   }
   if (!ch.init || reset) { for (let i = 0; i < 3; i++) { ch.p[i].copy(ch.T[i]); ch.v[i].set(0, 0, 0); } ch.init = true; }
  }
  if (dt > 0) {
   const n = Math.max(1, Math.ceil(dt / PH - 1e-6)), h = dt / n;
   for (const ch of CH) {
    const p = ch.p, v = ch.v, T = ch.T, k2 = ch.K, c2 = ch.C;
    for (let s = 0; s < n; s++) {
     for (let i = 0; i < 3; i++) { v[i].x += (k2 * (T[i].x - p[i].x) - c2 * v[i].x) * h; v[i].y += (k2 * (T[i].y - p[i].y) - c2 * v[i].y) * h; v[i].z += (k2 * (T[i].z - p[i].z) - c2 * v[i].z) * h; p[i].addScaledVector(v[i], h); }
     _cj.setFromMatrixPosition(ch.bs[0].matrixWorld);
     for (let i = 0; i < 3; i++) { _cv.subVectors(p[i], _cj); const Ln = _cv.length() || 1; p[i].copy(_cj).addScaledVector(_cv, ch.L[i] / Ln); collide(p[i], v[i], ch.cols, ch.m); _cj.copy(p[i]); }
    }
   }
  }
  for (const ch of CH) for (let i = 0; i < 3; i++) {
   const b = ch.bs[i]; _cj.setFromMatrixPosition(b.matrixWorld); _cq.setFromRotationMatrix(_cm.extractRotation(b.matrixWorld));
   _cv.copy(ch.offs[i]).transformDirection(b.matrixWorld); _cw.subVectors(ch.p[i], _cj).normalize();
   _cq2.setFromUnitVectors(_cv, _cw); _cq3.copy(_cq).invert().multiply(_cq2).multiply(_cq);
   b.quaternion.multiply(_cq3); b.updateMatrixWorld(true);
  }
 }

 // ---------- runtime ----------
 const FIN = Object.assign({}, BASE), TGT = Object.assign({}, BASE);
 let actv = null, gOn = false, gW = 0, fadeE = 1, fadeNow = -1, inited = false, lastU = 0, aimYaw = 0, physReset = false;
 const vel = V3(), prevW = V3(), sway = { x: 0, z: 0, vx: 0, vz: 0 }, lastPos = V3(); let velInit = false, lastYaw = 0;
 function applyPose(P, t) {
  base.position.set(P.dx, HOVER + P.y + P.sink, P.dz);
  const tw = P.tw + P.aim * aimYaw;
  hips.rotation.set(P.lean * .3, P.turn + tw * .2, P.sway * .4);
  spine.rotation.set(P.lean * .3, tw * .3, P.sway * .3);
  chest.rotation.set(P.lean * .4, tw * .35, P.sway * .3);
  neck.rotation.set(P.hp * .35, P.hy * .4 + tw * .1, P.hr * .35); head.rotation.set(P.hp * .65, P.hy * .6, P.hr * .65);
  for (const A of arms) {
   const s = A.sx < 0 ? 'r' : 'l', sx = A.sx, c = P[s + 'c'], p = P[s + 'p'];
   A.sh.rotation.set(-P[s + 'f'], -sx * P[s + 'u'], sx * P[s + 's'], 'XZY');
   A.el.rotation.set(-P[s + 'e'], 0, 0);
   A.wr.rotation.set(0, -sx * P[s + 't'], -sx * P[s + 'w'], 'YZX');
   A.fingers.forEach((F, k) => { const spread = [-.13, -.04, .05, .14][k] * p, ck = c * (1 + .12 * k); F.f0.rotation.set(spread, 0, -sx * ck * .9); F.f1.rotation.set(0, 0, -sx * ck * 1.15); });
   A.thumb.t0.rotation.set(-.5 - p * .25, 0, -sx * (.28 + c * .5)); A.thumb.t1.rotation.set(0, 0, -sx * c * .55);
  }
  const fl1 = Math.sin(t * 1.7), fl2 = Math.sin(t * 1.7 - .8), op = Math.min(1, P.wo), wide = Math.max(0, P.wo - 1);
  for (const Wg of wings) {
   const sx = Wg.sx, fa = P.fa * op;
   Wg.fr.rotation.set(0, sx * (lerp(1.3, .32, op) - .3 * wide + .13 * fl1 * fa - .62 * P.wf), sx * (lerp(.4, 0, op) + .2 * P.wl + .04 * fl1 * fa));
   Wg.fm.rotation.set(0, sx * (lerp(.4, .05, op) + .09 * fl2 * fa - 1.65 * P.wf), 0);
   Wg.hr.rotation.set(0, sx * (lerp(1.2, .3, op) - .25 * wide + .1 * fl2 * fa - .58 * P.wf), sx * (lerp(-.25, 0, op) - .06 * P.wl));
   Wg.hm.rotation.set(0, sx * (lerp(.35, .04, op) + .07 * Math.sin(t * 1.7 - 1.4) * fa - 1.5 * P.wf), 0);
  }
  // the skirt hangs plumb from the waist and trails her motion; it lifts and flares as she rises
  skA.rotation.set(-P.lean * .5 + sway.z * .35, 0, -P.sway * .3 - sway.x * .35);
  skB.rotation.set(sway.z * .5, 0, -sway.x * .5);
  skA.scale.set(1 + .08 * P.fl, 1, 1 + .08 * P.fl); skB.scale.set(1 + .3 * P.fl, 1 - .22 * P.fl, 1 + .3 * P.fl);
  for (const ch of CH) for (const b of ch.bs) b.quaternion.set(0, 0, 0, 1);
  lidMesh.morphTargetInfluences[0] = cl(Math.max(P.lid, +state.eyes || 0), 0, 1);
  mouthIn.visible = P.mo > .03; mouthIn.scale.y = .0001 + .0055 * P.mo;
 }
 function applyFade(f) {
  if (Math.abs(f - fadeNow) < 1e-3) return; fadeNow = f;
  for (const q of allMats) { q.m.opacity = q.op * f; q.m.transparent = q.tr || f < .999; }
  root.visible = f > .003;
 }
 function play(name, force) {
  let def = name === 'release' ? null : ACTS[name];
  if (name === 'release') { const lp = root.worldToLocal(_t1.set(state.target.x, state.target.y, state.target.z)); def = ACTS[lp.x >= 0 ? 'release_l' : 'release_r']; }
  if (!def || name.startsWith('release_')) return false;
  const gone = FIN.fade < .02 || FIN.sink < -2.5;
  if (gone && name !== 'appear') { name = 'appear'; def = ACTS.appear; }
  if (actv && !force && !def.interrupt && !(actv.def.hold && actv.t >= actv.def.dur - 1e-6)) return false;
  if (def.snap) for (const k of def.snap) FIN[k] = def.p[0][k];
  if (name === 'appear') { FIN.fade = 1; FIN.dx = 0; FIN.dz = 0; FIN.y = 0; FIN.turn = 0; velInit = false; physReset = true; }
  actv = { name, def, t: 0 }; lastU = 0; fx.userData.thrown = false;
  return true;
 }
 const _t1 = V3(), _t2 = V3(), _t3 = V3(), _q1 = new THREE.Quaternion();
 const P3 = (o, x, y, z, out) => o.localToWorld((out || V3()).set(x, y, z));
 const ORB = V3(), ORB_LAST = V3(), PALM = [V3(), V3()];
 let crAcc = 0, moteAcc = 0, dustAcc = 0, sparkAcc = 0;
 function updateFX(name, u, t, dt, pres) {
  const glow = FIN.glow * (+state.glow || 1), on = pres > .01;
  for (const A of arms) P3(A.wr, 0, -.075, 0, PALM[A.sx < 0 ? 0 : 1]);
  // the orb sits between her palms; thrown, it flies straight up as it goes out
  ORB.copy(PALM[0]).add(PALM[1]).multiplyScalar(.5); P3(chest, 0, 0, 0, _t1); _t2.subVectors(ORB, _t1); _t2.y = 0;
  if (_t2.lengthSq() > 1e-6) ORB.addScaledVector(_t2.normalize(), .05 * K * FIN.orb);
  ORB.y += FIN.ot * 2.6;
  const orbR = .088 * K * FIN.orb * (1 + .05 * Math.sin(t * 6));
  const orbOn = on && FIN.orb > .02 && !(name === 'release' && u >= ACTS.release_l.cues[0]); // thrown: the battle's moon takes over from here
  orbMesh.visible = orbGlow.visible = orbRings[0].visible = orbRings[1].visible = orbOn;
  if (orbOn) {
   ORB_LAST.copy(ORB);
   orbMesh.position.copy(ORB); orbMesh.scale.setScalar(orbR); orbMesh.rotation.y = t * .5; orbMesh.material.opacity = pres;
   orbGlow.position.copy(ORB); orbGlow.scale.setScalar(orbR * 6.5); orbGlow.material.opacity = .55 * pres;
   orbRings.forEach((r, i) => { r.position.copy(ORB); r.scale.setScalar(orbR * (3 + i)); r.material.rotation = t * (i ? -.8 : 1.2); r.material.opacity = .45 * pres; });
  }
  // her soft aura and the halo's glow
  P3(chest, 0, .02, -.08, _t1);
  aura.visible = on && _t1.y > state.floor; aura.position.copy(_t1); aura.scale.setScalar(K * 2.1 * (.9 + .1 * glow)); aura.material.opacity = .1 * glow * pres;
  P3(head, 0, HC.y + .06, HC.z - .2, _t2);
  haloGlow.visible = on && _t2.y > state.floor; haloGlow.position.copy(_t2); haloGlow.scale.setScalar(K * .62); haloGlow.material.opacity = (.12 + .06 * glow) * pres;
  const hk = name === 'charge' || name === 'embrace' || name === 'release' ? cl(glow - 1, 0, 1) : 0;
  handGlow.forEach((s, i) => { s.visible = on && hk > .02; if (s.visible) { s.position.copy(PALM[i]); s.scale.setScalar(K * (.16 + .1 * hk)); s.material.opacity = .5 * hk * pres; } });
  light.position.copy(_t1).addScaledVector(_t3.set(0, 0, 1).applyQuaternion(root.getWorldQuaternion(_q1)), 2.6); light.position.y -= 1; light.intensity = on ? (.15 * glow + .3 * FIN.orb) * pres : 0;
  // the crescent wave: crescents stream from her outstretched hand toward the target while the moonbeams fall
  const tg = _t3.set(state.target.x, state.target.y, state.target.z);
  if (name === 'release' && u > .19 && u < .52 && dt > 0) {
   crAcc += dt / .09;
   const hand = PALM[actv && actv.def.name === 'release_r' ? 0 : 1];
   while (crAcc >= 1) { crAcc -= 1; const c = crescents.find((q) => q.t < 0); if (!c) break; c.t = 0; c.from.copy(hand); c.to.copy(tg); c.to.y += .3 + rnd() * .8; c.to.x += (rnd() - .5) * 1.2; c.to.z += (rnd() - .5) * .8; c.side = rnd() < .5 ? -1 : 1; }
  }
  for (const c of crescents) {
   if (c.t < 0) { c.s.visible = false; continue; }
   c.t += dt / .42; if (c.t >= 1) { c.t = -1; c.s.visible = false; emit(sparks, c.to.x, c.to.y, c.to.z, 0, .4, 0, .5, .8, .8, 1); continue; }
   const k = c.t; c.s.visible = true; c.s.position.copy(c.from).lerp(c.to, k); c.s.position.y += Math.sin(PI * k) * .5 * c.side;
   c.s.scale.setScalar(K * (.3 + .32 * k)); c.s.material.rotation = -PI * .5 + k * .9 * c.side; c.s.material.opacity = Math.sin(PI * Math.min(1, k * 1.25));
   if (rnd() < .6) emit(sparks, c.s.position.x, c.s.position.y, c.s.position.z, (rnd() - .5) * .3, (rnd() - .5) * .3, (rnd() - .5) * .3, .45, .75, .78, 1);
  }
  // motes rise around her; wing dust falls from the wings; sparkles burst as she arrives and as she leaves
  if (on && dt > 0) {
   P3(hips, 0, -.95, 0, _t1);
   moteAcc += dt * 30 * pres * (.6 + .4 * glow);
   while (moteAcc >= 1) { moteAcc -= 1; const a = rnd() * TAU, r = K * (.25 + .35 * rnd()); emit(motes, _t1.x + Math.cos(a) * r, Math.max(state.floor, _t1.y) + rnd() * K * 1.3, _t1.z + Math.sin(a) * r * .8, (rnd() - .5) * .1, .25 + .3 * rnd(), (rnd() - .5) * .1, 2.2 + rnd() * 1.6, .78, .8, 1); }
   dustAcc += dt * 26 * pres * Math.min(1, FIN.wo);
   while (dustAcc >= 1) { dustAcc -= 1; const Wg = wings[rnd() < .5 ? 0 : 1], fore = rnd() < .55, bn = fore ? Wg.fm : Wg.hm, ox = Wg.sx * (.05 + .5 * rnd()); P3(bn, ox, fore ? .1 + .5 * rnd() : -.1 - .9 * rnd(), 0, _t2); emit(dust, _t2.x, _t2.y, _t2.z, (rnd() - .5) * .15, -.18 - .2 * rnd(), (rnd() - .5) * .15, 1.6 + rnd(), .7, 1, .82); }
  }
  if (name === 'appear' && u >= .78 && lastU < .78) { P3(chest, 0, .1, 0, _t1); for (let i = 0; i < 140; i++) { const a = rnd() * TAU, b = rnd() * 2 - 1, sp = 1.2 + 2.2 * rnd(), q = Math.sqrt(1 - b * b); emit(sparks, _t1.x, _t1.y, _t1.z, Math.cos(a) * q * sp, b * sp, Math.sin(a) * q * sp, .7 + .6 * rnd(), .8, .95, .9); } }
  if (name === 'leave' && u > .2 && dt > 0) {
   sparkAcc += dt * 260 * win(u, .25, .95, .05);
   const bl = [head, chest, spine, hips, skA, skB, R.el, L.el, wings[0].fm, wings[1].fm, wings[0].hm, wings[1].hm];
   while (sparkAcc >= 1) { sparkAcc -= 1; const b = bl[(rnd() * bl.length) | 0]; P3(b, (rnd() - .5) * .3, (rnd() - .5) * .3, (rnd() - .5) * .2, _t1); emit(sparks, _t1.x, _t1.y, _t1.z, (rnd() - .5) * .6, .3 + .8 * rnd(), (rnd() - .5) * .6, 1.2 + rnd(), rnd() < .6 ? .85 : .7, rnd() < .5 ? .9 : 1, 1); }
  }
  stepP(motes, dt, .3, 0, .4, t); stepP(dust, dt, 1, -.15, .6, t); stepP(sparks, dt, 1.6, -.2, .5, t);
 }
 function animate(phase, walk, t, dt) {
  dt = dt > 0 ? Math.min(dt, .05) : 0;
  let u = 0, name = '';
  if (actv) { actv.t += dt; u = Math.min(1, actv.t / actv.def.dur); name = actv.name; if (u >= 1 && !actv.def.hold) actv = null; }
  if (actv) evalKeys(actv.def, u, TGT); else Object.assign(TGT, BASE);
  gW += ((gOn && !actv ? 1 : 0) - gW) * (1 - Math.exp(-dt * 7));
  if (gW > 1e-3) for (const k in GUARD) TGT[k] = lerp(TGT[k], GUARD[k], gW);
  const calm = actv ? .35 : 1;
  TGT.y += .045 * Math.sin(t * .9) * calm; TGT.lean += .015 * Math.sin(t * .9 + 1) * calm + .08 * walk; TGT.hy += .05 * Math.sin(t * .31) * calm; TGT.hr += .03 * Math.sin(t * .23) * calm;
  TGT.rs += .04 * Math.sin(t * .7) * calm; TGT.ls += .04 * Math.sin(t * .7 + 1.7) * calm; TGT.rc += .05 * Math.sin(t * .8) * calm; TGT.lc += .05 * Math.sin(t * .8 + 2) * calm;
  TGT.rf -= .12 * walk; TGT.lf -= .12 * walk;
  const pl = actv && actv.def.pulse; // a push of the hand with each moonbeam
  if (pl) for (const h of pl.at) { const k = Math.exp(-Math.pow((u - h + .012) / pl.w, 2)); TGT[pl.k] += pl.amt * k; TGT.glow += .3 * k; }
  const rate = actv ? actv.def.rate : 6, k = dt > 0 ? 1 - Math.exp(-dt * rate) : (inited ? 0 : 1);
  for (const q of KEYS) FIN[q] += (TGT[q] - FIN[q]) * k;
  inited = true;
  // turn toward the target when aiming
  { const lp = root.worldToLocal(_t1.set(state.target.x, state.target.y, state.target.z)); aimYaw = cl(Math.atan2(lp.x, lp.z), -1, 1); }
  applyPose(FIN, t);
  CLIP.constant = -(+state.floor || 0) + .003;
  root.updateMatrixWorld(true);
  // a teleport or a snap turn restarts the springs instead of whipping the hair through her
  { const yaw = root.rotation.y, d = Math.abs(Math.atan2(Math.sin(yaw - lastYaw), Math.cos(yaw - lastYaw))); if (d > .5 || root.position.distanceToSquared(lastPos) > 2.25) { physReset = true; velInit = false; } lastYaw = yaw; lastPos.copy(root.position); }
  // the skirt trails her motion
  const wp = _t2.setFromMatrixPosition(hips.matrixWorld);
  if (!velInit || dt <= 0) { if (!velInit) { prevW.copy(wp); vel.set(0, 0, 0); } velInit = true; }
  else { const kv = 1 - Math.exp(-dt / .15); vel.x += ((wp.x - prevW.x) / dt - vel.x) * kv; vel.y += ((wp.y - prevW.y) / dt - vel.y) * kv; vel.z += ((wp.z - prevW.z) / dt - vel.z) * kv; prevW.copy(wp); }
  if (dt > 0) {
   const yaw = root.rotation.y, cy = Math.cos(yaw), sy = Math.sin(yaw), lx = vel.x * cy - vel.z * sy, lz = vel.x * sy + vel.z * cy;
   const tx = cl(-lx * .12, -.35, .35), tz = cl(-lz * .12, -.35, .35);
   sway.vx += (40 * (tx - sway.x) - 5 * sway.vx) * dt; sway.vz += (40 * (tz - sway.z) - 5 * sway.vz) * dt; sway.x += sway.vx * dt; sway.z += sway.vz * dt;
  }
  physics(t, dt, cl(FIN.hf + Math.max(0, vel.y) * .08, 0, 1), physReset); physReset = false;
  const pres = cl(FIN.fade, 0, 1) * fadeE;
  applyFade(pres);
  U.time.value = t; U.rim.value = .26 + .1 * (FIN.glow * (+state.glow || 1) - 1);
  for (const [m, e] of CLOTH_EM) m.emissiveIntensity = e * (.85 + .2 * FIN.glow);
  updateFX(name, u, t, dt, pres);
  lastU = u;
 }
 const ACTIONS = {};
 for (const n of ['appear', 'embrace', 'charge', 'leave', 'hurt', 'block']) { const d = ACTS[n]; ACTIONS[n] = Object.freeze({ dur: d.dur, hits: d.hits.slice(), cues: d.cues.slice(), hold: d.hold, interrupt: d.interrupt }); }
 ACTIONS.release = Object.freeze({ dur: ACTS.release_l.dur, hits: ACTS.release_l.hits.slice(), cues: ACTS.release_l.cues.slice(), hold: false, interrupt: false });
 Object.freeze(ACTIONS);
 function anchor(name, out) {
  out = out || V3();
  switch (name) {
   case 'head': return P3(head, 0, HC.y, HC.z + .06, out);
   case 'hit': case 'hand': return out.copy(PALM[actv && actv.def.name === 'release_r' ? 0 : actv && actv.def.name === 'release_l' ? 1 : 0]);
   case 'handL': return out.copy(PALM[1]);
   case 'handR': return out.copy(PALM[0]);
   case 'orb': return out.copy(orbMesh.visible ? ORB : ORB_LAST);
   case 'crown': return P3(head, 0, HC.y + .32, HC.z - .166, out); // the crescent on top of her halo ring
   case 'wings': return P3(chest, 0, .08, -.25, out);
   case 'hem': return P3(hips, 0, -.95, 0, out);
   case 'sky': return out.set(state.target.x, 9.5, state.target.z);
   default: return P3(chest, 0, .06, .12, out);
  }
 }
 animate(0, 0, 0, 0);
 for (const A of arms) P3(A.wr, 0, -.075, 0, PALM[A.sx < 0 ? 0 : 1]); ORB_LAST.copy(PALM[0]).add(PALM[1]).multiplyScalar(.5);
 let tri = 0, draws = 0; const texs = new Set();
 root.traverse((o) => { if (o.isMesh) { draws++; tri += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; for (const k of ['map', 'emissiveMap']) if (o.material[k]) texs.add(o.material[k].image); } });
 return {
  root, fx, animate, play,
  guard(on) { gOn = !!on; },
  reset() { actv = null; gOn = false; gW = 0; if (FIN.fade < .02 || FIN.sink < -2.5) { FIN.sink = 0; FIN.fade = 1; FIN.dx = 0; FIN.y = 0; FIN.turn = 0; } },
  get busy() { return !!actv && !(actv.def.hold && actv.t >= actv.def.dur - 1e-6); },
  get action() { return actv ? actv.name : ''; },
  get progress() { return actv ? Math.min(1, actv.t / actv.def.dur) : -1; },
  get gone() { return FIN.fade < .02 || FIN.sink < -2.5; },
  setFade(f) { fadeE = cl(+f, 0, 1); },
  get dash() { return actv && actv.def.dash ? actv.def.dash(Math.min(1, actv.t / actv.def.dur)) : 0; },
  get lift() { return Math.max(0, HOVER + FIN.y + FIN.sink); },
  get state() { return state; }, set state(v) { if (v) Object.assign(state, v); },
  anchor, ACTIONS, moonTex: moonT,
  stats: { triangles: Math.round(tri), drawCalls: draws, textures: texs.size, bones: bones.length, height: 3.1 }
 };
}
