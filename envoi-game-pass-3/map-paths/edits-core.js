// edits-core.js: the rules the walking-path page (map-paths.js) and the check of its edits (check-edits.mjs) share, so
// both read a map alike: which parts of a ground map the page edits, in maps.js's own shapes and the paintings' own
// 1536 x 1024 pixels; the game's tracing of them and its fingerprint; where Io can stand and what she can reach (the
// field's own rule, as tools/check-maps.mjs applies it); the gentle smoothing; the document the page sends to Claude for
// one map; and the check of such a document before it goes into the game.
// Works in the page and in Node. Each function takes MAPS (src/game/maps.js). Defines globalThis.MapEdits.
(function (G) {
  'use strict';
  const MW = 1536, MH = 1024, CELL = 12, GW = Math.ceil(MW / CELL), GH = Math.ceil(MH / CELL), REACH = 58;
  // where Io comes onto a ground map from the Magpie (game.js LANDINGS: `field`, a dock or a camp's landing ground). It
  // lives in game.js, which the page doesn't load (it would carry the whole game with it), so it is copied here;
  // check-edits.mjs compares this copy with game.js. Nothing comes onto a map from the world map any more (it is only
  // flown since the wilderness scenes, Chris's of October 5), so WORLD_IN is empty: it stays for the arrivals Chris
  // may have moved before then, which are left out with a note (validate)
  const WORLD_IN = {};
  const MAGPIE_IN = { wickhollow: ['jetty', [768, 720]], bogmire: ['bogmire', [130, 372]], warmCamp: ['warm-roads-camp', [368, 425]], dawnroost: ['dawnroost', [1450, 300]], northCamp: ['northern-camp', [386, 455]], shipyard: ['shipyard', [794, 270]], frozenCamp: ['frozen-camp', [356, 442]] };
  // the parts of a map the page edits. Walk areas, blocks and fronts are free shapes; exits, people, spots and
  // arrivals only move (their other fields stay as maps.js has them, and none is added or taken away)
  const FIELDS = ['walk', 'block', 'front', 'exits', 'people', 'spots', 'start', 'arrivals'];

  const clone = (v) => JSON.parse(JSON.stringify(v));
  const inPoly = (pts, x, y) => { let ins = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins; } return ins; };
  const bbox = (pts) => pts.reduce((b, [x, y]) => [Math.min(b[0], x), Math.min(b[1], y), Math.max(b[2], x), Math.max(b[3], y)], [Infinity, Infinity, -Infinity, -Infinity]);
  const area = (pts) => { let a = 0; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1]); return Math.abs(a / 2); };
  const centre = (r) => [Math.round((r[0] + r[2]) / 2), Math.round((r[1] + r[3]) / 2)];
  // an exit's place ('world': a road out of the picture that she turns back from, since the world map is only flown)
  const placeName = (MAPS, to) => (to === 'world' ? 'the wide world (she turns back)' : MAPS[to] ? MAPS[to].name : String(to));

  // ---------- arrivals: where Io comes onto a map ----------
  // from another map's exit (that exit's `at`, kept in the map it leaves), from the world map, and from the Magpie
  function arrivalsInto(MAPS, id) {
    const out = [];
    for (const oid of Object.keys(MAPS)) (MAPS[oid].exits || []).forEach((ex, k) => { if (ex.to === id && Array.isArray(ex.at)) out.push({ from: oid, exit: k, at: ex.at.slice() }); });
    for (const place of Object.keys(WORLD_IN)) if (WORLD_IN[place][0] === id) out.push({ from: 'world', place, at: WORLD_IN[place][1].slice() });
    for (const landing of Object.keys(MAGPIE_IN)) if (MAGPIE_IN[landing][0] === id) out.push({ from: 'magpie', landing, at: MAGPIE_IN[landing][1].slice() });
    return out;
  }
  const arrivalKey = (a) => a.from + ':' + (a.exit != null ? a.exit : a.place != null ? a.place : a.landing);
  const arrivalName = (MAPS, a) => (a.from === 'world' ? 'the world map' : a.from === 'magpie' ? 'the Magpie' : MAPS[a.from] ? MAPS[a.from].name : String(a.from));
  // game.js's places and landings as this file copies them, in game.js's own shapes (for validate)
  function mirrorGame() {
    const PLACES = {}, LANDINGS = {};
    for (const k of Object.keys(WORLD_IN)) PLACES[k] = { map: WORLD_IN[k][0], arrive: WORLD_IN[k][1].slice() };
    for (const k of Object.keys(MAGPIE_IN)) LANDINGS[k] = { field: [MAGPIE_IN[k][0], MAGPIE_IN[k][1].slice()] };
    return { PLACES, LANDINGS };
  }

  // ---------- a map's editable parts ----------
  // the game's tracing of a map, as the page edits it: exits, people and spots whole (only their places change)
  function traced(MAPS, id) {
    const m = MAPS[id];
    return {
      walk: clone(m.walk || []), block: clone(m.block || []), front: (m.front || []).map((f) => ({ pts: clone(f.pts), base: f.base })),
      exits: clone(m.exits || []), people: clone(m.people || []), spots: clone(m.spots || []), start: clone(m.start || [768, 512]),
      arrivals: arrivalsInto(MAPS, id),
    };
  }
  // the geometry of one part, the only thing the page changes
  function part(w, f) {
    if (f === 'front') return w.front.map((x) => [x.pts, x.base]);
    if (f === 'exits') return w.exits.map((e) => e.rect);
    if (f === 'people') return w.people.map((n) => n.at);
    if (f === 'spots') return w.spots.map((s) => s.rect || s.at);
    if (f === 'arrivals') return w.arrivals.map((a) => [arrivalKey(a), a.at]);
    return w[f];
  }
  const geom = (w) => JSON.stringify(FIELDS.map((f) => part(w, f)));
  // FNV-1a, 32 bits: a short fingerprint of a map's geometry
  function hash(s) { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return ('0000000' + h.toString(16)).slice(-8); }
  const fingerprint = (MAPS, id) => hash(geom(traced(MAPS, id)));
  const changedFields = (w, t) => FIELDS.filter((f) => JSON.stringify(part(w, f)) !== JSON.stringify(part(t, f)));

  // ---------- where she can stand: the field's rule (src/game/field.js freeAt and canStand) ----------
  // inside a walk area, outside every block and a little clear of everyone standing there, at her feet and 6 px either side
  function standTest(w) {
    const walks = w.walk.map((p) => [bbox(p), p]), blocks = w.block.map((p) => [bbox(p), p]), people = w.people || [];
    const inB = (b, x, y) => x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3];
    function free(x, y) {
      let ok = false;
      for (const [b, p] of walks) if (inB(b, x, y) && inPoly(p, x, y)) { ok = true; break; }
      if (!ok) return false;
      for (const [b, p] of blocks) if (inB(b, x, y) && inPoly(p, x, y)) return false;
      for (const n of people) if (Math.abs(n.at[0] - x) < 11 && Math.abs(n.at[1] - y) < 7) return false;
      return true;
    }
    return { free, stand: (x, y) => free(x, y) && free(x - 6, y) && free(x + 6, y) };
  }

  // ---------- what she can reach (tools/check-maps.mjs, in plain words) ----------
  // the field's 12 px grid of cells she can stand in, walked from the nearest cell to where a new walk starts; then, if
  // anything is left out, the narrow ways the grid can't see (field.js's fine search: 4 px steps on the same rule, no
  // cutting corners), which she walks by a tap as well as with the pad (October 4). Returns the grid, the cells reached,
  // and each thing she can't reach: { kind, i, at, text }
  function reach(MAPS, id, w) {
    const S = standTest(w).stand, N = GW * GH, grid = new Uint8Array(N), seen = new Uint8Array(N);
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) { const x = i * CELL + 6, y = j * CELL + 6; grid[j * GW + i] = S(x, y) && S(x, y - 5) && S(x, y + 5) && S(x - 5, y) && S(x + 5, y) ? 1 : 0; }
    const cx = (c) => (c % GW) * CELL + 6, cy = (c) => Math.floor(c / GW) * CELL + 6;
    const near = (x, y) => { let best = -1, bd = Infinity; for (let c = 0; c < N; c++) if (grid[c]) { const d = (cx(c) - x) ** 2 + (cy(c) - y) ** 2; if (d < bd) { bd = d; best = c; } } return [best, Math.sqrt(bd)]; };
    let open = 0; for (let c = 0; c < N; c++) open += grid[c];
    const [s0, sd] = near(w.start[0], w.start[1]);
    if (s0 >= 0) {
      const q = [s0]; seen[s0] = 1;
      for (let h = 0; h < q.length; h++) { const c = q[h], ci = c % GW, cj = (c - ci) / GW; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const i = ci + di, j = cj + dj; if (i < 0 || j < 0 || i >= GW || j >= GH) continue; const n = j * GW + i; if (grid[n] && !seen[n]) { seen[n] = 1; q.push(n); } } }
    }
    const gridReach = (x, y, r) => { for (let c = 0; c < N; c++) if (seen[c] && Math.hypot(cx(c) - x, (cy(c) - y) * 1.3) < r) return true; return false; };
    const gridRect = (rc) => { for (let c = 0; c < N; c++) if (seen[c]) { const x = cx(c), y = cy(c); if (x >= rc[0] - 14 && x <= rc[2] + 14 && y >= rc[1] - 14 && y <= rc[3] + 14) return true; } return false; };
    let fine = null; // the points the narrow ways reach, found only when the grid leaves something out
    const short = s0 >= 0 && (w.people.some((n) => !gridReach(n.at[0], n.at[1], REACH)) || w.spots.some((sp) => (sp.rect ? !gridRect(sp.rect) : !gridReach(sp.at[0], sp.at[1], REACH))) ||
      w.exits.some((ex) => !gridRect(ex.rect)) || grid.some((v, c) => v && !seen[c]));
    if (short) {
      const F = 4, x0 = cx(s0), y0 = cy(s0), key = (i, j) => (i + 512) * 1024 + j + 512, ok = new Map(), was = new Set([key(0, 0)]), q = [[0, 0]];
      const can = (i, j) => { const k = key(i, j); let v = ok.get(k); if (v === undefined) ok.set(k, v = S(x0 + i * F, y0 + j * F)); return v; };
      fine = [[x0, y0]];
      for (let h = 0; h < q.length; h++) {
        const [ci, cj] = q[h];
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
          const i = ci + di, j = cj + dj, k = key(i, j);
          if (was.has(k) || !can(i, j) || (di && dj && (!can(ci + di, cj) || !can(ci, cj + dj)))) continue;
          was.add(k); q.push([i, j]);
          const x = x0 + i * F, y = y0 + j * F, c = Math.min(GH - 1, Math.floor(y / CELL)) * GW + Math.min(GW - 1, Math.floor(x / CELL));
          fine.push([x, y]); if (grid[c]) seen[c] = 1; // an open cell reached along a narrow way
        }
      }
    }
    let reached = 0; for (let c = 0; c < N; c++) reached += seen[c];
    const reachable = (x, y, r) => gridReach(x, y, r) || (!!fine && fine.some(([px, py]) => Math.hypot(px - x, (py - y) * 1.3) < r));
    const inRectReach = (rc) => gridRect(rc) || (!!fine && fine.some(([x, y]) => x >= rc[0] - 14 && x <= rc[2] + 14 && y >= rc[1] - 14 && y <= rc[3] + 14));
    const inExit = (r, x, y) => x >= r[0] - 8 && x <= r[2] + 8 && y >= r[1] - 8 && y <= r[3] + 8;
    const problems = [], add = (kind, i, at, text) => problems.push({ kind, i, at, text });
    if (s0 < 0) add('start', 0, w.start, 'There is nowhere on this map she can stand.');
    else if (sd > 14) add('start', 0, w.start, 'Where a new walk starts is ' + Math.round(sd) + ' px off the walk areas.');
    w.exits.forEach((ex, k) => { if (!inRectReach(ex.rect)) add('exit', k, centre(ex.rect), 'She can’t reach the way out to ' + placeName(MAPS, ex.to) + '.'); });
    w.people.forEach((n, k) => { if (!reachable(n.at[0], n.at[1], REACH)) add('person', k, n.at, 'She can’t get near enough to talk to ' + n.name + '.'); });
    w.spots.forEach((s, k) => {
      if (s.rect) { if (!inRectReach(s.rect)) add('spot', k, centre(s.rect), 'She can’t reach the place where a story beat starts (' + s.id + ').'); }
      else if (!reachable(s.at[0], s.at[1], REACH)) add('spot', k, s.at, 'She can’t get near enough to use ' + (s.label || s.kind) + '.');
    });
    w.arrivals.forEach((a, k) => {
      const who = 'Coming from ' + arrivalName(MAPS, a) + ', she';
      for (const e2 of w.exits) if (inExit(e2.rect, a.at[0], a.at[1])) add('arrival', k, a.at, who + ' would arrive inside the way out to ' + placeName(MAPS, e2.to) + '.');
      const [c, d] = near(a.at[0], a.at[1]);
      if (c < 0) add('arrival', k, a.at, who + ' would arrive where there is no walk area at all.');
      else if (d > 14) add('arrival', k, a.at, who + ' would arrive ' + Math.round(d) + ' px off the walk areas.');
      else if (!seen[c]) add('arrival', k, a.at, who + ' would arrive cut off from the rest of the map.');
    });
    return { grid, seen, open, reached, problems };
  }

  // ---------- the gentle smoothing ----------
  // one pass of Chaikin's corner cutting: each corner becomes two points a quarter of the way along its two edges.
  // Points on the painting's border stay where they are (the ways out at its edges keep their width), and the result
  // stays inside the painting. only: the index of the one corner to round (as three points), or -1 for every corner
  const onBorder = (p) => p[0] <= 0 || p[0] >= MW || p[1] <= 0 || p[1] >= MH;
  const clampPt = (p) => [Math.min(MW, Math.max(0, Math.round(p[0]))), Math.min(MH, Math.max(0, Math.round(p[1])))];
  function tidy(pts, straight) {
    const out = [];
    for (const p of pts) { const q = out[out.length - 1]; if (!q || q[0] !== p[0] || q[1] !== p[1]) out.push(p); }
    while (out.length > 1 && out[0][0] === out[out.length - 1][0] && out[0][1] === out[out.length - 1][1]) out.pop();
    // a point exactly on the straight line between its neighbours adds nothing
    if (straight) for (let i = 0; i < out.length && out.length > 3; i++) {
      const n = out.length, a = out[(i + n - 1) % n], p = out[i], b = out[(i + 1) % n];
      const cross = (p[0] - a[0]) * (b[1] - a[1]) - (p[1] - a[1]) * (b[0] - a[0]), along = (p[0] - a[0]) * (b[0] - p[0]) + (p[1] - a[1]) * (b[1] - p[1]);
      if (cross === 0 && along > 0) { out.splice(i, 1); i = Math.max(-1, i - 2); }
    }
    return out;
  }
  function smooth(pts, only) {
    const n = pts.length, out = [];
    if (only == null) only = -1;
    for (let i = 0; i < n; i++) {
      const p = pts[i];
      if ((only >= 0 && i !== only) || onBorder(p)) { out.push(p.slice()); continue; }
      const a = pts[(i + n - 1) % n], b = pts[(i + 1) % n];
      const A = [p[0] + (a[0] - p[0]) * 0.25, p[1] + (a[1] - p[1]) * 0.25], B = [p[0] + (b[0] - p[0]) * 0.25, p[1] + (b[1] - p[1]) * 0.25];
      out.push(A);
      if (only >= 0) out.push([A[0] * 0.25 + p[0] * 0.5 + B[0] * 0.25, A[1] * 0.25 + p[1] * 0.5 + B[1] * 0.25]); // the corner's rounded middle
      out.push(B);
    }
    const res = tidy(out.map(clampPt), only < 0);
    return res.length >= 3 ? res : pts.map((p) => p.slice());
  }

  // ---------- the document for one map ----------
  // which of the tracing's shapes are still there unchanged: for each edited shape, the index of the identical shape in
  // maps.js (null: new, or changed), and the maps.js shapes that are gone (changed or deleted)
  function shapeMatch(edited, original) {
    const pool = new Map();
    original.forEach((s, k) => { const key = JSON.stringify(s); if (!pool.has(key)) pool.set(key, []); pool.get(key).push(k); });
    const fromTracing = edited.map((s) => { const l = pool.get(JSON.stringify(s)); return l && l.length ? l.shift() : null; });
    const used = new Set(fromTracing.filter((k) => k != null));
    return { fromTracing, dropped: original.map((s, k) => k).filter((k) => !used.has(k)) };
  }
  // works: every map's edits the page holds (id -> its parts, as traced returns them); base: the fingerprint of the
  // tracing the edits were made on. Every geometry field is there, whether it changed or not (`changed` names those that
  // did); an exit's `at` is the arrival as the map it leads to now has it
  function body(MAPS, works, id, base) {
    const t = traced(MAPS, id), w = works[id] || t;
    const atNow = (k) => {
      const e = w.exits[k];
      if (!Array.isArray(e.at) || !MAPS[e.to]) return e.at;
      const tw = works[e.to], a = tw && tw.arrivals.find((x) => x.from === id && x.exit === k);
      return a ? a.at.slice() : e.at;
    };
    const was = (a) => { const o = t.arrivals.find((x) => arrivalKey(x) === arrivalKey(a)); return o ? o.at : null; };
    return {
      map: id, name: MAPS[id].name, savedAt: new Date().toISOString(), base: base || fingerprint(MAPS, id), changed: changedFields(w, t),
      walk: clone(w.walk), block: clone(w.block), front: w.front.map((f) => ({ pts: clone(f.pts), base: f.base })),
      exits: w.exits.map((e, k) => ({ to: e.to, label: e.label, rect: e.rect.slice(), at: atNow(k) })),
      people: w.people.map((n) => ({ id: n.id, name: n.name, at: n.at.slice() })),
      spots: w.spots.map((s) => { const o = { kind: s.kind }; if (s.id) o.id = s.id; if (s.label) o.label = s.label; if (s.rect) o.rect = s.rect.slice(); else o.at = s.at.slice(); return o; }),
      start: w.start.slice(),
      arrivals: w.arrivals.map((a) => { const o = { from: a.from }; if (a.exit != null) o.exit = a.exit; if (a.place != null) o.place = a.place; if (a.landing != null) o.landing = a.landing; o.at = a.at.slice(); o.was = was(a); return o; }),
      shapes: { walk: shapeMatch(w.walk, t.walk), block: shapeMatch(w.block, t.block), front: shapeMatch(w.front.map((f) => [f.pts, f.base]), t.front.map((f) => [f.pts, f.base])) },
    };
  }

  // ---------- the check of a document before it goes into the game ----------
  // two segments cross (strictly: touching ends don't count)
  function cross(a, b, c, d) {
    const o = (p, q, r) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
    return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0;
  }
  function selfCrossing(pts) {
    const n = pts.length;
    for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) { if (i === 0 && j === n - 1) continue; if (cross(pts[i], pts[(i + 1) % n], pts[j], pts[(j + 1) % n])) return true; }
    return false;
  }
  // GAME: { PLACES, LANDINGS } as game.js has them (mirrorGame() in the page). Returns { errors, warnings }: an error
  // means the document can't go into the game as it is; a warning is worth a look
  function validate(MAPS, doc, GAME) {
    const errors = [], warnings = [], err = (s) => errors.push(s), warn = (s) => warnings.push(s);
    if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return { errors: ['this is not one map’s edits'], warnings };
    const id = doc.map, m = MAPS[id];
    if (!m) return { errors: ['there is no map called ' + JSON.stringify(id)], warnings };
    const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
    const ptOK = (p, what) => {
      if (!Array.isArray(p) || p.length !== 2 || !p.every(isNum)) { err(what + ' is not an [x, y] point'); return false; }
      if (p[0] < 0 || p[0] > MW || p[1] < 0 || p[1] > MH) { err(what + ' ' + JSON.stringify(p) + ' is outside the painting (1536 x 1024)'); return false; }
      if (!Number.isInteger(p[0]) || !Number.isInteger(p[1])) warn(what + ' ' + JSON.stringify(p) + ' is not in whole pixels');
      return true;
    };
    const polyOK = (pts, what) => {
      if (!Array.isArray(pts)) { err(what + ' is not a list of points'); return; }
      let ok = true; pts.forEach((p, j) => { ok = ptOK(p, what + ', point ' + j) && ok; }); if (!ok) return;
      if (new Set(pts.map((p) => p[0] + ',' + p[1])).size < 3) { err(what + ' has fewer than three different points, so it doesn’t close round anything'); return; }
      const f = pts[0], l = pts[pts.length - 1];
      if (pts.length > 3 && f[0] === l[0] && f[1] === l[1]) warn(what + ' repeats its first point at the end (maps.js closes every shape by itself)');
      if (area(pts) < 1) err(what + ' closes round no ground at all');
      else if (selfCrossing(pts)) warn(what + ' crosses itself');
    };
    const rectOK = (r, what) => {
      if (!Array.isArray(r) || r.length !== 4 || !r.every(isNum)) { err(what + ' is not a rectangle [x0, y0, x1, y1]'); return; }
      if (!(r[0] < r[2] && r[1] < r[3])) err(what + ' ' + JSON.stringify(r) + ' has no width or height');
      if (r[0] < 0 || r[1] < 0 || r[2] > MW || r[3] > MH) err(what + ' ' + JSON.stringify(r) + ' reaches outside the painting');
    };
    const list = (v, what) => { if (!Array.isArray(v)) { err(what + ' are missing'); return []; } return v; };
    const walk = list(doc.walk, 'the walk areas');
    if (Array.isArray(doc.walk) && !walk.length) err('there are no walk areas left');
    walk.forEach((p, i) => polyOK(p, 'walk area ' + i));
    list(doc.block, 'the blocks').forEach((p, i) => polyOK(p, 'block ' + i));
    list(doc.front, 'the fronts').forEach((f, i) => {
      if (!f || typeof f !== 'object' || Array.isArray(f)) { err('front ' + i + ' is not { pts, base }'); return; }
      polyOK(f.pts, 'front ' + i);
      if (!isNum(f.base) || f.base < 0 || f.base > MH) err('front ' + i + ' has no base line inside the painting');
    });
    // exits, people and spots: maps.js's own, in the same order; only their places may differ
    const exits = list(doc.exits, 'the exits'), ex0 = m.exits || [];
    if (Array.isArray(doc.exits) && exits.length !== ex0.length) err('there are ' + exits.length + ' exits here and ' + ex0.length + ' in maps.js');
    exits.forEach((e, k) => {
      const o = ex0[k]; if (!o || !e) return;
      // a road that led out to the world map when these edits were made, and leads into a wilderness scene now
      // (Dawnroost's south road, the crossroads' west road, the frozen pass's south end): its rectangle is still the
      // edits', and where she arrives is the game's
      if (e.to === 'world' && o.to !== 'world' && MAPS[o.to]) { warn('exit ' + k + ' led out to the world map when this was edited, and leads to ' + placeName(MAPS, o.to) + ' now'); rectOK(e.rect, 'exit ' + k + ' (to ' + o.to + ')'); return; }
      if (e.to !== o.to) err('exit ' + k + ' leads to ' + e.to + ' here and to ' + o.to + ' in maps.js');
      rectOK(e.rect, 'exit ' + k + ' (to ' + o.to + ')');
      if (!Array.isArray(o.at)) { if (e.at !== o.at) err('exit ' + k + ' comes out at ' + JSON.stringify(e.at) + ' here and at ' + JSON.stringify(o.at) + ' in maps.js'); }
      else ptOK(e.at, 'exit ' + k + ' (to ' + o.to + '), where she arrives');
    });
    const people = list(doc.people, 'the people'), pp0 = m.people || [];
    if (Array.isArray(doc.people) && people.length !== pp0.length) err('there are ' + people.length + ' people here and ' + pp0.length + ' in maps.js');
    people.forEach((n, k) => { const o = pp0[k]; if (!o || !n) return; if (n.id !== o.id) err('person ' + k + ' is ' + n.id + ' here and ' + o.id + ' in maps.js'); ptOK(n.at, o.name); });
    const spots = list(doc.spots, 'the spots'), sp0 = m.spots || [];
    if (Array.isArray(doc.spots) && spots.length !== sp0.length) err('there are ' + spots.length + ' spots here and ' + sp0.length + ' in maps.js');
    spots.forEach((s, k) => {
      const o = sp0[k]; if (!o || !s) return;
      const what = 'spot ' + k + ' (' + (o.label || o.id || o.kind) + ')';
      if (s.kind !== o.kind || (s.id || null) !== (o.id || null)) err(what + ' doesn’t match maps.js');
      if (o.rect) rectOK(s.rect, what); else ptOK(s.at, what);
    });
    ptOK(doc.start, 'where a new walk starts');
    list(doc.arrivals, 'the arrivals').forEach((a, k) => {
      if (!a || typeof a !== 'object') { err('arrival ' + k + ' is not an arrival'); return; }
      const what = 'the arrival from ' + arrivalName(MAPS, a);
      let now = null;
      // an arrival from the world map, in edits made before the wilderness scenes: nothing comes from there now
      if (a.from === 'world') { const p = GAME && GAME.PLACES && GAME.PLACES[a.place]; if (!p || !p.map) { warn(what + ' (' + a.place + ') is gone: the world map is only flown now, so it is left out'); return; } if (p.map !== id) err(what + ' (' + a.place + ') doesn’t lead here in game.js'); else now = p.arrive; }
      else if (a.from === 'magpie') { const L = GAME && GAME.LANDINGS && GAME.LANDINGS[a.landing]; if (!L || !L.field || L.field[0] !== id) err(what + ' (' + a.landing + ') doesn’t land here in game.js'); else now = L.field[1]; }
      else { const om = MAPS[a.from], e = om && (om.exits || [])[a.exit]; if (!e || e.to !== id) err(what + ' (its exit ' + a.exit + ') doesn’t lead here in maps.js'); else now = e.at; }
      ptOK(a.at, what);
      if (now && a.was && JSON.stringify(a.was) !== JSON.stringify(now)) warn(what + ' was ' + JSON.stringify(a.was) + ' when this was edited and is ' + JSON.stringify(now) + ' in the game now');
    });
    if (doc.base && doc.base !== fingerprint(MAPS, id)) warn('the game’s tracing of ' + m.name + ' has changed since these edits were made (fingerprint ' + doc.base + ', now ' + fingerprint(MAPS, id) + '): compare before applying them');
    return { errors, warnings };
  }

  // the document laid over a copy of the map, as the game would have it (for the reach check)
  function applied(MAPS, doc) {
    const t = traced(MAPS, doc.map);
    t.walk = clone(doc.walk); t.block = clone(doc.block); t.front = doc.front.map((f) => ({ pts: clone(f.pts), base: f.base }));
    t.exits.forEach((e, k) => { if (doc.exits[k]) e.rect = doc.exits[k].rect.slice(); });
    t.people.forEach((n, k) => { if (doc.people[k]) n.at = doc.people[k].at.slice(); });
    t.spots.forEach((s, k) => { const d = doc.spots[k]; if (!d) return; if (s.rect) s.rect = d.rect.slice(); else s.at = d.at.slice(); });
    t.start = doc.start.slice();
    t.arrivals.forEach((a) => { const d = doc.arrivals.find((x) => arrivalKey(x) === arrivalKey(a)); if (d) a.at = d.at.slice(); });
    return t;
  }

  G.MapEdits = {
    MW, MH, CELL, GW, GH, REACH, WORLD_IN, MAGPIE_IN, FIELDS,
    clone, inPoly, bbox, area, centre, placeName, arrivalsInto, arrivalKey, arrivalName, mirrorGame,
    traced, part, geom, hash, fingerprint, changedFields, standTest, reach, smooth, shapeMatch, body, validate, applied,
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
