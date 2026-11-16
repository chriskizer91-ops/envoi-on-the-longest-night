# places.py: what the north's five paintings hold, for build.py. One entry per thing a 3D build needs.
# Each row: id, kind, what (plain words), box (where it is in the painting, x0 y0 x1 y1), shared,
#   and optionally: src (another painting, for skies), stand (patch for the stand-in) + squash,
#   prompt (shape, rules, title, subject, use) when Chris should make the real one.
ART = '/home/claude/envoi-game/reference/art'
WALK = ART + '/walk'

def R(id, kind, what, box, shared=False, **k):
    d = dict(id=id, kind=kind, what=what, box=box, shared=shared); d.update(k); return d

def P(shape, rules, title, subject, use):
    return dict(shape=shape, rules=rules, title=title, subject=subject, use=use)

PLACES = {}

# ---------------------------------------------------------------------------------------------------------------------
PLACES['crossroads'] = dict(
    painting=WALK + '/walk-northern-crossroads.png',
    name='The northern crossroads',
    note=('Four old paved roads meet in a ring of stone with a compass star set in it, out on a cold moor at night. '
          'Dry golden grass with frost on it fills the ground between; the north edge is under thin snow, with a frozen '
          'pond in the top-left corner. Ruined low walls and broken gateposts line the roads. The well with its lantern '
          '(where the letter is) stands south-west of the ring, and a fallen waymarker with a glowing amber rune lies '
          'north-east of it. Halcyon\'s ambush happens in the ring. Snow-dusted rock outcrops and dark pines close in at '
          'the corners. The only warm light is the well\'s lantern and the rune.'),
    rows=[
        R('crossroads_road_paving', 'ground', 'the old paving of the four roads: worn grey blocks, dry grass and frost in the gaps',
          (700, 0, 840, 330), stand=(0, 446, 120, 532), squash=1.4,
          prompt=P('Square', 'ground', 'Old north road paving',
                   'Subject: the paving of an old road on a cold northern moor, about 2.5 m across. Worn, roughly squared '
                   'grey paving blocks of a few sizes laid in loose rows, their edges chipped and rounded; thin tufts of '
                   'dry golden grass and a little white frost in the gaps, a few small patches where the blocks are '
                   'missing and earth shows. Cold blue-grey night colours with warm straw-coloured grass.',
                   'The ground of the four roads at the northern crossroads.')),
        R('shared_grass_frosted', 'ground', 'dry golden moor grass with white frost on it, over dark earth: the ground between the roads',
          (900, 600, 1160, 800), True, stand=(935, 650, 1095, 762), squash=1.4,
          prompt=P('Square', 'ground', 'Frosted moor grass',
                   'Subject: rough moor ground in late autumn, about 3 m across. Dark peaty earth almost hidden under '
                   'clumps of dry golden-brown grass, the blade tips touched with white frost, a few tiny pale stones. '
                   'The clumps are of even size and spread evenly. Night colours: muted straw and umber with cold '
                   'blue-violet shadow.',
                   'The open ground of the north: the crossroads moor, and any frosty grassland in the game.')),
        R('shared_snow_patchy', 'ground', 'thin snow lying in patches over dry grass and earth (the north edge of the map)',
          (840, 100, 1100, 300), True, stand=(880, 140, 1060, 260), squash=1.4,
          prompt=P('Square', 'ground', 'Thin snow over moor grass',
                   'Subject: moor ground where the first snow has fallen thinly, about 3 m across. Uneven patches of '
                   'pale blue-white snow lying over dark earth and flattened dry grass, with brown grass tufts poking '
                   'through; the patches are of mixed small sizes, spread evenly, none large. Moonlit night colours.',
                   'Where the snow begins: the crossroads\' north edge, and the edges between grass and deep snow anywhere in the north.')),
        R('shared_snow', 'ground', 'deeper snow on the hillside along the top edge', (380, 0, 700, 110), True),
        R('shared_ice', 'ground', 'the frozen pond in the top-left corner, with snow on its banks', (0, 40, 240, 175), True),
        R('shared_rock_cliff_snowy', 'material', 'dark grey rock outcrops dusted with snow, at the corners of the map', (1290, 80, 1536, 300), True),
        R('shared_stone_wall_frosted', 'material', 'the cut-stone blocks of the ruined low walls along the roads', (330, 370, 560, 445), True),
        R('crossroads_ring_compass', 'skin', 'the round stone ring where the roads meet, its stones laid in circles round a carved compass star (Halcyon\'s ambush is here); seen from above, laid as one piece',
          (580, 315, 952, 632),
          prompt=P('Square', 'roof', 'The crossroads\' compass ring',
                   'Subject: the paved ring where four old roads meet, seen from straight above, about 14 m across. '
                   'Curved grey paving stones laid in four or five rings, worn and uneven, with dry grass and frost in '
                   'some joints, round a carved eight-pointed compass star in darker stone at the centre. The four '
                   'roads\' stubs leave the ring north, south, east and west, cut off at the picture\'s edges. Cold '
                   'moonlit colours.',
                   'Laid as one piece in the middle of the crossroads, where Halcyon\'s ambush happens.')),
        R('crossroads_gatepost', 'skin', 'an old square stone gatepost, cracked and leaning, with a stub of broken wall at its foot (two on the north road, two on the south)',
          (645, 125, 720, 252),
          prompt=P('Tall (2:3)', 'skin', 'Ruined road gatepost',
                   'Subject: an old square gatepost of grey cut stone, seen flat from the front, about 2.5 m tall: '
                   'stacked blocks with a flat capstone, chipped corners, frost in the joints, and a few blocks of a '
                   'broken low wall at its foot on one side. Moonlit night colours.',
                   'The four gateposts on the north and south roads at the crossroads.')),
        R('crossroads_well', 'skin', 'the crossroads well: a round stone well with a wooden frame, rope and bucket, a lantern hung on its post (a letter lies under a stone on its rim)',
          (462, 520, 590, 645),
          prompt=P('Square', 'skin', 'The crossroads well',
                   'Subject: the crossroads well, seen flat from the side. A round well of grey fitted stones about '
                   '1 m high, with a weathered wooden frame and crossbar over it, a rope and wooden bucket, and a small '
                   'iron lantern hanging from the post on the right with its glass glowing amber. A folded letter held '
                   'down by a small stone on the rim. The whole well is in the picture.',
                   'The well south-west of the ring, where the letter is.')),
        R('crossroads_waymarker', 'skin', 'the fallen waymarker: a carved stone pillar lying toppled on its side, an amber rune glowing on it, broken stones round it',
          (920, 270, 1060, 395),
          prompt=P('Wide (3:2)', 'skin', 'The fallen waymarker',
                   'Subject: an old waymarker pillar of grey carved stone, about 3 m long, lying toppled on its side, '
                   'seen flat from the side. Square in section with a squared cap, worn carved bands along it, and one '
                   'diamond-shaped rune near the cap glowing warm amber. Its broken base and a few loose stone pieces '
                   'lie beside it. The whole pillar is in the picture.',
                   'North-east of the ring at the crossroads.')),
        R('crossroads_ruined_wall', 'prop', 'stretches of ruined low wall of cut stone with broken pillar stumps, along the west and east roads', (330, 365, 560, 445)),
        R('crossroads_standing_rock', 'prop', 'a tall rough rock standing in the grass', (318, 188, 392, 278)),
        R('crossroads_boulder', 'prop', 'grey boulders, some dusted with snow, scattered in the grass', (135, 325, 200, 385)),
        R('crossroads_rock_cluster', 'prop', 'a cluster of big grey boulders with bare bushes round them', (1150, 585, 1270, 700)),
        R('crossroads_pine_dark', 'plant', 'a dark pine with almost no snow on it', (1428, 600, 1512, 800),
          prompt=P('Tall (2:3)', 'plant', 'Dark moor pine',
                   'Subject: one dark spruce-like pine, about 8 m tall, seen from the side, whole, with its trunk foot '
                   'at the bottom. Deep blue-green needles in drooping tiers, a narrow pointed top, only a few flecks of '
                   'frost. Moonlit night colours.',
                   'The pines at the crossroads\' corners.')),
        R('crossroads_dead_tree', 'plant', 'a bare black dead tree with twisting branches', (1195, 725, 1310, 885),
          prompt=P('Tall (2:3)', 'plant', 'Bare dead tree',
                   'Subject: one leafless dead tree, about 5 m tall, seen from the side, whole, with its base at the '
                   'bottom. A dark twisted trunk splitting into thin crooked branches and fine twigs, no leaves. Night '
                   'colours, almost black against the grey.',
                   'Among the rocks at the crossroads\' south-east corner.')),
        R('crossroads_bare_shrub', 'plant', 'a leafless twiggy bush', (188, 172, 270, 258),
          prompt=P('Square', 'plant', 'Leafless moor bush',
                   'Subject: one leafless bush, about 1.2 m tall, seen from the side, whole, with its base at the '
                   'bottom. Many thin dark brown twigs fanning up from a short base, a few dry grass blades at its '
                   'foot. Night colours.',
                   'Scattered over the crossroads moor.')),
        R('crossroads_grass_tuft', 'plant', 'a tuft of dry golden grass with frost on the tips', (108, 860, 172, 928),
          prompt=P('Square', 'plant', 'Frosted grass tuft',
                   'Subject: one tuft of dry moor grass, about 50 cm tall, seen from the side, whole, with its base at '
                   'the bottom. Thin arching golden-brown blades, the tips white with frost. Night colours.',
                   'Scattered thickly over the crossroads moor, to break up the flat ground.')),
        R('crossroads_well_lantern', 'light', 'the small lantern hanging on the well\'s post: warm amber, the only lamp here', (548, 540, 580, 590)),
        R('crossroads_rune_glow', 'light', 'the amber rune on the fallen waymarker, a faint warm glow on the ground round it', (990, 295, 1035, 340)),
        R('crossroads_sky', 'sky', 'beyond the moor: a full moon over a range of snowy peaks, pine valleys filled with mist, violet night sky (from the crossroads fight painting)',
          (0, 0, 1448, 520), src=ART + '/battle-backgrounds/13-northern-crossroads.png'),
    ])

