# Model Review: October 1, 2026 Baseline

Every code-built model rendered side by side at true scale under the game's lighting (Model Build Spec), with face close-ups. The renders are in `../reference/renders/2026-10-01-baseline/`, made with `../tools/lineup/`.

## Budgets

The spec's targets: 70k to 100k triangles (minimum 50k, ceiling 120k for bosses), 30 to 55 bones, 40 or fewer draw calls (ceiling 60).

| Model | Source | Triangles | Bones | Draw calls | Spec interface |
|---|---|---|---|---|---|
| The Witch | `night-square-shadow-wraith.html` | 99k | 51 | 84 | No (older interface) |
| Io (the Witch), technical pass | `src/models/witch.js` | 99k | 51 | 48 counted, 39 drawn at idle | Yes, with the old interface kept |
| Sol | `sol-in-the-night-square.html` | 83k | 54 | 38 | Yes |
| Sol, touched up | `src/models/sol.js` | 98k | 54 | 26 (16 body + 10 effects) | Yes |
| Halcyon (v2) | `halcyon-in-the-night-square.html` | 88k | 63 | 31 | Yes |
| Noctara, touched up | `src/models/noctara.js` | 72k | 30 joints, hands skinned | 24 | Yes |
| Noctara, original | `noctara-in-the-night-square.html` | 28k | none (rigid joints) | 88 | Mostly (no `setFade`; `block` is 0.6 s) |
| Shadow Wraith | `night-square-shadow-wraith.html` | 55k | 32 | 35 | No (older interface) |
| Shadow Wraith, touched up | `src/models/wraith.js` | 59k (great wraith 71k) | 54 | 11 + up to 7 effects (great 20 + 8) | Yes |
| Lunara | `night-square-shadow-wraith.html` | 56k | none | 60 | No (its own interface) |
| Lunara, touched up | `src/models/lunara.js` | 97k | 62 | 14 (+ up to 21 for effects) | Yes |
| Envoi | `envoi-letter-wyrm-model-preview.html` | 83k (instanced) | 20 | 27 | Mostly (no skinning; `block` 0.6 s; `busy` is false during holds) |
| Envoi, touched up | `src/models/envoi.js` | 64k (bench count) | 23 | 9 + 12 effects | Yes |
| Wisp, new | `src/models/wisp.js` | 16k | none (all in shaders) | 9 | Yes |

Draw calls here were counted in the line-up scene and include glow sprites and particles. The Noctara page bundles the older Halcyon (v1); the rebuilt v2 is in the Halcyon page.

## Touch-up targets

### Io, the Witch: technical pass done October 2, 2026

She looks and moves exactly as before.

- **Proof it's unchanged:** before and after renders differ only by scattered single pixels at the edges of tiny details, from rounding (59 to 65 dB PSNR).
- **Interface:** she has the spec interface (`ACTIONS` with hit and cue times, `anchor`, `state.trance`, `setFade`, `opts.detail`) and a new `rise`. Her old interface still works.
- **Draw calls:** every material is drawn once, skinned to her existing 51 bones, which takes her from 74 meshes drawn per frame to 39.
- **Cost:** animation costs about 0.05 ms per frame, down from 0.06.
- **Her page:** it plays all her commands from the Night square demo.
- **Her new spells,** added the same day in `src/fx/io-spells.js`:
  - **Waxing Light** (on her `mend` motion): a crescent waxes to a full moon over the party and heals both.
  - **Moonsteel** (on `cast`): a silver crescent flies to Sol's sword and makes it glow, for +40 Heat.
  - **Moth Veil** (on `cast`): moths settle into a shimmering dome that absorbs the next hit.

  Her look and motions are untouched.

### The Witch: the plan (technical only)

Chris loves how she looks and moves, so nothing visible changes.

- Give her the spec interface: an `ACTIONS` table with hit times, `anchor()`, `state`, `setFade`, and `opts.detail`.
- Cut draw calls from 84 to under 60 by merging meshes that share a material.
- Prove she is unchanged by rendering before and after and comparing the pixels.

### Sol: done October 2, 2026

Brought toward her model sheet A. Every duration and hit time is kept.

