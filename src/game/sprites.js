// sprites.js: the townsfolk and Sol as small pixel walkers drawn in code, in the pixel Io's manner (src/walk/pixel-io.js):
// three tones per mass lit from the upper left, a dark outline, three frames (stand, step A, step B) by four directions
// (s, n, e, w; west mirrored from east). One figure builder makes every look from a few parts: height, skin, hair, a
// robe or a tunic and trousers, an apron, a shawl, a beard, pointed ears, and a hat (a witch's, a cap, a hood, a gnome's
// tall cap). Adults stand about 40 map pixels to Io's 42; children and the Aurosi gnomes are smaller.
// makeFolk(look, scale) -> { canvas, w: 28, h: 42, scale, foot: [14, 41], frame(dir, step) -> [sx, sy] }, the same as
// makePixelIo. Defines window.makeFolk and window.FOLK_LOOKS.
(function () {
  'use strict';
  const W = 28, H = 42;
  // the looks: colors are [lit, mid, shade]
  const LOOKS = {
    // a village witch in a moss-green robe and a dark hat without horns (Nettie, Sorrel)
    witch2: { h: 40, skin: 'fair', hair: ['#d9c08a', '#b39760', '#7d6638'], hairStyle: 'long', robe: ['#5f8f5a', '#456e43', '#2c4a2c'], hat: 'witch', hatC: ['#4a3a5c', '#33284a', '#1f1730'], trim: '#e3c46a' },
    // a broad worker in a leather apron (Hilde the smith, Tobb, Brann, the watchwoman)
    smith: { h: 40, wide: 1.5, skin: 'tan', hair: ['#5a3a26', '#3f2818', '#26170d'], hairStyle: 'short', top: ['#7a8aa8', '#5b6886', '#3b445c'], legs: ['#4a4038', '#352d27', '#221d19'], apron: ['#9a6a42', '#7a5232', '#553820'] },
    // an older townsperson with grey hair and a shawl (Mayor Gretch, Old Wenna, Marta, Old Gil, Ede)
    elder: { h: 38, skin: 'fair', hair: ['#e8e6ee', '#c4c2cc', '#8f8d9a'], hairStyle: 'bun', robe: ['#8a5a7a', '#6c425e', '#472a3e'], shawl: ['#c9a25e', '#a5813f', '#6f5426'] },
    // an old sailor in a blue coat and a cap, with a grey beard (Quill)
    sailor: { h: 40, skin: 'tan', hair: ['#b8b4ae', '#918d88', '#66625e'], hairStyle: 'short', beard: true, top: ['#4f6fa8', '#3a5486', '#25385c'], legs: ['#5a4a3a', '#43372b', '#2b231c'], hat: 'cap', hatC: ['#3f4f6e', '#2c3a54', '#1b2538'] },
    // a child (Pell, Tamsin)
    child: { h: 30, skin: 'fair', hair: ['#c97a3e', '#a35d2a', '#6e3d1a'], hairStyle: 'long', top: ['#d9b44a', '#b8932e', '#7f651c'], legs: ['#6a5a8a', '#4f4369', '#332b45'] },
    // one of the moon's people: pale silver hair, pointed ears, a long coat of moon-blue (Ysmera Brightkeel)
    aurosi: { h: 42, skin: 'pale', hair: ['#d8e0ff', '#aab6ec', '#7480c0'], hairStyle: 'long', ears: true, robe: ['#5d7fd0', '#4462a8', '#2c4074'], trim: '#e8ecff' },
    // an Aurosi gnome of the shipyard in a tall star-blue cap (Pim, Tock)
    gnome: { h: 27, wide: 1.2, skin: 'pale', hair: ['#f0eee6', '#cfcbbe', '#9a968a'], hairStyle: 'short', beard: true, ears: true, top: ['#a0603a', '#7e4a2a', '#55301a'], legs: ['#4a4a5a', '#363645', '#23232e'], hat: 'gnome', hatC: ['#5a72c8', '#4258a0', '#2b3b70'] },
    // Sol, the last Ember Warden: copper hair, sun-gold plate, the burnt-orange tabard, and the midnight-blue cape of her
    // model (the red cloak became blue on October 3, to match it)
    sol: { h: 40, skin: 'tan', hair: ['#e0703a', '#b8522a', '#7e3418'], hairStyle: 'tail', top: ['#e8c25a', '#c49a3a', '#86672a'], legs: ['#c0662e', '#9a4c20', '#663014'], cloak: ['#3b4f96', '#2b3a74', '#1b244c'], sword: true },
    // Dame Halcyon, the Gloam Knight: blackened bronze plate, a tattered teal tabard, a long white braid, a closed helm with
    // a slit of cold blue light for her eyes, and a dark cloak
    halcyon: { h: 42, skin: 'pale', hair: ['#f4f0ea', '#d6d0c6', '#9e978c'], hairStyle: 'tail', top: ['#6e5e4a', '#4c4032', '#2c241c'], legs: ['#2f8f8a', '#22706c', '#14494a'], cloak: ['#2c3a40', '#1e282e', '#11181c'], sword: true, hat: 'helm', hatC: ['#5e5040', '#40362c', '#251f19'] },
    // a hooded figure in grey (spare townsfolk)
    hooded: { h: 39, skin: 'fair', hair: ['#6a5a4a', '#4a3e33', '#2e2620'], hairStyle: 'short', robe: ['#7a7a8a', '#5c5c6b', '#3c3c48'], hat: 'hood', hatC: ['#6e6e80', '#525264', '#363644'] },
  };
  const SKIN = { fair: ['#fde4d1', '#f0c2a5', '#d4987f'], tan: ['#eac39a', '#d1a174', '#a8774f'], pale: ['#f8e8ec', '#e6ccd6', '#bc9fb2'] };

  function makeFolk(lookId, scale) {
    const L = LOOKS[lookId] || LOOKS.hooded, K = scale || 1;
    const grid = () => Array.from({ length: H }, () => new Array(W).fill(null));
    const inb = (x, y) => x >= 0 && x < W && y >= 0 && y < H;
    const px = (g, x, y, c) => { x = Math.round(x); y = Math.round(y); if (inb(x, y)) g[y][x] = c; };
    const fill = (g, test, tone) => { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (test(x + 0.5, y + 0.5)) g[y][x] = typeof tone === 'function' ? tone(x + 0.5, y + 0.5) : tone; };
    const inEll = (cx, cy, rx, ry) => (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
    const inPoly = (pts) => (x, y) => { let ins = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins; } return ins; };
    const tone3 = (C, x0, x1) => (x) => { const u = (x - x0) / Math.max(1e-3, x1 - x0); return u < 0.3 ? C[0] : u > 0.7 ? C[2] : C[1]; };
    const outline = (g) => {
      const o = g.map((r) => r.slice());
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (g[y][x]) continue;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (inb(X, Y) && g[Y][X] && g[Y][X] !== '#1a0c1d') { o[y][x] = '#1a0c1d'; break; } }
      }
      return o;
    };
    const S = SKIN[L.skin] || SKIN.fair;

    function draw(dir, step) {
      const g = grid(), side = dir === 'e', back = dir === 'n', front = dir === 's';
      // heights: feet on row 40; the head's size eases for small folk so they read as small people, not shrunk ones
      const h = L.h, k = h / 40, foot = 40.5, cx = 14, wide = L.wide || 1;
      const bob = step ? 0 : -0.4, sw = step === 1 ? -0.6 : step === 2 ? 0.6 : 0;
      const headR = 5.9 * Math.pow(k, 0.4), headCY = foot - h + headR + 1.2 + bob;
      const neckY = headCY + headR - 0.4, waist = neckY + (foot - neckY) * 0.48, bw = 4.6 * Math.pow(k, 0.8) * wide;
      // ---- feet ----
      const fc = ['#4a3440', '#2f1f29'];
      if (side) { const a = step === 1 ? 1.2 : step === 2 ? -1.2 : 0; fill(g, inPoly([[cx - 2 - a, foot - 3], [cx + 1 - a, foot - 3], [cx + 1.6 - a, foot], [cx - 2.4 - a, foot]]), fc[1]); fill(g, inPoly([[cx - 1 + a, foot - 3], [cx + 2 + a, foot - 3], [cx + 3 + a, foot], [cx - 1.4 + a, foot]]), fc[0]); }
      else { const la = step === 1 ? -1 : 0, ra = step === 2 ? -1 : 0; fill(g, inPoly([[cx - bw * 0.8, foot - 3 + la], [cx - 0.6, foot - 3 + la], [cx - 0.6, foot + la], [cx - bw * 0.85, foot + la]]), fc[0]); fill(g, inPoly([[cx + 0.6, foot - 3 + ra], [cx + bw * 0.8, foot - 3 + ra], [cx + bw * 0.85, foot + ra], [cx + 0.6, foot + ra]]), fc[1]); }
      // ---- a cloak behind (Sol) ----
      if (L.cloak && !front) fill(g, inPoly(side ? [[cx - 3.4, neckY + 0.4], [cx + 0.6, neckY + 0.4], [cx - 1 + sw, foot - 2], [cx - 5.6 + sw, foot - 2.4]] : [[cx - bw - 0.6, neckY + 0.6], [cx + bw + 0.6, neckY + 0.6], [cx + bw + 1.8 + sw, foot - 2], [cx - bw - 1.8 + sw, foot - 2]]), tone3(L.cloak, cx - bw - 1.8, cx + bw + 1.8));
      // ---- the body: a robe to the ground, or a tunic over trousers ----
      if (L.robe) {
        const pts = side ? [[cx - bw * 0.75, neckY + 0.4], [cx + bw * 0.75, neckY + 0.4], [cx + bw * 1.05 + sw, foot - 2], [cx - bw * 1.05 + sw, foot - 2]] : [[cx - bw, neckY + 0.4], [cx + bw, neckY + 0.4], [cx + bw * 1.35 + sw, foot - 2], [cx - bw * 1.35 + sw, foot - 2]];
        fill(g, inPoly(pts), tone3(L.robe, cx - bw * 1.3, cx + bw * 1.3));
        if (L.trim) for (let x = 0; x < W; x++) { const y = Math.round(foot - 2.5); if (g[y][x] && L.robe.includes(g[y][x])) g[y][x] = L.trim; }
        if (L.trim && front) for (let y = Math.ceil(neckY + 1); y < foot - 2.5; y++) px(g, cx, y, L.trim);
      } else {
        // trousers, each leg swinging with the step
        const la = step === 1 ? -1 : 0, ra = step === 2 ? -1 : 0;
        if (side) fill(g, inPoly([[cx - 2, waist], [cx + 2, waist], [cx + 2.2 + sw * 2, foot - 2.6], [cx - 2.2 + sw * 2, foot - 2.6]]), tone3(L.legs, cx - 2, cx + 2));
        else { fill(g, inPoly([[cx - bw * 0.85, waist], [cx - 0.3, waist], [cx - 0.5, foot - 2.6 + la], [cx - bw * 0.8, foot - 2.6 + la]]), L.legs[1]); fill(g, inPoly([[cx + 0.3, waist], [cx + bw * 0.85, waist], [cx + bw * 0.8, foot - 2.6 + ra], [cx + 0.5, foot - 2.6 + ra]]), L.legs[2]); }
        const tb = waist + 2.2 * k;
        fill(g, inPoly(side ? [[cx - bw * 0.7, neckY + 0.3], [cx + bw * 0.7, neckY + 0.3], [cx + bw * 0.8, tb], [cx - bw * 0.8, tb]] : [[cx - bw, neckY + 0.3], [cx + bw, neckY + 0.3], [cx + bw * 1.08, tb], [cx - bw * 1.08, tb]]), tone3(L.top, cx - bw, cx + bw));
        if (L.sword) { for (let y = Math.round(neckY + 1); y < tb; y++) px(g, side ? cx - 1 : cx, y, y === Math.round(waist) ? '#3a2410' : L.top[0]); }
      }
      if (L.apron && !back) fill(g, inPoly(side ? [[cx + 0.6, neckY + 2], [cx + bw * 0.8, neckY + 2], [cx + bw + sw, foot - 4], [cx + 0.6 + sw, foot - 4]] : [[cx - bw * 0.7, neckY + 2.2], [cx + bw * 0.7, neckY + 2.2], [cx + bw * 0.85, foot - 4], [cx - bw * 0.85, foot - 4]]), tone3(L.apron, cx - bw, cx + bw));
      // ---- arms at the sides, a hand at the end of each ----
      const armY0 = neckY + 0.6, armY1 = waist + 1.4 * k, aw = 1.7 * k + 0.4;
      const armC = L.robe || L.top;
      if (side) { fill(g, inPoly([[cx - 0.6, armY0], [cx + aw + 0.4, armY0], [cx + aw + 1 - sw, armY1], [cx - 0.2 - sw, armY1]]), tone3(armC, cx - 0.6, cx + aw + 1)); px(g, cx + aw * 0.4 - sw, armY1 + 0.6, S[1]); }
      else { for (const sx of [-1, 1]) { const x0 = cx + sx * bw, x1 = x0 + sx * aw; fill(g, inPoly([[Math.min(x0, x1), armY0], [Math.max(x0, x1), armY0], [Math.max(x0, x1) + sx * 0.5, armY1], [Math.min(x0, x1) + sx * 0.5, armY1]]), sx < 0 ? armC[0] : armC[2]); if (!back) px(g, (x0 + x1) / 2 + sx * 0.4, armY1 + 0.6, S[sx < 0 ? 0 : 1]); } }
      if (L.shawl) fill(g, inPoly(side ? [[cx - bw * 0.8, neckY], [cx + bw * 0.9, neckY], [cx + bw, neckY + 3.6], [cx - bw * 0.9, neckY + 3.6]] : [[cx - bw - 0.6, neckY], [cx + bw + 0.6, neckY], [cx + bw * 0.6, neckY + 4.4], [cx, neckY + 5.4], [cx - bw * 0.6, neckY + 4.4]]), tone3(L.shawl, cx - bw, cx + bw));
      // ---- hair behind, then the face, then hair in front ----
      const hc = L.hair, hx = side ? cx + 0.6 : cx;
      if (L.hairStyle === 'long' || L.hairStyle === 'tail') {
        if (back) fill(g, inPoly([[cx - headR - 0.2, headCY], [cx + headR + 0.2, headCY], [cx + headR, headCY + headR * 1.9], [cx - headR, headCY + headR * 1.9]]), tone3(hc, cx - headR, cx + headR));
        else if (side) fill(g, inPoly([[hx - headR - 0.4, headCY - 1], [hx + 0.4, headCY - 1], [hx - 0.4, headCY + headR * (L.hairStyle === 'tail' ? 2.4 : 1.8)], [hx - headR - 0.8, headCY + headR * 1.6]]), tone3(hc, hx - headR, hx));
        else for (const sx of [-1, 1]) fill(g, inPoly([[cx + sx * (headR - 1.4), headCY - 1], [cx + sx * (headR + 0.6), headCY - 1], [cx + sx * (headR + 0.4), headCY + headR * 1.6], [cx + sx * (headR - 1.2), headCY + headR * 1.5]]), sx < 0 ? hc[0] : hc[2]);
      }
      if (back) fill(g, inEll(cx, headCY, headR, headR * 1.02), tone3(hc, cx - headR, cx + headR));
      else {
        fill(g, side ? (x, y) => inEll(hx, headCY, headR * 0.92, headR)(x, y) : inEll(cx, headCY, headR, headR), tone3(S, hx - headR, hx + headR));
        // hair on top and a fringe
        fill(g, (x, y) => inEll(hx - (side ? 0.8 : 0), headCY - 0.6, headR + 0.2, headR * 0.98)(x, y) && (y < headCY - headR * 0.25 || (side && x < hx - headR * 0.25)), tone3(hc, hx - headR, hx + headR));
        if (L.hairStyle === 'bun') fill(g, inEll(hx - (side ? 1.4 : 0), headCY - headR - 0.4, 1.8, 1.4), hc[1]);
        // eyes, cheeks
        const ey = Math.round(headCY + 0.4);
        if (front) { for (const sx of [-2, 2]) { px(g, cx + sx, ey, '#2a1a20'); px(g, cx + sx, ey + 1, '#2a1a20'); px(g, cx + sx - 1, ey, '#f6eadf'); } px(g, cx, ey + 3, '#c9566a'); px(g, cx - 3.4, ey + 2, '#f2a3a3'); px(g, cx + 3.4, ey + 2, '#f2a3a3'); }
        else { px(g, hx + headR * 0.5, ey, '#2a1a20'); px(g, hx + headR * 0.5, ey + 1, '#2a1a20'); px(g, hx + headR * 0.75, ey + 3, '#c9566a'); }
        if (L.beard) fill(g, (x, y) => inEll(hx + (side ? 1 : 0), headCY + headR * 0.75, headR * (side ? 0.6 : 0.85), headR * 0.6)(x, y) && y > headCY + 1.2, tone3(hc, hx - headR, hx + headR));
      }
      if (L.hairStyle === 'tail' && !front) fill(g, inPoly(side ? [[hx - headR - 0.6, headCY - 1], [hx - headR + 1.2, headCY - 1], [hx - headR - 0.6 + sw, headCY + headR * 2.6], [hx - headR - 2.2 + sw, headCY + headR * 2.2]] : [[cx - 1.2, headCY], [cx + 1.2, headCY], [cx + 1 + sw, headCY + headR * 2.4], [cx - 1 + sw, headCY + headR * 2.4]]), hc[1]);
      if (L.ears && !back) { if (side) px(g, hx - headR * 0.4, headCY - 0.6, S[1]); else { px(g, cx - headR - 0.6, headCY - 0.4, S[0]); px(g, cx + headR + 0.6, headCY - 0.4, S[1]); } }
      // ---- hats ----
      const hatC = L.hatC, top = headCY - headR;
      if (L.hat === 'witch') {
        fill(g, inEll(hx, top + 1.6, headR + 3.6, 1.6), tone3(hatC, hx - headR - 3, hx + headR + 3));
        fill(g, inPoly([[hx - headR + 0.6, top + 1.2], [hx + headR - 0.6, top + 1.2], [hx + 2.4, top - 4], [hx + 4.6, top - 6.4], [hx + 0.6, top - 4.6]]), tone3(hatC, hx - headR, hx + headR));
        for (let x = Math.round(hx - headR + 1); x <= hx + headR - 1; x++) px(g, x, top, L.trim || '#e3c46a');
      } else if (L.hat === 'cap') {
        fill(g, inEll(hx, top + 0.8, headR + 0.6, 2.2), tone3(hatC, hx - headR, hx + headR));
        if (!back) fill(g, inPoly(side ? [[hx, top + 1.4], [hx + headR + 2.6, top + 1.6], [hx + headR + 2.4, top + 2.6], [hx, top + 2.4]] : [[hx - headR + 1, top + 2], [hx + headR - 1, top + 2], [hx + headR - 0.4, top + 3], [hx - headR + 0.4, top + 3]]), hatC[2]);
      } else if (L.hat === 'hood') {
        fill(g, (x, y) => inEll(hx - (side ? 0.6 : 0), headCY - 0.2, headR + 1.2, headR + 1.2)(x, y) && (back || (side ? x < hx + headR * 0.2 || y < headCY - headR * 0.4 : Math.abs(x - cx) > headR * 0.62 || y < headCY - headR * 0.5)), tone3(hatC, hx - headR, hx + headR));
      } else if (L.hat === 'helm') {
        // a closed helm, a slit of cold blue for her eyes, and a crest of dark feathers
        fill(g, (x, y) => inEll(hx - (side ? 0.4 : 0), headCY - 0.3, headR + 0.6, headR + 0.5)(x, y) && y < headCY + headR * 0.8, tone3(hatC, hx - headR, hx + headR));
        if (!back) { const ey = Math.round(headCY + 0.4); if (side) { for (let x = Math.round(hx); x <= hx + headR - 0.4; x++) px(g, x, ey, '#9fd8ff'); } else for (let x = Math.round(cx - 3); x <= cx + 3; x++) px(g, x, ey, '#9fd8ff'); }
        fill(g, inPoly(side ? [[hx - 1.2, top - 0.2], [hx + 1, top - 0.2], [hx - 2.6, top - 4.2], [hx - 4.4, top - 3.6]] : [[hx - 1.1, top - 0.2], [hx + 1.1, top - 0.2], [hx + 0.7, top - 4.8], [hx - 0.7, top - 4.8]]), '#1f2b2e');
      } else if (L.hat === 'gnome') {
        fill(g, inPoly([[hx - headR - 0.8, top + 2.2], [hx + headR + 0.8, top + 2.2], [hx + 1.2, top - 7.5], [hx - 0.6, top - 7]]), tone3(hatC, hx - headR, hx + headR));
        px(g, hx + 1, top - 8, '#ffe39a');
      }
      return outline(g);
    }

    const DIRS = ['s', 'n', 'e', 'w'];
    const canvas = document.createElement('canvas'); canvas.width = W * 3 * K; canvas.height = H * 4 * K;
    const c2 = canvas.getContext('2d');
    DIRS.forEach((d, row) => {
      for (let f = 0; f < 3; f++) {
        const gr = draw(d === 'w' ? 'e' : d, f);
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const c = gr[y][d === 'w' ? W - 1 - x : x]; if (!c) continue; c2.fillStyle = c; c2.fillRect((f * W + x) * K, (row * H + y) * K, K, K); }
      }
    });
    return { canvas, w: W, h: H, scale: K, foot: [W / 2, H - 1], frame: (dir, step) => [step * W * K, DIRS.indexOf(dir) * H * K] };
  }
  window.makeFolk = makeFolk;
  window.FOLK_LOOKS = LOOKS;
})();
