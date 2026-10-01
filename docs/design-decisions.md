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

- Early in the story the Witch meets the knight (Halcyon) long before she is strong enough to beat him.
- The fight cannot be won. The knight leaves before finishing her.
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