- **Face:** a new sculpt with sun-browned freckled skin, amber eyes with lids that blink, a half-smile and gold hoops.
- **Hair:** deeper copper hair and a braid with gold bands.
- **Armor:** worn brushed bronze with gold trim, the gold sun on her breastplate, and the feather pauldron with its glowing sunstone.
- **Clothes:** cream sleeves, belts and pouches, the pointed sun tabard, and the midnight-blue cape with gold edging and the gold sun on its back.
- **Sword and scar:** an amber-glowing sword with the spiky sun guard, and the burn scar above her right vambrace.
- **Poses:** a wider, lower ready stance, and the sheet's Dawnbreaker and High Noon poses.
- **Kestrel Stoop:**
  - `stoopRise` (she springs about 3 m and hovers, cape spread like wings);
  - `stoop` (she dives on the target for one 1,500 hit at level 1).
- **Cost:** 98k triangles, 26 draw calls (from 38), about 0.17 ms per frame.
- **Still to improve:** wispier hair, a rounder face, the cape over her shoulders, and the code compacted (140 KB).

### Sol: the plan

- **Face:** reads flat and doll-like: even pink skin, little shading, and a bulb where the nose meets the brow. Give it a better sculpt, warm sun-browned skin with soft shading, and freckles that read.
- **Armor:** looks like smooth plastic gold. It should read as brushed bronze half-plate with worn edges.
- **Tabard and cape:** the tabard is a plain orange panel. Add the gold sun crest, and the gold sun on the back of the cape.
- Keep what already works: the copper hair and braid, the feathered pauldron, the sword and its glow, and every action and its timing.

### Envoi: done October 2, 2026

Brought toward its model and action sheets and the two Envoi scenes.

- **Body:** 16 faceted ivory paper lanterns that glow gold from inside, with ink columns, red cord knots and red tassels.
- **Head:** a larger folded-paper head with swept horns, a scorched frill, gold eyes, trailing whiskers and the red wax seal (crescent and flame) at twice the size.
- **Heart lantern:** eight-sided, the brightest light on the wyrm.
- **Wings and tail:** bigger fan wings with burning tips, and scorched tail streamers.
- **Pose:** it coils low around the well toward the party, as in scene A.
- **Spec fixes:** `block` is 0.45 s, and `busy` holds through the summon.
- **Bench page:** Io summons, Sol's blade lights the heart, the ward takes the wraith's hit, and the strike rings the wraith in fire. Its numbers grow with Io's level, to about 103,500 at level 20.
- **Still to improve:**
  - The strike's ring wraps only half to two-thirds round the wraith.
  - The ward hit has no dark splash.
  - The tail comes close to Io in idle.
  - The lanterns could be longer bipyramids.

### Envoi: the plan

- **Body:** the 16 segments read as spiky starbursts, not paper lanterns. They should be faceted ivory paper lanterns lit from inside, with ink columns showing through and red tassels at the joints, as in `envoi-summon-scene-a.png`.
- **Head:** small and hard to read from the battle camera. It needs to be bigger, with long swept horns, a folded frill, whisker barbels, gold eyes and a red wax seal that reads.
- **Wings:** the pleated fans are close; push the scorched, glowing tips.
- **Scale and pose:** match its size and its long low coil next to the Witch and the wraith in the two Envoi scenes.
- **Spec fixes:** skin the body to a bone chain, make `block` 0.45 s, and keep `busy` true while a hold action plays, so a stray `play()` can't cut off the summon.

### Noctara: done October 1, 2026

Touched up after sheet b: a sculpted face with eye geometry and blinking lids, sleek parted hair, a sheer veil that drapes over the cape to a gold-edged point with a star, a stiff collar with gold piping and a purple inside, a four-pointed star clasp, a faceted crown, the gold filigree on bodice, skirt, sleeves and cape, skinned hands, and a defeat in which she becomes night with stars in it. Animation cost went from about 1.0 to 1.5 ms per frame on the test machine. The notes below were the plan.

### Noctara: the plan

