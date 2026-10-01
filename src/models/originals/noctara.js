// Imported unchanged from reference/demos/noctara-in-the-night-square.html. three.js r128 (global THREE).
function makeNoctaraOriginal(opts) {
 'use strict';
 // Code-built model. Units are meters, Y up, facing +Z, standing with the hem on y = 0. Her right side is -X.
 // Her robes, sleeves, cape and veil are rebuilt every frame from her pose, so they hang, spread and trail without hair or cloth simulation.
 opts = opts || {};
 const TAU = Math.PI * 2, PI = Math.PI;
 let seed = 4471;
 const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
 const cl = (v, a, b) => (v < a ? a : v > b ? b : v);
 const sm = (a, b, x) => { const t = cl((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
 const lerp = (a, b, t) => a + (b - a) * t;
 const win = (u, a, b, e) => sm(a - e, a + e, u) * (1 - sm(b - e, b + e, u));
 const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
 const tex = (c, rx, ry) => { const t = new THREE.CanvasTexture(c); if (rx) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry || rx); } t.anisotropy = 4; return t; };
 const V3 = () => new THREE.Vector3();

 const root = new THREE.Group(); root.name = 'Noctara';
 const base = new THREE.Group(); root.add(base); // sinks into the dark for Appear and Die
 const fx = new THREE.Group(); fx.name = 'NoctaraFX';
 const CLIP = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0.003); // nothing of her shows below the cobbles

 // ---------- materials: every surface gets a violet rim light so she reads in the dark ----------
 const U = { rim: { value: .25 }, rimC: { value: new THREE.Color(0xa274ff) } };
 const allMats = [];
 function std(color, rough, o, rimS) {
  const m = new THREE.MeshStandardMaterial(Object.assign({ color, roughness: rough, metalness: 0 }, o || {}));
  const rS = { value: rimS === undefined ? 1 : rimS };
  m.onBeforeCompile = (sh) => {
   sh.uniforms.uRim = U.rim; sh.uniforms.uRimC = U.rimC; sh.uniforms.uRimS = rS;
   sh.fragmentShader = 'uniform float uRim;\nuniform vec3 uRimC;\nuniform float uRimS;\n' + sh.fragmentShader.replace('#include <dithering_fragment>',
    'float nFr = 1.0 - abs(dot(normalize(normal), normalize(vViewPosition)));\n gl_FragColor.rgb += uRimC * (uRim * uRimS * pow(nFr, 2.6));\n#include <dithering_fragment>');
  };
  m.customProgramCacheKey = () => 'noctara-rim';
  m.clippingPlanes = [CLIP];
  allMats.push(m); return m;
 }

 // ---------- painted textures ----------
 const GOLD = '#b48d57', GOLDHI = 'rgba(255,236,190,.55)', GOLDE = '#6a5130';
 function fabric(W, H, baseCol) {
  const c = cvs(W, H), g = c.getContext('2d'), e = cvs(W, H), eg = e.getContext('2d');
  g.fillStyle = baseCol || '#17131d'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 70; i++) {
   const x = rnd() * W, w = 3 + rnd() * W * .03, a = (.03 + rnd() * .06).toFixed(3), gr = g.createLinearGradient(x - w, 0, x + w, 0);
   gr.addColorStop(0, 'rgba(140,110,170,0)'); gr.addColorStop(.5, 'rgba(140,110,170,' + a + ')'); gr.addColorStop(1, 'rgba(140,110,170,0)');
   g.fillStyle = gr; g.fillRect(x - w, 0, w * 2, H);
  }
  const id = g.getImageData(0, 0, W, H), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const n = (rnd() - .5) * 9; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
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
 const fin = (F) => [tex(F.c), tex(F.e)];

 // skirt: u runs around her (front at the middle), v runs waist to hem
 const skirtF = fabric(1024, 512);
 {
  const F = skirtF, W = F.W, H = F.H, cx = W / 2;
  F.g.fillStyle = '#3d1b5c'; for (const s of [-1, 1]) F.g.fillRect(cx + s * 74 - (s < 0 ? 16 : 0), 0, 16, H); // the outer robe's turned-back lining
  for (const s of [-1, 1]) gRect(F, cx + s * 66 - 5, 0, 10, H);
  for (const s of [-1, 1]) gLine(F, 3, (c) => { c.moveTo(cx + s * 50, 40); c.lineTo(cx + s * 50, H - 60); });
  gRect(F, 0, H - 20, W, 13); gRect(F, 0, H - 34, W, 3);
  // the spear down the front panel
  gLine(F, 4, (c) => { c.moveTo(cx, 10); c.lineTo(cx, H - 120); });
  gLine(F, 3, (c) => { c.moveTo(cx, H - 70); c.lineTo(cx - 22, H - 118); c.lineTo(cx, H - 190); c.lineTo(cx + 22, H - 118); c.closePath(); });
  gLine(F, 2.5, (c) => { c.moveTo(cx - 40, H - 40); c.quadraticCurveTo(cx - 40, H - 110, cx, H - 150); c.quadraticCurveTo(cx + 40, H - 110, cx + 40, H - 40); });
  // the arch on the back of the robe
  for (const x0 of [0, W]) gLine(F, 3, (c) => { c.moveTo(x0 - 60, H - 40); c.quadraticCurveTo(x0 - 60, H - 160, x0, H - 230); c.quadraticCurveTo(x0 + 60, H - 160, x0 + 60, H - 40); });
 }
 // bodice: u around, v neck to waist
 const bodF = fabric(512, 256);
 {
  const F = bodF, W = F.W, H = F.H, cx = W / 2;
  gLine(F, 3, (c) => { c.moveTo(cx, 34); c.lineTo(cx, H - 6); });
  gLine(F, 2.5, (c) => { c.moveTo(cx, H - 4); c.lineTo(cx - 9, H - 40); c.lineTo(cx, H - 70); c.lineTo(cx + 9, H - 40); c.closePath(); });
  for (const s of [-1, 1]) {
   gLine(F, 2.5, (c) => { c.moveTo(cx + s * 70, 18); c.quadraticCurveTo(cx + s * 52, 120, cx + s * 4, H - 30); });
  }
  gRect(F, 0, H - 7, W, 6);
 }
 const sleeveF = fabric(512, 256);
 { const F = sleeveF; gRect(F, 0, F.H - 15, F.W, 10); gRect(F, 0, F.H - 26, F.W, 3); }
 const capeF = fabric(1024, 512);
 {
  const F = capeF, W = F.W, H = F.H, cx = W / 2;
  gRect(F, 0, 0, 12, H); gRect(F, W - 12, 0, 12, H); gRect(F, 20, 0, 3, H); gRect(F, W - 23, 0, 3, H);
  gRect(F, 0, H - 16, W, 11); gRect(F, 0, H - 28, W, 3);
  gLine(F, 4, (c) => { c.moveTo(cx - 90, H - 20); c.quadraticCurveTo(cx - 90, H - 170, cx, H - 270); c.quadraticCurveTo(cx + 90, H - 170, cx + 90, H - 20); });
  gLine(F, 3, (c) => { c.moveTo(cx, H - 60); c.lineTo(cx - 26, H - 130); c.lineTo(cx, H - 230); c.lineTo(cx + 26, H - 130); c.closePath(); });
  gLine(F, 3, (c) => { c.moveTo(cx, 30); c.lineTo(cx, H - 290); });
 }
 const collarF = fabric(512, 128);
 { const F = collarF; gRect(F, 0, 0, F.W, 9); gRect(F, 0, 15, F.W, 2); gRect(F, 0, 0, 7, F.H); gRect(F, F.W - 7, 0, 7, F.H); }
 const veilF = fabric(512, 512, '#120f17');
 { const F = veilF; gRect(F, 0, 0, 5, F.H); gRect(F, F.W - 5, 0, 5, F.H); gRect(F, 0, F.H - 6, F.W, 5); }

 // the purple lining: satin by light, a starfield in the dark
 function lining(W, H) {
  const c = cvs(W, H), g = c.getContext('2d'), e = cvs(W, H), eg = e.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#3a1762'); gr.addColorStop(1, '#5b2b8e'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 60; i++) {
   const x = rnd() * W, w = 6 + rnd() * W * .04, a = (.05 + rnd() * .1).toFixed(3), col = rnd() < .5 ? '20,4,40' : '190,150,240', q = g.createLinearGradient(x - w, 0, x + w, 0);
   q.addColorStop(0, 'rgba(' + col + ',0)'); q.addColorStop(.5, 'rgba(' + col + ',' + a + ')'); q.addColorStop(1, 'rgba(' + col + ',0)'); g.fillStyle = q; g.fillRect(x - w, 0, w * 2, H);
  }
  eg.fillStyle = '#000'; eg.fillRect(0, 0, W, H);
  for (let i = 0; i < 30; i++) {
   const x = rnd() * W, y = rnd() * H, r = 20 + rnd() * 90, hue = rnd() < .7 ? '130,60,220' : '70,90,230', q = eg.createRadialGradient(x, y, 0, x, y, r);
   q.addColorStop(0, 'rgba(' + hue + ',' + (.14 + rnd() * .2).toFixed(2) + ')'); q.addColorStop(1, 'rgba(' + hue + ',0)'); eg.fillStyle = q; eg.fillRect(x - r, y - r, r * 2, r * 2);
  }
  for (let i = 0; i < 1100; i++) {
   const x = rnd() * W, y = rnd() * H, b = rnd(), s = b > .97 ? 2.4 : b > .85 ? 1.5 : .9;
   eg.fillStyle = 'rgba(' + (225 + 30 * rnd() | 0) + ',' + (215 + 40 * rnd() | 0) + ',255,' + (.35 + .65 * b).toFixed(2) + ')'; eg.fillRect(x, y, s, s);
   if (b > .988) { eg.fillRect(x - 4, y + .7, 9, .9); eg.fillRect(x + .7, y - 4, .9, 9); }
  }
  return [tex(c), tex(e)];
 }
 const [linMap, linEm] = lining(512, 512);

 // face, painted around a sphere: u = .25 faces forward, v runs from the crown down
 function blob(g, x, y, r, col, sx) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, col.replace(/[\d.]+\)$/, '0)'));
  g.save(); g.translate(x, y); g.scale(sx || 1, 1); g.translate(-x, -y); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
 }
 function faceTex() {
  const W = 1024, H = 512, c = cvs(W, H), g = c.getContext('2d'), e = cvs(W, H), eg = e.getContext('2d'), cx = 256;
  g.fillStyle = '#c9b8c6'; g.fillRect(0, 0, W, H);
  blob(g, cx, 285, 190, 'rgba(236,224,234,.9)', .9);
  blob(g, cx, 250, 80, 'rgba(246,238,244,.5)', 1.2);
  for (const s of [-1, 1]) {
   blob(g, cx + s * 78, 330, 40, 'rgba(110,70,105,.28)');   // hollow cheeks
   blob(g, cx + s * 64, 300, 26, 'rgba(250,240,248,.35)');  // cheekbone light
   blob(g, cx + s * 60, 244, 36, 'rgba(70,35,90,.55)', 1.25); // dark violet eye sockets
  }
  blob(g, cx, 395, 40, 'rgba(100,70,100,.25)', 1.6);  // under the chin
  // nose: a lit bridge, shadow down one side, small nostrils
  blob(g, cx, 275, 14, 'rgba(255,248,252,.45)', .6);
  g.fillStyle = 'rgba(110,70,100,.28)'; g.fillRect(cx + 7, 262, 6, 40);
  for (const s of [-1, 1]) blob(g, cx + s * 9, 306, 6, 'rgba(70,30,60,.55)');
  // eyes: heavy lined almonds, pale violet irises under a lowered lid
  eg.fillStyle = '#000'; eg.fillRect(0, 0, W, H);
  for (const s of [-1, 1]) {
   const ex = cx + s * 60, ey = 248;
   g.fillStyle = '#d5cbd6'; g.beginPath(); g.moveTo(ex - 24, ey + 1); g.quadraticCurveTo(ex, ey - 13, ex + 24, ey + 1); g.quadraticCurveTo(ex, ey + 10, ex - 24, ey + 1); g.fill();
   g.fillStyle = '#7d5fae'; g.beginPath(); g.arc(ex, ey + 1, 8.5, 0, TAU); g.fill();
   g.fillStyle = '#100816'; g.beginPath(); g.arc(ex, ey + 1, 3.6, 0, TAU); g.fill();
   g.fillStyle = 'rgba(40,20,60,.85)'; g.fillRect(ex - 25, ey - 12, 50, 8); // lowered upper lid
   g.strokeStyle = '#120a18'; g.lineWidth = 3.6; g.beginPath(); g.moveTo(ex - 25, ey + 1); g.quadraticCurveTo(ex, ey - 13, ex + 25, ey - 1); g.lineTo(ex + s * 31 + (s < 0 ? 0 : 0), ey - 6); g.stroke();
   g.lineWidth = 1.6; g.beginPath(); g.moveTo(ex - 22, ey + 3); g.quadraticCurveTo(ex, ey + 11, ex + 22, ey + 2); g.stroke();
   g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.arc(ex - 3, ey - 2, 1.6, 0, TAU); g.fill();
   // arched dark brows, high at the outer end
   g.strokeStyle = '#1d1420'; g.lineWidth = 4.5; g.lineCap = 'round'; g.beginPath(); g.moveTo(ex - s * 26, ey - 22); g.quadraticCurveTo(ex + s * 6, ey - 38, ex + s * 28, ey - 30); g.stroke();
   const q = eg.createRadialGradient(ex, ey + 1, 0, ex, ey + 1, 10); q.addColorStop(0, '#d8b8ff'); q.addColorStop(.6, '#8e5cff'); q.addColorStop(1, 'rgba(0,0,0,0)'); eg.fillStyle = q; eg.fillRect(ex - 12, ey - 11, 24, 24);
  }
  // plum lips, set in a cold line
  const my = 338;
  g.fillStyle = '#6c3154'; g.beginPath(); g.moveTo(cx - 25, my); g.quadraticCurveTo(cx - 10, my - 10, cx, my - 5); g.quadraticCurveTo(cx + 10, my - 10, cx + 25, my); g.quadraticCurveTo(cx, my + 14, cx - 25, my); g.fill();
  g.strokeStyle = '#2e1022'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(cx - 26, my + 1); g.quadraticCurveTo(cx, my + 3, cx + 26, my + 1); g.stroke();
  blob(g, cx, my + 7, 9, 'rgba(255,200,230,.35)', 1.6);
  return [tex(c), tex(e)];
 }
 const [faceMap, faceEm] = faceTex();
 function hairTex() {
  const W = 512, H = 256, c = cvs(W, H), g = c.getContext('2d'), cx = 128;
  g.fillStyle = '#16111a'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 900; i++) { const x = rnd() * W, y = rnd() * H; g.strokeStyle = 'rgba(' + (rnd() < .5 ? '90,70,110' : '5,2,8') + ',' + (.25 + rnd() * .3).toFixed(2) + ')'; g.lineWidth = .8; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - .5) * 6, y + 10 + rnd() * 30); g.stroke(); }
  // center part and the swept-back hairline that frames her face
  g.globalCompositeOperation = 'destination-out';
  g.beginPath(); g.moveTo(cx - 62, H); g.lineTo(cx - 58, 112); g.quadraticCurveTo(cx - 44, 64, cx - 3, 52); g.lineTo(cx + 3, 52); g.quadraticCurveTo(cx + 44, 64, cx + 58, 112); g.lineTo(cx + 62, H); g.fill();
  g.fillRect(0, 205, W, H);
  g.globalCompositeOperation = 'source-over';
  g.strokeStyle = 'rgba(160,140,170,.5)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx, 0); g.lineTo(cx, 52); g.stroke();
  return tex(c);
 }
 const hairMap = hairTex();

 const [skMap, skEm] = fin(skirtF), [bdMap, bdEm] = fin(bodF), [slMap, slEm] = fin(sleeveF), [cpMap, cpEm] = fin(capeF), [coMap, coEm] = fin(collarF), [veMap, veEm] = fin(veilF);
 const GE = new THREE.Color(0xffffff);
 const M = {
  skirt: std(0xffffff, .82, { map: skMap, emissive: GE, emissiveMap: skEm, emissiveIntensity: .35 }),
  bodice: std(0xffffff, .7, { map: bdMap, emissive: GE, emissiveMap: bdEm, emissiveIntensity: .35 }),
  sleeve: std(0xffffff, .82, { map: slMap, emissive: GE, emissiveMap: slEm, emissiveIntensity: .35 }),
  cape: std(0xffffff, .84, { map: cpMap, emissive: GE, emissiveMap: cpEm, emissiveIntensity: .35 }),
  collar: std(0xffffff, .6, { map: coMap, emissive: GE, emissiveMap: coEm, emissiveIntensity: .35 }),
  veil: std(0xffffff, .78, { map: veMap, emissive: GE, emissiveMap: veEm, emissiveIntensity: .3 }, .8),
  lining: std(0xffffff, .55, { map: linMap, emissive: GE, emissiveMap: linEm, emissiveIntensity: .12, side: THREE.BackSide }, 1.3),
  collarIn: std(0x4c2276, .45, { side: THREE.BackSide, emissive: 0x1c0a30 }, 1.3),
  skin: std(0xece0ea, .55, { emissive: 0x241a26 }, .7),
  face: std(0xffffff, .55, { map: faceMap, emissive: GE, emissiveMap: faceEm, emissiveIntensity: 0 }, .7),
  hair: std(0xffffff, .7, { map: hairMap, alphaTest: .5 }, .8),
  gold: std(0xc9a063, .32, { metalness: .85, emissive: 0x3a2810 }, .6),
  crystal: std(0x1d0e30, .16, { metalness: .25, emissive: 0x7a3ce0, emissiveIntensity: .4 }, 2),
  gem: std(0x07040a, .08, { metalness: .6, emissive: 0x3a1470, emissiveIntensity: .5 }, 1.5),
  rock: std(0x1b1226, .45, { metalness: .15, emissive: 0x23103c }, 2.5)
 };
 const CLOTH_EM = [M.skirt, M.bodice, M.sleeve, M.cape, M.collar, M.veil];

 // ---------- skeleton: plain joints, no skinning ----------
 const J = (parent, x, y, z) => { const o = new THREE.Object3D(); o.position.set(x, y, z); parent.add(o); return o; };
 const PELVIS_Y = 1.03, UA = .28, FA = .25, ARM = UA + FA, CUFF = .06;
 const pelvis = J(base, 0, PELVIS_Y, 0);
 const chest = J(pelvis, 0, 0, 0);
 const neck = J(chest, 0, .425, -.006);
 const head = J(neck, 0, .07, 0);
 const HC = new THREE.Vector3(0, .1, .012), HR = [.078, .108, .092];
 const arms = [-1, 1].map((sx) => {
  const sh = J(chest, sx * .165, .392, -.015), el = J(sh, 0, -UA, 0), wr = J(el, 0, -FA, 0);
  return { sx, sh, el, wr, fingers: [], thumb: null };
 });
 const R = arms[0], L = arms[1];

 // ---------- body, head and hands ----------
 function mesh(geo, mat, parent) { const m = new THREE.Mesh(geo, mat); parent.add(m); return m; }
 // torso: an elliptical lathe from the throat down to the waist
 {
  const P = [[.47, .046, .046], [.44, .08, .072], [.41, .148, .1], [.38, .166, .112], [.33, .162, .12], [.28, .154, .128], [.24, .15, .126], [.19, .142, .114], [.12, .13, .1], [.05, .125, .095], [-.03, .128, .098]];
  const nr = 30, nu = 40, pos = [], uv = [], idx = [];
  const at = (k) => { const f = k * (P.length - 1), i = Math.min(P.length - 2, Math.floor(f)), t = f - i, s = t * t * (3 - 2 * t); return [lerp(P[i][0], P[i + 1][0], t), lerp(P[i][1], P[i + 1][1], s), lerp(P[i][2], P[i + 1][2], s)]; };
  for (let j = 0; j <= nr; j++) {
   const [y, rx, rz] = at(j / nr);
   for (let i = 0; i <= nu; i++) {
    const th = (i / nu - .5) * TAU, x = Math.sin(th) * rx; let z = Math.cos(th) * rz;
    if (z > 0) z += .03 * Math.exp(-Math.pow((y - .262) / .045, 2)) * Math.exp(-Math.pow((Math.abs(x) - .068) / .045, 2));
    pos.push(x, y, z); uv.push(i / nu, 1 - j / nr);
   }
  }
  for (let j = 0; j < nr; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  mesh(g, M.bodice, chest);
 }
 { const g = new THREE.CylinderGeometry(.036, .043, .12, 16, 1, true); g.translate(0, .045, 0); mesh(g, M.skin, neck); }
 function headGeo(sc, nose) {
  const g = new THREE.SphereGeometry(1, 48, 32), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
   let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
   const jaw = sm(-.05, -.95, y);
   x *= 1 - .3 * jaw; if (z > 0) z *= 1 - .08 * jaw; else z *= 1.06;
   if (y < -.55 && z > 0) z += .06 * sm(-.55, -.85, y);
   if (nose && z > .5) { const b = Math.exp(-x * x / .006) * win(y, -.33, .02, .06); z += .16 * b * (1 - sm(-.1, -.33, y) * .3); }
   if (z > 0 && y > .05 && y < .35) z += .03 * Math.exp(-Math.pow((y - .2) / .08, 2)) * Math.exp(-x * x / .15);
   p.setXYZ(i, x * HR[0] * sc[0], y * HR[1] * sc[1], z * HR[2] * sc[2]);
  }
  g.translate(HC.x, HC.y, HC.z); g.computeVertexNormals(); return g;
 }
 mesh(headGeo([1, 1, 1], true), M.face, head);
 mesh(headGeo([1.07, 1.05, 1.08], false), M.hair, head);
 // crown: a gold band with dark crystals, tallest at the front
 const crown = new THREE.Group(); crown.position.set(0, .176, .006); crown.rotation.x = .08; head.add(crown);
 {
  const band = new THREE.CylinderGeometry(.07, .073, .024, 40, 1, true); band.scale(1, 1, 1.14); mesh(band, M.gold, crown);
  const lip = new THREE.TorusGeometry(.0715, .0032, 6, 40); lip.rotateX(PI / 2); lip.scale(1, 1, 1.14); lip.translate(0, .012, 0); mesh(lip, M.gold, crown);
  const lip2 = lip.clone(); lip2.translate(0, -.024, 0); mesh(lip2, M.gold, crown);
  const spikes = [[0, .125, .02], [.4, .088, .016], [-.4, .088, .016], [.8, .07, .014], [-.8, .07, .014], [1.2, .056, .012], [-1.2, .056, .012], [1.65, .045, .011], [-1.65, .045, .011], [2.2, .04, .01], [-2.2, .04, .01], [2.75, .036, .01], [-2.75, .036, .01]];
  for (const [a, h, w] of spikes) {
   const g = new THREE.OctahedronGeometry(1, 0); g.scale(w, h * .62, w * .75); g.translate(0, h * .5, 0);
   const m = mesh(g, M.crystal, crown); m.position.set(Math.sin(a) * .072, .006, Math.cos(a) * .072 * 1.14); m.rotation.y = a; m.rotation.x = .12;
   const ga = a + .2 * (a >= 0 ? 1 : -1);
   if (Math.abs(a) < 2.6) { const c = new THREE.ConeGeometry(.005, h * .55, 4); c.translate(0, h * .27, 0); const m2 = mesh(c, M.gold, crown); m2.position.set(Math.sin(ga) * .073, .01, Math.cos(ga) * .073 * 1.14); m2.rotation.set(.1, ga, 0); }
  }
 }
 // clasp: a black gem in gold at the throat
 { const g = new THREE.SphereGeometry(.02, 20, 14); g.scale(1, 1, .75); const m = mesh(g, M.gem, chest); m.position.set(0, .425, .09); const r = new THREE.TorusGeometry(.024, .0055, 8, 28); const m2 = mesh(r, M.gold, chest); m2.position.set(0, .425, .088); }
 // hands: long pale fingers that open, cup, point and close into a fist
 const FING = [[.026, [.046, .04]], [.009, [.05, .044]], [-.009, [.047, .04]], [-.025, [.036, .032]]];
 function seg(len, r0, r1, parent) {
  const g = new THREE.CylinderGeometry(r1, r0, len, 8); g.translate(0, -len / 2, 0);
  const tip = new THREE.SphereGeometry(r1, 8, 6); tip.translate(0, -len, 0);
  const m = mesh(g, M.skin, parent); mesh(tip, M.skin, m); return m;
 }
 for (const A of arms) {
  const sx = A.sx;
  { const g = new THREE.CylinderGeometry(.024, .03, FA, 10, 1, true); g.translate(0, -FA / 2, 0); mesh(g, M.skin, A.el); }
  const palm = new THREE.SphereGeometry(1, 16, 12); palm.scale(.013, .046, .037); palm.translate(0, -.048, 0); mesh(palm, M.skin, A.wr);
  for (const [z, ln] of FING) {
   const f0 = new THREE.Object3D(); f0.position.set(0, -.085, z); A.wr.add(f0);
   const p0 = seg(ln[0], .0074, .0068, f0); const f1 = new THREE.Object3D(); f1.position.set(0, -ln[0], 0); p0.add(f1); seg(ln[1], .0066, .0056, f1);
   A.fingers.push({ f0, f1, z });
  }
  const t0 = new THREE.Object3D(); t0.position.set(-sx * .006, -.025, .032); A.wr.add(t0);
  const tp = seg(.036, .0085, .0075, t0); const t1 = new THREE.Object3D(); t1.position.set(0, -.036, 0); tp.add(t1); seg(.03, .0072, .006, t1);
  A.thumb = { t0, t1 };
 }
 // collar: tall pointed wings at the sides of her face, low at the back, open at the throat
 const collarHgt = (thF) => .07 + .06 * sm(1.4, .5, thF) + .19 * Math.exp(-Math.abs(thF - 1.15) / .33);
 const collarWing = (thF) => Math.exp(-Math.abs(thF - 1.15) / .33);
 const collarR = (thF, t) => .09 + .035 * t + .055 * t * t * collarWing(thF);
 {
  const nu = 56, nv = 8, pos = [], uv = [], idx = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
   const u = i / nu, ph = lerp(.42, TAU - .42, u), thF = ph < PI ? ph : TAU - ph, t = 1 - j / nv, r = collarR(thF, t);
   pos.push(Math.sin(ph) * r, .4 + collarHgt(thF) * t, Math.cos(ph) * r * .92); uv.push(u, 1 - j / nv);
  }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  mesh(g, M.collar, chest); mesh(g, M.collarIn, chest);
 }

 // ---------- dynamic cloth: rebuilt from her pose each frame ----------
 function grid(nu, nv, mat, mat2, flip) {
  const n = (nu + 1) * (nv + 1), pos = new Float32Array(n * 3), uv = new Float32Array(n * 2), idx = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const k = j * (nu + 1) + i; uv[k * 2] = i / nu; uv[k * 2 + 1] = 1 - j / nv; }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; if (flip) idx.push(a, b, c, b, d, c); else idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
  const ms = [mat, mat2].filter(Boolean).map((m) => { const o = new THREE.Mesh(g, m); o.frustumCulled = false; base.add(o); return o; });
  return { g, pos, nu, nv, ms };
 }
 function done(C, seam) {
  const g = C.g; g.attributes.position.needsUpdate = true; g.computeVertexNormals();
  if (seam) { const nr = g.attributes.normal.array, w = C.nu + 1; for (let j = 0; j <= C.nv; j++) { const a = j * w * 3, b = (j * w + C.nu) * 3; for (let q = 0; q < 3; q++) { const m = (nr[a + q] + nr[b + q]) / 2; nr[a + q] = nr[b + q] = m; } } }
  g.attributes.normal.needsUpdate = true;
 }
 const SK = grid(56, 20, M.skirt, M.lining);
 const SL = arms.map(() => grid(22, 22, M.sleeve, M.lining));
 const CP = grid(28, 24, M.cape, M.lining, true);
 const VE = grid(24, 26, M.veil);

 // her silhouette below the waist, shared by the robe and by everything that must stay outside it
 function skirtR(v, th, fl) {
  const r0 = .132 + .075 * sm(0, .2, v) + .36 * Math.pow(v, 1.45);
  const train = 1 + .62 * v * v * Math.pow(Math.max(0, -Math.cos(th)), 1.6);
  return r0 * train * (1 + .3 * fl * v * v);
 }
 const _m = new THREE.Matrix4(), _bi = new THREE.Matrix4(), _a = V3(), _b = V3(), _c = V3(), _d = V3(), _e = V3(), _n1 = V3(), _n2 = V3(), _ax = V3();
 const REL = { pel: new THREE.Matrix4(), ch: new THREE.Matrix4(), hd: new THREE.Matrix4(), sh: [new THREE.Matrix4(), new THREE.Matrix4()], el: [new THREE.Matrix4(), new THREE.Matrix4()], wr: [new THREE.Matrix4(), new THREE.Matrix4()] };
 const PC = V3(); // pelvis in base space
 function rel(out, o) { return out.multiplyMatrices(_bi, o.matrixWorld); }
 function pushOut(x, y, z, fl, out) {
  const dx = x - PC.x, dz = z - PC.z, d = Math.hypot(dx, dz) || 1e-6;
  let Rr = 0;
  if (y <= PELVIS_Y + .02) Rr = skirtR(cl((PELVIS_Y - y) / PELVIS_Y, 0, 1), Math.atan2(dx, dz), fl) + .025;
  else if (y < PELVIS_Y + .4) Rr = .175 * (1 - .25 * sm(PELVIS_Y + .3, PELVIS_Y + .4, y));
  const k = d < Rr ? Rr / d : 1;
  return out.set(PC.x + dx * k, y, PC.z + dz * k);
 }
 // veil rest shape, stored in head space (crown) and chest space (the fall down her back)
 const VREST = [];
 function buildVeilRest() {
  const nu = VE.nu, nv = VE.nv, v1 = .3, hc = V3().copy(HC).applyMatrix4(head.matrixWorld);
  const rx = HR[0] * 1.13, ry = HR[1] * 1.08, rz = HR[2] * 1.13;
  const chInv = new THREE.Matrix4().copy(chest.matrixWorld).invert(), hdInv = new THREE.Matrix4().copy(head.matrixWorld).invert();
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
   const u = i / nu * 2 - 1, v = j / nv, ph = u * 1.85, p = V3();
   const onHead = (al) => p.set(hc.x + Math.sin(al) * Math.sin(ph) * rx, hc.y + Math.cos(al) * ry, hc.z - Math.sin(al) * Math.cos(ph) * rz);
   let w = 0;
   if (v <= v1) onHead(lerp(.1, 1.72, v / v1));
   else {
    onHead(1.72); const d = (v - v1) / (1 - v1), Lh = .3 + .44 * Math.pow(1 - Math.abs(u), 1.5);
    const y = p.y - d * Lh, yc = y - PELVIS_Y, thF = PI - Math.abs(ph);
    let r = Math.hypot(p.x, p.z + .01) + .11 * sm(0, .45, d);
    const hg = collarHgt(thF);
    if (yc > .39 && yc < .4 + hg + .02) { const t = cl((yc - .4) / hg, 0, 1); r = Math.max(r, collarR(thF, t) * (thF < PI / 2 ? 1 : .95) + .022); }
    else if (yc <= .39) r = Math.max(r, .215 - .02 * Math.cos(ph));
    p.set(Math.sin(ph) * r, y, -Math.cos(ph) * r * .97 - .01);
    w = sm(0, .4, d);
   }
   VREST.push({ h: p.clone().applyMatrix4(hdInv), c: p.clone().applyMatrix4(chInv), w, d: v <= v1 ? 0 : (v - v1) / (1 - v1), u });
  }
 }
 root.updateMatrixWorld(true); buildVeilRest();

 function clothSkirt(P, t, lag) {
  const nu = SK.nu, nv = SK.nv, pos = SK.pos, fl = P.fl;
  for (let j = 0; j <= nv; j++) {
   const v = j / nv, yl = -PELVIS_Y * v, w = sm(.04, .7, v), lagK = Math.pow(v, 1.6) * .9;
   for (let i = 0; i <= nu; i++) {
    const th = (i / nu - .5) * TAU;
    let r = skirtR(v, th, fl);
    r *= 1 + (.045 * v + .05 * fl * v) * Math.sin(th * 9 + .6 * Math.sin(t * .8 + th * 2)) + .015 * v * Math.sin(th * 23);
    const x = Math.sin(th) * r, z = Math.cos(th) * r;
    _a.set(x, yl, z).applyMatrix4(REL.pel);
    _b.set(x + PC.x * .3, PELVIS_Y + yl, z + PC.z * .3);
    _a.lerp(_b, w);
    _a.x += lag.x * lagK; _a.z += lag.z * lagK;
    _a.y += fl * .14 * v * v * v * (.7 + .3 * Math.sin(th * 3 + t * 2.2)) + .006 * v * v * Math.sin(t * 1.3 + th * 5);
    if (j === nv) _a.y = Math.max(.004, _a.y); else _a.y = Math.max(.012, _a.y);
    const k = (j * (nu + 1) + i) * 3; pos[k] = _a.x; pos[k + 1] = _a.y; pos[k + 2] = _a.z;
   }
  }
  done(SK, true);
 }
 const sleeveR = (d) => { const s = d / ARM; return s < .5 ? lerp(.07, .06, s / .5) + .014 * sm(.36, .5, s) : .072 + .15 * Math.pow(sm(.5, 1.1, s), 1.3); };
 const sleeveH = (d) => .5 * Math.pow(sm(.45, 1.12, d / ARM), 1.6);
 function clothSleeve(A, ai, P, t, lag) {
  const C = SL[ai], nu = C.nu, nv = C.nv, pos = C.pos;
  const S = _c.setFromMatrixPosition(REL.sh[ai]), E = _d.setFromMatrixPosition(REL.el[ai]), Wr = _e.setFromMatrixPosition(REL.wr[ai]);
  const ue = REL.sh[ai].elements, fe = REL.el[ai].elements;
  for (let j = 0; j <= nv; j++) {
   const d = j / nv * (ARM + CUFF), s = d / ARM, k = sm(UA - .05, UA + .06, d);
   let cx, cy, cz;
   if (d <= UA) { const f = d / UA; cx = lerp(S.x, E.x, f); cy = lerp(S.y, E.y, f); cz = lerp(S.z, E.z, f); }
   else { const f = (d - UA) / FA; cx = lerp(E.x, Wr.x, f); cy = lerp(E.y, Wr.y, f); cz = lerp(E.z, Wr.z, f); }
   _ax.set(lerp(-ue[4], -fe[4], k), lerp(-ue[5], -fe[5], k), lerp(-ue[6], -fe[6], k)).normalize();
   _n1.set(lerp(ue[0], fe[0], k), lerp(ue[1], fe[1], k), lerp(ue[2], fe[2], k));
   _n1.addScaledVector(_ax, -_n1.dot(_ax)).normalize(); _n2.crossVectors(_ax, _n1);
   const r = sleeveR(d), hg = sleeveH(d), lagK = s * s * .5;
   for (let i = 0; i <= nu; i++) {
    const a = -i / nu * TAU, ca = Math.cos(a), sa = Math.sin(a);
    const dx = _n1.x * ca + _n2.x * sa, dy = _n1.y * ca + _n2.y * sa, dz = _n1.z * ca + _n2.z * sa;
    const q = Math.pow(Math.max(0, -dy), 1.3) * hg;
    let x = cx + dx * r + lag.x * lagK, y = cy + dy * r - q + .012 * s * s * Math.sin(t * 1.6 + a * 2 + d * 6), z = cz + dz * r + lag.z * lagK - q * .12;
    pushOut(x, y, z, P.fl, _b); x = _b.x; z = _b.z; y = Math.max(.01, y);
    const kk = (j * (nu + 1) + i) * 3; pos[kk] = x; pos[kk + 1] = y; pos[kk + 2] = z;
   }
  }
  done(C, true);
 }
 const CAPE_TOP = [];
 function armPoint(ai, s, out) {
  const S = _c.setFromMatrixPosition(REL.sh[ai]), E = _d.setFromMatrixPosition(REL.el[ai]), W = _e.setFromMatrixPosition(REL.wr[ai]);
  return s < .5 ? out.copy(S).lerp(E, s / .5) : out.copy(E).lerp(W, (s - .5) / .5);
 }
 function clothCape(P, t, lag) {
  const nu = CP.nu, nv = CP.nv, pos = CP.pos, cs = P.cs, ce = REL.ch.elements;
  const backX = -ce[8], backZ = -ce[10];
  for (let i = 0; i <= nu; i++) {
   const u = i / nu * 2 - 1, au = Math.abs(u), ps = u * 1.95;
   const A = _a.set(Math.sin(ps) * .182, .392 - .025 * u * u, -Math.cos(ps) * .128 - .02).applyMatrix4(REL.ch);
   const w = cs * sm(.15, .6, au);
   if (w > 0) { armPoint(u < 0 ? 0 : 1, sm(.22, .96, au), _n1); _n1.x += backX * .04; _n1.z += backZ * .04; _n1.y += .015; A.lerp(_n1, w); }
   const pb = u * 2.05, rb = .5 + .27 * Math.pow(1 - au, 1.2);
   const B = _b.set(PC.x * .3 + Math.sin(pb) * rb, .004, PC.z * .3 - Math.cos(pb) * rb * 1.05);
   if (w > 0) {
    _n2.set(A.x - PC.x, 0, A.z - PC.z); const dl = _n2.length() || 1; _n2.multiplyScalar(1 / dl);
    _n1.set(A.x + _n2.x * (.22 + .25 * au) + backX * .1, .004, A.z + _n2.z * (.22 + .25 * au) + backZ * .1);
    B.lerp(_n1, w);
   }
   for (let j = 0; j <= nv; j++) {
    const v = j / nv, hk = Math.pow(v, .72);
    let x = lerp(A.x, B.x, hk), y = lerp(A.y, B.y, v), z = lerp(A.z, B.z, hk);
    const fold = (.018 + .03 * cs) * v * Math.sin(u * 11 + t * (.9 + cs) + v * 2.5);
    x += fold * Math.cos(ps) + lag.x * v * v; z += fold * Math.sin(ps) + lag.z * v * v;
    y += .02 * cs * v * Math.sin(t * 2.1 + u * 5);
    pushOut(x, y, z, P.fl, _d); x = _d.x; z = _d.z;
    y = Math.max(j === nv ? .004 : .01, y);
    const k = (j * (nu + 1) + i) * 3; pos[k] = x; pos[k + 1] = y; pos[k + 2] = z;
   }
  }
  done(CP, false);
 }
 function clothVeil(P, t, lag) {
  const pos = VE.pos;
  for (let k = 0; k < VREST.length; k++) {
   const r = VREST[k];
   _a.copy(r.h).applyMatrix4(REL.hd);
   if (r.w > 0) { _b.copy(r.c).applyMatrix4(REL.ch); _a.lerp(_b, r.w); }
   const dd = r.d * r.d;
   _a.x += lag.x * dd * .6 + .006 * dd * Math.sin(t * 1.4 + r.u * 4); _a.z += lag.z * dd * .6;
   pos[k * 3] = _a.x; pos[k * 3 + 1] = _a.y; pos[k * 3 + 2] = _a.z;
  }
  done(VE, false);
 }

 // ---------- poses and actions ----------
 // body: y lift, sink (into the dark), px/pz shift, lean, sway, tw (chest turn), hp/hy/hr head pitch, turn, roll
 // arms (r right, l left): f forward raise, s side raise, u upper-arm turn, e elbow, t forearm turn (0 palm in, PI palm up when the arm is out to the side),
 //   w wrist (+ toward the palm), c finger curl, p finger spread, pt index finger straight (pointing)
 // look: cs cape spread into wings, fl robe flare, rim violet edge light, star lining starlight, cg crown glow, eye eye glow
 const BASE = { y: 0, sink: 0, px: 0, pz: 0, lean: .03, sway: 0, tw: 0, hp: .07, hy: 0, hr: 0,
  rf: .14, rs: .3, ru: .1, re: .32, rt: .15, rw: .12, rc: .32, rp: .12, rpt: 0,
  lf: .14, ls: .3, lu: .1, le: .32, lt: .15, lw: .12, lc: .32, lp: .12, lpt: 0,
  cs: 0, fl: 0, rim: .3, star: .12, cg: .35, eye: 0 };
 const KEYS = Object.keys(BASE);
 const ARMK = ['f', 's', 'u', 'e', 't', 'w', 'c', 'p', 'pt'];
 const both = (o) => { const r = {}; for (const k in o) { if (ARMK.includes(k)) { r['r' + k] = o[k]; r['l' + k] = o[k]; } else r[k] = o[k]; } return r; };
 const right = (o) => { const r = {}; for (const k in o) r[ARMK.includes(k) ? 'r' + k : k] = o[k]; return r; };
 const left = (o) => { const r = {}; for (const k in o) r[ARMK.includes(k) ? 'l' + k : k] = o[k]; return r; };
 const mix = (...a) => Object.assign({}, ...a);
 const GUARD = mix(both({ f: .9, s: -.12, e: 1.65, t: .3, c: .45 }), { lean: .04, hp: .1, cs: 0, rim: .4 });
 const ACTS = {};
 function act(name, dur, keys, o) {
  const t = [], p = []; let prev = BASE;
  for (const [u, k] of keys) { const full = Object.assign({}, prev, k); t.push(u); p.push(full); prev = full; }
  ACTS[name] = Object.assign({ dur, t, p, hits: [], cues: [], hold: false, interrupt: false, rate: 11, snap: null }, o || {});
 }
 function evalKeys(def, u, out) {
  const T = def.t, Pk = def.p; let i = 0; while (i < T.length - 2 && u > T[i + 1]) i++;
  const a = T[i], b = T[i + 1], s = b > a ? cl((u - a) / (b - a), 0, 1) : 1, e = s * s * (3 - 2 * s);
  for (const k of KEYS) out[k] = lerp(Pk[i][k], Pk[i + 1][k], e);
 }
 const WIDE = both({ f: .12, s: 1.42, e: .14, t: PI, w: -.15, c: .06, p: .55 });
 act('blackout', 6.2, [[0, {}],
  [.14, mix(both({ f: .32, s: .1, e: .8, t: .4, w: .35, c: .6 }), { lean: .08, hp: .24, rim: .45 })],
  [.28, mix(WIDE, { hp: -.22, lean: -.08, cs: 1, fl: .55, rim: 1.6, star: 1.5, cg: 1.5, eye: 1, y: .05 })],
  [.84, mix(both({ s: 1.48, e: .1 }), { hp: -.18 })],
  [.93, mix(both({ f: .2, s: .8, e: .35, t: .8, c: .25 }), { cs: .35, fl: .15, rim: .6, star: .5, cg: .7, eye: .3, y: 0, hp: .02, lean: .02 })],
  [1, BASE]], { hits: [.86], cues: [.3, .5] });
 act('voidSphere', 4.6, [[0, {}],
  [.12, mix(right({ s: .95, f: .55, t: PI * .9, e: .45, w: -.3, c: .5, p: .4 }), left({ s: .35, f: .15, e: .5, c: .4 }), { hy: -.38, tw: -.22, hp: .02, cg: .8, rim: .5 })],
  [.3, mix(right({ s: 1.0, f: .62, c: .55 }), { lean: -.04, rim: .6 })],
  [.42, mix(right({ f: 1.28, s: .32, t: PI * .55, e: .08, w: .15, c: .1, p: .6 }), { tw: .2, lean: .12, hy: .05, hp: .08, fl: .2 })],
  [.52, mix(right({ f: 1.15, s: .38, t: PI * .5, e: .16, w: -.4, c: .45, p: .5 }), { tw: .12, lean: .08, fl: .05 })],
  [.78, mix(right({ c: .65, w: -.5 }), { hp: .1, rim: .7 })],
  [.84, mix(right({ c: 1.3, w: .1, e: .32, p: 0 }), { lean: .15, hp: .14, tw: .04, rim: .9, fl: .25 })],
  [.92, {}],
  [1, BASE]], { hits: [.84], cues: [.28, .42] });
 act('crownShards', 2.6, [[0, {}],
  [.2, mix(right({ f: .55, s: .55, e: 2.0, t: -.35, w: 0, c: .9, pt: 1, p: .1 }), left({ s: .3, f: .2 }), { hp: -.1, cg: 1.6, rim: .55, lean: -.03 })],
  [.4, mix(right({ s: .6 }), { hp: -.06 })],
  [.5, mix(right({ f: 1.42, s: .2, e: .05, t: PI / 2, w: .05 }), { hp: .12, lean: .1, tw: .12, cg: 1.2 })],
  [.78, mix(right({ f: 1.38 }), { cg: .8 })],
  [1, BASE]], { hits: [.52, .6, .68], cues: [.38] });
 act('frostDust', 2.8, [[0, {}],
  [.16, mix(right({ s: -.25, f: .85, e: 1.7, t: .4, w: .3, c: .55 }), left({ s: .35, e: .4 }), { tw: .38, hy: .25, lean: .05, rim: .4 })],
  [.36, mix(right({ s: 1.15, f: .95, e: .08, t: PI / 2, w: -1.0, c: 0, p: .75 }), left({ s: .55, f: .1, e: .35 }), { tw: -.3, hy: -.2, lean: -.04, fl: .35, rim: .6 })],
  [.62, mix(right({ s: 1.3, f: .8 }), { tw: -.36, fl: .2 })],
  [1, BASE]], { cues: [.35] });
 act('appear', 3.0, [[0, mix(both({ s: .9, f: .2, t: PI, e: .3, c: .2 }), { sink: -2.2, cs: .6, hp: -.12, rim: .9, star: .9, cg: 1.2 })],
  [.72, mix(both({ s: 1.05 }), { sink: 0, fl: .3 })],
  [.88, mix(both({ s: .5, e: .3, t: .6 }), { cs: .2, fl: .1, rim: .5, star: .3 })],
  [1, BASE]], { cues: [.72], snap: ['sink'], rate: 14 });
 act('die', 4.0, [[0, {}],
  [.14, mix(both({ s: .75, f: .3, e: .4, t: PI * .7, c: .2 }), { hp: -.32, lean: -.12, rim: .9, star: 1.2, cs: .5, fl: .3, eye: .6 })],
  [.42, mix(both({ s: .5, f: .55, e: .95, c: .65 }), { lean: .35, hp: .45, cs: .2, star: 1.4 })],
  [.96, { sink: -2.25, rim: .5, star: .4, eye: 0 }],
  [1, {}]], { hold: true, cues: [.42], rate: 14 });
 act('hurt', .7, [[0, {}], [.2, mix(both({ s: .45, e: .9, c: .75 }), { pz: -.05, lean: -.15, hp: -.22, hr: .1, fl: .2, rim: .6 })], [1, BASE]], { interrupt: true, rate: 16 });
 act('block', .6, [[0, {}], [.3, mix(right({ f: 1.25, s: .05, e: 1.95, t: .4, c: .5 }), { lean: -.06, hp: .14, tw: -.18, cs: .25 })], [.7, {}], [1, BASE]], { interrupt: true, rate: 16 });

 // ---------- effects ----------
 function radial(stops, size) { const s = size || 128, h = s / 2, c = cvs(s, s), g = c.getContext('2d'), gr = g.createRadialGradient(h, h, 0, h, h, h); for (const [o, col] of stops) gr.addColorStop(o, col); g.fillStyle = gr; g.fillRect(0, 0, s, s); return tex(c); }
 const glowT = radial([[0, 'rgba(255,255,255,1)'], [.22, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']]);
 const dotT = radial([[0, 'rgba(255,255,255,1)'], [.35, 'rgba(255,255,255,.6)'], [1, 'rgba(255,255,255,0)']], 64);
 const ringT = radial([[0, 'rgba(255,255,255,0)'], [.74, 'rgba(255,255,255,0)'], [.86, 'rgba(255,255,255,1)'], [.92, 'rgba(255,255,255,.35)'], [1, 'rgba(255,255,255,0)']], 256);
 const darkT = radial([[0, 'rgba(0,0,0,.75)'], [.5, 'rgba(0,0,0,.45)'], [1, 'rgba(0,0,0,0)']]);
 const sparkT = (() => { const c = cvs(64, 64), g = c.getContext('2d'); g.drawImage(dotT.image, 16, 16, 32, 32); g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(31, 4, 2, 56); g.fillRect(4, 31, 56, 2); const q = g.createRadialGradient(32, 32, 0, 32, 32, 30); q.addColorStop(0, 'rgba(0,0,0,0)'); q.addColorStop(1, 'rgba(0,0,0,1)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = q; g.fillRect(0, 0, 64, 64); return tex(c); })();
 const smokeT = (() => { const c = cvs(128, 128), g = c.getContext('2d'); for (let i = 0; i < 26; i++) { const x = 34 + rnd() * 60, y = 34 + rnd() * 60, r = 14 + rnd() * 28, q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, 'rgba(255,255,255,.22)'); q.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = q; g.fillRect(0, 0, 128, 128); } return tex(c); })();
 const poolT = (() => { const c = cvs(256, 256), g = c.getContext('2d'); g.translate(128, 128); for (let i = 0; i < 18; i++) { const a = rnd() * TAU, l = 60 + rnd() * 62; g.strokeStyle = 'rgba(4,0,8,.9)'; g.lineWidth = 6 + rnd() * 10; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(Math.cos(a + .4) * l * .6, Math.sin(a + .4) * l * .6, Math.cos(a) * l, Math.sin(a) * l); g.stroke(); } const q = g.createRadialGradient(0, 0, 0, 0, 0, 100); q.addColorStop(0, 'rgba(2,0,6,1)'); q.addColorStop(.7, 'rgba(6,0,14,.95)'); q.addColorStop(1, 'rgba(6,0,14,0)'); g.fillStyle = q; g.beginPath(); g.arc(0, 0, 100, 0, TAU); g.fill(); return tex(c); })();
 function spr(map, color, blend) { const m = new THREE.SpriteMaterial({ map, color, transparent: true, depthWrite: false, blending: blend === undefined ? THREE.AdditiveBlending : blend }); const s = new THREE.Sprite(m); s.visible = false; fx.add(s); return s; }
 function decal(map, color, blend) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map, color, transparent: true, depthWrite: false, blending: blend === undefined ? THREE.AdditiveBlending : blend })); m.rotation.x = -PI / 2; m.renderOrder = 2; m.visible = false; fx.add(m); return m; }
 // point particles; sizes are true world sizes in the narrow, zoomed battle camera
 function particles(n, size, map) {
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('color', new THREE.BufferAttribute(col, 3).setUsage(THREE.DynamicDrawUsage));
  const pm = new THREE.PointsMaterial({ size, map: map || dotT, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  pm.onBeforeCompile = (s) => { s.vertexShader = s.vertexShader.replace('gl_PointSize *= ( scale / - mvPosition.z );', 'gl_PointSize *= ( scale * projectionMatrix[1][1] / - mvPosition.z );'); };
  pm.customProgramCacheKey = () => 'noctara-pts';
  const pts = new THREE.Points(g, pm); pts.frustumCulled = false; pts.renderOrder = 8; fx.add(pts);
  return { pts, pos, col, g, n, vel: new Float32Array(n * 3), tint: new Float32Array(n * 3), life: new Float32Array(n), max: new Float32Array(n).fill(1), ph: new Float32Array(n), aux: new Float32Array(n * 3), next: 0 };
 }
 function emit(P, x, y, z, vx, vy, vz, life, r, g, b) { const i = P.next; P.next = (i + 1) % P.n; P.pos.set([x, y, z], i * 3); P.vel.set([vx, vy, vz], i * 3); P.tint.set([r, g, b], i * 3); P.life[i] = life; P.max[i] = life; P.ph[i] = rnd() * TAU; return i; }
 function stepP(P, dt, fn) {
  for (let i = 0; i < P.n; i++) {
   if (P.life[i] <= 0) { P.col[i * 3] = P.col[i * 3 + 1] = P.col[i * 3 + 2] = 0; continue; }
   P.life[i] -= dt; const k = Math.max(0, fn(i, dt, 1 - P.life[i] / P.max[i]));
   P.col[i * 3] = P.tint[i * 3] * k; P.col[i * 3 + 1] = P.tint[i * 3 + 1] * k; P.col[i * 3 + 2] = P.tint[i * 3 + 2] * k;
  }
  P.g.attributes.position.needsUpdate = true; P.g.attributes.color.needsUpdate = true;
 }
 const drift = (P) => (i, h, a) => { const p = P.pos, v = P.vel; p[i * 3] += v[i * 3] * h; p[i * 3 + 1] += v[i * 3 + 1] * h; p[i * 3 + 2] += v[i * 3 + 2] * h; return Math.sin(PI * Math.min(1, a * 1.15)); };
 const disk = particles(700, .085), sparks = particles(700, .07), frost = particles(900, .11, sparkT), stars = particles(260, .05, sparkT);
 for (const P of [sparks, frost]) { P.pts.material.depthTest = false; P.pts.renderOrder = 10; }
 // the void sphere: a black core, a violet rim hugging its edge, a photon ring, a corona, an accretion disk and orbiting rock
 const vCore = new THREE.Mesh(new THREE.SphereGeometry(1, 36, 24), new THREE.MeshBasicMaterial({ color: 0x000000 })); vCore.visible = false; fx.add(vCore);
 const rimMat = new THREE.ShaderMaterial({ uniforms: { k: { value: 1 }, c: { value: new THREE.Color(0xb27cff) } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = -mv.xyz; gl_Position = projectionMatrix * mv; }',
  fragmentShader: 'uniform float k; uniform vec3 c; varying vec3 vN; varying vec3 vV; void main(){ float f = 1.0 - abs(dot(normalize(vN), normalize(vV))); gl_FragColor = vec4(c * pow(f, 2.5) * k * 1.6, 1.0); }' });
 const vRim = new THREE.Mesh(new THREE.SphereGeometry(1.14, 36, 24), rimMat); vRim.visible = false; fx.add(vRim);
 const vCorona = spr(glowT, 0x7a3cff), vRing = spr(ringT, 0xd9c2ff), vFlash = spr(glowT, 0xe8d8ff), vShock = spr(ringT, 0xb58cff);
 const swirlT = (() => { const c = cvs(256, 256), g = c.getContext('2d'); g.translate(128, 128); g.globalCompositeOperation = 'lighter';
  for (let arm = 0; arm < 5; arm++) for (let k = 0; k < 140; k++) { const f = k / 140, a = arm / 5 * TAU + f * 4.2, r = 30 + f * 92, w = (1 - f) * 9 + 2; const q = g.createRadialGradient(Math.cos(a) * r, Math.sin(a) * r, 0, Math.cos(a) * r, Math.sin(a) * r, w); q.addColorStop(0, 'rgba(200,150,255,' + (.16 * (1 - f)).toFixed(3) + ')'); q.addColorStop(1, 'rgba(120,60,255,0)'); g.fillStyle = q; g.fillRect(Math.cos(a) * r - w, Math.sin(a) * r - w, w * 2, w * 2); }
  return tex(c); })();
 const vSwirl = spr(swirlT, 0xc8a0ff), vSwirl2 = spr(swirlT, 0x8a4cff);
 const vFloorDark = decal(darkT, 0xffffff, THREE.NormalBlending), vFloorRing = decal(ringT, 0x8a4cff);
 const rocks = [];
 for (let i = 0; i < 18; i++) { const g = new THREE.OctahedronGeometry(1, 0); g.scale(.6 + rnd() * .6, .5 + rnd() * .8, .5 + rnd() * .6); const m = new THREE.Mesh(g, M.rock); m.visible = false; fx.add(m); rocks.push({ m, r: 0, a: rnd() * TAU, h: 0, s: .5 + rnd(), spin: V3().set(rnd(), rnd(), rnd()).multiplyScalar(4) }); }
 // crown shards: three crystals that form over her crown and fly at the target
 const shards = [];
 for (let k = 0; k < 3; k++) { const g = new THREE.OctahedronGeometry(1, 0); g.scale(.05, .2, .05); const sm2 = M.crystal.clone(); sm2.depthTest = false; sm2.onBeforeCompile = M.crystal.onBeforeCompile; sm2.customProgramCacheKey = M.crystal.customProgramCacheKey; sm2.emissiveIntensity = 1.6; const m = new THREE.Mesh(g, sm2); m.renderOrder = 9; m.visible = false; fx.add(m); const gl = spr(glowT, 0x9a5cff); gl.material.depthTest = false; gl.renderOrder = 9; shards.push({ m, gl, done: false }); }
 const handGlow = spr(glowT, 0x9a6cff), crownGlow = spr(glowT, 0x8a50ff), frostGlow = spr(glowT, 0xbfe4ff);
 const pool = decal(poolT, 0xffffff, THREE.NormalBlending), poolRing = decal(ringT, 0x7e3cff);
 const smoke = []; for (let i = 0; i < 22; i++) { const s = spr(smokeT, 0x6a2ccf); s.material.rotation = rnd() * TAU; smoke.push({ s, life: 0, max: 1, v: V3(), p: V3() }); }
 const mist = []; for (let i = 0; i < 7; i++) { const s = spr(smokeT, 0x5a28b0); mist.push({ s, a: i / 7 * TAU, ph: rnd() * TAU }); }
 const TMP = { orb: V3(), hand: V3(), crown: V3(), tgt: V3(), last: V3() };
 const _p1 = V3(), _p2 = V3(), _q = new THREE.Quaternion(), UP = new THREE.Vector3(0, 1, 0);
 const DN = new THREE.Vector3(.15, .55, .82).normalize(), DE1 = V3().crossVectors(UP, DN).normalize(), DE2 = V3().crossVectors(DN, DE1);
 const fxState = { burst: false, shardFired: [false, false, false], acc: { disk: 0, frost: 0, star: 0, smoke: 0, spark: 0 } };

 // ---------- runtime ----------
 const state = { target: { x: 0, y: 1, z: 2 } };
 const FIN = Object.assign({}, BASE), TGT = Object.assign({}, BASE);
 let actv = null, gOn = false, gW = 0, velInit = false;
 const vel = V3(), prevW = V3(), lag = V3();
 function applyPose(P, t) {
  pelvis.position.set(P.px, PELVIS_Y + P.y, P.pz); pelvis.rotation.set(P.lean * .25, P.tw * .3, P.sway * .4);
  chest.rotation.set(P.lean * .75, P.tw * .7, P.sway * .6);
  neck.rotation.set(P.hp * .35, P.hy * .4, P.hr * .35); head.rotation.set(P.hp * .65, P.hy * .6, P.hr * .65);
  base.position.y = P.sink;
  for (const A of arms) {
   const s = A.sx < 0 ? 'r' : 'l', sx = A.sx, c = P[s + 'c'], p = P[s + 'p'], pt = P[s + 'pt'];
   A.sh.rotation.set(-P[s + 'f'], -sx * P[s + 'u'], sx * P[s + 's'], 'XZY');
   A.el.rotation.set(-P[s + 'e'], 0, 0);
   A.wr.rotation.set(0, -sx * P[s + 't'], -sx * P[s + 'w'], 'YZX');
   A.fingers.forEach((F, k) => {
    const ck = k === 0 ? c * (1 - pt) : c, spread = [-.12, -.03, .06, .14][k] * p;
    F.f0.rotation.set(spread, 0, -sx * ck * .95); F.f1.rotation.set(0, 0, -sx * ck * 1.25);
   });
   A.thumb.t0.rotation.set(-.55 - p * .2, 0, -sx * (.3 + c * .55 * (1 - pt * .3))); A.thumb.t1.rotation.set(0, 0, -sx * c * .6);
  }
 }
 function play(name, force) {
  let def = ACTS[name]; if (!def) return false;
  const gone = FIN.sink < -1;
  if (gone && name !== 'appear') { name = 'appear'; def = ACTS.appear; }
  if (actv && !force && (actv.name === 'die' || (!def.interrupt && !(actv.def.hold && actv.t >= actv.def.dur - 1e-6)))) return false;
  if (def.snap) for (const k of def.snap) FIN[k] = def.p[0][k];
  actv = { name, def, t: 0 }; fxState.burst = false; fxState.shardFired = [false, false, false];
  return true;
 }
 const P3 = (o, x, y, z, out) => o.localToWorld((out || V3()).set(x, y, z));
 function updateFX(name, u, t, dt) {
  const vis = (o, on) => { o.visible = on; };
  const tg = TMP.tgt.set(state.target.x, state.target.y, state.target.z);
  P3(R.wr, 0, -.05, 0, TMP.hand);
  // void sphere
  let vOn = false;
  if (name === 'voidSphere') {
   const f = sm(.07, .26, u), tr = sm(.38, .52, u), gr = sm(.5, .74, u), co = sm(.8, .845, u);
   const H = _p1.copy(TMP.hand); H.y += .15;
   const Ch = _p2.set(tg.x + .2, 2.05, tg.z);
   const C = TMP.orb.copy(H).lerp(Ch, tr); C.y += Math.sin(PI * tr) * .5;
   let rad = (.035 + .075 * f) * lerp(1, 1.45, tr); rad = lerp(rad, .58, gr) * (1 + .04 * Math.sin(t * 9) * gr) * (1 - co);
   vOn = u > .05 && co < .995 && f > 0;
   if (vOn) {
    for (const o of [vCore, vRim, vCorona, vRing, vFloorDark, vFloorRing, vSwirl, vSwirl2]) o.visible = true;
    vSwirl.position.copy(C); vSwirl.scale.setScalar(rad * 7.5); vSwirl.material.rotation = -t * 1.1; vSwirl.material.opacity = .9;
    vSwirl2.position.copy(C); vSwirl2.scale.setScalar(rad * 10); vSwirl2.material.rotation = -t * .6 + 1; vSwirl2.material.opacity = .7;
    vCore.position.copy(C); vCore.scale.setScalar(rad); vRim.position.copy(C); vRim.scale.setScalar(rad); rimMat.uniforms.k.value = 1 + .4 * Math.sin(t * 6);
    vCorona.position.copy(C); vCorona.scale.setScalar(rad * 5.5); vCorona.material.opacity = .5 + .15 * Math.sin(t * 5);
    vRing.position.copy(C); vRing.scale.setScalar(rad * 2.6); vRing.material.opacity = .85;
    vFloorDark.position.set(C.x, .01, C.z); vFloorDark.scale.set(rad * 7, rad * 7, 1); vFloorDark.material.opacity = gr * .8;
    vFloorRing.position.set(C.x, .014, C.z); vFloorRing.scale.set(rad * 6, rad * 6, 1); vFloorRing.material.opacity = gr * (.45 + .2 * Math.sin(t * 7));
    fxState.acc.disk += dt * 420 * (.35 + .65 * gr) * (1 - co);
    while (fxState.acc.disk > 1) { fxState.acc.disk -= 1; const i = emit(disk, 0, 0, 0, 0, 0, 0, 3, ...(rnd() < .4 ? [.95, .8, 1] : [.6, .28, 1])); disk.aux[i * 3] = 2.3 + 1.4 * rnd(); disk.aux[i * 3 + 1] = rnd() * TAU; disk.aux[i * 3 + 2] = (rnd() - .5) * .35; }
    rocks.forEach((r, k) => {
     if (r.r <= 1.08) { if (u < .79) { r.r = 2.6 + 1.2 * rnd(); r.a = rnd() * TAU; r.h = (rnd() - .5) * .6; } else r.r = 0; }
     r.r -= dt * (.3 + .9 / Math.max(r.r, .5)) * (1 + 6 * co) * .55; r.a += dt * 2.2 * Math.pow(Math.max(r.r, .8), -1.5);
     const on = r.r > 1.08; r.m.visible = on;
     if (on) { const rr = r.r * rad; r.m.position.copy(C).addScaledVector(DE1, Math.cos(r.a) * rr).addScaledVector(DE2, Math.sin(r.a) * rr).addScaledVector(DN, r.h * rad); r.m.scale.setScalar(.14 * r.s * rad * sm(1.08, 1.6, r.r)); r.m.rotation.x += r.spin.x * dt; r.m.rotation.y += r.spin.y * dt; }
    });
    vis(handGlow, f > 0 && tr < 1); handGlow.position.copy(H); handGlow.scale.setScalar(.3 * f * (1 - tr)); handGlow.material.opacity = .9;
   }
   if (u >= .845 && !fxState.burst) {
    fxState.burst = true; TMP.last.copy(Ch);
    for (let i = 0; i < 160; i++) { const a = rnd() * TAU, b = (rnd() - .5) * 2, sp = 1.6 + 2.6 * rnd(), cb = Math.sqrt(1 - b * b); emit(sparks, Ch.x, Ch.y, Ch.z, Math.cos(a) * cb * sp, b * sp, Math.sin(a) * cb * sp, .5 + .6 * rnd(), ...(rnd() < .5 ? [1, .9, 1] : [.7, .4, 1])); }
   }
   const fl = u > .84 ? 1 - sm(.845, .99, u) : 0;
   vis(vFlash, fl > 0); vis(vShock, fl > 0);
   if (fl > 0) { const k = (u - .84) / .16; vFlash.position.copy(TMP.last); vFlash.scale.setScalar(.4 + 2.4 * k); vFlash.material.opacity = fl; vShock.position.copy(TMP.last); vShock.scale.setScalar(.5 + 5.5 * k); vShock.material.opacity = fl * .9; }
  } else { vis(vFlash, false); vis(vShock, false); }
  if (!vOn) { for (const o of [vCore, vRim, vCorona, vRing, vFloorDark, vFloorRing, handGlow, vSwirl, vSwirl2]) o.visible = false; for (const r of rocks) { r.m.visible = false; r.r = 0; } }
  const rad = vCore.scale.x, C = TMP.orb;
  stepP(disk, dt, (i, h, a) => {
   const q = disk.aux; let rr = q[i * 3]; rr -= h * (.75 + 1.7 / rr) * .55; q[i * 3] = rr; q[i * 3 + 1] += h * 3.4 * Math.pow(rr, -1.5);
   if (rr < 1.04 || !vOn) { disk.life[i] = 0; return 0; }
   const R2 = rr * rad, an = q[i * 3 + 1], p = disk.pos;
   p[i * 3] = C.x + DE1.x * Math.cos(an) * R2 + DE2.x * Math.sin(an) * R2 + DN.x * q[i * 3 + 2] * rad;
   p[i * 3 + 1] = C.y + DE1.y * Math.cos(an) * R2 + DE2.y * Math.sin(an) * R2 + DN.y * q[i * 3 + 2] * rad;
   p[i * 3 + 2] = C.z + DE1.z * Math.cos(an) * R2 + DE2.z * Math.sin(an) * R2 + DN.z * q[i * 3 + 2] * rad;
   return sm(3.7, 1.25, rr) * sm(0, .1, a) * (.7 + .3 * Math.sin(t * 13 + disk.ph[i]));
  });
  // crown shards
  const csOn = name === 'crownShards';
  P3(crown, 0, .3, .02, TMP.crown);
  shards.forEach((S, k) => {
   if (!csOn) { S.m.visible = S.gl.visible = false; return; }
   const form = sm(.14 + .05 * k, .36 + .03 * k, u), ft = ACTS.crownShards.hits[k] - .08, fly = cl((u - ft) / .08, 0, 1);
   _p1.set((k - 1) * .32, 0, 0).applyQuaternion(root.getWorldQuaternion(_q)).add(TMP.crown); _p1.y += .16 - .1 * Math.abs(k - 1) + .015 * Math.sin(t * 3 + k);
   const pos = _p2.copy(_p1).lerp(tg, fly); pos.y += Math.sin(PI * fly) * .55;
   const on = form > 0 && fly < 1; S.m.visible = S.gl.visible = on;
   if (on) {
    S.m.position.copy(pos); S.m.scale.setScalar(form);
    const dir = _p1.copy(tg).sub(pos).normalize(); S.m.quaternion.setFromUnitVectors(UP, dir);
    S.gl.position.copy(pos); S.gl.scale.setScalar((.45 + .25 * fly) * form); S.gl.material.opacity = 1;
    if (fly > 0) for (let i = 0; i < 14; i++) { _p1.copy(pos).lerp(S.m.position, 0); emit(sparks, pos.x + (rnd() - .5) * .05, pos.y + (rnd() - .5) * .05, pos.z, (rnd() - .5) * .25, (rnd() - .5) * .25, (rnd() - .5) * .25, .45, .8, .55, 1); }
   }
   if (fly >= 1 && !fxState.shardFired[k]) { fxState.shardFired[k] = true; for (let i = 0; i < 40; i++) { const a = rnd() * TAU, b = rnd() - .3; emit(sparks, tg.x, tg.y, tg.z, Math.cos(a) * 1.4 * rnd(), b * 1.6, Math.sin(a) * 1.4 * rnd(), .4 + .4 * rnd(), .8, .55, 1); } }
  });
  // frost dust
  const frOn = name === 'frostDust' ? win(u, .3, .62, .03) : 0;
  vis(frostGlow, frOn > 0 || (name === 'frostDust' && u > .22 && u < .7));
  if (frostGlow.visible) { frostGlow.position.copy(TMP.hand); frostGlow.scale.setScalar(.25 + .15 * frOn + .03 * Math.sin(t * 20)); frostGlow.material.opacity = .8 * sm(.22, .32, u) * (1 - sm(.6, .7, u)); }
  if (frOn > 0) {
   _p1.copy(tg).sub(TMP.hand); _p1.y += .3; _p1.normalize();
   fxState.acc.frost += dt * 1500 * frOn;
   while (fxState.acc.frost > 1) { fxState.acc.frost -= 1; const sp = 2.6 + 2.4 * rnd(); emit(frost, TMP.hand.x, TMP.hand.y, TMP.hand.z, _p1.x * sp + (rnd() - .5) * 1.6, _p1.y * sp + (rnd() - .4) * 1.2, _p1.z * sp + (rnd() - .5) * 1.6, 1.6 + 1.0 * rnd(), ...(rnd() < .5 ? [.85, .95, 1] : [.55, .75, 1])); }
  }
  stepP(frost, dt, (i, h, a) => { const p = frost.pos, v = frost.vel, dr = 1 - Math.min(1, .45 * h); v[i * 3] *= dr; v[i * 3 + 1] = v[i * 3 + 1] * dr - .25 * h; v[i * 3 + 2] *= dr; p[i * 3] += (v[i * 3] + .25 * Math.sin(t * 3 + frost.ph[i])) * h; p[i * 3 + 1] += v[i * 3 + 1] * h; p[i * 3 + 2] += (v[i * 3 + 2] + .25 * Math.cos(t * 2.6 + frost.ph[i])) * h; return (1 - a) * (.6 + .4 * Math.sin(t * 17 + frost.ph[i])); });
  // blackout: violet smoke rolling off her and stars rising out of her lining
  const boOn = name === 'blackout' ? win(u, .22, .86, .04) : 0, dieOn = name === 'die' ? win(u, .22, .9, .05) : 0;
  const rq = root.getWorldQuaternion(_q);
  if (boOn > 0) {
   fxState.acc.smoke += dt * 12 * boOn;
   while (fxState.acc.smoke > 1) { fxState.acc.smoke -= 1; const S = smoke.find((o) => o.life <= 0); if (!S) break; const sd = rnd() < .5 ? -1 : 1; S.p.set(sd * (.45 + .55 * rnd()), .3 + 1.3 * rnd(), (rnd() - .6) * .4).applyQuaternion(rq).add(root.position); S.v.set(sd * (.15 + .2 * rnd()), .08 + .12 * rnd(), (rnd() - .5) * .1).applyQuaternion(rq); S.life = S.max = 2.2 + rnd(); S.s.material.rotation = rnd() * TAU; }
  }
  for (const S of smoke) { if (S.life <= 0) { S.s.visible = false; continue; } S.life -= dt; const a = 1 - S.life / S.max; S.p.addScaledVector(S.v, dt); S.s.visible = true; S.s.position.copy(S.p); S.s.scale.setScalar(.5 + .9 * a); S.s.material.opacity = .45 * Math.sin(PI * a); S.s.material.rotation += dt * .3; }
  if (boOn > 0 || dieOn > 0) {
   fxState.acc.star += dt * (boOn * 40 + dieOn * 170);
   while (fxState.acc.star > 1) {
    fxState.acc.star -= 1; const src = rnd() < .6 ? CP : SK, k = (rnd() * (src.pos.length / 3)) | 0;
    _p1.set(src.pos[k * 3], src.pos[k * 3 + 1], src.pos[k * 3 + 2]); base.localToWorld(_p1);
    const up = dieOn > 0 ? .5 + .8 * rnd() : .1 + .15 * rnd();
    emit(stars, _p1.x, _p1.y, _p1.z, (rnd() - .5) * .2, up, (rnd() - .5) * .2, 1.8 + rnd(), ...(rnd() < .7 ? [.95, .9, 1] : [.75, .6, 1]));
   }
  }
  stepP(stars, dt, (i, h, a) => { const p = stars.pos, v = stars.vel; p[i * 3] += v[i * 3] * h; p[i * 3 + 1] += v[i * 3 + 1] * h; p[i * 3 + 2] += v[i * 3 + 2] * h; return Math.sin(PI * a) * (.55 + .45 * Math.sin(t * 15 + stars.ph[i])); });
  stepP(sparks, dt, (i, h, a) => { const p = sparks.pos, v = sparks.vel, dr = 1 - Math.min(1, 2.2 * h); v[i * 3] *= dr; v[i * 3 + 1] *= dr; v[i * 3 + 2] *= dr; p[i * 3] += v[i * 3] * h; p[i * 3 + 1] += v[i * 3 + 1] * h; p[i * 3 + 2] += v[i * 3 + 2] * h; return 1 - a; });
  // the pool of dark she rises from and sinks into
  const pk = name === 'appear' ? sm(0, .1, u) * (1 - sm(.8, 1, u)) : name === 'die' ? sm(.3, .5, u) : FIN.sink < -1 ? 1 : 0;
  vis(pool, pk > .01); vis(poolRing, pk > .01);
  if (pk > .01) { pool.position.set(root.position.x, .008, root.position.z); pool.scale.set(2.6 * pk, 2.6 * pk, 1); pool.material.opacity = Math.min(1, pk * 1.2); poolRing.position.set(root.position.x, .012, root.position.z); poolRing.scale.set(2.7 * pk, 2.7 * pk, 1); poolRing.material.opacity = .55 * pk * (FIN.sink < -1 && !actv ? .5 : 1); }
  // a low violet mist around her hem, and the crown's glow
  const mk = FIN.sink > -.3 ? .07 + .08 * FIN.rim : 0;
  mist.forEach((m, k) => { m.s.visible = mk > 0; if (!mk) return; const a = m.a + t * .05; m.s.position.set(Math.cos(a) * .55, .1 + .03 * Math.sin(t * .7 + m.ph), Math.sin(a) * .5).applyQuaternion(rq).add(root.position); m.s.scale.setScalar(.75 + .1 * Math.sin(t * .5 + m.ph)); m.s.material.opacity = mk * (.7 + .3 * Math.sin(t * .9 + m.ph)); });
  crownGlow.visible = FIN.sink > -.5; crownGlow.position.copy(TMP.crown); crownGlow.position.y -= .2; crownGlow.scale.setScalar(.45); crownGlow.material.opacity = .1 * FIN.cg;
 }
 function animate(phase, walk, t, dt) {
  let u = 0, name = '';
  if (actv) {
   actv.t += dt; u = Math.min(1, actv.t / actv.def.dur); name = actv.name;
   if (u >= 1 && !actv.def.hold) { actv = null; }
  }
  if (actv) evalKeys(actv.def, u, TGT); else Object.assign(TGT, BASE);
  gW += ((gOn && !actv ? 1 : 0) - gW) * (1 - Math.exp(-dt * 7));
  if (gW > 1e-3) for (const k in GUARD) TGT[k] = lerp(TGT[k], GUARD[k], gW);
  const calm = actv ? .35 : 1;
  TGT.y += .012 * Math.sin(t * 1.2) * calm; TGT.lean += .012 * Math.sin(t * 1.2 + 1) * calm + .07 * walk; TGT.hy += .06 * Math.sin(t * .37) * calm;
  TGT.rc += .05 * Math.sin(t * .8) * calm; TGT.lc += .05 * Math.sin(t * .8 + 2) * calm;
  const rate = actv ? actv.def.rate : 7, k = dt > 0 ? 1 - Math.exp(-dt * rate) : 1;
  for (const q of KEYS) FIN[q] += (TGT[q] - FIN[q]) * k;
  applyPose(FIN, t);
  root.updateMatrixWorld(true);
  // trailing cloth from how fast she glides
  const wp = _p1.setFromMatrixPosition(root.matrixWorld);
  if (!velInit || dt <= 0) { prevW.copy(wp); velInit = true; }
  else { const kv = 1 - Math.exp(-dt / .18); vel.x += ((wp.x - prevW.x) / dt - vel.x) * kv; vel.z += ((wp.z - prevW.z) / dt - vel.z) * kv; prevW.copy(wp); }
  const yaw = root.rotation.y, cy = Math.cos(yaw), sy = Math.sin(yaw);
  lag.set(-(vel.x * cy - vel.z * sy) * .22, 0, -(vel.x * sy + vel.z * cy) * .22); if (lag.length() > .35) lag.setLength(.35);
  _bi.copy(base.matrixWorld).invert();
  rel(REL.pel, pelvis); rel(REL.ch, chest); rel(REL.hd, head);
  arms.forEach((A, i) => { rel(REL.sh[i], A.sh); rel(REL.el[i], A.el); rel(REL.wr[i], A.wr); });
  PC.setFromMatrixPosition(REL.pel);
  clothSkirt(FIN, t, lag); clothSleeve(R, 0, FIN, t, lag); clothSleeve(L, 1, FIN, t, lag); clothCape(FIN, t, lag); clothVeil(FIN, t, lag);
  U.rim.value = FIN.rim; M.lining.emissiveIntensity = FIN.star; M.crystal.emissiveIntensity = FIN.cg; M.face.emissiveIntensity = FIN.eye * 1.4;
  for (const m of CLOTH_EM) m.emissiveIntensity = .3 + .5 * Math.max(0, FIN.rim - .3);
  updateFX(name, u, t, dt);
 }
 const ACTIONS = {};
 for (const n in ACTS) { const d = ACTS[n]; ACTIONS[n] = Object.freeze({ dur: d.dur, hits: d.hits.slice(), cues: d.cues.slice(), hold: d.hold, interrupt: d.interrupt }); }
 Object.freeze(ACTIONS);
 function anchor(name, out) {
  out = out || V3();
  if (name === 'hit') return P3(R.wr, 0, -.05, 0, out);
  if (name === 'orb') return out.copy(name === 'orb' && (!actv || actv.name !== 'voidSphere' || actv.t / actv.def.dur > .845) ? TMP.last : TMP.orb);
  if (name === 'impact') return out.set(state.target.x, state.target.y, state.target.z);
  if (name === 'crown') return P3(crown, 0, .08, 0, out);
  if (name === 'head') return P3(head, 0, .12, .05, out);
  return P3(chest, 0, .3, .12, out);
 }
 animate(0, 0, 0, 0);
 let tri = 0, draws = 0; const texs = new Set();
 root.traverse((o) => { if (o.isMesh) { draws++; tri += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; for (const k of ['map', 'emissiveMap']) if (o.material[k]) texs.add(o.material[k].image); } });
 return {
  root, fx, animate, play,
  guard(on) { gOn = !!on; },
  reset() { actv = null; gOn = false; gW = 0; if (FIN.sink < -1) FIN.sink = 0; },
  get busy() { return !!actv && !(actv.def.hold && actv.t >= actv.def.dur - 1e-6); },
  get action() { return actv ? actv.name : ''; },
  get progress() { return actv ? Math.min(1, actv.t / actv.def.dur) : -1; },
  get gone() { return FIN.sink < -1; },
  get dash() { return 0; }, get lift() { return 0; },
  get state() { return state; }, set state(v) { if (v) Object.assign(state, v); },
  anchor, ACTIONS, _dbg: { SL, SK, CP, VE, M, arms },
  stats: { triangles: Math.round(tri), drawCalls: draws, textures: texs.size, joints: 4 + arms.length * 3 + 2 * 10 }
 };
}
