// cast.js: the four of the last fight, how each is built at each detail (light, phone, laptop), and what each needs from
// the player: a person's walk, breath and footsteps. Io is the cutscene Io (Chris's request: in cutscenes, her paper
// doll's face); Sol, Halcyon and Noctara are the game's own models, as they are. If high-detail studies of Sol, Halcyon or
// Noctara are made (3d-model-main-characters/<name>/, with the game model's interface), each swaps in on its `study`
// line below.
// Defines cutsceneCast() only. Each entry: { kind: 'person', make(quality, castEntry), stride (walk-cycle radians a metre),
//   mouth ([across, up, ahead] from her head anchor, for her breath in the cold; none for Noctara, who is the night),
//   steps (her footstep sound), after(model) }.
function cutsceneCast() {
  'use strict';
  // the game's models are painted for a plain renderer: their colours are turned linear so they sit in the film camera's
  // light as they do in the game's, as the Io study puts the game's Io beside its own; they cast and take the moon's shadow
  function filmLight(m) {
    const seen = new Set();
    for (const g of [m.root, m.fx]) if (g) g.traverse((o) => {
      if (o.isMesh || o.isSkinnedMesh) { o.castShadow = true; o.receiveShadow = true; }
      if (!o.material) return;
      for (const mt of Array.isArray(o.material) ? o.material : [o.material]) {
        if (seen.has(mt)) continue; seen.add(mt);
        if (mt.color) mt.color.convertSRGBToLinear(); if (mt.emissive) mt.emissive.convertSRGBToLinear();
        for (const k of ['map', 'emissiveMap']) if (mt[k]) { mt[k].encoding = THREE.sRGBEncoding; mt[k].needsUpdate = true; }
        mt.needsUpdate = true;
      }
    });
    return m;
  }
  // a material the model sets afresh every frame in the game's colours (Sol's sunsteel, Halcyon's blade edge), found by
  // its colour before it is turned linear, so it can be turned linear again after each frame
  function find(m, hex, metal) {
    let hit = null;
    m.root.traverse((o) => { if (!o.material || hit) return; for (const mt of Array.isArray(o.material) ? o.material : [o.material]) if (mt.color && mt.emissive && mt.color.getHex() === hex && Math.abs(mt.metalness - metal) < 1e-3) hit = mt; });
    return hit;
  }
  const D = (q, light, phone, laptop) => ({ light, phone, laptop }[q] || phone);
  return {
    io: {
      kind: 'person', stride: 4.4, mouth: [0, -.075, .085], steps: 'step',
      make: (q) => makeIoCutscene({ detail: D(q, .25, .34, 1), shadows: true })
    },
    sol: {
      kind: 'person', stride: 4.2, mouth: [0, -.1, .1], steps: 'step',
      // study: a high-detail Sol, if one is made, would go here with the same interface
      make: (q) => { const raw = makeSol({ detail: D(q, .5, .5, 1) }); const blade = { edge: find(raw, 0xffe0a0, .2), steel: find(raw, 0xe0a24a, .45) }; const m = filmLight(raw); m.blade = blade; return m; },
      after(m) { if (m.blade.edge) m.blade.edge.emissive.convertSRGBToLinear(); if (m.blade.steel) m.blade.steel.emissive.convertSRGBToLinear(); }
    },
    halcyon: {
      kind: 'person', stride: 4.2, mouth: [0, -.12, .1], steps: 'step',
      // study: a high-detail Halcyon, if one is made
      make: (q) => { const raw = makeHalcyon({ detail: D(q, .5, .5, 1) }); const edge = find(raw, 0x10141f, .75); const m = filmLight(raw); m.edgeMat = edge; return m; },
      after(m) { if (m.edgeMat) m.edgeMat.emissive.convertSRGBToLinear(); }
    },
    noctara: {
      kind: 'person', stride: 4.2, steps: null,
      // study: a high-detail Noctara, if one is made
      make: (q) => filmLight(makeNoctara({ detail: D(q, .5, .5, 1) }))
    }
  };
}
