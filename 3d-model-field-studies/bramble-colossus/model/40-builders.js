 // ---------- geometry helpers ----------
 const BK = new Map(); // material -> geometries to merge into one skinned mesh
 const put = (mat, g) => { let l = BK.get(mat); if (!l) BK.set(mat, (l = [])); l.push(g); return g; };
 function geo(pos, idx, extra) {
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  for (const k in extra || {}) if (extra[k]) g.setAttribute(k, new THREE.Float32BufferAttribute(extra[k][0], extra[k][1]));
  g.setIndex(idx); return g;
 }
 function surf(nu, nv, f, uvf) {
  const pos = [], uv = [], idx = [], o = [0, 0, 0];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const u = i / nu, v = j / nv; f(u, v, o); pos.push(o[0], o[1], o[2]); const t = uvf ? uvf(u, v) : [u, 1 - v]; uv.push(t[0], t[1]); }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = geo(pos, idx, { uv: [uv, 2] }); g.computeVertexNormals(); return g;
 }
 // a tube along a curve with a radius that may vary along it and around it (Frenet frames, for roots and stems)
 function tube(pts, segs, rs, rFn, uvK) {
  const curve = pts.getPointAt ? pts : new THREE.CatmullRomCurve3(pts.map((p) => (p.isVector3 ? p : V3(p[0], p[1], p[2]))));
  const fr = curve.computeFrenetFrames(segs, false), pos = [], nor = [], uv = [], idx = [], P = V3(), D = V3();
  for (let i = 0; i <= segs; i++) {
   const t = i / segs; curve.getPointAt(t, P);
   for (let j = 0; j <= rs; j++) { const th = j / rs * TAU, r = rFn(t, th); D.copy(fr.normals[i]).multiplyScalar(Math.cos(th)).addScaledVector(fr.binormals[i], Math.sin(th)); pos.push(P.x + D.x * r, P.y + D.y * r, P.z + D.z * r); nor.push(D.x, D.y, D.z); uv.push(j / rs, t * (uvK || 1)); }
  }
  for (let i = 0; i < segs; i++) for (let j = 0; j < rs; j++) { const a = i * (rs + 1) + j, b = a + rs + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  return geo(pos, idx, { normal: [nor, 3], uv: [uv, 2] });
 }
 // a near-straight tube along d from s0 to s1 in the bind pose, rings held square to d by a fixed frame (e1, e2):
 // canes, shoots and horns. wob(s, out) nudges the axis sideways and up a little. Normals come from the surface itself,
 // so ridges and knots shade.
 function rodTube(B, d, e1, e2, s0, s1, nu, rs, rFn, wob, uvLen, uvRound) {
  const pos = [], uv = [], idx = [], S = [], TH = [], w = [0, 0];
  for (let i = 0; i <= nu; i++) {
   const s = lerp(s0, s1, i / nu); w[0] = w[1] = 0; if (wob) wob(s, w);
   const cx = B.x + d.x * s + e1.x * w[0] + e2.x * w[1], cy = B.y + d.y * s + e1.y * w[0] + e2.y * w[1], cz = B.z + d.z * s + e1.z * w[0] + e2.z * w[1];
   for (let j = 0; j <= rs; j++) {
    const th = j / rs * TAU, r = rFn(s, th), c = Math.cos(th), sn = Math.sin(th);
    pos.push(cx + (e1.x * c + e2.x * sn) * r, cy + (e1.y * c + e2.y * sn) * r, cz + (e1.z * c + e2.z * sn) * r); uv.push(j / rs * (uvRound || 1), (s - s0) / (uvLen || .5)); S.push(s); TH.push(th);
   }
  }
  for (let i = 0; i < nu; i++) for (let j = 0; j < rs; j++) { const a = i * (rs + 1) + j, b = a + rs + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  const g = geo(pos, idx, { uv: [uv, 2] }); g.computeVertexNormals(); seamNormals(g, nu, rs);
  g.userData.S = S; g.userData.TH = TH; return g;
 }
 // a tube's first and last column of vertices share a seam: give both the same normal
 function seamNormals(g, nu, rs) { const n = g.attributes.normal; for (let i = 0; i <= nu; i++) { const a = i * (rs + 1), b = a + rs; const x = n.getX(a) + n.getX(b), y = n.getY(a) + n.getY(b), z = n.getZ(a) + n.getZ(b), l = Math.hypot(x, y, z) || 1; n.setXYZ(a, x / l, y / l, z / l); n.setXYZ(b, x / l, y / l, z / l); } }
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
 // vertex colours, given in sRGB (made linear here when LIN)
 const colorAll = (g, c) => { const q = lc(c); return attr(g, 'color', 3, (i, o) => { o[0] = q[0]; o[1] = q[1]; o[2] = q[2]; }); };
 const shadeBy = (g, f) => attr(g, 'color', 3, (i, o) => { const p = g.attributes.position, c = f(p.getX(i), p.getY(i), p.getZ(i), i); o[0] = lin1(c[0]); o[1] = lin1(c[1]); o[2] = lin1(c[2]); });
 // which cane a vertex belongs to and how far along it (for the severing cut); -1 for everything else
 const cnAll = (g, k, f) => attr(g, 'aCn', 2, (i, o) => { o[0] = k; o[1] = f; });
 const oldAll = (g, v) => attr(g, 'aOld', 1, (i, o) => { o[0] = v; });
 // a chain's skin weights at distance s along it: a linear blend between neighbouring bones, centred on each joint
 function chainW(chain, seg, n, s) {
  const f = s / seg - .5, i0 = Math.floor(f), t = f - i0;
  if (s <= seg * .5) return [[BI[chain[0].name], 1]];
  if (s >= (n + .5) * seg) return [[BI[chain[n].name], 1]];
  return [[BI[chain[i0].name], 1 - t], [BI[chain[i0 + 1].name], t]];
 }
 const caneW = (C, s) => chainW(C.chain, C.seg, NS, s);
 const DEF = { color: 1, skinWeight: [1, 0, 0, 0], aCn: [-1, 0], aFl: [0, 0, 1, 0] };
 function mergeAll(list) {
  const names = new Set(); let nv = 0, ni = 0;
  for (const g of list) { if (!g.attributes.normal) g.computeVertexNormals(); for (const k in g.attributes) names.add(k); nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
  const out = new THREE.BufferGeometry();
  for (const k of names) {
   const size = list.find((g) => g.attributes[k]).attributes[k].itemSize, arr = new Float32Array(nv * size); let vo = 0;
   for (const g of list) {
    const c = g.attributes.position.count, a = g.attributes[k];
    if (a) arr.set(a.array, vo * size);
    else if (DEF[k] === 1) arr.fill(1, vo * size, (vo + c) * size);
    else if (DEF[k]) for (let i = 0; i < c; i++) for (let q = 0; q < size; q++) arr[(vo + i) * size + q] = DEF[k][q];
    vo += c;
   }
   out.setAttribute(k, new THREE.BufferAttribute(arr, size));
  }
  const I = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni); let vo = 0, io = 0;
  for (const g of list) { const c = g.attributes.position.count; if (g.index) { const a = g.index.array; for (let k = 0; k < a.length; k++) I[io + k] = a[k] + vo; io += a.length; } else { for (let k = 0; k < c; k++) I[io + k] = vo + k; io += c; } vo += c; }
  out.setIndex(new THREE.BufferAttribute(I, 1)); out.computeBoundingSphere(); return out;
 }
 const _m4 = new THREE.Matrix4();

 // ---------- prickles ----------
 // A blackberry prickle: broad and flattened where it grows from the cane (its base runs along the cane, not round it),
 // narrowing fast and hooking back toward the cane's base; wine-red at the root like the bark, then red-brown, then
 // straw at the hard point. S the surface point, n out of the surface, d along the cane toward its tip.
 const PR_C = [[.3, .1, .13], [.4, .13, .1], [.78, .64, .46]];
 function prickle(S, n, d, len, rb, hk, dead) {
  const nu = DET > .6 ? 6 : 3, rs = DET > .6 ? 7 : 4, pos = [], col = [], idx = [], T = V3(), P = V3(), e1 = V3(), e2 = V3();
  const hook = hk === undefined ? .5 + .25 * rnd3() : hk;
  for (let i = 0; i <= nu; i++) {
   const t = i / nu; P.copy(S).addScaledVector(n, len * t - rb * .35).addScaledVector(d, -len * hook * t * t);
   T.copy(n).multiplyScalar(len).addScaledVector(d, -2 * len * hook * t).normalize();
   e1.copy(d).addScaledVector(T, -d.dot(T)).normalize(); e2.crossVectors(T, e1).normalize(); // e1 along the cane, e2 across it
   const r = rb * Math.pow(1 - t, 1.25), along = r * (1 + 1.6 * Math.pow(1 - t, 2.2)), across = r * .62;
   let c = t < .4 ? PR_C[0].map((v, k) => lerp(v, PR_C[1][k], t / .4)) : PR_C[1].map((v, k) => lerp(v, PR_C[2][k], sm(.4, .92, t)));
   if (dead) c = c.map((v, k) => lerp(v, [.5, .46, .42][k], .7));
   const q = lc(c.map((v) => v * DARK));
   for (let j = 0; j < rs; j++) { const th = j / rs * TAU, cx = Math.cos(th) * along, sx = Math.sin(th) * across; pos.push(P.x + e1.x * cx + e2.x * sx, P.y + e1.y * cx + e2.y * sx, P.z + e1.z * cx + e2.z * sx); col.push(q[0], q[1], q[2]); }
  }
  for (let i = 0; i < nu; i++) for (let j = 0; j < rs; j++) { const a = i * rs + j, b = i * rs + (j + 1) % rs; idx.push(a, a + rs, b, b, a + rs, b + rs); }
  const g = geo(pos, idx, { color: [col, 3] }); g.computeVertexNormals(); return g;
 }

 // ---------- leaves ----------
 // A compound leaf: a prickly stalk from O along Ly, and on it three leaflets (a long terminal one and two to the sides)
 // or five (two more, smaller, lower down, swept back), each a curved surface folded along its midrib, drooping and
 // twisting a little, with the atlas's toothed leaflet on it. Ln is the leaf's face. kind: 0 winter-green, 1 wine-red,
 // 2 young bronze, 3 dead. Returns { leaf (M.leaf), stalk (M.vc) } geometries in the body's bind space.
 const leafTint = () => [r3(.84, 1.1), r3(.88, 1.12), r3(.8, 1.04)];
 function compoundLeaf(O, Ly, Ln, size, kind, five, fl) {
  const ny = DET > .6 ? 7 : 4, nx = DET > .6 ? 4 : 2, Lx = V3().crossVectors(Ly, Ln).normalize(), Nn = V3().crossVectors(Lx, Ly).normalize();
  const pl = size * r3(.22, .32), tip = O.clone().addScaledVector(Ly, pl).addScaledVector(Nn, pl * .12);
  const stalk = tube([O, O.clone().lerp(tip, .5).addScaledVector(Nn, pl * .1), tip], 3, DET > .6 ? 5 : 3, (t) => size * .016 * (1 - .35 * t));
  colorAll(stalk, kind === 3 ? [.42, .3, .2] : [.36 * DARK, .2 * DARK, .14]);
  const leaves = [], pr = [];
  const ph = fl && fl.ph !== undefined ? fl.ph : r3(0, TAU), amp = fl && fl.amp !== undefined ? fl.amp : 1, thin = fl && fl.thin !== undefined ? fl.thin : rnd3();
  const tint = leafTint(), u0 = (kind % 2) * .5, v0 = kind < 2 ? .5 : 0;
  const one = (P0, dir, L, W) => {
   const dx = V3().crossVectors(dir, Nn).normalize(), dn = V3().crossVectors(dx, dir).normalize(), fold = r3(.1, .2), droop = r3(.12, .3), twist = r3(-.25, .25), curlE = r3(-.05, .12);
   const pos = [], uv = [], idx = [], flA = [], cA = [];
   for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
    const xn = i / nx * 2 - 1, yn = j / ny, x = xn * W / 2, y = yn * L;
    const z = fold * W * Math.abs(xn) * (1 - .4 * yn) - droop * L * yn * yn + curlE * W * xn * xn + twist * x * yn;
    pos.push(P0.x + dx.x * x + dir.x * y + dn.x * z, P0.y + dx.y * x + dir.y * y + dn.y * z, P0.z + dx.z * x + dir.z * y + dn.z * z);
    uv.push(u0 + (xn * .5 + .5) * .5, v0 + .003 + yn * .494); flA.push(amp * Math.pow(yn, 1.3) * L * 4, ph, thin, 0); const q = lc(tint); cA.push(q[0], q[1], q[2]);
   }
   for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
   const g = geo(pos, idx, { uv: [uv, 2], aFl: [flA, 4], color: [cA, 3] }); g.computeVertexNormals(); leaves.push(g);
  };
  const L1 = size * .62, W1 = L1 * .62, rot = (a) => V3().copy(Ly).applyAxisAngle(Nn, a);
  one(tip.clone().addScaledVector(Ly, -L1 * .04), Ly.clone(), L1, W1);
  for (const sd of [-1, 1]) {
   one(tip.clone().addScaledVector(Ly, -L1 * .03), rot(sd * r3(.85, 1.05)), L1 * .82, W1 * .82);
   if (five) one(tip.clone().addScaledVector(Ly, -pl * .35), rot(sd * r3(1.75, 2.05)), L1 * .55, W1 * .55);
  }
  // two tiny hooked prickles on the stalk's underside
  if (DET > .6) for (let i = 0; i < 2; i++) { const f = .3 + .35 * i; pr.push(prickle(O.clone().lerp(tip, f).addScaledVector(Nn, -size * .012), Nn.clone().negate(), Ly.clone().negate(), size * .045, size * .014, .5, kind === 3)); }
  return { leaf: leaves, stalk: [stalk].concat(pr) };
 }

 // ---------- fruit ----------
 // A blackberry: round drupelets packed over an ellipsoid round a dark core, each still carrying its dry style (a fine
 // whisker), with a green calyx of five reflexed sepals where its stalk joins. ripe 0 hard green, .4 red, .7 and on
 // glossy purple-black. Built hanging down from (cx, cy, cz). out collects berries; hairs collects whiskers and calyx.
 const DRUP = (() => { // a drupelet cap facing +z: a centre, two rings; normals from the sphere
  const p = [0, 0, 1], i = [], R = DET > .6 ? [[.62, 7], [1.32, 7]] : [[1.3, 5]];
  let base = 1;
  R.forEach(([el, n], r) => { for (let k = 0; k < n; k++) { const a = (k + r * .5) / n * TAU; p.push(Math.sin(el) * Math.cos(a), Math.sin(el) * Math.sin(a), Math.cos(el)); } });
  const n0 = R[0][1];
  for (let k = 0; k < n0; k++) i.push(0, 1 + k, 1 + (k + 1) % n0);
  if (R.length > 1) { const n1 = R[1][1], o1 = 1 + n0; for (let k = 0; k < n1; k++) { const a = 1 + k, b = 1 + (k + 1) % n0, c = o1 + k, d = o1 + (k + 1) % n1; i.push(a, c, d, a, d, b); } }
  return { p, i };
 })();
 const CORE = (() => { const g = new THREE.SphereGeometry(1, 8, 6); return { p: Array.from(g.attributes.position.array), i: Array.from(g.index.array) }; })();
 function berry(cx, cy, cz, len, rad, ripe, out, hairs) {
  const col = ripe > .7 ? [.1, .035, .1] : ripe > .35 ? [.52, .04, .1] : ripe > .2 ? [.62, .26, .12] : [.42, .55, .2];
  const P = out.p, N = out.n, C = out.c, I = out.i;
  const _o = V3(), _z = V3(0, 0, 1), _qq = new THREE.Quaternion(), _t = V3();
  const hl = len / 2, cy0 = cy - hl, rd = rad * .36, n = Math.max(14, Math.round(DET > .6 ? 46 + 30 * rad / .03 * .1 : 24));
  for (let k = 0; k < n; k++) {
   const z = 1 - 1.85 * (k + .5) / n, q = Math.sqrt(Math.max(0, 1 - z * z)), th = k * 2.39996 + rnd3() * .2;
   const nx = q * Math.cos(th), nz = q * Math.sin(th), x = cx + nx * rad * .92, y = cy0 + z * hl * .92, zz = cz + nz * rad * .92;
   _o.set(nx / rad, z / hl, nz / rad).normalize(); _qq.setFromUnitVectors(_z, _o);
   const j = .82 + .36 * rnd3(), r = rd * (.9 + .25 * rnd3()) * (z < -.6 ? .85 : 1);
   const cc = lc([col[0] * j, col[1] * j, col[2] * (ripe > .7 ? .9 + .5 * rnd3() : j)]), b = P.length / 3;
   for (let m = 0; m < DRUP.p.length; m += 3) { _t.set(DRUP.p[m], DRUP.p[m + 1], DRUP.p[m + 2]).applyQuaternion(_qq); P.push(x + _t.x * r, y + _t.y * r, zz + _t.z * r); N.push(_t.x, _t.y, _t.z); C.push(cc[0], cc[1], cc[2]); }
   for (const ii of DRUP.i) I.push(b + ii);
   // its style: a fine whisker standing out of the drupelet's top, dark on a ripe berry, pale on an unripe one
   if (hairs && DET > .6 && rnd3() < .8) {
    const hb = hairs.p.length / 3, L = r * r3(1, 1.8), w = r * .09, hc = lc(ripe > .7 ? [.24, .16, .12] : [.7, .62, .44]);
    _t.set(x, y, zz).addScaledVector(_o, r * .9); const e = V3().crossVectors(_o, Math.abs(_o.y) < .9 ? YAX : _z).normalize(), f = V3().crossVectors(_o, e);
    for (const [a, b2] of [[e, f], [f, e]]) {
     const hb2 = hairs.p.length / 3;
     hairs.p.push(_t.x - a.x * w, _t.y - a.y * w, _t.z - a.z * w, _t.x + a.x * w, _t.y + a.y * w, _t.z + a.z * w, _t.x + _o.x * L, _t.y + _o.y * L, _t.z + _o.z * L);
     for (let m = 0; m < 3; m++) { hairs.n.push(b2.x, b2.y, b2.z); hairs.c.push(hc[0], hc[1], hc[2]); }
     hairs.i.push(hb2, hb2 + 1, hb2 + 2, hb2, hb2 + 2, hb2 + 1);
    }
    void hb;
   }
  }
  const cc = lc([col[0] * .4, col[1] * .4, col[2] * .4]), b = P.length / 3; // the dark core fills the gaps
  for (let m = 0; m < CORE.p.length; m += 3) { P.push(cx + CORE.p[m] * rad * .86, cy0 + CORE.p[m + 1] * hl * .86, cz + CORE.p[m + 2] * rad * .86); N.push(CORE.p[m], CORE.p[m + 1], CORE.p[m + 2]); C.push(cc[0], cc[1], cc[2]); }
  for (const ii of CORE.i) I.push(b + ii);
  // the calyx: five small sepals folded back up the stalk
  if (hairs) {
   const gc = lc(ripe > .7 ? [.3, .3, .16] : [.34, .44, .18]);
   for (let k = 0; k < 5; k++) {
    const a = k / 5 * TAU + rnd3(), ox = Math.cos(a), oz = Math.sin(a), hb = hairs.p.length / 3, w = rad * .32, L = rad * .9;
    const bx = cx + ox * rad * .2, by = cy + rad * .05, bz = cz + oz * rad * .2;
    hairs.p.push(bx - oz * w, by, bz + ox * w, bx + oz * w, by, bz - ox * w, cx + ox * L, cy + L * .55, cz + oz * L);
    for (let m = 0; m < 3; m++) { hairs.n.push(0, 1, 0); hairs.c.push(gc[0], gc[1], gc[2]); }
    hairs.i.push(hb, hb + 1, hb + 2, hb, hb + 2, hb + 1);
   }
  }
 }
 // a hanging bunch: a stalk with short branches, berries biggest and ripest at the top and every stage of ripeness among
 // them (it fruits all winter); returns berry geometry and stalk, calyx and whisker geometry (vertex-coloured), both in
 // the cluster's own space (origin at the attachment)
 function bunch(n, size) {
  const out = { p: [], n: [], c: [], i: [] }, hairs = { p: [], n: [], c: [], i: [] }, stems = [], yaw = rnd() * TAU, L = size * .2;
  for (let i = 0; i < n; i++) {
   const f = n > 1 ? i / (n - 1) : 0, a = yaw + i * 2.4, r = size * (.035 + .035 * Math.sin(PI * Math.min(1, f * 1.3))) * (i ? 1 : 0);
   const y = -size * .03 - f * L, x = Math.cos(a) * r, z = Math.sin(a) * r, q = rnd(), ripe = q < .12 ? .1 : q < .24 ? .3 : q < .36 ? .5 : .8 + .2 * rnd();
   const len = size * (.05 - .012 * f) * (.9 + .2 * rnd()) * (ripe < .35 ? .8 : 1), rad = len * .6;
   berry(x, y - .006, z, len, rad, ripe, out, hairs);
   const s = tube([[0, -f * L * .8, 0], [x * .5, y + .01, z * .5], [x, y + .002, z]], 3, DET > .6 ? 4 : 3, (t) => size * .0045 * (1 - .4 * t));
   colorAll(s, [.24 * DARK, .26 * DARK, .12]); stems.push(s);
  }
  const main = tube([[0, .01, 0], [0, -L * .4, size * .004], [0, -L * .85, 0]], 5, DET > .6 ? 5 : 3, (t) => size * .006 * (1 - .5 * t)); colorAll(main, [.26 * DARK, .22 * DARK, .12]); stems.push(main);
  const g = geo(out.p, out.i, { normal: [out.n, 3], color: [out.c, 3] });
  if (hairs.p.length) stems.push(geo(hairs.p, hairs.i, { normal: [hairs.n, 3], color: [hairs.c, 3] }));
  return { berries: g, stems };
 }
