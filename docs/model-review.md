# Model Review: October 1, 2026 Baseline

Every code-built model rendered side by side at true scale under the game's lighting (Model Build Spec), with face close-ups. The renders are in `../reference/renders/2026-10-01-baseline/`, made with `../tools/lineup/`.

## Budgets

The spec's targets: 70k to 100k triangles (minimum 50k, ceiling 120k for bosses), 30 to 55 bones, 40 or fewer draw calls (ceiling 60).

| Model | Source | Triangles | Bones | Draw calls | Spec interface |
|---|---|---|---|---|---|
| The Witch | `night-square-shadow-wraith.html` | 99k | 51 | 84 | No (older interface) |
| Sol | `sol-in-the-night-square.html` | 83k | 54 | 38 | Yes |
| Halcyon (v2) | `halcyon-in-the-night-square.html` | 88k | 63 | 31 | Yes |
| Noctara | `noctara-in-the-night-square.html` | 28k | none (rigid joints) | 88 | Mostly (no `setFade`; `block` is 0.6 s) |
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
- **Spec fixes:** skin the body to a bone chain, make `block` 0.45 s, and keep `busy` true while a hold action plays, so a stray `play()` can't cut off the summon.

### Noctara: visible upgrade, the biggest gap

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
- Give her the spec interface.

### Shadow Wraith: polish

- It already reads well: a dark hood, glowing green eyes and a ribcage.
- Replace the spotted robe texture with layered, tattered cloth, add skeletal hands, and bring in the ornate crescent scythe and moon emblems from the pose sheet, in green.
- Give it the spec interface.

### Halcyon: waiting on an answer

The strongest model of the set: the helm, feathers, gold eye and braid all read. Whether Halcyon is a man or a woman decides whether this is polish or a rebuild of the face and body (see `questions/lore-and-story.md`).

## Source art to match

| Model | Sheets in hand | Missing |
|---|---|---|
| The Witch | Not needed | — |
| Sol | None | The model and action sheets used to build her |
| Envoi | `envoi-summon-scene-a.png`, `envoi-strike-scene-b.png` | The model and action sheets used to build it |
| Noctara | `noctara-model-sheet-a.png`, `noctara-model-sheet-b.png` and four scenes | — |
| Lunara | `lunara-pose-sheet.png` | — |
| Shadow Wraith | `shadow-wraith-pose-sheet.png` (violet) | — |
| Halcyon | The Blackout scene | The model and action sheets used to build it |
