# Art Request 05: Talking Portraits

When someone speaks while Io walks a map, a detailed portrait of them appears beside the words, as in FF9's dialogue boxes, so the player sees who they're talking to and not only a tiny pixel sprite. The pixel sprites stay for walking.

This first batch is a pilot of three, to settle the style before the rest of the cast and the townsfolk:

| # | Who | File | Attach |
|---|---|---|---|
| 1 | Io | `portrait-io.png` | `reference/art/portraits/witch-calm-20min.webp` and `reference/art/portraits/io-face-render.png` |
| 2 | Sol | `portrait-sol.png` | `reference/art/portraits/sol-face-sheet.png` |
| 3 | The shipmaster, an Aurosi elf | `portrait-shipmaster-a.png` or `-b.png` | None, or Sol's portrait once it exists, for the style |

How to make them:

- **One image per character for now,** a calm, neutral face. Later they get a few expressions (pleased, worried, angry) by attaching the first portrait and asking for the same picture with a new expression.
- **Square, 1:1, at least 1024 × 1024.** The game shrinks them to fit a phone.
- **Head and shoulders,** the face filling the upper middle, looking slightly toward the viewer's left (the side the words appear on).
- **A plain dark background** of deep indigo, so the game can frame it.
- **Night light:** soft cool moonlight from the upper left and a warm lamp glow from below right, as in the battle backdrops.
- Generate each two to four times and keep the one whose face matches the reference best.

## Style lock

Every prompt below starts with this.

```text
Highly detailed painted character portrait for a fantasy JRPG dialogue box, in the spirit of Final Fantasy IX character art: rich hand-painted rendering with crisp clean edges, expressive eyes, detailed hair and fabric, not photoreal, not pixel art, not anime cel shading. Head and shoulders, the face in the upper middle of the frame, turned slightly toward the viewer's left. Night lighting: soft cool silver-blue moonlight from the upper left, a warm amber lamp glow from below right. Plain deep indigo background with a faint soft vignette. No text, no frame, no border, no UI. Square 1:1, at least 1024 by 1024.
```

## 1. Io (Pilot)

Attach the 20-min Witch portrait and Io's face render. Her look must match her 3D model exactly. Save as `portrait-io.png`.

```text
Highly detailed painted character portrait for a fantasy JRPG dialogue box, in the spirit of Final Fantasy IX character art: rich hand-painted rendering with crisp clean edges, expressive eyes, detailed hair and fabric, not photoreal, not pixel art, not anime cel shading. Head and shoulders, the face in the upper middle of the frame, turned slightly toward the viewer's left. Night lighting: soft cool silver-blue moonlight from the upper left, a warm amber lamp glow from below right. Plain deep indigo background with a faint soft vignette. No text, no frame, no border, no UI. Square 1:1, at least 1024 by 1024.

Io, a young witch and the keeper of her village's moonwell: the same character as the attached images, matching her exactly. Bookish, kind and braver than she looks, with a soft warm smile. A round, gentle face with rosy cheeks, warm brown eyes behind large round black-rimmed glasses, and long wavy chestnut-brown hair with soft bangs. A tall magenta witch's hat with a wide brim and two curled cream horns striped in pale pink rising from its band, a gold moon emblem on the front and tiny gold charms on a fine chain round the band. A magenta robe with a high collar, a dark bodice and a fine gold chain, and a faint violet glow of magic near one hand.
```

## 2. Sol (Pilot)

Attach Sol's face views from her model sheet. Save as `portrait-sol.png`.

