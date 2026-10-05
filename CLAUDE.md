# CLAUDE.md

## Repository rules

- This is the only repository to write to for this project.
- These sibling repositories are read-only references. Reuse their assets, mechanics and code when useful, but never commit to them:
  - `chriskizer91-ops/20-min`
  - `chriskizer91-ops/New-game`
  - `chriskizer91-ops/follow-me-down-witch-way`
  - `chriskizer91-ops/building-with-assets-`
- When copying assets or code from a sibling repo, note the source repo and path in the commit message.
- The demos and lore Chris brings to this project always outrank anything in a sibling repo. Never import a sibling repo's lore, tone rules or mechanics (such as dice) over them.

## Project

- Working title: *Envoi on the Longest Night*.
- A new session starts with `handoff/README.md` (since October 5: who is the game's hub, the old hub's last results in `handoff/relay/`, and what the game still wants, task by task, in `handoff/tasks.md`), then `docs/next-session.md` (where the work stands). `docs/handoff.md` is the October 3 list it replaces.
- Design context lives in `docs/game-context.md`; decisions in `docs/design-decisions.md`; the build order in `docs/plan.md`.
- Canon order: `docs/design-decisions.md`, then `docs/lore/lore-answers-2026-10-01.md`, then the Noctara amendment, then the bible.
- The main cast is all women: Io the Witch, Sol, Halcyon, Noctara and Lunara. Halcyon is "she" everywhere, including code comments.
- The Drowned Mother, Old Snuff and the mandrakes are retired. Never use them or their lore, even though the bible and prompt pack still describe them.
- The Witch's 3D model must keep exactly how she looks and moves; changes to her are technical only.
- Every step ends in a demo page Chris can open on his phone, before anything is put together.
- Lore questions go to Chris in `docs/questions/`; he answers them in a separate lore conversation.
- When new art is needed, write the image prompts as markdown files in `docs/art-requests/` for Chris to generate.
- New character ideas Chris brings go in `3d-model-new-character-ideas/`, one folder each, with what he brought kept untouched in its `original/`. They aren't canon until he places them.
- The whole game is put together in `putting-it-all-together/`: its page, and a README listing every piece, where it comes from and its state. Chris's songs went in on October 4, when he asked for them.
- Pass three (from October 3, evening) keeps its decisions, pages and plans in `envoi-game-pass-3/`, one folder per page. Chris edits things on his laptop.
- The final draft (October 4, evening) is in `envoi-final-draft/`: Chris's file as he keeps it, the review, and the model studio (`envoi-final-draft/model-studio/`), through which modeling sessions Chris starts build new creatures in their own folders and hand them back to the game's session. Cutscenes are made the same way, from the briefs in `envoi-final-draft/cutscenes/`.
- The twenty keepsakes Chris locked (October 4, evening) are in `envoi-final-draft/items/`, with his pictures in `reference/art/keepsakes/`. He approved their places that night and they are in the game (`src/game/keepsakes.js`); he moves any with the map editor (`envoi-final-draft/map-editor/`, the walking paths and the keepsakes in one tool).
- The final polish pass (October 5, night) is in `final-pass-polish-october-5-2026/`: Chris's file as he sent it, every fix of the audit's findings with the check that proves it (`checks/`, and `checks/full-pass.sh` for the whole pass), the list of every sound the game plays (`sounds/`), and its hand-off (`handoff.md`), read first. Chris now takes the game as one HTML file, most likely opened in Chrome on his phone held sideways, where the address bar stays (the game has no full screen): test at 915 x 356 too.
- Several sessions work on the game at once through the workshop (`envoi-final-draft/workshop/`): each job has a brief and a starter script Chris pastes into a new session, works on its own branch `work/<job>`, changes only the files its brief allows, and leaves a slip. The game's session brings each job in.