Chris wants her as close as possible to her stylized concept art. Where her two sheets differ, follow `noctara-model-sheet-b.png`: its gold filigree robe is also the one in the Void Sphere and Blackout scenes.

- **Face:** a flat white mask. The sheets show a mature, regal face with defined cheekbones, violet eyes, dark lips and a cold expression.
- **Veil:** reads as a solid purple panel. It should be a sheer black veil falling from the crown, moving as one shape.
- **Collar:** two flat purple slabs. It should be the sculpted high collar from the sheets, with gold piping and the round black-and-purple clasp.
- **Robes:** add the gold filigree from `noctara-model-sheet-b.png` (if that sheet wins), and a star-filled purple lining that glows in Blackout.
- **Budget:** raise her from 28k triangles to 70k or more, and cut draw calls from 88 to 60 or fewer.
- **Spec:** add `setFade`, and make `block` 0.45 s.

### Lunara: done October 2, 2026

Rebuilt as `makeLunara` with the spec interface and one 62-bone skeleton, which takes her body from 60 draw calls to 14. Her new look:

- **Face:** sculpted, with porcelain skin, closed lidded eyes, a circlet and earrings.
- **Hair:** fuller lavender-silver hair on spring chains, with long locks in front and a mass down her back.
- **Gown and gold:** an ivory gown with painted gold filigree; a choker, collar, chains, cuffs and pendants; sheer periwinkle sleeves.
- **Halo and wings:** the big ornate halo ring, and sage-and-plum luna moth wings that fold and wrap.
- **Glow:** calmer, with no moon disc.

