# places.py: everything in the four southern wild paintings that a 3D build needs, one row each.
# A row with 'stand' gets a stand-in texture; a row with 'prompt' gets a ChatGPT prompt and a reference crop; a 'prop' or
# 'sky' row gets a reference crop. Rows whose texture is made in another place only point there ('made').
ART = '/home/claude/envoi-game/reference/art'
WILDS = ART + '/walk/wilds/'
WARM_ROAD_FIGHT = ART + '/backdrops/battle-warm-road.png'
ELDER_FIGHT = ART + '/battle-backgrounds/02-woodland-eldergrove-first-age-clearing.png'

NIGHT = 'Night colours: moonlight in silver-blue and lavender, deep violet shadows'

def R(id, kind, what, box, **kw):
    d = dict(id=id, kind=kind, what=what, box=box); d.update(kw); return d

def P(shape, title, subject, use):
    return dict(shape=shape, title=title, subject=subject, use=use)

PLACES = {}

# ---------------------------------------------------------------------------------------------------------------------
PLACES['warm-roads-camp'] = dict(
  painting=WILDS + 'walk-warm-roads-camp.png', name='The Warm Roads camp',
  note=("The camp on the Warm Roads where the airship lands, on a heather moor at night. A roped landing ground of worn grass "
        "on the west; in the middle, a round stone hut with a turf roof, two canvas tents, chests and stumps round a cooking "
        "fire; the old Warm Road (flagstones with glowing amber seams) running east; dirt paths north to a lookout and south "
        "over a stream on a slab bridge. Everything else is heather, gorse, boulders, birches and low dry-stone walls."),
  rows=[
    R('shared_grass_meadow', 'ground', 'The landing ground inside the ropes: worn, dry grass with bare earth showing and small dark tufts',
      (120, 320, 570, 530), shared='yes, made here', stand=dict(box=(190, 375, 490, 495), squash=1.4),
      prompt=P('Square', 'Worn meadow grass',
        'Subject: worn, short meadow grass on firm ground, about 3 m across, as on the camp\'s landing ground. Dry olive and '
        'straw-coloured grass, thin in places so warm brown earth shows through in soft irregular patches, a few small darker '
        'tufts and a scattering of tiny pale flowers, all spread evenly. ' + NIGHT + '.',
        'The grass ground of open meadows and clearings: the landing ground, the camp, any open grassy patch.')),
    R('shared_dirt_track', 'ground', 'Packed earth paths with small rounded pebbles: the camp floor round the fire, the north path to the lookout and the south path to the bridge',
      (760, 610, 960, 1024), shared='yes, made in eldergrove-edge'),
    R('shared_warm_road', 'ground', 'The old Warm Road: big rounded lavender-grey flagstones with amber light glowing in the seams',
      (680, 405, 1536, 625), shared='yes (new shared id), made here', stand=dict(box=(770, 530, 1000, 598), squash=1.4), ref=(740, 470, 1100, 630),
      prompt=P('Square', 'The Warm Road',
        'Subject: an old paved road of big flat flagstones, about 3 m across. Rounded, slightly irregular stones in '
        'lavender-grey and soft violet, worn smooth, with lighter moonlit tops and a little moss at the edges, laid close '
        'in rough rows. In the narrow seams between them glows a thin warm amber-orange light, like embers, spread evenly '
        'along every seam. ' + NIGHT + '.',
        'The Warm Road, everywhere it runs (the camp, the Ember Line road, the Warm Road fights).')),
    R('wilds_heath_ground', 'ground', 'The heather moor off the paths: a low carpet of purple heather, gorse, dark grass and tiny white flowers',
      (0, 560, 760, 1024), shared='in this group, made in ember-line-road'),
    R('shared_drystone', 'material', 'The low dry-stone walls (round the camp, along the road, north of the road), with square stone pillars at their ends',
      (1085, 270, 1310, 365), shared='yes, made in ember-line-road'),
    R('shared_stone_wall_rough', 'material', 'The round hut\'s wall: rough grey stones in mortar, with moss',
      (655, 205, 860, 320), shared='yes, listed only (a town painting shows it better)'),
    R('camp_tent_canvas', 'material', 'The off-white canvas of the two tents, a little stained and creased',
      (600, 335, 945, 455), shared='no', stand=dict(box=(866, 362, 912, 398), squash=1.0), ref=(820, 335, 945, 445),
      prompt=P('Square', 'Tent canvas',
        'Subject: plain heavy canvas cloth, as on the camp\'s two little A-frame tents, about 1 m across. Off-white and pale '
        'cream, a little weathered, with faint water stains, soft creases and a coarse woven grain. Only the cloth. Seen at '
        'night, lit softly by a campfire nearby.',
        'The cloth of the tents in the camp (and any other canvas: awnings, covers).')),
    R('shared_bark_birch', 'material', 'Birch bark: white with black marks and dark rings, on the slim birches round the moor',
      (1440, 100, 1480, 330), shared='yes (new shared id), made here', stand=dict(box=(1462, 160, 1466, 198), squash=1.0, mirror='stretch'), ref=(1430, 90, 1500, 300),
      prompt=P('Square', 'Birch bark',
        'Subject: the bark of a silver birch trunk, seen flat, about 40 cm across. Chalky white bark with short black '
        'horizontal marks and thin dark rings, a few grey cracks and small darker patches, the grain running top to bottom. '
        + NIGHT + ', so the white is a soft cool grey-white.',
        'The trunks and branches of all the birch trees.')),
    R('wilds_birch_leaves', 'material', 'Birch crowns', (1370, 40, 1536, 150), shared='in this group, made in ember-line-road'),
    R('wilds_boulder_stone', 'material', 'The mossy grey boulders all over the moor',
      (1170, 320, 1280, 450), shared='in this group, made in ember-line-road'),
    R('shared_water_river', 'material', 'The stream along the bottom: dark blue water with silver glints',
      (280, 740, 1536, 1000), shared='yes, made in ember-line-road'),
    R('camp_hut_roof', 'roof', 'The hut\'s round turf roof: a low dome of grass with heather and gorse growing on it',
      (650, 128, 865, 235), shared='no',
      prompt=P('Square', 'Turf hut roof',
        'Subject: the round turf roof of a small stone hut, seen from straight above: a low dome of rough grass, olive and '
        'golden-green, with small clumps of purple heather and orange-flowered gorse growing in it, the edge of the dome '
        'resting on a ring of grey stones. The whole round roof is in the picture. ' + NIGHT + '.',
        'The roof of the round stone hut in the camp.')),
    R('camp_hut_door', 'skin', 'The hut\'s doorway: a stone frame with a sun carved over it, a plank door standing open, warm light inside',
      (722, 208, 802, 326), shared='no',
      prompt=P('Tall (2:3)', 'Hut doorway',
        'Subject: the doorway of a round dry-stone hut, seen flat from the front. Rough grey stones round a low opening, a '
        'flat lintel stone with a round sun symbol carved over it, a wooden plank door with iron straps standing open to '
        'the right, warm firelight inside, a flat stone step at the foot. Show the doorway and a little of the wall round it.',
        'The front door of the round hut in the camp.')),
    R('camp_tent', 'skin', 'A small canvas A-frame tent on wooden poles, bedrolls and blankets under it (two of them, one each side of the fire)',
      (598, 335, 718, 458), shared='no',
      prompt=P('Wide (3:2)', 'Camp tent',
        'Subject: a small camp tent seen flat from the side: a sheet of off-white canvas thrown over a ridge pole, held up '
        'by crossed wooden poles at each end and pegged down with ropes, with rolled bedrolls and a dark blanket under it. '
        'The whole tent is in the picture.',
        'The two tents in the camp.')),
    R('camp_chest', 'skin', 'The wooden chests round the camp: dark planks with iron bands and corners (three of them, and a crate by the east tent)',
      (658, 420, 708, 468), shared='no',
      prompt=P('Square', 'Travel chest',
        'Subject: a travel chest seen flat from the front: dark brown wooden planks, iron bands and iron corners, a flat '
        'lid, a small iron lock plate in the middle. The whole chest is in the picture.',
        'The chests round the camp fire.')),
    R('camp_crate', 'skin', 'The wooden crates stacked by the hut',
      (853, 263, 910, 332), shared='no',
      prompt=P('Square', 'Wooden crate',
        'Subject: a wooden supply crate seen flat from the front: pale brown planks with a dark frame round the edge and '
        'iron nails, slightly weathered. The whole crate is in the picture.',
        'The crates by the hut (and any crate in the wilds).')),
    R('wilds_iron_lantern_post', 'skin', 'The lantern hanging from a wooden post by the camp',
      (950, 350, 1000, 475), shared='in this group, made in dawnroost-road'),
    R('wilds_gorse', 'plant', 'Gorse: a low dark-green bush covered in orange-yellow flowers',
      (60, 180, 170, 262), shared='in this group, made here',
      prompt=P('Square', 'Gorse bush',
        'Subject: one low gorse bush, seen from the side, about 1 m tall: dense dark-green spiky stems covered in small '
        'orange and golden-yellow flowers. Its base at the bottom. ' + NIGHT + '.',
        'Gorse bushes all over the moor.')),
    R('wilds_heather', 'plant', 'Heather clumps: low bushes of tiny purple and magenta flowers',
      (10, 360, 120, 470), shared='in this group, made in ember-line-road'),
    R('wilds_white_flowers', 'plant', 'Tufts of tiny white starflowers in the grass',
      (865, 640, 925, 690), shared='in this group, made here',
      prompt=P('Square', 'White starflowers',
        'Subject: one low tuft of tiny white wildflowers seen from the side, about 20 cm tall: thin dark-green stems and '
        'small leaves topped with many little white five-petalled flowers. Its base at the bottom. ' + NIGHT + '.',
        'The little white flowers dotted through the grass and heather.')),
    R('wilds_grass_tuft', 'plant', 'Small spiky tufts of dark grass on the landing ground and by the stream', (160, 460, 210, 505), shared='in this group, made in eldergrove-edge'),
    R('wilds_reeds', 'plant', 'Reeds and tall rushes at the stream\'s edge',
      (590, 740, 650, 820), shared='in this group, made in ember-line-road'),
    R('wilds_water_leaves', 'plant', 'Little round floating leaves (like clover or small lily pads) on the stream',
      (570, 810, 620, 850), shared='in this group, made in ember-line-road'),
    R('camp_landing_stakes', 'prop', 'The landing ground\'s four wooden stakes, each with a few stones at its foot, and the thick ropes slung between them',
      (70, 280, 570, 565), shared='no'),
    R('camp_hut', 'prop', 'The round dry-stone hut with its turf roof (model; wall, roof and door textures above)',
      (645, 125, 870, 335), shared='no'),
    R('camp_fence', 'prop', 'A split-rail wooden fence behind the hut',
      (780, 95, 905, 195), shared='no'),
    R('camp_firewood', 'prop', 'The stacked crates and the little pile of firewood logs beside the hut',
      (830, 262, 915, 340), shared='no'),
    R('camp_bedrolls', 'prop', 'Rolled bedrolls and blankets under both tents, a small chest beside the west tent',
      (600, 355, 945, 455), shared='no'),
    R('camp_tripod_kettle', 'prop', 'The iron tripod over the fire with a black kettle hanging from it',
      (755, 380, 845, 472), shared='no'),
    R('camp_fire_ring', 'prop', 'The ring of round stones round the campfire',
      (740, 425, 845, 490), shared='no'),
    R('camp_stumps', 'prop', 'Log stumps used as seats (three), and a little stack of stones by the east one',
      (695, 440, 910, 505), shared='no'),
    R('camp_low_walls', 'prop', 'The low dry-stone walls round the camp and along the road, with square stone pillars at their ends',
      (600, 455, 1080, 545), shared='no'),
    R('wilds_boulders', 'prop', 'Big rounded boulders, grey with moss, and smaller rocks in the streams',
      (1170, 320, 1285, 450), shared='no'),
    R('wilds_birch', 'prop', 'Birch trees: slim white trunks, often two or three from one root, airy dark-green crowns',
      (1380, 40, 1536, 335), shared='no'),
    R('camp_lookout', 'prop', 'The lookout at the top edge: a flat round paving of stones (like the Dawnroost road\'s mossy flagstones) ringed by boulders',
      (940, 0, 1100, 110), shared='no'),
    R('camp_slab_bridge', 'prop', 'The slab bridge: flat stone slabs over the stream, a row of upright stones along each side',
      (860, 790, 975, 940), shared='no'),
    R('camp_fire_light', 'light', 'The campfire in its stone ring: the brightest warm light, lighting the tents and chests', (750, 420, 835, 480), shared='no'),
    R('camp_lantern_light', 'light', 'The lantern on its post by the road', (960, 370, 995, 410), shared='no'),
    R('camp_door_light', 'light', 'Warm light inside the hut\'s open doorway', (740, 255, 785, 320), shared='no'),
    R('warm_road_seams', 'light', 'The amber glow in the seams of the Warm Road\'s flagstones', (680, 405, 1536, 625), shared='no'),
    R('warm_roads_sky', 'sky', 'From the Warm Road fight painting: a big full moon in violet clouds, dark hills, a lake with an arched bridge, a far watchtower',
      (0, 0, 1448, 270), shared='no', src=WARM_ROAD_FIGHT, where='battle-warm-road.png'),
  ])

