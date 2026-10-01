// Imported unchanged from reference/demos/night-square-shadow-wraith.html. three.js r128 (global THREE).
function makeGoddess() {
  let hs = 4711;
  const hr = () => (hs = (hs * 16807) % 2147483647) / 2147483647;
  const cl = (v, a, b) => (v < a ? a : v > b ? b : v);
  const sm = (e0, e1, x) => { const u = cl((x - e0) / (e1 - e0), 0, 1); return u * u * (3 - 2 * u); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const TAU = Math.PI * 2;
  const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const ctex = (c, rx, ry) => { const t = new THREE.CanvasTexture(c); if (rx) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); } t.anisotropy = 4; return t; };

  // flowing cloth + a rim of light, and a bend for the wings
  const U = { uTime: { value: 0 }, uBend: { value: 0 } };
  function ether(mat, o) {
    const un = { uAmp: { value: o.amp || 0 }, uFreq: { value: o.freq || 2 }, uSpeed: { value: o.speed || 1.4 }, uY0: { value: o.y0 || 0 }, uY1: { value: o.y1 === undefined ? 1 : o.y1 }, uRim: { value: new THREE.Color(o.rim === undefined ? 0xbfe0ff : o.rim) }, uRimK: { value: o.rimK === undefined ? 0.8 : o.rimK } };
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, un); sh.uniforms.uTime = U.uTime;
      sh.vertexShader = 'uniform float uTime, uAmp, uFreq, uSpeed, uY0, uY1;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  float wk = uAmp * (1.0 - smoothstep(uY0, uY1, position.y));\n  transformed.x += sin(position.y * uFreq + uTime * uSpeed + position.z * 1.7) * wk;\n  transformed.z += cos(position.y * uFreq * 0.83 + uTime * uSpeed * 0.9 + position.x * 1.9) * wk * 0.7;');
      sh.fragmentShader = 'uniform vec3 uRim; uniform float uRimK;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += uRim * uRimK * pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 2.2);');
    };
    mat.customProgramCacheKey = () => 'goddess-ether';
    return mat;
  }
  function bend(mat, half, span) {
    const un = { uHalf: { value: half }, uSpan: { value: span } };
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, un); sh.uniforms.uBend = U.uBend;
      sh.vertexShader = 'uniform float uBend, uHalf, uSpan;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  float bx = clamp((position.x + uHalf) / uSpan, 0.0, 1.0);\n  transformed.z += uBend * bx * bx;');
    };
    mat.customProgramCacheKey = () => 'goddess-bend-' + mat.type;
    return mat;
  }

  // ---------- painted textures ----------
  function wingPath(g, hind) {
    g.beginPath();
    if (!hind) { g.moveTo(8, 150); g.quadraticCurveTo(110, 70, 246, 34); g.quadraticCurveTo(252, 120, 205, 180); g.quadraticCurveTo(110, 204, 8, 168); }
    else { g.moveTo(8, 20); g.quadraticCurveTo(170, 0, 226, 110); g.quadraticCurveTo(232, 192, 172, 222); g.quadraticCurveTo(150, 300, 162, 374); g.quadraticCurveTo(134, 362, 122, 242); g.quadraticCurveTo(58, 204, 8, 62); }
    g.closePath();
  }
  function wingCanvas(hind) {
    const H0 = hind ? 384 : 256, c = cvs(512, H0 * 2), g = c.getContext('2d'); g.scale(2, 2);
    const rx = 8, ry = hind ? 30 : 155;
    wingPath(g, hind); g.save(); g.clip();
    let gr = g.createRadialGradient(rx, ry, 8, rx, ry, hind ? 330 : 250);
    gr.addColorStop(0, '#f7fffb'); gr.addColorStop(0.42, '#cdf8df'); gr.addColorStop(0.8, '#a5e9c8'); gr.addColorStop(0.93, '#d9f9c6'); gr.addColorStop(1, '#f4ffd6');
    g.fillStyle = gr; g.fillRect(0, 0, 256, H0);
    for (let i = 0; i < 2600; i++) { g.fillStyle = hr() < 0.5 ? 'rgba(255,255,255,0.22)' : 'rgba(80,150,120,0.16)'; g.fillRect(hr() * 256, hr() * H0, 1.3, 0.7); }
    g.strokeStyle = 'rgba(88,160,128,0.62)'; g.lineWidth = 1.1;
    for (let i = 0; i < 11; i++) {
      const a = -1.0 + i * (hind ? 0.24 : 0.19), ex = rx + Math.cos(a) * 280, ey = ry + Math.sin(a) * (hind ? 300 : 170);
      g.beginPath(); g.moveTo(rx, ry); g.quadraticCurveTo(rx + (ex - rx) * 0.45, ry + (ey - ry) * 0.3 + 18, ex, ey); g.stroke();
    }
    g.strokeStyle = 'rgba(255,250,215,0.55)'; g.lineWidth = 6; g.beginPath();
    if (!hind) { g.moveTo(232, 52); g.quadraticCurveTo(238, 124, 198, 166); } else { g.moveTo(214, 112); g.quadraticCurveTo(218, 180, 166, 210); }
    g.stroke();
    const ex = hind ? 132 : 150, ey = hind ? 126 : 118;
    [[19, '#ffe796'], [15, '#3c2a44'], [12, '#9b4f9e'], [8, '#d98fd0'], [5, 'rgba(250,255,250,0.9)']].forEach(([r, col]) => { g.fillStyle = col; g.beginPath(); g.ellipse(ex, ey, r, r * 1.15, 0.3, 0, TAU); g.fill(); });
    g.strokeStyle = '#fff6c8'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(ex, ey, 21, 24, 0.3, 0, TAU); g.stroke();
    g.restore();
    wingPath(g, hind); g.strokeStyle = '#ffffff'; g.shadowColor = '#eafff2'; g.shadowBlur = 12; g.lineWidth = 3; g.stroke(); g.shadowBlur = 0;
    if (!hind) { g.strokeStyle = '#7d3a70'; g.lineWidth = 8; g.beginPath(); g.moveTo(10, 150); g.quadraticCurveTo(110, 72, 244, 36); g.stroke(); g.strokeStyle = 'rgba(255,220,240,0.7)'; g.lineWidth = 1.5; g.stroke(); }
    return c;
  }
  function moonCanvas(solid) {
    const S = 256, c = cvs(S, S), g = c.getContext('2d');
    if (solid) { g.fillStyle = '#c9d4f4'; g.fillRect(0, 0, S, S); }
    const gr = g.createRadialGradient(110, 100, 10, 128, 128, 128); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.7, '#e3ebff'); gr.addColorStop(1, '#b9c8f0');
    g.fillStyle = gr; g.beginPath(); g.arc(128, 128, 126, 0, TAU); g.fill();
    for (let i = 0; i < 30; i++) { const r = 4 + hr() * 18, a = hr() * TAU, d = hr() * 100; g.fillStyle = 'rgba(150,165,210,' + (0.15 + hr() * 0.25).toFixed(2) + ')'; g.beginPath(); g.arc(128 + Math.cos(a) * d, 128 + Math.sin(a) * d, r, 0, TAU); g.fill(); }
    return c;
  }
  function starCloth(dense) {
    const S = 256, c = cvs(S, S), g = c.getContext('2d');
    g.fillStyle = dense ? 'rgba(255,255,255,0)' : '#ffffff'; if (dense) g.clearRect(0, 0, S, S); else g.fillRect(0, 0, S, S);
    for (let i = 0; i < (dense ? 500 : 260); i++) { g.fillStyle = hr() < 0.5 ? 'rgba(170,190,255,0.5)' : 'rgba(255,240,200,0.6)'; g.beginPath(); g.arc(hr() * S, hr() * S, 0.6 + hr() * 1.6, 0, TAU); g.fill(); }
    return c;
  }
  function filigree(glowOnly) {
    const S = 256, c = cvs(S, S), g = c.getContext('2d');
    g.fillStyle = glowOnly ? '#000000' : '#c9d3f2'; g.fillRect(0, 0, S, S);
    g.strokeStyle = glowOnly ? '#d8b860' : '#e2c477'; g.lineWidth = 2.2; g.lineCap = 'round';
    for (const m of [1, -1]) for (let k = 0; k < 4; k++) {
      const y0 = 20 + k * 62; g.beginPath(); g.moveTo(128, y0);
      g.bezierCurveTo(128 + m * 50, y0 + 6, 128 + m * 70, y0 + 40, 128 + m * 30, y0 + 50); g.bezierCurveTo(128 + m * 10, y0 + 54, 128 + m * 18, y0 + 30, 128 + m * 34, y0 + 32); g.stroke();
      g.fillStyle = g.strokeStyle; g.beginPath(); g.arc(128 + m * 96, y0 + 24, 3, 0, TAU); g.fill();
    }
    return c;
  }
  function fadeCanvas() { const c = cvs(4, 128), g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 4, 128); return c; }
  function glowCanvas(inner, mid) { const c = cvs(128, 128), g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, inner); gr.addColorStop(0.4, mid); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return c; }
  function ringCanvas() { const c = cvs(256, 256), g = c.getContext('2d'); g.strokeStyle = '#fff'; g.shadowColor = '#fff'; g.shadowBlur = 12; g.lineWidth = 6; g.beginPath(); g.arc(128, 128, 110, 0, TAU); g.stroke(); g.lineWidth = 2; for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; g.beginPath(); g.moveTo(128 + Math.cos(a) * 92, 128 + Math.sin(a) * 92); g.lineTo(128 + Math.cos(a) * (i % 2 ? 100 : 104), 128 + Math.sin(a) * (i % 2 ? 100 : 104)); g.stroke(); } return c; }

  const std = (c, r, extra) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: r, metalness: 0 }, extra || {}));
  const moonTex = ctex(moonCanvas(false)), moonSurf = ctex(moonCanvas(true));
  const wingFT = ctex(wingCanvas(false)), wingHT = ctex(wingCanvas(true));
  const glowT = ctex(glowCanvas('rgba(255,255,255,1)', 'rgba(255,255,255,0.3)')), ringT = ctex(ringCanvas());
  const sheerStars = ctex(starCloth(true), 3, 3);
  const M = {
    skin: ether(std(0xbcc6e8, 0.55, { emissive: 0x262f4c }), { rim: 0xc9e4ff, rimK: 0.65 }),
    gown: ether(std(0xa9b4de, 0.65, { map: ctex(starCloth(false), 4, 3), emissive: 0x1f2642, side: THREE.DoubleSide }), { amp: 0.16, freq: 2.2, speed: 1.3, y0: 0.0, y1: 2.6, rim: 0xdfeaff, rimK: 0.6 }),
    over: ether(std(0xd2dcf6, 0.4, { map: sheerStars, emissive: 0x2a3866, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false }), { amp: 0.2, freq: 2.0, speed: 1.15, y0: 0.3, y1: 2.7, rim: 0xffffff, rimK: 0.9 }),
    bodice: ether(std(0xffffff, 0.45, { map: ctex(filigree(false), 3, 1), emissiveMap: ctex(filigree(true), 3, 1), emissive: 0xc8a050 }), { rim: 0xdfeaff, rimK: 0.5 }),
    sleeve: ether(std(0xc9d8fb, 0.5, { map: sheerStars, emissive: 0x2a3866, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false }), { amp: 0.1, freq: 3, speed: 1.6, y0: -1.0, y1: 0.0, rim: 0xffffff, rimK: 0.8 }),
    ribbon: ether(std(0xd8e2ff, 0.5, { emissive: 0x30407a, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false }), { amp: 0.22, freq: 1.6, speed: 1.4, y0: 0.2, y1: 2.8, rim: 0xffffff, rimK: 0.9 }),
    hair: ether(std(0xd2d8f2, 0.4, { emissive: 0x2f3456 }), { amp: 0.14, freq: 1.8, speed: 1.2, y0: -2.3, y1: -0.25, rim: 0xd6e2ff, rimK: 0.55 }),
    hair2: ether(std(0xc9bcf2, 0.4, { emissive: 0x2e2850 }), { amp: 0.14, freq: 1.8, speed: 1.2, y0: -2.3, y1: -0.25, rim: 0xe8dcff, rimK: 0.55 }),
    gold: std(0xfff0c2, 0.3, { metalness: 0.4, emissive: 0x8a7440 }),
    gem: new THREE.MeshBasicMaterial({ color: 0xcfe8ff }),
    lid: std(0x4c5a86, 0.6), lip: std(0xcaa8e6, 0.5, { emissive: 0x3a2a50 }), brow: std(0xb8c2e8, 0.6),
    glowLine: new THREE.MeshBasicMaterial({ color: 0xfff6dc }),
    mist: new THREE.MeshBasicMaterial({ map: ctex(fadeCanvas()), color: 0xcfdcff, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }),
    wingF: bend(std(0xdbe9e2, 0.5, { map: wingFT, emissiveMap: wingFT, emissive: 0x1f3a2e, transparent: true, side: THREE.DoubleSide, depthWrite: false, alphaTest: 0.02 }), 1.2, 2.4),
    wingH: bend(std(0xdbe9e2, 0.5, { map: wingHT, emissiveMap: wingHT, emissive: 0x1f3a2e, transparent: true, side: THREE.DoubleSide, depthWrite: false, alphaTest: 0.02 }), 1.0, 2.0),
    wingFG: bend(new THREE.MeshBasicMaterial({ map: wingFT, color: 0xbff5da, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }), 1.2, 2.4),
    wingHG: bend(new THREE.MeshBasicMaterial({ map: wingHT, color: 0xbff5da, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }), 1.0, 2.0)
  };

  // ---------- geometry helpers ----------
  const dummy = new THREE.Object3D();
  function merge(list) {
    let nv = 0, ni = 0;
    for (const g of list) { nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
    const P = new Float32Array(nv * 3), N = new Float32Array(nv * 3), Uv = new Float32Array(nv * 2), I = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
    let vo = 0, io = 0;
    for (const g of list) {
      const c = g.attributes.position.count; P.set(g.attributes.position.array, vo * 3); N.set(g.attributes.normal.array, vo * 3); if (g.attributes.uv) Uv.set(g.attributes.uv.array, vo * 2);
      if (g.index) { const a = g.index.array; for (let k = 0; k < a.length; k++) I[io + k] = a[k] + vo; io += a.length; } else { for (let k = 0; k < c; k++) I[io + k] = vo + k; io += c; }
      vo += c;
    }
    const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.BufferAttribute(P, 3)); out.setAttribute('normal', new THREE.BufferAttribute(N, 3)); out.setAttribute('uv', new THREE.BufferAttribute(Uv, 2)); out.setIndex(new THREE.BufferAttribute(I, 1)); out.computeBoundingSphere();
    return out;
  }
  function part() {
    const buckets = new Map();
    return {
      add(geo, mat, p, rot, sc, quat) {
        dummy.position.set(p ? p[0] : 0, p ? p[1] : 0, p ? p[2] : 0);
        if (quat) dummy.quaternion.copy(quat); else dummy.rotation.set(rot ? rot[0] : 0, rot ? rot[1] : 0, rot ? rot[2] : 0);
        if (sc === null || sc === undefined) dummy.scale.set(1, 1, 1); else if (typeof sc === 'number') dummy.scale.set(sc, sc, sc); else dummy.scale.set(sc[0], sc[1], sc[2]);
        dummy.updateMatrix(); const g = geo.clone(); g.applyMatrix4(dummy.matrix);
        let l = buckets.get(mat); if (!l) buckets.set(mat, (l = [])); l.push(g); return this;
      },
      build(parent) { const out = []; for (const [mat, l] of buckets) { const m = new THREE.Mesh(merge(l), mat); m.renderOrder = mat.transparent ? 3 : 0; parent.add(m); out.push(m); } return out; }
    };
  }
  const _c = new THREE.Vector3(), _t = new THREE.Vector3(), _vv = new THREE.Vector3(), _s = new THREE.Vector3();
  function strand(pts, TS, RS, rFn) {
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
    const g = new THREE.TubeGeometry(curve, TS, 1, RS, false), pos = g.attributes.position;
    for (let i = 0; i <= TS; i++) { curve.getPointAt(i / TS, _c); const r = rFn(i / TS); for (let j = 0; j <= RS; j++) { const k = i * (RS + 1) + j; _vv.fromBufferAttribute(pos, k).sub(_c).multiplyScalar(r).add(_c); pos.setXYZ(k, _vv.x, _vv.y, _vv.z); } }
    g.computeVertexNormals(); return g;
  }
  function ribbon(pts, n, wFn, side) {
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
    const P = [], Uv = [], idx = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n; curve.getPointAt(t, _c); curve.getTangentAt(t, _t);
      _s.set(side[0], side[1], side[2]); _s.addScaledVector(_t, -_s.dot(_t)).normalize();
      const w = wFn(t); P.push(_c.x - _s.x * w, _c.y - _s.y * w, _c.z - _s.z * w, _c.x + _s.x * w, _c.y + _s.y * w, _c.z + _s.z * w); Uv.push(0, 1 - t, 1, 1 - t);
      if (i < n) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(Uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
  }
  function lathe(profile, segs, disp, xs, zs, phiStart, phiLen) {
    const g = new THREE.LatheGeometry(profile.map((p) => new THREE.Vector2(p[0], p[1])), segs, phiStart || 0, phiLen || TAU), pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) { let x = pos.getX(i), z = pos.getZ(i); const y = pos.getY(i), r = Math.hypot(x, z); if (disp && r > 1e-6) { const k = disp(r, y, Math.atan2(x, z)) / r; x *= k; z *= k; } pos.setXYZ(i, x * (xs || 1), y, z * (zs || 1)); }
    g.computeVertexNormals(); return g;
  }
  function crescentShape(R, d, r2) {
    const yi = (R * R - r2 * r2 + d * d) / (2 * d), xi = Math.sqrt(Math.max(0, R * R - yi * yi)), a0 = Math.atan2(yi, xi), b0 = Math.atan2(yi - d, -xi), b1 = Math.atan2(yi - d, xi) + TAU;
    const s = new THREE.Shape(); s.absarc(0, 0, R, a0, Math.PI - a0, true); s.absarc(0, d, r2, b0, b1, false); return s;
  }
  function starGeo(s) { const a = new THREE.OctahedronGeometry(1, 0); a.scale(s * 0.28, s, s * 0.12); const b = a.clone(); b.rotateZ(Math.PI / 2); return [a, b]; }

  // ---------- body (about 4.4 m; the root sits at the hem) ----------
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const B = part();
  B.add(lathe([[1.15, -0.05], [1.1, 0.15], [0.97, 0.5], [0.8, 1.0], [0.6, 1.65], [0.44, 2.2], [0.32, 2.6], [0.24, 2.88], [0.23, 3.05]], 112, (r, y, a) => r + (0.015 + 0.045 * sm(2.6, 0.2, y)) * Math.sin(16 * a + y * 1.5)), M.gown);
  B.add(lathe([[1.24, 0.32], [1.1, 0.6], [0.88, 1.1], [0.66, 1.7], [0.48, 2.25], [0.36, 2.62], [0.28, 2.9]], 96, (r, y, a) => r + 0.05 * sm(1.0, 0.35, y) * Math.sin(10 * a) + 0.025 * Math.sin(13 * a + y * 2), 1, 1, 0.42, TAU - 0.84), M.over);
  B.add(lathe([[0.22, 2.95], [0.25, 3.1], [0.28, 3.24], [0.29, 3.34], [0.27, 3.46], [0.19, 3.56], [0.09, 3.62]], 56, (r, y, a) => r + 0.032 * Math.exp(-(((y - 3.28) / 0.07) ** 2)) * Math.max(0, Math.cos(a)) ** 2, 1.25, 0.8), M.bodice);
  B.add(lathe([[1.4, -1.0], [1.26, -0.4], [1.15, 0.0], [1.12, 0.3]], 112, null), M.mist);
  B.add(new THREE.TorusGeometry(0.24, 0.022, 10, 48), M.gold, [0, 2.96, 0], [Math.PI / 2, 0, 0], [1, 0.82, 1]);
  B.add(new THREE.CylinderGeometry(0.075, 0.075, 0.025, 28), M.gold, [0, 2.95, 0.215], [Math.PI / 2, 0, 0]);
  B.add(new THREE.TorusGeometry(0.045, 0.009, 6, 18, Math.PI).rotateZ(Math.PI), M.glowLine, [0, 2.96, 0.232]);
  B.add(new THREE.SphereGeometry(0.024, 14, 10), M.gem, [0, 2.93, 0.235]);
  for (const x of [-0.06, 0, 0.06]) {
    for (let k = 0; k < 5; k++) B.add(new THREE.TorusGeometry(0.009, 0.0025, 4, 10), M.gold, [x, 2.88 - k * 0.022, 0.232 + Math.abs(x) * -0.3], [0, k % 2 ? Math.PI / 2 : 0, 0]);
    for (const g of starGeo(0.028)) B.add(g, M.gold, [x, 2.75, 0.232 + Math.abs(x) * -0.3]);
  }
  for (const s of [-1, 1]) B.add(ribbon([[0.08 * s, 2.92, 0.22], [0.11 * s, 2.3, 0.36], [0.1 * s, 1.5, 0.55], [0.16 * s, 0.6, 0.8]], 40, (t) => 0.06 + 0.03 * t, [1, 0, 0]), M.ribbon);
  for (let i = 0; i < 4; i++) { const x = -0.18 + i * 0.12; B.add(ribbon([[x, 2.95, -0.2], [x * 1.4, 2.3, -0.55], [x * 2.0, 1.3, -1.0], [x * 2.6, 0.3, -1.3]], 46, (t) => 0.05 + 0.04 * t, [1, 0, 0]), M.ribbon); }
  B.add(new THREE.CylinderGeometry(0.068, 0.078, 0.22, 18), M.skin, [0, 3.73, 0]);
  B.add(new THREE.TorusGeometry(0.1, 0.018, 8, 32), M.gold, [0, 3.64, 0], [Math.PI / 2 - 0.2, 0, 0], [1, 0.85, 1]);
  B.add(new THREE.TorusGeometry(0.038, 0.007, 6, 20), M.gold, [0, 3.46, 0.215], [-0.15, 0, 0]);
  B.add(new THREE.SphereGeometry(1, 16, 12), M.gem, [0, 3.46, 0.218], null, [0.032, 0.04, 0.018]);
  for (const s of [-1, 1]) {
    B.add(new THREE.TorusGeometry(0.12, 0.012, 6, 20, Math.PI * 0.9), M.gold, [0.3 * s, 3.5, 0], [0, s * Math.PI / 2, Math.PI * 0.55], [1, 0.7, 1]);
    B.add(new THREE.SphereGeometry(1, 20, 10, 0, TAU, 0, Math.PI * 0.6), M.sleeve, [0.34 * s, 3.48, 0], null, [0.14, 0.16, 0.13]);
  }
  B.build(body);

  // ---------- head: refined face, crown, circlet, earrings ----------
  const head = new THREE.Group(); head.position.set(0, 3.98, 0); body.add(head);
  const hg = new THREE.SphereGeometry(1, 40, 30), hp = hg.attributes.position;
  for (let i = 0; i < hp.count; i++) { let x = hp.getX(i), y = hp.getY(i), z = hp.getZ(i); if (y < -0.1) { const k = 1 - 0.3 * Math.pow((-y - 0.1) / 0.9, 1.4); x *= k; z *= lerp(1, k, 0.6); } hp.setXYZ(i, x * 0.2, y * 0.25, z * 0.215); }
  hg.computeVertexNormals();
  const Hd = part();
  Hd.add(hg, M.skin);
  const capG = new THREE.SphereGeometry(1, 40, 18, 0, TAU, 0, Math.PI * 0.55); capG.rotateX(-0.5);
  Hd.add(capG, M.hair, [0, 0.012, -0.012], null, [0.215, 0.265, 0.23]);
  for (const s of [-1, 1]) {
    Hd.add(new THREE.TorusGeometry(0.042, 0.0055, 6, 20, Math.PI * 0.82).rotateZ(Math.PI * 1.09), M.lid, [0.074 * s, 0.005, 0.188], [0, 0.32 * s, 0], [1, 0.5, 1]);
    Hd.add(new THREE.TorusGeometry(0.046, 0.0035, 5, 18, Math.PI * 0.7).rotateZ(Math.PI * 0.15), M.lid, [0.074 * s, 0.03, 0.186], [0, 0.32 * s, 0], [1, 0.45, 1]);
    for (let k = 0; k < 5; k++) Hd.add(new THREE.ConeGeometry(0.0045, 0.034 - k * 0.003, 5), M.lid, [s * (0.06 + k * 0.012), -0.012 - k * 0.002, 0.193 - k * 0.006], [0.25, 0, s * (2.35 + k * 0.16)]);
    Hd.add(new THREE.TorusGeometry(0.05, 0.004, 5, 18, Math.PI * 0.55).rotateZ(Math.PI * 0.22), M.brow, [0.076 * s, 0.085, 0.178], [0, 0.32 * s, -0.1 * s]);
    Hd.add(new THREE.TorusGeometry(0.022, 0.0045, 6, 16, Math.PI * 1.1).rotateZ(Math.PI * 0.95), M.gold, [0.205 * s, -0.11, 0.02]);
    Hd.add(new THREE.TorusGeometry(0.05, 0.006, 6, 16, Math.PI * 0.8).rotateZ(Math.PI * 0.1), M.gold, [0.17 * s, 0.13, -0.06], [0, s * 1.2, 0]);
  }
  Hd.add(new THREE.SphereGeometry(1, 14, 10), M.skin, [0, -0.045, 0.21], null, [0.016, 0.03, 0.016]);
  for (const s of [-1, 1]) Hd.add(new THREE.SphereGeometry(1, 12, 8), M.lip, [0.012 * s, -0.124, 0.198], [0, 0, s * 0.25], [0.02, 0.009, 0.01]);
  Hd.add(new THREE.SphereGeometry(1, 14, 8), M.lip, [0, -0.142, 0.195], null, [0.026, 0.011, 0.011]);
  Hd.add(new THREE.TorusGeometry(0.05, 0.008, 6, 18, Math.PI).rotateZ(Math.PI), M.gold, [0, 0.165, 0.19], [-0.3, 0, 0]);
  Hd.add(new THREE.SphereGeometry(1, 12, 10), M.gem, [0, 0.135, 0.205], null, [0.014, 0.024, 0.01]);
  for (const s of [-1, 1]) Hd.add(new THREE.SphereGeometry(0.008, 8, 6), M.gem, [0.03 * s, 0.17, 0.198]);
  Hd.add(new THREE.TorusGeometry(1, 0.055, 6, 48), M.gold, [0, 0.13, -0.04], [Math.PI / 2 - 0.3, 0, 0], [0.192, 0.182, 0.3]);
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; Hd.add(new THREE.SphereGeometry(1, 8, 6), M.gold, [Math.sin(a) * 0.196, 0.13 + Math.cos(a) * 0.058, Math.cos(a) * 0.186 - 0.04], [0, a, 0.6], [0.022, 0.009, 0.004]); }
  const crownG = new THREE.ExtrudeGeometry(crescentShape(0.17, 0.07, 0.15), { depth: 0.022, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2, curveSegments: 28 });
  crownG.translate(0, 0, -0.011); crownG.computeVertexNormals();
  Hd.add(crownG, M.gold, [0, 0.31, -0.05], [-0.25, 0, 0]);
  for (const s of [-1, 1]) Hd.add(new THREE.SphereGeometry(0.016, 10, 8), M.gem, [0.15 * s, 0.388, -0.07]);
  Hd.add(new THREE.SphereGeometry(1, 14, 10), M.gem, [0, 0.21, -0.03], null, [0.025, 0.032, 0.015]);
  for (let i = 0; i < 58; i++) {
    const front = i >= 42, az = front ? (i < 50 ? 1 : -1) * Math.PI * (0.42 + ((i - 42) % 8) * 0.04) : Math.PI * (0.55 + 0.9 * ((i) / 41));
    const len = front ? 1.0 + hr() * 0.3 : 1.9 + hr() * 0.7, ph = hr() * TAU, side = Math.sin(az);
    const p0 = [Math.sin(az) * 0.2, 0.1 + hr() * 0.08, Math.cos(az) * 0.205], pts = [p0];
    for (let k = 1; k <= 7; k++) {
      const s = k / 7;
      if (front) pts.push([p0[0] * (1 + s * 0.6) + Math.sin(s * 6 + ph) * 0.03, p0[1] - s * len, p0[2] + s * 0.22 + Math.cos(s * 5 + ph) * 0.03]);
      else pts.push([p0[0] * (1 + s * 1.7) + side * s * 0.25 + Math.sin(s * 6 + ph) * 0.07, p0[1] - s * len, p0[2] * (1 + s * 0.8) - s * 0.42 + Math.cos(s * 5 + ph) * 0.07]);
    }
    Hd.add(strand(pts, 26, 6, (t) => (front ? 0.035 : 0.046) * Math.pow(1 - t, 0.6) + 0.004), hr() < 0.65 ? M.hair : M.hair2);
  }
  Hd.build(head);
  const halo = new THREE.Group(); halo.position.set(0, 0.12, -0.38); head.add(halo);
  const haloG = new THREE.ExtrudeGeometry(crescentShape(0.7, 0.22, 0.6), { depth: 0.02, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.01, bevelSegments: 2, curveSegments: 48 });
  haloG.translate(0, -0.1, -0.01); haloG.computeVertexNormals();
  const Hl = part(); Hl.add(haloG, M.gold);
  const inner = []; for (let k = 0; k <= 30; k++) { const a = Math.atan2(-0.6, 0) + (k / 30 - 0.5) * 2.2; inner.push([Math.cos(a) * 0.62, 0.22 - 0.1 + Math.sin(a) * 0.6 * 1.0 + 0.0, 0.02]); }
  Hl.add(strand(inner, 40, 6, (t) => 0.008 * Math.sin(Math.PI * t) + 0.001), M.glowLine);
  Hl.build(halo);
  const haloStars = [];
  for (let k = 0; k < 7; k++) { const g = new THREE.Group(); halo.add(g); const P = part(); for (const sg of starGeo(0.05)) P.add(sg, M.gold); P.build(g); haloStars.push({ g, a: k / 7 * TAU }); }

  // ---------- arms: sheer bell sleeves, gold cuffs, ringed hands ----------
  const arms = [];
  for (const sd of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(0.36 * sd, 3.5, 0); body.add(sh);
    const el = new THREE.Group(); el.position.set(0, -0.64, 0); sh.add(el);
    const wr = new THREE.Group(); wr.position.set(0, -0.56, 0); el.add(wr);
    const A1 = part(); A1.add(strand([[0, 0.02, 0], [0, -0.32, 0.01], [0, -0.64, 0]], 14, 12, (t) => 0.058 - 0.012 * t), M.skin); A1.add(new THREE.SphereGeometry(0.06, 16, 12), M.skin); A1.build(sh);
    const A2 = part(); A2.add(strand([[0, 0, 0], [0, -0.28, 0.01], [0, -0.56, 0]], 14, 12, (t) => 0.046 - 0.01 * t), M.skin); A2.add(new THREE.SphereGeometry(0.047, 14, 10), M.skin);
    A2.add(new THREE.TorusGeometry(0.044, 0.01, 8, 24), M.gold, [0, -0.5, 0], [Math.PI / 2, 0, 0]); A2.add(new THREE.TorusGeometry(0.046, 0.005, 6, 24), M.gold, [0, -0.46, 0], [Math.PI / 2, 0, 0]); A2.build(el);
    const SL = part();
    SL.add(lathe([[0.34, -0.9], [0.28, -0.62], [0.17, -0.3], [0.085, -0.05], [0.066, 0.12]], 40, (r, y, a) => r + 0.018 * Math.sin(7 * a + y * 3)), M.sleeve);
    SL.add(new THREE.TorusGeometry(0.33, 0.008, 6, 48), M.gold, [0, -0.89, 0], [Math.PI / 2, 0, 0]);
    SL.build(el);
    const Hn = part();
    Hn.add(new THREE.SphereGeometry(1, 16, 12), M.skin, [0, -0.05, 0], null, [0.028, 0.06, 0.048]);
    for (let f = 0; f < 4; f++) {
      const z = 0.03 - f * 0.02, b = [0, -0.1, z], m = [sd * -0.006, -0.145, z * 1.04], tip = [sd * -0.02, -0.19, z * 1.08];
      Hn.add(strand([b, m], 6, 7, (t) => 0.0115 - 0.002 * t), M.skin); Hn.add(strand([m, tip], 6, 7, (t) => 0.0095 - 0.003 * t), M.skin);
      Hn.add(new THREE.SphereGeometry(0.0105, 8, 6), M.skin, m);
      if (f === 1 || f === 3) Hn.add(new THREE.TorusGeometry(0.012, 0.003, 5, 12), M.gold, [b[0] + (m[0] - b[0]) * 0.4, b[1] + (m[1] - b[1]) * 0.4, z], [Math.PI / 2, 0, 0]);
    }
    Hn.add(strand([[-sd * 0.015, -0.05, 0.04], [-sd * 0.03, -0.09, 0.06], [-sd * 0.035, -0.125, 0.07]], 8, 7, (t) => 0.012 - 0.004 * t), M.skin);
    Hn.build(wr);
    arms.push({ sh, el, wr, sd });
  }

  // ---------- wings: painted luna-moth wings that bend as they flap, with a glow layer ----------
  const wingRoot = new THREE.Group(); wingRoot.position.set(0, 3.35, -0.26); body.add(wingRoot);
  const wings = [];
  for (const sd of [-1, 1]) {
    const side = new THREE.Group(); side.scale.x = sd; wingRoot.add(side);
    const fore = new THREE.Group(); fore.rotation.z = 0.18; side.add(fore);
    const fg = new THREE.PlaneGeometry(2.4, 2.4, 16, 16);
    const fm = new THREE.Mesh(fg, M.wingF); fm.position.set(1.125, 0.206, 0); fm.renderOrder = 2; fore.add(fm);
    const fgl = new THREE.Mesh(fg, M.wingFG); fgl.position.set(1.125, 0.206, 0.006); fgl.renderOrder = 3; fore.add(fgl);
    const hind = new THREE.Group(); hind.position.set(0, -0.18, -0.03); hind.rotation.z = -0.22; side.add(hind);
    const hgeo = new THREE.PlaneGeometry(2.0, 3.0, 14, 20);
    const hm = new THREE.Mesh(hgeo, M.wingH); hm.position.set(0.9375, -1.344, 0); hm.renderOrder = 2; hind.add(hm);
    const hgl = new THREE.Mesh(hgeo, M.wingHG); hgl.position.set(0.9375, -1.344, 0.006); hgl.renderOrder = 3; hind.add(hgl);
    wings.push({ side, fore, hind, sd });
  }

  // ---------- light and magic around her ----------
  const spr = (map, color, sc, order) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); s.scale.setScalar(sc); s.renderOrder = order || 4; return s; };
  const haloGlow = spr(glowT, 0xfff2cf, 2.2); halo.add(haloGlow);
  const moonDisc = spr(moonTex, 0xdfe8ff, 4.2, 1); moonDisc.position.set(0, 3.95, -1.6); body.add(moonDisc);
  const moonRing = spr(ringT, 0xcfdcff, 5.2, 1); moonRing.position.copy(moonDisc.position); body.add(moonRing);
  const handGlow = arms.map((a) => { const s = spr(glowT, 0xdfe8ff, 0.5, 5); s.position.set(0, -0.12, 0); a.wr.add(s); return s; });
  const NMo = 80, moP = new Float32Array(NMo * 3), moC = new Float32Array(NMo * 3), moS = [];
  for (let i = 0; i < NMo; i++) moS.push([hr() * TAU, 0.6 + hr() * 1.4, hr() * 4.6, 0.2 + hr() * 0.5, hr()]);
  const moG = new THREE.BufferGeometry(); moG.setAttribute('position', new THREE.BufferAttribute(moP, 3)); moG.setAttribute('color', new THREE.BufferAttribute(moC, 3));
  const motes = new THREE.Points(moG, new THREE.PointsMaterial({ size: 0.1, map: glowT, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  motes.frustumCulled = false; motes.renderOrder = 5; body.add(motes);
  const ND = 110, dP = new Float32Array(ND * 3), dC = new Float32Array(ND * 3), dS = [];
  for (let i = 0; i < ND; i++) dS.push([hr() < 0.5 ? -1 : 1, 0.3 + hr() * 1.9, hr() * 1.6 - 1.4, hr(), 0.15 + hr() * 0.25]);
  const dG = new THREE.BufferGeometry(); dG.setAttribute('position', new THREE.BufferAttribute(dP, 3)); dG.setAttribute('color', new THREE.BufferAttribute(dC, 3));
  const dust = new THREE.Points(dG, new THREE.PointsMaterial({ size: 0.06, map: glowT, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  dust.frustumCulled = false; dust.renderOrder = 5; wingRoot.add(dust);
  const fx = new THREE.Group(); const light = new THREE.PointLight(0xdfe8ff, 0, 10, 2); fx.add(light);
  const orb = new THREE.Group(); orb.position.set(0, 5.05, 0.3); body.add(orb);
  orb.add(new THREE.Mesh(new THREE.SphereGeometry(1, 32, 22), new THREE.MeshBasicMaterial({ map: moonSurf, color: 0xffffff })));
  const orbGlow = spr(glowT, 0xcfe0ff, 4.0, 6); orb.add(orbGlow);
  const orbRings = [spr(ringT, 0xe6eeff, 3.0, 7), spr(ringT, 0xbfd6ff, 3.8, 7)]; orbRings.forEach((r) => orb.add(r));
  orb.scale.setScalar(1e-4);

  // ---------- fading ----------
  const allMats = [];
  root.traverse((o) => { if (o.material && !allMats.some((q) => q.m === o.material)) { o.material.transparent = true; allMats.push({ m: o.material, op: o.material.opacity }); } });
  let lastFade = -1;
  function setFade(f) {
    if (Math.abs(f - lastFade) < 1e-3) return; lastFade = f;
    for (const q of allMats) q.m.opacity = q.op * f;
    root.visible = f > 0.002;
  }

  // ---------- animation: hidden, rise (wings unfurl at the end), idle, charge, release, leave ----------
  let mode = 'hidden', mt = 0, mdur = 1;
  const P = { lift: -2.8, fade: 0, up: 0, fwd: 0, orb: 0, glow: 0, look: 0.14, open: 0, bow: 0 };
  function go(m, dur) { mode = m; mt = 0; mdur = dur || 1; }
  const _p = new THREE.Vector3();
  function update(t, dt) {
    U.uTime.value = t;
    mt += dt; const u = Math.min(1, mt / mdur);
    const T = { lift: 0, fade: 1, up: 0, fwd: 0, orb: 0, glow: 1, look: 0.14, open: 1, bow: 0 };
    if (mode === 'hidden') { T.fade = 0; T.lift = -2.8; T.glow = 0; T.open = 0; }
    else if (mode === 'rise') { T.fade = sm(0, 0.5, u); T.lift = lerp(-2.8, 0, 1 - Math.pow(1 - u, 3)); T.glow = 1.5 - 0.5 * u; T.open = sm(0.72, 1, u); T.look = lerp(0.35, 0.14, u); if (u >= 1) go('idle'); }
    else if (mode === 'charge') { T.up = sm(0, 0.35, u); T.orb = sm(0.15, 1, u); T.glow = 1 + 0.7 * u; T.look = lerp(0.14, -0.32, sm(0, 0.4, u)); }
    else if (mode === 'release') { T.up = 1 - sm(0, 0.5, u); T.fwd = sm(0, 0.35, u) * (1 - sm(0.7, 1, u)); T.glow = 1.6 - 0.6 * u; T.look = 0; if (u >= 1) go('idle'); }
    else if (mode === 'leave') { T.fade = 1 - sm(0.25, 1, u); T.lift = lerp(0, -2.2, sm(0.3, 1, u)); T.glow = 1 - u; T.open = 1 - sm(0, 0.5, u); T.bow = sm(0, 0.3, u); T.look = 0.4; if (u >= 1) go('hidden'); }
    const k = 1 - Math.exp(-dt * 7);
    for (const key in T) P[key] += (T[key] - P[key]) * (mode === 'rise' || mode === 'leave' ? 1 : k);
    setFade(P.fade);
    light.intensity = 1.0 * P.glow * P.fade;
    if (!root.visible) return;
    light.position.set(root.position.x, root.position.y + 1.2, root.position.z + 5.0);
    body.position.y = P.lift + 0.08 * Math.sin(t * 0.9);
    body.rotation.x = P.bow * 0.22;
    for (const a of arms) {
      a.sh.rotation.set(lerp(lerp(lerp(-0.15, -2.7, P.up), -1.45, P.fwd), -0.6, P.bow), 0, a.sd * lerp(lerp(0.5, 0.3, P.up), 0.12, P.fwd) + a.sd * 0.04 * Math.sin(t * 1.1));
      a.el.rotation.x = lerp(lerp(lerp(-0.4, -0.25, P.up), -0.05, P.fwd), -1.2, P.bow);
      a.wr.rotation.x = lerp(0.25, -0.3, P.up);
    }
    head.rotation.set(P.look + 0.03 * Math.sin(t * 0.7), 0.05 * Math.sin(t * 0.4), 0);
    const f = Math.sin(t * 2.1), op = P.open;
    U.uBend.value = (0.12 + 0.18 * f) * op;
    for (const w of wings) {
      w.side.rotation.y = w.sd * lerp(1.25, 0.32 + 0.22 * f, op);
      w.side.scale.set(w.sd * lerp(0.55, 1, op), lerp(0.55, 1, op), 1);
      w.fore.rotation.x = 0.06 * f; w.hind.rotation.y = 0.12 * Math.sin(t * 2.1 - 0.6);
    }
    haloStars.forEach((s, i) => { const a = s.a + t * 0.35; s.g.position.set(Math.cos(a) * 0.82, -0.1 + Math.sin(a) * 0.8, 0.05); s.g.rotation.z = t * 1.5 + i; s.g.scale.setScalar(0.8 + 0.25 * Math.sin(t * 3 + i)); });
    const pulse = 1 + 0.06 * Math.sin(t * 6);
    orb.scale.setScalar(1e-4 + P.orb * 0.62 * pulse); orb.rotation.y = t * 0.6;
    orbRings[0].material.rotation = t * 1.2; orbRings[1].material.rotation = -t * 0.8;
    haloGlow.material.opacity = 0.55 * P.glow * P.fade; moonDisc.material.opacity = 0.42 * P.fade; moonRing.material.opacity = 0.25 * P.fade * (0.8 + 0.2 * Math.sin(t * 1.3)); moonRing.material.rotation = t * 0.05;
    for (const g of handGlow) { g.material.opacity = (0.35 + 0.65 * P.up) * P.fade; g.scale.setScalar(0.45 + 0.5 * P.up); }
    for (let i = 0; i < NMo; i++) {
      const s = moS[i], age = (t * s[3] * 0.25 + s[4]) % 1, ang = s[0] + t * 0.3 * (i % 2 ? 1 : -1);
      moP[i * 3] = Math.cos(ang) * s[1]; moP[i * 3 + 1] = (s[2] + age * 1.5) % 4.8; moP[i * 3 + 2] = Math.sin(ang) * s[1] * 0.7;
      const kk = Math.sin(Math.PI * age) * P.fade; moC[i * 3] = 0.85 * kk; moC[i * 3 + 1] = 0.9 * kk; moC[i * 3 + 2] = kk;
    }
    for (let i = 0; i < ND; i++) {
      const s = dS[i], age = (t * s[4] + s[3]) % 1;
      dP[i * 3] = s[0] * (s[1] * op + 0.1) + Math.sin(t + i) * 0.05; dP[i * 3 + 1] = s[2] - age * 1.6; dP[i * 3 + 2] = -0.2 * op + Math.cos(t * 0.7 + i) * 0.05;
      const kk = Math.sin(Math.PI * age) * P.fade * op; dC[i * 3] = 0.7 * kk; dC[i * 3 + 1] = kk; dC[i * 3 + 2] = 0.85 * kk;
    }
    moG.attributes.position.needsUpdate = true; moG.attributes.color.needsUpdate = true; dG.attributes.position.needsUpdate = true; dG.attributes.color.needsUpdate = true;
  }
  return {
    root, fx, update, moonTex,
    get fade() { return P.fade; }, get mode() { return mode; }, get prog() { return Math.min(1, mt / mdur); },
    show() { mode = 'idle'; P.fade = 1; P.lift = 0; P.open = 1; setFade(1); }, hide() { mode = 'hidden'; P.fade = 0; P.lift = -2.8; P.open = 0; setFade(0); },
    appear(d) { go('rise', d); }, charge(d) { go('charge', d); }, release(d) { go('release', d); }, leave(d) { go('leave', d); },
    orbPos(out) { return orb.getWorldPosition(out || _p); }, headPos(out) { return head.getWorldPosition(out || _p); }
  };
}
