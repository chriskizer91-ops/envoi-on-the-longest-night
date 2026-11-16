// From chriskizer91-ops/moon-faire (read-only), branch claude/moon-faire-base-doll-light (commit ed42d9d),
// base-doll-light/moon_faire_base_doll_light.html, the script block data-f="wardrobe/hair_bun", taken out unchanged.
// hair_bun: the bun Io wears in every outfit painting (D5A, D7A, M1A, M2A, D2VB, TO1 ...): her long dark-brown hair pulled back
// smoothly from her face and twisted into a neat, fairly large bun high on the back of her head; her neck, shoulders and back clear.
// Pieces (all on her head bone, except where the hair at her nape blends toward her neck, so it follows when she turns or nods):
//   hbCap   the hair over her whole scalp, from her hairline (forehead, temples, in front of and above her ears, round behind them and
//           down to her nape at the level of her ear lobes) drawn back to the bun's foot. It is laid out round the point under the bun,
//           so every strand runs from her hairline to the bun, gathered into separate locks of uneven width and height with grooves
//           between them (a little darker in the grooves). Fuller over her temples and above her ears, as in the paintings.
//   hbEdge  the last centimetre of the hair all round her hairline: strands lying on her skin that thin out to their tips, so skin
//           shows through gradually (front, temples, nape) instead of the hair ending in a hard line. Over her forehead the hair lies
//           close to her head for its first few centimetres, running straight up and back, then lifts a little toward the crown.
//   hbLock  twenty-two loose locks (six of them sweeping up and back from a few centimetres behind the front of her hairline) lying on top of the rest, lifted a little in the middle, from near her hairline back to the bun.
//   hbBun   the bun: a rope of hair coiled round and round (a spiral groove between its turns, a slight twist along the rope), its
//           strands following the coil; the coil's end tucked into its middle.
//   hbWisp  two small loose curls at each temple, in front of her ears: thin round strands.
// Its strands are a strand picture made here (once per page) in the paintings' browns; the soft rim light of her own hair is reused.
window.DOLLWEAR_DEFS = window.DOLLWEAR_DEFS || {};
DOLLWEAR_DEFS.hair_bun = {
  name: 'Bun', kind: 'hair',
  build(W) {
    const { sm, lerp, cl, prof, PI, TAU, V3 } = W, H = W.hair, C0 = H.HCX, HEAD = W.wBone('head'), head = () => HEAD;
    const tm = W.meshes.tress.material;                                           // her own long hair's material: only its sheen is borrowed
    const P = Object.assign({ tint: '#ffffff', emis: 0.16, rough: 0.60 }, this.opts || {});       // DOLLWEAR_DEFS.hair_bun.opts may change any of these (tint recolours it)
    // ----- her strands, in the paintings' browns (sampled from D5A and M2A: #221816 in the shadows, #3c2821 the middle, #6b4b3c
    // the highlights): a strand picture that tiles both ways, strands running up it, gathered into soft lighter and darker bunches.
    // Made once and kept (window.__hairBunTex), so wearing it again costs nothing.
    const TX = window.__hairBunTex || (window.__hairBunTex = (function () {
      const THREE = W.THREE, WD = 1024, HT = 512;
      const mk = () => {
        const c = document.createElement('canvas'); c.width = WD; c.height = HT; const g = c.getContext('2d');
        let sd = 7311; const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
        const cols = ['#24170f', '#2c1d15', '#35231a', '#3f2a20', '#4a3226', '#583c2e', '#6a4a39', '#7e5a45'];
        g.fillStyle = '#3a271e'; g.fillRect(0, 0, WD, HT);
        // soft bunches: broad lighter and darker bands across the picture (whole numbers of waves, so it tiles)
        const lightAt = (u) => 0.46 + 0.10 * Math.sin(u * 6.2832 + 0.4) + 0.07 * Math.sin(u * 6.2832 * 3 + 1.9);
        
        for (let i = 0; i < 6500; i++) {                      // bunches of strands and single strands, of different lengths, so no line runs the whole way
          const x = r() * WD, l = Math.min(0.999, Math.max(0, lightAt(x / WD) + (r() - 0.5) * 0.60)), ci = Math.floor(l * cols.length), big = r() < 0.4;
          g.strokeStyle = cols[Math.min(cols.length - 1, ci)];
          g.globalAlpha = big ? 0.14 + 0.22 * r() : 0.35 + 0.40 * r(); g.lineWidth = big ? 3 + 6 * r() : 0.8 + 1.4 * r();
          const wob = 6 * (r() - 0.5), ph = r() * 6.28, y0 = r() * HT, len = HT * (0.25 + 0.75 * r());
          for (const ox of [-WD, 0, WD]) for (const oy of [-HT, 0]) { if (x + ox < -12 || x + ox > WD + 12) continue;
            g.beginPath(); for (let y = 0; y <= len; y += 16) { const yy = y0 + oy + y, xx = x + ox + wob * Math.sin((yy / HT) * 6.2832 + ph); if (y) g.lineTo(xx, yy); else g.moveTo(xx, yy); } g.stroke(); }
        }
        g.globalAlpha = 1;
        const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; t.encoding = THREE.sRGBEncoding; return t;
      };
      // the edge band's strands: solid in the lower half of the picture (v 0 to 0.5), then strands that taper to tips at different heights
      const ea = (() => { const WD = 1024, HT = 256, c = document.createElement('canvas'); c.width = WD; c.height = HT; const g = c.getContext('2d'); let sd = 9157; const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
        g.fillStyle = '#000'; g.fillRect(0, 0, WD, HT); g.fillStyle = '#fff'; g.fillRect(0, HT * 0.88, WD, HT);
        g.strokeStyle = '#fff'; g.lineCap = 'round';
        for (let i = 0; i < 4200; i++) {                  // fine single hairs, each growing from its own place and running back into the rest
          const x = r() * WD, top = HT * (0.03 + 0.86 * Math.pow(r(), 0.50)), lean = 8 * (r() - 0.5);
          g.globalAlpha = 0.55 + 0.45 * r(); g.lineWidth = 1.0 + 1.3 * r();
          for (const ox of [-WD, 0, WD]) { g.beginPath(); g.moveTo(x + ox + lean, top); g.quadraticCurveTo(x + ox + lean * 0.3, (top + HT * 0.92) / 2, x + ox, HT * 0.92); g.stroke(); }
        }
        g.globalAlpha = 1;
        const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; return t; })();
      return { map: mk(), edgeA: ea };
    })());
    // ----- materials -----
    const hairMat = (o) => {
      const m = W.std(Object.assign({ map: TX.map, color: W.lin(P.tint), roughness: P.rough, envMapIntensity: 0.12, emissive: W.lin('#ffffff'), emissiveMap: TX.map, emissiveIntensity: P.emis }, o || {}));
      if (tm.onBeforeCompile && tm.userData.sheen) { m.userData.sheen = tm.userData.sheen; m.onBeforeCompile = tm.onBeforeCompile; }
      return m;
    };
    const capMat = hairMat({ vertexColors: true }), bunMat = hairMat({ vertexColors: true, roughness: P.rough + 0.02 });
    const edgeMat = hairMat({ alphaMap: TX.edgeA, transparent: true, depthWrite: false, alphaTest: 0.02, color: W.lin(P.tint).multiplyScalar(1.5), emissiveIntensity: P.emis + 0.10 });      // fine hairs over skin read a little lighter
    const wispMat = hairMat({ emissiveIntensity: P.emis + 0.05 });

    // ----- small tools -----
    const unit = (x, y, z) => { const L = Math.hypot(x, y, z); return V3(x / L, y / L, z / L); };
    const angOf = (d) => [Math.atan2(d.x, d.z), Math.acos(cl(d.y, -1, 1))];
    // her skin's distance from her head's middle in a direction. D41's skull map (SKR) is coarse (5 degrees), and below her ears, where
    // her head draws in to her neck, its mesh's flat facets stand out of the smooth shape; so from her temples down a finer map is read
    // off the head mesh's own triangles, and below her head at the back her neck (W.F) is used where it stands further out.
    const FINE = window.__hairBunSkull || (window.__hairBunSkull = (function () {
      // read off her head mesh itself (head and neck, not her ears), every triangle sampled, so the hair clears its flat facets too
      const NT = 720, P0 = 1.30, P1 = 2.95, NP = 330, m = new Float32Array(NT * NP), g = W.meshes.face.geometry, A = g.attributes.position.array, ix = g.index.array;
      const put = (x, y, z) => { const dx = x - C0.x, dy = y - C0.y, dz = z - C0.z, r = Math.hypot(dx, dy, dz), ph = Math.acos(cl(dy / r, -1, 1)); if (ph < P0 || ph > P1) return;
        const it = Math.floor(((Math.atan2(dx, dz) + PI) / TAU) * NT) % NT, ip = Math.min(NP - 1, Math.floor((ph - P0) / (P1 - P0) * NP)), k = ip * NT + it; if (r > m[k]) m[k] = r; };
      const ear = (x, y, z) => Math.abs(x) > 0.045 && Math.pow((z + 0.024) / 0.024, 2) + Math.pow((y - 1.491) / 0.036, 2) < 1;
      for (let t = 0; t < ix.length; t += 3) {
        const a = ix[t] * 3, b = ix[t + 1] * 3, c = ix[t + 2] * 3, cx = (A[a] + A[b] + A[c]) / 3, cy = (A[a + 1] + A[b + 1] + A[c + 1]) / 3, cz = (A[a + 2] + A[b + 2] + A[c + 2]) / 3;
        if (cy > 1.60 || cy < 1.36 || ear(cx, cy, cz)) continue;
        const L = Math.max(Math.hypot(A[a] - A[b], A[a + 1] - A[b + 1], A[a + 2] - A[b + 2]), Math.hypot(A[a] - A[c], A[a + 1] - A[c + 1], A[a + 2] - A[c + 2])), n = Math.min(12, Math.max(1, Math.ceil(L / 0.0012)));
        for (let i = 0; i <= n; i++) for (let j = 0; j <= n - i; j++) { const u = i / n, v = j / n, w = 1 - u - v; put(A[a] * w + A[b] * u + A[c] * v, A[a + 1] * w + A[b + 1] * u + A[c + 1] * v, A[a + 2] * w + A[b + 2] * u + A[c + 2] * v); }
      }
      for (let pass = 0; pass < 8; pass++) for (let ip = 0; ip < NP; ip++) for (let it = 0; it < NT; it++) { const k = ip * NT + it; if (m[k]) continue; let s2 = 0, n = 0; for (const [a, b] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) { const q = Math.min(NP - 1, Math.max(0, ip + a)) * NT + (it + b + NT) % NT; if (m[q]) { s2 += m[q]; n++; } } if (n) m[k] = s2 / n; }
      return (th, ph) => { const ft = ((th + PI) / TAU) * NT - 0.5, fp = cl((ph - P0) / (P1 - P0) * NP - 0.5, 0, NP - 1.001), i0 = Math.floor(ft), j0 = Math.floor(fp), I = (a) => ((a % NT) + NT) % NT;
        return Math.max(m[j0 * NT + I(i0)], m[j0 * NT + I(i0 + 1)], m[(j0 + 1) * NT + I(i0)], m[(j0 + 1) * NT + I(i0 + 1)]); };
    })());
    const skinR = (d) => {
      const [th, ph] = angOf(d); let r = H.SKR(th, ph);
      if (ph > 1.45 && ph < 2.9) { const f = FINE(th, ph); if (f > 0.03) r = lerp(r, f, sm(1.45, 1.70, ph)); }
      if (ph > 2.15) { let q = 0.17; for (let k = 0; k < 80 && q > 0.03; k++) { const f = W.F(C0.x + d.x * q, C0.y + d.y * q, C0.z + d.z * q); if (f <= 0) break; q -= Math.max(f, 0.0004); } if (q > r && q < 0.169) r = q; }
      return r;
    };
    // which bones carry a point of the hair lying on her skin at p: her head, blending toward her neck's own at her nape
    const wNape = (p) => { const u = 0.6 * sm(1.475, 1.42, p[1]); return u <= 0 ? HEAD : W.mixW(HEAD, W.wBody(p[0], p[1], p[2]), u); };
    // a grid of (NR + 1) x (NC + 1) points (the last column repeats the first, with its own uv), its triangles facing away from 'mid'.
    // at(i, j) -> { p, uv, shade?, w? }
    function gridPart(key, NR, NC, at, mid, mat, o) {
      const pos = [], uv = [], idx = [], col = [], wts = [], nor = [];
      for (let i = 0; i <= NR; i++) for (let j = 0; j <= NC; j++) { const q = at(i, j); pos.push(q.p[0], q.p[1], q.p[2]); uv.push(q.uv[0], q.uv[1]); const s = q.shade == null ? 1 : q.shade; col.push(s, s, s); wts.push(q.w || HEAD); if (q.n) nor.push(q.n[0], q.n[1], q.n[2]); }
      const C = NC + 1;
      for (let i = 0; i < NR; i++) for (let j = 0; j < NC; j++) { const a = i * C + j, b = a + 1, c = a + C, d = c + 1; idx.push(a, c, b, b, c, d); }
      let s = 0;
      for (let t = 0; t < idx.length; t += 3) {
        const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3, ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2], vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
        s += (uy * vz - uz * vy) * (pos[a] - mid.x) + (uz * vx - ux * vz) * (pos[a + 1] - mid.y) + (ux * vy - uy * vx) * (pos[a + 2] - mid.z);
      }
      if (s < 0) for (let t = 0; t < idx.length; t += 3) { const q = idx[t + 1]; idx[t + 1] = idx[t + 2]; idx[t + 2] = q; }
      const rec = W.part(key, nor.length === pos.length ? { pos, idx, uv, nor } : { pos, idx, uv }, (x, y, z, i) => wts[i], Object.assign({ mat }, o || {}));
      if (mat.vertexColors) rec.mesh.geometry.setAttribute('color', new W.THREE.Float32BufferAttribute(col, 3));
      return rec;
    }
    const LOCKW = [];
    let sd = 31337; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;

    // ----- the bun's place: high on the back of her head (over the back of her crown), its axis leaning back, its foot sunk in her hair -----
    const BPOS = P.bpos || 0.79, BDIST = P.bdist || 0.122, BTILT = P.btilt || 1.00;
    const Bc = unit(0, Math.cos(BPOS), -Math.sin(BPOS));                       // from her head's middle to the bun's: the cap's strands meet under it
    const CB = Bc.clone().multiplyScalar(BDIST).add(C0);                       // the bun's middle
    const AX = unit(0, Math.cos(BTILT), -Math.sin(BTILT));                     // the bun's own axis: the coil winds round it
    const RB = P.rb || 0.058, HBN = P.hb || 0.042;                             // the bun's radius across, and its half-height along its axis

    // ----- her hairline (where the last tips of the hair reach): how far down from the top, by direction round her head's middle -----
    // th: 0 at her face, PI/2 her left, PI the back. Across her forehead it sits at about 1.59 m in the middle (above the top of her face
    // painting, which fades to plain skin there), curving down round her temples to about 1.53 m, then down in front of her ears (over the painted sideburn), above her ears, down behind them, and across her nape
    // at about the level of her ear lobes (1.445 m in the middle).
    const EDGE = P.edge || [[0, 0.895], [0.15, 0.900], [0.30, 0.922], [0.45, 0.999], [0.60, 1.130], [0.75, 1.304], [0.90, 1.530], [1.05, 1.760], [1.18, 1.880], [1.30, 1.920], [1.44, 1.900], [1.54, 1.840], [1.64, 1.720], [1.74, 1.670], [1.90, 1.700], [2.02, 1.880], [2.15, 2.180], [2.35, 2.420], [2.65, 2.500], [PI, 2.530]];
    const edgePh = (th) => prof(EDGE, Math.abs(th), true) + (0.010 * Math.sin(th * 13 + 0.5) + 0.006 * Math.sin(th * 29 + 1.3) + 0.012 * Math.exp(-th * th / 0.006)) * sm(1.3, 0.9, Math.abs(th));   // a little uneven across her forehead
    const outside = (d) => { const [th, ph] = angOf(d); return ph > edgePh(th); };
    const F1 = V3(1, 0, 0), F2 = V3().crossVectors(Bc, F1).normalize();
    const dirAt = (al, ps) => { const s = Math.sin(al), c = Math.cos(al), cp = Math.cos(ps), sp = Math.sin(ps); return unit(Bc.x * c + (F1.x * cp + F2.x * sp) * s, Bc.y * c + (F1.y * cp + F2.y * sp) * s, Bc.z * c + (F1.z * cp + F2.z * sp) * s); };
    const edgeAl = (ps) => { let a = 0.05; while (a < 3.0 && !outside(dirAt(a, ps))) a += 0.02; let lo = a - 0.02, hi = a; for (let k = 0; k < 18; k++) { const m = (lo + hi) / 2; if (outside(dirAt(m, ps))) hi = m; else lo = m; } return (lo + hi) / 2; };
    const AL0 = 0.18;                                                           // the cap ends here, under the bun

    // ----- the locks: bunches of strands from her hairline (or from further back) to the bun, each its own width, height and shade -----
    const LOCKS = []; for (let k = 0; k < 110; k++) LOCKS.push({ ps: rnd() * TAU, w: 0.0055 + 0.0110 * rnd(), h: 0.0016 + 0.0026 * rnd(), s0: rnd() < 0.55 ? 0 : 0.6 * rnd(), bend: 0.05 * (rnd() - 0.5), ph: rnd() * 6.28, tone: 0.78 + 0.40 * rnd() });
    const angD = (a, b) => { let d = (a - b) % TAU; if (d > PI) d -= TAU; if (d < -PI) d += TAU; return d; };
    function lockField(s, ps, rs) {             // s: 0 at the hairline .. 1 under the bun; rs: metres per radian round the bun there
      let best = 0, tone = 1;
      for (const L of LOCKS) {
        if (s < L.s0 - 0.05) continue;
        const c = L.ps + L.bend * Math.sin(s * 2.6 + L.ph), x = Math.abs(angD(ps, c)) * rs / L.w; if (x >= 1) continue;
        const v = L.h * Math.pow(1 - x * x, 0.6) * sm(L.s0 - 0.05, L.s0 + 0.08, s);
        if (v > best) { best = v; tone = L.tone; }
      }
      return [best, tone];
    }
    // how hair stands up from its edge: a rounded roll, steep at first, reaching full height L in from the hairline
    const roll = (dE, L) => { const x = cl(dE / L, 0, 1); return 0.5 * Math.sqrt(1 - (1 - x) * (1 - x)) + 0.5 * x * x * (3 - 2 * x); };
    // the hair's surface at angle al from under the bun, round it at ps (aE: the hairline's angle there)
    function capPt(al, ps, aE) {
      const wob = 0.006 * Math.sin(al * 5 + ps * 3) + 0.003 * Math.sin(al * 11 - ps * 5);      // the strands are not ruled straight
      const sf = cl((aE - al) / (aE - AL0), 0, 1), dF = angD(ps, 1.5 * PI), fan = 0.30 * Math.sin(dF) * Math.exp(-dF * dF / 0.9) * sm(0, 0.18, sf) * sm(0.85, 0.35, sf);   // swept up from her forehead and out to the sides
      const d = dirAt(al, ps + fan + wob * sm(0, 0.15, aE - al)), [th, ph] = angOf(d), R = skinR(d);
      const dE = (aE - al) * R, s = cl((aE - al) / (aE - AL0), 0, 1), front = Math.max(0, Math.cos(th)), side = Math.abs(Math.sin(th)), back = Math.max(0, -Math.cos(th));
      const ath = Math.abs(th), sideW = sm(1.30, 1.65, ath) * sm(2.45, 2.05, ath);   // above and just behind her ears (not the corners of her forehead)
      const fr = sm(1.35, 0.85, ath), k = sm(1.35, 1.75, ath);                       // fr: her forehead and temples; k: above her ears
      let t = -0.0020 + lerp(0.0026 * sm(0.004, 0.022, dE), 0.0024 * sm(0.002, 0.020, dE), fr) + 0.0030 * sm(0.012, lerp(0.055, 0.095, fr), dE)          // under the edge band, the hair rises out of her skin, then its own thickness
        + 0.0022 * sm(lerp(0.01, 0.02, fr), lerp(0.06, 0.08, fr), dE)                           // a little everywhere
        + 0.0068 * sm(0.04, 0.16, dE) * front * sm(0.55, 1.0, ph)                                  // over her forehead: lying close at first, then a soft lift
        + 0.0160 * lerp(sm(0, 0.07, dE), roll(dE, 0.035), k) * sideW * sm(0.45, 1.15, ph) * sm(2.05, 1.60, ph)           // rounded out over the tops of her ears
        + 0.0090 * roll(dE, 0.05) * back * sm(1.0, 1.45, ph) * sm(2.45, 1.75, ph)              // the back of her head rounded out under the bun; tight at her nape
        + 0.0070 * sm(0.70, 0.25, al)                                                           // gathered up toward the bun's foot
        + 0.0012 * (Math.sin(ps * 3 + al * 2) + Math.sin(ps * 5 - al * 3 + 1)) * 0.5 * sm(0.01, 0.04, dE);   // soft unevenness
      const [lf, tone] = lockField(s, ps, R * Math.sin(al));
      const lk = sm(lerp(0.006, 0.012, fr), lerp(0.02, 0.05, fr), dE), t0 = t; t += (lf - 0.0022) * lk; t = Math.max(t, Math.min(t0, 0.0008));      // the grooves between locks never reach her skin
      const r = R + t, p = [C0.x + d.x * r, C0.y + d.y * r, C0.z + d.z * r], sk = [C0.x + d.x * R, C0.y + d.y * R, C0.z + d.z * R];
      const shade = lerp(1, (0.62 + 0.38 * Math.sqrt(cl(lf / 0.0032, 0, 1))) * tone, lk) * (1 - 0.12 * sm(0.45, 0.2, al)) * (1 + 0.28 * fr * sm(0.008, 0.035, dE) * sm(0.11, 0.05, dE));   // the hair just swept back off her forehead catches the light
      return { p, d, R, r, dE, shade, w: wNape(sk) };
    }

    // ----- hbCap: from the hairline (row 0) to under the bun (row NR) -----
    const NC = 300, edges = []; for (let j = 0; j <= NC; j++) edges.push(edgeAl((j / NC) * TAU));
    const US = 13;
    gridPart('hbCap', 60, NC, (i, j) => {
      const ps = (j / NC) * TAU, aE = edges[j % NC], al = lerp(aE, AL0, Math.pow(i / 60, 0.8)), q = capPt(al, ps, aE);
      return { p: q.p, uv: [(ps / TAU) * US, al * 2.6], shade: q.shade, w: q.w };
    }, C0, capMat);
    // ----- hbEdge: the last 18 mm (sides) to 20 mm (forehead) of the hair, over the cap's rim and on her skin: fine hairs, sparser toward her face -----
    {
      const NR = 10, OUT = -0.0005;
      gridPart('hbEdge', NR, NC, (i, j) => {
        const ps = (j / NC) * TAU, aE = edges[j % NC], t = i / NR, d0 = dirAt(aE, ps), R0 = skinR(d0), IN = lerp(0.018, 0.020, sm(1.3, 0.9, Math.abs(angOf(d0)[0]))), dE = lerp(IN, OUT, t), al = aE - dE / R0;
        const q = capPt(al, ps, aE), r = Math.max(q.R + 0.0006, q.r + 0.0004), e = 0.004;
        const A1 = capPt(al + e, ps, aE).p, A2 = capPt(al - e, ps, aE).p, B1 = capPt(al, ps + e, aE).p, B2 = capPt(al, ps - e, aE).p;
        const n = V3().crossVectors(V3(A1[0] - A2[0], A1[1] - A2[1], A1[2] - A2[2]), V3(B1[0] - B2[0], B1[1] - B2[1], B1[2] - B2[2])).normalize(); if (n.dot(q.d) < 0) n.negate();
        return { p: [C0.x + q.d.x * r, C0.y + q.d.y * r, C0.z + q.d.z * r], uv: [(ps / TAU) * US, lerp(0.02, 0.99, t)], w: q.w, n: [n.x, n.y, n.z] };
      }, C0, edgeMat, { occluder: false, shadow: false }).mesh.receiveShadow = false;      // a film this thin on the hair only darkens itself in the shadow map
    }

    // ----- hbLock: a few locks lying loose on top of the rest, lifted a little in the middle, from near her hairline back to the bun -----
    {
      const pos = [], uv = [], idx = [], NS = 44, NU = 8, lockMat = hairMat(); lockMat.onBeforeCompile = () => {}; lockMat.customProgramCacheKey = () => 'hbLock';
      for (let k = 0; k < 22; k++) {                  // the first six sweep up and back from the front of her hairline
        const ps0 = k < 6 ? 1.5 * PI + (k / 5 - 0.5) * 1.2 + 0.06 * (rnd() - 0.5) : rnd() * TAU, s0 = k < 6 ? 0.07 + 0.05 * rnd() : 0.04 + 0.30 * rnd(), s1 = k < 6 ? 0.62 + 0.1 * rnd() : 0.92, w = 0.0035 + 0.0030 * rnd(), th = 0.0016 + 0.0008 * rnd(), lift = 0.0012 + 0.0022 * rnd(), bend = 0.10 * (rnd() - 0.5), base = pos.length / 3, u0 = rnd();
        const j0 = Math.round(((ps0 / TAU) % 1) * NC) % NC, aE = edges[j0];
        const path = []; for (let i = 0; i <= NS; i++) { const t = i / NS, sv = lerp(s0, s1, t), ps = ps0 + bend * Math.sin(t * 2.4); const al = lerp(aE, AL0, sv), q = capPt(al, ps, aE), r = q.r + lift * Math.sin(PI * t) - 0.0008 * (1 - Math.sin(PI * t)); path.push({ p: [C0.x + q.d.x * r, C0.y + q.d.y * r, C0.z + q.d.z * r], n: q.d, w: q.w }); }
        const wts = [];
        for (let i = 0; i <= NS; i++) {
          const a = path[Math.max(0, i - 1)].p, b = path[Math.min(NS, i + 1)].p, T = unit(b[0] - a[0], b[1] - a[1], b[2] - a[2]), N = path[i].n.clone(); N.addScaledVector(T, -N.dot(T)).normalize(); const Bv = V3().crossVectors(T, N);
          const tw = sm(0, 0.12, i / NS) * sm(1, 0.85, i / NS), ww = w * (0.55 + 0.45 * tw), tt = th * (0.55 + 0.45 * tw);
          for (let m = 0; m <= NU; m++) { const an = (m / NU) * TAU, ca = Math.cos(an), sa = Math.sin(an), P0 = path[i].p; pos.push(P0[0] + N.x * ca * tt + Bv.x * sa * ww, P0[1] + N.y * ca * tt + Bv.y * sa * ww, P0[2] + N.z * ca * tt + Bv.z * sa * ww); uv.push(u0 + (m / NU) * 0.12, i / NS * 1.6); wts.push(path[i].w); }
        }
        for (let i = 0; i < NS; i++) for (let m = 0; m < NU; m++) { const a = base + i * (NU + 1) + m, b = a + 1, c = a + NU + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
        LOCKW.push(...wts);
      }
      W.part('hbLock', { pos, idx, uv }, (x, y, z, i) => LOCKW[i], { mat: lockMat });
    }
    // ----- hbWisp: two small loose curls at each temple, in front of her ears: a few thin round strands each -----
    {
      const pos = [], uv = [], idx = [], NS = 40, NU = 6;
      const tube = (pts, r0, r1) => {
        const base = pos.length / 3;
        for (let i = 0; i < pts.length; i++) {
          const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], T = unit(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
          let N = V3(0, 0, 1).cross(T); if (N.lengthSq() < 1e-6) N = V3(1, 0, 0); N.normalize(); const Bv = V3().crossVectors(T, N), r = lerp(r0, r1, i / (pts.length - 1));
          for (let k = 0; k <= NU; k++) { const an = (k / NU) * TAU, ca = Math.cos(an), sa = Math.sin(an); pos.push(pts[i][0] + (N.x * ca + Bv.x * sa) * r, pts[i][1] + (N.y * ca + Bv.y * sa) * r, pts[i][2] + (N.z * ca + Bv.z * sa) * r); uv.push(k / NU * 0.02 + rnd() * 0, i / (pts.length - 1) * 2); }
        }
        for (let i = 0; i < pts.length - 1; i++) for (let k = 0; k < NU; k++) { const a = base + i * (NU + 1) + k, b = a + 1, c = a + NU + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
      };
      const WS = P.wisps || [[1.33, 0.060, 0.3], [1.45, 0.072, 2.0]];          // where round her head, how long, the curl's phase
      for (const sg of [-1, 1]) WS.forEach(([th0, len, cph]) => {
        const th = sg * th0, ph = edgePh(th0) - 0.07, d = H.hvDir(th, ph), R = skinR(d) + 0.003, P0 = d.clone().multiplyScalar(R).add(C0);
        for (let n = 0; n < 4; n++) {
          const off = [(rnd() - 0.5) * 0.002, (rnd() - 0.5) * 0.002], ln = len * (0.75 + 0.3 * rnd()), cp2 = cph + (rnd() - 0.5) * 0.8, pts = [];
          for (let i = 0; i <= NS; i++) {
            const t = i / NS, y = P0.y - ln * t + 0.004 * t * t, cur = (0.0028 + 0.0018 * t) * sm(0, 0.25, t), an = t * 13 + cp2;
            const out = Math.max(Math.abs(P0.x), W.headHalfW(cl(y, 1.40, 1.62)) + 0.0045) + 0.0015 * t;
            pts.push([sg * (lerp(Math.abs(P0.x), out, sm(0, 0.2, t)) + cur * (1 + Math.sin(an)) + off[0]), y, P0.z + 0.003 * t + cur * Math.cos(an) + off[1]]);
          }
          tube(pts, 0.00042, 0.00012);
        }
      });
      W.part('hbWisp', { pos, idx, uv }, head, { mat: wispMat, occluder: false });
    }
    // ----- hbBun: a spheroid wound round with a coil of hair -----
    {
      const NA = 80, NB = 180, NT = P.nt || 4.4;
      const E1 = V3(1, 0, 0), E2 = V3().crossVectors(AX, E1).normalize();
      gridPart('hbBun', NA, NB, (i, j) => {
        const al = PI * i / NA, ps = (j / NB) * TAU, sa = Math.sin(al), ca = Math.cos(al);
        const lump = 1 + 0.035 * Math.sin(2 * ps + 0.6) + 0.025 * Math.sin(3 * ps + 2.1) + 0.02 * Math.sin(al * 4 + ps);
        const c = NT * al / PI + ps / TAU + (0.10 * Math.sin(2 * ps + al) + 0.06 * Math.sin(3 * ps + 1.0)) * sm(0.2, 0.9, al), f = c - Math.floor(c), rope = Math.sqrt(Math.max(0, 1 - Math.pow(2 * f - 1, 2)));
        const NTW = 14, tw = Math.sin(TAU * (2 * f + ps * NTW / TAU)) * 0.0005 * Math.pow(sa, 0.5) * sm(0.15, 0.5, al);
        const dep = 0.0070 * Math.pow(sa, 0.6) * sm(0.10, 0.55, al) * (0.8 + 0.2 * Math.sin(ps * 3 + al * 2));   // the groove between turns, shallow at the top
        const rr = RB * Math.pow(sa, 0.80) * lump, hh = HBN * ca;
        const cp = Math.cos(ps), sp = Math.sin(ps), nx = E1.x * cp + E2.x * sp, ny = E1.y * cp + E2.y * sp, nz = E1.z * cp + E2.z * sp;
        let px = CB.x + AX.x * hh + nx * rr, py = CB.y + AX.y * hh + ny * rr, pz = CB.z + AX.z * hh + nz * rr;
        const ox = px - CB.x, oy = py - CB.y, oz = pz - CB.z, oL = Math.hypot(ox, oy, oz) || 1, dd = dep * (rope - 1) + tw * rope - 0.006 * sm(0.30, 0.0, al);       // the coil's end tucked into its middle
        px += ox / oL * dd; py += oy / oL * dd; pz += oz / oL * dd;
        return { p: [px, py, pz], uv: [c + (NTW / 2) * ps / TAU, (ps / TAU) * 2], shade: (0.78 + 0.22 * rope) * (1 - 0.30 * sm(0.35, 0.0, al)) };
      }, CB, bunMat);
    }
  },
};
