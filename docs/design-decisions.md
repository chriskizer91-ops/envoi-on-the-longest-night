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

## October 2, 2026, second round

Chris's answers to the open questions. Where this round and an earlier one disagree, this round wins: it replaces the three level bands of October 1 and the rule that Envoi is the Witch's only new move.

### Names

- **The Witch is Io.** The io moth is a real moth, and Io is also a moon, so her name carries both halves of her lore.
- **The Warden waystation is Dawnroost.** Wardens take bird names, so their home is where they roost, and "Dawn" matches Sol's Dawnbreaker trance. Only one bird is left to come home to it.

### Level bands and the Magpie

- **Four bands: 1 to 5, 5 to 10, 10 to 15 and 15 to 20.** Level 20 is the highest level.
- **Why the ship can't go farther:** sunstone gives the Magpie its lift, and Noctara's cold drains it. The same cold is why the Ember Line is dimming.
- **The Magpie's four levels:**
  1. At the start, it flies the first band.
  2. A refit at Bogmire after the great wraith opens the second band.
  3. A charge from the living sunstone node at Dawnroost opens the third.
  4. A final upgrade after the fight with Halcyon opens the fourth.

### A reward at every gate

| Level | Gate | Reward |
|---|---|---|
| 5 | The great wraith, then the Bogmire refit | Moth Veil, Io's barrier |
| 10 | Dawnroost | Envoi |
| 15 | The fight with Halcyon | Kestrel Stoop, Sol's new move |

- **Moves can be added for balance.** Heroes or foes can get extra moves if the balancing needs them.

### Io's spells

1. **Lunar Mend** from the first fight.
2. **Waxing Light** (heals both) and **Moonsteel** (gives Sol Heat) when Sol joins. They aren't level rewards; they only exist once Io has a partner.
3. **Moth Veil,** a barrier, at the Bogmire refit. Chris chose it over a bigger heal: Lunar Mend already keeps pace with HP on the level curve, and a shield is the answer to telegraphed hits like Black Noon and Void Sphere.

- **Revive and status cures** stay with herbs and Lunara's Embrace.

### Sol's Kestrel Stoop

- Halcyon named Sol "Kestrel" because she hovers before she strikes, and Sol learns this move from the fight with Halcyon.
- **How it works:** Sol spends one turn hovering, then lands the biggest sword hit in the game. It should beat two turns of Ember Rush.

### Halcyon and the finale

- **Halcyon's winnable fight:** Halcyon at level 20 against the party at about 15. With the level curve, she alone may be enough. A wraith joins her only if the balancing calls for it.
- **The finale is at level 20.**
  - At level 20, a player who plays well wins about half the time, so they may need a couple of tries.
  - At level 19 they have no real chance, but it's close enough that they may keep trying when they could just level once more.
  - Below that, they all but certainly lose.

## October 2, 2026, third round

### The finale stays at Misthollow

- **No castle.** "Noctara's castle" was a slip of the tongue. The finale is where the lore puts it: the dead Moonwell at Misthollow (lore answer 9). A castle only comes in if the lore ever needs one.

### Halcyon at the level 15 gate

- **The third band is wilderness.** The way north from Dawnroost runs through wild country, and that is where the party crosses paths with Halcyon. There is no stop in this band.
- **The level 15 fight:** reaching level 15 opens the way to Halcyon, who is level 20. Io may have leveled past 15 by then.
- **It always ends one of two ways.** Either Halcyon defeats the party, or, if they have leveled enough to bring her down to 20% of her HP, she retreats into the dark. The story goes on either way.
- **Kestrel Stoop:** after the fight, Sol learns it. The fight stirred a memory.

### The places in each band

| Band | Levels | Places | Gate out |
|---|---|---|---|
| 1 | 1 to 5 | Wickhollow, Bogmire | The great wraith, then the Bogmire refit |
| 2 | 5 to 10 | Dawnroost | Envoi, and the charge from Dawnroost's living node |
| 3 | 10 to 15 | The wilderness north of Dawnroost | Halcyon, then the final upgrade |
| 4 | 15 to 20 | Misthollow and the dead Moonwell | The finale |

### Level 1 is the Night square demo

