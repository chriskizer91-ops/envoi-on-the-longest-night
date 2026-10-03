// From Chris's Bramble Horror bench (reference/demos/bramble-horror-bench.html, October 3, 2026), unchanged.
// bramble.js: the Bramble Horror, a patient predator of the Wildlands of the Southern Isles. three.js r128 (global THREE).
// Defines makeBramble(opts) only. Built from its two sheets (reference/art/bramble-variants and bramble-moves): what looks
// like a lush, unusually fruitful blackberry thicket is a root crown of twisted woody roots with six thorny canes that rise,
// orient on prey, offer their berries as a lure, lash out, hook with recurved thorns, wrap and drag prey to the crown and
// feed through the roots. No face: its intent shows only in how the canes move together.
// Rooted. Patient. Hungry. It recoils from fire and heavy blows, and can lose canes and keep fighting (sever()).
// The polish (October 3, 2026) keeps every cane, root and leaf where the sheets' build put them, and adds: carved bark and
// root wood, bigger pale-tipped hooked thorns, pale leaf undersides, a feeding hollow in the crown whose root veins glow
// berry-magenta as it feeds, fruit that swells as it lures, idle canes that taste the air, sap and berry juice, a held prey
// (anchor 'held', holding), fruit that drops when it dies, and two moves that are not on the sheets: Undergrowth (shoots burst
// up round the prey and close) and Scorch (its recoil from fire, leaves charring).
// Its second pass (the same day) adds: canes on springs that lag, whip and overshoot; tips that coil sideways round the
// prey and stretch to reach it, and a Grab that yanks its prey in; ribbons of stolen life in Consume; a heartbeat through
// the roots once it has shown itself; and growing up out of the soil as it appears.
// opts: { detail .5 to 1, level 1 to 20 (bigger, darker, more fruit, longer thorns, veins that glow at rest), variant:
//         'classic' | 'ambush' | 'towering' | 'ancient', size (an extra overall scale, 1 = the sheets: about 3.8 m across
//         with the canes spread, 3-5 m by variant) }
function makeBramble(opts) {
 'use strict';
 // Units are meters, Y up, facing +Z, the root crown on the ground at the origin. Its right side is -X; the lead cane
 // (the one that lures and strikes) is the front cane on its right.
 opts = opts || {};
 const DET = Math.max(.5, Math.min(1, opts.detail === undefined ? 1 : +opts.detail || 1));
 const Q = (n, m) => Math.max(m || 3, Math.round(n * DET));
 const TAU = Math.PI * 2, PI = Math.PI;
 let seed = 77001;
 const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
 const rr = (a, b) => a + (b - a) * rnd();
 // a second stream for everything the polish added, so the first keeps every cane, root and leaf where it was
 let seed2 = 31337;
 const rnd2 = () => (seed2 = (seed2 * 16807) % 2147483647) / 2147483647;
 const r2 = (a, b) => a + (b - a) * rnd2();
 const cl = (v, a, b) => (v < a ? a : v > b ? b : v);
 const sm = (a, b, x) => { const t = cl((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
 const lerp = (a, b, t) => a + (b - a) * t;
 const win = (u, a, b, e) => sm(a - e, a + e, u) * (1 - sm(b - e, b + e, u));
 const V3 = (x, y, z) => new THREE.Vector3(x || 0, y || 0, z || 0);
 const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
 const tex = (c, rx, ry) => { const t = new THREE.CanvasTexture(c); if (rx) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry || rx); } t.anisotropy = 4; return t; };
 const YAX = V3(0, 1, 0);

 // ---------- the variant: four growth forms from the variants sheet, and the level look ----------
 // n canes, L cane length, rB/rT cane radius at base and tip, CR/CH root crown radius and height, leaf and berry
 // density, lift (the canes' resting rise), horns (huge old woody canes), thick (roots), moss, K (overall scale)
 const VARS = {
  classic: { n: 6, L: 2.4, rB: .088, rT: .02, CR: .62, CH: .5, leaf: 1, berry: 1, lift: 0, curl: 0, horns: 0, thick: 1, moss: .12, shoots: 6, K: 1 },
  ambush: { n: 6, L: 2.25, rB: .082, rT: .019, CR: .74, CH: .4, leaf: 1.45, berry: .85, lift: -.32, curl: .25, horns: 0, thick: 1, moss: .45, shoots: 9, K: 1 },
  towering: { n: 6, L: 2.95, rB: .094, rT: .02, CR: .56, CH: .6, leaf: .85, berry: 1, lift: .32, curl: -.35, horns: 0, thick: 1.05, moss: .08, shoots: 5, K: 1 },
  ancient: { n: 7, L: 2.75, rB: .115, rT: .024, CR: .86, CH: .7, leaf: 1.1, berry: 1.15, lift: .04, curl: .05, horns: 3, thick: 1.45, moss: .7, shoots: 5, K: 1.28 },
 };
 const VNAME = VARS[opts.variant] ? opts.variant : 'classic';
 const VR = VARS[VNAME];
 const LEVEL = cl(opts.level === undefined ? 1 : Math.round(+opts.level) || 1, 1, 20);
 const TIER = (LEVEL - 1) / 19;
 const SZ = VR.K * (1 + .12 * TIER) * (opts.size > 0 ? +opts.size : 1);
 const NC = VR.n, CL = VR.L, CR = VR.CR, CH = VR.CH;
 const NS = 8, SEG = CL / NS;                               // bones along a cane: NS segments, NS + 1 bones
 const DARK = 1 - .18 * TIER;
 const THS = (1 + .3 * TIER) * (VNAME === 'ancient' ? 1.12 : 1);   // thorn size: longer with age and level
 const VEIN = (VNAME === 'ancient' ? .3 : 0) + .55 * sm(.3, 1, TIER); // how much the root veins glow at rest

 const root = new THREE.Group(); root.name = 'BrambleHorror_' + VNAME;
 const base = new THREE.Group(); root.add(base);            // everything of the body, scaled by SZ
 const fx = new THREE.Group(); fx.name = root.name + 'FX';

 // ---------- painted textures ----------
 const css = (r, g, b, a) => `rgba(${r | 0},${g | 0},${b | 0},${a === undefined ? 1 : a})`;
 const hex = (h, a) => { const n = parseInt(h.slice(1), 16); return css(n >> 16, (n >> 8) & 255, n & 255, a); };
 // a tiling normal map carved from a painting's light and dark: light streaks stand up as ridges, dark ones sink as grooves
 function normalFrom(src, k) {
  const W = src.width, H = src.height, s = src.getContext('2d').getImageData(0, 0, W, H).data, h = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) h[i] = (s[i * 4] * .3 + s[i * 4 + 1] * .59 + s[i * 4 + 2] * .11) / 255;
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
 // cane bark: dark purple-brown with long warm and olive streaks, a waxy bloom and pale lenticels; u around, v along
 const barkMap = (() => {
  const W = 128, H = 512, c = cvs(W, H), g = c.getContext('2d');
  const sh = (k) => Math.round(k * DARK);
  g.fillStyle = css(sh(44), sh(25), sh(26)); g.fillRect(0, 0, W, H);
  const streak = (x, w, col, a) => { for (const ox of [-W, 0, W]) { const gr = g.createLinearGradient(x + ox - w, 0, x + ox + w, 0); gr.addColorStop(0, hex(col, 0)); gr.addColorStop(.5, hex(col, a)); gr.addColorStop(1, hex(col, 0)); g.fillStyle = gr; g.fillRect(x + ox - w, 0, w * 2, H); } };
  for (let i = 0; i < 26; i++) streak(rnd() * W, 2 + rnd() * 9, ['#4e2c26', '#1c0e10', '#3a3a20', '#62402e', '#2e1820'][i % 5], .25 + rnd() * .35);
  for (let i = 0; i < 9; i++) streak(rnd() * W, 4 + rnd() * 10, '#6a5a66', .05 + rnd() * .06); // bloom
  g.lineCap = 'round';
  for (let i = 0; i < 140; i++) { // fine fibres that wander a little
   const x = rnd() * W, y = rnd() * H, l = 20 + rnd() * 90; g.strokeStyle = rnd() < .5 ? 'rgba(20,10,12,.35)' : 'rgba(150,100,90,.16)'; g.lineWidth = .6 + rnd() * 1.2;
   g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + (rnd() - .5) * 4, y + l * .3, x + (rnd() - .5) * 4, y + l * .7, x + (rnd() - .5) * 3, y + l); g.stroke();
  }
  for (let i = 0; i < 70; i++) { const x = rnd() * W, y = rnd() * H, w = 2 + rnd() * 4; g.fillStyle = 'rgba(160,128,108,.55)'; g.fillRect(x, y, w, 1.2); g.fillStyle = 'rgba(20,10,10,.4)'; g.fillRect(x, y + 1.2, w, 1); }
  for (const ny of [.12, .45, .79]) { const y = ny * H, gr = g.createLinearGradient(0, y - 10, 0, y + 10); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.5, 'rgba(25,10,14,.4)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, y - 10, W, 20); }
  return tex(c, 1, 1);
 })();
 // root wood: grey-brown fibres twisting around old roots, moss in the crevices
 const woodMap = (() => {
  const W = 256, H = 256, c = cvs(W, H), g = c.getContext('2d');
  g.fillStyle = '#4a3828'; g.fillRect(0, 0, W, H);
  g.lineCap = 'round';
  for (let i = 0; i < 90; i++) {
   const x = rnd() * W, col = rnd(); g.strokeStyle = col < .45 ? 'rgba(24,16,10,.6)' : col < .8 ? 'rgba(104,80,58,.45)' : 'rgba(150,124,94,.35)'; g.lineWidth = 1 + rnd() * 4;
   // a 45-degree twist with a wobble that repeats every H, so the texture tiles both ways
   for (const ox of [-2 * W, -W, 0, W]) { g.beginPath(); for (let y = 0; y <= H; y += 4) { const xx = x + ox + y + Math.sin(y * TAU / H * 3 + i) * 5; if (y) g.lineTo(xx, y); else g.moveTo(xx, y); } g.stroke(); }
  }
  for (let i = 0; i < 900; i++) { g.fillStyle = rnd() < .6 ? 'rgba(0,0,0,.2)' : 'rgba(170,140,110,.1)'; g.fillRect(rnd() * W, rnd() * H, 1, 2 + rnd() * 5); }
  const moss = VR.moss;
  for (let i = 0; i < 60 * moss; i++) { const x = rnd() * W, y = rnd() * H, r = 6 + rnd() * 20, q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, 'rgba(84,104,46,.55)'); q.addColorStop(1, 'rgba(84,104,46,0)'); g.fillStyle = q; for (const ox of [-W, 0, W]) for (const oy of [-H, 0, H]) g.fillRect(x - r + ox, y - r + oy, r * 2, r * 2); }
  return tex(c, 1, 1);
 })();
 // the bark's streaks, lenticels and nodes, and the roots' twisting fibres, carved into normal maps
 const barkN = tex(normalFrom(barkMap.image, 2.4), 1, 1), woodN = tex(normalFrom(woodMap.image, 3), 1, 1);
 // leaves: an atlas of four compound leaves, each in a 512 square with its stalk at the bottom middle:
 // 0 three leaflets, 1 five leaflets, 2 a young bronze leaf, 3 a dead brown one
 const PAL = [
  { d: [16, 34, 16], m: [32, 62, 26], l: [62, 102, 40], v: [112, 150, 70], e: [22, 46, 18] },
  { d: [14, 32, 18], m: [28, 58, 28], l: [56, 96, 42], v: [104, 144, 70], e: [20, 42, 20] },
  { d: [58, 22, 16], m: [94, 44, 26], l: [128, 80, 44], v: [168, 120, 76], e: [70, 30, 20] },
  { d: [48, 34, 20], m: [78, 58, 34], l: [108, 82, 50], v: [140, 114, 74], e: [60, 42, 24] }];
 function leaflet(g, x0, y0, len, wid, ang, P, s) {
  const pts = [], N = 46, teeth = 15 + ((s * 7) | 0) % 5;
  const half = (f) => .5 * wid * Math.pow(Math.sin(PI * Math.pow(f, .78)), .85) * (1 - .25 * Math.pow(f, 5));
  const tooth = (f) => { const k = f * teeth, fr = k - Math.floor(k); return f < .06 || f > .96 ? 0 : wid * .045 * Math.pow(fr, 1.6) * (Math.floor(k) % 3 === 0 ? 1.5 : 1); };
  for (let i = 0; i <= N; i++) { const f = i / N; pts.push([half(f) + tooth(f), f * len]); }
  for (let i = N; i >= 0; i--) { const f = i / N; pts.push([-half(f) - tooth(f + .5 / teeth), f * len]); }
  g.save(); g.translate(x0, y0); g.rotate(ang);
  const path = () => { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], -p[1]) : g.moveTo(p[0], -p[1]))); g.closePath(); };
  path(); g.save(); g.clip();
  const gr = g.createLinearGradient(0, 0, 0, -len); gr.addColorStop(0, css(...P.d)); gr.addColorStop(.35, css(...P.m)); gr.addColorStop(1, css(...P.m.map((v, i) => lerp(v, P.l[i], .35))));
  g.fillStyle = gr; g.fillRect(-wid, -len * 1.05, wid * 2, len * 1.1);
  // blistered tissue between the veins: light bulges, dark creases along each vein
  const nv = 8;
  for (let k = 0; k < nv; k++) {
   const f = .1 + k / nv * .82, y = -f * len, hw = half(f);
   for (const sd of [-1, 1]) {
    const bx = sd * hw * .5, by = y - len * .03, q = g.createRadialGradient(bx, by, 0, bx, by, hw * .55);
    q.addColorStop(0, css(...P.l, .5)); q.addColorStop(1, css(...P.l, 0)); g.fillStyle = q; g.fillRect(bx - hw, by - hw, hw * 2, hw * 2);
   }
  }
  for (let i = 0; i < 70; i++) { const x = (rnd() - .5) * wid, y = -rnd() * len, r = 2 + rnd() * 7; g.fillStyle = rnd() < .5 ? css(...P.d, .18) : css(...P.l, .12); g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
  // veins: crease (dark) then the vein itself (light), a midrib and curving laterals toward the tip
  const vein = (sd, f, w) => { const y0v = -f * len, hw = half(Math.min(.98, f + .08)); g.beginPath(); g.moveTo(0, y0v); g.quadraticCurveTo(sd * hw * .45, y0v - len * .03, sd * hw * .92, y0v - len * .1); g.lineWidth = w; g.stroke(); };
  g.lineCap = 'round';
  g.strokeStyle = css(...P.d, .7); for (let k = 0; k < nv; k++) for (const sd of [-1, 1]) vein(sd, .1 + k / nv * .82, 4.5);
  g.strokeStyle = css(...P.v, .75); for (let k = 0; k < nv; k++) for (const sd of [-1, 1]) vein(sd, .1 + k / nv * .82, 1.6);
  g.strokeStyle = css(...P.d, .7); g.lineWidth = 6; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -len * .97); g.stroke();
  g.strokeStyle = css(...P.v, .9); g.lineWidth = 2.4; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -len * .97); g.stroke();
  // a soft glossy sheen and a slightly darker, then lighter, rim
  const sh = g.createLinearGradient(-wid * .5, 0, wid * .5, 0); sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(.62, 'rgba(230,255,210,.1)'); sh.addColorStop(.75, 'rgba(255,255,255,0)'); g.fillStyle = sh; g.fillRect(-wid, -len, wid * 2, len);
  g.restore();
  path(); g.strokeStyle = css(...P.e, .9); g.lineWidth = 3; g.stroke(); g.strokeStyle = css(...P.l, .55); g.lineWidth = 1; g.stroke();
  g.restore();
 }
 const leafMap = (() => {
  const S = 512, c = cvs(S * 2, S * 2), g = c.getContext('2d');
  for (let k = 0; k < 4; k++) {
   const ox = (k % 2) * S, oy = Math.floor(k / 2) * S, P = PAL[k], cx = ox + S / 2, by = oy + S - 6, jy = oy + S * .7;
   g.save(); g.beginPath(); g.rect(ox, oy, S, S); g.clip();
   g.strokeStyle = k === 3 ? '#6a4a2a' : '#5a3a26'; g.lineCap = 'round'; g.lineWidth = 9; g.beginPath(); g.moveTo(cx, by); g.lineTo(cx, jy); g.stroke();
   if (k === 1) { leaflet(g, cx, jy + 30, S * .27, S * .17, -1.75, P, 4); leaflet(g, cx, jy + 30, S * .27, S * .17, 1.75, P, 5); }
   if (k !== 3) { leaflet(g, cx, jy, S * .44, S * .29, -.95, P, 1); leaflet(g, cx, jy, S * .44, S * .29, .95, P, 2); }
   leaflet(g, cx, jy, S * (k === 3 ? .66 : .58), S * (k === 3 ? .4 : .36), 0, P, 3);
   if (k === 3) { g.globalCompositeOperation = 'source-atop'; for (let i = 0; i < 40; i++) { const x = ox + rnd() * S, y = oy + rnd() * S, r = 5 + rnd() * 22; g.fillStyle = rnd() < .5 ? 'rgba(60,38,20,.35)' : 'rgba(180,150,90,.2)'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); } }
   // the wine-dark blotches old bramble leaves take on, and a few orange rust spots
   if (k === 1) { g.globalCompositeOperation = 'source-atop'; for (let i = 0; i < 16; i++) { const x = ox + r2(.12, .88) * S, y = oy + r2(.08, .72) * S, r = r2(14, 40), q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, 'rgba(92,20,52,.5)'); q.addColorStop(1, 'rgba(92,20,52,0)'); g.fillStyle = q; g.fillRect(x - r, y - r, r * 2, r * 2); } }
   if (k === 0) { g.globalCompositeOperation = 'source-atop'; for (let i = 0; i < 26; i++) { const x = ox + r2(.15, .85) * S, y = oy + r2(.1, .7) * S, r = r2(1.5, 4); g.fillStyle = 'rgba(214,120,40,.55)'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); } }
   g.restore();
  }
  const t = tex(c); t.generateMipmaps = true; return t;
 })();
 // the soil patch under the crown: dark earth fading out, crumbs, pebbles and fallen leaves
 const soilMap = (() => {
  const S = 512, c = cvs(S, S), g = c.getContext('2d'), h = S / 2;
  const q = g.createRadialGradient(h, h, 0, h, h, h); q.addColorStop(0, 'rgba(36,26,18,.95)'); q.addColorStop(.45, 'rgba(44,32,22,.8)'); q.addColorStop(.8, 'rgba(50,38,26,.3)'); q.addColorStop(1, 'rgba(50,38,26,0)');
  g.fillStyle = q; g.fillRect(0, 0, S, S);
  g.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < 2600; i++) { const a = rnd() * TAU, r = Math.sqrt(rnd()) * h, x = h + Math.cos(a) * r, y = h + Math.sin(a) * r; g.fillStyle = rnd() < .5 ? 'rgba(14,9,6,.5)' : 'rgba(96,76,54,.35)'; g.fillRect(x, y, 1 + rnd() * 2.5, 1 + rnd() * 2.5); }
  for (let i = 0; i < 40; i++) { const a = rnd() * TAU, r = Math.sqrt(rnd()) * h * .85, x = h + Math.cos(a) * r, y = h + Math.sin(a) * r, s = 2 + rnd() * 5; g.fillStyle = 'rgba(120,108,96,.7)'; g.beginPath(); g.ellipse(x, y, s, s * .7, rnd() * 3, 0, TAU); g.fill(); g.fillStyle = 'rgba(20,14,10,.5)'; g.beginPath(); g.ellipse(x + 1, y + 1.5, s, s * .5, 0, 0, Math.PI); g.fill(); }
  for (let i = 0; i < 26; i++) { const a = rnd() * TAU, r = (.35 + .55 * rnd()) * h, x = h + Math.cos(a) * r, y = h + Math.sin(a) * r, s = 6 + rnd() * 9; g.save(); g.translate(x, y); g.rotate(rnd() * TAU); g.fillStyle = rnd() < .6 ? 'rgba(110,82,46,.7)' : 'rgba(64,84,40,.6)'; g.beginPath(); g.ellipse(0, 0, s, s * .45, 0, 0, TAU); g.fill(); g.restore(); }
  for (let i = 0; i < 14; i++) { const a = rnd() * TAU, r = (.3 + .6 * rnd()) * h, x = h + Math.cos(a) * r, y = h + Math.sin(a) * r, l = 10 + rnd() * 24, b = rnd() * TAU; g.strokeStyle = 'rgba(70,50,34,.7)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(b) * l, y + Math.sin(b) * l); g.stroke(); }
  return tex(c);
 })();
 // sprites: a soft dot, a dust puff and a single falling leaflet (painted pale so each particle can be tinted)
 function radial(stops, s) { const c = cvs(s, s), g = c.getContext('2d'), h = s / 2, gr = g.createRadialGradient(h, h, 0, h, h, h); for (const [o, col] of stops) gr.addColorStop(o, col); g.fillStyle = gr; g.fillRect(0, 0, s, s); return tex(c); }
 const dotT = radial([[0, 'rgba(255,255,255,1)'], [.25, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']], 64);
 const puffT = (() => { const c = cvs(128, 128), g = c.getContext('2d'); for (let i = 0; i < 26; i++) { const x = 36 + rnd() * 56, y = 36 + rnd() * 56, r = 12 + rnd() * 24, q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, 'rgba(255,255,255,.26)'); q.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = q; g.fillRect(0, 0, 128, 128); } const m = g.createRadialGradient(64, 64, 28, 64, 64, 63); m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)'); g.globalCompositeOperation = 'destination-in'; g.fillStyle = m; g.fillRect(0, 0, 128, 128); return tex(c); })();
 const leafT = (() => { const c = cvs(64, 64), g = c.getContext('2d'); leaflet(g, 32, 60, 54, 34, 0, { d: [150, 150, 150], m: [210, 210, 210], l: [250, 250, 250], v: [255, 255, 255], e: [170, 170, 170] }, 9); return tex(c); })();
 // a tongue of flame: a hot core low down, licking up to a point (drawn upright; flame particles never spin)
 const flameT = (() => {
  const S = 128, c = cvs(S, S), g = c.getContext('2d');
  for (const [w, a] of [[30, .35], [20, .6], [11, 1]]) {
   g.beginPath(); g.moveTo(64, 6); g.bezierCurveTo(64 + w * .5, 40, 64 + w, 78, 64 + w * .7, 104); g.quadraticCurveTo(64, 128, 64 - w * .7, 104); g.bezierCurveTo(64 - w, 78, 64 - w * .5, 40, 64, 6);
   const q = g.createLinearGradient(0, 0, 0, S); q.addColorStop(0, 'rgba(255,255,255,0)'); q.addColorStop(.55, 'rgba(255,255,255,' + a * .7 + ')'); q.addColorStop(.85, 'rgba(255,255,255,' + a + ')'); q.addColorStop(1, 'rgba(255,255,255,' + a * .5 + ')');
   g.fillStyle = q; g.fill();
  }
  return tex(c);
 })();
 // the ground splitting for Undergrowth, painted into three channels: red the fissure and the cracks off it, green the
 // glowing root that runs along the bottom of it, blue the lips of torn-up earth either side (the strip is about 1 m wide)
 const crackT = (() => {
  const W = 512, H = 128, c = cvs(W, H), g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'lighter'; g.lineCap = g.lineJoin = 'round';
  const line = [], fork = [];
  for (let x = 0, y = H / 2; x <= W; x += 10) { y = cl(y + r2(-7, 7), H * .38, H * .62); line.push([x, y]); if (x > 30 && x < W - 50 && rnd2() < .28) fork.push([x, y]); }
  const stroke = (pts, col, w, oy) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1] + (oy || 0)) : g.moveTo(p[0], p[1] + (oy || 0)))); g.stroke(); };
  stroke(line, 'rgba(0,0,255,.35)', 22, -17); stroke(line, 'rgba(0,0,255,.35)', 22, 17);
  for (const [x, y] of fork) { const pts = [[x, y]]; let px = x, py = y; const a = (rnd2() < .5 ? -1 : 1) * r2(.6, 1.2); for (let i = 0; i < 5; i++) { px += 8 + rnd2() * 7; py += Math.sin(a) * (6 + rnd2() * 6); pts.push([px, py]); } stroke(pts, 'rgba(255,0,0,.75)', 6); stroke(pts, 'rgba(0,0,255,.2)', 12); }
  stroke(line, 'rgba(255,0,0,.6)', 30); stroke(line, 'rgba(255,0,0,.95)', 16);
  stroke(line, 'rgba(0,255,0,.45)', 11); stroke(line, 'rgba(0,255,0,1)', 4);
  return tex(c);
 })();

 // ---------- materials ----------
 // Shader additions shared by the body: a dissolve that burns away with a glowing edge (appear, defeat, setFade), a clean
 // break through a severed cane and the burn-away of the piece that fell (uCut, one per cane), leaves rustling along their
 // normals and thinning out as it takes damage (state.wilt), withering to brown on defeat, and a cool rim light so the dark
 // canes read against a dark painting. The polish adds: veins in the root wood that glow berry-magenta from the crevices
 // out (uVein: x feeding, y where a pulse has run to along the roots, z that pulse's strength, w the glow at rest), leaves
 // and bark that char from fire with a glowing edge while it burns (uChar, uBurn), and leaves paler underneath.
 const MAXC = 10;
 const U = {
  time: { value: 0 }, flut: { value: 1 }, dis: { value: 0 }, disCol: { value: new THREE.Color(0xffa040) }, with: { value: 0 }, thin: { value: 0 },
  rim: { value: .32 }, rimC: { value: new THREE.Color(0x8c8ab8) }, cut: { value: Array.from({ length: MAXC }, () => new THREE.Vector4(2, 2, 0, 0)) },
  vein: { value: new THREE.Vector4(0, -1, 0, VEIN) }, veinC: { value: new THREE.Color(1, .14, .42) }, char: { value: 0 }, burn: { value: 0 }
 };
 const NOISE = 'float brH(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}\n' +
  'float brN(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(brH(i),brH(i+vec3(1,0,0)),f.x),mix(brH(i+vec3(0,1,0)),brH(i+vec3(1,1,0)),f.x),f.y),mix(mix(brH(i+vec3(0,0,1)),brH(i+vec3(1,0,1)),f.x),mix(brH(i+vec3(0,1,1)),brH(i+vec3(1,1,1)),f.x),f.y),f.z);}\n';
 function patch(m, o) {
  const key = 'bramble-' + (o.flut ? 'f' : '') + (o.cut ? 'c' : '') + (o.rim ? 'r' : '') + (o.vein ? 'v' : '') + (o.char ? 'h' + o.char : '');
  const rimS = { value: o.rim || 0 }, withC = { value: o.withC || new THREE.Color(.4, .3, .2) };
  m.onBeforeCompile = (sh) => {
   Object.assign(sh.uniforms, { uTime: U.time, uFlut: U.flut, uDis: U.dis, uDisCol: U.disCol, uWith: U.with, uWithC: withC, uThin: U.thin, uRim: U.rim, uRimC: U.rimC, uRimS: rimS, uCut: U.cut,
    uVein: U.vein, uVeinC: U.veinC, uChar: U.char, uBurn: U.burn });
   let vs = sh.vertexShader, fs = sh.fragmentShader;
   vs = 'varying vec3 vDP;\nuniform float uTime;\nuniform float uFlut;\n' + (o.cut ? 'attribute vec2 aCn;\nuniform vec4 uCut[' + MAXC + '];\nvarying float vCs;\nvarying vec4 vCut;\n' : '') +
    (o.flut ? 'attribute vec4 aFl;\nvarying float vThinR;\n' : '') + (o.vein ? 'attribute vec2 aVn;\nvarying vec2 vVn;\n' : '') + vs;
   vs = vs.replace('#include <begin_vertex>', '#include <begin_vertex>\n vDP = position;\n' + (o.vein ? ' vVn = aVn;\n' : '') +
    (o.cut ? ' vCs = aCn.y; vCut = vec4(2., 2., 0., 0.); if (aCn.x > -.5) { int ci = int(aCn.x + .5); for (int i = 0; i < ' + MAXC + '; i++) { if (i == ci) vCut = uCut[i]; } }\n' : '') +
    (o.flut ? ' { float a = aFl.x * uFlut; transformed += normal * a * (.035 * sin(uTime * 2.3 + aFl.y) + .02 * sin(uTime * 5.3 + aFl.y * 1.7) + .01 * sin(uTime * 9.1 + aFl.y * 2.9)); vThinR = aFl.z; }\n' : ''));
   fs = 'varying vec3 vDP;\nuniform float uTime;\nuniform float uDis;\nuniform vec3 uDisCol;\nuniform float uWith;\nuniform vec3 uWithC;\nuniform float uThin;\nuniform float uRim;\nuniform float uRimS;\nuniform vec3 uRimC;\n' +
    'uniform vec4 uVein;\nuniform vec3 uVeinC;\nuniform float uChar;\nuniform float uBurn;\n' +
    (o.cut ? 'varying float vCs;\nvarying vec4 vCut;\n' : '') + (o.flut ? 'varying float vThinR;\n' : '') + (o.vein ? 'varying vec2 vVn;\n' : '') + NOISE + fs;
   fs = fs.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n float brE = 0.0, brCh = 0.0; float brNz = .72 * brN(vDP * 9.) + .28 * brN(vDP * 23.);\n' +
    ' if (uDis > 0.0) { float th = uDis * 1.1 - .05; if (brNz < th) discard; brE = 1. - smoothstep(0., .055, brNz - th); }\n' +
    (o.cut ? ' if (vCut.x < 1.5) { float e = .035 * (brNz - .5), s = vCs - e; if (s > vCut.x && s < vCut.y) discard;\n' +
     '  brE = max(brE, vCut.w * (1. - smoothstep(0., .02, min(abs(s - vCut.x), abs(s - vCut.y)))));\n' +
     '  if (s >= vCut.y && vCut.z > 0.) { float th = vCut.z * 1.1 - .05; if (brNz < th) discard; brE = max(brE, 1. - smoothstep(0., .055, brNz - th)); } }\n' : '') +
    (o.flut ? ' if (vThinR < uThin) discard;\n' : ''));
   fs = fs.replace('#include <color_fragment>', '#include <color_fragment>\n { float lum = dot(diffuseColor.rgb, vec3(.3, .59, .11)); diffuseColor.rgb = mix(diffuseColor.rgb, uWithC * (.4 + lum * 1.5), uWith); }\n' +
    (o.flut ? ' if (gl_FrontFacing) { float l = dot(diffuseColor.rgb, vec3(.3, .59, .11)); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(l * .92, l * 1.1, l * .86) + .03, .55); }\n' : '') +
    (o.char ? ' if (uChar > 0.0) { float n3 = brN(vDP * 3.1); brCh = clamp((uChar * ' + o.char.toFixed(2) + ' * 1.7 - (' + (o.flut ? 'vThinR * .5 + n3 * .3 + brNz * .2' : 'n3 * .7 + brNz * .3') + ')) * 5., 0., 1.); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.05, .034, .028), brCh); }\n' : ''));
   fs = fs.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += uDisCol * brE * 1.6;\n' +
    (o.char ? ' totalEmissiveRadiance += vec3(1., .42, .12) * brCh * (1. - brCh) * 3. * uBurn;\n' : '') +
    (o.vein ? ' { float l = dot(texelColor.rgb, vec3(.3, .59, .11)), crev = 1. - smoothstep(.12, .26, l);\n' +
     '  float vg = vVn.x * (uVein.w * (.55 + .45 * sin(uTime * 1.3 - vVn.y * 6.)) + uVein.x * (.6 + .4 * sin(uTime * 6. - vVn.y * 15.)) + uVein.z * exp(-pow((vVn.y - uVein.y) * 4.5, 2.)));\n' +
     '  totalEmissiveRadiance += uVeinC * vg * (.12 + 1.2 * crev); }\n' : ''));
   if (o.rim) fs = fs.replace('#include <dithering_fragment>', ' gl_FragColor.rgb += uRimC * (uRim * uRimS * pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 2.6));\n#include <dithering_fragment>');
   sh.vertexShader = vs; sh.fragmentShader = fs;
  };
  m.customProgramCacheKey = () => key;
  return m;
 }
 const std = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: .8, metalness: 0 }, o));
 const ADD = { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false };
 const M = {
  bark: patch(std({ map: barkMap, normalMap: barkN, normalScale: new THREE.Vector2(.8, .8), vertexColors: true, roughness: .58, skinning: true }), { cut: true, rim: 1, char: .45, withC: new THREE.Color(.3, .26, .22) }),
  wood: patch(std({ map: woodMap, normalMap: woodN, normalScale: new THREE.Vector2(1, 1), vertexColors: true, roughness: .86, skinning: true }), { cut: true, rim: .8, vein: true, withC: new THREE.Color(.32, .28, .24) }),
  vc: patch(std({ vertexColors: true, roughness: .45, skinning: true }), { cut: true, rim: .8, char: .4, withC: new THREE.Color(.36, .3, .24) }),
  leaf: patch(std({ map: leafMap, vertexColors: true, alphaTest: .5, alphaToCoverage: true, side: THREE.DoubleSide, roughness: .55, skinning: true }), { cut: true, flut: true, rim: .55, char: 1, withC: new THREE.Color(.46, .33, .18) }),
  berry: patch(std({ vertexColors: true, roughness: .2, metalness: .08, emissive: 0x000000, skinning: true }), { cut: true, rim: .5, withC: new THREE.Color(.13, .09, .08) }),
  soil: new THREE.MeshStandardMaterial({ map: soilMap, transparent: true, depthWrite: false, roughness: 1, color: new THREE.Color(1, 1, 1).lerp(new THREE.Color(.75, .95, .7), VR.moss * .4), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })
 };

 // ---------- skeleton ----------
 // ground (stays put: the rootlets' far ends), crown (the whole body: lift, lean, twist), mass (the root crown itself:
 // pulse and squash), top (the shoots on top). Each cane is a chain of NS + 1 bones that starts inside the crown and
 // runs straight out along its azimuth in the bind pose; every pose bends it. Berry clusters hang from pendulum bones.
 const bones = [], BI = {};
 function bone(name, parent, x, y, z, order) { const b = new THREE.Bone(); b.name = name; b.position.set(x, y, z); if (order) b.rotation.order = order; parent.add(b); BI[name] = bones.length; bones.push(b); return b; }
 const ground = bone('ground', base, 0, 0, 0), crown = bone('crown', ground, 0, 0, 0, 'YXZ'), mass = bone('mass', crown, 0, 0, 0), top = bone('top', mass, 0, CH * .92, 0);
 const CANES = [];
 {
  // the lead cane: the front one on its right (on the sheets the luring cane reaches out on that side)
  const az = []; for (let k = 0; k < NC; k++) az.push(-PI + (k + .5) * TAU / NC + (rnd() - .5) * .12);
  let lead = 0; az.forEach((a, k) => { if (Math.abs(a + .26) < Math.abs(az[lead] + .26)) lead = k; });
  for (let k = 0; k < NC; k++) {
   const a = az[k], len = CL * (k === lead ? 1.04 : .94 + .1 * rnd()), seg = len / NS, rb = CR * .5, hb = CH * .52;
   const b0 = bone('cb' + k, crown, Math.sin(a) * rb, hb, Math.cos(a) * rb, 'YXZ'); b0.rotation.y = a;
   const chain = [b0]; for (let i = 1; i <= NS; i++) chain.push(bone('c' + k + '_' + i, chain[i - 1], 0, 0, seg));
   const g = k === lead ? 'L' : Math.abs(a) < 1.05 ? 'F' : Math.abs(a) < 2.1 ? 'S' : 'B';
   CANES.push({ k, a, len, seg, rb, hb, chain, g, ph: rnd() * TAU, sgn: a < 0 ? -1 : 1, dl: (rnd() - .5) * .14, dc: (rnd() - .5) * .3, cutJ: -1, piece: null, cm: .55 + .8 * rnd(), jb: Array.from({ length: NS + 1 }, () => (rnd() - .5) * .14), jy: Array.from({ length: NS + 1 }, () => (rnd() - .5) * .1), theta: new Float32Array(NS + 1), bend: new Float32Array(NS + 1), yawW: new Float32Array(NS + 1) });
  }
 }
 const LEAD = CANES.find((c) => c.g === 'L');
 root.updateMatrixWorld(true);

 // ---------- geometry helpers ----------
 const BK = new Map(); // material -> geometries to merge into one skinned mesh
 const put = (mat, g) => { let l = BK.get(mat); if (!l) BK.set(mat, (l = [])); l.push(g); return g; };
 function surf(nu, nv, f, uvf) {
  const pos = [], uv = [], idx = [], o = [0, 0, 0];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const u = i / nu, v = j / nv; f(u, v, o); pos.push(o[0], o[1], o[2]); const t = uvf ? uvf(u, v) : [u, 1 - v]; uv.push(t[0], t[1]); }
  // wound so the outside faces out (the sheets' build had it inside out, so the crown's dome never drew from outside)
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return g;
 }
 // a tube along a curve with a radius that may vary along it and around it (Frenet frames, for roots and stems)
 function tube(pts, segs, rs, rFn, uvK) {
  const curve = pts.isCurve ? pts : new THREE.CatmullRomCurve3(pts.map((p) => (p.isVector3 ? p : V3(p[0], p[1], p[2]))));
  const fr = curve.computeFrenetFrames(segs, false), pos = [], nor = [], uv = [], idx = [], P = V3(), D = V3();
  for (let i = 0; i <= segs; i++) {
   const t = i / segs; curve.getPointAt(t, P);
   for (let j = 0; j <= rs; j++) { const th = j / rs * TAU, r = rFn(t, th); D.copy(fr.normals[i]).multiplyScalar(Math.cos(th)).addScaledVector(fr.binormals[i], Math.sin(th)); pos.push(P.x + D.x * r, P.y + D.y * r, P.z + D.z * r); nor.push(D.x, D.y, D.z); uv.push(j / rs, t * (uvK || 1)); }
  }
  for (let i = 0; i < segs; i++) for (let j = 0; j < rs; j++) { const a = i * (rs + 1) + j, b = a + rs + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  return g;
 }
 // a near-straight tube along d from s0 to s1 in the bind pose, rings held square to d by a fixed frame (e1, e2):
 // canes, shoots and horns. wob(s, out) nudges the axis sideways and up a little.
 function rodTube(B, d, e1, e2, s0, s1, nu, rs, rFn, wob, uvLen) {
  const pos = [], nor = [], uv = [], idx = [], S = [], w = [0, 0];
  for (let i = 0; i <= nu; i++) {
   const s = lerp(s0, s1, i / nu); w[0] = w[1] = 0; if (wob) wob(s, w);
   const cx = B.x + d.x * s + e1.x * w[0] + e2.x * w[1], cy = B.y + d.y * s + e1.y * w[0] + e2.y * w[1], cz = B.z + d.z * s + e1.z * w[0] + e2.z * w[1];
   for (let j = 0; j <= rs; j++) {
    const th = j / rs * TAU, r = rFn(s, th), c = Math.cos(th), sn = Math.sin(th);
    const nx = e1.x * c + e2.x * sn, ny = e1.y * c + e2.y * sn, nz = e1.z * c + e2.z * sn;
    pos.push(cx + nx * r, cy + ny * r, cz + nz * r); nor.push(nx, ny, nz); uv.push(j / rs, (s - s0) / (uvLen || .5)); S.push(s);
   }
  }
  for (let i = 0; i < nu; i++) for (let j = 0; j < rs; j++) { const a = i * (rs + 1) + j, b = a + rs + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  g.userData.S = S; return g;
 }
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
 const colorAll = (g, c) => attr(g, 'color', 3, (i, o) => { o[0] = c[0]; o[1] = c[1]; o[2] = c[2]; });
 // which cane a vertex belongs to and how far along it (for the severing cut); -1 for everything else
 const cnAll = (g, k, f) => attr(g, 'aCn', 2, (i, o) => { o[0] = k; o[1] = f; });
 // a cane's skin weights at distance s along it: a linear blend between neighbouring bones, centred on each joint
 function caneW(C, s) {
  const f = s / C.seg - .5, i0 = Math.floor(f), t = f - i0;
  if (s <= C.seg * .5) return [[BI[C.chain[0].name], 1]];
  if (s >= (NS + .5) * C.seg) return [[BI[C.chain[NS].name], 1]];
  return [[BI[C.chain[i0].name], 1 - t], [BI[C.chain[i0 + 1].name], t]];
 }
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
    else if (k === 'aCn') for (let i = 0; i < c; i++) arr[(vo + i) * 2] = -1;
    else if (k === 'aFl') for (let i = 0; i < c; i++) arr[(vo + i) * 4 + 2] = 1;
    vo += c;
   }
   out.setAttribute(k, new THREE.BufferAttribute(arr, size));
  }
  const I = new Uint32Array(ni); let vo = 0, io = 0;
  for (const g of list) { const c = g.attributes.position.count; if (g.index) { const a = g.index.array; for (let k = 0; k < a.length; k++) I[io + k] = a[k] + vo; io += a.length; } else { for (let k = 0; k < c; k++) I[io + k] = vo + k; io += c; } vo += c; }
  out.setIndex(new THREE.BufferAttribute(I, 1)); out.computeBoundingSphere(); return out;
 }
 const _m4 = new THREE.Matrix4();
 // a compound leaf card: origin O (the stalk's end), Ly along the leaf, Ln its face; folded along the midrib, drooping
 // toward the tip; cell picks the leaf in the atlas
 function leafCard(O, Ly, Ln, w, h, cell, tint, amp, ph, fold, droop, tr) {
  const nx = 2, ny = 3, pos = [], uv = [], idx = [], fl = [], col = [];
  const Lx = V3().crossVectors(Ly, Ln).normalize(), Nn = V3().crossVectors(Lx, Ly).normalize();
  const u0 = (cell % 2) * .5, v0 = cell < 2 ? .5 : 0, thinR = tr === undefined ? rnd() : tr;
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
   const xn = i / nx * 2 - 1, yn = j / ny, x = xn * w / 2, y = yn * h, z = (fold === undefined ? .13 : fold) * w * (1 - Math.abs(xn)) - (droop === undefined ? .22 : droop) * h * yn * yn;
   pos.push(O.x + Lx.x * x + Ly.x * y + Nn.x * z, O.y + Lx.y * x + Ly.y * y + Nn.y * z, O.z + Lx.z * x + Ly.z * y + Nn.z * z);
   uv.push(u0 + (xn * .5 + .5) * .5, v0 + .012 + yn * .48); fl.push(amp * Math.pow(yn, 1.4) * h * 4, ph, thinR, 0); col.push(tint[0], tint[1], tint[2]);
  }
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aFl', new THREE.Float32BufferAttribute(fl, 4)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
 }
 // a recurved thorn: out from the surface point S along n, hooking back toward the cane's base (-d); dark red at the
 // root, ivory at the point so the hooks catch the light, and broad and flattened along the cane where it grows from it
 const TH_C = [[.2, .045, .05], [.38, .12, .1], [.92, .84, .68]];
 function thorn(S, n, d, len, rb, hk) {
  const nu = 4, rs = 4, pos = [], col = [], idx = [], T = V3(), P = V3(), e1 = V3(), e2 = V3();
  const hook = hk === undefined ? .55 + .2 * rnd() : hk;
  for (let i = 0; i <= nu; i++) {
   const t = i / nu; P.copy(S).addScaledVector(n, len * t).addScaledVector(d, -len * hook * t * t);
   T.copy(n).multiplyScalar(len).addScaledVector(d, -2 * len * hook * t).normalize();
   e1.crossVectors(T, d); if (e1.lengthSq() < 1e-6) e1.set(1, 0, 0); e1.normalize(); e2.crossVectors(T, e1).normalize();
   const r = rb * Math.pow(1 - t, 1.15), rw = r * (1 + .8 * (1 - t) * (1 - t)), c = t < .42 ? TH_C[0].map((v, k) => lerp(v, TH_C[1][k], t / .42)) : TH_C[1].map((v, k) => lerp(v, TH_C[2][k], sm(.42, .88, t)));
   for (let j = 0; j < rs; j++) { const th = j / rs * TAU, cx = Math.cos(th) * r, sx = Math.sin(th) * rw; pos.push(P.x + e1.x * cx + e2.x * sx, P.y + e1.y * cx + e2.y * sx, P.z + e1.z * cx + e2.z * sx); col.push(c[0] * DARK, c[1] * DARK, c[2] * DARK); }
  }
  for (let i = 0; i < nu; i++) for (let j = 0; j < rs; j++) { const a = i * rs + j, b = i * rs + (j + 1) % rs; idx.push(a, a + rs, b, b, a + rs, b + rs); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
 }
 // blackberries: each a cluster of glossy drupelets round a dark core, with a green calyx; ripe ones near-black with a
 // violet sheen, some deep red, a few unripe scarlet. Built hanging down from the origin.
 // a drupelet: a rounded cap facing out of the berry (its inner half is hidden in the core): 7 vertices and 6 triangles,
 // with normals from the sphere so it shades round (the sheets' build used 15 triangles; berries were half the budget)
 const CAP = (() => {
  const p = [0, 0, 1], i = [];
  for (let k = 0; k < 6; k++) { const a = k / 6 * TAU, el = 1.42; p.push(Math.sin(el) * Math.cos(a), Math.sin(el) * Math.sin(a), Math.cos(el)); }
  for (let k = 0; k < 6; k++) i.push(0, 1 + k, 1 + (k + 1) % 6);
  return { p, i };
 })();
 const CORE = (() => { const g = new THREE.SphereGeometry(1, 6, 4); return { p: Array.from(g.attributes.position.array), i: Array.from(g.index.array) }; })();
 function berry(cx, cy, cz, len, rad, ripe, out) {
  const col = ripe > .7 ? [.07, .035, .085] : ripe > .35 ? [.32, .03, .08] : [.62, .1, .1];
  const P = out.p, N = out.n, C = out.c, I = out.i;
  const mesh = (src, x, y, z, sx, sy, sz, cc) => { const b = P.length / 3; for (let i = 0; i < src.p.length; i += 3) { P.push(x + src.p[i] * sx, y + src.p[i + 1] * sy, z + src.p[i + 2] * sz); N.push(src.p[i], src.p[i + 1], src.p[i + 2]); C.push(cc[0], cc[1], cc[2]); } for (const ii of src.i) I.push(b + ii); };
  const _o = V3(), _z = V3(0, 0, 1), _qq = new THREE.Quaternion(), _t = V3();
  const drup = (x, y, z, r, ox, oy, oz) => { // a cap at (x, y, z) facing (ox, oy, oz)
   const j = .85 + .3 * rnd(), cc = [col[0] * j, col[1] * j, col[2] * (ripe > .7 ? .9 + .4 * rnd() : j)], b = P.length / 3;
   _qq.setFromUnitVectors(_z, _o.set(ox, oy, oz).normalize());
   for (let i = 0; i < CAP.p.length; i += 3) { _t.set(CAP.p[i], CAP.p[i + 1], CAP.p[i + 2]).applyQuaternion(_qq); P.push(x + _t.x * r, y + _t.y * r, z + _t.z * r); N.push(_t.x, _t.y, _t.z); C.push(cc[0], cc[1], cc[2]); }
   for (const ii of CAP.i) I.push(b + ii);
  };
  const rd = rad * .42, hl = len / 2, cy0 = cy - hl, rings = [.35, .98, 1.6, 2.22];
  drup(cx, cy - len + rd * .7, cz, rd, 0, -1, 0);
  for (let k = 0; k < rings.length; k++) {
   const v = rings[k], n = Math.max(3, Math.round(TAU * rad * Math.sin(v) / (1.9 * rd))), o = rnd() * TAU;
   for (let i = 0; i < n; i++) { const a = o + i / n * TAU, sr = rad * Math.sin(v) * .9; drup(cx + Math.cos(a) * sr, cy0 - hl * Math.cos(v) * .9, cz + Math.sin(a) * sr, rd * (k === 3 ? .85 : 1), Math.cos(a) * Math.sin(v) / rad, -Math.cos(v) / hl, Math.sin(a) * Math.sin(v) / rad); }
  }
  mesh(CORE, cx, cy0, cz, rad * .82, hl * .82, rad * .82, [col[0] * .5, col[1] * .5, col[2] * .5]); // the dark core fills the gaps
 }
 // a hanging bunch: a stalk with short branches, berries biggest and ripest at the top, a few red ones; returns berry
 // geometry and stalk/calyx geometry (vertex-coloured), both in the cluster's own space (origin at the attachment)
 function bunch(n, size) {
  const out = { p: [], n: [], c: [], i: [] }, stems = [], yaw = rnd() * TAU, L = size * .2;
  for (let i = 0; i < n; i++) {
   const f = n > 1 ? i / (n - 1) : 0, a = yaw + i * 2.4, r = size * (.035 + .035 * Math.sin(PI * Math.min(1, f * 1.3))) * (i ? 1 : 0);
   const y = -size * .03 - f * L, x = Math.cos(a) * r, z = Math.sin(a) * r, ripe = rnd() < .22 ? rnd() * .65 : .8 + .2 * rnd();
   const len = size * (.05 - .012 * f) * (.9 + .2 * rnd()), rad = len * .62;
   berry(x, y - .006, z, len, rad, ripe, out);
   const s = tube([[0, -f * L * .8, 0], [x * .5, y + .01, z * .5], [x, y + .002, z]], 3, 3, (t) => size * .0045 * (1 - .4 * t));
   colorAll(s, [.2 * DARK, .24 * DARK, .1]); stems.push(s);
   for (let q = 0; q < 5; q++) { const qa = q / 5 * TAU + rnd(), cxp = x + Math.cos(qa) * rad * .5, czp = z + Math.sin(qa) * rad * .5; const c = tube([[x, y + .004, z], [cxp, y + .002, czp], [x + Math.cos(qa) * rad * .95, y - rad * .2, z + Math.sin(qa) * rad * .95]], 2, 3, (t) => rad * .12 * (1 - t)); colorAll(c, [.24, .36, .14]); stems.push(c); }
  }
  const main = tube([[0, .01, 0], [0, -L * .4, size * .004], [0, -L * .85, 0]], 4, 3, (t) => size * .006 * (1 - .5 * t)); colorAll(main, [.24 * DARK, .22 * DARK, .1]); stems.push(main);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(out.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(out.n, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(out.c, 3)); g.setIndex(out.i);
  return { berries: g, stems };
 }

 // ---------- the root crown: a lumpy dome under a tangle of twisted woody roots ----------
 // Its top sinks into a hollow, where it feeds: dark at rest, glowing berry-magenta while it feeds (aVn, see the materials).
 const HOL = CH * .36;
 const domeR = (e, a) => CR * Math.pow(Math.max(0, Math.cos(e)), .8) * (1 + .07 * Math.sin(a * 5 + e * 3) + .05 * Math.sin(a * 11 - e * 7));
 const domeY = (e) => CH * Math.sin(Math.max(0, e)) - HOL * sm(1.08, PI / 2, e);
 const hollowW = (x, y, z) => sm(.6, .28, Math.hypot(x, z) / CR) * sm(CH * .45, CH * .62, y + HOL * .5);
 // veins: x how strongly a vertex glows, y how far along the roots it is from the hollow (0) out into the soil (1 and on)
 const vein = (g, x, y0, y1, ring) => attr(g, 'aVn', 2, (i, o) => { o[0] = x; o[1] = lerp(y0, y1, Math.floor(i / ring) / Math.max(1, g.attributes.position.count / ring - 1)); });
 const domeP = (e, a, k, out) => { const r = domeR(e, a) * (k || 1); return out.set(Math.sin(a) * r, domeY(e) * (k || 1), Math.cos(a) * r); };
 const domeN = (e, a, out) => out.set(Math.sin(a) * Math.cos(e) * CH, Math.sin(e) * CR, Math.cos(a) * Math.cos(e) * CH).normalize();
 // crown parts low and far out are held by the ground, the rest by the crown
 function wCrown(x, y, z) { const g = sm(CR * .95, CR * 1.6, Math.hypot(x, z)) * sm(.22, .03, y); return [[BI.mass, 1 - g], [BI.ground, g]]; }
 const shadeBy = (g, f) => attr(g, 'color', 3, (i, o) => { const p = g.attributes.position, c = f(p.getX(i), p.getY(i), p.getZ(i)); o[0] = c[0]; o[1] = c[1]; o[2] = c[2]; });
 {
  const g = surf(Q(36), Q(16), (u, v, o) => { const a = u * TAU, e = lerp(-.14, PI / 2, v), r = domeR(e, a); o[0] = Math.sin(a) * r; o[1] = domeY(e) - .02; o[2] = Math.cos(a) * r; }, (u, v) => [u * 4, v * 1.6]);
  shadeBy(g, (x, y, z) => { const k = lerp(.32, .62, sm(-.02, CH, y)) * DARK * (1 - .62 * hollowW(x, y, z)); return [k, k * .9, k * .82]; });
  attr(g, 'aVn', 2, (i, o) => { const p = g.attributes.position; o[0] = 1.3 * hollowW(p.getX(i), p.getY(i), p.getZ(i)); o[1] = 0; });
  put(M.wood, cnAll(skinW(g, wCrown), -1, 0));
 }
 // twisted roots spiralling down over the dome and out into the soil, and a few that arch right over it
 {
  const NR = Q(Math.round(26 * VR.thick), 10), P = V3();
  for (let i = 0; i < NR; i++) {
   const a0 = rnd() * TAU, e0 = rr(.45, 1.35), tw = (rnd() < .5 ? -1 : 1) * rr(.5, 2.1), endR = CR * rr(1.08, 1.75), r0 = rr(.024, .048) * VR.thick;
   const pts = [];
   for (let j = 0; j <= 9; j++) {
    const t = j / 9, a = a0 + tw * t, e = lerp(e0, 0, Math.pow(t, .8)), onR = domeR(e, a) + r0 * .55, R = lerp(onR, endR, sm(.58, 1, t));
    const y = domeY(e) * (1 - sm(.6, .95, t)) + r0 * .45 - .05 * sm(.88, 1, t);
    pts.push(V3(Math.sin(a) * R, y, Math.cos(a) * R));
   }
   const kt = r2(.12, .7), kk = r2(.25, .6), ph = rnd() * 9, g = tube(pts, Q(20, 8), Q(6, 4), (t, th) => r0 * (1.2 - .6 * t) * (1 + .14 * Math.sin(th * 2 + t * 13 + ph)) * (1 + kk * Math.exp(-Math.pow((t - kt) / .05, 2))), 3);
   shadeBy(g, (x, y) => { const k = (.62 + .25 * sm(0, CH, y)) * DARK; return [k, k * .92, k * .85]; });
   vein(g, r2(.75, 1.05), .08 + .1 * (1 - e0 / 1.35), 1, Q(6, 4) + 1);
   put(M.wood, cnAll(skinW(g, wCrown), -1, 0));
  }
  for (let i = 0; i < Math.round(4 * VR.thick); i++) { // arches over the top
   const a0 = rnd() * TAU, a1 = a0 + PI + rr(-.6, .6), r0 = rr(.028, .05) * VR.thick, pts = [];
   for (let j = 0; j <= 10; j++) { const t = j / 10, a = lerp(a0, a1, t), e = Math.sin(PI * t) * rr(1.1, 1.3), R = lerp(CR * 1.3, CR * 1.3, t) * (1 - Math.sin(PI * t)) + domeR(Math.min(e, 1.45), a) * Math.sin(PI * t) + r0; pts.push(V3(Math.sin(a) * R, domeY(e) * Math.sin(PI * t) + r0 * .5 - .04 * (1 - Math.sin(PI * t)), Math.cos(a) * R)); }
   const g = tube(pts, Q(24, 10), Q(6, 4), (t, th) => r0 * (.75 + .35 * Math.sin(PI * t)) * (1 + .12 * Math.sin(th * 2 + t * 17)), 4);
   shadeBy(g, () => [.7 * DARK, .64 * DARK, .58 * DARK]);
   attr(g, 'aVn', 2, (i, o) => { const f = Math.floor(i / (Q(6, 4) + 1)) / Q(24, 10); o[0] = .9; o[1] = .3 * Math.abs(f - .5) * 2; });
   put(M.wood, cnAll(skinW(g, wCrown), -1, 0));
  }
  // fine rootlets spreading over the ground, with side branches
  const NRL = Q(Math.round(30 * VR.thick), 10);
  for (let i = 0; i < NRL; i++) {
   const a0 = rnd() * TAU, len = rr(.45, 1.25) * (VR.K > 1 ? 1.3 : 1), r0 = rr(.011, .019) * VR.thick, pts = [], br = [];
   let a = a0, R = CR * rr(.82, .98);
   for (let j = 0; j <= 7; j++) { const t = j / 7; pts.push(V3(Math.sin(a) * R, .012 + r0 * .3 - .02 * sm(.85, 1, t), Math.cos(a) * R)); a += rr(-.12, .12); R += len / 7; if (j === 3) br.push(pts[j].clone()); }
   const g = tube(pts, Q(12, 5), 4, (t) => r0 * (1 - .78 * t), 3); shadeBy(g, () => [.56 * DARK, .5 * DARK, .44 * DARK]); vein(g, .8, .85, 1.45, 5); put(M.wood, cnAll(skinW(g, wCrown), -1, 0));
   for (const b of br) {
    const ba = a0 + (rnd() < .5 ? -1 : 1) * rr(.3, .7), bl = len * rr(.3, .5), q = [b];
    for (let j = 1; j <= 4; j++) q.push(V3(b.x + Math.sin(ba) * bl * j / 4, .01, b.z + Math.cos(ba) * bl * j / 4).add(V3(rr(-.03, .03), 0, rr(-.03, .03))));
    const gb = tube(q, Q(6, 3), 3, (t) => r0 * .55 * (1 - .8 * t), 2); shadeBy(gb, () => [.52 * DARK, .46 * DARK, .4 * DARK]); vein(gb, .7, 1.15, 1.6, 4); put(M.wood, cnAll(skinW(gb, wCrown), -1, 0));
   }
  }
 }

 // ---------- canes: tapering, knotted, dark purple-brown, armed with recurved thorns, leafy, fruiting at the tips ----------
 const BERRIES = [];  // pendulum bones: { bone, len, X, Xp, ... }
 function chainW(chain, seg, n, s) {
  const f = s / seg - .5, i0 = Math.floor(f), t = f - i0;
  if (s <= seg * .5) return [[BI[chain[0].name], 1]];
  if (s >= (n + .5) * seg) return [[BI[chain[n].name], 1]];
  return [[BI[chain[i0].name], 1 - t], [BI[chain[i0 + 1].name], t]];
 }
 function addBunch(parent, local, at, n, size, cn) {
  const b = bone('b' + BERRIES.length, parent, local.x, local.y, local.z);
  const bn = bunch(n, size), M4 = _m4.makeTranslation(at.x, at.y, at.z);
  bn.berries.applyMatrix4(M4); put(M.berry, cnAll(rigid(bn.berries, b), cn[0], cn[1]));
  for (const s of bn.stems) { s.applyMatrix4(M4); put(M.vc, cnAll(rigid(s, b), cn[0], cn[1])); }
  BERRIES.push({ bone: b, len: size * .13, X: V3(), Xp: V3(), init: false, size, sway: rnd() * TAU });
  return b;
 }
 const tintLeaf = () => [rr(.86, 1.1), rr(.9, 1.12), rr(.8, 1.02)];
 for (const C of CANES) {
  const d = V3(Math.sin(C.a), 0, Math.cos(C.a)), e1 = V3(Math.cos(C.a), 0, -Math.sin(C.a)), e2 = V3(0, 1, 0);
  const B = C.chain[0].position.clone(), len = C.len;
  const rB = VR.rB * (C.g === 'L' ? 1.06 : 1) * (1 + .15 * TIER), rT = VR.rT;
  const rad = (s) => (s < 0 ? rB * 1.12 : lerp(rB, rT, Math.pow(s / len, .72)) * (1 + .13 * Math.exp(-Math.pow((((s + .2) / .42) % 1 - .5) * 6, 2)))) * sm(len + .035, len - .08, s);
  const wob = (s, w) => { const k = sm(0, .6, s); w[0] = .02 * Math.sin(s * 2.1 + C.ph) * k; w[1] = .014 * Math.sin(s * 2.9 + C.ph * 1.7) * k; };
  const ax = (s, out) => { const w = [0, 0]; wob(s, w); return out.copy(B).addScaledVector(d, s).addScaledVector(e1, w[0]).addScaledVector(e2, w[1]); };
  C.rad = rad; C.ax = ax; C.d = d; C.e1 = e1;
  {
   const g = rodTube(B, d, e1, e2, -.2, len + .035, Q(72, 24), Q(11, 6), (s, th) => rad(s) * (1 + .05 * Math.sin(th * 3 + s * 7)), wob, .55), S = g.userData.S;
   attr(g, 'color', 3, (i, o) => { const f = sm(.5, 1, S[i] / len); o[0] = lerp(1, .82, f); o[1] = lerp(1, 1.04, f); o[2] = lerp(1, .7, f); });
   skinW(g, (x, y, z, i) => caneW(C, S[i])); attr(g, 'aCn', 2, (i, o) => { o[0] = C.k; o[1] = S[i] / len; });
   put(M.bark, g);
  }
  const P = V3(), N = V3(), O = V3(), Ly = V3(), Ln = V3();
  // recurved thorns, spiralling round the cane, biggest near the base
  const nT = Q(Math.round(len * 19));
  for (let i = 0; i < nT; i++) {
   const s = lerp(.06, len * .97, (i + rnd() * .7) / nT), th = i * 2.4 + rnd() * .4, r = rad(s);
   N.copy(e1).multiplyScalar(Math.cos(th)).addScaledVector(e2, Math.sin(th)); ax(s, P).addScaledVector(N, r * .9);
   const tl = (r * .8 + .014 + .006 * rnd()) * 1.45 * THS, g = thorn(P, N, d, tl, tl * .36);
   put(M.vc, cnAll(skinW(g, () => caneW(C, s)), C.k, s / len));
  }
  // more thorns between those, so the canes read as armed from the battle camera
  for (let i = 0, n = Q(Math.round(len * 6)); i < n; i++) {
   const s = lerp(.1, len * .95, (i + r2(.2, .8)) / n), th = r2(0, TAU), r = rad(s);
   N.copy(e1).multiplyScalar(Math.cos(th)).addScaledVector(e2, Math.sin(th)); ax(s, P).addScaledVector(N, r * .9);
   const tl = (r * .8 + .016) * 1.45 * THS, g = thorn(P, N, d, tl, tl * .36, r2(.55, .8));
   put(M.vc, cnAll(skinW(g, () => caneW(C, s)), C.k, s / len));
  }
  // the grasping canes carry a row of big hooks toward the tip: what catches and holds
  if (C.g === 'L' || C.g === 'F') for (let i = 0, n = C.g === 'L' ? 6 : 3; i < n; i++) {
   const s = lerp(.58, .93, (i + r2(.1, .9)) / n) * len, th = r2(-.9, .9) + (i % 2 ? PI : 0) - PI / 2, r = rad(s);
   N.copy(e1).multiplyScalar(Math.cos(th)).addScaledVector(e2, Math.sin(th)); ax(s, P).addScaledVector(N, r * .85);
   const tl = (r * 1.4 + .045) * THS, g = thorn(P, N, d, tl, tl * .38, r2(.8, 1));
   put(M.vc, cnAll(skinW(g, () => caneW(C, s)), C.k, s / len));
  }
  // compound leaves on short stalks, alternating sides, smaller toward the tip; young bronze ones at the tip
  const nL = Q(Math.round(len * 7.5 * VR.leaf), 4);
  for (let i = 0; i < nL; i++) {
   const f = lerp(.1, .95, (i + .2 + rnd() * .6) / nL), s = f * len, sg = i % 2 ? 1 : -1, th = sg > 0 ? rr(.1, .7) : PI - rr(.1, .7), r = rad(s);
   N.copy(e1).multiplyScalar(Math.cos(th)).addScaledVector(e2, Math.sin(th)); ax(s, P).addScaledVector(N, r * .8);
   Ly.copy(e1).multiplyScalar(sg * rr(.5, .9)).addScaledVector(e2, rr(.2, .6)).addScaledVector(d, rr(.3, .7)).normalize();
   Ln.copy(e2).addScaledVector(V3(rr(-1, 1), 0, rr(-1, 1)), .35); Ln.addScaledVector(Ly, -Ln.dot(Ly)).normalize();
   O.copy(P).addScaledVector(Ly, rr(.035, .065));
   const sz = rr(.24, .34) * (1 - .3 * f), cell = f > .76 && rnd() < .35 ? 2 : rnd() < .5 ? 0 : 1;
   const card = leafCard(O, Ly, Ln, sz, sz * 1.05, cell, tintLeaf(), 1, rnd() * TAU);
   put(M.leaf, cnAll(skinW(card, () => caneW(C, s)), C.k, f));
   const pet = tube([P.clone(), P.clone().lerp(O, .5).addScaledVector(e2, .008), O.clone()], 2, 3, (t) => .0055 * (1 - .3 * t));
   colorAll(pet, [.34 * DARK, .2 * DARK, .12]); put(M.vc, cnAll(skinW(pet, () => caneW(C, s)), C.k, f));
  }
  // fruit: a big bunch near the tip and, on most canes, a second further in, each on its own pendulum
  const spots = C.g === 'B' ? [[.9, 1]] : [[.9, 1], [.66, .78]];
  for (const [f, k] of spots) {
   if (k < 1 && rnd() > .8 * VR.berry) continue;
   const s = f * len, ip = Math.min(NS, Math.round(s / C.seg)), w = [0, 0]; wob(s, w);
   const local = V3(w[0], w[1] - rad(s) * .8, s - ip * C.seg), at = ax(s, V3()).addScaledVector(e2, -rad(s) * .8);
   const nb = Math.max(3, Math.round((k < 1 ? 4.5 : 8) * VR.berry * (1 + .3 * TIER) * (.85 + .3 * rnd()) * DET));
   C['bunch' + (k < 1 ? 2 : 1)] = addBunch(C.chain[ip], local, at, nb, k * 1.65 * (1 + .12 * TIER), [C.k, f]);
  }
 }
 // leaves round the canes' bases, hiding where they leave the crown
 for (const C of CANES) for (let i = 0; i < 5; i++) {
  const s = rr(.02, .55), P = C.ax(s, V3()).addScaledVector(YAX, C.rad(s) * .6), Ly = V3().copy(C.e1).multiplyScalar(rr(-1, 1)).addScaledVector(YAX, rr(.4, .9)).addScaledVector(C.d, rr(-.2, .5)).normalize();
  const Ln = V3(rr(-.5, .5), 1, rr(-.5, .5)); Ln.addScaledVector(Ly, -Ln.dot(Ly)).normalize(); const sz = rr(.24, .33);
  put(M.leaf, cnAll(skinW(leafCard(P, Ly, Ln, sz, sz, rnd() < .5 ? 0 : 1, tintLeaf(), .8, rnd() * TAU), () => caneW(C, s)), C.k, s / C.len));
 }

 // ---------- shoots: thinner canes standing up out of the crown, swaying on springs ----------
 const SHOOTS = [], SN = 3;
 for (let m = 0; m < Math.round(VR.shoots * (DET < .75 ? .7 : 1)); m++) {
  const al = rnd() * TAU, eb = rr(.75, 1.3), el = VNAME === 'towering' ? rr(1.05, 1.4) : rr(.65, 1.2), len = rr(.55, 1.05) * (VNAME === 'towering' ? 1.35 : VNAME === 'ambush' ? .8 : 1), seg = len / SN;
  const Pb = domeP(eb, al, .9, V3()), tp = top.position;
  const s0 = bone('s' + m + '_0', top, Pb.x - tp.x, Pb.y - tp.y, Pb.z - tp.z, 'YXZ'); s0.rotation.set(-el, al, 0);
  const chain = [s0]; for (let i = 1; i <= SN; i++) chain.push(bone('s' + m + '_' + i, chain[i - 1], 0, 0, seg));
  const d = V3(Math.cos(el) * Math.sin(al), Math.sin(el), Math.cos(el) * Math.cos(al)), e1 = V3(Math.cos(al), 0, -Math.sin(al)), e2 = V3().crossVectors(d, e1).normalize();
  const rad = (s) => lerp(.026, .007, Math.pow(Math.max(0, s) / len, .8)) * sm(len + .02, len - .05, s);
  const g = rodTube(Pb, d, e1, e2, -.08, len + .02, Q(22, 10), Q(6, 4), (s) => rad(s), null, .5), S = g.userData.S;
  skinW(g, (x, y, z, i) => chainW(chain, seg, SN, S[i])); attr(g, 'color', 3, (i, o) => { const f = S[i] / len; o[0] = lerp(1, .8, f); o[1] = lerp(1, 1.05, f); o[2] = lerp(1, .7, f); });
  put(M.bark, cnAll(g, -1, 0));
  const P = V3(), N = V3();
  for (let i = 0, n = Q(Math.round(len * 14)); i < n; i++) { const s = lerp(.05, len * .95, (i + rnd() * .6) / n), th = i * 2.4; N.copy(e1).multiplyScalar(Math.cos(th)).addScaledVector(e2, Math.sin(th)); P.copy(Pb).addScaledVector(d, s).addScaledVector(N, rad(s) * .9); const tl = (rad(s) * .9 + .01) * 1.3 * THS; put(M.vc, cnAll(skinW(thorn(P, N, d, tl, tl * .34), () => chainW(chain, seg, SN, s)), -1, 0)); }
  for (let i = 0, n = Math.max(2, Math.round(len * 4 * VR.leaf)); i < n; i++) {
   const f = lerp(.25, .95, (i + rnd() * .5) / n), s = f * len, sg = i % 2 ? 1 : -1; P.copy(Pb).addScaledVector(d, s);
   const Ly = V3().copy(e1).multiplyScalar(sg * rr(.5, .9)).addScaledVector(d, rr(.3, .7)).addScaledVector(e2, rr(-.2, .3)).normalize(), Ln = V3().copy(e2).addScaledVector(YAX, .5); Ln.addScaledVector(Ly, -Ln.dot(Ly)).normalize();
   const sz = rr(.13, .2) * (1 - .25 * f);
   put(M.leaf, cnAll(skinW(leafCard(P.clone().addScaledVector(Ly, .03), Ly, Ln, sz, sz, f > .7 && rnd() < .5 ? 2 : rnd() < .5 ? 0 : 1, tintLeaf(), 1.2, rnd() * TAU), () => chainW(chain, seg, SN, s)), -1, 0));
  }
  if (rnd() < .45 * VR.berry) { const s = len * .92, at = V3().copy(Pb).addScaledVector(d, s); addBunch(chain[SN], V3(0, -.01, s - SN * seg), at, Math.max(3, Math.round(4 * DET)), 1.0, [-1, 0]); }
  SHOOTS.push({ chain, el, al, len, ph: rnd() * TAU, k: [{ x: 0, v: 0 }, { x: 0, v: 0 }] });
 }

 // ---------- horns (the ancient crown): huge old woody canes curving up out of the crown ----------
 const HORNS = [], HN = 4;
 for (let m = 0; m < VR.horns; m++) {
  const al = [-.45, .55, 2.75][m] + rr(-.15, .15), el = rr(1.0, 1.25), len = rr(1.6, 2.05), seg = len / HN;
  const Pb = domeP(.9, al, .55, V3());
  const h0 = bone('h' + m + '_0', crown, Pb.x, Pb.y, Pb.z, 'YXZ'); h0.rotation.set(-el, al, 0);
  const chain = [h0]; for (let i = 1; i <= HN; i++) chain.push(bone('h' + m + '_' + i, chain[i - 1], 0, 0, seg));
  const d = V3(Math.cos(el) * Math.sin(al), Math.sin(el), Math.cos(el) * Math.cos(al)), e1 = V3(Math.cos(al), 0, -Math.sin(al)), e2 = V3().crossVectors(d, e1).normalize();
  const rad = (s) => lerp(.16, .032, Math.pow(Math.max(0, s) / len, .9)) * sm(len + .05, len - .15, s) * (1 + .1 * Math.sin(s * 9));
  const g = rodTube(Pb, d, e1, e2, -.3, len + .05, Q(30, 12), Q(10, 6), (s, th) => rad(s) * (1 + .12 * Math.sin(th * 2 + s * 6) + .06 * Math.sin(th * 5 - s * 11)), (s, w) => { w[0] = .03 * Math.sin(s * 3 + m); w[1] = .02 * Math.sin(s * 4.4 + m); }, .7), S = g.userData.S;
  skinW(g, (x, y, z, i) => chainW(chain, seg, HN, S[i])); colorAll(g, [.8, .74, .68]); put(M.wood, cnAll(g, -1, 0));
  const P = V3(), N = V3();
  for (let i = 0, n = Q(12); i < n; i++) { const s = lerp(.2, len * .9, (i + rnd() * .6) / n), th = i * 2.4; N.copy(e1).multiplyScalar(Math.cos(th)).addScaledVector(e2, Math.sin(th)); P.copy(Pb).addScaledVector(d, s).addScaledVector(N, rad(s) * .85); const tl = (rad(s) * .7 + .03) * 1.25 * THS; put(M.vc, cnAll(skinW(thorn(P, N, d, tl, tl * .3), () => chainW(chain, seg, HN, s)), -1, 0)); }
  HORNS.push({ chain, ph: rnd() * TAU, curl: rr(.2, .32) });
 }

 // ---------- the crown's own leaves: the lush thicket it hides in, a few dead ones low down, and fruit ----------
 {
  const n = Q(Math.round(190 * VR.leaf)), P = V3(), N = V3(), Ly = V3(), Ln = V3();
  for (let i = 0; i < n; i++) {
   const a = rnd() * TAU, e0 = Math.asin(Math.pow(rnd(), .75)) * 1.02, low = e0 < .35, e = e0 > 1 ? 1 - (e0 - 1) * .55 : e0; // a lip round the hollow
   domeP(e, a, rr(.98, 1.22), P); domeN(e, a, N); P.y += .02;
   Ly.copy(N).add(V3(rr(-.5, .5), rr(.2, .7), rr(-.5, .5))).normalize();
   Ln.copy(YAX).multiplyScalar(.7).addScaledVector(N, .5).add(V3(rr(-.3, .3), 0, rr(-.3, .3))); Ln.addScaledVector(Ly, -Ln.dot(Ly)).normalize();
   const sz = rr(.22, .34), cell = low && rnd() < .35 ? 3 : rnd() < .1 ? 2 : rnd() < .5 ? 0 : 1;
   put(M.leaf, cnAll(skinW(leafCard(P.clone().addScaledVector(Ly, -.03), Ly, Ln, sz, sz * 1.05, cell, tintLeaf(), .7, rnd() * TAU), () => [[BI.mass, 1]]), -1, 0));
  }
  const nb = Math.max(2, Math.round(4 * VR.berry * DET));
  for (let i = 0; i < nb; i++) {
   const a = (i + rnd() * .6) / nb * TAU, e = rr(.45, 1.0), at = domeP(e, a, 1.06, V3());
   addBunch(mass, at, at, Math.max(3, Math.round(rr(3.5, 5) * DET)), 1.2, [-1, 0]);
  }
 }

 // ---------- Undergrowth (not on the sheets): thorned shoots that burst up out of the soil round the prey ----------
 // Real brambles spread underground and root where their tips touch the soil; this one does it in a heartbeat. Each shoot
 // is a chain of UN + 1 bones under the ground bone, built along +Z and parked under the soil at a scale of nothing;
 // animate() plants them in a ring round the prey's feet, grows them up, closes them over it and draws them back down.
 const SNARE = [], UN = 3, NE = Q(7, 5);
 for (let m = 0; m < NE; m++) {
  const len = r2(1.5, 2.0), seg = len / UN, B = V3(0, -1, 0), d = V3(0, 0, 1), e1 = V3(1, 0, 0), e2 = V3(0, 1, 0);
  const b0 = bone('u' + m + '_0', ground, B.x, B.y, B.z, 'YXZ');
  const chain = [b0]; for (let i = 1; i <= UN; i++) chain.push(bone('u' + m + '_' + i, chain[i - 1], 0, 0, seg));
  const rad = (s) => lerp(.075, .012, Math.pow(Math.max(0, s) / len, .8)) * sm(len + .02, len - .07, s) * (1 + .12 * Math.exp(-Math.pow(((Math.max(0, s) / .36) % 1 - .5) * 6, 2)));
  const ph = r2(0, TAU), wob = (s, w) => { w[0] = .035 * Math.sin(s * 3.1 + ph); w[1] = .025 * Math.sin(s * 2.3 + ph * 1.3); };
  const g = rodTube(B, d, e1, e2, -.06, len + .02, Q(22, 10), Q(8, 5), (s, th) => rad(s) * (1 + .06 * Math.sin(th * 3 + s * 8)), wob, .55), S = g.userData.S;
  skinW(g, (x, y, z, i) => chainW(chain, seg, UN, S[i])); attr(g, 'color', 3, (i, o) => { const f = S[i] / len; o[0] = lerp(.95, .8, f); o[1] = lerp(.88, 1.04, f); o[2] = lerp(.9, .7, f); });
  put(M.bark, cnAll(g, -1, 0));
  const P = V3(), N = V3(), w = [0, 0];
  for (let i = 0, n = Q(Math.round(len * 12)); i < n; i++) {
   const s = lerp(.1, len * .95, (i + r2(.1, .9)) / n), th = i * 2.4 + r2(-.3, .3), r = rad(s); wob(s, w);
   N.copy(e1).multiplyScalar(Math.cos(th)).addScaledVector(e2, Math.sin(th)); P.copy(B).addScaledVector(d, s).addScaledVector(e1, w[0]).addScaledVector(e2, w[1]).addScaledVector(N, r * .9);
   const tl = (r * 1.1 + .03) * 1.3 * THS; put(M.vc, cnAll(skinW(thorn(P, N, d, tl, tl * .36, r2(.6, .95)), () => chainW(chain, seg, UN, s)), -1, 0));
  }
  for (let i = 0; i < 3; i++) {
   const s = r2(.3, .8) * len, sg = i % 2 ? 1 : -1; wob(s, w); P.copy(B).addScaledVector(d, s).addScaledVector(e1, w[0]).addScaledVector(e2, w[1]);
   const Ly = V3().copy(e1).multiplyScalar(sg * r2(.5, .9)).addScaledVector(d, r2(.3, .7)).addScaledVector(e2, r2(-.3, .3)).normalize(), Ln = V3().copy(e2).addScaledVector(d, .3);
   Ln.addScaledVector(Ly, -Ln.dot(Ly)).normalize(); const sz = r2(.16, .24);
   put(M.leaf, cnAll(skinW(leafCard(P.clone().addScaledVector(Ly, .03), Ly, Ln, sz, sz, rnd2() < .5 ? 0 : 1, [r2(.86, 1.1), r2(.9, 1.12), r2(.8, 1.02)], 1.2, r2(0, TAU), undefined, undefined, rnd2()), () => chainW(chain, seg, UN, s)), -1, 0));
  }
  SNARE.push({ chain, len, a: (m + r2(-.3, .3)) / NE * TAU, R: r2(.5, .72), t0: r2(0, .055), lean: r2(.22, .42), curl: r2(.38, .55), ph: r2(0, TAU), g: 0, up: false, down: false });
 }

 // ---------- bind ----------
 base.scale.setScalar(SZ);
 root.updateMatrixWorld(true);
 const skeleton = new THREE.Skeleton(bones);
 const bodyMeshes = [];
 for (const [mat, list] of BK) { const m = new THREE.SkinnedMesh(mergeAll(list), mat); m.frustumCulled = false; base.add(m); bodyMeshes.push(m); }
 root.updateMatrixWorld(true);
 for (const m of bodyMeshes) m.bind(skeleton);
 for (const b of bones) b.userData.bind = { p: b.position.clone(), q: b.quaternion.clone(), parent: b.parent };
 const soil = new THREE.Mesh(new THREE.CircleGeometry(CR * 2.7, Q(40, 16)), M.soil); soil.rotation.x = -PI / 2; soil.position.y = .004; soil.renderOrder = -1; base.add(soil);

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
  p.onBeforeRender = (r) => { r.getDrawingBufferSize(_v2); m.uniforms.uScale.value = _v2.y * .5; };
  return { p, pos, col, size, rot, g, n, m, vel: new Float32Array(n * 3), life: new Float32Array(n), max: new Float32Array(n).fill(1), base: new Float32Array(n * 4), sz: new Float32Array(n * 2), drag: new Float32Array(n), up: new Float32Array(n), spin: new Float32Array(n), sway: new Float32Array(n), next: 0, live: 2 };
 }
 // falling leaves, dust and soil, sweet motes (the lure, the drain), bark and thorn chips, and for the polish: flames,
 // and berry juice and clods of soil (both heavy and dark, so they share a pool with the chips)
 const LF = points(Q(150, 60), leafT, THREE.NormalBlending, 8), DU = points(110, puffT, THREE.NormalBlending, 7), MO = points(240, dotT, THREE.AdditiveBlending, 9), CHP = points(160, dotT, THREE.NormalBlending, 8);
 const FL = points(Q(140, 70), flameT, THREE.AdditiveBlending, 9); FL.upright = true; FL.end = new THREE.Color(.55, .06, .02);
 fx.add(LF.p, DU.p, MO.p, CHP.p, FL.p);
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
 // whip trails: additive ribbons of the last positions of a cane's tip and a point further in
 const TRN = 14;
 function makeTrail() {
  const pos = new Float32Array(TRN * 6), col = new Float32Array(TRN * 6), idx = [];
  for (let i = 0; i < TRN - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('color', new THREE.BufferAttribute(col, 3).setUsage(THREE.DynamicDrawUsage)); g.setIndex(idx);
  const mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial(Object.assign({ vertexColors: true, side: THREE.DoubleSide }, ADD))); mesh.frustumCulled = false; mesh.visible = false; mesh.renderOrder = 7; fx.add(mesh);
  const tip = [], mid = []; for (let i = 0; i < TRN; i++) { tip.push(V3()); mid.push(V3()); }
  return { mesh, g, pos, col, tip, mid, prev: 0 };
 }
 const TRAILS = [LEAD].concat(CANES.filter((c) => c.g === 'F').slice(0, 1), CANES.filter((c) => c.g === 'S').slice(0, 1)).map((C) => Object.assign(makeTrail(), { C }));
 // the lure's sweet light, which is also the firelight when it burns
 const lureLight = new THREE.PointLight(0xff8a70, 0, 3.2 * SZ, 2); fx.add(lureLight);
 const LUREC = new THREE.Color(0xff8a70), FIREC = new THREE.Color(0xff7a2c);
 // the ground splitting for Undergrowth: a crack from where each of three canes stabs into the soil to the prey's feet,
 // each a strip of ground rewritten every frame it shows; its root glows like the veins
 const NCK = 3, ckPos = new Float32Array(NCK * 12), ckUv = [], ckIdx = [], ckA = [V3(), V3(), V3()], ckOn = [0, 0, 0];
 for (let i = 0; i < NCK; i++) { ckUv.push(0, 0, 0, 1, 1, 0, 1, 1); const b = i * 4; ckIdx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); }
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
 // the drain: three ribbons of stolen life twisting from the prey down into the hollow while it feeds (Consume)
 const DRN = 3, DRS = 22, drPos = new Float32Array(DRN * (DRS + 1) * 6), drCol = new Float32Array(DRN * (DRS + 1) * 6), drIdx = [];
 for (let r = 0; r < DRN; r++) for (let i = 0; i < DRS; i++) { const a = (r * (DRS + 1) + i) * 2; drIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
 const drG = new THREE.BufferGeometry(); drG.setAttribute('position', new THREE.BufferAttribute(drPos, 3).setUsage(THREE.DynamicDrawUsage)); drG.setAttribute('color', new THREE.BufferAttribute(drCol, 3).setUsage(THREE.DynamicDrawUsage)); drG.setIndex(drIdx);
 const drain = new THREE.Mesh(drG, new THREE.MeshBasicMaterial(Object.assign({ vertexColors: true, side: THREE.DoubleSide }, ADD))); drain.frustumCulled = false; drain.visible = false; drain.renderOrder = 8; fx.add(drain);

 // ---------- poses and actions ----------
 // body: y crown lift, lean (forward +), tw twist, rl roll, sq squash, sw swirl (every cane turns the same way), coil (every
 //   cane curls sideways along its length, the same way round), pulse breathing
 // canes, by group (L the lead cane, F the other front canes, S the sides, B the back): l lift (the cane's rise where it
 //   leaves the crown), c curl (bend spread along it; negative arches it back over the crown), t tip curl (the last three
 //   joints), y swing toward the front, w writhe, k reach for the target (state.target)
 // reach: ikd how far toward the target, ikh height added, wrap the tip's curl round what it holds, pull drags the
 //   reach point back to the crown
 // look: glow (the berries gleam), lure (sweet motes), fade (1 solid, 0 gone), trail (whip trails), rust (leaves rustle),
 //   wither, dust, drain (a stream from the prey into the crown), shed (falling leaves), feed (the root veins glow), fire
 //   (flames along it, leaves charring), gr (its growth, as it comes up out of the soil)
 const G4 = ['L', 'F', 'S', 'B'];
 function cg(g, l, c, t, y, w, k) { const o = {}, gs = g === '*' ? G4 : g.split(''); for (const q of gs) { if (l !== undefined) o[q + 'l'] = l; if (c !== undefined) o[q + 'c'] = c; if (t !== undefined) o[q + 't'] = t; if (y !== undefined) o[q + 'y'] = y; if (w !== undefined) o[q + 'w'] = w; if (k !== undefined) o[q + 'k'] = k; } return o; }
 const K = (...a) => Object.assign({}, ...a);
 // battle idle, as the sheet's in-game strip: canes arched out like legs, tips on the ground, fruit hanging
 const BASE = K({ y: 0, lean: 0, tw: 0, rl: 0, sq: 0, sw: 0, coil: 0, pulse: 1, gr: 1, ikd: 1, ikh: 0, wrap: 0, pull: 0, glow: 0, lure: 0, fade: 1, trail: 0, rust: 1, wither: 0, dust: 0, drain: 0, shed: 0, feed: 0, fire: 0 },
  cg('L', 1.42, 1.5, 1.35, .2, 1, 0), cg('F', 1.3, 2.4, .6, .12, 1, 0), cg('S', 1.16, 2.8, .4, 0, 1, 0), cg('B', 1.1, 2.8, .45, -.1, 1, 0));
 const KEYS = Object.keys(BASE);
 // resting / disguised: a low, ordinary (if unusually lush) thicket, canes draped on the ground
 const REST = K(cg('*', .7, 1.9, .4, -.04, .2), { coil: 2.6, y: -.04, sq: .1, pulse: .35, rust: .45 });
 // alert: canes rise and turn toward the prey, fruit swinging from the hooked tips
 const ALERT = K(cg('LF', 1.32, 1.35, 1.55, .32, .45), cg('S', 1.28, 1.45, 1.45, .4, .45), cg('B', 1.22, 1.65, 1.2, .3, .45), { y: .05, lean: -.06, sq: -.04, glow: .25, rust: 1.6, feed: .15 });
 // guard: a wall of thorns, front canes crossed before the crown
 const GUARD = K(cg('LF', 1.5, 1.35, 1.0, .82, .35), cg('S', 1.45, 1.45, .9, .68, .35), cg('B', 1.25, 2.3, .5, .2, .5), { lean: -.04, sq: .04, rust: 1.3 });
 const WALK = { lean: .07, rust: 1.4, y: .03 };
 // over the crown: every cane arched back over the root mass into a cage, for Consume
 const OVER = K(cg('*', 1.5, -3.15, -.35, 0, .2), { sw: .4 });
 const ACTS = {};
 const EASE = { s: (x) => x * x * (3 - 2 * x), l: (x) => x, i: (x) => x * x, o: (x) => 1 - (1 - x) * (1 - x) };
 const DUR = VNAME === 'ancient' ? 1.15 : 1;
 function act(name, dur, keys, o) {
  const t = [], p = [], e = []; let prev = BASE;
  for (const [u, k, ez] of keys) { const full = Object.assign({}, prev, k); t.push(u); p.push(full); e.push(EASE[ez || 's']); prev = full; }
  ACTS[name] = Object.assign({ dur: dur * DUR, t, p, e, hits: [], cues: [], hold: false, interrupt: false, rate: 12, snap: null }, o || {});
 }
 function evalKeys(def, u, out) {
  const T = def.t, Pk = def.p; let i = 0; while (i < T.length - 2 && u > T[i + 1]) i++;
  const a = T[i], b = T[i + 1], s = b > a ? cl((u - a) / (b - a), 0, 1) : 1, f = def.e[i + 1](s);
  for (const k of KEYS) out[k] = lerp(Pk[i][k], Pk[i + 1][k], f);
 }
 // 1 (the encounter) it grows up out of the soil as an ordinary thicket, keeps still, then reveals itself
 act('appear', 2.4, [[0, K(REST, { fade: 0, gr: .3 })], [.26, { fade: 1, gr: 1 }, 'o'], [.42, {}], [.66, K(ALERT, { dust: .9, rust: 2.4, shed: .3, feed: .8 }), 'o'], [.82, K(ALERT, { dust: 0, shed: 0 })], [1, BASE]],
  { snap: KEYS, cues: [.42], rate: 9 });
 // 2 Alert: senses prey; canes rise and orient toward it
 act('alert', 1.6, [[0, {}], [.28, ALERT, 'o'], [.7, K(ALERT, cg('*', undefined, undefined, undefined, undefined, .25))], [1, BASE]], { cues: [.2], rate: 9 });
 // 3 Lure: one berry-laden cane reaches out and holds invitingly still while the rest lie low and innocent;
 // the fruit swells and gleams and a sweet haze drifts off it. "The fruit is real. The danger is not."
 act('lure', 2.6, [[0, {}],
  [.2, K(cg('L', 1.1, 1.2, 1.6, .2, .1, .92), cg('F', .95, 2.4, .4, 0, .3), cg('S', .9, 2.4, .4, -.05, .3), cg('B', .9, 2.5, .4, -.1, .3), { ikd: .58, ikh: .3, wrap: .9, lean: .04, y: -.02, lure: 1, glow: .6, rust: .5 })],
  [.32, { glow: 1.15, lure: 1.6 }], [.78, { glow: 1, lure: 1.1 }], [1, BASE]], { hits: [.55], cues: [.32], rate: 8 });
 // 4 Strike: the lead cane coils back and lunges; the recurved thorns catch and hold, then it rips free
 act('strike', 1.3, [[0, {}],
  [.24, K(cg('L', 1.95, 2.4, 1.2, .45, .15, 0), cg('F', 1.45, 2.1, .7, .25, .6), { lean: -.15, tw: -.16, y: .05, sq: -.07, rust: 1.8 }), 'o'],
  [.38, { Lk: 1, ikd: 1.02, ikh: 0, wrap: .45, trail: 1, lean: .2, tw: .1, sq: .08, rust: 2.6, Fl: 1.22, Fc: 2.65 }, 'i'],
  [.46, { wrap: 1.35 }], [.64, { Lk: .9, wrap: 1.5, trail: 0, lean: .1 }],
  [.84, K(cg('L', 1.3, 2.5, .5, .2, .6, 0), cg('F', 1.3, 2.4, .6, .12, 1), { lean: 0, tw: 0 }), 'o'], [1, BASE]], { hits: [.4], cues: [.3], rate: 22 });
 // 5 Grab / Pull In: three canes lash out together, wrap the prey, squeeze twice and drag it toward the root crown
 act('grab', 2.8, [[0, {}],
  [.16, K(cg('LF', 1.65, 1.5, 1.3, .35, .4), cg('S', 1.55, 1.6, 1.2, .55, .4), { lean: -.1, y: .05, sq: -.05, rust: 1.8 }), 'o'],
  [.32, K(cg('LFS', undefined, undefined, undefined, undefined, undefined, 1), { ikd: 1, wrap: 2.6, lean: .12, trail: .7, rust: 2.4 }), 'i'],
  [.4, { trail: 0, pull: .24 }], [.5, { pull: .34, sq: .05, ikh: .24 }], [.6, { pull: .26, sq: -.03, ikh: .08 }], [.72, { pull: .46, sq: .06, ikh: .3 }],
  [.88, K(cg('LF', undefined, undefined, undefined, undefined, undefined, .75), { Sk: .7, pull: .9, wrap: 2.2, lean: -.06, dust: .8, ikh: .05 }), 'o'], [1, BASE]],
  { hits: [.35, .54, .74], cues: [.27], rate: 16 });
 // 6 Consume: the canes arch back over the crown into a cage and press down; the root mass pulses as it feeds,
 // drawing a stream out of the prey (each pulse a blow, then a heal)
 act('consume', 3.2, [[0, {}],
  [.14, K(OVER, { lean: .05, y: -.02, rust: 1.4, drain: .4, feed: .4 }), 'o'],
  [.26, K(cg('*', undefined, -3.4), { sq: .13, drain: 1, glow: .2, dust: .5, feed: 1 })], [.38, K(cg('*', undefined, -3.1), { sq: -.05 })],
  [.48, K(cg('*', undefined, -3.4), { sq: .13 })], [.58, K(cg('*', undefined, -3.1), { sq: -.05 })],
  [.68, K(cg('*', undefined, -3.4), { sq: .13 })], [.78, K(cg('*', undefined, -3.1), { sq: -.04, drain: .3, feed: .5 })],
  [.9, { drain: 0, dust: 0, feed: 0 }], [1, BASE]], { hits: [.28, .48, .68], cues: [.38, .58, .78], rate: 9 });
 // Thorn Sweep (the one move not on the sheets, for a blow on the whole party): it winds round and sweeps its canes
 // flat across the front
 act('sweep', 2.0, [[0, {}],
  [.26, K(cg('LF', .45, .9, .3, 0, .2), cg('S', .5, 1.0, .35, .4, .2), { tw: -1.0, lean: -.06, y: .05, sq: -.04 }), 'o'],
  [.44, { tw: .55, trail: 1, rust: 2.6, lean: .08 }, 'i'], [.54, { tw: .95, dust: .6 }, 'l'], [.68, { tw: 1.05, trail: 0, dust: 0 }, 'o'], [1, BASE]],
  { hits: [.47], cues: [.32], rate: 16 });
 // Undergrowth (not on the sheets either; a big move for the higher levels): it rears and stabs its canes into the soil, a
 // pulse runs out along its roots and the ground splits toward the prey; thorned shoots burst up round it, close over it
 // and squeeze, then sink back as the canes tear free. The shoots themselves are driven by animate(), not by these keys.
 act('undergrowth', 3.4, [[0, {}],
  [.2, K(cg('LF', 1.75, 1.6, .9, .15, .6), cg('S', 1.65, 1.7, .8, .1, .6), cg('B', 1.5, 2, .6, 0, .6), { lean: -.2, y: .07, sq: -.08, rust: 2, feed: .3 }), 'o'],
  [.3, K(cg('LF', .25, 2.9, 1.3, .7, .3), cg('S', .3, 2.8, 1.2, .55, .3), cg('B', .5, 2.6, 1, .2, .3), { lean: .2, y: -.03, sq: .12, rust: 2.8, dust: 1, feed: 1 }), 'i'],
  [.36, { dust: 0, sq: .06 }],
  [.6, K(cg('*', undefined, undefined, undefined, undefined, 1.2), { feed: .8, rust: 1.6 })],
  [.66, { sq: .12, feed: 1.2, rust: 2.4 }], [.74, { sq: .05, feed: .7 }],
  [.86, K(cg('*', 1.55, 1.5, .9, .3, .6), { lean: -.08, y: .04, sq: -.05, dust: .7, feed: .2 }), 'o'],
  [1, BASE]], { hits: [.45, .65], cues: [.3, .86], rate: 14 });
 // 7 Hurt / Recover: recoils, canes flinching up and away, leaves torn loose
 act('hurt', .6, [[0, {}], [.16, K(cg('*', 1.55, 2.0, .2, -.35, 2.5), { lean: -.24, y: .03, sq: -.08, shed: 1.2, rust: 3 })], [1, BASE]], { interrupt: true, rate: 18 });
 act('block', .5, [[0, {}], [.3, K(GUARD, { lean: -.08, rust: 1.6 })], [.7, {}], [1, BASE]], { interrupt: true, rate: 20 });
 // Scorch (not on the sheets: its recoil from fire, which the sheets say it fears): it rears away from the flames, beating
 // at them, leaves catching and curling black, and smoulders as it regroups. The char fades over the next few seconds.
 act('burn', 1.4, [[0, {}],
  [.12, K(cg('*', 1.8, 1.0, .1, -.5, 3.4), { lean: -.34, y: .06, sq: -.12, shed: 2, rust: 3.6, fire: 1 }), 'o'],
  [.3, K(cg('*', 1.6, 1.3, .3, -.4, 2.6), { lean: -.26, fire: 1, shed: 1 })],
  [.6, K(cg('*', 1.45, 1.9, .5, -.15, 1.6), { lean: -.1, fire: .45, shed: .4, rust: 2 })],
  [1, BASE]], { interrupt: true, rate: 16 });
 act('rest', 1.6, [[0, {}], [1, REST]], { hold: true, rate: 6 });
 // Defeated: a last flail, then it collapses flat, withers brown, sheds and crumbles away
 act('die', 3.8, [[0, {}],
  [.08, K(cg('*', 1.75, 1.0, .6, .1, 3), { lean: -.2, y: .07, sq: -.08, rust: 3, shed: 1, feed: 1.4 })],
  [.34, K(cg('*', .2, .5, .1, -.1, .15), { coil: 1.4, lean: .1, y: -.1, sq: .32, rust: .5, shed: 1.6, dust: 1, wither: .45, feed: 0 }), 'i'],
  [.72, { wither: 1, shed: .5, dust: 0, sq: .36, y: -.13, pulse: 0 }], [.94, { fade: 0, shed: 0 }], [1, { fade: 0 }]],
  { hold: true, interrupt: true, cues: [.34], rate: 10 });

 // ---------- runtime ----------
 const state = { target: null, glow: 1, wilt: 0 };
 const FIN = Object.assign({}, BASE), TGT = Object.assign({}, BASE);
 let actv = null, gOn = false, gW = 0, fadeE = 1, liftV = 0, walkS = 0, lastName = '', lastU = 0, lastPhase = 0;
 const TS = VNAME === 'ancient' ? .82 : 1;
 // the polish's runtime: the idle cane that tastes the air (TW), the pulse running out along the roots (VW), the char fire
 // leaves, where a held prey belongs and how firmly it is held, and how idle it is (the twitches fade out in any move)
 const TW = { k: -1, t: 0, dur: 2, wait: 2.2, e: 0 }, VW = { t: 9, s: 0 }, held = V3();
 let charV = 0, holdV = 0, idleW = 1, playN = 0, curN = 0, lastN = 0, HB = 0;
 function play(name, force) {
  let def = ACTS[name]; if (!def) return false;
  const gone = FIN.fade < .02 && (!actv || actv.name === 'die');
  if (gone && name !== 'appear') { name = 'appear'; def = ACTS.appear; }
  if (actv && !force) {
   if (actv.name === 'die' && name !== 'appear') return false;
   if (!def.interrupt && !(actv.def.hold && actv.t >= actv.def.dur - 1e-6)) return false;
  }
  if (def.snap) { for (const k of def.snap) FIN[k] = def.p[0][k]; for (const C of CANES) C.sp = null; }
  if (name === 'appear') { regrow(); fxS.reveal = false; charV = 0; }
  actv = { name, def, t: 0, n: ++playN };
  return true;
 }
 // a pulse of light running out from the hollow along the roots (strength s, about half a second to reach their ends)
 const pulse = (s) => { VW.t = 0; VW.s = s; };
 const _a = V3(), _b = V3(), _c = V3(), _d = V3(), _tg = V3(), _sd = V3(), _cf = V3(), _up = V3(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion();
 const lerpA = (a, b, t) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * t;
 const TIPW = new Float32Array(NS + 1); TIPW[NS - 3] = .2; TIPW[NS - 2] = .35; TIPW[NS - 1] = .45;
 // follow-through: each cane joint chases its pose on a spring, stiff near the crown and softer toward the tip (slightly
 // underdamped), so the canes lag, whip and overshoot instead of moving as one stiff piece
 const SPK = Float32Array.from({ length: NS + 1 }, (_, i) => 1150 * (1 - .62 * i / NS)), SPD = SPK.map((k) => 2 * .42 * Math.sqrt(k));
 // where each group's canes take hold round the prey: sideways (toward their own side) and up, in meters
 const HOLD = { L: [.02, .05], F: [.2, -.22], S: [.24, .4], B: [.16, .58] };
 const IK = { yaw: 0, phi: 0, kap: 0, s: 0 };
 // a constant-curvature arc from the cane's base whose point at s* passes through the target (in the crown's space); a far
 // target makes the cane stretch, moving s* out toward the tip, and what is left past s* coils round the prey
 function solveReach(C, T) {
  _a.copy(T); crown.worldToLocal(_a);
  const B = C.chain[0].position, dx = _a.x - B.x, dy = _a.y - B.y, dz = _a.z - B.z, d = Math.hypot(dx, dz), c = Math.hypot(d, dy), s = IK.s = cl(c, C.len * .74, C.len * .9);
  IK.yaw = Math.atan2(dx, dz);
  let kap = 0;
  if (c < s * .999) { let lo = 0, hi = TAU / s * .98; for (let i = 0; i < 18; i++) { const m = (lo + hi) / 2; if (2 * Math.sin(m * s / 2) / m - c > 0) lo = m; else hi = m; } kap = (lo + hi) / 2; }
  IK.phi = Math.min(2.5, Math.atan2(dy, d) + kap * s / 2); IK.kap = kap;
 }
 // springs for the shoots, and the crown's motion that drives them
 const st = { init: false, px: 0, pz: 0, vx: 0, vz: 0, ax: 0, az: 0, acc: 0 };
 const spring = (s, target, h, Kk, C) => { s.v += (Kk * (target - s.x) - C * s.v) * h; s.x += s.v * h; };
 const PH = 1 / 120;
 const DOWN = V3(0, -1, 0);
 // after the bind: each fruit bone's "down" in its own frame, so a bunch hangs plumb whatever holds it
 for (const Bq of BERRIES) { Bq.bone.getWorldQuaternion(_q); Bq.hang = DOWN.clone().applyQuaternion(_q.invert()).normalize(); Bq.dd = r2(0, .14); Bq.dk = 0; Bq.lead = Bq.bone === LEAD.bunch1 || Bq.bone === LEAD.bunch2; }

 function animate(phase, walk, t, dt) {
  dt = dt > 0 ? Math.min(dt, .05) : 0;
  walk = cl(walk || 0, 0, 1);
  let u = 0, name = '';
  curN = actv ? actv.n : 0;
  if (actv) { actv.t += dt; u = Math.min(1, actv.t / actv.def.dur); name = actv.name; if (u >= 1 && !actv.def.hold) actv = null; }
  if (actv) evalKeys(actv.def, u, TGT); else Object.assign(TGT, BASE);
  gW += ((gOn && !actv ? 1 : 0) - gW) * (dt > 0 ? 1 - Math.exp(-dt * 7) : 0);
  const wk = actv ? 0 : walk;
  walkS += (wk - walkS) * (dt > 0 ? 1 - Math.exp(-dt * 6) : 1);
  if (gW > 1e-3) for (const k in GUARD) TGT[k] = lerp(TGT[k], GUARD[k], gW);
  if (walkS > 1e-3) for (const k in WALK) TGT[k] = lerp(TGT[k], WALK[k], walkS * (1 - gW));
  const rate = actv ? actv.def.rate : 6, kk = dt > 0 ? 1 - Math.exp(-dt * rate) : 1;
  for (const q of KEYS) FIN[q] += (TGT[q] - FIN[q]) * kk;
  const P = FIN, tt = t * TS;
  // the crown: breathing, the creeping gait's bob, lean, twist and squash
  const breath = .5 + .5 * Math.sin(tt * 1.15), ps = .03 * P.pulse * (breath - .5);
  crown.position.set(0, P.y + walkS * .035 * Math.abs(Math.sin(phase)) + .008 * breath * P.pulse, 0);
  crown.rotation.set(P.lean + walkS * .05 + .015 * Math.sin(tt * .7) * P.pulse, P.tw + .02 * Math.sin(tt * .5) * P.pulse, P.rl + .012 * Math.sin(tt * .63) * P.pulse);
  mass.scale.set(1 + P.sq * .5 + ps, 1 - P.sq + ps * 1.4, 1 + P.sq * .5 + ps); crown.scale.setScalar(P.gr);
  root.updateMatrixWorld(true);
  // the crown's own motion, for the springs
  const rx = root.position.x, rz = root.position.z, yawR = root.rotation.y;
  if (!st.init || Math.hypot(rx - st.px, rz - st.pz) > 1.5 * SZ) { st.px = rx; st.pz = rz; st.vx = st.vz = st.ax = st.az = 0; st.init = true; for (const Bq of BERRIES) Bq.init = false; for (const C of CANES) C.sp = null; }
  if (dt > 0) {
   const kv = 1 - Math.exp(-dt / .1), ka = 1 - Math.exp(-dt / .08), nvx = st.vx + ((rx - st.px) / dt - st.vx) * kv, nvz = st.vz + ((rz - st.pz) / dt - st.vz) * kv;
   st.ax += ((nvx - st.vx) / dt - st.ax) * ka; st.az += ((nvz - st.vz) / dt - st.az) * ka; st.vx = nvx; st.vz = nvz;
  }
  st.px = rx; st.pz = rz;
  const cy = Math.cos(yawR), sy = Math.sin(yawR), alx = (st.ax * cy - st.az * sy) / SZ, alz = (st.ax * sy + st.az * cy) / SZ;
  // the prey: state.target (world), or a point in front at chest height
  const tg = state.target; if (tg) _tg.set(tg.x, tg.y, tg.z); else root.localToWorld(_tg.set(0, 1.05, 2.45 * SZ));
  _sd.set(_tg.x - rx, 0, _tg.z - rz); const tl = _sd.length() || 1; _sd.set(_sd.z / tl, 0, -_sd.x / tl);
  root.localToWorld(_cf.set(0, (CH + .25) * SZ, CR * .95 * SZ));
  crown.getWorldQuaternion(_q); _up.set(0, 1, 0).applyQuaternion(_q.invert());
  // where a held prey's chest belongs (the bench or the battle moves it there), and how firmly the canes hold it
  held.copy(_tg); held.y += P.ikh; held.lerp(_cf, P.pull);
  holdV = cl(Math.max(P.Lk, P.Fk, P.Sk) * sm(.7, 1.7, P.wrap), 0, 1) * cl(P.fade * 2, 0, 1);
  // idle: every few seconds one cane lifts its tip and tastes the air, swaying, then settles
  idleW += ((actv ? 0 : 1 - gW) - idleW) * (dt > 0 ? 1 - Math.exp(-dt * 3) : 0);
  if (dt > 0) {
   if (TW.k < 0) { TW.wait -= dt; if (TW.wait <= 0) { const live = CANES.filter((c) => c.cutJ < 0); if (live.length) { TW.k = live[(rnd2() * live.length) | 0].k; TW.t = 0; TW.dur = r2(1.7, 2.6); } else TW.wait = 1; } }
   else { TW.t += dt; if (TW.t >= TW.dur) { TW.k = -1; TW.wait = r2(1.2, 3.6); } }
  }
  TW.e = TW.k < 0 ? 0 : Math.pow(Math.sin(PI * cl(TW.t / TW.dur, 0, 1)), 2) * idleW * (1 - walkS);
  // a slow heartbeat through the roots once it has shown itself (not while it rests, disguised)
  if (dt > 0 && !actv && P.fade > .9) { HB += dt; if (HB > 1.7) { HB = 0; pulse(.35 + .4 * TIER); } }
  // the physics substeps this frame, for the canes' springs, the shoots and the fruit
  const nSteps = Math.min(8, Math.floor((st.acc + dt) / PH)); st.acc = nSteps === 8 ? 0 : st.acc + dt - nSteps * PH;
  // ---------- canes ----------
  for (const C of CANES) {
   const g = C.g, nJ = C.cutJ >= 0 ? C.cutJ : NS + 1;
   let lift = P[g + 'l'] + VR.lift + C.dl, curl = P[g + 'c'] + VR.curl + C.dc, tip = P[g + 't'];
   const w = P[g + 'w'], k = P[g + 'k'];
   let yaw = C.a - C.sgn * P[g + 'y'] + P.sw + w * .035 * Math.sin(tt * .7 + C.ph);
   if (TW.k === C.k && TW.e > 0) { const e = TW.e; lift += .42 * e; curl -= 1.15 * e; tip -= .9 * e; yaw += .2 * Math.sin(tt * 2.2 + C.ph) * e; }
   // the creep: alternate canes lift and swing forward, the others plant and pull
   if (walkS > 1e-3) { const p = phase + (C.k % 2) * PI, swg = Math.max(0, Math.sin(p)); lift += .34 * swg * walkS; curl -= .5 * swg * walkS; yaw += -Math.sin(C.a) * .22 * Math.cos(p) * walkS; }
   const bj = curl / (NS - 1);
   for (let i = 1; i < NS; i++) { C.bend[i] = bj + C.jb[i] + tip * TIPW[i] + w * .05 * Math.sin(tt * 1.3 + i * .85 + C.ph); C.yawW[i] = C.jy[i] + w * .045 * Math.sin(tt * .9 + i * .7 + C.ph * 1.3); }
   let th0 = lift - C.bend[1] * .5 + w * .03 * Math.sin(tt * .6 + C.ph);
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
   const SP = C.sp || (C.sp = { b: Float32Array.from(C.bend), bv: new Float32Array(NS + 1), y: Float32Array.from(C.yawW), yv: new Float32Array(NS + 1) });
   // a cane reaching for its prey stiffens, so it lands on the beat of its hit and still whips a little past it
   const sk = 1 + 3 * k, sd = Math.sqrt(sk);
   for (let n = 0; n < nSteps; n++) for (let i = 1; i < NS; i++) {
    SP.bv[i] += (SPK[i] * sk * (C.bend[i] - SP.b[i]) - SPD[i] * sd * SP.bv[i]) * PH; SP.b[i] += SP.bv[i] * PH;
    SP.yv[i] += (SPK[i] * sk * (C.yawW[i] - SP.y[i]) - SPD[i] * sd * SP.yv[i]) * PH; SP.y[i] += SP.yv[i] * PH;
   }
   for (let i = 1; i < NS; i++) { C.bend[i] = SP.b[i]; C.yawW[i] = SP.y[i]; }
   // keep it out of the ground: a joint that would sink is laid along the soil instead
   C.chain[0].getWorldPosition(_b); const by = (_b.y - root.position.y) / SZ, dl = Math.sin(yaw) * _up.x + Math.cos(yaw) * _up.z;
   let th = th0, y = 0;
   for (let i = 0; i < NS; i++) {
    if (i > 0) th -= C.bend[i];
    const fl = C.rad(Math.min(C.len, (i + 1) * C.seg)) + .012 - by;
    let thW = th + dl, ny = y + C.seg * Math.sin(thW);
    if (ny < fl) { // the forward or the backward way along the soil, whichever is nearer what the pose wants
     const a = Math.asin(cl((fl - y) / C.seg, -1, 1)); thW = thW < -PI / 2 ? -PI - a : a; th = thW - dl; ny = y + C.seg * Math.sin(thW);
    }
    C.theta[i] = th; y = ny;
   }
   C.chain[0].rotation.set(-C.theta[0], yaw, 0);
   const cj = P.coil * C.cm / (NS - 1);
   for (let i = 1; i < NS && i < nJ; i++) { C.chain[i].rotation.x = C.theta[i - 1] - C.theta[i]; C.chain[i].rotation.y = C.yawW[i] + cj; }
   if (nJ > NS) C.chain[NS].rotation.x = tip * .12;
   C.swing = walkS > 1e-3 ? Math.sin(phase + (C.k % 2) * PI) : -1;
  }
  // ---------- shoots and horns ----------
  for (const S of SHOOTS) {
   for (let n = 0; n < nSteps; n++) { spring(S.k[0], cl(-alz * .012 - P.lean * .6, -.6, .6), PH, 30, 2.4); spring(S.k[1], cl(alx * .012 + P.tw * .3, -.6, .6), PH, 30, 2.4); }
   const r = .6 + .4 * P.rust;
   S.chain[0].rotation.set(-S.el + .05 * r * Math.sin(tt * .8 + S.ph) + S.k[0].x, S.al + .05 * r * Math.sin(tt * .6 + S.ph * 2) + S.k[1].x, 0);
   for (let i = 1; i <= SN; i++) { S.chain[i].rotation.x = .2 + .06 * r * Math.sin(tt * 1.2 + i + S.ph) + S.k[0].x * .4; S.chain[i].rotation.y = .05 * r * Math.sin(tt * .9 + i * .8 + S.ph); }
  }
  for (const Hn of HORNS) for (let i = 1; i <= HN; i++) { Hn.chain[i].rotation.x = Hn.curl + .015 * Math.sin(tt * .5 + i + Hn.ph); Hn.chain[i].rotation.y = .02 * Math.sin(tt * .4 + i * .7 + Hn.ph); }
  // ---------- Undergrowth's shoots: planted round the prey's feet, up out of the soil, closing, squeezing, gone ----------
  const ug = name === 'undergrowth' && P.fade > .02;
  if (ug) base.worldToLocal(_d.set(_tg.x, root.position.y, _tg.z));
  for (const S of SNARE) {
   const b0 = S.chain[0], e0 = .44 + S.t0, x = ug ? cl((u - e0) / .07, 0, 1) : 0;
   const gIn = x <= 0 ? 0 : 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2), gOut = ug ? 1 - sm(.85 + S.t0 * .6, .94 + S.t0 * .6, u) : 0;
   S.g = gIn * gOut;
   if (S.g <= 1e-3) { b0.position.set(0, -1, 0); b0.scale.setScalar(1e-4); continue; }
   const px = _d.x + Math.cos(S.a) * S.R / SZ, pz = _d.z + Math.sin(S.a) * S.R / SZ, close = sm(e0 + .03, .6, u), sq = win(u, .62, .71, .025);
   b0.position.set(px, _d.y, pz); b0.scale.setScalar(S.g);
   b0.rotation.set(-(PI / 2 + S.lean - close * (S.lean + .22) - .12 * sq), Math.atan2(_d.x - px, _d.z - pz), 0);
   for (let i = 1; i <= UN; i++) { const c = S.chain[i]; c.rotation.x = close * S.curl * (1 + .45 * sq) + .06 * Math.sin(tt * 3.1 + S.ph + i * 1.3) * close; c.rotation.y = .1 * Math.sin(tt * 2.3 + S.ph * 1.7 + i) * close; }
  }
  root.updateMatrixWorld(true);
  // ---------- fruit on pendulums ----------
  const damp = Math.exp(-1.8 * PH), floorY = root.position.y + .03 * SZ, dying = name === 'die' ? u : 0;
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
   if (Bq.lead) b.scale.setScalar(1 + .32 * sm(.15, 1.1, P.glow)); // the lure's fruit swells as it gleams
   b.updateMatrixWorld(true);
  }
  // ---------- severed pieces fall, settle and burn away ----------
  for (const C of CANES) if (C.piece) {
   const pc = C.piece, b = pc.b; pc.t += dt;
   if (!pc.rest) {
    pc.vel.y -= 9.8 / SZ * dt; b.position.addScaledVector(pc.vel, dt);
    if (b.position.y < .05) { b.position.y = .05; if (pc.vel.y < -.8) { puff(b.getWorldPosition(_a), 8, .6); } pc.vel.y = pc.vel.y < -.8 ? -pc.vel.y * .22 : 0; pc.vel.x *= .5; pc.vel.z *= .5; if (pc.vel.lengthSq() < .02) pc.rest = true; }
   }
   _a.set(0, 0, 1).applyQuaternion(b.quaternion); _b.set(_a.x, 0, _a.z); if (_b.lengthSq() < 1e-4) _b.set(1, 0, 0); _b.normalize();
   _q.setFromUnitVectors(_a, _b).multiply(b.quaternion); b.quaternion.slerp(_q, 1 - Math.exp(-dt * (b.position.y <= .051 ? 5 : 1.6)));
   for (let i = pc.j + 1; i <= NS; i++) { const c = C.chain[i]; c.rotation.x *= Math.exp(-dt * 3); c.rotation.y *= Math.exp(-dt * 3); }
   U.cut.value[C.k].z = sm(1.5, 2.8, pc.t); U.cut.value[C.k].w = Math.max(0, 1 - pc.t * 1.3);
   b.updateMatrixWorld(true);
  }
  // ---------- looks ----------
  const fk = cl(P.fade, 0, 1) * fadeE;
  U.time.value = tt; U.flut.value = P.rust * (1 + .6 * walkS);
  U.dis.value = 1 - fk; U.disCol.value.copy(name === 'appear' ? GROWC : BURNC); U.with.value = cl(Math.max(P.wither, state.wilt * .3), 0, 1); U.thin.value = cl(+state.wilt || 0, 0, 1) * .45;
  M.soil.opacity = fk;
  M.berry.emissive.setRGB(.55, .12, .2).multiplyScalar(cl(P.glow, 0, 2) * .32 * fk * (state.glow === undefined ? 1 : +state.glow));
  // the veins: a glow while it feeds, a slow one at rest at the higher levels, and the pulse running out along the roots
  if (dt > 0) VW.t += dt;
  U.vein.value.set(cl(P.feed, 0, 1.5) * fk, VW.t / .5 * 1.5 - .1, VW.s * (1 - sm(.45, .7, VW.t)) * fk, VEIN * fk * (1 - P.wither));
  // fire: flames while it burns, and the char they leave, which fades over the next few seconds
  if (dt > 0) charV = P.fire > .05 ? Math.min(.34, charV + dt * P.fire * .7) : Math.max(0, charV - dt * .06);
  U.char.value = charV * fk; U.burn.value = cl(P.fire, 0, 1) * fk;
  liftV = Math.max(0, P.y * SZ);
  updateFX(name, u, t, dt, fk, phase);
  lastName = name; lastU = u; lastPhase = phase; lastN = curN;
 }

 // ---------- effects ----------
 const fxS = { acc: { shed: 0, dust: 0, lure: 0, spark: 0, drain: 0, fire: 0, rip: 0, sap: 0 }, reveal: false };
 const GROWC = new THREE.Color(.55, .95, .3), BURNC = new THREE.Color(1, .6, .22), C1 = new THREE.Color(), LEAFC = new THREE.Color(.42, .58, .28), DEADC = new THREE.Color(.62, .46, .26), DUSTC = new THREE.Color(.34, .27, .2), CHIPC = new THREE.Color(.2, .1, .08);
 const SWEET = [new THREE.Color(1, .72, .45), new THREE.Color(1, .5, .62), new THREE.Color(1, .9, .7)], DRAINC = new THREE.Color(.75, 1, .42);
 const JUICEC = new THREE.Color(.3, .015, .09), SOILC = new THREE.Color(.16, .11, .07), SMOKEC = new THREE.Color(.13, .11, .11), FLAMEC = new THREE.Color(1, .8, .4), EMBERC = new THREE.Color(1, .45, .12);
 const lim = (C) => (C.cutJ >= 0 ? C.cutJ - 1 : NS);
 const tipW = (C, out) => C.chain[lim(C)].getWorldPosition(out);
 function canePt(C, f, out) {
  const s = f * C.len, j = Math.min(Math.floor(s / C.seg), NS - 1);
  if (j + 1 > lim(C)) return tipW(C, out);
  C.chain[j].getWorldPosition(out); C.chain[j + 1].getWorldPosition(_d); return out.lerp(_d, s / C.seg - j);
 }
 const crossed = (name, u, n, h) => name === n && lastName === n && lastU < h && u >= h;
 function leafBurst(p, n, spread, wither) {
  for (let i = 0; i < n; i++) emit(LF, p.x + (rnd() - .5) * spread, p.y + (rnd() - .5) * spread, p.z + (rnd() - .5) * spread, (rnd() - .5) * 2.2, rnd() * 1.6, (rnd() - .5) * 2.2, 1.6 + rnd(), C1.copy(LEAFC).lerp(DEADC, wither).multiplyScalar(.8 + .4 * rnd()), 1, (.1 + .06 * rnd()) * SZ, (.1 + .06 * rnd()) * SZ, 2.2, -1.4, (rnd() - .5) * 8, .5);
 }
 function chips(p, n, sp) { for (let i = 0; i < n; i++) emit(CHP, p.x, p.y, p.z, (rnd() - .5) * sp, rnd() * sp * .8, (rnd() - .5) * sp, .5 + rnd() * .4, CHIPC, .95, (.025 + .02 * rnd()) * SZ, .015 * SZ, 1.5, -6); }
 function puff(p, n, s) { for (let i = 0; i < n; i++) { const a = rnd() * TAU; emit(DU, p.x + Math.cos(a) * .1 * s, Math.max(.05, p.y), p.z + Math.sin(a) * .1 * s, Math.cos(a) * .5 * s, .25 + rnd() * .3, Math.sin(a) * .5 * s, 1 + rnd() * .6, DUSTC, .5, .25 * s * SZ, .7 * s * SZ, 1.8, .1); } }
 // berry juice and dark sap: heavy drops that fall and splash; clods of soil thrown up out of the ground
 function juice(p, n, sp) { for (let i = 0; i < n; i++) emit(CHP, p.x, p.y, p.z, (rnd() - .5) * sp, (.2 + rnd() * .8) * sp, (rnd() - .5) * sp, .6 + rnd() * .4, JUICEC, 1, (.03 + .025 * rnd()) * SZ, .02 * SZ, .6, -8.5); }
 function clods(p, n, sp, up) { for (let i = 0; i < n; i++) { const a = rnd() * TAU, r = rnd() * sp; emit(CHP, p.x + Math.cos(a) * .08, p.y + .02, p.z + Math.sin(a) * .08, Math.cos(a) * r, up * (.6 + rnd() * .7), Math.sin(a) * r, .7 + rnd() * .5, SOILC, 1, (.035 + .04 * rnd()) * SZ, .03 * SZ, .4, -9); } }
 function ring(n, r0, r1, s) { for (let i = 0; i < n; i++) { const a = rnd() * TAU, r = rr(r0, r1) * SZ; _a.set(root.position.x + Math.cos(a) * r, .06, root.position.z + Math.sin(a) * r); emit(DU, _a.x, _a.y, _a.z, Math.cos(a) * .8, .3 + rnd() * .4, Math.sin(a) * .8, 1.3 + rnd() * .6, DUSTC, .55, .3 * s * SZ, .9 * s * SZ, 1.6, .1); } }
 function updateFX(name, u, t, dt, fk, phase) {
  const P = FIN;
  // whip trails
  TRAILS.forEach((T, n) => {
   const kk = P.trail * fk * (n === 0 ? 1 : name === 'sweep' || name === 'grab' ? .8 : 0), C = T.C;
   if (kk > .01 && C.cutJ < 0) {
    tipW(C, _a); canePt(C, .78, _b);
    if (T.prev <= .01) for (let i = 0; i < TRN; i++) { T.tip[i].copy(_a); T.mid[i].copy(_b); }
    for (let i = TRN - 1; i > 0; i--) { T.tip[i].copy(T.tip[i - 1]); T.mid[i].copy(T.mid[i - 1]); }
    T.tip[0].copy(_a); T.mid[0].copy(_b);
    for (let i = 0; i < TRN; i++) { const k = kk * Math.pow(1 - i / (TRN - 1), 2); T.pos.set([T.tip[i].x, T.tip[i].y, T.tip[i].z, T.mid[i].x, T.mid[i].y, T.mid[i].z], i * 6); T.col.set([.32 * k, .42 * k, .26 * k, .04 * k, .06 * k, .03 * k], i * 6); }
    T.g.attributes.position.needsUpdate = true; T.g.attributes.color.needsUpdate = true;
   }
   T.mesh.visible = kk > .01 && C.cutJ < 0; T.prev = kk;
  });
  // leaves shaken loose, dust, the lure's sweetness, the drain
  const amb = fk * (name === 'die' ? 1 - sm(.6, .9, u) : 1);
  fxS.acc.shed += dt * (P.shed * 40 + .12 * P.rust) * amb;
  while (fxS.acc.shed >= 1) {
   fxS.acc.shed -= 1; const C = CANES[(rnd() * NC) | 0];
   if (rnd() < .35) mass.localToWorld(_a.set((rnd() - .5) * CR, CH * rr(.4, 1.1), (rnd() - .5) * CR)); else canePt(C, rr(.15, .95), _a);
   leafBurst(_a, 1, .1, Math.max(P.wither, state.wilt * .5));
  }
  fxS.acc.dust += dt * P.dust * 40 * amb; while (fxS.acc.dust >= 1) { fxS.acc.dust -= 1; ring(1, CR * .9, CR * 1.8, 1); }
  const bun = [LEAD.bunch1, LEAD.bunch2].filter((b) => b && LEAD.cutJ < 0);
  fxS.acc.lure += dt * P.lure * 55 * fk;
  while (fxS.acc.lure >= 1 && bun.length) { fxS.acc.lure -= 1; bun[(rnd() * bun.length) | 0].getWorldPosition(_a); _a.y -= .08 * SZ; emit(MO, _a.x + (rnd() - .5) * .2 * SZ, _a.y + (rnd() - .5) * .15 * SZ, _a.z + (rnd() - .5) * .2 * SZ, (rnd() - .5) * .15, .12 + rnd() * .2, (rnd() - .5) * .15, 1.4 + rnd() * .8, SWEET[(rnd() * 3) | 0], .6, .05 * SZ, .02 * SZ, .8, .05, 0, .12); }
  fxS.acc.spark += dt * cl(P.glow, 0, 2) * 14 * fk;
  while (fxS.acc.spark >= 1 && bun.length) { fxS.acc.spark -= 1; bun[(rnd() * bun.length) | 0].getWorldPosition(_a); emit(MO, _a.x + (rnd() - .5) * .14 * SZ, _a.y - rr(.04, .2) * SZ, _a.z + (rnd() - .5) * .14 * SZ, 0, 0, 0, .3, SWEET[2], .9, .08 * SZ, 0, 0); }
  fxS.acc.drain += dt * P.drain * 90 * fk;
  while (fxS.acc.drain >= 1) { fxS.acc.drain -= 1; mass.localToWorld(_b.set(0, CH * .55, 0)); _a.copy(_tg).add(_c.set((rnd() - .5) * .45, (rnd() - .5) * .6, (rnd() - .5) * .45)); const tm = .55 + rnd() * .2; emit(MO, _a.x, _a.y, _a.z, (_b.x - _a.x) / tm, (_b.y - _a.y) / tm + .6, (_b.z - _a.z) / tm, tm, DRAINC, .8, .07 * SZ, .03 * SZ, 0, -1.6); }
  // the drain's ribbons: from the prey's chest they arc up and spiral down into the hollow, bright knots of life running along them
  const dk = cl(P.drain, 0, 1) * fk; drain.visible = dk > .01;
  if (drain.visible) {
   mass.localToWorld(_b.set(0, CH - HOL * .7, 0)); _d.subVectors(_b, _tg); const L = _d.length() || 1; _d.multiplyScalar(1 / L);
   _sd.set(_d.z, 0, -_d.x); if (_sd.lengthSq() < 1e-6) _sd.set(1, 0, 0); _sd.normalize(); _up.crossVectors(_sd, _d).normalize();
   for (let r = 0, o = 0; r < DRN; r++) {
    const ph = r * TAU / DRN;
    for (let i = 0; i <= DRS; i++, o += 6) {
     const s = i / DRS, arc = Math.sin(PI * s) * (.5 + .14 * r) * SZ, th = s * TAU * 1.6 + t * 5 + ph, rad = (.08 + .16 * Math.sin(PI * s)) * SZ, w = (.075 - .035 * s) * SZ;
     _a.copy(_tg).lerp(_b, s); _a.y += arc; _a.addScaledVector(_sd, Math.cos(th) * rad).addScaledVector(_up, Math.sin(th) * rad);
     drPos[o] = _a.x - _sd.x * w; drPos[o + 1] = _a.y - _sd.y * w; drPos[o + 2] = _a.z - _sd.z * w; drPos[o + 3] = _a.x + _sd.x * w; drPos[o + 4] = _a.y + _sd.y * w; drPos[o + 5] = _a.z + _sd.z * w;
     const k = 1.3 * dk * sm(0, .1, s) * sm(1, .86, s) * (.25 + .75 * Math.pow(Math.max(0, Math.sin(s * 13 - t * 9 + ph * 2)), 2));
     drCol[o] = drCol[o + 3] = DRAINC.r * k; drCol[o + 1] = drCol[o + 4] = DRAINC.g * k; drCol[o + 2] = drCol[o + 5] = DRAINC.b * k * .8;
    }
   }
   drG.attributes.position.needsUpdate = true; drG.attributes.color.needsUpdate = true;
  }
  // fire: flames licking up along the canes and off the crown, with smoke and embers
  fxS.acc.fire += dt * P.fire * 120 * fk;
  while (fxS.acc.fire >= 1) {
   fxS.acc.fire -= 1;
   if (rnd() < .3) mass.localToWorld(_a.set((rnd() - .5) * CR * 1.2, CH * rr(.5, 1.1), (rnd() - .5) * CR * 1.2)); else canePt(CANES[(rnd() * NC) | 0], rr(.1, .9), _a);
   emit(FL, _a.x, _a.y, _a.z, (rnd() - .5) * .3, .6 + rnd() * .6, (rnd() - .5) * .3, .4 + rnd() * .35, FLAMEC, .9, (.3 + .2 * rnd()) * SZ, .08 * SZ, 1.2, 1.6, 0, .15);
   if (rnd() < .3) emit(DU, _a.x, _a.y + .1, _a.z, (rnd() - .5) * .2, .5 + rnd() * .4, (rnd() - .5) * .2, 1.4 + rnd() * .6, SMOKEC, .45, .2 * SZ, .8 * SZ, 1, .3);
   if (rnd() < .25) emit(MO, _a.x, _a.y, _a.z, (rnd() - .5) * .8, .8 + rnd(), (rnd() - .5) * .8, 1 + rnd() * .8, EMBERC, .9, .035 * SZ, .01 * SZ, .8, .4, 0, .3);
  }
  // the lure's light among the fruit, which becomes the firelight while it burns
  const lureI = cl(P.glow, 0, 2) * 1.2 * fk * (state.glow === undefined ? 1 : +state.glow), fireI = cl(P.fire, 0, 1) * fk * 2.8 * (.78 + .22 * Math.sin(t * 31) * Math.sin(t * 17.3));
  if (fireI > lureI) { mass.localToWorld(lureLight.position.set(0, CH * 1.3, CR * .3)); lureLight.color.copy(FIREC); lureLight.intensity = fireI; }
  else { if (bun.length) bun[0].getWorldPosition(lureLight.position); lureLight.color.copy(LUREC); lureLight.intensity = lureI; }
  // a severed cane's stump bleeds dark sap for a while
  for (const C of CANES) if (C.bleed > 0 && C.cutJ > 0) {
   C.bleed -= dt; fxS.acc.sap += dt * 16 * fk * Math.min(1, C.bleed);
   while (fxS.acc.sap >= 1) { fxS.acc.sap -= 1; C.chain[C.cutJ - 1].localToWorld(_a.set(0, 0, C.seg * .5)); emit(CHP, _a.x, _a.y, _a.z, (rnd() - .5) * .3, -.1, (rnd() - .5) * .3, .8, JUICEC, 1, .032 * SZ, .02 * SZ, .3, -7); }
  }
  // Undergrowth: the canes stab into the soil, the ground splits toward the prey, the shoots burst up and sink back
  if (name === 'undergrowth') {
   const UG = ACTS.undergrowth;
   if (crossed(name, u, 'undergrowth', UG.cues[0])) { pulse(1.6); for (const C of CANES) if (C.cutJ < 0 && C.g !== 'B') { tipW(C, _a); clods(_a, 6, 1.4, 2.2); puff(_a, 3, .8); } }
   // three cracks run from where the canes stabbed the soil to the prey's feet, glowing as the pulse runs under them
   const s0 = sm(.32, .44, u), fade = 1 - sm(.86, .98, u), cu = crack.material.uniforms; _b.set(_tg.x, root.position.y + .008, _tg.z);
   if (crossed(name, u, 'undergrowth', .318)) { let n = 0; for (const C of [LEAD].concat(CANES.filter((c) => c.g === 'F'), CANES.filter((c) => c.g === 'S'))) if (n < NCK && C.cutJ < 0) { tipW(C, ckA[n]); ckA[n].y = _b.y; ckOn[n++] = 1; } for (; n < NCK; n++) ckOn[n] = 0; }
   for (let i = 0; i < NCK; i++) {
    const A = ckA[i], dx = _b.x - A.x, dz = _b.z - A.z, len = Math.hypot(dx, dz) || 1, w = .5 * SZ * ckOn[i] * (len > .25 ? 1 : 0), sx = dz / len * w, sz = -dx / len * w;
    ckPos.set([A.x - sx, A.y, A.z - sz, A.x + sx, A.y, A.z + sz, _b.x - sx, _b.y, _b.z - sz, _b.x + sx, _b.y, _b.z + sz], i * 12);
   }
   ckG.attributes.position.needsUpdate = true; crack.visible = s0 > 0 && fade > 0;
   cu.uOpen.value = s0 * 1.1; cu.uGlow.value = (.45 + .55 * sm(.4, .46, u)) * (1 - sm(.7, .9, u)) * fk; cu.uFade.value = fade * fk;
   if (s0 > 0 && s0 < 1) { fxS.acc.rip += dt * 45; while (fxS.acc.rip >= 1) { fxS.acc.rip -= 1; const i = (rnd() * NCK) | 0; if (!ckOn[i]) continue; _c.copy(ckA[i]).lerp(_b, s0); puff(_c, 1, .6); if (rnd() < .5) clods(_c, 1, .6, 1.6); } }
   for (const S of SNARE) {
    if (S.g > .02 && !S.up) { S.up = true; S.chain[0].getWorldPosition(_c); clods(_c, 9, 1.6, 3.2); puff(_c, 4, 1); chips(_c, 5, 2.4); }
    if (S.up && !S.down && u > .86 + S.t0 * .6) { S.down = true; S.chain[0].getWorldPosition(_c); puff(_c, 3, .9); clods(_c, 4, .8, 1.4); }
   }
   if (crossed(name, u, 'undergrowth', UG.hits[0])) { _c.set(_tg.x, root.position.y + .05, _tg.z); clods(_c, 16, 2.2, 3.6); }
   if (crossed(name, u, 'undergrowth', UG.hits[1])) { _c.copy(_tg); chips(_c, 18, 2.6); leafBurst(_c, 8, .4 * SZ, 0); }
   if (crossed(name, u, 'undergrowth', UG.cues[1])) for (const C of CANES) if (C.cutJ < 0 && C.g !== 'B') { tipW(C, _a); clods(_a, 6, 1.2, 2.6); puff(_a, 2, .7); }
  } else if (crack.visible || SNARE[0].up) { crack.visible = false; for (const S of SNARE) S.up = S.down = false; }
  // moments
  const fresh = curN !== 0 && curN !== lastN;
  if (crossed(name, u, 'appear', ACTS.appear.cues[0])) { ring(28, CR * .6, CR * 2, 1); mass.localToWorld(_a.set(0, CH, 0)); leafBurst(_a, 14, CR * SZ, 0); chips(_a, 16, 2.5); _a.y = root.position.y; clods(_a, 22, 2.4, 3); pulse(1.3); }
  if (crossed(name, u, 'strike', ACTS.strike.hits[0]) && LEAD.cutJ < 0) { tipW(LEAD, _a); chips(_a, 24, 3); leafBurst(_a, 8, .2 * SZ, 0); juice(_a, 14, 2.4); if (_a.y < .4) puff(_a, 6, .7); }
  if (crossed(name, u, 'strike', .64) && LEAD.cutJ < 0) { tipW(LEAD, _a); chips(_a, 10, 2); juice(_a, 6, 1.6); }
  for (const h of ACTS.grab.hits) if (crossed(name, u, 'grab', h)) for (const C of CANES) if (C.g !== 'B' && C.cutJ < 0) { tipW(C, _a); chips(_a, 7, 2); leafBurst(_a, 3, .15 * SZ, 0); }
  if (crossed(name, u, 'sweep', ACTS.sweep.hits[0])) {
   for (const C of CANES) if (C.g !== 'B') { canePt(C, rr(.5, .95), _a); leafBurst(_a, 5, .3 * SZ, 0); if (rnd() < .5) puff(_a, 3, .7); }
   // the canes scrape the ground in an arc across the front
   for (let i = 0; i < 14; i++) { const a = rr(-1.1, 1.1), r = (CR + rr(1.1, 1.9)) * SZ; root.localToWorld(_a.set(Math.sin(a) * r / SZ, 0, Math.cos(a) * r / SZ)); _a.y = root.position.y + .05; puff(_a, 1, .8); if (rnd() < .5) clods(_a, 2, .9, 1.4); }
  }
  for (const h of ACTS.consume.hits) if (crossed(name, u, 'consume', h)) { ring(6, CR * .7, CR * 1.3, .8); mass.localToWorld(_a.set(0, CH * .5, 0)); for (let i = 0; i < 18; i++) emit(MO, _a.x, _a.y, _a.z, (rnd() - .5) * 1.5, rnd() * 1.2, (rnd() - .5) * 1.5, .5, DRAINC, .8, .08 * SZ, .01 * SZ, 3); pulse(1.3); }
  if (name === 'hurt' && fresh) { mass.localToWorld(_a.set(0, CH * .8, 0)); leafBurst(_a, 16, CR * SZ, state.wilt * .5); chips(_a, 12, 2.6); juice(_a, 8, 2); }
  if (name === 'burn' && fresh) { mass.localToWorld(_a.set(0, CH * .9, 0)); for (let i = 0; i < 26; i++) emit(FL, _a.x + (rnd() - .5) * CR * SZ, _a.y + rnd() * .3, _a.z + (rnd() - .5) * CR * SZ, (rnd() - .5) * 1.2, 1 + rnd(), (rnd() - .5) * 1.2, .5 + rnd() * .3, FLAMEC, 1, (.3 + .2 * rnd()) * SZ, .08 * SZ, 1.5, 1.5); leafBurst(_a, 12, CR * SZ, .7); }
  if (crossed(name, u, 'die', .08)) pulse(1.6);
  if (crossed(name, u, 'die', ACTS.die.cues[0])) { ring(32, CR * .5, CR * 2.4, 1.2); _a.copy(root.position); clods(_a, 14, 2, 2.2); }
  // the creep: a puff where each cane sets down
  if (walkS > .05) for (const C of CANES) { const p0 = Math.sin(lastPhase + (C.k % 2) * PI), p1 = Math.sin(phase + (C.k % 2) * PI); if (p0 > 0 && p1 <= 0 && C.cutJ < 0) { tipW(C, _a); puff(_a, 2, .5); } }
  stepP(LF, dt, .1, t); stepP(DU, dt, .3, t); stepP(MO, dt, .2, t); stepP(CHP, dt, .05, t); stepP(FL, dt, .12, t);
 }

 // ---------- losing a cane, and growing it back ----------
 function sever(k) {
  if (k === undefined || k === null) { const live = CANES.filter((c) => c.cutJ < 0 && c !== LEAD); const pool = live.length ? live : CANES.filter((c) => c.cutJ < 0); if (!pool.length) return -1; k = pool[(rnd() * pool.length) | 0].k; }
  const C = CANES[k]; if (!C || C.cutJ >= 0) return -1;
  const j = cl(Math.round(NS * rr(.42, .7)), 3, NS - 2), b = C.chain[j];
  canePt(C, j / NS, _a); chips(_a, 26, 3); leafBurst(_a, 10, .25 * SZ, 0); juice(_a, 16, 2.2);
  base.attach(b);
  C.cutJ = j; C.bleed = 2.6; C.piece = { b, j, t: 0, rest: false, vel: V3(Math.sin(C.a) * .55, .7, Math.cos(C.a) * .55) }; // in the body's own space
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
   case 'lure': case 'berries': return LEAD.bunch1 && LEAD.cutJ < 0 ? LEAD.bunch1.getWorldPosition(out).add(_a.set(0, -.1 * SZ, 0)) : tipW(LEAD, out);
   case 'head': case 'top': return top.localToWorld(out.set(0, .3, 0));
   case 'crown': case 'mouth': case 'heart': return mass.localToWorld(out.set(0, CH * .45, 0));
   case 'hollow': return mass.localToWorld(out.set(0, CH - HOL, 0));
   case 'grasp': { out.set(0, 0, 0); let n = 0; for (const C of CANES) if (C.g !== 'B') { tipW(C, _a); out.add(_a); n++; } return out.multiplyScalar(1 / Math.max(1, n)); }
   case 'held': return out.copy(held); // where a held prey's chest belongs; see holding
   case 'snare': { const tg = state.target; return tg ? out.set(tg.x, root.position.y, tg.z) : root.localToWorld(out.set(0, 0, 2.45 * SZ)); }
   case 'feet': return out.copy(root.position);
   default: { // 'chest' and anything else: the front of the crown
    const m = /^cane(\d+)$/.exec(name); if (m && CANES[+m[1]]) return tipW(CANES[+m[1]], out);
    return mass.localToWorld(out.set(0, CH * .85, CR * .25));
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
  reset() { actv = null; gOn = false; gW = 0; Object.assign(FIN, BASE); regrow(); state.wilt = 0; charV = 0; VW.t = 9; HB = 0; for (const C of CANES) C.sp = null; },
  get busy() { return !!actv && !(actv.def.hold && actv.t >= actv.def.dur - 1e-6); },
  get action() { return actv ? actv.name : ''; },
  get progress() { return actv ? Math.min(1, actv.t / actv.def.dur) : -1; },
  get dash() { return 0; }, get lift() { return liftV; },
  get state() { return state; }, set state(v) { if (v) Object.assign(state, v); },
  setFade(f) { fadeE = cl(+f, 0, 1); },
  get gone() { return FIN.fade < .02 && !!actv && actv.name === 'die'; },
  get holding() { return holdV; }, // 0 to 1: how firmly the canes hold the prey (Grab); the prey belongs at anchor('held')
  get canes() { return CANES.filter((c) => c.cutJ < 0).length; },
  height: (CH + 1.15) * SZ, width: (CR + CL * .75) * 2 * SZ, reach: 2.45 * SZ, variant: VNAME, level: LEVEL,
  stats: { triangles: Math.round(tri), drawCalls: draws, textures: texs.size, bones: nb }
 };
}

