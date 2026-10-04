 // ---------- the root mound: a lumpy dome under a tangle of twisted roots, ribs of root arching out of the soil, old grey
 // dead canes snarled through it, and the litter of its own fallen leaves round it ----------
 const domeR = (e, a) => CR * Math.pow(Math.max(0, Math.cos(e)), .8) * (1 + .08 * Math.sin(a * 5 + e * 3) + .05 * Math.sin(a * 11 - e * 7) + .025 * Math.sin(a * 23 + e * 13));
 const domeY = (e) => CH * Math.sin(Math.max(0, e));
 // veins: x how strongly a vertex glows, y how far along the veins it is from the heart (0 at the heart, about .5 at the
 // foot of the spire, 1.5 and on at the ends of the roots): each heartbeat runs out along y
 const vein = (g, x, y0, y1, ring) => attr(g, 'aVn', 2, (i, o) => { o[0] = x; o[1] = lerp(y0, y1, Math.floor(i / ring) / Math.max(1, g.attributes.position.count / ring - 1)); });
 const domeP = (e, a, k, out) => { const r = domeR(e, a) * (k || 1); return out.set(Math.sin(a) * r, domeY(e) * (k || 1), Math.cos(a) * r); };
 const domeN = (e, a, out) => out.set(Math.sin(a) * Math.cos(e) * CH, Math.sin(e) * CR, Math.cos(a) * Math.cos(e) * CH).normalize();
 // mound parts low and far out are held by the ground, the rest by the mound
 function wCrown(x, y, z) { const g = sm(CR * .95, CR * 1.6, Math.hypot(x, z)) * sm(.3, .04, y); return [[BI.mass, 1 - g], [BI.ground, g]]; }
 const mossy = (y, ny, k) => { const m = MOSS * sm(.2, .8, ny) * sm(.1, CH * .6, y) * k; return m; };
 {
  const g = surf(Q(110, 40), Q(36, 14), (u, v, o) => { const a = u * TAU, e = lerp(-.14, PI / 2, v), r = domeR(e, a) * (1 + .04 * Math.sin(a * 37 + e * 19) * Math.sin(e * 3)); o[0] = Math.sin(a) * r; o[1] = domeY(e) - .03 + .03 * Math.sin(a * 17 + e * 29); o[2] = Math.cos(a) * r; }, (u, v) => [u * 8, v * 3]);
  const nn = g.attributes.normal;
  shadeBy(g, (x, y, z, i) => { const k = lerp(.34, .62, sm(-.02, CH, y)) * DARK, m = mossy(y, nn.getY(i), 1.2); return [k * lerp(1, .7, m), k * lerp(.9, 1.15, m), k * lerp(.82, .6, m)]; });
  attr(g, 'aVn', 2, (i, o) => { o[0] = .5; o[1] = .55 + .2 * (1 - g.attributes.position.getY(i) / CH); });
  put(M.wood, cnAll(skinW(g, wCrown), -1, 0));
 }
 {
  // twisted roots spiralling down over the dome and out into the soil, each a bundle of fibres
  for (let i = 0, n = Q(52, 12); i < n; i++) {
   const a0 = rnd() * TAU, e0 = rr(.4, 1.3), tw = (rnd() < .5 ? -1 : 1) * rr(.5, 2.2), endR = CR * rr(1.1, 2.05), r0 = rr(.06, .15), pts = [];
   for (let j = 0; j <= 12; j++) {
    const t = j / 12, a = a0 + tw * t, e = lerp(e0, 0, Math.pow(t, .8)), R = lerp(domeR(e, a) + r0 * .55, endR, sm(.58, 1, t));
    pts.push(V3(Math.sin(a) * R, domeY(e) * (1 - sm(.6, .95, t)) + r0 * .45 - .12 * sm(.88, 1, t), Math.cos(a) * R));
   }
   const kt = r2(.12, .7), kk = r2(.25, .6), ph = rnd() * 9, fib = r2(5, 8), rs = Q(12, 5);
   const g = tube(pts, Q(44, 10), rs, (t, th) => r0 * (1.2 - .6 * t) * (1 + .1 * Math.sin(th * fib + t * 40 + ph) + .08 * Math.sin(th * 2 + t * 13 + ph)) * (1 + kk * Math.exp(-Math.pow((t - kt) / .05, 2))), 6);
   g.computeVertexNormals();
   const nn = g.attributes.normal;
   shadeBy(g, (x, y, z, k) => { const c = (.6 + .25 * sm(0, CH, y)) * DARK, m = mossy(y, nn.getY(k), 1); return [c * lerp(1, .72, m), c * lerp(.92, 1.12, m), c * lerp(.85, .62, m)]; });
   vein(g, r2(.75, 1.05), .55 + .1 * (1 - e0 / 1.3), 1.6, rs + 1);
   put(M.wood, cnAll(skinW(g, wCrown), -1, 0));
  }
  // ribs: great roots that arch up out of the soil round the mound and plunge back in
  for (let i = 0, n = Q(11, 5); i < n; i++) {
   const a = (i + rr(.1, .9)) / n * TAU, Re = CR * rr(1.9, 2.7), hA = rr(.55, 1.1), r0 = rr(.1, .17), pts = [];
   for (let j = 0; j <= 12; j++) { const t = j / 12, R = lerp(CR * .8, Re, t), aa = a + .25 * Math.sin(PI * t); pts.push(V3(Math.sin(aa) * R, lerp(CH * .35, -.14, t) + hA * Math.sin(PI * Math.min(1, t * 1.15)), Math.cos(aa) * R)); }
   const rs = Q(14, 6), ph = rnd() * 9;
   const g = tube(pts, Q(48, 12), rs, (t, th) => r0 * (1.1 - .55 * t) * (1 + .1 * Math.sin(th * 6 + t * 50 + ph) + .1 * Math.sin(th * 2 + t * 15)), 6);
   g.computeVertexNormals(); shadeBy(g, () => [.66 * DARK, .6 * DARK, .54 * DARK]); vein(g, .9, .6, 1.4, rs + 1);
   put(M.wood, cnAll(skinW(g, wCrown), -1, 0));
  }
  // fine rootlets spreading over the ground
  for (let i = 0, n = Q(80, 14); i < n; i++) {
   const len = rr(1.2, 3.4), r0 = rr(.02, .05), pts = [];
   let a = rnd() * TAU, R = CR * rr(.82, .98);
   for (let j = 0; j <= 8; j++) { const t = j / 8; pts.push(V3(Math.sin(a) * R, .02 + r0 * .3 - .05 * sm(.85, 1, t), Math.cos(a) * R)); a += rr(-.1, .1); R += len / 8; }
   const g = tube(pts, Q(16, 5), Q(5, 3), (t) => r0 * (1 - .78 * t), 3); shadeBy(g, () => [.56 * DARK, .5 * DARK, .44 * DARK]); vein(g, .8, 1, 1.7, Q(5, 3) + 1);
   put(M.wood, cnAll(skinW(g, wCrown), -1, 0));
  }
  // dead canes: old grey arching canes, long since dead and still armed, snarled over the mound and out between its legs;
  // a real thicket is half dead wood. They stand stiff (held by the mound or the ground)
  for (let i = 0, n = Q(30, 8); i < n; i++) {
   const a0 = rnd() * TAU, a1 = a0 + rr(-.9, .9), R0 = CR * rr(.2, .8), R1 = CR * rr(1.3, 2.8), hgt = rr(.7, 2.2), r0 = rr(.03, .07), pts = [];
   for (let j = 0; j <= 10; j++) { const t = j / 10, a = lerp(a0, a1, t), R = lerp(R0, R1, t); pts.push(V3(Math.sin(a) * R, lerp(CH * rr(.5, .9), -.05, Math.pow(t, 1.6)) + hgt * Math.sin(PI * Math.min(1, t * 1.05)) * (1 - t * .3), Math.cos(a) * R)); }
   const curve = new THREE.CatmullRomCurve3(pts), rs = Q(7, 4), segs = Q(36, 8);
   const g = tube(curve, segs, rs, (t, th) => r0 * (1 - .55 * t) * (1 + .1 * Math.cos(5 * th)), 2.5);
   g.computeVertexNormals();
   const grey = rr(.62, .82);
   shadeBy(g, () => [grey * .95, grey * .9, grey * .86]); oldAll(g, 1); attr(g, 'aVn', 2, (i2, o) => { o[0] = 0; o[1] = 2; });
   put(M.bark, cnAll(skinW(g, wCrown), -1, 0));
   const P = V3(), T = V3(), Nn = V3();
   for (let k = 0, np = Q(Math.round(curve.getLength() * 7), 3); k < np; k++) {
    const t = (k + rnd3()) / np, r = r0 * (1 - .55 * t); curve.getPointAt(t, P); curve.getTangentAt(t, T);
    Nn.set(rnd3() - .5, rnd3() - .5, rnd3() - .5).addScaledVector(T, -0); Nn.addScaledVector(T, -Nn.dot(T)).normalize(); P.addScaledVector(Nn, r * .85);
    const tl = r * 1.6 + .02; put(M.vc, cnAll(skinW(prickle(P.clone(), Nn.clone(), T.clone(), tl, tl * .42, .5, true), () => wCrown(P.x, P.y, P.z)), -1, 0));
   }
  }
 }

 // ---------- the spire: three old canes braided round each other, out of the mound up to the bud ----------
 const spW = (s) => chainW(SP, SPS, SPN, s);
 const strandC = (j, s, out) => { const f = cl(s / SPL, 0, 1), ph = j * TAU / 3 + s * 1.45, R = lerp(.46, .26, f); return out.set(Math.sin(ph) * R, SPH + s, Math.cos(ph) * R); };
 for (let j = 0; j < 3; j++) {
  const pts = []; for (let i = 0; i <= 30; i++) pts.push(strandC(j, lerp(-.5, SPL + .3, i / 30), V3()));
  const rs = Q(25, 10);
  const g = tube(pts, Q(150, 30), rs, (t, th) => lerp(.4, .22, t) * (1 + .055 * Math.cos(th * 5 + t * 3 + j)) * (1 + .05 * Math.sin(th * 3 + t * 23 + j)) * (1 + .16 * Math.exp(-Math.pow(((t * 8 + j * .37) % 1 - .5) * 7, 2))), 3.2);
  g.computeVertexNormals();
  const p = g.attributes.position;
  shadeBy(g, (x, y, z, i) => { const ring = i % (rs + 1), th = ring / rs * TAU, gr = .5 + .5 * Math.cos(th * 5 + j), k = (.82 + .18 * sm(SPH, BY, y)) * DARK * lerp(.78, 1.06, gr); return [k, k * .95, k * .92]; });
  oldAll(g, 0); attr(g, 'aOld', 1, (i, o) => { o[0] = .85 - .5 * sm(SPH + SPL * .6, BY, p.getY(i)); });
  attr(g, 'aVn', 2, (i, o) => { const ring = i % (rs + 1), th = ring / rs * TAU; o[0] = .8 * (.35 + .65 * (.5 - .5 * Math.cos(th * 5 + j))); o[1] = .5 * (1 - cl((p.getY(i) - SPH) / SPL, 0, 1)); });
  put(M.bark, cnAll(skinW(g, (x, y) => spW(y - SPH)), -1, 0));
 }
 {
  // hooked prickles all the way up the braid, on its ridges
  const P = V3(), N = V3();
  for (let i = 0, n = Q(170, 30); i < n; i++) {
   const j = i % 3, s = lerp(-.1, SPL - .15, (i + rnd3() * .9) / n), a = j * TAU / 3 + s * 1.45 + rr(-.7, .7);
   N.set(Math.sin(a), rr(-.15, .35), Math.cos(a)).normalize(); strandC(j, s, P).addScaledVector(N, lerp(.38, .21, cl(s / SPL, 0, 1)));
   const tl = (.2 + .1 * rnd3()) * THS; put(M.vc, cnAll(skinW(prickle(P.clone(), N.clone(), YAX, tl, tl * .42), () => spW(s)), -1, 0));
  }
  // leaves up the braid, and a ruff of them under the bud
  for (let i = 0, n = Q(44, 14), nr = Q(16, 7); i < n; i++) {
   const top = i >= n - nr, s = top ? SPL - .05 : rr(.1, SPL - .5), a = top ? (i - n + nr + rnd() * .4) / nr * TAU : rnd() * TAU, R = top ? .42 : lerp(.75, .45, s / SPL);
   P.set(Math.sin(a) * R, SPH + s, Math.cos(a) * R);
   const Ly = V3(Math.sin(a), top ? rr(-.5, -.1) : rr(.1, .7), Math.cos(a)).normalize(), Ln = V3(rr(-.3, .3), 1, rr(-.3, .3)); Ln.addScaledVector(Ly, -Ln.dot(Ly)).normalize();
   const sz = top ? rr(.95, 1.25) : rr(.75, 1.05), kind = top ? (rnd() < .3 ? 1 : 0) : rnd() < .35 ? 1 : 0;
   const L = compoundLeaf(P.clone(), Ly, Ln, sz, kind, rnd() < .6, { amp: .7 });
   for (const g of L.leaf) put(M.leaf, cnAll(skinW(g, () => spW(s)), -1, 0));
   for (const g of L.stalk) put(M.vc, cnAll(skinW(g, () => spW(s)), -1, 0));
  }
 }

 // ---------- canes: five-angled, tapering, knotted, wine-dark with a waxy bloom, old and grey toward the base, armed with
 // hooked prickles on their angles, leafy, fruiting at the tips ----------
 const BERRIES = [];  // pendulum bones: { bone, len, X, Xp, ... }
 function addBunch(parent, local, at, n, size, cn) {
  const b = bone('b' + BERRIES.length, parent, local.x, local.y, local.z);
  const bn = bunch(n, size), M4 = _m4.makeTranslation(at.x, at.y, at.z);
  bn.berries.applyMatrix4(M4); put(M.berry, cnAll(rigid(bn.berries, b), cn[0], cn[1]));
  for (const s of bn.stems) { s.applyMatrix4(M4); put(M.vc, cnAll(rigid(s, b), cn[0], cn[1])); }
  BERRIES.push({ bone: b, len: size * .13, X: V3(), Xp: V3(), init: false, size, sway: rnd() * TAU });
  return b;
 }
 const RIDGE = (th, s, tw) => { const c = .5 + .5 * Math.cos(5 * (th + tw * s)); return c * c; }; // 1 on a ridge, 0 in a groove
 for (const C of CANES) {
  const d = V3(Math.sin(C.a), 0, Math.cos(C.a)), e1 = V3(Math.cos(C.a), 0, -Math.sin(C.a)), e2 = YAX, B = C.B, len = C.len;
  const rB = C.rB * (1 + .15 * TIER), rT = C.rT, kn = C.great ? .8 : .6, tw = r2(-.25, .25);
  const rad = (s) => (s < 0 ? rB * 1.12 : lerp(rB, rT, Math.pow(s / len, .72)) * (1 + .11 * Math.exp(-Math.pow((((s + .2) / kn) % 1 - .5) * 6, 2)))) * sm(len + .08, len - .2, s);
  const wob = (s, w) => { const k = sm(0, 1.4, s); w[0] = .05 * Math.sin(s * 1.1 + C.ph) * k; w[1] = .035 * Math.sin(s * 1.5 + C.ph * 1.7) * k; };
  const ax = (s, out) => { const w = [0, 0]; wob(s, w); return out.copy(B).addScaledVector(d, s).addScaledVector(e1, w[0]).addScaledVector(e2, w[1]); };
  C.rad = rad; C.ax = ax; C.d = d; C.e1 = e1; C.tw = tw;
  const oldTo = C.great ? 2.4 : 1.5, oldK = C.great ? 1 : .75;
  {
   const rs = Q(C.great ? 25 : 20, 10), nu = Q(Math.round(len * (C.great ? 24 : 22)), 28);
   const g = rodTube(B, d, e1, e2, -.35, len + .08, nu, rs, (s, th) => rad(s) * (1 + .085 * (2 * RIDGE(th, s, tw) - 1) * sm(-.3, .4, s) + .02 * Math.sin(th * 3 + s * 7)), wob, C.great ? 2.4 : 1.7), S = g.userData.S, TH = g.userData.TH;
   attr(g, 'color', 3, (i, o) => { const f = sm(.55, 1, S[i] / len), rg = RIDGE(TH[i], S[i], tw), ao = lerp(.74, 1.06, rg); o[0] = lin1(lerp(1, .9, f) * ao); o[1] = lin1(lerp(1, 1.12, f) * ao); o[2] = lin1(lerp(1, .74, f) * ao); });
   attr(g, 'aOld', 1, (i, o) => { o[0] = oldK * (1 - sm(oldTo * .4, oldTo, S[i])); });
   skinW(g, (x, y, z, i) => caneW(C, Math.max(0, S[i]))); attr(g, 'aCn', 2, (i, o) => { o[0] = C.k; o[1] = S[i] / len; });
   attr(g, 'aVn', 2, (i, o) => { const gr = 1 - RIDGE(TH[i], S[i], tw); o[0] = (C.great ? .6 : .45) * (.25 + .75 * gr); o[1] = (C.great ? .3 : .62) + Math.max(0, S[i]) / len * .9; });
   put(M.bark, g);
  }
  const P = V3(), N = V3(), O = V3(), Ly = V3(), Ln = V3();
  // hooked prickles on the cane's five angles
  for (let i = 0, n = Q(Math.round(len * 14), 10); i < n; i++) {
   const s = lerp(.12, len * .97, (i + rnd3() * .8) / n), th = (Math.floor(rnd3() * 5) * TAU / 5) - tw * s + r3(-.12, .12), r = rad(s) * 1.06;
   N.copy(e1).multiplyScalar(Math.cos(th)).addScaledVector(e2, Math.sin(th)); ax(s, P).addScaledVector(N, r * .92);
   const tl = (r * .62 + .025) * (rnd3() < .35 ? .55 : 1) * (.85 + .3 * rnd3()) * 1.25 * THS; put(M.vc, cnAll(skinW(prickle(P.clone(), N.clone(), d, tl, tl * .44), () => caneW(C, s)), C.k, s / len));
  }
  // great hooks toward the tips of the arms (and the mane and the front legs): what catch and hold
  for (let i = 0, n = { L: 9, M: 8, H: 4, F: 3 }[C.g] || 0; i < n; i++) {
   const s = lerp(.55, .94, (i + r2(.1, .9)) / n) * len, th = r2(-.9, .9) + (i % 2 ? PI : 0) - PI / 2, r = rad(s);
   N.copy(e1).multiplyScalar(Math.cos(th)).addScaledVector(e2, Math.sin(th)); ax(s, P).addScaledVector(N, r * .85);
   const tl = (r * 1.4 + .1) * THS; put(M.vc, cnAll(skinW(prickle(P.clone(), N.clone(), d, tl, tl * .4, r2(.8, 1)), () => caneW(C, s)), C.k, s / len));
  }
  // compound leaves on prickly stalks: five leaflets low down, three higher up, young bronze ones at the tip; the cold
  // has turned some wine-red, and the lowest on the legs are dead
  for (let i = 0, nL = Q(Math.round(len * 3.4), 6); i < nL; i++) {
   const f = lerp(.08, .96, (i + .2 + rnd() * .6) / nL), s = f * len, sg = i % 2 ? 1 : -1, th = sg > 0 ? rr(.1, .8) : PI - rr(.1, .8), r = rad(s);
   N.copy(e1).multiplyScalar(Math.cos(th)).addScaledVector(e2, Math.sin(th)); ax(s, P).addScaledVector(N, r * .8);
   Ly.copy(e1).multiplyScalar(sg * rr(.5, .9)).addScaledVector(e2, rr(.15, .6)).addScaledVector(d, rr(.3, .7)).normalize();
   Ln.copy(e2).addScaledVector(V3(rr(-1, 1), 0, rr(-1, 1)), .35); Ln.addScaledVector(Ly, -Ln.dot(Ly)).normalize();
   const sz = rr(.85, 1.2) * (C.great ? 1 : .9) * (1 - .3 * f), kind = f > .84 && rnd() < .45 ? 2 : !C.great && f < .22 && rnd() < .4 ? 3 : rnd() < .32 ? 1 : 0;
   const L = compoundLeaf(P.clone(), Ly.clone(), Ln.clone(), sz, kind, f < .55 && rnd() < .75, { amp: 1 });
   for (const g of L.leaf) put(M.leaf, cnAll(skinW(g, () => caneW(C, s)), C.k, f));
   for (const g of L.stalk) put(M.vc, cnAll(skinW(g, () => caneW(C, s)), C.k, f));
  }
  // fruit: a heavy bunch near the tip of each arm, the mane and the front and side legs, on its own pendulum, and a second
  // smaller one further in on the great canes
  if (C.g !== 'B') for (const f of C.great ? [.9, .66] : [.9]) {
   const s = f * len, ip = Math.min(NS, Math.round(s / C.seg)), w = [0, 0]; wob(s, w);
   const local = V3(w[0], w[1] - rad(s) * .8, s - ip * C.seg), at = ax(s, V3()).addScaledVector(e2, -rad(s) * .8);
   const nb = Math.max(3, Math.round((C.great ? 8 : 6) * (f < .8 ? .6 : 1) * (1 + .3 * TIER) * (.85 + .3 * rnd()) * Math.max(.5, DET)));
   const bb = addBunch(C.chain[ip], local, at, nb, (C.great ? 3.6 : 3) * (f < .8 ? .85 : 1) * (1 + .1 * TIER), [C.k, f]);
   if (f > .8) C.bunch1 = bb;
  }
  // where a leg's tip touches the soil it has rooted, as bramble tips do: a tuft of fine roots into the ground
  if (!C.great) {
   const s = len * .985, base0 = ax(s, V3());
   for (let i = 0; i < Q(6, 3); i++) {
    const a = rnd3() * TAU, L = r3(.18, .45), p1 = base0.clone().add(V3(Math.cos(a) * L * .4, -L * .35, Math.sin(a) * L * .4)), p2 = base0.clone().add(V3(Math.cos(a) * L, -L, Math.sin(a) * L));
    const g = tube([base0.clone(), p1, p2], 4, 3, (t) => .012 * (1 - .8 * t)); colorAll(g, [.52, .42, .34]);
    put(M.vc, cnAll(skinW(g, () => caneW(C, s)), C.k, .99));
   }
  }
 }
 // leaves round the legs' bases, hiding where they leave the mound
 for (const C of CANES) if (!C.great) for (let i = 0; i < Q(6, 3); i++) {
  const s = rr(.05, 1.3), P = C.ax(s, V3()).addScaledVector(YAX, C.rad(s) * .6), Ly = V3().copy(C.e1).multiplyScalar(rr(-1, 1)).addScaledVector(YAX, rr(.4, .9)).addScaledVector(C.d, rr(-.2, .5)).normalize();
  const Ln = V3(rr(-.5, .5), 1, rr(-.5, .5)); Ln.addScaledVector(Ly, -Ln.dot(Ly)).normalize();
  const L = compoundLeaf(P, Ly, Ln, rr(.8, 1.1), rnd() < .3 ? 1 : 0, true, { amp: .8 });
  for (const g of L.leaf) put(M.leaf, cnAll(skinW(g, () => caneW(C, s)), C.k, s / C.len));
  for (const g of L.stalk) put(M.vc, cnAll(skinW(g, () => caneW(C, s)), C.k, s / C.len));
 }

 // ---------- the mound's own leaves: the thicket it hides in, dead ones low down, fallen ones round it, and fruit ----------
 {
  const P = V3(), N = V3(), Ly = V3(), Ln = V3();
  for (let i = 0, n = Q(300, 60); i < n; i++) {
   const a = rnd() * TAU, e0 = Math.asin(Math.pow(rnd(), .75)) * 1.1, low = e0 < .35, e = Math.min(e0, 1.2);
   domeP(e, a, rr(.98, 1.18), P); domeN(e, a, N); P.y += .03;
   Ly.copy(N).add(V3(rr(-.5, .5), rr(.2, .7), rr(-.5, .5))).normalize();
   Ln.copy(YAX).multiplyScalar(.7).addScaledVector(N, .5).add(V3(rr(-.3, .3), 0, rr(-.3, .3))); Ln.addScaledVector(Ly, -Ln.dot(Ly)).normalize();
   const kind = low && rnd() < .4 ? 3 : rnd() < .08 ? 2 : rnd() < .35 ? 1 : 0;
   const L = compoundLeaf(P.clone().addScaledVector(Ly, -.08), Ly.clone(), Ln.clone(), rr(.8, 1.15), kind, rnd() < .6, { amp: .7 });
   for (const g of L.leaf) put(M.leaf, cnAll(skinW(g, () => [[BI.mass, 1]]), -1, 0));
   for (const g of L.stalk) put(M.vc, cnAll(skinW(g, () => [[BI.mass, 1]]), -1, 0));
  }
  // fallen leaves on the soil round it: wine-red and brown, lying flat, held by the ground
  for (let i = 0, n = Q(110, 20); i < n; i++) {
   const a = rnd() * TAU, R = CR * (.9 + 1.6 * Math.sqrt(rnd())); P.set(Math.sin(a) * R, .025, Math.cos(a) * R);
   Ly.set(rr(-1, 1), rr(-.05, .08), rr(-1, 1)).normalize(); Ln.set(rr(-.15, .15), 1, rr(-.15, .15)); Ln.addScaledVector(Ly, -Ln.dot(Ly)).normalize();
   const L = compoundLeaf(P.clone(), Ly.clone(), Ln.clone(), rr(.5, .8), rnd() < .55 ? 3 : 1, rnd() < .5, { amp: .05, thin: 1 });
   for (const g of L.leaf) put(M.leaf, cnAll(skinW(g, () => [[BI.ground, 1]]), -1, 0));
   for (const g of L.stalk) put(M.vc, cnAll(skinW(g, () => [[BI.ground, 1]]), -1, 0));
  }
  for (let i = 0, nb = Math.max(3, Math.round(6 * DET)); i < nb; i++) { const at = domeP(rr(.4, .95), (i + rnd() * .6) / nb * TAU, 1.05, V3()); addBunch(mass, at, at, Math.max(3, Math.round(rr(4, 7) * Math.max(.5, DET))), 2.6, [-1, 0]); }
 }
