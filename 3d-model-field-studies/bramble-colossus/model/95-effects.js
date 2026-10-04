 // ---------- effects ----------
 const fxS = { acc: { shed: 0, dust: 0, lure: 0, drain: 0, fire: 0, rip: 0, sap: 0, erupt: 0, vortex: 0, ember: 0, steam: 0 } };
 const STEAMC = C3(.62, .62, .7), STEAMH = C3(1, .55, .66);
 const GROWC = C3(.55, .95, .3), BURNC = C3(1, .6, .22), C1 = new THREE.Color(), LEAFC = C3(.42, .58, .28), DEADC = C3(.62, .46, .26), DUSTC = C3(.34, .27, .2), CHIPC = C3(.2, .1, .08);
 const SWEET = [C3(1, .72, .45), C3(1, .5, .62), C3(1, .9, .7)], DRAINC = C3(.75, 1, .42), PETALC = C3(.95, .8, .82);
 const JUICEC = C3(.3, .015, .09), SOILC = C3(.16, .11, .07), SMOKEC = C3(.13, .11, .11), FLAMEC = C3(1, .8, .4), EMBERC = C3(1, .45, .12);
 const BERRYGLOW = C3(.55, .12, .2);
 const VEINC = C3(1, .14, .42), WRATHC = C3(1, .3, .08), HEARTC = C3(1, .16, .36);
 const lim = (C) => (C.cutJ >= 0 ? C.cutJ - 1 : NS);
 const tipW = (C, out) => C.chain[lim(C)].getWorldPosition(out);
 function canePt(C, f, out) {
  const s = f * C.len, j = Math.min(Math.floor(s / C.seg), NS - 1);
  if (j + 1 > lim(C)) return tipW(C, out);
  C.chain[j].getWorldPosition(out); C.chain[j + 1].getWorldPosition(_d); return out.lerp(_d, s / C.seg - j);
 }
 const crossed = (name, u, n, h) => name === n && lastName === n && lastU < h && u >= h;
 function leafBurst(p, n, spread, wither, col) {
  for (let i = 0; i < n; i++) emit(LF, p.x + (rnd() - .5) * spread, p.y + (rnd() - .5) * spread, p.z + (rnd() - .5) * spread, (rnd() - .5) * 3.4, rnd() * 2.6, (rnd() - .5) * 3.4, 2 + rnd() * 1.2, C1.copy(col || LEAFC).lerp(DEADC, wither).multiplyScalar(.8 + .4 * rnd()), 1, (.22 + .12 * rnd()) * SZ, (.22 + .12 * rnd()) * SZ, 1.8, -1.6, (rnd() - .5) * 8, .7);
 }
 function chips(p, n, sp) { for (let i = 0; i < n; i++) emit(CHP, p.x, p.y, p.z, (rnd() - .5) * sp, rnd() * sp * .8, (rnd() - .5) * sp, .7 + rnd() * .5, CHIPC, .95, (.05 + .04 * rnd()) * SZ, .03 * SZ, 1.2, -8); }
 function puff(p, n, s) { for (let i = 0; i < n; i++) { const a = rnd() * TAU; emit(DU, p.x + Math.cos(a) * .2 * s, Math.max(.1, p.y), p.z + Math.sin(a) * .2 * s, Math.cos(a) * .9 * s, .3 + rnd() * .4, Math.sin(a) * .9 * s, 1.4 + rnd() * .8, DUSTC, .5, .5 * s * SZ, 1.5 * s * SZ, 1.5, .12); } }
 // berry juice and dark sap: heavy drops that fall and splash; clods of soil thrown up out of the ground
 function juice(p, n, sp) { for (let i = 0; i < n; i++) emit(CHP, p.x, p.y, p.z, (rnd() - .5) * sp, (.2 + rnd() * .8) * sp, (rnd() - .5) * sp, .7 + rnd() * .5, JUICEC, 1, (.06 + .05 * rnd()) * SZ, .04 * SZ, .5, -9); }
 function clods(p, n, sp, up) { for (let i = 0; i < n; i++) { const a = rnd() * TAU, r = rnd() * sp; emit(CHP, p.x + Math.cos(a) * .15, p.y + .03, p.z + Math.sin(a) * .15, Math.cos(a) * r, up * (.6 + rnd() * .7), Math.sin(a) * r, .8 + rnd() * .6, SOILC, 1, (.07 + .08 * rnd()) * SZ, .05 * SZ, .35, -9.8); } }
 function ring(n, r0, r1, s) { for (let i = 0; i < n; i++) { const a = rnd() * TAU, r = rr(r0, r1) * SZ; _a.set(root.position.x + Math.cos(a) * r, .1, root.position.z + Math.sin(a) * r); emit(DU, _a.x, _a.y, _a.z, Math.cos(a) * 1.4, .4 + rnd() * .5, Math.sin(a) * 1.4, 1.5 + rnd() * .7, DUSTC, .55, .6 * s * SZ, 1.9 * s * SZ, 1.4, .12); } }
 // the cracks: strip i runs from ckA[i] to ckB[i], w (by SZ) to each side; open how far along they have split (0 to 1.1)
 let ckUsed = false;
 function crackDraw(open, glow, fade, w) {
  for (let i = 0; i < NCK; i++) {
   const A = ckA[i], B = ckB[i], dx = B.x - A.x, dz = B.z - A.z, len = Math.hypot(dx, dz) || 1, ww = w * SZ * ckOn[i] * (len > .3 ? 1 : 0), sx = dz / len * ww, sz = -dx / len * ww;
   ckPos.set([A.x - sx, A.y, A.z - sz, A.x + sx, A.y, A.z + sz, B.x - sx, B.y, B.z - sz, B.x + sx, B.y, B.z + sz], i * 12);
  }
  ckG.attributes.position.needsUpdate = true; crack.visible = ckUsed = true;
  const cu = crack.material.uniforms; cu.uOpen.value = open; cu.uGlow.value = glow; cu.uFade.value = fade;
 }
 const cracksFrom = (c, L0, L1) => { for (let i = 0; i < NCK; i++) { const a = (i + rr(-.3, .3)) / NCK * TAU, L = rr(L0, L1) * SZ; ckA[i].copy(c); ckB[i].set(c.x + Math.sin(a) * L, c.y, c.z + Math.cos(a) * L); ckOn[i] = 1; } };
 // Thorn Volley: [launched at, lands at, how many], each wave thrown from the arms' and the mane's tips
 const VOLLEY = [[.38, .58, 9], [.42, .68, 9], [.5, .78, 10]];
 function launch(a, b, T) { const S = TVS[tvN++ % NTV]; S.p0.copy(a); S.v.subVectors(b, a).multiplyScalar(1 / T); S.v.y += 4.9 * T; S.t = 0; S.T = T; S.stick = -1; S.spin = rr(-9, 9); }
 const _m4b = new THREE.Matrix4(), _sc = V3();
 function stepVolley(dt) {
  let any = false;
  for (let i = 0; i < NTV; i++) {
   const S = TVS[i]; if (S.t < 0) continue; any = true; S.t += dt;
   if (S.stick < 0) { // in flight, point first along its arc
    const tt = Math.min(S.t, S.T); _a.copy(S.p0).addScaledVector(S.v, tt); _a.y -= 4.9 * tt * tt; S.d.copy(S.v); S.d.y -= 9.8 * tt; S.d.normalize();
    if (S.t >= S.T) { S.stick = 0; _a.y = root.position.y; _c.copy(_a); clods(_c, 5, 1.8, 2.6); puff(_c, 2, .9); chips(_c, 4, 2.4); }
    _q.setFromUnitVectors(_z1, S.d).multiply(_q2.setFromAxisAngle(_z1, S.spin * S.t)); _a.addScaledVector(S.d, -(S.stick < 0 ? .5 : .72) * SZ);
    if (S.stick === 0) S.p0.copy(_a);
    TV.setMatrixAt(i, _m4b.compose(_a, _q, _sc.setScalar(SZ)));
   } else { // stuck in the soil; after a while it crumbles away
    S.stick += dt; const k = 1 - sm(1.8, 2.4, S.stick);
    if (k <= 0) { S.t = -1; TV.setMatrixAt(i, M0); _c.copy(S.p0).addScaledVector(S.d, .7 * SZ); puff(_c, 2, .7); continue; }
    _q.setFromUnitVectors(_z1, S.d).multiply(_q2.setFromAxisAngle(_z1, S.spin * S.T)); TV.setMatrixAt(i, _m4b.compose(S.p0, _q, _sc.setScalar(SZ * k)));
   }
  }
  if (any || stepVolley.was) TV.instanceMatrix.needsUpdate = true; stepVolley.was = any;
 }
 function updateFX(name, u, t, dt, fk, phase) {
  const P = FIN;
  ckUsed = false;
  // whip trails: which canes trail depends on the move
  const trW = (C) => (name === 'whirl' ? 1.7 : name === 'lance' ? +(C === LEAD) : name === 'volley' ? +C.great : +(C === LEAD || C === MATE));
  let anyT = false;
  TR.forEach((T, r) => {
   const C = T.C, kk = P.trail * fk * trW(C) * (C.cutJ < 0 ? 1 : 0), o = r * TRN * 6;
   if (kk > .01) {
    anyT = true; tipW(C, _a); canePt(C, .88, _b);
    if (T.prev <= .01) for (let i = 0; i < TRN; i++) { T.tip[i].copy(_a); T.mid[i].copy(_b); }
    for (let i = TRN - 1; i > 0; i--) { T.tip[i].copy(T.tip[i - 1]); T.mid[i].copy(T.mid[i - 1]); }
    T.tip[0].copy(_a); T.mid[0].copy(_b);
    for (let i = 0; i < TRN; i++) { const k = kk * Math.pow(1 - i / (TRN - 1), 3), r0 = lerp(.24, .42, wrathV), g0 = lerp(.13, .1, wrathV), b0 = lerp(.16, .04, wrathV); trPos.set([T.tip[i].x, T.tip[i].y, T.tip[i].z, T.mid[i].x, T.mid[i].y, T.mid[i].z], o + i * 6); trCol.set([r0 * k, g0 * k, b0 * k, .02 * k, .01 * k, .01 * k], o + i * 6); }
   } else if (T.prev > .01) trCol.fill(0, o, o + TRN * 6);
   T.prev = kk;
  });
  trail.visible = anyT; if (anyT) trG.attributes.position.needsUpdate = trG.attributes.color.needsUpdate = true;
  // leaves shaken loose, dust, pollen
  const amb = fk * (name === 'die' ? 1 - sm(.7, .95, u) : 1);
  fxS.acc.shed += dt * (P.shed * 60 + .2 * P.rust) * amb;
  while (fxS.acc.shed >= 1) {
   fxS.acc.shed -= 1; const r = rnd();
   if (r < .3) mass.localToWorld(_a.set((rnd() - .5) * CR * 1.4, CH * rr(.4, 1.1), (rnd() - .5) * CR * 1.4)); else if (r < .45) spinePt(rr(.1, 1), _a); else canePt(CANES[(rnd() * NC) | 0], rr(.15, .95), _a);
   leafBurst(_a, 1, .2 * SZ, Math.max(P.wither, state.wilt * .5));
  }
  fxS.acc.dust += dt * P.dust * 60 * amb; while (fxS.acc.dust >= 1) { fxS.acc.dust -= 1; ring(1, CR * .9, CR * 2.4, 1); }
  // Siren Bloom's pollen: sweet glowing motes pouring off the heart and drifting over its prey
  fxS.acc.lure += dt * P.lure * 70 * fk;
  while (fxS.acc.lure >= 1) { fxS.acc.lure -= 1; heart.localToWorld(_a.set((rnd() - .5) * .6, rr(.5, 1.1), (rnd() - .5) * .6)); _b.subVectors(_tg, _a); const tm = rr(1.6, 2.6); emit(MO, _a.x, _a.y, _a.z, _b.x / tm + (rnd() - .5) * .6, _b.y / tm + rr(.2, .7), _b.z / tm + (rnd() - .5) * .6, tm * 1.05, SWEET[(rnd() * 3) | 0], .75, .14 * SZ, .07 * SZ, .25, -.3, 0, .35); }
  // the ribbons: pollen streaming from the heart to the prey (Siren Bloom), or stolen life spiralling down the spire into
  // the roots (Devour)
  const dk = cl(P.drain, 0, 1) * fk, lk = cl(P.lure * .6, 0, 1) * fk, rk = Math.max(dk, lk); drain.visible = rk > .01;
  if (drain.visible) {
   const pol = lk > dk; heart.localToWorld(_b.set(0, .8, 0));
   for (let r = 0, o = 0; r < DRN; r++) {
    const ph = r * TAU / DRN, cc = pol ? SWEET[r] : DRAINC;
    for (let i = 0; i <= DRS; i++, o += 6) {
     const s = i / DRS;
     if (pol) { const th = s * TAU * 1.3 + t * 3 + ph, rad = (.15 + .5 * Math.sin(PI * s)) * SZ; _a.copy(_b).lerp(_tg, s); _a.x += Math.cos(th) * rad; _a.y += Math.sin(PI * s) * (1.2 + .3 * r) * SZ + Math.sin(th) * rad * .6; _a.z += Math.sin(th) * rad; }
     else { const th = s * TAU * 2.2 - t * 4 + ph, rad = (.55 + .15 * Math.sin(s * 9 + t)) * SZ; spinePt(1 - s, _a); _a.x += Math.cos(th) * rad; _a.y += lerp(.6, -.2, s) * SZ; _a.z += Math.sin(th) * rad; }
     const w = (pol ? .06 : .1) * SZ * (1 - .4 * s), k = (pol ? .9 : 1.2) * rk * sm(0, .08, s) * sm(1, .9, s) * (.25 + .75 * Math.pow(Math.max(0, Math.sin(s * 14 - t * (pol ? 6 : 10) + ph * 2)), 2));
     drPos[o] = drPos[o + 3] = _a.x; drPos[o + 1] = _a.y - w; drPos[o + 4] = _a.y + w; drPos[o + 2] = drPos[o + 5] = _a.z;
     drCol[o] = drCol[o + 3] = cc.r * k; drCol[o + 1] = drCol[o + 4] = cc.g * k; drCol[o + 2] = drCol[o + 5] = cc.b * k * .85;
    }
   }
   drG.attributes.position.needsUpdate = drG.attributes.color.needsUpdate = true;
  }
  // fire: flames licking up along the canes, the spire and off the mound, with smoke and embers; and in its wrath, embers
  // rising off it all the time
  fxS.acc.fire += dt * P.fire * 160 * fk;
  while (fxS.acc.fire >= 1) {
   fxS.acc.fire -= 1; const r = rnd();
   if (r < .25) mass.localToWorld(_a.set((rnd() - .5) * CR * 1.3, CH * rr(.5, 1.05), (rnd() - .5) * CR * 1.3)); else if (r < .45) spinePt(rnd(), _a); else canePt(CANES[(rnd() * NC) | 0], rr(.1, .9), _a);
   emit(FL, _a.x, _a.y, _a.z, (rnd() - .5) * .5, 1 + rnd(), (rnd() - .5) * .5, .5 + rnd() * .4, FLAMEC, .9, (.6 + .4 * rnd()) * SZ, .15 * SZ, 1.2, 2.2, 0, .2);
   if (rnd() < .3) emit(DU, _a.x, _a.y + .2, _a.z, (rnd() - .5) * .3, .7 + rnd() * .5, (rnd() - .5) * .3, 1.6 + rnd() * .6, SMOKEC, .45, .5 * SZ, 1.8 * SZ, 1, .4);
   if (rnd() < .25) emit(MO, _a.x, _a.y, _a.z, (rnd() - .5) * 1.2, 1.2 + rnd(), (rnd() - .5) * 1.2, 1 + rnd() * .8, EMBERC, .9, .07 * SZ, .02 * SZ, .8, .6, 0, .4);
  }
  fxS.acc.ember += dt * wrathV * 16 * fk;
  while (fxS.acc.ember >= 1) { fxS.acc.ember -= 1; const r = rnd(); if (r < .4) spinePt(rnd(), _a); else if (r < .7) mass.localToWorld(_a.set((rnd() - .5) * CR * 1.5, CH * rr(.3, 1), (rnd() - .5) * CR * 1.5)); else canePt(CANES[(rnd() * NC) | 0], rr(.05, .6), _a); emit(MO, _a.x, _a.y, _a.z, (rnd() - .5) * .4, .5 + rnd() * .7, (rnd() - .5) * .4, 1.6 + rnd(), EMBERC, .8, .06 * SZ, .015 * SZ, .5, .3, 0, .35); }
  // the heart's light between the sepals (much brighter as it opens), and the firelight while it burns
  heart.localToWorld(heartLight.position.set(0, .6, 0)); heartLight.color.copy(U.heartC.value); heartLight.intensity = U.hb.value * (.5 + 1.7 * sm(.05, .9, P.op)) * .75;
  const fireI = cl(P.fire, 0, 1) * fk * 4 * (.78 + .22 * Math.sin(t * 31) * Math.sin(t * 17.3)); fireLight.intensity = fireI; if (fireI > 0) spinePt(.25, fireLight.position);
  // a severed cane's stump bleeds dark sap for a while
  for (const C of CANES) if (C.bleed > 0 && C.cutJ > 0) {
   C.bleed -= dt; fxS.acc.sap += dt * 18 * fk * Math.min(1, C.bleed);
   while (fxS.acc.sap >= 1) { fxS.acc.sap -= 1; C.chain[C.cutJ - 1].localToWorld(_a.set(0, 0, C.seg * .5)); emit(CHP, _a.x, _a.y, _a.z, (rnd() - .5) * .4, -.1, (rnd() - .5) * .4, .9, JUICEC, 1, .07 * SZ, .04 * SZ, .3, -7); }
  }
  // ---------- the moves ----------
  // Awakening: the ground trembles and splits, earth erupts as it heaves up, its legs slam down, and the bud roars open
  if (name === 'appear') {
   if (crossed(name, u, 'appear', ACTS.appear.cues[0])) { _a.set(root.position.x, root.position.y + .012, root.position.z); cracksFrom(_a, 6, 8.5); ring(24, CR * .5, CR * 2.4, 1.2); }
   const s0 = sm(.03, .16, u), fade = 1 - sm(.6, .75, u);
   if (s0 > 0 && fade > 0) crackDraw(s0 * 1.1, (.5 + .5 * sm(.1, .2, u)) * (1 - sm(.45, .7, u)), fade, .9);
   if (u > .12 && u < .46) { fxS.acc.erupt += dt * 110 * fk; while (fxS.acc.erupt >= 1) { fxS.acc.erupt -= 1; const a = rnd() * TAU, r = CR * rr(.5, 1.35) * SZ; _a.set(root.position.x + Math.sin(a) * r, root.position.y + .05, root.position.z + Math.cos(a) * r); if (rnd() < .6) clods(_a, 1, 2.2, 4.2); else puff(_a, 1, 1.4); } }
   if (crossed(name, u, 'appear', .5)) for (const C of CANES) if (!C.great) { tipW(C, _a); clods(_a, 8, 2.4, 3); puff(_a, 4, 1.1); }
   if (crossed(name, u, 'appear', ACTS.appear.cues[1])) { const x = root.position.x, z = root.position.z; shock(x, z, 1, 17 * SZ, 1.4, VEINC, .9, true); shock(x, z, 1, 12 * SZ, 1.8, DUSTC, .75, false); bud.localToWorld(_a.set(0, 1, 0)); leafBurst(_a, 20, 2.5 * SZ, 0); leafBurst(_a, 14, 2 * SZ, 0, PETALC); chips(_a, 20, 5); ring(30, CR * .6, CR * 2.8, 1.3); pulse(2.2); }
  }
  // Thorn Lance: a crater where it spears into the soil; it rips free
  if (crossed(name, u, 'lance', ACTS.lance.hits[0]) && LEAD.cutJ < 0) { tipW(LEAD, _a); chips(_a, 24, 4); juice(_a, 16, 3.4); leafBurst(_a, 8, .5 * SZ, 0); _b.set(_a.x, root.position.y + .05, _a.z); clods(_b, 26, 3, 4.5); puff(_b, 8, 1.5); shock(_b.x, _b.z, .3, 4.5 * SZ, .7, DUSTC, .75, false); }
  if (crossed(name, u, 'lance', .66) && LEAD.cutJ < 0) { tipW(LEAD, _a); chips(_a, 12, 3); clods(_a, 14, 2.4, 3.6); juice(_a, 8, 2.4); }
  // Hammerfall: the club lands; the ground splits from the crater and a shockwave runs out over the party
  if (name === 'slam') {
   if (crossed(name, u, 'slam', ACTS.slam.hits[0])) {
    tipW(LEAD, _a); tipW(MATE, _b); _a.lerp(_b, .5); _a.y = root.position.y + .012;
    clods(_a, 40, 4.4, 5.2); chips(_a, 26, 5); puff(_a, 14, 2.2); leafBurst(_a, 12, 1.5 * SZ, 0); juice(_a, 10, 3.4);
    shock(_a.x, _a.z, .5, 12 * SZ, 1.2, DUSTC, .9, false); shock(_a.x, _a.z, .3, 8 * SZ, .8, VEINC, .85, true); cracksFrom(_a, 4, 7); pulse(1.8);
   }
   const s0 = sm(.5, .6, u), fade = 1 - sm(.82, .97, u);
   if (s0 > 0 && fade > 0) crackDraw(s0 * 1.1, (.4 + .6 * sm(.5, .55, u)) * (1 - sm(.68, .9, u)), fade, 1);
   if (crossed(name, u, 'slam', .7)) for (const C of [LEAD, MATE]) if (C.cutJ < 0) { tipW(C, _a); chips(_a, 10, 2.6); clods(_a, 10, 2.2, 3.2); }
  }
  // Maelstrom: a vortex of dust and leaves round it while its canes whirl
  if (name === 'whirl') {
   fxS.acc.vortex += dt * P.trail * 80 * fk;
   while (fxS.acc.vortex >= 1) {
    fxS.acc.vortex -= 1; const a = rnd() * TAU, r = rr(3, 10) * SZ, x = root.position.x + Math.sin(a) * r, z = root.position.z + Math.cos(a) * r, v = 5 + rnd() * 4;
    emit(DU, x, .2, z, Math.cos(a) * v, .4 + rnd() * .8, -Math.sin(a) * v, 1.2 + rnd() * .6, DUSTC, .5, .7 * SZ, 2.2 * SZ, 1.4, .35);
    if (rnd() < .4) emit(LF, x, rr(.5, 3.5), z, Math.cos(a) * v * 1.2, rr(.5, 1.5), -Math.sin(a) * v * 1.2, 1.5, C1.copy(LEAFC).multiplyScalar(.8 + .4 * rnd()), 1, .25 * SZ, .25 * SZ, 1, -1, (rnd() - .5) * 12, .5);
   }
   for (const h of ACTS.whirl.hits) if (crossed(name, u, 'whirl', h)) for (const C of CANES) if (C.great && C.cutJ < 0) { tipW(C, _a); leafBurst(_a, 3, .4 * SZ, 0); chips(_a, 5, 3.4); }
  }
  // Thorn Volley: each whip-crack throws a wave of thorns in high arcs onto the ground round the prey
  for (const [ul, uh, n] of VOLLEY) if (crossed(name, u, 'volley', ul)) {
   const T = (uh - ul) * ACTS.volley.dur;
   for (let i = 0; i < n; i++) { const C = CANES[i % 4]; if (C.cutJ >= 0) continue; tipW(C, _a); const a = rnd() * TAU, r = Math.sqrt(rnd()) * 3.4 * SZ; _b.set(_tg.x + Math.sin(a) * r, root.position.y, _tg.z + Math.cos(a) * r); launch(_a, _b, T * rr(.94, 1)); chips(_a, 2, 2); }
  }
  stepVolley(dt);
  // Devour: the arms seize; the flower takes the prey and shuts; three gulps; it spits it back out
  if (name === 'devour') {
   if (crossed(name, u, 'devour', ACTS.devour.hits[0])) for (const C of [LEAD, MATE]) if (C.cutJ < 0) { tipW(C, _a); chips(_a, 10, 3.4); leafBurst(_a, 4, .3 * SZ, 0); }
   if (crossed(name, u, 'devour', .5)) { bud.localToWorld(_a.set(0, 1.2, 0)); leafBurst(_a, 14, 1.4 * SZ, 0, PETALC); juice(_a, 16, 3.4); pulse(1.6); }
   for (const h of ACTS.devour.hits.slice(1)) if (crossed(name, u, 'devour', h)) { bud.localToWorld(_a.set(0, 1, 0)); for (let i = 0; i < 18; i++) emit(MO, _a.x, _a.y, _a.z, (rnd() - .5) * 3.4, rnd() * 2.4, (rnd() - .5) * 3.4, .7, DRAINC, .85, .14 * SZ, .02 * SZ, 2.6); pulse(1.4); }
   if (crossed(name, u, 'devour', .86)) { bud.localToWorld(_a.set(0, 1.1, 0)); juice(_a, 22, 4.4); leafBurst(_a, 16, 1.6 * SZ, 0, PETALC); chips(_a, 10, 3.4); }
  }
  // Siren Bloom: a slow sweet ring of light as the flower opens
  if (crossed(name, u, 'bloom', ACTS.bloom.cues[0])) shock(root.position.x, root.position.z, 1, 11 * SZ, 2.4, SWEET[1], .4, true);
  // Thornwood: the canes stab into the soil, the ground splits toward the prey, the shoots burst up and sink back
  if (name === 'briar') {
   const UG = ACTS.briar;
   if (crossed(name, u, 'briar', UG.cues[0])) { pulse(2); for (const C of CANES) if (C.cutJ < 0 && C.g !== 'B' && C.g !== 'H') { tipW(C, _a); clods(_a, 8, 2.4, 3.2); puff(_a, 4, 1.2); } }
   _b.set(_tg.x, root.position.y + .012, _tg.z);
   if (crossed(name, u, 'briar', .318)) { let n = 0; for (const C of [LEAD, MATE].concat(CANES.filter((c) => c.g === 'F' || c.g === 'S'))) if (n < NCK && C.cutJ < 0) { tipW(C, ckA[n]); ckA[n].y = _b.y; ckOn[n++] = 1; } for (; n < NCK; n++) ckOn[n] = 0; }
   for (let i = 0; i < NCK; i++) ckB[i].copy(_b);
   const s0 = sm(.32, .44, u), fade = 1 - sm(.86, .98, u);
   if (s0 > 0 && fade > 0) {
    crackDraw(s0 * 1.1, (.45 + .55 * sm(.4, .46, u)) * (1 - sm(.7, .9, u)) * fk, fade * fk, 1);
    if (s0 < 1) { fxS.acc.rip += dt * 60; while (fxS.acc.rip >= 1) { fxS.acc.rip -= 1; const i = (rnd() * NCK) | 0; if (!ckOn[i]) continue; _c.copy(ckA[i]).lerp(_b, s0); puff(_c, 1, .9); if (rnd() < .5) clods(_c, 1, 1, 2.2); } }
   }
   for (const S of SNARE) {
    if (S.g > .02 && !S.up) { S.up = true; S.chain[0].getWorldPosition(_c); clods(_c, 10, 2.2, 4); puff(_c, 4, 1.4); chips(_c, 5, 3); }
    if (S.up && !S.down && u > .86 + S.t0 * .6) { S.down = true; S.chain[0].getWorldPosition(_c); puff(_c, 3, 1.2); clods(_c, 4, 1.2, 2); }
   }
   if (crossed(name, u, 'briar', UG.hits[0])) { _c.set(_tg.x, root.position.y + .05, _tg.z); clods(_c, 18, 3, 4.6); }
   if (crossed(name, u, 'briar', UG.hits[1])) { _c.copy(_tg); chips(_c, 20, 3.4); leafBurst(_c, 10, .8 * SZ, 0); }
   if (crossed(name, u, 'briar', UG.cues[1])) for (const C of CANES) if (C.cutJ < 0 && !C.great) { tipW(C, _a); clods(_a, 6, 1.6, 3); puff(_a, 2, .9); }
  } else if (SNARE[0].up) for (const S of SNARE) S.up = S.down = false;
  // Wrath: a ring of red light and a storm of embers as it bursts open
  if (crossed(name, u, 'enrage', ACTS.enrage.cues[0])) {
   const x = root.position.x, z = root.position.z; shock(x, z, 1, 19 * SZ, 1.5, WRATHC, 1, true); shock(x, z, .8, 13 * SZ, 1.9, DUSTC, .7, false);
   bud.localToWorld(_a.set(0, 1, 0)); for (let i = 0; i < 60; i++) emit(MO, _a.x, _a.y, _a.z, (rnd() - .5) * 9, rnd() * 6, (rnd() - .5) * 9, 1.2 + rnd(), EMBERC, 1, .12 * SZ, .03 * SZ, 1.4, -2);
   leafBurst(_a, 24, 3 * SZ, .2); ring(30, CR * .6, CR * 3, 1.4); pulse(2.4);
  }
  // the moments of being hurt, burnt and felled
  const fresh = curN !== 0 && curN !== lastN;
  if (name === 'hurt' && fresh) { spinePt(.5, _a); leafBurst(_a, 18, 1.4 * SZ, state.wilt * .5); chips(_a, 14, 3.6); juice(_a, 10, 2.6); }
  if (name === 'burn' && fresh) { spinePt(.4, _a); for (let i = 0; i < 30; i++) emit(FL, _a.x + (rnd() - .5) * CR * SZ, _a.y + rnd() * 2, _a.z + (rnd() - .5) * CR * SZ, (rnd() - .5) * 1.6, 1.4 + rnd(), (rnd() - .5) * 1.6, .6 + rnd() * .3, FLAMEC, 1, (.6 + .4 * rnd()) * SZ, .15 * SZ, 1.5, 1.8); leafBurst(_a, 14, 1.4 * SZ, .7); }
  if (crossed(name, u, 'die', .06)) pulse(2);
  if (crossed(name, u, 'die', ACTS.die.cues[0])) { spinePt(.06, _a); chips(_a, 30, 4.4); juice(_a, 14, 3); leafBurst(_a, 10, 1 * SZ, .3); }
  if (crossed(name, u, 'die', ACTS.die.cues[1])) { bud.localToWorld(_a.set(0, .8, 0)); _a.y = root.position.y + .05; shock(_a.x, _a.z, .5, 12 * SZ, 1.3, DUSTC, .9, false); clods(_a, 36, 4, 4.6); puff(_a, 14, 2.2); leafBurst(_a, 24, 2 * SZ, .5, PETALC); ring(24, CR * .5, CR * 2.6, 1.3); }
  if (crossed(name, u, 'die', ACTS.die.cues[2])) { pulse(2.2); heart.localToWorld(_a.set(0, .6, 0)); for (let i = 0; i < 40; i++) emit(MO, _a.x, _a.y, _a.z, (rnd() - .5) * 4, rnd() * 3, (rnd() - .5) * 4, 1 + rnd(), HEARTC, 1, .14 * SZ, .02 * SZ, 1.5, -1); }
  // the creep: a puff where each leg sets down
  if (walkS > .05) for (const C of CANES) if (!C.great) { const p0 = Math.sin(lastPhase + (C.k % 2) * PI), p1 = Math.sin(phase + (C.k % 2) * PI); if (p0 > 0 && p1 <= 0 && C.cutJ < 0) { tipW(C, _a); puff(_a, 2, .8); } }
  // the shockwaves race out and fade
  for (const S of SHK) if (S.m.visible) { S.t += dt; const f = S.t / S.dur; if (f >= 1) { S.m.visible = false; continue; } S.m.scale.setScalar(Math.max(.01, lerp(S.r0, S.r1, 1 - Math.pow(1 - f, 3)))); S.m.material.uniforms.uA.value = S.a * Math.pow(1 - f, 1.5) * sm(0, .05, f) * fk; }
  if (!ckUsed && crack.visible) crack.visible = false;
  // its breath: steam off the warm mound all the time, more from the bud as it opens and while it feeds, drifting downwind
  {
   const wnd = state.wind || { x: .35, z: .1 }, br = Math.max(0, state.breath === undefined ? 1 : +state.breath) * U.frost.value * 1.6;
   const so = sm(.1, .9, P.op);
   fxS.acc.steam += dt * br * fk * (9 + 26 * so + 18 * cl(P.feed, 0, 1.5) + 10 * cl(P.dust, 0, 1)) * (name === 'die' ? 1 - sm(.7, .9, u) : 1);
   while (fxS.acc.steam >= 1) {
    fxS.acc.steam -= 1; const fromBud = rnd() < .2 + .5 * so;
    if (fromBud) heart.localToWorld(_a.set(rr(-.4, .4), rr(.6, 1.3), rr(-.4, .4))); else mass.localToWorld(_a.set(...[rr(-1, 1), 0, rr(-1, 1)].map((v, i) => (i === 1 ? 0 : v * CR * .8)))).setY(root.position.y + rr(.3, 1.2) * CH * SZ);
    C1.copy(STEAMC).lerp(STEAMH, fromBud ? .25 + .5 * so : .05);
    emit(STM, _a.x, _a.y, _a.z, wnd.x * rr(.3, .8) + rr(-.08, .08), rr(.25, .55) * (fromBud ? 1.3 : 1), wnd.z * rr(.3, .8) + rr(-.08, .08), rr(3.5, 6), C1, rr(.1, .2), rr(.5, .9) * SZ, rr(2, 3.6) * SZ, .25, .06, rr(-.2, .2), .12);
   }
  }
  stepP(LF, dt, .1, t); stepP(DU, dt, .3, t); stepP(MO, dt, .2, t); stepP(CHP, dt, .05, t); stepP(FL, dt, .12, t); stepP(STM, dt, .3, t);
 }

 // ---------- losing a cane, and growing it back ----------
 function sever(k) {
  if (k === undefined || k === null) { const live = CANES.filter((c) => c.cutJ < 0 && c !== LEAD); const pool = live.length ? live : CANES.filter((c) => c.cutJ < 0); if (!pool.length) return -1; k = pool[(rnd() * pool.length) | 0].k; }
  const C = CANES[k]; if (!C || C.cutJ >= 0) return -1;
  const j = cl(Math.round(NS * rr(.42, .7)), 3, NS - 2), b = C.chain[j];
  canePt(C, j / NS, _a); chips(_a, 30, 4); leafBurst(_a, 12, .5 * SZ, 0); juice(_a, 20, 3.4);
  base.attach(b);
  C.cutJ = j; C.bleed = 3; C.piece = { b, j, t: 0, rest: false, vel: V3(Math.sin(C.a) * .6, .8, Math.cos(C.a) * .6) }; // in the body's own space
  U.cut.value[k].set((j - .5) / NS, (j + .5) / NS, 0, 1);
  return k;
 }
 function regrow() {
  for (const C of CANES) {
   if (C.cutJ < 0) continue;
   const b = C.chain[C.cutJ]; C.chain[C.cutJ - 1].add(b);
   for (let i = C.cutJ; i <= NS; i++) { const bd = C.chain[i].userData.bind; C.chain[i].position.copy(bd.p); C.chain[i].quaternion.copy(bd.q); }
   C.cutJ = -1; C.piece = null; C.bleed = 0; U.cut.value[C.k].set(2, 2, 0, 0);
  }
 }

