// art.js: the 3D map's art: two data pictures (made by tools/make-terrain.mjs from Chris's day atlas) and his ground
// textures (packed by tools/make-ground-layers.mjs); labels in art/LABELS.md. The build puts each inside the page (tools/build.mjs: "./" paths are read from the page's own folder).
window.MAP_ART = {
  height: "./art/aethermoor-terrain-height.png", // how high each spot of Aethermoor stands
  kinds: "./art/aethermoor-terrain-kinds.png", // what kind of ground each spot is
  blayers: "./art/aethermoor-building-layers.webp", // the 3D game's wall and roof textures, in one picture
  players: "./art/aethermoor-place-layers.webp", // the textures the walking places use in the 3D game, in one picture
  pgrounds: "./art/aethermoor-place-grounds.webp", // where each walking place has cobbles, earth, paving and water
  layers: "./art/aethermoor-ground-layers.webp", // Chris's sixteen world-map ground textures, in one picture
};