- **The first fight should feel like the Night square demo** (`reference/demos/night-square-shadow-wraith.html`), so its numbers are the level 1 baseline. They outrank the bible's level 1 numbers.
- **Each move keeps its own size:**
  - an ordinary hit from Io is about 100;
  - her spells hit harder;
  - Lunara, whom she can summon from level 1, hits for about 2,000.
- **Everything grows about 20% per level from its level 1 number.** That is why Envoi hits so hard by level 20.

The baseline, from the demo:

| | Level 1 |
|---|---|
| Io | 1,400 HP, 120 MP |
| Attack | 70, 75 and 120 |
| Flame Bolt (12 MP) | 330 |
| Nightbloom Briars (18 MP) | 260, and binds the foe |
| Crescent Blades (24 MP) | a run of 88s |
| Lunar Mend (16 MP) | heals 380 |
| Trance, Moonlight | 420, 380 and 450 |
| Lunara, once a battle | six beams of 150, then Moonfall for 1,150 |
| Shadow Wraith | 4,200 HP; Sweep 190, Bolts several 70s, Grasp 250, Eclipse 480 once below 35% HP |

The demo swings damage by 7% either way. The decided swing of up to 25% replaces it.

### The Ember Line

- Confirmed: the sunstone veins that Noctara's cold is dimming are the Ember Line.

## October 2, 2026, fourth round

### Working from a second account

- From here on the work happens on the `second-account-work` branch, and pages are published from Chris's second Claude account.
- Publishing here doesn't touch the first account. Its pages and links stay as they are, and it can keep publishing. Pages published here are private to this account until Chris shares them from the page's Share menu.
- The sibling repos stay read-only.

### Polish everything

- **Every item on each model's "what's left" list gets done.** The goal is a game as polished as it can be.
- **Every main character's model and every attack visual gets finished,** and the level scaling and fight balance are worked out, before the story's fights are placed.

### The order of work

1. Rebuild Noctara's page with the finished models (done October 2).
2. Finish every model's "what's left" list.
3. The cast page.
4. Phase 2, the battles.

### The whole game at night

- **The whole game takes place at night.** Walking maps, battle backdrops and the flying map are all night scenes. How the story explains it is a lore question (`questions/open.md`).

### The world maps

- Chris is painting the world maps himself, matched to the current world but more detailed: nine highly detailed images, with night versions.
- The game compresses them so pages stay small. The far view from the Magpie doesn't need full detail; the closer aerial views are for walking.

## October 2, 2026, fifth round

### Fights on the walking maps

- **Towns are safe,** with people to talk to: shops, and people who give information.
- **The wilds have random encounters.** No foes are drawn on the map; walking through the wilderness (or other places set aside for it) can start a fight at any step, and a player can walk back and forth to grind levels. The encounter rate has to be balanced.
- **A few fights are set** at fixed places: the gate fights and the story fights.
- **Gate fights are a little harder than the wild fights** around them.

This replaces the visible packs from Aethermoor that the plan first proposed.

### The foes

- **Keep the foe list as it is:** wisps, frost wisps, wraiths and the great wraith, for about 60 fights from level 1 to 20, plus Halcyon and Noctara.

### The story's fights

- **The ambush moves.** Halcyon's ambush happens just before the level 15 gate, as the party, at about level 15, approaches it. It no longer comes early in the story.
- **Dawnroost has a fight at the level 10 gate.**

### Halcyon's face

- **Halcyon's face stays as it is.** Chris thinks her model is one of the best-looking ones. It comes off the polish list.

### Night and the stars

- **It is always night because Noctara the Starless is affecting the land.**
- **The sky has no stars until the ending.**

### Size and length

- **The goal is about five hours of play.**
- **The final deliverable is one HTML file,** around 30 MB at most. A published page can be 16 MB at most, so the published game is one link with its paintings as separate files beside the page; the single file is the same game with everything inside it, sent to Chris to keep.

### Maps

- **The nine world map images are a 3×3 grid of the whole world.**
- **The Magpie flies through weather:** the drifting clouds and fog of `reference/demos/the-magpie.html`, which make flying look real. They stay.
- **Walking maps are their own images,** painted close to the ground (`art-requests/04-walking-maps.md`).

### Battle backdrops

- All eight from art request 03 arrived on October 2, 2026. The originals are in `reference/art/backdrops/`, and the game's compressed copies in `art/backdrops/`.
