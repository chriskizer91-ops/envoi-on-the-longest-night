// gloamwing.js: the Gloamwing, a great night-flier of the marshes. three.js r128 (global THREE). Defines
// makeGloamwing(opts) only. About 3 m tall and 9 m from wingtip to wingtip: a heart-shaped barn owl's face, ivory with a
// brown rim, two huge black eyes ringed in gold, a small hooked beak and two feathered ear tufts; a deep chest and hunched
// shoulders in smoky grey-brown down; bat wings of long arm and finger bones whose thin smoke-brown membrane glows warm
// amber where light comes through it, ragged at its trailing edge, with a hooked claw at each wrist; strong grey legs
// with black talons and a fan of long tail plumes. Under its chest hangs a glowing sac like a small full moon, where the
// pale moths it has swallowed flutter: the souls on their way to the Moon that it hunts. Beaten, it lets them all go
// (from Chris's model and action sheets in `original/`, and art request 03).
// opts: { detail .5 to 1, size (an extra overall scale) }
function makeGloamwing(opts) {
 'use strict';
 // Units are meters, Y up, facing +Z, its feet on the ground at y = 0 when it stands. Its left side is +X.
 opts = opts || {};
 const DET = Math.max(.5, Math.min(1, opts.detail === undefined ? 1 : +opts.detail || 1));
 const Q = (n, m) => Math.max(m || 3, Math.round(n * DET));
 const TAU = Math.PI * 2, PI = Math.PI;
 let seed = 90211;
 const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
 const rr = (a, b) => a + (b - a) * rnd();
 // a second stream for the runtime (idle glances, effects), so the build's shapes never depend on what has played
 let seed2 = 3307;
 const rnd2 = () => (seed2 = (seed2 * 16807) % 2147483647) / 2147483647;
 const r2 = (a, b) => a + (b - a) * rnd2();
 const cl = (v, a, b) => (v < a ? a : v > b ? b : v);
 const sm = (a, b, x) => { const t = cl((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
 const lerp = (a, b, t) => a + (b - a) * t;
 const win = (u, a, b, e) => sm(a - e, a + e, u) * (1 - sm(b - e, b + e, u));
 const V3 = (x, y, z) => new THREE.Vector3(x || 0, y || 0, z || 0);
 const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h || w; return c; };
 const tex = (c, rep) => { const t = new THREE.CanvasTexture(c); if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t; };
 const SZ = opts.size > 0 ? +opts.size : 1;
 const root = new THREE.Group(), base = new THREE.Group(), fx = new THREE.Group();
 root.name = 'gloamwing'; root.add(base);
 const css = (r, g, b, a) => `rgba(${r | 0},${g | 0},${b | 0},${a === undefined ? 1 : a})`;

 // ---------- painted textures ----------
 // one feather, tip down: a rounded vane with a shaft and fine barbs, lighter at its tip, darker toward its base
 function feather(g, x, y, w, h, base, tip, a, ang, shaftA) {
  g.save(); g.translate(x, y); g.rotate(ang || 0);
  const q = g.createLinearGradient(0, -h * .5, 0, h * .5); q.addColorStop(0, css(base[0], base[1], base[2], a)); q.addColorStop(.6, css(lerp(base[0], tip[0], .5), lerp(base[1], tip[1], .5), lerp(base[2], tip[2], .5), a)); q.addColorStop(1, css(tip[0], tip[1], tip[2], a));
  g.fillStyle = q; g.beginPath(); g.moveTo(0, -h * .5); g.bezierCurveTo(w * .62, -h * .3, w * .55, h * .32, 0, h * .5); g.bezierCurveTo(-w * .55, h * .32, -w * .62, -h * .3, 0, -h * .5); g.fill();
  g.strokeStyle = css(tip[0] * .6, tip[1] * .6, tip[2] * .6, .35 * a); g.lineWidth = Math.max(.6, w * .015);
  for (let i = -6; i <= 6; i++) { if (!i) continue; const yy = -h * .3 + (i + 6) / 12 * h * .7; g.beginPath(); g.moveTo(0, yy); g.lineTo(Math.sign(i) * w * .42, yy + h * .12); g.stroke(); }
  g.strokeStyle = css(235, 225, 205, (shaftA === undefined ? .35 : shaftA) * a); g.lineWidth = Math.max(.8, w * .03); g.beginPath(); g.moveTo(0, -h * .5); g.lineTo(0, h * .42); g.stroke();
  g.restore();
 }
 // the body's down: rows of overlapping feathers, tips down; one picture for its colour and one for its relief
 const PLUME = (() => {
  const S = 256 * (DET < .75 ? 1 : 2), k = S / 512, c = cvs(S), g = c.getContext('2d'), b = cvs(S), gb = b.getContext('2d');
  g.fillStyle = '#3c3532'; g.fillRect(0, 0, S, S); gb.fillStyle = '#404040'; gb.fillRect(0, 0, S, S);
  const rows = 13, cols = 11, rh = S / rows, cw = S / cols;
  for (let j = -1; j <= rows; j++) for (let i = -1; i <= cols; i++) {
   const x = (i + (j % 2) * .5 + rr(-.15, .15)) * cw, y = (j + rr(-.1, .1)) * rh, t = rr(.82, 1.15);
   for (const [ox, oy] of [[0, 0], [S, 0], [-S, 0], [0, S], [0, -S]]) {
    feather(g, x + ox, y + oy + rh * .55, cw * 1.3, rh * 2.2, [56 * t, 50 * t, 47 * t], [116 * t, 103 * t, 94 * t], 1, rr(-.12, .12), .15);
    feather(gb, x + ox, y + oy + rh * .55, cw * 1.25, rh * 2.1, [70, 70, 70], [200, 200, 200], 1, 0, .1);
   }
  }
  // (softened once, so the down reads soft rather than as scales)
  const c2 = cvs(S), g2 = c2.getContext('2d'); g2.filter = 'blur(' + (S / 600).toFixed(2) + 'px)'; g2.drawImage(c, 0, 0); g.drawImage(c2, 0, 0);
  return { map: tex(c, 1), bump: tex(b, 1) };
 })();
 // feathers for the outline: a fluffy covert, a pointed contour feather, a long tail plume and a dark tuft feather, side
 // by side in one picture with clear edges (alpha-tested)
 const FEATH = (() => {
  const W = 512, H = 256, c = cvs(W, H), g = c.getContext('2d');
  // cell 0: a broad soft covert; 1: a pointed contour feather; 2: a long plume; 3: a narrow dark tuft feather
  feather(g, 64, 128, 110, 230, [66, 60, 57], [128, 116, 106], 1, 0, .2);
  feather(g, 192, 128, 80, 236, [62, 56, 53], [120, 108, 99], 1, 0, .2);
  // (wisps of barbs round the vanes' edges, so the outline reads soft and downy, not as a row of scales)
  for (const [cx, w, c] of [[64, 110, [118, 107, 98]], [192, 80, [112, 101, 93]]]) {
   g.strokeStyle = css(c[0], c[1], c[2], 1); g.lineWidth = 1.6;
   for (let i = 0; i < 70; i++) { const t = rr(-.35, 1), yy = 128 + t * 112, half = w * .5 * Math.sqrt(Math.max(0, 1 - t * t)) * .95, sd = rnd() < .5 ? -1 : 1, x0 = cx + sd * half * rr(.7, .95); g.beginPath(); g.moveTo(x0, yy); g.lineTo(x0 + sd * rr(3, 9), yy + rr(4, 12)); g.stroke(); }
  }
  const pl = g.createLinearGradient(0, 8, 0, 248); pl.addColorStop(0, '#5a514a'); pl.addColorStop(.45, '#8c7d6e'); pl.addColorStop(.8, '#c2ae96'); pl.addColorStop(1, '#ddd0b8');
  g.save(); g.translate(320, 128); g.fillStyle = pl; g.beginPath(); g.moveTo(0, -122); g.bezierCurveTo(44, -80, 46, 90, 6, 124); g.lineTo(-6, 124); g.bezierCurveTo(-46, 90, -44, -80, 0, -122); g.fill();
  g.strokeStyle = 'rgba(70,58,48,.45)'; g.lineWidth = 1.2; for (let i = 0; i < 26; i++) { const y = -100 + i * 8.5; g.beginPath(); g.moveTo(0, y); g.lineTo(-40 + Math.abs(y) * .05, y + 16); g.moveTo(0, y); g.lineTo(40 - Math.abs(y) * .05, y + 16); g.stroke(); }
  g.strokeStyle = 'rgba(230,218,196,.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -122); g.lineTo(0, 118); g.stroke(); g.restore();
  // (ragged gaps in the plume's vane)
  g.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 9; i++) { const y = rr(-60, 110) + 128, s = rnd() < .5 ? -1 : 1; g.beginPath(); g.moveTo(320 + s * 46, y); g.lineTo(320 + s * rr(8, 20), y + rr(4, 10)); g.lineTo(320 + s * 46, y + rr(10, 22)); g.fill(); }
  g.globalCompositeOperation = 'source-over';
  feather(g, 448, 128, 54, 240, [34, 30, 28], [86, 76, 70], 1, 0, .2);
  return tex(c);
 })();
 // the face's disc: ivory, softly greyer toward its edge, fine streaks running out from the eyes
 const FACE = (() => {
  const S = 256, c = cvs(S), g = c.getContext('2d'), m = S / 2;
  const q = g.createRadialGradient(m, m * .9, 8, m, m, m); q.addColorStop(0, '#f6f1e8'); q.addColorStop(.6, '#ece4d6'); q.addColorStop(.88, '#d6cab8'); q.addColorStop(1, '#a89684');
  g.fillStyle = q; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 420; i++) { const a = rnd() * TAU, r0 = rr(.12, .5) * m, r1 = r0 + rr(.08, .2) * m; g.strokeStyle = `rgba(160,142,122,${rr(.05, .14).toFixed(2)})`; g.lineWidth = 1; g.beginPath(); g.moveTo(m + Math.cos(a) * r0, m * .95 + Math.sin(a) * r0); g.lineTo(m + Math.cos(a) * r1, m * .95 + Math.sin(a) * r1); g.stroke(); }
  return tex(c);
 })();
 // the eye: nearly all black pupil, a thin ring of gold, and wet highlights
 const EYE = (() => {
  const S = 128, c = cvs(S), g = c.getContext('2d'), m = S / 2;
  g.fillStyle = '#120c06'; g.fillRect(0, 0, S, S);
  const q = g.createRadialGradient(m, m, 30, m, m, 62); q.addColorStop(0, '#5a3a10'); q.addColorStop(.6, '#7a5214'); q.addColorStop(.78, '#c8902e'); q.addColorStop(.9, '#8a5a18'); q.addColorStop(1, '#1a1006');
  g.fillStyle = q; g.beginPath(); g.arc(m, m, 60, 0, TAU); g.fill();
  g.fillStyle = '#030202'; g.beginPath(); g.arc(m, m, 50, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255,255,255,.92)'; g.beginPath(); g.ellipse(m - 16, m - 18, 11, 8, -.6, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.arc(m + 16, m + 14, 5, 0, TAU); g.fill();
  return tex(c);
 })();
 // the wing's membrane: thin skin, warm and paler between the veins, the veins darker and branching out from the bones,
 // its trailing edge torn and a few holes worn through (alpha)
 const SKIN = (() => {
  const W = 512, H = 512, c = cvs(W, H), g = c.getContext('2d');
  const q = g.createLinearGradient(0, 0, 0, H); q.addColorStop(0, '#5a4638'); q.addColorStop(.05, '#8a6c50'); q.addColorStop(.18, '#ad8a62'); q.addColorStop(.6, '#c6a175'); q.addColorStop(.9, '#b4967a'); q.addColorStop(1, '#9a8270');
  g.fillStyle = q; g.fillRect(0, 0, W, H);
  // mottling
  for (let i = 0; i < 380; i++) { const x = rnd() * W, y = rnd() * H, r = rr(6, 30); const m = g.createRadialGradient(x, y, 0, x, y, r); m.addColorStop(0, `rgba(${rnd() < .5 ? '90,64,40' : '220,190,140'},${rr(.05, .12).toFixed(2)})`); m.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = m; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
  // veins: from each bone (the patch's sides, u = 0 and 1 in each quarter) branching into the skin
  g.lineCap = 'round';
  const vein = (x, y, a, len, w, d) => {
   for (let s = 0; s < len; s += 6) {
    const nx = x + Math.cos(a) * 6, ny = y + Math.sin(a) * 6;
    g.strokeStyle = `rgba(84,60,40,${(.5 * (1 - s / len)).toFixed(2)})`; g.lineWidth = w * (1 - s / len) + .5; g.beginPath(); g.moveTo(x, y); g.lineTo(nx, ny); g.stroke();
    x = nx; y = ny; a += rr(-.25, .25);
    if (d < 3 && rnd() < .06) vein(x, y, a + (rnd() < .5 ? -1 : 1) * rr(.4, .9), len * .5, w * .6, d + 1);
   }
  };
  for (let k = 0; k < 4; k++) {
   const x0 = k * W / 4;
   for (let i = 0; i < 14; i++) { vein(x0 + 2, rr(10, H * .9), rr(-.2, .5), rr(40, 120), 2, 0); vein(x0 + W / 4 - 2, rr(10, H * .9), PI + rr(-.5, .2), rr(40, 120), 2, 0); }
   for (let i = 0; i < 4; i++) vein(x0 + rr(.3, .7) * W / 4, 4, PI / 2 + rr(-.3, .3), rr(120, 260), 1.6, 1);
  }
  // the torn trailing edge and the holes: cut out of the alpha
  g.globalCompositeOperation = 'destination-out';
  g.beginPath(); g.moveTo(0, H); let x = 0;
  while (x < W) { const nx = x + rr(4, 16); g.lineTo(nx, H - rr(4, 30) - (rnd() < .12 ? rr(20, 60) : 0)); x = nx; }
  g.lineTo(W, H); g.closePath(); g.fill();
  for (let i = 0; i < 26; i++) { const hx = rnd() * W, hy = H * rr(.55, .95), r = rr(3, 12); g.beginPath(); for (let a = 0; a < 7; a++) { const ang = a / 7 * TAU, rq = r * rr(.5, 1.3); a ? g.lineTo(hx + Math.cos(ang) * rq, hy + Math.sin(ang) * rq) : g.moveTo(hx + Math.cos(ang) * rq, hy + Math.sin(ang) * rq); } g.closePath(); g.fill(); }
  g.globalCompositeOperation = 'source-over';
  return tex(c);
 })();
 // the folded wing: as on the sheet's "wing folded", its outside looks like layers of long dark feathers with tan edges,
 // lying along the fingers, tips toward the trailing edge (mapped four times across the wing, once per stretch of skin)
 const WINGF = (() => {
  const S = 256 * (DET < .75 ? 1 : 2), k = S / 512, c = cvs(S), g = c.getContext('2d');
  g.fillStyle = '#3a312b'; g.fillRect(0, 0, S, S);
  const rows = 5, cols = 4, rh = S / rows, cw = S / cols;
  for (let j = -1; j <= rows; j++) for (let i = -1; i <= cols; i++) {
   const x = (i + .5 + (j % 2) * .5 + rr(-.1, .1)) * cw, y = (j + .2 + rr(-.08, .08)) * rh, t = rr(.85, 1.15);
   for (const ox of [0, S, -S]) for (const oy of [0, S, -S]) feather(g, x + ox, y + oy + rh * .6, cw * 1.15, rh * 1.9, [52 * t, 44 * t, 38 * t], [150 * t, 126 * t, 100 * t], 1, rr(-.06, .06), .35);
  }
  return tex(c, 1);
 })();
 // the legs' scales: grey-brown plates in rings down the leg
 const SCALE = (() => {
  const S = 128, c = cvs(S), g = c.getContext('2d');
  g.fillStyle = '#4a4440'; g.fillRect(0, 0, S, S);
  for (let j = 0; j < 8; j++) for (let i = 0; i < 6; i++) { const x = (i + (j % 2) * .5) * S / 6, y = j * S / 8, t = rr(.85, 1.15); g.fillStyle = css(118 * t, 108 * t, 100 * t); g.beginPath(); g.ellipse(x, y + S / 16, S / 13, S / 19, 0, 0, TAU); g.fill(); g.fillStyle = css(150 * t, 140 * t, 130 * t, .5); g.beginPath(); g.ellipse(x - 2, y + S / 22, S / 22, S / 40, 0, 0, TAU); g.fill(); }
  return tex(c, 1);
 })();
 // the moon-sac's skin: a pale full moon, its seas grey, a few bright craters
 const MOON = (() => {
  const S = 256, c = cvs(S), g = c.getContext('2d');
  g.fillStyle = '#f1e9da'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 9; i++) { const x = rnd() * S, y = rr(.2, .8) * S, r = rr(18, 46), m = g.createRadialGradient(x, y, 0, x, y, r); m.addColorStop(0, 'rgba(158,146,130,.6)'); m.addColorStop(.7, 'rgba(170,158,142,.38)'); m.addColorStop(1, 'rgba(180,170,156,0)'); g.fillStyle = m; g.fillRect(0, 0, S, S); }
  for (let i = 0; i < 40; i++) { const x = rnd() * S, y = rnd() * S, r = rr(2, 7); g.strokeStyle = 'rgba(128,116,102,.4)'; g.lineWidth = 1; g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke(); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(x - r * .3, y - r * .3, r * .5, 0, TAU); g.fill(); }
  return tex(c, 1);
 })();
 // sprites: a moth (wings open, pale and glowing; and the dark one inside the sac), a soft dot, a dust puff, a falling
 // feather, a streak of wind
 function mothPic(fill, glow) {
  const S = 64, c = cvs(S), g = c.getContext('2d'), m = S / 2;
  if (glow) { const q = g.createRadialGradient(m, m, 0, m, m, m); q.addColorStop(0, 'rgba(255,250,230,.55)'); q.addColorStop(1, 'rgba(255,250,230,0)'); g.fillStyle = q; g.fillRect(0, 0, S, S); }
  g.fillStyle = fill;
  for (const s of [1, -1]) {
   g.beginPath(); g.moveTo(m, m - 2); g.bezierCurveTo(m + s * 10, m - 22, m + s * 28, m - 20, m + s * 26, m - 6); g.bezierCurveTo(m + s * 24, m + 2, m + s * 12, m + 2, m, m + 2); g.fill();
   g.beginPath(); g.moveTo(m, m + 1); g.bezierCurveTo(m + s * 14, m + 4, m + s * 20, m + 16, m + s * 12, m + 20); g.bezierCurveTo(m + s * 6, m + 22, m + s * 2, m + 12, m, m + 4); g.fill();
  }
  g.fillRect(m - 1.5, m - 8, 3, 18);
  g.strokeStyle = fill; g.lineWidth = 1; g.beginPath(); g.moveTo(m, m - 8); g.quadraticCurveTo(m - 3, m - 14, m - 6, m - 16); g.moveTo(m, m - 8); g.quadraticCurveTo(m + 3, m - 14, m + 6, m - 16); g.stroke();
  return tex(c);
 }
 const mothT = mothPic('rgba(255,252,236,.95)', true), mothDarkT = mothPic('rgba(92,84,78,.8)', false);
 function radial(stops, s) { const c = cvs(s), g = c.getContext('2d'), h = s / 2, q = g.createRadialGradient(h, h, 0, h, h, h); for (const [o, col] of stops) q.addColorStop(o, col); g.fillStyle = q; g.fillRect(0, 0, s, s); return tex(c); }
 const dotT = radial([[0, 'rgba(255,255,255,1)'], [.25, 'rgba(255,255,255,.7)'], [1, 'rgba(255,255,255,0)']], 64);
 const haloT = radial([[0, 'rgba(255,255,255,.9)'], [.2, 'rgba(255,255,255,.5)'], [.55, 'rgba(255,255,255,.12)'], [1, 'rgba(255,255,255,0)']], 128);
 const puffT = (() => { const c = cvs(128), g = c.getContext('2d'); for (let i = 0; i < 26; i++) { const x = 36 + rnd() * 56, y = 36 + rnd() * 56, r = 12 + rnd() * 24, q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, 'rgba(255,255,255,.26)'); q.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = q; g.fillRect(0, 0, 128, 128); } const m = g.createRadialGradient(64, 64, 28, 64, 64, 63); m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)'); g.globalCompositeOperation = 'destination-in'; g.fillStyle = m; g.fillRect(0, 0, 128, 128); return tex(c); })();
 const featherT = (() => { const c = cvs(64), g = c.getContext('2d'); feather(g, 32, 32, 22, 58, [90, 78, 66], [196, 182, 160], 1, .4, .5); return tex(c); })();
 const streakT = (() => { const c = cvs(128, 32), g = c.getContext('2d'), q = g.createLinearGradient(0, 0, 128, 0); q.addColorStop(0, 'rgba(255,255,255,0)'); q.addColorStop(.7, 'rgba(255,255,255,.8)'); q.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = q; g.beginPath(); g.ellipse(64, 16, 62, 4, 0, 0, TAU); g.fill(); return tex(c); })();

 // ---------- materials ----------
 // Shared uniforms: time, a dissolve with a pale glowing edge (uDis), a cool rim of moonlight, how brightly its wings'
 // skin glows where light comes through (uSkin), its eyes' shine, and the moon-sac's glow on its own chest and belly
 // (uSac: x its strength; the sac's centre in uSacP, carried by the sac's bone).
 const U = {
  time: { value: 0 }, dis: { value: 0 }, disCol: { value: new THREE.Color(.85, .9, 1) }, rim: { value: .3 }, rimC: { value: new THREE.Color(0x8c8ab8) },
  skin: { value: 1 }, eye: { value: 1 }, sac: { value: 1 }, sacP: { value: V3() }, sacC: { value: new THREE.Color(1, .9, .74) }, fold: { value: 0 }, wf: { value: null }
 };
 const NOISE = 'float gwH(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}\n' +
  'float gwN(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(gwH(i),gwH(i+vec3(1,0,0)),f.x),mix(gwH(i+vec3(0,1,0)),gwH(i+vec3(1,1,0)),f.x),f.y),mix(mix(gwH(i+vec3(0,0,1)),gwH(i+vec3(1,0,1)),f.x),mix(gwH(i+vec3(0,1,1)),gwH(i+vec3(1,1,1)),f.x),f.y),f.z);}\n';
 // kind: 'plume' (its down), 'card' (outline feathers), 'skin' (the wings' membrane), 'eye', 'hard' (beak, talons, bones)
 function patch(m, kind) {
  m.onBeforeCompile = (sh) => {
   Object.assign(sh.uniforms, { uTime: U.time, uDis: U.dis, uDisCol: U.disCol, uRim: U.rim, uRimC: U.rimC, uSkin: U.skin, uEye: U.eye, uSac: U.sac, uSacP: U.sacP, uSacC: U.sacC, uFold: U.fold, uWF: U.wf });
   let vs = sh.vertexShader, fs = sh.fragmentShader;
   const vary = 'varying vec3 vDP;\nvarying vec3 vWP;\n';
   vs = vary + vs;
   vs = vs.replace('#include <begin_vertex>', '#include <begin_vertex>\n vDP = position;');
   vs = vs.replace('#include <project_vertex>', '#include <project_vertex>\n vWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
   fs = vary + 'uniform float uTime, uDis, uRim, uSkin, uEye, uSac, uFold;\nuniform vec3 uDisCol, uRimC, uSacP, uSacC;\n' + (kind === 'skin' ? 'uniform sampler2D uWF;\n' : '') + NOISE + fs;
   fs = fs.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n float gwE = 0.0, gwNz = .7 * gwN(vDP * 8.) + .3 * gwN(vDP * 21.);\n' +
    ' if (uDis > 0.0) { float th = uDis * 1.1 - .05; if (gwNz < th) discard; gwE = 1. - smoothstep(0., .06, gwNz - th); }\n');
   fs = fs.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += uDisCol * gwE * 1.5;\n' +
    // the moon-sac lights what is close to it, softly, through the down
    (kind === 'plume' || kind === 'card' ? ' { float d = length(vWP - uSacP); totalEmissiveRadiance += uSacC * diffuseColor.rgb * uSac * .55 / (1. + d * d * 9.); }\n' : ''));
   if (kind === 'skin') {
    // thin skin: from below and in front it glows warm amber where light comes through, brightest between the veins; seen
    // from above (its back) it is a darker, browner hide
    // folded (uFold), both sides take on the look of the folded wing's feathers and stop glowing
    fs = fs.replace('#include <color_fragment>', '#include <color_fragment>\n if (!gl_FrontFacing) diffuseColor.rgb *= vec3(.7, .64, .58);\n' +
     ' float gwF = gl_FrontFacing ? uFold : min(1., uFold * 1.15 + .12); diffuseColor.rgb = mix(diffuseColor.rgb, texture2D(uWF, vUv * vec2(4., 1.)).rgb, gwF);');
    fs = fs.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n { float l = dot(diffuseColor.rgb, vec3(.3, .59, .11)); float th = smoothstep(.25, .7, l);\n' +
     '  totalEmissiveRadiance += vec3(1., .8, .56) * diffuseColor.rgb * uSkin * (gl_FrontFacing ? .6 : .3) * (.3 + .8 * th) * (1. - gwF); }');
   }
   if (kind === 'eye') fs = fs.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance *= uEye;');
   fs = fs.replace('#include <dithering_fragment>', ' gl_FragColor.rgb += uRimC * (uRim * pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 2.6));\n#include <dithering_fragment>');
   sh.vertexShader = vs; sh.fragmentShader = fs;
  };
  m.customProgramCacheKey = () => 'gloamwing-' + kind;
  return m;
 }
 const std = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: .8, metalness: 0, skinning: true }, o));
 const ADD = { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false };
 const M = {
  plume: patch(std({ map: PLUME.map, bumpMap: PLUME.bump, bumpScale: .03, vertexColors: true, roughness: .9 }), 'plume'),
  card: patch(std({ map: FEATH, vertexColors: true, alphaTest: .5, side: THREE.DoubleSide, roughness: .9 }), 'card'),
  face: patch(std({ map: FACE, vertexColors: true, roughness: .85 }), 'plume'),
  eye: patch(std({ map: EYE, emissiveMap: EYE, emissive: 0xffc060, emissiveIntensity: .18, roughness: .06, metalness: .1 }), 'eye'),
  hard: patch(std({ vertexColors: true, roughness: .32, metalness: .05 }), 'hard'),
  leg: patch(std({ map: SCALE, vertexColors: true, roughness: .62 }), 'hard'),
  skin: patch(std({ map: SKIN, alphaTest: .5, side: THREE.DoubleSide, roughness: .75, emissive: 0x000000 }), 'skin')
 };
 U.wf.value = WINGF;

 // ---------- its shape ----------
 // The body and head are one surface lofted up its height: a round belly, a deep chest, a big round head on a short thick
 // neck. Up it (y): the half-width, how far it reaches in front of its middle and behind it, and where its middle is
 // (it leans forward), from the sheet's front and side views.
 const PY = [.86, .95, 1.1, 1.3, 1.5, 1.7, 1.86, 1.94, 2.0, 2.1, 2.22, 2.35, 2.48, 2.56, 2.62];
 const PW = [0, .22, .32, .37, .39, .385, .36, .32, .31, .33, .34, .335, .3, .21, 0];
 const PF = [0, .2, .28, .32, .33, .33, .32, .28, .28, .3, .3, .29, .25, .17, 0];
 const PB = [0, .3, .42, .47, .47, .45, .41, .35, .32, .36, .38, .36, .3, .2, 0];
 const PZ = [-.1, -.09, -.06, -.02, .03, .08, .14, .2, .23, .29, .31, .32, .32, .31, .3];
 function prof(T, y) {
  let i = 0; while (i < PY.length - 2 && y > PY[i + 1]) i++;
  const y0 = PY[i], y1 = PY[i + 1], t = cl((y - y0) / (y1 - y0), 0, 1);
  const sl = (k) => (k <= 0 ? (T[1] - T[0]) / (PY[1] - PY[0]) : k >= PY.length - 1 ? (T[k] - T[k - 1]) / (PY[k] - PY[k - 1]) : (T[k + 1] - T[k - 1]) / (PY[k + 1] - PY[k - 1]));
  const h = y1 - y0, m0 = sl(i) * h, m1 = sl(i + 1) * h, t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * T[i] + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * T[i + 1] + (t3 - t2) * m1;
 }
 const YB = PY[0], YT = PY[PY.length - 1];
 // a point on its surface: phi runs round from the front (0) over its left side (.25), its back (.5) and its right (.75)
 function surfP(y, phi, out) {
  const th = phi * TAU, s = Math.sin(th), c = Math.cos(th), fr = c >= 0, ex = 2 / 2.2;
  const x = Math.max(0, prof(PW, y)) * Math.sign(s) * Math.pow(Math.abs(s), ex), z = Math.max(0, fr ? prof(PF, y) : prof(PB, y)) * Math.sign(c) * Math.pow(Math.abs(c), ex);
  return out.set(x, y, prof(PZ, y) + z);
 }

 // ---------- skeleton ----------
 // ground (stays put), fly (at its hips: it rises, hovers and leans on it), the chest, neck and head (with its beak, its
 // eyelids and its sac), two wings of shoulder, elbow, wrist and four two-jointed fingers, two legs of thigh, shank, foot
 // and toes, and its tail.
 const bones = [], BI = {};
 function bone(name, parent, x, y, z, order) { const b = new THREE.Bone(); b.name = name; b.position.set(x, y, z); if (order) b.rotation.order = order; parent.add(b); BI[name] = bones.length; bones.push(b); return b; }
 const W0 = { fly: V3(0, 1.0, 0), chest: V3(0, 1.62, .14), neck: V3(0, 1.98, .25), head: V3(0, 2.22, .31) }; // bind positions
 const ground = bone('ground', base, 0, 0, 0), fly = bone('fly', ground, W0.fly.x, W0.fly.y, W0.fly.z, 'YXZ');
 const chest = bone('chest', fly, 0, W0.chest.y - W0.fly.y, W0.chest.z - W0.fly.z, 'YXZ');
 const neck = bone('neck', chest, 0, W0.neck.y - W0.chest.y, W0.neck.z - W0.chest.z, 'YXZ'), head = bone('head', neck, 0, W0.head.y - W0.neck.y, W0.head.z - W0.neck.z, 'YXZ');
 const FACEZ = .615, BEAKP = V3(0, 2.135, .6), beak = bone('beak', head, BEAKP.x, BEAKP.y - W0.head.y, BEAKP.z - W0.head.z, 'XYZ');
 const EYEP = [V3(.112, 2.27, .565), V3(-.112, 2.27, .565)], EYEG = [V3(.18, .02, 1).normalize(), V3(-.18, .02, 1).normalize()], EYER = .08;
 const lids = EYEP.map((p, i) => bone('lid' + i, head, p.x, p.y - W0.head.y, p.z - W0.head.z));
 const SACP = V3(0, 1.36, .33), SACR = .27, sacB = bone('sac', chest, SACP.x, SACP.y - W0.chest.y, SACP.z - W0.chest.z);
 const tail = bone('tail', fly, 0, -.05, -.28, 'YXZ'), tail2 = bone('tail2', tail, 0, -.13, -.34, 'YXZ');
 // the wings, spread flat in the bind pose: the arm out to the side, the fingers fanned back from the wrist
 const FA = [.21, .7, 1.19, 1.71], FL = [1.9, 2.0, 2.1, 2.2], PROX = .55;
 const WINGS = [1, -1].map((s) => {
  const n = s > 0 ? 'l' : 'r', S = V3(s * .3, 2.08, .1), E = V3(s * .95, 2.08, .1), Wr = V3(s * 2.2, 2.08, .1);
  const sh = bone(n + 'sh', chest, S.x, S.y - W0.chest.y, S.z - W0.chest.z, 'YZX'), el = bone(n + 'el', sh, E.x - S.x, 0, 0, 'YZX'), wr = bone(n + 'wr', el, Wr.x - E.x, 0, 0, 'XYZ');
  const F = FA.map((a, k) => {
   const d = V3(s * Math.cos(a), 0, -Math.sin(a)), A = bone(n + 'f' + k + 'a', wr, 0, 0, 0, 'XYZ'), B = bone(n + 'f' + k + 'b', A, d.x * FL[k] * PROX, 0, d.z * FL[k] * PROX, 'XYZ');
   return { a, d, len: FL[k], A, B, tip: Wr.clone().addScaledVector(d, FL[k]) };
  });
  return { s, n, S, E, W: Wr, sh, el, wr, F };
 });
 // the legs: the hip, the hock (the joint that bends backward), the ankle, and where the toes spread
 const LEGS = [1, -1].map((s) => {
  const n = s > 0 ? 'l' : 'r', P = [V3(s * .17, 1.0, .02), V3(s * .21, .62, -.06), V3(s * .24, .1, .06), V3(s * .25, .05, .14)];
  const b0 = bone(n + 'thigh', fly, P[0].x - W0.fly.x, P[0].y - W0.fly.y, P[0].z - W0.fly.z), b1 = bone(n + 'shank', b0, P[1].x - P[0].x, P[1].y - P[0].y, P[1].z - P[0].z);
  const b2 = bone(n + 'foot', b1, P[2].x - P[1].x, P[2].y - P[1].y, P[2].z - P[1].z), b3 = bone(n + 'toes', b2, P[3].x - P[2].x, P[3].y - P[2].y, P[3].z - P[2].z);
  return { s, n, P, b: [b0, b1, b2, b3], l1: P[0].distanceTo(P[1]), l2: P[1].distanceTo(P[2]), bd0: P[1].clone().sub(P[0]).normalize(), bd1: P[2].clone().sub(P[1]).normalize(), pole: V3(0, 0, -1) };
 });
 root.updateMatrixWorld(true);

 // ---------- geometry helpers ----------
 const BK = new Map(); // material -> geometries to merge into one skinned mesh
 const put = (mat, g) => { let l = BK.get(mat); if (!l) BK.set(mat, (l = [])); l.push(g); return g; };
 function geo(pos, idx, uv) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); if (uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return g; }
 function attr(g, name, size, fn) { const n = g.attributes.position.count, a = new Float32Array(n * size), o = new Array(size); for (let i = 0; i < n; i++) { fn(i, o); for (let k = 0; k < size; k++) a[i * size + k] = o[k]; } g.setAttribute(name, new THREE.BufferAttribute(a, size)); return g; }
 function skinW(g, fn) {
  const p = g.attributes.position, n = p.count, si = new Float32Array(n * 4), sw = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
   let inf = fn(p.getX(i), p.getY(i), p.getZ(i), i).filter((e) => e[1] > 1e-4).sort((a, b) => b[1] - a[1]).slice(0, 4);
   if (!inf.length) inf = [[BI.fly, 1]];
   let tot = 0; for (const e of inf) tot += e[1];
   inf.forEach((e, k) => { si[i * 4 + k] = e[0]; sw[i * 4 + k] = e[1] / tot; });
  }
  g.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4)); return g;
 }
 const rigid = (g, b) => skinW(g, () => [[BI[b.name], 1]]);
 function mergeAll(list) {
  const names = new Set(); let nv = 0, ni = 0;
  for (const g of list) { if (!g.attributes.normal) g.computeVertexNormals(); for (const k in g.attributes) names.add(k); nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
  const out = new THREE.BufferGeometry();
  for (const k of names) {
   const size = list.find((g) => g.attributes[k]).attributes[k].itemSize, arr = new Float32Array(nv * size); let vo = 0;
   for (const g of list) {
    const c = g.attributes.position.count, a = g.attributes[k];
    if (a) arr.set(a.array, vo * size);
    else if (k === 'color') arr.fill(1, vo * size, (vo + c) * size);
    else if (k === 'skinWeight') for (let i = 0; i < c; i++) arr[(vo + i) * 4] = 1;
    vo += c;
   }
   out.setAttribute(k, new THREE.BufferAttribute(arr, size));
  }
  const I = new Uint32Array(ni); let vo = 0, io = 0;
  for (const g of list) { const c = g.attributes.position.count; if (g.index) { const a = g.index.array; for (let k = 0; k < a.length; k++) I[io + k] = a[k] + vo; io += a.length; } else { for (let k = 0; k < c; k++) I[io + k] = vo + k; io += c; } vo += c; }
  out.setIndex(new THREE.BufferAttribute(I, 1)); out.computeBoundingSphere(); return out;
 }
 // make a geometry face a way (flip its winding if the normal at vertex k disagrees with dir)
 function face(g, dir, k) { const n = g.attributes.normal, p = g.attributes.position; k = k || 0; const d = dir(p.getX(k), p.getY(k), p.getZ(k)); if (n.getX(k) * d.x + n.getY(k) * d.y + n.getZ(k) * d.z < 0) { const ix = g.index.array; for (let i = 0; i < ix.length; i += 3) { const t = ix[i]; ix[i] = ix[i + 1]; ix[i + 1] = t; } g.computeVertexNormals(); } return g; }
 // a tube along a curve, its frames carried along without twisting; rFn(t, angle) its radius
 function ptTube(pts, segs, rs, rFn, uK) {
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal'), P = [], T = [], N = [], n = V3(0, 1, 0), ax = V3();
  for (let i = 0; i <= segs; i++) { const t = i / segs; P.push(curve.getPoint(t)); T.push(curve.getTangent(t).normalize()); }
  if (Math.abs(n.dot(T[0])) > .9) n.set(1, 0, 0);
  n.addScaledVector(T[0], -n.dot(T[0])).normalize(); N.push(n.clone());
  for (let i = 1; i <= segs; i++) { ax.crossVectors(T[i - 1], T[i]); const s = ax.length(); if (s > 1e-6) n.applyAxisAngle(ax.normalize(), Math.asin(cl(s, -1, 1))); n.addScaledVector(T[i], -n.dot(T[i])).normalize(); N.push(n.clone()); }
  const pos = [], uv = [], idx = [], D = V3(), Bn = V3(); let arc = 0;
  uK = uK || [1, 1];
  for (let i = 0; i <= segs; i++) {
   if (i) arc += P[i].distanceTo(P[i - 1]);
   Bn.crossVectors(T[i], N[i]);
   for (let j = 0; j <= rs; j++) { const th = j / rs * TAU; D.copy(N[i]).multiplyScalar(Math.cos(th)).addScaledVector(Bn, Math.sin(th)); const r = rFn(i / segs, th); pos.push(P[i].x + D.x * r, P[i].y + D.y * r, P[i].z + D.z * r); uv.push(j / rs * uK[0], arc * uK[1]); }
  }
  for (let i = 0; i < segs; i++) for (let j = 0; j < rs; j++) { const a = i * (rs + 1) + j, b = a + rs + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  const g = geo(pos, idx, uv); g.computeVertexNormals();
  const nn = g.attributes.normal, _n = V3();
  for (let i = 0; i <= segs; i++) { const a = i * (rs + 1), b = a + rs; _n.set(nn.getX(a) + nn.getX(b), nn.getY(a) + nn.getY(b), nn.getZ(a) + nn.getZ(b)).normalize(); nn.setXYZ(a, _n.x, _n.y, _n.z); nn.setXYZ(b, _n.x, _n.y, _n.z); }
  return g;
 }
 // its body's share between the hips, chest, neck and head, by height (blended across each joint)
 const CHB = [fly, chest, neck, head], CHY = [1.36, 1.92, 2.08];
 function bodyW(y, out, k) {
  out = out || []; k = k === undefined ? 1 : k; let prev = 0;
  for (let j = 0; j <= CHY.length; j++) { const F = j < CHY.length ? sm(CHY[j] + .13, CHY[j] - .13, y) : 1, w = F - prev; prev = F; if (w > 1e-4) out.push([BI[CHB[j].name], w * k]); }
  return out;
 }

 // ---------- the body and head: one surface from under its tail to the top of its head ----------
 {
  const NR = Math.max(40, Math.round(96 * DET / 2) * 2), NY = Q(128, 56), pos = [], uv = [], col = [], idx = [], P = V3();
  for (let i = 0; i <= NY; i++) {
   const y = lerp(YB, YT, i / NY);
   for (let j = 0; j <= NR; j++) {
    const phi = j / NR; surfP(y, phi, P); pos.push(P.x, P.y, P.z); uv.push(phi * 3, (y - YB) * 1.6);
    // darker smoky brown down its back and on its crown, paler fawn on its breast and belly
    const fr = Math.cos(phi * TAU), k = lerp(.74, 1.0, sm(-.3, .85, fr)) * (1 + .3 * sm(1.65, 1.9, y) * sm(.5, .9, fr) * sm(2.1, 1.95, y)) * lerp(1, .82, sm(2.2, 2.5, y) * sm(.2, -.4, fr));
    col.push(k * (fr > 0 ? 1.05 : .98), k, k * (fr > 0 ? .93 : 1.0));
   }
  }
  for (let i = 0; i < NY; i++) for (let j = 0; j < NR; j++) { const a = i * (NR + 1) + j, b = a + 1, c = a + NR + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = geo(pos, idx, uv); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals();
  face(g, (x, y, z) => V3(x, 0, z - prof(PZ, y)).normalize(), Math.round(NY / 2) * (NR + 1) + Math.round(NR / 4));
  skinW(g, (x, y) => bodyW(y)); put(M.plume, g);
 }

 // ---------- the face: a heart-shaped disc, ivory in a rim of brown, dished round two huge eyes ----------
 const FACEC = V3(0, 2.23, FACEZ), FW = .53, FH = .6;
 const heart = (t, out) => { const s = Math.sin(t), x = 16 * s * s * s, y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t); return out.set(x / 32 * FW, (y + 2.5) / 29 * FH, 0); };
 const faceZ = (x, y, r) => FACEC.z - .03 * Math.sin(PI * Math.min(1, r)) - .8 * x * x - .2 * Math.max(0, y) * Math.max(0, y) + .01 * (1 - r);
 {
  const NT = Q(64, 32), NRg = Q(10, 6), pos = [], uv = [], col = [], idx = [], O = V3();
  for (let i = 0; i <= NRg; i++) for (let j = 0; j <= NT; j++) {
   const r = i / NRg, t = j / NT * TAU; heart(t, O); const x = O.x * r, y = O.y * r;
   pos.push(x, FACEC.y + y, faceZ(x, y, r)); uv.push(.5 + x / FW * .9, .5 + y / FH * .9);
   const k = r > .86 ? lerp(1, .5, sm(.86, 1, r)) : 1; col.push(k, k * .97, k * .93);
  }
  for (let i = 0; i < NRg; i++) for (let j = 0; j < NT; j++) { const a = i * (NT + 1) + j, b = a + 1, c = a + NT + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = geo(pos, idx, uv); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals();
  face(g, () => V3(0, 0, 1), (NT + 1) * 3 + Math.round(NT / 2)); skinW(g, () => [[BI.head, 1]]); put(M.face, g);
  // its rim: a twisted cord of brown feathers round the heart
  const rimPts = []; for (let j = 0; j <= 48; j++) { heart(j / 48 * TAU, O); rimPts.push(V3(O.x * 1.01, FACEC.y + O.y * 1.01, faceZ(O.x, O.y, 1) + .012)); }
  const rg = ptTube(rimPts, Q(96, 48), 6, (t, th) => .016 * (1 + .25 * Math.sin(t * 160 + th * 2)), [1, 30]);
  attr(rg, 'color', 3, (i, o) => { const v = rg.attributes.uv.getY(i), k = .7 + .15 * Math.sin(v * 25); o[0] = .62 * k + .1; o[1] = .53 * k + .08; o[2] = .45 * k + .07; });
  skinW(rg, () => [[BI.head, 1]]); put(M.hard, rg);
 }
 // ---------- the eyes, their lids, and the beak ----------
 const EYEF = [];
 for (let e = 0; e < 2; e++) {
  const c = EYEP[e], g0 = EYEG[e], up = V3(0, 1, 0).addScaledVector(g0, -g0.y).normalize(), rt = V3().crossVectors(up, g0).normalize();
  EYEF.push({ c, g: g0, up, rt });
  const s = new THREE.SphereGeometry(EYER, Q(20, 12), Q(16, 10)), p = s.attributes.position, uv = s.attributes.uv, _p = V3();
  for (let i = 0; i < p.count; i++) { _p.set(p.getX(i), p.getY(i), p.getZ(i)); uv.setXY(i, .5 + _p.dot(rt) / EYER * .5, .5 + _p.dot(up) / EYER * .5); p.setXYZ(i, c.x + _p.x, c.y + _p.y, c.z + _p.z); }
  s.computeVertexNormals(); skinW(s, () => [[BI.head, 1]]); put(M.eye, s);
  // the upper lid: a pale feathered shell that turns down over the eye on its bone
  const NA = Q(14, 8), NE = Q(7, 4), pos = [], uvs = [], idx = [], col = [], R = EYER * 1.1;
  for (let a = 0; a <= NA; a++) for (let el = 0; el <= NE; el++) {
   const az = lerp(-1.8, 1.8, a / NA), e2 = lerp(.02, 1.5, el / NE), ce = Math.cos(e2);
   const d = V3().addScaledVector(g0, ce * Math.cos(az)).addScaledVector(rt, ce * Math.sin(az)).addScaledVector(up, Math.sin(e2));
   const rr2 = R * (1 + .07 * sm(.35, 0, e2)); pos.push(c.x + d.x * rr2, c.y + d.y * rr2, c.z + d.z * rr2); uvs.push(.4 + .2 * a / NA, .55 + .1 * el / NE); col.push(.92, .9, .86);
  }
  for (let a = 0; a < NA; a++) for (let el = 0; el < NE; el++) { const i0 = a * (NE + 1) + el, i1 = i0 + NE + 1; idx.push(i0, i1, i0 + 1, i0 + 1, i1, i1 + 1); }
  const lg = geo(pos, idx, uvs); lg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); lg.computeVertexNormals();
  face(lg, (x, y, z) => V3(x - c.x, y - c.y, z - c.z), Math.round(NA / 2) * (NE + 1) + 2); skinW(lg, () => [[BI['lid' + e], 1]]); put(M.face, lg);
 }
 {
  // the upper beak hooks down over the lower, which drops open on its bone
  const ivory = (g, k) => attr(g, 'color', 3, (i, o) => { const t = g.attributes.uv.getY(i); o[0] = lerp(.95, .7, t * t) * k; o[1] = lerp(.9, .62, t * t) * k; o[2] = lerp(.8, .52, t * t) * k; });
  const ub = ptTube([V3(0, 2.19, .585), V3(0, 2.17, .635), V3(0, 2.115, .67), V3(0, 2.065, .66)], Q(12, 8), Q(10, 6), (t, th) => (.05 * (1 - t) + .004) * (1 + .35 * Math.cos(th) * (1 - t)), [1, 1 / .16]);
  ivory(ub, 1); skinW(ub, () => [[BI.head, 1]]); put(M.hard, ub);
  const lb = ptTube([V3(0, 2.125, .58), V3(0, 2.105, .615), V3(0, 2.09, .64)], Q(8, 5), Q(8, 5), (t) => .026 * (1 - t) + .003, [1, 1 / .08]);
  ivory(lb, .9); skinW(lb, () => [[BI.beak, 1]]); put(M.hard, lb);
 }

 // ---------- outline feathers: the ruff round its face, its breast, shoulders, flanks, crown and ear tufts ----------
 // A card is a curved feather lying along dir from its base at P, its tip lifted off the body along N; cell picks the
 // feather in the picture (0 covert, 1 contour feather, 2 plume, 3 tuft feather).
 const CARDS = { pos: [], uv: [], col: [], idx: [], w: [] };
 function card(P, dir, N, w, h, cell, tint, wts, lift, segs) {
  const n = segs || 3, b = CARDS.pos.length / 3, D = dir.clone().normalize(), X = V3().crossVectors(D, N).normalize(), Nn = V3().crossVectors(X, D).normalize();
  for (let i = 0; i <= n; i++) {
   const t = i / n, lf = (lift === undefined ? .25 : lift) * h * t * t;
   for (let j = 0; j <= 1; j++) {
    const x = (j - .5) * w * (1 - .15 * t);
    CARDS.pos.push(P.x + D.x * h * t + X.x * x + Nn.x * lf, P.y + D.y * h * t + X.y * x + Nn.y * lf, P.z + D.z * h * t + X.z * x + Nn.z * lf);
    CARDS.uv.push((cell + j) / 4 * 1 + (j ? -.004 : .004), 1 - t * .98 - .01); CARDS.col.push(tint[0], tint[1], tint[2]); CARDS.w.push(wts);
   }
  }
  for (let i = 0; i < n; i++) { const a = b + i * 2; CARDS.idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
 }
 const tintOf = (k, warm) => [k * (warm ? 1.06 : 1), k, k * (warm ? .92 : 1)];
 {
  const P = V3(), P2 = V3(), N = V3(), D = V3();
  const onBody = (y, phi, out) => surfP(y, phi, out);
  const normalAt = (y, phi, out) => { surfP(y, phi + .004, P2); out.copy(P2); surfP(y, phi - .004, P2); out.sub(P2); const t = out.clone(); surfP(y + .01, phi, P2); out.copy(P2); surfP(y - .01, phi, P2); out.sub(P2); return out.crossVectors(out, t).normalize().negate(); };
  // (the breast and the ruff under the face, pale and fluffy)
  for (let i = 0; i < Q(150, 60); i++) {
   const y = rr(1.6, 2.0), phi = rr(-.17, .17), Pb = onBody(y, (phi + 1) % 1, V3()); normalAt(y, (phi + 1) % 1, N); Pb.addScaledVector(N, -.01);
   D.set(rr(-.15, .15), -1, rr(.05, .3)); card(Pb, D, N, rr(.1, .15), rr(.17, .26), rnd() < .6 ? 0 : 1, tintOf(lerp(.85, 1.3, sm(1.7, 1.95, y)) * rr(.92, 1.08), true), bodyW(y), rr(.08, .2));
  }
  // (shoulders, back and flanks, darker, lying down and back over the top of the wings' roots)
  for (let i = 0; i < Q(260, 100); i++) {
   const y = rr(1.1, 2.1), phi = rr(.1, .9), Pb = onBody(y, phi, V3()); normalAt(y, phi, N); Pb.addScaledVector(N, -.01);
   D.set(rr(-.1, .1), -1, -rr(.1, .45)); card(Pb, D, N, rr(.12, .18), rr(.22, .34), rnd() < .5 ? 0 : 1, tintOf(rr(.62, .86)), bodyW(y), rr(.05, .18));
  }
  // (the crown and the back of the head; and a ruff of small feathers round the face's rim)
  for (let i = 0; i < Q(80, 34); i++) {
   const y = rr(2.27, 2.56), phi = rr(.2, .8), Pb = onBody(y, phi, V3()); normalAt(y, phi, N); Pb.addScaledVector(N, -.008);
   D.set(rr(-.1, .1), -.6, -1); card(Pb, D, N, rr(.09, .13), rr(.14, .2), 1, tintOf(rr(.7, .92)), [[BI.head, 1]], .2);
  }
  const O = V3();
  for (let i = 0; i < Q(40, 22); i++) {
   const t = i / Q(40, 22) * TAU + rr(-.05, .05); heart(t, O); const Pb = V3(O.x * 1.06, FACEC.y + O.y * 1.06, faceZ(O.x, O.y, 1) - .01);
   const out = V3(O.x, O.y, 0).normalize(); D.copy(out).multiplyScalar(1).add(V3(0, -.25, -.55)); N.set(0, 0, 1);
   card(Pb, D, N, rr(.07, .1), rr(.11, .16), 0, tintOf(rr(.82, 1.02), true), [[BI.head, 1]], .1, 2);
  }
  // (the ear tufts: long dark feathers standing up from the top of the head, splayed a little)
  for (const s of [1, -1]) for (let i = 0; i < 8; i++) {
   const Pb = V3(s * rr(.12, .2), rr(2.43, 2.49), rr(.36, .44)); D.set(s * rr(.12, .4), 1, rr(-.3, -.05)); N.set(0, 0, 1);
   card(Pb, D, N, rr(.07, .1), rr(.26, .36), 3, tintOf(rr(.85, 1.1)), [[BI.head, 1]], -.06, 3);
  }
  // (the vent and the lower belly)
  for (let i = 0; i < Q(44, 18); i++) {
   const y = rr(.9, 1.15), phi = rr(-.3, .3), Pb = onBody(y, (phi + 1) % 1, V3()); normalAt(y, (phi + 1) % 1, N);
   D.set(rr(-.1, .1), -1, rr(-.1, .2)); card(Pb, D, N, rr(.12, .17), rr(.2, .3), 0, tintOf(rr(.66, .84), true), bodyW(y), .2);
  }
 }

 // ---------- the wings: long bones, thin skin between them, a hooked claw at each wrist ----------
 const SNS = Q(24, 10), SNT = Q(12, 6); // the skin between two fingers: rows along them, columns across
 for (const Wg of WINGS) {
  const { s, S, E, W: Wr, F } = Wg, sh = Wg.sh, el = Wg.el, wr = Wg.wr;
  const aE = S.distanceTo(E) / (S.distanceTo(E) + E.distanceTo(Wr)), lead = (a, out) => (a < aE ? out.copy(S).lerp(E, a / aE) : out.copy(E).lerp(Wr, (a - aE) / (1 - aE)));
  const ax = V3(s, 0, 0), dark = (g, k) => attr(g, 'color', 3, (i, o) => { o[0] = .33 * k; o[1] = .28 * k; o[2] = .24 * k; });
  // (the arm: shoulder to wrist, thick at the shoulder, knuckled at the wrist)
  const arm = ptTube([S.clone().addScaledVector(ax, -.12), S, E, Wr, Wr.clone().addScaledVector(ax, .05)], Q(30, 16), Q(10, 7),
   (t, th) => (lerp(.085, .04, sm(0, .75, t)) + .02 * Math.exp(-Math.pow((t - .3) / .05, 2)) + .022 * Math.exp(-Math.pow((t - .93) / .05, 2))) * (1 + .18 * Math.sin(th) * Math.sin(th)));
  dark(arm, 1);
  const tE = .3;
  skinW(arm, (x) => { const a = (x - S.x) / (Wr.x - S.x), we = sm(tE - .06, tE + .06, a + .04), ww = sm(.95, 1.02, a), wb = sm(.06, -.04, a); return [[BI.chest, wb], [BI[sh.name], (1 - wb) * (1 - we)], [BI[el.name], we * (1 - ww)], [BI[wr.name], ww]]; });
  put(M.hard, arm);
  // (the fingers: thin, two-jointed, tapering to the trailing edge)
  F.forEach((f, k) => {
   const g = ptTube([Wr.clone().addScaledVector(f.d, -.03), Wr, Wr.clone().addScaledVector(f.d, f.len * PROX), f.tip], Q(16, 9), Q(6, 5), (t) => lerp(.03, .009, t) + .008 * Math.exp(-Math.pow((t - PROX) / .04, 2)));
   dark(g, .92);
   skinW(g, (x, y, z) => { const sa = V3(x, y, z).sub(Wr).dot(f.d) / f.len, wb = sm(PROX - .05, PROX + .05, sa), ww = sm(.06, 0, sa); return [[BI[wr.name], ww], [BI[f.A.name], (1 - ww) * (1 - wb)], [BI[f.B.name], (1 - ww) * wb]]; });
   put(M.hard, g);
  });
  // (the wrist's claw: hooked, up and forward)
  {
   const c0 = Wr.clone().add(V3(0, .03, .03)), cl1 = c0.clone().add(V3(s * .07, .13, .1)), cl2 = c0.clone().add(V3(s * .09, .27, .07)), cl3 = c0.clone().add(V3(s * .05, .33, -.06));
   const g = ptTube([c0.clone().add(V3(0, -.05, 0)), c0, cl1, cl2, cl3], Q(12, 8), Q(8, 6), (t) => .052 * (1 - t) + .004);
   attr(g, 'color', 3, (i, o) => { const t = g.attributes.uv.getY(i) / .4; o[0] = lerp(.2, .07, cl(t, 0, 1)); o[1] = lerp(.17, .06, cl(t, 0, 1)); o[2] = lerp(.15, .06, cl(t, 0, 1)); });
   rigid(g, wr); put(M.hard, g);
  }
  // (the skin between the fingers: patches 0 to 2, scalloped between their tips, cupped a little)
  const SK = { pos: [], uv: [], idx: [], w: [] }, Fp = (k, q, out) => out.copy(Wr).addScaledVector(F[k].d, F[k].len * q);
  const fW = (k, q) => { const wb = sm(PROX - .08, PROX + .08, q); return [[BI[F[k].A.name], 1 - wb], [BI[F[k].B.name], wb]]; };
  const _a = V3(), _b = V3();
  for (let k = 0; k < 3; k++) {
   const NS = SNS, NT = SNT, b0 = SK.pos.length / 3;
   for (let i = 0; i <= NS; i++) for (let j = 0; j <= NT; j++) {
    const t = j / NT, q = i / NS * (1 - .17 * Math.sin(PI * t));
    Fp(k, q, _a); Fp(k + 1, q, _b); _a.lerp(_b, t); _a.y -= .06 * Math.sin(PI * t) * q;
    SK.pos.push(_a.x, _a.y, _a.z); SK.uv.push((k + (s > 0 ? t : 1 - t)) / 4, 1 - q);
    const ww = sm(.12, 0, q), w = [];
    for (const [bi, v] of fW(k, q)) w.push([bi, v * (1 - t) * (1 - ww)]);
    for (const [bi, v] of fW(k + 1, q)) w.push([bi, v * t * (1 - ww)]);
    w.push([BI[wr.name], ww]); SK.w.push(w);
   }
   for (let i = 0; i < NS; i++) for (let j = 0; j < NT; j++) { const a = b0 + i * (NT + 1) + j, b = a + 1, c = a + NT + 1, d = c + 1; SK.idx.push(a, b, c, b, d, c); }
  }
  // (and the great sheet from the arm and the last finger down to its flank: a Coons patch over the arm, the finger, the
  // trailing edge and the body's side)
  {
   const T3 = F[3].tip, H = V3(s * .32, 1.06, -.2), NA = Q(28, 11), NB = Q(20, 9), b0 = SK.pos.length / 3;
   const fing = (b, out) => Fp(3, b, out);
   const side = (b, out) => { out.copy(S).lerp(H, b); out.x = s * (Math.abs(out.x) + .05 * Math.sin(PI * b)); return out; };
   const trail = (a, out) => { out.copy(H).lerp(T3, a); const sag = .38 * Math.sin(PI * a); out.lerp(_b.copy(S).lerp(Wr, a), sag * .5); return out; };
   const P1 = V3(), P2 = V3(), P3 = V3(), P4 = V3();
   for (let i = 0; i <= NB; i++) for (let j = 0; j <= NA; j++) {
    const a = j / NA, b = i / NB;
    lead(a, P1); trail(a, P2); side(b, P3); fing(b, P4);
    const x = (1 - b) * P1.x + b * P2.x + (1 - a) * P3.x + a * P4.x - ((1 - a) * (1 - b) * S.x + a * (1 - b) * Wr.x + (1 - a) * b * H.x + a * b * T3.x);
    const y = (1 - b) * P1.y + b * P2.y + (1 - a) * P3.y + a * P4.y - ((1 - a) * (1 - b) * S.y + a * (1 - b) * Wr.y + (1 - a) * b * H.y + a * b * T3.y);
    const z = (1 - b) * P1.z + b * P2.z + (1 - a) * P3.z + a * P4.z - ((1 - a) * (1 - b) * S.z + a * (1 - b) * Wr.z + (1 - a) * b * H.z + a * b * T3.z);
    SK.pos.push(x, y - .05 * Math.sin(PI * a) * Math.sin(PI * b), z); SK.uv.push(.75 + .25 * (s > 0 ? a : 1 - a), 1 - b);
    const iA = 1 / Math.pow(b + .07, 2), iB = 1 / Math.pow(a + .07, 2), iF = 1 / Math.pow(1 - a + .07, 2), iT = iA + iB + iF;
    const wA = iA / iT, wF = iF / iT, wB = iB / iT, we = sm(aE - .08, aE + .08, a), wx = sm(.92, 1, a), w = [];
    w.push([BI[sh.name], wA * (1 - we)], [BI[el.name], wA * we * (1 - wx)], [BI[wr.name], wA * wx]);
    for (const [bi, v] of fW(3, b)) w.push([bi, v * wF]);
    for (const [bi, v] of bodyW(y)) w.push([bi, v * wB]);
    SK.w.push(w);
   }
   for (let i = 0; i < NB; i++) for (let j = 0; j < NA; j++) { const a = b0 + i * (NA + 1) + j, b = a + 1, c = a + NA + 1, d = c + 1; SK.idx.push(a, b, c, b, d, c); }
  }
  const g = geo(SK.pos, SK.idx, SK.uv); g.computeVertexNormals();
  // (wound so its front face is the wing's underside, which faces down and forward when it flies)
  face(g, () => V3(0, -1, 0), Math.round(SNS / 2) * (SNT + 1) + Math.round(SNT / 2)); skinW(g, (x, y, z, i) => SK.w[i]); put(M.skin, g);
  // (coverts: rows of feathers along the top of the arm, lying back over the skin; folded, the wing looks feathered)
  for (let i = 0; i < Q(16, 9); i++) {
   const a = Math.pow(rnd(), 1.3) * .3, row = rnd(), P = V3(); lead(a, P);
   P.y += .04; P.z -= .02 + row * .12;
   const D = V3(s * rr(-.05, .15), -rr(.05, .2), -1).normalize(), N = V3(0, 1, 0);
   const aw = a < aE ? [[BI[sh.name], 1]] : [[BI[el.name], 1]];
   card(P, D, N, rr(.13, .2) * (1 - .4 * a), rr(.3, .5) * (1 - .45 * a), rnd() < .5 ? 1 : 0, tintOf(rr(.62, .85)), aw, .05, 2);
  }
 }

 // ---------- the legs: feathered thighs, long scaly shanks, four toes with great black talons ----------
 for (const L of LEGS) {
  const [P0, P1, P2, P3] = L.P, s = L.s, b = L.b.map((x) => BI[x.name]);
  // (the thigh, in its "trousers" of shaggy feathers)
  const th = ptTube([P0.clone().add(V3(0, .12, .02)), P0, P1, P1.clone().add(V3(0, -.06, -.01))], Q(14, 8), Q(14, 8), (t) => lerp(.15, .075, t));
  attr(th, 'color', 3, (i, o) => { o[0] = .9; o[1] = .86; o[2] = .8; });
  skinW(th, (x, y) => { const w = sm(P0.y + .02, P0.y - .12, y), wh = sm(P1.y + .05, P1.y - .03, y); return [[BI.fly, 1 - w], [b[0], w * (1 - wh)], [b[1], w * wh]]; });
  put(M.plume, th);
  for (let i = 0; i < Q(40, 16); i++) {
   const t = rr(0, .95), a = rr(0, TAU), P = P0.clone().lerp(P1, t), r = lerp(.14, .07, t), N = V3(Math.sin(a), 0, Math.cos(a));
   P.addScaledVector(N, r * .8); card(P, V3(N.x * .25, -1, N.z * .25), N, rr(.1, .14), rr(.18, .26), rnd() < .5 ? 0 : 1, tintOf(rr(.62, .84), true), [[t < .5 ? BI.fly : b[0], 1]], .2, 2);
  }
  // (the shank, scaled, to the ankle)
  const sk = ptTube([P1.clone().add(V3(0, .05, -.01)), P1, P2, P2.clone().add(V3(0, -.02, .01))], Q(14, 8), Q(10, 7), (t) => lerp(.06, .042, t) + .012 * Math.exp(-Math.pow(t / .1, 2)), [1, 4]);
  attr(sk, 'color', 3, (i, o) => { o[0] = .95; o[1] = .92; o[2] = .9; });
  skinW(sk, (x, y) => { const w = sm(P1.y + .02, P1.y - .06, y), wf = sm(P2.y + .05, P2.y - .02, y); return [[b[0], 1 - w], [b[1], w * (1 - wf)], [b[2], w * wf]]; });
  put(M.leg, sk);
  // (the toes: three spread forward, one back, each ending in a hooked talon that reaches the ground)
  const TO = [[-.5, .3], [0, .34], [.5, .3], [PI, .19]];
  for (const [a0, len] of TO) {
   const a = a0 * s, d = V3(Math.sin(a), 0, Math.cos(a)), B0 = P3.clone(); B0.y = .06;
   const tip = B0.clone().addScaledVector(d, len); tip.y = .05;
   const tg = ptTube([P2.clone(), B0, B0.clone().addScaledVector(d, len * .5).add(V3(0, .035, 0)), tip], Q(10, 6), Q(8, 6), (t) => lerp(.05, .034, t) * (1 + .15 * Math.sin(t * PI * 3)), [1, 4]);
   attr(tg, 'color', 3, (i, o) => { o[0] = .9; o[1] = .87; o[2] = .84; });
   skinW(tg, (x, y, z) => { const w = sm(-.02, .06, V3(x - B0.x, 0, z - B0.z).dot(d)); return [[b[2], 1 - w], [b[3], w]]; });
   put(M.leg, tg);
   const tc = ptTube([tip.clone().addScaledVector(d, -.02), tip.clone().addScaledVector(d, .05).add(V3(0, .04, 0)), tip.clone().addScaledVector(d, .13).add(V3(0, .01, 0)), tip.clone().addScaledVector(d, .16).add(V3(0, -.05, 0))], Q(10, 6), Q(7, 5), (t) => .036 * (1 - t) + .003);
   attr(tc, 'color', 3, (i, o) => { o[0] = .06; o[1] = .055; o[2] = .055; });
   skinW(tc, () => [[b[3], 1]]); put(M.hard, tc);
  }
 }

 // ---------- the tail: a bushy fan of long plumes, pale at their tips, sweeping down and back from its rump: a cone of
 // them, open underneath, two layers deep, so it is full from the front, the side and behind ----------
 const DC = V3(0, -.55, -.83).normalize(), XS = V3(1, 0, 0), NT = V3().crossVectors(XS, DC).normalize();
 for (let layer = 0; layer < 2; layer++) {
  const n = layer ? Q(12, 7) : Q(17, 9), cone = layer ? .26 : .42;
  for (let i = 0; i < n; i++) {
   const f = n > 1 ? i / (n - 1) : .5, th = lerp(-1, 1, f) * (PI / 2 + (layer ? .3 : .55)) + rr(-.05, .05);
   const R = XS.clone().multiplyScalar(Math.sin(th)).addScaledVector(NT, Math.cos(th)), P = V3(0, 1.02 - layer * .04, -.36 + layer * .04).addScaledVector(R, .1);
   const D = DC.clone().addScaledVector(R, cone); D.y -= .2 * Math.abs(Math.sin(th)); D.normalize();
   const len = (layer ? rr(1.15, 1.4) : rr(1.6, 1.85)) * (1 - .1 * Math.abs(th) / PI), b0 = CARDS.pos.length / 3;
   card(P, D, R, rr(.2, .26), len, 2, tintOf(rr(.88, 1.12), true), null, layer ? .1 : .05, 6);
   for (let k = b0; k < CARDS.pos.length / 3; k++) { const t = Math.floor((k - b0) / 2) / 6; CARDS.w[k] = [[BI.fly, Math.max(0, .3 - t) / .3 * .5], [BI.tail, 1 - sm(.25, .75, t)], [BI.tail2, sm(.25, .75, t)]]; }
  }
 }
 {
  const g = geo(CARDS.pos, CARDS.idx, CARDS.uv); g.setAttribute('color', new THREE.Float32BufferAttribute(CARDS.col, 3)); g.computeVertexNormals();
  skinW(g, (x, y, z, i) => CARDS.w[i]); put(M.card, g);
 }

 // ---------- bind ----------
 base.scale.setScalar(SZ);
 root.updateMatrixWorld(true);
 const skeleton = new THREE.Skeleton(bones);
 const bodyMeshes = [];
 for (const [mat, list] of BK) { const m = new THREE.SkinnedMesh(mergeAll(list), mat); m.frustumCulled = false; base.add(m); bodyMeshes.push(m); }
 root.updateMatrixWorld(true);
 for (const m of bodyMeshes) m.bind(skeleton);
 for (const b of bones) b.userData.bind = { p: b.position.clone(), q: b.quaternion.clone() };

 // ---------- the moon-sac: a translucent pale moon hanging under its chest, the souls it has swallowed fluttering inside
 // as dark moths; it glows, lights its own breast, and splits open when it is beaten ----------
 const sacU = { uMap: { value: MOON }, uGlow: { value: 1 }, uT: { value: 0 }, uSplit: { value: 0 }, uA: { value: 1 } };
 const sacMat = new THREE.ShaderMaterial({
  uniforms: sacU, transparent: true, depthWrite: false,
  vertexShader: 'varying vec3 vN; varying vec3 vV; varying vec2 vUv; varying vec3 vP;\nvoid main(){ vUv = uv; vP = position; vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
  fragmentShader: 'uniform sampler2D uMap; uniform float uGlow, uT, uSplit, uA; varying vec3 vN; varying vec3 vV; varying vec2 vUv; varying vec3 vP;\n' + NOISE +
   'void main(){ float f = 1. - abs(dot(vN, vV)); vec3 m = texture2D(uMap, vUv + vec2(uT * .004, 0.)).rgb;\n' +
   ' vec3 c = mix(vec3(.62, .56, .48), vec3(1., .96, .88), m.r) * (.5 + .5 * uGlow) + vec3(1., .9, .72) * pow(f, 2.5) * .45 * uGlow;\n' +
   // (split: bright cracks run over it, then its halves fall dark)
   ' float n = gwN(vP * 9.), cr = uSplit > 0. ? (1. - smoothstep(0., .05 + .04 * uSplit, abs(n - .5))) * smoothstep(0., .3, uSplit) : 0.;\n' +
   ' c += vec3(1., .97, .85) * cr * 2.2 * (1. - smoothstep(.6, 1., uSplit)); c *= 1. - .75 * smoothstep(.5, 1., uSplit);\n' +
   ' float a = mix(.82, .96, smoothstep(.2, .9, f)) * uA * (1. - .6 * smoothstep(.55, 1., uSplit));\n' +
   ' if (uSplit > .45 && n > .5 + .5 * (1. - uSplit) && vP.y > -.05) discard;\n' +
   ' gl_FragColor = vec4(c, a); }'
 });
 const sacGeo = (() => { const g = new THREE.SphereGeometry(SACR, Q(28, 16), Q(22, 12)), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i) / SACR, k = 1 - .14 * sm(.2, 1, y); p.setXYZ(i, p.getX(i) * k, p.getY(i) * 1.06, p.getZ(i) * k); } g.computeVertexNormals(); return g; })();
 const sac = new THREE.Mesh(sacGeo, sacMat); sac.renderOrder = 4; sacB.add(sac);
 const sacHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloT, color: new THREE.Color(1, .9, .74), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .4 }));
 sacHalo.scale.setScalar(1.3); sacHalo.renderOrder = 6; sacB.add(sacHalo);
 // (the moths inside, dark against its glow, fluttering round and round)
 const NIN = 9;
 const inG = new THREE.BufferGeometry(), inPos = new Float32Array(NIN * 3), inPh = new Float32Array(NIN), inA = new Float32Array(NIN);
 for (let i = 0; i < NIN; i++) { inPh[i] = rnd() * TAU; inA[i] = 0; }
 inG.setAttribute('position', new THREE.BufferAttribute(inPos, 3).setUsage(THREE.DynamicDrawUsage)); inG.setAttribute('aPh', new THREE.BufferAttribute(inPh, 1)); inG.setAttribute('aA', new THREE.BufferAttribute(inA, 1).setUsage(THREE.DynamicDrawUsage));
 const FLAPV = 'attribute float aPh; attribute float aA; uniform float uScale, uT, uSize; varying float vA, vF, vR;\nvoid main(){ vA = aA; vF = .25 + .75 * abs(sin(uT * 9. + aPh * 3.)); vR = sin(aPh * 5. + uT * .7) * .6; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = aA > .01 ? uSize * uScale * projectionMatrix[1][1] / -mv.z : 0.; }';
 const FLAPF = 'uniform sampler2D uMap; uniform vec3 uC; varying float vA, vF, vR;\nvoid main(){ vec2 p = gl_PointCoord - .5; float c = cos(vR), s = sin(vR); p = vec2(c * p.x - s * p.y, s * p.x + c * p.y); p.x /= vF; p += .5; if (p.x < 0. || p.x > 1. || p.y < 0. || p.y > 1.) discard; vec4 t = texture2D(uMap, vec2(p.x, 1. - p.y)); gl_FragColor = vec4(uC * t.rgb, t.a * vA); }';
 const _v2 = new THREE.Vector2();
 const inM = new THREE.ShaderMaterial({ uniforms: { uMap: { value: mothDarkT }, uScale: { value: 400 }, uT: { value: 0 }, uSize: { value: .17 * SZ }, uC: { value: new THREE.Color(1, 1, 1) } }, vertexShader: FLAPV, fragmentShader: FLAPF, transparent: true, depthWrite: false, depthTest: false });
 // (drawn over the sac's skin, as shadows seen through it)
 const inside = new THREE.Points(inG, inM); inside.renderOrder = 5; inside.frustumCulled = false; sacB.add(inside);
 inside.onBeforeRender = (r) => { r.getDrawingBufferSize(_v2); inM.uniforms.uScale.value = _v2.y * .5; };

 // ---------- points: world-sized soft sprites with their own colour, size and spin ----------
 const PTV = 'attribute vec4 aCol; attribute float aSize; attribute float aRot; uniform float uScale; varying vec4 vC; varying float vR;\nvoid main(){ vC = aCol; vR = aRot; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = aCol.a > 0.002 ? aSize * uScale * projectionMatrix[1][1] / -mv.z : 0.0; }';
 const PTF = 'uniform sampler2D uMap; varying vec4 vC; varying float vR;\nvoid main(){ vec2 p = gl_PointCoord - .5; float c = cos(vR), s = sin(vR); p = vec2(c * p.x - s * p.y, s * p.x + c * p.y) + .5; if (p.x < 0. || p.x > 1. || p.y < 0. || p.y > 1.) discard; vec4 t = texture2D(uMap, vec2(p.x, 1.0 - p.y)); gl_FragColor = vec4(vC.rgb * t.rgb, vC.a * t.a); }';
 // (moths fly: their sprite's width beats with their wings)
 const PVM = 'attribute vec4 aCol; attribute float aSize; attribute float aRot; uniform float uScale, uT; varying vec4 vC; varying float vR, vF;\nvoid main(){ vC = aCol; vR = aRot; vF = .2 + .8 * abs(sin(uT * 10. + aRot * 7.)); vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = aCol.a > 0.002 ? aSize * uScale * projectionMatrix[1][1] / -mv.z : 0.0; }';
 const PFM = 'uniform sampler2D uMap; varying vec4 vC; varying float vR, vF;\nvoid main(){ vec2 p = gl_PointCoord - .5; float c = cos(vR * .3), s = sin(vR * .3); p = vec2(c * p.x - s * p.y, s * p.x + c * p.y); p.x /= vF; p += .5; if (p.x < 0. || p.x > 1. || p.y < 0. || p.y > 1.) discard; vec4 t = texture2D(uMap, vec2(p.x, 1.0 - p.y)); gl_FragColor = vec4(vC.rgb * t.rgb, vC.a * t.a); }';
 function points(n, map, blend, order, moth) {
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 4), size = new Float32Array(n), rot = new Float32Array(n), g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aCol', new THREE.BufferAttribute(col, 4).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aSize', new THREE.BufferAttribute(size, 1).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aRot', new THREE.BufferAttribute(rot, 1).setUsage(THREE.DynamicDrawUsage));
  const m = new THREE.ShaderMaterial({ uniforms: { uMap: { value: map }, uScale: { value: 400 }, uT: U.time }, vertexShader: moth ? PVM : PTV, fragmentShader: moth ? PFM : PTF, transparent: true, depthWrite: false, blending: blend });
  const p = new THREE.Points(g, m); p.frustumCulled = false; p.renderOrder = order || 8;
  p.onBeforeRender = (r) => { r.getDrawingBufferSize(_v2); m.uniforms.uScale.value = _v2.y * .5; };
  return { p, pos, col, size, rot, g, n, m, vel: new Float32Array(n * 3), life: new Float32Array(n), max: new Float32Array(n).fill(1), base: new Float32Array(n * 4), sz: new Float32Array(n * 2), drag: new Float32Array(n), up: new Float32Array(n), spin: new Float32Array(n), sway: new Float32Array(n), fo: new Float32Array(n).fill(2), next: 0, live: 2 };
 }
 // pale moths (souls), feathers, dust, and motes of soul-light
 const MO = points(Q(90, 50), mothT, THREE.AdditiveBlending, 9, true), FE = points(Q(120, 60), featherT, THREE.NormalBlending, 8), DU = points(Q(160, 80), puffT, THREE.NormalBlending, 7), SP = points(Q(200, 100), dotT, THREE.AdditiveBlending, 9);
 fx.add(MO.p, FE.p, DU.p, SP.p);
 // (the moths that fly with a purpose: to its sac, to its beak, or up and away to the Moon; each follows its own path)
 const MP = Array.from({ length: MO.n }, () => ({ mode: 0, a: V3(), ph: 0, r: 0, h: 0 }));
 // gusts: streaks of wind racing over the ground from Wing Gale, as flat strips (one instanced mesh)
 const NST = 26, stG = new THREE.PlaneGeometry(1, .08); stG.rotateX(-PI / 2);
 const STR = new THREE.InstancedMesh(stG, new THREE.MeshBasicMaterial({ map: streakT, color: new THREE.Color(.75, .78, .88), transparent: true, opacity: .55, depthWrite: false, blending: THREE.AdditiveBlending }), NST);
 STR.instanceMatrix.setUsage(THREE.DynamicDrawUsage); STR.frustumCulled = false; STR.renderOrder = 7; fx.add(STR);
 const ST = Array.from({ length: NST }, () => ({ t: -1, life: 1, p: V3(), v: V3(), len: 1 })), M0 = new THREE.Matrix4().makeScale(0, 0, 0);
 for (let i = 0; i < NST; i++) STR.setMatrixAt(i, M0);
 // rings racing over the ground: Wing Gale's blast (dust) and Hush's hush (a dusk-dark ring)
 const SHK = [0, 1, 2].map(() => {
  const m = new THREE.Mesh(new THREE.RingGeometry(.6, 1, Q(64, 32), 1), new THREE.ShaderMaterial({
   uniforms: { uC: { value: new THREE.Color() }, uA: { value: 0 } }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
   vertexShader: 'varying float vR;\nvoid main(){ vR = length(position.xy); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
   fragmentShader: 'uniform vec3 uC; uniform float uA; varying float vR;\nvoid main(){ float e = smoothstep(.62, .92, vR) * (1. - smoothstep(.94, 1., vR)); if (e * uA < .004) discard; gl_FragColor = vec4(uC, e * uA); }' }));
  m.rotation.x = -PI / 2; m.frustumCulled = false; m.visible = false; m.renderOrder = 6; fx.add(m);
  return { m, t: 0, dur: 1, r0: 0, r1: 1, a: 0 };
 });
 let shkN = 0;
 function shock(x, y, z, r0, r1, dur, col, a, glow) { const S = SHK[shkN++ % SHK.length]; S.m.position.set(x, y, z); S.t = 0; S.dur = dur; S.r0 = r0; S.r1 = r1; S.a = a; S.m.material.uniforms.uC.value.copy(col); S.m.material.blending = glow ? THREE.AdditiveBlending : THREE.NormalBlending; S.m.visible = true; }
 // trails behind its wingtips as it swoops and beats down: a faint smoky ribbon from each
 const TRN = 16, trPos = new Float32Array(2 * TRN * 6), trCol = new Float32Array(2 * TRN * 6), trIdx = [];
 for (let r = 0; r < 2; r++) for (let i = 0; i < TRN - 1; i++) { const a = (r * TRN + i) * 2; trIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
 const trG = new THREE.BufferGeometry(); trG.setAttribute('position', new THREE.BufferAttribute(trPos, 3).setUsage(THREE.DynamicDrawUsage)); trG.setAttribute('color', new THREE.BufferAttribute(trCol, 3).setUsage(THREE.DynamicDrawUsage)); trG.setIndex(trIdx);
 const trail = new THREE.Mesh(trG, new THREE.MeshBasicMaterial(Object.assign({ vertexColors: true, side: THREE.DoubleSide }, ADD))); trail.frustumCulled = false; trail.visible = false; trail.renderOrder = 8; fx.add(trail);
 const TRK = [0, 1].map(() => ({ tip: Array.from({ length: TRN }, () => V3()), mid: Array.from({ length: TRN }, () => V3()), prev: 0 }));
 // its sac's light: pale moonlight on its breast and on whoever is before it
 const sacL = new THREE.PointLight(0xffe2c0, 0, 7 * SZ, 2); fx.add(sacL);

 function emit(P, x, y, z, vx, vy, vz, life, c, a, s0, s1, drag, up, spin, sway) {
  const i = P.next; P.next = (i + 1) % P.n; P.live = 2;
  P.pos[i * 3] = x; P.pos[i * 3 + 1] = y; P.pos[i * 3 + 2] = z; P.vel[i * 3] = vx; P.vel[i * 3 + 1] = vy; P.vel[i * 3 + 2] = vz;
  P.life[i] = P.max[i] = life; P.base[i * 4] = c.r; P.base[i * 4 + 1] = c.g; P.base[i * 4 + 2] = c.b; P.base[i * 4 + 3] = a; P.sz[i * 2] = s0; P.sz[i * 2 + 1] = s1;
  P.drag[i] = drag || 0; P.up[i] = up || 0; P.spin[i] = spin || 0; P.sway[i] = sway || 0; P.fo[i] = 2; P.rot[i] = rnd2() * TAU;
  return i;
 }
 function stepP(P, dt, fadeIn, t, keep) {
  if (P.live <= 0) return;
  const pos = P.pos, vel = P.vel, col = P.col; let alive = 0;
  for (let i = 0; i < P.n; i++) {
   if (P.life[i] <= 0) { if (col[i * 4 + 3] !== 0) { col[i * 4 + 3] = 0; P.size[i] = 0; } continue; }
   alive++; P.life[i] -= dt; const age = 1 - Math.max(0, P.life[i]) / P.max[i];
   if (!(keep && keep(i, age, dt))) {
    const dr = Math.exp(-P.drag[i] * dt);
    vel[i * 3] *= dr; vel[i * 3 + 1] = vel[i * 3 + 1] * dr + P.up[i] * dt; vel[i * 3 + 2] *= dr;
    const sw = P.sway[i] ? P.sway[i] * Math.sin(t * 2.3 + i * 1.7) : 0;
    pos[i * 3] += (vel[i * 3] + sw) * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += (vel[i * 3 + 2] + sw * .6) * dt;
    if (pos[i * 3 + 1] < .01) { pos[i * 3 + 1] = .01; vel[i * 3] *= .5; vel[i * 3 + 1] = 0; vel[i * 3 + 2] *= .5; P.spin[i] *= .9; }
   }
   P.rot[i] += P.spin[i] * dt;
   const k = Math.min(1, age / (fadeIn || .15)) * (1 - (P.fo[i] === 2 ? age * age : Math.pow(age, P.fo[i])));
   col[i * 4] = P.base[i * 4]; col[i * 4 + 1] = P.base[i * 4 + 1]; col[i * 4 + 2] = P.base[i * 4 + 2]; col[i * 4 + 3] = P.base[i * 4 + 3] * k;
   P.size[i] = lerp(P.sz[i * 2], P.sz[i * 2 + 1], age);
  }
  P.live = alive > 0 ? 2 : P.live - 1;
  for (const k of ['position', 'aCol', 'aSize', 'aRot']) P.g.attributes[k].needsUpdate = true;
 }

 // ---------- poses and actions ----------
 // body: alt how high it hovers (0 standing), pz and px move it forward and sideways, pitch leans it nose-down, roll,
 //   yaw, bend hunches its chest
 // head: nk and hp pitch neck and head down, hy turns the head (an owl's swivel) and ht cocks it, look how much it turns
 //   to its prey, bk opens the beak, lid closes the eyes
 // wings (both, mirrored): wu raises them, wf sweeps them forward, wt twists their leading edge down, we folds the
 //   elbows (wef swings the forearms forward, to wrap them round its front), wr turns the hands so the fingers hang down, wh folds the fingers back along the forearm, fs spreads them,
 //   fc curls them (cupping the skin); wl and wrr raise one wing more than the other; flap beats them (fr how fast)
 // legs: stand plants its feet (0 they hang as it flies), lf swings them forward, lsp spreads them, tal opens its talons
 // tail: tu lifts it, tfan spreads the fan
 // sac and looks: glow, swell, split (the sac breaks open), fade, lure (moths drawn to it), dust, plume (feathers shed),
 //   trail (smoke from its wingtips), wind, fold (its wings wrapped: their skin looks like the folded wing's feathers)
 // (its hover is the sheet's: wings raised, the skin hanging from the arms and facing forward, the fingers pointing down;
 // this is the top of its wingbeat)
 const BASE = { alt: 1.0, pz: 0, px: 0, pitch: .08, roll: 0, yaw: 0, bend: .05, nk: -.04, hp: .02, hy: 0, ht: 0, look: 1, bk: 0, lid: .02,
  wu: .49, wf: -.63, wt: -1.62, we: .11, wef: 0, wr: .45, wh: .95, fs: .57, fc: .1, wl: 0, wrr: 0, flap: 1, fr: 1,
  stand: 0, lf: .15, lsp: .12, tal: .35, tu: -.08, tfan: .5,
  glow: 1, swell: 0, split: 0, fade: 1, lure: 0, dust: 0, plume: 0, trail: 0, wind: 0, fold: 0 };
 const KEYS = Object.keys(BASE), K = (...a) => Object.assign({}, ...a);
 // (wing poses found by fitting the rig to the sheets: see the README)
 const GUARD = { wu: -.12, wf: .73, wt: .96, we: -1.09, wef: -2.28, wr: -2.55, wh: 1.91, fs: .4, fc: .15, flap: 0, fold: .8, nk: .15, hp: .1, pitch: .02, tu: -.2 };
 const WALK = { pitch: .22, fr: 1.35, flap: 1, tu: -.02, lf: -.15 };
 const RAISED = { wu: 1.1, wf: -.45, wt: -1.5, we: .05, wef: 0, wr: .3, wh: .5, fs: .95, fc: .05, flap: 0 };
 const DOWNBEAT = { wu: -.31, wf: -.08, wt: -.67, we: .11, wef: 0, wr: .45, wh: .4, fs: .87, fc: .4, flap: 0 };
 const GLIDE = { wu: .1, wf: -.1, wt: -.3, we: .05, wef: 0, wr: .1, wh: .1, fs: 1, fc: .1, flap: 0 };
 const WRAP = { wu: -.92, wf: .75, wt: .99, we: -.5, wef: -2.89, wr: -2.49, wh: 1.99, fs: .45, fc: .2, flap: 0, fold: 1 };
 const SHROUD = { wu: -1.21, wf: 1.13, wt: 1.01, we: .57, wef: -2.57, wr: -2.74, wh: 1.29, fs: .4, fc: .15, flap: 0, fold: 1, stand: 1, alt: 0, pitch: .02, bend: 0, tfan: .1, tu: -.35, lf: 0, tal: 0 };
 const GLUTW = { wu: .12, wf: -.2, wt: -1.5, we: .1, wef: 0, wr: .4, wh: .7, fs: .78, fc: .1, flap: 0 };
 const RELEASED = { stand: 1, alt: -.6, pitch: -.18, roll: 0, yaw: 0, wl: 0, wrr: 0, bend: -.05, wu: -.5, wf: .15, wt: -.45, we: .15, wef: 0, wr: 0, wh: .45, fs: 1, fc: 0, flap: 0, nk: -.3, hp: -.8, look: 0, lid: .5, tu: -.4, tfan: 1, tal: .3, lf: .5, lsp: .45 };
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
 // Gloaming: it comes down out of the dark, gliding in on spread wings, brakes with its wings thrown up and a great
 // downbeat, and settles into its hover; its sac lights up and it screeches
 act('appear', 3.8, [[0, K(GLIDE, { alt: 9, pz: -7, pitch: .45, lf: -.3, tal: .1, glow: .05, look: 0, tfan: .3 })],
  [.42, { alt: 2.6, pz: -1.2, pitch: .2, wu: .25, glow: .25 }, 'o'],
  [.56, K(RAISED, { alt: 1.6, pz: -.2, pitch: -.3, lf: .4, tal: .8, glow: 1.4, look: .6, bk: .7, hp: -.3, tfan: .9 }), 's'],
  [.64, K(DOWNBEAT, { alt: 1.3, bk: .8 }), 'i'], [.72, K(BASE, { glow: 1.5, bk: .3 })], [1, BASE]],
  { snap: KEYS, cues: [.56, .8], rate: 10 });
 // Moonlure: it wraps its wings forward round its sac like a cloak and shuts its eyes; the sac blazes, and pale moths
 // drift in to it out of the dark (the hit is a lure on the whole party, not damage)
 act('moonlure', 3.6, [[0, {}], [.22, K(WRAP, { alt: .85, pitch: .02, bend: .12, nk: .12, hp: .12, lid: .9, look: .2, glow: 2, swell: .1, lure: .4, tfan: .3, lf: 0, tal: .1 }), 's'],
  [.45, { glow: 3, swell: .18, lure: 1 }], [.75, { glow: 2.6, lure: .8 }], [.86, { lure: 0, glow: 1.6, lid: .2 }], [1, BASE]],
  { hits: [.62], cues: [.2, .45], rate: 6 });
 // Swoop: it rises with its wings thrown up, then dives low at its prey, wings high and swept back and its talons
 // thrust forward, rakes it, and pulls up and back to its place with a great downbeat (dash carries it there and back)
 act('swoop', 2.4, [[0, {}], [.2, K(RAISED, { alt: 2.2, pz: -.3, pitch: -.1, lf: -.2, tal: .2, look: 1 }), 'o'],
  [.44, { alt: .25, pitch: .85, wu: 1.0, wf: -1.0, wt: -1.2, we: .1, wr: .2, wh: .45, fs: .85, lf: 1.2, tal: 1, trail: 1, hp: -.5, plume: .3 }, 'i'],
  [.52, { alt: .35, pitch: .5, lf: 1.35, tal: .2 }], [.64, K(RAISED, { alt: 2.0, pitch: -.35, lf: .3, tal: .3, trail: .6, dust: 1 }), 'o'],
  [.72, K(DOWNBEAT, { alt: 1.7, trail: 0, dust: .3 }), 'i'], [.82, K(BASE, { alt: 1.3, dust: 0 })], [1, BASE]],
  { hits: [.5], cues: [.22], rate: 14 });
 // Wing Gale: it rears up in the air, wings high, and screeches; then one huge downbeat drives a blast of wind over
 // the whole party
 act('wingGale', 2.6, [[0, {}], [.3, K(RAISED, { wu: 1.25, alt: 1.7, pitch: -.32, bend: -.1, nk: -.2, hp: -.45, bk: .9, look: .3, lf: .3, tal: .9, tfan: 1, tu: .1 }), 'o'],
  [.36, { wu: 1.32, bk: 1 }], [.46, K(DOWNBEAT, { wu: -.5, wf: .2, alt: 1.25, pitch: .15, bk: .4, trail: 1, wind: 1, dust: 1.5, plume: .6, lf: .3, tal: .9, tfan: 1 }), 'i'],
  [.56, { trail: .3, wind: .3 }], [.7, K(BASE, { dust: .2, wind: 0 })], [1, BASE]],
  { hits: [.46], cues: [.3], rate: 15 });
 // Hush: it lands and folds its wings tight round itself like a shroud, eyes half shut, its sac's light hidden; a
 // hush rolls out over the party (the hit is a silence, not damage); then it lifts off again
 act('hush', 3.2, [[0, {}], [.25, K(SHROUD, { lid: .65, look: .3, glow: .35, nk: .08, hp: .1 }), 's'],
  [.5, { lid: .75, glow: .2 }], [.82, { lid: .5 }], [.9, K(RAISED, { alt: .6, stand: 0, glow: .8, lid: .1, lf: .1, tal: .3, dust: .5 }), 'o'], [1, K(BASE, { dust: 0 })]],
  { hits: [.55], cues: [.25, .88], rate: 9 });
 // Glut: it lands, spreads its wings low, throws its head back and snaps up a glowing moth torn from its prey's light;
 // its sac brightens with one more soul inside (a blow on its prey, then a heal)
 act('glut', 2.8, [[0, {}], [.22, K(GLUTW, { stand: 1, alt: 0, pitch: -.05, lsp: .25, look: .5, lf: 0, tal: .3, tu: -.25 }), 's'],
  [.44, { nk: -.4, hp: -.75, bk: .95, look: 0, bend: -.1 }, 'o'], [.52, { bk: .2, hp: -.5 }, 'i'], [.6, { glow: 2.2, swell: .14 }], [.8, K(RAISED, { alt: .6, stand: 0, glow: 1.4, dust: .5, swell: 0 }), 'o'], [1, K(BASE, { dust: 0 })]],
  { hits: [.5], cues: [.55], rate: 11 });
 act('hurt', .7, [[0, {}], [.16, { pitch: -.5, roll: .2, alt: 1.25, pz: -.15, nk: -.3, hp: -.3, ht: .3, wl: .5, wrr: -.45, wh: .6, fs: .8, lf: .55, tal: .9, flap: .3, plume: 1, bk: .5 }, 'o'], [1, BASE]], { interrupt: true, rate: 18 });
 act('block', .5, [[0, {}], [.3, K(GUARD, { flap: .2, nk: .2 })], [.7, {}], [1, BASE]], { interrupt: true, rate: 18 });
 // Released: beaten, it falls out of the air onto the ground, its wings spread flat; its sac splits open and all the
 // souls it swallowed rise out of it in a spiral of pale moths, up and away to the Moon. It lies spent, and stays.
 act('die', 5.6, [[0, {}], [.1, { pitch: -.4, roll: .3, wl: .4, wrr: -.4, alt: 1.4, flap: .4, plume: 1, bk: .6 }, 'o'],
  [.3, K(RELEASED, { alt: -.45, pitch: .1, plume: .4, dust: 1.5, bk: .2, glow: 1.2 }), 'i'], [.34, { alt: -.6, pitch: -.18, dust: 0, plume: 0 }],
  [.44, { split: .3, glow: 1.8, swell: .1 }], [.5, { split: .7, glow: 1.4 }], [.9, { split: 1, glow: .2, lid: .7 }], [1, { glow: .05, lid: .8 }]],
  { hold: true, interrupt: true, cues: [.3, .45, .7], rate: 9 });
 // Rising (not on the sheets; for the bench): its sac fills with light again and it beats up off the ground
 act('rise', 2.6, [[0, RELEASED], [.3, K(RELEASED, { split: 0, glow: .8, swell: .2, lid: .2, hp: -.2 })], [.5, K(RAISED, { stand: .3, alt: .3, glow: 1.2, dust: 1.2 }), 'o'],
  [.62, K(DOWNBEAT, { alt: 1.1, stand: 0 }), 'i'], [.75, K(BASE, { dust: 0 })], [1, BASE]], { snap: KEYS, cues: [.05, .5], rate: 8 });

 // ---------- runtime state ----------
 const state = { target: null, moths: 4 };
 const FIN = Object.assign({}, BASE), TGT = Object.assign({}, BASE);
 let actv = null, gOn = false, gW = 0, fadeE = 1, liftV = 0, walkS = 0, dashV = 0, lastName = '', lastU = 0, playN = 0;
 function play(name, force) {
  let def = ACTS[name]; if (!def) return false;
  const down = !!actv && actv.name === 'die';
  if (down && name === 'appear') { name = 'rise'; def = ACTS.rise; } // beaten, it is still there: it rises rather than flies in
  if (actv && !force) {
   if (down && name !== 'rise') return false;
   if (!down && !def.interrupt && !(actv.def.hold && actv.t >= actv.def.dur - 1e-6)) return false;
  }
  if (down && name !== 'rise' && !force) return false;
  if (def.snap) { for (const k of def.snap) FIN[k] = def.p[0][k]; TS.init = false; }
  if (name === 'appear' || name === 'rise') { state.moths = Math.max(state.moths, 4); MS.split = 0; }
  actv = { name, def, t: 0, n: ++playN, far: 0 };
  // Swoop reaches its prey from wherever it hovers: dash carries it there and back
  if (name === 'swoop') actv.far = Math.max(0, preyDist() - 1.3 * SZ);
  return true;
 }
 const _a = V3(), _b = V3(), _c = V3(), _d = V3(), _tg = V3(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion();
 function preyDist() { const tg = state.target; if (!tg) return 4 * SZ; root.updateMatrixWorld(true); root.getWorldPosition(_a); return Math.hypot(tg.x - _a.x, tg.z - _a.z); }

 // ---------- the runtime: wingbeats, an owl's head, legs that hang in flight and stand on the ground ----------
 const PH = 1 / 120, FMID = (FA[0] + FA[3]) / 2;
 const TS = { init: false, x: 0, vx: 0, y: 0, vy: 0, lx: [0, 0], lv: [0, 0] }; // the tail's sway and the hanging legs' lag, on springs
 const MS = { split: 0 }; // the sac: how far it has split
 const HD = { y: 0, p: 0, wait: 1, cock: 0, cockT: 0, cockW: 3 }, BL = { t: 0, wait: 2.5, on: 0 };
 let acc = 0, flapPh = 0, beats = 0;
 const _dA = V3(), _dB = V3(), _x1 = V3(), _x2 = V3(), _y1 = V3(), _y2 = V3(), _e = V3(), _w = V3(), _pp = V3(), _m1 = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _qa = new THREE.Quaternion(), _qbi = new THREE.Quaternion();
 const legQ = LEGS.map(() => [new THREE.Quaternion(), new THREE.Quaternion(), new THREE.Quaternion()]);
 // turn a bone (in base space) so its bind direction bd points along d, its bind pole bp toward p
 function aimBone(b, bd, bp, d, p) {
  _x1.copy(bp).addScaledVector(bd, -bp.dot(bd)).normalize(); _x2.crossVectors(bd, _x1);
  _y1.copy(p).addScaledVector(d, -p.dot(d)).normalize(); _y2.crossVectors(d, _y1);
  _m1.makeBasis(bd, _x1, _x2).transpose(); _m2.makeBasis(d, _y1, _y2).multiply(_m1);
  _qa.setFromRotationMatrix(_m2);
  b.parent.getWorldQuaternion(_q2); _q2.premultiply(_qbi);
  b.quaternion.copy(_q2.invert().multiply(_qa));
 }
 // standing: each foot planted under its hip, the hock bending back
 function legStand(L, P, out) {
  const [b0, b1, b2] = L.b, T = _c.set(L.s * (.25 + .12 * P.lsp), .1, .06 + P.pz);
  ground.localToWorld(T); base.worldToLocal(T);
  b0.getWorldPosition(_b); base.worldToLocal(_b);
  _a.subVectors(T, _b); const l1 = L.l1, l2 = L.l2, d = cl(_a.length(), Math.abs(l1 - l2) + .02, (l1 + l2) * .995); _a.normalize();
  fly.getWorldQuaternion(_q); _q.premultiply(_qbi); _d.set(0, .15, -1).normalize().applyQuaternion(_q);
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  _pp.copy(_d).addScaledVector(_a, -_d.dot(_a)).normalize();
  _e.copy(_b).addScaledVector(_a, a).addScaledVector(_pp, h); _w.copy(_b).addScaledVector(_a, d);
  aimBone(b0, L.bd0, L.pole, _dA.subVectors(_e, _b).normalize(), _d); out[0].copy(b0.quaternion); b0.updateMatrixWorld(true);
  aimBone(b1, L.bd1, L.pole, _dB.subVectors(_w, _e).normalize(), _d); out[1].copy(b1.quaternion); b1.updateMatrixWorld(true);
  ground.getWorldQuaternion(_qa); _qa.premultiply(_qbi); b1.getWorldQuaternion(_q2); _q2.premultiply(_qbi); out[2].copy(_q2.invert().multiply(_qa));
 }

 function animate(phase, walk, t, dt) {
  dt = dt > 0 ? Math.min(dt, .05) : 0;
  walk = cl(walk || 0, 0, 1);
  let u = 0, name = '';
  if (actv) { actv.t += dt; u = Math.min(1, actv.t / actv.def.dur); name = actv.name; if (u >= 1 && !actv.def.hold) actv = null; }
  if (actv) evalKeys(actv.def, u, TGT); else Object.assign(TGT, BASE);
  const k3 = (r) => (dt > 0 ? 1 - Math.exp(-dt * r) : 0);
  gW += ((gOn && !actv ? 1 : 0) - gW) * k3(7);
  walkS += ((actv ? 0 : walk) - walkS) * (dt > 0 ? k3(5) : 1);
  if (gW > 1e-3) for (const k in GUARD) TGT[k] = lerp(TGT[k], GUARD[k], gW);
  if (walkS > 1e-3) for (const k in WALK) TGT[k] = lerp(TGT[k], WALK[k], walkS * (1 - gW));
  const rate = actv ? actv.def.rate : 6, kk = k3(rate);
  for (const q of KEYS) FIN[q] += (TGT[q] - FIN[q]) * kk;
  const P = FIN, tt = t, down = name === 'die';
  dashV = 0;
  if (name === 'hurt') dashV = -1.6 * SZ * (1 - sm(.1, .5, u));
  else if (name === 'swoop' && actv && actv.far > 0) dashV = u > .2 && u < .46 ? actv.far / (.26 * actv.def.dur) : u > .56 && u < .86 ? -actv.far / (.3 * actv.def.dur) : 0;
  // ---------- the wingbeat: a slow, deep stroke, the wings swept forward and cupped on the way down and folded at the
  // elbow and wrist on the way up; the body rises with each downstroke ----------
  if (dt > 0) { const np = flapPh + dt * TAU / 1.25 * P.fr; if (np >= TAU && P.flap > .3) beats++; flapPh = np % TAU; }
  // (phase 0 is the top of the stroke; the downstroke is quick, the first 40% of the beat, the upstroke slow: on the way
  // down the wings drop, sweep forward, turn their skin to face the ground and spread their fingers; on the way up they
  // lift, fold a little and turn back)
  const fp = flapPh, A = cl(P.flap, 0, 1.2), pc = fp / TAU, D = pc < .4 ? sm(0, .4, pc) : 1 - sm(.4, 1, pc), Up = pc >= .4 ? Math.sin(PI * (pc - .4) / .6) : 0;
  const breath = Math.sin(tt * 1.4);
  const bob = A * .09 * Math.sin(TAU * (pc - .2)) * (1 - P.stand);
  fly.position.set(P.px, W0.fly.y + P.alt + bob + .01 * breath * P.stand, W0.fly.z + P.pz);
  fly.rotation.set(P.pitch + A * .04 * (D - .5), P.yaw + .02 * Math.sin(tt * .5) * (1 - P.stand), P.roll + .02 * Math.sin(tt * .7 + 1) * A);
  chest.rotation.set(P.bend + .012 * breath, 0, 0); chest.scale.set(1 + .012 * breath, 1, 1 + .012 * breath);
  root.updateMatrixWorld(true);
  base.getWorldQuaternion(_qbi).invert();
  // ---------- the head: it turns to its prey in quick owl's snaps, holds, glances, and now and then cocks its head ----------
  const tg = state.target; if (tg) _tg.set(tg.x, tg.y, tg.z); else root.localToWorld(_tg.set(0, 1.2, 6 * SZ));
  neck.getWorldPosition(_a); _b.copy(_tg).sub(_a); chest.getWorldQuaternion(_q); _b.applyQuaternion(_q.invert());
  const ay = cl(Math.atan2(_b.x, _b.z), -1.4, 1.4), ap = cl(Math.atan2(-_b.y, Math.hypot(_b.x, _b.z)), -.7, .9);
  if (dt > 0) {
   HD.wait -= dt;
   if (HD.wait <= 0) { HD.wait = r2(.6, 2.2); HD.gy = r2(-.25, .25) * (rnd2() < .7 ? 1 : 0); HD.gp = r2(-.08, .1); }
   HD.cockT += dt; if (HD.cockT > HD.cockW) { HD.cockT = 0; HD.cockW = r2(2.5, 6); HD.cock = rnd2() < .6 ? r2(-.38, .38) : 0; }
  }
  const lk = P.look * (1 - .3 * walkS);
  HD.y += (ay + (HD.gy || 0) - HD.y) * k3(9); HD.p += (ap + (HD.gp || 0) - HD.p) * k3(9);
  const cockV = HD.cock * win(HD.cockT, .1, Math.min(1.4, HD.cockW - .3), .15) * lk;
  neck.rotation.set(P.nk + HD.p * .35 * lk, HD.y * .4 * lk + P.hy * .4, 0);
  head.rotation.set(P.hp + HD.p * .55 * lk, HD.y * .6 * lk + P.hy * .6, P.ht + cockV);
  beak.rotation.set(P.bk * .55, 0, 0);
  if (dt > 0) { BL.t += dt; if (BL.t > BL.wait) { BL.t = 0; BL.wait = r2(2, 5.5); BL.on = .18; } BL.on = Math.max(0, BL.on - dt); }
  const lidV = Math.max(P.lid, BL.on > 0 ? Math.sin(BL.on / .18 * PI) : 0);
  for (let e = 0; e < 2; e++) lids[e].quaternion.setFromAxisAngle(EYEF[e].rt, lerp(-.62, .5, lidV));
  // ---------- the wings ----------
  for (const Wg of WINGS) {
   const s = Wg.s, one = s > 0 ? P.wl : P.wrr;
   const wu = P.wu + one - A * .8 * D + A * .1 * Up, wt = P.wt + A * .95 * D, wf = P.wf + A * .55 * D, we = P.we + A * .35 * Up, wh = P.wh - A * .55 * D + A * .3 * Up, fs = cl(P.fs + A * .3 * D, 0, 1), fc = P.fc + A * .3 * D;
   Wg.sh.rotation.set(wt, -s * wf, s * wu); Wg.el.rotation.set(0, s * we, -s * (we * .12 + P.wef)); Wg.wr.rotation.set(P.wr, s * wh, 0);
   Wg.F.forEach((f, k) => { f.A.rotation.set(0, s * (1 - fs) * (FMID - f.a), -s * fc * .35); f.B.rotation.set(0, 0, -s * fc * .5); });
  }
  // ---------- the tail: it sways and lags on a spring, and fans out ----------
  const nSteps = Math.min(8, Math.floor((acc + dt) / PH)); acc = nSteps === 8 ? 0 : acc + dt - nSteps * PH;
  const txT = P.tu + A * .06 * Math.sin(fp + 1) - P.pitch * .5, tyT = .05 * Math.sin(tt * .6) * (1 - P.stand);
  if (!TS.init) { TS.x = txT; TS.y = tyT; TS.vx = TS.vy = 0; TS.lx = [0, 0]; TS.lv = [0, 0]; TS.init = true; }
  for (let n = 0; n < nSteps; n++) { TS.vx += (60 * (txT - TS.x) - 7 * TS.vx) * PH; TS.x += TS.vx * PH; TS.vy += (40 * (tyT - TS.y) - 6 * TS.vy) * PH; TS.y += TS.vy * PH; }
  tail.rotation.set(TS.x, TS.y, 0); tail2.rotation.set(TS.x * .4, TS.y * .6, 0); tail2.scale.set(.75 + .6 * P.tfan, 1, 1);
  root.updateMatrixWorld(true);
  // ---------- the legs: in flight they hang and swing a little behind the body's bob; standing, the feet are planted ----------
  LEGS.forEach((L, i) => {
   const s = L.s, [b0, b1, b2, b3] = L.b, lagT = -bob * 2.5;
   for (let n = 0; n < nSteps; n++) { TS.lv[i] += (50 * (lagT - TS.lx[i]) - 6 * TS.lv[i]) * PH; TS.lx[i] += TS.lv[i] * PH; }
   b0.rotation.set(-P.lf + TS.lx[i] - P.pitch * .4, 0, s * P.lsp); b1.rotation.set(.3 - .25 * P.lf, 0, 0); b2.rotation.set(.45 * (1 - P.tal) - .1, 0, 0);
   b0.updateMatrixWorld(true);
   if (P.stand > .002) {
    const Qd = [b0.quaternion.clone(), b1.quaternion.clone(), b2.quaternion.clone()];
    legStand(L, P, legQ[i]);
    b0.quaternion.copy(Qd[0]).slerp(legQ[i][0], P.stand); b1.quaternion.copy(Qd[1]).slerp(legQ[i][1], P.stand); b2.quaternion.copy(Qd[2]).slerp(legQ[i][2], P.stand);
   }
   b3.rotation.set((.9 * (1 - P.tal) - .25) * (1 - P.stand) - .05 * P.stand, 0, 0);
  });
  root.updateMatrixWorld(true);
  // ---------- the sac and its souls ----------
  if (dt > 0) MS.split += (cl(P.split, 0, 1) - MS.split) * k3(4);
  const nIn = Math.round(cl(state.moths, 0, NIN)), pulse = .5 + .5 * Math.sin(tt * 1.7);
  sacB.scale.setScalar(1 + P.swell + .015 * pulse * (1 - MS.split));
  for (let i = 0; i < NIN; i++) {
   const a = tt * (.5 + .13 * i) + inPh[i] * 3, r = (.1 + .06 * Math.sin(tt * .7 + i)) * (1 + 2.5 * MS.split);
   inPos[i * 3] = Math.cos(a) * r; inPos[i * 3 + 1] = .07 * Math.sin(tt * .9 + i * 2) + MS.split * 1.2 * (i / NIN); inPos[i * 3 + 2] = Math.sin(a) * r * .8;
   inA[i] += ((i < nIn ? 1 : 0) * (1 - sm(.3, .7, MS.split)) - inA[i]) * (dt > 0 ? k3(3) : 1);
  }
  inG.attributes.position.needsUpdate = inG.attributes.aA.needsUpdate = true; inM.uniforms.uT.value = tt;
  const fk = cl(P.fade, 0, 1) * fadeE, gl = cl(P.glow, 0, 3) * (.9 + .1 * pulse);
  sacU.uGlow.value = gl; sacU.uT.value = tt; sacU.uSplit.value = MS.split; sacU.uA.value = fk;
  sacHalo.material.opacity = .32 * Math.min(1.6, gl) * fk * (1 - .8 * MS.split); sacHalo.scale.setScalar((1 + .3 * gl) * SZ);
  // ---------- looks ----------
  U.time.value = tt; U.dis.value = 1 - fk; U.skin.value = .9 * fk; U.fold.value = cl(P.fold, 0, 1); U.eye.value = 1 - .7 * cl(P.lid, 0, 1);
  sacB.getWorldPosition(U.sacP.value); U.sac.value = gl * fk * (1 - .7 * MS.split);
  sacL.position.copy(U.sacP.value); sacL.position.z += .25 * SZ; sacL.intensity = .9 * gl * fk * (1 - .8 * MS.split);
  liftV = Math.max(0, (P.alt + bob) * SZ);
  updateFX(name, u, tt, dt, fk, P);
  lastName = name; lastU = u;
 }

 // ---------- effects ----------
 const MOTHC = new THREE.Color(1, .97, .86), SOULC = new THREE.Color(.82, .88, 1), DUSTC = new THREE.Color(.3, .27, .24), HUSHC = new THREE.Color(.1, .08, .16), WINDC = new THREE.Color(.62, .62, .66), FEC = new THREE.Color(1, 1, 1);
 const fxS = { mote: 0, plume: 0, dust: 0, lure: 0, rel: 0, relA: 0, anyS: false };
 const crossed = (name, u, n, h) => name === n && lastName === n && lastU < h && u >= h;
 const tipPt = (Wg, out) => Wg.F[0].B.localToWorld(out.copy(Wg.F[0].d).multiplyScalar(Wg.F[0].len * (1 - PROX)));
 const beakPt = (out) => head.localToWorld(out.set(0, 2.2 - W0.head.y, .66 - W0.head.z));
 const _p0 = V3(), _rm = new THREE.Matrix4(), _rq = new THREE.Quaternion(), _rs = V3(), _up = V3(0, 1, 0);
 // a moth sent on its way: to the sac (1), to the beak (3), or spiralling up to the Moon (2)
 function moth(mode, from, T, size) {
  const i = emit(MO, from.x, from.y, from.z, 0, 0, 0, T, MOTHC, .95, size * SZ, size * SZ * (mode === 2 ? .7 : .8), 0, 0, 0, 0);
  MO.fo[i] = mode === 2 ? 3 : 10; // (on their way in they stay bright till they reach it)
  const M = MP[i]; M.mode = mode; M.a.copy(from); M.ph = r2(0, TAU); M.r = r2(.15, .5); M.h = r2(6, 9) * SZ; return M;
 }
 function burstFeathers(p, n, sp) { for (let i = 0; i < n; i++) emit(FE, p.x + r2(-.3, .3) * SZ, p.y + r2(-.3, .3) * SZ, p.z + r2(-.3, .3) * SZ, r2(-1, 1) * sp, r2(0, 1.2) * sp, r2(-1, 1) * sp, r2(2.2, 3.6), FEC, 1, r2(.14, .22) * SZ, r2(.12, .2) * SZ, 2.2, -.9, r2(-3, 3), r2(.3, .7)); }
 function dustRing(c, r0, r1, n, s, out) { for (let i = 0; i < n; i++) { const a = r2(0, TAU), r = r2(r0, r1) * SZ; emit(DU, c.x + Math.cos(a) * r, .12, c.z + Math.sin(a) * r, Math.cos(a) * out, r2(.2, .6), Math.sin(a) * out, r2(1.4, 2.2), DUSTC, .45, .7 * s * SZ, 2 * s * SZ, 1.3, .1); } }
 function gust(c, dir, n) { for (let i = 0; i < n; i++) for (let k = 0; k < NST; k++) { const S = ST[k]; if (S.t < 0) { S.t = 0; S.life = r2(.5, .9); const a = Math.atan2(dir.x, dir.z) + r2(-.9, .9); S.v.set(Math.sin(a), 0, Math.cos(a)).multiplyScalar(r2(7, 11) * SZ); S.p.set(c.x + r2(-1, 1) * SZ, r2(.08, .6) * SZ, c.z + r2(-1, 1) * SZ); S.len = r2(1.2, 2.4) * SZ; break; } } }
 function updateFX(name, u, t, dt, fk, P) {
  const amb = fk * (1 - MS.split);
  // the sac breathes out a few motes of soul-light
  fxS.mote += dt * 3 * amb * cl(P.glow, 0, 2.5); while (fxS.mote >= 1) { fxS.mote -= 1; const p = U.sacP.value, a = r2(0, TAU); emit(SP, p.x + Math.cos(a) * .25 * SZ, p.y + r2(-.2, .2) * SZ, p.z + Math.sin(a) * .25 * SZ, Math.cos(a) * .15, r2(.15, .45), Math.sin(a) * .15, r2(1.2, 2.2), SOULC, .8, .05 * SZ, .015 * SZ, .5, .1, 0, .2); }
  // feathers shaken loose; dust and gusts off the ground under its wings
  fxS.plume += dt * P.plume * 30 * fk; while (fxS.plume >= 1) { fxS.plume -= 1; chest.localToWorld(_a.set(r2(-.4, .4), r2(-.5, .5), r2(-.3, .3))); emit(FE, _a.x, _a.y, _a.z, r2(-1.2, 1.2), r2(-.2, 1), r2(-1.2, 1.2), r2(2.2, 3.6), FEC, 1, r2(.14, .22) * SZ, r2(.12, .2) * SZ, 2.2, -.9, r2(-3, 3), r2(.3, .7)); }
  fxS.dust += dt * P.dust * 40 * fk; while (fxS.dust >= 1) { fxS.dust -= 1; fly.getWorldPosition(_a); dustRing(_a, .6, 2.8, 1, 1, 2.2); }
  // its wingbeats stir the ground under it as it hovers low
  if (P.flap > .5 && P.alt < 1.4 && P.stand < .1 && Math.sin(flapPh) > .95 && rnd2() < dt * 30) { fly.getWorldPosition(_a); dustRing(_a, .8, 2.2, 2, .7, 1.6); }
  // ---------- Moonlure: moths drift in to the sac from all round ----------
  fxS.lure += dt * P.lure * 9 * fk;
  while (fxS.lure >= 1) {
   fxS.lure -= 1; const a = r2(0, TAU), r = r2(3.5, 6.5) * SZ, tg = state.target;
   if (tg && rnd2() < .35) _a.set(tg.x + r2(-.8, .8), tg.y + r2(-.3, .6), tg.z + r2(-.8, .8)); else { fly.getWorldPosition(_a); _a.x += Math.cos(a) * r; _a.z += Math.sin(a) * r; _a.y = r2(.6, 3.5) * SZ; }
   moth(1, _a, r2(1.6, 2.4), r2(.3, .4));
  }
  if (crossed(name, u, 'moonlure', .86)) state.moths = Math.min(NIN, state.moths + 2);
  // ---------- Glut: a moth torn from its prey's light flies up to its beak; it snaps it up ----------
  if (crossed(name, u, 'glut', .18)) { const tg = state.target; if (tg) _a.set(tg.x, tg.y + .3, tg.z); else root.localToWorld(_a.set(0, 1.2, 4)); moth(3, _a, (.5 - .18) * ACTS.glut.dur, .42); for (let i = 0; i < 16; i++) emit(SP, _a.x, _a.y, _a.z, r2(-1, 1), r2(0, 1.5), r2(-1, 1), r2(.6, 1), MOTHC, 1, .06 * SZ, .01 * SZ, 1, -1); }
  if (crossed(name, u, 'glut', .55)) { state.moths = Math.min(NIN, state.moths + 1); beakPt(_a); for (let i = 0; i < 20; i++) emit(SP, _a.x, _a.y, _a.z, r2(-1.2, 1.2), r2(-.5, 1.5), r2(-1.2, 1.2), r2(.5, .9), SOULC, 1, .06 * SZ, .01 * SZ, 1.5, -1); }
  // ---------- Wing Gale: the downbeat's blast ----------
  if (crossed(name, u, 'wingGale', .44)) {
   fly.getWorldPosition(_a); const tg = state.target; _b.set(0, 0, 1); if (tg) _b.set(tg.x - _a.x, 0, tg.z - _a.z).normalize();
   _c.set(_a.x, 0, _a.z); shock(_c.x, .05, _c.z, .5 * SZ, 9 * SZ, 1.1, DUSTC, .6, false); dustRing(_c, .5, 2.5, 30, 1.3, 4); gust(_c, _b, 22); burstFeathers(_a, 14, 2.5);
  }
  // ---------- Hush: a ring of dusk rolls out, and everything goes still ----------
  if (crossed(name, u, 'hush', .5)) { fly.getWorldPosition(_a); shock(_a.x, .06, _a.z, .3 * SZ, 10 * SZ, 1.8, HUSHC, .55, false); shock(_a.x, .07, _a.z, .2 * SZ, 7 * SZ, 1.4, SOULC, .12, true); }
  // ---------- Swoop: a rake of talons, feathers and dust ----------
  if (crossed(name, u, 'swoop', .5)) { const tg = state.target; if (tg) _a.set(tg.x, tg.y, tg.z); else root.localToWorld(_a.set(0, 1, 3)); burstFeathers(_a, 10, 2); dustRing(_a.setY(0), .2, 1.2, 10, .8, 2.5); }
  // ---------- hit: feathers fly ----------
  if (crossed(name, u, 'hurt', .06) || crossed(name, u, 'block', .2)) { chest.getWorldPosition(_a); burstFeathers(_a, name === 'hurt' ? 12 : 5, 2); }
  // ---------- Released: it hits the ground; its sac splits and the souls spiral up out of it to the Moon ----------
  if (crossed(name, u, 'die', .3)) { fly.getWorldPosition(_a); _a.y = 0; dustRing(_a, .4, 2.6, 34, 1.2, 3); burstFeathers(_a.setY(1), 16, 2.2); }
  if (crossed(name, u, 'die', .45)) {
   const p = U.sacP.value; fxS.rel = Math.min(MO.n - 4, 20 + Math.round(state.moths) * 5); fxS.relA = 0;
   for (let i = 0; i < 40; i++) emit(SP, p.x, p.y, p.z, r2(-2, 2), r2(0, 3), r2(-2, 2), r2(.8, 1.6), SOULC, 1, .07 * SZ, .01 * SZ, 1.2, -.5);
   state.moths = 0;
  }
  // (they come out of it over a second and a half, not all at once)
  if (fxS.rel > 0) { fxS.relA += dt * 28; while (fxS.relA >= 1 && fxS.rel > 0) { fxS.relA -= 1; fxS.rel--; moth(2, U.sacP.value, r2(3.5, 5.5), r2(.26, .4)); } }
  if (crossed(name, u, 'rise', .5) || crossed(name, u, 'appear', .8)) { fly.getWorldPosition(_a); _a.y = 0; dustRing(_a, .5, 2.4, 20, 1, 2.5); }
  // ---------- wingtip trails ----------
  const tk = cl(P.trail, 0, 1) * fk;
  if (tk > .01) {
   WINGS.forEach((Wg, r) => {
    const T = TRK[r], o = r * TRN * 6; tipPt(Wg, _a); Wg.wr.getWorldPosition(_b); _b.lerp(_a, .6);
    if (T.prev <= .01) for (let i = 0; i < TRN; i++) { T.tip[i].copy(_a); T.mid[i].copy(_b); }
    for (let i = TRN - 1; i > 0; i--) { T.tip[i].copy(T.tip[i - 1]); T.mid[i].copy(T.mid[i - 1]); }
    T.tip[0].copy(_a); T.mid[0].copy(_b);
    for (let i = 0; i < TRN; i++) { const k = tk * .5 * Math.pow(1 - i / (TRN - 1), 1.5); trPos.set([T.tip[i].x, T.tip[i].y, T.tip[i].z, T.mid[i].x, T.mid[i].y, T.mid[i].z], o + i * 6); trCol.set([.55 * k, .58 * k, .7 * k, .1 * k, .1 * k, .12 * k], o + i * 6); }
    T.prev = tk;
   });
   trail.visible = true; trG.attributes.position.needsUpdate = trG.attributes.color.needsUpdate = true;
  } else if (trail.visible) { trail.visible = false; TRK[0].prev = TRK[1].prev = 0; }
  // ---------- rings and gusts ----------
  for (const S of SHK) if (S.m.visible) { S.t += dt; const f = S.t / S.dur; if (f >= 1) { S.m.visible = false; continue; } const r = lerp(S.r0, S.r1, 1 - Math.pow(1 - f, 2)); S.m.scale.set(r, r, 1); S.m.material.uniforms.uA.value = S.a * (1 - f) * (1 - f); }
  let anyS = false;
  for (let k = 0; k < NST; k++) {
   const S = ST[k]; if (S.t < 0) continue; anyS = true;
   if (dt > 0) { S.t += dt; S.p.addScaledVector(S.v, dt); S.v.multiplyScalar(Math.exp(-dt * 1.5)); }
   if (S.t >= S.life) { S.t = -1; STR.setMatrixAt(k, M0); continue; }
   const f = S.t / S.life, ang = Math.atan2(S.v.x, S.v.z); _rq.setFromAxisAngle(_up, ang - PI / 2); _rs.set(S.len * (.4 + f), 1, 1 - f * .5);
   STR.setMatrixAt(k, _rm.compose(S.p, _rq, _rs));
  }
  if (anyS || fxS.anyS) STR.instanceMatrix.needsUpdate = true; fxS.anyS = anyS;
  STR.material.opacity = .5 * fk;
  // ---------- particles; moths on their paths ----------
  stepP(MO, dt, .15, t, (i, age, d) => {
   const M = MP[i]; if (!M.mode) return false;
   if (M.mode === 2) {
    const ang = M.ph + age * 9, r = (M.r + age * 1.8) * SZ;
    MO.pos[i * 3] = M.a.x + Math.cos(ang) * r; MO.pos[i * 3 + 1] = M.a.y + age * M.h + .2 * Math.sin(t * 3 + M.ph); MO.pos[i * 3 + 2] = M.a.z + Math.sin(ang) * r;
   } else {
    if (M.mode === 1) _b.copy(U.sacP.value); else beakPt(_b);
    const e = age * age * (3 - 2 * age), wob = (1 - e) * .5 * SZ;
    MO.pos[i * 3] = lerp(M.a.x, _b.x, e) + Math.sin(t * 3 + M.ph) * wob; MO.pos[i * 3 + 1] = lerp(M.a.y, _b.y, e) + Math.sin(t * 2.3 + M.ph * 2) * wob * .6; MO.pos[i * 3 + 2] = lerp(M.a.z, _b.z, e) + Math.cos(t * 2.7 + M.ph) * wob;
    if (age > .97) MO.life[i] = Math.min(MO.life[i], .02);
   }
   return true;
  });
  // (a moth's path ends with its life)
  for (let i = 0; i < MO.n; i++) if (MO.life[i] <= 0 && MP[i].mode) MP[i].mode = 0;
  stepP(FE, dt, .1, t); stepP(DU, dt, .25, t); stepP(SP, dt, .08, t);
 }

 // ---------- interface ----------
 const ACTIONS = {};
 for (const n in ACTS) { const d = ACTS[n]; ACTIONS[n] = Object.freeze({ dur: d.dur, hits: d.hits.slice(), cues: d.cues.slice(), hold: d.hold, interrupt: d.interrupt }); }
 Object.freeze(ACTIONS);
 const talonPt = (out) => { LEGS[0].b[3].getWorldPosition(out); LEGS[1].b[3].getWorldPosition(_d); return out.add(_d).multiplyScalar(.5); };
 function anchor(name, out) {
  out = out || V3();
  switch (name) {
   case 'head': return head.localToWorld(out.set(0, .05, .2));
   case 'beak': case 'mouth': return beakPt(out);
   case 'hit': case 'talons': return talonPt(out);                       // its talons (Swoop)
   case 'sac': case 'moon': return out.copy(U.sacP.value);              // the moon-sac under its chest
   case 'wingL': return tipPt(WINGS[0], out);
   case 'wingR': return tipPt(WINGS[1], out);
   case 'impact': { const tg = state.target; return tg ? out.set(tg.x, root.position.y, tg.z) : root.localToWorld(out.set(0, 0, 4 * SZ)); }
   case 'feet': return out.copy(root.position);
   default: return chest.localToWorld(out.set(0, .1, .3)); // 'chest' and anything else: its breast
  }
 }
 animate(0, 0, 0, 0);
 let tri = 0, draws = 0, nb = 0; const texs = new Set();
 root.traverse((o) => { if (o.isBone) nb++; if (o.isMesh || o.isPoints) { draws++; if (o.isMesh && o.geometry.index) tri += o.geometry.index.count / 3; else if (o.isMesh) tri += o.geometry.attributes.position.count / 3; for (const k of ['map', 'bumpMap', 'emissiveMap', 'alphaMap']) if (o.material[k]) texs.add(o.material[k].image); } });
 fx.traverse((o) => { if (o.isMesh || o.isPoints || o.isSprite) draws++; });
 const API = {
  root, fx, animate, play, ACTIONS, anchor,
  guard(on) { gOn = !!on; },
  reset() {
   actv = null; gOn = false; gW = 0; Object.assign(FIN, BASE); TS.init = false; MS.split = 0; state.moths = 4; fxS.rel = 0;
   for (const P of [MO, FE, DU, SP]) { P.life.fill(0); P.live = 2; }
   for (const M of MP) M.mode = 0;
   for (let k = 0; k < NST; k++) { ST[k].t = -1; STR.setMatrixAt(k, M0); } STR.instanceMatrix.needsUpdate = true;
   for (const S of SHK) S.m.visible = false; trail.visible = false; TRK[0].prev = TRK[1].prev = 0;
  },
  get busy() { return !!actv && !(actv.def.hold && actv.t >= actv.def.dur - 1e-6); },
  get action() { return actv ? actv.name : ''; },
  get progress() { return actv ? Math.min(1, actv.t / actv.def.dur) : -1; },
  get dash() { return dashV; }, get lift() { return liftV; },
  get beats() { return beats; }, // wingbeats so far (one more at the top of each stroke): for a whoosh of air
  get state() { return state; }, set state(v) { if (v) Object.assign(state, v); },
  setFade(f) { fadeE = cl(+f, 0, 1); },
  get down() { return !!actv && actv.name === 'die' && actv.t >= actv.def.dur - 1e-6; }, // beaten, lying spent on the ground
  get gone() { return false; },                    // beaten, it stays on the field (see down)
  height: 2.8 * SZ, wingspan: 9 * SZ, length: 2.2 * SZ, reach: 3 * SZ, variant: 'gloamwing',
  stats: { triangles: Math.round(tri), drawCalls: draws, textures: texs.size, bones: nb }
 };
 if (opts.tune) { const B0 = Object.assign({}, BASE); API._tune = (o) => { Object.assign(BASE, B0, o); Object.assign(FIN, BASE); }; } // (for tuning poses only)
 return API;
}
