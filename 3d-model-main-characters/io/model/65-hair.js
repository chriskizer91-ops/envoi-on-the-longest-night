
 // ---------- hair: the game model's every lock, where it was, each now a dark core filled out with fine strands ----------
 // Scalp, bangs and crown ride on her head; the side locks and the long wavy ponytail are skinned to their own bones and
 // swing with the game model's springs. The random stream starts where the game model's did, so each lock has the same
 // place, wave and shade (the darker or the lighter of her two browns) as there.
 hs = SEED.hair;
 const strand0 = strandId;
 const HAIR1 = C('#56383a'), HAIR2 = C('#7a5a55'), CORE = .62;
 const lockMat = () => (hr() < 0.62 ? HAIR1 : HAIR2);
 const coreCol = (g, c) => vcol(g, (x, y, z, o) => { o[0] = c.r * CORE; o[1] = c.g * CORE; o[2] = c.b * CORE; });
 const HQ = { K: (n) => Q(n * 2, 4), N: (n) => Q(Math.round(n * .7), 8), RS: 3 };
 const Hc = part();
 const capG = new THREE.SphereGeometry(1, Q(96, 24), Q(48, 12), 0, TAU, 0, Math.PI * 0.56); capG.rotateX(-0.45);
 M.cap = patch(std({ color: C('#4c3134'), roughness: .72, side: THREE.DoubleSide }), { glow: 1 }); M.cap.name = 'cap';
 Hc.add(capG, M.cap, [0, 0.003, -0.004], null, [HR * HS[0] * 1.05, HR * HS[1] * 1.05, HR * HS[2] * 1.06]);
 function wavy(pts, amp, freq, ph, cen, n) {
  const cv = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
  const out = [], T = new THREE.Vector3(), O = new THREE.Vector3(), S = new THREE.Vector3(), P = new THREE.Vector3();
  for (let i = 0; i <= n; i++) {
   const u = i / n; cv.getPointAt(u, P); cv.getTangentAt(u, T);
   O.subVectors(P, cen(P)); O.addScaledVector(T, -O.dot(T)).normalize(); S.crossVectors(T, O).normalize();
   const w = amp * u * Math.sin(freq * u + ph), w2 = amp * 0.6 * u * Math.sin(freq * u + ph + 1.4);
   out.push([P.x + S.x * w + O.x * w2, P.y + S.y * w + O.y * w2, P.z + S.z * w + O.z * w2]);
  }
  return out;
 }
 // one lock: its core (the game model's lock, darker, so gaps between strands look deep) and its strands
 function lock(P, pts, TSg, RSg, rFn, flat, cen, col, K, N, o) {
  P.addWorld(coreCol(strand(pts, TSg, RSg, (t) => rFn(t) * .92, flat, cen), col), M.hair);
  P.addWorld(lockStrands(pts, K, N, HQ.RS, rFn, flat, cen, col, o), M.hair);
 }
 const PART = 0.18;
 for (let i = 0; i < 12; i++) {
  const az = -0.88 + i * (1.76 / 11) + (hr() - 0.5) * 0.05, side = az > PART ? 1 : -1;
  const endEl = 0.12 + hr() * 0.13 - (Math.abs(az) > 0.62 ? 0.32 : 0);
  const p0 = headPt(PART + (az - PART) * 0.3, 1.2, 0.97), p1 = headPt(az + side * 0.08, 0.62, 1.13), p2 = headPt(az + side * 0.17, endEl, 1.11);
  const pts = wavy([p0, p1, p2], 0.009, 7, hr() * 6, () => headC, 10), col = lockMat();
  lock(Hc, pts, Q(44, 11), Q(10, 5), (t) => 0.021 * Math.pow(1 - t, 0.7) + 0.0015, 0.5, () => headC, col, HQ.K(26), HQ.N(26), { jitter: .3 });
 }
 const tie = [0, -0.085, -0.14];
 for (let i = 0; i < 13; i++) {
  const az = Math.PI / 2 + 0.15 + i * ((Math.PI - 0.3) / 12);
  const p0 = headPt(az, 1.32, 0.97), p1 = headPt(az, 0.55, 1.13), p2 = [tie[0] + Math.sin(az) * 0.025, tie[1] + 0.02, tie[2] + 0.012];
  lock(Hc, [p0, p1, p2], Q(40, 10), Q(10, 5), (t) => 0.032 * (1 - 0.5 * t), 0.42, () => headC, lockMat(), HQ.K(30), HQ.N(22), { jitter: .2, short: .05 });
 }
 // a few stray hairs lifting off the crown
 for (let k = 0; k < Q(24, 4); k++) {
  const az = rr(-2.6, 2.6), p0 = headPt(az, rr(.6, 1.2), 1.1), p1 = headPt(az + rr(-.2, .2), rr(.2, .7), 1.2 + rr(0, .05)), p2 = headPt(az + rr(-.3, .3), rr(-.2, .4), 1.18 + rr(0, .08));
  Hc.addWorld(lockStrands([p0, p1, p2], 1, Q(12, 6), 3, () => 0, 1, null, r2() < .6 ? HAIR1 : HAIR2, { thick: .0005, jitter: 0, short: .001 }), M.hair);
 }
 Hc.build(head);
 const hb = bw(headB), Wd = (p) => [p[0] + hb[0], p[1] + hb[1], p[2] + hb[2]];
 const Hs = part(wHair);
 const sideCen = new THREE.Vector3(hb[0], hb[1] - 0.05, hb[2]);
 for (const sd of [-1, 1]) {
  for (let k = 0; k < 5; k++) {
   const az = sd * (0.72 + k * 0.16);
   const p0 = headPt(az, 0.72, 0.99), p1 = headPt(az, 0.15, 1.2), p2 = headPt(az - sd * 0.02, -0.45, 1.3 + k * 0.02);
   const p3 = [p2[0] + sd * (0.02 + k * 0.006), p2[1] - 0.1 - hr() * 0.04, p2[2] - 0.02 - k * 0.008];
   const pts = wavy([p0, p1, p2, p3].map(Wd), 0.016, 9, hr() * 6, () => sideCen, 12), col = lockMat();
   lock(Hs, pts, Q(60, 14), Q(10, 5), (t) => 0.024 * Math.pow(1 - t, 0.55) + 0.002, 0.5, () => sideCen, col, HQ.K(28), HQ.N(34), { jitter: .35 });
  }
 }
 for (let i = 0; i < 28; i++) {
  const fx = i / 27 - 0.5, len = 0.44 + hr() * 0.1, ph = hr() * TAU, pts = [];
  for (let k = 0; k <= 8; k++) {
   const s = k / 8;
   const x = fx * 0.04 + fx * 0.27 * Math.sin(s * 1.5) + 0.03 * Math.sin(s * 10 + ph) * s;
   const y = -0.085 - s * len;
   const z = -0.15 - 0.045 * Math.sin(s * 2.4) - 0.07 * s * s + 0.012 * Math.cos(s * 9 + ph) * s - Math.abs(fx) * 0.03 * s;
   pts.push(Wd([x, y, z]));
  }
  const r0 = 0.02 + 0.006 * Math.cos(i);
  lock(Hs, pts, Q(60, 14), Q(10, 5), (t) => r0 * Math.pow(1 - t, 0.55) + 0.0025, 0.45, (cc) => new THREE.Vector3(0, cc.y, 0.03), lockMat(), HQ.K(20), HQ.N(40), { jitter: .4, short: .3 });
 }
 // strays in the ponytail, wandering wider than the locks
 for (let k = 0; k < Q(40, 6); k++) {
  const fx = rr(-.75, .75), len = rr(.3, .52), ph = rr(0, TAU), pts = [];
  for (let j = 0; j <= 8; j++) {
   const s = j / 8;
   pts.push(Wd([fx * 0.04 + fx * 0.3 * Math.sin(s * 1.5) + 0.045 * Math.sin(s * 8 + ph) * s, -0.09 - s * len, -0.155 - 0.05 * Math.sin(s * 2.4) - 0.075 * s * s + 0.02 * Math.cos(s * 7 + ph) * s]));
  }
  Hs.addWorld(lockStrands(pts, 1, Q(28, 10), 3, () => 0, 1, null, r2() < .6 ? HAIR1 : HAIR2, { thick: .0006, jitter: 0, short: .2 }), M.hair);
 }
 Hs.build(root);
 const HAIR_STRANDS = strandId - strand0;
 const Sc = part(), scG = new THREE.TorusGeometry(0.028, 0.013, Q(32, 10), Q(96, 22)), scP = scG.attributes.position;
 for (let i = 0; i < scP.count; i++) {
  const x = scP.getX(i), y = scP.getY(i), a = Math.atan2(y, x), k = 1 + 0.12 * Math.sin(a * 11) + .025 * Math.sin(a * 37 + 1);
  const cx = Math.cos(a) * 0.028, cy = Math.sin(a) * 0.028;
  scP.setXYZ(i, cx + (x - cx) * k, cy + (y - cy) * k, scP.getZ(i) * k);
 }
 scG.computeVertexNormals();
 Sc.add(uvs(scG, 2, 1), M.scrunchie, [0, -0.01, -0.012], [Math.PI / 2 + 0.3, 0, 0]);
 Sc.build(hairA);
