# Travel between zones, and the 3D map

Chris's decisions, November 16 (11:24 to 13:39) and November 17, for the whole game of the new Envoi (Envoi with the
Moon Faire witches).

## The game's shape

- **The game is a folder in the repository.** Each zone is its own big section, loaded when you go there, so a zone can
  be as big as it needs. The places of a zone are joined on foot.
- **The four zones are the game's four level bands.** Chris confirmed them on November 16 at 13:39 ("those four zones
  are correct") and again on November 17 ("these are the four zones each with wilds"). Every one of the 21 walking maps
  in `src/game/maps.js` is built in 3D and sits in one of them. Each zone has its towns and its wild places (in bold):
  1. **Wickhollow and the fen:** Wickhollow, Io's cottage, the jetty, **the Thornwood**, Bogmire, Bogmire's dark heart
  2. **The Warm Roads:** the Warm Roads camp, **the Ember Line road**, **the forest road to Dawnroost**, Dawnroost,
     Dawnroost's living node
  3. **The northern wilds:** the northern camp, **Eldergrove's edge**, **the cold moor**, **the northern crossroads**,
     the shipyard
  4. **The northeast peaks:** the frozen camp, **Frostmere's shore**, **the frozen pass**, Misthollow, Misthollow's
     Moonwell
- **The zone pages are built** (world-3d conversation, on `work/world-3d`): `moon-faire-witches/world3d/game/zone-1.html`
  to `zone-4.html`. Io walks place to place through their exits, one place in memory at a time. Their README,
  `moon-faire-witches/world3d/game/README.md`, is the full reference for the hook below.
- **Built to play, in the repository** (November 17, `work/world-3d`): `moon-faire-witches/world3d/builds/`, one offline
  file per zone (21 to 24 MB each), with a README that labels each one: `envoi-3d-zone-1-wickhollow-and-the-fen.html`,
  `envoi-3d-zone-2-the-warm-roads.html`, `envoi-3d-zone-3-the-northern-wilds.html` and
  `envoi-3d-zone-4-the-northeast-peaks.html`. They use stand-in textures. Chris's made textures (all 130, on
  `work/textures-made`) go in next, when he says, and these files are built again.

## Flying between zones

- **Air travel is Chris's airship game, Skies of Aethermoor** (its own, quite advanced game:
  `chriskizer91-ops/airship-game-in-aethermoor-`, read only; copy what's used into envoi-on-the-longest-night and name the
  source in the commit message).
- **Raiders attack on every flight, as in Skies.** The distance sets how many you fight: one raider, two, three. Flights
  get harder later in the game, at a higher level.
- **One currency.** Skies' Crystal Shards are the same shards Envoi uses to upgrade the ship and open each new zone.
- **A zone opens when several things are met:** the party's level, and the crystals to buy passage or the upgrades
  that let the ship make that flight.
- **Flights use the night map**: Envoi's night atlas, not Skies' day painting.
- **The ship** (Chris to the map conversation, November 16, 20:18): Skies' own four ships. The next ship is part of
  each gate between zones (upgrading the ship).

## How the zone pages hand over to the flight (built)

- **The hook:** `W3D.zoneFly(from)`. It runs when Io walks up to the ship where it's moored at a landing (a soft violet
  glow), or into a road out to the wide world. `from` is:
  - `zone`: 1 to 4;
  - `place`: the walking map's id;
  - `at`: Io's spot in that place's painting pixels;
  - `face`: which way she faces, in radians;
  - `exit`: the road she walked into, or null;
  - `landing`: the landing's id from `src/game/game.js` LANDINGS, or null.

  The landing ids and their zones: `wickhollow` and `bogmire` (zone 1), `warmCamp` and `dawnroost` (zone 2), `northCamp`
  and `shipyard` (zone 3), `frozenCamp` (zone 4).
- **Out:** there are two ways to take the flight.
  - Open a zone page with `?fly=<page>`. The hook then goes to `<page>?zone=1&place=jetty&at=768,742&face=0&landing=wickhollow`.
  - Hold the zone page in a frame and listen for the message `{ type: 'envoi3d-fly', from }`.
- **Back:** open the destination zone page with `?landing=<id>`, or `?place=<id>&at=<x>,<y>[&face=<radians>]`. Add
  `&fly=<page>` to keep the hook pointing at the flight.
