# Moonlight in the Aether: Model Prompt Pack

Oct 1, 2026 · @Chris

## How the workflow runs

Each model gets its own conversation that starts from a short prompt and two project files, so none of them carries this chat's long history. You generate the art once, build the five models in parallel, then wire them into the game in one integration chat.

1. **Generate source art.** Two sheets per model (section 3): a model sheet and an action sheet. Attach your old sheet as costume reference when you generate.
2. **Load the project.** Add two files to this project's knowledge: the Lore & Party Bible you already have, and a file called `Model Build Spec.md` holding section 4 of this doc word for word.
3. **Build the five models.** Open one new chat per model, attach its two sheets, and paste its build prompt from section 5. They don't depend on each other, so run them in any order.
4. **Integrate.** Bring each finished model file and its integration card to one new chat with the current game page (section 6).

| # | Model | Role in the game | Height | Your current sheet |
| --- | --- | --- | --- | --- |
| 1 | Solenne "Sol" Kestrel | Party sword DPS; replaces the Rowan placeholder | 1.78 m | Red hair, sun tabard |
| 2 | Old Snuff, the Lamplighter | Tier 2 boss, level 10, the Long Boardwalk | 3.0 m | Cage-lantern head |
| 3 | Halcyon, the Gloam Knight | Tier 3 boss, level 20, gate of Mother's Hollow | 1.88 m | White braid, feathered helm |
| 4 | The Drowned Mother | Final boss, Mother's Hollow | 1.72 m, floating | Dark hair, window lantern |
| 5 | Mandrake | Common foe on the Lantern Path, levels 2 to 9 | 0.8 m | None yet |

Open question: slot 5 is my pick, because the party needs something to fight between level 1 and level 10. The Gloamwing or Inkblot could take that slot instead.

## Style lock

Every prompt in section 3 already starts with this paragraph, so all five models match each other and the Witch. Change it here first if you change the look, then update the prompts.

```text
Stylized 3D character art like a hand-painted collectible figurine, made as reference for a 3D modeler. Clean readable shapes, strong silhouette, soft painterly textures with crisp edges. Storybook JRPG fantasy: not photoreal, not pixel art, not flat anime cel shading. Adult proportions about 5.5 to 6 heads tall with a slightly large head and eyes, not chibi. Night-world palette: deep blue shadows, warm lamplight, glowing accents. Even flat studio lighting, no cast shadows, plain light grey background (#D9D9D9), no scenery. Same scale, same design and same colors in every view.
```

Three habits that keep the sheets usable:

- **Fix the proportions.** Your four current sheets are chibi, about 2.5 heads tall, and the Witch is about 5.5. Attach the old sheet and add: "Keep every costume detail from the attached sheet but use the proportions above."
- **Pick the most consistent result.** Generate each sheet 2 to 4 times and keep the one where the views agree. If one view drifts, regenerate rather than accepting it, because the 3D model can only follow one design.
- **Save at full size with clear names**, like `sol-model.png` and `sol-actions.png`.

## Image prompts

Two prompts per model, each ready to paste. The model sheet fixes shapes, faces, props and materials; the action sheet gives the key poses the animations are built from.

### 1. Sol

Model sheet:

```text
Stylized 3D character art like a hand-painted collectible figurine, made as reference for a 3D modeler. Clean readable shapes, strong silhouette, soft painterly textures with crisp edges. Storybook JRPG fantasy: not photoreal, not pixel art, not flat anime cel shading. Adult proportions about 5.5 to 6 heads tall with a slightly large head and eyes, not chibi. Night-world palette: deep blue shadows, warm lamplight, glowing accents. Even flat studio lighting, no cast shadows, plain light grey background (#D9D9D9), no scenery. Same scale, same design and same colors in every view.

Character model sheet of Solenne "Sol" Kestrel, the last Ember Warden: a tall, broad-shouldered 24-year-old swordswoman, 1.78 m. Sun-browned freckled skin, amber eyes, a confident half-smile, short tousled copper-red hair with one long braid down her back wrapped in gold cord, small gold hoop earrings, a curling burn scar up her right forearm. Brushed bronze half-plate breastplate over a burnt-orange tabard with a gold sun crest that hangs to the knees, cream linen sleeves, one large left pauldron crested with layered bronze kestrel feathers and a sun boss, bronze gauntlets, bronze knee guards and greaves over dark brown leather boots, brown leather belts. Short midnight-blue cape lined and edged in gold with a gold sun on the back. Single-edged sunsteel longsword: 0.9 m blade with an amber-glowing edge, a sun-shaped crossguard holding a glowing sunstone, leather grip, round sun pommel; sheathed at her left hip in the four views.

Top row: four full-body views side by side, front, left side, back and three-quarter front, in a relaxed A-pose with arms 30 degrees from the body and feet shoulder-width apart. Orthographic with no perspective, all four the same height on one ground line, with a thin height ruler in meters at the left. Bottom row: her face from the front and in profile showing the braid and earring, the left pauldron alone, the sword front-on and edge-on, the cape laid flat from front and back, her right forearm with the scar, and a gauntleted hand open and gripping. Small labels only.
```

