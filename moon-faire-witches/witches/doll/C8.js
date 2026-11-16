// From chriskizer91-ops/moon-faire (read-only), branch claude/moon-faire-base-doll-light (commit ed42d9d),
// base-doll-light/moon_faire_base_doll_light.html, the script block data-f="wardrobe/C8", taken out unchanged.
// C8, the paladin (C8A.png, C8B.png): a polished steel cuirass (a breastplate with a sweetheart top edge and a pointed lower lame,
// a backplate up to her shoulder blades) held by two brown leather straps over her shoulders; big domed steel pauldrons, each a cap and
// one lame below it; chain-mail sleeves from under the pauldrons to her wrists; brown leather gloves with flared cuffs; under the steel
// a cream padded gambeson with a stand collar open at the throat, and over it a cream tabard: its bib (a gold sun on it) shows above the
// breastplate, and below a brown leather belt with a brass buckle it hangs in two panels split at her sides, to just above her knees;
// dark trousers; steel greaves over the fronts of tall brown boots, strapped round the back with two buckled straps each.
// Pieces: c8Gambeson, c8Collar, c8TabardBib, c8Emblem, c8TabardFront, c8TabardBack, c8Cuirass, c8StrapR/L, c8StrapRivets,
// c8PauldronR/L (cap and lame, rigid on the upper arm), c8MailR/L, c8GloveCuffR/L (her hands lend a leather material), c8Belt,
// c8Buckle, c8Trousers, c8BootR/L, c8GreaveStrapsR/L, c8GreaveBucklesR/L, c8GreaveR/L (rigid on the shin).
// The paintings show no plates on her forearms or knees (no rerebraces, couters, vambraces or knee cops): only mail there.
// She stands on the boots' soles: LIFT (C8_prep.json heel).
window.DOLLWEAR_DEFS = window.DOLLWEAR_DEFS || {};
DOLLWEAR_DEFS.C8 = {
  name: 'The paladin: steel cuirass and pauldrons, mail sleeves, cream tabard with a gold sun, greaves over brown boots', kind: 'outfit', hair: 'hair_bun',
  build(W) {
    const { THREE, sm, lerp, PI, TAU, cl, smin, smax, prof, DOLL } = W;
    const F = W.F, Fs = W.Fsnug;
    const LIFT = 0.022, LEG_DX = 0.013, LEG_DZ = -0.050;

    // ======================= materials =======================
    const steel = W.paint({ metal: 0.55, rough: 0.27, env: 1.0, emis: 0.34, color: '#e9f0ea' });      // a little green in the tint takes the paintings' plum cast off the steel
    const mailM = W.paint({ metal: 0.55, rough: 0.40, env: 0.9, emis: 0.30, color: '#dfe8e0' });
    const cream = W.paint({ rough: 0.90, emis: 0.30, env: 0.10, color: '#f2ece8' });
    const goldP = W.paint({ rough: 0.55, metal: 0.25, emis: 0.30, env: 0.5 });
    const leather = W.paint({ rough: 0.55, emis: 0.22, env: 0.45 });
    const bootL = W.paint({ rough: 0.50, emis: 0.22, env: 0.50 });
    const brass = W.std({ color: W.lin('#b48a40'), metalness: 0.85, roughness: 0.34, envMapIntensity: 1.1 });
    const rivetM = W.std({ color: W.lin('#a89a8c'), metalness: 0.85, roughness: 0.30, envMapIntensity: 1.1 });
    const gloveM = W.std({ color: W.lin('#432a21'), emissive: W.lin('#432a21'), emissiveIntensity: 0.22, roughness: 0.48, envMapIntensity: 0.55 });
    const trouM = W.std({ color: W.lin('#3d3534'), emissive: W.lin('#3d3534'), emissiveIntensity: 0.25, roughness: 0.92, envMapIntensity: 0.15 });

    // ======================= small geometry helpers =======================
    const norm = (v) => { const L = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / L, v[1] / L, v[2] / L]; };
    const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const add = (a, b, k) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
    const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const perp = (n) => { const u = norm(cross(n, Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0])); return [u, cross(n, u)]; };
    // smooth curve through keys [[x, y], ...] (Catmull-Rom on the keys, held flat beyond the ends)
    const curve = (K, x) => {
      const n = K.length; if (x <= K[0][0]) return K[0][1]; if (x >= K[n - 1][0]) return K[n - 1][1];
      let i = 1; while (K[i][0] < x) i++;
      const x0 = K[i - 1][0], x1 = K[i][0], t = (x - x0) / (x1 - x0), y0 = K[i - 1][1], y1 = K[i][1];
      const m0 = i > 1 ? (y1 - K[i - 2][1]) / (x1 - K[i - 2][0]) * (x1 - x0) : 0, m1 = i < n - 1 ? (K[i + 1][1] - y0) / (K[i + 1][0] - x0) * (x1 - x0) : 0;
      const t2 = t * t, t3 = t2 * t; return (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * m1;
    };
    function merge(list) {
      const pos = [], idx = [], nor = [], src = [];
      for (const g of list) { const b = pos.length / 3; for (const v of g.pos) pos.push(v); for (const i of g.idx) idx.push(i + b);
        const nn = g.nor || W.computeNormals(g.pos, g.idx); for (const v of nn) nor.push(v);
        const k = g.pos.length / 3; for (let i = 0; i < k; i++) src.push(g.src ? g.src[i] : -1); }
      return { pos, idx, nor, src };
    }
    function orient(g, rings) {                           // flip a loft's triangles if its middle ring faces inward
      const nor = W.computeNormals(g.pos, g.idx), m = Math.floor(rings.length / 2), r = rings[m], n = r.length, cols = n + 1;
      const c = r.reduce((a, p) => [a[0] + p[0] / n, a[1] + p[1] / n, a[2] + p[2] / n], [0, 0, 0]); let s = 0;
      for (let j = 0; j < n; j++) { const v = m * cols + j; s += nor[v * 3] * (g.pos[v * 3] - c[0]) + nor[v * 3 + 1] * (g.pos[v * 3 + 1] - c[1]) + nor[v * 3 + 2] * (g.pos[v * 3 + 2] - c[2]); }
      if (s < 0) for (let i = 0; i < g.idx.length; i += 3) { const t = g.idx[i + 1]; g.idx[i + 1] = g.idx[i + 2]; g.idx[i + 2] = t; }
      return g;
    }
    function tube(pts, r, NV, closed) {                   // a round cord along points (closed: a loop); r a number or r(k)
      NV = NV || 6; const rings = [], N = pts.length, rr = typeof r === 'function' ? r : () => r;
      for (let i = 0; i < N; i++) { const a = closed ? pts[(i - 1 + N) % N] : pts[Math.max(0, i - 1)], b = closed ? pts[(i + 1) % N] : pts[Math.min(N - 1, i + 1)], t = norm(sub(b, a)), [u, v] = perp(t), ring = [];
        for (let j = 0; j < NV; j++) { const p = (j / NV) * TAU; ring.push(add(add(pts[i], u, rr(i) * Math.cos(p)), v, rr(i) * Math.sin(p))); } rings.push(ring); }
      if (closed) rings.push(rings[0]);
      const g = orient(W.loft(rings, closed ? {} : { capA: true, capB: true }), rings);
      // which point of pts each vertex was made from
      const cols = NV + 1, nR = rings.length; g.ring = []; for (let v = 0; v < g.pos.length / 3; v++) g.ring.push(v < nR * cols ? Math.min(N - 1, Math.floor(v / cols) % N) : (v === nR * cols ? 0 : N - 1));
      return g;
    }
    function torus(c, n, R, r, NU, NV) {
      NU = NU || 16; NV = NV || 8; const [u, v] = perp(n), rings = [];
      for (let i = 0; i <= NU; i++) { const t = (i / NU) * TAU, d = [u[0] * Math.cos(t) + v[0] * Math.sin(t), u[1] * Math.cos(t) + v[1] * Math.sin(t), u[2] * Math.cos(t) + v[2] * Math.sin(t)], cc = add(c, d, R), ring = [];
        for (let j = 0; j < NV; j++) { const p = (j / NV) * TAU; ring.push(add(add(cc, d, r * Math.cos(p)), n, r * Math.sin(p))); } rings.push(ring); }
      return orient(W.loft(rings, {}), rings);
    }
    // a rounded-rectangle frame (a buckle): centre c, face direction n, width direction t, outer width w, height h, bar radius r
    function frame(c, n, t, w, h, r) {
      const up = norm(cross(n, t)), pts = [], rc = Math.min(w, h) * 0.22, NC = 5;
      const cs = [[w / 2 - rc, h / 2 - rc, 0], [-(w / 2 - rc), h / 2 - rc, PI / 2], [-(w / 2 - rc), -(h / 2 - rc), PI], [w / 2 - rc, -(h / 2 - rc), 1.5 * PI]];
      for (const [cx, cy, a0] of cs) for (let k = 0; k <= NC; k++) { const a = a0 + (PI / 2) * k / NC; pts.push(add(add(c, t, cx + rc * Math.cos(a)), up, cy + rc * Math.sin(a))); }
      return tube(pts, r, 6, true);
    }
    // a low dome (a rivet head) on a surface: centre c, outward n
    function dome(c, n, r, h) {
      const [u, v] = perp(n), rings = [];
      for (let i = 0; i <= 4; i++) { const t = (i / 4) * (PI / 2), ring = [];
        for (let j = 0; j < 10; j++) { const a = (j / 10) * TAU, rr = r * Math.cos(t); ring.push(add(add(add(c, u, rr * Math.cos(a)), v, rr * Math.sin(a)), n, h * Math.sin(t) - 0.0006)); } rings.push(ring); }
      return orient(W.loft(rings, { capB: true }), rings);
    }
    // where a ray from p along d first meets G < 0
    function hit(G, p, d, maxL) {
      let lo = 0, hi = -1; const st = 0.0015;
      for (let t = 0; t <= (maxL || 0.4); t += st) { if (G(p[0] + d[0] * t, p[1] + d[1] * t, p[2] + d[2] * t) < 0) { hi = t; lo = Math.max(0, t - st); break; } }
      if (hi < 0) return null;
      for (let i = 0; i < 22; i++) { const m = (lo + hi) / 2; if (G(p[0] + d[0] * m, p[1] + d[1] * m, p[2] + d[2] * m) < 0) hi = m; else lo = m; }
      return add(p, d, (lo + hi) / 2);
    }
    const grad = (G, p) => { const e = 0.0008; return norm([G(p[0] + e, p[1], p[2]) - G(p[0] - e, p[1], p[2]), G(p[0], p[1] + e, p[2]) - G(p[0], p[1] - e, p[2]), G(p[0], p[1], p[2] + e) - G(p[0], p[1], p[2] - e)]); };
    // how far out from c along the horizontal direction d her surface G stands at level `lev` (march in from rEst + 0.05)
    function reach(G, c, d, rEst, lev) {
      let r = rEst + 0.05, prev = G(c[0] + d[0] * r, c[1] + d[1] * r, c[2] + d[2] * r) - lev;
      if (prev < 0) { while (prev < 0 && r < 0.6) { r += 0.01; prev = G(c[0] + d[0] * r, c[1] + d[1] * r, c[2] + d[2] * r) - lev; } }
      let lo = r, hi = r;
      for (; r > 0; r -= 0.0025) { const v = G(c[0] + d[0] * r, c[1] + d[1] * r, c[2] + d[2] * r) - lev; if (v < 0) { lo = r; break; } hi = r; }
      if (r <= 0) return 0;
      for (let i = 0; i < 12; i++) { const m = (lo + hi) / 2; if (G(c[0] + d[0] * m, c[1] + d[1] * m, c[2] + d[2] * m) - lev < 0) lo = m; else hi = m; }
      return (lo + hi) / 2;
    }
    const ellR = (y, sa, ca) => { const t = W.trunkAt(y), zc = (t[1] + t[2]) / 2, rz = ca >= 0 ? t[1] - zc : zc - t[2]; return 1 / Math.hypot(sa / t[0], ca / rz); };
    // the middle of her trunk (front to back) by height, from a table (it is asked for very often)
    const TCY0 = 0.80, TCN = 1000, TCS = 0.70 / TCN, TC = new Float32Array(TCN + 1);
    for (let k = 0; k <= TCN; k++) { const t = W.trunkAt(TCY0 + k * TCS); TC[k] = (t[1] + t[2]) / 2; }
    const trunkC = (y) => { const f = cl((y - TCY0) / TCS, 0, TCN - 1e-6), k = Math.floor(f); return TC[k] + (TC[k + 1] - TC[k]) * (f - k); };
    const table = (fn, x0, x1, n) => { const T = new Float32Array(n + 1), st = (x1 - x0) / n; for (let k = 0; k <= n; k++) T[k] = fn(x0 + k * st);
      return (x) => { const f = cl((x - x0) / st, 0, n - 1e-6), k = Math.floor(f); return T[k] + (T[k + 1] - T[k]) * (f - k); }; };

    // ----- a plate (or any cloth with thickness): G[m][n] its outer surface; the inner surface th below it; a rolled bead along each
    // open edge (radius beads.A for row 0, .B the last row, .L column 0, .R the last column). o.ref(i, j): a point inside it (normals face
    // away). Returns the geometry and, for each vertex, the outer grid point it was made from (weights, paint) -----
    const PLATES = [];
    // the triangles of a closed surface G < 0 found on a grid (as W.surface makes them), without making a piece
    function surfGeo(G, box, h, keep) {
      const g = W.snets(G, box, h), pos = [], nor = [], used = new Int32Array(g.nv).fill(-1), idx = [];
      for (let t = 0; t < g.tris.length; t += 3) {
        if (keep) { let ok = false; for (let k = 0; k < 3; k++) { const v = g.tris[t + k]; if (keep(g.pos[v * 3], g.pos[v * 3 + 1], g.pos[v * 3 + 2])) { ok = true; break; } } if (!ok) continue; }
        for (let k = 0; k < 3; k++) { const v = g.tris[t + k];
          if (used[v] < 0) { used[v] = pos.length / 3; pos.push(g.pos[v * 3], g.pos[v * 3 + 1], g.pos[v * 3 + 2]); nor.push(g.nor[v * 3], g.nor[v * 3 + 1], g.nor[v * 3 + 2]); }
          idx.push(used[v]); }
      }
      return { pos, idx, nor };
    }
    function plate(G, th, closedU, o) {
      o = o || {};
      const m = G.length, n = G[0].length, cols = closedU ? n + 1 : n, bd = o.beads || {};
      const at = (i, j) => G[i][closedU ? ((j % n) + n) % n : Math.max(0, Math.min(n - 1, j))];
      const N = [];
      for (let i = 0; i < m; i++) { const row = []; for (let j = 0; j < n; j++) {
        const a = G[Math.max(0, i - 1)][j], b = G[Math.min(m - 1, i + 1)][j], c = at(i, j - 1), d = at(i, j + 1);
        let q = cross(sub(b, a), sub(d, c)); const r = sub(G[i][j], o.ref(i, j));
        if (Math.hypot(q[0], q[1], q[2]) < 1e-10) q = r;
        q = norm(q); if (dot(q, r) < 0) q = [-q[0], -q[1], -q[2]];
        row.push(q); } N.push(row); }
      const thA = typeof th === 'function' ? th : () => th;
      const pos = [], nor = [], idx = [], src = [];
      const vtx = (p, q, s) => { pos.push(p[0], p[1], p[2]); nor.push(q[0], q[1], q[2]); src.push(s); return pos.length / 3 - 1; };
      const OUT = [], IN = [];
      for (let i = 0; i < m; i++) for (let j = 0; j < cols; j++) { const jj = j % n; OUT.push(vtx(G[i][jj], N[i][jj], i * n + jj)); }
      for (let i = 0; i < m; i++) for (let j = 0; j < cols; j++) { const jj = j % n, q = N[i][jj], t = thA(i, jj); IN.push(vtx(add(G[i][jj], q, -t), [-q[0], -q[1], -q[2]], i * n + jj)); }
      const tri = (a, b, c, w) => { const pa = [pos[a * 3], pos[a * 3 + 1], pos[a * 3 + 2]], f = cross(sub([pos[b * 3], pos[b * 3 + 1], pos[b * 3 + 2]], pa), sub([pos[c * 3], pos[c * 3 + 1], pos[c * 3 + 2]], pa));
        if (dot(f, w) < 0) idx.push(a, c, b); else idx.push(a, b, c); };
      for (let i = 0; i < m - 1; i++) for (let j = 0; j < cols - 1; j++) {
        const k = i * cols + j, w = N[i][j % n], wi = [-w[0], -w[1], -w[2]];
        const A = [OUT[k], OUT[k + 1], OUT[k + cols + 1], OUT[k + cols]], B = [IN[k], IN[k + 1], IN[k + cols + 1], IN[k + cols]];
        tri(A[0], A[1], A[2], w); tri(A[0], A[2], A[3], w); tri(B[0], B[1], B[2], wi); tri(B[0], B[2], B[3], wi);
      }
      const parts = [{ pos, idx, nor, src }];
      const bead = (list, r, closed) => {                  // list of [i, j]
        const pts = list.map(([i, j]) => add(G[i][j], N[i][j], -thA(i, j) / 2));
        const g = tube(pts, r, o.nv || 6, closed); g.src = g.ring.map((k) => list[k][0] * n + list[k][1]); parts.push(g);
      };
      const row = (i) => { const l = []; for (let j = 0; j < n; j++) l.push([i, j]); return l; };
      const col = (j) => { const l = []; for (let i = 0; i < m; i++) l.push([i, j]); return l; };
      if (bd.A) bead(row(0), bd.A, closedU); if (bd.B) bead(row(m - 1), bd.B, closedU);
      if (!closedU) { if (bd.L) bead(col(0), bd.L, false); if (bd.R) bead(col(n - 1), bd.R, false); }
      const g = merge(parts); g.n = n; g.m = m; g.N = N;
      // the outer vertex of each grid point, so inner faces and beads can take its paint
      g.outer = new Int32Array(m * n).fill(-1); for (let v = 0; v < OUT.length; v++) { const s = src[OUT[v]]; if (g.outer[s] < 0) g.outer[s] = OUT[v]; }
      return g;
    }
    // a piece made from plates: weights per grid point (wg(gridIndex, x, y, z)) or per position; remembered for the paint fix
    function platePart(key, g, wf, mat, o) {
      const rec = W.part(key, { pos: g.pos, idx: g.idx, nor: g.nor }, (x, y, z, v) => wf(x, y, z, g.src[v]), Object.assign({ mat }, o || {}));
      PLATES.push({ key, g }); return rec;
    }

    // ======================= heights (measured on C8A; rest metres; she stands LIFT higher on the boots) =======================
    const NECK_SEAM = (x, z) => lerp(1.342, 1.356, sm(0.0, -0.06, z));     // where the collar is sewn to the gambeson
    const BELT_C = (z) => lerp(1.0135, 1.026, sm(0.05, -0.08, z)), BELT_H = 0.0165;
    const PANEL_TOP = 1.040, HEM = 0.515;

    // ======================= the cuirass: breastplate and backplate as one shell, standing off her body =======================
    const CU_TOP = [[0, 1.208], [0.40, 1.225], [0.78, 1.234], [1.05, 1.222], [1.30, 1.186], [1.57, 1.152], [1.76, 1.205], [1.95, 1.318], [2.15, 1.339], [PI, 1.336]];
    const CU_BOT = [[0, 1.032], [0.35, 1.046], [0.80, 1.060], [1.57, 1.066], [2.30, 1.074], [2.75, 1.064], [PI, 1.054]];
    const cuTopT = table((A) => curve(CU_TOP, A), 0, PI, 720), cuBotT = table((A) => A < 0.6 ? 1.032 + (curve(CU_BOT, 0.6) - 1.032) * Math.pow(A / 0.6, 1.1) : curve(CU_BOT, A), 0, PI, 720);
    const cuTop = (A) => cuTopT(Math.abs(A)), cuBot = (A) => cuBotT(Math.abs(A));
    const angT = (x, z, y) => Math.atan2(x, z - trunkC(y));      // angle round her trunk: 0 the front, PI/2 her left
    const cuOff = (A, y) => {
      const s2 = Math.pow(Math.sin(A), 2), front = sm(0.2, 0.7, Math.cos(A));
      const base = lerp(0.0110, 0.0125, front) + 0.004 * s2 * (1 - sm(1.10, 1.16, y));
      const armpit = sm(1.10, 1.16, y) * Math.pow(Math.abs(Math.sin(A)), 3);
      const lame = 0.0030 * sm(cuBot(A) + 0.031, cuBot(A) + 0.027, y);                   // the lower lame stands a little proud
      const ridge = 0.0030 * Math.exp(-Math.pow(A / 0.10, 2)) * sm(1.06, 1.12, y);     // the breastplate's middle ridge
      return lerp(base, 0.0062, armpit) + lame + ridge;
    };
    const wSp = (y) => {                                  // the cuirass bends only with her spine (no arms, no hips)
      if (y < 1.075) return [W.BI.spine1, 1];
      if (y < 1.16) { const u = sm(1.075, 1.16, y); return [W.BI.spine1, 1 - u, W.BI.spine2, u]; }
      const u = sm(1.16, 1.25, y); return [W.BI.spine2, 1 - u, W.BI.spine3, u];
    };
    {
      const NA = 104, NR = 30, G = [];
      for (let i = 0; i < NR; i++) { const t = i / (NR - 1), row = [];
        for (let j = 0; j < NA; j++) { const a = (j / NA) * TAU - PI, A = Math.abs(a), y = lerp(cuBot(A), cuTop(A), t), sa = Math.sin(a), ca = Math.cos(a), c = [0, y, trunkC(y)], d = [sa, 0, ca];
          const r = reach(Fs, c, d, ellR(y, sa, ca), cuOff(A, y)); row.push(add(c, d, r)); }
        G.push(row); }
      const g = plate(G, 0.0030, true, { ref: (i, j) => [0, G[i][j][1], trunkC(G[i][j][1])], beads: { A: 0.0026, B: 0.0026 } });
      platePart('c8Cuirass', g, (x, y, z) => wSp(y), steel);
    }

    // ======================= the gambeson: cream padding over her trunk, only where it may show (not deep under the cuirass) =======================
    const GAM_TH = 0.0040;
    const bibTop = (x) => 1.334 + 0.55 * Math.max(0, Math.abs(x) - 0.07);
    const deepCuir = (x, y, z) => { const A = Math.abs(angT(x, z, y)); return Math.min(y - (cuBot(A) + 0.014), (cuTop(A) - 0.015) - y); };
    const gamR = (x, y, z) => { const ax = Math.abs(x); const top = lerp(NECK_SEAM(x, z), 1.56, sm(0.058, 0.078, ax));
      return Math.max(BELT_C(z) + BELT_H - 0.010 - y, y - top, deepCuir(x, y, z), Math.min(y - 1.15, bibTop(x) - 0.018 - y, 0.106 - Math.abs(x), z - 0.02)); };
    W.snug('c8Gambeson', gamR, () => GAM_TH, [-0.21, 0.21, 1.00, 1.47, -0.16, 0.16], 0.0068, { mat: cream });

    // ----- the stand collar: round her neck from the seam, open in a narrow V at her throat -----
    {
      const NCZ = -0.021, NU = 64, NV = 9, G = [], WG = [];
      for (let i = 0; i < NV; i++) { const t = i / (NV - 1), row = [];
        for (let j = 0; j < NU; j++) {
          const u = j / (NU - 1), ao = lerp(0.035, 0.24, t), a = ao + (TAU - 2 * ao) * u, d = [Math.sin(a), 0, Math.cos(a)];
          const back = sm(0.6, 1.0, -Math.cos(a)), yb = NECK_SEAM(d[0] * 0.05, d[2] * 0.05) - 0.006, yt = lerp(1.389, 1.398, back), y = lerp(yb, yt, t);
          const r0 = reach(F, [0, y, NCZ], d, 0.05, 0), off = lerp(0.0055, 0.0098, t) + 0.0015 * sm(0.5, 1, t) * (1 - back);
          const p = add([0, y, NCZ], d, r0 + off); row.push(p);
          WG.push(W.wBody(...add([0, y, NCZ], d, r0 - 0.002)));
        } G.push(row); }
      const g = plate(G, 0.0026, false, { ref: (i, j) => [0, G[i][j][1], NCZ], beads: { B: 0.0019, L: 0.0019, R: 0.0019 } });
      platePart('c8Collar', g, (x, y, z, s) => WG[s], cream);
    }

    // ======================= the tabard's bib: over the gambeson in front, from its grey-edged neckline down under the breastplate =======================
    const BIB_TH = GAM_TH + 0.0030;
    const bibR = (x, y, z) => { const A = Math.abs(angT(x, z, y)); return Math.max(y - bibTop(x), (cuTop(A) - 0.026) - y, 0.004 - z, Math.abs(x) - 0.128); };
    W.snug('c8TabardBib', bibR, () => BIB_TH, [-0.14, 0.14, 1.17, 1.41, -0.02, 0.15], 0.0055, { mat: cream });
    // ----- the sun: a gold disc and sixteen wavy rays, a little raised on the bib (its colours come from the painting) -----
    {
      const SY = 1.233, R0 = 0.040, RT = 0.100;
      const sun = (x, y) => {
        const dx = x, dy = y - SY, d = Math.hypot(dx, dy), th = Math.atan2(dx, dy); let best = d - R0;
        if (d > R0 - 0.004) { const u = cl((d - R0) / (RT - R0), 0, 1), dl = 0.16 * Math.sin(u * PI * 1.5) * (0.045 / Math.max(d, 0.04)), w = 0.0090 * Math.pow(1 - u, 0.8) + 0.0006;
          const k0 = Math.round((th - dl) / (TAU / 16));
          for (let k = k0 - 1; k <= k0 + 1; k++) { const e = th - (k * TAU / 16) - dl;
            const v = d > RT ? Math.hypot(d - RT, e * d) : Math.abs(e) * d - w / 2; if (v < best) best = v; } }
        return best;
      };
      const embR = (x, y, z) => { if (z < 0.01) return 0.01 - z; if (Math.abs(Math.atan2(x, y - SY)) > 1.72) return 0.01; const lo = 1.236 - 0.02 * Math.abs(x) / 0.1; if (y < lo - 0.03) return lo - y; const r = sun(x, y) - 0.0025; if (r > 0.01) return r; const A = Math.abs(angT(x, z, y)); return Math.max(r, (cuTop(A) - 0.012) - y); };
      W.snug('c8Emblem', embR, () => BIB_TH + 0.0011, [-0.105, 0.105, 1.200, 1.34, 0.03, 0.125], 0.0044, { mat: goldP });
    }

    // ======================= the shoulder straps: over the bib in front, over her shoulders, onto the backplate =======================
    {
      const SX = 0.090, HW = 0.0115;
      const strapTh = (x, y, z) => { const onBack = sm(-0.030, -0.050, z) * sm(1.352, 1.338, y); return lerp(BIB_TH + 0.0030, 0.0170, onBack); };
      const strapR = (x, y, z) => Math.max(Math.abs(Math.abs(x) - SX) - HW, (z > 0 ? 1.296 : 1.300) - y);
      for (const [S, s] of [['R', -1], ['L', 1]])
        W.snug('c8Strap' + S, (x, y, z) => s * x < 0 ? 1 : strapR(x, y, z), strapTh, s < 0 ? [-0.115, -0.065, 1.28, 1.44, -0.12, 0.10] : [0.065, 0.115, 1.28, 1.44, -0.12, 0.10], 0.0030, { mat: leather });
      // rivets at the strap ends
      const rv = [];
      const sG = (x, y, z) => { const r = strapR(x, y, z); return smax(Fs(x, y, z) - strapTh(x, y, z), r, 0.0015); };
      for (const s of [-1, 1]) for (const [y, zf] of [[1.306, 1], [1.312, -1]]) {
        const p = hit(sG, [s * SX, y, zf * 0.25], [0, 0, -zf], 0.3); if (!p) continue; const n = grad(sG, p); rv.push(dome(p, n, 0.0042, 0.0026)); }
      const g = merge(rv);
      W.part('c8StrapRivets', g, (x, y, z) => z > 0 ? W.wBody(x, y, z - 0.02) : wSp(y), { mat: brass });
    }

    // ======================= the pauldrons: a domed cap over the ball of her shoulder and one lame below it, rigid on her upper arm =======================
    // Built in her arm's own frame (o out from her side square to the arm, u up the arm, f forward), so the painting's pose (arms 30 deg
    // out) and her rest pose (15 deg) see the same plate. Measured from the front painting in that pose.
    const sleeveAxis = (S, sl) => { const c = W.armPt(S, sl, 0), c2 = W.armPt(S, sl, PI); return [(c[0] + c2[0]) / 2, (c[1] + c2[1]) / 2, (c[2] + c2[2]) / 2]; };
    for (const [S, s] of [['R', -1], ['L', 1]]) {
      const J = [W.restPts['sh' + S].x, W.restPts['sh' + S].y, W.restPts['sh' + S].z], d = [W.armDir[S].x, W.armDir[S].y, W.armDir[S].z];
      const u = [-d[0], -d[1], -d[2]], f = [0, 0, 1], oo = norm([-d[1] * s, d[0] * s, 0]);      // out from her side, square to the arm
      const C = add(J, f, -0.008);
      const DEGR = PI / 180, phiMax = (ps) => (69.5 + 11 * Math.cos(ps) - 3 * Math.sin(ps) - 15.5 * Math.cos(2 * ps)) * DEGR;
      const NT = 16, NP = 56, G = [];
      for (let i = 0; i < NT; i++) { const t = i / (NT - 1), row = [];
        for (let j = 0; j < NP; j++) { const ps = (j / NP) * TAU, ph = t * phiMax(ps);
          const side = add(add([0, 0, 0], u, Math.cos(ps)), f, Math.sin(ps)), dir = norm(add(add([0, 0, 0], oo, Math.cos(ph)), side, Math.sin(ph)));
          const r = 0.0875 - 0.0105 * Math.max(0, Math.cos(ps)) * sm(0.3, 1.0, t) - 0.006 * Math.pow(Math.sin(ps), 2) * sm(0.4, 1, t) + 0.0035 * sm(0.80, 1.0, t);
          row.push(add(C, dir, r)); } G.push(row); }
      const cap = plate(G, 0.0030, true, { ref: () => C, beads: { B: 0.0028 } });
      // the lame: a band round the outer side of her arm below the cap, flaring out under it and closing in at its lower edge
      const NL = 10, NA = 30, L = [];
      for (let i = 0; i < NL; i++) { const t = i / (NL - 1), sl = lerp(0.040, 0.114, t), row = [];
        const off = curve([[0, 0.0175], [0.45, 0.0215], [1, 0.0085]], t), ax = sleeveAxis(S, sl);
        for (let j = 0; j < NA; j++) { const a = lerp(-1.75, 1.75, j / (NA - 1)), p = W.armPt(S, sl, a), dd = norm(sub(p, ax)); row.push(add(p, dd, off)); }
        L.push(row); }
      const lame = plate(L, 0.0028, false, { ref: (i) => sleeveAxis(S, lerp(0.040, 0.114, i / (NL - 1))), beads: { B: 0.0026, L: 0.0024, R: 0.0024 } });
      // rivets: two on the lame, one on the cap's front
      const rv = [];
      for (const [gg, i, j] of [[lame, 5, 5], [lame, 5, 24], [cap, 13, 14]]) { const GG = gg === lame ? L : G, p = GG[i][j], n = gg.N[i][j]; const r = dome(p, n, 0.0034, 0.0020); r.src = r.pos.map(() => -1).slice(0, r.pos.length / 3); rv.push(r); }
      const g = merge([cap, lame].concat(rv));
      // the paint fix needs the grid's outer vertices: keep the cap's (the lame and rivets take their own colour)
      g.outer = cap.outer; g.n = cap.n;
      const lameStart = cap.pos.length / 3, lameEnd = lameStart + lame.pos.length / 3;
      for (let v = lameStart; v < lameEnd; v++) g.src[v] = -2 - (lame.src[v - lameStart]);     // lame grid points, kept apart from the cap's
      g.outerL = new Int32Array(lame.outer.length); for (let k = 0; k < lame.outer.length; k++) g.outerL[k] = lame.outer[k] + lameStart;
      platePart('c8Pauldron' + S, g, () => W.wBone('uarm' + S), steel);
    }

    // ======================= the mail sleeves: from the top of her shoulder (under the pauldron) to her wrists =======================
    const mailBump = (() => {
      const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g = cv.getContext('2d');
      g.fillStyle = '#000'; g.fillRect(0, 0, 256, 256);
      const N = 8, s = 256 / N;
      for (let r = -1; r <= N; r++) for (let c = -1; c <= N; c++) { const x = (c + (r % 2 ? 0.5 : 0)) * s, y = r * s * 1.0;
        const gr = g.createRadialGradient(x, y, s * 0.18, x, y, s * 0.62); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.35, 'rgba(255,255,255,1)'); gr.addColorStop(0.7, 'rgba(160,160,160,0.9)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, s * 0.62, 0, TAU); g.fill(); }
      const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
    })();
    for (const S of ['R', 'L']) {
      const mat = mailM; mat.bumpMap = mailBump; mat.bumpScale = 0.9;
      const rec = W.sleeve('c8Mail' + S, S, -0.046, 0.405, (sl, a) => 0.0046 + 0.0012 * sm(0.20, 0.26, sl) * sm(0.32, 0.26, sl), { mat, nu: 40, ns: 64, capA: true });
      const uv = rec.mesh.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 6, uv.getY(i) * 9.5); uv.needsUpdate = true;
    }

    // ======================= the gloves: her hands in brown leather, a flared cuff over the end of the mail =======================
    W.swapMat('hand', gloveM); W.swapMat('handR', gloveM);
    for (const S of ['R', 'L']) {
      const NS = 12, NU = 40, G = [], SLs = [];
      for (let i = 0; i < NS; i++) { const t = i / (NS - 1), sl = lerp(0.372, 0.462, t), ax = sleeveAxis(S, sl), row = [];
        const off = 0.0030 + 0.0105 * Math.pow(sm(0.42, 0.372, sl), 1.3) - 0.0012 * sm(0.445, 0.462, sl);
        for (let j = 0; j < NU; j++) { const a = (j / NU) * TAU, p = W.armPt(S, sl, a), dd = norm(sub(p, ax)); row.push(add(p, dd, off)); }
        G.push(row); SLs.push(sl); }
      const g = plate(G, 0.0018, true, { ref: (i) => sleeveAxis(S, SLs[i]), beads: { A: 0.0017 } });
      platePart('c8GloveCuff' + S, g, (x, y, z, k) => W.wArmSL(S, SLs[Math.floor(k / NU)], ((k % NU) / NU) * TAU), gloveM);
    }

    // ======================= the trousers: dark, fitted, from under the belt into the boots =======================
    const BOOT_TOP = 0.416;
    W.snug('c8Trousers', (x, y, z) => Math.max(y - 1.035, BOOT_TOP - 0.035 - y), (x, y, z) => 0.0045 + 0.0012 * sm(0.50, 0.44, y), [-0.22, 0.22, BOOT_TOP - 0.045, 1.045, -0.17, 0.16], 0.0105, { mat: trouM });

    // ======================= the tabard's panels: front and back, split at her sides, hanging from under the belt to above her knees =======================
    const CLEAR = 0.0060, PTH = 0.0024, PANEL_G = [];
    {
      // the front panel: flat across her front, hugging her below the belt, hanging straight down over her thighs
      const NU = 24, NV = 34, G = [];
      for (let i = 0; i < NV; i++) { const t = i / (NV - 1), y = lerp(PANEL_TOP, HEM, Math.pow(t, 0.92)), row = [];
        const hug = sm(PANEL_TOP - 0.11, PANEL_TOP - 0.01, y);
        for (let j = 0; j < NU; j++) { const x = lerp(-0.115, 0.115, j / (NU - 1));
          const pb = hit(F, [x, y, 0.22], [0, 0, -1], 0.4), zb = pb ? pb[2] + CLEAR + 0.005 * sm(0.95, 0.80, y) : -1;
          const drape = 0.106 - 2.6 * x * x + 0.002 * Math.sin(x * 60) * sm(0.85, 0.6, y);
          row.push([x, y, lerp(Math.max(drape, zb), zb, hug)]); }
        G.push(row); }
      const g = plate(G, PTH, false, { ref: (i, j) => [G[i][j][0], G[i][j][1], G[i][j][2] - 0.1], beads: { B: 0.0016, L: 0.0016, R: 0.0016 } });
      platePart('c8TabardFront', g, (x, y, z) => W.wSkirt(x, y, z), cream); PANEL_G.push(G);
    }
    {
      // the back panel: wider, round the back of her hips and on round her sides to the slits
      const NU = 40, NV = 34, G = [], TM = 95 * PI / 180;
      const RX = [[0.515, 0.212], [0.79, 0.190], [0.91, 0.168], [1.04, 0.145]], ZB = [[0.515, -0.168], [0.92, -0.143], [1.04, -0.105]], ZF = [[0.515, -0.072], [1.04, -0.045]];
      for (let i = 0; i < NV; i++) { const t = i / (NV - 1), y = lerp(PANEL_TOP, HEM, Math.pow(t, 0.92)), row = [];
        const hug = sm(PANEL_TOP - 0.13, PANEL_TOP - 0.01, y), rx = curve(RX, y), zf = curve(ZF, y), zb = curve(ZB, y), rz = zf - zb, cz = -0.015;
        for (let j = 0; j < NU; j++) { const th = lerp(-TM, TM, j / (NU - 1)), p = [rx * Math.sin(th), y, zf - rz * Math.cos(th)];
          const d = norm([p[0], 0, p[2] - cz]), c = [0, y, cz], rb = reach(F, c, d, Math.hypot(p[0], p[2] - cz), CLEAR), re = Math.hypot(p[0], p[2] - cz);
          row.push(add(c, d, lerp(Math.max(re, rb), rb, hug))); }
        G.push(row); }
      const g = plate(G, PTH, false, { ref: (i, j) => [0, G[i][j][1], -0.015], beads: { B: 0.0016, L: 0.0016, R: 0.0016 } });
      platePart('c8TabardBack', g, (x, y, z) => W.wSkirt(x, y, Math.min(z, -0.036)), cream);      // only the chains from her sides round her back carry it PANEL_G.push(G);
    }

    // ======================= the belt: brown leather, riding a little higher behind; a brass buckle in front =======================
    {
      // a band round her (rays out from her middle to 12.5 mm off her body), 4 mm thick, its edges rounded
      const NA = 120, NR = 5, G = [], WG = [];
      for (let i = 0; i < NR; i++) { const t = i / (NR - 1), row = [];
        for (let j = 0; j < NA; j++) { const a = (j / NA) * TAU - PI, sa = Math.sin(a), ca = Math.cos(a), y = BELT_C(ca * 0.12) + lerp(-BELT_H, BELT_H, t), c = [0, y, trunkC(y)], d = [sa, 0, ca];
          const r = reach(Fs, c, d, ellR(y, sa, ca), 0.0125 - 0.0008 * Math.pow(2 * t - 1, 4)); row.push(add(c, d, r)); WG.push(W.wBody(...add(c, d, r - 0.016))); }
        G.push(row); }
      const gb = plate(G, 0.0042, true, { ref: (i, j) => [0, G[i][j][1], trunkC(G[i][j][1])], beads: { A: 0.0022, B: 0.0022 } });
      platePart('c8Belt', gb, (x, y, z, k) => WG[k], leather);
      const bc = G[2][NA / 2], n = gb.N[2][NA / 2], t = norm(cross([0, 1, 0], n));
      const parts = [frame(add(bc, n, 0.0024), n, t, 0.058, 0.042, 0.0034), tube([add(add(bc, n, 0.0010), t, -0.026), add(add(bc, n, 0.0042), t, -0.016), add(add(bc, n, 0.0042), t, 0.004), add(add(bc, n, 0.0030), t, 0.0275)], 0.0016, 6)];
      W.part('c8Buckle', merge(parts), () => W.wBone('hips'), { mat: brass });
    }

    // ======================= the boots: tall brown leather to just below her knees, a low heel =======================
    const LAST = [[-0.074, [-0.012, 0.012, 0.042]], [-0.066, [-0.028, 0.026, 0.058]], [-0.046, [-0.036, 0.034, 0.070]], [-0.020, [-0.038, 0.037, 0.079]], [0.010, [-0.040, 0.038, 0.089]],
      [0.040, [-0.041, 0.043, 0.088]], [0.070, [-0.043, 0.051, 0.072]], [0.100, [-0.046, 0.056, 0.052]], [0.118, [-0.047, 0.056, 0.046]], [0.133, [-0.046, 0.049, 0.042]],
      [0.147, [-0.042, 0.036, 0.038]], [0.160, [-0.032, 0.018, 0.034]], [0.170, [-0.014, -0.002, 0.030]]];
    const S0 = W.SOLE, L2 = [0, 0];
    const lastD = (X, Y, Z) => {
      const v0 = prof(LAST, Z - 0.007), v1 = prof(LAST, Z), v2 = prof(LAST, Z + 0.007), v = [0, 1, 2].map((k) => (v0[k] + 2 * v1[k] + v2[k]) / 4), xc = (v[0] + v[1]) / 2, rx = Math.max(0.002, (v[1] - v[0]) / 2), yc = S0 + 0.012, ry = Math.max(0.004, v[2] - 0.012);
      const ux = Math.abs(X - xc) / rx, uy = Y > yc ? (Y - yc) / ry : (yc - Y) / 0.016, q = Math.pow(Math.pow(ux, 2.6) + Math.pow(uy, 2.6), 1 / 2.6);
      return Math.max((q - 1) * Math.min(rx, Y > yc ? ry : 0.016), -0.076 - Z, Z - 0.173);
    };
    const archLift = (Z) => 0.0120 * sm(-0.034, -0.026, Z) * sm(0.080, 0.045, Z);
    const EX = (y) => prof([[0.08, 0.018], [0.16, 0.016], [0.26, 0.011], [0.36, 0.010], [0.44, 0.010]], y);
    const EZ = (y) => prof([[0.08, 0.013], [0.16, 0.012], [0.26, 0.009], [0.36, 0.008], [0.44, 0.008]], y);
    const shaftQ = (s, x, y, z, ex, ez) => {
      const L = W.legAt(cl(y, 0.10, 0.60)), cx = s * L[3], cz = L[4], rx = L[0] + ex, rf = L[1] + ez, rb = L[2] + ez;
      const dx = (x - cx) / rx, dz = (z - cz) / (z > cz ? rf : rb), q = Math.pow(Math.pow(Math.abs(dx), 2.4) + Math.pow(Math.abs(dz), 2.4), 1 / 2.4);
      return (q - 1) * Math.min(rx, rf, rb);
    };
    const shaft = (s, x, y, z) => shaftQ(s, x, y, z, EX(y), EZ(y));
    const angLeg = (s, x, y, z) => { const L = W.legAt(cl(y, 0.10, 0.60)); return Math.atan2(z - L[4], s * (x - s * L[3])); };    // 0 her outer side, PI/2 the front
    for (const [S, s] of [['R', -1], ['L', 1]]) {
      const leg = (x, y, z) => smin(shaft(s, x, y, z), DOLL.fLegOnly(s, x, y, z) - 0.0060, 0.008);
      const upper = (x, y, z) => {
        if (y > 0.16) { const sh = shaft(s, x, y, z); if (sh > 0.016) return smax(sh, y - BOOT_TOP, 0.0030); }
        DOLL.toLocal(s, x, z, L2); const X = L2[0], Z = L2[1];
        const l = y > 0.040 ? leg(x, y, z) + 0.5 * Math.max(0, 0.11 - y) : 1, top = BOOT_TOP - 0.024 * sm(-0.0035, -0.0095, l);
        return smax(y > 0.16 ? l : smin(l, lastD(X, y, Z), 0.020), y - top, 0.0030); };
      const sole = (x, y, z) => { DOLL.toLocal(s, x, z, L2); const X = L2[0], Z = L2[1];
        const plan = lastD(X, S0 + 0.012, Z) - 0.0030, yb = S0 - LIFT + archLift(Z), yt = S0 + 0.008;
        return smax(plan, Math.max(yb - y, y - yt), 0.0040); };
      // the foot and ankle from her surface (up to FOOT_Y), the shaft above as a lofted shell, its top edge rolled
      const FOOT_Y = 0.205;
      const G = (x, y, z) => Math.min(y > FOOT_Y + 0.012 ? y - FOOT_Y : upper(x, y, z), sole(x, y, z));
      const keep = (x, y, z) => y < FOOT_Y - 0.002 && !(y > 0.07 && DOLL.fLegOnly(s, x, y, z) < -0.002);
      const bx = s < 0 ? [-0.165, -0.005] : [0.005, 0.165];
      const foot = surfGeo(G, [bx[0], bx[1], S0 - LIFT - 0.006, FOOT_Y + 0.016, -0.10, 0.205], 0.0070, keep);
      const ring = (y, ex, ez, n, a0, a1) => { const L = W.legAt(cl(y, 0.10, 0.60)), out = [];
        for (let j = 0; j < n; j++) { const ang = a0 == null ? (j / n) * TAU : lerp(a0, a1, j / (n - 1)), ca = Math.cos(ang), sa = Math.sin(ang), k = Math.pow(Math.pow(Math.abs(ca), 2.4) + Math.pow(Math.abs(sa), 2.4), -1 / 2.4);
          out.push([s * L[3] + s * ca * k * (L[0] + ex), y, L[4] + sa * k * ((sa > 0 ? L[1] : L[2]) + ez)]); } return out; };
      const legC = (y) => { const L = W.legAt(cl(y, 0.10, 0.60)); return [s * L[3], y, L[4]]; };
      {
        const NR = 26, NA = 40, G2 = [];
        for (let i = 0; i < NR; i++) { const t = i / (NR - 1), y = lerp(0.168, BOOT_TOP, t), sh = -0.0012 * sm(0.21, 0.17, y); G2.push(ring(y, EX(y) + sh + 0.0005, EZ(y) + sh + 0.0005, NA)); }
        const g = plate(G2, 0.0028, true, { ref: (i) => legC(G2[i][0][1]), beads: { B: 0.0024 } });
        g.src = g.src.map(() => -1);
        // one mesh: the foot's surface and the shaft
        const mg = merge([foot, g]);
        W.part('c8Boot' + S, { pos: mg.pos, idx: mg.idx, nor: mg.nor }, (x, y, z) => W.wBody(x, Math.max(y, S0 + 0.004), z), { mat: bootL });
      }

      // ----- the greave's two straps round the back of the boot, buckled at the back of her outer side -----
      const SY = [0.381, 0.250], AC = -PI / 2, AW = 1.36, HB = 0.0085, ST = [];
      for (const yk of SY) {
        const NR = 4, NA = 34, G3 = [];
        for (let i = 0; i < NR; i++) { const y = yk + lerp(-HB, HB, i / (NR - 1)); G3.push(ring(y, EX(y) + 0.0032, EZ(y) + 0.0032, NA, AC - AW, AC + AW)); }
        ST.push(plate(G3, 0.0022, false, { ref: (i) => legC(G3[i][0][1]), beads: { A: 0.0013, B: 0.0013, L: 0.0013, R: 0.0013 } }));
      }
      const sg = merge(ST); sg.src = sg.src.map(() => -1);
      W.part('c8GreaveStraps' + S, { pos: sg.pos, idx: sg.idx, nor: sg.nor }, (x, y, z) => W.wBody(x, y, z), { mat: leather });
      const bk = [];
      for (const yk of SY) {
        const AB = -0.70, L = W.legAt(yk), k = Math.pow(Math.pow(Math.abs(Math.cos(AB)), 2.4) + Math.pow(Math.abs(Math.sin(AB)), 2.4), -1 / 2.4);
        const p = [s * L[3] + s * Math.cos(AB) * k * (L[0] + EX(yk) + 0.0055), yk, L[4] + Math.sin(AB) * k * (L[2] + EZ(yk) + 0.0055)];
        const n = norm([s * Math.cos(AB) / (L[0] + EX(yk)), 0, Math.sin(AB) / (L[2] + EZ(yk))]), t = norm(cross([0, 1, 0], n));
        bk.push(frame(add(p, n, 0.0012), n, t, 0.020, 0.020, 0.0017));
        bk.push(tube([add(add(p, n, 0.0006), t, -0.0080), add(add(p, n, 0.0032), t, 0.0), add(add(p, n, 0.0022), t, 0.0070)], 0.0010, 5));
      }
      W.part('c8GreaveBuckles' + S, merge(bk), (x, y, z) => W.wBody(x, y, z), { mat: brass });

      // ----- the greave: a steel shell over the front of her shin, a ridge down its middle, rigid on her shin -----
      {
        const NR = 26, NA = 34, AG = 1.80, G = [];
        const yt = (a) => 0.448 - 0.024 * Math.pow(Math.min(1, Math.abs(a) / 0.95), 0.8), yb = (a) => 0.150 + 0.016 * sm(0, 1.3, Math.abs(a));
        for (let i = 0; i < NR; i++) { const t = i / (NR - 1), row = [];
          for (let j = 0; j < NA; j++) { const a = lerp(-AG, AG, j / (NA - 1)), y = lerp(yb(a), yt(a), t), L = W.legAt(cl(y, 0.10, 0.60));
            const off = 0.0105 + 0.0045 * Math.exp(-Math.pow(a / 0.16, 2)) + 0.007 * sm(0.40, 0.45, y) + 0.005 * sm(0.20, 0.15, y);
            const rx = L[0] + EX(y) + off, rf = L[1] + EZ(y) + off, rb = L[2] + EZ(y) + off;
            // a = 0 the front, + toward her outer side; the shell's section is the boot's rounded section, pushed out
            const ang = PI / 2 - a, ca = Math.cos(ang), sa = Math.sin(ang), k = Math.pow(Math.pow(Math.abs(ca), 2.4) + Math.pow(Math.abs(sa), 2.4), -1 / 2.4);
            const dx = ca * k * rx, dz = sa * k * (sa > 0 ? rf : rb);
            row.push([s * L[3] + s * dx, y, L[4] + dz]); }
          G.push(row); }
        const g = plate(G, 0.0030, false, { ref: (i, j) => { const y = G[i][j][1], L = W.legAt(cl(y, 0.10, 0.60)); return [s * L[3], y, L[4]]; }, beads: { A: 0.0026, B: 0.0026, L: 0.0026, R: 0.0026 } });
        const rv = [];
        for (const [i, j] of [[NR - 4, 3], [NR - 4, NA - 4], [3, 3], [3, NA - 4], [Math.round(NR * 0.22), 1], [Math.round(NR * 0.78), 1], [Math.round(NR * 0.22), NA - 2], [Math.round(NR * 0.78), NA - 2]]) { const r = dome(G[i][j], g.N[i][j], 0.0030, 0.0018); r.src = new Array(r.pos.length / 3).fill(-1); rv.push(r); }
        const gg = merge([g].concat(rv)); gg.outer = g.outer; gg.n = g.n;
        platePart('c8Greave' + S, gg, () => W.wBone('shin' + S), steel);
      }
    }
    W.onFrame((SK) => { SK.hips.position.y += LIFT; SK.hips.updateMatrixWorld(true); });

    // ======================= her legs keep out of the tabard's panels (as wardrobe/D1.js and D2.js do it) =======================
    {
      const T3 = W.THREE, CH = W.chains.filter((c) => c.grp === 'skirt'), PAD = 0.085, NC = CH.length, NL = CH[0].names.length;
      const tipOff = CH.map((c) => c.names.map((nm, k) => new T3.Vector3().subVectors(c.pts[k + 1], c.pts[k])));
      // The chains hang well outside the panels (they were made for her own wide skirt), so the push is worked out for the point of
      // the panels each chain carries at that height (where a panel is there; elsewhere the chain's own point): a leg is kept as far
      // from the panel as it is at rest.
      const panelAt = (a, y, fb) => { let best = null, bd = 0.26;
        for (const G of PANEL_G) { let ri = 0, dy = 9; for (let i = 0; i < G.length; i++) { const e = Math.abs(G[i][0][1] - y); if (e < dy) { dy = e; ri = i; } }
          if (dy > 0.02) continue;
          for (const p of G[ri]) { const e = Math.abs(Math.atan2(p[0], p[2] + 0.015) - a); const ee = Math.min(e, TAU - e); if (ee < bd) { bd = ee; best = p; } } }
        return best ? new T3.Vector3(best[0], best[1], best[2]) : fb.clone(); };
      const VT = CH.map((c) => c.names.map((nm, k) => panelAt(c.a, c.pts[k + 1].y, c.pts[k + 1]).sub(c.pts[k])));
      const FR = [0.25, 0.5, 0.75];                     // more points along each bone than its tip: the cloth between levels is kept clear too
      const VM = FR.map((f) => CH.map((c) => c.names.map((nm, k) => panelAt(c.a, lerp(c.pts[k].y, c.pts[k + 1].y, f), new T3.Vector3().copy(c.pts[k]).lerp(c.pts[k + 1], f)).sub(c.pts[k]))));
      const A = new T3.Vector3(), Hc = new T3.Vector3(), E = new T3.Vector3(), V = new T3.Vector3(), M = new T3.Vector3();
      const pq = new T3.Quaternion();
      const legs = [];
      for (const S of ['R', 'L']) legs.push([new T3.Vector3(), new T3.Vector3(), 0.078, 0.056, 'thigh' + S, 'shin' + S], [new T3.Vector3(), new T3.Vector3(), 0.060, 0.046, 'shin' + S, 'foot' + S]);
      const restOf = (p) => { const out = []; for (const L of legs) { const a = W.SK[L[4]].userData.rest, b = W.SK[L[5]].userData.rest;
        for (let j = 0; j <= 5; j++) out.push(V.copy(a).lerp(b, j / 5).distanceTo(p)); } return out; };
      const restT = CH.map((c) => c.names.map((nm, k) => restOf(M.copy(c.pts[k]).add(VT[CH.indexOf(c)][k]))));
      const restM = VM.map((V2) => CH.map((c, ci) => c.names.map((nm, k) => restOf(M.copy(c.pts[k]).add(V2[ci][k])))));
      const push = (p, RD, out) => {
        E.set(p.x - Hc.x, 0, p.z - Hc.z); const rl = E.length(); if (rl < 1e-4) return false; E.multiplyScalar(1 / rl);
        let sOut = 0, sUp = 0;
        legs.forEach((L, li) => { for (let k = 0; k <= 5; k++) { const t = k / 5; V.copy(L[0]).lerp(L[1], t); const R = Math.min(L[2] + (L[3] - L[2]) * t + PAD, RD[li * 6 + k] - 0.004);
          const vx = p.x - V.x, vy = p.y - V.y, vz = p.z - V.z, cc = vx * vx + vy * vy + vz * vz - R * R; if (cc >= 0) continue;
          const b1 = vx * E.x + vz * E.z, q1 = b1 * b1 - cc; if (q1 > 0) sOut = Math.max(sOut, -b1 + Math.sqrt(q1)); const q2 = vy * vy - cc; if (q2 > 0) sUp = Math.max(sUp, -vy + Math.sqrt(q2)); } });
        if (sOut <= 1e-4 && sUp <= 1e-4) return false;
        if (sOut <= 1e-4) return false; out.copy(E).multiplyScalar(sOut); return true;      // out only: a side or back panel is never lifted up
      };
      const P = CH.map(() => new T3.Vector3()), Tp = CH.map(() => new T3.Vector3()), Q = CH.map(() => new T3.Quaternion()), ANG = new Float32Array(NC), dm = new T3.Vector3();
      const DIR0 = CH.map((c) => c.names.map(() => new T3.Vector3())), dT = new T3.Vector3(), dM = new T3.Vector3(), cur = new T3.Vector3(), qa = new T3.Quaternion();
      const turn = (b, qw) => { b.parent.getWorldQuaternion(pq); b.quaternion.premultiply(pq.clone().invert().multiply(qw).multiply(pq)); b.updateMatrixWorld(true); };
      const tipOf = (ci, k, b, out, off) => out.copy((off || tipOff)[ci][k]).applyMatrix4(b.matrixWorld).sub(A.setFromMatrixPosition(b.matrixWorld)).add(b.getWorldPosition(V));
      // The chains under the front panel (0, 30 and 60 degrees each side) do not take the push: a thigh raised in front (a stride, a
      // kneel, a squat) lifts them as one, turning the panel forward about its top by as much as the thigh is raised (and a little more),
      // so the panel lies over the thigh. The chains round her back and sides take the push.
      const wrapA = (a) => { a = ((a + PI) % TAU + TAU) % TAU - PI; return a; };
      const FRONT = CH.map((c) => Math.abs(wrapA(c.a)) < 1.2);
      const fSide = CH.map((c) => { const a = wrapA(c.a); return { L: sm(-0.7, -0.2, a), R: sm(0.7, 0.2, a) }; });
      const qh = new T3.Quaternion(), qhi = new T3.Quaternion(), vT = new T3.Vector3(), ax = new T3.Vector3(), hp = new T3.Vector3(), kn = new T3.Vector3();
      const pitchOf = (S2, SK) => { SK['thigh' + S2].getWorldPosition(hp); SK['shin' + S2].getWorldPosition(kn); vT.subVectors(kn, hp).applyQuaternion(qhi); return Math.atan2(vT.z, -vT.y); };
      W.onFrame((SK) => {
        for (const L of legs) { SK[L[4]].getWorldPosition(L[0]); SK[L[5]].getWorldPosition(L[1]); }
        SK.hips.getWorldPosition(Hc);
        SK.hips.getWorldQuaternion(qh); qhi.copy(qh).invert(); ax.set(1, 0, 0).applyQuaternion(qh);
        { const pR = pitchOf('R', SK), pL = pitchOf('L', SK);
          for (let ci = 0; ci < NC; ci++) { if (!FRONT[ci]) continue;
            const want = Math.max(fSide[ci].R * pR, fSide[ci].L * pL) + 0.06; if (want <= 0.06) continue;
            const b = SK[CH[ci].names[0]]; b.getWorldPosition(M); tipOf(ci, 0, b, cur).sub(M).applyQuaternion(qhi);
            const p0 = Math.atan2(cur.z, -cur.y);
            if (p0 < want) turn(b, qa.setFromAxisAngle(ax, -(want - p0)));
            // a thigh raised well up: the panel lies along it, flat, as far as the knee (its swing and sway set aside)
            const u = sm(0.30, 0.70, want); if (u <= 0) continue;
            for (let k = 0; k < 5; k++) { const bk = SK[CH[ci].names[k]]; bk.getWorldPosition(M); tipOf(ci, k, bk, cur).sub(M).normalize();
              if (k < 3) dT.subVectors(CH[ci].pts[k + 1], CH[ci].pts[k]).normalize().applyAxisAngle(V.set(1, 0, 0), -want).applyQuaternion(qh);
              else dT.set(0, -1, 0.15).normalize();        // beyond her knee it falls again
              dM.copy(cur).lerp(dT, u).normalize(); if (cur.dot(dM) < 0.99999) turn(bk, qa.setFromUnitVectors(cur, dM)); } } }
        for (let ci = 0; ci < NC; ci++) for (let k = 0; k < NL; k++) { const b = SK[CH[ci].names[k]]; b.getWorldPosition(M); tipOf(ci, k, b, DIR0[ci][k]).sub(M).normalize(); }
        for (let k = 0; k < NL; k++) {
          for (let ci = 0; ci < NC; ci++) {
            ANG[ci] = 0; Q[ci].identity(); if (FRONT[ci]) continue;
            const b = SK[CH[ci].names[k]];
            if (k > 0) { b.getWorldPosition(P[ci]); cur.copy(tipOf(ci, k, b, Tp[ci])).sub(P[ci]).normalize(); if (cur.dot(DIR0[ci][k]) < 0.99999) turn(b, qa.setFromUnitVectors(cur, DIR0[ci][k])); }
            b.getWorldPosition(P[ci]); tipOf(ci, k, b, Tp[ci], VT); cur.copy(Tp[ci]).sub(P[ci]).normalize();
            ANG[ci] = 0; Q[ci].identity();
            let best = 0;
            if (push(Tp[ci], restT[ci][k], dm)) { dT.copy(Tp[ci]).add(dm).sub(P[ci]).normalize(); const a = Math.acos(cl(cur.dot(dT), -1, 1)); if (a > best) { best = a; Q[ci].setFromUnitVectors(cur, dT); } }
            for (let fi = 0; fi < FR.length; fi++) {
              tipOf(ci, k, b, M, VM[fi]); const cm = dm.copy(M).sub(P[ci]).normalize().clone();
              if (push(M, restM[fi][ci][k], dm)) { dM.copy(M).add(dm).sub(P[ci]).normalize(); const a = Math.acos(cl(cm.dot(dM), -1, 1)); if (a > best) { best = a; Q[ci].setFromUnitVectors(cm, dM); } } }
            ANG[ci] = best;
          }
          for (let ci = 0; ci < NC; ci++) {
            if (FRONT[ci]) continue;
            let qq = Q[ci], a0 = ANG[ci];
            for (const cj of [(ci + 1) % NC, (ci + NC - 1) % NC]) if (ANG[cj] * 0.8 > a0) { a0 = ANG[cj] * 0.8; qq = new T3.Quaternion().slerp(Q[cj], 0.8); }
            if (a0 > 1e-4) turn(SK[CH[ci].names[k]], qq === Q[ci] ? Q[ci] : qq);
          }
        }
      });
    }

    // ======================= paint corrections =======================
    W.afterPaint((parts) => {
      const byKey = {}; for (const p of parts) byKey[p.key] = p.mesh;
      const ATT = ['aPP', 'aPN', 'aPE'];
      // inner faces and rolled edges of plates and panels take the paint of the outer surface they belong to
      for (const { key, g } of PLATES) { const mesh = byKey[key]; if (!mesh) continue;
        for (const k of ATT) { const at = mesh.geometry.attributes[k]; if (!at) continue; const A = at.array;
          for (let v = 0; v < g.src.length; v++) { const s = g.src[v]; let o = -1;
            if (s >= 0 && g.outer) o = g.outer[s]; else if (s <= -2 && g.outerL) o = g.outerL[-2 - s];
            if (o >= 0 && o !== v) { A[v * 3] = A[o * 3]; A[v * 3 + 1] = A[o * 3 + 1]; A[v * 3 + 2] = A[o * 3 + 2]; } }
          at.needsUpdate = true; } }
      // the side painting has her arm and glove hanging over her side from the shoulder to the hip: pieces there take the front and back
      const noSide = (mesh, f) => { const P = mesh.geometry.attributes.aPP, E = mesh.geometry.attributes.aPE; if (!P || !E) return;
        for (let i = 0; i < P.count; i++) { const k = f(P.array[i * 3], P.array[i * 3 + 1], P.array[i * 3 + 2]); if (k > 0) E.array[i * 3 + 2] *= 1 - k; } E.needsUpdate = true; };
      const armBand = (x, y, z) => sm(-0.095, -0.080, z) * sm(0.050, 0.035, z) * sm(0.66, 0.70, y) * sm(1.27, 1.24, y);
      for (const k of ['c8Cuirass', 'c8Belt', 'c8Gambeson', 'c8TabardBack']) if (byKey[k]) noSide(byKey[k], armBand);
      if (byKey.c8TabardFront) noSide(byKey.c8TabardFront, () => 1);
      // the back painting shows her trousers through the slits beside the back panel: its sides take the side painting (read a
      // little further back, clear of the slit), never the front painting
      if (byKey.c8TabardBack) { const P = byKey.c8TabardBack.geometry.attributes.aPP, E = byKey.c8TabardBack.geometry.attributes.aPE;
        for (let i = 0; i < P.count; i++) { const ax = Math.abs(P.array[i * 3]); E.array[i * 3 + 1] *= 1 - sm(0.118, 0.140, ax); E.array[i * 3] = 0; P.array[i * 3 + 2] -= 0.012 + 0.012 * sm(-0.10, -0.05, P.array[i * 3 + 2]); }
        E.needsUpdate = true; P.needsUpdate = true; }
      // the front panel's painted edges lie right against the dark slits: read a little inside them
      if (byKey.c8TabardFront) { const P = byKey.c8TabardFront.geometry.attributes.aPP; for (let i = 0; i < P.count; i++) P.array[i * 3] *= 0.94; P.needsUpdate = true; }
      // her painted legs stand a little wider apart and further back (side view) than hers: leg pieces read the paintings there
      for (const k of ['c8BootR', 'c8BootL', 'c8GreaveR', 'c8GreaveL', 'c8GreaveStrapsR', 'c8GreaveStrapsL']) { const m = byKey[k]; if (!m) continue; const P = m.geometry.attributes.aPP;
        if (!P) continue; const sg = /R$/.test(k) ? -1 : 1;
        for (let i = 0; i < P.count; i++) { P.array[i * 3] += sg * LEG_DX; P.array[i * 3 + 2] += LEG_DZ; } P.needsUpdate = true; }
    });

    // ======================= what cannot be seen =======================
    W.hideMeshes(['wearBra', 'wearShorts', 'toenail']);
    W.hideSkin((x, y, z) => y < 1.330, ['dollTrunk']);
    W.hideSkin(() => true, ['dollLeg', 'dollFoot', 'arm']);
  },
};
