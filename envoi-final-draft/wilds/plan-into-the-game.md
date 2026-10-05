<!-- Planning only (October 5, 2026): the ultracode hub's read-only plan for T02 step 2, made by three planners (the game flow; the tests, tools and records; the page, its size and the Magpie at the camps) and merged by a completeness critic that checked each claim against the code at 23145a4. Nothing in it is built yet: it waits on Chris's okay after he walks the demo. The scratch scripts it mentions under the session's scratchpad were not kept; re-derive any number from the final maps before using it. -->

# T02 step 2, merged plan: the wilderness scenes in the game, and no walking on the world map

**Built October 5** (commit A `8dd7b7b`, commit B `d5dce10`), at Chris's go-ahead with the four questions in §6 left to their defaults. Where the build differs from this plan, the code and `../../handoff/tasks.md` (T02) are right: the town arrivals and the northern camp's landing come from the final traces ([762, 52], [1486, 564], [786, 52]; northCamp lands Io at [336, 495]); check-maps also checks that each closed road has its line and that a camp's landing sets Io down within reach of the Magpie; `edits-core.js` also takes an old edit's world exit, now leading into a scene, by its rectangle only; the `world` test step first walks Io into the cottage's south road and starts from the story's state before the Warm Roads (band 1 won); the walks measure 1,492, 2,200, 4,067 and 2,028 px (`story.js` 2, 3, 5 and 3, the Thornwood's optional change taken); `tools/walks.mjs` is kept, its threshold carried from map to map as `field.js` now does; the dead `.flight` styles are gone.

Base: branch `ccr-31761774-76j8j3` at `23145a4`. All line numbers below are from that commit. This is planning only: nothing in the repo was changed.

My own checks are in `/tmp/claude-0/-home-user/d2fba9bd-f8b3-5281-8483-658756176613/scratchpad/plan-tmp/critic/`:
- `verify.cjs` checks the walking components, one-way exits, each chapter's reach to its Magpie, the landing points, where the closed roads step Io back, and every arrival. I ran it on the live scratch traces (with ports recomputed) and on `rv-wilds/real/maps-wilds.js`.
- `oldsave.cjs` checks the old-save rule and the Magpie safety net in §3.4.
- `stepback.cjs` checks the step-back points at each `to: 'world'` exit.
- `MAPS_EXTRA=…/rv-wilds/real/maps-wilds.js node tools/check-maps.mjs` passes all 21 maps today.

## 1. How the three plans hold up

### Confirmed in the code

- **The world tiles.** Only `game.js:109` (`TILES`) names the nine `art/world/night-*.webp` files. `build.mjs:25-30` inlines only double-quoted `"art/…"` paths in the scripts a page loads, so deleting line 109 alone removes 2,687,716 bytes from the page. Files on disk don't matter to the build.
- **What flying still needs.** The flight needs `World.bandAt` (world.js:30, used at game.js:589-590), `REGION` (game.js:111) and `world-mask.js` (fly.js's mini-map). world.js:126-131 keeps a requestAnimationFrame loop running while hidden.
- **Every route to `goWorld`:**
  - `onExit` (404)
  - `wake` (459)
  - `board` (576, 579)
  - `begin` (936)
  - `api.goWorld` (949)

  `mode: 'world'` is also written by `save()` (372) and `rest()` (549).
- **Four walking areas.** With the three town exits re-pointed, the maps split into exactly four separate walking areas, one per band. There are no one-way exits and every area has a landing. Each chapter's start reaches its Magpie on foot. Nothing else joins the areas but the Magpie: if a lost fight wakes the party at a rest in one area while she's moored in another, Io is stranded. The safety net in §3.4 is required.
- **Landing points.** `land + [0, 40]` can be stood on in all three camps, and it is 52 px from `land` (Io's reach is 58). Each camp's rest spot and `start` can be stood on. Every arrival stands, and sits outside every exit's 8 px reach.
- **Map tools that break:**
  - `check-edits.mjs:32` throws (`Object.entries(undefined)`) once `Game.PLACES` is gone.
  - `apply-edits.mjs:20` throws "`<map>` has no block" on a one-line `block: [],`. That is the crossroads today, and the cold moor and Frostmere's shore in the traces.
- **Fights at scene edges.** `field.js:267` draws a new fight threshold on every map load, while the counter carries over (it grows only on wild maps, `field.js:356`). With a high counter, about a quarter of entries into the next wild scene start a fight on the first step.
- **Small facts.** `nodeLit` (script.js:183) is never used. `stagePlay` already supports `{ face, to }` (game.js:361). `flight()` (599-604) is dead code. The `frozen` scene already plays twice today: once from `camp()` (555), then again from `arrive('frozen-pass')` (396).
- **Sizes.** page-art's numbers are right:
  - The published page goes from 15,160,493 to 14,060,215 bytes, ±10 KB for the trace code.
  - With the scenes in and the tiles kept, it would be 16,747,931 (over 16,000,000).
  - The same with T01 part B as well would be 17,160,668 (over 16 MiB).

### Claims that are wrong

1. **page-art §5** says field.js:238 marks a used node and field.js:450 gives a used node the colour `'255,190,90'`. False. Line 238 marks `used` only for wells (`s.kind === 'well' && opts.isDone('well:' + s.id)`), and line 450 has no node case. A relit node glows and reads exactly like a dark one unless something changes.
2. **tests-tools §1** says the file Chris keeps goes from 17,962,445 bytes to about 16.86 MB. 17,962,445 is the plain `--min` `dist/game.html`, which the build writes beside `game.artifact.html`. The `--offline` file Chris keeps is 18,769,392 today and about 17,669,114 after T02 (page-art's figures).
3. **game-flow §2.2** drops the node markers from `OLD_WORLD`. Yet its own checks and its `proto.mjs` expect a world save at [1000,1450] to load on `ember-line-road`. That only happens if the node markers are kept, as `proto.mjs` keeps them. Without them, the save loads at the warm camp.
4. **game-flow §2.8** says "nearest dark node first … no backtracking". The goal is recomputed every frame (field.js:486) by straight-line distance from Io's moving position:
   - walking east from the west entry, the target flips to node2 near [300,530] (288 against 289 px);
   - on the ring path it flips back to node1 ([350,450]: 230 against 237 px).

   So the arrow flickers, and node2-then-node1 is a backtrack.
5. **game-flow §2.11** says the step back lands on walkable ground for all five roads. On the cottage's west footbridge (exit rect [0,397,18,442], bridge walk rectangle up to y 442), 22 of 253 trigger points step back 1 to 4 px below the bridge. That is because stepBack moves toward the map's middle, which here adds +y. It is harmless: field.js's 4 px over-step (line 330) brings her back on, and the before-the-party line already behaves this way today. No change needed.
6. **page-art §2.3** says that if `goWorld` is reached after `TILES` is gone, Io lands on dark ground. In fact, with the `TILES` constant deleted, world.js's `tile()` would throw a ReferenceError on every frame. This no longer matters once `World.create` is removed, but it is why the tiles, `World.create` and every `goWorld` caller must go out together.
7. **tasks.md** has stale figures:
   - T02 line 91 says "2.2 MB on disk": it is 2.02 MB on disk and 2.69 MB inside the page.
   - T13 line 192 says the scenes add "about +1 MB": they add 1.59 MB.
   - T13 line 189 says the published copy is 15,160,262: it is 15,160,493 today.
   - The map editor README's 4.9 MB is stale: it is 5,968,791 bytes today and about 7.56 MB after.

### Where the plans disagree, and what this plan does

**Order of commits.** tests-tools' "move first, its own commit, play unchanged" is unsafe. The moment `maps.js` holds the scenes, `game.html` inlines them while `TILES` is still there, which makes 16,747,931 bytes.

| Point | game-flow | tests-tools | page-art | **This plan** |
|---|---|---|---|---|
| The five roads out | keep `to: 'world'`, a line, step back | check-maps fails any `to` that isn't a map; the test throws on any 'world' exit | not covered | **keep `to: 'world'` as a closed road and add `say: '<scene id>'`. check-maps allows 'world' and fails any other unknown `to`** |
| `window.Game` | `{ start, LANDINGS }` | `{ start, PLACES, LANDINGS, CHAPTERS }` | not covered | **`{ start, LANDINGS, CHAPTERS }`. check-edits reads `PLACES` with a `\|\| {}` fallback** |
| The camp's Magpie spot | in maps.js, with a runtime fallback | added at runtime (the demo adds its own look spot at `land`) | in maps.js, beside `land` | **added at runtime in `setupMaps`, at `land`** |
| Where she lands at a camp | land + [0,40], facing 's' | not specified | land + [125,30], facing 'e' (beside a drawn ship) | **land + [0,40], facing 's'.** Re-derive if a ship is ever drawn |
| An old save on the world map | nearest `OLD_WORLD` place, nodes dropped | its band's camp, or the nearest place | `bandAt` → its band's camp | **nearest place its band and story allow, with the node markers kept (they lead to `ember-line-road`'s start). A world rest goes to the nearest camp's fire** |
| The arrow and the nodes | detour to dark nodes, nearest first | arrow points at the exits on every scene | not covered | **no detour, as today (question 4)** |
| A relit node | field.js gets a "used" label and a dim glow | either | hidden, as on the world map | **hidden by game.js (`setupMaps`). field.js's spot code untouched (question 4)** |
| Test step name | `fly` | keep `world` | not covered | **keep `world`** |
| Ambience lists | generic | not covered | from the pictures | **page-art's** |
| Io's facing on arrival | optional, everywhere | not covered | optional `dir` on 16 exits plus the landings | **`dir` only on the three exits into the towns, which keeps today's facing. Everything else stays as today** |
| Commits | one | move first | scenes and tiles together | **one code commit (B). The apply-edits fix (A) is separate and can go any time** |

### What no plan covered

- **The Io on Foot page.** `src/walk/on-foot.js:75` still says "the game goes out to the world map here" on every `to: 'world'` exit.
- **Pending map-editor edits.** Before starting, read the map editor's `edits` and `places` collections (ArtifactData). T09 has nothing pending today. But anything Chris sends for the cottage, Dawnroost, the crossroads or the frozen pass would be made on a tracing whose exits and arrivals change in this commit.
- **A painting play no longer uses.** After T02, nothing in play uses the Gloamwood road painting (`art/backdrops/battle-gloamwood-road.avif`, 307,521 bytes, about 410 KB inside the page). Band 1's random fights on the world map were the only place it appeared. Only fights.js's default scene (148) and the test's `wild` step still use it. It is a T13 lever, but fights.js belongs to T01 until part B is in: note it, don't touch it.
- **The words job.** New scene ids go in `script.js` `scenes`, which T05's words job covers wholesale (tasks.md's "28 story scenes" becomes 31). T05 says the hub leaves `script.js` alone while that job is out: land this before it starts, or after it returns.
- **Stale comments:**
  - `songs.js:2`
  - `src/stage/gloamwood-road.js:3`
  - `goal-arrow.js:2-4`
  - `state.js` header
  - `game.js:345`
  - `tools/world-mask.mjs:1`
  - `game.css:1-5`, plus the dead `.flight*` rules (54-59, 105)
- **A design-decisions line.** `docs/design-decisions.md:1036` says the arrow points "to the Magpie or the world map when no road leads there". The world map part is no longer true.

## 2. Order of work

0. **Before starting:**
   - Get Chris's okay and record it in his own words.
   - Read `edits` and `places`.
   - T09 must not be running.
   - T05 must not be out, or its handling of `script.js` must be agreed.
   - Only one agent works in `game.js` and `maps.js`.
   - T01 part B can land before or after this (both orders stay under 16 MB).
1. **Commit A (any time, its own commit): apply-edits handles one-line lists.** The code is in tests-tools §8 (`fieldEntries` returns `inline` for `'\n      ' + field + ': [],'`; at line 85, `inline ? '\n' + out.join('\n') + '\n      ' : …`). Tested in `plan-tmp/ae/`.
2. **Commit B (one commit): everything in §3.** None of it can land on its own:
   - scenes in `maps.js` without the tiles out puts the page over 16 MB;
   - tiles out without `World.create` out throws;
   - `World.create` out without every `goWorld` caller rerouted breaks exits, wakes, landings and old saves;
   - `PLACES` out without the check-edits fix crashes check-edits;
   - `goWorld` out without the new test step breaks the default `world` test;
   - `maps-wilds.js` deleted without `wilds.html:70` breaks the demo's build.
3. **Build, check, publish** (§4 and §5). Never publish a page built from an in-between state.
4. **Commit C: the records** (§5).

## 3. Commit B, file by file

### 3.1 `src/game/maps.js`

- **Move the scenes in.**
  - Paste the body of `maps-wilds.js`'s `const WILDS = { … };` unchanged, after moonwell's `    },` (655) and before `  };` (656).
  - Keep the assembler's shape: keys quoted at 4 spaces, fields at 6, `walk: [` on its own line. apply-edits' `mapBlock` and `fieldEntries` need exactly this.
  - Keep each entry's comment line.
  - Don't rewrite an empty list as `block: [\n      ],`. apply-edits' end search would then find the next list's `],` and clobber it.
- **The three town exits** keep their rects:

  | Line | Exit | Change |
  |---|---|---|
  | 374 | Dawnroost south | `to: 'dawnroost-road', at: <dawnroost-road's top port>, label: 'The forest road'` |
  | 461 | Crossroads west | `to: 'cold-moor', at: <cold-moor's right port>, label: 'The cold moor'` |
  | 549 | Frozen pass south | `to: 'frostmere-shore', at: <frostmere-shore's top port>, label: "Frostmere's shore"` |

  - Today's ports are [756,48], [1488,560] and [776,48] (from `rv-wilds/real/ports.json`; the live traces give the same).
  - Re-run `rv-wilds/ports.cjs` on the final traces.
- **Facing into the towns.** In the moved scene entries, add `dir` to the three exits that lead into towns:
  - dawnroost-road's top exit to dawnroost [641,985]: `dir: 'n'`;
  - cold-moor's right exit to crossroads [40,485]: `dir: 'e'`;
  - frostmere-shore's top exit to frozen-pass [788,990]: `dir: 'n'`.

  This keeps today's look: world arrivals into those towns face `'n'` (game.js:412). The extra field is safe for the editor tools: edits-core's `validate` reads only `to`, `rect` and `at`, and fingerprints use rects only.
- **The five roads out** (lines 150-152, 460, 462): leave each exit as it is and add `say`:
  - the cottage's three: `say: 'roadOut'`;
  - the crossroads south: `say: 'crossroadsSouth'`;
  - the crossroads east: `say: 'crossroadsEast'`.
- **Header (lines 1-15):**
  - `to: 'world'` now means a road out of the picture that she turns back from (the world map is only flown);
  - `say` is that road's line;
  - `dir` is her facing on arrival;
  - spots of `kind: 'node'` are Ember Line nodes, with the world map's ids;
  - `land` is a camp's landing ground (game.js puts the Magpie's spot there and lands Io 40 px south);
  - `kind: 'camp'`.

### 3.2 `src/game/world.js`

Cut the file down to `inPoly`, `BANDS` (24-29) and `bandAt` (30), exported as `window.World = { bandAt, BANDS }`.
- The new header should say that nobody walks the world map since the wilderness scenes (Chris, October 3) and that the flight reads its bands.
- Remove the tiles, markers, encounter counter, pad, painted Io, skiff and mini-map.
- `putting-it-all-together/game.html` stays as it is (lines 52-53 still load `world-mask.js` and `world.js`). Nothing else creates a World (checked).

### 3.3 `src/game/field.js`

- **267:** `if (!P.next) P.next = nextGap();`. A row of scenes becomes one walk, so fights no longer bunch at scene edges. All rates are 1. This also applies to the Thornwood and to the wilds demo, which is consistent.
- **528 (the mini-map):** skip exits with `ex.to === 'world'`, so closed roads aren't drawn as ways out.
- Nothing else changes: no change to `things()`, and no node colour.

### 3.4 `src/game/game.js`

**Header, lines 1-12.**
- "the world map (world.js)" becomes "the flying map (fly.js)".
- Line 8: "opens the flying map's bands".
- Delete lines 9-10.

**Lines 18-34: `PLACES` becomes `OLD_WORLD`, read only for old saves.** It stays outside `start`:

```js
// where each place lay on the world map (atlas px), for saves made there before the wilderness scenes: nobody walks it
// now (Chris, October 3: it is for flying). A place's ground arrival, a camp (its landing), or a node's road
const OLD_WORLD = {
  wickhollow: { at: [1348, 1838], band: 1, map: 'cottage', arrive: [790, 990] },
  thornwood: { at: [1530, 2160], band: 1, map: 'thornwood', arrive: [60, 456] },
  bogmire: { at: [1752, 2512], band: 1, map: 'bogmire', arrive: [70, 368] },
  warmCamp: { at: [820, 1560], band: 2, camp: 'warmCamp' },
  node1: { at: [960, 1420], band: 2, map: 'ember-line-road' }, node2: { at: [1180, 1330], band: 2, map: 'ember-line-road' }, node3: { at: [760, 1250], band: 2, map: 'ember-line-road' },
  dawnroost: { at: [1325, 1098], band: 2, map: 'dawnroost', arrive: [645, 990] },
  northCamp: { at: [1150, 620], band: 3, camp: 'northCamp' },
  crossroads: { at: [1960, 820], band: 3, map: 'crossroads', arrive: [768, 990] },
  shipyard: { at: [2097, 599], band: 3, map: 'shipyard', arrive: [760, 990], need: (sv) => sv.flags.stoop },
  frozenCamp: { at: [2760, 1120], band: 4, camp: 'frozenCamp' },
  frozenPass: { at: [3270, 980], band: 4, map: 'frozen-pass', arrive: [790, 990] },
  misthollow: { at: [3500, 735], band: 4, map: 'misthollow', arrive: [768, 985] },
};
```

**Lines 35-45: `LANDINGS`.**
- Keep every id: `st.magpie`, the `camp:<id>` flags, `CHAPTERS`, `UPGRADES` and fly.js all use them.
- The camps become ground landings, with their first-landing scene. Points are `land + [0, 40]` from the final traces:

```js
warmCamp: { name: 'The Warm Roads', band: 2, field: ['warm-roads-camp', [318, 465]], scene: 'warmRoads', sky: [820, 1530] },
northCamp: { name: 'The northern wilds', band: 3, field: ['northern-camp', [338, 468]], scene: 'northern', sky: [1150, 590] },
frozenCamp: { name: 'The northeast peaks', band: 4, field: ['frozen-camp', [306, 482]], scene: 'frozen', sky: [2760, 1090] },
```

- Update the comment at 35-36: "a dock on a town's map, or a camp's landing ground".
- `CHAPTERS` (46-66), `UPGRADES`, `nextStep`, `wayOut`, `exitMark` and `markOn` don't change.

**Lines 91-111: the tables.**
- `AMBIENCE`: delete the `world` entry (105). Add these (every sound id exists in thareia-audio.js):

```js
'warm-roads-camp': [['campfire', 5, 9, 0.28], ['crickets', 7, 13, 0.22], ['owl', 16, 30, 0.18]],
'ember-line-road': [['crickets', 6, 12, 0.25], ['river', 9, 16, 0.2], ['vein-pulse', 14, 26, 0.12]],
'dawnroost-road': [['owl', 10, 22, 0.25], ['leaves', 8, 15, 0.25], ['crickets', 9, 16, 0.18]],
'northern-camp': [['campfire', 5, 9, 0.28], ['river', 9, 16, 0.2], ['owl', 14, 28, 0.2]],
'eldergrove-edge': [['leaves', 7, 14, 0.25], ['owl', 10, 20, 0.25], ['wind', 12, 22, 0.15]],
'cold-moor': [['wind', 6, 11, 0.28], ['owl', 16, 30, 0.16]],
'frozen-camp': [['campfire', 5, 9, 0.28], ['wind', 6, 11, 0.25], ['blizzard', 18, 30, 0.12]],
'frostmere-shore': [['wind', 5, 10, 0.3], ['blizzard', 14, 24, 0.16]],
```

- `MUSIC` (107): add all eight ids as `'travel'`. That is Chris's wilds song, the same one the world map's camps play today. Behaviour doesn't change (`|| 'travel'` is already the fallback). The entries just record the choice.
- Delete `TILES` (108-109).
- Keep `REGION` (111): the flight's region names use it (590).

**Inside `start`:**
- 119: `const fieldHost = el('div', { class: 'layer' }, root);` (`worldHost` goes).
- 164: `const id = mode === 'field' ? field.map && field.map.id : null, list = id && AMBIENCE[id];`
- 208-218: delete `World.create(...)`. Its 330/190 encounter counter, `onEnter` and `onEncounter(b)` go with it.

**`setupMaps` (220-240).** Add this before the loop at 231:

```js
// each camp's Magpie, on its landing ground (maps.js land): a glow, as at the docks, while she's moored there
for (const L of Object.values(LANDINGS)) { const m = L.scene && MAPS[L.field[0]]; if (m && m.land && !(m.spots || []).some((s) => s.kind === 'magpie')) m.spots = (m.spots || []).concat({ kind: 'magpie', at: m.land.slice(), label: 'The Magpie', note: 'Down on the landing ground.' }); }
```

In the loop, replace line 234 and add the node line:

```js
if (s.kind === 'magpie') s.hide = () => { const L = st.magpie && LANDINGS[st.magpie]; return !(L && L.field && L.field[0] === id); };
if (s.kind === 'node') s.hide = () => !!st.done[s.id]; // a node Sol has relit goes dark, as its marker did on the world map
```

**New helpers, next to `wayOut` (264).**

```js
const onFoot = (a, b) => a === b || !!wayOut(a, (m) => m === b);
// nobody walks the world map now, so the ground maps fall into four parts that only the Magpie joins. On a map from which
// she can't be reached on foot (a lost fight woke the party at a rest in another band; a save from before the scenes),
// she's moored at the landing nearest on foot that she may use, so the party is never stranded
function keepMagpieNear(here) {
  const L = st.magpie && LANDINGS[st.magpie];
  if (!st.flags.magpie || (L && L.field && onFoot(here, L.field[0]))) return;
  const seen = new Set([here]), q = [here];
  for (let h = 0; h < q.length; h++) {
    const k = Object.keys(LANDINGS).find((id) => { const N = LANDINGS[id]; return N.field[0] === q[h] && N.band <= st.band && (!N.need || N.need(st)); });
    if (k) { st.magpie = k; note('The Magpie is moored at ' + LANDINGS[k].name.replace(/^The /, 'the ') + '.'); return; }
    for (const ex of MAPS[q[h]].exits || []) if (MAPS[ex.to] && !seen.has(ex.to)) { seen.add(ex.to); q.push(ex.to); }
  }
}
// a world-map position from a save made before the wilderness scenes: the place it was nearest, of those open to that
// save; a rest there was always a camp's (its fire)
function fromWorldAt(sv, at, rest) {
  let best = null, bd = Infinity;
  for (const k in OLD_WORLD) { const p = OLD_WORLD[k]; if (p.band > (sv.band || 1) || (p.need && !p.need(sv)) || (rest && !p.camp)) continue; const d = Math.hypot(p.at[0] - at[0], p.at[1] - at[1]); if (d < bd) { bd = d; best = p; } }
  if (!best) return rest ? ['cottage', [838, 520]] : ['cottage', [790, 990]];
  if (!best.camp) return [best.map, (best.arrive || MAPS[best.map].start).slice()];
  const L = LANDINGS[best.camp], fire = (MAPS[L.field[0]].spots || []).find((s) => s.kind === 'rest');
  return [L.field[0], (rest && fire ? fire.at : L.field[1]).slice()];
}
function fromWorld(sv) { // idempotent
  const W = sv.where, R = sv.rest, home = [1348, 1880];
  if (W && W.mode === 'world') { const [map, at] = fromWorldAt(sv, W.at || home); sv.where = { mode: 'field', map, at, dir: 's' }; }
  if (R && R.mode === 'world') { const [map, at] = fromWorldAt(sv, R.at || home, true); sv.rest = { mode: 'field', map, at }; }
}
```

`oldsave.cjs` runs this rule on the traces. Every case lands on ground she can stand on:
- a save by node1 loads on ember-line-road [50,592], with its rest moved to the warm camp's fire [790,500];
- a save by Dawnroost loads at [645,990];
- a save mid band 2 with the Magpie at Bogmire loads on ember-line-road, and the Magpie moves to warmCamp;
- a band 1 save loads at the cottage, and the Magpie moves to the jetty;
- a band 3 save with the Magpie at Dawnroost loads at the crossroads, and the Magpie moves to northCamp;
- a wake at Bogmire with the Magpie at the warm camp moves her to bogmire.

**`goalOn` (289-303).**
- Delete the world-map fallback (298-302). It would aim at the closed roads, and `keepMagpieNear` makes it unreachable anyway.
- The function ends with `return ex ? exitMark(ex) : null;`.
- Fix the comment at 289-290.
- Delete `magpieOnWorld` and `goalOnWorld` (304-319).

**Lines 322-323:**
```js
function pauseAll() { field.pause(); }
function resumeAll() { if (busy) return; if (mode === 'field') field.resume(); }
```

**Line 345 comment:** "Off the field (a still) only the words play".

**`save()` (372):**
```js
st.where = { mode: 'field', map: field.map && field.map.id, at: [Math.round(field.P.x), Math.round(field.P.y)], dir: field.P.dir }; GS.save(st);
```

**`goField` (375-383).** Drop `world.show(false)`. Add `keepMagpieNear(id);` right after `await field.load(id, at, dir);`, before `music(...)` and `save()`.

**Delete `goWorld` (384-389).**

**`arrive` (391-400): the camps.** Delete `camp()` (553-557); this replaces it:

```js
async function arrive(id) {
  const first = !st.done['visit:' + id]; st.done['visit:' + id] = true;
  const c = Object.keys(LANDINGS).find((k) => LANDINGS[k].scene && LANDINGS[k].field[0] === id);
  if (c && !st.done['camp:' + c]) { // a camp, the first time: its scene, then the offer of a rest (as the world map's camps did)
    st.done['camp:' + c] = true; await scene(LANDINGS[c].scene);
    const fire = (MAPS[id].spots || []).find((x) => x.kind === 'rest'); await rest(fire ? fire.label : MAPS[id].name); save(); return;
  }
  if (!first) return;
  if (id === 'bogmire' && !st.flags.lights) await scene('bogmireDark');
  else if (id === 'dawnroost') await scene('dawnroostHome');
  else if (id === 'frozen-pass') { if (!st.done['camp:frozenCamp']) await scene('frozen'); } // optional: the camp said it already (it doubles today too)
  else if (id === 'misthollow') await scene('misthollow');
  else if (id === 'shipyard') { await scene('shipyard'); st.flags.shipyard = true; }
  save();
}
```

**`onExit` (401-406).** The `stepBack` function (407) doesn't change.

```js
if (ex.to === 'thornwood' && field.map.id === 'wickhollow' && !st.flags.party) { await scene('thornwoodShut'); stepBack(ex); return; }
// a road out of the picture into the wide world (the cottage's three, the crossroads' south and east): the world map is
// only flown now, so she turns back, saying why
if (ex.to === 'world') { await say(!st.flags.party ? [['io', 'Something is wrong up in the square. I should go and see first.']] : S.scenes[ex.say] || S.scenes.roadOut); stepBack(ex); return; }
await goField(ex.to, ex.at, ex.dir);
```

**Delete `enterPlace` (408-413).** Its node branch moves to `onSpot` (after 478):

```js
if (s.kind === 'node') { // an Ember Line node on its road, with the world map's ids (st.done carries over): Sol relights it
  if (st.done[s.id]) return;
  await scene('node'); st.done[s.id] = true;
  const sh = 150 * bandHere(); st.shards += sh; sfx('node-wake'); // 300 in band 2, as before
  await say(['The node’s warmth gives back a little sunstone: ' + sh + ' shards.']); save(); return;
}
```

**`wake` (456-462):**
```js
GS.restore(st); st.herbs = Object.assign({}, preHerbs); fromWorld(st); await goField(st.rest.map, st.rest.at, 's');
```
The safety net runs inside `goField`.

**Other single-line changes:**
- 543: `const bandHere = () => (field.map && field.map.band) || 1;`
- 549: `st.rest = { mode: 'field', map: field.map.id, at: [Math.round(field.P.x), Math.round(field.P.y)] };`

**`board` (569-582).** Line 571's landing list doesn't change. Replace 575-581:

```js
const id = await flyNow(here);
if (id && id !== here) st.magpie = id;
const L = LANDINGS[st.magpie];
await goField(L.field[0], L.field[1], 's'); // a camp's first landing plays its scene and offers a rest (arrive)
save();
```

This also covers fly.js's "Land where we took off" button, which resolves with `id === here`.

**The rest of `start`:**
- 592 (`flyNow`): `field.show(false); mode = 'fly';`
- Delete the dead `flight()` (598-604).
- `battle()`: 653 `const was = mode; field.show(false);`, 667 `if (was === 'field') field.show(true);`, 669 `if (mode === 'field') music(MUSIC[field.map.id] || 'travel');`
- 743 (the Party tab): `(st.magpie && LANDINGS[st.magpie] ? ', at ' + LANDINGS[st.magpie].name : '')`
- 798 (`whereOf`): `const W = sv.where || {}, map = W.mode === 'world' ? fromWorldAt(sv, W.at || [1348, 1880])[0] : W.map; return (MAPS[map] && MAPS[map].name) || 'Wickhollow';`
- 869 (`showTitle`): `field.show(false);`
- 931-938 (`begin`): `K.migrate(st); fromWorld(st);`, and 936 becomes `else { const W = st.where; await goField(W.map, W.at, W.dir); }`. `begin` is the single way in for Continue, Load, pasted save codes, chapters and the demo pages.
- 949-950 (`api`): drop `world`, `goWorld` and `PLACES`. Make it `goField: (id, at, dir) => act(() => goField(id, at, dir))`, and `goal` returns `mode === 'field' && field.map ? goalOn(field.map.id) : null`.
- 954: `window.Game = { start, LANDINGS, CHAPTERS };`

**Unchanged:** `fly.js` (it knows only landing ids, `sky`, `name`, `band` and `need`), `CHAPTERS`, `nextStep`, `wayOut`, the wild fights through `onEncounter` (205), `fights.js`, and `game.html`.

### 3.5 `src/game/script.js`

- **Add three placeholders to `scenes`** (T05 rewrites the words):
  ```js
  roadOut: [['io', 'That road runs on for days, and the night won’t wait. Our way is up through the village.']],
  crossroadsSouth: [['sol', 'That road runs back south, days on foot. The shipyard is up the north road.']],
  crossroadsEast: [['sol', 'The east road climbs into the peaks. Nothing crosses them on foot.']],
  ```
- **Line 214 (the ambush):** change `{ face: 'io', dir: 'n' }` to `{ face: 'io', to: 'halcyon' }`. Io now enters the ring from the west road, around [578,470], while Halcyon stops at [768,430]. The `scenes` test's start at [768,592] still turns her to `'n'`.

### 3.6 `tools/check-maps.mjs` and `tools/trace-overlay.mjs`

- **Lines 10-13 in check-maps and 12-13 in trace-overlay:** load only the files named in `MAPS_EXTRA`, so a mistyped file fails loudly:
  ```js
  for (const f of (process.env.MAPS_EXTRA || '').split(',').filter(Boolean)) require(path.resolve(f));
  ```
- **check-maps, after line 16 (`window` is set there): read game.js.**
  ```js
  let GAME = {}; try { require(path.join(R, 'src/game/game.js')); GAME = globalThis.Game || {}; } catch (e) { console.log('(game.js would not load, so the landings and chapters go unchecked: ' + e.message + ')'); }
  const intoMap = (id) => [
    ...Object.entries(GAME.LANDINGS || {}).filter(([, L]) => L.field && L.field[0] === id).map(([k, L]) => ['the Magpie’s landing ' + k, L.field[1]]),
    ...(GAME.CHAPTERS || []).flatMap((c) => [[c.where, 'start'], [c.rest, 'rest']].filter(([w]) => w && w[0] === id).map(([w, k]) => ['chapter “' + c.name + '” ' + k, w[1]])),
  ];
  ```
- **check-maps, inside the loop after line 61 (before `const open`):**
  ```js
  for (const [what, at] of intoMap(id)) {
    for (const e2 of m.exits || []) if (inExit(e2.rect, at[0], at[1])) probs.push(what + ' at ' + at + ' is inside the exit to ' + e2.to);
    const [c, d] = near(...at); if (!stand(at[0], at[1]) && d > 14) probs.push(what + ' at ' + at + ' (' + Math.round(d) + ' px off the walk)'); else if (!seen[c]) probs.push(what + ' at ' + at + ' (cut off)');
  }
  for (const ex of m.exits || []) if (ex.to !== 'world' && !MAPS[ex.to]) probs.push('exit to ' + ex.to + ': no such map'); // 'world' = a road out she turns back from
  if (m.kind === 'camp' || m.land) {
    if (!(m.spots || []).some((s) => s.kind === 'rest')) probs.push('a camp with no rest');
    if (m.wild) probs.push('random fights in a camp');
    if (!Array.isArray(m.land)) probs.push('a camp with no land');
    else { const [c, d] = near(...m.land); if (d > 14 || !seen[c]) probs.push('its land at ' + m.land + ' is off the ground she can reach');
      if (GAME.LANDINGS && !Object.values(GAME.LANDINGS).some((L) => L.field && L.field[0] === id)) probs.push('a landing ground the Magpie never lands on (game.js LANDINGS)'); }
  }
  if (m.wild && m.wild.band !== m.band) probs.push('band ' + m.wild.band + ' fights on a band ' + m.band + ' map');
  if (!fs.existsSync(path.join(R, m.src))) probs.push('no painting at ' + m.src); // a bad src leaves the field undrawn and Io frozen (field.js 272/290)
  ```
  `stand()` is accepted because Dawnroost's chapter rest [340,447] stands but is 15 px from a full grid cell.
- **Headers (both tools):** list the new rules. The trace-overlay header also gets "camps' land cyan".
- **trace-overlay, optional, after line 52:** draw a circle at `M.land`.

### 3.7 `tools/game-test.mjs`

- **Header (4-33) and defaults (52).**
  - Keep the step name `world`. It now means: Io walks by a tap to the Magpie at the jetty's end, flies to the Warm Roads, and lands at its camp, where she rests.
  - Add `wilds` (16 steps). Update the descriptions of `saves` and `chapters`.
  - The default steps stay `title,new,walk,world,menu,saves,save`.
- **Helpers.** Use tests-tools §12.2 (`tapToward`, `settle`, `walkOut`, `useSpot`), copied from `envoi-final-draft/wilds/page-test.mjs`, and say so in a comment.
- **`world` (181-189).** Use tests-tools §12.3 as written. It needs `__game.LANDINGS` and `__game.flyer`; both are in `api`. If headless flight goes over about 90 s, place the ship near the camp instead (`flyer.state.pos.set(820/12-192+6, 0, 1530/12-128)`).
- **New `wilds` step.** Use tests-tools §12.4 (rows from each gate chapter's state; the arrow must point at the exit on every scene; the fight counter grows on walks and not in camps; the way back from each town).
  - With node1 marked lit before the walk: node2 gives +300 shards, and node1 is hidden, so `useSpot` returns false with the shards unchanged.
  - It takes 3 to 4 minutes and is not a default step.
- **`saves`, after line 461.** Use tests-tools §12.5's pasted world-map save (band 2, level 9, magpie warmCamp, done includes `camp:warmCamp` and `node1`, `where: { mode: 'world', at: [960,1440] }`, `rest: { mode: 'world', at: [820,1560] }`). Under this plan's rule, expect:
  - the map is `ember-line-road`, near its start;
  - `where.mode` is `'field'`;
  - `rest` is `{ mode: 'field', map: 'warm-roads-camp', at: <the fire's at> }`;
  - level 9 and no page errors.

  Then three more cases:
  - **Magpie elsewhere.** Paste a second code with `magpie: 'bogmire'`, `where` at [1000,1450] and the rest at Bogmire's inn. Expect `ember-line-road`, `st.magpie` becoming `'warmCamp'`, and a toast matching `/moored at/`.
  - **The title line.** Write a third world save into `localStorage['envoi.save.v1.3']` with the newest `saved` time, then reload. The title's Continue line must end "The Ember Line road".
- **`chapters`, at 434-436.** Use tests-tools §12.6 (the Magpie's landing is a ground map). The `want` table is unchanged.

### 3.8 `envoi-game-pass-3/map-paths/edits-core.js` and `check-edits.mjs`

- **edits-core.js:**
  - Line 13: `WORLD_IN = {}`. Keep the name and every use. Rewrite the comment at 10-12: nothing comes onto a map from the world map any more.
  - Line 14: add `warmCamp: ['warm-roads-camp', [318, 465]], northCamp: ['northern-camp', [338, 468]], frozenCamp: ['frozen-camp', [306, 482]]`, mirroring `LANDINGS` exactly.
  - Line 24: `placeName` for `'world'` returns `'a road out (the world map is only flown)'`.
  - Line 289: an old world arrival gets a warning and is left out, instead of an error (tests-tools §8 code). `applied()` already matches arrivals by key.
- **check-edits.mjs, line 25:** `GAME = { PLACES: globalThis.Game.PLACES || {}, LANDINGS: globalThis.Game.LANDINGS || {} }`.

### 3.9 Pages and the rest

- **The wilds demo:**
  - `envoi-final-draft/wilds/wilds.html:70`: remove the `maps-wilds.js` script line.
  - `wilds.js:2` and `:19`: the scenes are traced in `src/game/maps.js`.
  - README 38/44/50: the same, plus "rebuild the page whenever maps.js changes".
- **`git rm src/game/maps-wilds.js`.** A stale copy would override the moved entries: check-maps (line 13 today) and the demo both load it after maps.js.
- **`src/walk/on-foot.js:75`:** `note(ex.label + ': a road out of the picture; in the game she turns back here.')`
- **`git rm art/world/night-{00,01,02,10,11,12,20,21,22}.webp`.** Nothing names them after `TILES` goes, and the originals are in `reference/art/world-map/night/`. Keep `far-view.webp` and `night-clouds.webp`.
- **`src/game/story.js`.** `fights` for the walks, at one fight per 770 px of the straight tap-walk:
  - line 44 `warmRoads`: 3 (2,225 px; about 4.7 when lighting the three nodes);
  - line 52 `northernWilds`: 5 (Eldergrove's edge, the cold moor, then the crossroads: 4,086 px);
  - line 61 `frozenPass`: 3 (Frostmere's shore and the frozen pass: 2,043 px);
  - optional, line 36 `thornwood`: 2 (1,492 px). This only corrects the simulator's model of a player.

  Update the comments at lines 7-8. Re-measure on the final `maps.js` with `plan-tmp/walks-tool-draft.mjs`. Optionally keep it as `tools/walks.mjs`: T09's path edits change walk lengths. Then regenerate `src/battle/chain-results.js` with `node tools/chain.mjs --results`.
- **Comments only:**
  - `goal-arrow.js:2-4`: only the ground maps draw the arrow now;
  - `state.js` header: `where` and `rest` are always on a ground map; older saves may hold `mode: 'world'`, which game.js `fromWorld` moves;
  - `songs.js:2`;
  - `src/stage/gloamwood-road.js:3`;
  - `tools/world-mask.mjs:1`: the mask is now only the flight's mini-map;
  - optionally delete `game.css`'s dead `.flight*` rules.

## 4. Checks, in order

1. **Syntax.** Run `node --check` on every changed `.js` file.
2. **Maps.** `node tools/check-maps.mjs` must print 21 ✓ with `maps-wilds.js` gone. That includes the three town arrivals, the scenes' arrivals into the towns, every landing, every chapter start and rest, and the camps' rules. Then a negative test on a `MAPS_EXTRA` copy: misspell a `src`, move `land` off the walk, and point an exit at `'nowhere'`. Each must print ✗ with its message.
3. **Leftovers.** These greps must find nothing:
   - `grep -n "goWorld\|goalOnWorld\|magpieOnWorld\|enterPlace\|World.create\|worldHost\|TILES\|world.show" src/game/game.js`. `mode === 'world'` may appear only in `fromWorld` and `whereOf`.
   - `grep -rn "art/world/night\|maps-wilds" src tools putting-it-all-together envoi-final-draft envoi-game-pass-3 --include=*.js --include=*.mjs --include=*.html`.
4. **Map-editor tools.**
   - `node envoi-game-pass-3/map-paths/check-edits.mjs plan-tmp/doc-elr.json plan-tmp/doc-cold-moor.json`: no crash and no "out of date" line.
   - `plan-tmp/doc-dawnroost-old.json`: a "left out" note, not an error.
   - Commit A, in a worktree: a new block on the cold moor gives "applied cold-moor block", then `check-maps cold-moor` ✓.
5. **Balance and journey.**
   - `node tools/balance.mjs` must still pass 51 of 51.
   - `node tools/chain.mjs` must reach every gate at its level (6, 11, 15 and 20, with every upgrade affordable). Record its medians.
6. **Build size.** `node tools/build.mjs --min putting-it-all-together/game.html`:
   - `stat -c %s dist/game.artifact.html` should be about 14.06 million (±10 KB), under 16,000,000.
   - `grep -c 'night-[0-2][0-2]\.webp'` must give 0.
   - `grep -o '"art/[^"]*"' dist/game.artifact.html | grep -v '"art/\(music\|keepsakes\)/'` must print nothing. This catches a misspelled scene `src`.
   - AVIFs inside: 69 (77 with T01 part B). WebPs: 7.
7. **Game test, default.** `node tools/game-test.mjs --size 915x412`, defaults. Expect:
   - `world` lands at `warm-roads-camp`, with `camp:warmCamp` done, the rest there, and "The Magpie" in reach;
   - `saves` logs the world-map saves loading on the ember-line-road;
   - the run ends "game test passed".
8. **More game steps:**
   - `--steps title,new,wilds` at 915x412 and at 1366x768;
   - `--steps title,new,chapters,scenes,keepsakes,songs`. The ambush shot should show Io facing Halcyon.
9. **The offline file.** `node tools/build.mjs --min --offline putting-it-all-together/game.html` should give about 17.67 million bytes, under 30 MB. Then `node tools/game-test.mjs --offline`, and `--offline --steps title,new,wilds`.
10. **Chapter demos.** `node tools/make-demos.mjs`, then `node tools/game-test.mjs dist/demo-gate-15.html --steps title`.
11. **Map editor.** `node tools/build.mjs envoi-final-draft/map-editor/map-editor.html` should give about 7.6 million bytes. Then `node envoi-final-draft/map-editor/page-test.mjs`.
12. **Wilds demo.** `node tools/build.mjs envoi-final-draft/wilds/wilds.html`, then its `page-test.mjs` at both sizes.
13. **For Chris on his phone (915 × 412):**
    - fly to each camp: its scene, the rest prompt, then the Magpie's glow;
    - walk each row to its town, with fights on the walks and none in the camps;
    - light the three nodes: each goes dark;
    - try each closed road;
    - skip the camp's rest and lose a fight on the Ember Line road. The party should wake at the last rest, with a toast saying where the Magpie is moored, and she should be there.

## 5. Publishing and records

- **Publish.**
  - The game: `dist/game.artifact.html` plus every file in `game.beside.json`, to https://claude.ai/artifact/BgSiyXBu53iW7DJVF1seV8.
  - The map editor: run Artifact `read` on https://claude.ai/artifact/M3PokTZsXbbxbx2BSDSrC5 first, then publish without `capabilities`, which keeps its `edits` and `places` collections.
  - The wilds demo: republish to its link only if the traces changed after Chris walked it.
  - Send Chris `dist/game.html` from the offline build (T14).
- **Records (commit C).** tests-tools §13 has the list. In short:
  - `docs/design-decisions.md`: a new section "the wilderness scenes in the game", with:
    - Chris's okay in his words;
    - the camps as landings and the town roads into the scenes;
    - the five closed roads;
    - the world map only flown, and its tiles gone;
    - how old saves load and the Magpie safety net;
    - the measured fights and `chain.mjs`'s medians;
    - the sizes.

    Add pointers from Phase 4's lines 852, 859, 862 and 866, and fix line 1036.
  - `docs/still-to-come.md` (2), in plain words for Chris.
  - `docs/next-session.md`, `putting-it-all-together/README.md` (lines 15-17, 26, 77, 85, 98, and the pages table), `docs/art-requests/12-wilderness-scenes.md` (lines 3 and 33: the Magpie is a glow until Chris chooses).
  - `handoff/tasks.md`:
    - T02 done;
    - T09 unblocked, with apply-edits now taking one-line lists;
    - T13's real figures and the Gloamwood road lever;
    - T15's 16 steps and the world step's flight time;
    - T05's 31 scenes.
  - The map editor README (21 maps, its new size).
  - The wilds demo README.
  - The final-draft and pass-three READMEs.

## 6. Questions for Chris (each has a default; with a plain "okay" the hub goes ahead on the defaults)

1. **The five roads out** (the cottage's south road, west footbridge and east forest path, and the crossroads' south and east roads) all opened the world map. **Default: close them.** Io says a line and turns back.
   - No band's way uses them: band 1 is Wickhollow, the Thornwood, then Bogmire; band 3 comes into the crossroads from the west and goes north.
   - The east road would walk her into band 4 before the moon-sail.
   - The lines are placeholders for the words job.
2. **How often fights come on the new walks.** **Default: as in the Thornwood**, about every 770 map px. Walking straight through, that is about 3 fights in band 2 (about 5 when lighting the nodes), 5 in band 3 and 3 in band 4, against about 5, 6 and 5 on the world map. The party makes up the difference walking back and forth before Dawnroost, Halcyon and the finale, so the journey's total stays about the same. The alternative is busier walks that keep the old counts.
3. **The Magpie at a camp.** **Default for this round: a soft blue glow** on the empty landing ground, as at the four docks today. The alternative is his own 3D Magpie (the one he flies), drawn standing on the landing ground (page-art's option b, about 25 KB). That would be shown first on the wilds demo with a glow/ship switch, and later at the docks if he likes it. Art request 12 told him "the game draws the Magpie", so ask.
4. **The Ember Line nodes.** **Default: as on the world map.** The golden arrow only leads where the story goes, and a node Sol has relit goes dark. The alternatives are:
   - the arrow visits the dark nodes, in the road's order (node2, then node1, then node3);
   - a relit node keeps a warm glow.

Not questions, just tell him:
- the wilds song plays on all eight scenes, as over the world map's camps today;
- the Gate 15 chapter still starts on the crossroads' south road;
- Io faces into Dawnroost, the crossroads and the frozen pass as she arrives, as today. Facing the way she walked on every map is an idea for later.

## 7. Risks

- **Stranded party.** Without `keepMagpieNear` in `goField`, a lost fight after declining a camp's rest, or an old save, can leave the party in a different walking area from the Magpie. It is required.
- **Page size.** The scenes, the `TILES` removal and the `World.create` removal must be in the same commit (16,747,931 bytes otherwise).
- **Old saves.** `fromWorld` must run in `begin()` before `goField`. If it doesn't, Continue calls a `goWorld` that no longer exists, a world rest breaks `wake`, and `whereOf` names a place Continue no longer opens.
- **Tools.** check-edits, the default `world` test and the wilds demo build all break unless they change in the same commit.
- **Traces still moving.** The landing points (land + [0,40]), the three ports, `MAGPIE_IN` and the walk measurements must be re-derived from the final `maps.js`. check-maps' new landing rule catches a point that can't be stood on.
- **field.js:267.** The threshold change also changes fight spacing in the Thornwood and the demo. That is intended, but say so.
- **Headless flight.** The `world` test's real flight takes about 1 to 2 minutes under SwiftShader. Use timeouts of 120 to 300 s, or place the ship near the camp.
- **The map editor.** With `WORLD_IN = {}`, eight old maps get new fingerprints. Any unsent editor work Chris has in his browser for them will show "Made on an older tracing". Nothing is pending today.
- **The words job.** T05 and `script.js`: land this before the words job goes out, or after it returns.

## 8. After step 2 (not part of it)

- The 3D Magpie demo, if Chris says yes to question 3.
- The Gloamwood road painting out of the page (about 410 KB), once fights.js's default scene changes (T01/T13).
- Facing the way she walked on every map (an idea).
- Keeping `tools/walks.mjs` for T09's path edits.
- The side paths' ends on the new scenes, as places for things to find later (I02, I13).