# Art request: Io's turnaround, for a 3D model

One clean picture of Io standing still, seen from the front, the side and the back, for Meshy (or any picture-to-3D tool, or a 3D artist) to build a 3D Io from. The paper doll's frames are small pixel art in action poses, and a picture-to-3D tool turns those into a blocky, muddled model. This picture shows the same design painted cleanly, large and still.

How to make it:

- **Attach** the paper doll sheet (the thirteen poses) and Io's portrait (`art/portraits/portrait-io.webp`, or `3d-cutscenes/portrait-io.webp`), for her face, hat and clothes.
- **One wide picture,** 2048 × 1024 or the closest size your tool makes, with the three views side by side: front, her left side, back.
- **Make a few and keep the one where the three views match best:** the same height, clothes and hair in each, and the feet on one line. Her face matters most in the front view.
- **If your tool does better with one view per picture,** make three pictures from the same prompt, changing only "three times side by side ... front view, left side view and back view" to the one view, all the same size.
- **Save it** as `io-turnaround.png` and send it to Claude.

What happens next: Claude cuts it into its three views, sends them to Meshy, and gets back a 3D Io. Claude then gives her a skeleton, a walk and an idle, and puts her in the garden with the film camera, beside the paper doll for comparison. If her face comes back soft, Claude paints the paper doll's eyes, brows and mouth onto it.

```text
A character turnaround sheet of one young witch, for building a 3D model: the same character three times side by side at the same height, front view, left side view and back view, standing straight in a relaxed A-pose with her arms held a little away from her body and her feet slightly apart, her hands open and empty. Clean, high-resolution anime fantasy illustration, not pixel art, with soft, even, flat lighting and no cast shadows, glow or motion, on a plain light grey background, with nothing else in the picture and no text.

She matches the attached paper doll and portrait exactly, with the proportions of a young woman about five and a half heads tall, a little stylised but not chibi. Warm peach skin, rosy cheeks, large warm brown eyes with dark upper lashes, thin dark brows, a small gentle smile, and small pointed ears showing through her hair. Round, thin, black-framed glasses. Long, very wavy dark brown-black hair with ash-grey streaks, past her shoulders, with soft bangs swept to one side under her hat. A wide-brimmed plum-magenta witch's hat with a tall bent tip, two cream ram's horns curling out from its dark band, a gold ring-and-cross emblem on the front, and a fine silver chain with tiny gold crosses round the crown. A long, open plum-magenta cloak-coat with wide sleeves, a ragged wavy hem and dotted gold stitching along its edges; a black lace dress with a layered black skirt; a gold crescent-moon and cross pendant on a black cord; dark bracelets; black lace-up boots with buckles. No veil, no flame, no dagger.
```

The veil, her flame and her dagger are left out on purpose: see-through cloth and glowing things confuse picture-to-3D tools. The 3D pages already make her flame and dagger in code, and can add the veil the same way.
