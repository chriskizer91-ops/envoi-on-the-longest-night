// envoi.js: Envoi, the Letter Wyrm, the summon of Io, the Witch. three.js r128 (global THREE). Defines makeEnvoi(opts) only.
// Touched up from src/models/originals/envoi.js (Chris's reference/demos/envoi-letter-wyrm-model-preview.html) after
// its model sheets (reference/art/envoi-model.webp, envoi-model-b.webp), its action sheets and the two Envoi scenes:
// sixteen faceted paper lanterns lit from inside and tied tip to tip with red cord knots and tassels, a bigger wedge
// head with swept horns, a scorched paper frill, heavy brows, blinking gold eyes, golden whiskers and the red wax seal,
// an eight-sided heart lantern hanging under the chin, pleated fans with glowing scorched tips, and the spec fixes
// (block 0.45 s, busy while a hold action plays, a skinned head, fewer and lighter draws).
function makeEnvoi(opts) {
  'use strict';
  // Units are meters, Y up, facing +Z, floating with its lowest lantern about half a meter up. Its left side is +X.
  opts = opts || {};
  const T = THREE;
  const DETAIL = Math.min(1, Math.max(0.5, opts.detail == null ? 1 : +opts.detail));
  let seed = 51713;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const rr = (a, b) => a + rnd() * (b - a);
  const cl = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const sm = (e0, e1, x) => { const u = cl((x - e0) / (e1 - e0), 0, 1); return u * u * (3 - 2 * u); };
  const win = (x, a, b, c, d) => sm(a, b, x) * (1 - sm(c, d, x));
  const TAU = Math.PI * 2;
  const V3 = (x, y, z) => new T.Vector3(x || 0, y || 0, z || 0);
  const UP = V3(0, 1, 0);
  let texBytes = 0, texCount = 0;

  // ---------- canvas painting ----------
  function tex(w, h, draw, k) {
    k = k || 1; const c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
    const g = c.getContext('2d'); g.scale(k, k); draw(g, w, h);
    const t = new T.CanvasTexture(c); t.anisotropy = 4;
    texBytes += c.width * c.height * 4 * 1.33; texCount++;
    return t;
  }
  const HI = DETAIL >= 0.85 ? 1 : 0.5;
  const INK = (a) => 'rgba(52,32,20,' + a + ')';
  function glyph(g, x, y, s, a, col) {
    g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = col ? col(a) : INK(a);
    const n = 3 + ((rnd() * 4) | 0);
    for (let i = 0; i < n; i++) {
      g.lineWidth = s * rr(0.07, 0.13);
      const x0 = x + rr(-0.38, 0.3) * s, y0 = y + rr(-0.42, 0.3) * s, k = rnd();
      g.beginPath(); g.moveTo(x0, y0);
      if (k < 0.38) g.lineTo(x0 + rr(0.35, 0.75) * s, y0 + rr(-0.1, 0.06) * s);
      else if (k < 0.78) g.quadraticCurveTo(x0 + rr(-0.15, 0.15) * s, y0 + 0.35 * s, x0 + rr(-0.3, 0.25) * s, y0 + rr(0.45, 0.75) * s);
      else g.lineTo(x0 + rr(0.08, 0.15) * s, y0 + rr(0.1, 0.18) * s);
      g.stroke();
    }
  }
  function column(g, x, y0, y1, s, a, col) { let y = y0; while (y < y1) { glyph(g, x, y, s, a * rr(0.55, 1), col); y += s * rr(1.05, 1.4); } }
  function writeBlock(g, x0, y0, w, h, s, a, col) { for (let x = x0 + s * 0.6; x < x0 + w - s * 0.3; x += s * rr(1.3, 1.6)) column(g, x, y0 + s * rr(0.5, 1.5), y0 + h - s * rr(0.4, 2.2), s, a, col); }
  function stamp(g, x, y, s, rot, a) {
    g.save(); g.translate(x, y); g.rotate(rot);
    g.fillStyle = 'rgba(176,30,32,' + a + ')'; g.fillRect(-s / 2, -s / 2, s, s);
    g.strokeStyle = 'rgba(246,226,196,' + a * 0.85 + ')'; g.lineWidth = s * 0.07; g.strokeRect(-s * 0.36, -s * 0.36, s * 0.72, s * 0.72);
    g.lineWidth = s * 0.09; g.lineCap = 'round';
    for (let i = 0; i < 3; i++) { g.beginPath(); const yy = -s * 0.2 + i * s * 0.2; g.moveTo(-s * 0.22, yy); g.lineTo(s * rr(0.05, 0.22), yy + rr(-0.05, 0.05) * s); g.stroke(); }
    g.restore();
  }
  function paper(g, x0, y0, w, h, base, n0) {
    g.fillStyle = base || '#ecdfc3'; g.fillRect(x0, y0, w, h);
    const n = n0 || (w * h) / 900;
    for (let i = 0; i < n; i++) {
      const x = x0 + rnd() * w, y = y0 + rnd() * h, r = rr(4, 22), d = rnd() < 0.5;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, d ? 'rgba(140,100,55,0.07)' : 'rgba(255,250,236,0.08)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
    g.strokeStyle = 'rgba(120,88,50,0.07)'; g.lineWidth = 1;
    for (let i = 0; i < n * 0.6; i++) { const x = x0 + rnd() * w, y = y0 + rnd() * h, a = rr(0, TAU), l = rr(3, 10); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  }
  function triPath(g, t) { g.beginPath(); g.moveTo(t[0][0], t[0][1]); g.lineTo(t[1][0], t[1][1]); g.lineTo(t[2][0], t[2][1]); g.closePath(); }

  // ---------- lantern facet atlas: 2x2 cells, each one paper facet (a canonical triangle) ----------
  // The map is the ivory paper with faded ink and a crease along every edge; the glow map is the light inside it,
  // brightest at the middle of a facet and dimmed by the ink and the folds.
  const ATL = 512, CS = 256, PAD = 9;
  const cellTri = (i) => { const cx = (i % 2) * CS, cy = ((i / 2) | 0) * CS; return [[cx + PAD, cy + CS - PAD], [cx + CS - PAD, cy + CS - PAD], [cx + CS / 2, cy + PAD]]; };
  const CELLUV = [0, 1, 2, 3].map((i) => cellTri(i).map(([x, y]) => [x / ATL, 1 - y / ATL]));
  function facetAtlas(glow) {
    return tex(ATL, ATL, (g) => {
      for (let i = 0; i < 4; i++) {
        const cx = (i % 2) * CS, cy = ((i / 2) | 0) * CS, t = cellTri(i);
        const mx = (t[0][0] + t[1][0] + t[2][0]) / 3, my = (t[0][1] + t[1][1] + t[2][1]) / 3;
        if (glow) {
          g.fillStyle = '#5a2c0c'; g.fillRect(cx, cy, CS, CS);
          const gr = g.createRadialGradient(mx, my + 12, 6, mx, my, CS * 0.6);
          gr.addColorStop(0, '#fff6dc'); gr.addColorStop(0.42, '#ffdc92'); gr.addColorStop(0.8, '#f0a04c'); gr.addColorStop(1, '#b8601c');
          g.fillStyle = gr; triPath(g, t); g.fill();
        } else {
          paper(g, cx, cy, CS, CS, '#f2e4c6');
          const gr = g.createRadialGradient(mx, my, CS * 0.18, mx, my, CS * 0.62);
          gr.addColorStop(0, 'rgba(255,252,240,0.25)'); gr.addColorStop(1, 'rgba(150,100,50,0.2)'); g.fillStyle = gr; g.fillRect(cx, cy, CS, CS);
        }
        seed = 900 + i * 77;
        g.save(); triPath(g, t); g.clip();
        writeBlock(g, cx + 30, cy + 40, CS - 60, CS - 52, 24, glow ? 0.42 : 0.62);
        if (i === 3) stamp(g, cx + CS * 0.5, cy + CS * 0.7, 30, rr(-0.3, 0.3), glow ? 0.35 : 0.8);
        g.restore();
        // the fold: a thin dark crease with a pale ridge beside it
        g.lineJoin = 'miter';
        g.strokeStyle = glow ? 'rgba(80,34,8,0.95)' : 'rgba(140,92,40,0.6)'; g.lineWidth = glow ? 9 : 5; triPath(g, t); g.stroke();
        if (!glow) { g.strokeStyle = 'rgba(255,246,222,0.55)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(t[0][0] + 9, t[0][1] - 6); g.lineTo(t[2][0], t[2][1] + 12); g.lineTo(t[1][0] - 9, t[1][1] - 6); g.stroke(); }
      }
    }, glow ? 0.5 : HI);
  }
  seed = 4242;
  const segMap = facetAtlas(false), segGlow = facetAtlas(true);

  // ---------- head atlas: eight paper cells, a scorch strip for the frill blades, and the wax seal ----------
  const HA = 1024;
  const hCellTri = (i) => { const cx = (i % 4) * 256, cy = ((i / 4) | 0) * 256; return [[cx + 9, cy + 247], [cx + 247, cy + 247], [cx + 128, cy + 9]]; };
  const HCELLUV = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => hCellTri(i).map(([x, y]) => [x / HA, 1 - y / HA]));
  // the strip: u across a blade, v from its root (0) to its scorched tip (1); bottom left quarter
  const stripUV = (u, v) => [(8 + u * 496) / HA, 1 - (1016 - v * 504) / HA];
  // the seal: a disc of radius 240 px centered in the bottom right quarter
  const sealUV = (x, y) => [(768 + x * 240) / HA, 1 - (768 - y * 240) / HA];
  function headAtlas(glow) {
    return tex(HA, HA, (g) => {
      // paper cells
      for (let i = 0; i < 8; i++) {
        const cx = (i % 4) * 256, cy = ((i / 4) | 0) * 256, t = hCellTri(i);
        const mx = (t[0][0] + t[1][0] + t[2][0]) / 3, my = (t[0][1] + t[1][1] + t[2][1]) / 3;
        if (glow) {
          g.fillStyle = '#2a1406'; g.fillRect(cx, cy, 256, 256);
          const gr = g.createRadialGradient(mx, my, 8, mx, my, 150); gr.addColorStop(0, i < 4 ? '#eab06a' : '#d09a58'); gr.addColorStop(1, '#6a3a14');
          g.fillStyle = gr; triPath(g, t); g.fill();
        } else {
          paper(g, cx, cy, 256, 256, i < 4 ? '#f1e2c2' : '#eadabb');
          const gr = g.createLinearGradient(cx, cy + 256, cx, cy); gr.addColorStop(0, 'rgba(120,80,40,0.18)'); gr.addColorStop(0.4, 'rgba(120,80,40,0)'); g.fillStyle = gr; g.fillRect(cx, cy, 256, 256);
        }
        seed = 2200 + i * 53;
        g.save(); triPath(g, t); g.clip(); writeBlock(g, cx + 30, cy + 44, 196, 190, 22, glow ? 0.4 : 0.6); g.restore();
        g.lineJoin = 'miter'; g.strokeStyle = glow ? 'rgba(40,16,4,0.95)' : 'rgba(130,86,40,0.6)'; g.lineWidth = glow ? 8 : 5; triPath(g, t); g.stroke();
        if (!glow) { g.strokeStyle = 'rgba(255,246,222,0.5)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(t[0][0] + 9, t[0][1] - 6); g.lineTo(t[2][0], t[2][1] + 12); g.lineTo(t[1][0] - 9, t[1][1] - 6); g.stroke(); }
      }
      // scorch strip: ivory at the root, then peach, orange and red to a charred point
      const sx = 0, sy = 512, sw = 512, sh = 512;
      const gr = g.createLinearGradient(0, sy + sh, 0, sy);
      if (glow) { gr.addColorStop(0, '#2c1606'); gr.addColorStop(0.38, '#4a240a'); gr.addColorStop(0.6, '#b85a18'); gr.addColorStop(0.78, '#ff8a28'); gr.addColorStop(0.9, '#ff5a1a'); gr.addColorStop(1, '#a8200c'); }
      else { gr.addColorStop(0, '#efe0c0'); gr.addColorStop(0.42, '#f3dcb4'); gr.addColorStop(0.6, '#f8c488'); gr.addColorStop(0.74, '#f8963e'); gr.addColorStop(0.86, '#ec5a26'); gr.addColorStop(0.95, '#c42a18'); gr.addColorStop(1, '#6a140a'); }
      g.fillStyle = gr; g.fillRect(sx, sy, sw, sh);
      if (!glow) { const n0 = 260; for (let i = 0; i < n0; i++) { const x = sx + rnd() * sw, y = sy + sh * (0.35 + rnd() * 0.65), r = rr(4, 16); const q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, 'rgba(255,250,236,0.1)'); q.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = q; g.fillRect(x - r, y - r, 2 * r, 2 * r); } }
      seed = 3011;
      for (let x = sx + 40; x < sx + sw - 30; x += rr(46, 60)) column(g, x, sy + sh * 0.45, sy + sh - 20, 20, glow ? 0.35 : 0.55);
      // the blade's middle crease and two side folds
      g.strokeStyle = glow ? 'rgba(30,10,2,0.8)' : 'rgba(120,60,24,0.45)'; g.lineWidth = glow ? 8 : 5;
      for (const f of [0.5]) { g.beginPath(); g.moveTo(sx + sw * f, sy); g.lineTo(sx + sw * f, sy + sh); g.stroke(); }
      g.strokeStyle = glow ? 'rgba(30,10,2,0.6)' : 'rgba(255,240,214,0.35)'; g.lineWidth = 3;
      for (const f of [0.02, 0.98]) { g.beginPath(); g.moveTo(sx + sw * f, sy); g.lineTo(sx + sw * f, sy + sh); g.stroke(); }
      // the wax seal: red wax with a wavy rim, an inner ring, and a gold crescent cradling a flame
      const c = { x: 768, y: 768 }, R = 240;
      g.fillStyle = glow ? '#000' : '#7a0c12'; g.fillRect(512, 512, 512, 512);
      if (glow) { g.fillStyle = '#4a0a08'; g.beginPath(); g.arc(c.x, c.y, R * 0.98, 0, TAU); g.fill(); }
      if (!glow) {
        g.beginPath();
        for (let i = 0; i <= 72; i++) { const a = (i / 72) * TAU, r = R * (0.95 + 0.04 * Math.sin(a * 9) + 0.015 * Math.sin(a * 23)); if (i) g.lineTo(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r); else g.moveTo(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r); }
        const wg = g.createRadialGradient(c.x - 70, c.y - 80, 20, c.x, c.y, R); wg.addColorStop(0, '#e2464a'); wg.addColorStop(0.55, '#b8161e'); wg.addColorStop(1, '#6a0a10');
        g.fillStyle = wg; g.fill();
        g.lineWidth = 16; g.strokeStyle = 'rgba(70,4,8,0.85)'; g.beginPath(); g.arc(c.x, c.y, R * 0.74, 0, TAU); g.stroke();
        g.lineWidth = 6; g.strokeStyle = 'rgba(255,150,140,0.45)'; g.beginPath(); g.arc(c.x - 3, c.y - 3, R * 0.74, Math.PI * 1.05, Math.PI * 1.62); g.stroke();
      }
      // the mark, in gold
      const gold = glow ? '#6a4a14' : '#e8b85a', goldD = glow ? '#3a2408' : '#9a6a24';
      // a crescent moon, thick at its lower left and horned at the top and right, cradling a flame in its hollow
      const cc = document.createElement('canvas'); cc.width = cc.height = 320; const q = cc.getContext('2d');
      q.translate(160, 160); q.fillStyle = gold; q.beginPath(); q.arc(-8, 14, 132, 0, TAU); q.fill();
      q.globalCompositeOperation = 'destination-out'; q.beginPath(); q.arc(30, -20, 116, 0, TAU); q.fill(); q.globalCompositeOperation = 'source-over';
      q.strokeStyle = goldD; q.lineWidth = 5; q.beginPath(); q.arc(-8, 14, 130, Math.PI * 0.32, Math.PI * 1.32); q.stroke();
      if (!glow) { q.strokeStyle = 'rgba(255,240,200,0.65)'; q.lineWidth = 4; q.beginPath(); q.arc(-8, 14, 118, Math.PI * 0.62, Math.PI * 0.95); q.stroke(); }
      g.drawImage(cc, c.x - 160, c.y - 160);
      g.save(); g.translate(c.x + 22, c.y - 6); g.lineCap = 'round'; g.lineJoin = 'round';
      g.fillStyle = gold; g.beginPath(); g.moveTo(0, 70); g.bezierCurveTo(-52, 40, -44, -20, -16, -62); g.bezierCurveTo(-14, -34, 0, -34, 4, -14); g.bezierCurveTo(10, -44, 26, -62, 22, -100); g.bezierCurveTo(64, -50, 58, 30, 0, 70); g.closePath(); g.fill();
      g.strokeStyle = goldD; g.lineWidth = 5; g.stroke();
      g.fillStyle = glow ? '#000' : '#a8141c'; g.beginPath(); g.moveTo(0, 48); g.bezierCurveTo(-24, 28, -18, -6, -5, -24); g.bezierCurveTo(-1, -6, 9, -4, 9, 6); g.bezierCurveTo(20, 20, 13, 38, 0, 48); g.closePath(); g.fill();
      g.restore();
    }, glow ? 0.5 : HI);
  }
  seed = 1777;
  const headMap = headAtlas(false), headGlow = headAtlas(true);

  // ---------- wings: pleated letters, glowing orange to red at the scorched tips ----------
  function wingTex(glow) {
    return tex(1024, 512, (g, w, h) => {
      // u runs from the wing root (0) out to the tips of the pleats (1); the bands end at 0.74 and the spikes take the rest
      const gr = g.createLinearGradient(0, 0, w, 0);
      if (glow) { gr.addColorStop(0, '#1c0e04'); gr.addColorStop(0.25, '#3c2410'); gr.addColorStop(0.6, '#4a2c12'); gr.addColorStop(0.7, '#8a4614'); gr.addColorStop(0.8, '#ff8a2c'); gr.addColorStop(0.9, '#ff5a1a'); gr.addColorStop(1, '#e8360e'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
      else {
        paper(g, 0, 0, w, h, '#f2e5c8');
        gr.addColorStop(0, 'rgba(248,200,140,0)'); gr.addColorStop(0.64, 'rgba(248,200,140,0)'); gr.addColorStop(0.73, 'rgba(250,186,112,0.7)'); gr.addColorStop(0.81, 'rgba(250,146,62,0.95)'); gr.addColorStop(0.9, 'rgba(240,88,34,1)'); gr.addColorStop(0.96, 'rgba(206,44,22,1)'); gr.addColorStop(1, 'rgba(140,22,12,1)');
        g.fillStyle = gr; g.fillRect(0, 0, w, h);
      }
      seed = 3131;
      g.save(); g.translate(0, h); g.rotate(-Math.PI / 2);
      for (let y = 7; y < h - 4; y += 15) column(g, y, 70, w * 0.66, 11, glow ? 0.38 : 0.5);
      g.restore();
      seed = 3200; for (let i = 0; i < 4; i++) stamp(g, rr(200, 560), rr(30, h - 30), 22, rr(-0.4, 0.4), glow ? 0.35 : 0.8);
      // fold lines: every pleat edge is a crease
      g.strokeStyle = glow ? 'rgba(60,24,6,0.6)' : 'rgba(120,76,36,0.3)'; g.lineWidth = 2.4;
      for (let y = 0; y <= h; y += h / 36) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
      // ragged char along the very tips, glowing like a lit edge
      g.fillStyle = glow ? 'rgba(255,190,110,0.95)' : 'rgba(110,18,8,0.9)';
      g.beginPath(); g.moveTo(w, 0); for (let i = 0; i <= 48; i++) g.lineTo(w - w * rr(0.006, 0.022), (h * i) / 48); g.lineTo(w, h); g.closePath(); g.fill();
    }, glow ? 0.5 : HI);
  }
  const wingMap = wingTex(false), wingGlow = wingTex(true);

  // ---------- tail streamers, tags, letters, eyes, sprites ----------
  const streamTex = tex(512, 256, (g, w, h) => {
    for (let r = 0; r < 4; r++) {
      const y0 = r * 64; paper(g, 0, y0, w, 64, '#f0e3c6');
      seed = 600 + r * 31;
      g.save(); g.translate(0, y0 + 64); g.rotate(-Math.PI / 2);
      column(g, 20, 30, w - 150, 14, 0.75); column(g, 42, 40, w - 170, 13, 0.6);
      g.restore();
      if (r % 2 === 0) stamp(g, rr(120, 260), y0 + 32, 22, rr(-0.3, 0.3), 0.85);
      // scorched, glowing ends
      const gr = g.createLinearGradient(w * 0.55, 0, w, 0);
      gr.addColorStop(0, 'rgba(248,170,90,0)'); gr.addColorStop(0.35, 'rgba(248,150,70,0.7)'); gr.addColorStop(0.65, 'rgba(236,84,32,0.95)'); gr.addColorStop(0.88, 'rgba(120,30,10,1)'); gr.addColorStop(1, 'rgba(40,12,6,1)');
      g.fillStyle = gr; g.fillRect(w * 0.55, y0, w * 0.45, 64);
      g.fillStyle = 'rgba(60,20,8,0.7)'; for (let i = 0; i < 8; i++) { const x = rr(w * 0.5, w * 0.85); g.beginPath(); g.arc(x, y0 + (rnd() < 0.5 ? 2 : 62), rr(3, 9), 0, TAU); g.fill(); }
    }
  }, HI);
  const tagTex = tex(64, 128, (g, w, h) => {
    g.fillStyle = '#d9c39a'; g.fillRect(0, 0, w, h); paper(g, 3, 3, w - 6, h - 6, '#eadab4', 20);
    g.fillStyle = '#3a2416'; g.beginPath(); g.arc(w / 2, 12, 4, 0, TAU); g.fill();
    seed = 77; column(g, w / 2, 30, h - 36, 11, 0.85); stamp(g, w / 2, h - 18, 18, 0, 0.9);
    g.fillStyle = 'rgba(120,40,16,0.55)'; g.fillRect(0, h - 6, w, 6);
    g.fillStyle = '#b8161f'; g.fillRect(0, 0, 6, 6); // the red string's texel
  });
  const sprTex = tex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
  const letterTex = tex(128, 96, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#f3e6c8'; g.beginPath(); g.moveTo(8, 10); g.lineTo(w - 10, 6); g.lineTo(w - 6, h - 12); g.lineTo(10, h - 6); g.closePath(); g.fill();
    seed = 808; g.save(); g.translate(0, h); g.rotate(-Math.PI / 2); column(g, 30, 20, w - 20, 11, 0.8); column(g, 52, 24, w - 30, 11, 0.7); g.restore();
    g.fillStyle = 'rgba(176,30,32,0.9)'; g.beginPath(); g.arc(w * 0.72, h * 0.6, 10, 0, TAU); g.fill();
    g.globalCompositeOperation = 'source-atop';
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, 'rgba(255,140,40,0)'); gr.addColorStop(0.7, 'rgba(255,150,50,0.15)'); gr.addColorStop(1, 'rgba(255,110,20,0.95)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'source-over';
  });
  // the eyes: a molten gold almond with a darker ring and a soft slit
  const eyeTex = tex(128, 64, (g, w, h) => {
    const gr = g.createRadialGradient(w * 0.5, h * 0.5, 2, w * 0.5, h * 0.5, w * 0.5);
    gr.addColorStop(0, '#fffbe6'); gr.addColorStop(0.25, '#ffe9a0'); gr.addColorStop(0.55, '#ffc24a'); gr.addColorStop(0.78, '#f08a1e'); gr.addColorStop(0.9, '#a8460c'); gr.addColorStop(1, '#5a1e06');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(150,62,10,0.6)'; g.lineWidth = 3; g.beginPath(); g.ellipse(w / 2, h / 2, w * 0.3, h * 0.36, 0, 0, TAU); g.stroke();
    g.fillStyle = 'rgba(120,48,8,0.55)'; g.beginPath(); g.ellipse(w / 2, h / 2, 3.2, h * 0.3, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.ellipse(w * 0.4, h * 0.36, 5, 3, -0.3, 0, TAU); g.fill();
  });

  // ---------- materials ----------
  // Paper lit from inside: the light shows brightest where a facet faces you and turns orange toward the
  // silhouette, as in the sheets. aBurn (per lantern) carries the glow (x) and the char (y) for the burning.
  const GLOW_C = new T.Color(0xffc274), CREASE = new T.Color(0xfff0d0);
  const f3 = (c) => 'vec3(' + c.map((v) => v.toFixed(3)).join(', ') + ')';
  function lanternMat(o) {
    const m = new T.MeshStandardMaterial({ color: o.color || 0xffffff, map: o.map, emissiveMap: o.glow, emissive: (o.emissive || GLOW_C).clone(), emissiveIntensity: o.intensity, roughness: 0.84, metalness: 0, flatShading: true, side: o.side || T.FrontSide });
    const U = { uChar: { value: 0 } }, burn = !!o.burn;
    const edge = f3(o.edge || [1.0, 0.56, 0.24]), mid = f3(o.mid || [1.0, 0.95, 0.82]);
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uChar = U.uChar;
      if (burn) sh.vertexShader = 'attribute vec2 aBurn;\nvarying vec2 vBurn;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vBurn = aBurn;');
      sh.fragmentShader = (burn ? 'varying vec2 vBurn;\n' : 'uniform float uChar;\n') + sh.fragmentShader
        .replace('#include <map_fragment>', '#include <map_fragment>\n' + (burn ? ' float bC = vBurn.y;\n' : ' float bC = uChar;\n') + ' diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.13, 0.08, 0.05), bC);')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' +
          ' float nFr = clamp(abs(dot(normal, normalize(vViewPosition))), 0.0, 1.0);\n' +
          ' totalEmissiveRadiance *= mix(' + edge + ', ' + mid + ', smoothstep(0.1, 0.9, nFr)) * (' + o.lo + ' + ' + o.hi + ' * nFr);\n' +
          (burn ? ' totalEmissiveRadiance *= vBurn.x;\n' : '') +
          ' totalEmissiveRadiance *= (1.0 - bC * 0.92);\n totalEmissiveRadiance += vec3(1.0, 0.36, 0.06) * bC * (1.0 - bC) * 2.6;');
    };
    m.customProgramCacheKey = () => 'envoi-' + o.key;
    m.U = U;
    return m;
  }
  // the lanterns' outer paper takes little of the night light: the glow inside does the work
  const matSeg = lanternMat({ map: segMap, glow: segGlow, intensity: 1.0, key: 'seg', burn: true, lo: '0.42', hi: '0.85', color: 0x958878 });
  const matHeart = lanternMat({ map: segMap, glow: segGlow, intensity: 2.0, key: 'heart', lo: '0.6', hi: '1.0', color: 0x958878, mid: [1.0, 0.98, 0.9] });
  const matHead = lanternMat({ map: headMap, glow: headGlow, intensity: 0.8, key: 'head', lo: '0.75', hi: '0.4', color: 0xf4e2c2, side: T.DoubleSide, edge: [1.0, 0.72, 0.42] });
  matHead.skinning = true;
  const matWing = lanternMat({ map: wingMap, glow: wingGlow, intensity: 0.9, key: 'wing', lo: '1.0', hi: '0.0', color: 0xe6dccc, side: T.DoubleSide, edge: [1, 1, 1], mid: [1, 1, 1] });
  const matRed = new T.MeshStandardMaterial({ color: 0xbc1a22, emissive: 0x420509, roughness: 0.58, metalness: 0, flatShading: true });
  const matRib = new T.MeshStandardMaterial({ color: 0xc8955a, emissive: 0x4a2a0c, roughness: 0.5, metalness: 0.1, side: T.DoubleSide });
  const matGold = new T.MeshStandardMaterial({ color: 0xf0c068, emissive: 0x6a4010, roughness: 0.38, metalness: 0.45, side: T.DoubleSide });
  const matStream = new T.MeshStandardMaterial({ map: streamTex, emissive: new T.Color(0xffa040), emissiveMap: streamTex, emissiveIntensity: 0.22, roughness: 0.9, side: T.DoubleSide });
  const matTag = new T.MeshStandardMaterial({ map: tagTex, roughness: 0.85, side: T.DoubleSide, emissive: 0x2a1406 });
  const matEye = new T.MeshBasicMaterial({ map: eyeTex });
  const matMouth = new T.MeshBasicMaterial({ color: 0xffb04a, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide });
  const matLetter = new T.MeshBasicMaterial({ map: letterTex, transparent: true, side: T.DoubleSide, depthWrite: false, alphaTest: 0.05 });
  const matShard = new T.MeshStandardMaterial({ color: 0xc01c24, roughness: 0.35, side: T.DoubleSide, flatShading: true });
  // glow halos and embers: light only, so on the bench's see-through canvas they brighten the painting and never darken it
  function pointsMat(map) {
    return new T.ShaderMaterial({
      uniforms: { map: { value: map || sprTex }, scale: { value: 800 } },
      vertexShader: 'attribute float size; attribute vec4 col; varying vec4 vC; uniform float scale;\nvoid main(){ vC = col; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = size * scale / max(0.1, -mv.z); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform sampler2D map; varying vec4 vC;\nvoid main(){ vec4 t = texture2D(map, gl_PointCoord); float a = t.a * vC.a; gl_FragColor = vec4(vC.rgb * t.rgb * a, a); }',
      blending: T.CustomBlending, blendEquation: T.AddEquation, blendSrc: T.OneFactor, blendDst: T.OneFactor, blendEquationAlpha: T.AddEquation, blendSrcAlpha: T.ZeroFactor, blendDstAlpha: T.OneFactor,
      transparent: true, depthWrite: false,
    });
  }

  // ---------- folded paper geometry ----------
  const LV = DETAIL >= 0.85 ? 2 : 1; // crumple subdivision depth
  function Soup(cells, lv) { this.p = []; this.u = []; this.cells = cells || CELLUV; this.lv = lv == null ? LV : lv; }
  Soup.prototype.tri = function (a, b, c, ua, ub, uc) {
    this.p.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    this.u.push(ua[0], ua[1], ub[0], ub[1], uc[0], uc[1]);
  };
  Soup.prototype.geo = function () {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(this.p, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(this.u, 2));
    g.computeVertexNormals(); return g;
  };
  function hash3(x, y, z) { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return (s - Math.floor(s)) * 2 - 1; }
  const _e1 = V3(), _e2 = V3(), _n = V3(), _c = V3();
  // one paper facet: turned to face away from `ctr`, subdivided with a slight crumple that keeps its edges straight
  function facet(S, a, b, c, ctr, amp, uv) {
    _n.copy(_e1.subVectors(b, a)).cross(_e2.subVectors(c, a));
    const area = _n.length() * 0.5; if (area < 1e-8) return;
    _n.normalize();
    _c.copy(a).add(b).add(c).multiplyScalar(1 / 3);
    let ua = null;
    if (ctr && _n.dot(V3().subVectors(_c, ctr)) < 0) { const t = b; b = c; c = t; _n.negate(); if (uv) ua = [uv[0], uv[2], uv[1]]; }
    const UVt = ua || uv || S.cells[(rnd() * S.cells.length) | 0];
    const n = _n.clone(), A = (amp == null ? 0.05 : amp) * Math.sqrt(area);
    const P = (w) => {
      const p = V3().addScaledVector(a, w[0]).addScaledVector(b, w[1]).addScaledVector(c, w[2]);
      const e = Math.min(w[0], w[1], w[2]) * 3;
      if (e > 0 && A > 0) p.addScaledVector(n, A * e * hash3(p.x * 9.1, p.y * 9.1, p.z * 9.1));
      return p;
    };
    const U = (w) => [UVt[0][0] * w[0] + UVt[1][0] * w[1] + UVt[2][0] * w[2], UVt[0][1] * w[0] + UVt[1][1] * w[1] + UVt[2][1] * w[2]];
    const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2];
    const rec = (wa, wb, wc, d) => {
      if (d === 0) { S.tri(P(wa), P(wb), P(wc), U(wa), U(wb), U(wc)); return; }
      const ab = mid(wa, wb), bc = mid(wb, wc), ca = mid(wc, wa);
      rec(wa, ab, ca, d - 1); rec(ab, wb, bc, d - 1); rec(ca, bc, wc, d - 1); rec(ab, bc, ca, d - 1);
    };
    rec([1, 0, 0], [0, 1, 0], [0, 0, 1], amp === 0 ? 0 : S.lv);
  }
  // rings of points along a path; radius 0 makes a point (tip). Every face is a paper facet.
  function tube(S, path, rad, sides, o) {
    o = o || {};
    const rings = [];
    for (let k = 0; k < path.length; k++) {
      const d = (k < path.length - 1 ? V3().subVectors(path[k + 1], path[k]) : V3().subVectors(path[k], path[k - 1])).normalize();
      const sd = V3().crossVectors(d, Math.abs(d.y) > 0.92 ? V3(0, 0, 1) : UP).normalize();
      if (o.side) sd.copy(o.side).addScaledVector(d, -o.side.dot(d)).normalize();
      const u2 = V3().crossVectors(sd, d).normalize();
      if (rad[k] <= 0) { rings.push(null); continue; }
      const ring = [];
      for (let i = 0; i < sides; i++) {
        const a = (i / sides) * TAU + (o.phase || 0);
        ring.push(path[k].clone().addScaledVector(sd, Math.cos(a) * rad[k] * (o.flat || 1)).addScaledVector(u2, Math.sin(a) * rad[k]));
      }
      rings.push(ring);
    }
    for (let k = 0; k < path.length - 1; k++) {
      const A = rings[k], B = rings[k + 1], ctr = V3().addVectors(path[k], path[k + 1]).multiplyScalar(0.5);
      for (let i = 0; i < sides; i++) {
        const j = (i + 1) % sides;
        if (A && B) { facet(S, A[i], B[i], B[j], ctr, o.amp); facet(S, A[i], B[j], A[j], ctr, o.amp); }
        else if (A && !B) facet(S, A[i], path[k + 1], A[j], ctr.clone().lerp(path[k], 0.5), o.amp);
        else if (!A && B) facet(S, path[k], B[i], B[j], ctr.clone().lerp(path[k + 1], 0.5), o.amp);
      }
    }
    if (rings[0] && o.cap !== false) { const ctr = path[1].clone(); for (let i = 0; i < sides; i++) facet(S, path[0], rings[0][i], rings[0][(i + 1) % sides], ctr, 0); }
  }
  // closed loft along +z through polygon sections
  function loft(S, secs, amp) {
    const P = secs.map((s) => s.pts.map(([x, y]) => V3(x, y, s.z)));
    const cen = (r) => r.reduce((m, p) => m.add(p), V3()).multiplyScalar(1 / r.length);
    for (let k = 0; k < P.length - 1; k++) {
      const n = P[k].length, ctr = cen(P[k]).add(cen(P[k + 1])).multiplyScalar(0.5);
      for (let i = 0; i < n; i++) { const j = (i + 1) % n; facet(S, P[k][i], P[k + 1][i], P[k + 1][j], ctr, amp); facet(S, P[k][i], P[k + 1][j], P[k][j], ctr, amp); }
    }
    const capAt = (r, inner) => { const c = cen(r); for (let i = 0; i < r.length; i++) facet(S, c, r[i], r[(i + 1) % r.length], inner, 0); };
    capAt(P[0], cen(P[1])); capAt(P[P.length - 1], cen(P[P.length - 2]));
  }
  // a folded paper blade (frill spike, cheek fin): a flat four-sided pyramid mapped onto the scorch strip
  function blade(S, base, tip, side, wid, thick, amp) {
    const d = V3().subVectors(tip, base), n = V3().crossVectors(d, side).normalize(), s = V3().crossVectors(n, d).normalize();
    const q = [base.clone().addScaledVector(s, wid), base.clone().addScaledVector(n, thick), base.clone().addScaledVector(s, -wid), base.clone().addScaledVector(n, -thick)];
    const ctr = base.clone().addScaledVector(d, 0.3), us = [0, 0.5, 1, 0.5];
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4, u0 = us[i], u1 = i === 3 ? 0 : us[j];
      facet(S, q[i], q[j], tip, ctr, amp, [stripUV(u0, 0.02), stripUV(u1, 0.02), stripUV(0.5, 1)]);
    }
  }
  function merge(list) {
    const pos = [], uv = [], sk = [];
    for (const it of list) {
      const g0 = it.geo || it, bi = it.bone || 0;
      const g = g0.index ? g0.toNonIndexed() : g0, p = g.attributes.position.array, u = g.attributes.uv ? g.attributes.uv.array : null;
      for (let i = 0; i < p.length; i++) pos.push(p[i]);
      for (let i = 0; i < p.length / 3; i++) { uv.push(u ? u[i * 2] : 0, u ? u[i * 2 + 1] : 0); sk.push(bi); }
    }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.computeVertexNormals();
    g.userData.bones = sk; return g;
  }
  function skinAttrs(g) {
    const n = g.attributes.position.count, si = new Float32Array(n * 4), sw = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) { si[i * 4] = g.userData.bones[i]; sw[i * 4] = 1; }
    g.setAttribute('skinIndex', new T.BufferAttribute(si, 4)); g.setAttribute('skinWeight', new T.BufferAttribute(sw, 4));
    return g;
  }

  // ---------- the lanterns: geodesic paper balls with a point at each end, where the cords tie ----------
  function geodesic() { // an icosahedron with its poles on Y, each face split in four on the sphere
    const t = Math.atan(0.5), V = [V3(0, 1, 0)];
    for (let i = 0; i < 5; i++) V.push(V3(Math.cos(t) * Math.cos((i * TAU) / 5), Math.sin(t), Math.cos(t) * Math.sin((i * TAU) / 5)));
    for (let i = 0; i < 5; i++) V.push(V3(Math.cos(t) * Math.cos(((i + 0.5) * TAU) / 5), -Math.sin(t), Math.cos(t) * Math.sin(((i + 0.5) * TAU) / 5)));
    V.push(V3(0, -1, 0));
    const F = [];
    for (let i = 0; i < 5; i++) { const j = (i + 1) % 5; F.push([0, 1 + i, 1 + j], [1 + i, 6 + i, 1 + j], [1 + j, 6 + i, 6 + j], [11, 6 + j, 6 + i]); }
    const out = [];
    for (const [a, b, c] of F) {
      const A = V[a], B = V[b], C = V[c], ab = V3().addVectors(A, B).normalize(), bc = V3().addVectors(B, C).normalize(), ca = V3().addVectors(C, A).normalize();
      out.push([A, ab, ca], [ab, B, bc], [ca, bc, C], [ab, bc, ca]);
    }
    return out;
  }
  const LR = 0.3, LH = 0.3; // lantern radius and half-height at size 1
  function lanternGeo() {
    const S = new Soup(CELLUV), O = V3(), k = V3(LR, LH, LR);
    for (const [a, b, c] of geodesic()) facet(S, a.clone().multiply(k), b.clone().multiply(k), c.clone().multiply(k), O, 0.04);
    return S.geo();
  }
  // the heart: eight-sided, with flat caps, a top knot and a long tassel (sheet A, "heart lantern (eight-sided)")
  const HR = 0.3, HHt = 0.29;
  function heartGeo() {
    const S = new Soup(CELLUV), O = V3();
    const R = [[HHt, 0.52, 0], [HHt * 0.5, 0.9, 0.5], [0, 1, 0], [-HHt * 0.5, 0.9, 0.5], [-HHt, 0.52, 0]];
    const rings = R.map(([y, r, ph]) => Array.from({ length: 8 }, (_, i) => V3(Math.cos(((i + ph) * TAU) / 8) * r * HR, y, Math.sin(((i + ph) * TAU) / 8) * r * HR)));
    for (let k = 0; k < rings.length - 1; k++) {
      const A = rings[k], B = rings[k + 1], up = R[k + 1][2] > R[k][2];
      for (let i = 0; i < 8; i++) {
        const j = (i + 1) % 8;
        if (up) { facet(S, A[i], B[i], A[j], O, 0.04); facet(S, B[i], B[j], A[j], O, 0.04); }
        else { facet(S, A[i], B[j], B[i], O, 0.04); facet(S, A[i], A[j], B[j], O, 0.04); }
      }
    }
    return S.geo();
  }
  function heartRedGeo() {
    const parts = [];
    for (const s of [1, -1]) {
      const cap = new T.CylinderGeometry(HR * 0.56, HR * 0.6, 0.035, 8, 1); cap.translate(0, s * (HHt + 0.012), 0); parts.push(cap);
      const rim = new T.TorusGeometry(HR * 0.58, 0.012, 4, 16); rim.rotateX(Math.PI / 2); rim.translate(0, s * (HHt - 0.006), 0); parts.push(rim);
    }
    // top: a collar, a button knot with two loops, and the loop the cord ties to
    const col = new T.CylinderGeometry(0.035, 0.05, 0.05, 8, 1); col.translate(0, HHt + 0.05, 0); parts.push(col);
    const kn = new T.IcosahedronGeometry(0.045, 1); kn.translate(0, HHt + 0.11, 0); parts.push(kn);
    for (const s of [-1, 1]) { const l = new T.TorusGeometry(0.035, 0.012, 4, 10); l.translate(s * 0.055, HHt + 0.12, 0); parts.push(l); }
    const hook = new T.TorusGeometry(0.03, 0.01, 4, 10); hook.translate(0, HHt + 0.18, 0); parts.push(hook);
    // bottom: a knot, a bead and the long tassel
    const kb = new T.IcosahedronGeometry(0.04, 1); kb.translate(0, -HHt - 0.06, 0); parts.push(kb);
    for (const s of [-1, 1]) { const l = new T.TorusGeometry(0.03, 0.011, 4, 10); l.translate(s * 0.05, -HHt - 0.06, 0); parts.push(l); }
    const tg = tasselGeo(1.5); tg.translate(0, -HHt - 0.06, 0); parts.push(tg);
    return merge(parts);
  }
  // a red tassel hanging down from y = 0: knot, cord, bead, bell cap, and a fringed brush of strands
  function tasselGeo(k) {
    k = k || 1;
    const a = new T.IcosahedronGeometry(0.03, 1); a.translate(0, -0.025, 0);
    const b = new T.CylinderGeometry(0.008, 0.008, 0.08, 5, 1); b.translate(0, -0.09, 0);
    const c = new T.IcosahedronGeometry(0.024, 1); c.translate(0, -0.14, 0);
    const cap = new T.CylinderGeometry(0.018, 0.036, 0.05, 10, 1); cap.translate(0, -0.18, 0);
    const N = 14, L = 0.24 * k, d = new T.CylinderGeometry(0.036, 0.062 + 0.012 * (k - 1), L, N, 4, true); d.translate(0, -0.205 - L / 2, 0);
    const p = d.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), y = p.getY(i), ang = Math.atan2(z, x), strand = Math.round((ang / TAU) * N);
      const groove = strand % 2 ? 0.86 : 1.04; p.setX(i, x * groove); p.setZ(i, z * groove);
      if (y < -0.2 - L + 0.01) p.setY(i, y - 0.035 * Math.abs(Math.sin(strand * 1.7)) * k);
    }
    return merge([a, b, c, cap, d]);
  }
  // the red cord knot that ties two lantern tips together (axis on Y)
  function knotGeo() {
    const parts = [];
    const cord = new T.CylinderGeometry(0.014, 0.014, 0.16, 5, 1); parts.push(cord);
    const bead = new T.IcosahedronGeometry(0.04, 1); bead.scale(1, 0.75, 1); parts.push(bead);
    for (const s of [-1, 1]) {
      const l = new T.TorusGeometry(0.032, 0.011, 4, 10); l.translate(s * 0.052, 0, 0); parts.push(l);
      const w = new T.TorusGeometry(0.03, 0.011, 4, 10); w.rotateX(Math.PI / 2); w.translate(0, s * 0.055, 0); parts.push(w);
    }
    return merge(parts);
  }

  // ---------- assembly ----------
  const root = new T.Group(); root.name = 'envoi';
  const fx = new T.Group(); fx.name = 'envoi-fx';
  const body = new T.Group(); root.add(body);
  const bones = [];
  const bone = (name, parent) => { const b = new T.Bone(); b.name = name; (parent || body).add(b); bones.push(b); return b; };

  // body: 16 lanterns in one instanced draw, smaller toward the tail
  const NSEG = 16;
  const SIZE = [0.9, 1.0, 1.0, 0.97, 0.94, 0.9, 0.86, 0.82, 0.78, 0.74, 0.7, 0.65, 0.6, 0.55, 0.5, 0.45];
  const segG = lanternGeo();
  const aBurn = new T.InstancedBufferAttribute(new Float32Array(NSEG * 2), 2);
  for (let i = 0; i < NSEG; i++) aBurn.setXY(i, 1, 0);
  segG.setAttribute('aBurn', aBurn);
  const segMesh = new T.InstancedMesh(segG, matSeg, NSEG);
  segMesh.frustumCulled = false; body.add(segMesh);
  const segBones = []; for (let i = 0; i < NSEG; i++) segBones.push(bone('seg' + i));

  // red cord knots: one between every two lanterns, one at the neck and one at the tail
  const NKN = NSEG + 1;
  const knots = new T.InstancedMesh(knotGeo(), matRed, NKN); knots.frustumCulled = false; body.add(knots);

  // ---------- the head: one skinned mesh (skull, jaw, horns, frill, brows, lids, seal) ----------
  // Built in head space at its rest pose: +Z along the snout, the neck joint at the origin.
  const headB = bone('head');
  const HS = 1.3; // the head is built at 1/1.3 scale and grown by its bone, so it reads from the battle camera
  const JAW = V3(0, 0.02, -0.02), EYE = [V3(0.282, 0.258, 0.44), V3(-0.282, 0.258, 0.44)], SEALP = V3(0, 0.425, 0.5);
  const jawB = bone('jaw', headB); jawB.position.copy(JAW);
  const lidB = [bone('lidL', headB), bone('lidR', headB)];
  lidB.forEach((b, i) => b.position.set(EYE[i].x * 0.97, EYE[i].y + 0.072, EYE[i].z));
  const sealB = bone('seal', headB); sealB.position.copy(SEALP);
  const HLV = DETAIL >= 0.85 ? 3 : DETAIL >= 0.7 ? 2 : 1;
  function headGeo() {
    const skull = new Soup(HCELLUV, HLV), jaw = new Soup(HCELLUV, HLV), lids = [new Soup(HCELLUV, 1), new Soup(HCELLUV, 1)], seal = new Soup(HCELLUV, 0);
    // the skull: a long folded wedge, ridged on top, flat under the upper jaw
    const sec = (z, h, a, ha, b, yb, c) => ({ z, pts: [[0, h], [a, ha], [b, yb], [c, 0], [-c, 0], [-b, yb], [-a, ha]] });
    loft(skull, [
      sec(-0.12, 0.36, 0.2, 0.31, 0.29, 0.15, 0.22),
      sec(0.12, 0.47, 0.26, 0.4, 0.34, 0.18, 0.26),
      sec(0.42, 0.42, 0.23, 0.35, 0.31, 0.15, 0.24),
      sec(0.72, 0.29, 0.16, 0.24, 0.22, 0.1, 0.17),
      sec(1.0, 0.17, 0.1, 0.14, 0.14, 0.06, 0.11),
      sec(1.24, 0.08, 0.05, 0.065, 0.07, 0.03, 0.055),
      sec(1.4, 0.022, 0.012, 0.018, 0.016, 0.008, 0.012),
    ], 0.05);
    // the snout ridge and nostril folds
    tube(skull, [V3(0, 0.36, 0.72), V3(0, 0.22, 1.02), V3(0, 0.1, 1.32)], [0.035, 0.025, 0], 3, { amp: 0.02 });
    for (const s of [-1, 1]) tube(skull, [V3(0.05 * s, 0.13, 1.18), V3(0.1 * s, 0.16, 1.0), V3(0.12 * s, 0.18, 0.84)], [0.022, 0.026, 0], 3, { amp: 0.02 });
    for (const s of [-1, 1]) {
      // heavy brows: a thick folded plate over each eye, swept back and up into the temple
      tube(skull, [V3(0.07 * s, 0.4, 0.74), V3(0.2 * s, 0.4, 0.56), V3(0.31 * s, 0.42, 0.36), V3(0.38 * s, 0.5, 0.12), V3(0.42 * s, 0.6, -0.08)], [0.03, 0.06, 0.07, 0.05, 0], 4, { flat: 0.42, amp: 0.03, phase: Math.PI / 4 });
      // long swept horns from the top of the skull, and a second, shorter pair outside them
      tube(skull, [V3(0.12 * s, 0.44, 0.08), V3(0.2 * s, 0.68, -0.22), V3(0.32 * s, 0.98, -0.66), V3(0.44 * s, 1.24, -1.14), V3(0.52 * s, 1.36, -1.42)], [0.085, 0.07, 0.05, 0.025, 0], 4, { phase: Math.PI / 4, amp: 0.03 });
      tube(skull, [V3(0.24 * s, 0.4, 0.06), V3(0.42 * s, 0.6, -0.28), V3(0.62 * s, 0.82, -0.72), V3(0.74 * s, 0.92, -0.98)], [0.06, 0.045, 0.02, 0], 4, { phase: Math.PI / 4, amp: 0.03 });
      // layered cheek plates
      for (let k = 0; k < 3; k++) tube(skull, [V3(0.22 * s, 0.06 + k * 0.05, 0.66 - k * 0.2), V3(0.31 * s, 0.07 + k * 0.05, 0.44 - k * 0.2), V3(0.38 * s, 0.05 + k * 0.05, 0.2 - k * 0.22)], [0.05, 0.04, 0], 4, { flat: 0.3, amp: 0.03, phase: Math.PI / 4 });
      // upper teeth
      for (let k = 0; k < 6; k++) { const z = 0.36 + k * 0.15, x = (0.2 - k * 0.026) * s; tube(skull, [V3(x, 0.01, z), V3(x * 0.96, -0.075 + k * 0.005, z + 0.02)], [0.02, 0], 3, { amp: 0 }); }
    }
    // the frill: three rings of paper blades fanned out behind the skull, their tips scorched orange to red
    const FC = V3(0, 0.2, -0.08);
    const RINGS = [[9, 2.3, 0.56, 0.3, 0.0, 0.07, 0.62], [11, 2.55, 0.78, 0.26, -0.06, 0.08, 0.78], [13, 2.8, 1.0, 0.2, -0.12, 0.088, 0.92]];
    for (const [n, spread, L0, r0, z0, wid, back] of RINGS) {
      for (let k = 0; k < n; k++) {
        const a = -spread + (k / (n - 1)) * spread * 2, dirx = Math.sin(a), diry = Math.cos(a);
        const L = L0 * (0.82 + 0.18 * Math.cos(a * 0.8)) * rr(0.9, 1.08);
        const base = V3(FC.x + dirx * r0, FC.y + diry * r0 * 0.85, FC.z + z0);
        const tip = V3(FC.x + dirx * (0.26 + L * 0.62), FC.y + diry * (0.2 + L * 0.56), FC.z - 0.2 - L * back);
        blade(skull, base, tip, V3(diry, -dirx, 0), wid, 0.025, 0.03);
      }
    }
    // cheek fins sweeping back from the jaw corners, scorched like the frill
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) {
      const base = V3(0.3 * s, 0.1 - k * 0.07, 0.18 - k * 0.06), tip = V3((0.62 + k * 0.06) * s, -0.02 - k * 0.12, -0.32 - k * 0.12);
      blade(skull, base, tip, V3(0, 1, 0), 0.06, 0.02, 0.03);
    }
    // the lower jaw
    const jsec = (z, c, b2, d1, d) => ({ z, pts: [[c, 0], [b2, -d1], [0, -d], [-b2, -d1], [-c, 0]] });
    loft(jaw, [jsec(-0.05, 0.22, 0.18, 0.11, 0.17), jsec(0.38, 0.21, 0.16, 0.1, 0.15), jsec(0.78, 0.14, 0.1, 0.07, 0.1), jsec(1.14, 0.055, 0.035, 0.03, 0.035), jsec(1.28, 0.012, 0.008, 0.006, 0.008)], 0.05);
    for (const s of [-1, 1]) {
      for (let k = 0; k < 5; k++) { const z = 0.42 + k * 0.15, x = (0.18 - k * 0.025) * s; jaw.lv = 0; tube(jaw, [V3(x, -0.005, z), V3(x * 0.95, 0.065, z + 0.02)], [0.018, 0], 3, { amp: 0 }); jaw.lv = HLV; }
      tube(jaw, [V3(0.13 * s, -0.12, 0.56), V3(0.19 * s, -0.13, 0.32), V3(0.24 * s, -0.12, 0.06)], [0.02, 0.032, 0], 4, { flat: 0.4, amp: 0.03 });
    }
    // eyelids: a paper flap over each eye, built closed; the lid bones squash them up under the brow to open
    EYE.forEach((e, i) => {
      const s = i ? -1 : 1, hinge = V3(e.x * 0.97, e.y + 0.072, e.z), out = V3(0.85 * s, 0.32, 0.4).normalize();
      const f = V3(0, 0.1, 1).normalize(), lo = e.clone().addScaledVector(out, 0.045).add(V3(0, -0.07, 0));
      const p0 = hinge.clone().addScaledVector(f, 0.165).addScaledVector(out, 0.04), p1 = hinge.clone().addScaledVector(f, -0.165).addScaledVector(out, 0.04);
      facet(lids[i], p0, p1, lo, e.clone().addScaledVector(out, -0.2), 0.02);
    });
    // the seal: a thick disc of wax with a wavy rim, on the brow
    {
      const n = V3(0, 0.82, 0.57).normalize(), t1 = V3(1, 0, 0), t2 = V3().crossVectors(n, t1).normalize(), R = 0.19, N = 28;
      const rim = [], top = [];
      for (let i = 0; i < N; i++) {
        const a = (i / N) * TAU, r = R * (0.95 + 0.04 * Math.sin(a * 9));
        const p = SEALP.clone().addScaledVector(t1, Math.cos(a) * r).addScaledVector(t2, Math.sin(a) * r);
        rim.push(p.clone().addScaledVector(n, -0.02)); top.push(p.clone().addScaledVector(n, 0.03));
      }
      const ctr = SEALP.clone().addScaledVector(n, 0.045), inner = SEALP.clone().addScaledVector(n, -0.05);
      for (let i = 0; i < N; i++) {
        const j = (i + 1) % N, a0 = (i / N) * TAU, a1 = (j / N) * TAU;
        facet(seal, ctr, top[i], top[j], inner, 0, [sealUV(0, 0), sealUV(Math.cos(a0) * 0.96, Math.sin(a0) * 0.96), sealUV(Math.cos(a1) * 0.96, Math.sin(a1) * 0.96)]);
        const e0 = sealUV(Math.cos(a0) * 0.99, Math.sin(a0) * 0.99), e1 = sealUV(Math.cos(a1) * 0.99, Math.sin(a1) * 0.99);
        facet(seal, top[i], rim[i], rim[j], ctr.clone().addScaledVector(n, -0.04), 0, [e0, e0, e1]);
        facet(seal, top[i], rim[j], top[j], ctr.clone().addScaledVector(n, -0.04), 0, [e0, e1, e1]);
      }
    }
    return merge([{ geo: skull.geo(), bone: 0 }, { geo: jaw.geo(), bone: 1 }, { geo: lids[0].geo(), bone: 2 }, { geo: lids[1].geo(), bone: 3 }, { geo: seal.geo(), bone: 4 }]);
  }
  body.updateMatrixWorld(true);
  const headGeom = skinAttrs(headGeo());
  const headMesh = new T.SkinnedMesh(headGeom, matHead); headMesh.frustumCulled = false; body.add(headMesh);
  headMesh.bind(new T.Skeleton([headB, jawB, lidB[0], lidB[1], sealB]));
  // the eyes ride on the head bone; the lids close over them
  const eyeGeo = (() => {
    const parts = [];
    EYE.forEach((e, i) => {
      const s = i ? -1 : 1, out = V3(0.85 * s, 0.32, 0.4).normalize(), f = V3(0, 0.1, 1).normalize(), up = V3().crossVectors(f, out).multiplyScalar(s).normalize();
      const pos = [], uv = [], N = 12, ctr = e.clone().addScaledVector(out, 0.045);
      const P = [];
      for (let k = 0; k < N; k++) { const a = (k / N) * TAU, x = Math.cos(a), y = Math.sin(a) * 0.5 * Math.pow(1 - x * x * 0.55, 0.6); P.push([x, y]); }
      for (let k = 0; k < N; k++) {
        const q = P[k], r = P[(k + 1) % N];
        const pa = e.clone().addScaledVector(f, q[0] * 0.14).addScaledVector(up, q[1] * 0.14), pb = e.clone().addScaledVector(f, r[0] * 0.14).addScaledVector(up, r[1] * 0.14);
        pos.push(ctr.x, ctr.y, ctr.z, pa.x, pa.y, pa.z, pb.x, pb.y, pb.z);
        uv.push(0.5, 0.5, 0.5 + q[0] * 0.5 * s, 0.5 + q[1], 0.5 + r[0] * 0.5 * s, 0.5 + r[1]);
      }
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); parts.push(g);
    });
    return merge(parts);
  })();
  const eyes = new T.Mesh(eyeGeo, matEye); eyes.material.side = T.DoubleSide; headB.add(eyes);
  const mouthGlow = new T.Mesh(new T.PlaneGeometry(0.24, 0.85), matMouth); mouthGlow.rotation.x = -Math.PI / 2; mouthGlow.position.set(0, -0.03, 0.62); jawB.add(mouthGlow);

  // ---------- wings: pleated paper fans on tan ribs, rebuilt from a spread value each frame (small buffers) ----------
  const PL = 14, NL = PL * 2, KB = DETAIL >= 0.85 ? 7 : 4; // pleats, fold lines, radial bands
  const WTRI = NL * 2 * KB, NRIB = PL + 1;
  function makeWing(s) {
    const b = bone(s > 0 ? 'wingL' : 'wingR');
    const roll = new T.Group(); b.add(roll);
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(new Float32Array(WTRI * 9), 3));
    g.setAttribute('normal', new T.BufferAttribute(new Float32Array(WTRI * 9).fill(0.5), 3));
    const uv = new Float32Array(WTRI * 6); let o = 0;
    const put = (...q) => { for (const v of q) uv[o++] = v; };
    const r = (k) => (k / KB) * 0.86;
    for (let j = 0; j < NL; j++) {
      const va = j / NL, vb = (j + 1) / NL, vm = (j + 0.5) / NL, ta = j % 2 ? 0.93 : 1, tb = j % 2 ? 1 : 0.93;
      put(0.01, vm, r(1), va, r(1), vb);
      for (let k = 1; k < KB - 1; k++) { put(r(k), va, r(k + 1), va, r(k + 1), vb); put(r(k), va, r(k + 1), vb, r(k), vb); }
      put(r(KB - 1), va, ta, va, 0.86, vm); put(r(KB - 1), va, 0.86, vm, r(KB - 1), vb); put(r(KB - 1), vb, 0.86, vm, tb, vb);
    }
    g.setAttribute('uv', new T.BufferAttribute(uv, 2));
    const m = new T.Mesh(g, matWing); m.frustumCulled = false; roll.add(m);
    const rg = new T.BufferGeometry();
    rg.setAttribute('position', new T.BufferAttribute(new Float32Array(NRIB * 4 * 9), 3));
    rg.setAttribute('normal', new T.BufferAttribute(new Float32Array(NRIB * 4 * 9), 3));
    const ribs = new T.Mesh(rg, matRib); ribs.frustumCulled = false; roll.add(ribs);
    const jag = []; for (let j = 0; j <= NL; j++) jag.push(rr(0.95, 1.06));
    return { s, b, roll, g, m, rg, ribs, jag, tips: [] };
  }
  const wings = [makeWing(1), makeWing(-1)];
  const WING_L = 3.45, TH0 = -0.5, SPAN_MAX = 2.45, ALPHA = (SPAN_MAX / NL) * 1.06;
  function updateWing(w, spread) {
    const span = lerp(0.3, SPAN_MAX, spread), d = span / NL;
    const foldK = 0.5 * Math.sqrt(Math.max(0, ALPHA * ALPHA - d * d));
    const pos = w.g.attributes.position.array, E = w.E || (w.E = []), TH = w.TH || (w.TH = []);
    for (let j = 0; j <= NL; j++) {
      const th = TH0 + span * (j / NL), f = j / NL;
      let len = WING_L * (0.6 + 0.4 * Math.sin(Math.PI * (0.16 + f * 0.8))) * w.jag[j];
      if (j % 2) len *= 0.8;
      E[j] = E[j] || [0, 0, 0]; E[j][0] = j % 2 ? -foldK * len * w.s : 0; E[j][1] = Math.sin(th) * len; E[j][2] = -Math.cos(th) * len; TH[j] = th;
    }
    w.tips = E;
    let o = 0;
    const tri = (ax, ay, az, bx, by, bz, cx, cy, cz) => { pos[o++] = ax; pos[o++] = ay; pos[o++] = az; pos[o++] = bx; pos[o++] = by; pos[o++] = bz; pos[o++] = cx; pos[o++] = cy; pos[o++] = cz; };
    const rk = (k) => (k / KB) * 0.86;
    for (let j = 0; j < NL; j++) {
      const a = E[j], b = E[j + 1];
      const nx = (a[0] + b[0]) * 0.43, ny = (a[1] + b[1]) * 0.43, nz = (a[2] + b[2]) * 0.43;
      let r0 = rk(1);
      tri(0, 0, 0, a[0] * r0, a[1] * r0, a[2] * r0, b[0] * r0, b[1] * r0, b[2] * r0);
      for (let k = 1; k < KB - 1; k++) {
        const p = rk(k), q = rk(k + 1);
        tri(a[0] * p, a[1] * p, a[2] * p, a[0] * q, a[1] * q, a[2] * q, b[0] * q, b[1] * q, b[2] * q);
        tri(a[0] * p, a[1] * p, a[2] * p, b[0] * q, b[1] * q, b[2] * q, b[0] * p, b[1] * p, b[2] * p);
      }
      r0 = rk(KB - 1);
      const a1x = a[0] * r0, a1y = a[1] * r0, a1z = a[2] * r0, b1x = b[0] * r0, b1y = b[1] * r0, b1z = b[2] * r0;
      tri(a1x, a1y, a1z, a[0], a[1], a[2], nx, ny, nz); tri(a1x, a1y, a1z, nx, ny, nz, b1x, b1y, b1z); tri(b1x, b1y, b1z, nx, ny, nz, b[0], b[1], b[2]);
    }
    w.g.attributes.position.needsUpdate = true;
    // ribs along every ridge: a cross-shaped stick so it reads from any angle; the outer guard sticks run full length
    const rp = w.rg.attributes.position.array, rn = w.rg.attributes.normal.array; o = 0; let q = 0;
    for (let j = 0; j <= NL; j += 2) {
      const e = E[j], th = TH[j], guard = j === 0 || j === NL, r1 = guard ? 0.97 : 0.62, wd = guard ? 0.026 : 0.011;
      const t0 = 0, t1 = Math.cos(th) * wd, t2 = Math.sin(th) * wd, nx = wd * 0.9;
      const p0x = e[0] * 0.02, p0y = e[1] * 0.02, p0z = e[2] * 0.02, p1x = e[0] * r1, p1y = e[1] * r1, p1z = e[2] * r1;
      for (let m = 0; m < 2; m++) {
        const dx = m ? nx : t0, dy = m ? 0 : t1, dz = m ? 0 : t2, n0 = m ? 0 : 1, n1 = m ? -Math.sin(th) : 0, n2 = m ? Math.cos(th) : 0;
        const V = [p0x + dx, p0y + dy, p0z + dz, p0x - dx, p0y - dy, p0z - dz, p1x + dx * 0.6, p1y + dy * 0.6, p1z + dz * 0.6, p0x - dx, p0y - dy, p0z - dz, p1x - dx * 0.6, p1y - dy * 0.6, p1z - dz * 0.6, p1x + dx * 0.6, p1y + dy * 0.6, p1z + dz * 0.6];
        for (let v = 0; v < 18; v++) rp[o++] = V[v];
        for (let v = 0; v < 6; v++) { rn[q++] = n0; rn[q++] = n1; rn[q++] = n2; }
      }
    }
    w.rg.attributes.position.needsUpdate = true; w.rg.attributes.normal.needsUpdate = true;
  }

  // ---------- spine poses: control points from the head (0) to the tail, plus the head direction ----------
  const NC = 12;
  // idle, after summon scene A: the neck drops from the head to the ground, then the body runs back low around its right
  // side in a long sweep and the tail lifts at the end. Its right faces the bench camera, so the whole sweep shows.
  const P_IDLE = [[0.92, 4.15, 1.25], [0.79, 3.25, 1.56], [0.53, 2.35, 1.71], [0.21, 1.5, 1.66], [-0.17, 0.88, 1.34], [-0.66, 0.66, 0.76], [-1.09, 0.6, 0.09], [-1.33, 0.6, -0.63], [-1.25, 0.62, -1.31], [-0.81, 0.68, -1.78], [-0.2, 0.9, -1.9], [0.4, 1.45, -1.62]];
  // the seal break (sheets, panel 3): the neck rears up and the head is thrown back
  const P_REAR = [[0.62, 5.25, 0.62], [0.7, 4.25, 1.05], [0.56, 3.2, 1.42], [0.28, 2.12, 1.6], [-0.12, 1.12, 1.4], [-0.66, 0.7, 0.76], [-1.09, 0.6, 0.09], [-1.33, 0.6, -0.63], [-1.25, 0.62, -1.31], [-0.81, 0.68, -1.78], [-0.2, 0.9, -1.9], [0.4, 1.45, -1.62]];
  const mkPose = () => ({ pts: Array.from({ length: NC }, () => V3()), head: V3(0, 0, 1), spread: 0.7, flap: 0.1, jaw: 0.05, ward: 0 });
  function setPts(pose, arr, t, sway) {
    for (let i = 0; i < NC; i++) {
      const f = i / (NC - 1);
      pose.pts[i].set(arr[i][0] + Math.sin(t * 1.1 - i * 0.7) * sway * (0.3 + f), arr[i][1] + Math.sin(t * 1.45 - i * 0.62) * 0.07 * sway / 0.22 + Math.sin(t * 0.9) * 0.08, arr[i][2] + Math.cos(t * 0.8 - i * 0.5) * sway * 0.25 * f);
    }
  }
  function poseIdle(p, t, walk) {
    setPts(p, P_IDLE, t * (1 + walk * 0.8), 0.2 + walk * 0.1);
    p.head.set(Math.sin(t * 0.7) * 0.14, -0.14 - walk * 0.1, 1); p.spread = 0.86; p.flap = 0.1 + walk * 0.12; p.jaw = 0.06 + Math.max(0, Math.sin(t * 0.5)) * 0.06; p.ward = 0;
    if (walk > 0) for (let i = 0; i < NC; i++) p.pts[i].z += walk * 0.35 * (1 - i / NC);
  }
  function poseRear(p, t) { setPts(p, P_REAR, t, 0.1); p.head.set(0, 0.62, 0.78); p.spread = 1; p.flap = 0.32; p.jaw = 0.25; p.ward = 0; }
  // the Folding Ward (sheets, panel 4): the body coiled low into a tight ring with the head in front of it and the fans
  // raised behind it as a wall
  function poseCoil(p, t) {
    const R = 1.12, cz = 0.25;
    p.pts[0].set(0.1, 2.2 + Math.sin(t * 0.9) * 0.05, 1.82);
    p.pts[1].set(0.02, 1.5, 1.62);
    for (let i = 2; i < NC; i++) {
      const a = -0.25 - (i - 2) * 0.7 + Math.sin(t * 0.8 - i * 0.5) * 0.03, rr0 = R * (1 - (i - 2) * 0.012);
      p.pts[i].set(Math.sin(a) * rr0, 0.62 + (i - 2) * 0.055 + Math.sin(t * 1.1 - i) * 0.03, cz + Math.cos(a) * rr0);
    }
    p.head.set(0, -0.2, 1); p.spread = 1; p.flap = 0.03; p.jaw = 0.12; p.ward = 1;
  }
  // a blow: the front of the body is thrown back and up, the head tosses, the jaw opens; added onto the pose it plays in
  function recoil(p, k) {
    if (k < 0.001) return;
    for (let i = 0; i < NC; i++) { const f = 1 - i / NC; p.pts[i].z -= 0.5 * f * k; p.pts[i].y += 0.25 * f * k; p.pts[i].x += 0.18 * f * k; }
    p.head.y += 0.55 * k; p.head.x += 0.3 * k; p.spread = lerp(p.spread, 0.5, k); p.flap = lerp(p.flap, 0.35, k); p.jaw = lerp(p.jaw, 0.6, k);
  }
  // Where the foe stands, in the root's space: REACH ahead along aim (radians from +Z). aim comes from state.target when
  // the game gives one, so the strike wraps the foe even when the summon is turned a little away from it.
  let REACH = 4.5, aim = 0, wrapW = 0, headTurn = 0;
  const CENTER = V3(0, 0, 4.5), _tl = V3();
  // the strike (sheets, panels 6 and 7; strike scene B): the body rings the foe low, the neck rises from the ring's near
  // side and the head hangs over it, looking down into the middle
  function poseHelix(p, t) {
    const R = 1.6, spin = t * 0.2, c = Math.cos(aim), s = Math.sin(aim);
    const put = (o, x, y, z) => o.set(x * c + z * s, y, -x * s + z * c);
    put(p.pts[0], 0.15 + Math.sin(spin * 0.5) * 0.15, 4.0, REACH - R * 0.55);
    put(p.pts[1], 0.42, 3.05, REACH - R - 0.25);
    put(p.pts[2], 0.3, 2.0, REACH - R - 0.2);
    for (let i = 3; i < NC; i++) {
      const a = Math.PI + 0.42 - (i - 3) * 0.8 + spin;
      put(p.pts[i], Math.sin(a) * R, 1.2 - (i - 3) * 0.04 + Math.sin(t * 1.2 - i) * 0.05, REACH + Math.cos(a) * R);
    }
    _a.subVectors(CENTER, p.pts[0]); _a.y = -1.6; p.head.copy(_a).normalize();
    p.spread = 1; p.flap = 0.22; p.jaw = 0.3; p.ward = 0;
  }
  function blendPose(o, a, b, w) {
    if (w <= 0) { if (o !== a) copyPose(o, a); return o; }
    for (let i = 0; i < NC; i++) o.pts[i].lerpVectors(a.pts[i], b.pts[i], w);
    o.head.lerpVectors(a.head, b.head, w);
    for (const k of ['spread', 'flap', 'jaw', 'ward']) o[k] = lerp(a[k], b[k], w);
    return o;
  }
  function copyPose(o, a) { for (let i = 0; i < NC; i++) o.pts[i].copy(a.pts[i]); o.head.copy(a.head); for (const k of ['spread', 'flap', 'jaw', 'ward']) o[k] = a[k]; return o; }

  // Catmull-Rom sampled into a polyline, then lanterns placed by arc length
  const NS = 84, samp = Array.from({ length: NS }, () => V3()), sLen = new Float32Array(NS);
  const _a = V3();
  function crPoint(out, p0, p1, p2, p3, t) {
    const t2 = t * t, t3 = t2 * t;
    return out.set(0, 0, 0)
      .addScaledVector(p0, -0.5 * t3 + t2 - 0.5 * t)
      .addScaledVector(p1, 1.5 * t3 - 2.5 * t2 + 1)
      .addScaledVector(p2, -1.5 * t3 + 2 * t2 + 0.5 * t)
      .addScaledVector(p3, 0.5 * t3 - 0.5 * t2);
  }
  function sampleSpine(pts) {
    for (let k = 0; k < NS; k++) {
      const f = (k / (NS - 1)) * (NC - 1), i = Math.min(NC - 2, Math.floor(f)), t = f - i;
      crPoint(samp[k], pts[Math.max(0, i - 1)], pts[i], pts[i + 1], pts[Math.min(NC - 1, i + 2)], t);
      sLen[k] = k ? sLen[k - 1] + samp[k].distanceTo(samp[k - 1]) : 0;
    }
  }
  function atArc(d, outP, outT) {
    let k = 1; while (k < NS - 1 && sLen[k] < d) k++;
    const L0 = sLen[k - 1], L1 = sLen[k], f = L1 > L0 ? cl((d - L0) / (L1 - L0), 0, 1.5) : 0;
    outP.lerpVectors(samp[k - 1], samp[k], f);
    if (d > sLen[NS - 1]) outP.addScaledVector(_a.subVectors(samp[NS - 1], samp[NS - 2]).normalize(), d - sLen[NS - 1]);
    if (outT) outT.subVectors(samp[k], samp[k - 1]).normalize();
  }
  const GAP = 0.05;
  const SEG_D = []; { let d = 0.34 + LH * SIZE[0]; for (let i = 0; i < NSEG; i++) { SEG_D.push(d); d += LH * (SIZE[i] + (SIZE[i + 1] || SIZE[i])) + GAP; } }
  const KNOT_D = []; for (let i = 0; i <= NSEG; i++) KNOT_D.push(i === 0 ? SEG_D[0] - LH * SIZE[0] - GAP * 0.5 : SEG_D[i - 1] + LH * SIZE[i - 1] + GAP * 0.5);
  const segPos = Array.from({ length: NSEG }, () => V3()), segTan = Array.from({ length: NSEG }, () => V3()), knotPos = Array.from({ length: NKN }, () => V3()), knotTan = Array.from({ length: NKN }, () => V3());
  const tailTip = V3(), tailDir = V3();
  const _m = new T.Matrix4(), _q = new T.Quaternion(), _s = V3(), _x = V3(), _y = V3(), _z = V3(), _q2 = new T.Quaternion();
  function basisQuat(out, fwd, up) { // z = fwd
    _z.copy(fwd).normalize(); _x.crossVectors(up, _z); if (_x.lengthSq() < 1e-6) _x.set(1, 0, 0); _x.normalize(); _y.crossVectors(_z, _x);
    _m.makeBasis(_x, _y, _z); return out.setFromRotationMatrix(_m);
  }
  function axisQuat(out, axis, i) { // y = axis, with a stable lateral x
    _y.copy(axis).normalize(); _s.set(Math.abs(_y.x) < 0.85 ? 1 : 0, 0, Math.abs(_y.x) < 0.85 ? 0 : 1);
    _x.copy(_s).addScaledVector(_y, -_y.dot(_s)).normalize(); _z.crossVectors(_x, _y);
    _m.makeBasis(_x, _y, _z); out.setFromRotationMatrix(_m);
    return out.multiply(_q2.setFromAxisAngle(UP, (i % 3) * (TAU / 15)));
  }
  // body frame at a lantern, for the wings: faces the heading, stays upright
  const _hd = V3(), _fh = V3();
  function bodyFrame(out, k, pose) {
    _hd.set(pose.head.x, 0, pose.head.z); if (_hd.lengthSq() < 1e-4) _hd.set(0, 0, 1); _hd.normalize();
    _fh.subVectors(segPos[Math.max(0, k - 1)], segPos[Math.min(NSEG - 1, k + 1)]).setY(0);
    const w = 1 - pose.ward;
    if (_fh.lengthSq() > 1e-4) _fh.normalize().multiplyScalar(0.18 * w); else _fh.set(0, 0, 0);
    _hd.multiplyScalar(0.55 + 0.45 * pose.ward).add(_fh);
    return basisQuat(out, _hd, UP);
  }

  // ---------- world-space secondary motion (fx group) ----------
  const _w = V3(), _w2 = V3(), _w3 = V3(), _qa = new T.Quaternion(), DOWN = V3(0, -1, 0);
  const H = 1 / 120;
  // tassels hang from every joint, the jaw and cheeks, the wing roots and the tail
  const NJT = NSEG - 1, NTAS = NJT + 4 + 2 + 2;
  const tasMesh = new T.InstancedMesh(tasselGeo(), matRed, NTAS); tasMesh.frustumCulled = false; fx.add(tasMesh);
  const tas = [];
  for (let i = 0; i < NTAS; i++) { const L = rr(0.26, 0.32); tas.push({ a: V3(), p: V3(0, -L, 0), q: V3(0, -L, 0), L, sc: rr(0.92, 1.08), vis: 1, init: false }); }
  function pendStep(o, g, wind, damp) {
    const vx = (o.p.x - o.q.x) * (1 - damp * H), vy = (o.p.y - o.q.y) * (1 - damp * H), vz = (o.p.z - o.q.z) * (1 - damp * H);
    o.q.copy(o.p);
    o.p.x += vx + wind.x * H * H; o.p.y += vy + (wind.y - g) * H * H; o.p.z += vz + wind.z * H * H;
    _w.subVectors(o.p, o.a); const d = _w.length() || 1; o.p.copy(o.a).addScaledVector(_w, o.L / d);
  }
  // jaw and cheek tassels, in head space
  const HEADTAS = [V3(0.36, 0.0, 0.12), V3(-0.36, 0.0, 0.12), V3(0.17, -0.15, 0.42), V3(-0.17, -0.15, 0.42)];

  // the heart lantern hangs under the chin on its cord
  const THROAT = V3(0, -0.16, 0.32);
  const heart = new T.Group(); fx.add(heart);
  const heartBody = new T.Mesh(heartGeo(), matHeart), heartRed = new T.Mesh(heartRedGeo(), matRed);
  heart.add(heartBody, heartRed);
  const cordG = new T.CylinderGeometry(0.013, 0.013, 1, 5, 1); cordG.translate(0, 0.5, 0);
  const cord = new T.Mesh(cordG, matRed); fx.add(cord);
  const heartP = { a: V3(), p: V3(), q: V3(), L: 0.42, init: false };
  const heartLight = new T.PointLight(0xffb45a, 0, 8, 2); fx.add(heartLight);

  // golden whiskers: two long barbels from the snout, as verlet chains that trail and curl, drawn as one tube mesh
  const WN = 13, WSIDES = 3;
  const whRest = [1, -1].map((s) => [V3(0.1 * s, 0.05, 1.08), V3(0.26 * s, 0.02, 1.0), V3(0.44 * s, -0.1, 0.85), V3(0.55 * s, -0.32, 0.62), V3(0.56 * s, -0.55, 0.36), V3(0.5 * s, -0.72, 0.08), V3(0.56 * s, -0.84, -0.2), V3(0.7 * s, -0.9, -0.42)]);
  const whisk = whRest.map((rest) => {
    const nodes = [], restPts = [];
    // resample the rest curve into WN nodes
    const cum = [0]; for (let i = 1; i < rest.length; i++) cum.push(cum[i - 1] + rest[i].distanceTo(rest[i - 1]));
    const L = cum[cum.length - 1];
    for (let k = 0; k < WN; k++) {
      const d = (k / (WN - 1)) * L; let i = 1; while (i < rest.length - 1 && cum[i] < d) i++;
      restPts.push(V3().lerpVectors(rest[i - 1], rest[i], cl((d - cum[i - 1]) / (cum[i] - cum[i - 1]), 0, 1)));
      nodes.push({ p: V3(), q: V3() });
    }
    return { nodes, rest: restPts, seg: L / (WN - 1), init: false };
  });
  const whG = new T.BufferGeometry();
  const whPos = new Float32Array(2 * WN * WSIDES * 3), whNor = new Float32Array(2 * WN * WSIDES * 3), whIdx = [];
  for (let s = 0; s < 2; s++) for (let k = 0; k < WN - 1; k++) for (let i = 0; i < WSIDES; i++) {
    const a = (s * WN + k) * WSIDES + i, b = (s * WN + k) * WSIDES + ((i + 1) % WSIDES), c = a + WSIDES, d = b + WSIDES;
    whIdx.push(a, c, b, b, c, d);
  }
  whG.setAttribute('position', new T.BufferAttribute(whPos, 3)); whG.setAttribute('normal', new T.BufferAttribute(whNor, 3)); whG.setIndex(whIdx);
  const whMesh = new T.Mesh(whG, matGold); whMesh.frustumCulled = false; fx.add(whMesh);

  // tail streamers: 9 paper strips as verlet chains, drawn as one ribbon mesh
  const NST = 9, NN = 12;
  const strips = [];
  for (let s = 0; s < NST; s++) {
    const L = rr(0.13, 0.18), nodes = [];
    for (let n = 0; n < NN; n++) nodes.push({ p: V3(0, -n * L, 0), q: V3(0, -n * L, 0) });
    strips.push({ L, nodes, w: rr(0.2, 0.27), tw: rr(-1, 1), row: s % 4, off: V3(Math.cos((s / NST) * TAU) * 0.07, 0, Math.sin((s / NST) * TAU) * 0.07), init: false });
  }
  const stG = new T.BufferGeometry();
  const stPos = new Float32Array(NST * NN * 2 * 3), stUV = new Float32Array(NST * NN * 2 * 2), stIdx = [];
  for (let s = 0; s < NST; s++) for (let n = 0; n < NN; n++) {
    const v = (s * NN + n) * 2, row = strips[s].row;
    stUV.set([n / (NN - 1), 1 - (row * 64 + 4) / 256, n / (NN - 1), 1 - (row * 64 + 60) / 256], v * 2);
    if (n < NN - 1) stIdx.push(v, v + 1, v + 2, v + 1, v + 3, v + 2);
  }
  stG.setAttribute('position', new T.BufferAttribute(stPos, 3)); stG.setAttribute('uv', new T.BufferAttribute(stUV, 2)); stG.setIndex(stIdx);
  stG.setAttribute('normal', new T.BufferAttribute(new Float32Array(stPos.length), 3));
  const stMesh = new T.Mesh(stG, matStream); stMesh.frustumCulled = false; fx.add(stMesh);
  // small paper tags tied to the strips on red strings
  const tagG = new T.PlaneGeometry(0.1, 0.2); tagG.translate(0, -0.15, 0);
  const tagCord = new T.BoxGeometry(0.008, 0.06, 0.008); tagCord.translate(0, -0.02, 0);
  { const u = tagCord.attributes.uv; for (let i = 0; i < u.count; i++) u.setXY(i, 0.04, 0.97); }
  const NTAG = 6, tagMesh = new T.InstancedMesh(merge([tagG, tagCord]), matTag, NTAG); tagMesh.frustumCulled = false; fx.add(tagMesh);
  const tags = []; for (let i = 0; i < NTAG; i++) tags.push({ strip: [0, 2, 3, 5, 6, 8][i], node: 4 + (i % 3), a: V3(), p: V3(), q: V3(), L: 0.12, yaw: rr(0, TAU), init: false });

  // particles: glow halos, embers, letters, seal shards
  const _dbs = new T.Vector2();
  function pointPool(n, map) {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('size', new T.BufferAttribute(new Float32Array(n), 1));
    g.setAttribute('col', new T.BufferAttribute(new Float32Array(n * 4), 4));
    const m = pointsMat(map), pts = new T.Points(g, m); pts.frustumCulled = false;
    pts.onBeforeRender = (r, sc, cam) => { r.getDrawingBufferSize(_dbs); m.uniforms.scale.value = cam.isPerspectiveCamera ? _dbs.y / (2 * Math.tan((cam.fov * Math.PI) / 360)) * (cam.view && cam.view.enabled ? cam.view.fullHeight / cam.view.height : 1) : _dbs.y / 2; };
    fx.add(pts); return { g, pts, n, pos: g.attributes.position, size: g.attributes.size, col: g.attributes.col };
  }
  const GLOW = pointPool(26); // 0-15 lanterns, 16 heart, 17-18 eyes, 19 mouth, 20 seal flash, 21 burst, 22-23 wing roots, 24-25 frill
  function setGlow(i, p, size, r, g, b, a) { GLOW.pos.setXYZ(i, p.x, p.y, p.z); GLOW.size.setX(i, size); GLOW.col.setXYZW(i, r, g, b, a); }
  // flames: teardrops that lick up from every burning lantern, three to a lantern, and from the head and wings as they go
  const flameTex = tex(128, 128, (g) => {
    g.translate(64, 92);
    const drop = (k, col) => { g.save(); g.scale(k, k); g.beginPath(); g.moveTo(0, -86); g.bezierCurveTo(14, -48, 34, -24, 32, 2); g.bezierCurveTo(30, 30, -30, 30, -32, 2); g.bezierCurveTo(-34, -24, -14, -48, 0, -86); g.closePath(); g.fillStyle = col; g.fill(); g.restore(); };
    drop(1.0, 'rgba(255,70,16,0.35)'); drop(0.86, 'rgba(255,110,24,0.55)'); drop(0.7, 'rgba(255,160,46,0.8)'); drop(0.52, 'rgba(255,214,112,0.95)'); drop(0.32, 'rgba(255,246,214,1)');
  });
  const NFL = NSEG * 3 + 8, FLAME = pointPool(NFL, flameTex);
  function setFlame(i, p, size, a) { FLAME.pos.setXYZ(i, p.x, p.y, p.z); FLAME.size.setX(i, size); FLAME.col.setXYZW(i, 1, 0.8, 0.6, a); }
  const EMB = pointPool(220), emb = []; for (let i = 0; i < EMB.n; i++) emb.push({ p: V3(), v: V3(), life: 0, max: 1, s: 0.05, hot: 1 });
  let embNext = 0;
  function ember(p, v, life, s, hot) { const e = emb[embNext]; embNext = (embNext + 1) % emb.length; e.p.copy(p); e.v.copy(v); e.life = e.max = life; e.s = s; e.hot = hot == null ? 1 : hot; }
  const NLET = 60, letMesh = new T.InstancedMesh(new T.PlaneGeometry(0.22, 0.165), matLetter, NLET); letMesh.frustumCulled = false; fx.add(letMesh);
  letMesh.instanceColor = new T.InstancedBufferAttribute(new Float32Array(NLET * 3).fill(1), 3);
  const lets = []; for (let i = 0; i < NLET; i++) lets.push({ p: V3(), v: V3(), ax: V3(1, 0, 0), ang: 0, spin: 0, life: 0, max: 1, s: 1, ash: 0, drag: 1 });
  let letNext = 0;
  function letter(p, v, life, ash, s, drag) { const l = lets[letNext]; letNext = (letNext + 1) % NLET; l.p.copy(p); l.v.copy(v); l.life = l.max = life; l.ash = ash; l.s = s || 1; l.drag = drag == null ? 1.2 : drag; l.ax.set(rr(-1, 1), rr(-1, 1), rr(-1, 1)).normalize(); l.ang = rr(0, TAU); l.spin = rr(-7, 7); }
  const shardG = new T.BufferGeometry(); shardG.setAttribute('position', new T.Float32BufferAttribute([0, 0.05, 0, -0.045, -0.035, 0.006, 0.05, -0.03, -0.006], 3)); shardG.computeVertexNormals();
  const NSH = 14, shMesh = new T.InstancedMesh(shardG, matShard, NSH); shMesh.frustumCulled = false; fx.add(shMesh);
  const shards = []; for (let i = 0; i < NSH; i++) shards.push({ p: V3(), v: V3(), ax: V3(0, 1, 0), ang: 0, life: 0 });
  const _zero = new T.Matrix4().makeScale(0, 0, 0);
  let anyLet = true, anyShard = true, flameOn = true;
  function stepParticles(dt) {
    for (let i = 0; i < emb.length; i++) {
      const e = emb[i];
      if (e.life > 0) {
        e.life -= dt; e.v.y += 0.35 * dt; e.v.multiplyScalar(1 - 0.9 * dt); e.p.addScaledVector(e.v, dt);
        const f = cl(e.life / e.max, 0, 1);
        EMB.pos.setXYZ(i, e.p.x, e.p.y, e.p.z); EMB.size.setX(i, e.s * (0.4 + 0.6 * f));
        EMB.col.setXYZW(i, 1, lerp(0.25, 0.75, f * e.hot), lerp(0.04, 0.32, f * e.hot), Math.min(1, f * 1.6));
      } else if (e.max) { EMB.col.setXYZW(i, 0, 0, 0, 0); e.max = 0; }
    }
    EMB.pos.needsUpdate = EMB.size.needsUpdate = EMB.col.needsUpdate = true;
    let live = false;
    for (let i = 0; i < NLET; i++) {
      const l = lets[i];
      if (l.life > 0) {
        live = true;
        l.life -= dt; l.v.multiplyScalar(1 - l.drag * dt); l.v.y += (l.ash ? 0.5 : 0.9) * dt; l.p.addScaledVector(l.v, dt); l.ang += l.spin * dt;
        const f = cl(l.life / l.max, 0, 1), sc = l.s * Math.min(1, f * 3) * Math.min(1, (1 - f) * 8 + 0.2);
        _qa.setFromAxisAngle(l.ax, l.ang); _s.setScalar(sc); _m.compose(l.p, _qa, _s); letMesh.setMatrixAt(i, _m);
        if (l.ash) letMesh.instanceColor.setXYZ(i, 0.42, 0.38, 0.34); else letMesh.instanceColor.setXYZ(i, 1, lerp(0.55, 0.95, f), lerp(0.3, 0.85, f));
      } else if (anyLet) letMesh.setMatrixAt(i, _zero);
    }
    if (live || anyLet) { letMesh.instanceMatrix.needsUpdate = true; letMesh.instanceColor.needsUpdate = true; }
    anyLet = live; live = false;
    for (let i = 0; i < NSH; i++) {
      const s = shards[i];
      if (s.life > 0) { live = true; s.life -= dt; s.v.y -= 6 * dt; s.p.addScaledVector(s.v, dt); s.ang += 9 * dt; _qa.setFromAxisAngle(s.ax, s.ang); _s.setScalar(Math.min(1, s.life * 2) * 1.5); _m.compose(s.p, _qa, _s); shMesh.setMatrixAt(i, _m); }
      else if (anyShard) shMesh.setMatrixAt(i, _zero);
    }
    if (live || anyShard) shMesh.instanceMatrix.needsUpdate = true;
    anyShard = live;
  }

  // ---------- actions ----------
  const A = (dur, hits, hold, interrupt, cues) => Object.freeze({ dur, hits: Object.freeze(hits), cues: Object.freeze(cues || []), hold: !!hold, interrupt: !!interrupt });
  const ACTIONS = {
    summon: A(5.2, [0.62], true, false, [0.45, 0.74]),
    envoi: A(7.0, [0.44, 0.48, 0.52, 0.56, 0.6, 0.64, 0.68, 0.72, 0.85], true),
    leave: A(2.6, [], true),
    block: A(0.45, [], false, true),
    hurt: A(0.6, [], false, true),
  };
  ACTIONS.appear = ACTIONS.summon; ACTIONS.die = ACTIONS.leave;
  Object.freeze(ACTIONS);
  const ALIAS = { appear: 'summon', die: 'leave' };

  const CHAR = new T.Color(0.13, 0.08, 0.055);
  const PA = mkPose(), PB = mkPose(), TGT = mkPose(), CUR = mkPose();
  let act = null, prevU = 0, guardT = 0, guardW = 0, fade = 1, sealOn = 1, flash = 0, sealFlash = 0, flapPh = 0, first = true;
  const unf = new Float32Array(NSEG).fill(1), burn = new Float32Array(NSEG);
  let headF = 1, wingF = 1, headBurn = 0, wingBurn = 0, streamVis = 1, crease = 0, glowNow = 1;
  let warded = false, blockEndsWard = false, spent = false, ignite = 1, heartDrop = 0, heartGone = false, pillar = 0, fireBurn = false, finalFlash = 0;
  let blinkIn = 3.3, blinkT = -1;
  const api = { dash: 0, lift: 0.5, state: { glow: 1, crease: 0, seal: 1, reach: 4.5 } };

  function resetLooks() {
    sealOn = 1; api.state.seal = 1;
    for (let i = 0; i < NSEG; i++) { burn[i] = 0; unf[i] = 1; }
    headF = wingF = 1; headBurn = wingBurn = 0; streamVis = 1; ignite = 1; heartDrop = 0; heartGone = false; pillar = 0; fireBurn = false;
  }
  function breakSeal() {
    if (!sealOn) return; sealOn = 0; api.state.seal = 0; sealFlash = 1;
    sealB.getWorldPosition(_w3);
    for (const s of shards) { s.p.copy(_w3); s.v.set(rr(-2, 2), rr(1.5, 3.5), rr(-0.5, 2.5)); s.ax.set(rr(-1, 1), rr(-1, 1), rr(-1, 1)).normalize(); s.life = rr(0.8, 1.3); }
    for (let i = 0; i < 24; i++) ember(_w3, _w.set(rr(-2, 2), rr(0, 2.5), rr(-1, 2)), rr(0.5, 1.1), rr(0.05, 0.1));
  }

  function animate(phase, walk, t, dt) {
    dt = Math.min(dt || 0, 0.1); walk = cl(walk || 0, 0, 1);
    // action clock: busy while an action plays, holds included; a finished hold keeps its name with busy false
    let u = -1, name = '';
    if (act) {
      act.t += dt; u = act.t / act.def.dur;
      if (u >= 1) {
        if (act.def.hold) u = 1;
        else { if (act.name === 'block' && blockEndsWard) warded = false; act = null; u = -1; }
      }
      if (act) name = act.name;
    }
    api.action = name; api.progress = act ? Math.min(1, u) : -1; api.busy = !!act && u < 1;
    const crossed = (x) => prevU < x && u >= x;

    // base pose: idle, blended toward the coil while warding or guarding
    guardW += ((guardT || warded ? 1 : 0) - guardW) * (1 - Math.exp(-3.2 * dt));
    poseIdle(PA, t, walk); poseCoil(PB, t); blendPose(TGT, PA, PB, sm(0, 1, guardW));
    let dash = 0, rise = 0, glowAdd = 0, cr = 0, jawAdd = 0, k = 6, ripple = -1, squint = 0;
    wrapW = 0;
    REACH = cl(+api.state.reach || 4.5, 2.0, 9);
    aim = 0;
    const tg = api.state.target;
    if (tg && isFinite(tg.x) && isFinite(tg.z)) { root.updateWorldMatrix(true, false); _tl.set(+tg.x, +tg.y || 0, +tg.z); root.worldToLocal(_tl); if (_tl.x * _tl.x + _tl.z * _tl.z > 0.04) aim = Math.atan2(_tl.x, _tl.z); }
    CENTER.set(Math.sin(aim) * REACH, 0, Math.cos(aim) * REACH);
    const key = ALIAS[name] || name;
    const layer = (fn, w) => { if (w > 0.001) { fn(PB, t); blendPose(TGT, TGT, PB, w); } };
    if (key === 'summon') {
      // letters fold into the wyrm from head to tail, Sol's blade lights the heart, the seal breaks, it coils into a wall
      rise = -0.7 * (1 - sm(0, 0.4, u));
      for (let i = 0; i < NSEG; i++) unf[i] = sm(0.02 + i * 0.018, 0.14 + i * 0.018, u);
      headF = sm(0.0, 0.12, u); wingF = sm(0.24, 0.46, u);
      ignite = lerp(0.1, 1, sm(0.42, 0.47, u));
      if (crossed(0.45)) { finalFlash = Math.max(finalFlash, 0.6); heartP.kick = 1; }
      layer(poseRear, win(u, 0.5, 0.6, 0.7, 0.82));
      jawAdd = win(u, 0.57, 0.62, 0.7, 0.8) * 0.85;
      glowAdd = Math.exp(-Math.pow((u - 0.64) / 0.08, 2)) + 0.6 * Math.exp(-Math.pow((u - 0.46) / 0.04, 2)); ripple = (u - 0.6) * 2.6;
      if (crossed(0.62)) breakSeal();
      if (u >= 0.74) warded = true;
      if (u < 0.44 && dt > 0) for (let n = 0; n < 3; n++) if (rnd() < 18 * dt) {
        const i = (rnd() * NSEG) | 0; _w.copy(segPos[i]).add(_w2.set(rr(-1.5, 1.5), rr(-0.8, 1.0), rr(-1.5, 1.5))); root.localToWorld(_w);
        root.localToWorld(_w3.copy(segPos[i])); _w2.subVectors(_w3, _w).multiplyScalar(1.7); _w2.y += 0.5; letter(_w, _w2, rr(0.5, 0.9), 0, 1.1, 0.6);
      }
    } else if (key === 'envoi') {
      // uncoil, wrap the foe, burn tail to head as a ring of fire, drop the heart, rise away as letters
      warded = false; fireBurn = true;
      layer(poseRear, win(u, 0.0, 0.07, 0.11, 0.2)); wrapW = sm(0.12, 0.3, u); layer(poseHelix, wrapW); k = u > 0.1 && u < 0.34 ? 4.5 : 7;
      cr = sm(0.02, 0.14, u) * 0.55; glowAdd = 0.3 * cr;
      // the ring catches from the tail up through the eight hits and burns on as a ring of fire; the Last Word consumes it
      for (let i = 0; i < NSEG; i++) { const j = NSEG - 1 - i; burn[i] = 0.6 * sm(0.38 + j * 0.018, 0.47 + j * 0.018, u) + 0.4 * sm(0.84 + j * 0.003, 0.95, u); }
      streamVis = 1 - sm(0.36, 0.44, u);
      heartDrop = sm(0.72, 0.84, u); jawAdd = win(u, 0.74, 0.8, 0.88, 0.95);
      if (crossed(0.85)) {
        heartGone = true; finalFlash = 1.4; flash = 1;
        _w3.copy(CENTER); _w3.y = 1.3; root.localToWorld(_w3);
        for (let i = 0; i < 70; i++) ember(_w3, _w.set(rr(-5, 5), rr(-1, 6), rr(-5, 5)), rr(0.6, 1.6), rr(0.06, 0.16));
        for (let i = 0; i < 26; i++) letter(_w3, _w.set(rr(-5, 5), rr(1, 6), rr(-5, 5)), rr(1, 1.8), 0, 1.4, 1.2);
      }
      headBurn = sm(0.86, 0.98, u); wingBurn = sm(0.84, 0.97, u);
      pillar = win(u, 0.85, 0.87, 0.95, 1.0);
    } else if (key === 'leave') {
      // burning only ever goes on: leaving after a strike stays burned away
      warded = false; fireBurn = false;
      layer(poseRear, sm(0, 0.35, u) * 0.45);
      streamVis = Math.min(streamVis, 1 - sm(0.0, 0.15, u));
      for (let i = 0; i < NSEG; i++) { const j = NSEG - 1 - i; burn[i] = Math.max(burn[i], sm(0.04 + j * 0.03, 0.18 + j * 0.03, u)); }
      wingBurn = Math.max(wingBurn, sm(0.5, 0.8, u)); headBurn = Math.max(headBurn, sm(0.65, 0.95, u)); glowAdd = 0.3 * (1 - u);
    } else if (key === 'block') {
      // the paper wall takes the hit: it shudders and its light flickers, then settles
      recoil(TGT, win(u, 0, 0.12, 0.35, 1) * 0.3); k = 12; squint = win(u, 0, 0.1, 0.5, 1);
      ripple = 1 - u * 2.2; glowAdd = -0.4 * win(u, 0, 0.05, 0.2, 0.5) + 0.7 * win(u, 0.25, 0.4, 0.5, 0.9);
      if (crossed(0.02)) { root.localToWorld(_w3.set(0, 1.6, 1.6)); for (let i = 0; i < 24; i++) ember(_w3, _w.set(rr(-2.5, 2.5), rr(-0.5, 2), rr(0, 2.5)), rr(0.4, 0.9), rr(0.05, 0.09)); }
    } else if (key === 'hurt') {
      recoil(TGT, win(u, 0, 0.12, 0.35, 1)); k = 12; dash = u < 0.3 ? -1.6 : 0; squint = win(u, 0, 0.1, 0.5, 1);
    }
    if (rise) for (let i = 0; i < NC; i++) TGT.pts[i].y += rise;
    TGT.jaw = Math.min(1, TGT.jaw + jawAdd);
    // fade from the game: unfolds head to tail
    if (fade < 1) for (let i = 0; i < NSEG; i++) unf[i] = Math.min(unf[i], sm((i / NSEG) * 0.6, (i / NSEG) * 0.6 + 0.4, fade));
    const hF = Math.min(headF, sm(0, 0.3, fade)), wF = Math.min(wingF, sm(0.5, 1, fade));

    // smooth toward the target, so actions never pop
    const a = first ? 1 : 1 - Math.exp(-k * dt); first = false;
    if (a > 0) {
      for (let i = 0; i < NC; i++) CUR.pts[i].lerp(TGT.pts[i], a);
      CUR.head.lerp(TGT.head, a); for (const kk of ['spread', 'flap', 'jaw', 'ward']) CUR[kk] = lerp(CUR[kk], TGT[kk], a);
    }
    flash = Math.max(0, flash - dt * 1.6); finalFlash = Math.max(0, finalFlash - dt * 1.3); sealFlash = Math.max(0, sealFlash - dt * 2.2);
    crease += (Math.max(cr, cl(api.state.crease, 0, 1)) - crease) * (1 - Math.exp(-8 * dt));
    glowNow = cl(api.state.glow == null ? 1 : api.state.glow, 0, 1.5) * (1 + glowAdd + flash * 0.8);
    if (api.state.seal === 0 && sealOn) sealOn = 0;
    else if (api.state.seal === 1 && !sealOn) sealOn = 1;

    // body
    sampleSpine(CUR.pts);
    let minY = 99;
    for (let i = 0; i < NSEG; i++) {
      atArc(SEG_D[i], segPos[i], segTan[i]);
      const f = unf[i], gone = 1 - sm(0.62, 1, burn[i]), sc = SIZE[i] * gone;
      axisQuat(_q, segTan[i], i); if (f < 1) _q.multiply(_q2.setFromAxisAngle(UP, (1 - f) * Math.PI * 1.5));
      _s.set(sc * lerp(0.5, 1, f), sc * lerp(0.03, 1, f * f), sc * lerp(0.5, 1, f)); if (f < 0.01) _s.setScalar(0);
      _m.compose(segPos[i], _q, _s); segMesh.setMatrixAt(i, _m);
      segBones[i].position.copy(segPos[i]); segBones[i].quaternion.copy(_q);
      const rip = ripple > -1 ? 1.4 * Math.exp(-Math.pow((ripple - i / NSEG) / 0.12, 2)) : 0;
      aBurn.setXY(i, glowNow * (1 + rip + crease * 0.6), Math.min(1, burn[i] * (fireBurn ? 0.95 : 1.5)));
      if (f > 0.2 && gone > 0.2) minY = Math.min(minY, segPos[i].y - LR * SIZE[i]);
    }
    segMesh.instanceMatrix.needsUpdate = true; aBurn.needsUpdate = true;
    for (let i = 0; i < NKN; i++) {
      atArc(KNOT_D[i], knotPos[i], knotTan[i]);
      const i0 = Math.max(0, i - 1), i1 = Math.min(NSEG - 1, i);
      const v = Math.min(unf[i0], unf[i1]) * (1 - sm(0.4, 0.8, Math.max(burn[i0], burn[i1])));
      axisQuat(_q, knotTan[i], 0); _s.setScalar(v < 0.02 ? 0 : (SIZE[i0] + SIZE[i1]) * 0.5 * v);
      _m.compose(knotPos[i], _q, _s); knots.setMatrixAt(i, _m);
    }
    knots.instanceMatrix.needsUpdate = true;
    atArc(SEG_D[NSEG - 1] + LH * SIZE[NSEG - 1] + 0.08, tailTip, tailDir);
    matSeg.emissive.copy(GLOW_C).lerp(CREASE, crease * 0.7); matSeg.emissiveIntensity = 1 + crease * 0.5;
    matWing.emissive.copy(GLOW_C).lerp(CREASE, crease * 0.7); matWing.emissiveIntensity = 0.9 * Math.min(1.3, glowNow) * (1 + crease * 0.35) * (1 - wingBurn * 0.85);
    matWing.U.uChar.value = wingBurn;
    matHead.emissiveIntensity = 0.8 * glowNow * (1 + crease * 0.8) * (1 - headBurn * 0.85);
    matHead.U.uChar.value = headBurn;
    matHeart.emissiveIntensity = 2.1 * glowNow * ignite + 0.05;

    // head
    headB.position.copy(samp[0]);
    _w.copy(CUR.head).normalize().addScaledVector(segTan[0], -0.3).normalize();
    basisQuat(headB.quaternion, _w, UP);
    headTurn += (cl(aim, -0.8, 0.8) * 0.75 * (1 - wrapW) - headTurn) * (1 - Math.exp(-3 * dt));
    if (Math.abs(headTurn) > 1e-4) headB.quaternion.premultiply(_q2.setFromAxisAngle(UP, headTurn));
    headB.scale.setScalar(HS * Math.max(0.0001, hF * (1 - sm(0.6, 1, headBurn))));
    jawB.rotation.x = CUR.jaw * 0.62;
    matMouth.opacity = cl(CUR.jaw * 1.2, 0, 1) * Math.min(1, glowNow);
    // blinking: a blink every few seconds, and a squint when struck
    if (dt > 0) { blinkIn -= dt; if (blinkIn <= 0 && blinkT < 0) { blinkT = 0; blinkIn = rr(2.5, 5.5); } if (blinkT >= 0) { blinkT += dt; if (blinkT > 0.2) blinkT = -1; } }
    const shut = Math.max(blinkT >= 0 ? Math.sin(Math.PI * cl(blinkT / 0.2, 0, 1)) : 0, squint * 0.6);
    for (const b of lidB) b.scale.set(1, lerp(0.06, 1, shut), 1);
    sealB.scale.setScalar(sealOn ? 1 : 0.0001);

    // wings
    flapPh += dt * (2.2 + CUR.flap * 2.5);
    bodyFrame(_q, 0, CUR);
    for (const w of wings) {
      // the fans spring from the shoulders behind the frill
      w.b.position.copy(samp[0]).add(_w.set(w.s * 0.3, 0.12, -0.78).applyQuaternion(_q));
      w.b.quaternion.copy(_q);
      { const fl = CUR.flap * Math.sin(flapPh), wd = CUR.ward;
        _wB.set(w.s * (0.66 + 0.5 * wd), -0.1 + 0.08 * wd, -0.74 + 0.62 * wd).normalize();
        _wU.set(w.s * (0.36 - 0.06 * wd), 0.92, 0.18).normalize().applyAxisAngle(_wB, -w.s * (fl - 0.1));
        _wU.addScaledVector(_wB, -_wU.dot(_wB)).normalize(); _wZ.copy(_wB).negate(); _wX.crossVectors(_wU, _wZ);
        _m.makeBasis(_wX, _wU, _wZ); w.roll.quaternion.setFromRotationMatrix(_m); }
      const ws = wF * (1 - sm(0.5, 1, wingBurn));
      w.b.scale.setScalar(Math.max(0.0001, ws));
      updateWing(w, CUR.spread * lerp(0.3, 1, wF));
    }
    api.dash = dash;
    api.lift = minY < 90 ? Math.max(0, minY) : 0;
    root.updateMatrixWorld(true);
    stepFx(t, dt);
    prevU = u;
  }
  const _wB = V3(), _wU = V3(), _wX = V3(), _wZ = V3();

  // ---------- fx step (world space) ----------
  const _wind = V3(), _hd2 = V3(), _side = V3(), _wd = V3(), _dir = V3(), _anc = V3(), _r1 = V3(), _r2 = V3();
  function stepFx(t, dt) {
    const steps = dt > 0 ? Math.min(8, Math.ceil(dt / H)) : 0;
    const bodyVis = (i) => unf[i] * (1 - sm(0.45, 0.9, burn[i]));
    const hs = headB.scale.x / HS;
    // tassel anchors: the joints, the jaw and cheeks, the wing roots, the tail
    let n = 0;
    for (let i = 0; i < NJT; i++, n++) { root.localToWorld(tas[n].a.copy(knotPos[i + 1])); tas[n].vis = Math.min(bodyVis(i), bodyVis(i + 1)) * (0.62 + 0.38 * (SIZE[i] + SIZE[i + 1]) * 0.5); }
    for (let s = 0; s < 4; s++, n++) { headB.localToWorld(tas[n].a.copy(HEADTAS[s])); tas[n].vis = hs * (s < 2 ? 1.1 : 0.85); }
    for (let s = 0; s < 2; s++, n++) { wings[s].b.getWorldPosition(tas[n].a); tas[n].vis = wings[s].b.scale.x; }
    const tailTasN = n; n += 2;
    // heart lantern pendulum, under the chin
    heartP.a.copy(THROAT); headB.localToWorld(heartP.a);
    if (heartDrop > 0) { _w2.copy(CENTER); _w2.y = 1.9; root.localToWorld(_w2); heartP.a.lerp(_w2, sm(0, 1, heartDrop)); }
    if (!heartP.init) { heartP.p.copy(heartP.a).y -= heartP.L; heartP.q.copy(heartP.p); heartP.init = true; }
    const hv = fireBurn ? (heartGone ? 0 : Math.max(hs, heartDrop)) : hs * (1 - sm(0.3, 0.7, headBurn));
    // streamers anchor
    root.localToWorld(_anc.copy(tailTip)); _hd2.copy(tailDir).transformDirection(root.matrixWorld);
    for (let s = 0; s < 2; s++) { root.localToWorld(tas[tailTasN + s].a.copy(knotPos[NSEG])).add(_w.set(s ? 0.05 : -0.05, 0, 0)); tas[tailTasN + s].vis = bodyVis(NSEG - 1) * streamVis * 0.7; }
    for (const st of strips) if (!st.init) { for (let k = 0; k < NN; k++) { st.nodes[k].p.copy(_anc).add(st.off).addScaledVector(_hd2, k * st.L); st.nodes[k].q.copy(st.nodes[k].p); } st.init = true; }
    for (const o of tas) if (!o.init) { o.p.copy(o.a).y -= o.L; o.q.copy(o.p); o.init = true; }
    // whisker rest shapes in world space
    for (const wk of whisk) {
      if (!wk.init) { for (let k = 0; k < WN; k++) { headB.localToWorld(wk.nodes[k].p.copy(wk.rest[k])); wk.nodes[k].q.copy(wk.nodes[k].p); } wk.init = true; }
    }
    if (heartP.kick) { heartP.q.x -= 0.03; heartP.kick = 0; }
    for (let k = 0; k < steps; k++) {
      const tt = t - (steps - 1 - k) * H;
      _wind.set(Math.sin(tt * 1.3) * 0.8, 0, Math.cos(tt * 0.9) * 0.6);
      for (const o of tas) pendStep(o, 8, _wind, 4);
      pendStep(heartP, 9, _wind, 3.2);
      for (let s = 0; s < NST; s++) {
        const st = strips[s], nd = st.nodes;
        nd[0].p.copy(_anc).add(st.off); nd[0].q.copy(nd[0].p);
        const fx_ = _hd2.x * 1.8 + Math.sin(tt * 1.4 + s * 1.7) * 1.2, fy = _hd2.y * 1.8 - 2.4, fz = _hd2.z * 1.8 + Math.cos(tt * 1.1 + s) * 1.0;
        for (let j = 1; j < NN; j++) {
          const p = nd[j].p, q = nd[j].q, d = 1 - 2.6 * H;
          const vx = (p.x - q.x) * d, vy = (p.y - q.y) * d, vz = (p.z - q.z) * d; q.copy(p);
          p.x += vx + fx_ * H * H; p.y += vy + fy * H * H; p.z += vz + fz * H * H;
        }
        for (let it = 0; it < 2; it++) for (let j = 1; j < NN; j++) {
          _w.subVectors(nd[j].p, nd[j - 1].p); const L = _w.length() || 1, e = (L - st.L) / L;
          if (j === 1) nd[j].p.addScaledVector(_w, -e); else { nd[j].p.addScaledVector(_w, -e * 0.5); nd[j - 1].p.addScaledVector(_w, e * 0.5); }
        }
      }
      // whiskers: pinned at the snout, pulled softly toward their curl, trailing behind the head's motion
      for (const wk of whisk) {
        const nd = wk.nodes;
        for (let j = 0; j < WN; j++) {
          headB.localToWorld(_r1.copy(wk.rest[j]));
          if (j < 2) { nd[j].q.copy(nd[j].p); nd[j].p.copy(_r1); continue; }
          const p = nd[j].p, q = nd[j].q, d = 1 - 3.2 * H, kk = 0.07 + 0.05 * (1 - j / WN);
          const vx = (p.x - q.x) * d, vy = (p.y - q.y) * d, vz = (p.z - q.z) * d; q.copy(p);
          p.x += vx + (_r1.x - p.x) * kk + _wind.x * 0.4 * H * H; p.y += vy + (_r1.y - p.y) * kk - 1.2 * H * H; p.z += vz + (_r1.z - p.z) * kk + _wind.z * 0.4 * H * H;
        }
        const L = wk.seg * hs * HS;
        for (let j = 2; j < WN; j++) { _w.subVectors(nd[j].p, nd[j - 1].p); const d = _w.length() || 1; nd[j].p.copy(nd[j - 1].p).addScaledVector(_w, L / d); }
      }
    }
    // tassel matrices
    for (let i = 0; i < NTAS; i++) {
      const o = tas[i]; _dir.subVectors(o.p, o.a).normalize();
      _qa.setFromUnitVectors(DOWN, _dir); _s.setScalar(o.sc * o.vis); if (o.vis < 0.02) _s.setScalar(0);
      _m.compose(o.a, _qa, _s); tasMesh.setMatrixAt(i, _m);
    }
    tasMesh.instanceMatrix.needsUpdate = true;
    // heart lantern and cord
    _dir.subVectors(heartP.a, heartP.p).normalize();
    heart.position.copy(heartP.p); heart.quaternion.setFromUnitVectors(UP, _dir).multiply(_q2.setFromAxisAngle(UP, t * 0.35));
    heart.scale.setScalar(Math.max(0.0001, hv)); heart.visible = hv > 0.02;
    _w.copy(heartP.p).addScaledVector(_dir, (HHt + 0.17) * hv);
    cord.position.copy(_w); cord.quaternion.setFromUnitVectors(UP, _dir); cord.scale.set(Math.max(0.001, hv), Math.max(0.001, heartP.a.distanceTo(_w)), Math.max(0.001, hv)); cord.visible = hv > 0.02;
    heartLight.position.copy(heartP.p); heartLight.intensity = 1.6 * glowNow * ignite * hv * (1 + flash * 2) + finalFlash * 3;
    // whisker tubes
    for (let s = 0; s < 2; s++) {
      const nd = whisk[s].nodes, vis = hs > 0.05 ? 1 : 0;
      for (let j = 0; j < WN; j++) {
        if (j < WN - 1) _dir.subVectors(nd[j + 1].p, nd[j].p); else _dir.subVectors(nd[j].p, nd[j - 1].p);
        _dir.normalize(); _side.crossVectors(_dir, UP); if (_side.lengthSq() < 1e-4) _side.set(1, 0, 0); _side.normalize(); _wd.crossVectors(_side, _dir);
        const r = (0.024 - 0.016 * (j / (WN - 1))) * hs * HS * vis, p = nd[j].p;
        for (let i = 0; i < WSIDES; i++) {
          const a = (i / WSIDES) * TAU, ca = Math.cos(a), sa = Math.sin(a), o = ((s * WN + j) * WSIDES + i) * 3;
          const nx = _side.x * ca + _wd.x * sa, ny = _side.y * ca + _wd.y * sa, nz = _side.z * ca + _wd.z * sa;
          whPos[o] = p.x + nx * r; whPos[o + 1] = p.y + ny * r; whPos[o + 2] = p.z + nz * r; whNor[o] = nx; whNor[o + 1] = ny; whNor[o + 2] = nz;
        }
      }
    }
    whG.attributes.position.needsUpdate = true; whG.attributes.normal.needsUpdate = true;
    // streamer ribbons
    const P = stPos;
    for (let s = 0; s < NST; s++) {
      const st = strips[s], nd = st.nodes;
      for (let j = 0; j < NN; j++) {
        if (j < NN - 1) _dir.subVectors(nd[j + 1].p, nd[j].p); else _dir.subVectors(nd[j].p, nd[j - 1].p);
        _dir.normalize(); _side.crossVectors(_dir, UP); if (_side.lengthSq() < 1e-4) _side.set(1, 0, 0); _side.normalize();
        const ph = st.tw * (j / NN) * 1.4 + s * 0.9; _wd.crossVectors(_dir, _side);
        _side.multiplyScalar(Math.cos(ph)).addScaledVector(_wd, Math.sin(ph));
        const hw = st.w * (1 - 0.45 * (j / NN)) * 0.5 * streamVis * bodyVis(NSEG - 1), v = (s * NN + j) * 6, p = nd[j].p;
        P[v] = p.x + _side.x * hw; P[v + 1] = p.y + _side.y * hw; P[v + 2] = p.z + _side.z * hw;
        P[v + 3] = p.x - _side.x * hw; P[v + 4] = p.y - _side.y * hw; P[v + 5] = p.z - _side.z * hw;
      }
    }
    stG.attributes.position.needsUpdate = true; stG.computeVertexNormals();
    // tags
    for (let i = 0; i < NTAG; i++) {
      const g = tags[i]; g.a.copy(strips[g.strip].nodes[g.node].p);
      if (!g.init) { g.p.copy(g.a).y -= g.L; g.q.copy(g.p); g.init = true; }
      for (let k = 0; k < steps; k++) pendStep(g, 7, _wind, 4);
      _dir.subVectors(g.p, g.a).normalize(); _qa.setFromUnitVectors(DOWN, _dir).multiply(_q2.setFromAxisAngle(UP, g.yaw + t * 0.3));
      _s.setScalar(streamVis * bodyVis(NSEG - 1)); _m.compose(g.a, _qa, _s); tagMesh.setMatrixAt(i, _m);
    }
    tagMesh.instanceMatrix.needsUpdate = true;

    // glow halos: the lanterns, the heart (brightest), the eyes, the mouth, the seal flash, the burst; burning lanterns flare
    for (let i = 0; i < NSEG; i++) {
      root.localToWorld(_w.copy(segPos[i])); const v = bodyVis(i), fire = fireBurn ? win(burn[i], 0.02, 0.15, 0.7, 1) : 0;
      setGlow(i, _w, (1.0 + 1.6 * fire) * SIZE[i] * Math.max(v, fire), 1, lerp(0.72, 0.5, fire), lerp(0.4, 0.14, fire), 0.22 * glowNow * (1 + crease) + 0.65 * fire);
    }
    setGlow(16, heartP.p, (1.7 + heartDrop) * hv, 1, 0.8, 0.45, 0.62 * glowNow * ignite);
    for (let s = 0; s < 2; s++) { headB.localToWorld(_w.copy(EYE[s])); setGlow(17 + s, _w, 0.62 * hs, 1, 0.8, 0.36, 0.95); }
    headB.localToWorld(_w.set(0, -0.04, 0.75)); setGlow(19, _w, 1.1 * CUR.jaw * hs, 1, 0.7, 0.3, 0.7 * CUR.jaw * glowNow);
    sealB.getWorldPosition(_w); setGlow(20, _w, 2.6 * sealFlash, 1, 0.45, 0.3, sealFlash);
    if (heartGone) { _w.copy(CENTER); _w.y = 1.3; root.localToWorld(_w); } else _w.copy(heartP.p);
    const fb = Math.max(flash, finalFlash * 0.85); setGlow(21, _w, 9 * fb, 1, 0.9, 0.7, Math.min(1, fb) * 0.9);
    for (let s = 0; s < 2; s++) { wings[s].b.getWorldPosition(_w); setGlow(22 + s, _w, 1.0 * wings[s].b.scale.x, 1, 0.7, 0.35, 0.28 * glowNow); }
    for (let s = 0; s < 2; s++) { headB.localToWorld(_w.set(s ? -0.55 : 0.55, 0.45, -0.55)); setGlow(24 + s, _w, 1.2 * hs, 1, 0.55, 0.2, 0.2 * glowNow); }
    GLOW.pos.needsUpdate = GLOW.size.needsUpdate = GLOW.col.needsUpdate = true;

    // flames on everything that burns: the ring of fire, then the head and the wings
    let burning = headBurn > 0.01 || wingBurn > 0.01;
    for (let i = 0; i < NSEG && !burning; i++) if (burn[i] > 0.01 && burn[i] < 0.99) burning = true;
    if (burning || flameOn) {
      let fi = 0;
      for (let i = 0; i < NSEG; i++) {
        const fk = (fireBurn ? 1.25 : 0.8) * win(burn[i], 0.02, 0.12, 0.72, 0.98);
        root.localToWorld(_w3.copy(segPos[i]));
        for (let k = 0; k < 3; k++, fi++) {
          if (fk < 0.01) { FLAME.col.setW(fi, 0); continue; }
          const ph = t * (7 + k) + i * 1.7 + k * 2.1, sz = SIZE[i];
          _w.set(_w3.x + Math.sin(ph) * 0.14 * sz, _w3.y + (0.05 + 0.24 * k) * sz + 0.06 * Math.sin(ph * 1.7), _w3.z + Math.cos(ph * 0.8) * 0.14 * sz);
          setFlame(fi, _w, (1.0 - 0.2 * k) * sz * fk * (0.85 + 0.25 * Math.sin(ph * 2.3)), Math.min(1, fk));
        }
      }
      for (let k = 0; k < 8; k++, fi++) {
        const hb = win(k < 4 ? headBurn : wingBurn, 0.05, 0.2, 0.75, 0.98);
        if (hb < 0.01) { FLAME.col.setW(fi, 0); continue; }
        if (k < 4) headB.localToWorld(_w.set((k - 1.5) * 0.25, 0.3 + 0.1 * Math.sin(t * 9 + k), 0.6 - k * 0.3));
        else { const w = wings[k & 1], e = w.tips[(4 + k * 5) % w.tips.length]; w.m.localToWorld(_w.set(e[0] * 0.75, e[1] * 0.75, e[2] * 0.75)); }
        setFlame(fi, _w, 1.2 * hb * (0.85 + 0.25 * Math.sin(t * 13 + k)), hb);
      }
      FLAME.pos.needsUpdate = FLAME.size.needsUpdate = FLAME.col.needsUpdate = true;
      flameOn = burning;
    }

    if (dt > 0) {
      // embers from the scorched tips: streamers, wings and frill
      for (let s = 0; s < NST; s++) if (streamVis > 0.3 && rnd() < 1.7 * dt) ember(strips[s].nodes[NN - 1].p, _w.set(rr(-0.2, 0.2), rr(0.1, 0.4), rr(-0.2, 0.2)), rr(0.7, 1.6), rr(0.035, 0.06));
      for (const w of wings) if (w.b.scale.x > 0.3 && rnd() < 3.4 * dt) { const e = w.tips[(rnd() * w.tips.length) | 0]; w.m.localToWorld(_w.set(e[0], e[1], e[2])); ember(_w, _w2.set(rr(-0.2, 0.2), rr(0.1, 0.4), rr(-0.2, 0.2)), rr(0.6, 1.4), rr(0.035, 0.06)); }
      // burning away
      for (let i = 0; i < NSEG; i++) if (burn[i] > 0.12 && burn[i] < 0.92) {
        root.localToWorld(_w3.copy(segPos[i]));
        const fr = fireBurn ? 1.3 : 1;
        for (let e = 0; e < 3; e++) if (rnd() < 6 * fr * dt) ember(_w2.set(_w3.x + rr(-0.3, 0.3), _w3.y + rr(-0.3, 0.3), _w3.z + rr(-0.3, 0.3)), _w.set(rr(-0.4, 0.4), rr(0.4, 1.4), rr(-0.4, 0.4)), rr(0.6, 1.6), fireBurn && e === 0 ? rr(0.18, 0.34) : rr(0.04, 0.08));
        if (rnd() < (fireBurn ? 1.5 : 2.2) * dt) letter(_w3, _w.set(rr(-0.6, 0.6), rr(0.6, 1.6), rr(-0.6, 0.6)), rr(1.2, 2), fireBurn ? 0 : 1, rr(0.8, 1.2), 0.6);
      }
      if (pillar > 0.01) {
        _w3.copy(CENTER); _w3.y = 1.2; root.localToWorld(_w3);
        for (let e = 0; e < 3; e++) if (rnd() < 14 * pillar * dt) letter(_w3.clone().add(_w2.set(rr(-0.6, 0.6), 0, rr(-0.6, 0.6))), _w.set(rr(-0.5, 0.5), rr(4, 7), rr(-0.5, 0.5)), rr(1.2, 1.8), 0, rr(0.9, 1.3), 0.2);
        for (let e = 0; e < 4; e++) if (rnd() < 20 * pillar * dt) ember(_w3.clone().add(_w2.set(rr(-0.5, 0.5), rr(0, 2), rr(-0.5, 0.5))), _w.set(rr(-0.4, 0.4), rr(3, 6), rr(-0.4, 0.4)), rr(0.8, 1.6), rr(0.06, 0.18));
      }
      if (headBurn > 0.1 && headBurn < 0.9 && rnd() < 12 * dt) { headB.getWorldPosition(_w3); ember(_w3, _w.set(rr(-0.4, 0.4), rr(0.4, 1.2), rr(-0.4, 0.4)), rr(0.8, 1.6), rr(0.04, 0.08)); }
      if (wingBurn > 0.1 && wingBurn < 0.9) for (const w of wings) if (rnd() < 10 * dt) { const e = w.tips[(rnd() * w.tips.length) | 0]; w.m.localToWorld(_w3.set(e[0] * 0.7, e[1] * 0.7, e[2] * 0.7)); ember(_w3, _w.set(rr(-0.3, 0.3), rr(0.4, 1), rr(-0.3, 0.3)), rr(0.8, 1.6), rr(0.04, 0.08)); }
    }
    stepParticles(dt);
  }

  // ---------- interface ----------
  function play(name, force) {
    const def = ACTIONS[name]; if (!def) return false;
    if (api.busy && !force && !def.interrupt) return false;
    const key = ALIAS[name] || name;
    if (key === 'summon') { resetLooks(); warded = false; for (let i = 0; i < NSEG; i++) unf[i] = 0; headF = 0; wingF = 0; ignite = 0.1; }
    // once it has struck or begun to leave, anything but leaving finds it whole again (a bench convenience)
    else if (key === 'leave') spent = true;
    else { if (spent) resetLooks(); spent = key === 'envoi'; }
    if (key === 'summon') spent = false;
    if (key === 'block') blockEndsWard = warded;
    if (key !== 'block' && key !== 'hurt') blockEndsWard = false;
    act = { name, def, t: 0 }; prevU = 0; api.busy = true; api.action = name; api.progress = 0;
    return true;
  }
  function guard(on) { guardT = on ? 1 : 0; }
  function reset() { act = null; warded = false; blockEndsWard = false; spent = false; prevU = 0; guardT = 0; api.busy = false; api.action = ''; api.progress = -1; api.dash = 0; resetLooks(); }
  function setFade(f) { fade = cl(+f, 0, 1); }
  const ANCH = {
    chest: (o) => root.localToWorld(o.copy(segPos[1])),
    head: (o) => headB.localToWorld(o.set(0, 0.3, 0.5)),
    hit: (o) => (fireBurn ? root.localToWorld(o.set(CENTER.x, 1.3, CENTER.z)) : headB.localToWorld(o.set(0, 0.04, 1.38))),
    target: (o) => root.localToWorld(o.set(CENTER.x, 1.3, CENTER.z)),
    mouth: (o) => headB.localToWorld(o.set(0, -0.04, 1.05)),
    heart: (o) => o.copy(heartP.p),
    seal: (o) => sealB.getWorldPosition(o),
    tail: (o) => root.localToWorld(o.copy(tailTip)),
    ward: (o) => root.localToWorld(o.set(-0.3, 1.6, 1.7)), // the front of the Folding Ward, where blows land
    wingL: (o) => { const e = wings[0].tips[NL >> 1]; return wings[0].m.localToWorld(o.set(e[0], e[1], e[2])); },
    wingR: (o) => { const e = wings[1].tips[NL >> 1]; return wings[1].m.localToWorld(o.set(e[0], e[1], e[2])); },
  };
  function anchor(name, out) { out = out || V3(); const f = ANCH[name] || ANCH.chest; return f(out); }

  api.root = root; api.fx = fx; api.animate = animate; api.play = play; api.guard = guard; api.reset = reset;
  api.setFade = setFade; api.anchor = anchor; api.ACTIONS = ACTIONS; api.busy = false; api.action = ''; api.progress = -1;
  Object.defineProperty(api, 'warded', { get: () => warded, enumerable: true }); // the Folding Ward is up and will take the next attack
  api.info = { bones: bones.length, actions: ['summon', 'envoi', 'leave', 'block', 'hurt'], textures: texCount, textureMB: +(texBytes / 1048576).toFixed(2), height: 6.4 };
  animate(0, 0, 0, 0);
  return api;
}
