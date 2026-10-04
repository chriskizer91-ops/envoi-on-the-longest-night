
 // ---------- the hat: drooping brim (now with a thickness and a wired edge), the bent crown whose tip flops, the fuzzy
 // band (real fuzz now), ridged ram horns, the silver chain with its gold crosses, the big gold charm ----------
 const HatP = part();
 const brimPt = (u, v, o, dy) => {
  const a = u * TAU, r = lerp(0.115, 0.335, v), e = (r - 0.115) / 0.22;
  o[0] = r * Math.sin(a); o[2] = r * Math.cos(a) * 0.97;
  o[1] = -0.028 * Math.pow(e, 1.7) + 0.013 * Math.sin(3 * a + 1) * Math.pow(e, 1.2) - 0.012 * Math.max(0, Math.cos(a)) * e + (dy || 0);
 };
 HatP.addWorld(uvs(sheet(Q(256, 48), Q(24, 5), (u, v, o) => brimPt(u, v, o)), 2, 3), M.hat);
 HatP.addWorld(uvs(sheet(Q(256, 48), Q(24, 5), (u, v, o) => brimPt(u, v, o, -.0035)), 2, 3), M.hat);
 const edge = []; for (let k = 0; k < 160; k++) { const o = [0, 0, 0]; brimPt(k / 160, 1, o, -.00175); edge.push(new THREE.Vector3(o[0], o[1], o[2])); }
 HatP.add(uvs(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(edge, true), Q(240, 60), 0.0045, Q(10, 6), true), 2, 3), M.hat);
 const BANDP = smoothP([[0.13, -0.008], [0.136, 0.0], [0.138, 0.022], [0.135, 0.046], [0.127, 0.054]], 3);
 const bandDisp = (r, y, a) => r + (y < 0.008 ? 0.004 * Math.sin(36 * a) : 0);
 HatP.add(uvs(lathe(BANDP, Q(192, 64), bandDisp, 1), 6, 1), M.hatBand);
 { const NS = Q(6, 2); for (let k = 1; k <= NS; k++) { const g = uvs(lathe(BANDP, Q(192, 64), (r, y, a) => bandDisp(r, y, a) + k / NS * .0026, 1), 6, 1); g.setAttribute('aShell', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count).fill(k / NS), 1)); HatP.add(g, M.hatBand); } }
 const ridge = (t) => Math.pow(Math.abs(Math.sin(t * PI * 12)), .6);
 for (const sd of [-1, 1]) {
  const pts = [[sd * 0.122, 0.028, 0.0], [sd * 0.185, 0.04, -0.03], [sd * 0.228, 0.085, -0.045], [sd * 0.22, 0.132, -0.02], [sd * 0.185, 0.128, 0.012], [sd * 0.172, 0.1, 0.02]];
  const TSh = Q(160, 20), RSh = Q(24, 8);
  const g = strand(pts, TSh, RSh, (t) => 0.03 * (1 - t * 0.8) * (1 + .06 * (ridge(t) - .5)), 1, null);
  vcol(g, (x, y, z, o, i) => { const t = Math.floor(i / (RSh + 1)) / TSh, k = lerp(.74, 1, ridge(t)) * lerp(1, .9, t); o[0] = k; o[1] = k * lerp(1, .96, t); o[2] = k * lerp(1, .93, t); });
  HatP.add(uvs(g, 3, 1), M.horn);
 }
 const chainPt = (s) => { const ang = s * 1.2; return [0.142 * Math.sin(ang), 0.062 - 0.03 * (1 - s * s), 0.142 * Math.cos(ang) * 0.97]; };
 for (let k = 0; k <= 34; k++) { const s = -1 + k / 17; HatP.add(new THREE.TorusGeometry(0.0052, 0.0014, Q(8, 4), Q(20, 8)), M.silver, chainPt(s), [k % 2 ? Math.PI / 2 : 0, s * 1.2, 0]); }
 for (const s of [-0.72, -0.4, 0.4, 0.72]) {
  const p = chainPt(s), ry = s * 1.2;
  HatP.add(crossGeo(.0032, .02, .012, .0032, .004, .0025, .0005), M.gold, [p[0], p[1] - 0.016, p[2]], [0, ry, 0]);
 }
 HatP.add(new THREE.TorusGeometry(0.019, 0.0036, Q(16, 8), Q(72, 24)), M.gold, [0, 0.085, 0.132], [-0.12, 0, 0]);
 HatP.add(crossGeo(.0045, .034, .026, .0045, .003, .003, .0006), M.gold, [0, 0.085, 0.133], [-0.12, 0, 0]);
 HatP.add(crossGeo(.0055, .075, .0055, .0001, 0, .0035, .0007), M.gold, [0, 0.03, 0.14], [-0.12, 0, 0]);
 HatP.build(hatB);
 const crownG = uvs(strand([[0, -0.012, 0], [0, 0.1, -0.004], [0.004, 0.2, -0.025], [-0.02, 0.29, -0.055], [-0.075, 0.36, -0.08], [-0.14, 0.385, -0.07], [-0.185, 0.36, -0.045]], Q(180, 20), Q(72, 14),
  (t) => (0.127 * Math.pow(1 - t, 0.85) + 0.004) * (1 + 0.05 * Math.sin(t * 25 + 1.3)), 1, null), 2, 3);
 crownG.applyMatrix4(hatB.matrixWorld);
 const hatY = bw(hatB)[1];
 const Cr = part((x, y) => {
  if (y < hatY + 0.16) return [[BI.hat, 1]];
  if (y < hatY + 0.26) { const t = sm(hatY + 0.16, hatY + 0.26, y); return [[BI.hat, 1 - t], [BI.hatA, t]]; }
  const t = sm(hatY + 0.28, hatY + 0.35, y); return [[BI.hatA, 1 - t], [BI.hatB, t]];
 });
 Cr.addWorld(crownG, M.hat);
 Cr.build(root);
