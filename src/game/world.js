// world.js: the four level bands of Chris's night atlas of Aethermoor (4608 x 3072 atlas px), which the Magpie's flight
// reads (fly.js, through game.js): where a band the party can't reach yet lies under cold mist, and each region's name.
// Nobody walks the world map any more: since the wilderness scenes (Chris, October 3: the world map is only for flying
// the Magpie; his eight night scenes, October 5) Io walks from each band's camp to its town on painted scenes
// (maps.js), so the walking world (its nine tiles, its places, its random fights, the pixel Io and the mini-map) is gone
// from here and from the page. The flight keeps its own art (the far view and the clouds) and the land mask
// (world-mask.js) for its mini-map.
// World.bandAt(x, y) -> 1 to 4, or 0 under mist all game; World.BANDS: each band's outline on the atlas.
// Defines window.World.
(function () {
  'use strict';
  const inPoly = (pts, x, y) => { let ins = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins; } return ins; };
  // the four level bands on the atlas (plan, phase 3: the southwest and the wetlands; the western forests and
  // riverlands; the northwest and the northern passage; the northeast peaks). Anywhere else is under mist all game:
  // the central island, the east and the southeast
  const BANDS = {
    1: [[0, 1700], [2000, 1650], [2600, 1900], [2700, 3072], [0, 3072]],
    2: [[0, 900], [1650, 900], [1900, 1050], [2000, 1650], [0, 1700]],
    3: [[0, 0], [2450, 0], [2450, 900], [1900, 1050], [1650, 900], [0, 900]],
    4: [[2450, 0], [4608, 0], [4608, 1250], [3500, 1350], [2700, 1250], [2450, 900]],
  };
  function bandAt(x, y) { for (const b of [1, 2, 3, 4]) if (inPoly(BANDS[b], x, y)) return b; return 0; }
  window.World = { bandAt, BANDS };
})();
