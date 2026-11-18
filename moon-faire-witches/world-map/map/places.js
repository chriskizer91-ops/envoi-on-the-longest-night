// places.js: where everything is on the 3D map of Aethermoor, in the night atlas's own pixels (4608 x 3072, north up;
// 1 atlas pixel = 10 m). The four zones are the game's four level bands (src/game/world.js's World.BANDS, read by the
// page, Chris November 16: "those four zones are correct"); their walking places join on foot.
// Where each walking place sits is this conversation's proposal, for Chris to confirm (the slip lists them): the old
// world map's spots where Envoi had them (src/game/game.js, OLD_WORLD), the landings' docks (LANDINGS' sky), the
// towns' centres (texture-packs/world/aethermoor/inventory.md), and for the rest the way each place's exits lead
// (src/game/maps.js: an exit on a painting's east edge leads east). Every one is on land, in its own zone
// (tools/check-places.mjs checks both).
// Each walking painting is 1536 x 1024 of its own pixels, north up; on the map it covers FOOT atlas pixels round its
// spot, so Io's spot in her painting moves her pin a little within the place.
// Defines window.MapPlaces = { ZONES, PLACES, LANDINGS, FOOT, atlasOf(placeId, spot) }.
(function () {
  'use strict';
  const ZONES = {
    1: { name: 'Zone 1', land: 'The southwest and the fen', places: ['wickhollow', 'cottage', 'jetty', 'thornwood', 'bogmire', 'bogmire-heart'] },
    2: { name: 'Zone 2', land: 'The western forests', places: ['warm-roads-camp', 'ember-line-road', 'dawnroost-road', 'dawnroost', 'dawnroost-node'] },
    3: { name: 'Zone 3', land: 'The northwest and the northern passage', places: ['northern-camp', 'eldergrove-edge', 'cold-moor', 'crossroads', 'shipyard'] },
    4: { name: 'Zone 4', land: 'The northeast peaks', places: ['frozen-camp', 'frostmere-shore', 'frozen-pass', 'misthollow', 'moonwell'] },
  };
  // at: the place's middle on the atlas. why: where that comes from (for the slip and for Chris)
  const PLACES = {
    wickhollow: { name: 'Wickhollow', zone: 1, at: [1348, 1838], why: 'the town in the painting (the old world map\'s Wickhollow)' },
    cottage: { name: 'Io\'s cottage', zone: 1, at: [1352, 1948], why: 'through Wickhollow\'s south gate' },
    jetty: { name: 'The jetty', zone: 1, at: [1446, 1806], why: 'the Magpie\'s dock at Wickhollow (its landing)' },
    thornwood: { name: 'The Thornwood', zone: 1, at: [1530, 2160], why: 'the old world map\'s Thornwood, east of Wickhollow on foot' },
    bogmire: { name: 'Bogmire', zone: 1, at: [1752, 2512], why: 'the stilt town in the painting' },
    'bogmire-heart': { name: 'The fen\'s dark heart', zone: 1, at: [1800, 2385], why: 'through Bogmire\'s north edge, into the fen' },
    'warm-roads-camp': { name: 'The Warm Roads camp', zone: 2, at: [820, 1530], why: 'the Magpie\'s landing ground' },
    'ember-line-road': { name: 'The Ember Line road', zone: 2, at: [1000, 1420], why: 'east of the camp, among the old world map\'s three Ember Line nodes' },
    'dawnroost-road': { name: 'The forest road to Dawnroost', zone: 2, at: [1185, 1250], why: 'north of the Ember Line road, south of Dawnroost' },
    dawnroost: { name: 'Dawnroost', zone: 2, at: [1325, 1098], why: 'the walled town in the painting' },
    'dawnroost-node': { name: 'Dawnroost\'s living node', zone: 2, at: [1338, 985], why: 'through Dawnroost\'s north gate' },
    'northern-camp': { name: 'The northern camp', zone: 3, at: [1150, 612], why: 'the Magpie\'s landing ground in the northern wilds' },
    'eldergrove-edge': { name: 'Eldergrove\'s edge', zone: 3, at: [1390, 655], why: 'east of the camp on foot' },
    'cold-moor': { name: 'The cold moor', zone: 3, at: [1680, 735], why: 'between Eldergrove\'s edge and the crossroads' },
    crossroads: { name: 'The northern crossroads', zone: 3, at: [1960, 820], why: 'the old world map\'s crossroads, on the cliff-top meadow' },
    shipyard: { name: 'The shipyard', zone: 3, at: [2097, 599], why: 'the harbour castle at the end of the long bridge' },
    'frozen-camp': { name: 'The frozen camp', zone: 4, at: [2760, 1105], why: 'the Magpie\'s landing ground below the peaks' },
    'frostmere-shore': { name: 'Frostmere\'s shore', zone: 4, at: [3180, 1125], why: 'east of the camp, south of the frozen pass (where the river from Frostmere runs)' },
    'frozen-pass': { name: 'The frozen pass', zone: 4, at: [3270, 980], why: 'the old world map\'s frozen pass' },
    misthollow: { name: 'Misthollow', zone: 4, at: [3500, 735], why: 'the stone town in the painting, above Frostmere Lake' },
    moonwell: { name: 'The dead Moonwell', zone: 4, at: [3522, 645], why: 'through Misthollow\'s north gate' },
  };
  // where the Magpie lands: src/game/game.js's LANDINGS (their names, zones and docks on the atlas), copied here so the
  // map needn't load the whole 2D game. place: the walking place she lands in
  const LANDINGS = {
    wickhollow: { name: 'Wickhollow', zone: 1, sky: [1446, 1806], place: 'jetty' },
    bogmire: { name: 'Bogmire', zone: 1, sky: [1886, 2462], place: 'bogmire' },
    warmCamp: { name: 'The Warm Roads', zone: 2, sky: [820, 1530], place: 'warm-roads-camp' },
    dawnroost: { name: 'Dawnroost', zone: 2, sky: [1365, 1085], place: 'dawnroost' },
    northCamp: { name: 'The northern wilds', zone: 3, sky: [1150, 590], place: 'northern-camp' },
    shipyard: { name: 'The shipyard', zone: 3, sky: [2097, 580], place: 'shipyard' },
    frozenCamp: { name: 'The northeast peaks', zone: 4, sky: [2760, 1090], place: 'frozen-camp' },
  };
  const FOOT = [72, 48]; // a walking painting's size on the atlas (atlas px): 1536 x 1024 of its own pixels, shrunk
  // Io's spot on the atlas: her place's middle, moved by where she stands in its painting (spot: [x, y] in its pixels)
  function atlasOf(id, spot) {
    const p = PLACES[id]; if (!p) return null;
    if (!spot) return p.at.slice();
    return [p.at[0] + (spot[0] / 1536 - 0.5) * FOOT[0], p.at[1] + (spot[1] / 1024 - 0.5) * FOOT[1]];
  }
  window.MapPlaces = { ZONES, PLACES, LANDINGS, FOOT, atlasOf };
})();
