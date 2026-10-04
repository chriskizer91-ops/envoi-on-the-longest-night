 // ---------- runtime ----------
 // state (written by the page or the battle): target, glow, wilt, wrath, open as the game's model; and for the field study:
 // xray (0 to 1, its roots under the meadow), frost (0 to 1, how cold the night is; its heart keeps the frost off its middle),
 // breath (0 to 1 and on, how much it steams), wind ({ x, z } in m/s, which way its steam drifts)
 const state = { target: null, glow: 1, wilt: 0, wrath: 0, open: 0, xray: 0, frost: undefined, breath: 1, wind: null };
 const FIN = Object.assign({}, BASE), TGT = Object.assign({}, BASE);
 let actv = null, gOn = false, gW = 0, fadeE = 1, liftV = 0, walkS = 0, lastName = '', lastU = 0, lastPhase = 0;
 // the idle cane that tastes the air (TW), the pulse running out along the veins (VW), where a held prey belongs, the char
 // fire leaves, the heartbeat (HB the time since the last one, beat its swell) and how far into its wrath it is
 const TW = { k: -1, t: 0, dur: 2, wait: 2.2, e: 0 }, VW = { t: 9, s: 0 }, held = V3();
 let charV = 0, holdV = 0, idleW = 1, playN = 0, curN = 0, lastN = 0, HB = 0, beat = 0, wrathV = 0, spInit = false, beatN = 0;
 function play(name, force) {
  let def = ACTS[name]; if (!def) return false;
  const gone = FIN.fade < .02 && (!actv || actv.name === 'die');
  if (gone && name !== 'appear') { name = 'appear'; def = ACTS.appear; }
  if (actv && !force) {
   if (actv.name === 'die' && name !== 'appear') return false;
   if (!def.interrupt && !(actv.def.hold && actv.t >= actv.def.dur - 1e-6)) return false;
  }
  if (def.snap) { for (const k of def.snap) FIN[k] = def.p[0][k]; for (const C of CANES) C.sp = null; spInit = false; for (const Bq of BERRIES) Bq.init = false; }
  if (name === 'appear') { regrow(); charV = 0; }
  actv = { name, def, t: 0, n: ++playN };
  return true;
 }
 // a pulse of light running out from the heart along the veins (strength s; about a second to reach the roots' ends)
 const pulse = (s) => { VW.t = 0; VW.s = s; };
 const _a = V3(), _b = V3(), _c = V3(), _d = V3(), _tg = V3(), _sd = V3(), _cf = V3(), _up = V3(), _z1 = V3(0, 0, 1), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion();
 const lerpA = (a, b, t) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * t;
 const TIPW = new Float32Array(NS + 1); TIPW[NS - 3] = .2; TIPW[NS - 2] = .35; TIPW[NS - 1] = .45;
 // follow-through: each cane joint chases its pose on a spring, stiff near its base and softer toward the tip (slightly
 // underdamped); the great canes are heavier and swing slower
 const SPK = Float32Array.from({ length: NS + 1 }, (_, i) => 1150 * (1 - .62 * i / NS)), SPD = SPK.map((k) => 2 * .42 * Math.sqrt(k));
 // where each group takes hold round the prey: sideways (toward its own side) and up, in meters
 const HOLD = { L: [.32, .12], M: [.32, -.12], H: [.4, .5], F: [.5, -.3], S: [.6, .4], B: [.5, .7] };
 const IK = { yaw: 0, phi: 0, kap: 0, s: 0 };
 // a constant-curvature arc from the cane's base whose point at s* passes through the target (in its parent's space); a far
 // target makes the cane stretch, moving s* out toward the tip, and what is left past s* coils round the prey
 function solveReach(C, T) {
  _a.copy(T); C.pb.worldToLocal(_a);
  const B = C.chain[0].position, dx = _a.x - B.x, dy = _a.y - B.y, dz = _a.z - B.z, d = Math.hypot(dx, dz), c = Math.hypot(d, dy), s = IK.s = cl(c, C.len * .74, C.len * .9);
  IK.yaw = Math.atan2(dx, dz);
  let kap = 0;
  if (c < s * .999) { let lo = 0, hi = TAU / s * .98; for (let i = 0; i < 18; i++) { const m = (lo + hi) / 2; if (2 * Math.sin(m * s / 2) / m - c > 0) lo = m; else hi = m; } kap = (lo + hi) / 2; }
  IK.phi = Math.min(2.5, Math.atan2(dy, d) + kap * s / 2); IK.kap = kap;
 }
 const st = { init: false, px: 0, pz: 0, acc: 0 }, PH = 1 / 120, DOWN = V3(0, -1, 0);
 // the spire's springs: each joint's pitch and side bend chase the pose, heavily; SPB is how much of the bow each joint takes
 const SPB = [0, 0, .06, .12, .2, .28, .34], SPX = SP.map(() => ({ x: 0, v: 0, z: 0, w: 0 }));
 // after the bind: each fruit bone's "down" in its own frame, so a bunch hangs plumb whatever holds it
 for (const Bq of BERRIES) { Bq.bone.getWorldQuaternion(_q); Bq.hang = DOWN.clone().applyQuaternion(_q.invert()).normalize(); Bq.dd = r2(0, .14); Bq.dk = 0; }
 // a point along the spire, f from its foot (0) to the bud (1)
 function spinePt(f, out) { const x = cl(f, 0, 1) * SPN, i = Math.min(SPN - 1, Math.floor(x)); SP[i].getWorldPosition(out); SP[i + 1].getWorldPosition(_d); return out.lerp(_d, x - i); }

 function animate(phase, walk, t, dt) {
  dt = dt > 0 ? Math.min(dt, .05) : 0;
  walk = cl(walk || 0, 0, 1);
  let u = 0, name = '';
  curN = actv ? actv.n : 0;
  if (actv) { actv.t += dt; u = Math.min(1, actv.t / actv.def.dur); name = actv.name; if (u >= 1 && !actv.def.hold) actv = null; }
  if (actv) evalKeys(actv.def, u, TGT); else Object.assign(TGT, BASE);
  if (name !== 'whirl') FIN.sw = Math.atan2(Math.sin(FIN.sw), Math.cos(FIN.sw)); // after Maelstrom's turns, without unwinding them
  gW += ((gOn && !actv ? 1 : 0) - gW) * (dt > 0 ? 1 - Math.exp(-dt * 7) : 0);
  const wk = actv ? 0 : walk;
  walkS += (wk - walkS) * (dt > 0 ? 1 - Math.exp(-dt * 6) : 1);
  if (gW > 1e-3) for (const k in GUARD) TGT[k] = lerp(TGT[k], GUARD[k], gW);
  if (walkS > 1e-3) for (const k in WALK) TGT[k] = lerp(TGT[k], WALK[k], walkS * (1 - gW));
  // the battle can hold the bud open, its heart bare, between its turns (state.open, 0 to 1)
  const heldOpen = cl(+state.open || 0, 0, 1); if (heldOpen > 0) { TGT.op = Math.max(TGT.op, 1.05 * heldOpen); TGT.hb = Math.max(TGT.hb, 1.3 * heldOpen); }
  const rate = actv ? actv.def.rate : 6, kk = dt > 0 ? 1 - Math.exp(-dt * rate) : 0;
  for (const q of KEYS) FIN[q] += (TGT[q] - FIN[q]) * kk;
  if (dt > 0) wrathV += (cl(+state.wrath || 0, 0, 1) - wrathV) * (1 - Math.exp(-dt * 1.2));
  const P = FIN, tt = t * (1 + .12 * wrathV);
  // the mound: breathing, the creep's bob, lean, twist and squash
  const breath = .5 + .5 * Math.sin(tt * .9), ps = .025 * P.pulse * (breath - .5);
  crown.position.set(0, P.y + walkS * .05 * Math.abs(Math.sin(phase)) + .012 * breath * P.pulse, 0);
  crown.rotation.set(P.lean + walkS * .04 + .01 * Math.sin(tt * .6) * P.pulse, P.tw + .014 * Math.sin(tt * .45) * P.pulse, P.rl + .01 * Math.sin(tt * .55) * P.pulse);
  mass.scale.set(1 + P.sq * .5 + ps, 1 - P.sq + ps * 1.4, 1 + P.sq * .5 + ps); crown.scale.setScalar(P.gr);
  // moved somewhere new by the battle: the springs start again
  const rx = root.position.x, rz = root.position.z;
  if (!st.init || Math.hypot(rx - st.px, rz - st.pz) > 3 * SZ) { st.init = true; for (const Bq of BERRIES) Bq.init = false; for (const C of CANES) C.sp = null; spInit = false; }
  st.px = rx; st.pz = rz;
  root.updateMatrixWorld(true);
  // the prey: state.target (world), or a point before it at chest height
  const tg = state.target; if (tg) _tg.set(tg.x, tg.y, tg.z); else root.localToWorld(_tg.set(0, 1.1, REACH * SZ));
  _sd.set(_tg.x - rx, 0, _tg.z - rz); const tl = _sd.length() || 1; _sd.set(_sd.z / tl, 0, -_sd.x / tl);
  // idle: every couple of seconds one cane lifts its tip and tastes the air, swaying, then settles (more often in its wrath)
  idleW += ((actv && !(actv.def.hold && actv.t >= actv.def.dur) ? 0 : 1 - gW) - idleW) * (dt > 0 ? 1 - Math.exp(-dt * 3) : 0);
  if (dt > 0) {
   if (TW.k < 0) { TW.wait -= dt; if (TW.wait <= 0) { const live = CANES.filter((c) => c.cutJ < 0); if (live.length) { TW.k = live[(rnd2() * live.length) | 0].k; TW.t = 0; TW.dur = r2(2, 3); } else TW.wait = 1; } }
   else { TW.t += dt; if (TW.t >= TW.dur) { TW.k = -1; TW.wait = r2(.8, 2.6) * (1 - .5 * wrathV); } }
  }
  TW.e = TW.k < 0 ? 0 : Math.pow(Math.sin(PI * cl(TW.t / TW.dur, 0, 1)), 2) * idleW * (1 - walkS);
  // the heartbeat: a double beat every 1.7 s (quicker in its wrath); while it waits, each one runs out along its veins
  if (dt > 0) { HB += dt; const per = 1.7 - .55 * wrathV; if (HB > per) { HB -= per; if (P.fade > .9) beatN++; if (!actv && P.fade > .9) pulse(.35 + .35 * TIER + .5 * wrathV); } }
  beat = (Math.exp(-Math.pow((HB - .08) / .06, 2)) + .6 * Math.exp(-Math.pow((HB - .32) / .07, 2))) * P.pulse;
  // the physics substeps this frame, for the springs of the canes, the spire and the fruit
  const nSteps = Math.min(8, Math.floor((st.acc + dt) / PH)); st.acc = nSteps === 8 ? 0 : st.acc + dt - nSteps * PH;
  // ---------- the spire: it turns to its prey (sk), pitches (sp), bows at the top (sb), bends to the side (ss), twists (sy)
  // and, felled, topples forward and to its right; each joint chases its pose on a heavy spring ----------
  crown.worldToLocal(_a.copy(_tg)); const aim = cl(Math.atan2(_a.x, _a.z), -1.1, 1.1) * P.sk;
  const swX = .02 * Math.sin(tt * .7) * P.pulse, swZ = .016 * Math.sin(tt * .53 + 1) * P.pulse;
  for (let i = 0; i <= SPN; i++) {
   const S = SPX[i], X = P.sp / (SPN + 1) + P.sb * SPB[i] + swX + (i ? .03 : .95) * P.fall, Z = P.ss / (SPN + 1) + swZ + (i ? .03 : .6) * P.fall;
   if (!spInit) { S.x = X; S.z = Z; S.v = S.w = 0; }
   for (let n = 0; n < nSteps; n++) { S.v += (95 * (X - S.x) - 10 * S.v) * PH; S.x += S.v * PH; S.w += (95 * (Z - S.z) - 10 * S.w) * PH; S.z += S.w * PH; }
   SP[i].rotation.set(S.x, (i < 2 ? aim * .5 : 0) + P.sy / (SPN + 1), S.z);
  }
  spInit = true; SP[0].updateMatrixWorld(true);
  // ---------- the bud: it opens (op) and flares past open, gulps (gp), and the heart beats ----------
  const so = Math.max(0, P.op), o1 = sm(0, 1, so), ox = Math.max(0, so - 1), po = sm(.25, 1, so);
  bud.scale.setScalar(1 + .07 * P.gp); bud.rotation.set(.035 * Math.sin(tt * 1.1) * P.pulse, 0, .03 * Math.sin(tt * .8 + 1) * P.pulse);
  heart.scale.setScalar(1 + .05 * beat + .06 * P.gp); stam.scale.setScalar(Math.max(1e-3, sm(.2, .85, so)));
  for (const F of SEP) {
   const th = lerp(PI / 2 - .3, .2, o1) - .45 * ox + .025 * Math.sin(tt * 1.7 + F.ph) * o1, cu = lerp(.48, -.26, o1) - .2 * ox;
   F.ch[0].rotation.set(-th, F.a, 0); for (let i = 1; i <= F.n; i++) F.ch[i].rotation.x = -cu * (i < F.n ? 1 : .5);
  }
  for (const F of PET) {
   const th = lerp(PI / 2 - .08, .5, po) - .25 * ox + .03 * Math.sin(tt * 1.3 + F.ph) * po, cu = lerp(.5, -.12, po);
   F.ch[0].rotation.set(-th, F.a, 0); for (let i = 1; i <= F.n; i++) F.ch[i].rotation.x = -cu * (i < F.n ? 1 : .5);
  }
  bud.updateMatrixWorld(true);
  // the flower's middle, where it feeds; where a held prey belongs, and how firmly it is held
  bud.localToWorld(_cf.set(0, .75, 0));
  held.copy(_tg); held.y += P.ikh; held.lerp(_cf, P.pull);
  holdV = cl(Math.max(cl(Math.max(P.Lk, P.Mk), 0, 1) * sm(.7, 1.7, P.wrap), P.inn), 0, 1) * cl(P.fade * 2, 0, 1);
  // ---------- canes ----------
  for (const C of CANES) {
   const g = C.g, nJ = C.cutJ >= 0 ? C.cutJ : NS + 1;
   let lift = P[g + 'l'] + C.dl, curl = P[g + 'c'] + C.dc, tip = P[g + 't'];
   const w = P[g + 'w'] * (1 + .5 * wrathV), k = P[g + 'k'];
   let yaw = C.a - C.sgn * P[g + 'y'] + P.sw + w * .03 * Math.sin(tt * .6 + C.ph);
   if (TW.k === C.k && TW.e > 0) { const e = TW.e; lift += .3 * e; curl -= .9 * e; tip -= .8 * e; yaw += .16 * Math.sin(tt * 1.8 + C.ph) * e; }
   // the creep: alternate legs lift and swing forward, the others plant and pull
   if (walkS > 1e-3 && !C.great) { const p = phase + (C.k % 2) * PI, swg = Math.max(0, Math.sin(p)); lift += .3 * swg * walkS; curl -= .45 * swg * walkS; yaw += -Math.sin(C.a) * .2 * Math.cos(p) * walkS; }
   const bj = curl / (NS - 1), twn = g === 'L' || g === 'M' ? P.tn * C.sgn : 0;
   for (let i = 1; i < NS; i++) { C.bend[i] = bj + C.jb[i] + tip * TIPW[i] + w * .045 * Math.sin(tt * 1.1 + i * .85 + C.ph); C.yawW[i] = C.jy[i] + w * .04 * Math.sin(tt * .8 + i * .7 + C.ph * 1.3) + twn * .2 * Math.sin(i * 1.9); }
   let th0 = lift - C.bend[1] * .5 + w * .025 * Math.sin(tt * .5 + C.ph);
   if (k > 1e-3) {
    const H = HOLD[g]; C.chain[0].getWorldPosition(_b);
    _c.copy(_tg).addScaledVector(_sd, H[0] * C.sgn).add(_d.set(0, H[1], 0));
    _c.sub(_b).multiplyScalar(P.ikd).add(_b); _c.y += P.ikh; _c.lerp(_cf, P.pull);
    solveReach(C, _c);
    const jr = Math.round(IK.s / C.seg);
    yaw = lerpA(yaw, IK.yaw, k); th0 = lerp(th0, IK.phi - IK.kap * C.seg * .5, k);
    // past the reach point the tip coils round the prey: mostly sideways, round its body, a little downward
    const cw = Math.min(1.3, P.wrap / Math.max(1, NS - jr));
    for (let i = 1; i < NS; i++) { C.bend[i] = lerp(C.bend[i], i < jr ? IK.kap * C.seg : cw * .4, k); C.yawW[i] = lerp(C.yawW[i], i < jr ? C.yawW[i] * .15 : -C.sgn * cw * .95, k); }
   }
   const SPc = C.sp || (C.sp = { b: Float32Array.from(C.bend), bv: new Float32Array(NS + 1), y: Float32Array.from(C.yawW), yv: new Float32Array(NS + 1) });
   // a cane reaching for its prey stiffens, so it lands on the beat of its hit and still whips a little past it
   const sk = (1 + 3 * k) * (C.great ? .5 + .6 * k : .8), sd = Math.sqrt(sk);
   for (let n = 0; n < nSteps; n++) for (let i = 1; i < NS; i++) {
    SPc.bv[i] += (SPK[i] * sk * (C.bend[i] - SPc.b[i]) - SPD[i] * sd * SPc.bv[i]) * PH; SPc.b[i] += SPc.bv[i] * PH;
    SPc.yv[i] += (SPK[i] * sk * (C.yawW[i] - SPc.y[i]) - SPD[i] * sd * SPc.yv[i]) * PH; SPc.y[i] += SPc.yv[i] * PH;
   }
   for (let i = 1; i < NS; i++) { C.bend[i] = SPc.b[i]; C.yawW[i] = SPc.y[i]; }
   // keep it out of the ground: a joint that would sink is laid along the soil instead (not while it is still under it)
   C.pb.getWorldQuaternion(_q); _up.set(0, 1, 0).applyQuaternion(_q.invert());
   // (the height a joint gains is rho * sin(theta + dl): the parent's tilt, however large, along the cane's own plane)
   C.chain[0].getWorldPosition(_b); const hx = Math.sin(yaw) * _up.x + Math.cos(yaw) * _up.z, rho = Math.max(.05, Math.hypot(hx, _up.y)), dl = Math.atan2(hx, _up.y), by = (_b.y - root.position.y) / SZ, gnd = P.y > -.3;
   let th = th0, y = 0;
   for (let i = 0; i < NS; i++) {
    if (i > 0) th -= C.bend[i];
    const fl = C.rad(Math.min(C.len, (i + 1) * C.seg)) + .02 - by;
    let thW = th + dl, ny = y + C.seg * rho * Math.sin(thW);
    if (gnd && ny < fl) { const a = Math.asin(cl((fl - y) / (C.seg * rho), -1, 1)); thW = thW < -PI / 2 ? -PI - a : a; th = thW - dl; ny = y + C.seg * rho * Math.sin(thW); }
    C.theta[i] = th; y = ny;
   }
   C.chain[0].rotation.set(-C.theta[0], yaw, 0);
   const cj = P.coil * C.cm / (NS - 1);
   for (let i = 1; i < NS && i < nJ; i++) { C.chain[i].rotation.x = C.theta[i - 1] - C.theta[i]; C.chain[i].rotation.y = C.yawW[i] + cj; }
   if (nJ > NS) C.chain[NS].rotation.x = tip * .12;
   C.swing = walkS > 1e-3 && !C.great ? Math.sin(phase + (C.k % 2) * PI) : -1;
  }
  // ---------- Thornwood's shoots: planted round the prey's feet, up out of the soil, closing, squeezing, gone ----------
  const ug = name === 'briar' && P.fade > .02;
  if (ug) base.worldToLocal(_d.set(_tg.x, root.position.y, _tg.z));
  for (const S of SNARE) {
   const b0 = S.chain[0], e0 = .44 + S.t0, x = ug ? cl((u - e0) / .07, 0, 1) : 0;
   const gIn = x <= 0 ? 0 : 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2), gOut = ug ? 1 - sm(.85 + S.t0 * .6, .94 + S.t0 * .6, u) : 0;
   S.g = gIn * gOut;
   if (S.g <= 1e-3) { b0.position.set(0, -1, 0); b0.scale.setScalar(1e-4); continue; }
   const px = _d.x + Math.cos(S.a) * S.R / SZ, pz = _d.z + Math.sin(S.a) * S.R / SZ, close = sm(e0 + .03, .6, u), sq = win(u, .62, .71, .025);
   b0.position.set(px, _d.y, pz); b0.scale.setScalar(S.g);
   b0.rotation.set(-(PI / 2 + S.lean - close * (S.lean + .22) - .12 * sq), Math.atan2(_d.x - px, _d.z - pz), 0);
   for (let i = 1; i <= UN; i++) { const c = S.chain[i]; c.rotation.x = close * S.curl * (1 + .45 * sq) + .05 * Math.sin(tt * 2.6 + S.ph + i * 1.3) * close; c.rotation.y = .08 * Math.sin(tt * 2 + S.ph * 1.7 + i) * close; }
  }
  root.updateMatrixWorld(true);
  // ---------- fruit on pendulums ----------
  const damp = Math.exp(-1.8 * PH), floorY = P.y > -.3 ? root.position.y + .05 * SZ : -1e4, dying = name === 'die' ? u : 0;
  for (const Bq of BERRIES) {
   const b = Bq.bone, L = Bq.len * SZ, dk = dying > 0 ? Math.pow(sm(.3 + Bq.dd, .46 + Bq.dd, dying), 2) : 0;
   if (dk > 0 || Bq.dk > 0) { // on defeat the fruit lets go and drops to the soil; it hangs again when it grows back
    b.position.copy(b.userData.bind.p); _a.copy(b.position).applyMatrix4(b.parent.matrixWorld);
    if (dk > 0) { _a.y = lerp(_a.y, Math.min(_a.y, floorY + L * .4), dk); b.position.copy(b.parent.worldToLocal(_c.copy(_a))); }
    Bq.dk = dk;
   } else _a.copy(b.position).applyMatrix4(b.parent.matrixWorld);
   if (!Bq.init || Bq.X.distanceTo(_a) > L * 4) { Bq.X.copy(_a); Bq.X.y -= L; Bq.Xp.copy(Bq.X); Bq.init = true; }
   for (let n = 0; n < nSteps; n++) {
    _b.subVectors(Bq.X, Bq.Xp).multiplyScalar(damp); Bq.Xp.copy(Bq.X); Bq.X.add(_b); Bq.X.y -= 9.8 * PH * PH;
    Bq.X.x += Math.sin(tt * 1.3 + Bq.sway) * 1.5e-6 * P.rust; Bq.X.z += Math.cos(tt * 1.1 + Bq.sway) * 1.5e-6 * P.rust;
    _c.subVectors(Bq.X, _a); const l = _c.length() || 1e-6; Bq.X.copy(_a).addScaledVector(_c, L / l);
    if (Bq.X.y < floorY) Bq.X.y = floorY;
   }
   _c.subVectors(Bq.X, _a).normalize(); b.parent.getWorldQuaternion(_q); _c.applyQuaternion(_q.invert());
   b.quaternion.setFromUnitVectors(Bq.hang, _c);
   b.updateMatrixWorld(true);
  }
  // ---------- severed pieces fall, settle and burn away ----------
  for (const C of CANES) if (C.piece) {
   const pc = C.piece, b = pc.b; pc.t += dt;
   if (!pc.rest) {
    pc.vel.y -= 9.8 / SZ * dt; b.position.addScaledVector(pc.vel, dt);
    if (b.position.y < .08) { b.position.y = .08; if (pc.vel.y < -.8) { puff(b.getWorldPosition(_a), 8, 1); } pc.vel.y = pc.vel.y < -.8 ? -pc.vel.y * .22 : 0; pc.vel.x *= .5; pc.vel.z *= .5; if (pc.vel.lengthSq() < .02) pc.rest = true; }
   }
   _a.set(0, 0, 1).applyQuaternion(b.quaternion); _b.set(_a.x, 0, _a.z); if (_b.lengthSq() < 1e-4) _b.set(1, 0, 0); _b.normalize();
   _q.setFromUnitVectors(_a, _b).multiply(b.quaternion); b.quaternion.slerp(_q, 1 - Math.exp(-dt * (b.position.y <= .081 ? 5 : 1.6)));
   for (let i = pc.j + 1; i <= NS; i++) { const c = C.chain[i]; c.rotation.x *= Math.exp(-dt * 3); c.rotation.y *= Math.exp(-dt * 3); }
   U.cut.value[C.k].z = sm(1.5, 2.8, pc.t); U.cut.value[C.k].w = Math.max(0, 1 - pc.t * 1.3);
   b.updateMatrixWorld(true);
  }
  // ---------- looks ----------
  const fk = cl(P.fade, 0, 1) * fadeE;
  U.time.value = tt; U.flut.value = P.rust * (1 + .6 * walkS);
  U.ctr.value.copy(root.position); U.warm.value.z = SZ; if (state.frost !== undefined) U.frost.value = cl(+state.frost || 0, 0, 1);
  if (dt > 0) XRAY.value += (cl(+state.xray || 0, 0, 1) - XRAY.value) * (1 - Math.exp(-dt * 4)); xroots.visible = XRAY.value > .01;
  U.dis.value = 1 - fk; U.disCol.value.copy(name === 'appear' ? GROWC : BURNC); U.with.value = cl(Math.max(P.wither, state.wilt * .3), 0, 1); U.thin.value = cl(+state.wilt || 0, 0, 1) * .45;
  U.clip.value = name === 'appear' && u < .7 ? root.position.y + .004 : -1e4;
  M.soil.opacity = fk;
  M.berry.emissive.copy(BERRYGLOW).multiplyScalar(cl(P.glow, 0, 2) * .32 * fk * (state.glow === undefined ? 1 : +state.glow));
  // the veins: a glow while it feeds, the glow at rest (stronger at the higher levels and in its wrath), and each pulse
  // running out from the heart, down the spire and into the roots and the canes
  if (dt > 0) VW.t += dt;
  U.vein.value.set(cl(P.feed, 0, 1.5) * fk, VW.t / .9 * 1.8 - .1, VW.s * (1 - sm(.8, 1.1, VW.t)) * fk, lerp(VEIN, 1.3, wrathV) * fk * (1 - P.wither));
  U.veinC.value.copy(VEINC).lerp(WRATHC, wrathV); U.wrath.value = wrathV;
  U.heartC.value.copy(HEARTC).lerp(WRATHC, wrathV * .45); U.hb.value = cl(P.hb, 0, 2.5) * (1 + .7 * beat) * (1 + .35 * wrathV) * fk * (1 - P.wither * .9);
  // fire: flames while it burns, and the char they leave, which fades over the next few seconds
  if (dt > 0) charV = P.fire > .05 ? Math.min(.34, charV + dt * P.fire * .7) : Math.max(0, charV - dt * .06);
  U.char.value = charV * fk; U.burn.value = cl(P.fire, 0, 1) * fk;
  liftV = Math.max(0, P.y * SZ);
  updateFX(name, u, t, dt, fk, phase);
  lastName = name; lastU = u; lastPhase = phase; lastN = curN;
 }


