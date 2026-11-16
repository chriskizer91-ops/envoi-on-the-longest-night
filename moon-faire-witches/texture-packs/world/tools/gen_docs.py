# gen_docs.py: writes aethermoor/prompts.json and aethermoor/inventory.md from one list, so the boxes match build.py.
# usage: python3 -I gen_docs.py
import json, os, re
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'aethermoor') + '/'
src = open(os.path.join(HERE, 'build.py')).read()
ns = {}
exec(re.search(r'^TEX = \{.*?^\}', src, re.S | re.M).group(0), ns)
exec(re.search(r'^PROPS = \{.*?^\}', src, re.S | re.M).group(0), ns)
exec(re.search(r'^EXTRA = \{.*?^\}', src, re.S | re.M).group(0), ns)
TEX, PROPS, EXTRA = ns['TEX'], ns['PROPS'], ns['EXTRA']
TEX['lake_ice'] = TEX['mountain_lake']

def pbox(k):
    (x, y), r = PROPS[k]
    return (max(0, x - r), max(0, y - round(r * 0.75)), min(4608, x + r), min(3072, y + round(r * 0.75)))

# the terrain kinds: id, kind, title, what it is (plain words), where on the map it covers, shape, subject, use
T = [
 ('pine_forest', 'ground', 'Pine forest from above',
  'Dense pine and fir forest seen from above: pointed dark crowns packed close.',
  'Most of the land in the west and north: the Gloamwood round Wickhollow, the northwest coast, the northern passage, the foothills of the peaks.',
  'Subject: a dense pine and fir forest seen from high above, as from a flying ship a few hundred metres up. The square shows about 300 m of forest. Many pointed, star-shaped crowns, each 6 to 10 m across, packed close together, with thin black shadow between them; a few crowns a little lighter than the rest, spread evenly. No clearings, no paths, no rocks, no houses. Midnight under a bright moon: deep blue-green crowns with cool silver on their tips.',
  'The forest that covers most of the west and north of the continent, seen from the airship.'),
 ('broadleaf_forest', 'ground', 'Leafy woodland from above',
  'Woodland of round, leafy trees (oak and beech kind) seen from above, with a few pines among them.',
  'The Verdant Wilds in the west middle (round Dawnroost and the Warm Roads), and patches through the Gloamwood.',
  'Subject: a woodland of broad leafy trees, oak and beech kind, seen from high above. The square shows about 300 m of woodland. Rounded, billowing crowns 10 to 15 m across in deep green and olive, crowding each other, a few dark pointed pines among them, dark shadow in the gaps between crowns. No clearings, no paths, no houses. Midnight under a bright moon, cool light on the tops of the crowns.',
  'The leafy woods of the Verdant Wilds, seen from the airship.'),
 ('willow_marsh', 'ground', 'Willow marsh from above',
  'The fen: narrow winding channels of dark water among reed beds, willow clumps and small pines.',
  'The Gloomfen in the south middle, from Bogmire east past the Sunken Ruins to Willowmurk.',
  'Subject: a willow marsh seen from high above. The square shows about 300 m of fen. Narrow winding channels and pools of still dark water between low islands of reeds and rushes, clumps of weeping willow with drooping fronds, a few small dark pines and bare dead trees, patches of lily pads on the water. No boardwalks, no huts, no paths. Midnight: dark navy water, olive and muted yellow-green reeds and willows under cool moonlight.',
  'The Gloomfen round Bogmire and Willowmurk, seen from the airship.'),
 ('grassland', 'ground', 'Open grassland from above',
  'Open meadow and pasture: short grass with a few stones and low bushes.',
  'Clearings and the open ground round towns in the west and north: round Dawnroost, the northern passage, the crossroads.',
  'Subject: open rolling grassland seen from high above. The square shows about 400 m of meadow. Short grass in cool greens with gentle lighter and darker patches like the folds of the ground, small grey stones and a few low round bushes scattered evenly. No trees, no paths, no fields, no houses. Midnight under a bright moon: muted blue-green grass.',
  'The open meadows between the woods, seen from the airship.'),
 ('farmland', 'ground', 'Farm fields from above',
  'A patchwork of small fields in different crops, split by hedgerows.',
  'Round Wickhollow (south of it, about x 950 to 1350, y 1900 to 2080), round Dawnroost and the big town north of the Warm Roads, and the fields of the northern passage.',
  'Subject: a patchwork of farm fields seen from high above. The square shows about 400 m of farmland. Small rectangular fields 40 to 80 m long, set at slightly different angles: ripe grain in muted gold with fine furrow lines, rows of green crops, one or two blue-grey fields of flax. Thin dark hedgerows between them with a few single round trees along the hedges. No houses, no roads, no rivers. Midnight under a bright moon, so the gold is muted and cool.',
  'The farm country round the towns, seen from the airship.'),
 ('beach_sand', 'ground', 'Sand beach from above',
  'Pale sand above the waterline, with pebbles and a few tufts of beach grass.',
  'The coves of the west coast, the bays of the north, and the east coast below the desert.',
  'Subject: a pale sand beach seen from high above, above the waterline. The square shows about 150 m of beach. Fine pale sand with faint wind ripples, small dark pebbles and a few tufts of beach grass scattered evenly. No water, no wave edge, no driftwood, no rocks bigger than pebbles. Midnight: the sand is pale grey-gold under the moon.',
  'Beaches along the coasts, seen from the airship.'),
 ('desert_ground', 'ground', 'Desert plain from above',
  'Dry, open desert ground with small scrub bushes and stones.',
  'The east (the Sunscorch Wastes), about x 3100 to 4300, y 1250 to 2400: under mist all game, but the land is there.',
  'Subject: a dry desert plain seen from high above. The square shows about 400 m of desert. Hard dusty earth (warm ochre by day, muted cool grey-brown under the moon), small dark scrub bushes and stones scattered evenly, faint wind streaks. No roads, no rock towers, no cliffs. Midnight under a bright moon.',
  'The eastern desert, seen from the airship from the edge of the mist.'),
 ('sandstone_mesa', 'ground', 'Sandstone plateau from above',
  'Broken plateau tops of layered red sandstone, with short cliff steps and scree.',
  'The canyon country of the east and southeast: the tops of the plateaus and mesas.',
  'Subject: the top of a broken sandstone plateau seen from high above. The square shows about 300 m of rock. Flat rocky ledges and short cliff steps in layered red-brown sandstone, cracks and small piles of scree, a few dry shrubs in the gaps. Midnight: the red is dusky grey-mauve under the moon. No paths, no ruins.',
  'The tops of the canyon plateaus in the east, seen from the airship.'),
 ('bare_rock', 'ground', 'Bare mountain rock from above',
  'Steep grey mountain rock: angular slabs, cracks and scree, no snow.',
  'The mountain flanks of the east (the Ironspire Peaks below the snow line), the sea stacks and rocky islands.',
  'Subject: steep bare mountain rock seen from high above. The square shows about 300 m of mountainside. Grey stone in rough angular slabs and ribs, deep cracks, fans of scree, a few small patches of moss and dwarf pine in sheltered spots. No snow, no paths. Midnight under a bright moon: cool grey stone with silver on the edges.',
  'The rocky mountainsides below the snow, seen from the airship.'),
 ('snowy_mountainside', 'ground', 'Snowy mountainside from above',
  'High mountain slope half under snow: dark rock ribs and boulders with drifts between them.',
  'The northwest snow island (x 0 to 700, y 0 to 250), the northern peaks round Peak\'s Veil (x 2700 to 3300, y 150 to 650), the northeast peaks (x 3500 to 4300, y 0 to 200) and the tops of the Ironspire Peaks.',
  'Subject: a high mountain slope half under snow, seen from high above. The square shows about 300 m of mountainside. Dark grey rock ribs and boulders, with drifts and long streaks of snow lying between them. Midnight under a bright moon: snow pale silver-blue, rock dark blue-grey.',
  'The snowy peaks of the north, seen from the airship.'),
 ('snowfield', 'ground', 'Snowfield from above',
  'Deep snow in the high basins (glacier and snowfield): smooth drifts with a few rocks showing.',
  'The high basins and valleys between the northern peaks (the white fields round x 2850 to 3150, y 300 to 450).',
  'Subject: deep snow on a high snowfield, seen from high above. The square shows about 300 m of snow. Smooth wind-carved drifts with soft shading, faint long lines like hidden crevasses, a few small dark rocks poking through, spread evenly. Midnight under a bright moon: silver-blue snow.',
  'The snowfields and glaciers between the northern peaks, seen from the airship.'),
 ('town_roofs', 'ground', 'Town rooftops from above',
  'A town\'s rooftops from straight above: crowded red-tile and slate roofs with narrow lanes between.',
  'Every town: Wickhollow, Dawnroost, the shipyard, Misthollow, Bogmire (wooden roofs there), Hearthstone Keep.',
  'Subject: the rooftops of a small old town seen from straight above. The square shows about 150 m of town. Crowded steep roofs of dark red clay tiles and grey slate, each house 8 to 12 m across, ridges at different angles, a few chimneys, narrow dark lanes between the houses. No square, no tower, no walls. Midnight: the roofs are muted red and blue-grey under the moon; no lit windows (the game adds the window lights).',
  'The ground under the town models, or far-off towns seen from high up.'),
 ('deep_sea', 'material', 'Deep sea from above',
  'Open ocean: dark navy water with long swells and small silver ripples.',
  'The ring of open ocean round the continent and the inland sea in the middle (round Hearthstone Keep).',
  'Subject: open deep sea seen from high above. The square shows about 600 m of ocean. Dark desaturated navy and slate water, long low swells, many small subdued silver ripples, a few thin white wave crests spread evenly. No foam lines along a shore, no rocks, no boats. Midnight under a bright moon.',
  'The open sea all round the continent, seen from the airship.'),
 ('shallow_sea', 'material', 'Shallow coastal water from above',
  'Shallow water near the coast, dark blue-green with submerged stones showing through.',
  'The band of shallows 50 to 150 m wide (5 to 15 atlas px) round every coast and island, between the beach or cliff and the deep sea.',
  'Subject: shallow coastal water over a rocky bottom, seen from high above. The square shows about 150 m of water. Dark blue-green water, rounded submerged stones and weed seen faintly through it, a few thin pale ripple lines. No foam, no shore, no rocks above the water. Midnight under a bright moon: not bright turquoise.',
  'The shallows round the coasts and islands, between the shore and the deep sea.'),
 ('river_water', 'material', 'River water from above',
  'A river\'s surface: dark blue water with streaks of current and small silver ripples.',
  'The rivers of the west (round Wickhollow and the Thornwood), the north and the eastern mountains, and the fen channels.',
  'Subject: the surface of a river seen from straight above, the water flowing from left to right. The square shows about 50 m of water. Dark blue water with long streaks of current running left to right, small silver ripples and a few pale flecks of foam. No banks, no rocks, no reeds. Midnight under a bright moon.',
  'The rivers, laid along their courses so the streaks follow the flow.'),
 ('mountain_lake', 'material', 'Mountain lake from above',
  'Still, deep mountain lake water: very dark blue, faint silver ripples.',
  'Frostmere Lake (about x 3240 to 3340, y 740 to 830) and the small pools of the eastern mountains.',
  'Subject: the still surface of a deep mountain lake seen from high above. The square shows about 150 m of water. Very dark clear blue water, faint silver ripples in soft bands, nothing else. Midnight under a bright moon.',
  'Frostmere Lake and the mountain pools, when they are open water.'),
 ('lake_ice', 'material', 'Frozen lake from above',
  'A frozen lake: pale silver-blue ice with swirls of snow and long cracks. (Not painted on the map: Frostmere Lake is painted open.)',
  'Frostmere Lake, if the 3D north shows it frozen; any lake in the north.',
  'Subject: a frozen mountain lake seen from high above. The square shows about 150 m of ice. Thick pale silver-blue ice, a thin dusting of snow in soft swirled patches, long hairline cracks and a few darker patches of clear black ice, all spread evenly. Midnight under a bright moon.',
  'Frostmere Lake frozen, for the game\'s frosty north.'),
 ('coastal_cliff', 'material', 'Sea cliff face',
  'The face of a tall grey sea cliff: vertical sheets and columns of rock with cracks and mossy ledges.',
  'The west coast, the south coast below the fen, round the sea stacks; also any steep slope in the height map.',
  'Subject: the face of a tall grey sea cliff, seen straight on. Vertical sheets and columns of grey rock with deep cracks, a few narrow ledges with tufts of moss and grass. The picture\'s top edge is the cliff top and its bottom edge is the cliff\'s foot: about 60 m of cliff, 60 m high. Midnight: cool blue-grey stone under the moon.',
  'The steep sides of the land: sea cliffs and the steepest mountain faces.'),
]
P = [
 ('pine_tree', 'Tall (2:3)', 'One pine tree',
  'One tall pine or fir like the map\'s pines: dark green tiers of branches.',
  'Subject: one tall pine tree as the map paints them, seen from the side, whole. About 20 m tall, a narrow pointed shape of layered dark green branches, a short brown trunk at the bottom. Midnight colours: deep blue-green with cool silver on the branch tips.',
  'Scattered single pines, and pines standing up out of the forest near the ground.'),
 ('broadleaf_tree', 'Square', 'One leafy tree',
  'One round leafy tree like the map\'s oaks.',
  'Subject: one broad leafy tree, oak kind, as the map paints them, seen from the side, whole. About 15 m tall with a big rounded crown of clumped leaves in deep green and olive, a short thick trunk. Midnight colours under the moon.',
  'Single trees in fields and meadows, and trees at the edges of woods.'),
 ('willow_tree', 'Square', 'One weeping willow',
  'One weeping willow from the fen, its fronds hanging down.',
  'Subject: one weeping willow from the marsh, seen from the side, whole. About 12 m tall, a rounded crown of long drooping fronds in olive and yellow-green hanging nearly to the ground, a short gnarled trunk. Midnight colours under the moon.',
  'The willows of the Gloomfen.'),
 ('dead_tree', 'Tall (2:3)', 'One dead fen tree',
  'One bare dead tree from the fen: grey twisting branches, no leaves.',
  'Subject: one bare dead tree from the marsh, seen from the side, whole. About 12 m tall, a grey weathered trunk splitting into twisting leafless branches, a little hanging moss. Midnight colours under the moon.',
  'The dead trees standing in the Gloomfen\'s water.'),
]