She is 3.1 m tall, measured from the two Envoi scenes. Animation costs about 0.09 ms per frame (the original's was 0.06). Still short of the sheet: heavier skirt chains, and the pointed ears under her hair. The notes below were the plan.

### Lunara: the plan

- **Face and hair:** the face is a blank egg with closed-eye arcs. The pose sheet shows a delicate face with closed eyes, long flowing lavender-silver hair, and a gold crescent crown.
- **Glare:** the whole figure blows out to white, and the moon disc behind her dominates. Bring her into readable mid-tones.
- **Gown and wings:** add the gown's gold detail, and move the wings toward the sheet's luna-moth green with purple edges and eye spots.
- **Scale:** her height next to the Witch and the wraith should match `envoi-summon-scene-a.png`, which makes her smaller than now.
- **Embrace:** the bible's Pale Mother's Embrace needs its own action: her wings close over the party, then open (her sheet, row 3, second pose).
- Give her the spec interface.

### Shadow Wraith and great wraith: done October 2, 2026

Rebuilt against the two soul-green sheets as one 54-bone skinned model.

- **Wraith:** a torn hood framing a black void with slanted green eyes, a ribcage with a heart-shaped soul-light, skeletal hands, a layered torn robe with green edges, and the thorny scythe with its pale-green blade.
- **Release:** the robe collapses, the bones crumble into motes and a pale moth rises.
- **Level look:** levels 1 to 20 deepen the green and add glow, smoke and a little size.
- **Great wraith (`opts.great`):** 2.8 times the size, default level 5, with stolen flames in its ribs, lamplight through its robe, and three lanterns on a neck chain. It also swallows lamplight to heal, breathes stolen fire, and releases the lights and a large moth.
- **Bench page:** the Great wraith toggle reloads the page, carrying its options in session storage, because published pages get no query string.
- **Still to improve:**
  - The great wraith's damage numbers are placeholders.
  - A simpler scythe head than the sheet's.
  - A hem of torn strips rather than the sheet's flame-like tendrils.
  - Neck lanterns that are hard to see from the battle camera.
  - On a phone the great wraith opens in the Square view, because Close and Full cut it off.

### Shadow Wraith: the plan

- It already reads well: a dark hood, glowing green eyes and a ribcage. It stays soul-green (lore answer 18).
- Replace the spotted robe texture with layered, tattered cloth, add skeletal hands, and bring in the ornate crescent scythe from the pose sheet, in green.
- **Release on defeat:** a pale moth rises out of the empty robe (lore answer 21).
- **Level look:** wraiths meet the party at any level, so higher-level ones should look tougher, through a tint or size setting.
- **The great wraith** (the Bogmire boss) reuses this model at about three times the size, with stolen lamplight glowing inside its ribs and robe (lore answer 17).
- Give it the spec interface.

### Halcyon: refined October 2, 2026

Brought closer to her two model sheets and both action sheets. Her `ACTIONS` timing and damage numbers are unchanged.

- **Tabard:** a teal tabard over her breastplate, with the clawed-out gold sun.
- **Skirt and braid:** a skirt of ragged feather strips in charcoal, teal and grey-white; her braid runs down her back to mid-thigh.
- **Helm:** pointed, with gold sun bosses and a fuller crest.
- **Face:** three red scars and a deeper frown.
- **Greatsword:** a sun-wheel guard and a faint blue lattice on the blade.
- **Poses:** the sheets' poses, from the High Guard stance to the kneeling release, where the whole edge of the blade warms to gold.

89k triangles, 21 draw calls, about 0.2 ms per frame.

### Halcyon: recolor and two new endings

The strongest model of the set: the helm, feathers and braid all read. She stays a woman, with her face and body as built (lore answer 1).

- **Cold blue:** both eyes and the blade's edge glow cold blue at all times. Remove the gold eye and the violet blade veins (lore answer 4).
- **Retreat:** a new action for the end of the level 20 fight, stepping back into the dark. It replaces the black-water `sink`.
- **Release:** at the very end she kneels, the blade warms with a thin line of light, and a pale moth rises from her (lore answer 10).
- Fix any "he" left in code comments.

### Wisp: done October 2, 2026

A new model built entirely in shaders, with no textures and no bones.

- **Body:** a teardrop flame with a curled candle tip, flame tongues and a glowing rim.
- **Face:** drawn in the shader, calm, hungry or wailing, and it blinks.
- **The hollow:** torn smoke winding into a black core, which grows wider and darker with its level. It gets about 12% bigger and brighter by level 20.
- **The rest:** tendrils that fling, coil and go limp, a braided smoke tail, and drifting leaf specks.
- **Frost variant:** switches at runtime through `state.frost`, with ice shards instead of leaves.
- **Actions:** Flicker, Cling (a drain), Gutter (a dodge), Wail, Frost Breath, hurt, block, appear, and its release, in which a moth rises from the hollow.
- **Budget:** 16k triangles, 9 draw calls, about 0.04 to 0.28 ms per frame.
- **Still to improve:** it's smoother than the painted sheets, its long Cling tendrils are thin lines at battle distance, and its face shrinks to dots in the phone's Full view.

### Wisp: the plan

The low-level foe (lore answer 16): a soul starting to go hollow, the early form of a wraith, in groups of one to three. A frost-colored variant comes later. It starts from its sheets (`art-requests/01-model-sheets.md`, request 3).

## Source art to match

| Model | Sheets in hand | Missing |
|---|---|---|
| The Witch | Not needed | — |
| Sol | `sol-model.webp`, `sol-model-b.webp`, `sol-actions.webp`, `sol-actions-b.webp` | — |
| Envoi | `envoi-model.webp`, `envoi-model-b.webp`, `envoi-actions.png`, `envoi-actions-b.png`, and the two Envoi scenes | — |
| Noctara | `noctara-model-sheet-a.png`, `noctara-model-sheet-b.png` and four scenes | — |
| Lunara | `lunara-pose-sheet.png` | — |
| Shadow Wraith | `wraith-model.webp`, `wraith-model-b.webp` (soul-green); the old violet `shadow-wraith-pose-sheet.png` | — |
| Great wraith | `great-wraith.webp` (flames), `great-wraith-b.webp` (lanterns), `great-wraith-c.webp` (both) | — |
| Halcyon | `halcyon-model.png`, `halcyon-model-b.png`, `halcyon-actions.png`, `halcyon-actions-b.webp`, and the Blackout scene | — |
| Wisp | `wisp-model.png`, `wisp-model-b.png`, `wisp-actions.png`, `wisp-actions-b.png` | — |

Every sheet from art request 01 arrived on October 2, 2026, including a second Halcyon action sheet. The file list is in `../reference/art/README.md`.
