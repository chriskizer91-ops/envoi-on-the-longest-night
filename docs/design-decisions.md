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

## October 2, 2026, sixth round

### The world map

- **The bands and stops sit where the proposal put them** (`../reference/art/world-map/bands-and-stops.webp`): band 1 in the southwest and the southern wetlands (Wickhollow, Bogmire), band 2 in the western forests and riverlands (Dawnroost), band 3 in the northwest and the northern passage, and band 4 in the snowy northeast peaks (Misthollow).
- **The rest is under mist.** The central island capital, the eastern mountains and desert, and the southeast canyon coast are not in the story. Mist covers them, and the Magpie can't fly over them.
- The night versions of the nine tiles arrived on October 2, 2026 (`../reference/art/world-map/night/`). They line up exactly with the day tiles. Some joins differ in brightness; the game blends them in code.

### Money

- **Fights give money.** The Magpie's upgrades cost money as well as needing the party's level, so moving on to the next band takes both enough fighting and enough levels.
- Shops sell herbs. What the money is in the world is a lore question (`questions/open.md`).

### Halcyon's ambush is the level 15 gate

- **One fight, not two.** As the party, at level 15, approaches the place that opens the next band, Halcyon ambushes them. That place is a shipyard, where the Magpie gets its final upgrade.
- **Halcyon is level 20, and the fight is overwhelming.** It ends one of two ways: the party falls, Sol steps in front of Io, and Halcyon leaves; or, if they bring her down to 20% of her HP, she retreats into the dark. The story goes on either way, and Sol learns Kestrel Stoop.
- Halcyon is the exception to "gate fights are a little harder than the wild fights."
- The shipyard is proposed at the fortress at the end of the long stone bridge in the northern passage.

### Dawnroost's gate fight

- **The largest group of stronger wraiths the party has faced so far** attacks Dawnroost at the level 10 gate.

### Art requests

- **Future image requests come as Markdown files,** sent in the chat. The HTML page was too clunky.

### The camera for summons

- **Whenever Envoi is summoned, the camera pulls back to a wide shot** so the whole wyrm is in frame. It stays wide for its strike, a blow on its ward and its leaving. The battle's camera does the same for every summon.

## October 2, 2026, seventh round

### Money is sunstone shards

- **The money is shards of sunstone.** Fights give them, shops take them for herbs, and the Magpie's upgrades cost them. Sunstone is also what gives the Magpie its lift, so the money and the ship run on the same thing.

### Envoi and Dawnroost

- **Envoi is made after the Dawnroost fight,** as its reward. It is not in the summon menu during that fight.

### Halcyon's ambush

- **The party learns the knight is Halcyon during the ambush fight, because Sol recognizes her.**

### The Aurosi and the shipyard

- **The shipyard is run by the moon's people.** Chris's own D&D world (his Thareia and Aethermoor compendium, `New-game`, branch `claude/tender-babbage-4wiplk`, `thareia/lore/thareia-aethermoor-lore-compendium.md`) calls them the **Aurosi**: the elves and gnomes of Auros, the moon.
- What Chris said about them: this world's elves. They grew up on a moon much like this world but with less gravity and covered in sunstone, so they are elegant, fancy, wealthy and long-lived, and they control the shipping. They haven't been depicted anywhere yet.
- In this game they appear only at the shipyard for now. One of them is the shipmaster, a new character.
- How this fits with this game's Auros, the living Moon asleep in the sky, is a lore question (`questions/open.md`).

### Talking portraits

- **When someone speaks, a detailed painted portrait of them appears** beside the words, so the player sees who they're talking to and not only a tiny pixel sprite. The pixel sprites stay for walking. Portraits are requested in `art-requests/05-portraits.md`, starting with a pilot of Io, Sol and the shipmaster.

## October 2, 2026, eighth round

### The phone budget

Chris checked the cast page on his Pixel 7a:

| What was on screen | Models | Triangles | Draw calls | Frame rate |
|---|---|---|---|---|
| The finale with Envoi summoned (Io, Sol, Halcyon, Noctara, Envoi) | 5 | 422,000 | up to 236 | 60 |
| Everyone, with both summons, through Envoi's summon and strike | 8 | 598,000 | up to 298 | 39 |

