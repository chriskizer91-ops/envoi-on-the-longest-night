// walk-test.js: the walking test on Chris's ground-level maps (art request 04). The pixel Io walks a painted map
// with a d-pad, the arrow keys or a tap, the camera following her, and a mini-map in the corner shows where she is.
// Map coordinates are the paintings' own 1536 x 1024 pixels whatever size the image is shipped at, so a lighter copy
// of a map changes how fine it looks, not where anything is. Sliders set her height, the zoom and the light; toggles
// choose the map detail and sharp or smooth map pixels. Talk shows the talking portraits (art request 05) in a dialogue
// box. No walls yet: she walks over everything; tracing the maps comes later.
// Defines window.WalkTest = { start(cfg) }; needs makePixelIo (pixel-io.js).
(function () {
  'use strict';
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  function el(tag, attrs, parent, text) { const e = document.createElement(tag); if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]); if (text !== undefined) e.textContent = text; if (parent) parent.appendChild(e); return e; }
  const src = (s) => (s.startsWith('data:') ? s : '../' + s);

  function start(cfg) {
    const DPR = Math.min(window.devicePixelRatio || 1, 3);
    document.title = cfg.title;
    const header = el('header', null, document.body); el('h1', null, header, cfg.title); if (cfg.blurb) el('p', null, header, cfg.blurb);
    const wrap = el('div', { class: 'wrap' }, document.body);
    const stage = el('main', { id: 'stage', 'aria-label': 'The map' }, wrap);
    const cv = el('canvas', { id: 'walk', 'aria-hidden': 'true' }, stage), g = cv.getContext('2d');
    const now = el('div', { id: 'now', class: 'win', role: 'status', 'aria-live': 'polite' }, stage);
    const nowName = el('div', { id: 'nowName' }, now, 'Loading the map');
    // the d-pad, over the bottom left of the map
    const pad = el('div', { class: 'pad', role: 'group', 'aria-label': 'Walk' }, stage);
    const padBtn = {};
    for (const [d, label, glyph] of [['n', 'Up', '▲'], ['w', 'Left', '◀'], ['e', 'Right', '▶'], ['s', 'Down', '▼']]) {
      const b = el('button', { type: 'button', class: 'pad-' + d, 'aria-label': label }, pad, glyph); padBtn[d] = b;
      const on = (e) => { e.preventDefault(); held.add(d); tap = null; }, off = () => held.delete(d);
      b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off);
    }
    // the dialogue box, over the bottom of the map
    const box = el('div', { class: 'talk win', hidden: '' }, stage);
    const face = el('img', { class: 'talk-face', alt: '' }, box);
    const words = el('div', { class: 'talk-words' }, box), who = el('div', { class: 'talk-who' }, words), said = el('p', { class: 'talk-said' }, words);
    el('div', { class: 'talk-next', 'aria-hidden': 'true' }, words, '▼');

    const panel = el('section', { id: 'panel', class: 'win', 'aria-label': 'Controls' }, wrap);
    el('h2', null, panel, 'Map');
    const mapBox = el('div', { class: 'togs', role: 'group', 'aria-label': 'Map' }, panel);
    const mapBtns = cfg.maps.map((m) => { const b = el('button', { class: 'tog', type: 'button', 'aria-pressed': 'false' }, mapBox, m.name); b.addEventListener('click', () => load(m)); return b; });
    el('h2', null, panel, 'Talking portraits');
    const talkBox = el('div', { class: 'togs' }, panel);
    const talkBtn = el('button', { class: 'tog', type: 'button' }, talkBox, 'Talk');
    talkBtn.addEventListener('click', () => { line = -1; nextLine(); });
    // the map detail: each map is shipped at two sizes for Chris to compare; sharp keeps the map's pixels square
    el('h2', null, panel, 'Map detail');
    const S = { ioH: cfg.ioHeight || 42, zoom: cfg.zoom || 1, mapLight: 1, ioLight: 0.9, detail: 0, sharp: true, mini: true };
    const detBox = el('div', { class: 'togs', role: 'group', 'aria-label': 'Map detail' }, panel);
    const detBtns = cfg.details.map((d, i) => { const b = el('button', { class: 'tog', type: 'button', 'aria-pressed': i === S.detail ? 'true' : 'false' }, detBox, d); b.addEventListener('click', () => { S.detail = i; detBtns.forEach((x, j) => x.setAttribute('aria-pressed', j === i ? 'true' : 'false')); load(map, true); }); return b; });
    const pixBox = el('div', { class: 'togs', role: 'group', 'aria-label': 'Map pixels' }, panel);
    const pixBtns = [['Sharp pixels', true], ['Smooth', false]].map(([n, v]) => { const b = el('button', { class: 'tog', type: 'button', 'aria-pressed': S.sharp === v ? 'true' : 'false' }, pixBox, n); b.addEventListener('click', () => { S.sharp = v; pixBtns.forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); }); return b; });
    el('h2', null, panel, 'Scale and light');
    // Io is 42 art px tall, one art px to one map px at Chris's chosen height; zoom sets screen px per map px
    function slider(label, min, max, step, key, fmt) {
      const lab = el('label', { class: 'sl' }, panel); el('span', null, lab, label);
      const inp = el('input', { type: 'range', min, max, step, value: S[key] }, lab), out = el('output', null, lab, fmt(S[key]));
      inp.addEventListener('input', () => { S[key] = +inp.value; out.textContent = fmt(S[key]); });
    }
    slider('Zoom', 0.6, 3, 0.1, 'zoom', (v) => v.toFixed(1) + '×');
    slider("Io's height on the map", 24, 60, 1, 'ioH', (v) => v + ' map px');
    slider('Light on the map', 0.5, 1.5, 0.05, 'mapLight', (v) => Math.round(v * 100) + '%');
    slider('Light on Io', 0.4, 1.3, 0.05, 'ioLight', (v) => Math.round(v * 100) + '%');
    el('p', { class: 'note' }, panel, cfg.note || '');

    const io = makePixelIo(1);
    // the mini-map, over the top right of the map: the whole painting, the camera's view and a dot for Io; a tap makes
    // it bigger or smaller
    const mini = el('canvas', { class: 'mini', role: 'img', 'aria-label': 'Mini-map' }, stage), mg = mini.getContext('2d');
    let miniBig = false;
    mini.addEventListener('pointerdown', (e) => { e.stopPropagation(); miniBig = !miniBig; mini.classList.toggle('big', miniBig); });
    const P = { x: 0, y: 0, dir: 's', walkT: 0, moving: false };
    const held = new Set(); let tap = null, map = null, img = null, line = -1;
    const KEYS = { ArrowUp: 'n', ArrowDown: 's', ArrowLeft: 'w', ArrowRight: 'e', w: 'n', s: 's', a: 'w', d: 'e', W: 'n', S: 's', A: 'w', D: 'e' };
    window.addEventListener('keydown', (e) => { const d = KEYS[e.key]; if (d) { held.add(d); tap = null; e.preventDefault(); } else if ((e.key === 'Enter' || e.key === ' ') && !box.hidden) { nextLine(); e.preventDefault(); } });
    window.addEventListener('keyup', (e) => { const d = KEYS[e.key]; if (d) held.delete(d); });

    // the camera: Io's height in map px sets the zoom, so her 24 px sprite at 2x stands as tall as cfg says
    const cam = { z: 1, x: 0, y: 0 };
    function layout() { cv.width = Math.round(stage.clientWidth * DPR); cv.height = Math.round(stage.clientHeight * DPR); }
    function toMap(cx, cy) { return [cam.x + cx / cam.z, cam.y + cy / cam.z]; }
    cv.addEventListener('pointerdown', (e) => { if (!map) return; const r = cv.getBoundingClientRect(); const [x, y] = toMap(e.clientX - r.left, e.clientY - r.top); tap = { x, y }; });
    box.addEventListener('click', nextLine);

    function load(m, keep) {
      map = m; mapBtns.forEach((b, i) => b.setAttribute('aria-pressed', cfg.maps[i] === m ? 'true' : 'false'));
      const next = new Image(); next.onload = () => { img = next; nowName.textContent = m.name; }; next.src = src(m.srcs[S.detail]);
      if (!keep) { img = null; P.x = m.start[0]; P.y = m.start[1]; P.dir = 's'; tap = null; }
    }
    function nextLine() {
      line++;
      if (line >= cfg.lines.length) { box.hidden = true; line = -1; return; }
      const [id, text] = cfg.lines[line], pr = cfg.portraits[id];
      face.src = src(pr.src); face.alt = pr.name; who.textContent = pr.name; said.textContent = text; box.hidden = false;
    }

    let last = performance.now();
    function frame(t) {
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      if (map && img && img.complete && img.naturalWidth) {
        // map px: the painting's own pixels; the image may be a lighter copy, mk image px to a map px
        const MW = (map.size || cfg.size)[0], MH = (map.size || cfg.size)[1], mk = img.naturalWidth / MW;
        // move: held directions win over a tap; one speed, twice the first test's (Chris)
        let dx = 0, dy = 0;
        if (held.size) { if (held.has('e')) dx++; if (held.has('w')) dx--; if (held.has('s')) dy++; if (held.has('n')) dy--; }
        else if (tap) { dx = tap.x - P.x; dy = tap.y - P.y; if (Math.hypot(dx, dy) < 2) { tap = null; dx = dy = 0; } }
        const L = Math.hypot(dx, dy);
        P.moving = L > 0;
        if (P.moving) {
          const sp = (cfg.speed || 110) * dt, k = Math.min(1, held.size ? sp / L : Math.min(sp, L) / L);
          P.x = clamp(P.x + dx * k, 6, MW - 6); P.y = clamp(P.y + dy * k, 6, MH - 2);
          P.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'e' : 'w') : (dy > 0 ? 's' : 'n');
          P.walkT += dt;
        } else P.walkT = 0;
        const W = cv.width / DPR, H = cv.height / DPR;
        cam.z = S.zoom; const sk = cam.z * S.ioH / io.h; // screen px per art px
        const vw = W / cam.z, vh = H / cam.z;
        cam.x = vw >= MW ? (MW - vw) / 2 : clamp(P.x - vw / 2, 0, MW - vw);
        cam.y = vh >= MH ? (MH - vh) / 2 : clamp(P.y - vh * 0.55, 0, MH - vh);
        g.setTransform(DPR, 0, 0, DPR, 0, 0);
        g.fillStyle = '#0b0912'; g.fillRect(0, 0, W, H);
        g.imageSmoothingEnabled = !S.sharp; g.imageSmoothingQuality = 'high';
        g.filter = S.mapLight !== 1 ? 'brightness(' + S.mapLight + ')' : 'none';
        g.drawImage(img, cam.x * mk, cam.y * mk, vw * mk, vh * mk, 0, 0, W, H);
        g.filter = 'none';
        // Io: a soft shadow, then the sprite, pixel-snapped, her feet on her spot
        const fx = (P.x - cam.x) * cam.z, fy = (P.y - cam.y) * cam.z;
        g.fillStyle = 'rgba(0,0,0,0.38)'; g.beginPath(); g.ellipse(fx, fy - sk, 9 * sk, 2.6 * sk, 0, 0, Math.PI * 2); g.fill();
        const step = P.moving ? [1, 0, 2, 0][Math.floor(P.walkT / 0.1) % 4] : 0, [sx, sy] = io.frame(P.dir, step);
        const ox = Math.round((fx - io.foot[0] * sk) * DPR) / DPR, oy = Math.round((fy - (io.foot[1] + 1) * sk) * DPR) / DPR;
        g.imageSmoothingEnabled = false;
        g.filter = S.ioLight !== 1 ? 'brightness(' + S.ioLight + ')' : 'none';
        g.drawImage(io.canvas, sx, sy, io.w, io.h, ox, oy, io.w * sk, io.h * sk);
        g.filter = 'none';
        if (box.hidden) nowName.textContent = map.name;
        drawMini(MW, MH, vw, vh, t);
      }
      requestAnimationFrame(frame);
    }
    function drawMini(MW, MH, vw, vh, t) {
      const r = mini.getBoundingClientRect(), w = Math.round(r.width * DPR), h = Math.round(w * MH / MW);
      if (!w) return;
      if (mini.width !== w || mini.height !== h) { mini.width = w; mini.height = h; }
      const k = w / MW;
      mg.imageSmoothingEnabled = true; mg.imageSmoothingQuality = 'high';
      mg.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, w, h);
      mg.lineWidth = Math.max(1, DPR); mg.strokeStyle = 'rgba(244,246,255,.85)';
      mg.strokeRect(Math.max(0, cam.x) * k, Math.max(0, cam.y) * k, Math.min(vw, MW) * k, Math.min(vh, MH) * k);
      const pulse = 0.5 + 0.5 * Math.sin(t / 180);
      mg.fillStyle = '#1a0c1d'; mg.beginPath(); mg.arc(P.x * k, P.y * k, (3.4 + pulse) * DPR, 0, Math.PI * 2); mg.fill();
      mg.fillStyle = '#ff5fb2'; mg.beginPath(); mg.arc(P.x * k, P.y * k, (2.2 + pulse) * DPR, 0, Math.PI * 2); mg.fill();
    }
    layout(); new ResizeObserver(layout).observe(stage);
    load(cfg.maps[0]);
    requestAnimationFrame(frame);
    window.__walk = { P, S, cam, load: (i) => load(cfg.maps[i]), talk: () => { line = -1; nextLine(); }, walkTo: (x, y) => { tap = { x, y }; } };
  }
  window.WalkTest = { start };
})();
