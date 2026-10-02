// wraith.js: the Shadow Wraith, the common foe of Envoi on the Longest Night. three.js r128 (global THREE). Defines makeWraith(opts) only.
// Touched up from src/models/originals/wraith.js after its soul-green model sheets (reference/art/wraith-model.webp and
// wraith-model-b.webp): a black ragged hood with two slanted green eyes, a black ribcage around a glowing green heart, long
// skeletal hands whose bones glow green, a black robe torn into long strips whose edges burn green and drift like smoke, and
// a twisted thorny scythe with a pale-green glowing blade, held in the right hand. Wraiths are souls that died without light
// and became Noctara's; defeat is release, so the robe falls empty and a pale moth rises out of it (lore answer 21).
// opts.great builds the great wraith of Bogmire (reference/art/great-wraith.webp, -c.webp): a scaled-up wraith that has eaten
// the town's lights, with stolen flames in its ribs and showing through its robe, and lanterns on a chain round its neck.
// opts: { detail 0.5 to 1, level 1 to 20 (a fiercer look), tint (glow color override), great: true }
function makeWraith(opts) {
 'use strict';
 // Units are meters, Y up, facing +Z, the strip tips just above y = 0. Its right side is -X; the scythe is in its right hand.
 opts = opts || {};
 const DET = Math.max(.5, Math.min(1, opts.detail === undefined ? 1 : +opts.detail || 1));
 const Q = (n, m) => Math.max(m || 3, Math.round(n * DET));
 const TAU = Math.PI * 2, PI = Math.PI;
 let seed = 31337;
 const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
 const cl = (v, a, b) => (v < a ? a : v > b ? b : v);
 const sm = (a, b, x) => { const t = cl((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
 const lerp = (a, b, t) => a + (b - a) * t;
 const win = (u, a, b, e) => sm(a - e, a + e, u) * (1 - sm(b - e, b + e, u));
 const V3 = (x, y, z) => new THREE.Vector3(x || 0, y || 0, z || 0);
 const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
 const tex = (c, rx, ry) => { const t = new THREE.CanvasTexture(c); if (rx) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry || rx); } t.anisotropy = 4; return t; };
 const interp = (tab, y) => { if (y <= tab[0][1]) return tab[0][0]; for (let i = 0; i < tab.length - 1; i++) { const a = tab[i], b = tab[i + 1]; if (y <= b[1]) return a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]); } return tab[tab.length - 1][0]; };
 const XAX = V3(1, 0, 0), YAX = V3(0, 1, 0);

 // ---------- the variant: level look, tint, the great wraith ----------
 const GREAT = !!opts.great;
 const LEVEL = cl(opts.level === undefined ? (GREAT ? 5 : 1) : Math.round(+opts.level) || 1, 1, 20);
 const TIER = (LEVEL - 1) / 19;                            // 0 at level 1, 1 at the level cap of 20
 const K = .82;                                            // the sheets: about 2 m to the hood's tip, 2.2 m to the blade
 const SZ = K * (GREAT ? 2.8 : 1 + .14 * TIER);            // overall size; the great wraith is about three times as tall
 const TS = GREAT ? .64 : 1;                               // a giant sways slower
 const DUR = GREAT ? 1.25 : 1;                             // and swings slower
 const GLOW = opts.tint !== undefined && opts.tint !== null ? new THREE.Color(opts.tint) : new THREE.Color(0x56ff9c).lerp(new THREE.Color(0x12ff55), TIER);
 const GK = (.85 + .6 * TIER) * (GREAT ? 1.05 : 1);       // glow strength
 const CORE = new THREE.Color(0xffffff).lerp(GLOW, .4);
 const PALE = new THREE.Color(0xfff4e2);                   // the released soul
 const WARM = new THREE.Color(0xffa64a);                   // stolen lamplight
 const DARK = 1 - .2 * TIER;                               // fiercer wraiths wear blacker rags
 const G255 = [GLOW.r * 255 | 0, GLOW.g * 255 | 0, GLOW.b * 255 | 0].join(',');

 const root = new THREE.Group(); root.name = GREAT ? 'GreatWraith' : 'ShadowWraith';
 const base = new THREE.Group(); root.add(base);          // everything of the body, scaled by SZ
 const fx = new THREE.Group(); fx.name = root.name + 'FX';

 // ---------- painted cloth: one atlas for the torn strips, the robe, the mantle, the sleeves and the hood ----------
 // The emissive atlas is painted in color at half size: green along every torn edge. The great wraith adds a mask of stolen flames.
 const AW = 1024, ES = .5;
 const AC = cvs(AW, AW), A = AC.getContext('2d'), EC = cvs(AW * ES, AW * ES), E = EC.getContext('2d');
 E.fillStyle = '#000'; E.fillRect(0, 0, EC.width, EC.height);
 const FC = GREAT ? cvs(256, 256) : null, F = FC ? FC.getContext('2d') : null;
 if (F) { F.fillStyle = '#000'; F.fillRect(0, 0, 256, 256); }
 const RG = { strips: [0, 0, 1024, 512], robe: [0, 512, 512, 512], mantle: [512, 512, 512, 256], sleeve: [512, 768, 512, 128], hood: [512, 896, 512, 128] };
 const uvOf = (R, fu, fv) => [(R[0] + fu * R[2]) / AW, 1 - (R[1] + fv * R[3]) / AW];
 const sh8 = (k) => Math.round(k * DARK);
 const CLOTH = `rgb(${sh8(32)},${sh8(29)},${sh8(37)})`, CLOTH2 = `rgb(${sh8(39)},${sh8(35)},${sh8(45)})`;
 function folds(g, x0, y0, w, h, n) {
  for (let i = 0; i < n; i++) {
   const x = x0 + rnd() * w, fw = 2 + rnd() * w * .035, light = rnd() < .45, a = light ? .05 + rnd() * .08 : .12 + rnd() * .18;
   const c = light ? '150,140,172' : '0,0,0', gr = g.createLinearGradient(x - fw, 0, x + fw, 0);
   gr.addColorStop(0, `rgba(${c},0)`); gr.addColorStop(.5, `rgba(${c},${a.toFixed(3)})`); gr.addColorStop(1, `rgba(${c},0)`);
   g.fillStyle = gr; g.fillRect(x - fw, y0, fw * 2, h);
  }
  g.lineCap = 'round';
  for (let i = 0; i < n * .4; i++) {
   const x = x0 + rnd() * w, y = y0 + rnd() * h * .8, l = h * (.1 + rnd() * .3);
   g.strokeStyle = `rgba(0,0,0,${(.15 + rnd() * .2).toFixed(2)})`; g.lineWidth = 1 + rnd() * 2;
   g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + (rnd() - .5) * 14, y + l * .3, x + (rnd() - .5) * 14, y + l * .7, x + (rnd() - .5) * 10, y + l); g.stroke();
  }
  for (let i = 0, nf = w * h / 240; i < nf; i++) { g.fillStyle = rnd() < .55 ? 'rgba(0,0,0,.22)' : 'rgba(170,160,190,.045)'; g.fillRect(x0 + rnd() * w, y0 + rnd() * h, 1, 2 + rnd() * 12); }
 }
 // a torn outline in a region's own 0..1 coordinates, drawn into any canvas at any scale
 function trace(g, out, holes, ox, oy, w, h, keep) {
  if (!keep) g.beginPath();
  out.forEach((p, i) => (i ? g.lineTo(ox + p[0] * w, oy + p[1] * h) : g.moveTo(ox + p[0] * w, oy + p[1] * h))); g.closePath();
  for (const [hu, hv, rw, rh, ph] of holes || []) { for (let q = 0; q <= 7; q++) { const a = q / 7 * TAU, rr = .65 + .35 * Math.sin(a * 3 + ph), x = ox + (hu + Math.cos(a) * rw * rr) * w, y = oy + (hv + Math.sin(a) * rh * rr) * h; if (q) g.lineTo(x, y); else g.moveTo(x, y); } g.closePath(); }
 }
 // green light seeping in from every torn edge, brightest toward the bottom (v0 on down), plus a wash over the tips
 function edgeGlow(out, holes, R, blur, v0, wash) {
  const w = Math.ceil(R[2] * ES), h = Math.ceil(R[3] * ES), t = cvs(w, h), q = t.getContext('2d');
  q.save(); trace(q, out, holes, 0, 0, w, h); q.clip('evenodd');
  q.shadowColor = `rgb(${G255})`; q.shadowBlur = blur; q.fillStyle = '#fff';
  q.beginPath(); q.rect(-w * 2, -h * 2, w * 5, h * 5); trace(q, out, holes, 0, 0, w, h, true); q.fill('evenodd');
  q.shadowBlur = 0; const tg = q.createLinearGradient(0, h * v0, 0, h); tg.addColorStop(0, `rgba(${G255},0)`); tg.addColorStop(1, `rgba(${G255},${wash})`); q.fillStyle = tg; q.fillRect(0, 0, w, h);
  q.restore();
  q.globalCompositeOperation = 'destination-in'; const m = q.createLinearGradient(0, 0, 0, h); m.addColorStop(0, 'rgba(0,0,0,.04)'); m.addColorStop(v0, 'rgba(0,0,0,.1)'); m.addColorStop(1, 'rgba(0,0,0,1)'); q.fillStyle = m; q.fillRect(0, 0, w, h);
  E.save(); E.globalCompositeOperation = 'lighter'; E.drawImage(t, R[0] * ES, R[1] * ES); E.restore();
 }
 // a ragged hem: teeth hanging down across a region, periodic when it wraps around
 function hemLine(n, vN, vT, jit) {
  const pts = [], ph = rnd() * 9;
  for (let i = 0; i < n; i++) {
   const u0 = i / n, tipU = u0 + (.35 + rnd() * .3) / n, tipV = vT - rnd() * jit, notchV = vN + (rnd() - .5) * .05;
   pts.push([u0, notchV]); pts.push([lerp(u0, tipU, .5) + .004 * Math.sin(i + ph), lerp(notchV, tipV, .45) + .01]); pts.push([tipU, tipV]); pts.push([lerp(tipU, (i + 1) / n, .5), lerp(tipV, vN, .6) - .01]);
  }
  pts.push([1, pts[0][1]]);
  return pts;
 }
 function regionHem(R, hem, color, n, glowV0, wash) {
  const out = [[-.25, -.5], [1.25, -.5], [1.25, hem[hem.length - 1][1]]].concat(hem.slice().reverse()); out.push([-.25, hem[0][1]]);
  A.save(); trace(A, out, null, R[0], R[1], R[2], R[3]); A.clip();
  A.fillStyle = color; A.fillRect(R[0], R[1], R[2], R[3]); folds(A, R[0], R[1], R[2], R[3], n);
  const gv = A.createLinearGradient(0, R[1] + R[3] * glowV0, 0, R[1] + R[3]); gv.addColorStop(0, `rgba(${G255},0)`); gv.addColorStop(1, `rgba(${G255},.12)`); A.fillStyle = gv; A.fillRect(R[0], R[1], R[2], R[3]);
  A.lineWidth = 2; A.strokeStyle = 'rgba(150,145,165,.25)'; trace(A, out, null, R[0], R[1], R[2], R[3]); A.stroke();
  A.restore();
  if (wash > 0) edgeGlow(out, null, R, 6, glowV0, wash);
 }
 // the great wraith's stolen flames, seen through holes burnt in the cloth (x, y in atlas pixels)
 function flameSpot(x, y, s) {
  const gr = A.createRadialGradient(x, y, 0, x, y, s * 1.7); gr.addColorStop(0, 'rgba(90,40,10,.95)'); gr.addColorStop(.55, 'rgba(40,16,6,.9)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  A.fillStyle = gr; A.fillRect(x - s * 2, y - s * 2, s * 4, s * 4);
  const tear = (g, cx, cy, k) => { g.beginPath(); g.moveTo(cx, cy - 1.5 * k); g.bezierCurveTo(cx + .55 * k, cy - .6 * k, cx + .75 * k, cy + .2 * k, cx, cy + .8 * k); g.bezierCurveTo(cx - .75 * k, cy + .2 * k, cx - .55 * k, cy - .6 * k, cx, cy - 1.5 * k); g.fill(); };
  A.fillStyle = 'rgba(255,190,90,.9)'; tear(A, x, y, s * .8); A.fillStyle = 'rgba(255,245,200,.95)'; tear(A, x, y + s * .15, s * .38);
  const fsc = 256 / AW; F.save(); F.shadowColor = 'rgb(255,170,80)'; F.shadowBlur = 6; F.fillStyle = '#fff'; tear(F, x * fsc, y * fsc, s * fsc * .95); F.restore();
 }

 // eight torn strips side by side across the top half, each splitting into two to four flame-like tails
 for (let k = 0; k < 8; k++) {
  const nT = 2 + (k % 3), vt = .52 + rnd() * .12, hw = (v) => .37 - .06 * v;
  const notches = [0, 1].map(() => [.1 + rnd() * .45, .03 + rnd() * .09, rnd() < .5 ? -1 : 1]);
  const jag = (v, s) => { let d = .014 * Math.sin(v * 57 + s * 5 + k * 2.1) + .009 * Math.sin(v * 131 + k * 1.3 - s); for (const [nv, nd, ns] of notches) if (ns === s) d += nd * Math.max(0, 1 - Math.abs(v - nv) / .03); return d; };
  const out = [];
  for (let i = 0; i <= 26; i++) { const v = i / 26 * vt; out.push([.5 - hw(v) + jag(v, -1), v]); }
  const u0 = .5 - hw(vt) + jag(vt, -1), u1 = .5 + hw(vt) - jag(vt, 1), ed = [u0], sv = [vt];
  for (let i = 1; i < nT; i++) { ed.push(lerp(u0, u1, i / nT + (rnd() - .5) * .12)); sv.push(vt + .03 + rnd() * .1); }
  ed.push(u1); sv.push(vt);
  for (let i = 0; i < nT; i++) {
   const tu = lerp(ed[i], ed[i + 1], .25 + rnd() * .5), tv = .86 + rnd() * .125, ph = rnd() * 9, cu = (rnd() - .5) * .06;
   for (let s = 1; s <= 10; s++) { const f = s / 10; out.push([lerp(ed[i], tu, Math.pow(f, 1.4)) + .01 * Math.sin(f * 19 + ph) + cu * f * f, lerp(sv[i], tv, f)]); }
   for (let s = 1; s <= 10; s++) { const f = 1 - s / 10; out.push([lerp(ed[i + 1], tu, Math.pow(f, 1.4)) - .01 * Math.sin(f * 17 + ph) + cu * f * f, lerp(sv[i + 1], tv, f)]); }
  }
  for (let i = 26; i >= 0; i--) { const v = i / 26 * vt; out.push([.5 + hw(v) - jag(v, 1), v]); }
  const holes = []; for (let i = 0, nh = ((GREAT ? 1.5 : 0) + rnd() * 2.6) | 0; i < nh; i++) holes.push([.38 + rnd() * .24, .14 + rnd() * (vt - .22), .03 + rnd() * .05, .015 + rnd() * .03, rnd() * 6]);
  const R = [128 * k, 0, 128, 512];
  A.save(); trace(A, out, holes, R[0], 0, 128, 512); A.clip('evenodd');
  A.fillStyle = CLOTH; A.fillRect(R[0], 0, 128, 512); folds(A, R[0], 0, 128, 512, 16);
  const gr = A.createLinearGradient(R[0], 0, R[0] + 128, 0); gr.addColorStop(0, 'rgba(0,0,0,.5)'); gr.addColorStop(.32, 'rgba(0,0,0,0)'); gr.addColorStop(.68, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.5)'); A.fillStyle = gr; A.fillRect(R[0], 0, 128, 512);
  const gv = A.createLinearGradient(0, 512 * .7, 0, 512); gv.addColorStop(0, `rgba(${G255},0)`); gv.addColorStop(1, `rgba(${G255},.26)`); A.fillStyle = gv; A.fillRect(R[0], 0, 128, 512);
  if (GREAT) for (let i = 0; i < 2; i++) flameSpot(R[0] + 44 + rnd() * 40, 70 + i * 120 + rnd() * 80, 11 + rnd() * 5);
  A.lineWidth = 2.2; A.strokeStyle = 'rgba(150,145,165,.26)'; trace(A, out, holes, R[0], 0, 128, 512); A.stroke();
  A.restore();
  edgeGlow(out, holes, R, 4, .68, .42);
  // tongues of green fire licking up from the tails
  E.save(); E.globalCompositeOperation = 'lighter'; E.strokeStyle = `rgba(${G255},.5)`; E.lineCap = 'round';
  for (let i = 0; i < 5; i++) { const x = (R[0] + 128 * (.25 + .5 * rnd())) * ES, y = 512 * (.86 + rnd() * .12) * ES; E.lineWidth = 1 + rnd() * 1.6; E.beginPath(); E.moveTo(x, y); E.bezierCurveTo(x + (rnd() - .5) * 8, y - 18, x + (rnd() - .5) * 8, y - 30, x + (rnd() - .5) * 6, y - 40 - rnd() * 30); E.stroke(); }
  E.restore();
 }
 // the robe under the strips: open over the ribs, plain black, with a ragged glowing hem
 const openA = (y) => .58 * sm(1.17, 1.42, y);
 const ROBE_Y0 = 1.64, ROBE_Y1 = .08;
 {
  const R = RG.robe, X = (fu) => R[0] + fu * R[2], Y = (fv) => R[1] + fv * R[3];
  regionHem(R, hemLine(24, .8, .985, .1), CLOTH, 60, .62, .45);
  if (GREAT) for (let i = 0; i < 16; i++) { const fu = (i + rnd() * .8) / 16, fv = .32 + rnd() * .42; if (Math.abs(fu - .5) > .1 || fv > .4) flameSpot(X(fu), Y(fv), 10 + rnd() * 6); }
  A.save(); A.globalCompositeOperation = 'destination-out'; A.beginPath(); // cut the opening over the ribs out of the cloth
  for (let i = 0; i <= 24; i++) { const y = lerp(1.15, ROBE_Y0 + .02, i / 24); A.lineTo(X(.5 - openA(y) / TAU + .004 * Math.sin(i * 2.7)), Y((ROBE_Y0 - y) / (ROBE_Y0 - ROBE_Y1))); }
  for (let i = 24; i >= 0; i--) { const y = lerp(1.15, ROBE_Y0 + .02, i / 24); A.lineTo(X(.5 + openA(y) / TAU + .004 * Math.sin(i * 3.1)), Y((ROBE_Y0 - y) / (ROBE_Y0 - ROBE_Y1))); }
  A.closePath(); A.fill(); A.restore();
 }
 // the mantle: a short ragged cape over the shoulders
 {
  const R = RG.mantle; regionHem(R, hemLine(15, .78, .985, .14), CLOTH2, 40, .7, .18);
  if (GREAT) for (let i = 0; i < 6; i++) flameSpot(R[0] + R[2] * (.1 + .8 * (i + rnd() * .7) / 6), R[1] + R[3] * (.3 + .4 * rnd()), 9 + rnd() * 4);
 }
 // sleeves: wide, with a ragged cuff burning green
 regionHem(RG.sleeve, hemLine(9, .78, .985, .14), CLOTH, 30, .5, .55);
 // the hood: plain black, its opening torn
 {
  const R = RG.hood;
  A.fillStyle = CLOTH; A.fillRect(R[0], R[1], R[2], R[3]); folds(A, R[0], R[1], R[2], R[3] * .7, 30);
  A.fillStyle = CLOTH2; A.fillRect(R[0], R[1] + R[3] * .72, R[2], R[3] * .28); A.save(); A.beginPath(); A.rect(R[0], R[1] + R[3] * .72, R[2], R[3] * .28); A.clip(); folds(A, R[0], R[1] + R[3] * .72, R[2], R[3] * .28, 40); A.restore();
  A.save(); A.globalCompositeOperation = 'destination-out'; A.beginPath(); A.moveTo(R[0], R[1]);
  for (let i = 0; i <= 64; i++) { const fu = i / 64, d = .012 + .045 * Math.pow(Math.abs(Math.sin(fu * 23 + Math.sin(fu * 7) * 2)), 3) + .01 * rnd(); A.lineTo(R[0] + fu * R[2], R[1] + R[3] * d); }
  A.lineTo(R[0] + R[2], R[1]); A.closePath(); A.fill(); A.restore();
 }
 const clothMap = tex(AC), clothEm = tex(EC), flameMask = FC ? tex(FC) : null;

 // the scythe's blade: a long crescent of pale green soul-light with darker veins, painted in the blade's own outline coordinates
 const BX0 = -.06, BXW = 1.5, BY0 = .5, BYH = .66;
 const BLADE = [[.03, .74], [[.12, .95], [.4, 1.1], [.68, 1.08]], [[.96, 1.06], [1.24, .88], [1.38, .58]], [[1.18, .79], [.94, .93], [.66, .95]], [[.42, .97], [.22, .9], [.1, .78]], [[.08, .75], [.05, .73], [.03, .74]]];
 function bladePath(g, X, Y) { g.beginPath(); g.moveTo(X(BLADE[0][0]), Y(BLADE[0][1])); for (let i = 1; i < BLADE.length; i++) { const [a, b, c] = BLADE[i]; g.bezierCurveTo(X(a[0]), Y(a[1]), X(b[0]), Y(b[1]), X(c[0]), Y(c[1])); } g.closePath(); }
 const bladeMap = (() => {
  const W = 512, H = 256, c = cvs(W, H), g = c.getContext('2d'), X = (x) => (x - BX0) / BXW * W, Y = (y) => (1 - (y - BY0) / BYH) * H;
  const lt = new THREE.Color(0xd8ffe8).lerp(GLOW, .25), md = GREAT ? new THREE.Color(0x232a28) : GLOW.clone().lerp(new THREE.Color(0xffffff), .35), dk = GREAT ? GLOW.clone().multiplyScalar(.9) : GLOW.clone().multiplyScalar(.55);
  const css = (col, a) => `rgba(${col.r * 255 | 0},${col.g * 255 | 0},${col.b * 255 | 0},${a})`;
  g.fillStyle = css(md, 1); g.fillRect(0, 0, W, H);
  g.save(); bladePath(g, X, Y); g.clip();
  const gr = g.createLinearGradient(0, Y(1.1), 0, Y(.7)); gr.addColorStop(0, css(GREAT ? md : dk, .7)); gr.addColorStop(.45, css(md, .2)); gr.addColorStop(1, css(lt, GREAT ? .35 : .6)); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.lineCap = 'round';
  for (let i = 0; i < 9; i++) { // darker veins running the length of the crescent
   const o = (rnd() - .5) * .08, t0 = .1 + rnd() * .2, t1 = .6 + rnd() * .35;
   g.strokeStyle = css(dk, .25 + rnd() * .35); g.lineWidth = 1 + rnd() * 3;
   g.beginPath(); for (let k = 0; k <= 30; k++) { const t = lerp(t0, t1, k / 30), x = lerp(.1, 1.3, t), y = 1.0 + .1 * Math.sin(PI * Math.min(1, t * 1.05)) - .38 * t * t + o; if (k) g.lineTo(X(x), Y(y)); else g.moveTo(X(x), Y(y)); } g.stroke();
  }
  for (let i = 0; i < 14; i++) { const x = X(.15 + rnd() * 1.1), y = Y(.8 + rnd() * .25); g.strokeStyle = css(dk, .4); g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - .5) * 14, y + (rnd() - .5) * 10); g.stroke(); }
  g.lineWidth = 7; g.strokeStyle = css(lt, .75); bladePath(g, X, Y); g.stroke();
  g.lineWidth = 2.5; g.strokeStyle = 'rgba(250,255,252,.9)'; bladePath(g, X, Y); g.stroke();
  g.restore();
  const t = tex(c); t.repeat.set(1 / BXW, 1 / BYH); t.offset.set(-BX0 / BXW, -BY0 / BYH); return t;
 })();
 // the staff: black wood twisted like old roots
 const woodMap = (() => {
  const c = cvs(64, 256), g = c.getContext('2d'); g.fillStyle = '#1c181c'; g.fillRect(0, 0, 64, 256);
  for (let i = 0; i < 26; i++) { const x = rnd() * 64; g.strokeStyle = rnd() < .55 ? 'rgba(0,0,0,.5)' : 'rgba(110,100,105,.22)'; g.lineWidth = 1 + rnd() * 2.5; g.beginPath(); for (let y = -20; y <= 276; y += 8) { const xx = x + y * .5 + Math.sin(y * .08 + i) * 2; if (y < -10) g.moveTo(((xx % 64) + 64) % 64, y); else g.lineTo(((xx % 64) + 64) % 64, y); } g.stroke(); }
  for (let i = 0; i < 400; i++) { g.fillStyle = rnd() < .6 ? 'rgba(0,0,0,.25)' : 'rgba(120,112,118,.1)'; g.fillRect(rnd() * 64, rnd() * 256, 1, 3 + rnd() * 6); }
  return tex(c, 1, 1);
 })();
 // sprites for glows, smoke, flames and the moth
 function radial(stops, s) { const c = cvs(s, s), g = c.getContext('2d'), h = s / 2, gr = g.createRadialGradient(h, h, 0, h, h, h); for (const [o, col] of stops) gr.addColorStop(o, col); g.fillStyle = gr; g.fillRect(0, 0, s, s); return tex(c); }
 const dotT = radial([[0, 'rgba(255,255,255,1)'], [.25, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']], 64);
 const smokeT = (() => { const c = cvs(128, 128), g = c.getContext('2d'); for (let i = 0; i < 24; i++) { const x = 40 + rnd() * 48, y = 40 + rnd() * 48, r = 12 + rnd() * 22, q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, 'rgba(255,255,255,.22)'); q.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = q; g.fillRect(0, 0, 128, 128); } const m = g.createRadialGradient(64, 64, 30, 64, 64, 63); m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)'); g.globalCompositeOperation = 'destination-in'; g.fillStyle = m; g.fillRect(0, 0, 128, 128); return tex(c); })();
 const flameT = (() => { const c = cvs(64, 64), g = c.getContext('2d'); g.translate(32, 40); for (const [s, col] of [[1, 'rgba(255,120,30,.55)'], [.72, 'rgba(255,170,60,.85)'], [.45, 'rgba(255,230,150,1)'], [.24, 'rgba(255,255,235,1)']]) { g.fillStyle = col; g.beginPath(); g.moveTo(0, -30 * s); g.bezierCurveTo(9 * s, -14 * s, 13 * s, 2 * s, 0, 14 * s); g.bezierCurveTo(-13 * s, 2 * s, -9 * s, -14 * s, 0, -30 * s); g.fill(); } const q = g.createRadialGradient(0, 2, 0, 0, 2, 30); q.addColorStop(0, 'rgba(255,170,80,.3)'); q.addColorStop(1, 'rgba(255,120,40,0)'); g.globalCompositeOperation = 'destination-over'; g.fillStyle = q; g.fillRect(-32, -40, 64, 64); return tex(c); })();
 const mothT = (() => {
  const c = cvs(256, 128), g = c.getContext('2d'); // the right wing pair: root on the left edge, front at the top
  const fore = (gg) => { gg.beginPath(); gg.moveTo(4, 56); gg.bezierCurveTo(40, 20, 120, 6, 238, 10); gg.bezierCurveTo(226, 40, 170, 62, 96, 70); gg.bezierCurveTo(60, 72, 30, 70, 4, 64); gg.closePath(); };
  const hind = (gg) => { gg.beginPath(); gg.moveTo(4, 62); gg.bezierCurveTo(60, 64, 150, 70, 176, 96); gg.bezierCurveTo(170, 120, 110, 126, 60, 112); gg.bezierCurveTo(30, 100, 10, 84, 4, 68); gg.closePath(); };
  for (const [shape, tint] of [[hind, '#e8e0cc'], [fore, '#f3eddf']]) {
   g.save(); shape(g); g.clip(); g.fillStyle = tint; g.fillRect(0, 0, 256, 128);
   const q = g.createLinearGradient(0, 0, 220, 0); q.addColorStop(0, 'rgba(200,235,210,.35)'); q.addColorStop(.5, 'rgba(255,255,255,0)'); q.addColorStop(1, 'rgba(150,135,110,.25)'); g.fillStyle = q; g.fillRect(0, 0, 256, 128);
   g.strokeStyle = 'rgba(120,105,85,.35)'; g.lineWidth = 1.2; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(6, 62); g.quadraticCurveTo(80 + i * 12, 40 + i * 8, 140 + i * 18, 14 + i * 16); g.stroke(); }
   const ex = shape === fore ? 150 : 110, ey = shape === fore ? 38 : 96;
   g.fillStyle = 'rgba(110,95,80,.5)'; g.beginPath(); g.arc(ex, ey, 7, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,250,235,.8)'; g.beginPath(); g.arc(ex, ey, 3, 0, TAU); g.fill();
   g.lineWidth = 3; g.strokeStyle = 'rgba(255,252,240,.7)'; shape(g); g.stroke(); g.restore();
  }
  return tex(c);
 })();

 // ---------- materials ----------
 // Shader additions, shared by the body materials: a dissolve that burns away with a glowing edge (appear, defeat, setFade),
 // smoke-like drift for the torn cloth, a floor so collapsing cloth lies on the cobbles, a cool rim light so the black reads
 // in the dark, and for the great wraith, stolen flames flickering through holes in its robe.
 const U = {
  time: { value: 0 }, flut: { value: 1 }, floor: { value: .008 }, rim: { value: .3 }, rimC: { value: new THREE.Color(0x6e66a0).lerp(GLOW, .3) },
  disC: { value: 0 }, disB: { value: 0 }, disS: { value: 0 }, disCol: { value: GLOW.clone().multiplyScalar(1.4) },
  lamp: { value: [0, 1, 2, 3, 4, 5].map(() => new THREE.Vector4()) }, lampC: { value: WARM.clone() }, flameMap: { value: flameMask }, flameK: { value: 1 }
 };
 const NOISE = 'float wrH(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}\n' +
  'float wrN(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(wrH(i),wrH(i+vec3(1,0,0)),f.x),mix(wrH(i+vec3(0,1,0)),wrH(i+vec3(1,1,0)),f.x),f.y),mix(mix(wrH(i+vec3(0,0,1)),wrH(i+vec3(1,0,1)),f.x),mix(wrH(i+vec3(0,1,1)),wrH(i+vec3(1,1,1)),f.x),f.y),f.z);}\n';
 const FLUT = '{ float wrF = aFl.x * aFl.x * uFlut; vec2 wrD = aFl.zw; vec2 wrT = vec2(-wrD.y, wrD.x);\n' +
  ' float wrA = sin(uTime * 1.7 + aFl.y + aFl.x * 3.1), wrB = sin(uTime * 2.9 + aFl.y * 1.7 + aFl.x * 5.3), wrC = sin(uTime * 1.3 + aFl.y * 2.3 + position.y * 4.0);\n' +
  ' transformed.xz += wrD * wrF * (0.07 * wrA + 0.03 * wrB) + wrT * wrF * 0.05 * wrC; transformed.y += wrF * 0.035 * (wrB + 0.6); }\n';
 const FLOOR = '{ vec4 wrW = modelMatrix * vec4(transformed, 1.0); float wrFl = uFloor * (1.0 + aFl.y * 0.3);\n' +
  ' if (wrW.y < wrFl) { wrW.y = wrFl; mvPosition = viewMatrix * wrW; gl_Position = projectionMatrix * mvPosition; } }\n';
 const LAMP_GLSL = ' for (int i = 0; i < 6; i++) { vec3 wrd = vDP - uLamp[i].xyz; totalEmissiveRadiance += uLampC * (uLamp[i].w * exp(-dot(wrd, wrd) * 30.0)); }\n' +
  ' totalEmissiveRadiance += uLampC * (texture2D(uFlameMap, vUv).r * uFlameK * (0.7 + 0.3 * sin(uTime * 9.0 + vDP.x * 40.0 + vDP.y * 23.0)) * 1.6);\n';
 function patch(m, o) {
  const key = 'wraith-' + (o.flut ? 'f' : '') + (o.floor ? 'g' : '') + (o.rim ? 'r' : '') + (o.lamps ? 'l' : '') + (o.basic ? 'b' : '');
  m.onBeforeCompile = (sh) => {
   Object.assign(sh.uniforms, { uTime: U.time, uFlut: U.flut, uFloor: U.floor, uRim: U.rim, uRimC: U.rimC, uDis: o.dis, uDisCol: U.disCol, uLamp: U.lamp, uLampC: U.lampC, uFlameMap: U.flameMap, uFlameK: U.flameK, uRimS: { value: o.rim || 0 } });
   let vs = sh.vertexShader, frag = sh.fragmentShader;
   vs = 'varying vec3 vDP;\nuniform float uTime;\nuniform float uFlut;\nuniform float uFloor;\n' + (o.flut ? 'attribute vec4 aFl;\n' : '') + vs;
   vs = vs.replace('#include <begin_vertex>', '#include <begin_vertex>\n vDP = position;\n' + (o.flut ? FLUT : ''));
   if (o.floor) vs = vs.replace('#include <project_vertex>', '#include <project_vertex>\n' + FLOOR);
   frag = 'varying vec3 vDP;\nuniform float uDis;\nuniform vec3 uDisCol;\nuniform float uRim;\nuniform float uRimS;\nuniform vec3 uRimC;\nuniform float uTime;\n' + (o.lamps ? 'uniform vec4 uLamp[6];\nuniform vec3 uLampC;\nuniform sampler2D uFlameMap;\nuniform float uFlameK;\n' : '') + NOISE + frag;
   frag = frag.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n float wrE = 0.0; if (uDis > 0.0) { float n = .72 * wrN(vDP * 9.) + .28 * wrN(vDP * 23.); float th = uDis * 1.1 - .05; if (n < th) discard; wrE = 1. - smoothstep(0., .055, n - th); }\n');
   if (!o.basic) frag = frag.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += uDisCol * wrE * 1.7;\n' + (o.lamps ? LAMP_GLSL : ''));
   else frag = frag.replace('#include <dithering_fragment>', ' gl_FragColor.rgb += uDisCol * wrE * 1.7;\n#include <dithering_fragment>');
   if (o.rim) frag = frag.replace('#include <dithering_fragment>', ' gl_FragColor.rgb += uRimC * (uRim * uRimS * pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 2.6));\n#include <dithering_fragment>');
   sh.vertexShader = vs; sh.fragmentShader = frag;
  };
  m.customProgramCacheKey = () => key;
  return m;
 }
 const std = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: .8, metalness: 0 }, o));
 const ADD = { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false };
 const M = {
  cloth: patch(std({ map: clothMap, emissiveMap: clothEm, emissive: 0xffffff, emissiveIntensity: 1.2 * GK, roughness: .9, side: THREE.DoubleSide, alphaTest: .4, alphaToCoverage: true, skinning: true }), { dis: U.disC, flut: true, floor: true, rim: 1, lamps: GREAT }),
  voidM: patch(new THREE.MeshBasicMaterial({ color: 0x000000, skinning: true }), { dis: U.disC, basic: true }),
  bone: patch(std({ color: 0xffffff, vertexColors: true, roughness: .55, emissive: GLOW.clone().multiplyScalar(.09 * GK), skinning: true }), { dis: U.disB, rim: .9 }),
  boneGlow: patch(new THREE.MeshBasicMaterial({ color: GLOW.clone().lerp(new THREE.Color(0xffffff), .25).multiplyScalar(Math.min(1, .8 * GK)), skinning: true }), { dis: U.disB, basic: true }),
  wood: patch(std({ map: woodMap, roughness: .62, color: 0xffffff }), { dis: U.disS, rim: .8 }),
  blade: patch(new THREE.MeshBasicMaterial({ map: bladeMap, color: new THREE.Color(1, 1, 1).multiplyScalar(Math.min(1, .82 + .2 * GK)), side: THREE.DoubleSide }), { dis: U.disS, basic: true }),
  fitting: patch(std({ color: 0x2c2a30, roughness: .38, metalness: .55, emissive: 0x05070a }), { dis: U.disS, rim: 1 }),
  glow: patch(new THREE.MeshBasicMaterial({ color: CORE.clone() }), { dis: U.disS, basic: true }),
  heart: new THREE.MeshBasicMaterial(Object.assign({ vertexColors: true }, ADD)),
  eye: new THREE.MeshBasicMaterial({ color: GLOW.clone().lerp(new THREE.Color(0xffffff), .45) })
 };
 if (GREAT) {
  M.iron = patch(std({ color: 0x6a5e56, roughness: .62, metalness: .4, emissive: 0x0c0705 }), { dis: U.disC, rim: .6 });
  M.lamp = patch(new THREE.MeshBasicMaterial({ color: WARM.clone().lerp(new THREE.Color(0xffffff), .3) }), { dis: U.disC, basic: true });
 }

 // ---------- skeleton ----------
 const PEL_Y = 1.1, UA = .34, FA = .3, HS = 1.34;  // pelvis height in the bind pose, arm bone lengths, hand size
 const bones = [], BI = {};
 function bone(name, parent, x, y, z, order) { const b = new THREE.Bone(); b.name = name; b.position.set(x, y, z); if (order) b.rotation.order = order; parent.add(b); BI[name] = bones.length; bones.push(b); return b; }
 const pelvis = bone('pelvis', base, 0, PEL_Y, 0), spine = bone('spine', pelvis, 0, .22, 0), chest = bone('chest', spine, 0, .24, 0);
 const neck = bone('neck', chest, 0, .18, -.01, 'YXZ'), head = bone('head', neck, 0, .14, .01, 'YXZ'), hoodT = bone('hoodT', head, 0, .12, -.17);
 const FZ = [.025, .009, -.007, -.022], P1 = [.047, .052, .049, .04], P2 = [.03, .034, .032, .026], P3 = [.026, .028, .027, .022];
 const arms = [-1, 1].map((sx) => {
  const s = sx < 0 ? 'R' : 'L', sh = bone('sh' + s, chest, .25 * sx, .12, 0), el = bone('el' + s, sh, 0, -UA, 0), wr = bone('wr' + s, el, 0, -FA, 0);
  const dr = bone('drape' + s, el, 0, -.15, 0);
  const fingers = FZ.map((z, k) => { const f0 = bone('f' + s + k, wr, -sx * .004, -.078 * HS, z * HS), f1 = bone('g' + s + k, f0, 0, -P1[k] * HS, 0); return { f0, f1 }; });
  const t0 = bone('t' + s + '0', wr, -sx * .014 * HS, -.024 * HS, .03 * HS), t1 = bone('t' + s + '1', t0, 0, -.038 * HS, .002);
  return { sx, s, sh, el, wr, dr, fingers, t0, t1, qSh: new THREE.Quaternion(), qEl: new THREE.Quaternion(), qWr: new THREE.Quaternion(), qDr: new THREE.Quaternion() };
 });
 const R = arms[0], L = arms[1], SA = R, OA = L;    // the scythe arm, and the free one with the long claws
 const RK = 10, ringU = [], ringL = [];
 for (let k = 0; k < RK; k++) {
  const a = (k + .5) / RK * TAU, u = bone('rU' + k, pelvis, .27 * Math.sin(a), .05, .27 * Math.cos(a) * .86, 'YXZ'); u.rotation.y = a;
  ringU.push(u); ringL.push(bone('rL' + k, u, 0, -.5, .06, 'YXZ'));
 }
 root.updateMatrixWorld(true);
 const bw = (b) => { const v = V3(); b.getWorldPosition(v); return v; };
 const HB = bw(head), CB = bw(chest);

 // ---------- geometry helpers ----------
 const BK = new Map(); // material -> geometries to merge into one skinned mesh
 const put = (mat, g) => { let l = BK.get(mat); if (!l) BK.set(mat, (l = [])); l.push(g); return g; };
 function surf(nu, nv, f, uvf, seam) {
  const pos = [], uv = [], idx = [], o = [0, 0, 0];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const u = i / nu, v = j / nv; f(u, v, o); pos.push(o[0], o[1], o[2]); const t = uvf ? uvf(u, v, o) : [u, 1 - v]; uv.push(t[0], t[1]); }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  if (seam) { const nr = g.attributes.normal.array, w = nu + 1; for (let j = 0; j <= nv; j++) { const a = j * w * 3, b = (j * w + nu) * 3; for (let q = 0; q < 3; q++) { const m = (nr[a + q] + nr[b + q]) / 2; nr[a + q] = nr[b + q] = m; } } }
  return g;
 }
 // a tube along a curve with a radius that may vary along it and around it
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
 function skinW(g, fn) {
  const p = g.attributes.position, n = p.count, si = new Float32Array(n * 4), sw = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
   let inf = fn(p.getX(i), p.getY(i), p.getZ(i)).filter((e) => e[1] > 1e-4).sort((a, b) => b[1] - a[1]).slice(0, 4);
   if (!inf.length) inf = [[0, 1]];
   let tot = 0; for (const e of inf) tot += e[1];
   inf.forEach((e, k) => { si[i * 4 + k] = e[0]; sw[i * 4 + k] = e[1] / tot; });
  }
  g.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4)); return g;
 }
 const rigid = (g, b) => skinW(g, () => [[BI[b.name], 1]]);
 function flutter(g, fn) { const p = g.attributes.position, a = new Float32Array(p.count * 4); for (let i = 0; i < p.count; i++) fn(p.getX(i), p.getY(i), p.getZ(i), a, i * 4); g.setAttribute('aFl', new THREE.BufferAttribute(a, 4)); return g; }
 function colorize(g, fn) { const p = g.attributes.position, c = new Float32Array(p.count * 3); for (let i = 0; i < p.count; i++) { const k = fn(p.getX(i), p.getY(i), p.getZ(i)); c[i * 3] = k[0]; c[i * 3 + 1] = k[1]; c[i * 3 + 2] = k[2]; } g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return g; }
 function mergeAll(list) {
  const names = new Set(); let nv = 0, ni = 0;
  for (const g of list) { if (!g.attributes.normal) g.computeVertexNormals(); for (const k in g.attributes) names.add(k); nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
  const out = new THREE.BufferGeometry();
  for (const k of names) {
   const size = list.find((g) => g.attributes[k]).attributes[k].itemSize, arr = new Float32Array(nv * size); let vo = 0;
   for (const g of list) {
    const c = g.attributes.position.count, a = g.attributes[k];
    if (a) arr.set(a.array, vo * size); else if (k === 'color') arr.fill(1, vo * size, (vo + c) * size); else if (k === 'skinWeight') for (let i = 0; i < c; i++) arr[(vo + i) * 4] = 1;
    vo += c;
   }
   out.setAttribute(k, new THREE.BufferAttribute(arr, size));
  }
  const I = new Uint32Array(ni); let vo = 0, io = 0;
  for (const g of list) { const c = g.attributes.position.count; if (g.index) { const a = g.index.array; for (let k = 0; k < a.length; k++) I[io + k] = a[k] + vo; io += a.length; } else { for (let k = 0; k < c; k++) I[io + k] = vo + k; io += c; } vo += c; }
  out.setIndex(new THREE.BufferAttribute(I, 1)); out.computeBoundingSphere(); return out;
 }
 const _m = new THREE.Matrix4(), _q = new THREE.Quaternion();
 const turn = (g, dir) => g.applyMatrix4(_m.makeRotationFromQuaternion(_q.setFromUnitVectors(YAX, dir)));

 // ---------- skin weights ----------
 function wBody(y) {
  if (y >= 1.6) return [[BI.chest, 1]];
  if (y >= 1.4) { const t = sm(1.4, 1.6, y); return [[BI.spine, 1 - t], [BI.chest, t]]; }
  if (y >= 1.18) { const t = sm(1.2, 1.4, y); return [[BI.pelvis, 1 - t], [BI.spine, t]]; }
  return [[BI.pelvis, 1]];
 }
 const ringF = (x, z) => ((((Math.atan2(x, z / .86) / TAU) * RK - .5) % RK) + RK) % RK;
 function wRobe(x, y, z) {
  if (y >= 1.18) return wBody(y);
  const s1 = sm(1.18, .9, y), s2 = sm(.78, .4, y), f = ringF(x, z), k0 = Math.floor(f) % RK, k1 = (k0 + 1) % RK, fr = f - Math.floor(f);
  return [[BI.pelvis, 1 - s1], [BI['rU' + k0], s1 * (1 - s2) * (1 - fr)], [BI['rU' + k1], s1 * (1 - s2) * fr], [BI['rL' + k0], s1 * s2 * (1 - fr)], [BI['rL' + k1], s1 * s2 * fr]];
 }
 function wMantle(x, y) {
  const side = sm(.17, .32, Math.abs(x)) * sm(1.72, 1.5, y) * .55, b = wBody(Math.max(y, 1.45));
  return side <= 0 ? b : b.map((e) => [e[0], e[1] * (1 - side)]).concat([[BI['sh' + (x < 0 ? 'R' : 'L')], side]]);
 }
 function wSleeve(x, y, z, Ar) {
  const S = BI['sh' + Ar.s], El = BI['el' + Ar.s], D = BI['drape' + Ar.s];
  if (y > 1.6) { const c = sm(1.6, 1.76, y) * .5; return [[S, 1 - c], [BI.chest, c]]; }
  if (y > 1.42) return [[S, 1]];
  if (y > 1.28) { const t = sm(1.42, 1.28, y); return [[S, 1 - t], [El, t]]; }
  const rad = Math.hypot(x - Ar.sx * .25, z), d = sm(1.26, 1.02, y) * sm(.075, .15, rad) * .85;
  return [[El, 1 - d], [D, d]];
 }
 function wHood(x, y, z) { const back = sm(-.05, -.2, z) * sm(HB.y + .02, HB.y + .14, y); return [[BI.head, 1 - back], [BI.hoodT, back]]; }

 // ---------- the robe, open over the ribs ----------
 const RP = [[.52, .08], [.49, .3], [.44, .5], [.38, .7], [.32, .9], [.29, 1.06], [.278, 1.2], [.272, 1.35], [.282, 1.5], [.272, 1.64]];
 const robeR = (y) => interp(RP, y), XS = 1.04, ZS = .86;
 {
  const g = surf(Q(128), Q(48), (u, v, o) => {
   const y = lerp(ROBE_Y0, ROBE_Y1, v), a = (u - .5) * TAU;
   const lo = sm(1.15, .2, y), r = robeR(y) + (.008 + .022 * lo) * Math.sin(11 * a + .5 + y * 2) + .01 * lo * Math.sin(19 * a + 1.1);
   o[0] = Math.sin(a) * r * XS; o[1] = y; o[2] = Math.cos(a) * r * ZS;
  }, (u, v) => uvOf(RG.robe, u, .004 + v * .992), true);
  flutter(g, (x, y, z, a, i) => { const an = Math.atan2(x, z); a[i] = .55 * sm(.62, .1, y); a[i + 1] = an * 3; a[i + 2] = Math.sin(an); a[i + 3] = Math.cos(an); });
  put(M.cloth, skinW(g, wRobe));
 }

 // ---------- the mantle: a short ragged cape over the shoulders, open in front ----------
 const mHemY = (a) => 1.42 - .1 * (1 - Math.cos(a)) / 2;
 const mR = (y) => .16 + .19 * sm(1.81, 1.67, y) + .06 * sm(1.67, 1.3, y);
 const mOpen = (v) => lerp(.6, .95, v);
 const MXS = 1.1, MZS = .84;
 {
  const g = surf(Q(96), Q(26), (u, v, o) => {
   const ao = mOpen(v), a = ao + u * (TAU - 2 * ao), hy = mHemY(a), y = lerp(1.82, hy, Math.pow(v, .85));
   const back = (1 - Math.cos(a)) / 2, r = mR(y) + .012 * Math.sin(a * 13 + v * 3) * v + .02 * back * sm(1.7, 1.5, y);
   o[0] = Math.sin(a) * r * MXS; o[1] = y; o[2] = Math.cos(a) * r * MZS - .01 * back;
  }, (u, v) => uvOf(RG.mantle, u, .004 + v * .992));
  flutter(g, (x, y, z, a, i) => { const an = Math.atan2(x, z); a[i] = .45 * sm(1.52, 1.32, y); a[i + 1] = an * 2 + 1; a[i + 2] = Math.sin(an); a[i + 3] = Math.cos(an); });
  put(M.cloth, skinW(g, wMantle));
 }

 // ---------- torn strips in three layers: long ones from the waist, shorter ones over the hips, and ones under the mantle ----------
 const STRIPS = [];
 function layer(n, skip, yTop, lA, lB, wA, wB, rOff, flare, kind) {
  for (let i = 0; i < n; i++) {
   const a = (i + .5) / n * TAU - PI + (rnd() - .5) * TAU / n * .5;
   if (Math.abs(a) < skip) continue;
   STRIPS.push({ a, yTop: yTop + (rnd() - .5) * .03, len: lerp(lA, lB, rnd()), w: lerp(wA, wB, rnd()), rOff: rOff + .006 * (i % 3), flare: flare * (.75 + .5 * rnd()), k: (rnd() * 8) | 0, ph: rnd() * TAU, kind, curl: (rnd() - .5) * .4, twist: (rnd() - .5) * .3 });
  }
 }
 layer(32, .24, 1.17, 1.18, 1.42, .17, .24, .014, .2, 0);
 layer(18, .2, 1.25, .56, .86, .15, .2, .045, .14, 1);
 layer(16, .82, 0, .36, .62, .13, .17, 0, .1, 2);
 for (const s of STRIPS) {
  const nu = 5, nv = Q(22, 10), mh = s.kind === 2 ? mHemY(s.a) : 0, yTop = s.kind === 2 ? mh + .07 : s.yTop;
  const g = surf(nu, nv, (u, v, o) => {
   const t = u - .5, f = v, y = yTop - s.len * f;
   const baseR = s.kind === 2 ? Math.max(mR(Math.min(y + .06, 1.8)) - .018, robeR(y) + .06) : robeR(y);
   const r = baseR + s.rOff + s.flare * Math.pow(f, 1.5) + .016 * (1 - 4 * t * t) * (.4 + f) + s.curl * t * .05 * f;
   const aa = s.a + t * s.w / Math.max(.2, r) + s.twist * f * .3, xs = s.kind === 2 ? lerp(MXS, XS, sm(0, .5, f)) : XS, zs = s.kind === 2 ? lerp(MZS, ZS, sm(0, .5, f)) : ZS;
   o[0] = Math.sin(aa) * r * xs; o[1] = y; o[2] = Math.cos(aa) * r * zs;
  }, (u, v) => uvOf(RG.strips, (s.k + .5 + (u - .5) * .92) / 8, .006 + v * .988));
  flutter(g, (x, y, z, a, i) => { const f = cl((yTop - y) / s.len, 0, 1); a[i] = Math.pow(f, 1.2) * (s.kind === 2 ? .8 : 1); a[i + 1] = s.ph; a[i + 2] = Math.sin(s.a); a[i + 3] = Math.cos(s.a); });
  if (s.kind === 2) skinW(g, (x, y, z) => { const t = sm(yTop - .08, yTop - .45, y), wr = wRobe(x, y, z), wm = wMantle(x, Math.max(y, 1.46)); return wm.map((e) => [e[0], e[1] * (1 - t)]).concat(wr.map((e) => [e[0], e[1] * t])); });
  else skinW(g, wRobe);
  put(M.cloth, g);
 }

 // ---------- sleeves: wide and torn at the cuff; their lower bell hangs from a drape joint ----------
 for (const Ar of arms) {
  const sx = Ar.sx;
  const g = surf(Q(40), Q(24), (u, v, o) => {
   const a = u * TAU, yEnd = 1.02 - .1 * Math.max(0, -Math.cos(a)) * (1 - .3 * Math.max(0, sx * Math.sin(a))) - .03 * Math.max(0, sx * Math.sin(a));
   const y = lerp(1.76, yEnd, v);
   let r = lerp(.082, .094, sm(0, .3, v)) + .1 * Math.pow(sm(.35, 1, v), 1.4) + .01 * sm(.5, 1, v) * Math.sin(7 * a + sx);
   r *= lerp(.5, 1, sm(0, .1, v));
   o[0] = .25 * sx + .015 * sx * v + r * Math.sin(a); o[1] = y; o[2] = r * Math.cos(a) - .012 * v;
  }, (u, v) => uvOf(RG.sleeve, u, .006 + v * .988), true);
  flutter(g, (x, y, z, a, i) => { const dx = x - sx * .25, an = Math.atan2(dx, z); a[i] = .6 * sm(1.3, 1.0, y); a[i + 1] = an + sx; a[i + 2] = Math.sin(an); a[i + 3] = Math.cos(an); });
  put(M.cloth, skinW(g, (x, y, z) => wSleeve(x, y, z, Ar)));
 }

 // ---------- the hood: a deep cowl rising to a point, a heavy torn rim, darkness inside ----------
 const hoodPt = (x, y, z) => {
  x *= .21; y *= .245; z *= .23;
  const back = Math.max(0, -z) / .23, up = Math.max(0, y) / .245, front = Math.max(0, z) / .23;
  const pk = Math.pow(up, 3) * (1 - .5 * front) * Math.pow(1 - Math.min(1, Math.abs(x) / .21), 1.5);
  y += .2 * pk; z -= .045 * pk;
  z -= .07 * Math.pow(back, 1.5) * Math.pow(up, 1.2); y += .04 * back * back * up;
  if (y < -.08) { const k = 1 + .95 * ((-.08 - y) / .16); x *= k; z *= lerp(1, k, .72); }
  return [x + HB.x, y + HB.y, z + HB.z];
 };
 {
  const g = new THREE.SphereGeometry(1, Q(64), Q(36), PI / 2 + .9, TAU - 1.8, .7, PI - .7); g.rotateX(PI / 2);
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) { const q = hoodPt(p.getX(i), p.getY(i), p.getZ(i)); p.setXYZ(i, q[0], q[1], q[2]); const t = uvOf(RG.hood, uv.getX(i), .004 + (1 - uv.getY(i)) * .68); uv.setXY(i, t[0], t[1]); }
  g.computeVertexNormals(); flutter(g, (x, y, z, a, i) => { a[i + 1] = 2; });
  put(M.cloth, skinW(g, wHood));
  const rim = [];
  for (let k = 0; k <= 48; k++) { const phi = PI / 2 + .9 + k / 48 * (TAU - 1.8), th = .76; rim.push(V3(...hoodPt(-Math.cos(phi) * Math.sin(th), -Math.sin(phi) * Math.sin(th), Math.cos(th)))); }
  const rg = tube(rim, Q(72), 8, (t) => .017 + .004 * Math.sin(t * 61), 1), ruv = rg.attributes.uv;
  for (let i = 0; i < ruv.count; i++) { const t = uvOf(RG.hood, ruv.getY(i), .74 + ruv.getX(i) * .24); ruv.setXY(i, t[0], t[1]); }
  flutter(rg, (x, y, z, a, i) => { a[i + 1] = 3; });
  put(M.cloth, skinW(rg, wHood));
  // darkness filling the hood, and behind the ribs
  const v1 = new THREE.SphereGeometry(1, 20, 16); v1.scale(.15, .18, .145); v1.translate(HB.x, HB.y - .015, HB.z + .01); put(M.voidM, rigid(v1, head));
  const v2 = new THREE.SphereGeometry(1, 20, 14); v2.scale(.17, .23, .07); v2.translate(0, 1.53, -.135); put(M.voidM, rigid(v2, chest));
  const v3 = new THREE.CylinderGeometry(.075, .09, .2, 12); v3.translate(0, 1.77, -.03); put(M.voidM, skinW(v3, (x, y) => [[BI.neck, sm(1.7, 1.82, y)], [BI.chest, 1 - sm(1.7, 1.82, y)]]));
 }

 // ---------- bones: black, lit green from within; spine, ribs, breastbone, collarbones, forearms and long clawed hands ----------
 const CHAR = [.2, .2, .22];
 const boneCol = (k) => (x, y, z) => { const n = .82 + .18 * Math.sin(x * 91 + y * 57 + z * 73); return [CHAR[0] * n * k, CHAR[1] * n * k, CHAR[2] * n * k]; };
 function seg(a, b, r0, r1, b0, rs, knob) {
  const d = V3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), Ln = d.length(); d.normalize();
  const g = new THREE.CylinderGeometry(r1, r0, Ln, rs || 6, 1, true); turn(g, d); g.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
  rigid(g, b0); colorize(g, boneCol(1)); put(M.bone, g);
  if (knob) for (const [p, r] of [[a, r0 * 1.3], [b, r1 * 1.25]]) { const s = new THREE.SphereGeometry(r, rs || 6, 5); s.translate(p[0], p[1], p[2]); rigid(s, b0); put(knob === 2 ? M.boneGlow : M.bone, knob === 2 ? s : colorize(s, boneCol(1.1))); }
 }
 for (let y = 1.16; y < 1.86; y += .031) {
  const z = -.07 + .018 * Math.sin((y - 1.16) / .7 * PI), r = lerp(.022, .013, sm(1.16, 1.86, y)), b0 = y < 1.4 ? spine : y < 1.72 ? chest : neck;
  const c = new THREE.CylinderGeometry(r, r * 1.05, .021, 8); c.translate(0, y, z);
  const pr = new THREE.BoxGeometry(r * .5, .016, r * 1.4); pr.translate(0, y - .004, z - r * 1.3);
  const tp = new THREE.BoxGeometry(r * 2.6, .01, r * .7); tp.translate(0, y, z - r * .6);
  for (const q of [c, pr, tp]) { rigid(q, b0); colorize(q, boneCol(.9)); put(M.bone, q); }
 }
 for (let k = 0; k < 7; k++) for (const sd of [-1, 1]) {
  const ys = 1.71 - .04 * k, yf = ys - .075 - .01 * k, W = .1 + .055 * Math.sin(PI * (k + 1.2) / 8.4), floating = k >= 5;
  const pE = floating ? .95 - .25 * (k - 5) : Math.acos(.03 / W), pts = [];
  for (let i = 0; i <= 12; i++) { const ph = lerp(-PI / 2 + .14, pE, i / 12); pts.push(V3(sd * W * Math.cos(ph), lerp(ys, yf, (ph + PI / 2) / PI) - .012 * Math.cos(ph), .03 + .1 * Math.sin(ph))); }
  const g = tube(pts, Q(22, 10), 6, (t, th) => .009 * (1 - .25 * t) * (1 - .4 * Math.abs(Math.sin(th))));
  rigid(g, chest); colorize(g, boneCol(1)); put(M.bone, g);
 }
 {
  const st = new THREE.CylinderGeometry(.017, .021, .23, 8, 1); st.scale(1, 1, .45); st.translate(0, 1.585, .132);
  const mb = new THREE.SphereGeometry(1, 10, 8); mb.scale(.028, .016, .008); mb.translate(0, 1.688, .128);
  const xp = new THREE.ConeGeometry(.012, .04, 6); xp.rotateX(PI); xp.translate(0, 1.455, .133);
  for (const q of [st, mb, xp]) { rigid(q, chest); colorize(q, boneCol(1)); put(M.bone, q); }
  for (const sd of [-1, 1]) { const g = tube([[sd * .02, 1.702, .123], [sd * .1, 1.712, .11], [sd * .16, 1.73, .06], [sd * .215, 1.722, .01]], 12, 6, (t) => .0085 - .002 * t); rigid(g, chest); colorize(g, boneCol(1)); put(M.bone, g); }
 }
 // forearms and hands hang straight down in the bind pose: the palm faces in, the fingers spaced front to back; joints and claws glow
 for (const Ar of arms) {
  const sx = Ar.sx, wx = .25 * sx, wy = bw(Ar.wr).y, h = HS;
  seg([wx - sx * .011, wy + FA - .02, .008], [wx - sx * .008, wy + .012, .006], .0095, .0075, Ar.el, 7, true);
  seg([wx + sx * .009, wy + FA - .01, -.01], [wx + sx * .007, wy + .01, -.005], .0085, .0068, Ar.el, 7, true);
  for (let i = 0; i < 6; i++) { const s = new THREE.SphereGeometry(.0105 * h, 7, 5); s.translate(wx - sx * .002 * (i % 2), wy - (.012 + .008 * (i >> 1)) * h, (.018 - .014 * (i % 3)) * h); rigid(s, Ar.wr); colorize(s, boneCol(.9)); put(M.bone, s); }
  FZ.forEach((z, k) => {
   const kx = wx - sx * .004, ky = wy - .078 * h, kz = z * h;
   seg([wx - sx * .002, wy - .028 * h, z * .55 * h], [kx, ky + .004, kz], .005, .0056, Ar.wr, 6, false);
   seg([kx, ky, kz], [kx, ky - P1[k] * h, kz], .0062, .0054, Ar.fingers[k].f0, 7, 2);
   const y1 = ky - P1[k] * h, y2 = y1 - P2[k] * h, bend = .38, dx = -sx * Math.sin(bend) * P3[k] * h, dy = -Math.cos(bend) * P3[k] * h;
   seg([kx, y1, kz], [kx, y2, kz], .0052, .0046, Ar.fingers[k].f1, 7, 2);
   seg([kx, y2, kz], [kx + dx, y2 + dy, kz], .0045, .0038, Ar.fingers[k].f1, 6, false);
   const cw = new THREE.ConeGeometry(.0046, .034 * h, 6); turn(cw, V3(dx * 1.3, dy, 0).normalize()); cw.translate(kx + dx * 1.75, y2 + dy * 1.6, kz);
   put(M.boneGlow, rigid(cw, Ar.fingers[k].f1));
  });
  const tx = wx - sx * .014 * h, ty = wy - .024 * h, tz = .03 * h;
  seg([tx, ty, tz], [tx, ty - .038 * h, tz + .002], .0066, .0058, Ar.t0, 7, 2);
  seg([tx, ty - .038 * h, tz + .002], [tx, ty - .07 * h, tz + .002], .0056, .0048, Ar.t1, 7, false);
  const tc = new THREE.ConeGeometry(.0046, .03 * h, 6); turn(tc, V3(0, -1, 0)); tc.translate(tx, ty - .088 * h, tz + .002); put(M.boneGlow, rigid(tc, Ar.t1));
 }

 // ---------- the heart: a heart of soul-light in the ribcage ----------
 const heart = (() => {
  const shape = (k) => { const s = new THREE.Shape(); s.moveTo(0, -.05 * k); s.bezierCurveTo(-.014 * k, -.035 * k, -.046 * k, -.012 * k, -.046 * k, .012 * k); s.bezierCurveTo(-.046 * k, .036 * k, -.018 * k, .046 * k, 0, .027 * k); s.bezierCurveTo(.018 * k, .046 * k, .046 * k, .036 * k, .046 * k, .012 * k); s.bezierCurveTo(.046 * k, -.012 * k, .014 * k, -.035 * k, 0, -.05 * k); return s; };
  const outer = new THREE.ExtrudeGeometry(shape(1.5), { depth: .01, bevelEnabled: true, bevelThickness: .016, bevelSize: .012, bevelSegments: 3, curveSegments: 14 }); outer.translate(0, 0, -.005);
  const inner = new THREE.ExtrudeGeometry(shape(.8), { depth: .01, bevelEnabled: true, bevelThickness: .01, bevelSize: .008, bevelSegments: 2, curveSegments: 12 }); inner.translate(0, .002, .012);
  colorize(outer, (x, y) => { const k = .55 + .35 * sm(.06, -.07, y); return [GLOW.r * k * .8, GLOW.g * k, GLOW.b * k * .8]; });
  colorize(inner, () => [CORE.r, CORE.g, CORE.b]);
  const m = new THREE.Mesh(mergeAll([outer, inner]), M.heart); m.position.set(0, 1.535 - CB.y, .04); m.renderOrder = 4; chest.add(m); return m;
 })();
 // the eyes: two slanted embers deep in the hood
 const eyes = (() => {
  const gs = [-1, 1].map((sd) => { const g = new THREE.SphereGeometry(1, 12, 8); g.scale(.018, .008, .006); const pp = g.attributes.position; for (let i = 0; i < pp.count; i++) pp.setY(i, pp.getY(i) * (1 - .5 * sd * pp.getX(i) / .018)); g.rotateZ(sd * .34); g.translate(.05 * sd, .006, .158); return g; });
  const m = new THREE.Mesh(mergeAll(gs), M.eye); head.add(m); return m;
 })();

 // ---------- the scythe: a twisted thorny black staff, an ornate black head with burning openings, a long pale-green blade ----------
 const scy = new THREE.Group(); scy.name = 'scythe'; base.add(scy);
 const SCY = { wood: [], blade: [], fit: [], glow: [] };
 {
  const knots = [.16, .39, .61, .79];
  SCY.wood.push(tube([[0, -1.52, 0], [.012, -1.05, -.008], [-.008, -.6, .006], [.01, -.15, -.004], [-.006, .3, .008], [.006, .62, -.004], [0, .74, 0]], Q(140, 60), 10,
   (t, th) => { let k = 0; for (const c of knots) k += .2 * Math.exp(-Math.pow((t - c) / .012, 2)); return .025 * (1 + .16 * Math.cos(3 * th - t * 52) + k); }, 8));
  for (let i = 0; i < 20; i++) { // thorns
   const y = lerp(-1.42, .66, (i + rnd() * .6) / 20), a = rnd() * TAU, d = V3(Math.cos(a), .45 + rnd() * .3, Math.sin(a)).normalize(), l = .026 + rnd() * .022;
   const c = new THREE.ConeGeometry(.0055, l, 5); turn(c, d); c.translate(Math.cos(a) * .024 + d.x * l / 2, y + d.y * l / 2, Math.sin(a) * .024 + d.z * l / 2); SCY.wood.push(c);
  }
  const fer = new THREE.ConeGeometry(.024, .17, 8); fer.rotateX(PI); fer.translate(0, -1.6, 0); SCY.fit.push(fer);
  const fr2 = new THREE.TorusGeometry(.028, .007, 6, 14); fr2.rotateX(PI / 2); fr2.translate(0, -1.51, 0); SCY.fit.push(fr2);
  for (const y of [-.07, -.045, -.02, .005, .03]) { const r = new THREE.TorusGeometry(.027, .0055, 5, 14); r.rotateX(PI / 2); r.translate(0, y, 0); SCY.fit.push(r); }
  // the head: a ring with a burning eye, a crown of black thorns, and the blade's root
  const ring = new THREE.TorusGeometry(.046, .011, 8, 24); ring.translate(-.02, .82, 0); SCY.fit.push(ring);
  const orb = new THREE.SphereGeometry(.03, 14, 10); orb.scale(1, 1, .7); orb.translate(-.02, .82, 0); SCY.glow.push(orb);
  for (const [ang, l, r] of [[95, .11, .011], [128, .13, .012], [160, .1, .01], [192, .12, .011], [228, .08, .009], [60, .07, .008], [262, .07, .008]]) {
   const a = ang * PI / 180, d = V3(Math.cos(a), Math.sin(a), 0), c = new THREE.ConeGeometry(r, l, 6); turn(c, d); c.translate(-.02 + d.x * (.05 + l / 2), .82 + d.y * (.05 + l / 2), 0); SCY.fit.push(c);
  }
  const neckS = new THREE.CylinderGeometry(.02, .026, .08, 8); neckS.translate(0, .74, 0); SCY.fit.push(neckS);
  const plate = new THREE.Shape(); plate.moveTo(.0, .74); plate.lineTo(.13, .8); plate.lineTo(.14, .9); plate.lineTo(.05, .9); plate.lineTo(-.01, .86); plate.closePath();
  const hole = new THREE.Path(); hole.absarc(.075, .83, .018, 0, TAU, true); plate.holes.push(hole);
  const pg = new THREE.ExtrudeGeometry(plate, { depth: .014, bevelEnabled: true, bevelThickness: .004, bevelSize: .004, bevelSegments: 1, curveSegments: 10 }); pg.translate(0, 0, -.007); SCY.fit.push(pg);
  const ho = new THREE.SphereGeometry(.016, 10, 8); ho.scale(1, 1, .5); ho.translate(.075, .83, 0); SCY.glow.push(ho);
  SCY.fit.push(tube([[-.06, .86, 0], [-.11, .92, 0], [-.1, .98, 0], [-.06, .99, 0], [-.05, .95, 0]], 18, 6, (t) => .01 - .006 * t));
  // the blade
  const bs = new THREE.Shape(); bs.moveTo(BLADE[0][0], BLADE[0][1]);
  for (let i = 1; i < BLADE.length; i++) { const [a, b, c] = BLADE[i]; bs.bezierCurveTo(a[0], a[1], b[0], b[1], c[0], c[1]); }
  const bg = new THREE.ExtrudeGeometry(bs, { depth: .006, bevelEnabled: true, bevelThickness: .004, bevelSize: .005, bevelSegments: 2, curveSegments: Q(30, 12) });
  bg.translate(0, 0, -.003); SCY.blade.push(bg);
 }
 for (const [k, mat] of [['wood', M.wood], ['blade', M.blade], ['fit', M.fitting], ['glow', M.glow]]) scy.add(new THREE.Mesh(mergeAll(SCY[k]), mat));
 const TIP = V3(1.38, .58, 0), BMID = V3(.74, 1.02, 0), ORB = V3(-.02, .82, 0);
 const BGLOW = [[.2, .98], [.45, 1.07], [.75, 1.06], [1.05, .97], [1.3, .72], [1.1, .85], [.82, .94], [.45, .97]].map(([x, y]) => V3(x, y, 0));

 // ---------- the great wraith: stolen flames in its ribs, and lanterns on a heavy chain round its neck ----------
 const LAMPS = [], ribFlames = [], lanterns = [];
 if (GREAT) {
  for (let i = 0; i < 22; i++) { const a = rnd() * TAU, r = .03 + rnd() * .1; ribFlames.push(V3(Math.sin(a) * r * 1.2, 1.42 + rnd() * .28 - CB.y, .03 + Math.cos(a) * r * .55)); }
  for (const p of [[.12, 1.3, .14], [-.14, 1.22, .12], [.02, 1.02, .2], [-.2, .82, .1], [.18, .76, .05], [-.02, .62, -.16]]) LAMPS.push(V3(p[0], p[1], p[2]));
  const ilink = (p, ry, rz, list, s) => { const g = new THREE.TorusGeometry(.024 * (s || 1), .0068 * (s || 1), 6, 12); g.scale(1, .62, 1); g.applyMatrix4(_m.makeRotationFromEuler(new THREE.Euler(0, ry, rz, 'YXZ'))); g.translate(p.x, p.y, p.z); list.push(g); };
  const iron = [];
  const chainAlong = (curve, n, list) => { for (let k = 0; k < n; k++) { const p = curve.getPointAt(k / n), t = curve.getTangentAt(k / n); ilink(p.clone().sub(CB), Math.atan2(t.x, t.z) + PI / 2, k % 2 ? PI / 2 : 0, list); } };
  const loop = []; for (let k = 0; k <= 40; k++) { const a = k / 40 * TAU; loop.push(V3(Math.sin(a) * .205, 1.75 + .04 * Math.cos(a + PI) + .01 * Math.sin(a * 3), Math.cos(a) * .19 + .01)); }
  chainAlong(new THREE.CatmullRomCurve3(loop, true), 38, iron);
  const drape = []; for (let k = 0; k <= 20; k++) { const a = lerp(-1.9, 1.9, k / 20); drape.push(V3(Math.sin(a) * .29, 1.62 - .1 * Math.cos(a * .82) + .02 * Math.abs(a), Math.cos(a) * .2 + .05)); }
  chainAlong(new THREE.CatmullRomCurve3(drape), 30, iron);
  chest.add(new THREE.Mesh(mergeAll(iron), M.iron));
  // three lanterns hang from the chain, each on its own pivot so it swings
  for (const [x, y, z, ph] of [[-.12, 1.64, .2, 0], [.25, 1.6, .1, 1.7], [-.06, 1.66, -.21, 3.1]]) {
   const g = new THREE.Group(); g.position.set(x, y - CB.y, z); chest.add(g);
   const ir = [], gl = [];
   for (let k = 0; k < 3; k++) ilink(V3(0, -.022 - k * .03, 0), k % 2 ? PI / 2 : 0, PI / 2, ir, .8);
   const ly = -.15, w = .042;
   for (const [bx, bz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const b2 = new THREE.BoxGeometry(.006, .1, .006); b2.translate(bx * w, ly, bz * w); ir.push(b2); }
   for (const yy of [ly + .05, ly - .05]) { const b2 = new THREE.BoxGeometry(w * 2.3, .009, w * 2.3); b2.translate(0, yy, 0); ir.push(b2); }
   const cap = new THREE.ConeGeometry(w * 1.5, .045, 4); cap.rotateY(PI / 4); cap.translate(0, ly + .077, 0); ir.push(cap);
   const hook = new THREE.TorusGeometry(.012, .004, 5, 10); hook.translate(0, ly + .105, 0); ir.push(hook);
   const glass = new THREE.BoxGeometry(w * 1.8, .088, w * 1.8); glass.translate(0, ly, 0); gl.push(glass);
   g.add(new THREE.Mesh(mergeAll(ir), M.iron), new THREE.Mesh(mergeAll(gl), M.lamp));
   lanterns.push({ g, ph, k: [{ x: 0, v: 0 }, { x: 0, v: 0 }] });
  }
 }

 // ---------- bind ----------
 base.scale.setScalar(SZ);
 root.updateMatrixWorld(true);
 const skeleton = new THREE.Skeleton(bones);
 const bodyMeshes = [];
 for (const [mat, list] of BK) { const m = new THREE.SkinnedMesh(mergeAll(list), mat); m.frustumCulled = false; base.add(m); bodyMeshes.push(m); }
 root.updateMatrixWorld(true);
 for (const m of bodyMeshes) m.bind(skeleton);

 // ---------- points: world-sized soft sprites with their own color and size ----------
 const PV = 'attribute vec4 aCol; attribute float aSize; uniform float uScale; varying vec4 vC;\nvoid main(){ vC = aCol; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = aCol.a > 0.002 ? aSize * uScale * projectionMatrix[1][1] / -mv.z : 0.0; }';
 const PF = 'uniform sampler2D uMap; varying vec4 vC;\nvoid main(){ vec4 t = texture2D(uMap, vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y)); gl_FragColor = vec4(vC.rgb * t.rgb, vC.a * t.a); }';
 const _v2 = new THREE.Vector2();
 function points(n, map, blend, order, depthTest) {
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 4), size = new Float32Array(n), g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aCol', new THREE.BufferAttribute(col, 4).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aSize', new THREE.BufferAttribute(size, 1).setUsage(THREE.DynamicDrawUsage));
  const m = new THREE.ShaderMaterial({ uniforms: { uMap: { value: map }, uScale: { value: 400 } }, vertexShader: PV, fragmentShader: PF, transparent: true, depthWrite: false, depthTest: depthTest !== false, blending: blend });
  const p = new THREE.Points(g, m); p.frustumCulled = false; p.renderOrder = order || 8;
  p.onBeforeRender = (r) => { r.getDrawingBufferSize(_v2); m.uniforms.uScale.value = _v2.y * .5; };
  return { p, pos, col, size, g, n, m, vel: new Float32Array(n * 3), life: new Float32Array(n), max: new Float32Array(n).fill(1), base: new Float32Array(n * 4), sz: new Float32Array(n * 2), drag: new Float32Array(n), up: new Float32Array(n), next: 0, live: 2 };
 }
 // glows on the body: eyes, heart, the cast orbs, the blade's halo, the casting hand, the mouth (in the body's own space)
 const GL = points(24, dotT, THREE.AdditiveBlending, 6); base.add(GL.p);
 const GI = { eyeL: 0, eyeR: 1, heartH: 2, heartC: 3, orb: 4, orbC: 7, blade: 10, gem: 18, hand: 19, mouth: 20 };
 let FL = null, FLT = null;
 if (GREAT) {
  FL = points(ribFlames.length, flameT, THREE.AdditiveBlending, 5); ribFlames.forEach((p, i) => FL.pos.set([p.x, p.y, p.z], i * 3)); chest.add(FL.p);
  FLT = points(LAMPS.length, dotT, THREE.AdditiveBlending, 9, false); pelvis.add(FLT.p); // lamplight showing through the robe
  LAMPS.forEach((p, i) => FLT.pos.set([p.x, p.y - PEL_Y, p.z], i * 3)); FLT.g.attributes.position.needsUpdate = true;
 }
 // world-space effects: soul motes, dark smoke, green smoke and fire, stolen flames
 const MO = points(320, dotT, THREE.AdditiveBlending, 8), SMK = points(80, smokeT, THREE.NormalBlending, 7), GSM = points(GREAT ? 170 : 64, smokeT, THREE.AdditiveBlending, 7);
 const FLM = GREAT ? points(220, flameT, THREE.AdditiveBlending, 8) : null;
 fx.add(MO.p, SMK.p, GSM.p); if (FLM) fx.add(FLM.p);
 function emit(P, x, y, z, vx, vy, vz, life, c, a, s0, s1, drag, up) {
  const i = P.next; P.next = (i + 1) % P.n; P.live = 2;
  P.pos[i * 3] = x; P.pos[i * 3 + 1] = y; P.pos[i * 3 + 2] = z; P.vel[i * 3] = vx; P.vel[i * 3 + 1] = vy; P.vel[i * 3 + 2] = vz;
  P.life[i] = P.max[i] = life; P.base[i * 4] = c.r; P.base[i * 4 + 1] = c.g; P.base[i * 4 + 2] = c.b; P.base[i * 4 + 3] = a; P.sz[i * 2] = s0; P.sz[i * 2 + 1] = s1; P.drag[i] = drag || 0; P.up[i] = up || 0;
 }
 function stepP(P, dt, fadeIn) { // skipped once every particle is out and cleared
  if (P.live <= 0) return;
  const pos = P.pos, vel = P.vel, col = P.col; let alive = 0;
  for (let i = 0; i < P.n; i++) {
   if (P.life[i] <= 0) { if (col[i * 4 + 3] !== 0) { col[i * 4 + 3] = 0; P.size[i] = 0; } continue; }
   alive++; P.life[i] -= dt; const age = 1 - Math.max(0, P.life[i]) / P.max[i], dr = Math.exp(-P.drag[i] * dt);
   vel[i * 3] *= dr; vel[i * 3 + 1] = vel[i * 3 + 1] * dr + P.up[i] * dt; vel[i * 3 + 2] *= dr;
   pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
   const k = Math.min(1, age / (fadeIn || .15)) * (1 - age);
   col[i * 4] = P.base[i * 4]; col[i * 4 + 1] = P.base[i * 4 + 1]; col[i * 4 + 2] = P.base[i * 4 + 2]; col[i * 4 + 3] = P.base[i * 4 + 3] * k;
   P.size[i] = lerp(P.sz[i * 2], P.sz[i * 2 + 1], age);
  }
  P.live = alive > 0 ? 2 : P.live - 1;
  P.g.attributes.position.needsUpdate = true; P.g.attributes.aCol.needsUpdate = true; P.g.attributes.aSize.needsUpdate = true;
 }
 // the weapon trail: an additive ribbon of the last blade positions
 const TRN = 16, trPos = new Float32Array(TRN * 6), trCol = new Float32Array(TRN * 6), trIdx = [];
 for (let i = 0; i < TRN - 1; i++) { const a = i * 2; trIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
 const trGeo = new THREE.BufferGeometry(); trGeo.setAttribute('position', new THREE.BufferAttribute(trPos, 3).setUsage(THREE.DynamicDrawUsage)); trGeo.setAttribute('color', new THREE.BufferAttribute(trCol, 3).setUsage(THREE.DynamicDrawUsage)); trGeo.setIndex(trIdx);
 const trail = new THREE.Mesh(trGeo, new THREE.MeshBasicMaterial(Object.assign({ vertexColors: true, side: THREE.DoubleSide }, ADD))); trail.frustumCulled = false; trail.visible = false; trail.renderOrder = 7; fx.add(trail);
 const trTip = [], trMid = []; for (let i = 0; i < TRN; i++) { trTip.push(V3()); trMid.push(V3()); }
 // its own lights: the soul-light of the heart, and the great wraith's stolen lamplight
 const soulLight = new THREE.PointLight(GLOW, 0, 4.5 * Math.sqrt(SZ) * 1.2, 2); fx.add(soulLight);
 const warmLight = GREAT ? new THREE.PointLight(WARM, 0, 10, 2) : null; if (warmLight) fx.add(warmLight);
 // the pale moth that rises out of the empty robe on defeat (a large one for the great wraith)
 const MS = GREAT ? 5 : 1.6;
 const moth = new THREE.Group(); moth.visible = false; moth.scale.setScalar(MS); fx.add(moth);
 const mothMat = { flap: { value: 0 } };
 const wingM = new THREE.MeshBasicMaterial({ map: mothT, side: THREE.DoubleSide, alphaTest: .4, transparent: true, depthWrite: true });
 wingM.onBeforeCompile = (sh) => { sh.uniforms.uFlap = mothMat.flap; sh.vertexShader = 'uniform float uFlap;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n float wrS = sign(transformed.x); transformed.y += abs(transformed.x) * sin(uFlap); transformed.x = wrS * abs(transformed.x) * cos(uFlap);'); };
 wingM.customProgramCacheKey = () => 'wraith-moth';
 {
  const P = [], UV = [], I = [];
  for (const sd of [-1, 1]) { const b = P.length / 3; for (const [x, z, u, v] of [[.004, .055, 0, 1], [.12, .055, 1, 1], [.12, -.065, 1, 0], [.004, -.065, 0, 0]]) { P.push(sd * x, 0, z); UV.push(u, v); } I.push(b, b + 1, b + 2, b, b + 2, b + 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I); g.computeVertexNormals();
  const wings = new THREE.Mesh(g, wingM); wings.renderOrder = 9; moth.add(wings);
  const prof = []; for (let i = 0; i <= 10; i++) { const t = i / 10; prof.push(new THREE.Vector2(.0001 + .007 * Math.sin(PI * Math.pow(t, .8)), (t - .5) * .05)); }
  const bodyG = new THREE.LatheGeometry(prof, 8); bodyG.rotateX(PI / 2);
  const ant = [-1, 1].map((sd) => tube([[sd * .002, .002, .024], [sd * .01, .008, .036], [sd * .016, .012, .042]], 6, 3, () => .0007));
  moth.add(new THREE.Mesh(mergeAll([bodyG, ...ant]), new THREE.MeshBasicMaterial({ color: 0xe9e0cf, transparent: true })));
 }
 const mothGlow = new THREE.Sprite(new THREE.SpriteMaterial(Object.assign({ map: dotT, color: PALE }, ADD))); mothGlow.scale.setScalar(.34); mothGlow.renderOrder = 8; moth.add(mothGlow);
 const mothMats = [wingM, moth.children[1].material, mothGlow.material];

 // ---------- poses and actions ----------
 // Poses are written for a scythe in the left hand and mirrored onto the right hand, where the sheets put it.
 // body: y lift, hov hover height, pz shift, lean, cX chest pitch, tw chest turn, sway, hp/hy/hr head pitch, turn, roll
 // scythe (in chest space): g grip position, sd shaft direction (toward the head), bd blade direction; lk the scythe hand on it,
 //   rk the free hand on it too (two-handed), rg where that hand holds along the shaft
 // arms (as written: r the free arm, l the scythe arm): f forward raise, s side raise, u upper-arm turn, e elbow, t forearm turn,
 //   w wrist, c finger curl, p finger spread
 // look: fl robe flare, glow soul-light, eye, hrt heart, trail, fade (1 solid, 0 gone), aura smoke, drop scythe falls, disB bones gone, flut cloth drift
 const MIRX = ['gx', 'sdx', 'bdx', 'tw', 'hy', 'hr', 'sway'];
 function mir(k) { const o = {}; for (const n in k) { const v = k[n]; if (/^[rl][fsuetwcp]$/.test(n)) o[(n[0] === 'r' ? 'l' : 'r') + n[1]] = v; else o[n] = MIRX.includes(n) ? -v : v; } return o; }
 const BASE = mir({ y: 0, hov: .3, pz: 0, lean: .08, cX: .12, tw: 0, sway: 0, hp: .05, hy: 0, hr: 0,
  gx: .34, gy: -.17, gz: .2, sdx: .12, sdy: 1, sdz: .02, bdx: -1, bdy: .22, bdz: -.22, lk: 1, rk: 0, rg: -.45,
  rf: .5, rs: .2, ru: 0, re: .55, rt: .3, rw: .3, rc: .5, rp: .5,
  lf: .2, ls: .15, lu: 0, le: .3, lt: 0, lw: 0, lc: 1.25, lp: 0,
  fl: 0, glow: 1, eye: 1, hrt: 1, trail: 0, fade: 1, aura: 0, drop: 0, disB: 0, flut: 1 });
 const KEYS = Object.keys(BASE);
 const GUARD = mir({ lean: .16, y: -.05, cX: .2, hp: .12, gx: .28, gy: .02, gz: .34, sdx: -1, sdy: .2, sdz: .08, bdx: .05, bdy: .75, bdz: .65, rk: 1, rg: .5, glow: 1.1, rc: 1.2 });
 const WALK = mir({ lean: .24, cX: .1, y: .04, gz: .34, sdx: .14, sdy: 1, sdz: .42, rf: -.25, rs: .2, re: .35, flut: 1.8 });
 const ACTS = {};
 const EASE = { s: (x) => x * x * (3 - 2 * x), l: (x) => x, i: (x) => x * x, o: (x) => 1 - (1 - x) * (1 - x) };
 function act(name, dur, keys, o) {
  const t = [], p = [], e = []; let prev = BASE;
  for (const [u, k, ez] of keys) { const full = Object.assign({}, prev, k === BASE ? k : mir(k)); t.push(u); p.push(full); e.push(EASE[ez || 's']); prev = full; }
  ACTS[name] = Object.assign({ dur: dur * DUR, t, p, e, hits: [], cues: [], hold: false, interrupt: false, rate: 12, snap: null, dash: null }, o || {});
 }
 function evalKeys(def, u, out) {
  const T = def.t, Pk = def.p; let i = 0; while (i < T.length - 2 && u > T[i + 1]) i++;
  const a = T[i], b = T[i + 1], s = b > a ? cl((u - a) / (b - a), 0, 1) : 1, f = def.e[i + 1](s);
  for (const k of KEYS) out[k] = lerp(Pk[i][k], Pk[i + 1][k], f);
 }
 const bump = (a, b, v) => (u) => v * sm(a, a + (b - a) * .3, u) * (1 - sm(b - (b - a) * .3, b, u));
 // Soul Reaper: a swoop and a great horizontal sweep of the scythe, both hands on the shaft
 act('sweep', 1.6, [[0, {}],
  [.14, { y: -.06, lean: .16, tw: -.2, hp: .2, gx: .32, gy: -.18, gz: .14, sdx: .35, sdy: .9, sdz: -.3, bdx: .55, bdy: .1, bdz: .82, rk: .5, rc: 1 }],
  [.3, { y: .12, lean: -.06, tw: .55, hp: -.04, gx: .1, gy: .5, gz: .06, sdx: 1, sdy: .25, sdz: -.25, bdx: 0, bdy: 1, bdz: .12, rk: 1, fl: .2, glow: 1.15 }],
  [.39, { tw: .35, lean: .1, y: .06, gx: .25, gy: .15, gz: .25, sdx: .85, sdy: -.15, sdz: .5, bdx: -.25, bdy: .6, bdz: .75, trail: 1 }, 'i'],
  [.46, { tw: -.05, lean: .18, y: -.02, gx: .18, gy: -.08, gz: .48, sdx: .45, sdy: .3, sdz: .85, bdx: -.92, bdy: .12, bdz: .4, fl: .4, glow: 1.3, rg: -.3 }, 'l'],
  [.56, { tw: -.55, lean: .16, gx: .0, gy: -.08, gz: .4, sdx: -.5, sdy: .24, sdz: .82, bdx: -.75, bdy: .1, bdz: -.65 }, 'l'],
  [.68, { tw: -.7, lean: .14, gx: -.08, gy: -.1, gz: .3, sdx: -.9, sdy: 0, sdz: .3, bdx: -.2, bdy: .1, bdz: -.95, trail: 0, fl: .2 }, 'o'],
  [.86, { tw: -.2, lean: .1, rk: 0, gx: .2, gy: -.05, gz: .3, sdx: -.2, sdy: 1, sdz: .1, bdx: .3, bdy: 0, bdz: .95, glow: 1 }],
  [1, BASE]], { hits: [.5], cues: [.42], rate: 16, dash: bump(.36, .62, 1.6) });
 // Soul Bolts: three soul-fires gather over the open free hand and are flung one by one
 act('cast', 1.6, [[0, {}],
  [.2, { rf: 1.15, rs: .5, re: .55, rt: 1.6, rw: -.2, rc: .25, rp: .7, lean: .02, hp: .08, hy: -.1, tw: -.15, glow: 1.2 }],
  [.3, { rf: 1.2, re: .45 }], [.33, { rf: 1.45, re: .15, rw: .35, lean: .1 }],
  [.41, { rf: 1.2, re: .45, rw: -.2 }], [.45, { rf: 1.45, re: .15, rw: .35 }],
  [.53, { rf: 1.2, re: .45, rw: -.2 }], [.57, { rf: 1.5, re: .1, rw: .4, lean: .14 }],
  [.75, { rf: .9, re: .6, rc: .5, glow: 1 }],
  [1, BASE]], { hits: [.35, .47, .59], rate: 14 });
 // Shadow Grasp: it rises, reaches, and closes its hand on Io, the Witch, from afar
 act('grasp', 1.8, [[0, {}],
  [.28, { y: .16, lean: -.1, hp: -.18, rf: 1.9, rs: .6, re: .5, rt: 1.2, rc: .5, rp: .8, gy: .02, gz: .22, fl: .35, glow: 1.25, aura: .3 }],
  [.44, { y: -.04, lean: .38, hp: .25, rf: 1.25, rs: .25, re: .1, rt: .3, rw: -.3, rc: .9, rp: .7, tw: -.25 }, 'i'],
  [.53, { rc: 1.55, rp: .1, re: .45, rw: .2, lean: .3 }],
  [.72, { rc: 1.6, re: .6, lean: .26, y: 0, aura: .1 }],
  [1, BASE]], { hits: [.56], cues: [.46], rate: 13 });
 // Eclipse: it rises with arms flung wide under a black sun, then hurls the dark down
 act('eclipse', 2.8, [[0, {}],
  [.22, { y: .38, lean: -.16, cX: -.05, hp: -.42, rf: .55, rs: 1.25, re: .3, rt: 2.6, rc: .3, rp: .9, gx: .4, gy: .55, gz: .1, sdx: .3, sdy: 1, sdz: -.1, bdx: -.7, bdy: .3, bdz: .6, fl: .7, glow: 1.6, hrt: 2.2, eye: 1.6, aura: 1 }],
  [.55, { y: .5, hp: -.48, fl: .8 }],
  [.65, { y: .12, lean: .45, cX: .3, hp: .4, rf: 1, rs: .35, re: .2, rc: .9, gx: .3, gy: -.05, gz: .45, sdx: .5, sdy: .2, sdz: .85, bdx: -.2, bdy: -.9, bdz: .3, fl: 1, glow: 2 }, 'i'],
  [.8, { y: .05, lean: .35, glow: 1.6, aura: .8 }],
  [1, BASE]], { hits: [.745], cues: [.04, .62], rate: 9 });
 act('appear', 1.8, [[0, { y: -.95, lean: .45, hp: .6, cX: .4, fade: 0, fl: 1, eye: 0, hrt: .3, rf: .2, rs: .5, re: .2, aura: .8 }],
  [.55, { y: .05, lean: .05, hp: -.05, cX: .1, fade: 1, fl: .4, eye: 0, hrt: 1 }],
  [.66, { eye: 2.2, glow: 1.5 }],
  [1, BASE]], { snap: ['y', 'fade', 'fl', 'lean', 'cX', 'hp', 'eye'], rate: 10 });
 // defeat is release: the robe falls empty and a pale moth rises out of it (the great wraith lets its stolen lights go too)
 act('die', 4, [[0, {}],
  [.06, { y: .1, lean: -.32, cX: -.1, hp: -.45, rf: .7, rs: 1, re: .25, rc: .2, rp: .9, glow: 1.7, hrt: 2.8, eye: 2, fl: .5 }],
  [.3, { y: -1.12, lean: .7, cX: .55, hp: .85, hr: .2, rf: .15, rs: .25, re: .15, rc: .3, lk: 0, lf: .1, ls: .2, le: .1, lc: .3, drop: 1, fl: 1.25, eye: 0, hrt: .2, disB: 1, glow: .8 }],
  [.45, { y: -1.2, fl: 1.35 }],
  [.95, { fade: 0, glow: .5 }],
  [1, { fade: 0 }]], { hold: true, interrupt: true, cues: [.26], rate: 10 });
 act('hurt', .6 / DUR, [[0, {}], [.18, { lean: -.26, cX: -.08, hp: -.35, hr: .16, rs: .65, re: .45, rc: .9, fl: .45, glow: 1.4, eye: 1.6, hrt: .5, y: .05 }], [1, BASE]],
  { interrupt: true, rate: 18, dash: (u) => (u < .35 ? -1.5 * Math.sin(PI * u / .35) : 0) });
 act('block', .45 / DUR, [[0, {}], [.3, { lean: -.06, y: -.03, cX: .05, hp: .12, gx: .24, gy: .14, gz: .36, sdx: -1, sdy: .28, sdz: .1, bdx: 0, bdy: .7, bdz: .7, rk: 1, rg: .5, glow: 1.2, rc: 1.2 }], [.7, {}], [1, BASE]],
  { interrupt: true, rate: 22, dash: (u) => (u < .35 ? -.9 * Math.sin(PI * u / .35) : 0) });
 if (GREAT) {
  // Swallowing lamplight: arms raised and hood thrown back, it drinks the lights it stole; the flames in its ribs flare
  act('swallow', 2.6, [[0, {}],
   [.18, { y: .2, lean: -.22, cX: -.12, hp: -.75, rf: 1.6, rs: .9, re: .55, rt: 1.6, rc: .55, rp: 1, gx: .38, gy: .3, gz: .12, sdx: .2, sdy: 1, sdz: .05, bdx: -1, bdy: .25, bdz: .1, fl: .35, glow: 1.15, aura: .25 }],
   [.68, { y: .25, hp: -.85, fl: .45 }],
   [.78, { y: .02, lean: .14, cX: .2, hp: .15, rf: .7, rs: .45, re: 1.1, rc: 1.3, rp: .2, fl: .6, glow: 1.5, aura: .4 }],
   [.9, { y: 0, lean: .1, hp: .08, glow: 1.2, aura: .1 }],
   [1, BASE]], { hits: [.76], cues: [.12], rate: 9 });
  // Stolen fire: it rears back, then breathes a stream of the town's stolen fire
  act('breath', 2.4, [[0, {}],
   [.2, { y: .1, lean: -.14, cX: -.08, hp: -.4, rf: .5, rs: .55, re: 1.3, rc: 1.2, fl: .25, glow: 1.15 }],
   [.32, { y: 0, lean: .32, cX: .25, hp: .28, rf: .95, rs: .35, re: .45, rc: .6, rp: .85, fl: .5, glow: 1.35 }, 'i'],
   [.72, { lean: .36, hp: .32 }],
   [.86, { lean: .16, hp: .12, glow: 1.1, fl: .2 }],
   [1, BASE]], { hits: [.46, .62], cues: [.3], rate: 11 });
 }

 // ---------- runtime ----------
 const state = { target: null, glow: 1, lights: 1 };
 const FIN = Object.assign({}, BASE), TGT = Object.assign({}, BASE);
 let actv = null, gOn = false, gW = 0, fadeE = 1, dashV = 0, liftV = 0, blinkIn = 2, blinkT = -1, lastName = '', lastU = 0;
 const fxS = { orbOut: [false, false, false], mothT: -1, mothFrom: V3(), acc: { wisp: 0, smoke: 0, aura: 0, mote: 0, warm: 0, fire: 0 }, prevTrail: 0, gulp: 0 };
 function play(name, force) {
  let def = ACTS[name]; if (!def) return false;
  const gone = FIN.fade < .02 && (!actv || actv.name === 'die');
  if (gone && name !== 'appear') { name = 'appear'; def = ACTS.appear; }
  if (actv && !force) {
   if (actv.name === 'die' && name !== 'appear') return false;
   if (!def.interrupt && !(actv.def.hold && actv.t >= actv.def.dur - 1e-6)) return false;
  }
  if (def.snap) for (const k of def.snap) FIN[k] = def.p[0][k];
  actv = { name, def, t: 0 }; fxS.orbOut = [false, false, false]; fxS.mothT = -1;
  return true;
 }
 // two-bone arm IK in world space: wrist target W, hand orientation qH, elbow pole direction
 const L1 = UA * SZ, L2 = FA * SZ;
 const _S = V3(), _E = V3(), _W = V3(), _u = V3(), _f = V3(), _x = V3(), _y = V3(), _z = V3(), _pp = V3(), _p1 = V3(), _p2 = V3(), _p3 = V3();
 const _qa = new THREE.Quaternion(), _qb = new THREE.Quaternion(), _qc = new THREE.Quaternion(), _qd = new THREE.Quaternion(), _mb = new THREE.Matrix4(), _sc = V3(), _pos = V3(), _eul = new THREE.Euler();
 const worldQ = (o, out) => { o.matrixWorld.decompose(_pos, out, _sc); return out; };
 const IKQ = { sh: new THREE.Quaternion(), el: new THREE.Quaternion(), wr: new THREE.Quaternion() };
 function solveArm(Ar, W, qH, pole) {
  Ar.sh.getWorldPosition(_S); _u.subVectors(W, _S); const dist = _u.length() || 1e-6; _u.multiplyScalar(1 / dist);
  const d = cl(dist, .05 * SZ, (L1 + L2) * .999), ca = cl((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1), sa = Math.sqrt(1 - ca * ca);
  _pp.copy(pole).addScaledVector(_u, -pole.dot(_u)); if (_pp.lengthSq() < 1e-8) _pp.set(0, -1, 0).addScaledVector(_u, _u.y); _pp.normalize();
  _E.copy(_S).addScaledVector(_u, L1 * ca).addScaledVector(_pp, L1 * sa); _W.copy(_S).addScaledVector(_u, d);
  _y.subVectors(_E, _S).normalize(); _f.subVectors(_W, _E).normalize();
  _z.copy(_f).addScaledVector(_y, -_f.dot(_y)); if (_z.lengthSq() < 1e-8) _z.copy(_pp); _z.normalize();
  _y.negate(); _x.crossVectors(_y, _z);
  _qa.setFromRotationMatrix(_mb.makeBasis(_x, _y, _z));
  const bend = Math.acos(cl(-_y.dot(_f), -1, 1));
  worldQ(Ar.sh.parent, _qb); IKQ.sh.copy(_qb.invert()).multiply(_qa);
  IKQ.el.setFromAxisAngle(XAX, -bend);
  _qc.copy(_qa).multiply(IKQ.el); IKQ.wr.copy(_qc.invert()).multiply(qH);
 }
 // the hand frame that grips a shaft along axis ax at point G, the fingers wrapping from the shoulder's side; writes qH and the wrist W
 function gripFrame(Ar, G, ax, qH, W) {
  Ar.sh.getWorldPosition(_p1); _p2.subVectors(G, _p1); _p2.addScaledVector(ax, -_p2.dot(ax));
  if (_p2.lengthSq() < 1e-8) _p2.set(0, 0, 1).addScaledVector(ax, -ax.z); _p2.normalize();
  _y.copy(_p2).negate(); _z.copy(ax); _x.crossVectors(_y, _z);
  qH.setFromRotationMatrix(_mb.makeBasis(_x, _y, _z));
  W.copy(G).addScaledVector(_x, Ar.sx * .03 * SZ).addScaledVector(_y, .07 * SZ);
 }
 const GRIP_S = V3(-SA.sx * .03, -.07, 0);
 const qScy = new THREE.Quaternion(), qH = new THREE.Quaternion(), Wt = V3(), Gt = V3(), AXs = V3(), poleV = V3();
 const DROPQ = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(V3(1, 0, -.1).normalize(), V3(.1, 0, 1).normalize(), V3(0, -1, 0))).multiply(new THREE.Quaternion().setFromAxisAngle(YAX, PI));
 const DROPP = V3(SA.sx * .42, .035, .02);
 const _ib = new THREE.Matrix4();
 function scytheFrame(P) { // the scythe's orientation in chest space, from its shaft and blade directions
  _y.set(P.sdx, P.sdy, P.sdz).normalize(); _x.set(P.bdx, P.bdy, P.bdz).addScaledVector(_y, -(_y.x * P.bdx + _y.y * P.bdy + _y.z * P.bdz));
  if (_x.lengthSq() < 1e-6) _x.set(1, 0, 0).addScaledVector(_y, -_y.x); _x.normalize(); _z.crossVectors(_x, _y);
  return _qd.setFromRotationMatrix(_mb.makeBasis(_x, _y, _z));
 }
 function poleOf(Ar, Wp) { Ar.sh.getWorldPosition(_p3); const hi = cl((Wp.y - _p3.y) / (.35 * SZ), 0, 1); worldQ(chest, _qb); return poleV.set(Ar.sx * (.7 + .3 * hi), -.7 + .5 * hi, -.45 - .2 * hi).applyQuaternion(_qb); }
 function setArm(Ar, qs, qe, qw) { Ar.sh.quaternion.copy(qs); Ar.el.quaternion.copy(qe); Ar.wr.quaternion.copy(qw); }
 const side = (Ar) => (Ar.sx < 0 ? 'r' : 'l');
 function fkArm(Ar, P) {
  const s = side(Ar), sx = Ar.sx;
  Ar.qSh.setFromEuler(_eul.set(-P[s + 'f'], -sx * P[s + 'u'], sx * P[s + 's'], 'XZY'));
  Ar.qEl.setFromEuler(_eul.set(-P[s + 'e'], 0, 0, 'XYZ'));
  Ar.qWr.setFromEuler(_eul.set(0, -sx * P[s + 't'], -sx * P[s + 'w'], 'YZX'));
 }
 function handPose(Ar, c, p) {
  Ar.fingers.forEach((F, k) => { F.f0.rotation.set([-.1, -.03, .04, .12][k] * p, 0, -Ar.sx * c * .9); F.f1.rotation.set(0, 0, -Ar.sx * c * 1.15); });
  Ar.t0.rotation.set(-.55 - p * .25, 0, -Ar.sx * (.3 + c * .45)); Ar.t1.rotation.set(0, 0, -Ar.sx * c * .55);
 }
 // springs: the robe's ring of joints billows and trails, the hood's tip lags, the sleeves and lanterns hang
 const K0 = () => ({ x: 0, v: 0 });
 const rU = ringU.map(K0), rL = ringL.map(K0), hood = [K0(), K0()];
 const st = { init: false, px: 0, pz: 0, vx: 0, vz: 0, ax: 0, az: 0, acc: 0 };
 const spring = (s, target, h, Kk, C) => { s.v += (Kk * (target - s.x) - C * s.v) * h; s.x += s.v * h; };
 const PH = 1 / 120;
 const _dn = V3(), _ql = new THREE.Quaternion(), _down = V3(0, -1, 0);

 function animate(phase, walk, t, dt) {
  dt = dt > 0 ? Math.min(dt, .05) : 0;
  walk = cl(walk || 0, 0, 1);
  let u = 0, name = '';
  if (actv) { actv.t += dt; u = Math.min(1, actv.t / actv.def.dur); name = actv.name; if (u >= 1 && !actv.def.hold) actv = null; }
  if (actv) evalKeys(actv.def, u, TGT); else Object.assign(TGT, BASE);
  gW += ((gOn && !actv ? 1 : 0) - gW) * (dt > 0 ? 1 - Math.exp(-dt * 7) : 0);
  const wk = actv ? 0 : walk;
  if (gW > 1e-3) for (const k in GUARD) TGT[k] = lerp(TGT[k], GUARD[k], gW);
  if (wk > 1e-3) for (const k in WALK) TGT[k] = lerp(TGT[k], WALK[k], wk * (1 - gW));
  const rate = actv ? actv.def.rate : 7, kk = dt > 0 ? 1 - Math.exp(-dt * rate) : 1;
  for (const q of KEYS) FIN[q] += (TGT[q] - FIN[q]) * kk;
  dashV = actv && actv.def.dash ? actv.def.dash(u) * SZ : 0;
  const P = FIN, tt = t * TS, calm = actv ? .35 : 1;
  // body
  const bob = (.05 * Math.sin(tt * 1.7) + .015 * Math.sin(tt * 3.1 + 1)) * calm;
  const rx = root.position.x, rz = root.position.z, yaw = root.rotation.y;
  if (!st.init || Math.hypot(rx - st.px, rz - st.pz) > 1.5 * SZ) { st.px = rx; st.pz = rz; st.vx = st.vz = st.ax = st.az = 0; st.init = true; }
  if (dt > 0) {
   const kv = 1 - Math.exp(-dt / .1), ka = 1 - Math.exp(-dt / .08);
   const nvx = st.vx + ((rx - st.px) / dt - st.vx) * kv, nvz = st.vz + ((rz - st.pz) / dt - st.vz) * kv;
   st.ax += ((nvx - st.vx) / dt - st.ax) * ka; st.az += ((nvz - st.vz) / dt - st.az) * ka; st.vx = nvx; st.vz = nvz;
  }
  st.px = rx; st.pz = rz;
  const cy = Math.cos(yaw), sy = Math.sin(yaw), alx = (st.ax * cy - st.az * sy) / SZ, alz = (st.ax * sy + st.az * cy) / SZ, vlz = (st.vx * sy + st.vz * cy) / SZ;
  const lean = cl(vlz * .08 + alz * .01, -.25, .3);
  pelvis.position.set(0, PEL_Y + P.hov + P.y + bob, P.pz);
  pelvis.rotation.set(P.lean * .5 + lean + .02 * Math.sin(tt * .9) * calm, P.tw * .25, P.sway * .5 + .03 * Math.sin(tt * .7) * calm);
  spine.rotation.set(P.lean * .3 + .03, P.tw * .3, P.sway * .3 - .02 * Math.sin(tt * .8) * calm);
  chest.rotation.set(P.cX + P.lean * .2, P.tw * .45, P.sway * .2);
  neck.rotation.set(P.hp * .35, P.hy * .4 + .05 * Math.sin(tt * .5) * calm, P.hr * .35);
  head.rotation.set(P.hp * .65 + .03 * Math.sin(tt * 1.3) * calm, P.hy * .6 + .07 * Math.sin(tt * .5) * calm, P.hr * .65 + .03 * Math.sin(tt * .9) * calm);
  fkArm(R, P); fkArm(L, P);
  OA.qSh.multiply(_ql.setFromEuler(_eul.set(-.04 * Math.sin(tt * 1.5 + 1) * calm, 0, -.03 * OA.sx * Math.sin(tt * 1.1) * calm)));
  setArm(R, R.qSh, R.qEl, R.qWr); setArm(L, L.qSh, L.qEl, L.qWr);
  handPose(SA, P[side(SA) + 'c'], P[side(SA) + 'p']); handPose(OA, P[side(OA) + 'c'] + .06 * Math.sin(tt * .8) * calm, P[side(OA) + 'p']);
  root.updateMatrixWorld(true);
  // the scythe: its hand holds it where the pose puts it
  worldQ(chest, _qa); qScy.copy(_qa).multiply(scytheFrame(P));
  Gt.set(P.gx, P.gy, P.gz).applyMatrix4(chest.matrixWorld); AXs.set(0, 1, 0).applyQuaternion(qScy);
  if (P.lk > .002) {
   gripFrame(SA, Gt, AXs, qH, Wt); solveArm(SA, Wt, qH, poleOf(SA, Wt));
   const k = cl(P.lk, 0, 1); SA.sh.quaternion.slerpQuaternions(SA.qSh, IKQ.sh, k); SA.el.quaternion.slerpQuaternions(SA.qEl, IKQ.el, k); SA.wr.quaternion.slerpQuaternions(SA.qWr, IKQ.wr, k);
   SA.sh.updateMatrixWorld(true);
  }
  // place the scythe at the hand, or let it fall to the cobbles
  SA.wr.localToWorld(_p1.copy(GRIP_S)); _ib.copy(base.matrixWorld).invert();
  _p1.applyMatrix4(_ib); worldQ(base, _qb); _qc.copy(_qb).invert().multiply(qScy);
  if (P.lk < .999) { worldQ(SA.wr, _qa); _qd.copy(_qb).invert().multiply(_qa).multiply(_ql.setFromEuler(_eul.set(PI / 2, 0, 0, 'XYZ'))); _qc.slerp(_qd, 1 - cl(P.lk, 0, 1)); }
  if (P.drop > .001) { const k = sm(0, 1, P.drop); _p1.lerp(DROPP, k); _p1.y += Math.sin(PI * k) * .25; _qc.slerp(DROPQ, k); }
  scy.position.copy(_p1); scy.quaternion.copy(_qc); scy.updateMatrixWorld(true);
  // two hands on the shaft
  if (P.rk > .002) {
   scy.localToWorld(_p2.set(0, P.rg, 0)); AXs.set(0, 1, 0).applyQuaternion(qScy);
   gripFrame(OA, _p2, AXs, qH, Wt); solveArm(OA, Wt, qH, poleOf(OA, Wt));
   const k = cl(P.rk, 0, 1); OA.sh.quaternion.slerpQuaternions(OA.qSh, IKQ.sh, k); OA.el.quaternion.slerpQuaternions(OA.qEl, IKQ.el, k); OA.wr.quaternion.slerpQuaternions(OA.qWr, IKQ.wr, k);
   OA.sh.updateMatrixWorld(true);
  }
  // sleeves hang from the forearm, lagging a little
  for (const Ar of arms) {
   worldQ(Ar.el, _qa); _dn.set(0, -1, 0).applyQuaternion(_qa.invert());
   const along = -_dn.y; _dn.lerp(_down, .25 * (1 - along)).normalize();
   _ql.setFromUnitVectors(_down, _dn);
   Ar.qDr.slerp(_ql, dt > 0 ? 1 - Math.exp(-dt * 9) : 1); Ar.dr.quaternion.copy(Ar.qDr);
  }
  // robe, hood and lantern springs
  const big = P.fl, swirl = name === 'eclipse' ? P.aura : 0;
  const uT = ringU.map((b, k) => { const a = (k + .5) / RK * TAU, dot = alx * Math.sin(a) + alz * Math.cos(a); return cl(.05 + .05 * Math.sin(tt * 1.3 + k * 1.7) - dot * .01 - vlz * .12 * Math.cos(a) + big * (.32 + .1 * Math.sin(tt * 5 + k)) + swirl * .1 * Math.sin(tt * 3 + k * 2), -.2, 1.25); });
  const lT = ringL.map((b, k) => { const a = (k + .5) / RK * TAU; return cl(.05 + .1 * Math.sin(tt * 1.9 + k * 2.3) - vlz * .2 * Math.cos(a) + big * (.36 + .15 * Math.sin(tt * 6 + k * 1.3)), -.25, 1.4); });
  const nSteps = Math.min(8, Math.floor((st.acc + dt) / PH)); st.acc = nSteps === 8 ? 0 : st.acc + dt - nSteps * PH;
  const pitch = P.lean + P.cX + .03 + lean;
  for (let n = 0; n < nSteps; n++) {
   for (let k = 0; k < RK; k++) { spring(rU[k], uT[k], PH, 40 * TS, 4); spring(rL[k], lT[k] + rU[k].v * .03, PH, 28 * TS, 3); }
   spring(hood[0], cl(-alz * .01, -.2, .2) + .05 * Math.sin(tt * 2), PH, 50, 4); spring(hood[1], cl(alx * .01, -.2, .2), PH, 50, 4);
   for (const ln of lanterns) { spring(ln.k[0], cl(-alz * .012 - pitch, -1.2, .6) + .05 * Math.sin(tt * 1.3 + ln.ph), PH, 16, 1.8); spring(ln.k[1], cl(alx * .012 - P.tw * .4, -.5, .5) + .05 * Math.sin(tt * 1.1 + ln.ph * 2), PH, 16, 1.8); }
  }
  for (let k = 0; k < RK; k++) { ringU[k].rotation.x = -rU[k].x; ringL[k].rotation.x = -rL[k].x; }
  hoodT.rotation.set(hood[0].x, 0, hood[1].x);
  for (const ln of lanterns) ln.g.rotation.set(ln.k[0].x, 0, ln.k[1].x);
  // only what moved since the full update above
  for (let k = 0; k < RK; k++) ringU[k].updateMatrixWorld(true);
  for (const Ar of arms) Ar.dr.updateMatrixWorld(true);
  hoodT.updateMatrixWorld(true); for (const ln of lanterns) ln.g.updateMatrixWorld(true);
  liftV = Math.max(0, (P.hov + P.y + bob) * SZ);
  // looks
  const fk = cl(P.fade, 0, 1) * fadeE, sg = state.glow === undefined ? 1 : +state.glow;
  U.time.value = tt; U.flut.value = P.flut * (1 + .5 * P.fl + .4 * P.aura);
  U.disC.value = 1 - fk; U.disB.value = Math.max(1 - fk, cl(P.disB, 0, 1)); U.disS.value = 1 - fk;
  if (dt > 0) { blinkIn -= dt; if (blinkIn <= 0 && blinkT < 0) { blinkT = 0; blinkIn = 2.5 + rnd() * 4; } }
  let bk = 0; if (blinkT >= 0) { blinkT += dt; const kb = blinkT / .16; bk = kb < 1 ? Math.sin(PI * kb) : 0; if (kb >= 1) blinkT = -1; }
  const ek = cl(P.eye, 0, 3) * fk, flick = .88 + .12 * Math.sin(t * 9.3) * Math.sin(t * 5.1);
  eyes.scale.set(1 + .15 * Math.max(0, P.eye - 1), Math.max(.08, 1 - bk * .9), 1); eyes.visible = ek > .02;
  M.eye.color.copy(GLOW).lerp(C1.setRGB(1, 1, 1), .45).multiplyScalar(Math.min(1.4, .4 + .6 * ek));
  const hb = (.85 + .15 * Math.sin(t * 3.3) + .08 * Math.sin(t * 7.7)) * P.hrt * fk * sg * (GREAT ? .55 : 1);
  heart.scale.set(.9 + .2 * hb, .9 + .2 * hb + .04 * Math.sin(t * 11), .9 + .2 * hb); heart.visible = hb > .01;
  M.heart.opacity = cl(.4 + .4 * hb, 0, 1);
  M.cloth.emissiveIntensity = 1.2 * GK * sg * (.75 + .25 * P.glow) * (.55 + .45 * fk);
  U.rim.value = .3 * (.75 + .25 * P.glow);
  updateFX(name, u, t, dt, fk, sg, ek * flick, hb);
  lastName = name; lastU = u;
 }

 // ---------- effects ----------
 const _a = V3(), _b = V3(), _c = V3(), _w = V3(), FWD = V3();
 const setG = (i, p, c, a, s) => { GL.pos[i * 3] = p.x; GL.pos[i * 3 + 1] = p.y; GL.pos[i * 3 + 2] = p.z; GL.col[i * 4] = c.r; GL.col[i * 4 + 1] = c.g; GL.col[i * 4 + 2] = c.b; GL.col[i * 4 + 3] = a; GL.size[i] = s; };
 const toBase = (v) => v.applyMatrix4(_ib);
 const orbPos = [V3(), V3(), V3()], orbW = [V3(), V3(), V3()];
 const C1 = new THREE.Color();
 const mouthW = (out) => head.localToWorld(out.set(0, -.025, .17));
 function heartW(out) { return chest.localToWorld(out.set(0, 1.535 - CB.y, .04)); }
 function updateFX(name, u, t, dt, fk, sg, ek, hb) {
  _ib.copy(base.matrixWorld).invert();
  FWD.set(Math.sin(root.rotation.y), 0, Math.cos(root.rotation.y));
  // eyes and heart
  const es = .13 * (1 + .25 * Math.max(0, ek - 1)) * SZ;
  head.localToWorld(_a.set(.05, .008, .205)); setG(GI.eyeL, toBase(_a), GLOW, Math.min(1, .8 * ek), es);
  head.localToWorld(_a.set(-.05, .008, .205)); setG(GI.eyeR, toBase(_a), GLOW, Math.min(1, .8 * ek), es);
  heartW(_a).addScaledVector(FWD, .012 * SZ); toBase(_a);
  setG(GI.heartH, _a, GLOW, cl(.42 * hb, 0, 1), (.42 + .12 * hb) * SZ); setG(GI.heartC, _a, CORE, cl(.55 * hb, 0, 1), .15 * SZ);
  // the cast orbs gather above the open free hand, and leave it one by one
  const casting = name === 'cast', hits = ACTS.cast.hits;
  OA.wr.localToWorld(_b.set(-OA.sx * .04, -.1, .02));
  for (let k = 0; k < 3; k++) {
   const form = casting ? sm(.08 + .06 * k, .2 + .06 * k, u) : 0, out = casting && u >= hits[k];
   if (casting && out && !fxS.orbOut[k]) { fxS.orbOut[k] = true; for (let i = 0; i < 16; i++) emit(MO, orbW[k].x, orbW[k].y, orbW[k].z, (rnd() - .5) * 1.4 * SZ, (rnd() - .2) * 1.2 * SZ, (rnd() - .5) * 1.4 * SZ, .45, GLOW, .9, .05 * SZ, .01 * SZ, 3); }
   const a = t * 3.2 + k * TAU / 3, on = form > 0 && !out;
   orbW[k].set(_b.x + Math.cos(a) * .13 * SZ, _b.y + (.16 + .03 * Math.sin(t * 5 + k)) * SZ, _b.z + Math.sin(a) * .13 * SZ);
   orbPos[k].copy(orbW[k]); toBase(orbPos[k]);
   setG(GI.orb + k, orbPos[k], GLOW, on ? .9 * form : 0, .26 * form * SZ); setG(GI.orbC + k, orbPos[k], CORE, on ? form : 0, .1 * form * SZ);
   if (on && rnd() < .5) emit(MO, orbW[k].x, orbW[k].y, orbW[k].z, (rnd() - .5) * .2 * SZ, .3 * SZ, (rnd() - .5) * .2 * SZ, .5, GLOW, .7, .04 * SZ, .01 * SZ, 2);
  }
  const handK = casting ? .6 * sm(.05, .2, u) * (1 - sm(.62, .8, u)) : name === 'grasp' ? sm(.2, .4, u) * (1 - sm(.7, .9, u)) : 0;
  OA.wr.localToWorld(_a.set(-OA.sx * .03, -.09, .01)); setG(GI.hand, toBase(_a), GLOW, .55 * handK, .3 * SZ);
  // a halo along the glowing blade, and the eye in the scythe's head
  const bladeK = fk * sg * (.6 + .2 * FIN.glow + .5 * FIN.trail);
  for (let i = 0; i < 8; i++) { scy.localToWorld(_a.copy(BGLOW[i])); setG(GI.blade + i, toBase(_a), GLOW, .22 * bladeK, .2 * SZ); }
  scy.localToWorld(_a.copy(ORB)); setG(GI.gem, toBase(_a), GLOW, .7 * bladeK, .16 * SZ);
  // the stolen fire in its mouth
  const mouthK = name === 'breath' ? win(u, .26, .76, .04) : name === 'swallow' ? win(u, .12, .74, .04) * .6 : 0;
  mouthW(_a); setG(GI.mouth, toBase(_a), WARM, .8 * mouthK, .45 * SZ);
  GL.g.attributes.position.needsUpdate = true; GL.g.attributes.aCol.needsUpdate = true; GL.g.attributes.aSize.needsUpdate = true;
  // the soul-light
  chest.localToWorld(_w.set(0, 1.505 - CB.y, .42));
  soulLight.position.copy(_w); soulLight.intensity = .95 * GK * sg * (.5 + .5 * hb) * fk;
  // the weapon trail
  const trK = FIN.trail * fk;
  if (trK > .01) {
   scy.localToWorld(_a.copy(TIP)); scy.localToWorld(_b.copy(BMID));
   if (fxS.prevTrail <= .01) for (let i = 0; i < TRN; i++) { trTip[i].copy(_a); trMid[i].copy(_b); }
   for (let i = TRN - 1; i > 0; i--) { trTip[i].copy(trTip[i - 1]); trMid[i].copy(trMid[i - 1]); }
   trTip[0].copy(_a); trMid[0].copy(_b);
   for (let i = 0; i < TRN; i++) { const k = trK * Math.pow(1 - i / (TRN - 1), 2) * .9; trPos.set([trTip[i].x, trTip[i].y, trTip[i].z, trMid[i].x, trMid[i].y, trMid[i].z], i * 6); trCol.set([CORE.r * k * .8, CORE.g * k * .8, CORE.b * k * .8, GLOW.r * k * .15, GLOW.g * k * .15, GLOW.b * k * .15], i * 6); }
   trGeo.attributes.position.needsUpdate = true; trGeo.attributes.color.needsUpdate = true;
  }
  trail.visible = trK > .01; fxS.prevTrail = trK;
  if (name === 'sweep' && lastName === 'sweep' && lastU < ACTS.sweep.hits[0] && u >= ACTS.sweep.hits[0]) for (let i = 0; i < 40; i++) { scy.localToWorld(_a.copy(BMID).lerp(TIP, rnd())); emit(MO, _a.x, _a.y, _a.z, (rnd() - .5) * 2.4 * SZ, (rnd() - .3) * 1.6 * SZ, (rnd() - .5) * 2.4 * SZ, .5 + rnd() * .3, rnd() < .5 ? GLOW : CORE, 1, .07 * SZ, .01 * SZ, 3); }
  // wisps and smoke drifting off the torn hem
  const lvl = 1 + TIER, amb = fk * (name === 'die' ? 1 - sm(.3, .6, u) : 1);
  fxS.acc.wisp += dt * 22 * lvl * amb; fxS.acc.smoke += dt * 7 * lvl * amb;
  while (fxS.acc.wisp >= 1) { fxS.acc.wisp -= 1; const k = (rnd() * RK) | 0; ringL[k].localToWorld(_a.set((rnd() - .5) * .2, -.25 - rnd() * .55, .06 + rnd() * .08)); emit(MO, _a.x, _a.y, _a.z, (rnd() - .5) * .12 * SZ, (.25 + rnd() * .35) * SZ, (rnd() - .5) * .12 * SZ, 1.2 + rnd() * .8, GLOW, .75, .07 * SZ, .02 * SZ, .6); }
  while (fxS.acc.smoke >= 1) { fxS.acc.smoke -= 1; const k = (rnd() * RK) | 0; ringL[k].localToWorld(_a.set((rnd() - .5) * .3, -.35 - rnd() * .5, .1)); emit(SMK, _a.x, _a.y, _a.z, (rnd() - .5) * .15 * SZ, (.08 + rnd() * .12) * SZ, (rnd() - .5) * .15 * SZ, 2.2 + rnd(), C1.setRGB(.035, .028, .05), .55, .3 * SZ, .8 * SZ, .5); }
  // the dark aura of Eclipse, Shadow Grasp and Appear
  const auraK = cl(FIN.aura, 0, 1.2) * fk + (name === 'appear' ? .6 * (1 - sm(.4, .7, u)) : 0);
  fxS.acc.aura += dt * 36 * auraK;
  while (fxS.acc.aura >= 1) {
   fxS.acc.aura -= 1; const a = rnd() * TAU, r = (.45 + rnd() * .4) * SZ, y = (.2 + rnd() * 1.9) * SZ * .85;
   _a.set(root.position.x + Math.sin(a) * r, y, root.position.z + Math.cos(a) * r);
   if (rnd() < .55) emit(GSM, _a.x, _a.y, _a.z, Math.sin(a) * .3 * SZ, (.2 + rnd() * .3) * SZ, Math.cos(a) * .3 * SZ, 1.4 + rnd() * .6, C1.copy(GLOW).multiplyScalar(.6), .32, .5 * SZ, 1.1 * SZ, .8);
   else emit(SMK, _a.x, _a.y, _a.z, Math.sin(a) * .25 * SZ, (.15 + rnd() * .25) * SZ, Math.cos(a) * .25 * SZ, 1.6 + rnd() * .6, C1.setRGB(.02, .03, .03), .6, .45 * SZ, 1.1 * SZ, .7);
  }
  if (name === 'grasp' && u > .25 && u < .75) { OA.wr.localToWorld(_a.set(-OA.sx * .03, -.1, .02)); for (let i = 0; i < 2; i++) emit(GSM, _a.x, _a.y, _a.z, FWD.x * .5 * SZ + (rnd() - .5) * .3, (rnd() - .3) * .3, FWD.z * .5 * SZ + (rnd() - .5) * .3, .8, C1.copy(GLOW).multiplyScalar(.45), .5, .12 * SZ, .5 * SZ, 1.5); }
  if (name === 'appear' && u < .55) { fxS.acc.mote += dt * 140; while (fxS.acc.mote >= 1) { fxS.acc.mote -= 1; const a = rnd() * TAU, r = (1.2 + rnd()) * SZ; _a.set(root.position.x + Math.sin(a) * r, (.3 + rnd() * 1.8) * SZ * .85, root.position.z + Math.cos(a) * r); chest.getWorldPosition(_b); emit(MO, _a.x, _a.y, _a.z, (_b.x - _a.x) * 1.9, (_b.y - _a.y) * 1.9, (_b.z - _a.z) * 1.9, .5, GLOW, .9, .06 * SZ, .02 * SZ, 0); } }
  if (name === 'hurt' && lastName !== 'hurt') { chest.localToWorld(_a.set(0, -.05, .1)); for (let i = 0; i < 24; i++) emit(MO, _a.x, _a.y, _a.z, (rnd() - .5) * 2 * SZ, (rnd() - .3) * 1.5 * SZ, (rnd() - .5) * 2 * SZ, .45, GLOW, .9, .06 * SZ, .01 * SZ, 3); }
  // the great wraith's stolen fire: drunk in from all round, breathed out at the target, and let go on defeat
  if (FLM) {
   const lit = cl(state.lights === undefined ? 1 : +state.lights, 0, 1);
   if (name === 'swallow') {
    const on = win(u, .12, .72, .03); mouthW(_b);
    fxS.acc.fire += dt * 130 * on;
    while (fxS.acc.fire >= 1) { fxS.acc.fire -= 1; const a = rnd() * TAU, e = .2 + rnd() * 1.1, r = (1.4 + rnd()) * SZ; _a.set(_b.x + Math.cos(a) * Math.cos(e) * r, _b.y + Math.sin(e) * r * .8, _b.z + Math.sin(a) * Math.cos(e) * r); const tm = .55 + rnd() * .3; emit(FLM, _a.x, _a.y, _a.z, (_b.x - _a.x) / tm, (_b.y - _a.y) / tm, (_b.z - _a.z) / tm, tm, C1.setRGB(1, .8 + .2 * rnd(), .6), 1, .17 * SZ, .05 * SZ, 0); }
    if (lastName === 'swallow' && lastU < ACTS.swallow.hits[0] && u >= ACTS.swallow.hits[0]) fxS.gulp = 1;
   }
   if (name === 'breath') {
    const on = win(u, .3, .74, .03); mouthW(_a);
    const tg = state.target; if (tg) _b.set(tg.x, tg.y, tg.z); else _b.copy(_a).addScaledVector(FWD, 4 * SZ);
    _c.subVectors(_b, _a); const dist = _c.length() || 1; _c.multiplyScalar(1 / dist);
    fxS.acc.fire += dt * 200 * on;
    while (fxS.acc.fire >= 1) {
     fxS.acc.fire -= 1; const sp = dist / .5 * (.75 + .5 * rnd()), jx = (rnd() - .5) * .32 * sp, jy = (rnd() - .3) * .22 * sp, jz = (rnd() - .5) * .32 * sp;
     if (rnd() < .6) emit(GSM, _a.x, _a.y, _a.z, _c.x * sp + jx, _c.y * sp + jy, _c.z * sp + jz, .55 + rnd() * .25, C1.setRGB(1, .55 + .35 * rnd(), .18), .6, .2 * SZ, 1 * SZ, 1.2, .8);
     else emit(FLM, _a.x, _a.y, _a.z, _c.x * sp + jx, _c.y * sp + jy, _c.z * sp + jz, .5 + rnd() * .3, C1.setRGB(1, .9, .7), 1, .15 * SZ, .07 * SZ, 1, .4);
    }
   }
   if (name === 'die' && u > .2 && u < .72) { // the stolen lights stream out and away
    fxS.acc.warm += dt * 110 * lit * win(u, .22, .7, .05);
    while (fxS.acc.warm >= 1) {
     fxS.acc.warm -= 1; if (rnd() < .45) chest.localToWorld(_a.copy(ribFlames[(rnd() * ribFlames.length) | 0])); else base.localToWorld(_a.copy(LAMPS[(rnd() * LAMPS.length) | 0]));
     const a = rnd() * TAU, out = (.4 + rnd() * .9) * SZ * .5;
     emit(FLM, _a.x, _a.y, _a.z, Math.sin(a) * out, (.8 + rnd() * 1.2) * SZ * .5, Math.cos(a) * out, 2.2 + rnd() * 1.2, C1.setRGB(1, .85 + .15 * rnd(), .7), 1, .12 * SZ, .05 * SZ, .3, .25);
    }
   }
   stepP(FLM, dt, .1);
  } else if (name === 'die') { // the plain wraith's bones crumble into motes
   const crumble = win(u, .08, .3, .03);
   fxS.acc.mote += dt * 260 * crumble;
   while (fxS.acc.mote >= 1) { fxS.acc.mote -= 1; const src = rnd(); if (src < .5) chest.localToWorld(_a.set((rnd() - .5) * .28, (rnd() - .5) * .3, .02 + rnd() * .1)); else (src < .75 ? R : L).wr.localToWorld(_a.set(0, -.08 * rnd(), 0)); emit(MO, _a.x, _a.y, _a.z, (rnd() - .5) * .3 * SZ, (.3 + rnd() * .5) * SZ, (rnd() - .5) * .3 * SZ, .9 + rnd() * .5, rnd() < .7 ? GLOW : CORE, .85, .06 * SZ, .015 * SZ, 1); }
  }
  // the moth: it leaves the heart, flutters up out of the robe, and fades at the top
  if (name === 'die' && u >= ACTS.die.cues[0] && fxS.mothT < 0) { fxS.mothT = 0; heartW(_c); fxS.mothFrom.copy(_c); for (let i = 0; i < 40; i++) emit(MO, _c.x, _c.y, _c.z, (rnd() - .5) * 1.2 * SZ, (rnd() - .2) * 1.2 * SZ, (rnd() - .5) * 1.2 * SZ, .8, PALE, .9, .07 * SZ, .01 * SZ, 2.5); }
  if (fxS.mothT >= 0 && name === 'die') {
   fxS.mothT += dt; const tm = fxS.mothT, from = fxS.mothFrom, Am = GREAT ? 1 : .3, rise = GREAT ? 1.5 : .62, hz = GREAT ? 3.2 : 6.5;
   mothMat.flap.value = .2 + .95 * (.5 + .5 * Math.sin(tm * TAU * hz));
   moth.position.set(from.x + (Math.sin(tm * 1.7) + Math.sin(tm * 4.3) * .18) * Am + FWD.x * tm * .1 * Am, from.y + tm * rise * (1 + .2 * tm) + .05 * MS * Math.sin(tm * TAU * hz + 1), from.z + (Math.cos(tm * 1.3) - 1) * .75 * Am + FWD.z * tm * .1 * Am);
   moth.rotation.set(-.55 + .1 * Math.sin(tm * 3), tm * .9 + root.rotation.y, .15 * Math.sin(tm * 2.3), 'YXZ');
   const a = sm(0, .35, tm) * (1 - sm(.86, 1, u)); moth.visible = a > .003;
   for (const m of mothMats) m.opacity = a;
   mothGlow.material.opacity = .55 * a * (.8 + .2 * Math.sin(tm * 9));
   if (rnd() < .5) emit(MO, moth.position.x, moth.position.y, moth.position.z, (rnd() - .5) * .1, -.15, (rnd() - .5) * .1, .8, PALE, .6 * a, .035 * MS, .005, 1);
  } else moth.visible = false;
  // the great wraith's stolen flames and their light through the robe
  if (GREAT) {
   const lit = cl(state.lights === undefined ? 1 : +state.lights, 0, 1), nOn = Math.round(lit * FL.n), dieK = name === 'die' ? 1 - sm(.22, .55, u) : 1;
   fxS.gulp = Math.max(0, fxS.gulp - dt * 1.2);
   const flare = 1 + 1.4 * fxS.gulp + (name === 'breath' ? .5 * win(u, .25, .75, .05) : 0);
   for (let i = 0; i < FL.n; i++) { const f = .75 + .25 * Math.sin(t * (7 + i % 5) + i * 1.7) * Math.sin(t * (3.1 + i % 3) + i); FL.col[i * 4] = 1; FL.col[i * 4 + 1] = 1; FL.col[i * 4 + 2] = 1; FL.col[i * 4 + 3] = i < nOn ? Math.min(1, f * fk * dieK * (.8 + .2 * flare)) : 0; FL.size[i] = (.08 + .03 * (i % 3)) * (.85 + .3 * f) * SZ * (.8 + .2 * flare); }
   FL.g.attributes.aCol.needsUpdate = true; FL.g.attributes.aSize.needsUpdate = true;
   let warmSum = 0;
   LAMPS.forEach((p, i) => { const f = (.7 + .3 * Math.sin(t * (5.3 + i) + i * 2.1) * Math.sin(t * 2.7 + i)) * lit * fk * dieK * flare; U.lamp.value[i].set(p.x, p.y, p.z, .38 * f); warmSum += f; FLT.col.set([WARM.r, WARM.g, WARM.b, .14 * f], i * 4); FLT.size[i] = .5 * SZ; });
   FLT.g.attributes.aCol.needsUpdate = true; FLT.g.attributes.aSize.needsUpdate = true;
   U.flameK.value = lit * fk * dieK * (.8 + .2 * flare);
   M.lamp.color.copy(WARM).lerp(C1.setRGB(1, 1, 1), .12).multiplyScalar(lit * dieK * (.6 + .4 * Math.min(1.5, flare)) * (.9 + .1 * Math.sin(t * 7)));
   if (name === 'breath' && mouthK > 0) mouthW(warmLight.position); else chest.localToWorld(warmLight.position.set(0, -.05, .55));
   warmLight.intensity = .8 * (.4 + .6 * warmSum / LAMPS.length) * fk * dieK + 2.5 * mouthK * (name === 'breath' ? 1 : 0);
  }
  stepP(MO, dt); stepP(SMK, dt, .3); stepP(GSM, dt, .25);
 }

 // ---------- interface ----------
 const ACTIONS = {};
 for (const n in ACTS) { const d = ACTS[n]; ACTIONS[n] = Object.freeze({ dur: d.dur, hits: d.hits.slice(), cues: d.cues.slice(), hold: d.hold, interrupt: d.interrupt }); }
 Object.freeze(ACTIONS);
 function anchor(name, out) {
  out = out || V3();
  switch (name) {
   case 'hit': case 'tip': return scy.localToWorld(out.copy(TIP));
   case 'blade': return scy.localToWorld(out.copy(BMID));
   case 'hand': case 'grasp': return OA.wr.localToWorld(out.set(-OA.sx * .03, -.09, .01));
   case 'heart': return heartW(out);
   case 'head': return head.localToWorld(out.set(0, .01, .1));
   case 'mouth': return mouthW(out);
   case 'bolt': { const k = fxS.orbOut.indexOf(false); return k >= 0 && actv && actv.name === 'cast' ? out.copy(orbW[k]) : OA.wr.localToWorld(out.set(-OA.sx * .03, -.09, .01)); }
   case 'sun': return root.localToWorld(GREAT ? out.set(1.0 * SZ, 2.1 * SZ, .25 * SZ) : out.set(0, 3.2 * SZ / K, .2 * SZ)); // the great wraith's beside its head, in frame
   case 'moth': return out.copy(moth.visible ? moth.position : heartW(out));
   default: return chest.localToWorld(out.set(0, 0, .14));
  }
 }
 animate(0, 0, 0, 0);
 let tri = 0, draws = 0, nb = 0; const texs = new Set();
 root.traverse((o) => { if (o.isBone) nb++; if (o.isMesh || o.isPoints) { draws++; if (o.isMesh) tri += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; for (const k of ['map', 'emissiveMap']) if (o.material[k]) texs.add(o.material[k].image); } });
 return {
  root, fx, animate, play, ACTIONS, anchor,
  guard(on) { gOn = !!on; },
  reset() { actv = null; gOn = false; gW = 0; Object.assign(FIN, BASE); fxS.mothT = -1; moth.visible = false; },
  get busy() { return !!actv && !(actv.def.hold && actv.t >= actv.def.dur - 1e-6); },
  get action() { return actv ? actv.name : ''; },
  get progress() { return actv ? Math.min(1, actv.t / actv.def.dur) : -1; },
  get dash() { return dashV; }, get lift() { return liftV; },
  get state() { return state; }, set state(v) { if (v) Object.assign(state, v); },
  setFade(f) { fadeE = cl(+f, 0, 1); },
  get gone() { return FIN.fade < .02 && !!actv && actv.name === 'die'; },
  height: 2.45 * SZ, great: GREAT, level: LEVEL,
  stats: { triangles: Math.round(tri), drawCalls: draws, textures: texs.size, bones: nb }
 };
}
