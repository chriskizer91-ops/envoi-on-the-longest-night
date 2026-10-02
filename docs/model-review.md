# Model Review: October 1, 2026 Baseline

Every code-built model rendered side by side at true scale under the game's lighting (Model Build Spec), with face close-ups. The renders are in `../reference/renders/2026-10-01-baseline/`, made with `../tools/lineup/`.

## Budgets

The spec's targets: 70k to 100k triangles (minimum 50k, ceiling 120k for bosses), 30 to 55 bones, 40 or fewer draw calls (ceiling 60).

| Model | Source | Triangles | Bones | Draw calls | Spec interface |
|---|---|---|---|---|---|
| The Witch | `night-square-shadow-wraith.html` | 99k | 51 | 84 | No (older interface) |
| Sol | `sol-in-the-night-square.html` | 83k | 54 | 38 | Yes |
| Halcyon (v2) | `halcyon-in-the-night-square.html` | 88k | 63 | 31 | Yes |
| Noctara, touched up | `src/models/noctara.js` | 72k | 30 joints, hands skinned | 24 | Yes |
| Noctara, original | `noctara-in-the-night-square.html` | 28k | none (rigid joints) | 88 | Mostly (no `setFade`; `block` is 0.6 s) |
| Shadow Wraith | `night-square-shadow-wraith.html` | 55k | 32 | 35 | No (older interface) |
| Lunara | `night-square-shadow-wraith.html` | 56k | none | 60 | No (its own interface) |
| Envoi | `envoi-letter-wyrm-model-preview.html` | 83k (instanced) | 20 | 27 | Mostly (no skinning; `block` 0.6 s; `busy` is false during holds) |

Draw calls here were counted in the line-up scene and include glow sprites and particles. The Noctara page bundles the older Halcyon (v1); the rebuilt v2 is in the Halcyon page.

## Touch-up targets

### The Witch: technical only

Chris loves how she looks and moves, so nothing visible changes.

- Give her the spec interface: an `ACTIONS` table with hit times, `anchor()`, `state`, `setFade`, and `opts.detail`.
- Cut draw calls from 84 to under 60 by merging meshes that share a material.
- Prove she is unchanged by rendering before and after and comparing the pixels.

### Sol: visible upgrade

- **Face:** reads flat and doll-like: even pink skin, little shading, and a bulb where the nose meets the brow. Give it a better sculpt, warm sun-browned skin with soft shading, and freckles that read.
- **Armor:** looks like smooth plastic gold. It should read as brushed bronze half-plate with worn edges.
- **Tabard and cape:** the tabard is a plain orange panel. Add the gold sun crest, and the gold sun on the back of the cape.
- Keep what already works: the copper hair and braid, the feathered pauldron, the sword and its glow, and every action and its timing.

### Envoi: visible upgrade

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

### Lunara: visible upgrade

- **Face and hair:** the face is a blank egg with closed-eye arcs. The pose sheet shows a delicate face with closed eyes, long flowing lavender-silver hair, and a gold crescent crown.
- **Glare:** the whole figure blows out to white, and the moon disc behind her dominates. Bring her into readable mid-tones.
- **Gown and wings:** add the gown's gold detail, and move the wings toward the sheet's luna-moth green with purple edges and eye spots.
- **Scale:** her height next to the Witch and the wraith should match `envoi-summon-scene-a.png`, which makes her smaller than now.
- **Embrace:** the bible's Pale Mother's Embrace needs its own action: her wings close over the party, then open (her sheet, row 3, second pose).
- Give her the spec interface.

### Shadow Wraith: polish, release, and the great wraith

- It already reads well: a dark hood, glowing green eyes and a ribcage. It stays soul-green (lore answer 18).
- Replace the spotted robe texture with layered, tattered cloth, add skeletal hands, and bring in the ornate crescent scythe from the pose sheet, in green.
- **Release on defeat:** a pale moth rises out of the empty robe (lore answer 21).
- **Level look:** wraiths meet the party at any level, so higher-level ones should look tougher, through a tint or size setting.
- **The great wraith** (the Bogmire boss) reuses this model at about three times the size, with stolen lamplight glowing inside its ribs and robe (lore answer 17).
- Give it the spec interface.

### Halcyon: recolor and two new endings

The strongest model of the set: the helm, feathers and braid all read. She stays a woman, with her face and body as built (lore answer 1).

- **Cold blue:** both eyes and the blade's edge glow cold blue at all times. Remove the gold eye and the violet blade veins (lore answer 4).
- **Retreat:** a new action for the end of the level 20 fight, stepping back into the dark. It replaces the black-water `sink`.
- **Release:** at the very end she kneels, the blade warms with a thin line of light, and a pale moth rises from her (lore answer 10).
- Fix any "he" left in code comments.

### Wisp: new model

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