# the props: id, what it is, where (plain words), band / status
PR = [
 ('wickhollow', "Wickhollow (stop 1): Io's village on a river mouth, a church tower and red-roofed houses. The ship docks at 1446, 1806.", 'Band 1. Centre 1348, 1838.'),
 ('bogmire', 'Bogmire (stop 2): the stilt town of the fen, wooden houses on posts and plank walks, a tall wooden tower. The ship docks at 1886, 2462.', 'Band 1. Centre 1752, 2512.'),
 ('dawnroost', "Dawnroost (stop 3; Thornhollow on the D&D map): a walled stone town with red roofs on a meadow. The ship docks at 1365, 1085.", 'Band 2. Centre 1325, 1098.'),
 ('shipyard', 'The shipyard (no name on the D&D map): a stone harbour castle on the north coast at the end of the long arched bridge. The ship docks at 2097, 580.', 'Band 3. Centre 2097, 599.'),
 ('misthollow', 'Misthollow (stop 4; Ironhold on the D&D map): a grey stone mountain town among the peaks, above Frostmere Lake.', 'Band 4. Centre 3500, 735.'),
 ('camp_warm_roads', "The Warm Roads camp: the Magpie's landing ground in the woods (no building painted there).", 'Band 2. Lands at 820, 1530.'),
 ('camp_northern_wilds', "The northern wilds camp: the Magpie's landing ground in the forest (no building painted there).", 'Band 3. Lands at 1150, 590.'),
 ('camp_northeast_peaks', "The northeast peaks camp: the Magpie's landing ground on the coast below the peaks (no building painted there).", 'Band 4. Lands at 2760, 1090.'),
 ('northern_crossroads', 'The northern crossroads: a walking scene; on the map, a cliff-top meadow above the strait.', 'Band 3. At 1960, 820.'),
 ('frozen_pass', 'The frozen pass: a walking scene; on the map, a mountain slope.', 'Band 4. At 3270, 980.'),
 ('thornwood', 'The Thornwood: a walking scene between Wickhollow and Bogmire; on the map, woods with a path and a house.', 'Band 1. At 1530, 2160.'),
 ('rotbridge', 'Rotbridge: the arched stone and plank crossing in the fen, with a gatehouse.', 'Band 1. At 2050, 2424.'),
 ('willowmurk', 'Willowmurk: a small stilt village deep in the fen, joined by boardwalks.', 'Under mist all game (just east of band 1\'s edge, by world.js). At 2898, 2588.'),
 ('sunken_ruins', 'The Sunken Ruins (Misthollow Ruins on the D&D map): pale flooded stone arches and walls in the fen.', 'Band 1. At 2560, 2508.'),
 ('mosswatch_tower', 'Mosswatch Tower: a lone red-brown stone tower on a wooded headland.', 'Band 1. At 1138, 2318.'),
 ('eldergrove', 'Eldergrove: a small village among big trees.', 'Band 3. At 990, 728.'),
 ('fawnrest_shrine', 'Fawnrest Shrine: a grey stone shrine with towers in a clearing.', 'Band 2. At 1525, 905.'),
 ('frostmere_lake', 'Frostmere Lake: a small mountain lake below Misthollow, with a river and falls running out of it (painted open, not frozen).', 'Band 4. Lake about 3240 to 3340, 740 to 830; the D&D label is at 3392, 806.'),
 ('peaks_veil', "Peak's Veil: a monastery tower on a ridge by the northern peaks.", 'Band 4. At 2914, 212.'),
 ('stormwatch', 'Stormwatch: a walled outpost town on the northeast coast below the peaks.', 'Band 4. At 3790, 538.'),
 ('hearthstone_keep', 'Hearthstone Keep: the capital, a towered castle on its own island in the inland sea, with docks.', 'Under mist all game. At 2340, 1240.'),
 ('dusthaven', 'Dusthaven: a domed stone building in a dry canyon.', 'Under mist all game. At 3525, 1588.'),
 ('sandspire', 'Sandspire: a desert town with two tall slender towers.', 'Under mist all game. At 4050, 1822.'),
 ('miragewell', 'Miragewell: a village round a spring with tall trees and palms.', 'Under mist all game. At 3560, 2108.'),
 ('scorchgate_ruins', 'The Scorchgate Ruins: broken stone ruins in the desert.', 'Under mist all game. At 3300, 2262.'),
 ('stone_bridge', 'The long arched stone bridge over the northern strait, to the shipyard.', 'Band 3. About 1850 to 2020, 545 to 600.'),
 ('waterfall', 'A waterfall: white water falling down a cliff (there are many: below Frostmere, the north coast, south of Wickhollow).', 'Band 4. This one at 3380, 1050.'),
 ('sea_stack', 'A sea stack: a tall rock island with moss and surf at its foot (dozens round every coast).', 'Band 1. This one at 200, 2500.'),
 ('boardwalk', 'The fen boardwalks: plank walks on posts over the water, joining Bogmire, Rotbridge and Willowmurk.', 'Band 1 (the eastern end, at Willowmurk, is under mist). This stretch at 2300, 2430.'),
 ('harbour_docks', "Harbour docks: wooden piers on posts (Hearthstone Keep's docks shown; smaller ones at the towns).", 'Under mist. At 2400, 1420.'),
 ('road_track', 'Roads and paths: thin pale earth tracks joining the towns (a ribbon laid on the land, not a texture square).', 'Everywhere. This one at 3650, 1500.'),
]
L = [
 ('town_windows', 'light', 'Warm amber window lights in the houses of the towns (only some windows lit, small and rectangular).'),
 ('harbour_lanterns', 'light', 'Small lantern lights at the docks and gates of Hearthstone Keep and the harbour towns; nothing else on the map gives light.'),
]

