// final-fire.js: "The fire that would not end" (stand-in name), the final foe of Moon Faire, in its two forms.
// three.js r128 (global THREE). Defines makeFinalFire(opts) only. Built from Chris's pictures of November 15, 2026
// (ref/final-fire-form1-sheet.png, ref/final-fire-form2-sheet.png, ref/final-fire-both-forms.png).
//
// Form one, the fire, whole: a black sphere like an eclipse in an even corona of flame blades, three gold rings turning
// round it, a rose curtain hanging into a thorn-rimmed iron bowl on four legs, the keeper's two iron hands either side,
// and four lit fair lanterns on crooks on the bowl's rim. About 8 m tall. It shows no damage, whatever is done to it.
// The final form, the fire, broken open: the sphere in shards round a white-hot heart with one small candle flame at
// its centre, a wild uneven corona, the rings snapped into six arcs, the curtain turned to ribbons of flame, the bowl
// split in two, one hand come apart into loose blades and the other held under the heart, the lanterns dark.
// About 12 m tall. Both forms are the same parts, so they cost the same to draw.
//
// Units are metres, Y up. It faces +Z: the party stands in front of it. It does not walk.
// Everything moves as plain functions of time (no skeleton). Moves: idle, blow, call, hurt, change (form one into the
// final form), ending (ending holds; reset() starts again in form one).
// opts: { detail 0.5 to 1, form 1 or 2 }
function makeFinalFire(opts) {
 'use strict';
 opts = opts || {};
 const DET = Math.max(.5, Math.min(1, opts.detail === undefined ? 1 : +opts.detail || 1));
 const Q = (n, m) => Math.max(m || 3, Math.round(n * DET));
 const TAU = Math.PI * 2, PI = Math.PI;
 let seed = 77017;
 const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
 const cl = (v, a, b) => (v < a ? a : v > b ? b : v);
 const sm = (a, b, x) => { const t = cl((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
 const lerp = (a, b, t) => a + (b - a) * t;
 const win = (u, a, b, e) => sm(a - e, a + e, u) * (1 - sm(b - e, b + e, u));
 const wrapA = (a) => Math.atan2(Math.sin(a), Math.cos(a));
 const V3 = (x, y, z) => new THREE.Vector3(x || 0, y || 0, z || 0);
 const QT = () => new THREE.Quaternion();
 const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
 const tex = (c) => { const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t; };
 const XAX = V3(1, 0, 0), YAX = V3(0, 1, 0), ZAX = V3(0, 0, 1), ONE = V3(1, 1, 1), ZERO = V3(0, 0, 0);
 const EUL = (x, y, z) => QT().setFromEuler(new THREE.Euler(x, y, z, 'ZYX'));       // x first, then y, then z
 const mk = (x, y, z, rx, ry, rz, s) => new THREE.Matrix4().compose(V3(x, y, z), QT().setFromEuler(new THREE.Euler(rx || 0, ry || 0, rz || 0)), s ? V3(s, s, s) : ONE);

 // ---------- sizes and colours ----------
 const SC1 = 6.1, SC2 = 7.9;            // the height of its centre in form one and in the final form
 const SR = .9;                         // the eclipse's radius
 const RS2 = 1.9, HEART = 1.5;        // the final form: how far out the shards hang, and the heart's radius
 const CRIM = new THREE.Color(0xd42a48), HOT = new THREE.Color(0xff1f3d), ROSE = new THREE.Color(0xffc9d2), PINK = new THREE.Color(0xf08fa6);
 const AMB = new THREE.Color(0xffb768), WARM = new THREE.Color(0xff9c52), WHITE = new THREE.Color(0xffffff), ASH = new THREE.Color(0x6e6770), C1 = new THREE.Color();
 const IRON_D = new THREE.Color(0x241a1b), IRON_M = new THREE.Color(0x4a332c), IRON_L = new THREE.Color(0x7a5340), GOLD = new THREE.Color(0x8f7030);

 const root = new THREE.Group(); root.name = 'FinalFire';
 const fx = new THREE.Group(); fx.name = 'FinalFireFX';      // world-space sparks and embers

 // ---------- painted textures ----------
 function radial(stops, s) { const c = cvs(s, s), g = c.getContext('2d'), h = s / 2, gr = g.createRadialGradient(h, h, 0, h, h, h); for (const [o, col] of stops) gr.addColorStop(o, col); g.fillStyle = gr; g.fillRect(0, 0, s, s); return tex(c); }
 const dotT = radial([[0, 'rgba(255,255,255,1)'], [.25, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']], 64);
 // the eclipse's rim: dark inside, a thin rose-white ring at the sphere's edge, then a crimson haze
 const rimT = radial([[0, 'rgba(0,0,0,0)'], [.44, 'rgba(255,201,210,0)'], [.468, 'rgba(255,240,244,1)'], [.492, 'rgba(255,190,204,.85)'], [.54, 'rgba(226,52,84,.5)'], [.72, 'rgba(212,42,72,.15)'], [1, 'rgba(212,42,72,0)']], 512);
 // a warm flame: for the lanterns, the candle in the heart and the last small fire
 const flameT = (() => { const c = cvs(64, 64), g = c.getContext('2d'); g.translate(32, 42); for (const [s, col] of [[1, 'rgba(255,140,60,.5)'], [.72, 'rgba(255,183,104,.85)'], [.46, 'rgba(255,226,170,1)'], [.24, 'rgba(255,250,236,1)']]) { g.fillStyle = col; g.beginPath(); g.moveTo(0, -32 * s); g.bezierCurveTo(9 * s, -15 * s, 13 * s, 2 * s, 0, 14 * s); g.bezierCurveTo(-13 * s, 2 * s, -9 * s, -15 * s, 0, -32 * s); g.fill(); } return tex(c); })();
 // the glow in the bowl
 const coalT = (() => {
  const c = cvs(256, 256), g = c.getContext('2d'), gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, 'rgba(255,190,200,1)'); gr.addColorStop(.35, 'rgba(255,110,130,.85)'); gr.addColorStop(.8, 'rgba(160,30,55,.4)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 70; i++) { const a = rnd() * TAU, r = Math.sqrt(rnd()) * 100, x = 128 + Math.cos(a) * r, y = 128 + Math.sin(a) * r, s = 3 + rnd() * 7, q = g.createRadialGradient(x, y, 0, x, y, s); q.addColorStop(0, 'rgba(255,240,240,.8)'); q.addColorStop(1, 'rgba(255,200,210,0)'); g.fillStyle = q; g.fillRect(x - s, y - s, s * 2, s * 2); }
  return tex(c);
 })();
 // hammered iron, pale so each piece's own colour tints it
 const ironMap = (() => {
  const c = cvs(256, 256), g = c.getContext('2d'); g.fillStyle = '#cfc6c0'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 520; i++) { const x = rnd() * 256, y = rnd() * 256, s = 3 + rnd() * 12, q = g.createRadialGradient(x, y, 0, x, y, s); q.addColorStop(0, rnd() < .45 ? 'rgba(255,246,236,.28)' : 'rgba(40,26,22,.3)'); q.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = q; g.fillRect(x - s, y - s, s * 2, s * 2); }
  g.lineCap = 'round'; for (let i = 0; i < 90; i++) { const x = rnd() * 256, y = rnd() * 256; g.strokeStyle = rnd() < .5 ? 'rgba(30,18,14,.3)' : 'rgba(255,240,220,.2)'; g.lineWidth = 1 + rnd(); g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - .5) * 30, y + (rnd() - .5) * 14); g.stroke(); }
  const t = tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
 })();
 // the heart's veins: bright cracks on grey, wrapped round the heart
 const veinT = (() => {
  const c = cvs(256, 128), g = c.getContext('2d'); g.fillStyle = '#3a3a3a'; g.fillRect(0, 0, 256, 128); g.lineCap = 'round'; g.shadowColor = '#fff'; g.shadowBlur = 5;
  for (let i = 0; i < 46; i++) { let x = rnd() * 256, y = rnd() * 128, a = rnd() * TAU; g.strokeStyle = 'rgba(255,255,255,' + (.5 + rnd() * .5) + ')'; g.lineWidth = .8 + rnd() * 2; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 7; k++) { a += (rnd() - .5) * 1.6; x += Math.cos(a) * (6 + rnd() * 12); y += Math.sin(a) * (6 + rnd() * 12); g.lineTo(x, y); } g.stroke(); }
  const t = tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
 })();

 // ---------- merged meshes whose pieces move: each piece has a part number, and each frame a part's vertices are moved by its matrix ----------
 const mats = [];
 const newPart = () => { mats.push(new THREE.Matrix4()); return mats.length - 1; };
 function Builder() { return { pos: [], uv: [], col: [], idx: [], part: [], nv: 0 }; }
 function addG(B, g, m, col, part) {
  if (m) g.applyMatrix4(m);
  const p = g.attributes.position, uv = g.attributes.uv, n = p.count, base = B.nv, u0 = rnd(), v0 = rnd();
  for (let i = 0; i < n; i++) { B.pos.push(p.getX(i), p.getY(i), p.getZ(i)); B.uv.push(u0 + (uv ? uv.getX(i) : .5) * .5, v0 + (uv ? uv.getY(i) : .5) * .5); B.col.push(col.r, col.g, col.b); B.part.push(part); }
  if (g.index) { const a = g.index.array; for (let i = 0; i < a.length; i++) B.idx.push(a[i] + base); } else for (let i = 0; i < n; i++) B.idx.push(base + i);
  B.nv += n; g.dispose();
 }
 function finish(B, mat, name) {
  const g = new THREE.BufferGeometry(), pos = new Float32Array(B.pos);
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(B.uv, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(B.col, 3));
  g.setIndex(B.nv > 65535 ? new THREE.Uint32BufferAttribute(B.idx, 1) : new THREE.Uint16BufferAttribute(B.idx, 1));
  g.computeVertexNormals();
  const lists = {}; B.part.forEach((p, i) => { if (p >= 0) (lists[p] = lists[p] || []).push(i); });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.name = name; root.add(mesh);
  return { mesh, g, pos, base: pos.slice(), parts: Object.keys(lists).map((p) => ({ p: +p, v: Int32Array.from(lists[p]), last: new Float32Array(16) })) };
 }
 function applyParts(R) {          // a part whose matrix has not changed since the last frame is left alone
  const pos = R.pos, b = R.base; let any = false;
  for (const part of R.parts) {
   const e = mats[part.p].elements, l = part.last, v = part.v; let same = true;
   for (let k = 0; k < 16; k++) if (l[k] !== e[k]) { same = false; break; }
   if (same) continue;
   l.set(e); any = true;
   for (let k = 0; k < v.length; k++) { const i = v[k] * 3, x = b[i], y = b[i + 1], z = b[i + 2]; pos[i] = e[0] * x + e[4] * y + e[8] * z + e[12]; pos[i + 1] = e[1] * x + e[5] * y + e[9] * z + e[13]; pos[i + 2] = e[2] * x + e[6] * y + e[10] * z + e[14]; }
  }
  if (any) R.g.attributes.position.needsUpdate = true;
 }
 const IB = Builder(), GB = Builder(), RB = Builder(), SB = Builder();   // iron, lantern glass, the gold rings, the black shards

 // ---------- the three gold rings; each is two arcs that last and two lengths that are lost when it breaks ----------
 const RINGS = [
  { R: 1.16, tilt: EUL(1.4, 0, .04), spin: .22, prec: .05 },                                             // the level one, like a belt
  { R: 1.24, tilt: QT().setFromAxisAngle(V3(.64, .77, 0), 1.12), spin: -.15, prec: -.03 },               // and two that cross in front
  { R: 1.32, tilt: QT().setFromAxisAngle(V3(-.64, .77, 0), 1.12), spin: .09, prec: .02 }
 ];
 const ARCS = [];
 RINGS.forEach((r, i) => {
  r.ang = rnd() * TAU; r.jolt = V3(rnd() - .5, rnd() - .5, rnd() - .5); r.lost = newPart();
  const cut = [0, 118 + rnd() * 20, 165 + rnd() * 12, 262 + rnd() * 20, 360].map((d) => d * PI / 180);
  for (let s = 0; s < 4; s++) {
   const a0 = cut[s], a1 = cut[s + 1], keep = s % 2 === 0, part = keep ? newPart() : r.lost;
   addG(RB, new THREE.TorusGeometry(r.R, .03, 6, Q(Math.max(6, (a1 - a0) / TAU * 110), 5), a1 - a0), new THREE.Matrix4().makeRotationZ(a0), GOLD, part);
   if (keep) ARCS.push({ ring: i, part, a0, a1, R: r.R, wild: EUL((rnd() - .5) * 2.4, (rnd() - .5) * 2.4, rnd() * TAU), spin: (rnd() < .5 ? -1 : 1) * (.12 + rnd() * .2), axis: V3(rnd() - .5, rnd() - .5, rnd() - .5).normalize(), out: (2.0 + rnd() * .22) / r.R, q: QT() });
  }
 });

 // ---------- the keeper's hands ----------
 // a blade of beaten iron along +Y, curling toward +Z: a diamond section, edges along +-X, a pointed tip
 function bladeGeo(len, wid, th, segs, curl) {
  const pos = [], uv = [], idx = []; curl = curl || 1e-4;
  for (let s = 0; s <= segs; s++) {
   const f = s / segs, a = curl * f, y = len * Math.sin(a) / curl, z = len * (1 - Math.cos(a)) / curl, ny = -Math.sin(a), nz = Math.cos(a);
   const w = wid * (.55 + .45 * sm(0, .22, f)) * Math.pow(1 - f, .6) + 1e-4, d = th * (1 - .6 * f) + 1e-4;
   pos.push(w, y, z, 0, y + ny * d, z + nz * d, -w, y, z, 0, y - ny * d, z - nz * d); for (let k = 0; k < 4; k++) uv.push(k / 4, f);
  }
  for (let s = 0; s < segs; s++) for (let k = 0; k < 4; k++) { const a = s * 4 + k, b = s * 4 + (k + 1) % 4; idx.push(a, b, a + 4, b, b + 4, a + 4); }
  const n0 = (segs + 1) * 4; pos.push(0, 0, 0); uv.push(.5, 0); for (let k = 0; k < 4; k++) idx.push(n0, (k + 1) % 4, k);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return g;
 }
 // a hand: the wrist at the origin, fingers up +Y curling toward the palm (+Z), a cuff of long plates sweeping down. sx = -1 mirrors it.
 // Returns its pieces as { g, m, k, c }: a blade, where it sits in the hand, how bright it is, and its middle.
 function handPieces(sx) {
  const S = new THREE.Matrix4().makeScale(sx, 1, 1), out = [], bs = Q(7, 4), fs = Q(6, 3);
  const put = (g, m, k, len) => { const M = S.clone().multiply(m); out.push({ g, m: M, k, c: V3(0, len * .45, 0).applyMatrix4(M) }); };
  for (let k = 0; k < 7; k++) { const x = lerp(-.42, .42, k / 6), L = 1.0 - .28 * Math.abs(x) / .42 + .1 * rnd(); put(bladeGeo(L, .27, .05, bs, .5), mk(x * .8, .2, -.06 + .05 * (k % 2), PI - .12, 0, x * .6), .45 + .3 * rnd(), L); }  // the cuff, sweeping down
  for (let k = 0; k < 5; k++) { const x = lerp(-.36, .36, k / 4); put(bladeGeo(.66, .2, .05, fs, .35), mk(x, -.02, .02 + .04 * (k % 2), .05, 0, -x * .35), .6 + .25 * rnd(), .66); }                       // the palm
  const FX = [-.36, -.13, .1, .32], FL = [.86, 1, .96, .8];
  for (let f = 0; f < 4; f++) {
   let m = mk(FX[f], .5, .05, .1, 0, -FX[f] * .45); const seg = [.42, .36, .34].map((v) => v * FL[f]);
   for (let j = 0; j < 3; j++) { put(bladeGeo(seg[j] + .1, .13 - .022 * j, .06, fs, .4), m.clone(), .75 + .25 * rnd(), seg[j]); m.multiply(mk(0, seg[j] * .96, seg[j] * .2, .5, 0, 0)); }
  }
  let m = mk(.5, .12, .06, .3, 0, -.95);
  for (let j = 0; j < 2; j++) { put(bladeGeo(.46, .125, .06, fs, .4), m.clone(), .8 + .2 * rnd(), .4); m.multiply(mk(0, .4, .08, .45, 0, .12)); }                                                    // the thumb
  return out;
 }
 const ironOf = (k) => C1.copy(IRON_D).lerp(k < .7 ? IRON_M : IRON_L, cl(k, 0, 1)).clone();
 const P_H0 = newPart();                                    // the +X hand, which stays whole
 for (const pc of handPieces(1)) addG(IB, pc.g, pc.m, ironOf(pc.k), P_H0);
 const LOOSE = handPieces(-1).map((pc) => {                 // the -X hand: every blade is its own part, so it can come apart
  const part = newPart(); addG(IB, pc.g, pc.m, ironOf(pc.k), part);
  return { part, c: pc.c, off: V3((rnd() - .5) * 1.3 - .4, (rnd() - .5) * 1.1 + (pc.c.y - .2) * .5, (rnd() - .5) * 1.3), axis: V3(rnd() - .5, rnd() - .5, rnd() - .5).normalize(), ang: (rnd() - .5) * 2.2, ph: rnd() * 9, fall: V3((rnd() - .5) * 2.6, 0, (rnd() - .5) * 1.6 + .6), lie: EUL(PI / 2 + (rnd() - .5) * .3, rnd() * TAU, 0) };
 });
 const HAND_TIP = V3(0, 1.45, .55), HAND_PALM = V3(0, .3, .3);

 // ---------- the bowl: two halves that stand together as one, each on two legs with two crooks for the lanterns ----------
 const BOWL_Y = 1.3, BOWL_R = 1.56;
 const P_HALF = [newPart(), newPart()], HALF_PIV = [V3(1.0, 0, 0), V3(-1.0, 0, 0)];
 const LANT = [];
 [1, -1].forEach((sx, h) => {
  const part = P_HALF[h], dark = ironOf(.2), mid = ironOf(.62), lite = ironOf(.95);
  const prof = [[.2, .56], [.8, .62], [1.25, .84], [1.5, 1.12], [BOWL_R, BOWL_Y], [1.5, BOWL_Y + .02], [1.4, 1.18], [1.15, .95], [.75, .76], [.2, .7]].map((p) => new THREE.Vector2(p[0], p[1]));
  const phi0 = sx > 0 ? 0 : PI;                             // a lathe's x is r sin(phi): 0 to pi is the +X half
  addG(IB, new THREE.LatheGeometry(prof, Q(22, 10), phi0, PI), null, dark, part);
  addG(IB, new THREE.TorusGeometry(BOWL_R - .02, .05, 5, Q(22, 10), PI), mk(0, BOWL_Y + .02, 0, PI / 2, 0, sx > 0 ? -PI / 2 : PI / 2), mid, part);
  for (let k = 0; k < 9; k++) { const phi = phi0 + (k + .5) / 9 * PI; addG(IB, new THREE.ConeGeometry(.05, .22, 5), new THREE.Matrix4().makeRotationY(phi - PI / 2).multiply(mk(BOWL_R, BOWL_Y + .1, 0, 0, 0, -.5)), lite, part); }
  for (const deg of [45, 135]) {                            // two legs
   const phi = phi0 + deg * PI / 180, P = (r, y) => V3(Math.sin(phi) * r, y, Math.cos(phi) * r);
   addG(IB, new THREE.TubeGeometry(new THREE.CatmullRomCurve3([P(1.0, .74), P(1.28, .52), P(1.2, .24), P(1.3, .06)]), Q(10, 5), .1, 6, false), null, dark, part);
   addG(IB, new THREE.BoxGeometry(.2, .1, .34), new THREE.Matrix4().makeRotationY(phi).multiply(mk(0, .05, 1.34)), mid, part);
  }
  for (const deg of [62, 118]) {                            // two crooks, each with a small curl beside it
   const phi = phi0 + deg * PI / 180, P = (r, y) => V3(Math.sin(phi) * r, y, Math.cos(phi) * r);
   addG(IB, new THREE.TubeGeometry(new THREE.CatmullRomCurve3([P(1.5, BOWL_Y), P(1.5, 1.85), P(1.58, 2.28), P(1.78, 2.44), P(1.95, 2.34), P(1.98, 2.16)]), Q(16, 8), .035, 5, false), null, mid, part);
   addG(IB, new THREE.TubeGeometry(new THREE.CatmullRomCurve3([P(1.44, BOWL_Y), P(1.4, 1.62), P(1.3, 1.78), P(1.2, 1.7), P(1.22, 1.6)]), Q(10, 5), .028, 5, false), null, mid, part);
   LANT.push({ half: h, hook: P(1.98, 2.16), part: newPart(), ph: rnd() * 9 });
  }
 });
 // a fair lantern hangs from the origin on a short chain
 LANT.forEach((l) => {
  const part = l.part, F = ironOf(.5), L2 = ironOf(.9), y0 = -.16;
  for (let k = 0; k < 3; k++) addG(IB, new THREE.TorusGeometry(.03, .009, 4, 6), mk(0, -.03 - k * .05, 0, 0, (k % 2) * PI / 2, 0), F, part);
  addG(IB, new THREE.TorusGeometry(.06, .012, 4, 8), mk(0, y0 - .03, 0), F, part);
  addG(IB, new THREE.ConeGeometry(.2, .15, 6), mk(0, y0 - .14, 0), F, part);
  addG(IB, new THREE.CylinderGeometry(.19, .19, .03, 6), mk(0, y0 - .23, 0), L2, part);
  for (let k = 0; k < 6; k++) { const a = k * PI / 3 + PI / 6; addG(IB, new THREE.BoxGeometry(.026, .34, .026), mk(Math.cos(a) * .155, y0 - .41, Math.sin(a) * .155), F, part); }
  addG(IB, new THREE.CylinderGeometry(.18, .15, .05, 6), mk(0, y0 - .6, 0), L2, part);
  addG(IB, new THREE.ConeGeometry(.05, .1, 5), mk(0, y0 - .68, 0, PI, 0, 0), F, part);
  addG(GB, new THREE.CylinderGeometry(.145, .145, .34, 6, 1, true), mk(0, y0 - .41, 0), AMB, part);
  l.centre = V3(0, y0 - .43, 0);
 });

 // ---------- the shards of the eclipse (the final form): curved three-cornered pieces of black shell ----------
 const SHARDS = [];
 { const dirs = []; for (let k = 0; k < 6; k++) dirs.push([56 + (rnd() - .5) * 8, k * 60 + 12 + (rnd() - .5) * 12]); for (let k = 0; k < 3; k++) dirs.push([122, k * 120 + 40]); dirs.push([180, 0]);
  dirs.forEach(([th, ph], n) => {
   th *= PI / 180; ph *= PI / 180;
   const d = V3(Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)), part = newPart(), psi0 = (n < 6 ? 18.5 + rnd() * 3 : 23) * PI / 180, AR = Q(21, 12), pos = [0, 0, 1], idx = [];
   for (let j = 1; j <= 3; j++) for (let a = 0; a < AR; a++) { const al = a / AR * TAU, e = Math.max(Math.cos(al - PI / 2), Math.cos(al - PI / 2 - TAU / 3), Math.cos(al - PI / 2 + TAU / 3)), psi = psi0 * (j / 3) * Math.min(1.75, 1 / e); pos.push(Math.sin(psi) * Math.cos(al), Math.sin(psi) * Math.sin(al), Math.cos(psi)); }
   for (let a = 0; a < AR; a++) { const b = (a + 1) % AR; idx.push(0, 1 + a, 1 + b); for (let j = 0; j < 2; j++) { const p = 1 + j * AR, q = p + AR; idx.push(p + a, q + a, p + b, p + b, q + a, q + b); } }
   const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
   addG(SB, g, null, new THREE.Color(n % 2 ? 0x0d090f : 0x120b12), part);
   const q0 = QT().setFromUnitVectors(ZAX, d), pl = V3(0, 0, 1).addScaledVector(d, -d.z).applyQuaternion(q0.clone().invert()), tw = n < 9 ? Math.atan2(pl.y, pl.x) + PI / 2 + (rnd() - .5) * .5 : rnd() * TAU;
   SHARDS.push({ part, d, q: q0.multiply(QT().setFromAxisAngle(ZAX, tw)), ph: rnd() * 9, jolt: V3(rnd() - .5, rnd() - .5, rnd() - .5), fall: V3(d.x * 2.6 + (rnd() - .5), 0, d.z * 1.6 + (rnd() - .5) + .4), lie: EUL(-PI / 2 + (rnd() - .5) * .5, rnd() * TAU, 0), tumble: 1.5 + rnd() * 2 });
  });
 }

 const ironMat = new THREE.MeshPhongMaterial({ map: ironMap, vertexColors: true, flatShading: true, shininess: 42, specular: 0x8a5a44, emissive: 0x1a0c10, side: THREE.DoubleSide });
 const IRON = finish(IB, ironMat, 'Iron');
 const ringMat = new THREE.MeshPhongMaterial({ vertexColors: true, flatShading: true, shininess: 80, specular: 0xffe6b0, emissive: 0x9a7a34 });
 const RING = finish(RB, ringMat, 'Rings');
 const glassMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: .92, depthWrite: false, side: THREE.DoubleSide });
 const GLASS = finish(GB, glassMat, 'LanternGlass'); GLASS.mesh.renderOrder = 5;
 const shardMat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide });
 const SHELL = finish(SB, shardMat, 'Shards');

 // ---------- the eclipse (form one) and the heart (the final form) ----------
 const sphMat = new THREE.MeshBasicMaterial({ color: 0x0c080d });
 const sphere = new THREE.Mesh(new THREE.SphereGeometry(SR, Q(48, 20), Q(32, 14)), sphMat); sphere.name = 'Eclipse'; root.add(sphere);
 const rim = new THREE.Sprite(new THREE.SpriteMaterial({ map: rimT, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
 const RIM_S = 2 * SR / .468; rim.renderOrder = 3; rim.name = 'EclipseRim'; root.add(rim);
 const heartMat = new THREE.ShaderMaterial({
  uniforms: { uMap: { value: veinT }, uK: { value: 1 }, uT: { value: 0 } },
  vertexShader: 'varying vec3 vN; varying vec3 vV; varying vec2 vUv;\nvoid main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
  fragmentShader: 'uniform sampler2D uMap; uniform float uK; uniform float uT; varying vec3 vN; varying vec3 vV; varying vec2 vUv;\nvoid main(){ float f = clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0); float v = texture2D(uMap, vUv * vec2(2.0, 1.0) + vec2(uT * 0.013, uT * 0.004)).r;\n vec3 col = mix(vec3(0.95, 0.08, 0.22), vec3(1.0, 0.5, 0.62), smoothstep(0.0, 0.5, f)); col = mix(col, vec3(1.0), smoothstep(0.4, 0.9, f)); col = mix(col, vec3(0.9, 0.05, 0.2), v * 0.75 * (1.0 - smoothstep(0.55, 0.97, f)));\n gl_FragColor = vec4(col * uK, 1.0); }'
 });
 const heart = new THREE.Mesh(new THREE.SphereGeometry(HEART, Q(32, 16), Q(20, 10)), heartMat); heart.name = 'Heart'; root.add(heart);
 const _cam = V3(), _wq = QT();
 const candle = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameT, depthWrite: false, transparent: true })); candle.name = 'Candle'; candle.renderOrder = 12; root.add(candle);
 const candleAt = V3(); let candleOut = 0;                  // where the candle is, and how far it is pushed toward the eye so the heart does not hide it
 candle.onBeforeRender = (r, s, camera) => { root.worldToLocal(_cam.copy(camera.position)).sub(candleAt).normalize(); candle.position.copy(candleAt).addScaledVector(_cam, candleOut); candle.updateMatrixWorld(true); };

 // ---------- flame: the corona and the curtain. One material; each vertex carries its own light and how much it covers ----------
 const flameMat = new THREE.ShaderMaterial({
  vertexShader: 'attribute vec4 aCol; varying vec4 vC;\nvoid main(){ vC = aCol; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: 'varying vec4 vC;\nvoid main(){ gl_FragColor = vC; }',
  transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor
 });
 function strips(n, segs, name, order) {                    // n strips of three columns
  const V = (segs + 1) * 3, g = new THREE.BufferGeometry(), pos = new Float32Array(n * V * 3), col = new Float32Array(n * V * 4), idx = [];
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('aCol', new THREE.BufferAttribute(col, 4).setUsage(THREE.DynamicDrawUsage));
  for (let i = 0; i < n; i++) for (let s = 0; s < segs; s++) for (let c = 0; c < 2; c++) { const a = i * V + s * 3 + c, b = a + 3; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  g.setIndex(idx); const mesh = new THREE.Mesh(g, flameMat); mesh.frustumCulled = false; mesh.renderOrder = order; mesh.name = name; root.add(mesh);
  return { mesh, g, pos, col, V, segs };
 }
 // the corona: 30 blades in form one; in the final form 14 more, all uneven, and 12 loose flecks. It always faces the eye.
 const NB1 = 30, NB = 56, BS = Q(13, 7);
 const COR = strips(NB, BS, 'Corona', 4);
 const BL = [];
 for (let i = 0; i < NB; i++) {
  const main = i < NB1, fleck = i >= 44, th = main ? i / NB1 * TAU : rnd() * TAU, up = Math.max(0, Math.cos(th));
  BL.push({
   th, th2: th + (rnd() - .5) * .16, fleck,
   L1: main ? (i % 2 ? 1.0 : 1.14) : 0, L2: fleck ? .28 + rnd() * .4 : (.75 + 1.35 * rnd()) * (1 + .75 * up * up),
   R2: fleck ? 2.7 + rnd() * 1.5 + up : 1.62, W1: .17, W2: fleck ? .08 : .2 + .1 * rnd(),
   curl: .2 + .06 * rnd(), curl2: (rnd() < .5 ? -1 : 1) * (.12 + .3 * rnd()), f1: 1.7 + rnd() * 1.4, f2: 2.2 + rnd() * 1.6, p1: rnd() * 9, p2: rnd() * 9, puffed: false
  });
 }
 BL.map((b, i) => [Math.abs(wrapA(b.th)), i]).sort((a, b) => b[0] - a[0]).forEach(([, i], r) => { BL[i].outU = .05 + .42 * r / (NB - 1); });   // at the ending the bottom ones go out first
 COR.mesh.onBeforeRender = (r, s, camera) => { root.getWorldQuaternion(_wq).invert(); COR.mesh.quaternion.copy(_wq).multiply(camera.quaternion); COR.mesh.updateMatrixWorld(true); };
 // the curtain: 20 strips hanging from under the eclipse into the bowl; in the final form they are ribbons of flame
 const NS = 20, SS = Q(20, 10);
 const CUR = strips(NS, SS, 'Curtain', 2);
 const ST = [];
 for (let k = 0; k < NS; k++) {
  const a = k / NS * TAU + .08, o = V3(Math.sin(a), 0, Math.cos(a)), inner = k % 2 === 0, far = 3.0 + rnd() * 1.5;
  ST.push({ a, o, tg: V3(o.z, 0, -o.x), ph: rnd() * 9, ph2: rnd() * 9, inner, pleat: (k % 2 ? .04 : -.04), sh: .82 + .18 * rnd(),
   end: inner ? V3(o.x * (.25 + rnd() * .7), 1.05, o.z * (.25 + rnd() * .5)) : V3(o.x * far, 2.2 + rnd() * 3.6, o.z * far * .55),
   amp: inner ? .5 + rnd() * .7 : .25 + rnd() * .4, n: 5 + rnd() * 4, sp: 1.5 + rnd() * 1.4 });
 }

 // ---------- the glow in the bowl and the one light ----------
 const coalMat = new THREE.MeshBasicMaterial({ map: coalT, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, color: CRIM.clone() });
 const coal = new THREE.Mesh(new THREE.CircleGeometry(1.38, Q(20, 10)), coalMat); coal.rotation.x = -PI / 2; coal.position.y = 1.2; coal.renderOrder = 3; coal.name = 'Coals'; root.add(coal);
 const light = new THREE.PointLight(CRIM.clone(), 1.5, 20, 1.4); light.name = 'FireLight'; root.add(light);

 // ---------- points: world-sized soft sprites with their own colour and size (as in the wraith) ----------
 const PV = 'attribute vec4 aCol; attribute float aSize; uniform float uScale; varying vec4 vC;\nvoid main(){ vC = aCol; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = aCol.a > 0.002 ? aSize * uScale * projectionMatrix[1][1] / -mv.z : 0.0; }';
 const PF = 'uniform sampler2D uMap; varying vec4 vC;\nvoid main(){ vec4 t = texture2D(uMap, vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y)); gl_FragColor = vec4(vC.rgb * t.rgb, vC.a * t.a); }';
 const _v2 = new THREE.Vector2();
 function points(n, map, order, parent) {
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 4), size = new Float32Array(n), g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aCol', new THREE.BufferAttribute(col, 4).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aSize', new THREE.BufferAttribute(size, 1).setUsage(THREE.DynamicDrawUsage));
  const m = new THREE.ShaderMaterial({ uniforms: { uMap: { value: map }, uScale: { value: 400 } }, vertexShader: PV, fragmentShader: PF, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const p = new THREE.Points(g, m); p.frustumCulled = false; p.renderOrder = order || 8; parent.add(p);
  p.onBeforeRender = (r) => { r.getDrawingBufferSize(_v2); m.uniforms.uScale.value = _v2.y * .5; };
  return { p, pos, col, size, g, n, m, vel: new Float32Array(n * 3), life: new Float32Array(n), max: new Float32Array(n).fill(1), base: new Float32Array(n * 4), sz: new Float32Array(n * 2), drag: new Float32Array(n), up: new Float32Array(n), next: 0, live: 2 };
 }
 // glows: 0-3 lantern halos, 4 the flash, 5 the bowl, 6 the heart, 7 the last flame, 8 the blow, 9 the whole hand's palm, 10-21 the ends of the six arcs
 const GL = points(22, dotT, 6, root);
 const FP = points(5, flameT, 9, root);              // flames: 0-3 inside the lanterns, 4 the last small fire
 const MO = points(Q(460, 260), dotT, 8, fx);        // embers, the called flames, sparks
 function setP(P, i, p, c, a, s) { P.pos[i * 3] = p.x; P.pos[i * 3 + 1] = p.y; P.pos[i * 3 + 2] = p.z; P.col[i * 4] = c.r; P.col[i * 4 + 1] = c.g; P.col[i * 4 + 2] = c.b; P.col[i * 4 + 3] = cl(a, 0, 1); P.size[i] = s; }
 function flushP(P) { P.g.attributes.position.needsUpdate = true; P.g.attributes.aCol.needsUpdate = true; P.g.attributes.aSize.needsUpdate = true; }
 function emit(P, x, y, z, vx, vy, vz, life, c, a, s0, s1, drag, up) {
  const i = P.next; P.next = (i + 1) % P.n; P.live = 2;
  P.pos[i * 3] = x; P.pos[i * 3 + 1] = y; P.pos[i * 3 + 2] = z; P.vel[i * 3] = vx; P.vel[i * 3 + 1] = vy; P.vel[i * 3 + 2] = vz;
  P.life[i] = P.max[i] = life; P.base[i * 4] = c.r; P.base[i * 4 + 1] = c.g; P.base[i * 4 + 2] = c.b; P.base[i * 4 + 3] = a; P.sz[i * 2] = s0; P.sz[i * 2 + 1] = s1; P.drag[i] = drag || 0; P.up[i] = up || 0;
 }
 function stepP(P, dt) {
  if (P.live <= 0) return;
  const pos = P.pos, vel = P.vel, col = P.col; let alive = 0;
  for (let i = 0; i < P.n; i++) {
   if (P.life[i] <= 0) { if (col[i * 4 + 3] !== 0) { col[i * 4 + 3] = 0; P.size[i] = 0; } continue; }
   alive++; P.life[i] -= dt; const age = 1 - Math.max(0, P.life[i]) / P.max[i], dr = Math.exp(-P.drag[i] * dt);
   vel[i * 3] *= dr; vel[i * 3 + 1] = vel[i * 3 + 1] * dr + P.up[i] * dt; vel[i * 3 + 2] *= dr;
   pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
   const k = Math.min(1, age / .15) * (1 - age);
   col[i * 4] = P.base[i * 4]; col[i * 4 + 1] = P.base[i * 4 + 1]; col[i * 4 + 2] = P.base[i * 4 + 2]; col[i * 4 + 3] = P.base[i * 4 + 3] * k;
   P.size[i] = lerp(P.sz[i * 2], P.sz[i * 2 + 1], age);
  }
  if (!alive) P.live--;
  flushP(P);
 }
 function clearP(P) { P.life.fill(0); P.col.fill(0); P.size.fill(0); P.live = 0; flushP(P); }

 // ---------- moves ----------
 const ACTS = {
  idle: { dur: .01, hits: [], cues: [], hold: false, interrupt: true },
  blow: { dur: 1.6, hits: [.5], cues: [.28], hold: false, interrupt: false },          // the hit lands at 0.8 s
  call: { dur: 4, hits: [.78], cues: [.14], hold: false, interrupt: false },           // the flames stream in from 0.56 s, the burst at 3.1 s
  hurt: { dur: .8, hits: [], cues: [], hold: false, interrupt: true },                 // a flinch; nothing on it breaks
  change: { dur: 5.2, hits: [.5], cues: [.22], hold: false, interrupt: false },        // it goes dark, cracks with light from 1.1 s, and breaks open at 2.6 s
  ending: { dur: 7, hits: [], cues: [.6], hold: true, interrupt: true }                // holds at its end; reset() starts again
 };
 const CH_HIT = ACTS.change.hits[0];
 // where the hands rest in each form, where they go for the call, and where they lie at the end. [+X hand, -X hand]
 const HS = V3(1.3, 1.3, 1.3);
 const HB1 = [{ p: V3(1.8, 3.35, .25), q: EUL(.05, -.6, .32) }, { p: V3(-1.8, 3.35, .25), q: EUL(.05, .6, -.32) }];
 const HB2 = [{ p: V3(1.5, 4.7, 1.0), q: EUL(-.45, -.5, .7) }, { p: V3(-2.9, 4.6, .5), q: EUL(.05, .6, -.3) }];
 const HC = [{ p: V3(2.3, 4.6, .9), q: EUL(.1, -.6, .5) }, { p: V3(-2.3, 4.6, .9), q: EUL(.1, .6, -.5) }];
 const HR = [{ p: V3(2.5, .3, 1.5), q: EUL(-PI / 2 + .15, .4, 0) }, { p: V3(-2.5, .3, 1.5), q: EUL(-PI / 2 + .15, -.4, 0) }];
 const BLOW = [[0, null, null], [.28, V3(1.5, 7.2, .4), EUL(-.9, -.3, .1)], [.5, V3(.9, 1.5, 4.3), EUL(1.45, -.15, .1)], [.66, V3(.9, 1.4, 4.2), EUL(1.4, -.15, .1)], [1, null, null]];
 const ALIGN = EUL(.12, 0, 0);                              // the disc the rings line up into, turned toward the party
 const FLAT = ARCS.map((a, i) => ({ q: EUL(-PI / 2 + (rnd() - .5) * .14, i * 1.05, 0), p: V3((rnd() - .5) * 3.4, .06 + .03 * i, (rnd() - .5) * 2.4 + .5) }));

 const state = { glow: 1 };
 let actv = null, fadeE = 1, lastName = '', lastU = 0, snap = true, form = +opts.form === 2 ? 2 : 1, Fv = form === 2 ? 1 : 0;
 const S = { flash: 0, blowFlash: 0, acc: { ember: 0, pull: 0, spark: 0 } };
 const HP = [V3(), V3()], HQ = [QT(), QT()], RQ = RINGS.map(() => QT()), HM = [new THREE.Matrix4(), new THREE.Matrix4()], HALFM = [new THREE.Matrix4(), new THREE.Matrix4()];
 const _a = V3(), _b = V3(), _c = V3(), _q = QT(), _q2 = QT(), _e = new THREE.Euler(), tp = V3(), tq = QT(), _m = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _s = V3(), CEN = V3();
 const W = (v) => root.localToWorld(v);
 const backOut = (x) => { const c = 1.9, y = x - 1; return 1 + (c + 1) * y * y * y + c * y * y; };

 function play(name, force) {
  const def = ACTS[name]; if (!def) return false;
  if (actv && actv.name === 'ending') return false;                  // it stays ended until reset()
  if (name === 'idle') { if (actv && actv.name === 'change') return false; actv = null; return true; }
  if (name === 'change' && form === 2) return false;                 // it is already broken open
  if (actv && actv.name === 'change') return false;                  // the change always plays through
  if (actv && !force && !def.interrupt) return false;
  actv = { name, def, t: 0 };
  if (name === 'ending') for (const b of BL) b.puffed = false;
  return true;
 }
 function setForm(n) { form = +n === 2 ? 2 : 1; Fv = form === 2 ? 1 : 0; if (actv && actv.name === 'change') actv = null; snap = true; }
 function reset(n) {
  actv = null; lastName = ''; lastU = 0; S.flash = S.blowFlash = 0;
  for (const b of BL) b.puffed = false;
  clearP(MO); setForm(n === 2 ? 2 : 1);
 }

 function animate(phase, walk, t, dt) {
  // phase and walk are kept for the same call as the other foes; this one stands still
  dt = dt > 0 ? Math.min(dt, .05) : 0;
  let u = 0, name = '';
  if (actv) { actv.t += dt; u = Math.min(1, actv.t / actv.def.dur); name = actv.name; if (u >= 1 && !actv.def.hold) { if (name === 'change') { form = 2; Fv = 1; } actv = null; } }
  const fresh = name !== lastName || u < lastU, was = fresh ? 0 : lastU;
  const ended = name === 'ending', eU = ended ? u : 0, eT = ended ? actv.t : 0;
  const chg = name === 'change', cU = chg ? u : -1;
  const kk = (r) => (snap || dt <= 0 ? 1 : 1 - Math.exp(-dt * r));
  const sg = (state.glow === undefined ? 1 : +state.glow) * fadeE;
  // F: 0 in form one, 1 in the final form. In the change it springs open after the burst.
  if (chg) { Fv = u < CH_HIT ? 0 : backOut(sm(CH_HIT, CH_HIT + .3, u)); if (u >= CH_HIT) form = 2; }
  const F = Fv, Fc = cl(F, 0, 1), broke = F > .02;
  const dimK = chg ? win(u, .05, CH_HIT - .02, .05) * (1 - .75 * sm(.22, CH_HIT, u)) : 0;        // it goes dark and still before it cracks
  const crackK = chg ? sm(.22, CH_HIT, u) * (1 - sm(CH_HIT, CH_HIT + .04, u)) : 0;               // light building inside
  const shake = crackK * crackK * .09;
  // the envelopes of each move, all zero at its ends
  const callU = name === 'call' ? u : -1;
  const align = callU >= 0 ? sm(.04, .3, callU) * (1 - sm(.84, 1, callU)) : 0;
  const lean = callU >= 0 ? sm(.12, .42, callU) * (1 - sm(.74, .79, callU)) : 0;
  const flare = callU >= 0 ? sm(.76, .79, callU) * (1 - sm(.8, 1, callU)) : 0;
  const pull = callU >= 0 ? win(callU, .14, .74, .03) : 0;
  const hurtK = name === 'hurt' ? sm(0, .05, u) * (1 - sm(.1, 1, u)) : 0, hurtS = hurtK * (.7 + .3 * Math.sin(u * 55));
  const blowK = name === 'blow' ? win(u, .25, .7, .1) : 0;
  const endK = ended ? sm(.48, .86, eU) : 0, finalK = ended ? sm(.62, .86, eU) : 0, crimK = ended ? 1 - sm(.38, .72, eU) : 1;
  const calm = (1 - endK) * (1 - dimK);
  const SC = lerp(SC1, SC2, Fc) + (ended ? 0 : 0);
  CEN.set(shake * Math.sin(t * 61) + .06 * hurtS, SC + shake * Math.sin(t * 47) + .04 * hurtS, 0);

  // the burst that breaks it open
  if (chg && was < CH_HIT && u >= CH_HIT) {
   S.flash = 1.6;
   for (let i = 0; i < 220; i++) { _c.set(rnd() - .5, rnd() - .5, (rnd() - .5) * .7).normalize(); W(_a.copy(_c).multiplyScalar(SR).add(CEN)); const sp = 3 + rnd() * 8; emit(MO, _a.x, _a.y, _a.z, _c.x * sp, _c.y * sp, _c.z * sp, 1 + rnd() * .8, rnd() < .4 ? WHITE : rnd() < .5 ? ROSE : HOT, 1, .26, .05, 1.3); }
   for (const l of LANT) { W(_a.copy(l.centre).applyMatrix4(mats[l.part])); for (let k = 0; k < 8; k++) emit(MO, _a.x, _a.y, _a.z, (rnd() - .5) * 1.5, rnd() * 1.5, (rnd() - .5) * 1.5, .7, AMB, .9, .1, .02, 1.5); }
  }
  if (name === 'call' && was < ACTS.call.hits[0] && u >= ACTS.call.hits[0]) {
   S.flash = 1;
   for (let i = 0; i < 170; i++) { _c.set(rnd() - .5, rnd() - .5, (rnd() - .5) * .5).normalize(); W(_a.copy(_c).multiplyScalar(lerp(SR, RS2, Fc)).add(CEN)); const sp = 3 + rnd() * 5; emit(MO, _a.x, _a.y, _a.z, _c.x * sp, _c.y * sp, _c.z * sp, 1 + rnd() * .6, rnd() < .5 ? ROSE : CRIM, 1, .22, .05, 1.4); }
  }
  S.flash = Math.max(0, S.flash - dt * 1.3);
  S.blowFlash = Math.max(0, S.blowFlash - dt * 2.5);

  // the bowl's two halves: together in form one; in the final form each leans out on its own two legs
  for (let h = 0; h < 2; h++) {
   const sx = h ? -1 : 1, piv = HALF_PIV[h], lean2 = .2 * Fc + .02 * hurtS * Fc, apart = .34 * Fc;
   HALFM[h].makeTranslation(piv.x + sx * apart, 0, 0).multiply(_m.makeRotationZ(-sx * lean2)).multiply(_m2.makeTranslation(-piv.x, 0, 0));
   mats[P_HALF[h]].copy(HALFM[h]);
  }
  // the lanterns swing on their chains under the crooks
  LANT.forEach((l, i) => {
   const sw = 1 + 2.5 * blowK + 3 * hurtK + 1.5 * flare + 5 * crackK + 2.5 * sm(.02, .2, F) * (1 - sm(.2, 1, F));
   _a.copy(l.hook).applyMatrix4(HALFM[l.half]);
   mats[l.part].compose(_a, _q.setFromEuler(_e.set(.08 * Math.sin(t * 1.4 + l.ph) * sw, 0, .1 * Math.sin(t * 1.1 + l.ph * 2.1) * sw)), ONE);
  });

  // the rings: whole and slowly turning in form one; in the final form six arcs at wild tilts with white-hot ends
  const spinK = (ended ? 1 - sm(.05, .5, eU) : 1 + 6 * align) * (1 - dimK);
  RINGS.forEach((r, i) => {
   r.ang += dt * r.spin * spinK;
   tq.setFromAxisAngle(YAX, t * r.prec).multiply(r.tilt); tq.slerp(ALIGN, align);
   RQ[i].slerp(tq, kk(8)); if (snap) RQ[i].copy(tq);
   _q.setFromEuler(_e.set(r.jolt.x * (hurtS * .5 + shake * 4 * Math.sin(t * 50 + i)), r.jolt.y * hurtS * .5, r.jolt.z * (hurtS * .5 + shake * 4 * Math.cos(t * 43 + i))));
   r.q = _q.multiply(RQ[i]).multiply(_q2.setFromAxisAngle(ZAX, r.ang)).clone();
   mats[r.lost].compose(CEN, r.q, broke ? ZERO : ONE);
  });
  ARCS.forEach((a, j) => {
   const r = RINGS[a.ring];
   tq.copy(a.wild).premultiply(_q.setFromAxisAngle(a.axis, t * a.spin * (1 + 5 * align) * (1 - sm(.05, .5, eU))));
   if (align > 0) tq.slerp(_q.copy(ALIGN).multiply(_q2.setFromAxisAngle(ZAX, j * 1.05 + t * 2.2)), align);
   a.q.copy(r.q).slerp(tq, Fc);
   const sc = lerp(1, a.out, F) * (1 + .05 * S.flash);
   tp.copy(CEN);
   if (ended) { const sink = Math.pow(sm(.3, .8, eU), 1.6); a.q.slerp(FLAT[j].q, sink); tp.lerp(FLAT[j].p, sink); }
   mats[a.part].compose(tp, a.q, _s.set(sc, sc, sc));
   for (let e = 0; e < 2; e++) { const an = e ? a.a1 : a.a0; _a.set(Math.cos(an) * a.R, Math.sin(an) * a.R, 0).applyMatrix4(mats[a.part]); setP(GL, 10 + j * 2 + e, _a, C1.copy(ROSE).lerp(WHITE, .5), Fc * (.75 + .25 * Math.sin(t * 7 + j + e * 2)) * crimK * sg, .5); }
  });

  // the keeper's hands. The +X hand stays whole and strikes; in the final form it is held under the heart. The -X hand comes apart.
  for (let h = 0; h < 2; h++) {
   const sx = h ? -1 : 1, b1 = HB1[h], b2 = HB2[h];
   tp.copy(b1.p).lerp(b2.p, Fc).add(_a.set(.06 * Math.sin(t * .6 + h * 2) * calm, .1 * Math.sin(t * .8 + h) * calm - .5 * dimK, .05 * Math.sin(t * .5 + h * 3) * calm));
   tq.copy(b1.q).slerp(b2.q, Fc);
   tq.multiply(_q.setFromEuler(_e.set(.06 * Math.sin(t * .7 + h) * calm + .25 * dimK, .08 * Math.sin(t * .5 + h * 2) * calm, .05 * Math.sin(t * .9 + h) * calm)));
   if (name === 'blow' && h === 0) { let i = 0; while (i < BLOW.length - 2 && u > BLOW[i + 1][0]) i++; const ka = BLOW[i], kb = BLOW[i + 1], f = sm(ka[0], kb[0], u); _a.copy(ka[1] || tp); _b.copy(kb[1] || tp); _q.copy(ka[2] || tq); _q2.copy(kb[2] || tq); tp.copy(_a).lerp(_b, f); tq.copy(_q).slerp(_q2, f); if (ka[1] && kb[1]) tp.y += 0; }
   if (align > 0) { tp.lerp(_a.copy(HC[h].p).setY(HC[h].p.y + (SC - SC1)), align); tq.slerp(HC[h].q, align); tp.x += sx * .5 * S.flash; }
   if (hurtK > 0) { tp.x += sx * .3 * hurtS; tp.y += .18 * hurtS; tq.multiply(_q.setFromEuler(_e.set(.3 * hurtS, 0, -sx * .25 * hurtS))); }
   if (crackK > 0) { tp.x += sx * .5 * crackK; tp.y += shake * 3 * Math.sin(t * 39 + h); }
   if (endK > 0) { tp.lerp(HR[h].p, endK); tq.slerp(HR[h].q, endK); }
   const r = name === 'blow' ? 16 : 9;
   HP[h].lerp(tp, kk(r)); HQ[h].slerp(tq, kk(r)); if (snap) { HP[h].copy(tp); HQ[h].copy(tq); }
   HM[h].compose(HP[h], HQ[h], HS);
  }
  mats[P_H0].copy(HM[0]);
  for (const b of LOOSE) {                                   // each blade of the -X hand drifts a little way from its place and turns
   const k = Fc, bob = k * calm;
   _a.copy(b.c).addScaledVector(b.off, k).add(_b.set(.07 * Math.sin(t * .7 + b.ph) * bob, .1 * Math.sin(t * .9 + b.ph * 1.7) * bob, .06 * Math.sin(t * .6 + b.ph * 2.3) * bob));
   _q.setFromAxisAngle(b.axis, b.ang * k + .25 * Math.sin(t * .5 + b.ph) * bob);
   _m.compose(_a, _q, ONE).multiply(_m2.makeTranslation(-b.c.x, -b.c.y, -b.c.z));
   const M = mats[b.part].multiplyMatrices(HM[1], _m);
   if (ended && k > 0) {                                     // at the end the loose blades fall and lie where they land
    const fl = sm(.3, .7, eU); _a.setFromMatrixPosition(M); _b.copy(_a).add(b.fall).setY(.06);
    _m.compose(_a.lerp(_b, fl).setY(lerp(_a.y, .06, fl * fl)), _q.setFromRotationMatrix(M).slerp(b.lie, fl), ONE); M.copy(_m).multiply(_m2.makeTranslation(-b.c.x, -b.c.y, -b.c.z));
   }
  }
  if (name === 'blow' && was < ACTS.blow.hits[0] && u >= ACTS.blow.hits[0]) {
   S.blowFlash = 1; W(_b.copy(HAND_TIP).applyMatrix4(HM[0]));
   for (let i = 0; i < 50; i++) emit(MO, _b.x, _b.y, _b.z, (rnd() - .5) * 3, rnd() * 2.5, 2 + rnd() * 3, .5 + rnd() * .4, rnd() < .6 ? CRIM : ROSE, 1, .14, .03, 2, -4);
  }

  // the shards: hidden inside the eclipse in form one; flung out round the heart when it breaks
  const shR = lerp(SR * .98, RS2, F);
  for (const s of SHARDS) {
   const fl = ended ? sm(.3, .75, eU) : 0;
   const sc = lerp(SR * .98, RS2, Fc);                       // a shard is a piece of a ball of this size; _a is where its middle is
   _a.copy(s.d).multiplyScalar(shR * (1 + .03 * Math.sin(t * .8 + s.ph) * Fc + .08 * hurtS * Fc + .1 * S.flash)).add(CEN);
   _q.copy(s.q).premultiply(_q2.setFromEuler(_e.set(.05 * Math.sin(t * .5 + s.ph) * Fc + s.jolt.x * hurtS * .3, .05 * Math.sin(t * .4 + s.ph * 2) * Fc + s.jolt.y * hurtS * .3, 0)));
   if (fl > 0) { _b.copy(s.fall).setY(.12); _a.lerp(_b, fl).setY(lerp(_a.y, .12, fl * fl)); _q.slerp(s.lie, fl); }
   _a.addScaledVector(_b.set(0, 0, 1).applyQuaternion(_q), -sc);
   mats[s.part].compose(_a, _q, broke ? _s.set(sc, sc, sc) : ZERO);
  }
  applyParts(IRON); applyParts(GLASS); applyParts(RING); applyParts(SHELL);
  ironMat.emissive.setRGB(.1, .045, .06).multiplyScalar((1 + .8 * lean + 1.6 * S.flash + .5 * hurtK + .6 * Fc) * crimK * (1 - .7 * dimK) * sg);
  // the lanterns' glass: lit in form one, dark in the final form, and lit again at the very end when the lights are let go
  const lit = (1 - sm(0, .08, F)) * (1 - .5 * dimK) + (ended ? sm(.8, .95, eU) : 0);
  glassMat.opacity = .92 * cl(lit, 0, 1); GLASS.mesh.visible = glassMat.opacity > .01;

  // the corona
  const bp = COR.pos, bc = COR.col, BV = COR.V, waveC = name === 'hurt' ? u * TAU * 1.1 : 0, waveK = name === 'hurt' ? 1 - sm(.6, 1, u) : 0;
  COR.mesh.position.copy(CEN);
  for (let i = 0; i < NB; i++) {
   const b = BL[i], th = lerp(b.th, b.th2, Fc), dx = Math.sin(th), dy = Math.cos(th), wx = dy, wy = -dx;
   const fl = 1 + (.06 + .1 * Fc) * Math.sin(t * b.f1 * (1 + Fc) + b.p1) + (.04 + .08 * Fc) * Math.sin(t * 6.3 + b.p2);
   const wv = waveK * Math.exp(-Math.pow(wrapA(b.th - waveC), 2) * 5);
   const out = ended ? 1 - sm(b.outU, b.outU + .045, eU) : 1;
   const L = lerp(b.L1, b.L2, Fc) * fl * (1 + .4 * wv + .45 * flare + .25 * crackK * Math.sin(t * 31 + i)) * (.12 + .88 * out) * (1 - .7 * dimK);
   const R0 = b.fleck ? lerp(SR, b.R2, F) : lerp(SR * .86, b.R2, F), W0 = lerp(b.W1, b.W2, Fc) * (b.fleck ? Fc : 1);
   const br = (1 + .9 * wv + .6 * flare + .25 * lean + .5 * S.flash + .35 * Fc) * Math.pow(out, .8) * (1 - .75 * dimK) * (b.L1 > 0 ? 1 : Fc) * sg;
   if (ended && !b.puffed && eU >= b.outU + .02 && L > .02) { b.puffed = true; _a.set(dx * (R0 + L * .7), dy * (R0 + L * .7), 0).applyQuaternion(COR.mesh.quaternion).add(CEN); W(_a); for (let k = 0; k < 8; k++) emit(MO, _a.x, _a.y, _a.z, (rnd() - .5) * .8, .3 + rnd() * .6, (rnd() - .5) * .8, 1 + rnd() * .8, rnd() < .5 ? ROSE : CRIM, .9, .09, .02, .8); }
   const curl = lerp(b.curl, b.curl2, Fc), wig = lerp(.07, .16, Fc);
   for (let s = 0; s <= BS; s++) {
    const f = s / BS, side = L * (curl * Math.sin(f * 2.6 + .2) + wig * f * Math.sin(f * 5 - t * b.f2 + b.p2)) - .3 * lean * L * f * f * wx;
    const r = R0 + f * L, cx = dx * r + wx * side, cy = dy * r + wy * side + (Fc * .25 * L * f * f);
    const hw = W0 * 1.75 * Math.pow(f + .02, .38) * Math.pow(1 - f, .85) * (1 + .2 * flare) + .002;
    const cf = Math.pow(f, 1.15), e = Math.min(1.5, br * (.82 + .25 * f));
    const cr = lerp(lerp(.8, 1, Fc), 1, cf), cg = lerp(lerp(.1, .05, Fc), lerp(.78, .7, Fc), cf * cf), cb = lerp(lerp(.22, .15, Fc), lerp(.84, .76, Fc), cf * cf), cov = lerp(.78, .4, Fc), gl = lerp(.2, .42, Fc);
    for (let c = 0; c < 3; c++) {
     const a = c - 1, j = i * BV + s * 3 + c, al = cov * (a === 0 ? 1 : .42) * Math.min(1, e), k = (al + gl * (a === 0 ? 1 : .7)) * e;
     bp[j * 3] = cx + wx * hw * a; bp[j * 3 + 1] = cy + wy * hw * a; bp[j * 3 + 2] = 0;
     bc[j * 4] = cr * k; bc[j * 4 + 1] = cg * k; bc[j * 4 + 2] = cb * k; bc[j * 4 + 3] = al;
    }
   }
  }
  COR.g.attributes.position.needsUpdate = true; COR.g.attributes.aCol.needsUpdate = true;

  // the curtain (form one) and the ribbons of flame (the final form)
  const sp = CUR.pos, sc4 = CUR.col, SV = CUR.V, swK = 1 + 1.5 * flare + 2.5 * hurtK + 3 * crackK, fadeS = (ended ? 1 - sm(.3, .6, eU) : 1) * sg;
  const yTop1 = SC1 - .8, yTop2 = SC2 - 1.25, top = lerp(yTop1, yTop2, Fc) + (CEN.y - SC);
  for (let k = 0; k < NS; k++) {
   const st = ST[k], Fk = cl(F * 1.25 - .25 * (st.ph / 9), 0, 1.15);
   for (let s = 0; s <= SS; s++) {
    const f = s / SS;
    // form one: a pleated cone, narrow under the eclipse and as wide as the bowl at the bottom
    const r1 = .4 + .8 * Math.pow(f, 1.45) + st.pleat * (.4 + f), sway = (.05 * Math.sin(t * .9 + st.ph + f * 3) + .03 * Math.sin(t * 2.1 + st.ph2 + f * 6)) * f * swK;
    const x1 = st.o.x * r1 + st.tg.x * sway + .25 * pull * f * (1 - f) * 0, y1 = lerp(yTop1, 1.26, f), z1 = st.o.z * r1 + st.tg.z * sway + .5 * pull * f * (1 - f);
    // the final form: a wave running down a path from under the heart, to the bowl (inner ones) or out into the air (outer ones)
    const env = Math.sin(PI * Math.min(1, f * 1.05)), wave = Math.sin(f * st.n - t * st.sp + st.ph), wave2 = Math.sin(f * st.n * .6 - t * st.sp * .7 + st.ph2);
    const g2 = st.inner ? f : 1 - (1 - f) * (1 - f), bul = st.inner ? 1.5 * st.amp * env : .6 * env;
    let x2 = lerp(st.o.x * .5, st.end.x, g2) + st.o.x * bul + st.tg.x * st.amp * wave * (.25 + f) + st.o.x * .3 * wave2 * f;
    let y2 = lerp(yTop2, st.end.y, st.inner ? f : Math.pow(f, .7)) + (st.inner ? 0 : 1.3 * sm(.7, 1, f) * sm(.7, 1, f) + .3 * wave2 * f);
    let z2 = lerp(st.o.z * .5, st.end.z, g2) + st.o.z * bul * .7 + st.tg.z * st.amp * wave * (.25 + f) + st.o.z * .3 * wave2 * f;
    const m = cl(Fk, 0, 1.08), x = lerp(x1, x2, m) + (CEN.x) * (1 - f), y = lerp(y1, y2, m) + (CEN.y - SC) * (1 - f), z = lerp(z1, z2, m);
    const hw = lerp(TAU * r1 / NS * .72, (.36 * (1 - .8 * f) + .04) * (st.inner ? 1 : 1.2), Fc);
    const tw = Fc * (st.ph + f * 2.6 + t * .5), wxx = st.tg.x * Math.cos(tw) + st.o.x * Math.sin(tw), wzz = st.tg.z * Math.cos(tw) + st.o.z * Math.sin(tw), wyy = .35 * Math.sin(tw * 1.3) * Fc;
    // colour: ash rose glowing at the foot in form one; hot crimson with a pale core in the final form
    const glow = Math.pow(f, 2.2), l1r = lerp(.82, 1, glow), l1g = lerp(.5, .4, glow), l1b = lerp(.58, .48, glow), a1 = lerp(.66, .82, f) * st.sh;
    const hot = 1 - .7 * f, l2r = 1, l2g = lerp(.12, .62, hot * hot), l2b = lerp(.24, .68, hot * hot), a2 = .5;
    const e1 = st.sh * (1 + .5 * glow) * (1 - .6 * dimK) * (1 + .6 * crackK), e2 = (1.05 - .25 * f) * (1 + .5 * flare + .4 * S.flash);
    const rr = lerp(l1r * e1, l2r * e2, Fc), gg = lerp(l1g * e1, l2g * e2, Fc), bb = lerp(l1b * e1, l2b * e2, Fc), cov = lerp(a1, a2, Fc) * (st.inner || F < 1 ? 1 : 1);
    const tipFade = lerp(1, 1 - sm(.82, 1, f), Fc) * fadeS;
    for (let c = 0; c < 3; c++) {
     const a = c - 1, j = k * SV + s * 3 + c, ke = (a === 0 ? 1 : lerp(.62, .45, Fc)) * tipFade;
     sp[j * 3] = x + wxx * hw * a; sp[j * 3 + 1] = y + wyy * hw * a - (ended ? 2.5 * sm(.3, .6, eU) * f : 0); sp[j * 3 + 2] = z + wzz * hw * a;
     const al = cov * tipFade * (a === 0 ? 1 : lerp(.9, .4, Fc)), kq = ke * (al + lerp(.06, .5, Fc) * tipFade);
     sc4[j * 4] = rr * kq; sc4[j * 4 + 1] = gg * kq * (a === 0 ? 1 : lerp(1, .45, Fc)); sc4[j * 4 + 2] = bb * kq * (a === 0 ? 1 : lerp(1, .6, Fc)); sc4[j * 4 + 3] = al;
    }
   }
  }
  CUR.g.attributes.position.needsUpdate = true; CUR.g.attributes.aCol.needsUpdate = true;
  CUR.mesh.visible = fadeS > .01;

  // the eclipse and its rim (form one), the heart and its candle (the final form), the bowl's glow and the light
  const whole = !broke;
  sphere.visible = whole; sphere.position.copy(CEN); sphere.scale.setScalar(1 + .012 * Math.sin(t * 1.3) + .05 * S.flash + .03 * crackK * Math.sin(t * 40));
  const rk = whole ? (1 + 1.2 * S.flash + .6 * hurtK + .25 * lean) * (1 - .8 * dimK) * (1 + 2.5 * crackK) * sg : 0;
  rim.material.color.setRGB(rk, rk, rk); rim.position.copy(CEN); rim.scale.setScalar(RIM_S * sphere.scale.x * (1 + .3 * S.flash + .06 * crackK)); rim.visible = rk > .005;
  const hShrink = ended ? 1 - sm(.35, .68, eU) : 1, hS = Math.max(0, F) * hShrink * (1 + .03 * Math.sin(t * 2.3) + .08 * S.flash + .05 * flare);
  heart.visible = broke && hS > .01; heart.position.copy(CEN); heart.scale.setScalar(Math.max(.001, hS)); heart.rotation.y = t * .12;
  heartMat.uniforms.uK.value = (1 + .5 * S.flash + .3 * hurtK + .3 * flare) * sg; heartMat.uniforms.uT.value = t;
  // the candle: at the heart's centre; at the end it comes down to stand between the halves of the bowl, an ordinary small flame
  const cDown = ended ? sm(.5, .8, eU) : 0, cSize = lerp(.34, 1.05, cDown) * (.94 + .06 * Math.sin(t * 11) + .04 * Math.sin(t * 17.3));
  candleAt.copy(CEN).lerp(_a.set(0, .55, .2), cDown); candleOut = HEART * hS * (1 - cDown) + .03;
  candle.visible = broke; candle.material.opacity = cl(Fc * 2, 0, 1) * (ended ? 1 : sg); candle.scale.set(cSize * .8, cSize, 1);
  if (!broke) candle.position.copy(candleAt);
  coal.position.set(0, lerp(1.2, .5, Fc), 0); coal.scale.setScalar(lerp(1, .8, Fc));
  coalMat.color.copy(CRIM).lerp(HOT, Fc).multiplyScalar((.9 + .5 * Fc) * crimK * (1 + .5 * S.flash) * (1 - .6 * dimK) * sg);
  const pulse = .86 + .1 * Math.sin(t * 2.2) + .04 * Math.sin(t * 5.7), lowK = ended ? sm(.45, .7, eU) : 0;
  light.color.copy(CRIM).lerp(C1.copy(ROSE).lerp(HOT, .45), Fc * .8).lerp(WARM, ended ? sm(.55, .7, eU) : 0);
  light.intensity = (lerp(1.5, 2.6, Fc) * pulse * (1 + .4 * lean + 2.2 * S.flash + 1.5 * hurtK + 2 * crackK) * crimK * (1 - .75 * dimK) + 1.3 * finalK * (.9 + .1 * Math.sin(t * 9) * Math.sin(t * 5.3))) * sg;
  light.position.set(0, lerp(SC, 1.6, lowK), lerp(2.8 + .8 * Fc, 1.3, lowK)); light.distance = lerp(lerp(20, 30, Fc), 8, lowK);

  // glows and flames
  LANT.forEach((l, i) => {
   _a.copy(l.centre).applyMatrix4(mats[l.part]); const f = .8 + .12 * Math.sin(t * (6 + i) + i * 2) + .08 * Math.sin(t * 13.7 + i), on = cl(lit, 0, 1) * (crackK > 0 ? .5 + .5 * Math.sin(t * 37 + i * 3) : 1);
   setP(GL, i, _a, AMB, .5 * f * on * sg, 1.05); setP(FP, i, _a, WHITE, f * on * sg, .26 * (.9 + .1 * f));
  });
  setP(GL, 4, CEN, C1.copy(WHITE).lerp(ROSE, .35), (S.flash * .95 + .35 * hurtK + .5 * crackK) * sg, lerp(3.2, 7, Fc) + 4 * Math.max(0, 1 - S.flash) * (S.flash > 0 ? 1 : 0) + 2 * crackK);
  setP(GL, 5, _a.set(0, lerp(1.45, .8, Fc), 0), C1.copy(CRIM).lerp(HOT, Fc).lerp(WARM, finalK * .8), (.5 + .3 * Fc) * crimK * (1 - .5 * dimK) * sg + .35 * finalK * sg, lerp(3.2, 4.6, Fc) - 2.2 * finalK);
  setP(GL, 6, CEN, C1.copy(ROSE).lerp(HOT, .5), .5 * Fc * hShrink * (.9 + .1 * Math.sin(t * 3.1)) * sg, 9 * Math.max(.01, Fc));
  setP(GL, 7, _a.set(0, .5, .2), WARM, .5 * finalK * sg, 1.9 * finalK + .01);
  setP(FP, 4, _a.set(0, .2, 0), WHITE, 0, .01);
  _a.copy(HAND_TIP).applyMatrix4(HM[0]); setP(GL, 8, _a, C1.copy(CRIM).lerp(ROSE, .3), S.blowFlash * sg, 1.4 + 1.6 * (1 - S.blowFlash));
  _a.copy(HAND_PALM).applyMatrix4(HM[0]); setP(GL, 9, _a, CRIM, (.3 + .3 * Fc) * crimK * (1 - dimK) * sg, 1.3);
  flushP(GL); flushP(FP);

  // embers, the called flames and sparks
  const emK = (ended ? 1 - sm(.2, .55, eU) : 1) * (1 - dimK), cR = lerp(2.0, 3.6, Fc);
  S.acc.ember += dt * lerp(16, 40, Fc) * emK * fadeE;
  while (S.acc.ember >= 1) {
   S.acc.ember -= 1;
   if (rnd() < .6) { const a = rnd() * TAU, r = lerp(1.3, 1.8, Fc) + rnd() * (cR - 1.2); W(_a.set(Math.sin(a) * r, CEN.y + Math.cos(a) * r, (rnd() - .5) * .8)); emit(MO, _a.x, _a.y, _a.z, Math.sin(a) * .15, .45 + rnd() * (.4 + Fc), (rnd() - .5) * .1, 2.5 + rnd(), rnd() < .5 ? (Fc > .5 ? HOT : CRIM) : ROSE, .9, .08 + .04 * Fc, .02, .3, .1); }
   else { const x = (rnd() - .5) * 2, z = (rnd() - .5) * 1.8; W(_a.set(x, lerp(1.35, .7, Fc), z)); emit(MO, _a.x, _a.y, _a.z, -x * .25, 1.1 + rnd() * (.4 + 1.5 * Fc), -z * .25, 2.6, Fc > .5 ? HOT : CRIM, .85, .09, .04, .1); }
  }
  if (crackK > 0) { S.acc.spark += dt * 90 * crackK * crackK; while (S.acc.spark >= 1) { S.acc.spark -= 1; _c.set(rnd() - .5, rnd() - .5, rnd() - .2).normalize(); W(_a.copy(_c).multiplyScalar(SR).add(CEN)); emit(MO, _a.x, _a.y, _a.z, _c.x * 2.5, _c.y * 2.5, _c.z * 2.5, .5 + rnd() * .4, WHITE, 1, .1, .02, 2); } }
  S.acc.pull += dt * 170 * pull;
  while (S.acc.pull >= 1) {                                  // every flame on the moor, called in from the party's side
   S.acc.pull -= 1; W(_a.set((rnd() - .5) * 9, .2 + Math.pow(rnd(), 1.6) * 7, 5 + rnd() * 5)); W(_b.set((rnd() - .5) * .5, CEN.y + (rnd() - .5) * .5, (rnd() - .5) * .5));
   const tm = .6 + rnd() * .5; emit(MO, _a.x, _a.y, _a.z, (_b.x - _a.x) / tm, (_b.y - _a.y) / tm, (_b.z - _a.z) / tm, tm * .95, rnd() < .55 ? ROSE : CRIM, 1, .17, .08, 0);
  }
  if (name === 'hurt' && fresh) for (let i = 0; i < 30; i++) { const a = rnd() * TAU, r = lerp(SR, RS2, Fc); W(_a.set(Math.cos(a) * r, CEN.y + Math.sin(a) * r, .3)); emit(MO, _a.x, _a.y, _a.z, Math.cos(a) * (2 + rnd() * 2), Math.sin(a) * (2 + rnd() * 2), (rnd() - .5) * 2, .5 + rnd() * .3, rnd() < .5 ? ROSE : CRIM, 1, .12, .03, 2); }
  if (ended && finalK > 0) { S.acc.spark += dt * 3 * finalK; while (S.acc.spark >= 1) { S.acc.spark -= 1; W(_a.set((rnd() - .5) * .2, .7, .2 + (rnd() - .5) * .2)); emit(MO, _a.x, _a.y, _a.z, (rnd() - .5) * .2, .5 + rnd() * .3, (rnd() - .5) * .2, 1.2, WARM, .8, .05, .02, .2); } }
  stepP(MO, dt);
  lastName = name; lastU = u; snap = false;
 }

 // ---------- interface ----------
 const ACTIONS = {};
 for (const n in ACTS) { const d = ACTS[n]; ACTIONS[n] = Object.freeze({ dur: d.dur, hits: d.hits.slice(), cues: d.cues.slice(), hold: d.hold, interrupt: d.interrupt }); }
 Object.freeze(ACTIONS);
 function anchor(name, out) {
  out = out || V3();
  switch (name) {
   case 'hit': case 'hand': return W(out.copy(HAND_TIP).applyMatrix4(HM[0]));
   case 'hand2': return W(out.copy(HAND_TIP).applyMatrix4(HM[1]));
   case 'cradle': case 'flame': return W(out.set(0, 1.5, 0));
   case 'top': return W(out.set(0, lerp(8, 12, cl(Fv, 0, 1)), 0));
   default: return W(out.copy(CEN));                        // 'heart', 'core', 'sun'
  }
 }
 animate(0, 0, 0, 0);
 let tri = 0, draws = 0; const texs = new Set();
 root.traverse((o) => { if (o.isMesh || o.isPoints || o.isSprite) { draws++; if (o.isMesh) tri += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; if (o.isSprite) tri += 2; for (const k of ['map', 'emissiveMap']) if (o.material[k]) texs.add(o.material[k].image); if (o.material.uniforms && o.material.uniforms.uMap) texs.add(o.material.uniforms.uMap.value.image); } });
 fx.traverse((o) => { if (o.isPoints) draws++; });
 return {
  root, fx, animate, play, ACTIONS, anchor, reset, setForm,
  get form() { return form; },
  get busy() { return !!actv && !(actv.def.hold && actv.t >= actv.def.dur - 1e-6); },
  get action() { return actv ? actv.name : ''; },
  get progress() { return actv ? Math.min(1, actv.t / actv.def.dur) : -1; },
  get state() { return state; }, set state(v) { if (v) Object.assign(state, v); },
  setFade(f) { fadeE = cl(+f, 0, 1); },
  get gone() { return !!actv && actv.name === 'ending' && actv.t >= actv.def.dur; },
  get height() { return lerp(8, 12, cl(Fv, 0, 1)); }, get width() { return lerp(4.8, 9.6, cl(Fv, 0, 1)); },
  stats: { triangles: Math.round(tri), drawCalls: draws, textures: texs.size, bones: 0 }
 };
}
