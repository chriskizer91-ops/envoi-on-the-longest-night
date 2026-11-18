# Art requests for the 3D map: round 1 (water and mountains)

For Chris to generate, if he wants the map's water and mountains better than his present textures can make them. Each
is one square picture that **tiles** (its left edge meets its right, its top meets its bottom), seen from **straight
above**, by **night under a full moon**, evenly lit, with no horizon, no objects, no shadows cast across it, no text.
1024 x 1024. Save each under the name given, as the other cards are (`moon-faire-witches/texture-packs/made/<name>.png`);
`tools/make-ground-layers.mjs` then packs it in.

Why these four: the map shows far more sea and mountain at once than a walking place does, so his present sea and rock
textures (made for close ground) show their repeat from high up, and the rock has no layers to it.

| Name | For | Prompt |
|---|---|---|
| `aethermoor_sea_from_high.png` | the open sea, seen from far above (now `deep_sea`, whose repeat shows) | Seamless tileable texture, top-down view from very high above of open ocean at night under moonlight. Deep navy blue water with long, soft, irregular swells and faint paler streaks of foam and current, low contrast, no single wave standing out, no horizon, no sky, no boats, no land. Painterly fantasy game texture, evenly lit, 1024x1024. |
| `aethermoor_sea_shallows.png` | the water by the shores (now `shallow_sea`) | Seamless tileable texture, top-down view of clear shallow coastal water at night under moonlight. Teal and blue-green water over a pale sandy bed, soft rippling light patterns on the bottom, a few darker patches of weed, no shoreline, no foam line, no objects. Painterly fantasy game texture, evenly lit, 1024x1024. |
| `aethermoor_mountain_rock.png` | the mountains' bare rock and cliff faces (now `bare_rock`) | Seamless tileable texture of a mountain rock face at night under moonlight. Grey-blue stone in tilted layers and long cracks running mostly one way, ledges and broken slabs, small pockets of old snow in the cracks, no plants, no sky. Painterly fantasy game texture, evenly lit, 1024x1024. |
| `aethermoor_mountain_scree_snow.png` | the ground between rock and snow (now `snowy_mountainside`) | Seamless tileable texture, top-down view of a high mountainside at night under moonlight. Wind-packed snow broken by dark grey scree, boulders and ribs of rock showing through, about half snow and half rock, in streaks running one way down the slope, no plants, no footprints. Painterly fantasy game texture, evenly lit, 1024x1024. |

Not needed: anything for the buildings (they wear the game's own wall and roof textures, all made), the forests, or the
surf (drawn by the page).