Action sheet:

```text
Stylized 3D character art like a hand-painted collectible figurine, storybook JRPG fantasy, adult proportions about 5.5 to 6 heads tall, not chibi. Even flat studio lighting, no cast shadows, plain light grey background (#D9D9D9), no scenery.

Action pose sheet of Sol, the copper-haired swordswoman in bronze half-plate, a burnt-orange sun tabard and a short midnight-blue cape, holding her amber-edged sunsteel longsword. Ten full-body poses in a 5 x 2 grid, same design and scale in every pose, a short label under each: 1 ready stance, sword in both hands; 2 last hit of a three-hit combo, a diagonal slash; 3 Flare Cut, a big rising slash trailing amber fire; 4 Sunder, an overhead chop throwing sparks; 5 Ember Rush, a dashing lunge with afterimages; 6 Solar Crest, leaping with the sword raised into a sun burst; 7 Guard, braced with the sword across her body, shielding someone behind her; 8 hurt, staggering back; 9 kneeling with the blade planted; 10 Dawnbreaker trance, hair lifted, blade white-hot, a sun halo behind her.
```

### 2. Old Snuff, the Lamplighter

Model sheet:

```text
Stylized 3D character art like a hand-painted collectible figurine, made as reference for a 3D modeler. Clean readable shapes, strong silhouette, soft painterly textures with crisp edges. Storybook JRPG fantasy: not photoreal, not pixel art, not flat anime cel shading. Night-world palette: deep blue shadows, warm lamplight, glowing accents. Even flat studio lighting, no cast shadows, plain light grey background (#D9D9D9), no scenery. Same scale, same design and same colors in every view.

Character model sheet of Old Snuff, the Lamplighter, a stooped figure three meters tall. Long brass stilt legs jointed like a heron's, with backward-bending knees and clawed brass feet with three pointed toes. Instead of a head, an iron-and-brass cage lantern with a ring on top, holding a fat violet flame that is his only face. A long, waxy, tallow-cream coat with melted drips and holes, over a ragged soot-black robe; a dark scarf at the neck, leather cross-straps, a belt with a brass gear buckle, and soot-black gloves with long fingers. Three small caged brass lanterns hang from his belt on chains, each holding a different stolen light: violet, pale blue and warm gold. He carries a 2.4 m brass candle-snuffer pole with a bell-shaped cap and a leather grip. Palette: tallow cream, tarnished brass, soot black, violet flame.

Top row: four full-body views side by side, front, left side, back and three-quarter front, standing upright with arms 30 degrees from the body and the pole beside him. Orthographic with no perspective, all four the same height on one ground line, with a thin height ruler in meters at the left. Bottom row: the lantern head front and side with the flame inside, one belt lantern front and side, the whole snuffer pole with a close-up of its bell cap, a stilt leg in side view showing the backward knee, an open glove, and a swatch of the dripping wax. Small labels only.
```

Action sheet:

```text
Stylized 3D character art like a hand-painted collectible figurine, storybook JRPG fantasy. Even flat studio lighting, no cast shadows, plain light grey background (#D9D9D9), no scenery.

Action pose sheet of Old Snuff, the three-meter Lamplighter with a violet-flame cage-lantern head, a dripping tallow coat, brass heron-like stilt legs and a brass candle-snuffer pole. Eight full-body poses in a 4 x 2 grid, same design and scale in every pose, a short label under each: 1 idle, stooped, leaning on the pole like a staff; 2 Snuffer Strike, swinging the pole like a club; 3 Borrowed Flame, his head flaring as he sprays violet fire; 4 Snuff Out, lowering the bell cap over a small glowing flame; 5 Pilfer, one long arm reaching to grab a wisp of light; 6 Wick Drink, lifting a belt lantern to his cage head and drinking its light; 7 Lights Out, arms spread wide as every lantern gutters dark in violet smoke; 8 defeated, lanterns cracked and stolen lights streaming out as he sinks on folding stilts.
```

### 3. Halcyon, the Gloam Knight

Model sheet:

