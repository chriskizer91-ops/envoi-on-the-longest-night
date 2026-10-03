// field.js: walking a ground-level map (plan step 18). The pixel Io walks one of the traced paintings (src/game/maps.js):
// the d-pad, the arrow keys or a tap (a tap walks her there round the walls, by a path found on a coarse grid of the
// walk areas). The townsfolk stand in their places (sprites.js) and turn to her when she talks to them. The action
// button names what is in reach: a person to talk to, a well, a rest, something to look at, the Magpie. Exits take her
// to the next map, event areas start a story beat or a set fight once, and in the wilds every step fills a hidden
// counter that starts a random fight when it passes a threshold, so fights come evenly: never two back to back.
// The camera follows her; the mini-map in the corner shows the whole map, the view, the exits and the people.
// Map coordinates are the paintings' own 1536 x 1024 pixels whatever size they ship at.
// Field.create(host, opts) -> { load(id, at, dir), pause(), resume(), P, map, near(), redraw() }
//   opts: maps, speed (map px a second), zoom, ioH (map px), encounter: { mean, min } (map px walked between fights),
//   light(map) (the painting's brightness, 1 as painted),
//   and the callbacks onExit(exit), onEvent(spot), onTalk(person), onSpot(spot), onEncounter(map), onMenu(), onStep(map, running),
//   isDone(id) (an event or a well already used), src(path) (the art's URL)
// Needs makePixelIo (src/walk/pixel-io.js) and makeFolk (sprites.js). Defines window.Field.
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
    // the d-pad, over the bottom right
    const pad = el('div', { class: 'pad', role: 'group', 'aria-label': 'Walk' }, root);
    const held = new Set();
    for (const [d, label, glyph] of [['n', 'Up', '▲'], ['w', 'Left', '◀'], ['e', 'Right', '▶'], ['s', 'Down', '▼']]) {
      const b = el('button', { type: 'button', class: 'pad-' + d, 'aria-label': label }, pad, glyph);
      const on = (e) => { e.preventDefault(); held.add(d); route = null; }, off = () => held.delete(d);
      b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off);
    }
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

    const io = makePixelIo(1);
    const folkSprites = {};
    const sprite = (look) => folkSprites[look] || (folkSprites[look] = makeFolk(look, 1));
    // run: how long she has walked without stopping; after a moment the pace builds to a run (handoff, section 8)
    const P = { x: 0, y: 0, dir: 's', walkT: 0, moving: false, counter: 0, next: 0, run: 0, stepD: 0 };
    let map = null, img = null, grid = null, route = null, paused = false, lastExit = null, flash = 0;
    const cam = { z: opts.zoom || 0.7, x: 0, y: 0 };
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
    // breadth-first from her cell to the open cell nearest the tap; the path is smoothed to the cells where it turns
    function findRoute(tx, ty) {
      const si = clamp(Math.floor(P.x / CELL), 0, GW - 1), sj = clamp(Math.floor(P.y / CELL), 0, GH - 1);
      let ti = clamp(Math.floor(tx / CELL), 0, GW - 1), tj = clamp(Math.floor(ty / CELL), 0, GH - 1);
      if (!grid[tj * GW + ti]) { // the nearest open cell to the tap
        let best = null, bd = 1e9;
        for (let r = 1; r < 12 && !best; r++) for (let j = tj - r; j <= tj + r; j++) for (let i = ti - r; i <= ti + r; i++) {
          if (i < 0 || j < 0 || i >= GW || j >= GH || !grid[j * GW + i]) continue;
          const d = (i - ti) ** 2 + (j - tj) ** 2; if (d < bd) { bd = d; best = [i, j]; }
        }
        if (!best) return null; [ti, tj] = best; tx = ti * CELL + CELL / 2; ty = tj * CELL + CELL / 2;
      }
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
      return pts;
    }

    cv.addEventListener('pointerdown', (e) => {
      if (paused || !map) return;
      const r = cv.getBoundingClientRect(), x = cam.x + (e.clientX - r.left) / cam.z, y = cam.y + (e.clientY - r.top) / cam.z;
      // a tap on a person or a spot walks to them and then talks or uses it
      const hit = things().find((t) => Math.hypot(t.x - x, t.y - 20 - y) < 30 || Math.hypot(t.x - x, t.y - y) < 26);
      route = findRoute(x, y); target = hit || null;
    });
    let target = null;

    // ---------- what is in reach ----------
    function things() {
      const out = [];
      for (const n of map.people || []) out.push({ kind: 'person', ref: n, x: n.at[0], y: n.at[1], label: 'Talk to ' + n.name });
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
      held.clear(); route = null; target = null;
      // she turns to face it, and a person turns to face her
      const dx = t.x - P.x, dy = t.y - P.y; P.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'e' : 'w') : (dy > 0 ? 's' : 'n');
      if (t.kind === 'person') { t.ref.face = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'w' : 'e') : (dy > 0 ? 'n' : 's'); if (opts.onTalk) opts.onTalk(t.ref); }
      else if (opts.onSpot) opts.onSpot(t.ref);
    }

    // ---------- loading a map ----------
    function load(id, at, dir) {
      const m = opts.maps[id]; if (!m) throw new Error('no map ' + id);
      map = m; m.id = id; route = null; target = null; held.clear(); lastExit = null; flash = 1;
      P.x = (at || m.start)[0]; P.y = (at || m.start)[1]; P.dir = dir || 's'; P.walkT = 0;
      for (const n of m.people || []) n.face = n.face0 || 's';
      buildGrid();
      // never start inside a wall: the nearest open cell
      if (!canStand(P.x, P.y)) { const r = findRoute(P.x, P.y); if (r && r.length) { P.x = r[r.length - 1][0]; P.y = r[r.length - 1][1]; } }
      P.next = nextGap();
      plate.textContent = m.name;
      return new Promise((res) => {
        const next = new Image();
        next.onload = () => { img = next; res(); };
        next.onerror = () => { img = null; res(); };
        next.src = opts.src ? opts.src(m.src) : m.src;
      });
    }
    // the gap to the next random fight, in map px walked: around the mean, never less than the minimum
    function nextGap() {
      const E = opts.encounter || { mean: 770, min: 440 }, rate = (map && map.wild && map.wild.rate) || 1;
      return Math.max(E.min, E.mean * (0.55 + Math.random() * 0.9)) / rate;
    }

    // ---------- the loop ----------
    let last = performance.now(), stopped = false;
    function frame(t) {
      if (stopped) return;
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      if (map && img && !paused && !root.hidden) step(dt);
      if (map && img && !root.hidden) draw(t);
      requestAnimationFrame(frame);
    }
    function step(dt) {
      let dx = 0, dy = 0;
      if (held.size) { if (held.has('e')) dx++; if (held.has('w')) dx--; if (held.has('s')) dy++; if (held.has('n')) dy--; }
      else if (route && route.length) {
        const [wx, wy] = route[0]; dx = wx - P.x; dy = wy - P.y;
        if (Math.hypot(dx, dy) < 3) { route.shift(); if (!route.length) { route = null; dx = dy = 0; if (target) { const tt = target; target = null; const n = near(); if (n && n.ref === tt.ref) useNear(); } } }
      }
      const L = Math.hypot(dx, dy);
      P.moving = false;
      if (L > 0) {
        const pace = 1 + 0.6 * clamp((P.run - 0.8) / 0.8, 0, 1), sp = speed * pace * dt, k = Math.min(1, (route ? Math.min(sp, L) : sp) / L);
        const mx = dx * k, my = dy * k, x0 = P.x, y0 = P.y;
        // slide along walls: the whole step, or the part of it that's open
        if (canStand(P.x + mx, P.y + my)) { P.x += mx; P.y += my; }
        else if (mx && canStand(P.x + mx, P.y)) P.x += mx;
        else if (my && canStand(P.x, P.y + my)) P.y += my;
        else if (held.size) { // round a corner: try a small sidestep
          for (const s of [1, -1]) { if (my && canStand(P.x + s * sp, P.y + my * 0.5)) { P.x += s * sp * 0.6; break; } if (mx && canStand(P.x + mx * 0.5, P.y + s * sp)) { P.y += s * sp * 0.6; break; } }
        }
        const moved = Math.hypot(P.x - x0, P.y - y0);
        P.moving = moved > 0.01;
        P.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'e' : 'w') : (dy > 0 ? 's' : 'n');
        if (P.moving) {
          P.walkT += dt * pace; P.run += dt; if (map.wild) P.counter += moved;
          // a footstep every half stride, on the map's ground (opts.onStep)
          P.stepD += moved; if (P.stepD > 26) { P.stepD = 0; if (opts.onStep) opts.onStep(map, pace > 1.3); }
        }
        else if (route) { route = null; target = null; }
      }
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
        held.clear(); route = null; if (opts.onEvent) opts.onEvent(s); return;
      }
      if (map.wild && P.counter >= P.next) { P.counter = 0; P.next = nextGap(); held.clear(); route = null; if (opts.onEncounter) opts.onEncounter(map); }
    }
    function draw(t) {
      const W = cv.width / DPR, H = cv.height / DPR;
      cam.z = (map.zoom || opts.zoom || 0.7) * Math.max(1, Math.min(W, H) / 700);
      const sk = cam.z * (opts.ioH || 42) / io.h;
      const vw = W / cam.z, vh = H / cam.z, mk = img.naturalWidth / MW;
      cam.x = vw >= MW ? (MW - vw) / 2 : clamp(P.x - vw / 2, 0, MW - vw);
      cam.y = vh >= MH ? (MH - vh) / 2 : clamp(P.y - vh * 0.55, 0, MH - vh);
      g.setTransform(DPR, 0, 0, DPR, 0, 0);
      g.fillStyle = '#0b0912'; g.fillRect(0, 0, W, H);
      g.imageSmoothingEnabled = false;
      const lit = opts.light ? opts.light(map) : 1;
      if (lit !== 1) g.filter = 'brightness(' + lit + ')';
      g.drawImage(img, cam.x * mk, cam.y * mk, vw * mk, vh * mk, 0, 0, W, H);
      g.filter = 'none';
      // spots glimmer softly, so a player can find them
      const pulse = 0.5 + 0.5 * Math.sin(t / 300);
      for (const s of things()) {
        if (s.kind === 'person') continue;
        const x = (s.x - cam.x) * cam.z, y = (s.y - cam.y) * cam.z;
        const c = s.kind === 'rest' ? '255,214,140' : s.kind === 'magpie' ? '160,200,255' : s.used ? '200,200,220' : '255,240,200';
        const r = (s.used ? 4 : 6) + pulse * 3;
        const gr = g.createRadialGradient(x, y - 6, 0, x, y - 6, r * 2.4); gr.addColorStop(0, 'rgba(' + c + ',' + (s.used ? 0.35 : 0.8) + ')'); gr.addColorStop(1, 'rgba(' + c + ',0)');
        g.fillStyle = gr; g.beginPath(); g.arc(x, y - 6, r * 2.4, 0, Math.PI * 2); g.fill();
      }
      // the people and Io, back to front
      const figs = (map.people || []).map((n) => ({ y: n.at[1], x: n.at[0], s: sprite(n.look), dir: n.face || 's', step: 0 }));
      const stepF = P.moving ? [1, 0, 2, 0][Math.floor(P.walkT / 0.1) % 4] : 0;
      figs.push({ y: P.y, x: P.x, s: io, dir: P.dir, step: stepF, me: true });
      figs.sort((a, b) => a.y - b.y);
      for (const f of figs) {
        const fx = (f.x - cam.x) * cam.z, fy = (f.y - cam.y) * cam.z;
        g.fillStyle = 'rgba(0,0,0,0.38)'; g.beginPath(); g.ellipse(fx, fy - sk, 9 * sk, 2.6 * sk, 0, 0, Math.PI * 2); g.fill();
        const [sx, sy] = f.s.frame(f.dir, f.step);
        const ox = Math.round((fx - f.s.foot[0] * sk) * DPR) / DPR, oy = Math.round((fy - (f.s.foot[1] + 1) * sk) * DPR) / DPR;
        g.drawImage(f.s.canvas, sx, sy, f.s.w, f.s.h, ox, oy, f.s.w * sk, f.s.h * sk);
      }
      // the night's light: a little darker at the edges
      const vg = g.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.35, W / 2, H * 0.55, Math.max(W, H) * 0.75);
      vg.addColorStop(0, 'rgba(5,3,14,0)'); vg.addColorStop(1, 'rgba(5,3,14,0.45)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
      if (flash > 0) { g.fillStyle = 'rgba(5,3,14,' + flash.toFixed(3) + ')'; g.fillRect(0, 0, W, H); flash = Math.max(0, flash - 0.06); }
      // the action button names what is in reach
      const n = paused ? null : near();
      if (n) { act.hidden = false; if (act.textContent !== n.label) act.textContent = n.label; } else act.hidden = true;
      drawMini(vw, vh, t);
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
      mg.fillStyle = 'rgba(120,180,255,.9)'; for (const ex of map.exits || []) mg.fillRect(ex.rect[0] * k - DPR, ex.rect[1] * k - DPR, Math.max(3 * DPR, (ex.rect[2] - ex.rect[0]) * k), Math.max(3 * DPR, (ex.rect[3] - ex.rect[1]) * k));
      mg.fillStyle = '#ffd36e'; for (const n of map.people || []) { mg.beginPath(); mg.arc(n.at[0] * k, n.at[1] * k, 2 * DPR, 0, Math.PI * 2); mg.fill(); }
      const pulse = 0.5 + 0.5 * Math.sin(t / 180);
      mg.fillStyle = '#1a0c1d'; mg.beginPath(); mg.arc(P.x * k, P.y * k, (3.4 + pulse) * DPR, 0, Math.PI * 2); mg.fill();
      mg.fillStyle = '#ff5fb2'; mg.beginPath(); mg.arc(P.x * k, P.y * k, (2.2 + pulse) * DPR, 0, Math.PI * 2); mg.fill();
    }
    layout(); const ro = new ResizeObserver(layout); ro.observe(root);
    requestAnimationFrame(frame);
    return {
      root, P, cam, load, near, useNear,
      get map() { return map; },
      pause() { paused = true; held.clear(); route = null; target = null; act.hidden = true; },
      resume() { paused = false; last = performance.now(); },
      show(on) { root.hidden = !on; if (on) { layout(); last = performance.now(); } },
      walkTo(x, y) { route = findRoute(x, y); },
      setCounter(v) { P.counter = v; },
      stop() { stopped = true; ro.disconnect(); window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKeyUp); },
    };
  }
  window.Field = { create };
})();
