 // ---------- painted textures ----------
 // Each surface is painted twice in step: its colour, and a height field (white stands up, black sinks) that becomes its
 // normal map, so ridges, fissures and veins catch the moonlight where they really are.
 const TS = DET > .6 ? 1 : .5;                         // texture size: halved below detail .6
 const css = (r, g, b, a) => `rgba(${r | 0},${g | 0},${b | 0},${a === undefined ? 1 : a})`;
 const hgt = (v, a) => css(v * 255, v * 255, v * 255, a === undefined ? 1 : a);
 function pair(W, H, col, h0) {
  const c = cvs(W, H), g = c.getContext('2d'), hc = cvs(W, H), h = hc.getContext('2d');
  g.fillStyle = col; g.fillRect(0, 0, W, H); h.fillStyle = hgt(h0 === undefined ? .5 : h0); h.fillRect(0, 0, W, H);
  return { c, g, hc, h, W, H };
 }
 // draw f(ctx, ox, oy) once per neighbouring tile, so marks that cross an edge come back on the other side
 const tiled = (W, H, f) => { for (const ox of [-W, 0, W]) for (const oy of [-H, 0, H]) f(ox, oy); };
 // a tiling normal map from a height canvas (k: how deep)
 function normalFrom(src, k) {
  const W = src.width, H = src.height, s = src.getContext('2d').getImageData(0, 0, W, H).data, h = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) h[i] = s[i * 4] / 255;
  const c = cvs(W, H), g = c.getContext('2d'), img = g.createImageData(W, H), d = img.data;
  const at = (x, y) => h[((y + H) % H) * W + (x + W) % W];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
   const dx = at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x - 1, y) - at(x - 1, y + 1);
   const dy = at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1);
   const nx = -dx * k, ny = dy * k, l = Math.hypot(nx, ny, 1), i = (y * W + x) * 4;
   d[i] = (nx / l * .5 + .5) * 255; d[i + 1] = (ny / l * .5 + .5) * 255; d[i + 2] = (1 / l * .5 + .5) * 255; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0); return c;
 }
 const blur = (cv, px) => { const c = cvs(cv.width, cv.height), g = c.getContext('2d'); g.filter = 'blur(' + px + 'px)'; tiled(cv.width, cv.height, (ox, oy) => g.drawImage(cv, ox, oy)); g.filter = 'none'; return c; };

 // young cane bark: wine-plum, streaked along its length, with the bluish waxy bloom blackberry canes wear (rubbed thin on
 // the ridges), pale lenticels across it and a few healed splits. u runs round the cane (its five ridges are geometry),
 // v along it
 const BARK = (() => {
  const W = 512 * TS, H = 1024 * TS, P = pair(W, H, css(60 * DARK, 23 * DARK, 31 * DARK)), g = P.g, h = P.h, k = TS;
  const streak = (x, w, col, a, hv, ha) => tiled(W, H, (ox) => {
   const gr = g.createLinearGradient(x + ox - w, 0, x + ox + w, 0); gr.addColorStop(0, css(...col, 0)); gr.addColorStop(.5, css(...col, a)); gr.addColorStop(1, css(...col, 0)); g.fillStyle = gr; g.fillRect(x + ox - w, 0, w * 2, H);
   if (ha) { const hr = h.createLinearGradient(x + ox - w, 0, x + ox + w, 0); hr.addColorStop(0, hgt(hv, 0)); hr.addColorStop(.5, hgt(hv, ha)); hr.addColorStop(1, hgt(hv, 0)); h.fillStyle = hr; h.fillRect(x + ox - w, 0, w * 2, H); }
  });
  const tones = [[86, 34, 40], [34, 12, 18], [70, 58, 40], [104, 48, 44], [50, 18, 32], [62, 30, 50]];
  for (let i = 0; i < 70; i++) streak(rnd() * W, (1 + rnd() * 7) * k, tones[i % 6].map((v) => v * DARK), .12 + rnd() * .22, rnd() < .5 ? .6 : .4, .2);
  // mottling, so no streak runs too evenly
  for (let i = 0; i < 500 * TS; i++) { const x = rnd() * W, y = rnd() * H, r = (6 + rnd() * 30) * k, c = rnd() < .5 ? 'rgba(20,6,12,.12)' : 'rgba(110,60,60,.07)'; tiled(W, H, (ox, oy) => { g.fillStyle = c; g.beginPath(); g.ellipse(x + ox, y + oy, r * .5, r * 1.6, 0, 0, TAU); g.fill(); }); }
  // the waxy bloom: long soft bluish-grey bands
  for (let i = 0; i < 26; i++) { const x = rnd() * W, y = rnd() * H, w = (10 + rnd() * 40) * k, l = (80 + rnd() * 380) * k; tiled(W, H, (ox, oy) => { const q = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, w); q.addColorStop(0, css(126, 116, 140, .12)); q.addColorStop(1, css(126, 116, 140, 0)); g.save(); g.translate(x + ox, y + oy); g.scale(1, l / w); g.translate(-x - ox, -y - oy); g.fillStyle = q; g.fillRect(x + ox - w, y + oy - w, w * 2, w * 2); g.restore(); }); }
  // fine fibres
  g.lineCap = h.lineCap = 'round';
  for (let i = 0; i < 900; i++) {
   const x = rnd() * W, y = rnd() * H, l = (20 + rnd() * 120) * k, dk = rnd() < .55, w = (.5 + rnd() * 1.1) * k;
   tiled(W, H, (ox, oy) => {
    g.strokeStyle = dk ? 'rgba(24,8,14,.22)' : 'rgba(150,96,96,.08)'; g.lineWidth = w; g.beginPath(); g.moveTo(x + ox, y + oy); g.bezierCurveTo(x + ox + (rnd() - .5) * 3, y + oy + l * .3, x + ox + (rnd() - .5) * 3, y + oy + l * .7, x + ox, y + oy + l); g.stroke();
    h.strokeStyle = dk ? 'rgba(0,0,0,.18)' : 'rgba(255,255,255,.12)'; h.lineWidth = w * 1.4; h.beginPath(); h.moveTo(x + ox, y + oy); h.lineTo(x + ox, y + oy + l); h.stroke();
   });
  }
  // lenticels: short pale dashes across the cane, raised, each with a dark lip below
  for (let i = 0; i < 420 * TS; i++) {
   const x = rnd() * W, y = rnd() * H, w = (3 + rnd() * 7) * k, t = (1 + rnd() * 1.2) * k;
   tiled(W, H, (ox, oy) => { g.fillStyle = 'rgba(176,140,120,.45)'; g.beginPath(); g.ellipse(x + ox, y + oy, w, t, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(20,6,10,.3)'; g.fillRect(x + ox - w * .8, y + oy + t, w * 1.6, t * .8); h.fillStyle = hgt(.9, .8); h.beginPath(); h.ellipse(x + ox, y + oy, w, t, 0, 0, TAU); h.fill(); });
  }
  // healed splits: short dark lens-shaped cracks with paler lips
  for (let i = 0; i < 26; i++) {
   const x = rnd() * W, y = rnd() * H, l = (30 + rnd() * 70) * k, w = (2 + rnd() * 3) * k;
   tiled(W, H, (ox, oy) => { g.fillStyle = 'rgba(150,110,96,.35)'; g.beginPath(); g.ellipse(x + ox, y + oy, w * 2.2, l * .55, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(16,6,8,.85)'; g.beginPath(); g.ellipse(x + ox, y + oy, w * .6, l * .5, 0, 0, TAU); g.fill(); h.fillStyle = hgt(.7, .6); h.beginPath(); h.ellipse(x + ox, y + oy, w * 2.2, l * .55, 0, 0, TAU); h.fill(); h.fillStyle = hgt(.05, 1); h.beginPath(); h.ellipse(x + ox, y + oy, w * .6, l * .5, 0, 0, TAU); h.fill(); });
  }
  // nodes: faint rings where a leaf once grew
  for (const ny of [.1, .43, .77]) { const y = ny * H, gr = g.createLinearGradient(0, y - 14 * k, 0, y + 14 * k); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.5, 'rgba(28,8,16,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, y - 14 * k, W, 28 * k); h.fillStyle = hgt(.62, .5); h.fillRect(0, y - 4 * k, W, 8 * k); }
  return { map: tex(P.c, 1, 1), normal: dataTex(normalFrom(blur(P.hc, .7 * k), 3.2), 1, 1) };
 })();
 // old bark, for the spire, the great canes' bases and the dead canes: grey-brown, split into long plates by deep
 // fissures, the plates' edges lifting and flaking, with crusts of grey-green lichen
 const OLDBARK = (() => {
  const W = 512 * TS, H = 1024 * TS, P = pair(W, H, css(92 * DARK, 78 * DARK, 70 * DARK), .62), g = P.g, h = P.h, k = TS;
  for (let i = 0; i < 1600 * TS; i++) { const x = rnd() * W, y = rnd() * H, s = (2 + rnd() * 9) * k, c = rnd() < .5 ? 'rgba(60,46,40,.25)' : 'rgba(150,134,120,.16)'; tiled(W, H, (ox, oy) => { g.fillStyle = c; g.fillRect(x + ox, y + oy, s * .4, s * 2.5); }); }
  // fissures: long wandering dark grooves, each drawn as a dark core in a soft groove
  g.lineCap = h.lineCap = 'round'; g.lineJoin = h.lineJoin = 'round';
  for (let i = 0; i < 46; i++) {
   const pts = []; let x = rnd() * W, y = -40 * k; const w = (2 + rnd() * 5) * k;
   while (y < H + 40 * k) { pts.push([x, y]); y += (10 + rnd() * 26) * k; x += (rnd() - .5) * 14 * k; }
   const line = (ctx, ox, wd) => { ctx.beginPath(); pts.forEach((p, j) => (j ? ctx.lineTo(p[0] + ox, p[1]) : ctx.moveTo(p[0] + ox, p[1]))); ctx.lineWidth = wd; ctx.stroke(); };
   for (const ox of [-W, 0, W]) { g.strokeStyle = 'rgba(40,30,26,.5)'; line(g, ox, w * 2.6); g.strokeStyle = 'rgba(14,10,9,.95)'; line(g, ox, w); h.strokeStyle = hgt(.3, .7); line(h, ox, w * 3.2); h.strokeStyle = hgt(0, 1); line(h, ox, w * 1.1); }
  }
  // the plates' lifted edges (a light rim on one side) and crossing cracks
  for (let i = 0; i < 260 * TS; i++) { const x = rnd() * W, y = rnd() * H, l = (8 + rnd() * 26) * k; tiled(W, H, (ox, oy) => { g.strokeStyle = 'rgba(186,170,150,.4)'; g.lineWidth = 1.4 * k; g.beginPath(); g.moveTo(x + ox, y + oy); g.lineTo(x + ox + l, y + oy + (rnd() - .5) * 4 * k); g.stroke(); g.strokeStyle = 'rgba(12,8,8,.6)'; g.lineWidth = 1.2 * k; g.beginPath(); g.moveTo(x + ox, y + oy + 2 * k); g.lineTo(x + ox + l, y + oy + 2 * k); g.stroke(); h.strokeStyle = hgt(.12, .9); h.lineWidth = 2 * k; h.beginPath(); h.moveTo(x + ox, y + oy + 2 * k); h.lineTo(x + ox + l, y + oy + 2 * k); h.stroke(); }); }
  // lichen: pale grey-green crusts with a darker ring
  for (let i = 0; i < 70 * TS; i++) { const x = rnd() * W, y = rnd() * H, r = (6 + rnd() * 22) * k; tiled(W, H, (ox, oy) => { const q = g.createRadialGradient(x + ox, y + oy, r * .2, x + ox, y + oy, r); q.addColorStop(0, 'rgba(150,160,124,.55)'); q.addColorStop(.75, 'rgba(118,130,96,.45)'); q.addColorStop(1, 'rgba(118,130,96,0)'); g.fillStyle = q; g.fillRect(x + ox - r, y + oy - r, r * 2, r * 2); h.fillStyle = hgt(.7, .3); h.beginPath(); h.arc(x + ox, y + oy, r * .8, 0, TAU); h.fill(); }); }
  return { map: tex(P.c, 1, 1), normal: dataTex(normalFrom(blur(P.hc, .8 * k), 4), 1, 1) };
 })();
 // root wood: grey-brown fibres twisting round old roots, soil in the crevices, moss here and there
 const WOOD = (() => {
  const W = 512 * TS, H = 512 * TS, P = pair(W, H, '#4c3a2c', .5), g = P.g, h = P.h, k = TS;
  g.lineCap = h.lineCap = 'round';
  for (let i = 0; i < 260; i++) {
   const x = rnd() * W, col = rnd(), wd = (1 + rnd() * 5) * k, hv = col < .45 ? .15 : .8;
   g.strokeStyle = col < .45 ? 'rgba(22,15,10,.32)' : col < .8 ? 'rgba(112,88,64,.22)' : 'rgba(150,128,100,.16)';
   h.strokeStyle = hgt(hv, .5);
   // a 45-degree twist with a wobble that repeats every H, so the texture tiles both ways
   for (const ox of [-2 * W, -W, 0, W]) for (const ctx of [g, h]) { ctx.lineWidth = ctx === h ? wd * 1.3 : wd; ctx.beginPath(); for (let y = 0; y <= H; y += 4 * k) { const xx = x + ox + y + Math.sin(y * TAU / H * 3 + i) * 5 * k; if (y) ctx.lineTo(xx, y); else ctx.moveTo(xx, y); } ctx.stroke(); }
  }
  for (let i = 0; i < 2600 * TS; i++) { g.fillStyle = rnd() < .6 ? 'rgba(0,0,0,.2)' : 'rgba(170,140,110,.1)'; g.fillRect(rnd() * W, rnd() * H, k, (2 + rnd() * 5) * k); }
  for (let i = 0; i < 160; i++) { const x = rnd() * W, y = rnd() * H, r = (10 + rnd() * 40) * k, c = rnd() < .5 ? 'rgba(18,12,8,.18)' : 'rgba(120,100,80,.1)'; tiled(W, H, (ox, oy) => { g.fillStyle = c; g.beginPath(); g.arc(x + ox, y + oy, r, 0, TAU); g.fill(); }); }
  for (let i = 0; i < 70 * MOSS; i++) { const x = rnd() * W, y = rnd() * H, r = (8 + rnd() * 26) * k; tiled(W, H, (ox, oy) => { const q = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r); q.addColorStop(0, 'rgba(78,100,44,.6)'); q.addColorStop(1, 'rgba(78,100,44,0)'); g.fillStyle = q; g.fillRect(x - r + ox, y - r + oy, r * 2, r * 2); }); }
  return { map: tex(P.c, 1, 1), normal: dataTex(normalFrom(blur(P.hc, .8 * k), 3.4), 1, 1) };
 })();

 // leaflets: an atlas of four, each in its own square with its base at the bottom middle and its tip at the top, the shape
 // in the alpha (doubly toothed, the long point blackberry leaflets have): 0 a dark glossy winter-green one, 1 one turned
 // wine-red by the cold, 2 a young bronze one, 3 a dead brown one with holes. The underside is the shader's (paler, felted)
 const LEAF = (() => {
  const S = 1024 * TS, k = TS, c = cvs(S * 2, S * 2), g = c.getContext('2d'), hc = cvs(S * 2, S * 2), h = hc.getContext('2d');
  h.fillStyle = hgt(.5); h.fillRect(0, 0, S * 2, S * 2);
  const PAL = [
   { d: [18, 36, 20], m: [34, 64, 32], l: [66, 104, 48], v: [118, 156, 86], e: [60, 30, 40] },
   { d: [52, 12, 26], m: [92, 24, 40], l: [128, 52, 58], v: [166, 104, 96], e: [40, 8, 20] },
   { d: [64, 30, 14], m: [104, 58, 26], l: [146, 98, 50], v: [188, 150, 96], e: [80, 34, 20] },
   { d: [54, 38, 22], m: [88, 64, 36], l: [120, 92, 56], v: [150, 122, 80], e: [60, 40, 24] }];
  for (let cell = 0; cell < 4; cell++) {
   const P = PAL[cell], ox = (cell % 2) * S, oy = Math.floor(cell / 2) * S, len = S * .94, wid = S * .6, x0 = ox + S / 2, y0 = oy + S - S * .03;
   const teeth = 22, half = (f) => .5 * wid * Math.pow(Math.sin(PI * Math.pow(f, .72)), .8) * (1 - .3 * Math.pow(f, 4)) * (f > .86 ? 1 - .55 * sm(.86, 1, f) : 1);
   const tooth = (f, sd) => { const q = f * teeth + (sd > 0 ? 0 : .5), fr = q - Math.floor(q), big = Math.floor(q) % 2 === 0; return f < .05 || f > .97 ? 0 : wid * (big ? .05 : .028) * Math.pow(fr, 1.8); };
   const pts = []; const N = 220;
   for (let i = 0; i <= N; i++) { const f = i / N; pts.push([half(f) + tooth(f, 1), f * len]); }
   for (let i = N; i >= 0; i--) { const f = i / N; pts.push([-half(f) - tooth(f, -1), f * len]); }
   const path = (ctx) => { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(x0 + p[0], y0 - p[1]) : ctx.moveTo(x0 + p[0], y0 - p[1]))); ctx.closePath(); };
   g.save(); h.save(); path(g); g.clip(); path(h); h.clip();
   const gr = g.createLinearGradient(0, y0, 0, y0 - len); gr.addColorStop(0, css(...P.d)); gr.addColorStop(.3, css(...P.m)); gr.addColorStop(1, css(...P.m.map((v, i) => lerp(v, P.l[i], .3))));
   g.fillStyle = gr; g.fillRect(ox, oy, S, S);
   // blistered tissue between the veins: each panel bulges (light in colour, high in height) and creases at the veins
   const nv = 10, lat = [];
   for (let q = 0; q < nv; q++) { const f = .06 + q / nv * .84; lat.push(f); }
   for (const f of lat) for (const sd of [-1, 1]) {
    const hw = half(f + .04), bx = x0 + sd * hw * .5, by = y0 - (f + .05) * len, r = Math.max(4, hw * .5);
    let q = g.createRadialGradient(bx, by, 0, bx, by, r); q.addColorStop(0, css(...P.l, .4)); q.addColorStop(1, css(...P.l, 0)); g.fillStyle = q; g.fillRect(bx - r, by - r, r * 2, r * 2);
    q = h.createRadialGradient(bx, by, 0, bx, by, r); q.addColorStop(0, hgt(.85, .8)); q.addColorStop(1, hgt(.5, 0)); h.fillStyle = q; h.fillRect(bx - r, by - r, r * 2, r * 2);
   }
   // mottling, and the cold's wine-dark blotches on the green
   for (let i = 0; i < 260; i++) { const x = ox + rnd() * S, y = oy + rnd() * S, r = (2 + rnd() * 9) * k; g.fillStyle = rnd() < .5 ? css(...P.d, .16) : css(...P.l, .1); g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
   if (cell === 0) for (let i = 0; i < 9; i++) { const x = ox + rr(.2, .8) * S, y = oy + rr(.1, .7) * S, r = rr(30, 90) * k, q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, 'rgba(86,20,50,.45)'); q.addColorStop(1, 'rgba(86,20,50,0)'); g.fillStyle = q; g.fillRect(x - r, y - r, r * 2, r * 2); }
   if (cell === 1) for (let i = 0; i < 6; i++) { const x = ox + rr(.25, .75) * S, y = oy + rr(.2, .8) * S, r = rr(40, 100) * k, q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, 'rgba(60,52,24,.35)'); q.addColorStop(1, 'rgba(60,52,24,0)'); g.fillStyle = q; g.fillRect(x - r, y - r, r * 2, r * 2); }
   // the vein net: a midrib, ten pairs of laterals running out to the big teeth, and a fine net between them
   g.lineCap = h.lineCap = 'round';
   const lateral = (ctx, sd, f, w) => { const yb = y0 - f * len, hw = half(Math.min(.98, f + .1)); ctx.beginPath(); ctx.moveTo(x0, yb); ctx.quadraticCurveTo(x0 + sd * hw * .5, yb - len * .04, x0 + sd * hw * .97, yb - len * .13); ctx.lineWidth = w; ctx.stroke(); };
   ctx2(g, h, (ctx, isH) => {
    ctx.strokeStyle = isH ? hgt(.2, .9) : css(...P.d, .7); for (const f of lat) for (const sd of [-1, 1]) lateral(ctx, sd, f, (isH ? 9 : 7) * k);
    ctx.strokeStyle = isH ? hgt(.62, 1) : css(...P.v, .75); for (const f of lat) for (const sd of [-1, 1]) lateral(ctx, sd, f, 2.4 * k);
    ctx.strokeStyle = isH ? hgt(.15, 1) : css(...P.d, .75); ctx.lineWidth = 12 * k; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 - len * .97); ctx.stroke();
    ctx.strokeStyle = isH ? hgt(.72, 1) : css(...P.v, .92); ctx.lineWidth = 4.5 * k; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 - len * .97); ctx.stroke();
   });
   for (let i = 0; i < 700 * TS; i++) { // the fine net: short crooked links between laterals
    const f = rr(.08, .92), sd = rnd() < .5 ? -1 : 1, hw = half(f), x = x0 + sd * hw * rr(.1, .9), y = y0 - f * len, a = rr(-1, 1) + (rnd() < .5 ? 0 : PI / 2), l = rr(6, 18) * k;
    g.strokeStyle = css(...P.d, .3); g.lineWidth = 1.4 * k; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    h.strokeStyle = hgt(.35, .5); h.lineWidth = 2 * k; h.beginPath(); h.moveTo(x, y); h.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); h.stroke();
   }
   // a glossy band along one side of the midrib, and a dark, then pale, rim round the edge
   const sh = g.createLinearGradient(x0 - wid * .5, 0, x0 + wid * .5, 0); sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(.6, 'rgba(230,255,220,.08)'); sh.addColorStop(.72, 'rgba(255,255,255,0)'); g.fillStyle = sh; g.fillRect(ox, oy, S, S);
   if (cell === 3) { // dead: dark rot spreading from the edges, and holes eaten through it
    for (let i = 0; i < 60; i++) { const x = ox + rnd() * S, y = oy + rnd() * S, r = (8 + rnd() * 40) * k; g.fillStyle = rnd() < .6 ? 'rgba(46,30,16,.35)' : 'rgba(170,140,90,.18)'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
    g.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 14; i++) { const f = rr(.15, .85), x = x0 + (rnd() - .5) * half(f) * 1.4, y = y0 - f * len, r = rr(6, 22) * k; g.beginPath(); g.ellipse(x, y, r, r * rr(.6, 1.2), rnd() * 3, 0, TAU); g.fill(); } g.globalCompositeOperation = 'source-over';
   }
   g.restore(); h.restore();
   path(g); g.strokeStyle = css(...P.e, .9); g.lineWidth = 5 * k; g.stroke(); g.strokeStyle = css(...P.l, .5); g.lineWidth = 1.6 * k; g.stroke();
  }
  function ctx2(a, b, f) { f(a, false); f(b, true); }
  const t = tex(c); t.generateMipmaps = true;
  return { map: t, normal: dataTex(normalFrom(blur(hc, 1.2 * k), 2.6)) };
 })();

 // the flower: an atlas of two halves, each with its base at the bottom and its shape in the alpha. Left, a petal: broad,
 // crinkled like tissue, rose at its edge deepening to crimson and a near-black throat, veins fanning out of the throat.
 // Right, a sepal: felted wine-plum, a pale midrib, drawn out to a long point (its inside is the shader's crimson)
 const BLOOM = (() => {
  const S = 1024 * TS, k = TS, c = cvs(S * 2, S), g = c.getContext('2d'), hc = cvs(S * 2, S), h = hc.getContext('2d');
  h.fillStyle = hgt(.5); h.fillRect(0, 0, S * 2, S);
  const shape = (ctx, cx, wf) => { ctx.beginPath(); for (let i = 0; i <= 256; i++) { const f = i <= 128 ? i / 128 : (256 - i) / 128, sd = i <= 128 ? 1 : -1, x = cx + sd * wf(f, sd), y = S - 3 - f * (S - 8); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.closePath(); };
  const petal = (f, sd) => S * .47 * Math.pow(Math.sin(PI * (.06 + .94 * f)), .45) * (.35 + .65 * Math.sqrt(f)) + S * .008 * Math.sin(f * 60 + sd) + S * .012 * Math.sin(f * 17 + sd * 2);
  const sepal = (f) => S * .41 * Math.pow(Math.sin(PI * Math.min(1, .05 + f * .97)), .9) * (1 - .45 * Math.pow(f, 1.4));
  g.save(); shape(g, S / 2, petal); g.clip(); h.save(); shape(h, S / 2, petal); h.clip();
  let q = g.createRadialGradient(S / 2, S, 0, S / 2, S, S * .98); q.addColorStop(0, '#10010a'); q.addColorStop(.16, '#420516'); q.addColorStop(.42, '#801232'); q.addColorStop(.78, '#b23a5a'); q.addColorStop(1, '#d87892');
  g.fillStyle = q; g.fillRect(0, 0, S, S);
  // crinkles: long soft wavy ridges across the petal, like crumpled tissue
  for (let i = 0; i < 700; i++) { const x = rnd() * S, y = rnd() * S, a = (rnd() - .5) * .8, l = (30 + rnd() * 120) * k, w = (3 + rnd() * 9) * k, dk = rnd() < .5; g.fillStyle = dk ? 'rgba(60,6,24,.07)' : 'rgba(255,210,220,.06)'; g.beginPath(); g.ellipse(x, y, l, w, a, 0, TAU); g.fill(); h.fillStyle = hgt(dk ? .32 : .7, .25); h.beginPath(); h.ellipse(x, y, l, w, a, 0, TAU); h.fill(); }
  g.lineCap = h.lineCap = 'round';
  for (let i = 0; i < 90; i++) { const a = (i / 89 - .5) * 2.7, l = S * rr(.45, .97), w = rr(1.4, 3.6) * k, al = rr(.2, .5); const pts = []; for (let j = 0; j <= 12; j++) pts.push([S / 2 + Math.sin(a) * l * j / 12 + rr(-3, 3) * k, S - 4 - Math.cos(a * .72) * l * j / 12]);
   g.strokeStyle = 'rgba(56,2,18,' + al.toFixed(2) + ')'; g.lineWidth = w; g.beginPath(); pts.forEach((p, j) => (j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke();
   h.strokeStyle = hgt(.66, .6); h.lineWidth = w * 1.5; h.beginPath(); pts.forEach((p, j) => (j ? h.lineTo(p[0], p[1]) : h.moveTo(p[0], p[1]))); h.stroke(); }
  g.restore(); h.restore();
  g.save(); shape(g, S * 1.5, sepal); g.clip(); h.save(); shape(h, S * 1.5, sepal); h.clip();
  q = g.createLinearGradient(S, 0, S * 2, 0); q.addColorStop(0, '#3a1020'); q.addColorStop(.5, '#5e2236'); q.addColorStop(1, '#3a1020'); g.fillStyle = q; g.fillRect(S, 0, S, S);
  for (let i = 0; i < 9000 * TS; i++) { const x = S + rnd() * S, y = rnd() * S, l = (2 + rnd() * 6) * k, a = rnd() * TAU, dk = rnd() < .5; g.strokeStyle = dk ? 'rgba(16,4,8,.35)' : 'rgba(200,140,150,.15)'; g.lineWidth = k; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); h.fillStyle = hgt(dk ? .4 : .62, .4); h.fillRect(x, y, k * 1.5, k * 1.5); }
  g.strokeStyle = 'rgba(206,160,140,.55)'; g.lineWidth = 14 * k; g.beginPath(); g.moveTo(S * 1.5, S); g.quadraticCurveTo(S * 1.5 + 12 * k, S * .5, S * 1.5, 10); g.stroke();
  h.strokeStyle = hgt(.8, .8); h.lineWidth = 18 * k; h.beginPath(); h.moveTo(S * 1.5, S); h.quadraticCurveTo(S * 1.5 + 12 * k, S * .5, S * 1.5, 10); h.stroke();
  g.restore(); h.restore();
  shape(g, S * 1.5, sepal); g.strokeStyle = 'rgba(154,88,100,.7)'; g.lineWidth = 18 * k; g.stroke();
  return { map: tex(c), normal: dataTex(normalFrom(blur(hc, 1 * k), 2.4)) };
 })();

 // the soil under the mound: dark earth fading out, crumbs, pebbles, fallen leaves and bits of dead cane
 const soilMap = (() => {
  const S = 1024 * TS, k = TS, c = cvs(S, S), g = c.getContext('2d'), hh = S / 2;
  const q = g.createRadialGradient(hh, hh, 0, hh, hh, hh); q.addColorStop(0, 'rgba(30,22,16,.97)'); q.addColorStop(.42, 'rgba(40,30,20,.85)'); q.addColorStop(.78, 'rgba(48,36,24,.35)'); q.addColorStop(1, 'rgba(48,36,24,0)');
  g.fillStyle = q; g.fillRect(0, 0, S, S);
  g.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < 9000 * TS; i++) { const a = rnd() * TAU, r = Math.sqrt(rnd()) * hh, x = hh + Math.cos(a) * r, y = hh + Math.sin(a) * r; g.fillStyle = rnd() < .5 ? 'rgba(12,8,5,.5)' : 'rgba(100,80,56,.32)'; g.fillRect(x, y, (1 + rnd() * 2.5) * k, (1 + rnd() * 2.5) * k); }
  for (let i = 0; i < 120; i++) { const a = rnd() * TAU, r = Math.sqrt(rnd()) * hh * .85, x = hh + Math.cos(a) * r, y = hh + Math.sin(a) * r, s = (2 + rnd() * 6) * k; g.fillStyle = 'rgba(124,112,100,.7)'; g.beginPath(); g.ellipse(x, y, s, s * .7, rnd() * 3, 0, TAU); g.fill(); g.fillStyle = 'rgba(18,12,8,.5)'; g.beginPath(); g.ellipse(x + k, y + 1.5 * k, s, s * .5, 0, 0, Math.PI); g.fill(); }
  for (let i = 0; i < 110; i++) { const a = rnd() * TAU, r = (.3 + .6 * rnd()) * hh, x = hh + Math.cos(a) * r, y = hh + Math.sin(a) * r, s = (8 + rnd() * 12) * k; g.save(); g.translate(x, y); g.rotate(rnd() * TAU); g.fillStyle = rnd() < .5 ? 'rgba(112,80,44,.7)' : rnd() < .5 ? 'rgba(96,30,40,.6)' : 'rgba(60,78,40,.55)'; g.beginPath(); g.ellipse(0, 0, s, s * .45, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(30,18,10,.5)'; g.lineWidth = k; g.beginPath(); g.moveTo(-s, 0); g.lineTo(s, 0); g.stroke(); g.restore(); }
  for (let i = 0; i < 60; i++) { const a = rnd() * TAU, r = (.25 + .65 * rnd()) * hh, x = hh + Math.cos(a) * r, y = hh + Math.sin(a) * r, l = (14 + rnd() * 40) * k, b = rnd() * TAU; g.strokeStyle = rnd() < .5 ? 'rgba(120,108,96,.6)' : 'rgba(74,52,38,.7)'; g.lineWidth = 2 * k; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(b) * l, y + Math.sin(b) * l); g.stroke(); }
  return tex(c);
 })();
 // sprites: a soft dot, a dust puff, a curl of steam, a single falling leaflet and a tongue of flame (painted pale so
 // each particle can be tinted)
 function radial(stops, s) { const c = cvs(s, s), g = c.getContext('2d'), h = s / 2, gr = g.createRadialGradient(h, h, 0, h, h, h); for (const [o, col] of stops) gr.addColorStop(o, col); g.fillStyle = gr; g.fillRect(0, 0, s, s); return tex(c); }
 const dotT = radial([[0, 'rgba(255,255,255,1)'], [.22, 'rgba(255,255,255,.6)'], [.5, 'rgba(255,255,255,.12)'], [1, 'rgba(255,255,255,0)']], 64);
 const softPuff = (n, a, seedK) => { const c = cvs(128, 128), g = c.getContext('2d'); for (let i = 0; i < n; i++) { const x = 30 + rnd() * 68, y = 30 + rnd() * 68, r = 10 + rnd() * 26, q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, 'rgba(255,255,255,' + a + ')'); q.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = q; g.fillRect(0, 0, 128, 128); } const m = g.createRadialGradient(64, 64, 24, 64, 64, 63); m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)'); g.globalCompositeOperation = 'destination-in'; g.fillStyle = m; g.fillRect(0, 0, 128, 128); return tex(c); };
 const puffT = softPuff(30, .24), steamT = softPuff(46, .14);
 const leafT = (() => { const c = cvs(64, 64), g = c.getContext('2d'); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(32, 62); g.bezierCurveTo(6, 44, 10, 14, 32, 2); g.bezierCurveTo(54, 14, 58, 44, 32, 62); g.fill(); g.strokeStyle = 'rgba(150,150,150,.8)'; g.lineWidth = 2; g.beginPath(); g.moveTo(32, 60); g.lineTo(32, 6); g.stroke(); return tex(c); })();
 const flameT = (() => {
  const S = 128, c = cvs(S, S), g = c.getContext('2d');
  for (const [w, a] of [[30, .35], [20, .6], [11, 1]]) {
   g.beginPath(); g.moveTo(64, 6); g.bezierCurveTo(64 + w * .5, 40, 64 + w, 78, 64 + w * .7, 104); g.quadraticCurveTo(64, 128, 64 - w * .7, 104); g.bezierCurveTo(64 - w, 78, 64 - w * .5, 40, 64, 6);
   const q = g.createLinearGradient(0, 0, 0, S); q.addColorStop(0, 'rgba(255,255,255,0)'); q.addColorStop(.55, 'rgba(255,255,255,' + a * .7 + ')'); q.addColorStop(.85, 'rgba(255,255,255,' + a + ')'); q.addColorStop(1, 'rgba(255,255,255,' + a * .5 + ')');
   g.fillStyle = q; g.fill();
  }
  return tex(c);
 })();
 // the ground splitting, painted into three channels: red the fissure and the cracks off it, green the glowing root that
 // runs along the bottom of it, blue the lips of torn-up earth either side (the strip is about 1 m wide)
 const crackT = (() => {
  const W = 1024, H = 256, c = cvs(W, H), g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'lighter'; g.lineCap = g.lineJoin = 'round';
  const line = [], fork = [];
  for (let x = 0, y = H / 2; x <= W; x += 12) { y = cl(y + r2(-12, 12), H * .38, H * .62); line.push([x, y]); if (x > 60 && x < W - 100 && rnd2() < .3) fork.push([x, y]); }
  const stroke = (pts, col, w, oy) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1] + (oy || 0)) : g.moveTo(p[0], p[1] + (oy || 0)))); g.stroke(); };
  stroke(line, 'rgba(0,0,255,.35)', 44, -34); stroke(line, 'rgba(0,0,255,.35)', 44, 34);
  for (const [x, y] of fork) { const pts = [[x, y]]; let px = x, py = y; const a = (rnd2() < .5 ? -1 : 1) * r2(.6, 1.2); for (let i = 0; i < 6; i++) { px += 14 + rnd2() * 12; py += Math.sin(a) * (10 + rnd2() * 10); pts.push([px, py]); } stroke(pts, 'rgba(255,0,0,.75)', 10); stroke(pts, 'rgba(0,0,255,.2)', 22); }
  stroke(line, 'rgba(255,0,0,.6)', 56); stroke(line, 'rgba(255,0,0,.95)', 30);
  stroke(line, 'rgba(0,255,0,.45)', 20); stroke(line, 'rgba(0,255,0,1)', 7);
  return dataTex(c);
 })();
