// words.js: every line this cutscene shows, in one place, for the lore conversation to rewrite. They are the game's own
// placeholders: the finale's introMsg, introAfter and attackText (src/game/fights.js, kind 'finale'), word for word.
// Defines cutsceneWords() only.
function cutsceneWords() {
  'use strict';
  return {
    // introMsg: over the moon going out
    goingOut: 'The dead Moonwell gives no light at all, and the moon is going out.',
    // introAfter: as Noctara lifts her face to the eclipse
    waits: 'Noctara the Starless waits at the well, and Halcyon stands at her side.',
    // attackText: as it hands over to the fight
    begins: 'The longest night begins!'
  };
}