# ---------------------------------------------------------------------------------------------------------------------
PLACES['ember-line-road'] = dict(
  painting=WILDS + 'walk-ember-line-road.png', name='The Ember Line road',
  note=("The old Warm Road crossing the heather moor along the Ember Line, at night. The road (flagstones with amber light "
        "in their seams) comes in from the west, crosses a stream on a humped stone bridge and bends north. Three node "
        "stones (standing stones with a round glassy eye) stand in a ring of standing stones on the west, beside the road by "
        "the bridge, and on a rise in the east. Round them: heather, gorse, boulders, birches, dry-stone walls."),
  rows=[
    R('shared_warm_road', 'ground', 'The old Warm Road: big rounded lavender-grey flagstones with amber light glowing in the seams',
      (0, 0, 1060, 640), shared='yes (new shared id), made in warm-roads-camp'),
    R('wilds_heath_ground', 'ground', 'The heather moor off the paths: a low carpet of purple heather, gorse, dark grass and tiny white flowers',
      (0, 560, 1536, 1024), shared='in this group, made here', stand=dict(box=(10, 880, 160, 1000), squash=1.3), ref=(0, 840, 400, 1024),
      prompt=P('Square', 'Heather moor',
        'Subject: wild heather moorland seen from straight above, about 3 m across: a dense, low carpet of heather in '
        'purple, violet and magenta, with small dark-green gorse sprigs dotted with orange flowers, dark grass between, '
        'and a sprinkle of tiny white flowers, all evenly mixed. ' + NIGHT + '.',
        'The ground of the moor away from the paths, under the plant cut-outs.')),
    R('shared_grass_meadow', 'ground', 'The grassy clearing inside the ring of standing stones',
      (60, 180, 420, 340), shared='yes, made in warm-roads-camp'),
    R('shared_dirt_track', 'ground', 'The side paths of packed earth with small pebbles, to the stone ring and up the rise',
      (180, 220, 410, 510), shared='yes, made in eldergrove-edge'),
    R('shared_water_river', 'material', 'The stream: dark blue water with silver glints and a few ripples',
      (430, 0, 1536, 1024), shared='yes, made here', stand=dict(box=(1138, 782, 1222, 842), squash=1.0), ref=(980, 680, 1300, 920),
      prompt=P('Square', 'Moorland stream',
        'Subject: the surface of a small moorland stream seen from straight above, about 2 m across: deep navy and '
        'indigo water, gently moving, with fine silver-blue glints of moonlight and faint ripple lines spread evenly '
        'across it. No stones, no leaves, no foam. ' + NIGHT + '.',
        'Streams and small rivers in the wilds.')),
    R('shared_drystone', 'material', 'The dry-stone field walls: grey blocky stones stacked without mortar, a little moss',
      (420, 880, 900, 1000), shared='yes, made here', stand=dict(box=(545, 918, 652, 954), squash=1.0, mirror='y'), ref=(400, 880, 780, 1000),
      prompt=P('Wide (3:2)', 'Dry-stone wall face',
        'Subject: the face of a low dry-stone field wall. Squarish grey and lavender-grey stones of mixed sizes stacked '
        'without mortar, flat tops catching moonlight, small dark gaps between, a little green moss and lichen. The '
        'picture\'s top edge is the wall\'s top row of stones and its bottom edge is the wall\'s foot: about 1.8 m of '
        'wall, 1.2 m high. ' + NIGHT + '.',
        'The low stone walls across the moor and round the camp.')),
    R('ember_bridge_stone', 'material', 'The humped bridge\'s dressed stone: neat grey blocks in courses, the arch\'s voussoirs',
      (640, 330, 910, 535), shared='no', stand=dict(box=(785, 438, 870, 456), squash=1.0, mirror='y', rot=-8), ref=(690, 400, 910, 535),
      prompt=P('Square', 'Bridge stonework',
        'Subject: a face of neatly cut stone blocks laid in even courses, as on the side of an old humped bridge, about '
        '1.5 m across. Grey and lavender-grey blocks with slightly rounded edges, thin dark mortar lines, a little moss '
        'low down, the faces worn smooth. ' + NIGHT + '.',
        'The sides and parapets of the humped stone bridge.')),
    R('wilds_boulder_stone', 'material', 'The mossy grey boulders: rounded, blocky granite with patches of olive moss',
      (980, 385, 1140, 485), shared='in this group, made here', stand=dict(box=(1010, 403, 1080, 448), squash=1.0),
      prompt=P('Square', 'Mossy boulder stone',
        'Subject: the rough surface of an old granite boulder, about 1 m across: lavender-grey and blue-grey stone '
        'broken into blocky facets, with patches of olive-green moss and pale lichen spread evenly over it. '
        + NIGHT + '.',
        'All the boulders and big rocks in the wilds.')),
    R('ember_node_stone', 'skin', 'An Ember Line node: a lichened standing stone with a round glassy eye set near its top (three: in the ring, by the road, on the rise)',
      (553, 375, 617, 468), shared='no',
      prompt=P('Tall (2:3)', 'Ember Line node stone',
        'Subject: an Ember Line node stone seen flat from the front: a tall rough standing stone, grey and lavender with '
        'olive moss and lichen, rounded at the top, with a round glassy eye like a polished moonstone set into it near the '
        'top in a ring of darker stone, a few small rocks at its foot. The whole stone is in the picture.',
        'The three node stones on the Ember Line road (and any other Ember Line node).')),
    R('wilds_standing_stone', 'skin', 'A plain standing stone: tall, rough, lichened, rounded at the top',
      (128, 200, 188, 296), shared='in this group, made here',
      prompt=P('Tall (2:3)', 'Standing stone',
        'Subject: a plain standing stone seen flat from the front: a tall rough slab of grey and lavender stone, rounded '
        'at the top, with patches of olive moss and pale lichen and a few small rocks at its foot. The whole stone is in '
        'the picture.',
        'The standing stones in the rings (the Ember Line road and Eldergrove).')),
    R('ember_bridge_side', 'skin', 'The humped stone bridge seen from the side: one round arch, low parapets, square end pillars with cap stones (model it; this is its side)',
      (640, 330, 912, 535), shared='no',
      prompt=P('Wide (3:2)', 'Humped bridge',
        'Subject: a small humped stone bridge seen flat from the side: one round arch over a stream, a gently curved deck '
        'with low parapets of cut grey stone, and a square stone pillar with a cap stone at each end. The whole bridge is '
        'in the picture.',
        'The bridge where the road crosses the stream.')),
    R('wilds_heather', 'plant', 'Heather clumps: low bushes of tiny purple and magenta flowers',
      (40, 840, 160, 940), shared='in this group, made here',
      prompt=P('Square', 'Heather clump',
        'Subject: one clump of heather seen from the side, about 60 cm tall: a low rounded bush of fine dark-green stems '
        'crowded with tiny purple, violet and magenta flowers. Its base at the bottom. ' + NIGHT + '.',
        'Heather clumps all over the moor.')),
    R('wilds_white_flowers', 'plant', 'Tufts of tiny white starflowers in the grass', (285, 760, 365, 830), shared='in this group, made in warm-roads-camp'),
    R('wilds_reeds', 'plant', 'Reeds and tall rushes at the stream\'s edge',
      (1110, 600, 1180, 690), shared='in this group, made here',
      prompt=P('Tall (2:3)', 'Stream reeds',
        'Subject: one clump of reeds and rushes seen from the side, about 1 m tall: tall thin blades in olive, dark green '
        'and straw, some bent, springing from one root. Its base at the bottom. ' + NIGHT + '.',
        'The reeds at the edges of streams and pools.')),
    R('wilds_water_leaves', 'plant', 'Little round floating leaves (like clover or small lily pads) on the stream',
      (845, 505, 895, 540), shared='in this group, made here',
      prompt=P('Square', 'Floating leaves',
        'Subject: a small cluster of floating water leaves seen from straight above: four or five round, notched leaves '
        'like small lily pads, dull green with paler veins, each about 10 cm across. ' + NIGHT + '.',
        'The leaves floating on the streams and the pool.')),
    R('wilds_gorse', 'plant', 'Gorse bushes with orange-yellow flowers', (580, 540, 660, 600), shared='in this group, made in warm-roads-camp'),
    R('wilds_grass_tuft', 'plant', 'Dark grass tufts', (300, 310, 360, 360), shared='in this group, made in eldergrove-edge'),
    R('shared_bark_birch', 'material', 'Birch bark on the birches', (60, 640, 170, 800), shared='yes, made in warm-roads-camp'),
    R('wilds_birch_leaves', 'material', 'Birch crowns: small dark-green leaves with yellow-green specks, loose and airy',
      (1400, 240, 1536, 400), shared='in this group, made here', stand=dict(box=(893, 688, 947, 738), squash=1.0),
      prompt=P('Square', 'Birch leaves',
        'Subject: the leafy crown of a birch tree seen up close, filling the picture: many small oval leaves in dark green '
        'and blue-green, with yellow-green specks where the moonlight catches leaf tips, small dark gaps between twigs. '
        'About 1.5 m across. ' + NIGHT + '.',
        'The leaves of the birch trees (for leaf cards on the tree models).')),
    R('ember_stone_ring', 'prop', 'The ring of standing stones round the west node: about ten stones, two big ones, rubble at their feet',
      (70, 100, 430, 345), shared='no'),
    R('ember_node_stones', 'prop', 'The three node stones (skin above): in the ring, beside the road by the bridge, and on the rise in the east',
      (1325, 100, 1385, 185), shared='no'),
    R('ember_wall_posts', 'prop', 'Old wooden posts standing in the dry-stone walls, and the walls\' square end pillars',
      (540, 590, 720, 760), shared='no'),
    R('ember_cascades', 'prop', 'Little falls and white foam where the stream drops over stones (three or four of them)',
      (540, 90, 590, 140), shared='no'),
    R('ember_flat_rock', 'prop', 'A flat rock by the east side path, and the loose rubble along the paths',
      (1045, 222, 1100, 255), shared='no'),
    R('wilds_boulders', 'prop', 'Big rounded boulders, grey with moss', (980, 385, 1140, 485), shared='in this group, listed in warm-roads-camp'),
    R('wilds_birch', 'prop', 'Birch trees', (40, 630, 180, 810), shared='in this group, listed in warm-roads-camp'),
    R('warm_road_seams', 'light', 'The amber glow in the road\'s seams', (0, 0, 1060, 640), shared='no'),
    R('ember_node_eyes', 'light', 'The node stones\' glassy eyes: a pale silver gleam, not a warm light', (565, 395, 600, 425), shared='no'),
    R('ember_stream_glints', 'light', 'Moonlit glints and foam on the stream', (540, 90, 640, 260), shared='no'),
    R('warm_roads_sky', 'sky', 'The Warm Road sky (moon, clouds, hills, lake): see warm-roads-camp', (0, 0, 1448, 270), shared='in this group, ref in warm-roads-camp', where='battle-warm-road.png'),
  ])

