// ranger.js: the Ranger of the Moon Faire (bow, sword and knives; her magic strengthens her own attacks). Built on the code of the Jester (models/jester-3d).
// Code-built three.js r128 model (global THREE). Defines makeJester(opts) only.
// Units are meters, Y up, feet on y = 0. She faces +Z (the audience); her left is +X, which is also the side her
// spells fly to, as in her sprite sheets (the target stands at screen right).
// Interface (the same Model Build Spec as Io and Sol): root, fx, skeleton, bones, animate(phase, wb, t, dt),
// play(name, force), ACTIONS (dur, hits, cues), anchor(name, out), state, setFade(f), reset(), busy, action, progress.
function makeIo(opts) {
  'use strict';
  opts = opts || {};
  // detail 0.5 to 1 scales segment counts and cloth resolution for slower phones
  const LOD = opts.lod || {};
  const DET = Math.max(LOD.minDetail || 0.5, Math.min(1, opts.detail == null || !Number.isFinite(+opts.detail) ? 1 : +opts.detail));
  const Q = (n, min) => (DET >= 1 ? n : Math.max(min || 3, Math.round(n * DET)));
  const TAU = Math.PI * 2, PI = Math.PI, DEG = Math.PI / 180;
  let seed = 4242;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const rr = (a, b) => a + (b - a) * rnd();
  const cl = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const sm = (e0, e1, x) => { const u = cl((x - e0) / (e1 - e0), 0, 1); return u * u * (3 - 2 * u); };
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  // value noise (deterministic)
  const h1 = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const h2 = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
  function vnoise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    return lerp(lerp(h2(xi, yi), h2(xi + 1, yi), u), lerp(h2(xi, yi + 1), h2(xi + 1, yi + 1), u), v);
  }
  const fbm = (x, y) => vnoise(x, y) * 0.5 + vnoise(x * 2.03, y * 2.03) * 0.25 + vnoise(x * 4.01, y * 4.01) * 0.125 + vnoise(x * 8.1, y * 8.1) * 0.0625;
  // piecewise-linear lookup through [[x, v], ...] (v a number or an array), smooth between keys
  function prof(keys, x, smooth) {
    if (keys[0][0] > keys[keys.length - 1][0]) keys = keys._rev || (keys._rev = keys.slice().reverse());
    if (x <= keys[0][0]) return keys[0][1];
    const n = keys.length;
    if (x >= keys[n - 1][0]) return keys[n - 1][1];
    let i = 1; while (keys[i][0] < x) i++;
    let u = (x - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0]);
    if (smooth) u = u * u * (3 - 2 * u);
    const a = keys[i - 1][1], b = keys[i][1];
    if (typeof a === 'number') return a + (b - a) * u;
    return a.map((v, k) => v + (b[k] - v) * u);
  }
  // Catmull-Rom through numbers at uniform spacing; ps = [p0, p1, ...], x in 0..n-1
  function crom(ps, x) {
    const n = ps.length; x = cl(x, 0, n - 1);
    const i = Math.min(n - 2, Math.floor(x)), u = x - i;
    const p0 = ps[Math.max(0, i - 1)], p1 = ps[i], p2 = ps[i + 1], p3 = ps[Math.min(n - 1, i + 2)];
    return 0.5 * ((2 * p1) + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u);
  }
  const TEXLIST = [];
  const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  // a smooth curve through [[x, v], ...] (x rising; v a number or a list), with no flat spots at the keys
  const spline = (K, x) => {
    const n = K.length; let i = 0; while (i < n - 2 && K[i + 1][0] < x) i++;
    const x0 = K[i][0], x1 = K[i + 1][0], dx = x1 - x0, t = cl((x - x0) / dx, 0, 1), t2 = t * t, t3 = t2 * t;
    const one = (c) => { const g = (j) => (c == null ? K[j][1] : K[j][1][c]), v0 = g(i), v1 = g(i + 1);
      const m0 = i > 0 ? (v1 - g(i - 1)) / (x1 - K[i - 1][0]) : (v1 - v0) / dx, m1 = i < n - 2 ? (g(i + 2) - v0) / (K[i + 2][0] - x0) : (v1 - v0) / dx;
      return (2 * t3 - 3 * t2 + 1) * v0 + (t3 - 2 * t2 + t) * dx * m0 + (-2 * t3 + 3 * t2) * v1 + (t3 - t2) * dx * m1; };
    return typeof K[0][1] === 'number' ? one(null) : K[0][1].map((v, c) => one(c));
  };
  const ctex = (c, rx, ry, srgb) => {
    const t = new THREE.CanvasTexture(c); TEXLIST.push(t);
    if (rx) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry || rx); }
    t.anisotropy = 4; if (srgb !== false) t.encoding = THREE.sRGBEncoding; return t;
  };
  const TEXS = Math.max(0.25, Math.min(1, opts.textureScale == null ? 1 : +opts.textureScale)); // canvas size scale

  // ---------- palette, sampled from her sprite sheets ----------
  const PAL = {
    skin: '#fccfb0', skinSh: '#d39a84', blush: '#e88f88', lip: '#b02c46',
    black: '#141016', soft: '#231c26', char: '#2e2630',
    wine: '#7a1f43', wineDk: '#4c1029', magenta: '#b8407e', rose: '#d2617f',
    gold: '#d6a84e', goldHi: '#f5d98a', goldDk: '#8f6a25', orange: '#d98a3a',
    olive: '#6f5a2a', oliveHi: '#9a8040', oliveDk: '#3c3018',
    purple: '#7a4298', purpleHi: '#9c66ba', purpleDk: '#3c1e54', lace: '#63305e', laceHi: '#864a80',
    teal: '#3fc2b4', tealDk: '#1d7f86', white: '#e9e4ee', violet: '#b35cff', spell: '#d58bff'
  };
  // ---------- Io's proportion tables (written by tools/tables.py from her paintings; edit them there) ----------
  const IO_TY0 = 0.86, IO_TY1 = 1.405, IO_TPW = 2.25;
  const IO_TORSO = [[0.86, [0.181, 0.095, -0.115]], [0.88, [0.18, 0.093, -0.125]], [0.92, [0.172, 0.088, -0.129]], [0.96, [0.155, 0.093, -0.118]], [1.0, [0.132, 0.094, -0.09]], [1.04, [0.106, 0.091, -0.063]], [1.07, [0.094, 0.088, -0.051]], [1.1, [0.0905, 0.082, -0.048]], [1.13, [0.097, 0.084, -0.051]], [1.16, [0.106, 0.086, -0.06]], [1.2, [0.114, 0.082, -0.073]], [1.25, [0.12, 0.078, -0.086]], [1.29, [0.128, 0.064, -0.089]], [1.32, [0.132, 0.046, -0.086]], [1.34, [0.098, 0.036, -0.08]], [1.356, [0.066, 0.031, -0.076]], [1.37, [0.05, 0.029, -0.074]], [1.385, [0.043, 0.027, -0.073]], [1.405, [0.04, 0.025, -0.072]]];
  const IO_BUST = {"amp": 0.033, "x": 0.058, "y": 1.222, "sx": 0.044, "sy": 0.05, "dip": 0.004, "dipx": 0.016, "dipy": 1.245, "dipsy": 0.045};
  const IO_LEG = [[0.975, [0.066, 0.07, 0.07, 0.078, -0.012]], [0.93, [0.078, 0.082, 0.084, 0.084, -0.012]], [0.89, [0.087, 0.09, 0.096, 0.088, -0.01]], [0.84, [0.091, 0.094, 0.098, 0.091, -0.002]], [0.8, [0.089, 0.092, 0.092, 0.089, 0.007]], [0.76, [0.0815, 0.0885, 0.0885, 0.0875, 0.008]], [0.72, [0.0725, 0.084, 0.084, 0.0855, 0.007]], [0.68, [0.0645, 0.075, 0.075, 0.0835, 0.007]], [0.64, [0.0595, 0.065, 0.065, 0.082, 0.009]], [0.6, [0.056, 0.0595, 0.0595, 0.081, 0.0095]], [0.56, [0.052, 0.055, 0.055, 0.081, 0.002]], [0.52, [0.052, 0.0545, 0.0545, 0.082, -0.009]], [0.48, [0.057, 0.058, 0.058, 0.083, -0.016]], [0.44, [0.058, 0.059, 0.059, 0.084, -0.0165]], [0.4, [0.054, 0.055, 0.055, 0.084, -0.015]], [0.36, [0.047, 0.049, 0.049, 0.083, -0.012]], [0.3, [0.042, 0.046, 0.046, 0.082, -0.01]]];
  const IO_KNEE_Y = 0.57, IO_HIP_Y = 0.935, IO_SHOULDER = [0.119, 1.285, -0.018];
  const IO_SKIRT = [[1.06, [0.097, 0.08, 0.019]], [1.02, [0.126, 0.099, 0.008]], [0.98, [0.152, 0.117, -0.006]], [0.94, [0.175, 0.132, -0.017]], [0.9, [0.193, 0.142, -0.019]], [0.85, [0.208, 0.156, -0.022]], [0.8, [0.214, 0.163, -0.022]], [0.75, [0.226, 0.175, -0.024]], [0.7, [0.228, 0.188, -0.024]], [0.65, [0.238, 0.186, -0.025]], [0.6, [0.248, 0.196, -0.026]], [0.55, [0.254, 0.201, -0.028]], [0.5, [0.262, 0.198, -0.028]], [0.45, [0.268, 0.21, -0.03]], [0.4, [0.264, 0.213, -0.03]], [0.35, [0.27, 0.214, -0.03]], [0.3, [0.27, 0.218, -0.032]], [0.25, [0.262, 0.226, -0.034]], [0.2, [0.25, 0.212, -0.034]], [0.15, [0.236, 0.2, -0.034]]], IO_SKIRT_CZ = -0.015;
  const IO_SLIT_TOP = 0.93, IO_SLIT_MID = 0.37, IO_SLIT_W = [[0.93, 0.0], [0.85, 0.16], [0.7, 0.36], [0.5, 0.52], [0.3, 0.62], [0.15, 0.66]];

  // ---------- skeleton: every bone rests unrotated, so a rest position is all a bone needs ----------
  const bones = [], BI = {}, SK = {};
  function addBone(name, parent, x, y, z) {
    const b = new THREE.Bone(); b.name = name; b.userData.rest = V3(x, y, z);
    const p = parent ? SK[parent] : null;
    if (p) { b.position.copy(b.userData.rest).sub(p.userData.rest); p.add(b); } else b.position.set(x, y, z);
    b.userData.home = b.position.clone();
    SK[name] = b; BI[name] = bones.length; bones.push(b); return b;
  }
  // ---------- soft chains: her hair and her skirt hang from short chains of bones that swing after her (stepped in I99_static.js) ----------
  // A chain is a row of points from its root down to its tip. Each stretch between two points is a bone; the first hangs from a body bone.
  const CHAINS = [];
  function addChain(grp, id, parent, pts, o) {
    const names = []; let par = parent;
    for (let k = 0; k < pts.length - 1; k++) { const nm = id + '_' + k; addBone(nm, par, pts[k].x, pts[k].y, pts[k].z); names.push(nm); par = nm; }
    const ch = Object.assign({ grp, id, parent, names, pts }, o || {}); CHAINS.push(ch); return ch;
  }
  // the bones that carry a point at height y on a chain: the stretch it lies on, shared with the next stretch near each joint so the bend is round
  function chainW(ch, y) {
    const Y = ch.ys || (ch.ys = ch.pts.map((p) => p.y)), n = ch.names.length, par = BI[ch.parent];
    if (y >= Y[0]) return [par, 1];
    let k = 0; while (k < n - 1 && y < Y[k + 1]) k++;
    const t = (Y[k] - y) / (Y[k] - Y[k + 1]);
    if (t < 0.5) return [k > 0 ? BI[ch.names[k - 1]] : par, 0.5 - t, BI[ch.names[k]], 0.5 + t];
    if (k === n - 1) return [BI[ch.names[k]], 1];
    return [BI[ch.names[k]], 1.5 - t, BI[ch.names[k + 1]], t - 0.5];
  }
  // two lists of [bone, weight, ...] mixed: (1 - f) of a and f of b; at most four bones are kept
  function mixW(a, b, f) {
    const m = new Map();
    for (let i = 0; i < a.length; i += 2) m.set(a[i], (m.get(a[i]) || 0) + a[i + 1] * (1 - f));
    for (let i = 0; i < b.length; i += 2) m.set(b[i], (m.get(b[i]) || 0) + b[i + 1] * f);
    const l = []; m.forEach((w, bi) => { if (w > 1e-4) l.push([bi, w]); }); l.sort((p, q) => q[1] - p[1]);
    const out = []; for (const [bi, w] of l.slice(0, 4)) out.push(bi, w); return out;
  }
  const A_POSE = 15 * DEG;                       // arms rest this far out from straight down
  const L_UARM = 0.232, L_FARM = 0.212;          // Io's painted arms are about 2.5 cm shorter than the Jester's
  const L_THIGH = IO_HIP_Y - IO_KNEE_Y, L_SHIN = IO_KNEE_Y - 0.105;      // Io: hip joint 0.935, knee 0.57 (the Jester's are 0.835 and 0.47)
  addBone('hips', null, 0, IO_HIP_Y + 0.025, 0);
  addBone('spine1', 'hips', 0, 1.03, 0.004);
  addBone('spine2', 'spine1', 0, 1.115, 0.004);
  addBone('spine3', 'spine2', 0, 1.20, -0.002);
  addBone('neck', 'spine3', 0, 1.335, -0.012);
  addBone('head', 'neck', 0, 1.405, -0.004);
  const SIDES = [['R', -1], ['L', 1]];
  const armDir = {}, restPts = {};
  for (const [S, s] of SIDES) {
    const d = V3(s * Math.sin(A_POSE), -Math.cos(A_POSE), 0); armDir[S] = d;
    const sh = V3(s * IO_SHOULDER[0], IO_SHOULDER[1], IO_SHOULDER[2]), el = sh.clone().addScaledVector(d, L_UARM), wr = el.clone().addScaledVector(d, L_FARM);
    restPts['sh' + S] = sh; restPts['el' + S] = el; restPts['wr' + S] = wr;
    addBone('clav' + S, 'spine3', s * 0.035, 1.295, 0);
    addBone('uarm' + S, 'clav' + S, sh.x, sh.y, sh.z);
    addBone('farm' + S, 'uarm' + S, el.x, el.y, el.z);
    addBone('hand' + S, 'farm' + S, wr.x, wr.y, wr.z);
    { const m = el.clone().addScaledVector(d, 0.10); addBone('ftw' + S, 'farm' + S, m.x, m.y, m.z); }       // the turn of her forearm: when her hand turns over, most of the turn is spread along the forearm, as the two bones of a real forearm do it
    addBone('thigh' + S, 'hips', s * 0.085, IO_HIP_Y, 0);
    addBone('shin' + S, 'thigh' + S, s * 0.083, IO_KNEE_Y, 0.006);
    addBone('foot' + S, 'shin' + S, s * 0.081, 0.105, -0.012);
    addBone('toe' + S, 'foot' + S, s * 0.081, 0.035, 0.088);
  }
  // a point of the canonical right hand (fingers along -Y, palm toward +X, thumb toward +Z), placed on either wrist
  const HAND_S = opts.handScale || 0.93;         // Chris: the hands a little smaller (November 11); everything of the hand is placed through handPt, so it all shrinks about the wrist
  function handPt(s, x, y, z, out) {
    x *= HAND_S; y *= HAND_S; z *= HAND_S;
    const c = Math.cos(s * A_POSE), sn = Math.sin(s * A_POSE), mx = -s * x;   // mirror for the left hand
    const w = restPts['wr' + (s < 0 ? 'R' : 'L')];
    return (out || V3()).set(w.x + mx * c - y * sn, w.y + mx * sn + y * c, w.z + z);
  }
  // a direction of the canonical hand, turned onto either wrist
  function handDir(s, x, y, z, out) {
    const c = Math.cos(s * A_POSE), sn = Math.sin(s * A_POSE), mx = -s * x;
    return (out || V3()).set(mx * c - y * sn, mx * sn + y * c, z);
  }
  // fingers: [name, knuckle z, knuckle y, length from the knuckle, radius, splay (radians toward the thumb), knuckle-to-web distance]
  // read off the young-hand painting: 1 pixel = 0.2366 mm, the middle finger's axis at z 0.0085, its web at y -0.089.
  // The knuckle joints sit inside the back of the hand, a little above the webs, as on a real hand.
  const FINGERS = [['idx', 0.0291, -0.0725, 0.0916, 0.0073, 1.5 * DEG, 0.013], ['mid', 0.0085, -0.0760, 0.0970, 0.0071, 0, 0.013], ['rng', -0.0100, -0.0725, 0.0897, 0.0067, -1.6 * DEG, 0.013], ['pnk', -0.0282, -0.0709, 0.0633, 0.0058, -5.0 * DEG, 0.011]];
  const PHAL = [0.50, 0.255, 0.245];
  const fingerDir = (a) => [0, -Math.cos(a), Math.sin(a)];
  // the thumb's first bone lies inside the heel of the hand, from the wrist to where the thumb comes free
  const THUMB = { base: [0.008, -0.0062, 0.0286], dir: [0.12, -0.92, 0.37], len: [0.0432, 0.0310, 0.0256], r: 0.0077, roll: 60 * DEG };
  for (const [S, s] of SIDES) {
    for (const [fn, fz, fy, fl, fr, fa] of FINGERS) {
      let par = 'hand' + S, t = 0; const fd = fingerDir(fa);
      for (let k = 0; k < 3; k++) { const p = handPt(s, 0, fy + fd[1] * t, fz + fd[2] * t); addBone(fn + k + S, par, p.x, p.y, p.z); par = fn + k + S; t += fl * PHAL[k]; }
    }
    const td = V3(...THUMB.dir).normalize(); let tp = V3(...THUMB.base), par = 'hand' + S;
    for (let k = 0; k < 3; k++) { const p = handPt(s, tp.x, tp.y, tp.z); addBone('thb' + k + S, par, p.x, p.y, p.z); par = 'thb' + k + S; tp = tp.clone().addScaledVector(td, THUMB.len[k]); }
  }

  // ---------- geometry buckets: every piece is weighted to bones, then merged into one skinned mesh per material ----------
  const buckets = {};
  const bucket = (key) => buckets[key] || (buckets[key] = { pos: [], nor: [], uv: [], si: [], sw: [], idx: [], n: 0 });
  const wOne = (name) => { const a = [BI[name], 1]; return () => a; };
  function computeNormals(pos, idx, weld) {
    const n = pos.length / 3, nor = new Float32Array(n * 3);
    for (let i = 0; i < idx.length; i += 3) {
      const a = idx[i] * 3, b = idx[i + 1] * 3, c = idx[i + 2] * 3;
      const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
      const vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      nor[a] += nx; nor[a + 1] += ny; nor[a + 2] += nz; nor[b] += nx; nor[b + 1] += ny; nor[b + 2] += nz; nor[c] += nx; nor[c + 1] += ny; nor[c + 2] += nz;
    }
    if (weld !== false) {                         // seams and caps share positions: share their normals too
      const map = new Map();
      for (let i = 0; i < n; i++) {
        const k = Math.round(pos[i * 3] * 20000) + ',' + Math.round(pos[i * 3 + 1] * 20000) + ',' + Math.round(pos[i * 3 + 2] * 20000);
        const e = map.get(k); if (e) e.push(i); else map.set(k, [i]);
      }
      for (const g of map.values()) if (g.length > 1) {
        let x = 0, y = 0, z = 0; for (const i of g) { x += nor[i * 3]; y += nor[i * 3 + 1]; z += nor[i * 3 + 2]; }
        for (const i of g) { nor[i * 3] = x; nor[i * 3 + 1] = y; nor[i * 3 + 2] = z; }
      }
    }
    for (let i = 0; i < n; i++) {
      const l = Math.hypot(nor[i * 3], nor[i * 3 + 1], nor[i * 3 + 2]) || 1;
      nor[i * 3] /= l; nor[i * 3 + 1] /= l; nor[i * 3 + 2] /= l;
    }
    return nor;
  }
  // part = { pos: [x,y,z,...], uv: [u,v,...], idx: [...] }; wf(x, y, z, i) -> [bone, weight, ...] (up to 4 pairs)
  // o.out: a point the surface should face away from (winding is fixed to match); o.flip: reverse the winding
  function addPart(key, part, wf, o) {
    o = o || {};
    if (LOD.skip && LOD.skip[key]) return { key, start: 0, count: 0 };
    const srcKey = key; if (LOD.merge && LOD.merge[key]) key = LOD.merge[key];
    const B = bucket(key), pos = part.pos, n = pos.length / 3; let idx = part.idx;
    (B.src || (B.src = [])).push([B.n, n, srcKey]);
    let nor = o.nor || computeNormals(pos, idx, o.weld);            // o.nor: normals worked out by the caller
    let flip = !!o.flip;
    if (o.out) {
      let s = 0; const c = o.out;
      for (let i = 0; i < n; i++) s += nor[i * 3] * (pos[i * 3] - c.x) + nor[i * 3 + 1] * (pos[i * 3 + 1] - c.y) + nor[i * 3 + 2] * (pos[i * 3 + 2] - c.z);
      if (s < 0) flip = !flip;
    }
    if (flip) { idx = idx.slice(); for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; } for (let i = 0; i < nor.length; i++) nor[i] = -nor[i]; }
    const base = B.n;
    for (let i = 0; i < n; i++) {
      const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
      B.pos.push(x, y, z); B.nor.push(nor[i * 3], nor[i * 3 + 1], nor[i * 3 + 2]);
      B.uv.push(part.uv ? part.uv[i * 2] : 0, part.uv ? part.uv[i * 2 + 1] : 0);
      const w = wf(x, y, z, i); let s = 0;
      for (let k = 1; k < w.length; k += 2) s += w[k];
      for (let k = 0; k < 4; k++) { B.si.push(k * 2 < w.length ? w[k * 2] : 0); B.sw.push(k * 2 < w.length ? w[k * 2 + 1] / s : 0); }
    }
    for (let i = 0; i < idx.length; i++) B.idx.push(idx[i] + base);
    B.n += n;
    return { key, start: base, count: n };
  }
  // a loft through rings of points ([x,y,z] each); the seam column is doubled so u can run 0..1
  function loft(rings, o) {
    o = o || {};
    const m = rings.length, n = rings[0].length, open = !!o.open, cols = open ? n : n + 1;
    const pos = [], uv = [], idx = [];
    for (let i = 0; i < m; i++) for (let j = 0; j < cols; j++) {
      const p = rings[i][j % n]; pos.push(p[0], p[1], p[2]);
      uv.push((o.u0 || 0) + (o.uS == null ? 1 : o.uS) * (j / (cols - 1)), o.v ? o.v[i] : (o.v0 || 0) + (o.vS == null ? 1 : o.vS) * (i / (m - 1)));
    }
    for (let i = 0; i < m - 1; i++) for (let j = 0; j < cols - 1; j++) {
      const a = i * cols + j, b = a + 1, c = a + cols, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
    const cap = (i, rev) => {
      let cx = 0, cy = 0, cz = 0; for (const p of rings[i]) { cx += p[0]; cy += p[1]; cz += p[2]; }
      const k = pos.length / 3; pos.push(cx / n, cy / n, cz / n); uv.push(0.5, o.v ? o.v[i] : i / (m - 1));
      for (let j = 0; j < n; j++) { const a = i * cols + j, b = i * cols + (j + 1) % cols; if (rev) idx.push(k, b, a); else idx.push(k, a, b); }
    };
    if (o.capA) cap(0, false);
    if (o.capB) cap(m - 1, true);
    return { pos, uv, idx };
  }
  // a ring in a horizontal plane: angle 0 at the front (+Z), a quarter turn at her left (+X); pw > 2 squares it off
  function ringXZ(cx, y, cz, rx, rzF, rzB, n, pw, fn) {
    const out = [], e = 2 / (pw || 2);
    for (let j = 0; j < n; j++) {
      const a = (j / n) * TAU, s = Math.sin(a), c = Math.cos(a);
      let x = rx * Math.sign(s) * Math.pow(Math.abs(s), e), z = (c >= 0 ? rzF : (rzB == null ? rzF : rzB)) * Math.sign(c) * Math.pow(Math.abs(c), e);
      const p = [cx + x, y, cz + z];
      out.push(fn ? fn(p, a, j) : p);
    }
    return out;
  }
  // a tube along a polyline of centers with radii (number or [ra, rb]); returns rings (parallel-transported frames)
  function tubeRings(pts, radii, n, up0, twist) {
    const rings = [], m = pts.length; let N = null, Bv = null, T0 = null;
    for (let i = 0; i < m; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(m - 1, i + 1)];
      const T = V3(b.x - a.x, b.y - a.y, b.z - a.z).normalize();
      if (!N) { N = (up0 ? up0.clone() : (Math.abs(T.y) < 0.9 ? V3(0, 1, 0) : V3(1, 0, 0))); N.addScaledVector(T, -N.dot(T)).normalize(); }
      else { const q = new THREE.Quaternion().setFromUnitVectors(T0, T); N.applyQuaternion(q); N.addScaledVector(T, -N.dot(T)).normalize(); }
      Bv = V3().crossVectors(T, N); T0 = T.clone();
      const r = radii[i], ra = typeof r === 'number' ? r : r[0], rb = typeof r === 'number' ? r : r[1], ring = [], tw = twist ? twist * i / (m - 1) : 0;
      for (let j = 0; j < n; j++) {
        const ang = (j / n) * TAU + tw, c = Math.cos(ang) * ra, s = Math.sin(ang) * rb;
        ring.push([pts[i].x + N.x * c + Bv.x * s, pts[i].y + N.y * c + Bv.y * s, pts[i].z + N.z * c + Bv.z * s]);
      }
      rings.push(ring);
    }
    return rings;
  }
  const centroidOf = (rings) => { let x = 0, y = 0, z = 0, k = 0; for (const r of rings) for (const p of r) { x += p[0]; y += p[1]; z += p[2]; k++; } return V3(x / k, y / k, z / k); };
  // smooth points through control points (Catmull-Rom), returning n Vector3
  function curvePts(ctrl, n) {
    const c = new THREE.CatmullRomCurve3(ctrl.map((p) => (p.isVector3 ? p : V3(p[0], p[1], p[2]))), false, 'centripetal');
    return c.getPoints(n - 1);
  }
  // a UV sphere as a part (optionally squashed), centered at c
  function spherePart(c, rx, ry, rz, nu, nv) {
    const rings = [];
    for (let i = 0; i <= nv; i++) {
      const ph = (i / nv) * PI, y = Math.cos(ph), r = Math.max(1e-4, Math.sin(ph));
      rings.push(ringXZ(c.x, c.y + y * ry, c.z, rx * r, rz * r, rz * r, nu));
    }
    return loft(rings);
  }

  // ---------- textures painted in code, in her palette ----------
  const hex = (c) => { const v = parseInt(c.slice(1), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; };
  const rgba = (c, a) => { const [r, g, b] = hex(c); return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'; };
  // ---------- the painted references, baked: window.JESTER_TEX (or opts.textures) holds them as images ----------
  const BAKED = (opts.textures !== undefined ? opts.textures : (typeof window !== 'undefined' ? window.IO_TEX : null)) || null;
  const UPK = opts.upperScale || 0.97;             // scale of everything above the waist (applied to the first spine bone after the bind)
  const bakedImgs = {}, SKIN = (BAKED && BAKED.skin) || null;
  if (SKIN) PAL.skin = '#' + hex(SKIN).map((v) => Math.min(255, Math.round(v * 1.14)).toString(16).padStart(2, '0')).join('');   // lit cloth-side skin (the open neckline) is painted a little lighter than the self-lit face
  function onBaked(key, cb, url) {                 // cb(image) once it has decoded; false when nothing is baked under that name
    url = url || (BAKED && key && BAKED[key]);
    if (!BAKED || !url || typeof url !== 'string') return false;
    let e = bakedImgs[key];
    if (!e) { e = bakedImgs[key] = { img: new Image(), cbs: [], ok: false }; e.img.onload = () => { e.ok = true; const l = e.cbs; e.cbs = []; l.forEach((f) => f(e.img)); }; e.img.src = url; }
    if (e.ok) cb(e.img); else e.cbs.push(cb);
    return true;
  }
  function soleTex() {                               // ridged rubber: fine level grooves all the way up the wall of the sole (v is height, 0 to 7 cm)
    const W = Math.round(256 * TEXS), H = Math.round(256 * TEXS), c = cvs(W, H), g = c.getContext('2d'), N = 30, seed0 = seed; seed = 4711;      // its own dice, so nothing else's pattern shifts
    g.fillStyle = '#1d1a1c'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < N; i++) { const y = (i + 0.5) / N * H, h = H / N; g.fillStyle = '#070607'; g.fillRect(0, y - h * 0.5, W, h * 0.34); g.fillStyle = 'rgba(92,86,90,0.55)'; g.fillRect(0, y - h * 0.10, W, h * 0.22); }
    for (let i = 0; i < 260; i++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '120,112,116' : '0,0,0') + ',' + rr(0.03, 0.10) + ')'; g.fillRect(rnd() * W, rnd() * H, rr(8, 60) * TEXS, rr(1, 2.2) * TEXS); }
    seed = seed0; return ctex(c, 1, 1);
  }
  function sockTex() {                               // a ribbed cream sock with two grey stripes near its top
    const W = Math.round(512 * TEXS), H = Math.round(128 * TEXS), c = cvs(W, H), g = c.getContext('2d'), N = 46, seed0 = seed; seed = 9001;
    g.fillStyle = '#d6cfc2'; g.fillRect(0, 0, W, H);
    for (const [v0, v1] of [[0.685, 0.735], [0.785, 0.835]]) { g.fillStyle = '#4b484d'; g.fillRect(0, (1 - v1) * H, W, (v1 - v0) * H); }
    for (let i = 0; i < N; i++) { const x = (i + 0.5) / N * W, w = W / N; g.fillStyle = 'rgba(40,34,30,0.42)'; g.fillRect(x - w * 0.5, 0, w * 0.22, H); g.fillStyle = 'rgba(255,250,240,0.20)'; g.fillRect(x - w * 0.08, 0, w * 0.30, H); }
    for (let i = 0; i < 900; i++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '255,255,250' : '60,52,46') + ',' + rr(0.03, 0.09) + ')'; g.fillRect(rnd() * W, rnd() * H, rr(1, 3) * TEXS, rr(1, 4) * TEXS); }
    seed = seed0; return ctex(c, 1, 1);
  }
  function crinkleTex() {                            // the creases of patent leather, as a normal map that tiles
    const S = Math.round(256 * TEXS), h = new Float32Array(S * S), c = cvs(S, S), g = c.getContext('2d'), im = g.createImageData(S, S), d = im.data, seed0 = seed; seed = 2026;
    for (let k = 0; k < 44; k++) {
      const cx = rnd() * S, cy = rnd() * S, th = rr(-0.55, 0.55) + (rnd() < 0.12 ? PI / 2 : 0), L = rr(22, 70) * TEXS, w = rr(5, 11) * TEXS, amp = rr(0.5, 1.3) * (rnd() < 0.6 ? 1 : -1), ct = Math.cos(th), st = Math.sin(th), R = Math.ceil(L * 2.2);
      for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
        const al = dx * ct + dy * st, ac = -dx * st + dy * ct + 0.6 * w * Math.sin(al / L * 2.2); if (Math.abs(ac) > w * 3 || Math.abs(al) > L * 2.2) continue;
        const x = ((Math.round(cx) + dx) % S + S) % S, y = ((Math.round(cy) + dy) % S + S) % S; h[y * S + x] += amp * Math.exp(-ac * ac / (w * w)) * Math.exp(-al * al / (L * L));
      }
    }
    for (let k = 0; k < 30; k++) { const cx = rnd() * S, cy = rnd() * S, r = rr(14, 40) * TEXS, amp = rr(-1.2, 1.2), R = Math.ceil(r * 2.2); for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) { const x = ((Math.round(cx) + dx) % S + S) % S, y = ((Math.round(cy) + dy) % S + S) % S; h[y * S + x] += amp * Math.exp(-(dx * dx + dy * dy) / (r * r)); } }
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const gx = h[y * S + (x + 1) % S] - h[y * S + (x + S - 1) % S], gy = h[((y + 1) % S) * S + x] - h[((y + S - 1) % S) * S + x], k = 0.62 / TEXS, nx = -gx * k, ny = gy * k, l = Math.hypot(nx, ny, 1), o = (y * S + x) * 4;
      d[o] = 127.5 + 127.5 * nx / l; d[o + 1] = 127.5 + 127.5 * ny / l; d[o + 2] = 127.5 + 127.5 / l; d[o + 3] = 255;
    }
    g.putImageData(im, 0, 0); seed = seed0; return ctex(c, 1, 1, false);
  }
  function bakedTex(key, W, H, fill) {             // a canvas that becomes the baked image once it has decoded
    W = Math.round(W * TEXS); H = Math.round(H * TEXS);
    const c = cvs(W, H), g = c.getContext('2d'); g.fillStyle = fill; g.fillRect(0, 0, W, H);
    const t = ctex(c); onBaked(key, (im) => { g.drawImage(im, 0, 0, W, H); t.needsUpdate = true; }); return t;
  }
  function tileBaked(g, im, W, H, nx, ny) {        // mirrored tiles, so a painted swatch repeats without a seam
    const tw = W / nx, th = H / ny;
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      g.save(); g.translate(i * tw + (i % 2 ? tw : 0), j * th + (j % 2 ? th : 0)); g.scale(i % 2 ? -1 : 1, j % 2 ? -1 : 1);
      g.drawImage(im, 0, 0, tw + 0.6, th + 0.6); g.restore();
    }
  }
  function blobs(g, W, H, n, cols, rmin, rmax, amin, amax, mode) {
    g.save(); if (mode) g.globalCompositeOperation = mode;
    for (let i = 0; i < n; i++) {
      const x = rnd() * W, y = rnd() * H, r = rr(rmin, rmax), c = cols[(rnd() * cols.length) | 0], a = rr(amin, amax);
      for (const dx of [0, -W, W]) {
        if (x + dx + r < 0 || x + dx - r > W) continue;
        const gr = g.createRadialGradient(x + dx, y, 0, x + dx, y, r); gr.addColorStop(0, rgba(c, a)); gr.addColorStop(1, rgba(c, 0));
        g.fillStyle = gr; g.fillRect(x + dx - r, y - r, r * 2, r * 2);
      }
    }
    g.restore();
  }
  function dot(g, x, y, r, col) { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
  function star4(g, x, y, r) {
    g.beginPath(); g.moveTo(x, y - r);
    g.quadraticCurveTo(x, y, x + r, y); g.quadraticCurveTo(x, y, x, y + r);
    g.quadraticCurveTo(x, y, x - r, y); g.quadraticCurveTo(x, y, x, y - r); g.fill();
  }
  // woven fabric with a soft nap: used for velvet and plain cloth
  function fabricTex(S, base, hi, lo, rep, streak, bake, tiles, wash) {
    if (bake && BAKED && BAKED[bake]) S = Math.max(S, 512);
    S = Math.round(S * TEXS); const c = cvs(S, S), g = c.getContext('2d');
    g.fillStyle = base; g.fillRect(0, 0, S, S);
    blobs(g, S, S, 260, [hi], S * 0.02, S * 0.09, 0.03, 0.10);
    blobs(g, S, S, 200, [lo], S * 0.02, S * 0.10, 0.05, 0.16);
    g.globalAlpha = 0.07;
    for (let i = 0; i < S * 5; i++) { g.fillStyle = rnd() < 0.5 ? hi : lo; const x = rnd() * S, y = rnd() * S; g.fillRect(x, y, streak ? 1 : rr(1, 3), streak ? rr(4, S * 0.06) : 1); }
    g.globalAlpha = 1;
    const t = ctex(c, rep || 1, rep || 1);
    onBaked(bake, (im) => { tileBaked(g, im, S, S, tiles || 2, tiles || 2); if (wash) { g.fillStyle = wash; g.fillRect(0, 0, S, S); } t.needsUpdate = true; });
    return t;
  }
  // sheer veil: color and alpha canvases. o: { top, bottom, stripes, stripeCols, trim, a0, sequins, center, motif }
  function veilTex(W, H, o) {
    W = Math.round(W * TEXS); H = Math.round(H * TEXS);
    const c = cvs(W, H), g0 = c.getContext('2d'), ca = cvs(W, H), ga = ca.getContext('2d'); let g = g0;
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, o.top); gr.addColorStop(0.55, o.mid || o.bottom); gr.addColorStop(1, o.bottom);
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    blobs(g, W, H, 220, o.mottle || [o.top, o.bottom], W * 0.03, W * 0.12, 0.05, 0.22);
    blobs(g, W, H, 60, [o.glow || o.top], W * 0.02, W * 0.07, 0.08, 0.25, 'lighter');
    // long soft streaks that follow the fall of the cloth
    for (let i = 0; i < 160; i++) {
      const x = rnd() * W, w = rr(1, W * 0.012), y0 = rnd() * H * 0.8, l = rr(H * 0.1, H * 0.5);
      const sg = g.createLinearGradient(0, y0, 0, y0 + l), col = rnd() < 0.5 ? (o.glow || o.top) : o.dark || o.bottom;
      sg.addColorStop(0, rgba(col, 0)); sg.addColorStop(0.5, rgba(col, rr(0.08, 0.25))); sg.addColorStop(1, rgba(col, 0));
      g.fillStyle = sg; g.fillRect(x, y0, w, l);
    }
    const folds = (g, kf) => {                    // soft dark valleys between the gold lines, as cloth gathers
      const nf = o.stripes || 12;
      for (let i = 0; i < nf; i++) { const x0 = (i / nf) * W, fg = g.createLinearGradient(x0, 0, x0 + W / nf, 0); fg.addColorStop(0, rgba(o.glow || o.top, 0.16 * kf)); fg.addColorStop(0.5, rgba(o.dark || '#000000', 0.55 * kf)); fg.addColorStop(1, rgba(o.glow || o.top, 0.16 * kf)); g.fillStyle = fg; g.fillRect(x0, 0, W / nf + 1, H); }
    };
    if (o.folds) folds(g, o.folds);
    const cd = cvs(W, H); g = cd.getContext('2d');   // the gold work is painted on its own layer
    const a0 = Math.round(255 * o.a0);
    ga.fillStyle = 'rgb(' + a0 + ',' + a0 + ',' + a0 + ')'; ga.fillRect(0, 0, W, H);
    blobs(ga, W, H, 160, ['#ffffff'], W * 0.02, W * 0.1, 0.03, 0.14);
    blobs(ga, W, H, 160, ['#000000'], W * 0.02, W * 0.1, 0.03, 0.16);
    const both = (fn) => { fn(g, false); fn(ga, true); };
    const gold = [PAL.gold, PAL.goldHi, PAL.orange];
    if (o.motif) {                                // faint brocade diamonds
      g.strokeStyle = rgba(o.motif, 0.35); g.lineWidth = Math.max(1, W / 512);
      const st = W / 14;
      for (let y = -st; y < H + st; y += st) for (let x = -st; x < W + st; x += st) {
        const ox = (Math.round(y / st) % 2) * st / 2;
        g.beginPath(); g.moveTo(x + ox, y - st * 0.3); g.lineTo(x + ox + st * 0.22, y); g.lineTo(x + ox, y + st * 0.3); g.lineTo(x + ox - st * 0.22, y); g.closePath(); g.stroke();
        dot(g, x + ox, y, W / 420, rgba(o.motif, 0.6));
      }
    }
    // dotted gold lines running down the cloth
    const ns = o.stripes || 0;
    for (let i = 0; i <= ns; i++) {
      const x = (i / ns) * W, heavy = o.center && i === ns / 2, col = gold[i % 3];
      const lines = heavy ? [-W * 0.018, -W * 0.006, W * 0.006, W * 0.018] : (i % 2 ? [0] : [-W * 0.004, W * 0.004]);
      for (const dx of lines) {
        const step = heavy ? H / 150 : H / (110 + (i % 3) * 20), r = (heavy ? W / 330 : W / 480) * (o.dotScale || 1);
        for (let y = rnd() * step; y < H; y += step) {
          const jx = (rnd() - 0.5) * r * 0.6, rr2 = r * rr(0.7, 1.25);
          both((q, al) => dot(q, x + dx + jx, y, rr2, al ? '#fff' : (rnd() < 0.25 ? PAL.goldHi : col)));
        }
      }
      if (heavy) {                                // little diamonds down the middle
        for (let y = H * 0.02; y < H; y += H / 28) both((q, al) => { q.fillStyle = al ? '#fff' : PAL.goldHi; star4(q, x, y, W / 110); });
      }
    }
    // scattered sequins
    for (let i = 0; i < (o.sequins || 0); i++) {
      const x = rnd() * W, y = rnd() * H, r = rr(W / 900, W / 420), col = gold[(rnd() * 3) | 0];
      both((q, al) => dot(q, x, y, r, al ? '#eee' : col));
    }
    // hem and side trims: a solid cord, a row of beads, and small scallops
    const tw = H * (o.trim || 0.02);
    both((q, al) => {
      q.fillStyle = al ? '#fff' : PAL.gold; q.fillRect(0, H - tw * 0.35, W, tw * 0.35);
      for (let x = 0; x < W; x += tw * 0.7) { dot(q, x, H - tw * 0.72, tw * 0.22, al ? '#fff' : PAL.goldHi); }
      q.fillStyle = al ? '#fff' : PAL.orange; q.fillRect(0, H - tw * 1.15, W, tw * 0.12);
      const sw = W * (o.sideTrim || 0.008);
      for (const x0 of [0, W - sw]) { q.fillStyle = al ? '#fff' : PAL.gold; q.fillRect(x0, 0, sw, H); }
      for (let y = 0; y < H; y += sw * 1.8) { dot(q, sw * 1.9, y, sw * 0.5, al ? '#fff' : PAL.goldHi); dot(q, W - sw * 1.9, y, sw * 0.5, al ? '#fff' : PAL.goldHi); }
    });
    g0.drawImage(cd, 0, 0);
    const map = ctex(c), alpha = ctex(ca, 0, 0, false);
    if (o.whole) onBaked(o.whole, (im) => onBaked(o.whole + 'A', (ia) => {       // a whole painted cloth: its colours, its gold, its cut hem
      g0.drawImage(im, 0, 0, W, H); ga.drawImage(ia, 0, 0, W, H);
      if (o.wash) { g0.save(); g0.globalCompositeOperation = 'multiply'; g0.fillStyle = o.wash; g0.fillRect(0, 0, W, H); g0.restore(); }
      map.needsUpdate = alpha.needsUpdate = true;
    }));
    else if (o.bake) onBaked(o.bake, (im) => {                                   // a painted swatch under the gold work
      const n = o.bakeTiles || [4, 2]; tileBaked(g0, im, W, H, n[0], n[1]);
      const sh = g0.createLinearGradient(0, 0, 0, H); sh.addColorStop(0, rgba(o.dark || '#000000', 0.45)); sh.addColorStop(0.5, rgba(o.dark || '#000000', 0.12)); sh.addColorStop(1, rgba(o.dark || '#000000', 0)); g0.fillStyle = sh; g0.fillRect(0, 0, W, H);
      if (o.folds) folds(g0, o.folds * 0.7); g0.drawImage(cd, 0, 0); map.needsUpdate = true;
    });
    return { map, alpha };
  }
  // ragged black cloth for the skirt: color and a cut-out alpha with a torn hem and worn holes
  function raggedTex(W, H, base, hi, lo, bake) {
    W = Math.round(W * TEXS); H = Math.round(H * TEXS);
    const c = cvs(W, H), g = c.getContext('2d'), ca = cvs(W, H), ga = ca.getContext('2d');
    g.fillStyle = base; g.fillRect(0, 0, W, H);
    blobs(g, W, H, 200, [hi], W * 0.02, W * 0.08, 0.04, 0.14);
    blobs(g, W, H, 200, [lo], W * 0.02, W * 0.1, 0.1, 0.3);
    for (let i = 0; i < 420; i++) {                // gathers
      const x = rnd() * W, y0 = rnd() * H * 0.6, l = rr(H * 0.2, H * 0.8), col = rnd() < 0.45 ? hi : lo;
      const sg = g.createLinearGradient(0, y0, 0, y0 + l); sg.addColorStop(0, rgba(col, 0)); sg.addColorStop(0.5, rgba(col, rr(0.1, 0.3))); sg.addColorStop(1, rgba(col, 0));
      g.fillStyle = sg; g.fillRect(x, y0, rr(1, W * 0.008), l);
    }
    const eg = g.createLinearGradient(0, H * 0.8, 0, H); eg.addColorStop(0, rgba(hi, 0)); eg.addColorStop(1, rgba(hi, 0.35)); g.fillStyle = eg; g.fillRect(0, H * 0.8, W, H * 0.2);
    ga.fillStyle = '#fff'; ga.fillRect(0, 0, W, H); ga.fillStyle = '#000';
    for (let x = 0; x < W;) {                      // torn notches along the hem
      const w = rr(W * 0.006, W * 0.03), d = rr(H * 0.01, H * 0.07);
      ga.beginPath(); ga.moveTo(x, H); ga.lineTo(x + w * rr(0.3, 0.7), H - d); ga.lineTo(x + w, H); ga.closePath(); ga.fill(); x += w * rr(0.6, 1.3);
    }
    for (let i = 0; i < 90; i++) { const x = rnd() * W, y = H * rr(0.72, 0.98); ga.beginPath(); ga.ellipse(x, y, rr(1, W * 0.006), rr(2, H * 0.02), rr(-0.3, 0.3), 0, TAU); ga.fill(); }
    const map = ctex(c);
    onBaked(bake, (im) => {                          // the painted cloth, in shadow under the tier above and catching light along its own hem, so each tier reads
      tileBaked(g, im, W, H, 6, 2);
      const sh = g.createLinearGradient(0, 0, 0, H * 0.45); sh.addColorStop(0, 'rgba(8,5,8,0.62)'); sh.addColorStop(1, 'rgba(8,5,8,0)'); g.fillStyle = sh; g.fillRect(0, 0, W, H * 0.45);
      const e2 = g.createLinearGradient(0, H * 0.84, 0, H); e2.addColorStop(0, rgba(hi, 0)); e2.addColorStop(0.75, rgba(hi, 0.5)); e2.addColorStop(1, rgba(hi, 0.75)); g.fillStyle = e2; g.fillRect(0, H * 0.84, W, H * 0.16);
      map.needsUpdate = true;
    });
    return { map, alpha: ctex(ca, 0, 0, false) };
  }
  // purple leggings with a black flocked floral pattern; the white striped sock band sits at the boot top
  function leggingsTex() {
    const W = Math.round(512 * TEXS), H = Math.round(1024 * TEXS), c = cvs(W, H), g = c.getContext('2d');
    g.fillStyle = PAL.purple; g.fillRect(0, 0, W, H);
    blobs(g, W, H, 140, [PAL.purpleHi], W * 0.04, W * 0.16, 0.08, 0.25);
    blobs(g, W, H, 100, [PAL.purpleDk], W * 0.04, W * 0.14, 0.08, 0.22);
    const ink = '#150c1c';
    for (let i = 0; i < 230; i++) {
      const x = rnd() * W, y = rnd() * H * 0.93, s = rr(W * 0.024, W * 0.056), rot = rnd() * TAU, k = rnd();
      for (const dx of [0, -W, W]) {
        g.save(); g.translate(x + dx, y); g.rotate(rot); g.fillStyle = ink;
        if (k < 0.55) { for (let p = 0; p < 4; p++) { g.rotate(TAU / 4); g.beginPath(); g.ellipse(0, s * 0.62, s * 0.3, s * 0.52, 0, 0, TAU); g.fill(); } dot(g, 0, 0, s * 0.22, ink); }
        else if (k < 0.8) { g.beginPath(); g.moveTo(0, -s); g.quadraticCurveTo(s * 0.8, 0, 0, s); g.quadraticCurveTo(-s * 0.8, 0, 0, -s); g.fill(); }
        else { for (let p = 0; p < 5; p++) dot(g, rr(-s, s), rr(-s, s), s * rr(0.1, 0.25), ink); }
        g.restore();
      }
    }
    for (let i = 0; i < 500; i++) dot(g, rnd() * W, rnd() * H * 0.93, rr(0.8, 2.4) * TEXS, ink);
    const y0 = H * 0.930;                             // the leggings run down into the sock, which is its own part now (31_boots.js)
    g.fillStyle = '#0d0a10'; g.fillRect(0, y0, W, H - y0);
    const t = ctex(c);
    onBaked('leggings', (im) => { g.save(); g.beginPath(); g.rect(0, 0, W, y0); g.clip(); tileBaked(g, im, W, y0, 2, 5); g.restore(); t.needsUpdate = true; });
    return t;
  }
  // black ruffle lace: opaque cloth that breaks into a scalloped lace edge (v = 1 is the edge)
  function laceTex() {
    const W = Math.round(512 * TEXS), H = Math.round(256 * TEXS), c = cvs(W, H), g = c.getContext('2d'), ca = cvs(W, H), ga = ca.getContext('2d');
    g.fillStyle = '#2a2127'; g.fillRect(0, 0, W, H);
    blobs(g, W, H, 120, ['#463a42'], W * 0.02, W * 0.08, 0.08, 0.3);
    for (let i = 0; i < 200; i++) { g.fillStyle = rgba(rnd() < 0.5 ? '#40344a' : '#000000', 0.25); g.fillRect(rnd() * W, 0, rr(1, 3), H); }
    const eg = g.createLinearGradient(0, H * 0.6, 0, H); eg.addColorStop(0, 'rgba(70,58,82,0)'); eg.addColorStop(1, 'rgba(92,78,104,0.55)'); g.fillStyle = eg; g.fillRect(0, H * 0.6, W, H * 0.4);
    ga.fillStyle = '#fff'; ga.fillRect(0, 0, W, H); ga.fillStyle = '#000';
    const n = 16, sw = W / n;
    for (let i = 0; i < n; i++) {
      ga.beginPath(); ga.moveTo(i * sw, H); ga.quadraticCurveTo(i * sw, H * 0.86, i * sw + sw * 0.08, H * 0.86); ga.lineTo(i * sw - sw * 0.08, H * 0.86); ga.closePath(); ga.fill();
      ga.beginPath(); ga.moveTo(i * sw - sw * 0.2, H); ga.quadraticCurveTo(i * sw, H * 0.8, i * sw + sw * 0.2, H); ga.fill();
      for (let k = 0; k < 3; k++) dot(ga, i * sw + sw * (0.3 + 0.2 * k), H * 0.82, sw * 0.055, '#000');
      dot(ga, i * sw + sw * 0.5, H * 0.68, sw * 0.07, '#000');
    }
    const map = ctex(c);
    onBaked('ruffle', (im) => { tileBaked(g, im, W, H, 2, 1); const e2 = g.createLinearGradient(0, H * 0.45, 0, H); e2.addColorStop(0, 'rgba(104,92,112,0)'); e2.addColorStop(1, 'rgba(112,98,120,0.34)'); g.fillStyle = e2; g.fillRect(0, H * 0.45, W, H * 0.55);
      const e3 = g.createLinearGradient(0, 0, 0, H * 0.5); e3.addColorStop(0, 'rgba(0,0,0,0.5)'); e3.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = e3; g.fillRect(0, 0, W, H * 0.5); map.needsUpdate = true; });
    return { map, alpha: ctex(ca, 0, 0, false) };
  }

  // ---------- material helpers ----------
  const lin = (c) => new THREE.Color(c).convertSRGBToLinear();     // r128 takes material colours as linear values
  function sheen(mat, col, pw, k, shot) {            // a soft rim, the way velvet and sheer cloth catch light at a glancing angle
    mat.userData.sheen = { c: lin(col), p: pw, k: k };
    // shot: { c, k, p } makes the cloth two-toned, like silk woven from two colours: it keeps its own colour where you look straight
    // at it and turns toward the second colour where it turns away from you, so every fold shows both
    const sh2 = shot ? { c: lin(shot.c), k: shot.k, p: shot.p || 1.4 } : { c: lin('#000000'), k: 0, p: 1 };
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uSheenC = { value: mat.userData.sheen.c }; sh.uniforms.uSheenP = { value: mat.userData.sheen.p }; sh.uniforms.uSheenK = { value: mat.userData.sheen.k };
      sh.uniforms.uShotC = { value: sh2.c }; sh.uniforms.uShotK = { value: sh2.k }; sh.uniforms.uShotP = { value: sh2.p };
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uSheenC; uniform float uSheenP; uniform float uSheenK; uniform vec3 uShotC; uniform float uShotK; uniform float uShotP;')
        .replace('#include <tonemapping_fragment>', 'float sNV = saturate(abs(dot(normalize(vViewPosition), normal)));\n float sFr = pow(1.0 - sNV, uSheenP);\n if (uShotK > 0.0) { float sT = smoothstep(0.10, 0.85, pow(1.0 - sNV, uShotP)) * uShotK; float sL = dot(gl_FragColor.rgb, vec3(0.3, 0.59, 0.11)); gl_FragColor.rgb = mix(gl_FragColor.rgb, uShotC * (sL * 2.6 + 0.015), sT); }\n gl_FragColor.rgb += uSheenC * (sFr * uSheenK * (0.35 + 0.65 * saturate(normal.y * 0.5 + 0.5)));\n#include <tonemapping_fragment>');
    };
    return mat;
  }
  const std = (o) => new THREE.MeshStandardMaterial(Object.assign({ skinning: true }, o));
  const phys = (o) => new THREE.MeshPhysicalMaterial(Object.assign({ skinning: true }, o));

  // ---------- Io's own code-drawn textures ----------
  function sockTexIo() {                             // a short black knit cuff: soft upright ribs
    const W = Math.round(512 * TEXS), H = Math.round(256 * TEXS), c = cvs(W, H), g = c.getContext('2d'), N = 44, seed0 = seed; seed = 8301;
    g.fillStyle = '#1b181b'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < N; i++) { const x = (i + 0.5) / N * W, w = W / N; g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(x - w * 0.5, 0, w * 0.28, H); g.fillStyle = 'rgba(120,112,124,0.22)'; g.fillRect(x - w * 0.06, 0, w * 0.34, H); }
    for (let j = 0; j < 46; j++) { g.fillStyle = 'rgba(0,0,0,0.16)'; g.fillRect(0, (j + 0.5) / 46 * H, W, 1.2 * TEXS); }
    for (let i = 0; i < 1200; i++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '150,142,156' : '0,0,0') + ',' + rr(0.04, 0.12) + ')'; g.fillRect(rnd() * W, rnd() * H, rr(1, 3) * TEXS, rr(1, 5) * TEXS); }
    seed = seed0; return ctex(c, 1, 1);
  }

  // the hat's brim, unrolled: round it from left to right, from the crown (bottom of the picture) to the edge (top). The felt of F9
  // is laid in mirrored tiles, then the gold embroidery of C5 and C16 is drawn near the edge: a scrolling line with small leaves.
  function brimTexIo() {
    const W = 2048, H = 256, c = cvs(W, H), g = c.getContext('2d'), t = ctex(c), NT = 10;
    const trim = () => {
      g.strokeStyle = 'rgba(214,170,84,0.92)'; g.fillStyle = 'rgba(224,182,96,0.95)'; g.lineWidth = 2.2; g.lineCap = 'round';
      const N = 44, y0 = H * 0.105, amp = H * 0.036;
      g.beginPath(); for (let x = 0; x <= W; x += 2) { const y = y0 + amp * Math.sin((x / W) * TAU * N); if (x) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke();
      for (let k = 0; k < N * 2; k++) { const x = (k + 0.5) / (N * 2) * W, up = k % 2 ? 1 : -1; g.beginPath(); g.ellipse(x, y0 + up * amp * 1.9, 2.4, 4.6, 0, 0, TAU); g.fill(); g.beginPath(); g.arc(x + W / (N * 8), y0 + up * amp * 0.2, 1.6, 0, TAU); g.fill(); }
      g.lineWidth = 1.4; g.setLineDash([5, 4]); g.beginPath(); g.moveTo(0, H * 0.030); g.lineTo(W, H * 0.030); g.stroke(); g.setLineDash([]);
    };
    g.fillStyle = (BAKED && BAKED.feltCol) || '#481324'; g.fillRect(0, 0, W, H); trim();
    onBaked('felt', (im) => { const tw = W / NT, th = tw; for (let i = 0; i < NT; i++) { g.save(); if (i % 2) { g.translate((i + 1) * tw, 0); g.scale(-1, 1); } else g.translate(i * tw, 0); g.drawImage(im, 0, 0, tw, th); g.drawImage(im, 0, th, tw, th); g.restore(); } trim(); t.needsUpdate = true; });
    t.wrapS = THREE.RepeatWrapping; return t;
  }

  // her hair's strands, running up the picture, in her five hair colours (dark to light, from C13). Across the picture the mix drifts
  // from mostly dark to mostly light and back, so a tress that takes one narrow strip of it is a dark tress or a sun-lightened one.
  function hairTexIo(cols, bump) {
    const W = 2048, H = 512, c = cvs(W, H), g = c.getContext('2d'); let sd = 5519; const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    g.fillStyle = bump ? '#606060' : cols[0]; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 5200; i++) {
      const x = r() * W, u = x / W, lightness = Math.pow(0.5 + 0.5 * Math.sin(u * TAU * 4 + 0.7 + 0.9 * Math.sin(u * TAU * 3)), 1.5), k = r() * 0.50 + lightness * 0.85, ci = k < 0.30 ? 0 : k < 0.56 ? 1 : k < 0.84 ? 2 : k < 1.08 ? 3 : 4, a = 0.40 + 0.5 * r();
      g.strokeStyle = bump ? 'rgba(' + (r() < 0.5 ? '255,255,255' : '0,0,0') + ',' + (0.25 + 0.4 * r()) + ')' : rgba(cols[ci], a); g.lineWidth = 0.8 + 2.4 * r();
      const wob = 6 * (r() - 0.5); g.beginPath(); g.moveTo(x, -4); g.bezierCurveTo(x + wob, H * 0.33, x - wob, H * 0.66, x, H + 4); g.stroke();
    }
    const t = ctex(c, 0, 0, !bump); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  }
  // where a tress has hair: all of it for most of its length (the bottom half of the picture), then strands that end at different lengths, so its tip is a wisp
  function hairAlphaIo() {
    const W = 2048, H = 512, c = cvs(W, H), g = c.getContext('2d'); let sd = 4409; const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.fillStyle = '#fff'; g.fillRect(0, H * 0.5, W, H * 0.5);
    for (let i = 0; i < 1000; i++) {                // each strand narrows to a point, so a tress ends in fine tips and not in a row of square teeth
      const x = r() * W, top = H * (1 - (0.56 + 0.44 * Math.pow(r(), 0.8))), w = 4 + 9 * r(), lean = 14 * (r() - 0.5), y0 = H * 0.52, ym = (y0 + top) / 2;
      g.beginPath(); g.moveTo(x - w / 2, y0); g.quadraticCurveTo(x - w * 0.42 + lean * 0.4, ym, x + lean, top); g.quadraticCurveTo(x + w * 0.42 + lean * 0.4, ym, x + w / 2, y0); g.closePath(); g.fill();
    }
    const t = ctex(c); t.wrapS = THREE.RepeatWrapping; t.encoding = THREE.LinearEncoding; return t;
  }
  // a wisp of fringe: separate strands with gaps between them, ending at different lengths (the root at the bottom of the picture)
  function wispAlphaIo() {
    const W = 2048, H = 512, c = cvs(W, H), g = c.getContext('2d'); let sd = 7717; const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.strokeStyle = '#fff'; g.lineCap = 'round';
    for (let i = 0; i < 560; i++) { const x = r() * W, top = H * (1 - (0.50 + 0.50 * Math.pow(r(), 0.7))); g.lineWidth = 2.2 + 4.2 * r(); g.beginPath(); g.moveTo(x, H); g.bezierCurveTo(x + 9 * (r() - 0.5), H * 0.66, x + 9 * (r() - 0.5), H * 0.4, x + 11 * (r() - 0.5), top); g.stroke(); }
    const t = ctex(c); t.wrapS = THREE.RepeatWrapping; t.encoding = THREE.LinearEncoding; return t;
  }

  // ---------- her cloak (stage four): sheer burgundy chiffon with small gold dots; the bottom tenth of the picture is the
  // gold-embroidered trim that runs along every hem (F6 shows the cloth, the trim and a hem point) ----------
  function robeTexIo() {
    const W = 512, H = 512, c = cvs(W, H), g = c.getContext('2d'), own = seed; seed = 5151;
    g.fillStyle = '#6e1e35'; g.fillRect(0, 0, W, H);
    for (let x = 0; x < W; x++) { const v = fbm(x * 0.21, 7.3) - 0.47; g.fillStyle = v > 0 ? 'rgba(255,170,160,' + Math.min(0.09, v * 0.3) + ')' : 'rgba(30,0,12,' + Math.min(0.16, -v * 0.5) + ')'; g.fillRect(x, 0, 1, H); }      // the weave runs down the cloth
    for (let i = 0; i < 7; i++) { const x = (i + 0.5) * W / 7, gr = g.createLinearGradient(x - 30, 0, x + 30, 0); gr.addColorStop(0, 'rgba(30,0,10,0)'); gr.addColorStop(0.5, 'rgba(30,0,10,0.17)'); gr.addColorStop(1, 'rgba(30,0,10,0)'); g.fillStyle = gr; g.fillRect(x - 30, 0, 60, H); }   // soft folds
    g.fillStyle = '#e6b958'; for (let j = 0; j < 9; j++) for (let i = 0; i < 8; i++) { g.beginPath(); g.arc(((i + (j % 2 ? 0.5 : 0)) * 64 + 16) % W, j * 50 + 22, 2.4, 0, TAU); g.fill(); }
    const y0 = H - 56; g.fillStyle = '#541426'; g.fillRect(0, y0, W, 56); g.strokeStyle = '#dcaa45'; g.lineWidth = 3.2; g.beginPath(); g.moveTo(0, y0 + 4); g.lineTo(W, y0 + 4); g.moveTo(0, H - 5); g.lineTo(W, H - 5); g.stroke();
    const vine = (x) => y0 + 28 + 10 * Math.sin((x / W) * TAU * 4);
    g.lineWidth = 2.6; g.beginPath(); for (let x = 0; x <= W; x += 4) { if (x) g.lineTo(x, vine(x)); else g.moveTo(x, vine(x)); } g.stroke();
    g.fillStyle = '#ecc468'; for (let k = 0; k < 16; k++) { const x = (k + 0.5) * W / 16; g.beginPath(); g.ellipse(x, vine(x) + (k % 2 ? -8 : 8), 7.5, 3.4, k % 2 ? -0.7 : 0.7, 0, TAU); g.fill(); }
    seed = own; const t = ctex(c); t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; return t;
  }
  // The moss Chris asked for (November 13): "a mossy green frill" along the cloak's hems. A strip of tufts with gaps between them.
  function mossTexIo() {
    const W = 512, H = 128, c = cvs(W, H), g = c.getContext('2d'), own = seed; seed = 7723;
    const cols = ['#2f3d16', '#44531a', '#5a6b1f', '#73822a', '#8d9440', '#3a4714'];
    for (let k = 0; k < 9; k++) { const cx = (k + 0.5 + (rnd() - 0.5) * 0.5) * W / 9, wide = 14 + rnd() * 22, tall = 0.55 + rnd() * 0.45; if (rnd() > 0.60) continue;       // it grows in patches, not all along
      for (let i = 0; i < 120; i++) { const a = rnd() * TAU, r = Math.sqrt(rnd()), x = cx + Math.cos(a) * r * wide, y = H * 0.56 + Math.sin(a) * r * H * 0.36 * tall, rr = 2.2 + rnd() * 4.2;
        g.fillStyle = cols[Math.floor(rnd() * cols.length)]; g.beginPath(); g.arc(((x % W) + W) % W, y, rr, 0, TAU); g.fill(); }
      for (let i = 0; i < 7; i++) { const x = cx + (rnd() - 0.5) * wide * 1.4, y = H * 0.74; g.strokeStyle = cols[1 + Math.floor(rnd() * 3)]; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - 0.5) * 6, y + 10 + rnd() * 20); g.stroke(); } }      // a few threads hang down
    seed = own; const t = ctex(c); t.wrapS = THREE.RepeatWrapping; return t;
  }
  function fernTexIo() {                           // one small fern frond, its stem up the middle of the picture
    const W = 128, H = 256, c = cvs(W, H), g = c.getContext('2d');
    g.strokeStyle = '#4c6420'; g.lineWidth = 3; g.beginPath(); g.moveTo(W / 2, H - 2); g.quadraticCurveTo(W / 2 + 6, H * 0.5, W / 2 - 2, 8); g.stroke();
    for (let i = 0; i < 15; i++) { const t = i / 14, y = H - 22 - t * (H - 40), len = (1 - t * 0.82) * 50, x = W / 2 + 6 * Math.sin(t * 2.4) - 2 * t;
      for (const sd of [-1, 1]) { g.fillStyle = i % 2 ? '#7d9a2f' : '#647f24'; g.beginPath(); g.ellipse(x + sd * len * 0.5, y - len * 0.16, len * 0.52, 5.2 - t * 2.4, -sd * 0.42, 0, TAU); g.fill(); } }
    return ctex(c);
  }

  // ---------- Io's body and base outfit (stage one): black bodice, bare arms and legs, the tiered lace skirt (stiff for now) ----------
  // Shapes come from the tables in I05_tables.js. The torso wears one picture that wraps right round her (u runs round the body
  // from the middle of her back, v is height), baked from four paintings: B3 front and back, B2 both sides (bake_io.py).
  const SPINE_W = [['hips', 0.975], ['spine1', 1.055], ['spine2', 1.145], ['spine3', 1.255]];
  function wSpine(y) {
    if (y <= SPINE_W[0][1]) return [BI.hips, 1];
    for (let i = 1; i < SPINE_W.length; i++) if (y < SPINE_W[i][1]) {
      const u = sm(SPINE_W[i - 1][1], SPINE_W[i][1], y);
      return [BI[SPINE_W[i - 1][0]], 1 - u, BI[SPINE_W[i][0]], u];
    }
    return [BI.spine3, 1];
  }
  function wTorso(x, y, z) {
    const w = wSpine(y), ax = Math.abs(x), S = x < 0 ? 'R' : 'L';
    const k = 0.75 * sm(0.070, 0.125, ax) * sm(1.19, 1.27, y);       // the shoulder girdle follows the collarbone
    if (k > 0.001) { for (let i = 1; i < w.length; i += 2) w[i] *= 1 - k; w.push(BI['clav' + S], k); }
    const ku = 0.30 * sm(0.080, 0.118, ax) * sm(1.15, 1.225, y) * (1 - sm(1.262, 1.300, y)) * (1 - sm(0.022, 0.050, Math.abs(z + 0.018)));       // under the joint her skin goes part of the way with the arm, so her armpit opens as the arm lifts
    if (ku > 0.001) { for (let i = 1; i < w.length; i += 2) w[i] *= 1 - ku; w.push(BI['uarm' + S], ku); }
    if (y > 1.33) { const n = sm(1.33, 1.40, y) * (1 - sm(0.05, 0.1, ax)); if (n > 0.001) { for (let i = 1; i < w.length; i += 2) w[i] *= 1 - n; w.push(BI.neck, n); } }
    return w;
  }

  // the torso surface: u 0..1 round the body (0 the middle of her back, 0.25 her right side, 0.5 the front), y height
  const IO_E = 2 / IO_TPW;
  function ioTorso(u, y) {
    const [rx, zf, zb] = spline(IO_TORSO, cl(y, IO_TORSO[0][0], IO_TY1)), cz = (zf + zb) / 2, rf = zf - cz, rb = cz - zb;
    const a = PI + u * TAU, s = Math.sin(a), c = Math.cos(a);
    const x = rx * Math.sign(s) * Math.pow(Math.abs(s), IO_E); let z = cz + (c >= 0 ? rf : rb) * Math.sign(c) * Math.pow(Math.abs(c), IO_E);
    if (c > 0) {
      const B = IO_BUST, ax = Math.abs(x);
      z += c * B.amp * Math.exp(-Math.pow((ax - B.x) / B.sx, 2) - Math.pow((y - B.y) / B.sy, 2));
      z -= c * B.dip * Math.exp(-Math.pow(x / B.dipx, 2) - Math.pow((y - B.dipy) / B.dipsy, 2));
    }
    return [x, y, z];
  }
  const IO_AY0 = 0.86;                               // the picture's lowest row; below the waistband it is plain black (the skirt hides it)
  const ioV = (y) => (y - IO_AY0) / (IO_TY1 - IO_AY0);
  (function buildTorso() {
    const rings = [], vs = [], NR = Q(72, 34), NU = Q(84, 40);
    for (let i = 0; i <= NR; i++) {
      const y = lerp(IO_TY0, IO_TY1, i / NR), ring = [];
      for (let j = 0; j < NU; j++) ring.push(ioTorso(j / NU, y));
      rings.push(ring); vs.push(ioV(y));
    }
    addPart('torso', loft(rings, { v: vs, capA: true }), wTorso, { out: V3(0, 1.15, 0) });
  })();

  // ---------- arms: bare, from the shoulder to the wrist ----------
  // Her own outline, measured off D3 (her arm held straight out, seen from the front and from behind; tools/arm_d3.py, tools/arm_fit.py).
  // Each row: [distance down the arm from the shoulder joint, outer side, inner side, front, back], the last four as distances from the bone.
  // Outer and inner are what D3 shows (her arm held out is her hanging arm turned up: the top line is the outer side). Front and back are
  // not painted anywhere, so they follow a slim arm: biceps in front, triceps behind, the point of the elbow at the back, the crease in front,
  // and a wrist that is flat the way her palm faces.
  const ARM_X = [[0, 0.0440, 0.0430, 0.0400, 0.0410], [0.02, 0.0444, 0.0428, 0.0396, 0.0404], [0.04, 0.0434, 0.0424, 0.0388, 0.0396], [0.06, 0.0404, 0.0418, 0.0374, 0.0386], [0.08, 0.0360, 0.0410, 0.0362, 0.0376],
    [0.10, 0.0322, 0.0400, 0.0356, 0.0368], [0.12, 0.0300, 0.0388, 0.0353, 0.0361], [0.14, 0.0290, 0.0373, 0.0348, 0.0353], [0.16, 0.0286, 0.0356, 0.0339, 0.0344], [0.18, 0.0282, 0.0337, 0.0325, 0.0335],
    [0.20, 0.0279, 0.0315, 0.0305, 0.0328], [0.218, 0.0288, 0.0306, 0.0284, 0.0330], [0.232, 0.0310, 0.0316, 0.0270, 0.0338], [0.246, 0.0328, 0.0332, 0.0280, 0.0322], [0.262, 0.0337, 0.0338, 0.0293, 0.0302],
    [0.28, 0.0333, 0.0335, 0.0296, 0.0288], [0.30, 0.0316, 0.0327, 0.0290, 0.0277], [0.32, 0.0292, 0.0316, 0.0280, 0.0268], [0.34, 0.0266, 0.0298, 0.0270, 0.0260], [0.36, 0.0243, 0.0273, 0.0261, 0.0252],
    [0.38, 0.0225, 0.0249, 0.0258, 0.0245], [0.40, 0.0207, 0.0223, 0.0270, 0.0234], [0.41, 0.0200, 0.0212, 0.0284, 0.0224], [0.42, 0.0192, 0.0200, 0.0290, 0.0214], [0.436, 0.0170, 0.0176, 0.0297, 0.0196], [0.449, 0.0128, 0.0146, 0.0300, 0.0178], [0.458, 0.0110, 0.0134, 0.0290, 0.0168]];
  // Above the joint the arm ends in a ball that sits on the joint itself, so however the arm turns the ball stays where it is, inside her shoulder.
  // At the wrist the arm narrows to the hand's own wrist (the hand sits a little toward the thumb side) and ends hidden just inside the hand.
  const ARM_CAP = 0.047; for (const t of [0.22, 0.45, 0.66, 0.84, 0.955, 0.998]) { const f = Math.sqrt(1 - t * t), r = ARM_X.find((q) => q[0] === 0); ARM_X.unshift([-ARM_CAP * t, r[1] * f, r[2] * f, r[3] * f, r[4] * f]); }
  ARM_X.sort((p, q) => p[0] - q[0]);
  const ARM_K = [1, 2, 3, 4].map((c) => ARM_X.map((r) => [r[0], r[c]]));
  const ARM_S0 = ARM_X[0][0], ARM_S1 = 0.458;
  // one point of the arm's skin at rest: a is the angle round the arm (0 the outer side, a quarter turn the front, half the inner side)
  function armPt(S, sl, a) {
    const s = S === 'L' ? 1 : -1, d = armDir[S], sh = restPts['sh' + S], ca = Math.cos(a), sa = Math.sin(a);
    const ex = prof(ARM_K[ca >= 0 ? 0 : 1], sl, true), ez = prof(ARM_K[sa >= 0 ? 2 : 3], sl, true), n = 2 + 1.3 * sm(0.35, 0.42, sl);       // round above; toward the wrist it squares off, flat on the back and on the palm side
    const r = Math.pow(Math.pow(Math.abs(ca) / ex, n) + Math.pow(Math.abs(sa) / ez, n), -1 / n);
    const ox = s * Math.cos(A_POSE), oy = Math.sin(A_POSE);                 // the outer side: square to the arm, away from her body
    return [sh.x + d.x * sl + ox * r * ca, sh.y + d.y * sl + oy * r * ca, sh.z + r * sa];
  }
  // the point of the elbow is the forearm's bone, so at the back the skin goes over to the forearm a little above the joint; in front it folds at the crease
  function wArm(S, sLen, a) {
    if (sLen < 0.02) return [BI['uarm' + S], 1];       // the arm turns in her shoulder like a ball in a socket: all of it moves as one piece about the joint
    if (sLen < L_UARM + 0.07) { const bk = a == null ? 0 : Math.max(0, -Math.sin(a)), c = L_UARM - 0.016 * bk, h = 0.046 - 0.010 * bk, u = sm(c - h, c + h, sLen); return [BI['uarm' + S], 1 - u, BI['farm' + S], u]; }
    const u = sm(L_UARM + L_FARM - 0.02, L_UARM + L_FARM + 0.012, sLen), tw = sm(0.30, 0.415, sLen);       // down the forearm the skin goes over to the bone that turns with her hand
    return [BI['farm' + S], (1 - tw) * (1 - u), BI['ftw' + S], tw * (1 - u), BI['hand' + S], u];
  }
  for (const [S, s] of SIDES) {
    const NS = Q(60, 24), NU = Q(32, 14), rings = [], ss = [], vs = [];
    for (let i = 0; i <= NS; i++) {
      const t = i < 12 ? 0.5 * (1 - Math.cos(PI * i / 24)) * 2 * 0.093 : 0.093 + 0.907 * (i - 12) / (NS - 12), sl = ARM_S0 + (ARM_S1 - ARM_S0) * t, ring = [];   // the first rings are close together: they round the ball of the shoulder
      for (let j = 0; j < NU; j++) ring.push(armPt(S, sl, (j / NU) * TAU));
      rings.push(ring); ss.push(sl); vs.push((sl - ARM_S0) / (ARM_S1 - ARM_S0));
    }
    const part = loft(rings, { capA: true, v: vs }), cols = NU + 1;
    addPart(BAKED && BAKED.arms ? 'arm' : 'skin', part, (x, y, z, i) => i < ss.length * cols ? wArm(S, ss[Math.floor(i / cols)], ((i % cols) / NU) * TAU) : wArm(S, ss[0]), { out: centroidOf(rings) });
  }

  // ---------- legs: bare skin from the hip down into the boots ----------
  function wLeg(S, y) {
    if (y > 0.88) { const u = sm(0.88, 0.975, y); return [BI['thigh' + S], 1 - u, BI.hips, u]; }
    const u = sm(IO_KNEE_Y - 0.05, IO_KNEE_Y + 0.05, y); return [BI['shin' + S], 1 - u, BI['thigh' + S], u];
  }
  const IO_LEG_UP = IO_LEG.slice().reverse(), IO_SKIRT_UP = IO_SKIRT.slice().reverse();      // spline() reads its keys from low to high
  const legRing = (s, y, k, n) => { const [rx, rzF, rzB, cx, cz] = spline(IO_LEG_UP, y), ring = []; for (let j = 0; j < n; j++) { const a = PI + (j / n) * TAU, c = Math.cos(a); ring.push([s * cx + rx * k * Math.sin(a), y, cz + (c >= 0 ? rzF : rzB) * k * c]); } return ring; };
  for (const [S, s] of SIDES) {
    const rings = [], NR = Q(56, 26), NU = Q(40, 20);
    for (let i = 0; i <= NR; i++) { const y = lerp(0.935, 0.30, i / NR); rings.push(legRing(s, y, 1, NU)); }
    // Above mid-thigh she wears plain black shorts under the skirt (my choice, November 13: the top of a moving thigh can press through
    // the skirt's lace, and black on black does not show; the slit never opens that high when she stands).
    const cut = rings.findIndex((r) => r[0][1] < 0.845);
    addPart('cloth', loft(rings.slice(0, cut + 1), { uS: 1, vS: 1 }), (x, y) => wLeg(S, y), { out: V3(s * 0.086, 0.9, 0) });
    addPart('skin', loft(rings.slice(cut), { uS: 1, vS: 1 }), (x, y) => wLeg(S, y), { out: V3(s * 0.086, 0.6, 0) });
  }

  // ---------- the skirt: eight tiers of black lace over sheer black tulle, open in a slit over her left leg ----------
  // Stage one: it is stiff and turns with her hips. It becomes hanging cloth when the cloth is built.
  // A point of the skirt: a is the angle round her (0 at the front, a quarter turn at her left), k scales it out from its middle.
  const skirtPt = (y, a, k, dr) => { const [rx, rz, cz] = spline(IO_SKIRT_UP, cl(y, 0.15, 1.06)); return [(rx * k + (dr || 0)) * Math.sin(a), y, cz + (rz * k + (dr || 0)) * Math.cos(a)]; };
  const slitW = (y) => (y >= IO_SLIT_TOP ? 0 : prof(IO_SLIT_W, y, true));
  // The skirt hangs from twelve chains round her hips (November 13: "the fabric that's on her" moves with her). Above the first joint it is fixed to her hips.
  const SK_N = 12, SK_Y = [1.02, 0.90, 0.78, 0.66, 0.54, 0.42, 0.30, 0.18], skChains = [];
  for (let c = 0; c < SK_N; c++) { const a = (c / SK_N) * TAU; skChains.push(addChain('skirt', 'sk' + c, 'hips', SK_Y.map((y) => V3(...skirtPt(y, a, 0.96, 0))), { a })); }
  function wSkirt(x, y, z) {
    if (y >= SK_Y[0]) return [BI.hips, 1];
    const [rx, rz, cz] = spline(IO_SKIRT_UP, cl(y, 0.15, 1.06)); let a = Math.atan2(x / rx, (z - cz) / rz); if (a < 0) a += TAU;
    const f = (a / TAU) * SK_N, c0 = Math.floor(f) % SK_N;
    return mixW(chainW(skChains[c0], y), chainW(skChains[(c0 + 1) % SK_N], y), f - Math.floor(f));
  }
  // hems come down in points: a ragged zigzag, different on every tier
  const hemDrop = (a, ph, n) => { const t = ((a * n / TAU + ph) % 1 + 1) % 1, tri = 1 - Math.abs(t * 2 - 1); return 0.040 * tri * tri * (3 - 2 * tri) + 0.012 * Math.sin(a * 3 + ph * 9); };
  function skirtLayer(key, yTop, yHem, k0, k1, ph, np, rag, uRep) {
    const NU = Q(150, 72), NV = Q(16, 8), rings = [], vs = [];
    for (let i = 0; i <= NV; i++) {
      const t = i / NV, ring = [];
      for (let j = 0; j < NU; j++) {
        const f = j / (NU - 1), hem = yHem - rag * hemDrop(f * TAU, ph, np), y = lerp(yTop, hem, t), w = slitW(y);
        const a = IO_SLIT_MID + w / 2 + (TAU - w) * f;                                        // the ring runs from one edge of the slit round her back to the other
        const fold = 0.007 * Math.sin(a * 13 + ph * 20) * t + 0.003 * Math.sin(a * 29 + ph * 7) * t * t;     // soft upright folds that deepen toward the hem
        ring.push(skirtPt(y, a, lerp(k0, k1, t), fold + 0.006 * t * t));
      }
      rings.push(ring); vs.push(t);
    }
    addPart(key, loft(rings, { open: true, v: vs, uS: uRep }), wSkirt, { out: V3(0, (yTop + yHem) / 2, IO_SKIRT_CZ) });
  }
  const TIER_HEM = [0.945, 0.830, 0.715, 0.600, 0.485, 0.370, 0.255, 0.165];
  // a plain black lining, so nothing shows between the tiers; under it the tulle, which shows below the last tier as a soft ragged edge
  skirtLayer('band', 0.930, 0.300, 0.890, 0.900, 0.5, 9, 0, 4);
  skirtLayer('tulle', 0.900, 0.150, 0.910, 0.945, 0.37, 11, 1.2, 6);
  for (let i = 0; i < TIER_HEM.length; i++) {
    const top = i === 0 ? 1.058 : TIER_HEM[i - 1] + 0.070;
    skirtLayer('skirt', top, TIER_HEM[i], i === 0 ? 1.0 : 0.950, i === 0 ? 1.0 : 0.985, 0.13 + i * 0.29, 6 + (i * 3) % 4, 1, 5);
  }
  // the waistband
  (function waistband() {
    const rings = []; for (const [y, k, d] of [[1.040, 1.0, 0.004], [1.050, 1.0, 0.006], [1.064, 1.0, 0.006], [1.070, 1.0, 0.003]]) { const ring = [], NU = Q(96, 48); for (let j = 0; j < NU; j++) ring.push(skirtPt(Math.min(y, 1.06), (j / NU) * TAU, k, d + (y > 1.06 ? -0.004 : 0))); for (const p of ring) p[1] = y; rings.push(ring); }
    addPart('band', loft(rings, { uS: 8, vS: 0.2 }), wSkirt, { out: V3(0, 1.055, IO_SKIRT_CZ) });
  })();
  // ---------- Io, stage one: the Jester's boot builder, made 5.5 cm taller and wider in the shaft, with a short black sock.
  //            Her own boot (E1 to E8: the strap and buckle, ten eyelets, gold stitching) is built in the boots stage.
  // ---------- the Jester's notes: her boots, from the eight boot paintings (references/boots): tall lace-up boots in crinkled patent leather, yellow stitching,
  //            silver eyelets, a ridged platform sole with lugs and a block heel, and a ribbed cream sock with two stripes ----------
  // Measured from the side painting at 0.28 mm a pixel: the sole is 26 cm long, 4.5 cm deep at the toe and 6.6 cm at the heel; the collar is 26 cm up.
  function wBoot(S, y, z) {
    if (y > 0.10) { const u = sm(0.085, 0.165, y); return [BI['foot' + S], 1 - u, BI['shin' + S], u]; }
    const t = sm(0.085, 0.125, z) * (1 - sm(0.07, 0.11, y)); return [BI['foot' + S], 1 - t, BI['toe' + S], t];
  }
  const B_TOP = 0.317, B_E = 2 / 2.2;
  // shaft: height -> [half-width, front, back, centre z]; below the ankle the front runs out along the instep
  const B_SH = [[0.066, [0.0460, 0.118, 0.052, -0.008]], [0.092, [0.0445, 0.111, 0.053, -0.008]], [0.1044, [0.0430, 0.096, 0.052, -0.008]], [0.1184, [0.0410, 0.080, 0.046, -0.008]], [0.1344, [0.0398, 0.066, 0.042, -0.008]],
    [0.153, [0.0405, 0.057, 0.042, -0.008]], [0.20, [0.0440, 0.050, 0.050, -0.008]], [0.317, [0.0480, 0.053, 0.054, -0.008]], [0.335, [0.0480, 0.053, 0.054, -0.008]]];
  // foot: z -> [half-width, height above the sole]
  const B_FT = [[-0.066, [0.018, 0.030]], [-0.058, [0.032, 0.070]], [-0.035, [0.040, 0.098]], [0.0, [0.042, 0.108]], [0.049, [0.044, 0.103]], [0.066, [0.045, 0.084]], [0.088, [0.046, 0.057]], [0.112, [0.0465, 0.046]],
    [0.135, [0.0455, 0.042]], [0.155, [0.042, 0.039]], [0.168, [0.034, 0.032]], [0.176, [0.021, 0.021]], [0.1795, [0.008, 0.009]]];
  // sole: its top edge (the welt) by z, and its half-width in plan
  const B_YT = [[-0.080, 0.066], [-0.060, 0.064], [-0.021, 0.060], [0.021, 0.056], [0.063, 0.048], [0.105, 0.040], [0.147, 0.043], [0.192, 0.049]];
  const B_HW = [[-0.076, 0], [-0.0745, 0.014], [-0.070, 0.030], [-0.058, 0.041], [-0.035, 0.046], [0.0, 0.046], [0.035, 0.045], [0.07, 0.050], [0.11, 0.055], [0.145, 0.054], [0.170, 0.044], [0.182, 0.028], [0.1865, 0.014], [0.188, 0]];
  const B_Z0 = -0.076, B_Z1 = 0.188, B_LUG = 0.0126;
  const bTop = (z) => spline(B_YT, cl(z, -0.08, 0.192)), bHw = (z) => Math.max(0, spline(B_HW, cl(z, B_Z0, B_Z1)));
  const bBot = (z) => B_LUG + 0.025 * sm(0.014, 0.026, z) * (1 - sm(0.044, 0.058, z));      // the arch is cut up between the heel and the forefoot
  for (const [S, s] of SIDES) {
    const cx = s * 0.081, wf = (x, y, z) => wBoot(S, y, z), wShin = () => [BI['shin' + S], 1], NU = Q(36, 18), AX = V3(cx, 0.16, -0.008);
    const shaftPt = (y, a) => { const [rx, rzF, rzB, cz] = prof(B_SH, cl(y, 0.066, 0.280), true), sn = Math.sin(a), c = Math.cos(a); return V3(cx + rx * Math.sign(sn) * Math.pow(Math.abs(sn), B_E), y, cz + (c >= 0 ? rzF : rzB) * Math.sign(c) * Math.pow(Math.abs(c), B_E)); };
    const footPt = (z, a) => { const [w, h] = prof(B_FT, cl(z, -0.066, 0.1795), true), c = Math.cos(a), sn = Math.sin(a); return V3(cx + w * Math.sign(c) * Math.pow(Math.abs(c), 0.8), bTop(z) - 0.001 + (sn >= 0 ? h * Math.pow(sn, 0.85) : 0.004 * sn), z); };
    const nrm = (fn, u, v, du, dv, inside) => { const p = fn(u, v), n = fn(u + du, v).sub(fn(u - du, v)).cross(fn(u, v + dv).sub(fn(u, v - dv))).normalize(); if (n.dot(p.clone().sub(inside)) < 0) n.negate(); return { p, n }; };
    const onShaft = (y, a) => nrm(shaftPt, y, a, 0.002, 0.02, V3(cx, y, 0.0)), onFoot = (z, a) => nrm(footPt, z, a, 0.002, 0.02, V3(cx, bTop(z) + 0.02, z));
    // ---- the upper: shaft, then the foot from heel to toe ----
    const rings = [], NR = Q(30, 14);
    for (let i = 0; i <= NR; i++) { const y = lerp(B_TOP + 0.012, 0.066, Math.pow(i / NR, 0.9)), [rx, rzF, rzB, cz] = prof(B_SH, y, true); rings.push(ringXZ(cx, y, cz, rx, rzF, rzB, NU, 2.2)); }
    rings.unshift(ringXZ(cx, B_TOP + 0.004, -0.008, 0.0440, 0.049, 0.050, NU, 2.2), ringXZ(cx, B_TOP + 0.0145, -0.008, 0.0455, 0.0505, 0.0515, NU, 2.2));      // the bound edge of the collar, turned in
    addPart('boot', loft(rings, { uS: 2, vS: 1.7 }), wf, { out: AX });
    const fr = [], NF = Q(26, 12), NZ = Q(30, 14);
    for (let i = 0; i <= NZ; i++) { const u = i / NZ, z = lerp(-0.066, 0.1795, u * u * (3 - 2 * u) * 0.3 + u * 0.7), ring = []; for (let j = 0; j < NF; j++) { const p = footPt(z, (j / NF) * TAU); ring.push([p.x, p.y, p.z]); } fr.push(ring); }
    addPart('boot', loft(fr, { capA: true, capB: true, uS: 2, vS: 1.4 }), wf, { out: V3(cx, 0.08, 0.05) });
    // the tongue stands a little above the collar at the front
    { const tr = [], A0 = 0.62, NT = Q(12, 6);
      for (const [y, k, th] of [[B_TOP - 0.02, 1.0, 0.004], [B_TOP + 0.020, 1.0, 0.004], [B_TOP + 0.027, 0.86, 0.004], [B_TOP + 0.030, 0.6, 0.003]]) {
        const ring = []; for (let j = 0; j <= NT; j++) { const a = lerp(-A0, A0, j / NT) * k, p = shaftPt(Math.min(y, 0.279), a); ring.push([p.x, y, p.z - 0.0025]); }
        for (let j = NT; j >= 0; j--) { const a = lerp(-A0, A0, j / NT) * k, p = shaftPt(Math.min(y, 0.279), a); ring.push([cx + (p.x - cx) * 0.93, y, p.z - 0.0025 - th]); }
        tr.push(ring);
      }
      addPart('boot', loft(tr, { capB: true, uS: 0.6, vS: 0.2 }), wShin, { out: V3(cx, B_TOP, 0.02) });
    }
    // ---- the sole: a ridged wall from the lugs up to the welt, flaring a little toward the ground ----
    const NO = Q(64, 32), zm = (B_Z0 + B_Z1) / 2, half = (B_Z1 - B_Z0) / 2, plan = [];
    for (let j = 0; j < NO; j++) { const a = (j / NO) * TAU, c = Math.cos(a), z = zm + half * Math.sign(c) * Math.pow(Math.abs(c), 0.86); plan.push([Math.sin(a) >= 0 ? 1 : -1, z]); }
    const sring = (yf, k) => plan.map(([sd, z]) => [cx + sd * bHw(z) * (1 + k), yf(z), zm + (z - zm) * (1 + k * 0.32)]);
    const wall = loft([sring((z) => bBot(z) - 0.0015, 0.045), sring(bBot, 0.075), sring((z) => bBot(z) + 0.004, 0.082), sring((z) => bTop(z) - 0.0045, 0.012), sring(bTop, 0.0), sring((z) => bTop(z) + 0.0004, -0.035)], { capA: true, capB: true, uS: 6 });
    for (let i = 0; i < wall.pos.length / 3; i++) wall.uv[i * 2 + 1] = wall.pos[i * 3 + 1] / 0.07;
    addPart('sole', wall, wf, { out: V3(cx, 0.03, zm) });
    // lugs: blocks round the edge of the forefoot and the heel, and bars across the middle of each
    const lug = (x0, x1, z0, z1, x0b, x1b) => {       // a block from the ground up into the sole; its outer side can follow the outline (x at z0, x at z1)
      const q = (y, k) => [[cx + x0 * k, y, z0], [cx + (x0b == null ? x0 : x0b) * k, y, z1], [cx + (x1b == null ? x1 : x1b) * k, y, z1], [cx + x1 * k, y, z0]];
      const p = loft([q(0, 0.985), q(0.002, 1), q(Math.max(bBot(z0), bBot(z1)) + 0.002, 1)], { capA: true, uS: 0.4 }); for (let i = 0; i < p.pos.length / 3; i++) p.uv[i * 2 + 1] = 0.01;
      addPart('sole', p, wf, { out: V3(cx + (x0 + x1) / 2, 0.006, (z0 + z1) / 2) });
    };
    const side = (z0, z1) => { for (const sd of [-1, 1]) lug(sd * (bHw(z0) * 1.07), sd * (bHw(z0) * 1.07 - 0.019), z0, z1, sd * (bHw(z1) * 1.07), sd * (bHw(z1) * 1.07 - 0.019)); };
    for (let k = 0; k < 7; k++) side(0.060 + k * 0.0165, 0.060 + k * 0.0165 + 0.0122);
    for (let k = 0; k < 4; k++) side(-0.060 + k * 0.0185, -0.060 + k * 0.0185 + 0.0140);
    for (const x of [-0.021, 0, 0.021]) { lug(x - 0.0085, x + 0.0085, 0.174 - Math.abs(x) * 0.25, 0.1905 - Math.abs(x) * 0.5); lug(x - 0.0085, x + 0.0085, -0.0775 + Math.abs(x) * 0.35, -0.064 + Math.abs(x) * 0.2); }
    for (const z of [0.074, 0.099, 0.124, 0.149]) lug(-0.022, 0.022, z - 0.006, z + 0.006);
    for (const z of [-0.047, -0.024, -0.001]) lug(-0.019, 0.019, z - 0.006, z + 0.006);
    // ---- stitching: small yellow dashes lying on the leather, in double rows along every seam, and one row round the welt ----
    const ST = { pos: [], uv: [], idx: [], nor: [] }, PITCH = 0.0042 / Math.max(0.6, DET);
    const dash = (p, n, t, hl, hw) => {
      const sv = V3().crossVectors(n, t).normalize(), b = ST.pos.length / 3, c = p.clone().addScaledVector(n, 0.0005);
      for (const [a, w] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const v = c.clone().addScaledVector(t, a * hl).addScaledVector(sv, w * hw); ST.pos.push(v.x, v.y, v.z); ST.nor.push(n.x, n.y, n.z); ST.uv.push(0, 0); }
      ST.idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    };
    const stitch = (fn, n, hl, hw) => {               // fn(t in 0..1) -> { p, n }; n samples to measure the path
      const P = []; for (let i = 0; i <= n; i++) P.push(fn(i / n));
      let acc = PITCH / 2, L = 0;
      for (let i = 0; i < n; i++) { const d = P[i].p.distanceTo(P[i + 1].p), t = P[i + 1].p.clone().sub(P[i].p).normalize(); while (acc < L + d) { const u = (acc - L) / d; dash(P[i].p.clone().lerp(P[i + 1].p, u), P[i].n, t, hl || 0.0014, hw || 0.00045); acc += PITCH; } L += d; }
      return P;
    };
    const path = (fn, n) => { const P = []; for (let i = 0; i <= n; i++) P.push(fn(i / n)); return P; };
    const seam = (P, r) => addPart('boot', loft(tubeRings(P.map((e) => e.p.clone().addScaledVector(e.n, -r * 0.45)), P.map(() => r), 5)), wf, { out: AX });
    const ASTAY = 0.86;
    for (const sd of [-1, 1]) {
      for (const da of [0, 0.085]) stitch((t) => onShaft(lerp(B_TOP - 0.004, 0.112, t), sd * (ASTAY + da + 0.25 * sm(0.55, 1, t))), 40);                     // the edge of the eyelet stay
      seam(path((t) => onShaft(lerp(B_TOP + 0.004, 0.110, t), sd * (ASTAY - 0.07 + 0.25 * sm(0.55, 1, t))), 30), 0.0012);
      for (const da of [0.075, 0.125]) stitch((t) => onShaft(lerp(B_TOP - 0.004, 0.074, t), PI + sd * da), 40);                                               // the strap up the back
      seam(path((t) => onShaft(lerp(B_TOP + 0.004, 0.072, t), PI + sd * 0.165), 24), 0.0012);
      for (const dy of [0, 0.0042]) stitch((t) => onShaft(0.168 - dy - 0.098 * Math.pow(t, 1.6), PI - sd * (0.165 + 1.22 * Math.pow(t, 0.8))), 40);         // the heel counter
      seam(path((t) => onShaft(0.1725 - 0.098 * Math.pow(t, 1.6), PI - sd * (0.165 + 1.22 * Math.pow(t, 0.8))), 24), 0.0012);
      stitch((t) => onShaft(B_TOP - 0.0045, sd * lerp(ASTAY + 0.085, PI - 0.125, t)), 40);                                                                    // under the collar
    }
    for (const z of [0.1125, 0.1170]) stitch((t) => onFoot(z, lerp(0.03, PI - 0.03, t)), 40);                                                                   // the toe cap
    seam(path((t) => onFoot(0.1205, lerp(0.0, PI, t)), 24), 0.0014);
    { const q = (k) => { const [sd, z] = plan[((k % NO) + NO) % NO]; return V3(cx + sd * bHw(z) * 1.012, bTop(z) - 0.0032, zm + (z - zm) * 1.004); };            // the welt: bold stitches round the top edge of the sole
      stitch((t) => { const j = t * NO, j0 = Math.floor(j), f = j - j0, p = q(j0).lerp(q(j0 + 1), f), tg = q(j0 + 1).sub(q(j0)), n = V3(tg.z, 0, -tg.x).normalize(); if (n.dot(V3(p.x - cx, 0, p.z - zm)) < 0) n.negate(); return { p, n }; }, NO * 2, 0.0015, 0.0008); }
    addPart('stitch', ST, wf, { nor: ST.nor });
    // ---- eyelets and laces ----
    const NE = 10, EY = [0.2520, 0.2330, 0.2140, 0.1950, 0.1760, 0.1570, 0.1395, 0.1240, 0.1115, 0.1010], AE = 0.50;
    const eye = (k, sd) => { const e = onShaft(EY[k], sd * (AE + 0.10 * sm(0.16, 0.10, EY[k]))); e.p.addScaledVector(e.n, 0.0008); return e; };
    for (let k = 0; k < NE; k++) for (const sd of [-1, 1]) {
      const e = eye(k, sd), t1 = V3(0, 1, 0).cross(e.n).normalize(), t2 = V3().crossVectors(e.n, t1), ring = [];
      for (let j = 0; j <= 10; j++) { const a = (j / 10) * TAU; ring.push(e.p.clone().addScaledVector(t1, 0.0044 * Math.cos(a)).addScaledVector(t2, 0.0044 * Math.sin(a))); }
      addPart('eyelet', loft(tubeRings(ring, ring.map(() => 0.00155), 6)), wf, { out: e.p });
    }
    const lace = (a, b, lift, key) => { const m = a.p.clone().lerp(b.p, 0.5).addScaledVector(a.n.clone().add(b.n).normalize(), lift), pts = curvePts([a.p, m, b.p], 7); addPart(key || 'lace', loft(tubeRings(pts, pts.map(() => 0.0020), 6), { capA: true, capB: true }), wf, { out: m.clone().addScaledVector(a.n, -0.02) }); };
    for (let k = NE - 1; k > 0; k--) { lace(eye(k, -1), eye(k - 1, 1), 0.0125 + 0.0012 * (k % 2)); lace(eye(k, 1), eye(k - 1, -1), 0.0110 - 0.0012 * (k % 2)); }
    lace(eye(NE - 1, -1), eye(NE - 1, 1), 0.0075);
    // the bow at the top: a knot, two drooping loops and two tails with metal tips
    const K0 = onShaft(EY[0] + 0.003, 0), K = K0.p.clone().addScaledVector(K0.n, 0.007), tube = (key, pts, r, o) => addPart(key, loft(tubeRings(pts, pts.map(() => r), 6), o), wShin, { out: pts[Math.floor(pts.length / 2)].clone().add(V3(0, 0, -0.03)) });
    addPart('lace', spherePart(K, 0.0052, 0.0044, 0.0044, 10, 8), wShin, { out: K });
    for (const sd of [-1, 1]) {
      lace(eye(0, sd), { p: K, n: K0.n }, 0.003);
      const lp = []; for (let j = 0; j <= 14; j++) { const a = (j / 14) * TAU, w = (1 - Math.cos(a)) / 2; lp.push(V3(K.x + sd * (0.003 + 0.047 * w), K.y - 0.024 * w + 0.013 * Math.sin(a) * (1 - 0.3 * w), K.z + 0.004 + 0.012 * w - 0.02 * w * w)); }
      tube('lace', lp, 0.0020);
      const tl = curvePts([K.clone(), V3(K.x + sd * 0.016, K.y - 0.026, K.z + 0.010), V3(K.x + sd * (0.026 + 0.004 * s * sd), K.y - 0.058, K.z + 0.008), V3(K.x + sd * 0.030, K.y - 0.084, K.z + 0.004)], 10);
      tube('lace', tl, 0.0020);
      const e0 = tl[tl.length - 1], e1 = e0.clone().add(e0.clone().sub(tl[tl.length - 2]).normalize().multiplyScalar(0.013));
      tube('aglet', [e0, e1], 0.0026, { capA: true, capB: true });
    }
    // ---- the sock: a ribbed cuff showing above the collar ----
    const SK_Y = [[0.300, 0], [0.317, 0.0], [0.352, 0.0008], [0.3570, 0.0], [0.3590, -0.0016], [0.3570, -0.0034], [0.350, -0.0040]], sr = [];
    for (const [y, d] of SK_Y) sr.push(ringXZ(cx, y, -0.010, 0.0490 + d, 0.0515 + d, 0.0525 + d, NU, 2.1));
    const sock = loft(sr, { uS: 1 }); for (let i = 0; i < sock.pos.length / 3; i++) sock.uv[i * 2 + 1] = cl((sock.pos[i * 3 + 1] - 0.300) / 0.060, 0, 1);
    addPart('sock', sock, wShin, { out: V3(cx, 0.335, -0.010) });
  }
  // ---------- hands: one continuous skin, grown from a soft solid and cut into triangles ----------
  // The hand is described as a solid: a palm slab, the two mounds at its heel, four fingers and a thumb, blended where they meet.
  // Its surface is then found on a fine grid, so the webs between the fingers, the root of the thumb and the knuckles are one piece
  // of skin with no joins. Canonical hand space: fingers along -Y, palm toward +X, thumb toward +Z, the wrist joint at the origin;
  // metres. Sizes are read off the young-hand painting (see FINGERS). The left hand is the mirror of the right.
  const HAND_GEO = (() => {
    const gs = (d, w) => Math.exp(-d * d / (w * w));
    const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
    // --- a digit: a bent-free tube with its own width, pad and crease tables, one entry every quarter millimetre ---
    const LS = 0.00025, LT0 = -0.03;
    const mkDigit = (name, base, dir, nrm, len, r0, j1, j2, web, o) => {
      const d = V3(...dir).normalize(), n = V3(...nrm); n.addScaledVector(d, -n.dot(d)).normalize(); const sd = V3().crossVectors(d, n);
      const N = Math.ceil((len + 0.05) / LS) + 2, rb = new Float32Array(N), rd = new Float32Array(N), rp = new Float32Array(N);
      const rt = o.tipLen * r0 * o.taper[o.taper.length - 1][1], tc = len - rt;
      for (let i = 0; i < N; i++) {
        const tt = LT0 + i * LS, r = r0 * spline(o.taper, cl(tt / len, 0, 1)) * (1 + (o.bulge1 || 0.035) * gs(tt - j1, 0.0050) + 0.028 * gs(tt - j2, 0.0040));
        const seg = tt < j1 ? cl((tt - web) / Math.max(1e-6, j1 - web), 0, 1) : tt < j2 ? (tt - j1) / (j2 - j1) : cl((tt - j2) / (len - j2), 0, 1);
        const pad = Math.pow(Math.sin(seg * PI), 0.8) * (tt > j2 ? 1.3 : 1) * (tt < web ? 0 : 1);       // the fleshy pads between the creases, fullest at the fingertip
        const crease = gs(tt - j1, 0.0013) + gs(tt - j2, 0.0012) + (o.baseCrease == null ? 0.8 : o.baseCrease) * gs(tt - web - 0.003, 0.0014);
        const wrinkle = gs(tt - j1, 0.0030) + 0.6 * gs(tt - j2, 0.0026);                               // the folds of skin over each joint, on the back
        const bed = sm(len - 0.0125, len - 0.008, tt);                                                 // the nail bed is a little flatter
        rb[i] = r * (1 - 0.02 * crease);
        rp[i] = r * (0.90 + 0.115 * pad) - 0.00048 * crease;
        rd[i] = r * (0.905 + 0.034 * wrinkle - 0.05 * bed);
      }
      return { name, bx: base[0], by: base[1], bz: base[2], dx: d.x, dy: d.y, dz: d.z, nx: n.x, ny: n.y, nz: n.z, sx: sd.x, sy: sd.y, sz: sd.z,
        len, r0, j1, j2, web, tc, rt, up: 0.42 * r0 * o.taper[o.taper.length - 1][1], rcap: 1.2 * r0, rb, rd, rp, texRot: o.texRot || 0, t0: o.t0, Lp: len - o.t0, start: o.start, tt: 0, a: 0, b: 0, f: 0 };
    };
    const digitF = (D, x, y, z) => {
      const qx = x - D.bx, qy = y - D.by, qz = z - D.bz;
      const tt = qx * D.dx + qy * D.dy + qz * D.dz, a = qx * D.nx + qy * D.ny + qz * D.nz, b = qx * D.sx + qy * D.sy + qz * D.sz;
      D.tt = tt; D.a = a; D.b = b;
      if (tt < -0.028 || tt > D.len + 0.018 || a * a + b * b > 0.00081) return (D.f = 0.03);
      const fi = (tt - LT0) / LS, i0 = Math.floor(fi), u = fi - i0;
      const rb = D.rb[i0] + (D.rb[i0 + 1] - D.rb[i0]) * u, ra = a > 0 ? D.rp[i0] + (D.rp[i0 + 1] - D.rp[i0]) * u : D.rd[i0] + (D.rd[i0 + 1] - D.rd[i0]) * u;
      const ax = tt > D.tc ? (tt - D.tc) / D.rt : tt < 0 ? -tt / D.rcap : 0, as = tt > D.tc ? a + D.up * ax * ax : a;      // the end of the finger turns up to meet the nail
      return (D.f = (Math.sqrt(as * as / (ra * ra) + b * b / (rb * rb) + ax * ax) - 1) * Math.min(ra, rb));
    };
    // where a digit's skin lies, at a distance tt along it and an angle th round it (0 on the palm side, PI on the back)
    const digitR = (D, tt, th) => {
      const fi = cl((tt - LT0) / LS, 0, D.rb.length - 2), i0 = Math.floor(fi), u = fi - i0, c = Math.cos(th), s = Math.sin(th);
      const rb = D.rb[i0] + (D.rb[i0 + 1] - D.rb[i0]) * u, ra = c > 0 ? D.rp[i0] + (D.rp[i0 + 1] - D.rp[i0]) * u : D.rd[i0] + (D.rd[i0 + 1] - D.rd[i0]) * u;
      const ax = tt > D.tc ? Math.min(1, (tt - D.tc) / D.rt) : 0;
      return Math.sqrt(Math.max(0, 1 - ax * ax)) / Math.sqrt(c * c / (ra * ra) + s * s / (rb * rb));
    };
    const digitUp = (D, tt) => (tt > D.tc ? D.up * Math.pow(Math.min(1, (tt - D.tc) / D.rt), 2) : 0);
    const digitP = (D, tt, a, b) => [D.bx + D.dx * tt + D.nx * a + D.sx * b, D.by + D.dy * tt + D.ny * a + D.sy * b, D.bz + D.dz * tt + D.nz * a + D.sz * b];
    const FTAPER = [[0, 1.10], [0.14, 1.03], [0.30, 0.995], [0.50, 0.975], [0.62, 0.905], [0.755, 0.885], [0.88, 0.85], [1, 0.83]];
    const DG = FINGERS.map(([fn, fz, fy, fl, fr, fa, dk]) => mkDigit(fn, [0, fy, fz], fingerDir(fa), [1, 0, 0], fl, fr, fl * PHAL[0], fl * (PHAL[0] + PHAL[1]), dk, { taper: FTAPER, tipLen: 1.16, t0: dk, start: dk + 0.003 }));
    // the thumb is turned on its own axis: its pad faces the fingers, its nail faces out to the side
    const TD = V3(...THUMB.dir).normalize(), TN0 = V3(1, 0, 0); TN0.addScaledVector(TD, -TN0.dot(TD)).normalize(); const TB0 = V3().crossVectors(TD, TN0);
    const TNP = TN0.clone().multiplyScalar(Math.cos(THUMB.roll)).addScaledVector(TB0, -Math.sin(THUMB.roll));
    const TL = THUMB.len[0] + THUMB.len[1] + THUMB.len[2];
    DG.push(mkDigit('thb', THUMB.base, THUMB.dir, [TNP.x, TNP.y, TNP.z], TL, THUMB.r, THUMB.len[0], THUMB.len[0] + THUMB.len[1], THUMB.len[0],
      { taper: [[0, 1.30], [0.2, 1.24], [0.433, 1.07], [0.59, 1.0], [0.744, 0.985], [0.87, 0.93], [1, 0.86]], tipLen: 1.08, bulge1: 0.085, baseCrease: 0, texRot: -THUMB.roll, t0: THUMB.len[0], start: THUMB.len[0] + 0.010 }));
    // --- the palm: a rounded slab whose outline is the painted one: [y, [centre z, half width, half thickness to the back, to the palm]] ---
    const SLAB = [[0.040, [0.0070, 0.0230, 0.0165, 0.0165]], [0.018, [0.0066, 0.0234, 0.0162, 0.0165]], [0.000, [0.0059, 0.0249, 0.0150, 0.0158]], [-0.010, [0.0052, 0.0268, 0.0136, 0.0146]],
      [-0.020, [0.0041, 0.0299, 0.0124, 0.0132]], [-0.035, [0.0030, 0.0325, 0.0115, 0.0120]], [-0.050, [0.0029, 0.0341, 0.0111, 0.0115]], [-0.065, [0.0027, 0.0358, 0.0103, 0.0112]],
      [-0.078, [0.0022, 0.0358, 0.0092, 0.0106]], [-0.090, [0.0020, 0.0352, 0.0080, 0.0094]], [-0.100, [0.0020, 0.0340, 0.0074, 0.0086]]];
    SLAB.reverse();
    const SY0 = -0.112, SYS = 0.0005, SN = Math.ceil((0.046 - SY0) / SYS) + 2, sC = new Float32Array(SN), sW = new Float32Array(SN), sD = new Float32Array(SN), sP = new Float32Array(SN);
    for (let i = 0; i < SN; i++) { const p = spline(SLAB, cl(SY0 + i * SYS, -0.100, 0.040)); sC[i] = p[0]; sW[i] = p[1]; sD[i] = p[2]; sP[i] = p[3]; }
    const WEB_Y = -0.0875;
    const slabF = (x, y, z) => {
      const fi = cl((y - SY0) / SYS, 0, SN - 2), i0 = Math.floor(fi), u = fi - i0;
      const cz = sC[i0] + (sC[i0 + 1] - sC[i0]) * u, hz = sW[i0] + (sW[i0 + 1] - sW[i0]) * u, hd = sD[i0] + (sD[i0 + 1] - sD[i0]) * u, hp = sP[i0] + (sP[i0 + 1] - sP[i0]) * u;
      const dz = z - cz, t = dz / hz, hx = x > 0 ? hp : hd * (1 - 0.10 * t * t), rc = 0.80 * Math.min(hd, hp);       // the back of the hand arches a little from side to side
      const qx = Math.abs(x) - (hx - rc), qz = Math.abs(dz) - (hz - rc), ox = qx > 0 ? qx : 0, oz = qz > 0 ? qz : 0;
      const f = Math.sqrt(ox * ox + oz * oz) + Math.min(Math.max(qx, qz), 0) - rc;
      const e = WEB_Y + 5.5 * (z - 0.008) * (z - 0.008) - y, k = 0.006, h = Math.max(k - Math.abs(f - e), 0) / k;    // the far end follows the line of the webs
      return Math.max(f, e) + h * h * k * 0.25;
    };
    const mkEll = (c, e1, r1, e2, r2, e3, r3) => ({ c, e1, e2, e3, r1, r2, r3, rm: Math.min(r1, r2, r3) });
    const ellF = (E, x, y, z) => {
      const qx = x - E.c[0], qy = y - E.c[1], qz = z - E.c[2];
      const u = (qx * E.e1.x + qy * E.e1.y + qz * E.e1.z) / E.r1, v = (qx * E.e2.x + qy * E.e2.y + qz * E.e2.z) / E.r2, w = (qx * E.e3.x + qy * E.e3.y + qz * E.e3.z) / E.r3;
      return (Math.sqrt(u * u + v * v + w * w) - 1) * E.rm;
    };
    const TH = mkEll([0.0120, -0.0270, 0.0310], TD, 0.0260, TN0, 0.0125, TB0, 0.0165);                 // the mound at the root of the thumb
    const HY = mkEll([0.0035, -0.0360, -0.0185], V3(0, 1, 0), 0.0300, V3(1, 0, 0), 0.0125, V3(0, 0, 1), 0.0125);   // the mound on the little-finger side
    const KZ = FINGERS.map((f) => f[1]), KY = FINGERS.map((f) => f[2]), KW = FINGERS.map((f) => f[2] - f[6]);
    const relief = (x, y, z) => {
      let b = 0;
      if (x < 0.003) {                                  // the back: a knuckle at the root of each finger, its tendon, the wrist bone
        const wd = sm(0.003, -0.003, x);
        if (y < -0.045 && y > -0.098) for (let k = 0; k < 4; k++) { const dy = y - KY[k] - 0.001, dz = z - KZ[k]; b += wd * 0.0013 * Math.exp(-dy * dy / 5.2e-5 - dz * dz / 3.2e-5); }
        if (y < -0.012 && y > -0.072) { const s01 = cl(-y / 0.072, 0, 1), al = sm(-0.012, -0.028, y) * sm(-0.072, -0.058, y); for (let k = 0; k < 4; k++) { const dz = z - (0.005 + (KZ[k] - 0.005) * lerp(0.42, 1, s01)); b += wd * 0.00026 * al * Math.exp(-dz * dz / 7e-6); } }
        if (y > -0.012) { const dy = y - 0.010, dz = z + 0.0165; b += wd * 0.0016 * Math.exp(-dy * dy / 6.4e-5 - dz * dz / 3.6e-5); }
      }
      if (x > -0.003) {                                 // the palm: a pad under each finger, a hollow in the middle
        const wp = sm(-0.003, 0.003, x);
        if (y < -0.055) for (let k = 0; k < 4; k++) { const dy = y - KW[k] - 0.009, dz = z - KZ[k]; b += wp * 0.0010 * Math.exp(-dy * dy / 4.2e-5 - dz * dz / 4.5e-5); }
        const dy = y + 0.047, dz = z - 0.004; b -= wp * 0.0021 * Math.exp(-dy * dy / 4.0e-4 - dz * dz / 1.5e-4);
      }
      return b;
    };
    // the web of skin between the thumb and the first finger: a thin bar from one knuckle to the other
    const WA = [0.004, -0.052, 0.0355], WB = [0.011, -0.044, 0.0425], WR = 0.0036, WSX = 1.5;
    const wbx = (WB[0] - WA[0]) * WSX, wby = WB[1] - WA[1], wbz = WB[2] - WA[2], wbb = wbx * wbx + wby * wby + wbz * wbz;
    const webF = (x, y, z) => {
      const px = (x - WA[0]) * WSX, py = y - WA[1], pz = z - WA[2], h = cl((px * wbx + py * wby + pz * wbz) / wbb, 0, 1);
      const ex = px - wbx * h, ey = py - wby * h, ez = pz - wbz * h; return Math.sqrt(ex * ex + ey * ey + ez * ez) - WR;
    };
    const F = (x, y, z) => {
      let f = slabF(x, y, z);
      f = smin(f, ellF(TH, x, y, z), 0.010); f = smin(f, ellF(HY, x, y, z), 0.010);
      if (f < 0.012) f -= relief(x, y, z);
      let ff = digitF(DG[0], x, y, z), g = digitF(DG[1], x, y, z); if (g < ff) ff = g;
      g = digitF(DG[2], x, y, z); if (g < ff) ff = g; g = digitF(DG[3], x, y, z); if (g < ff) ff = g;
      f = smin(f, ff, 0.0045);
      f = smin(f, digitF(DG[4], x, y, z), 0.0042);              // a tight blend: the notch between thumb and first finger is a narrow V
      return smin(f, webF(x, y, z), 0.0040);
    };
    // --- the surface: one point in every grid cell the skin passes through, joined to its neighbours (surface nets) ---
    const h = LOD.handCell || (opts.handGrid || 0.00125) / (DET * DET);      // 1.25 mm cells at full detail, 2.2 mm on phones
    const X0 = -0.026, X1 = 0.038, Y0 = -0.184, Y1 = 0.034, Z0 = -0.052, Z1 = 0.082;
    const nx = Math.ceil((X1 - X0) / h) + 1, ny = Math.ceil((Y1 - Y0) / h) + 1, nz = Math.ceil((Z1 - Z0) / h) + 1, nxy = nx * ny;
    const val = new Float32Array(nxy * nz).fill(NaN);
    {                                                   // a coarse look first, so the fine grid is only worked out near the skin
      const C = 3, band = 4.8 * h, mx = Math.ceil((nx - 1) / C), my = Math.ceil((ny - 1) / C), mz = Math.ceil((nz - 1) / C), cv = new Float32Array((mx + 1) * (my + 1) * (mz + 1));
      for (let k = 0; k <= mz; k++) for (let j = 0; j <= my; j++) for (let i = 0; i <= mx; i++) cv[(k * (my + 1) + j) * (mx + 1) + i] = Math.abs(F(X0 + Math.min(i * C, nx - 1) * h, Y0 + Math.min(j * C, ny - 1) * h, Z0 + Math.min(k * C, nz - 1) * h));
      for (let k = 0; k < mz; k++) for (let j = 0; j < my; j++) for (let i = 0; i < mx; i++) {
        let m = Infinity;
        for (let c = 0; c < 8; c++) { const v = cv[((k + (c >> 2)) * (my + 1) + j + ((c >> 1) & 1)) * (mx + 1) + i + (c & 1)]; if (v < m) m = v; }
        if (m > band) continue;
        const i1 = Math.min((i + 1) * C, nx - 1), j1 = Math.min((j + 1) * C, ny - 1), k1 = Math.min((k + 1) * C, nz - 1);
        for (let kk = k * C; kk <= k1; kk++) for (let jj = j * C; jj <= j1; jj++) for (let ii = i * C; ii <= i1; ii++) { const p = kk * nxy + jj * nx + ii; if (val[p] !== val[p]) val[p] = F(X0 + ii * h, Y0 + jj * h, Z0 + kk * h); }
      }
    }
    const cellV = new Int32Array(nxy * nz).fill(-1), P = [];
    {
      const OFF = [0, 1, nx, nx + 1, nxy, nxy + 1, nxy + nx, nxy + nx + 1], EA = [0, 2, 4, 6, 0, 1, 4, 5, 0, 1, 2, 3], EB = [1, 3, 5, 7, 2, 3, 6, 7, 4, 5, 6, 7], cvv = new Float32Array(8);
      for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
        const p = k * nxy + j * nx + i; let neg = 0, ok = true;
        for (let c = 0; c < 8; c++) { const v = val[p + OFF[c]]; if (v !== v) { ok = false; break; } cvv[c] = v; if (v < 0) neg++; }
        if (!ok || neg === 0 || neg === 8) continue;
        let sx = 0, sy = 0, sz = 0, n = 0;
        for (let e = 0; e < 12; e++) {
          const a = EA[e], b = EB[e], va = cvv[a], vb = cvv[b]; if ((va < 0) === (vb < 0)) continue;
          const t = va / (va - vb); sx += (a & 1) + ((b & 1) - (a & 1)) * t; sy += ((a >> 1) & 1) + (((b >> 1) & 1) - ((a >> 1) & 1)) * t; sz += (a >> 2) + ((b >> 2) - (a >> 2)) * t; n++;
        }
        cellV[p] = P.length / 3; P.push(X0 + (i + sx / n) * h, Y0 + (j + sy / n) * h, Z0 + (k + sz / n) * h);
      }
    }
    const quads = [];
    for (let k = 1; k < nz - 1; k++) for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
      const p = k * nxy + j * nx + i, v0 = val[p]; if (v0 !== v0) continue;
      const n0 = v0 < 0; let v1 = val[p + 1], a, b, c, d;
      if (v1 === v1 && n0 !== (v1 < 0)) { a = cellV[p - nx - nxy]; b = cellV[p - nxy]; c = cellV[p]; d = cellV[p - nx]; if (a >= 0 && b >= 0 && c >= 0 && d >= 0) quads.push(a, b, c, d); }
      v1 = val[p + nx];
      if (v1 === v1 && n0 !== (v1 < 0)) { a = cellV[p - 1 - nxy]; b = cellV[p - nxy]; c = cellV[p]; d = cellV[p - 1]; if (a >= 0 && b >= 0 && c >= 0 && d >= 0) quads.push(a, b, c, d); }
      v1 = val[p + nxy];
      if (v1 === v1 && n0 !== (v1 < 0)) { a = cellV[p - 1 - nx]; b = cellV[p - nx]; c = cellV[p]; d = cellV[p - 1]; if (a >= 0 && b >= 0 && c >= 0 && d >= 0) quads.push(a, b, c, d); }
    }
    // --- settle every point onto the true skin, and take its facing from the solid itself (so creases and knuckles shade) ---
    const nv = P.length / 3, pos = new Float32Array(P), nor = new Float32Array(nv * 3), part = new Int8Array(nv), tq = new Float32Array(nv), tv = new Float32Array(nv), wB = new Array(nv), wW = new Array(nv);
    const e = 0.0003, lim = 0.7 * h;
    for (let v = 0; v < nv; v++) {
      let x = pos[v * 3], y = pos[v * 3 + 1], z = pos[v * 3 + 2], gx = 0, gy = 0, gz = 0;
      for (let it = 0; it < 3; it++) {
        gx = (F(x + e, y, z) - F(x - e, y, z)) / (2 * e); gy = (F(x, y + e, z) - F(x, y - e, z)) / (2 * e); gz = (F(x, y, z + e) - F(x, y, z - e)) / (2 * e);
        if (it === 2) break;
        const f = F(x, y, z), g2 = gx * gx + gy * gy + gz * gz + 1e-9; let s = f / g2; const st = Math.abs(s) * Math.sqrt(g2); if (st > lim) s *= lim / st;
        x -= gx * s; y -= gy * s; z -= gz * s;
      }
      if (y > Y1 - 0.5 * h) y = Y1 - 0.5 * h;
      const gl = Math.hypot(gx, gy, gz) || 1; pos[v * 3] = x; pos[v * 3 + 1] = y; pos[v * 3 + 2] = z; nor[v * 3] = gx / gl; nor[v * 3 + 1] = gy / gl; nor[v * 3 + 2] = gz / gl;
      // which bones carry this point: the hand, and any digit it lies on or near
      const uf = sm(-0.006, 0.02, y), acc = []; let tot = 0, pk = -1, best = 0.0030;
      for (let k = 0; k < 5; k++) {
        const D = DG[k], f = digitF(D, x, y, z), m = sm(0.007, 0.001, f); if (f < best && D.tt > D.start) { best = f; pk = k; }
        if (m <= 0) continue;
        const tt = D.tt, b0 = k < 4 ? 0.004 : 0.006, bj = 0.005;
        if (tt < b0) { const u = sm(-0.008, b0, tt) * m; if (u > 0) { acc.push([D.name + '0', u]); tot += u; } }
        else if (tt < D.j1 + bj) { const u = sm(D.j1 - bj, D.j1 + bj, tt); acc.push([D.name + '0', m * (1 - u)], [D.name + '1', m * u]); tot += m; }
        else { const u = sm(D.j2 - bj, D.j2 + bj, tt); acc.push([D.name + '1', m * (1 - u)], [D.name + '2', m * u]); tot += m; }
      }
      const sc = tot > 1 ? 1 / tot : 1, rest = Math.max(0, 1 - tot * sc), ws = acc.map(([n, w]) => [n, w * sc]); ws.push(['hand', rest * (1 - uf)], ['farm', rest * uf]);
      ws.sort((p, q) => q[1] - p[1]); ws.length = Math.min(4, ws.length);
      wB[v] = ws.map((w) => w[0]); wW[v] = ws.map((w) => w[1]);
      // which picture it wears: its own finger's strip, or the flat back / palm paintings
      part[v] = pk;
      if (pk >= 0) { const D = DG[pk]; digitF(D, x, y, z); const th = Math.atan2(D.b, D.a) + D.texRot; tq[v] = ((th / TAU) % 1 + 1) % 1; tv[v] = ((D.tt - D.t0) / D.Lp + 0.10) / 1.10; }
    }
    // --- triangles, each facing out; points are doubled only where two pictures meet ---
    const PZ0 = -0.042, PZ1 = 0.064, PY0 = 0.034, PY1 = -0.100, CW = 204 / 1024;
    const src = [], uv = [], idx = [], keys = new Map();
    const emit = (v, code, u, w) => { const key = v * 16 + code; let o = keys.get(key); if (o === undefined) { o = src.length; keys.set(key, o); src.push(v); uv.push(u, w); } return o; };
    const tri = (a, b, c) => {
      const pa = part[a];
      if (pa >= 0 && pa === part[b] && pa === part[c]) {
        const qa = tq[a]; let qb = tq[b], qc = tq[c]; if (qb - qa > 0.5) qb -= 1; else if (qb - qa < -0.5) qb += 1; if (qc - qa > 0.5) qc -= 1; else if (qc - qa < -0.5) qc += 1;
        const m = (qa + qb + qc) / 3, sh = m > 1 ? -1 : m < 0 ? 1 : 0, Q3 = [qa + sh, qb + sh, qc + sh], V = [a, b, c];
        for (let i = 0; i < 3; i++) { const v = V[i], q = Q3[i]; idx.push(emit(v, 2 + pa * 2 + (Math.abs(q - tq[v]) > 1e-6 ? 1 : 0), (pa + cl(q, 0.010, 0.990)) * CW, 0.5 + cl(tv[v], 0.004, 0.996) * 0.5)); }
      } else {
        const side = nor[a * 3] + nor[b * 3] + nor[c * 3] < 0 ? 0 : 1;
        for (const v of [a, b, c]) idx.push(emit(v, side, side * 0.5 + cl((pos[v * 3 + 2] - PZ0) / (PZ1 - PZ0), 0.004, 0.996) * 0.5, cl((PY0 - pos[v * 3 + 1]) / (PY0 - PY1), 0.004, 0.996) * 0.5));
      }
    };
    const d2 = (a, b) => { const dx = pos[a * 3] - pos[b * 3], dy = pos[a * 3 + 1] - pos[b * 3 + 1], dz = pos[a * 3 + 2] - pos[b * 3 + 2]; return dx * dx + dy * dy + dz * dz; };
    for (let q = 0; q < quads.length; q += 4) {
      const a = quads[q]; let b = quads[q + 1]; const c = quads[q + 2]; let d = quads[q + 3];
      const ux = pos[b * 3] - pos[a * 3], uy = pos[b * 3 + 1] - pos[a * 3 + 1], uz = pos[b * 3 + 2] - pos[a * 3 + 2], vx = pos[d * 3] - pos[a * 3], vy = pos[d * 3 + 1] - pos[a * 3 + 1], vz = pos[d * 3 + 2] - pos[a * 3 + 2];
      const mx = nor[a * 3] + nor[c * 3], my = nor[a * 3 + 1] + nor[c * 3 + 1], mz = nor[a * 3 + 2] + nor[c * 3 + 2];
      if ((uy * vz - uz * vy) * mx + (uz * vx - ux * vz) * my + (ux * vy - uy * vx) * mz < 0) { const t = b; b = d; d = t; }
      if (d2(a, c) <= d2(b, d)) { tri(a, b, c); tri(a, c, d); } else { tri(a, b, d); tri(b, c, d); }
    }
    return { DG, pos, nor, src, uv, idx, wB, wW, digitR, digitP, digitUp, h, F };
  })();
  for (const [S, s] of SIDES) {
    const G = HAND_GEO, HANDP = !!(BAKED && BAKED.hands), n = G.src.length, pos = new Array(n * 3), nor = new Float32Array(n * 3), wts = new Array(n), p = V3(), d = V3();
    for (let i = 0; i < n; i++) {
      const v = G.src[i]; handPt(s, G.pos[v * 3], G.pos[v * 3 + 1], G.pos[v * 3 + 2], p); handDir(s, G.nor[v * 3], G.nor[v * 3 + 1], G.nor[v * 3 + 2], d);
      pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z; nor[i * 3] = d.x; nor[i * 3 + 1] = d.y; nor[i * 3 + 2] = d.z;
      const nb = G.wB[v], nw = G.wW[v], w = []; for (let k = 0; k < nb.length; k++) w.push(BI[nb[k] + S], nw[k]); wts[i] = w;
    }
    let idx = G.idx;
    if (s > 0) { idx = idx.slice(); for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; } }      // the mirrored hand winds the other way
    addPart(HANDP ? (S === 'R' && BAKED.handsR ? 'handR' : 'hand') : 'skin', { pos, uv: HANDP ? G.uv : null, idx }, (x, y, z, i) => wts[i], { nor });
    // nails: a thin curved plate on the back of each fingertip, rounded at the cuticle and at the free edge
    for (const D of G.DG) {
      const L = D.name === 'thb' ? 0.0132 : D.name === 'pnk' ? 0.0102 : 0.0120, t0 = D.len - L + 0.0008, tf = D.tc + 0.80 * D.rt, NS = Q(18, 8), NW = Q(10, 5), rings = [];
      for (let i = 0; i <= NS; i++) {
        const u = i / NS, tt = t0 + L * u, shape = Math.max(0.28, u < 0.30 ? Math.pow(1 - Math.pow(1 - u / 0.30, 2), 0.5) : u > 0.84 ? Math.pow(Math.max(0, 1 - Math.pow((u - 0.84) / 0.16, 2)), 0.30) : 1), ring = [];
        const PH = lerp(42, 52, sm(0.05, 0.75, u)) * DEG;               // the nail is narrow at the cuticle and as wide as the fingertip at its free edge
        const droop = 0.0004 * Math.pow(Math.max(0, (tt - tf) / (D.len - tf)), 2), root = 0.0009 * (1 - sm(0, 0.12, u));    // the free edge dips a little; the root sinks under the cuticle
        for (let pass = 0; pass < 2; pass++) for (let j = 0; j <= NW; j++) {
          const w = (pass ? 1 - j / NW : j / NW) * 2 - 1, ph = w * PH * shape, th = PI + ph;
          const r = G.digitR(D, Math.min(tt, tf), th) + (pass ? -0.0003 : 0.00042 - 0.00030 * w * w) - droop - root;
          const q = G.digitP(D, tt, Math.cos(th) * r - G.digitUp(D, Math.min(tt, tf)), Math.sin(th) * r), wp = handPt(s, q[0], q[1], q[2]); ring.push([wp.x, wp.y, wp.z]);
        }
        rings.push(ring);
      }
      const c = G.digitP(D, D.len - 0.006, 0, 0);
      addPart('nail', loft(rings, { capA: true, capB: true }), wOne(D.name + '2' + S), { out: handPt(s, c[0], c[1], c[2]) });
    }
  }

  // ---------- head: the Jester's face model, worn at Io's size, with her own face painted on it ----------
  // The shape is the Jester's head as in models/jester-3d/src/40_head.js (her tables and her headPoint, in her own frame: eyes at
  // 1.5246 m, lip line 0.066 m below), which is how the Ranger's head was made too (Chris, November 12: "just use the jester witch
  // 3d face model"). Io's front painting C1 has the Jester's proportions from eye to nose to lips to within a millimetre at HS = 0.95,
  // so the head is worn at 0.95 of its size. Her face is narrower across the eyes and cheekbones than the Jester's and as wide at the
  // jaw, so widths are also multiplied by WF (0.95 above the nose, 1 from the lips down). Her chin is kept where her whole-figure
  // paintings put it (1.408 m), which puts her eye line at 1.511 m; the tip of her nose is 0.107 m forward, as on the Ranger.
  // Her profile (C3) is compared with the model's middle line by tools/prof_io.py. The method: claude/HOW-TO-3d-witch-faces.md.
  const JH = (function () {
    const HC = V3(0, 1.555, 0.002), HR = { x: 0.070, yT: 0.092, yB: 0.140, zF: 0.0966, zB: 0.083 };
    const LAY = (BAKED && BAKED.layout) || {};          // where the features sit in the painted face: the sculpted eye and the painted eye are placed from one number
    const FC = { eyeY: LAY.eyeY || 1.5246, eyeX: LAY.eyeX || 0.0304, browY: LAY.browY || 1.5368, noseY: LAY.noseY || 1.4877, mouthY: LAY.mouthY || 1.4586 };
    // TUCK is the one thing added to her head. The Jester's cap and ruff hide what lies behind her jaw, so
    // below the ears the back of each ring is drawn in to the neck: [from height, to height, neck half-width, neck middle, neck half-depth] in the head's frame
    const TUCK = [1.4927, 1.4523, 0.0468, -0.0115, 0.0535];
    const FACE_MID = [[1.4174, 0.0872], [1.4200, 0.0906], [1.4240, 0.0924], [1.4300, 0.0930], [1.4380, 0.0925], [1.4454, 0.0942], [1.4520, 0.0950], [1.4586, 0.0961], [1.4630, 0.0961], [1.4680, 0.0973], [1.4747, 0.0956], [1.4800, 0.0956], [1.4900, 0.0947], [1.5000, 0.0943], [1.5100, 0.0948], [1.5220, 0.0946], [1.5300, 0.0947], [1.5387, 0.0949], [1.5500, 0.0967], [1.5550, 0.0966]];
  const NOSE = [[1.4680, 0.0000], [1.4700, 0.0030], [1.4720, 0.0037], [1.4747, 0.0051], [1.4760, 0.0060], [1.4774, 0.0062], [1.4787, 0.0105], [1.4800, 0.0126], [1.4840, 0.0175], [1.4880, 0.0197], [1.4920, 0.0196], [1.4980, 0.0155], [1.5040, 0.0107], [1.5100, 0.0070], [1.5160, 0.0037], [1.5220, 0.0004], [1.5260, 0.0000]];
  const NOSE_W = [[1.4680, 0.0050], [1.4760, 0.0050], [1.4800, 0.0064], [1.4880, 0.0094], [1.4960, 0.0078], [1.5080, 0.0060], [1.5260, 0.0056]];
  const FACE_V = [[1.4150, 0.30], [1.4300, 0.40], [1.4450, 0.44], [1.4586, 0.40], [1.4760, 0.22], [1.4975, 0.02], [1.5246, -0.12], [1.5400, -0.10], [1.5550, 0]];
  // how wide a ring of the lower head is, from 1 at the cheeks to 0 under the chin: the last tenth closes quickly, so the jaw has an edge and a flat underside
  const SIN9 = Math.sqrt(1 - 0.81), SN9 = Math.pow(SIN9, 0.60), snLow = (sp, t) => (t > 0.9 ? SN9 * Math.pow(sp / SIN9, 0.40) : Math.pow(sp, 0.60));
  const T_CHIN = (HC.y - FACE_MID[0][0]) / HR.yB, SN_CHIN = snLow(Math.sqrt(1 - T_CHIN * T_CHIN), T_CHIN), RZ_CHIN = FACE_MID[0][1] - 0.050 * T_CHIN * T_CHIN * T_CHIN;
    function headPoint(a, ph, grow) {                 // a: angle from the front toward her left; ph: 0 at the crown, PI at the chin
    const yn = Math.cos(ph), s = Math.sin(a), c = Math.cos(a), g = grow || 0, t = Math.max(0, -yn), sn = yn < 0 ? snLow(Math.sin(ph), t) : Math.sin(ph);
    let y = (yn >= 0 ? HR.yT : HR.yB) * yn + g * yn; const Y = HC.y + (yn >= 0 ? HR.yT : HR.yB) * yn;
    const x = ((HR.x * sn) * (1 - 0.16 * sm(0.5, 1.0, t)) + g * Math.min(1, sn * 3)) * s;      // the outline from the front, narrowing to the jaw
    const zc = 0.050 * t * t * t;                   // the lower head sits forward, so the chin hangs under the mouth; the corners of the jaw stay back near the ears
    let z, xk = 0;
    if (c < 0) z = zc * (1 - 0.95 * sm(0, -0.9, c)) + (HR.zB + g) * sn * c;      // only the face comes forward: the back of the head runs straight down into the nape
    else {
      const rz = (yn >= 0 ? HR.zF * sn : t > T_CHIN ? RZ_CHIN * sn / SN_CHIN : spline(FACE_MID, Y) - zc) + g * Math.min(1, sn * 3), v = yn >= 0 ? 0 : spline(FACE_V, Y), s2 = s * s;
      z = zc + rz * (c - v * s2 * Math.pow(c, 1.5));
      if (!g && yn < 0.35) {
        const f = c, ax = Math.abs(x), G = (dx, dy, wx, wy) => Math.exp(-Math.pow(dx / wx, 2) - Math.pow(dy / wy, 2));
        let d = 0; const NT = FC.noseY;
        // nose: the bridge and the ball of the tip, the wings of the nostrils, the folds where they meet the cheek, the hollows under it
        if (Y > 1.468 && Y < 1.526) d += spline(NOSE, Y) * Math.exp(-Math.pow(x / spline(NOSE_W, Y), 2));
        d += 0.0062 * G(ax - 0.0116, Y - (NT - 0.0054), 0.0052, 0.0052) - 0.0014 * G(ax - 0.0186, Y - (NT - 0.0040), 0.0030, 0.0066) - 0.0030 * G(ax - 0.0062, Y - (NT - 0.0096), 0.0030, 0.0021);
        d -= 0.0064 * G(ax - FC.eyeX, Y - FC.eyeY, 0.017, 0.0105) + 0.0026 * G(ax - 0.014, Y - (FC.eyeY - 0.002), 0.007, 0.010);   // eye sockets, deepest beside the bridge
        d += 0.0030 * G(ax - 0.027, Y - (FC.browY + 0.002), 0.026, 0.008);                        // brow
        d += 0.0030 * G(ax - FC.eyeX, Y - FC.eyeY, 0.0105, 0.0066) - 0.0010 * G(ax - FC.eyeX, Y - (FC.eyeY + 0.0088), 0.014, 0.0024);   // the eyeball rounding out of its socket, and the crease of the lid above it
        d += 0.0040 * G(ax - 0.043, Y - 1.4975, 0.020, 0.016) - 0.0022 * G(ax - 0.047, Y - 1.4670, 0.016, 0.014);   // cheekbones, and the hollow under them
        d -= 0.0010 * G(x, Y - (FC.mouthY + 0.0135), 0.0034, 0.0055);                             // the groove under the nose
        d += 0.0056 * G(x, Y - (FC.mouthY + 0.0058), 0.020, 0.0054) + 0.0044 * G(x, Y - (FC.mouthY - 0.0074), 0.016, 0.0054);  // lips
        d -= 0.0016 * G(ax - 0.024, Y - FC.mouthY, 0.006, 0.008);                                 // corners of the mouth
        d += 0.0026 * G(x, Y - 1.4300, 0.017, 0.0095);                                            // the ball of the chin
        z += d * f;
      }
    }
    if (c < 0 && yn < 0) { const fb = sm(TUCK[0], TUCK[1], Y) * sm(-0.05, -0.60, c); if (fb > 0) { xk = lerp(x, (TUCK[2] + g) * s, fb) - x; z = lerp(z, TUCK[3] + (TUCK[4] + g) * c, fb); } }      // see TUCK
    if (t > 0.86) y += 0.30 * Math.max(0, 0.083 - z) * sm(0.86, 0.985, t);        // under the jaw the skin rises toward the throat
    return [HC.x + x + xk, HC.y + y, HC.z + z];
  }
    const halfW = (Y) => { if (Y >= HC.y) return HR.x * Math.sqrt(Math.max(0, 1 - Math.pow((Y - HC.y) / HR.yT, 2))); const t = Math.min(1, (HC.y - Y) / HR.yB); return HR.x * snLow(Math.sqrt(1 - t * t), t) * (1 - 0.16 * sm(0.5, 1.0, t)); };
    return { HC, HR, FC, headPoint, halfW };
  })();
  const HS = 0.95, J_EYE = 1.5246, J_TIP = 0.1158, R_EYE = 1.511, R_TIP = 0.107;
  const WF = (Yj) => 0.95 + 0.05 * sm(1.500, 1.455, Yj);          // how much narrower than the Jester's her head is, by height in the head's frame
  const jy = (Y) => R_EYE + (Y - J_EYE) * HS, jz = (Z) => R_TIP + (Z - J_TIP) * HS, toJy = (y) => J_EYE + (y - R_EYE) / HS, toJz = (z) => J_TIP + (z - R_TIP) / HS;      // between the head's own frame and her body
  const HC = V3(0, jy(JH.HC.y), jz(JH.HC.z)), HR = { x: JH.HR.x * HS * 0.95, yT: JH.HR.yT * HS, yB: JH.HR.yB * HS, zF: JH.HR.zF * HS, zB: JH.HR.zB * HS };
  const FC = { eyeY: R_EYE, eyeX: JH.FC.eyeX * HS * WF(JH.FC.eyeY), browY: jy(JH.FC.browY), noseY: jy(JH.FC.noseY), mouthY: jy(JH.FC.mouthY), chinY: jy(1.4165), earZ: -0.0242 };
  const FACE = { x0: -0.1 * HS, x1: 0.1 * HS, y0: jy(1.385), y1: jy(1.585) };          // the face painting covers this window, seen from the front
  const GS = (dx, dy, wx, wy) => Math.exp(-Math.pow(dx / wx, 2) - Math.pow(dy / wy, 2));
  function headPoint(a, ph, grow) { const p = JH.headPoint(a, ph, (grow || 0) / HS); return [p[0] * HS * WF(p[1]), jy(p[1]), jz(p[2])]; }
  const headHalfW = (y) => JH.halfW(toJy(y)) * HS * WF(toJy(y));        // half the width of her head at a height
  const wHead = wOne('head'), faceMix = [], faceUvS = [];
  // her ear, read off the profile in C3: its middle, half its width and height, and how far its top leans back
  const EAR = { z: -0.0242, y: 1.4910, a: 0.0155, b: 0.0270, tilt: 11 * DEG, texK: 1.0 };
  const earR = (z, y) => { const c = Math.cos(EAR.tilt), sn = Math.sin(EAR.tilt), dz = z - EAR.z, dy = y - EAR.y, lz = dz * c + dy * sn, ly = dy * c - dz * sn; return Math.sqrt(lz * lz / (EAR.a * EAR.a) + ly * ly / (EAR.b * EAR.b)); };
  const SIDE_WIN = (BAKED && BAKED.faceSideWin) || [jz(-0.075), jz(0.125), jy(1.385), jy(1.585)];      // the side painting covers this window: forward from, to; height from, to
  (function buildHead() {
    const NU = Q(256, 84), NV = Q(168, 60), rings = [];        // most of the rings, and most of the columns, are spent on the face
    for (let i = 0; i <= NV; i++) {
      const u = i / NV, ph = u < 0.28 ? lerp(0.02, 1.45, u / 0.28) : lerp(1.45, PI - 0.02, (u - 0.28) / 0.72), ring = [];
      for (let j = 0; j < NU; j++) { const v = 2 * (j / NU) - 1; ring.push(headPoint(PI * (0.35 * v + 0.65 * v * v * v), ph)); }     // v = 0 is the middle of the face
      rings.push(ring);
    }
    const part = loft(rings, { capA: true, capB: true });
    for (let i = 0; i < part.pos.length / 3; i++) {   // the front painting is laid on flat from the front
      part.uv[i * 2] = (part.pos[i * 3] - FACE.x0) / (FACE.x1 - FACE.x0); part.uv[i * 2 + 1] = (part.pos[i * 3 + 1] - FACE.y0) / (FACE.y1 - FACE.y0);
    }
    const info = addPart('face', part, wHead, { out: HC });
    // Which painting each point wears, by the Jester's rules: the front painting wherever it can see; the profile painting only where
    // the skin faces sideways and lies more than 34 to 50 mm from the middle line; plain skin under the jaw (facing down and below
    // the jaw line) and behind the ear line. One thing is added: the painted ear is blanked under her real one.
    const FB = buckets.face, Wn = SIDE_WIN;
    for (let i = info.start; i < info.start + info.count; i++) {
      const nx = FB.nor[i * 3], ny = FB.nor[i * 3 + 1], px = FB.pos[i * 3], py = FB.pos[i * 3 + 1], pz = FB.pos[i * 3 + 2], pyJ = toJy(py), pzJ = toJz(pz); const pxJ = Math.abs(px) / (HS * WF(pyJ));
      const under = sm(-0.22, -0.66, ny) * sm(1.444, 1.428, pyJ), plain = Math.max(under, sm(0.010, -0.006, pzJ - JH.HC.z), pxJ > 0.03 ? sm(1.12, 0.92, earR(pz, py)) : 0);
      const side = sm(0.70, 0.93, Math.abs(nx)) * sm(0.034, 0.050, pxJ) * sm(Wn[2] + 0.002, Wn[2] + 0.014, py) * sm(Wn[3] - 0.002, Wn[3] - 0.014, py) * (1 - plain) * sm(FC.eyeY + 0.026, FC.eyeY + 0.010, py);       // not above her temple: in C3 that is hair
      faceMix.push(side, plain, 1 - 0.17 * under, 1); faceUvS.push((pz - Wn[0]) / (Wn[1] - Wn[0]), (py - Wn[2]) / (Wn[3] - Wn[2]));
    }
  })();
  // Her painted face is kept on a canvas, so the painted eyes or mouth of another state can be set into it: her blink, her talking
  // mouths, her smile (C9). The states and their names are stored as the Jester's are, so her blink and talk code will work here unchanged.
  const faceC = cvs(1024, 1024), faceT = ctex(faceC), bakedFace = { base: null, parts: {} }, faceNow = { eyes: 0, mouth: 'rest' };
  { const g0 = faceC.getContext('2d'); g0.fillStyle = (BAKED && BAKED.skinChest) || '#d59d7f'; g0.fillRect(0, 0, 1024, 1024); }
  const LOOKS = { own: bakedFace }; bakedFace.rects = (BAKED && BAKED.faceParts) || {}; let lookNow = 'own';
  // Her emotions (C10; stage ten) are whole-face patches named 'emo_<name>': reading, casting, surprised, hit, stern, delighted.
  // Only two of them have her eyes open as they are at rest, so only those can blink; her talking mouths can be set over any of
  // them, but not the plain smile (an emotion brings its own mouth and cheeks).
  const EMO_BLINK = { casting: 1, stern: 1 };
  function paintFace(eyes, mouth, emo) {            // eyes: 0 open .. 1 shut; mouth: 'rest', 'open', 'oo' or 'smile'; emo: one of her emotions, or nothing
    faceNow.eyes = eyes; faceNow.mouth = mouth; faceNow.emo = emo || null; const L = LOOKS[lookNow] && LOOKS[lookNow].base ? LOOKS[lookNow] : LOOKS.own; if (!L.base) return;
    const W = faceC.width, H = faceC.height, g = faceC.getContext('2d'), put = (n) => { const im = L.parts[n], r = L.rects[n]; if (im && r) g.drawImage(im, r.x * W, r.y * H, r.w * W, r.h * H); };
    g.drawImage(L.base, 0, 0, W, H);
    const e = emo && L.parts['emo_' + emo] ? emo : null; if (e) put('emo_' + e);
    if (!e || EMO_BLINK[e]) { if (eyes >= 0.75) put('shut'); else if (eyes >= 0.25) put('half'); }
    if (mouth === 'open') put('oh'); else if (mouth === 'oo') put('oo'); else if (mouth === 'smile' && !e) put('smile');
    faceT.needsUpdate = true;
  }
  onBaked('face', (im) => { bakedFace.base = im; paintFace(faceNow.eyes, faceNow.mouth, faceNow.emo); });
  if (BAKED && BAKED.faceParts) for (const n in BAKED.faceParts) onBaked('facePart_' + n, (im) => { bakedFace.parts[n] = im; paintFace(faceNow.eyes, faceNow.mouth, faceNow.emo); }, BAKED.faceParts[n].src);
  // ---------- ears: a dished shell standing off the side of the head, wearing the profile painting ----------
  (function buildEars() {
    const NT = Q(72, 30), N1 = Q(16, 8), N2 = Q(7, 4), c0 = Math.cos(EAR.tilt), s0 = Math.sin(EAR.tilt);
    const zy = (r, th) => {                         // th: 0 at the top, a quarter turn at the back, half a turn at the lobe
      const ct = Math.cos(th), st = Math.sin(th), lz = -EAR.a * st * (1 - 0.20 * sm(0.3, 1, -ct)) * r, ly = EAR.b * ct * r;
      return [EAR.z + lz * c0 - ly * s0, EAR.y + ly * c0 + lz * s0];
    };
    const zF = EAR.z + EAR.a, zB = EAR.z - EAR.a;
    const lat = (r, th) => {                        // the outer face: [distance out from the middle of the head, height, forward]
      const [z, y] = zy(r, th), ct = Math.cos(th), st = Math.sin(th), q = cl((zF - z) / (zF - zB), 0, 1);
      let x = headHalfW(y) - 0.0015 + 0.0035 + 0.0165 * Math.pow(q, 0.9) * (0.50 + 0.50 * sm(EAR.y - 0.0246, EAR.y + 0.0014, y));
      const rim = 1 - 0.75 * sm(0.15, 0.5, -st) * sm(-0.9, -0.2, ct) * sm(0.95, 0.2, ct);      // the rim fades along the front, where the ear joins the cheek
      x += 0.0022 * Math.exp(-Math.pow((r - 0.90) / 0.085, 2)) * rim;                              // helix
      x -= 0.0016 * Math.exp(-Math.pow((r - 0.72) / 0.07, 2)) * sm(-0.3, 0.3, st) * sm(-0.5, 0.1, ct);     // the groove inside it
      x += 0.0020 * Math.exp(-Math.pow((r - 0.50) / 0.10, 2)) * sm(-0.35, 0.25, st);               // antihelix
      x -= 0.0085 * GS(z - (EAR.z + 0.0040), y - (EAR.y - 0.0045), 0.0062, 0.0088);                // the bowl of the ear
      x += 0.0030 * GS(z - (EAR.z + 0.0118), y - (EAR.y - 0.0050), 0.0036, 0.0050);                // tragus
      return [x, y, z];
    };
    for (const [S, sg] of SIDES) {
      const rings = [], kind = [];
      for (let i = 0; i <= N1; i++) { const r = lerp(0.07, 1, Math.pow(i / N1, 0.85)), ring = []; for (let j = 0; j < NT; j++) { const p = lat(r, (j / NT) * TAU); ring.push([sg * p[0], p[1], p[2]]); } rings.push(ring); kind.push(0); }
      { const ring = []; for (let j = 0; j < NT; j++) { const p = lat(1.03, (j / NT) * TAU); ring.push([sg * (p[0] - 0.0020), p[1], p[2]]); } rings.push(ring); kind.push(1); }     // round the edge
      for (let i = 0; i <= N2; i++) {               // the back face, running in under the ear to the head
        const u = i / N2, r = lerp(1.0, 0.42, u), ring = [];
        for (let j = 0; j < NT; j++) { const p = lat(r, (j / NT) * TAU), xin = headHalfW(p[1]) - 0.006; ring.push([sg * Math.max(xin, lerp(p[0] - 0.0040, xin, u * u)), p[1], p[2]]); }
        rings.push(ring); kind.push(2);
      }
      const part = loft(rings, { capA: true }), cols = NT + 1, info = addPart('face', part, wHead, { out: V3(sg * 0.05, EAR.y, EAR.z) }), FB = buckets.face, Wn = SIDE_WIN;
      for (let i = info.start; i < info.start + info.count; i++) {
        const k = kind[Math.min(kind.length - 1, Math.floor((i - info.start) / cols))] || 0, py = FB.pos[i * 3 + 1], pz = FB.pos[i * 3 + 2];
        if ((i - info.start) >= rings.length * cols || k === 0) faceMix.push(1, 0, 1, 1); else if (k === 1) faceMix.push(0.5, 0.5, 0.97, 1); else faceMix.push(0, 1, 0.92, 1);
        faceUvS.push((EAR.z + (pz - EAR.z) * EAR.texK - Wn[0]) / (Wn[1] - Wn[0]), (EAR.y + (py - EAR.y) * EAR.texK - Wn[2]) / (Wn[3] - Wn[2]));
      }
    }
  })();
  // neck: from the top of the torso up inside the jaw. It leans forward as it rises, front and back, so the throat meets the
  // underside of the jaw about 4 cm behind the chin (C3's side view). It is plain skin, her neck's tone
  // under the jaw running into her chest's tone at its foot (C18 has both in one light).
  (function buildNeck() {
    const NU = Q(56, 24), wNeck = (x, y) => { const u = sm(1.395, 1.46, y); return [BI.neck, 1 - u, BI.head, u]; }, nr = [];
    for (const [y, rx, zf, zb] of [[1.396, 0.0410, 0.0250, -0.0725], [1.410, 0.0424, 0.0300, -0.0700], [1.424, 0.0438, 0.0345, -0.0660], [1.440, 0.0448, 0.0380, -0.0625], [1.460, 0.0455, 0.0392, -0.0605], [1.490, 0.0455, 0.0325, -0.0600]])
      nr.push(ringXZ(0, y, (zf + zb) / 2, rx, (zf - zb) / 2, (zf - zb) / 2, NU));
    const info = addPart('face', loft(nr), wNeck, { out: V3(0, 1.44, -0.012) }), FB = buckets.face, Wn = SIDE_WIN;
    for (let i = info.start; i < info.start + info.count; i++) {
      const nx = FB.nor[i * 3], py = FB.pos[i * 3 + 1], pz = FB.pos[i * 3 + 2], sd = 0;       // Io's neck is plain skin all round: in C3 her hair hangs across the side of it, and on the model her hair covers it
      faceMix.push(sd, 1 - sd, 1 - 0.17 * sm(1.398, 1.428, py) * sm(-0.030, 0.015, pz), sm(1.398, 1.432, py)); faceUvS.push((pz - Wn[0]) / (Wn[1] - Wn[0]), (py - Wn[2]) / (Wn[3] - Wn[2]));
    }
    // the foot of the neck takes the chest's surface direction where the two meet, so the light does not break along the join
    const TB = buckets.torso, rim = [];
    for (let i = 0; i < TB.n; i++) { const y = TB.pos[i * 3 + 1]; if (y > 1.386 && y < 1.4055 && Math.abs(TB.pos[i * 3]) < 0.08 && Math.abs(TB.nor[i * 3 + 1]) < 0.85) rim.push(i); }
    for (let i = info.start; i < info.start + info.count && rim.length; i++) {
      const px = FB.pos[i * 3], py = FB.pos[i * 3 + 1], pz = FB.pos[i * 3 + 2], k = sm(1.432, 1.404, py); if (k <= 0) continue;
      let best = rim[0], bd = 1e9;
      for (const j of rim) { const d = Math.hypot(TB.pos[j * 3] - px, TB.pos[j * 3 + 2] - pz) + 0.5 * Math.abs(TB.pos[j * 3 + 1] - 1.400); if (d < bd) { bd = d; best = j; } }
      const nx = lerp(FB.nor[i * 3], TB.nor[best * 3], k), ny = lerp(FB.nor[i * 3 + 1], TB.nor[best * 3 + 1], k), nz = lerp(FB.nor[i * 3 + 2], TB.nor[best * 3 + 2], k), l = Math.hypot(nx, ny, nz) || 1;
      FB.nor[i * 3] = nx / l; FB.nor[i * 3 + 1] = ny / l; FB.nor[i * 3 + 2] = nz / l;
    }
  })();

  // ---------- glasses: round lenses in dark bronze wire (placed as in C2, where she wears them; the shape from C14) ----------
  // In C2 each ring is 44 mm across, its middle 2.6 mm outside her pupil and 7 mm below her eye line; the hinges sit 6 mm above the
  // middle of the ring and the bridge 7.5 mm above it. Built like the Ranger's (models/ranger-3d/src/R42_glasses.js).
  (function buildGlasses() {
    const G = { cx: 0.0324, cy: 1.5030, rx: 0.0250, ry: 0.0250, z: 0.0915, wrap: 0.10, wire: 0.00115 };       // C2 has them 44 mm across; every whole-figure painting has them bigger and darker, so they are 50 mm here
    const zAt = (x) => G.z - G.wrap * Math.max(0, Math.abs(x) - 0.012);                       // the front bows back a little toward the temples
    const tube = (key, pts, r, n) => addPart(key, loft(tubeRings(pts, pts.map((p, i) => (typeof r === 'function' ? r(i / (pts.length - 1)) : r)), n || Q(7, 5)), { capA: true, capB: true }), wHead, { out: pts[Math.floor(pts.length / 2)].clone().add(V3(0, 0, -0.01)), flip: true });
    for (const [S, sg] of SIDES) {
      const rim = [], NR = Q(56, 28), fan = [[], []];
      for (let i = 0; i <= NR; i++) { const t = (i / NR) * TAU, x = sg * (G.cx + G.rx * Math.cos(t)), y = G.cy + G.ry * Math.sin(t); rim.push(V3(x, y, zAt(x))); }
      addPart('wire', loft(tubeRings(rim, rim.map(() => G.wire), Q(7, 5), V3(0, 0, 1))), wHead, { out: V3(sg * G.cx, G.cy, G.z - 0.02), flip: true });
      // the lens: a thin disc just inside the rim
      const lr = [];
      for (const k of [0.02, 0.35, 0.68, 0.985]) { const ring = []; for (let i = 0; i < NR; i++) { const t = (i / NR) * TAU, x = sg * (G.cx + G.rx * k * Math.cos(t)); ring.push([x, G.cy + G.ry * k * Math.sin(t), zAt(x) + 0.0009 * (1 - k * k)]); } lr.push(ring); }
      addPart('lens', loft(lr, { capA: true }), wHead, { out: V3(sg * G.cx, G.cy, G.z - 0.05) , flip: true });
      // nose pad and its little arm
      const px = sg * 0.0086, py = 1.4993, pz = G.z - 0.0078;
      tube('wire', curvePts([V3(sg * (G.cx - G.rx * 0.93), G.cy - G.ry * 0.36, zAt(G.cx - G.rx * 0.93)), V3(sg * 0.0100, 1.5003, G.z - 0.0035), V3(px, py, pz + 0.0012)], 8), 0.00055, 5);
      const pr = []; for (let i = 0; i <= 6; i++) { const ph = lerp(0.15, PI - 0.15, i / 6); pr.push(ringXZ(px, py + 0.0036 * Math.cos(ph), pz, 0.0010 * Math.sin(ph) + 0.0002, 0.0019 * Math.sin(ph) + 0.0002, 0.0019 * Math.sin(ph) + 0.0002, 8)); }
      addPart('pad', loft(pr, { capA: true, capB: true }), wHead, { out: V3(px, py, pz) });
      // end piece, then the arm back over the ear and down behind it
      const xo = sg * (G.cx + G.rx), yo = G.cy + 0.0068;
      tube('wire', curvePts([V3(sg * (G.cx + G.rx * 0.93), G.cy + G.ry * 0.37, zAt(G.cx + G.rx * 0.93)), V3(xo + sg * 0.0030, yo + 0.0008, zAt(xo) - 0.0006), V3(xo + sg * 0.0048, yo + 0.0010, zAt(xo) - 0.0050)], 8), 0.0010, 6);
      tube('wire', curvePts([V3(xo + sg * 0.0048, yo + 0.0010, zAt(xo) - 0.0050), V3(sg * (headHalfW(1.513) + 0.0030), 1.5130, 0.0450), V3(sg * (headHalfW(1.519) + 0.0030), 1.5190, 0.0050), V3(sg * (headHalfW(1.5225) + 0.0040), 1.5225, -0.0170), V3(sg * (headHalfW(1.519) + 0.0030), 1.5190, -0.0330), V3(sg * (headHalfW(1.507) + 0.0010), 1.5070, -0.0420), V3(sg * headHalfW(1.495), 1.4950, -0.0440)], Q(40, 20)), (t) => (t > 0.72 ? lerp(0.0008, 0.0014, sm(0.72, 0.86, t)) : 0.0008), 6);
    }
    // bridge
    const bx = G.cx - G.rx * Math.cos(0.36), by = G.cy + G.ry * Math.sin(0.36);
    tube('wire', curvePts([V3(-bx, by, zAt(bx)), V3(-bx * 0.5, by + 0.0022, G.z + 0.0012), V3(0, by + 0.0030, G.z + 0.0016), V3(bx * 0.5, by + 0.0022, G.z + 0.0012), V3(bx, by, zAt(bx))], 14), G.wire, 6);
  })();

  // ---------- hat: wine-red felt, a wide floppy brim, a tall soft crown that slumps to HER RIGHT and hangs behind her shoulder ----------
  // Measured off C4 (front: 1370 px a metre; profile: 1290 px a metre, the tip of her nose at x 1432) and C5, with the details in C15 to C17.
  //   the opening: an ellipse 17 cm across and 25 cm front to back, lying on a plane that rises toward the front (at her hairline in
  //     front, 1.556 m; at the back, 1.497 m);
  //   the brim: 33 cm across and 39 cm front to back, level in front, drooping 4.5 cm at the sides and 9 cm at the back;
  //   the band: black lace 4.6 cm high, a silver chain round it, three small gold crosses in front, the big ringed cross toward her
  //     left, a cream horn at each side;
  //   the crown: up 15 cm, over to her right and back, then down behind her right shoulder to the height of her chin.
  const HAT = { oc: [0, 1.5266, -0.030], oa: 0.084, ob: 0.127, slope: 0.056 / 0.234, bandH: 0.046, ec: -0.015, ea: 0.166, eb: 0.186 };
  const hatOpen = (a, grow) => { const g = grow || 0, x = (HAT.oa + g) * Math.sin(a), z = HAT.oc[2] + (HAT.ob + g) * Math.cos(a); return [x, HAT.oc[1] + (z - HAT.oc[2]) * HAT.slope, z]; };
  const hatDrop = (a) => 0.004 - 0.092 * Math.pow((1 - Math.cos(a)) / 2, 0.9);            // how far the brim's edge hangs below the opening, by direction
  function brimPt(a, t) {                            // t: 0 at the opening .. 1 at the edge
    const p0 = crown.pt(0, a, 0.001, true), x1 = HAT.ea * Math.sin(a), z1 = HAT.ec + HAT.eb * Math.cos(a), tt = t * t;
    const rip = 0.010 * Math.sin(3 * a + 0.6) + 0.006 * Math.sin(5 * a + 2.0) + 0.004 * Math.sin(8 * a + 0.9);
    return [lerp(p0[0], x1, t), p0[1] + hatDrop(a) * Math.pow(t, 1.7) + rip * tt + 0.009 * Math.sin(a) * t, lerp(p0[2], z1, t)];
  }
  // the crown's middle line and its half-widths (across, front to back) at each station
  // Read off both views of C4: a dome as wide as the band, 1.72 m at its top; the rest of the crown comes off the back of the dome on
  // her right, 10 cm thick where it starts, and hangs down behind her right shoulder, thinning to its tip at 1.40 m.
  // Chris, November 13: the hat down by 15% of the way from its bottom edge in front to the top of her glasses (7 mm), and later the
  // same day by another 30% of that way (14.4 mm more). The way was 4.81 cm; the hat now sits 45% of it lower, 21.4 mm. Every height
  // below has that taken off.
  const CROWN = [[0, 1.5266, -0.030, 0.084, 0.125], [0, 1.5746, -0.042, 0.083, 0.120], [-0.004, 1.6146, -0.054, 0.078, 0.108], [-0.026, 1.6426, -0.082, 0.068, 0.086], [-0.074, 1.6446, -0.128, 0.058, 0.062],
    [-0.118, 1.6126, -0.160, 0.050, 0.051], [-0.140, 1.5546, -0.172, 0.043, 0.044], [-0.150, 1.4946, -0.171, 0.034, 0.035], [-0.158, 1.4386, -0.176, 0.024, 0.025], [-0.172, 1.3986, -0.190, 0.012, 0.012], [-0.178, 1.3786, -0.200, 0.004, 0.004]];
  const crown = (function () {
    const NS = Q(96, 40), ctr = curvePts(CROWN.map((c) => V3(c[0], c[1], c[2])), NS + 1), fr = [], len = [0];
    const al = Math.atan(HAT.slope); let T0 = V3(0, Math.cos(al), -Math.sin(al)), N = V3(1, 0, 0);
    for (let i = 0; i <= NS; i++) {
      const a = ctr[Math.max(0, i - 1)], b = ctr[Math.min(NS, i + 1)]; let T = V3(b.x - a.x, b.y - a.y, b.z - a.z).normalize(); if (i === 0) T = T0.clone();
      N.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(T0, T)); N.addScaledVector(T, -N.dot(T)).normalize(); T0 = T.clone();
      fr.push({ C: ctr[i], T, N: N.clone(), F: V3().crossVectors(N, T) });
      if (i) len.push(len[i - 1] + ctr[i].distanceTo(ctr[i - 1]));
    }
    // half-widths by station, read at the same fraction of the control points as the curve
    const rad = (i) => { const u = (i / NS) * (CROWN.length - 1), k = Math.min(CROWN.length - 2, Math.floor(u)), f = u - k, sf = f * f * (3 - 2 * f); return [lerp(CROWN[k][3], CROWN[k + 1][3], sf), lerp(CROWN[k][4], CROWN[k + 1][4], sf)]; };
    const pt = (i, a, grow, plain) => {             // a: 0 toward the front of the section, a quarter turn toward her left
      const f = fr[i], [ra, rb] = rad(i), s = i / NS, L = len[i];
      let k = 1;
      if (!plain) {                                 // soft felt: creases round it where it slumps, a few long folds, and its own weight flattening the tail
        const env = sm(0.11, 0.26, s) * (1 - 0.5 * sm(0.85, 1, s));
        k += env * (0.105 * Math.sin(L * 50 + 1.8 * Math.sin(a + 2 * s * 6) + 4 * fbm(a * 0.7 + 3, L * 9)) + 0.060 * Math.sin(3 * a + L * 14 + 1) + 0.12 * (fbm(Math.cos(a) * 1.4 + 9, L * 16 + Math.sin(a)) - 0.47));
        k += 0.035 * sm(0.02, 0.12, s) * (1 - env) * Math.sin(2 * a + 1.2);
      }
      // Lower on her head the hat meets her forehead where it is wider, so the foot of the crown is squarer than an ellipse at its
      // four corners (and sits 11 mm further forward than first built): her forehead and the roots of her fringe stay inside it.
      const e = 2 / lerp(2.45, 2, sm(0.0, 0.22, s)), sa = Math.sin(a), ca = Math.cos(a);
      const cx = (ra * k + (grow || 0)) * Math.sign(sa) * Math.pow(Math.abs(sa), e), cz = (rb * k + (grow || 0)) * Math.sign(ca) * Math.pow(Math.abs(ca), e);
      return [f.C.x + f.N.x * cx + f.F.x * cz, f.C.y + f.N.y * cx + f.F.y * cz, f.C.z + f.N.z * cx + f.F.z * cz];
    };
    let iBand = 1; while (iBand < NS && len[iBand] < HAT.bandH) iBand++;
    return { NS, pt, len, iBand, fr };
  })();
  (function buildHat() {
    const wHat = wOne('head'), NA = Q(120, 48), aOf = (j) => (j / NA) * TAU;
    // the crown
    { const rings = [], vs = [];
      for (let i = 0; i <= crown.NS; i++) { const ring = []; for (let j = 0; j < NA; j++) ring.push(crown.pt(i, aOf(j))); rings.push(ring); vs.push(crown.len[i] / 0.115); }
      const part = loft(rings, { capB: true, v: vs, uS: 6 }); addPart('felt', part, wHat, { out: V3(0, 1.62, -0.05) });
    }
    // the brim: one sheet of felt, seen from both sides, with a rolled edge
    { const NT = Q(22, 10), rings = [], vs = [];
      for (let i = 0; i <= NT; i++) { const t = i / NT, ring = []; for (let j = 0; j < NA; j++) ring.push(brimPt(aOf(j), t)); rings.push(ring); vs.push(t); }
      addPart('brim', loft(rings, { v: vs }), wHat, { out: V3(0, 1.30, -0.02) });
      const ep = []; for (let j = 0; j <= NA; j++) { const p = brimPt(aOf(j), 1); ep.push(V3(p[0], p[1], p[2])); }
      addPart('felt', loft(tubeRings(ep, ep.map(() => 0.0024), 6, V3(0, 1, 0)), { uS: 0.3, vS: 9 }), wHat, { out: V3(0, 1.5, -0.02), flip: true });
    }
    // the band of black lace round the foot of the crown
    { const rings = [], vs = [];
      for (let i = 0; i <= crown.iBand; i++) { const ring = []; for (let j = 0; j < NA; j++) ring.push(crown.pt(i, aOf(j), 0.0035, true)); rings.push(ring); vs.push(0.06 + 0.88 * crown.len[i] / crown.len[crown.iBand]); }
      { const ring = []; for (let j = 0; j < NA; j++) ring.push(crown.pt(crown.iBand, aOf(j), 0.0005, true)); rings.push(ring); vs.push(0.97); }
      addPart('hatband', loft(rings, { v: vs, uS: 16 }), wHat, { out: V3(0, 1.58, -0.045) });
    }
    // where things sit on the band: a point on it, and the directions out from it, up it and along it
    const bandAt = (a, h, off) => {                 // h: 0 at the brim .. 1 at the top of the band
      const fi = h * crown.iBand, i0 = Math.min(crown.iBand - 1, Math.floor(fi)), f = fi - i0, p0 = crown.pt(i0, a, off || 0, true), p1 = crown.pt(i0 + 1, a, off || 0, true), q0 = crown.pt(i0, a + 0.01, off || 0, true);
      const P = V3(lerp(p0[0], p1[0], f), lerp(p0[1], p1[1], f), lerp(p0[2], p1[2], f)), U = V3(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]).normalize(), R = V3(q0[0] - p0[0], q0[1] - p0[1], q0[2] - p0[2]).normalize();
      return { P, U, R, O: V3().crossVectors(R, U).normalize() };
    };
    const rod = (key, a, b, r, n) => { const pts = [a, a.clone().lerp(b, 0.5), b]; addPart(key, loft(tubeRings(pts, pts.map(() => r), n || 6), { capA: true, capB: true }), wHat, { out: a.clone().lerp(b, 0.5), flip: false }); };
    const hoop = (key, C, X, Y, rx, ry, r, n, m) => { const pts = []; for (let k = 0; k <= n; k++) { const t = (k / n) * TAU; pts.push(C.clone().addScaledVector(X, rx * Math.cos(t)).addScaledVector(Y, ry * Math.sin(t))); }
      addPart(key, loft(tubeRings(pts, pts.map(() => r), m || 5, V3().crossVectors(X, Y))), wHat, { out: C }); };
    // the chain: links of silver wire, hung in shallow swags round the upper half of the band
    { const NL = Q(108, 54), chainH = (a) => 0.92 - 0.24 * Math.pow(Math.abs(Math.sin(a * 3.5 + 0.35)), 0.7);
      for (let k = 0; k < NL; k++) { const a = (k / NL) * TAU, B = bandAt(a, chainH(a), 0.0058), B2 = bandAt(a + TAU / NL, chainH(a + TAU / NL), 0.0058), Tn = B2.P.clone().sub(B.P).normalize(), W = k % 2 ? B.O : V3().crossVectors(Tn, B.O).normalize();
        hoop('silver', B.P, Tn, W, 0.0042, 0.0024, 0.00075, 8, 4); }
      // three small crosses hang from it in front, toward her right; the big ringed cross hangs toward her left
      const cross = (a, s) => { const B = bandAt(a, chainH(a) - 0.10, 0.0075), top = B.P.clone(), bot = top.clone().addScaledVector(B.U, -0.026 * s), mid = top.clone().addScaledVector(B.U, -0.008 * s);
        hoop('gold', top.clone().addScaledVector(B.U, 0.0028), B.R, B.U, 0.0020, 0.0024, 0.0006, 8, 4); rod('gold', top, bot, 0.0012 * s); rod('gold', mid.clone().addScaledVector(B.R, -0.0068 * s), mid.clone().addScaledVector(B.R, 0.0068 * s), 0.0012 * s); };
      cross(-0.70, 0.95); cross(-0.33, 1.05); cross(0.08, 0.95);
      const B = bandAt(0.70, 0.60, 0.0095), C = B.P, tilt = B.R.clone().multiplyScalar(0.10).add(B.U).normalize();
      hoop('gold', C, B.R, B.U, 0.0195, 0.0195, 0.0031, Q(40, 20), 8);
      rod('gold', C.clone().addScaledVector(tilt, 0.050), C.clone().addScaledVector(tilt, -0.036).addScaledVector(B.O, 0.016), 0.0028, 8);       // its foot rests on the brim
      rod('gold', C.clone().addScaledVector(tilt, 0.008).addScaledVector(B.R, -0.0130), C.clone().addScaledVector(tilt, 0.008).addScaledVector(B.R, 0.0130), 0.0025, 8);
      hoop('gold', C.clone().addScaledVector(tilt, 0.0555), B.R, tilt, 0.0050, 0.0055, 0.0017, 14, 6);
    }
    // the horns: cream, ridged, standing out of the band at each side and curving up
    for (const sg of [-1, 1]) {
      const B = bandAt(sg * 1.50, 0.45, -0.002), O = B.O, U = V3(0, 1, 0), Fw = V3(0, 0, 1);
      const ctl = [B.P.clone().addScaledVector(O, -0.004), B.P.clone().addScaledVector(O, 0.018).addScaledVector(U, 0.002), B.P.clone().addScaledVector(O, 0.037).addScaledVector(U, 0.018).addScaledVector(Fw, 0.006),
        B.P.clone().addScaledVector(O, 0.046).addScaledVector(U, 0.044).addScaledVector(Fw, 0.007), B.P.clone().addScaledVector(O, 0.041).addScaledVector(U, 0.070).addScaledVector(Fw, 0.002)];
      const NH = Q(34, 16), pts = curvePts(ctl, NH + 1), rr = [], vs = [];
      for (let i = 0; i <= NH; i++) { const t = i / NH, r = 0.0175 * Math.pow(1 - t, 0.72) * (1 + 0.045 * Math.sin(t * 46)) + 0.0006; rr.push(r); vs.push(t * 1.6); }
      addPart('horn', loft(tubeRings(pts, rr, Q(20, 10), U), { capB: true, v: vs }), wHat, { out: pts[Math.floor(NH / 3)] });
    }
  })();

  // ---------- hair: long, loose and wavy, dark brown with lighter strands, from under her hat to below her hips ----------
  // C11 shows it without the hat (front, side, back), C4 and C5 with the hat, C13 its waves from behind, C12 the parting.
  // It is built as tresses: flat wavy ribbons of strands, a hundred and sixty or so, in layers. Each hangs straight down from its
  // root under the hat and is kept clear of what lies under it (her head, neck, back, chest, arms and skirt), then given its wave.
  // Three groups: the curtain down her back (to about 0.72 m), a bunch over the front of each shoulder (to her waist and hips),
  // and the fringe: curtain bangs parted in the middle, swept to each side of her forehead. Under the tresses lies a plain dark
  // sheet of hair, so no skin shows between them. Nothing moves yet; the tresses are weighted to her head and spine by height.
  const HAIRC = (BAKED && BAKED.hairCols) || ['#231512', '#36221c', '#4d332a', '#6b4b3e', '#987260'];
  let hseed = 90210; const hrnd = () => (hseed = (hseed * 16807) % 2147483647) / 2147483647, hrr = (a, b) => a + (b - a) * hrnd();       // its own dice, so nothing else shifts
  const HB = { c: V3(0, 1.548, -0.012), rx: 0.074, ry: 0.100, rzF: 0.094, rzB: 0.128 };       // her head with the bulk of hair on it, under the hat
  const hatOpenY = (z) => HAT.oc[1] + (z - HAT.oc[2]) * HAT.slope;
  // the front of her head as a height map (how far forward the skin is at each x and height), from the head's own shape
  const FMAP = (function () {
    const X0 = -0.09, Y0 = 1.39, D = 0.002, NX = 91, NY = 126, m = new Float32Array(NX * NY).fill(-9);
    for (let i = 0; i <= 420; i++) for (let j = 0; j <= 360; j++) { const p = headPoint(-PI / 2 + PI * j / 360, 0.35 + (PI - 0.37) * i / 420), ix = Math.round((p[0] - X0) / D), iy = Math.round((p[1] - Y0) / D); if (ix >= 0 && ix < NX && iy >= 0 && iy < NY && p[2] > m[iy * NX + ix]) m[iy * NX + ix] = p[2]; }
    for (let k = 0; k < 2; k++) for (let iy = 1; iy < NY - 1; iy++) for (let ix = 1; ix < NX - 1; ix++) if (m[iy * NX + ix] < -8) { let b = -9; for (const q of [iy * NX + ix - 1, iy * NX + ix + 1, (iy - 1) * NX + ix, (iy + 1) * NX + ix]) if (m[q] > b) b = m[q]; m[iy * NX + ix] = b; }
    return (x, y) => { const fx = cl((x - X0) / D, 0, NX - 1.001), fy = cl((y - Y0) / D, 0, NY - 1.001), ix = Math.floor(fx), iy = Math.floor(fy), u = fx - ix, v = fy - iy;
      if (y < Y0 || y > Y0 + D * (NY - 1) || Math.abs(x) > 0.09) return -9;
      const a = m[iy * NX + ix], b = m[iy * NX + ix + 1], c = m[(iy + 1) * NX + ix], d = m[(iy + 1) * NX + ix + 1]; if (Math.min(a, b, c, d) < -8) return Math.max(a, b, c, d);
      return lerp(lerp(a, b, u), lerp(c, d, u), v); };
  })();
  const capFront = (x, y, A, B, r) => {            // the front of a round limb from A to B (both at one depth), at this x and height; -9 where it is not
    const ex = B.x - A.x, ey = B.y - A.y, t = cl(((x - A.x) * ex + (y - A.y) * ey) / (ex * ex + ey * ey), 0, 1), d = Math.hypot(x - A.x - ex * t, y - A.y - ey * t);
    return d < r ? A.z + Math.sqrt(r * r - d * d) : -9;
  };
  // how far back her body reaches at this x and height (the hair hangs behind it), and how far forward (the hair hangs in front of it); o: clearance
  function zBack(x, y, o) {
    let z = 9; const ax = Math.abs(x);
    { const rx = HB.rx + o, ry = HB.ry + o, q = 1 - (x * x) / (rx * rx) - Math.pow((y - HB.c.y) / ry, 2); if (q > 0) z = Math.min(z, HB.c.z - (HB.rzB + o) * Math.sqrt(q)); }
    if (y > 1.33 && y < 1.50 && ax < 0.050 + o) z = Math.min(z, -0.020 - Math.sqrt(Math.pow(0.050 + o, 2) - x * x));
    if (y > 0.86 && y < 1.405) { const [rx0, zf, zb] = spline(IO_TORSO, y), rx = rx0 + o, cz = (zf + zb) / 2; if (ax < rx) z = Math.min(z, cz - (cz - zb + o) * Math.pow(1 - Math.pow(ax / rx, IO_TPW), 1 / IO_TPW)); }
    if (y > 0.15 && y < 1.06) { const [rx0, rz0, cz] = spline(IO_SKIRT_UP, y), rx = rx0 + o; if (ax < rx) z = Math.min(z, cz - (rz0 + o) * Math.sqrt(1 - (ax / rx) * (ax / rx))); }
    return z;
  }
  function zFront(x, y, o, noHead) {
    let z = -9; const ax = Math.abs(x), S = x < 0 ? 'R' : 'L';
    if (!noHead) { const f = FMAP(x, y); if (f > -8) z = Math.max(z, f + o);
      const rx = HB.rx + o, ry = HB.ry + o, q = 1 - (x * x) / (rx * rx) - Math.pow((y - HB.c.y) / ry, 2); if (q > 0) z = Math.max(z, HB.c.z + (HB.rzF * 0.80 + o) * Math.sqrt(q)); }
    if (y > 1.33 && y < 1.50 && ax < 0.046 + o) z = Math.max(z, -0.012 + Math.sqrt(Math.pow(0.046 + o, 2) - x * x));
    if (y > 0.86 && y < 1.405) { const [rx0, zf, zb] = spline(IO_TORSO, y), rx = rx0 + o, cz = (zf + zb) / 2;
      if (ax < rx) { const B = IO_BUST; z = Math.max(z, cz + (zf - cz + o) * Math.pow(1 - Math.pow(ax / rx, IO_TPW), 1 / IO_TPW) + B.amp * Math.exp(-Math.pow((ax - B.x) / B.sx, 2) - Math.pow((y - B.y) / B.sy, 2))); } }
    z = Math.max(z, capFront(x, y, restPts['sh' + S], restPts['el' + S], 0.046 + o), capFront(x, y, restPts['el' + S], restPts['wr' + S], 0.036 + o));
    if (y > 0.15 && y < 1.06) { const [rx0, rz0, cz] = spline(IO_SKIRT_UP, y), rx = rx0 + o; if (ax < rx) z = Math.max(z, cz + (rz0 + o) * Math.sqrt(1 - (ax / rx) * (ax / rx))); }
    return z;
  }
  const wHair = (x, y) => { if (y > 1.46) return [BI.head, 1]; if (y > 1.36) { const u = sm(1.36, 1.46, y); return [BI.spine3, 1 - u, BI.head, u]; } return wSpine(y); };
  // the middle line of one tress, hanging: lat(y) gives its x at each height; back: it hangs behind her (else in front)
  function hang(o, y0, y1, lat, back, zStart, oRoot, lead) {       // lead(y): for hair in front, a depth it is led to before it meets her
    const pts = [], DY = 0.011, n = Math.max(4, Math.round((y0 - y1) / DY)); let z = null;
    for (let i = 0; i <= n; i++) {
      const y = lerp(y0, y1, i / n), x = lat(y), oo = lerp(oRoot == null ? o : oRoot, o, sm(y0 - 0.01, y0 - 0.085, y)), s = back ? zBack(x, y, oo) : zFront(x, y, oo);
      if (i === 0) z = zStart == null ? s : (back ? Math.min(zStart, s) : Math.max(zStart, s));
      else z = back ? Math.min(z + 0.0012, s) : Math.max(z - 0.0012, s, lead ? lead(y) : -9);       // it hangs straight, drifting back toward her a little, and rests on whatever it meets
      pts.push(V3(x, y, z));
    }
    for (let k = 0; k < 3; k++) for (let i = 1; i < pts.length - 1; i++) pts[i].z = (pts[i - 1].z + 2 * pts[i].z + pts[i + 1].z) / 4;       // take the corners out
    return pts;
  }
  // a tress: a flat ribbon of strands along a middle line, waving from side to side and a little in and out, turning as it waves
  let tressN = 0;
  function tress(key, mid, o) {                     // o: { w, th, amp, lam, ph, out: +1 or -1 (which way is away from her), tip, sway, wisp }
    const HL = LOD.hair || {}; if (HL.keep != null && ((tressN * 0.618034) % 1) >= HL.keep) { tressN++; return; }
    const n = mid.length, len = [0]; for (let i = 1; i < n; i++) len.push(len[i - 1] + mid[i].distanceTo(mid[i - 1]));
    const L = len[n - 1], NC = HL.sides || 6, rings = [], vs = [], w0 = o.w * (HL.wide || 1), sub = HL.sub || Q(2, 1), M = Math.ceil((n - 1) * sub), q1 = o.ph * 1.7, q2 = o.ph * 0.9, T0 = 1 - (o.wisp || 0.14);       // wisp: how much of its length thins out into separate strands
    for (let k = 0; k <= M; k++) {
      const f = Math.min(n - 1, k / sub), i0 = Math.min(n - 2, Math.floor(f)), u = f - i0, P = mid[i0].clone().lerp(mid[i0 + 1], u), s = lerp(len[i0], len[i0 + 1], u), t = s / L;
      const a = mid[Math.max(0, i0 - 1)], b = mid[Math.min(n - 1, i0 + 2)], T = V3(b.x - a.x, b.y - a.y, b.z - a.z).normalize();
      const N = V3(0, 0, o.out); N.addScaledVector(T, -N.dot(T)).normalize(); const Bv = V3().crossVectors(T, N);       // N: away from her; Bv: across
      const env = sm(0.0, 0.13, s) * (1 - 0.25 * sm(0.8, 1, t)) * (0.78 + 0.22 * Math.sin(s * 11 + q1)), ph = o.ph + (s / o.lam) * TAU + 0.9 * Math.sin(s * 6.5 + q2) + 0.4 * Math.sin(s * 17 + q1);       // the waves are not all one length or one size
      P.addScaledVector(Bv, o.amp * env * Math.sin(ph) + (o.sway || 0) * t * t).addScaledVector(N, o.amp * 0.42 * env * (0.5 + 0.5 * Math.cos(ph * 1.0 + 0.9)));
      const tau = 0.75 * (HL.twist == null ? 1 : HL.twist) * env * Math.cos(ph), ct = Math.cos(tau), st = Math.sin(tau), wd = w0 * (0.30 + 0.70 * sm(0.01, 0.08, s)) * (1 - (1 - (o.tip == null ? 0.25 : o.tip)) * Math.pow(t, 2.2)), th = o.th * (1 - 0.5 * t), ring = [];
      for (let j = 0; j < NC; j++) { const an = (j / NC) * TAU, cx = Math.cos(an) * wd, cy = Math.sin(an) * th; ring.push([P.x + (Bv.x * ct + N.x * st) * cx + (N.x * ct - Bv.x * st) * cy, P.y + (Bv.y * ct + N.y * st) * cx + (N.y * ct - Bv.y * st) * cy, P.z + (Bv.z * ct + N.z * st) * cx + (N.z * ct - Bv.z * st) * cy]); }
      rings.push(ring); vs.push(t < T0 ? 0.5 * t / T0 : 0.5 + 0.5 * (t - T0) / (1 - T0));
    }
    const part = loft(rings, NC === 2 ? { v: vs, open: true } : { v: vs }); tressN++;
    for (let i = 0; i < part.uv.length; i += 2) part.uv[i] = part.uv[i] * 0.075 + 0.0917 * tressN;       // each tress takes its own strip of the strand picture, so some are darker and some lighter
    addPart(key, part, o.wf || wHair, { out: mid[Math.floor(n / 2)].clone().add(V3(0, 0, -o.out * 0.5)) });
  }
  (function buildHair() {
    const sgn = (v) => (v < 0 ? -1 : 1);
    // ----- the curtain down her back -----
    const WB = [[0.60, 0.120], [0.75, 0.140], [0.95, 0.160], [1.15, 0.166], [1.30, 0.160], [1.40, 0.134], [1.47, 0.108], [1.56, 0.074]];       // its half-width by height
    const backLat = (u, y0) => { const w0 = spline(WB, y0); return (y) => u * spline(WB, cl(y, 0.60, 1.56)) * (1 + 0.0 * w0); };
    const backRootY = (u) => hatOpenY(HB.c.z - HB.rzB * Math.sqrt(Math.max(0.05, 1 - u * u * 0.92))) + 0.006;
    const backRootZ = (u, y0) => { const x = u * 0.070, a = Math.atan2(x, -1), zo = HAT.oc[2] - (HAT.ob - 0.008) * Math.sqrt(Math.max(0, 1 - Math.pow(x / (HAT.oa - 0.006), 2))); return Math.max(zo, zBack(x, y0, 0.004)); };
    // The chains her hair hangs from (November 13: it moves with her now). Above her shoulders it still goes with her head; from the foot of
    // her neck down, each tress follows the two chains nearest to it: five down her back, two down the front of each shoulder.
    const hairHead = (w, y) => { const uh = sm(1.36, 1.46, y); return uh >= 0.999 ? [BI.head, 1] : uh <= 0.001 ? w : mixW(w, [BI.head, 1], uh); };
    const HB_Y = [1.40, 1.28, 1.16, 1.04, 0.92, 0.80, 0.68], HB_U = [-0.9, -0.45, 0, 0.45, 0.9];
    const hcB = HB_U.map((u, j) => { let z = null; return addChain('hair', 'hb' + j, 'spine3', HB_Y.map((y) => { const x = u * spline(WB, cl(y, 0.60, 1.56)), sf = zBack(x, y, 0.028); z = z == null ? (sf > 8 ? -0.10 : sf) : Math.min(z + 0.004, sf > 8 ? z : sf); return V3(x, y, z); }), { back: 1 }); });
    const wBack = (u) => { const f = cl((u - HB_U[0]) / (HB_U[1] - HB_U[0]), 0, HB_U.length - 1 - 1e-6), j = Math.floor(f); return (x, y) => hairHead(mixW(chainW(hcB[j], y), chainW(hcB[j + 1], y), f - j), y); };
    const LAYB = [[0.006, 16, 0.80, 'tressIn'], [0.024, 17, 0.74, 'tress'], [0.042, 16, 0.70, 'tress'], [0.056, 11, 0.86, 'tress']];       // clearance, how many, where they end, which shade
    for (const [off, cnt, yEnd, key] of LAYB) for (let k = 0; k < cnt; k++) {
      const u = 0.975 * Math.sin(lerp(-1, 1, (k + 0.5 + hrr(-0.3, 0.3)) / cnt) * PI / 2), y0 = backRootY(u), lat0 = backLat(u, y0), y1 = yEnd + hrr(-0.05, 0.07) + 0.06 * u * u;
      const mid = hang(off + hrr(-0.003, 0.004), y0, y1, (y) => lat0(y), true, backRootZ(u, y0), 0.004);
      tress(key, mid, { w: hrr(0.017, 0.024), th: 0.0055, amp: hrr(0.014, 0.021), lam: hrr(0.115, 0.150), ph: u * 5.0 + hrr(0, 2.4), out: -1, tip: 0.2, sway: hrr(-0.012, 0.012), wf: wBack(u) });
    }
    for (const s of [-1, 1]) for (let k = 0; k < 5; k++) {      // more at its two edges, where it turns the corner behind her shoulders
      const u = s * lerp(0.86, 0.99, (k + 0.5) / 5), y0 = backRootY(u), lat0 = backLat(u, y0), mid = hang(lerp(0.006, 0.030, hrnd()), y0, 0.80 + hrr(-0.05, 0.12), (y) => lat0(y) * (1 + 0.03 * k * sm(1.5, 1.3, y)), true, backRootZ(u, y0), 0.004);
      tress(k % 2 ? 'tress' : 'tressIn', mid, { w: hrr(0.017, 0.023), th: 0.0055, amp: hrr(0.013, 0.019), lam: hrr(0.115, 0.150), ph: u * 5.0 + hrr(0, 2.4), out: -1, tip: 0.2, sway: s * hrr(0, 0.012), wf: wBack(u) });
    }
    // ----- a bunch over the front of each shoulder -----
    // Rooted along the side of her head from her temple to behind her ear, each tress lies on the side of her head (clear of her cheek,
    // over her ear), so her profile stays clear as in C4. As it passes her neck it is led forward, and from there it lies on the
    // front of her shoulder and chest and hangs to her waist or hips. The middle of her chest stays bare.
    function bunchPts(s, v, off, y1, jit, n) {       // v: 0 the tress nearest her face .. 1 the one furthest back
      const a = lerp(1.14, 1.98, v), ca = Math.cos(a), zr = HB.c.z + (ca >= 0 ? HB.rzF : HB.rzB) * ca * 0.92, y0 = hatOpenY(zr) + 0.004, xc = lerp(0.086, 0.174, Math.pow(v, 0.9)) + (jit || 0), pts = [], yT = 1.49 + 14 * (jit || 0) * 0.5;
      n = n || Math.max(4, Math.round((y0 - y1) / 0.011)); let z = zr, wide = 0;
      for (let i = 0; i <= n; i++) {
        const y = lerp(y0, y1, i / n), down = sm(yT, 1.22, y), of = lerp(Math.min(off, 0.004), off, sm(y0 - 0.012, y0 - 0.085, y));
        wide = Math.max(wide, y > 1.44 ? headHalfW(Math.min(y, 1.615)) : 0);       // the side of her head, as wide as it has been so far on the way down
        const onHead = wide + of + 0.004 + 0.017 * sm(1.455, 1.475, y) * sm(1.530, 1.512, y) * sm(-0.050, -0.040, z) * sm(0.000, -0.008, z);       // ... and out over her ear
        const x = lerp(onHead, Math.max(xc, onHead), down) + 0.014 * sm(1.30, 0.95, y) * (v - 0.4);
        if (y <= yT) z = Math.max(z - 0.0012, zFront(s * x, y, of, y > 1.40), y > 1.27 ? lerp(zr, 0.034 - 0.022 * v, sm(yT, 1.31, y)) : -9);
        pts.push(V3(s * x, y, z));
      }
      for (let k = 0; k < 6; k++) for (let i = 1; i < pts.length - 1; i++) pts[i].z = (pts[i - 1].z + 2 * pts[i].z + pts[i + 1].z) / 4;
      return pts;
    }
    const HF_Y = [1.40, 1.28, 1.16, 1.04, 0.92], HF_V = [0.25, 0.75], hcF = {};
    for (const s of [-1, 1]) hcF[s] = HF_V.map((v, j) => { const pts = bunchPts(s, v, 0.022, 0.90, 0, 150); return addChain('hair', 'hf' + (s < 0 ? 'R' : 'L') + j, 'spine3', HF_Y.map((y) => { let b = pts[0]; for (const p of pts) if (Math.abs(p.y - y) < Math.abs(b.y - y)) b = p; return V3(b.x, y, b.z); }), { front: 1 }); });
    const wBunch = (s, v) => { const f = cl((v - HF_V[0]) / (HF_V[1] - HF_V[0]), 0, 1); return (x, y) => hairHead(mixW(chainW(hcF[s][0], y), chainW(hcF[s][1], y), f), y); };
    const LAYF = [[0.004, 9, 0.98, 'tressIn'], [0.017, 9, 0.90, 'tress'], [0.031, 7, 0.86, 'tress']];
    for (const s of [-1, 1]) for (const [off, cnt, yEnd, key] of LAYF) for (let k = 0; k < cnt; k++) {
      const v = (k + 0.5 + hrr(-0.3, 0.3)) / cnt, y1 = yEnd + hrr(-0.06, 0.08) + (v < 0.25 ? 0.08 : 0), mid = bunchPts(s, v, off + hrr(-0.002, 0.004), y1, hrr(-0.006, 0.006));
      const nr = sm(0.0, 0.28, v);       // the tresses nearest her face are slimmer and wave less, so they frame it and do not cross it
      tress(key, mid, { w: hrr(0.016, 0.022) * (0.62 + 0.38 * nr), th: 0.0055, amp: hrr(0.013, 0.019) * (0.45 + 0.55 * nr), lam: hrr(0.110, 0.145), ph: s * v * 3.0 + hrr(0, 2.4), out: 1, tip: 0.2, sway: s * hrr(0.002, 0.014), wf: wBunch(s, v) });
    }
    // ----- the fringe: curtain bangs, parted in the middle, swept back to frame her face -----
    // Chris, November 13: nothing of her hair is painted on her face; "the hair that's in front of her face is actually like 3D
    // rendered hair hanging in front of her face". Then, the same day: "her bangs should frame her face, not obscure her face ...
    // slide them back so that there's no gap between her bangs and the rest of her hair. And her face is more open".
    // So each lock is a small tress that leaves her parting under the hat, sweeps out across the top of her forehead above her brows,
    // reaches her temple, and from there lies along the side of her face with the tresses of the bunch. Nothing of it crosses her
    // brows, eyes, glasses or cheeks. [start x, how far down the side of her face it runs (height), clearance, half-width, wave]
    const FR = [[0.003, 1.500, 0.0050, 0.0085, 0.0030], [0.007, 1.468, 0.0065, 0.0095, 0.0035], [0.012, 1.530, 0.0045, 0.0085, 0.0025], [0.017, 1.440, 0.0080, 0.0100, 0.0040],
      [0.022, 1.486, 0.0055, 0.0095, 0.0035], [0.028, 1.522, 0.0045, 0.0085, 0.0025], [0.034, 1.455, 0.0070, 0.0100, 0.0040], [0.040, 1.505, 0.0050, 0.0090, 0.0030],
      [0.046, 1.425, 0.0085, 0.0100, 0.0045], [0.010, 1.538, 0.0090, 0.0075, 0.0020], [0.024, 1.412, 0.0100, 0.0100, 0.0045], [0.050, 1.476, 0.0060, 0.0090, 0.0035]];
    for (const s of [-1, 1]) FR.forEach(([x0, yE, off, w, amp], k) => {
      const yB = hatOpenY(HAT.oc[2] + HAT.ob), y0 = yB + 0.004, yBrow = FC.browY + 0.007, pts = [], NA = 12;
      // across her forehead: from the parting out to her temple, dropping from under the brim to just above her brow
      const xT = headHalfW(yBrow) - 0.004, yT = Math.max(yBrow, yB - 0.016 - 0.004 * (k % 3));
      for (let i = 0; i <= NA; i++) { const t = i / NA, x = lerp(x0, xT, Math.pow(t, 0.85)), y = lerp(y0, yT, Math.pow(t, 1.6)), f = FMAP(Math.min(x, 0.088), y); pts.push(V3(s * x, y, (f > -8 ? f : HB.c.z + 0.04) + 0.003 + (off - 0.003) * sm(0, 0.4, t))); }
      // down the side of her face: outside her cheek all the way, drawing back a little as it hangs
      let wide = xT, z = pts[NA].z; const NB = Math.max(2, Math.round((yT - yE) / 0.009));
      for (let i = 1; i <= NB && yE < yT - 0.004; i++) { const y = lerp(yT, yE, i / NB); wide = Math.max(wide, y > 1.44 ? headHalfW(y) : 0); z = Math.max(z - 0.0030, HB.c.z + 0.030 + 0.004 * (k % 4)); pts.push(V3(s * (wide + off + 0.003 + 0.006 * sm(yT, yT - 0.05, y)), y, z)); }
      for (let q = 0; q < 3; q++) for (let i = 1; i < pts.length - 1; i++) { pts[i].x = (pts[i - 1].x + 2 * pts[i].x + pts[i + 1].x) / 4; pts[i].z = (pts[i - 1].z + 2 * pts[i].z + pts[i + 1].z) / 4; }
      tress(k % 4 === 3 ? 'tressIn' : 'tress', pts, { w, th: 0.0034, amp, lam: 0.070 + 0.005 * (k % 4), ph: k * 1.9 + (s > 0 ? 0.7 : 0), out: 1, tip: 0.35, sway: s * 0.003, wisp: 0.30, wf: () => [BI.head, 1] });       // the fringe goes with her head
    });
    // ----- the plain dark sheet under the tresses: down her back, and down the front of each shoulder -----
    { const NU = 30, NY = 84, rings = [];
      for (let i = 0; i <= NY; i++) { const ring = [], t = i / NY; for (let j = 0; j <= NU; j++) { const u = lerp(-1, 1, j / NU), y0 = backRootY(u), y = lerp(y0, 0.80 + 0.05 * u * u, t), x = u * spline(WB, cl(y, 0.60, 1.56)) * lerp(0.985, 0.76, sm(1.52, 1.40, y)); ring.push([x, y, 0]); } rings.push(ring); }
      for (let j = 0; j <= NU; j++) { let z = null; for (let i = 0; i <= NY; i++) { const p = rings[i][j], sf = zBack(p[0], p[1], 0.0015 + 0.004 * sm(0, 0.1, i / NY)); z = z == null ? (sf > 8 ? HB.c.z - 0.05 : sf) : Math.min(z + 0.0012, sf); p[2] = z; } }
      const wc = []; for (let j = 0; j <= NU; j++) wc.push(wBack(lerp(-1, 1, j / NU)));
      addPart('hairmass', loft(rings, { open: true, uS: 5, vS: 4 }), (x, y, z, i) => wc[i % (NU + 1)](x, y), { out: V3(0, 1.2, 0.3) });
    }
    for (const s of [-1, 1]) { const NU = 12, NY = 56, cols = [], rings = [];
      for (let j = 0; j <= NU; j++) cols.push(bunchPts(s, j / NU, 0.0012, 1.00, 0, NY));
      for (let i = 0; i <= NY; i++) rings.push(cols.map((c) => [c[i].x, c[i].y, c[i].z]));
      const wc = []; for (let j = 0; j <= NU; j++) wc.push(wBunch(s, j / NU));
      addPart('hairmass', loft(rings, { open: true, uS: 3, vS: 4 }), (x, y, z, i) => wc[i % (NU + 1)](x, y), { out: V3(0, 1.2, -0.4) });
    }
  })();
  // ---------- her cloak (stage four) ----------
  // Chris, November 13, with a picture of her from three sides (references/moss/M1): "This ... is how Io should look, adding a little
  // bit of moss to her ... Just giving like a mossy green frill to her outfit." Only the cloak changes: moss and small ferns grow
  // along the hems of its tiers. The cloak itself is F4 (laid flat), F5 (the sleeve on an arm) and F6 (cloth, trim, shoulder, hem point):
  // open down the front, bare shoulders, sleeves in three tiers that end in a long point, a body in two layers with handkerchief hems.
  //   body    above her waist it lies on her torso; below, it rides the skirt's chains, a little outside the skirt.
  //   sleeves each hangs from 24 soft points (4 round the arm at 6 heights), each on a bone hung from a point on her arm, so the cloth
  //           hangs below her arm however she holds it.
  const ROBE = !opts.noRobe, SLEEVES = [];       // SLEEVES: every ring of her sleeves, for sleeveTick
  (function buildRobe() {
    if (!ROBE) return;
    const zig = (x) => Math.abs((((x / TAU) % 1) + 1) % 1 * 2 - 1);          // a zigzag from 0 to 1 and back, once a turn
    let ferns = 0;
    // one tier of cloth: columns at the angles A; down each column s runs from top(a) to hem(a); pt(a, s, t) is the point, out(a) the way
    // away from her, wf(a, s, pt) the bones. The moss strip and the ferns sit on its hem.
    function tier(pt, A, top, hem, NY, wf, out, o) {
      o = o || {}; const rings = [], vs = [], S = [], n = A.length; let hSum = 0;
      for (const a of A) hSum += Math.abs(hem(a) - top(a)); const vTop = Math.min(1, (hSum / n) / 0.5) * (o.vK || 1);
      for (let i = 0; i <= NY; i++) { const t = i / NY, ring = [], row = []; for (const a of A) { const s = lerp(top(a), hem(a), t); ring.push(pt(a, s, t)); row.push(s); } rings.push(ring); S.push(row); vs.push(o.trim ? 0.10 * (1 - t) : 0.004 + (1 - t) * vTop); }
      const mid = rings[NY >> 1][n >> 1], oc = out(A[n >> 1]);
      addPart('robe', loft(rings, { open: true, v: vs, uS: o.uS || 6 }), (x, y, z, i) => wf(A[i % n], S[Math.floor(i / n)][i % n], [x, y, z]), { out: V3(mid[0] - oc[0], mid[1] - oc[1], mid[2] - oc[2]) });
      if (o.moss === false) return;
      const hemR = rings[NY], up = rings[NY - 1], mr = [[], []];
      for (let j = 0; j < n; j++) { const p = hemR[j], q = up[j], oo = out(A[j]); let ux = q[0] - p[0], uy = q[1] - p[1], uz = q[2] - p[2]; const l = Math.hypot(ux, uy, uz) || 1; ux /= l; uy /= l; uz /= l;
        mr[0].push([p[0] - ux * 0.014 + oo[0] * 0.004, p[1] - uy * 0.014 + oo[1] * 0.004, p[2] - uz * 0.014 + oo[2] * 0.004]); mr[1].push([p[0] + ux * 0.028 + oo[0] * 0.005, p[1] + uy * 0.028 + oo[1] * 0.005, p[2] + uz * 0.028 + oo[2] * 0.005]);
        if ((j * 7 + ferns * 3) % (o.fernEvery || 6) === 2) {                    // a small fern stands up and out from the hem
          const L = 0.075 + 0.035 * (((j * 13) % 7) / 7), w = L * 0.27, dx = ux * 0.35 + oo[0] * 0.75, dy = uy * 0.35 + oo[1] * 0.75 + 0.55, dz = uz * 0.35 + oo[2] * 0.75, dl = Math.hypot(dx, dy, dz);
          const lx = dx / dl, ly = dy / dl, lz = dz / dl, sx = ly * oo[2] - lz * oo[1], sy = lz * oo[0] - lx * oo[2], sz = lx * oo[1] - ly * oo[0], sl = Math.hypot(sx, sy, sz) || 1, b = [p[0] + oo[0] * 0.006, p[1] + oo[1] * 0.006, p[2] + oo[2] * 0.006];
          const P4 = [[-1, 0], [1, 0], [-1, 1], [1, 1]].map(([e, f]) => [b[0] + sx / sl * w * e + lx * L * f, b[1] + sy / sl * w * e + ly * L * f, b[2] + sz / sl * w * e + lz * L * f]);
          const wj = wf(A[j], S[NY][j], p); addPart('fern', { pos: [].concat(...P4), uv: [0, 0, 1, 0, 0, 1, 1, 1], idx: [0, 1, 2, 1, 3, 2] }, () => wj, {}); ferns++; } }
      addPart('moss', loft(mr, { open: true, uS: o.mossU || Math.max(2, Math.round(n / 9)), vS: 1 }), (x, y, z, i) => wf(A[i % n], S[NY][i % n], hemR[i % n]), {});
    }
    // ----- the body -----
    const robeS = (a, y, off) => {
      const lo = skirtPt(Math.min(y, 1.0), a, 1.0, off + 0.012); if (y <= 1.0) return [lo[0], y, lo[2]];
      const u = ((((a - PI) / TAU) % 1) + 1) % 1, tp = ioTorso(u, Math.max(y, 1.06)), k = sm(1.0, 1.06, y);
      return [lerp(lo[0], tp[0] + (off + 0.004) * Math.sin(a), k), y, lerp(lo[2], tp[2] + (off + 0.004) * Math.cos(a), k)];
    };
    const wBody = (a, y, p) => (y > 1.02 ? wTorso(p[0], y, p[2]) : wSkirt(p[0], y, p[2])), outB = (a) => [Math.sin(a), 0, Math.cos(a)];
    const AB = [], A0 = 0.50; for (let j = 0; j <= 72; j++) AB.push(lerp(A0, TAU - A0, j / 72));
    const topB = (a) => 1.334 - 0.119 * sm(0.80, 0.955, Math.abs(Math.sin(a)));         // over her shoulders in front and behind; under her arms it starts at the armpit
    const offB = (y) => lerp(0.005, 0.015, sm(1.25, 1.02, y));
    tier((a, y) => robeS(a, y, offB(y)), AB, topB, (a) => 0.56 + 0.15 * zig(a * 4 + 0.6), 30, wBody, outB, { uS: 9, fernEvery: 7 });
    tier((a, y) => robeS(a, y, 0.007), AB, () => 0.74, (a) => 0.33 - 0.17 * zig(a * 4 + 3.7) - 0.05 * Math.exp(-Math.pow((a - PI) / 0.35, 2)), 22, wBody, outB, { uS: 9, fernEvery: 6 });
    // ----- the sleeves -----
    for (const [S, s] of SIDES) {
      const sh = restPts['sh' + S], d = armDir[S], ox = s * Math.cos(A_POSE), oy = Math.sin(A_POSE);
      const P = (sl, a, r) => [sh.x + d.x * sl + ox * r * Math.cos(a), sh.y + d.y * sl + oy * r * Math.cos(a), sh.z + r * Math.sin(a)];
      const armRad = (sl, a) => { const q = armPt(S, Math.min(sl, 0.44), a), m = Math.min(sl, 0.44); return Math.hypot(q[0] - sh.x - d.x * m, q[1] - sh.y - d.y * m, q[2] - sh.z); };
      const rIn = (sl) => armRad(sl, PI) + 0.007 + 0.022 * sm(0.30, 0.60, sl);         // toward her body the sleeve stays close to her arm, so it clears her side and her skirt
      const R = (sl, a, ro, rf) => { const ca = Math.cos(a), sa = Math.sin(a), ex = ca >= 0 ? ro : Math.min(ro, rIn(sl)); return Math.max(1 / Math.sqrt((ca * ca) / (ex * ex) + (sa * sa) / (rf * rf)), sl < 0.45 ? armRad(sl, a) + 0.005 : 0); };
      const outS = (a) => [ox * Math.cos(a), oy * Math.cos(a), Math.sin(a)];
      // Stage nine (Chris, November 13: "the arms pass through the sleeves of the cloak"). A sleeve was 24 points that each hung from a
      // point of her arm, so with her forearm raised the whole sleeve hung under it and her arm came out through the cloth.
      // Now each tier is a row of rings round her arm (F5: on a raised arm each tier rests on top of the arm and hangs below it).
      // A ring follows her arm round the bend of her elbow, and slides toward the ground until its top rests on her arm; how far it
      // may slide each way is measured here, so her arm is always inside it (the sliding is done in I99_static.js, sleeveTick).
      // The long point of the last tier, past her wrist, hangs from the cuff ring as a soft chain.
      const TIERS = [[0.085, 0.255, 0.035, 0.052, 0.085, 0.080, 0.012], [0.20, 0.385, 0.045, 0.058, 0.105, 0.098, 0.014], [0.33, 0.398, 0.462, 0.062, 0.120, 0.112, 0.016]];
      const axisPt = (sl) => V3(sh.x + d.x * sl, sh.y + d.y * sl, sh.z);
      const wl = (a) => Math.pow(0.5 + 0.5 * Math.cos(a - 3.9), 2.2);                  // the long point hangs at the back of her arm, on the side toward her body
      const hemOf = (ti, a) => TIERS[ti][1] + TIERS[ti][2] * wl(a) + TIERS[ti][6] * zig(a * 6 + ti);
      const tierRad = (ti, sl, a) => { const T = TIERS[ti], hm = hemOf(ti, a), t = cl((sl - T[0]) / (hm - T[0]), 0, 1), k = Math.pow(t, 0.8); return R(Math.min(sl, hm), a, lerp(T[3], T[4], k), lerp(T[3], T[5], k)); };
      const ST_SL = [[0.17, 0.26], [0.20, 0.29, 0.39], [0.33, 0.40]], NB = 48, ND = 16;
      const st = ST_SL.map((row, ti) => row.map((sl, k) => {
        const nm = 'sl' + S + ti + '_' + k, c = axisPt(sl), par = (sl < L_UARM ? 'uarm' : 'farm') + S; addBone(nm, par, c.x, c.y, c.z);
        const ring = []; for (let j = 0; j < NB; j++) { const a = (j / NB) * TAU, r = tierRad(ti, sl, a), ra = armRad(Math.min(sl, 0.44), a); ring.push([r * Math.cos(a), r * Math.sin(a), ra + Math.min(0.006, r - ra - 0.0005)]); }
        const slack = [];                                                             // slack[j]: how far the ring may slide toward angle j before her arm touches it
        for (let j = 0; j < ND; j++) { const ph = (j / ND) * TAU, ux = Math.cos(ph), uz = Math.sin(ph); let lo = 0, hi = 0.2;
          for (let it = 0; it < 14; it++) { const m = (lo + hi) / 2, qx = -ux * m, qz = -uz * m; let ok = Math.hypot(qx, qz) < tierRad(ti, sl, Math.atan2(qz, qx)); if (ok) for (const [bx, bz, need] of ring) if (Math.hypot(bx - qx, bz - qz) < need) { ok = false; break; } if (ok) lo = m; else hi = m; }
          slack.push(lo); }
        const rad = []; for (let j = 0; j < ND; j++) rad.push(tierRad(ti, sl, (j / ND) * TAU));
        return { name: nm, S, sl, ti, par, slack, rad };
      }));
      const tailN = [0.40, 0.52, 0.64, 0.76, 0.88], cuff = st[2][1].name;
      const tail = addChain('sleeve', 'svt' + S, cuff, tailN.map(axisPt), { yaw: 'spine3', soft: { k: 0.05, d: 0.15, g: 0.92, col: 'hg', pad: 0.020 } });
      SLEEVES.push(...st[0], ...st[1], ...st[2]);
      const wA = (nm) => [BI[nm], 1];
      const tailW = (sl) => { const n = tail.names.length; let k = 0; while (k < n - 1 && sl > tailN[k + 1]) k++; const t = cl((sl - tailN[k]) / (tailN[k + 1] - tailN[k]), 0, 1), bn = (i) => wA(tail.names[i]);
        if (t < 0.5) return k > 0 ? mixW(bn(k - 1), bn(k), 0.5 + t) : mixW(wA(cuff), bn(0), 2 * t);
        return k === n - 1 ? bn(k) : mixW(bn(k), bn(k + 1), t - 0.5); };
      const wSl = (ti) => (a, sl) => { const row = st[ti], n = row.length;
        if (sl <= row[0].sl) return ti === 0 ? mixW(wA('uarm' + S), wA(row[0].name), cl((sl - 0.085) / (row[0].sl - 0.085), 0, 1)) : wA(row[0].name);
        for (let k = 0; k < n - 1; k++) if (sl <= row[k + 1].sl) return mixW(wA(row[k].name), wA(row[k + 1].name), (sl - row[k].sl) / (row[k + 1].sl - row[k].sl));
        return ti === 2 ? tailW(sl) : wA(row[n - 1].name); };
      const AS = []; for (let j = 0; j <= 32; j++) AS.push((j / 32) * TAU);
      // the lower two tiers stop short of her wrist on the outside, so her bracelets show
      TIERS.forEach(([s0, s1, lng, r0, ro, rf, zz], ti) => {
        tier((a, sl, t) => { const k = Math.pow(t, 0.8); return P(sl, a, R(sl, a, lerp(r0, ro, k), lerp(r0, rf, k))); }, AS, () => s0, (a) => hemOf(ti, a), 14, wSl(ti), outS, { uS: 5, fernEvery: ti === 2 ? 5 : 6, mossU: 3 });
      });
      // the gathered band round her upper arm, and the cloth in front of and behind her bare shoulder that joins the sleeve to the body
      const wUp = () => [BI['uarm' + S], 1], skinP = (a, sl, off) => { const q = armPt(S, sl, a), oo = outS(a); return [q[0] + oo[0] * off, q[1] + oo[1] * off, q[2] + oo[2] * off]; };
      tier((a, sl) => skinP(a, sl, 0.0055), AS, () => 0.066, () => 0.090, 2, wUp, outS, { trim: true, moss: false, uS: 3 });
      for (const [a0, a1] of [[0.95, 2.25], [4.05, 5.35]]) { const AF = []; for (let j = 0; j <= 8; j++) AF.push(lerp(a0, a1, j / 8)); tier((a, sl) => skinP(a, sl, 0.0045), AF, () => -0.034, () => 0.070, 8, wUp, outS, { moss: false, uS: 1, vK: 3 }); }
    }
  })();
  // ---------- belt, pouch, crystal, necklaces, bracelets (stage five) ----------
  // Chris, November 13: "Let's move on to the belt pouch and Crystal the necklace and bracelets". Shapes from F1 (both necklaces, the
  // six bracelets), F2 (the moon pendant), F3 (belt, pouch, crystal) and D4 (bracelets on her wrists); where they sit from M1 and G8.
  // The pouch and the crystal each hang from the belt on one soft bone, so they swing. The rest is fixed to her body.
  (function buildGear() {
    if (opts.noGear) return;
    const tube = (key, pts, r, n, wf, up) => { const rings = tubeRings(pts, pts.map((p, i) => (typeof r === 'function' ? r(i / (pts.length - 1)) : r)), n, up || null); addPart(key, loft(rings, { capA: true, capB: true }), wf, { out: centroidOf(rings) }); };
    const ball = (key, c, r, wf, sy) => { const rings = []; for (let i = 1; i <= 4; i++) { const la = (PI * i) / 5, ring = []; for (let j = 0; j < 8; j++) ring.push([c.x + r * Math.sin(la) * Math.cos((j / 8) * TAU), c.y + r * (sy || 1) * Math.cos(la), c.z + r * Math.sin(la) * Math.sin((j / 8) * TAU)]); rings.push(ring); } addPart(key, loft(rings, { capA: true, capB: true }), wf, { out: c }); };
    const hoop = (key, c, R, r, wf, ax) => { const pts = []; for (let i = 0; i <= 20; i++) { const a = (i / 20) * TAU; pts.push(ax === 'y' ? V3(c.x + R * Math.cos(a), c.y, c.z + R * Math.sin(a)) : V3(c.x + R * Math.cos(a), c.y + R * Math.sin(a), c.z)); } tube(key, pts, r, 6, wf); };
    // a crescent moon, horns up, flat against her (F2)
    const crescent = (c, R, wf) => { const pts = [], rad = []; for (let i = 0; i <= 16; i++) { const t = i / 16, a = lerp(-2.75, -0.39, t); pts.push(V3(c.x + R * 0.82 * Math.cos(a), c.y + R * 0.82 * Math.sin(a), c.z)); rad.push([0.0021, Math.max(0.0006, R * 0.34 * Math.pow(Math.sin(PI * t), 0.75))]); } const rings = tubeRings(pts, rad, 8, V3(0, 0, 1)); addPart('gearGold', loft(rings, { capA: true, capB: true }), wf, { out: V3(c.x, c.y - R, c.z) }); };
    const frontZ = (x, y) => { let best = 0, bd = 9; for (let i = 0; i <= 80; i++) { const p = ioTorso(0.27 + 0.46 * (i / 80), y), dd = Math.abs(p[0] - x); if (dd < bd) { bd = dd; best = p[2]; } } return best; };
    const wT = (x, y, z) => wTorso(x, y, z), wHips = () => [BI.hips, 1];
    // ----- necklaces -----
    { const pts = []; for (let i = 0; i <= 28; i++) { const t = lerp(-1, 1, i / 28), x = 0.050 * t, y = 1.300 + 0.050 * Math.pow(Math.abs(t), 1.6); pts.push(V3(x, y, frontZ(x, y) + 0.0024)); }
      tube('gearSilver', pts, 0.0008, 5, wT); const zc = frontZ(0, 1.290) + 0.0045; ball('crystal', V3(0, 1.2885, zc), 0.0046, wT, 1.45); ball('gearSilver', V3(0, 1.2975, zc - 0.001), 0.0016, wT); }      // the fine silver chain and its clear drop
    { const pts = []; for (let i = 0; i <= 40; i++) { const t = lerp(-1, 1, i / 40), x = 0.052 * Math.sign(t) * Math.pow(Math.abs(t), 0.9), y = 1.222 + 0.128 * Math.pow(Math.abs(t), 1.25); pts.push(V3(x, y, frontZ(x, y) + 0.0032)); }
      tube('leather', pts, 0.0013, 5, wT);                                                                                         // the dark cord
      const z1 = frontZ(0, 1.20) + 0.0055, z2 = frontZ(0, 1.168) + 0.0055, z3 = frontZ(0, 1.135) + 0.0055;
      hoop('gearGold', V3(0, 1.2185, z1), 0.0034, 0.0009, wT); crescent(V3(0, 1.2035, z1), 0.0165, wT); crescent(V3(0, 1.1745, z2), 0.0105, wT);
      tube('gearGold', [V3(0, 1.160, z2), V3(0, 1.118, z3)], 0.0021, 6, wT); tube('gearGold', [V3(-0.0085, 1.1445, z3), V3(0.0085, 1.1445, z3)], 0.0021, 6, wT); }                // the cross under the two moons
    // ----- belt and its ring buckle -----
    { const pts = []; for (let i = 0; i <= 72; i++) { const p = skirtPt(1.056, (i / 72) * TAU, 1.0, 0.0085); pts.push(V3(p[0], 1.056, p[2])); }
      const rings = tubeRings(pts, pts.map(() => [0.0135, 0.0019]), 8, V3(0, 1, 0)); addPart('leather', loft(rings, {}), wHips, { out: V3(0, 1.056, IO_SKIRT_CZ) });
      const b = skirtPt(1.056, 0, 1.0, 0.0125); hoop('gearGold', V3(0, 1.056, b[2]), 0.0195, 0.0030, wHips); tube('gearGold', [V3(-0.019, 1.056, b[2] + 0.001), V3(0.012, 1.056, b[2] + 0.002)], 0.0016, 5, wHips); }
    // ----- the pouch on her right hip -----
    { const a = -0.66, t = [Math.cos(a), 0, -Math.sin(a)], top = V3(...skirtPt(1.040, a, 1.0, 0.030)), bot = V3(...skirtPt(0.925, a, 1.0, 0.036)), ax = bot.clone().sub(top), L = ax.length(); ax.normalize();
      const tv = V3(...t), nv = V3().crossVectors(tv, ax).normalize(); if (nv.x * Math.sin(a) + nv.z * Math.cos(a) < 0) nv.negate();
      addChain('gear', 'pouch', 'hips', [top.clone().add(V3(0, 0.012, 0)), bot], { yaw: 'hips', soft: { k: 0.10, d: 0.22, g: 0.55, col: 'sg', pad: 0.030 } }); const wP = () => [BI.pouch_0, 1];
      const rings = []; for (let i = 0; i <= 12; i++) { const s = i / 12, w = 0.044 * Math.pow(Math.sin(PI * Math.min(1, 0.16 + 0.84 * s) * 0.5 + (s > 0.62 ? (s - 0.62) * 1.9 : 0)), 0.7) * (s > 0.62 ? Math.sqrt(Math.max(0.02, 1 - Math.pow((s - 0.62) / 0.385, 2))) : 1), dp = 0.019 * (0.55 + 0.45 * Math.sin(PI * Math.min(1, s * 1.15))) * (s > 0.85 ? Math.sqrt(Math.max(0.03, 1 - Math.pow((s - 0.85) / 0.155, 2))) : 1), c = top.clone().addScaledVector(ax, L * s), ring = [];
        for (let j = 0; j < 16; j++) { const th = (j / 16) * TAU, e = 2 / 3.2, cx = Math.cos(th), sx = Math.sin(th), px = Math.sign(cx) * Math.pow(Math.abs(cx), e) * w, pz = Math.sign(sx) * Math.pow(Math.abs(sx), e) * dp; ring.push([c.x + tv.x * px + nv.x * (pz + dp * 0.5), c.y + tv.y * px + nv.y * (pz + dp * 0.5), c.z + tv.z * px + nv.z * (pz + dp * 0.5)]); } rings.push(ring); }
      addPart('leather', loft(rings, { capA: true, capB: true }), wP, { out: top.clone().lerp(bot, 0.5) });
      const face = (s, off) => top.clone().addScaledVector(ax, L * s).addScaledVector(nv, 0.019 * 1.5 + off);
      for (const [s, r] of [[0.30, 0.0125], [0.60, 0.0105]]) { const c = face(s, 0.002), pp = []; for (let i = 0; i <= 6; i++) pp.push(c.clone().addScaledVector(ax, lerp(-r, r, i / 6))); tube('gearGold', pp, (u) => [0.0015, Math.max(0.0008, r * 0.72 * Math.sin(PI * u))], 6, wP, nv); }      // the two gold filigree pieces, as plain gold lozenges
      tube('gearGold', [bot.clone().addScaledVector(nv, 0.012), bot.clone().addScaledVector(nv, 0.012).add(V3(0, -0.018, 0))], 0.0008, 4, wP); ball('gearGold', bot.clone().addScaledVector(nv, 0.012).add(V3(0, -0.026, 0)), 0.0078, wP);                    // the gold ball hanging under it
      for (const e of [-1, 1]) tube('leather', [top.clone().addScaledVector(tv, e * 0.022).add(V3(0, 0.034, 0)).addScaledVector(nv, -0.010), top.clone().addScaledVector(tv, e * 0.022).addScaledVector(nv, 0.016)], [0.0075, 0.0016], 6, wP); }      // its two belt loops
    // ----- the crystal on its chain, at the front of her left hip -----
    { const a = 0.36, top = V3(...skirtPt(1.044, a, 1.0, 0.012)), p1 = V3(...skirtPt(0.965, a, 1.0, 0.020)), tip = V3(...skirtPt(0.895, a, 1.0, 0.022));
      addChain('gear', 'cryst', 'hips', [top, tip], { yaw: 'hips', soft: { k: 0.05, d: 0.09, g: 0.90, col: 'sg', pad: 0.022 } }); const wC = () => [BI.cryst_0, 1];
      hoop('gearGold', top.clone().add(V3(0, -0.004, 0.002)), 0.0052, 0.0011, wC); tube('gearGold', [top.clone().add(V3(0, -0.009, 0.002)), p1.clone().add(V3(0, 0.006, 0))], 0.0011, 5, wC);
      tube('gearGold', [p1.clone().add(V3(0, 0.006, 0)), p1.clone().add(V3(0, -0.006, 0))], (u) => lerp(0.0045, 0.0088, u), 8, wC);
      for (let j = 0; j < 4; j++) ball('gearGold', p1.clone().add(V3(0.0092 * Math.cos(j * PI / 2 + 0.6), -0.003, 0.0092 * Math.sin(j * PI / 2 + 0.6))), 0.0026, wC);
      const d = tip.clone().sub(p1).normalize(), q = (s) => p1.clone().add(V3(0, -0.006, 0)).addScaledVector(d, s);
      const rings = tubeRings([q(0), q(0.004), q(0.046), q(0.060)], [0.0052, 0.0076, 0.0070, 0.0004], 6, null); addPart('crystal', loft(rings, { capA: true, capB: true }), wC, { out: q(0.03) }); }
    // ----- bracelets: black beads nearest her hand, then wood, then small gold (D4) -----
    for (const [S, s] of SIDES) { const wF = () => [BI['ftw' + S], 1], ox = s * Math.cos(A_POSE), oy = Math.sin(A_POSE);
      for (const [key, sl, rb, N] of [['bead', 0.4285, 0.0042, 19], ['wood', 0.4175, 0.0046, 17], ['gearGold', 0.4085, 0.0022, 36]])
        for (let k = 0; k < N; k++) { const a = (k / N) * TAU + sl * 40, p = armPt(S, sl, a), e = rb * 0.8; ball(key, V3(p[0] + ox * Math.cos(a) * e, p[1] + oy * Math.cos(a) * e, p[2] + Math.sin(a) * e), rb, wF); } }
  })();
  // ---------- her book and her blades (stage seven) ----------
  // Chris, November 13: "let's continue on to the books and blades". From G1 (the book shut), G2 (open), G5 (the sickle), G6 (the dagger
  // and its sheath) and G8 (where she carries them: the book in her left arm, the dagger at her left hip).
  //   book    one bone of its own, set every frame (I99_static.js): shut in her left arm, open when she reads or when it floats beside her.
  //   dagger  in its sheath on her belt, on one soft bone.
  //   sickle  in her right hand, shown only while she holds it.
  const BOOK = { C: V3(0.6, 1.1, 0), w: 0.150, h: 0.205, t: 0.042 };
  addBone('book', null, BOOK.C.x, BOOK.C.y, BOOK.C.z);
  function bookCoverTexIo() {                      // back cover | spine | front cover, side by side (G1)
    const W = 640, H = 512, c = cvs(W, H), g = c.getContext('2d'), own = seed; seed = 9091;
    g.fillStyle = '#3a2418'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 2600; i++) { g.fillStyle = rnd() > 0.5 ? 'rgba(90,58,36,0.10)' : 'rgba(10,5,2,0.14)'; g.fillRect(rnd() * W, rnd() * H, 2 + rnd() * 9, 1 + rnd() * 3); }
    g.strokeStyle = '#c99a3e'; g.fillStyle = '#c99a3e';
    for (const x0 of [0, 320]) { g.lineWidth = 2.2; g.strokeRect(x0 + 20, 22, 216, 468); g.lineWidth = 1; g.strokeRect(x0 + 28, 30, 200, 452);
      for (const [cx, cy, sx, sy] of [[x0 + 2, 2, 1, 1], [x0 + 254, 2, -1, 1], [x0 + 2, 510, 1, -1], [x0 + 254, 510, -1, -1]]) { g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + sx * 46, cy); g.lineTo(cx, cy + sy * 46); g.closePath(); g.fill(); }
      if (x0) { const cx = x0 + 128, cy = 256; g.lineWidth = 1.6; g.beginPath(); g.arc(cx, cy, 44, 0, TAU); g.stroke(); g.beginPath(); g.arc(cx, cy, 30, 0, TAU); g.stroke();
        for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU, L = k % 2 ? 40 : 66; g.beginPath(); g.moveTo(cx + Math.cos(a - 0.16) * 9, cy + Math.sin(a - 0.16) * 9); g.lineTo(cx + Math.cos(a) * L, cy + Math.sin(a) * L); g.lineTo(cx + Math.cos(a + 0.16) * 9, cy + Math.sin(a + 0.16) * 9); g.closePath(); g.fill(); } } }
    g.fillStyle = '#2c1a11'; g.fillRect(256, 0, 64, H); g.fillStyle = '#4a2f1f'; for (const y of [70, 160, 250, 340, 430]) g.fillRect(256, y, 64, 12); g.fillStyle = '#c99a3e'; for (const y of [118, 208, 298, 388]) { g.fillRect(285, y - 12, 6, 24); g.fillRect(276, y - 3, 24, 6); }
    seed = own; return ctex(c);
  }
  function bookPageTexIo() {                       // one page: handwriting, a pressed sprig, a green leaf (G2)
    const W = 384, H = 512, c = cvs(W, H), g = c.getContext('2d'), own = seed; seed = 4477;
    const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, '#cdbb96'); gr.addColorStop(0.18, '#e9dcba'); gr.addColorStop(1, '#e3d4ae'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(70,48,30,0.62)'; g.lineWidth = 1.5;
    for (let r = 0; r < 19; r++) { const y = 44 + r * 23; if (r > 9 && r < 16) continue; let x = 40; while (x < W - 44) { const l = 10 + rnd() * 30; g.beginPath(); g.moveTo(x, y + rnd() * 3); g.quadraticCurveTo(x + l / 2, y - 5 + rnd() * 9, x + l, y + rnd() * 3); g.stroke(); x += l + 6 + rnd() * 8; } }
    g.strokeStyle = '#5c6a2c'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(118, 398); g.quadraticCurveTo(132, 330, 120, 276); g.stroke(); g.fillStyle = '#6f8234';
    for (let i = 0; i < 6; i++) for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(124 + sd * 17, 380 - i * 19, 15, 5.5, -sd * 0.6, 0, TAU); g.fill(); }
    g.fillStyle = '#58762a'; g.beginPath(); g.ellipse(262, 334, 30, 54, 0.35, 0, TAU); g.fill(); g.strokeStyle = '#3f5a1d'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(244, 384); g.lineTo(280, 286); g.stroke();
    seed = own; return ctex(c);
  }
  (function buildProps() {
    if (opts.noProps) return;
    const wB = () => [BI.book, 1], C = BOOK.C, w = BOOK.w, h = BOOK.h, t = BOOK.t;
    const quad = (key, P, uv, wf) => addPart(key, { pos: [].concat(...P), uv, idx: [0, 1, 2, 0, 2, 3] }, wf, {});          // four corners in order round the face, seen from outside
    const box = (key, c, hx, hy, hz, wf, uvF) => { const f = (a, b, d, e) => quad(key, [a, b, d, e].map(([x, y, z]) => [c[0] + x * hx, c[1] + y * hy, c[2] + z * hz]), uvF || [0, 0, 1, 0, 1, 1, 0, 1], wf);
      f([-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]); f([1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]); f([1, -1, 1], [1, -1, -1], [1, 1, -1], [1, 1, 1]); f([-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]); f([-1, 1, 1], [1, 1, 1], [1, 1, -1], [-1, 1, -1]); f([-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]); };
    // shut: the spine is at -x, the front cover faces +z
    { const x0 = C.x - w / 2, x1 = C.x + w / 2, y0 = C.y - h / 2, y1 = C.y + h / 2, zf = C.z + t / 2, zb = C.z - t / 2;
      quad('bookShut', [[x0, y0, zf], [x1, y0, zf], [x1, y1, zf], [x0, y1, zf]], [0.5, 0, 0.9, 0, 0.9, 1, 0.5, 1], wB); quad('bookShut', [[x1, y0, zb], [x0, y0, zb], [x0, y1, zb], [x1, y1, zb]], [0, 0, 0.4, 0, 0.4, 1, 0, 1], wB);
      quad('bookShut', [[x0, y0, zb], [x0, y0, zf], [x0, y1, zf], [x0, y1, zb]], [0.4, 0, 0.5, 0, 0.5, 1, 0.4, 1], wB);
      box('bookShutPg', [C.x + 0.003, C.y, C.z], w / 2 - 0.006, h / 2 - 0.005, t / 2 - 0.004, wB, [0.02, 0.02, 0.06, 0.02, 0.06, 0.06, 0.02, 0.06]);
      quad('bookRibbon', [[C.x - 0.03, y0 - 0.035, C.z], [C.x - 0.018, y0 - 0.035, C.z], [C.x - 0.018, y0 + 0.004, C.z], [C.x - 0.03, y0 + 0.004, C.z]], [0, 0, 1, 0, 1, 1, 0, 1], wB); }
    // open: the spine runs up the middle, the pages face +z, each half lifted a little at its outer edge
    for (const e of [-1, 1]) { const ca = Math.cos(0.17), sa = Math.sin(0.17), P = (u, v, d) => [C.x + e * (u * ca - d * sa * 0), C.y + v, C.z + u * sa + d];
      const a = P(0, -h / 2, -0.004), b = P(w, -h / 2, -0.004), c2 = P(w, h / 2, -0.004), d2 = P(0, h / 2, -0.004), u0 = e > 0 ? 0.5 : 0.4, u1 = e > 0 ? 0.9 : 0;
      quad('bookOpen', e > 0 ? [b, a, d2, c2] : [a, b, c2, d2], e > 0 ? [u1, 0, u0, 0, u0, 1, u1, 1] : [u0, 0, u1, 0, u1, 1, u0, 1], wB);                                  // the cover, seen from behind
      const NP = 6, rows = [[], []]; for (let i = 0; i <= NP; i++) { const u = (i / NP) * (w - 0.008), lift = 0.004 + 0.013 * Math.sin(Math.min(1, u / 0.07) * PI / 2) - 0.004 * (u / w); rows[0].push(P(u, -h / 2 + 0.005, lift)); rows[1].push(P(u, h / 2 - 0.005, lift)); }
      const pos = [], uv = [], idx = []; for (let i = 0; i <= NP; i++) { pos.push(...rows[0][i], ...rows[1][i]); const uu = e > 0 ? i / NP : 1 - i / NP; uv.push(uu, 0, uu, 1); if (i < NP) { const k = i * 2; if (e > 0) idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); else idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
      addPart('bookOpenPg', { pos, uv, idx }, wB, {});
      quad('bookOpenPg', e > 0 ? [P(w - 0.008, -h / 2 + 0.005, 0.009), P(w - 0.008, -h / 2 + 0.005, -0.004), P(w - 0.008, h / 2 - 0.005, -0.004), P(w - 0.008, h / 2 - 0.005, 0.009)] : [P(w - 0.008, -h / 2 + 0.005, -0.004), P(w - 0.008, -h / 2 + 0.005, 0.009), P(w - 0.008, h / 2 - 0.005, 0.009), P(w - 0.008, h / 2 - 0.005, -0.004)], [0.02, 0.02, 0.06, 0.02, 0.06, 0.06, 0.02, 0.06], wB); }
    const tube = (key, pts, r, n, wf, up) => { const rings = tubeRings(pts, pts.map((p, i) => (typeof r === 'function' ? r(i / (pts.length - 1)) : r)), n, up || null); addPart(key, loft(rings, { capA: true, capB: true }), wf, { out: centroidOf(rings) }); };
    // ----- the dagger in its sheath, at her left hip (G6) -----
    { const a = 1.02, T = V3(...skirtPt(1.050, a, 1.0, 0.026)), B = V3(...skirtPt(0.845, a, 1.0, 0.030)).add(V3(0, 0, 0.05)), ax = B.clone().sub(T).normalize(), nv = V3(Math.sin(a), 0, Math.cos(a));
      addChain('gear', 'dagger', 'hips', [T.clone().addScaledVector(ax, -0.02), B], { yaw: 'hips', soft: { k: 0.10, d: 0.22, g: 0.55, col: 'sg', pad: 0.026 } }); const wD = () => [BI.dagger_0, 1], at = (s) => T.clone().addScaledVector(ax, s);
      tube('propLeather', [at(0), at(0.05), at(0.15), at(0.205)], (u) => [0.006, lerp(0.016, 0.006, u)], 8, wD, nv); tube('propGold', [at(-0.004), at(0.014)], [0.0072, 0.0175], 8, wD, nv); tube('propGold', [at(0.185), at(0.214)], (u) => [0.0062, lerp(0.0085, 0.002, u)], 8, wD, nv);
      tube('propWood', [at(-0.022), at(-0.050), at(-0.085), at(-0.108)], (u) => 0.0085 + 0.003 * Math.sin(PI * u), 8, wD); tube('propGold', [at(-0.108), at(-0.120)], 0.0095, 8, wD);
      const gp = []; for (let i = 0; i <= 10; i++) { const tt = lerp(-1, 1, i / 10); gp.push(at(-0.012 + 0.016 * tt * tt).add(V3().crossVectors(ax, nv).normalize().multiplyScalar(0.027 * tt))); } tube('propGold', gp, (u) => [0.0030, 0.0018 + 0.0058 * Math.sin(PI * u)], 6, wD, nv); }       // the crescent guard, horns toward the blade
    // ----- the sickle in her right hand (G5): a dark twisted grip, a golden crescent blade -----
    { const S = 'R', s = -1, wr = restPts.wrR, d0 = armDir.R, p0 = V3(-s * Math.cos(A_POSE), -Math.sin(A_POSE), 0), Z = V3(0, 0, 1), Pc = wr.clone().addScaledVector(d0, 0.073).addScaledVector(p0, 0.024), wS = () => [BI.handR, 1];
      tube('sickleGrip', [Pc.clone().addScaledVector(Z, -0.055), Pc.clone().addScaledVector(Z, 0.075)], 0.0105, 8, wS); tube('sickleGold', [Pc.clone().addScaledVector(Z, 0.070), Pc.clone().addScaledVector(Z, 0.090)], 0.0125, 8, wS); tube('sickleGold', [Pc.clone().addScaledVector(Z, -0.068), Pc.clone().addScaledVector(Z, -0.055)], 0.0125, 8, wS);
      const R = 0.088, Cb = Pc.clone().addScaledVector(Z, 0.088).addScaledVector(d0, R), bp = [], N = 26; for (let i = 0; i <= N; i++) { const tt = (i / N) * 4.05; bp.push(Cb.clone().addScaledVector(d0, -R * Math.cos(tt)).addScaledVector(Z, R * Math.sin(tt))); }
      tube('sickleGold', bp, (u) => [0.0020, 0.0022 + 0.0165 * Math.pow(Math.sin(PI * Math.min(1, 0.12 + u * 0.88)), 0.8)], 6, wS, p0); }
  })();
  // ===== I98_fx.js: the lights and the things of her spells (stage eleven) =====
  // Chris, November 14: "Let's move on to the rest of her animations, like her spells."
  // Her magic, from the rules given with paintings H1 on: GROWING LIGHT, soft gold with a fresh green edge and pearl-white where it
  // is brightest, drifting as small motes like pollen; SPARKS that are small four-pointed stars; SILVERLEAF, a slim silver-green leaf
  // that glows gold along its edges. It never looks like fire.
  // Everything here that glows is drawn with glowOnly: it adds light and does not count as something solid, so the Flipbook look
  // gives it no ink outline (claude/HOW-TO-flipbook-look.md, section 6). Sizes are in metres, not screen pixels, so the specks
  // shrink with her when the Flipbook look draws her small.
  const glowOnly = (m, pre) => { m.blending = THREE.CustomBlending; m.blendEquation = THREE.AddEquation; m.blendSrc = pre ? THREE.OneFactor : THREE.SrcAlphaFactor; m.blendDst = THREE.OneFactor; m.blendSrcAlpha = THREE.ZeroFactor; m.blendDstAlpha = THREE.OneFactor; m.transparent = true; m.depthWrite = false; return m; };
  const FXC = { gold: [1.0, 0.78, 0.34], green: [0.56, 0.95, 0.40], pearl: [1.0, 0.96, 0.84], leaf: [0.66, 0.92, 0.72] };
  let fxSeed = 20261114; const frnd = () => { fxSeed = (fxSeed * 1664525 + 1013904223) >>> 0; return fxSeed / 4294967296; }, frs = (a) => (frnd() * 2 - 1) * a;
  const fxG = new THREE.Group(); fxG.name = 'ioSpells';

  // ----- specks of light: motes (0), four-pointed stars (1), small glowing leaves (2). One draw for all of them. -----
  const PN = 1100, IMN = 110, PT = { n: 0, pos: new Float32Array(PN * 3), vel: new Float32Array(PN * 3), life: new Float32Array(PN), max: new Float32Array(PN), size: new Float32Array(PN), col: new Float32Array(PN * 3), kind: new Float32Array(PN), rot: new Float32Array(PN), spin: new Float32Array(PN), drag: new Float32Array(PN), grav: new Float32Array(PN) }, IM = [];
  const aPos = new THREE.InstancedBufferAttribute(new Float32Array((PN + IMN) * 3), 3), aSize = new THREE.InstancedBufferAttribute(new Float32Array(PN + IMN), 1), aCol = new THREE.InstancedBufferAttribute(new Float32Array((PN + IMN) * 3), 3), aRot = new THREE.InstancedBufferAttribute(new Float32Array(PN + IMN), 1), aKind = new THREE.InstancedBufferAttribute(new Float32Array(PN + IMN), 1);
  const partGeo = new THREE.InstancedBufferGeometry(); partGeo.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3)); partGeo.setIndex([0, 1, 2, 0, 2, 3]);
  for (const [n, a] of [['iPos', aPos], ['iSize', aSize], ['iCol', aCol], ['iRot', aRot], ['iKind', aKind]]) { a.setUsage(THREE.DynamicDrawUsage); partGeo.setAttribute(n, a); }
  partGeo.instanceCount = 0;
  const partMesh = new THREE.Mesh(partGeo, glowOnly(new THREE.ShaderMaterial({ side: THREE.DoubleSide,
    vertexShader: 'attribute vec3 iPos; attribute float iSize; attribute vec3 iCol; attribute float iRot; attribute float iKind; varying vec2 vUv; varying vec3 vCol; varying float vKind;\nvoid main() { vUv = position.xy * 2.0; vCol = iCol; vKind = iKind; float c = cos(iRot), s = sin(iRot); vec2 q = vec2(c * position.x - s * position.y, s * position.x + c * position.y) * iSize; vec4 mv = modelViewMatrix * vec4(iPos, 1.0); mv.xy += q; gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'varying vec2 vUv; varying vec3 vCol; varying float vKind;\nvoid main() { float r = length(vUv); float a;\n if (vKind < 0.5) a = pow(max(0.0, 1.0 - r), 2.2);\n else if (vKind < 1.5) { vec2 p = abs(vUv); a = max(pow(max(0.0, 1.0 - r), 3.0), max(exp(-p.y * 20.0) * max(0.0, 1.0 - p.x), exp(-p.x * 20.0) * max(0.0, 1.0 - p.y))); }\n else { float w = 0.36 * (1.0 - vUv.y * vUv.y); a = (1.0 - smoothstep(w - 0.06, w + 0.02, abs(vUv.x))) * step(abs(vUv.y), 1.0) * (0.55 + 0.45 * (1.0 - smoothstep(0.0, 0.07, abs(vUv.x)))); }\n gl_FragColor = vec4(vCol * a, a); }' }), true));
  partMesh.frustumCulled = false; partMesh.renderOrder = 20; fxG.add(partMesh);
  // emit(place, speed, how long it lives, size, colour, kind, and how it slows, falls and spins)
  function emit(x, y, z, vx, vy, vz, life, size, col, kind, drag, grav, spin) { if (PT.n >= PN) return; const i = PT.n++, j = i * 3; PT.pos[j] = x; PT.pos[j + 1] = y; PT.pos[j + 2] = z; PT.vel[j] = vx; PT.vel[j + 1] = vy; PT.vel[j + 2] = vz; PT.life[i] = PT.max[i] = life; PT.size[i] = size; PT.col[j] = col[0]; PT.col[j + 1] = col[1]; PT.col[j + 2] = col[2]; PT.kind[i] = kind || 0; PT.rot[i] = frnd() * TAU; PT.spin[i] = spin == null ? frs(1.5) : spin; PT.drag[i] = drag == null ? 1.2 : drag; PT.grav[i] = grav || 0; }
  // a light that is there for this frame only: the glow in her hand, under the leaf, on a foe that is struck
  function glow(p, size, col, a, kind, rot) { if (IM.length < IMN && a > 0.003) IM.push([p.x, p.y, p.z, size, col[0] * a, col[1] * a, col[2] * a, kind || 0, rot || 0]); }
  const mote = () => { const t = frnd(); return t < 0.5 ? FXC.gold : t < 0.82 ? FXC.green : FXC.pearl; };
  function fxParticles(dt) {
    let i = 0; while (i < PT.n) { PT.life[i] -= dt; if (PT.life[i] <= 0) { const l = --PT.n; if (i !== l) { for (const k of ['life', 'max', 'size', 'kind', 'rot', 'spin', 'drag', 'grav']) PT[k][i] = PT[k][l]; for (const k of ['pos', 'vel', 'col']) for (let c = 0; c < 3; c++) PT[k][i * 3 + c] = PT[k][l * 3 + c]; } continue; }
      const j = i * 3, dk = Math.max(0, 1 - PT.drag[i] * dt); PT.vel[j] *= dk; PT.vel[j + 1] = PT.vel[j + 1] * dk - PT.grav[i] * dt; PT.vel[j + 2] *= dk; PT.pos[j] += PT.vel[j] * dt; PT.pos[j + 1] += PT.vel[j + 1] * dt; PT.pos[j + 2] += PT.vel[j + 2] * dt; PT.rot[i] += PT.spin[i] * dt; i++; }
    for (i = 0; i < PT.n; i++) { const j = i * 3, u = PT.life[i] / PT.max[i], a = Math.min(1, (1 - u) * 9) * Math.min(1, u * 2.2), tw = PT.kind[i] === 1 ? 0.7 + 0.3 * Math.sin(PT.rot[i] * 9) : 1;
      aPos.array[j] = PT.pos[j]; aPos.array[j + 1] = PT.pos[j + 1]; aPos.array[j + 2] = PT.pos[j + 2]; aSize.array[i] = PT.size[i] * (0.6 + 0.4 * u); aCol.array[j] = PT.col[j] * a * tw; aCol.array[j + 1] = PT.col[j + 1] * a * tw; aCol.array[j + 2] = PT.col[j + 2] * a * tw; aRot.array[i] = PT.kind[i] === 1 ? 0 : PT.rot[i]; aKind.array[i] = PT.kind[i]; }
    let n = PT.n; for (const m of IM) { const j = n * 3; aPos.array[j] = m[0]; aPos.array[j + 1] = m[1]; aPos.array[j + 2] = m[2]; aSize.array[n] = m[3]; aCol.array[j] = m[4]; aCol.array[j + 1] = m[5]; aCol.array[j + 2] = m[6]; aKind.array[n] = m[7]; aRot.array[n] = m[8]; n++; }
    IM.length = 0; partGeo.instanceCount = n; aPos.needsUpdate = aSize.needsUpdate = aCol.needsUpdate = aRot.needsUpdate = aKind.needsUpdate = true; partMesh.visible = n > 0;
  }

  // ----- a ribbon of light: a strip laid between pairs of points, each pair fading as it ages -----
  const RIB_V = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
  const RIB_F = 'uniform vec3 uA; uniform vec3 uB; uniform float uK; varying vec2 vUv; void main() { float e = 1.0 - abs(vUv.y * 2.0 - 1.0); float a = pow(e, 1.4) * vUv.x * uK; vec3 c = mix(uB, uA, e * e); gl_FragColor = vec4(c * a, a); }';
  const ribMat = (a, b) => glowOnly(new THREE.ShaderMaterial({ side: THREE.DoubleSide, uniforms: { uA: { value: new THREE.Vector3(a[0], a[1], a[2]) }, uB: { value: new THREE.Vector3(b[0], b[1], b[2]) }, uK: { value: 1 } }, vertexShader: RIB_V, fragmentShader: RIB_F }), true);
  function makeRibbon(N, life, a, b) {
    const pos = new THREE.BufferAttribute(new Float32Array(N * 6), 3), uv = new THREE.BufferAttribute(new Float32Array(N * 4), 2), idx = []; pos.setUsage(THREE.DynamicDrawUsage); uv.setUsage(THREE.DynamicDrawUsage);
    for (let i = 0; i < N - 1; i++) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', pos); g.setAttribute('uv', uv); g.setIndex(idx);
    const mesh = new THREE.Mesh(g, ribMat(a, b)); mesh.frustumCulled = false; mesh.renderOrder = 19; mesh.visible = false; fxG.add(mesh);
    const R = { mesh, pts: [], life, push(p, q, s) { R.pts.unshift({ p: p.clone(), q: q.clone(), age: 0, s: s == null ? 1 : s }); if (R.pts.length > N) R.pts.length = N; },
      tick(dt) { for (const t of R.pts) t.age += dt; while (R.pts.length && R.pts[R.pts.length - 1].age >= R.life) R.pts.pop(); const n = R.pts.length; mesh.visible = n > 1; if (n < 2) return;
        for (let i = 0; i < N; i++) { const t = R.pts[Math.min(i, n - 1)], u = i < n ? Math.max(0, 1 - t.age / R.life) * t.s * Math.min(1, i / 2) : 0; pos.setXYZ(i * 2, t.p.x, t.p.y, t.p.z); pos.setXYZ(i * 2 + 1, t.q.x, t.q.y, t.q.z); uv.setXY(i * 2, u, 0); uv.setXY(i * 2 + 1, u, 1); }
        pos.needsUpdate = uv.needsUpdate = true; } };
    return R;
  }

  // ----- plain shapes for the things spells are cast at -----
  const fxStd = (hex, rough) => new THREE.MeshStandardMaterial({ color: new THREE.Color(hex).convertSRGBToLinear(), roughness: rough });       // colours are given as they should look on screen
  const lathe = (pts, seg) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(Math.max(0.0001, r), y)), seg || 20);
  const capsule = (r0, r1, len, seg) => { const pts = []; for (let i = 0; i <= 6; i++) { const a = (i / 6) * PI / 2; pts.push([r0 * Math.sin(a), -r0 * Math.cos(a)]); } for (let i = 0; i <= 6; i++) { const a = (i / 6) * PI / 2; pts.push([r1 * Math.cos(a), len + r1 * Math.sin(a)]); } return lathe(pts, seg || 14); };
  const fxPart = (grp, geo, mat, x, y, z, rx, ry, rz) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, rz || 0); m.castShadow = true; m.receiveShadow = true; grp.add(m); return m; };
  // the training dummy (the magic rules: "a post with a padded canvas body, a round canvas head and two short arms")
  const DUMMY = new THREE.Group(), dummyTilt = new THREE.Group(); DUMMY.add(dummyTilt); DUMMY.position.set(0, 0, 1.40); DUMMY.visible = false; fxG.add(DUMMY);
  { const wood = fxStd(0x5f4028, 0.86), canvas = fxStd(0xa48d68, 0.96), rope = fxStd(0x6f5836, 0.9);
    fxPart(DUMMY, new THREE.CylinderGeometry(0.19, 0.23, 0.05, 18), wood, 0, 0.025, 0); fxPart(dummyTilt, new THREE.CylinderGeometry(0.034, 0.040, 1.30, 12), wood, 0, 0.65, 0);
    fxPart(dummyTilt, lathe([[0.0, 0.74], [0.11, 0.76], [0.150, 0.88], [0.158, 1.05], [0.140, 1.22], [0.085, 1.32], [0.0, 1.33]], 22), canvas, 0, 0, 0); fxPart(dummyTilt, new THREE.SphereGeometry(0.108, 20, 14), canvas, 0, 1.475, 0);
    fxPart(dummyTilt, new THREE.CylinderGeometry(0.026, 0.026, 0.60, 10), wood, 0, 1.20, 0, 0, 0, PI / 2); for (const s of [-1, 1]) fxPart(dummyTilt, capsule(0.050, 0.046, 0.10, 12), canvas, s * 0.215, 1.20, 0, 0, 0, -s * PI / 2);
    for (const y of [0.83, 1.26, 1.375]) fxPart(dummyTilt, new THREE.TorusGeometry(y > 1.3 ? 0.058 : y > 1 ? 0.112 : 0.132, 0.008, 6, 20), rope, 0, y, 0, PI / 2); }
  // the friend she heals (the magic rules: "a plain grey artist's mannequin the same height as her, with no face and no clothes")
  const ALLY = new THREE.Group(); ALLY.position.set(0, 0, 1.30); ALLY.rotation.y = PI; ALLY.visible = false; fxG.add(ALLY);
  { const grey = fxStd(0x85878f, 0.7), joint = fxStd(0x63656d, 0.6), ball = (r, x, y, z) => fxPart(ALLY, new THREE.SphereGeometry(r, 14, 10), joint, x, y, z);
    fxPart(ALLY, lathe([[0, 1.41], [0.062, 1.43], [0.082, 1.50], [0.078, 1.57], [0.05, 1.62], [0, 1.63]], 18), grey, 0, 0, 0); fxPart(ALLY, capsule(0.036, 0.034, 0.05), grey, 0, 1.345, 0);
    fxPart(ALLY, lathe([[0, 1.01], [0.10, 1.02], [0.115, 1.12], [0.14, 1.24], [0.15, 1.31], [0.10, 1.355], [0, 1.36]], 18), grey, 0, 0, 0).scale.z = 0.72; fxPart(ALLY, lathe([[0, 0.83], [0.11, 0.85], [0.135, 0.92], [0.12, 0.99], [0, 1.005]], 18), grey, 0, 0, 0).scale.z = 0.74;
    for (const s of [-1, 1]) { ball(0.046, s * 0.17, 1.30, 0); fxPart(ALLY, capsule(0.040, 0.034, 0.22), grey, s * 0.185, 1.03, 0, 0, 0, s * 0.07); ball(0.036, s * 0.20, 1.00, 0); fxPart(ALLY, capsule(0.032, 0.026, 0.20), grey, s * 0.215, 0.775, 0.012, 0.06, 0, s * 0.05); fxPart(ALLY, capsule(0.026, 0.030, 0.085), grey, s * 0.228, 0.66, 0.02, 0.1, 0, s * 0.03);
      ball(0.052, s * 0.085, 0.84, 0); fxPart(ALLY, capsule(0.058, 0.046, 0.33), grey, s * 0.09, 0.47, 0, 0, 0, s * 0.012); ball(0.044, s * 0.094, 0.455, 0); fxPart(ALLY, capsule(0.042, 0.032, 0.33), grey, s * 0.096, 0.085, 0); fxPart(ALLY, capsule(0.036, 0.034, 0.12), grey, s * 0.098, 0.036, -0.03, PI / 2, 0, 0).scale.x = 1.1; } }
  // the silverleaf (the magic rules: "a slim, pointed leaf about 8 cm long, silver-green, that glows gold along its edges and veins")
  const LEAF = new THREE.Group(); LEAF.visible = false; fxG.add(LEAF);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x8a6a3c, roughness: 0.7, side: THREE.DoubleSide, emissive: 0x000000 });
  { const pos = [], idx = [], NL = 12; for (let i = 0; i <= NL; i++) { const t = i / NL, y = (t - 0.5) * 0.08, w = 0.0105 * Math.pow(Math.sin(PI * Math.min(1, t * 0.96 + 0.02)), 0.75), bend = 0.004 * Math.sin(PI * t); pos.push(-w, y, bend + w * 0.25, 0, y, bend, w, y, bend + w * 0.25); }
    for (let i = 0; i < NL; i++) { const a = i * 3; idx.push(a, a + 1, a + 4, a, a + 4, a + 3, a + 1, a + 2, a + 5, a + 1, a + 5, a + 4); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); const m = new THREE.Mesh(g, leafMat); m.castShadow = true; LEAF.add(m); }
  const LEAF_DRY = new THREE.Color(0x8a6a3c).convertSRGBToLinear(), LEAF_FRESH = new THREE.Color(0xa9cdb0).convertSRGBToLinear(), LEAF_GLOW = new THREE.Color(0.55, 0.47, 0.20);
  function leafSet(p, q, fresh, lit, scale) { LEAF.visible = scale > 0.01; LEAF.position.copy(p); LEAF.quaternion.copy(q); LEAF.scale.setScalar(Math.max(0.001, scale)); leafMat.color.copy(LEAF_DRY).lerp(LEAF_FRESH, fresh); leafMat.emissive.copy(LEAF_GLOW).multiplyScalar(lit); }

  // ----- the crescent of light her sickle throws (I3): a flat crescent, horns back, that flies to the foe -----
  const WAVE = (() => { const pos = [], uv = [], idx = [], NW = 28, R = 0.46; for (let i = 0; i <= NW; i++) { const t = i / NW, a = lerp(-1.75, 1.75, t), w = 0.012 + 0.13 * Math.pow(Math.sin(PI * t), 0.8); pos.push(R * Math.sin(a), 0, R * Math.cos(a) - R, (R - w) * Math.sin(a), 0, (R - w) * Math.cos(a) - R + w * 0.35); uv.push(1, 0.15, 1, 1); }
    for (let i = 0; i < NW; i++) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); const m = new THREE.Mesh(g, ribMat(FXC.pearl, FXC.gold)); m.frustumCulled = false; m.renderOrder = 19; m.visible = false; fxG.add(m); return m; })();
  const RIB_CUT = makeRibbon(40, 0.50, FXC.pearl, [1.0, 0.70, 0.22]), RIB_SALVE = makeRibbon(96, 1.25, [1.0, 0.93, 0.62], [0.50, 0.92, 0.36]), RIB_SALVE2 = makeRibbon(96, 1.25, FXC.gold, [0.50, 0.92, 0.36]);
  // how far each thing has come into being (0 gone .. 1 there), slid toward what the spell being cast wants
  const FXW = { dummy: 0, ally: 0 }; let dumA = 0, dumV = 0;
  function dummyHit(v) { dumV += v; }
  function fxTick(dt, wantDummy, wantAlly, wantAlly2) {
    FXW.dummy += ((wantDummy ? 1 : 0) - FXW.dummy) * Math.min(1, dt * 4); FXW.ally += ((wantAlly ? 1 : 0) - FXW.ally) * Math.min(1, dt * 4); FXW.ally2 += ((wantAlly2 ? 1 : 0) - FXW.ally2) * Math.min(1, dt * 4);
    for (const [g, w] of [[DUMMY, FXW.dummy], [ALLY, FXW.ally], [ALLY2, FXW.ally2]]) { g.visible = w > 0.02; const e = sm(0, 1, w); g.scale.set(e, Math.max(0.001, e * (1 + 0.12 * Math.sin(PI * e))), e); }
    dumV += (-dumA * 95 - dumV * 6.5) * dt; dumA += dumV * dt; dummyTilt.rotation.x = dumA;                     // the dummy rocks on its post when it is struck, and settles
    RIB_CUT.tick(dt); RIB_SALVE.tick(dt); RIB_SALVE2.tick(dt); for (const v of VINES) v.tick(dt); fxParticles(dt);
  }
  function fxClear() { PT.n = 0; IM.length = 0; RIB_CUT.pts.length = 0; RIB_SALVE.pts.length = 0; RIB_SALVE2.pts.length = 0; WAVE.visible = false; LEAF.visible = false; fxSeed = 20261114; woodClear(); GARDEN.hide(); PAGES.visible = false; thornHide(); }
  // ===== I98b_wood.js: living wood (stage twelve): the seed, its roots of light, the sapling, and the Elderwood Guardian =====
  // Chris, November 14: "Let's continue to the Elderwood Guardian and the Moonflower" Garden.
  // Paintings H7 to H10 and I4. The magic rules: "ROOTS AND VINES of living wood: pale brown, smooth, with small green leaves opening
  // along them"; her spirits are "made of living wood, roots and leaves, with eyes of green-gold light".
  // Everything here is made of BRAIDS: a handful of round strands wound round a shape, every other one wound the other way and a
  // little deeper, so the thing reads as roots twisted together (H9) and not as a smooth statue.
  const wLin = (hex) => { const c = new THREE.Color(hex).convertSRGBToLinear(); return [c.r, c.g, c.b]; };
  const wMix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const wHash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const WOODC = { light: wLin(0xa98350), mid: wLin(0x7d5c38), dark: wLin(0x4b3421), bark: wLin(0x6a4e31), vine: wLin(0x5f6a2c), moss: wLin(0x6f8c32), leafA: wLin(0xa6d052), leafB: wLin(0x7cab3a), white: wLin(0xf6f2e2), hoof: wLin(0x3b2b1d), seed: wLin(0xd8a53e), seedD: wLin(0x9a6a22) };
  const woodMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.86, metalness: 0, side: THREE.DoubleSide });
  const wBag = () => ({ pos: [], col: [], idx: [], key: [] });
  const wCrom = (K, u, out) => { const n = K.length - 1, x = cl(u, 0, 1) * n, i = Math.min(n - 1, Math.floor(x)), t = x - i, p0 = K[Math.max(0, i - 1)], p1 = K[i], p2 = K[i + 1], p3 = K[Math.min(n, i + 2)], t2 = t * t, t3 = t2 * t;
    return out.set(0, 0, 0).addScaledVector(p0, -0.5 * t3 + t2 - 0.5 * t).addScaledVector(p1, 1.5 * t3 - 2.5 * t2 + 1).addScaledVector(p2, -1.5 * t3 + 2 * t2 + 0.5 * t).addScaledVector(p3, 0.5 * t3 - 0.5 * t2); };
  // a round strand along points. rad(i): how thick; colAt(i, a): its colour; keyAt(i): a number its triangles are sorted by (for growing and unravelling); squash(i): [across, up] for a strand that is not round
  function wTube(bag, pts, rad, sides, colAt, keyAt, squash) {
    const n = pts.length, base = bag.pos.length / 3, T = V3(), B = V3(); let N = null;
    for (let i = 0; i < n; i++) { T.copy(pts[Math.min(n - 1, i + 1)]).sub(pts[Math.max(0, i - 1)]).normalize();
      if (!N) { N = V3(1, 0, 0); if (Math.abs(T.x) > 0.8) N.set(0, 0, 1); } N.addScaledVector(T, -N.dot(T)).normalize(); B.crossVectors(T, N);
      const r = rad(i), q = squash ? squash(i) : null, ra = q ? r * q[0] : r, rb = q ? r * q[1] : r;
      for (let s = 0; s < sides; s++) { const a = (s / sides) * TAU, c = Math.cos(a) * ra, d = Math.sin(a) * rb, cc = colAt(i, a); bag.pos.push(pts[i].x + N.x * c + B.x * d, pts[i].y + N.y * c + B.y * d, pts[i].z + N.z * c + B.z * d); bag.col.push(cc[0], cc[1], cc[2]); } }
    for (let i = 0; i < n - 1; i++) for (let s = 0; s < sides; s++) { const a = base + i * sides + s, b = base + i * sides + (s + 1) % sides, c = a + sides, d = b + sides; bag.idx.push(a, b, c, b, d, c); const k = keyAt ? keyAt(i) : 0; bag.key.push(k, k); }
  }
  // a braid: centre(t) the line it follows, rx(t) and ry(t) its half-widths, K strands, turns: how many times they wind
  function wBraid(bag, centre, rx, ry, K, turns, rings, sides, fat, tone, keyAt) {
    const C = [], Ns = [], Bs = [], T = V3(), sK = K <= 2 ? 1 : Math.sin(TAU / K), fK = sK / (1 + sK); let N = null; for (let i = 0; i <= rings; i++) C.push(centre(i / rings).clone());       // rx, ry are the outside of the braid; its strands lie inside that
    for (let i = 0; i <= rings; i++) { T.copy(C[Math.min(rings, i + 1)]).sub(C[Math.max(0, i - 1)]).normalize(); if (!N) { N = V3(1, 0, 0); if (Math.abs(T.x) > 0.8) N.set(0, 0, 1); } N = N.clone().addScaledVector(T, -N.dot(T)).normalize(); Ns.push(N); Bs.push(V3().crossVectors(T, N)); }
    for (let k = 0; k < K; k++) { const sg = k % 2 ? -1 : 1, deep = k % 2 ? 0.84 : 1, ph = (k / K) * TAU + (k % 2 ? 0.45 : 0), pts = [], shade = 0.84 + 0.30 * wHash(k * 3.7 + K), base = wMix(WOODC.dark, WOODC.light, 0.25 + 0.75 * wHash(k * 1.3 + K * 0.7));
      const rs = (t) => Math.max(0.0012, fat * Math.min(rx(t), ry(t)) * fK * (0.90 + 0.20 * Math.sin(k * 2.3 + t * 9)));
      for (let i = 0; i <= rings; i++) { const t = i / rings, a = ph + sg * turns * TAU * t, r = rs(t); pts.push(C[i].clone().addScaledVector(Ns[i], Math.cos(a) * Math.max(0, rx(t) - r) * deep).addScaledVector(Bs[i], Math.sin(a) * Math.max(0, ry(t) - r) * deep)); }
      wTube(bag, pts, (i) => rs(i / rings), sides,
        (i, a) => { const t = i / rings, g = (0.90 + 0.14 * Math.sin(t * 46 + k * 5 + a * 2)) * shade * (k % 2 ? 0.80 : 1), c = tone ? tone(t, k) : base; return [c[0] * g, c[1] * g, c[2] * g]; }, keyAt ? (i) => keyAt(i / rings, pts[i]) : null); }
  }
  // a leaf: a pointed blade folded a little down its middle
  function wLeaf(bag, p, dir, nrm, len, wid, ca, cb, key) { const b = bag.pos.length / 3, d = dir.clone().normalize(), n = nrm.clone().addScaledVector(d, -nrm.dot(d)).normalize(), s = V3().crossVectors(d, n), P = (a, w, h) => { bag.pos.push(p.x + d.x * a + s.x * w + n.x * h, p.y + d.y * a + s.y * w + n.y * h, p.z + d.z * a + s.z * w + n.z * h); };
    P(0, 0, 0); P(len * 0.42, -wid / 2, wid * 0.18); P(len * 0.5, 0, 0); P(len * 0.42, wid / 2, wid * 0.18); P(len, 0, wid * 0.10); for (const c of [cb, ca, cb, ca, ca]) bag.col.push(c[0], c[1], c[2]);
    bag.idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 4, b, b + 3, b + 2, b + 2, b + 3, b + 4); const k = key || 0; bag.key.push(k, k, k, k); }
  // a small white flower: five petals
  function wStar(bag, p, nrm, r, key) { const b = bag.pos.length / 3, n = nrm.clone().normalize(), u = V3(1, 0, 0); if (Math.abs(n.x) > 0.8) u.set(0, 0, 1); u.addScaledVector(n, -u.dot(n)).normalize(); const v = V3().crossVectors(n, u);
    bag.pos.push(p.x, p.y, p.z); bag.col.push(0.95, 0.80, 0.30); for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU, q = i % 2 ? r * 0.36 : r; bag.pos.push(p.x + (u.x * Math.cos(a) + v.x * Math.sin(a)) * q + n.x * r * 0.15, p.y + (u.y * Math.cos(a) + v.y * Math.sin(a)) * q + n.y * r * 0.15, p.z + (u.z * Math.cos(a) + v.z * Math.sin(a)) * q + n.z * r * 0.15); bag.col.push(WOODC.white[0], WOODC.white[1], WOODC.white[2]); }
    for (let i = 0; i < 10; i++) { bag.idx.push(b, b + 1 + i, b + 1 + (i + 1) % 10); bag.key.push(key || 0); } }
  function wMesh(bag, mat, sorted) {
    let idx = bag.idx; if (sorted) { const n = idx.length / 3, o = []; for (let i = 0; i < n; i++) o.push(i); o.sort((a, b) => bag.key[a] - bag.key[b]); const out = new Array(idx.length); for (let i = 0; i < n; i++) { const t = o[i] * 3; out[i * 3] = idx[t]; out[i * 3 + 1] = idx[t + 1]; out[i * 3 + 2] = idx[t + 2]; } idx = out; bag.keys = o.map((t) => bag.key[t]); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(bag.pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(bag.col, 3)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat || woodMat); m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; m.userData.keys = bag.keys || null; return m; }
  // show only the triangles of a sorted mesh whose key lies in lo..hi
  function wRange(m, lo, hi) { const k = m.userData.keys; if (!k) return; let a = 0, b = k.length, x = 0, y = k.length; while (a < b) { const c = (a + b) >> 1; if (k[c] < lo) a = c + 1; else b = c; } while (x < y) { const c = (x + y) >> 1; if (k[c] <= hi) x = c + 1; else y = c; } m.geometry.setDrawRange(a * 3, Math.max(0, x - a) * 3); }

  // ----- the seed (G7, H7, I4): the size of a hen's egg, gold-brown with a spiral on it; it glows from inside like a small lantern -----
  const SEED = new THREE.Group(); SEED.visible = false; fxG.add(SEED);
  const seedMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, side: THREE.DoubleSide, emissive: new THREE.Color(1.0, 0.62, 0.16), emissiveIntensity: 0 }), SHOOT = new THREE.Group();
  { const bag = wBag(), NR = 12, NS = 16; for (let i = 0; i <= NR; i++) { const t = i / NR, y = -0.030 + 0.062 * t, r = 0.0225 * Math.pow(Math.sin(PI * (0.03 + 0.94 * t)), 0.62) * (1 - 0.22 * t);
      for (let s = 0; s < NS; s++) { const a = (s / NS) * TAU, sp = Math.sin(a * 2 + t * 13), c = wMix(WOODC.seed, WOODC.seedD, sm(0.55, 0.95, sp)); bag.pos.push(r * Math.cos(a), y, r * Math.sin(a)); bag.col.push(c[0], c[1], c[2]); } }
    for (let i = 0; i < NR; i++) for (let s = 0; s < NS; s++) { const a = i * NS + s, b = i * NS + (s + 1) % NS, c = a + NS, d = b + NS; bag.idx.push(a, c, b, b, c, d); }
    SEED.add(wMesh(bag, seedMat)); SEED.children[0].castShadow = false;
    const sh = wBag(); wTube(sh, [V3(0, 0.030, 0), V3(0.002, 0.042, 0), V3(0, 0.054, 0.001)], () => 0.0013, 5, () => WOODC.leafB); wLeaf(sh, V3(0, 0.053, 0), V3(0.8, 0.7, 0.1), V3(-0.5, 0.8, 0), 0.026, 0.013, WOODC.leafA, WOODC.leafB); wLeaf(sh, V3(0, 0.053, 0), V3(-0.75, 0.65, -0.15), V3(0.5, 0.8, 0), 0.021, 0.011, WOODC.leafA, WOODC.leafB);
    SHOOT.add(wMesh(sh)); SEED.add(SHOOT); }
  // its roots of light, spreading over the ground from where it sinks in (H7, right)
  const ROOTS = (() => { const pos = [], uv = [], idx = [], key = []; let q = 20261114; const rnd = () => { q = (q * 1664525 + 1013904223) >>> 0; return q / 4294967296; };
    const run = (x, z, a, len, w, d0) => { const n = Math.max(4, Math.round(len / 0.02)); let px = x, pz = z, d = d0; const b0 = pos.length / 3;
      for (let i = 0; i <= n; i++) { const t = i / n, ww = w * (1 - 0.85 * t), sx = -Math.sin(a), sz = Math.cos(a); pos.push(px + sx * ww, 0.006, pz + sz * ww, px - sx * ww, 0.006, pz - sz * ww); const u = 1 - 0.55 * (d / 0.5); uv.push(u, 0, u, 1);
        if (i < n) { const b = b0 + i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); key.push(d, d); if (len > 0.14 && i > 2 && rnd() < 0.16) run(px, pz, a + (rnd() < 0.5 ? -1 : 1) * (0.5 + rnd() * 0.5), len * (1 - t) * 0.7, ww * 0.75, d); }
        a += (rnd() - 0.5) * 0.5; px += Math.cos(a) * len / n; pz += Math.sin(a) * len / n; d += len / n; } };
    for (let i = 0; i < 9; i++) run(0, 0, (i / 9) * TAU + rnd() * 0.5, 0.24 + rnd() * 0.22, 0.0055, 0);
    const bag = { pos, col: pos.map(() => 1), idx, key }, m = wMesh(bag, ribMat([1.0, 0.92, 0.55], [0.75, 0.95, 0.35]), true); m.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); m.castShadow = false; m.receiveShadow = false; m.renderOrder = 18; m.visible = false; fxG.add(m);
    m.userData.set = (grow, a) => { m.visible = a > 0.01 && grow > 0.01; wRange(m, -1, 0.5 * grow); m.material.uniforms.uK.value = a; }; return m; })();

  // ----- the sapling (H8, I4): twisting living wood as high as her waist, with new leaves opening along it -----
  const SAP = new THREE.Group(); SAP.visible = false; fxG.add(SAP); const SAP_LEAVES = [];
  { const line = (t) => V3(0.055 * Math.sin(t * 5.4) * Math.pow(t, 0.6), t * 1.0, 0.045 * Math.sin(t * 4.1 + 1.2) * Math.pow(t, 0.6)), bag = wBag();
    wBraid(bag, line, (t) => lerp(0.056, 0.010, Math.pow(t, 0.8)), (t) => lerp(0.056, 0.010, Math.pow(t, 0.8)), 3, 2.4, 44, 6, 1.0);
    for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU + 0.3, L = 0.13 + 0.07 * wHash(i + 5), pts = []; for (let j = 0; j <= 6; j++) { const t = j / 6; pts.push(V3(Math.cos(a + 0.5 * t * Math.sin(i * 2.1)) * (0.02 + L * t), 0.045 * (1 - t) * (1 - t) + 0.004, Math.sin(a + 0.5 * t * Math.sin(i * 2.1)) * (0.02 + L * t))); } wTube(bag, pts, (j) => 0.014 * (1 - j / 6) + 0.002, 5, () => wMix(WOODC.mid, WOODC.dark, 0.3)); }       // its roots, spread on the ground
    SAP.add(wMesh(bag));
    const lg = wBag(); wLeaf(lg, V3(0, 0, 0), V3(1, 0.25, 0), V3(0, 1, 0), 0.085, 0.040, WOODC.leafA, WOODC.leafB); const leafGeo = wMesh(lg).geometry;
    for (let i = 0; i < 15; i++) { const t = 0.20 + 0.78 * (i / 14), p = line(t), a = i * 2.4 + 0.6, m = new THREE.Mesh(leafGeo, woodMat); m.castShadow = true; m.position.set(p.x + Math.cos(a) * 0.02, p.y, p.z + Math.sin(a) * 0.02); m.rotation.set(0, -a, 0.35 + 0.3 * wHash(i)); m.userData.t = t; m.userData.s = 0.75 + 0.5 * wHash(i * 7 + 1) + (i > 12 ? 0.2 : 0); SAP.add(m); SAP_LEAVES.push(m); } }
  // g: how far it has grown (0.5 knee-high, 1 waist-high); tw: how far it has twisted itself away into the fawn
  function sapSet(p, g, tw) { SAP.visible = g > 0.005 && tw < 0.995; if (!SAP.visible) return; const e = Math.pow(g, 0.85), w = lerp(0.25, 1, Math.pow(g, 0.6));
    SAP.position.copy(p); SAP.rotation.y = 0.9 + tw * tw * 5.5; SAP.scale.set(w * (1 + 0.9 * tw) * (1 - sm(0.7, 1, tw)), Math.max(0.01, e * (1 - 0.72 * sm(0, 0.9, tw))), w * (1 + 0.9 * tw) * (1 - sm(0.7, 1, tw)));
    for (const m of SAP_LEAVES) { const k = sm(m.userData.t * 0.80, m.userData.t * 0.80 + 0.22, g) * (1 - sm(0.1, 0.6, tw)); m.visible = k > 0.01; m.scale.setScalar(Math.max(0.001, k * m.userData.s) / Math.max(0.3, w)); } }

  // ----- the Elderwood Guardian (H9, H10): a stag of living wood. Its shoulder is level with hers; its antlers are boughs that rise well above her hat. -----
  // It is built facing +z, standing, and held together as a little puppet: body > neck > head > antlers, and four legs of two or
  // three pieces. A pose is a handful of angles; the fawn (H8) is the same creature made small, lying down, with small antlers.
  const STAG = (() => {
    const G = new THREE.Group(); G.name = 'guardian'; G.visible = false; fxG.add(G); const all = [];
    const grp = (parent, x, y, z) => { const g = new THREE.Group(), pp = parent.userData.piv || V3(); g.userData.piv = V3(x, y, z); g.position.set(x - pp.x, y - pp.y, z - pp.z); g.userData.home = g.position.clone(); parent.add(g); return g; };
    const put = (g, bag, sorted) => { const m = wMesh(bag, woodMat, sorted), p = g.userData.piv; m.geometry.translate(-p.x, -p.y, -p.z); g.add(m); all.push(m); return m; };
    const bodyG = grp(G, 0, 1.04, 0), neckG = grp(bodyG, 0, 1.20, 0.50), headG = grp(neckG, 0, 1.66, 0.84), antG = grp(headG, 0, 1.75, 0.83);
    // its body: fourteen thick roots braided from rump to chest, deeper at the chest, moss and small white flowers along its back
    const E = (t) => Math.pow(Math.sin(PI * (0.04 + 0.92 * t)), 0.5), cy = (t) => 1.035 + 0.035 * sm(0.4, 0.9, t), bz = (t) => lerp(-0.66, 0.64, t), brx = (t) => 0.228 * E(t) * (0.92 + 0.08 * Math.sin(PI * t)), bry = (t) => E(t) * (0.235 + 0.085 * sm(0.45, 0.85, t) - 0.03 * sm(0.5, 0.15, t));
    { const bag = wBag(), kz = (t, p) => p.z; wBraid(bag, (t) => V3(0, cy(t), bz(t)), brx, bry, 14, 0.55, 40, 6, 1.0, null, kz);
      wBraid(bag, (t) => V3(0, cy(t), bz(t)), (t) => brx(t) * 1.035, (t) => bry(t) * 1.035, 6, 1.7, 56, 5, 0.17, (t, k) => wMix(WOODC.vine, WOODC.mid, 0.25 + 0.5 * wHash(k)), kz);
      const core = []; for (let i = 0; i <= 20; i++) core.push(V3(0, cy(i / 20), bz(i / 20))); wTube(bag, core, (i) => 0.87 * brx(i / 20), 12, (i, a) => { const g = 0.80 + 0.2 * Math.sin(a * 7 + i * 1.9); return [WOODC.dark[0] * g, WOODC.dark[1] * g, WOODC.dark[2] * g]; }, (i) => core[i].z, (i) => [1, bry(i / 20) / Math.max(0.001, brx(i / 20))]);
      for (let v = 0; v < bag.pos.length / 3; v++) { const x = bag.pos[v * 3], y = bag.pos[v * 3 + 1], z = bag.pos[v * 3 + 2], t = (z + 0.66) / 1.30, up = (y - cy(t)) / Math.max(0.01, bry(t)), k = sm(0.52, 0.86, up) * (0.45 + 0.55 * sm(-0.3, 0.5, Math.sin(z * 17 + x * 9) + Math.sin(z * 7.3 - x * 13))) * sm(0.02, 0.2, t) * (1 - sm(0.8, 0.98, t));
        if (k > 0) { const c = wMix([bag.col[v * 3], bag.col[v * 3 + 1], bag.col[v * 3 + 2]], WOODC.moss, 0.85 * k); bag.col[v * 3] = c[0]; bag.col[v * 3 + 1] = c[1]; bag.col[v * 3 + 2] = c[2]; } }       // moss along its back
      for (let i = 0; i < 9; i++) { const t = 0.14 + 0.70 * wHash(i * 3.1), s = wHash(i * 5.7) * 2 - 1, a = s * 0.9, p = V3(Math.sin(a) * brx(t) * 1.04, cy(t) + Math.cos(a) * bry(t) * 1.04, bz(t)); wStar(bag, p, V3(Math.sin(a), Math.cos(a), 0), 0.017 + 0.006 * wHash(i), p.z); }
      for (let i = 0; i < 26; i++) { const t = 0.08 + 0.84 * wHash(i * 2.3 + 1), a = (wHash(i * 4.1) * 2 - 1) * 1.5, p = V3(Math.sin(a) * brx(t) * 1.03, cy(t) + Math.cos(a) * bry(t) * 1.03, bz(t)); wLeaf(bag, p, V3(Math.sin(a) * 0.6, 0.5 + 0.4 * Math.cos(a), wHash(i) - 0.7), V3(Math.sin(a), Math.cos(a), 0.3), 0.055 + 0.03 * wHash(i * 9), 0.028, WOODC.leafA, WOODC.leafB, p.z); }
      G.userData.torso = put(bodyG, bag, true); }
    // its neck, and the small leaves down the back of it
    { const bag = wBag(), A = V3(0, 1.12, 0.42), B = V3(0, 1.69, 0.85), line = (t) => V3(0, lerp(A.y, B.y, t) + 0.03 * Math.sin(PI * t), lerp(A.z, B.z, t) - 0.035 * Math.sin(PI * t));
      wBraid(bag, line, (t) => lerp(0.150, 0.080, Math.pow(t, 0.8)), (t) => lerp(0.215, 0.090, Math.pow(t, 0.8)), 9, 0.7, 16, 6, 1.0);
      wBraid(bag, line, (t) => lerp(0.155, 0.083, Math.pow(t, 0.8)), (t) => lerp(0.22, 0.093, Math.pow(t, 0.8)), 4, 1.6, 22, 5, 0.22, (t, k) => wMix(WOODC.vine, WOODC.mid, 0.3 + 0.4 * wHash(k)));
      const core = []; for (let i = 0; i <= 8; i++) core.push(line(i / 8)); wTube(bag, core, (i) => 0.88 * lerp(0.150, 0.080, Math.pow(i / 8, 0.8)), 10, (i, a) => { const g = 0.80 + 0.2 * Math.sin(a * 7 + i * 1.9); return [WOODC.dark[0] * g, WOODC.dark[1] * g, WOODC.dark[2] * g]; }, null, (i) => [1, lerp(0.215, 0.090, Math.pow(i / 8, 0.8)) / lerp(0.150, 0.080, Math.pow(i / 8, 0.8))]);
      for (let i = 0; i < 12; i++) { const t = 0.12 + 0.8 * (i / 11), p = line(t).add(V3((wHash(i) - 0.5) * 0.09, lerp(0.11, 0.06, t), -lerp(0.12, 0.06, t))); wLeaf(bag, p, V3((wHash(i * 3) - 0.5) * 1.2, 0.5, -0.8), V3(0, 0.8, 0.6), 0.06 + 0.03 * wHash(i * 5), 0.03, WOODC.leafA, WOODC.leafB); }
      put(neckG, bag); }
    // its head: bark, a long muzzle, two ears like leaves
    const HA = V3(0, 1.675, 0.80), HB = V3(0, 1.575, 1.215), eyeP = [];
    { const bag = wBag(), pts = [], R = [[0, 0.034, 1, 1], [0.10, 0.088, 1, 1.05], [0.26, 0.099, 0.98, 1.08], [0.46, 0.083, 0.92, 1.0], [0.66, 0.059, 0.9, 1.0], [0.84, 0.045, 0.95, 0.95], [0.95, 0.038, 1, 0.85], [1.0, 0.013, 1, 0.8]], prof = [];
      for (let i = 0; i <= 14; i++) { const t = i / 14; pts.push(HA.clone().lerp(HB, t).add(V3(0, 0.012 * Math.sin(PI * t), 0))); let j = 0; while (j < R.length - 2 && R[j + 1][0] < t) j++; const u = cl((t - R[j][0]) / (R[j + 1][0] - R[j][0]), 0, 1); prof.push([lerp(R[j][1], R[j + 1][1], u), lerp(R[j][2], R[j + 1][2], u), lerp(R[j][3], R[j + 1][3], u)]); }
      wTube(bag, pts, (i) => prof[i][0], 12, (i, a) => { const t = i / 14, g = 0.84 + 0.18 * Math.sin(a * 5 + t * 21) + 0.08 * Math.sin(a * 11), c = t > 0.92 ? WOODC.hoof : wMix(WOODC.bark, WOODC.light, 0.45 + 0.45 * Math.sin(a * 3 + t * 8)); return [c[0] * g, c[1] * g, c[2] * g]; }, null, (i) => [prof[i][1], prof[i][2]]);
      for (const s of [-1, 1]) { wLeaf(bag, V3(s * 0.058, 1.735, 0.815), V3(s * 0.85, 0.42, -0.42), V3(s * 0.2, 0.3, 0.95), 0.155, 0.052, WOODC.light, WOODC.bark); wLeaf(bag, V3(s * 0.05, 1.70, 0.80), V3(s * 0.5, -0.2, -0.8), V3(s, 0.2, 0), 0.05, 0.03, WOODC.leafA, WOODC.leafB); }
      put(headG, bag);
      const eyeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.80, 1.0, 0.36) }); for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.0125, 10, 8), eyeMat); e.position.set(s * 0.080, 1.670 - 1.66, 0.945 - 0.84); headG.add(e); eyeP.push(e); } }
    // its antlers: two boughs sweeping back and up, each with five branches, twigs, and leaves at the tips
    { const bag = wBag(), tw = (a, b, r0, r1, bend, n) => { const pts = []; for (let i = 0; i <= n; i++) { const t = i / n; pts.push(a.clone().lerp(b, t).add(bend.clone().multiplyScalar(Math.sin(PI * t)))); } wTube(bag, pts, (i) => lerp(r0, r1, Math.pow(i / n, 0.8)), 5, (i, k) => { const g = 0.86 + 0.16 * Math.sin(i * 1.7 + k * 3); return [WOODC.light[0] * g, WOODC.light[1] * g, WOODC.light[2] * g]; }); return pts; };
      const leaves = (p, d, n, seed) => { for (let i = 0; i < n; i++) { const q = V3(wHash(seed + i) - 0.5, wHash(seed + i * 3 + 1) - 0.2, wHash(seed + i * 7 + 2) - 0.5).normalize().multiplyScalar(0.8).add(d.clone().normalize()); wLeaf(bag, p, q, V3(wHash(seed + i * 11) - 0.5, 1, wHash(seed + i * 13) - 0.5), 0.085 + 0.045 * wHash(seed + i * 5), 0.042, WOODC.leafA, WOODC.leafB); } };
      for (const s of [-1, 1]) { const K = [V3(s * 0.045, 1.755, 0.83), V3(s * 0.15, 1.95, 0.68), V3(s * 0.27, 2.14, 0.44), V3(s * 0.37, 2.29, 0.14), V3(s * 0.41, 2.40, -0.16)], beam = []; for (let i = 0; i <= 22; i++) beam.push(wCrom(K, i / 22, V3()));
        wTube(bag, beam, (i) => lerp(0.040, 0.011, Math.pow(i / 22, 0.75)), 6, (i, k) => { const g = 0.84 + 0.18 * Math.sin(i * 1.3 + k * 2); return [WOODC.light[0] * g, WOODC.light[1] * g, WOODC.light[2] * g]; }); leaves(beam[22], V3(0, 0.6, -0.8), 5, s * 3 + 40);
        const tines = [[0.10, V3(s * 0.10, 2.00, 1.05), 0.022], [0.30, V3(s * 0.20, 2.36, 0.74), 0.022], [0.50, V3(s * 0.37, 2.54, 0.46), 0.020], [0.72, V3(s * 0.52, 2.58, 0.14), 0.017], [0.88, V3(s * 0.47, 2.60, -0.18), 0.013]];
        tines.forEach(([t, tip, r], j) => { const a = wCrom(K, t, V3()), pts = tw(a, tip, r, 0.0045, V3(s * 0.02, -0.03, 0.03 * (j % 2 ? -1 : 1)), 9), d = tip.clone().sub(a); leaves(tip, d, 5, s * 5 + j * 9); leaves(pts[7], d, 2, s * 9 + j * 5);
          const m = pts[5], t2 = m.clone().add(V3(s * (0.10 + 0.04 * j), 0.13, (j % 2 ? 0.12 : -0.10))); tw(m, t2, 0.009, 0.003, V3(0, 0.01, 0), 5); leaves(t2, t2.clone().sub(m), 4, s * 7 + j * 13 + 3);
          if (j === 1 || j === 2) { const m2 = pts[7], t3 = m2.clone().add(V3(-s * 0.07, 0.11, 0.08)); tw(m2, t3, 0.007, 0.003, V3(0, 0.01, 0), 4); leaves(t3, t3.clone().sub(m2), 3, s * 11 + j * 17); } }); }
      put(antG, bag); }
    // its legs: roots twisted together, a knot at each joint, a dark hoof
    const legs = {}, legBraid = (bag, a, b, r0, r1, K, turns) => wBraid(bag, (t) => a.clone().lerp(b, t).add(V3(0, 0, 0.012 * Math.sin(PI * t))), (t) => lerp(r0, r1, t) * (1 + 0.10 * Math.sin(PI * t)), (t) => lerp(r0, r1, t) * (1 + 0.10 * Math.sin(PI * t)), K, turns, 10, 5, 1.0);
    const knot = (bag, p, r) => wTube(bag, [p.clone().add(V3(0, r, 0)), p.clone().add(V3(0, r * 0.5, 0)), p.clone(), p.clone().add(V3(0, -r * 0.5, 0)), p.clone().add(V3(0, -r, 0))], (i) => r * [0.25, 0.85, 1, 0.85, 0.25][i], 7, () => wMix(WOODC.mid, WOODC.dark, 0.35));
    const hoof = (bag, f, g) => wTube(bag, [f.clone().add(V3(0, 0.02, 0)), f.clone().lerp(g, 0.45), g.clone().add(V3(0, 0.012, 0)), g.clone()], (i) => [0.030, 0.036, 0.040, 0.030][i], 7, (i) => i > 0 ? WOODC.hoof : WOODC.dark);
    const sprig = (bag, p, s, n, seed) => { for (let i = 0; i < n; i++) wLeaf(bag, p.clone().add(V3(0, -0.06 * i, 0)), V3(s * (0.5 + wHash(seed + i)), 0.4, wHash(seed + i * 3) - 0.5), V3(s * 0.3, 0.3, 1), 0.05 + 0.02 * wHash(seed + i * 7), 0.026, WOODC.leafA, WOODC.leafB); };
    for (const s of [-1, 1]) { const x = s * 0.125, sh = V3(x, 1.03, 0.44), kn = V3(x, 0.54, 0.455), fe = V3(x, 0.105, 0.44), gr = V3(x, 0, 0.465), up = grp(bodyG, sh.x, sh.y, sh.z), lo = grp(up, kn.x, kn.y, kn.z);
      let bag = wBag(); legBraid(bag, sh.clone().add(V3(0, 0.05, 0)), kn, 0.080, 0.040, 4, 0.9); sprig(bag, sh.clone().lerp(kn, 0.4).add(V3(s * 0.05, 0, 0)), s, 2, s * 3 + 1); put(up, bag);
      bag = wBag(); knot(bag, kn, 0.043); legBraid(bag, kn, fe, 0.038, 0.029, 3, 1.1); hoof(bag, fe, gr); sprig(bag, kn.clone().lerp(fe, 0.5).add(V3(s * 0.03, 0, 0)), s, 2, s * 5 + 2); put(lo, bag); legs['F' + (s < 0 ? 'R' : 'L')] = [up, lo]; }
    for (const s of [-1, 1]) { const x = s * 0.135, hp = V3(x, 1.03, -0.50), st = V3(x + s * 0.005, 0.74, -0.36), hk = V3(x, 0.47, -0.60), fe = V3(x, 0.105, -0.545), gr = V3(x, 0, -0.515), th = grp(bodyG, hp.x, hp.y, hp.z), ga = grp(th, st.x, st.y, st.z), ca = grp(ga, hk.x, hk.y, hk.z);
      let bag = wBag(); legBraid(bag, hp.clone().add(V3(0, 0.06, -0.03)), st, 0.125, 0.070, 5, 0.6); put(th, bag);
      bag = wBag(); knot(bag, st, 0.058); legBraid(bag, st, hk, 0.062, 0.036, 4, 0.9); sprig(bag, st.clone().lerp(hk, 0.5).add(V3(s * 0.04, 0, 0)), s, 2, s * 7 + 4); put(ga, bag);
      bag = wBag(); knot(bag, hk, 0.039); legBraid(bag, hk, fe, 0.034, 0.028, 3, 1.1); hoof(bag, fe, gr); put(ca, bag); legs['H' + (s < 0 ? 'R' : 'L')] = [th, ga, ca]; }
    { const bag = wBag(); wTube(bag, [V3(0, 1.21, -0.58), V3(0, 1.15, -0.68), V3(0, 1.02, -0.71)], (i) => [0.04, 0.034, 0.008][i], 6, () => WOODC.mid); wLeaf(bag, V3(0, 1.04, -0.71), V3(0, -0.9, -0.2), V3(0, 0.2, -1), 0.09, 0.05, WOODC.leafA, WOODC.leafB); G.userData.tail = put(bodyG, bag); }
    const mark = new THREE.Object3D(); mark.position.set(0.118 - 0, 1.40 - 1.20, 0.60 - 0.50); neckG.add(mark); const cheek = new THREE.Object3D(); cheek.position.set(0.088, 1.650 - 1.66, 0.915 - 0.84); headG.add(cheek);       // where her hand rests on its neck (H9)
    // poses: by how far its body is let down; bp its pitch (+ nose down); nk, hd its neck and head (+ down); fU, fL its forelegs; hT, hG, hC its hind legs (+ swings a piece back)
    const POSE = { stand: { by: 0, bp: 0, nk: 0, hd: 0, fU: 0, fL: 0, hT: 0, hG: 0, hC: 0 }, lie: { by: -0.71, bp: 0, nk: -0.10, hd: 0.12, fU: -1.35, fL: 2.55, hT: -1.0, hG: 2.0, hC: -1.9 },
      gather: { by: -0.17, bp: -0.13, nk: 0.36, hd: -0.18, fU: -0.22, fL: 0.46, hT: -0.55, hG: 1.0, hC: -0.52 }, leap: { by: 0, bp: -0.17, nk: 0.40, hd: -0.22, fU: -1.0, fL: 1.5, hT: 0.95, hG: -0.5, hC: 0.35 }, land: { by: -0.04, bp: 0.14, nk: 0.48, hd: -0.20, fU: -0.72, fL: 0.25, hT: 1.05, hG: -0.4, hC: 0.5 } };
    const cur = {};
    function pose(a, b, t, extra) { const A = POSE[a], B = POSE[b || a]; for (const k in A) cur[k] = lerp(A[k], B[k], t || 0); cur.fd = 0; cur.ny = 0; cur.hy = 0; if (extra) for (const k in extra) cur[k] += extra[k];
      bodyG.position.set(0, bodyG.userData.home.y + cur.by, 0); bodyG.rotation.x = cur.bp; neckG.rotation.x = cur.nk; neckG.rotation.y = cur.ny; headG.rotation.x = cur.hd; headG.rotation.y = cur.hy;
      for (const S of ['R', 'L']) { const d = S === 'L' ? (cur.fd || 0) : -(cur.fd || 0); legs['F' + S][0].rotation.x = cur.fU + d; legs['F' + S][1].rotation.x = cur.fL - d * 0.6; legs['H' + S][0].rotation.x = cur.hT - d; legs['H' + S][1].rotation.x = cur.hG; legs['H' + S][2].rotation.x = cur.hC; } }
    // unravel(u): from its rump forward to its shoulders it comes apart (H10); 1: everything behind the shoulders is gone
    function unravel(u) { const zc = lerp(-0.70, 0.34, u); wRange(G.userData.torso, u <= 0 ? -9 : zc, 9); const k = Math.max(0.001, 1 - sm(0.02, 0.34, u)); for (const S of ['R', 'L']) legs['H' + S][0].scale.setScalar(k); G.userData.tail.visible = u < 0.03; return zc; }
    const tmp = V3();
    return { G, pose, unravel, mark, cheek, eyeP, antG, neckG, headG, bodyG, set(p, yaw, scale, antler) { G.position.copy(p); G.rotation.y = yaw; G.scale.setScalar(Math.max(0.001, scale)); antG.scale.setScalar(Math.max(0.001, antler)); },
      pt(obj, out) { G.updateMatrixWorld(true); return obj.getWorldPosition(out).applyMatrix4(_inv); },       // a point of it, in her own frame
      local(x, y, z, out) { G.updateMatrixWorld(true); return out.set(x, y - 1.04, z).applyMatrix4(bodyG.matrixWorld).applyMatrix4(_inv); } };
  })();

  // ----- vines that trail behind something rushing (H10): thin strands of wood laid along the way it went, thinning as they age -----
  function makeVine(N, life, w0, ca, cb) {
    const pos = new THREE.BufferAttribute(new Float32Array(N * 12), 3), col = new Float32Array(N * 12), nor = new Float32Array(N * 12), idx = []; pos.setUsage(THREE.DynamicDrawUsage);
    for (let i = 0; i < N; i++) for (let q = 0; q < 4; q++) { const c = wMix(ca, cb, wHash(i * 0.37 + q)); col.set(c, (i * 4 + q) * 3); nor[(i * 4 + q) * 3 + 1] = 1; }
    for (let i = 0; i < N - 1; i++) { const a = i * 4, b = a + 4; idx.push(a, a + 1, b, a + 1, b + 1, b, a + 2, a + 3, b + 2, a + 3, b + 3, b + 2); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', pos); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setIndex(idx);
    const mesh = new THREE.Mesh(g, woodMat); mesh.frustumCulled = false; mesh.visible = false; mesh.castShadow = true; fxG.add(mesh);
    const R = { mesh, pts: [], life, push(c, side, up) { R.pts.unshift({ c: c.clone(), s: side.clone(), u: up.clone(), age: 0 }); if (R.pts.length > N) R.pts.length = N; },
      tick(dt) { for (const t of R.pts) t.age += dt; while (R.pts.length && R.pts[R.pts.length - 1].age >= R.life) R.pts.pop(); const n = R.pts.length; mesh.visible = n > 2; if (n < 3) return;
        for (let i = 0; i < N; i++) { const t = R.pts[Math.min(i, n - 1)], w = i < n ? w0 * Math.pow(Math.max(0, 1 - t.age / R.life), 0.7) * Math.min(1, i / 2) * Math.min(1, (n - 1 - i) / 2) : 0, a = i * 4;
          pos.setXYZ(a, t.c.x + t.s.x * w, t.c.y + t.s.y * w, t.c.z + t.s.z * w); pos.setXYZ(a + 1, t.c.x - t.s.x * w, t.c.y - t.s.y * w, t.c.z - t.s.z * w); pos.setXYZ(a + 2, t.c.x + t.u.x * w, t.c.y + t.u.y * w, t.c.z + t.u.z * w); pos.setXYZ(a + 3, t.c.x - t.u.x * w, t.c.y - t.u.y * w, t.c.z - t.u.z * w); }
        pos.needsUpdate = true; } };
    return R;
  }
  const VINES = [0, 1, 2, 3, 4].map((i) => makeVine(70, 0.85 + 0.1 * i, 0.011 + 0.003 * (i % 2), i % 2 ? WOODC.mid : WOODC.leafB, i % 2 ? WOODC.light : WOODC.mid));
  function woodHide() { SEED.visible = false; SAP.visible = false; STAG.G.visible = false; ROOTS.visible = false; }
  function woodClear() { woodHide(); for (const v of VINES) { v.pts.length = 0; v.mesh.visible = false; } STAG.unravel(0); STAG.pose('stand'); }
  // ===== I98c_garden.js: the Moonflower Garden (stage twelve; paintings H11, H12, I6) =====
  // "She scatters a handful of glowing seeds in a ring, buds rise where they land, and ... they open into white flowers that glow
  // like small moons." The magic rules: "MOONFLOWERS: large white trumpet-shaped flowers on dark green vines with heart-shaped
  // leaves; each open flower glows pearl-white like a small moon."
  // A ring of twelve flowers round her and her friends. Each flower is its own small mesh whose points slide from a tight twisted
  // bud to the open trumpet (I6, top row), so it truly opens; the vine is one braid that is shown bit by bit outward from where each
  // seed fell.
  const GARDEN = (() => {
    const G = new THREE.Group(); G.name = 'moonflowers'; G.visible = false; fxG.add(G);
    const NF = 12, R0 = 1.22, FU = 10, FV = 20, flowers = [], gLin = (hex) => { const c = new THREE.Color(hex).convertSRGBToLinear(); return [c.r, c.g, c.b]; };
    const GC = { vineA: gLin(0x3f5226), vineB: gLin(0x5a4a2a), leafA: gLin(0x3f7a34), leafB: gLin(0x285526), stem: gLin(0x6f9a3c), white: gLin(0xe4e0d2), throat: gLin(0xb9c47c) };
    const petMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, side: THREE.DoubleSide, emissive: new THREE.Color(0.92, 0.88, 0.74), emissiveIntensity: 0 });
    const greenMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, side: THREE.DoubleSide });
    // one flower, as a bud and open (the rim creased into a five-pointed star, I6)
    const bud = [], open = [], fcol = [], fidx = [];
    for (let i = 0; i <= FU; i++) for (let j = 0; j < FV; j++) { const u = i / FU, th = (j / FV) * TAU, cr = Math.cos(5 * th), u3 = u * u * u;
      const ro = (0.011 + 0.108 * Math.pow(u, 2.3)) * (1 + 0.08 * cr * u3), ho = 0.135 * Math.pow(u, 0.7) - 0.022 * Math.pow(u, 5) + 0.012 * cr * u3; open.push(ro * Math.cos(th), ho, ro * Math.sin(th));
      const tb = th + 2.4 * u, rb = (0.008 + 0.026 * Math.pow(Math.sin(PI * Math.min(1, u * 0.96 + 0.03)), 0.8) * (1 - 0.42 * u)) * (1 + 0.14 * Math.cos(5 * th) * Math.sin(PI * u)); bud.push(rb * Math.cos(tb), 0.165 * u, rb * Math.sin(tb));
      const c = [lerp(GC.throat[0], GC.white[0], sm(0.05, 0.5, u)), lerp(GC.throat[1], GC.white[1], sm(0.05, 0.5, u)), lerp(GC.throat[2], GC.white[2], sm(0.05, 0.5, u))], sh = (1 - 0.30 * Math.pow(Math.max(0, cr), 4) * u) * (0.82 + 0.18 * u); fcol.push(c[0] * sh, c[1] * sh, c[2] * sh); }
    for (let i = 0; i < FU; i++) for (let j = 0; j < FV; j++) { const a = i * FV + j, b = i * FV + (j + 1) % FV, c = a + FV, d = b + FV; fidx.push(a, c, b, b, c, d); }
    // its green cup and its stalk
    const cup = wBag(); for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU + 0.3; wLeaf(cup, V3(0, 0.004, 0), V3(Math.cos(a) * 0.55, 1, Math.sin(a) * 0.55), V3(Math.cos(a), -0.3, Math.sin(a)), 0.045, 0.016, GC.stem, GC.leafA); }
    wTube(cup, [V3(0.012, -0.10, 0.0), V3(0.016, -0.06, 0.004), V3(0.008, -0.025, 0), V3(0, 0.004, 0)], (i) => [0.0045, 0.0042, 0.0045, 0.008][i], 6, () => GC.stem); const cupGeo = wMesh(cup).geometry;
    const angOf = (i) => (i / NF) * TAU + 0.26 + 0.10 * Math.sin(i * 2.7), ringP = (a, out) => { const r = R0 + 0.045 * Math.sin(5 * a + 1); return out.set(r * Math.sin(a), 0.030 + 0.014 * Math.sin(7 * a), r * Math.cos(a)); };       // a = 0 is straight in front of her
    for (let i = 0; i < NF; i++) { const a = angOf(i), g = new THREE.Group(), p = ringP(a, V3()), geo = new THREE.BufferGeometry(), pos = new THREE.BufferAttribute(new Float32Array(bud), 3); pos.setUsage(THREE.DynamicDrawUsage);
      geo.setAttribute('position', pos); geo.setAttribute('color', new THREE.Float32BufferAttribute(fcol, 3)); geo.setIndex(fidx); geo.computeVertexNormals();
      const pet = new THREE.Mesh(geo, petMat), cp = new THREE.Mesh(cupGeo, greenMat), tilt = new THREE.Group(); pet.frustumCulled = false; pet.castShadow = true; cp.castShadow = true;
      g.position.set(p.x, p.y, p.z); g.rotation.y = a; tilt.position.y = 0.105; tilt.rotation.set(0.50 + 0.25 * wHash(i * 3.3), 0, (wHash(i * 5.1) - 0.5) * 0.5); tilt.add(pet); tilt.add(cp); g.add(tilt); G.add(g);       // each leans outward, away from her, and a little to one side
      flowers.push({ g, tilt, pet, pos, a, p, e: -1, lean: tilt.rotation.x, tip: V3() }); }
    // the vine round the ring: two strands twisted together, shown outward from where each seed fell
    const near = (a) => { let m = 9; for (const f of flowers) { let d = Math.abs(a - f.a) % TAU; if (d > PI) d = TAU - d; m = Math.min(m, d); } return m / (PI / NF) * 0.5; };       // 0 at a flower .. about 1 midway between two
    const vine = (() => { const bag = wBag(); wBraid(bag, (t) => ringP(t * TAU, V3()), () => 0.021, () => 0.021, 2, 26, 300, 5, 0.9, (t, k) => k ? GC.vineB : GC.vineA, (t) => near(t * TAU));
      for (let i = 0; i < 26; i++) { const a = (i / 26) * TAU + 0.11, p = ringP(a, V3()), q = p.clone().add(V3(Math.sin(a + 1.3) * 0.07, 0.035, Math.cos(a + 1.3) * 0.07)); wTube(bag, [p, p.clone().lerp(q, 0.5).add(V3(0, 0.03, 0)), q, q.clone().add(V3(Math.sin(a) * 0.012, 0.014, -0.01))], (j) => [0.004, 0.0032, 0.0024, 0.0012][j], 4, () => GC.stem, () => near(a) + 0.15); }       // tendrils
      const m = wMesh(bag, greenMat, true); G.add(m); return m; })();
    // heart-shaped leaves along it, and small white star-flowers between the big ones
    const heart = (() => { const pos = [0, 0.006, 0.020], col = [...GC.leafB], idx = [], N = 14; for (let i = 0; i <= N; i++) { const t = (i / N) * TAU, x = 16 * Math.pow(Math.sin(t), 3), y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t); pos.push(x * 0.0027, 0.004 * Math.cos(t * 2), (13 - y) * 0.0027 - 0.022); const c = wMix(GC.leafA, GC.leafB, 0.5 + 0.5 * Math.sin(i * 2.1)); col.push(c[0], c[1], c[2]); }
      for (let i = 1; i <= N; i++) idx.push(0, i + 1, i); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals(); return g; })();
    const NL = 52, leaves = new THREE.InstancedMesh(heart, greenMat, NL), leafAt = [], NS = 26, starG = (() => { const b = wBag(); wStar(b, V3(0, 0, 0), V3(0, 1, 0), 0.019); return wMesh(b).geometry; })(), stars = new THREE.InstancedMesh(starG, petMat, NS), starAt = [], dm = new THREE.Object3D();
    leaves.castShadow = true; leaves.frustumCulled = false; stars.frustumCulled = false; G.add(leaves); G.add(stars);
    for (let i = 0; i < NL; i++) { const a = (i / NL) * TAU + 0.05 * Math.sin(i * 3.3), p = ringP(a, V3()), out = (i % 2 ? 1 : -1) * (0.035 + 0.05 * wHash(i * 1.7)); leafAt.push({ p: V3(p.x + Math.sin(a) * out, p.y + 0.018 + 0.03 * wHash(i * 2.9), p.z + Math.cos(a) * out), ry: a + (i % 2 ? 0 : PI) + (wHash(i) - 0.5) * 1.2, rx: -0.25 - 0.5 * wHash(i * 4.3), s: 0.85 + 0.75 * wHash(i * 6.1), k: near(a) }); }
    for (let i = 0; i < NS; i++) { const a = (i / NS) * TAU + 0.13 + 0.06 * Math.sin(i * 1.9), p = ringP(a, V3()), out = (wHash(i * 3.7) - 0.5) * 0.13; starAt.push({ p: V3(p.x + Math.sin(a) * out, p.y + 0.035 + 0.04 * wHash(i * 5.3), p.z + Math.cos(a) * out), rx: (wHash(i * 7.7) - 0.5) * 0.9, rz: (wHash(i * 8.3) - 0.5) * 0.9, k: near(a) }); }
    // the threads of light the flying seeds trail (H11, right): one strip for all twelve
    const TM = 12, thPos = new THREE.BufferAttribute(new Float32Array(NF * (TM + 1) * 6), 3), thUv = new THREE.BufferAttribute(new Float32Array(NF * (TM + 1) * 4), 2), thIdx = []; thPos.setUsage(THREE.DynamicDrawUsage); thUv.setUsage(THREE.DynamicDrawUsage);
    for (let f = 0; f < NF; f++) for (let i = 0; i < TM; i++) { const a = (f * (TM + 1) + i) * 2; thIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const thG = new THREE.BufferGeometry(); thG.setAttribute('position', thPos); thG.setAttribute('uv', thUv); thG.setIndex(thIdx); const threads = new THREE.Mesh(thG, ribMat(FXC.pearl, FXC.gold)); threads.frustumCulled = false; threads.renderOrder = 19; threads.visible = false; fxG.add(threads);
    const seedAt = (f, from, u, out) => { const e = u, a = (1 - e) * (1 - e), b = 2 * e * (1 - e), c = e * e, L = f.p; return out.set(a * from.x + b * (from.x * 0.4 + L.x * 0.6) + c * L.x, a * from.y + b * (from.y + 0.75) + c * L.y, a * from.z + b * (from.z * 0.4 + L.z * 0.6) + c * L.z); };
    const tA = V3(), tB = V3(), tS = V3();
    return { G, flowers, NF, R0, angOf, ringP, seedAt, threads,
      // fly[i]: how far seed i is along its way (under 0: not thrown; over 1: landed); from[i]: the hand it left
      setThreads(fly, from, view) { let any = false; for (let f = 0; f < NF; f++) { const u1 = fly[f], on = u1 > 0 && u1 < 1.25;
          for (let i = 0; i <= TM; i++) { const u = cl(u1 - 0.34 * (1 - i / TM), 0, 1), v = (f * (TM + 1) + i) * 2; seedAt(flowers[f], from[f], u, tA); seedAt(flowers[f], from[f], Math.min(1, u + 0.02), tB); tS.copy(tB).sub(tA).cross(view).normalize().multiplyScalar(on ? 0.007 : 0);
            thPos.setXYZ(v, tA.x + tS.x, tA.y + tS.y, tA.z + tS.z); thPos.setXYZ(v + 1, tA.x - tS.x, tA.y - tS.y, tA.z - tS.z); const al = on ? (i / TM) * (1 - sm(1.0, 1.25, u1)) : 0; thUv.setXY(v, al, 0); thUv.setXY(v + 1, al, 1); } any = any || on; }
        thPos.needsUpdate = thUv.needsUpdate = true; threads.visible = any; },
      // shoot[i]: how far flower i's stalk and bud have risen; open[i]: how far it has opened; vine: how far the vine has crept (0..1); lit: how brightly the open flowers glow; gone: all of it sinking away at the end
      set(shoot, open2, vineK, lit, gone) { G.visible = true; const keep = 1 - gone;
        for (let f = 0; f < NF; f++) { const F = flowers[f], s = sm(0, 1, shoot[f]) * keep, e = cl(open2[f], 0, 1); F.g.visible = s > 0.004; if (!F.g.visible) continue; F.g.scale.setScalar(Math.max(0.001, lerp(0.30, 1, s) * sm(0, 0.25, s)));
          F.tilt.position.y = 0.105 * s; F.tilt.rotation.x = lerp(0.12, F.lean, sm(0.2, 1, e)); F.tilt.scale.setScalar(lerp(0.42, 1.0, sm(0, 0.8, e) * 0.75 + 0.25 * s));
          if (Math.abs(e - F.e) > 0.004) { F.e = e; const q = e * e * (3 - 2 * e), A = F.pos.array; for (let i = 0; i < A.length; i++) A[i] = bud[i] + (open[i] - bud[i]) * q; F.pos.needsUpdate = true; F.pet.geometry.computeVertexNormals(); } }
        wRange(vine, -1, vineK * 1.25 * keep - 0.02); vine.visible = vineK * keep > 0.01;
        for (let i = 0; i < NL; i++) { const L = leafAt[i], k = sm(L.k, L.k + 0.3, vineK * 1.4) * keep; dm.position.copy(L.p); dm.rotation.set(L.rx, L.ry, 0, 'YXZ'); dm.scale.setScalar(Math.max(0.0001, k * L.s)); dm.updateMatrix(); leaves.setMatrixAt(i, dm.matrix); } leaves.instanceMatrix.needsUpdate = true;
        for (let i = 0; i < NS; i++) { const S = starAt[i], k = sm(S.k + 0.5, S.k + 0.75, vineK * 1.75) * keep; dm.position.copy(S.p); dm.rotation.set(S.rx, i, S.rz); dm.scale.setScalar(Math.max(0.0001, k)); dm.updateMatrix(); stars.setMatrixAt(i, dm.matrix); } stars.instanceMatrix.needsUpdate = true;
        petMat.emissiveIntensity = 0.03 + 0.27 * lit; },
      // the middle of flower i's open face, in her frame (where its light and its motes come from)
      face(i, out) { const F = flowers[i]; G.updateMatrixWorld(true); return out.set(0, 0.10, 0).applyMatrix4(F.tilt.matrixWorld).applyMatrix4(_inv); },
      hide() { G.visible = false; threads.visible = false; } };
  })();
  // a second friend for spells that heal the whole party, and the leaves of her floating book (H11: "its pages lifting")
  const ALLY2 = ALLY.clone(); ALLY2.visible = false; fxG.add(ALLY2); FXW.ally2 = 0;
  const PAGES = new THREE.Group(); PAGES.visible = false; fxG.add(PAGES);
  { const pos = [], idx = [], NP = 7, W = 0.138, H = 0.186; for (let i = 0; i <= NP; i++) { const t = i / NP, x = W * t, z = 0.020 * Math.sin(PI * t) * (1 - 0.3 * t); pos.push(x, -H / 2, z, x, H / 2, z); if (i < NP) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(0xe9dcba).convertSRGBToLinear(), roughness: 0.8, side: THREE.DoubleSide, emissive: new THREE.Color(0.16, 0.13, 0.07) });
    for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(g, mat); m.position.set(0, 0, 0.012); m.castShadow = true; PAGES.add(m); } }
  // lay the fluttering leaves on the book, wherever it is; k: how much they lift
  function pagesSet(k, t) { PAGES.visible = k > 0.01; if (!PAGES.visible) return; PAGES.position.copy(SK.book.position); PAGES.quaternion.copy(SK.book.quaternion); PAGES.scale.copy(SK.book.scale);
    PAGES.children.forEach((m, i) => { const th = PI * (0.5 + 0.34 * Math.sin(t * (1.1 + 0.23 * i) + i * 1.7)) , lift = lerp(i % 2 ? 0.12 : PI - 0.12, th, k); m.rotation.y = -lift; }); }
  // ===== I98d_thorn.js: stage thirteen: Thornwake, Rootbound Return and Bramble Cradle (paintings H13 to H16, I7, I8, G6) =====
  // Chris, November 14: "Let's do her next set of spells and her reactions first then we'll come back to" the higher detail pass.
  // The magic rules: "WITCHFIRE. Her one harmful magic: a cool violet-magenta flame with a pale pink-white heart. It burns only on
  // the blade of her dagger, in her open hand, and in the cracks of her thorns."
  const VIO = [0.74, 0.34, 1.0], MAG = [1.0, 0.36, 0.88], PINK = [1.0, 0.82, 0.96], witch = () => { const t = frnd(); return t < 0.5 ? VIO : t < 0.85 ? MAG : PINK; };
  // ----- her dagger, drawn (G6): a long plain blade, a gold crescent for a guard, a dark turned grip. Built about the middle of her closed right hand, blade out of the little-finger side. -----
  const DAGGER = new THREE.Group(); DAGGER.visible = false; fxG.add(DAGGER);
  const daggerMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.36, metalness: 0.55, side: THREE.DoubleSide, emissive: new THREE.Color(0.55, 0.20, 0.85), emissiveIntensity: 0 });
  { const bag = wBag(), steel = wLin(0xc2c5cd), gold = wLin(0xcaa24c), dark = wLin(0x2b1d15), bl = []; for (let i = 0; i <= 10; i++) bl.push(V3(0, 0, -0.036 - 0.262 * (i / 10)));
    wTube(bag, bl, (i) => 0.0135 * (1 - 0.93 * Math.pow(i / 10, 1.6)) + 0.0008, 8, (i, a) => { const g = 0.82 + 0.22 * Math.abs(Math.cos(a)); return [steel[0] * g, steel[1] * g, steel[2] * g]; }, null, () => [1, 0.22]);
    const arc = []; for (let i = 0; i <= 12; i++) { const a = PI * (i / 12); arc.push(V3(0.036 * Math.cos(a), 0, -0.022 - 0.034 * (1 - Math.sin(a)))); } wTube(bag, arc, (i) => 0.0018 + 0.0062 * Math.sin(PI * i / 12), 6, () => gold, null, () => [1, 0.7]);
    const gr = []; for (let i = 0; i <= 8; i++) gr.push(V3(0, 0, -0.022 + 0.094 * (i / 8))); wTube(bag, gr, (i) => 0.0088 + 0.0030 * Math.sin(PI * i / 8) + (i === 0 || i === 8 ? 0.002 : 0), 8, (i) => i === 0 || i === 8 ? steel : dark);
    wTube(bag, [V3(0, 0, 0.070), V3(0, 0, 0.078), V3(0, 0, 0.086), V3(0, 0, 0.092)], (i) => [0.006, 0.0115, 0.0105, 0.003][i], 8, () => steel); DAGGER.add(wMesh(bag, daggerMat)); }
  // ----- the crack of violet light that runs along the ground from her blade to the foe (H14, I8), and the small thorned roots that push up along it -----
  const CRACK = (() => { const pos = [], uv = [], idx = [], key = []; let q = 77123; const rnd = () => { q = (q * 1664525 + 1013904223) >>> 0; return q / 4294967296; };
    const run = (x, z, len, w, d0, dir) => { const n = Math.max(3, Math.round(len / 0.035)), b0 = pos.length / 3; let px = x, pz = z;
      for (let i = 0; i <= n; i++) { const t = i / n, ww = w * (1 - 0.7 * t); pos.push(px - ww, 0.007, pz, px + ww, 0.007, pz); uv.push(1, 0, 1, 1); if (i < n) { const b = b0 + i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); key.push(d0 + t * len, d0 + t * len); if (dir === 0 && i > 1 && rnd() < 0.3) run(px, pz, 0.08 + rnd() * 0.12, ww * 0.6, d0 + t * len, rnd() < 0.5 ? -1 : 1); }
        px += (dir === 0 ? (rnd() - 0.5) * 0.11 : dir * (0.02 + rnd() * 0.04)); pz += len / n * (dir === 0 ? 1 : 0.6); } };
    run(0, 0, 1, 0.016, 0, 0); const m = wMesh({ pos, col: pos.map(() => 1), idx, key }, ribMat(PINK, VIO), true); m.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); m.castShadow = false; m.receiveShadow = false; m.renderOrder = 18; m.visible = false; fxG.add(m);
    const bag = wBag(), dk = wLin(0x33212b); for (let i = 0; i < 9; i++) { const z = 0.10 + 0.085 * i, x = (wHash(i * 3.3) - 0.5) * 0.10, h = 0.06 + 0.08 * wHash(i * 5.1), lean = (wHash(i * 7.7) - 0.5) * 0.08, pts = [V3(x, -0.01, z), V3(x + lean * 0.5, h * 0.55, z + 0.01), V3(x + lean, h, z + 0.03)];
      wTube(bag, pts, (j) => [0.011, 0.007, 0.0012][j], 5, () => dk, () => z); wTube(bag, [pts[1], pts[1].clone().add(V3(0.025 * (i % 2 ? 1 : -1), 0.012, 0))], (j) => j ? 0.0004 : 0.004, 4, () => dk, () => z); }
    const sp = wMesh(bag, woodMat, true); sp.visible = false; fxG.add(sp);
    return { m, sp, set(from, len, grow, a, roots) { m.visible = a > 0.01 && grow > 0.005; m.position.set(from.x, 0, from.z); m.scale.set(1, 1, len); wRange(m, -1, grow); m.material.uniforms.uK.value = a; sp.visible = roots > 0.01; sp.position.copy(m.position); sp.scale.set(1, Math.max(0.01, roots), len); wRange(sp, -1, grow); } }; })();
  // ----- the briar (H15, I8): five dark thorned roots, each as thick as her arm, that burst up under the foe and close round it like the fingers of a hand; wine-red roses open on it -----
  const BRIAR = (() => { const G = new THREE.Group(); G.visible = false; fxG.add(G); const bag = wBag(), dkA = wLin(0x3b2530), dkB = wLin(0x55353a), roses = [], pts = [], NFG = 6;
    for (let f = 0; f < NFG; f++) { const a0 = f * TAU / NFG + 0.35, top = 1.50 * (0.80 + 0.2 * wHash(f * 3.1)), line = (t) => { const a = a0 + 2.5 * t * (f % 2 ? 1 : 0.85), r = lerp(0.34, 0.165, sm(0, 0.40, t)) + 0.02 * Math.sin(t * 9 + f) + 0.07 * sm(0.90, 1, t); return V3(Math.cos(a) * r, top * Math.pow(t, 0.9) - 0.03, Math.sin(a) * r); };
      wBraid(bag, line, (t) => lerp(0.078, 0.016, Math.pow(t, 0.8)), (t) => lerp(0.078, 0.016, Math.pow(t, 0.8)), 3, 3.5, 46, 6, 1.0, (t, k) => k ? dkB : dkA, (t) => t);
      for (let i = 1; i < 20; i++) { const t = i / 20, p = line(t), o = V3(p.x, 0, p.z).normalize().applyAxisAngle(V3(0, 1, 0), (wHash(f * 7 + i) - 0.5) * 2.2).add(V3(0, 0.5 * (wHash(f + i * 3) - 0.3), 0)).normalize(), r = lerp(0.078, 0.016, Math.pow(t, 0.8)); wTube(bag, [p.clone().addScaledVector(o, r * 0.6), p.clone().addScaledVector(o, r + 0.05)], (j) => j ? 0.0005 : 0.010, 5, () => dkB, () => t); }
      for (const t of [0.42, 0.66, 0.86]) if ((f + Math.round(t * 10)) % 3 !== 0) { const p = line(t), o = V3(p.x, 0, p.z).normalize(); roses.push({ p: p.addScaledVector(o, lerp(0.078, 0.016, Math.pow(t, 0.8)) + 0.012), o, t }); } pts.push(line); }
    const mesh = wMesh(bag, woodMat, true); G.add(mesh);
    const rb = wBag(), red = [wLin(0x7a0f2a), wLin(0x9a1838), wLin(0xb42a4a)]; [[0.036, 0], [0.027, 0.6], [0.017, 1.2]].forEach(([r, rot], L) => { const b = rb.pos.length / 3; rb.pos.push(0, 0.004 + L * 0.007, 0); rb.col.push(...red[L]); for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU + rot, q = i % 2 ? r * 0.72 : r; rb.pos.push(Math.cos(a) * q, 0.002 + L * 0.009 + (i % 2 ? 0 : 0.005), Math.sin(a) * q); const c = red[Math.min(2, L + (i % 2))]; rb.col.push(c[0], c[1], c[2]); } for (let i = 0; i < 10; i++) rb.idx.push(b, b + 1 + (i + 1) % 10, b + 1 + i); });
    wLeaf(rb, V3(0, 0, 0), V3(1, -0.1, 0.3), V3(0, 1, 0), 0.05, 0.026, wLin(0x3f6a30), wLin(0x2a4a24)); wLeaf(rb, V3(0, 0, 0), V3(-0.8, -0.1, -0.6), V3(0, 1, 0), 0.045, 0.024, wLin(0x3f6a30), wLin(0x2a4a24));
    const rg = wMesh(rb).geometry, yv = V3(0, 1, 0); for (const R of roses) { const m = new THREE.Mesh(rg, woodMat); m.position.copy(R.p); m.quaternion.setFromUnitVectors(yv, R.o); m.castShadow = true; R.m = m; G.add(m); }
    return { G, roses, lines: pts, set(g, bloom) { G.visible = g > 0.004; wRange(mesh, -1, g); roses.forEach((R, i) => { const k = sm(0, 1, cl(bloom * 1.6 - 0.6 * (i / roses.length), 0, 1)) * sm(R.t - 0.02, R.t + 0.03, g); R.m.visible = k > 0.01; R.m.scale.setScalar(Math.max(0.001, k * 1.9)); }); } }; })();
  // ----- the Bramble Cradle (H16): a dome of living branches woven like an upturned basket, taller than her hat, small gold-green leaves all over it, its thorns pointing out -----
  const CRADLE = (() => { const bag = wBag(), H = 2.30, R = 0.82, br = [wLin(0x9c7a3c), wLin(0x7d5f30)], lf = [wLin(0xbfd055), wLin(0x93b23c)], rad = (u) => R * Math.pow(Math.max(0, 1 - Math.pow(u, 2.3)), 0.5), P = (a, u) => V3(Math.cos(a) * rad(u), H * u, Math.sin(a) * rad(u));
    for (let d = -1; d <= 1; d += 2) for (let i = 0; i < 10; i++) { const a0 = i * TAU / 10 + (d > 0 ? 0.31 : 0), pts = []; for (let j = 0; j <= 34; j++) { const u = 0.995 * j / 34; pts.push(P(a0 + d * 2.0 * u + 0.05 * Math.sin(u * 14 + i), u)); }
      wTube(bag, pts, (j) => lerp(0.0150, 0.0060, j / 34), 5, (j, a) => { const g = 0.85 + 0.2 * Math.sin(j * 1.3 + a * 2 + i); const c = br[(i + (d > 0 ? 1 : 0)) % 2]; return [c[0] * g, c[1] * g, c[2] * g]; }, (j) => 0.995 * j / 34);
      for (let j = 2; j < 34; j += 2) { const u = 0.995 * j / 34, p = pts[j], o = V3(p.x, 0.25 * R, p.z).normalize(); if ((j + i) % 4 === 0) wTube(bag, [p.clone(), p.clone().addScaledVector(o, 0.050)], (k) => k ? 0.0004 : 0.0055, 4, () => br[1], () => u);
        else wLeaf(bag, p, V3(o.x + (wHash(i * 9 + j) - 0.5), 0.5 + wHash(j * 3 + i), o.z + (wHash(i + j * 7) - 0.5)), o, 0.050 + 0.025 * wHash(i * 5 + j), 0.026, lf[0], lf[1], u); } }
    for (const u of [0.18, 0.42, 0.66]) { const pts = []; for (let j = 0; j <= 48; j++) { const a = (j / 48) * TAU; pts.push(P(a, u + 0.022 * Math.sin(a * 5 + u * 20))); } wTube(bag, pts, () => 0.0085, 5, () => br[0], () => u); }
    const m = wMesh(bag, woodMat, true); m.visible = false; fxG.add(m); m.userData.at = P; m.userData.set = (g, shake) => { m.visible = g > 0.004; wRange(m, -1, g); m.scale.set(1 + 0.012 * shake, 1 - 0.008 * shake, 1 + 0.012 * shake); }; return m; })();
  // ----- a friend who has fallen (H13): the grey mannequin lying on its back, able to sit up and to give her its hand -----
  const FALLEN = (() => { const G = new THREE.Group(); G.visible = false; fxG.add(G); const src = ALLY.clone(), ch = [...src.children], lower = new THREE.Group(), upper = new THREE.Group(), arm = new THREE.Group(), armL = new THREE.Group(), hand = new THREE.Object3D();
    upper.position.set(0, 0.92, 0); arm.position.set(-0.17, 1.30 - 0.92, 0); hand.position.set(-0.058, -0.61, 0.02); armL.position.set(0.17, 1.30 - 0.92, 0); arm.add(hand); upper.add(arm); upper.add(armL); G.add(lower); G.add(upper);
    ch.forEach((m, i) => { const isArm = i >= 4 && (i - 4) % 10 < 5, right = i >= 4 && i < 9; if (right) { arm.add(m); m.position.x += 0.17; m.position.y -= 1.30; } else if (i >= 14 && i < 19) { armL.add(m); m.position.x -= 0.17; m.position.y -= 1.30; } else if (i < 3 || isArm) { upper.add(m); m.position.y -= 0.92; } else lower.add(m); });
    G.rotation.set(PI / 2, PI, 0);
    return { G, hand, set(x, z0, k, sit, reach) { G.visible = k > 0.02; G.position.set(x, 0.115, z0); G.scale.setScalar(Math.max(0.001, sm(0, 1, k))); upper.rotation.x = 1.12 * sit; arm.rotation.set(-1.05 * sit * (1 - reach) - 1.25 * reach, 0, -0.55 * reach); armL.rotation.x = -1.05 * sit; },
      handAt(out) { G.updateMatrixWorld(true); return hand.getWorldPosition(out).applyMatrix4(_inv); } }; })();
  // the roots of light that trace the outline of the one lying there, and the small white flowers that open along them (H13, right)
  const TRACE = (() => { const half = [[0, 1.70], [0.09, 1.67], [0.13, 1.58], [0.11, 1.47], [0.12, 1.42], [0.24, 1.38], [0.29, 1.28], [0.31, 1.02], [0.31, 0.78], [0.30, 0.60], [0.24, 0.58], [0.21, 0.72], [0.20, 0.45], [0.19, 0.20], [0.18, 0.0], [0.15, -0.07], [0, -0.08]], loop = half.concat(half.slice(1, -1).reverse().map(([x, y]) => [-x, y]));
    const pos = [], uv = [], idx = [], key = [], N = loop.length, fl = new THREE.Group(), starMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, side: THREE.DoubleSide, emissive: new THREE.Color(0.8, 0.78, 0.6), emissiveIntensity: 0.35 }), sb = wBag(); wStar(sb, V3(0, 0, 0), V3(0, 1, 0), 0.022); const sg = wMesh(sb).geometry, stars = [];
    const M = 6; for (let i = 0; i < N; i++) for (let s = 0; s < M; s++) { const a = loop[i], b = loop[(i + 1) % N], t = s / M, x = lerp(a[0], b[0], t), y = lerp(a[1], b[1], t), dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, w = 0.0075, wob = 0.012 * Math.sin((i * M + s) * 1.7), nx = dy / L, ny = -dx / L, k = Math.abs(y - 1.2) / 1.3, v = pos.length / 3;
        pos.push(x + nx * (wob + w), 0, y + ny * (wob + w), x + nx * (wob - w), 0, y + ny * (wob - w)); uv.push(1, 0, 1, 1); const nv = ((i * M + s + 1) % (N * M)) * 2; idx.push(v, v + 1, nv, v + 1, nv + 1, nv); key.push(k, k);
        if ((i * M + s) % 5 === 2) { const m = new THREE.Mesh(sg, starMat); m.position.set(x + nx * 0.03 * Math.sin(i * 3.1), 0.012, y + ny * 0.03 * Math.sin(i * 3.1)); m.rotation.y = i * 1.3; m.userData.k = k; fl.add(m); stars.push(m); } }
    const m = wMesh({ pos, col: pos.map(() => 1), idx, key }, ribMat([1.0, 0.93, 0.6], [0.7, 0.95, 0.4]), true); m.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); m.castShadow = false; m.receiveShadow = false; m.renderOrder = 18; const G = new THREE.Group(); G.add(m); G.add(fl); G.visible = false; fxG.add(G);
    return { G, stars, set(x, z0, grow, a, bloom) { G.visible = a > 0.01 && grow > 0.005; G.position.set(x, 0.008, z0); G.scale.set(1, 1, 1); wRange(m, -1, grow * 1.05); m.material.uniforms.uK.value = a; for (const s of stars) { const k = sm(s.userData.k, s.userData.k + 0.25, bloom * 1.3) * a; s.visible = k > 0.01; s.scale.setScalar(Math.max(0.001, k)); } } }; })();
  function thornHide() { DAGGER.visible = false; CRACK.m.visible = false; CRACK.sp.visible = false; BRIAR.G.visible = false; CRADLE.visible = false; FALLEN.G.visible = false; TRACE.G.visible = false; }
  // ===== I98e_react.js: stage fourteen: what her reactions need (painting H17, H18) =====
  // Chris, November 14: "let's continue on to her reactions". His lore: "She holds her hat on when she is hit, loses it when she
  // falls, and tips its brim when she wins." Her hat is part of her head, so to lose it the worn hat is hidden and a copy of it is
  // shown where it falls; and under the hat she had no hair on top, so HAIRTOP is that hair: tresses combed down each side from a
  // middle parting (C11, C12), shown only while the hat is off.
  const HAIRTOP = (() => { const G = new THREE.Group(); G.visible = false; fxG.add(G); const bag = wBag(), c = HB.c, rx = HB.rx + 0.005, ry = HB.ry + 0.005, rf = HB.rzF + 0.004, rb = HB.rzB + 0.004, cols = HAIRC.map((h) => { const k = new THREE.Color(h).convertSRGBToLinear(); return [k.r, k.g, k.b]; });
    const tone = (i) => (j, a) => { const b = cols[1 + Math.floor(wHash(i * 3.3) * 3.99) % 4], g = (0.72 + 0.28 * Math.min(1, j / 3)) * (0.90 + 0.16 * Math.sin(a * 2 + i)); return [b[0] * g, b[1] * g, b[2] * g]; };
    for (const s of [-1, 1]) for (let i = 0; i < 26; i++) { const z0 = lerp(-0.118, 0.080, i / 25), pts = []; for (let j = 0; j <= 12; j++) { const t = j / 12, a = 0.06 + t * 1.80, z = z0 - 0.022 * t * t + 0.004 * Math.sin(t * 13 + i), f = Math.sqrt(Math.max(0.05, 1 - Math.pow(z / (z > 0 ? rf : rb), 2))); pts.push(V3(s * rx * f * Math.sin(a) * (1 + 0.05 * t), c.y + ry * f * Math.cos(a), c.z + z)); }
      wTube(bag, pts, (j) => 0.0105 * (1 - 0.25 * j / 12), 5, tone(i + (s > 0 ? 40 : 0)), null, () => [1.7, 0.45]); }
    for (let i = 0; i < 16; i++) { const ph = PI + lerp(-1.25, 1.25, i / 15), pts = []; for (let j = 0; j <= 10; j++) { const t = j / 10, th = 0.42 + t * 1.36, w = 0.004 * Math.sin(t * 12 + i); pts.push(V3(rx * Math.sin(th) * Math.sin(ph) + w, c.y + ry * Math.cos(th), c.z + rb * Math.sin(th) * Math.cos(ph))); } wTube(bag, pts, (j) => 0.0115, 5, tone(i + 90), null, () => [1.8, 0.45]); }
    const m = wMesh(bag, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, side: THREE.DoubleSide })); m.receiveShadow = false; G.add(m); return G; })();
  const HAT_KEYS = ['felt', 'brim', 'hatband', 'silver', 'gold', 'horn'], HAT_PIV = V3(0, 1.585, -0.03), HAT_Q = new THREE.Quaternion(), HAT_QG = new THREE.Quaternion(); let HATD = null, hatK = 0;
  function hatMake() { HATD = new THREE.Group(); HATD.visible = false; fxG.add(HATD); const cp = (x) => { const y = x.clone(); y.skinning = false; return y; };
    for (const k of HAT_KEYS) { const m = meshes[k]; if (!m) continue; const d = new THREE.Mesh(m.geometry, Array.isArray(m.material) ? m.material.map(cp) : cp(m.material)); d.position.copy(HAT_PIV).negate(); d.castShadow = true; d.frustumCulled = false; HATD.add(d); } }
  // k: 0 the hat is on her head; 1 it lies on the ground at G (turned by yaw); between, it tumbles down
  function hatApply(k, G, yaw) { const off = k > 0.002; for (const n of HAT_KEYS) if (meshes[n]) meshes[n].visible = !off; HAIRTOP.visible = off; if (!off) { if (HATD) HATD.visible = false; return; } if (!HATD) hatMake(); HATD.visible = true;
    HAIRTOP.position.set(0, 0, 0); carried('head', 0, 0, 0, HAIRTOP.position); rootQuat(SK.head, HAIRTOP.quaternion);
    const e = k * k * (3 - 2 * k), from = carried('head', HAT_PIV.x, HAT_PIV.y, HAT_PIV.z, V3()); rootQuat(SK.head, HAT_Q); HAT_QG.setFromEuler(new THREE.Euler(0.22, yaw, -0.30, 'YXZ'));
    HATD.position.copy(from).lerp(G, e); HATD.position.y += 0.28 * Math.sin(PI * Math.min(1, k * 1.15)) * (1 - e); HATD.quaternion.copy(HAT_Q).slerp(HAT_QG, e); HATD.rotateX(-1.4 * Math.sin(PI * e)); }

  // ---------- materials ----------
  const tBody = bakedTex('body', 2048, 1408, '#17131a'); tBody.wrapS = THREE.RepeatWrapping;
  const tLace = bakedTex('lace', 1024, 1024, '#17131a'); tLace.wrapS = tLace.wrapT = THREE.MirroredRepeatWrapping; tLace.repeat.set(1, 1);
  const SKIN_C = (BAKED && BAKED.skinChest) || SKIN || '#c99a80', SKIN_L = (BAKED && BAKED.skin) || SKIN_C, lit = (o) => Object.assign({ roughness: 0.70, envMapIntensity: 0.2 }, o);
  const tHair = hairTexIo(HAIRC), tHairB = hairTexIo(HAIRC, true), tHairA = hairAlphaIo();       // one set of hair pictures, shared by every hair material
  const MATS = {
    // the wrapped painting carries its own soft studio light, so most of it is shown as it was painted and only a little is lit again
    torso: sheen(std({ map: tBody, color: lin('#b9b2b6'), roughness: 0.74, envMapIntensity: 0.25, emissive: lin('#ffffff'), emissiveMap: tBody, emissiveIntensity: 0.34 }), '#8fa4d8', 3, 0.06),
    skin: sheen(std(lit({ color: lin('#b9b2b6').multiply(lin(SKIN_L)), emissive: lin(SKIN_L), emissiveIntensity: 0.34 })), '#ffb49a', 3.2, 0.06),
    arm: (() => { const t = bakedTex('arms', 512, 1024, SKIN_L); return sheen(std(lit({ map: t, color: lin('#b9b2b6'), emissive: lin('#ffffff'), emissiveMap: t, emissiveIntensity: 0.34 })), '#ffb49a', 3.2, 0.06); })(),
    robe: (() => { const t = robeTexIo(); return sheen(std({ map: t, color: lin('#b0a9ab'), roughness: 0.84, envMapIntensity: 0.15, side: THREE.DoubleSide, emissive: lin('#ffffff'), emissiveMap: t, emissiveIntensity: 0.27 }), '#ff9aa8', 3, 0.10); })(),
    moss: (() => { const t = mossTexIo(); return std({ map: t, alphaTest: 0.5, color: lin('#b8b8b0'), roughness: 0.95, envMapIntensity: 0.1, side: THREE.DoubleSide, emissive: lin('#ffffff'), emissiveMap: t, emissiveIntensity: 0.32, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); })(),
    fern: (() => { const t = fernTexIo(); return std({ map: t, alphaTest: 0.5, color: lin('#b8b8b0'), roughness: 0.9, envMapIntensity: 0.1, side: THREE.DoubleSide, emissive: lin('#ffffff'), emissiveMap: t, emissiveIntensity: 0.32 }); })(),
    form: sheen(std(lit({ color: lin('#b9b2b6').multiply(lin(SKIN_C)), emissive: lin(SKIN_C), emissiveIntensity: 0.34 })), '#ffb49a', 3.2, 0.06),
    // the head wears three pictures at once, mixed by which way the skin faces (see buildHead): the front painting, the profile painting, plain skin
    face: (() => {
      const t = faceT;
      const m = sheen(std({ map: t, color: lin('#b9b2b6'), roughness: 0.66, envMapIntensity: 0.2, emissive: lin('#ffffff'), emissiveMap: t, emissiveIntensity: 0.34 }), '#ffb49a', 3.2, 0.06);
      const ts = bakedTex('faceSide', 512, 512, SKIN_C), ta = bakedTex('faceSideA', 512, 512, '#000000'), first = m.onBeforeCompile;
      m.onBeforeCompile = (sh) => {
        if (first) first(sh);
        sh.uniforms.uSide = { value: ts }; sh.uniforms.uSideA = { value: ta }; sh.uniforms.uPlain = { value: lin(SKIN_C) }; sh.uniforms.uPlain2 = { value: lin((BAKED && BAKED.skinNeck) || '#ad7a59') };       // plain skin: her chest's tone at the foot of the neck (faceMix.w = 0), her neck's tone above (1)
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 faceMix; attribute vec2 uvSide; varying vec4 vFaceMix; varying vec2 vUvSide;')
          .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFaceMix = faceMix; vUvSide = uvSide;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D uSide; uniform sampler2D uSideA; uniform vec3 uPlain; uniform vec3 uPlain2; varying vec4 vFaceMix; varying vec2 vUvSide; vec3 gFaceCol;')
          .replace('#include <map_fragment>', 'vec4 texelColor = mapTexelToLinear( texture2D( map, vUv ) );\n float fSide = texture2D( uSideA, vUvSide ).r * vFaceMix.x;\n vec3 sideCol = mapTexelToLinear( texture2D( uSide, vUvSide ) ).rgb;\n gFaceCol = ( texelColor.rgb * max( 0.0, 1.0 - fSide - vFaceMix.y ) + sideCol * fSide + mix( uPlain, uPlain2, vFaceMix.w ) * vFaceMix.y ) * vFaceMix.z;\n diffuseColor.rgb *= gFaceCol;')
          .replace('#include <emissivemap_fragment>', 'totalEmissiveRadiance *= gFaceCol;');
      };
      return m;
    })(),
    // her hair: tresses of strands in her own colours (the inner layers a shade darker), over a plain dark sheet; the fringe is locks and wisps of separate strands
    tress: sheen(std({ map: tHair, alphaMap: tHairA, alphaTest: 0.5, bumpMap: tHairB, bumpScale: 0.0016, color: lin('#d6cdcb'), roughness: 0.48, envMapIntensity: 0.30, side: THREE.DoubleSide, emissive: lin('#ffffff'), emissiveMap: tHair, emissiveIntensity: 0.24 }), '#e8c9a8', 3, 0.10),
    tressIn: std({ map: tHair, alphaMap: tHairA, alphaTest: 0.5, bumpMap: tHairB, bumpScale: 0.0016, color: lin('#8e8583'), roughness: 0.60, envMapIntensity: 0.2, side: THREE.DoubleSide, emissive: lin('#ffffff'), emissiveMap: tHair, emissiveIntensity: 0.14 }),
    wisp: std({ map: tHair, alphaMap: wispAlphaIo(), alphaTest: 0.42, color: lin('#e6dcd8'), roughness: 0.55, envMapIntensity: 0.2, side: THREE.DoubleSide, emissive: lin('#ffffff'), emissiveMap: tHair, emissiveIntensity: 0.34 }),
    lock: std({ map: tHair, alphaMap: tHairA, alphaTest: 0.5, color: lin('#dcd2ce'), roughness: 0.55, envMapIntensity: 0.2, side: THREE.DoubleSide, emissive: lin('#ffffff'), emissiveMap: tHair, emissiveIntensity: 0.30 }),
    hairmass: std({ map: tHair, color: lin('#8e8583'), roughness: 0.75, envMapIntensity: 0.1, side: THREE.DoubleSide, emissive: lin('#ffffff'), emissiveMap: tHair, emissiveIntensity: 0.20 }),
    // the hat: felt and lace from the swatches in F9, horn from F9, gold and silver for the chain and charms
    felt: (() => { const t = bakedTex('felt', 512, 512, (BAKED && BAKED.feltCol) || '#481324'); t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping; return sheen(std({ map: t, color: lin('#cfc4c8'), roughness: 0.96, envMapIntensity: 0.12, emissive: lin('#ffffff'), emissiveMap: t, emissiveIntensity: 0.30 }), '#e58aa8', 3, 0.16); })(),
    brim: (() => { const t = brimTexIo(); return sheen(std({ map: t, color: lin('#cfc4c8'), roughness: 0.96, envMapIntensity: 0.12, side: THREE.DoubleSide, emissive: lin('#ffffff'), emissiveMap: t, emissiveIntensity: 0.30 }), '#e58aa8', 3, 0.14); })(),
    hatband: (() => { const t = bakedTex('hatband', 512, 512, '#1a1518'); t.wrapS = THREE.MirroredRepeatWrapping; return std({ map: t, color: lin('#d9d2d6'), roughness: 0.9, envMapIntensity: 0.15, emissive: lin('#ffffff'), emissiveMap: t, emissiveIntensity: 0.25 }); })(),
    horn: (() => { const t = bakedTex('horn', 256, 256, '#e2d2b4'); t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping; return std({ map: t, color: lin('#f0e8e0'), roughness: 0.42, envMapIntensity: 0.5, emissive: lin('#ffffff'), emissiveMap: t, emissiveIntensity: 0.18 }); })(),
    gold: std({ color: lin('#d0a045'), metalness: 1, roughness: 0.32, envMapIntensity: 1.5 }),
    silver: std({ color: lin('#c9c6cc'), metalness: 1, roughness: 0.34, envMapIntensity: 1.4 }),
    // glasses (C14): antique bronze wire, clear lenses that catch a little light
    wire: std({ color: lin('#4a3a2a'), metalness: 0.85, roughness: 0.40, envMapIntensity: 1.2 }),
    pad: phys({ color: lin('#d8d2cc'), transparent: true, opacity: 0.55, roughness: 0.2 }),
    lens: phys({ color: lin('#e9e4f2'), transparent: true, opacity: 0.10, roughness: 0.04, metalness: 0, envMapIntensity: 1.6, depthWrite: false, side: THREE.DoubleSide }),
    hand: (() => { const t = bakedTex('hands', 1024, 1024, SKIN_L); return sheen(std(lit({ map: t, color: lin('#b9b2b6'), emissive: lin('#ffffff'), emissiveMap: t, emissiveIntensity: 0.34 })), '#ffb49a', 3.2, 0.06); })(),
    handR: (() => { const t = bakedTex('handsR', 1024, 1024, SKIN_L); return sheen(std(lit({ map: t, color: lin('#b9b2b6'), emissive: lin('#ffffff'), emissiveMap: t, emissiveIntensity: 0.34 })), '#ffb49a', 3.2, 0.06); })(),
    nail: BAKED && BAKED.hands ? phys({ color: lin('#ecc9c0'), transparent: true, opacity: 0.20, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.15, depthWrite: false }) : phys({ color: lin('#d9a79a'), roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.2 }),      // her nails are painted on her fingers (D1, D2); the plate is only their gloss
    // the skirt's lace is a piece of painting B4, repeated; it is solid for now (the see-through lace needs the round 2 lace square)
    skirt: sheen(std({ map: tLace, color: lin('#a8a0a4'), roughness: 0.86, envMapIntensity: 0.15, side: THREE.DoubleSide, emissive: lin('#ffffff'), emissiveMap: tLace, emissiveIntensity: 0.30 }), '#7a6470', 3, 0.10),
    tulle: std({ color: lin('#0f0c10'), roughness: 0.95, side: THREE.DoubleSide, transparent: true, opacity: 0.62, depthWrite: false }),
    band: std({ color: lin('#17131a'), roughness: 0.9 }),
    boot: (() => { const n = crinkleTex(), k = new THREE.Vector2(0.9, 0.9); return std({ color: lin('#1c1512'), roughness: 0.30, envMapIntensity: 0.95, normalMap: n, normalScale: k }); })(),
    sole: std({ map: soleTex(), color: lin('#8a8280'), roughness: 0.86 }),
    stitch: std({ color: lin('#b08d4a'), roughness: 0.8 }), eyelet: std({ color: lin('#b9914a'), roughness: 0.34, metalness: 1, envMapIntensity: 1.4 }), aglet: std({ color: lin('#b9914a'), roughness: 0.35, metalness: 1 }),
    lace: std({ color: lin('#161316'), roughness: 0.9 }),
    sock: std({ map: sockTexIo(), color: lin('#d9d2d0'), roughness: 0.96 }),
    cloth: std({ color: lin('#1a1518'), roughness: 0.9 })
  };

  MATS.propGold = MATS.gold; MATS.sickleGold = MATS.gold; MATS.propLeather = std({ color: lin('#1c1614'), roughness: 0.6, envMapIntensity: 0.3 }); MATS.propWood = std({ color: lin('#2a1c16'), roughness: 0.5, envMapIntensity: 0.4 }); MATS.sickleGrip = MATS.propWood;
  { const tc = bookCoverTexIo(), tp = bookPageTexIo(), cov = () => std({ map: tc, color: lin('#c8c0bc'), roughness: 0.62, envMapIntensity: 0.25, side: THREE.DoubleSide, emissive: lin('#ffffff'), emissiveMap: tc, emissiveIntensity: 0.22 }), pg = () => std({ map: tp, color: lin('#cfc8c0'), roughness: 0.9, side: THREE.DoubleSide, emissive: lin('#ffffff'), emissiveMap: tp, emissiveIntensity: 0.30 });
    MATS.bookShut = cov(); MATS.bookOpen = cov(); MATS.bookShutPg = pg(); MATS.bookOpenPg = pg(); MATS.bookRibbon = std({ color: lin('#8a1f2c'), roughness: 0.8, side: THREE.DoubleSide }); }
  MATS.gearGold = MATS.gold; MATS.gearSilver = MATS.silver;       // the same metals as her hat's, kept as their own parts so the page can hide them
  MATS.leather = std({ color: lin('#2e221d'), roughness: 0.62, envMapIntensity: 0.3 }); MATS.bead = std({ color: lin('#151211'), roughness: 0.28, envMapIntensity: 0.9 }); MATS.wood = std({ color: lin('#5b3320'), roughness: 0.5, envMapIntensity: 0.4 });
  MATS.crystal = phys({ color: lin('#eef4fb'), roughness: 0.06, transparent: true, opacity: 0.66, envMapIntensity: 1.6, emissive: lin('#cfe0f5'), emissiveIntensity: 0.20 });
  // ---------- bind: one skinned mesh per material ----------
  const root = new THREE.Group(); root.name = 'io';
  root.add(SK.hips); if (SK.book) root.add(SK.book); root.add(fxG); root.updateMatrixWorld(true);       // her book is not carried by her body: it has its own place every frame
  const skeleton = new THREE.Skeleton(bones);
  const meshes = {};
  let triCount = 0;
  for (const key in buckets) {
    const B = buckets[key], g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(B.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(B.nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(B.uv, 2));
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(B.si, 4));
    g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(B.sw, 4));
    if (key === 'face') { g.setAttribute('faceMix', new THREE.Float32BufferAttribute(faceMix, 4)); g.setAttribute('uvSide', new THREE.Float32BufferAttribute(faceUvS, 2)); }
    g.setIndex(B.n > 65535 ? new THREE.Uint32BufferAttribute(B.idx, 1) : new THREE.Uint16BufferAttribute(B.idx, 1));
    if (LOD.onGeometry) LOD.onGeometry(key, g, B, { MATS, lin, sheen, std, phys });
    const m = new THREE.SkinnedMesh(g, (LOD.material && LOD.material(key, B, { MATS, lin, sheen, std, phys })) || MATS[key] || MATS.cloth);
    m.name = key; m.castShadow = !/^(lens|pad|wisp)$/.test(key); m.receiveShadow = true; m.frustumCulled = false;
    root.add(m); m.bind(skeleton, new THREE.Matrix4()); meshes[key] = m; triCount += g.index.count / 3; if (LOD.onMesh) LOD.onMesh(key, m);
  }
  // ---------- motion ----------
  // pose() holds her still, for checking her against the paintings. play(name) starts one of her own moves:
  //   'idle' she stands and breathes; 'walk'; 'talk' (one open hand, small nods, her painted mouths);
  //   and seven short ones that end by themselves and go back to 'idle': 'glasses' (she pushes them up), 'hat' (she tips it),
  //   'curtsey', 'twirl', 'herb' (she kneels, picks a sprig and smells it), 'wave', 'look' (over each shoulder).
  // They are her poses and emotes, not her attacks. They are also the test of her hair and skirt: every frame the bones go back to
  // rest, the move is laid on top (restAll, add), her feet and hands are brought to where they should be (ik2, aimHand, flatFoot),
  // and then the soft chains of her hair and skirt are stepped (softTick).
  const _inv = new THREE.Matrix4(), _m4 = new THREE.Matrix4(), _mb = new THREE.Matrix4(), _p = V3(), _c = V3(), _t = V3(), _t2 = V3(), _n = V3(), _d = V3(), _e = V3(), _s = V3();
  const _qa = new THREE.Quaternion(), _qb = new THREE.Quaternion(), _qc = new THREE.Quaternion(), AX = V3(1, 0, 0), AY = V3(0, 1, 0);
  const BODY = Object.keys(SK).filter((k) => !/_\d+$/.test(k));               // every bone but the soft chains
  const add = (b, x, y, z) => { const r = SK[b].rotation; r.x += x; r.y += y; r.z += z; };
  function restAll() { for (const k of BODY) SK[k].rotation.set(0, 0, 0); SK.hips.position.copy(SK.hips.userData.home); }
  function sync() { root.updateMatrixWorld(true); _inv.copy(root.matrixWorld).invert(); }
  const rootQuat = (bone, out) => out.setFromRotationMatrix(_m4.multiplyMatrices(_inv, bone.matrixWorld));       // a bone's turn, in her own space
  const carried = (bone, x, y, z, out) => (out || V3()).set(x, y, z).sub(SK[bone].userData.rest).applyMatrix4(SK[bone].matrixWorld).applyMatrix4(_inv);   // a point of her rest pose, where its bone has carried it

  // ----- balls her hair ('h') and her skirt ('s') cannot pass into, each carried by a bone ('hs': both) -----
  const COL = [];
  const ball = (bone, x, y, z, r, g) => COL.push({ bone: SK[bone], off: V3(x, y, z).sub(SK[bone].userData.rest), rest: V3(x, y, z), r, g, p: V3() });
  ball('neck', 0, 1.385, -0.022, 0.050, 'h'); ball('spine3', 0, 1.300, -0.030, 0.078, 'h'); ball('spine3', -0.058, 1.245, 0.002, 0.086, 'h'); ball('spine3', 0.058, 1.245, 0.002, 0.086, 'h');
  ball('spine2', 0, 1.165, 0.002, 0.092, 'h'); ball('spine1', 0, 1.075, -0.004, 0.080, 'h'); ball('hips', 0, 0.955, -0.020, 0.135, 'h');
  for (const [S] of SIDES) {
    const sh = restPts['sh' + S], d = armDir[S];
    [['uarm', 0, 0.048], ['uarm', 0.08, 0.043], ['uarm', 0.16, 0.039], ['farm', 0.232, 0.037], ['farm', 0.30, 0.035], ['farm', 0.37, 0.030], ['hand', 0.484, 0.033], ['hand', 0.544, 0.026]].forEach(([b, sl, r]) => { const p = sh.clone().addScaledVector(d, sl); ball(b + S, p.x, p.y, p.z, r, 'hs'); });
    const hip = SK['thigh' + S].userData.rest, kn = SK['shin' + S].userData.rest, an = SK['foot' + S].userData.rest, T = (a, b, t) => a.clone().lerp(b, t);
    [['thigh', T(hip, kn, 0.06), 0.094], ['thigh', T(hip, kn, 0.18), 0.092], ['thigh', T(hip, kn, 0.31), 0.086], ['thigh', T(hip, kn, 0.46), 0.078], ['thigh', T(hip, kn, 0.64), 0.071], ['thigh', T(hip, kn, 0.82), 0.065], ['shin', kn.clone(), 0.063], ['shin', T(kn, an, 0.22), 0.058], ['shin', T(kn, an, 0.45), 0.055], ['shin', T(kn, an, 0.70), 0.049], ['foot', V3(an.x, 0.08, 0.0), 0.055], ['foot', V3(an.x, 0.05, 0.07), 0.050]].forEach(([b, p, r]) => ball(b + S, p.x, p.y, p.z, r, 'g'));       // 'g': her legs, for the things on her belt and her sleeve points; her skirt uses LEGCAP below
  }
  // ----- her legs as six tapered tubes, for her skirt and her cloak (stage nine) -----
  // Chris, November 13: "the legs pass through the clothes a lot". Her legs were rows of balls, and only the joints of the skirt's
  // chains were kept out of them: a thigh could pass between two balls, between two joints, or between two chains. Now each leg is
  // three tubes with no gaps; every stretch of chain is tested at its end and at two points along it; and the same six tubes are
  // given to the cloth's own drawing (legPush), which moves any point of cloth that is still inside a leg straight out of it.
  // A point is never pushed further from a leg than it lies when she stands, so standing she looks as she did.
  const LEGCAP = [];
  for (const [S] of SIDES) { const hip = SK['thigh' + S].userData.rest, kn = SK['shin' + S].userData.rest, an = SK['foot' + S].userData.rest;
    for (const [b, A0, B0, r0, r1] of [['thigh', hip.clone(), kn.clone(), 0.098, 0.070], ['shin', kn.clone(), an.clone(), 0.072, 0.070], ['foot', V3(an.x, 0.072, an.z - 0.008), V3(an.x, 0.052, 0.112), 0.070, 0.058]])
      LEGCAP.push({ bone: SK[b + S], A0, B0, r0, r1, offA: A0.clone().sub(SK[b + S].userData.rest), offB: B0.clone().sub(SK[b + S].userData.rest), A: A0.clone(), B: B0.clone() }); }
  const capRest = (c, pt) => { const ab = c.B0.clone().sub(c.A0), t = cl(pt.clone().sub(c.A0).dot(ab) / ab.lengthSq(), 0, 1); return pt.distanceTo(c.A0.clone().addScaledVector(ab, t)); };       // how far a point of her rest pose lies from a tube
  const CAPF = [1, 0.66, 0.33], CAPN = 6, HIP = V3(), LEGS = []; LEGCAP.forEach((c, ci) => { for (let k = 0; k < CAPN; k++) LEGS.push({ c, ci, t: k / (CAPN - 1), r: lerp(c.r0, c.r1, k / (CAPN - 1)), p: V3() }); });
  const LEGU = { uCapA: { value: LEGCAP.map((c) => c.A) }, uCapB: { value: LEGCAP.map((c) => c.B) }, uCapA0: { value: LEGCAP.map((c) => c.A0) }, uCapB0: { value: LEGCAP.map((c) => c.B0) }, uCapR: { value: LEGCAP.map((c) => new THREE.Vector2(c.r0, c.r1)) }, uHip: { value: HIP } };
  // legPush: each layer keeps a little further off her leg than the one under it, so they do not flicker where they are pressed together
  const LEGPAD = { band: 0.004, tulle: 0.007, skirt: 0.010, robe: 0.015, moss: 0.017, fern: 0.017 };
  // Her sleeves do not go round her legs, they only meet them (a hand on a knee). A sleeve point inside a leg, or just under one, is
  // lifted onto it if the leg lies level (a raised thigh), so a sleeve lies on her lap; out of a leg that stands it is moved straight out.
  for (const key in LEGPAD) { const mesh = meshes[key]; if (!mesh) continue; const g = mesh.geometry, si = g.attributes.skinIndex.array, sw = g.attributes.skinWeight.array, n = g.attributes.position.count, mode = new Float32Array(n);
    for (let i = 0; i < n; i++) for (let q = 0; q < 4; q++) if (sw[i * 4 + q] > 0.2 && /^(sl[RL]\d_|svt|uarm|farm|hand|clav)/.test(bones[si[i * 4 + q]].name)) mode[i] = 1;
    g.setAttribute('capMode', new THREE.Float32BufferAttribute(mode, 1)); }
  for (const key in LEGPAD) { const pad = LEGPAD[key], m = MATS[key]; if (!m) continue; const first = m.onBeforeCompile;
    m.onBeforeCompile = (sh) => { if (first) first(sh); Object.assign(sh.uniforms, LEGU); sh.uniforms.uCapPad = { value: pad };
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float capMode; uniform vec3 uCapA[6]; uniform vec3 uCapB[6]; uniform vec3 uCapA0[6]; uniform vec3 uCapB0[6]; uniform vec2 uCapR[6]; uniform float uCapPad; uniform vec3 uHip;')
        .replace('#include <skinning_vertex>', '#include <skinning_vertex>\n#ifdef USE_SKINNING\n{ vec2 hd = transformed.xz - uHip.xz; vec3 rho = vec3(hd.x, 0.0, hd.y) / max(length(hd), 1e-4); float sOut = 0.0; float sUp = 0.0; float sLev = 0.0; vec3 rad = vec3(0.0);\nfor (int ci = 0; ci < 6; ci++) {\n vec3 abp = uCapB[ci] - uCapA[ci]; float lev = step(abs(abp.y), 0.6 * length(abp)); vec3 ab0 = uCapB0[ci] - uCapA0[ci]; float d0 = distance(position, uCapA0[ci] + ab0 * clamp(dot(position - uCapA0[ci], ab0) / dot(ab0, ab0), 0.0, 1.0));\n if (capMode > 0.5) { vec3 ab = uCapB[ci] - uCapA[ci]; float tc = clamp(dot(transformed - uCapA[ci], ab) / dot(ab, ab), 0.0, 1.0); vec3 rv = transformed - (uCapA[ci] + ab * tc); float dd = length(rv); float RR = min(mix(uCapR[ci].x, uCapR[ci].y, tc) + uCapPad, d0 - 0.002); if (dd < RR) rad += rv * ((RR - dd) / max(dd, 1e-5)); }\n for (int k = 0; k < 6; k++) { float tk = float(k) / 5.0; float RR = min(mix(uCapR[ci].x, uCapR[ci].y, tk) + uCapPad, d0 - 0.002); if (RR > 0.0) { vec3 v = transformed - mix(uCapA[ci], uCapB[ci], tk); float cc = dot(v, v) - RR * RR; float b1 = dot(v, rho); float q1 = b1 * b1 - cc; if (q1 > 0.0) sOut = max(sOut, sqrt(q1) - b1); float q2 = v.y * v.y - cc; if (q2 > 0.0) { sUp = max(sUp, sqrt(q2) - v.y); sLev = max(sLev, lev * (sqrt(q2) - v.y)); } } }\n}\nif (capMode > 0.5) { if (sLev > 0.0 && sLev < 0.30) transformed.y += sLev; else transformed += rad; }\nelse if (sOut > 0.0 && sUp > 0.0) { if (sUp < sOut) transformed.y += sUp; else transformed += rho * sOut; } }\n#endif'); };
    m.customProgramCacheKey = () => 'legPush' + (first ? 1 : 0); m.needsUpdate = true; }
  // ----- the soft chains (made in 10_geom.js, I30_body.js and I41_hair.js) -----
  // Each point of a chain is pulled toward where it would rest: the way it was built, carried by its body bone (her chest for her hair,
  // her hips for her skirt), leaning toward plain hanging the further down the chain it is. It keeps its speed, so it lags behind her and
  // swings in after. It stays a fixed length from the point above, outside the balls, and above the floor.
  const FLOOR = 0.018, SOFT_H = 1 / 60;
  const SOFT = CHAINS.map((ch) => {
    const n = ch.names.length, hair = ch.grp === 'hair', own = ch.soft || null, pad = own ? own.pad : hair ? 0.012 : 0.030, grp = own ? own.col : hair ? 'h' : 's';       // the skirt's inner layers lie inside its chains, so its balls are padded more
    const o = { ch, hair, yb: SK[ch.yaw || ch.parent], par: SK[ch.parent], b: ch.names.map((nm) => SK[nm]), dir: [], len: [], cur: [], prev: [], g: [], k: [], d: [], cols: [], lift: 0, out: ch.a != null ? V3(Math.sin(ch.a), 0, Math.cos(ch.a)) : null, P: V3(), Q: new THREE.Quaternion(), Y: new THREE.Quaternion() };
    if (ch.grp === 'skirt') { o.caps = []; o.pad = pad; for (let i = 0; i < n; i++) o.caps.push(CAPF.map((f) => { const pt = ch.pts[i].clone().lerp(ch.pts[i + 1], f); return LEGCAP.map((c) => capRest(c, pt)); })); }
    for (let i = 0; i < n; i++) {
      const tip = ch.pts[i + 1], v = tip.clone().sub(ch.pts[i]), t = n > 1 ? i / (n - 1) : 0; o.len.push(v.length()); o.dir.push(v.normalize()); o.cur.push(tip.clone()); o.prev.push(tip.clone());
      if (own) { o.k.push(own.k); o.d.push(own.d); o.g.push(own.g); }
      else if (!hair) { o.k.push(lerp(0.10, 0.05, t)); o.d.push(lerp(0.22, 0.16, t)); o.g.push(lerp(0.05, 0.32, t)); }
      else if (ch.front) { o.k.push(lerp(0.060, 0.026, t)); o.d.push(lerp(0.17, 0.11, t)); o.g.push(lerp(0.30, 0.88, t)); }
      else { o.k.push(lerp(0.060, 0.024, t)); o.d.push(lerp(0.17, 0.11, t)); o.g.push(lerp(0.10, 0.85, t)); }
      const cs = []; COL.forEach((c, ci) => { let hit = false; for (let q = 0; q < grp.length; q++) if (c.g.indexOf(grp[q]) >= 0) hit = true; if (!hit) return; const r = Math.min(c.r + pad, tip.distanceTo(c.rest) - 0.003); if (r > 0.014) cs.push(ci, r); }); o.cols.push(cs);       // a ball never pushes a point out of its place at rest
    }
    return o;
  });
  const fitLen = (p, c, L) => { p.sub(c); p.multiplyScalar(L / (p.length() || 1e-6)).add(c); };
  function softFrames() {
    for (const c of COL) c.p.copy(c.off).applyMatrix4(c.bone.matrixWorld).applyMatrix4(_inv);
    for (const c of LEGCAP) { c.A.copy(c.offA).applyMatrix4(c.bone.matrixWorld).applyMatrix4(_inv); c.B.copy(c.offB).applyMatrix4(c.bone.matrixWorld).applyMatrix4(_inv); }
    for (const sp of LEGS) sp.p.copy(sp.c.A).lerp(sp.c.B, sp.t); HIP.setFromMatrixPosition(SK.hips.matrixWorld).applyMatrix4(_inv);
    for (const o of SOFT) { _mb.multiplyMatrices(_inv, o.par.matrixWorld); o.Q.setFromRotationMatrix(_mb); o.P.copy(o.b[0].position).applyMatrix4(_mb); if (o.yb === o.par) _p.set(0, 0, 1).applyQuaternion(o.Q); else _p.set(0, 0, 1).applyQuaternion(rootQuat(o.yb, _qa)); o.Y.setFromAxisAngle(AY, Math.atan2(_p.x, _p.z)); }
  }
  function softTarget(o, i, c, out) {                 // where point i of a chain would rest, hanging from c
    const g = o.g[i]; out.copy(o.dir[i]).applyQuaternion(o.Q).multiplyScalar(1 - g); _t2.copy(o.dir[i]).applyQuaternion(o.Y).multiplyScalar(g); out.add(_t2);
    if (o.lift && o.out) { _t2.copy(o.out).applyQuaternion(o.Y).multiplyScalar(o.lift * (0.35 + 0.65 * i / Math.max(1, o.b.length - 1))); out.add(_t2); }
    return out.normalize().multiplyScalar(o.len[i]).add(c);
  }
  // _n, a joint of her skirt hanging from _c, is kept out of her legs: its end and two points along its stretch are tested.
  // The rule (the same one legPush draws with): her skirt goes round her legs, so a point of it may never be where a leg is
  // both further out from her middle AND overhead. Such a point is moved the shorter way: out past the leg, or up onto it.
  // So cloth is pushed forward by a knee when she walks, and lies on her lap when she squats, kneels or sits in the air;
  // it is never pushed under a leg or behind one.
  function legOut(o, i, L) {
    for (let it = 0; it < 4; it++) { let moved = false;
      for (let fi = 0; fi < 3; fi++) { const f = CAPF[fi], rd = o.caps[i][fi]; _s.copy(_c).lerp(_n, f); _e.set(_s.x - HIP.x, 0, _s.z - HIP.z); const rl = _e.length(); if (rl < 1e-4) continue; _e.multiplyScalar(1 / rl);
        let sOut = 0, sUp = 0;
        for (let q = 0; q < LEGS.length; q++) { const sp = LEGS[q], R = Math.min(sp.r + o.pad, rd[sp.ci] - 0.003); if (R <= 0) continue; const vx = _s.x - sp.p.x, vy = _s.y - sp.p.y, vz = _s.z - sp.p.z, cc = vx * vx + vy * vy + vz * vz - R * R;
          const b1 = vx * _e.x + vz * _e.z, q1 = b1 * b1 - cc; if (q1 > 0) sOut = Math.max(sOut, -b1 + Math.sqrt(q1)); const q2 = vy * vy - cc; if (q2 > 0) sUp = Math.max(sUp, -vy + Math.sqrt(q2)); }
        if (sOut > 1e-4 && sUp > 1e-4) { if (sUp < sOut) _n.y += sUp / f; else _n.addScaledVector(_e, sOut / f); fitLen(_n, _c, L); moved = true; } }
      if (!moved) break; }
  }
  function softStep(still) {
    for (const o of SOFT) { _c.copy(o.P);
      for (let i = 0; i < o.b.length; i++) { const cur = o.cur[i], prev = o.prev[i], L = o.len[i];
        softTarget(o, i, _c, _t);
        if (still) _n.copy(_t); else { _n.copy(cur).sub(prev).multiplyScalar(1 - o.d[i]).add(cur); _t.sub(cur).multiplyScalar(o.k[i]); _n.add(_t); }
        fitLen(_n, _c, L);
        const cs = o.cols[i]; let hit = false;
        for (let j = 0; j < cs.length; j += 2) { const c = COL[cs[j]], r = cs[j + 1]; _d.copy(_n).sub(c.p); const dist = _d.length(); if (dist < r) { _n.copy(c.p).addScaledVector(_d, r / (dist || 1e-6)); hit = true; } }
        if (hit) fitLen(_n, _c, L);
        if (o.caps) legOut(o, i, L);
        if (_n.y < FLOOR) { const dy = cl(FLOOR - _c.y, -L, L), R = Math.sqrt(Math.max(0, L * L - dy * dy)); _d.set(_n.x - _c.x, 0, _n.z - _c.z); if (_d.lengthSq() < 1e-10) { if (o.out) _d.copy(o.out).applyQuaternion(o.Y); else _d.set(0, 0, -1); } _d.normalize(); _n.set(_c.x + _d.x * R, _c.y + dy, _c.z + _d.z * R); }       // it lies on the floor
        if (still) prev.copy(_n); else prev.copy(cur); cur.copy(_n); _c.copy(cur);
      } }
  }
  function softApply() {
    for (const o of SOFT) { _c.copy(o.P); _qa.copy(o.Q);
      for (let i = 0; i < o.b.length; i++) { _d.copy(o.cur[i]).sub(_c).normalize(); _qb.copy(_qa).invert(); _d.applyQuaternion(_qb); _qc.setFromUnitVectors(o.dir[i], _d); o.b[i].quaternion.copy(_qc); _qa.multiply(_qc); _c.copy(o.cur[i]); } }
  }
  // ----- the rings of her sleeves (made in I45_robe.js; stage nine) -----
  // Each ring is carried along her arm, round the bend of her elbow. Where her arm is not hanging straight down, the ring slides
  // toward the ground until its top rests on her arm. It follows on a spring, so it sways; it can never slide further than its
  // own slack, so her arm stays inside the cloth.
  const SLF = {}, s1 = V3(), s2 = V3(), s3 = V3(), s4 = V3(), sq = new THREE.Quaternion(), SL_E = 0.06;
  for (const [S, s] of SIDES) SLF[S] = { qU: new THREE.Quaternion(), qF: new THREE.Quaternion(), sh: V3(), el: V3(), wr: V3(), O: V3(s * Math.cos(A_POSE), Math.sin(A_POSE), 0) };
  const SLV = (typeof SLEEVES !== 'undefined' ? SLEEVES : []).map((st) => Object.assign(st, { bone: SK[st.name], C: V3(), Q: new THREE.Quaternion(), u: V3(), tg: V3(), p: SK[st.name].userData.rest.clone(), pp: SK[st.name].userData.rest.clone(), k: 0.11, d: 0.20, sc: 1 }));
  function ringAt(st, dir, tab) { sq.copy(st.Q).invert(); s3.copy(dir).applyQuaternion(sq); const O = SLF[st.S].O; let ph = Math.atan2(s3.z, s3.x * O.x + s3.y * O.y); if (ph < 0) ph += TAU; const f = (ph / TAU) * 16, i = Math.floor(f) % 16; return lerp(tab[i], tab[(i + 1) % 16], f - Math.floor(f)); }
  const slackAt = (st, dir) => ringAt(st, dir, st.slack);
  function sleeveFrames() {
    for (const [S] of SIDES) { const F = SLF[S]; rootQuat(SK['uarm' + S], F.qU); rootQuat(SK['farm' + S], F.qF); F.sh.setFromMatrixPosition(SK['uarm' + S].matrixWorld).applyMatrix4(_inv); F.el.setFromMatrixPosition(SK['farm' + S].matrixWorld).applyMatrix4(_inv); F.wr.setFromMatrixPosition(SK['hand' + S].matrixWorld).applyMatrix4(_inv); }
    for (const st of SLV) { const F = SLF[st.S], sl = st.sl, tau = cl((sl - (L_UARM - SL_E)) / (2 * SL_E), 0, 1);
      if (tau <= 0) st.C.copy(F.sh).lerp(F.el, sl / L_UARM); else if (tau >= 1) st.C.copy(F.el).lerp(F.wr, (sl - L_UARM) / L_FARM);
      else { s1.copy(F.sh).lerp(F.el, 1 - SL_E / L_UARM); s2.copy(F.el).lerp(F.wr, SL_E / L_FARM); st.C.copy(s1).multiplyScalar((1 - tau) * (1 - tau)).addScaledVector(F.el, 2 * tau * (1 - tau)).addScaledVector(s2, tau * tau); }       // round the bend of her elbow
      st.Q.copy(F.qU).slerp(F.qF, tau * tau * (3 - 2 * tau)); st.u.copy(armDir[st.S]).applyQuaternion(st.Q);
      const uy = st.u.y; s1.set(st.u.x * uy, uy * uy - 1, st.u.z * uy); const m = s1.length(); st.tg.set(0, 0, 0);                    // the pull of the ground, across her arm
      if (m > 0.05) { s1.multiplyScalar(1 / m); st.tg.copy(s1).multiplyScalar(slackAt(st, s1) * sm(0.25, 0.60, m)); } }
  }
  function sleeveStep(still) {
    for (const st of SLV) { const F = SLF[st.S];
      if (still) s1.copy(st.tg);
      else { s1.copy(st.p).sub(st.pp).multiplyScalar(1 - st.d).add(st.p); s2.copy(st.C).add(st.tg).sub(st.p).multiplyScalar(st.k); s1.add(s2).sub(st.C); }
      // When her elbow folds, the other half of her arm comes through this ring's place too. The ring slides toward it, and if
      // that is not enough it opens wider, so both halves of her arm are inside the cloth (a sleeve gathering round a bent elbow).
      let want = 1; { const far = st.sl >= L_UARM, A = far ? F.sh : F.el, B = far ? F.el : F.wr, rf = far ? 0.046 : 0.038;
        s2.copy(A).sub(st.C).sub(s1); const dA = s2.dot(st.u); s4.copy(B).sub(st.C).sub(s1); const dB = s4.dot(st.u);
        if (dA * dB < 0) { s2.lerp(s4, dA / (dA - dB)); s2.addScaledVector(st.u, -s2.dot(st.u)); const wl = s2.length(); if (wl > 0.004) { s2.multiplyScalar(1 / wl); const have = ringAt(st, s2, st.rad), short = wl + rf - have; if (short > 0) { s1.addScaledVector(s2, short); want = 0; } } } }
      s1.addScaledVector(st.u, -s1.dot(st.u)); const len = s1.length(); if (len > 1e-5) { s2.copy(s1).multiplyScalar(1 / len); const lim = slackAt(st, s2); if (len > lim) s1.multiplyScalar(lim / len); }
      if (!want) { const far = st.sl >= L_UARM, A = far ? F.sh : F.el, B = far ? F.el : F.wr, rf = far ? 0.046 : 0.038; s2.copy(A).sub(st.C).sub(s1); const dA = s2.dot(st.u); s4.copy(B).sub(st.C).sub(s1); const dB = s4.dot(st.u); want = 1;
        if (dA * dB < 0) { s2.lerp(s4, dA / (dA - dB)); s2.addScaledVector(st.u, -s2.dot(st.u)); const wl = s2.length(); if (wl > 0.004) { s2.multiplyScalar(1 / wl); want = cl((wl + rf) / ringAt(st, s2, st.rad), 1, 1.45); } } }
      st.sc = still ? want : st.sc + (want - st.sc) * 0.25;
      st.pp.copy(still ? s2.copy(st.C).add(s1) : st.p); st.p.copy(st.C).add(s1); }
  }
  function sleeveApply() {
    for (const st of SLV) { const par = SK[st.par]; rootQuat(par, sq).invert(); s1.setFromMatrixPosition(par.matrixWorld).applyMatrix4(_inv); st.bone.position.copy(s2.copy(st.p).sub(s1).applyQuaternion(sq)); st.bone.quaternion.copy(sq).multiply(st.Q); st.bone.scale.setScalar(st.sc); }
    if (SLV.length) sync();       // the long points hang from the cuff rings
  }
  let softAcc = 0;
  function softTick(dt) { softAcc += dt; let n = 0; while (softAcc >= SOFT_H && n < 4) { softAcc -= SOFT_H; n++; } if (softAcc > SOFT_H) softAcc = 0;
    sleeveFrames(); for (let i = 0; i < n; i++) sleeveStep(false); sleeveApply(); softFrames(); for (let i = 0; i < n; i++) softStep(false); softApply(); }
  function softSettle() { sleeveFrames(); sleeveStep(true); sleeveApply(); softFrames(); for (let i = 0; i < 24; i++) softStep(true); softApply(); }       // everything comes to rest at once in the pose she is in

  // ----- reaching: two bones in a row (upper arm and forearm, or thigh and shin) bring their end to a point of her own space -----
  // bend -1: an elbow (the forearm folds forward of the upper arm); +1: a knee (the shin folds back). swivel turns the elbow or knee about
  // the line from the joint to the point. w blends from the pose the move already gave (0) to the reach (1).
  function ik2(up, lo, end, P, w, swivel, bend) {
    if (w <= 0.0005) return;
    _mb.copy(up.parent.matrixWorld).invert(); _t.copy(P).applyMatrix4(root.matrixWorld).applyMatrix4(_mb).sub(up.position);
    const a = lo.position.length(), b = end.position.length(); let L = _t.length(); L = cl(L, Math.abs(a - b) + 0.004, a + b - 0.0012); _t.normalize();
    const A = Math.acos(cl((a * a + L * L - b * b) / (2 * a * L), -1, 1)), C = Math.acos(cl((a * a + b * b - L * L) / (2 * a * b), -1, 1));
    _qa.setFromUnitVectors(_e.copy(lo.position).normalize(), _t); _qb.setFromAxisAngle(AX, -bend * A); _qc.setFromAxisAngle(_t, swivel || 0);
    _qc.multiply(_qa).multiply(_qb); up.quaternion.slerp(_qc, w);
    lo.rotation.set(lerp(lo.rotation.x, bend * (PI - C), w), lo.rotation.y * (1 - w), lo.rotation.z * (1 - w));
  }
  const reach = (S, P, w, swivel) => ik2(SK['uarm' + S], SK['farm' + S], SK['hand' + S], P, w, swivel, -1);
  const HAND0 = {}; for (const [S, s] of SIDES) { const d0 = armDir[S], p0 = V3(-s * Math.cos(A_POSE), -Math.sin(A_POSE), 0); HAND0[S] = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(d0, p0, V3().crossVectors(d0, p0))).invert(); }
  // turn a hand so its fingers point along f and its palm faces n (both in her own space)
  function aimHand(S, f, n, w) {
    if (w <= 0.0005) return;
    _t.copy(f).normalize(); _n.copy(n).addScaledVector(_t, -_t.dot(n)).normalize(); _d.crossVectors(_t, _n);
    _qc.setFromRotationMatrix(_mb.makeBasis(_t, _n, _d)).multiply(HAND0[S]);
    rootQuat(SK['clav' + S], _qa); _qa.multiply(SK['uarm' + S].quaternion).multiply(SK['farm' + S].quaternion).invert();
    SK['hand' + S].quaternion.slerp(_qa.multiply(_qc), w);
  }
  // A wrist only bends so far, and it does not twist: the turn of a hand is made along the forearm. So whatever a move asked of a hand,
  // its turn about the arm's own line is taken out, most of it is given to the forearm (ftw), and the bend that is left is held to WRIST_MAX.
  const WRIST_MAX = 0.62, QI = new THREE.Quaternion();
  function wristFix(S) {
    const h = SK['hand' + S].quaternion, a = armDir[S]; if (h.w < 0) h.set(-h.x, -h.y, -h.z, -h.w);
    const dp = h.x * a.x + h.y * a.y + h.z * a.z; _qa.set(a.x * dp, a.y * dp, a.z * dp, h.w); if (_qa.lengthSq() < 1e-8) _qa.set(0, 0, 0, 1); _qa.normalize();       // the turn about her arm's line
    _qb.copy(_qa).invert(); _qc.copy(h).multiply(_qb);                                                                  // what is left: the bend of the wrist
    const ang = 2 * Math.acos(Math.min(1, Math.abs(_qc.w))); if (ang > WRIST_MAX) _qc.copy(QI.set(0, 0, 0, 1).slerp(_qc, WRIST_MAX / ang));
    h.copy(_qc).multiply(_qa); SK['ftw' + S].quaternion.set(0, 0, 0, 1).slerp(_qa, 0.8);
  }
  // after a leg has reached, set its foot level on the ground (pitch: + heel up), toes the way she started out facing
  function flatFoot(S, pitch, w) {
    if (w <= 0.0005) return;
    rootQuat(SK.hips, _qa); _qa.multiply(SK['thigh' + S].quaternion).multiply(SK['shin' + S].quaternion).invert(); _qb.setFromAxisAngle(AX, pitch || 0);
    SK['foot' + S].quaternion.slerp(_qa.multiply(_qb), w);
  }
  // fingers: curl 0 open .. 1.4 a fist; idx sets the index finger apart (for pointing)
  function fingers(S, curl, idx) {
    const s = S === 'L' ? 1 : -1;
    for (const fn of ['idx', 'mid', 'rng', 'pnk']) { const c = fn === 'idx' && idx != null ? idx : curl * (fn === 'pnk' ? 1.1 : 1); for (let k = 0; k < 3; k++) SK[fn + k + S].rotation.z = -s * c * [0.85, 1.1, 0.7][k]; }
    SK['thb1' + S].rotation.z = -s * curl * 0.25; SK['thb2' + S].rotation.z = -s * curl * 0.35;
  }

  let lastPose = { arm: 15, leg: 0 }, mv = { name: 'pose', t: 0 }, wk = 0, gph = 0, spinWas = 0;
  let clock = 0, blinkAt = 1.6, blinkT = -1, mouthAt = 0, mouthNow = 'rest', facePainted = '', talking = false, held = null, blinking = true;
  const SHOTS = { glasses: 2.4, hat: 2.6, curtsey: 3.0, twirl: 2.6, herb: 5.0, wave: 3.0, look: 3.6, sickle: 3.4, crescent: 4.7, salve: 7.2, guardian: 14.6, garden: 12.4, thorn: 7.6, revive: 9.8, cradle: 6.4, hit: 1.6, down: 5.6, win: 3.8 }, MOVES = ['pose', 'idle', 'walk', 'jog', 'squat', 'kneel', 'hover', 'talk', 'read', 'glasses', 'hat', 'curtsey', 'twirl', 'herb', 'wave', 'look', 'sickle', 'crescent', 'salve', 'guardian', 'garden', 'thorn', 'revive', 'cradle', 'hit', 'down', 'win'], SPELLS = ['crescent', 'salve', 'guardian', 'garden', 'thorn', 'revive', 'cradle'];
  let jg = 0, hSq = 0, hKn = 0, hHv = 0;
  // Her emotions (C10; stage ten). feel: the one she is asked to hold (the page's Feelings buttons, setFeel); FW: how far she is into each,
  // for the small turn of her head and shoulders that goes with it. A move can also ask for one for a moment (her reading face when she reads).
  const FEELS = ['reading', 'casting', 'surprised', 'hit', 'stern', 'delighted'], FW = {}; for (const n of FEELS) FW[n] = 0; let feel = null;       // the moves all four witches share (Chris, November 13: "squat ... kneel ... hover, and jog"); each slides in and out
  // Her book (G8, and the rule in her prompts: it is in her LEFT hand; when she lets go of it, it floats open at her left side).
  // bkR: 1 open on her left palm to read (see readHands). bkF is no longer used: she does not carry it.
  const BK_FLOAT = {},       // Chris, November 13: "her book should like appear when she does the read her book animation. I don't think she should just be holding it"
     bkP = V3(), bkQ = new THREE.Quaternion(), bkP2 = V3(), bkQ2 = new THREE.Quaternion(), EU = new THREE.Euler(); let bkF = 0, bkR = 0, bkS = 0, showProps = true;
  // SPB: where her left hand holds the open book for a spell (the paintings H3 to H6 show it in her left hand); FXWANT: what the spell being cast needs standing in front of her
  const SPB = { P: V3(0.10, 1.03, 0.22), f: V3(-0.42, 0.30, 0.86), n: V3(-0.06, 0.90, -0.43), want: false }, FXWANT = { dummy: false, ally: false, ally2: false }; let afterHands = null, sickNow = false;
  // FLB: her book floating open at her left side (H11: "her spellbook floats open in the air at her left side at waist height, its pages lifting"); FXVIEW: the way to the camera, which the page keeps up to date, so thin threads of light can face it
  const FLB = { want: false, P: V3(0.57, 1.00, 0.05), lift: 0 }, FXVIEW = V3(0, 0.2, 1); let bkFl = 0;
  function bookFloat(k, T) { const sc = Math.max(0.001, sm(0.05, 0.9, k)); EU.set(-0.86 + 0.05 * Math.sin(T * 1.1), -0.32 + 0.06 * Math.sin(T * 0.8), 0.05 * Math.sin(T * 1.3), 'YXZ'); bkQ.setFromEuler(EU); bkP.set(FLB.P.x, FLB.P.y + 0.012 * Math.sin(T * 1.7) - 0.07 * (1 - sc), FLB.P.z); SK.book.position.copy(bkP); SK.book.quaternion.copy(bkQ); SK.book.scale.setScalar(sc); }
  const propVis = (on, sick) => { const m = meshes, shut = bkH > 0.03, open = !shut && Math.max(bkR, bkS, bkFl) > 0.03; for (const [k, v] of [['bookShut', on && shut], ['bookShutPg', on && shut], ['bookRibbon', on && shut], ['bookOpen', on && open], ['bookOpenPg', on && open], ['sickleGold', on && sick], ['sickleGrip', on && sick]]) if (m[k]) m[k].visible = !!v && showProps; };
  function bookPlace(dt, N) { const k = Math.min(1, dt * 3.2); bkF = 0; bkR += ((N === 'read' ? 1 : 0) - bkR) * k; bkS += ((SPB.want && N !== 'read' ? 1 : 0) - bkS) * k; bkFl += ((FLB.want ? 1 : 0) - bkFl) * k; bkH += ((HUG.want ? 1 : 0) - bkH) * k; return 0; }
  // Reading (stage nine; Chris, November 13: her pointing finger "is phasing through the book", and "the book's hovering above"
  // the hand that holds it). Her hands used to be sent to places worked out beside a book that was placed from her chest, so
  // neither truly touched it. Now, in order: her left hand goes to its place, palm up; the book is laid ON that palm, wherever the
  // palm really ended up; then her right forefinger is brought to a point on the page, and the place of its tip is measured and
  // corrected until it rests on the paper.
  const rdP = V3(), rdF = V3(), rdN = V3(), rdX = V3(), rdU = V3(), rdT = V3(), rdW = V3(), rdV = V3(), rdQ = new THREE.Quaternion(), rdB = new THREE.Matrix4(), TIP0 = {};
  for (const [S, s] of SIDES) { const [, fz, fy, fl, , fa] = FINGERS[0], fd = fingerDir(fa); TIP0[S] = handPt(s, 0, fy + fd[1] * fl, fz + fd[2] * fl).sub(SK['idx2' + S].userData.rest); }       // the tip of a forefinger, from its last joint
  const pageZ = (x) => { const u = Math.abs(x) / Math.cos(0.17); return u * Math.sin(0.17) + 0.004 + 0.013 * Math.sin(Math.min(1, u / 0.07) * PI / 2) - 0.004 * (u / BOOK.w); };       // how high the paper lies, across the open book
  function handFrame(S) { rootQuat(SK['hand' + S], rdQ).multiply(_qb.copy(HAND0[S]).invert()); rdF.set(1, 0, 0).applyQuaternion(rdQ); rdN.set(0, 1, 0).applyQuaternion(rdQ); rdX.crossVectors(rdF, rdN); rdW.setFromMatrixPosition(SK['hand' + S].matrixWorld).applyMatrix4(_inv); }
  function armTo(S, P, k, swivel, f, n, from) { const e = k * k * (3 - 2 * k); rdV.copy(from).lerp(P, e); rdV.z += 0.09 * Math.sin(PI * e); reach(S, rdV, sm(0, 0.15, k), swivel * e); aimHand(S, f, n, k); wristFix(S); }
  const rdFrom = { L: V3(), R: V3() };
  // The open book on her left palm: her hand goes to P, palm facing n, fingers along f, and the book is laid on that palm wherever
  // the palm really ended up; it grows out of nothing there once her hand is nearly in place.
  function bookOnPalm(k, P, f, n) {
    rdFrom.L.setFromMatrixPosition(SK.handL.matrixWorld).applyMatrix4(_inv); fingers('L', lerp(0.24, 0.12, k)); armTo('L', P, k, 0.3, f, n, rdFrom.L); sync();
    handFrame('L'); const sc = Math.max(0.001, sm(0.45, 0.92, k)); rdU.set(0, 0.35, 1).addScaledVector(rdN, -(0.35 * rdN.y + rdN.z)).normalize(); _d.crossVectors(rdU, rdN);
    bkQ.setFromRotationMatrix(rdB.makeBasis(_d, rdU, rdN)); bkP.copy(rdW).addScaledVector(rdF, 0.058).addScaledVector(rdN, 0.0245).addScaledVector(rdX, -0.008).sub(_e.set(0, -0.050, -0.0045).multiplyScalar(sc).applyQuaternion(bkQ));
    SK.book.position.copy(bkP); SK.book.quaternion.copy(bkQ); SK.book.scale.setScalar(sc);
  }
  // Her right forefinger is brought to tipTo: her hand held level above the page with her other fingers folded up under her palm,
  // the forefinger bent down; the place of its tip is measured and her whole hand moved until it is right.
  function fingerTo(tipTo, k) {
    fingers('R', lerp(0.24, 1.2, k)); for (const fn of ['mid', 'rng', 'pnk']) [0.75, 1.75, 0.90].forEach((a, j) => { SK[fn + j + 'R'].rotation.z = lerp(0.24 * [0.85, 1.1, 0.7][j], a, k); });
    [0.95, 0.20, 0.15].forEach((a, j) => { SK['idx' + j + 'R'].rotation.z = lerp(0.24 * [0.85, 1.1, 0.7][j], a, k); }); sync();
    rootQuat(SK.handR, _qa).invert(); rdT.copy(TIP0.R).applyMatrix4(SK.idx2R.matrixWorld).applyMatrix4(_inv).sub(_e.setFromMatrixPosition(SK.handR.matrixWorld).applyMatrix4(_inv)).applyQuaternion(_qa);       // where her fingertip is from her wrist, in her hand's own frame
    fv.set(-0.50, 0.85, 0.12).applyQuaternion(bkQ).normalize(); nv.set(0, 0, -1).applyQuaternion(bkQ);
    _t.copy(fv); _n.copy(nv).addScaledVector(_t, -_t.dot(nv)).normalize(); _d.crossVectors(_t, _n); _qc.setFromRotationMatrix(rdB.makeBasis(_t, _n, _d)).multiply(HAND0.R);       // the turn her hand is asked for
    rdP.copy(tipTo).sub(_e.copy(rdT).applyQuaternion(_qc)); const want = rdP.clone(), f2 = fv.clone(), n2 = nv.clone();
    if (k < 1) want.addScaledVector(_e.set(0, 0, 1).applyQuaternion(bkQ), 0.08 * (1 - sm(0.72, 1, k)));       // her right hand comes down onto the page from above, after the book is there
    armTo('R', want, k, -0.3, f2, n2, rdFrom.R); sync();
    if (k > 0.98) for (let it = 0; it < 2; it++) { rdV.copy(TIP0.R).applyMatrix4(SK.idx2R.matrixWorld).applyMatrix4(_inv); _e.copy(tipTo).sub(rdV); if (_e.length() < 0.0008) break; want.add(_e); armTo('R', want, 1, -0.3, f2, n2, rdFrom.R); sync(); }       // her wrist only bends so far, so the tip is put right by moving her whole hand
  }
  const tipNow = (out) => out.copy(TIP0.R).applyMatrix4(SK.idx2R.matrixWorld).applyMatrix4(_inv);
  function readHands(N, T) {
    const k = bkR; rdFrom.R.setFromMatrixPosition(SK.handR.matrixWorld).applyMatrix4(_inv);
    // her left hand: palm up and a little toward her face, at the foot of her ribs
    carried('spine3', 0.082, 1.040, 0.215, rdP); bookOnPalm(k, rdP.clone(), fv.set(-0.42, 0.30, 0.86).clone(), nv.set(-0.06, 0.90, -0.43).clone());
    // Where her fingertip goes (Chris, November 13: the reading hand was "kind of jerky moving fast": it jumped back to the top of
    // the page in one frame every 5.2 s, and turned a leaf in under half a second). One slow round now takes 12 s: 8.4 s down the
    // page at about 1.5 cm a second with a slow drift along the lines, then it lifts, goes to the edge, turns the leaf across, and
    // comes back to the top. Every stretch eases in and out, so its speed never jumps.
    const RD = [[0, 0.055, 0.050, 0], [8.4, 0.055, -0.040, 0], [9.5, 0.110, -0.010, 0.026], [10.9, 0.000, 0.004, 0.034], [12.0, 0.055, 0.050, 0]], tc = N === 'read' ? T % 12 : 0;
    let px = RD[0][1], py = RD[0][2], pz = 0; for (let i = 0; i < RD.length - 1; i++) if (tc >= RD[i][0] && tc <= RD[i + 1][0]) { const e = sm(RD[i][0], RD[i + 1][0], tc); px = lerp(RD[i][1], RD[i + 1][1], e); py = lerp(RD[i][2], RD[i + 1][2], e); pz = lerp(RD[i][3], RD[i + 1][3], e); }
    px += 0.014 * Math.sin(tc * TAU / 4.2) * sm(0, 1.2, tc) * (1 - sm(7.2, 8.4, tc));
    fingerTo(bookPt(px, py, pageZ(px) + 0.0075 + pz, V3()), k);
  }
  const bookPt = (x, y, z, out) => out.set(x, y, z).applyQuaternion(bkQ).add(bkP);
  const pulse = (t, a, b, c, d) => sm(a, b, t) * (1 - sm(c, d, t)), ANK = {}; for (const [S] of SIDES) ANK[S] = SK['foot' + S].userData.rest.clone();
  const tgt = V3(), tg2 = V3(), fv = V3(), nv = V3();
  // ----- for her spells (stage eleven) -----
  const cromP = (K, u, out) => { const n = K.length - 1, x = cl(u, 0, 1) * n, i = Math.min(n - 1, Math.floor(x)), t = x - i, p0 = K[Math.max(0, i - 1)], p1 = K[i], p2 = K[i + 1], p3 = K[Math.min(n, i + 2)], t2 = t * t, t3 = t2 * t;       // a smooth path through points
    return out.set(0, 0, 0).addScaledVector(p0, -0.5 * t3 + t2 - 0.5 * t).addScaledVector(p1, 1.5 * t3 - 2.5 * t2 + 1).addScaledVector(p2, -1.5 * t3 + 2 * t2 + 0.5 * t).addScaledVector(p3, 0.5 * t3 - 0.5 * t2); };
  // a hand closed on a handle: h the way the handle points (toward the blade), f the way her knuckles face
  const gripAim = (list, S, h, f, w) => { const hh = h.clone().normalize(), ff = f.clone().addScaledVector(hh, -f.dot(hh)).normalize(); list.push([S, ff, V3().crossVectors(hh, ff), w]); };
  // her sickle's blade, in her right hand at rest: where it leaves the handle, its far edge, and how far the light of a cut reaches
  const SKL = (() => { const wr = restPts.wrR, d0 = armDir.R, p0 = V3(Math.cos(A_POSE), -Math.sin(A_POSE), 0), Pc = wr.clone().addScaledVector(d0, 0.073).addScaledVector(p0, 0.024); return { inner: V3(Pc.x, Pc.y, Pc.z + 0.088), outer: Pc.clone().addScaledVector(d0, 0.105).add(V3(0, 0, 0.176)), far: Pc.clone().addScaledVector(d0, 0.15).add(V3(0, 0, 0.36)), mid: Pc.clone().addScaledVector(d0, 0.088).add(V3(0, 0, 0.13)) }; })();
  const CUT = [V3(-0.40, 1.50, -0.20), V3(-0.52, 1.36, 0.14), V3(-0.26, 1.12, 0.50), V3(0.14, 0.86, 0.52), V3(0.30, 0.60, 0.38)], GRIP = V3(-0.060, 1.135, 0.175), PEND = V3(0, 1.2035, 0.125);
  const sp1 = V3(), sp2 = V3(), sp3 = V3(), sp4 = V3(), sp5 = V3(), spq = new THREE.Quaternion(), spq2 = new THREE.Quaternion(), UP = V3(0, 1, 0);
  const yawOf = (bone) => { rootQuat(bone, spq); sp5.set(0, 0, 1).applyQuaternion(spq); return Math.atan2(sp5.x, sp5.z); };
  // the path the Salve's ribbon takes: out from her hand, down to her friend's feet, then once round them up to their shoulders (H6)
  const SALVE_A = V3();
  // Elderwood Guardian: S0 where the seed is planted, F0 where the fawn lies, ST where the Guardian stands (at her right side, facing the foe), DUM where the foe stands for it, hit: the second it strikes
  // (she is seen from her right and a little in front, so the Guardian stands behind her right shoulder, turned toward the foe: on screen it is to her left, in side view, as in H9, and it springs past her as in H10)
  const GRD = { S0: V3(-0.52, 0, -0.20), F0: V3(-0.62, 0, -0.42), ST: V3(-0.82, 0, -1.20), DUM: V3(-0.20, 0, 1.80), rel: V3(), hit: 13.02, yaw: 0, h: V3(), end: V3() };
  GRD.h.copy(GRD.DUM).sub(GRD.ST).setY(0).normalize(); GRD.yaw = Math.atan2(GRD.h.x, GRD.h.z); GRD.end.copy(GRD.DUM).addScaledVector(GRD.h, -1.42);
  // Moonflower Garden: each seed's hand, how far it has flown, how far its shoot has risen and its flower opened
  // stage thirteen. HUG: the closed book hugged to her chest in her left arm (H14, H16); DG: her drawn dagger in her right hand; THN: where Thornwake's crack starts; RVV: where the fallen friend lies (beside her on her right, head toward the foe)
  const HUG = { want: false, mode: 'hug' }, THN = { from: V3() }, RVV = { x: -0.60, z0: -0.95 }, DG = { Pc: restPts.wrR.clone().addScaledVector(armDir.R, 0.073).addScaledVector(V3(Math.cos(A_POSE), -Math.sin(A_POSE), 0), 0.024), tip: V3() }; let bkH = 0;
  function bookHug(k) { const sc = Math.max(0.001, sm(0.3, 0.9, k));
    if (HUG.mode === 'hand') { handFrame('L'); bkP.copy(rdW).addScaledVector(rdF, 0.105).addScaledVector(rdN, 0.036); sp4.crossVectors(rdF, rdN).normalize(); bkQ.setFromRotationMatrix(rdB.makeBasis(sp4, rdF, rdN)); }       // held up in her left hand, its back against her palm
    else if (HUG.mode === 'ground') { handFrame('L'); bkP.set(rdW.x + rdF.x * 0.07, 0.024, rdW.z + rdF.z * 0.07); bkQ.setFromEuler(EU.set(-PI / 2, 0.45, 0, 'YXZ')); }       // lying on the ground under her left hand
    else { carried('spine3', 0.086, 1.185, 0.150, bkP); rootQuat(SK.spine3, bkQ).multiply(bkQ2.setFromEuler(EU.set(-0.10, 0.10, -0.20, 'XYZ'))); } SK.book.position.copy(bkP); SK.book.quaternion.copy(bkQ); SK.book.scale.setScalar(sc); }
  const hugArm = (reaches, aims, w) => { reaches.push(['L', () => carried('spine3', 0.190, 1.085, 0.215, V3()), w, 0.55]); aims.push(['L', V3(-0.55, 0.80, 0.10), V3(-0.15, 0.05, -1), w]); fingers('L', lerp(0.24, 0.30, w)); };
  // her dagger is laid in her closed right hand, wherever the hand is; returns the way its grip points (the blade runs the other way)
  function daggerInHand(scale) { const c = carried('handR', DG.Pc.x, DG.Pc.y, DG.Pc.z, V3()), ax = carried('handR', DG.Pc.x + 1, DG.Pc.y, DG.Pc.z, V3()).sub(c).normalize(), az = carried('handR', DG.Pc.x, DG.Pc.y, DG.Pc.z + 1, V3()).sub(c).normalize(), ay = V3().crossVectors(az, ax);
    DAGGER.visible = scale > 0.01; DAGGER.position.copy(c); DAGGER.quaternion.setFromRotationMatrix(rdB.makeBasis(ax, ay, az)); DAGGER.scale.setScalar(Math.max(0.001, scale)); DG.tip.copy(c).addScaledVector(az, -0.298 * scale); return az; }
  const GDN = { from: [], fly: [], shoot: [], open: [] }; for (let i = 0; i < GARDEN.NF; i++) { GDN.from.push(V3()); GDN.fly.push(-1); GDN.shoot.push(0); GDN.open.push(0); }
  function salvePath(u, out) { const AX = ALLY.position.x, AZ = ALLY.position.z, th0 = -PI / 2 - 0.55;
    if (u < 0.36) { const t = u / 0.36, a = (1 - t) * (1 - t), b = 2 * t * (1 - t), c = t * t; sp4.set(AX + 0.30 * Math.cos(th0), 0.12, AZ + 0.30 * Math.sin(th0)); return out.set(0, 0, 0).addScaledVector(SALVE_A, a).addScaledVector(sp5.copy(SALVE_A).add(sp3.set(0.16, 0.20, 0.50)), b).addScaledVector(sp4, c); }
    const v = (u - 0.36) / 0.64, th = th0 + TAU * 1.22 * v, r = lerp(0.30, 0.215, v); return out.set(AX + r * Math.cos(th), lerp(0.12, 1.44, Math.pow(v, 0.9)), AZ + r * Math.sin(th)); }

  function pose(o) {
    o = o || {}; mv = { name: 'pose', t: 0 }; wk = 0; lastPose = { arm: o.arm == null ? 15 : o.arm, leg: o.leg || 0 }; const arm = lastPose.arm * DEG - A_POSE, leg = lastPose.leg * DEG;
    restAll(); for (const [S, s] of SIDES) { SK['uarm' + S].rotation.z = s * arm; SK['thigh' + S].rotation.z = s * leg; SK['foot' + S].rotation.z = -s * leg; }
    for (const o2 of SOFT) o2.lift = 0; sync(); softSettle(); root.updateMatrixWorld(true); bkF = 0; bkR = 0; bkS = 0; bkFl = 0; bkH = 0; hatK = 0; hatApply(0); propVis(false, false);       // held still she carries nothing, as in the paintings she is checked against
  }
  function play(name) { if (!MOVES.includes(name) || name === 'pose') { pose(lastPose); return 'pose'; } if (SPELLS.includes(name)) fxClear(); mv = { name, t: 0 }; return name; }
  // one frame of a move: returns her face { eyes, mouth }
  function body(N, T, dt) {
    restAll(); for (const o of SOFT) o.lift = 0;
    afterHands = null; sickNow = false; SPB.want = false; FLB.want = false; FLB.lift = 0; HUG.want = false; HUG.mode = 'hug'; hatK = 0; FXWANT.dummy = false; FXWANT.ally = false; FXWANT.ally2 = false;
    let eyes = 0, mouth = 'rest', emo = null, plant = 1; const footP = { R: 0, L: 0 }, ank = { R: tgt.clone().copy(ANK.R), L: tgt.clone().copy(ANK.L) };
    wk += ((N === 'walk' || N === 'jog' ? 1 : 0) - wk) * Math.min(1, dt * 4.5); jg += ((N === 'jog' ? 1 : 0) - jg) * Math.min(1, dt * 4.5); const go = wk, still = 1 - go;
    hSq += ((N === 'squat' ? 1 : 0) - hSq) * Math.min(1, dt * 3.2); hKn += ((N === 'kneel' ? 1 : 0) - hKn) * Math.min(1, dt * 2.8); hHv += ((N === 'hover' ? 1 : 0) - hHv) * Math.min(1, dt * 2.2);
    // always: arms hanging easy, fingers a little curled, her breath, and a slow shift of her weight when she stands
    const br = Math.sin(clock * 1.5), sway = Math.sin(clock * 0.62), sw2 = Math.sin(clock * 0.41 + 1.3);
    for (const [S, s] of SIDES) { add('uarm' + S, 0, 0, s * (13 * DEG - A_POSE)); add('farm' + S, -0.10, 0, 0); fingers(S, 0.24); add('clav' + S, 0, 0, s * 0.012 * br); }
    add('spine2', 0.010 * br, 0, 0); add('spine3', 0.009 * br, 0, 0);
    SK.hips.position.x += 0.009 * sway * still; add('hips', 0, 0, 0.014 * sway * still); add('spine1', 0, 0, -0.012 * sway * still); add('head', 0.012 * sw2 * still, 0.03 * sw2 * still, 0.014 * sway * still);
    // a feeling she holds: small, as all her gestures are. Surprise and a hit come quickly; the others ease in.
    { for (const n of FEELS) FW[n] += ((feel === n ? 1 : 0) - FW[n]) * Math.min(1, dt * (n === 'surprised' || n === 'hit' ? 10 : 4));
      const a = FW.reading, b = FW.casting, c = FW.surprised, d = FW.hit, e = FW.stern, f = FW.delighted;
      if (a + b + c + d + e + f > 0.002) {
        add('head', 0.15 * a + 0.05 * b - 0.07 * c + 0.11 * d - 0.025 * e + 0.02 * f, 0.20 * d, 0.05 * a + 0.07 * d + 0.09 * f); add('neck', 0.06 * a + 0.03 * b - 0.03 * c + 0.05 * d, 0.08 * d, 0.03 * f);
        add('spine3', 0.02 * b - 0.035 * c + 0.05 * d - 0.02 * e, 0.04 * d, 0); add('spine2', -0.02 * c + 0.04 * d - 0.015 * e, 0, 0);
        for (const [S, s] of SIDES) { add('clav' + S, 0, 0, s * (0.07 * c + 0.09 * d + 0.03 * f - 0.02 * a)); add('farm' + S, -(0.10 * c + 0.16 * d), 0, 0); }
        SK.hips.position.y += 0.005 * Math.sin(clock * 7) * f; SK.hips.position.z -= 0.012 * d; } }
    // walking: an unhurried step; her hips turn a little, her arms swing small
    if (go > 0.001) { gph += dt * TAU / lerp(1.12, 0.72, jg); const A = lerp(0.30, 0.50, jg), sn = Math.sin(gph), cs = Math.cos(gph); plant *= still;       // jog: the same step made quick and light, elbows bent
      for (const [S, s] of SIDES) { const p = gph + (s < 0 ? 0 : PI), si = Math.sin(p), co = Math.cos(p), sw = Math.max(0, co), st = Math.max(0, -co);
        const th = -(A * si + lerp(0.04, 0.13, jg)) * go, kn = (lerp(0.95, 1.55, jg) * Math.pow(sw, 1.3) + 0.18 * Math.pow(Math.max(0, Math.sin(p - 0.5)), 3) * st + lerp(0.04, 0.18, jg)) * go;
        // Her feet (Chris, November 13: her ankles were "not bending the right way at the back of her step"; the Ranger's had the same fault).
        // On the ground her sole lies flat until the leg is too far back for an ankle, then her heel lifts. In the air the foot hangs
        // loose, toes down, and comes up to land on the heel. The ankle is held to 0.26 up and 0.30 down. Her boots are stiff: no toe fold.
        const u = (((p / TAU) % 1) + 1) % 1, onG = sm(0.22, 0.28, u) * (1 - sm(0.72, 0.78, u)), sp = ((((u - 0.75) % 1) + 1) % 1) / 0.5;
        const kn2 = kn + 0.30 * Math.exp(-Math.pow((u - 0.76) / 0.07, 2)) * go;       // her knee is already giving as the foot leaves the ground
        add('thigh' + S, th, 0, 0); add('shin' + S, kn2, 0, 0); add('foot' + S, lerp(lerp(0.24, -0.14, sm(0.55, 1.0, sp)) * go, cl(-(th + kn2), -0.26, 0.30), onG), 0, 0);
        add('uarm' + S, lerp(0.24, 0.58, jg) * si * go, 0, 0); add('farm' + S, -(lerp(0.16, 1.30, jg) + 0.14 * Math.max(0, -si)) * go, 0, 0); }
      SK.hips.position.y += -0.035 * sn * sn * go; SK.hips.position.x += 0.011 * cs * go;
      SK.hips.position.y += 0.022 * jg * go; add('hips', lerp(0.015, 0.075, jg) * go, 0.08 * sn * go, 0.03 * cs * go); add('spine1', 0.015 * go, -0.04 * sn * go, -0.018 * cs * go); add('spine2', 0, -0.07 * sn * go, -0.016 * cs * go); add('spine3', 0, -0.04 * sn * go, 0);
      add('neck', -0.02 * go, 0.07 * sn * go, 0); }
    // reaches are gathered here and done after her body is in place: [side, point, weight, swivel], and hands to turn: [side, fingers, palm, weight]
    const reaches = [], aims = [];
    if (N === 'talk') { const k = sm(0, 0.5, T), a1 = Math.sin(T * 3.1), a2 = Math.sin(T * 1.7 + 1), a3 = Math.sin(T * 4.7);
      add('head', 0.035 * a1 * k + 0.02 * k, 0.07 * a2 * k, 0.04 * Math.sin(T * 1.1) * k); add('neck', 0, 0.04 * a2 * k, 0); add('spine3', 0, 0.03 * a2 * k, 0);
      reaches.push(['L', V3(0.13 + 0.02 * a2, 1.03 + 0.03 * a1, 0.25 + 0.02 * a3), 0.95 * k, 0.5]); aims.push(['L', V3(-0.25, 0.22 + 0.16 * a1, 0.9), V3(0.15, 1, -0.1), 0.95 * k]);
      if (clock > mouthAt) { mouthAt = clock + 0.10 + 0.09 * Math.abs(Math.sin(clock * 37.7)); const r = Math.abs(Math.sin(clock * 91.3)); mouthNow = r < 0.30 ? 'rest' : r < 0.66 ? 'open' : r < 0.92 ? 'oo' : 'smile'; }
      mouth = mouthNow; }
    const knee = (S) => () => carried('shin' + S, SK['shin' + S].userData.rest.x, IO_KNEE_Y + 0.075, 0.03, V3());
    if (hSq > 0.001) { const q = hSq;       // squat: down on her heels, leaning in, hands on her knees
      SK.hips.position.y -= 0.42 * q; SK.hips.position.z -= 0.05 * q; add('hips', 0.10 * q, 0, 0); add('spine1', 0.26 * q, 0, 0); add('spine2', 0.16 * q, 0, 0); add('neck', -0.14 * q, 0, 0); add('head', -0.16 * q, 0, 0);
      ank.L.x += 0.05 * q; ank.R.x -= 0.05 * q; for (const [S, s] of SIDES) { reaches.push([S, knee(S), q, s * 0.3]); fingers(S, lerp(0.24, 0.55, q)); } }
    if (hKn > 0.001) { const q = hKn;       // kneel: her right knee down, her left foot forward, her left hand on her raised knee
      SK.hips.position.y -= 0.47 * q; SK.hips.position.z += 0.05 * q; add('spine1', 0.05 * q, 0, 0); add('head', 0.04 * q, 0, 0);
      ank.L.set(ank.L.x + 0.01 * q, ank.L.y + 0.05 * Math.sin(PI * q), ank.L.z + 0.36 * q); ank.R.set(ank.R.x - 0.01 * q, ank.R.y - 0.015 * q, ank.R.z - 0.40 * q); footP.R = Math.max(footP.R, 1.25 * q); reaches.push(['L', knee('L'), 0.9 * q, 0.3]); }
    if (hHv > 0.001) { const q = hHv, bob = 0.022 * Math.sin(clock * 1.3);       // hover: she floats cross-legged, hands open on her knees, eyes shut. All four witches can.
      SK.hips.position.y += (0.30 + bob) * q; plant *= 1 - q; add('spine1', -0.03 * q, 0, 0); add('head', 0.07 * q, 0, 0);
      for (const [S, s] of SIDES) {       // knees wide and forward, each shin folded level across her front, the left one over the right
        const D = V3(s * 0.62, s > 0 ? -0.10 : -0.26, s > 0 ? 0.72 : 0.80).normalize(), H = V3(0, -s, 0).addScaledVector(D, s * D.y).normalize(), nD = D.clone().negate();
        _qc.setFromRotationMatrix(_mb.makeBasis(H, nD, V3().crossVectors(H, nD))); SK['thigh' + S].quaternion.slerp(_qc, q); add('shin' + S, (s > 0 ? 2.34 : 2.16) * q, 0, 0); add('foot' + S, 0.40 * q, 0, 0);
        reaches.push([S, knee(S), q, s * 0.2]); aims.push([S, V3(s * 0.45, -0.1, 0.9), V3(0, 1, 0.1), q]); fingers(S, lerp(0.24, 0.40, q)); }
      if (q > 0.6) { eyes = 1; mouth = 'smile'; } }
    if (N === 'read') { const k = sm(0, 0.7, T);       // she reads: her head down to the page, a finger following the lines, and now and then she turns a leaf
      add('head', 0.30 * k, 0.05 * Math.sin(T * 0.7) * k, 0); add('neck', 0.12 * k, 0, 0); add('spine3', 0.04 * k, 0, 0); if (k > 0.6) emo = 'reading'; }       // her reading face (C10): eyes lowered to the page, a small smile
    if (N === 'sickle') { const k = pulse(T, 0, 0.6, 2.5, 3.3), up = pulse(T, 0.9, 1.4, 1.9, 2.5);       // she lifts her sickle and turns it to the light (the moon pendant will become it when her spells are built)
      add('head', -0.05 * up, -0.14 * k, 0); add('spine3', 0, -0.05 * k, 0);
      reaches.push(['R', V3(-0.21 - 0.03 * up, 1.14 + 0.14 * up, 0.27), k, -0.3]); aims.push(['R', V3(0.10 * up, 0.25 + 0.45 * up, 1), V3(1, 0.1 * Math.sin(T * 3) * up, 0), k]); fingers('R', lerp(0.24, 1.35, sm(0, 0.25, k))); if (up > 0.35) emo = 'casting'; }
    // ----- Harvest Crescent (H3, H4, I3): her plain attack. Her hand closes on the moon pendant, it unfolds into the gold sickle,
    // and she makes one wide cut that leaves a crescent of gold light; the light flies to the foe. The sickle folds back into the pendant.
    if (N === 'crescent') {
      const arm = pulse(T, 0.15, 0.62, 3.75, 4.3), grip = pulse(T, 0.2, 0.65, 1.02, 1.3), draw = sm(1.05, 1.55, T), cut = sm(1.86, 2.26, T), low = pulse(T, 1.95, 2.28, 2.8, 3.3), back = sm(2.9, 3.5, T), st = pulse(T, 0.95, 1.5, 2.95, 3.65), wind = draw * (1 - cut), sw = cut * (1 - back);
      FXWANT.dummy = T < 4.35; DUMMY.position.set(0, 0, 1.40); SPB.want = T > 0.05 && T < 3.9; sickNow = T > 1.12 && T < 3.48;
      // her stance: left foot forward, feet wide, knees bent; she sinks onto her front knee as the cut comes round
      const dy = -(0.07 * st + 0.21 * low), dz = 0.03 * st + 0.13 * low; SK.hips.position.y += dy; SK.hips.position.z += dz;
      ank.L.x += 0.07 * st; ank.L.z += (0.12 + 0.14 * low) * st; ank.R.x -= 0.10 * st; ank.R.z -= 0.17 * st; footP.R = Math.max(footP.R, 0.6 * low);
      const tw = -0.48 * wind + 0.55 * sw; add('hips', 0, 0.35 * tw, 0); add('spine1', 0.30 * low, 0.25 * tw, 0); add('spine2', 0.16 * low, 0.25 * tw, 0); add('spine3', 0.02 * st, 0.22 * tw, 0);
      add('neck', -0.18 * low + 0.10 * grip, -0.30 * tw, 0); add('head', -0.16 * low + 0.20 * grip, -0.38 * tw, 0);
      // her right hand: to the pendant, up and back behind her shoulder, round in the cut, and back to her chest
      const P = V3(); if (T < 1.86) P.copy(GRIP).lerp(CUT[0], draw * draw * (3 - 2 * draw)); else if (T < 2.9) cromP(CUT, cut, P); else P.copy(CUT[4]).lerp(GRIP, back * back * (3 - 2 * back));
      const fol = 1 - sm(0, 1, grip + (1 - draw) * (T < 1.3 ? 1 : 0)) * (T < 1.3 ? 1 : 0), body = (T < 1.3 ? draw : 1 - back); P.y += dy * 0.85 * body; P.z += dz * 0.85 * body;
      reaches.push(['R', P.clone(), arm, -0.35 + 0.5 * sw]); fingers('R', lerp(0.24, 1.35, sm(0.3, 0.6, T) * (1 - sm(3.6, 4.0, T))));
      if (T < 1.12 || T > 3.4) aims.push(['R', V3(0.55, 0.80, 0.05), V3(0.10, 0.10, -1), arm]);
      else { cromP(CUT, cut + 0.03, sp1).sub(cromP(CUT, cut - 0.03, sp2)); if (cut <= 0 || cut >= 1) sp1.set(0.6, -0.5, 0.6); const e = sm(0, 0.22, cut), q = 1 - sm(0, 1, back);
        carried('uarmR', restPts.shR.x, restPts.shR.y, restPts.shR.z, sp2); sp3.copy(P).sub(sp2).normalize().addScaledVector(UP, 0.18); const h = V3(-0.25, 0.85, -0.45).lerp(sp3, e).lerp(V3(0.1, 1, 0.2), 1 - q), f = V3(-0.55, 0, -0.83).lerp(sp1.normalize(), e).lerp(V3(0.6, 0.1, 0.5), 1 - q); gripAim(aims, 'R', h, f, arm); }
      // her left hand keeps the open book out of the way of the blade
      const by = yawOf(SK.spine3); carried('spine3', 0.19 + 0.07 * (wind + low), 1.02, 0.17 - 0.13 * (wind + low), SPB.P); SPB.f.set(-0.25, 0.25, 0.93).applyAxisAngle(UP, by); SPB.n.set(-0.05, 0.93, -0.36).applyAxisAngle(UP, by);
      if (T < 1.0) emo = 'reading'; else if (T < 2.9) emo = 'casting'; else if (T > 3.3) mouth = 'smile';
      afterHands = () => {
        const hp = carried('handR', SKL.mid.x, SKL.mid.y, SKL.mid.z, sp1);
        if (grip > 0.02) { carried('spine3', PEND.x, PEND.y, PEND.z, sp2); glow(sp2, 0.20 * grip, FXC.gold, 0.9 * grip); glow(sp2, 0.07, FXC.pearl, grip); if (frnd() < 0.5 * grip) emit(sp2.x + frs(0.02), sp2.y + frs(0.02), sp2.z + 0.02, frs(0.10), 0.05 + frnd() * 0.16, 0.05 + frnd() * 0.12, 0.7 + frnd() * 0.5, 0.020, FXC.gold, frnd() < 0.3 ? 1 : 0, 1.5, -0.05); }
        const pop = pulse(T, 1.08, 1.16, 1.2, 1.5) + pulse(T, 3.36, 3.46, 3.5, 3.8); if (pop > 0.01) { glow(hp, 0.55 * pop, FXC.gold, 0.8 * pop); glow(hp, 0.22 * pop, FXC.pearl, pop, 1); }       // the pendant unfolds into the sickle, and the sickle folds back, in a flash of gold
        if (T > 1.14 && T < 2.8) { const wide = sm(1.80, 1.96, T); carried('handR', SKL.inner.x, SKL.inner.y, SKL.inner.z, sp2); sp4.copy(SKL.outer).lerp(SKL.far, wide); carried('handR', sp4.x, sp4.y, sp4.z, sp3); RIB_CUT.push(sp2, sp3, (0.30 + 0.70 * wide) * (1 - sm(2.45, 2.8, T))); }       // the light the blade leaves
        if (T > 2.2 && T < 2.95 && RIB_CUT.pts.length > 4) for (let i = 0; i < 3; i++) { const t = RIB_CUT.pts[Math.floor(frnd() * RIB_CUT.pts.length)], u = frnd(); emit(lerp(t.p.x, t.q.x, u), lerp(t.p.y, t.q.y, u), lerp(t.p.z, t.q.z, u), frs(0.25), 0.1 + frnd() * 0.3, frs(0.25), 0.5 + frnd() * 0.5, 0.030 + frnd() * 0.02, frnd() < 0.7 ? FXC.gold : FXC.pearl, 1, 1.4, 0.5); }       // the crescent breaks up into sparks
        // the crescent of light flies to the foe, and strikes
        const fly = (T - 2.06) / 0.32, DZ = DUMMY.position.z; WAVE.visible = fly > 0 && fly < 1.12;
        if (WAVE.visible) { const e = Math.min(1, fly); WAVE.position.set(0.03 * (1 - e), 1.02 + 0.05 * e, lerp(0.50, DZ - 0.15, e)); WAVE.rotation.set(0, 0, -0.62); WAVE.scale.setScalar(lerp(0.72, 1.15, e)); WAVE.material.uniforms.uK.value = Math.min(1, fly * 6) * (1 - sm(0.92, 1.12, fly)) * 1.25; if (frnd() < 0.8) emit(WAVE.position.x + frs(0.3), WAVE.position.y + frs(0.25), WAVE.position.z - 0.1, frs(0.1), frs(0.1), -0.3, 0.35, 0.025, FXC.gold, 1, 2, 0); }
        const hitT = 2.06 + 0.32; if (T >= hitT && T - dt < hitT) { dummyHit(2.6); for (let i = 0; i < 60; i++) { const a = frnd() * TAU, v = 0.5 + frnd() * 1.6, up = frs(1); emit(frs(0.12), 1.05 + frs(0.2), DZ - 0.17, Math.cos(a) * v * 0.9, up * v * 0.8 + 0.3, -Math.abs(Math.sin(a)) * v * 0.6 + 0.25, 0.45 + frnd() * 0.6, 0.028 + frnd() * 0.03, i % 4 === 0 ? FXC.pearl : FXC.gold, i % 3 === 0 ? 0 : 1, 2.2, 1.4); } }
        const fl = pulse(T, hitT - 0.01, hitT + 0.03, hitT + 0.08, hitT + 0.4); if (fl > 0.01) { sp2.set(0, 1.05, DZ - 0.2); glow(sp2, 1.2 * fl, FXC.gold, 0.55 * fl); glow(sp2, 0.5 * fl, FXC.pearl, fl, 1, 0.4); }
      };
    }
    // ----- Silverleaf Salve (H5, H6, I1): she heals one friend. She lifts a pressed leaf from the page; it turns fresh and silver-green,
    // floats over her palm, and breaks into a ribbon of light and leaves that winds once round her friend.
    if (N === 'salve') {
      const look = pulse(T, 0.3, 0.9, 3.35, 3.9), pick = sm(0.85, 1.5, T), lift = sm(1.7, 2.4, T), open = sm(2.4, 3.0, T), give = sm(3.55, 4.15, T), down = sm(5.9, 6.6, T), fresh = sm(1.55, 2.5, T), lit = sm(2.3, 3.0, T) * (1 - sm(4.0, 4.3, T)), head = cl((T - 4.15) / 1.35, 0, 1);
      FXWANT.ally = T < 6.85; ALLY.position.set(0, 0, 1.30); ALLY.rotation.y = PI; SPB.want = T > 0.05 && T < 6.25; carried('spine3', 0.10, 1.03, 0.22, SPB.P); SPB.f.set(-0.42, 0.30, 0.86); SPB.n.set(-0.06, 0.90, -0.43);
      add('head', 0.26 * look - 0.03 * give, -0.05 * look, 0); add('neck', 0.06 * look, 0, 0); add('spine3', 0.05 * give * (1 - down), 0.10 * give * (1 - down), 0); add('spine2', 0.03 * give * (1 - down), 0, 0);
      if (look > 0.5 && T < 3.4) emo = 'reading'; else if (T > 3.4 && T < 6.6) mouth = 'smile';
      afterHands = () => { if (bkS < 0.02) { LEAF.visible = false; return; }
        const hang = rdFrom.R.setFromMatrixPosition(SK.handR.matrixWorld).applyMatrix4(_inv).clone(), page = bookPt(0.058, -0.012, pageZ(0.058) + 0.002, V3()), bn = V3(0, 0, 1).applyQuaternion(bkQ), bsc = SK.book.scale.x;
        // her right hand: forefinger and thumb to the pressed leaf, lifting it; then her palm opens under it; then her arm goes out to her friend
        const tipTo = page.clone().addScaledVector(bn, 0.006 + 0.10 * lift).add(V3(-0.035 * lift, 0.035 * lift, -0.02 * lift));
        if (open < 1) { fingerTo(tipTo, pick); SK.thb1R.rotation.z = lerp(SK.thb1R.rotation.z, 0.55, pick); SK.thb2R.rotation.z = lerp(SK.thb2R.rotation.z, 0.5, pick); sync(); }
        const tip = tipNow(V3());
        if (open > 0) { const from = SK.handR.getWorldPosition(V3()).applyMatrix4(_inv), k = 1 - down;
          for (const fn of ['idx', 'mid', 'rng', 'pnk']) for (let j = 0; j < 3; j++) SK[fn + j + 'R'].rotation.z = lerp(SK[fn + j + 'R'].rotation.z, (0.10 + 0.10 * give) * [0.85, 1.1, 0.7][j] * (fn === 'idx' ? 0.6 : 1), open); SK.thb1R.rotation.z = lerp(SK.thb1R.rotation.z, 0.05, open); SK.thb2R.rotation.z = lerp(SK.thb2R.rotation.z, 0.05, open);
          const Pp = carried('spine3', -0.215, 1.085, 0.30, V3()).lerp(carried('spine3', -0.15, 1.27, 0.50, V3()), give), f = V3(-0.22, 0.12, 0.95).lerp(V3(0.02, 0.50, 0.86), give).normalize(), n = V3(0.05, 1, 0.10).lerp(V3(0, 0.80, -0.55), give).normalize();
          if (open < 1) armTo('R', Pp, open, -0.25, f, n, from); else armTo('R', Pp, k, -0.25, f, n, hang); sync(); }
        // the leaf: pressed flat on the page, lifted between her finger and thumb, then standing in the air a hand's width over her open palm
        handFrame('R'); const palm = rdW.clone().addScaledVector(rdF, 0.062).addScaledVector(rdN, 0.02), flt = palm.clone().add(V3(0, 0.105 + 0.006 * Math.sin(T * 2.2), 0)).addScaledVector(V3(0, 0.05, 0.16), sm(3.9, 4.25, T));
        const qPage = spq.copy(bkQ).multiply(spq2.setFromAxisAngle(V3(0, 0, 1), 0.5)).clone(), qUp = new THREE.Quaternion().setFromAxisAngle(UP, T * 1.5), lp = page.clone().lerp(tip.clone().addScaledVector(bn, -0.004), sm(1.45, 1.7, T)).lerp(flt, open), lq = qPage.slerp(qUp, sm(1.8, 2.7, T));
        const gone = sm(4.02, 4.28, T); leafSet(lp, lq, fresh, lit, bsc * (1 - gone)); if (T > 4.02) SALVE_A.copy(flt); else SALVE_A.copy(flt);
        if (lit > 0.02) { glow(lp, 0.26 * lit, FXC.gold, 0.55 * lit); glow(sp1.copy(lp).add(V3(0, -0.05, 0)), 0.16 * lit, FXC.pearl, 0.5 * lit); if (frnd() < 0.35 * lit) emit(palm.x + frs(0.03), palm.y + 0.02, palm.z + frs(0.03), frs(0.03), 0.10 + frnd() * 0.12, frs(0.03), 0.9, 0.016, mote(), 0, 0.6, -0.02); }
        // warm light and motes rise from the open pages while the spell is worked
        const pg = sm(2.1, 2.8, T) * (1 - sm(5.6, 6.2, T)); if (pg > 0.02) { const c = bookPt(0, 0, 0.03, sp2); glow(c, 0.34 * pg, FXC.gold, 0.22 * pg); if (frnd() < 0.5 * pg) { const q = bookPt(frs(0.11), frs(0.08), 0.02, sp3); emit(q.x, q.y, q.z, frs(0.02), 0.10 + frnd() * 0.14, frs(0.02), 1.1 + frnd() * 0.6, 0.014 + frnd() * 0.01, mote(), 0, 0.4, -0.03); } }
        // the leaf breaks into a ribbon of motes and small silver leaves
        if (T >= 4.02 && T - dt < 4.02) for (let i = 0; i < 26; i++) emit(flt.x + frs(0.03), flt.y + frs(0.04), flt.z + frs(0.03), frs(0.35), frs(0.35), frs(0.35) + 0.15, 0.5 + frnd() * 0.5, 0.022 + frnd() * 0.02, mote(), i % 3 === 0 ? 2 : i % 3 === 1 ? 1 : 0, 2.2, 0);
        if (T > 4.15 && head < 1) { for (let sub = 0; sub < 2; sub++) { const u = cl(head - (1 - sub) * dt / 1.35 * 0.5, 0, 1), p = salvePath(u, sp1), tg = salvePath(Math.min(1, u + 0.01), sp2).sub(p).normalize(), sd = sp3.crossVectors(tg, UP).normalize(), w = 0.042 + 0.014 * Math.sin(u * 40), up2 = sp4.crossVectors(sd, tg);
            RIB_SALVE.push(sp5.copy(p).addScaledVector(sd, w), V3().copy(p).addScaledVector(sd, -w), 1); RIB_SALVE2.push(sp5.copy(p).addScaledVector(up2, w), V3().copy(p).addScaledVector(up2, -w), 0.8);
            for (let i = 0; i < 2; i++) emit(p.x + frs(0.03), p.y + frs(0.03), p.z + frs(0.03), frs(0.10), 0.04 + frnd() * 0.22 * (u > 0.36 ? 1 : 0.3), frs(0.10), 0.7 + frnd() * 0.8, 0.018 + frnd() * 0.016, mote(), 0, 1.0, -0.04);
            if (frnd() < 0.55) emit(p.x + frs(0.04), p.y + frs(0.04), p.z + frs(0.04), frs(0.16), frs(0.10), frs(0.16), 0.9 + frnd() * 0.7, 0.045 + frnd() * 0.02, FXC.leaf, 2, 0.9, 0.12, frs(3)); if (frnd() < 0.3) emit(p.x, p.y, p.z, frs(0.2), frs(0.2), frs(0.2), 0.5, 0.03, FXC.gold, 1, 1.5, 0); }
          glow(salvePath(head, sp1), 0.20, FXC.pearl, 0.9); glow(sp1, 0.42, FXC.green, 0.35); }
        // where it has wound round them, soft light rises
        const heal = pulse(T, 5.2, 5.6, 6.0, 6.7); if (heal > 0.02) { const AX = ALLY.position.x, AZ = ALLY.position.z; glow(sp1.set(AX, 1.05, AZ), 1.5 * heal, FXC.gold, 0.30 * heal); glow(sp1.set(AX, 1.25, AZ), 0.7 * heal, FXC.pearl, 0.35 * heal);
          for (let i = 0; i < 3; i++) if (frnd() < heal) { const a = frnd() * TAU, r = 0.16 + frnd() * 0.16; emit(AX + r * Math.cos(a), 0.1 + frnd() * 1.4, AZ + r * Math.sin(a), 0, 0.28 + frnd() * 0.3, 0, 0.9 + frnd() * 0.6, 0.016 + frnd() * 0.014, mote(), frnd() < 0.15 ? 1 : 0, 0.3, -0.05); } }
      };
    }
    // ----- Elderwood Guardian (H7 to H10, I4): her one-time summon. She takes a seed from her pouch and holds it up; it glows like a
    // lantern. She lets it sink into the ground at her right side and roots of light spread. A sapling grows under her hand, twists
    // itself into a fawn, and the fawn stands up as a stag of living wood. She sends it at the foe: it leaps, unravelling into vines.
    // In the game these are three clips: the planting (0 to 7.0 s), the arriving (7.0 to 11.6 s) and the charge (11.6 s to the end).
    if (N === 'guardian') {
      const tk = sm(0.15, 0.6, T), up = sm(0.85, 1.75, T), cr = pulse(T, 2.9, 3.9, 4.35, 5.2), dn = sm(2.9, 4.0, T), ov = sm(4.3, 5.2, T), grow = sm(4.9, 7.0, T), tw = sm(7.0, 8.0, T), lowr = sm(7.2, 8.2, T), rise = sm(9.0, 10.8, T),
        away = pulse(T, 9.0, 9.6, 10.3, 11.0), rest = sm(10.3, 11.1, T), pt = sm(11.6, 12.1, T), end = sm(13.4, 14.3, T), arm = tk * (1 - end), S0 = GRD.S0;
      const lookUp = pulse(T, 1.0, 1.7, 2.75, 3.2), lookDn = pulse(T, 3.1, 3.8, 8.9, 9.7), lookSt = pulse(T, 9.3, 10.3, 11.45, 11.95), fwd = pulse(T, 11.7, 12.2, 13.5, 14.2);
      FXWANT.dummy = T < 14.25; DUMMY.position.copy(GRD.DUM); SPB.want = T > 0.05 && T < 13.9; carried('spine3', 0.10, 1.03, 0.22, SPB.P); SPB.f.set(-0.42, 0.30, 0.86); SPB.n.set(-0.06, 0.90, -0.43);
      // her body: she looks up at the seed; bends her knees and leans to her right to plant it; watches it grow; turns to the Guardian; then faces the foe
      SK.hips.position.y -= 0.40 * cr; SK.hips.position.x -= 0.07 * cr; SK.hips.position.z -= 0.05 * cr; ank.R.x -= 0.07 * cr; ank.R.z -= 0.05 * cr; ank.L.x += 0.04 * cr; ank.L.z += 0.06 * cr;
      add('hips', 0.10 * cr, -0.10 * cr - 0.06 * lookSt, 0); add('spine1', 0.24 * cr, -0.20 * cr - 0.06 * lookDn - 0.12 * lookSt, 0.16 * cr); add('spine2', 0.16 * cr, -0.20 * cr - 0.08 * lookDn - 0.14 * lookSt, 0.12 * cr); add('spine3', 0.05 * cr, -0.12 * cr - 0.06 * lookDn - 0.18 * lookSt + 0.06 * fwd, 0.05 * cr);
      add('neck', -0.10 * lookUp + 0.08 * lookDn - 0.10 * cr, -0.14 * lookUp - 0.26 * lookDn - 0.30 * lookSt, 0); add('head', -0.20 * lookUp + 0.17 * lookDn - 0.12 * cr - 0.05 * lookSt, -0.20 * lookUp - 0.36 * lookDn - 0.40 * lookSt, 0);
      // her right hand: to her pouch, high with the seed, down to the ground, palm down over the sapling, onto the Guardian's neck, then swept out at the foe
      const hP = () => { const P = carried('hips', -0.150, 0.925, 0.120, V3()); P.lerp(carried('spine3', -0.50, 1.74, 0.24, sp1), up); P.lerp(sp1.set(S0.x + 0.02, 0.43, S0.z + 0.02), dn);
        P.lerp(sp1.set(S0.x + 0.08, 0.78 + 0.50 * Math.pow(grow, 0.85) - 0.36 * lowr, S0.z + 0.05), ov); P.lerp(carried('spine3', -0.36, 1.20, 0.14, sp1), away);
        P.lerp(STAG.pt(STAG.cheek, sp1).add(sp2.set(0.075, -0.045, 0.02)), rest); P.lerp(carried('spine3', -0.22, 1.36, 0.54, sp1), pt); return P; };
      reaches.push(['R', hP, arm, -0.3 - 0.25 * up * (1 - dn)]);
      aims.push(['R', V3(-0.45, 0.80, 0.30), V3(0.55, 0.45, 0.45), arm * up * (1 - dn)]); aims.push(['R', V3(-0.12, -0.92, 0.22), V3(0.55, -0.15, -0.80), arm * dn * (1 - ov)]); aims.push(['R', V3(-0.85, -0.10, 0.45), V3(0, -1, 0), arm * ov * (1 - away) * (1 - rest)]);
      aims.push(['R', V3(-0.80, 0.52, -0.30), V3(-0.25, -0.20, -0.95), arm * rest * (1 - pt)]); aims.push(['R', V3(0.05, 0.02, 1), V3(0.25, -0.95, 0), arm * pt]);
      fingers('R', lerp(0.24, 0.24 + 0.40 * tk * (1 - sm(3.95, 4.4, T)) - 0.10 * ov + 0.06 * rest - 0.14 * pt, arm));
      if (T > 1.0 && T < 2.9) mouth = 'smile'; else if (T >= 2.9 && T < 9.2) emo = 'reading'; else if (T >= 9.2 && T < 11.65) emo = 'delighted'; else if (T >= 11.65 && T < 13.35) emo = 'stern'; else if (T >= 13.35) mouth = 'smile';
      afterHands = () => {
        handFrame('R'); const palm = rdW.clone().addScaledVector(rdF, 0.072).addScaledVector(rdN, 0.034), tips = rdW.clone().addScaledVector(rdF, 0.118).addScaledVector(rdN, 0.030);
        // the seed: in her hand, then sinking into the ground
        const held = palm.lerp(tips, sm(2.9, 3.6, T)); if (T < 4.0) GRD.rel.copy(held); const sink = sm(4.0, 4.8, T), sd = sp1.copy(GRD.rel).lerp(sp2.set(S0.x, -0.03, S0.z), sink), show = sm(0.62, 0.80, T) * (1 - sm(0.6, 1, sink)), lit = 0.22 + 0.78 * sm(1.4, 2.3, T);
        SEED.visible = show > 0.01; if (SEED.visible) { SEED.position.copy(sd); SEED.rotation.set(0.10 * Math.sin(T * 1.3), T * 0.5, 0.10 * Math.cos(T * 1.1)); SEED.scale.setScalar(show); seedMat.emissiveIntensity = 0.9 * lit; SHOOT.scale.setScalar(Math.max(0.001, sm(1.9, 2.7, T)));
          glow(sd, 0.30 * lit * show, FXC.gold, 0.55 * lit * show); glow(sd, 0.11 * show, FXC.pearl, 0.55 * lit * show); if (lit > 0.5 && frnd() < 0.30) emit(sd.x + frs(0.03), sd.y + frs(0.03), sd.z + frs(0.03), frs(0.04), 0.03 + frnd() * 0.10, frs(0.04), 0.8 + frnd() * 0.5, 0.013 + frnd() * 0.008, mote(), 0, 0.6, -0.02); }
        if (T >= 0.66 && T - dt < 0.66) for (let i = 0; i < 8; i++) emit(sd.x, sd.y, sd.z, frs(0.2), frs(0.2), frs(0.2), 0.4, 0.02, FXC.gold, 1, 2, 0);
        // roots of light over the ground, and the sapling drawn up under her hand
        ROOTS.position.set(S0.x, 0, S0.z); ROOTS.userData.set(sm(4.45, 5.6, T), 1 - sm(6.3, 7.5, T)); const gl = pulse(T, 4.3, 4.9, 6.9, 7.6); if (gl > 0.02) glow(sp2.set(S0.x, 0.04, S0.z), 0.55 * gl, FXC.gold, 0.35 * gl);
        sapSet(S0, grow, tw); if (grow > 0.02 && tw < 0.9) { const h = Math.pow(grow, 0.85) * (1 - 0.7 * tw); glow(sp2.set(S0.x + 0.02, 0.58 * h, S0.z), 0.34 * sm(0.45, 1, grow), FXC.green, 0.40 * sm(0.45, 1, grow) * (1 - tw)); glow(sp2, 0.12, FXC.pearl, 0.45 * sm(0.45, 1, grow) * (1 - tw));
          if (frnd() < 0.55 * (grow < 1 ? 1 : 0.4)) { const a = frnd() * TAU, r = 0.05 + frnd() * 0.10; emit(S0.x + r * Math.cos(a), frnd() * h, S0.z + r * Math.sin(a), 0, 0.12 + frnd() * 0.2, 0, 0.9 + frnd() * 0.6, 0.014 + frnd() * 0.010, mote(), 0, 0.4, -0.04); } }
        // it twists itself into a fawn, lying down, which lifts its head to her hand; the fawn stands up as the Guardian
        const fl = pulse(T, 7.25, 7.7, 7.9, 8.5); if (fl > 0.01) { glow(sp2.set(S0.x, 0.30, S0.z), 1.0 * fl, FXC.gold, 0.50 * fl); glow(sp2, 0.45 * fl, FXC.pearl, 0.8 * fl, 1, T); }
        if (T >= 7.55 && T - dt < 7.55) for (let i = 0; i < 44; i++) { const a = frnd() * TAU, v = 0.2 + frnd() * 0.7; emit(S0.x + frs(0.08), 0.10 + frnd() * 0.5, S0.z + frs(0.08), Math.cos(a) * v, 0.1 + frnd() * 0.7, Math.sin(a) * v, 0.6 + frnd() * 0.7, 0.020 + frnd() * 0.02, i % 4 === 0 ? FXC.leaf : mote(), i % 4 === 0 ? 2 : i % 3 === 0 ? 1 : 0, 1.8, 0.3, frs(4)); }
        const here = T >= 7.45 && T < GRD.hit; STAG.G.visible = here;
        if (here) { const riseP = sm(9.0, 10.5, T), ap = sm(7.45, 8.2, T), lift = sm(8.05, 8.9, T), gat = sm(11.72, 12.22, T), u = cl((T - 12.3) / (GRD.hit - 12.3), 0, 1), sc = lerp(lerp(0.20, 0.55, ap), 1, rise), brth = 0.006 * Math.sin(T * 2.1);
          if (T < 12.3) { if (gat > 0) STAG.pose('stand', 'gather', gat, { by: brth }); else STAG.pose('lie', 'stand', riseP, { nk: lerp(0.62, -0.26, lift) * (1 - riseP) + 0.26 * lookSt, hd: lerp(0.25, -0.30, lift) * (1 - riseP) - 0.06 * lookSt, hy: 0.42 * lookSt, ny: 0.22 * lift * (1 - riseP) + 0.20 * lookSt, by: brth * riseP, fd: 0.04 * Math.sin(PI * riseP) }); }
          else { const a = sm(0, 0.24, u), b = sm(0.66, 1, u); if (b > 0) STAG.pose('leap', 'land', b, { bp: -0.20 * Math.cos(PI * u) }); else STAG.pose('gather', 'leap', a, { bp: -0.20 * Math.cos(PI * u) * a }); }
          const e = lerp(u, sm(0, 1, u), 0.35); sp2.copy(GRD.F0).lerp(GRD.ST, rise).lerp(GRD.end, e); sp2.y += 0.50 * Math.sin(PI * Math.pow(u, 0.92)) * (1 - 0.15 * u);
          STAG.set(sp2, (1 - ap) * 3.2 + lerp(0.75, GRD.yaw, riseP), sc, lerp(0.30, 1, sm(9.3, 10.9, T))); const ur = sm(0.10, 0.94, u), zc = STAG.unravel(ur);
          for (const eye of STAG.eyeP) { STAG.pt(eye, sp3); glow(sp3, 0.085 * sc, [0.75, 1.0, 0.35], 0.9 * ap); }
          if (rise > 0.02 && rise < 0.98 && frnd() < 0.7) { const a = frnd() * TAU; emit(sp2.x + 0.3 * sc * Math.cos(a), frnd() * 1.2 * sc, sp2.z + 0.5 * sc * Math.sin(a), 0, 0.15 + frnd() * 0.25, 0, 0.9 + frnd() * 0.5, 0.016 + frnd() * 0.012, mote(), frnd() < 0.2 ? 2 : 0, 0.4, -0.04, frs(3)); }
          // where it comes apart, vines and light trail behind it in a spiral, with leaves (H10)
          if (ur > 0.01) { const rear = STAG.local(0, 1.06, zc, sp3), ph = T * 13;
            const cy = Math.cos(GRD.yaw), sy = Math.sin(GRD.yaw); VINES.forEach((v, j) => { const a = ph * (j % 2 ? 1 : -0.8) + j * TAU / 5, r = 0.13 + 0.07 * Math.sin(T * 9 + j * 2); sp4.set(Math.cos(a) * cy, Math.sin(a), -Math.cos(a) * sy); sp5.set(-Math.sin(a) * cy, Math.cos(a), Math.sin(a) * sy); v.push(V3(rear.x + sp4.x * r, rear.y + sp4.y * r, rear.z + sp4.z * r), sp4, sp5); });
            for (const [R, k] of [[RIB_SALVE, 0], [RIB_SALVE2, PI]]) { const a = ph * 0.6 + k, r = 0.22; sp4.set(Math.cos(a) * cy, Math.sin(a), -Math.cos(a) * sy); R.push(V3(rear.x + sp4.x * (r + 0.05), rear.y + sp4.y * (r + 0.05), rear.z + sp4.z * (r + 0.05)), V3(rear.x + sp4.x * (r - 0.05), rear.y + sp4.y * (r - 0.05), rear.z + sp4.z * (r - 0.05)), 0.9); }
            for (let i = 0; i < 4; i++) emit(rear.x + frs(0.2), rear.y + frs(0.2), rear.z + frs(0.1), frs(0.3) - 0.15 * GRD.h.x, frs(0.3), -0.2 - frnd() * 0.8, 0.5 + frnd() * 0.7, 0.020 + frnd() * 0.03, i === 0 ? FXC.leaf : mote(), i === 0 ? 2 : i === 1 ? 1 : 0, 1.4, 0.15, frs(4)); glow(rear, 0.7, FXC.green, 0.30); glow(rear, 0.3, FXC.pearl, 0.5); } }
        // it strikes: what is left of it bursts, and its vines whip once round the foe
        const DX = GRD.DUM.x, DZ = GRD.DUM.z, w = (T - GRD.hit) / 0.6;
        if (T >= GRD.hit && T - dt < GRD.hit) { dummyHit(4.2); for (let i = 0; i < 90; i++) { const a = frnd() * TAU, v = 0.4 + frnd() * 1.8; emit(DX - 0.25 * GRD.h.x + frs(0.2), 0.7 + frnd() * 1.1, DZ - 0.25 + frs(0.15), Math.cos(a) * v, frs(1) * v * 0.7 + 0.35, Math.sin(a) * v * 0.7 - 0.2, 0.5 + frnd() * 0.9, 0.024 + frnd() * 0.035, i % 3 === 0 ? FXC.leaf : mote(), i % 3 === 0 ? 2 : i % 3 === 1 ? 1 : 0, 2.0, 1.0, frs(5)); } }
        if (w >= 0 && w < 1) VINES.forEach((v, j) => { const a = j * TAU / 5 + w * TAU * 1.25 + 2.6, r = 0.26 - 0.05 * w, y = lerp(1.15, j % 2 ? 0.45 : 1.55, w); sp4.set(Math.cos(a), 0, Math.sin(a)); v.push(V3(DX + sp4.x * r, y, DZ + sp4.z * r), sp4, UP); });
        const hf = pulse(T, GRD.hit - 0.01, GRD.hit + 0.04, GRD.hit + 0.10, GRD.hit + 0.55); if (hf > 0.01) { sp2.set(DX, 1.1, DZ - 0.2); glow(sp2, 1.5 * hf, FXC.green, 0.45 * hf); glow(sp2, 0.6 * hf, FXC.pearl, hf, 1, 0.3); }
        const ptg = pt * (1 - end); if (ptg > 0.05 && T < GRD.hit) { handFrame('R'); glow(sp2.copy(rdW).addScaledVector(rdF, 0.10), 0.16 * ptg, FXC.gold, 0.5 * ptg); }
      };
    }
    // ----- Moonflower Garden (H11, H12, I6): she heals the whole party. Her book floats open at her left side. She cups a handful of
    // glowing seeds at her chest, flings them out in a ring, and where they land shoots rise, a vine creeps round, and twelve white
    // flowers open and glow like small moons; light rises round her friends. Then the garden sinks away.
    if (N === 'garden') {
      const inn = sm(0.35, 1.2, T), fl = sm(2.15, 2.62, T), end = sm(11.0, 12.0, T), w = inn * (1 - end), bloom = sm(7.4, 8.6, T) * (1 - sm(10.5, 11.2, T)), lit = sm(7.2, 8.6, T) * (1 - sm(10.3, 11.1, T)), gone = sm(11.0, 11.9, T);
      FXWANT.ally = FXWANT.ally2 = T > 0.15 && T < 11.85; ALLY.position.set(-0.90, 0, 0.02); ALLY.rotation.y = 0; ALLY2.position.set(0.93, 0, 0.02); ALLY2.rotation.y = 0; FLB.want = T > 0.05 && T < 11.5; FLB.P.set(0.57, 1.00, 0.05); FLB.lift = sm(0.6, 1.6, T) * (1 - sm(10.6, 11.4, T));
      add('head', 0.13 * inn * (1 - fl) - 0.05 * fl * (1 - end), 0, 0); add('neck', 0.04 * inn * (1 - fl), 0, 0); add('spine3', -0.04 * fl * (1 - end), 0, 0); add('spine2', -0.02 * fl * (1 - end), 0, 0);
      for (const [S, s] of SIDES) { const P = () => carried('spine3', s * lerp(0.050, 0.43, fl), lerp(1.165, 0.965, fl) + 0.05 * Math.sin(PI * fl), lerp(0.215, 0.21, fl) + 0.10 * Math.sin(PI * fl), V3());
        reaches.push([S, P, w, s * 0.25]); aims.push([S, V3(-s * 0.30, 0.45, 0.84).lerp(V3(s * 0.70, -0.12, 0.70), fl), V3(-s * 0.35, 0.85, -0.38).lerp(V3(-s * 0.10, 0.97, -0.20), fl), w]); fingers(S, lerp(0.24, lerp(0.55, 0.13, fl), w)); }
      if ((T > 0.7 && T < 2.1) || (T > 7.7 && T < 10.7)) eyes = 1; if (T > 0.5 && T < 11.6) mouth = 'smile';
      afterHands = () => {
        const hand = {}; for (const [S] of SIDES) { handFrame(S); hand[S] = rdW.clone().addScaledVector(rdF, 0.075).addScaledVector(rdN, 0.03); } const mid = hand.R.clone().lerp(hand.L, 0.5);
        // the seeds in her cupped hands
        const cupG = sm(0.9, 1.7, T) * (1 - sm(2.2, 2.5, T)); if (cupG > 0.02) { glow(mid, 0.34 * cupG, FXC.gold, 0.6 * cupG); for (let i = 0; i < 9; i++) glow(sp1.set(mid.x + 0.045 * Math.sin(i * 2.4 + T * 0.7), mid.y + 0.012 * Math.sin(i * 1.3 + T * 1.9), mid.z + 0.03 * Math.cos(i * 2.4 + T * 0.5)), 0.035, FXC.pearl, 0.8 * cupG);
          if (frnd() < 0.4 * cupG) emit(mid.x + frs(0.05), mid.y + 0.02, mid.z + frs(0.03), frs(0.02), 0.08 + frnd() * 0.12, frs(0.02), 0.8 + frnd() * 0.4, 0.013 + frnd() * 0.008, mote(), 0, 0.5, -0.02); }
        // they fly out in a ring, each trailing a thread of light, and land
        const F = GARDEN.flowers, shoot = GDN.shoot, opn = GDN.open;
        for (let i = 0; i < GARDEN.NF; i++) { const f = F[i], t0 = 2.24 + 0.022 * ((i * 5) % GARDEN.NF), dur = 0.95 + 0.25 * wHash(i * 3.1), u = (T - t0) / dur; if (T <= t0) GDN.from[i].copy(f.p.x < 0 ? hand.R : hand.L); GDN.fly[i] = u;
          if (u > 0 && u < 1) { GARDEN.seedAt(f, GDN.from[i], u, sp1); glow(sp1, 0.075, FXC.gold, 1); glow(sp1, 0.03, FXC.pearl, 1); }
          const tl = t0 + dur; if (T >= tl && T - dt < tl) for (let k = 0; k < 7; k++) emit(f.p.x + frs(0.03), 0.04, f.p.z + frs(0.03), frs(0.25), 0.15 + frnd() * 0.35, frs(0.25), 0.5 + frnd() * 0.4, 0.018 + frnd() * 0.012, k % 2 ? FXC.gold : FXC.pearl, k % 3 === 0 ? 1 : 0, 2, 0.5);
          const lf = pulse(T, tl - 0.02, tl + 0.05, tl + 0.2, tl + 0.9); if (lf > 0.02) glow(sp1.set(f.p.x, 0.05, f.p.z), 0.26 * lf, FXC.gold, 0.6 * lf);
          shoot[i] = cl((T - tl - 0.05) / 1.5, 0, 1); let d = Math.abs(f.a - 0.2) % TAU; if (d > PI) d = TAU - d; opn[i] = cl((T - 6.0 - 0.42 * d) / 1.15, 0, 1); }
        GARDEN.setThreads(GDN.fly, GDN.from, FXVIEW); GARDEN.set(shoot, opn, sm(4.2, 6.7, T), lit, gone);
        // every open flower glows like a small moon, and motes rise from it
        for (let i = 0; i < GARDEN.NF; i++) { const o = sm(0.5, 1, opn[i]) * (1 - gone); if (o < 0.02) continue; GARDEN.face(i, sp1); glow(sp1, 0.40 * o * (0.55 + 0.45 * lit), FXC.pearl, 0.26 * o * (0.25 + 0.75 * lit)); glow(sp1, 0.09 * o, FXC.pearl, 0.45 * o * lit);
          if (frnd() < 0.20 * o * (0.3 + lit)) emit(sp1.x + frs(0.06), sp1.y + frs(0.03), sp1.z + frs(0.06), frs(0.03), 0.10 + frnd() * 0.20, frs(0.03), 1.3 + frnd() * 0.9, 0.014 + frnd() * 0.012, mote(), frnd() < 0.1 ? 1 : 0, 0.3, -0.03); }
        // light rises round her friends as the garden blooms
        if (bloom > 0.02) for (const A of [ALLY, ALLY2]) { glow(sp1.set(A.position.x, 1.0, A.position.z), 1.4 * bloom, FXC.gold, 0.22 * bloom); glow(sp1.set(A.position.x, 1.25, A.position.z), 0.6 * bloom, FXC.pearl, 0.28 * bloom);
          for (let i = 0; i < 2; i++) if (frnd() < bloom) { const a = frnd() * TAU, r = 0.16 + frnd() * 0.16; emit(A.position.x + r * Math.cos(a), 0.1 + frnd() * 1.4, A.position.z + r * Math.sin(a), 0, 0.26 + frnd() * 0.3, 0, 0.9 + frnd() * 0.6, 0.016 + frnd() * 0.014, mote(), frnd() < 0.15 ? 1 : 0, 0.3, -0.05); } }
        // her book: warm light and motes rise from its pages
        const bk = FLB.lift; if (bk > 0.02 && bkFl > 0.5) { const c = bookPt(0, 0, 0.05, sp2); glow(c, 0.42 * bk, FXC.gold, 0.30 * bk); if (frnd() < 0.5 * bk) { const q = bookPt(frs(0.11), frs(0.08), 0.03, sp3); emit(q.x, q.y, q.z, frs(0.02), 0.12 + frnd() * 0.16, frs(0.02), 1.1 + frnd() * 0.6, 0.014 + frnd() * 0.01, mote(), 0, 0.4, -0.03); } }
        // at the end the garden sinks away in sparks
        if (gone > 0.02 && gone < 0.98) for (let k = 0; k < 3; k++) { const a = frnd() * TAU; GARDEN.ringP(a, sp1); emit(sp1.x + frs(0.08), 0.04 + frnd() * 0.16, sp1.z + frs(0.08), frs(0.1), 0.15 + frnd() * 0.3, frs(0.1), 0.6 + frnd() * 0.6, 0.018 + frnd() * 0.016, k ? mote() : FXC.pearl, k === 0 ? 1 : 0, 1, 0); }
      };
    }
    // ----- Thornwake (H14, H15, I7, I8): her one damage spell. The closed book hugged to her chest, she draws her dagger; violet
    // witchfire wakes on the blade; she drops to her right knee and drives it into the ground. A crack of violet light runs to the
    // foe, small thorned roots push up along it, and a briar bursts out under the foe and closes on it like a hand. Roses open on it.
    if (N === 'thorn') {
      const arm = sm(0.15, 0.6, T) * (1 - sm(6.9, 7.5, T)), kn = sm(1.8, 2.5, T) * (1 - sm(6.4, 7.2, T)), hold = sm(0.8, 1.4, T), stab = sm(2.25, 2.62, T) * (1 - sm(6.2, 6.7, T)), crack = cl((T - 2.62) / 0.6, 0, 1.3), g = sm(3.15, 4.4, T) * (1 - sm(5.9, 6.9, T)), lift = sm(3.9, 4.6, T) * (1 - sm(5.9, 6.6, T)), fire = sm(1.0, 1.8, T) * (1 - sm(6.5, 7.0, T));
      FXWANT.dummy = T < 7.35; DUMMY.position.set(0, 0.24 * lift, 1.40); HUG.want = T > 0.05 && T < 7.2; hugArm(reaches, aims, arm);
      SK.hips.position.y -= 0.52 * kn; SK.hips.position.z += 0.08 * kn; add('spine1', 0.36 * kn, 0, 0); add('spine2', 0.28 * kn, 0, 0); add('spine3', 0.10 * kn, 0, 0); add('neck', -0.24 * kn, 0, 0); add('head', -0.22 * kn + 0.10 * hold * (1 - kn), 0, 0);
      ank.L.set(ank.L.x + 0.03 * kn, ank.L.y + 0.05 * Math.sin(PI * kn), ank.L.z + 0.36 * kn); ank.R.set(ank.R.x - 0.01 * kn, ank.R.y - 0.015 * kn, ank.R.z - 0.40 * kn); footP.R = Math.max(footP.R, 1.25 * kn);
      const hP = () => { const P = carried('hips', 0.150, 0.955, 0.125, V3()); P.lerp(carried('spine3', -0.09, 1.05, 0.31, sp1), hold); P.lerp(sp1.set(-0.11, 0.345, 0.50), stab); return P; };
      reaches.push(['R', hP, arm, -0.35]); gripAim(aims, 'R', V3(0.05, 1, -0.12), V3(0.35, 0, 1), arm * sm(0.7, 1.2, T)); fingers('R', lerp(0.24, 1.35, sm(0.45, 0.75, T) * (1 - sm(6.9, 7.3, T))));
      if (T > 0.6 && T < 6.6) emo = 'stern';
      afterHands = () => { const sc = sm(0.72, 0.86, T) * (1 - sm(6.85, 7.0, T)), az = daggerInHand(sc); daggerMat.emissiveIntensity = 0.85 * fire;
        if (T >= 0.74 && T - dt < 0.74) for (let i = 0; i < 10; i++) emit(DAGGER.position.x, DAGGER.position.y, DAGGER.position.z, frs(0.25), frs(0.25), frs(0.25), 0.4, 0.022, witch(), 1, 2, 0);
        if (fire > 0.02 && sc > 0.5) for (let i = 0; i < 4; i++) { const u = 0.15 + 0.85 * frnd(); sp1.copy(DAGGER.position).addScaledVector(az, -0.298 * u); if (sp1.y < 0.01) continue; if (i === 0) glow(sp1, 0.10 * fire, VIO, 0.7 * fire); if (frnd() < 0.8 * fire) emit(sp1.x + frs(0.008), sp1.y, sp1.z + frs(0.008), frs(0.05), 0.18 + frnd() * 0.25, frs(0.05), 0.28 + frnd() * 0.25, 0.022 + frnd() * 0.018, witch(), frnd() < 0.5 ? 2 : 0, 1.0, -0.3, frs(2)); }
        if (fire > 0.02 && sc > 0.5) { glow(sp1.copy(DAGGER.position).addScaledVector(az, -0.16), 0.30 * fire, VIO, 0.35 * fire); }
        // the blade goes into the ground; the crack runs to the foe; thorned roots push up along it
        if (T < 2.75) THN.from.set(DG.tip.x, 0, DG.tip.z); const len = Math.max(0.2, 1.40 - 0.32 - THN.from.z), ca = (T > 2.6 ? 1 : 0) * (1 - sm(5.7, 6.6, T));
        CRACK.set(THN.from, len, crack, ca, sm(2.95, 3.7, T) * (1 - sm(5.9, 6.8, T)));
        if (T >= 2.62 && T - dt < 2.62) for (let i = 0; i < 26; i++) { const a = frnd() * TAU, v = 0.3 + frnd() * 1.0; emit(THN.from.x, 0.03, THN.from.z, Math.cos(a) * v, 0.2 + frnd() * 0.9, Math.sin(a) * v, 0.35 + frnd() * 0.4, 0.022 + frnd() * 0.02, witch(), i % 2, 2.2, 1.2); }
        const sf = pulse(T, 2.60, 2.66, 2.72, 3.1); if (sf > 0.01) { glow(sp1.set(THN.from.x, 0.05, THN.from.z), 0.8 * sf, VIO, 0.6 * sf); glow(sp1, 0.3 * sf, PINK, sf, 1, 0.5); }
        if (ca > 0.05 && crack > 0.02) for (let i = 0; i < 3; i++) { const u = frnd() * Math.min(1, crack); sp1.set(THN.from.x + frs(0.05), 0.02, THN.from.z + u * len); if (i === 0) glow(sp1.set(THN.from.x, 0.03, THN.from.z + Math.min(1, crack) * len), 0.30 * ca * (crack < 1.05 ? 1 : 0.3), MAG, 0.7 * ca); if (frnd() < 0.7 * ca) emit(sp1.x, sp1.y, sp1.z, frs(0.03), 0.15 + frnd() * 0.3, frs(0.03), 0.3 + frnd() * 0.3, 0.02 + frnd() * 0.02, witch(), frnd() < 0.5 ? 2 : 0, 1, -0.2, frs(2)); }
        // the briar bursts out under the foe, closes on it and lifts it; witchfire in the cracks of the wood; roses open
        BRIAR.G.position.set(0, 0, 1.40); BRIAR.set(g, sm(4.3, 5.5, T) * (1 - sm(5.9, 6.5, T)));
        if (T >= 3.18 && T - dt < 3.18) { dummyHit(1.6); for (let i = 0; i < 40; i++) { const a = frnd() * TAU, v = 0.4 + frnd() * 1.2; emit(Math.cos(a) * 0.3, 0.03, 1.40 + Math.sin(a) * 0.3, Math.cos(a) * v, 0.5 + frnd() * 1.6, Math.sin(a) * v, 0.4 + frnd() * 0.5, 0.022 + frnd() * 0.025, witch(), i % 2, 2.0, 2.2); } }
        if (T >= 4.1 && T - dt < 4.1) dummyHit(-2.8);
        if (g > 0.05) { for (let i = 0; i < 6; i++) { const f = (i + Math.floor(T * 7)) % 6, t = frnd() * g, p = BRIAR.lines[f](t); sp1.set(p.x, p.y, 1.40 + p.z); glow(sp1, 0.10 + 0.06 * Math.sin(T * 17 + i), VIO, 0.55 * g); if (frnd() < 0.35) emit(sp1.x, sp1.y, sp1.z, frs(0.04), 0.12 + frnd() * 0.25, frs(0.04), 0.3 + frnd() * 0.35, 0.02 + frnd() * 0.02, witch(), frnd() < 0.5 ? 2 : 0, 1, -0.25, frs(2)); }
          glow(sp1.set(0, 0.5, 1.40), 1.3 * g, VIO, 0.16 * g); }
      };
    }
    // ----- Rootbound Return (H13): she brings a fallen friend back. She kneels beside them, her book floating open beside her, a
    // glowing seed on her open palm over their chest. It falls; roots of light trace their outline on the ground and small white
    // flowers open along the roots; the friend sits up and she takes their hand.
    if (N === 'revive') {
      const kn = sm(0.2, 1.1, T) * (1 - sm(8.7, 9.6, T)), arm = sm(0.6, 1.2, T) * (1 - sm(8.8, 9.5, T)), tip = sm(3.0, 3.45, T), take = sm(5.5, 6.3, T) * (1 - sm(8.3, 8.8, T)), sit = sm(5.9, 7.3, T) * (1 - sm(9.0, 9.5, T)), grow = sm(3.75, 5.6, T), bloom = sm(4.6, 6.4, T), end = sm(8.6, 9.5, T), bow = pulse(T, 0.8, 1.6, 5.4, 6.2);
      FLB.want = T > 0.1 && T < 9.2; FLB.P.set(0.46, 0.84, 0.10); FLB.lift = sm(0.8, 1.6, T) * (1 - end);
      SK.hips.position.y -= 0.47 * kn; SK.hips.position.z += 0.05 * kn; add('hips', 0, -0.30 * kn, 0); add('spine1', 0.16 * kn, -0.14 * kn, 0.06 * kn); add('spine2', 0.12 * kn, -0.14 * kn, 0.05 * kn); add('neck', 0.10 * bow, -0.20 * kn, 0); add('head', 0.22 * bow + 0.08 * kn, -0.30 * kn, 0);
      ank.L.set(ank.L.x + 0.01 * kn, ank.L.y + 0.05 * Math.sin(PI * kn), ank.L.z + 0.36 * kn); ank.R.set(ank.R.x - 0.01 * kn, ank.R.y - 0.015 * kn, ank.R.z - 0.40 * kn); footP.R = Math.max(footP.R, 1.25 * kn); reaches.push(['L', knee('L'), 0.9 * kn, 0.3]);
      const hP = () => { const P = V3(RVV.x + 0.17, 0.52, RVV.z0 + 1.17); P.lerp(FALLEN.handAt(sp1).add(sp2.set(0.07, 0.03, -0.02)), take); return P; };
      reaches.push(['R', hP, arm, -0.2]); aims.push(['R', V3(-0.92, -0.05, 0.30), V3(-0.55 * tip, 1 - 0.3 * tip, 0), arm * (1 - take)]); aims.push(['R', V3(-0.85, -0.45, 0.10), V3(0.1, 0.3, -0.95), arm * take]); fingers('R', lerp(0.24, lerp(0.10, 0.75, take), arm));
      if (T > 0.8 && T < 5.6) emo = 'reading'; else if (T >= 6.4 && T < 8.7) emo = 'delighted'; else if (T >= 5.6) mouth = 'smile';
      afterHands = () => { handFrame('R'); const palm = rdW.clone().addScaledVector(rdF, 0.075).addScaledVector(rdN, 0.036), chest = sp5.set(RVV.x, 0.235, RVV.z0 + 1.20), fall = sm(3.38, 3.72, T), sink = sm(3.72, 3.95, T), sd = palm.lerp(chest, fall * fall), show = sm(1.0, 1.4, T) * (1 - sink);
        FALLEN.set(RVV.x, RVV.z0, sm(0.15, 0.8, T) * (1 - sm(9.0, 9.6, T)), sit, take); TRACE.set(RVV.x, RVV.z0, grow, 1 - sm(8.2, 9.2, T), bloom);
        SEED.visible = show > 0.01; if (SEED.visible) { SEED.position.copy(sd); SEED.rotation.set(0, T * 0.6, 0); SEED.scale.setScalar(show); seedMat.emissiveIntensity = 0.9; SHOOT.scale.setScalar(0.001); glow(sd, 0.30 * show, FXC.gold, 0.55 * show); glow(sd, 0.11 * show, FXC.pearl, 0.6 * show); if (frnd() < 0.3) emit(sd.x + frs(0.03), sd.y + frs(0.02), sd.z + frs(0.03), frs(0.03), 0.05 + frnd() * 0.1, frs(0.03), 0.8, 0.014, mote(), 0, 0.6, -0.02); }
        const fl = pulse(T, 3.70, 3.78, 3.9, 4.6); if (fl > 0.01) { glow(chest, 0.9 * fl, FXC.gold, 0.5 * fl); glow(chest, 0.35 * fl, FXC.pearl, 0.9 * fl, 1, 0.3); }
        if (T >= 3.74 && T - dt < 3.74) for (let i = 0; i < 24; i++) { const a = frnd() * TAU, v = 0.2 + frnd() * 0.6; emit(chest.x, chest.y, chest.z, Math.cos(a) * v, 0.1 + frnd() * 0.5, Math.sin(a) * v, 0.5 + frnd() * 0.5, 0.02 + frnd() * 0.015, mote(), i % 3 === 0 ? 1 : 0, 2, 0.3); }
        const lit = grow * (1 - sm(8.2, 9.0, T)); if (lit > 0.05) { for (let i = 0; i < 3; i++) if (frnd() < 0.8 * lit) { const s = TRACE.stars[Math.floor(frnd() * TRACE.stars.length)]; if (s.userData.k > grow * 1.05) continue; emit(RVV.x + s.position.x + frs(0.03), 0.02, RVV.z0 + s.position.z + frs(0.03), frs(0.02), 0.10 + frnd() * 0.22, frs(0.02), 0.9 + frnd() * 0.7, 0.014 + frnd() * 0.012, mote(), frnd() < 0.12 ? 1 : 0, 0.3, -0.03); }
          glow(sp1.set(RVV.x, 0.3 + 0.4 * sit, RVV.z0 + 0.95), 1.3 * lit, FXC.gold, 0.16 * lit + 0.12 * pulse(T, 5.9, 6.6, 7.6, 8.4)); }
        const bk = FLB.lift; if (bk > 0.02 && bkFl > 0.5) { const c = bookPt(0, 0, 0.05, sp2); glow(c, 0.42 * bk, FXC.gold, 0.30 * bk); if (frnd() < 0.5 * bk) { const q = bookPt(frs(0.11), frs(0.08), 0.03, sp3); emit(q.x, q.y, q.z, frs(0.02), 0.12 + frnd() * 0.16, frs(0.02), 1.1 + frnd() * 0.6, 0.014 + frnd() * 0.01, mote(), 0, 0.4, -0.03); } }
      };
    }
    // ----- Bramble Cradle (H16): her guard. The closed book hugged to her chest, her right hand raised palm outward; a dome of woven
    // living branches grows up round her, taller than her hat, leaves all over it, thorns pointing out. What strikes it bounces off as sparks.
    if (N === 'cradle') {
      const arm = sm(0.1, 0.7, T) * (1 - sm(5.3, 6.1, T)), g = sm(0.6, 2.2, T) * (1 - sm(4.7, 5.9, T)); let shake = 0;
      HUG.want = T > 0.05 && T < 5.8; hugArm(reaches, aims, arm); reaches.push(['R', () => carried('spine3', -0.31, 1.49, 0.17, V3()), arm, -0.5]); aims.push(['R', V3(-0.05, 1, 0.12), V3(0, -0.12, 1), arm]); fingers('R', lerp(0.24, 0.06, arm));
      add('head', -0.03 * arm, 0, 0); add('spine3', -0.02 * arm, 0, 0); if (T > 0.6 && T < 5.4) mouth = 'smile';
      for (const [t0, a, u] of [[2.9, 1.25, 0.55], [3.5, 1.9, 0.38], [4.1, 1.5, 0.66]]) { const d = T - t0; if (d >= 0 && d < 0.5) shake += Math.sin(d * 50) * Math.exp(-d * 9);
        if (T >= t0 && T - dt < t0) { const p = CRADLE.userData.at(a, u), o = V3(p.x, 0.2, p.z).normalize(); for (let i = 0; i < 22; i++) emit(p.x, p.y, p.z, o.x * (0.6 + frnd() * 1.4) + frs(0.8), frs(0.9) + 0.3, o.z * (0.6 + frnd() * 1.4) + frs(0.8), 0.35 + frnd() * 0.45, 0.024 + frnd() * 0.025, i % 3 ? FXC.gold : FXC.pearl, 1, 2.0, 1.6); }
        const f = pulse(T, t0 - 0.01, t0 + 0.03, t0 + 0.08, t0 + 0.4); if (f > 0.01) { const p = CRADLE.userData.at(a, u); glow(p, 0.7 * f, FXC.gold, 0.6 * f); glow(p, 0.28 * f, FXC.pearl, f, 1, 0.4); } }
      CRADLE.userData.set(g, shake);
      if (g > 0.02 && g < 0.98 && T < 3) for (let i = 0; i < 3; i++) { const p = CRADLE.userData.at(frnd() * TAU, Math.min(0.99, g * (0.9 + 0.1 * frnd()))); emit(p.x, p.y, p.z, frs(0.05), 0.1 + frnd() * 0.2, frs(0.05), 0.6 + frnd() * 0.5, 0.014 + frnd() * 0.012, mote(), 0, 0.5, -0.03); }
    }
    // ----- her reactions (stage fourteen; H17, H18). Hit: she staggers back from the blow, bent, her right hand clapped on her hat
    // to hold it on, the closed book hugged tight, her eyes shut. Down: she sinks to the ground and sits on her hip, legs folded to
    // one side, leaning on her right hand, head bowed; her hat has fallen off and lies beside her, the book under her left hand.
    // Win: her weight on one hip, she snaps the book shut beside her with a puff of dust and tips her hat brim with two fingers.
    if (N === 'hit') { const k = pulse(T, 0, 0.10, 0.80, 1.5), jolt = pulse(T, 0, 0.06, 0.12, 0.5), w = sm(0, 0.12, T) * (1 - sm(1.05, 1.55, T));
      HUG.want = T < 1.25; bkH = Math.max(bkH, sm(0, 0.12, T) * (1 - sm(1.2, 1.5, T))); hugArm(reaches, aims, w);
      SK.hips.position.z -= 0.13 * k + 0.04 * jolt; SK.hips.position.y -= 0.07 * k; add('hips', 0.10 * k, 0.10 * k, 0); add('spine1', 0.20 * k, 0.08 * k, -0.05 * k); add('spine2', 0.16 * k + 0.10 * jolt, 0.06 * k, 0); add('spine3', 0.08 * k, 0, 0); add('neck', 0.14 * k, 0, 0.05 * k); add('head', 0.16 * k, -0.10 * k, 0.06 * k);
      ank.R.z -= 0.22 * k; ank.R.x -= 0.04 * k; ank.L.z -= 0.02 * k; if (k > 0.05 && k < 0.95) ank.R.y += 0.03 * Math.sin(PI * k);
      reaches.push(['R', () => carried('head', -0.115, 1.690, 0.045, V3()), w, -0.6]); aims.push(['R', V3(0.85, -0.22, 0.20), V3(0.15, -1, 0), w]); fingers('R', lerp(0.24, 0.42, w));
      if (k > 0.25) emo = 'hit'; }
    if (N === 'win') { const k = sm(0.1, 0.7, T) * (1 - sm(3.0, 3.7, T)), up = sm(0.85, 1.2, T), tipW = sm(1.25, 1.7, T) * (1 - sm(2.7, 3.3, T)), tip = pulse(T, 1.75, 2.0, 2.3, 2.6), snapT = 1.05, shut = T >= snapT && T < 3.45;
      SK.hips.position.x += 0.035 * k; add('hips', 0, 0, -0.07 * k); add('spine1', 0, 0, 0.05 * k); add('spine3', 0, 0, 0.03 * k); add('neck', 0.05 * tip, 0, 0); add('head', 0.13 * tip, 0.06 * k, -0.04 * k);
      SPB.want = T > 0.1 && T < snapT; if (shut) { bkS = 0; bkH = 1; HUG.want = true; HUG.mode = 'hand'; } else if (T >= 3.45) bkH = 0;
      carried('spine3', 0.20, 1.20, 0.25, SPB.P); SPB.f.set(-0.30, 0.30, 0.90); SPB.n.set(-0.10, 0.92, -0.38);
      if (T >= 0.85) { reaches.push(['L', () => carried('spine3', lerp(0.22, 0.345, up), lerp(1.15, 1.395, up), lerp(0.24, 0.17, up), V3()), k, 0.45]); aims.push(['L', V3(0.05, 1, 0.05), V3(-0.22, 0.02, 1), k * up]); fingers('L', lerp(0.24, 0.5, k * up)); }
      fv.set(0.30, 0.90, -0.32).normalize(); reaches.push(['R', () => carried('head', -0.126, 1.546, 0.102, V3()).addScaledVector(fv, -0.135), tipW, 0.35]); aims.push(['R', fv.clone(), V3(0.75, 0.1, -0.65), tipW]); fingers('R', lerp(0.24, 0.55, tipW));
      if (T > 0.9 && T < 3.3) emo = 'delighted'; else if (T > 0.3) mouth = 'smile';
      afterHands = () => { if (T >= snapT && T - dt < snapT) { const c = bookPt(0, 0, 0.02, sp1); for (let i = 0; i < 16; i++) emit(c.x + frs(0.06), c.y + frs(0.08), c.z + 0.03, frs(0.12), 0.05 + frnd() * 0.22, 0.05 + frnd() * 0.15, 0.7 + frnd() * 0.6, 0.016 + frnd() * 0.02, [0.86, 0.78, 0.60], 0, 1.6, -0.05); } }; }
    if (N === 'down') { const q = sm(0.12, 1.25, T) * (1 - sm(4.3, 5.5, T)), hipY = SK.hips.userData.home.y + SK.thighL.position.y, hand = sm(0.5, 1.2, T) * (1 - sm(4.2, 4.9, T));
      SK.hips.position.y -= (hipY - 0.135) * q; SK.hips.position.x -= 0.04 * q; SK.hips.position.z -= 0.16 * q; plant *= 1 - sm(0.1, 0.6, q);
      add('hips', -0.04 * q, 0.22 * q, 0.30 * q); add('spine1', 0.16 * q, 0, 0.14 * q); add('spine2', 0.14 * q, 0, 0.10 * q); add('spine3', 0.08 * q, 0, 0.04 * q); add('neck', 0.20 * q, 0, -0.08 * q); add('head', 0.26 * q, 0.10 * q, -0.10 * q);
      for (const [S, s] of SIDES) { const D = (s > 0 ? V3(0.40, -0.22, 0.88) : V3(0.62, -0.30, 0.72)).normalize(), H = V3(0, 1, 0).addScaledVector(D, -D.y).normalize(), nD = D.clone().negate();
        _qc.setFromRotationMatrix(_mb.makeBasis(H, nD, V3().crossVectors(H, nD))); SK['thigh' + S].quaternion.slerp(_qc, q); add('shin' + S, (s > 0 ? 2.15 : 2.0) * q, 0, 0); add('foot' + S, 0.5 * q, 0, 0); }
      reaches.push(['R', V3(-0.50, 0.075, 0.08), hand, -0.2]); aims.push(['R', V3(-0.45, -0.05, 0.88), V3(0, -1, 0), hand]); fingers('R', lerp(0.24, 0.10, hand));
      reaches.push(['L', V3(0.03, 0.085, 0.27), hand, 0.3]); aims.push(['L', V3(0.25, -0.08, 0.95), V3(0, -1, 0), hand]); fingers('L', lerp(0.24, 0.14, hand));
      HUG.want = T > 0.7 && T < 4.3; HUG.mode = 'ground'; hatK = sm(0.45, 1.2, T) * (1 - sm(4.4, 5.1, T)); if (q > 0.55) eyes = 1; }
    if (N === 'glasses') { const k = pulse(T, 0, 0.55, 1.5, 2.25), push = pulse(T, 0.62, 0.9, 1.05, 1.4);
      add('head', 0.09 * k - 0.07 * push, -0.04 * k, 0); add('neck', 0.03 * k, 0, 0); sync();
      fv.set(0.16, 0.93, -0.30).normalize(); carried('head', -0.003, 1.497 + 0.010 * push, 0.108, tgt).addScaledVector(fv, -0.150);
      reaches.push(['R', tgt.clone(), k, -0.55]); aims.push(['R', fv.clone(), V3(0.6, -0.1, -0.8), k]); fingers('R', lerp(0.24, 1.25, k), lerp(0.24, 0.06, k)); }
    if (N === 'hat') { const k = pulse(T, 0, 0.6, 1.75, 2.45), tip = pulse(T, 0.75, 1.05, 1.3, 1.65);
      add('head', 0.17 * tip, 0.05 * k, 0); add('neck', 0.06 * tip, 0, 0); add('spine3', 0.04 * tip, 0, 0); sync();
      fv.set(-0.30, 0.90, -0.32).normalize(); carried('head', 0.126, 1.546, 0.102, tgt).addScaledVector(fv, -0.135);
      reaches.push(['L', tgt.clone(), k, -0.35]); aims.push(['L', fv.clone(), V3(-0.75, 0.1, -0.65), k]); fingers('L', lerp(0.24, 0.55, k)); if (tip > 0.4) mouth = 'smile'; }
    if (N === 'wave') { const k = pulse(T, 0, 0.5, 2.3, 2.9), env = pulse(T, 0.5, 0.8, 2.0, 2.35), ph = (T - 0.5) * 8.5, w1 = Math.sin(ph) * env, w2 = Math.sin(ph - 0.8) * env;
      // Chris, November 13: "her hand needs to be maybe mid-chest height, and her elbow needs to be lower, so she's just kind of like
      // more coyly waving". A small wave close to her body: elbow down by her side, hand at her chest, head tipped toward it.
      add('head', 0.03 * k, -0.08 * k, 0.10 * k); add('neck', 0, -0.03 * k, 0.03 * k); add('spine3', 0, -0.04 * k, 0); add('clavR', 0, 0, -0.06 * k);
      reaches.push(['R', V3(-0.205 - 0.038 * w1, 1.165 - 0.006 * Math.abs(w1), 0.175), k, -0.25]); aims.push(['R', V3(-0.05 - 0.20 * w2, 1, 0.10), V3(0.10, 0, 1), k]);
      fingers('R', lerp(0.24, 0.12, k)); if (k > 0.5) mouth = 'smile'; }
    if (N === 'look') { const yaw = 0.95 * (pulse(T, 1.8, 2.4, 2.9, 3.4) - pulse(T, 0.1, 0.7, 1.2, 1.7));
      add('head', 0.02 * Math.abs(yaw), 0.50 * yaw, 0); add('neck', 0, 0.30 * yaw, 0); add('spine3', 0, 0.12 * yaw, 0); add('spine2', 0, 0.08 * yaw, 0); }
    if (N === 'twirl') { const u = cl((T - 0.35) / 1.55, 0, 1), k = pulse(T, 0.2, 0.6, 1.7, 2.3), up = pulse(T, 0.4, 0.7, 1.7, 2.0);
      const ang = TAU * u * u * (3 - 2 * u) - 0.22 * pulse(T, 0, 0.3, 0.38, 0.6), rate = dt > 0 ? Math.abs(ang - spinWas) / dt : 0; spinWas = ang;
      add('hips', 0, ang, 0); plant *= 1 - pulse(T, 0.2, 0.36, 1.92, 2.1);
      const h = 0.035 * up, ah = h / 0.10; SK.hips.position.y += h; for (const [S, s] of SIDES) { add('foot' + S, ah, 0, 0); add('uarm' + S, 0, 0, s * 0.72 * k); add('farm' + S, -0.22 * k, 0, 0); }
      add('head', -0.07 * k, 0, 0); add('spine3', -0.04 * k, 0, 0); for (const o of SOFT) if (!o.hair) o.lift = Math.min(0.55, 0.075 * rate); if (k > 0.4) mouth = 'smile'; if (up > 0.5) emo = 'delighted'; } else spinWas = 0;
    if (N === 'curtsey') { const k = pulse(T, 0, 0.7, 2.15, 2.9), dip = pulse(T, 0.6, 1.25, 1.75, 2.4);
      SK.hips.position.y -= 0.13 * dip; SK.hips.position.z -= 0.015 * dip; add('hips', 0.08 * dip, 0, 0); add('spine1', 0.09 * dip, 0, 0); add('spine2', 0.07 * dip, 0, 0); add('neck', 0.10 * dip, 0, 0); add('head', 0.20 * dip, 0, 0);
      ank.R.set(lerp(ANK.R.x, 0.05, k), ANK.R.y + 0.03 * k, lerp(ANK.R.z, -0.24, k)); footP.R = 0.55 * k;
      for (const [S, s] of SIDES) { reaches.push([S, V3(s * 0.335, 0.865 - 0.10 * dip, 0.015), k, s * 0.12]); fingers(S, lerp(0.24, 0.95, k)); }
      for (const o of SOFT) if (!o.hair) { const side = Math.abs(Math.sin(o.ch.a)); o.lift = 0.5 * k * Math.pow(side, 3); }
      if (dip > 0.5) mouth = 'smile'; if (dip > 0.8) emo = 'reading'; }       // at the bottom of the curtsey her eyes are lowered
    if (N === 'herb') { const d1 = pulse(T, 0, 0.9, 3.6, 4.7), rg = pulse(T, 0.6, 1.3, 1.65, 2.25), sml = pulse(T, 2.05, 2.65, 3.25, 3.8), lean = 0.80 * rg + 0.10 * d1 * (1 - rg);
      SK.hips.position.y -= 0.47 * d1; SK.hips.position.z += 0.05 * d1;
      add('spine1', 0.36 * lean, 0, 0); add('spine2', 0.36 * lean, 0, 0); add('spine3', 0.28 * lean, -0.10 * rg, 0); add('neck', -0.10 * rg + 0.06 * sml, 0, 0); add('head', 0.10 * rg + 0.14 * sml, -0.08 * rg, 0);
      ank.L.set(ANK.L.x + 0.01 * d1, ANK.L.y + 0.05 * Math.sin(PI * d1), ANK.L.z + 0.36 * d1); ank.R.set(ANK.R.x - 0.01 * d1, ANK.R.y - 0.015 * d1, ANK.R.z - 0.40 * d1); footP.R = 1.25 * d1; sync();
      const wR = Math.max(rg, sml), a = wR > 1e-4 ? sml / (rg + sml) : 0; fv.set(0.22, 0.86, -0.46).normalize(); carried('head', -0.012, 1.452, 0.128, tg2).addScaledVector(fv, -0.125); tgt.set(-0.15, 0.22, 0.52).lerp(tg2, a);
      reaches.push(['R', tgt.clone(), wR, -0.4]); aims.push(['R', V3(0.05, -0.85, 0.5), V3(0, -0.4, -0.9), rg * (1 - a)]); aims.push(['R', fv.clone(), V3(0.55, 0, -0.83), sml]); fingers('R', lerp(0.24, 0.8, wR));
      reaches.push(['L', () => carried('shinL', ANK.L.x + 0.02, IO_KNEE_Y + 0.085, 0.006, V3()), 0.9 * d1, 0.3]);       // her left hand rests on her raised knee
      if (sml > 0.6) emo = 'delighted'; else if (T > 3.0 && T < 4.4) mouth = 'smile'; }
    // her body is in place: plant her feet, then her hands
    sync();
    for (const [S] of SIDES) { ik2(SK['thigh' + S], SK['shin' + S], SK['foot' + S], ank[S], plant, 0, 1); flatFoot(S, footP[S], plant); }
    sync();
    // a hand travels from where it hangs to its point, a little forward on the way so it clears her skirt and her hair, with its elbow bending as it goes
    bookPlace(dt, N);
    for (const r of reaches) { const k = r[2]; if (k <= 0.0005) continue; const P = typeof r[1] === 'function' ? r[1]() : r[1], e = k * k * (3 - 2 * k);
      SK['hand' + r[0]].getWorldPosition(_p).applyMatrix4(_inv).lerp(P, e); _p.z += 0.09 * Math.sin(PI * e); reach(r[0], tg2.copy(_p), sm(0, 0.15, k), (r[3] || 0) * e); }
    for (const a of aims) aimHand(a[0], a[1], a[2], a[3]);
    for (const [S] of SIDES) wristFix(S);
    if (bkR > 0.001 && SK.book) { sync(); readHands(N, T); }
    else if (bkS > 0.001 && SK.book) { sync(); bookOnPalm(bkS, SPB.P, SPB.f, SPB.n); }
    else if (bkH > 0.001 && SK.book) { sync(); bookHug(bkH); }
    else if (bkFl > 0.001 && SK.book) bookFloat(bkFl, T);
    pagesSet(bkFl * FLB.lift, T); hatApply(hatK, sp5.set(-0.66, 0.04, 0.40), 0.9);
    if (afterHands) { sync(); afterHands(); }       // what a spell does once her hands are where they will be drawn: fine finger work, and the lights that start from them
    propVis(true, (N === 'sickle' && T > 0.12 && T < 3.25) || sickNow);
    sync(); softTick(dt);
    return { eyes, mouth, emo };
  }
  function animate(a0, a1, a2, a3) {
    let dt = a3 !== undefined ? a3 : a0; dt = dt > 0 ? Math.min(dt, 0.05) : 0; clock += dt;
    let eyes = 0, mouth = 'rest', emo = null;
    if (mv.name !== 'pose') { mv.t += dt; if (SHOTS[mv.name] && mv.t >= SHOTS[mv.name]) mv = { name: 'idle', t: 0 }; const f = body(mv.name, mv.t, dt); eyes = f.eyes; mouth = f.mouth; emo = f.emo; }
    if (blinking && clock > blinkAt) { blinkT = clock; blinkAt = clock + 2.2 + 2.6 * Math.abs(Math.sin(clock * 12.9)); }
    const bt = clock - blinkT; eyes = Math.max(eyes, bt < 0.05 ? 0.5 : bt < 0.11 ? 1 : bt < 0.17 ? 0.5 : 0);
    if (talking && mv.name !== 'talk') {
      if (clock > mouthAt) { mouthAt = clock + 0.10 + 0.09 * Math.abs(Math.sin(clock * 37.7)); const r = Math.abs(Math.sin(clock * 91.3)); mouthNow = r < 0.30 ? 'rest' : r < 0.66 ? 'open' : r < 0.92 ? 'oo' : 'smile'; }
      mouth = mouthNow;
      if (mv.name === 'pose') { SK.head.rotation.set(0.030 * Math.sin(clock * 4.4) + 0.015, 0.045 * Math.sin(clock * 2.3 + 1), 0.020 * Math.sin(clock * 1.3)); SK.neck.rotation.set(0, 0.025 * Math.sin(clock * 2.3 + 1), 0); }
    } else if (mv.name === 'pose' && (SK.head.rotation.x || SK.head.rotation.y)) { SK.head.rotation.set(0, 0, 0); SK.neck.rotation.set(0, 0, 0); }
    if (mv.name === 'pose') { FXWANT.dummy = FXWANT.ally = FXWANT.ally2 = false; LEAF.visible = false; WAVE.visible = false; PAGES.visible = false; } else if (!SPELLS.includes(mv.name)) { LEAF.visible = false; WAVE.visible = false; }
    if (mv.name !== 'guardian') { SAP.visible = false; STAG.G.visible = false; ROOTS.visible = false; if (mv.name !== 'revive') SEED.visible = false; } if (mv.name !== 'garden') GARDEN.hide();
    if (mv.name !== 'thorn') { DAGGER.visible = false; CRACK.m.visible = false; CRACK.sp.visible = false; BRIAR.G.visible = false; } if (mv.name !== 'cradle') CRADLE.visible = false; if (mv.name !== 'revive') { FALLEN.G.visible = false; TRACE.G.visible = false; }
    fxTick(dt, FXWANT.dummy, FXWANT.ally, FXWANT.ally2);
    if (feel) emo = feel; if (held) { if (held.eyes != null) eyes = held.eyes; if (held.mouth) mouth = held.mouth; }
    const key = eyes + '|' + mouth + '|' + emo; if (key !== facePainted) { paintFace(eyes, mouth, emo); facePainted = key; }
  }
  const talk = (on) => { talking = !!on; mouthAt = 0; return talking; };
  const setFace = (eyes, mouth) => { held = eyes == null && !mouth ? null : { eyes, mouth }; facePainted = ''; animate(0); };
  const setFeel = (name) => { feel = FEELS.includes(name) ? name : null; facePainted = ''; animate(0); return feel; };       // hold one of her emotions (or none)
  return { root, skeleton, bones, SK, animate, pose, play, moves: MOVES, shots: SHOTS, reacts: ['hit', 'down', 'win'], settle: () => { sync(); softSettle(); root.updateMatrixWorld(true); }, meshes, spin: 0, time: 0, stanceProgress: 1, setStance() {}, talk, setFace, setFeel, feels: FEELS, spells: SPELLS, spellFx: { group: fxG, dummy: DUMMY, ally: ALLY, ally2: ALLY2, leaf: LEAF, parts: PT, view: FXVIEW }, wood: { STAG, SAP, SEED, ROOTS, sapSet, VINES, GARDEN, DAGGER, BRIAR, CRADLE, FALLEN, TRACE }, get moveT() { return mv.t; }, get feel() { return feel; }, setBlink: (on) => { blinking = !!on; }, setProps: (on) => { showProps = !!on; if (mv.name === 'pose') propVis(false, false); }, get move() { return mv.name; },
    debug: { textures: TEXLIST, SK, meshes, cloths: [], headPoint, headHalfW, JH, HC, FC, CHAINS, SOFT, COL, LEGCAP, LEGPAD, LEGS, HIP, SLV }, get triangles() { return triCount; } };
}
