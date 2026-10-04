
 // ---------- the body: every part where the game model has it, at its size, drawn finer ----------
 const SMP = DET > .6 ? 4 : 2;                       // points added between each pair of a profile
 const Tp = part(wTorso);
 Tp.add(uvs(lathe(smoothP([[0.118, 1.13], [0.126, 1.16], [0.13, 1.19], [0.12, 1.22], [0.098, 1.25], [0.07, 1.28], [0.05, 1.3]], SMP), Q(96, 24), null, 0.78, undefined, undefined, 1.22), 6, 2), M.skin);
 const bust = (r, y, a) => r + 0.016 * Math.exp(-(((y - 1.085) / 0.035) ** 2)) * Math.max(0, Math.cos(a)) ** 2;
 Tp.add(uvs(lathe(smoothP([[0.112, 0.86], [0.1, 0.9], [0.094, 0.95], [0.1, 1.0], [0.114, 1.04], [0.126, 1.08], [0.128, 1.11], [0.124, 1.14], [0.12, 1.165], [0.104, 1.17]], SMP), Q(144, 32), bust, 0.82, undefined, undefined, 1.05), 10, 5), M.bodice);
 Tp.build(root);

 // the sash: a satin band, a gathered knot and two tails
 const Sk = part(wSkirt);
 Sk.add(uvs(lathe(smoothP([[0.112, 0.876], [0.116, 0.884], [0.116, 0.912], [0.11, 0.921]], 3), Q(128, 24), (r, y, a) => r + .0006 * Math.sin(a * 23), 0.9), 3, 1), M.sash);
 { const k = new THREE.SphereGeometry(1, Q(40, 16), Q(28, 10)), p = k.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), f = 1 + .09 * Math.cos(5 * Math.atan2(y, x)) * (1 - Math.abs(z)); p.setXYZ(i, x * f, y * f, z); } k.computeVertexNormals(); Sk.add(uvs(k, 3, 1), M.sash, [0.012, 0.895, 0.104], null, [0.024, 0.02, 0.016]); }
 for (const s of [-1, 1]) {
  const pts = [[0.012 + 0.006 * s, 0.888, 0.112], [0.02 * s + 0.013, 0.82, 0.148], [0.03 * s + 0.014, 0.75, 0.166]];
  Sk.add(uvs(strand(pts, Q(40, 10), 12, (t) => 0.011 * (1 - 0.3 * t) * (1 + .06 * Math.sin(t * 19)), 0.3, (c) => new THREE.Vector3(0, c.y, 0)), 3, 1), M.sash);
 }
 // the dress: three ruffled tiers, the lower two open at the slit; its ruffles are the game model's, with a fine gathering
 const ruff = (amp, n, y0, y1) => (r, y, a) => r + amp * sm(y0, y1, y) * (Math.sin(n * a + 0.5) + 0.35 * Math.sin(2 * n * a + 1.3) + .1 * Math.sin(4.7 * n * a + 2.1));
 const SLIT = 0.42, DSEG = Q(256, 60);
 Sk.add(uvs(lathe(smoothP([[0.14, 0.575], [0.212, 0.582], [0.2, 0.64], [0.176, 0.72], [0.148, 0.8], [0.124, 0.86], [0.108, 0.9]], 3), DSEG, ruff(0.012, 12, 0.72, 0.6), 0.9), 5, 3), M.dress);
 Sk.add(uvs(lathe(smoothP([[0.2, 0.3], [0.274, 0.306], [0.262, 0.38], [0.242, 0.48], [0.216, 0.56], [0.19, 0.6], [0.162, 0.645]], 3), DSEG, ruff(0.017, 11, 0.5, 0.32), 0.9, SLIT + 0.17, TAU - 0.34), 5, 3), M.dress);
 Sk.add(uvs(lathe(smoothP([[0.27, 0.05], [0.322, 0.056], [0.312, 0.12], [0.296, 0.22], [0.276, 0.3], [0.255, 0.34], [0.232, 0.372]], 3), DSEG, ruff(0.02, 13, 0.25, 0.07), 0.9, SLIT + 0.24, TAU - 0.48), 5, 3), M.dress);
 Sk.build(root);

 const Lg = part(wLeg);
 for (const sd of [-1, 1]) Lg.add(uvs(lathe(smoothP([[0.052, 0.39], [0.057, 0.44], [0.061, 0.5], [0.068, 0.58], [0.074, 0.66], [0.08, 0.74], [0.084, 0.8], [0.08, 0.86]], SMP), Q(64, 14), null, 0.95), 5, 4), M.skin, [0.075 * sd, 0, 0]);
 Lg.build(root);

 const Ar = part(wArm);
 for (const sd of [-1, 1]) Ar.add(uvs(lathe(smoothP([[0.027, 0.735], [0.029, 0.76], [0.033, 0.82], [0.036, 0.88], [0.037, 0.94], [0.035, 0.965], [0.039, 1.0], [0.043, 1.08], [0.045, 1.15], [0.044, 1.2], [0.034, 1.235], [0.0, 1.248]], SMP), Q(48, 12), null, 0.92), 4, 4), M.skin, [0.155 * sd, 0, 0]);
 Ar.build(root);

 // ---------- the coat: open front, handkerchief-point hem, the game model's folds; velvet outside, satin lining inside,
 // a thickness between them, its gold-braid trim, and gold piping round every edge ----------
 const CT = smoothP([[0.38, 0.26], [0.335, 0.42], [0.265, 0.6], [0.205, 0.76], [0.168, 0.88], [0.158, 0.98], [0.162, 1.1], [0.176, 1.18], [0.19, 1.225], [0.152, 1.265], [0.105, 1.295]], 24);
 const aOpen = (v) => 0.5 + 0.34 * v;
 const hemY = (a) => 0.35 - 0.08 * Math.max(0, Math.cos(7 * (a - Math.PI))) ** 2 - 0.045 * Math.max(0, -Math.cos(a));
 function coatPt(u, v, o, off) {
  const ao = aOpen(v), a = ao + u * (TAU - 2 * ao);
  const y = v < 0.08 ? lerp(1.295, 1.215, v / 0.08) : lerp(1.215, hemY(a), (v - 0.08) / 0.92);
  const lo = sm(0.95, 0.32, y);
  const r = interp(CT, y) + lo * (0.026 * Math.sin(9 * a + 0.7) + 0.01 * Math.sin(17 * a + 2.1) + .0032 * Math.sin(31 * a + .4)) + (off || 0);
  const top = sm(1.14, 1.22, y), mid = sm(0.95, 1.05, y) * (1 - top);
  const xs = 1 + 0.12 * top - 0.05 * mid, zs = 0.9 - 0.18 * sm(1.12, 1.22, y);
  o[0] = r * Math.sin(a) * xs; o[1] = y; o[2] = r * Math.cos(a) * zs;
 }
 // a gold cord along a line of points, closing round if asked
 const piping = (pts, r, closed, n) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => V3(p[0], p[1], p[2])), !!closed), n, r, Q(8, 5), !!closed);
 const Co = part(wCoat);
 const CNU = Q(320, 64), CNV = Q(110, 22), _o3 = [0, 0, 0];
 Co.addWorld(uvs(sheet(CNU, CNV, (u, v, o) => coatPt(u, v, o, 0)), 5, 3), M.coat);
 Co.addWorld(uvs(sheet(CNU, CNV, (u, v, o) => coatPt(u, v, o, -0.0026)), 5, 3), M.lining);
 Co.addWorld(uvs(sheet(CNU, 2, (u, v, o) => coatPt(u, 0.968 + v * 0.032, o, 0.003)), 40, 1), M.trim);
 Co.addWorld(uvs(sheet(2, CNV, (u, v, o) => coatPt(u * 0.012, v, o, 0.003), true), 10, 1), M.trim);
 Co.addWorld(uvs(sheet(2, CNV, (u, v, o) => coatPt(0.988 + u * 0.012, v, o, 0.003), true), 10, 1), M.trim);
 Co.addWorld(uvs(sheet(CNU, 2, (u, v, o) => coatPt(u, v * 0.03, o, 0.003)), 10, 1), M.trim);
 {
  const edge = [], n = 90;
  for (let i = 0; i <= n; i++) { coatPt(0, i / n, _o3, -0.0012); edge.push(_o3.slice()); }
  for (let i = 1; i <= 160; i++) { coatPt(i / 160, 1, _o3, -0.0012); edge.push(_o3.slice()); }
  for (let i = n - 1; i >= 0; i--) { coatPt(1, i / n, _o3, -0.0012); edge.push(_o3.slice()); }
  Co.addWorld(piping(edge, .0024, false, Q(900, 200)), M.gold);
 }
 Co.build(root);

 function sleevePt(sd) {
  return (u, v, o, off) => {
   const a = u * TAU;
   const yEnd = 0.87 - 0.11 * Math.pow(Math.max(0, -Math.cos(a)), 1.5);
   const y = lerp(1.24, yEnd, v);
   let r = lerp(0.062, 0.078, sm(0, 0.35, v)) + 0.066 * sm(0.4, 1.0, v) ** 2 + 0.012 * sm(0.6, 1, v) * Math.sin(7 * a + sd) + .0025 * sm(.3, 1, v) * Math.sin(17 * a + 2 * sd);
   r = r * lerp(0.4, 1, sm(0, 0.12, v)) + (off || 0);
   o[0] = 0.155 * sd + r * Math.sin(a); o[1] = y; o[2] = r * Math.cos(a);
  };
 }
 const Sl = part(wArm);
 for (const sd of [-1, 1]) {
  const f = sleevePt(sd), NU = Q(120, 24), NV = Q(56, 10);
  Sl.addWorld(uvs(sheet(NU, NV, (u, v, o) => f(u, v, o, 0)), 2, 1.5), M.coat);
  Sl.addWorld(uvs(sheet(NU, NV, (u, v, o) => f(u, v, o, -0.0022)), 2, 1.5), M.lining);
  Sl.addWorld(uvs(sheet(NU, 2, (u, v, o) => f(u, 0.955 + v * 0.045, o, 0.003)), 10, 1), M.trim);
  const cuff = []; for (let i = 0; i < 120; i++) { f(i / 120, 1, _o3, -0.001); cuff.push(_o3.slice()); }
  Sl.addWorld(piping(cuff, .0022, true, Q(240, 60)), M.gold);
 }
 Sl.build(root);

 // the hood, lying down at the back of the neck, in soft folds
 const chB = bw(chest), Hood = part();
 {
  const g = new THREE.SphereGeometry(1, Q(64, 16), Q(40, 10)), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), f = 1 + .07 * Math.sin(7 * Math.atan2(x, z) + 1) * (1 - Math.abs(y)) + .04 * Math.sin(13 * Math.atan2(x, y)); p.setXYZ(i, x * f, y * f, z * f); }
  g.computeVertexNormals();
  Hood.add(uvs(g, 5, 3), M.coat, [0, 1.175, -0.1], null, [0.13, 0.055, 0.05]);
 }
 Hood.add(uvs(new THREE.TorusGeometry(0.12, 0.006, Q(12, 6), Q(96, 16), Math.PI), 10, 1), M.trim, [0, 1.2, -0.11], [Math.PI / 2 + 0.25, 0, Math.PI], [1, 0.42, 1]);
 Hood.build(chest, chB);

 // ---------- knee-high boots: creased leather, two stitched straps with gold buckles, a rolled top, a crescent anklet ----------
 const BOOTP = [[0.046, -0.345], [0.049, -0.3], [0.052, -0.22], [0.056, -0.12], [0.059, -0.05], [0.066, -0.02], [0.068, -0.004], [0.062, 0.0]];
 for (let i = 0; i < 2; i++) {
  const sd = i === 0 ? -1 : 1;
  const Bs = part();
  Bs.add(uvs(lathe(smoothP(BOOTP, 3), Q(72, 14), (r, y, a) => r + .0005 * sm(-.34, -.3, y) * (1 - sm(-.3, -.22, y)) * Math.sin(a * 9), 0.95), 1.5, 1.2), M.boot);
  Bs.add(new THREE.TorusGeometry(.0625, .0022, Q(8, 5), Q(72, 16)), M.bootDark, [0, -.0008, 0], [Math.PI / 2, 0, 0], [1, .95, 1]);
  for (const y of [-0.27, -0.13]) {
   const R = interp(BOOTP.map((p) => [p[0], p[1]]), y);
   Bs.add(uvs(lathe([[R - .001, y - .0068], [R + .0045, y - .0066], [R + .0058, y - .004], [R + .006, y + .004], [R + .0045, y + .0066], [R - .001, y + .0068]], Q(72, 14), null, 0.95), 3, .2), M.bootDark);
   // the buckle: a gold frame on her outer side with its prong, and the strap's end through it
   const bx = sd * (R + .007);
   for (const [p, s] of [[[0, .0095, 0], [.0028, .0028, .021]], [[0, -.0095, 0], [.0028, .0028, .021]], [[0, 0, .0093], [.0028, .021, .0028]], [[0, 0, -.0093], [.0028, .021, .0028]]]) {
    Bs.add(new THREE.CylinderGeometry(.0014, .0014, Math.max(s[1], s[2]), 8), M.gold, [bx + p[0], y + p[1], .004 + p[2]], s[1] > s[2] ? null : [Math.PI / 2, 0, 0]);
    for (const e of [-1, 1]) if (s[1] > s[2]) Bs.add(new THREE.SphereGeometry(.0016, 8, 6), M.gold, [bx + p[0], y + p[1] + e * .0105, .004 + p[2]]);
   }
   Bs.add(new THREE.CylinderGeometry(.0009, .0009, .018, 6), M.gold, [bx + sd * .0012, y, .004], [Math.PI / 2, 0, 0]);
   Bs.add(new THREE.BoxGeometry(0.009, 0.012, 0.014, 2, 2, 2), M.bootDark, [sd * (R + .009), y, -.012]);
  }
  Bs.build(knees[i]);
  const Ft = part();
  Ft.add(uvs(new THREE.SphereGeometry(1, Q(40, 12), Q(28, 8)), 1, 1), M.boot, [0, -0.036, 0.04], null, [0.047, 0.042, 0.1]);
  Ft.add(uvs(new THREE.SphereGeometry(1, Q(32, 10), Q(24, 8)), 1, 1), M.boot, [0, -0.048, 0.1], null, [0.04, 0.032, 0.05]);
  // the sole, its edge a little proud of the upper, and a block heel
  Ft.add(uvs(lathe([[0, -.5], [.96, -.5], [1, -.38], [1, .38], [.96, .5], [0, .5]], Q(48, 12)), 2, 1), M.bootDark, [0, -0.082, 0.042], null, [0.05, 0.014, 0.115]);
  Ft.add(new THREE.BoxGeometry(0.042, 0.05, 0.04, 3, 4, 3), M.bootDark, [0, -0.07, -0.035]);
  Ft.add(new THREE.TorusGeometry(0.05, 0.0028, Q(10, 5), Q(96, 16)), M.gold, [0, 0.0, 0.002], [Math.PI / 2 - 0.1, 0, 0]);
  Ft.add(new THREE.TorusGeometry(0.009, 0.0026, Q(10, 5), Q(32, 12), Math.PI * 1.3), M.gold, [sd * 0.034, -0.014, 0.037], [0, sd * 0.8, Math.PI * 1.35]);
  Ft.build(ankles[i]);
 }

 // ---------- hands: the game model's slender fingers, each one smooth tube through its joints, lacquered nails ----------
 function finger(P, a, m, b, r0, r1) {
  const g = strand([a, m, b], Q(18, 6), Q(12, 6), (t) => lerp(r0, r1, t) * (1 + .07 * Math.exp(-(((t - .5) / .1) ** 2))), 1, null);
  P.addWorld(uvs(g, 1, 1), M.skin);
  P.add(new THREE.SphereGeometry(r1, Q(12, 6), Q(10, 5)), M.skin, b);
  P.add(new THREE.SphereGeometry(r0, Q(12, 6), Q(10, 5)), M.skin, a);
 }
 function hand(P, sd, cup) {
  P.add(uvs(new THREE.SphereGeometry(1, Q(32, 12), Q(24, 8)), 1, 1), M.skin, [0, -0.028, 0.002], null, [0.016, 0.03, 0.03]);
  const zs = [0.016, 0.005, -0.006, -0.016], L1 = [0.019, 0.021, 0.02, 0.016], L2 = [0.017, 0.019, 0.018, 0.015];
  for (let f = 0; f < 4; f++) {
   const a1 = cup ? 0.35 + f * 0.06 : 1.25 + f * 0.05, a2 = a1 + (cup ? 0.45 : 1.45);
   const b = [-sd * 0.002, -0.054, zs[f]];
   const m = [b[0] - sd * L1[f] * Math.sin(a1), b[1] - L1[f] * Math.cos(a1), b[2]];
   const d2 = [-sd * Math.sin(a2), -Math.cos(a2), 0], tip = [m[0] + d2[0] * L2[f], m[1] + d2[1] * L2[f], m[2]];
   finger(P, b, m, tip, 0.0068, 0.0056);
   const n = [sd * Math.cos(a2), -Math.sin(a2), 0];
   _bz.set(n[0], n[1], n[2]).normalize(); _by.set(-d2[0], -d2[1], -d2[2]).normalize(); _bx.crossVectors(_by, _bz); _bm.makeBasis(_bx, _by, _bz);
   P.add(new THREE.SphereGeometry(1, Q(16, 8), Q(12, 6)), M.nail, [tip[0] - d2[0] * 0.004 + n[0] * 0.005, tip[1] - d2[1] * 0.004 + n[1] * 0.005, tip[2]], null, [0.0048, 0.0065, 0.0018], new THREE.Quaternion().setFromRotationMatrix(_bm));
  }
  const t0 = [-sd * 0.006, -0.02, 0.026];
  const t1 = cup ? [-sd * 0.016, -0.036, 0.04] : [-sd * 0.02, -0.04, 0.03];
  const t2 = cup ? [-sd * 0.024, -0.05, 0.046] : [-sd * 0.024, -0.055, 0.016];
  finger(P, t0, t1, t2, 0.0078, 0.0064);
 }
 for (let i = 0; i < 2; i++) { const P = part(); hand(P, i === 0 ? -1 : 1, i === 1); P.build(wrists[i]); }
 const Br = part();
 [[0.0335, M.silver, 0.0], [0.035, M.cord, 0.012], [0.034, M.silver, 0.022]].forEach((b, k) => Br.add(new THREE.TorusGeometry(b[0], 0.0034, Q(12, 6), Q(72, 22)), b[1], [0, -0.178 - b[2], 0], [Math.PI / 2 + 0.12 * (k - 1), 0, 0.1 * k]));
 Br.build(elbows[1]);

 // ---------- the dagger (her right hand): a wrapped grip with gold rings, a fluted pommel, a ringed guard, and a ridged
 // blade with a fuller, engraved with a crescent and stars ----------
 const dagger = new THREE.Group(); dagger.position.set(0.018, -0.048, 0.004); dagger.rotation.set(-0.25, 0, 0); wrists[0].add(dagger); STATIC.add(dagger);
 const Dg = part();
 {
  const grip = lathe(smoothP([[0.0115, -0.0425], [0.0112, 0], [0.0105, 0.0425]], 12), Q(48, 12), (r, y, a) => r + .0007 * Math.abs(Math.sin(a + y * 230)));
  Dg.add(uvs(grip, 1, 1), M.handle, [0, 0, 0], [Math.PI / 2, 0, 0]);
  const pom = lathe(smoothP([[0, -.013], [.008, -.011], [.0125, -.004], [.013, .002], [.009, .01], [.004, .0125], [0, .013]], 4), Q(48, 12), (r, y, a) => r * (1 + .07 * Math.abs(Math.cos(4 * a))));
  Dg.add(pom, M.gold, [0, 0, -0.05], [Math.PI / 2, 0, 0]);
 }
 for (const z of [-0.03, -0.01, 0.01, 0.03]) Dg.add(new THREE.TorusGeometry(0.0113, 0.0017, Q(8, 4), Q(40, 14)), M.gold, [0, 0, z]);
 Dg.add(new THREE.TorusGeometry(0.019, 0.0042, Q(16, 8), Q(64, 20)), M.gold, [0, 0, 0.049]);
 Dg.add(lathe(smoothP([[.0062, -.035], [.0048, -.02], [.0044, 0], [.0048, .02], [.0062, .035]], 4), Q(20, 8), null, .9), M.gold, [0, 0, 0.049], [0, 0, Math.PI / 2]);
 for (const x of [-0.037, 0.037]) Dg.add(new THREE.SphereGeometry(0.007, Q(24, 8), Q(16, 6)), M.gold, [x, 0, 0.049]);
 {
  // the blade: a section with edges, bevels and a fuller groove down the middle, tapering to its point
  const SEC = [[1, 0], [.84, .3], [.36, .94], [.17, 1], [0, .74], [-.17, 1], [-.36, .94], [-.84, .3], [-1, 0], [-.84, -.3], [-.36, -.94], [-.17, -1], [0, -.74], [.17, -1], [.36, -.94], [.84, -.3], [1, 0]];
  const NL = Q(48, 10), ns = SEC.length, P = new Float32Array((NL + 1) * ns * 3), UVb = new Float32Array((NL + 1) * ns * 2), idx = [];
  for (let i = 0; i <= NL; i++) {
   const t = i / NL, w = 0.02 * (1 - t) * (1 + .14 * Math.sin(PI * t)), h = 0.0036 * (1 - t) * (1 + .1 * Math.sin(PI * t)), z = 0.056 + t * 0.19;
   for (let j = 0; j < ns; j++) { const k = i * ns + j; P[k * 3] = SEC[j][0] * w; P[k * 3 + 1] = SEC[j][1] * h; P[k * 3 + 2] = z; UVb[k * 2] = t * .92 + .04; UVb[k * 2 + 1] = SEC[j][0] * .5 + .5; }
  }
  for (let i = 0; i < NL; i++) for (let j = 0; j < ns - 1; j++) { const a = i * ns + j, b = a + 1, c = a + ns, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.BufferAttribute(UVb, 2)); g.setIndex(idx); g.computeVertexNormals();
  Dg.addWorld(g, M.blade);
 }
 Dg.build(dagger);
 const charm = new THREE.Group(); charm.position.set(0, 0, -0.058); dagger.add(charm);
 const Ch = part();
 for (let k = 0; k < 3; k++) Ch.add(new THREE.TorusGeometry(0.005, 0.0013, Q(8, 4), Q(20, 8)), M.gold, [0, -0.006 - k * 0.009, 0], [0, k % 2 ? Math.PI / 2 : 0, 0]);
 Ch.add(new THREE.TorusGeometry(0.009, 0.0025, Q(10, 5), Q(40, 14), Math.PI * 1.3), M.gold, [0, -0.041, 0], [0, 0, Math.PI * 1.35]);
 Ch.add(crossGeo(.003, .022, .013, .003, .006, .003, .0006), M.gold, [0, -0.066, 0]);
 Ch.build(charm);

 // ---------- necklace: a twisted black cord, a gold crescent and cross ----------
 const Nl = part();
 {
  const cord = new THREE.CatmullRomCurve3([[0, 1.275, -0.075], [0.066, 1.268, -0.03], [0.078, 1.245, 0.04], [0.046, 1.2, 0.1], [0, 1.162, 0.123], [-0.046, 1.2, 0.1], [-0.078, 1.245, 0.04], [-0.066, 1.268, -0.03]].map((p) => new THREE.Vector3(p[0], p[1], p[2])), true);
  const n = Q(480, 64), fr = cord.computeFrenetFrames(n, true), c = V3();
  for (let ply = 0; ply < 2; ply++) {
   const pts = [];
   for (let i = 0; i < n; i++) { const t = i / n, th = t * TAU * 80 + ply * PI; cord.getPointAt(t, c); pts.push(c.clone().addScaledVector(fr.normals[i], Math.cos(th) * .0012).addScaledVector(fr.binormals[i], Math.sin(th) * .0012)); }
   Nl.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), n * 2, 0.00135, Q(6, 4), true), M.cord);
  }
 }
 Nl.add(new THREE.TorusGeometry(0.004, 0.0015, Q(8, 4), Q(24, 10)), M.gold, [0, 1.157, 0.126]);
 Nl.add(new THREE.TorusGeometry(0.017, 0.0042, Q(12, 6), Q(48, 18), Math.PI).rotateZ(Math.PI), M.gold, [0, 1.145, 0.128]);
 Nl.add(crossGeo(.0042, .03, .017, .0042, .006, .003, .0007), M.gold, [0, 1.108, 0.13]);
 Nl.build(chest, chB);
