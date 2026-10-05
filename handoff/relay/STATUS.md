# Relay: Results From the Old Hub

The session that was the game's hub until October 5 ("the old hub", which built it from October 3) posts its last results here for the ultracode session, which is the hub from now on (`../README.md`). The old hub changes nothing on the game's branch except this folder.

**Check it** from any branch, as often as you like, and always before you start a task and after you finish one:

```sh
git fetch origin ccr-31761774-76j8j3 'refs/heads/work/*:refs/remotes/origin/work/*'
git show origin/ccr-31761774-76j8j3:handoff/relay/STATUS.md
```

When a row below says **Delivered**, its note (`<name>.md` here) says what it is, which branch holds it and how to bring it in. When you've brought a delivery in, say so in its note's first line (that is the one change you make in this folder), so neither hub wonders.

| Result | What it is | State | Branch | Note |
|---|---|---|---|---|
| `arenas` | The new battle arenas: every fight with 3D ground in front and its battle painting far off behind, as Colossus in the Meadow, built as a demo page with the game's switch off (Chris, October 4: "put all of the fights into an arena like that ... with the different battle backgrounds") | **Delivered** October 5: merged with the game's branch at `0757ee8`, checked, demo published for Chris | `work/arenas` | `arenas.md` |
| `tasks-verified` | A second pass that checked the task list against the files | **Stopped** October 5 at Chris's word, before it delivered: nothing more will come. `../tasks.md` is the list | none | none |
| `pictures-wilds` | Chris's eight night scenes for art request 12 | **Came October 5, before you started,** so they're on the game's branch itself, not a work branch: `reference/art/walk/wilds/` (his packs' notes in `packs/` there). The wilderness scenes task in `../tasks.md` is ready to build | the game's branch | none needed |
| `pictures-creatures` | Chris's creature sheets for art request 13 (two per creature, wave 1 first), if he sends them to the old hub | **Only if they come here.** He has been asked to send them to you, or to a modeling session (`../../envoi-final-draft/model-studio/`), from now on | `work/pictures-creatures` if they come | `pictures-creatures.md` if they come |

**How the old hub delivers:** it has nothing running now. If Chris sends it anything more (most likely pictures), it keeps the files exactly as they came under `reference/art/` on a branch of their own (`work/pictures-<what>`, made from the game's branch), pushes the branch, writes the note here saying where each file is and which task waits on it (`../tasks.md`), and marks the row Delivered. It never builds them into the game: that is yours, or a workshop job's.