```text
Highly detailed painted character portrait for a fantasy JRPG dialogue box, in the spirit of Final Fantasy IX character art: rich hand-painted rendering with crisp clean edges, expressive eyes, detailed hair and fabric, not photoreal, not pixel art, not anime cel shading. Head and shoulders, the face in the upper middle of the frame, turned slightly toward the viewer's left. Night lighting: soft cool silver-blue moonlight from the upper left, a warm amber lamp glow from below right. Plain deep indigo background with a faint soft vignette. No text, no frame, no border, no UI. Square 1:1, at least 1024 by 1024.

Sol, the last Ember Warden, a sunsteel swordswoman of about 24: the same woman as the attached face views, matching her exactly. Blunt, proud and quietly kind, with a dry half-smile. Sun-browned freckled skin, a round face with full cheeks, amber eyes, and short tousled copper-red hair with one long braid bound in gold cord over her shoulder; small gold hoop earrings. Brushed bronze half-plate with gold edging and a small gold sun on the chest, a large left pauldron of bronze kestrel feathers with a glowing amber sunstone, and a midnight-blue cape lined in gold fastened with sun-shaped clasps. A faint amber glow from her sword's hilt below the frame.
```

## 3. The shipmaster (Pilot)

The Aurosi elf who runs the shipyard where the Magpie gets its final upgrade. The Aurosi come from Auros, the moon, a small world rich in sunstone at a sixth of the gravity here: they are tall, slender and light-boned, graceful, wealthy, elegant and very long-lived, with seven centuries of memory. They control the shipping between the worlds, and airships were theirs first.

Make **one** of these two, A (a woman) or B (a man), whichever you prefer, or both and pick. Save as `portrait-shipmaster-a.png` or `portrait-shipmaster-b.png`.

**A:**

```text
Highly detailed painted character portrait for a fantasy JRPG dialogue box, in the spirit of Final Fantasy IX character art: rich hand-painted rendering with crisp clean edges, expressive eyes, detailed hair and fabric, not photoreal, not pixel art, not anime cel shading. Head and shoulders, the face in the upper middle of the frame, turned slightly toward the viewer's left. Night lighting: soft cool silver-blue moonlight from the upper left, a warm amber lamp glow from below right. Plain deep indigo background with a faint soft vignette. No text, no frame, no border, no UI. Square 1:1, at least 1024 by 1024.

An elven shipmaster from the moon: a tall, very slender woman with an ageless, finely boned face, long tapering pointed ears, pale luminous skin with a faint gold sheen, and calm silver-grey eyes that have seen centuries. A composed, faintly amused, gracious expression, elegant and a little aloof. Long straight silver-white hair dressed high with fine gold pins set with small glowing amber sunstones. A high-collared coat of deep midnight-blue silk embroidered in gold with stylized airship sails and crescent moons, layered over a pale ivory blouse, with a heavy gold chain of office holding a large glowing amber sunstone pendant. Delicate gold rings on long slender fingers raised near her chin, holding a slim brass navigator's instrument.
```

**B:**

```text
Highly detailed painted character portrait for a fantasy JRPG dialogue box, in the spirit of Final Fantasy IX character art: rich hand-painted rendering with crisp clean edges, expressive eyes, detailed hair and fabric, not photoreal, not pixel art, not anime cel shading. Head and shoulders, the face in the upper middle of the frame, turned slightly toward the viewer's left. Night lighting: soft cool silver-blue moonlight from the upper left, a warm amber lamp glow from below right. Plain deep indigo background with a faint soft vignette. No text, no frame, no border, no UI. Square 1:1, at least 1024 by 1024.

An elven shipmaster from the moon: a tall, very slender man with an ageless, finely boned face, long tapering pointed ears, pale luminous skin with a faint gold sheen, and calm silver-grey eyes that have seen centuries. A composed, faintly amused, gracious expression, elegant and a little aloof. Long straight silver-white hair tied back with a gold clasp set with a small glowing amber sunstone. A high-collared coat of deep midnight-blue silk embroidered in gold with stylized airship sails and crescent moons, layered over a pale ivory shirt with a lace cravat, with a heavy gold chain of office holding a large glowing amber sunstone pendant. Delicate gold rings on long slender fingers raised near his chin, holding a slim brass navigator's instrument.
```

## Next, after the pilot

Once the style is settled: Halcyon, Noctara and Lunara, a few expressions for Io and Sol, and the townsfolk once the story's scenes say who speaks in each town (shopkeepers who sell herbs for sunstone shards, and people with news).
