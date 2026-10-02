// pixel-io.js: Io, the Witch, as a 24 x 36 pixel walker drawn entirely in code, after her 3D look and her portrait: the
// magenta hat with its curled cream horns, gold band and moon, wavy chestnut hair, round black glasses, the magenta robe
// with gold trim over a dark bodice, and dark boots. At 36 px she stands one art pixel to one map pixel on the walking
// maps (Chris, October 2). Each shape is filled with three tones lit from the upper left, then outlined.
// makePixelIo(scale) -> { canvas, w: 24, h: 36, scale, foot: [12, 35], frame(dir, step) -> [sx, sy] }
//   the canvas holds 3 frames (stand, step A, step B) across x 4 rows (s, n, e, w), each w x h art px x scale.
// The layout follows the Aethermoor walkers (New-game, claude/cool-ptolemy-uc93gg, game/src/art/walkers.js): three
// frames, four directions, west mirrored from east. The drawing itself is new.
function makePixelIo(scale) {
  'use strict';
  const W = 24, H = 36, K = scale || 1;
  const PAL = {
    o: '#1a0c1d',
    H1: '#dc3a94', H2: '#ab2174', H3: '#701150', // hat
    g1: '#ffe39a', g2: '#dca540', // gold
    N1: '#fff4de', N2: '#e2cba8', n: '#e597b4', // horns
    B1: '#a8693d', B2: '#7c4a2b', B3: '#4f2d1a', // hair
    S1: '#fde4d1', S2: '#f0c2a5', S3: '#d4987f', // skin
    G: '#1b131e', L: '#f6eadf', Wt: '#ffffff', E: '#4a281a', M: '#c9566a', P: '#f2a3a3', // glasses, eyes, mouth, blush
    R1: '#dc4290', R2: '#b3266f', R3: '#77154f', // robe
    D1: '#3c2443', D2: '#24142a', // bodice
    F1: '#523446', F2: '#2f1c29', // boots
  };
  const grid = () => Array.from({ length: H }, () => new Array(W).fill(''));
  const inb = (x, y) => x >= 0 && x < W && y >= 0 && y < H;
  const put = (g, x, y, c) => { x = Math.round(x); y = Math.round(y); if (inb(x, y)) g[y][x] = c; };
  // fill every pixel whose centre passes test(x, y); tone(x, y) picks the colour
  const fill = (g, test, tone) => { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (test(x + 0.5, y + 0.5)) g[y][x] = typeof tone === 'function' ? tone(x + 0.5, y + 0.5) : tone; };
  const inEll = (cx, cy, rx, ry) => (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
  const inPoly = (pts) => (px, py) => { let ins = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) ins = !ins; } return ins; };
  const and = (a, b) => (x, y) => a(x, y) && b(x, y);
  // three tones across a mass from x0 (lit, left) to x1 (shade, right)
  const shade3 = (t1, t2, t3, x0, x1, lo, hi) => (x) => { const u = (x - x0) / Math.max(1e-3, x1 - x0); return u < (lo === undefined ? 0.28 : lo) ? t1 : u > (hi === undefined ? 0.72 : hi) ? t3 : t2; };
  const outline = (g) => {
    const o = g.map((r) => r.slice());
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (g[y][x]) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (inb(X, Y) && g[Y][X] && g[Y][X] !== 'o') { o[y][x] = 'o'; break; } }
    }
    return o;
  };

  // dir: 's' toward the viewer, 'n' away, 'e' to the right; step 0 stand, 1 left foot forward, 2 right foot forward
  function draw(dir, step) {
    const g = grid(), side = dir === 'e', back = dir === 'n', front = dir === 's';
    const sw = step === 1 ? -0.6 : step === 2 ? 0.6 : 0, bob = step ? 0 : -0.4;
    // ---- boots ----
    if (side) {
      const a = step === 1 ? 1.4 : step === 2 ? -1.4 : 0;
      fill(g, inPoly([[9.5 - a, 32], [13 - a, 32], [13.6 - a, 35.6], [9 - a, 35.6]]), 'F2');
      fill(g, inPoly([[10.5 + a, 32], [14 + a, 32], [15 + a, 35.6], [10 + a, 35.6]]), (x) => (x < 12.5 + a ? 'F1' : 'F2'));
    } else {
      const la = step === 1 ? -1 : 0, ra = step === 2 ? -1 : 0;
      fill(g, inPoly([[7.6, 32 + la], [11.2, 32 + la], [11.2, 35.6 + la], [7.4, 35.6 + la]]), (x) => (x < 9.2 ? 'F1' : 'F2'));
      fill(g, inPoly([[12.8, 32 + ra], [16.4, 32 + ra], [16.6, 35.6 + ra], [12.8, 35.6 + ra]]), (x) => (x < 14.2 ? 'F1' : 'F2'));
    }
    // ---- the robe: a bell from the shoulders, gold trim at the hem ----
    const top = 21 + bob;
    const robe = side ? [[8.6, top], [15.4, top], [17.4 + sw, 33], [7 + sw, 33]] : [[6.8, top], [17.2, top], [19.4 + sw, 33], [4.6 + sw, 33]];
    fill(g, inPoly(robe), (x, y) => { const k = (y - top) / (33 - top), l = (side ? 8.6 : 6.8) - k * (side ? 1.6 : 2.2) + sw * k, r = (side ? 15.4 : 17.2) + k * (side ? 2 : 2.2) + sw * k; return shade3('R1', 'R2', 'R3', l, r, 0.22, 0.7)(x); });
    for (let x = 0; x < W; x++) if (g[32][x] && g[32][x][0] === 'R') g[32][x] = x % 2 ? 'g2' : 'g1';
    if (!back) { // the open front: the dark bodice, a gold chain, the robe's gold edges
      const bx = side ? 13.6 : 12;
      fill(g, inPoly(side ? [[13, top + 1], [15, top + 1], [15.4, top + 7], [13.4, top + 7]] : [[10, top + 1], [14, top + 1], [13.4, top + 7.5], [10.6, top + 7.5]]), (x) => (x < bx ? 'D1' : 'D2'));
      if (front) { for (let i = 0; i <= 4; i++) { put(g, 10.2 + i * 0.45, top + 1.4 + i * 0.75, 'g1'); put(g, 13.8 - i * 0.45, top + 1.4 + i * 0.75, 'g1'); } put(g, 12, top + 5.2, 'g2'); for (let y = top + 8; y < 32; y++) put(g, 12, y, 'R3'); }
    }
    // ---- sleeves: wide, gold-cuffed, a hand at each cuff ----
    if (side) {
      fill(g, inPoly([[11, top + 0.5], [14, top + 0.5], [15.6, top + 8.5], [11.2, top + 9]]), (x) => (x < 12.6 ? 'R1' : x > 14.6 ? 'R3' : 'R2'));
      for (let x = 11; x <= 15; x++) put(g, x, top + 8.6, 'g2');
      put(g, 14, top + 9.6, 'S2'); put(g, 15, top + 9.6, 'S3');
    } else {
      fill(g, inPoly([[5.6, top + 0.6], [8.6, top + 0.6], [8.8, top + 8.5], [4.2, top + 9.2]]), (x) => (x < 6.2 ? 'R1' : 'R2'));
      fill(g, inPoly([[15.4, top + 0.6], [18.4, top + 0.6], [19.8, top + 9.2], [15.2, top + 8.5]]), (x) => (x > 18 ? 'R3' : 'R2'));
      for (let x = 4; x <= 8; x++) put(g, x, top + 8.8, 'g2');
      for (let x = 16; x <= 20; x++) put(g, x, top + 8.8, 'g2');
      if (front) { put(g, 6, top + 9.8, 'S2'); put(g, 7, top + 9.8, 'S2'); put(g, 17, top + 9.8, 'S2'); put(g, 18, top + 9.8, 'S3'); }
    }
    // the high collar
    if (!back) fill(g, inPoly(side ? [[11.4, top - 1.2], [15, top - 1.2], [15.4, top + 0.8], [11, top + 0.8]] : [[9, top - 1.2], [15, top - 1.2], [15.6, top + 0.8], [8.4, top + 0.8]]), (x) => (x < (side ? 12.6 : 10.4) ? 'R1' : x > (side ? 14.4 : 14) ? 'R3' : 'R2'));
    // ---- hair behind the head, and long wavy locks to the shoulders ----
    const hcx = side ? 12.6 : 12, hcy = 16.4 + bob;
    if (back) {
      fill(g, inEll(12, 15.6 + bob, 7, 6.6), (x) => (x < 9 ? 'B1' : x > 15.5 ? 'B3' : 'B2'));
      fill(g, inPoly([[5.6, 16 + bob], [18.4, 16 + bob], [18.2, 24 + bob], [16.4, 25.6 + bob], [14.4, 24.8 + bob], [12, 26.2 + bob], [9.6, 24.8 + bob], [7.6, 25.6 + bob], [5.8, 24 + bob]]), (x) => (x < 8.6 ? 'B1' : x > 15.4 ? 'B3' : 'B2'));
      for (const [x0, y0] of [[9, 18], [12, 19], [15, 18], [10.5, 22], [13.5, 22]]) for (let k = 0; k < 4; k++) put(g, x0 + Math.sin(k) * 0.6, y0 + k + bob, 'B3');
      for (let k = 0; k < 5; k++) put(g, 7 + Math.sin(k) * 0.5, 17 + k + bob, 'B1');
    } else if (side) {
      fill(g, inEll(10.8, 15.8 + bob, 6.2, 6.2), (x) => (x < 8 ? 'B1' : 'B2'));
      fill(g, inPoly([[5, 15 + bob], [11.6, 15 + bob], [11.4, 24 + bob], [9.6, 25.4 + bob], [7.4, 24.6 + bob], [5.4, 25.6 + bob], [4.4, 21 + bob]]), (x) => (x < 7 ? 'B1' : x > 10 ? 'B3' : 'B2'));
      for (let k = 0; k < 6; k++) put(g, 8.4 + Math.sin(k * 1.3) * 0.6, 17 + k + bob, 'B3');
    } else {
      fill(g, inEll(12, 15.4 + bob, 7, 6.3), (x) => (x < 9 ? 'B1' : x > 15.6 ? 'B3' : 'B2'));
      for (const [l, r, s1, s3] of [[4.6, 8.4, 'B1', 'B2'], [15.6, 19.4, 'B2', 'B3']]) fill(g, inPoly([[l, 15 + bob], [r, 15 + bob], [r - 0.2, 24 + bob], [r - 1.6, 25.6 + bob], [l + 1.4, 24.6 + bob], [l - 0.2, 25.4 + bob]]), (x) => (x < (l + r) / 2 ? s1 : s3));
      for (let k = 0; k < 6; k++) { put(g, 6.4 + Math.sin(k * 1.4) * 0.6, 18 + k + bob, 'B1'); put(g, 17.4 + Math.sin(k * 1.4) * 0.6, 18 + k + bob, 'B3'); }
    }
    // ---- the face ----
    if (!back) {
      if (side) fill(g, and(inEll(hcx + 0.6, hcy, 4.4, 4.8), (x) => x > 10.6), (x) => (x > 15.6 ? 'S3' : x > 14.2 ? 'S2' : 'S1'));
      else fill(g, inEll(hcx, hcy, 5.2, 4.8), (x) => (x > 15.4 ? 'S3' : x > 13.8 ? 'S2' : 'S1'));
      // bangs: a wavy fringe across the forehead
      if (side) fill(g, inPoly([[9.6, 11 + bob], [17, 11 + bob], [17.2, 13.2 + bob], [16, 14.4 + bob], [14.6, 13.4 + bob], [13.4, 14.8 + bob], [12, 13.6 + bob], [10.6, 15.4 + bob]]), (x) => (x < 12 ? 'B1' : 'B2'));
      else fill(g, inPoly([[6.4, 11 + bob], [17.6, 11 + bob], [17.8, 14.6 + bob], [16.4, 13.4 + bob], [15, 14.8 + bob], [13.4, 13.6 + bob], [12, 15 + bob], [10.6, 13.6 + bob], [9, 14.8 + bob], [7.6, 13.4 + bob], [6.2, 14.8 + bob]]), (x) => (x < 9.4 ? 'B1' : x > 15.4 ? 'B3' : 'B2'));
      // round glasses, eyes with a glint, a small smile and soft cheeks
      const lens = (x0, y0) => { // a 4 x 3 ring: the glint on the left, the eye on the right
        for (const [dx, dy] of [[1, 0], [2, 0], [0, 1], [3, 1], [1, 2], [2, 2]]) put(g, x0 + dx, y0 + dy, 'G');
        put(g, x0 + 1, y0 + 1, 'L'); put(g, x0 + 2, y0 + 1, 'E');
      };
      const ey = 16.8 + bob;
      if (side) { lens(14, ey - 1); for (let x = 11; x <= 13; x++) put(g, x, ey, 'G'); put(g, 17.6, ey + 1.2, 'S2'); put(g, 15.6, 19.8 + bob, 'M'); put(g, 14.4, 19 + bob, 'P'); }
      else { lens(7, ey - 1); lens(13, ey - 1); put(g, 11, ey, 'G'); put(g, 12, ey, 'G'); put(g, 12, 20 + bob, 'M'); put(g, 7.8, 19.2 + bob, 'P'); put(g, 16.2, 19.2 + bob, 'P'); }
    }
    // ---- the hat: a wide brim, a tall cone that bends at the tip, a gold band with the moon, two curled horns ----
    const by = 11.6 + bob, bcx = side ? 12.4 : 12;
    fill(g, inEll(bcx, by, side ? 9.6 : 10.8, 2.4), (x, y) => (y > by + 0.6 ? 'H3' : x < bcx - 5 ? 'H1' : x > bcx + 6 ? 'H3' : 'H2'));
    const cone = side
      ? [[7.8, by - 0.4], [16.4, by - 0.4], [14.6, 5 + bob], [12.6, 2.2 + bob], [9.6, 0.2 + bob], [8.4, 0.8 + bob], [10.2, 2.8 + bob], [10.4, 5.4 + bob]]
      : [[7, by - 0.4], [17, by - 0.4], [15.6, 5.6 + bob], [15.8, 3 + bob], [17.4, 0.6 + bob], [18.8, 1.4 + bob], [17.2, 3.4 + bob], [16.4, 6.6 + bob], [16.4, 4.4 + bob], [14.4, 2.2 + bob], [12.4, 3.2 + bob], [8.8, 5.6 + bob]];
    const inCone = inPoly(cone);
    fill(g, inCone, (x) => { const u = (x - 7) / 10; return u < 0.32 ? 'H1' : u > 0.7 ? 'H3' : 'H2'; });
    // the gold band round the base of the cone, two pixels deep
    for (let x = 0; x < W; x++) for (const [dy, c] of [[-1.4, x < bcx + 3 ? 'g1' : 'g2'], [-2.2, 'g2']]) { const y = Math.round(by + dy); if (inCone(x + 0.5, y + 0.5)) g[y][x] = c; }
    if (front) { for (const [dx, dy] of [[0.4, -1.6], [-0.6, -1], [-0.8, 0], [-0.4, 1], [0.6, 1.2]]) put(g, 12 + dx, by - 5.4 + dy, 'g1'); }
    if (side) { for (const [dx, dy] of [[0, -1.6], [-0.8, -0.6], [-0.6, 0.6], [0.4, 1.2]]) put(g, 14.6 + dx, by - 5 + dy, 'g1'); }
    // a horn: out from the band, up, and curling back in at the tip; cream with pink stripes
    const horn = (sx, x0, y0) => {
      // a ram's horn: out from the band, up, and curling back toward the hat at the tip; stripes on every other step
      const P = [[0, 0], [1, -0.6], [1.8, -1.6], [2.4, -2.8], [2.4, -4], [1.8, -5], [0.8, -5.4], [0.2, -4.8]];
      P.forEach(([dx, dy], i) => {
        const c = i % 2 ? 'n' : i < 3 ? 'N2' : 'N1';
        put(g, x0 + sx * dx, y0 + dy, c);
        if (i < 5) put(g, x0 + sx * (dx + 1), y0 + dy, i % 2 ? 'n' : 'N2'); // thick at the root
      });
    };
    if (side) { horn(1, 15.6, by - 2); horn(-1, 9.4, by - 2.4); }
    else { horn(-1, 7.4, by - 2); horn(1, 16.6, by - 2); }
    return outline(g);
  }

  const DIRS = ['s', 'n', 'e', 'w'];
  const canvas = document.createElement('canvas'); canvas.width = W * 3 * K; canvas.height = H * 4 * K;
  const cx = canvas.getContext('2d');
  DIRS.forEach((d, row) => {
    for (let f = 0; f < 3; f++) {
      const g = draw(d === 'w' ? 'e' : d, f);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const c = g[y][d === 'w' ? W - 1 - x : x]; if (!c) continue;
        cx.fillStyle = PAL[c]; cx.fillRect((f * W + x) * K, (row * H + y) * K, K, K);
      }
    }
  });
  return { canvas, w: W, h: H, scale: K, foot: [12, 35], frame: (dir, step) => [step * W * K, DIRS.indexOf(dir) * H * K] };
}
