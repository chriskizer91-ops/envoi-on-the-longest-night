 // ---------- skeleton ----------
 // ground (stays put), crown (the whole body: rise, lean, twist), mass (the mound: pulse and squash), SPN + 1 bones up the
 // spire, and the bud on top with its heart, its stamens and a chain for each sepal and petal. Each cane is a chain of
 // NS + 1 bones running straight out along its azimuth in the bind pose: the arms and the mane grow from the spire, the
 // legs from the mound. Berry bunches hang from pendulum bones.
 const bones = [], BI = {};
 function bone(name, parent, x, y, z, order) { const b = new THREE.Bone(); b.name = name; b.position.set(x, y, z); if (order) b.rotation.order = order; parent.add(b); BI[name] = bones.length; bones.push(b); return b; }
 const ground = bone('ground', base, 0, 0, 0), crown = bone('crown', ground, 0, 0, 0, 'YXZ'), mass = bone('mass', crown, 0, 0, 0);
 const SP = []; for (let i = 0; i <= SPN; i++) SP.push(bone('sp' + i, i ? SP[i - 1] : crown, 0, i ? SPS : SPH, 0, 'YXZ'));
 const bud = bone('bud', SP[SPN], 0, .1, 0, 'YXZ'), heart = bone('heart', bud, 0, .12, 0), stam = bone('stam', bud, 0, 0, 0);
 // sepals and petals: chains standing straight up in the bind pose; animate() folds them into a bud or opens them out
 const SEL = 2.5, PEL = 1.85, SEP = [], PET = [];
 function flap(nm, a, r, y, n, len) {
  const b0 = bone(nm + '_0', bud, Math.sin(a) * r, y, Math.cos(a) * r, 'YXZ'); b0.rotation.set(-PI / 2, a, 0);
  const ch = [b0]; for (let i = 1; i <= n; i++) ch.push(bone(nm + '_' + i, ch[i - 1], 0, 0, len / n));
  return { ch, a, r, y, n, len, seg: len / n, ph: rnd() * TAU };
 }
 for (let i = 0; i < 5; i++) { SEP.push(flap('se' + i, (i + .5) / 5 * TAU, .5, 0, 3, SEL)); PET.push(flap('pe' + i, i / 5 * TAU, .36, .06, 2, PEL)); }
 // the canes: g its group (L the lead arm, on its right; M the other arm; H the mane; F, S and B the legs at the front,
 // the sides and the back), a its azimuth, j the spire bone it grows from (-1: the mound), its length, base and tip radius
 const CSPEC = [['L', -.55, 4, 9, .27, .05], ['M', .55, 4, 8.6, .26, .05], ['H', -2.45, 3, 7.4, .23, .045], ['H', 2.45, 3, 7.4, .23, .045]];
 for (let k = 0; k < 6; k++) { const a = -PI + (k + .5) * TAU / 6 + (rnd() - .5) * .14; CSPEC.push([Math.abs(a) < 1.05 ? 'F' : Math.abs(a) < 2.1 ? 'S' : 'B', a, -1, rr(6, 6.6), .18, .032]); }
 const CANES = [];
 for (const [g, a, j, len, rB, rT] of CSPEC) {
  const k = CANES.length, great = j >= 0, rb = great ? .44 : CR * .5, hb = great ? 0 : CH * .5, pb = great ? SP[j] : crown;
  const b0 = bone('cb' + k, pb, Math.sin(a) * rb, hb, Math.cos(a) * rb, 'YXZ'); b0.rotation.y = a;
  const chain = [b0]; for (let i = 1; i <= NS; i++) chain.push(bone('c' + k + '_' + i, chain[i - 1], 0, 0, len / NS));
  CANES.push({ k, g, a, len, seg: len / NS, rB, rT, great, pb, B: V3(Math.sin(a) * rb, great ? SPH + j * SPS : hb, Math.cos(a) * rb), chain, ph: rnd() * TAU, sgn: a < 0 ? -1 : 1,
   dl: (rnd() - .5) * .12, dc: (rnd() - .5) * .25, cutJ: -1, piece: null, cm: .55 + .8 * rnd(), jb: Array.from({ length: NS + 1 }, () => (rnd() - .5) * .12), jy: Array.from({ length: NS + 1 }, () => (rnd() - .5) * .09),
   theta: new Float32Array(NS + 1), bend: new Float32Array(NS + 1), yawW: new Float32Array(NS + 1) });
 }
 const NC = CANES.length, LEAD = CANES[0], MATE = CANES[1];
 root.updateMatrixWorld(true);

