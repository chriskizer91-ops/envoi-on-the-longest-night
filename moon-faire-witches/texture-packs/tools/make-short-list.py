# make-short-list.py: python3 moon-faire-witches/texture-packs/tools/make-short-list.py docs/art-requests/15-3d-world-textures-short-list.md
# Builds docs/art-requests/15-3d-world-textures-short-list.md: the short list of pictures that would make the 3D world
# look better, from the reskin of all four zones (November 17, 2026). The rules are the same words as rounds one and
# two used (moon-faire-witches/texture-packs/tools/build_prompts.py), so the pictures come out in the same hand.
import sys
END = "- No text, no letters, no border and no signature."
MATERIAL = """Paint a square, seamless material texture for a hand-painted fantasy game, in the same painterly style, brushwork and colours as the attached pictures.
- Seen straight on and flat, filling the whole picture edge to edge. No perspective.
- Seamless: the left edge must continue into the right edge, and the top edge into the bottom edge, so the square can repeat without a visible join.
- Even, flat light. No lamp glow, no bright patch, no vignette and no cast shadows. Only soft folds or grain.
- Only the material itself: no objects, no poles, no ropes, no ground and no sky.
- Even spread: nothing noticeably bigger, brighter or darker than the rest, because the square repeats many times.
""" + END
FRAME = """Paint a square material texture of a timber-framed wall for a hand-painted fantasy game, in the same painterly style, brushwork and colours as the attached pictures. Keep the SAME LAYOUT as the attached timber-framed wall texture, so the two can be swapped on a house.
- Seen straight on and flat, filling the whole picture edge to edge. No perspective.
- The layout, exactly: two bays across and two rows up. An upright post down the left edge, one down the middle and one down the right edge (the edge posts are half in the picture, so they join into whole posts when the picture repeats). A beam along the top edge, a rail across the middle and a beam along the bottom edge (the edge beams half in the picture too).
- Seamless: the left edge must continue into the right edge, and the top edge into the bottom edge.
- Even, flat light. No lamp glow, no bright patch, no vignette and no cast shadows.
- No windows, no doors, no objects, no ground and no sky.
""" + END
SKIN = """Paint one flat view of a single object for a hand-painted fantasy game, in the same painterly style, brushwork and colours as the attached pictures.
- A flat, straight-on view with no perspective, like an architect's elevation drawing but fully painted.
- The whole object inside the picture, centred, with a small margin all round.
- Background: one plain flat mid-grey (#808080) with nothing in it. No ground, no grass, no sky, no cast shadow and no other objects.
- Even, soft light from the front. Glass may glow, but no light may spill onto the background.
""" + END
FACE = """Paint a square picture of one flat face of an object for a hand-painted fantasy game, in the same painterly style, brushwork and colours as the attached pictures.
- Seen straight on and flat, filling the whole picture edge to edge. No perspective, no background showing.
- Even, flat light. No lamp glow, no bright patch, no vignette and no cast shadows.
""" + END
PLANT = """Paint one plant for a hand-painted fantasy game, in the same painterly style, brushwork and colours as the attached pictures.
- Seen from the side, whole, with the foot of its stem (or the cut end of the bough) at the bottom of the picture.
- The whole plant inside the picture, centred, with a small margin all round.
- Background: one plain flat mid-grey (#808080) with nothing in it. No ground, no sky, no cast shadow and no other plants or objects.
- Even, soft light from the front.
- Full and leafy right out to its edges, with a broken, natural outline (single leaves and twigs standing out), not a smooth ball.
""" + END
GROUND = """Paint a square ground texture for a hand-painted fantasy game, in the same painterly style, brushwork and colours as the attached painting.
- Seen from straight above (top-down). No horizon, no sky and no perspective.
- Seamless: the left edge must continue into the right edge, and the top edge into the bottom edge, so the square can repeat without a visible join.
- Even, flat light. No lamp glow, no bright patch, no vignette and no cast shadows. The game adds its own light.
- No objects: no stones big enough to stand out, no bushes, no paths, no people and no animals.
- Even spread: nothing noticeably bigger, brighter or darker than the rest, because the square repeats hundreds of times.
""" + END
NIGHT = " At night, under cool blue moonlight."
W = 'paintings/walk-wickhollow-square.jpg'
# (file, label, rules, shape, attach, where, subject)
G = []
G.append(('A', 'House walls', 'These go straight onto the houses. With two or three walls to choose from, each house can be a little different, which is the last of the "same pattern everywhere" look.', [
 ('wick_wall_timber_plaster_b.png', 'Timber-framed wall, curved braces', FRAME, 'square', ['made/wick_wall_timber_plaster.png (the one in the game now: keep its layout)', W], 'Zones 1 to 4: Wickhollow, Dawnroost, the shipyard, Misthollow',
  "the upper wall of a timber-framed town house, about 2.6 m across and 2.6 m high. Dark brown oak posts, rail and beams as laid out above. In each of the four panels, one curved brace sweeping from a lower corner up to the post, the curves mirrored left and right so the two bays make an arch shape together. Panels of pale warm plaster, slightly uneven and faintly stained." + NIGHT + " The plaster looks dusky beige."),
 ('wick_wall_timber_plaster_c.png', 'Timber-framed wall, close upright studs', FRAME, 'square', ['made/wick_wall_timber_plaster.png (keep its layout)', W], 'Zones 1 to 4: Wickhollow, Dawnroost, the shipyard, Misthollow',
  "the upper wall of a timber-framed town house, about 2.6 m across and 2.6 m high. Dark brown oak posts, rail and beams as laid out above. No diagonal braces: instead, two slim upright studs evenly spaced inside each of the four panels, so the wall reads as close upright timbers with narrow strips of plaster between. Plaster a slightly greyer, cooler cream than the first wall, uneven and faintly stained." + NIGHT),
 ('shared_plaster_plain.png', 'Plain plaster wall', MATERIAL, 'square', ['made/wick_wall_timber_plaster.png (match the colour of its plaster panels)', W], 'Zones 1 to 4: gables and upper walls of some houses',
  "a plain lime-plastered house wall with no timbers, about 2.5 m across: dusky warm beige plaster, hand-trowelled and slightly uneven, with faint darker stains, hairline cracks and a few small patches where older plaster shows through." + NIGHT),
 ('shared_stone_wall_rough_b.png', 'Rough stone wall, bigger warm stones', MATERIAL, 'square', ['made/shared_stone_wall_rough.png (the one in the game now: same hand, different stones)', W], 'Zones 1 and 2: house walls in Wickhollow, the cottage, Dawnroost',
  "the face of a rough stone house wall, about 3 m across. Larger stones than the attached wall, roughly squared, in uneven courses: more warm beige and sandy-brown stones than grey, a few long flat stones among them, dark mortar joints, worn rounded edges, and moss in a few of the lower joints." + NIGHT),
 ('shared_stone_ashlar.png', 'Dressed stone blocks', MATERIAL, 'square', ['made/shared_wall_castle.png', 'paintings/walk-dawnroost.jpg'], 'Zones 1 and 2: the chapel, gatehouses and towers, so they stand apart from the houses',
  "a wall of neatly dressed stone blocks, about 3 m across: even courses of rectangular pale blue-grey blocks of two or three lengths, tight straight joints with thin dark mortar, lightly chiselled faces, a few blocks a little warmer or darker than the rest." + NIGHT),
 ('shared_stone_wall_frosted_b.png', 'Frosted house wall', MATERIAL, 'square', ['made/shared_stone_wall_frosted.png (same hand, different stones)', 'paintings/walk-misthollow.jpg'], 'Zones 3 and 4: houses in Misthollow, the shipyard, the crossroads (which now share one stone with the castle walls)',
  "the face of a rough stone house wall in deep winter, about 3 m across: roughly squared dark blue-grey stones of mixed sizes in uneven courses, white frost in the joints and rimming the top edge of each stone, a few stones glazed with thin ice." + NIGHT),
 ('shared_planks_wall_b.png', 'Board wall, boards and battens', MATERIAL, 'square', ['made/shared_planks_wall.png (same wood and colours)', 'paintings/walk-bogmire.jpg'], 'Zone 1 and zone 4: Bogmire and its dark heart, the frozen camp, Frostmere\'s shore',
  "the wall of a marsh house built of upright boards, about 2.4 m across: wide dark weathered boards running from the very top of the picture to the very bottom with no cut ends anywhere, a narrow batten covering each joint, grey-violet where the wood is worn, a few rusty nail heads and a little green damp near the bottom. The boards must run unbroken off the top and bottom edges, so the picture can repeat upward with no line." + NIGHT),
]))
G.append(('B', 'Doors and windows', 'These are still drawn by the code as plain shapes: a flat orange door and a simple yellow window. Next to your painted walls they are now the plainest things on a house. Seven pictures cover every house in the game.', [
 ('shared_door_plank.png', 'Plank door', SKIN, 'tall (2:3)', [W], 'Every zone: house doors',
  "a cottage door, about 1 m wide and 2 m tall: upright oak planks, two long black iron strap hinges, an iron ring handle, in a plain dark oak frame. Closed."),
 ('shared_door_arched.png', 'Arched door', SKIN, 'tall (2:3)', [W], 'Every zone: the better houses, the inn, the forge',
  "a round-topped oak door, about 1.1 m wide and 2.2 m tall: upright planks studded with iron nails, black strap hinges, an iron ring handle, set in an arch of rough grey stones. Closed."),
 ('shared_door_double_arched.png', 'Double arched door', SKIN, 'square', ['paintings/walk-wickhollow-square.jpg (the chapel)'], 'Zones 1, 2 and 4: the chapel, gatehouses, halls',
  "a pair of tall round-topped oak doors under one stone arch, about 2 m wide and 2.4 m tall: upright planks, long black iron hinges curling across each leaf, two iron ring handles at the middle. Closed."),
 ('shared_window_lit.png', 'Lit window', SKIN, 'square', [W], 'Every zone: house windows at night',
  "a small house window, about 80 cm wide and 90 cm tall: a dark oak frame, leaded glass in small square panes glowing warm amber and gold from a fire inside (brighter low in the middle, softer at the corners), and a stone sill under it."),
 ('shared_window_dark.png', 'Dark window', SKIN, 'square', ['shared_window_lit.png once it is made (the same window, unlit)'], 'Every zone: unlit windows',
  "the same small house window, unlit: a dark oak frame, leaded glass in small square panes, dark blue-black with a faint cool reflection of moonlight across a few panes, and a stone sill under it."),
 ('shared_window_shuttered.png', 'Window with shutters', SKIN, 'wide (3:2)', [W], 'Every zone: a second kind of window, for variety',
  "a small house window with its two plank shutters folded open flat against the wall on either side, the whole about 1.6 m wide and 1 m tall: iron shutter hinges, leaded panes glowing warm amber, a stone sill with a small box of pale flowers."),
 ('chapel_rose_window.png', 'Rose window', SKIN, 'square', ['paintings/walk-wickhollow-square.jpg (the chapel)'], 'Zone 1: the chapel in Wickhollow',
  "a round rose window about 1.6 m across in a ring of carved grey stone: stone tracery like the spokes and petals of a flower, the glass between glowing in deep blue, violet, amber and a little rose-red, lit from inside."),
]))
G.append(('C', 'Wood and things made of it', 'Posts, beams, fences, the shipyard\'s scaffolding, barrels and crates all borrow the jetty\'s floor planks at the moment, so close up they look like stacked floorboards.', [
 ('shared_beam_oak.png', 'Oak beam', MATERIAL, 'square', ['made/wick_wall_timber_plaster.png (match its beams)'], 'Every zone: posts, beams, porch posts, fences, ladders, the shipyard\'s scaffolding and crane',
  "the face of old dark oak beams laid side by side, about 1 m across: four or five broad adze-cut timbers running from the left edge to the right edge, long grain, a few knots, splits and peg holes, dark brown with grey-violet where it is worn. The grain runs left to right." + NIGHT),
 ('shared_barrel_side.png', 'Barrel side', MATERIAL, 'square', [W], 'Every zone: barrels (there are dozens)',
  "the side of an oak barrel unrolled flat, about 1.8 m across and 0.9 m high (a barrel's whole way round): upright oak staves side by side, and four black iron hoops running straight across from the left edge to the right edge, two near the top and two near the bottom. Warm brown staves, a little darker and damp near the bottom."),
 ('shared_crate_side.png', 'Crate side', FACE, 'square', [W], 'Every zone: crates and boxes',
  "one side of a wooden packing crate, about 70 cm across: four level boards, a frame of narrower boards round the edge, one diagonal brace across, iron nail heads at the corners. Pale weathered wood with darker grain."),
 ('shared_market_produce.png', 'Market stall table', FACE, 'wide (3:2)', [W], 'Zones 1 and 2: Nettie\'s stall, Dawnroost\'s stall',
  "a market stall's table seen from straight above, about 2 m wide: heaped red and green apples, pears, a basket of berries, round loaves, cabbages and bundles of herbs, laid in rows on a dark cloth, lit warm as if by a lantern above."),
 ('shared_bark_pine.png', 'Pine bark', MATERIAL, 'square', ['made/shared_bark_oak.png (same hand)', 'paintings/walk-northern-camp.jpg'], 'Zone 3: the northern camp (the one texture still a stand-in)',
  "the bark of a tall pine, seen straight on and flat, about 0.8 m across: thick reddish-brown plates with deep dark furrows running up and down, grey-violet in the shadows, a few beads of pale resin." + NIGHT),
]))
G.append(('D', 'Trees and bushes', 'These are now the weakest-looking things in every zone. A tree\'s crown is a lumpy ball with a leaf picture on it, a fir is a smooth cone, a bush is a dark blob. With leafy boughs painted on grey, as your ferns and reeds were, I can build crowns out of many overlapping boughs, with gaps and ragged edges like real trees. This group needs a build step after the pictures come in, so it is last.', [
 ('shared_bough_oak.png', 'Oak bough', PLANT, 'square', ['made/shared_tree_oak.png', 'made/wick_leaf_canopy.png (its leaves)'], 'Zones 1 and 2: every broadleaf tree',
  "one leafy bough of an old oak, about 1.5 m across: a short forked branch thick with lobed oak leaves in clusters, deep blue-green with moonlit silver-green on the upper leaves. The cut end of the branch at the bottom centre."),
 ('shared_bough_fir.png', 'Fir bough', PLANT, 'wide (3:2)', ['made/shared_tree_pine.png', 'made/wilds_fir_boughs.png'], 'Zones 2 and 3: every fir and pine',
  "one sweeping bough of a dark fir, about 2 m across: a central branch with drooping fans of needles hanging from it on both sides, dark blue-green with cool silver along the top. The cut end of the branch at the bottom centre, the bough spreading up and out from it."),
 ('shared_bough_fir_snow.png', 'Snowy fir bough', PLANT, 'wide (3:2)', ['made/shared_pine_snowy.png', 'made/fir_foliage_snowladen.png'], 'Zones 3 and 4: every snow-laden fir',
  "one sweeping bough of a fir heavy with snow, about 2 m across: a central branch with drooping fans of dark blue-green needles, thick soft white snow lying along the top of every fan and a few icicles under the tips. The cut end of the branch at the bottom centre."),
 ('shared_bough_birch.png', 'Birch bough', PLANT, 'square', ['made/wilds_birch_leaves.png', 'made/shared_bark_birch.png'], 'Zones 2 and 3: birches',
  "one light bough of a birch, about 1.2 m across: slender dark twigs hanging down with many small pointed leaves, pale silver-green and a few turning gold, airy, with gaps between the twigs. The cut end at the top centre of the picture, the twigs hanging down from it."),
 ('shared_bough_thorn.png', 'Bare thorn bough', PLANT, 'square', ['made/thorn_bark_black.png', 'paintings/walk-thornwood.jpg'], 'Zone 1 and zone 3: the Thornwood, dead trees',
  "one bare bough of a dead thorn tree, about 1.5 m across: black twisting branches forking again and again into fine crooked twigs, long sharp thorns, no leaves, a faint violet sheen along the upper sides. The cut end at the bottom centre."),
 ('shared_bush_round.png', 'Garden bush', PLANT, 'square', [W], 'Every zone: the bushes round houses and along roads',
  "one round garden bush, about 1.2 m tall and wide: dense small dark blue-green leaves with silver-green tips, a broken leafy outline with twigs and single leaves standing out all round, a glimpse of dark stems at the foot."),
 ('shared_bush_flowering.png', 'Flowering bush', PLANT, 'square', [W], 'Zones 1 and 2: flowering bushes and the beds round the Moonwell',
  "one flowering bush, about 1.1 m tall and wide: dense dark blue-green leaves scattered all over with small white and pale pink blossoms, a few violet ones, a broken leafy outline, a glimpse of dark stems at the foot."),
]))
G.append(('E', 'Make again, only if you want', 'Two of the textures already made are worth a second try. Neither is urgent.', [
 ('heart_deck_mossy.png', 'Mossy deck of Bogmire\'s dark heart (again, lighter)', GROUND, 'square', ['made/heart_deck_mossy.png (the same deck, lighter)', 'paintings/walk-bogmire-heart.jpg'], 'Zone 1: Bogmire\'s dark heart, whose whole square is this deck',
  "the deck of an old marsh platform, about 2.5 m across: broad weathered boards with clear dark gaps between them, grey-violet wood with green moss in the gaps and in soft patches. Paint it a clear step lighter and with more contrast between boards and gaps than the attached picture: in the game, at night, the attached one goes nearly black and the boards can't be told apart." + NIGHT),
 ('jetty_planks_snow.png', 'Snowy planks (again, no line)', GROUND, 'square', ['made/jetty_planks_snow.png', 'paintings/walk-frozen-camp.jpg'], 'Zones 3 and 4: snowy jetties and bridges (the one made shows a line across it where it repeats)',
  "the planks of a jetty under snow, about 2 m across: boards running from the top edge to the bottom edge with no cut ends, snow lying in soft uneven drifts along the boards and thinning to bare dark wood in places, the drifts carrying on unbroken off every edge." + NIGHT),
]))