# ---------------------------------------------------------------------------------------------------------------------
PLACES['shipyard'] = dict(
    painting=WALK + '/walk-shipyard.png',
    name='The shipyard',
    note=('Ysmera Brightkeel\'s walled yard on a rock in a dark, ice-strewn sea, reached by a long stone bridge from the '
          'south. Crenellated grey stone walls with fire baskets burning on the corner towers ring a yard of warm-lit '
          'cobbles. In the middle is the slipway with its big timber cradle, where the Magpie is built, with two wooden '
          'cranes. West: Old Gil\'s bunkhouse and a tall timber-framed house; east: the forge, a log shed and Pim\'s '
          'hall with dormer windows. A twin-towered gatehouse with navy-and-gold sun banners faces the bridge. Stairs '
          'lead down to a west pier and an east quay with a crane. Roofs are slate with snow on them; the cliffs below '
          'are snowy with small pines. Lamp posts and windows give warm light everywhere in the yard.'),
    rows=[
        R('shared_cobbles_town', 'ground', 'the yard\'s rounded grey-brown cobbles (also on the bridge deck)', (560, 430, 660, 500), True),
        R('shared_boardwalk_planks', 'ground', 'wooden deck planks: the west pier, the east quay\'s deck and the slipway\'s ramp', (140, 595, 300, 645), True),
        R('shipyard_icy_sea', 'material', 'the dark night sea round the yard, small glinting ripples, ice floes drifting in it',
          (1040, 860, 1310, 1010), stand=(1060, 880, 1290, 1000), squash=1.4,
          prompt=P('Square', 'material', 'Dark northern sea',
                   'Subject: the surface of a cold dark sea at night seen from above, about 4 m across. Deep navy and '
                   'blue-black water with small, even ripples and scattered tiny pale glints of moonlight. No ice, no '
                   'foam, no reflections of lamps.',
                   'The water all round the shipyard\'s rock.')),
        R('shared_roof_slate_snow', 'material', 'slate roofs with snow lying on every slate (the houses, forge, hall and towers)',
          (1080, 160, 1330, 280), True, stand=(1095, 212, 1190, 262), squash=1.0,
          prompt=P('Square', 'material', 'Snowy slate roof',
                   'Subject: a slate roof in winter, seen straight on, about 2 m across. Rows of small, rounded dark '
                   'blue-grey slates, each with a little cap of snow on its lower edge, so the roof reads as even '
                   'stripes of slate and snow. Moonlit night colours.',
                   'The roofs of the shipyard\'s buildings, and other snowy slate roofs in the north.')),
        R('shared_stone_wall_frosted', 'material', 'the grey block walls of the yard, its towers and the gatehouse, snow on the battlements', (110, 50, 500, 110), True),
        R('shared_rock_cliff_snowy', 'material', 'the snowy rock cliffs under the yard, with small pines on them', (330, 640, 620, 900), True),
        R('shared_halftimber_bay', 'skin', 'timber-framed walls (dark beams and braces with pale panels) on the bunkhouse and houses', (190, 200, 420, 300), True),
        R('shipyard_gatehouse', 'skin', 'the gatehouse: two round towers with snowy conical roofs and lit windows, an arched gate between them, navy banners with a gold sun, lanterns by the gate',
          (605, 485, 918, 708),
          prompt=P('Wide (3:2)', 'skin', 'The shipyard gatehouse',
                   'Subject: the shipyard\'s gatehouse, seen flat from the front. Two round towers of grey stone '
                   'blocks with conical slate roofs under snow and one small lit window each, a crenellated wall '
                   'between them with a round-arched gateway, two iron lanterns glowing beside the gate, and a navy '
                   'banner with a gold sun and gold trim hanging on each tower. The whole gatehouse is in the picture.',
                   'The shipyard\'s gate at the head of the long bridge.')),
        R('shipyard_banner', 'skin', 'a navy banner with a gold sun, swallow-tailed, gold trim (on the gatehouse and the walls)',
          (630, 590, 674, 682),
          prompt=P('Tall (2:3)', 'skin', 'Shipyard sun banner',
                   'Subject: a hanging cloth banner, seen flat from the front, about 1 m wide and 2 m long: deep navy '
                   'cloth with a gold sun of straight and wavy rays in the middle, a thin gold border, and a '
                   'swallow-tailed lower edge, hung from a short dark pole. Soft folds only.',
                   'On the shipyard\'s gatehouse towers and north wall.')),
        R('shipyard_upper_house', 'skin', 'the tall timber-framed house north-west of the yard: stone ground floor, timber-framed upper floors, warm lit windows, steep snowy roof',
          (185, 85, 482, 332),
          prompt=P('Square', 'skin', 'Tall timber-framed house',
                   'Subject: a tall three-storey house, seen flat from the front: a ground floor of grey stone with a '
                   'wooden door and lit windows, two upper floors of dark timber framing with crossed braces and pale '
                   'panels, rows of small-paned windows glowing warm, and a steep slate roof with snow on it. The whole '
                   'house is in the picture.',
                   'The big house on the shipyard\'s west side.')),
        R('shipyard_bunkhouse_front', 'skin', 'Old Gil\'s bunkhouse: a long low timber-framed building with lit windows, arched wooden doors and a dormer',
          (265, 328, 498, 478),
          prompt=P('Wide (3:2)', 'skin', 'The bunkhouse',
                   'Subject: the shipyard\'s bunkhouse, seen flat from the front: a long, low timber-framed building on '
                   'a stone footing, with arched wooden doors, small-paned windows glowing warm, a little dormer window '
                   'in the snowy slate roof, and a lantern by the door. The whole building is in the picture.',
                   'Old Gil\'s bunkhouse, the shipyard\'s inn and rest spot.')),
        R('shipyard_forge_front', 'skin', 'the forge: an open-fronted timber shed with a stone hearth and a glowing fire, anvils and tools, snowy roof',
          (1098, 162, 1328, 358),
          prompt=P('Wide (3:2)', 'skin', 'The forge',
                   'Subject: the shipyard forge, seen flat from the front: two open bays under a snowy slate roof held '
                   'on dark timber posts and a timber-framed gable, a stone hearth in each bay with an orange fire, an '
                   'anvil and hanging tools. The fire glows inside; no light spills out. The whole forge is in the picture.',
                   'The forge on the shipyard\'s east side.')),
        R('shipyard_hall_front', 'skin', 'Pim\'s hall: a long building with two dormer windows in a snowy roof, green-painted panels and doors, warm windows',
          (1062, 362, 1312, 522),
          prompt=P('Wide (3:2)', 'skin', 'Pim\'s hall',
                   'Subject: a long one-storey hall, seen flat from the front: dark timber posts with green-painted '
                   'panels and double doors, small warm-lit windows, two little lanterns, and a slate roof under snow '
                   'with two gabled dormer windows. The whole building is in the picture.',
                   'Pim\'s shop on the shipyard\'s east side.')),
        R('shipyard_log_shed', 'prop', 'an open log shed: a lean-to roof over stacked log ends', (1330, 238, 1452, 362)),
        R('shipyard_ice_floe', 'skin', 'a flat floe of ice with snow on it, drifting in the sea (many of them, of many sizes)',
          (4, 698, 132, 784),
          prompt=P('Wide (3:2)', 'roof', 'Ice floe',
                   'Subject: one flat floe of sea ice, seen from straight above, about 4 m across: a slab with an '
                   'irregular, blocky outline and a thin dark edge where it sits in the water, its top covered in '
                   'pale blue-white snow with a few soft cracks. Night colours.',
                   'Floating in the sea round the shipyard, scaled and turned for variety.')),
        R('shipyard_slip_cradle', 'prop', 'the slipway: a wooden ramp on rails with a big timber cradle of curved ribs and posts, where the Magpie sits', (628, 85, 905, 472)),
        R('shipyard_crane', 'prop', 'a big wooden crane on iron wheels with a long jib, chain and hook (two by the slipway)', (518, 62, 650, 255)),
        R('shipyard_quay_crane', 'prop', 'the crane on the east quay', (1355, 515, 1495, 662)),
        R('shipyard_timber_stack', 'prop', 'stacked beams and logs on trestles', (895, 280, 965, 372)),
        R('shipyard_workbench', 'prop', 'a workbench with tools and timber', (560, 275, 628, 352)),
        R('shipyard_barrels_crates', 'prop', 'barrels and crates by the walls', (440, 105, 515, 152)),
        R('shipyard_lamp_post', 'prop', 'an iron lamp post with a glass lantern on top', (208, 398, 244, 468)),
        R('shipyard_tower_brazier', 'prop', 'an iron fire basket burning on top of a corner tower', (38, 78, 82, 138)),
        R('shipyard_mooring_posts', 'prop', 'thick wooden mooring posts with iron bands and rope, standing in the water', (170, 585, 300, 705)),
        R('shipyard_stone_stairs', 'prop', 'stone stairs down from the yard to the water', (1105, 540, 1255, 680)),
        R('shipyard_bridge', 'prop', 'the long stone bridge to the south: a cobbled deck between parapets, lamps on its pillars', (668, 700, 862, 1024)),
        R('shipyard_windows', 'light', 'warm lit windows on every house, the hall and the gatehouse towers', (300, 205, 390, 275)),
        R('shipyard_lamps', 'light', 'lanterns on lamp posts round the yard, the quays and both ends of the bridge', (675, 870, 705, 915)),
        R('shipyard_braziers', 'light', 'fires burning in baskets on top of the corner towers', (38, 78, 82, 138)),
        R('shipyard_forge_fire', 'light', 'the orange forge fires in the two hearths', (1150, 270, 1290, 345)),
        R('shipyard_sky', 'sky', 'no sky is painted: all round is the dark sea with ice floes to the horizon, under the north\'s night sky (see the crossroads sky)',
          (1240, 690, 1536, 1024)),
    ])

