 // ---------- bind ----------
 base.scale.setScalar(SZ);
 root.updateMatrixWorld(true);
 const skeleton = new THREE.Skeleton(bones);
 const bodyMeshes = [], SHADOWS = !!opts.shadows;
 for (const [mat, list] of BK) {
  const m = new THREE.SkinnedMesh(mergeAll(list), mat); m.frustumCulled = false; base.add(m); bodyMeshes.push(m);
  m.castShadow = m.receiveShadow = SHADOWS; if (SHADOWS) m.customDepthMaterial = depthOf(mat);
 }
 BK.clear();
 root.updateMatrixWorld(true);
 for (const m of bodyMeshes) m.bind(skeleton);
 for (const b of bones) b.userData.bind = { p: b.position.clone(), q: b.quaternion.clone(), parent: b.parent };
 const soil = new THREE.Mesh(new THREE.CircleGeometry(CR * 2.9, Q(64, 20)), M.soil); soil.rotation.x = -PI / 2; soil.position.y = .006; soil.renderOrder = -1; soil.receiveShadow = SHADOWS; base.add(soil);

 // ---------- its roots under the meadow, for state.xray ----------
 // Fifteen great roots run out from under the mound, sinking as they go and branching twice, out to about 22 m: the reach
 // it feels the meadow with and spreads its warmth through. Drawn only in x-ray, as lines of light the heartbeat runs out
 // along (aVn as the veins': x brightness, y how far along from the heart).
 const xroots = (() => {
  const pos = [], idx = [], vn = [], P = V3(), D = V3(), T = V3(), E1 = V3(), E2 = V3();
  function root1(p0, dir, len, r0, d0, depth) {
   const n = Math.max(6, Math.round(len * 1.6)), pts = [p0.clone()], q = p0.clone(), dd = dir.clone();
   for (let i = 1; i <= n; i++) { dd.x += r3(-.25, .25); dd.z += r3(-.25, .25); dd.y = lerp(dd.y, -.08, .3) + r3(-.05, .05); dd.normalize(); q.addScaledVector(dd, len / n); q.y = Math.min(q.y, -.12); pts.push(q.clone()); }
   const curve = new THREE.CatmullRomCurve3(pts), segs = n * 3, rs = 4, b = pos.length / 3;
   const fr = curve.computeFrenetFrames(segs, false);
   for (let i = 0; i <= segs; i++) {
    const t = i / segs; curve.getPointAt(t, P); const r = r0 * (1 - .7 * t);
    for (let j = 0; j <= rs; j++) { const th = j / rs * TAU; D.copy(fr.normals[i]).multiplyScalar(Math.cos(th)).addScaledVector(fr.binormals[i], Math.sin(th)); pos.push(P.x + D.x * r, P.y + D.y * r, P.z + D.z * r); vn.push(lerp(1, .35, t) * (depth ? .7 : 1), d0 + t * len / 10); }
   }
   for (let i = 0; i < segs; i++) for (let j = 0; j < rs; j++) { const a = b + i * (rs + 1) + j, c = a + rs + 1; idx.push(a, c, a + 1, a + 1, c, c + 1); }
   if (depth < 2) for (let k = 0, nb = depth ? 2 : 3; k < nb; k++) {
    const t = r3(.25, .85); curve.getPointAt(t, P); curve.getTangentAt(t, T); E1.set(-T.z, 0, T.x).normalize().multiplyScalar(rnd3() < .5 ? -1 : 1);
    root1(P.clone(), T.clone().lerp(E1, r3(.5, .9)).normalize(), len * r3(.35, .6), r0 * (1 - .7 * t) * .8, d0 + t * len / 10, depth + 1);
   }
   void E2;
  }
  for (let i = 0; i < 15; i++) { const a = (i + r3(.1, .9)) / 15 * TAU; root1(V3(Math.sin(a) * CR * .5, -.3, Math.cos(a) * CR * .5), V3(Math.sin(a), -.25, Math.cos(a)).normalize(), r3(13, 21), r3(.07, .12), .6, 0); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aVn', new THREE.Float32BufferAttribute(vn, 2)); g.setIndex(idx);
  const m = new THREE.Mesh(g, M.xray); m.frustumCulled = false; m.visible = false; m.renderOrder = 20; base.add(m); return m;
 })();

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
  p.onBeforeRender = (r) => { const rt = r.getRenderTarget(); if (rt) m.uniforms.uScale.value = rt.height * .5; else { r.getDrawingBufferSize(_v2); m.uniforms.uScale.value = _v2.y * .5; } };
  return { p, pos, col, size, rot, g, n, m, vel: new Float32Array(n * 3), life: new Float32Array(n), max: new Float32Array(n).fill(1), base: new Float32Array(n * 4), sz: new Float32Array(n * 2), drag: new Float32Array(n), up: new Float32Array(n), spin: new Float32Array(n), sway: new Float32Array(n), next: 0, live: 2 };
 }
 // falling leaves and petals, dust and soil, motes (pollen, stolen life, embers), chips (bark and thorn, berry juice, sap
 // and clods of soil, all heavy and dark), and flames
 const LF = points(Q(220, 100), leafT, THREE.NormalBlending, 8), DU = points(240, puffT, THREE.NormalBlending, 7), MO = points(380, dotT, THREE.AdditiveBlending, 9), CHP = points(320, dotT, THREE.NormalBlending, 8);
 const FL = points(Q(180, 90), flameT, THREE.AdditiveBlending, 9); FL.upright = true; FL.end = C3(.55, .06, .02);
 // its breath: steam rising off the warm mound and out of the bud into the cold air
 const STM = points(Q(300, 120), steamT, THREE.NormalBlending, 6); STM.upright = true;
 fx.add(LF.p, DU.p, MO.p, CHP.p, FL.p, STM.p);
 // whip trails: a ribbon behind each great cane's tip and each front leg's, all in one mesh
 const TRN = 16, TRC = CANES.filter((c) => c.great || c.g === 'F'), trPos = new Float32Array(TRC.length * TRN * 6), trCol = new Float32Array(TRC.length * TRN * 6), trIdx = [];
 for (let r = 0; r < TRC.length; r++) for (let i = 0; i < TRN - 1; i++) { const a = (r * TRN + i) * 2; trIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
 const trG = new THREE.BufferGeometry(); trG.setAttribute('position', new THREE.BufferAttribute(trPos, 3).setUsage(THREE.DynamicDrawUsage)); trG.setAttribute('color', new THREE.BufferAttribute(trCol, 3).setUsage(THREE.DynamicDrawUsage)); trG.setIndex(trIdx);
 const trail = new THREE.Mesh(trG, new THREE.MeshBasicMaterial(Object.assign({ vertexColors: true, side: THREE.DoubleSide }, ADD))); trail.frustumCulled = false; trail.visible = false; trail.renderOrder = 7; fx.add(trail);
 const TR = TRC.map((C) => ({ C, tip: Array.from({ length: TRN }, () => V3()), mid: Array.from({ length: TRN }, () => V3()), prev: 0 }));
 // the heart's light, spilling out between the sepals onto the canes round it, and the firelight while it burns
 const heartLight = new THREE.PointLight(0xff3a6a, 0, 11 * SZ, 2), fireLight = new THREE.PointLight(0xff7a2c, 0, 9 * SZ, 2); fx.add(heartLight, fireLight);
 // cracks in the ground: six strips, each from ckA to ckB, rewritten every frame they show; their roots glow like the veins
 const NCK = 6, ckPos = new Float32Array(NCK * 12), ckUv = [], ckIdx = [], ckA = [], ckB = [], ckOn = new Float32Array(NCK);
 for (let i = 0; i < NCK; i++) { ckUv.push(0, 0, 0, 1, 1, 0, 1, 1); const b = i * 4; ckIdx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); ckA.push(V3()); ckB.push(V3()); }
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
 // shockwaves: rings racing out over the ground (the Awakening's roar, Hammerfall, Wrath, the spire's fall). Dust ones
 // darken what they pass over; glowing ones add light.
 const SHK = [0, 1, 2, 3].map(() => {
  const m = new THREE.Mesh(new THREE.RingGeometry(.6, 1, Q(80, 40), 1), new THREE.ShaderMaterial({
   uniforms: { uC: { value: new THREE.Color() }, uA: { value: 0 } }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
   vertexShader: 'varying float vR;\nvoid main(){ vR = length(position.xy); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
   fragmentShader: 'uniform vec3 uC; uniform float uA; varying float vR;\nvoid main(){ float e = smoothstep(.62, .92, vR) * (1. - smoothstep(.94, 1., vR)); if (e * uA < .004) discard; gl_FragColor = vec4(uC, e * uA); }' }));
  m.rotation.x = -PI / 2; m.frustumCulled = false; m.visible = false; m.renderOrder = 6; fx.add(m);
  return { m, t: 0, dur: 1, r0: 0, r1: 1, a: 0 };
 });
 let shkN = 0;
 function shock(x, z, r0, r1, dur, col, a, glow) { const S = SHK[shkN++ % SHK.length]; S.m.position.set(x, root.position.y + .04, z); S.t = 0; S.dur = dur; S.r0 = r0; S.r1 = r1; S.a = a; S.m.material.uniforms.uC.value.copy(col); S.m.material.blending = glow ? THREE.AdditiveBlending : THREE.NormalBlending; S.m.visible = true; }
 // Thorn Volley's thorns: thrown in high arcs, sticking where they land, then crumbling away (one instanced mesh)
 const NTV = 30, TV = new THREE.InstancedMesh(prickle(V3(), V3(0, 0, 1), V3(0, 1, 0), 1, .17, .45), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .45 }), NTV);
 TV.instanceMatrix.setUsage(THREE.DynamicDrawUsage); TV.frustumCulled = false; fx.add(TV);
 const TVS = Array.from({ length: NTV }, () => ({ t: -1, T: 1, p0: V3(), v: V3(), d: V3(), spin: 0, stick: -1 })), M0 = new THREE.Matrix4().makeScale(0, 0, 0);
 for (let i = 0; i < NTV; i++) TV.setMatrixAt(i, M0);
 let tvN = 0;
 // ribbons: life spiralling down the spire into the roots as it feeds (Devour), or pollen streaming to its prey (Siren Bloom)
 const DRN = 3, DRS = 26, drPos = new Float32Array(DRN * (DRS + 1) * 6), drCol = new Float32Array(DRN * (DRS + 1) * 6), drIdx = [];
 for (let r = 0; r < DRN; r++) for (let i = 0; i < DRS; i++) { const a = (r * (DRS + 1) + i) * 2; drIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
 const drG = new THREE.BufferGeometry(); drG.setAttribute('position', new THREE.BufferAttribute(drPos, 3).setUsage(THREE.DynamicDrawUsage)); drG.setAttribute('color', new THREE.BufferAttribute(drCol, 3).setUsage(THREE.DynamicDrawUsage)); drG.setIndex(drIdx);
 const drain = new THREE.Mesh(drG, new THREE.MeshBasicMaterial(Object.assign({ vertexColors: true, side: THREE.DoubleSide }, ADD))); drain.frustumCulled = false; drain.visible = false; drain.renderOrder = 8; fx.add(drain);

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

