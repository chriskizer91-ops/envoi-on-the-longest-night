
 // ---------- every frame: the game model's animate(), line for line, but for what draws her flame (its shader's size and
 // whiteness), her glow (shared uniforms instead of rewriting emissive colours) and the trail (a smooth curve) ----------
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
  setIris(eyeX, eyeY);
  const hlOn = [false, false];
  eyes.forEach((e, i) => {
   const cc = (P && P.wink && i === 1) ? Math.max(close, sm(P.wink, P.wink + 0.08, u)) : close;
   e.lid.visible = e.low.visible = cc > 0.01;
   e.lid.scale.set(1, 0.085 + (0.8 - 0.085) * cc, 0.45 + 0.55 * cc);
   e.low.scale.set(1, 0.015 + 0.225 * cc, 0.45 + 0.55 * cc);
   e.lash.position.y = 0.038 - 0.076 * e.lid.scale.y;
   e.lash.scale.y = 1 - 0.85 * cc;
   hlOn[i] = cc < 0.35;
  });
  setShine(hlOn[0], hlOn[1]);

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
  U.time.value = t;
  const fs = (1 + 0.06 * Math.sin(t * 9)) * (1 + 0.9 * cast + 0.7 * mk) * flameS + 1e-4;
  flames[0].material.uniforms.uSize.value.set(0.2 * fs, 0.36 * fs); flames[1].material.uniforms.uSize.value.set(0.16 * fs, 0.29 * fs);
  for (const f of flames) f.material.uniforms.uWhite.value = whiteF;
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
  glowK = gk; trK = trance; U.glow.value = gk; U.trance.value = trance;
  tWing.visible = trance > 0.01;
  if (tWing.visible) { gwMF.opacity = gwMH.opacity = 0.85 * trance; const fl = Math.sin(t * 2.4); for (const sw of tSides) { sw.side.rotation.y = sw.sd * (0.45 + 0.3 * fl); sw.side.scale.set(sw.sd * (0.3 + 0.7 * trance), 0.3 + 0.7 * trance, 1); sw.fo.rotation.x = 0.08 * fl; } placeWings(); }
  tAura.visible = trance > 1e-3; // below this its additive light is under half a color step: nothing to draw
  tAura.material.opacity = 0.7 * trance; tAura.material.rotation = Math.sin(t * 0.5) * 0.1; tAura.scale.setScalar(1.2 + 0.1 * Math.sin(t * 1.7));
  for (const L of LINING) L.m.color.copy(L.c).lerp(INDIGO, trance);

  // dagger trail during strikes
  let trOn = 0;
  if (P && P.trail) for (const r of P.trail) trOn = Math.max(trOn, win(u, r[0], r[1], 0.05));
  if (trOn > 0 && trailOn === 0) { dagger.localToWorld(_t1.copy(tipL)); dagger.localToWorld(_t2.copy(midL)); for (let i = 0; i < TRN; i++) { trTip[i].copy(_t1); trMid[i].copy(_t2); } }
  trailOn = trOn; trail.visible = trOn > 0;
  if (trail.visible) {
   for (let i = TRN - 1; i > 0; i--) { trTip[i].copy(trTip[i - 1]); trMid[i].copy(trMid[i - 1]); }
   dagger.localToWorld(trTip[0].copy(tipL)); dagger.localToWorld(trMid[0].copy(midL));
   for (let i = 0; i < TRV; i++) {
    const s = i / TRS, i0 = Math.min(TRN - 1, Math.floor(s)), f = s - i0, im = Math.max(0, i0 - 1), i1 = Math.min(TRN - 1, i0 + 1), i2 = Math.min(TRN - 1, i0 + 2);
    cr1(trTip[im], trTip[i0], trTip[i1], trTip[i2], f, _t1); cr1(trMid[im], trMid[i0], trMid[i1], trMid[i2], f, _t2);
    const k = trOn * Math.pow(1 - s / (TRN - 1), 1.6);
    trPos.set([_t1.x, _t1.y, _t1.z, _t2.x, _t2.y, _t2.z], i * 6);
    trCol.set([k, k, k, 0.35 * k, 0.4 * k, 0.55 * k], i * 6);
   }
   trGeo.attributes.position.needsUpdate = true; trGeo.attributes.color.needsUpdate = true;
  }
 }