- **Five models at 60 frames a second is the budget a battle is built to.** No fight puts eight on screen.
- **Chris's older phone doesn't load the cast page.** Its make and whether it opens a single model's page are still to find out. The cast page now builds each model only when it first appears, to ask less of an older phone.

### Talking portraits

- The pilot portraits arrived on October 2, 2026: Io, Sol, and the shipmaster. **The shipmaster is a woman (portrait A).** Originals in `../reference/art/portraits/`, the game's copies in `../art/portraits/`.

### Ground-level maps

- The three pilot maps arrived on October 2, 2026: Wickhollow square, Bogmire and the northern crossroads (`../reference/art/walk/`). The walking test checks their scale against the pixel Io.

## October 2, 2026, ninth round

### The walking scale

- **Io is 36 map pixels tall on the ground-level maps** (Chris). The pixel Io is drawn 24 × 36 art pixels, so one pixel of her is one pixel of the painting; a zoom setting chooses how close the camera is.
- Chris asked for a better pixel Io; she was redrawn with three-tone shading, round glasses, curled horns, the gold band and moon, wavy hair and gold trim.

### The shipmaster's name

- **Ysmera Brightkeel.** Chris left the name to Claude. She is an Aurosi elf, the woman of portrait A, and runs the shipyard where the Magpie gets its final upgrade.

### The older phone

- The cast page doesn't load on Chris's older phone even with models loaded as needed. It works on the phone he uses every day (a Pixel 7a), which is the one that matters. Not pursued further.

### Art

- **All 13 ground-level maps arrived** on October 2, 2026, including the two optional ones (the Thornwood and the frozen pass). Every image requested so far is in.

## October 2, 2026, tenth round

### The walking scale

This round replaces the ninth round's 36 pixels.

- **Io is 42 map pixels tall** (Chris). Anything from 42 to 45 fits all 13 maps, without her looking too big on some or too small on others, and he likes 42 for the number. She is drawn 28 × 42, still one pixel of her to one pixel of the painting.
- **The camera zoom is 1×:** one map pixel to one screen pixel.
- **One walking speed, twice the first test's.** That's 110 map pixels a second, about two and a half of her heights. There's no separate run, so there's only one speed to build.
- **Every walking map gets a navigation mini-map** in a corner: the whole map, the part on screen and a dot for Io. Once the maps are traced, it can also show the paths, the exits and the towns.

### Image compression

- **Battle images stay high quality.** They are still compressed from the originals, but only lightly.
- **The walking maps can be compressed harder,** down to a lower resolution, even if they look a little more pixelated, since a pixel character walks across them. The walking test carries every map at 1024 and at 768 pixels wide (from the 1536 originals) so Chris can choose; positions stay in the originals' pixels whatever size is shipped.
- **The world map seen from the Magpie can be compressed the most.** It is seen from high up, at night and through mist, so fine detail isn't missed. Even so, nothing is compressed too much.

## October 2, 2026, eleventh round

### Walking

These answers settle what the tenth round left open.

- **Io stays 42 map pixels tall** (Chris).
- **The walking maps ship at 768 pixels wide, drawn with sharp pixels.** Chris compared them with the 1024 copies, and the 768 ones looked best to him. The 1536 originals stay in `../reference/art/walk/`. The walking test drops from 9.3 MB to 2.7 MB.
- **The standard camera zoom is 0.7×.** At that walking speed, 0.6 to 0.7 works on most maps. At 0.8 or 0.9 some maps don't show enough of the surroundings to choose a direction easily, though the mini-map helps.
- **A map can have a closer zoom of its own** (0.8 or 0.9) where it is more detailed. Which maps get one is decided once Chris has walked them.
- **The mini-map stays.** Chris found it a big help for finding the way.

### The battle groundwork

The rules tables, the battle engine and the balance simulator are built (`../src/battle/`, `../tools/balance.mjs`, `balance-report.md`). All 25 balance targets in `plan.md` are met.