# ---------------------------------------------------------------------------------------------------------------------
PLACES['dawnroost-road'] = dict(
  painting=WILDS + 'walk-dawnroost-forest-road.png', name='The forest road to Dawnroost',
  note=("The old Warm Road running north through a dark forest to Dawnroost, at night. Its mossy flagstones pass an iron "
        "lantern on a post and a milestone carved with a sun. Earth trails lead west to a still pool ringed with flat stones "
        "under a great oak, and east to a woodcutter's clearing with a lean-to, firewood, a chopping block and an axe. "
        "Round them: big oaks, young firs, a few birches, boulders, ferns, flowering undergrowth and a fallen mossy log."),
  rows=[
    R('dawnroost_mossy_road', 'ground', 'The old Warm Road here: small rounded flagstones in grey and lavender, moss and earth in the gaps, no glow',
      (670, 0, 1095, 1024), shared='no', stand=dict(box=(905, 885, 1050, 1000), squash=1.35), ref=(840, 760, 1100, 1024),
      prompt=P('Square', 'Mossy forest road',
        'Subject: an old forest road of small rounded flagstones, about 3 m across: irregular flat stones in pale grey, '
        'blue-grey and lavender, fitted close, with thin lines of green moss and dark earth in the gaps and a few fallen '
        'leaves. No glow in the seams. ' + NIGHT + ', filtered through trees.',
        'The road to Dawnroost through the forest, and the paved lookout at the Warm Roads camp.')),
    R('shared_dirt_track', 'ground', 'The trails to the pool and the woodcutter\'s clearing: packed earth with small pebbles',
      (200, 380, 1350, 580), shared='yes, made in eldergrove-edge'),
    R('shared_forest_floor', 'ground', 'The forest floor at the road\'s edges and under the trees: moss, earth, small leaves and tiny white flowers',
      (840, 60, 990, 340), shared='yes, made here', stand=dict(box=(878, 175, 948, 265), squash=1.3), ref=(860, 150, 990, 300),
      prompt=P('Square', 'Forest floor',
        'Subject: a forest floor seen from straight above, about 2 m across: dark earth mostly covered with soft green '
        'moss, fallen small leaves in brown and rust, little twigs, and a scatter of tiny white flowers, all evenly '
        'mixed. ' + NIGHT + ', filtered through trees.',
        'The ground under the trees in the forests, and the mossy verges of roads.')),
    R('shared_water_dark', 'material', 'The still pool: black water with lily pads and a few glints',
      (180, 320, 420, 520), shared='yes, listed only (the bog paintings show it better)'),
    R('shared_bark_oak', 'material', 'Oak bark: deep-furrowed dark brown-grey bark with moss, on the great oak and the others',
      (560, 170, 690, 340), shared='yes, made here', stand=dict(box=(568, 205, 625, 275), squash=1.0),
      prompt=P('Square', 'Oak bark',
        'Subject: the bark of an old oak trunk seen flat, about 60 cm across: deep vertical furrows and ridges in dark '
        'brown, umber and grey, with olive-green moss in the furrows and a little lichen, the grain running top to '
        'bottom. ' + NIGHT + '.',
        'The trunks and big branches of the oak trees.')),
    R('wilds_oak_leaves', 'material', 'Oak crowns: dense clusters of broad leaves in dark teal and blue-green, pale where the moon catches them',
      (470, 10, 720, 200), shared='in this group, made here', stand=dict(box=(500, 50, 620, 150), squash=1.0),
      prompt=P('Square', 'Oak leaves',
        'Subject: the dense leafy crown of an oak seen up close from above, filling the picture: clusters of broad lobed '
        'leaves in dark teal, blue-green and slate, their upper edges pale silver-green in the moonlight, small dark gaps '
        'between clusters. About 2 m across. ' + NIGHT + '.',
        'The leaves of the oaks and other broad-leaved trees (for leaf cards and crowns).')),
    R('wilds_fir_boughs', 'material', 'Fir boughs: layered sprays of short needles in blue-green, pale tips',
      (0, 590, 160, 770), shared='in this group, made here', stand=dict(box=(15, 615, 135, 735), squash=1.0),
      prompt=P('Square', 'Fir boughs',
        'Subject: the layered boughs of a fir tree seen up close, filling the picture: overlapping sprays of short dense '
        'needles in deep blue-green and teal, the tips pale silver-blue in the moonlight, dark gaps between the layers. '
        'About 1.5 m across. ' + NIGHT + '.',
        'The needles of all the fir and pine trees (for bough cards).')),
    R('wilds_mossy_log', 'material', 'The fallen log\'s bark: grey-brown, cracked, heavy with moss and lichen',
      (1190, 520, 1536, 770), shared='in this group, made here', stand=dict(box=(1225, 575, 1335, 610), squash=1.0, rot=22),
      prompt=P('Square', 'Mossy log bark',
        'Subject: the bark of an old fallen log seen flat, about 60 cm across: grey-brown cracked bark in long plates, '
        'thick olive and yellow-green moss growing over much of it, pale lichen, the grain running left to right. '
        + NIGHT + '.',
        'The fallen logs in the forests.')),
    R('wilds_boulder_stone', 'material', 'Mossy boulders round the pool and the road', (540, 370, 640, 440), shared='in this group, made in ember-line-road'),
    R('shared_bark_birch', 'material', 'Birch bark', (1400, 20, 1536, 220), shared='yes, made in warm-roads-camp'),
    R('dawnroost_leanto_roof', 'roof', 'The woodcutter\'s lean-to roof: split logs laid side by side, mossy',
      (1240, 160, 1465, 300), shared='no',
      prompt=P('Wide (3:2)', 'Log lean-to roof',
        'Subject: the roof of a woodcutter\'s lean-to seen from straight above: split logs and rough planks laid side by '
        'side across two log beams, grey-brown weathered wood with moss along the joins and a few gaps. The whole roof is '
        'in the picture.',
        'The roof of the woodcutter\'s lean-to.')),
    R('dawnroost_milestone', 'skin', 'The milestone by the road: a round-topped stone with a sun carved on it, a smaller rock at its foot',
      (1038, 535, 1142, 668), shared='no',
      prompt=P('Tall (2:3)', 'Sun milestone',
        'Subject: a roadside milestone seen flat from the front: a round-topped upright stone, pale grey and lavender with '
        'olive moss, a sun with pointed rays carved deep into its face, a smaller mossy rock at its foot. The whole stone '
        'is in the picture.',
        'The milestone on the road to Dawnroost.')),
    R('wilds_iron_lantern_post', 'skin', 'The iron lantern hanging from a wooden post with an arm and a brace',
      (950, 525, 1025, 680), shared='in this group, made here',
      prompt=P('Tall (2:3)', 'Lantern post',
        'Subject: a roadside lantern post seen flat from the front: a square wooden post with an arm and a diagonal brace '
        'at the top, a black iron lantern with a little roof hanging from the arm on a hook, its glass glowing warm amber. '
        'The whole post is in the picture.',
        'The lantern posts on the roads (Dawnroost road, the Warm Roads camp).')),
    R('dawnroost_firewood_stack', 'skin', 'The firewood stack under the lean-to: split logs seen end-on',
      (1298, 272, 1385, 350), shared='no',
      prompt=P('Square', 'Firewood stack',
        'Subject: a stack of split firewood seen flat from the end: round and half-round log ends in pale tan and honey '
        'with growth rings, grey-brown bark round them, stacked neatly. The whole stack is in the picture.',
        'The firewood stack at the woodcutter\'s lean-to (and log piles anywhere).')),
    R('wilds_fern', 'plant', 'Ferns: green fronds fanning from one root',
      (1140, 180, 1230, 245), shared='in this group, made here',
      prompt=P('Square', 'Fern',
        'Subject: one woodland fern seen from the side, about 70 cm tall: long arching green fronds with fine leaflets '
        'fanning out from one root, a few fronds turning bronze. Its base at the bottom. ' + NIGHT + '.',
        'Ferns under the trees in the forests.')),
    R('wilds_fir_sapling', 'plant', 'A young fir: a small cone of blue-green boughs',
      (1005, 245, 1100, 355), shared='in this group, made here',
      prompt=P('Tall (2:3)', 'Young fir',
        'Subject: one young fir tree seen from the side, about 1.5 m tall: a narrow cone of layered blue-green boughs with '
        'pale silver-blue tips, a short dark trunk at the bottom. Its base at the bottom. ' + NIGHT + '.',
        'The small firs scattered through the forests.')),
    R('wilds_violet_shrub', 'plant', 'Low undergrowth with violet and purple flowers under the trees',
      (1055, 740, 1115, 798), shared='in this group, made here',
      prompt=P('Square', 'Violet undergrowth',
        'Subject: one low woodland shrub seen from the side, about 60 cm tall: thin dark stems and small dark leaves '
        'covered in tiny violet and purple flowers. Its base at the bottom. ' + NIGHT + '.',
        'The flowering undergrowth under the forest trees.')),
    R('wilds_shelf_mushrooms', 'plant', 'Pale shelf mushrooms growing out of the fallen log',
      (1305, 600, 1410, 705), shared='in this group, made here',
      prompt=P('Square', 'Shelf mushrooms',
        'Subject: a cluster of five or six shelf mushrooms growing one above another, seen from the side: flat round caps '
        'in pale cream and grey-white with darker undersides, on short stalks. ' + NIGHT + '.',
        'The mushrooms growing on fallen logs.')),
    R('wilds_reeds', 'plant', 'Reeds at the pool\'s edge', (330, 245, 370, 320), shared='in this group, made in ember-line-road'),
    R('wilds_water_leaves', 'plant', 'Lily pads on the pool', (285, 410, 330, 440), shared='in this group, made in ember-line-road'),
    R('wilds_white_flowers', 'plant', 'Tiny white flowers in the moss', (570, 410, 630, 440), shared='in this group, made in warm-roads-camp'),
    R('wilds_oak', 'prop', 'Oak trees: thick gnarled trunks with roots spreading over the ground, wide dark crowns (the great oak by the pool is the biggest)',
      (430, 0, 830, 410), shared='no'),
    R('wilds_fir', 'prop', 'Fir trees: dark blue-green cones of layered boughs, young ones and bigger ones',
      (0, 590, 160, 770), shared='no'),
    R('wilds_birch', 'prop', 'Birch trees', (1400, 20, 1536, 220), shared='in this group, listed in warm-roads-camp'),
    R('dawnroost_pool_stones', 'prop', 'The flat stones round the pool\'s rim, and the boulders by its east side',
      (150, 250, 470, 560), shared='no'),
    R('dawnroost_leanto', 'prop', 'The woodcutter\'s lean-to: a roof of split logs on rough log posts and a brace, open at the front',
      (1230, 150, 1470, 370), shared='no'),
    R('dawnroost_chopping_block', 'prop', 'The chopping block (a sawn stump) with an axe leaning beside it',
      (1222, 312, 1305, 400), shared='no'),
    R('dawnroost_logs', 'prop', 'Split logs piled on the ground, and a loose log lying by the lean-to',
      (1165, 260, 1355, 450), shared='no'),
    R('wilds_fallen_log', 'prop', 'A big fallen log, mossy, with roots at one end and shelf mushrooms on it',
      (1190, 515, 1536, 775), shared='no'),
    R('wilds_boulders', 'prop', 'Boulders', (540, 370, 640, 440), shared='in this group, listed in warm-roads-camp'),
    R('dawnroost_lantern_light', 'light', 'The lantern: a warm pool of light on the road and the verge round its post', (940, 540, 1010, 760), shared='no'),
    R('dawnroost_pool_glint', 'light', 'A cold silver glint of moonlight on the pool', (205, 385, 245, 415), shared='no'),
    R('warm_roads_sky', 'sky', 'Little sky shows through the trees; the fights here use the Warm Road painting (see warm-roads-camp)', (0, 0, 1448, 270), shared='in this group, ref in warm-roads-camp', where='battle-warm-road.png'),
  ])

