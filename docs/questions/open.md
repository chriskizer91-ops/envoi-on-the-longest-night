# Still Open

Everything not yet decided, as of October 5, 2026. None of it blocks the next step; the battle numbers can change at any time and the simulator rechecks them.

Every earlier question has been answered; the answers are in `design-decisions.md`, under the October 2 rounds.

## Everything is decided

Chris asked Claude to decide the rest and keep building until the game is finished (October 3). Every question below was answered that day in `design-decisions.md`, twenty-second round; earlier ones in the rounds they name.

- 1 to 10, 14, 15: answered earlier (twelfth to twentieth rounds).
- 13: the gates keep their approved tuning; Chris's rule lives in the wilds (the Bramble Horror).
- 16, 17: the ambush's lines and Harvest Moon's name stay.
- 18: Flee in wild fights: always from a Bramble Horror, one try in two from a pack, nothing gained.
- 19: the Bramble Horror is in all four bands, the Ancient Crown from the third.
- Lore 3, 4, 5, 11, 12: "the moon's people" only; gnomes at the shipyard; the party learns at the shipyard that Halcyon serves Noctara; the Sunken Ruins stay out of the story; Halcyon holds back in the finale since Sol called her Kestrel.

New questions, if any come up while the game is built, go here.

## Pass three (October 3, evening)

