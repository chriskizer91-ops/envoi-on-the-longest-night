
 // ---------- painted textures ----------
 // Every map is painted at one repeat; each part scales its own UVs to the repeat the game model gave it, so the stars,
 // braid and net sit at the same size on her as before.

 // velvet with embroidered stars: the coat (and sleeves and hood) and the hat. The game model's star cloth, painted four
 // times larger: the same number of stars to a tile, the same colours and sizes, now worked in thread (gold thread shines
 // as metal; the pink is silk), over velvet whose pile is crushed in soft patches and lies one way
 function VELVET(base, nStars, cols, rmin, rmax, seed) {
  const W = 1024 * TS, k = W / 256, P = pair(W, W, base, .5), g = P.g, h = P.h;
  const rmC = cvs(W, W), rm = rmC.getContext('2d'); rm.fillStyle = 'rgb(0,212,0)'; rm.fillRect(0, 0, W, W);
  // crushed pile: big soft patches lighter and darker, painted pixel by pixel over the base
  const n1 = noise2(6, seed), n2 = noise2(23, seed + 7), b = new THREE.Color(base);
  const pile = perPixel(W, W, (x, y, o) => {
   const u = x / W, v = y / W, n = n1(u, v) * .65 + n2(u, v) * .35, l = .84 + .3 * n;
   o[0] = b.r * 255 * l; o[1] = b.g * 255 * l; o[2] = b.b * 255 * l;
  });
  g.drawImage(pile, 0, 0);
  const hp = perPixel(W, W, (x, y, o) => { const v = (n2(x / W * 3 % 1, y / W * 3 % 1) - .5) * .1 + .5; o[0] = o[1] = o[2] = v * 255; });
  h.drawImage(hp, 0, 0);
  // the game model's flecks: dark and pale specks in the pile
  for (let i = 0; i < W * 4 / k; i++) { g.fillStyle = r2() < .55 ? 'rgba(20,0,12,0.10)' : 'rgba(255,200,230,0.05)'; g.fillRect(r2() * W, r2() * W, (1 + r2() * 4) * k * .7, (1 + r2() * 4) * k * .7); }
  // fine pile, lying one way: short strokes, a little lighter at their tips
  g.lineCap = 'round';
  for (let i = 0; i < 9000 * TS; i++) { const x = r2() * W, y = r2() * W, l = (3 + r2() * 6) * k * .5; g.strokeStyle = r2() < .5 ? 'rgba(0,0,0,.03)' : 'rgba(255,190,220,.018)'; g.lineWidth = .8 * k * .5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + l * .2, y + l); g.stroke(); }
  // the stars, embroidered: a raised star of thread, satin-stitched out along its four points, with a fine dark outline
  const thread = (col) => { const c = new THREE.Color(col); return [c.r * 255, c.g * 255, c.b * 255]; };
  for (let i = 0; i < nStars; i++) {
   const x = r2() * W, y = r2() * W, r = (rmin + r2() * (rmax - rmin)) * k, col = cols[(r2() * cols.length) | 0], t = thread(col), gold = col !== '#ff9fd0';
   tiled(W, W, (ox, oy) => {
    const X = x + ox, Y = y + oy;
    g.fillStyle = 'rgba(40,6,20,.55)'; star4(g, X, Y + r * .06, r * 1.12);
    g.fillStyle = col; star4(g, X, Y, r);
    // satin stitches: lines from the middle out along each point, alternately lighter and darker
    g.lineWidth = Math.max(.6, r * .07);
    for (let s = 0; s < 28; s++) {
     const a = s / 28 * TAU, rr2 = r * (.55 + .45 * Math.pow(Math.abs(Math.cos(2 * a)), 6));
     g.strokeStyle = s % 2 ? css(t[0] * .72, t[1] * .7, t[2] * .7, .7) : css(Math.min(255, t[0] * 1.15), Math.min(255, t[1] * 1.12), Math.min(255, t[2] * 1.1), .55);
     g.beginPath(); g.moveTo(X, Y); g.lineTo(X + Math.cos(a) * rr2 * .9, Y + Math.sin(a) * rr2 * .9); g.stroke();
    }
    h.fillStyle = hgt(.92); star4(h, X, Y, r);
    h.strokeStyle = hgt(.62, .8); h.lineWidth = Math.max(.6, r * .05);
    for (let s = 0; s < 14; s++) { const a = s / 14 * TAU; h.beginPath(); h.moveTo(X, Y); h.lineTo(X + Math.cos(a) * r * .8, Y + Math.sin(a) * r * .8); h.stroke(); }
    rm.fillStyle = gold ? 'rgb(0,92,230)' : 'rgb(0,118,0)'; star4(rm, X, Y, r);
   });
  }
  // the game model's glints: tiny beads of the same threads
  for (let i = 0; i < nStars * 4; i++) {
   const x = r2() * W, y = r2() * W, col = cols[(r2() * cols.length) | 0], s = 1.3 * k * .8, a = .35 + r2() * .6;
   g.globalAlpha = a; g.fillStyle = col; g.beginPath(); g.arc(x, y, s, 0, TAU); g.fill(); g.globalAlpha = 1;
   h.fillStyle = hgt(.85, a); h.beginPath(); h.arc(x, y, s, 0, TAU); h.fill();
   rm.fillStyle = col !== '#ff9fd0' ? 'rgb(0,80,210)' : 'rgb(0,100,0)'; rm.beginPath(); rm.arc(x, y, s, 0, TAU); rm.fill();
  }
  return { map: tex(P.c), normal: dataTex(normalFrom(blur(P.hc, .6 * k * .5), 2.4)), rm: dataTex(rmC) };
 }
 const COATV = VELVET('#8e2a57', 38, ['#f2c15a', '#e8a93e', '#ff9fd0'], 1.5, 4.5, 31);
 const HATV = VELVET('#7c1d4f', 16, ['#f2c15a', '#e8a93e'], 2, 5, 57);

 // the trim: the game model's ribbon (burgundy, a gold band along it, a row of gold blocks, a dark lower edge), woven:
 // a twill ribbon, the band a twisted gold cord, the blocks satin-stitched in two golds
 const TRIM = (() => {
  const W = 512 * TS, H = 64 * TS, k = W / 256, P = pair(W, H, '#5c1238', .45), g = P.g, h = P.h;
  const rmC = cvs(W, H), rm = rmC.getContext('2d'); rm.fillStyle = 'rgb(0,150,0)'; rm.fillRect(0, 0, W, H);
  g.lineWidth = h.lineWidth = .7 * k;
  for (let x = -H; x < W + H; x += 2.2 * k) { g.strokeStyle = 'rgba(20,0,10,.25)'; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + H * .5, H); g.stroke(); h.strokeStyle = hgt(.35, .6); h.beginPath(); h.moveTo(x, 0); h.lineTo(x + H * .5, H); h.stroke(); }
  // the cord: short slanted twists along a gold band
  g.fillStyle = '#e8ad48'; g.fillRect(0, 2 * k, W, 4 * k); h.fillStyle = hgt(.86); h.fillRect(0, 2 * k, W, 4 * k); rm.fillStyle = 'rgb(0,90,220)'; rm.fillRect(0, 2 * k, W, 4 * k);
  for (let x = 0; x < W; x += 2 * k) {
   g.strokeStyle = 'rgba(120,70,10,.75)'; g.lineWidth = .7 * k; g.beginPath(); g.moveTo(x, 2 * k); g.lineTo(x + 2 * k, 6 * k); g.stroke();
   g.strokeStyle = 'rgba(255,236,170,.6)'; g.lineWidth = .45 * k; g.beginPath(); g.moveTo(x + .6 * k, 2 * k); g.lineTo(x + 2.4 * k, 5.6 * k); g.stroke();
   h.strokeStyle = hgt(.55); h.lineWidth = .6 * k; h.beginPath(); h.moveTo(x, 2 * k); h.lineTo(x + 2 * k, 6 * k); h.stroke();
  }
  // the blocks, each satin-stitched across, alternately pale and deep gold
  for (let i = 0; i < 16; i++) {
   const x = (i * 16 + 4) * k, y = 15 * k, w = 8 * k, hh = 6 * k;
   g.fillStyle = i % 2 ? '#f7d68d' : '#e0a33c'; g.fillRect(x, y, w, hh);
   h.fillStyle = hgt(.9); h.fillRect(x, y, w, hh); rm.fillStyle = 'rgb(0,84,225)'; rm.fillRect(x, y, w, hh);
   for (let s = 0; s <= w; s += .9 * k) { g.fillStyle = 'rgba(110,60,10,.35)'; g.fillRect(x + s, y, .35 * k, hh); h.fillStyle = hgt(.7, .8); h.fillRect(x + s, y, .35 * k, hh); }
   g.strokeStyle = 'rgba(60,20,10,.6)'; g.lineWidth = .5 * k; g.strokeRect(x, y, w, hh);
  }
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 27 * k, W, 5 * k); h.fillStyle = hgt(.3); h.fillRect(0, 28 * k, W, 4 * k);
  return { map: tex(P.c), normal: dataTex(normalFrom(blur(P.hc, .4 * k), 2.2)), rm: dataTex(rmC) };
 })();

 // the dress: the game model's black tulle with warm glints, painted as a fine net with sequins caught in it (the light
 // catching single threads is the shader's)
 const DRESS = (() => {
  const W = 1024 * TS, k = W / 256, P = pair(W, W, '#1f171c', .5), g = P.g, h = P.h;
  for (let i = 0; i < W * 2 / k; i++) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(r2() * W, r2() * W, (2 + r2() * 3) * k * .8, (2 + r2() * 3) * k * .8); }
  // the net: a hexagonal mesh of fine threads
  const cell = 7 * k * .5; g.strokeStyle = 'rgba(70,52,62,.35)'; h.strokeStyle = hgt(.72, .7); g.lineWidth = h.lineWidth = .55 * k * .5;
  for (let y = 0, row = 0; y < W + cell; y += cell * .866, row++) for (let x = (row % 2) * cell * .5; x < W + cell; x += cell) {
   for (const ctx of [g, h]) { ctx.beginPath(); ctx.arc(x, y, cell * .5, 0, TAU); ctx.stroke(); }
  }
  // the game model's 1600 glints, now sequins: a round disc, bright on one side
  const em = cvs(W, W), e = em.getContext('2d'); e.fillStyle = '#000'; e.fillRect(0, 0, W, W);
  for (let i = 0; i < 1000; i++) {
   const x = r2() * W, y = r2() * W, b = 70 + r2() * 120, r = (r2() < .75 ? .6 : .9) * k * .75;
   const col = `rgb(${b | 0},${(b * .82) | 0},${(b * .74) | 0})`;
   g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
   e.fillStyle = col; e.beginPath(); e.arc(x, y, r, 0, TAU); e.fill();
   h.fillStyle = hgt(.9); h.beginPath(); h.arc(x, y, r, 0, TAU); h.fill();
  }
  return { map: tex(P.c), emis: tex(em), normal: dataTex(normalFrom(blur(P.hc, .5), 1.6)) };
 })();

 // satin with glints (the sash, grey with white glints) and the hat band (brown, warm glints, made furry by its shells)
 function SATIN(base, n, warm, seed) {
  const W = 512 * TS, k = W / 128, P = pair(W, W, base, .5), g = P.g, h = P.h, nz = noise2(5, seed);
  const b = new THREE.Color(base);
  g.drawImage(perPixel(W, W, (x, y, o) => { const l = .86 + .28 * nz(x / W, y / W); o[0] = b.r * 255 * l; o[1] = b.g * 255 * l; o[2] = b.b * 255 * l; }), 0, 0);
  for (let i = 0; i < W * 2 / k; i++) { g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(r2() * W, r2() * W, (2 + r2() * 3) * k * .7, (2 + r2() * 3) * k * .7); }
  const em = cvs(W, W), e = em.getContext('2d'); e.fillStyle = '#000'; e.fillRect(0, 0, W, W);
  for (let i = 0; i < n; i++) {
   const x = r2() * W, y = r2() * W, bb = 110 + r2() * 145, s = (r2() < .75 ? .55 : .9) * k * .7;
   const col = warm ? `rgb(${bb | 0},${(bb * .82) | 0},${(bb * .74) | 0})` : `rgb(${bb | 0},${bb | 0},${bb | 0})`;
   for (const ctx of [g, e]) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); ctx.fill(); }
  }
  // a fine weave
  h.strokeStyle = hgt(.62, .5); h.lineWidth = .5 * k * .4; for (let x = 0; x < W; x += 1.6 * k * .5) { h.beginPath(); h.moveTo(x, 0); h.lineTo(x, W); h.stroke(); }
  return { map: tex(P.c), emis: tex(em), normal: dataTex(normalFrom(blur(P.hc, .5), 1.2)) };
 }
 const SASH = SATIN('#4d4248', 700, false, 11);
 const BAND = SATIN('#3a2422', 500, true, 13);

 // the bodice: the game model's diamond net (eight diamonds to a tile), knotted where its threads cross
 const NET = (() => {
  const W = 512 * TS, k = W / 64, P = pair(W, W, '#1b141b', .3), g = P.g, h = P.h;
  const line = (ctx, x0, y0, x1, y1) => { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); };
  for (let pass = 0; pass < 2; pass++) for (let q = -W; q <= W * 2; q += 8 * k) {
   g.lineWidth = (pass ? .4 : .95) * k; g.strokeStyle = pass ? 'rgba(200,180,190,.25)' : 'rgba(150,128,140,0.55)';
   line(g, q, 0, q + W, W); line(g, q, W, q + W, 0);
   if (!pass) { h.lineWidth = 1.3 * k; h.strokeStyle = hgt(.85); line(h, q, 0, q + W, W); line(h, q, W, q + W, 0); }
  }
  for (let x = 0; x <= W; x += 4 * k) for (let y = 0; y <= W; y += 4 * k) {
   if (((x + y) / (4 * k)) % 2) continue;
   g.fillStyle = 'rgba(166,146,156,.6)'; g.beginPath(); g.arc(x, y, .75 * k, 0, TAU); g.fill();
   h.fillStyle = hgt(1); h.beginPath(); h.arc(x, y, 1 * k, 0, TAU); h.fill();
  }
  for (let i = 0; i < 60; i++) { const b = 150 + r2() * 105; g.fillStyle = `rgb(${b | 0},${(b * 0.85) | 0},${(b * 0.8) | 0})`; g.fillRect(r2() * W, r2() * W, k * .6, k * .6); }
  return { map: tex(P.c), normal: dataTex(normalFrom(blur(P.hc, .4 * k), 2.6)) };
 })();

 // leather: her boots and the dagger's grip. Pebbled grain, creases where it bends, worn paler on the edges of the creases
 const LEATHER = (() => {
  const W = 1024 * TS, P = pair(W, W, '#2e1f22', .5), g = P.g, h = P.h, k = W / 256;
  const n1 = noise2(9, 3), n2 = noise2(64, 5), n3 = noise2(150, 9);
  g.drawImage(perPixel(W, W, (x, y, o) => { const u = x / W, v = y / W, l = .8 + .35 * n1(u, v) + .12 * (n2(u, v) - .5); o[0] = 46 * l; o[1] = 31 * l; o[2] = 34 * l; }), 0, 0);
  h.drawImage(perPixel(W, W, (x, y, o) => { const u = x / W, v = y / W, p = n3(u, v), q = n2(u, v); const c = Math.pow(Math.abs(p - .5) * 2, .6); o[0] = o[1] = o[2] = (.35 + .4 * c + .15 * q) * 255; }), 0, 0);
  // creases: wandering lines across, in bunches, each a dark groove with a pale worn lip
  g.lineCap = h.lineCap = 'round';
  for (let i = 0; i < 70; i++) {
   const y0 = r2() * W, x0 = r2() * W, len = (40 + r2() * 160) * k * .5, amp = (2 + r2() * 4) * k * .5;
   const pts = []; for (let s = 0; s <= 12; s++) pts.push([x0 + s / 12 * len, y0 + Math.sin(s * .9 + i) * amp]);
   const path = (ctx, dy) => { ctx.beginPath(); pts.forEach((p, j) => (j ? ctx.lineTo(p[0], p[1] + dy) : ctx.moveTo(p[0], p[1] + dy))); ctx.stroke(); };
   for (const ox of [0, -W]) {
    g.save(); g.translate(ox, 0); g.strokeStyle = 'rgba(10,4,6,.45)'; g.lineWidth = 1.4 * k * .5; path(g, 0); g.strokeStyle = 'rgba(120,96,96,.18)'; g.lineWidth = 1.2 * k * .5; path(g, -1.5 * k * .5); g.restore();
    h.save(); h.translate(ox, 0); h.strokeStyle = hgt(.05, .8); h.lineWidth = 1.6 * k * .5; path(h, 0); h.strokeStyle = hgt(.8, .5); h.lineWidth = 1.4 * k * .5; path(h, -1.6 * k * .5); h.restore();
   }
  }
  const rmC = perPixel(W, W, (x, y, o) => { o[0] = 0; o[1] = (.42 + .3 * n1(x / W * 2 % 1, y / W * 2 % 1)) * 255; o[2] = 0; });
  return { map: tex(P.c), normal: dataTex(normalFrom(blur(P.hc, .5), 2.8)), rm: dataTex(rmC) };
 })();

 // horn: fine growth lines across it, between the ridges the geometry makes
 const HORN = (() => {
  const W = 512 * TS, H = 128 * TS, P = pair(W, H, '#e9cfa4', .5), g = P.g, h = P.h;
  for (let i = 0; i < 260; i++) {
   const x = r2() * W, w = .5 + r2() * 1.5, a = .05 + r2() * .12;
   g.fillStyle = r2() < .5 ? `rgba(120,90,60,${a})` : `rgba(255,248,230,${a})`; g.fillRect(x, 0, w, H);
   h.fillStyle = hgt(r2() < .5 ? .35 : .65, .5); h.fillRect(x, 0, w * 1.3, H);
  }
  for (let i = 0; i < 400 * TS; i++) { g.fillStyle = 'rgba(140,110,80,.08)'; g.fillRect(r2() * W, r2() * H, 2 + r2() * 12, .6); }
  return { map: tex(P.c), normal: dataTex(normalFrom(blur(P.hc, .6), 2)) };
 })();

 // the iris: the game model's amber-brown eye, at four times its resolution: fibres, a darker rim, the lid's shadow over
 // its top and a warm glow low in it, round a deep pupil
 const IRIS = (() => {
  const S = 512 * TS, k = S / 128, c = cvs(S, S), g = c.getContext('2d'), m = S / 2;
  let gr = g.createRadialGradient(m, m + 8 * k, 4 * k, m, m, m);
  gr.addColorStop(0, '#d8a060'); gr.addColorStop(0.45, '#9a5a2a'); gr.addColorStop(0.8, '#5a2f16'); gr.addColorStop(1, '#241208');
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 700; i++) {
   const a = r2() * TAU, r0 = (14 + r2() * 6) * k, r1 = (30 + r2() * 30) * k;
   g.strokeStyle = r2() < .5 ? 'rgba(255,215,160,0.2)' : 'rgba(40,16,4,0.26)'; g.lineWidth = (.3 + r2() * .6) * k;
   g.beginPath(); g.moveTo(m + Math.cos(a) * r0, m + Math.sin(a) * r0); g.quadraticCurveTo(m + Math.cos(a + .08) * (r0 + r1) * .5, m + Math.sin(a + .08) * (r0 + r1) * .5, m + Math.cos(a) * r1, m + Math.sin(a) * r1); g.stroke();
  }
  // the collarette, a ragged ring round the pupil, and a few dark crypts
  g.strokeStyle = 'rgba(255,200,130,.35)'; g.lineWidth = 2 * k; g.beginPath(); for (let i = 0; i <= 90; i++) { const a = i / 90 * TAU, r = (25 + 2.5 * Math.sin(a * 13) + 1.5 * Math.sin(a * 29)) * k; i ? g.lineTo(m + Math.cos(a) * r, m + Math.sin(a) * r) : g.moveTo(m + Math.cos(a) * r, m + Math.sin(a) * r); } g.stroke();
  for (let i = 0; i < 40; i++) { const a = r2() * TAU, r = (30 + r2() * 26) * k; g.fillStyle = 'rgba(30,10,2,.3)'; g.beginPath(); g.ellipse(m + Math.cos(a) * r, m + Math.sin(a) * r, 2.2 * k, 1 * k, a, 0, TAU); g.fill(); }
  gr = g.createLinearGradient(0, 0, 0, S * 0.58); gr.addColorStop(0, 'rgba(20,6,2,0.85)'); gr.addColorStop(1, 'rgba(20,6,2,0)');
  g.fillStyle = gr; g.fillRect(0, 0, S, S * 0.58);
  gr = g.createRadialGradient(m, S * 0.84, 2 * k, m, S * 0.84, S * 0.38); gr.addColorStop(0, 'rgba(255,200,130,0.65)'); gr.addColorStop(1, 'rgba(255,200,130,0)');
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  g.fillStyle = '#120804'; g.beginPath(); g.ellipse(m, m + 3 * k, 16 * k, 21 * k, 0, 0, TAU); g.fill();
  gr = g.createRadialGradient(m, m, m - 9 * k, m, m, m); gr.addColorStop(0, 'rgba(22,8,3,0)'); gr.addColorStop(.5, 'rgba(22,8,3,.95)'); gr.addColorStop(1, 'rgba(22,8,3,1)');
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  return tex(c);
 })();

 // her face's skin, in the head's own sphere UVs: her skin tone, the blush she always wears (the game model's two pink
 // discs, now in the skin, soft at their edges), a warmer nose tip, and a faint unevenness, with pores in its relief
 const FACE = (() => {
  const W = 1024 * TS, H = 512 * TS, base = new THREE.Color('#f0b894'), blush = new THREE.Color('#ff8a8a'), shade = new THREE.Color('#eaa585');
  const nz = noise2(24, 21), nz2 = noise2(90, 23);
  const az0 = (x) => { const ph = x / W * TAU; return Math.atan2(-Math.cos(ph), Math.sin(ph)); };
  const c = perPixel(W, H, (x, y, o) => {
   const th = y / H * PI, el = PI / 2 - th, az = az0(x);
   let r = base.r, gg = base.g, b = base.b;
   const v = (nz(x / W, y / H) - .5) * .05; r += v; gg += v * .8; b += v * .7;
   // blush: a soft oval on each cheek
   for (const sd of [-1, 1]) {
    const dx = (az - sd * .56) * Math.cos(el) / .175, dy = (el + .3) / .094, d = Math.hypot(dx, dy), a = .4 * (1 - sm(.2, 1.35, d));
    r = lerp(r, blush.r, a); gg = lerp(gg, blush.g, a); b = lerp(b, blush.b, a);
   }
   // the nose tip, warmer
   { const d = Math.hypot(az * Math.cos(el) / .06, (el + .245) / .05), a = .55 * (1 - sm(.3, 1.2, d)); r = lerp(r, shade.r, a); gg = lerp(gg, shade.g, a); b = lerp(b, shade.b, a); }
   // a little warmth under the brows and round the jaw, where skin is thinner and in shade
   { const a = .18 * sm(-.55, -.85, el) + .08 * sm(.5, .9, Math.abs(az) / 1.6); r = lerp(r, shade.r * .95, a); gg = lerp(gg, shade.g * .9, a); b = lerp(b, shade.b * .9, a); }
   o[0] = cl(r, 0, 1) * 255; o[1] = cl(gg, 0, 1) * 255; o[2] = cl(b, 0, 1) * 255;
  });
  const hc = perPixel(W, H, (x, y, o) => { const p = nz2(x / W, y / H); o[0] = o[1] = o[2] = (.5 + .5 * (p - .5) + (r2() - .5) * .18) * 255; });
  return { map: tex(c), normal: dataTex(normalFrom(blur(hc, .6), 1.2)) };
 })();
 // skin elsewhere (neck, arms, legs, hands): pores only
 const SKIN = (() => {
  const W = 256 * TS, nz = noise2(40, 41);
  const hc = perPixel(W, W, (x, y, o) => { o[0] = o[1] = o[2] = (.5 + .45 * (nz(x / W, y / W) - .5) + (r2() - .5) * .25) * 255; });
  return dataTex(normalFrom(blur(hc, .6), 1.4), 1, 1);
 })();

 // the dagger's blade: steel with a crescent and a line of small stars engraved down its middle (u along the blade, v across)
 const BLADE = (() => {
  const W = 512 * TS, H = 128 * TS, P = pair(W, H, '#c8c8d2', .6), g = P.g, h = P.h, k = W / 512;
  for (let i = 0; i < 900 * TS; i++) { const y = r2() * H, x = r2() * W, l = 20 + r2() * 90; g.fillStyle = r2() < .5 ? 'rgba(255,255,255,.08)' : 'rgba(60,60,80,.08)'; g.fillRect(x, y, l * k, .7); h.fillStyle = hgt(r2() < .5 ? .66 : .54, .5); h.fillRect(x, y, l * k, .7); }
  g.strokeStyle = 'rgba(40,40,60,.75)'; h.strokeStyle = hgt(.05); g.lineWidth = h.lineWidth = 2.2 * k;
  for (const ctx of [g, h]) { ctx.beginPath(); ctx.arc(70 * k, H / 2, 26 * k, PI * .2, PI * 1.8); ctx.arc(84 * k, H / 2 - 6 * k, 22 * k, PI * 1.75, PI * .25, true); ctx.closePath(); ctx.stroke(); }
  for (let i = 0; i < 6; i++) { const x = (130 + i * 52) * k, r = (9 - i) * k; g.fillStyle = 'rgba(40,40,60,.7)'; star4(g, x, H / 2, r); h.fillStyle = hgt(.08); star4(h, x, H / 2, r); }
  for (const ctx of [g, h]) { ctx.beginPath(); for (let x = 110 * k; x < W * .86; x += 3 * k) { const y = H / 2 + Math.sin(x / (18 * k)) * 14 * k; x === 110 * k ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.lineWidth = 1.2 * k; ctx.stroke(); }
  const rmC = cvs(W, H), rm = rmC.getContext('2d'); rm.fillStyle = 'rgb(0,52,255)'; rm.fillRect(0, 0, W, H);
  rm.globalCompositeOperation = 'source-over'; rm.drawImage(P.hc, 0, 0); // the engraving darker in G (rougher)
  const d = rm.getImageData(0, 0, W, H); for (let i = 0; i < d.data.length; i += 4) { const e = d.data[i] < 60; d.data[i] = 0; d.data[i + 1] = e ? 170 : 52; d.data[i + 2] = 255; } rm.putImageData(d, 0, 0);
  return { map: tex(P.c), normal: dataTex(normalFrom(blur(P.hc, .5), 3)), rm: dataTex(rmC) };
 })();

 // crushed velvet for the scrunchie
 const CRUSH = (() => {
  const W = 256 * TS, nz = noise2(12, 61), nz2 = noise2(31, 67);
  const hc = perPixel(W, W, (x, y, o) => { const u = x / W, v = y / W; o[0] = o[1] = o[2] = (.5 + .5 * Math.sin((u * 3 + nz(u, v) * 1.5) * TAU) * .5 + (nz2(u, v) - .5) * .4) * 255; });
  return dataTex(normalFrom(blur(hc, .8), 2.5));
 })();
