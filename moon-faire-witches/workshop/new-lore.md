# Job: new-lore

Write the new game's lore with Chris: the same places as Envoi, in another world (an alternate universe), with Moon Faire's
Io, the Jester, a new Halcyon and Moon Faire's big bad where Noctara was.

## Why (Chris, November 16)

"We're going to have to come up with new lore for the NPC conversations. It kind of started off wrong. ... It's as if we're
making another game in the same location ... alternate universe building almost."

The townsfolk page (`moon-faire-witches/walk/town.html`) uses Envoi's own conversations (`src/game/script.js`), which tell
Envoi's story. This game needs its own.

## What is settled

- Io is Moon Faire's Io, the Herbal Witch: natural herbal healing and summoning (her lore in Moon Faire: `game/world/LORE-BRIEF.md`
  on Moon Faire's branches, read-only).
- The Jester completely replaces Sol: the duality of life and death; fate. She stays "the Jester" until Chris names her
  (candidates in `docs/questions/moon-faire-witches.md`).
- Halcyon is a paladin on Io's body, with her own face and a glowing aura.
- Moon Faire's big bad stands where Noctara, the Queen of Darkness, stood. Darkness can mean something different here.
- Envoi's places, levels, foes and how often they come stay. Moon Faire's fair folk play the 17 townsfolk (the cast table in
  `moon-faire-witches/README.md`).
- The project's rules still hold: the main cast is all women; the Drowned Mother, Old Snuff and the mandrakes are retired.

## What to do

1. Ask Chris the questions you need, a few at a time, in plain words. Start with the world: what the long night is here,
   what the darkness is, who Io and the Jester are to each other, who Halcyon is.
2. Write it down as it is decided, in `moon-faire-witches/lore/` (a lore file of what is decided, and one file per place
   with what its people know and say).
3. Then the townsfolk's conversations, place by place, written so the hub can swap them in for Envoi's
   (`src/game/script.js` shows the shape: each person's lines by what the party has done so far).
4. Send Chris each place's conversations as a page he can read on his phone, as one HTML file.

## Files you may change

- `moon-faire-witches/lore/` (everything in it)
- `docs/questions/moon-faire-witches.md` (add questions and Chris's answers)
- `moon-faire-witches/workshop/slips/new-lore.md`

## Done when

Chris has the world's lore settled and every townsfolk's conversations written, place by place, and is happy with them.