Several rules and numbers are new, set while balancing. They wait for Chris's approval (`questions/open.md`):

- **The finale is a race.** Noctara's cold deepens: she and Halcyon hit 6% harder with every turn they take.
- **Halcyon at Noctara's side** fights at a little over a third of her ambush strength.
- **Dawnroost** is three level 12 wraiths.
- **Trance** lasts at most four of the hero's turns.
- **Kestrel Stoop** costs 40 Heat.
- **MP** grows 6% a level.
- **Wisps and frost wisps** have their own moves.
- **Herbs** cover only the statuses this game has.
- **The Magpie's upgrades** cost 500, 1,800 and 4,500 shards.

## October 2, 2026, twelfth round

- **Chris approved every new battle rule and number** from the eleventh round:
  - the finale as a race, with the cold deepening;
  - Halcyon at Noctara's side at a little over a third of her ambush strength;
  - Halcyon's ambush tuning;
  - three level 12 wraiths at Dawnroost;
  - Trance lasting at most four turns;
  - Kestrel Stoop at 40 Heat;
  - where Lunara's beams and Envoi's strike land;
  - MP growing 6% a level;
  - the wisps' and frost wisps' moves;
  - the five herbs;
  - the Magpie's prices.

  They are no longer "proposed".
- **Step 12, the first fight, is next.**

## October 2, 2026, thirteenth round

### The players the balance is built for

The simulator plays three kinds of player (`../src/battle/sim.js`):

- **Careless:** picks commands almost at random, with Attack most often. Heals only when in the red (under a quarter of HP), and only half the time. Never plans for a big blow. Sol attacks and now and then tries a random Sword Art.
- **Attentive:** the average player once they have learned the spells, which Chris expects in the first five to ten fights. Heals anyone under about half (both at once with Waxing Light). Keeps MP back for a heal and uses the spell the foe is weak to. Revives the fallen, drinks Silver Mugwort when out of MP, and calls Lunara when the party is low. Sol builds Heat and cashes it in with Solar Crest. This was called "sensible"; the code keeps that name.
- **Expert:** plays perfectly. Heals before the next blow could land, counting every foe that can act first. Shields against charged attacks with Envoi's ward, Lunara or Moth Veil. Delays bosses with Briars, keeps Sol in Sunburn with Moonsteel and sunders bosses. Never hits into Warden's Vow.

### Difficulty

- **No difficulty setting.** The game should be beautiful, exciting and fun, and the player should feel invested in winning or losing. That means it can't be too easy or too hard.
- **The average player should lose sometimes.**
- **The first fight:** a player who pays attention doesn't lose it; a careless one often does. The lone wraith now hits 15% harder than the Night square demo. An attentive player wins every time, though about a third of their fights get close; a careless one wins about three in five.
- **An expert is all but certain to win until about level 15.** The last band is where an expert is tested.
- **Leveling should get a little harder after the first couple of levels** (for the progression pass, below).

### The progression pass (noted, not built yet)

- **The last five levels hold a third to half of the game's fights.** Perhaps half the game happens between 15 and 20, so the last quarter of the leveling takes half the game.
- **How a wild foe's level is chosen** is a question for Chris (`questions/open.md`). For now the simulator gives each wild fight foes at the party's level.

## October 2, 2026, fourteenth round

### The frame rate

- **Lunara's summon was choppy on Chris's phone.** He asked whether the battle could run at 45 or 30 frames a second on purpose, since the game leans retro.
- **What causes it:** measured headless, no shader compiles and no large textures load during the summon. The stutter is the work in each frame: Lunara, her light and her effects drawn over the whole screen. A lower frame rate gives each frame two or three times as long.
- **The battle screen has a frame-rate button** in its header. It cycles through the screen's own rate, then a cap of 60, 45 and 30. Frames are paced to the screen's refreshes, so 45 and 30 stay even on a 90 Hz phone, and 30 on a 60 Hz one. The choice is kept in the browser.
- **The end card shows the fight's frame rate:** the average and the slowest second, with the cap.
- **Chris picks the default** once he has tried the caps on his phone.

