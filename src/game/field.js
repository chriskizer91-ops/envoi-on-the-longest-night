// field.js: walking a ground-level map (plan step 18). Io walks one of the traced paintings (src/game/maps.js), painted
// as Path Polish paints her (src/walk/painted-io.js), with its easing into and out of a walk; the pixel Io stands in
// until her art loads, or when no painted Io is given:
// the arrow keys, the d-pad (one thumb rolls round it to any of eight ways, as on Witch Way's pad) or the map itself:
// press and hold to steer her toward the finger or the mouse, or tap or click to walk her there round the walls, by a
// path found on a coarse grid of the walk areas and straightened (Chris: directing her and tapping to walk are one), or
// on the narrow ways the grid is too coarse to see (his secret paths, up a tree and along a roof's ridge) by a finer search.
// Walking into a corner, she slips sideways round it, as Witch Way's walker does. The townsfolk stand in their places (sprites.js) and turn to her when she talks to them. The action
// button names what is in reach: a person to talk to, a well, a rest, something to look at, the Magpie. Exits take her
// to the next map, event areas start a story beat or a set fight once, and in the wilds every step fills a hidden
// counter that starts a random fight when it passes a threshold, so fights come evenly: never two back to back. The
// counter and its threshold carry from map to map, so a row of wild scenes is walked as one.
// The camera follows her; the mini-map in the corner shows the whole map, the view, the exits (not the roads out of the
// picture that she turns back from, to: 'world') and the people.
// Map coordinates are the paintings' own 1536 x 1024 pixels whatever size they ship at.
// Field.create(host, opts) -> { load(id, at, dir), pause(), resume(), P, map, near(), redraw(), stage, setPicture(url),
//   canStand(x, y) (whether her feet fit there, on the map she is on: the rule her every step follows), setCounter(v) and
//   gap (the map px walked since the last random fight, and the gap to the next at the settings now, for the tests) }
//   stage: the story's actors, walking on the map while a scene plays (handoff, section 5): add(id, look, [x, y], dir),
//   walk(id, path, speed) -> Promise (path: points to walk through), face(id, dir), remove(id), clear(), io(path, speed)
//   -> Promise (Io walks it, even while the field is paused for the scene), ioFace(dir), focus([x, y], an actor's id, or
//   null) (the camera eases to a point, or follows the actor as they walk, and back to Io), hidePerson(id, hide) (a
//   townsperson steps out of their place to act)
//   opts: maps, speed (map px a second), zoom, ioH (map px), encounter: { mean, min } (map px walked between fights),
//   light(map) (the painting's brightness, 1 as painted), paintedIo (makePaintedIo's), paintedFolk (makePaintedFolk's:
//   the townsfolk and the story's actors as painted paper dolls, by their ids, once their sheets load), and for the painted Io:
//   pace (her walk in her own heights a second; it replaces speed), ioScreen (her height as a share of the screen's
//   shorter side; it sets the camera's closeness in place of zoom), showWalk (draws the walk areas, for checking them);
//   the page may change ioH, pace, ioScreen and showWalk while it runs
//   and the callbacks onExit(exit), onEvent(spot), onTalk(person), onSpot(spot), onEncounter(map), onMenu(), onStep(map, running),
//   isDone(id) (an event or a well already used), glint() (the keepsakes' glints shine brighter), src(path) (the art's URL), goal(mapId) -> null or { x, y, kind:
//   'person' | 'spot' | 'event' | 'exit', out (an exit's outward angle) }: the story's next step, which the little arrow
//   points to (goal-arrow.js) and the mini-map marks
//   pose(name, seconds) -> Promise: the painted Io kneels ('kneel') or casts moonlight ('cast'), even in a scene
// Needs makePixelIo (src/walk/pixel-io.js) and makeFolk (sprites.js; the pixel figures stand in for anyone without a
// painted sheet, or until it loads). Defines window.Field.
(function () {
  'use strict';
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  function el(tag, attrs, parent, text) { const e = document.createElement(tag); if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]); if (text !== undefined) e.textContent = text; if (parent) parent.appendChild(e); return e; }
  const inPoly = (pts, x, y) => { let ins = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins; } return ins; };
  const inRect = (r, x, y) => x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3];
  // an exit reaches 8 px further in than its rectangle: her feet stay a few pixels inside the walk area, so an exit at
  // the painting's edge would otherwise be just out of reach
  const inExit = (r, x, y) => x >= r[0] - 8 && x <= r[2] + 8 && y >= r[1] - 8 && y <= r[3] + 8;
  const MW = 1536, MH = 1024, CELL = 12, GW = Math.ceil(MW / CELL), GH = Math.ceil(MH / CELL);
  const REACH = 58; // how close Io must stand to talk or use something (map px)
  const SLIP = 14; // how far sideways she looks for a way round a corner she walks into (map px; about a quarter of her height)

  function create(host, opts) {
    const DPR = Math.min(window.devicePixelRatio || 1, 3);
    const speed = opts.speed || 110;
    const root = el('div', { class: 'field' }, host);
    const cv = el('canvas', { class: 'field-cv', 'aria-hidden': 'true' }, root), g = cv.getContext('2d');
    const plate = el('div', { class: 'field-plate win', role: 'status', 'aria-live': 'polite' }, root);
    const mini = el('canvas', { class: 'mini', role: 'img', 'aria-label': 'Mini-map' }, root), mg = mini.getContext('2d');
    let miniBig = false;
    mini.addEventListener('pointerdown', (e) => { e.stopPropagation(); miniBig = !miniBig; mini.classList.toggle('big', miniBig); });
    const menuBtn = el('button', { type: 'button', class: 'field-menu', 'aria-label': 'Menu' }, root, '☰ Menu');
    menuBtn.addEventListener('click', () => { if (!paused && opts.onMenu) opts.onMenu(); });
    const act = el('button', { type: 'button', class: 'field-act', hidden: '' }, root);
    act.addEventListener('click', () => { if (!paused) useNear(); });
    // the d-pad, over the bottom right: one thumb steers it, rolling round to any of eight ways without lifting (Witch
    // Way's pad, follow-me-down-witch-way game/src/input.js); padDirs holds its ways, held the keys'
    const pad = el('div', { class: 'pad', role: 'group', 'aria-label': 'Walk' }, root);
    const held = new Set(), padDirs = new Set(), padBtns = {};
    for (const [d, label, glyph] of [['n', 'Up', '▲'], ['w', 'Left', '◀'], ['e', 'Right', '▶'], ['s', 'Down', '▼']]) padBtns[d] = el('button', { type: 'button', class: 'pad-' + d, 'aria-label': label }, pad, glyph);
    const OCTANT = [['e'], ['e', 's'], ['s'], ['s', 'w'], ['w'], ['w', 'n'], ['n'], ['n', 'e']];
    let padId = null;
    function padAim(e) {
      const r = pad.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      padDirs.clear();
      if (Math.hypot(dx, dy) > r.width * 0.12) for (const d of OCTANT[(Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8]) padDirs.add(d);
      for (const d in padBtns) padBtns[d].classList.toggle('lit', padDirs.has(d));
      route = null; target = null;
    }
    const padEnd = (e) => { if (e.pointerId !== padId) return; padId = null; padDirs.clear(); for (const d in padBtns) padBtns[d].classList.remove('lit'); };
    pad.addEventListener('pointerdown', (e) => { e.preventDefault(); if (padId !== null) return; padId = e.pointerId; if (pad.setPointerCapture) pad.setPointerCapture(e.pointerId); padAim(e); });
    pad.addEventListener('pointermove', (e) => { if (e.pointerId === padId) padAim(e); });
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) pad.addEventListener(ev, padEnd);
    const KEYS = { ArrowUp: 'n', ArrowDown: 's', ArrowLeft: 'w', ArrowRight: 'e', w: 'n', s: 's', a: 'w', d: 'e', W: 'n', S: 's', A: 'w', D: 'e' };
    const onKey = (e) => {
      if (paused || !root.isConnected || root.hidden) return;
      const d = KEYS[e.key];
      if (d) { held.add(d); route = null; e.preventDefault(); }
      else if (e.key === 'Enter' || e.key === ' ' || e.key === 'z' || e.key === 'Z') { useNear(); e.preventDefault(); }
      else if (e.key === 'Escape' || e.key === 'm' || e.key === 'M') { if (opts.onMenu) opts.onMenu(); e.preventDefault(); }
    };
    const onKeyUp = (e) => { const d = KEYS[e.key]; if (d) held.delete(d); };
    window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKeyUp);

    const io = makePixelIo(1), painted = opts.paintedIo || null, folk = opts.paintedFolk || null;
    const folkSprites = {};
    const sprite = (look) => folkSprites[look] || (folkSprites[look] = makeFolk(look, 1));
    // run: how long she has walked without stopping; after a moment the pace builds to a run (handoff, section 8)
    // vx, vy: her speed (map px a second), eased as Path Polish's motion eases it; walk: how far she has walked, in her
    // heights, for her painted steps; lean and turn: the motion's lean into the walk and into a turn; pose: kneel or cast
    const P = { x: 0, y: 0, dir: 's', walkT: 0, moving: false, counter: 0, roll: null, run: 0, stepD: 0, vx: 0, vy: 0, walk: 0, lean: 0, turn: 0, blocked: 0, pose: null, poseT: 0, poseDur: 1, poseRes: null };
    const RUN = 0.5; // the run is half again her walk
    const ioH = () => opts.ioH || 42;
    let map = null, img = null, grid = null, route = null, paused = false, lastExit = null, flash = 0, goalNow = null;
    const cam = { z: opts.zoom || 0.7, x: 0, y: 0 };
    // the story's actors, Io's scripted walk, and where the camera looks (eased toward a scene's focus, then back to Io)
    const actors = [], ioWalk = { path: null, speed: 110, res: null }, look = { x: 0, y: 0, h: 0.55, on: false, focus: null };
    function layout() { cv.width = Math.round(root.clientWidth * DPR); cv.height = Math.round(root.clientHeight * DPR); }

    // ---------- where she can stand: inside a walk area and outside every block, a few pixels either side of her feet ----------
    function freeAt(x, y) {
      if (!map) return false;
      let ok = false; for (const p of map.walk) if (inPoly(p, x, y)) { ok = true; break; }
      if (!ok) return false;
      for (const p of map.block || []) if (inPoly(p, x, y)) return false;
      for (const n of map.people || []) if (Math.abs(n.at[0] - x) < 11 && Math.abs(n.at[1] - y) < 7) return false;
      return true;
    }
    const canStand = (x, y) => freeAt(x, y) && freeAt(x - 6, y) && freeAt(x + 6, y);
    // the coarse grid for tap-to-walk: each 12 px cell is open if its centre is
    function buildGrid() {
      grid = new Uint8Array(GW * GH);
      // a cell is open when she can stand at its centre and at the middle of each edge, so a path between open cells is
      // open all the way
      for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) { const x = i * CELL + CELL / 2, y = j * CELL + CELL / 2, h = CELL / 2 - 1; grid[j * GW + i] = canStand(x, y) && canStand(x, y - h) && canStand(x, y + h) && canStand(x - h, y) && canStand(x + h, y) ? 1 : 0; }
    }
    const openAt = (x, y) => !!grid[clamp(Math.floor(y / CELL), 0, GH - 1) * GW + clamp(Math.floor(x / CELL), 0, GW - 1)];
    // the fine search, for the narrow ways the grid can't see (a way under 22 px wide has no open cell, though her feet
    // fit a 12 px one): an A* search in 4 px steps from (x0, y0) to (tx, ty), on the same rule as her feet, giving up
    // after FINE_MAX steps. Returns the points along the way, ending at (tx, ty), or null
    const FINE = 4, FINE_MAX = 20000, DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
    function fineWay(x0, y0, tx, ty) {
      const key = (i, j) => (i + 1024) * 2048 + j + 1024, ok = new Map(), from = new Map(), cost = new Map();
      const can = (i, j) => { const k = key(i, j); let v = ok.get(k); if (v === undefined) ok.set(k, v = canStand(x0 + i * FINE, y0 + j * FINE)); return v; };
      const gi = (tx - x0) / FINE, gj = (ty - y0) / FINE;
      const est = (i, j) => { const a = Math.abs(i - gi), b = Math.abs(j - gj); return Math.max(a, b) + 0.414 * Math.min(a, b); };
      const heap = []; // [estimate, cost, i, j], the smallest estimate first
      const push = (n) => { let c = heap.length; heap.push(n); while (c) { const p = (c - 1) >> 1; if (heap[p][0] <= n[0]) break; heap[c] = heap[p]; c = p; } heap[c] = n; };
      const pop = () => {
        const top = heap[0], last = heap.pop();
        if (heap.length) { let c = 0; for (;;) { let m = c * 2 + 1; if (m >= heap.length) break; if (m + 1 < heap.length && heap[m + 1][0] < heap[m][0]) m++; if (heap[m][0] >= last[0]) break; heap[c] = heap[m]; c = m; } heap[c] = last; }
        return top;
      };
      push([est(0, 0), 0, 0, 0]); cost.set(key(0, 0), 0); from.set(key(0, 0), null);
      for (let n = 0; heap.length && n < FINE_MAX; n++) {
        const [, c0, ci, cj] = pop(), k0 = key(ci, cj);
        if (c0 > cost.get(k0)) continue; // a step already reached a shorter way
        if (Math.abs(ci - gi) <= 1.5 && Math.abs(cj - gj) <= 1.5) {
          const pts = [[tx, ty]];
          for (let c = from.get(k0), at = [ci, cj]; at; at = c, c = c && from.get(key(c[0], c[1]))) if (at[0] || at[1]) pts.push([x0 + at[0] * FINE, y0 + at[1] * FINE]);
          return pts.reverse();
        }
        for (const [di, dj] of DIRS) {
          const i = ci + di, j = cj + dj;
          if (!can(i, j) || (di && dj && (!can(ci + di, cj) || !can(ci, cj + dj)))) continue; // no cutting corners
          const c = c0 + (di && dj ? 1.414 : 1), k = key(i, j), was = cost.get(k);
          if (was !== undefined && c >= was) continue;
          cost.set(k, c); from.set(k, [ci, cj]); push([c + est(i, j), c, i, j]);
        }
      }
      return null;
    }
    // breadth-first from her cell to the open cell nearest the tap; the path is smoothed to the cells where it turns.
    // When she stands on a narrow way, or the tap lands on one, the fine search finds the way instead
    function findRoute(tx, ty) {
      const si = clamp(Math.floor(P.x / CELL), 0, GW - 1), sj = clamp(Math.floor(P.y / CELL), 0, GH - 1);
      let ti = clamp(Math.floor(tx / CELL), 0, GW - 1), tj = clamp(Math.floor(ty / CELL), 0, GH - 1);
      const narrow = !openAt(P.x, P.y) && canStand(P.x, P.y);
      if (narrow || (!grid[tj * GW + ti] && canStand(tx, ty))) { const f = fineWay(P.x, P.y, tx, ty); if (f) return straighten(f); }
      if (!grid[tj * GW + ti]) { // the nearest open cell to the tap
        let best = null, bd = 1e9;
        for (let r = 1; r < 12 && !best; r++) for (let j = tj - r; j <= tj + r; j++) for (let i = ti - r; i <= ti + r; i++) {
          if (i < 0 || j < 0 || i >= GW || j >= GH || !grid[j * GW + i]) continue;
          const d = (i - ti) ** 2 + (j - tj) ** 2; if (d < bd) { bd = d; best = [i, j]; }
        }
        if (!best) return null; [ti, tj] = best; tx = ti * CELL + CELL / 2; ty = tj * CELL + CELL / 2;
      }
      if (narrow) { const f = fineWay(P.x, P.y, tx, ty); return f ? straighten(f) : null; } // from a narrow way to the grid
      const prev = new Int32Array(GW * GH).fill(-1), start = sj * GW + si, goal = tj * GW + ti;
      const q = [start]; prev[start] = start;
      for (let h = 0; h < q.length; h++) {
        const c = q[h]; if (c === goal) break;
        const ci = c % GW, cj = (c - ci) / GW;
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
          const i = ci + di, j = cj + dj; if (i < 0 || j < 0 || i >= GW || j >= GH) continue;
          const n = j * GW + i; if (prev[n] >= 0 || !grid[n]) continue;
          if (di && dj && (!grid[cj * GW + i] || !grid[j * GW + ci])) continue; // no cutting corners
          prev[n] = c; q.push(n);
        }
      }
      if (prev[goal] < 0) return null;
      const cells = []; for (let c = goal; c !== start; c = prev[c]) cells.push(c); cells.reverse();
      const pts = cells.map((c) => [(c % GW) * CELL + CELL / 2, Math.floor(c / GW) * CELL + CELL / 2]);
      if (pts.length) pts[pts.length - 1] = [tx, ty];
      return straighten(pts);
    }
    // a straight line she can walk all the way along (looked at every 2 px, fine enough for the corners of a narrow way)
    function clearLine(x0, y0, x1, y1) {
      const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 2);
      for (let i = 1; i <= n; i++) if (!canStand(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n)) return false;
      return true;
    }
    // the grid's path, pulled straight: from where she stands, she heads for the farthest point of it she can reach in a
    // straight line, so a tapped walk goes as a person would rather than from cell to cell
    function straighten(pts) {
      const out = []; let x = P.x, y = P.y, i = 0;
      while (i < pts.length) {
        let j = i; while (j + 1 < pts.length && clearLine(x, y, pts[j + 1][0], pts[j + 1][1])) j++;
        out.push(pts[j]); [x, y] = pts[j]; i = j + 1;
      }
      return out;
    }

    // the map itself: a press that is held, or that moves, steers her toward the finger or the mouse until it lifts; a
    // quick tap walks her to the spot, and a tap on a person or a spot walks to them and then talks or uses it
    const press = { id: null, x: 0, y: 0, x0: 0, y0: 0, t0: 0, steer: false };
    const toMap = (cx, cy) => { const r = cv.getBoundingClientRect(); return [cam.x + (cx - r.left) / cam.z, cam.y + (cy - r.top) / cam.z]; };
    cv.addEventListener('pointerdown', (e) => {
      if (paused || !map || press.id !== null) return;
      Object.assign(press, { id: e.pointerId, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t0: performance.now(), steer: false });
      if (cv.setPointerCapture) cv.setPointerCapture(e.pointerId);
    });
    cv.addEventListener('pointermove', (e) => {
      if (e.pointerId !== press.id) return;
      press.x = e.clientX; press.y = e.clientY;
      if (!press.steer && Math.hypot(press.x - press.x0, press.y - press.y0) > 12) { press.steer = true; route = null; target = null; }
    });
    const pressEnd = (e) => {
      if (e.pointerId !== press.id) return;
      const tap = !press.steer && e.type === 'pointerup'; press.id = null; press.steer = false;
      if (!tap || paused || !map) return;
      const [x, y] = toMap(e.clientX, e.clientY);
      const hit = things().find((t) => Math.hypot(t.x - x, t.y - 20 - y) < 30 || Math.hypot(t.x - x, t.y - y) < 26);
      route = findRoute(x, y); target = hit || null;
    };
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) cv.addEventListener(ev, pressEnd);
    let target = null;

    // ---------- what is in reach ----------
    function things() {
      const out = [];
      for (const n of map.people || []) if (!n.hidden) out.push({ kind: 'person', ref: n, x: n.at[0], y: n.at[1], label: 'Talk to ' + n.name });
      for (const s of map.spots || []) {
        if (s.kind === 'event' || (s.hide && s.hide())) continue;
        const used = s.kind === 'well' && opts.isDone && opts.isDone('well:' + s.id);
        out.push({ kind: s.kind, ref: s, x: s.at[0], y: s.at[1], label: s.kind === 'rest' ? 'Rest' : s.kind === 'magpie' ? 'The Magpie' : (used ? 'Look: ' : '') + s.label, used });
      }
      return out;
    }
    function near() {
      if (!map) return null;
      let best = null, bd = REACH;
      for (const t of things()) { const d = Math.hypot(t.x - P.x, (t.y - P.y) * 1.3); if (d < bd) { bd = d; best = t; } }
      return best;
    }
    function useNear() {
      const t = near(); if (!t) return;
      held.clear(); padDirs.clear(); press.steer = false; route = null; target = null;
      // she turns to face it, and a person turns to face her
      const dx = t.x - P.x, dy = t.y - P.y; P.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'e' : 'w') : (dy > 0 ? 's' : 'n');
      if (t.kind === 'person') { t.ref.face = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'w' : 'e') : (dy > 0 ? 'n' : 's'); if (opts.onTalk) opts.onTalk(t.ref); }
      else if (opts.onSpot) opts.onSpot(t.ref);
    }

    // ---------- loading a map ----------
    function load(id, at, dir) {
      const m = opts.maps[id]; if (!m) throw new Error('no map ' + id);
      map = m; m.id = id; route = null; target = null; held.clear(); padDirs.clear(); press.id = null; press.steer = false; lastExit = null; flash = 1; actors.length = 0; look.on = false; look.focus = null;
      P.x = (at || m.start)[0]; P.y = (at || m.start)[1]; P.dir = dir || 's'; P.walkT = 0; P.vx = P.vy = 0; P.lean = P.turn = 0;
      for (const n of m.people || []) n.face = n.face0 || 's';
      buildGrid();
      // never start inside a wall (a save made off the ground, or on a path a later edit moved): the middle of the nearest
      // open cell, outside every exit. A plain scan of the grid, since a route from where she stands can't start where
      // every cell round her is closed
      if (!canStand(P.x, P.y)) {
        const x0 = P.x, y0 = P.y; let bd = 1e9;
        for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
          if (!grid[j * GW + i]) continue;
          const x = i * CELL + CELL / 2, y = j * CELL + CELL / 2, d = (x - x0) ** 2 + (y - y0) ** 2;
          if (d < bd && !(m.exits || []).some((ex) => inExit(ex.rect, x, y))) { bd = d; P.x = x; P.y = y; }
        }
      }
      // the threshold carries from map to map with the counter, so a row of wild scenes is one walk and fights don't
      // bunch where one scene meets the next (it is drawn again only after a fight)
      if (P.roll == null) P.roll = Math.random();
      plate.textContent = m.name;
      return new Promise((res) => {
        const next = new Image();
        next.onload = () => { img = next; res(); };
        next.onerror = () => { img = null; res(); };
        next.src = opts.src ? opts.src(m.src) : m.src;
      });
    }
    // the gap to the next random fight, in map px walked: around the mean, never less than the minimum. What's drawn and
    // kept is the roll (P.roll, 0 to 1), not the gap, so a change to how often fights come (the menu's Random fights,
    // through opts.encounter) holds at once rather than after the next fight
    function gapNow() {
      const E = opts.encounter || { mean: 770, min: 440 }, rate = (map && map.wild && map.wild.rate) || 1;
      return Math.max(E.min, E.mean * (0.55 + P.roll * 0.9)) / rate;
    }

    // the way turns by more than about 50 degrees at b, going from (ax, ay) through b to c
    const sharpTurn = (ax, ay, b, c) => { const ux = b[0] - ax, uy = b[1] - ay, vx = c[0] - b[0], vy = c[1] - b[1], d = Math.hypot(ux, uy) * Math.hypot(vx, vy); return d > 0 && (ux * vx + uy * vy) / d < 0.64; };

    // ---------- the loop ----------
    let last = performance.now(), stopped = false;
    function frame(t) {
      if (stopped) return;
      // never a step back in time: resume() and show() set the clock from performance.now(), which can be later than
      // this frame's own time
      const dt = Math.max(0, Math.min(0.05, (t - last) / 1000)); last = t;
      if (map && img && !paused && !root.hidden) step(dt);
      if (map && img && !root.hidden) stageStep(dt);
      if (map && img && !root.hidden) draw(t);
      requestAnimationFrame(frame);
    }
    function step(dt) {
      if (P.pose) { P.vx = P.vy = 0; P.moving = false; return; } // a pose holds her still
      let dx = 0, dy = 0, last = false;
      // a press held on the map that has turned into steering, once it has been held a moment
      if (press.id !== null && !press.steer && performance.now() - press.t0 > 220) { press.steer = true; route = null; target = null; }
      const steering = press.id !== null && press.steer, dirs = held.size ? held : padDirs;
      if (dirs.size) { if (dirs.has('e')) dx++; if (dirs.has('w')) dx--; if (dirs.has('s')) dy++; if (dirs.has('n')) dy--; }
      else if (steering) {
        // toward the finger or the mouse, eased to a stop as she comes under it
        const [tx, ty] = toMap(press.x, press.y); dx = tx - P.x; dy = ty - P.y;
        const d = Math.hypot(dx, dy); if (d < 10) { dx = dy = 0; } else if (d < 40) { dx *= d / 40; dy *= d / 40; }
      }
      else if (route && route.length) {
        let [wx, wy] = route[0]; dx = wx - P.x; dy = wy - P.y;
        if (Math.hypot(dx, dy) < 3) {
          route.shift();
          if (!route.length) { route = null; dx = dy = 0; if (target) { const tt = target; target = null; const n = near(); if (n && n.ref === tt.ref) useNear(); } }
          else { [wx, wy] = route[0]; dx = wx - P.x; dy = wy - P.y; }
        }
        // she slows into the end of the walk, and into a sharp turn, which on a narrow way she would otherwise overrun
        last = !!route && (route.length === 1 || sharpTurn(P.x, P.y, route[0], route[1]));
      }
      const L = Math.hypot(dx, dy), h = ioH();
      const pace = 1 + RUN * clamp((P.run - 0.8) / 0.8, 0, 1), top = (opts.pace ? opts.pace * h : speed) * pace;
      // the speed she heads for: full pace where she's going, slowing into the end of a tapped walk. As in Path
      // Polish's motion, her speed eases toward it: about a tenth of a second to start, a little less to stop.
      let tx = 0, ty = 0;
      if (L > 0) { const sp = last ? Math.min(top, L * 9) : top; tx = dx / L * sp; ty = dy / L * sp; }
      const ek = 1 - Math.exp(-dt / ((L > 0 ? 0.12 : 0.10) / 3));
      P.vx += (tx - P.vx) * ek; P.vy += (ty - P.vy) * ek;
      if (!L && Math.hypot(P.vx, P.vy) < 2) { P.vx = 0; P.vy = 0; }
      const mx = P.vx * dt, my = P.vy * dt, x0 = P.x, y0 = P.y;
      if (mx || my) {
        // slide along walls: the whole step; a longer one, of up to 4 px, over a sliver of wall (where two walk areas meet
        // in a sharp notch, as Chris's roof path does); or the part of it that's open
        const ml = Math.hypot(mx, my), over = () => (ml < 4 ? [2, 3, 4].find((d) => d > ml && canStand(P.x + mx / ml * d, P.y + my / ml * d)) : 0);
        let d;
        if (canStand(P.x + mx, P.y + my)) { P.x += mx; P.y += my; }
        else if ((d = over())) { P.x += mx / ml * d; P.y += my / ml * d; }
        else if (mx && canStand(P.x + mx, P.y)) { P.x += mx; P.vy = 0; }
        else if (my && canStand(P.x, P.y + my)) { P.y += my; P.vx = 0; }
        else if (dirs.size || steering || route) {
          // walking straight into a corner: she slips sideways round it, toward the nearer opening within a few pixels,
          // at her own pace (Witch Way's walker.js, slide)
          const sp = top * dt, L2 = Math.hypot(mx, my) || 1, ux = mx / L2, uy = my / L2;
          slip: for (let off = 2; off <= SLIP; off += 2) for (const sg of [1, -1]) {
            const ox = -uy * sg, oy = ux * sg;
            if (canStand(P.x + ox * off + mx, P.y + oy * off + my) && canStand(P.x + ox * sp, P.y + oy * sp)) { P.x += ox * sp; P.y += oy * sp; break slip; }
          }
        }
      }
      const moved = Math.hypot(P.x - x0, P.y - y0);
      P.moving = moved > 0.02;
      if (L > 0) {
        const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'e' : 'w') : (dy > 0 ? 's' : 'n');
        if (dir !== P.dir) P.turn = dx === 0 ? (dir === 'n' ? -1 : 1) : Math.sign(dx);
        P.dir = dir;
      }
      P.turn *= Math.exp(-dt / 0.11);
      P.lean = top > 0 ? clamp(P.vx / top, -1, 1) : 0;
      if (P.moving) {
        P.walkT += dt * pace; P.run += dt; P.blocked = 0; if (map.wild) P.counter += moved;
        // her steps: a footfall as each painted step lands (frames 0 and 3 of the six), for opts.onStep
        const f0 = Math.floor(P.walk * 6.4) % 6; P.walk += moved / h; const f1 = Math.floor(P.walk * 6.4) % 6;
        if (f1 !== f0 && (f1 === 0 || f1 === 3) && opts.onStep) opts.onStep(map, pace > 1.3);
      }
      else if (L > 0) { P.blocked += dt; if (route && P.blocked > 0.25) { route = null; target = null; } } // a tapped walk that's stuck gives up
      if (!P.moving) { P.walkT = 0; P.run = 0; }
      // exits, then events, then the wilds
      for (const ex of map.exits || []) {
        if (inExit(ex.rect, P.x, P.y)) { if (lastExit !== ex) { lastExit = ex; held.clear(); route = null; if (opts.onExit) opts.onExit(ex); } return; }
      }
      lastExit = null;
      for (const s of map.spots || []) {
        if (s.kind !== 'event' || !s.rect || !inRect(s.rect, P.x, P.y)) continue;
        if (s.once && opts.isDone && opts.isDone(s.once)) continue;
        if (s.when && !s.when()) continue;
        // an event on a wild map (Halcyon's ambush on the crossroads) starts the count to the next random fight again, as a
        // fight does, so none comes a step or two after it
        held.clear(); route = null; if (map.wild) { P.counter = 0; P.roll = Math.random(); } if (opts.onEvent) opts.onEvent(s); return;
      }
      if (map.wild && P.counter >= gapNow()) { P.counter = 0; P.roll = Math.random(); held.clear(); route = null; if (opts.onEncounter) opts.onEncounter(map); }
    }
    // ---------- the story's actors ----------
    function walkAlong(a, dt) {
      if (!a.path || !a.path.length) return false;
      const [tx, ty] = a.path[0], dx = tx - a.x, dy = ty - a.y, L = Math.hypot(dx, dy), sp = a.speed * dt;
      if (L > 0.01) a.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'e' : 'w') : (dy > 0 ? 's' : 'n');
      a.walk = (a.walk || 0) + Math.min(L, sp) / ioH();
      // a walk to the point she already stands on (or as good as) arrives at once, rather than dividing by nothing
      if (L <= Math.max(sp, 0.01)) { a.x = tx; a.y = ty; a.path.shift(); if (!a.path.length) { a.path = null; const r = a.res; a.res = null; if (r) r(); return false; } }
      else { a.x += dx / L * sp; a.y += dy / L * sp; }
      a.walkT += dt * a.speed / 110; return true;
    }
    function stageStep(dt) {
      for (const a of actors) { a.moving = walkAlong(a, dt); if (!a.moving) a.walkT = 0; }
      if (ioWalk.path) {
        const q = { x: P.x, y: P.y, dir: P.dir, path: ioWalk.path, speed: ioWalk.speed, res: ioWalk.res, walkT: P.walkT };
        const x0 = P.x, y0 = P.y;
        P.moving = walkAlong(q, dt); P.x = q.x; P.y = q.y; P.dir = q.dir; P.walkT = P.moving ? q.walkT : 0;
        P.walk += Math.hypot(P.x - x0, P.y - y0) / ioH(); P.lean = 0;
        ioWalk.path = q.path; ioWalk.res = q.res;
      }
      if (P.pose) { P.poseT += dt; if (P.poseT >= P.poseDur) { const r = P.poseRes; P.pose = null; P.poseRes = null; if (r) r(); } }
    }
    const stage = {
      add(id, lookId, at, dir) { stage.remove(id); actors.push({ id, look: lookId, x: at[0], y: at[1], dir: dir || 's', path: null, speed: 110, res: null, walkT: 0, moving: false }); },
      walk(id, path, speed) {
        const a = actors.find((x) => x.id === id); if (!a) return Promise.resolve();
        if (a.res) a.res();
        return new Promise((res) => { a.path = path.map((p) => p.slice()); a.speed = speed || 110; a.res = res; });
      },
      face(id, dir) { const a = actors.find((x) => x.id === id); if (a) a.dir = dir; },
      remove(id) { const i = actors.findIndex((x) => x.id === id); if (i >= 0) { const a = actors[i]; actors.splice(i, 1); if (a.res) a.res(); } },
      clear() { while (actors.length) stage.remove(actors[0].id); for (const n of (map && map.people) || []) n.hidden = false; look.focus = null; },
      io(path, speed) { if (ioWalk.res) ioWalk.res(); return new Promise((res) => { ioWalk.path = path.map((p) => p.slice()); ioWalk.speed = speed || 110; ioWalk.res = res; }); },
      ioFace(dir) { P.dir = dir; },
      focus(at) { look.focus = at ? (typeof at === 'string' ? { follow: at } : { x: at[0], y: at[1] }) : null; if (at && !look.on) { look.on = true; look.x = P.x; look.y = P.y; } },
      hidePerson(id, hide) { for (const n of (map && map.people) || []) if (n.id === id) n.hidden = !!hide; },
      actor: (id) => actors.find((x) => x.id === id) || null,
    };

    function draw(t) {
      const W = cv.width / DPR, H = cv.height / DPR;
      // with the painted Io the camera comes close enough for her to stand ioScreen of the screen's shorter side
      // (each map's own zoom, 0.7 as standard, still nudges it); the townsfolk keep her scale
      const usePainted = painted && painted.loaded;
      cam.z = usePainted && opts.ioScreen ? opts.ioScreen * Math.min(W, H) / ioH() * (map.zoom || 0.7) / 0.7
        : (map.zoom || opts.zoom || 0.7) * Math.max(1, Math.min(W, H) / 700);
      cam.z = Math.max(cam.z, W / MW, H / MH); // never wider than the painting
      const sk = cam.z * ioH() / io.h;
      const vw = W / cam.z, vh = H / cam.z, mk = img.naturalWidth / MW;
      // the camera follows Io; in a scene it eases to the scene's focus and back, then follows her again
      let cx0 = P.x, cy0 = P.y;
      if (look.on) {
        // in a scene the point of interest sits higher (h), clear of the dialogue box along the bottom
        // the focus: a point, or an actor followed as they walk (focus('sol'))
        const fa = look.focus && look.focus.follow ? actors.find((a) => a.id === look.focus.follow) : null;
        const tg = fa || (look.focus && !look.focus.follow ? look.focus : P), k = 1 - Math.exp(-(t - (look.t || t)) / 1000 * 3.2);
        look.x += (tg.x - look.x) * k; look.y += (tg.y - look.y) * k; look.h += ((look.focus ? 0.4 : 0.55) - look.h) * k; cx0 = look.x; cy0 = look.y;
        if (!look.focus && Math.hypot(look.x - P.x, look.y - P.y) < 2 && look.h > 0.545) { look.on = false; look.h = 0.55; }
      }
      look.t = t;
      cam.x = vw >= MW ? (MW - vw) / 2 : clamp(cx0 - vw / 2, 0, MW - vw);
      cam.y = vh >= MH ? (MH - vh) / 2 : clamp(cy0 - vh * (look.on ? look.h : 0.55), 0, MH - vh);
      g.setTransform(DPR, 0, 0, DPR, 0, 0);
      g.fillStyle = '#0b0912'; g.fillRect(0, 0, W, H);
      g.imageSmoothingEnabled = false;
      const lit = opts.light ? opts.light(map) : 1;
      if (lit !== 1) g.filter = 'brightness(' + lit + ')';
      g.drawImage(img, cam.x * mk, cam.y * mk, vw * mk, vh * mk, 0, 0, W, H);
      g.filter = 'none';
      if (opts.showWalk) drawWalk();
      // spots glimmer softly, so a player can find them
      const pulse = 0.5 + 0.5 * Math.sin(t / 300), bright = !!(opts.glint && opts.glint());
      for (const s of things()) {
        if (s.kind === 'person') continue;
        const x = (s.x - cam.x) * cam.z, y = (s.y - cam.y) * cam.z;
        const c = s.kind === 'rest' ? '255,214,140' : s.kind === 'magpie' ? '160,200,255' : s.kind === 'keepsake' ? '215,230,255' : s.used ? '200,200,220' : '255,240,200';
        // a keepsake only twinkles now and then, and small; with the Hag-Stone worn (opts.glint) it glints brighter
        const r = s.kind === 'keepsake' ? (bright ? 4 + 3 * pulse : 2 + 4 * Math.pow(Math.max(0, Math.sin(t / 700)), 6)) : (s.used ? 4 : 6) + pulse * 3;
        const gr = g.createRadialGradient(x, y - 6, 0, x, y - 6, r * 2.4); gr.addColorStop(0, 'rgba(' + c + ',' + (s.used ? 0.35 : 0.8) + ')'); gr.addColorStop(1, 'rgba(' + c + ',0)');
        g.fillStyle = gr; g.beginPath(); g.arc(x, y - 6, r * 2.4, 0, Math.PI * 2); g.fill();
      }
      // the people and Io, back to front
      const figs = (map.people || []).filter((n) => !n.hidden).map((n) => ({ id: n.id, y: n.at[1], x: n.at[0], s: sprite(n.look), dir: n.face || 's', step: 0 }));
      for (const a of actors) figs.push({ id: a.id, y: a.y, x: a.x, s: sprite(a.look), dir: a.dir, step: a.moving ? [1, 0, 2, 0][Math.floor(a.walkT / 0.1) % 4] : 0, walk: a.walk, moving: a.moving });
      const stepF = P.moving ? [1, 0, 2, 0][Math.floor(P.walkT / 0.1) % 4] : 0;
      figs.push({ y: P.y, x: P.x, s: io, dir: P.dir, step: stepF, me: true });
      // the painting's fronts (lamp posts, trees) take their place among them by their base lines
      for (const fr of map.front || []) figs.push({ y: fr.base, front: fr });
      figs.sort((a, b) => a.y - b.y);
      for (const f of figs) {
        if (f.front) { drawFront(f.front, mk, vw, vh, lit); continue; }
        const fx = (f.x - cam.x) * cam.z, fy = (f.y - cam.y) * cam.z;
        if (f.me && usePainted) {
          painted.draw(g, fx, fy, cam.z * ioH() / painted.h, { dir: P.dir, walk: P.walk, moving: P.moving, t: t / 1000, lean: P.lean, turn: P.turn, pose: P.pose, poseP: P.pose ? P.poseT / P.poseDur : 0 });
          g.imageSmoothingEnabled = false;
          continue;
        }
        if (folk && f.id && folk.loaded(f.id)) {
          folk.draw(g, f.id, fx, fy, cam.z * ioH(), { dir: f.dir, walk: f.walk, moving: f.moving, t: t / 1000, seed: f.x * 0.013 });
          g.imageSmoothingEnabled = false;
          continue;
        }
        g.fillStyle = 'rgba(0,0,0,0.38)'; g.beginPath(); g.ellipse(fx, fy - sk, 9 * sk, 2.6 * sk, 0, 0, Math.PI * 2); g.fill();
        const [sx, sy] = f.s.frame(f.dir, f.step);
        const ox = Math.round((fx - f.s.foot[0] * sk) * DPR) / DPR, oy = Math.round((fy - (f.s.foot[1] + 1) * sk) * DPR) / DPR;
        g.drawImage(f.s.canvas, sx, sy, f.s.w, f.s.h, ox, oy, f.s.w * sk, f.s.h * sk);
      }
      // the night's light: a little darker at the edges
      const vg = g.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.35, W / 2, H * 0.55, Math.max(W, H) * 0.75);
      vg.addColorStop(0, 'rgba(5,3,14,0)'); vg.addColorStop(1, 'rgba(5,3,14,0.45)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
      // the story's next step: the little arrow, hidden while a scene plays and once she is in reach of it
      goalNow = !paused && opts.goal && window.GoalArrow ? opts.goal(map.id) : null;
      if (goalNow && (goalNow.kind === 'exit' || Math.hypot(goalNow.x - P.x, (goalNow.y - P.y) * 1.3) >= REACH)) {
        const ih = cam.z * ioH();
        GoalArrow.draw(g, { x: (goalNow.x - cam.x) * cam.z, y: (goalNow.y - cam.y) * cam.z, over: goalNow.kind === 'person' ? ih * 1.05 : ih * 0.4, out: goalNow.out, ix: (P.x - cam.x) * cam.z, iy: (P.y - cam.y) * cam.z, ih, W, H, t });
      }
      if (flash > 0) { g.fillStyle = 'rgba(5,3,14,' + flash.toFixed(3) + ')'; g.fillRect(0, 0, W, H); flash = Math.max(0, flash - 0.06); }
      // the action button names what is in reach
      const n = paused ? null : near();
      if (n) { act.hidden = false; if (act.textContent !== n.label) act.textContent = n.label; } else act.hidden = true;
      drawMini(vw, vh, t);
    }
    // a front: its piece of the painting drawn again, clipped to its outline, over whoever stands behind it
    function drawFront(fr, mk, vw, vh, lit) {
      const bb = fr._bb || (fr._bb = fr.pts.reduce((b, [x, y]) => [Math.min(b[0], x), Math.min(b[1], y), Math.max(b[2], x), Math.max(b[3], y)], [1e9, 1e9, -1e9, -1e9]));
      if (bb[2] < cam.x || bb[0] > cam.x + vw || bb[3] < cam.y || bb[1] > cam.y + vh) return;
      g.save(); g.beginPath();
      fr.pts.forEach(([x, y], i) => { const X = (x - cam.x) * cam.z, Y = (y - cam.y) * cam.z; if (i) g.lineTo(X, Y); else g.moveTo(X, Y); });
      g.closePath(); g.clip();
      g.imageSmoothingEnabled = false; if (lit !== 1) g.filter = 'brightness(' + lit + ')';
      g.drawImage(img, bb[0] * mk, bb[1] * mk, (bb[2] - bb[0]) * mk, (bb[3] - bb[1]) * mk, (bb[0] - cam.x) * cam.z, (bb[1] - cam.y) * cam.z, (bb[2] - bb[0]) * cam.z, (bb[3] - bb[1]) * cam.z);
      g.restore();
    }
    // the walk areas (green), the blocks cut out of them (red) and the exits (blue), over the painting (opts.showWalk)
    function drawWalk() {
      const path = (pts) => { g.beginPath(); pts.forEach(([x, y], i) => { const X = (x - cam.x) * cam.z, Y = (y - cam.y) * cam.z; if (i) g.lineTo(X, Y); else g.moveTo(X, Y); }); g.closePath(); };
      g.lineWidth = 1.5;
      g.fillStyle = 'rgba(90,255,150,0.2)'; g.strokeStyle = 'rgba(90,255,150,0.85)';
      for (const p of map.walk) { path(p); g.fill(); g.stroke(); }
      g.fillStyle = 'rgba(255,80,90,0.3)'; g.strokeStyle = 'rgba(255,80,90,0.9)';
      for (const p of map.block || []) { path(p); g.fill(); g.stroke(); }
      g.strokeStyle = 'rgba(110,170,255,0.95)'; g.lineWidth = 2;
      for (const ex of map.exits || []) { const r = ex.rect; g.strokeRect((r[0] - cam.x) * cam.z, (r[1] - cam.y) * cam.z, (r[2] - r[0]) * cam.z, (r[3] - r[1]) * cam.z); }
    }
    function drawMini(vw, vh, t) {
      const r = mini.getBoundingClientRect(), w = Math.round(r.width * DPR), h = Math.round(w * MH / MW);
      if (!w) return;
      if (mini.width !== w || mini.height !== h) { mini.width = w; mini.height = h; }
      const k = w / MW;
      mg.imageSmoothingEnabled = true; mg.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, w, h);
      mg.fillStyle = 'rgba(5,3,14,0.35)'; mg.fillRect(0, 0, w, h);
      mg.lineWidth = Math.max(1, DPR); mg.strokeStyle = 'rgba(244,246,255,.85)';
      mg.strokeRect(Math.max(0, cam.x) * k, Math.max(0, cam.y) * k, Math.min(vw, MW) * k, Math.min(vh, MH) * k);
      mg.fillStyle = 'rgba(120,180,255,.9)'; for (const ex of map.exits || []) if (ex.to !== 'world') mg.fillRect(ex.rect[0] * k - DPR, ex.rect[1] * k - DPR, Math.max(3 * DPR, (ex.rect[2] - ex.rect[0]) * k), Math.max(3 * DPR, (ex.rect[3] - ex.rect[1]) * k));
      mg.fillStyle = '#ffd36e'; for (const n of map.people || []) { mg.beginPath(); mg.arc(n.at[0] * k, n.at[1] * k, 2 * DPR, 0, Math.PI * 2); mg.fill(); }
      const pulse = 0.5 + 0.5 * Math.sin(t / 180);
      // the story's next step, ringed in gold
      if (goalNow) { mg.lineWidth = 1.5 * DPR; mg.strokeStyle = '#ffd36e'; mg.beginPath(); mg.arc(goalNow.x * k, goalNow.y * k, (4.5 + pulse * 1.5) * DPR, 0, Math.PI * 2); mg.stroke(); }
      mg.fillStyle = '#1a0c1d'; mg.beginPath(); mg.arc(P.x * k, P.y * k, (3.4 + pulse) * DPR, 0, Math.PI * 2); mg.fill();
      mg.fillStyle = '#ff5fb2'; mg.beginPath(); mg.arc(P.x * k, P.y * k, (2.2 + pulse) * DPR, 0, Math.PI * 2); mg.fill();
    }
    layout(); const ro = new ResizeObserver(layout); ro.observe(root);
    requestAnimationFrame(frame);
    return {
      root, P, cam, load, near, useNear, stage, canStand,
      get map() { return map; },
      // paused (words, a question, the menu), the d-pad goes with the action button: it would show above and through a
      // short box, and does nothing meanwhile
      pause() { paused = true; held.clear(); route = null; target = null; act.hidden = true; pad.hidden = true; padId = null; padDirs.clear(); for (const d in padBtns) padBtns[d].classList.remove('lit'); },
      resume() { paused = false; last = performance.now(); pad.hidden = false; },
      show(on) { root.hidden = !on; if (on) { layout(); last = performance.now(); } },
      walkTo(x, y) { route = findRoute(x, y); },
      // a new picture for the map she is on, in place, with no fade and no jump (a page comparing squeezes of one painting)
      setPicture(url) { const next = new Image(); next.onload = () => { if (map) img = next; }; next.src = url; },
      pose(name, secs) { if (P.poseRes) P.poseRes(); return new Promise((res) => { P.pose = name; P.poseT = 0; P.poseDur = secs || 1.4; P.poseRes = res; held.clear(); route = null; }); },
      setCounter(v) { P.counter = v; }, get gap() { return P.roll == null ? null : gapNow(); },
      stop() { stopped = true; ro.disconnect(); window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKeyUp); },
    };
  }
  window.Field = { create };
})();
