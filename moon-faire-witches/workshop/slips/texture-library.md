SLIP: texture-library
State:    Ready for the hub (Chris to approve the 16 ready textures)
Branch:   work/texture-library   Commit: 6e107d8 (and the slip's own commit after it)
Files:    moon-faire-witches/texture-library/ (new: README.md, library.json, matches.json, tools/)
          moon-faire-witches/workshop/slips/texture-library.md
          Nothing else changed. No pictures were added to the repository.
File for Chris: envoi-texture-library.html, and envoi-texture-library-made.zip (39 MB). In the page: Ready (16 cards,
          Envoi now / Moon Faire / in Envoi's colours, tap to see 3 x 3), Head start (73), Library (388 pictures by kind),
          What to do.
Done:     Not a board job: Chris asked for it directly in a new conversation in the project (November 16). Searched all
          27 of his repositories on every branch (45,329 picture files, 10,449 different ones) and found 13 texture packs,
          388 pictures, in 9 repositories. Sorted them by kind. Matched them against the prompts page's 365 cards: 16 ready
          now (all from Moon Faire's open world, colour-shifted into Envoi's painting), 73 with a head start.
Checked:  The page at Pixel 7a size (412 x 915): all 4 tabs and the 3 x 3 viewer work, 0 page errors, 16 + 73 cards
          shown, 58 ground pictures under the Ground filter. All 16 ready textures tiled by eye with no seams. Every match
          checked by eye against the card's close-up or stand-in; 7 first picks were moved down to Head start or dropped.
Chris said: (not yet)
For the hub: When Chris approves, his made folder from the zip goes into texture-packs/made/ like a round of his own.
          Two planks are turned 90 degrees to match their cards (shared_boardwalk_planks, shared_planks_wall).
          shared_drystone is wide (3:2), as Moon Faire made it: set its repeat in the 3D.
          Please add the job to the board.
Open:     1. Two different round 3 cards get the same file name, crossroads_crossroads_well.png (north/crossroads "The
             crossroads well" and arenas/crossroads "Crossroads well with lantern post"): one of Chris's pictures would
             overwrite the other. In texture-packs/tools/build_prompts.py the clash fix prefixes only the place; prefix
             "fight-" for the arenas group too (the zip's reference names already do). Fix before Chris reaches round 3.
          2. For Chris: whether to gather the packs into one shared library (the building-with-assets repository already
             holds his shared 3D environment assets), and whether the Head start pictures should become sharper stand-ins.
