
 // ---------- the purple flame in her left palm: a living flame, rising sparks, and a real light ----------
 // The game model's flame is a painted flipbook; this one is drawn as it burns: a wisp whose spine sways and curls as the
 // flipbook's did (at the same pace), its edges licked by noise, a white heart low in it, two layers out of step. It turns
 // moon-white for her moonlight spells, as the game model's cross-fades to its white flame.
 const flame = new THREE.Group(); flame.position.set(-0.07, -0.042, 0.006); wrists[1].add(flame);
 const FLC = (pal) => pal.map((p) => CR(p[0] / 255, p[1] / 255, p[2] / 255));
 const PURP = FLC([[120, 20, 200], [200, 70, 255], [255, 225, 255]]), MOONF = FLC([[110, 140, 255], [190, 215, 255], [255, 255, 255]]);
 const FLAME_VS = 'uniform vec2 uSize; uniform vec2 uCen; varying vec2 vUv;\nvoid main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(0., 0., 0., 1.);\n' +
  ' vec3 up = (viewMatrix * vec4(0., 1., 0., 0.)).xyz; vec2 u2 = length(up.xy) > .05 ? normalize(up.xy) : vec2(0., 1.); vec2 r2 = vec2(u2.y, -u2.x);\n' +
  ' vec2 p = (uv - uCen) * uSize; mv.xy += r2 * p.x + u2 * p.y; gl_Position = projectionMatrix * mv; }';
 // The game model's flame is a flipbook: eight frames, each three passes of soft discs along a spine of two bezier curves
 // (a sway, then a curl at the tip) whose control points swing with the frame's phase. Here the same spine and passes are
 // drawn for every frame as it burns, the phase running smoothly at the flipbook's pace, with noise licking its edges.
 const FLAME_FS = 'uniform float uTime, uPhase, uOp, uWhite; uniform vec3 uA, uB, uC, uA2, uB2, uC2; varying vec2 vUv;\n' +
  'float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }\n' +
  'float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }\n' +
  'float bz(float a, float b, float c, float d, float t){ float u = 1. - t; return u * u * u * a + 3. * u * u * t * b + 3. * u * t * t * c + t * t * t * d; }\n' +
  'void main(){ vec2 P = vec2(vUv.x * 96., (1. - vUv.y) * 176.); float ph = (uTime * 1.75 + uPhase) * 6.2831853;\n' +
  ' float X0 = 48., X1 = 28. + sin(ph) * 9., X2 = 70. + sin(ph + 1.9) * 10., X3 = 50. + sin(ph + .7) * 6.;\n' +
  ' float Y0 = 160., Y1 = 118., Y2 = 72., Y3 = 28. + sin(ph * 2.) * 6.;\n' +
  ' float W1 = X3 - 16. + sin(ph + 2.5) * 8., W2 = X3 + 10., W3 = X3 - 4. + sin(ph + 1.) * 6., Z1 = Y3 - 12., Z2 = Y3 - 24., Z3 = 10. + sin(ph) * 4.;\n' +
  ' P.x += (vn(vec2(P.y * .05 - uTime * 2.6, uPhase * 9.)) - .5) * 9. * (1. - P.y / 176.);\n' +
  ' float o = 0., m = 0., c = 0.;\n' +
  ' for (int i = 0; i <= 56; i++) { float t = float(i) / 56.; bool top = t > .72; float tt = top ? (t - .72) / .28 : t / .72;\n' +
  '  vec2 S = top ? vec2(bz(X3, W1, W2, W3, tt), bz(Y3, Z1, Z2, Z3, tt)) : vec2(bz(X0, X1, X2, X3, tt), bz(Y0, Y1, Y2, Y3, tt));\n' +
  '  float r = (1. - t * .85) * (.8 + .2 * sin(t * 20. + ph)), d2 = dot(P - S, P - S);\n' +
  '  o += exp(-d2 / (42. * 42. * r * r) * 3.); m += exp(-d2 / (27. * 27. * r * r) * 3.); c += exp(-d2 / (13. * 13. * r * r) * 3.); }\n' +
  ' o = 1. - exp(-o * .13 * .7); m = 1. - exp(-m * .22 * .7); c = 1. - exp(-c * .4 * .7);\n' +
  ' vec3 A = mix(uA, uA2, uWhite), B = mix(uB, uB2, uWhite), C = mix(uC, uC2, uWhite);\n' +
  ' vec3 col = A * o * .95 + B * m * .9 + C * c * 1.05;\n' +
  ' gl_FragColor = vec4(col * uOp, 1.); }';
 const flames = [0, 1].map((k) => {
  const mt = new THREE.ShaderMaterial(Object.assign({ vertexShader: FLAME_VS, fragmentShader: FLAME_FS, uniforms: {
   uSize: { value: new THREE.Vector2(.2, .36) }, uCen: { value: new THREE.Vector2(.5, .06) }, uTime: U.time, uPhase: { value: k * .5 }, uOp: { value: 1 }, uWhite: { value: 0 },
   uA: { value: PURP[0] }, uB: { value: PURP[1] }, uC: { value: PURP[2] }, uA2: { value: MOONF[0] }, uB2: { value: MOONF[1] }, uC2: { value: MOONF[2] } } }, ADD));
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mt); m.geometry.translate(.5, .5, 0); m.frustumCulled = false; m.renderOrder = 5; flame.add(m); return m;
 });
 const softCanvas = (S, stops) => { const c = cvs(S, S), g = c.getContext('2d'), gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2); for (const s of stops) gr.addColorStop(s[0], s[1]); g.fillStyle = gr; g.fillRect(0, 0, S, S); return c; };
 const palmGlow = new THREE.Sprite(new THREE.SpriteMaterial(Object.assign({ map: tex(softCanvas(128, [[0, 'rgba(230,150,255,0.9)'], [0.35, 'rgba(170,60,255,0.35)'], [1, 'rgba(120,20,220,0)']])), color: 0xb0b0b0 }, ADD)));
 palmGlow.scale.set(0.16, 0.16, 1); palmGlow.renderOrder = 5; flame.add(palmGlow);
 function starSprite() {
  const S = 128, c = cvs(S, S), g = c.getContext('2d'), m = S / 2;
  const gr = g.createRadialGradient(m, m, 0, m, m, m); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.2, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  g.fillStyle = '#ffffff'; star4(g, m, m, m * 0.95);
  return c;
 }
 const STAR = tex(starSprite());
 hs = SEED.spark;
 const NPt = 18 + Q(18, 0), ptPos = new Float32Array(NPt * 3), ptCol = new Float32Array(NPt * 3), ptSeed = [];
 for (let i = 0; i < NPt; i++) ptSeed.push(i < 18 ? [hr() * TAU, 0.35 + hr() * 0.6, hr()] : [r2() * TAU, 0.3 + r2() * 0.7, r2()]);
 const ptGeo = new THREE.BufferGeometry();
 ptGeo.setAttribute('position', new THREE.BufferAttribute(ptPos, 3)); ptGeo.setAttribute('color', new THREE.BufferAttribute(ptCol, 3));
 const sparks = new THREE.Points(ptGeo, new THREE.PointsMaterial(Object.assign({ size: 0.028, map: STAR, vertexColors: true }, ADD)));
 sparks.frustumCulled = false; sparks.renderOrder = 6; flame.add(sparks);
 const fLight = new THREE.PointLight(0xb455ff, 1.4, 3.2, 2); fLight.position.set(0, 0.09, 0); flame.add(fLight);

 // ---------- effects in world space (the scene adds `fx`) ----------
 const fx = new THREE.Group(); fx.name = 'IoFX';
 const addBlend = (map, color, extra) => Object.assign({ map, color, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }, extra || {});
 function beamCanvas() {
  const W = 128, H = 512, c = cvs(W, H), g = c.getContext('2d'), img = g.createImageData(W, H), d = img.data;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
   const dx = (x - W / 2 + 0.5) / (W / 2), vy = 1 - y / H;
   const core = Math.exp(-dx * dx * 7) * 0.75 + Math.exp(-dx * dx * 55) * 0.6 + Math.exp(-dx * dx * 300) * .3;
   const a = Math.min(1, core * Math.min(1, vy * 7) * Math.pow(1 - vy, 1.1));
   const i = (y * W + x) * 4; d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = a * 255;
  }
  g.putImageData(img, 0, 0); return c;
 }
 // her moon sigil: the game model's (two rings, a dotted ring, a crescent, eight stars), drawn at four times the size with
 // the moon's phases between the outer rings and fine ticks
 function sigilCanvas() {
  const S = 1024 * TS, k = S / 256, c = cvs(S, S), g = c.getContext('2d'), m = S / 2;
  g.strokeStyle = '#ffffff'; g.fillStyle = '#ffffff'; g.shadowColor = '#bcd2ff'; g.shadowBlur = 10 * k;
  g.lineWidth = 3.5 * k; g.beginPath(); g.arc(m, m, 118 * k, 0, TAU); g.stroke();
  g.lineWidth = 1.6 * k; g.beginPath(); g.arc(m, m, 102 * k, 0, TAU); g.stroke();
  g.beginPath(); g.arc(m, m, 70 * k, 0, TAU); g.stroke();
  g.lineWidth = .6 * k; g.beginPath(); g.arc(m, m, 66 * k, 0, TAU); g.stroke();
  for (let i = 0; i < 28; i++) { const a = i / 28 * TAU; g.beginPath(); g.arc(m + Math.cos(a) * 110 * k, m + Math.sin(a) * 110 * k, (i % 4 ? 1.8 : 3.4) * k, 0, TAU); g.fill(); }
  for (let i = 0; i < 120; i++) { const a = i / 120 * TAU, r0 = (i % 5 ? 96 : 92) * k; g.lineWidth = .5 * k; g.beginPath(); g.moveTo(m + Math.cos(a) * r0, m + Math.sin(a) * r0); g.lineTo(m + Math.cos(a) * 100 * k, m + Math.sin(a) * 100 * k); g.stroke(); }
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + .59, x = m + Math.cos(a) * 81 * k, y = m + Math.sin(a) * 81 * k, ph = i / 8; g.beginPath(); g.arc(x, y, 4.5 * k, 0, TAU); g.lineWidth = .6 * k; g.stroke(); g.beginPath(); g.arc(x, y, 4.5 * k, -PI / 2, PI / 2, false); g.ellipse(x, y, 4.5 * k * Math.abs(Math.cos(ph * PI)), 4.5 * k, 0, PI / 2, -PI / 2, ph < .5); g.fill(); }
  g.beginPath(); g.arc(m, m, 52 * k, 0, TAU); g.arc(m + 20 * k, m - 12 * k, 45 * k, 0, TAU, true); g.fill('evenodd');
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2; star4(g, m + Math.cos(a) * 86 * k, m + Math.sin(a) * 86 * k, (i % 2 ? 6 : 9) * k); }
  return c;
 }
 const moonG = new THREE.Group(); fx.add(moonG);
 const beam = new THREE.Sprite(new THREE.SpriteMaterial(addBlend(tex(beamCanvas()), 0xd6e2ff)));
 beam.center.set(0.5, 0); beam.renderOrder = 4; moonG.add(beam);
 const sigil = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.8), new THREE.MeshBasicMaterial(addBlend(tex(sigilCanvas()), 0xcfe0ff)));
 sigil.rotation.x = -Math.PI / 2; sigil.position.y = 0.02; sigil.renderOrder = 3; moonG.add(sigil);
 const pool = new THREE.Mesh(new THREE.CircleGeometry(3.2, 96), new THREE.MeshBasicMaterial(addBlend(tex(softCanvas(256, [[0, 'rgba(255,255,255,1)'], [.45, 'rgba(255,255,255,0.3)'], [1, 'rgba(255,255,255,0)']])), 0xb9ccff)));
 pool.rotation.x = -Math.PI / 2; pool.position.y = 0.015; pool.renderOrder = 2; moonG.add(pool);
 const aura = new THREE.Sprite(new THREE.SpriteMaterial(addBlend(tex(softCanvas(256, [[0, 'rgba(255,255,255,0.95)'], [.45, 'rgba(220,232,255,0.35)'], [1, 'rgba(255,255,255,0)']])), 0xeef3ff)));
 aura.scale.set(2.0, 2.5, 1); aura.renderOrder = 7; moonG.add(aura);
 hs = SEED.motes;
 const NM = 48 + Q(48, 0), mPos = new Float32Array(NM * 3), mCol = new Float32Array(NM * 3), mSeed = [];
 for (let i = 0; i < NM; i++) mSeed.push(i < 48 ? [hr() * TAU, 0.25 + hr() * 0.45, hr(), 0.3 + hr() * 1.0] : [r2() * TAU, 0.2 + r2() * 0.5, r2(), 0.2 + r2() * 1.1]);
 const mGeo = new THREE.BufferGeometry();
 mGeo.setAttribute('position', new THREE.BufferAttribute(mPos, 3)); mGeo.setAttribute('color', new THREE.BufferAttribute(mCol, 3));
 const motes = new THREE.Points(mGeo, new THREE.PointsMaterial(Object.assign({ size: 0.07, map: STAR, vertexColors: true }, ADD)));
 motes.frustumCulled = false; motes.renderOrder = 8; moonG.add(motes);
 const moonLight = new THREE.PointLight(0xe4ecff, 0, 6.5, 2); moonLight.position.set(0, 1.2, 0.6); moonG.add(moonLight);
 moonG.visible = false;
 const WHITE = new THREE.Color(0xdfe8ff), PURPLE = new THREE.Color(0xb455ff), MOONC = new THREE.Color(0xe4ecff);
 void WHITE;

 // the steel-blue ribbon that follows the dagger tip through a strike: the game model's 16 last positions, drawn as a
 // smooth curve through them
 const TRN = 16, TRS = 4, TRV = (TRN - 1) * TRS + 1, trPos = new Float32Array(TRV * 2 * 3), trCol = new Float32Array(TRV * 2 * 3), trIdx = [];
 for (let i = 0; i < TRV - 1; i++) { const a = i * 2; trIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
 const trGeo = new THREE.BufferGeometry();
 trGeo.setAttribute('position', new THREE.BufferAttribute(trPos, 3)); trGeo.setAttribute('color', new THREE.BufferAttribute(trCol, 3)); trGeo.setIndex(trIdx);
 const trail = new THREE.Mesh(trGeo, new THREE.MeshBasicMaterial({ vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
 trail.frustumCulled = false; trail.renderOrder = 6; trail.visible = false; fx.add(trail);
 const tipL = new THREE.Vector3(0, 0, 0.246), midL = new THREE.Vector3(0, 0, 0.09), trTip = [], trMid = [];
 for (let i = 0; i < TRN; i++) { trTip.push(new THREE.Vector3()); trMid.push(new THREE.Vector3()); }
 const cr1 = (p0, p1, p2, p3, t, out) => { const t2 = t * t, t3 = t2 * t; out.set(0, 0, 0).addScaledVector(p0, -t3 + 2 * t2 - t).addScaledVector(p1, 3 * t3 - 5 * t2 + 2).addScaledVector(p2, -3 * t3 + 4 * t2 + t).addScaledVector(p3, t3 - t2).multiplyScalar(.5); return out; };

 // ---------- Lunar Trance: the starlight cloak (in the coat's shader), ghost moth wings, a crescent aura ----------
 function ghostWing(hind) {
  const k = 4 * TS, H0 = (hind ? 384 : 256), c = cvs(256 * k, H0 * k), g = c.getContext('2d');
  g.scale(k, k);
  const path = () => {
   g.beginPath();
   if (!hind) { g.moveTo(8, 150); g.quadraticCurveTo(110, 70, 246, 34); g.quadraticCurveTo(252, 120, 205, 180); g.quadraticCurveTo(110, 204, 8, 168); }
   else { g.moveTo(8, 20); g.quadraticCurveTo(170, 0, 226, 110); g.quadraticCurveTo(232, 192, 172, 222); g.quadraticCurveTo(150, 300, 162, 374); g.quadraticCurveTo(134, 362, 122, 242); g.quadraticCurveTo(58, 204, 8, 62); }
   g.closePath();
  };
  path(); g.save(); g.clip();
  const ry = hind ? 30 : 155, gr = g.createRadialGradient(8, ry, 6, 8, ry, hind ? 330 : 250);
  gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(0.5, 'rgba(185,215,255,0.5)'); gr.addColorStop(1, 'rgba(150,190,255,0.28)');
  g.fillStyle = gr; g.fillRect(0, 0, 256, H0);
  // fine scales, a soft shimmer over the wing
  for (let i = 0; i < 2600 * TS; i++) { g.fillStyle = r2() < .5 ? 'rgba(255,255,255,.08)' : 'rgba(150,180,255,.07)'; g.beginPath(); g.ellipse(r2() * 256, r2() * H0, .9, .5, r2() * PI, 0, TAU); g.fill(); }
  g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 1.2;
  for (let i = 0; i < 9; i++) { const a = -1.0 + i * (hind ? 0.27 : 0.21); g.beginPath(); g.moveTo(8, ry); g.quadraticCurveTo(110, ry + Math.sin(a) * 50, 8 + Math.cos(a) * 270, ry + Math.sin(a) * (hind ? 290 : 170)); g.stroke(); }
  // the finer veins between
  g.strokeStyle = 'rgba(255,255,255,0.16)'; g.lineWidth = .5;
  for (let i = 0; i < 26; i++) { const a = -1.05 + i * (hind ? .092 : .072); g.beginPath(); g.moveTo(40, ry + Math.sin(a) * 14); g.quadraticCurveTo(130, ry + Math.sin(a) * 60, 8 + Math.cos(a) * 270, ry + Math.sin(a) * (hind ? 290 : 170)); g.stroke(); }
  const ex = hind ? 132 : 150, ey = hind ? 126 : 118;
  [[17, 'rgba(255,255,255,0.8)'], [12, 'rgba(120,170,255,0.7)'], [7, 'rgba(255,255,255,0.9)'], [3, 'rgba(90,130,255,.9)']].forEach(([r, col]) => { g.fillStyle = col; g.beginPath(); g.ellipse(ex, ey, r, r * 1.15, 0.3, 0, TAU); g.fill(); });
  g.restore(); path(); g.strokeStyle = '#ffffff'; g.shadowColor = '#cfe0ff'; g.shadowBlur = 12; g.lineWidth = 3; g.stroke();
  return c;
 }
 const gwm = (cnv) => new THREE.MeshBasicMaterial({ map: tex(cnv), color: 0xdcecff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
 const gwMF = gwm(ghostWing(false)), gwMH = gwm(ghostWing(true));
 const tWing = new THREE.Group(); tWing.position.set(0, 0.1, -0.18); chest.add(tWing); tWing.visible = false;
 // both fore wings are one mesh and both hind wings another; their corners are placed each frame (in trance only)
 // through the game model's side, fore and hind joints
 const tSides = [], FORE = new THREE.PlaneGeometry(0.95, 0.95), HIND = new THREE.PlaneGeometry(0.8, 1.2);
 const foreGeo = merge([FORE, FORE]), hindGeo = merge([HIND, HIND]);
 for (const [geo, mat] of [[foreGeo, gwMF], [hindGeo, gwMH]]) { const w = new THREE.Mesh(geo, mat); w.renderOrder = 6; w.frustumCulled = false; tWing.add(w); }
 for (const sd of [-1, 1]) {
  const side = new THREE.Object3D(); side.scale.x = sd;
  const fo = new THREE.Object3D(); fo.rotation.z = 0.2;
  const hi = new THREE.Object3D(); hi.position.set(0, -0.07, -0.01); hi.rotation.z = -0.25; hi.updateMatrix();
  tSides.push({ side, fo, hi, sd });
 }
 const _wm = new THREE.Matrix4(), _wt = new THREE.Matrix4();
 function wingCorners(geo, k, base, m) {
  const pos = geo.attributes.position, b = base.attributes.position;
  for (let i = 0; i < 4; i++) { _v.fromBufferAttribute(b, i).applyMatrix4(m); pos.setXYZ(k * 4 + i, _v.x, _v.y, _v.z); }
  pos.needsUpdate = true;
 }
 function placeWings() {
  tSides.forEach((s, k) => {
   s.side.updateMatrix(); s.fo.updateMatrix();
   wingCorners(foreGeo, k, FORE, _wm.multiplyMatrices(s.side.matrix, s.fo.matrix).multiply(_wt.makeTranslation(0.445, 0.08, 0)));
   wingCorners(hindGeo, k, HIND, _wm.multiplyMatrices(s.side.matrix, s.hi.matrix).multiply(_wt.makeTranslation(0.375, -0.538, 0)));
  });
 }
 const tAura = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex((() => { const S = 512, k = 2, c = cvs(S, S), g = c.getContext('2d'); g.shadowColor = '#cfe0ff'; g.shadowBlur = 26 * k; g.fillStyle = '#ffffff'; g.beginPath(); g.arc(128 * k, 128 * k, 96 * k, 0, TAU); g.arc(150 * k, 104 * k, 86 * k, 0, TAU, true); g.fill('evenodd'); return c; })()), color: 0xdfe9ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
 tAura.position.set(0, 0.32, -0.45); tAura.scale.setScalar(1.3); tAura.renderOrder = 1; tAura.visible = false; chest.add(tAura);
