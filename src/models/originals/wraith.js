// Imported unchanged from reference/demos/night-square-shadow-wraith.html. three.js r128 (global THREE).
function makeWraithOriginal() {
  let hs = 31337;
  const hr = () => (hs = (hs * 16807) % 2147483647) / 2147483647;
  const cl = (v, a, b) => (v < a ? a : v > b ? b : v);
  const sm = (e0, e1, x) => { const u = cl((x - e0) / (e1 - e0), 0, 1); return u * u * (3 - 2 * u); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const TAU = Math.PI * 2;
  const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const ctex = (c, rx, ry) => { const t = new THREE.CanvasTexture(c); if (rx) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); } t.anisotropy = 4; return t; };
  const interp = (tab, y) => {
    if (y <= tab[0][1]) return tab[0][0];
    for (let i = 0; i < tab.length - 1; i++) { const a = tab[i], b = tab[i + 1]; if (y <= b[1]) return a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]); }
    return tab[tab.length - 1][0];
  };

  // ---------- textures ----------
  function clothCanvas() {
    const S = 256, c = cvs(S, S), g = c.getContext('2d');
    g.fillStyle = '#1b1522'; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 900; i++) { g.fillStyle = hr() < 0.6 ? 'rgba(0,0,0,0.25)' : 'rgba(120,110,140,0.07)'; g.fillRect(hr() * S, hr() * S, 1, 4 + hr() * 30); }
    for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(hr() * S, hr() * S, 3 + hr() * 12, 6 + hr() * 20, 0, 0, 7); g.fill(); }
    return c;
  }
  function glowCanvas() {
    const W = 64, H = 256, c = cvs(W, H), g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, '#000'); gr.addColorStop(0.55, '#000'); gr.addColorStop(0.8, '#1d4a2c'); gr.addColorStop(1, '#8dffb8');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'multiply';
    for (let x = 0; x < W; x++) { const k = 0.45 + 0.55 * Math.pow(hr(), 0.7); g.fillStyle = `rgb(${(k * 255) | 0},${(k * 255) | 0},${(k * 255) | 0})`; g.fillRect(x, 0, 1, H); }
    return c;
  }
  function woodCanvas() {
    const W = 256, H = 32, c = cvs(W, H), g = c.getContext('2d');
    g.fillStyle = '#3a2d27'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) { g.fillStyle = hr() < 0.5 ? 'rgba(0,0,0,0.3)' : 'rgba(150,120,100,0.12)'; g.fillRect(0, hr() * H, W, 0.6 + hr() * 1.6); }
    return c;
  }
  function glowSprite(inner, mid) {
    const c = cvs(64, 64), g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, inner); gr.addColorStop(0.4, mid); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c;
  }
  const std = (c, r, extra) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: r, metalness: 0 }, extra || {}));
  const clothC = clothCanvas(), glowC = glowCanvas();
  const M = {
    robe: std(0xffffff, 0.92, { map: ctex(clothC, 6, 3), emissiveMap: ctex(glowC), emissive: 0x3cff8c, side: THREE.DoubleSide }),
    mantle: std(0xe8e2f0, 0.92, { map: ctex(clothC, 4, 1.5), side: THREE.DoubleSide }),
    sleeve: std(0xffffff, 0.92, { map: ctex(clothC, 2, 2), emissiveMap: ctex(glowC), emissive: 0x2acc70, side: THREE.DoubleSide }),
    hood: std(0xffffff, 0.92, { map: ctex(clothC, 2, 2), side: THREE.DoubleSide }),
    bone: std(0xd6cfbb, 0.55, { emissive: 0x0f2418 }),
    claw: std(0x2a2826, 0.4, { emissive: 0x06120a }),
    wood: std(0xffffff, 0.75, { map: ctex(woodCanvas(), 1, 1) }),
    wrap: std(0x3a2a22, 0.85),
    steel: std(0x48505b, 0.28, { metalness: 0.5, emissive: 0x0b2416 }),
    edge: new THREE.MeshBasicMaterial({ color: 0x86ffba }),
    voidM: new THREE.MeshBasicMaterial({ color: 0x000000 }),
    eye: new THREE.MeshBasicMaterial({ color: 0xd8ffe4 }),
    chain: std(0x57524b, 0.45, { metalness: 0.45 })
  };

  // ---------- geometry helpers ----------
  const dummy = new THREE.Object3D();
  function merge(list) {
    let nv = 0, ni = 0;
    for (const g of list) { nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
    const P = new Float32Array(nv * 3), N = new Float32Array(nv * 3), U = new Float32Array(nv * 2), I = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
    let vo = 0, io = 0;
    for (const g of list) {
      const c = g.attributes.position.count;
      P.set(g.attributes.position.array, vo * 3); N.set(g.attributes.normal.array, vo * 3);
      if (g.attributes.uv) U.set(g.attributes.uv.array, vo * 2);
      if (g.index) { const a = g.index.array; for (let k = 0; k < a.length; k++) I[io + k] = a[k] + vo; io += a.length; }
      else { for (let k = 0; k < c; k++) I[io + k] = vo + k; io += c; }
      vo += c;
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(P, 3)); out.setAttribute('normal', new THREE.BufferAttribute(N, 3)); out.setAttribute('uv', new THREE.BufferAttribute(U, 2));
    out.setIndex(new THREE.BufferAttribute(I, 1)); out.computeBoundingSphere();
    return out;
  }
  const skinned = [], skinCache = new Map();
  const skinMat = (m) => { let s = skinCache.get(m); if (!s) { s = m.clone(); s.skinning = true; skinCache.set(m, s); } return s; };
  function weights(geo, fn) {
    const pos = geo.attributes.position, n = pos.count, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      let inf = fn(pos.getX(i), pos.getY(i), pos.getZ(i)).filter((e) => e[1] > 1e-4).sort((a, b) => b[1] - a[1]).slice(0, 4);
      if (!inf.length) inf = [[0, 1]];
      let tot = 0; for (const e of inf) tot += e[1];
      inf.forEach((e, k) => { si[i * 4 + k] = e[0]; sw[i * 4 + k] = e[1] / tot; });
    }
    geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
  }
  function part(wfn) {
    const buckets = new Map();
    return {
      add(geo, mat, p, rot, sc, quat) {
        dummy.position.set(p ? p[0] : 0, p ? p[1] : 0, p ? p[2] : 0);
        if (quat) dummy.quaternion.copy(quat); else dummy.rotation.set(rot ? rot[0] : 0, rot ? rot[1] : 0, rot ? rot[2] : 0);
        if (sc === null || sc === undefined) dummy.scale.set(1, 1, 1); else if (typeof sc === 'number') dummy.scale.set(sc, sc, sc); else dummy.scale.set(sc[0], sc[1], sc[2]);
        dummy.updateMatrix();
        const g = geo.clone(); g.applyMatrix4(dummy.matrix);
        let list = buckets.get(mat); if (!list) buckets.set(mat, (list = [])); list.push(g); return this;
      },
      addWorld(geo, mat) { let list = buckets.get(mat); if (!list) buckets.set(mat, (list = [])); list.push(geo); return this; },
      build(parent, off) {
        for (const [mat, list] of buckets) {
          const geo = merge(list); let m;
          if (wfn) { weights(geo, wfn); m = new THREE.SkinnedMesh(geo, skinMat(mat)); m.frustumCulled = false; skinned.push(m); }
          else m = new THREE.Mesh(geo, mat);
          if (off) m.position.set(-off[0], -off[1], -off[2]);
          parent.add(m);
        }
      }
    };
  }
  function sheet(nu, nv, fn) {
    const P = new Float32Array((nu + 1) * (nv + 1) * 3), U = new Float32Array((nu + 1) * (nv + 1) * 2), idx = [], o = [0, 0, 0];
    let k = 0;
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { fn(i / nu, j / nv, o); P.set(o, k * 3); U[k * 2] = i / nu; U[k * 2 + 1] = 1 - j / nv; k++; }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.BufferAttribute(U, 2)); g.setIndex(idx); g.computeVertexNormals();
    return g;
  }
  function seamFix(g, nu, nv) {
    const n = g.attributes.normal;
    for (let j = 0; j <= nv; j++) {
      const a = j * (nu + 1), b = a + nu;
      const x = n.getX(a) + n.getX(b), y = n.getY(a) + n.getY(b), z = n.getZ(a) + n.getZ(b), l = Math.hypot(x, y, z) || 1;
      n.setXYZ(a, x / l, y / l, z / l); n.setXYZ(b, x / l, y / l, z / l);
    }
  }
  const _c = new THREE.Vector3(), _t = new THREE.Vector3(), _o = new THREE.Vector3(), _w = new THREE.Vector3(), _vv = new THREE.Vector3(), _q = new THREE.Quaternion(), _d = new THREE.Vector3(), YA = new THREE.Vector3(0, 1, 0);
  function strand(pts, TS, RS, rFn, flat) {
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
    const g = new THREE.TubeGeometry(curve, TS, 1, RS, false), pos = g.attributes.position;
    for (let i = 0; i <= TS; i++) {
      const t = i / TS; curve.getPointAt(t, _c); curve.getTangentAt(t, _t);
      _o.copy(g.normals[i]).normalize(); _w.crossVectors(_t, _o).normalize();
      const r = rFn(t);
      for (let j = 0; j <= RS; j++) {
        const idx = i * (RS + 1) + j; _vv.fromBufferAttribute(pos, idx).sub(_c);
        const a = _vv.dot(_o), b = _vv.dot(_w);
        _vv.copy(_c).addScaledVector(_o, a * r * (flat || 1)).addScaledVector(_w, b * r); pos.setXYZ(idx, _vv.x, _vv.y, _vv.z);
      }
    }
    g.computeVertexNormals(); return g;
  }
  function seg(P, mat, a, b, r0, r1, rs, caps) {
    _d.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const L = _d.length(); _d.multiplyScalar(1 / L); _q.setFromUnitVectors(YA, _d);
    P.add(new THREE.CylinderGeometry(r1, r0, L, rs, 1, !!caps), mat, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], null, null, _q);
    if (caps) { P.add(new THREE.SphereGeometry(r0, rs, Math.max(6, rs >> 1)), mat, a); P.add(new THREE.SphereGeometry(r1, rs, Math.max(6, rs >> 1)), mat, b); }
  }

  // ---------- skeleton (32 bones) ----------
  const root = new THREE.Group(), bones = [], BI = {};
  function bone(name, parent, x, y, z) { const b = new THREE.Bone(); b.name = name; b.position.set(x, y, z); parent.add(b); BI[name] = bones.length; bones.push(b); return b; }
  const pelvis = bone('pelvis', root, 0, 1.1, 0), spine = bone('spine', pelvis, 0, 0.22, 0), chest = bone('chest', spine, 0, 0.24, 0);
  const neck = bone('neck', chest, 0, 0.18, 0); neck.rotation.order = 'YXZ';
  const headB = bone('head', neck, 0, 0.14, 0); headB.rotation.order = 'YXZ';
  const hoodT = bone('hoodT', headB, 0, 0.12, -0.17);
  const arms = [], elbows = [], wrists = [];
  for (const sd of [-1, 1]) {
    const s = bone('sh' + sd, chest, 0.25 * sd, 0.12, 0), e = bone('el' + sd, s, 0, -0.34, 0), w = bone('wr' + sd, e, 0, -0.3, 0);
    arms.push(s); elbows.push(e); wrists.push(w);
  }
  const RK = 10, ringU = [], ringL = [];
  for (let k = 0; k < RK; k++) {
    const a = (k + 0.5) / RK * TAU, u = bone('rU' + k, pelvis, 0.27 * Math.sin(a), 0.05, 0.27 * Math.cos(a) * 0.86);
    u.rotation.order = 'YXZ'; u.rotation.y = a;
    const l = bone('rL' + k, u, 0, -0.5, 0.06); l.rotation.order = 'YXZ';
    ringU.push(u); ringL.push(l);
  }
  root.updateMatrixWorld(true);
  const bw = (b) => { const v = new THREE.Vector3(); b.getWorldPosition(v); return [v.x, v.y, v.z]; };
  const ringF = (x, z, n, off) => ((((Math.atan2(x, z / 0.86) / TAU) * n - (off || 0)) % n) + n) % n;
  function wRobe(x, y, z) {
    if (y >= 1.45) { const t = sm(1.45, 1.58, y); return [[BI.spine, 1 - t], [BI.chest, t]]; }
    if (y >= 1.2) { const t = sm(1.2, 1.4, y); return [[BI.pelvis, 1 - t], [BI.spine, t]]; }
    const s1 = sm(1.18, 0.9, y), s2 = sm(0.78, 0.4, y), f = ringF(x, z, RK, 0.5), k0 = Math.floor(f) % RK, k1 = (k0 + 1) % RK, fr = f - Math.floor(f);
    return [[BI.pelvis, 1 - s1], [BI['rU' + k0], s1 * (1 - s2) * (1 - fr)], [BI['rU' + k1], s1 * (1 - s2) * fr], [BI['rL' + k0], s1 * s2 * (1 - fr)], [BI['rL' + k1], s1 * s2 * fr]];
  }
  function wMantle(x, y) {
    const side = sm(0.17, 0.3, Math.abs(x)) * sm(1.66, 1.45, y) * 0.55;
    const base = y >= 1.45 ? [[BI.chest, 1]] : [[BI.spine, 1 - sm(1.3, 1.45, y)], [BI.chest, sm(1.3, 1.45, y)]];
    if (side <= 0) return base;
    return base.map((e) => [e[0], e[1] * (1 - side)]).concat([[BI['sh' + (x < 0 ? -1 : 1)], side]]);
  }
  function wArm(x, y) {
    const sd = x < 0 ? -1 : 1, S = BI['sh' + sd], E = BI['el' + sd];
    if (y > 1.6) { const c = sm(1.6, 1.74, y) * 0.5; return [[S, 1 - c], [BI.chest, c]]; }
    if (y > 1.4) return [[S, 1]];
    if (y > 1.28) { const t = sm(1.4, 1.28, y); return [[S, 1 - t], [E, t]]; }
    return [[E, 1]];
  }
  function wHood(x, y, z) {
    const hy = hb[1];
    const back = sm(-0.05, -0.2, z) * sm(hy + 0.02, hy + 0.14, y);
    return [[BI.head, 1 - back], [BI.hoodT, back]];
  }

  // ---------- robe: ragged hem, folds, an opening at the chest ----------
  const RP = [[0.56, 0.0], [0.53, 0.2], [0.48, 0.4], [0.4, 0.65], [0.32, 0.9], [0.27, 1.1], [0.27, 1.3], [0.29, 1.5], [0.31, 1.63], [0.22, 1.72], [0.13, 1.77]];
  const openA = (v) => (v < 0.3 ? 0.36 * (1 - v / 0.3) : 0);
  const spike = (a, n, ph, p) => Math.pow(0.5 + 0.5 * Math.sin(n * a + ph), p);
  const hemR = (a) => Math.max(0.03, 0.48 - 0.22 * spike(a, 7, 0.3, 5) - 0.2 * spike(a, 13, 1.7, 7) - 0.14 * spike(a, 23, 4.1, 9) - 0.05 * Math.max(0, -Math.cos(a)));
  function robePt(u, v, o) {
    const oa = openA(v), a = oa + u * (TAU - 2 * oa);
    const y = v < 0.08 ? lerp(1.77, 1.63, v / 0.08) : lerp(1.63, hemR(a), (v - 0.08) / 0.92);
    const lo = sm(1.2, 0.2, y);
    const r = interp(RP, y) + (0.012 + 0.03 * lo) * Math.sin(11 * a + 0.5 + y * 2) + 0.012 * lo * Math.sin(19 * a + 1.1);
    const top = sm(1.4, 1.63, y), xs = 1 + 0.18 * top, zs = 0.86 - 0.08 * top;
    o[0] = r * Math.sin(a) * xs; o[1] = y; o[2] = r * Math.cos(a) * zs;
  }
  const RNU = 230, RNV = 56, robeG = sheet(RNU, RNV, robePt);
  const Rb = part(wRobe); Rb.addWorld(robeG, M.robe); Rb.build(root);

  const mantleHem = (a) => 1.32 - 0.16 * spike(a, 9, 2.0, 4) - 0.12 * spike(a, 17, 0.6, 8) - 0.05 * Math.max(0, -Math.cos(a));
  const Mn = part(wMantle);
  Mn.addWorld(sheet(150, 22, (u, v, o) => {
    const oa = 0.36 * (1 - v * 0.6), a = oa + u * (TAU - 2 * oa);
    const y = lerp(1.79, mantleHem(a), v);
    const r = interp(RP, Math.min(y, 1.77)) + 0.035 + 0.07 * sm(1.62, 1.15, y) + 0.012 * Math.sin(13 * a + y * 3);
    const top = sm(1.4, 1.63, y), xs = 1 + 0.2 * top, zs = 0.86 - 0.08 * top;
    o[0] = r * Math.sin(a) * xs; o[1] = y; o[2] = r * Math.cos(a) * zs;
  }), M.mantle);
  Mn.build(root);

  const Sl = part(wArm);
  for (const sd of [-1, 1]) {
    Sl.addWorld(sheet(44, 22, (u, v, o) => {
      const a = u * TAU, yEnd = 0.99 - 0.14 * spike(a, 5, sd, 4) - 0.1 * spike(a, 11, sd * 2, 7) - 0.08 * Math.max(0, -Math.cos(a));
      const y = lerp(1.74, yEnd, v);
      let r = lerp(0.075, 0.09, sm(0, 0.3, v)) + 0.08 * sm(0.35, 1, v) ** 1.5 + 0.012 * sm(0.5, 1, v) * Math.sin(7 * a + sd);
      r *= lerp(0.45, 1, sm(0, 0.1, v));
      o[0] = 0.25 * sd + r * Math.sin(a); o[1] = y; o[2] = r * Math.cos(a);
    }), M.sleeve);
  }
  Sl.build(root);

  // ---------- hood: deep cowl with a pointed back, a thick rim, a void inside ----------
  const hb = bw(headB);
  const hoodG = new THREE.SphereGeometry(1, 40, 26, Math.PI / 2 + 0.9, TAU - 1.8, 0.78, Math.PI - 0.78);
  hoodG.rotateX(Math.PI / 2);
  const hpz = hoodG.attributes.position;
  function hoodDeform(x, y, z) {
    x *= 0.2; y *= 0.235; z *= 0.22;
    const back = Math.max(0, -z) / 0.22, up = Math.max(0, y) / 0.235;
    z -= 0.11 * Math.pow(back, 1.5) * Math.pow(up, 1.2); y += 0.06 * back * back * up;
    if (y < -0.08) { const k = 1 + 0.9 * ((-0.08 - y) / 0.16); x *= k; z *= lerp(1, k, 0.7); }
    return [x + hb[0], y + hb[1], z + hb[2]];
  }
  for (let i = 0; i < hpz.count; i++) { const p = hoodDeform(hpz.getX(i), hpz.getY(i), hpz.getZ(i)); hpz.setXYZ(i, p[0], p[1], p[2]); }
  hoodG.computeVertexNormals();
  const rim = [];
  for (let k = 0; k <= 40; k++) {
    const phi = Math.PI / 2 + 0.9 + k / 40 * (TAU - 1.8), th = 0.78;
    const ox = -Math.cos(phi) * Math.sin(th), oy = Math.cos(th), oz = Math.sin(phi) * Math.sin(th);
    rim.push(hoodDeform(ox, -oz, oy));
  }
  const Hd = part(wHood);
  Hd.addWorld(hoodG, M.hood);
  Hd.addWorld(strand(rim, 60, 8, () => 0.022, 0.8), M.hood);
  Hd.build(root);

  // ---------- inside the hood: darkness and two eyes ----------
  const head = new THREE.Group(); headB.add(head);
  const Fv = part();
  Fv.add(new THREE.SphereGeometry(1, 20, 16), M.voidM, [0, -0.015, 0.015], null, [0.145, 0.175, 0.14]);
  for (const sd of [-1, 1]) Fv.add(new THREE.SphereGeometry(1, 12, 8), M.eye, [0.05 * sd, 0.012, 0.142], [0, 0, -sd * 0.25], [0.018, 0.009, 0.006]);
  Fv.build(head);
  const eyeTex = ctex(glowSprite('rgba(220,255,230,1)', 'rgba(60,255,140,0.45)'));
  const eyeGlow = [-1, 1].map((sd) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: eyeTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    s.position.set(0.05 * sd, 0.012, 0.16); s.scale.set(0.13, 0.09, 1); s.renderOrder = 5; head.add(s); return s;
  });

  // ---------- skeletal hands and forearms ----------
  function boneHand(P, sd, fist) {
    P.add(new THREE.SphereGeometry(1, 14, 10), M.bone, [0, -0.03, 0.002], null, [0.013, 0.04, 0.034]);
    const zs = [0.022, 0.007, -0.008, -0.022], L1 = [0.038, 0.042, 0.04, 0.034], L2 = [0.034, 0.038, 0.036, 0.03];
    for (let f = 0; f < 4; f++) {
      const a1 = fist ? 1.35 + f * 0.05 : 0.35 + f * 0.1, a2 = a1 + (fist ? 1.4 : 0.55);
      const b = [-sd * 0.002, -0.07, zs[f]];
      const m = [b[0] - sd * L1[f] * Math.sin(a1), b[1] - L1[f] * Math.cos(a1), b[2]];
      const d2 = [-sd * Math.sin(a2), -Math.cos(a2), 0], tip = [m[0] + d2[0] * L2[f], m[1] + d2[1] * L2[f], m[2]];
      seg(P, M.bone, b, m, 0.0068, 0.0058, 7, true);
      seg(P, M.bone, m, tip, 0.0058, 0.0048, 7, true);
      _d.set(d2[0], d2[1], d2[2]); _q.setFromUnitVectors(YA, _d);
      P.add(new THREE.ConeGeometry(0.0048, 0.024, 6), M.claw, [tip[0] + d2[0] * 0.011, tip[1] + d2[1] * 0.011, tip[2]], null, null, _q);
      seg(P, M.bone, [0, -0.012, zs[f] * 0.6], b, 0.0045, 0.0055, 6, false);
    }
    const t0 = [-sd * 0.008, -0.02, 0.03], t1 = fist ? [-sd * 0.024, -0.045, 0.034] : [-sd * 0.02, -0.048, 0.05], t2 = fist ? [-sd * 0.026, -0.06, 0.012] : [-sd * 0.03, -0.07, 0.06];
    seg(P, M.bone, t0, t1, 0.0075, 0.0065, 7, true); seg(P, M.bone, t1, t2, 0.0065, 0.0055, 7, true);
  }
  for (let i = 0; i < 2; i++) {
    const sd = i === 0 ? -1 : 1, H = part(); boneHand(H, sd, i === 0); H.build(wrists[i]);
    const F = part();
    seg(F, M.bone, [0.008, -0.05, 0.008], [0.008, -0.3, 0.01], 0.011, 0.009, 8, true);
    seg(F, M.bone, [-0.01, -0.05, -0.008], [-0.009, -0.3, -0.006], 0.01, 0.008, 8, true);
    F.build(elbows[i]);
  }

  // ---------- the scythe (right hand): gnarled shaft, crescent blade with a glowing soul-edge, skull, chain ----------
  const scythe = new THREE.Group(); scythe.position.set(0.02, -0.06, 0); wrists[0].add(scythe);
  const Sc = part();
  Sc.add(strand([[0, 0, -0.95], [0.012, 0.016, -0.5], [-0.01, 0, 0], [0.014, -0.012, 0.5], [0, 0.02, 1.05]], 60, 9, (t) => 0.021 * (1 + 0.16 * Math.pow(Math.abs(Math.sin(t * 23)), 8)) * (t > 0.97 ? 0.8 : 1)), M.wood);
  for (const z of [-0.1, -0.04, 0.02, 0.08, 0.14]) Sc.add(new THREE.TorusGeometry(0.024, 0.0055, 5, 16), M.wrap, [0, 0, z]);
  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(0, 0.07); bladeShape.bezierCurveTo(0.3, 0.17, 0.7, 0.09, 0.86, -0.3); bladeShape.bezierCurveTo(0.66, -0.1, 0.32, -0.08, 0.02, -0.05); bladeShape.lineTo(0, 0.07);
  const bladeG = new THREE.ExtrudeGeometry(bladeShape, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.007, bevelSegments: 2, curveSegments: 28 });
  const bladeM = new THREE.Matrix4().set(0, 0, -1, 0.006, -1, 0, 0, 0, 0, 1, 0, 1.0, 0, 0, 0, 1);
  bladeG.applyMatrix4(bladeM); bladeG.computeVertexNormals();
  Sc.addWorld(bladeG, M.steel);
  const edgePts = [];
  const bz = (p0, p1, p2, p3, t) => { const u = 1 - t; return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3; };
  for (let k = 0; k <= 16; k++) { const t = k / 16, X = bz(0.86, 0.66, 0.32, 0.02, t), Y = bz(-0.3, -0.1, -0.08, -0.05, t); edgePts.push([0, -X, Y + 1.0]); }
  Sc.add(strand(edgePts, 40, 6, (t) => 0.0045 * (0.4 + 0.6 * Math.sin(Math.PI * Math.min(1, t * 1.15)))), M.edge);
  Sc.add(new THREE.SphereGeometry(1, 16, 12), M.bone, [0, -0.03, 0.99], null, [0.042, 0.046, 0.048]);
  Sc.add(new THREE.BoxGeometry(0.05, 0.025, 0.028), M.bone, [0, -0.052, 0.955]);
  for (const x of [-0.016, 0.016]) Sc.add(new THREE.SphereGeometry(0.011, 8, 6), M.voidM, [x, -0.07, 0.995]);
  for (let k = 0; k < 5; k++) Sc.add(new THREE.TorusGeometry(0.009, 0.0022, 4, 10), M.chain, [0.02, -0.04, 0.95 - k * 0.016], [0, k % 2 ? Math.PI / 2 : 0, 0]);
  Sc.build(scythe);
  const bladeTipL = new THREE.Vector3(0, -0.86, 0.7), bladeMidL = new THREE.Vector3(0, -0.45, 0.93);

  // ---------- chains at the waist; ribs and a soul core in the open chest ----------
  const pv = bw(pelvis), Cn = part();
  for (let k = 0; k < 44; k++) { const a = k / 44 * TAU, r = 0.285; Cn.add(new THREE.TorusGeometry(0.014, 0.0035, 4, 10), M.chain, [r * Math.sin(a) * 1.02, 1.13 + 0.015 * Math.sin(a * 2), r * Math.cos(a) * 0.87], [0, a + (k % 2 ? Math.PI / 2 : 0), 0]); }
  for (let k = 0; k < 8; k++) Cn.add(new THREE.TorusGeometry(0.014, 0.0035, 4, 10), M.chain, [0.12 + k * 0.004, 1.1 - k * 0.026, 0.25 + k * 0.004], [0, k % 2 ? Math.PI / 2 : 0, 0.1]);
  Cn.build(pelvis, pv);
  const cb = bw(chest), Rb2 = part();
  Rb2.add(new THREE.SphereGeometry(1, 18, 14), M.voidM, [0, 1.52, -0.03], null, [0.16, 0.2, 0.1]);
  for (let k = 0; k < 4; k++) for (const sd of [-1, 1]) Rb2.add(new THREE.TorusGeometry(0.12 - k * 0.01, 0.009, 5, 16, Math.PI * 0.42), M.bone, [0, 1.63 - k * 0.055, -0.01], [Math.PI / 2 - 0.2, 0, sd > 0 ? 0.12 : Math.PI - 0.12 - Math.PI * 0.42], [1, 0.95, 1]);
  seg(Rb2, M.bone, [0, 1.67, 0.1], [0, 1.44, 0.105], 0.012, 0.01, 8, true);
  Rb2.build(chest, cb);
  const coreTex = ctex(glowSprite('rgba(200,255,220,0.95)', 'rgba(50,255,130,0.55)'));
  const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: coreTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  core.position.set(0, 1.53 - cb[1], 0.05); core.scale.set(0.5, 0.5, 1); core.renderOrder = 5; chest.add(core);
  const soulLight = new THREE.PointLight(0x42ff8f, 1.2, 4.5, 2); soulLight.position.set(0, 1.52 - cb[1], 0.25); chest.add(soulLight);

  // ---------- wisps rising from the hem, smoke where the robe dissolves ----------
  const NW = 40, wPos = new Float32Array(NW * 3), wCol = new Float32Array(NW * 3), wSeed = [];
  for (let i = 0; i < NW; i++) wSeed.push([hr() * TAU, 0.3 + hr() * 0.5, hr(), 0.3 + hr() * 0.28]);
  const wGeo = new THREE.BufferGeometry(); wGeo.setAttribute('position', new THREE.BufferAttribute(wPos, 3)); wGeo.setAttribute('color', new THREE.BufferAttribute(wCol, 3));
  const wispTex = ctex(glowSprite('rgba(255,255,255,1)', 'rgba(255,255,255,0.3)'));
  const wisps = new THREE.Points(wGeo, new THREE.PointsMaterial({ size: 0.09, map: wispTex, vertexColors: true, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  wisps.frustumCulled = false; wisps.renderOrder = 6; pelvis.add(wisps);
  const smokeTex = ctex(glowSprite('rgba(8,6,12,0.7)', 'rgba(8,6,12,0.3)'));
  const smoke = [];
  for (let i = 0; i < 9; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, depthWrite: false, transparent: true, opacity: 0.6 }));
    s.renderOrder = 4; pelvis.add(s); smoke.push({ s, a: i / 9 * TAU + hr() * 0.4, ph: hr() });
  }

  // ---------- bind ----------
  root.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(bones);
  for (const m of skinned) m.bind(skeleton);
  const allMats = [];
  root.traverse((o) => { if (o.isMesh || o.isSprite || o.isPoints) for (const m of (Array.isArray(o.material) ? o.material : [o.material])) if (!allMats.some((q) => q.m === m)) allMats.push({ m, op: m.opacity, tr: m.transparent, e: m.emissive ? m.emissive.clone() : null }); });

  // ---------- motion ----------
  const HOVER = 0.3;
  const kf = (u, ts, vs) => {
    if (u <= ts[0]) return vs[0];
    for (let i = 0; i < ts.length - 1; i++) if (u <= ts[i + 1]) { const f = (u - ts[i]) / (ts[i + 1] - ts[i]), s2 = f * f * (3 - 2 * f); return vs[i] + (vs[i + 1] - vs[i]) * s2; }
    return vs[vs.length - 1];
  };
  const IN_OUT = (a, b) => [[0, a, b, 1], [0, 1, 1, 0]];
  const BASE = { sX0: -0.45, sZ0: -0.12, eX0: -1.35, wX0: 0.15, sX1: -0.35, sZ1: 0.3, eX1: -0.7, hp: 0.16 };
  const ACTS = {
    sweep: { dur: 1.6, t: [0, 0.3, 0.45, 0.52, 0.66, 1], w: IN_OUT(0.12, 0.85),
      sX0: [-0.45, -2.5, -1.6, -1.1, -0.8, -0.45], sZ0: [-0.12, -0.5, 0.2, 0.8, 1.0, -0.12], eX0: [-1.35, -0.7, -0.3, -0.2, -0.3, -1.35], wX0: [0.15, 0.6, 0.9, 1.0, 0.9, 0.15],
      cY: [0, -0.7, 0.2, 0.75, 0.85, 0], pY: [0, -0.3, 0.1, 0.4, 0.45, 0], pX: [0, -0.05, 0.15, 0.25, 0.2, 0],
      sX1: [-0.35, -0.8, -0.6, -0.3, -0.2, -0.35], sZ1: [0.3, 0.6, 0.7, 0.9, 0.9, 0.3], hp: [0.16, 0.05, 0.15, 0.25, 0.2, 0.16], slash: [0.42, 0.62] },
    cast: { dur: 1.6, t: [0, 0.25, 0.4, 0.7, 1], w: IN_OUT(0.12, 0.85),
      sX1: [-0.35, -1.7, -1.6, -1.6, -0.35], sZ1: [0.3, 0.25, 0.15, 0.15, 0.3], eX1: [-0.7, -0.4, -0.15, -0.2, -0.7], pX: [0, 0.05, 0.15, 0.15, 0], hp: [0.16, 0.05, 0.08, 0.08, 0.16], cY: [0, -0.2, -0.25, -0.2, 0] },
    grasp: { dur: 1.8, t: [0, 0.3, 0.45, 0.52, 0.75, 1], w: IN_OUT(0.12, 0.85),
      sX0: [-0.45, -2.2, -2.3, -0.9, -0.9, -0.45], eX0: [-1.35, -0.6, -0.5, -0.4, -0.5, -1.35], sX1: [-0.35, -2.5, -2.6, -1.0, -1.0, -0.35], sZ1: [0.3, 0.45, 0.4, 0.3, 0.3, 0.3], eX1: [-0.7, -0.3, -0.3, -0.2, -0.25, -0.7],
      pDY: [0, 0.15, 0.18, -0.15, -0.12, 0], pX: [0, -0.1, -0.12, 0.4, 0.35, 0], hp: [0.16, -0.2, -0.25, 0.35, 0.3, 0.16] },
    eclipse: { dur: 2.8, t: [0, 0.25, 0.55, 0.65, 0.8, 1], w: IN_OUT(0.1, 0.88),
      pDY: [0, 0.4, 0.6, 0.45, 0.3, 0], sX0: [-0.45, -0.9, -0.9, -1.4, -1.0, -0.45], sZ0: [-0.12, -1.2, -1.25, -0.4, -0.3, -0.12], eX0: [-1.35, -0.5, -0.5, -0.4, -0.8, -1.35],
      sX1: [-0.35, -0.9, -0.9, -1.4, -1.0, -0.35], sZ1: [0.3, 1.3, 1.35, 0.4, 0.35, 0.3], eX1: [-0.7, -0.2, -0.2, -0.2, -0.4, -0.7],
      hp: [0.16, -0.3, -0.38, 0.2, 0.2, 0.16], cX: [0, -0.2, -0.25, 0.15, 0.1, 0], pX: [0, -0.1, -0.12, 0.35, 0.2, 0] },
    hurt: { dur: 0.7, t: [0, 0.15, 0.5, 1], w: IN_OUT(0.05, 0.7), interrupt: true,
      pX: [0, -0.35, -0.12, 0], cX: [0, -0.2, -0.08, 0], hp: [0.16, -0.35, 0, 0.16], sX1: [-0.35, -0.2, -0.3, -0.35], sZ1: [0.3, 0.9, 0.5, 0.3], pDY: [0, 0.08, 0.03, 0], sZ0: [-0.12, -0.45, -0.25, -0.12],
      flash: (u) => Math.max(0, 1 - u * 3) },
    die: { dur: 2.8, t: [0, 0.2, 0.5, 1], w: [[0, 0.1, 1], [0, 1, 1]], hold: true, interrupt: true,
      pX: [0, -0.3, -0.35, -0.4], hp: [0.16, -0.5, -0.55, -0.6], sX1: [-0.35, -2.4, -2.5, -2.6], sZ1: [0.3, 0.8, 0.9, 1.0], sX0: [-0.45, -1.8, -2.0, -2.1], sZ0: [-0.12, -0.8, -0.9, -1.0], eX1: [-0.7, -0.3, -0.2, -0.2],
      pDY: [0, 0.2, 0.5, 0.9], fade: (u) => 1 - sm(0.42, 1, u), flash: (u) => 0.4 * Math.sin(Math.PI * Math.min(1, u * 2)) },
    appear: { dur: 1.8, t: [0, 0.5, 1], w: IN_OUT(0.01, 0.7),
      pDY: [0.5, 0.15, 0], sX1: [-0.35, -1.3, -0.35], sZ1: [0.3, 1.0, 0.3], sX0: [-0.45, -1.0, -0.45], sZ0: [-0.12, -0.8, -0.12], hp: [0.16, -0.3, 0.16],
      fade: (u) => sm(0, 0.6, u) }
  };
  let act = null, fadeV = 1, flashV = 0, lastFade = -1;
  function play(name, force) { const def = ACTS[name]; if (!def) return false; if (act && !force && !def.interrupt && !act.def.hold) return false; act = { type: name, t: 0, dur: def.dur, def }; return true; }
  const K0 = (x) => ({ x, v: 0 });
  const rU = ringU.map(() => K0(0)), rL = ringL.map(() => K0(0)), hood = [K0(0), K0(0)];
  const st = { init: false, px: 0, pz: 0, vx: 0, vz: 0, ax: 0, az: 0, acc: 0 };
  const spring = (s, target, h, K, C) => { s.v += (K * (target - s.x) - C * s.v) * h; s.x += s.v * h; };
  const PH = 1 / 120, FLASH = new THREE.Color(0xffffff), _p = new THREE.Vector3();
  function setFade(f) {
    if (Math.abs(f - lastFade) < 1e-3) return; lastFade = f;
    for (const q of allMats) { const tr = q.tr || f < 0.999; if (q.m.transparent !== tr) { q.m.transparent = tr; q.m.needsUpdate = true; } q.m.opacity = q.op * f; }
  }
  function animate(t, dt) {
    dt = dt > 0 ? Math.min(dt, 0.05) : 0;
    const idt = dt > 0 ? dt : 1 / 60;
    const rx = root.position.x, rz = root.position.z, yaw = root.rotation.y;
    if (!st.init || Math.hypot(rx - st.px, rz - st.pz) > 1.5) { st.px = rx; st.pz = rz; st.vx = st.vz = st.ax = st.az = 0; st.init = true; }
    if (dt > 0) {
      const kv = 1 - Math.exp(-dt / 0.1), ka = 1 - Math.exp(-dt / 0.08);
      const nvx = st.vx + ((rx - st.px) / dt - st.vx) * kv, nvz = st.vz + ((rz - st.pz) / dt - st.vz) * kv;
      st.ax += ((nvx - st.vx) / dt - st.ax) * ka; st.az += ((nvz - st.vz) / dt - st.az) * ka; st.vx = nvx; st.vz = nvz;
    }
    st.px = rx; st.pz = rz;
    const cy = Math.cos(yaw), sy = Math.sin(yaw), alx = st.ax * cy - st.az * sy, alz = st.ax * sy + st.az * cy;
    const vlz = st.vx * sy + st.vz * cy;
    let w = 0, P = null, u = 0;
    if (act) { act.t += dt; u = Math.min(1, act.t / act.dur); if (u >= 1 && !act.def.hold) { act = null; u = 0; } else { P = act.def; w = kf(u, P.w[0], P.w[1]); } }
    const V = (key, base) => (P && P[key] ? lerp(base, kf(u, P.t, P[key]), w) : base);
    const lean = cl(vlz * 0.08 + alz * 0.01, -0.25, 0.3);
    pelvis.position.set(0, 1.1 + HOVER + 0.06 * Math.sin(t * 1.7) + V('pDY', 0), 0);
    pelvis.rotation.set(V('pX', 0.1 + 0.02 * Math.sin(t * 0.9) + lean), V('pY', 0), 0.03 * Math.sin(t * 0.7));
    spine.rotation.set(0.04, 0, -0.02 * Math.sin(t * 0.8));
    chest.rotation.set(V('cX', 0.12), V('cY', 0), 0);
    neck.rotation.set(0.05, 0, 0);
    headB.rotation.set(V('hp', BASE.hp + 0.03 * Math.sin(t * 1.3)), 0.12 * Math.sin(t * 0.5) * (1 - w), 0.04 * Math.sin(t * 0.9));
    arms[0].rotation.set(V('sX0', BASE.sX0 + 0.03 * Math.sin(t * 1.2)), 0, V('sZ0', BASE.sZ0));
    elbows[0].rotation.set(V('eX0', BASE.eX0), 0, 0);
    wrists[0].rotation.set(V('wX0', BASE.wX0), 0, 0);
    arms[1].rotation.set(V('sX1', BASE.sX1 + 0.05 * Math.sin(t * 1.5 + 1)), 0, V('sZ1', BASE.sZ1 + 0.04 * Math.sin(t * 1.1)));
    elbows[1].rotation.set(V('eX1', BASE.eX1 + 0.08 * Math.sin(t * 1.9)), 0, 0);
    wrists[1].rotation.set(-0.3 + 0.1 * Math.sin(t * 2.3), 0, 0);
    fadeV = P && P.fade ? P.fade(u) : (act ? fadeV : 1);
    if (!act) fadeV = 1;
    flashV = P && P.flash ? P.flash(u) : 0;
    setFade(fadeV);
    for (const q of allMats) if (q.e) q.m.emissive.copy(q.e).lerp(FLASH, flashV * 0.6);

    // robe physics: billow, trail behind motion, flare with attacks
    const sweepF = P && P.slash ? w : 0, big = (act && (act.type === 'eclipse' || act.type === 'die' || act.type === 'appear')) ? w : 0;
    const uT = ringU.map((b, k) => { const a = (k + 0.5) / RK * TAU, dot = alx * Math.sin(a) + alz * Math.cos(a); return cl(0.05 + 0.05 * Math.sin(t * 1.3 + k * 1.7) - dot * 0.01 - vlz * 0.12 * Math.cos(a) + sweepF * 0.15 * Math.max(0, Math.sin(a)) + big * (0.3 + 0.1 * Math.sin(t * 5 + k)), -0.15, 0.7); });
    const lT = ringL.map((b, k) => { const a = (k + 0.5) / RK * TAU; return cl(0.05 + 0.1 * Math.sin(t * 1.9 + k * 2.3) - vlz * 0.2 * Math.cos(a) + big * (0.35 + 0.15 * Math.sin(t * 6 + k * 1.3)), -0.2, 0.8); });
    const nSteps = Math.min(8, Math.floor((st.acc + dt) / PH)); st.acc = nSteps === 8 ? 0 : st.acc + dt - nSteps * PH;
    for (let n = 0; n < nSteps; n++) {
      for (let k = 0; k < RK; k++) { spring(rU[k], uT[k], PH, 40, 4); spring(rL[k], lT[k] + rU[k].v * 0.03, PH, 28, 3); }
      spring(hood[0], cl(-alz * 0.01, -0.2, 0.2) + 0.05 * Math.sin(t * 2), PH, 50, 4); spring(hood[1], cl(alx * 0.01, -0.2, 0.2), PH, 50, 4);
    }
    for (let k = 0; k < RK; k++) { ringU[k].rotation.x = -rU[k].x; ringL[k].rotation.x = -rL[k].x; }
    hoodT.rotation.set(hood[0].x, 0, hood[1].x);

    // glow, wisps, smoke
    const pulse = 0.85 + 0.15 * Math.sin(t * 3.3) + 0.1 * Math.sin(t * 7.7);
    soulLight.intensity = 1.2 * pulse * fadeV * (1 + flashV);
    core.scale.setScalar(0.5 * pulse);
    for (const e of eyeGlow) e.material.opacity = (0.8 + 0.2 * Math.sin(t * 9 + e.position.x * 40)) * fadeV;
    for (let i = 0; i < NW; i++) {
      const sd = wSeed[i], age = (t * sd[1] + sd[2]) % 1, ang = sd[0] + age * 1.5, r = sd[3] * (1 - 0.3 * age);
      wPos[i * 3] = Math.sin(ang) * r; wPos[i * 3 + 1] = -1.1 + 0.1 + age * 0.9; wPos[i * 3 + 2] = Math.cos(ang) * r * 0.86;
      const k = Math.sin(Math.PI * age) * 0.9 * fadeV; wCol[i * 3] = 0.35 * k; wCol[i * 3 + 1] = k; wCol[i * 3 + 2] = 0.6 * k;
    }
    wGeo.attributes.position.needsUpdate = true; wGeo.attributes.color.needsUpdate = true;
    for (const q of smoke) {
      const age = (t * 0.18 + q.ph) % 1, r = 0.3 + 0.35 * age;
      q.s.position.set(Math.sin(q.a + t * 0.1) * r, -1.1 + 0.12 + age * 0.25, Math.cos(q.a + t * 0.1) * r * 0.86);
      q.s.scale.setScalar(0.5 + 0.6 * age); q.s.material.opacity = 0.55 * Math.sin(Math.PI * age) * fadeV;
    }
  }
  return {
    root, skeleton, bones, animate, play, setFade,
    get busy() { return !!act && !(act.def.hold && act.t >= act.dur); },
    get action() { return act ? act.type : ''; },
    get progress() { return act ? Math.min(1, act.t / act.dur) : -1; },
    reset() { act = null; fadeV = 1; setFade(1); },
    handPos(out) { return wrists[1].getWorldPosition(out || _p); },
    chestPos(out) { return chest.localToWorld((out || _p).set(0, 0, 0.12)); },
    bladeTip(out) { return scythe.localToWorld((out || _p).copy(bladeTipL)); },
    bladeMid(out) { return scythe.localToWorld((out || _p).copy(bladeMidL)); }
  };
}