```text
Stylized 3D character art like a hand-painted collectible figurine, made as reference for a 3D modeler. Clean readable shapes, strong silhouette, soft painterly textures with crisp edges. Storybook JRPG fantasy: not photoreal, not pixel art, not flat anime cel shading. Adult proportions about 5.5 to 6 heads tall with a slightly large head and eyes, not chibi. Night-world palette: deep blue shadows, warm lamplight, glowing accents. Even flat studio lighting, no cast shadows, plain light grey background (#D9D9D9), no scenery. Same scale, same design and same colors in every view.

Character model sheet of Halcyon, the Gloam Knight: a tall, stern woman in her forties, 1.88 m, taller and heavier-built than a young knight. Weathered pale skin with old scars across one cheek, a heavy frown, a long white warrior's braid, right eye grey and left eye glowing pale gold. Blackened bronze plate armor with dull gold edging; the sun crest on the breastplate is scratched out by four deep gouges. Layered pauldrons and elbow guards, chainmail at the joints, dark leather belts, and a tattered teal-and-black tabard and skirt cut into ragged feather-like strips. An open-faced, pointed blackened helm with a gold sun boss on each side and a tall crest of grey and kingfisher-teal feathers. She wields a black glassy greatsword: a 1.3 m blade with a thin, glowing, cold-violet edge, a blackened sun-wheel crossguard and a long grip. Palette: blackened bronze, kingfisher teal, cold violet, one gold eye.

Top row: four full-body views side by side, front, left side, back and three-quarter front, in a relaxed A-pose with arms 30 degrees from the body and feet shoulder-width apart, the greatsword shown separately. Orthographic with no perspective, all four the same height on one ground line, with a thin height ruler in meters at the left. Bottom row: her face without the helm from the front and in profile showing the braid, scars and gold eye, the helm front and side, the greatsword full length and edge-on, the breastplate with the scratched-out crest, and the tabard laid flat. Small labels only.
```

Action sheet:

```text
Stylized 3D character art like a hand-painted collectible figurine, storybook JRPG fantasy, adult proportions about 5.5 to 6 heads tall, not chibi. Even flat studio lighting, no cast shadows, plain light grey background (#D9D9D9), no scenery.

Action pose sheet of Halcyon, the Gloam Knight, in blackened bronze plate with a feathered helm, a tattered teal tabard and a long white braid, wielding a black glassy greatsword with a violet edge. Eight full-body poses in a 4 x 2 grid, same design and scale in every pose, a short label under each: 1 Warden's high guard, greatsword raised beside her head; 2 Gloam Cleave, a huge two-handed overhead chop; 3 Dusk Arc, a wide horizontal sweep trailing violet light; 4 Severance, a long lunging thrust; 5 Light-Drinker, the blade pulling streams of light into its edge; 6 Warden's Vow, a counter stance with the blade low and the gold eye blazing; 7 Black Noon, blade raised high as light bends into a dark sun around it; 8 defeated, kneeling, a thin line of sunlight shining through a crack in the black blade.
```

### 4. The Drowned Mother

Model sheet:

```text
Stylized 3D character art like a hand-painted collectible figurine, made as reference for a 3D modeler. Clean readable shapes, strong silhouette, soft painterly textures with crisp edges. Storybook JRPG fantasy: not photoreal, not pixel art, not flat anime cel shading. Adult proportions about 5.5 to 6 heads tall with a slightly large head and eyes, not chibi. Night-world palette: deep blue shadows, warm lamplight, glowing accents. Even flat studio lighting, no cast shadows, plain light grey background (#D9D9D9), no scenery. Same scale, same design and same colors in every view.

Character model sheet of the Drowned Mother, a witch who drowned with her house a hundred years ago: a gaunt, sorrowful woman, 1.72 m, floating a hand's width above the ground, barefoot. Pale grey-blue skin with a faint wet sheen, heavy-lidded grey eyes with dark circles, very long wavy black hair streaked with silver that hangs to her knees and drifts as if underwater. A tarnished silver head chain with a crescent-moon charm and teardrop drops over her brow, and a crescent-moon pendant on a chain at her chest. A mossy green outer robe with huge bell sleeves and ragged, rotted edges, over a long dusky-plum dress of torn layers that trails behind her; tarnished chains with teardrop weights hang from her waist and sleeves, and water drips from every hem. She holds a small house-window lantern on a chain: a dark wooden frame with iron corners and two warm, glowing golden glass panes. Palette: drowned green, plum, tarnished silver, warm window gold, black water.

Top row: four full-body views side by side, front, left side, back and three-quarter front, arms 30 degrees from the body, the lantern hanging from her left hand. Orthographic with no perspective, all four the same height on one ground line, with a thin height ruler in meters at the left. Bottom row: her face from the front and in profile, the head chain from behind, the window lantern front and side, the pendant, and one sleeve and the dress layers laid flat. Small labels only.
```

Action sheet:

```text
Stylized 3D character art like a hand-painted collectible figurine, storybook JRPG fantasy, adult proportions about 5.5 to 6 heads tall, not chibi. Even flat studio lighting, no cast shadows, plain light grey background (#D9D9D9), no scenery.

Action pose sheet of the Drowned Mother, a floating, sorrowful witch with knee-length silver-streaked black hair, a ragged mossy-green robe over a torn plum dress, dripping chains, and a glowing house-window lantern. Eight full-body poses in a 4 x 2 grid, same design and scale in every pose, a short label under each: 1 idle, floating, the lantern held to her chest; 2 raising the lantern as its windows blaze and pull in light; 3 Black Tide, an arm sweeping as black water rises in a wave; 4 Hair Lash, her long hair striking out like tendrils; 5 cradling a captured light against her chest to heal; 6 summoning a drowned counterfeit moth goddess that rises behind her; 7 holding a black sun overhead with both hands; 8 letting go, kneeling and opening the lantern as small lights rise from it like moths.
```

### 5. Mandrake

Model sheet:

```text
Stylized 3D character art like a hand-painted collectible figurine, made as reference for a 3D modeler. Clean readable shapes, strong silhouette, soft painterly textures with crisp edges. Storybook JRPG fantasy: not photoreal, not pixel art, not flat anime cel shading. Night-world palette: deep blue shadows, warm lamplight, glowing accents. Even flat studio lighting, no cast shadows, plain light grey background (#D9D9D9), no scenery. Same scale, same design and same colors in every view.

Character model sheet of a Lantern Path mandrake, a common marsh monster about 0.8 m tall. A knobbly brown tuber body, two stubby root legs, long whip-like root arms, and a crown of broad leafy greens with one small violet bell-flower on its head. Its face is carved into the root: two glowing amber eye-holes and a wide mouth with splintery teeth. Moss patches, hair-thin rootlets, clinging soil, and three small glowing glowcap mushrooms growing on its back. Palette: earthy brown, moss green, amber glow, violet flower.

Top row: four full-body views side by side, front, left side, back and three-quarter front, standing with arms out from the body. Orthographic with no perspective, all four the same height on one ground line, with a thin height ruler in meters at the left. Bottom row: its face front and side with the mouth closed and then screaming, the leaf crown from above, a root hand, and the glowcap mushrooms close up. Small labels only.
```

Action sheet:

```text
Stylized 3D character art like a hand-painted collectible figurine, storybook JRPG fantasy. Even flat studio lighting, no cast shadows, plain light grey background (#D9D9D9), no scenery.

Action pose sheet of a Lantern Path mandrake, a 0.8 m knobbly root monster with a leafy crown, glowing amber eye-holes, whip-like root arms and glowcap mushrooms on its back. Eight full-body poses in a 4 x 2 grid, same design and scale in every pose, a short label under each: 1 idle, bobbing; 2 bursting up out of the soil; 3 Root Lash, an arm whipping forward; 4 Scream, mouth wide with shock rings; 5 Spore Puff, the glowcaps puffing amber spores; 6 hopping run; 7 hurt; 8 dying, shriveling back into the ground.
```

## Shared build spec

Copy the block below into a project knowledge file named `Model Build Spec.md`. Every build prompt points to it, so each chat gets the full contract once instead of five slightly different versions. It matches how the Witch, the Shadow Wraith, Lunara and Rowan were built, so the models drop into the existing battle code.

