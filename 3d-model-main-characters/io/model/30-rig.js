
 // ---------- skeleton: the game model's 51 bones, where they were ----------
 const root = new THREE.Group(); root.name = 'Io';
 const bones = [], BI = {};
 function bone(name, parent, x, y, z) {
  const b = new THREE.Bone(); b.name = name; b.position.set(x, y, z); parent.add(b);
  BI[name] = bones.length; bones.push(b); return b;
 }
 const pelvis = bone('pelvis', root, 0, 0.86, 0);
 const spine = bone('spine', pelvis, 0, 0.12, 0);
 const chest = bone('chest', spine, 0, 0.14, 0);
 const neck = bone('neck', chest, 0, 0.16, 0); neck.rotation.order = 'YXZ';
 const headB = bone('head', neck, 0, 0.10, 0); headB.rotation.order = 'YXZ';
 const legs = [], knees = [], ankles = [], arms = [], elbows = [], wrists = [];
 for (const sd of [-1, 1]) {
  const h = bone('hip' + sd, pelvis, 0.075 * sd, -0.07, 0), k = bone('knee' + sd, h, 0, -0.36, 0), a = bone('ankle' + sd, k, 0, -0.34, 0);
  legs.push(h); knees.push(k); ankles.push(a);
  const s = bone('shoulder' + sd, chest, 0.155 * sd, 0.075, 0), e = bone('elbow' + sd, s, 0, -0.235, 0), w = bone('wrist' + sd, e, 0, -0.215, 0);
  arms.push(s); elbows.push(e); wrists.push(w);
 }
 const SK = 8, skirt = [];
 for (let k = 0; k < SK; k++) {
  const a = k / SK * TAU, b = bone('skirt' + k, pelvis, 0.12 * Math.sin(a), 0.02, 0.12 * Math.cos(a) * 0.9);
  b.rotation.order = 'YXZ'; b.rotation.y = a; skirt.push(b);
 }
 const CK = 8, coatU = [], coatL = [];
 for (let k = 0; k < CK; k++) {
  const a = (k + 0.5) / CK * TAU, u = bone('coatU' + k, pelvis, 0.2 * Math.sin(a), 0.06, 0.2 * Math.cos(a) * 0.88);
  u.rotation.order = 'YXZ'; u.rotation.y = a;
  const l = bone('coatL' + k, u, 0, -0.3, 0.035); l.rotation.order = 'YXZ';
  coatU.push(u); coatL.push(l);
 }
 const hairA = bone('hairA', headB, 0, -0.085, -0.14), hairB = bone('hairB', hairA, 0, -0.17, -0.03), hairC = bone('hairC', hairB, 0, -0.17, -0.005);
 const sideL1 = bone('sideL1', headB, 0.125, -0.02, 0.05), sideL2 = bone('sideL2', sideL1, 0.005, -0.1, 0.005);
 const sideR1 = bone('sideR1', headB, -0.125, -0.02, 0.05), sideR2 = bone('sideR2', sideR1, -0.005, -0.1, 0.005);
 const hatB = bone('hat', headB, 0.0, 0.1, -0.012); hatB.rotation.set(-0.2, 0, 0.07);
 const hatA1 = bone('hatA', hatB, 0, 0.25, -0.02), hatA2 = bone('hatB', hatA1, -0.035, 0.1, -0.035);
 root.updateMatrixWorld(true);
 const bw = (b) => { const v = new THREE.Vector3(); b.getWorldPosition(v); return [v.x, v.y, v.z]; };

 // ---------- skin weights: the game model's, by where a point is in the bind pose ----------
 const ring = (x, z, zs, n, off) => ((((Math.atan2(x, z / zs) / TAU) * n - (off || 0)) % n) + n) % n;
 function wTorso(x, y) {
  if (y >= 1.1) { const t = sm(1.1, 1.16, y); return [[BI.spine, 1 - t], [BI.chest, t]]; }
  if (y >= 0.95) { const t = sm(0.95, 1.1, y); return [[BI.pelvis, 1 - t], [BI.spine, t]]; }
  return [[BI.pelvis, 1]];
 }
 function wSkirt(x, y, z) {
  if (y >= 0.9) return wTorso(x, y, z);
  const s = sm(0.9, 0.6, y);
  const f = ring(x, z, 0.9, SK), k0 = Math.floor(f) % SK, fr = f - Math.floor(f);
  return [[BI.pelvis, 1 - s], [BI['skirt' + k0], s * (1 - fr)], [BI['skirt' + ((k0 + 1) % SK)], s * fr]];
 }
 function wCoat(x, y, z) {
  if (y >= 1.0) { const t = sm(1.0, 1.12, y); return [[BI.spine, 1 - t], [BI.chest, t]]; }
  if (y >= 0.93) { const t = sm(0.93, 1.0, y); return [[BI.pelvis, 1 - t], [BI.spine, t]]; }
  const s1 = sm(0.93, 0.74, y), s2 = sm(0.68, 0.42, y);
  const f = ring(x, z, 0.88, CK, 0.5), k0 = Math.floor(f) % CK, k1 = (k0 + 1) % CK, fr = f - Math.floor(f);
  return [[BI.pelvis, 1 - s1], [BI['coatU' + k0], s1 * (1 - s2) * (1 - fr)], [BI['coatU' + k1], s1 * (1 - s2) * fr], [BI['coatL' + k0], s1 * s2 * (1 - fr)], [BI['coatL' + k1], s1 * s2 * fr]];
 }
 function wLeg(x, y) {
  const sd = x < 0 ? -1 : 1, H = BI['hip' + sd], K = BI['knee' + sd];
  if (y >= 0.48) return [[H, 1]];
  const t = sm(0.48, 0.4, y); return [[H, 1 - t], [K, t]];
 }
 function wArm(x, y) {
  const sd = x < 0 ? -1 : 1, S = BI['shoulder' + sd], E = BI['elbow' + sd];
  if (y > 1.16) { const c = sm(1.16, 1.25, y) * 0.55; return [[S, 1 - c], [BI.chest, c]]; }
  if (y > 1.0) return [[S, 1]];
  if (y > 0.93) { const t = sm(1.0, 0.93, y); return [[S, 1 - t], [E, t]]; }
  return [[E, 1]];
 }
 function wHair(x, y, z) {
  if (z < -0.06 || Math.abs(x) < 0.1) {
   if (y > 1.33) return [[BI.head, 1]];
   if (y > 1.22) { const t = sm(1.33, 1.22, y); return [[BI.head, 1 - t], [BI.hairA, t]]; }
   if (y > 1.08) { const t = sm(1.2, 1.08, y); return [[BI.hairA, 1 - t], [BI.hairB, t]]; }
   const t = sm(1.02, 0.9, y); return [[BI.hairB, 1 - t], [BI.hairC, t]];
  }
  const L = x > 0, S1 = BI[L ? 'sideL1' : 'sideR1'], S2 = BI[L ? 'sideL2' : 'sideR2'];
  if (y > 1.36) return [[BI.head, 1]];
  if (y > 1.3) { const t = sm(1.36, 1.3, y); return [[BI.head, 1 - t], [S1, t]]; }
  const t = sm(1.26, 1.16, y); return [[S1, 1 - t], [S2, t]];
 }
