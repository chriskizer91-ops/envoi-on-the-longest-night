// world.js: walking the world map (plan phase 4): the pixel Io on Chris's night atlas of Aethermoor (4608 x 3072, nine
// tiles drawn as the camera needs them), as FF9 walks its world between towns. She walks on land only (the mask that
// tools/world-mask.mjs makes from the day atlas: rivers and narrow straits are crossed, the sea is not). The world is in
// four level bands; a band the party can't reach yet lies under cold mist and can't be walked into. Each place is a
// lit marker: walking onto it goes in. The wild country fills a hidden counter with every step, as the wild ground maps
// do, and a random fight starts when it passes its threshold; near a place it is safe. The Magpie, when it is moored
// on the map, is a little skiff to walk up to. The mini-map shows the whole world, the mist, the places and Io.
// World.create(host, opts) -> { show(on), place(x, y, dir), pause(), resume(), P, bandAt(x, y) }
//   opts: tiles (r, c) -> URL, places: { id: { name, at: [x, y], band } }, open(band) -> bool, magpie() -> [x, y] | null,
//   speed (atlas px a second), zoom, encounter: { mean, min }, onEnter(id), onEncounter(band), onMagpie(), onMenu()
// Needs makePixelIo and WORLD_MASK (world-mask.js). Defines window.World.
(function () {
  'use strict';
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  function el(tag, attrs, parent, text) { const e = document.createElement(tag); if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]); if (text !== undefined) e.textContent = text; if (parent) parent.appendChild(e); return e; }
  const inPoly = (pts, x, y) => { let ins = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins; } return ins; };
  const WW = 4608, WH = 3072, TW = 1536, TH = 1024;
  // the four level bands on the atlas (plan, phase 3: the southwest and the wetlands; the western forests and
  // riverlands; the northwest and the northern passage; the northeast peaks). Anywhere else is under mist all game:
  // the central island, the east and the southeast
  const BANDS = {
    1: [[0, 1700], [2000, 1650], [2600, 1900], [2700, 3072], [0, 3072]],
    2: [[0, 900], [1650, 900], [1900, 1050], [2000, 1650], [0, 1700]],
    3: [[0, 0], [2450, 0], [2450, 900], [1900, 1050], [1650, 900], [0, 900]],
    4: [[2450, 0], [4608, 0], [4608, 1250], [3500, 1350], [2700, 1250], [2450, 900]],
  };
  function bandAt(x, y) { for (const b of [1, 2, 3, 4]) if (inPoly(BANDS[b], x, y)) return b; return 0; }
  // the land mask, unpacked
  let LAND = null;
  function land() {
    if (LAND) return LAND;
    const M = window.WORLD_MASK; LAND = new Uint8Array(M.w * M.h);
    let i = 0, v = M.first; for (const r of M.rle.split(',')) { const n = parseInt(r, 36); LAND.fill(v, i, i + n); i += n; v = 1 - v; }
    return LAND;
  }

  function create(host, opts) {
    const DPR = Math.min(window.devicePixelRatio || 1, 3), M = window.WORLD_MASK, CELL = M.cell;
    const speed = opts.speed || 45, L = land();
    const root = el('div', { class: 'field world', hidden: '' }, host);
    const cv = el('canvas', { class: 'field-cv', 'aria-hidden': 'true' }, root), g = cv.getContext('2d');
    const plate = el('div', { class: 'field-plate win', role: 'status', 'aria-live': 'polite' }, root);
    const mini = el('canvas', { class: 'mini', role: 'img', 'aria-label': 'Map of the world' }, root), mg = mini.getContext('2d');
    let miniBig = false;
    mini.addEventListener('pointerdown', (e) => { e.stopPropagation(); miniBig = !miniBig; mini.classList.toggle('big', miniBig); });
    const menuBtn = el('button', { type: 'button', class: 'field-menu', 'aria-label': 'Menu' }, root, '☰ Menu');
    menuBtn.addEventListener('click', () => { if (!paused && opts.onMenu) opts.onMenu(); });
    const act = el('button', { type: 'button', class: 'field-act', hidden: '' }, root);
    act.addEventListener('click', () => { if (!paused) useNear(); });
    const pad = el('div', { class: 'pad', role: 'group', 'aria-label': 'Walk' }, root);
    const held = new Set();
    for (const [d, label, glyph] of [['n', 'Up', '▲'], ['w', 'Left', '◀'], ['e', 'Right', '▶'], ['s', 'Down', '▼']]) {
      const b = el('button', { type: 'button', class: 'pad-' + d, 'aria-label': label }, pad, glyph);
      const on = (e) => { e.preventDefault(); held.add(d); route = null; }, off = () => held.delete(d);
      b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off);
    }
    const KEYS = { ArrowUp: 'n', ArrowDown: 's', ArrowLeft: 'w', ArrowRight: 'e', w: 'n', s: 's', a: 'w', d: 'e', W: 'n', S: 's', A: 'w', D: 'e' };
    const onKey = (e) => {
      if (paused || root.hidden) return;
      const d = KEYS[e.key];
      if (d) { held.add(d); route = null; e.preventDefault(); }
      else if (e.key === 'Enter' || e.key === ' ' || e.key === 'z' || e.key === 'Z') { useNear(); e.preventDefault(); }
      else if (e.key === 'Escape' || e.key === 'm' || e.key === 'M') { if (opts.onMenu) opts.onMenu(); e.preventDefault(); }
    };
    const onKeyUp = (e) => { const d = KEYS[e.key]; if (d) held.delete(d); };
    window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKeyUp);

    const tiles = {};
    function tile(r, c) {
      const k = r + '' + c; if (tiles[k]) return tiles[k];
      const im = new Image(); im.src = opts.tiles(r, c); tiles[k] = im; return im;
    }
    const io = makePixelIo(1);
    const P = { x: 1348, y: 1900, dir: 's', walkT: 0, moving: false, counter: 0, next: 300 };
    let paused = false, route = null, inside = null, flash = 0, stopped = false;
    const cam = { z: 2, x: 0, y: 0 };
    function layout() { cv.width = Math.round(root.clientWidth * DPR); cv.height = Math.round(root.clientHeight * DPR); }

    const landAt = (x, y) => { const i = Math.floor(x / CELL), j = Math.floor(y / CELL); return i >= 0 && j >= 0 && i < M.w && j < M.h && L[j * M.w + i] === 1; };
    const openAt = (x, y) => { const b = bandAt(x, y); return b > 0 && opts.open(b); };
    const canStand = (x, y) => landAt(x, y) && openAt(x, y);
    // tap-to-walk: breadth-first on the mask's own cells, then smoothed to where the path turns
    function findRoute(tx, ty) {
      const W = M.w, H = M.h, si = Math.floor(P.x / CELL), sj = Math.floor(P.y / CELL);
      let ti = clamp(Math.floor(tx / CELL), 0, W - 1), tj = clamp(Math.floor(ty / CELL), 0, H - 1);
      const ok = (i, j) => canStand(i * CELL + CELL / 2, j * CELL + CELL / 2);
      if (!ok(ti, tj)) { let best = null, bd = 1e9; for (let r = 1; r < 10 && !best; r++) for (let j = tj - r; j <= tj + r; j++) for (let i = ti - r; i <= ti + r; i++) { if (i < 0 || j < 0 || i >= W || j >= H || !ok(i, j)) continue; const d = (i - ti) ** 2 + (j - tj) ** 2; if (d < bd) { bd = d; best = [i, j]; } } if (!best) return null; [ti, tj] = best; tx = ti * CELL + CELL / 2; ty = tj * CELL + CELL / 2; }
      // search only a window round the two ends, to keep it quick
      const x0 = Math.max(0, Math.min(si, ti) - 40), x1 = Math.min(W - 1, Math.max(si, ti) + 40), y0 = Math.max(0, Math.min(sj, tj) - 40), y1 = Math.min(H - 1, Math.max(sj, tj) + 40);
      const BW = x1 - x0 + 1, BH = y1 - y0 + 1, prev = new Int32Array(BW * BH).fill(-1);
      const s = (sj - y0) * BW + (si - x0), t = (tj - y0) * BW + (ti - x0); prev[s] = s; const q = [s];
      for (let h = 0; h < q.length; h++) {
        const c = q[h]; if (c === t) break; const ci = c % BW, cj = (c - ci) / BW;
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
          const i = ci + di, j = cj + dj; if (i < 0 || j < 0 || i >= BW || j >= BH) continue; const n = j * BW + i;
          if (prev[n] >= 0 || !ok(i + x0, j + y0)) continue; if (di && dj && (!ok(ci + di + x0, cj + y0) || !ok(ci + x0, cj + dj + y0))) continue;
          prev[n] = c; q.push(n);
        }
      }
      if (prev[t] < 0) return null;
      const pts = []; for (let c = t; c !== s; c = prev[c]) pts.push([(c % BW + x0) * CELL + CELL / 2, (Math.floor(c / BW) + y0) * CELL + CELL / 2]); pts.reverse();
      if (pts.length) pts[pts.length - 1] = [tx, ty];
      return pts;
    }
    cv.addEventListener('pointerdown', (e) => {
      if (paused) return;
      const r = cv.getBoundingClientRect(); route = findRoute(cam.x + (e.clientX - r.left) / cam.z, cam.y + (e.clientY - r.top) / cam.z);
    });

    function things() {
      const out = [];
      for (const id in opts.places) { const p = opts.places[id]; if (p.hidden && p.hidden()) continue; if (!opts.open(p.band)) continue; out.push({ kind: 'place', id, x: p.at[0], y: p.at[1], name: p.name, label: 'Enter ' + p.name }); }
      const mp = opts.magpie && opts.magpie();
      if (mp) out.push({ kind: 'magpie', x: mp[0], y: mp[1], name: 'The Magpie', label: 'Board the Magpie' });
      return out;
    }
    function near(r) { let best = null, bd = r || 26; for (const t of things()) { const d = Math.hypot(t.x - P.x, t.y - P.y); if (d < bd) { bd = d; best = t; } } return best; }
    function useNear() { const t = near(); if (!t) return; held.clear(); route = null; if (t.kind === 'place') opts.onEnter(t.id); else if (opts.onMagpie) opts.onMagpie(); }
    const nextGap = () => { const E = opts.encounter || { mean: 330, min: 190 }; return Math.max(E.min, E.mean * (0.55 + Math.random() * 0.9)); };

    let last = performance.now(), mistMsg = 0;
    function frame(t) {
      if (stopped) return;
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      if (!root.hidden) { if (!paused) step(dt); draw(t); }
      requestAnimationFrame(frame);
    }
    function step(dt) {
      let dx = 0, dy = 0;
      if (held.size) { if (held.has('e')) dx++; if (held.has('w')) dx--; if (held.has('s')) dy++; if (held.has('n')) dy--; }
      else if (route && route.length) { const [wx, wy] = route[0]; dx = wx - P.x; dy = wy - P.y; if (Math.hypot(dx, dy) < 2) { route.shift(); if (!route.length) route = null; } }
      const Ld = Math.hypot(dx, dy); P.moving = false;
      if (Ld > 0) {
        const sp = speed * dt, k = Math.min(1, (route ? Math.min(sp, Ld) : sp) / Ld), mx = dx * k, my = dy * k, x0 = P.x, y0 = P.y;
        if (canStand(P.x + mx, P.y + my)) { P.x += mx; P.y += my; }
        else if (mx && canStand(P.x + mx, P.y)) P.x += mx;
        else if (my && canStand(P.x, P.y + my)) P.y += my;
        else if (landAt(P.x + mx * 4, P.y + my * 4) && !openAt(P.x + mx * 4, P.y + my * 4) && t0() - mistMsg > 2500) { mistMsg = t0(); plate.textContent = 'Cold mist lies over the way. The Magpie needs more lift to cross it.'; }
        const moved = Math.hypot(P.x - x0, P.y - y0); P.moving = moved > 0.01;
        P.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'e' : 'w') : (dy > 0 ? 's' : 'n');
        if (P.moving) {
          P.walkT += dt;
          // safe near a place; anywhere else is wild country
          const safe = things().some((th) => Math.hypot(th.x - P.x, th.y - P.y) < 90);
          if (!safe) P.counter += moved;
        } else if (route) route = null;
      }
      if (!P.moving) P.walkT = 0;
      // walking onto a place goes in (once she has stepped off it)
      const n = near(18);
      if (n && n.kind === 'place') { if (inside !== n.id) { inside = n.id; held.clear(); route = null; opts.onEnter(n.id); return; } } else if (!near(40)) inside = null;
      if (P.counter >= P.next) { P.counter = 0; P.next = nextGap(); held.clear(); route = null; if (opts.onEncounter) opts.onEncounter(bandAt(P.x, P.y)); }
    }
    const t0 = () => performance.now();
    // the cold mist over the bands not open yet: a low-resolution veil, drawn soft
    const veil = document.createElement('canvas'); veil.width = 288; veil.height = 192; const vg = veil.getContext('2d');
    let veilKey = '';
    function drawVeil() {
      const key = [1, 2, 3, 4].map((b) => (opts.open(b) ? 1 : 0)).join('');
      if (key === veilKey) return; veilKey = key;
      const im = vg.createImageData(288, 192);
      for (let j = 0; j < 192; j++) for (let i = 0; i < 288; i++) { const b = bandAt(i * 16 + 8, j * 16 + 8), o = (j * 288 + i) * 4; const fog = !(b && opts.open(b)); im.data[o] = 170; im.data[o + 1] = 182; im.data[o + 2] = 214; im.data[o + 3] = fog ? 170 : 0; }
      vg.putImageData(im, 0, 0);
    }
    function draw(t) {
      const W = cv.width / DPR, H = cv.height / DPR;
      cam.z = (opts.zoom || 2) * Math.max(1, Math.min(W, H) / 700);
      const vw = W / cam.z, vh = H / cam.z;
      cam.x = clamp(P.x - vw / 2, 0, WW - vw); cam.y = clamp(P.y - vh * 0.55, 0, WH - vh);
      g.setTransform(DPR, 0, 0, DPR, 0, 0); g.fillStyle = '#060a1a'; g.fillRect(0, 0, W, H);
      g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      for (let r = Math.floor(cam.y / TH); r <= Math.min(2, Math.floor((cam.y + vh) / TH)); r++) for (let c = Math.floor(cam.x / TW); c <= Math.min(2, Math.floor((cam.x + vw) / TW)); c++) {
        const im = tile(r, c); if (!im.complete || !im.naturalWidth) continue;
        const k = im.naturalWidth / TW;
        // the part of this tile in view, with half a pixel's overlap so the joins don't show a seam
        const sx = Math.max(0, cam.x - c * TW), sy = Math.max(0, cam.y - r * TH), ex = Math.min(TW, cam.x + vw - c * TW), ey = Math.min(TH, cam.y + vh - r * TH);
        if (ex <= sx || ey <= sy) continue;
        g.drawImage(im, sx * k, sy * k, (ex - sx) * k, (ey - sy) * k, (c * TW + sx - cam.x) * cam.z - 0.5, (r * TH + sy - cam.y) * cam.z - 0.5, (ex - sx) * cam.z + 1, (ey - sy) * cam.z + 1);
      }
      drawVeil();
      g.globalAlpha = 0.85 + 0.1 * Math.sin(t / 1400);
      g.drawImage(veil, cam.x / 16, cam.y / 16, vw / 16, vh / 16, 0, 0, W, H);
      g.globalAlpha = 1;
      // places: a warm glow and the name
      g.font = '600 13px "Atkinson Hyperlegible", system-ui, sans-serif'; g.textAlign = 'center';
      const pulse = 0.5 + 0.5 * Math.sin(t / 380);
      for (const th of things()) {
        const x = (th.x - cam.x) * cam.z, y = (th.y - cam.y) * cam.z; if (x < -60 || y < -40 || x > W + 60 || y > H + 40) continue;
        if (th.kind === 'magpie') { drawSkiff(x, y, t); continue; }
        const rr = 10 + pulse * 5; const gr = g.createRadialGradient(x, y, 0, x, y, rr * 2);
        gr.addColorStop(0, 'rgba(255,214,140,0.9)'); gr.addColorStop(0.4, 'rgba(255,170,80,0.35)'); gr.addColorStop(1, 'rgba(255,170,80,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, rr * 2, 0, Math.PI * 2); g.fill();
        g.lineWidth = 3; g.strokeStyle = 'rgba(10,6,20,0.85)'; g.strokeText(th.name, x, y - 22); g.fillStyle = '#ffe6b0'; g.fillText(th.name, x, y - 22);
      }
      // Io, smaller than on the ground maps: the world is far bigger
      const sk = cam.z * 0.42, fx = (P.x - cam.x) * cam.z, fy = (P.y - cam.y) * cam.z;
      g.fillStyle = 'rgba(0,0,0,0.4)'; g.beginPath(); g.ellipse(fx, fy - sk, 9 * sk, 2.6 * sk, 0, 0, Math.PI * 2); g.fill();
      const stepF = P.moving ? [1, 0, 2, 0][Math.floor(P.walkT / 0.12) % 4] : 0, [sx, sy] = io.frame(P.dir, stepF);
      g.imageSmoothingEnabled = false;
      g.drawImage(io.canvas, sx, sy, io.w, io.h, Math.round((fx - io.foot[0] * sk) * DPR) / DPR, Math.round((fy - (io.foot[1] + 1) * sk) * DPR) / DPR, io.w * sk, io.h * sk);
      const vgr = g.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.35, W / 2, H * 0.55, Math.max(W, H) * 0.75);
      vgr.addColorStop(0, 'rgba(5,3,14,0)'); vgr.addColorStop(1, 'rgba(5,3,14,0.5)'); g.fillStyle = vgr; g.fillRect(0, 0, W, H);
      if (flash > 0) { g.fillStyle = 'rgba(5,3,14,' + flash.toFixed(3) + ')'; g.fillRect(0, 0, W, H); flash = Math.max(0, flash - 0.05); }
      const n = paused ? null : near();
      if (n) { act.hidden = false; if (act.textContent !== n.label) act.textContent = n.label; } else act.hidden = true;
      if (t0() - mistMsg > 2500) { const b = bandAt(P.x, P.y); const nm = opts.regionName ? opts.regionName(P.x, P.y, b) : 'Aethermoor'; if (plate.textContent !== nm) plate.textContent = nm; }
      drawMini(vw, vh, t);
    }
    // the Magpie moored on the world map: a little skiff with a lit lantern, bobbing
    function drawSkiff(x, y, t) {
      const s = cam.z * 0.5, b = Math.sin(t / 500) * 1.2;
      g.save(); g.translate(x, y + b);
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(0, 6 * s, 22 * s, 5 * s, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#5b3a22'; g.beginPath(); g.moveTo(-22 * s, -2 * s); g.lineTo(22 * s, -2 * s); g.lineTo(15 * s, 6 * s); g.lineTo(-15 * s, 6 * s); g.closePath(); g.fill();
      g.fillStyle = '#c9a25e'; g.fillRect(-22 * s, -3 * s, 44 * s, 2 * s);
      g.fillStyle = '#3a2a1a'; g.fillRect(-1 * s, -30 * s, 2 * s, 28 * s);
      g.fillStyle = '#e8dcc0'; g.beginPath(); g.moveTo(1 * s, -28 * s); g.lineTo(18 * s, -8 * s); g.lineTo(1 * s, -8 * s); g.closePath(); g.fill();
      g.fillStyle = '#2b2440'; g.beginPath(); g.moveTo(-1 * s, -26 * s); g.lineTo(-14 * s, -9 * s); g.lineTo(-1 * s, -9 * s); g.closePath(); g.fill();
      const lg = g.createRadialGradient(20 * s, -6 * s, 0, 20 * s, -6 * s, 10 * s); lg.addColorStop(0, 'rgba(255,200,120,0.95)'); lg.addColorStop(1, 'rgba(255,170,80,0)');
      g.fillStyle = lg; g.beginPath(); g.arc(20 * s, -6 * s, 10 * s, 0, Math.PI * 2); g.fill();
      g.restore();
    }
    let miniBase = null;
    function drawMini(vw, vh, t) {
      const r = mini.getBoundingClientRect(), w = Math.round(r.width * DPR), h = Math.round(w * WH / WW);
      if (!w) return;
      if (mini.width !== w || mini.height !== h) { mini.width = w; mini.height = h; miniBase = null; }
      const k = w / WW;
      if (!miniBase) {
        // the land and sea from the mask, drawn once
        miniBase = document.createElement('canvas'); miniBase.width = M.w; miniBase.height = M.h; const bg = miniBase.getContext('2d'), im = bg.createImageData(M.w, M.h);
        for (let i = 0; i < M.w * M.h; i++) { const o = i * 4, l = L[i]; im.data[o] = l ? 74 : 14; im.data[o + 1] = l ? 88 : 30; im.data[o + 2] = l ? 70 : 70; im.data[o + 3] = 255; }
        bg.putImageData(im, 0, 0);
      }
      mg.imageSmoothingEnabled = true; mg.drawImage(miniBase, 0, 0, w, h);
      mg.globalAlpha = 0.8; mg.drawImage(veil, 0, 0, w, h); mg.globalAlpha = 1;
      mg.lineWidth = Math.max(1, DPR); mg.strokeStyle = 'rgba(244,246,255,.85)'; mg.strokeRect(cam.x * k, cam.y * k, vw * k, vh * k);
      for (const th of things()) { mg.fillStyle = th.kind === 'magpie' ? '#9fc8ff' : '#ffd36e'; mg.beginPath(); mg.arc(th.x * k, th.y * k, 2.4 * DPR, 0, Math.PI * 2); mg.fill(); }
      const pulse = 0.5 + 0.5 * Math.sin(t / 180);
      mg.fillStyle = '#1a0c1d'; mg.beginPath(); mg.arc(P.x * k, P.y * k, (3.4 + pulse) * DPR, 0, Math.PI * 2); mg.fill();
      mg.fillStyle = '#ff5fb2'; mg.beginPath(); mg.arc(P.x * k, P.y * k, (2.2 + pulse) * DPR, 0, Math.PI * 2); mg.fill();
    }
    layout(); const ro = new ResizeObserver(layout); ro.observe(root);
    requestAnimationFrame(frame);
    return {
      root, P, cam, bandAt, BANDS,
      show(on) { root.hidden = !on; if (on) { layout(); last = performance.now(); flash = 1; veilKey = ''; } },
      place(x, y, dir) { P.x = x; P.y = y; P.dir = dir || 's'; route = null; held.clear(); inside = (near(18) || {}).id || null; },
      pause() { paused = true; held.clear(); route = null; act.hidden = true; },
      resume() { paused = false; last = performance.now(); },
      walkTo(x, y) { route = findRoute(x, y); },
      stop() { stopped = true; ro.disconnect(); window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKeyUp); },
    };
  }
  window.World = { create, bandAt };
})();