# ---------------------------------------------------------------------------------------------------------------------
PLACES['frozen-pass'] = dict(
    painting=WALK + '/walk-frozen-pass.png',
    name='The frozen pass',
    note=('A snowbound mountain road climbing north to Misthollow. A paved road, half buried in snow, runs straight up the '
          'middle and crosses a frozen river on a short stone crossing between four snow-capped pillars. The river is '
          'cracked plates of dark blue ice; to the east it falls down a frozen waterfall of ice columns and icicles. '
          'Everything else is deep snow, snow-capped dark rock columns and heavy snow-laden pines, with bare bushes and '
          'low mist in the hollows at the edges. South of the river: an iron lamp post with its lantern lit (the only '
          'warm light) and someone\'s abandoned sled with a crate, where the camp is.'),
    rows=[
        R('frozenpass_road_snowy', 'ground', 'the pass road: grey paving blocks with snow packed between them and drifting over the edges',
          (700, 560, 900, 1024), stand=(740, 820, 840, 900), squash=1.4,
          prompt=P('Square', 'ground', 'Snowy mountain road',
                   'Subject: an old paved mountain road under light snow, about 2.5 m across. Rounded, roughly '
                   'rectangular grey paving blocks in rows, snow packed into every joint and lying in small soft '
                   'patches over some blocks, spread evenly. Cold blue moonlit colours.',
                   'The road through the frozen pass.')),
        R('shared_snow', 'ground', 'deep soft snow: the ground everywhere off the road', (600, 800, 720, 920), True,
          stand=(648, 838, 704, 884), squash=1.3,
          prompt=P('Square', 'ground', 'Deep snow',
                   'Subject: deep, soft, undisturbed snow, about 3 m across. Gentle low drifts and hollows in pale '
                   'blue-white with soft lilac-blue shading, a faint sparkle, nothing poking through. Moonlit night '
                   'colours.',
                   'The snow-covered ground of the north: the frozen pass, Misthollow\'s terraces and anywhere deep in snow.')),
        R('shared_ice', 'ground', 'the frozen river: plates of dark blue ice with white cracks between them', (1100, 440, 1340, 640), True,
          stand=(1180, 540, 1290, 600), squash=1.5,
          prompt=P('Square', 'ground', 'Cracked river ice',
                   'Subject: a frozen river seen from above, about 3 m across. Flat plates of ice in deep blue and '
                   'paler blue, separated by thin, branching white cracks and seams, a few small air bubbles and '
                   'frosty patches inside the ice. No snow drifts, no rocks. Cold moonlit colours.',
                   'The frozen river of the pass, the crossroads\' frozen pond, and other frozen water in the north.')),
        R('shared_rock_cliff_snowy', 'material', 'dark grey rock in tall columns and blocks, snow heaped on every ledge',
          (60, 520, 300, 720), True, stand=(100, 560, 250, 700), squash=1.0,
          prompt=P('Square', 'material', 'Snowy rock cliff',
                   'Subject: the face of a dark grey rock cliff in winter, about 4 m across. Rough vertical columns '
                   'and blocks of rock with cracks between them, and soft caps of snow on the ledges, spread evenly '
                   'over the face. Moonlit blue night colours.',
                   'The rock outcrops and cliffs of the north: the pass, the crossroads\' corners, the shipyard\'s rock and Misthollow\'s cliffs.')),
        R('frozenpass_frozen_waterfall', 'skin', 'the frozen waterfall east of the road: ice columns and icicles down dark rock steps into the river',
          (1175, 95, 1425, 430),
          prompt=P('Square', 'skin', 'Frozen waterfall',
                   'Subject: a frozen waterfall, seen flat from the front, about 10 m tall: the falls caught in ice in '
                   'two steps over dark rock, thick pale-blue ice columns and long icicles hanging from each lip, snow '
                   'heaped on the rocks either side, and a frozen pool at its foot. The whole waterfall is in the picture.',
                   'The waterfall in the frozen pass\'s north-east corner.')),
        R('frozenpass_crossing_pillar', 'skin', 'one of the four tall stone pillars at the ends of the river crossing, capped with snow',
          (650, 292, 708, 528),
          prompt=P('Tall (2:3)', 'skin', 'Snowy crossing pillar',
                   'Subject: a tall square pillar of grey cut stone blocks, seen flat from the front, about 4 m tall, '
                   'with a stepped base and a squared cap, thick snow on the cap and on each ledge, frost in the '
                   'joints. The whole pillar is in the picture.',
                   'The four pillars at the ends of the frozen pass\'s river crossing.')),
        R('frozenpass_crossing', 'prop', 'the river crossing: the paved road carried over the ice between the four pillars', (650, 290, 892, 530)),
        R('frozenpass_lamp_post', 'prop', 'an iron lamp post with a lantern hung out on a curled bracket, lit', (572, 552, 628, 692)),
        R('frozenpass_sled', 'prop', 'an abandoned wooden sled with curled iron runners, a chain, and a crate beside it', (832, 588, 1000, 732)),
        R('frozenpass_snowy_boulder', 'prop', 'small dark rocks with snow caps, half buried', (836, 722, 892, 775)),
        R('frozenpass_rock_column', 'prop', 'a big outcrop of dark rock columns with a thick snow cap, pines round it', (280, 85, 485, 265)),
        R('shared_pine_snowy', 'plant', 'a dark pine weighed down with heavy snow on every branch', (1395, 530, 1536, 872), True,
          prompt=P('Tall (2:3)', 'plant', 'Snow-laden pine',
                   'Subject: one spruce-like pine, about 10 m tall, seen from the side, whole, with its trunk foot at '
                   'the bottom. Dark blue-green drooping branches in tiers, every tier heavy with thick soft snow, a '
                   'narrow pointed top. Moonlit night colours.',
                   'The pines of the frozen pass and Misthollow, and any snowy forest in the north.')),
        R('frozenpass_bare_bush_snowy', 'plant', 'a leafless bush with snow along its twigs', (912, 552, 1012, 658),
          prompt=P('Square', 'plant', 'Snowy bare bush',
                   'Subject: one leafless bush, about 1.5 m tall, seen from the side, whole, with its base at the '
                   'bottom. Thin dark brown branches and twigs, each with a line of snow on top, a little snow mound at '
                   'its foot. Night colours.',
                   'Scattered in the snow of the frozen pass.')),
        R('frozenpass_icicles', 'plant', 'a fringe of icicles hanging from a rock ledge', (330, 140, 388, 218),
          prompt=P('Wide (3:2)', 'plant', 'Icicle fringe',
                   'Subject: a fringe of icicles hanging from a short ledge of snow-capped rock, seen from the front, '
                   'about 1.5 m wide: pale blue, glassy icicles of mixed lengths, the longest about 1 m, hanging down. '
                   'The ledge is at the top of the picture.',
                   'Hung under rock ledges in the frozen pass and by the waterfall.')),
        R('frozenpass_lamp_light', 'light', 'the lit lantern on the lamp post: a pool of warm light on the snow, the only warm light in the pass', (560, 550, 690, 700)),
        R('frozenpass_mist', 'sky', 'low mist drifting between the snowy pines in the hollows at the map\'s edges', (0, 690, 150, 960)),
        R('frozenpass_sky', 'sky', 'beyond the pass: a full moon over jagged snowy peaks, dark pine slopes and a frozen river valley (from the frozen road fight painting)',
          (0, 0, 1448, 420), src=ART + '/backdrops/battle-frozen-road.png'),
    ])

