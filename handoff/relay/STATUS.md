# Relay: Results From the Old Hub

The session that has been the game's hub until now (October 3 to 5, "the old hub") is still running one helper. Its results land here for the ultracode session, which is the hub from now on (`../README.md`). The old hub changes nothing on the game's branch except this folder.

**Check it** from any branch, as often as you like:

```sh
git fetch origin ccr-31761774-76j8j3 'refs/heads/work/*:refs/remotes/origin/work/*'
git show origin/ccr-31761774-76j8j3:handoff/relay/STATUS.md
```

When a row below says **Delivered**, its note (`<name>.md` here) says what it is, which branch holds it and how to bring it in.

| Result | What it is | State | Branch | Note |
|---|---|---|---|---|
| `arenas` | The new battle arenas: every fight with 3D ground in front and its battle painting far off behind, as Colossus in the Meadow, built as a demo page with the game's switch off (Chris, October 4: "put all of the fights into an arena like that ... with the different battle backgrounds") | **Running:** the helper is checking every fight at phone and laptop size. Its commits so far: the eight paintings at Strong, every fight in its arena as a demo page, the fight kept above the menus on the phone, each fight's own weather | `work/arenas` once delivered (brought up to date with the game's branch first, so it merges cleanly) | `arenas.md` once delivered |

**How the old hub delivers:** when the helper finishes, the old hub merges the game's branch into the helper's branch (resolving the conflicts with the newer cutscenes and keepsakes there, not on the game's branch), runs the checks, publishes the arena demo page for Chris, pushes the branch as `work/arenas`, writes `arenas.md` here and marks the row Delivered.