### The observing session's findings

Another session read every commit and replayed the simulator. What it found:

- **Kestrel Stoop never landed its hit.** The engine played the hover and the dive but dealt no damage. Fixed: the dive hits for its 1,500 at level 1.
- **With the hit, an expert won the finale 87% of the time,** against a target of 40% to 65%. To keep the approved target, the cold deepens faster: Noctara and Halcyon hit 7.5% harder with every turn they take, instead of 6%. An expert at 20 now wins 60%; at 19 none, with losses leaving 38% of the bosses' HP. All 25 targets are met.
- **Moth Veil covers only one hero,** though both Void Sphere and Black Noon hit the whole party. A question for Chris (`questions/open.md`, 7).
- **In the finale, Io's choices decide the fight** (Envoi, herbs, Lunara, Briars, Moonlight); Sol's barely matter. Something for the gates to teach, in the progression pass.
- **Fight length:** the session found on-screen fights running longer than the simulator says. Measured at real speed on the battle screen:
  - Ordinary moves match the simulator's times within a few percent: the first fight ran 35.8 seconds on screen against 34.0 estimated, and a level 8 party fight 58.4 against 56.6.
  - Summons and Trance ran long. A level 12 expert fight with Lunara and a Trance ran 77.2 against 66.4. Lunara's arrival plays for about 9.8 seconds (the simulator had 6), her strike 9.4 (it had 7), Envoi's arrival and strike about 8.2 each (it had 6 and 7), and each Trance transformation 3.8 (it had none).
  - The rules now use those times. Win rates don't change; the long fights get a little longer (the finale's median is 8.6 minutes instead of 8.0).

### Envoi on the party page

- **Envoi is in Io's Summon menu from level 11,** after Dawnroost, once Sol has 70 Heat. The party page didn't have it yet, which Chris noticed.
- **It plays as on its bench:**
  - Io's letters fold into the wyrm, and Sol's blade lights its heart lantern, spending all her Heat.
  - The seal breaks, and it coils into the Folding Ward, which takes the next attack whole. The foes aim their blows at the ward, and it throws off their darkness.
  - When Io's gauge next fills, it wraps the foe she chose, burns from tail to head as a ring of fire, and drops its heart for the Last Word. Io still takes her turn.
  - If the fight ends first, it burns away quietly.

## October 2, 2026, fifteenth round

### The world travel system

- **Chris sent the Magpie's world travel demo,** to make the world feel bigger: `../reference/demos/the-magpie-over-aethermoor.html`. It is the newer version of `the-magpie.html`. Its readable code is an earlier version, in the read-only `chriskizer91-ops/20-min` repo, branch `ccr-5afa0fa7-7ojc16` (`src/airship/main.js`, `src/actors/airship.js`).
- **It flies over this game's night atlas,** with the tiles' joins blended, at 3072×2048. The map was compressed to AVIF (about 740 KB) and the fonts to WOFF, so the whole page with three.js and its music is 2.6 MB. That is how the flying map stays small.
- **It is what step 19 builds on:**
  - the skiff in 3D;
  - tap-to-fly, steering and full sail;
  - the follow camera, zoom, the whole-map view and the mini-map;
  - town banners, sight pins and town cards;
  - docking and take-off;
  - the clouds and fog;
  - the flying music, Sunstone Wind.
- **Its place names and town notes come from the other game and the map pack:** Mayor Gretch, Nettie, Quill, Hilde, Mother's Hollow, Willowmurk, Rotbridge, and Misthollow as sunken ruins in the fen. In this game the flying map shows this game's four stops and bands, with mist where the ship can't fly yet, and the notes come from this game's lore. Mother's Hollow belongs to the Drowned Mother's story and stays out. Question 2 (`questions/open.md`) still asks about the names.

### The finale: you have to be locked in

- **The average player should win the finale even less often than one time in eight.** It should almost require being locked in, but not be impossible.
- **The cold deepens 8% a turn** (it was 7.5%). An expert at 20 wins half the time, and an attentive player about one time in eleven. A new target holds the attentive player at 3% to 10%.
- **At 19 the party falls with about two fifths of the bosses' HP left.** That gap comes from the level curve, so the finale at 19 no longer looks close. Its check allows up to 45%.

