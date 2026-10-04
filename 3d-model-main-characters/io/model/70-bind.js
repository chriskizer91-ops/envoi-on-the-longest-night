
 // ---------- bind: one skinned mesh per pooled material ----------
 root.updateMatrixWorld(true);
 const _pm = new THREE.Matrix4(), _po = new THREE.Matrix4(), skinned = [];
 for (const [mat, list] of POOL) {
  const geos = list.map(({ geo, rigid }) => {
   if (rigid) {
    // a rigid piece goes into bind space and follows its bone at full weight, exactly as when it was parented to it
    _pm.copy(rigid.parent.matrixWorld);
    if (rigid.off) _pm.multiply(_po.makeTranslation(-rigid.off[0], -rigid.off[1], -rigid.off[2]));
    xform(geo, _pm);
    const n = geo.attributes.position.count, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4), b = bones.indexOf(rigid.bone);
    for (let i = 0; i < n; i++) { si[i * 4] = b; sw[i * 4] = 1; }
    geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
    geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
   }
   return geo;
  });
  const g = geos.length > 1 ? merge(geos) : geos[0];
  if (mat !== M.hair && g.attributes.aHT) g.deleteAttribute('aHT');
  if (!mat.vertexColors && g.attributes.color) g.deleteAttribute('color');
  const m = new THREE.SkinnedMesh(g, mat);
  m.frustumCulled = false; root.add(m); skinned.push(m);
 }
 const skeleton = new THREE.Skeleton(bones);
 for (const m of skinned) m.bind(skeleton);
 if (opts.shadows) root.traverse((o) => { if (o.isMesh && !o.material.transparent) { o.castShadow = o.isSkinnedMesh; o.receiveShadow = true; } });
