
 // ---------- geometry helpers ----------
 const dummy = new THREE.Object3D(), _nm = new THREE.Matrix3();
 // a geometry moved by a matrix, with its hair directions (aHT) turned too
 function xform(g, m) {
  g.applyMatrix4(m);
  const t = g.attributes.aHT;
  if (t) { for (let i = 0; i < t.count; i++) { _v.set(t.getX(i), t.getY(i), t.getZ(i)).transformDirection(m); t.setXYZ(i, _v.x, _v.y, _v.z); } t.needsUpdate = true; }
  return g;
 }
 const _v = new THREE.Vector3();
 // a copy of geo placed by position, rotation (or quaternion) and scale, as every part adds its pieces
 function place(geo, p, rot, sc, quat) {
  dummy.position.set(p ? p[0] : 0, p ? p[1] : 0, p ? p[2] : 0);
  if (quat) dummy.quaternion.copy(quat); else dummy.rotation.set(rot ? rot[0] : 0, rot ? rot[1] : 0, rot ? rot[2] : 0);
  if (sc === null || sc === undefined) dummy.scale.set(1, 1, 1);
  else if (typeof sc === 'number') dummy.scale.set(sc, sc, sc);
  else dummy.scale.set(sc[0], sc[1], sc[2]);
  dummy.updateMatrix();
  return xform(geo.clone(), dummy.matrix);
 }
 // merges geometries into one indexed geometry with every attribute any of them has; one that lacks an attribute gets
 // white for colour, straight up for a hair direction, nothing for the rest
 const DEF = { color: [1, 1, 1], aHT: [0, 1, 0] };
 function merge(list) {
  let nv = 0, ni = 0; const keys = new Map();
  for (const g of list) {
   nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count;
   for (const k of Object.keys(g.attributes)) if (!keys.has(k)) { const a = g.attributes[k]; keys.set(k, { size: a.itemSize, T: a.array.constructor }); }
  }
  const out = new THREE.BufferGeometry();
  for (const [k, { size, T }] of keys) {
   const A = new T(nv * size), d = DEF[k];
   let o = 0;
   for (const g of list) {
    const a = g.attributes[k], c = g.attributes.position.count;
    if (a) A.set(a.array.length === c * size ? a.array : a.array.subarray(0, c * size), o);
    else if (d) for (let i = 0; i < c; i++) for (let s = 0; s < size; s++) A[o + i * size + s] = d[s];
    o += c * size;
   }
   out.setAttribute(k, new THREE.BufferAttribute(A, size));
  }
  const I = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
  let vo = 0, io = 0;
  for (const g of list) {
   const c = g.attributes.position.count;
   if (g.index) { const a = g.index.array; for (let k = 0; k < a.length; k++) I[io + k] = a[k] + vo; io += a.length; }
   else { for (let k = 0; k < c; k++) I[io + k] = vo + k; io += c; }
   vo += c;
  }
  out.setIndex(new THREE.BufferAttribute(I, 1));
  out.computeBoundingSphere();
  return out;
 }
 function weights(geo, fn) {
  const pos = geo.attributes.position, n = pos.count, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
   let inf = fn(pos.getX(i), pos.getY(i), pos.getZ(i)).filter((e) => e[1] > 1e-4).sort((a, b) => b[1] - a[1]).slice(0, 4);
   if (!inf.length) inf = [[0, 1]];
   let tot = 0; for (const e of inf) tot += e[1];
   inf.forEach((e, k) => { si[i * 4 + k] = e[0]; sw[i * 4 + k] = e[1] / tot; });
  }
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
  geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
 }
 // ---------- pooling: one skinned mesh per material (built at bind) ----------
 // Skinned parts pool their geometry by material. A rigid part riding on a bone, directly or through a group that never
 // moves relative to it (STATIC), pools too: it is skinned to that bone with full weight, so it moves exactly as if it
 // were parented to it. Only see-through materials stay meshes of their own.
 const POOL = new Map(), STATIC = new Set();
 // three.js r128 compiles a material once, skinned or not, for every object that uses it: a part that is not skinned
 // (lids, lashes, the dagger's charm) gets its own copy of a material the skinned body also uses, as the game model does
 const plainCache = new Map();
 function plain(m) {
  if (!m.skinning) return m;
  let c = plainCache.get(m);
  if (!c) { c = m.clone(); c.skinning = false; c.onBeforeCompile = m.onBeforeCompile; c.customProgramCacheKey = m.customProgramCacheKey; c.name = m.name; plainCache.set(m, c); }
  return c;
 }
 function boneOf(p) { while (p && !p.isBone) { if (!STATIC.has(p)) return null; p = p.parent; } return p || null; }
 function poolAdd(mat, geo, rigid) { let list = POOL.get(mat); if (!list) POOL.set(mat, (list = [])); list.push({ geo, rigid }); }
 function part(wfn) {
  const buckets = new Map();
  return {
   add(geo, mat, p, rot, sc, quat) { const g = place(geo, p, rot, sc, quat); let list = buckets.get(mat); if (!list) buckets.set(mat, (list = [])); list.push(g); return this; },
   addWorld(geo, mat) { let list = buckets.get(mat); if (!list) buckets.set(mat, (list = [])); list.push(geo); return this; },
   build(parent, off) {
    const out = [], bone = wfn ? null : boneOf(parent);
    for (const [mat, list] of buckets) {
     const geo = merge(list);
     if (wfn) { weights(geo, wfn); poolAdd(mat, geo, null); continue; }
     if (bone && !mat.transparent) { poolAdd(mat, geo, { parent, off, bone }); continue; }
     const m = new THREE.Mesh(geo, plain(mat));
     if (off) m.position.set(-off[0], -off[1], -off[2]);
     if (mat.transparent) m.renderOrder = 2;
     parent.add(m); out.push(m);
    }
    return out;
   }
  };
 }
 const _q = new THREE.Quaternion(), _d = new THREE.Vector3(), YA = new THREE.Vector3(0, 1, 0), ZA = new THREE.Vector3(0, 0, 1);
 function seg(P, mat, a, b, r0, r1, rs, caps) {
  _d.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const L = _d.length(); _d.multiplyScalar(1 / L);
  _q.setFromUnitVectors(YA, _d);
  P.add(new THREE.CylinderGeometry(r1, r0, L, rs, 1, !!caps), mat, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], null, null, _q);
  if (caps) {
   P.add(new THREE.SphereGeometry(r0, rs, Math.max(6, rs >> 1)), mat, a);
   P.add(new THREE.SphereGeometry(r1, rs, Math.max(6, rs >> 1)), mat, b);
  }
 }
 // a profile made smooth: n points between each pair, passing through every one of them
 function smoothP(prof, n) {
  if (n <= 1) return prof;
  const cv = new THREE.SplineCurve(prof.map((p) => new THREE.Vector2(p[0], p[1])));
  return cv.getPoints((prof.length - 1) * n).map((p) => [p.x, p.y]);
 }
 function lathe(profile, segs, disp, zs, phiStart, phiLen, xs) {
  const full = phiLen === undefined, np = profile.length;
  const g = new THREE.LatheGeometry(profile.map((p) => new THREE.Vector2(p[0], p[1])), segs, full ? Math.PI : phiStart, full ? TAU : phiLen);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
   let x = pos.getX(i), z = pos.getZ(i);
   const y = pos.getY(i), r = Math.hypot(x, z);
   if (disp && r > 1e-6) { const k = disp(r, y, Math.atan2(x, z)) / r; x *= k; z *= k; }
   pos.setXYZ(i, x * (xs || 1), y, z * (zs || 1));
  }
  g.computeVertexNormals();
  if (full) {
   const n = g.attributes.normal;
   for (let j = 0; j < np; j++) {
    const a = j, b = segs * np + j;
    const x = n.getX(a) + n.getX(b), y = n.getY(a) + n.getY(b), z = n.getZ(a) + n.getZ(b), l = Math.hypot(x, y, z) || 1;
    n.setXYZ(a, x / l, y / l, z / l); n.setXYZ(b, x / l, y / l, z / l);
   }
  }
  return g;
 }
 function sheet(nu, nv, fn, uvRot) {
  const P = new Float32Array((nu + 1) * (nv + 1) * 3), Uv = new Float32Array((nu + 1) * (nv + 1) * 2), idx = [], o = [0, 0, 0];
  let k = 0;
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
   const u = i / nu, v = j / nv; fn(u, v, o);
   P[k * 3] = o[0]; P[k * 3 + 1] = o[1]; P[k * 3 + 2] = o[2];
   if (uvRot) { Uv[k * 2] = v; Uv[k * 2 + 1] = u; } else { Uv[k * 2] = u; Uv[k * 2 + 1] = 1 - v; }
   k++;
  }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
   const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
   idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(Uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
 }
 // uv scaled, as the game model's texture repeats were
 const uvs = (g, sx, sy) => { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * sx, uv.getY(i) * sy); return g; };
 // a colour per vertex from its position (light tints and shade in the creases, linear)
 function vcol(g, fn) {
  const p = g.attributes.position, n = p.count, a = new Float32Array(n * 3), o = [1, 1, 1];
  for (let i = 0; i < n; i++) { o[0] = o[1] = o[2] = 1; fn(p.getX(i), p.getY(i), p.getZ(i), o, i); a[i * 3] = o[0]; a[i * 3 + 1] = o[1]; a[i * 3 + 2] = o[2]; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g;
 }
 // a tube along a curve whose cross-section can be flattened against a surface (locks, the hat's crown, horns, fingers).
 // It carries its direction along the curve (aHT), for hair.
 const _c = new THREE.Vector3(), _t = new THREE.Vector3(), _o = new THREE.Vector3(), _w = new THREE.Vector3(), _vv = new THREE.Vector3();
 function strand(pts, TSg, RS, rFn, flat, centerFn) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
  const g = new THREE.TubeGeometry(curve, TSg, 1, RS, false);
  const pos = g.attributes.position, ht = new Float32Array(pos.count * 3);
  for (let i = 0; i <= TSg; i++) {
   const t = i / TSg; curve.getPointAt(t, _c); curve.getTangentAt(t, _t);
   const cen = centerFn ? centerFn(_c) : null;
   if (cen) { _o.subVectors(_c, cen); _o.addScaledVector(_t, -_o.dot(_t)); }
   if (!cen || _o.lengthSq() < 1e-10) _o.copy(g.normals[i]);
   _o.normalize(); _w.crossVectors(_t, _o).normalize();
   const r = rFn(t);
   for (let j = 0; j <= RS; j++) {
    const idx = i * (RS + 1) + j;
    _vv.fromBufferAttribute(pos, idx).sub(_c);
    const a = _vv.dot(_o), b = _vv.dot(_w);
    _vv.copy(_c).addScaledVector(_o, a * r * flat).addScaledVector(_w, b * r);
    pos.setXYZ(idx, _vv.x, _vv.y, _vv.z);
    ht[idx * 3] = _t.x; ht[idx * 3 + 1] = _t.y; ht[idx * 3 + 2] = _t.z;
   }
  }
  g.setAttribute('aHT', new THREE.BufferAttribute(ht, 3));
  g.computeVertexNormals();
  return g;
 }
 // Fine strands through a lock: K thin tubes of RS sides along the lock's centre line, each placed somewhere in the lock's
 // section (most of them near its surface, where they show), wandering a little, tapering, some ending early, each a
 // slightly different shade and darker toward the root and the lock's inside. Returns one geometry with position, normal,
 // uv (x along the strand, y the strand's number), color and aHT (the direction along it).
 let strandId = 0;
 const _fr = { P: [], T: [], O: [], W: [] };
 function lockStrands(pts, K, N, RS, rFn, flat, cenFn, col, o) {
  o = o || {};
  const lean = o.lean === undefined ? .7 : o.lean, thick = o.thick || .00058, jit = o.jitter === undefined ? .35 : o.jitter, inner = o.inner === undefined ? .3 : o.inner;
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
  const fr = curve.computeFrenetFrames(N, false), F = _fr;
  for (let i = 0; i <= N; i++) {
   const t = i / N, P = F.P[i] || (F.P[i] = V3()), T = F.T[i] || (F.T[i] = V3()), O = F.O[i] || (F.O[i] = V3()), W = F.W[i] || (F.W[i] = V3());
   curve.getPointAt(t, P); curve.getTangentAt(t, T);
   const cen = cenFn ? cenFn(P) : null;
   if (cen) { O.subVectors(P, cen); O.addScaledVector(T, -O.dot(T)); }
   if (!cen || O.lengthSq() < 1e-10) O.copy(fr.normals[i]);
   O.normalize(); W.crossVectors(T, O).normalize();
  }
  const nv = K * (N + 1) * RS, pos = new Float32Array(nv * 3), nrm = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), cc = new Float32Array(nv * 3), ht = new Float32Array(nv * 3);
  const idx = new Uint32Array(K * N * RS * 6);
  let v = 0, ii = 0;
  for (let k = 0; k < K; k++) {
   const ang = r2() * TAU, rad = Math.min(1.08, (1 - inner) + inner * Math.sqrt(r2()) + .08 * r2()), a = Math.cos(ang) * rad, b = Math.sin(ang) * rad;
   const ph1 = r2() * TAU, ph2 = r2() * TAU, f1 = 3 + r2() * 6, f2 = 4 + r2() * 7, tip = 1 - Math.pow(r2(), 2) * (o.short || .22), sh = .82 + r2() * .34, rot = r2() * TAU;
   const id = (strandId++ % 4096) / 4096 + .5 / 4096, th = thick * (.7 + r2() * .6);
   const v0 = v;
   for (let i = 0; i <= N; i++) {
    const t = i / N, P = F.P[i], T = F.T[i], O = F.O[i], W = F.W[i], R = rFn(t);
    const wo = jit * R * Math.sin(f1 * t * PI + ph1) * t, ww = jit * R * Math.sin(f2 * t * PI + ph2) * t;
    const cx = P.x + O.x * (a * R * flat + wo) + W.x * (b * R + ww), cy = P.y + O.y * (a * R * flat + wo) + W.y * (b * R + ww), cz = P.z + O.z * (a * R * flat + wo) + W.z * (b * R + ww);
    const rs = th * (1 - .55 * t) * (1 - sm(tip - .1, tip, t)) + 1e-5;
    const shade = sh * (.5 + .5 * sm(0, .14, t)) * (.6 + .4 * rad) * (1 + .1 * t);
    for (let j = 0; j < RS; j++) {
     const q = j / RS * TAU + rot, cq = Math.cos(q), sq = Math.sin(q);
     const nx = O.x * cq + W.x * sq, ny = O.y * cq + W.y * sq, nz = O.z * cq + W.z * sq;
     pos[v * 3] = cx + nx * rs; pos[v * 3 + 1] = cy + ny * rs; pos[v * 3 + 2] = cz + nz * rs;
     const mx = nx * lean + O.x, my = ny * lean + O.y, mz = nz * lean + O.z, ml = Math.hypot(mx, my, mz) || 1;
     nrm[v * 3] = mx / ml; nrm[v * 3 + 1] = my / ml; nrm[v * 3 + 2] = mz / ml;
     uv[v * 2] = t; uv[v * 2 + 1] = id;
     cc[v * 3] = col.r * shade; cc[v * 3 + 1] = col.g * shade; cc[v * 3 + 2] = col.b * shade;
     ht[v * 3] = T.x; ht[v * 3 + 1] = T.y; ht[v * 3 + 2] = T.z;
     v++;
    }
   }
   for (let i = 0; i < N; i++) for (let j = 0; j < RS; j++) {
    const A = v0 + i * RS + j, B = v0 + i * RS + (j + 1) % RS, Cc = A + RS, D = B + RS;
    idx[ii++] = A; idx[ii++] = B; idx[ii++] = Cc; idx[ii++] = B; idx[ii++] = D; idx[ii++] = Cc;
   }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.BufferAttribute(cc, 3)); g.setAttribute('aHT', new THREE.BufferAttribute(ht, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  return g;
 }
 // a cross outline extruded with a bevel (the gold crosses on her necklace, hat chain and charm): a bar w by h, a crossbar
 // cw by ch whose middle is cy above the bar's, d deep
 function crossGeo(w, h, cw, ch, cy, d, bev) {
  const s = new THREE.Shape(), x = w / 2, y = h / 2, X = cw / 2, Y0 = cy - ch / 2, Y1 = cy + ch / 2;
  s.moveTo(-x, -y); s.lineTo(x, -y); s.lineTo(x, Y0); s.lineTo(X, Y0); s.lineTo(X, Y1); s.lineTo(x, Y1); s.lineTo(x, y); s.lineTo(-x, y);
  s.lineTo(-x, Y1); s.lineTo(-X, Y1); s.lineTo(-X, Y0); s.lineTo(-x, Y0); s.lineTo(-x, -y);
  const g = new THREE.ExtrudeGeometry(s, { depth: d - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev * .8, bevelSegments: 2, curveSegments: 1 });
  g.translate(0, 0, -(d - 2 * bev) / 2); g.computeVertexNormals();
  return g;
 }
 const _e = new THREE.Euler();
 const offE = (c, rot, v) => { _v.set(v[0], v[1], v[2]).applyEuler(_e.set(rot[0], rot[1], rot[2])); return [c[0] + _v.x, c[1] + _v.y, c[2] + _v.z]; };
 const qz = (q, a) => q.clone().multiply(new THREE.Quaternion().setFromAxisAngle(ZA, a));
 const interp = (tab, y) => {
  if (y <= tab[0][1]) return tab[0][0];
  for (let i = 0; i < tab.length - 1; i++) { const a = tab[i], b = tab[i + 1]; if (y <= b[1]) return a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]); }
  return tab[tab.length - 1][0];
 };
 const _bx = new THREE.Vector3(), _by = new THREE.Vector3(), _bz = new THREE.Vector3(), _bm = new THREE.Matrix4();
