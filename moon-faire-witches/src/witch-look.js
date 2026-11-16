// witch-look.js: the Moon Faire witches drawn the way their own pages draw them, inside Envoi's battle, whose renderer stays as
// it is (linear colour, Envoi's lights): each witch material turns its colour to sRGB at its last step, and a soft studio is
// reflected in their shine (Moon Faire's stage, src/stage.js). The arena, the foes and the effects keep Envoi's look.
//   const WL = makeWitchLook(renderer); WL.add(model.root); WL.set(true | false)
function makeWitchLook(renderer) {
  'use strict';
  const es = new THREE.Scene(), g = new THREE.SphereGeometry(10, 32, 16), col = [];
  const top = new THREE.Color(0.26, 0.23, 0.38), mid = new THREE.Color(0.10, 0.08, 0.13), bot = new THREE.Color(0.03, 0.022, 0.035), c = new THREE.Color();
  for (let i = 0; i < g.attributes.position.count; i++) { const y = g.attributes.position.getY(i) / 10; if (y > 0) c.copy(mid).lerp(top, Math.pow(y, 0.7)); else c.copy(mid).lerp(bot, Math.pow(-y, 0.5)); col.push(c.r, c.g, c.b); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  es.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  const panel = (x, y, z, w, h, r, gg, b) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(r, gg, b), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 1, 0); es.add(m); };
  panel(4, 6, 5, 4, 3, 5.0, 4.2, 3.4); panel(-6, 3, 2, 2, 4, 0.8, 0.9, 1.6); panel(-2, 5, -7, 5, 2.5, 2.4, 1.1, 3.6); panel(6, 1.5, -3, 1.5, 3, 1.4, 0.7, 1.2);
  const pm = new THREE.PMREMGenerator(renderer), studio = pm.fromScene(es, 0.03).texture; pm.dispose();
  const ST = { on: true, env: 1.6 }, mats = [];
  function mat(q) {
    if (mats.some((x) => x.q === q)) return;
    const std = 'envMap' in q && (q.isMeshStandardMaterial || q.isMeshPhysicalMaterial);
    mats.push({ q, std, env0: q.envMapIntensity });
    const prev = q.onBeforeCompile, prevKey = q.customProgramCacheKey;
    q.onBeforeCompile = function (sh, r) { if (prev) prev.call(this, sh, r); if (ST.on) sh.fragmentShader = sh.fragmentShader.replace('#include <encodings_fragment>', 'gl_FragColor = LinearTosRGB( gl_FragColor );'); };
    q.customProgramCacheKey = function () { return (prevKey ? prevKey.call(this) : '') + (ST.on ? '|srgb' : '|lin'); };
  }
  function apply() { for (const x of mats) { if (x.std) { x.q.envMap = ST.on ? studio : null; x.q.envMapIntensity = (x.env0 == null ? 1 : x.env0) * ST.env; } x.q.needsUpdate = true; } }
  return {
    add(root) { root.traverse((o) => { if (o.material) for (const q of (Array.isArray(o.material) ? o.material : [o.material])) mat(q); }); apply(); },
    set(on) { ST.on = !!on; apply(); }, get on() { return ST.on; },
  };
}