- **One save:** the localStorage key `envoi3d-save`, as `{ v: 1, found, where, zones }`, where:
  - `found`: the keepsakes found;
  - `where`: where Io is now;
  - `zones`: where she was last in each zone.

  The flight and the map add their own fields beside these (`shards`, `level`, `ship`, as they decide). The rules:
  read it fresh, change only your own fields, keep every field you don't know, and write it straight back.

## The 3D map (its own conversation, running on `work/world-map`; its slip is claude/slips/world-map.md)

Whenever the player chooses to travel, by flight or on foot, a **3D map of Aethermoor** shows where they are. For a
flight, it shows where you are, then a **dotted line from where you are to where you're going**, then switches to
**Skies over Aethermoor** so you fly the ship there. On landing, the destination zone's page opens at that landing.

### What there is to build from

- **The night atlas:** `reference/art/world-map/night/Aethermoor-Natural-Night-Atlas.webp` (4608 x 3072, north up).
  The day atlas, `reference/art/world-map/day/Aethermoor-Nine-Region-Atlas.webp`, is the same size and lines up; use it
  to read what the ground is.
- **The map's terrain:** `moon-faire-witches/texture-packs/world/aethermoor/inventory.md` lists each kind of ground, where
  it is on the atlas, and a suggested scale of 1 atlas pixel = 10 m.
- **The zones on the atlas:** `src/game/world.js` holds `World.BANDS`, each band's outline, and `bandAt`.
- **The landings:** `src/game/game.js`, `const LANDINGS`. There are seven, each with a name, its band, `field` (the
  walking place and spot where you land) and `sky` (its spot on the atlas), plus the story conditions for each (`need`).
- **The present flight:** `src/game/fly.js`, the 2D game's toy-sized Magpie flight. Skies replaces it.
- **Skies of Aethermoor:**
  - `docs/game.md`: the port, voyages, waves, raiders, shards, the skies and the controls.
  - `docs/map.md`: its map is 4608 x 3072 at 5 m a pixel, the same continent and layout as the atlas.
  - Its code: `src/game/` and `src/ship/`. Its page: `dist/game.html`.
- **The places on the map:** the map conversation has placed all 21 walking places and the 7 landings in their zones
  (its slip has the details), and Chris confirms them.

### How the pieces join (a proposal; Chris tunes it)

1. Io reaches a landing (or a road out to "the world") in a zone page. The hook, `W3D.zoneFly`, opens the 3D map.
2. The map shows where she is and the landings that are open, with what each still needs (level, shards, ship).
3. Choosing one draws the dotted line. Then the flight starts in Skies on the night map, with the raider count set by
   the distance.
4. The ship lands, and the destination zone page opens with `?landing=<id>`.
5. Shards, the ships and the party's level live in `envoi3d-save`, which the zone pages, the map and the flight all
   share.

## Starter text for the 3D map conversation (if it ever needs starting again)

```text
You're a job conversation for the new Envoi (Envoi with the Moon Faire witches): the 3D map of Aethermoor and travel
between zones. First read the project documents claude/envoi-board.md, claude/travel-and-3d-map.md,
claude/slips/world-map.md and claude/slips/world-3d.md. Add the repository chriskizer91-ops/envoi-on-the-longest-night
if it isn't here yet. Also read chriskizer91-ops/airship-game-in-aethermoor- (Skies of Aethermoor): read only, never
push to it; copy what you use into envoi-on-the-longest-night and name the source in the commit message. Carry on from
your own branch: git fetch origin work/world-map && git checkout -B work/world-map FETCH_HEAD.
Read moon-faire-witches/world3d/game/README.md: the zone pages, their air-travel hook (W3D.zoneFly), how a flight hands
back (?landing= or ?place=&at=) and the shared save (envoi3d-save).
Build it a demo page at a time I can open on my phone (one offline HTML file each, made with
node tools/build.mjs --offline):
1) the 3D map of Aethermoor from the night atlas, showing where Io is;
2) choosing where to go, on foot or by flight, with a dotted line from here to there for a flight;
3) the flight in Skies of Aethermoor on the night map, with Skies' own ships, as many raiders as the flight is long;
4) landing, back into the zone page at that landing.
Keep your files in moon-faire-witches/world-map/. Don't change moon-faire-witches/world3d/ (the world-3d
conversation's): use its zone pages' travel hook, and write in your slip anything you need changed there. Keep your
notes in the project document claude/slips/world-map.md, the only project document you write. Explain things to me in
plain words, and show me each step with pictures.
```
