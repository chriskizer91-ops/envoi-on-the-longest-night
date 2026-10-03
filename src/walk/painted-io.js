// painted-io.js: Io walking the ground maps as Chris's Path Polish paints her (follow-me-down-witch-way,
// versions/path-polish/game: art/witch-walk-hd-v1.png, src/sprites.js and src/motion.js). Her painted walk sheet has
// six steps in each of four directions; in code her cape ripples behind her, she leans into her walk and into a turn,
// and she breathes when she stands. Two of Path Polish's painted poses are for doing things: kneeling to gather, and
// casting moonlight. The battles keep her 3D model; this is only her walk.
// The sheet ships at 3/4 size (art/walk/io-walk.webp, 1152 x 768); every measure below is the original 1536 x 1024's,
// scaled to whatever size loads. Her figure is about 250 art px tall, on the sheet and in the poses alike.
// makePaintedIo(src) -> { ready, h, draw(g, x, y, k, s) }
//   src(path) -> the image's URL; ready: a promise, resolved once the art is in (draw does nothing before)
//   draw: x, y: her feet on the canvas; k: canvas px per art px (her height on the canvas / h)
//   s: { dir: 'n' | 's' | 'e' | 'w', walk: how far she has walked (in her heights), moving, t: seconds,
//        lean, turn: -1 to 1 (her motion's), pose: null | 'kneel' | 'cast', poseP: 0 to 1 through the pose }
// Defines window.makePaintedIo.
(function () {
  'use strict';
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const ease = (v) => { const t = clamp01(v); return t * t * (3 - 2 * t); };
  // each row's window on the sheet: the poses cross a few cell edges, so the rows follow the transparent gaps; floor is
  // where her feet stand
  const ROWS = { s: { y: 0, h: 261, floor: 257 }, w: { y: 261, h: 251, floor: 504 }, e: { y: 512, h: 249, floor: 758 }, n: { y: 761, h: 263, floor: 1009 } };
  const CELL = 256, SHEET_W = 1536;
  // Path Polish draws her at .31 of the art, so its motion's measures (the breath, the ripple, the shadow) are in those
  // pixels; L turns them into art px
  const L = 1 / 0.31;
  // the walk: one frame for every 1/6.4 of her height walked (Path Polish: ten frames a second at 125 px a second, for
  // her 80 px), six frames a stride
  const FRAMES_PER_HEIGHT = 6.4;
  // the poses' canvases (384 x 320) put her feet at (192, 317)
  const POSE = { kneel: 'art/walk/io-kneel.png', cast: 'art/walk/io-cast.png' };

  function makePaintedIo(src) {
    const im = {};
    const load = (key, path) => new Promise((res) => { const i = new Image(); i.onload = () => { im[key] = i; res(); }; i.onerror = () => res(); i.src = src(path); });
    const ready = Promise.all([load('walk', 'art/walk/io-walk.webp'), load('kneel', POSE.kneel), load('cast', POSE.cast)]);

    // a pose blends in and out over its first and last 18% (Path Polish's gatherWeight)
    const weight = (p) => (Number.isFinite(p) ? ease(p / 0.18) * ease((1 - p) / 0.18) : 1);

    function walkPose(g, img, dir, frame, k, s, crouch) {
      const r = ROWS[dir] || ROWS.s, q = img.naturalWidth / SHEET_W; // sheet px per original px
      const sx = frame * CELL * q, sy = r.y * q, sw = CELL * q, sh = r.h * q;
      const phase = s.walk * 0.64 * Math.PI * 2 / 0.56; // Path Polish's phase, from her walked distance
      const breath = (s.moving ? Math.abs(Math.sin(phase)) * 0.25 : Math.sin(s.t * 2) * 0.35) * L * k;
      const hk = 1 - crouch * 0.035;
      const top = -(r.floor - r.y) * k * hk + breath, height = r.h * k * hk - breath;
      const left = -CELL / 2 * k, width = CELL * k;
      // the cape's middle ripples a little behind her; her face and her planted boots stay put. The sprite is drawn in
      // bands, each clipped, so the ripple needs no resampling seams.
      const bands = 18;
      for (let b = 0; b < bands; b++) {
        const v = (b + 0.5) / bands;
        const cape = v > 0.36 && v < 0.85 ? Math.sin((v - 0.36) / 0.49 * Math.PI) : 0;
        const ripple = cape * Math.sin((s.moving ? phase : s.t * 1.6) - v * 3) * (s.moving ? 0.4 : 0.15) * L * k;
        const y0 = top + height * b / bands, y1 = top + height * (b + 1) / bands;
        g.save(); g.beginPath(); g.rect(left - 2 * L * k, y0, width + 4 * L * k, y1 - y0); g.clip();
        g.drawImage(img, sx, sy, sw, sh, left + ripple, top, width, height);
        g.restore();
      }
    }
    function poseImage(g, img, k) { g.drawImage(img, -192 * k, -317 * k, img.naturalWidth * k, img.naturalHeight * k); }

    function draw(g, x, y, k, s) {
      const walkImg = im.walk; if (!walkImg) return;
      const pose = s.pose && im[s.pose] ? s.pose : null;
      const w = pose ? weight(s.poseP) : 0;
      g.save();
      // her shadow stays at her feet, whatever the pose
      g.fillStyle = 'rgba(16,9,31,0.44)'; g.beginPath(); g.ellipse(x, y + L * k, (11 + (pose === 'kneel' ? w * 4 : 0)) * L * k, 3.5 * L * k, 0, 0, Math.PI * 2); g.fill();
      g.translate(x, y);
      // a lean pivots at her feet, never at the middle of the picture
      g.rotate((Math.max(-1, Math.min(1, s.lean || 0)) * 0.014 + Math.max(-1, Math.min(1, s.turn || 0)) * 0.008) * (1 - w));
      g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      if (pose) {
        // the standing frame fades into the pose and back, both on the same feet
        if (w < 1) { g.save(); g.globalAlpha *= 1 - w; walkPose(g, walkImg, s.dir, 1, k, Object.assign({}, s, { moving: false }), pose === 'kneel' ? w : 0); g.restore(); }
        if (w > 0) { g.save(); g.globalAlpha *= w; poseImage(g, im[pose], k); g.restore(); }
      } else {
        const frame = s.moving ? Math.floor(Math.max(0, s.walk) * FRAMES_PER_HEIGHT) % 6 : 1;
        walkPose(g, walkImg, s.dir, frame, k, s, 0);
      }
      g.restore();
    }
    return { ready, h: 250, draw, get loaded() { return !!im.walk; } };
  }
  window.makePaintedIo = makePaintedIo;
})();
