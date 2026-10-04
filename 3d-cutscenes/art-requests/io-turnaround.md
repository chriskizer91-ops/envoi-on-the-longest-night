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

## For Meshy's free plan: the front view alone

Meshy's free plan builds from one picture only (the side and back views need a paid plan), so for a free test make just the front view. A tall picture, 1024 × 1536 or the closest your tool makes, from this prompt (the same as above, but for one view):

```text
A full-body front view of one young witch, for building a 3D model: she faces the viewer straight on, standing straight in a relaxed A-pose with her arms held a little away from her body and her feet slightly apart, her hands open and empty, the whole of her in the picture from the tip of her hat to her boots, with a little space all round. Clean, high-resolution anime fantasy illustration, not pixel art, with soft, even, flat lighting and no cast shadows, glow or motion, on a plain light grey background, with nothing else in the picture and no text.

She matches the attached paper doll and portrait exactly, with the proportions of a young woman about five and a half heads tall, a little stylised but not chibi. Warm peach skin, rosy cheeks, large warm brown eyes with dark upper lashes, thin dark brows, a small gentle smile, and small pointed ears showing through her hair. Round, thin, black-framed glasses. Long, very wavy dark brown-black hair with ash-grey streaks, past her shoulders, with soft bangs swept to one side under her hat. A wide-brimmed plum-magenta witch's hat with a tall bent tip, two cream ram's horns curling out from its dark band, a gold ring-and-cross emblem on the front, and a fine silver chain with tiny gold crosses round the crown. A long, open plum-magenta cloak-coat with wide sleeves, a ragged wavy hem and dotted gold stitching along its edges; a black lace dress with a layered black skirt; a gold crescent-moon and cross pendant on a black cord; dark bracelets; black lace-up boots with buckles. No veil, no flame, no dagger.
```

## Making the model on Meshy's free plan

As Meshy's own help pages described it in October 2026; the buttons may be named a little differently.

1. Sign in at meshy.ai with a free account and open **Image to 3D**.
2. Upload the front view (PNG, JPG or WebP).
3. **AI model:** pick the one a free account can download. Meshy's help page says free accounts can download up to 10 models a month made with **Meshy 6 Lite** (older pages say Meshy 5). Models made with the newest one (Meshy 7) can be made on the free plan but not downloaded.
4. **Pose: A-pose,** so she can be given a skeleton. Keep **texture** on. If it asks how many polygons, about 30,000. Leave the rest as it is.
5. **Generate,** then turn her round in the preview. The free plan's 100 credits a month are enough for a few tries; keep the best.
6. **If you like,** use **Animate** (or **Rig**): choose a humanoid, follow its steps, and add a walk and an idle. Meshy says rigging and animations cost no credits.
7. **Download as GLB,** with the animations if you added them. Each download counts toward the free plan's 10 a month.
8. **Send Claude** the `.glb` file and the picture you used.

Models made on the free plan are shared under the CC BY 4.0 licence rather than kept private. That is fine for a test. For the model the game keeps, one paid month would give a private model, Meshy's newest model, and the side and back views.

## Making the model on Tripo's free plan

Chris made the front view (`io-front.webp`, 1024 × 1536, from the prompt above) and tried Tripo Studio (studio.tripo3d.ai) first. The settings for a free test, October 4, 2026:

- **HD Model**, with the front view uploaded. Not **Generate Multi-Views** (members only; it would invent her side and back).
- **AI Model: H2.5 – Legacy.** Tripo's pages say a free account can download (export) only H2.5 models, up to 15 a month; H3.0 and H3.1 can be made but not downloaded.
- Under **General Settings**, the **Geometry & Texture** row opens the rest (Tripo keeps them for next time):
  - **AI Complete: off.** It reworks the picture before building, and this one is already clean.
  - **Texture: on. Texture Quality: 2K:** enough for a phone, a smaller file, and fewer credits than 4K.
  - **Remove Lighting: off** for the first try, so she keeps the picture's painted look.
  - **PBR: off.** She is painted, not metal; PBR adds extra maps and credits, and the pages light her their own way.
  - **Topology: Triangle.** The pages draw triangles anyway, and Tripo's quad option can change the download to FBX.
  - **Polycount: 50,000**, the most it allows. Claude can make her lighter later, but not add detail back.
- **Members Only:** Generate in Parts off, 8K Texture off. Privacy stays Public on the free plan, and free models are shared under CC BY 4.0.
- After **Generate**, turn her round, and download her as **GLB**. Rig can wait until the model looks right.