# ---------------------------------------------------------------------------------------------------------------------
PLACES['misthollow'] = dict(
    painting=WALK + '/walk-misthollow.png',
    name='Misthollow',
    note=('A cold town of pale stone towers built up a mountainside above a sea of mist. A straight street of frosted setts, '
          'lined with lamp pillars and navy star banners, runs north up to the dead Moonwell. Halfway down it opens into '
          'the upper square (Sorrel\'s shop with its green awning on the west, the Lantern House inn on the east), then a '
          'great stone stair in three flights drops to the lower square and the way out south. Everything is pale grey '
          'block stone with snow on every ledge and balustrade; roofs are blue slate with snow along the edges; arched '
          'bridges, stairs and terraces climb the cliffs; snowy pines grow between. Warm light comes only from the lamp '
          'pillars, the shop window and the inn.'),
    rows=[
        R('shared_setts_frosted', 'ground', 'the street and squares: squared grey-blue setts with frost in the joints',
          (560, 800, 760, 940), True, stand=(600, 830, 720, 900), squash=1.4,
          prompt=P('Square', 'ground', 'Frosted stone setts',
                   'Subject: a town street paved with stone setts, about 2.5 m across. Small, squared, slightly domed '
                   'grey-blue stones of even size laid in tight running rows, white frost in the narrow joints and a '
                   'faint frosting on the stones. Cold moonlit colours.',
                   'The streets and squares of Misthollow, the street up to the Moonwell, and other paved northern streets.')),
        R('shared_snow', 'ground', 'snow drifts on the terraces, ledges and the edges of the squares', (240, 540, 330, 600), True),
        R('misthollow_diamond_inlay', 'skin', 'a diamond of pale stone set into the street with a small star in it (there are several up the street)',
          (732, 615, 800, 680),
          prompt=P('Square', 'roof', 'Street star inlay',
                   'Subject: a decorative inlay set into a paved street, seen from straight above, about 1.5 m across: '
                   'a diamond outlined in pale cut stone with a smaller diamond inside it and a small four-pointed '
                   'star at the centre, the setts of the street round it. The whole inlay is in the picture.',
                   'Set into Misthollow\'s main street and lower square.')),
        R('misthollow_roof_blue_slate', 'material', 'blue slate roofs with snow lying along their ridges and eaves',
          (1040, 410, 1180, 495), stand=(1046, 424, 1136, 474), squash=1.0,
          prompt=P('Square', 'material', 'Blue slate roof',
                   'Subject: a roof of small rectangular slates, seen straight on, about 2 m across. Deep blue to '
                   'indigo slates in even overlapping rows, slightly varied in tone, a light frosting on them. Moonlit '
                   'night colours.',
                   'The roofs of Misthollow\'s houses and the cones of its towers.')),
        R('shared_stone_wall_frosted', 'material', 'the pale grey block stone of every wall, tower and stair', (330, 90, 450, 200), True),
        R('shared_rock_cliff_snowy', 'material', 'the snowy rock cliffs the town is built on', (60, 620, 260, 900), True),
        R('shared_roof_slate_snow', 'material', 'some smaller roofs with snow on every slate', (370, 380, 560, 480), True),
        R('shared_halftimber_bay', 'skin', 'a bay of timber-framed wall: dark beams and braces with grey stone infill (the Lantern House\'s upper floor)',
          (1036, 494, 1182, 618), True,
          prompt=P('Wide (3:2)', 'skin', 'Timber-framed wall bay',
                   'Subject: one section of a timber-framed upper floor, seen flat from the front, about 4 m wide and '
                   '2.5 m tall: dark oak posts and a beam top and bottom, diagonal braces, small grey stone or pale '
                   'plaster panels between them, and two small-paned windows glowing warm. The whole section is in the '
                   'picture, beams at its edges.',
                   'Repeated bay by bay on the north\'s timber-framed houses: the shipyard\'s houses and Misthollow\'s Lantern House.')),
        R('misthollow_sorrel_shop', 'skin', 'Sorrel\'s shop: a stone front with a green awning over a glowing window of potion bottles, an arched door with a lamp',
          (365, 470, 585, 612),
          prompt=P('Wide (3:2)', 'skin', 'Sorrel\'s shop front',
                   'Subject: a witch\'s shop front, seen flat from the front: a pale grey stone wall with a wide window '
                   'under a dark green scalloped awning, rows of glowing green and amber potion bottles and jars on '
                   'shelves behind the glass, an arched wooden door beside it with an iron lantern over it, and snow '
                   'on the sill. The whole shop front is in the picture.',
                   'Sorrel\'s shop on Misthollow\'s upper square.')),
        R('misthollow_lantern_house', 'skin', 'the Lantern House inn: stone ground floor with an arched door and a lantern, timber-framed upper floor, warm windows, snowy blue roof, a hanging sign',
          (925, 398, 1190, 655),
          prompt=P('Square', 'skin', 'The Lantern House',
                   'Subject: the Lantern House inn, seen flat from the front: a grey stone ground floor with an arched '
                   'wooden door under a timber porch and a lantern, a timber-framed upper floor with warm small-paned '
                   'windows, a blue slate roof with snow along it and two stone chimneys, and a round hanging inn sign '
                   'on a bracket. The whole building is in the picture.',
                   'The inn on Misthollow\'s upper square, the last with a fire lit.')),
        R('misthollow_banner', 'skin', 'a navy banner with a white eight-pointed star, on an iron pole (along the street and the stairs)',
          (566, 712, 608, 828),
          prompt=P('Tall (2:3)', 'skin', 'Misthollow star banner',
                   'Subject: a hanging cloth banner, seen flat from the front, about 0.8 m wide and 2 m long: deep '
                   'navy cloth with a white eight-pointed star in the middle, a thin pale border, and a pointed lower '
                   'edge, hung from a black iron crossbar on a pole with a small finial. Soft folds only.',
                   'Along Misthollow\'s street, the great stair and the lower square.')),
        R('misthollow_tower', 'skin', 'a tall tower of pale stone with arched windows and a cone roof of blue slate edged in snow',
          (330, 0, 452, 268),
          prompt=P('Tall (2:3)', 'skin', 'Misthollow tower',
                   'Subject: a tall many-sided tower of pale grey stone blocks, seen flat from the front: narrow '
                   'arched windows, a stone band below the top, and a steep cone roof of blue slates with snow along '
                   'its eaves and ridges. The whole tower is in the picture.',
                   'The towers of Misthollow.')),
        R('misthollow_chapel_front', 'skin', 'the small chapel: a steep stone gable with an arched window and arched door, steps up to it',
          (522, 60, 642, 332),
          prompt=P('Tall (2:3)', 'skin', 'The chapel front',
                   'Subject: a small chapel, seen flat from the front: a steep gable of pale grey stone blocks with a '
                   'blue slate roof edged in snow, one tall arched window, an arched wooden door with three stone steps '
                   'up to it. The whole chapel front is in the picture.',
                   'The chapel north-west of Misthollow\'s street.')),
        R('misthollow_arch_bridge', 'skin', 'an arched stone bridge with a balustrade, spanning a gap in the cliffs',
          (75, 188, 252, 378),
          prompt=P('Square', 'skin', 'Arched stone bridge',
                   'Subject: a short stone bridge, seen flat from the side: one tall round arch of pale grey stone '
                   'blocks on square piers, a balustrade of small stone posts along its top with snow on the rail, and '
                   'a square pillar with a stone finial at each end. Through the arch is plain background. The whole '
                   'bridge is in the picture.',
                   'The bridges between Misthollow\'s terraces.')),
        R('misthollow_balustrade', 'skin', 'a stone balustrade: small posts under a rail, snow on top (along every terrace and stair)',
          (100, 190, 228, 234),
          prompt=P('Wide (3:2)', 'skin', 'Snowy stone balustrade',
                   'Subject: a stretch of stone balustrade, seen flat from the front, about 3 m long and 1 m tall: a '
                   'row of small turned stone posts between a base and a flat rail, a square pillar at each end, a '
                   'line of snow along the rail. The whole stretch is in the picture.',
                   'Along Misthollow\'s terraces, stairs and the edges of its squares.')),
        R('misthollow_great_stair', 'prop', 'the great stair: three flights of stone steps between the squares, with gateposts', (430, 690, 1100, 800)),
        R('misthollow_lamp_pillar', 'prop', 'a square stone pillar with an iron lantern on top', (574, 628, 616, 706)),
        R('misthollow_barrels_crates', 'prop', 'barrels, a crate and a banner\'s foot under the great stair, snow on their lids', (525, 768, 634, 832)),
        R('misthollow_bench', 'prop', 'a wooden bench by the west stairs', (322, 580, 376, 626)),
        R('misthollow_frozen_trough', 'prop', 'a small frozen trough with a tub beside it (a letter in a jar is under the ice)', (360, 822, 420, 880)),
        R('misthollow_wagon_wheels', 'prop', 'big wooden wagon wheels set against the south wall, with an iron railing', (580, 975, 650, 1024)),
        R('misthollow_inn_sign', 'prop', 'the Lantern House\'s round hanging sign on its bracket', (925, 568, 980, 632)),
        R('misthollow_finial_pillar', 'prop', 'a square stone gatepost with a round stone finial', (1066, 665, 1100, 832)),
        R('misthollow_bare_tree_frosted', 'plant', 'a bare tree with snow along its branches', (628, 98, 714, 218),
          prompt=P('Tall (2:3)', 'plant', 'Frosted bare tree',
                   'Subject: one leafless tree, about 5 m tall, seen from the side, whole, with its base at the bottom. '
                   'A dark trunk and spreading crooked branches, each branch and twig lined with white snow. Moonlit '
                   'night colours.',
                   'Beside Misthollow\'s street.')),
        R('shared_pine_snowy', 'plant', 'snow-laden pines between the buildings and on the cliffs', (1100, 660, 1150, 800), True),
        R('misthollow_lamps', 'light', 'the lanterns on the stone pillars all along the street, the squares and the stair', (574, 628, 616, 706)),
        R('misthollow_shop_glow', 'light', 'the warm glow of Sorrel\'s shop window', (380, 510, 500, 600)),
        R('misthollow_inn_windows', 'light', 'the Lantern House\'s warm windows and door lantern', (1040, 500, 1130, 630)),
        R('misthollow_mist_sea', 'sky', 'the sea of mist far below the town, with snowy pine slopes dropping into it (east and west edges)', (1330, 560, 1536, 1010)),
        R('misthollow_sky', 'sky', 'above the town: an eclipsed moon over great snowy peaks, Misthollow\'s spires and arched bridges in the mist (from the dead Moonwell fight painting)',
          (0, 0, 1448, 380), src=ART + '/battle-backgrounds/14-ironhold-misthollow-dead-moonwell.png'),
    ])