prompts = []
for (k, kind, title, what, where, subject, use) in T:
    prompts.append({'id': k, 'file': k + '.png', 'shape': 'Square', 'rules': kind,
                    'refs': ['aethermoor/' + k + '.jpg', 'aethermoor/' + k + '-day.jpg', 'aethermoor.png'],
                    'title': title, 'subject': subject, 'use': use, 'shared': False})
for (k, shape, title, what, subject, use) in P:
    prompts.append({'id': k, 'file': k + '.png', 'shape': shape, 'rules': 'plant',
                    'refs': ['aethermoor/' + k + '.jpg', 'aethermoor/' + k + '-day.jpg', 'aethermoor.png'],
                    'title': title, 'subject': subject, 'use': use, 'shared': False})
json.dump(prompts, open(OUT + 'prompts.json', 'w'), indent=2, ensure_ascii=False)

b = lambda t: ', '.join(str(v) for v in t)
md = ['# Aethermoor from the air: the world map\'s texture pack', '',
 'The continent the party flies over in the Magpie. The painting is the game\'s night atlas '
 '(`reference/art/world-map/night/Aethermoor-Natural-Night-Atlas.webp`, 4608 x 3072, north up); every box below is in its pixels. '
 'The day atlas (`reference/art/world-map/day/Aethermoor-Nine-Region-Atlas.webp`) has the same size and lines up with it, so each '
 'row\'s refs come in pairs: `refs/<id>.jpg` by night (the game\'s look) and `refs/<id>-day.jpg` by day (to read what the terrain is). '
 'The stand-ins are cut from the night atlas only, from the box in the table; each ref crop is that box with a margin round it.', '',
 'In 3D this is a land kilometres across, not one place: a height map coloured by these terrain kinds. Each terrain row is one kind, '
 'with where on the map it covers. A suggested scale: **1 atlas pixel = 10 m**, so the continent is about 46 km by 31 km '
 '(the flight today uses 12 pixels a metre, so the whole map is 384 m: a toy-sized map). The painting draws trees and houses '
 'about ten times too big for that scale (a pine crown is 10 to 20 pixels), so the stand-ins show fewer, bigger crowns than the '
 'prompts ask for; the prompts give real sizes, so the textures read right from a ship a few hundred metres up.', '',
 'Not in the painting: moor or heath (the north is forest, meadow and fields), lake ice (Frostmere Lake is painted open; '
 '`lake_ice` is made from the open lake\'s stand-in recoloured, and only its prompt is real), coast surf (the white water round '
 'rocks is best done by the builder as foam along the shoreline). No sky is painted: the map is seen from above.', '',
 '## Terrain and surfaces', '',
 '| id | kind | what it is, in plain words | where in the painting (x0, y0, x1, y1) | shared? |', '|---|---|---|---|---|']
