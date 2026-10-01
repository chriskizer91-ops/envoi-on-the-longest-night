// Imported unchanged from reference/demos/night-square-shadow-wraith.html. three.js r128 (global THREE).
function makeWitchOriginal() {
  let hs = 90210;
  const hr = () => (hs = (hs * 16807) % 2147483647) / 2147483647;
  const cl = (v, a, b) => (v < a ? a : v > b ? b : v);
  const sm = (e0, e1, x) => { const u = cl((x - e0) / (e1 - e0), 0, 1); return u * u * (3 - 2 * u); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const TAU = Math.PI * 2;
  const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const ctex = (c, rx, ry) => {
    const t = new THREE.CanvasTexture(c);
    if (rx) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); }
    t.anisotropy = 4; return t;
  };

  // ---------- textures painted in code, in her palette ----------
  function star4(g, x, y, r) {
    g.beginPath(); g.moveTo(x, y - r);
    g.quadraticCurveTo(x, y, x + r, y); g.quadraticCurveTo(x, y, x, y + r);
    g.quadraticCurveTo(x, y, x - r, y); g.quadraticCurveTo(x, y, x, y - r); g.fill();
  }
  function fabricCanvas(S, base, nStars, cols, rmin, rmax) {
    const c = cvs(S, S), g = c.getContext('2d');
    g.fillStyle = base; g.fillRect(0, 0, S, S);
    for (let i = 0; i < S * 4; i++) {
      g.fillStyle = hr() < 0.55 ? 'rgba(20,0,12,0.10)' : 'rgba(255,200,230,0.05)';
      g.fillRect(hr() * S, hr() * S, 1 + hr() * 4, 1 + hr() * 4);
    }
    for (let i = 0; i < nStars; i++) {
      const x = hr() * S, y = hr() * S, r = rmin + hr() * (rmax - rmin);
      g.fillStyle = cols[(hr() * cols.length) | 0];
      for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) star4(g, x + dx, y + dy, r);
    }
    for (let i = 0; i < nStars * 4; i++) { g.fillStyle = cols[(hr() * cols.length) | 0]; g.globalAlpha = 0.35 + hr() * 0.6; g.fillRect(hr() * S, hr() * S, 1.3, 1.3); }
    g.globalAlpha = 1;
    return c;
  }
  function trimCanvas() {
    const W = 256, H = 32, c = cvs(W, H), g = c.getContext('2d');
    g.fillStyle = '#5c1238'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#e8ad48'; g.fillRect(0, 2, W, 4);
    for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#f7d68d' : '#e0a33c'; g.fillRect(i * 16 + 4, 15, 8, 6); }
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 27, W, 5);
    return c;
  }
  function sparkleCanvas(S, base, n, warm) {
    const c = cvs(S, S), g = c.getContext('2d');
    g.fillStyle = base; g.fillRect(0, 0, S, S);
    for (let i = 0; i < S * 2; i++) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(hr() * S, hr() * S, 2 + hr() * 3, 2 + hr() * 3); }
    for (let i = 0; i < n; i++) {
      const b = 110 + hr() * 145;
      g.fillStyle = warm ? `rgb(${b | 0},${(b * 0.82) | 0},${(b * 0.74) | 0})` : `rgb(${b | 0},${b | 0},${b | 0})`;
      g.fillRect(hr() * S, hr() * S, hr() < 0.75 ? 1 : 2, 1);
    }
    return c;
  }
  function meshCanvas() {
    const S = 64, c = cvs(S, S), g = c.getContext('2d');
    g.fillStyle = '#1b141b'; g.fillRect(0, 0, S, S);
    g.strokeStyle = 'rgba(160,140,150,0.6)'; g.lineWidth = 1.1;
    for (let k = -S; k <= S * 2; k += 8) {
      g.beginPath(); g.moveTo(k, 0); g.lineTo(k + S, S); g.stroke();
      g.beginPath(); g.moveTo(k, S); g.lineTo(k + S, 0); g.stroke();
    }
    for (let i = 0; i < 60; i++) { const b = 150 + hr() * 105; g.fillStyle = `rgb(${b | 0},${(b * 0.85) | 0},${(b * 0.8) | 0})`; g.fillRect(hr() * S, hr() * S, 1, 1); }
    return c;
  }
  function hairCanvas() {
    const W = 256, H = 64, c = cvs(W, H), g = c.getContext('2d');
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 110; i++) { g.fillStyle = hr() < 0.55 ? 'rgba(25,12,12,0.22)' : 'rgba(255,238,228,0.18)'; g.fillRect(0, hr() * H, W, 0.6 + hr() * 1.8); }
    return c;
  }
  function heightCanvas(W, H, fn, str) {
    const h = new Float32Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) h[y * W + x] = fn(x, y);
    const c = cvs(W, H), g = c.getContext('2d'), img = g.createImageData(W, H), d = img.data;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const dx = h[y * W + (x + 1) % W] - h[y * W + (x + W - 1) % W], dy = h[((y + 1) % H) * W + x] - h[((y + H - 1) % H) * W + x];
      const nx = -dx * str, ny = dy * str, l = Math.hypot(nx, ny, 1), i = (y * W + x) * 4;
      d[i] = (nx / l * 0.5 + 0.5) * 255; d[i + 1] = (ny / l * 0.5 + 0.5) * 255; d[i + 2] = (0.5 / l + 0.5) * 255; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return c;
  }
  function irisCanvas() {
    const S = 128, c = cvs(S, S), g = c.getContext('2d'), m = S / 2;
    let gr = g.createRadialGradient(m, m + 8, 4, m, m, m);
    gr.addColorStop(0, '#d8a060'); gr.addColorStop(0.45, '#9a5a2a'); gr.addColorStop(0.8, '#5a2f16'); gr.addColorStop(1, '#241208');
    g.fillStyle = gr; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 120; i++) {
      const a = hr() * TAU, r0 = 14 + hr() * 6, r1 = 34 + hr() * 26;
      g.strokeStyle = hr() < 0.5 ? 'rgba(255,215,160,0.22)' : 'rgba(40,16,4,0.3)'; g.lineWidth = 0.6 + hr();
      g.beginPath(); g.moveTo(m + Math.cos(a) * r0, m + Math.sin(a) * r0); g.lineTo(m + Math.cos(a) * r1, m + Math.sin(a) * r1); g.stroke();
    }
    gr = g.createLinearGradient(0, 0, 0, S * 0.58); gr.addColorStop(0, 'rgba(20,6,2,0.85)'); gr.addColorStop(1, 'rgba(20,6,2,0)');
    g.fillStyle = gr; g.fillRect(0, 0, S, S * 0.58);
    gr = g.createRadialGradient(m, S * 0.84, 2, m, S * 0.84, S * 0.38); gr.addColorStop(0, 'rgba(255,200,130,0.65)'); gr.addColorStop(1, 'rgba(255,200,130,0)');
    g.fillStyle = gr; g.fillRect(0, 0, S, S);
    g.fillStyle = '#120804'; g.beginPath(); g.ellipse(m, m + 3, 16, 21, 0, 0, 7); g.fill();
    g.strokeStyle = 'rgba(22,8,3,0.95)'; g.lineWidth = 6; g.beginPath(); g.arc(m, m, m - 3, 0, 7); g.stroke();
    return c;
  }
  function flameAtlas(NF, pal) {
    pal = pal || ['rgba(120,20,200,A)', 'rgba(200,70,255,A)', 'rgba(255,225,255,A)'];
    const FW = 96, FH = 176, c = cvs(FW * NF, FH), g = c.getContext('2d');
    const bez = (p0, p1, p2, p3, t) => { const u = 1 - t; return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3; };
    g.globalCompositeOperation = 'lighter';
    for (let f = 0; f < NF; f++) {
      const ox = f * FW, ph = f / NF * TAU;
      g.save(); g.beginPath(); g.rect(ox, 0, FW, FH); g.clip();
      const bx = ox + FW / 2, by = FH - 16;
      const X = [bx, bx - 20 + Math.sin(ph) * 9, bx + 22 + Math.sin(ph + 1.9) * 10, bx + 2 + Math.sin(ph + 0.7) * 6];
      const Y = [by, by - 42, by - 88, by - 132 + Math.sin(ph * 2) * 6];
      const X2 = [X[3], X[3] - 16 + Math.sin(ph + 2.5) * 8, X[3] + 10, X[3] - 4 + Math.sin(ph + 1) * 6];
      const Y2 = [Y[3], Y[3] - 12, Y[3] - 24, 10 + Math.sin(ph) * 4];
      const pass = (rs, col, a) => {
        for (let i = 0; i <= 70; i++) {
          const t = i / 70, top = t > 0.72, tt = top ? (t - 0.72) / 0.28 : t / 0.72;
          const x = top ? bez(X2[0], X2[1], X2[2], X2[3], tt) : bez(X[0], X[1], X[2], X[3], tt);
          const y = top ? bez(Y2[0], Y2[1], Y2[2], Y2[3], tt) : bez(Y[0], Y[1], Y[2], Y[3], tt);
          const r = rs * (1 - t * 0.85) * (0.8 + 0.2 * Math.sin(t * 20 + ph));
          const gr = g.createRadialGradient(x, y, 0, x, y, r);
          gr.addColorStop(0, col.replace('A', String(a))); gr.addColorStop(1, col.replace('A', '0'));
          g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
        }
      };
      pass(42, pal[0], 0.13);
      pass(27, pal[1], 0.22);
      pass(13, pal[2], 0.4);
      g.restore();
    }
    return c;
  }
  function starSprite() {
    const S = 64, c = cvs(S, S), g = c.getContext('2d'), m = S / 2;
    const gr = g.createRadialGradient(m, m, 0, m, m, m); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.2, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, S, S);
    g.fillStyle = '#ffffff'; star4(g, m, m, m * 0.95);
    return c;
  }

  const waves = []; for (let i = 0; i < 9; i++) waves.push([3 + Math.floor(hr() * 9), -9 + Math.floor(hr() * 19), hr() * 6.283]);
  const leatherC = heightCanvas(128, 128, (x, y) => { let v = 0; for (const w of waves) v -= Math.abs(Math.sin((w[0] * x / 128 + w[1] * y / 128) * 6.2832 + w[2])); return v / 9; }, 3.0);
  const velvetC = heightCanvas(128, 128, (x, y) => Math.sin(x / 128 * TAU * 3 + Math.sin(y / 128 * TAU * 2) * 1.5) * 0.5 + (hr() - 0.5) * 0.25, 1.2);
  const ridgeC = heightCanvas(64, 64, (x) => Math.abs(Math.sin(x / 64 * TAU * 6)), 2.2);

  const std = (c, r, extra) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: r, metalness: 0 }, extra || {}));
  const nv2 = (k) => new THREE.Vector2(k, k);
  const coatC = fabricCanvas(256, '#8e2a57', 38, ['#f2c15a', '#e8a93e', '#ff9fd0'], 1.5, 4.5);
  const hatC = fabricCanvas(256, '#7c1d4f', 16, ['#f2c15a', '#e8a93e'], 2, 5);
  const dressC = sparkleCanvas(256, '#1f171c', 1600, true);
  const bandC = sparkleCanvas(128, '#3a2422', 500, true);
  const sashC = sparkleCanvas(128, '#4d4248', 700, false);
  const irisT = ctex(irisCanvas());
  const M = {
    skin: std(0xf0b894, 0.62, { emissive: 0x2a140e }),
    skinShade: std(0xeaa585, 0.65, { emissive: 0x341a12 }),
    lip: std(0xc85a6e, 0.45, { emissive: 0x2a0a10 }),
    nail: std(0x4a1850, 0.25, { emissive: 0x12040f }),
    hair: std(0x56383a, 0.5, { map: ctex(hairCanvas(), 1, 1) }),
    hair2: std(0x7a5a55, 0.5, { map: ctex(hairCanvas(), 1, 1) }),
    cap: std(0x4c3134, 0.55, { map: ctex(hairCanvas(), 1, 1), side: THREE.DoubleSide }),
    brow: std(0x3a2224, 0.7),
    scrunchie: std(0x7d2e9a, 0.6, { normalMap: ctex(velvetC, 3, 1), normalScale: nv2(0.8) }),
    coat: std(0xffffff, 0.72, { map: ctex(coatC, 5, 3), normalMap: ctex(velvetC, 5, 3), normalScale: nv2(0.35) }),
    lining: std(0x4a1334, 0.8, { side: THREE.BackSide }),
    sleeve: std(0xffffff, 0.72, { map: ctex(coatC, 2, 1.5), normalMap: ctex(velvetC, 2, 1.5), normalScale: nv2(0.35) }),
    sleeveLining: std(0x4a1334, 0.8, { side: THREE.BackSide }),
    trim: std(0xffffff, 0.45, { map: ctex(trimCanvas(), 40, 1), emissive: 0x2a0a18, metalness: 0.15 }),
    trimS: std(0xffffff, 0.45, { map: ctex(trimCanvas(), 10, 1), emissive: 0x2a0a18, metalness: 0.15 }),
    dress: std(0xffffff, 0.55, { map: ctex(dressC, 5, 3), emissiveMap: ctex(dressC, 5, 3), emissive: 0x3a3a3a, side: THREE.DoubleSide }),
    bodice: std(0xffffff, 0.5, { map: ctex(meshCanvas(), 10, 5) }),
    sash: std(0xffffff, 0.55, { map: ctex(sashC, 3, 1), emissiveMap: ctex(sashC, 3, 1), emissive: 0x2a2a2a, side: THREE.DoubleSide }),
    boot: std(0x2e1f22, 0.55, { normalMap: ctex(leatherC, 1, 1), normalScale: nv2(0.7) }),
    bootDark: std(0x1b1214, 0.8),
    gold: std(0xe0a83e, 0.32, { metalness: 0.35, emissive: 0x3a2206 }),
    silver: std(0xc9c6d0, 0.3, { metalness: 0.4, emissive: 0x1c1c22 }),
    blade: std(0xdcdce6, 0.18, { metalness: 0.55, emissive: 0x24242c }),
    handle: std(0x1e1417, 0.6, { normalMap: ctex(leatherC, 1, 1), normalScale: nv2(0.6) }),
    hat: std(0xffffff, 0.8, { map: ctex(hatC, 2, 3), normalMap: ctex(velvetC, 2, 3), normalScale: nv2(0.3), side: THREE.DoubleSide }),
    hatBand: std(0xffffff, 0.85, { map: ctex(bandC, 6, 1), emissiveMap: ctex(bandC, 6, 1), emissive: 0x2a2a2a }),
    horn: std(0xe9cfa4, 0.45, { normalMap: ctex(ridgeC, 1, 1), normalScale: nv2(0.9), emissive: 0x2a1a0c }),
    cord: std(0x151015, 0.6),
    eyeW: std(0xffffff, 0.3, { emissive: 0x5a5a5a, vertexColors: true }),
    iris: std(0xffffff, 0.25, { map: irisT, emissiveMap: irisT, emissive: 0x606060 }),
    lash: std(0x1e1216, 0.6), lashLow: std(0x5a3434, 0.7),
    frame: std(0x141014, 0.35, { metalness: 0.2 }),
    lens: new THREE.MeshStandardMaterial({ color: 0xdfe8ff, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.14, depthWrite: false }),
    shine: new THREE.MeshBasicMaterial({ color: 0xffffff }),
    blush: new THREE.MeshBasicMaterial({ color: 0xff8a8a, transparent: true, opacity: 0.3, depthWrite: false })
  };

  // ---------- geometry helpers (indexed merging keeps vertex data small) ----------
  const dummy = new THREE.Object3D();
  function merge(list) {
    let nv = 0, ni = 0;
    for (const g of list) { nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
    const P = new Float32Array(nv * 3), N = new Float32Array(nv * 3), U = new Float32Array(nv * 2);
    const I = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
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
    out.setAttribute('position', new THREE.BufferAttribute(P, 3));
    out.setAttribute('normal', new THREE.BufferAttribute(N, 3));
    out.setAttribute('uv', new THREE.BufferAttribute(U, 2));
    out.setIndex(new THREE.BufferAttribute(I, 1));
    out.computeBoundingSphere();
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
    geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
    geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
  }
  function part(wfn) {
    const buckets = new Map();
    return {
      add(geo, mat, p, rot, sc, quat) {
        dummy.position.set(p ? p[0] : 0, p ? p[1] : 0, p ? p[2] : 0);
        if (quat) dummy.quaternion.copy(quat); else dummy.rotation.set(rot ? rot[0] : 0, rot ? rot[1] : 0, rot ? rot[2] : 0);
        if (sc === null || sc === undefined) dummy.scale.set(1, 1, 1);
        else if (typeof sc === 'number') dummy.scale.set(sc, sc, sc);
        else dummy.scale.set(sc[0], sc[1], sc[2]);
        dummy.updateMatrix();
        const g = geo.clone(); g.applyMatrix4(dummy.matrix);
        let list = buckets.get(mat); if (!list) buckets.set(mat, (list = []));
        list.push(g);
        return this;
      },
      addWorld(geo, mat) { let list = buckets.get(mat); if (!list) buckets.set(mat, (list = [])); list.push(geo); return this; },
      build(parent, off) {
        const out = [];
        for (const [mat, list] of buckets) {
          const geo = merge(list);
          let m;
          if (wfn) { weights(geo, wfn); m = new THREE.SkinnedMesh(geo, skinMat(mat)); m.frustumCulled = false; skinned.push(m); }
          else m = new THREE.Mesh(geo, mat);
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
    const P = new Float32Array((nu + 1) * (nv + 1) * 3), U = new Float32Array((nu + 1) * (nv + 1) * 2), idx = [], o = [0, 0, 0];
    let k = 0;
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      const u = i / nu, v = j / nv; fn(u, v, o);
      P[k * 3] = o[0]; P[k * 3 + 1] = o[1]; P[k * 3 + 2] = o[2];
      if (uvRot) { U[k * 2] = v; U[k * 2 + 1] = u; } else { U[k * 2] = u; U[k * 2 + 1] = 1 - v; }
      k++;
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(P, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(U, 2));
    g.setIndex(idx); g.computeVertexNormals();
    return g;
  }
  // a tube along a curve whose cross-section can be flattened against a surface (hair locks, hat crown, horns)
  const _c = new THREE.Vector3(), _t = new THREE.Vector3(), _o = new THREE.Vector3(), _w = new THREE.Vector3(), _vv = new THREE.Vector3();
  function strand(pts, TS, RS, rFn, flat, centerFn) {
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
    const g = new THREE.TubeGeometry(curve, TS, 1, RS, false);
    const pos = g.attributes.position;
    for (let i = 0; i <= TS; i++) {
      const t = i / TS; curve.getPointAt(t, _c); curve.getTangentAt(t, _t);
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
      }
    }
    g.computeVertexNormals();
    return g;
  }
  const _e = new THREE.Euler(), _v = new THREE.Vector3();
  const offE = (c, rot, v) => { _v.set(v[0], v[1], v[2]).applyEuler(_e.set(rot[0], rot[1], rot[2])); return [c[0] + _v.x, c[1] + _v.y, c[2] + _v.z]; };
  const qz = (q, a) => q.clone().multiply(new THREE.Quaternion().setFromAxisAngle(ZA, a));
  const interp = (tab, y) => {
    if (y <= tab[0][1]) return tab[0][0];
    for (let i = 0; i < tab.length - 1; i++) { const a = tab[i], b = tab[i + 1]; if (y <= b[1]) return a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]); }
    return tab[tab.length - 1][0];
  };

  // ---------- skeleton (51 bones) ----------
  const root = new THREE.Group();
  const bones = [], BI = {};
  function bone(name, parent, x, y, z) {
    const b = new THREE.Bone(); b.name = name; b.position.set(x, y, z); parent.add(b);
    BI[name] = bones.length; bones.push(b); return b;
  }
  const pelvis = bone('pelvis', root, 0, 0.86, 0);
  const spine = bone('spine', pelvis, 0, 0.12, 0);
  const chest = bone('chest', spine, 0, 0.14, 0);
  const neck = bone('neck', chest, 0, 0.16, 0); neck.rotation.order = 'YXZ';
  const headB = bone('head', neck, 0, 0.10, 0); headB.rotation.order = 'YXZ';
  const legs = [], knees = [], ankles = [], arms = [], elbows = [], wrists = [];
  for (const sd of [-1, 1]) {
    const h = bone('hip' + sd, pelvis, 0.075 * sd, -0.07, 0), k = bone('knee' + sd, h, 0, -0.36, 0), a = bone('ankle' + sd, k, 0, -0.34, 0);
    legs.push(h); knees.push(k); ankles.push(a);
    const s = bone('shoulder' + sd, chest, 0.155 * sd, 0.075, 0), e = bone('elbow' + sd, s, 0, -0.235, 0), w = bone('wrist' + sd, e, 0, -0.215, 0);
    arms.push(s); elbows.push(e); wrists.push(w);
  }
  const SK = 8, skirt = [];
  for (let k = 0; k < SK; k++) {
    const a = k / SK * TAU, b = bone('skirt' + k, pelvis, 0.12 * Math.sin(a), 0.02, 0.12 * Math.cos(a) * 0.9);
    b.rotation.order = 'YXZ'; b.rotation.y = a; skirt.push(b);
  }
  const CK = 8, coatU = [], coatL = [];
  for (let k = 0; k < CK; k++) {
    const a = (k + 0.5) / CK * TAU, u = bone('coatU' + k, pelvis, 0.2 * Math.sin(a), 0.06, 0.2 * Math.cos(a) * 0.88);
    u.rotation.order = 'YXZ'; u.rotation.y = a;
    const l = bone('coatL' + k, u, 0, -0.3, 0.035); l.rotation.order = 'YXZ';
    coatU.push(u); coatL.push(l);
  }
  const hairA = bone('hairA', headB, 0, -0.085, -0.14), hairB = bone('hairB', hairA, 0, -0.17, -0.03), hairC = bone('hairC', hairB, 0, -0.17, -0.005);
  const sideL1 = bone('sideL1', headB, 0.125, -0.02, 0.05), sideL2 = bone('sideL2', sideL1, 0.005, -0.1, 0.005);
  const sideR1 = bone('sideR1', headB, -0.125, -0.02, 0.05), sideR2 = bone('sideR2', sideR1, -0.005, -0.1, 0.005);
  const hatB = bone('hat', headB, 0.0, 0.1, -0.012); hatB.rotation.set(-0.2, 0, 0.07);
  const hatA1 = bone('hatA', hatB, 0, 0.25, -0.02), hatA2 = bone('hatB', hatA1, -0.035, 0.1, -0.035);
  root.updateMatrixWorld(true);
  const bw = (b) => { const v = new THREE.Vector3(); b.getWorldPosition(v); return [v.x, v.y, v.z]; };

  // ---------- skin weights ----------
  const ring = (x, z, zs, n, off) => ((((Math.atan2(x, z / zs) / TAU) * n - (off || 0)) % n) + n) % n;
  function wTorso(x, y) {
    if (y >= 1.1) { const t = sm(1.1, 1.16, y); return [[BI.spine, 1 - t], [BI.chest, t]]; }
    if (y >= 0.95) { const t = sm(0.95, 1.1, y); return [[BI.pelvis, 1 - t], [BI.spine, t]]; }
    return [[BI.pelvis, 1]];
  }
  function wSkirt(x, y, z) {
    if (y >= 0.9) return wTorso(x, y, z);
    const s = sm(0.9, 0.6, y);
    const f = ring(x, z, 0.9, SK), k0 = Math.floor(f) % SK, fr = f - Math.floor(f);
    return [[BI.pelvis, 1 - s], [BI['skirt' + k0], s * (1 - fr)], [BI['skirt' + ((k0 + 1) % SK)], s * fr]];
  }
  function wCoat(x, y, z) {
    if (y >= 1.0) { const t = sm(1.0, 1.12, y); return [[BI.spine, 1 - t], [BI.chest, t]]; }
    if (y >= 0.93) { const t = sm(0.93, 1.0, y); return [[BI.pelvis, 1 - t], [BI.spine, t]]; }
    const s1 = sm(0.93, 0.74, y), s2 = sm(0.68, 0.42, y);
    const f = ring(x, z, 0.88, CK, 0.5), k0 = Math.floor(f) % CK, k1 = (k0 + 1) % CK, fr = f - Math.floor(f);
    return [[BI.pelvis, 1 - s1], [BI['coatU' + k0], s1 * (1 - s2) * (1 - fr)], [BI['coatU' + k1], s1 * (1 - s2) * fr], [BI['coatL' + k0], s1 * s2 * (1 - fr)], [BI['coatL' + k1], s1 * s2 * fr]];
  }
  function wLeg(x, y) {
    const sd = x < 0 ? -1 : 1, H = BI['hip' + sd], K = BI['knee' + sd];
    if (y >= 0.48) return [[H, 1]];
    const t = sm(0.48, 0.4, y); return [[H, 1 - t], [K, t]];
  }
  function wArm(x, y) {
    const sd = x < 0 ? -1 : 1, S = BI['shoulder' + sd], E = BI['elbow' + sd];
    if (y > 1.16) { const c = sm(1.16, 1.25, y) * 0.55; return [[S, 1 - c], [BI.chest, c]]; }
    if (y > 1.0) return [[S, 1]];
    if (y > 0.93) { const t = sm(1.0, 0.93, y); return [[S, 1 - t], [E, t]]; }
    return [[E, 1]];
  }
  function wHair(x, y, z) {
    if (z < -0.06 || Math.abs(x) < 0.1) {
      if (y > 1.33) return [[BI.head, 1]];
      if (y > 1.22) { const t = sm(1.33, 1.22, y); return [[BI.head, 1 - t], [BI.hairA, t]]; }
      if (y > 1.08) { const t = sm(1.2, 1.08, y); return [[BI.hairA, 1 - t], [BI.hairB, t]]; }
      const t = sm(1.02, 0.9, y); return [[BI.hairB, 1 - t], [BI.hairC, t]];
    }
    const L = x > 0, S1 = BI[L ? 'sideL1' : 'sideR1'], S2 = BI[L ? 'sideL2' : 'sideR2'];
    if (y > 1.36) return [[BI.head, 1]];
    if (y > 1.3) { const t = sm(1.36, 1.3, y); return [[BI.head, 1 - t], [S1, t]]; }
    const t = sm(1.26, 1.16, y); return [[S1, 1 - t], [S2, t]];
  }

  const _bx = new THREE.Vector3(), _by = new THREE.Vector3(), _bz = new THREE.Vector3(), _bm = new THREE.Matrix4();

  // ---------- skinned body ----------
  const Tp = part(wTorso);
  Tp.add(lathe([[0.118, 1.13], [0.126, 1.16], [0.13, 1.19], [0.12, 1.22], [0.098, 1.25], [0.07, 1.28], [0.05, 1.3]], 40, null, 0.78, undefined, undefined, 1.22), M.skin);
  const bust = (r, y, a) => r + 0.016 * Math.exp(-(((y - 1.085) / 0.035) ** 2)) * Math.max(0, Math.cos(a)) ** 2;
  Tp.add(lathe([[0.112, 0.86], [0.1, 0.9], [0.094, 0.95], [0.1, 1.0], [0.114, 1.04], [0.126, 1.08], [0.128, 1.11], [0.124, 1.14], [0.12, 1.165], [0.104, 1.17]], 48, bust, 0.82, undefined, undefined, 1.05), M.bodice);
  Tp.build(root);

  const Sk = part(wSkirt);
  Sk.add(lathe([[0.112, 0.876], [0.116, 0.884], [0.116, 0.912], [0.11, 0.921]], 48, null, 0.9), M.sash);
  Sk.add(new THREE.SphereGeometry(1, 16, 12), M.sash, [0.012, 0.895, 0.104], null, [0.024, 0.02, 0.016]);
  for (const s of [-1, 1]) {
    const pts = [[0.012 + 0.006 * s, 0.888, 0.112], [0.02 * s + 0.013, 0.82, 0.148], [0.03 * s + 0.014, 0.75, 0.166]];
    Sk.add(strand(pts, 14, 6, (t) => 0.011 * (1 - 0.3 * t), 0.3, (c) => new THREE.Vector3(0, c.y, 0)), M.sash);
  }
  const ruff = (amp, n, y0, y1) => (r, y, a) => r + amp * sm(y0, y1, y) * (Math.sin(n * a + 0.5) + 0.35 * Math.sin(2 * n * a + 1.3));
  const SLIT = 0.42;
  Sk.add(lathe([[0.14, 0.575], [0.212, 0.582], [0.2, 0.64], [0.176, 0.72], [0.148, 0.8], [0.124, 0.86], [0.108, 0.9]], 72, ruff(0.012, 12, 0.72, 0.6), 0.9), M.dress);
  Sk.add(lathe([[0.2, 0.3], [0.274, 0.306], [0.262, 0.38], [0.242, 0.48], [0.216, 0.56], [0.19, 0.6], [0.162, 0.645]], 72, ruff(0.017, 11, 0.5, 0.32), 0.9, SLIT + 0.17, TAU - 0.34), M.dress);
  Sk.add(lathe([[0.27, 0.05], [0.322, 0.056], [0.312, 0.12], [0.296, 0.22], [0.276, 0.3], [0.255, 0.34], [0.232, 0.372]], 80, ruff(0.02, 13, 0.25, 0.07), 0.9, SLIT + 0.24, TAU - 0.48), M.dress);
  Sk.build(root);

  const Lg = part(wLeg);
  for (const sd of [-1, 1]) Lg.add(lathe([[0.052, 0.39], [0.057, 0.44], [0.061, 0.5], [0.068, 0.58], [0.074, 0.66], [0.08, 0.74], [0.084, 0.8], [0.08, 0.86]], 24, null, 0.95), M.skin, [0.075 * sd, 0, 0]);
  Lg.build(root);

  const Ar = part(wArm);
  for (const sd of [-1, 1]) Ar.add(lathe([[0.027, 0.735], [0.029, 0.76], [0.033, 0.82], [0.036, 0.88], [0.037, 0.94], [0.035, 0.965], [0.039, 1.0], [0.043, 1.08], [0.045, 1.15], [0.044, 1.2], [0.034, 1.235], [0.0, 1.248]], 20, null, 0.92), M.skin, [0.155 * sd, 0, 0]);
  Ar.build(root);

  // ---------- the cloak: open front, handkerchief-point hem, folds, gold-stitched trim ----------
  const CT = [[0.38, 0.26], [0.335, 0.42], [0.265, 0.6], [0.205, 0.76], [0.168, 0.88], [0.158, 0.98], [0.162, 1.1], [0.176, 1.18], [0.19, 1.225], [0.152, 1.265], [0.105, 1.295]];
  const aOpen = (v) => 0.5 + 0.34 * v;
  const hemY = (a) => 0.35 - 0.08 * Math.max(0, Math.cos(7 * (a - Math.PI))) ** 2 - 0.045 * Math.max(0, -Math.cos(a));
  function coatPt(u, v, o, off) {
    const ao = aOpen(v), a = ao + u * (TAU - 2 * ao);
    const y = v < 0.08 ? lerp(1.295, 1.215, v / 0.08) : lerp(1.215, hemY(a), (v - 0.08) / 0.92);
    const lo = sm(0.95, 0.32, y);
    const r = interp(CT, y) + lo * (0.026 * Math.sin(9 * a + 0.7) + 0.01 * Math.sin(17 * a + 2.1)) + (off || 0);
    const top = sm(1.14, 1.22, y), mid = sm(0.95, 1.05, y) * (1 - top);
    const xs = 1 + 0.12 * top - 0.05 * mid, zs = 0.9 - 0.18 * sm(1.12, 1.22, y);
    o[0] = r * Math.sin(a) * xs; o[1] = y; o[2] = r * Math.cos(a) * zs;
  }
  const Co = part(wCoat);
  const coatG = sheet(128, 44, (u, v, o) => coatPt(u, v, o, 0));
  Co.addWorld(coatG, M.coat); Co.addWorld(coatG.clone(), M.lining);
  Co.addWorld(sheet(128, 2, (u, v, o) => coatPt(u, 0.968 + v * 0.032, o, 0.003)), M.trim);
  Co.addWorld(sheet(2, 44, (u, v, o) => coatPt(u * 0.012, v, o, 0.003), true), M.trimS);
  Co.addWorld(sheet(2, 44, (u, v, o) => coatPt(0.988 + u * 0.012, v, o, 0.003), true), M.trimS);
  Co.addWorld(sheet(128, 2, (u, v, o) => coatPt(u, v * 0.03, o, 0.003)), M.trimS);
  Co.build(root);

  function sleevePt(sd) {
    return (u, v, o, off) => {
      const a = u * TAU;
      const yEnd = 0.87 - 0.11 * Math.pow(Math.max(0, -Math.cos(a)), 1.5);
      const y = lerp(1.24, yEnd, v);
      let r = lerp(0.062, 0.078, sm(0, 0.35, v)) + 0.066 * sm(0.4, 1.0, v) ** 2 + 0.012 * sm(0.6, 1, v) * Math.sin(7 * a + sd);
      r = r * lerp(0.4, 1, sm(0, 0.12, v)) + (off || 0);
      o[0] = 0.155 * sd + r * Math.sin(a); o[1] = y; o[2] = r * Math.cos(a);
    };
  }
  const Sl = part(wArm);
  for (const sd of [-1, 1]) {
    const f = sleevePt(sd), g = sheet(40, 20, (u, v, o) => f(u, v, o, 0));
    Sl.addWorld(g, M.sleeve); Sl.addWorld(g.clone(), M.sleeveLining);
    Sl.addWorld(sheet(40, 2, (u, v, o) => f(u, 0.955 + v * 0.045, o, 0.003)), M.trimS);
  }
  Sl.build(root);

  // hood lying down at the back of the neck
  const chB = bw(chest), Hood = part();
  Hood.add(new THREE.SphereGeometry(1, 24, 14), M.coat, [0, 1.175, -0.1], null, [0.13, 0.055, 0.05]);
  Hood.add(new THREE.TorusGeometry(0.12, 0.006, 6, 30, Math.PI), M.trimS, [0, 1.2, -0.11], [Math.PI / 2 + 0.25, 0, Math.PI], [1, 0.42, 1]);
  Hood.build(chest, chB);

  // ---------- knee-high boots with buckle straps and a crescent anklet ----------
  for (let i = 0; i < 2; i++) {
    const sd = i === 0 ? -1 : 1;
    const Bs = part();
    Bs.add(lathe([[0.046, -0.345], [0.049, -0.3], [0.052, -0.22], [0.056, -0.12], [0.059, -0.05], [0.066, -0.02], [0.068, -0.004], [0.062, 0.0]], 24, null, 0.95), M.boot);
    for (const y of [-0.27, -0.13]) {
      Bs.add(new THREE.TorusGeometry(0.052 + (y + 0.34) * 0.03, 0.0062, 6, 28), M.bootDark, [0, y, 0], [Math.PI / 2, 0, 0], [1, 0.95, 1]);
      Bs.add(new THREE.BoxGeometry(0.008, 0.022, 0.02), M.gold, [sd * 0.057, y, 0.004]);
      Bs.add(new THREE.BoxGeometry(0.009, 0.012, 0.012), M.bootDark, [sd * 0.06, y, 0.004]);
    }
    Bs.build(knees[i]);
    const Ft = part();
    Ft.add(new THREE.SphereGeometry(1, 20, 14), M.boot, [0, -0.036, 0.04], null, [0.047, 0.042, 0.1]);
    Ft.add(new THREE.SphereGeometry(1, 16, 12), M.boot, [0, -0.048, 0.1], null, [0.04, 0.032, 0.05]);
    Ft.add(new THREE.CylinderGeometry(1, 1, 1, 20), M.bootDark, [0, -0.082, 0.042], null, [0.05, 0.014, 0.115]);
    Ft.add(new THREE.BoxGeometry(0.042, 0.05, 0.04), M.bootDark, [0, -0.07, -0.035]);
    Ft.add(new THREE.TorusGeometry(0.05, 0.0028, 5, 28), M.gold, [0, 0.0, 0.002], [Math.PI / 2 - 0.1, 0, 0]);
    Ft.add(new THREE.TorusGeometry(0.009, 0.0026, 5, 12, Math.PI * 1.3), M.gold, [sd * 0.034, -0.014, 0.037], [0, sd * 0.8, Math.PI * 1.35]);
    Ft.build(ankles[i]);
  }

  // ---------- hands: slender two-jointed fingers with dark polish ----------
  function hand(P, sd, cup) {
    P.add(new THREE.SphereGeometry(1, 16, 12), M.skin, [0, -0.028, 0.002], null, [0.016, 0.03, 0.03]);
    const zs = [0.016, 0.005, -0.006, -0.016], L1 = [0.019, 0.021, 0.02, 0.016], L2 = [0.017, 0.019, 0.018, 0.015];
    for (let f = 0; f < 4; f++) {
      const a1 = cup ? 0.35 + f * 0.06 : 1.25 + f * 0.05, a2 = a1 + (cup ? 0.45 : 1.45);
      const b = [-sd * 0.002, -0.054, zs[f]];
      const m = [b[0] - sd * L1[f] * Math.sin(a1), b[1] - L1[f] * Math.cos(a1), b[2]];
      const d2 = [-sd * Math.sin(a2), -Math.cos(a2), 0], tip = [m[0] + d2[0] * L2[f], m[1] + d2[1] * L2[f], m[2]];
      seg(P, M.skin, b, m, 0.0068, 0.0063, 8, true);
      seg(P, M.skin, m, tip, 0.0063, 0.0056, 8, true);
      const n = [sd * Math.cos(a2), -Math.sin(a2), 0];
      _bz.set(n[0], n[1], n[2]).normalize(); _by.set(-d2[0], -d2[1], -d2[2]).normalize(); _bx.crossVectors(_by, _bz); _bm.makeBasis(_bx, _by, _bz);
      P.add(new THREE.SphereGeometry(1, 8, 6), M.nail, [tip[0] - d2[0] * 0.004 + n[0] * 0.005, tip[1] - d2[1] * 0.004 + n[1] * 0.005, tip[2]], null, [0.0048, 0.0065, 0.0018], new THREE.Quaternion().setFromRotationMatrix(_bm));
    }
    const t0 = [-sd * 0.006, -0.02, 0.026];
    const t1 = cup ? [-sd * 0.016, -0.036, 0.04] : [-sd * 0.02, -0.04, 0.03];
    const t2 = cup ? [-sd * 0.024, -0.05, 0.046] : [-sd * 0.024, -0.055, 0.016];
    seg(P, M.skin, t0, t1, 0.0078, 0.0072, 8, true);
    seg(P, M.skin, t1, t2, 0.0072, 0.0064, 8, true);
  }
  for (let i = 0; i < 2; i++) { const P = part(); hand(P, i === 0 ? -1 : 1, i === 1); P.build(wrists[i]); }
  const Br = part();
  [[0.0335, M.silver, 0.0], [0.035, M.cord, 0.012], [0.034, M.silver, 0.022]].forEach((b, k) => Br.add(new THREE.TorusGeometry(b[0], 0.0034, 6, 22), b[1], [0, -0.178 - b[2], 0], [Math.PI / 2 + 0.12 * (k - 1), 0, 0.1 * k]));
  Br.build(elbows[1]);

  // ---------- the dagger (right hand) ----------
  const dagger = new THREE.Group(); dagger.position.set(0.018, -0.048, 0.004); dagger.rotation.set(-0.25, 0, 0); wrists[0].add(dagger);
  const Dg = part();
  Dg.add(new THREE.CylinderGeometry(0.0105, 0.0115, 0.085, 12), M.handle, [0, 0, 0], [Math.PI / 2, 0, 0]);
  for (const z of [-0.03, -0.01, 0.01, 0.03]) Dg.add(new THREE.TorusGeometry(0.0113, 0.0017, 4, 14), M.gold, [0, 0, z]);
  Dg.add(new THREE.SphereGeometry(0.013, 12, 10), M.gold, [0, 0, -0.05]);
  Dg.add(new THREE.TorusGeometry(0.019, 0.0042, 8, 20), M.gold, [0, 0, 0.049]);
  Dg.add(new THREE.BoxGeometry(0.07, 0.01, 0.011), M.gold, [0, 0, 0.049]);
  for (const x of [-0.037, 0.037]) Dg.add(new THREE.SphereGeometry(0.007, 8, 6), M.gold, [x, 0, 0.049]);
  Dg.add(new THREE.ConeGeometry(0.02, 0.19, 4, 1), M.blade, [0, 0, 0.151], [Math.PI / 2, 0, 0], [1, 1, 0.18]);
  Dg.build(dagger);
  const charm = new THREE.Group(); charm.position.set(0, 0, -0.058); dagger.add(charm);
  const Ch = part();
  for (let k = 0; k < 3; k++) Ch.add(new THREE.TorusGeometry(0.005, 0.0013, 4, 8), M.gold, [0, -0.006 - k * 0.009, 0], [0, k % 2 ? Math.PI / 2 : 0, 0]);
  Ch.add(new THREE.TorusGeometry(0.009, 0.0025, 5, 14, Math.PI * 1.3), M.gold, [0, -0.041, 0], [0, 0, Math.PI * 1.35]);
  Ch.add(new THREE.BoxGeometry(0.003, 0.022, 0.003), M.gold, [0, -0.066, 0]);
  Ch.add(new THREE.BoxGeometry(0.013, 0.003, 0.003), M.gold, [0, -0.06, 0]);
  Ch.build(charm);

  // ---------- the purple flame (left palm): flipbook wisps, rising sparks, and a real light ----------
  const NF = 8, fCan = flameAtlas(NF);
  const fTex = [ctex(fCan), ctex(fCan)];
  for (const tx of fTex) { tx.repeat.set(1 / NF, 1); tx.wrapS = tx.wrapT = THREE.ClampToEdgeWrapping; }
  const flame = new THREE.Group(); flame.position.set(-0.07, -0.042, 0.006); wrists[1].add(flame);
  const fSpr = fTex.map((tx, k) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    s.center.set(0.5, 0.06); s.scale.set(0.2 * (k ? 0.8 : 1), 0.36 * (k ? 0.8 : 1), 1); s.renderOrder = 5; flame.add(s); return s;
  });
  const glowC = cvs(64, 64), gg = glowC.getContext('2d'), grd = gg.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(230,150,255,0.9)'); grd.addColorStop(0.35, 'rgba(170,60,255,0.35)'); grd.addColorStop(1, 'rgba(120,20,220,0)');
  gg.fillStyle = grd; gg.fillRect(0, 0, 64, 64);
  const palmGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: ctex(glowC), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  palmGlow.scale.set(0.16, 0.16, 1); palmGlow.renderOrder = 5; flame.add(palmGlow);
  const NPt = 18, ptPos = new Float32Array(NPt * 3), ptCol = new Float32Array(NPt * 3), ptSeed = [];
  for (let i = 0; i < NPt; i++) ptSeed.push([hr() * TAU, 0.35 + hr() * 0.6, hr()]);
  const ptGeo = new THREE.BufferGeometry();
  ptGeo.setAttribute('position', new THREE.BufferAttribute(ptPos, 3)); ptGeo.setAttribute('color', new THREE.BufferAttribute(ptCol, 3));
  const sparks = new THREE.Points(ptGeo, new THREE.PointsMaterial({ size: 0.03, map: ctex(starSprite()), vertexColors: true, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  sparks.frustumCulled = false; sparks.renderOrder = 6; flame.add(sparks);
  const fLight = new THREE.PointLight(0xb455ff, 1.4, 3.2, 2); fLight.position.set(0, 0.09, 0); flame.add(fLight);

  // ---------- necklace: black cord, gold crescent and cross ----------
  const Nl = part();
  const cord = new THREE.CatmullRomCurve3([[0, 1.275, -0.075], [0.066, 1.268, -0.03], [0.078, 1.245, 0.04], [0.046, 1.2, 0.1], [0, 1.162, 0.123], [-0.046, 1.2, 0.1], [-0.078, 1.245, 0.04], [-0.066, 1.268, -0.03]].map((p) => new THREE.Vector3(p[0], p[1], p[2])), true);
  Nl.add(new THREE.TubeGeometry(cord, 64, 0.0024, 5, true), M.cord);
  Nl.add(new THREE.TorusGeometry(0.004, 0.0015, 4, 10), M.gold, [0, 1.157, 0.126]);
  Nl.add(new THREE.TorusGeometry(0.017, 0.0042, 6, 18, Math.PI).rotateZ(Math.PI), M.gold, [0, 1.145, 0.128]);
  Nl.add(new THREE.BoxGeometry(0.0042, 0.03, 0.003), M.gold, [0, 1.108, 0.13]);
  Nl.add(new THREE.BoxGeometry(0.017, 0.0042, 0.003), M.gold, [0, 1.114, 0.13]);
  Nl.build(chest, chB);

  // ---------- head ----------
  const Nk = part();
  Nk.add(new THREE.CylinderGeometry(0.041, 0.047, 0.14, 16), M.skin, [0, 1.3, -0.005]);
  Nk.build(neck, bw(neck));
  const head = new THREE.Group(); headB.add(head);
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
  const hg = new THREE.SphereGeometry(1, 44, 32), hpos = hg.attributes.position;
  for (let i = 0; i < hpos.count; i++) { const p = jaw(hpos.getX(i), hpos.getY(i), hpos.getZ(i)); hpos.setXYZ(i, p[0], p[1], p[2]); }
  hg.computeVertexNormals();
  const headC = new THREE.Vector3(0, 0, 0);
  const Hd = part();
  Hd.addWorld(hg, M.skin);
  for (const sd of [-1, 1]) {
    const b0 = headPt(sd * 1.5, -0.12, 0.96), b1 = [sd * 0.157, -0.005, -0.02], b2 = [sd * 0.168, 0.038, -0.04];
    Hd.add(strand([b0, b1, b2], 12, 10, (t) => 0.017 * Math.pow(1 - t, 0.7) + 0.0015, 0.42, () => headC), M.skin);
    Hd.add(strand([headPt(sd * 1.5, -0.1, 0.985), [sd * 0.16, -0.002, -0.02], [sd * 0.168, 0.035, -0.038]], 10, 8, (t) => 0.011 * Math.pow(1 - t, 0.8), 0.35, () => headC), M.skinShade);
    const fb = frameAt(sd * 0.31, 0.2, 0.0015);
    Hd.add(new THREE.TorusGeometry(0.033, 0.0036, 5, 14, Math.PI * 0.42).rotateZ(Math.PI * 0.29), M.brow, fb.p, null, [1, 0.55, 1], qz(fb.q, -sd * 0.08));
  }
  { const f = frameAt(0, -0.24, -0.002); Hd.add(new THREE.SphereGeometry(1, 12, 10), M.skinShade, f.p, null, [0.009, 0.007, 0.008], f.q); }
  { const f = frameAt(0, -0.42, 0.0005); Hd.add(new THREE.TorusGeometry(0.017, 0.003, 6, 16, Math.PI * 0.62).rotateZ(Math.PI * 1.19), M.lip, f.p, null, null, f.q); }
  { const f = frameAt(0, -0.47, -0.0005); Hd.add(new THREE.SphereGeometry(1, 12, 8), M.lip, f.p, null, [0.0085, 0.0036, 0.004], f.q); }
  Hd.build(head);
  const Bl = part();
  for (const sd of [-1, 1]) { const f = frameAt(sd * 0.56, -0.3, 0.003); Bl.add(new THREE.CircleGeometry(1, 20), M.blush, f.p, null, [0.026, 0.015, 1], f.q); }
  Bl.build(head);

  // eyes: shaded whites, a textured iris that looks around, fixed highlights, real lids for blinking
  const SX = 0.03, SY = 0.036, SZ = 0.0078;
  const zS = (x, y) => SZ * Math.sqrt(Math.max(0, 1 - (x / SX) ** 2 - (y / SY) ** 2));
  const eyes = [];
  for (const sd of [-1, 1]) {
    const f = frameAt(sd * 0.34, -0.07, -0.003);
    const eg = new THREE.Group(); eg.position.set(f.p[0], f.p[1], f.p[2]); eg.quaternion.copy(f.q); head.add(eg);
    const sg = new THREE.SphereGeometry(1, 24, 16); sg.scale(SX, SY, SZ);
    const spos = sg.attributes.position, col = new Float32Array(spos.count * 3);
    for (let i = 0; i < spos.count; i++) { const y = spos.getY(i), k = 1 - 0.32 * sm(0.006, 0.034, y) - 0.06 * sm(-0.018, -0.036, y); col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = k; }
    sg.setAttribute('color', new THREE.BufferAttribute(col, 3));
    eg.add(new THREE.Mesh(sg, M.eyeW));
    const ig = new THREE.RingGeometry(0, 1, 32, 5), ip = ig.attributes.position, base = new Float32Array(ip.count * 2);
    for (let i = 0; i < ip.count; i++) { base[i * 2] = ip.getX(i) * 0.0215; base[i * 2 + 1] = ip.getY(i) * 0.028; }
    const iris = new THREE.Mesh(ig, M.iris); eg.add(iris);
    const hl = new THREE.Group(); eg.add(hl);
    const HL = part();
    HL.add(new THREE.SphereGeometry(0.0062, 10, 8), M.shine, [-0.0075, 0.0085, 0.0098]);
    HL.add(new THREE.SphereGeometry(0.0033, 8, 6), M.shine, [0.007, -0.0135, 0.0092]);
    HL.build(hl);
    const LL = part();
    LL.add(new THREE.TorusGeometry(0.0285, 0.0016, 4, 16, Math.PI * 0.5).rotateZ(Math.PI * 1.25), M.lashLow, [0, -0.002, 0.004], null, [1.02, 1.2, 1]);
    LL.build(eg);
    const dome = new THREE.SphereGeometry(1, 24, 8, 0, TAU, 0, Math.PI / 2); dome.rotateX(Math.PI / 2);
    const lid = new THREE.Group(); lid.position.set(0, 0.038, 0); eg.add(lid);
    const LD = part(); LD.add(dome, M.skin, [0, -0.038, 0], null, [0.0325, 0.038, 0.0105]); LD.build(lid);
    const low = new THREE.Group(); low.position.set(0, -0.038, 0); eg.add(low);
    const LW = part(); LW.add(dome, M.skin, [0, 0.038, 0], null, [0.0325, 0.038, 0.0105]); LW.build(low);
    const lash = new THREE.Group(); eg.add(lash);
    const LS = part();
    LS.add(new THREE.TorusGeometry(0.03, 0.0042, 6, 24, Math.PI * 0.94).rotateZ(Math.PI * 0.03), M.lash, [0, -0.0366, 0.0035], null, [1.04, 1.22, 1]);
    LS.add(new THREE.ConeGeometry(0.0045, 0.02, 6), M.lash, [sd * 0.0395, -0.024, 0.004], [0, 0, -sd * 1.05]);
    LS.add(new THREE.ConeGeometry(0.0034, 0.015, 6), M.lash, [sd * 0.036, -0.011, 0.004], [0, 0, -sd * 1.45]);
    LS.build(lash);
    lid.visible = low.visible = false;
    eyes.push({ iris, ip, ig, base, hl, lid, low, lash, ox: 9, oy: 9 });
  }
  function setIris(e, ox, oy) {
    if (Math.abs(ox - e.ox) < 1e-4 && Math.abs(oy - e.oy) < 1e-4) return;
    e.ox = ox; e.oy = oy; e.iris.position.set(ox, oy, 0);
    const nrm = e.ig.attributes.normal;
    for (let i = 0; i < e.ip.count; i++) {
      const x = e.base[i * 2], y = e.base[i * 2 + 1], X = x + ox, Y = y + oy, Z = zS(X, Y);
      e.ip.setXYZ(i, x, y, Z + 0.0005);
      _v.set(X / (SX * SX), Y / (SY * SY), Z / (SZ * SZ) + 1e-3).normalize(); nrm.setXYZ(i, _v.x, _v.y, _v.z);
    }
    e.ip.needsUpdate = true; nrm.needsUpdate = true; e.ig.computeBoundingSphere();
  }

  // round glasses
  const Gl = part(), GlL = part(), rimC = [];
  for (const sd of [-1, 1]) {
    const f = frameAt(sd * 0.34, -0.066, 0);
    const c = [f.p[0] + sd * 0.004, f.p[1], f.p[2] + 0.02];
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, sd * 0.2, 0));
    Gl.add(new THREE.TorusGeometry(0.047, 0.0036, 6, 36), M.frame, c, null, null, q);
    GlL.add(new THREE.CircleGeometry(0.046, 28), M.lens, c, null, null, q);
    rimC.push(c);
    const outer = [c[0] + sd * 0.046, c[1] + 0.003, c[2] - 0.0094], mid = [sd * 0.152, c[1] + 0.004, 0.05], ear = headPt(sd * 1.5, -0.03, 1.03);
    seg(Gl, M.frame, outer, mid, 0.0028, 0.0028, 6, true);
    seg(Gl, M.frame, mid, ear, 0.0028, 0.0026, 6, true);
  }
  Gl.add(new THREE.TorusGeometry(0.016, 0.003, 6, 14, Math.PI * 0.8).rotateZ(Math.PI * 0.1), M.frame, [0, rimC[0][1] - 0.002, (rimC[0][2] + rimC[1][2]) / 2 + 0.002]);
  Gl.build(head); GlL.build(head);

  // ---------- hair: scalp, bangs and crown (rigid); side locks and a long wavy ponytail (skinned, physics-driven) ----------
  const lockMat = () => (hr() < 0.62 ? M.hair : M.hair2);
  const Hc = part();
  const capG = new THREE.SphereGeometry(1, 48, 24, 0, TAU, 0, Math.PI * 0.56); capG.rotateX(-0.45);
  Hc.add(capG, M.cap, [0, 0.003, -0.004], null, [HR * HS[0] * 1.05, HR * HS[1] * 1.05, HR * HS[2] * 1.06]);
  function wavy(pts, amp, freq, ph, cen, n) {
    const cv = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
    const out = [], T = new THREE.Vector3(), O = new THREE.Vector3(), S = new THREE.Vector3(), P = new THREE.Vector3();
    for (let i = 0; i <= n; i++) {
      const u = i / n; cv.getPointAt(u, P); cv.getTangentAt(u, T);
      O.subVectors(P, cen(P)); O.addScaledVector(T, -O.dot(T)).normalize(); S.crossVectors(T, O).normalize();
      const w = amp * u * Math.sin(freq * u + ph), w2 = amp * 0.6 * u * Math.sin(freq * u + ph + 1.4);
      out.push([P.x + S.x * w + O.x * w2, P.y + S.y * w + O.y * w2, P.z + S.z * w + O.z * w2]);
    }
    return out;
  }
  const PART = 0.18;
  for (let i = 0; i < 12; i++) {
    const az = -0.88 + i * (1.76 / 11) + (hr() - 0.5) * 0.05, side = az > PART ? 1 : -1;
    const endEl = 0.12 + hr() * 0.13 - (Math.abs(az) > 0.62 ? 0.32 : 0);
    const p0 = headPt(PART + (az - PART) * 0.3, 1.2, 0.97), p1 = headPt(az + side * 0.08, 0.62, 1.13), p2 = headPt(az + side * 0.17, endEl, 1.11);
    Hc.add(strand(wavy([p0, p1, p2], 0.009, 7, hr() * 6, () => headC, 10), 22, 7, (t) => 0.021 * Math.pow(1 - t, 0.7) + 0.0015, 0.5, () => headC), lockMat());
  }
  const tie = [0, -0.085, -0.14];
  for (let i = 0; i < 13; i++) {
    const az = Math.PI / 2 + 0.15 + i * ((Math.PI - 0.3) / 12);
    const p0 = headPt(az, 1.32, 0.97), p1 = headPt(az, 0.55, 1.13), p2 = [tie[0] + Math.sin(az) * 0.025, tie[1] + 0.02, tie[2] + 0.012];
    Hc.add(strand([p0, p1, p2], 20, 7, (t) => 0.032 * (1 - 0.5 * t), 0.42, () => headC), lockMat());
  }
  Hc.build(head);
  const hb = bw(headB), Wd = (p) => [p[0] + hb[0], p[1] + hb[1], p[2] + hb[2]];
  const Hs = part(wHair);
  const sideCen = new THREE.Vector3(hb[0], hb[1] - 0.05, hb[2]);
  for (const sd of [-1, 1]) {
    for (let k = 0; k < 5; k++) {
      const az = sd * (0.72 + k * 0.16);
      const p0 = headPt(az, 0.72, 0.99), p1 = headPt(az, 0.15, 1.2), p2 = headPt(az - sd * 0.02, -0.45, 1.3 + k * 0.02);
      const p3 = [p2[0] + sd * (0.02 + k * 0.006), p2[1] - 0.1 - hr() * 0.04, p2[2] - 0.02 - k * 0.008];
      Hs.add(strand(wavy([p0, p1, p2, p3].map(Wd), 0.016, 9, hr() * 6, () => sideCen, 12), 30, 7, (t) => 0.024 * Math.pow(1 - t, 0.55) + 0.002, 0.5, () => sideCen), lockMat());
    }
  }
  for (let i = 0; i < 28; i++) {
    const fx = i / 27 - 0.5, len = 0.44 + hr() * 0.1, ph = hr() * TAU, pts = [];
    for (let k = 0; k <= 8; k++) {
      const s = k / 8;
      const x = fx * 0.04 + fx * 0.27 * Math.sin(s * 1.5) + 0.03 * Math.sin(s * 10 + ph) * s;
      const y = -0.085 - s * len;
      const z = -0.15 - 0.045 * Math.sin(s * 2.4) - 0.07 * s * s + 0.012 * Math.cos(s * 9 + ph) * s - Math.abs(fx) * 0.03 * s;
      pts.push(Wd([x, y, z]));
    }
    Hs.add(strand(pts, 30, 7, (t) => (0.02 + 0.006 * Math.cos(i)) * Math.pow(1 - t, 0.55) + 0.0025, 0.45, (cc) => new THREE.Vector3(0, cc.y, 0.03)), lockMat());
  }
  Hs.build(root);
  const Sc = part(), scG = new THREE.TorusGeometry(0.028, 0.013, 10, 22), scP = scG.attributes.position;
  for (let i = 0; i < scP.count; i++) {
    const x = scP.getX(i), y = scP.getY(i), a = Math.atan2(y, x), k = 1 + 0.12 * Math.sin(a * 11);
    const cx = Math.cos(a) * 0.028, cy = Math.sin(a) * 0.028;
    scP.setXYZ(i, cx + (x - cx) * k, cy + (y - cy) * k, scP.getZ(i) * k);
  }
  scG.computeVertexNormals();
  Sc.add(scG, M.scrunchie, [0, -0.01, -0.012], [Math.PI / 2 + 0.3, 0, 0]);
  Sc.build(hairA);

  // ---------- the hat: drooping brim, bent crown (its tip flops), fuzzy band, ram horns, chain of crosses, big charm ----------
  const HatP = part();
  const brimPt = (u, v, o, dy) => {
    const a = u * TAU, r = lerp(0.115, 0.335, v), e = (r - 0.115) / 0.22;
    o[0] = r * Math.sin(a); o[2] = r * Math.cos(a) * 0.97;
    o[1] = -0.028 * Math.pow(e, 1.7) + 0.013 * Math.sin(3 * a + 1) * Math.pow(e, 1.2) - 0.012 * Math.max(0, Math.cos(a)) * e + (dy || 0);
  };
  HatP.addWorld(sheet(96, 10, (u, v, o) => brimPt(u, v, o)), M.hat);
  const edge = []; for (let k = 0; k < 96; k++) { const o = [0, 0, 0]; brimPt(k / 96, 1, o); edge.push(new THREE.Vector3(o[0], o[1], o[2])); }
  HatP.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(edge, true), 120, 0.0045, 6, true), M.hat);
  HatP.add(lathe([[0.13, -0.008], [0.136, 0.0], [0.138, 0.022], [0.135, 0.046], [0.127, 0.054]], 64, (r, y, a) => r + (y < 0.008 ? 0.004 * Math.sin(36 * a) : 0), 1), M.hatBand);
  for (const sd of [-1, 1]) {
    const pts = [[sd * 0.122, 0.028, 0.0], [sd * 0.185, 0.04, -0.03], [sd * 0.228, 0.085, -0.045], [sd * 0.22, 0.132, -0.02], [sd * 0.185, 0.128, 0.012], [sd * 0.172, 0.1, 0.02]];
    HatP.add(strand(pts, 40, 12, (t) => 0.03 * (1 - t * 0.8), 1, null), M.horn);
  }
  const chainPt = (s) => { const ang = s * 1.2; return [0.142 * Math.sin(ang), 0.062 - 0.03 * (1 - s * s), 0.142 * Math.cos(ang) * 0.97]; };
  for (let k = 0; k <= 34; k++) { const s = -1 + k / 17; HatP.add(new THREE.TorusGeometry(0.0052, 0.0014, 4, 8), M.silver, chainPt(s), [k % 2 ? Math.PI / 2 : 0, s * 1.2, 0]); }
  for (const s of [-0.72, -0.4, 0.4, 0.72]) {
    const p = chainPt(s), ry = s * 1.2;
    HatP.add(new THREE.BoxGeometry(0.0032, 0.02, 0.0025), M.gold, [p[0], p[1] - 0.016, p[2]], [0, ry, 0]);
    HatP.add(new THREE.BoxGeometry(0.012, 0.0032, 0.0025), M.gold, [p[0], p[1] - 0.012, p[2]], [0, ry, 0]);
  }
  HatP.add(new THREE.TorusGeometry(0.019, 0.0036, 8, 24), M.gold, [0, 0.085, 0.132], [-0.12, 0, 0]);
  HatP.add(new THREE.BoxGeometry(0.0045, 0.034, 0.003), M.gold, [0, 0.085, 0.133], [-0.12, 0, 0]);
  HatP.add(new THREE.BoxGeometry(0.026, 0.0045, 0.003), M.gold, [0, 0.088, 0.133], [-0.12, 0, 0]);
  HatP.add(new THREE.BoxGeometry(0.0055, 0.075, 0.0035), M.gold, [0, 0.03, 0.14], [-0.12, 0, 0]);
  HatP.build(hatB);
  const crownG = strand([[0, -0.012, 0], [0, 0.1, -0.004], [0.004, 0.2, -0.025], [-0.02, 0.29, -0.055], [-0.075, 0.36, -0.08], [-0.14, 0.385, -0.07], [-0.185, 0.36, -0.045]], 40, 28,
    (t) => (0.127 * Math.pow(1 - t, 0.85) + 0.004) * (1 + 0.05 * Math.sin(t * 25 + 1.3)), 1, null);
  crownG.applyMatrix4(hatB.matrixWorld);
  const hatY = bw(hatB)[1];
  const Cr = part((x, y) => {
    if (y < hatY + 0.16) return [[BI.hat, 1]];
    if (y < hatY + 0.26) { const t = sm(hatY + 0.16, hatY + 0.26, y); return [[BI.hat, 1 - t], [BI.hatA, t]]; }
    const t = sm(hatY + 0.28, hatY + 0.35, y); return [[BI.hatA, 1 - t], [BI.hatB, t]];
  });
  Cr.addWorld(crownG, M.hat);
  Cr.build(root);

  // ---------- bind ----------
  root.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(bones);
  for (const m of skinned) m.bind(skeleton);
  const glowMats = [];
  root.traverse((o) => {
    if (!o.isMesh) return;
    for (const m of (Array.isArray(o.material) ? o.material : [o.material])) if (m.emissive && !glowMats.some((q) => q.m === m)) glowMats.push({ m, e: m.emissive.clone() });
  });

  // ---------- effects in world space (the scene adds `fx`) ----------
  const fx = new THREE.Group();
  const addBlend = (map, color, extra) => Object.assign({ map, color, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }, extra || {});

  // white flame for the moonlight spell, cross-faded with the purple one
  const wCan = flameAtlas(NF, ['rgba(110,140,255,A)', 'rgba(190,215,255,A)', 'rgba(255,255,255,A)']);
  const wTex = [ctex(wCan), ctex(wCan)];
  for (const tx of wTex) { tx.repeat.set(1 / NF, 1); tx.wrapS = tx.wrapT = THREE.ClampToEdgeWrapping; }
  const wSpr = wTex.map((tx, k) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial(addBlend(tx, 0xffffff)));
    s.center.set(0.5, 0.06); s.scale.set(0.2 * (k ? 0.8 : 1), 0.36 * (k ? 0.8 : 1), 1); s.renderOrder = 5; s.visible = false; flame.add(s); return s;
  });

  function beamCanvas() {
    const W = 64, H = 256, c = cvs(W, H), g = c.getContext('2d'), img = g.createImageData(W, H), d = img.data;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const dx = (x - W / 2 + 0.5) / (W / 2), vy = 1 - y / H;
      const core = Math.exp(-dx * dx * 7) * 0.75 + Math.exp(-dx * dx * 55) * 0.6;
      const a = Math.min(1, core * Math.min(1, vy * 7) * Math.pow(1 - vy, 1.1));
      const i = (y * W + x) * 4; d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = a * 255;
    }
    g.putImageData(img, 0, 0); return c;
  }
  function sigilCanvas() {
    const S = 256, c = cvs(S, S), g = c.getContext('2d'), m = S / 2;
    g.strokeStyle = '#ffffff'; g.fillStyle = '#ffffff'; g.shadowColor = '#bcd2ff'; g.shadowBlur = 10;
    g.lineWidth = 3.5; g.beginPath(); g.arc(m, m, 118, 0, TAU); g.stroke();
    g.lineWidth = 1.6; g.beginPath(); g.arc(m, m, 102, 0, TAU); g.stroke();
    g.beginPath(); g.arc(m, m, 70, 0, TAU); g.stroke();
    for (let i = 0; i < 28; i++) { const a = i / 28 * TAU; g.beginPath(); g.arc(m + Math.cos(a) * 110, m + Math.sin(a) * 110, i % 4 ? 1.8 : 3.4, 0, TAU); g.fill(); }
    g.beginPath(); g.arc(m, m, 52, 0, TAU); g.arc(m + 20, m - 12, 45, 0, TAU, true); g.fill('evenodd');
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2; star4(g, m + Math.cos(a) * 86, m + Math.sin(a) * 86, i % 2 ? 6 : 9); }
    return c;
  }
  function softCanvas(inner, mid) {
    const c = cvs(128, 128), g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, inner); gr.addColorStop(0.45, mid); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return c;
  }
  const moonG = new THREE.Group(); fx.add(moonG);
  const beam = new THREE.Sprite(new THREE.SpriteMaterial(addBlend(ctex(beamCanvas()), 0xd6e2ff)));
  beam.center.set(0.5, 0); beam.renderOrder = 4; moonG.add(beam);
  const sigil = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.8), new THREE.MeshBasicMaterial(addBlend(ctex(sigilCanvas()), 0xcfe0ff)));
  sigil.rotation.x = -Math.PI / 2; sigil.position.y = 0.02; sigil.renderOrder = 3; moonG.add(sigil);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(3.2, 48), new THREE.MeshBasicMaterial(addBlend(ctex(softCanvas('rgba(255,255,255,1)', 'rgba(255,255,255,0.3)')), 0xb9ccff)));
  pool.rotation.x = -Math.PI / 2; pool.position.y = 0.015; pool.renderOrder = 2; moonG.add(pool);
  const aura = new THREE.Sprite(new THREE.SpriteMaterial(addBlend(ctex(softCanvas('rgba(255,255,255,0.95)', 'rgba(220,232,255,0.35)')), 0xeef3ff)));
  aura.scale.set(2.0, 2.5, 1); aura.renderOrder = 7; moonG.add(aura);
  const NM = 48, mPos = new Float32Array(NM * 3), mCol = new Float32Array(NM * 3), mSeed = [];
  for (let i = 0; i < NM; i++) mSeed.push([hr() * TAU, 0.25 + hr() * 0.45, hr(), 0.3 + hr() * 1.0]);
  const mGeo = new THREE.BufferGeometry();
  mGeo.setAttribute('position', new THREE.BufferAttribute(mPos, 3)); mGeo.setAttribute('color', new THREE.BufferAttribute(mCol, 3));
  const motes = new THREE.Points(mGeo, new THREE.PointsMaterial({ size: 0.07, map: ctex(starSprite()), vertexColors: true, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  motes.frustumCulled = false; motes.renderOrder = 8; moonG.add(motes);
  const moonLight = new THREE.PointLight(0xe4ecff, 0, 6.5, 2); moonLight.position.set(0, 1.2, 0.6); moonG.add(moonLight);
  moonG.visible = false;
  const WHITE = new THREE.Color(0xdfe8ff), PURPLE = new THREE.Color(0xb455ff), MOONC = new THREE.Color(0xe4ecff);

  // steel-blue ribbon that follows the dagger tip during the lunge
  const TRN = 16, trPos = new Float32Array(TRN * 2 * 3), trCol = new Float32Array(TRN * 2 * 3), trIdx = [];
  for (let i = 0; i < TRN - 1; i++) { const a = i * 2; trIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const trGeo = new THREE.BufferGeometry();
  trGeo.setAttribute('position', new THREE.BufferAttribute(trPos, 3)); trGeo.setAttribute('color', new THREE.BufferAttribute(trCol, 3)); trGeo.setIndex(trIdx);
  const trail = new THREE.Mesh(trGeo, new THREE.MeshBasicMaterial({ vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
  trail.frustumCulled = false; trail.renderOrder = 6; trail.visible = false; fx.add(trail);
  const tipL = new THREE.Vector3(0, 0, 0.246), midL = new THREE.Vector3(0, 0, 0.09), trTip = [], trMid = [];
  for (let i = 0; i < TRN; i++) { trTip.push(new THREE.Vector3()); trMid.push(new THREE.Vector3()); }

  // ---------- Lunar Trance: a starlight cloak, ghost moth wings, a crescent aura ----------
  const TR = { u: { value: 0 }, time: { value: 0 } };
  const starMapT = ctex((() => {
    const S = 256, c = cvs(S, S), g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, S);
    gr.addColorStop(0, '#2a3c86'); gr.addColorStop(0.5, '#1b2660'); gr.addColorStop(1, '#2c2470'); g.fillStyle = gr; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 900; i++) { const b = 150 + hr() * 105; g.fillStyle = 'rgba(' + (b | 0) + ',' + ((b * 0.96) | 0) + ',255,' + (0.35 + hr() * 0.65).toFixed(2) + ')'; const s = hr() < 0.85 ? 1 : 2; g.fillRect(hr() * S, hr() * S, s, s); }
    g.fillStyle = '#ffffff'; for (let i = 0; i < 26; i++) { const x = hr() * S, y = hr() * S; for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) star4(g, x + dx, y + dy, 2 + hr() * 4); }
    return c;
  })(), 1, 1);
  function starlight(mat) {
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uTrance = TR.u; sh.uniforms.uTTime = TR.time; sh.uniforms.starMap = { value: starMapT };
      sh.fragmentShader = 'uniform float uTrance; uniform float uTTime; uniform sampler2D starMap;\n' + sh.fragmentShader
        .replace('#include <map_fragment>', '#include <map_fragment>\n  vec4 stc = texture2D(starMap, vUv * 0.6 + vec2(uTTime * 0.004, uTTime * 0.012));\n  diffuseColor.rgb = mix(diffuseColor.rgb, stc.rgb * 0.75 + vec3(0.03, 0.05, 0.15), uTrance);')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += stc.rgb * stc.rgb * 1.8 * uTrance * (0.7 + 0.3 * sin(uTTime * 3.0 + vUv.x * 37.0 + vUv.y * 23.0));');
    };
    mat.customProgramCacheKey = () => 'witch-starlight';
  }
  starlight(skinMat(M.coat)); starlight(skinMat(M.sleeve));
  function ghostWing(hind) {
    const H0 = hind ? 384 : 256, c = cvs(256, H0), g = c.getContext('2d');
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
    g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 1.2;
    for (let i = 0; i < 9; i++) { const a = -1.0 + i * (hind ? 0.27 : 0.21); g.beginPath(); g.moveTo(8, ry); g.quadraticCurveTo(110, ry + Math.sin(a) * 50, 8 + Math.cos(a) * 270, ry + Math.sin(a) * (hind ? 290 : 170)); g.stroke(); }
    const ex = hind ? 132 : 150, ey = hind ? 126 : 118;
    [[17, 'rgba(255,255,255,0.8)'], [12, 'rgba(120,170,255,0.7)'], [7, 'rgba(255,255,255,0.9)']].forEach(([r, col]) => { g.fillStyle = col; g.beginPath(); g.ellipse(ex, ey, r, r * 1.15, 0.3, 0, TAU); g.fill(); });
    g.restore(); path(); g.strokeStyle = '#ffffff'; g.shadowColor = '#cfe0ff'; g.shadowBlur = 12; g.lineWidth = 3; g.stroke();
    return c;
  }
  const gwm = (cnv) => new THREE.MeshBasicMaterial({ map: ctex(cnv), color: 0xdcecff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
  const gwMF = gwm(ghostWing(false)), gwMH = gwm(ghostWing(true));
  const tWing = new THREE.Group(); tWing.position.set(0, 0.1, -0.18); chest.add(tWing); tWing.visible = false;
  const tSides = [];
  for (const sd of [-1, 1]) {
    const side = new THREE.Group(); side.scale.x = sd; tWing.add(side);
    const fo = new THREE.Group(); fo.rotation.z = 0.2; side.add(fo);
    const f = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.95), gwMF); f.position.set(0.445, 0.08, 0); f.renderOrder = 6; fo.add(f);
    const hi = new THREE.Group(); hi.position.set(0, -0.07, -0.01); hi.rotation.z = -0.25; side.add(hi);
    const h = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.2), gwMH); h.position.set(0.375, -0.538, 0); h.renderOrder = 6; hi.add(h);
    tSides.push({ side, fo, hi, sd });
  }
  const tAura = new THREE.Sprite(new THREE.SpriteMaterial({ map: ctex((() => { const c = cvs(256, 256), g = c.getContext('2d'); g.shadowColor = '#cfe0ff'; g.shadowBlur = 26; g.fillStyle = '#ffffff'; g.beginPath(); g.arc(128, 128, 96, 0, TAU); g.arc(150, 104, 86, 0, TAU, true); g.fill('evenodd'); return c; })()), color: 0xdfe9ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  tAura.position.set(0, 0.32, -0.45); tAura.scale.setScalar(1.3); tAura.renderOrder = 1; chest.add(tAura);
  const TRC = new THREE.Color(0x6a80d8), INDIGO = new THREE.Color(0x1c2660);
  const trTint = [M.hair, M.hair2, M.cap, skinMat(M.hair), skinMat(M.hair2), M.iris];
  for (const q of glowMats) q.tr = trTint.includes(q.m) ? (q.m === M.iris ? 0.8 : 0.45) : 0;
  const liningMats = [skinMat(M.lining), skinMat(M.sleeveLining)].map((m) => ({ m, c: m.color.clone() }));

  // ---------- motion ----------
  const K0 = (x) => ({ x, v: 0 });
  const skS = skirt.map(() => K0(0.02)), cuS = coatU.map(() => K0(0.03)), clS = coatL.map(() => K0(0.02));
  const hairS = [K0(0), K0(0), K0(0), K0(0), K0(0), K0(0)];
  const sideS = [K0(0), K0(0), K0(0), K0(0)];
  const hatS = [K0(0), K0(0), K0(0), K0(0)];
  const chS = [K0(0), K0(0)];
  const st = { init: false, px: 0, pz: 0, vx: 0, vz: 0, ax: 0, az: 0, prevYaw: 0, yawRate: 0, acc: 0, hp: new THREE.Vector3(), hv: new THREE.Vector3(), ha: new THREE.Vector3() };
  let lookYaw = 0, lookPitch = 0, lookTY = 0, lookTP = 0, lookTimer = 1.5, blinkIn = 1.5 + hr() * 2, blinkT = -1;
  let trK = 0, act = null, glowK = 0, dashV = 0, liftV = 0, moonKv = 0, trailOn = 0, guardOn = false, gW = 0, trance = 0, glowTint = 0;
  const PH = 1 / 120;
  const spring = (s, target, h, K, C) => { s.v += (K * (target - s.x) - C * s.v) * h; s.x += s.v * h; };
  const _hp = new THREE.Vector3(), _hq = new THREE.Quaternion(), _t1 = new THREE.Vector3(), _t2 = new THREE.Vector3(), _wq = new THREE.Quaternion();
  const kf = (u, ts, vs) => {
    if (u <= ts[0]) return vs[0];
    for (let i = 0; i < ts.length - 1; i++) if (u <= ts[i + 1]) { const f = (u - ts[i]) / (ts[i + 1] - ts[i]), s2 = f * f * (3 - 2 * f); return vs[i] + (vs[i + 1] - vs[i]) * s2; }
    return vs[vs.length - 1];
  };
  const win = (u, a, b, e) => sm(a, a + e, u) * (1 - sm(b - e, b, u));
  const IN_OUT = (a, b) => [[0, a, b, 1], [0, 1, 1, 0]];
  // Channels: pelvis drop/lean/twist/roll, chest pitch/twist, right (dagger) arm, left (flame) arm, legs, head pitch.
  const ACTS = {
    cast: { dur: 1.4 },
    lunge: { dur: 0.9, t: [0, 0.2, 0.36, 0.6, 1], w: IN_OUT(0.1, 0.78),
      pDY: [0, -0.05, -0.17, -0.15, 0], pX: [0, -0.06, 0.32, 0.28, 0], pY: [0, -0.18, 0.2, 0.15, 0], cY: [0, -0.5, 0.32, 0.26, 0], cX: [0, 0, 0.12, 0.1, 0],
      sX0: [-0.18, 0.4, -1.45, -1.4, -0.18], sZ0: [-0.32, -1.0, -0.08, -0.12, -0.32], eX0: [-0.55, -1.5, -0.08, -0.15, -0.55], wX0: [0.12, 0.2, 1.25, 1.2, 0.12],
      sX1: [-0.75, -0.95, 0.6, 0.5, -0.75], sZ1: [0.3, 0.45, 0.55, 0.5, 0.3], eX1: [-1.25, -0.9, -0.35, -0.4, -1.25],
      h0: [0, -0.25, -1.0, -0.95, 0], k0: [0.03, 0.45, 1.1, 1.05, 0.03], a0: [0, -0.2, -0.1, -0.1, 0],
      h1: [0, -0.1, 0.55, 0.5, 0], k1: [0.03, 0.35, 0.15, 0.2, 0.03], a1: [0, -0.15, 0.35, 0.3, 0], hp: [0, 0.1, -0.08, -0.05, 0],
      dash: (u) => (u > 0.2 && u < 0.5 ? 5.5 * Math.sin(Math.PI * (u - 0.2) / 0.3) : 0), trail: [[0.18, 0.72]] },
    combo: { dur: 1.75, t: [0, 0.08, 0.17, 0.27, 0.37, 0.48, 0.6, 0.7, 0.82, 1], w: IN_OUT(0.06, 0.88),
      pDY: [0, -0.04, -0.06, -0.05, -0.06, -0.05, -0.17, -0.15, -0.05, 0], pX: [0, 0.05, 0.14, 0.1, 0.14, 0.02, 0.32, 0.28, 0.08, 0],
      pY: [0, -0.2, 0.25, 0.2, -0.2, -0.15, 0.2, 0.15, 0.05, 0], cY: [0, -0.45, 0.4, 0.45, -0.35, -0.5, 0.32, 0.26, 0.05, 0], cX: [0, 0, 0.08, 0.06, 0.08, 0, 0.12, 0.1, 0.02, 0],
      sX0: [-0.18, -0.4, -1.2, -1.1, -1.15, 0.3, -1.45, -1.4, -0.5, -0.18], sZ0: [-0.32, -1.25, 0.35, 0.45, -1.15, -0.6, -0.1, -0.12, -0.3, -0.32],
      eX0: [-0.55, -0.9, -0.25, -1.2, -0.15, -1.5, -0.08, -0.15, -0.6, -0.55], wX0: [0.12, 0.4, 0.6, 0.5, 0.6, 0.2, 1.25, 1.2, 0.3, 0.12],
      sX1: [-0.75, -0.6, 0, 0.05, 0, -0.3, 0.6, 0.5, -0.4, -0.75], sZ1: [0.3, 0.45, 0.55, 0.55, 0.5, 0.45, 0.55, 0.5, 0.35, 0.3], eX1: [-1.25, -1.1, -0.8, -0.8, -0.8, -0.9, -0.35, -0.4, -1.0, -1.25],
      h0: [0, -0.25, -0.4, -0.35, -0.4, -0.25, -1.0, -0.95, -0.3, 0], k0: [0.03, 0.35, 0.45, 0.4, 0.45, 0.4, 1.1, 1.05, 0.35, 0.03], a0: [0, -0.1, -0.05, -0.05, -0.05, -0.15, -0.1, -0.1, -0.05, 0],
      h1: [0, 0.15, 0.3, 0.25, 0.3, 0.1, 0.55, 0.5, 0.15, 0], k1: [0.03, 0.2, 0.2, 0.2, 0.2, 0.3, 0.15, 0.2, 0.15, 0.03], a1: [0, 0.05, 0.1, 0.1, 0.1, 0, 0.35, 0.3, 0.05, 0],
      hp: [0, 0.05, 0, 0, 0, 0.1, -0.08, -0.05, 0, 0],
      dash: (u) => (u > 0.5 && u < 0.62 ? 3.4 * Math.sin(Math.PI * (u - 0.5) / 0.12) : 0), trail: [[0.1, 0.21], [0.3, 0.41], [0.5, 0.68]] },
    throw: { dur: 1.15, t: [0, 0.3, 0.44, 0.6, 1], w: IN_OUT(0.1, 0.8),
      pX: [0, -0.05, 0.16, 0.12, 0], pY: [0, 0.2, -0.15, -0.1, 0], cY: [0, 0.45, -0.4, -0.3, 0], cX: [0, -0.05, 0.1, 0.08, 0],
      sX1: [-0.75, 0.35, -1.5, -1.3, -0.75], sZ1: [0.3, 0.6, 0.12, 0.15, 0.3], eX1: [-1.25, -1.7, -0.2, -0.35, -1.25],
      sX0: [-0.18, -0.3, 0.25, 0.2, -0.18], sZ0: [-0.32, -0.45, -0.55, -0.5, -0.32], eX0: [-0.55, -0.7, -0.5, -0.5, -0.55],
      h0: [0, 0.1, 0.25, 0.2, 0], k0: [0.03, 0.15, 0.2, 0.2, 0.03], a0: [0, 0, 0.1, 0.1, 0], h1: [0, -0.3, -0.45, -0.4, 0], k1: [0.03, 0.35, 0.4, 0.35, 0.03], a1: [0, -0.05, 0.05, 0.05, 0],
      flame: (u) => (u < 0.44 ? 1 + 0.6 * sm(0.2, 0.44, u) : sm(0.62, 0.95, u)) },
    crescent: { dur: 2.4, t: [0, 0.15, 0.3, 0.55, 0.64, 0.8, 1], w: IN_OUT(0.08, 0.88),
      pDY: [0, 0.02, 0.05, 0.05, 0, 0, 0], cX: [0, -0.08, -0.12, -0.1, 0.08, 0.06, 0], hp: [0, -0.08, -0.12, -0.1, 0, 0, 0], cY: [0, 0, 0, 0, 0.3, 0.25, 0], pX: [0, 0, -0.03, -0.03, 0.15, 0.12, 0],
      sX0: [-0.18, -0.9, -1.35, -1.3, -1.5, -1.45, -0.18], sZ0: [-0.32, -0.9, -1.15, -1.1, -0.1, -0.12, -0.32], eX0: [-0.55, -0.5, -0.3, -0.3, -0.05, -0.1, -0.55], wX0: [0.12, 0.3, 0.3, 0.3, 1.2, 1.15, 0.12],
      sX1: [-0.75, -1.0, -1.35, -1.3, -0.9, -0.85, -0.75], sZ1: [0.3, 0.9, 1.15, 1.1, 0.6, 0.55, 0.3], eX1: [-1.25, -0.6, -0.3, -0.3, -0.7, -0.8, -1.25],
      h0: [0, -0.1, -0.1, -0.1, -0.35, -0.3, 0], k0: [0.03, 0.1, 0.1, 0.1, 0.35, 0.3, 0.03], h1: [0, 0.1, 0.1, 0.1, 0.25, 0.2, 0], k1: [0.03, 0.1, 0.1, 0.1, 0.15, 0.15, 0.03],
      glow: (u) => 0.35 * kf(u, [0, 0.2, 0.62, 0.8], [0, 1, 1, 0]) },
    mend: { dur: 1.9, t: [0, 0.25, 0.75, 1], w: IN_OUT(0.15, 0.85),
      sX1: [-0.75, -0.55, -0.55, -0.75], sZ1: [0.3, 0.02, 0.02, 0.3], eX1: [-1.25, -1.95, -1.95, -1.25],
      sX0: [-0.18, -0.35, -0.35, -0.18], sZ0: [-0.32, -0.2, -0.2, -0.32], eX0: [-0.55, -1.3, -1.3, -0.55],
      hp: [0, 0.2, 0.2, 0], pDY: [0, -0.02, -0.02, 0], cX: [0, 0.05, 0.05, 0],
      shut: [0.22, 0.78], glow: (u) => 0.5 * kf(u, [0, 0.25, 0.7, 1], [0, 1, 1, 0]), tint: 1 },
    hurt: { dur: 0.6, t: [0, 0.15, 0.45, 1], w: IN_OUT(0.05, 0.7),
      pX: [0, -0.25, -0.1, 0], cX: [0, -0.2, -0.08, 0], hp: [0, -0.3, -0.1, 0], pDY: [0, -0.05, -0.02, 0],
      sX0: [-0.18, 0.35, 0.1, -0.18], sZ0: [-0.32, -0.75, -0.5, -0.32], eX0: [-0.55, -0.3, -0.45, -0.55],
      sX1: [-0.75, -0.2, -0.5, -0.75], sZ1: [0.3, 0.85, 0.5, 0.3], eX1: [-1.25, -0.5, -0.9, -1.25],
      h0: [0, 0.15, 0.05, 0], k0: [0.03, 0.25, 0.1, 0.03], h1: [0, -0.2, -0.1, 0], k1: [0.03, 0.35, 0.15, 0.03],
      dash: (u) => (u < 0.3 ? -1.8 * Math.sin(Math.PI * u / 0.3) : 0), shut: [0.03, 0.4], interrupt: true },
    block: { dur: 0.45, t: [0, 0.2, 1], w: IN_OUT(0.05, 0.6), pX: [0, -0.12, 0], hp: [0, -0.1, 0], cX: [0, -0.06, 0],
      dash: (u) => (u < 0.3 ? -0.8 * Math.sin(Math.PI * u / 0.3) : 0), interrupt: true },
    kneel: { dur: 1.3, t: [0, 0.3, 0.6, 1], w: [[0, 0.25, 1], [0, 1, 1]], hold: true, interrupt: true,
      pDY: [0, -0.1, -0.36, -0.36], pX: [0, -0.2, 0.3, 0.35], cX: [0, -0.15, 0.2, 0.25], hp: [0, -0.3, 0.35, 0.45],
      h0: [0, 0.1, -1.5, -1.5], k0: [0.03, 0.3, 1.5, 1.5], a0: [0, 0, 0, 0], h1: [0, 0.1, 0, 0], k1: [0.03, 0.4, 1.5, 1.5], a1: [0, 0.1, 0.45, 0.45],
      sX0: [-0.18, 0.3, -0.25, -0.2], sZ0: [-0.32, -0.7, -0.2, -0.15], eX0: [-0.55, -0.3, -0.3, -0.2],
      sX1: [-0.75, -0.3, 0.05, 0.1], sZ1: [0.3, 0.8, 0.25, 0.2], eX1: [-1.25, -0.5, -0.35, -0.3],
      flame: (u) => 1 - 0.7 * sm(0.3, 1, u) },
    victory: { dur: 1.9, t: [0, 0.3, 0.55, 1], w: [[0, 0.2, 1], [0, 1, 1]], hold: true,
      sX1: [-0.75, -1.6, -2.5, -2.45], sZ1: [0.3, 0.4, 0.3, 0.32], eX1: [-1.25, -0.8, -0.3, -0.35],
      sX0: [-0.18, -0.8, -0.1, -0.1], sZ0: [-0.32, -0.9, -0.55, -0.55], eX0: [-0.55, -0.4, -0.25, -0.25], wX0: [0.12, 0.8, 0.2, 0.2],
      pZ: [0, 0, 0.07, 0.08], pY: [0, 0.3, -0.1, -0.1], cY: [0, 0.3, 0.1, 0.1], hp: [0, -0.1, -0.12, -0.1],
      h0: [0, 0, 0.05, 0.05], k0: [0.03, 0.1, 0.12, 0.12], h1: [0, 0, -0.08, -0.08], k1: [0.03, 0.05, 0.02, 0.02],
      flame: (u) => 1 + 0.8 * sm(0.3, 0.6, u), wink: 0.55 },
    moon: { dur: 2.8, t: [0, 0.18, 0.75, 1], w: IN_OUT(0.12, 0.85),
      pDY: [0, 0.08, 0.16, 0], pX: [0, -0.05, -0.08, 0], cX: [0, -0.1, -0.16, 0],
      sX0: [-0.18, -0.3, -0.35, -0.18], sZ0: [-0.32, -0.8, -0.95, -0.32], eX0: [-0.55, -0.3, -0.2, -0.55], wX0: [0.12, 0.3, 0.4, 0.12],
      sX1: [-0.75, -2.2, -2.75, -0.75], sZ1: [0.3, 0.3, 0.22, 0.3], eX1: [-1.25, -0.5, -0.25, -1.25],
      h0: [0, -0.1, -0.15, 0], k0: [0.03, 0.25, 0.35, 0.03], a0: [0, 0.35, 0.5, 0], h1: [0, 0.05, 0.1, 0], k1: [0.03, 0.25, 0.35, 0.03], a1: [0, 0.35, 0.5, 0],
      hp: [0, -0.1, -0.16, 0], moon: (u) => kf(u, [0, 0.15, 0.3, 0.72, 1], [0, 0.6, 1, 1, 0]), float: true }
  };
  ACTS.summon = { dur: 2.6, t: [0, 0.18, 0.4, 0.62, 0.85, 1], w: IN_OUT(0.08, 0.9),
    sX0: [-0.18, -2.4, -2.6, -0.6, -0.6, -0.18], sZ0: [-0.32, -0.5, -0.45, 0.25, 0.25, -0.32], eX0: [-0.55, -0.25, -0.2, -1.9, -1.9, -0.55],
    sX1: [-0.75, -2.5, -2.7, -0.6, -0.6, -0.75], sZ1: [0.3, 0.5, 0.45, -0.05, -0.05, 0.3], eX1: [-1.25, -0.3, -0.2, -1.9, -1.9, -1.25],
    hp: [0, -0.25, -0.3, 0.3, 0.3, 0], cX: [0, -0.12, -0.14, 0.15, 0.15, 0], pDY: [0, 0.02, 0.03, -0.36, -0.36, 0], pX: [0, -0.05, -0.06, 0.25, 0.25, 0],
    h0: [0, 0, 0, -1.5, -1.5, 0], k0: [0.03, 0.05, 0.05, 1.5, 1.5, 0.03], a0: [0, 0, 0, 0, 0, 0], h1: [0, 0, 0, 0, 0, 0], k1: [0.03, 0.05, 0.05, 1.5, 1.5, 0.03], a1: [0, 0, 0, 0.45, 0.45, 0],
    glow: (u) => 0.45 * kf(u, [0, 0.2, 0.85, 1], [0, 1, 1, 0]), flame: (u) => 1 + 0.5 * kf(u, [0, 0.3, 0.6, 1], [0, 1, 0.3, 0]), shut: [0.55, 0.9] };
  ACTS.briar = { dur: 1.35, t: [0, 0.3, 0.45, 0.72, 1], w: IN_OUT(0.1, 0.85),
    sX1: [-0.75, -2.0, -0.45, -0.5, -0.75], sZ1: [0.3, 0.45, 0.2, 0.2, 0.3], eX1: [-1.25, -0.6, -0.25, -0.3, -1.25],
    pDY: [0, 0.02, -0.28, -0.26, 0], pX: [0, -0.06, 0.38, 0.34, 0], hp: [0, -0.12, 0.3, 0.28, 0], cX: [0, -0.05, 0.15, 0.12, 0],
    h0: [0, 0, -0.85, -0.8, 0], k0: [0.03, 0.05, 1.05, 1.0, 0.03], a0: [0, 0, -0.1, -0.1, 0], h1: [0, 0, 0.4, 0.38, 0], k1: [0.03, 0.05, 0.8, 0.75, 0.03], a1: [0, 0, 0.4, 0.38, 0],
    sX0: [-0.18, -0.4, 0.2, 0.15, -0.18], sZ0: [-0.32, -0.5, -0.6, -0.55, -0.32],
    flame: (u) => 1 + 0.7 * kf(u, [0, 0.3, 0.45, 0.6, 1], [0, 1, 1.2, 0.3, 0]) };
  ACTS.transform = { dur: 2.6, t: [0, 0.2, 0.45, 0.55, 0.75, 1], w: IN_OUT(0.08, 0.9),
    sX0: [-0.18, -0.7, -0.7, -1.9, -1.85, -0.18], sZ0: [-0.32, 0.45, 0.45, -1.2, -1.15, -0.32], eX0: [-0.55, -2.0, -2.0, -0.15, -0.2, -0.55],
    sX1: [-0.75, -0.7, -0.7, -1.9, -1.85, -0.75], sZ1: [0.3, -0.2, -0.2, 1.2, 1.15, 0.3], eX1: [-1.25, -2.0, -2.0, -0.15, -0.2, -1.25],
    hp: [0, 0.3, 0.2, -0.3, -0.25, 0], cX: [0, 0.12, 0.08, -0.2, -0.16, 0], pDY: [0, -0.08, 0.12, 0.2, 0.18, 0],
    k0: [0.03, 0.25, 0.15, 0.22, 0.2, 0.03], k1: [0.03, 0.25, 0.15, 0.22, 0.2, 0.03], a0: [0, 0.1, 0.25, 0.35, 0.3, 0], a1: [0, 0.1, 0.25, 0.35, 0.3, 0],
    flame: (u) => 1 + 0.9 * kf(u, [0, 0.45, 0.55, 0.8, 1], [0, 0.4, 1.2, 0.4, 0]), shut: [0.12, 0.48], glow: (u) => 0.6 * kf(u, [0, 0.4, 0.6, 1], [0.2, 0.5, 1, 0]) };
  const GUARD = { sX0: -1.15, sZ0: 0.35, eX0: -1.35, wX0: 0.35, sX1: -1.0, sZ1: 0.15, eX1: -0.8, h0: -0.25, k0: 0.3, h1: 0.25, k1: 0.3, a1: 0.1, pDY: -0.05, cY: 0.15, hp: 0.05 };
  function play(name, force) {
    const def = ACTS[name]; if (!def) return false;
    if (act && !force && !def.interrupt && !(act.def.hold)) return false;
    act = { type: name, t: 0, dur: def.dur, def }; return true;
  }

  function animate(phase, wb, t, dt) {
    dt = dt > 0 ? Math.min(dt, 0.05) : 0;
    const idt = dt > 0 ? dt : 1 / 60;
    const ph = phase, s = Math.sin(ph), c = Math.cos(ph);
    const rx = root.position.x, rz = root.position.z, yaw = root.rotation.y;
    const jump = !st.init || Math.hypot(rx - st.px, rz - st.pz) > 1.2;
    if (jump) { st.px = rx; st.pz = rz; st.vx = st.vz = st.ax = st.az = 0; st.prevYaw = yaw; st.yawRate = 0; }
    const kv = 1 - Math.exp(-idt / 0.08), ka = 1 - Math.exp(-idt / 0.06);
    if (dt > 0) {
      const nvx = st.vx + ((rx - st.px) / dt - st.vx) * kv, nvz = st.vz + ((rz - st.pz) / dt - st.vz) * kv;
      st.ax += ((nvx - st.vx) / dt - st.ax) * ka; st.az += ((nvz - st.vz) / dt - st.az) * ka;
      st.vx = nvx; st.vz = nvz;
      let dyaw = yaw - st.prevYaw; dyaw = Math.atan2(Math.sin(dyaw), Math.cos(dyaw));
      st.yawRate += (dyaw / dt - st.yawRate) * (1 - Math.exp(-dt / 0.12));
    }
    st.px = rx; st.pz = rz; st.prevYaw = yaw;
    const cy = Math.cos(yaw), sy = Math.sin(yaw), alx = st.ax * cy - st.az * sy, alz = st.ax * sy + st.az * cy;

    // actions
    let cast = 0, w = 0, P = null, u = 0;
    if (act) {
      act.t += dt; u = Math.min(1, act.t / act.dur);
      if (u >= 1 && !act.def.hold) { act = null; u = 0; }
      else if (act.type === 'cast') cast = Math.sin(Math.PI * Math.min(1, u * 1.2));
      else { P = act.def; w = kf(u, P.w[0], P.w[1]); }
    }
    const type = act ? act.type : '', isMoon = type === 'moon';
    gW += ((guardOn ? 1 : 0) - gW) * (1 - Math.exp(-idt * 9));
    const gw = gW * (1 - w);
    const V = (key, base) => {
      let v = GUARD[key] !== undefined ? lerp(base, GUARD[key], gw) : base;
      return P && P[key] ? lerp(v, kf(u, P.t, P[key]), w) : v;
    };
    dashV = P && P.dash ? P.dash(u) : 0;
    moonKv = P && P.moon ? P.moon(u) : 0;
    const glowV = Math.max(P && P.glow ? P.glow(u) : 0, trance * 0.28);
    glowTint += (((P && P.tint) ? 1 : 0) - glowTint) * (1 - Math.exp(-idt * 6));
    const flameS = P && P.flame ? P.flame(u) : 1;

    // body: base walk/idle pose, guard stance and action poses blended on top
    const lean = cl(alz * 0.005, -0.1, 0.1) * (1 - w), bank = cl(-st.yawRate * wb * 0.03, -0.1, 0.1);
    const pDY = V('pDY', 0);
    liftV = Math.max(0, pDY);
    pelvis.position.set(-s * 0.012 * wb * (1 - w), 0.86 + Math.abs(c) * 0.018 * wb - 0.006 * wb + Math.sin(t * 1.9) * 0.003 * (1 - wb) + pDY + (P && P.float ? Math.sin(t * 3) * 0.012 * w : 0) + trance * (0.07 + 0.015 * Math.sin(t * 2.2)), 0);
    pelvis.rotation.set(V('pX', wb * 0.035 + lean), V('pY', -s * 0.09 * wb), V('pZ', (c * 0.05 * wb + Math.sin(t * 0.45) * 0.02 * (1 - wb)) * (1 - w) + bank));
    spine.rotation.set(-0.01 * wb, s * 0.05 * wb * (1 - w), -pelvis.rotation.z * 0.35);
    chest.rotation.set(V('cX', lean * 0.2 - 0.05 * cast), V('cY', s * 0.07 * wb - 0.1 * cast), -c * 0.02 * wb * (1 - w) - pelvis.rotation.z * 0.25);
    const br = Math.sin(t * 2.0) * 0.006 * (1 - 0.5 * wb); chest.scale.set(1 + br, 1 + br * 0.4, 1 + br);
    const hipW = [0, 0];
    for (let i = 0; i < 2; i++) {
      const sg = i === 0 ? 1 : -1, hipB = sg * s * 0.42 * wb, kneeB = wb * (0.05 + 0.85 * Math.max(0, -sg * c)) + 0.03;
      const ankB = -(hipB + kneeB) * 0.65 + Math.max(0, sg * s) * 0.25 * wb;
      hipW[i] = V('h' + i, hipB);
      legs[i].rotation.set(hipW[i] - pelvis.rotation.x, 0, -pelvis.rotation.z + sg * 0.02);
      knees[i].rotation.x = V('k' + i, kneeB);
      ankles[i].rotation.x = V('a' + i, ankB);
    }
    const sw = -s * 0.22 * wb + Math.sin(t * 1.2) * 0.02 * (1 - wb);
    arms[0].rotation.set(V('sX0', -0.18 + sw - lean * 0.5), 0, V('sZ0', -0.32 + Math.sin(t * 0.9) * 0.015 * (1 - wb)));
    elbows[0].rotation.set(V('eX0', -0.55 - 0.2 * Math.max(0, -sw) - 0.05 * wb), 0, 0);
    wrists[0].rotation.set(V('wX0', 0.12), 0, 0.1);
    const bob = Math.sin(ph * 2) * 0.025 * wb + Math.sin(t * 1.6) * 0.02 * (1 - wb);
    arms[1].rotation.set(V('sX1', -0.75 - 0.95 * cast + bob), 0, V('sZ1', 0.3 + 0.1 * cast));
    elbows[1].rotation.set(V('eX1', -1.25 + 0.75 * cast - bob * 0.5), Math.PI / 2, 0);
    wrists[1].rotation.set(0.05 + 0.2 * cast + (isMoon ? 0.35 * w : 0), 0, -0.15);

    // gaze
    if (P && !isMoon) { lookTY = 0; lookTP = 0.04; }
    else if (isMoon) { lookTY = 0; lookTP = -0.2; }
    else if (cast > 0.05) { lookTY = 0.35; lookTP = -0.18; }
    else if (wb > 0.3) { lookTY = cl(st.yawRate * 0.15, -0.5, 0.5); lookTP = 0.06; lookTimer = 0.8 + hr(); }
    else if (dt > 0) {
      lookTimer -= dt;
      if (lookTimer <= 0) {
        if (hr() < 0.3) { lookTY = 0.32; lookTP = 0.12; } else { lookTY = (hr() - 0.5) * 1.1; lookTP = (hr() - 0.55) * 0.25; }
        lookTimer = 2.2 + hr() * 3; if (blinkT < 0 && hr() < 0.6) blinkT = 0;
      }
    }
    const kl = 1 - Math.exp(-idt * (P ? 9 : 4));
    lookYaw += (lookTY - lookYaw) * kl; lookPitch += (lookTP - lookPitch) * kl;
    neck.rotation.set(lookPitch * 0.4, lookYaw * 0.35 - chest.rotation.y * 0.5, 0);
    headB.rotation.set(lookPitch * 0.6 + 0.015 * wb * Math.abs(s) - lean * 0.3 + V('hp', 0), lookYaw * 0.5 - chest.rotation.y * 0.35 - pelvis.rotation.y * 0.3,
      -chest.rotation.z * 0.5 - pelvis.rotation.z * 0.5 + Math.sin(t * 0.7) * 0.025 * (1 - wb));
    if (blinkT < 0) { blinkIn -= dt; if (blinkIn <= 0) blinkT = 0; }
    let close = 0;
    if (blinkT >= 0) { blinkT += dt; const bu = blinkT / 0.16; if (bu >= 1) { blinkT = -1; blinkIn = 1.8 + hr() * 3.2; } else close = Math.sin(Math.PI * Math.min(1, bu * 1.1)); }
    if (P && P.shut) close = Math.max(close, win(u, P.shut[0], P.shut[1], 0.06));
    const eyeX = cl((lookTY - lookYaw) * 0.018 + lookYaw * 0.007, -0.007, 0.007), eyeY = cl(-lookPitch * 0.018, -0.005, 0.004);
    eyes.forEach((e, i) => {
      const cc = (P && P.wink && i === 1) ? Math.max(close, sm(P.wink, P.wink + 0.08, u)) : close;
      setIris(e, eyeX, eyeY);
      e.lid.visible = e.low.visible = cc > 0.01;
      e.lid.scale.set(1, 0.085 + (0.8 - 0.085) * cc, 0.45 + 0.55 * cc);
      e.low.scale.set(1, 0.015 + 0.225 * cc, 0.45 + 0.55 * cc);
      e.lash.position.y = 0.038 - 0.076 * e.lid.scale.y;
      e.lash.scale.y = 1 - 0.85 * cc;
      e.hl.visible = cc < 0.35;
    });

    // physics: skirt, two-level cloak, hair chain and side locks, floppy hat tip, dagger charms
    root.updateMatrixWorld(true);
    headB.getWorldPosition(_hp);
    if (jump) {
      for (const k of skS) { k.x = 0.02; k.v = 0; } for (const k of cuS) { k.x = 0.03; k.v = 0; } for (const k of clS) { k.x = 0.02; k.v = 0; }
      for (const k of [...hairS, ...sideS, ...hatS, ...chS]) { k.x = k.v = 0; }
      st.hp.copy(_hp); st.hv.set(0, 0, 0); st.ha.set(0, 0, 0); st.acc = 0; st.init = true;
    }
    if (dt > 0) {
      _t1.subVectors(_hp, st.hp).divideScalar(dt);
      _t2.copy(st.hv); st.hv.lerp(_t1, kv); _t2.subVectors(st.hv, _t2).divideScalar(dt); st.ha.lerp(_t2, ka);
    }
    st.hp.copy(_hp);
    headB.getWorldQuaternion(_hq).invert(); _t1.copy(st.ha).applyQuaternion(_hq);
    const hax = _t1.x, haz = _t1.z, headPitch = headB.rotation.x + neck.rotation.x + chest.rotation.x + pelvis.rotation.x;
    const bounce = Math.sin(ph * 2 + 0.4) * wb, mk = moonKv, billow = Math.sin(t * 4.2), lw = type === 'lunge' || type === 'combo' ? w : 0;
    const skT = skirt.map((b, k) => {
      const a = k / SK * TAU, dot = alx * Math.sin(a) + alz * Math.cos(a);
      let kick = 0;
      for (let i = 0; i < 2; i++) kick += Math.max(0, -hipW[i]) * Math.max(0, Math.cos(a - (i === 0 ? -0.3 : 0.3))) ** 2;
      return cl(0.02 - dot * 0.004 + kick * 0.18 + Math.abs(c) * 0.012 * wb + 0.05 * cast + mk * (0.12 + 0.04 * Math.sin(t * 5 + k)), -0.03, 0.4);
    });
    const cuT = coatU.map((b, k) => {
      const a = (k + 0.5) / CK * TAU, dot = alx * Math.sin(a) + alz * Math.cos(a);
      let kick = 0;
      for (let i = 0; i < 2; i++) kick += Math.max(0, -hipW[i]) * Math.max(0, Math.cos(a - (i === 0 ? -0.5 : 0.5))) ** 2;
      return cl(0.03 - dot * 0.006 + Math.abs(c) * 0.02 * wb + 0.04 * wb * Math.max(0, -Math.cos(a)) + 0.08 * cast + mk * (0.24 + 0.06 * Math.sin(t * 3.4 + k * 1.3)) + lw * 0.25 * Math.max(0, -Math.cos(a)) + kick * 0.12, -0.04, 0.55);
    });
    const clT = coatL.map((b, k) => {
      const a = (k + 0.5) / CK * TAU, dot = alx * Math.sin(a) + alz * Math.cos(a);
      return cl(0.02 - dot * 0.008 + Math.sin(ph * 2 + k) * 0.03 * wb + 0.1 * cast + mk * (0.22 + 0.1 * Math.sin(t * 4 + k * 1.7)) + lw * 0.3 * Math.max(0, -Math.cos(a)), -0.08, 0.6);
    });
    const hT = [cl(haz * 0.003, -0.12, 0.12) - headPitch * 0.9 + bounce * 0.015 + mk * 0.3, cl(-hax * 0.003, -0.1, 0.1),
      cl(haz * 0.004, -0.15, 0.15) + bounce * 0.02 + mk * (0.25 + 0.08 * billow), cl(-hax * 0.004, -0.12, 0.12),
      cl(haz * 0.005, -0.18, 0.18) + bounce * 0.025 + mk * (0.3 + 0.12 * billow), cl(-hax * 0.005, -0.14, 0.14)];
    const sT = cl(haz * 0.004, -0.14, 0.14) + bounce * 0.02 - headPitch * 0.4 + mk * 0.3;
    const tT = [cl(haz * 0.004, -0.12, 0.12) + bounce * 0.03 + mk * 0.1 * billow, cl(-hax * 0.004, -0.1, 0.1), cl(haz * 0.006, -0.2, 0.2) + bounce * 0.05 + mk * 0.18 * billow, cl(-hax * 0.006, -0.16, 0.16)];
    const nSteps = Math.min(8, Math.floor((st.acc + dt) / PH));
    st.acc = nSteps === 8 ? 0 : st.acc + dt - nSteps * PH;
    for (let n = 0; n < nSteps; n++) {
      for (let k = 0; k < SK; k++) spring(skS[k], skT[k], PH, 110, 8);
      for (let k = 0; k < CK; k++) { spring(cuS[k], cuT[k], PH, 70, 6); spring(clS[k], clT[k] + cuS[k].v * 0.02, PH, 45, 4.5); }
      spring(hairS[0], hT[0], PH, 80, 6); spring(hairS[1], hT[1], PH, 80, 6);
      spring(hairS[2], hT[2], PH, 60, 4.5); spring(hairS[3], hT[3], PH, 60, 4.5);
      spring(hairS[4], hT[4], PH, 45, 3.5); spring(hairS[5], hT[5], PH, 45, 3.5);
      for (const k of sideS) spring(k, sT, PH, 90, 5);
      spring(hatS[0], tT[0], PH, 90, 5); spring(hatS[1], tT[1], PH, 90, 5); spring(hatS[2], tT[2], PH, 60, 3.5); spring(hatS[3], tT[3], PH, 60, 3.5);
      spring(chS[0], cl(-alz * 0.02, -0.5, 0.5) + bounce * 0.15, PH, 50, 3); spring(chS[1], cl(alx * 0.02, -0.4, 0.4), PH, 50, 3);
    }
    for (let k = 0; k < SK; k++) skirt[k].rotation.x = -skS[k].x;
    for (let k = 0; k < CK; k++) { coatU[k].rotation.x = -cuS[k].x; coatL[k].rotation.x = -clS[k].x; }
    hairA.rotation.set(hairS[0].x, 0, hairS[1].x); hairB.rotation.set(hairS[2].x, 0, hairS[3].x); hairC.rotation.set(hairS[4].x, 0, hairS[5].x);
    sideL1.rotation.x = sideS[0].x; sideL2.rotation.x = sideS[1].x * 1.3; sideR1.rotation.x = sideS[2].x; sideR2.rotation.x = sideS[3].x * 1.3;
    hatA1.rotation.set(hatS[0].x, 0, hatS[1].x); hatA2.rotation.set(hatS[2].x, 0, hatS[3].x);

    // hanging things point down; the flame stays upright and follows the action
    root.updateMatrixWorld(true);
    dagger.getWorldQuaternion(_wq).invert();
    charm.quaternion.copy(_wq).multiply(_hq.setFromEuler(_e.set(chS[0].x, 0, chS[1].x)));
    wrists[1].getWorldQuaternion(_wq).invert(); flame.quaternion.copy(_wq);
    const whiteF = Math.max(mk, trance);
    const fr = Math.floor(t * 14);
    fTex[0].offset.set((fr % NF) / NF, 0); fTex[1].offset.set(((fr + 4) % NF) / NF, 0);
    wTex[0].offset.copy(fTex[0].offset); wTex[1].offset.copy(fTex[1].offset);
    const fs = (1 + 0.06 * Math.sin(t * 9)) * (1 + 0.9 * cast + 0.7 * mk) * flameS + 1e-4;
    for (const arr of [fSpr, wSpr]) { arr[0].scale.set(0.2 * fs, 0.36 * fs, 1); arr[1].scale.set(0.16 * fs, 0.29 * fs, 1); }
    for (const sp of fSpr) sp.material.opacity = 1 - whiteF;
    for (const sp of wSpr) { sp.material.opacity = whiteF; sp.visible = whiteF > 0.001; }
    palmGlow.scale.setScalar(0.16 * (1 + 0.5 * cast) * (1 + 0.08 * Math.sin(t * 13)) * Math.min(1, flameS + 0.2));
    palmGlow.material.opacity = 1 - whiteF * 0.8;
    fLight.color.copy(PURPLE).lerp(MOONC, whiteF);
    fLight.intensity = (1.3 + 0.22 * Math.sin(t * 13) + 0.14 * Math.sin(t * 7.3)) * (1 + 1.2 * cast + 1.2 * mk) * Math.min(1.4, 0.15 + flameS);
    fLight.distance = 3.2 + 1.5 * cast + 1.5 * mk;
    for (let i = 0; i < NPt; i++) {
      const sd = ptSeed[i], age = (t * sd[1] * (1 + cast) + sd[2]) % 1, ang = sd[0] + age * 5, r = 0.02 + 0.045 * age * (1 + cast);
      ptPos[i * 3] = Math.cos(ang) * r; ptPos[i * 3 + 1] = 0.02 + age * 0.3 * (1 + cast); ptPos[i * 3 + 2] = Math.sin(ang) * r;
      const k = Math.sin(Math.PI * age) * (0.75 + 0.25 * Math.sin(t * 20 + i)) * Math.min(1, flameS);
      ptCol[i * 3] = 0.9 * k; ptCol[i * 3 + 1] = lerp(0.55, 0.93, whiteF) * k; ptCol[i * 3 + 2] = k;
    }
    ptGeo.attributes.position.needsUpdate = true; ptGeo.attributes.color.needsUpdate = true;

    // light effects: moonlight (beam, sigil, pool), aura for trance and healing, rising motes; she glows
    const auraK = Math.max(mk, glowV);
    moonG.visible = auraK > 0.001;
    if (moonG.visible) {
      moonG.position.set(rx, 0, rz);
      beam.visible = sigil.visible = mk > 0.001;
      beam.material.opacity = mk * 0.8; beam.scale.set(1.4 + 0.4 * mk, 8, 1);
      sigil.material.opacity = mk * 0.9; sigil.rotation.z = t * 0.4; sigil.scale.setScalar(0.65 + 0.35 * mk);
      pool.material.opacity = auraK * 0.5;
      pool.material.color.setRGB(lerp(0.72, 0.62, glowTint), lerp(0.8, 1.0, glowTint), lerp(1.0, 0.72, glowTint));
      aura.material.opacity = auraK * (0.5 + 0.08 * Math.sin(t * 6)); aura.position.set(0, 1.0 + pDY, 0);
      aura.material.color.setRGB(lerp(0.93, 0.8, glowTint), 1, lerp(1, 0.82, glowTint));
      moonLight.intensity = auraK * 3.2;
      moonLight.color.setRGB(lerp(0.9, 0.75, glowTint), 1, lerp(1, 0.8, glowTint));
      for (let i = 0; i < NM; i++) {
        const sd = mSeed[i], age = (t * sd[1] + sd[2]) % 1, ang = sd[0] + age * 2.5, r = sd[3] * (1 - 0.35 * age) * (0.6 + 0.4 * mk);
        mPos[i * 3] = Math.cos(ang) * r; mPos[i * 3 + 1] = age * (1.4 + 1.8 * mk); mPos[i * 3 + 2] = Math.sin(ang) * r;
        const k = Math.sin(Math.PI * age) * auraK;
        mCol[i * 3] = lerp(0.85, 0.6, glowTint) * k; mCol[i * 3 + 1] = 0.95 * k; mCol[i * 3 + 2] = lerp(1, 0.7, glowTint) * k;
      }
      mGeo.attributes.position.needsUpdate = true; mGeo.attributes.color.needsUpdate = true;
    }
    const gk = Math.max(mk * 0.5, glowV * 0.35);
    if (Math.abs(gk - glowK) > 1e-3 || Math.abs(trance - trK) > 1e-3 || (gk === 0 && glowK !== 0)) { glowK = gk; trK = trance; for (const q of glowMats) { q.m.emissive.copy(q.e).lerp(WHITE, gk); if (q.tr) q.m.emissive.lerp(TRC, trance * q.tr); } }
    TR.u.value = trance; TR.time.value = t;
    tWing.visible = trance > 0.01;
    if (tWing.visible) { gwMF.opacity = gwMH.opacity = 0.85 * trance; const fl = Math.sin(t * 2.4); for (const sw of tSides) { sw.side.rotation.y = sw.sd * (0.45 + 0.3 * fl); sw.side.scale.set(sw.sd * (0.3 + 0.7 * trance), 0.3 + 0.7 * trance, 1); sw.fo.rotation.x = 0.08 * fl; } }
    tAura.material.opacity = 0.7 * trance; tAura.material.rotation = Math.sin(t * 0.5) * 0.1; tAura.scale.setScalar(1.2 + 0.1 * Math.sin(t * 1.7));
    for (const L of liningMats) L.m.color.copy(L.c).lerp(INDIGO, trance);

    // dagger trail during strikes
    let trOn = 0;
    if (P && P.trail) for (const r of P.trail) trOn = Math.max(trOn, win(u, r[0], r[1], 0.05));
    if (trOn > 0 && trailOn === 0) { dagger.localToWorld(_t1.copy(tipL)); dagger.localToWorld(_t2.copy(midL)); for (let i = 0; i < TRN; i++) { trTip[i].copy(_t1); trMid[i].copy(_t2); } }
    trailOn = trOn; trail.visible = trOn > 0;
    if (trail.visible) {
      for (let i = TRN - 1; i > 0; i--) { trTip[i].copy(trTip[i - 1]); trMid[i].copy(trMid[i - 1]); }
      dagger.localToWorld(trTip[0].copy(tipL)); dagger.localToWorld(trMid[0].copy(midL));
      for (let i = 0; i < TRN; i++) {
        const a = trTip[i], b = trMid[i], k = trOn * Math.pow(1 - i / (TRN - 1), 1.6);
        trPos.set([a.x, a.y, a.z, b.x, b.y, b.z], i * 6);
        trCol.set([k, k, k, 0.35 * k, 0.4 * k, 0.55 * k], i * 6);
      }
      trGeo.attributes.position.needsUpdate = true; trGeo.attributes.color.needsUpdate = true;
    }
  }

  const _tp = new THREE.Vector3();
  return {
    root, skeleton, bones, animate, flameLight: fLight, flame, fx,
    play, cast() { return play('cast'); }, lunge() { return play('lunge'); }, moonlight() { return play('moon'); },
    guard(on) { guardOn = !!on; },
    reset() { act = null; guardOn = false; gW = 0; trance = 0; },
    set trance(v) { trance = cl(v, 0, 1); }, get trance() { return trance; },
    get busy() { return !!act && !(act.def.hold && act.t >= act.dur); },
    get action() { return act ? act.type : ''; },
    get casting() { return !!act && act.type === 'cast'; },
    get progress() { return act ? Math.min(1, act.t / act.dur) : -1; },
    get dash() { return dashV; },
    get lift() { return liftV; },
    get moon() { return moonKv; },
    tip(out) { return dagger.localToWorld((out || _tp).copy(tipL)); },
    flamePos(out) { return flame.getWorldPosition(out || _tp); },
    chestPos(out) { return chest.getWorldPosition(out || _tp); }
  };
}