```markdown
# Model Build Spec: Moonlight in the Aether

Goal: one code-built three.js model per conversation that drops into the existing battle game without changes to the model.

## Ground rules
- three.js r128 (global THREE). Everything is built in code: no model files and no image files; textures are painted on canvas in code.
- One plain JavaScript file per model, `<id>.js`, defining one function `make<Name>(opts)`. No imports, exports or other globals. It must work when pasted into a page that already loaded three.js r128.
- Units are meters, Y is up, the model faces +Z, and its feet (or lowest point) touch y = 0 at the origin.
- The attached model sheet and action sheet win over your own taste. Lore, personality and moves come from the Lore & Party Bible in project knowledge.

## Quality bar
Between the Witch (99k triangles, 51 bones, cloth and hair physics) and the Shadow Wraith (55k triangles, 32 bones).

| | Minimum | Target | Ceiling |
| --- | --- | --- | --- |
| Triangles | 50k | 70k to 100k | 120k (bosses) |
| Bones | 25 | 30 to 55 | 64 |
| Draw calls | | 40 or fewer | 60 |
| Canvas textures | | 6 to 15 | 24 MB total |
| Code size | | 60 to 110 KB | 140 KB |

- Skeleton: a THREE.Bone hierarchy with SkinnedMesh for bodies, cloth and hair. Rigid armor plates and props may be parented to bones instead of skinned; merge their geometry per material per bone.
- Secondary motion: spring-damper physics on 1/120 s substeps for hair, braids, capes, coats, skirts, sleeves, feathers, chains and hanging props. Stiffness 30 to 60, damping 3 to 6. Everything lags behind body motion and the dash.
- Faces, where visible: a painted iris texture, blinking lids, brows, and mouth shapes for neutral, open (attack, hurt) and closed (KO).
- Materials: MeshStandardMaterial (roughness 0.3 to 0.9; metalness only on metal). MeshBasicMaterial with additive blending for glows. DoubleSide only on thin cloth. Canvas-painted normal maps for fabric, leather and metal grain are welcome.
- Check the look under the game's lighting: a hemisphere light (sky #756aa8, ground #33262f, intensity 1.1), a moon directional light (#b8c0ff, 0.62) from behind-left and above, a warm fill (#ffdcc0, 0.42) from the front, and two warm point lamps (#ffb46a). It is a dark night scene: aim for readable mid-tones, never black armor or blown-out white.
- No shadows; the game uses blob shadows. Never change the number of lights at runtime: a model's own lights live in `fx` and stay in the scene at intensity 0 when off.
- Precompute everything. Nothing is rebuilt per frame except small ribbons and particle buffers.

## Interface (exactly this)
~~~js
const m = makeSol({ detail: 1 }); // detail 0.5 to 1 scales segment counts for slower phones
m.root           // THREE.Group. The game sets position.x/z and rotation.y; never move it yourself
m.fx             // THREE.Group of world-space extras (trails, lights, particles); may be empty
m.animate(phase, walk, t, dt) // every frame. phase = meters walked x ~4.4 (radians), walk = 0 to 1 walk/run blend, t and dt in seconds (dt is 0 during hit-stop)
m.play(name, force) // starts an action; returns false if busy unless force is true or the action is an interrupt
m.guard(on)      // blends a guard stance in or out
m.reset()        // drops any action or hold, back to idle
m.busy           // true while a non-hold action runs
m.action         // current action name, or ''
m.progress       // 0 to 1 through the current action, -1 if none
m.dash           // forward speed in m/s the current action wants; the game moves root along its facing
m.lift           // meters the body is off the ground (shrinks the blob shadow)
m.state          // plain object the game writes for looks, e.g. { heat: 0.8, trance: 1 }
m.setFade(f)     // 0 to 1 for appear and die (party members may ignore it)
m.anchor(name, out) // world position of a named point; required: 'chest', 'head', 'hit'
m.ACTIONS        // { name: { dur, hits: [u, ...], hold, interrupt } }, read-only
~~~

- `hits` are the normalized times (0 to 1) when each hit lands. The game waits for them to show damage, so they must match the motion.
- Every model needs `hurt` (interrupt, about 0.6 s, a small knockback through negative dash) and `block` (interrupt, 0.45 s), plus its own list from the build prompt.
- Party members also need `kneel` (hold, for KO), `rise` and `victory` (hold). Enemies also need `appear` and `die` (hold; fades itself out).
- Idle breathing and the walk or run cycle come from `animate`. Actions blend in and out over 0.1 to 0.2 s with no pops.

## Effects
- The model owns effects attached to its body: weapon trails (an additive ribbon of the last 14 tip positions), weapon and eye glows, flames, drips, smoke and spores.
- The game owns big spell effects: beams, rings, sigils, projectiles and screen flashes. For those, expose anchors and hit times instead of drawing them.

## Process (keep the conversation lean)
1. Study the sheets and the bible, then write a short plan: height, bone list, physics chains, materials, and the action list with durations and hit times.
2. Write the model as 3 to 6 files of at most about 250 lines each (textures and materials, geometry, skeleton and skinning, physics, actions, interface), concatenated into `<id>.js`. Never paste code into chat.
3. Test headless: install three@0.128.0 from npm and render with Chromium and SwiftShader through Playwright. Render the four turnaround views next to the model sheet and each action at its key frame next to the action sheet; fix every mismatch you can see. Confirm no errors, the triangle and bone counts, and no pops between actions.
4. Publish a preview page as an artifact: the model under the game's lighting, a slow turntable, a button per action, a walk toggle, and a readout of triangles, bones and draw calls. Load three.js from https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js.
5. Hand over: present `<id>.js` as a downloadable file and post the integration card below.

## Integration card (post at the end, filled in)
~~~text
Model: <name>   File: <id>.js   Function: make<Name>(opts)
Height: <m>   Triangles: <n>   Bones: <n>   Draw calls: <n>   Textures: <n> (<MB>)
Anchors: chest, head, hit, <others>
State fields: <field: range and what it changes>
Actions: <name> <dur s> hits [<u, ...>] <hold or interrupt>, ...
Walk: <gait, and the speed in m/s that looks right>
Notes: <anything the battle code must know>
~~~
```

