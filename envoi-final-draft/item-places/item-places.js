// item-places.js: the Item Places page. Chris picks one of the twenty keepsakes (window.LOOT, ../items/items.js) and puts
// it where it will be found on one of the game's walking maps (src/game/maps.js), or marks it a reward (from a fight or
// a person) when it doesn't lie on a map. He walks Io there with the game's own field (src/game/field.js), where each
// placed item glints as the hidden keepsakes do, and sends the places to Claude: one document per item in the page's db
// (places/<item id>), or text to copy when the page is opened outside claude.ai. The work is kept in this browser as he
// goes (localStorage, when it is there).
// The maps, the view, the walk test and the look are the Walking Paths page's (envoi-game-pass-3/map-paths/), whose
// rules it shares (edits-core.js, window.MapEdits): where Io can stand and what she can reach, so the panel can say when
// an item lies somewhere she can't get to. Positions are the paintings' own 1536 x 1024 pixels, as in maps.js.
(function () {
  'use strict';
  const E = window.MapEdits, MAPS = window.MAPS, LOOT = window.LOOT;
  const IDS = Object.keys(MAPS), ITEMS = LOOT.ITEMS, BY = {};
  for (const it of ITEMS) BY[it.id] = it;
  const { MW, MH } = E;
  const STORE = 'envoi.item-places.v1', UI_STORE = 'envoi.item-places.ui.v1';
  // the art's address: in this folder it loads from ../../art; the build puts it inside the page as data: URLs
  const src = (p) => (String(p).startsWith('data:') ? p : (window.ART_BASE != null ? window.ART_BASE : '../../') + p);
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  function el(tag, attrs, parent, text) { const e = document.createElement(tag); if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]); if (text != null) e.textContent = text; if (parent) parent.appendChild(e); return e; }
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  };
  const css = getComputedStyle(document.documentElement), tok = (n, f) => (css.getPropertyValue(n) || '').trim() || f;
  const C = {
    deep: tok('--deep', '#0c0a1a'), walk: tok('--walk', '#5aff96'), block: tok('--block', '#ff5a64'), exit: tok('--exit', '#6eaaff'),
    people: tok('--people', '#ffd36e'), bad: tok('--bad', '#ff9d9d'), good: tok('--good', '#8dffb0'), ink: tok('--ink', '#eeedfb'),
    io: tok('--wear-io', '#ff7fc8'), sol: tok('--wear-sol', '#ffae5a'), either: tok('--wear-either', '#ffe28f'), secret: tok('--secret', '#f4f6ff'),
  };
  const rgba = (hex, a) => { let h = hex.replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); const n = parseInt(h, 16); return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; };
  const WEAR = { io: 'Only Io', sol: 'Only Sol', either: 'Either' };
  // ★ the two hidden ones (a quarter of the totals), ✦ the four specials (on top of them)
  const mark = (it) => (it.secret ? '★ ' : it.special ? '✦ ' : '');
  const GROUPS = [['io', 'Only Io can wear these', 6], ['sol', 'Only Sol can wear these', 6], ['either', 'Either can wear these', 8]];

  // ---------- the work: where each item is ----------
  // places[id]: { map, x, y } (it lies there), { reward: true } (a reward from a fight or a person), or absent (not
  // placed yet). notes[id]: Chris's own words about it. The two hidden keepsakes start where they lie in the game today.
  const saved = store.get(STORE);
  const work = { places: (saved && saved.places) || {}, notes: (saved && saved.notes) || {} };
  for (const it of ITEMS) if (it.at && it.home && !(it.id in work.places)) work.places[it.id] = { map: it.home, x: it.at[0], y: it.at[1] };
  const ui = Object.assign({ map: 'wickhollow', pick: 'orrery', layers: { walk: true, block: false, exits: true, people: true, names: false }, sent: {} }, store.get(UI_STORE) || {});
  if (!MAPS[ui.map]) ui.map = IDS[0];
  if (!BY[ui.pick]) ui.pick = ITEMS[0].id;
  let cur = ui.map, armed = false, saveT = 0;
  function saveSoon() { clearTimeout(saveT); saveT = setTimeout(() => store.set(STORE, work), 250); }
  const saveUI = () => store.set(UI_STORE, ui);
  const placeOf = (id) => work.places[id] || null;
  const onMap = (id, map) => { const p = placeOf(id); return !!p && !p.reward && p.map === map; };
  const itemsOn = (map) => ITEMS.filter((it) => onMap(it.id, map));

  // ---------- what she can reach (the Walking Paths page's rule) ----------
  // each map's items go in as spots, and the rule says which she can't get near enough to use (58 px, as the game's)
  const outCache = {};
  function outOf(map) {
    if (outCache[map]) return outCache[map];
    const its = itemsOn(map), out = new Set();
    if (its.length) {
      const w = E.traced(MAPS, map);
      w.spots = its.map((it) => ({ kind: 'keepsake', id: it.id, at: [placeOf(it.id).x, placeOf(it.id).y], label: it.name }));
      for (const p of E.reach(MAPS, map, w).problems) if (p.kind === 'spot' && w.spots[p.i]) out.add(w.spots[p.i].id);
    }
    return (outCache[map] = out);
  }
  const forget = (map) => { delete outCache[map]; };

  // ---------- the view ----------
  const stage = $('ip-stage'), cv = $('ip-cv'), g = cv.getContext('2d'), walkHost = $('ip-walk-host');
  const view = { x: 0, y: 0, z: 0.5 };
  let SW = 1, SH = 1, DPR = 1, sized = false, queued = false;
  const fitZ = () => Math.min(SW / MW, SH / MH);
  function fit() { view.z = fitZ() * 0.97; view.x = (MW - SW / view.z) / 2; view.y = (MH - SH / view.z) / 2; draw(); }
  function clampView() { const vw = SW / view.z, vh = SH / view.z; view.x = clamp(view.x, -vw * 0.5, MW - vw * 0.5); view.y = clamp(view.y, -vh * 0.5, MH - vh * 0.5); }
  function zoomAt(sx, sy, k) {
    const z = clamp(view.z * k, fitZ() * 0.5, 8), mx = view.x + sx / view.z, my = view.y + sy / view.z;
    view.z = z; view.x = mx - sx / z; view.y = my - sy / z; clampView(); draw();
  }
  const zoomBy = (k) => zoomAt(SW / 2, SH / 2, k);
  function centreOn(x, y) { view.x = x - SW / 2 / view.z; view.y = y - SH / 2 / view.z; clampView(); draw(); }
  function resize() {
    const r = stage.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return;
    const cx = view.x + SW / 2 / view.z, cy = view.y + SH / 2 / view.z;
    DPR = Math.min(window.devicePixelRatio || 1, 3); SW = r.width; SH = r.height;
    cv.width = Math.round(SW * DPR); cv.height = Math.round(SH * DPR);
    if (!sized) { sized = true; fit(); } else centreOn(cx, cy);
    draw();
  }
  new ResizeObserver(resize).observe(stage);
  function at(e) { const r = cv.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top; return { sx, sy, x: view.x + sx / view.z, y: view.y + sy / view.z }; }
  const imgs = {};
  function imgOf(id) {
    if (!imgs[id]) {
      const im = new Image(); imgs[id] = im;
      im.onload = () => { if (id === cur) draw(); };
      im.onerror = () => { im.failed = true; if (id === cur) draw(); };
      im.src = src(MAPS[id].src);
    }
    return imgs[id];
  }

  // ---------- drawing ----------
  function draw() { if (!queued) { queued = true; requestAnimationFrame(paint); } }
  // a glint: a four-pointed star in the colour of who may wear it, white-hearted for the two hidden ones
  function glint(x, y, r, col, secret, picked, out) {
    if (picked) { g.beginPath(); g.arc(x, y, r + 7, 0, Math.PI * 2); g.lineWidth = 2; g.strokeStyle = '#ffffff'; g.stroke(); }
    if (out) { g.beginPath(); g.arc(x, y, r + 3.5, 0, Math.PI * 2); g.setLineDash([4, 3]); g.lineWidth = 2; g.strokeStyle = C.bad; g.stroke(); g.setLineDash([]); }
    const star = (rr, k) => { g.beginPath(); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 - Math.PI / 2, d = i % 2 ? rr * k : rr; g.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d); } g.closePath(); };
    star(r + 1.6, 0.36); g.fillStyle = 'rgba(0,0,0,0.75)'; g.fill();
    star(r, 0.32); g.fillStyle = col; g.fill();
    g.beginPath(); g.arc(x, y, r * 0.24, 0, Math.PI * 2); g.fillStyle = secret ? C.secret : 'rgba(255,255,255,0.85)'; g.fill();
  }
  function tag(text, x, y, color) {
    g.font = '600 12px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
    const w = g.measureText(text).width + 10;
    // keep the name inside the picture: near the right edge it goes to the left of what it names
    if (x + w > SW - 4) x = Math.max(4, x - w - 28);
    y = clamp(y, 19, SH - 4);
    g.fillStyle = 'rgba(9,7,22,0.82)'; g.fillRect(x, y - 15, w, 19);
    g.fillStyle = color; g.fillText(text, x + 5, y - 1);
  }
  // each map's tracing, read once for drawing (the reach rule takes its own copy, since it adds the items as spots)
  const tracings = {}, tracing = (id) => tracings[id] || (tracings[id] = E.traced(MAPS, id));
  function paint() {
    queued = false;
    if (walking) return;
    const w = tracing(cur), z = view.z, L = ui.layers, im = imgOf(cur);
    const X = (x) => (x - view.x) * z, Y = (y) => (y - view.y) * z;
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    g.fillStyle = C.deep; g.fillRect(0, 0, SW, SH);
    if (im.complete && im.naturalWidth) {
      g.imageSmoothingEnabled = z * MW / im.naturalWidth < 2.5; g.imageSmoothingQuality = 'high';
      g.drawImage(im, X(0), Y(0), MW * z, MH * z);
    } else {
      g.fillStyle = '#16122c'; g.fillRect(X(0), Y(0), MW * z, MH * z);
      tag(im.failed ? 'The painting didn’t load.' : 'The painting is loading…', X(MW / 2) - 80, Y(MH / 2), C.ink);
    }
    const poly = (pts, col, fa) => { g.beginPath(); pts.forEach((p, j) => (j ? g.lineTo(X(p[0]), Y(p[1])) : g.moveTo(X(p[0]), Y(p[1])))); g.closePath(); g.fillStyle = rgba(col, fa); g.fill(); g.lineWidth = 1.2; g.strokeStyle = rgba(col, 0.8); g.stroke(); };
    if (L.walk) w.walk.forEach((p) => poly(p, C.walk, 0.13));
    if (L.block) w.block.forEach((p) => poly(p, C.block, 0.24));
    if (L.exits) w.exits.forEach((e) => {
      const r = e.rect; g.fillStyle = rgba(C.exit, 0.24); g.fillRect(X(r[0]), Y(r[1]), (r[2] - r[0]) * z, (r[3] - r[1]) * z);
      g.lineWidth = 1.4; g.strokeStyle = C.exit; g.strokeRect(X(r[0]), Y(r[1]), (r[2] - r[0]) * z, (r[3] - r[1]) * z);
      tag('→ ' + E.placeName(MAPS, e.to), X(r[0]), Y(r[3]) + 18, C.exit);
    });
    if (L.people) {
      for (const n of w.people) { g.beginPath(); g.arc(X(n.at[0]), Y(n.at[1]), 5, 0, Math.PI * 2); g.fillStyle = C.people; g.fill(); g.lineWidth = 1.5; g.strokeStyle = 'rgba(0,0,0,0.7)'; g.stroke(); if (z > 0.45) tag(n.name, X(n.at[0]) + 8, Y(n.at[1]) - 6, C.people); }
      for (const s of w.spots) {
        if (s.kind === 'keepsake' || s.kind === 'event' || !s.at) continue; // the hidden keepsakes are items on this page
        const x = X(s.at[0]), y = Y(s.at[1]);
        g.beginPath(); g.rect(x - 4.5, y - 4.5, 9, 9); g.fillStyle = rgba(C.people, 0.5); g.fill(); g.lineWidth = 1.5; g.strokeStyle = C.people; g.stroke();
        if (z > 0.45) tag(s.label || s.kind, x + 8, y - 6, C.people);
      }
    }
    const out = outOf(cur);
    for (const it of itemsOn(cur)) {
      const p = placeOf(it.id), x = X(p.x), y = Y(p.y), picked = it.id === ui.pick;
      glint(x, y, picked ? 11 : 9, C[it.wear], !!it.secret, picked, out.has(it.id));
      if (picked || L.names) tag(mark(it) + it.name, x + 14, y - 8, out.has(it.id) ? C.bad : C[it.wear]);
    }
    g.strokeStyle = 'rgba(214,222,255,0.28)'; g.lineWidth = 1; g.strokeRect(X(0) - 0.5, Y(0) - 0.5, MW * z + 1, MH * z + 1);
  }

  // ---------- the mouse, a finger and the keys ----------
  let drag = null;
  function hitItem(m) {
    let best = null, bd = 16;
    for (const it of itemsOn(cur)) { const p = placeOf(it.id), d = Math.hypot((p.x - m.x) * view.z, (p.y - m.y) * view.z); if (d < bd) { bd = d; best = it; } }
    return best;
  }
  const inside = (m) => m.x >= 0 && m.y >= 0 && m.x <= MW && m.y <= MH;
  cv.addEventListener('pointerdown', (e) => {
    if (walking || e.button > 0) return;
    cv.focus(); const m = at(e), hit = hitItem(m);
    if (hit) { pick(hit.id, false); drag = { kind: 'item', id: hit.id, moved: false, sx: e.clientX, sy: e.clientY }; }
    else if (armed && inside(m)) { putHere(ui.pick, m.x, m.y); }
    else drag = { kind: 'pan', sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y };
    if (drag) cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener('pointermove', (e) => {
    if (!drag) return;
    if (drag.kind === 'pan') { view.x = drag.vx - (e.clientX - drag.sx) / view.z; view.y = drag.vy - (e.clientY - drag.sy) / view.z; clampView(); draw(); return; }
    if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 4) return;
    const m = at(e), p = placeOf(drag.id); drag.moved = true;
    p.x = Math.round(clamp(m.x, 0, MW)); p.y = Math.round(clamp(m.y, 0, MH)); forget(cur); draw();
  });
  function endDrag() { if (drag && drag.kind === 'item' && drag.moved) { changed(); } drag = null; }
  cv.addEventListener('pointerup', endDrag);
  cv.addEventListener('pointercancel', endDrag);
  cv.addEventListener('wheel', (e) => { if (walking) return; e.preventDefault(); const m = at(e); zoomAt(m.sx, m.sy, Math.exp(-e.deltaY * 0.0015)); }, { passive: false });
  cv.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { armed = false; renderAll(); }
    else if (e.key === 'Delete' || e.key === 'Backspace') { if (onMap(ui.pick, cur)) { unplace(ui.pick); e.preventDefault(); } }
    else if (e.key === '+' || e.key === '=') zoomBy(1.25);
    else if (e.key === '-') zoomBy(0.8);
    else if (e.key === '0') fit();
  });
  $('ip-zoom-in').addEventListener('click', () => zoomBy(1.25));
  $('ip-zoom-out').addEventListener('click', () => zoomBy(0.8));
  $('ip-fit').addEventListener('click', fit);

  // ---------- changing where an item is ----------
  function pick(id, jump) {
    ui.pick = id; armed = false; saveUI();
    const p = placeOf(id);
    if (jump && p && !p.reward && p.map !== cur) openMap(p.map, [p.x, p.y]);
    else if (jump && p && !p.reward) centreOn(p.x, p.y);
    renderAll();
  }
  function putHere(id, x, y) {
    const was = placeOf(id); if (was && !was.reward && was.map) forget(was.map);
    work.places[id] = { map: cur, x: Math.round(x), y: Math.round(y) }; armed = false; forget(cur);
    changed(); note(BY[id].name + ' now lies on ' + MAPS[cur].name + '.');
  }
  function unplace(id) {
    const was = placeOf(id); if (was && was.map) forget(was.map);
    delete work.places[id]; armed = false; changed();
  }
  function makeReward(id) {
    const was = placeOf(id); if (was && was.map) forget(was.map);
    work.places[id] = { reward: true }; armed = false; changed();
  }
  function changed() { saveSoon(); renderAll(); }

  // ---------- walking her there ----------
  let walking = false, field = null;
  const paintedIo = typeof window.makePaintedIo === 'function' ? window.makePaintedIo(src) : null;
  const paintedFolk = typeof window.makePaintedFolk === 'function' ? window.makePaintedFolk(src) : null;
  function walkCopy(id) {
    const w = E.traced(MAPS, id), m = MAPS[id];
    const spots = w.spots.filter((s) => s.kind !== 'event' && s.kind !== 'keepsake');
    for (const it of itemsOn(id)) { const p = placeOf(it.id); spots.push({ kind: 'keepsake', id: it.id, item: it.id, at: [p.x, p.y], label: 'Something glinting' }); }
    return { name: m.name, src: m.src, zoom: m.zoom, start: w.start.slice(), walk: w.walk, block: w.block, front: w.front, exits: w.exits, people: w.people, spots };
  }
  // she starts where the picked item lies, if it's on this map and she can stand near it, else in the middle of the view
  function dropPoint(id) {
    const S = E.standTest(E.traced(MAPS, id)).stand, p = onMap(ui.pick, id) ? placeOf(ui.pick) : null;
    const cx = p ? p.x : view.x + SW / 2 / view.z, cy = p ? p.y + 30 : view.y + SH / 2 / view.z;
    let best = null, bd = Infinity;
    for (let y = 6; y < MH; y += 12) for (let x = 6; x < MW; x += 12) { const d = (x - cx) ** 2 + (y - cy) ** 2; if (d < bd && S(x, y)) { bd = d; best = [x, y]; } }
    return best || E.traced(MAPS, id).start.slice();
  }
  async function startWalk() {
    if (walking) return;
    if (typeof window.Field === 'undefined') { note('Walking needs the game’s field, which didn’t load.'); return; }
    drag = null; armed = false;
    const id = cur, at0 = dropPoint(id);
    walking = true; walkHost.hidden = false; cv.hidden = true; renderWalk();
    const opts = {
      maps: { [id]: walkCopy(id) }, src, speed: 110, zoom: 0.7, ioH: 52, paintedIo, paintedFolk, pace: 1.7, ioScreen: 0.15, showWalk: false,
      isDone: () => false,
      onExit: (ex) => note('The way out to ' + E.placeName(MAPS, ex.to) + '. On this page she stays on this map.'),
      onTalk: (p) => note(p.name + ' is here. Talking is off on this page.'),
      onSpot: (s) => { const it = s.item && BY[s.item]; note(it ? mark(it) + it.name + ' (' + WEAR[it.wear].toLowerCase() + '): ' + it.does + '.' : (s.label || s.kind) + ': nothing happens on this page.'); },
      onMenu: () => stopWalk(),
    };
    try {
      field = window.Field.create(walkHost, opts);
      const menu = field.root.querySelector('.field-menu');
      if (menu) { menu.textContent = '✎ Back to placing'; menu.setAttribute('aria-label', 'Back to placing'); }
      await field.load(id, at0, 's');
    } catch (e) { stopWalk(); note('Walking couldn’t start: ' + (e && e.message ? e.message : e)); }
  }
  function stopWalk() {
    if (!walking) return;
    if (field) { field.stop(); field.root.remove(); field = null; }
    walking = false; walkHost.hidden = true; cv.hidden = false;
    renderWalk(); draw();
  }
  function renderWalk() {
    const b = $('ip-walk');
    b.setAttribute('aria-pressed', walking ? 'true' : 'false'); b.textContent = walking ? 'Back to placing' : 'Walk it';
    $('ip-plate').hidden = walking; renderHelp();
  }
  $('ip-walk').addEventListener('click', () => (walking ? stopWalk() : startWalk()));

  // ---------- the panel ----------
  let noteT = 0;
  function note(text) { const n = $('ip-note'); n.textContent = text; n.hidden = false; clearTimeout(noteT); noteT = setTimeout(() => { n.hidden = true; }, 3600); }
  function openMap(id, centre) {
    if (walking) stopWalk();
    cur = id; ui.map = id; armed = armed && !onMap(ui.pick, id); saveUI();
    imgOf(id); if (centre) centreOn(centre[0], centre[1]); else fit();
    renderAll();
  }
  function stateOf(it) {
    const p = placeOf(it.id);
    if (!p) return { chip: 'not placed', cls: '', text: 'Not placed yet. Proposed: ' + it.where + '.' };
    if (p.reward) return { chip: 'a reward', cls: 'is-reward', text: 'A reward, from a fight or a person, not lying on a map. Proposed: ' + it.where + '.' };
    const out = outOf(p.map).has(it.id);
    return { chip: out ? 'out of reach' : MAPS[p.map].name, cls: out ? 'is-out' : 'is-placed', out,
      text: out ? 'On ' + MAPS[p.map].name + ', but Io can’t get near enough to pick it up there. Move it onto ground she can reach, or draw her a way there in the Walking Paths page.' : 'Lies on ' + MAPS[p.map].name + '. Io can reach it.' };
  }
  const rows = {};
  function buildList() {
    const host = $('ip-groups');
    for (const [wear, title, n] of GROUPS) {
      const grp = el('div', { class: 'ip-group' }, host);
      const h = el('h3', null, grp); el('i', { class: 'ip-dot ' + wear }, h); h.appendChild(document.createTextNode(title + ' ')); el('small', null, h, '(' + n + ')');
      const ul = el('ul', { class: 'ip-list' }, grp);
      for (const it of ITEMS.filter((x) => x.wear === wear)) {
        const li = el('li', null, ul), b = el('button', { type: 'button', class: 'ip-item', 'aria-pressed': 'false' }, li);
        el('i', { class: 'ip-dot ' + wear, 'aria-hidden': 'true' }, b);
        const name = el('span', { class: 'ip-name' }, b);
        if (it.secret) el('span', { class: 'ip-star', title: 'One of the two hidden ones' }, name, '★ ');
        if (it.special) el('span', { class: 'ip-star ip-special', title: 'One of the four specials, on top of the totals' }, name, '✦ ');
        name.appendChild(document.createTextNode(it.name));
        const chip = el('span', { class: 'mp-chip' }, b);
        const where = el('span', { class: 'ip-where' }, b, it.does);
        b.addEventListener('click', () => pick(it.id, true));
        rows[it.id] = { b, chip, where };
      }
    }
  }
  function renderList() {
    let placed = 0, rewards = 0, out = 0;
    for (const it of ITEMS) {
      const r = rows[it.id], s = stateOf(it), p = placeOf(it.id);
      if (p && p.reward) rewards++; else if (p) { placed++; if (s.out) out++; }
      r.b.setAttribute('aria-pressed', it.id === ui.pick ? 'true' : 'false');
      r.chip.textContent = s.chip; r.chip.className = 'mp-chip ' + s.cls;
    }
    const left = ITEMS.length - placed - rewards;
    $('ip-count').textContent = placed + ' on the maps, ' + rewards + ' given as rewards, ' + left + ' not placed yet' + (out ? '; ' + out + ' out of Io’s reach.' : '.');
  }
  function renderCard() {
    const it = BY[ui.pick], card = $('ip-card'), s = stateOf(it), p = placeOf(it.id);
    card.textContent = '';
    const h = el('h3', null, card, mark(it) + it.name);
    h.title = it.secret ? 'One of the two hidden ones' : it.special ? 'One of the four specials' : '';
    const meta = el('div', { class: 'ip-meta' }, card);
    const who = el('span', { class: 'mp-chip' }, meta, WEAR[it.wear]); who.style.color = C[it.wear]; who.style.borderColor = rgba(C[it.wear], 0.55);
    if (it.secret) el('span', { class: 'mp-chip' }, meta, 'Hidden: a quarter of the totals');
    if (it.special) el('span', { class: 'mp-chip' }, meta, 'Special: on top of the totals');
    el('span', { class: 'mp-chip' }, meta, 'Band ' + it.band);
    el('p', { class: 'ip-does' }, card, it.does + '.');
    el('p', { class: 'ip-line' }, card, '“' + it.line + '”');
    el('p', { class: 'ip-state' + (s.out ? ' is-bad' : p && !p.reward ? ' is-good' : '') }, card, s.text);
    const row = el('div', { class: 'mp-row' }, card);
    const put = el('button', { type: 'button', class: armed ? '' : 'mp-primary', 'aria-pressed': armed ? 'true' : 'false' }, row,
      armed ? 'Now click the painting…' : onMap(it.id, cur) ? 'Put it somewhere else here' : 'Put it on this map');
    put.addEventListener('click', () => { armed = !armed; renderAll(); cv.focus(); });
    if (p && !p.reward) { const go = el('button', { type: 'button' }, row, p.map === cur ? 'Show it' : 'Go to it'); go.addEventListener('click', () => pick(it.id, true)); }
    const rew = el('button', { type: 'button', 'aria-pressed': p && p.reward ? 'true' : 'false' }, row, 'A reward instead');
    rew.title = 'It doesn’t lie on a map: a fight or a person gives it';
    rew.addEventListener('click', () => (p && p.reward ? unplace(it.id) : makeReward(it.id)));
    if (p) { const del = el('button', { type: 'button' }, row, 'Not placed'); del.addEventListener('click', () => unplace(it.id)); }
    const lab = el('label', { for: 'ip-note-' + it.id }, card, 'Your note: where, who gives it, or anything else');
    const ta = el('textarea', { id: 'ip-note-' + it.id, rows: '2' }, lab);
    ta.value = work.notes[it.id] || '';
    ta.addEventListener('input', () => { work.notes[it.id] = ta.value; saveSoon(); renderSend(); });
    el('p', { class: 'ip-from' }, card, 'From ' + it.from + '. Its look, for its picture: ' + it.look + '.');
    cv.classList.toggle('is-placing', armed);
  }
  const mapRows = {};
  function buildMaps() {
    const ul = $('ip-maps');
    for (const id of IDS) {
      const li = el('li', null, ul), b = el('button', { type: 'button', class: 'mp-map-pick' }, li, MAPS[id].name), n = el('span', { class: 'ip-n' }, li);
      b.addEventListener('click', () => openMap(id));
      mapRows[id] = { li, b, n };
    }
  }
  function renderMaps() {
    for (const id of IDS) {
      const r = mapRows[id], k = itemsOn(id).length;
      r.li.classList.toggle('is-current', id === cur); r.b.setAttribute('aria-current', id === cur ? 'true' : 'false');
      r.n.textContent = k ? k + (k === 1 ? ' item' : ' items') : '';
    }
    $('ip-plate-name').textContent = MAPS[cur].name;
    const k = itemsOn(cur).length, chip = $('ip-plate-chip'); chip.hidden = !k; chip.textContent = k + (k === 1 ? ' item' : ' items');
  }
  function renderHelp() {
    $('ip-help').textContent = walking
      ? 'Walk her with the arrows, the pad, or by holding or tapping. Each item glints faintly, as the hidden ones do in the game; stand by one and press the action button to see it.'
      : armed ? 'Click the painting where ' + BY[ui.pick].name + ' should lie. Escape stops.'
        : 'Pick an item on the right, press Put it on this map, then click the painting. Drag a glint to move it; Delete takes the picked one off. Drag the painting to look round; the wheel zooms.';
  }
  function bindLayers() {
    for (const k of ['walk', 'block', 'exits', 'people', 'names']) {
      const box = $('ip-l-' + k); box.checked = !!ui.layers[k];
      box.addEventListener('change', () => { ui.layers[k] = box.checked; saveUI(); draw(); });
    }
  }

  // ---------- sending to Claude ----------
  // one document per item: where it is, or that it's a reward, or that it isn't placed, and Chris's note
  let db = null, sending = false;
  const docOf = (it) => { const p = placeOf(it.id); return { item: it.id, name: it.name, wear: it.wear, map: p && !p.reward ? p.map : null, x: p && !p.reward ? p.x : null, y: p && !p.reward ? p.y : null, reward: !!(p && p.reward), note: work.notes[it.id] || '' }; };
  const bodyKey = (it) => JSON.stringify(docOf(it));
  const unsent = () => ITEMS.filter((it) => ui.sent[it.id] !== bodyKey(it));
  function renderSend() {
    const n = unsent().length;
    $('ip-kept').textContent = 'Your places are kept in this browser as you go.' + (db ? (n ? ' ' + n + (n === 1 ? ' item has' : ' items have') + ' changed since you last sent them.' : ' Claude has every place as it is now.') : '');
    const b = $('ip-send'); b.disabled = sending || !n; b.textContent = sending ? 'Sending…' : 'Send my item places';
  }
  async function send() {
    if (!db || sending) return;
    const list = unsent(); if (!list.length) return;
    sending = true; renderSend(); setStatus('Sending ' + list.length + (list.length === 1 ? ' item…' : ' items…'), '');
    try {
      for (const it of list) {
        const body = Object.assign(docOf(it), { sent: new Date().toISOString() });
        await db.doc('places/' + it.id).set(body);
        ui.sent[it.id] = bodyKey(it); saveUI();
      }
      setStatus('Sent. Claude has all twenty as you placed them.', 'is-good');
    } catch (e) {
      setStatus('That didn’t go through (' + ((e && e.code) || 'unknown') + '). Your places are still here; try again in a moment, or copy them below.', 'is-bad');
    }
    sending = false; renderSend();
  }
  function setStatus(text, cls) { const s = $('ip-status'); s.textContent = text; s.className = 'mp-status ' + (cls || ''); }
  $('ip-send').addEventListener('click', send);
  $('ip-copy').addEventListener('click', async () => {
    const text = JSON.stringify({ page: 'item-places', items: ITEMS.map(docOf) }, null, 1), box = $('ip-copybox');
    box.value = text; box.hidden = false;
    try { await navigator.clipboard.writeText(text); setStatus('Copied. Paste it to Claude in the chat.', 'is-good'); }
    catch (e) { box.focus(); box.select(); setStatus('Select the text below and copy it, then paste it to Claude in the chat.', ''); }
  });
  (async () => {
    try { db = await (window.claude && window.claude.use ? window.claude.use('db').catch(() => null) : null); } catch (e) { db = null; }
    $('ip-send-wait').hidden = true;
    if (db) $('ip-send-row').hidden = false;
    else { $('ip-send-wait').hidden = false; $('ip-send-wait').textContent = 'This copy of the page can’t send to Claude. Copy your places instead, and paste them in the chat.'; }
    renderSend();
  })();

  function renderAll() { renderList(); renderCard(); renderMaps(); renderHelp(); renderSend(); draw(); }
  buildList(); buildMaps(); bindLayers(); imgOf(cur); renderWalk(); renderAll();
  // headless checks read the page's state through this
  window.__itemPlaces = { work, ui, outOf, putHere: (id, x, y) => { ui.pick = id; putHere(id, x, y); }, openMap, startWalk, stopWalk, get walking() { return walking; } };
})();
