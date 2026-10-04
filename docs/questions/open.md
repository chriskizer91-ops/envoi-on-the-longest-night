# Still Open

Everything not yet decided, as of October 3, 2026, twenty-second round. None of it blocks the next step; the battle numbers can change at any time and the simulator rechecks them.

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

20. **Walking without the world map.** Today the world map carries band 2's and band 3's wild walking and the camps where the Magpie lands. The plan in `../../envoi-game-pass-3/README.md` makes each band's wilds a short run of painted wilderness scenes (about three in band 2, three in band 3, one or two in band 4). Is that the right shape and number?
21. **Night or day for the wilderness scenes?** Every map in the game is at night (the story is one long night); Chris's example path is by day.
22. **The squeezes:** which level for the battle backgrounds (the Battle Backgrounds page), and which for the wilderness scenes (the Wilderness Walk page)? Answered October 3, late evening: "Strong" for the battle backgrounds, and "100% extra light" for wilderness scenes (`design-decisions.md`).
23. **Gate 5's painting:** Chris counted seven backgrounds (four wilds, gates 10 and 15, the finale). Gate 5, the great wraith, also needs one; 03 Bogmire Lantern Banks fits it exactly. And the first fight: keep the Night square's painting? In the game since October 3, late evening: 03 for gate 5, the Night square for the first fight.

## Polish (October 4)

24. **The two hidden keepsakes' names and words.** Chris asked for a magic item each for Io and Sol, hidden, that make the game a little easier without changing its difficulty. They are in, with names made up for them until Chris names them (`src/battle/rules.js` `KEEPSAKES`, and what's said when each is found in `src/game/script.js` `keepsakes`):
    - **Io's, "the Crescent Locket":** a little silver locket with a crescent on its lid, under a loose slate at the end of the red roof's ridge in Wickhollow (Chris's secret way). Her Lunar Mend and Waxing Light heal a quarter more.
    - **Sol's, "the Warden's Brooch":** an old sunstone brooch in dark bronze, still warm, where the trail into the Thornwood's dark woods gives out. Sol knows it for a Warden's ("A long way from the waystation") and wears it home for them. She has a tenth more HP, and her blows land a tenth harder.
    - What are they really called, and who left them there? Is a fallen Warden's brooch in the Thornwood all right for the lore?
25. **The battle song's loudness.** Chris's three songs play as loud as the made-up music they replace on the maps. The made-up battle theme was much quieter than the map music (it sat under the battle's sounds), but Herbal Decay Battle plays as loud as the map music, so it's heard. Is that right, or should it sit lower under the fighting? Answered October 4: the fights keep the original battle music, and Herbal Decay Battle is out of the game (`design-decisions.md`, "The songs").

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