## Build prompts

Open a new chat in this project for each model, attach its two sheets, and paste its prompt. Each prompt only adds what is specific to that model; the contract lives in the spec file and the story in the bible.

### 1. Sol

```text
Build Solenne "Sol" Kestrel for Moonlight in the Aether. Follow Model Build Spec in project knowledge exactly. Her lore and moves are in the Lore & Party Bible ("Solenne 'Sol' Kestrel"). Attached: sol-model.png and sol-actions.png.

File sol.js, function makeSol(opts). Height 1.78 m. Target 85k to 100k triangles, about 50 bones.

Must read at battle distance: copper hair and the gold-corded braid, the big feathered left pauldron, the burnt-orange sun tabard, the short midnight-blue cape with its gold sun, and the amber-edged sword.

Rig: pelvis, spine, chest, neck, head; shoulders, arms, wrists and three-segment fingers; legs to toes; braid 6 bones; cape 5 columns x 2 rows; tabard front and back 2 bones each; hair tufts 4.
Physics: braid, cape, tabard panels, hair tufts, and a slight give in the pauldron feathers.
Face: freckles, amber painted irises, blink, a half-smile, gritted teeth on attacks. Burn scar on the right forearm.
Sword in the right hand: single-edged, 0.9 m blade, sunstone set in a sun-shaped crossguard.
Anchors: chest, head, hit (blade tip), blade (mid-blade), sunstone.
State: heat 0 to 1 (edge glows amber, white-hot above 0.7 with a soft heat-shimmer sprite), sunburn 0 or 1 (faint orange aura), trance 0 to 1 (Dawnbreaker: hair lifts, a sun halo behind her, blade white).

Actions, with duration in seconds and hit times:
- combo 1.5, hits 0.22 0.45 0.72 (dash on the last hit)
- flareCut 1.7, hit 0.55 (rising slash with a fire arc)
- sunder 1.6, hit 0.58 (overhead chop)
- emberRush 2.0, hits 0.30 0.42 0.54 0.66 (dash flurry)
- solarCrest 2.1, hit 0.62 (leap up to 1.4 m of lift, then slam)
- guardStep 0.5, interrupt (steps in front of an ally); guard(on) is her Guard stance
- daybreak 1.9, hits 0.18 0.32 0.46 0.60 0.80 (Trance attack)
- highNoon 3.2, hits 0.12 0.22 0.32 0.42 0.52 0.62, then 0.85 for the sunlight pillar
- transform 2.6 (Dawnbreaker begins), kestrel 1.6 (story call-out pose, no hit)
- hurt, block, kneel, rise and victory per the spec
Walk: a confident stride at about 2.2 m/s, breaking into a run for dashes.
```

### 2. Old Snuff, the Lamplighter

```text
Build Old Snuff, the Lamplighter, the tier 2 boss of Moonlight in the Aether. Follow Model Build Spec in project knowledge exactly. His lore and moves are in the Lore & Party Bible ("Tier 2: Old Snuff, the Lamplighter"). Attached: snuff-model.png and snuff-actions.png.

File snuff.js, function makeSnuff(opts). Height 3.0 m, most of it stilt legs. Target 80k to 100k triangles, about 45 bones.

Must read at battle distance: the stooped tall silhouette, the cage-lantern head with its violet flame, the dripping cream coat, the brass heron legs, the long snuffer pole, and three glowing belt lanterns.

Rig: pelvis, spine 3, a long forward neck 2, head cage; long arms with three-segment fingers; heron legs with thigh, backward knee, long shin, ankle and three toes each; coat 8 columns x 2 rows; scarf 2; three belt-lantern chains of 2 bones each; pole in the right hand.
Physics: coat panels, scarf ends, the three belt lanterns as pendulums, and wax drips that now and then stretch and fall.
Head: an iron-and-brass cage with glass panes holding a violet flame made of animated flipbook sprites plus a glow sprite, and a violet point light in fx that follows the flame. Two soot smudges on the glass suggest eyes.
Anchors: chest, head (the flame), hit (pole cap), lantern0, lantern1, lantern2.
State: flame 0 to 2 (size and brightness; 2 when he swells after absorbing Flame Bolt), lanterns [1, 1, 1] (1 lit, 0 dark, -1 shattered with broken glass and no glow), gutter 0 to 1 (every lantern flickers toward dark before Lights Out).

Actions, with duration in seconds and hit times:
- snufferStrike 1.6, hit 0.55 (pole swung like a club)
- borrowedFlame 2.0, release 0.5 (head flares; the game sprays fire from the head anchor)
- snuffOut 1.8, hit 0.6 (bell cap lowered onto the target)
- pilfer 1.6, hit 0.5 (long reach and grab; dash forward, then back)
- wickDrink 2.2, drinks from 0.45 to 0.8 (lifts a belt lantern to the cage; the game picks which through state)
- lightsOut 3.0, gutter from 0.1, hit 0.7 (arms spread in violet smoke)
- laugh 1.4 (flame swells and his shoulders shake when Flame Bolt heals him)
- appear 2.0; die 3.5 (lanterns crack, lights stream out, he sinks on folding stilts); hurt and block per the spec
Walk: a slow, high-stepping stilt gait at about 1.2 m/s with the body swaying.
```

