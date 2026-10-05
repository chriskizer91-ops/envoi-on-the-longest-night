# Intake: Bringing a Finished Model Into the Game

For the hub session (the one working on the game itself), when Chris pastes a return slip (`return-slip.md`). The modeling session built the model in its own folder on its own branch; everything below happens here, on the game's branch.

## 1. Fetch it and check it touched only its folder

```sh
git fetch origin work/model-<id>             # or the branch the slip names
git diff --stat HEAD...FETCH_HEAD          # every path must be under 3d-model-new-character-ideas/<id>/
git merge --no-ff FETCH_HEAD -m "Bring in <Name> from <branch>"
```

If anything outside its folder changed, don't merge. Copy only the folder instead (`git checkout FETCH_HEAD -- 3d-model-new-character-ideas/<id>`), and say so in the commit message.

## 2. Check the model against its brief

- `original/` holds Chris's sheets, untouched.
- The model loads with three.js r128 and nothing else, as one function `make<Name>(opts)`, and follows `docs/specs/model-build-spec.md`'s interface.
- Its numbers fit its brief's budget. Roughly, pack creatures are lighter than great ones:

  | Kind | Triangles | Draw calls, body | Draw calls, with effects |
  |---|---|---|---|
  | Pack creature (two or three in a fight) | 45k or fewer | 12 or fewer | 25 or fewer |
  | Lone creature | 90k or fewer | 20 or fewer | 35 or fewer |
  | Great creature (a rare fight or a lair) | 120k or fewer | 24 or fewer | 40 or fewer |

- Every action in the slip plays, hits land where the motion lands them, and `frost` and `upset` change the look from 0 to 1 without popping.
- A headless check (`tools/check.mjs` style: Chromium with SwiftShader) shows no errors.

## 3. Into the game

The eight steps in `../../putting-it-all-together/README.md` ("How a new mob comes into the game"), in short:

1. The idea folder is in (step 1 above).
2. Copy `<id>.js` into `src/models/` unchanged.
3. Its rules in `src/battle/rules.js` `FOES`: HP, gauge time, weaknesses (frost-touched creatures are weak to fire and sun), experience and shards, and its moves (`act`, `hits`, `target`, `weight`), with the brief's signature move.
4. Its look in `src/game/fights.js` `FOE_LOOK` and `makeFoe`, with `frost` and `upset` from the band. Since the new battles are in (the arenas, switched on October 5: `../arena/README.md`), it also needs its place in `ARENA_AT`, in the same file: where Io, Sol and the foes stand in an arena, in metres. A pack creature fights from `pack` (places for three foes), a lone one from `lone` (one place, with the party a little nearer) and a great one from `great` (one place, farther off; today only the great wraith's fight uses it), or from an entry of its own if it's much bigger, as the Colossus has. Its fight in `config` must pick that entry. The wild fights pick `lone` or `pack` with `const lone`, which is true only for the Bramble forms and also gives them the Bramble's own lines (`introMsg`, `introAfter`, `attackText`, `winMoth`, `winText`), so a new lone creature needs a test of its own there that picks `lone` without the Bramble's lines.
5. Its moves play through `anyMove`; a signature move with its own rule (a steal, a howl, a dive) gets its own few lines in `src/battle/engine.js` and `src/battle/screen.js`.
6. Its balance targets and its bands in `src/battle/sim.js` (`BAND_PACKS`), checked with `node tools/balance.mjs` (every target met) and `node tools/chain.mjs` (every gate still reached at its level).
7. A demo page in `demos/` with its fight on its own (copy `demos/colossus.html`).
8. One line in `putting-it-all-together/game.html` to load its model.

Its defeat line goes in its fight's `winMoth` (`src/game/fights.js`): a wild creature isn't killed, it leaves.

## 4. Check and publish

```sh
node tools/build.mjs --min putting-it-all-together/game.html && node tools/game-test.mjs --steps title,new,wild --band <its band> --level <a level in it>
node tools/build.mjs --min --offline putting-it-all-together/game.html && node tools/game-test.mjs --offline
```

Then publish the demo page and the game to their links (`../../docs/next-session.md` lists them), and update the board in `README.md` and the creature's line in `../../3d-model-new-character-ideas/README.md`.
