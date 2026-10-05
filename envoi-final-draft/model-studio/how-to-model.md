# How a Modeling Session Works

For a Claude session that Chris has started with one of the briefs in `briefs/`. Read this whole file before you start; your brief says what to build, this file says how. It follows the way the Bramble Horror, the Bramble Colossus, the Emberback and the Gloamwing were built, so the hub can bring your model into the game without changing it.

## 1. Start from the game's branch

A new session starts on the repository's default branch, which is older than the game. Start from the game, on your own branch, `work/model-<id>` (your brief's id), where the hub looks for your work:

```sh
git fetch origin ccr-31761774-76j8j3
git checkout -B work/model-<id> FETCH_HEAD
```

If that refuses, stop and tell Chris; don't force anything. Then `npm install --prefix tools` once.

## 2. Read

1. `CLAUDE.md` (the project's rules) and your brief.
2. `docs/specs/model-build-spec.md`: the interface every model follows. Your model must follow it exactly.
3. `3d-model-new-character-ideas/README.md`, and the Emberback's folder (`3d-model-new-character-ideas/emberback/`) as the example of a finished creature: its `README.md`, `emberback.js`, `emberback.html`, `bench.js` and `renders/`.
4. Your creature's section in `docs/art-requests/13-wild-creatures.md`: the prompts Chris made the sheets from.

## 3. Your folder, and only your folder

- Everything you make goes in `3d-model-new-character-ideas/<id>/`. Change nothing outside it: not `src/`, not `docs/`, not `tools/`, not the game. If something shared needs changing, write it under "Open" in your README for the hub.
- Save Chris's two sheets in `original/` exactly as he sent them, as `<id>-model.<ext>` and `<id>-actions.<ext>`, and never edit them.
- **The sheets win.** Where the sheets and the brief's words disagree about how it looks, follow the sheets, and note the difference in your README.

## 4. The model

- One file, `<id>.js`, one function `make<Name>(opts)`, three.js r128 (global `THREE`), no imports, no image or model files: every texture is painted on a canvas in code. Build it in parts if that's easier, joined into the one file.
- The interface in the spec, exactly: `root`, `fx`, `animate`, `play`, `guard`, `reset`, `busy`, `action`, `progress`, `dash`, `lift`, `state`, `setFade`, `anchor` (at least `chest`, `head`, `hit`), `ACTIONS`, and `detail` from 0.5 to 1.
- **The budget** is in your brief: a pack creature (two or three at once in a fight) is much lighter than a lone or great one. The battle runs five models at once on Chris's Pixel 7a.
- **Actions:**
  - `appear` (how it enters the fight), `hurt` (interrupt, about 0.6 s, a small knockback), `block` (interrupt, about 0.45 s), and `die` (hold), plus the moves in your brief.
  - `die` is not a death. In this game a beaten wild creature isn't killed: the fight goes out of it and it leaves, as your brief describes. `die` plays that and fades it out at the end with `setFade`.
  - Every hit time in `ACTIONS` must land where the motion lands the blow: the battle waits for them to show the damage.
  - The idle (breathing, looking about) and the walk or run come from `animate`.
- **Two looks every wild creature has**, in `state`, both 0 by default, changing smoothly with no rebuild:
  - `frost` (0 to 1): Noctara's cold on it. Rime on its fur, hide or shell, frost at the edges, icicles where things hang, its breath steaming, its colours paler and greyer, its own glow dimmer and flickering. At 1 it should still read as the same creature.
  - `upset` (0 to 1): how frightened and angry it is. Hackles, ears, crest or spines raised, a tenser stance, quicker and jerkier idle, eyes rimmed with a hot glow.
  - The game sets both from the band: the closer the party comes to Noctara, the higher they go (Chris: "the closer the party gets to Noctara, the more upset the wild becomes").
  - Also `state.target` (a `THREE.Vector3`): where its prey stands, so its head and its blows aim at it.
- **Colours:** keep its main colours out of the other lanes: Noctara's deep purple, the wraiths' soul-green, Halcyon's cold blue. Frost's pale blue-white is fine. Night reads best with readable mid-tones and a warm glowing accent, never pure black.
- No shadows (the game draws a blob shadow), and never change the number of lights: a light of its own lives in `fx` at intensity 0 when off.

## 5. The bench page

Start from the Emberback's bench (`emberback.html`, `bench.js`, its css) and make it yours:

- the wild meadow at ten at night, Io and Sol (their original models) facing it;
- a button for every move, a **Sheet poses** button that holds the action sheet's poses one after another, numbered as on the sheet, and a turntable;
- **Frost** and **Upset** sliders;
- for a pack creature, **Pack: 1, 2, 3**, to see two or three of them at once in front of the party;
- its sounds made in code with `living-battlefields/sfx.js`, as the other benches do;
- the numbers (triangles, draw calls, frame rate) in a corner.

Build it into one file:

```sh
node tools/build.mjs 3d-model-new-character-ideas/<id>/<id>.html
cp dist/<id>.html 3d-model-new-character-ideas/<id>/<Name>_Bench.html
```

## 6. Check it, then show Chris

- Render it headless (Chromium with SwiftShader through Playwright, as `tools/check.mjs` does): the four turnaround views beside the model sheet, and each move at its key frame beside the action sheet. Fix every mismatch you can see. Save the side-by-sides as `renders/sheet.jpg` and `renders/moves.jpg`.
- No errors in the page, no pops between actions, and the numbers inside the budget.
- Publish the bench as a private page (the Artifact tool, publishing `dist/<id>.artifact.html`) so Chris can open it on his phone. Tell him in plain words what to try. He isn't a programmer.
- Change what he asks for, as many rounds as he wants, republishing to the same link.
- The machine has 4 cores: run renders one at a time, with long timeouts.

## 7. Hand it back

1. Write `README.md` in your folder, like the Emberback's: what it is, what Chris brought, the model, its moves (a table with each move's length, hits and cues), its numbers, the Model Build Spec's card, and what's still open.
2. Commit only your folder, by explicit path, with a message that says the sheets are Chris's. Push to `work/model-<id>` (`git push -u origin work/model-<id>`), as you go and at the end. If that push is refused, push to your own branch and name it in the slip.
3. Your last message is the return slip (`return-slip.md`), filled in. Chris takes it to the hub.

## The project's other rules, in short

- The main cast is all women: Io, Sol, Halcyon, Noctara and Lunara. Halcyon is "she" everywhere, code comments included.
- The Drowned Mother, Old Snuff and the mandrakes are retired, with all their lore. Never use them.
- Moths are souls going home, and wisps and wraiths are Noctara's. Your creature belongs to the wild, not to her.
- Lore questions go in your README's "Open" list for Chris; don't invent story beyond your brief.
- The sibling repositories are read-only. If you copy anything from one, name the repository and path in the commit message.
