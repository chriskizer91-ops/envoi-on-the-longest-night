
 // ---------- head: the game model's round face, one smooth sculpt ----------
 const Nk = part();
 Nk.add(uvs(new THREE.CylinderGeometry(0.041, 0.047, 0.14, Q(48, 16), 4, true), 4, 1), M.skin, [0, 1.3, -0.005]);
 Nk.build(neck, bw(neck));
 const head = new THREE.Group(); headB.add(head); STATIC.add(head);
 const HR = 0.15, HS = [1.0, 1.06, 0.97];
 const headPt = (az, el, k) => [HR * HS[0] * Math.sin(az) * Math.cos(el) * k, HR * HS[1] * Math.sin(el) * k, HR * HS[2] * Math.cos(az) * Math.cos(el) * k];
 function jaw(x, y, z) {
  if (y < -0.1) { const k = 1 - 0.3 * Math.pow((-y - 0.1) / 0.9, 1.4); x *= k; z *= lerp(1, k, 0.6); }
  return [x * HR * HS[0], y * HR * HS[1], z * HR * HS[2]];
 }
 function frameAt(az, el, off) {
  const p = jaw(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
  const a = HR * HS[0], b = HR * HS[1], c = HR * HS[2];
  _bz.set(p[0] / (a * a), p[1] / (b * b), p[2] / (c * c)).normalize();
  _bx.crossVectors(YA, _bz).normalize(); _by.crossVectors(_bz, _bx);
  _bm.makeBasis(_bx, _by, _bz);
  return { p: [p[0] + _bz.x * off, p[1] + _bz.y * off, p[2] + _bz.z * off], q: new THREE.Quaternion().setFromRotationMatrix(_bm) };
 }
 // the sculpt: her nose is now part of the face (the game model's small nose, the same size and place, risen out of the
 // skin rather than set on it), with cheeks a touch fuller under the blush
 const hg = new THREE.SphereGeometry(1, Q(160, 40), Q(120, 30)), hpos = hg.attributes.position;
 for (let i = 0; i < hpos.count; i++) {
  const ux = hpos.getX(i), uy = hpos.getY(i), uz = hpos.getZ(i), az = Math.atan2(ux, uz), el = Math.asin(cl(uy, -1, 1));
  let bump = .0062 * Math.exp(-((az / .062) ** 2) * Math.cos(el) - (((el + .245) / .046) ** 2)) * (uz > 0 ? 1 : 0);
  for (const sd of [-1, 1]) bump += .0016 * Math.exp(-(((az - sd * .5) / .26) ** 2) - (((el + .32) / .16) ** 2));
  const p = jaw(ux, uy, uz), k = 1 + bump / Math.hypot(p[0], p[1], p[2]);
  hpos.setXYZ(i, p[0] * k, p[1] * k, p[2] * k);
 }
 hg.computeVertexNormals();
 const headC = new THREE.Vector3(0, 0, 0);
 // fine dark hairs (brows and lashes): each a tapering tube through three points
 const fibre = (P, mat, pts, r0, col) => P.addWorld(lockStrands(pts, 1, 6, Q(5, 3), () => 0, 1, null, col, { thick: r0, jitter: 0, short: .001 }), mat);
 const DARK = C('#3a2224'), LASH = C('#1e1216'), LASHLOW = C('#5a3434');
 const Hd = part();
 Hd.addWorld(hg, M.face);
 const _p3 = V3(), _q3 = new THREE.Quaternion();
 const atFrame = (f, local) => _p3.set(local[0], local[1], local[2]).applyQuaternion(f.q).add(V3(f.p[0], f.p[1], f.p[2])).toArray();
 for (const sd of [-1, 1]) {
  const b0 = headPt(sd * 1.5, -0.12, 0.96), b1 = [sd * 0.157, -0.005, -0.02], b2 = [sd * 0.168, 0.038, -0.04];
  Hd.add(uvs(strand([b0, b1, b2], Q(32, 12), Q(20, 10), (t) => 0.017 * Math.pow(1 - t, 0.7) + 0.0015, 0.42, () => headC), 1, 1), M.skin);
  Hd.add(uvs(strand([headPt(sd * 1.5, -0.1, 0.985), [sd * 0.16, -0.002, -0.02], [sd * 0.168, 0.035, -0.038]], Q(28, 10), Q(16, 8), (t) => 0.011 * Math.pow(1 - t, 0.8), 0.35, () => headC), 1, 1), M.skinShade);
  // the brow: the game model's arc, as a soft band thicker at its inner end, with single hairs combed out along it
  const fb = frameAt(sd * 0.31, 0.2, 0.0015), fq = qz(fb.q, -sd * 0.08), F = { p: fb.p, q: fq };
  const arc = (s, rad) => { const th = PI * .29 + s * PI * .42; return atFrame(F, [rad * Math.cos(th), rad * Math.sin(th) * .55, 0]); };
  const inner = (s) => (sd < 0 ? s : 1 - s);
  const bpts = []; for (let s = 0; s <= 1.0001; s += .1) bpts.push(arc(s, .033));
  Hd.addWorld(lockStrands(bpts, 1, Q(24, 10), Q(8, 4), () => 0, 1, null, DARK, { thick: .0034, jitter: 0, short: .001 }), M.lash);
  for (let k = 0; k < Q(34, 10); k++) {
   const s = r2(), w = .0025 * (1 - .6 * inner(s)), out = sd < 0 ? -1 : 1, s2b = cl(s + out * -.06 * (sd < 0 ? -1 : 1), 0, 1);
   const a = arc(s, .033 - .0016 + (r2() - .5) * w), b = arc(cl(s + (sd < 0 ? .05 : -.05), 0, 1), .033 + .0012 + (r2() - .5) * w * .5);
   void s2b; void out;
   const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + .0006, (a[2] + b[2]) / 2 + .0006];
   fibre(Hd, M.lash, [a, m, b], .00055 + .0004 * (1 - inner(s)), DARK);
  }
 }
 { const f = frameAt(0, -0.42, 0.0005); Hd.add(new THREE.TorusGeometry(0.017, 0.003, Q(12, 6), Q(48, 16), Math.PI * 0.62).rotateZ(Math.PI * 1.19), M.lip, f.p, null, null, f.q); }
 { const f = frameAt(0, -0.47, -0.0005); Hd.add(new THREE.SphereGeometry(1, Q(32, 12), Q(20, 8)), M.lip, f.p, null, [0.0085, 0.0036, 0.004], f.q); }
 Hd.build(head);

 // eyes: shaded whites, a painted iris that looks around, a wet cornea over it that reflects the night, the game model's
 // two highlights, real lids for blinking, a lash line with single lashes and the two long flicks at the outer corner.
 // The whites, irises and highlights never move within an eye, so they sit in head space and are shared by both eyes.
 const SX = 0.03, SY = 0.036, SZ = 0.0078;
 const zS = (x, y) => SZ * Math.sqrt(Math.max(0, 1 - (x / SX) ** 2 - (y / SY) ** 2));
 const eyes = [], whiteG = [], shineG = [], irisE = [], darkE = part();
 for (const sd of [-1, 1]) {
  const f = frameAt(sd * 0.34, -0.07, -0.003);
  const eg = new THREE.Group(); eg.position.set(f.p[0], f.p[1], f.p[2]); eg.quaternion.copy(f.q); head.add(eg); eg.updateMatrix(); STATIC.add(eg);
  const sg = new THREE.SphereGeometry(1, Q(64, 24), Q(40, 16)); sg.scale(SX, SY, SZ);
  vcol(sg, (x, y, z, o) => { const k = 1 - 0.32 * sm(0.006, 0.034, y) - 0.06 * sm(-0.018, -0.036, y) - .05 * sm(.6, 1, Math.abs(x) / SX); o[0] = o[1] = lin1(k); o[2] = lin1(Math.min(1, k * 1.02)); });
  whiteG.push(sg.applyMatrix4(eg.matrix));
  const ig = new THREE.RingGeometry(0, 1, Q(72, 32), Q(14, 5)), ip = ig.attributes.position, base = new Float32Array(ip.count * 2);
  for (let i = 0; i < ip.count; i++) { base[i * 2] = ip.getX(i) * 0.0215; base[i * 2 + 1] = ip.getY(i) * 0.028; }
  irisE.push({ ig, base, n: ip.count, m: eg.matrix.clone(), q: eg.quaternion.clone() });
  shineG.push(merge([place(new THREE.SphereGeometry(0.0062, Q(24, 10), Q(16, 8)), [-0.0075, 0.0085, 0.0098]), place(new THREE.SphereGeometry(0.0033, Q(16, 8), Q(12, 6)), [0.007, -0.0135, 0.0092])]).applyMatrix4(eg.matrix));
  // the lower lash line and a few short lower lashes
  const low = (s, rr2) => { const th = PI * 1.25 + s * PI * .5; return [rr2 * 1.02 * Math.cos(th), -0.002 + rr2 * 1.2 * Math.sin(th), 0.004]; };
  const lpts = []; for (let s = 0; s <= 1.0001; s += .1) lpts.push(low(s, .0285));
  darkE.addWorld(xform(lockStrands(lpts, 1, Q(20, 8), Q(6, 4), () => 0, 1, null, LASHLOW, { thick: .0015, jitter: 0, short: .001 }), eg.matrix), M.lash);
  for (let k = 0; k < Q(10, 4); k++) {
   const s = .15 + .8 * (k + .5) / 10 * (sd < 0 ? 1 : 1), a = low(s, .0285), b = low(s + sd * .02, .0335 + .002 * r2());
   fibre(darkE, M.lash, [a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, .0055], [b[0], b[1], .006]].map((p) => _p3.set(p[0], p[1], p[2]).applyMatrix4(eg.matrix).toArray()), .00045, LASHLOW);
  }
  const dome = new THREE.SphereGeometry(1, Q(64, 24), Q(20, 8), 0, TAU, 0, Math.PI / 2); dome.rotateX(Math.PI / 2);
  const lid = new THREE.Group(); lid.position.set(0, 0.038, 0); eg.add(lid);
  const LD = part(); LD.add(dome, M.lid, [0, -0.038, 0], null, [0.0325, 0.038, 0.0105]); LD.build(lid);
  const lowL = new THREE.Group(); lowL.position.set(0, -0.038, 0); eg.add(lowL);
  const LW = part(); LW.add(dome, M.lid, [0, 0.038, 0], null, [0.0325, 0.038, 0.0105]); LW.build(lowL);
  // the upper lashes: the game model's lash line, a tapering band along the lid's edge, with lashes sweeping up and out,
  // longer toward the outer corner, and its two long flicks
  const lash = new THREE.Group(); eg.add(lash);
  const LS = part();
  const up = (s, rad) => { const th = PI * .03 + s * PI * .94; return [rad * 1.04 * Math.cos(th), -0.0366 + rad * 1.22 * Math.sin(th), 0.0035]; };
  const upts = []; for (let s = 0; s <= 1.0001; s += .05) upts.push(up(s, .03));
  LS.addWorld(lockStrands(upts, 1, Q(40, 12), Q(8, 4), () => 0, 1, null, LASH, { thick: .0034, jitter: 0, short: .001 }), M.lash);
  for (let k = 0; k < Q(36, 8); k++) {
   const s = (k + r2() * .6) / 36, outer = sd < 0 ? 1 - s : s, a = up(s, .03), th = PI * .03 + s * PI * .94;
   const dx = Math.cos(th) + sd * .5 * outer, dy = Math.sin(th) * 1.2 + .25, dl = Math.hypot(dx, dy), l = (.0025 + .0055 * outer * outer) * (.75 + .5 * r2());
   const b = [a[0] + dx / dl * l * .8, a[1] + dy / dl * l * .8 + l * .25, a[2] + l * .55], m = [a[0] + dx / dl * l * .45, a[1] + dy / dl * l * .45, a[2] + l * .45];
   fibre(LS, M.lash, [a, m, b], .00028 + .0002 * outer, LASH);
  }
  for (const [x, y, ang, len, r0] of [[sd * 0.0395, -0.024, -sd * 1.05, .02, .0045], [sd * 0.036, -0.011, -sd * 1.45, .015, .0034]]) {
   // a flick: the game model's cone, now curving a little up at its tip
   const dir = [-Math.sin(ang), Math.cos(ang)], a = [x - dir[0] * len / 2, y - dir[1] * len / 2, .004], b = [x + dir[0] * len / 2, y + dir[1] * len / 2 + .002, .0045];
   LS.addWorld(lockStrands([a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, .0048], b], 1, Q(14, 6), Q(8, 4), () => 0, 1, null, LASH, { thick: r0 * .82, jitter: 0, short: .001 }), M.lash);
  }
  LS.build(lash);
  // the cornea: clear, catching the night and the lamps; hidden with the highlights when the eye closes
  const cg = new THREE.SphereGeometry(1, Q(48, 16), Q(16, 6), 0, TAU, 0, Math.PI / 2); cg.rotateX(Math.PI / 2); cg.scale(SX * .96, SY * .96, .0094);
  const cornea = new THREE.Mesh(cg, M.cornea); cornea.renderOrder = 3; eg.add(cornea);
  lid.visible = lowL.visible = false;
  eyes.push({ lid, low: lowL, lash, cornea });
 }
 darkE.build(head);
 head.add(new THREE.Mesh(merge(whiteG), plain(M.eyeW)));
 const irisG = merge(irisE.map((e) => e.ig)), irisMesh = new THREE.Mesh(irisG, plain(M.iris));
 irisMesh.frustumCulled = false; head.add(irisMesh);
 const shineGeo = merge(shineG), SH0 = shineG[0].index.count, SH1 = shineG[1].index.count, shineMesh = new THREE.Mesh(shineGeo, M.shine);
 head.add(shineMesh);
 const IR = { ox: 9, oy: 9 };
 function setIris(ox, oy) {
  if (Math.abs(ox - IR.ox) < 1e-4 && Math.abs(oy - IR.oy) < 1e-4) return;
  IR.ox = ox; IR.oy = oy;
  const pos = irisG.attributes.position, nrm = irisG.attributes.normal;
  let o = 0;
  for (const e of irisE) {
   for (let i = 0; i < e.n; i++) {
    const x = e.base[i * 2], y = e.base[i * 2 + 1], X = x + ox, Y = y + oy, Z = zS(X, Y);
    _v.set(X, Y, Z + 0.0005).applyMatrix4(e.m); pos.setXYZ(o + i, _v.x, _v.y, _v.z);
    _v.set(X / (SX * SX), Y / (SY * SY), Z / (SZ * SZ) + 1e-3).normalize().applyQuaternion(e.q); nrm.setXYZ(o + i, _v.x, _v.y, _v.z);
   }
   o += e.n;
  }
  pos.needsUpdate = true; nrm.needsUpdate = true;
 }
 setIris(0, 0); IR.ox = IR.oy = 9; // a sensible ring until the first frame sets the real gaze
 // highlights show for each open eye; the right eye (drawn first) is never more closed than the left
 function setShine(v0, v1) {
  shineMesh.visible = v0 || v1;
  shineGeo.setDrawRange(v0 ? 0 : SH0, (v0 ? SH0 : 0) + (v1 ? SH1 : 0));
  eyes[0].cornea.visible = v0; eyes[1].cornea.visible = v1;
 }

 // round glasses: fine black frames with hinges, and glass that reflects
 const Gl = part(), GlL = part(), rimC = [];
 for (const sd of [-1, 1]) {
  const f = frameAt(sd * 0.34, -0.066, 0);
  const c = [f.p[0] + sd * 0.004, f.p[1], f.p[2] + 0.02];
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, sd * 0.2, 0));
  Gl.add(new THREE.TorusGeometry(0.047, 0.0036, Q(14, 6), Q(120, 36)), M.frame, c, null, null, q);
  const lg = new THREE.CircleGeometry(0.046, Q(64, 28)), lp = lg.attributes.position;
  for (let i = 0; i < lp.count; i++) { const r = Math.hypot(lp.getX(i), lp.getY(i)) / .046; lp.setZ(i, .0035 * (1 - r * r)); }
  lg.computeVertexNormals();
  GlL.add(lg, M.lensTint, c, null, null, q); GlL.add(lg, M.lens, c, null, null, q);
  rimC.push(c);
  const outer = [c[0] + sd * 0.046, c[1] + 0.003, c[2] - 0.0094], mid = [sd * 0.152, c[1] + 0.004, 0.05], ear = headPt(sd * 1.5, -0.03, 1.03);
  Gl.add(new THREE.BoxGeometry(.006, .0052, .007), M.frame, [outer[0] - sd * .001, outer[1], outer[2] + .002], [0, sd * .2, 0]);
  seg(Gl, M.frame, outer, mid, 0.0028, 0.0028, Q(12, 6), true);
  seg(Gl, M.frame, mid, ear, 0.0028, 0.0026, Q(12, 6), true);
 }
 Gl.add(new THREE.TorusGeometry(0.016, 0.003, Q(12, 6), Q(40, 14), Math.PI * 0.8).rotateZ(Math.PI * 0.1), M.frame, [0, rimC[0][1] - 0.002, (rimC[0][2] + rimC[1][2]) / 2 + 0.002]);
 Gl.build(head); GlL.build(head);