### 3. Halcyon, the Gloam Knight

```text
Build Halcyon, the Gloam Knight, the tier 3 boss of Moonlight in the Aether. Follow Model Build Spec in project knowledge exactly. Her lore and moves are in the Lore & Party Bible ("Tier 3: Halcyon, the Gloam Knight"). Attached: halcyon-model.png and halcyon-actions.png.

File halcyon.js, function makeHalcyon(opts). Height 1.88 m, 2.1 m with the feather crest. Target 95k to 115k triangles, about 50 bones.

Must read at battle distance: blackened plate with the scratched-out sun crest, the teal feather-strip tabard, the grey-and-teal feathered helm, the long white braid, one glowing gold eye, and a black greatsword with a thin violet edge.

Rig: the same layout as Sol's, because she taught Sol and their stances should rhyme, plus braid 6 bones, tabard strips 10 columns x 2 rows, a feather crest of 6 springs, and both hands on the greatsword.
Physics: braid, tabard strips, feather crest.
Face: open-faced helm, weathered skin, cheek scars, heavy brows, a grey right eye and a glowing gold left eye (emissive iris plus a small glow sprite).
Greatsword: a 1.3 m black glassy blade, dark and glossy with a faint purple depth, a thin emissive violet edge, and a blackened sun-wheel crossguard.
Anchors: chest, head, hit (blade tip), blade (mid-blade), eye.
State: drink 0 to 1 (light streams pull toward the edge, which brightens), charge 0 to 1 (Black Noon wind-up: the edge darkens and a dark-sun glow grows at the blade), crack 0 to 1 (defeat: a thin line of sunlight along the blade).

Actions, with duration in seconds and hit times:
- gloamCleave 1.8, hit 0.6 (two-handed overhead chop)
- duskArc 1.8, hit 0.55 (wide horizontal sweep that reaches both party members)
- severance 1.6, hit 0.5 (lunging thrust with a forward dash)
- lightDrinker 2.2, hit 0.4, drains from 0.4 to 0.75
- vowStance 0.8 into a hold (Warden's Vow); counter 0.9, hit 0.45
- blackNoonCharge 1.2 into a hold (blade raised until the next action); blackNoon 2.6, hit 0.62
- stagger 1.2 (she loses her turn when Sol calls her Kestrel)
- appear 2.0 (walks out of the dark); die 3.0 (kneels as the crack glows, and holds for the game to sink her); hurt and block per the spec
Walk: a measured armored stride at about 1.8 m/s.
```

### 4. The Drowned Mother

```text
Build the Drowned Mother, the final boss of Moonlight in the Aether. Follow Model Build Spec in project knowledge exactly. Her story is in the Lore & Party Bible ("The central mystery" and "Behind them: the Drowned Mother"). Her fight isn't statted yet, so the actions below are a starting set. Attached: mother-model.png and mother-actions.png.

File mother.js, function makeMother(opts). Height 1.72 m, floating 0.15 m off the ground, bare feet with toes pointed down. Target 100k to 120k triangles, about 60 bones.

Must read at battle distance: the drifting knee-length silver-streaked hair, the huge ragged green sleeves over the torn plum dress, the dripping chains, and the warm window-lantern glowing against her cold palette.

Rig: a body like the Witch's; hair in 4 masses of 4 to 6 bones each plus loose strands; sleeves 2 x 3; outer robe 8 columns x 2 rows; dress 10 columns x 3 rows trailing behind; head chain and pendant; the lantern on a 2-bone chain from her left hand.
Physics: an underwater drift on hair and cloth (slow, heavily damped, with a constant gentle current), chains and teardrop charms as pendulums, the swinging lantern, and water drips falling from her hems into small ripples (in fx).
Face: gaunt, heavy-lidded grey eyes with dark circles, a slow blink, a trembling mouth, and a wet sheen on the skin.
Anchors: chest, head, hit (right hand), lantern, windows (the lantern panes), sun (above her raised hands).
State: windows 0 to 2 (lantern glow; 2 while stealing light), tide 0 to 1 (drip rate and wetness), grief 0 to 1 (her pose sags and the hair drifts upward more).

Actions, with duration in seconds and hit times:
- stealLight 2.0, from 0.3 to 0.8 (lantern raised; the game streams lights into the windows anchor)
- blackTide 2.2, hit 0.6 (arm sweep; the game draws the wave)
- hairLash 1.6, hits 0.45 0.60
- cradle 2.0 (heals herself, holding a light to her chest)
- summonCounterfeit 3.0 (arms raised; the game raises a drowned recolor of Lunara behind her)
- eclipse 3.0, hit 0.7 (a black sun held overhead at the sun anchor)
- letGo 4.0, hold (kneels and opens the lantern as lights rise)
- appear 2.5 (rises out of black water); hurt and block per the spec
Movement: she glides rather than walks, at about 1.0 m/s; the walk blend leans her forward and streams her hair back.
```

