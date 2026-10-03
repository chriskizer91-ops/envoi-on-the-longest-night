// script.js: the game's words (plan phase 5): what the townsfolk say as the story moves on, the letters left at the
// small wells and the gifts tied to them (lore answer 14), and the story scenes from the prologue to the ending. Every
// line is a placeholder written for Chris's lore conversation to replace; the story is the five lines at the top of the
// lore answers, and nothing here comes from the retired Drowned Mother story. A line is [who, text] or a string
// (narration); who is 'io', 'sol', 'shipmaster' (painted portraits) or a person's id (a pixel portrait).
// Defines window.SCRIPT = { people, wells, scenes, cast }.
(function () {
  'use strict';
  // who the people are, for their pixel portraits when they speak in a scene away from their map
  const cast = {
    gretch: { name: 'Mayor Gretch', look: 'elder' }, nettie: { name: 'Nettie', look: 'witch2' }, hilde: { name: 'Hilde', look: 'smith' },
    quill: { name: 'Quill', look: 'sailor' }, wenna: { name: 'Old Wenna', look: 'elder' }, tobb: { name: 'Tobb', look: 'smith' },
    pell: { name: 'Pell', look: 'child' }, marta: { name: 'Marta', look: 'elder' }, brann: { name: 'Brann', look: 'smith' },
    tamsin: { name: 'Tamsin', look: 'child' }, ysmera: { name: 'Ysmera Brightkeel', look: 'aurosi' }, pim: { name: 'Pim', look: 'gnome' },
    tock: { name: 'Tock', look: 'gnome' }, gil: { name: 'Old Gil', look: 'elder' }, sorrel: { name: 'Sorrel', look: 'witch2' },
    ede: { name: 'Ede', look: 'elder' }, watch: { name: 'The watchwoman', look: 'smith' },
  };
  const F = (st) => st.flags;
  // what each person says: a function of the game's state, returning lines
  const people = {
    gretch: (st) => (!F(st).party ? [['gretch', 'The bridge lamps went out one by one, Io. Something is coming out of the Thornwood.']]
      : !F(st).lights ? [['gretch', 'Bogmire has gone dark, and Bogmire is where the Thornwood road ends. Be careful in those woods.'], ['gretch', 'If you need rest, the Moonwell is yours. Lunara has always slept lightly for you.']]
      : !F(st).ending ? [['gretch', 'Word came that Bogmire’s lamps are lit again. We’ve lit ours every night for you since.']]
      : [['gretch', 'The stars are back. I stood in the square half the night just looking at them.']]),
    nettie: (st) => (!F(st).party ? [['nettie', 'Herbs, Io? Moonpetal and Mugwort, fresh. Though you’ll want them more than I will, tonight.']]
      : [['nettie', 'One of each, that’s all a body can carry and still run. Moonpetal for hurts, Lavender for the both of you, Mugwort for your MP, the Lily for courage, Nightrose for the worst.']]),
    hilde: (st) => (!F(st).party ? [['hilde', 'I banked the forge high tonight. Wraiths don’t like a fire. Or so my mother said.']]
      : [['hilde', 'A Warden! I thought I’d never see that sun on a breastplate again. Mind the edge on that blade, girl. It’s good steel.'], ['sol', 'It was my teacher’s before it was mine.']]),
    quill: (st) => (!F(st).party ? [['quill', 'Evening, witch. Lamps by the bridge are going out. You’d best see to it before Inkblot starts fretting.']]
      : !F(st).lights ? [['quill', 'She’ll lift for you, the Magpie, but not far and not into the dark. Bring Bogmire’s lamps back and I’ll fly her over to you.']]
      : !F(st).refit ? [['quill', 'Bogmire’s shipwrights can refit her, if you’ve the sunstone for it. Six hundred and fifty shards. Fair, for a keel.']]
      : [['quill', 'She flies like she’s twenty years younger. Mind her in the cold, mind.']]),
    wenna: (st) => (!F(st).lights ? [['wenna', 'Herbs, in the dark? I know my jars by touch. Here. Smell before you pay.']]
      : [['wenna', 'Look at that, I can read my own labels again. Herbs, dear?']]),
    tobb: (st) => (!F(st).lights ? [['tobb', 'We’ve beds, if you don’t mind the dark. Nobody’s sleeping much since the lights went.']]
      : [['tobb', 'Witch, Warden: there’s always a bed here for you two, and no coin taken. Not after what you did.']]),
    pell: (st) => (!F(st).lights ? [['pell', 'It took the lights. All of them. It sits out in the fen’s heart, up the long walk north, with them burning in its ribs.'], ['pell', 'Mam’s lamp too.']]
      : [['pell', 'The lights came home! I saw them fly over the water like fireflies, every one to its own window.']]),
    marta: (st) => (!F(st).envoi ? [['marta', 'Sol? Little Sol? Look at you. You’re all that’s come home.'], ['sol', 'I know, Marta.'], ['marta', 'The hall’s still made up. Forty bunks. Sleep in any of them.']]
      : [['marta', 'The node’s light is in that ship of yours now. Go on north, both of you. And come back.']]),
    brann: (st) => [['brann', 'Herbs from the road, and the last of the summer’s Lavender. One of each, Warden’s rule.']],
    tamsin: (st) => (!F(st).envoi ? [['tamsin', 'Are you a real Warden? Marta says there aren’t any more.'], ['sol', 'There’s one.']]
      : [['tamsin', 'I saw the wyrm made of letters! It folded right up into nothing.']]),
    ysmera: (st) => (!F(st).shipyard ? [['shipmaster', 'A witch and the last of the Wardens, at my yard. Your little ship will need more than courage to fly north.']]
      : !F(st).upgrade2 ? [['shipmaster', 'Four thousand five hundred shards of sunstone, and my gnomes will give her a moon-sail. Nothing less will lift her over the peaks.']]
      : [['shipmaster', 'She’s ready. Misthollow is over the peaks, east. Fly before the cold does.']]),
    pim: (st) => [['pim', 'Herbs! From the Moon, some of them. Well, from people who’ve been. One each!']],
    tock: (st) => (!F(st).upgrade2 ? [['tock', 'A skiff that flies on sunstone and stubbornness. We’ve fixed worse. Not much worse.']]
      : [['tock', 'Moon-sail’s on. She hums now. Listen.']]),
    gil: (st) => [['gil', 'Bunks for the yard hands, and two to spare. You look like you need both.']],
    sorrel: (st) => (!F(st).ending ? [['sorrel', 'I’ve herbs, though they’ve all gone pale in the cold. They still work. Mostly.']]
      : [['sorrel', 'My herbs have their color back. Isn’t that a silly thing to notice, after all that?']]),
    ede: (st) => (!F(st).ending ? [['ede', 'She came three nights ago, the Starless. The Moonwell went black in an hour. We keep the inn fire lit, for spite.']]
      : [['ede', 'The Moonwell shines. I didn’t think I’d see it again.']]),
    watch: (st) => (!F(st).ending ? [['watch', 'The street goes up to the Moonwell. She’s there, and the knight with her. Nobody who went up has come down.']]
      : [['watch', 'Nothing on the stair tonight but moonlight. I could get used to that.']]),
  };
  // the letters at the small wells, and what was left with them
  const wells = {
    moonstone: { letter: ['A letter, folded small and pinned under a pebble:', '“Aldo. The bridge lamp is lit every night now. If you’re still in the woods, come home by it. — your sister.”'], gift: { herb: 'moonpetal' } },
    bogwell: { letter: ['A letter in a child’s hand, wrapped in oilcloth:', '“Mam. The boardwalks are dark and I’m not scared. I keep your lamp in the window even with no flame in it. — Pell.”'], gift: { shards: 120 } },
    dawnwell: { letter: ['A letter in Marta’s hand, tied to the windlass:', '“To the Wardens who didn’t come back from the north. We kept your bunks.”'], gift: { herb: 'lavender' }, sol: 'She never stopped making them up. Every one.' },
    crosswell: { letter: ['A letter weighted under a stone on the well’s rim:', '“To my love at the yard: the cold is coming down the road early this year. Light the lamps. I’ll find my way. — Ennis.”'], gift: { herb: 'mugwort' } },
    mistwell: { letter: ['Under the ice, a letter in a jar:', '“To the Moon. Please come back. — the children of Misthollow.”'], gift: { herb: 'nightrose' } },
  };
  // the story's scenes, by name
  const scenes = {
    prologue: [
      'Wickhollow. The longest night of the year is three nights off.',
      'Every year the moon has come back from it. This year, the stars have already gone out.',
      'In the cottage below the square, Io, the village witch, keeps a bundle of letters to the dead that she has never burned.',
      ['io', 'The lamps by the bridge are flickering. I should go up to the square.'],
    ],
    firstFight: [
      ['gretch', 'Io! Something came out of the Thornwood. The bridge lamps went out one by one.'],
      ['io', 'Stay by the Moonwell, Mayor. Lunara is still sleeping in it. She’ll keep it from you.'],
    ],
    firstLost: ['Io wakes in her own bed, aching. Up in the square, the bridge lamps are still dark.'],
    sol: [
      'Someone comes running over the bridge, a sword drawn and burning.',
      ['sol', 'Too late again. That one led me all the way from the Warm Roads.'],
      ['io', 'A Warden? I thought the Wardens were gone.'],
      ['sol', 'All but one. Sol, of Dawnroost. The Ember Line is going dark, and the dead are coming up out of the dark with it.'],
      ['io', 'I’m Io. I keep the Moonwell here, and the moths that come home to it.'],
      ['sol', 'Then you know what the wraiths are. Souls that died without a light.'],
      ['io', 'And there are more of them every night.'],
      ['sol', 'Something is calling them. On the longest night the dark is strongest, and whatever it is means to keep it.'],
      ['io', 'Then we go and find it. Together?'],
      ['sol', 'Together. Bogmire’s lamps went out three nights ago. That’s where the trail goes.'],
      'Sol joins the party.',
      ['gretch', 'Quill keeps his old skiff at the jetty, down the steps west of the square. Ask him. He’ll grumble, but he’ll help.'],
    ],
    magpie: [
      ['quill', 'The Magpie? She’s not flown in years. The sunstone in her keel’s gone cold.'],
      ['quill', '…But she’ll lift, for you. Not far, mind, and not into the dark. There’s nothing to land by in the fen with Bogmire’s lamps out.'],
      ['io', 'Then we’ll walk the Thornwood to Bogmire, and bring their lights back.'],
      ['quill', 'Bring ’em back and I’ll fly her over to you. Bogmire’s shipwrights could refit her, with sunstone enough.'],
      'The Thornwood road starts at the stone bridge east of the square.',
    ],
    thornwoodShut: [['io', 'Not alone, and not at night. Not into the Thornwood.']],
    bogmireDark: [
      'Bogmire. Not one lamp burns on the boardwalks. The townsfolk sit in the dark behind shut doors.',
      ['sol', 'Whatever took the lights, it took all of them.'],
    ],
    greatWraith: [
      ['sol', 'There. In the middle of the square, with Bogmire’s light inside it.'],
      ['io', 'It’s swallowed them. That’s a whole town’s lamplight.'],
    ],
    lights: [
      'Back in Bogmire every window is lit again.',
      ['tobb', 'Lights! Witch, Warden: you’ll never pay for a bed here again.'],
      ['quill', 'Saw the fen light up all the way from Wickhollow. The Magpie found her way by it. She’s tied up at the west dock.'],
    ],
    refit: [
      'Bogmire’s shipwrights fit warm sunstone into the Magpie’s keel.',
      'Io learns Harvest Moon: the full moon’s warmth poured into Sol, 70 Heat at once.',
      'The Magpie can fly the western forests now: the Warm Roads, and Dawnroost at the end of them.',
    ],
    warmRoads: [
      ['sol', 'The Warm Roads. The Ember Line runs under them, node to node, all the way to Dawnroost. It should be warm underfoot.'],
      ['io', 'It’s cold.'],
      ['sol', 'It’s cold. Dawnroost is north of here, through the forest.'],
    ],
    node: [['sol', 'A node, gone dark. Let me…'], 'Sol lays her hand on the stone, and her Heat runs into it. It glows again, faintly.', ['sol', 'It’ll hold a while.']],
    nodeLit: [['sol', 'It’s holding.']],
    dawnroostHome: [
      ['sol', 'Dawnroost. It’s quieter than I remember. There were forty Wardens in that hall.'],
      ['io', 'And now there’s you.'],
      ['sol', 'The living node is up through the north gate. If the wraiths have found it, there’s nothing left on the Line.'],
    ],
    dawnroost: [
      ['sol', 'The living node. It still burns: the last one on the Line.'],
      ['io', 'And the wraiths know it.'],
    ],
    charge: [
      'The living node’s light pours into the Magpie’s keel.',
      'The Magpie can fly the north now: the northern wilds, and the passage to the shipyard.',
    ],
    northern: [
      ['sol', 'Halcyon came north eight years ago. My teacher. She never came back.'],
      ['io', 'Maybe we’ll find out why.'],
      ['sol', 'The shipyard is up the north road. There’s an old crossroads on the way.'],
    ],
    halcyon: [],
    kestrel: [
      ['sol', 'It was her. Io, it was Halcyon. She knew me.'],
      ['io', 'She let us go.'],
      ['sol', 'She stopped. She looked at me, and she stopped.'],
      'Sol has learned Kestrel Stoop.',
    ],
    shipyard: [
      ['shipmaster', 'You met a knight on the road. Dark armor, a black blade, a black sun on the hilt?'],
      ['sol', 'Yes.'],
      ['shipmaster', 'That is the Starless’s mark. Noctara’s. The knight serves her.'],
      ['sol', 'No.'],
      ['io', 'Sol.'],
      ['sol', 'I heard. Halcyon serves Noctara.'],
      ['shipmaster', 'Noctara will be at Misthollow’s Moonwell on the longest night. It has gone dark already. If she eclipses the moon from there, the night won’t end.'],
      ['shipmaster', 'Your skiff can’t get over the peaks as she is. Bring me sunstone enough, and my gnomes will give her a moon-sail.'],
    ],
    upgrade2: [
      'Ysmera’s gnomes rig the Magpie with a moon-sail of Aurosi silk.',
      'The Magpie can fly the northeast peaks now, to Misthollow.',
    ],
    frozen: [['sol', 'Misthollow is up through the pass. The cold is coming from there.'], ['io', 'Then so is she.']],
    misthollow: [
      'Misthollow. The pale towers are dark, and frost grows on the Moonwell’s stair.',
      ['io', 'The Moonwell is at the top of the street. I can feel it from here. It’s like a hole in the night.'],
    ],
    finale: [],
    ending: [
      'The longest night ends. In the morning the moon is still in the sky, pale and full.',
      'In Wickhollow the Moonwell shines, and the moths come home to it.',
      ['sol', 'Halcyon’s blade was warm, at the end. She went home.'],
      ['io', 'Everyone goes home, in the end. That’s what the letters were for.'],
      ['sol', 'And yours?'],
      ['io', 'Sent. All of them. Even the ones at the wells.'],
      'THE END',
    ],
    noMagpie: [['io', 'The Magpie is moored at Wickhollow’s jetty.']],
    bogmireLanding: [['quill', 'Not to Bogmire, not till its lamps are lit. There’s nothing to land by.']],
  };
  window.SCRIPT = { people, wells, scenes, cast };
})();
