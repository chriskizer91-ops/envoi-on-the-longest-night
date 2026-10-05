// game.js: the game itself (plan phase 5), joining the pieces: the title, the ground maps (field.js), the world map
// (world.js), the dialogue box (talk.js), the battles (the battle screen in its game mode, with fights.js), the story's
// beats and words (script.js), the menus, the herb shops, the rests and the save (state.js), and the music: Chris's
// songs in the towns and the wilds (songs.js), his library from 20-min everywhere else (thareia-audio.js), and the
// battles' own theme (sound.js).
// The story runs on flags in the save: party (Sol has joined), magpie (Quill's skiff is Io's), lights (Bogmire's lamps
// are back), refit, envoi, charge, stoop, shipyard, upgrade2, ending. The highest band the Magpie can reach (st.band)
// opens the world map's bands; the rest lie under cold mist.
// Until the flying demo (plan step 19) is joined in, boarding the Magpie picks a landing and the flight is a short
// crossing of the night sky.
// Game.start({ host, src(path) -> URL, skipTitle, state, chapter }) -> the game (chapter: a CHAPTERS index, for a page
// that plays only that chapter: its title offers to begin it or carry on). Defines window.Game (with Game.arenaFor(cfg):
// what a fight's cutscene is given of its arena, below).
(function () {
  'use strict';
  function el(tag, attrs, parent, text) { const e = document.createElement(tag); if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]); if (text !== undefined) e.textContent = text; if (parent) parent.appendChild(e); return e; }
  const nf = (n) => Math.round(n).toLocaleString('en-US');
  const wait = (s) => new Promise((r) => setTimeout(r, s * 1000));
  // the world map's places: where each lies on the atlas, its band, where walking onto it leads, and where Io comes out
  const PLACES = {
    wickhollow: { name: 'Wickhollow', at: [1348, 1838], band: 1, map: 'cottage', arrive: [790, 990], out: [1348, 1880] },
    thornwood: { name: 'The Thornwood', at: [1530, 2160], band: 1, map: 'thornwood', arrive: [60, 456], dir: 'e', out: [1530, 2200] },
    bogmire: { name: 'Bogmire', at: [1752, 2512], band: 1, map: 'bogmire', arrive: [70, 368], dir: 'e', out: [1752, 2550] },
    warmCamp: { name: 'The Warm Roads camp', at: [820, 1560], band: 2, kind: 'camp', label: 'Camp' },
    node1: { name: 'An Ember Line node', at: [960, 1420], band: 2, kind: 'node', label: 'The node' },
    node2: { name: 'An Ember Line node', at: [1180, 1330], band: 2, kind: 'node', label: 'The node' },
    node3: { name: 'An Ember Line node', at: [760, 1250], band: 2, kind: 'node', label: 'The node' },
    dawnroost: { name: 'Dawnroost', at: [1325, 1098], band: 2, map: 'dawnroost', arrive: [645, 990], out: [1325, 1140] },
    northCamp: { name: 'The northern camp', at: [1150, 620], band: 3, kind: 'camp', label: 'Camp' },
    crossroads: { name: 'The northern crossroads', at: [1960, 820], band: 3, map: 'crossroads', arrive: [768, 990], out: [1960, 860] },
    shipyard: { name: 'The shipyard', at: [2097, 599], band: 3, map: 'shipyard', arrive: [760, 990], out: [2097, 640], need: (st) => st.flags.stoop },
    frozenCamp: { name: 'The frozen camp', at: [2760, 1120], band: 4, kind: 'camp', label: 'Camp' },
    frozenPass: { name: 'The frozen pass', at: [3270, 980], band: 4, map: 'frozen-pass', arrive: [790, 990], out: [3270, 1020] },
    misthollow: { name: 'Misthollow', at: [3500, 735], band: 4, map: 'misthollow', arrive: [768, 985], out: [3500, 780] },
  };
  // where the Magpie can land: a dock on a ground map, or a camp on the world map
  // (sky: where she docks on the flying map, in atlas pixels; Wickhollow's and Bogmire's are the world travel demo's)
  const LANDINGS = {
    wickhollow: { name: 'Wickhollow', band: 1, field: ['jetty', [768, 700]], sky: [1446, 1806] },
    bogmire: { name: 'Bogmire', band: 1, field: ['bogmire', [100, 372]], need: (st) => st.flags.lights, sky: [1886, 2462] },
    warmCamp: { name: 'The Warm Roads', band: 2, world: 'warmCamp', sky: [820, 1530] },
    dawnroost: { name: 'Dawnroost', band: 2, field: ['dawnroost', [1400, 330]], need: (st) => st.done['visit:dawnroost'], sky: [1365, 1085] },
    northCamp: { name: 'The northern wilds', band: 3, world: 'northCamp', sky: [1150, 590] },
    shipyard: { name: 'The shipyard', band: 3, field: ['shipyard', [764, 290]], need: (st) => st.done['visit:shipyard'], sky: [2097, 580] },
    frozenCamp: { name: 'The northeast peaks', band: 4, world: 'frozenCamp', sky: [2760, 1090] },
  };
  // the chapters: the start, and each gate with the party as the story leaves it there (story.js's path), for trying a
  // later part without playing up to it (Chris, October 3). Each starts just before its gate, in the town on its
  // doorstep (the crossroads' gate is the crossroads itself, so that one starts on its south road), with three of each
  // herb and the shards for the band's Magpie upgrade; the town's first-arrival scene plays, and losing wakes the
  // party at the town's rest. The last one starts at the foot of Misthollow, on the approach to the finale.
  const BEEN = ['first', 'visit:bogmire'];
  const CHAPTERS = [
    { name: 'The start' },
    { name: 'Gate 5: the great wraith', level: 5, band: 1, magpie: 'wickhollow', flags: ['party', 'magpie'], done: ['first'],
      where: ['bogmire', [70, 368], 'e'], rest: ['bogmire', [1208, 281]], shards: 650 },
    { name: 'Gate 10: Dawnroost', level: 10, band: 2, magpie: 'dawnroost', flags: ['party', 'magpie', 'lights', 'refit'],
      done: BEEN.concat('greatWraith', 'camp:warmCamp'), landings: ['bogmire', 'warmCamp', 'dawnroost'],
      where: ['dawnroost', [645, 990]], rest: ['dawnroost', [340, 447]], shards: 2300 },
    { name: 'Gate 15: Halcyon', level: 15, band: 3, magpie: 'northCamp', flags: ['party', 'magpie', 'lights', 'refit', 'envoi', 'charge'],
      done: BEEN.concat('greatWraith', 'visit:dawnroost', 'camp:warmCamp', 'dawnroost', 'camp:northCamp'), landings: ['bogmire', 'warmCamp', 'dawnroost', 'northCamp'],
      where: ['crossroads', [768, 990]], rest: ['crossroads', [768, 990]], shards: 4500 },
    { name: 'The approach to the finale', level: 20, band: 4, magpie: 'frozenCamp', flags: ['party', 'magpie', 'lights', 'refit', 'envoi', 'charge', 'stoop', 'shipyard', 'upgrade2'],
      done: BEEN.concat('greatWraith', 'visit:dawnroost', 'camp:warmCamp', 'dawnroost', 'camp:northCamp', 'halcyon', 'visit:shipyard', 'camp:frozenCamp', 'visit:frozen-pass'),
      landings: ['bogmire', 'warmCamp', 'dawnroost', 'northCamp', 'shipyard', 'frozenCamp'], wilds: { 4: 5 },
      where: ['misthollow', [768, 985]], rest: ['misthollow', [1000, 662]], shards: 300 },
  ];
  const RLs = () => window.BattleRules;
  function chapterState(c) {
    const st = GameState.fresh();
    if (!c.level) return st;
    st.level = c.level; st.band = c.band; st.magpie = c.magpie; st.shards = c.shards;
    for (const f of c.flags) st.flags[f] = true;
    for (const d of c.done) st.done[d] = true;
    for (const l of c.landings || []) st.landings[l] = true;
    if (c.wilds) st.wilds = Object.assign({}, c.wilds);
    st.herbs = Object.fromEntries(Object.keys(RLs().HERBS).map((id) => [id, RLs().START_HERBS]));
    st.where = { mode: 'field', map: c.where[0], at: c.where[1], dir: c.where[2] || 'n' };
    st.rest = { mode: 'field', map: c.rest[0], at: c.rest[1] };
    return st;
  }
  // the Magpie's upgrades (rules.js MAGPIE), who makes them, the story flag each sets, and where she's moored after it:
  // each is fitted to her where it's made (the scenes: sunstone in her keel at Bogmire, the node's light into it at
  // Dawnroost, her moon-sail on Ysmera's slip)
  const UPGRADES = [
    { flag: 'refit', who: 'quill', after: 'lights', scene: 'refit', moor: 'bogmire' },
    { flag: 'charge', who: 'brann', after: 'envoi', scene: 'charge', moor: 'dawnroost' },
    { flag: 'upgrade2', who: 'ysmera', after: 'shipyard', scene: 'upgrade2', moor: 'shipyard' },
  ];
  // each place's ambience (handoff, section 8): the library's sounds, each now and then, quietly: [sound, every so many
  // seconds (from, to), how loud]
  const AMBIENCE = {
    cottage: [['crickets', 6, 12, 0.3], ['owl', 14, 30, 0.25]],
    wickhollow: [['crickets', 7, 14, 0.25], ['clock', 20, 40, 0.2], ['dog', 25, 60, 0.15]],
    jetty: [['river', 6, 10, 0.35], ['rope-creak', 9, 18, 0.25], ['crickets', 10, 16, 0.2]],
    thornwood: [['crickets', 5, 10, 0.3], ['owl', 12, 26, 0.25], ['leaves', 9, 18, 0.25]],
    bogmire: [['frog', 4, 9, 0.3], ['crickets', 7, 13, 0.22], ['cave-drip', 8, 16, 0.2]],
    'bogmire-heart': [['frog', 5, 10, 0.25], ['bats', 12, 24, 0.22], ['cave-drip', 6, 12, 0.22]],
    dawnroost: [['anvil', 5, 9, 0.28], ['campfire', 7, 12, 0.22], ['crickets', 10, 18, 0.18]],
    'dawnroost-node': [['vein-pulse', 6, 11, 0.25], ['campfire', 8, 14, 0.2]],
    crossroads: [['wind', 7, 13, 0.25], ['owl', 14, 28, 0.22]],
    shipyard: [['hammer-wood', 5, 10, 0.25], ['rope-creak', 8, 15, 0.22], ['sea', 9, 16, 0.25]],
    'frozen-pass': [['wind', 5, 9, 0.32], ['blizzard', 12, 22, 0.2]],
    misthollow: [['wind', 6, 11, 0.25], ['bell', 25, 50, 0.15], ['owl', 16, 30, 0.2]],
    moonwell: [['wind', 6, 11, 0.25]],
    world: [['wind', 8, 15, 0.2], ['crickets', 10, 18, 0.18]],
  };
  const MUSIC = { cottage: 'title', wickhollow: 'town', jetty: 'town', thornwood: 'travel', bogmire: 'marsh', 'bogmire-heart': 'ruins', dawnroost: 'town', 'dawnroost-node': 'ruins', crossroads: 'travel', shipyard: 'town', 'frozen-pass': 'travel', misthollow: 'ruins', moonwell: 'ruins' };
  // the night atlas in nine tiles (the build inlines each path)
  const TILES = { '00': "art/world/night-00.webp", '01': "art/world/night-01.webp", '02': "art/world/night-02.webp", '10': "art/world/night-10.webp", '11': "art/world/night-11.webp", '12': "art/world/night-12.webp", '20': "art/world/night-20.webp", '21': "art/world/night-21.webp", '22': "art/world/night-22.webp" };
  // the regions' names on Chris's D&D map (design decisions, place names)
  const REGION = { 2: 'The Verdant Wilds', 3: 'The northern wilds', 4: 'The Ironspire Peaks' };

  // a fight in its arena (the new battles, cfg.arena), for its cutscene to end on the fight's opening frame there: the
  // arena's locked camera, its frame and pixels a metre (src/fx/arena.js), and where everyone stands in it, in metres,
  // with their heights and how the battle turns them. Nothing for a fight on its flat painting, whose frame each
  // cutscene works out itself (each cutscene's README, "The hand-over"). Each cutscene's tools/check.mjs asks it too
  // (Game.arenaFor), so it checks what the game gives
  function arenaFor(cfg) {
    const P = cfg.arena && window.ARENAS && window.ARENAS[cfg.arena], AV = window.makeArenaField && window.makeArenaField.view;
    if (!P || !AV || !cfg.fight) return null;
    const look = (id) => (cfg.foeLook && cfg.foeLook[id]) || {}, foes = (cfg.fight().foes || []).slice(0, cfg.slots.length);
    return Object.assign(AV(P), {
      heroes: cfg.heroes.map((h) => ({ id: h.id, at: h.home.slice(), tall: h.tall, yawBias: h.yawBias })),
      foes: foes.map((f, i) => ({ id: f.id, at: cfg.slots[i].slice(), tall: look(f.id).tall, halfW: look(f.id).halfW || 0, yawBias: look(f.id).yawBias })),
    });
  }

  function start(opts) {
    opts = opts || {};
    const src = opts.src || ((p) => p);
    const RL = window.BattleRules, GS = window.GameState, S = window.SCRIPT, MAPS = window.MAPS, AUD = window.ThareiaAudio, K = window.Keepsakes;
    const host = opts.host || document.body;
    const root = el('div', { class: 'game' }, host);
    const fieldHost = el('div', { class: 'layer' }, root), worldHost = el('div', { class: 'layer' }, root);
    let st = opts.state || GS.fresh();
    // music, effects and amb (the places' own sounds: crickets, wind, water): 0 (off) to 1; text: how fast the words
    // come (0 for all at once); big: larger text
    const settings = { rate: 1, light: 1, music: 0.75, sfx: 0.75, amb: 0.75, text: 1, big: false };
    let kept = {};
    try { kept = JSON.parse(localStorage.getItem('envoi.settings') || '{}') || {}; } catch (e) { /* defaults */ }
    Object.assign(settings, kept);
    if (settings.sound) { if (settings.sound === 'off') settings.music = settings.sfx = 0; else if (settings.sound === 'music') settings.music = 0; delete settings.sound; }
    // the places' sounds followed the effects' volume until they had one of their own (October 4)
    if (kept.amb == null && (kept.sfx != null || kept.sound)) settings.amb = settings.sfx;
    root.classList.toggle('big-text', !!settings.big);
    const keepSettings = () => { try { localStorage.setItem('envoi.settings', JSON.stringify(settings)); } catch (e) { /* not kept */ } };
    let mode = 'title', busy = 0;

    // ---------- sound ----------
    let audioOn = false, curMusic = null;
    const SND = window.makeBattleSound();
    // Chris's songs (songs.js) in the towns and the wilds; the fights keep their own theme. Where a song can't play, the
    // made-up music plays instead
    const SONG = { town: 'town', travel: 'wilds' };
    const songs = window.Songs.create({ src, ctx: () => AUD.sfxContext(), onFail: () => { const m = curMusic; curMusic = null; music(m); } });
    function audioInit() { if (audioOn) return; audioOn = true; try { AUD.sfxInit(); SND.init(); applySound(); } catch (e) { /* no audio */ } }
    // the music's, the effects' and the places' volumes, each from off to loud, on the maps and in the battles alike
    function applySound() {
      try {
        AUD.setVolume(settings.music, settings.sfx, settings.amb); SND.setVolumes(settings.music, settings.sfx); songs.setVolume(settings.music);
        SND.setMuted(!settings.music && !settings.sfx); SND.setMusicOff(!settings.music); if (!settings.music) { AUD.musicStop(0.4); songs.stop(0.4); }
      } catch (e) { /* no audio */ }
    }
    function music(id) {
      if (!audioOn || !settings.music) { curMusic = id; return; }
      const song = id && SONG[id] && songs.has(SONG[id]) ? SONG[id] : null;
      if (curMusic === id && (song ? songs.playing() === song : AUD.musicPlaying() === id)) return;
      curMusic = id;
      try {
        if (song) { AUD.musicStop(0.6); songs.play(song); } else { songs.stop(0.6); if (id) AUD.musicPlay(id); else AUD.musicStop(0.6); }
      } catch (e) { /* no audio */ }
    }
    function sfx(id, gain) { if (!audioOn || !settings.sfx) return; try { AUD.playSfx(id, undefined, gain); } catch (e) { /* no audio */ } }
    function amb(id, gain) { if (!audioOn || !settings.amb) return; try { AUD.playSfx(id, undefined, gain, 'amb'); } catch (e) { /* no audio */ } }
    // the place's ambience: each of its sounds comes back now and then, while Io is walking there
    const ambNext = {};
    setInterval(() => {
      if (!audioOn || !settings.amb || busy || document.hidden) return;
      const id = mode === 'field' ? field.map && field.map.id : mode === 'world' ? 'world' : null, list = id && AMBIENCE[id];
      if (!list) return;
      const now = performance.now() / 1000;
      for (const [snd, a, b, v] of list) {
        const k = id + ':' + snd;
        if (ambNext[k] == null) ambNext[k] = now + a * Math.random();
        else if (now >= ambNext[k]) { ambNext[k] = now + a + Math.random() * (b - a); amb(snd, v); }
      }
    }, 500);

    // ---------- the people's portraits and the dialogue box ----------
    // the painted portraits (art request 05, and stills.js's as they come); everyone else with a paper doll shows its
    // head and shoulders (walkers.js) until their painting comes (Chris, October 3)
    const castName = (id) => (S.cast[id] ? S.cast[id].name : id);
    const talk = Talk.create(root, {
      portraits: Object.assign(
        Object.fromEntries(Object.entries(window.WALKERS || {}).filter(([, w]) => w.portrait).map(([id, w]) => [id, { name: castName(id), src: w.portrait }])),
        { io: { name: 'Io', src: "art/portraits/portrait-io.webp" }, sol: { name: 'Sol', src: "art/portraits/portrait-sol.webp" }, shipmaster: { name: 'Ysmera Brightkeel', src: "art/portraits/portrait-shipmaster-a.webp" } },
        Object.fromEntries(Object.entries(window.PORTRAITS || {}).map(([id, p]) => [id, { name: castName(id), src: p }]))),
      people: (id) => S.cast[id] || null, src, speed: () => settings.text,
    });
    const toast = el('div', { class: 'toast win', hidden: '' }, root);
    let toastT = 0;
    function note(text) { toast.textContent = text; toast.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { toast.hidden = true; }, 2600); }
    const fade = el('div', { class: 'fade' }, root);
    async function fadeTo(on, s) { fade.style.transition = 'opacity ' + (s || 0.35) + 's'; fade.classList.toggle('on', on); await wait(s || 0.35); }

    // ---------- the ground maps ----------
    // Io walks as Path Polish paints her (src/walk/painted-io.js): 52 map px tall, her height 15% of the screen's shorter
    // side, at 1.7 of her heights a second (Chris's settings on the Io on Foot page, October 3); the pixel Io stands in
    // until the painting loads
    const paintedIo = makePaintedIo(src);
    // everyone else as painted paper dolls (art request 08), in the same style, at Io's scale
    const paintedFolk = makePaintedFolk(src);
    const field = Field.create(fieldHost, {
      maps: MAPS, src, speed: 110, zoom: 0.7, ioH: 52, paintedIo, paintedFolk, pace: 1.7, ioScreen: 0.15,
      encounter: { get mean() { return 770 / settings.rate; }, get min() { return 440 / settings.rate; } },
      light: (m) => settings.light * (m.id === 'bogmire' && !st.flags.lights ? 0.55 : m.id === 'bogmire-heart' && !st.flags.lights ? 0.8 : 1),
      isDone: (k) => !!st.done[k],
      glint: () => K.party(st).glint, // the Bogmire Hag-Stone: hidden things glint brighter
      onExit: (ex) => act(() => onExit(ex)), onEvent: (s) => act(() => onEvent(s)), onTalk: (p) => act(() => onTalk(p)),
      onSpot: (s) => act(() => onSpot(s)), onEncounter: (m) => act(() => wild(m.wild.band, m.wild.scene)), onMenu: () => act(menu),
      goal: (id) => goalOn(id),
    });
    // ---------- the world map ----------
    const world = World.create(worldHost, {
      tiles: (r, c) => src(TILES[r + '' + c]), speed: 45, zoom: 2, paintedIo,
      encounter: { get mean() { return 330 / settings.rate; }, get min() { return 190 / settings.rate; } },
      places: Object.fromEntries(Object.entries(PLACES).map(([id, p]) => [id, Object.assign({}, p, { hidden: () => (p.need && !p.need(st)) || (p.kind === 'node' && st.done[id]) })])),
      open: (b) => b <= st.band,
      magpie: () => magpieOnWorld(), goal: () => goalOnWorld(),
      regionName: (x, y, b) => (b === 1 ? (x < 1600 && y < 2250 ? 'The Gloamwood' : 'The Gloomfen') : REGION[b] || 'Aethermoor'),
      onEnter: (id) => act(() => enterPlace(id)), onEncounter: (b) => act(() => wild(b, GameFights.WILD_SCENE[b])),
      onMagpie: () => act(board), onMenu: () => act(menu),
    });
    // the people who come and go with the story, and the Magpie where it's moored
    function setupMaps() {
      const extra = {
        bogmire: { people: [{ id: 'quill', name: 'Quill', at: [190, 560], look: 'sailor', when: () => st.flags.lights }], spots: [{ kind: 'magpie', at: [84, 352], label: 'The Magpie', note: 'Tied up at the west dock.' }] },
        wickhollow: { spots: [{ kind: 'event', id: 'first', rect: [560, 450, 1075, 690], once: 'first' }] },
      };
      for (const id in extra) { const m = MAPS[id]; if (m._extra) continue; m._extra = true; m.people = (m.people || []).concat(extra[id].people || []); m.spots = (m.spots || []).concat(extra[id].spots || []); }
      // the keepsakes that lie on the maps, where items.js puts them (Chris's places), each a faint glint
      for (const it of K.list()) {
        const m = it.home && it.at && MAPS[it.home];
        if (m && !(m.spots || []).some((s) => s.kind === 'keepsake' && s.id === it.id)) m.spots = (m.spots || []).concat({ kind: 'keepsake', id: it.id, at: it.at, label: 'Something glinting' });
      }
      for (const id in MAPS) {
        const m = MAPS[id]; m.people0 = m.people0 || m.people || [];
        for (const s of m.spots || []) {
          if (s.kind === 'magpie') s.hide = () => !(st.magpie && LANDINGS[st.magpie].field && LANDINGS[st.magpie].field[0] === id);
          // a keepsake is gone once found, and one whose gate isn't won yet (items.js after) isn't there yet
          if (s.kind === 'keepsake') { const it = K.get(s.id); s.hide = () => K.found(st, s.id) || !!(it && it.after && !st.done[it.after]); }
        }
      }
      MAPS.jetty.people0.forEach((p) => { if (p.id === 'quill') p.when = () => !st.flags.lights; });
    }
    setupMaps();
    const peopleFor = (m) => m.people0.filter((p) => !p.when || p.when());

    // ---------- the next step, where the little arrow points (goal-arrow.js; Chris, October 3) ----------
    // What the story wants next, read from the save: a person to talk to, a place to walk into, or the Magpie to board
    function nextStep() {
      const F = st.flags, D = st.done;
      if (!D.first) return { map: 'wickhollow', event: 'first' };
      if (!F.magpie) return { map: 'jetty', person: 'quill' };
      if (!D.greatWraith) return { map: 'bogmire-heart', event: 'greatWraith' };
      if (!F.refit) return { map: 'bogmire', person: 'quill' };
      if (!D['camp:warmCamp'] && !D['visit:dawnroost']) return { magpie: true };
      if (!D.dawnroost) return { map: 'dawnroost-node', event: 'dawnroost' };
      if (!F.charge) return { map: 'dawnroost', person: 'brann' };
      if (!D['camp:northCamp'] && !D.halcyon) return { magpie: true };
      if (!D.halcyon) return { map: 'crossroads', event: 'halcyon' };
      if (!F.upgrade2) return { map: 'shipyard', person: 'ysmera' };
      if (!D['camp:frozenCamp'] && !D['visit:frozen-pass']) return { magpie: true };
      if (!D.finale) return { map: 'moonwell', event: 'finale' };
      return null;
    }
    // the roads on foot between the ground maps: from map `from`, the first exit on the shortest way to a map that
    // passes test(id), or null when none does
    function wayOut(from, test) {
      const first = new Map([[from, null]]), q = [from];
      for (let h = 0; h < q.length; h++) {
        for (const ex of MAPS[q[h]].exits || []) {
          if (ex.to === 'world' || first.has(ex.to) || !MAPS[ex.to]) continue;
          const f = first.get(q[h]) || ex; first.set(ex.to, f);
          if (test(ex.to)) return f;
          q.push(ex.to);
        }
      }
      return null;
    }
    // an exit as the arrow's goal: a little inside it, pointing out through it
    function exitMark(ex) {
      const r = ex.rect, edge = [[r[0], -1, 0], [1536 - r[2], 1, 0], [r[1], 0, -1], [1024 - r[3], 0, 1]].sort((a, b) => a[0] - b[0])[0];
      return { x: (r[0] + r[2]) / 2 - edge[1] * 30, y: (r[1] + r[3]) / 2 - edge[2] * 30, kind: 'exit', out: Math.atan2(edge[2], edge[1]) };
    }
    // the step's person, event or Magpie on the map Io is on
    function markOn(id, s) {
      const m = MAPS[id];
      if (s.person) { const p = (m.people || []).find((n) => n.id === s.person && !n.hidden); return p ? { x: p.at[0], y: p.at[1], kind: 'person' } : null; }
      if (s.event) { const e = (m.spots || []).find((x) => x.kind === 'event' && x.id === s.event); return e ? { x: (e.rect[0] + e.rect[2]) / 2, y: (e.rect[1] + e.rect[3]) / 2, kind: 'event' } : null; }
      const sp = (m.spots || []).find((x) => x.kind === 'magpie' && !(x.hide && x.hide())); return sp ? { x: sp.at[0], y: sp.at[1], kind: 'spot' } : null;
    }
    const magpieMap = () => { const L = st.magpie && LANDINGS[st.magpie]; return L && L.field ? L.field[0] : null; };
    // on a ground map: the step itself when it's here; else the way there on foot; with no road there, the Magpie when
    // she's moored on this side; else the way out to the world map
    function goalOn(id) {
      const s = nextStep(); if (!s || !MAPS[id]) return null;
      const mag = magpieMap(), to = s.magpie ? mag : s.map;
      if (to === id) return markOn(id, s);
      let ex = to && wayOut(id, (m) => m === to);
      if (!ex && !s.magpie && mag) { if (mag === id) return markOn(id, { magpie: true }); ex = wayOut(id, (m) => m === mag); }
      if (ex) return exitMark(ex);
      const out = (MAPS[id].exits || []).filter((e) => e.to === 'world'), P = field.P;
      const d = (e) => Math.hypot((e.rect[0] + e.rect[2]) / 2 - P.x, (e.rect[1] + e.rect[3]) / 2 - P.y);
      if (out.length) return exitMark(out.reduce((a, b) => (d(b) < d(a) ? b : a)));
      ex = wayOut(id, (m) => (MAPS[m].exits || []).some((e) => e.to === 'world'));
      return ex ? exitMark(ex) : null;
    }
    // where the Magpie sits on the world map when she's moored at a camp
    const magpieOnWorld = () => { const L = st.magpie && LANDINGS[st.magpie]; return L && L.world ? PLACES[L.world].at.map((v, i) => v + (i ? -26 : 34)) : null; };
    // on the world map: the Magpie at her camp; else the place that opens onto the step's own map; else the nearest open
    // place that leads to it on foot
    function goalOnWorld() {
      const s = nextStep(); if (!s) return null;
      if (s.magpie && magpieOnWorld()) return magpieOnWorld();
      const to = s.magpie ? magpieMap() : s.map; if (!to) return null;
      let best = null, bd = Infinity;
      for (const id in PLACES) {
        const p = PLACES[id];
        if (!p.map || p.band > st.band || (p.need && !p.need(st)) || (p.map !== to && !wayOut(p.map, (m) => m === to))) continue;
        const dd = (p.map === to ? 0 : 1e6) + Math.hypot(p.at[0] - world.P.x, p.at[1] - world.P.y); if (dd < bd) { bd = dd; best = p.at; }
      }
      return best;
    }

    // ---------- running one thing at a time ----------
    function pauseAll() { field.pause(); world.pause(); }
    function resumeAll() { if (busy) return; if (mode === 'field') field.resume(); else if (mode === 'world') world.resume(); }
    async function act(fn) {
      if (busy && fn !== menu) return; busy++; pauseAll();
      try { await fn(); } catch (e) { console.error(e); } finally { busy--; resumeAll(); }
    }
    const say = (lines) => (lines && lines.length ? talk.say(lines) : Promise.resolve());
    // a story scene: its still (stills.js) behind the words when it has one; else the map behind them, with the scene's
    // people walking on it (script.js: a line that is an object is a stage direction)
    const isLine = (x) => typeof x === 'string' || Array.isArray(x);
    async function scene(id) {
      const still = (window.STILLS || {})[id];
      if (!still) return stagePlay(S.scenes[id]);
      const card = el('div', { class: 'prologue' }, root); const img = el('img', { alt: '' }, card); img.src = src(still);
      await wait(0.1); card.classList.add('on'); await wait(0.8);
      await say((S.scenes[id] || []).filter(isLine));
      card.classList.add('out'); await wait(0.6); card.remove();
    }
    // the scene player (handoff, section 5): words, and between them the people who walk, stop and turn on the map.
    // A direction: { map } (only on that map), { add: id, look, at, dir }, { walk: id, path, speed, wait },
    // { io: path, speed }, { face: id or 'io', dir or to }, { focus: point, id, 'io' or null }, { wait: seconds },
    // { until: id } (her walk ends), { remove: id }, { person: id, hide }, { keep: true } (the actors stay afterwards). A point is [x, y] on the map, 'io', an
    // actor's id, or { near: 'io' or an id, dx, dy }. Off the field (a still, the world map) only the words play
    async function stagePlay(lines) {
      if (!lines || !lines.length) return;
      const F = field.stage, walks = {};
      let batch = [], staged = false, keep = false;
      const flush = async () => { if (batch.length) { const b = batch; batch = []; await say(b); } };
      const posOf = (who) => (who === 'io' ? [field.P.x, field.P.y] : (() => { const a = F.actor(who); return a ? [a.x, a.y] : null; })());
      const pt = (p) => { if (Array.isArray(p)) return p; if (typeof p === 'string') return posOf(p); if (p && p.near) { const b = posOf(p.near); return b ? [b[0] + (p.dx || 0), b[1] + (p.dy || 0)] : null; } return null; };
      const dirTo = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1]; return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'e' : 'w') : (dy > 0 ? 's' : 'n'); };
      for (const ln of lines) {
        if (isLine(ln)) { batch.push(ln); continue; }
        if (mode !== 'field' || !field.map || (ln.map && ln.map !== field.map.id)) continue;
        await flush(); staged = true;
        if (ln.person) F.hidePerson(ln.person, ln.hide !== false);
        if (ln.add) F.add(ln.add, ln.look, pt(ln.at), ln.dir);
        if (ln.walk) { const path = ln.path.map(pt).filter(Boolean); const w = walks[ln.walk] = F.walk(ln.walk, path, ln.speed); if (ln.wait !== false) await w; }
        if (ln.io) await F.io(ln.io.map(pt).filter(Boolean), ln.speed);
        if (ln.face) { const me = posOf(ln.face), d = ln.dir || (me && pt(ln.to) ? dirTo(me, pt(ln.to)) : null); if (d) { if (ln.face === 'io') F.ioFace(d); else F.face(ln.face, d); } }
        if ('focus' in ln) F.focus(ln.focus ? (ln.focus.on || pt(ln.focus)) : null); // { on: id } follows an actor
        if (ln.until && walks[ln.until]) await walks[ln.until];
        if (ln.remove) F.remove(ln.remove);
        if (ln.keep) keep = true; // the actors stay on the map after the words (the knight, until the fight)
        if (typeof ln.wait === 'number' && !ln.walk) await wait(ln.wait);
      }
      await flush();
      if (staged && !keep) F.clear();
    }
    async function ask(who, text, choices) { return talk.ask(who, text, choices); }
    function save() { st.where = mode === 'world' ? { mode: 'world', at: [Math.round(world.P.x), Math.round(world.P.y)], dir: world.P.dir } : { mode: 'field', map: field.map && field.map.id, at: [Math.round(field.P.x), Math.round(field.P.y)], dir: field.P.dir }; GS.save(st); }

    // ---------- moving between maps ----------
    async function goField(id, at, dir, quiet) {
      if (!quiet) await fadeTo(true, 0.3);
      mode = 'field'; world.show(false); field.show(true);
      const m = MAPS[id]; m.people = peopleFor(m);
      await field.load(id, at, dir);
      music(MUSIC[id] || 'travel'); save();
      await fadeTo(false, 0.3);
      await arrive(id);
    }
    async function goWorld(x, y, dir) {
      await fadeTo(true, 0.3);
      mode = 'world'; field.show(false); world.show(true); world.place(x, y, dir || 's');
      music('travel'); save();
      await fadeTo(false, 0.3);
    }
    // a scene the first time a place is reached
    async function arrive(id) {
      const first = !st.done['visit:' + id]; st.done['visit:' + id] = true;
      if (!first) return;
      if (id === 'bogmire' && !st.flags.lights) await scene('bogmireDark');
      else if (id === 'dawnroost') await scene('dawnroostHome');
      else if (id === 'frozen-pass') await scene('frozen');
      else if (id === 'misthollow') await scene('misthollow');
      else if (id === 'shipyard') { await scene('shipyard'); st.flags.shipyard = true; }
      save();
    }
    async function onExit(ex) {
      if (ex.to === 'thornwood' && field.map.id === 'wickhollow' && !st.flags.party) { await scene('thornwoodShut'); stepBack(ex); return; }
      if (ex.to === 'world' && !st.flags.party) { await say([['io', 'Something is wrong up in the square. I should go and see first.']]); stepBack(ex); return; }
      if (ex.to === 'world') { const p = PLACES[ex.at]; await goWorld(p.out[0], p.out[1], 's'); return; }
      await goField(ex.to, ex.at);
    }
    function stepBack(ex) { const r = ex.rect, cx = (r[0] + r[2]) / 2, cy = (r[1] + r[3]) / 2; const dx = 768 - cx, dy = 512 - cy, L = Math.hypot(dx, dy) || 1; field.P.x += dx / L * 30; field.P.y += dy / L * 30; }
    async function enterPlace(id) {
      const p = PLACES[id];
      if (p.kind === 'camp') { await camp(id); return; }
      if (p.kind === 'node') { if (!st.done[id]) { await scene('node'); st.done[id] = true; const sh = 150 * p.band; st.shards += sh; sfx('node-wake'); await say(['The node’s warmth gives back a little sunstone: ' + sh + ' shards.']); save(); } return; }
      await goField(p.map, p.arrive, p.dir || 'n');
    }

    // ---------- the story's events and set fights ----------
    async function onEvent(s) {
      const id = s.id;
      if (id === 'first') {
        await scene('firstFight');
        const r = await battle('first');
        if (r.outcome === 'win') { st.done.first = true; await scene('sol'); st.flags.party = true; save(); }
        else { await wake('firstLost'); }
        return;
      }
      if (id === 'greatWraith') {
        await scene('greatWraith');
        const r = await battle('greatWraith');
        // Quill flies the Magpie over by the fen's new light: she's tied up at the west dock (the lights scene)
        if (r.outcome === 'win') { st.done.greatWraith = true; st.flags.lights = true; st.magpie = 'bogmire'; await goField('bogmire', [1212, 296], 's'); await scene('lights'); save(); }
        else await wake();
        return;
      }
      if (id === 'dawnroost') {
        await scene('dawnroost');
        const r = await battle('dawnroost');
        if (r.outcome === 'win') { st.done.dawnroost = true; st.flags.envoi = true; save(); await say([['sol', 'Brann will know how to bring the node’s light down to the Magpie. He’s in the forge, below.']]); }
        else await wake();
        return;
      }
      if (id === 'halcyon') {
        await scene('ambush');
        const r = await battle('halcyon');
        field.stage.clear();
        st.done.halcyon = true; st.flags.stoop = true; await scene('kestrel');
        // whichever way it ended, the party gets its breath back by the crossroads well
        GS.restore(st); await say(['The party rests by the crossroads well until their hands stop shaking.']); save();
        return;
      }
      if (id === 'finale') {
        const r = await battle('finale');
        if (r.outcome === 'win') { st.done.finale = true; st.flags.ending = true; save(); await ending(); }
        else await wake();
      }
    }
    // a lost fight: the party wakes at its last rest with everything it had before the fight
    async function wake(sceneId) {
      GS.restore(st); st.herbs = Object.assign({}, preHerbs);
      const R = st.rest;
      if (R.mode === 'world') await goWorld(R.at[0], R.at[1]); else await goField(R.map, R.at, 's');
      if (sceneId) await scene(sceneId); else await say(['The party wakes at the last place it rested, with everything it had.']);
      save();
    }

    // ---------- talking and using things ----------
    async function onTalk(p) {
      const lines = (S.people[p.id] || (() => [[p.id, '…']]))(st);
      // Quill gives Io the Magpie once Sol has joined
      if (p.id === 'quill' && st.flags.party && !st.flags.magpie) { await scene('magpie'); st.flags.magpie = true; st.magpie = 'wickhollow'; save(); return; }
      await say(lines);
      await gift(p);
      for (const U of UPGRADES) if (U.who === p.id && st.flags[U.after] && !st.flags[U.flag]) { await upgrade(U); break; }
      if (p.role === 'shop') await shop(p);
      else if (p.role === 'inn') await rest(p.name);
    }
    async function onSpot(s) {
      if (s.kind === 'rest') { await say([s.note]); await rest(s.label); return; }
      if (s.kind === 'look') { await say([s.note]); return; }
      if (s.kind === 'magpie') { await board(); return; }
      if (s.kind === 'keepsake') { await keepsake(s.id); return; }
      if (s.kind === 'well') {
        const W = S.wells[s.id];
        if (st.done['well:' + s.id] || !W) { await say(['The water lies still and dark.']); return; }
        await field.pose('kneel', 1.9); // she kneels for what was left there
        await say(W.letter.concat(W.sol ? [['sol', W.sol]] : []));
        st.done['well:' + s.id] = true;
        const g = W.gift;
        if (g.herb) {
          const H = RL.HERBS[g.herb];
          if ((st.herbs[g.herb] || 0) < RL.CARRY) { st.herbs[g.herb] = (st.herbs[g.herb] || 0) + 1; sfx('chest'); await say(['Left with it: a ' + H.name + '. Io takes it, and keeps the letter to send with hers.']); }
          else { const sh = RL.herbPrice(g.herb, bandHere()); st.shards += sh; sfx('coins'); await say(['Left with it: a ' + H.name + ', but Io can’t carry another. She trades it on for ' + sh + ' shards, and keeps the letter to send with hers.']); }
        } else if (g.shards) { st.shards += g.shards; sfx('coins'); await say(['Left with it: ' + g.shards + ' sunstone shards. Io keeps the letter to send with hers.']); }
        st.letters = (st.letters || 0) + 1; save();
      }
    }
    // ---------- the keepsakes (keepsakes.js; Chris, October 4) ----------
    // one that lies on a map: she kneels for it, its words, then its card
    async function keepsake(id) {
      const it = K.get(id);
      if (!it || K.found(st, id)) return;
      await field.pose('kneel', 1.9);
      sfx('secret');
      await say(S.keepsakes[id] || ['Something glinting: ' + it.look + '.']);
      await gainKeepsake(id);
    }
    // a keepsake comes to the party: its hero puts it on at once (the Items page changes that), it's saved, and its card
    // shows
    async function gainKeepsake(id) {
      if (!K.give(st, id)) return;
      GS.fit(st); save();
      await K.showFound(root, st, id, { src });
    }
    // the townsfolk's gifts, once each: Nettie's as Io sets out with Sol, Ysmera's once her yard has met them, Marta's
    // and Ede's the first time they're spoken to
    const GIFT_WHEN = { nettie: (F) => !!F.party, marta: () => true, ysmera: (F) => !!F.shipyard, ede: () => true };
    async function gift(p) {
      const it = K.list().find((x) => x.source === 'gift' && x.giver === p.id);
      if (!it || K.found(st, it.id) || !GIFT_WHEN[p.id] || !GIFT_WHEN[p.id](st.flags)) return;
      sfx('secret'); await say(S.gifts[p.id]); await gainKeepsake(it.id);
    }
    // the first Bramble Colossus the party beats leaves a keepsake for each of them
    async function colossusGifts() {
      const ids = K.list().filter((x) => x.source === 'fight' && !K.found(st, x.id)).map((x) => x.id);
      if (!ids.length) return;
      sfx('secret'); await say(S.colossusGifts);
      for (const id of ids) await gainKeepsake(id);
    }
    // after a fight that wasn't lost, the keepsakes that work outside fights: a share of HP and MP back, and more shards
    // from a win (added before the win is counted, so a level up takes them in)
    function moreShards(r) {
      const more = r.outcome === 'win' || r.outcome === 'retreat' ? Math.round((r.shards || 0) * K.party(st).shards / 100) : 0;
      if (more > 0) { r.shards += more; r.keepsakeShards = more; }
    }
    function backAfter(r) {
      if (r.outcome !== 'win' && r.outcome !== 'retreat' && r.outcome !== 'fled') return;
      for (const id of heroes()) {
        const g = GS.gearOf(st, id), max = GS.maxHp(st, id), hp = GS.hpOf(st, id);
        if (g.hpBack && hp > 0) st.hp[id] = Math.min(max, hp + Math.round(max * g.hpBack / 100));
      }
      const gi = GS.gearOf(st, 'io');
      if (gi.mpBack) st.mp = Math.min(GS.maxMp(st), GS.mpOf(st) + Math.round(GS.maxMp(st) * gi.mpBack / 100));
      GS.fit(st);
    }
    const bandHere = () => (mode === 'world' ? world.bandAt(world.P.x, world.P.y) || 1 : (field.map && field.map.band) || 1);
    async function rest(name) {
      const i = await ask(null, 'Rest here? HP and MP come back, and the game is saved.', ['Rest', 'Not now']);
      if (i) return;
      if (mode === 'field' && /Moonwell/.test(name)) await field.pose('cast', 2.1); // at a Moonwell she casts moonlight into it
      await fadeTo(true, 0.6); sfx('hearthfire'); GS.restore(st);
      st.rest = mode === 'world' ? { mode: 'world', at: [Math.round(world.P.x), Math.round(world.P.y)] } : { mode: 'field', map: field.map.id, at: [Math.round(field.P.x), Math.round(field.P.y)] };
      save(); await wait(0.6); await fadeTo(false, 0.6);
      note('Rested at ' + name + '. The game is saved.');
    }
    async function camp(id) {
      const first = !st.done['camp:' + id]; st.done['camp:' + id] = true;
      if (first) await scene(id === 'warmCamp' ? 'warmRoads' : id === 'northCamp' ? 'northern' : 'frozen');
      await rest(PLACES[id].name);
    }
    async function upgrade(U) {
      const i = UPGRADES.indexOf(U), M = RL.MAGPIE[i];
      if (st.level < M.level) { await say([[U.who === 'ysmera' ? 'shipmaster' : U.who, M.name + ' needs a stronger crew than this: come back at level ' + M.level + '.']]); return; }
      if (st.shards < M.shards) { await say([[U.who === 'ysmera' ? 'shipmaster' : U.who, M.name + ' takes ' + nf(M.shards) + ' shards of sunstone. You have ' + nf(st.shards) + '.']]); return; }
      const k = await ask(U.who === 'ysmera' ? 'shipmaster' : U.who, M.name + ': ' + nf(M.shards) + ' shards. You have ' + nf(st.shards) + '.', ['Pay', 'Not yet']);
      if (k) return;
      st.shards -= M.shards; st.flags[U.flag] = true; st.band = Math.max(st.band, i + 2); st.magpie = U.moor; sfx('upgrade');
      await scene(U.scene); save();
    }

    // ---------- the Magpie ----------
    async function board() {
      if (!st.flags.magpie) { await say(['Quill’s old skiff, the Magpie. Her lantern is cold.']); return; }
      const here = st.magpie, list = Object.entries(LANDINGS).filter(([id, L]) => id !== here && L.band <= st.band && (!L.need || L.need(st)));
      if (!list.length) { await say(S.scenes.bogmireLanding); return; }
      const k = await ask(null, 'Take the Magpie up?', ['Fly', 'Not now']);
      if (k) return;
      const id = await flyNow(here);
      if (!id || id === here) { const L0 = LANDINGS[here]; if (L0.world) { const p = PLACES[L0.world].at; await goWorld(p[0], p[1] + 30); } else await goField(L0.field[0], L0.field[1], 's'); return; }
      const L = LANDINGS[id];
      st.magpie = id;
      if (L.world) { const p = PLACES[L.world].at; await goWorld(p[0], p[1] + 30); if (!st.done['camp:' + L.world]) await camp(L.world); }
      else await goField(L.field[0], L.field[1], 's');
      save();
    }
    // the flying map (fly.js): the Magpie over the far view, landing at any stop she can reach
    let flyer = null;
    async function flyNow(from) {
      if (!flyer) flyer = Fly.create(root, {
        image: src("art/world/far-view.webp"), clouds: src("art/world/night-clouds.webp"), mask: window.WORLD_MASK,
        landings: Object.fromEntries(Object.entries(LANDINGS).map(([id, L]) => [id, { name: L.name, at: L.sky, band: L.band, need: L.need ? () => L.need(st) : null }])),
        open: (b) => b <= st.band, bandAt: (x, y) => World.bandAt(x, y), music, sfx,
        regionName: (x, y) => { const b = World.bandAt(x, y); return b === 1 ? (x < 1600 && y < 2250 ? 'Over the Gloamwood' : 'Over the Gloomfen') : b ? 'Over ' + REGION[b].replace('The ', 'the ') : 'Over the open sea'; },
      });
      await fadeTo(true, 0.3); field.show(false); world.show(false); mode = 'fly';
      const p = flyer.fly(from); await fadeTo(false, 0.3);
      const id = await p;
      await fadeTo(true, 0.3);
      return id;
    }
    // the crossing: the night sky, the moon, and the clouds going by
    async function flight(to) {
      const sky = el('div', { class: 'flight' }, root); el('div', { class: 'flight-moon' }, sky); for (let i = 0; i < 5; i++) el('div', { class: 'flight-cloud c' + i }, sky);
      el('p', { class: 'flight-text' }, sky, 'The Magpie lifts into the night… to ' + to + '.');
      music('flight'); sfx('ship-takeoff');
      await wait(3.2); sfx('ship-land'); sky.classList.add('out'); await wait(0.5); sky.remove();
    }

    // ---------- battles ----------
    let preHerbs = {};
    async function swirl() {
      const sw = el('div', { class: 'swirl' }, root); sfx('boss');
      await wait(0.85); return sw;
    }
    // ---------- the cutscenes (envoi-final-draft/cutscenes/, each its own session's) ----------
    // The Colossus the first time the party meets one in the wilds, and the finale's opening before its first try. Each
    // plays once (st.seen); its fight then starts quick (the cutscene has shown its lines) with its foes already standing
    // where the cutscene left them, and the cutscene's last picture fades into the fight. The game's three volumes go in
    // as the cutscenes take them (Normal is 1)
    const coarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    function cutsceneFor(kind, cfg) {
      let id = null, level;
      if (kind === 'finale') id = 'finale-opening';
      else if (kind === 'wild' && cfg.fight) { const f = (cfg.fight().foes || [])[0]; if (f && f.id === 'colossus') { id = 'colossus-first-meeting'; level = f.level; } }
      const C = id && window.CUTSCENES && window.CUTSCENES[id];
      return C && !(st.seen && st.seen[id]) ? { id, C, level, arena: arenaFor(cfg) } : null;
    }
    function csOpts(level, arena) {
      const v = (x) => Math.min(1.25, (x || 0) / 0.75), o = { volume: { music: v(settings.music), effects: v(settings.sfx), surroundings: v(settings.amb) } };
      if (coarse) o.quality = 'phone'; if (level) o.level = level; if (arena) o.arena = arena;
      return o;
    }
    async function cutscene(cs) {
      st.seen = st.seen || {}; st.seen[cs.id] = true; save();
      const box = el('div', { class: 'cutscene-layer' }, root);
      try { await cs.C.play(box, csOpts(cs.level, cs.arena)); } catch (e) { /* a cutscene that can't play is passed over */ }
      return box;
    }
    // the cutscene's last picture stays over the fight while it builds, then fades into it (after ms, 1200 by default)
    function fadeStill(box, ms) { setTimeout(() => { box.classList.add('is-gone'); setTimeout(() => box.remove(), 900); }, ms === undefined ? 1200 : ms); }
    // one this game has shown, watched again from the menu's Settings: over the menu, which is still there after it
    // (it ends as it did before its fight: in the fight's arena when the fight is fought in one)
    const CUT_FIGHT = { 'colossus-first-meeting': ['wild', { band: 4, pack: ['colossus'] }], 'finale-opening': ['finale', {}] };
    async function rewatch(id) {
      const C = window.CUTSCENES && window.CUTSCENES[id]; if (!C) return;
      const was = curMusic; music(null);
      let arena = null; try { if (GameFights.ARENA && CUT_FIGHT[id]) arena = arenaFor(GameFights.config(CUT_FIGHT[id][0], st, CUT_FIGHT[id][1])); } catch (e) { /* the flat painting's ending */ }
      const box = el('div', { class: 'cutscene-layer is-over', tabindex: '-1' }, root); box.focus({ preventScroll: true });
      try { await C.play(box, csOpts(null, arena)); } catch (e) { /* passed over */ }
      box.remove(); music(was);
    }
    async function battle(kind, o) {
      preHerbs = Object.assign({}, st.herbs);
      AUD && music(null); const sw = await swirl();
      const layer = el('div', { class: 'battle-layer' }, root), stage = el('main', { id: 'stage', 'aria-label': 'Battle' }, layer);
      stage.innerHTML = BattleScreen.markup();
      sw.remove();
      // the map under the battle stops drawing until the fight is over
      const was = mode; field.show(false); world.show(false);
      const cfg = GameFights.config(kind, st, o);
      const colossus = kind === 'wild' && (cfg.fight().foes || []).some((f) => f.id === 'colossus');
      // a cutscene first, when this fight has one that hasn't played
      const cs = cutsceneFor(kind, cfg), still = cs ? await cutscene(cs) : null;
      // after a cutscene, the fight takes its place under the cutscene's last picture: in an arena, no weather rolls in
      if (still) { cfg.quickIntro = true; cfg.standing = true; if (cfg.arena) cfg.weather = 'clear'; }
      // a battle that can't even start (an arena that fails to build) hands back to the map instead of leaving its layer up
      let late = 0;
      const r = await new Promise((res) => {
        cfg.game = { onEnd: res, onError: () => res({ outcome: 'error' }) }; cfg.sound = SND;
        // in an arena, the picture fades when the battle is drawing the same frame (it says so: shown), or after a while
        // if it never does; on a flat painting, a moment after the battle starts building, as before
        if (still && cfg.arena) { late = setTimeout(() => fadeStill(still, 0), 15000); cfg.game.shown = () => { clearTimeout(late); fadeStill(still, 0); }; }
        try { layer.ctl = BattleScreen.start(cfg); } catch (err) { console.error(err); layer.ctl = { stop() {} }; res({ outcome: 'error' }); }
        if (still && !cfg.arena) fadeStill(still); // a cutscene's last picture goes in the error case too
      });
      if (still && cfg.arena) { clearTimeout(late); if (still.parentNode) still.remove(); } // (an arena's battle that ended before it drew)
      layer.ctl.stop(); layer.remove();
      if (was === 'field') field.show(true); else if (was === 'world') world.show(true);
      if (r.outcome !== 'error') { moreShards(r); GS.applyBattle(st, r); backAfter(r); }
      if (mode === 'field') music(MUSIC[field.map.id] || 'travel'); else if (mode === 'world') music('travel');
      save();
      if (colossus && r.outcome === 'win') await colossusGifts();
      if (r.keepsakeShards) note('The keepsakes find ' + nf(r.keepsakeShards) + ' more shards.');
      return r;
    }
    // a random fight: st.wilds counts each band's, since the Bramble Colossus never comes in the last band's first few
    async function wild(band, sceneId) {
      st.wilds = st.wilds || {};
      const seen = st.wilds[band] || 0; st.wilds[band] = seen + 1;
      const r = await battle('wild', { band, scene: sceneId, seen });
      if (r.outcome === 'lose') await wake();
    }

    // ---------- the ending ----------
    async function ending() {
      await fadeTo(true, 1.2);
      const card = el('div', { class: 'ending' }, root);
      const sky = el('canvas', { class: 'ending-sky', 'aria-hidden': 'true' }, card);
      drawStars(sky);
      const box = el('div', { class: 'ending-box' }, card);
      music('title'); await fadeTo(false, 1.2);
      for (const ln of S.scenes.ending) {
        if (typeof ln === 'string' && ln === 'THE END') break;
        await say([ln]);
      }
      el('h2', null, box, 'The End');
      el('p', null, box, 'Envoi on the Longest Night. Made for Chris, from his story, his art and his world.');
      el('p', null, box, 'Letters sent: ' + (1 + (st.letters || 0)) + '. Fights: ' + st.fights + '. Time: ' + clock(st.time) + '.');
      const b = el('button', { type: 'button', class: 'go' }, box, 'Back to the title');
      await new Promise((r) => b.addEventListener('click', r));
      card.remove(); showTitle();
    }
    function drawStars(cv) {
      // at the screen's own size, so the moon is in view however the phone is held
      const r = cv.getBoundingClientRect(), k = Math.min(window.devicePixelRatio || 1, 2), w = cv.width = Math.max(300, Math.round(r.width * k)), h = cv.height = Math.max(300, Math.round(r.height * k)), g = cv.getContext('2d');
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#05030f'); gr.addColorStop(1, '#1b1440'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let i = 0; i < Math.round(w * h / 1300); i++) { const x = Math.random() * w, y = Math.random() * h * 0.9, r = Math.random() < 0.08 ? 1.6 : 0.8; g.fillStyle = 'rgba(255,250,235,' + (0.4 + Math.random() * 0.6).toFixed(2) + ')'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
      const mr = Math.min(w, h) * 0.09, mx = w * 0.66, my = h * 0.2, m = g.createRadialGradient(mx, my, 0, mx, my, mr); m.addColorStop(0, '#fffbe8'); m.addColorStop(0.5, 'rgba(255,248,220,0.9)'); m.addColorStop(0.55, 'rgba(255,240,200,0.25)'); m.addColorStop(1, 'rgba(255,240,200,0)');
      g.fillStyle = m; g.beginPath(); g.arc(mx, my, mr, 0, Math.PI * 2); g.fill();
    }
    const clock = (s) => { const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60; return h + ':' + String(m).padStart(2, '0'); };

    // ---------- the menu ----------
    let menuOpen = null;
    function menu() {
      return new Promise((done) => {
        const ov = el('div', { class: 'gmenu', role: 'dialog', 'aria-label': 'Menu' }, root); menuOpen = ov;
        const card = el('div', { class: 'gmenu-card win' }, ov);
        const tabs = el('div', { class: 'gmenu-tabs', role: 'tablist' }, card), body = el('div', { class: 'gmenu-body' }, card);
        const close = () => { ov.remove(); menuOpen = null; done(); };
        const T = { Party: party, Herbs: herbs, Items: items, Moonlore: lore, Saves: saves, Settings: setup };
        let cur = 'Party';
        const btns = Object.keys(T).map((k) => { const b = el('button', { type: 'button', role: 'tab', class: 'tab' }, tabs, k); b.addEventListener('click', () => { cur = k; draw(); }); return b; });
        const foot = el('div', { class: 'gmenu-foot' }, card);
        const saveB = el('button', { type: 'button', class: 'go alt' }, foot, 'Save'); saveB.addEventListener('click', () => { save(); note('Saved in slot ' + GS.slot() + '.'); sfx('ui-save'); });
        const titleB = el('button', { type: 'button', class: 'go alt' }, foot, 'Title'); titleB.addEventListener('click', () => { save(); close(); showTitle(); });
        const closeB = el('button', { type: 'button', class: 'go' }, foot, 'Close'); closeB.addEventListener('click', close);
        ov.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } });
        function draw() { btns.forEach((b, i) => b.setAttribute('aria-selected', String(Object.keys(T)[i] === cur))); body.textContent = ''; T[cur](body, draw); }
        draw(); setTimeout(() => closeB.focus({ preventScroll: true }), 30);
      });
    }
    const heroes = () => (st.flags.party ? ['io', 'sol'] : ['io']);
    function bar(parent, label, v, max, cls) { const r = el('div', { class: 'gm-row' }, parent); el('span', null, r, label); el('b', null, r, nf(v) + ' / ' + nf(max)); const g = el('div', { class: 'gauge ' + (cls || '') }, parent); el('i', { style: 'width:' + (100 * v / max).toFixed(1) + '%' }, g); }
    function party(b) {
      el('p', { class: 'gm-top' }, b, 'Level ' + st.level + (st.level < RL.MAX_LEVEL ? ' · ' + nf(RL.xpNeed(st.level) - st.xp) + ' experience to the next' : ' · the highest level') + ' · ' + nf(st.shards) + ' sunstone shards');
      for (const id of heroes()) {
        const c = el('div', { class: 'gm-hero' }, b); el('h3', null, c, RL.HEROES[id].name);
        bar(c, 'HP', GS.hpOf(st, id), GS.maxHp(st, id), 'hp');
        if (id === 'io') bar(c, 'MP', GS.mpOf(st), GS.maxMp(st), 'mp');
        const ks = K.summary(st, id);
        if (ks) el('p', { class: 'gm-note' }, c, 'Her keepsakes: ' + ks + '.');
      }
      el('p', { class: 'gm-note' }, b, 'Played ' + clock(st.time) + ' · ' + st.wins + ' fights won · The Magpie: ' + (st.flags.magpie ? 'band ' + st.band + (st.magpie ? ', at ' + LANDINGS[st.magpie].name : '') : 'not yet yours'));
    }
    function pickHero(b, then) { const r = el('div', { class: 'gm-pick' }, b); for (const id of heroes()) { const x = el('button', { type: 'button', class: 'go alt' }, r, RL.HEROES[id].name); x.addEventListener('click', () => then(id)); } }
    function herbs(b, redraw) {
      el('p', { class: 'gm-top' }, b, 'The party carries up to ' + RL.CARRY + ' of each herb. In a fight each can be used once; out here, as many as you have. The Ember-star Lily only works in a fight.');
      for (const id of Object.keys(RL.HERBS)) {
        const H = RL.HERBS[id], n = st.herbs[id] || 0, r = el('div', { class: 'gm-item' }, b);
        el('span', null, r, H.name); el('b', null, r, n ? '×' + n : 'none');
        if (!n || id === 'emberLily') continue;
        const u = el('button', { type: 'button', class: 'go small' }, r, 'Use');
        u.addEventListener('click', () => {
          const go = (who) => { const err = GS.useHerb(st, id, who); if (err) note(err); else { sfx('heal'); note(H.name + ' used.'); } redraw(); };
          if (H.target === 'ally' || H.target === 'fallen') { r.textContent = ''; el('span', null, r, 'On whom?'); pickHero(r, go); } else go('io');
        });
      }
    }
    // the keepsakes found, and who wears them (keepsakes.js): only what has been found, never how many are left
    function items(b, redraw) {
      K.page(b, st, { root, src, heroes: heroes(), redraw, changed: () => { GS.fit(st); save(); sfx('ui-confirm'); } });
    }
    function lore(b, redraw) {
      el('p', { class: 'gm-top' }, b, 'Io’s healing Moonlore works out of battle too. MP ' + nf(GS.mpOf(st)) + ' / ' + nf(GS.maxMp(st)) + '.');
      const M = RL.HEROES.io.moves;
      for (const k of ['mend', 'waxing']) {
        if (k === 'waxing' && !st.flags.party) continue;
        const r = el('div', { class: 'gm-item' }, b); el('span', null, r, M[k].name); el('b', null, r, M[k].mp + ' MP');
        const u = el('button', { type: 'button', class: 'go small' }, r, 'Cast');
        u.addEventListener('click', () => {
          const go = (who) => { const err = GS.healOutside(st, k, who); if (err) note(err); else { sfx('heal'); } redraw(); };
          if (k === 'mend') { r.textContent = ''; el('span', null, r, 'On whom?'); pickHero(r, go); } else go();
        });
      }
    }
    function setup(b, redraw) {
      const row = (label, opts2, key) => { const r = el('div', { class: 'gm-item' }, b); el('span', null, r, label); const g = el('div', { class: 'gm-pick' }, r); for (const [t, v] of opts2) { const x = el('button', { type: 'button', class: 'go small' + (settings[key] === v ? '' : ' alt'), 'aria-pressed': String(settings[key] === v) }, g, t); x.addEventListener('click', () => { const was = settings[key]; settings[key] = v; keepSettings(); if (key === 'music' || key === 'sfx' || key === 'amb') { applySound(); if (key === 'music' && v && !was) { const m = curMusic; curMusic = null; music(m); } else if (key === 'sfx' && v) sfx('ui-confirm'); else if (key === 'amb' && v) amb('crickets', 0.5); } if (key === 'big') root.classList.toggle('big-text', !!v); redraw(); }); } };
      row('Random fights', [['Fewer', 0.6], ['Normal', 1], ['More', 1.5]], 'rate');
      row('Map light', [['Dim', 0.85], ['Normal', 1], ['Bright', 1.2]], 'light');
      row('Music', [['Off', 0], ['Soft', 0.4], ['Normal', 0.75], ['Loud', 1]], 'music');
      row('Effects', [['Off', 0], ['Soft', 0.4], ['Normal', 0.75], ['Loud', 1]], 'sfx');
      row('Surroundings', [['Off', 0], ['Soft', 0.4], ['Normal', 0.75], ['Loud', 1]], 'amb');
      row('Words', [['Slow', 0.5], ['Normal', 1], ['Fast', 2], ['All at once', 0]], 'text');
      row('Text size', [['Normal', false], ['Large', true]], 'big');
      // the battles' frame rate, kept where the battle screen reads it (30 by default, Chris)
      let fps = 30; try { const v = localStorage.getItem('envoi.fps'); if (v !== null) fps = +v; } catch (e) { /* default */ }
      const r = el('div', { class: 'gm-item' }, b); el('span', null, r, 'Battle frame rate'); const gp = el('div', { class: 'gm-pick' }, r);
      for (const [t, v] of [['30', 30], ['45', 45], ['60', 60], ['Screen', 0]]) { const x = el('button', { type: 'button', class: 'go small' + (fps === v ? '' : ' alt'), 'aria-pressed': String(fps === v) }, gp, t); x.addEventListener('click', () => { try { localStorage.setItem('envoi.fps', String(v)); } catch (e) { /* not kept */ } redraw(); }); }
      // the cutscenes this game has shown, to watch again
      const seen = Object.keys(st.seen || {}).filter((id) => window.CUTSCENES && window.CUTSCENES[id]);
      if (seen.length) {
        const r2 = el('div', { class: 'gm-item' }, b); el('span', null, r2, 'Watch again'); const g2 = el('div', { class: 'gm-pick' }, r2);
        for (const id of seen) { const x = el('button', { type: 'button', class: 'go small alt' }, g2, window.CUTSCENES[id].title); x.addEventListener('click', async () => { await rewatch(id); x.focus({ preventScroll: true }); }); }
      }
    }

    // ---------- the saves: three slots, and a save code to carry a game to another device or copy of the game ----------
    function whereOf(sv) { const W = sv.where || {}; return W.mode === 'world' ? 'the world map' : (MAPS[W.map] && MAPS[W.map].name) || 'Wickhollow'; }
    const saveLine = (sv) => 'Level ' + sv.level + ' · ' + clock(sv.time) + ' played · ' + whereOf(sv);
    function saves(b, redraw) {
      el('p', { class: 'gm-top' }, b, 'The game saves itself in the slot in use (slot ' + GS.slot() + ') at every rest and every change of place. Save in another slot to keep this moment as it is.');
      for (const { slot: n, st: sv } of GS.list()) {
        const r = el('div', { class: 'gm-item' }, b), t = el('span', null, r, 'Slot ' + n + (n === GS.slot() ? ' (in use)' : ''));
        el('small', null, t, sv ? saveLine(sv) : 'Empty');
        const x = el('button', { type: 'button', class: 'go small' + (n === GS.slot() ? '' : ' alt') }, r, 'Save here');
        x.addEventListener('click', async () => {
          if (sv && n !== GS.slot()) { const k = await ask(null, 'Save over slot ' + n + '? ' + saveLine(sv) + ' will be lost.', ['Save over it', 'Keep it']); if (k) return; }
          GS.use(n); save(); sfx('ui-save'); note('Saved in slot ' + n + '.'); redraw();
        });
      }
      const r = el('div', { class: 'gm-item' }, b), t = el('span', null, r, 'Save code'); el('small', null, t, 'The game as text: copy it, and paste it into the title’s Load on another device or another copy of the game.');
      const c = el('button', { type: 'button', class: 'go small alt' }, r, 'Copy');
      c.addEventListener('click', () => { save(); showCode(GS.code(st)); });
    }
    // the save code in a box to copy (the clipboard where the browser allows it)
    function showCode(text) {
      const ov = el('div', { class: 'gmenu', role: 'dialog', 'aria-label': 'Save code' }, root), card = el('div', { class: 'gmenu-card win' }, ov);
      el('h2', null, card, 'Save code');
      el('p', { class: 'gm-top' }, card, 'This is the whole game as it stands. Keep it somewhere safe, or paste it into Load on the title of another copy of the game.');
      const ta = el('textarea', { class: 'code', readonly: '', rows: '5', 'aria-label': 'Save code' }, card); ta.value = text;
      const foot = el('div', { class: 'gmenu-foot' }, card), cp = el('button', { type: 'button', class: 'go alt' }, foot, 'Copy'), x = el('button', { type: 'button', class: 'go' }, foot, 'Done');
      cp.addEventListener('click', async () => { ta.select(); let ok = false; try { await navigator.clipboard.writeText(text); ok = true; } catch (e) { try { ok = document.execCommand('copy'); } catch (e2) { /* select it by hand */ } } note(ok ? 'Copied.' : 'Select the code and copy it.'); });
      x.addEventListener('click', () => ov.remove());
      setTimeout(() => { ta.focus({ preventScroll: true }); ta.select(); }, 30);
    }
    // a pasted save code: a game to load into a slot
    function pasteCode() {
      return new Promise((done) => {
        const ov = el('div', { class: 'gmenu', role: 'dialog', 'aria-label': 'Load a save code' }, root), card = el('div', { class: 'gmenu-card win' }, ov);
        el('h2', null, card, 'Load a save code');
        el('p', { class: 'gm-top' }, card, 'Paste a save code from another copy of the game. It goes into the slot in use.');
        const ta = el('textarea', { class: 'code', rows: '5', 'aria-label': 'Save code', placeholder: 'ENVOI1:…' }, card), msg = el('p', { class: 'gm-note' }, card, '');
        const foot = el('div', { class: 'gmenu-foot' }, card), ok = el('button', { type: 'button', class: 'go' }, foot, 'Load it'), no = el('button', { type: 'button', class: 'go alt' }, foot, 'Back');
        ok.addEventListener('click', () => { const sv = GS.fromCode(ta.value); if (!sv) { msg.textContent = 'That isn’t a whole save code. Copy it again, all of it.'; return; } ov.remove(); done(sv); });
        no.addEventListener('click', () => { ov.remove(); done(null); });
        setTimeout(() => ta.focus({ preventScroll: true }), 30);
      });
    }

    // ---------- the herb shop ----------
    function shop(p) {
      return new Promise((done) => {
        const ov = el('div', { class: 'gmenu', role: 'dialog', 'aria-label': p.name + '’s herbs' }, root);
        const card = el('div', { class: 'gmenu-card win' }, ov); el('h2', null, card, p.name + '’s herbs');
        const body = el('div', { class: 'gmenu-body' }, card);
        const band = bandHere();
        function draw() {
          body.textContent = ''; el('p', { class: 'gm-top' }, body, nf(st.shards) + ' sunstone shards. Up to ' + RL.CARRY + ' of each herb; in a fight, each can be used once.');
          const what = { moonpetal: 'heals one', lavender: 'heals both', mugwort: 'Io’s MP', emberLily: 'blows 10% harder for a fight', nightrose: 'brings one back' };
          for (const id of Object.keys(RL.HERBS)) {
            // the Jetty Coin: herbs cost less
            const H = RL.HERBS[id], price = Math.round(RL.herbPrice(id, band) * (1 - K.party(st).herbPrice / 100)), have = st.herbs[id] || 0, r = el('div', { class: 'gm-item' }, body);
            const nm = el('span', null, r, H.name + ' ×' + have); el('small', null, nm, ' ' + what[id]);
            el('b', null, r, nf(price));
            const bt = el('button', { type: 'button', class: 'go small' }, r, have >= RL.CARRY ? 'Full' : 'Buy');
            bt.disabled = have >= RL.CARRY || st.shards < price;
            bt.addEventListener('click', () => { st.shards -= price; st.herbs[id] = have + 1; sfx('ui-buy'); save(); draw(); });
          }
        }
        draw();
        const foot = el('div', { class: 'gmenu-foot' }, card), x = el('button', { type: 'button', class: 'go' }, foot, 'Done');
        x.addEventListener('click', () => { ov.remove(); done(); }); setTimeout(() => x.focus({ preventScroll: true }), 30);
      });
    }

    // ---------- the title ----------
    let titleEl = null;
    function showTitle() {
      mode = 'title'; field.show(false); world.show(false); pauseAll();
      if (titleEl) titleEl.remove();
      titleEl = el('div', { class: 'title' }, root);
      const img = el('img', { class: 'title-art', alt: '' }, titleEl); img.src = src("art/title/key-art.webp");
      const box = el('div', { class: 'title-box' }, titleEl);
      el('h1', null, box, 'Envoi on the Longest Night');
      const last = GS.latest();
      if (opts.chapter != null && CHAPTERS[opts.chapter]) { demoTitle(box, CHAPTERS[opts.chapter], last); return; }
      if (last) { const c = el('button', { type: 'button', class: 'go' }, box, 'Continue'); c.addEventListener('click', () => { audioInit(); GS.use(last.slot); st = last.st; begin(false); }); el('p', { class: 'title-save' }, box, 'Slot ' + last.slot + ' · ' + saveLine(last.st)); }
      const n = el('button', { type: 'button', class: 'go' + (last ? ' alt' : '') }, box, 'New game');
      n.addEventListener('click', async () => {
        audioInit(); titleEl.hidden = true;
        const slot = await pickSlot('Start the new game in which slot?');
        titleEl.hidden = false; if (!slot) return;
        GS.use(slot); st = GS.fresh(); begin(true);
      });
      const C = el('button', { type: 'button', class: 'go alt' }, box, 'Chapters');
      C.addEventListener('click', async () => {
        audioInit(); titleEl.hidden = true;
        const k = await ask(null, 'Start from where? The party comes as the story leaves it there.', CHAPTERS.map((c) => c.name).concat(['Back']));
        if (k >= CHAPTERS.length) { titleEl.hidden = false; return; }
        const slot = await pickSlot('Play it in which slot?');
        titleEl.hidden = false; if (!slot) return;
        GS.use(slot); st = chapterState(CHAPTERS[k]); if (k) GS.save(st); begin(!k);
      });
      const L = el('button', { type: 'button', class: 'go alt' }, box, 'Load');
      L.addEventListener('click', async () => {
        audioInit(); titleEl.hidden = true;
        const all = GS.list(), opts2 = all.filter((x) => x.st);
        const k = await ask(null, opts2.length ? 'Load which game?' : 'There are no saved games here yet. A save code from another copy of the game can be pasted.', opts2.map((x) => 'Slot ' + x.slot + ': level ' + x.st.level + ', ' + clock(x.st.time)).concat(['Paste a save code', 'Back']));
        if (k < opts2.length) { GS.use(opts2[k].slot); st = opts2[k].st; titleEl.hidden = false; begin(false); return; }
        if (k === opts2.length) { const sv = await pasteCode(); if (sv) { st = sv; GS.save(st); titleEl.hidden = false; begin(false); return; } }
        titleEl.hidden = false;
      });
      el('p', { class: 'title-help' }, box, 'Tap where Io should go, or hold to steer her, or use the arrows. Tap people and glowing things to talk to them or use them. The golden arrow shows where to go next. Sound on.');
      if (audioOn) music('title');
      setTimeout(() => (box.querySelector('button') || n).focus({ preventScroll: true }), 50);
    }
    // a page that plays one chapter (tools/make-demos.mjs, Game.start's chapter): begin it, or carry on from its save
    function demoTitle(box, C, last) {
      el('p', { class: 'title-save' }, box, C.name);
      if (last) { const c = el('button', { type: 'button', class: 'go' }, box, 'Continue'); c.addEventListener('click', () => { audioInit(); GS.use(last.slot); st = last.st; begin(false); }); el('p', { class: 'title-save' }, box, saveLine(last.st)); }
      const b = el('button', { type: 'button', class: 'go' + (last ? ' alt' : '') }, box, last ? 'Begin again' : 'Begin');
      b.addEventListener('click', async () => {
        audioInit();
        if (last) { titleEl.hidden = true; const k = await ask(null, 'Begin ' + C.name.replace(/^The /, 'the ') + ' again? The game saved here will be lost.', ['Begin again', 'Back']); titleEl.hidden = false; if (k) return; }
        GS.use(1); st = chapterState(C); if (C.level) GS.save(st); begin(!C.level);
      });
      el('p', { class: 'title-help' }, box, 'Tap where Io should go, or hold to steer her, or use the arrows. Tap people and glowing things to talk to them or use them. The golden arrow shows where to go next. Sound on.');
      if (audioOn) music('title');
      setTimeout(() => (box.querySelector('button') || b).focus({ preventScroll: true }), 50);
    }
    // which slot a new game or a chapter goes in: an empty one first; a full one is only lost if the player says so.
    // Resolves the slot's number, or 0 for Back
    async function pickSlot(question) {
      const all = GS.list();
      if (!all.some((x) => x.st)) return 1;
      const k = await ask(null, question, all.map((x) => 'Slot ' + x.slot + ': ' + (x.st ? 'level ' + x.st.level : 'empty')).concat(['Back']));
      if (k >= all.length) return 0;
      if (all[k].st) { const y = await ask(null, 'Slot ' + all[k].slot + ' holds a game: ' + saveLine(all[k].st) + '. Start over it?', ['Start over it', 'Back']); if (y) return 0; }
      return all[k].slot;
    }
    async function begin(isNew) {
      titleEl.remove(); titleEl = null; busy++;
      K.migrate(st); // a save from before the twenty keeps its two keepsakes
      try {
        if (isNew) { music('title'); await prologue(); await goField('cottage', [838, 520], 's'); }
        else { const W = st.where; if (W.mode === 'world') await goWorld(W.at[0], W.at[1], W.dir); else await goField(W.map, W.at, W.dir); }
      } finally { busy--; resumeAll(); }
    }
    async function prologue() {
      const card = el('div', { class: 'prologue' }, root); const img = el('img', { alt: '' }, card); img.src = src((window.STILLS || {}).prologue || window.SCENES['night-square'].image); // the first fight's painting, so the page carries it once
      await wait(0.2); card.classList.add('on');
      for (const ln of S.scenes.prologue) { if (typeof ln !== 'string') { card.classList.add('out'); await wait(0.6); card.remove(); } await say([ln]); }
      if (card.isConnected) card.remove();
    }

    // time played
    setInterval(() => { if (mode !== 'title' && !document.hidden) st.time += 1; }, 1000);
    if (opts.skipTitle) { audioOn = false; begin(!opts.state); } else showTitle();
    const api = { get flyer() { return flyer; }, get state() { return st; }, set state(v) { st = v; }, field, world, talk, CHAPTERS, chapterState, battle: (k, o) => act(() => battle(k, o)), goField: (id, at) => act(() => goField(id, at)), goWorld: (x, y) => act(() => goWorld(x, y)), scene: (id) => act(() => scene(id)), get mode() { return mode; }, get busy() { return busy; }, PLACES, LANDINGS, menu: () => act(menu), audioInit, songs, get music() { return songs.playing() || AUD.musicPlaying(); }, get battleTheme() { return SND.musicOn; },
      get goal() { return mode === 'field' && field.map ? goalOn(field.map.id) : mode === 'world' ? goalOnWorld() : null; } };
    window.__game = api;
    return api;
  }
  window.Game = { start, PLACES, LANDINGS, arenaFor };
})();
