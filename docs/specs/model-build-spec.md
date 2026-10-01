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
