// art.js: the 3D map's art: two data pictures (made by tools/make-terrain.mjs from Chris's day atlas) and his ground
// textures (packed by tools/make-ground-layers.mjs); labels in art/LABELS.md. The build puts each inside the page (tools/build.mjs: "./" paths are read from the page's own folder).
window.MAP_ART = {
  height: "./art/aethermoor-terrain-height.png", // how high each spot of Aethermoor stands
  kinds: "./art/aethermoor-terrain-kinds.png", // what kind of ground each spot is
  layers: "./art/aethermoor-ground-layers.webp", // Chris's sixteen world-map ground textures, in one picture
};
