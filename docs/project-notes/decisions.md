# Chris's decisions, newest first

Written November 18, 2026, from the memory notes of the claude.ai project "Envoi And Moon Faire Building". Every line
is something Chris said. Nothing here is Claude's suggestion or reasoning.

How to read it:

- **Stands** means nothing later in the notes changes it.
- **Replaced** means a later decision changed it. The line says which one.
- **Overtaken** means it was a plan for a step that has since been done.
- Things Chris was still weighing are marked **Still deciding**. They are not decisions yet.

Personal details about Chris's family are left out. The hub's own fuller list, with what was delivered when, is
`claude/envoi-moon-faire-witches.md`. Decisions about travel and the map are also in `claude/travel-and-3d-map.md`.

## November 18: the merge

These come from the notes kept about the merge itself, outside this project's own notes.

- **Stands.** The two games are going together: the 3D Envoi and Moon Faire become one game. Still deciding how to do
  it, not whether.
- **Stands.** The game is now called **Coven of the Moon Faire**. (Replaces the working name "Envoi: Coven of the
  Moon Faire" from earlier the same day.)
- **Stands.** It gets a new repository (suggested name `coven-of-the-moon-faire`). The two old repositories,
  `envoi-on-the-longest-night` and `moon-faire`, stay as sources. Assets move over only as they are needed.
- **Stands.** No new claude.ai project for it. The instructions, the knowledge and the game notes live as files in the
  new repository, so they are easier to edit and update.
- **Stands.** Each project's notes are pushed to its own repository first. (This folder is that step for Envoi.)
- **Stands.** The plan for the merged game: use Envoi's zones, 3D world map, combat and everything else already built
  for the 3D Envoi. Bring in Moon Faire's NPCs, lore and open map. Use the open map to make the wilds of the
  Aethermoor 3D map walkable, everywhere or at least much more of it. Then keep building from there.
- **Stands.** The lore, the NPCs' minds and the combat balance across the whole game all need reworking. Moon Faire's
  gating system is different from Envoi's.
- **Stands.** Chris feels Envoi is further along, because he already made a 2D version of it, though his more recent
  work went into Moon Faire.

## November 17

- **Replaced** by November 18's merge. Chris wanted Moon Faire and the new Envoi to collaborate and fuse, and was
  weighing how to fuse the two projects and their repositories.
- **Stands.** The 3D star map of the Thareia system is the star system map for his game: twin suns, a far star,
  Thareia and its moon Aurous, and 4 other planets. He moved that work into this project.
- **Stands.** Lore: aether crystal and the airships' amber sunstone are the same stone. They are amber crystals.
- **Stands.** Thareia's surface on the star map should look like the 3D map of Aethermoor built in this project. Only
  one continent of Thareia, Aethermoor, has an image so far. He has maps of the islands around it.
- **Stands.** For the 3D world (the four walkable zones), the laptop is the main screen. It should be highly detailed
  and look really good at the upper end of what his laptop can draw, with no corners cut. Working on a phone is
  secondary.
- **Stands.** No see-through buildings. The wall pattern repeating on the sides of buildings did not look good. The
  roofs are fine.
- **Stands.** After seeing zone 1 reskinned: "everything looks really good". He likes the camera moving to directly
  above Io when it has to.
- **Stands.** Two looks to switch between in the 3D game: the normal one, and a very fine flipbook look like the 3D
  models' flipbook toggle, with its pixel-size slider. He likes the finest setting.
- **Stands.** Laptop controls: tapping the forward key twice makes her run, with no holding Shift. Shift is a super
  run. No on-screen joystick on the computer, because it makes moving harder. The file should tell a phone from a
  laptop.
- **Stands.** Instead of round three of the textures, he wants one markdown document of the picture prompts that
  would help all four zones. He takes it to the same session that made the current textures. (Replaces the earlier
  wait: he had held off on round three until he saw the reskinned world.)

## November 16

### The 3D map of Aethermoor

- **Stands.** (night) He uploaded his "Field & Forest · Forest Builder" page and asked for the 3D map to do something
  like it, with real tree models like those as you zoom in.
- **Stands.** (evening) Flights use Skies of Aethermoor's own ships. Its four ships are part of the gates between
  zones: upgrading the ship.
- **Stands.** (evening) The first 3D-land version runs fine on his phone. He wants a second, high-detail version for
  his laptop, two or three times as detailed.
- **Stands.** (evening) The ground is coloured by what each zone's environment looks like in the game, since the zones
  are different regions. The repository's texture packs are used to make the ground and trees look more real.
- **Still deciding.** (evening) Having an image AI paint a realistic picture from screenshots of the map, to lay over
  the 3D land.
- **Stands.** The map must be a real 3D model of the world, not the map painting printed onto a shape. The elevation
  is inferred from the picture. Cruder is fine. It can be turned to look around. It is a terrain map: you would barely
  see cities, maybe the castle. He would love the areas already built in 3D to be shown correctly on it, and accepts
  that may be asking too much.

### Travel and the shape of the game

- **Stands.** Zones are the game's four level bands.
- **Stands.** Every flight between zones has Skies-style raider attacks. The flight's distance sets how many: one,
  two or three raiders. Flights are harder later in the game and at a higher level.
- **Stands.** Skies' Crystal Shards are the same shards Envoi uses to upgrade the Magpie and open zones.
- **Stands.** A zone opens on several conditions: the party's level, and the crystals to buy passage or the upgrades
  for that flight. Flights use the night map.
- **Stands.** A separate conversation builds a 3D map of Aethermoor that shows where you are whenever you travel, by
  flight or on foot. For a flight it shows a dotted line from here to the destination, then switches to Skies to fly
  the ship.
- **Stands.** Air travel between zones uses his airship game, Skies of Aethermoor, which is its own, fairly advanced
  game (repository `airship-game-in-aethermoor-`).
- **Replaced** by November 18 as to where it lives: the game moves to a new repository. What stands: it is a big game
  kept as a folder, with the zones as big sections so it can be as massive as he wants. (On November 16 the folder
  was in this repository.)

### The 3D world

- **Stands.** Every area that looks walkable must be walkable, so players are encouraged to explore. If much looks
  walkable but is not, people stop trying.
- **Stands.** Many items exist in 3D only as a shimmer, hidden. An item card pops up when one is found.
- **Stands.** He is a fan of little pockets you walk into while exploring.
- **Stands.** The wild zones are larger open fields, not bound to the single painting, with creepy thorny trees, more
  places to explore, and heavy fog so less is drawn at once.
- **Overtaken.** Build the whole 3D world now with the stand-in textures, using subagents, while he hands his textures
  over slowly in a separate conversation. (He had rounds one and two made, but uploading was slow. Both rounds came
  in that day, and the zones were reskinned with them on November 17.)

### The game, its people and its story

- **Replaced in part** by November 18's merge. It is Envoi, but not "On the Longest Night": a second game, an
  alternate universe that does not have to agree with the first game, reusing that game's digital assets and the
  techniques learned since. The alternate universe stands. As a separate game it is replaced: it is now part of Coven
  of the Moon Faire.
- **Stands.** Because it is an alternate universe, another game in Envoi's same places, the lore and the NPC
  conversations need writing new.
- **Stands.** Halcyon is still a woman. She becomes Moon Faire Io's simple body in a paladin outfit from Moon Faire's
  Io-outfits model, with her face repainted and a glow aura made in code. Glowing with her face hidden may be enough.
- **Stands.** The Io-outfits model is Moon Faire's base doll: light models, 21 outfits, on the Moon Faire repository's
  base-doll-light branch.
- **Still deciding.** He thinks the doll's outfits look better than the fair folk NPC models. With slight changes,
  especially face coverings, they could become different people.
- **Stands.** The Queen of Darkness, Noctara, is replaced by Moon Faire's big bad 3D model, so darkness can mean
  something different.
- **Stands.** The Jester is named **Kore**: a moon name like Io, since both are witches of the Moon Faire.
- **Stands.** The four are separate witches who work together, "the coven quartet": Io the Herbal Witch, Kore the
  Jester, Europa the Fox and Callisto the Ranger, all moons of Jupiter. Moon Faire uses all four. In Envoi, Io and
  Kore are the first two. His bigger story is how the four come to know each other.
- **Stands.** Io and Kore are not sisters. They are very close friends, which could grow into something deeper later.
- **Stands.** He wants Io's and Kore's lore developed for both games: why their magic and attacks are what they are.
  He wants thorough lore written for all four witches, and will tell each one's background himself.
- **Stands.** Kore works in Moon Faire's party of four but needs balancing in Envoi's party of two. Nothing is final.
  Decided: Kore gets more HP, very high HP. She goads foes into attacking her, so the way to win is to let her get
  hit as often as possible. Her Fate move should be outrageously, overwhelmingly powerful. (This changes part of the
  November 15 decision below that her Fate rules stay exactly the same.)

### How the work is organised

- **Replaced** by November 18: there is no new claude.ai project, and the notes live as files in the new repository.
  On November 16 the project's knowledge was to be a collaboration space: several conversations doing different jobs
  at once, handed out through a board document in the project's knowledge and not through subagents (for example,
  other conversations taking the fight-math rebalance and the 3D world).
