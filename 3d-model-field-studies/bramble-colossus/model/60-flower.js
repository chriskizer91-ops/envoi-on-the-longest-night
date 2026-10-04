 // ---------- the bud: five sepals round five petals, a crowd of stamens, a ring of fangs, and the heart ----------
 for (const F of SEP.concat(PET)) {
  const isS = F.n === 3, out = V3(Math.sin(F.a), 0, Math.cos(F.a)), tg = V3(Math.cos(F.a), 0, -Math.sin(F.a)), B = V3(out.x * F.r, BY + F.y, out.z * F.r), W = isS ? 1.5 : 1.55, cup = isS ? .2 : .28;
  const ph = rnd() * 9, crink = isS ? 0 : .022, nu = Q(isS ? 12 : 16, 6), nv = Q(isS ? 24 : 18, 8);
  const g = surf(nu, nv, (u, v, o) => {
   const xn = u * 2 - 1, x = xn * W / 2, c = cup * W * xn * xn * Math.sin(PI * Math.min(1, .15 + v)) + (isS ? .05 * W * Math.pow(Math.abs(xn), 3) * v : .06 * W * Math.pow(Math.abs(xn), 4) * v);
   const wr = crink * (Math.sin(u * 23 + v * 5 + ph) * .6 + Math.sin(v * 31 + u * 7 + ph * 2) * .4) * sm(0, .3, v);
   o[0] = B.x + tg.x * x - out.x * (c + wr); o[1] = B.y + v * F.len; o[2] = B.z + tg.z * x - out.z * (c + wr);
  }, (u, v) => [(isS ? .5 : 0) + u * .5, v]);
  colorAll(g, isS ? [DARK, DARK, DARK] : [1, 1, 1]);
  put(M.bloom, skinW(g, (x, y) => chainW(F.ch, F.seg, F.n, y - B.y)));
  if (isS) { // prickles down its back, and a hooked claw at its tip
   for (let i = 0; i < Q(7, 4); i++) { const s = (.14 + i * .12) * F.len, P = B.clone().addScaledVector(YAX, s).addScaledVector(out, .02).addScaledVector(tg, r3(-.12, .12)); put(M.vc, skinW(prickle(P, out.clone().addScaledVector(YAX, .35).normalize(), YAX, .2 * THS, .07), () => chainW(F.ch, F.seg, F.n, s))); }
   const s = F.len * .96; put(M.vc, skinW(prickle(B.clone().addScaledVector(YAX, s), YAX.clone().addScaledVector(out, -.5).normalize(), out, .36 * THS, .08, .9), () => chainW(F.ch, F.seg, F.n, s)));
  }
 }
 for (let i = 0, n = Q(170, 36); i < n; i++) { // stamens: pale filaments in three rings round the heart, gold anthers at their tips
  const ring = i % 3, a = (i + rnd3() * .8) / n * TAU, r0 = rr(.56, .66) - ring * .03, r1 = r0 + rr(.2, .45) + ring * .1, h = rr(.42, .74) + ring * .08, y0 = BY + .14;
  const p0 = V3(Math.sin(a) * r0, y0, Math.cos(a) * r0), p1 = V3(Math.sin(a) * (r0 + r1) * .5, y0 + h * .72, Math.cos(a) * (r0 + r1) * .5), p2 = V3(Math.sin(a) * r1, y0 + h, Math.cos(a) * r1);
  const f = tube([p0, p1, p2], DET > .6 ? 5 : 3, DET > .6 ? 4 : 3, (t) => .013 * (1 - .45 * t));
  colorAll(f, [.92, .8, .82]); put(M.vc, rigid(f, stam));
  const an = new THREE.SphereGeometry(.035, DET > .6 ? 6 : 4, DET > .6 ? 4 : 3); an.deleteAttribute('uv'); an.scale(1, 1.6, 1); an.rotateZ(rr(-.5, .5)); an.translate(p2.x, p2.y + .03, p2.z); colorAll(an, [.98, .72, .26]); put(M.vc, rigid(an, stam));
 }
 for (let i = 0; i < 10; i++) { // a ring of fangs, curving in over the heart
  const a = (i + .5) / 10 * TAU, out = V3(Math.sin(a), 0, Math.cos(a));
  put(M.vc, rigid(prickle(V3(out.x * .7, BY + .1, out.z * .7), V3(-out.x * .6, .8, -out.z * .6).normalize(), out, .58 * THS, .11, .85), bud));
 }
 { // the heart: a blackberry as big as a barrel, its drupelets lit from inside, each with its style still standing
  const o = { p: [], n: [], c: [], i: [], h: [] }, HR = .58, HL = 1.2, cy = BY + .12 + HL * .5, N = Q(320, 80), _t = V3(), _qq = new THREE.Quaternion(), _z = V3(0, 0, 1), nn = V3();
  const CG = DRUP.p.length / 3, ring1 = DET > .6 ? 7 : 5, hc = lc([.22, .03, .1]);
  for (let k = 0; k < N; k++) {
   const z = 1 - 2 * (k + .5) / N, q = Math.sqrt(1 - z * z), th = k * 2.39996, nx = q * Math.cos(th), nz = q * Math.sin(th), r = HR * .18 * Math.sqrt(130 / N) * 1.25 * (1 - .3 * Math.max(0, -z)) * (.92 + .16 * rnd3()), gl = rnd3();
   const px = nx * HR, py = cy + z * HL * .5, pz = nz * HR, b = o.p.length / 3;
   _qq.setFromUnitVectors(_z, nn.set(nx / HR, z / (HL * .5), nz / HR).normalize());
   for (let m = 0; m < CG; m++) { _t.set(DRUP.p[m * 3], DRUP.p[m * 3 + 1], DRUP.p[m * 3 + 2]).applyQuaternion(_qq); o.p.push(px + _t.x * r, py + _t.y * r, pz + _t.z * r); o.n.push(_t.x, _t.y, _t.z); o.c.push(hc[0], hc[1], hc[2]); o.h.push(.12 + .55 * gl, m === 0 ? 1 : m <= ring1 ? .55 : 0); }
   for (const ii of DRUP.i) o.i.push(b + ii);
   if (DET > .6 && rnd3() < .7) { // a style: a fine glowing whisker
    const hb = o.p.length / 3, L = r * r3(.9, 1.6), w = r * .06, e = V3().crossVectors(nn, Math.abs(nn.y) < .9 ? YAX : _z).normalize();
    _t.set(px, py, pz).addScaledVector(nn, r * .9);
    o.p.push(_t.x - e.x * w, _t.y - e.y * w, _t.z - e.z * w, _t.x + e.x * w, _t.y + e.y * w, _t.z + e.z * w, _t.x + nn.x * L, _t.y + nn.y * L, _t.z + nn.z * L);
    for (let m = 0; m < 3; m++) { o.n.push(nn.x, nn.y, nn.z); o.c.push(hc[0], hc[1], hc[2]); o.h.push(.05, .3); }
    o.i.push(hb, hb + 1, hb + 2, hb, hb + 2, hb + 1);
   }
  }
  const b = o.p.length / 3; for (let m = 0; m < CORE.p.length; m += 3) { o.p.push(CORE.p[m] * HR * .9, cy + CORE.p[m + 1] * HL * .45, CORE.p[m + 2] * HR * .9); o.n.push(CORE.p[m], CORE.p[m + 1], CORE.p[m + 2]); o.c.push(hc[0] * .4, hc[1] * .4, hc[2] * .4); o.h.push(.06, 0); }
  for (const ii of CORE.i) o.i.push(b + ii);
  put(M.heart, rigid(geo(o.p, o.i, { normal: [o.n, 3], color: [o.c, 3], aHt: [o.h, 2] }), heart));
 }

 // ---------- Thornwood: thorned shoots as tall as young trees that burst up out of the soil round the prey ----------
 // Each is a chain of UN + 1 bones under the ground bone, built along +Z and parked under the soil at a scale of nothing;
 // animate() plants them in a ring round the prey's feet, grows them up, closes them over it and draws them back down.
 const SNARE = [], UN = 4, NE = Q(10, 7);
 for (let m = 0; m < NE; m++) {
  const len = r2(3, 4.2), seg = len / UN, B = V3(0, -1, 0), d = V3(0, 0, 1), e1 = V3(1, 0, 0), e2 = V3(0, 1, 0), tw = r2(-.3, .3);
  const b0 = bone('u' + m + '_0', ground, B.x, B.y, B.z, 'YXZ');
  const chain = [b0]; for (let i = 1; i <= UN; i++) chain.push(bone('u' + m + '_' + i, chain[i - 1], 0, 0, seg));
  const rad = (s) => lerp(.19, .03, Math.pow(Math.max(0, s) / len, .8)) * sm(len + .04, len - .14, s) * (1 + .12 * Math.exp(-Math.pow(((Math.max(0, s) / .8) % 1 - .5) * 6, 2)));
  const ph = r2(0, TAU), wob = (s, w) => { w[0] = .07 * Math.sin(s * 1.6 + ph); w[1] = .05 * Math.sin(s * 1.2 + ph * 1.3); };
  const g = rodTube(B, d, e1, e2, -.1, len + .04, Q(60, 12), Q(15, 6), (s, th) => rad(s) * (1 + .08 * (2 * RIDGE(th, s, tw) - 1)), wob, 1.6), S = g.userData.S, TH = g.userData.TH;
  skinW(g, (x, y, z, i) => chainW(chain, seg, UN, S[i])); attr(g, 'color', 3, (i, o) => { const f = S[i] / len, ao = lerp(.76, 1.05, RIDGE(TH[i], S[i], tw)); o[0] = lin1(lerp(.95, .86, f) * ao); o[1] = lin1(lerp(.88, 1.1, f) * ao); o[2] = lin1(lerp(.9, .72, f) * ao); });
  attr(g, 'aVn', 2, (i, o) => { o[0] = .5 * (1 - RIDGE(TH[i], S[i], tw)); o[1] = 1.4 + S[i] / len * .5; });
  put(M.bark, cnAll(g, -1, 0));
  const P = V3(), N = V3(), w = [0, 0];
  for (let i = 0, n = Q(Math.round(len * 16), 8); i < n; i++) {
   const s = lerp(.15, len * .95, (i + r3(.1, .9)) / n), th = Math.floor(rnd3() * 5) * TAU / 5 - tw * s + r3(-.1, .1), r = rad(s); wob(s, w);
   N.copy(e1).multiplyScalar(Math.cos(th)).addScaledVector(e2, Math.sin(th)); P.copy(B).addScaledVector(d, s).addScaledVector(e1, w[0]).addScaledVector(e2, w[1]).addScaledVector(N, r * .9);
   const tl = (r * 1.1 + .06) * 1.3 * THS; put(M.vc, cnAll(skinW(prickle(P.clone(), N.clone(), d, tl, tl * .42, r3(.6, .95)), () => chainW(chain, seg, UN, s)), -1, 0));
  }
  for (let i = 0; i < Q(4, 2); i++) {
   const s = r2(.3, .85) * len, sg = i % 2 ? 1 : -1; wob(s, w); P.copy(B).addScaledVector(d, s).addScaledVector(e1, w[0]).addScaledVector(e2, w[1]);
   const Ly = V3().copy(e1).multiplyScalar(sg * r2(.5, .9)).addScaledVector(d, r2(.3, .7)).addScaledVector(e2, r2(-.3, .3)).normalize(), Ln = V3().copy(e2).addScaledVector(d, .3);
   Ln.addScaledVector(Ly, -Ln.dot(Ly)).normalize();
   const L = compoundLeaf(P.clone().addScaledVector(Ly, .06), Ly, Ln, r2(.5, .7), rnd2() < .7 ? 2 : 0, false, { amp: 1.2, thin: rnd2() });
   for (const gg of L.leaf) put(M.leaf, cnAll(skinW(gg, () => chainW(chain, seg, UN, s)), -1, 0));
   for (const gg of L.stalk) put(M.vc, cnAll(skinW(gg, () => chainW(chain, seg, UN, s)), -1, 0));
  }
  SNARE.push({ chain, len, a: (m + r2(-.3, .3)) / NE * TAU, R: r2(1.3, 1.9), t0: r2(0, .06), lean: r2(.25, .45), curl: r2(.3, .4), ph: r2(0, TAU), g: 0, up: false, down: false });
 }
