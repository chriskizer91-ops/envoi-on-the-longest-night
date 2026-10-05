# Map callouts for the guide. Positions are the game's own (maps.js / items.js, 1536 x 1024 painting pixels).
# kind: k keepsake, s secret keepsake, r rest & save, f story fight, p person, l letter well, x exit, m the Magpie, n Ember Line node
W, H = 1536, 1024

def ex(rect):
    x0, y0, x1, y1 = rect
    return ((x0 + x1) / 2, (y0 + y1) / 2)

MAPS = {
  'cottage': ('wickhollow-cottage', "Io's cottage", [
    ('r', (838, 470), "<b>Home.</b> Io’s bed. Rest &amp; save. You wake here after losing the first fight."),
    ('l', (592, 466), "<b>The letters.</b> Io’s bundle of letters to the dead. Read it once; it pays off at the end."),
    ('x', ex([500, 0, 604, 20]), "<b>North lane</b> up to Wickhollow’s square. The only way out."),
    ('x', ex([680, 1004, 812, 1024]), "<b>South road</b> (closed). Io turns back: “That road runs on for days…”"),
    ('x', ex([0, 397, 18, 442]), "<b>West footbridge</b> (closed)."),
    ('x', ex([1516, 704, 1536, 770]), "<b>East forest path</b> (closed)."),
  ]),
  'wickhollow': ('wickhollow-square', 'Wickhollow', [
    ('f', (800, 640), "<b>THE FIRST FIGHT.</b> Step anywhere south or east of the Moonwell and Mayor Gretch runs up. Io fights a Shadow Wraith alone."),
    ('p', (568, 426), "<b>Nettie’s herbs.</b> Band-1 prices for the whole game. After Sol joins, she gives Io the <b>Knotted Shawl</b>."),
    ('p', (1015, 364), "<b>Hilde</b>, the smith."),
    ('p', (705, 594), "<b>Mayor Gretch.</b> Inside the fight zone: talk to her after the first fight."),
    ('r', (777, 530), "<b>The Moonwell.</b> Rest &amp; save, after the first fight. Lunara sleeps here."),
    ('s', (458, 562), "<b>SECRET: the Crescent Locket</b>, on the red roof’s ridge. Reachable <b>before</b> the first fight."),
    ('k', (1195, 690), "<b>The Forge Horseshoe</b>, in the nook behind the house by the east bridge. After the first fight."),
    ('x', ex([1514, 354, 1536, 396]), "<b>East bridge</b> to the Thornwood. Shut until Quill hands over the Magpie."),
    ('x', ex([0, 706, 18, 760]), "<b>West, down the stairs</b> to the jetty."),
    ('x', ex([745, 1006, 816, 1024]), "<b>South road</b> down to Io’s cottage."),
  ]),
  'jetty': ('wickhollow-jetty', 'The jetty', [
    ('p', (1150, 385), "<b>Quill.</b> Sells herbs (band 1) until Bogmire’s lamps come back. Talk to him after Sol joins to get the Magpie."),
    ('m', (768, 760), "<b>The Magpie</b>, at the end of the pier, once she’s yours."),
    ('k', (470, 372), "<b>The Jetty Coin</b>, far west under the willows. 10% off every herb. Reachable before the first fight."),
    ('x', ex([706, 0, 830, 20]), "<b>North lane</b> up to Wickhollow."),
  ]),
  'thornwood': ('thornwood', 'The Thornwood', [
    ('l', (1010, 336), "<b>The moon stone.</b> Letter well: Aldo’s letter and a Moonpetal."),
    ('k', (1380, 190), "<b>The Thornwood Frog-Ring</b>, end of the north-east trail from the moon stone’s clearing."),
    ('s', (1284, 816), "<b>SECRET: the Warden’s Brooch</b>, at the dead end of the dark south trail."),
    ('x', (955, 640), "<b>Where the south trail starts:</b> it drops off the lower arm of the road, past the thicket."),
    ('x', ex([0, 400, 18, 462]), "<b>West</b> to Wickhollow."),
    ('x', ex([1518, 504, 1536, 562]), "<b>East</b> to Bogmire."),
  ]),
  'bogmire': ('bogmire', 'Bogmire', [
    ('p', (652, 470), "<b>Old Wenna’s herbs.</b> Band-1 prices all game."),
    ('p', (744, 354), "<b>Pell.</b> Points you up the long walk north."),
    ('r', (1208, 281), "<b>The Lanternless Inn</b> (Tobb). Rest &amp; save."),
    ('l', (711, 866), "<b>The water stair.</b> Letter well: Pell’s letter to Mam and <b>120 shards</b>."),
    ('k', (540, 240), "<b>The Bogmire Hag-Stone.</b> Up the north-west house’s stair, east along the porch walk. Makes hidden glints shine."),
    ('k', (1420, 750), "<b>The Bogstriders</b>, east end of the south-east dock."),
    ('p', (190, 560), "<b>Quill</b>, after the lights: sells the <b>Bogmire refit</b> (level 5, 650 shards)."),
    ('m', (84, 352), "<b>The Magpie</b> ties up at the west dock after the lights."),
    ('x', ex([765, 0, 814, 18]), "<b>The long walk north</b> to the fen’s dark heart."),
    ('x', ex([34, 341, 52, 391]), "<b>West</b> back to the Thornwood."),
  ]),
  'bogmire-heart': ('bogmire-heart', "The fen's dark heart", [
    ('f', (772, 460), "<b>BOSS: the great wraith</b> (level 5). Step into the square."),
    ('k', (775, 215), "<b>The Fen-Heart Lamp</b>, by the drowned hall’s door. Only after the great wraith."),
    ('x', ex([727, 1006, 810, 1024]), "<b>South</b> back to Bogmire."),
  ]),
  'warm-roads-camp': ('warm-roads-camp', 'The Warm Roads camp', [
    ('m', (318, 425), "<b>Landing ground.</b> The Magpie sets down here."),
    ('r', (790, 500), "<b>The camp fire.</b> Rest &amp; save. No fights in camps."),
    ('x', ex([1518, 412, 1536, 494]), "<b>East</b> to the Ember Line road."),
  ]),
  'ember-line-road': ('ember-line-road', 'The Ember Line road', [
    ('n', (240, 248), "<b>Node 1</b>, in the ring of standing stones up the west side path. 300 shards."),
    ('n', (585, 484), "<b>Node 2</b>, beside the road by the bridge. 300 shards."),
    ('n', (1313, 160), "<b>Node 3</b>, on the rise at the end of the east side path. 300 shards."),
    ('x', ex([0, 556, 18, 630]), "<b>West</b> to the Warm Roads camp."),
    ('x', ex([952, 0, 1036, 18]), "<b>North</b> to the forest road."),
  ]),
  'dawnroost-road': ('dawnroost-forest-road', 'The forest road to Dawnroost', [
    ('x', ex([678, 0, 836, 18]), "<b>North</b> to Dawnroost’s south gate."),
    ('x', ex([936, 1006, 1092, 1024]), "<b>South</b> to the Ember Line road."),
  ]),
  'dawnroost': ('dawnroost', 'Dawnroost', [
    ('p', (376, 462), "<b>Marta</b>, at the Warden hall. Gives Sol the <b>Wardens’ Hall Gauntlets</b>."),
    ('r', (340, 447), "<b>The Warden hall.</b> Rest &amp; save."),
    ('p', (880, 478), "<b>Tamsin.</b>"),
    ('l', (788, 634), "<b>The yard well.</b> Marta’s letter and a Lavender."),
    ('p', (1084, 690), "<b>Brann’s forge.</b> Herbs (band 2) and <b>the charge</b> (level 10, 2,300 shards)."),
    ('k', (215, 232), "<b>The Dawnroost Kettle-Helm</b>, west end of the wall-walk behind the hall."),
    ('m', (1400, 300), "<b>The Warden dock.</b> The Magpie moors here."),
    ('x', ex([590, 0, 648, 18]), "<b>North gate</b> to the living node."),
    ('x', ex([592, 1006, 690, 1024]), "<b>South gate</b> to the forest road."),
  ]),
  'dawnroost-node': ('dawnroost-node', "Dawnroost's living node", [
    ('f', (770, 420), "<b>GATE FIGHT: three wraiths</b> (level 12). Envoi is made when you win."),
    ('k', (205, 135), "<b>The Node Sunstone</b>, top of the west stair. After the fight."),
    ('x', (1260, 620), "<b>The hidden nook</b> behind the weapon stall. Empty."),
    ('x', ex([699, 1004, 836, 1024]), "<b>South</b> back to Dawnroost."),
  ]),
  'northern-camp': ('northern-camp', 'The northern camp', [
    ('m', (336, 455), "<b>Landing ground.</b>"),
    ('r', (790, 446), "<b>The camp fire.</b> Rest &amp; save. You wake here after losing at the crossroads in the Gate 15 chapter."),
    ('x', ex([1518, 489, 1536, 543]), "<b>East</b> to Eldergrove’s edge."),
  ]),
  'eldergrove-edge': ('eldergrove-edge', "Eldergrove's edge", [
    ('x', ex([0, 436, 18, 504]), "<b>West</b> to the northern camp."),
    ('x', ex([1518, 556, 1536, 630]), "<b>East</b> to the cold moor."),
  ]),
  'cold-moor': ('cold-moor', 'The cold moor', [
    ('x', ex([0, 510, 18, 622]), "<b>West</b> to Eldergrove’s edge."),
    ('x', ex([1518, 517, 1536, 605]), "<b>East</b> to the crossroads’ west road."),
  ]),
  'crossroads': ('northern-crossroads', 'The northern crossroads', [
    ('f', (770, 470), "<b>STORY FIGHT: the Gloam Knight.</b> She steps out when you enter the stone ring. You can’t get round it."),
    ('l', (570, 598), "<b>The crossroads well.</b> Ennis’s letter and a Silver Mugwort. After the ambush."),
    ('k', (1395, 470), "<b>The Crossroads Pennant</b>, tied to a waymark far down the east road."),
    ('x', ex([0, 440, 18, 530]), "<b>West road</b>, from the cold moor. You arrive here."),
    ('x', ex([706, 0, 830, 18]), "<b>North road</b> to the shipyard."),
    ('x', ex([678, 1004, 852, 1024]), "<b>South road</b> (closed): “days on foot.”"),
    ('x', ex([1518, 438, 1536, 538]), "<b>East road</b> (closed): “Nothing crosses them on foot.”"),
  ]),
  'shipyard': ('shipyard', 'The shipyard', [
    ('p', (765, 500), "<b>Ysmera Brightkeel.</b> Gives Io the <b>Moonglass</b>; fits the moon-sail (level 15, 4,500 shards)."),
    ('p', (436, 482), "<b>Old Gil.</b> The bunkhouse next to him: rest &amp; save."),
    ('p', (1000, 400), "<b>Tock</b>, gnome shipwright."),
    ('p', (1189, 532), "<b>Pim’s herbs</b> (band 3)."),
    ('k', (170, 640), "<b>The Dockhand’s Gloves</b>, end of the west pier, down in the cove."),
    ('m', (764, 240), "<b>The Magpie</b>, up on the slip."),
    ('x', ex([708, 1004, 810, 1024]), "<b>South</b> over the bridge to the crossroads."),
  ]),
  'frozen-camp': ('frozen-camp', 'The frozen camp', [
    ('m', (306, 442), "<b>Landing ground.</b>"),
    ('r', (800, 478), "<b>The camp fire.</b> Rest &amp; save."),
    ('x', ex([1518, 524, 1536, 616]), "<b>East</b> to Frostmere’s shore."),
  ]),
  'frostmere-shore': ('frostmere-shore', "Frostmere's shore", [
    ('x', ex([0, 589, 18, 657]), "<b>West</b> to the frozen camp."),
    ('x', ex([740, 0, 812, 18]), "<b>North</b> to the frozen pass."),
  ]),
  'frozen-pass': ('frozen-pass', 'The frozen pass', [
    ('k', (615, 625), "<b>The Pass Bell</b>, in the snow under the lamp on the west verge."),
    ('r', (840, 672), "<b>The sled camp.</b> Rest &amp; save, right across the road."),
    ('x', ex([684, 0, 864, 18]), "<b>North</b> to Misthollow."),
    ('x', ex([674, 1006, 902, 1024]), "<b>South</b> to Frostmere’s shore."),
  ]),
  'misthollow': ('misthollow', 'Misthollow', [
    ('p', (480, 630), "<b>Sorrel’s herbs</b> (band 4, the dearest in the game)."),
    ('p', (962, 676), "<b>Ede</b>, at the Lantern House. Gives Sol the <b>Hearth-Coal</b>."),
    ('r', (1000, 662), "<b>The Lantern House.</b> Rest &amp; save."),
    ('p', (700, 802), "<b>The watchwoman.</b>"),
    ('l', (386, 890), "<b>A frozen trough.</b> The children’s letter to the Moon and a Nightrose."),
    ('k', (135, 245), "<b>The Misthollow Cowl</b>, end of the balcony bridge up the west stairs. Halves Frost."),
    ('x', ex([712, 0, 818, 18]), "<b>North</b>, up the street to the dead Moonwell."),
    ('x', ex([670, 1006, 860, 1024]), "<b>South</b> to the frozen pass."),
  ]),
  'moonwell': ('misthollow-moonwell', 'The dead Moonwell', [
    ('f', (768, 728), "<b>FINAL BOSS: Noctara &amp; Halcyon.</b> The head of the steps, between the braziers."),
    ('x', (768, 300), "<b>The court.</b> Walkable only after the ending."),
    ('x', ex([660, 1006, 876, 1024]), "<b>South</b> back to Misthollow."),
  ]),
}

def render(mid, extra=''):
    img, title, marks = MAPS[mid]
    pins, items = [], []
    for i, (k, (x, y), text) in enumerate(marks, 1):
        px = min(97.0, max(3.0, x / W * 100)); py = min(95.5, max(4.5, y / H * 100))
        pins.append('<button type="button" class="pin %s" style="left:%.2f%%;top:%.2f%%" data-n="%d" aria-label="Callout %d">%d</button>' % (k, px, py, i, i, i))
        items.append('<li data-n="%d"><span class="pin %s">%d</span><span>%s</span></li>' % (i, k, i, text))
    return ('<div class="map" data-map="%s"><div class="plate"><div class="inner"><img src="{{img:maps/%s.webp}}" alt="%s, the game’s painted map" loading="lazy" width="1024" height="683">'
            '<span class="title">%s</span>%s</div></div><div class="side"><ol class="legend">%s</ol>%s</div></div>') % (mid, img, title, title, ''.join(pins), ''.join(items), extra)