20. **Walking without the world map.** Until October 5 the world map carried band 2's and band 3's wild walking and the camps where the Magpie lands. The plan in `../../envoi-game-pass-3/README.md` makes each band's wilds a short run of painted wilderness scenes (about three in band 2, three in band 3, one or two in band 4). Is that the right shape and number? Answered October 5: "The walking plan is good." Eight scenes: three in band 2, three in band 3, two in band 4 (`../art-requests/12-wilderness-scenes.md`). In the game since October 5: the camps are where the Magpie lands, and the world map is only flown (`../design-decisions.md`, "October 5, 2026: the wilderness scenes in the game").
21. **Night or day for the wilderness scenes?** Every map in the game is at night (the story is one long night); Chris's example path is by day. Answered October 5: "make the scenes at night".
22. **The squeezes:** which level for the battle backgrounds (the Battle Backgrounds page), and which for the wilderness scenes (the Wilderness Walk page)? Answered October 3, late evening: "Strong" for the battle backgrounds, and "100% extra light" for wilderness scenes (`design-decisions.md`).
23. **Gate 5's painting:** Chris counted seven backgrounds (four wilds, gates 10 and 15, the finale). Gate 5, the great wraith, also needs one; 03 Bogmire Lantern Banks fits it exactly. And the first fight: keep the Night square's painting? Settled October 3, late evening, for the new battles: 03 for gate 5, the Night square for the first fight. In the game since October 5, when the new battles were switched on (until then every fight was on the old flat paintings, gate 5 on Bogmire's boardwalk).

## Polish (October 4)

24. **The two hidden keepsakes' names and words.** Chris asked for a magic item each for Io and Sol, hidden, that make the game a little easier without changing its difficulty. They are in, with names made up for them until Chris names them (since October 4, late evening, two of the twenty: `envoi-final-draft/items/items.js`, and what's said when each is found in `src/game/script.js` `keepsakes`):
    - **Io's, "the Crescent Locket":** a little silver locket with a crescent on its lid, under a loose slate at the end of the red roof's ridge in Wickhollow (Chris's secret way). Her Lunar Mend and Waxing Light heal a quarter more.
    - **Sol's, "the Warden's Brooch":** an old sunstone brooch in dark bronze, still warm, where the trail into the Thornwood's dark woods gives out. Sol knows it for a Warden's ("A long way from the waystation") and wears it home for them. She has a tenth more HP, and her blows land a tenth harder.
    - What are they really called, and who left them there? Is a fallen Warden's brooch in the Thornwood all right for the lore?
    - October 4, evening: in the twenty keepsakes Chris locked, these two keep the names the game gives them, the Crescent Locket and the Warden's Brooch, cut to a quarter (question 30). Who left them there is still open.
    - October 4, late evening: Chris's pictures came (art request 14). His locket is a gilded locket with a raised crescent and a moonstone; his brooch a bronze bird with its wings spread round an ember-red stone. The lines above follow the pictures where the words will say what each looks like.
25. **The battle song's loudness.** Chris's three songs play as loud as the made-up music they replace on the maps. The made-up battle theme was much quieter than the map music (it sat under the battle's sounds), but Herbal Decay Battle plays as loud as the map music, so it's heard. Is that right, or should it sit lower under the fighting? Answered October 4: the fights keep the original battle music, and Herbal Decay Battle is out of the game (`design-decisions.md`, "The songs").

## The final draft (October 4, evening)

Asked by the session that reviewed the final draft (`../../envoi-final-draft/README.md`). None of it blocks the art: Chris can make the sheets first and answer as he goes.

26. **The wild's own creatures** (art request 13, `../art-requests/13-wild-creatures.md`). Ten families, most of them Chris's own from his Aethermoor games, brought into this story as creatures of the wild that Noctara's cold has upset: the Thornhound (the Rime Wolf in the peaks), the Glowcap, the Mire Toad and Gorrow the Mire-King, the Moor Boar and Old Snag, the Moss Bear, the White Hart of Fawnrest, the Thunder-Roc of Stormwatch, the Ember Beetle, the Blackwater Gar and Old Jaws, and the Veilcat. Are these the right ones, with the right names, and is wave 1 the right place to start?
27. **How a beaten creature of the wild leaves.** Lore answer 21 says defeat is release, not death, and the moth rising is for souls. So these aren't killed: the fight goes out of them and they leave. A hound slinks off, a Glowcap sits down and puts down roots, a toad sinks back into the water, the White Hart's frost cracks off and it walks back into the trees, the Thunder-Roc rises into the storm. Is that right for all of them?
28. **Great creatures at the D&D map's named places.** Each band gets a great creature as an optional fight in a lair: Gorrow at Willowmurk and Old Jaws under Rotbridge (band 1), Old Snag on the Warm Roads' moor (band 2), the White Hart at Fawnrest Shrine (band 3), the Thunder-Roc at Stormwatch (band 4). Each lair has things to find, and each great creature leaves a keepsake that the balance never counts on, like the two hidden now: Old Snag's hatchet for Sol (a Warden's, with the sun on it), the White Hart's bell for Io. Should the places be visited like this, and is a Warden's hatchet in Old Snag's shoulder all right for the lore? October 4, evening: the first plan for the twenty keepsakes put five of them in place of the hatchet and the bell: the Mire Pearl from Gorrow, the Sunstone Heart in Old Snag's wallow, the Fawnrest Heartstone from the White Hart, the Roc-Feather Cloak from the Thunder-Roc and the Thornwreath from the Colossus. None of the five is in the twenty Chris locked that night (question 30, `../../envoi-final-draft/items/items.js`): the first Bramble Colossus gives the Colossus Heart-Seed and the Colossus Thorn instead, and none of the twenty comes from Gorrow, Old Jaws, Old Snag, the White Hart or the Thunder-Roc. So the hatchet and the bell are only part of how Old Snag and the White Hart look (art request 13), and a keepsake from one of these great creatures would be a twenty-first, beyond the twenty Chris locked.

## New character ideas

Asked October 3 by the session that polished them in `../../3d-model-new-character-ideas/`, at the same time as the game was being built. Where the game has already answered, the answer is noted.

2. **The Bramble Horror** (`../../3d-model-new-character-ideas/bramble-horror/`). Answered by the game: it is a lone wild foe in all four bands (question 19 above), and Undergrowth and Scorch stay (`BRAMBLE_MOVES` in `src/battle/screen.js`).
3. **The Bramble Colossus** (`../../3d-model-new-character-ideas/bramble-colossus/`), the Bramble Horror grown into a boss as big as a house. "Bramble Colossus" is a working name.
   - Is it a boss in the game? If so, where does it stand, and at which level do the party meet it? `../handoff.md` proposes a rare wild fight in band 4, with an optional lair, the Thornheart.
   - What is it called?
   - Its moves were all made up for it: Awakening, Siren Bloom, Thorn Lance, Hammerfall, Maelstrom, Thorn Volley, Devour, Thornwood, Wrath and Felled. Which stay?
   - Its Wrath is a second phase at half its HP. Do battles have phases like that?

## The wild meadow

4. **The wild meadow** (`../../3d-model-new-character-ideas/bramble-horror/meadow.js`), the living place made for the creature benches, with its own hours and weather. On October 3 Chris said it should be in the game.
   - Where does it go: behind the fights in the wilderness between stops, or one place in particular? `../handoff.md` (Living battlefields) weighs both.
   - Battles are set in front of painted backdrops (`design-decisions.md`, October 1). Is the meadow, a 3D place that answers the fight, an exception for the wilds?
   - Since October 5 every fight but the first is fought that way: live 3D ground made from the living battlefield's (`../../living-battlefields/`), with Chris's painting of the place far off behind (`../../envoi-final-draft/arena/README.md`). Whether that answers this question is Chris's to say (`../../handoff/tasks.md`, T01).

## Another new character idea

Answered in pass three (October 3, evening): neither the Emberback nor the Gloamwing goes in the game; both stay as ideas.

5. **The Emberback** (`../../3d-model-new-character-ideas/emberback/`), the giant salamander of the buried sunstone, built from Chris's sheets on October 3.
   - Is it a foe in the game? Where does the party meet it: by a Warm Road node going cold, and at which level?
   - Does fire hurt it, feed it, or only half hurt it? Its bench has it resist fire (half damage), and Heat Drain heals it.
   - Beaten, it curls up asleep as stone, and Sol can relight the node it was guarding. Does it ever wake again, for instance when the node is lit? Its bench wakes it only so it can be fought again.
   - Roar is the one move not on its action sheet. Does it stay?
6. **The Gloamwing** (`../../3d-model-new-character-ideas/gloamwing/`), the great night-flier that hunts the pale moths, the souls on their way to the Moon, built from Chris's sheets on October 3.
   - Is it a foe in the game? The bible puts it in the Hollow ("The Gloamwing grows fat on soul-light that should have gone up"). Where does the party meet it, and at which level?
   - What do Moonlure and Hush do in a fight? Its bench shows them as a lure and a silence on the whole party ("Lured", "Hushed"), with no damage.
   - Beaten, it falls, its sac splits and every soul it swallowed flies free to the Moon. Does it stay down after that, or fly off? Its bench lets it rise again only so it can be fought again.
   - Its sheets show its sac a warm ivory, where the art request asked for moon-silver. The model follows the sheets. Is that right?

## Field studies

Asked October 4, 2026, by the session that started `../../3d-model-field-studies/` (Claude's own folder of reference models, each shown as a short nature film). Nothing here changes the game until Chris says so.

29. **The Bramble Colossus, as the field study shows it** (`../../3d-model-field-studies/bramble-colossus/`). The film needed to say what it is and how it lives, so it shows these, all new except where noted:
    - **Its warm heart** keeps the frost off a ring round it, about 20 m across from its middle (the handoff's *Thornheart* idea, made visible): inside, green grass and the small white flowers of the Frostmere painting in the middle of winter; outside, frost. Its breath steams in the cold. Right?
    - **Its roots run on under the meadow** to about 20 m, carrying its warmth, and the frost stops where they end. Each heartbeat runs out along them.
    - **It fruits all winter**, green, red and black berries on the same canes, as a lure on the longest nights.
    - **It feels its prey through its roots**, warmth and footsteps, since it has no eyes.
    - **It grows from a thicket like the Bramble Horror** over a century or more. Is the Horror its young?
    - **Moths are left out** on purpose: a pale moth is a soul going home, so it neither hunts nor eats them.
    - **The film's words** (`film.js`) are a first draft for the lore conversation.

## The twenty keepsakes (October 4, evening)

Asked by the session that planned them (`../../envoi-final-draft/items/README.md`). Chris locked the list the same evening and places the keepsakes himself with the map editor; what's left is their words. None of it blocks the pictures (art request 14).

30. **The twenty, and their names.** Every one is a relic of Chris's Aethermoor games (two are Thareia's), as he asked: six for Io, six for Sol, eight for either. The two hidden ones take Aethermoor names. Io's Crescent Locket becomes **the Orrery of Hours**, a locket-sized brass orrery with a pale moon ("It hums the hour it was made in. That hour hasn't happened yet: the hour the stars come back."). Sol's Warden's Brooch becomes **the Warden's Seal**, the gold sun seal the Wardens pressed into the wax of every oath, worn as a brooch, still warm. Are these the right twenty, and the right names for the two? Answered October 4, evening: Chris set new rules for the list (names say what each thing is and where it's found) and locked the twenty they made (`../../envoi-final-draft/items/README.md`). The two hidden ones keep their game names.
31. **What they do.** Each does something different, and a few reach past the fights: the Hag-Stone makes hidden things glint brighter on the maps, the Bogstriders make the party walk faster, and Lightfingers brings more shards from fights. Is that the right kind of thing for keepsakes, or should they only help in fights? Answered October 4, evening: every keepsake has a main help (a small share of healing, damage or max HP) and one other help, in fights (Trance fills faster, starting with Heat) or outside them (more shards; not walking faster). Together the main helps reach today's totals (`design-decisions.md`, "The twenty keepsakes").
32. **The words for the locked twenty** (`../../envoi-final-draft/items/README.md`). What Nettie, Marta, Ysmera and Ede say as they give theirs; what the Fen-Heart Lamp is (one of the lamps the great wraith sat on, still lit); whose pennant is tied at the crossroads (a Wardens' pennant); what the Colossus's Heart-Seed and Thorn are to it; and a line for each keepsake. All for the lore conversation. Since October 4, late evening, the twenty are in the game with placeholder words for all of these (`src/game/script.js`: `keepsakes`, `gifts` and `colossusGifts`), written to fit Chris's pictures.