for (k, kind, title, what, where, subject, use) in T:
    md.append(f'| {k} | {kind} | {what} Covers: {where} | {b(TEX[k][0])} | no |')
for (k, shape, title, what, subject, use) in P:
    md.append(f'| {k} | plant | {what} | {b(EXTRA[k])} | no |')
for (k, kind, what) in L:
    md.append(f'| {k} | {kind} | {what} | {b(EXTRA[k])} | no |')
md.append('| night_sky | sky | None painted (the map is seen from straight above). The flight today uses its own drifting clouds and a dark violet fog (#0b0820); a 3D far backdrop needs a moonlit night sky from elsewhere, moon high in the upper left. | none | no |')
md += ['', '## Props: the towns and landmarks, and where each is on the map', '',
 'Each is a 3D model to build (no prompt here); its refs are `refs/<id>.jpg` and `refs/<id>-day.jpg`. "Band" is the part of the map the ship '
 'can reach (`src/game/world.js`): band 1 the southwest and the fen, 2 the western forests, 3 the northwest and the northern passage, '
 '4 the northeast peaks; "under mist" is never reachable but is still land under the mist. Positions are the D&D map\'s '
 '(`reference/demos/the-magpie-over-aethermoor.html`) and the game\'s landings (`src/game/game.js`).', '',
 '| id | kind | what it is, in plain words | where in the painting (x0, y0, x1, y1) | shared? |', '|---|---|---|---|---|']
for (k, what, where) in PR:
    md.append(f'| {k} | prop | {what} {where} | {b(pbox(k))} | no |')
open(OUT + 'inventory.md', 'w').write('\n'.join(md) + '\n')
print(len(T), 'terrain,', len(P), 'plants,', len(L), 'lights,', len(PR), 'props;', len(prompts), 'prompts')
