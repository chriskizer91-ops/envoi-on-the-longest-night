// extras.js: the pictures every place can use on top of its own textures: Chris's short list (November 17, 2026;
// docs/art-requests/15-3d-world-textures-short-list.md). A place gets one when it uses a texture named in `with`
// ('*': every place), or when its own data asks for it (`test`). Each is the full-size web copy of Chris's original
// (texture-packs/made-web/, labeled in its index.csv); the paths are written as the places write theirs, so the build puts
// the pictures inside the page. tools/make-zones.mjs reads this file too (`with`, and `src`: a pattern looked for in a
// place's own file), to carry each zone's extras.
(function (G) {
  'use strict';
  const W3D = G.W3D;
  W3D.EXTRAS = [
    // group A, house walls: a house takes one of its wall's pictures (world.js: VARIANTS)
    { id: 'wick_wall_timber_plaster_b', with: 'wick_wall_timber_plaster', made: "./../texture-packs/made-web/wick_wall_timber_plaster_b.webp" },
    { id: 'wick_wall_timber_plaster_c', with: 'wick_wall_timber_plaster', made: "./../texture-packs/made-web/wick_wall_timber_plaster_c.webp" },
    { id: 'shared_plaster_plain', with: 'wick_wall_timber_plaster', made: "./../texture-packs/made-web/shared_plaster_plain.webp" },
    { id: 'shared_stone_wall_rough_b', with: 'shared_stone_wall_rough', made: "./../texture-packs/made-web/shared_stone_wall_rough_b.webp" },
    { id: 'shared_stone_ashlar', with: 'shared_stone_wall_rough', made: "./../texture-packs/made-web/shared_stone_ashlar.webp" },
    { id: 'shared_stone_wall_frosted_b', with: 'shared_stone_wall_frosted', made: "./../texture-packs/made-web/shared_stone_wall_frosted_b.webp" },
    { id: 'shared_planks_wall_b', with: 'shared_planks_wall', made: "./../texture-packs/made-web/shared_planks_wall_b.webp" },
    // group B, doors and windows (cut-outs: engine/cutouts.js has each one's size)
    { id: 'shared_door_plank', with: '*', made: "./../texture-packs/made-web/shared_door_plank.webp" },
    { id: 'shared_door_arched', with: '*', made: "./../texture-packs/made-web/shared_door_arched.webp" },
    { id: 'shared_door_double_arched', with: '*', made: "./../texture-packs/made-web/shared_door_double_arched.webp" },
    { id: 'shared_window_lit', with: '*', made: "./../texture-packs/made-web/shared_window_lit.webp" },
    { id: 'shared_window_dark', with: '*', made: "./../texture-packs/made-web/shared_window_dark.webp" },
    { id: 'shared_window_shuttered', with: '*', made: "./../texture-packs/made-web/shared_window_shuttered.webp" },
    { id: 'chapel_rose_window', src: 'rose: true', test: (pl) => (pl.buildings || []).some((b) => (b.windows || []).some((w) => w.rose)), made: "./../texture-packs/made-web/chapel_rose_window.webp" },
    // group C, wood and things made of it
    { id: 'shared_beam_oak', with: '*', made: "./../texture-packs/made-web/shared_beam_oak.webp" },
    { id: 'shared_barrel_side', with: '*', made: "./../texture-packs/made-web/shared_barrel_side.webp" },
    { id: 'shared_crate_side', with: '*', made: "./../texture-packs/made-web/shared_crate_side.webp" },
    { id: 'shared_market_produce', src: "stall: \\{|'produce'", test: (pl) => !!pl.stall || /'produce'/.test(String(pl.extra || '')), made: "./../texture-packs/made-web/shared_market_produce.webp" },
    // group D, trees and bushes (cut-outs): a crown is built of boughs, a bush of a few crossed pictures of one
    { id: 'shared_bush_round', with: '*', made: "./../texture-packs/made-web/shared_bush_round.webp" },
    { id: 'shared_bush_flowering', with: '*', made: "./../texture-packs/made-web/shared_bush_flowering.webp" },
    { id: 'shared_bough_oak', with: ['wick_leaf_canopy', 'wilds_oak_leaves'], made: "./../texture-packs/made-web/shared_bough_oak.webp" },
    { id: 'shared_bough_fir', with: ['wilds_fir_boughs', 'wick_leaf_canopy', 'wilds_oak_leaves', 'wilds_birch_leaves'], made: "./../texture-packs/made-web/shared_bough_fir.webp" },
    { id: 'shared_bough_fir_snow', with: ['fir_foliage_snowladen', 'fir_foliage_frosted'], made: "./../texture-packs/made-web/shared_bough_fir_snow.webp" },
    { id: 'shared_bough_birch', with: 'wilds_birch_leaves', made: "./../texture-packs/made-web/shared_bough_birch.webp" },
    { id: 'shared_bough_thorn', with: '*', made: "./../texture-packs/made-web/shared_bough_thorn.webp" },
  ];
  // the extras a place gets: { id, made } entries for the loader (never one the place already lists)
  W3D.extrasFor = function (place) {
    const ids = new Set((place.textures || []).map((t) => t.id));
    return W3D.EXTRAS.filter((e) => !ids.has(e.id) && (e.with === '*' || [].concat(e.with || []).some((w) => ids.has(w)) || (e.test && e.test(place)))).map((e) => ({ id: e.id, made: e.made, clamp: !!(W3D.CUTOUTS || {})[e.id] }));
  };
})(window);
