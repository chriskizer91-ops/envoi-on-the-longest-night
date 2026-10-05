# The Return Slip

Every modeling session ends its work by writing this slip, filled in, as its last message. Chris copies it into the game's session (the hub), which uses it to bring the model into the game. It has to make sense to a session that never saw the modeling conversation.

```text
RETURN SLIP: <Creature or model name>
Brief:   envoi-final-draft/model-studio/briefs/<id>.md (or "custom", with the brief pasted below)
Branch:  work/model-<id> (or the branch this session pushed to, if that was refused)
Commit:  <the last commit's short hash>
Folder:  3d-model-new-character-ideas/<id>/  (nothing outside it changed)
Page:    <the bench page's claude.ai/artifact link>
Sheets:  original/<id>-model.<ext>, original/<id>-actions.<ext> (kept as Chris sent them)

Model:   <Name>   File: <id>.js   Function: make<Name>(opts)
Height:  <m>   Triangles: <n> (<n> at detail 0.5)   Bones: <n>   Draw calls: <body> + <effects>   Textures: <n> (<MB>)
Anchors: chest, head, hit, <others>
State:   frost (0 to 1: <what changes>), upset (0 to 1: <what changes>), target (<what aims at it>), <others>
Actions: <name> <dur s> hits [<u, ...>] <hold or interrupt>, ...   (every one, appear and die included)
Walk:    <gait, and the speed in m/s that looks right>
Defeat:  <what die shows: how it leaves the fight>

Checked: <headless renders beside the sheets: yes/no; errors: none/what>
Chris said: <his notes on the page, if any, and whether he's happy with it>
Open:    <anything not done, or anything for Chris or the hub to decide>
```

## Why each line matters

- **Branch and commit:** the hub fetches exactly that work.
- **Folder:** a modeling session changes nothing outside its own folder, so bringing it in can never break the game.
- **Page:** the hub and Chris can open the bench to see the model move.
- **The model's numbers:** the battle screen runs five models at once on Chris's Pixel 7a, so the hub checks each one against the budget in the brief.
- **Actions with their hit times:** the battle waits for each hit time to show its damage, so the numbers must match the motion.
- **Defeat:** wild creatures aren't killed (the game's tone rule); the hub writes the fight's last line from it.
