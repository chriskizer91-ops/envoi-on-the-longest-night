# Design Decisions

Decisions Chris has made, newest last. These outrank anything in a sibling repo. Where one of them changes the Lore & Party Bible, it says so.

## October 1, 2026

### What wins

The demos and lore Chris brings to this project always outrank anything found in another repo. The sibling repos are a parts bin, not canon.

### Battles

- Battles are the 3D sequence from the demos: code-built models in front of a painted backdrop, active-time turns, a command menu, Trance and summons. The Night square demo is the reference for how a fight looks and plays.
- **No dice.** Every attack, spell and heal has a set amount, with a random swing of up to about 25% either way. The size of the swing can change if a different value makes the game more interesting.
- **Choices must matter.** A player who chooses badly can lose a fight.

### Progression

- The party levels up from the very first fight.
- The story order:
  1. The Witch alone fights a Shadow Wraith.
  2. More wraiths as the story moves on.
  3. Sol joins her, and the fights get harder from there.

### Travel

- **Walking** is a 2D, code-generated, pixel-art, top-down view, like the Aethermoor game in `New-game`.
- Only the main character is shown walking, even when the party is two.
- **Flying** the Magpie is the other way to cross the world.
- Battles switch to the 3D screen.

### The Witch and her party

- The Witch is mainly a healer with a few damage moves. Her Trance still deals a lot of damage.
- She needs Sol, her sword fighter, for damage, and both of her summons:
  - **Lunara**, the moth goddess.
  - **Envoi**, the Letter Wyrm. **Envoi has to be crazy powerful.**

## October 1, 2026, second round

### Retired for good

The Drowned Mother, Old Snuff the Lamplighter and the mandrakes are gone, with all of their lore and ideas: the flood at Misthollow, the lit windows and stolen lights, Mother's Hollow, the window lantern, the water moves, Snuff's belt lanterns and Bogmire's bargain with him. The bible and the prompt pack still describe them; ignore those parts.

### The cast in 3D

- The battle models are the ones Chris has shared: the Witch, Sol, Lunara, Envoi, the Shadow Wraith, Halcyon and Noctara.
- Fighting only wraiths would be thin, so at least one lower-level foe is needed as well. It is still to be designed.

### Models

- Every model gets touched up to the best it can be, while still running inside a single web page.
- **The Witch stays exactly as she looks and moves.** Chris loves her. Her pass is technical only and must not change how she looks.
- Sol, Envoi and Noctara need visible upgrades.

### Envoi

- Envoi is a mid-game reward. It levels up as the Witch does.
- By the final battle it hits hard enough for that fight to be balanced.

### The final battle

The starting target is about a 50% chance of winning for a player who plays it well. It will be tuned in play.

### The knight's ambush

- Early in the story the Witch meets the knight (Halcyon) long before she is strong enough to beat her.
- The fight cannot be won. The knight leaves before finishing the Witch.
- The story then reveals that the knight serves Noctara, the Starless, the queen of darkness.

### World and travel

- The Witch gets the Magpie near the beginning. Flying is what makes the world feel big.
- The airship flies from one location to another, probably four of them.
- Between those locations is wilderness, with things to fight and things to discover.
- Walking between locations is possible but slow.
- Keep it straightforward: not much running around, and a story that isn't too long.
- **Walking maps are painted,** for FF9 nostalgia. The pixel Witch walks on top of the painting.

### Art

- Chris can make as many images as the game needs.
- He would rather make custom images for this game where they make it smoother. Reused art is fine where it works.

### How we build

- Each aspect is shown as its own demo, one step at a time, before everything is put together.
- Pieces taken from other repos, especially the pixel walking view, will be tuned visually, so the demos should make that easy.

## October 1, 2026, third round

The lore answers (`lore/lore-answers-2026-10-01.md`) settle the story, the world and the foes. The decisions below came with them.

### Models first

- **Every model touch-up is finished before anything else is built.**
- Touched up means finished for the game: every attack, summon and reaction the character will use works, with its hit timing.
- Each model is shown in a battle setting, not only on a turntable.

### Model looks

- **Halcyon stays a woman,** with her face and body as built. Her eyes and blade edge become cold blue (see the lore answers).
- **Noctara should look as close as possible to her stylized concept art.**
- **Scale:** Lunara and Envoi should match their size next to the Witch and the wraith in the two Envoi scenes (`reference/art/envoi-summon-scene-a.png` and `envoi-strike-scene-b.png`).
- Chris will generate action sheets for the models that don't have them, from prompts in `art-requests/`.

### The party's moves

- **The Witch's only new move in the whole game is summoning Envoi,** from the waystation on.
- Every other spell and move she and Sol have is there from the start, and simply grows stronger as they level.

### Foes and levels

- **Regular foes take a level setting,** so wisps and wraiths can meet the party at any level. Noctara and Halcyon are fixed.
- The lower-level foe is the wisp, with a frost-colored variant later (lore answer 16).

### Level gates and the Magpie

- **The world is split into level bands: 1 to 10, 10 to 20 and 20 to 30.** The Magpie can only fly in the first band until the party reaches level 10, then the second until level 20, then the third.
- This follows Thareia (`New-game`, branch `claude/tender-babbage-4wiplk`, `thareia/design/05-story-and-quests.md`), where ship refits at levels 10, 20 and 30 open new regions.
- The story needs a reason the ship can't go farther yet. Once there is one, Chris will generate a bigger world map, or several map pieces, from a prompt.

### Two kinds of map

- **The flying map is different from the walking map.** The flying map is the world seen from the Magpie.
- The walking map looks like the ground, with the pixel Witch walking on it.
- Chris is thinking of how travel worked in FF9: you walk the world on foot, then later fly over it.

## October 2, 2026

### Big numbers

- **Damage numbers should be big and climb all game.** Chris: at the start a hit does about 100; by the end it does about 3,000, so a player feels how far they have come.
- **The game finishes at about level 20.**

### The curve (proposed; the battle steps tune it)

- **Every level makes every move about 20% stronger** (×1.2 per level). A basic hit is about 100 at level 1, 500 at level 10 and 3,200 at level 20.
- **Foes scale the same way.** HP and damage both rise about 20% per level, so a fight against foes of the party's level lasts about as long at level 20 as at level 1; the numbers are just bigger. A party a few levels above its foes wins more easily, which is the reward for exploring.
- **Moves keep their ratios as they grow.** A big Sword Art does several times a basic hit, a Trance attack more, and Envoi the most: about 100,000 for its whole strike at level 20.
- **The 25% swing stays.** No 9,999 cap.