out = []
n = sum(len(g[3]) for g in G)
out.append("# The 3D world: the short list of pictures that would make it better\n")
out.append("From the reskin of all four zones (November 17, 2026). Chris asked for this in place of round three's 235 pictures.\n")
out.append("**%d pictures, in five groups, most useful first.** Each prompt below is complete: paste it whole into the session that made rounds one and two, attach the pictures it names, and save the result under the file name on its card.\n" % n)
out.append("## How to use this\n")
out.append("1. **Same session, same way.** These prompts use the same rule wording as rounds one and two, so the pictures come out in the same hand.")
out.append("2. **Attach what each card names.** `made/...` is one of your own finished textures (in the zips you made, or `moon-faire-witches/texture-packs/made/` in the repository). `paintings/...` is the place's painting, as in the round one and two zips.")
out.append("3. **Keep the file name on the card.** That is how the game finds the picture and how it stays labeled for your future games.")
out.append("4. **Hand them back as zips**, as before. Nothing here changes the game until it is brought in.")
out.append("5. **You don't have to make them all.** Groups A and B change the houses the most. Group D changes the trees the most, but needs a build step afterwards.\n")
out.append("## What I saw, zone by zone\n")
out.append("- **Zone 1, Wickhollow and the fen.** Your wall, roof and ground textures carry it. What stands out now: every timber-framed house has the same frame (group A), doors and windows are plain shapes (group B), barrels and posts look like floorboards (group C), and the trees and bushes are lumps (group D). Bogmire's dark heart: its deck goes nearly black (group E).")
out.append("- **Zone 2, the Warm Roads.** Dawnroost is grey stone on grey stone: its houses, towers and great walls are all close in colour, so the town reads as one mass (the warmer second stone and the dressed stone in group A would set them apart). The moor and the roads look good. Bushes and firs as in zone 1.")
out.append("- **Zone 3, the northern wilds.** The shipyard is mostly posts and beams, all in floor planks (the oak beam in group C would change it most). The northern camp's pines still use a stand-in bark (group C). Firs are smooth cones (group D).")
out.append("- **Zone 4, the northeast peaks.** Misthollow's houses and its castle walls share one frosted stone (group A). The snow, ice and the frozen waterfall look good. Snowy firs are smooth cones (group D).\n")
out.append("## What not to make\n")
out.append("Round three as it was written (about 150 flat house fronts, 10 roofs from above, about 90 plants): the 3D world builds its houses from wall textures and its roofs from the tiled roof textures you already made, so those pictures would not be used.\n")
k = 0
for letter, title, why, cards in G:
    out.append("---\n\n## Group %s: %s (%d)\n" % (letter, title, len(cards)))
    out.append(why + "\n")
    for file, label, rules, shape, attach, where, subject in cards:
        k += 1
        out.append("### %d. %s\n" % (k, label))
        out.append("- **File name:** `%s`" % file)
        out.append("- **Shape:** %s" % shape)
        out.append("- **Attach:** " + "; ".join("`%s`" % a.split(' (')[0] + (" (" + a.split(' (', 1)[1] if ' (' in a else "") for a in attach))
        out.append("- **Used in:** %s\n" % where)
        out.append("```text\n%s\n\nSubject: %s\n\nPicture shape: %s.\n```\n" % (rules, subject, shape))
open(sys.argv[1], 'w').write("\n".join(out))
print(n, 'prompts,', len("\n".join(out)), 'characters')