# ---------------------------------------------------------------------------------------------------------------------
PLACES['eldergrove-edge'] = dict(
  painting=WILDS + 'walk-eldergrove-edge.png', name="Eldergrove's edge",
  note=("The edge of the ancient Eldergrove forest at night, with a light frost. A wide pebbly earth track crosses the "
        "middle. At the top, a giant elder tree with a dark hollow between its roots that a cobbled path leads into; on the "
        "top right, a ring of standing stones (one carved with a moon, one with a sun); bottom left, a ruined stone arch "
        "with a carved pillar. Round them: huge mossy roots, young firs, bare twisted trees, ferns, red and frosted "
        "undergrowth, glowing pale mushrooms, fallen logs and boulders."),
  rows=[
    R('shared_dirt_track', 'ground', 'The wide track and the side paths: packed warm-brown earth full of small rounded pebbles',
      (0, 430, 1536, 640), shared='yes, made here', stand=dict(box=(1150, 548, 1400, 612), squash=1.45), ref=(1100, 520, 1536, 640),
      prompt=P('Square', 'Dirt track',
        'Subject: a packed earth track seen from straight above, about 3 m across: warm brown and ochre earth, trodden '
        'firm, with many small rounded pebbles in grey and lavender pressed into it, a few bigger flat stones, spread '
        'evenly. ' + NIGHT + '.',
        'Every earth path and track in the wilds: the camp floor, side paths, forest trails, the Eldergrove track.')),
    R('shared_forest_floor', 'ground', 'The ground under the trees: moss, earth, small leaves and tiny white flowers',
      (0, 380, 300, 440), shared='yes, made in dawnroost-road'),
    R('eldergrove_elder_bark', 'material', 'The giant elder tree\'s bark and roots: deep ropey furrows, grey-brown, moss in the furrows and frost on the ridges',
      (380, 0, 900, 420), shared='no', stand=dict(box=(595, 5, 660, 85), squash=1.0), ref=(540, 0, 760, 200),
      prompt=P('Square', 'Ancient elder bark',
        'Subject: the bark of an immense ancient tree seen flat, about 1 m across: deep twisting rope-like furrows and '
        'ridges in grey-brown and dark violet-brown, olive moss packed in the furrows, a thin dusting of pale blue-white '
        'frost on the ridges, the grain running top to bottom. ' + NIGHT + '.',
        'The trunk and the great roots of the Eldergrove\'s giant tree (and the other huge old roots there).')),
    R('eldergrove_dead_bark', 'material', 'The bare twisted trees\' bark: grey-brown, cracked, frosted',
      (0, 600, 170, 1024), shared='no', stand=dict(box=(58, 722, 95, 790), squash=1.0), ref=(20, 620, 180, 900),
      prompt=P('Square', 'Bare tree bark',
        'Subject: the bark of an old leafless tree seen flat, about 40 cm across: grey-brown and dark slate bark in long '
        'cracked strips, a little green-grey lichen, a fine dusting of blue-white frost on the raised edges, the grain '
        'running top to bottom. ' + NIGHT + '.',
        'The bare, twisted trees at Eldergrove\'s edge.')),
    R('eldergrove_ruin_stone', 'material', 'The ruin\'s stone: square grey blocks in courses, worn, mossy',
      (310, 490, 720, 790), shared='no', stand=dict(box=(330, 545, 372, 600), squash=1.0), ref=(310, 500, 420, 640),
      prompt=P('Square', 'Ruin stonework',
        'Subject: a face of old cut stone blocks laid in courses, about 1.2 m across: grey and lavender-grey squarish '
        'blocks with worn rounded edges, thick olive-green moss along the joints and on the tops, a little pale lichen. '
        + NIGHT + '.',
        'The walls, pillars and arch of the ruin at Eldergrove\'s edge.')),
    R('wilds_fir_boughs', 'material', 'Fir boughs', (850, 220, 1010, 400), shared='in this group, made in dawnroost-road'),
    R('wilds_mossy_log', 'material', 'Mossy bark of the fallen logs', (0, 290, 290, 470), shared='in this group, made in dawnroost-road'),
    R('wilds_boulder_stone', 'material', 'Mossy boulders', (820, 360, 960, 470), shared='in this group, made in ember-line-road'),
    R('eldergrove_hollow', 'skin', 'The hollow in the giant tree: a dark opening between two great roots, a cobbled path going in',
      (500, 100, 720, 300), shared='no',
      prompt=P('Square', 'Elder tree hollow',
        'Subject: the base of an immense ancient tree seen flat from the front: two huge twisting roots, grey-brown with '
        'moss and frost, parting to make a tall dark hollow in the trunk, an old cobbled path running into the darkness, '
        'a few pale mushrooms on the bark. Show the opening and the roots round it.',
        'The entrance into the giant tree at Eldergrove\'s edge.')),
    R('eldergrove_arch', 'skin', 'The ruin\'s round arch: a stone doorway with a dark way through, broken walls each side',
      (370, 505, 570, 700), shared='no',
      prompt=P('Square', 'Ruined stone arch',
        'Subject: a ruined stone archway seen flat from the front: a round arch of cut grey stones over a dark doorway, '
        'with broken stone walls and a stub of pillar each side, thick moss on the tops, a flagstone floor going through. '
        'The whole arch is in the picture.',
        'The ruined archway at Eldergrove\'s edge.')),
    R('eldergrove_sun_pillar', 'skin', 'The carved pillar by the arch: a tall stone block with a sun carved on its face',
      (478, 585, 545, 748), shared='no',
      prompt=P('Tall (2:3)', 'Sun pillar',
        'Subject: a square stone pillar seen flat from the front: pale grey stone, worn, with a round sun with pointed '
        'rays carved into its face and lines carved above and below, moss at its top and foot, standing on a plinth. The '
        'whole pillar is in the picture.',
        'The carved pillar in the ruin at Eldergrove\'s edge.')),
    R('eldergrove_moon_stone', 'skin', 'The tallest standing stone, carved with a crescent moon',
      (1138, 60, 1228, 215), shared='no',
      prompt=P('Tall (2:3)', 'Moon standing stone',
        'Subject: a tall standing stone seen flat from the front: rough lavender-grey stone, rounded at the top, olive '
        'moss and frost on it, a crescent moon carved near the top. The whole stone is in the picture.',
        'The moon stone in the ring at Eldergrove\'s edge.')),
    R('eldergrove_sun_stone', 'skin', 'A standing stone carved with a sun',
      (1210, 220, 1298, 355), shared='no',
      prompt=P('Tall (2:3)', 'Sun standing stone',
        'Subject: a standing stone seen flat from the front: rough lavender-grey stone, rounded at the top, olive moss on '
        'it, a round sun with pointed rays carved in the middle of its face. The whole stone is in the picture.',
        'The sun stone in the ring at Eldergrove\'s edge.')),
    R('wilds_standing_stone', 'skin', 'The plain stones in the ring', (1060, 210, 1130, 310), shared='in this group, made in ember-line-road'),
    R('eldergrove_bracken', 'plant', 'Bracken: ferns turned rust and copper',
      (185, 720, 290, 800), shared='no',
      prompt=P('Square', 'Rust bracken',
        'Subject: one clump of bracken fern seen from the side, about 70 cm tall: arching fronds with fine leaflets in '
        'rust, copper and dull orange, a few still olive green. Its base at the bottom. ' + NIGHT + '.',
        'The autumn-coloured ferns at Eldergrove\'s edge.')),
    R('eldergrove_red_undergrowth', 'plant', 'Low undergrowth with dark crimson and wine-red leaves',
      (230, 625, 300, 690), shared='no',
      prompt=P('Square', 'Crimson undergrowth',
        'Subject: one low woodland shrub seen from the side, about 60 cm tall: thin dark stems with small leaves in '
        'crimson, wine-red and dark plum. Its base at the bottom. ' + NIGHT + '.',
        'The red undergrowth under the Eldergrove trees.')),
    R('eldergrove_frost_shrub', 'plant', 'Low frosted shrubs: small leaves rimed blue-white',
      (350, 815, 420, 885), shared='no',
      prompt=P('Square', 'Frosted shrub',
        'Subject: one low shrub seen from the side, about 50 cm tall: small rounded leaves in dark blue-green, each edged '
        'with pale blue-white frost so the bush glitters. Its base at the bottom. ' + NIGHT + '.',
        'The frosted bushes at Eldergrove\'s edge.')),
    R('eldergrove_moon_mushrooms', 'plant', 'Pale glowing mushrooms growing on the roots and logs',
      (670, 110, 745, 200), shared='no',
      prompt=P('Square', 'Pale glowing mushrooms',
        'Subject: a cluster of four or five mushrooms growing out of bark, seen from the side: flat round caps in pale '
        'silver-blue and white with darker gills underneath, on short stems, giving off a faint cold glow. ' + NIGHT + '.',
        'The glowing mushrooms on the roots and fallen logs at Eldergrove.')),
    R('wilds_fir_sapling', 'plant', 'Young firs', (870, 225, 1000, 390), shared='in this group, made in dawnroost-road'),
    R('wilds_grass_tuft', 'plant', 'A tuft of tall grass by the track (small dark tufts like it all over the wilds)',
      (1370, 468, 1432, 545), shared='in this group, made here',
      prompt=P('Square', 'Grass tuft',
        'Subject: one tuft of wild grass seen from the side, about 40 cm tall: thin dark-green and olive blades '
        'springing from one root, a few blades bent over, two or three tall seed stalks. Its base at the bottom. '
        + NIGHT + '.',
        'Grass tufts on the landing ground and all over the wilds.')),
    R('wilds_white_flowers', 'plant', 'Tiny white flowers', (1200, 160, 1260, 200), shared='in this group, made in warm-roads-camp'),
    R('eldergrove_elder_tree', 'prop', 'The giant elder tree: a vast trunk above the picture, huge mossy roots spreading out over the ground, a hollow between them',
      (300, 0, 960, 440), shared='no'),
    R('eldergrove_dead_tree', 'prop', 'Bare twisted trees, leafless, their branches dusted with frost (two big ones, bottom left and bottom middle)',
      (0, 560, 210, 1024), shared='no'),
    R('wilds_fir', 'prop', 'Fir trees', (850, 220, 1010, 400), shared='in this group, listed in dawnroost-road'),
    R('eldergrove_fallen_logs', 'prop', 'Fallen mossy logs with pale mushrooms on them (two)',
      (1015, 680, 1265, 800), shared='no'),
    R('eldergrove_stone_ring', 'prop', 'The ring of seven standing stones (one moon-carved, one sun-carved) on the top right',
      (990, 60, 1350, 370), shared='no'),
    R('eldergrove_ruin', 'prop', 'The ruin: the round arch, broken walls, the carved pillar, stacked blocks and fallen blocks',
      (300, 490, 730, 800), shared='no'),
    R('eldergrove_fallen_branch', 'prop', 'A long fallen branch lying over the undergrowth by the stones',
      (1180, 410, 1320, 510), shared='no'),
    R('wilds_boulders', 'prop', 'Boulders', (820, 360, 960, 470), shared='in this group, listed in warm-roads-camp'),
    R('eldergrove_mushroom_glow', 'light', 'Faint cold blue glow from the mushrooms (on the roots, the logs and the bottom-right root). No warm light anywhere here.',
      (670, 110, 745, 200), shared='no'),
    R('eldergrove_sky', 'sky', 'From an older Eldergrove fight painting: a full moon, snowy peaks, mist, giant trees with warm lights in their hollows',
      (0, 0, 1448, 720), shared='no', src=ELDER_FIGHT, where='02-woodland-eldergrove-first-age-clearing.png'),
  ])
