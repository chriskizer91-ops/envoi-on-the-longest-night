// words.js: every line this cutscene shows, in one place, for the lore conversation to rewrite. They are the game's own
// placeholders: the Bramble Colossus fight's introMsg and introAfter (src/game/fights.js, colossus()), word for word. A
// line given as a list shows one part at a time; its parts joined with a space are the game's line.
// Defines cutsceneWords() only.
function cutsceneWords() {
  'use strict';
  return {
    // introMsg: as the party comes up the road
    thicket: 'Beside the frozen road stands a thicket as big as a house, green where nothing else is. The snow round it has melted.',
    // introAfter: as it rises, then as its bud opens
    rises: ['The ground splits. It heaves itself up out of the earth,', 'and a great thorned bud opens on a glowing heart: a Bramble Colossus.']
  };
}
