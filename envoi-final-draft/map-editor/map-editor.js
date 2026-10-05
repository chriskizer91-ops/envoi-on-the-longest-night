// map-editor.js: the map editor (the final draft, October 4, 2026), Chris's one tool for the game's 21 walking maps. It
// is the Walking Paths page (envoi-game-pass-3/map-paths/map-paths.js), whose path tools it keeps as they were, with the
// keepsakes placed on the same maps. In Walking paths he fixes where Io can walk: the walk areas and the blocks cut out
// of them, the fronts drawn over her, and the places of the exits, people, spots and arrivals. In Keepsakes he puts each
// of the fourteen keepsakes that lie on a map (window.LOOT, ../items/items.js) where it will be found. Both check what Io
// can reach on the paths as he has drawn them, and both walk her there with the game's own field (src/game/field.js, at
// the game's settings), where each keepsake glints as the hidden ones do and shows its card when she finds it.
// He sends it all to Claude: one document per map in the page's db (edits/<map id>, as Walking Paths did) and one per
// keepsake (places/<keepsake id>), or as text to copy ("Copy my work"), which is all it offers when it can't reach its
// store (opened outside claude.ai).
// Every change is kept in this browser as he works (localStorage, when it is there; the paths under the names Walking
// Paths used).
// The ideas and the feel are Witch Way's scene editor's (follow-me-down-witch-way, game/src/editor.js): draw and drag
// the shapes, add and delete points, undo, zoom and pan.
// Positions are the paintings' own 1536 x 1024 pixels, as in maps.js. Needs MAPS (maps.js), Field (field.js),
// makePaintedIo (painted-io.js), makePixelIo (pixel-io.js), makeFolk (sprites.js), MapEdits (edits-core.js) and LOOT
// (items.js).
(function () {
  'use strict';
  const E = window.MapEdits, MAPS = window.MAPS, IDS = Object.keys(MAPS);
  const ITEMS = (window.LOOT && window.LOOT.ITEMS) || [], BY = {};
  for (const it of ITEMS) BY[it.id] = it;
  const { MW, MH, CELL, GW } = E;
  const STORE = 'envoi.map-paths.v1', UI_STORE = 'envoi.map-paths.ui.v1', KEEP_STORE = 'envoi.map-editor.keepsakes.v1';
  // the art's address: in this folder it loads from ../../art; the build puts it inside the page as data: URLs
  const src = (p) => (String(p).startsWith('data:') ? p : (window.ART_BASE != null ? window.ART_BASE : '../../') + p);
  const GAME = E.mirrorGame();
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const clampPt = (x, y) => [clamp(Math.round(x), 0, MW), clamp(Math.round(y), 0, MH)];
  const isShape = (k) => k === 'walk' || k === 'block' || k === 'front';
  const KIND = { walk: 'walk area', block: 'block', front: 'front' };
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function el(tag, attrs, parent, text) { const e = document.createElement(tag); if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]); if (text != null) e.textContent = text; if (parent) parent.appendChild(e); return e; }
  // this browser's copy of the work: every read and write guarded, and the page works without it
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  };
  // the layers' colours come from the page's CSS variables
  const css = getComputedStyle(document.documentElement), C = {};
  for (const k of ['walk', 'block', 'front', 'exit', 'arrive', 'people', 'reach', 'island', 'gold', 'deep', 'io', 'problem', 'bad', 'secret', 'pic']) C[k] = css.getPropertyValue('--' + k).trim() || '#ffffff';
  // who may wear a keepsake: the colour of its glint, its dot in the list and its card
  const WEARC = { io: css.getPropertyValue('--wear-io').trim() || '#ff7fc8', sol: css.getPropertyValue('--wear-sol').trim() || '#ffae5a', either: css.getPropertyValue('--wear-either').trim() || '#ffe28f' };
  const rgba = (hex, a) => { let h = hex.replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); const n = parseInt(h, 16); return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; };

  // ---------- the edits ----------
  // works: each map's edits (its parts as MapEdits.traced gives them), from the moment it is opened; bases: the
  // fingerprint of the tracing a map's edits were made on; stale: edits made on an older tracing than maps.js has now;
  // hist: each map's undo and redo; views: where each map was looked at; lastIo: where Io stood when a walk ended
  const works = {}, bases = {}, stale = {}, hist = {}, tracedGeom = {}, views = {}, lastIo = {};
  const ui = Object.assign({ map: IDS[0], mode: 'paths', pick: ITEMS.length ? ITEMS[0].id : null, layers: {}, showPaths: false, sent: {}, itemSent: {} }, store.get(UI_STORE) || {});
  ui.layers = Object.assign({ walk: true, block: true, front: true, exits: true, people: true, reach: false, items: true, names: false }, ui.layers && typeof ui.layers === 'object' ? ui.layers : {});
  if (!ui.sent || typeof ui.sent !== 'object') ui.sent = {};
  if (!ui.itemSent || typeof ui.itemSent !== 'object') ui.itemSent = {};
  if (ui.mode !== 'keepsakes') ui.mode = 'paths';
  if (!BY[ui.pick]) ui.pick = ITEMS.length ? ITEMS[0].id : null;
  let cur = IDS.includes(ui.map) ? ui.map : IDS[0];
  let ver = 0; // goes up with every change: the stand test and the reach check are made again from it

  const tracedOf = (id) => E.traced(MAPS, id);
  const geomOf = (id) => tracedGeom[id] || (tracedGeom[id] = E.geom(tracedOf(id)));
  function W(id) { id = id || cur; return works[id] || (works[id] = tracedOf(id)); }
  const isChanged = (id) => !!works[id] && E.geom(works[id]) !== geomOf(id);
  const baseOf = (id) => bases[id] || E.hash(geomOf(id));
  const geomHash = (id) => E.hash(works[id] ? E.geom(works[id]) : geomOf(id));

  // the edits kept in this browser, laid over a fresh tracing: the shapes as kept; the exits, people, spots and
  // arrivals matched to the tracing's own (so a later change to maps.js can't move one onto the wrong thing)
  function reconcile(t, s) {
    const num = Number.isFinite, isPt = (p) => Array.isArray(p) && p.length === 2 && p.every(num);
    const isPoly = (p) => Array.isArray(p) && p.length >= 3 && p.every(isPt), isRect = (r) => Array.isArray(r) && r.length === 4 && r.every(num);
    const w = E.clone(t);
    if (Array.isArray(s.walk) && s.walk.every(isPoly)) w.walk = s.walk;
    if (Array.isArray(s.block) && s.block.every(isPoly)) w.block = s.block;
    if (Array.isArray(s.front) && s.front.every((f) => f && isPoly(f.pts) && num(f.base))) w.front = s.front.map((f) => ({ pts: f.pts, base: f.base }));
    w.exits.forEach((e, k) => { const o = (s.exits || [])[k]; if (o && o.to === e.to && isRect(o.rect)) e.rect = o.rect; });
    w.people.forEach((n) => { const o = (s.people || []).find((x) => x && x.id === n.id); if (o && isPt(o.at)) n.at = o.at; });
    w.spots.forEach((p, k) => {
      const o = (s.spots || [])[k]; if (!o || o.kind !== p.kind || (o.id || null) !== (p.id || null)) return;
      if (p.rect) { if (isRect(o.rect)) p.rect = o.rect; } else if (isPt(o.at)) p.at = o.at;
    });
    if (isPt(s.start)) w.start = s.start;
    w.arrivals.forEach((a) => { const o = (s.arrivals || []).find((x) => x && E.arrivalKey(x) === E.arrivalKey(a)); if (o && isPt(o.at)) a.at = o.at; });
    return w;
  }
  (function loadKept() {
    const data = store.get(STORE);
    if (!data || typeof data !== 'object' || !data.maps || typeof data.maps !== 'object') return;
    for (const id of IDS) {
      const s = data.maps[id];
      if (!s || !s.work || typeof s.work !== 'object') continue;
      try {
        const w = reconcile(tracedOf(id), s.work);
        if (E.geom(w) === geomOf(id)) continue; // the game has these edits now (or there were none)
        works[id] = w; bases[id] = typeof s.base === 'string' ? s.base : E.hash(geomOf(id)); stale[id] = bases[id] !== E.hash(geomOf(id));
      } catch (e) { /* a damaged entry is left out */ }
    }
  })();
  let saveT = 0, kept = true;
  function saveSoon() { clearTimeout(saveT); saveT = setTimeout(save, 300); }
  function save() {
    clearTimeout(saveT);
    const maps = {};
    for (const id of IDS) if (isChanged(id)) maps[id] = { base: baseOf(id), savedAt: new Date().toISOString(), work: works[id] };
    kept = store.set(STORE, { version: 1, maps });
    renderKept();
  }
  function saveUI() { ui.map = cur; store.set(UI_STORE, ui); }

  // ---------- the keepsakes: where each one that lies on a map is ----------
  // Fourteen of the twenty lie on a map: the two hidden ones and the twelve found there. places[id] is { map, x, y }, or
  // null for one Chris took off its map; the gifts and the Colossus's two have none. notes[id]: his own words about any
  // of the twenty. Each starts where the list puts it (items.js `at`): the two hidden ones where they lie in the game
  // today, the twelve where Claude put them, away from the main ways through
  const lies = (it) => it.source === 'hidden' || it.source === 'found';
  const kw = { places: {}, notes: {} };
  (function loadKeepsakes() {
    const d = store.get(KEEP_STORE), ok = (p) => !!p && typeof p === 'object' && !!MAPS[p.map] && Number.isFinite(p.x) && Number.isFinite(p.y);
    const places = d && typeof d === 'object' && d.places && typeof d.places === 'object' ? d.places : {};
    for (const id of Object.keys(places)) {
      const it = BY[id], p = places[id];
      if (!it || !lies(it)) continue;
      if (p === null && it.at) kw.places[id] = null;
      else if (ok(p)) kw.places[id] = { map: p.map, x: clamp(Math.round(p.x), 0, MW), y: clamp(Math.round(p.y), 0, MH) };
    }
    const notes = d && typeof d === 'object' && d.notes && typeof d.notes === 'object' ? d.notes : {};
    for (const id of Object.keys(notes)) if (BY[id] && typeof notes[id] === 'string') kw.notes[id] = notes[id];
    for (const it of ITEMS) if (lies(it) && it.at && MAPS[it.home] && !(it.id in kw.places)) kw.places[it.id] = { map: it.home, x: it.at[0], y: it.at[1] };
  })();
  const placeOf = (id) => kw.places[id] || null;
  const onMap = (id, map) => { const p = placeOf(id); return !!p && p.map === map; };
  const itemsOn = (map) => ITEMS.filter((it) => lies(it) && onMap(it.id, map));
  let keepT = 0, keepKept = true;
  function saveKeepSoon() { clearTimeout(keepT); keepT = setTimeout(saveKeep, 250); }
  function saveKeep() { clearTimeout(keepT); keepKept = store.set(KEEP_STORE, { version: 1, places: kw.places, notes: kw.notes }); renderKept(); }
  // their own undo and redo, apart from each map's
  const khist = { u: [], r: [] };
  function keepSnap(json) { khist.u.push(json || JSON.stringify(kw.places)); if (khist.u.length > 200) khist.u.shift(); khist.r.length = 0; }

  // ---------- undo and redo, each map its own ----------
  const H = (id) => hist[id] || (hist[id] = { u: [], r: [] });
  function pushUndo(id, json) { const h = H(id); h.u.push(json); if (h.u.length > 200) h.u.shift(); h.r.length = 0; if (!bases[id]) bases[id] = E.hash(geomOf(id)); }
  const snap = (id) => pushUndo(id || cur, JSON.stringify(W(id || cur)));
  function undo() {
    if (walking) stopWalk();
    if (ui.mode === 'keepsakes') {
      if (!khist.u.length) { note('Nothing to undo among the keepsakes.'); return; }
      khist.r.push(JSON.stringify(kw.places)); kw.places = JSON.parse(khist.u.pop()); armed = false; keepChanged('Undone.'); return;
    }
    if (drawing) { popPoint(); return; }
    const h = H(cur); if (!h.u.length) { note('Nothing to undo on this map.'); return; }
    h.r.push(JSON.stringify(W())); works[cur] = JSON.parse(h.u.pop()); changed('Undone.');
  }
  function redo() {
    if (walking) stopWalk();
    if (ui.mode === 'keepsakes') {
      if (!khist.r.length) { note('Nothing to redo.'); return; }
      khist.u.push(JSON.stringify(kw.places)); kw.places = JSON.parse(khist.r.pop()); armed = false; keepChanged('Redone.'); return;
    }
    if (drawing) return;
    const h = H(cur); if (!h.r.length) { note('Nothing to redo.'); return; }
    h.u.push(JSON.stringify(W())); works[cur] = JSON.parse(h.r.pop()); changed('Redone.');
  }
  // after every change to a map: keep it, check it again, and show it
  function changed(msg) {
    ver++;
    if (sel && !selValid(sel)) sel = null;
    saveSoon(); reachSoon(); renderMaps(); renderPicked(); renderKeep(); renderUndo(); renderSend(); draw();
    if (msg) note(msg);
  }
  // after every change to where a keepsake is: keep it, check what she can reach again, and show it
  function keepChanged(msg) {
    ver++;
    saveKeepSoon(); reachSoon(); renderMaps(); renderKeep(); renderUndo(); renderSend(); renderHelp(); cursor(); draw();
    if (msg) note(msg);
  }

  // ---------- the view: the painting, zoomed and moved ----------
  const cv = $('mp-cv'), g = cv.getContext('2d'), stage = $('mp-stage');
  let DPR = 1, SW = 1, SH = 1, sized = false;
  const view = { x: 0, y: 0, z: 0.5 }; // on the canvas: (map position - view) * z, in CSS pixels
  const fitZ = () => Math.min(SW / MW, SH / MH);
  function fit() { view.z = fitZ() * 0.97; view.x = (MW - SW / view.z) / 2; view.y = (MH - SH / view.z) / 2; draw(); readout(); }
  // part of the painting always stays in view
  function clampView() { const vw = SW / view.z, vh = SH / view.z; view.x = clamp(view.x, -vw * 0.5, MW - vw * 0.5); view.y = clamp(view.y, -vh * 0.5, MH - vh * 0.5); }
  function zoomAt(sx, sy, k) {
    const z = clamp(view.z * k, fitZ() * 0.5, 12), mx = view.x + sx / view.z, my = view.y + sy / view.z;
    view.z = z; view.x = mx - sx / z; view.y = my - sy / z; clampView(); draw(); readout();
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
  // the paintings, loaded as each map is opened
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

  // ---------- what is under the mouse ----------
  let tool = 'select', sel = null, hover = null, drawing = null, drag = null, mouse = null, spaceDown = false, lastInsertT = -1e9;
  // in Keepsakes: whether the next click on the painting puts the picked keepsake there, and the glint under the mouse
  let armed = false, hoverItem = null;
  const ptsOf = (w, k, i) => (k === 'front' ? w.front[i].pts : w[k][i]);
  const inR = (r, m) => m.x >= r[0] && m.x <= r[2] && m.y >= r[1] && m.y <= r[3];
  // a front's base line ends in a diamond, a little right of the piece: drag it to move the line
  function baseHandle(f) { const b = E.bbox(f.pts); return [b[2] + 14 / view.z, f.base]; }
  function pointRef(s) { const w = W(); return s.kind === 'person' ? w.people[s.i].at : s.kind === 'spot' ? w.spots[s.i].at : s.kind === 'arrival' ? w.arrivals[s.i].at : w.start; }
  function rectRef(s) { const w = W(); return s.kind === 'exit' ? w.exits[s.i].rect : w.spots[s.i].rect; }
  function selValid(s) {
    const w = W();
    if (isShape(s.kind)) return s.i < w[s.kind].length && (s.sub == null || s.sub < ptsOf(w, s.kind, s.i).length);
    if (s.kind === 'exit') return s.i < w.exits.length;
    if (s.kind === 'person') return s.i < w.people.length;
    if (s.kind === 'spot') return s.i < w.spots.length;
    if (s.kind === 'arrival') return s.i < w.arrivals.length;
    return s.kind === 'start';
  }
  // most specific first: the picked shape's points, any shape's points, the dots, the rectangles' corners, the exits,
  // then the shapes themselves (the smallest under the mouse; walk areas after blocks and fronts)
  function hitTest(m) {
    const w = W(), L = ui.layers, R = 7 / view.z, R2 = R * R;
    const d2 = (p) => (p[0] - m.x) ** 2 + (p[1] - m.y) ** 2;
    const kinds = ['front', 'block', 'walk'].filter((k) => L[k]);
    if (sel && isShape(sel.kind) && L[sel.kind]) {
      const pts = ptsOf(w, sel.kind, sel.i); let best = -1, bd = R2;
      pts.forEach((p, j) => { const d = d2(p); if (d <= bd) { bd = d; best = j; } });
      if (best >= 0) return { kind: sel.kind, i: sel.i, sub: best, drag: 'vertex' };
      if (sel.kind === 'front' && d2(baseHandle(w.front[sel.i])) <= R2 * 2) return { kind: 'front', i: sel.i, drag: 'base' };
      for (let j = 0; j < pts.length; j++) { const a = pts[j], b = pts[(j + 1) % pts.length]; if (d2([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]) <= R2) return { kind: sel.kind, i: sel.i, at: j, drag: 'insert' }; }
    }
    let best = null, bd = R2;
    for (const k of kinds) w[k].forEach((s, i) => ptsOf(w, k, i).forEach((p, j) => { const d = d2(p); if (d < bd) { bd = d; best = { kind: k, i, sub: j, drag: 'vertex' }; } }));
    if (best) return best;
    if (L.front) for (let i = w.front.length - 1; i >= 0; i--) if (d2(baseHandle(w.front[i])) <= R2 * 2) return { kind: 'front', i, drag: 'base' };
    best = null; bd = (R + 4 / view.z) ** 2;
    const dot = (p, h) => { const d = d2(p); if (d < bd) { bd = d; best = h; } };
    // (the hidden keepsakes' own spots are keepsakes on this page, placed in Keepsakes)
    if (L.people) { w.people.forEach((n, i) => dot(n.at, { kind: 'person', i })); w.spots.forEach((s, i) => { if (!s.rect && s.kind !== 'keepsake') dot(s.at, { kind: 'spot', i }); }); }
    if (L.exits) { w.arrivals.forEach((a, i) => dot(a.at, { kind: 'arrival', i })); dot(w.start, { kind: 'start', i: 0 }); }
    if (best) { best.drag = 'point'; return best; }
    const rects = [];
    if (L.exits) w.exits.forEach((e, i) => rects.push({ kind: 'exit', i, r: e.rect }));
    if (L.people) w.spots.forEach((s, i) => { if (s.rect) rects.push({ kind: 'spot', i, r: s.rect }); });
    for (const q of rects) { const r = q.r, cs = [[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]]; for (let c = 0; c < 4; c++) if (d2(cs[c]) <= R2) return { kind: q.kind, i: q.i, sub: c, drag: 'corner' }; }
    if (L.exits) for (let i = w.exits.length - 1; i >= 0; i--) if (inR(w.exits[i].rect, m)) return { kind: 'exit', i, drag: 'rect' };
    const hits = [];
    for (const k of kinds) w[k].forEach((s, i) => { const pts = ptsOf(w, k, i); if (E.inPoly(pts, m.x, m.y)) hits.push({ kind: k, i, a: E.area(pts) + (k === 'walk' ? 1e8 : 0) }); });
    if (L.people) w.spots.forEach((s, i) => { if (s.rect && inR(s.rect, m)) hits.push({ kind: 'spot', i, a: 2e8 + (s.rect[2] - s.rect[0]) * (s.rect[3] - s.rect[1]) }); });
    if (!hits.length) return null;
    hits.sort((a, b) => a.a - b.a);
    const h = { kind: hits[0].kind, i: hits[0].i, drag: 'body' };
    // the picked shape is under the mouse too: a drag moves it, a click picks the smaller one
    const p = hits.find((x) => sel && x.kind === sel.kind && x.i === sel.i);
    if (p && p !== hits[0]) h.picked = { kind: p.kind, i: p.i };
    return h;
  }
  const sameHit = (a, b) => (!a && !b) || (a && b && a.kind === b.kind && a.i === b.i && a.sub === b.sub && a.drag === b.drag);
  // the nearest edge of a shape to a point (the picked shape's first), for a double-click that adds a point there
  function edgeAt(m) {
    const w = W(), L = ui.layers, R = 8 / view.z;
    let best = null, bd = R;
    const test = (k, i) => {
      const pts = ptsOf(w, k, i);
      for (let j = 0; j < pts.length; j++) {
        const a = pts[j], b = pts[(j + 1) % pts.length], vx = b[0] - a[0], vy = b[1] - a[1], L2 = vx * vx + vy * vy;
        const t = L2 ? clamp(((m.x - a[0]) * vx + (m.y - a[1]) * vy) / L2, 0, 1) : 0, q = [a[0] + vx * t, a[1] + vy * t];
        const d = Math.hypot(q[0] - m.x, q[1] - m.y);
        if (d < bd) { bd = d; best = { kind: k, i, j, p: clampPt(q[0], q[1]) }; }
      }
    };
    if (sel && isShape(sel.kind) && L[sel.kind]) { test(sel.kind, sel.i); if (best) return best; }
    for (const k of ['front', 'block', 'walk']) if (L[k]) w[k].forEach((s, i) => test(k, i));
    return best;
  }

  // ---------- the mouse ----------
  function select(s) {
    sel = s ? { kind: s.kind, i: s.i || 0 } : null;
    if (s && s.sub != null) sel.sub = s.sub;
    renderPicked(); draw();
  }
  // a drag: what it moves, where it began, and the map before it (undo gets it once something really moves)
  function begin(e, m, type, extra) { drag = Object.assign({ type, sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y, start: m, before: JSON.stringify(W()), live: false }, extra || {}); }
  function moveOrig(h) { const w = W(); if (h.kind === 'front') return E.clone(w.front[h.i]); if (isShape(h.kind)) return E.clone(w[h.kind][h.i]); return rectRef(h).slice(); }
  cv.addEventListener('pointerdown', (e) => {
    if (walking) return;
    try { cv.focus({ preventScroll: true }); cv.setPointerCapture(e.pointerId); } catch (er) { /* fine without */ }
    const m = at(e); mouse = m;
    if (e.button === 1 || e.button === 2 || (e.button === 0 && spaceDown)) { e.preventDefault(); drag = { type: 'pan', sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y }; cursor(); return; }
    if (e.button !== 0) return;
    if (ui.mode === 'keepsakes') { keepDown(e, m); cursor(); return; }
    if (tool !== 'select') { begin(e, m, 'click-point'); return; }
    const h = hitTest(m);
    if (!h) { begin(e, m, 'click-empty'); return; }
    const w = W();
    if (h.drag === 'vertex') { select(h); const p = ptsOf(w, h.kind, h.i)[h.sub]; begin(e, m, 'vertex', { h, off: [p[0] - m.x, p[1] - m.y] }); }
    else if (h.drag === 'insert') {
      // dragging the middle of an edge adds a point there
      snap(); const pts = ptsOf(w, h.kind, h.i), a = pts[h.at], b = pts[(h.at + 1) % pts.length];
      pts.splice(h.at + 1, 0, clampPt((a[0] + b[0]) / 2, (a[1] + b[1]) / 2));
      const v = { kind: h.kind, i: h.i, sub: h.at + 1 }; select(v); begin(e, m, 'vertex', { h: v, off: [0, 0], before: null, inserted: true }); ver++; lastInsertT = performance.now();
    }
    else if (h.drag === 'base') { select({ kind: 'front', i: h.i }); begin(e, m, 'base', { h, off: w.front[h.i].base - m.y }); }
    else if (h.drag === 'point') { select(h); const p = pointRef(h); begin(e, m, 'point', { h, off: [p[0] - m.x, p[1] - m.y] }); }
    else if (h.drag === 'corner') { select({ kind: h.kind, i: h.i }); begin(e, m, 'corner', { h, orig: rectRef(h).slice() }); }
    else if (h.drag === 'rect') { select(h); begin(e, m, 'move', { h, orig: moveOrig(h) }); }
    else if (h.drag === 'body') {
      // shapes move only once picked, so a drag across a big walk area moves the view, not the walk area
      if (sel && sel.kind === h.kind && sel.i === h.i) begin(e, m, 'move', { h, orig: moveOrig(h), clickSel: h });
      else begin(e, m, 'maybe', { hit: h, picked: h.picked || null });
    }
    cursor();
  });
  cv.addEventListener('pointermove', (e) => {
    if (walking) return;
    const m = at(e); mouse = m;
    const d = drag;
    if (!d) {
      if (ui.mode === 'keepsakes') {
        const hi = !spaceDown && ui.layers.items ? hitItem(m) : null, id = hi ? hi.id : null;
        if (id !== hoverItem) { hoverItem = id; draw(); }
        cursor(); readout(); return;
      }
      const h = tool === 'select' && !spaceDown ? hitTest(m) : null;
      if (!sameHit(h, hover)) { hover = h; draw(); }
      if (drawing) draw();
      cursor(); readout(); return;
    }
    if (d.type === 'pan') { view.x = d.vx - (e.clientX - d.sx) / view.z; view.y = d.vy - (e.clientY - d.sy) / view.z; clampView(); draw(); readout(); return; }
    if (d.type === 'item') {
      // a keepsake moves once the mouse has really moved; undo gets the places from before
      if (!d.live && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) <= 3) return;
      if (!d.live) { d.live = true; keepSnap(d.before); }
      const p = placeOf(d.id); if (p) { p.x = clamp(Math.round(m.x), 0, MW); p.y = clamp(Math.round(m.y), 0, MH); }
      cursor(); draw(); readout(); return;
    }
    const far = Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 3;
    if (!far && !d.live) return;
    if (d.type === 'click-empty' || d.type === 'click-point' || (d.type === 'maybe' && !d.picked)) {
      drag = { type: 'pan', sx: d.sx, sy: d.sy, vx: d.vx, vy: d.vy }; view.x = d.vx - (e.clientX - d.sx) / view.z; view.y = d.vy - (e.clientY - d.sy) / view.z; clampView(); cursor(); draw(); return;
    }
    if (d.type === 'maybe') { d.type = 'move'; d.h = d.picked; d.orig = moveOrig(d.picked); }
    if (!d.live) { d.live = true; if (d.before) { pushUndo(cur, d.before); d.before = null; } }
    applyDrag(d, m); ver++; draw(); readout(); renderPicked();
  });
  function endDrag(e) {
    const d = drag; drag = null;
    if (!d || walking) return;
    if (d.type === 'item') { if (d.live) keepChanged(); else { cursor(); draw(); } return; }
    if (d.type === 'click-empty') { if (ui.mode === 'paths') select(null); }
    else if (d.type === 'click-point') addPoint(d.start);
    else if (d.type === 'maybe') select(d.hit);
    else if (d.live || d.inserted) changed(d.inserted && !d.live ? 'Point added in the middle of the edge.' : '');
    else if (d.clickSel) select(d.clickSel);
    if (e) { const h = tool === 'select' && ui.mode === 'paths' ? hitTest(at(e)) : null; hover = h; }
    cursor(); draw();
  }
  cv.addEventListener('pointerup', endDrag);
  cv.addEventListener('pointercancel', () => endDrag(null));
  cv.addEventListener('pointerleave', () => { if (!drag) { hover = null; mouse = null; readout(); draw(); } });
  cv.addEventListener('contextmenu', (e) => e.preventDefault());
  cv.addEventListener('wheel', (e) => {
    if (walking) return;
    e.preventDefault();
    const m = at(e), dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * 400 : e.deltaY;
    zoomAt(m.sx, m.sy, Math.exp(-clamp(dy, -400, 400) * 0.0015));
  }, { passive: false });
  cv.addEventListener('dblclick', (e) => {
    if (walking || ui.mode === 'keepsakes') return;
    if (drawing) { finishDrawing(); return; }
    if (tool !== 'select') return;
    if (performance.now() - lastInsertT < 700) return; // its first click already added a point at the edge's middle dot, or closed a new shape
    const h = edgeAt(at(e)); if (!h) return;
    const pts = ptsOf(W(), h.kind, h.i), a = pts[h.j], b = pts[(h.j + 1) % pts.length];
    if ((h.p[0] === a[0] && h.p[1] === a[1]) || (h.p[0] === b[0] && h.p[1] === b[1])) { note('That is already a point. Double-click further along the edge.'); return; }
    snap(); pts.splice(h.j + 1, 0, h.p); select({ kind: h.kind, i: h.i, sub: h.j + 1 }); changed('Point added.');
  });
  // what a drag does to the map
  function applyDrag(d, m) {
    const w = W(), h = d.h;
    if (d.type === 'vertex') ptsOf(w, h.kind, h.i)[h.sub] = clampPt(m.x + d.off[0], m.y + d.off[1]);
    else if (d.type === 'point') { const p = pointRef(h), q = clampPt(m.x + d.off[0], m.y + d.off[1]); p[0] = q[0]; p[1] = q[1]; }
    else if (d.type === 'base') w.front[h.i].base = clamp(Math.round(m.y + d.off), 0, MH);
    else if (d.type === 'corner') {
      const r = rectRef(h), o = d.orig, x = clamp(Math.round(m.x), 0, MW), y = clamp(Math.round(m.y), 0, MH), c = h.sub;
      if (c === 0 || c === 3) r[0] = Math.min(x, o[2] - 4); else r[2] = Math.max(x, o[0] + 4);
      if (c === 0 || c === 1) r[1] = Math.min(y, o[3] - 4); else r[3] = Math.max(y, o[1] + 4);
    } else if (d.type === 'move') {
      let dx = Math.round(m.x - d.start.x), dy = Math.round(m.y - d.start.y);
      if (isShape(h.kind)) {
        const o = d.orig, pts = h.kind === 'front' ? o.pts : o, b = E.bbox(pts);
        dx = clamp(dx, -b[0], MW - b[2]); dy = clamp(dy, -b[1], MH - b[3]);
        const moved = pts.map((p) => [p[0] + dx, p[1] + dy]);
        if (h.kind === 'front') { w.front[h.i].pts = moved; w.front[h.i].base = clamp(o.base + dy, 0, MH); } else w[h.kind][h.i] = moved;
      } else {
        const r = d.orig; dx = clamp(dx, -r[0], MW - r[2]); dy = clamp(dy, -r[1], MH - r[3]);
        const nr = [r[0] + dx, r[1] + dy, r[2] + dx, r[3] + dy];
        if (h.kind === 'exit') w.exits[h.i].rect = nr; else w.spots[h.i].rect = nr;
      }
    }
  }
  function cursor() {
    if (walking) return;
    let c = 'grab';
    if (drag && drag.type === 'pan') c = 'grabbing';
    else if (drag && drag.live) c = 'grabbing';
    else if (spaceDown) c = 'grab';
    else if (ui.mode === 'keepsakes') c = armed ? 'crosshair' : hoverItem ? 'move' : 'grab';
    else if (tool !== 'select') c = 'crosshair';
    else if (hover) c = hover.drag === 'body' ? (sel && sel.kind === hover.kind && sel.i === hover.i ? 'move' : 'pointer') : hover.drag === 'insert' ? 'copy' : 'move';
    if (cv.style.cursor !== c) cv.style.cursor = c;
  }

  // ---------- drawing a new shape ----------
  function addPoint(m) {
    if (!drawing) drawing = [];
    if (drawing.length >= 3) { const f = drawing[0]; if (Math.hypot((f[0] - m.x) * view.z, (f[1] - m.y) * view.z) <= 9) { finishDrawing(); return; } }
    const p = clampPt(m.x, m.y), l = drawing[drawing.length - 1];
    if (!l || l[0] !== p[0] || l[1] !== p[1]) drawing.push(p);
    renderPicked(); renderUndo(); draw();
  }
  function popPoint() {
    drawing.pop(); if (!drawing.length) drawing = null;
    note(drawing ? 'Took back the last point.' : 'Shape cancelled.'); renderPicked(); renderUndo(); draw();
  }
  function cancelDrawing() { drawing = null; renderPicked(); renderUndo(); draw(); }
  function finishDrawing() {
    if (!drawing) return;
    // a double-click to finish puts two points almost on top of each other: keep one
    const pts = drawing.filter((p, i, a) => i === 0 || Math.hypot((p[0] - a[i - 1][0]) * view.z, (p[1] - a[i - 1][1]) * view.z) > 4);
    drawing = null; lastInsertT = performance.now();
    if (pts.length < 3 || E.area(pts) < 1) { note('A shape needs at least three points.'); renderPicked(); renderUndo(); draw(); return; }
    snap();
    const w = W(), kind = tool;
    if (kind === 'front') w.front.push({ pts, base: Math.max.apply(null, pts.map((p) => p[1])) }); else w[kind].push(pts);
    const i = w[kind].length - 1;
    setTool('select'); select({ kind, i });
    changed(cap(KIND[kind]) + ' added.' + (kind === 'front' ? ' Its base line is at its foot: drag the diamond to move it.' : ''));
  }
  function setTool(t) {
    if (walking) stopWalk();
    if (drawing && t !== tool) drawing = null;
    tool = t;
    if (t !== 'select') {
      sel = null; hover = null;
      if (!ui.layers[t]) { ui.layers[t] = true; $('mp-l-' + t).checked = true; saveUI(); }
    }
    document.querySelectorAll('[data-tool]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.tool === t ? 'true' : 'false'));
    renderHelp(); renderPicked(); renderUndo(); cursor(); draw();
  }

  // ---------- changing what is picked ----------
  function deleteSel() {
    if (walking) stopWalk();
    if (!sel) { note('Pick a point or a shape first.'); return; }
    const w = W(), s = sel;
    if (!isShape(s.kind)) { note('Exits, people, spots and arrivals can be moved here, not deleted.'); return; }
    if (s.sub != null) {
      const pts = ptsOf(w, s.kind, s.i);
      if (pts.length <= 3) { note('A shape needs at least three points. To delete the whole shape, click inside it, then press Delete.'); return; }
      snap(); pts.splice(s.sub, 1); select({ kind: s.kind, i: s.i }); changed('Point deleted.'); return;
    }
    snap(); w[s.kind].splice(s.i, 1); select(null); changed(cap(KIND[s.kind]) + ' deleted. Undo brings it back.');
  }
  function smoothSel() {
    if (walking) stopWalk();
    if (!sel || !isShape(sel.kind)) { note('Pick a walk area, a block or a front first.'); return; }
    const w = W(), s = sel, pts = ptsOf(w, s.kind, s.i), only = s.sub != null ? s.sub : -1;
    if (only >= 0) { const p = pts[only]; if (p[0] <= 0 || p[0] >= MW || p[1] <= 0 || p[1] >= MH) { note('Points on the painting’s edge stay where they are, so the ways out keep their width.'); return; } }
    const out = E.smooth(pts, only);
    if (JSON.stringify(out) === JSON.stringify(pts)) { note('There is nothing to round there.'); return; }
    snap();
    if (s.kind === 'front') w.front[s.i].pts = out; else w[s.kind][s.i] = out;
    if (only >= 0) { select({ kind: s.kind, i: s.i, sub: Math.min(only + 1, out.length - 1) }); changed('Corner rounded.'); }
    else { select({ kind: s.kind, i: s.i }); changed('Smoothed: ' + pts.length + ' points became ' + out.length + '.' + (ui.layers.reach ? '' : ' Turn on “Where Io can reach” to check no way through got too narrow.')); }
  }
  // Shift and an arrow key: the picked thing moves one pixel; a run of nudges is one undo
  let nudgeT = 0, nudgeKey = '';
  function nudge(dx, dy) {
    const s = sel; if (!s) return;
    const w = W(), key = JSON.stringify(s) + cur, now = performance.now();
    const fits = (b) => b[0] + dx >= 0 && b[2] + dx <= MW && b[1] + dy >= 0 && b[3] + dy <= MH;
    let fn = null;
    if (isShape(s.kind) && s.sub != null) fn = () => { const p = ptsOf(w, s.kind, s.i)[s.sub], q = clampPt(p[0] + dx, p[1] + dy); p[0] = q[0]; p[1] = q[1]; };
    else if (isShape(s.kind)) { const pts = ptsOf(w, s.kind, s.i); if (!fits(E.bbox(pts))) return; fn = () => { pts.forEach((p) => { p[0] += dx; p[1] += dy; }); if (s.kind === 'front') w.front[s.i].base = clamp(w.front[s.i].base + dy, 0, MH); }; }
    else if (s.kind === 'exit' || (s.kind === 'spot' && w.spots[s.i].rect)) { const r = rectRef(s); if (!fits(r)) return; fn = () => { r[0] += dx; r[2] += dx; r[1] += dy; r[3] += dy; }; }
    else fn = () => { const p = pointRef(s), q = clampPt(p[0] + dx, p[1] + dy); p[0] = q[0]; p[1] = q[1]; };
    if (now - nudgeT > 800 || key !== nudgeKey) snap();
    nudgeT = now; nudgeKey = key; fn(); changed();
  }

  // ---------- the keyboard ----------
  const keysHeld = new Set();
  const ARROWS = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  window.addEventListener('keydown', (e) => {
    if (e.key === 'F2') { e.preventDefault(); toggleWalk(); return; }
    if (walking) return; // while she walks the field has the keys (Esc brings the editing back)
    const tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    const ctrl = e.ctrlKey || e.metaKey, key = e.key && e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (ctrl && key === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
    if (ctrl && key === 'y') { e.preventDefault(); redo(); return; }
    if (ctrl || e.altKey) return;
    if (ui.mode === 'keepsakes') {
      // Delete takes the picked keepsake off this map; Esc lets go of placing it; Shift and an arrow nudge it
      if (key === 'Delete' || key === 'Backspace') { e.preventDefault(); if (ui.pick && onMap(ui.pick, cur)) unplace(ui.pick); return; }
      if (key === 'Escape') { e.preventDefault(); if (armed) { armed = false; renderCard(); renderHelp(); cursor(); } return; }
      if (key === 'Enter') return;
      if (ARROWS[key] && e.shiftKey) { e.preventDefault(); nudgeItem(ARROWS[key][0], ARROWS[key][1]); return; }
    }
    if (key === 'Delete' || key === 'Backspace') { e.preventDefault(); if (drawing) popPoint(); else deleteSel(); return; }
    if (key === 'Enter') { if (drawing) { e.preventDefault(); finishDrawing(); } return; }
    if (key === 'Escape') { e.preventDefault(); if (drawing) { cancelDrawing(); note('Shape cancelled.'); } else if (tool !== 'select') setTool('select'); else if (sel) select(null); return; }
    if (key === ' ') { if (tag === 'BUTTON' || tag === 'A') return; e.preventDefault(); if (!spaceDown) { spaceDown = true; hover = null; cursor(); } return; }
    if (ARROWS[key]) { e.preventDefault(); if (e.shiftKey && sel) nudge(ARROWS[key][0], ARROWS[key][1]); else { keysHeld.add(key); panLoop(); } return; }
    if (key === '+' || key === '=') { zoomBy(1.25); return; }
    if (key === '-' || key === '_') { zoomBy(0.8); return; }
    if (key === '0') fit();
  });
  window.addEventListener('keyup', (e) => { if (e.key === ' ') { spaceDown = false; cursor(); } keysHeld.delete(e.key); });
  window.addEventListener('blur', () => { keysHeld.clear(); spaceDown = false; });
  // the arrow keys move the view while held
  let panning = false;
  function panLoop() {
    if (panning) return; panning = true;
    let last = performance.now();
    requestAnimationFrame(function step(t) {
      if (!keysHeld.size || walking) { panning = false; return; }
      const dt = Math.min(0.05, Math.max(0, (t - last) / 1000)); last = t;
      let dx = 0, dy = 0; for (const k of keysHeld) { dx += ARROWS[k][0]; dy += ARROWS[k][1]; }
      view.x += dx * 720 * dt / view.z; view.y += dy * 720 * dt / view.z; clampView(); draw(); readout();
      requestAnimationFrame(step);
    });
  }

  // ---------- the stand test, under the mouse ----------
  let standFn = null, standVer = -1;
  function standNow() { if (!standFn || standVer !== ver) { standFn = E.standTest(W()).stand; standVer = ver; } return standFn; }
  function readout() {
    const r = $('mp-readout');
    if (walking || !mouse || mouse.x < 0 || mouse.y < 0 || mouse.x > MW || mouse.y > MH) { r.hidden = true; return; }
    const x = Math.round(mouse.x), y = Math.round(mouse.y), ok = standNow()(x, y);
    r.hidden = false;
    r.innerHTML = 'x <b>' + x + '</b> · y <b>' + y + '</b> · ' + (ok ? '<span class="ok">Io can stand here</span>' : '<span class="no">Io can’t stand here</span>') + ' · ' + Math.round(view.z * 100) + '%';
  }

  // ---------- painting the canvas ----------
  let queued = false;
  function draw() { if (!queued) { queued = true; requestAnimationFrame(paint); } }
  function paint() {
    queued = false;
    if (walking) return;
    const w = W(), z = view.z, L = ui.layers, im = imgOf(cur);
    const X = (x) => (x - view.x) * z, Y = (y) => (y - view.y) * z;
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    g.fillStyle = C.deep; g.fillRect(0, 0, SW, SH);
    if (im.complete && im.naturalWidth) {
      g.imageSmoothingEnabled = z * MW / im.naturalWidth < 2.5; g.imageSmoothingQuality = 'high';
      g.drawImage(im, X(0), Y(0), MW * z, MH * z);
    } else {
      g.fillStyle = '#16122c'; g.fillRect(X(0), Y(0), MW * z, MH * z);
      tag(im.failed ? 'The painting didn’t load.' : 'The painting is loading…', X(MW / 2) - 80, Y(MH / 2), '#eeedfb');
    }
    g.strokeStyle = 'rgba(214,222,255,0.28)'; g.lineWidth = 1; g.strokeRect(X(0) - 0.5, Y(0) - 0.5, MW * z + 1, MH * z + 1);
    const showReach = L.reach && reachData && reachVer === ver, labels = [];
    if (showReach) paintReach(X, Y, z);
    const path = (pts) => { g.beginPath(); pts.forEach((p, j) => { if (j) g.lineTo(X(p[0]), Y(p[1])); else g.moveTo(X(p[0]), Y(p[1])); }); g.closePath(); };
    const isSel = (k, i) => !!sel && sel.kind === k && sel.i === i;
    const isHov = (k, i) => !!hover && hover.kind === k && hover.i === i;
    const shape = (pts, col, fa, k, i, dash) => {
      path(pts);
      g.fillStyle = rgba(col, isSel(k, i) ? fa + 0.12 : isHov(k, i) ? fa + 0.07 : fa); g.fill();
      g.setLineDash(dash ? [6, 4] : []);
      if (isSel(k, i)) { g.lineWidth = 4; g.strokeStyle = 'rgba(0,0,0,0.55)'; g.stroke(); g.lineWidth = 2; g.strokeStyle = '#ffffff'; g.stroke(); }
      else { g.lineWidth = isHov(k, i) ? 2.4 : 1.4; g.strokeStyle = rgba(col, 0.92); g.stroke(); }
      g.setLineDash([]);
    };
    if (L.walk) w.walk.forEach((p, i) => shape(p, C.walk, showReach ? 0.05 : 0.14, 'walk', i));
    if (L.block) w.block.forEach((p, i) => shape(p, C.block, 0.26, 'block', i));
    if (L.front) w.front.forEach((f, i) => {
      shape(f.pts, C.front, 0.1, 'front', i, true);
      // the base line: anyone whose feet are above it is drawn behind this piece of the painting
      const b = E.bbox(f.pts), y = Y(f.base), h = baseHandle(f), on = isSel('front', i) || (hover && hover.kind === 'front' && hover.i === i && hover.drag === 'base');
      g.strokeStyle = rgba(C.front, 0.95); g.lineWidth = on ? 2.2 : 1.3;
      g.beginPath(); g.moveTo(X(b[0]) - 4, y); g.lineTo(X(h[0]), y); g.stroke();
      diamond(X(h[0]), y, on ? 6.5 : 4.5, on ? '#ffffff' : C.front);
    });
    if (L.exits) {
      w.exits.forEach((e, i) => {
        const r = e.rect, s = isSel('exit', i), hv = isHov('exit', i);
        g.fillStyle = rgba(C.exit, s ? 0.42 : hv ? 0.34 : 0.26); g.fillRect(X(r[0]), Y(r[1]), (r[2] - r[0]) * z, (r[3] - r[1]) * z);
        g.lineWidth = s ? 2.2 : 1.6; g.strokeStyle = s ? '#ffffff' : C.exit; g.strokeRect(X(r[0]), Y(r[1]), (r[2] - r[0]) * z, (r[3] - r[1]) * z);
        if (s) corners(r, X, Y);
        const x0 = X(r[0]), y0 = Y(r[1]), x1 = X(r[2]), y1 = Y(r[3]);
        labels.push({ text: '→ ' + E.placeName(MAPS, e.to), color: C.exit, pri: s || hv ? 0 : 2, ax: (x0 + x1) / 2, ay: (y0 + y1) / 2, cands: (wd) => [[x0, y1 + 3], [x0, y0 - 19], [x1 - wd, y1 + 3], [x1 - wd, y0 - 19], [x0 - wd - 4, y0], [x1 + 4, y0], [x0 + 3, y0 + 3]] });
      });
    }
    if (L.people) w.spots.forEach((s, i) => {
      if (!s.rect) return;
      const r = s.rect, on = isSel('spot', i);
      g.setLineDash([7, 5]); g.lineWidth = on ? 2.2 : 1.4; g.strokeStyle = on ? '#ffffff' : rgba(C.people, 0.9);
      g.fillStyle = rgba(C.people, on ? 0.12 : 0.05); g.fillRect(X(r[0]), Y(r[1]), (r[2] - r[0]) * z, (r[3] - r[1]) * z);
      g.strokeRect(X(r[0]), Y(r[1]), (r[2] - r[0]) * z, (r[3] - r[1]) * z); g.setLineDash([]);
      if (on) corners(r, X, Y);
      const x0 = X(r[0]), y0 = Y(r[1]), y1 = Y(r[3]);
      labels.push({ text: 'story: ' + s.id, color: C.people, pri: on ? 0 : 4, ax: x0, ay: y0, cands: () => [[x0 + 6, y0 + 6], [x0 + 6, y1 - 22], [x0, y0 - 19], [x0, y1 + 3]] });
    });
    // the points of every shape shown (small), and the picked shape's (big, with the middles of its edges)
    if (z >= 0.42) for (const k of ['walk', 'block', 'front']) if (L[k]) w[k].forEach((s, i) => {
      if (isSel(k, i)) return;
      for (const p of ptsOf(w, k, i)) { const x = X(p[0]), y = Y(p[1]); if (x < -4 || y < -4 || x > SW + 4 || y > SH + 4) continue; g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(x - 2.5, y - 2.5, 5, 5); g.fillStyle = C[k]; g.fillRect(x - 1.5, y - 1.5, 3, 3); }
    });
    if (sel && isShape(sel.kind) && L[sel.kind] && selValid(sel)) {
      const pts = ptsOf(w, sel.kind, sel.i);
      pts.forEach((a, j) => {
        const b = pts[(j + 1) % pts.length], hv = hover && hover.drag === 'insert' && hover.at === j;
        g.fillStyle = hv ? C.gold : 'rgba(255,255,255,0.8)'; g.beginPath(); g.arc(X((a[0] + b[0]) / 2), Y((a[1] + b[1]) / 2), hv ? 4 : 2.6, 0, Math.PI * 2); g.fill();
      });
      pts.forEach((p, j) => {
        const on = sel.sub === j, hv = hover && hover.drag === 'vertex' && hover.kind === sel.kind && hover.i === sel.i && hover.sub === j, s = on ? 10 : hv ? 9 : 7;
        g.fillStyle = '#000000'; g.fillRect(X(p[0]) - s / 2 - 1, Y(p[1]) - s / 2 - 1, s + 2, s + 2);
        g.fillStyle = on ? C.gold : '#ffffff'; g.fillRect(X(p[0]) - s / 2, Y(p[1]) - s / 2, s, s);
      });
    }
    if (hover && hover.drag === 'vertex' && !(sel && sel.kind === hover.kind && sel.i === hover.i)) {
      const p = ptsOf(w, hover.kind, hover.i)[hover.sub];
      if (p) { g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.strokeRect(X(p[0]) - 5, Y(p[1]) - 5, 10, 10); }
    }
    // the dots: where she arrives, where a new walk starts, the people and the spots
    if (L.exits) {
      w.arrivals.forEach((a, i) => ring(a.at, C.arrive, isSel('arrival', i), isHov('arrival', i), z >= 0.5 || isSel('arrival', i) || isHov('arrival', i) ? 'from ' + E.arrivalName(MAPS, a) : '', X, Y, labels));
      ring(w.start, '#ffffff', isSel('start', 0), isHov('start', 0), z >= 0.5 || isSel('start', 0) || isHov('start', 0) ? 'a new walk starts here' : '', X, Y, labels);
    }
    if (L.people) {
      w.people.forEach((n, i) => spot(n.at, isSel('person', i), isHov('person', i), n.name, false, X, Y, labels));
      w.spots.forEach((s, i) => { if (!s.rect && s.kind !== 'keepsake') spot(s.at, isSel('spot', i), isHov('spot', i), s.label || s.kind, true, X, Y, labels); });
    }
    // the keepsakes that lie on this map, in the colour of who may wear them; a red ring round one she can't reach (while
    // something is dragged, the last check stands, and a keepsake being moved has none)
    if (L.items) {
      const K = ui.mode === 'keepsakes', moving = drag && drag.live, c = outCache[cur];
      const out = moving ? (drag.type === 'item' ? new Set() : c ? c.out : new Set()) : outOf(cur);
      for (const it of itemsOn(cur)) {
        const p = placeOf(it.id), x = X(p.x), y = Y(p.y), picked = K && it.id === ui.pick, hv = K && hoverItem === it.id, o = out.has(it.id);
        glint(x, y, picked ? 11 : hv ? 10 : 9, WEARC[it.wear], !!it.secret, picked, o);
        if (picked || hv || L.names) labels.push({ text: (it.secret ? '★ ' : '') + it.name, color: o ? C.bad : WEARC[it.wear], pri: picked || hv ? 0 : 2, ax: x, ay: y, dot: true, cands: dotCands(x, y) });
      }
    }
    // the shape being drawn, and the line on to the mouse
    if (drawing) {
      const col = C[tool] || '#ffffff';
      g.strokeStyle = col; g.lineWidth = 2; g.beginPath();
      drawing.forEach((p, j) => { if (j) g.lineTo(X(p[0]), Y(p[1])); else g.moveTo(X(p[0]), Y(p[1])); });
      if (mouse) g.lineTo(mouse.sx, mouse.sy);
      g.stroke();
      drawing.forEach((p, j) => {
        const first = j === 0 && drawing.length >= 3, s = first ? 10 : 7;
        g.fillStyle = '#000000'; g.fillRect(X(p[0]) - s / 2 - 1, Y(p[1]) - s / 2 - 1, s + 2, s + 2);
        g.fillStyle = first ? C.gold : col; g.fillRect(X(p[0]) - s / 2, Y(p[1]) - s / 2, s, s);
      });
    }
    // where Io stood when the last walk ended
    const io = lastIo[cur];
    if (io) { const x = X(io[0]), y = Y(io[1]); g.fillStyle = '#1a0c1d'; g.beginPath(); g.arc(x, y, 7, 0, Math.PI * 2); g.fill(); g.fillStyle = C.io; g.beginPath(); g.arc(x, y, 4.5, 0, Math.PI * 2); g.fill(); labels.push({ text: 'Io', color: C.io, pri: 1, ax: x, ay: y, dot: true, cands: dotCands(x, y) }); }
    // what she can't reach: red rings
    if (showReach) for (const p of reachData.problems) { g.strokeStyle = '#000000'; g.lineWidth = 5; g.beginPath(); g.arc(X(p.at[0]), Y(p.at[1]), 15, 0, Math.PI * 2); g.stroke(); g.strokeStyle = C.problem; g.lineWidth = 2.5; g.stroke(); }
    placeLabels(labels);
  }
  // the names on the painting, most wanted first, each in the first of its places that is free and on screen
  const FONT = '600 12px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  const dotCands = (x, y) => (wd) => [[x + 11, y - 8], [x - 11 - wd, y - 8], [x + 11, y + 6], [x - 11 - wd, y + 6], [x + 11, y - 22], [x - 11 - wd, y - 22], [x - wd / 2, y + 10], [x - wd / 2, y - 26]];
  function placeLabels(list) {
    g.font = FONT;
    // dots on the same spot (two arrivals and the start, say) share one label
    const merged = [];
    for (const L of list) {
      const m = L.dot && merged.find((o) => o.dot && Math.abs(o.ax - L.ax) < 3 && Math.abs(o.ay - L.ay) < 3);
      if (m) { m.parts.push({ text: L.text, color: L.color }); m.pri = Math.min(m.pri, L.pri); } else merged.push(Object.assign({}, L, { parts: [{ text: L.text, color: L.color }] }));
    }
    merged.sort((a, b) => a.pri - b.pri);
    const boxes = [], free = (b) => !boxes.some((o) => b[0] < o[0] + o[2] && b[0] + b[2] > o[0] && b[1] < o[1] + o[3] && b[1] + b[3] > o[1]);
    const sep = ' · ', sepW = g.measureText(sep).width;
    for (const L of merged) {
      if (L.ax < -40 || L.ay < -40 || L.ax > SW + 40 || L.ay > SH + 40) continue;
      const widths = L.parts.map((q) => g.measureText(q.text).width), wd = widths.reduce((a, b) => a + b, 0) + sepW * (L.parts.length - 1) + 6, cands = L.cands(wd);
      let b = null;
      for (const [x, y] of cands) { const c = [x, y, wd, 16]; if (x >= 2 && y >= 2 && x + wd <= SW - 2 && y + 16 <= SH - 2 && free(c)) { b = c; break; } }
      if (!b) b = [clamp(cands[0][0], 2, Math.max(2, SW - wd - 2)), clamp(cands[0][1], 2, Math.max(2, SH - 18)), wd, 16];
      boxes.push(b);
      g.fillStyle = 'rgba(8,6,20,0.8)'; g.fillRect(b[0], b[1], b[2], b[3]);
      let x = b[0] + 3;
      L.parts.forEach((q, i) => {
        if (i) { g.fillStyle = 'rgba(214,222,255,0.55)'; g.fillText(sep, x, b[1] + 12); x += sepW; }
        g.fillStyle = q.color; g.fillText(q.text, x, b[1] + 12); x += widths[i];
      });
    }
  }
  function tag(text, x, y, color) {
    g.font = FONT;
    const wd = g.measureText(text).width;
    g.fillStyle = 'rgba(8,6,20,0.78)'; g.fillRect(x - 3, y - 12, wd + 6, 16);
    g.fillStyle = color; g.fillText(text, x, y);
  }
  function diamond(x, y, r, col) { g.beginPath(); g.moveTo(x, y - r - 1.5); g.lineTo(x + r + 1.5, y); g.lineTo(x, y + r + 1.5); g.lineTo(x - r - 1.5, y); g.closePath(); g.fillStyle = '#000000'; g.fill(); g.beginPath(); g.moveTo(x, y - r); g.lineTo(x + r, y); g.lineTo(x, y + r); g.lineTo(x - r, y); g.closePath(); g.fillStyle = col; g.fill(); }
  function corners(r, X, Y) { for (const [x, y] of [[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]]) { g.fillStyle = '#000000'; g.fillRect(X(x) - 5, Y(y) - 5, 10, 10); g.fillStyle = '#ffffff'; g.fillRect(X(x) - 4, Y(y) - 4, 8, 8); } }
  function ring(p, col, on, hv, label, X, Y, labels) {
    const x = X(p[0]), y = Y(p[1]);
    g.lineWidth = 4.5; g.strokeStyle = '#000000'; g.beginPath(); g.arc(x, y, on || hv ? 8 : 6.5, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 2.5; g.strokeStyle = on ? '#ffffff' : col; g.stroke();
    g.fillStyle = on ? '#ffffff' : col; g.beginPath(); g.arc(x, y, 2, 0, Math.PI * 2); g.fill();
    if (label) labels.push({ text: label, color: col, pri: on || hv ? 0 : 3, ax: x, ay: y, dot: true, cands: dotCands(x, y) });
  }
  function spot(p, on, hv, label, square, X, Y, labels) {
    const x = X(p[0]), y = Y(p[1]), r = on || hv ? 7 : 5.5;
    g.fillStyle = '#000000'; g.beginPath(); if (square) g.rect(x - r - 1.5, y - r - 1.5, 2 * r + 3, 2 * r + 3); else g.arc(x, y, r + 1.5, 0, Math.PI * 2); g.fill();
    g.fillStyle = on ? '#ffffff' : C.people; g.beginPath(); if (square) g.rect(x - r, y - r, 2 * r, 2 * r); else g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    labels.push({ text: label, color: C.people, pri: on || hv ? 0 : 1, ax: x, ay: y, dot: true, cands: dotCands(x, y) });
  }
  // a keepsake's glint: a four-pointed star in the colour of who may wear it, white-hearted for the two hidden ones
  function glint(x, y, r, col, secret, picked, out) {
    if (picked) { g.beginPath(); g.arc(x, y, r + 7, 0, Math.PI * 2); g.lineWidth = 2; g.strokeStyle = '#ffffff'; g.stroke(); }
    if (out) { g.beginPath(); g.arc(x, y, r + 3.5, 0, Math.PI * 2); g.setLineDash([4, 3]); g.lineWidth = 2; g.strokeStyle = C.bad; g.stroke(); g.setLineDash([]); }
    const star = (rr, k) => { g.beginPath(); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 - Math.PI / 2, d = i % 2 ? rr * k : rr; g.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d); } g.closePath(); };
    star(r + 1.6, 0.36); g.fillStyle = 'rgba(0,0,0,0.75)'; g.fill();
    star(r, 0.32); g.fillStyle = col; g.fill();
    g.beginPath(); g.arc(x, y, r * 0.24, 0, Math.PI * 2); g.fillStyle = secret ? C.secret : 'rgba(255,255,255,0.85)'; g.fill();
  }
  function paintReach(X, Y, z) {
    const r = reachData, s = CELL * z;
    for (let c = 0; c < r.grid.length; c++) {
      if (!r.grid[c]) continue;
      const i = c % GW, j = (c - i) / GW, x = X(i * CELL), y = Y(j * CELL);
      if (x > SW || y > SH || x + s < 0 || y + s < 0) continue;
      if (r.seen[c]) { g.fillStyle = rgba(C.reach, 0.55); g.fillRect(x + s / 2 - 1, y + s / 2 - 1, 2, 2); }
      else { g.fillStyle = rgba(C.island, 0.72); g.fillRect(x + 0.5, y + 0.5, Math.max(1, s - 1), Math.max(1, s - 1)); }
    }
  }

  // ---------- what she can reach ----------
  let reachData = null, reachVer = -1, reachT = 0;
  const tracedReach = {}; // the game's tracing's own reach, to compare with
  function reachSoon() { clearTimeout(reachT); if (!ui.layers.reach) { renderReach(); return; } renderReach(); reachT = setTimeout(reachNow, 160); }
  function reachNow() {
    if (!ui.layers.reach) return;
    if (!tracedReach[cur]) tracedReach[cur] = E.reach(MAPS, cur, tracedOf(cur));
    reachData = reachOf(cur, W()); reachVer = ver; renderReach(); draw();
  }
  // the map as the reach rule takes it: the hidden keepsakes' own spots out, and every keepsake that lies here in
  function withKeepsakes(id, w) {
    const spots = w.spots.filter((s) => s.kind !== 'keepsake');
    for (const it of itemsOn(id)) { const p = placeOf(it.id); spots.push({ kind: 'keepsake', id: it.id, item: it.id, at: [p.x, p.y], label: it.name }); }
    return Object.assign({}, w, { spots });
  }
  function reachOf(id, w) {
    const wr = withKeepsakes(id, w), r = E.reach(MAPS, id, wr);
    for (const p of r.problems) { const s = p.kind === 'spot' ? wr.spots[p.i] : null; if (s && s.item) { p.item = s.item; p.text = 'She can’t get near enough to pick up ' + lower(BY[s.item].name) + '.'; } }
    return r;
  }
  // the keepsakes on a map she can't get near enough to pick up, on the paths as they are now: checked again only when
  // that map's paths or keepsakes change
  const outCache = {};
  function outOf(id) {
    const its = itemsOn(id); if (!its.length) return new Set();
    const w = works[id] || tracedOf(id), key = E.hash(E.geom(w)) + JSON.stringify(its.map((it) => [it.id, placeOf(it.id).x, placeOf(it.id).y]));
    const c = outCache[id]; if (c && c.key === key) return c.out;
    const out = new Set(); for (const p of reachOf(id, w).problems) if (p.item) out.add(p.item);
    outCache[id] = { key, out }; return out;
  }
  function renderReach() {
    const box = $('mp-reach');
    box.className = 'mp-reach';
    if (!ui.layers.reach) { box.textContent = 'Turn on “Where Io can reach” to check she can still get to every exit, person, spot, arrival and keepsake from where a new walk starts.'; return; }
    if (!reachData || reachVer !== ver) { box.textContent = 'Checking where she can reach…'; return; }
    // ground cut off from the rest that the game's tracing doesn't have (a block's own footprint isn't cut off)
    const r = reachData, t = tracedReach[cur], cut = r.open > r.reached;
    const less = t && (r.open - r.reached) - (t.open - t.reached) > 3;
    if (!r.problems.length && !less) { box.classList.add('is-good'); box.textContent = 'She can reach everything on this map.' + (cut ? ' Orange marks walk area she can’t get to.' : ''); return; }
    box.textContent = '';
    if (r.problems.length) {
      el('span', null, box, (r.problems.length === 1 ? 'One thing' : r.problems.length + ' things') + ' she can’t reach (click one to see it):');
      const ul = el('ul', null, box);
      for (const p of r.problems) { const b = el('button', { type: 'button' }, el('li', null, ul), p.text); b.addEventListener('click', () => { if (view.z < 0.9) view.z = 1.2; centreOn(p.at[0], p.at[1]); }); }
    } else box.classList.add('is-warn');
    if (less) el('span', null, box, (r.problems.length ? ' Some walk area is now cut off from the rest, too: orange marks it.' : 'She can still reach every exit, person, spot and arrival, but some walk area is now cut off from the rest: orange marks it.'));
    else if (cut) el('span', null, box, ' Orange marks walk area she can’t get to.');
  }

  // ---------- walking Io there, with the game's own field ----------
  let field = null, fieldOpts = null, walking = false, found = new Set(); // found: the keepsakes she has found on this walk
  const walkHost = $('mp-walk-host');
  const paintedIo = typeof window.makePaintedIo === 'function' ? window.makePaintedIo(src) : null;
  // the townsfolk as their paper dolls, as in the game
  const paintedFolk = typeof window.makePaintedFolk === 'function' ? window.makePaintedFolk(src) : null;
  // the map as the field takes it, with the edits: no story beats and no wild fights (they do nothing here)
  function walkCopy(id) {
    const w = W(id), m = MAPS[id];
    // the hidden keepsakes' own spots give way to the keepsakes as placed here, each gone once she has found it
    const spots = E.clone(w.spots.filter((s) => s.kind !== 'event' && s.kind !== 'keepsake'));
    for (const it of itemsOn(id)) { const p = placeOf(it.id); spots.push({ kind: 'keepsake', id: it.id, item: it.id, at: [p.x, p.y], label: 'Something glinting', hide: () => found.has(it.id) }); }
    return { name: m.name, src: m.src, zoom: m.zoom, start: w.start.slice(), walk: E.clone(w.walk), block: E.clone(w.block), front: E.clone(w.front), exits: E.clone(w.exits), people: E.clone(w.people), spots };
  }
  // she starts in the middle of what is on screen (in Keepsakes, a little below the picked one when it lies here), or at
  // the nearest place there she can stand
  function dropPoint(id) {
    const w = W(id), S = E.standTest(w).stand, k = ui.mode === 'keepsakes' && ui.pick && onMap(ui.pick, id) ? placeOf(ui.pick) : null;
    const cx = k ? k.x : view.x + SW / 2 / view.z, cy = k ? k.y + 30 : view.y + SH / 2 / view.z;
    if (S(cx, cy)) return [Math.round(cx), Math.round(cy)];
    let best = null, bd = Infinity;
    for (let j = 0; j < E.GH; j++) for (let i = 0; i < GW; i++) { const x = i * CELL + 6, y = j * CELL + 6, d = (x - cx) ** 2 + (y - cy) ** 2; if (d < bd && S(x, y)) { bd = d; best = [x, y]; } }
    return best || w.start.slice();
  }
  async function startWalk() {
    if (walking) return;
    if (typeof window.Field === 'undefined') { note('Walking needs the game’s field, which didn’t load.'); return; }
    drawing = null; drag = null; hover = null; hoverItem = null; armed = false; keysHeld.clear(); spaceDown = false; found = new Set(); closeFound();
    const id = cur, at0 = dropPoint(id);
    walking = true; walkHost.hidden = false; cv.hidden = true; renderWalk();
    fieldOpts = {
      maps: { [id]: walkCopy(id) }, src, speed: 110, zoom: 0.7, ioH: 52, paintedIo, paintedFolk, pace: 1.7, ioScreen: 0.15, showWalk: !!ui.showPaths,
      isDone: () => false,
      onExit: (ex) => note('The way out to ' + E.placeName(MAPS, ex.to) + '. On this page she stays on this map.'),
      onTalk: (p) => note(p.name + ' is here. Talking is off on this page.'),
      onSpot: (s) => { if (s.item && BY[s.item]) { found.add(s.item); showFound(BY[s.item]); } else note((s.label || s.kind) + ': nothing happens on this page.'); },
      onMenu: () => stopWalk(),
    };
    try {
      field = window.Field.create(walkHost, fieldOpts);
      const menu = field.root.querySelector('.field-menu');
      if (menu) { menu.textContent = '✎ Back to editing'; menu.setAttribute('aria-label', 'Back to editing'); }
      await field.load(id, at0, 's');
    } catch (e) { stopWalk(); note('Walking couldn’t start: ' + (e && e.message ? e.message : e)); }
  }
  function stopWalk() {
    if (!walking) return;
    closeFound();
    if (field) { lastIo[cur] = [Math.round(field.P.x), Math.round(field.P.y)]; field.stop(); field.root.remove(); field = null; }
    walking = false; walkHost.hidden = true; cv.hidden = false;
    if (lastIo[cur]) centreOn(lastIo[cur][0], lastIo[cur][1]);
    renderWalk(); draw();
  }
  const toggleWalk = () => (walking ? stopWalk() : startWalk());
  function renderWalk() {
    const b = $('mp-walk');
    b.setAttribute('aria-pressed', walking ? 'true' : 'false'); b.textContent = walking ? 'Back to editing' : 'Walk it';
    $('mp-plate').hidden = walking; if (walking) $('mp-readout').hidden = true;
    renderHelp();
  }

  // ---------- the panel ----------
  const rows = {};
  function buildMaps() {
    const ul = $('mp-maps');
    for (const id of IDS) {
      const li = el('li', null, ul);
      const pick = el('button', { type: 'button', class: 'mp-map-pick' }, li, MAPS[id].name);
      const chip = el('span', { class: 'mp-chip', hidden: '' }, li);
      const n = el('span', { class: 'me-n' }, li);
      const old = el('p', { class: 'mp-stale', hidden: '' }, li, 'Made on an older tracing: the game’s tracing of this map has changed since.');
      const reset = el('button', { type: 'button', class: 'mp-reset', hidden: '' }, li, 'Back to the game’s tracing');
      pick.addEventListener('click', () => openMap(id));
      reset.addEventListener('click', () => armReset(id));
      rows[id] = { li, pick, chip, n, old, reset, armed: 0 };
    }
  }
  // a map's edits are with Claude when the last one sent is the map as it is now
  const needsSend = (id) => !!db && (isChanged(id) ? ui.sent[id] !== geomHash(id) : !!ui.sent[id] && ui.sent[id] !== E.hash(geomOf(id)));
  function renderMaps() {
    for (const id of IDS) {
      const r = rows[id], ch = isChanged(id), need = needsSend(id);
      r.li.classList.toggle('is-current', id === cur);
      r.pick.setAttribute('aria-current', id === cur ? 'true' : 'false');
      const text = ch ? (db && !need ? 'sent' : 'edited') : need ? 'not sent' : '';
      r.chip.textContent = text; r.chip.hidden = !text;
      r.chip.className = 'mp-chip' + (text === 'sent' ? ' is-sent' : text ? ' is-edited' : '');
      r.reset.hidden = !ch; r.old.hidden = !(ch && stale[id]);
      const k = itemsOn(id).length; r.n.textContent = k ? k + (k === 1 ? ' keepsake' : ' keepsakes') : '';
    }
    const kc = $('me-plate-items'), kn = itemsOn(cur).length;
    kc.hidden = !kn || !ui.layers.items; kc.textContent = kn + (kn === 1 ? ' keepsake' : ' keepsakes');
    $('mp-plate-name').textContent = MAPS[cur].name;
    const pc = $('mp-plate-chip'), ch = isChanged(cur);
    pc.hidden = !ch; pc.textContent = 'edited'; pc.className = 'mp-chip is-edited';
    renderKept();
  }
  function armReset(id) {
    const r = rows[id], label = 'Back to the game’s tracing';
    if (r.armed) { clearTimeout(r.armed); r.armed = 0; r.reset.classList.remove('is-armed'); r.reset.textContent = label; resetMap(id); return; }
    r.reset.classList.add('is-armed'); r.reset.textContent = 'Sure? Click again to drop every change here';
    r.armed = setTimeout(() => { r.armed = 0; r.reset.classList.remove('is-armed'); r.reset.textContent = label; }, 4000);
  }
  function resetMap(id) {
    if (walking) stopWalk();
    snap(id); works[id] = tracedOf(id); delete stale[id]; delete bases[id];
    if (id === cur) { sel = null; drawing = null; }
    changed(id === cur ? 'Back to the game’s tracing. Undo brings your changes back.' : MAPS[id].name + ' is back to the game’s tracing. Open it and press Undo to bring the changes back.');
  }
  function openMap(id, centre) {
    if (!MAPS[id] || id === cur) return;
    if (walking) stopWalk();
    views[cur] = { x: view.x, y: view.y, z: view.z };
    cur = id; sel = null; hover = null; drawing = null; drag = null; reachData = null; armed = false; hoverItem = null; ver++;
    if (tool !== 'select') setTool('select');
    if (views[id]) { Object.assign(view, views[id]); clampView(); } else fit();
    if (centre) centreOn(centre[0], centre[1]);
    imgOf(id); saveUI();
    renderMaps(); renderPicked(); renderKeep(); renderUndo(); renderSend(); renderHelp(); reachSoon(); readout(); draw();
  }
  const HINT = { walk: 'New walk area: ground where her feet can go.', block: 'New block: a spot cut out of the walk areas (a well, a stall, a lamp post’s foot).', front: 'New front: a piece of the painting drawn over Io when she walks behind it (a lamp post, a tree).' };
  function renderPicked() {
    const box = $('mp-picked'), w = W(), s = sel && selValid(sel) ? sel : null;
    let html;
    if (drawing) html = '<b>Drawing a new ' + KIND[tool] + '</b>: ' + drawing.length + ' point' + (drawing.length === 1 ? '' : 's') + ' so far.<small>Click the first point (gold) or press Enter to finish. Backspace takes back the last point; Esc cancels.</small>';
    else if (tool !== 'select') html = '<b>' + HINT[tool] + '</b><small>Click on the painting to put down its points.</small>';
    else if (!s) html = 'Nothing picked.<small>Click a shape, a point or a dot on the painting.</small>';
    else if (isShape(s.kind)) {
      const pts = ptsOf(w, s.kind, s.i), n = w[s.kind].length;
      html = '<b>' + cap(KIND[s.kind]) + ' ' + (s.i + 1) + '</b> of ' + n + ' · ' + pts.length + ' points';
      if (s.sub != null) html += '<small>Point ' + (s.sub + 1) + ' at x ' + pts[s.sub][0] + ', y ' + pts[s.sub][1] + '. Drag it to move it; Delete removes it; Smooth rounds this corner.</small>';
      else html += '<small>Drag inside it to move it. Double-click an edge, or drag an edge’s middle dot, to add a point. Smooth rounds every corner.</small>';
      if (s.kind === 'front') html += '<small>Base line at y ' + w.front[s.i].base + ': Io is drawn behind this piece when her feet are above the line. Drag the diamond to move it.</small>';
    } else if (s.kind === 'exit') {
      const e = w.exits[s.i], r = e.rect;
      html = '<b>The way out to ' + esc(E.placeName(MAPS, e.to)) + '</b> · x ' + r[0] + '–' + r[2] + ', y ' + r[1] + '–' + r[3] + '<small>She leaves the map when she walks into it. Drag it to move it, or drag a corner to resize it.</small>';
    } else if (s.kind === 'person') {
      const n = w.people[s.i];
      html = '<b>' + esc(n.name) + '</b> stands at x ' + n.at[0] + ', y ' + n.at[1] + '<small>Io walks round the spot where someone stands. Drag the dot to move where they stand.</small>';
    } else if (s.kind === 'spot') {
      const p = w.spots[s.i];
      if (p.rect) html = '<b>Story spot: ' + esc(p.id) + '</b> · x ' + p.rect[0] + '–' + p.rect[2] + ', y ' + p.rect[1] + '–' + p.rect[3] + '<small>A story beat or a set fight starts when she walks into it. Drag inside it to move it, or a corner to resize it.</small>';
      else html = '<b>' + esc(p.label || p.kind) + '</b> (' + esc(p.kind) + ') at x ' + p.at[0] + ', y ' + p.at[1] + '<small>She can use it when she stands close by. Drag the dot to move it.</small>';
    } else if (s.kind === 'arrival') {
      const a = w.arrivals[s.i], from = a.from === 'magpie' ? 'when the Magpie lands here' : 'coming from ' + E.arrivalName(MAPS, a);
      html = '<b>Where she arrives ' + esc(from) + '</b> · x ' + a.at[0] + ', y ' + a.at[1] + '<small>Drag the dot to move it. Keep it on a walk area and out of the ways out.</small>';
    } else html = '<b>Where a new walk starts</b> · x ' + w.start[0] + ', y ' + w.start[1] + '<small>Drag the dot to move it. “Where Io can reach” checks from here.</small>';
    box.innerHTML = html;
    $('mp-smooth').disabled = !!drawing || !(s && isShape(s.kind));
    $('mp-delete').disabled = !drawing && !(s && isShape(s.kind));
  }
  function renderUndo() {
    if (ui.mode === 'keepsakes') { $('mp-undo').disabled = !khist.u.length; $('mp-redo').disabled = !khist.r.length; return; }
    const h = H(cur); $('mp-undo').disabled = !h.u.length && !drawing; $('mp-redo').disabled = !h.r.length || !!drawing;
  }
  const k = (s) => '<kbd>' + s + '</kbd>';
  const HELP = {
    edit: ['+ Green or + Purple (beside the painting) draws a new shape anywhere', 'Drag a point to move it', 'Double-click an edge to add a point', k('Delete') + ' removes the picked point or shape', 'Click a shape, then drag it to move it', k('Wheel') + ' zoom', 'Drag empty space, ' + k('Space') + '+drag or ' + k('←') + k('↑') + k('↓') + k('→') + ' to look around', k('Shift') + '+arrows nudge', k('Ctrl') + k('Z') + ' undo, ' + k('Ctrl') + k('Shift') + k('Z') + ' redo', k('Esc') + ' let go', k('F2') + ' walk it'],
    draw: ['Click to put down points', 'Click the first point or press ' + k('Enter') + ' to finish', k('Backspace') + ' takes back the last point', k('Esc') + ' cancels', 'Hold ' + k('Space') + ' and drag to move around', k('Wheel') + ' zoom'],
    walk: [k('←') + k('↑') + k('↓') + k('→') + ' or ' + k('W') + k('A') + k('S') + k('D') + ' walk', 'Click the painting to walk there, or hold to steer her', 'Stand by a glint and press the action button: its card shows, as in the game', k('Esc') + ' or ' + k('F2') + ' back to editing', 'Exits, talking and fights do nothing here'],
    keep: ['Pick a keepsake beside the painting, press Put it on this map, then click where it lies', 'Drag a glint to move it', k('Delete') + ' takes the picked one off', 'A red ring: Io can’t reach it', k('Shift') + '+arrows nudge', k('Ctrl') + k('Z') + ' undo', k('Wheel') + ' zoom', k('F2') + ' walk it'],
    armed: ['Click the painting where it lies', k('Esc') + ' stops', 'Drag to look around', k('Wheel') + ' zoom'],
  };
  function renderHelp() { $('mp-help').innerHTML = HELP[walking ? 'walk' : ui.mode === 'keepsakes' ? (armed ? 'armed' : 'keep') : tool !== 'select' || drawing ? 'draw' : 'edit'].join('<span class="mp-dot">·</span>'); }
  function initLayers() {
    for (const key of ['walk', 'block', 'front', 'exits', 'people', 'items', 'names', 'reach']) {
      const box = $('mp-l-' + key); box.checked = !!ui.layers[key];
      box.addEventListener('change', () => {
        ui.layers[key] = box.checked; saveUI();
        if (key === 'items' && !box.checked) { armed = false; hoverItem = null; renderCard(); renderHelp(); renderMaps(); }
        if (key === 'items' && box.checked) renderMaps();
        if (sel && !box.checked && (sel.kind === key || (key === 'exits' && /^(exit|arrival|start)$/.test(sel.kind)) || (key === 'people' && /^(person|spot)$/.test(sel.kind)))) sel = null;
        hover = null; if (key === 'reach') reachSoon();
        renderPicked(); draw(); box.blur();
      });
    }
    const sp = $('mp-showpaths'); sp.checked = !!ui.showPaths;
    sp.addEventListener('change', () => { ui.showPaths = sp.checked; saveUI(); if (fieldOpts) fieldOpts.showWalk = sp.checked; sp.blur(); });
  }
  let noteT = 0;
  function note(text) { const n = $('mp-note'); n.textContent = text; n.hidden = false; clearTimeout(noteT); noteT = setTimeout(() => { n.hidden = true; }, 2800); }

  // ---------- the keepsakes: picking, placing, the list and the card ----------
  const WEAR = { io: 'Only Io', sol: 'Only Sol', either: 'Either' };
  const GROUPS = [['io', 'Only Io can wear these'], ['sol', 'Only Sol can wear these'], ['either', 'Either can wear these']];
  const lower = (name) => name.replace(/^The /, 'the ');
  function personName(id) { for (const m of IDS) for (const n of MAPS[m].people || []) if (n.id === id) return n.name; return id; }
  const SOURCE = (it) => (it.source === 'hidden' ? 'Hidden' : it.source === 'gift' ? 'A gift from ' + personName(it.giver) : it.source === 'fight' ? 'From the first Colossus' : 'Lies on a map');
  const pct = (n) => Math.round(n * 100) / 100 + '%';
  const mainShort = (it) => [it.main.heal && '+' + pct(it.main.heal) + ' healing', it.main.hp && '+' + pct(it.main.hp) + ' HP', it.main.might && '+' + pct(it.main.might) + ' damage'].filter(Boolean).join(' and ');
  function hitItem(m) {
    let best = null, bd = 16;
    for (const it of itemsOn(cur)) { const p = placeOf(it.id), d = Math.hypot((p.x - m.x) * view.z, (p.y - m.y) * view.z); if (d < bd) { bd = d; best = it; } }
    return best;
  }
  // a press on the painting in Keepsakes: on a glint, pick it (and drag it to move it); armed, put the picked one there
  function keepDown(e, m) {
    const hit = ui.layers.items ? hitItem(m) : null;
    if (hit) { pickItem(hit.id, false); drag = { type: 'item', id: hit.id, sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y, live: false, before: JSON.stringify(kw.places) }; return; }
    if (armed && m.x >= 0 && m.y >= 0 && m.x <= MW && m.y <= MH) { putHere(ui.pick, m.x, m.y); return; }
    begin(e, m, 'click-empty');
  }
  function pickItem(id, jump) {
    if (!BY[id]) return;
    ui.pick = id; armed = false; saveUI();
    const p = lies(BY[id]) ? placeOf(id) : null;
    if (jump && p) { if (p.map !== cur) openMap(p.map, [p.x, p.y]); else centreOn(p.x, p.y); }
    renderKeep(); renderHelp(); cursor(); draw();
  }
  function putHere(id, x, y) {
    const it = BY[id]; if (!it || !lies(it)) return;
    keepSnap(); kw.places[id] = { map: cur, x: clamp(Math.round(x), 0, MW), y: clamp(Math.round(y), 0, MH) }; armed = false;
    keepChanged(it.name + ' now lies on ' + MAPS[cur].name + '.');
  }
  function unplace(id) {
    const it = BY[id]; if (!it || !placeOf(id)) return;
    keepSnap(); if (it.at) kw.places[id] = null; else delete kw.places[id]; armed = false;
    keepChanged(it.name + ' is off the map. Undo puts it back.');
  }
  // Shift and an arrow key: the picked keepsake moves one pixel; a run of nudges is one undo
  let knudgeT = 0;
  function nudgeItem(dx, dy) {
    const p = ui.pick && onMap(ui.pick, cur) ? placeOf(ui.pick) : null; if (!p) return;
    const now = performance.now(); if (now - knudgeT > 800) keepSnap(); knudgeT = now;
    p.x = clamp(p.x + dx, 0, MW); p.y = clamp(p.y + dy, 0, MH); keepChanged();
  }
  // Walking paths or Keepsakes
  function showMode() {
    $('mp').dataset.mode = ui.mode;
    $('me-mode-paths').setAttribute('aria-pressed', ui.mode === 'paths' ? 'true' : 'false');
    $('me-mode-keepsakes').setAttribute('aria-pressed', ui.mode === 'keepsakes' ? 'true' : 'false');
  }
  function setMode(m) {
    if ((m !== 'paths' && m !== 'keepsakes') || m === ui.mode) return;
    if (drawing) drawing = null;
    if (tool !== 'select') { tool = 'select'; document.querySelectorAll('[data-tool]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.tool === 'select' ? 'true' : 'false')); }
    sel = null; hover = null; hoverItem = null; armed = false; drag = null;
    ui.mode = m;
    if (m === 'keepsakes' && !ui.layers.items) { ui.layers.items = true; $('mp-l-items').checked = true; }
    saveUI(); showMode();
    renderPicked(); renderMaps(); renderKeep(); renderUndo(); renderHelp(); cursor(); draw();
  }
  function stateOf(it) {
    if (it.source === 'gift') return { chip: 'a gift', cls: 'is-given', text: it.where + '. Nothing to place: the gift comes in ' + personName(it.giver) + '’s words.' };
    if (it.source === 'fight') return { chip: 'the Colossus', cls: 'is-given', text: it.where + '. Nothing to place.' };
    const p = placeOf(it.id), home = it.home && MAPS[it.home] ? MAPS[it.home].name : null;
    if (!p) return { chip: 'not placed', cls: '', text: 'Not placed yet.' + (home ? ' The list puts it on ' + home + ': ' + it.where + '.' : '') };
    const out = outOf(p.map).has(it.id), there = MAPS[p.map].name;
    return { chip: out ? 'out of reach' : there, cls: out ? 'is-out' : 'is-placed', out,
      text: (out ? 'On ' + there + ', but Io can’t get near enough to pick it up there. Move it onto ground she can reach, or draw her a way there in Walking paths.' : 'Lies on ' + there + '. Io can reach it.') + (home && p.map !== it.home ? ' The list puts it on ' + home + '.' : '') };
  }
  const keepRows = {};
  function buildKeep() {
    const host = $('me-groups');
    for (const [wear, title] of GROUPS) {
      const list = ITEMS.filter((x) => x.wear === wear); if (!list.length) continue;
      const grp = el('div', { class: 'ip-group' }, host);
      const h = el('h3', null, grp); el('i', { class: 'ip-dot ' + wear }, h); h.appendChild(document.createTextNode(title + ' ')); el('small', null, h, '(' + list.length + ')');
      const ul = el('ul', { class: 'ip-list' }, grp);
      for (const it of list) {
        const b = el('button', { type: 'button', class: 'ip-item', 'aria-pressed': 'false' }, el('li', null, ul));
        el('i', { class: 'ip-dot ' + wear, 'aria-hidden': 'true' }, b);
        const name = el('span', { class: 'ip-name' }, b);
        if (it.secret) el('span', { class: 'ip-star', title: 'One of the two hidden ones' }, name, '★ ');
        name.appendChild(document.createTextNode(it.name));
        const chip = el('span', { class: 'mp-chip' }, b);
        el('span', { class: 'ip-where' }, b, mainShort(it) + ' · ' + it.alsoDoes);
        b.addEventListener('click', () => pickItem(it.id, true));
        keepRows[it.id] = { b, chip };
      }
    }
  }
  function renderKeep() { renderKeepList(); renderCard(); }
  function renderKeepList() {
    let placed = 0, outN = 0;
    for (const it of ITEMS) {
      const r = keepRows[it.id]; if (!r) continue;
      const s = stateOf(it);
      if (lies(it) && placeOf(it.id)) { placed++; if (s.out) outN++; }
      r.b.setAttribute('aria-pressed', it.id === ui.pick ? 'true' : 'false');
      r.chip.textContent = s.chip; r.chip.className = 'mp-chip ' + s.cls;
    }
    const lying = ITEMS.filter(lies).length;
    $('me-count').textContent = placed + ' of the ' + lying + ' that lie on a map are placed' + (outN ? ', ' + outN + ' out of Io’s reach' : '') + '. The other ' + (ITEMS.length - lying) + ' are gifts, or come from the first Colossus.';
  }
  function renderCard() {
    const card = $('me-card'), it = BY[ui.pick];
    card.textContent = '';
    cv.classList.toggle('is-placing', armed);
    if (!it) return;
    const s = stateOf(it), p = lies(it) ? placeOf(it.id) : null;
    const top = el('div', { class: 'me-card-top' }, card);
    drawPic(el('canvas', { class: 'me-pic', 'aria-hidden': 'true' }, top), it, 72);
    const head = el('div', { class: 'me-card-head' }, top);
    el('h3', null, head, (it.secret ? '★ ' : '') + it.name);
    const meta = el('div', { class: 'ip-meta' }, head);
    const who = el('span', { class: 'mp-chip' }, meta, WEAR[it.wear]); who.style.color = WEARC[it.wear]; who.style.borderColor = rgba(WEARC[it.wear], 0.55);
    el('span', { class: 'mp-chip' }, meta, SOURCE(it));
    el('span', { class: 'mp-chip' }, meta, 'Band ' + it.band);
    helpList(el('ul', { class: 'me-helps' }, card), it);
    el('p', { class: 'ip-state' + (s.out ? ' is-bad' : p ? ' is-good' : '') }, card, s.text);
    if (lies(it)) {
      const row = el('div', { class: 'mp-row' }, card);
      const put = el('button', { type: 'button', class: armed ? '' : 'mp-primary', 'aria-pressed': armed ? 'true' : 'false' }, row, armed ? 'Now click the painting…' : onMap(it.id, cur) ? 'Put it somewhere else here' : 'Put it on this map');
      put.addEventListener('click', () => { if (walking) stopWalk(); if (!ui.layers.items) { ui.layers.items = true; $('mp-l-items').checked = true; saveUI(); } armed = !armed; renderCard(); renderHelp(); cursor(); draw(); try { cv.focus({ preventScroll: true }); } catch (er) { /* fine */ } });
      if (p) { const go = el('button', { type: 'button' }, row, p.map === cur ? 'Show it' : 'Go to it'); go.addEventListener('click', () => pickItem(it.id, true)); }
      else if (it.home && MAPS[it.home] && it.home !== cur) { const go = el('button', { type: 'button' }, row, 'Go to ' + MAPS[it.home].name); go.addEventListener('click', () => openMap(it.home)); }
      if (p) { const del = el('button', { type: 'button' }, row, 'Not placed'); del.addEventListener('click', () => unplace(it.id)); }
    }
    const lab = el('label', { for: 'me-note-' + it.id }, card, 'Your note: where exactly, who gives it, or anything else');
    const ta = el('textarea', { id: 'me-note-' + it.id, rows: '2' }, lab);
    ta.value = kw.notes[it.id] || '';
    ta.addEventListener('input', () => { kw.notes[it.id] = ta.value; saveKeepSoon(); renderSend(); });
    el('p', { class: 'ip-from' }, card, 'In Chris’s picture (art request 14): ' + it.look + '.' + (it.from ? ' Its look borrows from ' + it.from + '.' : ''));
  }
  // its two helps: the main one, and the other one, in fights or outside them
  function helpList(ul, it) {
    for (const [label, text] of [['Main help', it.does], [it.inFight ? 'In fights' : 'Outside fights', it.alsoDoes]]) { const li = el('li', null, ul); el('small', null, li, label); el('span', null, li, text + '.'); }
  }
  // a keepsake's picture: Chris's (art request 14; the game's tiny copy, items.js pic) on the colour of the game's
  // menus, a soft glow behind it in the colour of who may wear it. Until it has loaded, the glow alone
  const pics = {};
  function drawPic(c, it, size) {
    const d = Math.min(window.devicePixelRatio || 1, 3), col = WEARC[it.wear], m = size / 2;
    c.width = Math.round(size * d); c.height = Math.round(size * d); c.style.width = size + 'px'; c.style.height = size + 'px';
    const q = c.getContext('2d'); q.setTransform(d, 0, 0, d, 0, 0);
    q.fillStyle = C.pic; q.fillRect(0, 0, size, size);
    const gr = q.createRadialGradient(m, m, 1, m, m, size * 0.48); gr.addColorStop(0, rgba(col, 0.32)); gr.addColorStop(1, rgba(col, 0)); q.fillStyle = gr; q.fillRect(0, 0, size, size);
    if (!it.pic) return;
    let im = pics[it.id];
    if (!im) { im = pics[it.id] = new Image(); im.src = src(it.pic); }
    const put = () => { if (c.isConnected || c.id) { q.imageSmoothingQuality = 'high'; q.drawImage(im, size * 0.06, size * 0.06, size * 0.88, size * 0.88); } };
    if (im.complete && im.naturalWidth) put(); else im.addEventListener('load', put, { once: true });
  }
  // the card she sees when she finds one on a walk, as the game will show it: its picture, its name, who can wear it,
  // and its two helps
  function showFound(it) {
    drawPic($('me-found-pic'), it, 96);
    $('me-found-name').textContent = (it.secret ? '★ ' : '') + it.name;
    $('me-found-who').textContent = it.wear === 'either' ? 'Io or Sol can wear it' : 'Only ' + (it.wear === 'io' ? 'Io' : 'Sol') + ' can wear it';
    const ul = $('me-found-helps'); ul.textContent = ''; helpList(ul, it);
    $('me-found').hidden = false;
    try { $('me-found-ok').focus({ preventScroll: true }); } catch (e) { /* fine */ }
  }
  function closeFound() { const box = $('me-found'); if (box) box.hidden = true; }

  // ---------- sending the edits to Claude, or copying them ----------
  // db: the page's store on claude.ai, where Claude reads one document per map (edits/<map id>); null when the page
  // is opened anywhere else. It answers a moment after the page starts, never at once
  let db = null, dbState = 'waiting', sending = false;
  const bodyOf = (id) => E.body(MAPS, works, id, baseOf(id));
  function exportAll() {
    const maps = {};
    for (const id of IDS) if (isChanged(id)) maps[id] = bodyOf(id);
    return { game: 'Envoi on the Longest Night', what: 'the map editor: walking-path edits, and where the keepsakes are', version: 2, savedAt: new Date().toISOString(), maps, keepsakes: ITEMS.map(docOf) };
  }
  // one document per keepsake: where it lies (the fourteen that lie on a map), or who gives it, and his note
  function docOf(it) { const p = lies(it) ? placeOf(it.id) : null; return { item: it.id, name: it.name, wear: it.wear, source: it.source, giver: it.giver || null, map: p ? p.map : null, x: p ? p.x : null, y: p ? p.y : null, note: kw.notes[it.id] || '' }; }
  const keyOf = (it) => JSON.stringify(docOf(it));
  const unsentItems = () => ITEMS.filter((it) => ui.itemSent[it.id] !== keyOf(it));
  // anything worth keeping or sending: a changed map, a keepsake on a map, a note
  const anyWork = () => IDS.some(isChanged) || ITEMS.some((it) => lies(it) && !!placeOf(it.id)) || Object.keys(kw.notes).some((id) => kw.notes[id] && kw.notes[id].trim());
  async function sendItem(it) {
    const k = keyOf(it), body = Object.assign(docOf(it), { sent: new Date().toISOString() }), ref = db.doc('places/' + it.id);
    try { await ref.set(body); }
    catch (e) { if (!e || e.code !== 'unavailable') throw e; await new Promise((r) => setTimeout(r, 500 + Math.random() * 700)); await ref.set(body); }
    ui.itemSent[it.id] = k; saveUI();
  }
  // pretty JSON with each point, rectangle and shape on one line
  function pretty(o) {
    const S = '(?:-?\\d+(?:\\.\\d+)?(?:e[+-]?\\d+)?|null|true|false|"[^"\\\\\\n]*")';
    return JSON.stringify(o, null, 2)
      .replace(new RegExp('\\[\\s+(' + S + '(?:,\\s+' + S + ')*)\\s+\\]', 'g'), (m, s) => '[' + s.split(/,\s+/).join(', ') + ']')
      .replace(/\[\s+(\[-?\d+, -?\d+\](?:,\s+\[-?\d+, -?\d+\])*)\s+\]/g, (m, s) => '[' + s.split(/,\s+(?=\[)/).join(', ') + ']');
  }
  function status(text, kind) { const s = $('mp-status'); s.textContent = text; s.className = 'mp-status' + (kind ? ' is-' + kind : ''); }
  const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many);
  const clock = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const WHY = {
    invalid_argument: 'Claude’s store for this page didn’t take it (you may only be able to view this page, not change it)',
    resource_exhausted: 'too much was sent at once; wait a moment and try again',
    quota_exceeded: 'Claude’s store for this page is full',
    unavailable: 'Claude couldn’t be reached just now; try again in a moment',
    revoked: 'this page can’t send to Claude any more; use Copy my work instead',
    not_valid: 'something in the map isn’t right', too_big: 'the map has too many points to send in one go',
  };
  const why = (e) => { const code = e && e.code; return (WHY[code] || (e && e.message) || 'something went wrong') + (code ? ' (' + code + (e.message && WHY[code] ? ': ' + e.message : '') + ')' : ''); };
  async function sendOne(id) {
    const b = bodyOf(id), v = E.validate(MAPS, b, GAME);
    if (v.errors.length) throw { code: 'not_valid', message: v.errors[0] };
    if (JSON.stringify(b).length > 250 * 1024) throw { code: 'too_big', message: 'over 250 KB' };
    const ref = db.doc('edits/' + id);
    try { await ref.set(b); }
    catch (e) { if (!e || e.code !== 'unavailable') throw e; await new Promise((r) => setTimeout(r, 500 + Math.random() * 700)); await ref.set(b); }
    ui.sent[id] = geomHash(id); saveUI();
  }
  async function sendThis() {
    if (sending || !db) return;
    if (walking) stopWalk();
    const id = cur, name = MAPS[id].name, ch = isChanged(id);
    sending = true; renderSend(); status('Sending ' + name + ' to Claude…');
    try { await sendOne(id); status('Sent ' + name + ' to Claude at ' + clock() + '.' + (ch ? '' : ' It has no changes, so Claude keeps the game’s tracing of it.'), 'good'); }
    catch (e) { status('Couldn’t send ' + name + ': ' + why(e) + '.', 'bad'); }
    finally { sending = false; renderSend(); renderMaps(); }
  }
  // everything new: each changed map's paths, then each keepsake that has changed since it was last sent
  async function sendAll() {
    if (sending || !db) return;
    if (walking) stopWalk();
    const list = IDS.filter(needsSend), its = unsentItems();
    if (!list.length && !its.length) { status(anyWork() ? 'Claude has everything as it is now.' : 'Nothing to send yet.'); return; }
    sending = true; renderSend();
    let done = 0, kd = 0;
    const sent = () => [done && plural(done, 'map', 'maps') + ' (' + list.slice(0, done).map((id) => MAPS[id].name).join(', ') + ')', kd && plural(kd, 'keepsake', 'keepsakes')].filter(Boolean).join(' and ');
    try {
      for (const id of list) { status('Sending ' + (done + 1) + ' of ' + list.length + ': ' + MAPS[id].name + '…'); await sendOne(id); done++; renderMaps(); }
      for (const it of its) { status('Sending the keepsakes: ' + (kd + 1) + ' of ' + its.length + '…'); await sendItem(it); kd++; }
      status('Sent ' + sent() + ' to Claude at ' + clock() + '.', 'good');
    } catch (e) {
      const what = done < list.length ? MAPS[list[done]].name : its[kd] ? its[kd].name : 'the rest';
      status((done || kd ? 'Sent ' + sent() + ', then couldn’t send ' : 'Couldn’t send ') + what + ': ' + why(e) + '.', 'bad');
    } finally { sending = false; renderSend(); renderMaps(); }
  }
  function renderSend() {
    const any = anyWork(), need = IDS.filter(needsSend).length, ni = db ? unsentItems().length : 0;
    // where the page can't reach its store, Copy my work is the way to Claude (until October 5 it offered a download
    // there too, which a page on claude.ai can't make: nothing was saved, though the page said it was)
    $('mp-send-wait').hidden = dbState === 'ready';
    $('mp-send-wait').textContent = dbState === 'none' ? 'This page can’t send to Claude here: press Copy my work, then paste it to Claude.' : 'Checking whether this page can send to Claude…';
    $('mp-send-row').hidden = dbState !== 'ready';
    $('mp-send-one').disabled = sending;
    const all = $('mp-send-all'), n = need + ni;
    all.disabled = sending || !n;
    all.textContent = n ? 'Send everything new (' + [need && plural(need, 'map', 'maps'), ni && plural(ni, 'keepsake', 'keepsakes')].filter(Boolean).join(', ') + ')' : 'Send everything new';
    $('mp-copy').disabled = !any;
  }
  function renderKept() {
    const n = IDS.filter(isChanged).length, lying = ITEMS.filter(lies).length, k = ITEMS.filter((it) => lies(it) && !!placeOf(it.id)).length;
    $('mp-kept').textContent = !kept || !keepKept ? 'This browser isn’t keeping your changes (a private window does that). Send or copy them before you close the page.'
      : (n ? plural(n, 'map has', 'maps have') + ' path changes' : 'No path changes yet') + '; ' + k + ' of the ' + lying + ' keepsakes that lie on a map are placed. All of it is kept in this browser as you work.';
  }
  function copyEdits() {
    const text = pretty(exportAll()) + '\n', n = IDS.filter(isChanged).length, box = $('mp-copybox');
    const fallback = () => { box.hidden = false; box.value = text; box.focus(); box.select(); status('This page can’t copy by itself here. Your work is in the box below, already selected: press Ctrl+C (⌘C on a Mac) to copy it.'); };
    try {
      navigator.clipboard.writeText(text).then(() => { box.hidden = true; status('Copied your work: ' + (n ? 'the paths of ' + plural(n, 'map', 'maps') + ', and ' : '') + 'where the keepsakes are. Paste it to Claude.', 'good'); }, fallback);
    } catch (e) { fallback(); }
  }

  // ---------- starting ----------
  buildMaps(); buildKeep(); initLayers(); showMode();
  $('me-mode-paths').addEventListener('click', () => setMode('paths'));
  $('me-mode-keepsakes').addEventListener('click', () => setMode('keepsakes'));
  $('me-found-ok').addEventListener('click', closeFound);
  $('me-found').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeFound(); });
  // the found card takes Enter, Esc and Space before the field does
  window.addEventListener('keydown', (e) => { if (!$('me-found').hidden && (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ')) { e.preventDefault(); e.stopPropagation(); closeFound(); } }, true);
  document.querySelectorAll('[data-tool]').forEach((b) => b.addEventListener('click', () => setTool(b.dataset.tool)));
  $('mp-undo').addEventListener('click', undo);
  $('mp-redo').addEventListener('click', redo);
  $('mp-zoom-in').addEventListener('click', () => zoomBy(1.25));
  $('mp-zoom-out').addEventListener('click', () => zoomBy(0.8));
  $('mp-fit').addEventListener('click', fit);
  $('mp-walk').addEventListener('click', toggleWalk);
  $('mp-smooth').addEventListener('click', smoothSel);
  $('mp-delete').addEventListener('click', () => { if (drawing) popPoint(); else deleteSel(); });
  $('mp-send-one').addEventListener('click', sendThis);
  $('mp-send-all').addEventListener('click', sendAll);
  $('mp-copy').addEventListener('click', copyEdits);
  // a mouse click leaves the keyboard with the painting, not on the button
  document.addEventListener('pointerup', (e) => { const b = e.target && e.target.closest ? e.target.closest('.mp-bar button, .mp-panel button') : null; if (b) setTimeout(() => b.blur(), 0); });
  window.addEventListener('pagehide', () => { save(); saveKeep(); });
  imgOf(cur);
  renderMaps(); renderPicked(); renderKeep(); renderUndo(); renderHelp(); renderReach(); renderSend(); renderWalk();
  if (ui.layers.reach) reachSoon();
  (async () => {
    let d = null;
    try { d = await window.claude?.use?.('db').catch(() => null) ?? null; } catch (e) { d = null; }
    db = d; dbState = d ? 'ready' : 'none';
    renderSend(); renderMaps(); renderKept();
  })();
  // for tests and for a look from the console: the page's state, read-only in spirit
  // (MapPaths, as Walking Paths named it, so its tests run here too)
  window.MapPaths = window.MapEditor = {
    get map() { return cur; }, get works() { return works; }, get view() { return view; }, get sel() { return sel; }, get walking() { return walking; }, get field() { return field; }, get dbState() { return dbState; }, get painted() { const im = imgs[cur]; return !!(im && im.complete && im.naturalWidth); }, exportAll, openMap, fit,
    get mode() { return ui.mode; }, setMode, get places() { return kw.places; }, get pick() { return ui.pick; }, pickItem, putHere: (id, x, y) => { ui.pick = id; putHere(id, x, y); }, unplace, outOf, startWalk, stopWalk,
    get found() { return [...found]; }, get foundOpen() { return !$('me-found').hidden; }, showFound: (id) => showFound(BY[id]),
  };
})();