- **Stands.** Wherever assets are saved, everything stays labeled and keeps being labeled, so assets can be used
  easily in future projects. This is already a habit across his work.

## November 15 and just before

- **Stands.** He plans to make the whole game 3D, starting from texture packs of all of Envoi's maps. He makes the
  textures himself from the prompts, round by round.
- **Stands.** Io's spells use the Envoi summon and all the Lunara spells. (Replaces his earlier choice to leave the
  Envoi summon out.)
- **Replaced in part** by November 16: the Jester's Moon Faire Fate rules stay exactly the same. (Her HP and the
  strength of her Fate were turned up for the party of two.)
- **Stands.** Keep Envoi's levels, foes and spawn rate. Only the final boss comes from Moon Faire.
- **Stands.** Bring in Moon Faire's NPCs, at their lightest models, fitted to Envoi's storyline. (On November 16 he
  added that their words must be written new.)
- **Stands.** Both witches get a trance effect made in code, with something special on their strongest move. For the
  Jester's Curtain Call: glowing purple, purple mist or pixel particles.
- **Stands.** Lore: Io is the herbal witch, the healer, who can also summon powerful deities to do damage. The Jester
  is the witch of the duality of life and death, fate. Her Curtain Call is Moon Faire's super move.
- **Stands.** Use Envoi's game with Moon Faire's models. Moon Faire's Io replaces Io. The Jester completely replaces
  Sol and brings her own moves. Both use their lightest models for walking and fighting. It is mainly a combat
  rebuild: renaming, new numbers and math, rebalanced into a new game.
- **Overtaken** by the decision just above. He first wanted to try swapping Moon Faire's Jester and Moon Faire's Io
  in for Envoi's Io and Sol, in a new folder of this repository, with new animations for Io and more visually
  interesting battles. He likes the Jester: "she is cool".
- **Stands.** This project's builds are delivered as single downloadable HTML files, not as artifacts. (Two pages
  were made as artifacts all the same and are saved in `artifacts/`.)
