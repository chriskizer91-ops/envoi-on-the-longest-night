// From chriskizer91-ops/moon-faire (read-only), branch claude/moon-faire-base-doll-light (commit ed42d9d),
// base-doll-light/moon_faire_base_doll_light.html, the script block "The light models" (DOLLLIGHT_USE, DOLLLIGHT_PREP, DOLLLIGHT_DROP), taken out unchanged.
// The light models: one outfit's ~50,000-triangle version of her (body, clothes and bun as one mesh with its look baked into three
// pictures, and her face as its own small mesh that keeps her live face: blinks, talk, feelings). Both hang on her own skeleton, so
// every move, the skirt's swing and the outfit's own hooks (heels) work as they do on the full model. See-through pieces (wings)
// are not baked: the light model keeps the outfit's own (D.keep).
//   DOLLLIGHT_USE(api, code, on): api is the doll (makeIo's result) wearing that outfit; on = true shows the light model in place of the
//   full one, false brings the full one back. The light model's file (wardrobe_light/<code>_light.js) must be loaded first.
(function () {
  const de = (s, T) => { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return new T(u.buffer); };
  const made = {};
  function build(api, code) {
    const D = window.DOLLLIGHT && window.DOLLLIGHT[code]; if (!D) throw new Error('no light model loaded for ' + code);
    const THREE = window.THREE, waits = [], tex = (url, srgb) => { const im = new Image(); const t = new THREE.Texture(im);
      waits.push(new Promise((ok) => { im.onload = () => { t.needsUpdate = true; ok(); }; im.onerror = ok; })); im.src = url;
      if (srgb) t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; t.flipY = true; return t; };
    const geo = (G, extra) => { const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(de(G.pos, Float32Array), 3));
      g.setAttribute('normal', G.nor16 ? new THREE.BufferAttribute(de(G.nor16, Int16Array), 3, true) : new THREE.Float32BufferAttribute(de(G.nor, Float32Array), 3));
      g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(de(G.si, Uint16Array), 4));
      g.setAttribute('skinWeight', G.sw8 ? new THREE.BufferAttribute(de(G.sw8, Uint8Array), 4, true) : new THREE.Float32BufferAttribute(de(G.sw, Float32Array), 4));
      if (G.uv16) g.setAttribute('uv', new THREE.BufferAttribute(de(G.uv16, Uint16Array), 2, true)); else if (G.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(de(G.uv, Float32Array), 2));
      for (const [k, n] of extra || []) if (G[k]) g.setAttribute(k, new THREE.Float32BufferAttribute(de(G[k], Float32Array), n));
      g.setIndex(new THREE.Uint32BufferAttribute(de(G.idx, Uint32Array), 1)); return g; };
    const orm = tex(D.maps.orm, false);
    const mat = new THREE.MeshStandardMaterial({ skinning: true, map: tex(D.maps.albedo, true), emissive: new THREE.Color(1, 1, 1), emissiveMap: tex(D.maps.emissive, true),
      roughnessMap: orm, metalnessMap: orm, roughness: 1, metalness: 1, envMapIntensity: 0.3, side: THREE.DoubleSide });
    // the rim her skin and her velvets catch where they turn away from the eye (baked as a colour: what the full model's sheen adds there)
    if (D.maps.rim) { const rim = tex(D.maps.rim, false); mat.onBeforeCompile = (sh) => { sh.uniforms.uRimMap = { value: rim };
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D uRimMap;')
        .replace('#include <tonemapping_fragment>', 'vec3 lRim = texture2D(uRimMap, vUv).rgb / 3.0; float lNV = saturate(abs(dot(normalize(vViewPosition), normal)));\n gl_FragColor.rgb += lRim * pow(1.0 - lNV, 3.0) * (0.35 + 0.65 * saturate(normal.y * 0.5 + 0.5));\n#include <tonemapping_fragment>'); };
      mat.customProgramCacheKey = () => 'dollLight'; }
    const body = new THREE.SkinnedMesh(geo(D.body), mat); body.name = 'light_' + code;
    const out = [body];
    if (D.face && D.face.idx && api.meshes.face) {
      const face = new THREE.SkinnedMesh(geo(D.face, [['faceMix', 4], ['uvSide', 2], ['uvBody', 4]]), api.meshes.face.material); face.name = 'light_' + code + '_face'; out.push(face);
    }
    for (const m of out) { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; m.visible = false; api.root.add(m); m.bind(api.skeleton, new THREE.Matrix4()); }
    return { meshes: out, tris: D.tris, keep: new Set(D.keep || []), hidden: [], ready: Promise.all(waits) };
  }
  window.DOLLLIGHT_USE = function (api, code, on) {
    const k = code; if (!made[k] && on) made[k] = build(api, code); const L = made[k]; if (!L) return null;
    if (on) {
      L.hidden = []; api.root.traverse((o) => { if (o.isMesh && o.visible && L.meshes.indexOf(o) < 0 && o.parent === api.root && !L.keep.has(o.name)) { L.hidden.push(o); o.visible = false; } });
      for (const m of L.meshes) m.visible = true;
    } else { for (const m of L.meshes) m.visible = false; for (const o of L.hidden) o.visible = true; L.hidden = []; }
    return { tris: L.tris };
  };
  // made ahead (not shown yet): resolves once its pictures are decoded, so it never shows unpainted for a frame
  window.DOLLLIGHT_PREP = function (api, code) { if (!made[code]) made[code] = build(api, code); return made[code].ready; };
  window.DOLLLIGHT_DROP = function (api, code) { const L = made[code]; if (!L) return; window.DOLLLIGHT_USE(api, code, false);
    for (const m of L.meshes) { api.root.remove(m); m.geometry.dispose(); if (!/_face$/.test(m.name)) { const t = m.material; ['map', 'emissiveMap', 'roughnessMap'].forEach((x) => t[x] && t[x].dispose()); t.dispose(); } } delete made[code]; };
})();
