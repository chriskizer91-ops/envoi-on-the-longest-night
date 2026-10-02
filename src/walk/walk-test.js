// walk-test.js: the scale test for Chris's pilot ground-level maps (art request 04). The pixel Io walks a painted map
// with a d-pad, the arrow keys or a tap, the camera following her, so the size of the paintings can be judged against
// her. Sliders set her height on the map and the light on the map and on her. Talk shows the talking portraits
// (art request 05) in a dialogue box. No walls yet: she walks over everything; tracing the maps comes later.
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
    el('h2', null, panel, 'Scale and light');
    // Io is 36 art px tall, one art px to one map px at Chris's chosen height; zoom sets screen px per map px
    const S = { ioH: cfg.ioHeight || 36, zoom: window.innerWidth < 700 ? 1.6 : 1.4, mapLight: 1, ioLight: 0.9 };
    function slider(label, min, max, step, key, fmt) {
      const lab = el('label', { class: 'sl' }, panel); el('span', null, lab, label);
      const inp = el('input', { type: 'range', min, max, step, value: S[key] }, lab), out = el('output', null, lab, fmt(S[key]));
      inp.addEventListener('input', () => { S[key] = +inp.value; out.textContent = fmt(S[key]); });
    }
    slider('Zoom', 0.8, 3, 0.1, 'zoom', (v) => v.toFixed(1) + '×');
    slider("Io's height on the map", 24, 60, 1, 'ioH', (v) => v + ' map px');
    slider('Light on the map', 0.5, 1.5, 0.05, 'mapLight', (v) => Math.round(v * 100) + '%');
    slider('Light on Io', 0.4, 1.3, 0.05, 'ioLight', (v) => Math.round(v * 100) + '%');
    el('p', { class: 'note' }, panel, cfg.note || '');

    const io = makePixelIo(1);
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

    function load(m) {
      map = m; mapBtns.forEach((b, i) => b.setAttribute('aria-pressed', cfg.maps[i] === m ? 'true' : 'false'));
      img = new Image(); img.onload = () => { nowName.textContent = m.name; }; img.src = src(m.src);
      P.x = m.start[0]; P.y = m.start[1]; P.dir = 's'; tap = null;
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
        const MW = img.naturalWidth, MH = img.naturalHeight;
        // move: held directions win over a tap; she walks about 1.3 of her own heights a second
        let dx = 0, dy = 0;
        if (held.size) { if (held.has('e')) dx++; if (held.has('w')) dx--; if (held.has('s')) dy++; if (held.has('n')) dy--; }
        else if (tap) { dx = tap.x - P.x; dy = tap.y - P.y; if (Math.hypot(dx, dy) < 2) { tap = null; dx = dy = 0; } }
        const L = Math.hypot(dx, dy);
        P.moving = L > 0;
        if (P.moving) {
          const sp = 1.3 * S.ioH * dt, k = Math.min(1, held.size ? sp / L : Math.min(sp, L) / L);
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
        g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
        g.filter = S.mapLight !== 1 ? 'brightness(' + S.mapLight + ')' : 'none';
        g.drawImage(img, cam.x, cam.y, vw, vh, 0, 0, W, H);
        g.filter = 'none';
        // Io: a soft shadow, then the sprite, pixel-snapped, her feet on her spot
        const fx = (P.x - cam.x) * cam.z, fy = (P.y - cam.y) * cam.z;
        g.fillStyle = 'rgba(0,0,0,0.38)'; g.beginPath(); g.ellipse(fx, fy - sk, 9 * sk, 2.6 * sk, 0, 0, Math.PI * 2); g.fill();
        const step = P.moving ? [1, 0, 2, 0][Math.floor(P.walkT / 0.14) % 4] : 0, [sx, sy] = io.frame(P.dir, step);
        const ox = Math.round((fx - io.foot[0] * sk) * DPR) / DPR, oy = Math.round((fy - (io.foot[1] + 1) * sk) * DPR) / DPR;
        g.imageSmoothingEnabled = false;
        g.filter = S.ioLight !== 1 ? 'brightness(' + S.ioLight + ')' : 'none';
        g.drawImage(io.canvas, sx, sy, io.w, io.h, ox, oy, io.w * sk, io.h * sk);
        g.filter = 'none';
        if (box.hidden) nowName.textContent = map.name;
      }
      requestAnimationFrame(frame);
    }
    layout(); new ResizeObserver(layout).observe(stage);
    load(cfg.maps[0]);
    requestAnimationFrame(frame);
    window.__walk = { P, S, cam, load: (i) => load(cfg.maps[i]), talk: () => { line = -1; nextLine(); }, walkTo: (x, y) => { tap = { x, y }; } };
  }
  window.WalkTest = { start };
})();
