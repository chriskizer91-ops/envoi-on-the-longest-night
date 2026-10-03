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