### 5. Mandrake

```text
Build a Lantern Path mandrake, a common enemy in Moonlight in the Aether. Follow Model Build Spec in project knowledge exactly. It lives on the Lantern Path in the Lore & Party Bible ("The Gloomfen"). Attached: mandrake-model.png and mandrake-actions.png.

File mandrake.js, function makeMandrake(opts). Height 0.8 m including the leaves. Target 50k to 65k triangles, about 30 bones. It appears in groups of 1 to 3, so keep draw calls under 25 and support opts.tint from 0 to 1 to shift the leaf and glow colors for variants.

Must read at battle distance: the leafy crown, glowing amber eye-holes and a screaming mouth, long whip arms, and three glowcaps on its back.

Rig: root body 3 bones, two stubby legs of 2 bones each, arms as 5-bone chains for the whip, a jaw, a leaf crown of 6 springs, and a 2-bone flower.
Physics: leaves and flower, the arms' whip follow-through, and small rootlets.
Surface: a knobbly, bark-like tuber (canvas normal map), moss patches and soil on the feet; eye-holes and glowcap caps glow amber.
Anchors: chest, head, hit (right arm tip), mouth, spores (the glowcap cluster).
State: glow 0 to 1 (eyes and glowcaps), scream 0 to 1 (jaw open, crown flared).

Actions, with duration in seconds and hit times:
- appear 1.5 (bursts up out of the soil from below y = 0)
- rootLash 1.2, hit 0.5
- scream 1.6, hit 0.45 (the game draws shock rings at the mouth anchor)
- sporePuff 1.5, release 0.5
- die 1.8 (shrivels and sinks into the ground); hurt and block per the spec
Walk: a bouncy hop at about 1.6 m/s; it bobs on the spot when idle.
```

## Bringing the models back

One integration chat wires all five models in using the bible's battle numbers. Give it everything at once so it never has to ask.

- [ ] Save each model's `.js` file, and paste its integration card into a text file named like `sol-card.txt`.
- [ ] Download the current game page from the Moonwell artifact. It holds the Witch, the wraith, Lunara, the battle code and the rules module.
- [ ] Open one new chat in this project, attach the game page with every model file and card, and paste the prompt below.

```text
Integrate these five models into the attached game page for Moonlight in the Aether. The battle design is in the Lore & Party Bible ("Numbers for the battle code" and the enemy ladder), and the model interface is in Model Build Spec. Each model's card lists its actions, hit times, anchors and state fields.

1. Replace the Rowan placeholder with Sol: her stats, Heat and Sunburn, Sword Arts, Guard and Warden's Oath, and her Dawnbreaker Trance.
2. Rebuild the Witch's kit as Moonlore and Witchcraft per the bible, and add Pale Mother's Embrace to the Lunara summon.
3. Add the Lantern Path with groups of mandrakes for levels 2 to 9, Old Snuff on the Long Boardwalk at level 10, Halcyon at the gate of Mother's Hollow at level 20, and the Drowned Mother as a locked final stage.
4. Keep every number in the RULES module and rebuild the balance simulator. Tune each tier so a player who heals well wins about 90% of the time and one who never heals loses.
5. Test each new fight headless, then publish the game.
Work in small files, test as you go, and don't paste code into chat.
```

If you'd rather integrate one model at a time, go Sol first since she changes every fight, then the mandrake, Old Snuff and Halcyon, and the Drowned Mother last because her fight still needs designing. After each model lands, play a fight on your phone; if three characters on screen stutter, ask for that model at `detail: 0.7`.

Open question: the new stages need backdrop paintings like the Night square; until they exist, those fights can reuse the square.