### Wild foes' levels (question 6, answered)

- **Each wild foe is a level in its band's range:** 1 to 5, 6 to 10, 11 to 15 and 16 to 20, whatever the party's level. A stronger foe gives more experience, as before: experience grows with the foe's own level.
- **So a band is dangerous to enter and easy by its end.** Entering a band (wild fights, 1,000 each):
  - at level 6: careless 72%, attentive 99%;
  - at level 11: careless 58%, attentive 97%;
  - at level 16: careless 39%, attentive 93%.

  Late in each band, nearly everyone wins. New targets cover the band entries.
- **The party page rolls its foes this way,** and each foe's level shows in the foe window.

### The progression pass: the experience curve (noted, not built)

- **With the curve as it is, the last band holds about 9 of 55 wild fights (16%).** Chris wants a third to half.
- **Getting there means about double the experience per level from 16 on,** and a little more each level after the first few. That makes about 100 wild fights in all, instead of 55: roughly an hour more of fighting.
- **The other way to get there** is to make the early bands quicker and keep the game near its current length. A question for Chris (`questions/open.md`, 9).

## October 2, 2026, sixteenth round

### How long the game is (question 9, answered)

- **About 70 to 85 wild fights, with the last band holding about 40% of them.**
- **The experience curve is set to match:**
  - about 79 wild fights from level 2 to 20, 40% of them between 16 and 20;
  - the first band (levels 1 to 5) levels 20% quicker;
  - from level 3, each level asks 2% more than the curve;
  - from 16 on, each level asks 2.7 times as much, so the last level alone takes about ten fights.

  All 32 balance targets are met.
- **Shards outrun the Magpie's prices now.** With wild foes at their band's levels and more fights, a player who skips nothing has about 10,200 shards by level 15, against 6,800 for all three upgrades. The prices are reset in phase 3, together with the shops.

## October 3, 2026, seventeenth round

### Losing a fight (question 10, answered)

- **The party wakes at the last rest** with everything it had: experience, shards and herbs. The fight waits.
- **So the world needs rest places:** every town, and camps where the way between towns is long. They are placed in phase 3, with the fights.
- **Halcyon's ambush is the exception:** losing it goes on with the story.

### The frame rate

- **Battles run at 30 frames a second by default.** Chris finds it fine for the fights, and it suits the retro look. The button stays for testing; a phone that already has a choice saved keeps it.

### Moth Veil (question 7, answered)

- **It stays on one hero,** and the balance stays as it is.

### Kestrel Stoop's hover (question 8, answered)

