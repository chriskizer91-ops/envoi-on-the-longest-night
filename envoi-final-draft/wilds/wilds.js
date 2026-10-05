// wilds.js: the wilderness demo page (the workshop's wilds job, steps 5 and 6: envoi-final-draft/workshop/wilds.md). Io
// walks Chris's eight night wilderness scenes (art request 12, traced in src/game/maps.js) on the game's own field
// (src/game/field.js), at the game's settings exactly as src/game/game.js makes its field: 52 map px tall and 15% of the
// screen's shorter side, walking 1.7 of her heights a second (speed 110 and zoom 0.7 stand in until her painting loads),
// painted Io and the paper dolls, a random fight about every 770 map px walked and never under 440, and the paintings as
// painted (light 1).
// A first card offers the three bands, each named for its region, and starts Io at the band's camp (the map's start).
// The exits take her from scene to scene with the game's fade. The exit to Dawnroost, the northern crossroads or the
// frozen pass ends the band's road: a card names the place (its painting behind, Io just inside where the exit brings
// her), counts the fights that would have started on the way, and goes back to the camp or to the bands. Where a fight
// would start, a note and a count, and the field goes on with no fight played; the camps' rests, their landing grounds
// and the Ember Line road's three nodes show notes of what happens there in the game, and a node stays lit for the walk.
// The page reads only what every traced scene has (start, walk, exits, spots, wild, land), so the tracing can change
// under it without the page changing.
// Copied from the map editor's Walk it (envoi-final-draft/map-editor/map-editor.js, startWalk and src): the art's
// address, and the field made with the game's options, its own menu button giving way to this page's way back. From the
// game (src/game/game.js): the fade between maps (fadeTo), the note (note), and act(), which holds the field still while
// something happens.
// Needs MAPS (maps.js, with the eight scenes), Field (field.js), makePaintedIo (painted-io.js), makePaintedFolk
// (painted-folk.js, with WALKERS from walkers.js), makePixelIo (pixel-io.js) and makeFolk (sprites.js). Defines
// window.Wilds, which the page's test reads (page-test.mjs).
(function () {
  'use strict';
  const MAPS = window.MAPS || {};
  // the art's address: in this folder it loads from ../../art; the build puts it inside the page as data: URLs
  const src = (p) => (String(p).startsWith('data:') ? p : (window.ART_BASE != null ? window.ART_BASE : '../../') + p);
  const $ = (id) => document.getElementById(id);
  const wait = (s) => new Promise((r) => setTimeout(r, s * 1000));
  const lower = (name) => String(name).replace(/^The /, 'the ');
  function el(tag, cls, text, parent) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; if (parent) parent.appendChild(e); return e; }

  // each band's road, from its camp to the place at its end (the brief's table of scenes)
  const BANDS = [
    { band: 2, region: 'The Warm Roads', row: ['warm-roads-camp', 'ember-line-road', 'dawnroost-road'], end: 'dawnroost' },
    { band: 3, region: 'The northern wilds', row: ['northern-camp', 'eldergrove-edge', 'cold-moor'], end: 'crossroads' },
    { band: 4, region: 'The northeast peaks', row: ['frozen-camp', 'frostmere-shore'], end: 'frozen-pass' },
  ];
  // the places at the ends of the roads, as the game names them
  const ENDS = { dawnroost: 'Dawnroost', crossroads: 'The northern crossroads', 'frozen-pass': 'The frozen pass' };
  const SCENES = new Set(BANDS.flatMap((b) => b.row));

  // the scenes as the field walks them: the page's own copy of each scene's spots (a node is marked lit for one walk),
  // and each camp's landing ground as a spot to look at; the towns at the ends as they are
  const maps = Object.assign({}, MAPS);
  for (const id of SCENES) {
    const m = MAPS[id]; if (!m) continue;
    const spots = (m.spots || []).map((s) => Object.assign({}, s, { label0: s.label }));
    if (Array.isArray(m.land)) spots.push({ kind: 'look', id: 'landing', at: [m.land[0], m.land[1]], label: 'The landing ground', note: 'The Magpie sets down here.' });
    maps[id] = Object.assign({}, m, { spots });
  }
  const nodesOn = (id) => ((maps[id] && maps[id].spots) || []).filter((s) => s.kind === 'node');

  // what this walk has done: the fights that would have started, the nodes Sol has lit, the spots used (and a log, for
  // the page's test)
  const S = { mode: 'start', band: null, fights: 0, lit: new Set(), uses: 0, log: [] };
  const root = $('wl'), corner = $('wl-corner'), noteEl = $('wl-note'), startEl = $('wl-start'), endEl = $('wl-end'), bandsEl = $('wl-bands');

  // ---------- the field, at the game's settings ----------
  const paintedIo = typeof window.makePaintedIo === 'function' ? window.makePaintedIo(src) : null;
  const paintedFolk = typeof window.makePaintedFolk === 'function' ? window.makePaintedFolk(src) : null;
  let paintedReady = false;
  if (paintedIo && paintedIo.ready) paintedIo.ready.then(() => { paintedReady = true; });
  const field = window.Field.create($('wl-field'), {
    maps, src, speed: 110, zoom: 0.7, ioH: 52, paintedIo, paintedFolk, pace: 1.7, ioScreen: 0.15,
    encounter: { mean: 770, min: 440 }, light: () => 1,
    isDone: () => false,
    onExit: (ex) => act(() => onExit(ex)),
    onSpot: (s) => onSpot(s),
    onTalk: (p) => note(p.name + ' is here', 'Talking is off on this page.'),
    onEncounter: (m) => onFight(m),
    onMenu: () => act(chooseBand), // Esc or M, as the game's menu
  });
  field.show(false);

  // something happening holds the field still, and lets it walk again after (game.js, act)
  let busy = 0;
  async function act(fn) {
    if (busy) return;
    busy++; field.pause();
    try { await fn(); } catch (e) { console.error(e); } finally { busy--; if (!busy && S.mode === 'walk') field.resume(); }
  }
  // the fade between scenes (game.js, fadeTo)
  const fade = $('wl-fade');
  async function fadeTo(on, s) { fade.style.transition = 'opacity ' + (s || 0.35) + 's'; fade.classList.toggle('on', on); await wait(s || 0.35); }

  // ---------- the notes ----------
  let noteT = 0;
  function note(title, body) {
    $('wl-note-title').textContent = title; $('wl-note-body').textContent = body || '';
    placeNote(); noteEl.classList.add('on');
    clearTimeout(noteT); noteT = setTimeout(hideNote, Math.min(6500, 2600 + 35 * (title.length + (body || '').length)));
  }
  function hideNote() { clearTimeout(noteT); noteEl.classList.remove('on'); }
  // at the top between the corner label and the mini-map when there is room for it there (a phone held sideways, a
  // laptop), else under them (a phone held upright); and never over Io: when she stands under it (the camera stops at a
  // scene's top edge, so she can be high on the screen), it goes down, just above the d-pad
  function placeNote() {
    const rr = root.getBoundingClientRect(), mini = field.root.querySelector('.mini'), pad = field.root.querySelector('.pad'), shown = !field.root.hidden;
    const cr = corner.hidden ? null : corner.getBoundingClientRect(), mr = mini && shown ? mini.getBoundingClientRect() : null;
    const side = Math.max(cr ? cr.right - rr.left : 0, mr ? rr.right - mr.left : 0) + 12, free = rr.width - 2 * side;
    if (free >= 280) { noteEl.style.removeProperty('--note-top'); noteEl.style.setProperty('--note-w', Math.floor(free) + 'px'); }
    else { noteEl.style.setProperty('--note-top', Math.round(Math.max(cr ? cr.bottom - rr.top : 0, mr ? mr.bottom - rr.top : 0) + 8) + 'px'); noteEl.style.removeProperty('--note-w'); }
    const io = ioBox(), nr = noteEl.getBoundingClientRect();
    if (!io || !(io.l < nr.right && nr.left < io.r && io.t < nr.bottom + 6 && nr.top - 6 < io.b)) return;
    const floor = pad && shown ? pad.getBoundingClientRect().top - rr.top : rr.height - 150;
    noteEl.style.setProperty('--note-top', Math.round(floor - nr.height - 10) + 'px'); noteEl.style.removeProperty('--note-w');
  }
  // where Io is drawn (field.js, draw: the camera's corner and closeness), as a box on the page: her feet, her height
  function ioBox() {
    if (!field.map || field.root.hidden) return null;
    const cv = field.root.querySelector('.field-cv').getBoundingClientRect(), z = field.cam.z, h = 52 * z;
    const x = cv.left + (field.P.x - field.cam.x) * z, y = cv.top + (field.P.y - field.cam.y) * z;
    return { l: x - h * 0.45, r: x + h * 0.45, t: y - h * 1.1, b: y + 4 };
  }

  // ---------- the corner label: the scene, its band, and the way back to the bands ----------
  function renderCorner() {
    const m = field.map;
    if (!m || S.mode !== 'walk') { corner.hidden = true; return; }
    corner.hidden = false;
    $('wl-scene').textContent = m.name;
    const n = S.fights;
    $('wl-sub').textContent = 'Band ' + (m.band || (S.band && S.band.band)) + ' · ' + (n ? n + (n === 1 ? ' fight' : ' fights') + ' so far' : 'no fights yet');
    const nodes = nodesOn(m.id), sub2 = $('wl-sub2');
    sub2.hidden = !nodes.length;
    if (nodes.length) sub2.textContent = 'Ember Line nodes lit: ' + nodes.filter((s) => S.lit.has(s.id)).length + ' of ' + nodes.length;
  }

  // ---------- the bands ----------
  for (const b of BANDS) {
    const camp = MAPS[b.row[0]], ok = b.row.every((id) => MAPS[id]);
    const btn = el('button', 'wl-band', null, bandsEl);
    btn.type = 'button'; btn.dataset.band = String(b.band); btn.disabled = !ok;
    const pic = el('img', 'wl-thumb', null, btn); pic.alt = ''; pic.decoding = 'async';
    if (camp && camp.src) pic.src = src(camp.src);
    const text = el('span', 'wl-band-text', null, btn);
    el('span', 'wl-band-k', 'Band ' + b.band, text);
    el('span', 'wl-band-name', b.region, text);
    el('span', 'wl-band-row', ok ? 'From ' + lower(camp.name) + ' to ' + lower(ENDS[b.end]) + ' · ' + b.row.length + ' scenes' : 'Its scenes aren’t on this page yet.', text);
    btn.addEventListener('click', () => act(() => startBand(b)));
  }
  const art = MAPS['ember-line-road'] || MAPS[BANDS[0].row[0]];
  if (art && art.src) $('wl-start-art').src = src(art.src);

  function showStart(focus) {
    S.mode = 'start'; hideNote(); field.pause(); field.show(false);
    corner.hidden = true; endEl.hidden = true; startEl.hidden = false;
    if (focus) { const first = bandsEl.querySelector('button:not(:disabled)'); if (first) first.focus({ preventScroll: true }); }
  }
  async function chooseBand() {
    await fadeTo(true, 0.3);
    showStart(true);
    await fadeTo(false, 0.3);
  }
  // a band's walk, from its camp (the map's start), with nothing counted or lit yet
  async function startBand(b) {
    await fadeTo(true, 0.3);
    hideNote(); startEl.hidden = true; endEl.hidden = true;
    S.band = b; S.fights = 0; S.lit = new Set(); S.log.length = 0;
    for (const id of b.row) for (const s of nodesOn(id)) s.label = s.label0;
    field.show(true);
    await field.load(b.row[0]);
    field.setCounter(0);
    S.mode = 'walk'; renderCorner();
    await fadeTo(false, 0.3);
  }

  // ---------- the exits: on to the next scene, or the end of the road ----------
  async function onExit(ex) {
    if (SCENES.has(ex.to) && maps[ex.to]) {
      await fadeTo(true, 0.3);
      hideNote();
      await field.load(ex.to, ex.at);
      renderCorner();
      await fadeTo(false, 0.3);
      return;
    }
    if (ENDS[ex.to]) { await reachEnd(ex); return; }
    note(ex.label || 'The way on', 'On this page she stays here.');
  }
  async function reachEnd(ex) {
    const name = ENDS[ex.to], b = S.band;
    await fadeTo(true, 0.3);
    hideNote();
    // the place she has reached, behind the card: its painting, with Io where the exit brings her
    if (maps[ex.to]) await field.load(ex.to, ex.at);
    S.mode = 'end'; corner.hidden = true;
    S.log.push({ kind: 'end', to: ex.to, fights: S.fights });
    $('wl-end-kicker').textContent = 'Band ' + b.band + ' · the end of the road';
    $('wl-end-name').textContent = name;
    $('wl-end-text').textContent = 'Io has reached ' + lower(name) + '. In the game she walks on into it from here.';
    const fights = $('wl-end-fights'), n = S.fights;
    fights.textContent = '';
    if (n) { el('b', null, String(n), fights); fights.append(n === 1 ? ' fight would have started on the way.' : ' fights would have started on the way.'); }
    else fights.textContent = 'No fights would have started on the way.';
    const nodes = b.row.flatMap(nodesOn), nl = $('wl-end-nodes');
    nl.hidden = !nodes.length; nl.textContent = '';
    if (nodes.length) { nl.append('Ember Line nodes lit on the way: '); el('b', null, nodes.filter((s) => S.lit.has(s.id)).length + ' of ' + nodes.length, nl); }
    endEl.hidden = false;
    await fadeTo(false, 0.3);
    $('wl-again').focus({ preventScroll: true });
  }
  $('wl-again').addEventListener('click', () => { if (S.band) act(() => startBand(S.band)); });
  $('wl-choose').addEventListener('click', () => act(chooseBand));
  $('wl-back').addEventListener('click', () => act(chooseBand));

  // ---------- where a fight would start, and the spots ----------
  function onFight(m) {
    S.fights++;
    const band = (m.wild && m.wild.band) || m.band;
    S.log.push({ kind: 'fight', band, map: m.id, at: [Math.round(field.P.x), Math.round(field.P.y)] });
    note('A band ' + band + ' fight would start here', 'Fights on this walk: ' + S.fights);
    renderCorner();
  }
  function onSpot(s) {
    const m = field.map;
    S.uses++; S.log.push({ kind: 'spot', spot: s.kind, id: s.id || null, map: m.id });
    if (s.kind === 'rest') { note((s.label || m.name) + ': a rest.', 'In the game Io and Sol rest here and the game is saved.'); return; }
    if (s.kind === 'node') {
      if (S.lit.has(s.id)) { note('This Ember Line node is lit', 'Sol lit it earlier on this walk.'); return; }
      S.lit.add(s.id); s.label = 'A lit Ember Line node';
      const nodes = nodesOn(m.id);
      note('An Ember Line node: Sol relights it here', 'Lit on this walk: ' + nodes.filter((x) => S.lit.has(x.id)).length + ' of ' + nodes.length);
      renderCorner();
      return;
    }
    note(s.label || 'Something here', s.note || '');
  }

  showStart(false);

  window.Wilds = {
    field, maps, BANDS, ENDS,
    get mode() { return S.mode; }, get busy() { return busy > 0; }, get band() { return S.band ? S.band.band : null; },
    get fights() { return S.fights; }, get uses() { return S.uses; }, get lit() { return [...S.lit]; }, get log() { return S.log.slice(); },
    get paintedReady() { return paintedReady; }, get noteOn() { return noteEl.classList.contains('on'); },
  };
})();
