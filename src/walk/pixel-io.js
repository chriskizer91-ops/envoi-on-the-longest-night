// pixel-io.js: Io, the Witch, as a 16 x 24 pixel walker drawn entirely in code, after her 3D look: the magenta hat
// with its curled cream horns and gold moon, wavy chestnut hair, round black glasses, the magenta robe over a dark
// bodice, and dark boots. Shapes are filled into a palette grid, then outlined, then each frame is painted to a canvas.
// makePixelIo(scale) -> { canvas, w: 16, h: 24, scale, foot: [8, 23], frame(dir, step) -> [sx, sy] }
//   the canvas holds 3 frames (stand, step A, step B) across x 4 rows (s, n, e, w), each 16 x 24 art px x scale.
// The style follows the Aethermoor walkers (New-game, claude/cool-ptolemy-uc93gg, game/src/art/walkers.js): 16 x 24,
// three frames, four directions, west mirrored from east. The drawing itself is new.
function makePixelIo(scale) {
  'use strict';
  const W = 16, H = 24, K = scale || 2;
  const PAL = {
    o: '#1c0f1e', // outline
    H: '#b0237a', h: '#7c1656', // hat
    g: '#f0c25a', // gold band and moon
    N: '#f4e6cf', n: '#d99ab0', // horns, cream with pink stripes
    B: '#7a4a2c', b: '#55301c', // hair
    S: '#f6d4bd', s: '#dcae95', // skin
    G: '#16101a', // glasses
    R: '#c02c79', r: '#861b55', // robe
    D: '#2e1a33', // bodice
    F: '#3b2431', // boots
  };
  const grid = () => Array.from({ length: H }, () => new Array(W).fill(''));
  const put = (g, x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && x < W && y >= 0 && y < H) g[y][x] = c; };
  const ell = (g, cx, cy, rx, ry, c, test) => { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1 && (!test || test(x, y))) g[y][x] = c; } };
  const poly = (g, pts, c) => { // even-odd fill at pixel centres
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const px = x + 0.5, py = y + 0.5; let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) inside = !inside; }
      if (inside) g[y][x] = c;
    }
  };
  const outline = (g) => {
    const o = grid();
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (g[y][x]) { o[y][x] = g[y][x]; continue; }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X >= 0 && X < W && Y >= 0 && Y < H && g[Y][X] && g[Y][X] !== 'o') { o[y][x] = 'o'; break; } }
    }
    return o;
  };

  // dir: 's' (toward the viewer), 'n' (away), 'e' (to the right); step: 0 stand, 1 left foot forward, 2 right foot forward
  function draw(dir, step) {
    const g = grid(), side = dir === 'e', back = dir === 'n';
    const bob = step ? -0.4 : 0;
    // boots, under the hem; a step lifts one and swings the hem
    const lift = (k) => (step === k ? -1 : 0);
    if (side) { const a = step === 1 ? 1 : step === 2 ? -1 : 0; poly(g, [[6 + a, 20], [8.5 + a, 20], [9 + a, 23], [5.5 + a, 23]], 'F'); poly(g, [[7 - a, 20], [9.5 - a, 20], [10 - a, 23], [6.5 - a, 23]], 'F'); }
    else { poly(g, [[4.6, 20 + lift(1)], [7.4, 20 + lift(1)], [7.4, 23 + lift(1)], [4.6, 23 + lift(1)]], 'F'); poly(g, [[8.6, 20 + lift(2)], [11.4, 20 + lift(2)], [11.4, 23 + lift(2)], [8.6, 23 + lift(2)]], 'F'); }
    // the robe: a bell from the shoulders to just above the boots
    const sw = step === 1 ? 0.5 : step === 2 ? -0.5 : 0;
    if (side) poly(g, [[6, 12.6 + bob], [10.4, 12.6 + bob], [11.6 + sw, 21], [4.6 + sw, 21]], 'R');
    else poly(g, [[4.3, 12.6 + bob], [11.7, 12.6 + bob], [13 + sw, 21], [3 + sw, 21]], 'R');
    // shading down the robe's left side, and a dark bodice in front
    for (let y = 13; y < 21; y++) { if (side) put(g, 5.2 + sw * (y - 13) / 8, y, 'r'); else { put(g, 3.6 + sw * (y - 13) / 8 + (21 - y) * 0.13, y, 'r'); } }
    if (dir === 's') { poly(g, [[6.6, 12.8 + bob], [9.4, 12.8 + bob], [9, 17 + bob], [7, 17 + bob]], 'D'); put(g, 8, 13 + bob, 'g'); }
    if (side) poly(g, [[9.4, 12.8 + bob], [10.6, 12.8 + bob], [10.4, 16.5 + bob], [9.4, 16.5 + bob]], 'D');
    // arms: sleeves along the sides, hands at the cuffs
    if (side) { poly(g, [[7, 13 + bob], [9, 13 + bob], [9.6, 17.5 + bob], [7.4, 17.5 + bob]], 'r'); put(g, 8.6, 17.6 + bob, 'S'); }
    else { for (const sx of [-1, 1]) { const x0 = sx < 0 ? 3.2 : 11, x1 = sx < 0 ? 5 : 12.8; poly(g, [[x0 + (sx < 0 ? 0.6 : 0), 13 + bob], [x1 - (sx < 0 ? 0 : 0.6), 13 + bob], [x1 + sx * 0.2, 17.6 + bob], [x0 + sx * 0.2, 17.6 + bob]], 'r'); put(g, sx < 0 ? 4 : 12, 17.8 + bob, 'S'); } }
    // the head and face
    const hx = side ? 8.6 : 8, hy = 10.6 + bob;
    ell(g, hx, hy, side ? 3.2 : 3.8, 3.2, 'S');
    // the hair: a cap with wavy locks to the shoulders (it covers the face from behind)
    if (back) { ell(g, hx, hy - 0.2, 4.2, 3.7, 'B'); poly(g, [[3.6, 10 + bob], [12.4, 10 + bob], [12.6, 15 + bob], [10, 14 + bob], [8, 15.4 + bob], [6, 14 + bob], [3.4, 15 + bob]], 'B'); for (let y = 11; y < 15; y++) put(g, 8, y + bob, 'b'); }
    else if (side) { ell(g, hx - 1.2, hy - 0.6, 3.6, 3.4, 'B', (x, y) => x < hx + 0.6 || y < hy - 1.6); poly(g, [[5, 10 + bob], [8.4, 10 + bob], [8.2, 15 + bob], [5.6, 15.4 + bob], [4.4, 13 + bob]], 'B'); put(g, 6, 13 + bob, 'b'); put(g, 7, 14 + bob, 'b'); }
    else { ell(g, hx, hy - 2.3, 4.2, 1.9, 'B'); poly(g, [[3.6, 9.6 + bob], [5.2, 9.6 + bob], [5.4, 14.6 + bob], [3.4, 15 + bob]], 'B'); poly(g, [[10.8, 9.6 + bob], [12.4, 9.6 + bob], [12.6, 15 + bob], [10.6, 14.6 + bob]], 'B'); put(g, 4, 13 + bob, 'b'); put(g, 12, 12 + bob, 'b'); for (const x of [6, 9]) put(g, x, 8.6 + bob, 'b'); }
    // the round glasses and a soft cheek
    if (dir === 's') { for (const x of [5, 6, 9, 10]) put(g, x, 10.6 + bob, 'G'); put(g, 6, 9.6 + bob, 'G'); put(g, 9, 9.6 + bob, 'G'); put(g, 5, 11.6 + bob, 's'); put(g, 10, 11.6 + bob, 's'); put(g, 7.5, 12.4 + bob, 's'); }
    if (side) { put(g, 10.4, 10.6 + bob, 'G'); put(g, 9.4, 10.6 + bob, 'G'); put(g, 10.4, 9.6 + bob, 'G'); put(g, 10.6, 11.8 + bob, 's'); }
    // the hat: a wide brim, a tall leaning cone, a gold band with the moon, and the two curled horns
    const by = 7.0 + bob;
    ell(g, side ? 8.4 : 8, by, side ? 6.4 : 6.6, 1.5, 'H'); ell(g, side ? 8.4 : 8, by + 0.5, side ? 6 : 6.2, 0.9, 'h');
    poly(g, [[side ? 5.6 : 4.8, by], [side ? 11 : 11.2, by], [side ? 9.8 : 10, 3 + bob], [side ? 7.2 : 9.6, 0.4 + bob], [side ? 6.8 : 8.2, 0.2 + bob], [side ? 6.6 : 6.2, 3.4 + bob]], 'H');
    for (let y = 1; y < 7; y++) put(g, side ? 6.6 + (7 - y) * 0.05 : 6.3 + (7 - y) * 0.2, y + bob, 'h');
    for (let x = side ? 5.6 : 5; x <= (side ? 10.8 : 11); x++) put(g, x, by - 1.1, 'g');
    if (dir === 's') put(g, 8, by - 2.4, 'g');
    if (side) put(g, 10.2, by - 2.2, 'g');
    // each horn curls out from the band, up, and back in at the tip
    const horn = (sx, x0) => { put(g, x0, by - 1.4, 'N'); put(g, x0 + sx, by - 1.6, 'N'); put(g, x0 + sx * 1.8, by - 2.4, 'n'); put(g, x0 + sx * 2.2, by - 3.4, 'N'); put(g, x0 + sx * 1.8, by - 4.4, 'N'); put(g, x0 + sx * 1, by - 4.6, 'n'); };
    if (side) { horn(1, 10.6); horn(-1, 5.8); } else { horn(-1, 5); horn(1, 11); }
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
  return { canvas, w: W, h: H, scale: K, foot: [8, 23], frame: (dir, step) => [step * W * K, DIRS.indexOf(dir) * H * K] };
}
