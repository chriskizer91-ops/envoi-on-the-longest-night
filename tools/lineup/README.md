# Line-up

Renders every code-built model side by side at true scale, under the game's lighting from the Model Build Spec, plus face close-ups and Envoi to scale. It is a check page for model touch-ups, not part of the game.

```sh
tools/lineup/extract.sh                      # copy the model functions out of reference/demos into build/
node tools/lineup/render.mjs front three-quarter back battle envoi face:Witch face:Sol face:Halcyon face:Noctara face:Wraith face:Lunara
```

Screenshots land in `tools/lineup/out/` (or `$OUT`). Views: `front`, `three-quarter`, `back`, `battle` (the game's 12° lens at 24° pitch), `envoi`, and `face:<Name>`. Run `face:` views before `envoi`, which moves the Witch and Sol.

The 2026-10-01 baseline renders are in `reference/renders/2026-10-01-baseline/`.
