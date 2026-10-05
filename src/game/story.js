// story.js: the whole journey, in order (plan phase 3), as data that the simulator (src/battle/chain.js) and the game read.
// The places sit on Chris's D&D map (design decisions, seventeenth round); the stops are the lore's (lore answer 13) with
// the shipyard; the gates and their levels are the plan's. A step is one of:
//   scene:   a story beat (its words live with the game's scenes)
//   fight:   a set fight that must be won to go on (gate: true for the band's gate), or a story fight (story: true), which
//            goes on whatever happens
//   walk:    wild country between two places: about `fights` random encounters for a player who walks straight through
//            (measured on the game's own maps by tools/walks.mjs: the wild ground a tap walks from where Io comes on to the
//            way out, one fight per 770 px; each wild fight is worth rules.js WILD_REWARD times its table's experience);
//            `nodes`: the Ember Line nodes Sol relights on the way (each gives 150 shards times the band, game.js), and
//            `nodeFights`: the fights the short ways to them add (tools/walks.mjs measures the walk lighting them)
//   rest:    a rest place (an inn, or a camp where the way is long): HP and MP back, and where a lost fight wakes you
//   shop:    a herb shop: the party carries up to 99 of each herb (rules.js CARRY), and uses each once a fight
//   upgrade: the Magpie's upgrade (rules.js MAGPIE): it needs the band's gate won, the party's level and the shards
//   flags:   story flags the battles read (party: Sol has joined; refit, envoi, stoop: the gates' rewards)
// Defines globalThis.STORY.
(function (G) {
  'use strict';
  const PLACES = {
    wickhollow: { name: 'Wickhollow', band: 1, kind: 'town', note: "Io's village and its Moonwell, where Lunara sleeps" },
    thornwood: { name: 'The Thornwood', band: 1, kind: 'wild', note: 'black thorns and the old bridge on the way to Bogmire' },
    bogmire: { name: 'Bogmire', band: 1, kind: 'town', note: 'the stilt town whose lamplight has been stolen' },
    warmRoads: { name: 'The Warm Roads', band: 2, kind: 'wild', note: 'the Ember Line road, its nodes going dark, and the forest road up to Dawnroost' },
    dawnroost: { name: 'Dawnroost', band: 2, kind: 'town', note: "the Warden waystation, Sol's old home, and its living node" },
    northernWilds: { name: 'The northern wilds', band: 3, kind: 'wild', note: "Eldergrove's edge and the cold moor, the wild passage north where the cold sets in" },
    crossroads: { name: 'The northern crossroads', band: 3, kind: 'wild', note: 'four old roads meeting on the way to the shipyard' },
    shipyard: { name: 'The shipyard', band: 3, kind: 'town', note: "the Aurosi shipyard of Ysmera Brightkeel, at the end of the long stone bridge" },
    frozenPass: { name: 'The frozen pass', band: 4, kind: 'wild', note: "Frostmere's shore and the snowbound way up through the northeast peaks" },
    misthollow: { name: 'Misthollow', band: 4, kind: 'town', note: 'the town of pale towers whose Moonwell has gone dark' },
  };
  const PATH = [
    // ---------- band 1: Wickhollow and Bogmire ----------
    { scene: 'prologue', at: 'wickhollow' },
    { rest: 'wickhollow' },
    { fight: 'first', at: 'wickhollow', note: 'the Night square wraith, Io alone' },
    { scene: 'sol', at: 'wickhollow', flags: { party: true } },
    { scene: 'magpie', at: 'wickhollow' },
    { shop: 'wickhollow' },
    { walk: 'thornwood', band: 1, fights: 2 }, // 1,492 px, about as on October 3 (1,474): its 3 then came from that day's count, not a longer walk
    { rest: 'bogmire' },
    { shop: 'bogmire' },
    { fight: 'greatWraith', at: 'bogmire', gate: true, level: 5 },
    { scene: 'lights', at: 'bogmire' },
    { upgrade: 0, at: 'bogmire', flags: { refit: true } },
    // ---------- band 2: the Warm Roads and Dawnroost ----------
    { rest: 'warmRoads', camp: true },
    { walk: 'warmRoads', band: 2, fights: 3, nodes: 3, nodeFights: 2 }, // the Ember Line road and the forest road up to Dawnroost from the Warm Roads camp: 2,200 px; lighting the three nodes on the way, 3,548 px (about 4.6 fights: 2 more), and 900 shards
    { rest: 'dawnroost' },
    { shop: 'dawnroost' },
    { fight: 'dawnroost', at: 'dawnroost', gate: true, level: 10 },
    { scene: 'envoi', at: 'dawnroost', flags: { envoi: true } },
    { upgrade: 1, at: 'dawnroost' },
    // ---------- band 3: the northern wilds, Halcyon, the shipyard ----------
    { rest: 'northernWilds', camp: true },
    { walk: 'northernWilds', band: 3, fights: 5 }, // Eldergrove's edge and the cold moor from the northern camp, then the crossroads to the ambush and on north: 4,067 px
    { fight: 'halcyon', at: 'crossroads', story: true, level: 15 },
    { scene: 'kestrel', at: 'crossroads', flags: { stoop: true } },
    { rest: 'shipyard' },
    { shop: 'shipyard' },
    { scene: 'shipyard', at: 'shipyard' },
    { upgrade: 2, at: 'shipyard' },
    // ---------- band 4: the frozen pass and Misthollow ----------
    { rest: 'frozenPass', camp: true },
    { walk: 'frozenPass', band: 4, fights: 3 }, // Frostmere's shore from the frozen camp, then the frozen pass up to Misthollow: 2,028 px
    { rest: 'misthollow' },
    { shop: 'misthollow' },
    { fight: 'finale', at: 'misthollow', gate: true, level: 20 },
    { scene: 'ending', at: 'misthollow' },
  ];
  G.STORY = { PLACES, PATH };
})(typeof globalThis !== 'undefined' ? globalThis : window);