- **While Sol hovers, she is out of reach until her next turn,** as Freya's Jump works in FF9:
  - blows aimed at her go to Io;
  - blows on the whole party pass under her, and "Out of reach" shows over her;
  - she can't take Io's blows (Guard, Warden's Oath) while she is up;
  - if she is the only one standing, the foes' blows miss.
- **The expert uses it as a dodge:** she rises when a charged blow, Void Sphere or Black Noon, will land before her next turn.
- **With the dodge, an expert won the finale 67%,** so the cold deepens 8.5% a turn instead of 8%:
  - an expert at 20 wins 58%;
  - an attentive player wins 8%, about one time in twelve;
  - at 19 nobody wins, and losses leave 38% of the bosses' HP, closer than before.

  All 32 targets are met. Halcyon's ambush doesn't change, since Sol learns the Stoop after it.

### Place names (question 2, answered)

- **The world map doesn't change; where names clash, the names change.**
- **The Magpie demo has the most accurate map of Chris's D&D campaign,** so its places and names are the reference (`../reference/demos/the-magpie-over-aethermoor.html`). The game's places on it are drawn in `../reference/art/world-map/places-on-the-dnd-map.webp`.
- **Where the game's places sit on that map** (atlas pixels, 4608 × 3072):

  | The game's place | Where | On the D&D map |
  |---|---|---|
  | Wickhollow (1) | 1348, 1838 | Wickhollow. It moves there from the first bands map's dot, about 400 pixels southwest of it. |
  | Bogmire (2) | 1752, 2512 | Bogmire |
  | Dawnroost (3) | 1325, 1098 | Thornhollow, the rangers' outpost: in this game it is Dawnroost |
  | The shipyard | 2097, 599 | A town on the north coast with no name on the map |
  | Misthollow (4) | 3500, 735 | Ironhold, in the Ironspire Peaks: in this game it is Misthollow |

- **The fen's "Misthollow Ruins" become the Sunken Ruins,** so there is only one Misthollow: a description until Chris names them (`questions/open.md`, 11).
- **Every other name from the D&D map stays:** Rotbridge, Willowmurk, Mosswatch Tower, Eldergrove, Fawnrest Shrine, Frostmere Lake, Peak's Veil, Stormwatch, and the regions (the Gloamwood, the Gloomfen, the Verdant Wilds, the Ironspire Peaks). Hearthstone Keep and the eastern wastes (Dusthaven, Sandspire, Miragewell, the Scorchgate Ruins) are under mist all game. Mother's Hollow stays out: it belongs to the Drowned Mother's story.
- **The town notes on the flying map** come from this game's lore, not from the other game.

## October 3, 2026, eighteenth round

### The observing session's earlier list

Chris passed on the other session's first assessment, with each item's status against its later list (which hasn't arrived here yet). What was done with each:

- **Two rules from lore answer 12 were missing.** While Envoi's ward is up, Noctara can't use Blackout. Envoi's strike clears the Frost Dust slow: its fire burns the frost away, with the blow that was waiting in it. Both are in now.
- **Two rule quirks are fixed:**
  - Sunburn counts as a move begins, so an Art that spends Sol's Heat below 70 still lands hot;
  - Moonsteel's moon edge waits for a move with no element of its own, so a Sun Art no longer wastes it.
- **Most players never saw the Kestrel command.** It waited for Halcyon at half her HP. At level 15, where most players meet her, that never happened; at 17 it came up in under half the expert's fights. The design says Sol recognizes her during the fight, so the command now comes from Halcyon's third turn, or at half her HP if that comes first.
- **The expert wasn't quite perfect:**
  - Without Guard it won the finale 75% instead of 59%, because a turn spent guarding loses more than it saves in a race. It no longer guards in the finale; nothing else changes.
  - Moth Veil helps it now (without it the expert wins 33%), so that part of the old finding no longer holds.
- **The finale, retuned for the better expert:** the cold deepens 9% a turn.
  - a perfect player wins 74% at 20;
  - an attentive one wins 6%, about one time in sixteen;
  - at 19 a perfect player wins 3%, and losses leave 31% of the bosses' HP.

  The design's "a player who plays well wins about half the time" now means someone between the two. At 10% a perfect player would win 60% and an attentive one about one time in fifty; Chris can choose that instead. All 32 targets are met.
- **A stronger opening with a gentler climb** (Noctara hitting harder from the start, the cold growing slower) was measured. It keeps the same gap between the expert and the attentive player, so the climb stays.
- **Kestrel Stoop's dive** lands about 1,510 at level 1, more than two Ember Rushes (1,360), as the design asks.

### Noted for later steps

- **Step 17, the finale:**
  - Show the cold deepening on screen, so players know it's a race.
  - When Halcyon falls in the finale she kneels, as a visible second phase, rather than leaving. Nobody dies on screen until the ending, where she goes home as a moth. At 19, Halcyon is already down in almost every loss, so the kneeling shows how close it was.
- **Phase 3:**
  - The finale leans on herbs: without them a perfect player wins far less. Herb prices and what a player can carry are set with the shops.
  - Wild fights get tested in a row, carrying HP, MP and herbs, not each from a fresh start.
  - The gate fights should teach what the finale asks for: Envoi's timing, Lunara, Briars, the Trance finishers, and now Kestrel Stoop's dodge.
- **The simulator, optional:** a skilled human play style that doesn't read the hidden numbers, for tuning.