# ---------------------------------------------------------------------------------------------------------------------
PLACES['moonwell'] = dict(
    painting=WALK + '/walk-misthollow-moonwell.png',
    name='The dead Moonwell',
    note=('The round court above Misthollow where the final battle happens. A wide court of frosted setts laid in sweeping '
          'arcs surrounds the dead Moonwell on its ringed dais: a big round well whose mouth is black and empty, with a '
          'carved band of crescent moons and a moth round its side and a twisted iron frame over it. The north keep\'s '
          'arched door, two round crenellated towers, and pale grey stone buildings with snowy slate roofs ring the '
          'court; navy banners with pale crescent moons hang on the towers. The only way in is up the steps from the '
          'south street, between two iron fire bowls (the only warm light) and two iron gateposts. Small walled gardens '
          'with frosted bare shrubs and thin snow fill the corners. Everything is cold and blue; no window is lit.'),
    rows=[
        R('moonwell_court_setts', 'ground', 'the court\'s paving: frosted grey setts laid in sweeping arcs',
          (520, 200, 700, 330), stand=(560, 222, 660, 300), squash=1.3,
          prompt=P('Square', 'ground', 'Arc-laid court setts',
                   'Subject: a court paved with small squared stone setts laid in overlapping sweeping arcs (a fan '
                   'pattern), about 3 m across, the arcs small and even so the pattern repeats many times in the '
                   'square. Grey-blue stones, frost in the joints and a faint frosting on top. Cold moonlit colours.',
                   'The round court of the dead Moonwell.')),
        R('shared_setts_frosted', 'ground', 'the street up from Misthollow: straight rows of frosted setts', (690, 840, 850, 1024), True),
        R('moonwell_garden_frost', 'ground', 'the little gardens: dark earth under a thin broken layer of snow',
          (170, 950, 450, 1024), stand=(330, 975, 440, 1024), squash=1.4,
          prompt=P('Square', 'ground', 'Frosted garden earth',
                   'Subject: the bare earth of a winter garden bed, about 2 m across. Dark soil and a few dead leaves '
                   'under a thin, broken crust of snow and frost, small even patches of white over blue-black earth, '
                   'no plants. Cold moonlit colours.',
                   'The walled garden beds in the corners of the Moonwell\'s court.')),
        R('shared_stone_wall_frosted', 'material', 'the pale grey block walls of the court, its towers and buildings, snow on every top',
          (100, 700, 260, 800), True, stand=(145, 715, 218, 792), squash=1.0,
          prompt=P('Square', 'material', 'Frosted castle stone',
                   'Subject: a castle wall of cut stone blocks, seen straight on, about 2.5 m across. Rectangular pale '
                   'grey and grey-blue blocks of slightly varied sizes in even mortared courses, chipped edges, white '
                   'frost in the joints. Moonlit night colours.',
                   'The walls, towers and buildings of the north: the dead Moonwell, Misthollow, the shipyard and the crossroads\' ruins.')),
        R('shared_roof_slate_snow', 'material', 'the side buildings\' slate roofs, dark blue speckled with snow', (0, 150, 140, 300), True),
        R('moonwell_dead_well', 'skin', 'the dead Moonwell: a big round stone well on a ringed dais, its mouth black and empty, a carved band of crescent moons and a moth round it, a twisted iron frame with a ring and chains over it',
          (590, 238, 950, 565),
          prompt=P('Square', 'skin', 'The dead Moonwell',
                   'Subject: the dead Moonwell, seen flat from the side: a wide round well of pale grey fitted stones '
                   'on a low round dais of two stone steps, a carved band round its side showing crescent moons and a '
                   'moth with spread wings in the middle, its rim of big curved stones. Over it a dark iron frame: two '
                   'posts with spiked finials joined by a twisted, branch-like iron arch, with an iron ring and two '
                   'hanging chains. A little frost on the stones. The well is dead: no light. The whole well is in the picture.',
                   'The centre of the dead Moonwell\'s court, where the final battle is.')),
        R('moonwell_well_carving', 'skin', 'the carved band round the well: crescent moons and a moth with spread wings',
          (650, 458, 890, 545),
          prompt=P('Wide (3:2)', 'skin', 'The Moonwell\'s carved band',
                   'Subject: a stretch of carved stone band, seen flat from the front, about 3 m long and 0.8 m tall: '
                   'dark grey-blue stone with a moth with spread wings carved in the middle and crescent moons either '
                   'side, between thin moulded edges, worn and frosted. The whole stretch is in the picture.',
                   'Wrapped round the side of the dead Moonwell.')),
        R('moonwell_north_door', 'skin', 'the north keep\'s front: a tall pointed arched double door, steps up to it, stone pillars with finials, crescent banners either side',
          (598, 0, 942, 210),
          prompt=P('Wide (3:2)', 'skin', 'The Moonwell\'s north door',
                   'Subject: the front of a keep, seen flat from the front: pale grey stone wall with a tall pointed '
                   'arched doorway with a carved stone surround and a dark double wooden door with iron rings, four '
                   'stone steps up to it, a stone pillar with a spiked iron finial each side, and a navy banner with a '
                   'pale crescent moon hanging on the wall either side. The whole front is in the picture.',
                   'The north side of the dead Moonwell\'s court.')),
        R('moonwell_round_tower', 'skin', 'a round crenellated tower of pale stone with narrow arched windows and a crescent banner',
          (265, 428, 442, 848),
          prompt=P('Tall (2:3)', 'skin', 'Round court tower',
                   'Subject: a round tower of pale grey stone blocks, seen flat from the front: crenellated top with '
                   'snow on the merlons, a moulded band below them and another lower down, narrow arched windows, and a '
                   'navy banner with a pale crescent moon hung from an iron bar. The whole tower is in the picture.',
                   'The two round towers by the dead Moonwell\'s entrance.')),
        R('moonwell_banner', 'skin', 'a navy banner with a pale crescent moon and a little silver pattern at the top',
          (326, 558, 384, 712),
          prompt=P('Tall (2:3)', 'skin', 'Crescent moon banner',
                   'Subject: a hanging cloth banner, seen flat from the front, about 1 m wide and 2.5 m long: deep '
                   'navy cloth with a pale silver crescent moon low in the middle, a small faint silver pattern near '
                   'the top, and a swallow-tailed lower edge, hung from a black iron bar. Soft folds only.',
                   'On the towers and walls of the dead Moonwell\'s court.')),
        R('moonwell_tower_door', 'skin', 'an arched wooden tower door in a carved stone surround', (376, 158, 458, 274),
          prompt=P('Tall (2:3)', 'skin', 'Arched tower door',
                   'Subject: a doorway, seen flat from the front: a pointed arch of pale cut stone blocks round a dark '
                   'wooden double door with iron bands and ring handles, a stone step at its foot, a little frost on '
                   'the stones. The whole doorway is in the picture.',
                   'The doors of the towers and buildings round the dead Moonwell\'s court.')),
        R('moonwell_brazier', 'prop', 'an iron fire bowl burning on a stone pillar (one each side of the steps)', (618, 678, 674, 742)),
        R('moonwell_iron_gatepost', 'prop', 'a tall black iron gatepost with a spiked finial', (538, 608, 582, 752)),
        R('moonwell_finial_pillar', 'prop', 'a square stone gatepost with a stone finial, by the street', (563, 798, 612, 968)),
        R('moonwell_stone_planter', 'prop', 'a round stone planter holding a frosted bare shrub', (300, 188, 356, 284)),
        R('moonwell_small_well', 'prop', 'a small round stone well in the west garden', (188, 788, 254, 852)),
        R('moonwell_pots', 'prop', 'clay pots and a barrel by the doors', (600, 158, 634, 202)),
        R('moonwell_frosted_shrub', 'plant', 'a bare shrub whose every twig is white with frost', (198, 502, 278, 652),
          prompt=P('Tall (2:3)', 'plant', 'Frost-white shrub',
                   'Subject: one leafless shrub, about 2 m tall, seen from the side, whole, with its base at the bottom. '
                   'Many thin dark upright twigs, each furred with white frost and tiny snow flecks, a small snowy '
                   'mound at its foot. Cold moonlit colours.',
                   'In the gardens and planters round the dead Moonwell\'s court.')),
        R('moonwell_brazier_fire', 'light', 'the two fire bowls at the top of the steps: the only warm light in the court', (618, 678, 674, 742)),
        R('moonwell_sky', 'sky', 'above the court: an eclipsed moon over great snowy peaks, Misthollow\'s spires and arched bridges in the mist (from the dead Moonwell fight painting)',
          (0, 0, 1448, 380), src=ART + '/battle-backgrounds/14-ironhold-misthollow-dead-moonwell.png'),
    ])
