// zones.js: the 3D game's zones (world3d/game/, November 16, 2026). A zone is a big section of Envoi whose places join on
// foot; each has its own page, zone-<n>.html, which tools/make-zones.mjs writes from this list with whichever of its
// places have been built in 3D (places/<id>.js). The four are the game's four level bands, which already join on foot.
// To regroup: move a place's id from one list to another (or start a fifth zone), then run make-zones.mjs again.
//   places:   the zone's places, by their walking map's id (src/game/maps.js)
//   landings: where the Magpie sets down in the zone (src/game/game.js LANDINGS, copied here): `id` its LANDINGS id,
//             `stand` where Io steps down (the zone page starts at the first landing whose place is built), `magpie`
//             where the Magpie is moored (maps.js's magpie spot, Bogmire's from game.js, or a camp's landing ground `land`)
(function (G) {
  'use strict';
  G.W3D_ZONES = {
    1: { name: 'Wickhollow and the fen', places: ['wickhollow', 'cottage', 'jetty', 'thornwood', 'bogmire', 'bogmire-heart'],
      landings: [{ id: 'wickhollow', name: 'Wickhollow', place: 'jetty', stand: [768, 720], magpie: [768, 760] },
        { id: 'bogmire', name: 'Bogmire', place: 'bogmire', stand: [130, 372], magpie: [84, 352] }] },
    2: { name: 'The Warm Roads', places: ['warm-roads-camp', 'ember-line-road', 'dawnroost-road', 'dawnroost', 'dawnroost-node'],
      landings: [{ id: 'warmCamp', name: 'The Warm Roads', place: 'warm-roads-camp', stand: [368, 425], magpie: [318, 425] },
        { id: 'dawnroost', name: 'Dawnroost', place: 'dawnroost', stand: [1450, 300], magpie: [1400, 300] }] },
    3: { name: 'The northern wilds', places: ['northern-camp', 'eldergrove-edge', 'cold-moor', 'crossroads', 'shipyard'],
      landings: [{ id: 'northCamp', name: 'The northern wilds', place: 'northern-camp', stand: [386, 455], magpie: [336, 455] },
        { id: 'shipyard', name: 'The shipyard', place: 'shipyard', stand: [780, 205], magpie: [764, 240] }] },
    4: { name: 'The northeast peaks', places: ['frozen-camp', 'frostmere-shore', 'frozen-pass', 'misthollow', 'moonwell'],
      landings: [{ id: 'frozenCamp', name: 'The northeast peaks', place: 'frozen-camp', stand: [356, 442], magpie: [306, 442] }] },
  };
})(window);
